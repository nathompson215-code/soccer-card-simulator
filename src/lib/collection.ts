import { prisma } from "@/lib/db";
import { cardInclude, toCardDTO } from "@/lib/mappers";
import { getDemoUser } from "@/lib/queries";
import type { OwnedCardDTO } from "@/lib/types";

export async function getCollection() {
  const user = await getDemoUser();
  const owned = await prisma.userCard.findMany({
    where: { userId: user.id },
    include: { card: { include: cardInclude } },
    orderBy: { pulledAt: "desc" },
  });

  const items: OwnedCardDTO[] = owned.map((row) => ({
    instanceId: row.id,
    cardId: row.cardId,
    productId: row.productId,
    pulledAt: row.pulledAt.toISOString(),
    serialDisplay: row.serialDisplay,
    card: toCardDTO(row.card),
  }));

  const uniqueIds = new Set(items.map((i) => i.cardId));
  const totalCatalog = await prisma.card.count();

  const byManufacturerRows = await prisma.$queryRaw<
    Array<{ name: string; owned: bigint; total: bigint }>
  >`
    SELECT m.name as name,
      COUNT(DISTINCT uc."cardId")::bigint as owned,
      (
        SELECT COUNT(c2.id)::bigint
        FROM "Card" c2
        JOIN "ChecklistEntry" ce2 ON ce2.id = c2."checklistEntryId"
        JOIN "CardSet" cs2 ON cs2.id = ce2."cardSetId"
        JOIN "Product" p2 ON p2.id = cs2."productId"
        WHERE p2."manufacturerId" = m.id
      ) as total
    FROM "Manufacturer" m
    LEFT JOIN "Product" p ON p."manufacturerId" = m.id
    LEFT JOIN "UserCard" uc ON uc."productId" = p.id AND uc."userId" = ${user.id}
    GROUP BY m.id, m.name
    ORDER BY m.name
  `;

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { cardId: true },
  });
  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    select: { cardId: true },
  });

  const rarestPulls = [...items]
    .sort((a, b) => b.card.estimatedValueCents - a.card.estimatedValueCents)
    .slice(0, 8);

  const estimatedValueCents = items.reduce(
    (sum, item) => sum + item.card.estimatedValueCents,
    0,
  );

  const productCompletion = await prisma.$queryRaw<
    Array<{ product_id: string; name: string; owned: bigint; total: bigint }>
  >`
    SELECT p.id as product_id, p.name as name,
      COUNT(DISTINCT uc."cardId")::bigint as owned,
      (
        SELECT COUNT(c.id)::bigint
        FROM "Card" c
        JOIN "ChecklistEntry" ce ON ce.id = c."checklistEntryId"
        JOIN "CardSet" cs ON cs.id = ce."cardSetId"
        WHERE cs."productId" = p.id
      ) as total
    FROM "Product" p
    LEFT JOIN "UserCard" uc ON uc."productId" = p.id AND uc."userId" = ${user.id}
    GROUP BY p.id, p.name
    ORDER BY owned DESC
  `;

  return {
    user,
    items,
    totalOwned: items.length,
    uniqueOwned: uniqueIds.size,
    totalCatalog,
    estimatedValueCents,
    completionPct: totalCatalog
      ? Math.round((uniqueIds.size / totalCatalog) * 10000) / 100
      : 0,
    byManufacturer: byManufacturerRows.map((r) => ({
      name: r.name,
      owned: Number(r.owned),
      total: Number(r.total),
    })),
    favorites: favorites.map((f) => f.cardId),
    wishlist: wishlist.map((w) => w.cardId),
    rarestPulls,
    productCompletion: productCompletion.map((p) => ({
      productId: p.product_id,
      name: p.name,
      owned: Number(p.owned),
      total: Number(p.total),
      pct: Number(p.total)
        ? Math.round((Number(p.owned) / Number(p.total)) * 1000) / 10
        : 0,
    })),
  };
}

/** Nav badge only — avoids shipping the full owned-card payload on every route. */
export async function getCollectionOwnedCount() {
  const user = await getDemoUser();
  const totalOwned = await prisma.userCard.count({ where: { userId: user.id } });
  return { totalOwned };
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
