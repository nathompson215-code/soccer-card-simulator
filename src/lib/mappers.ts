import type {
  Brand,
  Card,
  CardSet,
  ChecklistEntry,
  Club,
  League,
  Manufacturer,
  NationalTeam,
  NumberingSpec,
  Parallel,
  Player,
  Product,
  Tournament,
} from "@prisma/client";
import type { CardDTO, ProductDTO } from "@/lib/types";

type CardWithRelations = Card & {
  numbering: NumberingSpec | null;
  parallel: Parallel;
  checklistEntry: ChecklistEntry & {
    cardSet: CardSet & {
      product: Product & {
        manufacturer: Manufacturer;
        tournament: Tournament | null;
      };
    };
    player: Player & {
      club: Club | null;
      nationalTeam: NationalTeam | null;
    };
  };
};

export function toCardDTO(card: CardWithRelations): CardDTO {
  const { checklistEntry, parallel } = card;
  const { cardSet, player } = checklistEntry;
  const { product } = cardSet;

  return {
    id: card.id,
    slug: card.slug,
    cardNumber: checklistEntry.cardNumber,
    subset: cardSet.slug,
    subsetName: cardSet.name,
    setType: cardSet.setType,
    parallelId: parallel.id,
    parallelName: parallel.name,
    parallelColor: parallel.colorHex ?? "#E8E4D9",
    foil: parallel.isFoil,
    rarity: parallel.rarity,
    cardType: parallel.cardType,
    printRun: card.numbering?.printRun ?? parallel.printRun,
    estimatedValueCents: card.estimatedValueCents,
    frontImageUrl: card.frontImageUrl,
    backImageUrl: card.backImageUrl,
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    productAccent: product.accentHex,
    year: product.year,
    manufacturerId: product.manufacturer.id,
    manufacturerSlug: product.manufacturer.slug,
    manufacturerName: product.manufacturer.name,
    playerId: player.id,
    playerSlug: player.slug,
    playerName: player.fullName,
    playerPosition: player.position,
    clubName: player.club?.name ?? null,
    nationalTeamName: player.nationalTeam?.name ?? null,
    tournamentName: product.tournament?.name ?? null,
  };
}

export const cardInclude = {
  numbering: true,
  parallel: true,
  checklistEntry: {
    include: {
      cardSet: {
        include: {
          product: {
            include: {
              manufacturer: true,
              tournament: true,
            },
          },
        },
      },
      player: {
        include: {
          club: true,
          nationalTeam: true,
        },
      },
    },
  },
} as const;

type ProductWithRelations = Product & {
  manufacturer: Manufacturer;
  brand: Brand | null;
  tournament: Tournament | null;
  league: League | null;
  oddsRules: { label: string; scope: string; expectedCount: number }[];
  _count?: { sets?: number };
  cardCount?: number;
};

export function toProductDTO(
  product: ProductWithRelations,
  cardCount: number,
): ProductDTO {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    year: product.year,
    season: product.season,
    releaseYear: product.releaseYear,
    format: product.format,
    packsPerBox: product.packsPerBox,
    cardsPerPack: product.cardsPerPack,
    accentHex: product.accentHex,
    featured: product.featured,
    manufacturer: {
      id: product.manufacturer.id,
      slug: product.manufacturer.slug,
      name: product.manufacturer.name,
      colorHex: product.manufacturer.colorHex,
    },
    brand: product.brand
      ? {
          id: product.brand.id,
          slug: product.brand.slug,
          name: product.brand.name,
        }
      : null,
    tournament: product.tournament
      ? {
          id: product.tournament.id,
          slug: product.tournament.slug,
          name: product.tournament.name,
        }
      : null,
    league: product.league
      ? {
          id: product.league.id,
          slug: product.league.slug,
          name: product.league.name,
        }
      : null,
    cardCount,
    oddsLabels: product.oddsRules.map(
      (rule) =>
        `~${rule.expectedCount} ${rule.label.toLowerCase()} (${rule.scope.replaceAll("_", " ").toLowerCase()})`,
    ),
  };
}
