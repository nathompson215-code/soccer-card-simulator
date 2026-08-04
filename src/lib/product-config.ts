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
  visualTheme?: string;
}

export interface SetConfig {
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
  /** Single parallel (legacy / simple inserts). Prefer setParallels for rainbows. */
  parallel?: ParallelConfig;
  /** Multiple parallels for an insert/auto set (base + numbered rainbow, etc.). */
  setParallels?: ParallelConfig[];
  autograph?: boolean;
  memorabilia?: string | null;
  visualTheme?: string;
  pool?: HitPool;
  insertWeight?: number;
  notes?: string;
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
  /** Optional product-page highlight tiles: [title, subtitle][] */
  boxHighlights?: Array<[string, string]>;
  /** Optional domestic league link (e.g. Premier League products). */
  league?: { slug: string; name: string };
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
  sets: SetConfig[];
}

export interface LoadedProductConfig {
  dir: string;
  product: ProductConfigFile;
  players: PlayersConfigFile;
  sets: SetsConfigFile;
  playerWeightBySlug: Record<string, number>;
  playerTierBySlug: Record<string, PlayerTier>;
  parallelPoolBySlug: Record<string, HitPool>;
  setPoolBySlug: Record<string, HitPool>;
  setInsertWeightBySlug: Record<string, number>;
  setThemeBySlug: Record<string, string>;
  parallelThemeBySlug: Record<string, string>;
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

  const parallelPoolBySlug: Record<string, HitPool> = {};
  const parallelThemeBySlug: Record<string, string> = {};
  for (const p of sets.baseParallels) {
    parallelPoolBySlug[p.slug] = p.pool;
    if (p.visualTheme) parallelThemeBySlug[p.slug] = p.visualTheme;
  }

  const setPoolBySlug: Record<string, HitPool> = {};
  const setInsertWeightBySlug: Record<string, number> = {};
  const setThemeBySlug: Record<string, string> = {};
  for (const s of sets.sets) {
    if (s.pool) setPoolBySlug[s.slug] = s.pool;
    const setPars = s.setParallels?.length
      ? s.setParallels
      : s.parallel
        ? [s.parallel]
        : [];
    for (const par of setPars) {
      // Keyed by set+parallel so shared slugs like "insert-base" don't collide
      if (par.pool) parallelPoolBySlug[`${s.slug}:${par.slug}`] = par.pool;
      if (par.visualTheme) parallelThemeBySlug[`${s.slug}:${par.slug}`] = par.visualTheme;
    }
    if (typeof s.insertWeight === "number") setInsertWeightBySlug[s.slug] = s.insertWeight;
    if (s.visualTheme) setThemeBySlug[s.slug] = s.visualTheme;
  }

  return {
    dir,
    product,
    players,
    sets,
    playerWeightBySlug,
    playerTierBySlug,
    parallelPoolBySlug,
    setPoolBySlug,
    setInsertWeightBySlug,
    setThemeBySlug,
    parallelThemeBySlug,
  };
}
