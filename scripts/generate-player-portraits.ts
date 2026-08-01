/**
 * Generate development player portraits into public/players/{slug}.webp
 *
 * Naming convention (no code changes needed for new players):
 *   public/players/{playerSlug}.webp
 *
 * Usage: npx tsx scripts/generate-player-portraits.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PLAYERS: { name: string; position: string; accent: string }[] = [
  { name: "Lionel Messi", position: "FWD", accent: "#F7B733" },
  { name: "Cristiano Ronaldo", position: "FWD", accent: "#F5F5F5" },
  { name: "Kylian Mbappé", position: "FWD", accent: "#FEBE10" },
  { name: "Erling Haaland", position: "FWD", accent: "#6CABDD" },
  { name: "Vinícius Júnior", position: "FWD", accent: "#FEBE10" },
  { name: "Jude Bellingham", position: "MID", accent: "#FEBE10" },
  { name: "Lamine Yamal", position: "FWD", accent: "#A50044" },
  { name: "Mohamed Salah", position: "FWD", accent: "#C8102E" },
  { name: "Aitana Bonmatí", position: "MID", accent: "#A50044" },
  { name: "Bukayo Saka", position: "FWD", accent: "#EF0107" },
  { name: "Harry Kane", position: "FWD", accent: "#DC052D" },
  { name: "Pedri", position: "MID", accent: "#A50044" },
];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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

function portraitSvg(name: string, position: string, accent: string) {
  const slug = slugify(name);
  const h = hash32(slug);
  const posHue = position === "MID" ? 152 : position === "DEF" ? 212 : position === "GK" ? 48 : 8;
  const hue = (posHue + (h % 20) - 10 + 360) % 360;
  const skin = hsl(28 + (h % 14), 38 + (h % 18), 42 + (h % 28));
  const hair = hsl(20 + (h % 30), 28, 8 + (h % 14));
  const jerseyDark = hsl(hue, 55, 22);
  const stripe = hsl((hue + 28) % 360, 60, 68);
  const number = (h % 28) + 1;
  const last = name.split(/\s+/).slice(-1)[0] ?? name;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="600" viewBox="0 0 240 300">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${hsl(hue, 35, 28)}"/>
      <stop offset="45%" stop-color="${hsl(hue, 20, 12)}"/>
      <stop offset="100%" stop-color="${hsl(140, 35, 18)}"/>
    </linearGradient>
    <radialGradient id="spot" cx="50%" cy="28%" r="50%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.35)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <linearGradient id="jersey" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${stripe}"/>
      <stop offset="22%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${jerseyDark}"/>
    </linearGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.12)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.25)"/>
    </linearGradient>
  </defs>
  <rect width="240" height="300" fill="url(#sky)"/>
  <ellipse cx="40" cy="70" rx="36" ry="18" fill="rgba(255,255,255,0.04)"/>
  <ellipse cx="200" cy="60" rx="42" ry="20" fill="rgba(255,255,255,0.05)"/>
  <rect x="0" y="185" width="240" height="115" fill="rgba(0,0,0,0.18)"/>
  <path d="M0 186 L240 186 L240 300 L0 300 Z" fill="rgba(20,80,45,0.22)"/>
  <rect width="240" height="300" fill="url(#spot)"/>
  <path d="M28 300 C42 205 68 168 120 162 C172 168 198 205 212 300 Z" fill="url(#jersey)"/>
  <path d="M78 188 C95 172 145 172 162 188 L170 230 C145 214 95 214 70 230 Z" fill="rgba(255,255,255,0.14)"/>
  <path d="M70 230 L120 205 L170 230" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  <text x="120" y="268" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="Arial Black, Impact, sans-serif" font-size="34" font-weight="700">${number}</text>
  <rect x="109" y="128" width="22" height="30" rx="7" fill="${skin}"/>
  <ellipse cx="120" cy="104" rx="33" ry="38" fill="${skin}"/>
  <path d="M88 98 C92 68 104 58 120 56 C136 58 148 68 152 98 C144 84 132 78 120 78 C108 78 96 84 88 98 Z" fill="${hair}"/>
  <path d="M88 96 C94 90 100 88 106 87 L106 102 C98 102 92 100 88 96 Z" fill="${hair}"/>
  <path d="M152 96 C146 90 140 88 134 87 L134 102 C142 102 148 100 152 96 Z" fill="${hair}"/>
  <ellipse cx="109" cy="108" rx="3" ry="3.5" fill="#1a1512" opacity="0.8"/>
  <ellipse cx="131" cy="108" rx="3" ry="3.5" fill="#1a1512" opacity="0.8"/>
  <path d="M113 124 C117 128 123 128 127 124" fill="none" stroke="#6b4336" stroke-width="1.8" stroke-linecap="round" opacity="0.55"/>
  <rect width="240" height="300" fill="url(#shade)" opacity="0.55"/>
  <rect width="240" height="300" fill="url(#spot)" opacity="0.25"/>
  <text x="12" y="20" fill="rgba(255,255,255,0.55)" font-family="Arial, sans-serif" font-size="8" letter-spacing="1.5">DRAFT ELEVEN</text>
  <text x="228" y="20" text-anchor="end" fill="rgba(255,255,255,0.45)" font-family="Arial, sans-serif" font-size="8">${last.toUpperCase()}</text>
</svg>`;
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "players");
  await mkdir(outDir, { recursive: true });

  for (const player of PLAYERS) {
    const slug = slugify(player.name);
    const svg = portraitSvg(player.name, player.position, player.accent);
    const svgPath = path.join(outDir, `${slug}.svg`);
    const webpPath = path.join(outDir, `${slug}.webp`);
    await writeFile(svgPath, svg, "utf8");
    await sharp(Buffer.from(svg)).webp({ quality: 86 }).toFile(webpPath);
    console.log(`wrote ${slug}.webp (+ .svg)`);
  }

  console.log(`Done. ${PLAYERS.length} portraits in public/players/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
