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
  GK: [48, 72],
  DEF: [214, 62],
  MID: [152, 52],
  FWD: [6, 68],
};

type Build = "lean" | "athletic" | "stocky";
type HairStyle = "fade" | "waves" | "cropped" | "flow";

/**
 * Premium illustrated fallback when no authorized player photo is available.
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

    const skinTone = h % 6;
    const skinBases: Array<[number, number, number]> = [
      [28, 38, 78],
      [26, 44, 66],
      [24, 50, 52],
      [22, 48, 40],
      [20, 42, 28],
      [18, 32, 18],
    ];
    const [sh, ss, sl] = skinBases[skinTone];
    const skin = hsl(sh, ss, sl + (h % 6) - 2);
    const skinShadow = hsl(sh + 4, ss + 10, Math.max(10, sl - 18));
    const skinMid = hsl(sh, ss + 4, Math.max(14, sl - 8));
    const skinLight = hsl(sh + 8, Math.max(18, ss - 10), Math.min(90, sl + 16));

    const hairStyles: HairStyle[] = ["fade", "waves", "cropped", "flow"];
    const hairStyle = hairStyles[h % hairStyles.length];
    const hairDark = (h >> 3) % 3 !== 1;
    const hair = hairDark
      ? hsl(22 + (h % 18), 14, 5 + (h % 9))
      : hsl(30 + (h % 22), 48, 26 + (h % 16));
    const hairSheen = hsl(35, 20, hairDark ? 28 : 55, 0.35);

    const builds: Build[] = ["lean", "athletic", "stocky"];
    const build = builds[h % builds.length];

    const jersey = accent || hsl(hue, kit[1], 40);
    const jerseyDark = hsl(hue, kit[1] + 6, 18);
    const jerseyLight = hsl(hue, Math.min(78, kit[1] + 8), 56);
    const stripe = hsl((hue + 38) % 360, 58, 68);
    const night = hsl(218, 34, 8);
    const pitch = hsl(142, 38, 12);
    const rim = hsl(hue, 65, 70);
    const warmKey = hsl(38, 70, 62);

    return {
      skin,
      skinShadow,
      skinMid,
      skinLight,
      hair,
      hairSheen,
      hairStyle,
      build,
      jersey,
      jerseyDark,
      jerseyLight,
      stripe,
      night,
      pitch,
      rim,
      warmKey,
      hue,
      number: (h % 28) + 1,
      beard: (h >> 2) % 5 === 0,
      leftLook: h % 2 === 0,
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

  const shoulderScale =
    palette.build === "stocky" ? 1.06 : palette.build === "lean" ? 0.94 : 1;
  const headY = palette.build === "stocky" ? 148 : palette.build === "lean" ? 142 : 145;

  return (
    <div
      className={`d11-portrait-illustrated relative h-full w-full ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 320 420" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0.15" y2="1">
            <stop offset="0%" stopColor={hsl(palette.hue, 28, 14)} />
            <stop offset="38%" stopColor={palette.night} />
            <stop offset="72%" stopColor={palette.pitch} />
            <stop offset="100%" stopColor={hsl(150, 40, 7)} />
          </linearGradient>
          <radialGradient id={`key-${uid}`} cx="42%" cy="18%" r="55%">
            <stop offset="0%" stopColor={hsl(45, 40, 92, 0.55)} />
            <stop offset="35%" stopColor={hsl(40, 50, 70, 0.18)} />
            <stop offset="100%" stopColor={hsl(40, 40, 40, 0)} />
          </radialGradient>
          <radialGradient id={`rimlight-${uid}`} cx="82%" cy="28%" r="42%">
            <stop offset="0%" stopColor={hsl(palette.hue, 70, 72, 0.5)} />
            <stop offset="55%" stopColor={hsl(palette.hue, 60, 50, 0.12)} />
            <stop offset="100%" stopColor={hsl(palette.hue, 50, 40, 0)} />
          </radialGradient>
          <radialGradient id={`bokeh-${uid}`} cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="70%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
          </radialGradient>
          <linearGradient id={`jersey-${uid}`} x1="0.2" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor={palette.jerseyLight} />
            <stop offset="22%" stopColor={palette.stripe} />
            <stop offset="32%" stopColor={palette.jersey} />
            <stop offset="100%" stopColor={palette.jerseyDark} />
          </linearGradient>
          <linearGradient id={`skin-${uid}`} x1="0.25" y1="0.05" x2="0.9" y2="1">
            <stop offset="0%" stopColor={palette.skinLight} />
            <stop offset="40%" stopColor={palette.skin} />
            <stop offset="78%" stopColor={palette.skinMid} />
            <stop offset="100%" stopColor={palette.skinShadow} />
          </linearGradient>
          <linearGradient id={`shade-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="48%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.42)" />
          </linearGradient>
          <linearGradient id={`fog-${uid}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
            <stop offset="45%" stopColor="rgba(0,0,0,0.12)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <filter id={`soft-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
          <filter id={`soft2-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          <filter id={`grain-${uid}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="n" />
            <feColorMatrix
              in="n"
              type="matrix"
              values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.08 0"
            />
          </filter>
        </defs>

        {/* Photographic depth background */}
        <rect width="320" height="420" fill={`url(#bg-${uid})`} />
        <ellipse cx="60" cy="110" rx="90" ry="44" fill="rgba(255,255,255,0.035)" filter={`url(#soft2-${uid})`} />
        <ellipse cx="270" cy="95" rx="100" ry="48" fill="rgba(255,255,255,0.04)" filter={`url(#soft2-${uid})`} />
        <ellipse cx="160" cy="70" rx="120" ry="36" fill="rgba(255,255,255,0.03)" />
        {/* stadium stands suggestion */}
        <path
          d="M-20 230 Q160 175 340 230 L340 280 Q160 230 -20 280 Z"
          fill="rgba(255,255,255,0.04)"
        />
        <path d="M0 255 Q160 210 320 255 L320 420 L0 420 Z" fill="rgba(0,0,0,0.35)" />
        <path d="M0 278 Q160 238 320 278 L320 420 L0 420 Z" fill="rgba(12,70,38,0.42)" />
        <path
          d="M24 308 H296 M48 340 H272 M72 372 H248"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.5"
        />
        {/* light streaks */}
        <path
          d="M40 -10 L90 160"
          stroke={palette.warmKey}
          strokeWidth="18"
          opacity="0.07"
          filter={`url(#soft2-${uid})`}
        />
        <path
          d="M250 -20 L210 140"
          stroke={palette.rim}
          strokeWidth="22"
          opacity="0.08"
          filter={`url(#soft2-${uid})`}
        />
        <rect width="320" height="420" fill={`url(#key-${uid})`} />
        <rect width="320" height="420" fill={`url(#rimlight-${uid})`} />

        {/* torso / jersey — 3/4 athletic proportions */}
        <g transform={`translate(160 420) scale(${shoulderScale} 1) translate(-160 -420)`}>
          <path
            d="M18 420 C34 292 72 238 160 228 C248 238 286 292 302 420 Z"
            fill={`url(#jersey-${uid})`}
          />
          {/* collar / V */}
          <path
            d="M112 246 C130 228 190 228 208 246 L222 292 C190 274 130 274 98 292 Z"
            fill="rgba(255,255,255,0.14)"
          />
          <path
            d="M118 252 C136 238 184 238 202 252"
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* sleeve seams */}
          <path
            d="M52 320 C78 290 96 278 108 270"
            fill="none"
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M268 320 C242 290 224 278 212 270"
            fill="none"
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* crest plate */}
          <ellipse
            cx="160"
            cy="300"
            rx="13"
            ry="15"
            fill="rgba(255,255,255,0.16)"
            stroke="rgba(255,255,255,0.32)"
            strokeWidth="1.2"
          />
          <text
            x="160"
            y="388"
            textAnchor="middle"
            fill="rgba(255,255,255,0.78)"
            fontFamily="var(--font-bebas), Impact, sans-serif"
            fontSize="58"
            fontWeight="700"
            letterSpacing="3"
            opacity="0.9"
          >
            {palette.number}
          </text>
          {/* fabric fold shading */}
          <path
            d="M140 250 C148 310 150 360 152 420"
            fill="none"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M190 255 C184 320 180 365 178 420"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </g>

        {/* neck */}
        <path
          d="M142 198 C147 218 150 234 160 238 C170 234 173 218 178 198 Z"
          fill={`url(#skin-${uid})`}
        />
        <path
          d="M146 210 C152 224 168 224 174 210"
          fill="none"
          stroke={palette.skinShadow}
          strokeWidth="2"
          opacity="0.35"
        />

        {/* head — soft illustrated, not cartoon */}
        <ellipse cx="160" cy={headY} rx="44" ry="52" fill={`url(#skin-${uid})`} />
        {/* cheek planes */}
        <ellipse
          cx={palette.leftLook ? 146 : 174}
          cy={headY + 12}
          rx="11"
          ry="14"
          fill={palette.skinShadow}
          opacity="0.18"
          filter={`url(#soft-${uid})`}
        />
        <ellipse
          cx={palette.leftLook ? 178 : 148}
          cy={headY + 8}
          rx="9"
          ry="16"
          fill="rgba(255,255,255,0.1)"
          filter={`url(#soft-${uid})`}
        />
        {/* jaw definition */}
        <path
          d={`M120 ${headY + 18} C128 ${headY + 48} 192 ${headY + 48} 200 ${headY + 18}`}
          fill="none"
          stroke={palette.skinShadow}
          strokeWidth="3"
          opacity="0.2"
          filter={`url(#soft-${uid})`}
        />

        {/* hair */}
        {palette.hairStyle === "fade" ? (
          <>
            <path
              d={`M116 ${headY - 4} C120 ${headY - 52} 134 ${headY - 66} 160 ${headY - 70} C186 ${headY - 66} 200 ${headY - 52} 204 ${headY - 4} C194 ${headY - 28} 178 ${headY - 36} 160 ${headY - 36} C142 ${headY - 36} 126 ${headY - 28} 116 ${headY - 4} Z`}
              fill={palette.hair}
            />
            <path
              d={`M116 ${headY - 6} C124 ${headY - 16} 134 ${headY - 20} 144 ${headY - 22} L144 ${headY + 2} C132 ${headY + 2} 122 ${headY - 2} 116 ${headY - 6} Z`}
              fill={palette.hair}
            />
            <path
              d={`M204 ${headY - 6} C196 ${headY - 16} 186 ${headY - 20} 176 ${headY - 22} L176 ${headY + 2} C188 ${headY + 2} 198 ${headY - 2} 204 ${headY - 6} Z`}
              fill={palette.hair}
            />
            <ellipse cx="150" cy={headY - 48} rx="10" ry="4" fill={palette.hairSheen} />
          </>
        ) : null}
        {palette.hairStyle === "waves" ? (
          <>
            <path
              d={`M114 ${headY} C116 ${headY - 58} 136 ${headY - 74} 160 ${headY - 76} C184 ${headY - 74} 204 ${headY - 58} 206 ${headY} C208 ${headY + 28} 200 ${headY + 48} 194 ${headY + 58} C186 ${headY + 30} 178 ${headY + 8} 174 ${headY - 2} C168 ${headY + 14} 152 ${headY + 14} 146 ${headY - 2} C142 ${headY + 10} 134 ${headY + 32} 126 ${headY + 58} C120 ${headY + 42} 112 ${headY + 22} 114 ${headY} Z`}
              fill={palette.hair}
            />
            <path
              d={`M130 ${headY - 40} C140 ${headY - 58} 180 ${headY - 58} 190 ${headY - 40}`}
              fill="none"
              stroke={palette.hairSheen}
              strokeWidth="3"
            />
          </>
        ) : null}
        {palette.hairStyle === "cropped" ? (
          <>
            <ellipse cx="160" cy={headY - 28} rx="42" ry="30" fill={palette.hair} />
            <path
              d={`M118 ${headY - 8} C122 ${headY - 36} 140 ${headY - 48} 160 ${headY - 50} C180 ${headY - 48} 198 ${headY - 36} 202 ${headY - 8}`}
              fill={palette.hair}
            />
            <ellipse cx="160" cy={headY - 42} rx="16" ry="5" fill={palette.hairSheen} />
          </>
        ) : null}
        {palette.hairStyle === "flow" ? (
          <>
            <path
              d={`M112 ${headY - 2} C118 ${headY - 60} 138 ${headY - 78} 162 ${headY - 80} C190 ${headY - 76} 208 ${headY - 52} 210 ${headY - 8} C214 ${headY + 40} 206 ${headY + 70} 198 ${headY + 88} C190 ${headY + 50} 186 ${headY + 20} 180 ${headY - 2} C172 ${headY + 20} 150 ${headY + 18} 142 ${headY - 4} C136 ${headY + 24} 128 ${headY + 54} 120 ${headY + 82} C114 ${headY + 50} 108 ${headY + 24} 112 ${headY - 2} Z`}
              fill={palette.hair}
            />
            <path
              d={`M140 ${headY - 55} C155 ${headY - 68} 175 ${headY - 66} 188 ${headY - 52}`}
              fill="none"
              stroke={palette.hairSheen}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        ) : null}

        {/* brows */}
        <path
          d={`M132 ${headY - 4} C140 ${headY - 10} 150 ${headY - 10} 156 ${headY - 6}`}
          fill="none"
          stroke={palette.hair}
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d={`M164 ${headY - 6} C170 ${headY - 10} 180 ${headY - 10} 188 ${headY - 4}`}
          fill="none"
          stroke={palette.hair}
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* eyes — soft half-lidded sports-card look */}
        <ellipse cx="144" cy={headY + 6} rx="5.5" ry="3.8" fill={palette.skinShadow} opacity="0.55" />
        <ellipse cx="176" cy={headY + 6} rx="5.5" ry="3.8" fill={palette.skinShadow} opacity="0.55" />
        <ellipse cx="144" cy={headY + 5.5} rx="3.2" ry="3.4" fill="#1c1612" />
        <ellipse cx="176" cy={headY + 5.5} rx="3.2" ry="3.4" fill="#1c1612" />
        <ellipse cx="142.8" cy={headY + 4.2} rx="1.1" ry="1.2" fill="rgba(255,255,255,0.35)" />
        <ellipse cx="174.8" cy={headY + 4.2} rx="1.1" ry="1.2" fill="rgba(255,255,255,0.35)" />

        {/* nose bridge / tip — subtle */}
        <path
          d={`M158 ${headY + 4} C160 ${headY + 16} 162 ${headY + 20} 164 ${headY + 22}`}
          fill="none"
          stroke={palette.skinShadow}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.4"
        />
        <ellipse cx="162" cy={headY + 24} rx="4" ry="2.4" fill={palette.skinShadow} opacity="0.22" />

        {/* mouth */}
        <path
          d={`M148 ${headY + 36} C154 ${headY + 40} 166 ${headY + 40} 172 ${headY + 36}`}
          fill="none"
          stroke="#5a382e"
          strokeWidth="2.1"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d={`M150 ${headY + 36} C156 ${headY + 34} 164 ${headY + 34} 170 ${headY + 36}`}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {palette.beard ? (
          <path
            d={`M128 ${headY + 28} C138 ${headY + 58} 182 ${headY + 58} 192 ${headY + 28} C178 ${headY + 48} 142 ${headY + 48} 128 ${headY + 28} Z`}
            fill={palette.hair}
            opacity="0.42"
          />
        ) : null}

        {/* rim light on face / shoulder */}
        <ellipse
          cx="196"
          cy={headY + 8}
          rx="7"
          ry="20"
          fill="rgba(255,255,255,0.14)"
          filter={`url(#soft-${uid})`}
        />
        <path
          d="M255 290 C265 330 272 372 276 420"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.32"
          filter={`url(#soft-${uid})`}
        />

        {/* photographic grade overlays */}
        <rect width="320" height="420" fill={`url(#shade-${uid})`} opacity="0.75" />
        <rect width="320" height="420" fill={`url(#fog-${uid})`} />
        <rect width="320" height="420" fill={`url(#bokeh-${uid})`} />
        <rect width="320" height="420" filter={`url(#grain-${uid})`} opacity="0.55" style={{ mixBlendMode: "overlay" }} />
        <rect width="320" height="420" fill={`url(#key-${uid})`} opacity="0.22" />
      </svg>
    </div>
  );
}
