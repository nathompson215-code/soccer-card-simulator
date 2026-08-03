"use client";

import { PlayerPortrait } from "@/components/PlayerPortrait";
import { rarityLabel } from "@/lib/format";
import type { CardVisual } from "@/lib/card-visual";
import { resolveVisualTheme } from "@/lib/visual-themes";
import type { CardDTO } from "@/lib/types";
import type { CSSProperties } from "react";

const POS_COLORS: Record<string, string> = {
  GK: "#F4C430",
  DEF: "#3B82F6",
  MID: "#22C55E",
  FWD: "#EF4444",
};

export function TradingCardArt({
  card,
  visual,
  serialDisplay,
  compact = false,
}: {
  card: CardDTO;
  visual: CardVisual;
  serialDisplay?: string | null;
  compact?: boolean;
}) {
  const serial =
    serialDisplay && !serialDisplay.startsWith("?")
      ? serialDisplay
      : card.printRun
        ? `?/${card.printRun}`
        : null;

  const parts = card.playerName.trim().split(/\s+/);
  const lastName = parts.slice(-1)[0] ?? card.playerName;
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  const theme = resolveVisualTheme(card.subset, card.parallelSlug ?? card.parallelName);
  // Prefer rarity/template skins over generic theme-base so numbered parallels stay distinct.
  const themeClass =
    theme === "base" && visual.template !== "base" ? "" : `d11-theme-${theme}`;

  return (
    <div
      className={`d11-card-art relative h-full w-full overflow-hidden ${templateClass(visual.template)} rarity-${visual.rarityFrame} ${themeClass}`}
      style={
        {
          "--card-accent": visual.accent,
          "--pos-color": POS_COLORS[card.playerPosition] ?? "#22C55E",
        } as CSSProperties
      }
      data-template={visual.template}
      data-rarity={visual.rarityFrame}
      data-theme={theme}
    >
      <div className="d11-card-bg absolute inset-0" />
      <div className="d11-card-grain absolute inset-0" />
      {visual.showTexture ? <div className="d11-card-texture absolute inset-0" /> : null}
      {visual.showPlateGrain ? <div className="d11-plate-grain absolute inset-0" /> : null}
      {visual.showRimLight ? <div className="d11-rim-light absolute inset-0" /> : null}

      {/* Layered chrome bezel */}
      <div className="d11-bezel-outer absolute inset-[1.6%]" />
      <div className="d11-bezel absolute inset-[2.6%] rounded-[11px]" />
      {visual.showEmboss ? <div className="d11-emboss-logo absolute left-[5.2%] top-[3.8%] z-30" /> : null}

      {/* Portrait window */}
      <div className="d11-portrait-frame absolute inset-[4.2%_4.2%_21.5%] overflow-hidden rounded-[9px]">
        <div className="absolute inset-0">
          <PlayerPortrait
            playerName={card.playerName}
            playerSlug={card.playerSlug}
            position={card.playerPosition}
            accent={visual.accent}
            imageUrl={card.frontImageUrl}
          />
        </div>

        {visual.showPatchWindow ? (
          <div className="d11-patch-window absolute bottom-[9%] right-[5.5%] z-10">
            <div className="d11-patch-swatch" style={{ background: visual.accent }} />
            <div className="d11-patch-label">MEM</div>
          </div>
        ) : null}

        {visual.showAutoStroke ? (
          <div className="d11-auto-stroke absolute bottom-[11%] left-[6%] right-[28%] z-10">
            <svg viewBox="0 0 180 40" className="h-full w-full overflow-visible">
              <path
                d="M8 28 C 28 8, 55 34, 78 16 S 120 36, 150 12"
                fill="none"
                stroke="rgba(12,12,12,0.88)"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M18 31 C 46 14, 72 31, 98 19 S 142 30, 170 15"
                fill="none"
                stroke="rgba(30,30,30,0.48)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
        ) : null}

        <div className="d11-portrait-shade pointer-events-none absolute inset-x-0 bottom-0 h-[46%]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[16%] bg-gradient-to-b from-black/38 to-transparent" />
      </div>

      {/* Top meta */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-[5.8%] pt-[3.3%]">
        <div className="min-w-0 pl-7">
          <div className="d11-brand-mark text-[7.5px] font-bold uppercase tracking-[0.32em] text-white/88 md:text-[8.5px]">
            Draft Eleven
          </div>
          <div className="mt-0.5 max-w-[10.5rem] truncate text-[8px] uppercase tracking-[0.18em] text-white/48 md:text-[9px]">
            {card.subsetName}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div
            className="d11-pos-badge rounded px-1.5 py-0.5 text-[8px] font-extrabold tracking-wide text-pitch-950 shadow-sm md:text-[9px]"
            style={{ background: POS_COLORS[card.playerPosition] ?? "#22C55E" }}
          >
            {card.playerPosition}
          </div>
          {card.isRookie ? <div className="d11-rookie-badge">RC</div> : null}
        </div>
      </div>

      {/* Bottom nameplate */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-[5%] pb-[3.5%]">
        <div className="d11-nameplate rounded-[10px] px-2.5 py-2">
          <div
            className={`d11-player-lastname display leading-[0.9] text-white ${
              compact
                ? "text-[clamp(1.05rem,3vw,1.45rem)]"
                : "text-[clamp(1.15rem,3.4vw,1.75rem)]"
            }`}
          >
            {lastName.toUpperCase()}
          </div>
          {!compact && firstName ? (
            <div className="d11-player-firstname mt-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/70 md:text-[10px]">
              {firstName}
            </div>
          ) : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[8.5px] text-white/72 md:text-[9.5px]">
            {card.clubName ? <span className="truncate font-medium">{card.clubName}</span> : null}
            {card.clubName && card.nationalTeamName ? (
              <span className="text-white/25">·</span>
            ) : null}
            {card.nationalTeamName ? (
              <span className="truncate text-white/60">{card.nationalTeamName}</span>
            ) : null}
          </div>

          <div className="mt-1.5 flex items-end justify-between gap-2 border-t border-white/12 pt-1.5">
            <div className="min-w-0">
              <div className="truncate text-[7.5px] uppercase tracking-[0.14em] text-white/50 md:text-[8.5px]">
                <span className="text-white/72">#{card.cardNumber}</span>
                <span className="text-white/25"> · </span>
                <span>{card.parallelName}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[8.5px] md:text-[9.5px]">
                <span className={`d11-rarity-chip rarity-${visual.rarityFrame}`}>
                  {rarityLabel(card.rarity)}
                </span>
                <span className="text-white/25">·</span>
                <span className="font-medium uppercase tracking-[0.08em] text-white/78">
                  {visual.label}
                </span>
              </div>
            </div>
            {serial ? (
              <div className="d11-serial shrink-0 px-1.5 py-0.5 text-[10px] font-bold tracking-wider md:text-[11px]">
                {serial}
              </div>
            ) : (
              <div className="shrink-0 text-[8px] uppercase tracking-[0.16em] text-white/40">
                {card.year}
              </div>
            )}
          </div>
        </div>
      </div>

      {visual.template === "booklet" ? <div className="d11-booklet-spine" /> : null}
      {visual.template === "oneOfOne" ? <div className="d11-oneofone-ribbon">1 of 1</div> : null}
      {visual.template === "caseHit" ? <div className="d11-case-burst" /> : null}
      {visual.template === "refractor" || visual.template === "oneOfOne" ? (
        <div className="d11-prism-sheen absolute inset-0 z-[19]" />
      ) : null}

      <div className={`d11-rarity-frame rarity-${visual.rarityFrame}`} />
      <div className={`d11-finish-frame finish-${visual.template}`} />
    </div>
  );
}

function templateClass(template: CardVisual["template"]) {
  switch (template) {
    case "insert":
      return "d11-template-insert";
    case "parallel":
      return "d11-template-parallel";
    case "refractor":
      return "d11-template-refractor";
    case "autograph":
      return "d11-template-autograph";
    case "patch":
      return "d11-template-patch";
    case "patchAuto":
      return "d11-template-patch-auto";
    case "booklet":
      return "d11-template-booklet";
    case "printingPlate":
      return "d11-template-plate";
    case "caseHit":
      return "d11-template-case";
    case "oneOfOne":
      return "d11-template-oneofone";
    default:
      return "d11-template-base";
  }
}
