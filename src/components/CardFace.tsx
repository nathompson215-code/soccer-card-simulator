"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { useRef, type MouseEvent } from "react";
import { TradingCardArt } from "@/components/TradingCardArt";
import { resolveCardVisual } from "@/lib/card-visual";
import type { CardDTO, Celebration } from "@/lib/types";

interface CardFaceProps {
  card: CardDTO;
  serialDisplay?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  celebration?: Celebration;
  onClick?: () => void;
  className?: string;
  href?: string;
  interactiveFoil?: boolean;
  revealActive?: boolean;
}

const SIZE_CLASS: Record<NonNullable<CardFaceProps["size"]>, string> = {
  sm: "w-[148px] h-[207px]",
  md: "w-[210px] h-[294px]",
  lg: "w-[min(78vw,300px)] h-[min(109vw,420px)]",
  xl: "w-[min(86vw,360px)] h-[min(120vw,504px)]",
};

export function CardFace({
  card,
  serialDisplay,
  size = "md",
  celebration = "none",
  onClick,
  className = "",
  interactiveFoil = false,
  revealActive = false,
}: CardFaceProps) {
  const visual = resolveCardVisual(card, celebration);
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(40);
  const smx = useSpring(mx, { stiffness: 180, damping: 22 });
  const smy = useSpring(my, { stiffness: 180, damping: 22 });
  const shine = useMotionTemplate`radial-gradient(520px circle at ${smx}% ${smy}%, rgba(255,255,255,0.5), transparent 44%)`;
  const tiltX = useSpring(0, { stiffness: 200, damping: 20 });
  const tiltY = useSpring(0, { stiffness: 200, damping: 20 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!interactiveFoil || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    mx.set(px);
    my.set(py);
    tiltY.set((px - 50) / 3.6);
    tiltX.set((50 - py) / 4.5);
  };

  const onLeave = () => {
    mx.set(50);
    my.set(40);
    tiltX.set(0);
    tiltY.set(0);
  };

  const borderClass =
    celebration === "jackpot" || visual.borderTone === "rainbow"
      ? "hit-pulse border-gold card-frame-jackpot"
      : visual.borderTone === "mythic" || celebration === "hit"
        ? "hit-pulse border-gold card-frame-mythic"
        : visual.borderTone === "gold" || visual.borderTone === "case"
          ? "hit-pulse border-gold"
          : visual.borderTone === "metal" || celebration === "foil"
            ? "border-sky-300/50 card-frame-foil"
            : visual.borderTone === "plate"
              ? "border-cyan-200/40"
              : celebration === "glow"
                ? "border-pitch-400/60"
                : "border-white/20";

  return (
    <motion.div
      ref={ref}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={onClick && !interactiveFoil ? { y: -8, scale: 1.02 } : undefined}
      style={
        interactiveFoil
          ? { rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }
          : undefined
      }
      className={`relative ${SIZE_CLASS[size]} shrink-0 text-left ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div
        className={`d11-card-shell relative h-full w-full overflow-hidden rounded-[16px] border shadow-2xl transition rarity-shell-${visual.rarityFrame} ${borderClass} ${
          revealActive ? "card-reveal-pop" : ""
        }`}
      >
        <TradingCardArt
          card={card}
          visual={visual}
          serialDisplay={serialDisplay}
          compact={size === "sm"}
        />

        {visual.showFoil ? (
          <>
            <div className="foil-prism pointer-events-none absolute inset-0 z-30 opacity-50 mix-blend-color-dodge" />
            <div className="foil-shine pointer-events-none absolute inset-0 z-30 mix-blend-screen opacity-70" />
          </>
        ) : null}

        {visual.showChrome ? (
          <div className="d11-chrome-sheen pointer-events-none absolute inset-0 z-30 opacity-55" />
        ) : null}

        {visual.showHolo ? (
          <div className="d11-holo-wave pointer-events-none absolute inset-0 z-30 opacity-45 mix-blend-overlay" />
        ) : null}

        <div className="d11-soft-light pointer-events-none absolute inset-0 z-30" />

        {interactiveFoil && (visual.showFoil || visual.showChrome || visual.showHolo) ? (
          <motion.div
            className="pointer-events-none absolute inset-0 z-30 mix-blend-soft-light"
            style={{ background: shine }}
          />
        ) : null}

        {(celebration === "jackpot" || celebration === "hit") && (
          <div className="pointer-events-none absolute inset-0 z-30 card-sparkle opacity-75" />
        )}
      </div>
    </motion.div>
  );
}
