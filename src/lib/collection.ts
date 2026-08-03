import type { CardType, Prisma, Rarity } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cardInclude, toCardDTO } from "@/lib/mappers";
import { getDemoUser } from "@/lib/queries";
import type {
  CardCollectionDetailDTO,
  CollectionEntryDTO,
  CollectionFilterOptions,
  CollectionSort,
  CollectionStatsDTO,
  CompletionBucketDTO,
  OwnedCardDTO,
} from "@/lib/types";

const NEW_WINDOW_MS = 1000 * 60 * 60 * 72; // 72 hours

const RARITY_RANK: Record<string, number> = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  ULTRA_RARE: 3,
  MYTHIC: 4,
  LEGENDARY: 5,
};

const AUTOGRAPH_TYPES: CardType[] = [
  "AUTOGRAPH",
  "DUAL_AUTOGRAPH",
  "TRIPLE_AUTOGRAPH",
  "QUAD_AUTOGRAPH",
];

const MEMORABILIA_TYPES: CardType[] = [
  "PATCH",
  "JUMBO_PATCH",
  "RELIC",
  "MEMORABILIA",
  "SHIELD_PATCH",
  "LOGO_PATCH",
  "LAUNDRY_TAG",
  "CLEAT_RELIC",
];

export type CollectionQuery = {
  q?: string;
  player?: string;
  club?: string;
  nation?: string;
  product?: string;
  year?: string;
  rarity?: string;
  insertSet?: string;
  autograph?: string;
  memorabilia?: string;
  booklet?: string;
  numbered?: string;
  valueMin?: string;
  valueMax?: string;
  favorites?: string;
  owned?: string;
  sort?: string;
};

function pct(owned: number, total: number) {
  if (!total) return 0;
  return Math.round((owned / total) * 1000) / 10;
}

function isRecentlyNew(firstPulledAt: Date | null | undefined) {
  if (!firstPulledAt) return false;
  return Date.now() - firstPulledAt.getTime() < NEW_WINDOW_MS;
}

function aggregateEntries(
  owned: Array<{
    id: string;
    cardId: string;
    productId: string;
    pulledAt: Date;
    serialDisplay: string | null;
    card: Parameters<typeof toCardDTO>[0];
  }>,
  favoriteIds: Set<string>,
): CollectionEntryDTO[] {
  const map = new Map<
    string,
    {
      cardId: string;
      card: ReturnType<typeof toCardDTO>;
      copyCount: number;
      firstPulledAt: Date;
      lastPulledAt: Date;
      serialDisplays: string[];
    }
  >();

  for (const row of owned) {
    const existing = map.get(row.cardId);
    if (!existing) {
      map.set(row.cardId, {
        cardId: row.cardId,
        card: toCardDTO(row.card),
        copyCount: 1,
        firstPulledAt: row.pulledAt,
        lastPulledAt: row.pulledAt,
        serialDisplays: row.serialDisplay ? [row.serialDisplay] : [],
      });
      continue;
    }
    existing.copyCount += 1;
    if (row.pulledAt < existing.firstPulledAt) existing.firstPulledAt = row.pulledAt;
    if (row.pulledAt > existing.lastPulledAt) existing.lastPulledAt = row.pulledAt;
    if (row.serialDisplay) existing.serialDisplays.push(row.serialDisplay);
  }

  return [...map.values()].map((entry) => ({
    cardId: entry.cardId,
    card: entry.card,
    copyCount: entry.copyCount,
    firstPulledAt: entry.firstPulledAt.toISOString(),
    lastPulledAt: entry.lastPulledAt.toISOString(),
    serialDisplays: entry.serialDisplays,
    isNew: isRecentlyNew(entry.firstPulledAt),
    isFavorite: favoriteIds.has(entry.cardId),
    isOwned: true,
  }));
}

