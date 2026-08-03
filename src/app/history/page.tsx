import Link from "next/link";
import { CardFace } from "@/components/CardFace";
import { formatMoney, formatNumber, rarityLabel } from "@/lib/format";
import { getProgression } from "@/lib/progression";
import type { AchievementDTO, OpeningDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatWhen(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function AchievementBadge({ achievement }: { achievement: AchievementDTO }) {
  return (
    <div
      className={`pitch-panel rounded-2xl px-4 py-4 transition ${
        achievement.unlocked ? "border-gold/30" : "opacity-45"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border text-[11px] font-bold tracking-wide ${
            achievement.unlocked
              ? "border-gold/45 bg-gold/15 text-gold-soft"
              : "border-white/15 bg-white/5 text-ink-muted"
          }`}
        >
          {achievement.mark}
        </div>
        <div className="min-w-0">
          <div className="display text-2xl text-ink">{achievement.title}</div>
          <p className="mt-1 text-xs text-ink-muted">{achievement.description}</p>
          {achievement.unlocked && achievement.unlockedAt ? (
            <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-pitch-400">
              Unlocked {formatWhen(achievement.unlockedAt)}
            </div>
          ) : (
            <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              Locked
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OpeningCard({ opening }: { opening: OpeningDTO }) {
  const accent = opening.product.accentHex ?? "#22a06b";
  return (
    <article className="pitch-panel overflow-hidden rounded-3xl">
      <div
        className="border-b border-white/10 px-5 py-4 md:px-6"
        style={{
          background: `linear-gradient(135deg, ${accent}22, transparent 70%)`,
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">
              {opening.mode === "box" ? "Box opening" : "Pack opening"} ·{" "}
              {formatWhen(opening.openedAt)}
            </div>
            <h3 className="display mt-1 text-3xl text-ink">{opening.product.name}</h3>
            <p className="mt-1 text-sm text-ink-muted">
              {formatNumber(opening.cardCount)} cards · {formatNumber(opening.packCount)} pack
              {opening.packCount === 1 ? "" : "s"} · est. {formatMoney(opening.totalValueCents)}
            </p>
          </div>
          {opening.biggestHit ? (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.18em] text-gold">Biggest hit</div>
              <div className="mt-1 text-sm text-ink">
                {opening.biggestHit.card.playerName}
                {opening.biggestHit.serialDisplay
                  ? ` · ${opening.biggestHit.serialDisplay}`
                  : ""}
              </div>
              <div className="text-sm text-gold-soft">
                {formatMoney(opening.biggestHit.valueCentsAtOpen)}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-5 py-5 md:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.18em] text-ink-muted">
            Cards from this opening
          </div>
          <Link
            href={`/products/${opening.product.slug}`}
            className="text-xs text-pitch-400 hover:text-pitch-500"
          >
            Rip again →
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[...opening.pulls]
            .sort((a, b) => b.valueCentsAtOpen - a.valueCentsAtOpen)
            .map((pull) => (
              <div key={pull.id} className="shrink-0">
                <CardFace
                  card={pull.card}
                  serialDisplay={pull.serialDisplay ?? pull.card.serialDisplay}
                  size="sm"
                  celebration={pull.celebration}
                />
                <div className="mt-2 max-w-[132px] text-center text-[10px] text-ink-muted">
                  {formatMoney(pull.valueCentsAtOpen)}
                  {pull.isHit ? ` · ${rarityLabel(pull.card.rarity)}` : ""}
                </div>
              </div>
            ))}
        </div>
      </div>
    </article>
  );
}

export default async function HistoryPage() {
  const progression = await getProgression(50);
  const { stats, achievements, openings } = progression;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const headline = [
    { label: "Packs opened", value: formatNumber(stats.packsOpened) },
    { label: "Boxes opened", value: formatNumber(stats.boxesOpened) },
    { label: "Total cards pulled", value: formatNumber(stats.totalCardsPulled) },
    { label: "Unique cards owned", value: formatNumber(stats.uniqueCardsOwned) },
    { label: "Autographs pulled", value: formatNumber(stats.autographsPulled) },
    { label: "Numbered cards pulled", value: formatNumber(stats.numberedCardsPulled) },
    { label: "Booklets pulled", value: formatNumber(stats.bookletsPulled) },
    { label: "1/1 cards pulled", value: formatNumber(stats.oneOfOnesPulled) },
    {
      label: "Est. collection value",
      value: formatMoney(stats.estimatedCollectionValueCents),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">
          Opening history & progression
        </div>
        <h1 className="display mt-2 text-5xl text-ink md:text-6xl">Rip Log</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Every pack and box is saved permanently — product, timestamp, every card pulled, values
          at open, and lifetime milestones.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {headline.map((stat, i) => (
          <div
            key={stat.label}
            className="binder-stat pitch-panel rounded-2xl px-4 py-4"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="display text-3xl text-gold-soft md:text-4xl">{stat.value}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink-muted">
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <div className="pitch-panel rounded-3xl p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Best pull ever</div>
          {stats.bestPull ? (
            <div className="mt-4 flex flex-wrap items-end gap-5">
              <CardFace
                card={stats.bestPull.card}
                serialDisplay={stats.bestPull.serialDisplay ?? stats.bestPull.card.serialDisplay}
                size="md"
                celebration={stats.bestPull.celebration}
              />
              <div className="min-w-0 flex-1">
                <div className="display text-3xl text-ink">{stats.bestPull.card.playerName}</div>
                <p className="mt-1 text-sm text-ink-muted">
                  {stats.bestPull.card.subsetName} · {stats.bestPull.card.parallelName}
                  {(stats.bestPull.serialDisplay ?? stats.bestPull.card.serialDisplay)
                    ? ` · ${stats.bestPull.serialDisplay ?? stats.bestPull.card.serialDisplay}`
                    : ""}
                </p>
                <div className="mt-3 display text-4xl text-gold-soft">
                  {formatMoney(stats.bestPull.valueCentsAtOpen)}
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Value recorded at the moment it was pulled
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              No pulls yet. Open a pack to start your history.
            </p>
          )}
        </div>

        <div className="pitch-panel rounded-3xl p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Best-value opening</div>
          {stats.bestValueOpening ? (
            <div className="mt-4">
              <div className="display text-3xl text-ink">{stats.bestValueOpening.product.name}</div>
              <p className="mt-1 text-sm text-ink-muted">
                {stats.bestValueOpening.mode === "box" ? "Box" : "Pack"} ·{" "}
                {formatWhen(stats.bestValueOpening.openedAt)} ·{" "}
                {formatNumber(stats.bestValueOpening.cardCount)} cards
              </p>
              <div className="mt-3 display text-4xl text-gold-soft">
                {formatMoney(stats.bestValueOpening.totalValueCents)}
              </div>
              {stats.biggestHitOpening &&
              stats.biggestHitOpening.id !== stats.bestValueOpening.id ? (
                <p className="mt-4 text-xs text-ink-muted">
                  Biggest single-hit opening: {stats.biggestHitOpening.product.name} (
                  {formatMoney(stats.biggestHitOpening.biggestHitValueCents)})
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">Rip a pack or box to crown a best opening.</p>
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="display text-3xl text-ink">Achievements</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {unlockedCount} / {achievements.length} unlocked
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <AchievementBadge key={a.key} achievement={a} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="display text-3xl text-ink">Recent openings</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {openings.length
                ? `${formatNumber(openings.length)} most recent saved rips`
                : "Nothing saved yet"}
            </p>
          </div>
          <Link href="/products" className="text-sm text-pitch-400">
            Open packs →
          </Link>
        </div>

        {openings.length === 0 ? (
          <div className="pitch-panel rounded-2xl px-6 py-12 text-center">
            <p className="text-ink-muted">
              Open a product and rip a pack — every opening is saved here with card values at the
              time of the rip.
            </p>
            <Link
              href="/products"
              className="mt-4 inline-flex rounded-full bg-pitch-500 px-5 py-3 text-sm font-semibold text-pitch-950"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {openings.map((opening) => (
              <OpeningCard key={opening.id} opening={opening} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
