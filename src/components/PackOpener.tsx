"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CardFace } from "@/components/CardFace";
import type { PackResultDTO, ProductDTO, PullResultDTO } from "@/lib/types";

type Phase = "idle" | "ripping" | "revealing" | "summary";

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

  const currentCard = revealIndex >= 0 ? currentPulls[revealIndex] : null;
  const hits = useMemo(() => allPulls.filter((p) => p.isHit), [allPulls]);

  const beginPack = (packs: PackResultDTO[], index: number, accumulated: PullResultDTO[]) => {
    const pack = packs[index];
    if (!pack) {
      setAllPulls(accumulated);
      setPhase("summary");
      return;
    }
    setPackIndex(index);
    setCurrentPulls(pack.cards);
    setRevealIndex(-1);
    setPhase("revealing");
    window.setTimeout(() => setRevealIndex(0), 250);
  };

  const start = async (nextMode: "pack" | "box") => {
    setError(null);
    setLoading(true);
    setMode(nextMode);
    setPhase("ripping");
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
      window.setTimeout(() => beginPack(packs, 0, []), 500);
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
      setPhase("ripping");
      window.setTimeout(() => beginPack(queue, packIndex + 1, accumulated), 550);
    } else {
      setPhase("summary");
    }
  };

  const reset = () => {
    setPhase("idle");
    setQueue([]);
    setCurrentPulls([]);
    setRevealIndex(-1);
    setAllPulls([]);
    setError(null);
  };

  return (
    <div className="pitch-panel overflow-hidden rounded-3xl">
      <div className="stadium-lights border-b border-white/10 px-5 py-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">Pack Theater</div>
            <h2 className="display mt-1 text-3xl text-ink md:text-4xl">Open {product.name}</h2>
            <p className="mt-2 max-w-xl text-sm text-ink-muted">
              {product.packsPerBox} packs · {product.cardsPerPack} cards per pack · odds from the
              database
            </p>
          </div>
          {phase === "idle" ? (
            <div className="flex flex-wrap gap-3">
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
            </div>
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
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </div>

      <div className="relative min-h-[420px] px-4 py-8 md:px-8">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center justify-center gap-6 py-10"
            >
              <motion.div
                className="float-y relative h-56 w-40 rounded-2xl shadow-2xl"
                style={{
                  background: `linear-gradient(160deg, ${product.accentHex ?? "#1b7a4e"}, #07110d)`,
                }}
              >
                <div className="absolute inset-0 rounded-2xl border border-white/20" />
                <div className="absolute inset-x-4 top-8 h-1 rounded bg-white/30" />
                <div className="absolute inset-x-8 top-14 h-1 rounded bg-white/15" />
                <div className="display absolute inset-x-0 bottom-10 text-center text-3xl text-white">
                  {product.manufacturer.slug.toUpperCase()}
                </div>
                <div className="absolute inset-x-0 bottom-4 text-center text-[10px] uppercase tracking-[0.2em] text-white/70">
                  Sealed Pack
                </div>
              </motion.div>
              <p className="max-w-md text-center text-sm text-ink-muted">
                Pulls are simulated from PostgreSQL checklist, parallel, and odds tables, then saved
                to your collection.
              </p>
            </motion.div>
          )}

          {phase === "ripping" && (
            <motion.div
              key="ripping"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1.05 }}
              exit={{ opacity: 0, scale: 1.2, filter: "blur(8px)" }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div
                className="h-56 w-40 rounded-2xl shadow-[0_0_60px_rgba(34,160,107,0.35)]"
                style={{
                  background: `linear-gradient(160deg, ${product.accentHex ?? "#1b7a4e"}, #07110d)`,
                }}
              />
              <p className="mt-6 display text-3xl text-pitch-400">
                {mode === "box"
                  ? `Pack ${packIndex + 1} / ${queue.length || product.packsPerBox}`
                  : "Ripping..."}
              </p>
            </motion.div>
          )}

          {phase === "revealing" && currentCard && (
            <motion.div
              key={`reveal-${packIndex}-${revealIndex}`}
              initial={{ opacity: 0, y: 40, rotateY: -40 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
              className="flex flex-col items-center"
            >
              <div className="mb-4 text-center">
                <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">
                  {mode === "box" ? `Pack ${packIndex + 1}` : "Single Pack"} · Card{" "}
                  {revealIndex + 1}/{currentPulls.length}
                </div>
                {currentCard.celebration !== "none" ? (
                  <div className="display mt-2 text-2xl text-gold">
                    {currentCard.celebration === "jackpot"
                      ? "ONE OF ONE ENERGY"
                      : currentCard.celebration === "hit"
                        ? "HIT PULLED"
                        : "FOIL PULL"}
                  </div>
                ) : null}
              </div>

              <CardFace
                card={currentCard.card}
                serialDisplay={currentCard.serialDisplay}
                size="lg"
                celebration={currentCard.celebration}
              />

              <button
                type="button"
                onClick={nextReveal}
                className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-pitch-950 transition hover:bg-gold-soft"
              >
                {revealIndex < currentPulls.length - 1
                  ? "Reveal Next"
                  : packIndex < queue.length - 1
                    ? "Next Pack"
                    : "See Results"}
              </button>
            </motion.div>
          )}

          {phase === "summary" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="display text-4xl text-ink">
                  {mode === "box" ? "Box Complete" : "Pack Complete"}
                </h3>
                <p className="mt-2 text-sm text-ink-muted">
                  {allPulls.length} cards saved to PostgreSQL · {hits.length} hits
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
