import type { Card, Parallel } from "@prisma/client";
import { buildUserCardPersistData, resolveCatalogSerial } from "@/lib/card-serial";
import { prisma } from "@/lib/db";
import { cardInclude, toCardDTO } from "@/lib/mappers";
import { loadProductConfig, type HitPool, type LoadedProductConfig } from "@/lib/product-config";
import type {
  BoxSummaryDTO,
  Celebration,
  GuaranteeResultDTO,
  PackResultDTO,
  PullResultDTO,
} from "@/lib/types";

type CardRow = Parameters<typeof toCardDTO>[0];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickWeighted<T extends { weight: number }>(items: T[], rng: () => number): T {
  const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
  if (total <= 0) return items[items.length - 1];
  let roll = rng() * total;
  for (const item of items) {
    roll -= Math.max(0, item.weight);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function shuffleInPlace<T>(arr: T[], rng: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function celebrationFor(
  rarity: string,
  cardType: string,
  printRun: number | null,
): Celebration {
  if (rarity === "LEGENDARY" || printRun === 1 || cardType === "ONE_OF_ONE") return "jackpot";
  if (
    cardType.includes("AUTOGRAPH") ||
    cardType.includes("PATCH") ||
    cardType === "BOOKLET" ||
    cardType === "CASE_HIT" ||
    cardType === "IMAGE_VARIATION" ||
    rarity === "MYTHIC"
  )
    return "hit";
  if (rarity === "ULTRA_RARE" || rarity === "RARE") return "foil";
  if (rarity === "UNCOMMON") return "glow";
  return "none";
}

export function isHit(rarity: string, cardType: string, printRun: number | null) {
  return (
    rarity === "ULTRA_RARE" ||
    rarity === "MYTHIC" ||
    rarity === "LEGENDARY" ||
    Boolean(printRun) ||
    cardType.includes("AUTOGRAPH") ||
    cardType.includes("PATCH") ||
    cardType.includes("RELIC") ||
    cardType === "CASE_HIT" ||
    cardType === "IMAGE_VARIATION" ||
    cardType === "BOOKLET" ||
    cardType === "ONE_OF_ONE"
  );
}

function serialFor(
  card: Card & {
    assignedSerial: number | null;
    numbering: { printRun: number } | null;
    parallel: Parallel;
  },
) {
  const printRun = card.numbering?.printRun ?? card.parallel.printRun;
  const resolved = resolveCatalogSerial({
    assignedSerial: card.assignedSerial,
    printRun,
    stableId: card.id,
  });
  if (!resolved) {
    return { serialNumber: null as number | null, serialDisplay: null as string | null };
  }
  return resolved;
}

function toPull(card: CardRow, serialDisplay: string | null): PullResultDTO {
  const dto = toCardDTO(card);
  return {
    card: dto,
    serialDisplay: serialDisplay ?? dto.serialDisplay,
    isHit: isHit(dto.rarity, dto.cardType, dto.printRun),
    celebration: celebrationFor(dto.rarity, dto.cardType, dto.printRun),
  };
}

const RARITY_RANK: Record<string, number> = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  ULTRA_RARE: 3,
  MYTHIC: 4,
  LEGENDARY: 5,
};

type PoolMap = Record<HitPool, CardRow[]>;

async function loadProductPool(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      oddsRules: true,
      sets: {
        include: {
          parallels: true,
          checklistEntries: {
            include: {
              cards: {
                include: cardInclude,
              },
            },
          },
        },
      },
    },
  });
  if (!product) return null;

  const allCards = product.sets.flatMap((set) =>
    set.checklistEntries.flatMap((entry) => entry.cards),
  );

  const config = loadProductConfig(product.slug);
  const pools = buildPools(allCards, config);

  return { product, allCards, config, pools };
}

function resolveCardPool(
  card: CardRow,
  config: LoadedProductConfig | null,
): HitPool | null {
  const setSlug = card.checklistEntry.cardSet.slug;
  const parallelSlug = card.parallel.slug;
  const cardType = card.parallel.cardType;

  if (config) {
    // Prefer parallel-specific pool (base rainbow + insert numbered variants)
    const keyed = config.parallelPoolBySlug[`${setSlug}:${parallelSlug}`];
    if (keyed) return keyed;
    const parallelPool = config.parallelPoolBySlug[parallelSlug];
    if (parallelPool) return parallelPool;
    const setPool = config.setPoolBySlug[setSlug];
    if (setPool) return setPool;
  }

  if (parallelSlug === "base") return "base";
  if (parallelSlug === "refractor") return "refractor";
  if (parallelSlug === "pulsar") return "pulsar";
  if (card.parallel.printRun || card.numbering?.printRun) {
    if (!cardType.includes("AUTOGRAPH") && cardType !== "INSERT" && cardType !== "CASE_HIT" && cardType !== "BOOKLET" && !cardType.includes("PATCH")) {
      return "numbered";
    }
  }
  if (cardType === "INSERT") return "insert";
  if (cardType.includes("AUTOGRAPH")) return "autograph";
  if (cardType.includes("PATCH") || cardType.includes("RELIC")) return "patch";
  if (cardType === "BOOKLET") return "booklet";
  if (cardType === "CASE_HIT" || cardType === "IMAGE_VARIATION") return "case_hit";
  return null;
}

