import Link from "next/link";
import { CollectionFilters } from "@/components/CollectionFilters";
import { CollectionSlot } from "@/components/CollectionSlot";
import { CollectionStatsPanel } from "@/components/CollectionStatsPanel";
import { getCollection, type CollectionQuery } from "@/lib/collection";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<CollectionQuery>;
}) {
  const query = await searchParams;
  const collection = await getCollection(query);
  const ownedInView = collection.entries.filter((e) => e.isOwned).length;
  const missingInView = collection.entries.filter((e) => !e.isOwned).length;

  return (
    <div className="binder-page mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">Digital binder</div>
        <h1 className="display mt-2 text-5xl text-ink md:text-6xl">My Collection</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          {collection.user.displayName}&apos;s premium binder — every pull is saved, duplicates are
          tracked, and missing checklist cards appear as silhouettes.
        </p>
      </div>

      <CollectionStatsPanel
        stats={collection.stats}
        overall={collection.overallCompletion}
        products={collection.productCompletion}
        insertSets={collection.insertSetCompletion}
      />

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="display text-3xl text-ink">Binder pages</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {collection.showingChecklist
                ? `Checklist view · ${formatNumber(ownedInView)} owned · ${formatNumber(missingInView)} missing`
                : `Owned uniques · ${formatNumber(collection.entries.length)} shown`}
            </p>
          </div>
          <Link href="/products" className="text-sm text-pitch-400">
            Rip packs →
          </Link>
        </div>

        <CollectionFilters
          options={collection.filterOptions}
          query={collection.query}
          showingChecklist={collection.showingChecklist}
        />

        {collection.entries.length === 0 ? (
          <div className="pitch-panel mt-6 rounded-2xl px-6 py-12 text-center">
            <p className="text-ink-muted">
              {collection.totalOwned === 0
                ? "No cards yet. Open a product and rip a pack — results save automatically."
                : "No cards match these filters."}
            </p>
            <Link
              href="/products"
              className="mt-4 inline-flex rounded-full bg-pitch-500 px-5 py-3 text-sm font-semibold text-pitch-950"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="binder-grid mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {collection.entries.map((entry, index) => (
              <CollectionSlot key={entry.cardId} entry={entry} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
