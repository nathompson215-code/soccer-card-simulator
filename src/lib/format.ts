import type { CardType, ProductFormat, Rarity } from "@prisma/client";

export function formatMoney(cents: number): string {
  const value = cents / 100;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  if (value >= 100) return `$${Math.round(value)}`;
  return `$${value.toFixed(2)}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function rarityLabel(rarity: Rarity | string): string {
  return String(rarity)
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function cardTypeLabel(type: CardType | string): string {
  return String(type)
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatLabel(format: ProductFormat | string): string {
  return String(format)
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Resolve on-card / detail serial text.
 * One-of-ones (print run or denominator 1) always display exactly `1/1`.
 */
export function resolveSerialDisplay(
  serialDisplay: string | null | undefined,
  printRun: number | null | undefined,
): string | null {
  const raw = serialDisplay?.trim() ?? "";
  const denomFromSerial = raw.includes("/") ? Number(raw.split("/").pop()) : Number.NaN;
  const serialTotal =
    printRun === 1
      ? 1
      : Number.isFinite(denomFromSerial) && denomFromSerial === 1
        ? 1
        : (printRun ?? (Number.isFinite(denomFromSerial) ? denomFromSerial : null));

  if (serialTotal === 1) {
    return "1/1";
  }

  if (raw && !raw.startsWith("?")) {
    return raw;
  }

  if (printRun != null && printRun > 1) {
    return `?/${printRun}`;
  }

  return raw || null;
}
