"use client";

import { motion } from "framer-motion";

type PackState = "idle" | "charging" | "ripping" | "burst";

export function SealedPack({
  accentHex,
  manufacturer,
  brandLabel = "Chrome",
  subtitle = "Premium Hobby",
  label,
  state = "idle",
  intensity = 1,
}: {
  accentHex: string;
  manufacturer: string;
  brandLabel?: string;
  subtitle?: string;
  label?: string;
  state?: PackState;
  intensity?: number;
}) {
  const shake =
    state === "charging"
      ? {
          x: intensity * 2.5,
          rotate: intensity * 1.2,
          transition: {
            duration: 0.12,
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut" as const,
          },
        }
      : state === "ripping"
        ? {
            scale: 1.18,
            rotate: 3,
            filter: "blur(1px)",
            transition: { duration: 0.55, ease: "easeIn" as const },
          }
        : state === "burst"
          ? {
              scale: 1.35,
              opacity: 0,
              filter: "blur(10px)",
              transition: { duration: 0.35 },
            }
          : {};

  return (
    <motion.div
      className={`relative h-60 w-44 ${state === "idle" ? "float-y" : ""}`}
      animate={shake}
      style={{ perspective: 900 }}
      aria-label={`${manufacturer} sealed pack`}
    >
      <div
        className="absolute -inset-8 rounded-full opacity-60 blur-2xl"
        style={{
          background:
            intensity >= 4
              ? `radial-gradient(circle, rgba(212,175,55,${0.28 + intensity * 0.04}), transparent 65%)`
              : intensity >= 3
                ? `radial-gradient(circle, rgba(120,200,255,0.28), transparent 65%)`
                : `radial-gradient(circle, ${accentHex}66, transparent 65%)`,
        }}
      />

      <div
        className="pack-chrome relative h-full w-full overflow-hidden rounded-[18px] shadow-2xl"
        style={{
          background: `
            linear-gradient(155deg, ${accentHex} 0%, #0a1628 42%, #05080f 100%)
          `,
        }}
      >
        <div className="pointer-events-none absolute inset-0 pack-hologram opacity-70" />
        <div className="pointer-events-none absolute inset-0 foil-shine mix-blend-screen opacity-50" />

        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/25 to-transparent" />
        <div className="absolute inset-x-5 top-7 h-[2px] rounded-full bg-white/35" />
        <div className="absolute inset-x-8 top-11 h-px bg-white/20" />

        <div className="absolute left-1/2 top-16 -translate-x-1/2 rounded-full border border-gold/50 bg-black/30 px-3 py-1 text-[9px] uppercase tracking-[0.28em] text-gold-soft">
          {brandLabel}
        </div>

        <div className="display absolute inset-x-3 top-[40%] text-center text-3xl leading-none text-white drop-shadow-lg">
          {manufacturer.toUpperCase()}
        </div>
        <div className="absolute inset-x-4 top-[56%] text-center text-[10px] uppercase tracking-[0.24em] text-white/70">
          {subtitle}
        </div>
        <div className="absolute inset-x-4 top-[64%] text-center text-[8px] uppercase tracking-[0.2em] text-white/40">
          Draft Eleven
        </div>

        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-5 text-center text-[10px] uppercase tracking-[0.22em] text-white/75">
          {label ?? "Hobby Pack"}
        </div>

        {state === "ripping" || state === "burst" ? (
          <>
            <motion.div
              className="absolute inset-x-0 top-0 h-1/2 origin-top bg-gradient-to-b from-white/10 to-transparent"
              initial={{ rotateX: 0, y: 0 }}
              animate={{ rotateX: -55, y: -30, opacity: 0.4 }}
              transition={{ duration: 0.45 }}
              style={{ transformStyle: "preserve-3d" }}
            />
            <motion.div
              className="pack-tear absolute inset-x-3 top-[46%] h-[3px]"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.28 }}
            />
          </>
        ) : null}
      </div>

      {(state === "charging" || state === "ripping") && intensity >= 3 ? (
        <div className="pointer-events-none absolute inset-0 pack-charge-ring" data-intensity={intensity} />
      ) : null}
    </motion.div>
  );
}
