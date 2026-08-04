/**
 * Client-safe visual theme registry for Draft Eleven cards.
 * Themes are defined in product JSON (sets.json visualTheme) and mirrored here
 * for CSS class / reveal animation mapping without FS access in the browser.
 */
export type RevealStyle =
  | "standard"
  | "rise"
  | "spark"
  | "electric"
  | "chrome"
  | "pulse"
  | "shadow"
  | "helix"
  | "night"
  | "grail"
  | "ink"
  | "patch"
  | "book"
  | "prism"
  | "lava"
  | "raywave"
  | "gem"
  | "trophy"
  | "hero";

export type ThemeSpec = {
  reveal: RevealStyle;
  celebrationBoost?: "glow" | "foil" | "hit" | "jackpot";
};

const THEMES: Record<string, ThemeSpec> = {
  base: { reveal: "standard" },
  refractor: { reveal: "chrome", celebrationBoost: "glow" },
  pulsar: { reveal: "pulse", celebrationBoost: "foil" },
  violet: { reveal: "prism", celebrationBoost: "foil" },
  pink: { reveal: "prism", celebrationBoost: "foil" },
  "pink-lava": { reveal: "lava", celebrationBoost: "foil" },
  "night-vision-raywave": { reveal: "raywave", celebrationBoost: "foil" },
  aqua: { reveal: "prism", celebrationBoost: "foil" },
  "aqua-lava": { reveal: "lava", celebrationBoost: "foil" },
  "neon-pink-raywave": { reveal: "raywave", celebrationBoost: "hit" },
  blue: { reveal: "prism", celebrationBoost: "foil" },
  "blue-lava": { reveal: "lava", celebrationBoost: "foil" },
  "neon-green-raywave": { reveal: "raywave", celebrationBoost: "hit" },
  green: { reveal: "prism", celebrationBoost: "foil" },
  "green-lava": { reveal: "lava", celebrationBoost: "hit" },
  magenta: { reveal: "prism", celebrationBoost: "hit" },
  "magenta-lava": { reveal: "lava", celebrationBoost: "hit" },
  toppsfractor: { reveal: "prism", celebrationBoost: "hit" },
  gold: { reveal: "chrome", celebrationBoost: "hit" },
  "gold-lava": { reveal: "lava", celebrationBoost: "hit" },
  orange: { reveal: "prism", celebrationBoost: "hit" },
  "orange-lava": { reveal: "lava", celebrationBoost: "jackpot" },
  xi: { reveal: "grail", celebrationBoost: "jackpot" },
  black: { reveal: "shadow", celebrationBoost: "jackpot" },
  "black-lava": { reveal: "lava", celebrationBoost: "jackpot" },
  red: { reveal: "prism", celebrationBoost: "jackpot" },
  "red-lava": { reveal: "lava", celebrationBoost: "jackpot" },
  "club-country": { reveal: "grail", celebrationBoost: "jackpot" },
  superfractor: { reveal: "grail", celebrationBoost: "jackpot" },

  wonderkids: { reveal: "rise", celebrationBoost: "foil" },
  golazo: { reveal: "spark", celebrationBoost: "foil" },
  "final-destination": { reveal: "night", celebrationBoost: "foil" },
  "circle-power": { reveal: "electric", celebrationBoost: "foil" },
  "high-voltage": { reveal: "electric", celebrationBoost: "hit" },
  shockwave: { reveal: "electric", celebrationBoost: "jackpot" },
  "youth-league": { reveal: "rise", celebrationBoost: "glow" },
  "white-noise": { reveal: "pulse", celebrationBoost: "hit" },
  "radiating-rookies": { reveal: "spark", celebrationBoost: "hit" },
  tifo: { reveal: "grail", celebrationBoost: "jackpot" },
  "shadow-etch": { reveal: "shadow", celebrationBoost: "jackpot" },
  helix: { reveal: "helix", celebrationBoost: "jackpot" },
  "munich-night": { reveal: "night", celebrationBoost: "jackpot" },
  "the-grail": { reveal: "grail", celebrationBoost: "jackpot" },
  "hidden-gems": { reveal: "gem", celebrationBoost: "hit" },
  amber: { reveal: "gem", celebrationBoost: "hit" },
  sapphire: { reveal: "gem", celebrationBoost: "jackpot" },
  ruby: { reveal: "gem", celebrationBoost: "jackpot" },
  trophies: { reveal: "trophy", celebrationBoost: "hit" },
  hero: { reveal: "hero", celebrationBoost: "hit" },
  "chrome-auto": { reveal: "ink", celebrationBoost: "hit" },
  "wonderkids-auto": { reveal: "ink", celebrationBoost: "hit" },
  "future-stars-auto": { reveal: "ink", celebrationBoost: "hit" },
  "marks-excellence": { reveal: "ink", celebrationBoost: "jackpot" },
  "dual-auto": { reveal: "ink", celebrationBoost: "jackpot" },
  "triple-auto": { reveal: "ink", celebrationBoost: "jackpot" },
  "quad-auto": { reveal: "ink", celebrationBoost: "jackpot" },
  "quad-pundit": { reveal: "ink", celebrationBoost: "jackpot" },
  booklet: { reveal: "book", celebrationBoost: "hit" },
  patch: { reveal: "patch", celebrationBoost: "hit" },

  // Panini Prizm Premier League themes
  "prizm-silver": { reveal: "chrome", celebrationBoost: "glow" },
  "prizm-hyper": { reveal: "prism", celebrationBoost: "foil" },
  "prizm-ice": { reveal: "prism", celebrationBoost: "foil" },
  "prizm-lazer": { reveal: "electric", celebrationBoost: "foil" },
  "prizm-mojo": { reveal: "prism", celebrationBoost: "foil" },
  "prizm-snakeskin": { reveal: "pulse", celebrationBoost: "foil" },
  "prizm-genesis": { reveal: "chrome", celebrationBoost: "hit" },
  "prizm-purple": { reveal: "prism", celebrationBoost: "foil" },
  "prizm-purple-pulsar": { reveal: "pulse", celebrationBoost: "foil" },
  "prizm-green-pulsar": { reveal: "pulse", celebrationBoost: "foil" },
  "prizm-green-ice": { reveal: "prism", celebrationBoost: "foil" },
  "prizm-blue-mosaic": { reveal: "prism", celebrationBoost: "foil" },
  "prizm-orange-mosaic": { reveal: "prism", celebrationBoost: "foil" },
  "prizm-pink-mosaic": { reveal: "prism", celebrationBoost: "foil" },
  "prizm-red-mosaic": { reveal: "prism", celebrationBoost: "foil" },
  "prizm-pink-stars": { reveal: "spark", celebrationBoost: "foil" },
  "prizm-orange-hyper": { reveal: "electric", celebrationBoost: "foil" },
  "prizm-bw-checker": { reveal: "chrome", celebrationBoost: "foil" },
  "prizm-white-sparkle": { reveal: "spark", celebrationBoost: "foil" },
  "prizm-blue": { reveal: "prism", celebrationBoost: "foil" },
  "prizm-red": { reveal: "prism", celebrationBoost: "hit" },
  "prizm-purple-mosaic": { reveal: "prism", celebrationBoost: "foil" },
  "prizm-purple-stripes": { reveal: "prism", celebrationBoost: "hit" },
  "prizm-blue-ice": { reveal: "prism", celebrationBoost: "hit" },
  "prizm-red-lazer": { reveal: "electric", celebrationBoost: "hit" },
  "prizm-purple-mojo": { reveal: "prism", celebrationBoost: "hit" },
  "prizm-red-stars": { reveal: "spark", celebrationBoost: "hit" },
  "prizm-pink-mojo": { reveal: "prism", celebrationBoost: "hit" },
  "prizm-gold": { reveal: "chrome", celebrationBoost: "hit" },
  "prizm-gold-pulsar": { reveal: "pulse", celebrationBoost: "hit" },
  "prizm-lucky": { reveal: "spark", celebrationBoost: "jackpot" },
  "prizm-shimmer-blue": { reveal: "chrome", celebrationBoost: "hit" },
  "prizm-green": { reveal: "prism", celebrationBoost: "jackpot" },
  "prizm-orange": { reveal: "prism", celebrationBoost: "hit" },
  "prizm-black": { reveal: "shadow", celebrationBoost: "jackpot" },
  "prizm-black-finite": { reveal: "grail", celebrationBoost: "jackpot" },
  "prizm-shimmer-black": { reveal: "shadow", celebrationBoost: "jackpot" },
  "prizm-brilliance": { reveal: "chrome", celebrationBoost: "foil" },
  "prizm-emergent": { reveal: "rise", celebrationBoost: "foil" },
  "prizm-fireworks": { reveal: "spark", celebrationBoost: "foil" },
  "prizm-talismen": { reveal: "night", celebrationBoost: "foil" },
  "prizm-flashback": { reveal: "helix", celebrationBoost: "foil" },
  "prizm-center-stage": { reveal: "electric", celebrationBoost: "foil" },
  "prizm-fractal": { reveal: "prism", celebrationBoost: "foil" },
  "prizm-kaleidoscopic": { reveal: "prism", celebrationBoost: "hit" },
  "prizm-sublime": { reveal: "chrome", celebrationBoost: "foil" },
  "prizm-color-blast": { reveal: "spark", celebrationBoost: "jackpot" },
  "prizm-groovy": { reveal: "pulse", celebrationBoost: "jackpot" },
  "prizm-manga": { reveal: "hero", celebrationBoost: "jackpot" },
  "prizm-signatures": { reveal: "ink", celebrationBoost: "hit" },
  "prizm-penmanship": { reveal: "ink", celebrationBoost: "hit" },
  "prizm-club-legends": { reveal: "ink", celebrationBoost: "jackpot" },
  "prizm-dual-signatures": { reveal: "ink", celebrationBoost: "jackpot" },
  "prizm-patch": { reveal: "patch", celebrationBoost: "hit" },
};

