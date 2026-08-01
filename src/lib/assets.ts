/**
 * Convention-based public asset paths for Draft Eleven.
 * Prefer DB image fields when set; helpers build the standard paths for seeding
 * and uploads so thousands of files can be added without code changes.
 *
 * See docs/ASSETS.md for the full naming and upload guide.
 */

export const ASSET_ROOT = {
  players: "/players",
  cards: "/cards",
  products: "/products",
  manufacturers: "/manufacturers",
  clubs: "/clubs",
  nationalTeams: "/national-teams",
  logos: "/logos",
} as const;

/** Preferred extensions when resolving files on disk (seed / tooling). */
export const ASSET_EXTENSIONS = ["webp", "jpg", "jpeg", "png", "svg"] as const;

export type AssetKind = keyof typeof ASSET_ROOT;

/** Public URL for a player portrait: /players/{slug}.webp */
export function playerImagePath(slug: string, ext = "webp"): string {
  return `${ASSET_ROOT.players}/${slug}.${ext}`;
}

export function playerImageHdPath(slug: string, ext = "webp"): string {
  return `${ASSET_ROOT.players}/${slug}@2x.${ext}`;
}

/** Card art lives in a folder named after the unique card slug. */
export function cardFrontPath(cardSlug: string, ext = "webp"): string {
  return `${ASSET_ROOT.cards}/${cardSlug}/front.${ext}`;
}

export function cardBackPath(cardSlug: string, ext = "webp"): string {
  return `${ASSET_ROOT.cards}/${cardSlug}/back.${ext}`;
}

export function cardFrontHdPath(cardSlug: string, ext = "webp"): string {
  return `${ASSET_ROOT.cards}/${cardSlug}/front@2x.${ext}`;
}

export function cardBackHdPath(cardSlug: string, ext = "webp"): string {
  return `${ASSET_ROOT.cards}/${cardSlug}/back@2x.${ext}`;
}

export function productImagePath(slug: string, ext = "webp"): string {
  return `${ASSET_ROOT.products}/${slug}.${ext}`;
}

export function productPackImagePath(slug: string, ext = "webp"): string {
  return `${ASSET_ROOT.products}/${slug}-pack.${ext}`;
}

export function productBoxImagePath(slug: string, ext = "webp"): string {
  return `${ASSET_ROOT.products}/${slug}-box.${ext}`;
}

export function manufacturerLogoPath(slug: string, ext = "webp"): string {
  return `${ASSET_ROOT.manufacturers}/${slug}.${ext}`;
}

export function clubLogoPath(slug: string, ext = "webp"): string {
  return `${ASSET_ROOT.clubs}/${slug}.${ext}`;
}

export function nationalTeamLogoPath(slug: string, ext = "webp"): string {
  return `${ASSET_ROOT.nationalTeams}/${slug}.${ext}`;
}

export function brandLogoPath(slug: string, ext = "webp"): string {
  return `${ASSET_ROOT.logos}/${slug}.${ext}`;
}

/** Prefer explicit URL, then fall back to a convention path when provided. */
export function coalesceAssetUrl(
  stored: string | null | undefined,
  conventionFallback?: string | null,
): string | null {
  if (stored && stored.trim()) return stored.trim();
  if (conventionFallback && conventionFallback.trim()) return conventionFallback.trim();
  return null;
}

export function hasAuthorizedCardArt(frontImageUrl: string | null | undefined): boolean {
  return Boolean(frontImageUrl && frontImageUrl.trim());
}

/** Build a srcSet for 1x + optional 2x assets. */
export function imageSrcSet(
  url: string | null | undefined,
  hdUrl: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  if (hdUrl) return `${url} 1x, ${hdUrl} 2x`;
  return undefined;
}
