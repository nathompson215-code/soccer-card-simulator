import { PrismaClient } from "@prisma/client";
import { openBoxFromDb } from "../src/lib/pack-engine";

async function main() {
  const prisma = new PrismaClient();
  const product = await prisma.product.findFirst({ where: { slug: "topps-chrome-ucl-2024-25" } });
  if (!product) throw new Error("missing product");

  for (const seed of [42, 1, 7, 99, 1234]) {
    const { packs, summary } = await openBoxFromDb(product.id, seed);
    const all = packs.flatMap((p) => p.cards);
    const baseCards = all.filter((p) => p.card.parallelSlug === "base").length;
    console.log(
      `seed=${seed} packs=${packs.length} cards=${all.length} base=${baseCards} hits=${summary.hitCount}`,
      summary.guarantees.map((g) => `${g.id}:${g.actual}/${g.expected}`).join(" "),
      "rarities",
      summary.rarityCounts,
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
