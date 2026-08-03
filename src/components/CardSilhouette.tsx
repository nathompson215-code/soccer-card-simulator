"use client";

import type { CardDTO } from "@/lib/types";

/** Premium missing-card silhouette for binder checklist gaps. */
export function CardSilhouette({
  card,
  size = "sm",
}: {
  card: CardDTO;
  size?: "sm" | "md";
}) {
  const dims =
    size === "md" ? "w-[210px] h-[294px]" : "w-[148px] h-[207px]";

  return (
    <div
      className={`binder-silhouette relative ${dims} shrink-0 overflow-hidden rounded-[16px]`}
      aria-label={`Missing: ${card.playerName} #${card.cardNumber}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(16,38,28,0.95),rgba(7,17,13,0.98))]" />
      <div className="absolute inset-[3px] rounded-[13px] border border-dashed border-white/12" />
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-x-[14%] top-[12%] h-[52%] rounded-xl bg-white/5" />
        <div className="absolute inset-x-[18%] bottom-[14%] h-8 rounded-md bg-white/5" />
        <div className="absolute inset-x-[22%] bottom-[22%] h-3 rounded bg-white/5" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-end px-3 pb-3 text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted/80">Missing</div>
        <div className="mt-1 line-clamp-2 text-[11px] font-medium text-ink-muted">
          {card.playerName}
        </div>
        <div className="mt-0.5 text-[10px] text-ink-muted/70">#{card.cardNumber}</div>
      </div>
      <div className="pointer-events-none absolute inset-0 binder-silhouette-sheen" />
    </div>
  );
}
