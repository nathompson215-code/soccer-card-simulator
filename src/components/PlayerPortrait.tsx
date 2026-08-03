"use client";

import { useMemo, useState } from "react";
import { playerPhotoCandidates } from "@/lib/player-assets";

/**
 * Card portrait: real player photograph only.
 * Tries authorized / local photo URLs, then a generic non-illustrated plate.
 * Never generates faces, silhouettes, or cartoon artwork.
 */
export function PlayerPortrait({
  playerName,
  playerSlug,
  accent,
  imageUrl,
  className = "",
}: {
  playerName: string;
  playerSlug: string;
  position: string;
  accent: string;
  clubName?: string | null;
  /** Preferred src (card front art or `/players/{slug}.webp`). */
  imageUrl?: string | null;
  className?: string;
}) {
  const candidates = useMemo(() => {
    const list: string[] = [];
    if (imageUrl?.trim()) list.push(imageUrl.trim());
    for (const url of playerPhotoCandidates(playerSlug)) {
      if (!list.includes(url)) list.push(url);
    }
    return list;
  }, [imageUrl, playerSlug]);

  const [srcIndex, setSrcIndex] = useState(0);
  const failed = srcIndex >= candidates.length;
  const activeSrc = !failed ? candidates[srcIndex] : null;

  if (activeSrc) {
    return (
      <div className={`d11-portrait-photo h-full w-full ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={activeSrc}
          src={activeSrc}
          alt={playerName}
          decoding="async"
          loading="lazy"
          onError={() => setSrcIndex((i) => i + 1)}
        />
      </div>
    );
  }

  return (
    <div
      className={`d11-portrait-missing relative h-full w-full ${className}`}
      style={{ ["--card-accent" as string]: accent }}
      role="img"
      aria-label={`${playerName} — photo unavailable`}
    >
      <div className="d11-portrait-missing-plate absolute inset-0" />
      <div className="d11-portrait-missing-label absolute inset-x-0 bottom-[18%] text-center">
        <div className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/45">
          Photo unavailable
        </div>
      </div>
    </div>
  );
}