function matchesQuery(entry: CollectionEntryDTO, query: CollectionQuery): boolean {
  const card = entry.card;

  if (query.q) {
    const q = query.q.trim().toLowerCase();
    const hay = [
      card.playerName,
      card.clubName,
      card.nationalTeamName,
      card.productName,
      card.subsetName,
      card.parallelName,
      card.cardNumber,
      card.manufacturerName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }

  if (query.player && card.playerName.toLowerCase() !== query.player.toLowerCase()) {
    return false;
  }
  if (query.club && (card.clubName ?? "").toLowerCase() !== query.club.toLowerCase()) {
    return false;
  }
  if (
    query.nation &&
    (card.nationalTeamName ?? "").toLowerCase() !== query.nation.toLowerCase()
  ) {
    return false;
  }
  if (query.product && card.productSlug !== query.product) return false;
  if (query.year && String(card.year) !== query.year) return false;
  if (query.rarity && card.rarity !== query.rarity) return false;
  if (query.insertSet && card.subset !== query.insertSet) return false;

  if (query.autograph === "1" && !AUTOGRAPH_TYPES.includes(card.cardType)) return false;
  if (query.autograph === "0" && AUTOGRAPH_TYPES.includes(card.cardType)) return false;

  if (query.memorabilia === "1" && !MEMORABILIA_TYPES.includes(card.cardType)) return false;
  if (query.memorabilia === "0" && MEMORABILIA_TYPES.includes(card.cardType)) return false;

  if (query.booklet === "1" && card.cardType !== "BOOKLET" && card.setType !== "BOOKLET") {
    return false;
  }
  if (query.booklet === "0" && (card.cardType === "BOOKLET" || card.setType === "BOOKLET")) {
    return false;
  }

  if (query.numbered === "1" && !card.printRun) return false;
  if (query.numbered === "0" && card.printRun) return false;

  if (query.valueMin) {
    const min = Number(query.valueMin) * 100;
    if (Number.isFinite(min) && card.estimatedValueCents < min) return false;
  }
  if (query.valueMax) {
    const max = Number(query.valueMax) * 100;
    if (Number.isFinite(max) && card.estimatedValueCents > max) return false;
  }

  if (query.favorites === "1" && !entry.isFavorite) return false;
  if (query.owned === "1" && !entry.isOwned) return false;
  if (query.owned === "0" && entry.isOwned) return false;

  return true;
}

function sortEntries(entries: CollectionEntryDTO[], sort: CollectionSort) {
  const copy = [...entries];
  copy.sort((a, b) => {
    switch (sort) {
      case "oldest": {
        const at = a.firstPulledAt ? Date.parse(a.firstPulledAt) : Number.POSITIVE_INFINITY;
        const bt = b.firstPulledAt ? Date.parse(b.firstPulledAt) : Number.POSITIVE_INFINITY;
        return at - bt || a.card.playerName.localeCompare(b.card.playerName);
      }
      case "value_high":
        return (
          b.card.estimatedValueCents - a.card.estimatedValueCents ||
          a.card.playerName.localeCompare(b.card.playerName)
        );
      case "value_low":
        return (
          a.card.estimatedValueCents - b.card.estimatedValueCents ||
          a.card.playerName.localeCompare(b.card.playerName)
        );
      case "rarity":
        return (
          (RARITY_RANK[b.card.rarity] ?? 0) - (RARITY_RANK[a.card.rarity] ?? 0) ||
          b.card.estimatedValueCents - a.card.estimatedValueCents
        );
      case "player":
        return a.card.playerName.localeCompare(b.card.playerName);
      case "club":
        return (a.card.clubName ?? "zzz").localeCompare(b.card.clubName ?? "zzz");
      case "card_number":
        return (
          a.card.cardNumber.localeCompare(b.card.cardNumber, undefined, { numeric: true }) ||
          a.card.playerName.localeCompare(b.card.playerName)
        );
      case "newest":
      default: {
        const at = a.lastPulledAt ? Date.parse(a.lastPulledAt) : 0;
        const bt = b.lastPulledAt ? Date.parse(b.lastPulledAt) : 0;
        return bt - at || a.card.playerName.localeCompare(b.card.playerName);
      }
    }
  });
  return copy;
}

async function loadOwnedRows(userId: string) {
  return prisma.userCard.findMany({
    where: { userId },
    include: { card: { include: cardInclude } },
    orderBy: { pulledAt: "desc" },
  });
}

async function loadCompletion(userId: string): Promise<{
  overall: CompletionBucketDTO;
  products: CompletionBucketDTO[];
  insertSets: CompletionBucketDTO[];
}> {
  const [productRows, insertRows, overallOwned, overallTotal] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        product_id: string;
        product_slug: string;
        name: string;
        owned: bigint;
        total: bigint;
      }>
    >`
      SELECT p.id as product_id, p.slug as product_slug, p.name as name,
        COUNT(DISTINCT uc."cardId")::bigint as owned,
        (
          SELECT COUNT(c.id)::bigint
          FROM "Card" c
          JOIN "ChecklistEntry" ce ON ce.id = c."checklistEntryId"
          JOIN "CardSet" cs ON cs.id = ce."cardSetId"
          WHERE cs."productId" = p.id
        ) as total
      FROM "Product" p
      LEFT JOIN "UserCard" uc ON uc."productId" = p.id AND uc."userId" = ${userId}
      GROUP BY p.id, p.slug, p.name
      ORDER BY p.name ASC
    `,
    prisma.$queryRaw<
      Array<{
        set_id: string;
        set_slug: string;
        set_name: string;
        product_id: string;
        product_slug: string;
        owned: bigint;
        total: bigint;
      }>
    >`
      SELECT cs.id as set_id, cs.slug as set_slug, cs.name as set_name,
        p.id as product_id, p.slug as product_slug,
        COUNT(DISTINCT CASE WHEN uc.id IS NOT NULL THEN c.id END)::bigint as owned,
        COUNT(DISTINCT c.id)::bigint as total
      FROM "CardSet" cs
      JOIN "Product" p ON p.id = cs."productId"
      LEFT JOIN "ChecklistEntry" ce ON ce."cardSetId" = cs.id
      LEFT JOIN "Card" c ON c."checklistEntryId" = ce.id
      LEFT JOIN "UserCard" uc ON uc."cardId" = c.id AND uc."userId" = ${userId}
      WHERE cs."setType" IN ('INSERT','SP','SSP','CASE_HIT','AUTOGRAPH','RELIC','BOOKLET','IMAGE_VARIATION')
      GROUP BY cs.id, cs.slug, cs.name, p.id, p.slug
      HAVING COUNT(DISTINCT c.id) > 0
      ORDER BY p.name ASC, cs."sortOrder" ASC, cs.name ASC
    `,
    prisma.userCard.findMany({
      where: { userId },
      distinct: ["cardId"],
      select: { cardId: true },
    }),
    prisma.card.count(),
  ]);

  const products: CompletionBucketDTO[] = productRows.map((p) => {
    const owned = Number(p.owned);
    const total = Number(p.total);
    return {
      id: p.product_id,
      name: p.name,
      owned,
      total,
      pct: pct(owned, total),
      kind: "product",
      productId: p.product_id,
      productSlug: p.product_slug,
    };
  });

  const insertSets: CompletionBucketDTO[] = insertRows.map((s) => {
    const owned = Number(s.owned);
    const total = Number(s.total);
    return {
      id: s.set_id,
      name: `${s.set_name}`,
      owned,
      total,
      pct: pct(owned, total),
      kind: "insert_set",
      productId: s.product_id,
      productSlug: s.product_slug,
      setSlug: s.set_slug,
    };
  });

  const uniqueOwned = overallOwned.length;
  const overall: CompletionBucketDTO = {
    id: "overall",
    name: "Entire collection",
    owned: uniqueOwned,
    total: overallTotal,
    pct: pct(uniqueOwned, overallTotal),
    kind: "overall",
  };

  return { overall, products, insertSets };
}

