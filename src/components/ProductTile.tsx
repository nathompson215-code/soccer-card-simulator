import Link from "next/link";
import { formatLabel, formatNumber } from "@/lib/format";
import type { ProductDTO } from "@/lib/types";

export function ProductTile({ product }: { product: ProductDTO }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group pitch-panel relative overflow-hidden rounded-2xl p-5 transition hover:-translate-y-1 hover:border-pitch-400/40"
    >
      <div
        className="absolute inset-0 opacity-40 transition group-hover:opacity-60"
        style={{
          background: `radial-gradient(500px 180px at 100% 0%, ${product.accentHex ?? "#1b7a4e"}88, transparent 60%)`,
        }}
      />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            {product.manufacturer.name} · {product.year}
          </span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
            {formatLabel(product.format)}
          </span>
        </div>
        <h3 className="display text-2xl text-ink md:text-[1.75rem]">{product.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{product.description}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-muted">
          <span>{product.packsPerBox} packs</span>
          <span>·</span>
          <span>{product.cardsPerPack}/pack</span>
          <span>·</span>
          <span>{formatNumber(product.cardCount)} cards</span>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-pitch-400 transition group-hover:gap-3">
          View & Open
          <span aria-hidden>→</span>
        </div>
      </div>
    </Link>
  );
}
