"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CardFace } from "@/components/CardFace";
import { RevealEffects } from "@/components/RevealEffects";
import { formatMoney } from "@/lib/format";
import { celebrationHeadline, packSounds, suspenseMs } from "@/lib/pack-sounds";
import { getThemeSpec, resolveVisualTheme, type RevealStyle } from "@/lib/visual-themes";
import type { Celebration, PullResultDTO } from "@/lib/types";

type RevealStep = "suspense" | "flip" | "shown";

function revealMotion(style: RevealStyle, skip: boolean) {
  if (skip) return { initial: false as const, animate: { opacity: 1, scale: 1, y: 0, rotateY: 0, rotateZ: 0 } };
  switch (style) {
    case "rise":
      return {
        initial: { opacity: 0.15, y: 80, scale: 0.9, rotateY: 0 },
        animate: { opacity: 1, y: 0, scale: 1, rotateY: 0 },
      };
    case "spark":
    case "electric":
      return {
        initial: { opacity: 0, scale: 1.25, rotateZ: -8 },
        animate: { opacity: 1, scale: 1, rotateZ: 0 },
      };
    case "pulse":
    case "helix":
      return {
        initial: { opacity: 0.2, scale: 0.7, rotateY: 180 },
        animate: { opacity: 1, scale: 1, rotateY: 0 },
      };
    case "shadow":
    case "night":
      return {
        initial: { opacity: 0, scale: 0.95, y: -40 },
        animate: { opacity: 1, scale: 1, y: 0 },
      };
    case "grail":
      return {
        initial: { opacity: 0, scale: 0.6, rotateY: 120, rotateZ: 12 },
        animate: { opacity: 1, scale: 1, rotateY: 0, rotateZ: 0 },
      };
    case "ink":
    case "patch":
    case "book":
      return {
        initial: { opacity: 0.2, rotateY: -100, scale: 0.88 },
        animate: { opacity: 1, rotateY: 0, scale: 1 },
      };
    case "lava":
    case "raywave":
    case "prism":
    case "chrome":
      return {
        initial: { opacity: 0.15, rotateY: 90, scale: 0.84 },
        animate: { opacity: 1, rotateY: 0, scale: 1 },
      };
    case "gem":
      return {
        initial: { opacity: 0, scale: 0.55, rotateZ: -18 },
        animate: { opacity: 1, scale: 1, rotateZ: 0 },
      };
    case "trophy":
      return {
        initial: { opacity: 0.1, y: 60, scale: 0.92 },
        animate: { opacity: 1, y: 0, scale: 1 },
      };
    case "hero":
      return {
        initial: { opacity: 0, scale: 1.35, rotateZ: 6 },
        animate: { opacity: 1, scale: 1, rotateZ: 0 },
      };
    default:
      return {
        initial: { opacity: 0.2, rotateY: 90, scale: 0.86 },
        animate: { opacity: 1, rotateY: 0, scale: 1 },
      };
  }
}

