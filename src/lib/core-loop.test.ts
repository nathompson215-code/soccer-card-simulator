import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { celebrationFor, isHit } from "@/lib/pack-engine";
import {
  assertPullCoreInvariants,
  classifyPullCard,
  sumPullValues,
} from "@/lib/core-loop";
import { resolveCardVisual } from "@/lib/card-visual";
import type { CardDTO, PackResultDTO, PullResultDTO } from "@/lib/types";
import {
  assignSerialFromId,
  formatPermanentSerial,
  buildUserCardPersistData,
  buildOpeningPullPersistData,
} from "@/lib/card-serial";

function baseCard(overrides: Partial<CardDTO> = {}): CardDTO {
  return {
    id: "card-1",
    slug: "demo-card",
    cardNumber: "1",
    subset: "base",
    subsetName: "Base",
    setType: "BASE",
    parallelId: "par-1",
    parallelName: "Base",
    parallelSlug: "base",
    parallelColor: "#E8E4D9",
    foil: false,
    rarity: "COMMON",
    cardType: "BASE",
    printRun: null,
    serialDisplay: null,
    estimatedValueCents: 100,
    frontImageUrl: null,
    backImageUrl: null,
    playerImageUrl: "/players/demo.jpg",
    productId: "prod-1",
    productSlug: "topps-chrome-ucl-2024-25",
    productName: "Topps Chrome UCL",
    productAccent: "#1b7a4e",
    year: 2024,
    manufacturerId: "mfr-1",
    manufacturerSlug: "topps",
    manufacturerName: "Topps",
    playerId: "player-1",
    playerSlug: "demo-player",
    playerName: "Demo Player",
    playerPosition: "MID",
    playerEra: "CURRENT",
    isRookie: false,
    clubName: "Demo Club",
    nationalTeamName: "Demo Nation",
    tournamentName: "UEFA Champions League",
    ...overrides,
  };
}

function makePull(card: CardDTO, overrides: Partial<PullResultDTO> = {}): PullResultDTO {
  return {
    card,
    serialDisplay: card.serialDisplay,
    isHit: isHit(card.rarity, card.cardType, card.printRun),
    celebration: celebrationFor(card.rarity, card.cardType, card.printRun),
    isNew: true,
    ...overrides,
  };
}

function fixturePulls(): Record<string, PullResultDTO> {
  const regular = makePull(
    baseCard({
      id: "regular",
      estimatedValueCents: 125,
      playerImageUrl: "/players/regular.jpg",
    }),
  );

  const numberedSerial = assignSerialFromId("numbered-slug", 25);
  const numbered = makePull(
    baseCard({
      id: "numbered",
      slug: "numbered-slug",
      cardType: "PARALLEL",
      parallelName: "Orange Refractor",
      parallelSlug: "orange",
      rarity: "RARE",
      printRun: 25,
      serialDisplay: formatPermanentSerial(numberedSerial, 25),
      estimatedValueCents: 3200,
      foil: true,
    }),
  );

  const oneOfOne = makePull(
    baseCard({
      id: "one-of-one",
      cardType: "ONE_OF_ONE",
      parallelName: "Superfractor",
      parallelSlug: "superfractor",
      rarity: "LEGENDARY",
      printRun: 1,
      serialDisplay: formatPermanentSerial(1, 1),
      estimatedValueCents: 500000,
      foil: true,
    }),
  );

  const autograph = makePull(
    baseCard({
      id: "autograph",
      cardType: "AUTOGRAPH",
      setType: "AUTOGRAPH",
      subset: "chrome-autographs",
      subsetName: "Chrome Autographs",
      parallelName: "Chrome Autograph",
      parallelSlug: "chrome-auto",
      rarity: "MYTHIC",
      estimatedValueCents: 18500,
      playerImageUrl: "/players/auto-star.jpg",
    }),
  );

  const booklet = makePull(
    baseCard({
      id: "booklet",
      cardType: "BOOKLET",
      setType: "BOOKLET",
      subset: "campeone-autograph-book",
      subsetName: "Campeone Autograph Book",
      parallelName: "Booklet",
      parallelSlug: "booklet",
      rarity: "LEGENDARY",
      printRun: 10,
      serialDisplay: formatPermanentSerial(assignSerialFromId("booklet-slug", 10), 10),
      estimatedValueCents: 75000,
      playerImageUrl: "/players/booklet-star.jpg",
    }),
  );

  return { regular, numbered, oneOfOne, autograph, booklet };
}

