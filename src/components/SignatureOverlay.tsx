"use client";

import { useEffect, useMemo, useState } from "react";
import { Imperial_Script } from "next/font/google";
import {
  signatureAssetCandidates,
  signatureInkColor,
  signatureRotationDeg,
} from "@/lib/signature-assets";
import { sanitizePlayerSlug } from "@/lib/player-assets";

/** Formal calligraphy for temporary autograph placeholders only. */
const autographHand = Imperial_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/**
 * On-card autograph overlay.
 * Prefers a real transparent signature scan. For autograph cards only,
 * falls back to a blue-ink cursive nameplate placeholder until licensed
 * assets are available. Booklet / cut variants keep the awaiting state.
 */
export function SignatureOverlay({
  playerName,
  playerSlug,
  className = "",
  compact = false,
  variant = "on-card",
  inkPlaceholder = false,
}: {
  playerName: string;
  playerSlug: string;
  className?: string;
  compact?: boolean;
  /** on-card = over photo; panel = cut-signature / booklet plate */
  variant?: "on-card" | "panel" | "cut";
  /** Autograph-only: blue cursive name placeholder when no asset exists. */
  inkPlaceholder?: boolean;
}) {
  const candidates = useMemo(() => signatureAssetCandidates(playerSlug), [playerSlug]);
  const [assetSrc, setAssetSrc] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const ink = signatureInkColor(playerSlug);
  const rotation = signatureRotationDeg(playerSlug);

  useEffect(() => {
    let cancelled = false;
    let index = 0;

    const tryNext = () => {
      if (cancelled) return;
      if (index >= candidates.length) {
        setAssetSrc(null);
        setResolved(true);
        return;
      }
      const src = candidates[index];
      const probe = new window.Image();
      probe.onload = () => {
        if (cancelled) return;
        setAssetSrc(src);
        setResolved(true);
      };
      probe.onerror = () => {
        index += 1;
        tryNext();
      };
      probe.src = src;
    };

    setAssetSrc(null);
    setResolved(false);
    tryNext();

    return () => {
      cancelled = true;
    };
  }, [candidates]);

  const displayName = useMemo(() => {
    const parts = playerName.trim().split(/\s+/);
    if (parts.length <= 1) return playerName.trim();
    // Prefer surname-forward autograph look: "L. Messi" / full last when short
    const last = parts[parts.length - 1] ?? playerName;
    const first = parts[0]?.[0] ? `${parts[0][0]}.` : "";
    return first ? `${first} ${last}` : last;
  }, [playerName]);

  if (assetSrc) {
    return (
      <div
        className={`d11-signature-overlay d11-signature-${variant} pointer-events-none ${className}`}
        style={{ ["--sig-rotate" as string]: `${rotation}deg` }}
        aria-hidden
      >
        <div className={`d11-signature-ink d11-signature-ink-${ink}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetSrc}
            alt=""
            decoding="async"
            draggable={false}
          />
        </div>
        <div className="d11-signature-pen-grain" />
      </div>
    );
  }

  // Autograph cards: white signing strip + blue-ink cursive placeholder.
  if (inkPlaceholder && variant === "on-card") {
    const inkId = sanitizePlayerSlug(playerSlug);
    return (
      <div
        className={`d11-signature-overlay d11-signature-on-card d11-signature-ink-placeholder pointer-events-none ${compact ? "is-compact" : ""} ${className}`}
        style={{ ["--sig-rotate" as string]: `${rotation}deg` }}
        aria-hidden
      >
        <div className="d11-auto-sign-strip">
          <div className="d11-auto-sign-strip-paper" />
          <div className="d11-auto-sign-strip-gloss" />
          <svg
            className={`d11-auto-ink-svg ${autographHand.className}`}
            viewBox="0 0 280 64"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`${playerName} signature placeholder`}
          >
            <defs>
              <linearGradient id={`ink-${inkId}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0a2f9c" />
                <stop offset="35%" stopColor="#1246c9" />
                <stop offset="62%" stopColor="#0b3db8" />
                <stop offset="100%" stopColor="#163a9c" />
              </linearGradient>
            </defs>
            <path
              d="M24 48 C 68 56, 112 40, 152 46 S 226 56, 256 42"
              fill="none"
              stroke={`url(#ink-${inkId})`}
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.38"
            />
            <path
              d="M30 52 C 78 60, 130 44, 174 50 S 234 58, 250 47"
              fill="none"
              stroke="#0a2f8f"
              strokeWidth="0.7"
              strokeLinecap="round"
              opacity="0.22"
            />
            <text
              x="140.6"
              y="36.8"
              textAnchor="middle"
              className="d11-auto-ink-text d11-auto-ink-text-shadow"
            >
              {displayName}
            </text>
            <text
              x="140"
              y="36"
              textAnchor="middle"
              fill={`url(#ink-${inkId})`}
              className="d11-auto-ink-text"
            >
              {displayName}
            </text>
          </svg>
        </div>
      </div>
    );
  }

  if (!resolved) {
    return (
      <div
        className={`d11-signature-overlay d11-signature-${variant} pointer-events-none ${className}`}
        style={{ ["--sig-rotate" as string]: `${rotation}deg` }}
        aria-hidden
      />
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
