"use client";

import { PlayerPortrait } from "@/components/PlayerPortrait";
import type { CardVisual } from "@/lib/card-visual";
import { resolveVisualTheme } from "@/lib/visual-themes";
import type { CardDTO } from "@/lib/types";
import type { CSSProperties } from "react";

const POS_COLORS: Record<string, string> = {
  GK: "#F9A825",
  DEF: "#1E88E5",
  MID: "#43A047",
  FWD: "#E53935",
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

  return (
    <div
      className={`d11-card-art relative h-full w-full overflow-hidden ${templateClass(visual.template)} rarity-${visual.rarityFrame} d11-theme-${theme}`}
      style={
        {
          "--card-accent": visual.accent,
          "--pos-color": POS_COLORS[card.playerPosition] ?? "#43A047",
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

      {/* Outer chrome / embossed bezel */}
      <div className="d11-bezel absolute inset-[2.8%] rounded-[12px]" />
      {visual.showEmboss ? <div className="d11-emboss-logo absolute left-[5.5%] top-[4.2%] z-30" /> : null}

      {/* Portrait window — larger for premium feel */}
      <div className="d11-portrait-frame absolute inset-[4.5%_4.5%_22%] overflow-hidden rounded-[10px]">
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
          <div className="d11-patch-window absolute bottom-[10%] right-[6%] z-10">
            <div className="d11-patch-swatch" style={{ background: visual.accent }} />
            <div className="d11-patch-label">MEM</div>
          </div>
        ) : null}

        {visual.showAutoStroke ? (
          <div className="d11-auto-stroke absolute bottom-[12%] left-[7%] right-[30%] z-10">
            <svg viewBox="0 0 180 40" className="h-full w-full overflow-visible">
              <path
                d="M8 28 C 28 8, 55 34, 78 16 S 120 36, 150 12"
                fill="none"
                stroke="rgba(20,20,20,0.82)"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <path
                d="M20 30 C 48 12, 70 30, 95 18 S 140 28, 168 14"
                fill="none"
                stroke="rgba(30,30,30,0.5)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-black/35 to-transparent" />
      </div>

      {/* Top meta */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-[6.5%] pt-[3.6%]">
        <div className="min-w-0 pl-7">
          <div className="text-[8px] font-semibold uppercase tracking-[0.28em] text-white/80 md:text-[9px]">
            Draft Eleven
          </div>
          <div className="mt-0.5 max-w-[11rem] truncate text-[9px] uppercase tracking-[0.16em] text-white/50 md:text-[10px]">
            {card.subsetName}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div
            className="rounded-md px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-pitch-950 shadow md:text-[9px]"
            style={{ background: POS_COLORS[card.playerPosition] ?? "#43A047" }}
          >
            {card.playerPosition}
          </div>
          {card.isRookie ? <div className="d11-rookie-badge">RC</div> : null}
        </div>
      </div>

      {/* Bottom nameplate */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-[6%] pb-[4%] pt-1">
        <div className="d11-nameplate rounded-[10px] px-2.5 py-2">
          <div
            className={`display leading-[0.92] text-white drop-shadow ${
              compact
                ? "text-[clamp(1.15rem,3.2vw,1.55rem)]"
                : "text-[clamp(1.25rem,3.6vw,1.85rem)]"
            }`}
          >
            {compact ? lastName : lastName.toUpperCase()}
          </div>
          {!compact && firstName ? (
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white/65">
              {firstName}
            </div>
          ) : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-white/70 md:text-[10px]">
            {card.clubName ? <span className="truncate">{card.clubName}</span> : null}
            {card.clubName && card.nationalTeamName ? (
              <span className="text-white/25">·</span>
            ) : null}
            {card.nationalTeamName ? <span>{card.nationalTeamName}</span> : null}
          </div>

          <div className="mt-2 flex items-end justify-between gap-2 border-t border-white/15 pt-1.5">
            <div className="min-w-0">
              <div className="truncate text-[8px] uppercase tracking-[0.16em] text-white/55 md:text-[9px]">
                #{card.cardNumber} · {card.parallelName}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[9px] md:text-[10px]">
                <span className="text-white/70">{visual.label}</span>
              </div>
            </div>
            {serial ? (
              <div className="d11-serial shrink-0 px-1.5 py-0.5 text-[11px] font-semibold tracking-wider md:text-[12px]">
                {serial}
              </div>
            ) : (
              <div className="shrink-0 text-[9px] uppercase tracking-[0.16em] text-white/45">
                {card.year}
              </div>
            )}
          </div>
        </div>
      </div>

      {visual.template === "booklet" ? <div className="d11-booklet-spine" /> : null}
      {visual.template === "oneOfOne" ? <div className="d11-oneofone-ribbon">1 of 1</div> : null}
      {visual.template === "caseHit" ? <div className="d11-case-burst" /> : null}
      <div className={`d11-rarity-frame rarity-${visual.rarityFrame}`} />
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
