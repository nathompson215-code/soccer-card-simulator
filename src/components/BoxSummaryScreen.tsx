"use client";

import Link from "next/link";
import { CardFace } from "@/components/CardFace";
import { formatMoney, rarityLabel } from "@/lib/format";
import type {
  BoxSummaryDTO,
  CollectionProgressDTO,
  PullResultDTO,
} from "@/lib/types";

const RARITY_ORDER = ["LEGENDARY", "MYTHIC", "ULTRA_RARE", "RARE", "UNCOMMON", "COMMON"];

export function BoxSummaryScreen({
  mode,
  pulls,
  summary,
  progress,
  onClose,
}: {
  mode: "pack" | "box";
  pulls: PullResultDTO[];
  summary: BoxSummaryDTO | null;
  progress: CollectionProgressDTO | null;
  onClose: () => void;
}) {
  const hits = summary?.topHits?.length
    ? summary.topHits
    : [...pulls]
        .filter((p) => p.isHit)
        .sort((a, b) => b.card.estimatedValueCents - a.card.estimatedValueCents)
        .slice(0, 12);

  const rarityCounts: Record<string, number> = { ...(summary?.rarityCounts ?? {}) };
  if (!summary?.rarityCounts) {
    for (const pull of pulls) {
      rarityCounts[pull.card.rarity] = (rarityCounts[pull.card.rarity] ?? 0) + 1;
    }
  }

  const estimated =
    summary?.estimatedValueCents ??
    pulls.reduce((s, p) => s + p.card.estimatedValueCents, 0);

  const hitCount = summary?.hitCount ?? pulls.filter((p) => p.isHit).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">Draft Eleven</div>
        <h3 className="display mt-2 text-4xl text-ink md:text-5xl">
          {mode === "box" ? "Hobby Box Complete" : "Pack Complete"}
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          {pulls.length} cards ripped · {hitCount} major hits · est.{" "}
          {formatMoney(estimated)}
        </p>
      </div>

      {progress ? (
        <section className="pitch-panel rounded-2xl px-5 py-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-ink-muted">
                Collection progress
              </div>
              <div className="display mt-1 text-3xl text-ink">
                {progress.uniqueOwned} / {progress.totalCatalog}
              </div>
              <div className="mt-1 text-sm text-pitch-400">
                {progress.completionPct}% of this product checklist
                {progress.newUniquesThisOpen
                  ? ` · +${progress.newUniquesThisOpen} new`
                  : ""}
              </div>
            </div>
            <div className="text-right text-sm text-ink-muted">
              Keep ripping to fill the binder
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/35">
            <div
              className="h-full rounded-full bg-pitch-500 transition-all"
              style={{ width: `${Math.min(100, progress.completionPct)}%` }}
            />
          </div>
        </section>
      ) : null}

      {summary?.guarantees?.length ? (
        <section>
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-gold">
            Hobby box guarantees
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.guarantees.map((g) => {
              const met = g.actual >= g.expected;
              return (
                <div key={g.id} className="pitch-panel rounded-xl px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                    {g.label}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="display text-3xl text-ink">
                      {g.actual}/{g.expected}
                    </span>
                    <span className={met ? "text-xs text-pitch-400" : "text-xs text-gold-soft"}>
                      {met ? "Hit" : "Short"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 text-xs uppercase tracking-[0.2em] text-ink-muted">
          Rarity breakdown
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {RARITY_ORDER.map((rarity) => {
            const count = rarityCounts[rarity] ?? 0;
            if (!count && !["COMMON", "UNCOMMON", "RARE"].includes(rarity)) return null;
            return (
              <div key={rarity} className="rounded-xl border border-white/10 px-3 py-2 text-center">
                <div className="display text-2xl text-ink">{count}</div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  {rarityLabel(rarity)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {hits.length > 0 ? (
        <section>
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-gold">Top Hits</div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {hits.map((pull, idx) => (
              <div key={`${pull.card.id}-hit-${idx}`} className="shrink-0">
                <CardFace
                  card={pull.card}
                  serialDisplay={pull.serialDisplay ?? pull.card.serialDisplay}
                  size="sm"
                  celebration={pull.celebration}
                  interactiveFoil
                />
                <div className="mt-2 max-w-[132px] text-center text-[10px] text-ink-muted">
                  {rarityLabel(pull.card.rarity)}
                  {(pull.serialDisplay ?? pull.card.serialDisplay)
                    ? ` · ${pull.serialDisplay ?? pull.card.serialDisplay}`
                    : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 text-xs uppercase tracking-[0.2em] text-ink-muted">
          Full pull list
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-pitch-900 text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Player</th>
                  <th className="px-3 py-2 font-medium">Card</th>
                  <th className="px-3 py-2 font-medium">Rarity</th>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Est.</th>
                </tr>
              </thead>
              <tbody>
                {[...pulls]
                  .sort((a, b) => b.card.estimatedValueCents - a.card.estimatedValueCents)
                  .map((pull, idx) => (
                    <tr
                      key={`${pull.card.id}-row-${idx}`}
                      className={`border-t border-white/5 ${
                        pull.isHit ? "bg-gold/5" : ""
                      }`}
                    >
                      <td className="px-3 py-2 text-ink">{pull.card.playerName}</td>
                      <td className="px-3 py-2 text-ink-muted">
                        {pull.card.subsetName} · {pull.card.parallelName}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            pull.isHit ? "font-semibold text-gold-soft" : "text-ink-muted"
                          }
                        >
                          {rarityLabel(pull.card.rarity)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-ink-muted">
                        {pull.serialDisplay ?? pull.card.serialDisplay ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-ink">
                        {formatMoney(pull.card.estimatedValueCents)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {pulls.map((pull, idx) => (
            <CardFace
              key={`${pull.card.id}-grid-${idx}`}
              card={pull.card}
              serialDisplay={pull.serialDisplay ?? pull.card.serialDisplay}
              size="sm"
              celebration={pull.celebration}
            />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap justify-center gap-3 pb-6 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 rounded-full bg-pitch-500 px-6 py-3 text-sm font-semibold text-pitch-950"
        >
          Done
        </button>
        <Link
          href="/collection"
          className="min-h-12 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-ink"
        >
          View Collection
        </Link>
        <Link
          href="/history"
          className="min-h-12 rounded-full border border-gold/35 bg-gold/10 px-6 py-3 text-sm font-semibold text-gold-soft"
        >
          Opening History
        </Link>
      </div>
    </div>
  );
}
