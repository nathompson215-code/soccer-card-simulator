/**
 * Convention-based player photograph URLs.
 *
 * Drop licensed / authorized player photos into `public/players/`:
 *   public/players/{playerSlug}.webp  (preferred)
 *   public/players/{playerSlug}.jpg
 *   public/players/{playerSlug}.jpeg
 *   public/players/{playerSlug}.png
 *
 * Card-specific art (`frontImageUrl`) wins when set. Missing files fall
 * through to the generic non-illustrated placeholder in PlayerPortrait —
 * no catalog or pack-engine changes required when adding images at scale.
 */

/** Raster photo extensions only — never SVG illustrations. */
export const PLAYER_PHOTO_EXTENSIONS = ["jpg", "webp", "jpeg", "png"] as const;

export type PlayerPhotoExtension = (typeof PLAYER_PHOTO_EXTENSIONS)[number];

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

/** Canonical public URL for a player's primary photograph. */
export function playerPhotoUrl(
  playerSlug: string,
  extension: PlayerPhotoExtension = "jpg",
): string {
  return `/players/${sanitizePlayerSlug(playerSlug)}.${extension}`;
}

/** Candidate photo URLs to try, in preference order. */
export function playerPhotoCandidates(playerSlug: string): string[] {
  const slug = sanitizePlayerSlug(playerSlug);
  return PLAYER_PHOTO_EXTENSIONS.map((ext) => `/players/${slug}.${ext}`);
}

/**
 * Resolve the preferred photograph for a card portrait.
 * Explicit card front art wins; otherwise the player-slug convention path.
 */
export function resolveCardPlayerPhotoSrc(input: {
  playerSlug: string;
  frontImageUrl?: string | null;
}): string {
  if (input.frontImageUrl?.trim()) {
    return input.frontImageUrl.trim();
  }
  return playerPhotoUrl(input.playerSlug);
}
