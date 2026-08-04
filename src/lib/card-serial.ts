/**
 * Permanent catalog serial helpers.
 * Serials are assigned once (Card.assignedSerial / UserCard) and reused everywhere.
 * Rendering must never invent or regenerate serials — only display stored values.
 */

import type { PullResultDTO } from "@/lib/types";

/** Stable 1..printRun serial from an opaque id/slug (used at card creation / backfill). */
export function assignSerialFromId(id: string, printRun: number): number {
  if (printRun <= 0) {
    throw new Error(`printRun must be positive, got ${printRun}`);
  }
  if (printRun === 1) return 1;
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Math.abs(h >>> 0) % printRun) + 1;
}

/**
 * Coerce a serial into a valid 1..serialTotal integer.
 * - serialTotal === 1 → always 1
 * - missing / 0 / invalid / out of range → stable assign from id
 */
export function coerceSerialNumber(
  serialNumber: number | null | undefined,
  serialTotal: number,
  stableId: string,
): number {
  if (serialTotal <= 0) {
    throw new Error(`serialTotal must be positive, got ${serialTotal}`);
  }
  if (serialTotal === 1) return 1;
  if (
    serialNumber != null &&
    Number.isFinite(serialNumber) &&
    Number.isInteger(serialNumber) &&
    serialNumber >= 1 &&
    serialNumber <= serialTotal
  ) {
    return serialNumber;
  }
  return assignSerialFromId(stableId, serialTotal);
}

/** Format n/total. Never returns ?/ placeholders for numbered cards when stableId is provided. */
export function formatPermanentSerial(
  assignedSerial: number | null | undefined,
  printRun: number | null | undefined,
  stableId?: string | null,
): string | null {
  if (printRun == null || printRun <= 0) return null;
  if (printRun === 1) return "1/1";
  if (
    assignedSerial != null &&
    Number.isInteger(assignedSerial) &&
    assignedSerial >= 1 &&
    assignedSerial <= printRun
  ) {
    return `${assignedSerial}/${printRun}`;
  }
  if (stableId) {
    return `${assignSerialFromId(stableId, printRun)}/${printRun}`;
  }
  return null;
}

/** Resolve catalog serial for a numbered card (always valid when printRun is set). */
export function resolveCatalogSerial(params: {
  assignedSerial?: number | null;
  printRun: number | null | undefined;
  stableId: string;
}): { serialNumber: number; serialDisplay: string } | null {
  const { assignedSerial, printRun, stableId } = params;
  if (printRun == null || printRun <= 0) return null;
  const serialNumber = coerceSerialNumber(assignedSerial, printRun, stableId);
  return {
    serialNumber,
    serialDisplay: printRun === 1 ? "1/1" : `${serialNumber}/${printRun}`,
  };
}

/** Parse `n/printRun` without inventing placeholders. Rejects ?/ and invalid values. */
export function parseSerialDisplay(serialDisplay: string | null | undefined): {
  serialNumber: number | null;
  serialDisplay: string | null;
  printRun: number | null;
} {
  if (!serialDisplay || serialDisplay.startsWith("?")) {
    return { serialNumber: null, serialDisplay: null, printRun: null };
  }
  const [rawNum, rawRun] = serialDisplay.split("/");
  const serialNumber = Number(rawNum);
  const printRun = Number(rawRun);
  if (!Number.isFinite(serialNumber) || !Number.isInteger(serialNumber) || serialNumber < 1) {
    return { serialNumber: null, serialDisplay: null, printRun: null };
  }
  if (!Number.isFinite(printRun) || !Number.isInteger(printRun) || printRun < 1) {
    return { serialNumber: null, serialDisplay: null, printRun: null };
  }
  if (printRun === 1) {
    return { serialNumber: 1, serialDisplay: "1/1", printRun: 1 };
  }
  if (serialNumber > printRun) {
    return { serialNumber: null, serialDisplay: null, printRun };
  }
  return { serialNumber, serialDisplay: `${serialNumber}/${printRun}`, printRun };
}

/**
 * Resolve the permanent serial to persist on UserCard / OpeningPull.
 * Numbered cards always receive a valid n/total — never ?/ or null.
 */
export function resolvePersistSerial(pull: PullResultDTO): {
  serialNumber: number | null;
  serialDisplay: string | null;
} {
  const printRun = pull.card.printRun;
  if (printRun == null || printRun <= 0) {
    return { serialNumber: null, serialDisplay: null };
  }

  const fromPull = parseSerialDisplay(pull.serialDisplay);
  const fromCard = parseSerialDisplay(pull.card.serialDisplay);
  const candidate =
    fromPull.serialNumber ??
    fromCard.serialNumber ??
    null;

  const serialNumber = coerceSerialNumber(candidate, printRun, pull.card.id);
  return {
    serialNumber,
    serialDisplay: printRun === 1 ? "1/1" : `${serialNumber}/${printRun}`,
  };
}

export function buildUserCardPersistData(
  userId: string,
  productId: string,
  pull: PullResultDTO,
) {
  const serial = resolvePersistSerial(pull);
  return {
    userId,
    cardId: pull.card.id,
    productId,
    serialNumber: serial.serialNumber,
    serialDisplay: serial.serialDisplay,
  };
}

export function buildOpeningPullPersistData(
  pull: PullResultDTO,
  packIndex: number,
  slotIndex: number,
  userCardId: string | null,
) {
  const serial = resolvePersistSerial(pull);
  return {
    cardId: pull.card.id,
    userCardId,
    packIndex,
    slotIndex,
    serialNumber: serial.serialNumber,
    serialDisplay: serial.serialDisplay,
    valueCentsAtOpen: pull.card.estimatedValueCents,
    isHit: pull.isHit,
    celebration: pull.celebration,
    isNew: Boolean(pull.isNew),
  };
}
