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
  GK: [46, 72],
  DEF: [214, 58],
  MID: [152, 50],
  FWD: [8, 66],
};

/**
 * Premium sports-card placeholder when no authorized photo exists.
 * Dramatic athlete silhouette with stadium lighting — never cartoon faces,
 * initials, or emoji-style art. Real scans always win via `imageUrl`.
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
    const hue = (kit[0] + (h % 30) - 15 + 360) % 360;
    const jersey = accent || hsl(hue, kit[1], 42);
    return {
      hue,
      jersey,
      jerseyDark: hsl(hue, kit[1] + 8, 14),
      jerseyMid: hsl(hue, kit[1], 28),
      jerseyGlow: hsl(hue, Math.min(78, kit[1] + 12), 58),
      night: hsl(218, 42, 4),
      pitch: hsl(148, 48, 7),
      warm: hsl(34, 88, 62),
      cool: hsl(hue, 60, 64),
      number: (h % 28) + 1,
      lean: (h % 3) - 1,
      look: h % 2 === 0 ? -1 : 1,
      flood: h % 2 === 0,
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

  const sx = 1 + palette.lean * 0.04;
  const look = palette.look * 6;

  return (
    <div className={`d11-portrait-illustrated relative h-full w-full ${className}`} aria-hidden>
      <svg viewBox="0 0 320 420" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`sky-${uid}`} x1="0.1" y1="0" x2="0.15" y2="1">
            <stop offset="0%" stopColor={hsl(palette.hue, 35, 8)} />
            <stop offset="32%" stopColor={palette.night} />
            <stop offset="68%" stopColor={palette.pitch} />
            <stop offset="100%" stopColor={hsl(155, 55, 3)} />
          </linearGradient>
          <radialGradient id={`flood-l-${uid}`} cx="18%" cy="8%" r="55%">
            <stop offset="0%" stopColor={hsl(42, 90, 94, 0.85)} />
            <stop offset="28%" stopColor={hsl(38, 80, 70, 0.28)} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id={`flood-r-${uid}`} cx="86%" cy="10%" r="50%">
            <stop offset="0%" stopColor={hsl(palette.hue, 70, 78, 0.55)} />
            <stop offset="40%" stopColor={hsl(palette.hue, 55, 45, 0.14)} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id={`key-${uid}`} cx="42%" cy="18%" r="60%">
            <stop offset="0%" stopColor={hsl(40, 55, 90, 0.35)} />
            <stop offset="45%" stopColor={hsl(36, 40, 50, 0.08)} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id={`sil-${uid}`} x1="0.25" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor={hsl(220, 18, 18)} />
            <stop offset="35%" stopColor={hsl(220, 22, 10)} />
            <stop offset="100%" stopColor={hsl(220, 30, 4)} />
          </linearGradient>
          <linearGradient id={`jer-${uid}`} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={palette.jerseyGlow} stopOpacity="0.55" />
            <stop offset="28%" stopColor={palette.jersey} stopOpacity="0.42" />
            <stop offset="70%" stopColor={palette.jerseyMid} stopOpacity="0.55" />
            <stop offset="100%" stopColor={palette.jerseyDark} stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id={`rim-${uid}`} x1="0" y1="0.2" x2="1" y2="0.8">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0)" />
            <stop offset="78%" stopColor={hsl(palette.hue, 70, 80, 0.45)} />
            <stop offset="100%" stopColor={hsl(40, 80, 90, 0.55)} />
          </linearGradient>
          <linearGradient id={`fog-${uid}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0.78)" />
            <stop offset="42%" stopColor="rgba(0,0,0,0.2)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id={`soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <filter id={`haze-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
          <radialGradient id={`vig-${uid}`} cx="50%" cy="36%" r="74%">
            <stop offset="48%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.58)" />
          </radialGradient>
          <clipPath id={`frame-${uid}`}>
            <rect width="320" height="420" />
          </clipPath>
        </defs>

        <g clipPath={`url(#frame-${uid})`}>
          {/* Stadium night plate */}
          <rect width="320" height="420" fill={`url(#sky-${uid})`} />

          {/* Floodlight blooms */}
          <ellipse
            cx={palette.flood ? 48 : 72}
            cy="70"
            rx="118"
            ry="48"
            fill="rgba(255,255,255,0.06)"
            filter={`url(#glow-${uid})`}
          />
          <ellipse
            cx={palette.flood ? 278 : 250}
            cy="58"
            rx="130"
            ry="52"
            fill="rgba(255,255,255,0.055)"
            filter={`url(#glow-${uid})`}
          />
          <ellipse cx="160" cy="36" rx="150" ry="36" fill="rgba(255,255,255,0.03)" />

          {/* Crowd bowl suggestion */}
          <path
            d="M-36 198 Q160 128 356 198 L356 248 Q160 188 -36 248 Z"
            fill="rgba(255,255,255,0.035)"
          />
          <path d="M0 228 Q160 172 320 228 L320 420 L0 420 Z" fill="rgba(0,0,0,0.5)" />
          <path d="M0 258 Q160 208 320 258 L320 420 L0 420 Z" fill="rgba(6,48,26,0.55)" />
          <path
            d="M20 292 H300 M46 324 H274 M72 356 H248"
            fill="none"
            stroke="rgba(255,255,255,0.045)"
            strokeWidth="1.4"
          />

          {/* Light shafts */}
          <path
            d="M8 -50 L108 210"
            stroke={palette.warm}
            strokeWidth="44"
            opacity="0.11"
            filter={`url(#glow-${uid})`}
          />
          <path
            d="M300 -55 L200 190"
            stroke={palette.cool}
            strokeWidth="50"
            opacity="0.1"
            filter={`url(#glow-${uid})`}
          />
          <rect width="320" height="420" fill={`url(#flood-l-${uid})`} />
          <rect width="320" height="420" fill={`url(#flood-r-${uid})`} />
          <rect width="320" height="420" fill={`url(#key-${uid})`} />

          {/* Athlete silhouette — chest-up sports-card crop */}
          <g transform={`translate(160 430) scale(${sx} 1) translate(${-160 + look} -430)`}>
            {/* Contact shadow */}
            <path
              d="M8 430 C28 305 70 248 160 236 C250 248 292 305 312 430 Z"
              fill="rgba(0,0,0,0.55)"
              transform="translate(10 8)"
              filter={`url(#soft-${uid})`}
            />

            {/* Outer rim glow along silhouette edge */}
            <path
              d="M14 430 C34 300 74 244 160 232 C246 244 286 300 306 430 Z"
              fill="none"
              stroke={palette.jerseyGlow}
              strokeWidth="7"
              opacity="0.35"
              filter={`url(#glow-${uid})`}
            />

            {/* Body mass */}
            <path
              d="M18 430 C38 302 76 246 160 234 C244 246 282 302 302 430 Z"
              fill={`url(#sil-${uid})`}
            />

            {/* Jersey color bleed through silhouette */}
            <path
              d="M28 430 C46 310 82 258 160 246 C238 258 274 310 292 430 Z"
              fill={`url(#jer-${uid})`}
            />

            {/* Collar notch */}
            <path
              d="M118 248 C136 230 184 230 202 248 L214 278 C188 264 132 264 106 278 Z"
              fill="rgba(0,0,0,0.45)"
            />
            <path
              d="M124 252 C140 238 180 238 196 252"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Sleeve seam depth */}
            <path
              d="M48 318 C78 288 100 272 116 264"
              fill="none"
              stroke="rgba(0,0,0,0.45)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M272 318 C242 288 220 272 204 264"
              fill="none"
              stroke="rgba(0,0,0,0.45)"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Crest suggestion */}
            <ellipse
              cx="160"
              cy="308"
              rx="13"
              ry="15"
              fill="rgba(255,255,255,0.08)"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.2"
            />

            {/* Jersey number — faint sports-card detail */}
            <text
              x="160"
              y="396"
              textAnchor="middle"
              fill="rgba(255,255,255,0.22)"
              fontFamily="var(--font-bebas), Impact, sans-serif"
              fontSize="68"
              fontWeight="700"
              letterSpacing="4"
            >
              {palette.number}
            </text>

            {/* Form folds */}
            <path
              d="M138 256 C146 330 148 375 150 430"
              fill="none"
              stroke="rgba(0,0,0,0.35)"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.55"
            />
            <path
              d="M192 258 C186 335 182 380 180 430"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="11"
              strokeLinecap="round"
            />
          </g>

          {/* Head + neck as pure silhouette mass (no facial features) */}
          <g transform={`translate(${look * 0.35} 0)`}>
            <path
              d="M140 208 C147 230 152 246 160 252 C168 246 173 230 180 208 Z"
              fill={`url(#sil-${uid})`}
            />
            <ellipse cx="160" cy="152" rx="46" ry="54" fill={`url(#sil-${uid})`} />

            {/* Hair mass / head silhouette cap */}
            <path
              d="M114 152 C118 92 136 74 160 70 C184 74 202 92 206 152 C196 118 180 108 160 108 C140 108 124 118 114 152 Z"
              fill={hsl(220, 25, 5)}
            />
            <path
              d="M114 150 C120 136 132 128 144 126 L144 160 C132 160 120 156 114 150 Z"
              fill={hsl(220, 25, 5)}
            />
            <path
              d="M206 150 C200 136 188 128 176 126 L176 160 C188 160 200 156 206 150 Z"
              fill={hsl(220, 25, 5)}
            />

            {/* Soft volume planes only — no eyes/mouth */}
            <ellipse
              cx={160 + palette.look * -14}
              cy="168"
              rx="14"
              ry="20"
              fill="rgba(0,0,0,0.35)"
              filter={`url(#soft-${uid})`}
            />
            <ellipse
              cx={160 + palette.look * 16}
              cy="158"
              rx="10"
              ry="22"
              fill="rgba(255,255,255,0.08)"
              filter={`url(#soft-${uid})`}
            />
          </g>

          {/* Rim light tracing silhouette */}
          <path
            d="M248 198 C258 250 268 320 276 430"
            fill="none"
            stroke="rgba(255,255,255,0.42)"
            strokeWidth="9"
            strokeLinecap="round"
            opacity="0.5"
            filter={`url(#soft-${uid})`}
          />
          <ellipse
            cx="204"
            cy="148"
            rx="6"
            ry="26"
            fill="rgba(255,255,255,0.2)"
            filter={`url(#soft-${uid})`}
          />
          <path
            d="M112 120 C100 160 92 220 88 300"
            fill="none"
            stroke={palette.jerseyGlow}
            strokeWidth="5"
            opacity="0.22"
            filter={`url(#glow-${uid})`}
          />

          {/* Grade overlays */}
          <rect width="320" height="420" fill={`url(#rim-${uid})`} opacity="0.55" />
          <rect width="320" height="420" fill={`url(#fog-${uid})`} />
          <rect width="320" height="420" fill={`url(#key-${uid})`} opacity="0.3" />
          <rect width="320" height="420" fill={`url(#vig-${uid})`} />
          <rect
            width="320"
            height="420"
            fill="rgba(0,0,0,0.08)"
            filter={`url(#haze-${uid})`}
            opacity="0.4"
          />
        </g>
      </svg>
    </div>
  );
}
