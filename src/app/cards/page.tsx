import Link from "next/link";
import { CardFace } from "@/components/CardFace";
import { formatNumber } from "@/lib/format";
import { listCards, listManufacturers, listProducts } from "@/lib/queries";
import type { Rarity } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    manufacturer?: string;
    product?: string;
    rarity?: string;
  }>;
}) {
  const params = await searchParams;
  const [result, manufacturers, products] = await Promise.all([
    listCards({
      query: params.q,
      manufacturerSlug: params.manufacturer,
      productSlug: params.product,
      rarity: params.rarity as Rarity | undefined,
      limit: 60,
    }),
    listManufacturers(),
    listProducts(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">Archive</div>
        <h1 className="display mt-2 text-5xl text-ink">Cards</h1>
        <p className="mt-3 text-ink-muted">
          Searching {formatNumber(result.total)} database cards
          {params.q ? ` for “${params.q}”` : ""}.
        </p>
      </div>

      <form className="mb-8 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search player, set, product..."
          className="rounded-full border border-white/10 bg-pitch-900 px-4 py-3 text-sm text-ink outline-none focus:border-pitch-400"
        />
        <select
          name="manufacturer"
          defaultValue={params.manufacturer ?? ""}
          className="rounded-full border border-white/10 bg-pitch-900 px-4 py-3 text-sm text-ink"
        >
          <option value="">All manufacturers</option>
          {manufacturers.map((m) => (
            <option key={m.id} value={m.slug}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          name="product"
          defaultValue={params.product ?? ""}
          className="rounded-full border border-white/10 bg-pitch-900 px-4 py-3 text-sm text-ink"
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-pitch-500 px-5 py-3 text-sm font-semibold text-pitch-950"
        >
          Search
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {result.cards.map((card) => (
          <Link key={card.id} href={`/cards/${card.slug}`} className="mx-auto">
            <CardFace card={card} size="sm" />
          </Link>
        ))}
      </div>
    </div>
  );
}
