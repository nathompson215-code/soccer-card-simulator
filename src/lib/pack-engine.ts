import type { Card, Parallel, Product } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cardInclude, toCardDTO } from "@/lib/mappers";
import type { Celebration, PackResultDTO, PullResultDTO } from "@/lib/types";

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
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function celebrationFor(rarity: string, cardType: string, printRun: number | null): Celebration {
  if (rarity === "LEGENDARY" || printRun === 1 || cardType === "ONE_OF_ONE") return "jackpot";
  if (
    cardType.includes("AUTOGRAPH") ||
    cardType.includes("PATCH") ||
    cardType === "BOOKLET" ||
    cardType === "CASE_HIT" ||
    rarity === "MYTHIC"
  )
    return "hit";
  if (rarity === "ULTRA_RARE" || rarity === "RARE") return "foil";
  if (rarity === "UNCOMMON") return "glow";
  return "none";
}

function isHit(rarity: string, cardType: string, printRun: number | null) {
  return (
    rarity === "ULTRA_RARE" ||
    rarity === "MYTHIC" ||
    rarity === "LEGENDARY" ||
    Boolean(printRun && printRun <= 99) ||
    cardType.includes("AUTOGRAPH") ||
    cardType.includes("PATCH") ||
    cardType.includes("RELIC") ||
    cardType === "CASE_HIT" ||
    cardType === "BOOKLET" ||
    cardType === "ONE_OF_ONE"
  );
}

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

  return { product, allCards };
}

function serialFor(card: Card & { numbering: { printRun: number } | null; parallel: Parallel }, rng: () => number) {
  const printRun = card.numbering?.printRun ?? card.parallel.printRun;
  if (!printRun) return { serialNumber: null as number | null, serialDisplay: null as string | null };
  const serialNumber = Math.floor(rng() * printRun) + 1;
  return { serialNumber, serialDisplay: `${serialNumber}/${printRun}` };
}

function toPull(
  card: Parameters<typeof toCardDTO>[0],
  serialDisplay: string | null,
): PullResultDTO {
  const dto = toCardDTO(card);
  return {
    card: dto,
    serialDisplay,
    isHit: isHit(dto.rarity, dto.cardType, dto.printRun),
    celebration: celebrationFor(dto.rarity, dto.cardType, dto.printRun),
  };
}

export async function openPackFromDb(
  productId: string,
  packIndex = 0,
  seed?: number,
): Promise<PackResultDTO> {
  const pool = await loadProductPool(productId);
  if (!pool) return { packIndex, cards: [] };

  const { product, allCards } = pool;
  const rng = mulberry32(seed ?? hash32(`${productId}:${packIndex}:${Date.now()}`));
  const pulls: PullResultDTO[] = [];
  const used = new Set<string>();

  const baseSet = product.sets.find((s) => s.setType === "BASE");
  const insertSet = product.sets.find((s) => s.setType === "INSERT");
  const autoSet = product.sets.find((s) => s.setType === "AUTOGRAPH");
  const relicSet = product.sets.find((s) => s.setType === "RELIC");

  const odds = Object.fromEntries(product.oddsRules.map((r) => [r.label, r]));

  const pushCard = (card: (typeof allCards)[number] | undefined) => {
    if (!card || used.has(card.id)) return false;
    used.add(card.id);
    const { serialDisplay } = serialFor(card, rng);
    pulls.push(toPull(card, serialDisplay));
    return true;
  };

  const chancePerPack = (label: string, fallback: number) => {
    const rule = odds[label];
    if (!rule) return fallback;
    if (rule.scope === "PER_PACK") return rule.expectedCount;
    if (rule.scope === "PER_BOX") return rule.expectedCount / Math.max(1, product.packsPerBox);
    return rule.expectedCount / (product.packsPerBox * 6);
  };

  // Autograph / relic / insert attempts
  if (autoSet && rng() < chancePerPack("Autograph per box", 0.1)) {
    const cards = autoSet.checklistEntries.flatMap((e) => e.cards);
    pushCard(cards[Math.floor(rng() * cards.length)]);
  }
  if (relicSet && rng() < chancePerPack("Relic per box", 0.08)) {
    const cards = relicSet.checklistEntries.flatMap((e) => e.cards);
    pushCard(cards[Math.floor(rng() * cards.length)]);
  }
  if (insertSet && rng() < chancePerPack("Insert per pack", 0.4)) {
    const cards = insertSet.checklistEntries.flatMap((e) => e.cards);
    pushCard(cards[Math.floor(rng() * cards.length)]);
  }

  // Fill with base / parallels
  const baseCards = baseSet?.checklistEntries.flatMap((e) => e.cards) ?? allCards;
  const baseOnly = baseCards.filter((c) => c.parallel.slug === "base");
  const parallels = baseCards.filter((c) => c.parallel.slug !== "base");
  const parallelChance = chancePerPack("Parallel per pack", 0.5);

  while (pulls.length < product.cardsPerPack) {
    const wantParallel = parallels.length > 0 && rng() < parallelChance;
    const source = wantParallel ? parallels : baseOnly.length ? baseOnly : baseCards;
    if (!source.length) break;

    // Weighted by parallel weight when pulling parallels
    let chosen: (typeof source)[number];
    if (wantParallel) {
      const weighted = source.map((c) => ({ card: c, weight: c.parallel.weight || 0.01 }));
      chosen = pickWeighted(weighted, rng).card;
    } else {
      chosen = source[Math.floor(rng() * source.length)];
    }

    if (!pushCard(chosen)) {
      // try another random card
      pushCard(allCards[Math.floor(rng() * allCards.length)]);
    }
  }

  const rarityRank: Record<string, number> = {
    COMMON: 0,
    UNCOMMON: 1,
    RARE: 2,
    ULTRA_RARE: 3,
    MYTHIC: 4,
    LEGENDARY: 5,
  };
  pulls.sort((a, b) => rarityRank[a.card.rarity] - rarityRank[b.card.rarity]);

  return {
    packIndex,
    cards: pulls.slice(0, product.cardsPerPack),
  };
}

export async function openBoxFromDb(productId: string, seed?: number): Promise<PackResultDTO[]> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return [];
  const base = seed ?? hash32(`${productId}:box:${Date.now()}`);
  const packs: PackResultDTO[] = [];
  for (let i = 0; i < product.packsPerBox; i++) {
    packs.push(await openPackFromDb(productId, i, base + i * 9973));
  }
  return packs;
}

export async function savePullsToCollection(
  userId: string,
  productId: string,
  pulls: PullResultDTO[],
) {
  const created = await prisma.$transaction(
    pulls.map((pull) => {
      const printRun = pull.card.printRun;
      const serialNumber = pull.serialDisplay
        ? Number(pull.serialDisplay.split("/")[0])
        : null;
      return prisma.userCard.create({
        data: {
          userId,
          cardId: pull.card.id,
          productId,
          serialNumber: Number.isFinite(serialNumber) ? serialNumber : null,
          serialDisplay: pull.serialDisplay,
        },
      });
    }),
  );
  return created;
}

export type ProductForOdds = Product;