function buildPools(allCards: CardRow[], config: LoadedProductConfig | null): PoolMap {
  const pools: PoolMap = {
    base: [],
    refractor: [],
    pulsar: [],
    numbered: [],
    insert: [],
    autograph: [],
    patch: [],
    booklet: [],
    case_hit: [],
  };

  for (const card of allCards) {
    const hint = resolveCardPool(card, config);
    if (hint) pools[hint].push(card);
  }

  return pools;
}

function playerWeight(card: CardRow, config: LoadedProductConfig | null) {
  const slug = card.checklistEntry.player.slug;
  return config?.playerWeightBySlug[slug] ?? 1;
}

function pickFromPool(
  pool: CardRow[],
  used: Set<string>,
  rng: () => number,
  config: LoadedProductConfig | null,
  weightedPlayers: boolean,
  preferInsertMix = false,
): CardRow | null {
  const available = pool.filter((c) => !used.has(c.id));
  if (!available.length) return null;

  if (preferInsertMix && config) {
    const weighted = available.map((card) => {
      const setSlug = card.checklistEntry.cardSet.slug;
      const insertW = config.setInsertWeightBySlug[setSlug] ?? 1;
      return {
        card,
        weight: insertW * (card.parallel.weight || 1) * playerWeight(card, config),
      };
    });
    return pickWeighted(weighted, rng).card;
  }

  if (weightedPlayers) {
    const weighted = available.map((card) => ({
      card,
      weight: playerWeight(card, config) * (card.parallel.weight || 1),
    }));
    return pickWeighted(weighted, rng).card;
  }

  const weighted = available.map((card) => ({
    card,
    weight: Math.max(0.0001, card.parallel.weight || 1),
  }));
  return pickWeighted(weighted, rng).card;
}

function sortPulls(pulls: PullResultDTO[]) {
  return [...pulls].sort(
    (a, b) => (RARITY_RANK[a.card.rarity] ?? 0) - (RARITY_RANK[b.card.rarity] ?? 0),
  );
}

function makePull(
  card: CardRow,
  used: Set<string>,
  rng: () => number,
): PullResultDTO | null {
  if (used.has(card.id)) return null;
  used.add(card.id);
  const { serialDisplay } = serialFor(card);
  return toPull(card, serialDisplay);
}

export async function openPackFromDb(
  productId: string,
  packIndex = 0,
  seed?: number,
): Promise<PackResultDTO> {
  const pool = await loadProductPool(productId);
  if (!pool) return { packIndex, cards: [] };

  const { product, config, pools } = pool;
  const rng = mulberry32(seed ?? hash32(`${productId}:pack:${packIndex}:${Date.now()}`));
  const used = new Set<string>();
  const pulls: PullResultDTO[] = [];

  const approx = config?.product.singlePackApprox;
  const tryPool = (hitPool: HitPool, chance: number, weightedPlayers = false) => {
    if (pulls.length >= product.cardsPerPack) return;
    if (rng() >= chance) return;
    const card = pickFromPool(pools[hitPool], used, rng, config, weightedPlayers);
    if (!card) return;
    const pull = makePull(card, used, rng);
    if (pull) pulls.push(pull);
  };

  if (approx) {
    tryPool("autograph", approx.autographChance);
    tryPool("case_hit", approx.caseHitChance);
    tryPool("booklet", approx.bookletChance);
    tryPool("patch", approx.patchChance);
    tryPool("insert", approx.insertChance);
    tryPool("numbered", approx.numberedChance);
    tryPool("pulsar", approx.pulsarChance);
    tryPool("refractor", approx.refractorChance, true);
  } else {
    tryPool("autograph", 0.05);
    tryPool("insert", 0.4);
    tryPool("pulsar", 0.15);
    tryPool("numbered", 0.12);
    tryPool("refractor", 0.3, true);
  }

  while (pulls.length < product.cardsPerPack) {
    const card =
      pickFromPool(pools.base, used, rng, config, true) ??
      pickFromPool(pool.allCards, used, rng, config, true);
    if (!card) break;
    const pull = makePull(card, used, rng);
    if (pull) pulls.push(pull);
    else break;
  }

  return {
    packIndex,
    cards: sortPulls(pulls).slice(0, product.cardsPerPack),
  };
}

