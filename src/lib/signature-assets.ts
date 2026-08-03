/**
 * Convention-based licensed signature assets.
 *
 * Drop transparent signature scans into `public/signatures/`:
 *   public/signatures/{playerSlug}.png  (preferred — transparent ink)
 *   public/signatures/{playerSlug}.webp
 *   public/signatures/{playerSlug}.svg
 *
 * Never invent handwritten text. Missing files → "awaiting licensed signature".
 */

import { sanitizePlayerSlug } from "@/lib/player-assets";

export const SIGNATURE_EXTENSIONS = ["png", "webp", "svg"] as const;

export type SignatureExtension = (typeof SIGNATURE_EXTENSIONS)[number];

export function signatureAssetUrl(
  playerSlug: string,
  extension: SignatureExtension = "png",
): string {
  return `/signatures/${sanitizePlayerSlug(playerSlug)}.${extension}`;
}

export function signatureAssetCandidates(playerSlug: string): string[] {
  const slug = sanitizePlayerSlug(playerSlug);
  return SIGNATURE_EXTENSIONS.map((ext) => `/signatures/${slug}.${ext}`);
}

/** Deterministic blue vs black ink from player slug. */
export function signatureInkColor(playerSlug: string): "blue" | "black" {
  let h = 2166136261;
  const s = sanitizePlayerSlug(playerSlug);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2 === 0 ? "blue" : "black";
}

/** Small natural rotation in degrees (−7 … +8). */
export function signatureRotationDeg(playerSlug: string): number {
  let h = 2166136261;
  const s = sanitizePlayerSlug(playerSlug);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 16) - 7;
}
