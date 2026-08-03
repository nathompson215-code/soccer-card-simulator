import type { CardType } from "@prisma/client";

export const AUTOGRAPH_CARD_TYPES: CardType[] = [
  "AUTOGRAPH",
  "DUAL_AUTOGRAPH",
  "TRIPLE_AUTOGRAPH",
  "QUAD_AUTOGRAPH",
];

export const COLLECTION_MILESTONES = [10, 50, 100, 250, 500, 1000] as const;

export type AchievementKey =
  | "first_autograph"
  | "first_numbered"
  | "first_booklet"
  | "first_one_of_one"
  | "complete_base_set"
  | `collection_${(typeof COLLECTION_MILESTONES)[number]}`;

export type AchievementDefinition = {
  key: AchievementKey;
  title: string;
  description: string;
  /** Short non-emoji mark shown in UI badges */
  mark: string;
};

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    key: "first_autograph",
    title: "Ink Debut",
    description: "Pull your first autograph card.",
    mark: "AUTO",
  },
  {
    key: "first_numbered",
    title: "Serial Hunter",
    description: "Pull your first numbered card.",
    mark: "#",
  },
  {
    key: "first_booklet",
    title: "Booklet Breaker",
    description: "Pull your first booklet card.",
    mark: "BKLT",
  },
  {
    key: "first_one_of_one",
    title: "One of One",
    description: "Pull a true 1/1.",
    mark: "1/1",
  },
  {
    key: "complete_base_set",
    title: "Base Set Complete",
    description: "Own every card in a product base set.",
    mark: "BASE",
  },
  ...COLLECTION_MILESTONES.map((n) => ({
    key: `collection_${n}` as AchievementKey,
    title: n >= 1000 ? `${n / 1000}k Unique` : `${n} Unique`,
    description: `Own ${n} unique cards in your collection.`,
    mark: String(n),
  })),
];

export const ACHIEVEMENT_BY_KEY = Object.fromEntries(
  ACHIEVEMENT_DEFINITIONS.map((d) => [d.key, d]),
) as Record<AchievementKey, AchievementDefinition>;

export function isAutographType(cardType: CardType | string) {
  return AUTOGRAPH_CARD_TYPES.includes(cardType as CardType);
}

export function isBookletType(cardType: CardType | string, setType?: string) {
  return cardType === "BOOKLET" || setType === "BOOKLET";
}

export function isOneOfOne(cardType: CardType | string, printRun: number | null) {
  return printRun === 1 || cardType === "ONE_OF_ONE";
}

export function milestoneKey(n: number): AchievementKey {
  return `collection_${n}` as AchievementKey;
}
