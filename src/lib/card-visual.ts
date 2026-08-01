import type { CardDTO, Celebration, Rarity } from "@/lib/types";

/**
 * Reusable Draft Eleven card skin system.
 * Product configs / parallel names map onto skins; CSS classes are `d11-skin-{id}`.
 * Future products can extend SKIN_ALIASES or pass explicit theme keys without rewriting components.
 */

export type CardSkinId =
  | "base"
  | "refractor"
  | "prism"
  | "parallel"
  | "gold"
  | "orange"
  | "red"
  | "black"
  | "superfractor"
  | "autograph"
  | "patch"
  | "patchAuto"
  | "booklet"
  | "printingPlate"
  | "insert"
  | "caseHit";

/** @deprecated Prefer CardSkinId — kept for existing imports */
export type CardTemplate = CardSkinId;

export type RarityFrame =
  | "common"
  | "uncommon"
  | "rare"
  | "ultra"
  | "mythic"
  | "legendary";

export type BorderTone =
  | "standard"
  | "metal"
  | "gold"
  | "orange"
  | "red"
  | "black"
  | "rainbow"
  | "plate"
  | "case"
  | "mythic"
  | "prism";

export type CardVisual = {
  /** Primary skin id → `d11-skin-{id}` / `d11-template-{id}` */
  template: CardSkinId;
  skin: CardSkinId;
  label: string;
  rarityFrame: RarityFrame;
  showFoil: boolean;
  showChrome: boolean;
  showHolo: boolean;
  showPrism: boolean;
  showTexture: boolean;
  showAutoStroke: boolean;
  showPatchWindow: boolean;
  showPlateGrain: boolean;
  showEmboss: boolean;
  showRimLight: boolean;
  showEdgeGlow: boolean;
  borderTone: BorderTone;
  accent: string;
};

type SkinSpec = {
  label: string;
  defaultBorder: BorderTone;
  foil?: boolean;
  chrome?: boolean;
  holo?: boolean;
  prism?: boolean;
  texture?: boolean;
  emboss?: boolean;
  rim?: boolean;
  edgeGlow?: boolean;
};

/** Declarative skin registry — extend here for new product looks. */
export const CARD_SKINS: Record<CardSkinId, SkinSpec> = {
  base: { label: "Base", defaultBorder: "standard", emboss: true },
  refractor: {
    label: "Refractor",
    defaultBorder: "metal",
    foil: true,
    chrome: true,
    holo: true,
    rim: true,
    edgeGlow: true,
  },
  prism: {
    label: "Prism",
    defaultBorder: "prism",
    foil: true,
    chrome: true,
    holo: true,
    prism: true,
    rim: true,
    edgeGlow: true,
  },
  parallel: {
    label: "Parallel",
    defaultBorder: "metal",
    foil: true,
    chrome: true,
    rim: true,
  },
  gold: {
    label: "Gold",
    defaultBorder: "gold",
    foil: true,
    chrome: true,
    holo: true,
    rim: true,
    edgeGlow: true,
  },
  orange: {
    label: "Orange",
    defaultBorder: "orange",
    foil: true,
    chrome: true,
    rim: true,
    edgeGlow: true,
  },
  red: {
    label: "Red",
    defaultBorder: "red",
    foil: true,
    chrome: true,
    holo: true,
    rim: true,
    edgeGlow: true,
  },
  black: {
    label: "Black",
    defaultBorder: "black",
    foil: true,
    chrome: true,
    texture: true,
    rim: true,
    edgeGlow: true,
  },
  superfractor: {
    label: "SuperFractor",
    defaultBorder: "rainbow",
    foil: true,
    chrome: true,
    holo: true,
    prism: true,
    rim: true,
    edgeGlow: true,
  },
  autograph: {
    label: "Autograph",
    defaultBorder: "mythic",
    foil: true,
    chrome: true,
    emboss: true,
    rim: true,
  },
  patch: {
    label: "Patch",
    defaultBorder: "gold",
    texture: true,
    emboss: true,
    rim: true,
  },
  patchAuto: {
    label: "Patch Auto",
    defaultBorder: "mythic",
    foil: true,
    chrome: true,
    texture: true,
    emboss: true,
    rim: true,
    edgeGlow: true,
  },
  booklet: {
    label: "Booklet",
    defaultBorder: "gold",
    chrome: true,
    texture: true,
    emboss: true,
  },
  printingPlate: {
    label: "Printing Plate",
    defaultBorder: "plate",
    texture: true,
    rim: true,
  },
  insert: {
    label: "Insert",
    defaultBorder: "metal",
    foil: true,
    chrome: true,
    holo: true,
    rim: true,
  },
  caseHit: {
    label: "Case Hit",
    defaultBorder: "case",
    foil: true,
    chrome: true,
    holo: true,
    rim: true,
    edgeGlow: true,
  },
};

/** Parallel / set name aliases → skin (product-agnostic). */
const SKIN_ALIASES: Array<{ match: RegExp; skin: CardSkinId }> = [
  { match: /super\s*fractor|club\s*&\s*country|1\s*of\s*1|oneofone/i, skin: "superfractor" },
  { match: /printing\s*plate|cyan\s*plate|magenta\s*plate|yellow\s*plate|black\s*plate/i, skin: "printingPlate" },
  { match: /booklet|campeone/i, skin: "booklet" },
  { match: /patch\s*auto|auto\s*patch/i, skin: "patchAuto" },
  { match: /\bpatch\b|\brelic\b|memorabilia|laundry|cleat|shield/i, skin: "patch" },
  { match: /autograph|on[- ]card|inked|signed/i, skin: "autograph" },
  { match: /\bprism\b/i, skin: "prism" },
  { match: /\bgold\b|toppsfractor/i, skin: "gold" },
  { match: /\borange\b/i, skin: "orange" },
  { match: /\bred\b|hongbao/i, skin: "red" },
  { match: /\bblack\b|xi\b|night\s*shade/i, skin: "black" },
  { match: /refractor|pulsar|raywave|speckle|wave|lava|shimmer/i, skin: "refractor" },
  { match: /case\s*hit|shadow\s*etch|tifo|helix|grail|white\s*noise|munich/i, skin: "caseHit" },
];