/** Map set slugs / aliases from product JSON onto theme keys. */
const SET_ALIAS: Record<string, string> = {
  "circle-of-power": "circle-power",
  "circle-of-power-high-voltage": "high-voltage",
  "circle-of-power-shockwave": "shockwave",
  "munich-at-night": "munich-night",
  "chrome-autographs": "chrome-auto",
  "wonderkids-autographs": "wonderkids-auto",
  "future-stars-autographs": "future-stars-auto",
  "marks-of-excellence": "marks-excellence",
  "chrome-dual-autographs": "dual-auto",
  "chrome-triple-autographs": "triple-auto",
  "chrome-quad-autographs": "quad-auto",
  "quad-pundit-autographs": "quad-pundit",
  "campeone-booklets": "booklet",
  "match-worn-patches": "patch",
  "hero-variations": "hero",
  "hidden-gems": "hidden-gems",
  "final-destination": "final-destination",
  "radiating-rookies": "radiating-rookies",
  "white-noise": "white-noise",
  "youth-league": "youth-league",
  "shadow-etch": "shadow-etch",
  "the-grail": "the-grail",
  // Prizm set aliases
  signatures: "prizm-signatures",
  penmanship: "prizm-penmanship",
  "club-legends-signatures": "prizm-club-legends",
  "dual-signatures": "prizm-dual-signatures",
  brilliance: "prizm-brilliance",
  emergent: "prizm-emergent",
  fireworks: "prizm-fireworks",
  talismen: "prizm-talismen",
  "prizm-flashback-2012": "prizm-flashback",
  "center-stage": "prizm-center-stage",
  fractal: "prizm-fractal",
  kaleidoscopic: "prizm-kaleidoscopic",
  sublime: "prizm-sublime",
  "color-blast": "prizm-color-blast",
  groovy: "prizm-groovy",
  manga: "prizm-manga",
  "prizm-patches": "prizm-patch",
  silver: "prizm-silver",
  purple: "prizm-purple",
  hyper: "prizm-hyper",
  ice: "prizm-ice",
  lazer: "prizm-lazer",
  mojo: "prizm-mojo",
  snakeskin: "prizm-snakeskin",
  genesis: "prizm-genesis",
  "purple-pulsar": "prizm-purple-pulsar",
  "green-pulsar": "prizm-green-pulsar",
  "green-ice": "prizm-green-ice",
  "blue-mosaic": "prizm-blue-mosaic",
  "orange-mosaic": "prizm-orange-mosaic",
  "pink-mosaic": "prizm-pink-mosaic",
  "red-mosaic": "prizm-red-mosaic",
  "pink-stars": "prizm-pink-stars",
  "orange-hyper": "prizm-orange-hyper",
  "bw-checker": "prizm-bw-checker",
  "white-sparkle": "prizm-white-sparkle",
  "purple-mosaic": "prizm-purple-mosaic",
  "purple-white-stripes": "prizm-purple-stripes",
  "blue-ice": "prizm-blue-ice",
  "red-lazer": "prizm-red-lazer",
  "purple-mojo": "prizm-purple-mojo",
  "red-stars": "prizm-red-stars",
  "pink-mojo": "prizm-pink-mojo",
  "gold-pulsar": "prizm-gold-pulsar",
  "lucky-envelopes": "prizm-lucky",
  "shimmer-blue": "prizm-shimmer-blue",
  "black-finite": "prizm-black-finite",
  "shimmer-black": "prizm-shimmer-black",
  "auto-base": "prizm-signatures",
  "case-base": "prizm-color-blast",
  "patch-base": "prizm-patch",
};

export function resolveVisualTheme(subsetSlug: string, parallelSlug: string): string {
  if (subsetSlug && subsetSlug !== "base" && THEMES[subsetSlug]) return subsetSlug;
  if (SET_ALIAS[subsetSlug] && THEMES[SET_ALIAS[subsetSlug]]) return SET_ALIAS[subsetSlug];
  if (THEMES[parallelSlug]) return parallelSlug;
  if (SET_ALIAS[parallelSlug] && THEMES[SET_ALIAS[parallelSlug]]) return SET_ALIAS[parallelSlug];
  return "base";
}

export function getThemeSpec(theme: string): ThemeSpec {
  return THEMES[theme] ?? THEMES.base;
}
