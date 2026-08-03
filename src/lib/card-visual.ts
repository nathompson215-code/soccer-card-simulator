import type { CardDTO, Celebration, Rarity } from "@/lib/types";

export type CardTemplate =
  | "base"
  | "insert"
  | "parallel"
  | "refractor"
  | "autograph"
  | "patch"
  | "patchAuto"
  | "cutSignature"
  | "booklet"
  | "printingPlate"
  | "caseHit"
  | "oneOfOne";

export type RarityFrame =
  | "common"
  | "uncommon"
  | "rare"
  | "ultra"
  | "mythic"
  | "legendary";

export type CardVisual = {
  template: CardTemplate;
  label: string;
  rarityFrame: RarityFrame;
  showFoil: boolean;
  showChrome: boolean;
  showHolo: boolean;
  showTexture: boolean;
  /** Real signature asset overlay (never fake handwriting). */
  showSignature: boolean;
  showPatchWindow: boolean;
  showPlateGrain: boolean;
  showEmboss: boolean;
  showRimLight: boolean;
  borderTone: "standard" | "metal" | "gold" | "rainbow" | "plate" | "case" | "mythic";
  accent: string;
};

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

export function resolveCardTemplate(card: CardDTO): CardTemplate {
  const type = card.cardType;
  const set = card.setType;
  const hints = nameHints(card);

  if (type === "PRINTING_PLATE" || set === "PRINTING_PLATE" || hints.includes("plate")) {
    return "printingPlate";
  }
  if (type === "BOOKLET" || set === "BOOKLET" || hints.includes("booklet")) {
    return "booklet";
  }
  if (type === "CASE_HIT" || set === "CASE_HIT" || hints.includes("case hit") || hints.includes("shadow etch")) {
    return "caseHit";
  }
  if (type === "ONE_OF_ONE" || hints.includes("superfractor") || hints.includes("1/1")) {
    return "oneOfOne";
  }
  if (card.printRun === 1) {
    return "oneOfOne";
  }

  const isCutSig =
    hints.includes("cut signature") ||
    hints.includes("cut auto") ||
    hints.includes("cut sign") ||
    /\bcut[- ]?(sig|auto|signature)\b/.test(hints) ||
    card.parallelSlug.includes("cut-sig") ||
    card.parallelSlug.includes("cut-auto");

  const isAuto =
    type.includes("AUTOGRAPH") ||
    set === "AUTOGRAPH" ||
    hints.includes("autograph") ||
    hints.includes("inked") ||
    isCutSig;
  const isPatch =
    type.includes("PATCH") ||
    type === "RELIC" ||
    type === "MEMORABILIA" ||
    type === "CLEAT_RELIC" ||
    type === "LAUNDRY_TAG" ||
    set === "RELIC" ||
    hints.includes("patch") ||
    hints.includes("relic");

  if (isAuto && isPatch) return "patchAuto";
  if (isCutSig) return "cutSignature";
  if (isAuto) return "autograph";
  if (isPatch) return "patch";

  if (
    type === "REFRACTOR" ||
    hints.includes("refractor") ||
    hints.includes("pulsar") ||
    hints.includes("chrome") ||
    (card.foil && (type === "PARALLEL" || type === "SP" || type === "SSP"))
  ) {
    return "refractor";
  }

  if (type === "INSERT" || set === "INSERT" || set === "SP" || set === "SSP") return "insert";
  if (type === "PARALLEL" || set === "PARALLEL_SET" || Boolean(card.printRun)) return "parallel";
  return "base";
}

export function resolveCardVisual(card: CardDTO, celebration: Celebration = "none"): CardVisual {
  const template = resolveCardTemplate(card);
  const rarityFrame = rarityToFrame(card.rarity);
  const accent = card.parallelColor || card.productAccent || "#1b7a4e";

  const labels: Record<CardTemplate, string> = {
    base: "Base",
    insert: "Insert",
    parallel: card.printRun ? "Numbered Parallel" : "Parallel",
    refractor: "Refractor",
    autograph: "Autograph",
    patch: "Relic",
    patchAuto: "Patch Autograph",
    cutSignature: "Cut Signature",
    booklet: "Booklet",
    printingPlate: "Printing Plate",
    caseHit: "Case Hit",
    oneOfOne: "1 of 1",
  };

  const showFoil =
    card.foil ||
    celebration === "foil" ||
    celebration === "glow" ||
    rarityFrame === "uncommon" ||
    rarityFrame === "rare" ||
    [
      "refractor",
      "parallel",
      "insert",
      "oneOfOne",
      "caseHit",
      "patchAuto",
      "autograph",
      "cutSignature",
      "booklet",
    ].includes(template);

  const showChrome =
    [
      "refractor",
      "oneOfOne",
      "caseHit",
      "parallel",
      "insert",
      "autograph",
      "patchAuto",
      "cutSignature",
      "booklet",
    ].includes(template) ||
    card.foil ||
    rarityFrame === "ultra" ||
    rarityFrame === "mythic" ||
    rarityFrame === "legendary";

  const showHolo =
    ["refractor", "oneOfOne", "caseHit", "insert", "booklet"].includes(template) ||
    rarityFrame === "mythic" ||
    rarityFrame === "legendary" ||
    celebration === "jackpot" ||
    celebration === "hit";

  return {
    template,
    label: labels[template],
    rarityFrame,
    showFoil,
    showChrome,
    showHolo,
    showTexture:
      ["patch", "patchAuto", "booklet", "printingPlate", "caseHit", "cutSignature"].includes(
        template,
      ) || rarityFrame === "ultra",
    showSignature:
      template === "autograph" ||
      template === "patchAuto" ||
      template === "cutSignature" ||
      template === "booklet",
    showPatchWindow: template === "patch" || template === "patchAuto" || template === "booklet",
    showPlateGrain: template === "printingPlate",
    showEmboss: true,
    showRimLight: rarityFrame !== "common" || template !== "base",
    borderTone:
      template === "oneOfOne" || rarityFrame === "legendary"
        ? "rainbow"
        : template === "caseHit"
          ? "case"
          : template === "printingPlate"
            ? "plate"
            : rarityFrame === "mythic" ||
                template === "autograph" ||
                template === "patchAuto" ||
                template === "cutSignature" ||
                template === "booklet"
              ? "mythic"
              : rarityFrame === "ultra" || rarityFrame === "rare" || template === "parallel"
                ? "gold"
                : showChrome
                  ? "metal"
                  : "standard",
    accent,
  };
}

export function isRookieEra(era: string | null | undefined): boolean {
  return era === "ROOKIE" || era === "PROSPECT";
}
