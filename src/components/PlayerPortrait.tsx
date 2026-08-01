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

function hsl(h: number, s: number, l: number, a = 1) {
  if (a < 1) return `hsla(${Math.round(h) % 360} ${s}% ${l}% / ${a})`;
  return `hsl(${Math.round(h) % 360} ${s}% ${l}%)`;
}

const POS_KIT: Record<string, [number, number]> = {
  GK: [46, 68],
  DEF: [214, 56],
  MID: [150, 48],
  FWD: [8, 64],
};

/**
 * Premium sports-card placeholder when no authorized photo exists.
 * Silhouette + photographic stadium depth (not cartoon avatars / initials).
 * Real scans always win via `imageUrl`.
 */
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
    const hue = (kit[0] + (h % 28) - 14 + 360) % 360;
    const jersey = accent || hsl(hue, kit[1], 40);
    const jerseyDark = hsl(hue, kit[1] + 10, 16);
    const jerseyLight = hsl(hue, Math.min(72, kit[1] + 8), 58);
    const skinTone = h % 5;
    const skinL = [62, 48, 36, 24, 14][skinTone];
    const skin = hsl(24, 38, skinL);
    const skinDeep = hsl(20, 42, Math.max(8, skinL - 16));
    return {
      hue,
      jersey,
      jerseyDark,
      jerseyLight,
      stripe: hsl((hue + 36) % 360, 52, 64),
      night: hsl(218, 38, 5),
      pitch: hsl(146, 42, 9),
      warm: hsl(34, 80, 56),
      cool: hsl(hue, 55, 62),
      skin,
      skinDeep,
      number: (h % 28) + 1,
      lean: h % 3 === 1,
      look: h % 2 === 0 ? -1 : 1,
    };
  }, [playerSlug, playerName, position, accent]);

  if (imageUrl) {
    return (
      <div className={`d11-portrait-photo h-full w-full ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={playerName} decoding="async" loading="lazy" />
      </div>
    );
  }

  const scaleX = palette.lean ? 0.94 : 1.04;

  return (
    <div className={`d11-portrait-illustrated relative h-full w-full ${className}`} aria-hidden>
      <svg viewBox="0 0 320 420" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor={hsl(palette.hue, 30, 10)} />
            <stop offset="40%" stopColor={palette.night} />
            <stop offset="75%" stopColor={palette.pitch} />
            <stop offset="100%" stopColor={hsl(150, 50, 4)} />
          </linearGradient>
          <radialGradient id={`key-${uid}`} cx="34%" cy="12%" r="62%">
            <stop offset="0%" stopColor={hsl(40, 70, 92, 0.7)} />
            <stop offset="35%" stopColor={hsl(36, 65, 55, 0.22)} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id={`rim-${uid}`} cx="88%" cy="30%" r="45%">
            <stop offset="0%" stopColor={hsl(palette.hue, 80, 72, 0.65)} />
            <stop offset="55%" stopColor={hsl(palette.hue, 60, 40, 0.15)} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id={`body-${uid}`} x1="0.2" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor={palette.jerseyLight} />
            <stop offset="20%" stopColor={palette.stripe} />
            <stop offset="35%" stopColor={palette.jersey} />
            <stop offset="100%" stopColor={palette.jerseyDark} />
          </linearGradient>
          <linearGradient id={`skin-${uid}`} x1="0.25" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor={palette.skin} />
            <stop offset="100%" stopColor={palette.skinDeep} />
          </linearGradient>
          <linearGradient id={`shade-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </linearGradient>
          <linearGradient id={`fog-${uid}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0.7)" />
            <stop offset="55%" stopColor="rgba(0,0,0,0.15)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
          <filter id={`soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
          <clipPath id={`frame-${uid}`}>
            <rect width="320" height="420" />
          </clipPath>
          <radialGradient id={`vig-${uid}`} cx="50%" cy="40%" r="75%">
            <stop offset="55%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
          </radialGradient>
        </defs>

        <g clipPath={`url(#frame-${uid})`}>
          {/* Photography-style stadium plate */}
          <rect width="320" height="420" fill={`url(#sky-${uid})`} />
          <ellipse cx="40" cy="95" rx="130" ry="58" fill="rgba(255,255,255,0.05)" filter={`url(#glow-${uid})`} />
          <ellipse cx="290" cy="78" rx="140" ry="62" fill="rgba(255,255,255,0.055)" filter={`url(#glow-${uid})`} />
          <ellipse cx="160" cy="48" rx="160" ry="42" fill="rgba(255,255,255,0.03)" />
          {/* crowd bowl */}
          <path d="M-40 210 Q160 145 360 210 L360 265 Q160 205 -40 265 Z" fill="rgba(255,255,255,0.04)" />
          <path d="M0 240 Q160 188 320 240 L320 420 L0 420 Z" fill="rgba(0,0,0,0.45)" />
          <path d="M0 268 Q160 222 320 268 L320 420 L0 420 Z" fill="rgba(8,58,30,0.55)" />
          <path
            d="M18 300 H302 M42 332 H278 M66 364 H254"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1.5"
          />
          {/* light shafts */}
          <path d="M20 -40 L110 200" stroke={palette.warm} strokeWidth="40" opacity="0.1" filter={`url(#glow-${uid})`} />
          <path d="M270 -50 L190 170" stroke={palette.cool} strokeWidth="48" opacity="0.11" filter={`url(#glow-${uid})`} />
          <rect width="320" height="420" fill={`url(#key-${uid})`} />
          <rect width="320" height="420" fill={`url(#rim-${uid})`} />

          {/* Athlete — chest-up sports-card crop, silhouette-led */}
          <g transform={`translate(160 430) scale(${scaleX} 1) translate(-160 -430)`}>
            {/* depth shadow */}
            <path
              d="M0 430 C20 300 65 245 160 232 C255 245 300 300 320 430 Z"
              fill="rgba(0,0,0,0.5)"
              transform="translate(8 6)"
              filter={`url(#soft-${uid})`}
            />
            {/* jersey torso */}
            <path
              d="M6 430 C26 298 70 242 160 230 C250 242 294 298 314 430 Z"
              fill={`url(#body-${uid})`}
            />
            {/* collar / V */}
            <path
              d="M105 252 C128 228 192 228 215 252 L232 310 C192 284 128 284 88 310 Z"
              fill="rgba(255,255,255,0.14)"
            />
            <path
              d="M114 258 C136 240 184 240 206 258"
              fill="none"
              stroke="rgba(255,255,255,0.38)"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            {/* sleeve seams */}
            <path d="M42 320 C76 286 100 270 116 262" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="5" strokeLinecap="round" />
            <path d="M278 320 C244 286 220 270 204 262" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="5" strokeLinecap="round" />
            {/* crest */}
            <ellipse cx="160" cy="312" rx="16" ry="18" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <text
              x="160"
              y="400"
              textAnchor="middle"
              fill="rgba(255,255,255,0.78)"
              fontFamily="var(--font-bebas), Impact, sans-serif"
              fontSize="64"
              fontWeight="700"
              letterSpacing="4"
            >
              {palette.number}
            </text>
            <path d="M136 255 C144 330 146 375 148 430" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="14" strokeLinecap="round" opacity="0.5" />
            <path d="M194 258 C188 335 184 380 182 430" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" strokeLinecap="round" />
          </g>

          {/* Neck + head as shaded form (no cartoon features) */}
          <g transform={`translate(${palette.look * 4} 0)`}>
            <path d="M138 205 C145 228 150 245 160 250 C170 245 175 228 182 205 Z" fill={`url(#skin-${uid})`} />
            {/* head oval with soft lighting — no eyes/mouth dots */}
            <ellipse cx="160" cy="155" rx="50" ry="58" fill={`url(#skin-${uid})`} />
            {/* hair mass as dark silhouette cap */}
            <path
              d="M110 155 C114 95 134 78 160 74 C186 78 206 95 210 155 C200 122 182 112 160 112 C138 112 120 122 110 155 Z"
              fill={hsl(20, 12, 6)}
            />
            <path
              d="M110 152 C116 138 128 130 140 128 L140 162 C128 162 116 158 110 152 Z"
              fill={hsl(20, 12, 6)}
            />
            <path
              d="M210 152 C204 138 192 130 180 128 L180 162 C192 162 204 158 210 152 Z"
              fill={hsl(20, 12, 6)}
            />
            {/* facial plane shading only — premium illustrated look */}
            <ellipse
              cx={160 + palette.look * -16}
              cy="168"
              rx="16"
              ry="22"
              fill="rgba(0,0,0,0.22)"
              filter={`url(#soft-${uid})`}
            />
            <ellipse
              cx={160 + palette.look * 18}
              cy="160"
              rx="12"
              ry="24"
              fill="rgba(255,255,255,0.14)"
              filter={`url(#soft-${uid})`}
            />
            {/* brow ridge suggestion */}
            <path
              d="M128 148 C140 142 152 142 158 146"
              fill="none"
              stroke="rgba(0,0,0,0.28)"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.55"
            />
            <path
              d="M162 146 C168 142 180 142 192 148"
              fill="none"
              stroke="rgba(0,0,0,0.28)"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.55"
            />
            {/* nose bridge shadow */}
            <path
              d="M156 152 C159 168 161 176 164 180"
              fill="none"
              stroke="rgba(0,0,0,0.22)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          {/* Rim light edge on silhouette */}
          <path
            d="M248 200 C258 250 268 320 276 430"
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.45"
            filter={`url(#soft-${uid})`}
          />
          <ellipse cx="205" cy="158" rx="7" ry="28" fill="rgba(255,255,255,0.18)" filter={`url(#soft-${uid})`} />

          {/* Grade overlays */}
          <rect width="320" height="420" fill={`url(#shade-${uid})`} />
          <rect width="320" height="420" fill={`url(#fog-${uid})`} />
          <rect width="320" height="420" fill={`url(#key-${uid})`} opacity="0.28" />
          <rect width="320" height="420" fill={`url(#vig-${uid})`} />
        </g>
      </svg>
    </div>
  );
}
