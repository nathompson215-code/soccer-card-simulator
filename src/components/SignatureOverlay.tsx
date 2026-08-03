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

  // Autograph cards: show blue-ink cursive while probing and when missing.
  if (inkPlaceholder && variant === "on-card") {
    const inkId = sanitizePlayerSlug(playerSlug);
    return (
      <div
        className={`d11-signature-overlay d11-signature-on-card d11-signature-ink-placeholder pointer-events-none ${compact ? "is-compact" : ""} ${className}`}
        style={{ ["--sig-rotate" as string]: `${rotation}deg` }}
        aria-hidden
      >
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
              <stop offset="45%" stopColor="#0b3db8" />
              <stop offset="100%" stopColor="#163a9c" />
            </linearGradient>
            <filter id={`pen-${inkId}`} x="-10%" y="-30%" width="120%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="0.55" />
            </filter>
          </defs>
          <path
            d="M18 48 C 58 58, 110 40, 150 46 S 230 58, 262 42"
            fill="none"
            stroke={`url(#ink-${inkId})`}
            strokeWidth="1.15"
            strokeLinecap="round"
            opacity="0.55"
            filter={`url(#pen-${inkId})`}
          />
          <path
            d="M24 52 C 70 62, 130 44, 175 50 S 240 60, 255 47"
            fill="none"
            stroke="#0a2f8f"
            strokeWidth="0.7"
            strokeLinecap="round"
            opacity="0.35"
          />
          <text
            x="140"
            y="38"
            textAnchor="middle"
            className="d11-auto-ink-text d11-auto-ink-text-shadow"
            filter={`url(#pen-${inkId})`}
          >
            {displayName}
          </text>
          <text x="140" y="38" textAnchor="middle" className="d11-auto-ink-text">
            {displayName}
          </text>
        </svg>
        <div className="d11-signature-pen-grain" />
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
