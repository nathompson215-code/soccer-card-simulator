"use client";

import { PlayerPortrait } from "@/components/PlayerPortrait";
import { rarityLabel } from "@/lib/format";
import type { CardVisual } from "@/lib/card-visual";
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

  const lastName = card.playerName.split(/\s+/).slice(-1)[0] ?? card.playerName;
  const firstName = card.playerName.replace(lastName, "").trim();

  return (
    <div
      className={`d11-card-art relative h-full w-full overflow-hidden ${templateClass(visual.template)}`}
      style={
        {
          "--card-accent": visual.accent,
          "--pos-color": POS_COLORS[card.playerPosition] ?? "#43A047",
        } as CSSProperties
      }
      data-template={visual.template}
    >
      <div className="d11-card-bg absolute inset-0" />
      {visual.showTexture ? <div className="d11-card-texture absolute inset-0" /> : null}
      {visual.showPlateGrain ? <div className="d11-plate-grain absolute inset-0" /> : null}

      <div className="absolute inset-[5%] overflow-hidden rounded-[10px] border border-white/15">
        <div className="absolute inset-0">
          <PlayerPortrait
            playerName={card.playerName}
            playerSlug={card.playerSlug}
            position={card.playerPosition}
            accent={visual.accent}
            imageUrl={card.playerImageUrl}
            imageUrlHd={card.playerImageUrlHd}
          />
        </div>

        {visual.showPatchWindow ? (
          <div className="d11-patch-window absolute bottom-[18%] right-[8%] z-10">
            <div className="d11-patch-swatch" style={{ background: visual.accent }} />
            <div className="d11-patch-label">MEM</div>
          </div>
        ) : null}

        {visual.showAutoStroke ? (
          <div className="d11-auto-stroke absolute bottom-[22%] left-[8%] right-[28%] z-10">
            <svg viewBox="0 0 180 40" className="h-full w-full overflow-visible">
              <path
                d="M8 28 C 28 8, 55 34, 78 16 S 120 36, 150 12"
                fill="none"
                stroke="rgba(20,20,20,0.78)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M20 30 C 48 12, 70 30, 95 18 S 140 28, 168 14"
                fill="none"
                stroke="rgba(30,30,30,0.45)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-black via-black/75 to-transparent" />
      </div>

      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-1 px-[7%] pt-[4%]">
        <div>
          <div className="text-[7px] font-semibold uppercase tracking-[0.22em] text-white/75 md:text-[8px]">
            Draft Eleven
          </div>
          <div className="mt-0.5 max-w-[9rem] truncate text-[8px] uppercase tracking-[0.14em] text-white/55 md:text-[9px]">
            {card.subsetName}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div
            className="rounded px-1.5 py-0.5 text-[8px] font-bold text-pitch-950 md:text-[9px]"
            style={{ background: POS_COLORS[card.playerPosition] ?? "#43A047" }}
          >
            {card.playerPosition}
          </div>
          {card.isRookie ? <div className="d11-rookie-badge">RC</div> : null}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 px-[7%] pb-[5%] pt-2">
        <div className="display text-[clamp(1.05rem,2.8vw,1.55rem)] leading-none text-white drop-shadow">
          {compact ? lastName : card.playerName}
        </div>
        {!compact && firstName ? (
          <div className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-white/60">{firstName}</div>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[8px] text-white/70 md:text-[9px]">
          {card.clubName ? <span>{card.clubName}</span> : null}
          {card.clubName && card.nationalTeamName ? <span className="text-white/30">·</span> : null}
          {card.nationalTeamName ? <span>{card.nationalTeamName}</span> : null}
        </div>

        <div className="mt-2 flex items-end justify-between gap-2 border-t border-white/15 pt-1.5">
          <div className="min-w-0">
            <div className="truncate text-[8px] uppercase tracking-[0.14em] text-white/55 md:text-[9px]">
              #{card.cardNumber} · {card.parallelName}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[9px] md:text-[10px]">
              <span className="font-semibold text-gold-soft">{rarityLabel(card.rarity)}</span>
              <span className="text-white/35">·</span>
              <span className="text-white/70">{visual.label}</span>
            </div>
          </div>
          {serial ? (
            <div className="shrink-0 rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-gold md:text-[11px]">
              {serial}
            </div>
          ) : (
            <div className="shrink-0 text-[9px] uppercase tracking-[0.14em] text-white/45">
              {card.year}
            </div>
          )}
        </div>
      </div>

      {visual.template === "booklet" ? <div className="d11-booklet-spine" /> : null}
      {visual.template === "oneOfOne" ? <div className="d11-oneofone-ribbon">1 of 1</div> : null}
      {visual.template === "caseHit" ? <div className="d11-case-burst" /> : null}
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
