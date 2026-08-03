/**
 * Recompute Card.estimatedValueCents from the shared market-value model
 * without wiping the database. Safe to re-run after formula changes.
 *
 * Usage: npx tsx scripts/reprice-cards.ts
 */

import { PrismaClient } from "@prisma/client";
import { estimateMarketValueCents } from "../src/lib/market-value";

const prisma = new PrismaClient();

function tierFromNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/tier:([a-z]+)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

async function main() {
  const cards = await prisma.card.findMany({
    include: {
      parallel: true,
      checklistEntry: {
        include: {
          cardSet: { include: { product: true } },
        },
      },
    },
  });

  let updated = 0;
  let unchanged = 0;

  for (const card of cards) {
    const next = estimateMarketValueCents({
      rarity: card.parallel.rarity,
      cardType: card.parallel.cardType,
      printRun: card.parallel.printRun,
      year: card.checklistEntry.cardSet.product.year,
      playerTier: tierFromNotes(card.checklistEntry.notes),
    });
    if (next === card.estimatedValueCents) {
      unchanged += 1;
      continue;
    }
    await prisma.card.update({
      where: { id: card.id },
      data: { estimatedValueCents: next },
    });
    updated += 1;
  }

  const sample = await prisma.card.findMany({
    take: 8,
    orderBy: { estimatedValueCents: "desc" },
    include: {
      parallel: true,
      checklistEntry: { include: { player: true } },
    },
  });

  const commons = await prisma.card.findMany({
    where: { parallel: { rarity: "COMMON", cardType: "BASE" } },
    take: 5,
    orderBy: { estimatedValueCents: "desc" },
    include: { parallel: true, checklistEntry: { include: { player: true } } },
  });

  console.log(
    JSON.stringify(
      {
        total: cards.length,
        updated,
        unchanged,
        top: sample.map((c) => ({
          player: c.checklistEntry.player.fullName,
          parallel: c.parallel.name,
          type: c.parallel.cardType,
          rarity: c.parallel.rarity,
          printRun: c.parallel.printRun,
          usd: `$${(c.estimatedValueCents / 100).toFixed(2)}`,
        })),
        sampleCommons: commons.map((c) => ({
          player: c.checklistEntry.player.fullName,
          usd: `$${(c.estimatedValueCents / 100).toFixed(2)}`,
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