export async function openBoxFromDb(
  productId: string,
  seed?: number,
): Promise<{ packs: PackResultDTO[]; summary: BoxSummaryDTO }> {
  const pool = await loadProductPool(productId);
  if (!pool) return { packs: [], summary: emptySummary() };

  const { product, config, pools } = pool;
  const baseSeed = seed ?? hash32(`${productId}:box:${Date.now()}`);
  const rng = mulberry32(baseSeed);
  const used = new Set<string>();

  const packsPerBox = product.packsPerBox;
  const cardsPerPack = product.cardsPerPack;
  const packSlots: Array<PullResultDTO | null>[] = Array.from({ length: packsPerBox }, () =>
    Array.from({ length: cardsPerPack }, () => null),
  );

  const guarantees = config?.product.guarantees ?? [
    { id: "autograph", label: "Autograph", count: 1, pool: "autograph" as HitPool },
    { id: "numbered", label: "Numbered Parallel", count: 3, pool: "numbered" as HitPool },
    { id: "pulsar", label: "Pulsar Refractor", count: 3, pool: "pulsar" as HitPool },
    { id: "insert", label: "Insert", count: 9, pool: "insert" as HitPool },
  ];

  const guaranteeResults: GuaranteeResultDTO[] = guarantees.map((g) => ({
    id: g.id,
    label: g.label,
    expected: g.count,
    actual: 0,
  }));

  const emptyCoords = () => {
    const coords: Array<{ p: number; s: number }> = [];
    for (let p = 0; p < packsPerBox; p++) {
      for (let s = 0; s < cardsPerPack; s++) {
        if (!packSlots[p][s]) coords.push({ p, s });
      }
    }
    return shuffleInPlace(coords, rng);
  };

  const placeGuarantee = (gIndex: number) => {
    const g = guarantees[gIndex];
    const result = guaranteeResults[gIndex];
    for (let n = 0; n < g.count; n++) {
      const card = pickFromPool(
        pools[g.pool],
        used,
        rng,
        config,
        g.pool === "insert" || g.pool === "base",
        g.pool === "insert",
      );
      if (!card) continue;
      const pull = makePull(card, used, rng);
      if (!pull) continue;

      // Prefer spreading: one major hit per pack when possible
      let placed = false;
      const packOrder = shuffleInPlace(
        Array.from({ length: packsPerBox }, (_, i) => i),
        rng,
      );
      for (const p of packOrder) {
        const emptySlot = packSlots[p].findIndex((slot) => slot === null);
        if (emptySlot === -1) continue;
        // Avoid stacking multiple autos in one pack
        if (g.pool === "autograph" && packSlots[p].some((s) => s?.card.cardType.includes("AUTOGRAPH"))) {
          continue;
        }
        packSlots[p][emptySlot] = pull;
        result.actual += 1;
        placed = true;
        break;
      }
      if (!placed) {
        const coords = emptyCoords();
        if (coords[0]) {
          packSlots[coords[0].p][coords[0].s] = pull;
          result.actual += 1;
        }
      }
    }
  };

  for (let i = 0; i < guarantees.length; i++) placeGuarantee(i);

  const fillOdds = config?.product.fillOdds ?? {
    refractorChancePerSlot: 0.22,
    bonusHitChancePerSlot: 0.012,
    bonusHitWeights: {
      autograph: 0.15,
      patch: 0.25,
      booklet: 0.2,
      case_hit: 0.08,
      numbered: 0.32,
    },
  };

  for (let p = 0; p < packsPerBox; p++) {
    for (let s = 0; s < cardsPerPack; s++) {
      if (packSlots[p][s]) continue;

      let card: CardRow | null = null;

      if (rng() < fillOdds.bonusHitChancePerSlot) {
        const bonusPools = Object.entries(fillOdds.bonusHitWeights)
          .filter(([, w]) => (w ?? 0) > 0)
          .map(([pool, weight]) => ({ pool: pool as HitPool, weight: weight ?? 0 }));
        if (bonusPools.length) {
          const chosen = pickWeighted(bonusPools, rng).pool;
          card = pickFromPool(pools[chosen], used, rng, config, false);
        }
      }

      if (!card && rng() < fillOdds.refractorChancePerSlot) {
        card = pickFromPool(pools.refractor, used, rng, config, true);
      }

      if (!card) {
        card =
          pickFromPool(pools.base, used, rng, config, true) ??
          pickFromPool(pool.allCards, used, rng, config, true);
      }

      if (!card) continue;
      const pull = makePull(card, used, rng);
      if (pull) packSlots[p][s] = pull;
    }
  }

  const packs: PackResultDTO[] = packSlots.map((slots, packIndex) => {
    const cards = sortPulls(slots.filter((c): c is PullResultDTO => Boolean(c)));
    return { packIndex, cards };
  });

  const allPulls = packs.flatMap((pack) => pack.cards);
  const rarityCounts: Record<string, number> = {};
  for (const pull of allPulls) {
    rarityCounts[pull.card.rarity] = (rarityCounts[pull.card.rarity] ?? 0) + 1;
  }

  // Recount guarantees from actual pulls for honesty
  for (const result of guaranteeResults) {
    const g = guarantees.find((x) => x.id === result.id);
    if (!g) continue;
    result.actual = allPulls.filter((pull) => matchesPool(pull, g.pool)).length;
  }

  const hits = allPulls.filter((p) => p.isHit);
  const estimatedValueCents = allPulls.reduce((s, p) => s + p.card.estimatedValueCents, 0);

  return {
    packs,
    summary: {
      totalCards: allPulls.length,
      hitCount: hits.length,
      rarityCounts,
      guarantees: guaranteeResults,
      estimatedValueCents,
      topHits: [...hits]
        .sort((a, b) => b.card.estimatedValueCents - a.card.estimatedValueCents)
        .slice(0, 12),
    },
  };
}