describe("core loop card-type coverage", () => {
  const fixtures = fixturePulls();

  it("classifies regular, autograph, booklet, numbered, and 1/1 pulls", () => {
    assert.equal(classifyPullCard(fixtures.regular.card), "regular");
    assert.equal(classifyPullCard(fixtures.autograph.card), "autograph");
    assert.equal(classifyPullCard(fixtures.booklet.card), "booklet");
    assert.equal(classifyPullCard(fixtures.numbered.card), "numbered");
    assert.equal(classifyPullCard(fixtures.oneOfOne.card), "one_of_one");
  });

  it("preserves regular card photos/pricing without serials", () => {
    const pull = fixtures.regular;
    assert.deepEqual(assertPullCoreInvariants(pull), []);
    const persist = buildUserCardPersistData("user", "product", pull);
    assert.equal(persist.serialDisplay, null);
    assert.equal(pull.card.playerImageUrl, "/players/regular.jpg");
    assert.equal(pull.card.estimatedValueCents, 125);
    assert.equal(resolveCardVisual(pull.card).template, "base");
  });

  it("preserves autograph signature overlay flags and hit celebration", () => {
    const pull = fixtures.autograph;
    assert.deepEqual(assertPullCoreInvariants(pull), []);
    const visual = resolveCardVisual(pull.card, pull.celebration);
    assert.equal(visual.template, "autograph");
    assert.equal(visual.showSignature, true);
    assert.equal(pull.celebration, "hit");
    assert.equal(pull.isHit, true);
    const history = buildOpeningPullPersistData(pull, 0, 0, "uc-auto");
    assert.equal(history.valueCentsAtOpen, 18500);
    assert.equal(history.isHit, true);
  });

  it("preserves booklet layout template and numbered booklet serial", () => {
    const pull = fixtures.booklet;
    assert.deepEqual(assertPullCoreInvariants(pull), []);
    assert.equal(resolveCardVisual(pull.card).template, "booklet");
    const persist = buildUserCardPersistData("user", "product", pull);
    assert.match(persist.serialDisplay ?? "", /^\d+\/10$/);
    assert.ok(persist.serialNumber && persist.serialNumber >= 1 && persist.serialNumber <= 10);
  });

  it("saves permanent numbered serials without ?/ placeholders", () => {
    const pull = fixtures.numbered;
    assert.deepEqual(assertPullCoreInvariants(pull), []);
    const persist = buildUserCardPersistData("user", "product", pull);
    assert.equal(persist.serialDisplay, pull.card.serialDisplay);
    assert.ok(persist.serialDisplay && !persist.serialDisplay.startsWith("?"));
    // Same catalog card always yields the same permanent serial.
    assert.equal(
      persist.serialDisplay,
      formatPermanentSerial(assignSerialFromId("numbered-slug", 25), 25),
    );
  });

  it("forces 1/1 display and jackpot celebration for one-of-ones", () => {
    const pull = fixtures.oneOfOne;
    assert.deepEqual(assertPullCoreInvariants(pull), []);
    assert.equal(pull.serialDisplay, "1/1");
    assert.equal(pull.celebration, "jackpot");
    assert.equal(resolveCardVisual(pull.card).template, "oneOfOne");
    const persist = buildOpeningPullPersistData(pull, 0, 3, null);
    assert.equal(persist.serialDisplay, "1/1");
    assert.equal(persist.serialNumber, 1);
  });

  it("updates opening total value from all pulled cards", () => {
    const packs: PackResultDTO[] = [
      {
        packIndex: 0,
        cards: [
          fixtures.regular,
          fixtures.numbered,
          fixtures.autograph,
          fixtures.booklet,
          fixtures.oneOfOne,
        ],
      },
    ];
    const expected =
      125 + 3200 + 18500 + 75000 + 500000;
    assert.equal(sumPullValues(packs), expected);

    const historyRows = packs[0].cards.map((p, slot) =>
      buildOpeningPullPersistData(p, 0, slot, `uc-${slot}`),
    );
    assert.equal(
      historyRows.reduce((s, row) => s + row.valueCentsAtOpen, 0),
      expected,
    );
  });
});
