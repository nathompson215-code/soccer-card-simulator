"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { CollectionQuery } from "@/lib/collection";
import type {
  CollectionFilterOptions,
  CollectionSort,
} from "@/lib/types";

const SORT_OPTIONS: Array<{ value: CollectionSort; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "value_high", label: "Highest value" },
  { value: "value_low", label: "Lowest value" },
  { value: "rarity", label: "Rarity" },
  { value: "player", label: "Player name" },
  { value: "club", label: "Club" },
  { value: "card_number", label: "Card number" },
];

function buildSearchParams(values: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  return params;
}

export function CollectionFilters({
  options,
  query,
  showingChecklist,
}: {
  options: CollectionFilterOptions;
  query: CollectionQuery;
  showingChecklist: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(query.q ?? "");
  const [valueMin, setValueMin] = useState(query.valueMin ?? "");
  const [valueMax, setValueMax] = useState(query.valueMax ?? "");

  useEffect(() => {
    setQ(query.q ?? "");
    setValueMin(query.valueMin ?? "");
    setValueMax(query.valueMax ?? "");
  }, [query.q, query.valueMin, query.valueMax]);

  const apply = useCallback(
    (patch: Record<string, string>) => {
      const next = {
        q: query.q ?? "",
        player: query.player ?? "",
        club: query.club ?? "",
        nation: query.nation ?? "",
        product: query.product ?? "",
        year: query.year ?? "",
        rarity: query.rarity ?? "",
        insertSet: query.insertSet ?? "",
        autograph: query.autograph ?? "",
        memorabilia: query.memorabilia ?? "",
        booklet: query.booklet ?? "",
        numbered: query.numbered ?? "",
        valueMin: query.valueMin ?? "",
        valueMax: query.valueMax ?? "",
        favorites: query.favorites ?? "",
        owned: query.owned ?? "",
        sort: query.sort ?? "newest",
        ...patch,
      };
      const params = buildSearchParams(next);
      startTransition(() => {
        router.push(params.toString() ? `/collection?${params}` : "/collection");
      });
    },
    [query, router],
  );

  const insertSets = useMemo(() => {
    if (!query.product) return options.insertSets;
    return options.insertSets.filter((s) => s.productSlug === query.product);
  }, [options.insertSets, query.product]);

  return (
    <form
      className="binder-filters pitch-panel rounded-2xl p-4 md:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        apply({ q, valueMin, valueMax });
      }}
    >
      <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))_auto]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search player, club, nation, product..."
          className="rounded-xl border border-white/10 bg-pitch-900/80 px-4 py-3 text-sm text-ink outline-none focus:border-pitch-400"
        />
        <select
          value={query.product ?? ""}
          onChange={(e) =>
            apply({
              product: e.target.value,
              insertSet: "",
              owned: e.target.value ? query.owned ?? "" : "",
            })
          }
          className="rounded-xl border border-white/10 bg-pitch-900/80 px-3 py-3 text-sm text-ink"
        >
          <option value="">All products (owned)</option>
          {options.products.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={query.insertSet ?? ""}
          onChange={(e) => apply({ insertSet: e.target.value })}
          className="rounded-xl border border-white/10 bg-pitch-900/80 px-3 py-3 text-sm text-ink"
        >
          <option value="">All insert sets</option>
          {insertSets.map((s) => (
            <option key={`${s.productSlug}:${s.slug}`} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={query.sort ?? "newest"}
          onChange={(e) => apply({ sort: e.target.value })}
          className="rounded-xl border border-white/10 bg-pitch-900/80 px-3 py-3 text-sm text-ink"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-pitch-500 px-5 py-3 text-sm font-semibold text-pitch-950 disabled:opacity-60"
        >
          {pending ? "Updating…" : "Apply"}
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={query.player ?? ""}
          onChange={(e) => apply({ player: e.target.value })}
          className="rounded-xl border border-white/10 bg-pitch-900/80 px-3 py-2.5 text-sm text-ink"
        >
          <option value="">Player</option>
          {options.players.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={query.club ?? ""}
          onChange={(e) => apply({ club: e.target.value })}
          className="rounded-xl border border-white/10 bg-pitch-900/80 px-3 py-2.5 text-sm text-ink"
        >
          <option value="">Club</option>
          {options.clubs.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={query.nation ?? ""}
          onChange={(e) => apply({ nation: e.target.value })}
          className="rounded-xl border border-white/10 bg-pitch-900/80 px-3 py-2.5 text-sm text-ink"
        >
          <option value="">Nation</option>
          {options.nations.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={query.year ?? ""}
          onChange={(e) => apply({ year: e.target.value })}
          className="rounded-xl border border-white/10 bg-pitch-900/80 px-3 py-2.5 text-sm text-ink"
        >
          <option value="">Year</option>
          {options.years.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
        <select
          value={query.rarity ?? ""}
          onChange={(e) => apply({ rarity: e.target.value })}
          className="rounded-xl border border-white/10 bg-pitch-900/80 px-3 py-2.5 text-sm text-ink"
        >
          <option value="">Rarity</option>
          {options.rarities.map((rarity) => (
            <option key={rarity} value={rarity}>
              {rarity.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            value={valueMin}
            onChange={(e) => setValueMin(e.target.value)}
            inputMode="decimal"
            placeholder="Min $"
            className="w-full rounded-xl border border-white/10 bg-pitch-900/80 px-3 py-2.5 text-sm text-ink outline-none focus:border-pitch-400"
          />
          <input
            value={valueMax}
            onChange={(e) => setValueMax(e.target.value)}
            inputMode="decimal"
            placeholder="Max $"
            className="w-full rounded-xl border border-white/10 bg-pitch-900/80 px-3 py-2.5 text-sm text-ink outline-none focus:border-pitch-400"
          />
        </div>
        <select
          value={query.owned ?? ""}
          onChange={(e) => apply({ owned: e.target.value })}
          disabled={!showingChecklist}
          className="rounded-xl border border-white/10 bg-pitch-900/80 px-3 py-2.5 text-sm text-ink disabled:opacity-40"
        >
          <option value="">Owned + missing</option>
          <option value="1">Owned only</option>
          <option value="0">Missing only</option>
        </select>
        <select
          value={query.favorites ?? ""}
          onChange={(e) => apply({ favorites: e.target.value })}
          className="rounded-xl border border-white/10 bg-pitch-900/80 px-3 py-2.5 text-sm text-ink"
        >
          <option value="">All cards</option>
          <option value="1">Favorites only</option>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["autograph", "Autograph"],
            ["memorabilia", "Memorabilia"],
            ["booklet", "Booklet"],
            ["numbered", "Numbered"],
          ] as const
        ).map(([key, label]) => {
          const active = query[key] === "1";
          return (
            <button
              key={key}
              type="button"
              onClick={() => apply({ [key]: active ? "" : "1" })}
              className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition ${
                active
                  ? "border-gold/40 bg-gold/15 text-gold-soft"
                  : "border-white/12 text-ink-muted hover:border-white/25 hover:text-ink"
              }`}
            >
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setQ("");
            setValueMin("");
            setValueMax("");
            startTransition(() => router.push("/collection"));
          }}
          className="ml-auto rounded-full border border-white/12 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-ink-muted hover:text-ink"
        >
          Clear filters
        </button>
      </div>
    </form>
  );
}