function matchesPool(pull: PullResultDTO, pool: HitPool) {
  const slug = pull.card.parallelSlug;
  const type = pull.card.cardType;
  if (pool === "autograph") return type.includes("AUTOGRAPH");
  if (pool === "insert") return type === "INSERT";
  if (pool === "pulsar") return slug === "pulsar";
  if (pool === "refractor") return slug === "refractor";
  if (pool === "numbered") {
    return (
      Boolean(pull.card.printRun) &&
      !type.includes("AUTOGRAPH") &&
      !type.includes("PATCH") &&
      type !== "BOOKLET" &&
      type !== "CASE_HIT" &&
      type !== "IMAGE_VARIATION"
    );
  }
  if (pool === "patch") return type.includes("PATCH") || type.includes("RELIC");
  if (pool === "booklet") return type === "BOOKLET";
  if (pool === "case_hit") return type === "CASE_HIT" || type === "IMAGE_VARIATION";
  if (pool === "base") return slug === "base";
  return false;
}

function emptySummary(): BoxSummaryDTO {
  return {
    totalCards: 0,
    hitCount: 0,
    rarityCounts: {},
    guarantees: [],
    estimatedValueCents: 0,
    topHits: [],
  };
}

export async function savePullsToCollection(
  userId: string,
  productId: string,
  pulls: PullResultDTO[],
) {
  const created = await prisma.$transaction(async (tx) => {
    const rows = [];
    for (const pull of pulls) {
      const data = buildUserCardPersistData(userId, productId, pull);
      // Permanently stamp catalog assignedSerial when missing/invalid.
      if (data.serialNumber != null && pull.card.printRun && pull.card.printRun > 0) {
        await tx.card.updateMany({
          where: {
            id: pull.card.id,
            OR: [
              { assignedSerial: null },
              { assignedSerial: { lt: 1 } },
              { assignedSerial: { gt: pull.card.printRun } },
            ],
          },
          data: { assignedSerial: data.serialNumber },
        });
      }
      rows.push(await tx.userCard.create({ data }));
    }
    return rows;
  });
  return created;
}

/** Persist every pack/box rip + evaluate achievements. Called after collection save. */
export async function recordOpeningAndAchievements(params: {
  userId: string;
  productId: string;
  mode: "pack" | "box";
  packs: PackResultDTO[];
  userCardIds: string[];
}) {
  const { saveOpeningSession, evaluateAchievements } = await import("@/lib/progression");
  const opening = await saveOpeningSession(params);
  const newlyUnlocked = await evaluateAchievements({
    userId: params.userId,
    openingId: opening.id,
    pulls: params.packs.flatMap((p) => p.cards),
  });
  return { openingId: opening.id, newlyUnlocked };
}

export async function getProductCollectionProgress(userId: string, productId: string) {
  const [ownedDistinct, totalCatalog] = await Promise.all([
    prisma.userCard.findMany({
      where: { userId, productId },
      distinct: ["cardId"],
      select: { cardId: true },
    }),
    prisma.card.count({
      where: {
        checklistEntry: { cardSet: { productId } },
      },
    }),
  ]);

  const uniqueOwned = ownedDistinct.length;
  const pct = totalCatalog === 0 ? 0 : Math.round((uniqueOwned / totalCatalog) * 1000) / 10;
  return {
    productId,
    uniqueOwned,
    totalCatalog,
    completionPct: pct,
  };
}
