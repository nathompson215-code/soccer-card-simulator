"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { SignatureOverlay } from "@/components/SignatureOverlay";
import type { CardVisual } from "@/lib/card-visual";
import { resolveSerialDisplay } from "@/lib/format";
import type { CardDTO } from "@/lib/types";

const POS_COLORS: Record<string, string> = {
  GK: "#F4C430",
  DEF: "#3B82F6",
  MID: "#22C55E",
  FWD: "#EF4444",
};

/**
 * True two-panel collectible booklet — closed by default, opens to reveal
 * memorabilia + signature panels. Does not alter pack odds or card data.
 */
export function BookletCardArt({
  card,
  visual,
  serialDisplay,
  compact = false,
  defaultOpen = false,
}: {
  card: CardDTO;
  visual: CardVisual;
  serialDisplay?: string | null;
  compact?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen && !compact);

  useEffect(() => {
    if (defaultOpen && !compact) setOpen(true);
  }, [defaultOpen, compact]);

  const serial = resolveSerialDisplay(serialDisplay, card.printRun);

  const parts = card.playerName.trim().split(/\s+/);
  const lastName = parts.slice(-1)[0] ?? card.playerName;
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  const isAutographBooklet =
    card.cardType.includes("AUTOGRAPH") ||
    /autograph|\bauto\b/i.test(`${card.subset} ${card.subsetName} ${card.parallelName}`);

  return (
    <div
      className={`d11-booklet ${open ? "is-open" : "is-closed"} ${compact ? "is-compact" : ""}`}
      data-template="booklet"
      data-rarity={visual.rarityFrame}
        style={
          {
            "--card-accent": visual.accent,
            "--pos-color": POS_COLORS[card.playerPosition] ?? "#22C55E",
          } as CSSProperties
        }
    >
      <button
        type="button"
        className="d11-booklet-stage"
        onClick={(e) => {
          e.stopPropagation();
          if (!compact) setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={open ? "Close booklet" : "Open booklet"}
      >
        <div className="d11-booklet-hinge" aria-hidden />

        {/* LEFT / COVER PANEL */}
        <div className="d11-booklet-panel d11-booklet-cover">
          <div className="d11-booklet-panel-bg" />
          <div className="d11-booklet-foil" />
          <div className="d11-booklet-spine-edge" />

          <div className="d11-booklet-photo">
            <PlayerPortrait
              playerName={card.playerName}
              playerSlug={card.playerSlug}
              position={card.playerPosition}
              accent={visual.accent}
              imageUrl={card.playerImageUrl ?? card.frontImageUrl}
            />
            <div className="d11-portrait-shade absolute inset-x-0 bottom-0 h-[42%]" />
          </div>

          <div className="d11-booklet-cover-meta">
            <div className="d11-brand-mark text-[7px] font-bold uppercase tracking-[0.28em] text-white/85">
              Draft Eleven
            </div>
            <div className="mt-0.5 text-[7px] uppercase tracking-[0.16em] text-white/45">
              {card.subsetName}
            </div>
            <div className="display mt-2 text-[clamp(1rem,3vw,1.45rem)] leading-none text-white">
              {lastName.toUpperCase()}
            </div>
            {firstName ? (
              <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-white/65">
                {firstName}
              </div>
            ) : null}
            <div className="mt-2 inline-flex items-center gap-1 rounded border border-gold/40 bg-gold/15 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.14em] text-gold-soft">
              Booklet
            </div>
          </div>

          {!open ? (
            <div className="d11-booklet-open-hint">
              {compact ? "Booklet" : "Open"}
            </div>
          ) : null}
        </div>

        {/* RIGHT / INTERIOR PANEL */}
        <div className="d11-booklet-panel d11-booklet-interior">
          <div className="d11-booklet-panel-bg interior" />
          <div className="d11-booklet-foil interior" />

          <div className="d11-booklet-interior-grid">
            <div className="d11-booklet-interior-photo">
              <PlayerPortrait
                playerName={card.playerName}
                playerSlug={card.playerSlug}
                position={card.playerPosition}
                accent={visual.accent}
                imageUrl={card.playerImageUrl ?? card.frontImageUrl}
              />
            </div>

            <div className="d11-booklet-mem-stack">
              <div className="d11-patch-window d11-booklet-patch">
                <div className="d11-patch-swatch" style={{ background: visual.accent }} />
                <div className="d11-patch-label">MEM</div>
              </div>
              <div className="d11-booklet-mem-caption">Memorabilia</div>
            </div>

            <div className="d11-booklet-sig-plate">
              <SignatureOverlay
                playerName={card.playerName}
                playerSlug={card.playerSlug}
                variant="panel"
                compact={compact}
                inkPlaceholder={isAutographBooklet}
              />
            </div>

            <div className="d11-booklet-interior-meta">
              <div className="truncate text-[7px] uppercase tracking-[0.14em] text-white/55">
                #{card.cardNumber} · {card.parallelName}
              </div>
              <div className="mt-0.5 flex items-center justify-end gap-1">
                {serial ? (
                  <span className="d11-serial px-1 py-0.5 text-[9px] font-bold tracking-wider">
                    {serial}
                  </span>
                ) : (
                  <span className="text-[8px] uppercase tracking-[0.14em] text-white/40">
                    {card.year}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </button>

      <div className={`d11-rarity-frame rarity-${visual.rarityFrame}`} />
      <div className="d11-finish-frame finish-booklet" />
    </div>
  );
}
