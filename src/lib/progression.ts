import type { OpeningMode } from "@prisma/client";
import {
  ACHIEVEMENT_BY_KEY,
  ACHIEVEMENT_DEFINITIONS,
  COLLECTION_MILESTONES,
  isAutographType,
  isBookletType,
  isOneOfOne,
  milestoneKey,
  type AchievementKey,
} from "@/lib/achievements";
import { prisma } from "@/lib/db";
import { cardInclude, toCardDTO } from "@/lib/mappers";
import { getDemoUser } from "@/lib/queries";
import type {
  AchievementDTO,
  Celebration,
  LifetimeStatsDTO,
  OpeningDTO,
  OpeningPullDTO,
  PackResultDTO,
  ProgressionDTO,
  PullResultDTO,
} from "@/lib/types";

function toOpeningPullDTO(row: {
  id: string;
  packIndex: number;
  slotIndex: number;
  serialDisplay: string | null;
  valueCentsAtOpen: number;
  isHit: boolean;
  celebration: string;
  isNew: boolean;
  card: Parameters<typeof toCardDTO>[0];
}): OpeningPullDTO {
  return {
    id: row.id,
    packIndex: row.packIndex,
    slotIndex: row.slotIndex,
    serialDisplay: row.serialDisplay,
    valueCentsAtOpen: row.valueCentsAtOpen,
    isHit: row.isHit,
    celebration: (row.celebration as Celebration) || "none",
    isNew: row.isNew,
    card: toCardDTO(row.card),
  };
}

function toOpeningDTO(
  opening: {
    id: string;
    mode: OpeningMode;
    openedAt: Date;
    packCount: number;
    cardCount: number;
    totalValueCents: number;
    biggestHitValueCents: number;
    product: {
      id: string;
      slug: string;
      name: string;
      accentHex: string | null;
      year: number;
    };
    pulls: Array<{
      id: string;
      packIndex: number;
      slotIndex: number;
      serialDisplay: string | null;
      valueCentsAtOpen: number;
      isHit: boolean;
      celebration: string;
      isNew: boolean;
      card: Parameters<typeof toCardDTO>[0];
    }>;
  },
  includeAllPulls = true,
): OpeningDTO {
  const pulls = opening.pulls.map(toOpeningPullDTO);
  const biggestHit =
    pulls.length === 0
      ? null
      : [...pulls].sort((a, b) => b.valueCentsAtOpen - a.valueCentsAtOpen)[0] ?? null;

  return {
    id: opening.id,
    mode: opening.mode === "BOX" ? "box" : "pack",
    openedAt: opening.openedAt.toISOString(),
    packCount: opening.packCount,
    cardCount: opening.cardCount,
    totalValueCents: opening.totalValueCents,
    biggestHitValueCents: opening.biggestHitValueCents,
    product: {
      id: opening.product.id,
      slug: opening.product.slug,
      name: opening.product.name,
      accentHex: opening.product.accentHex,
      year: opening.product.year,
    },
    biggestHit,
    pulls: includeAllPulls ? pulls : biggestHit ? [biggestHit] : [],
  };
}

const openingInclude = {
  product: {
    select: {
      id: true,
      slug: true,
      name: true,
      accentHex: true,
      year: true,
    },
  },
  pulls: {
    include: { card: { include: cardInclude } },
    orderBy: [{ packIndex: "asc" as const }, { slotIndex: "asc" as const }],
  },
};

export async function saveOpeningSession(params: {
  userId: string;
  productId: string;
  mode: "pack" | "box";
  packs: PackResultDTO[];
  userCardIds: string[];
}) {
  const flat: Array<{
    pull: PullResultDTO;
    packIndex: number;
    slotIndex: number;
    userCardId: string | null;
  }> = [];

  let userCardCursor = 0;
  for (const pack of params.packs) {
    pack.cards.forEach((pull, slotIndex) => {
      flat.push({
        pull,
        packIndex: pack.packIndex,
        slotIndex,
        userCardId: params.userCardIds[userCardCursor] ?? null,
      });
      userCardCursor += 1;
    });
  }

  const totalValueCents = flat.reduce((s, row) => s + row.pull.card.estimatedValueCents, 0);
  const biggestHitValueCents = flat.reduce(
    (max, row) => Math.max(max, row.pull.card.estimatedValueCents),
    0,
  );

  const opening = await prisma.opening.create({
    data: {
      userId: params.userId,
      productId: params.productId,
      mode: params.mode === "box" ? "BOX" : "PACK",
      packCount: params.packs.length,
      cardCount: flat.length,
      totalValueCents,
      biggestHitValueCents,
      pulls: {
        create: flat.map((row) => {
          const serialNumber = row.pull.serialDisplay
            ? Number(row.pull.serialDisplay.split("/")[0])
            : null;
          return {
            cardId: row.pull.card.id,
            userCardId: row.userCardId,
            packIndex: row.packIndex,
            slotIndex: row.slotIndex,
            serialNumber: Number.isFinite(serialNumber) ? serialNumber : null,
            serialDisplay: row.pull.serialDisplay,
            valueCentsAtOpen: row.pull.card.estimatedValueCents,
            isHit: row.pull.isHit,
            celebration: row.pull.celebration,
            isNew: Boolean(row.pull.isNew),
          };
        }),
      },
    },
    include: openingInclude,
  });

  return opening;
}

