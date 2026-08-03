import Link from "next/link";
import { notFound } from "next/navigation";
import { CardFace } from "@/components/CardFace";
import { CardFlipViewer } from "@/components/CardFlipViewer";
import { CollectionActions } from "@/components/CollectionActions";
import { getCardCollectionDetail } from "@/lib/collection";
import { cardTypeLabel, formatMoney, formatNumber, rarityLabel } from "@/lib/format";
import { getRelatedCards } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getCardCollectionDetail(slug);
  if (!detail) notFound();
  const { card } = detail;
  const related = await getRelatedCards(card);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/cards" className="text-pitch-400">
          ← All cards
        </Link>
        <span className="text-ink-muted">/</span>
        <Link href="/collection" className="text-pitch-400">
          Collection
        </Link>
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <div>
          <CardFlipViewer card={card} serialDisplay={detail.latestSerialDisplay ?? card.serialDisplay} />
          {detail.isNew ? (
            <div className="mt-3 text-center">
              <span className="rounded-md bg-gold px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-pitch-950">
                New
              </span>
            </div>
          ) : null}
        </div>

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
              ["Est. market value", formatMoney(card.estimatedValueCents)],
              ["Product", card.productName],
              ["Card #", card.cardNumber],
              ["Serial number", detail.latestSerialDisplay ?? card.serialDisplay ?? "Not numbered"],
              ["Rarity", rarityLabel(card.rarity)],
              ["Type", cardTypeLabel(card.cardType)],
              ["Print run", card.printRun ? `/${card.printRun}` : "Unlimited"],
              ["Ownership count", formatNumber(detail.ownershipCount)],
              ["Club", card.clubName ?? "—"],
              ["National team", card.nationalTeamName ?? "—"],
              ["Position", card.playerPosition],
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
            <Link
              href={`/collection?product=${card.productSlug}`}
              className="rounded-full border border-white/15 px-5 py-3 text-sm text-ink"
            >
              Product binder
            </Link>
            <CollectionActions
              cardId={card.id}
              initialFavorited={detail.isFavorite}
              initialWishlisted={detail.isWishlisted}
            />
          </div>

          <section className="mt-10">
            <h2 className="display text-3xl text-ink">Pull history</h2>
            {detail.pullHistory.length === 0 ? (
              <p className="mt-3 text-ink-muted">
                You do not own this card yet. Open packs from{" "}
                <Link href={`/products/${card.productSlug}`} className="text-pitch-400">
                  {card.productName}
                </Link>{" "}
                to pull it.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {detail.pullHistory.map((pull, index) => (
                  <li
                    key={pull.instanceId}
                    className="pitch-panel flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
                  >
                    <div>
                      <span className="font-medium text-ink">Copy #{detail.pullHistory.length - index}</span>
                      <span className="ml-2 text-ink-muted">
                        {new Date(pull.pulledAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-gold-soft">
                      {pull.serialDisplay ?? card.serialDisplay ?? "—"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
