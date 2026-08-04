import type { Rarity } from "@prisma/client";

/**
 * Estimated secondary-market value (in cents) for a card.
 *
 * This is the single shared pricing model reused by the seed for every product
 * (Topps Chrome, Panini Prizm, …) and every card type — base, parallel,
 * numbered, autograph, and memorabilia. Value scales with rarity, print run
 * scarcity, player tier, and card age. Do not fork this per product.
 */
export function estimateValueCents(
  rarity: Rarity,
  printRun: number | null,
  year: number,
  tier?: string,
): number {
  const base: Record<Rarity, number> = {
    COMMON: 35,
    UNCOMMON: 275,
    RARE: 1400,
    ULTRA_RARE: 5200,
    MYTHIC: 22000,
    LEGENDARY: 90000,
  };
  let value = base[rarity];
  if (printRun === 1) value *= 28;
  else if (printRun && printRun <= 10) value *= 9;
  else if (printRun && printRun <= 25) value *= 4.5;
  else if (printRun && printRun <= 99) value *= 2.2;
  else if (printRun && printRun <= 299) value *= 1.35;

  const tierBoost: Record<string, number> = {
    legend: 1.8,
    star: 1.45,
    rookie: 1.35,
    veteran: 1.15,
    common: 1,
  };
  value *= tierBoost[tier ?? "common"] ?? 1;
  const ageBoost = Math.max(1, (2026 - year) * 0.03 + 1);
  return Math.round(value * ageBoost);
}
