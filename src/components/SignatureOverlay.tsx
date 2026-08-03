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
            viewBox="0 0 280 72"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`${playerName} signature placeholder`}
          >
            <defs>
              <linearGradient id={`ink-${inkId}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1a4fd6" />
                <stop offset="40%" stopColor="#0b3db8" />
                <stop offset="70%" stopColor="#2456d4" />
                <stop offset="100%" stopColor="#163a9c" />
              </linearGradient>
              <filter id={`pen-${inkId}`} x="-12%" y="-35%" width="124%" height="170%">
                <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="0.7" />
              </filter>
            </defs>
            <path
              d="M22 50 C 62 58, 108 42, 148 48 S 228 58, 258 44"
              fill="none"
              stroke={`url(#ink-${inkId})`}
              strokeWidth="1.05"
              strokeLinecap="round"
              opacity="0.42"
              filter={`url(#pen-${inkId})`}
            />
            <path
              d="M28 54 C 74 62, 128 46, 172 52 S 236 60, 252 49"
              fill="none"
              stroke="#0a2f8f"
              strokeWidth="0.65"
              strokeLinecap="round"
              opacity="0.28"
            />
            <text
              x="140"
              y="40"
              textAnchor="middle"
              className="d11-auto-ink-text d11-auto-ink-text-shadow"
              filter={`url(#pen-${inkId})`}
            >
              {displayName}
            </text>
            <text x="140" y="40" textAnchor="middle" className="d11-auto-ink-text">
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
