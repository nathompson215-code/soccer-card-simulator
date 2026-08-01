"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CardFace } from "@/components/CardFace";
import { RevealEffects } from "@/components/RevealEffects";
import { celebrationHeadline, packSounds, suspenseMs } from "@/lib/pack-sounds";
import type { Celebration, PullResultDTO } from "@/lib/types";

type RevealStep = "suspense" | "flip" | "shown";

export function CardReveal({
  pull,
  packLabel,
  cardLabel,
  onContinue,
  continueLabel,
}: {
  pull: PullResultDTO;
  packLabel: string;
  cardLabel: string;
  onContinue: () => void;
  continueLabel: string;
}) {
  const [step, setStep] = useState<RevealStep>("suspense");
  const celebration = pull.celebration;
  const headline = celebrationHeadline(celebration);

  useEffect(() => {
    packSounds.playSuspense(celebration);
    const flipTimer = window.setTimeout(() => setStep("flip"), suspenseMs(celebration));
    return () => window.clearTimeout(flipTimer);
  }, [celebration]);

  useEffect(() => {
    if (step !== "flip") return;
    packSounds.playFlip();
    const land = window.setTimeout(() => {
      packSounds.playLand(celebration);
      setStep("shown");
    }, 420);
    return () => window.clearTimeout(land);
  }, [step, celebration]);

  return (
    <div className="relative flex w-full flex-col items-center">
      <div className="mb-5 text-center">
        <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">
          {packLabel} · {cardLabel}
        </div>
        <AnimatePresence mode="wait">
          {step === "suspense" && celebration !== "none" ? (
            <motion.div
              key="building"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="display mt-2 text-2xl text-ink-muted"
            >
              Something special...
            </motion.div>
          ) : null}
          {step === "shown" && headline ? (
            <motion.div
              key="headline"
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`display mt-2 text-3xl ${
                celebration === "jackpot" || celebration === "hit" ? "text-gold" : "text-pitch-400"
              }`}
            >
              {headline}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="relative flex min-h-[360px] w-full items-center justify-center">
        {step === "suspense" ? <SuspenseCardBack celebration={celebration} /> : null}

        {(step === "flip" || step === "shown") && (
          <motion.div
            key={`face-${pull.card.id}`}
            initial={{ rotateY: 90, scale: 0.86, opacity: 0.2 }}
            animate={{
              rotateY: 0,
              scale:
                step === "shown" && (celebration === "hit" || celebration === "jackpot")
                  ? [1, 1.035, 1]
                  : 1,
              opacity: 1,
            }}
            transition={
              step === "shown" && (celebration === "hit" || celebration === "jackpot")
                ? { duration: 0.55, ease: "easeOut" }
                : { type: "spring", stiffness: 140, damping: 16 }
            }
            style={{ transformStyle: "preserve-3d" }}
            className="relative"
          >
            {step === "shown" ? <RevealEffects celebration={celebration} active /> : null}
            <CardFace
              card={pull.card}
              serialDisplay={pull.serialDisplay}
              size="lg"
              celebration={celebration}
              interactiveFoil={celebration !== "none"}
              revealActive={step === "shown"}
            />
          </motion.div>
        )}
      </div>

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: step === "shown" ? 1 : 0.35, y: 0 }}
        disabled={step !== "shown"}
        onClick={() => {
          packSounds.playUiTap();
          onContinue();
        }}
        className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-pitch-950 transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        {step === "shown" ? continueLabel : "Revealing..."}
      </motion.button>
    </div>
  );
}

function SuspenseCardBack({ celebration }: { celebration: Celebration }) {
  return (
    <motion.div
      className="relative h-[336px] w-[240px]"
      animate={
        celebration === "none"
          ? { scale: 1 }
          : {
              scale: [1, 1.03, 1],
              rotate: [0, -1.5, 1.5, 0],
            }
      }
      transition={{ duration: celebration === "jackpot" ? 0.35 : 0.55, repeat: Infinity }}
    >
      <div className="card-back relative h-full w-full overflow-hidden rounded-[14px] border border-white/20 shadow-2xl">
        <div className="absolute inset-0 pack-hologram opacity-80" />
        <div className="foil-shine absolute inset-0 mix-blend-screen opacity-60" />
        <div className="absolute inset-6 rounded-xl border border-white/15" />
        <div className="display absolute inset-0 grid place-items-center text-4xl text-white/85">
          CHROME
        </div>
        {celebration !== "none" ? (
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{
              background:
                celebration === "jackpot" || celebration === "hit"
                  ? "radial-gradient(circle at 50% 50%, rgba(240,215,140,0.35), transparent 60%)"
                  : "radial-gradient(circle at 50% 50%, rgba(140,200,255,0.3), transparent 60%)",
            }}
          />
        ) : null}
      </div>
    </motion.div>
  );
}
