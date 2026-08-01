"use client";

import { motion } from "framer-motion";
import type { Celebration } from "@/lib/types";
import { revealIntensity } from "@/lib/pack-sounds";

export function RevealEffects({
  celebration,
  active,
}: {
  celebration: Celebration;
  active: boolean;
}) {
  if (!active || celebration === "none") return null;
  const intensity = revealIntensity(celebration);
  const particleCount = 10 + intensity * 8;
  const color =
    celebration === "jackpot"
      ? "#f0d78c"
      : celebration === "hit"
        ? "#d4af37"
        : celebration === "foil"
          ? "#9fd7ff"
          : "#7dffb2";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: celebration === "jackpot" ? 0.55 : 0.35 }}
        exit={{ opacity: 0 }}
        style={{
          background:
            celebration === "jackpot"
              ? "radial-gradient(circle at 50% 45%, rgba(240,215,140,0.35), transparent 55%)"
              : celebration === "hit"
                ? "radial-gradient(circle at 50% 45%, rgba(212,175,55,0.28), transparent 55%)"
                : celebration === "foil"
                  ? "radial-gradient(circle at 50% 45%, rgba(120,200,255,0.25), transparent 55%)"
                  : "radial-gradient(circle at 50% 45%, rgba(61,207,142,0.2), transparent 55%)",
        }}
      />

      {Array.from({ length: particleCount }).map((_, i) => {
        const angle = (i / particleCount) * Math.PI * 2;
        const dist = 80 + (i % 5) * 28 + intensity * 10;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
            style={{ background: color, boxShadow: `0 0 10px ${color}` }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist - 20,
              opacity: 0,
              scale: 0.2,
            }}
            transition={{
              duration: 0.9 + (i % 4) * 0.12,
              delay: 0.05 + (i % 6) * 0.03,
              ease: "easeOut",
            }}
          />
        );
      })}

      {intensity >= 4 ? (
        <motion.div
          className="absolute left-1/2 top-[18%] h-40 w-px -translate-x-1/2"
          style={{
            background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
            boxShadow: `0 0 24px ${color}`,
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: [0, 1, 0.4] }}
          transition={{ duration: 0.8 }}
        />
      ) : null}
    </div>
  );
}

export function SuspenseVeil({
  celebration,
  progress,
}: {
  celebration: Celebration;
  progress: number;
}) {
  if (celebration === "none") return null;
  const intensity = revealIntensity(celebration);
  const glow =
    celebration === "jackpot"
      ? `rgba(240,215,140,${0.15 + progress * 0.35})`
      : celebration === "hit"
        ? `rgba(212,175,55,${0.12 + progress * 0.28})`
        : celebration === "foil"
          ? `rgba(140,200,255,${0.1 + progress * 0.25})`
          : `rgba(61,207,142,${0.08 + progress * 0.2})`;

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: 0.35 + progress * 0.45,
          background: `
            radial-gradient(circle at 50% 55%, ${glow}, transparent 42%),
            radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${0.35 + progress * 0.4}) 80%)
          `,
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background: glow,
          transform: `translate(-50%, -50%) scale(${0.7 + progress * (0.5 + intensity * 0.08)})`,
          opacity: 0.5 + progress * 0.5,
        }}
      />
      {intensity >= 3 ? (
        <div className="suspense-rays absolute inset-0 opacity-70" style={{ opacity: progress }} />
      ) : null}
    </div>
  );
}
