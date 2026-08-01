/**
 * Convention-based player portrait URLs.
 *
 * Drop files into `public/players/` named by player slug:
 *   public/players/{playerSlug}.webp  (preferred)
 *   public/players/{playerSlug}.jpg
 *   public/players/{playerSlug}.jpeg
 *   public/players/{playerSlug}.png
 *   public/players/{playerSlug}.svg
 *
 * Cards always receive a portrait path derived from `playerSlug`.
 * Missing files fall back to the in-component placeholder renderer —
 * no code or catalog changes needed when adding thousands of images.
 */

export const PLAYER_PORTRAIT_EXTENSIONS = [
  "webp",
  "jpg",
  "jpeg",
  "png",
  "svg",
] as const;

export type PlayerPortraitExtension = (typeof PLAYER_PORTRAIT_EXTENSIONS)[number];

/** Canonical public URL for a player's primary portrait asset. */
export function playerPortraitUrl(
  playerSlug: string,
  extension: PlayerPortraitExtension = "webp",
): string {
  const slug = sanitizePlayerSlug(playerSlug);
  return `/players/${slug}.${extension}`;
}

/** All candidate URLs to try for a player, in preference order. */
export function playerPortraitCandidates(playerSlug: string): string[] {
  const slug = sanitizePlayerSlug(playerSlug);
  return PLAYER_PORTRAIT_EXTENSIONS.map((ext) => `/players/${slug}.${ext}`);
}

/**
 * Resolve the image URL a card should request.
 * Card-specific art (`frontImageUrl`) wins when present; otherwise the
 * convention path for the player slug is used.
 */
export function resolveCardPortraitSrc(input: {
  playerSlug: string;
  frontImageUrl?: string | null;
}): string {
  if (input.frontImageUrl && input.frontImageUrl.trim()) {
    return input.frontImageUrl.trim();
  }
  return playerPortraitUrl(input.playerSlug);
}

export function sanitizePlayerSlug(playerSlug: string): string {
  return (
    playerSlug
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown"
  );
}
