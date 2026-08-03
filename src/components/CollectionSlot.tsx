"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CardFace } from "@/components/CardFace";
import { CardSilhouette } from "@/components/CardSilhouette";
import { FavoriteStar } from "@/components/FavoriteStar";
import { formatMoney } from "@/lib/format";
import type { CollectionEntryDTO } from "@/lib/types";

export function CollectionSlot({
  entry,
  index = 0,
}: {
  entry: CollectionEntryDTO;
  index?: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.02, 0.35), ease: "easeOut" }}
      className="binder-slot group relative mx-auto w-[148px]"
    >
      {entry.isOwned ? (
        <Link href={`/cards/${entry.card.slug}`} className="relative block">
          <CardFace
            card={entry.card}
            serialDisplay={entry.serialDisplays[0] ?? entry.card.serialDisplay}
            size="sm"
          />
          {entry.isNew ? (
            <span className="absolute -right-1 -top-1 z-20 rounded-md bg-gold px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-pitch-950 shadow">
              New
            </span>
          ) : null}
          {entry.copyCount > 1 ? (
            <span className="absolute -bottom-1 -left-1 z-20 rounded-full border border-white/15 bg-pitch-900/95 px-2 py-0.5 text-[10px] font-semibold text-ink">
              ×{entry.copyCount}
            </span>
          ) : null}
        </Link>
      ) : (
        <Link href={`/cards/${entry.card.slug}`} className="block opacity-90 transition hover:opacity-100">
          <CardSilhouette card={entry.card} />
        </Link>
      )}

      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-ink">{entry.card.playerName}</div>
          <div className="truncate text-[10px] text-ink-muted">
            {entry.isOwned
              ? formatMoney(entry.card.estimatedValueCents)
              : entry.card.subsetName}
          </div>
        </div>
        {entry.isOwned ? (
          <FavoriteStar
            cardId={entry.cardId}
            initialFavorited={entry.isFavorite}
            size="sm"
            className="shrink-0"
          />
        ) : null}
      </div>
    </motion.div>
  );
}
