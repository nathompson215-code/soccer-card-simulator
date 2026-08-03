import type {
  CardType,
  Position,
  ProductFormat,
  Rarity,
  SetType,
} from "@prisma/client";

export type {
  CardType,
  Position,
  ProductFormat,
  Rarity,
  SetType,
};

export type Celebration = "none" | "glow" | "foil" | "hit" | "jackpot";

/** Flat card DTO used by UI components. */
export interface CardDTO {
  id: string;
  slug: string;
  cardNumber: string;
  subset: string;
  subsetName: string;
  setType: SetType;
  parallelId: string;
  parallelName: string;
  parallelSlug: string;
  parallelColor: string;
  foil: boolean;
  rarity: Rarity;
  cardType: CardType;
  printRun: number | null;
  /** Permanent catalog serial display (e.g. 17/25). Set at card creation; never regenerated. */
  serialDisplay: string | null;
  estimatedValueCents: number;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  /** Resolved player photograph URL (card art or `/players/{slug}.*`). */
  playerImageUrl: string | null;
  productId: string;
  productSlug: string;
  productName: string;
  productAccent: string | null;
  year: number;
  manufacturerId: string;
  manufacturerSlug: string;
  manufacturerName: string;
  playerId: string;
  playerSlug: string;
  playerName: string;
  playerPosition: Position;
  playerEra: string;
  isRookie: boolean;
  clubName: string | null;
  nationalTeamName: string | null;
  tournamentName: string | null;
}

export interface ProductDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  year: number;
  season: string | null;
  releaseYear: number;
  format: ProductFormat;
  packsPerBox: number;
  cardsPerPack: number;
  accentHex: string | null;
  featured: boolean;
  manufacturer: { id: string; slug: string; name: string; colorHex: string | null };
  brand: { id: string; slug: string; name: string } | null;
  tournament: { id: string; slug: string; name: string } | null;
  league: { id: string; slug: string; name: string } | null;
  cardCount: number;
  oddsLabels: string[];
}

export interface PlayerDTO {
  id: string;
  slug: string;
  fullName: string;
  position: Position;
  era: string;
  birthYear: number | null;
  clubName: string | null;
  nationalTeamName: string | null;
  nationalityName: string | null;
  leagueName: string | null;
  cardCount: number;
}

export interface ManufacturerDTO {
  id: string;
  slug: string;
  name: string;
  foundedYear: number | null;
  country: string | null;
  colorHex: string | null;
  productCount: number;
}

export interface PullResultDTO {
  card: CardDTO;
  serialDisplay: string | null;
  isHit: boolean;
  celebration: Celebration;
  /** True when this pull is the collector's first copy of the card. */
  isNew?: boolean;
}

export interface PackResultDTO {
  packIndex: number;
  cards: PullResultDTO[];
}

export interface GuaranteeResultDTO {
  id: string;
  label: string;
  expected: number;
  actual: number;
}

export interface BoxSummaryDTO {
  totalCards: number;
  hitCount: number;
  rarityCounts: Record<string, number>;
  guarantees: GuaranteeResultDTO[];
  estimatedValueCents: number;
  topHits: PullResultDTO[];
}

export interface CollectionProgressDTO {
  productId: string;
  uniqueOwned: number;
  totalCatalog: number;
  completionPct: number;
  newUniquesThisOpen?: number;
}

export interface OwnedCardDTO {
  instanceId: string;
  cardId: string;
  productId: string;
  pulledAt: string;
  serialDisplay: string | null;
  card: CardDTO;
}

export interface CollectionEntryDTO {
  cardId: string;
  card: CardDTO;
  copyCount: number;
  firstPulledAt: string | null;
  lastPulledAt: string | null;
  serialDisplays: string[];
  isNew: boolean;
  isFavorite: boolean;
  isOwned: boolean;
}

export interface CompletionBucketDTO {
  id: string;
  name: string;
  owned: number;
  total: number;
  pct: number;
  kind: "overall" | "product" | "insert_set";
  productId?: string;
  productSlug?: string;
  setSlug?: string;
}

export interface CollectionStatsDTO {
  totalOwned: number;
  uniqueOwned: number;
  duplicateCards: number;
  totalEstimatedValueCents: number;
  productsCompleted: number;
  productsTotal: number;
  completionPct: number;
  topValuable: CollectionEntryDTO[];
  recentPulls: OwnedCardDTO[];
}

export type CollectionSort =
  | "newest"
  | "oldest"
  | "value_high"
  | "value_low"
  | "rarity"
  | "player"
  | "club"
  | "card_number";

export interface CollectionFilterOptions {
  players: string[];
  clubs: string[];
  nations: string[];
  products: Array<{ slug: string; name: string; year: number }>;
  years: number[];
  rarities: Rarity[];
  insertSets: Array<{ slug: string; name: string; productSlug: string }>;
}

export interface CardCollectionDetailDTO {
  card: CardDTO;
  isFavorite: boolean;
  isWishlisted: boolean;
  ownershipCount: number;
  isNew: boolean;
  pullHistory: Array<{
    instanceId: string;
    pulledAt: string;
    serialDisplay: string | null;
  }>;
  latestSerialDisplay: string | null;
}

export type OpeningModeDTO = "pack" | "box";

export interface OpeningPullDTO {
  id: string;
  packIndex: number;
  slotIndex: number;
  serialDisplay: string | null;
  valueCentsAtOpen: number;
  isHit: boolean;
  celebration: Celebration;
  isNew: boolean;
  card: CardDTO;
}

export interface OpeningDTO {
  id: string;
  mode: OpeningModeDTO;
  openedAt: string;
  packCount: number;
  cardCount: number;
  totalValueCents: number;
  biggestHitValueCents: number;
  product: {
    id: string;
    slug: string;
    name: string;
    accentHex: string | null;
    year: number;
  };
  biggestHit: OpeningPullDTO | null;
  pulls: OpeningPullDTO[];
}

export interface AchievementDTO {
  key: string;
  title: string;
  description: string;
  mark: string;
  unlocked: boolean;
  unlockedAt: string | null;
  metaJson: string | null;
}

export interface LifetimeStatsDTO {
  packsOpened: number;
  boxesOpened: number;
  totalCardsPulled: number;
  uniqueCardsOwned: number;
  autographsPulled: number;
  numberedCardsPulled: number;
  bookletsPulled: number;
  oneOfOnesPulled: number;
  estimatedCollectionValueCents: number;
  bestPull: OpeningPullDTO | null;
  bestValueOpening: OpeningDTO | null;
  biggestHitOpening: OpeningDTO | null;
}

export interface ProgressionDTO {
  stats: LifetimeStatsDTO;
  achievements: AchievementDTO[];
  openings: OpeningDTO[];
  newlyUnlocked?: AchievementDTO[];
}
