#!/usr/bin/env node
/**
 * Generates small authorized sample SVG assets for local seed demos.
 * Replace these with licensed photography / scan artwork using the same paths.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "public");

function write(rel, contents) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
  console.log("wrote", rel);
}

function playerSvg(name, accent, pos) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f241c"/>
      <stop offset="55%" stop-color="#163528"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="spot" cx="50%" cy="30%" r="55%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.35)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <rect width="800" height="1000" fill="url(#spot)"/>
  <circle cx="400" cy="380" r="160" fill="#d7b39a"/>
  <ellipse cx="400" cy="720" rx="220" ry="260" fill="${accent}"/>
  <rect x="340" y="520" width="120" height="90" rx="24" fill="#d7b39a"/>
  <text x="400" y="410" text-anchor="middle" fill="#1a1512" font-family="Arial,sans-serif" font-size="72" font-weight="700">${initials}</text>
  <text x="400" y="930" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial,sans-serif" font-size="42" font-weight="700">${name}</text>
  <text x="400" y="970" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-family="Arial,sans-serif" font-size="24" letter-spacing="4">${pos} · SAMPLE ASSET</text>
</svg>`;
}

function cardFrontSvg({ title, subtitle, accent, number, parallel }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1050" viewBox="0 0 750 1050" role="img" aria-label="${title} card front">
  <defs>
    <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1a14"/>
      <stop offset="50%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="#07110d"/>
    </linearGradient>
    <linearGradient id="photo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1b3a2e"/>
      <stop offset="100%" stop-color="#0b1a14"/>
    </linearGradient>
  </defs>
  <rect width="750" height="1050" rx="28" fill="url(#frame)"/>
  <rect x="28" y="28" width="694" height="994" rx="18" fill="#0b1a14" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
  <rect x="52" y="90" width="646" height="720" rx="14" fill="url(#photo)"/>
  <circle cx="375" cy="360" r="120" fill="#d7b39a"/>
  <ellipse cx="375" cy="620" rx="170" ry="200" fill="${accent}"/>
  <text x="60" y="70" fill="rgba(255,255,255,0.75)" font-family="Arial,sans-serif" font-size="22" letter-spacing="6">DRAFT ELEVEN</text>
  <text x="690" y="70" text-anchor="end" fill="#f0d78c" font-family="Arial,sans-serif" font-size="22" font-weight="700">#${number}</text>
  <rect x="52" y="780" width="646" height="210" rx="14" fill="rgba(0,0,0,0.55)"/>
  <text x="80" y="860" fill="#fff" font-family="Arial,sans-serif" font-size="54" font-weight="700">${title}</text>
  <text x="80" y="910" fill="rgba(255,255,255,0.7)" font-family="Arial,sans-serif" font-size="24">${subtitle}</text>
  <text x="80" y="955" fill="#f0d78c" font-family="Arial,sans-serif" font-size="22" letter-spacing="2">${parallel}</text>
</svg>`;
}

function cardBackSvg({ title, product }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1050" viewBox="0 0 750 1050" role="img" aria-label="${title} card back">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    </pattern>
    <linearGradient id="back" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#10261c"/>
      <stop offset="100%" stop-color="#07110d"/>
    </linearGradient>
  </defs>
  <rect width="750" height="1050" rx="28" fill="url(#back)"/>
  <rect width="750" height="1050" fill="url(#grid)"/>
  <rect x="40" y="40" width="670" height="970" rx="16" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  <text x="375" y="420" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial,sans-serif" font-size="96" font-weight="700">D11</text>
  <text x="375" y="500" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-family="Arial,sans-serif" font-size="28" letter-spacing="8">DRAFT ELEVEN</text>
  <text x="375" y="620" text-anchor="middle" fill="rgba(255,255,255,0.75)" font-family="Arial,sans-serif" font-size="28">${title}</text>
  <text x="375" y="670" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-family="Arial,sans-serif" font-size="20">${product}</text>
  <text x="375" y="920" text-anchor="middle" fill="rgba(240,215,140,0.7)" font-family="Arial,sans-serif" font-size="18" letter-spacing="3">AUTHORIZED SAMPLE BACK</text>
</svg>`;
}

function logoSvg(label, color) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="${label}">
  <rect width="512" height="512" rx="64" fill="${color}"/>
  <circle cx="256" cy="220" r="90" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="18"/>
  <text x="256" y="400" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="42" font-weight="700">${label}</text>
</svg>`;
}

function productSvg(name, accent) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="p" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="#07110d"/>
    </linearGradient>
  </defs>
  <rect width="900" height="1200" fill="url(#p)"/>
  <rect x="60" y="80" width="780" height="1040" rx="24" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.25)"/>
  <text x="450" y="520" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="48" font-weight="700">${name}</text>
  <text x="450" y="580" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="Arial,sans-serif" font-size="24">PRODUCT SAMPLE</text>
</svg>`;
}

const players = [
  ["lionel-messi", "Lionel Messi", "#75AADB", "FWD"],
  ["cristiano-ronaldo", "Cristiano Ronaldo", "#006600", "FWD"],
  ["kylian-mbappe", "Kylian Mbappé", "#FEBE10", "FWD"],
];

for (const [slug, name, accent, pos] of players) {
  write(`players/${slug}.svg`, playerSvg(name, accent, pos));
  write(`players/${slug}@2x.svg`, playerSvg(name, accent, pos));
}

const cardSamples = [
  {
    slug: "topps-chrome-ucl-2024-25__base__1__base",
    title: "Lionel Messi",
    subtitle: "Inter Miami · Argentina",
    accent: "#C8102E",
    number: "1",
    parallel: "Base",
    product: "Topps Chrome UCL 2024-25",
  },
  {
    slug: "topps-chrome-ucl-2024-25__base__2__base",
    title: "Cristiano Ronaldo",
    subtitle: "Al Nassr · Portugal",
    accent: "#C8102E",
    number: "2",
    parallel: "Base",
    product: "Topps Chrome UCL 2024-25",
  },
  {
    slug: "topps-chrome-ucl-2024-25__base__3__silver",
    title: "Kylian Mbappé",
    subtitle: "Real Madrid · France",
    accent: "#9AA4AD",
    number: "3",
    parallel: "Silver Refractor",
    product: "Topps Chrome UCL 2024-25",
  },
  {
    slug: "topps-chrome-ucl-2024-25__signature-stars__1__on-card-auto",
    title: "Lionel Messi",
    subtitle: "Signature Stars Autograph",
    accent: "#D4AF37",
    number: "AU-1",
    parallel: "On-Card Auto",
    product: "Topps Chrome UCL 2024-25",
  },
];

for (const c of cardSamples) {
  write(
    `cards/${c.slug}/front.svg`,
    cardFrontSvg(c),
  );
  write(
    `cards/${c.slug}/front@2x.svg`,
    cardFrontSvg(c),
  );
  write(
    `cards/${c.slug}/back.svg`,
    cardBackSvg(c),
  );
  write(
    `cards/${c.slug}/back@2x.svg`,
    cardBackSvg(c),
  );
}

write("manufacturers/topps.svg", logoSvg("TOPPS", "#C8102E"));
write("manufacturers/panini.svg", logoSvg("PANINI", "#003DA5"));
write("clubs/real-madrid.svg", logoSvg("RMA", "#FEBE10"));
write("clubs/barcelona.svg", logoSvg("FCB", "#A50044"));
write("clubs/inter-miami.svg", logoSvg("MIA", "#F7B5CD"));
write("national-teams/argentina.svg", logoSvg("ARG", "#75AADB"));
write("national-teams/portugal.svg", logoSvg("POR", "#006600"));
write("national-teams/france.svg", logoSvg("FRA", "#002654"));
write("logos/draft-eleven.svg", logoSvg("D11", "#22A06B"));
write("logos/chrome-ucl.svg", logoSvg("CHROME", "#C8102E"));

write(
  "products/topps-chrome-ucl-2024-25.svg",
  productSvg("Chrome UCL 24/25", "#C8102E"),
);
write(
  "products/topps-chrome-ucl-2024-25-pack.svg",
  productSvg("Chrome Pack", "#C8102E"),
);
write(
  "products/topps-chrome-ucl-2024-25-box.svg",
  productSvg("Chrome Hobby Box", "#C8102E"),
);

console.log("Sample assets ready.");
