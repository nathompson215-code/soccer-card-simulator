/**
 * Estimated market values for cards.
 *
 * Values are stored on `Card.estimatedValueCents` (source of truth for UI).
 * This module is the only place that *computes* estimates so a future real
 * pricing API can replace `estimateMarketValueCents` without touching UI.
 */

import type { CardType, Rarity } from "@prisma/client";

export type PlayerValueTier = "common" | "veteran" | "star" | "rookie" | "legend";

export type MarketValueInput = {
  rarity: Rarity;
  cardType: CardType;
  printRun: number | null;
  year: number;
  /** Checklist player tier from product config (optional). */
  playerTier?: string | null;
};

/** Pluggable pricing source — swap for live comps later. */
export type MarketValueProvider = {
  estimateCents(input: MarketValueInput): number;
};

const RARITY_BASE_CENTS: Record<Rarity, number> = {
  // Commons stay under ~$1 before star/print multipliers
  COMMON: 45,
  // Stars / nice inserts land in the $1–10 band after tier
  UNCOMMON: 220,
  RARE: 950,
  ULTRA_RARE: 4200,
  MYTHIC: 18500,
  LEGENDARY: 78000,
};

const TIER_MULT: Record<string, number> = {
  common: 1,
  veteran: 1.2,
  star: 1.65,
  rookie: 1.45,
  legend: 2.15,
};

/** Premium finishes command higher street prices. */
function cardTypeMultiplier(cardType: CardType): number {
  switch (cardType) {
    case "BOOKLET":
      return 7.5;
    case "ONE_OF_ONE":
      return 6;
    case "QUAD_AUTOGRAPH":
      return 5.5;
    case "TRIPLE_AUTOGRAPH":
      return 4.8;
    case "DUAL_AUTOGRAPH":
      return 4.2;
    case "AUTOGRAPH":
      return 3.6;
    case "CASE_HIT":
      return 2.4;
    case "PATCH":
    case "JUMBO_PATCH":
    case "SHIELD_PATCH":
    case "LOGO_PATCH":
    case "RELIC":
    case "MEMORABILIA":
    case "CLEAT_RELIC":
    case "LAUNDRY_TAG":
      return 2.1;
    case "PRINTING_PLATE":
      return 2.8;
    case "REFRACTOR":
    case "IMAGE_VARIATION":
      return 1.35;
    case "INSERT":
    case "SP":
    case "SSP":
      return 1.25;
    case "PARALLEL":
      return 1.15;
    case "BASE":
    default:
      return 1;
  }
}

function printRunMultiplier(printRun: number | null): number {
  if (printRun == null) return 1;
  if (printRun <= 1) return 18;
  if (printRun <= 5) return 10;
  if (printRun <= 10) return 7;
  if (printRun <= 25) return 4.2;
  if (printRun <= 50) return 2.8;
  if (printRun <= 99) return 2.1;
  if (printRun <= 150) return 1.65;
  if (printRun <= 299) return 1.35;
  if (printRun <= 499) return 1.18;
  return 1.05;
}

function ageMultiplier(year: number, asOfYear = 2026): number {
  return Math.max(1, (asOfYear - year) * 0.028 + 1);
}

/**
 * Deterministic estimate used at seed / reprice time.
 * UI should read `Card.estimatedValueCents`, not call this live.
 */
export function estimateMarketValueCents(input: MarketValueInput): number {
  const rarityBase = RARITY_BASE_CENTS[input.rarity] ?? RARITY_BASE_CENTS.COMMON;
  const tierKey = (input.playerTier ?? "common").toLowerCase();
  const tierMult = TIER_MULT[tierKey] ?? 1;

  const raw =
    rarityBase *
    cardTypeMultiplier(input.cardType) *
    printRunMultiplier(input.printRun) *
    tierMult *
    ageMultiplier(input.year);

  // Floor: even junk commons stay a few cents; ceiling keeps outliers sane
  return Math.max(15, Math.min(Math.round(raw), 7_500_000));
}

export const defaultMarketValueProvider: MarketValueProvider = {
  estimateCents: estimateMarketValueCents,
};

export function sumMarketValueCents(
  values: Array<{ estimatedValueCents: number } | number>,
): number {
  let sum = 0;
  for (const row of values) {
    const cents = typeof row === "number" ? row : row.estimatedValueCents;
    if (Number.isFinite(cents)) sum += cents;
  }
  return sum;
}
