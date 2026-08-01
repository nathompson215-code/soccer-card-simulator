"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CardFace } from "@/components/CardFace";
import { CardReveal } from "@/components/CardReveal";
import { SuspenseVeil } from "@/components/RevealEffects";
import { SealedPack } from "@/components/SealedPack";
import { packSounds, revealIntensity, suspenseMs } from "@/lib/pack-sounds";
import type { Celebration, PackResultDTO, ProductDTO, PullResultDTO } from "@/lib/types";

type Phase = "idle" | "ripping" | "revealing" | "summary";

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

export function PackOpener({ product }: { product: ProductDTO }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<"pack" | "box">("pack");
  const [packIndex, setPackIndex] = useState(0);
  const [queue, setQueue] = useState<PackResultDTO[]>([]);
  const [currentPulls, setCurrentPulls] = useState<PullResultDTO[]>([]);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [allPulls, setAllPulls] = useState<PullResultDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ripState, setRipState] = useState<"charging" | "ripping" | "burst">("charging");
  const [packAura, setPackAura] = useState<Celebration>("none");
  const [chargeProgress, setChargeProgress] = useState(0);

  const currentCard = revealIndex >= 0 ? currentPulls[revealIndex] : null;
  const hits = useMemo(() => allPulls.filter((p) => p.isHit), [allPulls]);

  useEffect(() => {
    packSounds.setMuted(muted);
  }, [muted]);

  const beginPack = (packs: PackResultDTO[], index: number, accumulated: PullResultDTO[]) => {
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
    setRevealIndex(-1);
    setPackAura(aura);
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

    window.setTimeout(() => {
      cancelAnimationFrame(raf);
      setChargeProgress(1);
      setRipState("ripping");
      packSounds.playRip();
      window.setTimeout(() => {
        setRipState("burst");
        window.setTimeout(() => {
          setPhase("revealing");
          setRevealIndex(0);
        }, 280);
      }, 520);
    }, chargeMs);
  };

  const start = async (nextMode: "pack" | "box") => {
    await packSounds.unlock();
    setError(null);
    setLoading(true);
    setMode(nextMode);
    setRipState("charging");
    setPackAura("glow");
    setChargeProgress(0.2);
    setPhase("ripping");
    packSounds.playUiTap();
    try {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug: product.slug, mode: nextMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open");
      const packs = data.packs as PackResultDTO[];
      setQueue(packs);
      setAllPulls([]);
      beginPack(packs, 0, []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open packs");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  };

  const nextReveal = () => {
    if (revealIndex < currentPulls.length - 1) {
      setRevealIndex((i) => i + 1);
      return;
    }
    const accumulated = [...allPulls, ...currentPulls];
    setAllPulls(accumulated);
    if (packIndex < queue.length - 1) {
      beginPack(queue, packIndex + 1, accumulated);
    } else {
      setPhase("summary");
      packSounds.playSummary();
    }
  };

  const reset = () => {
    setPhase("idle");
    setQueue([]);
    setCurrentPulls([]);
    setRevealIndex(-1);
    setAllPulls([]);
    setError(null);
    setPackAura("none");
    setChargeProgress(0);
  };

  const accent = product.accentHex ?? "#001F5B";

  return (
    <div className="pitch-panel overflow-hidden rounded-3xl">
      <div className="stadium-lights border-b border-white/10 px-5 py-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">Pack Theater</div>
            <h2 className="display mt-1 text-3xl text-ink md:text-4xl">Open {product.name}</h2>
            <p className="mt-2 max-w-xl text-sm text-ink-muted">
              Premium rip experience · suspense on rare pulls · holographic foil reveals
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-ink-muted hover:text-ink"
              aria-pressed={muted}
            >
              {muted ? "Unmute" : "Mute"}
            </button>
            {phase === "idle" ? (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => start("pack")}
                  className="rounded-full bg-pitch-500 px-5 py-3 text-sm font-semibold text-pitch-950 transition hover:bg-pitch-400 disabled:opacity-60"
                >
                  Rip 1 Pack
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => start("box")}
                  className="rounded-full border border-gold/40 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold-soft transition hover:bg-gold/20 disabled:opacity-60"
                >
                  Open Full Box
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-ink-muted hover:text-ink"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </div>

      <div className="relative min-h-[520px] px-4 py-8 md:px-8">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center justify-center gap-6 py-10"
            >
              <SealedPack
                accentHex={accent}
                manufacturer={product.manufacturer.name}
                brandLabel={product.brand?.name ?? product.manufacturer.name}
                subtitle={product.tournament?.name ?? product.league?.name ?? product.name}
                label="Sealed Pack"
                state="idle"
              />
              <p className="max-w-md text-center text-sm text-ink-muted">
                Tear the wrapper, feel the build-up on chrome hits, and watch foil cards catch the
                light as they land in your collection.
              </p>
            </motion.div>
          )}

          {phase === "ripping" && (
            <motion.div
              key={`ripping-${packIndex}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.08, filter: "blur(8px)" }}
              className="relative flex min-h-[420px] flex-col items-center justify-center py-10"
            >
              <SuspenseVeil celebration={packAura} progress={chargeProgress} />
              <SealedPack
                accentHex={accent}
                manufacturer={product.manufacturer.name}
                brandLabel={product.brand?.name ?? product.manufacturer.name}
                subtitle={product.tournament?.name ?? product.league?.name ?? product.name}
                label={
                  mode === "box"
                    ? `Pack ${packIndex + 1} / ${queue.length || product.packsPerBox}`
                    : "Ripping..."
                }
                state={ripState}
                intensity={revealIntensity(packAura)}
              />
              <motion.p
                className="relative z-10 mt-8 display text-3xl text-pitch-400"
                animate={{ opacity: 1 }}
                initial={{ opacity: 0.55 }}
                transition={{ duration: 0.7, repeat: Infinity, repeatType: "reverse" }}
              >
                {ripState === "charging"
                  ? packAura === "jackpot" || packAura === "hit"
                    ? "Energy building..."
                    : packAura === "foil"
                      ? "Chrome warming up..."
                      : "Feeling the pack..."
                  : ripState === "ripping"
                    ? "Tear!"
                    : "Cards incoming"}
              </motion.p>
            </motion.div>
          )}

          {phase === "revealing" && currentCard && (
            <motion.div
              key={`reveal-${packIndex}-${revealIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <CardReveal
                key={`${packIndex}-${revealIndex}-${currentCard.card.id}`}
                pull={currentCard}
                packLabel={mode === "box" ? `Pack ${packIndex + 1}` : "Single Pack"}
                cardLabel={`Card ${revealIndex + 1}/${currentPulls.length}`}
                onContinue={nextReveal}
                continueLabel={
                  revealIndex < currentPulls.length - 1
                    ? "Reveal Next"
                    : packIndex < queue.length - 1
                      ? "Next Pack"
                      : "See Results"
                }
              />
            </motion.div>
          )}

          {phase === "summary" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="display text-4xl text-ink">
                  {mode === "box" ? "Box Complete" : "Pack Complete"}
                </h3>
                <p className="mt-2 text-sm text-ink-muted">
                  {allPulls.length} cards saved · {hits.length} hits
                </p>
              </div>

              {hits.length > 0 ? (
                <div>
                  <div className="mb-3 text-xs uppercase tracking-[0.2em] text-gold">Top Hits</div>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {hits.slice(0, 12).map((pull, idx) => (
                      <CardFace
                        key={`${pull.card.id}-hit-${idx}`}
                        card={pull.card}
                        serialDisplay={pull.serialDisplay}
                        size="sm"
                        celebration={pull.celebration}
                        interactiveFoil
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="mb-3 text-xs uppercase tracking-[0.2em] text-ink-muted">
                  Full Pull List
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {allPulls.map((pull, idx) => (
                    <CardFace
                      key={`${pull.card.id}-${idx}`}
                      card={pull.card}
                      serialDisplay={pull.serialDisplay}
                      size="sm"
                      celebration={pull.celebration}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => start(mode)}
                  className="rounded-full bg-pitch-500 px-5 py-3 text-sm font-semibold text-pitch-950"
                >
                  Open Another {mode === "box" ? "Box" : "Pack"}
                </button>
                <a
                  href="/collection"
                  className="rounded-full border border-white/15 px-5 py-3 text-sm text-ink"
                >
                  View Collection
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
