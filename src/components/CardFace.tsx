"use client";

import { motion } from "framer-motion";
import { cardTypeLabel, formatMoney, rarityLabel } from "@/lib/format";
import type { CardDTO, Celebration } from "@/lib/types";

const POS_COLORS: Record<string, string> = {
  GK: "#F9A825",
  DEF: "#1E88E5",
  MID: "#43A047",
  FWD: "#E53935",
};

interface CardFaceProps {
  card: CardDTO;
  serialDisplay?: string | null;
  size?: "sm" | "md" | "lg";
  celebration?: Celebration;
  onClick?: () => void;
  className?: string;
  href?: string;
}

export function CardFace({
  card,
  serialDisplay,
  size = "md",
  celebration = "none",
  onClick,
  className = "",
}: CardFaceProps) {
  const dims =
    size === "sm"
      ? "w-[132px] h-[184px]"
      : size === "lg"
        ? "w-[240px] h-[336px]"
        : "w-[180px] h-[252px]";

  const serial =
    serialDisplay ??
    (card.printRun ? `?/${card.printRun}` : null);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={onClick ? { y: -6, rotateY: 6 } : undefined}
      className={`relative ${dims} shrink-0 text-left ${className}`}
    >
      <div
        className={`relative h-full w-full overflow-hidden rounded-[14px] border shadow-2xl transition ${
          celebration === "jackpot" || celebration === "hit"
            ? "hit-pulse border-gold"
            : celebration === "foil" || celebration === "glow"
              ? "border-pitch-400/60"
              : "border-white/15"
        }`}
        style={{
          background: `linear-gradient(160deg, ${card.parallelColor}33, #0b1a14 45%, #07110d)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background: `
              radial-gradient(circle at 50% 20%, ${card.parallelColor}55, transparent 45%),
              linear-gradient(180deg, ${card.productAccent ?? "#1b7a4e"}66 0%, transparent 40%),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 14px,
                rgba(255,255,255,0.03) 14px,
                rgba(255,255,255,0.03) 15px
              )
            `,
          }}
        />

        {card.foil ? (
          <div className="foil-shine pointer-events-none absolute inset-0 mix-blend-screen opacity-70" />
        ) : null}

        <div className="relative flex h-full flex-col p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[9px] uppercase tracking-[0.18em] text-white/70">
              {card.manufacturerName}
            </div>
            <div
              className="rounded px-1.5 py-0.5 text-[9px] font-bold text-pitch-950"
              style={{ background: POS_COLORS[card.playerPosition] ?? "#43A047" }}
            >
              {card.playerPosition}
            </div>
          </div>

          <div className="mt-2 flex flex-1 flex-col items-center justify-center">
            <div
              className="mb-2 grid h-16 w-16 place-items-center rounded-full border border-white/20 text-xl font-bold text-white shadow-lg md:h-20 md:w-20"
              style={{
                background: `linear-gradient(145deg, ${card.parallelColor}, #0b1a14)`,
              }}
            >
              {card.playerName.split(" ").slice(-1)[0].slice(0, 1)}
            </div>
            <div className="display text-center text-[1.35rem] leading-none text-white drop-shadow md:text-[1.55rem]">
              {card.playerName}
            </div>
            <div className="mt-1 text-center text-[10px] text-white/70">
              {card.clubName}
              {card.nationalTeamName ? ` · ${card.nationalTeamName}` : ""}
            </div>
          </div>

          <div className="mt-auto space-y-1">
            <div className="flex items-center justify-between text-[10px] text-white/80">
              <span>#{card.cardNumber}</span>
              <span className="truncate pl-2">{card.parallelName}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-black/35 px-2 py-1 text-[10px]">
              <span className="text-gold-soft">{rarityLabel(card.rarity)}</span>
              <span className="text-white/80">
                {formatMoney(card.estimatedValueCents)}
              </span>
            </div>
            {serial && !serial.startsWith("?") ? (
              <div className="text-center text-[11px] font-semibold tracking-wider text-gold">
                {serial}
              </div>
            ) : (
              <div className="text-center text-[10px] text-white/50">
                {cardTypeLabel(card.cardType)}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