function buildFilterOptions(entries: CollectionEntryDTO[]): CollectionFilterOptions {
  const players = new Set<string>();
  const clubs = new Set<string>();
  const nations = new Set<string>();
  const years = new Set<number>();
  const rarities = new Set<Rarity>();
  const products = new Map<string, { slug: string; name: string; year: number }>();
  const insertSets = new Map<string, { slug: string; name: string; productSlug: string }>();

  for (const entry of entries) {
    const c = entry.card;
    players.add(c.playerName);
    if (c.clubName) clubs.add(c.clubName);
    if (c.nationalTeamName) nations.add(c.nationalTeamName);
    years.add(c.year);
    rarities.add(c.rarity);
    products.set(c.productSlug, { slug: c.productSlug, name: c.productName, year: c.year });
    if (c.setType !== "BASE") {
      insertSets.set(`${c.productSlug}:${c.subset}`, {
        slug: c.subset,
        name: c.subsetName,
        productSlug: c.productSlug,
      });
    }
  }

  return {
    players: [...players].sort((a, b) => a.localeCompare(b)),
    clubs: [...clubs].sort((a, b) => a.localeCompare(b)),
    nations: [...nations].sort((a, b) => a.localeCompare(b)),
    products: [...products.values()].sort((a, b) => a.name.localeCompare(b.name)),
    years: [...years].sort((a, b) => b - a),
    rarities: [...rarities].sort(
      (a, b) => (RARITY_RANK[a] ?? 0) - (RARITY_RANK[b] ?? 0),
    ),
    insertSets: [...insertSets.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

async function loadCatalogSlots(params: {
  productSlug?: string;
  insertSet?: string;
  ownedByCardId: Map<string, CollectionEntryDTO>;
  favoriteIds: Set<string>;
}): Promise<CollectionEntryDTO[]> {
  if (!params.productSlug && !params.insertSet) return [];

  const where: Prisma.CardWhereInput = {
    checklistEntry: {
      cardSet: {
        ...(params.productSlug ? { product: { slug: params.productSlug } } : {}),
        ...(params.insertSet ? { slug: params.insertSet } : {}),
      },
    },
  };

  const rows = await prisma.card.findMany({
    where,
    include: cardInclude,
    orderBy: [
      { checklistEntry: { sortOrder: "asc" } },
      { checklistEntry: { cardNumber: "asc" } },
      { estimatedValueCents: "desc" },
    ],
  });

  return rows.map((row) => {
    const owned = params.ownedByCardId.get(row.id);
    if (owned) return owned;
    const card = toCardDTO(row);
    return {
      cardId: row.id,
      card,
      copyCount: 0,
      firstPulledAt: null,
      lastPulledAt: null,
      serialDisplays: [],
      isNew: false,
      isFavorite: params.favoriteIds.has(row.id),
      isOwned: false,
    };
  });
}

export async function getCollection(query: CollectionQuery = {}) {
  const user = await getDemoUser();
  const [ownedRows, favorites, wishlist, completion] = await Promise.all([
    loadOwnedRows(user.id),
    prisma.favorite.findMany({ where: { userId: user.id }, select: { cardId: true } }),
    prisma.wishlistItem.findMany({ where: { userId: user.id }, select: { cardId: true } }),
    loadCompletion(user.id),
  ]);

  const favoriteIds = new Set(favorites.map((f) => f.cardId));
  const ownedEntries = aggregateEntries(ownedRows, favoriteIds);
  const ownedByCardId = new Map(ownedEntries.map((e) => [e.cardId, e]));

  const items: OwnedCardDTO[] = ownedRows.map((row) => ({
    instanceId: row.id,
    cardId: row.cardId,
    productId: row.productId,
    pulledAt: row.pulledAt.toISOString(),
    serialDisplay: row.serialDisplay,
    card: toCardDTO(row.card),
  }));

  const showChecklist = Boolean(query.product || query.insertSet);
  const binderSource = showChecklist
    ? await loadCatalogSlots({
        productSlug: query.product,
        insertSet: query.insertSet,
        ownedByCardId,
        favoriteIds,
      })
    : ownedEntries;

  const sort = (query.sort as CollectionSort) || "newest";
  const filtered = sortEntries(
    binderSource.filter((entry) => matchesQuery(entry, query)),
    sort,
  );

  const uniqueIds = new Set(ownedEntries.map((e) => e.cardId));
  const totalEstimatedValueCents = ownedRows.reduce(
    (sum, row) => sum + row.card.estimatedValueCents,
    0,
  );
  const productsCompleted = completion.products.filter(
    (p) => p.total > 0 && p.owned >= p.total,
  ).length;

  const topValuable = [...ownedEntries]
    .sort((a, b) => b.card.estimatedValueCents - a.card.estimatedValueCents)
    .slice(0, 10);

  const stats: CollectionStatsDTO = {
    totalOwned: items.length,
    uniqueOwned: uniqueIds.size,
    duplicateCards: Math.max(0, items.length - uniqueIds.size),
    totalEstimatedValueCents,
    productsCompleted,
    productsTotal: completion.products.length,
    completionPct: completion.overall.pct,
    topValuable,
    recentPulls: items.slice(0, 12),
  };

  // Filter options should include catalog facets for selected product when possible
  const filterOptions = buildFilterOptions(
    showChecklist && binderSource.length ? binderSource : ownedEntries,
  );

  // Enrich insert set options from completion when available
  if (completion.insertSets.length) {
    const existing = new Set(filterOptions.insertSets.map((s) => `${s.productSlug}:${s.slug}`));
    for (const set of completion.insertSets) {
      if (!set.setSlug || !set.productSlug) continue;
      const key = `${set.productSlug}:${set.setSlug}`;
      if (existing.has(key)) continue;
      filterOptions.insertSets.push({
        slug: set.setSlug,
        name: set.name,
        productSlug: set.productSlug,
      });
    }
    filterOptions.insertSets.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Enrich products from completion
  if (completion.products.length) {
    const existing = new Set(filterOptions.products.map((p) => p.slug));
    for (const p of completion.products) {
      if (!p.productSlug || existing.has(p.productSlug)) continue;
      filterOptions.products.push({
        slug: p.productSlug,
        name: p.name,
        year: 0,
      });
    }
    filterOptions.products.sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    user,
    items,
    entries: filtered,
    allOwnedEntries: ownedEntries,
    totalOwned: stats.totalOwned,
    uniqueOwned: stats.uniqueOwned,
    totalCatalog: completion.overall.total,
    completionPct: completion.overall.pct,
    byManufacturer: [] as Array<{ name: string; owned: number; total: number }>,
    favorites: [...favoriteIds],
    wishlist: wishlist.map((w) => w.cardId),
    rarestPulls: topValuable.slice(0, 8).map((entry) => ({
      instanceId: `${entry.cardId}-top`,
      cardId: entry.cardId,
      productId: entry.card.productId,
      pulledAt: entry.lastPulledAt ?? new Date(0).toISOString(),
      serialDisplay: entry.serialDisplays[0] ?? null,
      card: entry.card,
    })),
    productCompletion: completion.products,
    insertSetCompletion: completion.insertSets,
    overallCompletion: completion.overall,
    stats,
    filterOptions,
    query,
    showingChecklist: showChecklist,
  };
}

/** Nav badge only — avoids shipping the full owned-card payload on every route. */
export async function getCollectionOwnedCount() {
  const user = await getDemoUser();
  const totalOwned = await prisma.userCard.count({ where: { userId: user.id } });
  return { totalOwned };
}

export async function getCardCollectionDetail(
  slug: string,
): Promise<CardCollectionDetailDTO | null> {
  const user = await getDemoUser();
  const card = await prisma.card.findUnique({
    where: { slug },
    include: cardInclude,
  });
  if (!card) return null;

  const [pulls, favorite, wishlist] = await Promise.all([
    prisma.userCard.findMany({
      where: { userId: user.id, cardId: card.id },
      orderBy: { pulledAt: "desc" },
    }),
    prisma.favorite.findUnique({
      where: { userId_cardId: { userId: user.id, cardId: card.id } },
    }),
    prisma.wishlistItem.findUnique({
      where: { userId_cardId: { userId: user.id, cardId: card.id } },
    }),
  ]);

  const firstPulled = pulls.length
    ? pulls.reduce((min, p) => (p.pulledAt < min ? p.pulledAt : min), pulls[0].pulledAt)
    : null;

  return {
    card: toCardDTO(card),
    isFavorite: Boolean(favorite),
    isWishlisted: Boolean(wishlist),
    ownershipCount: pulls.length,
    isNew: isRecentlyNew(firstPulled),
    pullHistory: pulls.map((p) => ({
      instanceId: p.id,
      pulledAt: p.pulledAt.toISOString(),
      serialDisplay: p.serialDisplay,
    })),
    latestSerialDisplay: pulls[0]?.serialDisplay ?? null,
  };
}

export async function toggleFavorite(cardId: string) {
  const user = await getDemoUser();
  const existing = await prisma.favorite.findUnique({
    where: { userId_cardId: { userId: user.id, cardId } },
  });
  if (existing) {
    await prisma.favorite.delete({
      where: { userId_cardId: { userId: user.id, cardId } },
    });
    return { favorited: false };
  }
  await prisma.favorite.create({ data: { userId: user.id, cardId } });
  return { favorited: true };
}

export async function toggleWishlist(cardId: string) {
  const user = await getDemoUser();
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_cardId: { userId: user.id, cardId } },
  });
  if (existing) {
    await prisma.wishlistItem.delete({
      where: { userId_cardId: { userId: user.id, cardId } },
    });
    return { wishlisted: false };
  }
  await prisma.wishlistItem.create({ data: { userId: user.id, cardId } });
  return { wishlisted: true };
}

/** Mark which pulls are first-time uniques for the collector (before persist). */
export async function annotateNewPulls<
  T extends { cards: Array<{ card: { id: string }; isNew?: boolean }> },
>(userId: string, packs: T[]): Promise<T[]> {
  const existing = await prisma.userCard.findMany({
    where: { userId },
    distinct: ["cardId"],
    select: { cardId: true },
  });
  const owned = new Set(existing.map((row) => row.cardId));
  const seenThisOpen = new Set<string>();

  for (const pack of packs) {
    for (const pull of pack.cards) {
      const id = pull.card.id;
      const isNew = !owned.has(id) && !seenThisOpen.has(id);
      pull.isNew = isNew;
      seenThisOpen.add(id);
    }
  }

  return packs;
}