async function hasCompletedAnyBaseSet(userId: string): Promise<{
  complete: boolean;
  productName?: string;
}> {
  const rows = await prisma.$queryRaw<
    Array<{ product_id: string; product_name: string; owned: bigint; total: bigint }>
  >`
    SELECT p.id as product_id, p.name as product_name,
      COUNT(DISTINCT CASE WHEN uc.id IS NOT NULL THEN c.id END)::bigint as owned,
      COUNT(DISTINCT c.id)::bigint as total
    FROM "CardSet" cs
    JOIN "Product" p ON p.id = cs."productId"
    LEFT JOIN "ChecklistEntry" ce ON ce."cardSetId" = cs.id
    LEFT JOIN "Card" c ON c."checklistEntryId" = ce.id
    LEFT JOIN "UserCard" uc ON uc."cardId" = c.id AND uc."userId" = ${userId}
    WHERE cs."setType" = 'BASE'
    GROUP BY p.id, p.name, cs.id
    HAVING COUNT(DISTINCT c.id) > 0
      AND COUNT(DISTINCT CASE WHEN uc.id IS NOT NULL THEN c.id END) >= COUNT(DISTINCT c.id)
    LIMIT 1
  `;

  if (!rows.length) return { complete: false };
  return { complete: true, productName: rows[0].product_name };
}

export async function evaluateAchievements(params: {
  userId: string;
  openingId: string;
  pulls: PullResultDTO[];
}): Promise<AchievementDTO[]> {
  const existing = await prisma.userAchievement.findMany({
    where: { userId: params.userId },
    select: { achievementKey: true },
  });
  const ownedKeys = new Set(existing.map((e) => e.achievementKey));

  const candidates: Array<{ key: AchievementKey; meta?: Record<string, unknown> }> = [];

  const hadAutoBefore = ownedKeys.has("first_autograph");
  const hadNumberedBefore = ownedKeys.has("first_numbered");
  const hadBookletBefore = ownedKeys.has("first_booklet");
  const hadOneOfOneBefore = ownedKeys.has("first_one_of_one");

  for (const pull of params.pulls) {
    if (!hadAutoBefore && isAutographType(pull.card.cardType)) {
      candidates.push({
        key: "first_autograph",
        meta: { playerName: pull.card.playerName, cardSlug: pull.card.slug },
      });
    }
    if (!hadNumberedBefore && pull.card.printRun) {
      candidates.push({
        key: "first_numbered",
        meta: {
          playerName: pull.card.playerName,
          serialDisplay: pull.serialDisplay,
          cardSlug: pull.card.slug,
        },
      });
    }
    if (!hadBookletBefore && isBookletType(pull.card.cardType, pull.card.setType)) {
      candidates.push({
        key: "first_booklet",
        meta: { playerName: pull.card.playerName, cardSlug: pull.card.slug },
      });
    }
    if (!hadOneOfOneBefore && isOneOfOne(pull.card.cardType, pull.card.printRun)) {
      candidates.push({
        key: "first_one_of_one",
        meta: { playerName: pull.card.playerName, cardSlug: pull.card.slug },
      });
    }
  }

  if (!ownedKeys.has("complete_base_set")) {
    const base = await hasCompletedAnyBaseSet(params.userId);
    if (base.complete) {
      candidates.push({
        key: "complete_base_set",
        meta: { productName: base.productName },
      });
    }
  }

  const uniqueOwned = await prisma.userCard.findMany({
    where: { userId: params.userId },
    distinct: ["cardId"],
    select: { cardId: true },
  });
  const uniqueCount = uniqueOwned.length;
  for (const n of COLLECTION_MILESTONES) {
    const key = milestoneKey(n);
    if (!ownedKeys.has(key) && uniqueCount >= n) {
      candidates.push({ key, meta: { uniqueOwned: uniqueCount } });
    }
  }

  // Deduplicate candidate keys (first qualifying pull wins meta)
  const seen = new Set<string>();
  const uniqueCandidates = candidates.filter((c) => {
    if (seen.has(c.key) || ownedKeys.has(c.key)) return false;
    seen.add(c.key);
    return true;
  });

  if (!uniqueCandidates.length) return [];

  const created = await prisma.$transaction(
    uniqueCandidates.map((c) =>
      prisma.userAchievement.create({
        data: {
          userId: params.userId,
          achievementKey: c.key,
          openingId: params.openingId,
          metaJson: c.meta ? JSON.stringify(c.meta) : null,
        },
      }),
    ),
  );

  return created.map((row) => {
    const def = ACHIEVEMENT_BY_KEY[row.achievementKey as AchievementKey];
    return {
      key: row.achievementKey,
      title: def?.title ?? row.achievementKey,
      description: def?.description ?? "",
      mark: def?.mark ?? "+",
      unlocked: true,
      unlockedAt: row.unlockedAt.toISOString(),
      metaJson: row.metaJson,
    };
  });
}

