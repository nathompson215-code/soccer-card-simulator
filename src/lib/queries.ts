import type { CardType, Prisma, Rarity } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cardInclude, toCardDTO, toProductDTO } from "@/lib/mappers";
import type { CardDTO, ManufacturerDTO, PlayerDTO, ProductDTO } from "@/lib/types";

export async function getCatalogSummary() {
  const [totalCards, totalProducts, totalPlayers, totalManufacturers, years, tournaments] =
    await Promise.all([
      prisma.card.count(),
      prisma.product.count(),
      prisma.player.count(),
      prisma.manufacturer.count(),
      prisma.product.findMany({
        select: { year: true },
        distinct: ["year"],
        orderBy: { year: "desc" },
      }),
      prisma.tournament.findMany({
        select: { id: true, slug: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

  return {
    totalCards,
    totalProducts,
    totalPlayers,
    totalManufacturers,
    years: years.map((y) => y.year),
    tournaments,
  };
}

export async function listManufacturers(): Promise<ManufacturerDTO[]> {
  const rows = await prisma.manufacturer.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return rows.map((m) => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    foundedYear: m.foundedYear,
    country: m.country,
    colorHex: m.colorHex,
    logoUrl: m.logoUrl,
    imageUrl: m.imageUrl,
    productCount: m._count.products,
  }));
}

export async function listProducts(filters?: {
  manufacturerSlug?: string;
  featured?: boolean;
}): Promise<ProductDTO[]> {
  const where: Prisma.ProductWhereInput = {};
  if (filters?.featured) where.featured = true;
  if (filters?.manufacturerSlug) {
    where.manufacturer = { slug: filters.manufacturerSlug };
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ featured: "desc" }, { releaseYear: "desc" }, { name: "asc" }],
    include: {
      manufacturer: true,
      brand: true,
      tournament: true,
      league: true,
      oddsRules: true,
    },
  });

  const counts = await prisma.card.groupBy({
    by: ["checklistEntryId"],
    _count: true,
  });
  // More efficient: count cards per product via raw join
  const cardCounts = await prisma.$queryRaw<Array<{ product_id: string; count: bigint }>>`
    SELECT p.id as product_id, COUNT(c.id)::bigint as count
    FROM "Product" p
    LEFT JOIN "CardSet" cs ON cs."productId" = p.id
    LEFT JOIN "ChecklistEntry" ce ON ce."cardSetId" = cs.id
    LEFT JOIN "Card" c ON c."checklistEntryId" = ce.id
    GROUP BY p.id
  `;
  const countMap = Object.fromEntries(
    cardCounts.map((row) => [row.product_id, Number(row.count)]),
  );

  void counts;
  return products.map((p) => toProductDTO(p, countMap[p.id] ?? 0));
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      manufacturer: true,
      brand: true,
      tournament: true,
      league: true,
      oddsRules: true,
    },
  });
  if (!product) return null;

  const cardCount = await prisma.card.count({
    where: { checklistEntry: { cardSet: { productId: product.id } } },
  });
  return toProductDTO(product, cardCount);
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      manufacturer: true,
      brand: true,
      tournament: true,
      league: true,
      oddsRules: true,
      sets: {
        include: {
          parallels: true,
          checklistEntries: { select: { id: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      parallels: true,
    },
  });
}

export async function listCards(filters: {
  query?: string;
  manufacturerSlug?: string;
  productSlug?: string;
  rarity?: Rarity;
  cardType?: CardType;
  playerSlug?: string;
  offset?: number;
  limit?: number;
}): Promise<{ cards: CardDTO[]; total: number }> {
  const where: Prisma.CardWhereInput = {};
  const entryWhere: Prisma.ChecklistEntryWhereInput = {};
  const setWhere: Prisma.CardSetWhereInput = {};
  const productWhere: Prisma.ProductWhereInput = {};

  if (filters.manufacturerSlug) {
    productWhere.manufacturer = { slug: filters.manufacturerSlug };
  }
  if (filters.productSlug) {
    productWhere.slug = filters.productSlug;
  }
  if (filters.playerSlug) {
    entryWhere.player = { slug: filters.playerSlug };
  }
  if (filters.query) {
    const q = filters.query.trim();
    entryWhere.OR = [
      { player: { fullName: { contains: q, mode: "insensitive" } } },
      { cardNumber: { contains: q, mode: "insensitive" } },
      { cardSet: { name: { contains: q, mode: "insensitive" } } },
      {
        cardSet: {
          product: { name: { contains: q, mode: "insensitive" } },
        },
      },
    ];
  }
  if (filters.rarity) where.parallel = { rarity: filters.rarity };
  if (filters.cardType) {
    where.parallel = { ...(where.parallel as object), cardType: filters.cardType };
  }

  if (Object.keys(productWhere).length) setWhere.product = productWhere;
  if (Object.keys(setWhere).length) entryWhere.cardSet = setWhere;
  if (Object.keys(entryWhere).length) where.checklistEntry = entryWhere;

  const limit = filters.limit ?? 48;
  const offset = filters.offset ?? 0;

  const [rows, total] = await Promise.all([
    prisma.card.findMany({
      where,
      include: cardInclude,
      orderBy: [{ estimatedValueCents: "desc" }, { slug: "asc" }],
      skip: offset,
      take: limit,
    }),
    prisma.card.count({ where }),
  ]);

  return { cards: rows.map(toCardDTO), total };
}

