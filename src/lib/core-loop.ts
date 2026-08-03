/**
 * Pack-open core loop helpers.
 *
 * Open pack → save UserCards (Neon) → permanent serials → opening history →
 * collection / total value. Card renderer files are out of scope here.
 *
 * See docs/PROTECTED_CARD_FEATURES.md.
 */

import { isAutographType, isBookletType, isOneOfOne } from "@/lib/achievements";
import { annotateNewPulls } from "@/lib/collection";
import { resolvePersistSerial } from "@/lib/card-serial";
import { resolveCardVisual } from "@/lib/card-visual";
import {
  getProductCollectionProgress,
  recordOpeningAndAchievements,
  savePullsToCollection,
} from "@/lib/pack-engine";
import type { CardDTO, PackResultDTO, PullResultDTO } from "@/lib/types";

export function sumPullValues(packs: PackResultDTO[]): number {
  return packs.reduce(
    (sum, pack) =>
      sum + pack.cards.reduce((s, pull) => s + pull.card.estimatedValueCents, 0),
    0,
  );
}

export type CardKind = "regular" | "autograph" | "booklet" | "numbered" | "one_of_one";

export function classifyPullCard(card: CardDTO): CardKind {
  if (isOneOfOne(card.cardType, card.printRun)) return "one_of_one";
  if (isBookletType(card.cardType, card.setType)) return "booklet";
  if (isAutographType(card.cardType)) return "autograph";
  if (card.printRun != null && card.printRun > 1) return "numbered";
  return "regular";
}

/**
 * Invariants the core loop must preserve for each pulled card.
 * Used by automated tests; does not touch renderer files.
 */
export function assertPullCoreInvariants(pull: PullResultDTO): string[] {
  const errors: string[] = [];
  const kind = classifyPullCard(pull.card);
  const serial = resolvePersistSerial(pull);
  const visual = resolveCardVisual(pull.card, pull.celebration);

  if (typeof pull.card.estimatedValueCents !== "number" || pull.card.estimatedValueCents < 0) {
    errors.push("estimatedValueCents must be a non-negative number");
  }

  if (kind === "one_of_one") {
    if (serial.serialDisplay !== "1/1" || serial.serialNumber !== 1) {
      errors.push(`1/1 cards must persist serial 1/1 (got ${serial.serialDisplay})`);
    }
    if (isBookletType(pull.card.cardType, pull.card.setType)) {
      if (visual.template !== "booklet") {
        errors.push(`booklet 1/1 must keep booklet layout (got ${visual.template})`);
      }
    } else if (visual.template !== "oneOfOne") {
      errors.push(`1/1 visual template unexpected: ${visual.template}`);
    }
  }

  if (kind === "numbered") {
    if (!serial.serialDisplay || !serial.serialNumber) {
      errors.push("numbered cards must persist a permanent serial");
    } else if (serial.serialDisplay.startsWith("?")) {
      errors.push("numbered cards must not use ?/ placeholders");
    } else if (pull.card.printRun && serial.serialNumber > pull.card.printRun) {
      errors.push("serial exceeds print run");
    }
  }

  if (kind === "regular") {
    if (serial.serialDisplay != null) {
      errors.push("regular (unnumbered) cards must not carry a serial");
    }
  }

  if (kind === "autograph") {
    if (!isAutographType(pull.card.cardType)) {
      errors.push("autograph classification mismatch");
    }
    if (
      visual.template !== "autograph" &&
      visual.template !== "patchAuto" &&
      visual.template !== "cutSignature"
    ) {
      errors.push(`autograph visual template unexpected: ${visual.template}`);
    }
    if (!visual.showSignature) {
      errors.push("autograph cards must keep signature overlay enabled");
    }
  }

  if (kind === "booklet") {
    if (visual.template !== "booklet") {
      errors.push(`booklet visual template unexpected: ${visual.template}`);
    }
  }

  return errors;
}

/**
 * Persist an already-generated open: collection rows, permanent serials,
 * opening history, then return updated collection progress + achievements.
 */
export async function persistOpenedPacks(params: {
  userId: string;
  productId: string;
  mode: "pack" | "box";
  packs: PackResultDTO[];
}) {
  const before = await getProductCollectionProgress(params.userId, params.productId);
  const packs = await annotateNewPulls(params.userId, params.packs);

  const userCardIds: string[] = [];
  for (const pack of packs) {
    const created = await savePullsToCollection(params.userId, params.productId, pack.cards);
    userCardIds.push(...created.map((row) => row.id));
  }

  const { newlyUnlocked, openingId } = await recordOpeningAndAchievements({
    userId: params.userId,
    productId: params.productId,
    mode: params.mode,
    packs,
    userCardIds,
  });

  const after = await getProductCollectionProgress(params.userId, params.productId);
  const totalValueCents = sumPullValues(packs);

  return {
    packs,
    userCardIds,
    openingId,
    newlyUnlocked,
    totalValueCents,
    collectionProgress: {
      ...after,
      newUniquesThisOpen: Math.max(0, after.uniqueOwned - before.uniqueOwned),
    },
  };
}