export function CardReveal({
  pull,
  packLabel,
  cardLabel,
  skipAnimation = false,
  hideContinue = false,
  onReady,
  onContinue,
  continueLabel = "Next Card",
}: {
  pull: PullResultDTO;
  packLabel: string;
  cardLabel: string;
  skipAnimation?: boolean;
  hideContinue?: boolean;
  onReady?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
}) {
  const [step, setStep] = useState<RevealStep>(() => (skipAnimation ? "shown" : "suspense"));
  const readySent = useRef(false);
  const theme = resolveVisualTheme(pull.card.subset, pull.card.parallelSlug);
  const themeSpec = getThemeSpec(theme);
  const celebration = (() => {
    const boost = themeSpec.celebrationBoost;
    if (!boost) return pull.celebration;
    const order: Celebration[] = ["none", "glow", "foil", "hit", "jackpot"];
    const pullRank = order.indexOf(pull.celebration);
    const boostRank = order.indexOf(boost);
    return order[Math.max(pullRank, boostRank)] ?? pull.celebration;
  })();
  const headline = celebrationHeadline(celebration);
  const motionProps = revealMotion(themeSpec.reveal, skipAnimation);

  useEffect(() => {
    readySent.current = false;
    if (skipAnimation) {
      packSounds.playLand(celebration);
      return;
    }

    packSounds.playSuspense(celebration);
    const flipTimer = window.setTimeout(() => setStep("flip"), suspenseMs(celebration));
    return () => window.clearTimeout(flipTimer);
  }, [celebration, skipAnimation]);

  useEffect(() => {
    if (skipAnimation || step !== "flip") return;
    packSounds.playFlip();
    const land = window.setTimeout(() => {
      packSounds.playLand(celebration);
      setStep("shown");
    }, 420);
    return () => window.clearTimeout(land);
  }, [step, celebration, skipAnimation]);

  useEffect(() => {
    if (step !== "shown" || readySent.current) return;
    readySent.current = true;
    onReady?.();
  }, [step, onReady]);

  const forceShow = () => {
    if (step === "shown") return;
    setStep("shown");
    packSounds.playLand(celebration);
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col items-center justify-center">
      <div className={`shrink-0 text-center ${hideContinue ? "mb-2 md:mb-3" : "mb-3 md:mb-4"}`}>
        {!hideContinue ? (
          <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">
            {packLabel} · {cardLabel}
          </div>
        ) : null}
        <AnimatePresence mode="wait">
          {step === "suspense" && celebration !== "none" ? (
            <motion.div
              key="building"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className={`display text-ink-muted ${
                hideContinue ? "text-lg md:text-2xl" : "mt-2 text-2xl md:text-3xl"
              }`}
            >
              Something special...
            </motion.div>
          ) : null}
          {step === "shown" && headline ? (
            <motion.div
              key="headline"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`display ${
                hideContinue ? "text-xl md:text-3xl" : "mt-2 text-3xl md:text-4xl"
              } ${
                celebration === "jackpot" || celebration === "hit" ? "text-gold" : "text-pitch-400"
              }`}
            >
              {headline}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="d11-reveal-stage relative flex min-h-0 w-full flex-1 items-center justify-center py-2 md:py-3">
        {step === "suspense" ? (
          <button
            type="button"
            onClick={forceShow}
            className="cursor-pointer"
            aria-label="Skip to reveal"
          >
            <SuspenseCardBack celebration={celebration} />
          </button>
        ) : null}

        {(step === "flip" || step === "shown") && (
          <motion.div
            key={`face-${pull.card.id}-${theme}`}
            initial={motionProps.initial}
            animate={motionProps.animate}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
            style={{ transformStyle: "preserve-3d" }}
            className={`relative d11-reveal-${themeSpec.reveal} ${step === "shown" ? "card-reveal-pop" : ""}`}
            data-theme={theme}
          >
            {step === "shown" ? <RevealEffects celebration={celebration} active /> : null}
            <CardFace
              card={pull.card}
              serialDisplay={pull.serialDisplay}
              size="xl"
              celebration={celebration}
              interactiveFoil={celebration !== "none"}
              revealActive={step === "shown"}
            />
          </motion.div>
        )}
      </div>

      {step === "shown" ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="d11-market-value-panel shrink-0"
        >
          <div className="d11-market-value-label">Estimated Market Value</div>
          <div className="d11-market-value-amount">
            {formatMoney(pull.card.estimatedValueCents)}
          </div>
        </motion.div>
      ) : null}

      {!hideContinue && onContinue ? (
        <button
          type="button"
          disabled={step !== "shown"}
          onClick={() => {
            packSounds.playUiTap();
            onContinue();
          }}
          className={`mt-4 min-h-11 shrink-0 rounded-full bg-white px-8 py-3 text-sm font-semibold text-pitch-950 transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40 md:mt-5 ${
            step === "shown" ? "opacity-100" : "opacity-35"
          }`}
        >
          {step === "shown" ? continueLabel : "Revealing..."}
        </button>
      ) : null}
    </div>
  );
}

function SuspenseCardBack({ celebration }: { celebration: Celebration }) {
  return (
    <motion.div
      className="d11-card-size-theater relative"
      animate={
        celebration === "none"
          ? { scale: 1, rotate: 0 }
          : {
              scale: 1.02,
              rotate: celebration === "jackpot" ? 1.2 : 0.8,
            }
      }
      transition={
        celebration === "none"
          ? { duration: 0.2 }
          : {
              duration: celebration === "jackpot" ? 0.35 : 0.55,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }
      }
    >
      <div className="card-back relative h-full w-full overflow-hidden rounded-[14px] border border-white/20 shadow-2xl">
        <div className="absolute inset-0 pack-hologram opacity-80" />
        <div className="foil-shine absolute inset-0 mix-blend-screen opacity-60" />
        <div className="absolute inset-6 rounded-xl border border-white/15" />
        <div className="display absolute inset-0 grid place-items-center text-3xl text-white/85 md:text-4xl">
          D11
        </div>
        {celebration !== "none" ? (
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: 0.55 }}
            initial={{ opacity: 0.2 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
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
