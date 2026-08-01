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
};

export function resolveVisualTheme(subsetSlug: string, parallelSlug: string): string {
  if (subsetSlug && subsetSlug !== "base" && THEMES[subsetSlug]) return subsetSlug;
  if (SET_ALIAS[subsetSlug] && THEMES[SET_ALIAS[subsetSlug]]) return SET_ALIAS[subsetSlug];
  if (THEMES[parallelSlug]) return parallelSlug;
  return "base";
}

export function getThemeSpec(theme: string): ThemeSpec {
  return THEMES[theme] ?? THEMES.base;
}
