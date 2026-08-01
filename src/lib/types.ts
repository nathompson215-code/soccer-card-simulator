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
  parallelColor: string;
  foil: boolean;
  rarity: Rarity;
  cardType: CardType;
  printRun: number | null;
  estimatedValueCents: number;
  frontImageUrl: string | null;
  backImageUrl: string | null;
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
}

export interface PackResultDTO {
  packIndex: number;
  cards: PullResultDTO[];
}

export interface OwnedCardDTO {
  instanceId: string;
  cardId: string;
  productId: string;
  pulledAt: string;
  serialDisplay: string | null;
  card: CardDTO;
}
