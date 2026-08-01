import Link from "next/link";
import { notFound } from "next/navigation";
import { PackOpener } from "@/components/PackOpener";
import { CardFace } from "@/components/CardFace";
import { formatLabel, formatNumber } from "@/lib/format";
import { getProductBySlug, listCards } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const { cards } = await listCards({ productSlug: slug, limit: 24 });

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-6">
      <div>
        <Link href="/products" className="text-sm text-pitch-400 hover:text-pitch-500">
          ← All products
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">
              {product.manufacturer.name}
              {product.brand ? ` · ${product.brand.name}` : ""} · {product.year}
            </div>
            <h1 className="display mt-2 text-5xl text-ink md:text-6xl">{product.name}</h1>
            <p className="mt-3 max-w-2xl text-ink-muted">{product.description}</p>
          </div>
          <div className="pitch-panel rounded-2xl px-5 py-4 text-sm text-ink-muted">
            <div>{formatLabel(product.format)}</div>
            <div className="mt-1 text-ink">
              {product.packsPerBox} packs · {product.cardsPerPack}/pack
            </div>
            <div className="mt-1">{formatNumber(product.cardCount)} unique cards</div>
            {product.tournament ? <div className="mt-1">{product.tournament.name}</div> : null}
            {product.league ? <div className="mt-1">{product.league.name}</div> : null}
          </div>
        </div>

        {product.oddsLabels.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {product.oddsLabels.map((label) => (
              <li
                key={label}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-ink-muted"
              >
                {label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <PackOpener product={product} />

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="display text-3xl text-ink">Checklist sample</h2>
          <Link href={`/cards?product=${product.slug}`} className="text-sm text-pitch-400">
            Browse all cards →
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {cards.map((card) => (
            <Link key={card.id} href={`/cards/${card.slug}`}>
              <CardFace card={card} size="sm" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
