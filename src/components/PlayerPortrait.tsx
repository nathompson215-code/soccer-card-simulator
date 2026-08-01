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

type HairStyle = "fade" | "curly" | "long" | "buzz";

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
    const hue = (kit[0] + (h % 24) - 12 + 360) % 360;
    const skinTone = h % 5;
    const skinBases = [
      [28, 42, 72],
      [24, 48, 58],
      [22, 55, 46],
      [20, 45, 34],
      [18, 35, 22],
    ][skinTone] as [number, number, number];
    const skin = hsl(skinBases[0], skinBases[1], skinBases[2] + (h % 8) - 3);
    const skinShadow = hsl(skinBases[0], skinBases[1] + 8, Math.max(12, skinBases[2] - 16));
    const skinLight = hsl(skinBases[0] + 6, Math.max(20, skinBases[1] - 8), Math.min(88, skinBases[2] + 14));
    const hairStyles: HairStyle[] = ["fade", "curly", "long", "buzz"];
    const hairStyle = hairStyles[h % hairStyles.length];
    const hairDark = h % 3 === 0;
    const hair = hairDark
      ? hsl(25 + (h % 20), 18, 6 + (h % 10))
      : hsl(28 + (h % 25), 42, 28 + (h % 18));
    const jersey = accent || hsl(hue, kit[1], 42);
    const jerseyDark = hsl(hue, kit[1], 22);
    const jerseyLight = hsl(hue, Math.min(80, kit[1] + 10), 58);
    const stripe = hsl((hue + 32) % 360, 62, 70);
    const pitch = hsl(138, 42, 16);
    const night = hsl(220, 28, 10);
    const rim = hsl(hue, 70, 72);
    return {
      skin,
      skinShadow,
      skinLight,
      hair,
      hairStyle,
      jersey,
      jerseyDark,
      jerseyLight,
      stripe,
      pitch,
      night,
      rim,
      hue,
      number: (h % 28) + 1,
      beard: h % 4 === 0,
    };
  }, [playerSlug, playerName, position, accent]);

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={playerName}
        className={`h-full w-full object-cover object-top ${className}`}
        decoding="async"
        loading="lazy"
      />
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`} aria-hidden>
      <svg viewBox="0 0 320 420" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hsl(palette.hue, 40, 18)} />
            <stop offset="42%" stopColor={palette.night} />
            <stop offset="78%" stopColor={palette.pitch} />
            <stop offset="100%" stopColor={hsl(140, 45, 10)} />
          </linearGradient>
          <radialGradient id={`spot-${uid}`} cx="50%" cy="22%" r="48%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id={`rim-${uid}`} cx="78%" cy="30%" r="40%">
            <stop offset="0%" stopColor={palette.rim} stopOpacity="0.55" />
            <stop offset="100%" stopColor={palette.rim} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`jersey-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.jerseyLight} />
            <stop offset="18%" stopColor={palette.stripe} />
            <stop offset="28%" stopColor={palette.jersey} />
            <stop offset="100%" stopColor={palette.jerseyDark} />
          </linearGradient>
          <linearGradient id={`skin-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.skinLight} />
            <stop offset="45%" stopColor={palette.skin} />
            <stop offset="100%" stopColor={palette.skinShadow} />
          </linearGradient>
          <linearGradient id={`shade-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="55%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
          </linearGradient>
          <filter id={`soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>

        <rect width="320" height="420" fill={`url(#sky-${uid})`} />

        {/* stadium bowl / crowd */}
        <ellipse cx="40" cy="96" rx="58" ry="28" fill="rgba(255,255,255,0.04)" />
        <ellipse cx="280" cy="88" rx="64" ry="30" fill="rgba(255,255,255,0.05)" />
        <path d="M0 250 Q160 210 320 250 L320 420 L0 420 Z" fill="rgba(0,0,0,0.28)" />
        <path d="M0 268 Q160 232 320 268 L320 420 L0 420 Z" fill="rgba(18,90,48,0.35)" />
        <path
          d="M20 300 H300 M40 330 H280 M60 360 H260"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="2"
        />
        <rect width="320" height="420" fill={`url(#spot-${uid})`} />
        <rect width="320" height="420" fill={`url(#rim-${uid})`} />

        {/* shoulders / jersey */}
        <path
          d="M28 420 C40 278 78 236 160 228 C242 236 280 278 292 420 Z"
          fill={`url(#jersey-${uid})`}
        />
        <path
          d="M96 248 C118 228 202 228 224 248 L236 302 C198 278 122 278 84 302 Z"
          fill="rgba(255,255,255,0.16)"
        />
        <path
          d="M88 300 L160 268 L232 300"
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="160" cy="286" r="10" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.35)" />
        <text
          x="160"
          y="372"
          textAnchor="middle"
          fill="rgba(255,255,255,0.82)"
          fontFamily="var(--font-bebas), Impact, sans-serif"
          fontSize="54"
          fontWeight="700"
          letterSpacing="2"
        >
          {palette.number}
        </text>

        {/* neck */}
        <path
          d="M142 196 C146 214 148 228 160 232 C172 228 174 214 178 196 Z"
          fill={`url(#skin-${uid})`}
        />

        {/* head */}
        <ellipse cx="160" cy="154" rx="46" ry="54" fill={`url(#skin-${uid})`} />
        <ellipse cx="148" cy="168" rx="10" ry="7" fill={palette.skinShadow} opacity="0.25" />
        <ellipse cx="172" cy="168" rx="10" ry="7" fill={palette.skinShadow} opacity="0.25" />

        {/* hair */}
        {palette.hairStyle === "fade" ? (
          <>
            <path
              d="M114 150 C118 108 132 92 160 88 C188 92 202 108 206 150 C196 128 180 118 160 118 C140 118 124 128 114 150 Z"
              fill={palette.hair}
            />
            <path d="M114 148 C122 140 132 136 142 134 L142 156 C130 156 120 153 114 148 Z" fill={palette.hair} />
            <path d="M206 148 C198 140 188 136 178 134 L178 156 C190 156 200 153 206 148 Z" fill={palette.hair} />
          </>
        ) : null}
        {palette.hairStyle === "curly" ? (
          <>
            <circle cx="128" cy="112" r="16" fill={palette.hair} />
            <circle cx="148" cy="100" r="18" fill={palette.hair} />
            <circle cx="172" cy="98" r="18" fill={palette.hair} />
            <circle cx="192" cy="112" r="16" fill={palette.hair} />
            <circle cx="160" cy="118" r="20" fill={palette.hair} />
            <path d="M116 140 C120 118 140 108 160 108 C180 108 200 118 204 140" fill={palette.hair} />
          </>
        ) : null}
        {palette.hairStyle === "long" ? (
          <>
            <path
              d="M112 150 C116 100 134 84 160 82 C186 84 204 100 208 150 C210 190 204 220 198 236 C188 210 180 170 176 150 C170 168 150 168 144 150 C140 170 132 210 122 236 C116 220 110 190 112 150 Z"
              fill={palette.hair}
            />
            <path d="M120 130 C130 108 150 100 160 100 C170 100 190 108 200 130" fill={palette.hair} />
          </>
        ) : null}
        {palette.hairStyle === "buzz" ? (
          <ellipse cx="160" cy="122" rx="44" ry="28" fill={palette.hair} opacity="0.92" />
        ) : null}

        {/* facial features */}
        <ellipse cx="144" cy="156" rx="4.2" ry="5" fill="#1a1512" />
        <ellipse cx="176" cy="156" rx="4.2" ry="5" fill="#1a1512" />
        <ellipse cx="142.5" cy="154.5" rx="1.2" ry="1.4" fill="rgba(255,255,255,0.45)" />
        <ellipse cx="174.5" cy="154.5" rx="1.2" ry="1.4" fill="rgba(255,255,255,0.45)" />
        <path
          d="M158 162 C160 166 162 166 164 162"
          fill="none"
          stroke={palette.skinShadow}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M150 180 C156 186 164 186 170 180"
          fill="none"
          stroke="#6b4336"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.55"
        />
        {palette.beard ? (
          <path
            d="M132 174 C140 198 180 198 188 174 C176 190 144 190 132 174 Z"
            fill={palette.hair}
            opacity="0.55"
          />
        ) : null}

        {/* rim light on cheek / shoulder */}
        <ellipse cx="196" cy="160" rx="8" ry="18" fill="rgba(255,255,255,0.12)" filter={`url(#soft-${uid})`} />
        <path
          d="M248 300 C260 340 268 380 272 420"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.35"
        />

        <rect width="320" height="420" fill={`url(#shade-${uid})`} opacity="0.7" />
        <rect width="320" height="420" fill={`url(#spot-${uid})`} opacity="0.2" />
      </svg>
    </div>
  );
}
