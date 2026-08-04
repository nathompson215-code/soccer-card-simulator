/**
 * Download real player photographs into public/players/{slug}.jpg
 * using English Wikipedia page images (Wikimedia Commons thumbs).
 *
 * These are development photographs — replace with licensed Topps/Panini
 * (or other authorized) assets using the same filenames when available.
 *
 * Usage: npx tsx scripts/fetch-player-photos.ts
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import {
  listProductConfigSlugs,
  loadProductConfig,
  slugifyName,
} from "../src/lib/product-config";

const UA = "DraftElevenBot/1.0 (soccer-card-simulator; local-dev photo fetch)";
const OUT_DIR = path.join(process.cwd(), "public", "players");

type PlayerRow = { name: string };

/**
 * Every seeded player across ALL product configs (Topps Chrome, Panini Prizm,
 * and any future product), deduped by the same `slugifyName` used by the seed
 * and the runtime photo resolver. This keeps the entire checklist — not just
 * one product — mapped to `/players/{slug}.jpg` through the identical pipeline.
 */
function loadSeededPlayers(): PlayerRow[] {
  const bySlug = new Map<string, PlayerRow>();
  for (const slug of listProductConfigSlugs()) {
    const cfg = loadProductConfig(slug);
    if (!cfg) continue;
    for (const player of cfg.players.players) {
      const playerSlug = slugifyName(player.name);
      if (!bySlug.has(playerSlug)) bySlug.set(playerSlug, { name: player.name });
    }
  }
  return [...bySlug.values()];
}

/** Manual Wikipedia title overrides when the common name is ambiguous. */
const WIKI_TITLE: Record<string, string> = {
  pedri: "Pedri",
  gavi: "Gavi (footballer)",
  rodri: "Rodri (footballer, born 1996)",
  ederson: "Ederson (footballer, born 1993)",
  raphinha: "Raphinha",
  "vinicius-junior": "Vinícius Júnior",
  "kylian-mbappe": "Kylian Mbappé",
  "martin-degaard": "Martin Ødegaard",
  "joao-neves": "João Neves",
  "alvaro-morata": "Álvaro Morata",
  "antonio-rudiger": "Antonio Rüdiger",
  "warren-zaire-emery": "Warren Zaïre-Emery",
  "ilkay-gundogan": "İlkay Gündoğan",
  "lautaro-martinez": "Lautaro Martínez",
  "rafael-leao": "Rafael Leão",
  "arda-guler": "Arda Güler",
  "ousmane-dembele": "Ousmane Dembélé",
  "theo-hernandez": "Théo Hernandez",
  "nicolo-barella": "Nicolò Barella",
  "dusan-vlahovic": "Dušan Vlahović",
  "angel-di-maria": "Ángel Di María",
  "darwin-nunez": "Darwin Núñez",
  "son-heung-min": "Son Heung-min",
  "julian-alvarez": "Julián Alvarez",
  "pablo-barrios": "Pablo Barrios (footballer)",
  "josko-gvardiol": "Joško Gvardiol",
  // Panini Prizm Premier League additions (accents / disambiguation titles)
  "jeremy-doku": "Jérémy Doku",
  "alisson-becker": "Alisson Becker",
  "reece-james": "Reece James",
  "enzo-fernandez": "Enzo Fernández",
  "bruno-guimaraes": "Bruno Guimarães",
  "andre-onana": "André Onana",
  "luis-diaz": "Luis Díaz (footballer, born 1997)",
  "moises-caicedo": "Moisés Caicedo",
  "emiliano-martinez": "Emiliano Martínez",
  "joao-pedro": "João Pedro (footballer, born 2001)",
  "joao-palhinha": "João Palhinha",
  "pedro-neto": "Pedro Neto",
  "lucas-paqueta": "Lucas Paquetá",
  "rasmus-h-jlund": "Rasmus Højlund",
};

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function wikiThumbnail(title: string): Promise<string | null> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", title);
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("format", "json");
  url.searchParams.set("pithumbsize", "960");
  url.searchParams.set("pilicense", "any");

  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) return null;
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { thumbnail?: { source?: string }; missing?: string }> };
  };
  const pages = data.query?.pages ?? {};
  for (const page of Object.values(pages)) {
    if (page.missing !== undefined) continue;
    if (page.thumbnail?.source) return page.thumbnail.source;
  }
  return null;
}

async function downloadPhoto(imageUrl: string, destPath: string) {
  const res = await fetch(imageUrl, { headers: { "User-Agent": UA } });
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) throw new Error(`download failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      const msg = err instanceof Error ? err.message : String(err);
      const backoff = msg.includes("rate_limited") || msg.includes("429") ? 2500 * (i + 1) : 400 * (i + 1);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw last;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const players = loadSeededPlayers();
  let ok = 0;
  let skip = 0;
  let miss = 0;

  for (const player of players) {
    const slug = slugifyName(player.name);
    const dest = path.join(OUT_DIR, `${slug}.jpg`);
    if (await fileExists(dest)) {
      skip += 1;
      console.log(`skip ${slug} (exists)`);
      continue;
    }

    const title = WIKI_TITLE[slug] ?? player.name;
    try {
      const thumb = await withRetry(() => wikiThumbnail(title));
      if (!thumb) {
        miss += 1;
        console.log(`miss ${slug} (${title})`);
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      await withRetry(() => downloadPhoto(thumb, dest));
      ok += 1;
      console.log(`ok   ${slug}`);
      await new Promise((r) => setTimeout(r, 350));
    } catch (err) {
      miss += 1;
      console.log(`fail ${slug}:`, err instanceof Error ? err.message : err);
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  // Keep directory tracked even if empty in other clones
  const keep = path.join(OUT_DIR, ".gitkeep");
  if (!(await fileExists(keep))) {
    await writeFile(keep, "", "utf8");
  }

  console.log(`Done. downloaded=${ok} skipped=${skip} missing=${miss} total=${players.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
