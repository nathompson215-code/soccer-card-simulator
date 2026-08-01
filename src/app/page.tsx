import Link from "next/link";
import { ProductTile } from "@/components/ProductTile";
import { formatNumber } from "@/lib/format";
import { getCatalogSummary, listManufacturers, listProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [summary, featured, manufacturers] = await Promise.all([
    getCatalogSummary(),
    listProducts({ featured: true }),
    listManufacturers(),
  ]);

  return (
    <div>
      <section className="relative min-h-[88vh] overflow-hidden stadium-lights">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: `
              linear-gradient(180deg, rgba(7,17,13,0.2) 0%, rgba(7,17,13,0.55) 55%, rgba(7,17,13,0.95) 100%),
              radial-gradient(ellipse 80% 50% at 50% 110%, rgba(27,122,78,0.45), transparent 60%),
              url("data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 80h160M80 0v160' stroke='%23ffffff' stroke-opacity='0.04' stroke-width='2'/%3E%3Ccircle cx='80' cy='80' r='28' fill='none' stroke='%23ffffff' stroke-opacity='0.05' stroke-width='2'/%3E%3C/svg%3E")
            `,
          }}
        />

        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-end px-4 pb-16 pt-24 md:px-6 md:pb-24">
          <div className="max-w-3xl">
            <div className="display text-[clamp(4.5rem,14vw,9rem)] text-ink drop-shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
              DRAFT
              <span className="block text-pitch-400">ELEVEN</span>
            </div>
            <p className="mt-5 max-w-xl text-lg text-ink-muted md:text-xl">
              Open soccer trading card products from a PostgreSQL-backed archive — realistic pack
              openings, World Cup collections, and a collection that scales with the database.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-full bg-pitch-500 px-6 py-3 text-sm font-semibold text-pitch-950 transition hover:bg-pitch-400"
              >
                Browse Products
              </Link>
              <Link
                href="/products/topps-chrome-ucl-2024-25"
                className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/10"
              >
                Rip a Hobby Box
              </Link>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 md:grid-cols-4">
            {[
              { label: "Unique Cards", value: formatNumber(summary.totalCards) },
              { label: "Products", value: formatNumber(summary.totalProducts) },
              { label: "Players", value: formatNumber(summary.totalPlayers) },
              { label: "Manufacturers", value: formatNumber(summary.totalManufacturers) },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="display text-4xl text-gold-soft md:text-5xl">{stat.value}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-ink-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">Featured Drops</div>
            <h2 className="display mt-2 text-4xl text-ink md:text-5xl">Open these first</h2>
          </div>
          <Link href="/products" className="text-sm text-pitch-400 hover:text-pitch-500">
            All products →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((product) => (
            <ProductTile key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-pitch-900/40">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">Database-backed</div>
            <h2 className="display mt-2 text-4xl text-ink md:text-5xl">
              Built to scale past one million cards
            </h2>
            <p className="mt-4 text-ink-muted">
              Manufacturers, brands, products, sets, checklists, players, clubs, national teams,
              tournaments, cards, parallels, autographs, memorabilia, numbering, pack odds, and
              collections all live in PostgreSQL via Prisma — no hard-coded catalog arrays.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {manufacturers.map((m) => (
              <Link
                key={m.id}
                href={`/products?manufacturer=${m.slug}`}
                className="pitch-panel rounded-xl px-4 py-5 transition hover:border-white/25"
              >
                <div
                  className="mb-3 h-2 w-10 rounded-full"
                  style={{ background: m.colorHex ?? "#1b7a4e" }}
                />
                <div className="font-semibold text-ink">{m.name}</div>
                <div className="mt-1 text-xs text-ink-muted">
                  {m.productCount} products
                  {m.foundedYear ? ` · Est. ${m.foundedYear}` : ""}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
