"use client";

import { useMemo } from "react";

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
  GK: [46, 70],
  DEF: [214, 58],
  MID: [150, 50],
  FWD: [8, 66],
};

type Hair = "fade" | "waves" | "short" | "flow";

/**
 * Premium illustrated sports-card portrait fallback.
 * Authorized photos (`imageUrl`) always take priority.
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

  const p = useMemo(() => {
    const h = hash32(playerSlug || playerName);
    const kit = POS_KIT[position] ?? [160, 55];
    const hue = (kit[0] + (h % 26) - 13 + 360) % 360;
    const tone = h % 6;
    const skins: Array<[number, number, number]> = [
      [28, 40, 78],
      [26, 46, 66],
      [24, 50, 52],
      [22, 48, 40],
      [20, 42, 28],
      [18, 34, 18],
    ];
    const [sh, ss, sl] = skins[tone];
    const hairs: Hair[] = ["fade", "waves", "short", "flow"];
    return {
      hue,
      skin: hsl(sh, ss, sl),
      skinMid: hsl(sh, ss + 4, Math.max(14, sl - 10)),
      skinDeep: hsl(sh + 4, ss + 10, Math.max(10, sl - 20)),
      skinLite: hsl(sh + 8, Math.max(18, ss - 10), Math.min(90, sl + 16)),
      hair: (h >> 2) % 3 === 1 ? hsl(30, 45, 28 + (h % 12)) : hsl(22, 14, 5 + (h % 8)),
      hairStyle: hairs[h % hairs.length],
      jersey: accent || hsl(hue, kit[1], 40),
      jerseyDark: hsl(hue, kit[1] + 8, 16),
      jerseyLite: hsl(hue, Math.min(75, kit[1] + 6), 56),
      stripe: hsl((hue + 38) % 360, 55, 66),
      night: hsl(220, 36, 6),
      pitch: hsl(145, 40, 10),
      warm: hsl(36, 78, 58),
      rim: hsl(hue, 70, 70),
      number: (h % 28) + 1,
      beard: (h >> 3) % 5 === 0,
      look: h % 2 === 0 ? -1 : 1,
      broad: h % 3 !== 1,
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

  const sx = p.broad ? 1.04 : 0.96;

  return (
    <div className={`d11-portrait-illustrated relative h-full w-full ${className}`} aria-hidden>
      <svg viewBox="0 0 320 420" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`bg-${uid}`} x1="0.05" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor={hsl(p.hue, 28, 12)} />
            <stop offset="38%" stopColor={p.night} />
            <stop offset="72%" stopColor={p.pitch} />
            <stop offset="100%" stopColor={hsl(152, 45, 5)} />
          </linearGradient>
          <radialGradient id={`key-${uid}`} cx="36%" cy="14%" r="58%">
            <stop offset="0%" stopColor={hsl(40, 60, 92, 0.65)} />
            <stop offset="40%" stopColor={hsl(36, 55, 55, 0.18)} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id={`rimg-${uid}`} cx="86%" cy="28%" r="42%">
            <stop offset="0%" stopColor={hsl(p.hue, 75, 70, 0.55)} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id={`jer-${uid}`} x1="0.2" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor={p.jerseyLite} />
            <stop offset="18%" stopColor={p.stripe} />
            <stop offset="32%" stopColor={p.jersey} />
            <stop offset="100%" stopColor={p.jerseyDark} />
          </linearGradient>
          <linearGradient id={`sk-${uid}`} x1="0.25" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor={p.skinLite} />
            <stop offset="45%" stopColor={p.skin} />
            <stop offset="100%" stopColor={p.skinDeep} />
          </linearGradient>
          <linearGradient id={`fog-${uid}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0.65)" />
            <stop offset="50%" stopColor="rgba(0,0,0,0.12)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <filter id={`b-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.8" />
          </filter>
          <filter id={`s-${uid}`} x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="0.9" />
          </filter>
          <radialGradient id={`vig-${uid}`} cx="50%" cy="38%" r="72%">
            <stop offset="50%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.48)" />
          </radialGradient>
        </defs>

        <rect width="320" height="420" fill={`url(#bg-${uid})`} />
        <ellipse cx="45" cy="95" rx="120" ry="52" fill="rgba(255,255,255,0.05)" filter={`url(#b-${uid})`} />
        <ellipse cx="285" cy="80" rx="130" ry="56" fill="rgba(255,255,255,0.055)" filter={`url(#b-${uid})`} />
        <path d="M-20 215 Q160 155 340 215 L340 265 Q160 210 -20 265 Z" fill="rgba(255,255,255,0.035)" />
        <path d="M0 245 Q160 195 320 245 L320 420 L0 420 Z" fill="rgba(0,0,0,0.42)" />
        <path d="M0 272 Q160 228 320 272 L320 420 L0 420 Z" fill="rgba(10,62,32,0.5)" />
        <path d="M22 305 H298 M48 338 H272 M74 370 H246" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
        <path d="M25 -30 L105 185" stroke={p.warm} strokeWidth="36" opacity="0.09" filter={`url(#b-${uid})`} />
        <path d="M265 -40 L195 165" stroke={p.rim} strokeWidth="42" opacity="0.1" filter={`url(#b-${uid})`} />
        <rect width="320" height="420" fill={`url(#key-${uid})`} />
        <rect width="320" height="420" fill={`url(#rimg-${uid})`} />

        {/* Torso */}
        <g transform={`translate(160 425) scale(${sx} 1) translate(-160 -425)`}>
          <path d="M4 425 C24 300 68 244 160 232 C252 244 296 300 316 425 Z" fill="rgba(0,0,0,0.4)" transform="translate(7 5)" filter={`url(#s-${uid})`} />
          <path d="M10 425 C30 298 72 242 160 230 C248 242 290 298 310 425 Z" fill={`url(#jer-${uid})`} />
          <path d="M108 252 C130 230 190 230 212 252 L228 305 C190 280 130 280 92 305 Z" fill="rgba(255,255,255,0.14)" />
          <path d="M116 258 C138 242 182 242 204 258" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M46 318 C78 286 100 272 114 264" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M274 318 C242 286 220 272 206 264" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="4.5" strokeLinecap="round" />
          <ellipse cx="160" cy="308" rx="15" ry="17" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.38)" strokeWidth="1.3" />
          <text x="160" y="398" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontFamily="var(--font-bebas), Impact, sans-serif" fontSize="60" fontWeight="700" letterSpacing="3">
            {p.number}
          </text>
          <path d="M138 254 C146 325 148 370 150 425" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="12" strokeLinecap="round" opacity="0.5" />
          <path d="M192 256 C186 330 182 375 180 425" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" />
        </g>

        {/* Neck + head */}
        <g transform={`translate(${p.look * 3} 0)`}>
          <path d="M140 204 C146 226 150 242 160 246 C170 242 174 226 180 204 Z" fill={`url(#sk-${uid})`} />
          <ellipse cx="160" cy="152" rx="49" ry="56" fill={`url(#sk-${uid})`} />

          {/* Hair */}
          {p.hairStyle === "fade" ? (
            <path d="M111 150 C115 92 134 74 160 70 C186 74 205 92 209 150 C199 120 181 110 160 110 C139 110 121 120 111 150 Z" fill={p.hair} />
          ) : null}
          {p.hairStyle === "waves" ? (
            <path d="M110 152 C114 86 136 66 160 64 C188 66 210 90 212 152 C214 195 202 230 194 250 C184 205 178 168 174 150 C166 172 154 172 146 150 C140 170 130 210 120 248 C114 215 108 180 110 152 Z" fill={p.hair} />
          ) : null}
          {p.hairStyle === "short" ? (
            <>
              <ellipse cx="160" cy="118" rx="45" ry="30" fill={p.hair} />
              <path d="M114 145 C120 110 140 96 160 94 C180 96 200 110 206 145" fill={p.hair} />
            </>
          ) : null}
          {p.hairStyle === "flow" ? (
            <path d="M108 150 C114 80 138 60 164 58 C194 62 214 92 216 150 C220 205 206 250 196 275 C186 220 182 175 176 148 C166 175 148 172 138 146 C128 178 120 225 110 270 C104 220 102 180 108 150 Z" fill={p.hair} />
          ) : null}
          <path d="M111 148 C117 134 128 126 140 124 L140 158 C128 158 116 154 111 148 Z" fill={p.hair} />
          <path d="M209 148 C203 134 192 126 180 124 L180 158 C192 158 204 154 209 148 Z" fill={p.hair} />

          {/* Soft facial planes (illustrated, not avatar dots) */}
          <ellipse cx={160 + p.look * -15} cy="166" rx="15" ry="20" fill="rgba(0,0,0,0.18)" filter={`url(#s-${uid})`} />
          <ellipse cx={160 + p.look * 17} cy="158" rx="11" ry="22" fill="rgba(255,255,255,0.12)" filter={`url(#s-${uid})`} />
          <path d="M128 147 C140 140 152 140 158 145" fill="none" stroke={p.hair} strokeWidth="2.6" strokeLinecap="round" opacity="0.7" />
          <path d="M162 145 C168 140 180 140 192 147" fill="none" stroke={p.hair} strokeWidth="2.6" strokeLinecap="round" opacity="0.7" />
          {/* Eye sockets as soft lids */}
          <path d="M132 154 C138 150 148 150 154 154" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M166 154 C172 150 182 150 188 154" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="143" cy="156" rx="3.2" ry="3.6" fill="#1a1410" opacity="0.85" />
          <ellipse cx="177" cy="156" rx="3.2" ry="3.6" fill="#1a1410" opacity="0.85" />
          <ellipse cx="141.8" cy="154.8" rx="1" ry="1.1" fill="rgba(255,255,255,0.3)" />
          <ellipse cx="175.8" cy="154.8" rx="1" ry="1.1" fill="rgba(255,255,255,0.3)" />
          <path d="M156 156 C159 168 161 174 164 178" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="163" cy="180" rx="4.5" ry="2.6" fill="rgba(0,0,0,0.2)" />
          <path d="M147 190 C155 195 165 195 173 190" fill="none" stroke="#5a3a30" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
          {p.beard ? (
            <path d="M124 178 C136 210 184 210 196 178 C180 200 140 200 124 178 Z" fill={p.hair} opacity="0.38" />
          ) : null}
          <ellipse cx="202" cy="160" rx="7" ry="22" fill="rgba(255,255,255,0.14)" filter={`url(#s-${uid})`} />
        </g>

        <path d="M252 290 C262 335 270 380 276 425" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="12" strokeLinecap="round" opacity="0.35" filter={`url(#s-${uid})`} />
        <rect width="320" height="420" fill={`url(#fog-${uid})`} />
        <rect width="320" height="420" fill={`url(#key-${uid})`} opacity="0.22" />
        <rect width="320" height="420" fill={`url(#vig-${uid})`} />
      </svg>
    </div>
  );
}
