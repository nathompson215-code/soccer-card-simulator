"use client";

import { useMemo, useState } from "react";
import {
  signatureAssetCandidates,
  signatureInkColor,
  signatureRotationDeg,
} from "@/lib/signature-assets";

/**
 * On-card autograph overlay.
 * Uses a real transparent signature scan when present; otherwise clearly
 * marks the card as awaiting a licensed signature asset — never fake ink.
 */
export function SignatureOverlay({
  playerName,
  playerSlug,
  className = "",
  compact = false,
  variant = "on-card",
}: {
  playerName: string;
  playerSlug: string;
  className?: string;
  compact?: boolean;
  /** on-card = over photo; panel = cut-signature / booklet plate */
  variant?: "on-card" | "panel" | "cut";
}) {
  const candidates = useMemo(() => signatureAssetCandidates(playerSlug), [playerSlug]);
  const [srcIndex, setSrcIndex] = useState(0);
  const failed = srcIndex >= candidates.length;
  const activeSrc = !failed ? candidates[srcIndex] : null;
  const ink = signatureInkColor(playerSlug);
  const rotation = signatureRotationDeg(playerSlug);

  if (activeSrc) {
    return (
      <div
        className={`d11-signature-overlay d11-signature-${variant} pointer-events-none ${className}`}
        style={{ ["--sig-rotate" as string]: `${rotation}deg` }}
        aria-hidden
      >
        <div className={`d11-signature-ink d11-signature-ink-${ink}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeSrc}
            src={activeSrc}
            alt=""
            decoding="async"
            loading="lazy"
            draggable={false}
            onError={() => setSrcIndex((i) => i + 1)}
          />
        </div>
        <div className="d11-signature-pen-grain" />
      </div>
    );
  }

  return (
    <div
      className={`d11-signature-awaiting d11-signature-${variant} ${compact ? "is-compact" : ""} ${className}`}
      role="status"
      aria-label={`${playerName} — awaiting licensed signature asset`}
    >
      <div className="d11-signature-awaiting-inner">
        <div className="d11-signature-awaiting-title">Signature asset</div>
        <div className="d11-signature-awaiting-body">
          Awaiting licensed signature
        </div>
      </div>
    </div>
  );
}
