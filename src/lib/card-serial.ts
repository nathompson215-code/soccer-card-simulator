/**
 * Permanent catalog serial helpers.
 * Serials are assigned once at Card creation and stored on Card.assignedSerial.
 * Rendering must never invent or regenerate serials — only display stored values.
 */

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