export async function getCardBySlug(slug: string): Promise<CardDTO | null> {
  const card = await prisma.card.findUnique({
    where: { slug },
    include: cardInclude,
  });
  return card ? toCardDTO(card) : null;
}

export async function getCardById(id: string): Promise<CardDTO | null> {
  const card = await prisma.card.findUnique({
    where: { id },
    include: cardInclude,
  });
  return card ? toCardDTO(card) : null;
}

export async function getRelatedCards(card: CardDTO, limit = 8): Promise<CardDTO[]> {
  const rows = await prisma.card.findMany({
    where: {
      id: { not: card.id },
      OR: [
        { checklistEntry: { playerId: card.playerId } },
        { checklistEntry: { cardSet: { productId: card.productId } } },
      ],
    },
    include: cardInclude,
    take: limit,
    orderBy: { estimatedValueCents: "desc" },
  });
  return rows.map(toCardDTO);
}

export async function listPlayers(query?: string, limit = 60): Promise<PlayerDTO[]> {
  const where: Prisma.PlayerWhereInput = query
    ? {
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { club: { name: { contains: query, mode: "insensitive" } } },
          { nationalTeam: { name: { contains: query, mode: "insensitive" } } },
        ],
      }
    : {};

  const players = await prisma.player.findMany({
    where,
    include: {
      club: { include: { league: true } },
      nationalTeam: true,
      nationality: true,
      _count: { select: { checklistEntries: true } },
    },
    orderBy: { fullName: "asc" },
    take: limit,
  });

  // Count unique cards per player
  const result: PlayerDTO[] = [];
  for (const p of players) {
    const cardCount = await prisma.card.count({
      where: { checklistEntry: { playerId: p.id } },
    });
    result.push({
      id: p.id,
      slug: p.slug,
      fullName: p.fullName,
      position: p.position,
      era: p.era,
      birthYear: p.birthYear,
      imageUrl: p.imageUrl,
      imageUrlHd: p.imageUrlHd,
      clubName: p.club?.name ?? null,
      clubLogoUrl: p.club?.logoUrl ?? null,
      nationalTeamName: p.nationalTeam?.name ?? null,
      nationalTeamLogoUrl: p.nationalTeam?.logoUrl ?? null,
      nationalityName: p.nationality?.name ?? null,
      leagueName: p.club?.league?.name ?? null,
      cardCount,
    });
  }
  return result;
}

export async function getPlayerBySlug(slug: string): Promise<PlayerDTO | null> {
  const p = await prisma.player.findUnique({
    where: { slug },
    include: {
      club: { include: { league: true } },
      nationalTeam: true,
      nationality: true,
    },
  });
  if (!p) return null;
  const cardCount = await prisma.card.count({
    where: { checklistEntry: { playerId: p.id } },
  });
  return {
    id: p.id,
    slug: p.slug,
    fullName: p.fullName,
    position: p.position,
    era: p.era,
    birthYear: p.birthYear,
    imageUrl: p.imageUrl,
    imageUrlHd: p.imageUrlHd,
    clubName: p.club?.name ?? null,
    clubLogoUrl: p.club?.logoUrl ?? null,
    nationalTeamName: p.nationalTeam?.name ?? null,
    nationalTeamLogoUrl: p.nationalTeam?.logoUrl ?? null,
    nationalityName: p.nationality?.name ?? null,
    leagueName: p.club?.league?.name ?? null,
    cardCount,
  };
}

export async function getDemoUser() {
  const email = process.env.NEXT_PUBLIC_DEMO_USER_EMAIL ?? "collector@drafteleven.local";
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: "Demo Collector" },
  });
}
