/**
 * Permanent catalog serial helpers.
 * Serials are assigned once at Card creation and stored on Card.assignedSerial.
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

/** Format a stored serial for display. Returns null when the card is not numbered. */
export function formatPermanentSerial(
  assignedSerial: number | null | undefined,
  printRun: number | null | undefined,
): string | null {
  if (printRun == null || printRun <= 0) return null;
  if (printRun === 1) return "1/1";
  if (assignedSerial == null || assignedSerial < 1 || assignedSerial > printRun) {
    return null;
  }
  return `${assignedSerial}/${printRun}`;
}

/** Parse `n/printRun` without inventing placeholders. */
export function parseSerialDisplay(serialDisplay: string | null | undefined): {
  serialNumber: number | null;
  serialDisplay: string | null;
} {
  if (!serialDisplay || serialDisplay.startsWith("?")) {
    return { serialNumber: null, serialDisplay: null };
  }
  const [rawNum, rawRun] = serialDisplay.split("/");
  const serialNumber = Number(rawNum);
  const printRun = Number(rawRun);
  if (!Number.isFinite(serialNumber) || serialNumber < 1) {
    return { serialNumber: null, serialDisplay: null };
  }
  if (Number.isFinite(printRun) && printRun === 1) {
    return { serialNumber: 1, serialDisplay: "1/1" };
  }
  if (Number.isFinite(printRun) && serialNumber > printRun) {
    return { serialNumber: null, serialDisplay: null };
  }
  return { serialNumber, serialDisplay };
}

/**
 * Resolve the permanent serial to persist on UserCard / OpeningPull.
 * Prefers the pull snapshot, then the catalog card DTO — never randomizes.
 */
export function resolvePersistSerial(pull: PullResultDTO): {
  serialNumber: number | null;
  serialDisplay: string | null;
} {
  const fromPull = parseSerialDisplay(pull.serialDisplay);
  if (fromPull.serialDisplay) return fromPull;

  const fromCard = parseSerialDisplay(pull.card.serialDisplay);
  if (fromCard.serialDisplay) return fromCard;

  // Last resort for true 1/1s if display strings were dropped.
  if (pull.card.printRun === 1 || pull.card.cardType === "ONE_OF_ONE") {
    return { serialNumber: 1, serialDisplay: "1/1" };
  }

  return {
    serialNumber: null,
    serialDisplay: formatPermanentSerial(null, pull.card.printRun),
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
