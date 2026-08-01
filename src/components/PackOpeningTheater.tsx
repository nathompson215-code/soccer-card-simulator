"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BoxSummaryScreen } from "@/components/BoxSummaryScreen";
import { CardReveal } from "@/components/CardReveal";
import { SuspenseVeil } from "@/components/RevealEffects";
import { SealedPack } from "@/components/SealedPack";
import { packSounds, revealIntensity, suspenseMs } from "@/lib/pack-sounds";
import type {
  BoxSummaryDTO,
  Celebration,
  CollectionProgressDTO,
  PackResultDTO,
  ProductDTO,
  PullResultDTO,
} from "@/lib/types";

type Phase = "loading" | "ripping" | "revealing" | "summary";
type RipState = "charging" | "ripping" | "burst";

function bestCelebration(cards: PullResultDTO[]): Celebration {
  const rank: Record<Celebration, number> = {
    none: 0,
    glow: 1,
    foil: 2,
    hit: 3,
    jackpot: 4,
  };
  return cards.reduce<Celebration>(
    (best, c) => (rank[c.celebration] > rank[best] ? c.celebration : best),
    "none",
  );
}

export function PackOpeningTheater({
  product,
  mode,
  onClose,
}: {
  product: ProductDTO;
  mode: "pack" | "box";
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [queue, setQueue] = useState<PackResultDTO[]>([]);
  const [packIndex, setPackIndex] = useState(0);
  const [currentPulls, setCurrentPulls] = useState<PullResultDTO[]>([]);
  const [revealIndex, setRevealIndex] = useState(0);
  const [allPulls, setAllPulls] = useState<PullResultDTO[]>([]);
  const [boxSummary, setBoxSummary] = useState<BoxSummaryDTO | null>(null);
  const [collectionProgress, setCollectionProgress] = useState<CollectionProgressDTO | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [ripState, setRipState] = useState<RipState>("charging");
  const [packAura, setPackAura] = useState<Celebration>("none");
  const [chargeProgress, setChargeProgress] = useState(0);
  const [cardReady, setCardReady] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const [revealAll, setRevealAll] = useState(false);
  const timers = useRef<number[]>([]);
  const revealAllRef = useRef(false);

  const currentCard = currentPulls[revealIndex] ?? null;
  const accent = product.accentHex ?? "#001F5B";
  const totalCards = useMemo(
    () => queue.reduce((sum, pack) => sum + pack.cards.length, 0) || product.cardsPerPack,
    [queue, product.cardsPerPack],
  );
  const revealedCount = allPulls.length + (phase === "revealing" ? revealIndex + (cardReady ? 1 : 0) : 0);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      clearTimers();
    };
  }, []);

  useEffect(() => {
    packSounds.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    revealAllRef.current = revealAll;
  }, [revealAll]);

  const beginPack = useCallback(
    (packs: PackResultDTO[], index: number, accumulated: PullResultDTO[], instant = false) => {
      clearTimers();
      const pack = packs[index];
      if (!pack) {
        setAllPulls(accumulated);
        setPhase("summary");
        packSounds.playSummary();
        return;
      }

      const aura = bestCelebration(pack.cards);
      setPackIndex(index);
      setCurrentPulls(pack.cards);
      setRevealIndex(0);
      setCardReady(false);
      setPackAura(aura);
      setAllPulls(accumulated);

      if (instant) {
        setSkipAnimation(true);
        setPhase("revealing");
        setCardReady(true);
        return;
      }

      setSkipAnimation(false);
      setChargeProgress(0);
      setRipState("charging");
      setPhase("ripping");
      packSounds.playWhoosh();
      packSounds.playSuspense(aura);

      const chargeMs = Math.max(450, suspenseMs(aura) * 0.55);
      const start = performance.now();
      let raf = 0;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / chargeMs);
        setChargeProgress(p);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      schedule(() => {
        cancelAnimationFrame(raf);
        setChargeProgress(1);
        setRipState("ripping");
        packSounds.playRip();
        schedule(() => {
          setRipState("burst");
          schedule(() => {
            setPhase("revealing");
            setRevealIndex(0);
            setCardReady(false);
          }, 280);
        }, 520);
      }, chargeMs);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await packSounds.unlock();
      setPhase("loading");
      setError(null);
      try {
        const res = await fetch("/api/packs/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productSlug: product.slug, mode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to open");
        if (cancelled) return;
        const packs = data.packs as PackResultDTO[];
        setQueue(packs);
        setAllPulls([]);
        setBoxSummary((data.boxSummary as BoxSummaryDTO | null) ?? null);
        setCollectionProgress(
          (data.collectionProgress as CollectionProgressDTO | null) ?? null,
        );
        beginPack(packs, 0, [], false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to open packs");
      }
    };
    void run();
    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [product.slug, mode, beginPack]);

  const finishSession = useCallback(() => {
    clearTimers();
    setRevealAll(false);
    revealAllRef.current = false;
    setAllPulls(queue.flatMap((pack) => pack.cards));
    setPhase("summary");
    packSounds.playSummary();
  }, [queue]);

  const nextCard = useCallback(() => {
    packSounds.playUiTap();
    setCardReady(false);

    if (revealIndex < currentPulls.length - 1) {
      const nextSkip = revealAllRef.current;
      setSkipAnimation(nextSkip);
      setRevealIndex((i) => i + 1);
      return;
    }

    const accumulated = [...allPulls, ...currentPulls];
    setAllPulls(accumulated);
    if (packIndex < queue.length - 1) {
      beginPack(queue, packIndex + 1, accumulated, revealAllRef.current);
    } else {
      setPhase("summary");
      setRevealAll(false);
      packSounds.playSummary();
    }
  }, [allPulls, beginPack, currentPulls, packIndex, queue, revealIndex]);

  const onCardReady = useCallback(() => {
    setCardReady(true);
    if (revealAllRef.current) {
      schedule(() => nextCard(), 220);
    }
  }, [nextCard]);

  const skipCurrentAnimation = () => {
    packSounds.playUiTap();
    setSkipAnimation(true);
    setCardReady(true);
  };

  const startRevealAll = () => {
    packSounds.playUiTap();
    setRevealAll(true);
    revealAllRef.current = true;
    setSkipAnimation(true);
    if (cardReady) {
      schedule(() => nextCard(), 120);
    } else {
      setCardReady(true);
    }
  };

  const theater = (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col bg-[#050c09]/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${mode === "box" ? "Box" : "Pack"} opening theater`}
    >
      <div className="stadium-lights pointer-events-none absolute inset-0 opacity-80" />

      <header className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink-muted md:text-xs">
            Draft Eleven · {mode === "box" ? "Box Opening" : "Pack Opening"}
          </div>
          <h2 className="display truncate text-2xl text-ink md:text-3xl">{product.name}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void packSounds.unlock();
              setMuted((prev) => {
                const next = !prev;
                packSounds.setMuted(next);
                return next;
              });
            }}
            className="rounded-full border border-white/15 px-3 py-2 text-xs text-ink-muted hover:text-ink md:px-4 md:text-sm"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-3 py-2 text-xs text-ink-muted hover:text-ink md:px-4 md:text-sm"
          >
            Close
          </button>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
            <p className="text-danger">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-pitch-950"
            >
              Back to product
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {(phase === "loading" || phase === "ripping") && (
              <motion.div
                key={`rip-${packIndex}-${phase}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.06, filter: "blur(8px)" }}
                className="relative flex flex-1 flex-col items-center justify-center px-4 py-8"
              >
                <SuspenseVeil
                  celebration={packAura}
                  progress={phase === "loading" ? 0.25 : chargeProgress}
                />
                <SealedPack
                  accentHex={accent}
                  manufacturer={product.manufacturer.name}
                  brandLabel={product.brand?.name ?? product.manufacturer.name}
                  subtitle={product.tournament?.name ?? product.league?.name ?? product.name}
                  label={
                    mode === "box"
                      ? `Pack ${Math.min(packIndex + 1, queue.length || product.packsPerBox)} / ${
                          queue.length || product.packsPerBox
                        }`
                      : phase === "loading"
                        ? "Opening..."
                        : "Ripping..."
                  }
                  state={phase === "loading" ? "charging" : ripState}
                  intensity={revealIntensity(packAura)}
                />
                <p className="relative z-10 mt-8 display text-3xl text-pitch-400 md:text-4xl">
                  {phase === "loading"
                    ? "Preparing the rip..."
                    : ripState === "charging"
                      ? packAura === "jackpot" || packAura === "hit"
                        ? "Energy building..."
                        : packAura === "foil"
                          ? "Chrome warming up..."
                          : "Feeling the pack..."
                      : ripState === "ripping"
                        ? "Tear!"
                        : "Cards incoming"}
                </p>
              </motion.div>
            )}

            {phase === "revealing" && currentCard && (
              <motion.div
                key={`reveal-stage-${packIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex items-center justify-center gap-2 px-4 pt-3 text-[11px] uppercase tracking-[0.18em] text-ink-muted md:pt-4">
                  <span>
                    {mode === "box" ? `Pack ${packIndex + 1}/${queue.length}` : "Single Pack"}
                  </span>
                  <span className="text-white/20">·</span>
                  <span>
                    Card {revealIndex + 1}/{currentPulls.length}
                  </span>
                  <span className="text-white/20">·</span>
                  <span>
                    {Math.min(revealedCount, totalCards)}/{totalCards} opened
                  </span>
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-3 py-4 md:px-6">
                  <CardReveal
                    key={`${packIndex}-${revealIndex}-${currentCard.card.id}-${skipAnimation ? "skip" : "play"}`}
                    pull={currentCard}
                    packLabel={mode === "box" ? `Pack ${packIndex + 1}` : "Single Pack"}
                    cardLabel={`Card ${revealIndex + 1}/${currentPulls.length}`}
                    skipAnimation={skipAnimation}
                    hideContinue
                    onReady={onCardReady}
                  />
                </div>

                <div className="safe-bottom border-t border-white/10 bg-[#07110d]/90 px-3 py-3 backdrop-blur md:px-6 md:py-4">
                  <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
                    <button
                      type="button"
                      disabled={!cardReady || revealAll}
                      onClick={nextCard}
                      className="min-h-12 flex-1 rounded-full bg-white px-5 py-3 text-sm font-semibold text-pitch-950 transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:min-w-[160px]"
                    >
                      {revealIndex < currentPulls.length - 1
                        ? "Next Card"
                        : packIndex < queue.length - 1
                          ? "Next Pack"
                          : "Finish"}
                    </button>
                    <button
                      type="button"
                      disabled={revealAll || phase !== "revealing"}
                      onClick={startRevealAll}
                      className="min-h-12 flex-1 rounded-full border border-pitch-400/40 bg-pitch-500/15 px-5 py-3 text-sm font-semibold text-pitch-400 transition hover:bg-pitch-500/25 disabled:opacity-40 sm:flex-none"
                    >
                      Reveal All
                    </button>
                    <button
                      type="button"
                      disabled={cardReady || skipAnimation}
                      onClick={skipCurrentAnimation}
                      className="min-h-12 flex-1 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-40 sm:flex-none"
                    >
                      Skip Animation
                    </button>
                    <button
                      type="button"
                      onClick={finishSession}
                      className="min-h-12 flex-1 rounded-full border border-gold/40 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold-soft transition hover:bg-gold/20 sm:flex-none"
                    >
                      Finish / Add to Collection
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {phase === "summary" && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 md:px-8"
              >
                <BoxSummaryScreen
                  mode={mode}
                  pulls={allPulls}
                  summary={boxSummary}
                  progress={collectionProgress}
                  onClose={onClose}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );

  return createPortal(theater, document.body);
}
