import Link from "next/link";
import { CardFace } from "@/components/CardFace";
import { getCollection } from "@/lib/collection";
import { formatMoney, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const collection = await getCollection();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">Binder</div>
        <h1 className="display mt-2 text-5xl text-ink">My Collection</h1>
        <p className="mt-3 text-ink-muted">
          {collection.user.displayName} · pulls are persisted in PostgreSQL as UserCard rows.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Collection value", value: formatMoney(collection.estimatedValueCents) },
          { label: "Cards owned", value: formatNumber(collection.totalOwned) },
          { label: "Unique cards", value: formatNumber(collection.uniqueOwned) },
          { label: "Catalog size", value: formatNumber(collection.totalCatalog) },
          { label: "Completion", value: `${collection.completionPct}%` },
        ].map((stat) => (
          <div key={stat.label} className="pitch-panel rounded-2xl px-5 py-4">
            <div className="display text-4xl text-gold-soft">{stat.value}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-ink-muted">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="display text-3xl text-ink">Completion by product</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {collection.productCompletion.map((p) => (
            <div key={p.productId} className="pitch-panel rounded-xl px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-ink">{p.name}</div>
                <div className="text-sm text-pitch-400">{p.pct}%</div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
                <div
                  className="h-full rounded-full bg-pitch-500"
                  style={{ width: `${Math.min(100, p.pct)}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-ink-muted">
                {p.owned} / {p.total}
              </div>
            </div>
          ))}
        </div>
      </section>

      {collection.rarestPulls.length > 0 ? (
        <section className="mt-10">
          <h2 className="display text-3xl text-ink">Rarest pulls</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {collection.rarestPulls.map((item) => (
              <Link key={item.instanceId} href={`/cards/${item.card.slug}`} className="shrink-0">
                <CardFace
                  card={item.card}
                  serialDisplay={item.serialDisplay}
                  size="sm"
                  celebration={item.card.rarity === "LEGENDARY" ? "jackpot" : "hit"}
                />
                <div className="mt-1 text-center text-xs font-semibold text-gold-soft">
                  {formatMoney(item.card.estimatedValueCents)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="display text-3xl text-ink">Recent pulls</h2>
          <Link href="/products" className="text-sm text-pitch-400">
            Open more packs →
          </Link>
        </div>
        {collection.items.length === 0 ? (
          <p className="text-ink-muted">
            No cards yet. Open a product and rip a pack — results save to the database.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {collection.items.slice(0, 48).map((item) => (
              <Link key={item.instanceId} href={`/cards/${item.card.slug}`} className="mx-auto">
                <CardFace
                  card={item.card}
                  serialDisplay={item.serialDisplay}
                  size="sm"
                />
                <div className="mt-1 text-center text-[11px] font-medium text-gold-soft/90">
                  {formatMoney(item.card.estimatedValueCents)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
