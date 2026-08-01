import type { CardDTO, Celebration } from "@/lib/types";

export type CardTemplate =
  | "base"
  | "insert"
  | "parallel"
  | "refractor"
  | "autograph"
  | "patch"
  | "patchAuto"
  | "booklet"
  | "printingPlate"
  | "caseHit"
  | "oneOfOne";

export type CardVisual = {
  template: CardTemplate;
  label: string;
  showFoil: boolean;
  showChrome: boolean;
  showHolo: boolean;
  showTexture: boolean;
  showAutoStroke: boolean;
  showPatchWindow: boolean;
  showPlateGrain: boolean;
  borderTone: "standard" | "metal" | "gold" | "rainbow" | "plate" | "case";
  accent: string;
};

function nameHints(card: CardDTO) {
  return `${card.parallelName} ${card.subsetName} ${card.subset}`.toLowerCase();
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
  if (type === "CASE_HIT" || set === "CASE_HIT" || hints.includes("case hit")) {
    return "caseHit";
  }
  if (type === "ONE_OF_ONE" || hints.includes("superfractor") || hints.includes("1/1")) {
    return "oneOfOne";
  }
  if (card.printRun === 1) {
    return "oneOfOne";
  }

  const isAuto =
    type.includes("AUTOGRAPH") ||
    set === "AUTOGRAPH" ||
    hints.includes("autograph") ||
    hints.includes("inked");
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
  if (isAuto) return "autograph";
  if (isPatch) return "patch";

  if (
    type === "REFRACTOR" ||
    hints.includes("refractor") ||
    hints.includes("chrome") ||
    (card.foil && (type === "PARALLEL" || type === "SP" || type === "SSP"))
  ) {
    return "refractor";
  }

  if (type === "INSERT" || set === "INSERT" || set === "SP" || set === "SSP") return "insert";
  if (type === "PARALLEL" || set === "PARALLEL_SET") return "parallel";
  return "base";
}

export function resolveCardVisual(card: CardDTO, celebration: Celebration = "none"): CardVisual {
  const template = resolveCardTemplate(card);
  const accent = card.parallelColor || card.productAccent || "#1b7a4e";

  const labels: Record<CardTemplate, string> = {
    base: "Base",
    insert: "Insert",
    parallel: "Parallel",
    refractor: "Refractor",
    autograph: "Autograph",
    patch: "Memorabilia",
    patchAuto: "Patch Auto",
    booklet: "Booklet",
    printingPlate: "Printing Plate",
    caseHit: "Case Hit",
    oneOfOne: "1/1",
  };

  const showFoil =
    card.foil ||
    celebration === "foil" ||
    celebration === "glow" ||
    ["refractor", "parallel", "insert", "oneOfOne", "caseHit", "patchAuto"].includes(template);

  const showChrome = ["refractor", "oneOfOne", "caseHit"].includes(template) || card.foil;
  const showHolo =
    ["refractor", "oneOfOne", "caseHit", "insert"].includes(template) ||
    celebration === "jackpot" ||
    celebration === "hit";

  return {
    template,
    label: labels[template],
    showFoil,
    showChrome,
    showHolo,
    showTexture: ["patch", "patchAuto", "booklet", "printingPlate"].includes(template),
    showAutoStroke: template === "autograph" || template === "patchAuto",
    showPatchWindow: template === "patch" || template === "patchAuto" || template === "booklet",
    showPlateGrain: template === "printingPlate",
    borderTone:
      template === "oneOfOne"
        ? "rainbow"
        : template === "caseHit"
          ? "case"
          : template === "printingPlate"
            ? "plate"
            : template === "autograph" || template === "patchAuto"
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
