import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";

export type PlayerTier = "common" | "veteran" | "star" | "rookie" | "legend";

export type HitPool =
  | "base"
  | "refractor"
  | "pulsar"
  | "numbered"
  | "insert"
  | "autograph"
  | "patch"
  | "booklet"
  | "case_hit";

export interface ProductBoxConfig {
  packsPerBox: number;
  cardsPerPack: number;
  boxesPerCase?: number;
  source?: string;
}

export interface GuaranteeConfig {
  id: string;
  label: string;
  count: number;
  pool: HitPool;
}

export interface ParallelConfig {
  slug: string;
  name: string;
  printRun: number | null;
  colorHex: string;
  isFoil: boolean;
  rarity: string;
  cardType: string;
  weight: number;
  pool: HitPool;
}

export interface ProductConfigFile {
  slug: string;
  name: string;
  description: string;
  year: number;
  season: string | null;
  releaseYear: number;
  format: string;
  accentHex: string;
  featured: boolean;
  manufacturer: {
    slug: string;
    name: string;
    foundedYear?: number;
    country?: string;
    colorHex?: string;
  };
  brand: { slug: string; name: string };
  tournament: { slug: string; name: string; type: string };
  box: ProductBoxConfig;
  guarantees: GuaranteeConfig[];
  fillOdds: {
    refractorChancePerSlot: number;
    bonusHitChancePerSlot: number;
    bonusHitWeights: Partial<Record<HitPool, number>>;
    notes?: string;
  };
  oddsLabels: Array<{
    label: string;
    scope: "PER_PACK" | "PER_BOX" | "PER_CASE";
    expectedCount: number;
  }>;
  singlePackApprox: {
    autographChance: number;
    insertChance: number;
    pulsarChance: number;
    numberedChance: number;
    refractorChance: number;
    patchChance: number;
    bookletChance: number;
    caseHitChance: number;
  };
}

export interface PlayersConfigFile {
  clubs: Array<{
    slug: string;
    name: string;
    country: string;
    league: string | null;
  }>;
  players: Array<{
    name: string;
    country: string;
    club: string;
    position: string;
    era: string;
    tier: PlayerTier;
    birthYear: number;
    pullWeight: number;
  }>;
}

export interface SetsConfigFile {
  baseParallels: ParallelConfig[];
  sets: Array<{
    slug: string;
    name: string;
    setType: string;
    sortOrder: number;
    playerFilter: {
      all?: boolean;
      tiers?: PlayerTier[];
      limit?: number;
    };
    parallels?: "baseParallels";
    parallel?: ParallelConfig;
    autograph?: boolean;
    memorabilia?: string;
  }>;
}

export interface LoadedProductConfig {
  dir: string;
  product: ProductConfigFile;
  players: PlayersConfigFile;
  sets: SetsConfigFile;
  playerWeightBySlug: Record<string, number>;
  playerTierBySlug: Record<string, PlayerTier>;
}

const DATA_ROOT = path.join(process.cwd(), "data", "products");

export function slugifyName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function listProductConfigSlugs(): string[] {
  if (!existsSync(DATA_ROOT)) return [];
  return readdirSync(DATA_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((slug) => existsSync(path.join(DATA_ROOT, slug, "product.json")));
}

export function loadProductConfig(slug: string): LoadedProductConfig | null {
  const dir = path.join(DATA_ROOT, slug);
  const productPath = path.join(dir, "product.json");
  if (!existsSync(productPath)) return null;

  const product = readJson<ProductConfigFile>(productPath);
  const players = readJson<PlayersConfigFile>(path.join(dir, "players.json"));
  const sets = readJson<SetsConfigFile>(path.join(dir, "sets.json"));

  const playerWeightBySlug: Record<string, number> = {};
  const playerTierBySlug: Record<string, PlayerTier> = {};
  for (const p of players.players) {
    const s = slugifyName(p.name);
    playerWeightBySlug[s] = p.pullWeight;
    playerTierBySlug[s] = p.tier;
  }

  return {
    dir,
    product,
    players,
    sets,
    playerWeightBySlug,
    playerTierBySlug,
  };
}