async function loadLifetimeStats(userId: string): Promise<LifetimeStatsDTO> {
  const [
    packsOpened,
    boxesOpened,
    totalCardsPulled,
    uniqueOwned,
    collectionValue,
    bestPullRow,
    bestValueOpeningRow,
    biggestHitOpeningRow,
    specialtyCounts,
  ] = await Promise.all([
    prisma.opening.count({ where: { userId, mode: "PACK" } }),
    prisma.opening.count({ where: { userId, mode: "BOX" } }),
    prisma.openingPull.count({ where: { opening: { userId } } }),
    prisma.userCard.findMany({
      where: { userId },
      distinct: ["cardId"],
      select: { cardId: true },
    }),
    prisma.userCard.findMany({
      where: { userId },
      select: { card: { select: { estimatedValueCents: true } } },
    }),
    prisma.openingPull.findFirst({
      where: { opening: { userId } },
      orderBy: { valueCentsAtOpen: "desc" },
      include: { card: { include: cardInclude } },
    }),
    prisma.opening.findFirst({
      where: { userId },
      orderBy: { totalValueCents: "desc" },
      include: openingInclude,
    }),
    prisma.opening.findFirst({
      where: { userId },
      orderBy: { biggestHitValueCents: "desc" },
      include: openingInclude,
    }),
    prisma.$queryRaw<
      Array<{
        autographs: bigint;
        numbered: bigint;
        booklets: bigint;
        one_of_ones: bigint;
      }>
    >`
      SELECT
        COUNT(*) FILTER (
          WHERE p."cardType"::text LIKE '%AUTOGRAPH%'
        )::bigint as autographs,
        COUNT(*) FILTER (
          WHERE p."printRun" IS NOT NULL OR n."printRun" IS NOT NULL
        )::bigint as numbered,
        COUNT(*) FILTER (
          WHERE p."cardType"::text = 'BOOKLET' OR cs."setType"::text = 'BOOKLET'
        )::bigint as booklets,
        COUNT(*) FILTER (
          WHERE p."cardType"::text = 'ONE_OF_ONE'
            OR COALESCE(n."printRun", p."printRun") = 1
        )::bigint as one_of_ones
      FROM "OpeningPull" op
      JOIN "Opening" o ON o.id = op."openingId"
      JOIN "Card" c ON c.id = op."cardId"
      JOIN "Parallel" p ON p.id = c."parallelId"
      JOIN "ChecklistEntry" ce ON ce.id = c."checklistEntryId"
      JOIN "CardSet" cs ON cs.id = ce."cardSetId"
      LEFT JOIN "NumberingSpec" n ON n."cardId" = c.id
      WHERE o."userId" = ${userId}
    `,
  ]);

  const specialty = specialtyCounts[0];

  return {
    packsOpened,
    boxesOpened,
    totalCardsPulled,
    uniqueCardsOwned: uniqueOwned.length,
    autographsPulled: Number(specialty?.autographs ?? 0),
    numberedCardsPulled: Number(specialty?.numbered ?? 0),
    bookletsPulled: Number(specialty?.booklets ?? 0),
    oneOfOnesPulled: Number(specialty?.one_of_ones ?? 0),
    estimatedCollectionValueCents: collectionValue.reduce(
      (s, row) => s + row.card.estimatedValueCents,
      0,
    ),
    bestPull: bestPullRow ? toOpeningPullDTO(bestPullRow) : null,
    bestValueOpening: bestValueOpeningRow
      ? toOpeningDTO(bestValueOpeningRow, false)
      : null,
    biggestHitOpening: biggestHitOpeningRow
      ? toOpeningDTO(biggestHitOpeningRow, false)
      : null,
  };
}

async function loadAchievements(userId: string): Promise<AchievementDTO[]> {
  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: "asc" },
  });
  const byKey = new Map(unlocked.map((u) => [u.achievementKey, u]));

  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    const row = byKey.get(def.key);
    return {
      key: def.key,
      title: def.title,
      description: def.description,
      mark: def.mark,
      unlocked: Boolean(row),
      unlockedAt: row?.unlockedAt.toISOString() ?? null,
      metaJson: row?.metaJson ?? null,
    };
  });
}

export async function getProgression(limit = 40): Promise<ProgressionDTO> {
  const user = await getDemoUser();
  const [stats, achievements, openings] = await Promise.all([
    loadLifetimeStats(user.id),
    loadAchievements(user.id),
    prisma.opening.findMany({
      where: { userId: user.id },
      orderBy: { openedAt: "desc" },
      take: limit,
      include: openingInclude,
    }),
  ]);

  return {
    stats,
    achievements,
    openings: openings.map((o) => toOpeningDTO(o, true)),
  };
}

