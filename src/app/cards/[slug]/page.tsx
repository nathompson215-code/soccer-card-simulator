import Link from "next/link";
import { notFound } from "next/navigation";
import { CardFace } from "@/components/CardFace";
import { CollectionActions } from "@/components/CollectionActions";
import { cardTypeLabel, formatMoney, rarityLabel } from "@/lib/format";
import { getCardBySlug, getRelatedCards } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = await getCardBySlug(slug);
  if (!card) notFound();
  const related = await getRelatedCards(card);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <Link href="/cards" className="text-sm text-pitch-400">
        ← All cards
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <CardFace card={card} size="xl" interactiveFoil />
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">
            {card.manufacturerName} · {card.year}
          </div>
          <h1 className="display mt-2 text-5xl text-ink">{card.playerName}</h1>
          <p className="mt-2 text-ink-muted">
            {card.productName} · {card.subsetName} · {card.parallelName}
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ["Card #", card.cardNumber],
              ["Rarity", rarityLabel(card.rarity)],
              ["Type", cardTypeLabel(card.cardType)],
              ["Print run", card.printRun ? `/${card.printRun}` : "Unlimited"],
              ["Est. value", formatMoney(card.estimatedValueCents)],
              ["Club", card.clubName ?? "—"],
              ["National team", card.nationalTeamName ?? "—"],
              ["Tournament", card.tournamentName ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="pitch-panel rounded-xl px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.18em] text-ink-muted">{label}</dt>
                <dd className="mt-1 font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/products/${card.productSlug}`}
              className="rounded-full bg-pitch-500 px-5 py-3 text-sm font-semibold text-pitch-950"
            >
              Open this product
            </Link>
            <Link
              href={`/players/${card.playerSlug}`}
              className="rounded-full border border-white/15 px-5 py-3 text-sm text-ink"
            >
              View player
            </Link>
            <CollectionActions cardId={card.id} />
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="display text-3xl text-ink">Related cards</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {related.map((c) => (
              <Link key={c.id} href={`/cards/${c.slug}`}>
                <CardFace card={c} size="sm" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
