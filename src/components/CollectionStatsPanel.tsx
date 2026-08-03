import Link from "next/link";
import { CardFace } from "@/components/CardFace";
import { formatMoney, formatNumber } from "@/lib/format";
import type { CollectionStatsDTO, CompletionBucketDTO } from "@/lib/types";

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/35">
      <div
        className="h-full rounded-full bg-gradient-to-r from-pitch-600 to-pitch-400 transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export function CollectionStatsPanel({
  stats,
  overall,
  products,
  insertSets,
}: {
  stats: CollectionStatsDTO;
  overall: CompletionBucketDTO;
  products: CompletionBucketDTO[];
  insertSets: CompletionBucketDTO[];
}) {
  const headlineStats = [
    { label: "Total cards owned", value: formatNumber(stats.totalOwned) },
    { label: "Unique cards", value: formatNumber(stats.uniqueOwned) },
    { label: "Duplicate copies", value: formatNumber(stats.duplicateCards) },
    { label: "Est. collection value", value: formatMoney(stats.totalEstimatedValueCents) },
    {
      label: "Products completed",
      value: `${stats.productsCompleted}/${stats.productsTotal}`,
    },
    { label: "Overall completion", value: `${overall.pct}%` },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {headlineStats.map((stat, i) => (
          <div
            key={stat.label}
            className="binder-stat pitch-panel rounded-2xl px-4 py-4"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="display text-3xl text-gold-soft md:text-4xl">{stat.value}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-muted">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="display text-3xl text-ink">Completion</h2>
          <p className="text-xs text-ink-muted">
            {overall.owned} / {overall.total} unique catalog cards
          </p>
        </div>
        <div className="pitch-panel rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium text-ink">{overall.name}</div>
            <div className="text-sm text-pitch-400">{overall.pct}%</div>
          </div>
          <ProgressBar pct={overall.pct} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/collection?product=${p.productSlug}`}
              className="pitch-panel rounded-xl px-4 py-3 transition hover:border-pitch-400/40"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-ink">{p.name}</div>
                <div className="text-sm text-pitch-400">{p.pct}%</div>
              </div>
              <ProgressBar pct={p.pct} />
              <div className="mt-1 text-xs text-ink-muted">
                {p.owned} / {p.total}
              </div>
            </Link>
          ))}
        </div>

        {insertSets.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-[0.2em] text-ink-muted">Insert sets</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {insertSets.map((s) => (
                <Link
                  key={s.id}
                  href={`/collection?product=${s.productSlug}&insertSet=${s.setSlug}`}
                  className="pitch-panel rounded-xl px-4 py-3 transition hover:border-gold/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-ink">{s.name}</div>
                    </div>
                    <div className="shrink-0 text-sm text-gold-soft">{s.pct}%</div>
                  </div>
                  <ProgressBar pct={s.pct} />
                  <div className="mt-1 text-xs text-ink-muted">
                    {s.owned} / {s.total}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="display text-3xl text-ink">Top 10 most valuable</h2>
          {stats.topValuable.length === 0 ? (
            <p className="mt-3 text-ink-muted">Open packs to start building value.</p>
          ) : (
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {stats.topValuable.map((entry) => (
                <Link key={entry.cardId} href={`/cards/${entry.card.slug}`} className="shrink-0">
                  <CardFace
                    card={entry.card}
                    serialDisplay={entry.serialDisplays[0] ?? entry.card.serialDisplay}
                    size="sm"
                    celebration={
                      entry.card.rarity === "LEGENDARY"
                        ? "jackpot"
                        : entry.card.rarity === "MYTHIC"
                          ? "hit"
                          : "none"
                    }
                  />
                  <div className="mt-2 text-center text-xs text-gold-soft">
                    {formatMoney(entry.card.estimatedValueCents)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="display text-3xl text-ink">Recent pulls</h2>
            <Link href="/products" className="text-sm text-pitch-400">
              Open more packs →
            </Link>
          </div>
          {stats.recentPulls.length === 0 ? (
            <p className="text-ink-muted">No pulls yet.</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {stats.recentPulls.map((item) => (
                <Link key={item.instanceId} href={`/cards/${item.card.slug}`} className="shrink-0">
                  <CardFace card={item.card} serialDisplay={item.serialDisplay ?? item.card.serialDisplay} size="sm" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