function nameHints(card: CardDTO) {
  return `${card.parallelName} ${card.parallelSlug} ${card.subsetName} ${card.subset}`.toLowerCase();
}

export function rarityToFrame(rarity: Rarity | string): RarityFrame {
  switch (rarity) {
    case "LEGENDARY":
      return "legendary";
    case "MYTHIC":
      return "mythic";
    case "ULTRA_RARE":
      return "ultra";
    case "RARE":
      return "rare";
    case "UNCOMMON":
      return "uncommon";
    default:
      return "common";
  }
}

function aliasSkin(hints: string): CardSkinId | null {
  for (const rule of SKIN_ALIASES) {
    if (rule.match.test(hints)) return rule.skin;
  }
  return null;
}

export function resolveCardSkin(card: CardDTO): CardSkinId {
  const type = card.cardType;
  const set = card.setType;
  const hints = nameHints(card);
  const aliased = aliasSkin(hints);

  const isAuto =
    type.includes("AUTOGRAPH") || set === "AUTOGRAPH" || /autograph|inked|signed/.test(hints);
  const isPatch =
    type.includes("PATCH") ||
    type === "RELIC" ||
    type === "MEMORABILIA" ||
    type === "CLEAT_RELIC" ||
    type === "LAUNDRY_TAG" ||
    set === "RELIC" ||
    /\bpatch\b|\brelic\b|memorabilia/.test(hints);

  if (type === "PRINTING_PLATE" || set === "PRINTING_PLATE" || aliased === "printingPlate") {
    return "printingPlate";
  }
  if (type === "BOOKLET" || set === "BOOKLET" || aliased === "booklet") return "booklet";

  // Autos / memorabilia keep their own skins even when numbered 1/1
  if (isAuto && isPatch) return "patchAuto";
  if (isAuto) {
    if (aliased && ["gold", "orange", "red", "black", "prism", "refractor"].includes(aliased)) {
      return aliased;
    }
    return "autograph";
  }
  if (isPatch) return "patch";

  if (type === "ONE_OF_ONE" || card.printRun === 1 || aliased === "superfractor") {
    return "superfractor";
  }
  if (type === "CASE_HIT" || set === "CASE_HIT") {
    return aliased === "caseHit" ? "caseHit" : aliased ?? "caseHit";
  }

  // Colorway parallels from name
  if (
    aliased === "gold" ||
    aliased === "orange" ||
    aliased === "red" ||
    aliased === "black" ||
    aliased === "prism"
  ) {
    return aliased;
  }
  if (aliased === "refractor") return "refractor";
  if (aliased === "caseHit") return "caseHit";
  if (aliased === "insert") return "insert";

  if (
    type === "REFRACTOR" ||
    (card.foil && (type === "PARALLEL" || type === "SP" || type === "SSP"))
  ) {
    return "refractor";
  }

  if (type === "INSERT" || set === "INSERT" || set === "SP" || set === "SSP") return "insert";
  if (type === "PARALLEL" || set === "PARALLEL_SET" || Boolean(card.printRun)) return "parallel";
  return "base";
}

/** @deprecated use resolveCardSkin */
export function resolveCardTemplate(card: CardDTO): CardSkinId {
  return resolveCardSkin(card);
}

export function resolveCardVisual(card: CardDTO, celebration: Celebration = "none"): CardVisual {
  const skin = resolveCardSkin(card);
  const spec = CARD_SKINS[skin];
  const rarityFrame = rarityToFrame(card.rarity);
  const accent = card.parallelColor || card.productAccent || "#1b7a4e";

  const showFoil =
    Boolean(spec.foil) ||
    card.foil ||
    celebration === "foil" ||
    celebration === "glow" ||
    rarityFrame === "uncommon" ||
    rarityFrame === "rare";

  const showChrome =
    Boolean(spec.chrome) ||
    rarityFrame === "ultra" ||
    rarityFrame === "mythic" ||
    rarityFrame === "legendary";

  const showHolo =
    Boolean(spec.holo) ||
    rarityFrame === "mythic" ||
    rarityFrame === "legendary" ||
    celebration === "jackpot" ||
    celebration === "hit";

  let borderTone = spec.defaultBorder;
  if (skin === "superfractor" || rarityFrame === "legendary") borderTone = "rainbow";
  else if (celebration === "jackpot") borderTone = "rainbow";

  return {
    template: skin,
    skin,
    label: spec.label,
    rarityFrame,
    showFoil,
    showChrome,
    showHolo,
    showPrism: Boolean(spec.prism) || skin === "prism",
    showTexture: Boolean(spec.texture) || rarityFrame === "ultra",
    showAutoStroke: skin === "autograph" || skin === "patchAuto",
    showPatchWindow: skin === "patch" || skin === "patchAuto" || skin === "booklet",
    showPlateGrain: skin === "printingPlate",
    showEmboss: spec.emboss !== false,
    showRimLight: Boolean(spec.rim) || rarityFrame !== "common",
    showEdgeGlow: Boolean(spec.edgeGlow),
    borderTone,
    accent,
  };
}

export function skinClassName(skin: CardSkinId) {
  return `d11-skin-${skin} d11-template-${skin}`;
}

export function isRookieEra(era: string | null | undefined): boolean {
  return era === "ROOKIE" || era === "PROSPECT";
}
