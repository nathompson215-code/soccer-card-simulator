"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { useRef, type MouseEvent } from "react";
import { TradingCardArt } from "@/components/TradingCardArt";
import { resolveCardVisual } from "@/lib/card-visual";
import type { CardDTO, Celebration } from "@/lib/types";

interface CardFaceProps {
  card: CardDTO;
  serialDisplay?: string | null;
  size?: "sm" | "md" | "lg";
  celebration?: Celebration;
  onClick?: () => void;
  className?: string;
  href?: string;
  interactiveFoil?: boolean;
  revealActive?: boolean;
}

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
  const dims =
    size === "sm"
      ? "w-[132px] h-[184px]"
      : size === "lg"
        ? "w-[240px] h-[336px]"
        : "w-[180px] h-[252px]";

  const visual = resolveCardVisual(card, celebration);
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(40);
  const smx = useSpring(mx, { stiffness: 180, damping: 22 });
  const smy = useSpring(my, { stiffness: 180, damping: 22 });
  const shine = useMotionTemplate`radial-gradient(460px circle at ${smx}% ${smy}%, rgba(255,255,255,0.42), transparent 42%)`;
  const tiltX = useSpring(0, { stiffness: 200, damping: 20 });
  const tiltY = useSpring(0, { stiffness: 200, damping: 20 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!interactiveFoil || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    mx.set(px);
    my.set(py);
    tiltY.set((px - 50) / 4);
    tiltX.set((50 - py) / 5);
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
      : celebration === "hit" || visual.borderTone === "gold" || visual.borderTone === "case"
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
      whileHover={onClick && !interactiveFoil ? { y: -6 } : undefined}
      style={
        interactiveFoil
          ? { rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }
          : undefined
      }
      className={`relative ${dims} shrink-0 text-left ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div
        className={`relative h-full w-full overflow-hidden rounded-[14px] border shadow-2xl transition ${borderClass} ${
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
            <div className="foil-prism pointer-events-none absolute inset-0 z-30 opacity-45 mix-blend-color-dodge" />
            <div className="foil-shine pointer-events-none absolute inset-0 z-30 mix-blend-screen opacity-65" />
          </>
        ) : null}

        {visual.showChrome ? (
          <div className="d11-chrome-sheen pointer-events-none absolute inset-0 z-30 opacity-50" />
        ) : null}

        {visual.showHolo ? (
          <div className="d11-holo-wave pointer-events-none absolute inset-0 z-30 opacity-40 mix-blend-overlay" />
        ) : null}

        {interactiveFoil && (visual.showFoil || visual.showChrome || visual.showHolo) ? (
          <motion.div
            className="pointer-events-none absolute inset-0 z-30 mix-blend-soft-light"
            style={{ background: shine }}
          />
        ) : null}

        {(celebration === "jackpot" || celebration === "hit") && (
          <div className="pointer-events-none absolute inset-0 z-30 card-sparkle opacity-70" />
        )}
      </div>
    </motion.div>
  );
}
