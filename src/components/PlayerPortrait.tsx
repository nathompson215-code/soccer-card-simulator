"use client";

import { useMemo } from "react";

/** Deterministic 32-bit hash for stable portrait palettes. */
function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hsl(h: number, s: number, l: number) {
  return `hsl(${Math.round(h) % 360} ${s}% ${l}%)`;
}

const POS_KIT: Record<string, [number, number]> = {
  GK: [48, 78],
  DEF: [212, 68],
  MID: [152, 58],
  FWD: [8, 70],
};

export function PlayerPortrait({
  playerName,
  playerSlug,
  position,
  accent,
  imageUrl,
  className = "",
}: {
  playerName: string;
  playerSlug: string;
  position: string;
  accent: string;
  clubName?: string | null;
  imageUrl?: string | null;
  className?: string;
}) {
  const uid = useMemo(() => {
    const raw = (playerSlug || playerName).replace(/[^a-zA-Z0-9_-]/g, "");
    return raw || `p${hash32(playerName).toString(36)}`;
  }, [playerSlug, playerName]);

  const palette = useMemo(() => {
    const h = hash32(playerSlug || playerName);
    const kit = POS_KIT[position] ?? [160, 55];
    const hue = (kit[0] + (h % 20) - 10 + 360) % 360;
    const skinL = 42 + (h % 28);
    const skin = hsl(28 + (h % 14), 38 + (h % 18), skinL);
    const hair = hsl(20 + (h % 30), 28, 8 + (h % 14));
    const jersey = accent || hsl(hue, kit[1], 40);
    const jerseyDark = hsl(hue, kit[1], 22);
    const stripe = hsl((hue + 28) % 360, 60, 68);
    const pitch = hsl(140, 35, 18);
    const crowd = hsl(hue, 20, 12);
    return { skin, hair, jersey, jerseyDark, stripe, pitch, crowd, hue, number: (h % 28) + 1 };
  }, [playerSlug, playerName, position, accent]);

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={playerName}
        className={`h-full w-full object-cover object-top ${className}`}
      />
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`} aria-hidden>
      <svg viewBox="0 0 240 300" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hsl(palette.hue, 35, 28)} />
            <stop offset="45%" stopColor={palette.crowd} />
            <stop offset="100%" stopColor={palette.pitch} />
          </linearGradient>
          <radialGradient id={`spot-${uid}`} cx="50%" cy="28%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <linearGradient id={`jersey-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.stripe} />
            <stop offset="22%" stopColor={palette.jersey} />
            <stop offset="100%" stopColor={palette.jerseyDark} />
          </linearGradient>
          <linearGradient id={`shade-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
          </linearGradient>
        </defs>

        <rect width="240" height="300" fill={`url(#sky-${uid})`} />
        {/* stadium lights / crowd suggestion */}
        <ellipse cx="40" cy="70" rx="36" ry="18" fill="rgba(255,255,255,0.04)" />
        <ellipse cx="200" cy="60" rx="42" ry="20" fill="rgba(255,255,255,0.05)" />
        <rect x="0" y="185" width="240" height="115" fill="rgba(0,0,0,0.18)" />
        <path d="M0 186 L240 186 L240 300 L0 300 Z" fill="rgba(20,80,45,0.22)" />
        <rect width="240" height="300" fill={`url(#spot-${uid})`} />

        {/* torso / jersey */}
        <path
          d="M28 300 C42 205 68 168 120 162 C172 168 198 205 212 300 Z"
          fill={`url(#jersey-${uid})`}
        />
        <path
          d="M78 188 C95 172 145 172 162 188 L170 230 C145 214 95 214 70 230 Z"
          fill="rgba(255,255,255,0.14)"
        />
        <path d="M70 230 L120 205 L170 230" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        <text
          x="120"
          y="268"
          textAnchor="middle"
          fill="rgba(255,255,255,0.78)"
          fontFamily="var(--font-bebas), Impact, sans-serif"
          fontSize="34"
          fontWeight="700"
        >
          {palette.number}
        </text>

        {/* neck + head */}
        <rect x="109" y="128" width="22" height="30" rx="7" fill={palette.skin} />
        <ellipse cx="120" cy="104" rx="33" ry="38" fill={palette.skin} />
        {/* short athletic hair */}
        <path
          d="M88 98 C92 68 104 58 120 56 C136 58 148 68 152 98 C144 84 132 78 120 78 C108 78 96 84 88 98 Z"
          fill={palette.hair}
        />
        <path
          d="M88 96 C94 90 100 88 106 87 L106 102 C98 102 92 100 88 96 Z"
          fill={palette.hair}
        />
        <path
          d="M152 96 C146 90 140 88 134 87 L134 102 C142 102 148 100 152 96 Z"
          fill={palette.hair}
        />
        <ellipse cx="109" cy="108" rx="3" ry="3.5" fill="#1a1512" opacity="0.8" />
        <ellipse cx="131" cy="108" rx="3" ry="3.5" fill="#1a1512" opacity="0.8" />
        <path
          d="M113 124 C117 128 123 128 127 124"
          fill="none"
          stroke="#6b4336"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.55"
        />
        <ellipse cx="120" cy="118" rx="5" ry="3" fill="rgba(0,0,0,0.08)" />

        <rect width="240" height="300" fill={`url(#shade-${uid})`} opacity="0.55" />
        <rect width="240" height="300" fill={`url(#spot-${uid})`} opacity="0.25" />
      </svg>
    </div>
  );
}
