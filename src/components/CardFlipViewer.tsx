"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CardFace } from "@/components/CardFace";
import type { CardDTO } from "@/lib/types";

export function CardFlipViewer({
  card,
  serialDisplay,
}: {
  card: CardDTO;
  serialDisplay?: string | null;
}) {
  const [showBack, setShowBack] = useState(false);

  return (
    <div className="w-full max-w-[360px]">
      <div className="relative mx-auto" style={{ perspective: 1200 }}>
        <motion.div
          animate={{ rotateY: showBack ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative"
        >
          <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
            <CardFace
              card={card}
              serialDisplay={serialDisplay}
              size="lg"
              interactiveFoil
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <CardBackPreview card={card} serialDisplay={serialDisplay} />
          </div>
        </motion.div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setShowBack(false)}
          className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.16em] ${
            !showBack
              ? "bg-pitch-500 text-pitch-950"
              : "border border-white/15 text-ink-muted"
          }`}
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => setShowBack(true)}
          className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.16em] ${
            showBack
              ? "bg-pitch-500 text-pitch-950"
              : "border border-white/15 text-ink-muted"
          }`}
        >
          Back
        </button>
      </div>
    </div>
  );
}

function CardBackPreview({
  card,
  serialDisplay,
}: {
  card: CardDTO;
  serialDisplay?: string | null;
}) {
  return (
    <div className="relative h-full w-full min-h-[280px]">
      <div className="card-back relative h-full w-full overflow-hidden rounded-[16px] border border-white/20 shadow-2xl">
        {card.backImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.backImageUrl}
            alt={`${card.playerName} card back`}
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <div className="absolute inset-0 pack-hologram opacity-70" />
            <div className="absolute inset-5 overflow-auto rounded-xl border border-white/15 bg-black/25 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                {card.manufacturerName}
              </div>
              <div className="display mt-3 text-3xl text-white">{card.playerName}</div>
              <dl className="mt-5 space-y-2 text-sm text-white/80">
                <div className="flex justify-between gap-3">
                  <dt>Product</dt>
                  <dd className="text-right">{card.productName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Card #</dt>
                  <dd>{card.cardNumber}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Set</dt>
                  <dd className="text-right">{card.subsetName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Parallel</dt>
                  <dd className="text-right">{card.parallelName}</dd>
                </div>
                {serialDisplay ? (
                  <div className="flex justify-between gap-3">
                    <dt>Serial</dt>
                    <dd className="text-gold-soft">{serialDisplay}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt>Club</dt>
                  <dd className="text-right">{card.clubName ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Nation</dt>
                  <dd className="text-right">{card.nationalTeamName ?? "—"}</dd>
                </div>
              </dl>
            </div>
            <div className="display absolute bottom-4 left-0 right-0 text-center text-xl text-white/70">
              D11
            </div>
          </>
        )}
      </div>
    </div>
  );
}
