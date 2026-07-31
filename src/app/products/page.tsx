import Link from "next/link";
import { ProductTile } from "@/components/ProductTile";
import { listManufacturers, listProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ manufacturer?: string }>;
}) {
  const params = await searchParams;
  const [products, manufacturers] = await Promise.all([
    listProducts({ manufacturerSlug: params.manufacturer }),
    listManufacturers(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">Catalog</div>
        <h1 className="display mt-2 text-5xl text-ink">Products</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Every product is loaded from PostgreSQL. Filter by manufacturer, then open packs with
          database-driven odds.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/products"
          className={`rounded-full px-4 py-2 text-sm ${
            !params.manufacturer ? "bg-white/10 text-ink" : "text-ink-muted hover:bg-white/5"
          }`}
        >
          All
        </Link>
        {manufacturers.map((m) => (
          <Link
            key={m.id}
            href={`/products?manufacturer=${m.slug}`}
            className={`rounded-full px-4 py-2 text-sm ${
              params.manufacturer === m.slug
                ? "bg-white/10 text-ink"
                : "text-ink-muted hover:bg-white/5"
            }`}
          >
            {m.name}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductTile key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-10 text-ink-muted">No products found. Run `npm run db:seed`.</p>
      ) : null}
    </div>
  );
}
