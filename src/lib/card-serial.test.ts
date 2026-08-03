import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignSerialFromId,
  buildOpeningPullPersistData,
  buildUserCardPersistData,
  formatPermanentSerial,
  parseSerialDisplay,
  resolvePersistSerial,
} from "@/lib/card-serial";
import type { CardDTO, PullResultDTO } from "@/lib/types";

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
    parallelColor: "#fff",
    foil: false,
    rarity: "COMMON",
    cardType: "BASE",
    printRun: null,
    serialDisplay: null,
    estimatedValueCents: 150,
    frontImageUrl: null,
    backImageUrl: null,
    playerImageUrl: "/players/demo.jpg",
    productId: "prod-1",
    productSlug: "demo-product",
    productName: "Demo Product",
    productAccent: "#1b7a4e",
    year: 2024,
    manufacturerId: "mfr-1",
    manufacturerSlug: "topps",
    manufacturerName: "Topps",
    playerId: "player-1",
    playerSlug: "demo-player",
    playerName: "Demo Player",
    playerPosition: "FWD",
    playerEra: "CURRENT",
    isRookie: false,
    clubName: "Demo Club",
    nationalTeamName: null,
    tournamentName: null,
    ...overrides,
  };
}

function pull(card: CardDTO, serialDisplay: string | null = card.serialDisplay): PullResultDTO {
  return {
    card,
    serialDisplay,
    isHit: false,
    celebration: "none",
    isNew: true,
  };
}

describe("permanent serial helpers", () => {
  it("assigns stable serials in 1..printRun and forces 1 for 1/1", () => {
    assert.equal(assignSerialFromId("slug-a", 1), 1);
    const a = assignSerialFromId("slug-a", 25);
    const b = assignSerialFromId("slug-a", 25);
    assert.equal(a, b);
    assert.ok(a >= 1 && a <= 25);
  });

  it("formats permanent serials and forces 1/1", () => {
    assert.equal(formatPermanentSerial(17, 25), "17/25");
    assert.equal(formatPermanentSerial(null, 1), "1/1");
    assert.equal(formatPermanentSerial(99, 25), null);
    assert.equal(formatPermanentSerial(3, null), null);
  });

  it("rejects ?/ placeholders when parsing", () => {
    assert.deepEqual(parseSerialDisplay("?/25"), {
      serialNumber: null,
      serialDisplay: null,
    });
    assert.deepEqual(parseSerialDisplay("1/1"), {
      serialNumber: 1,
      serialDisplay: "1/1",
    });
    assert.deepEqual(parseSerialDisplay("7/10"), {
      serialNumber: 7,
      serialDisplay: "7/10",
    });
  });
});

describe("core loop serial persistence payloads", () => {
  it("regular cards persist without serials", () => {
    const data = buildUserCardPersistData("u1", "p1", pull(baseCard()));
    assert.equal(data.serialNumber, null);
    assert.equal(data.serialDisplay, null);
    assert.equal(data.cardId, "card-1");
  });

  it("numbered cards persist permanent serials", () => {
    const card = baseCard({
      printRun: 25,
      serialDisplay: "17/25",
      rarity: "RARE",
      cardType: "PARALLEL",
      parallelName: "Orange Refractor",
      parallelSlug: "orange",
      estimatedValueCents: 4500,
    });
    const data = buildUserCardPersistData("u1", "p1", pull(card, "17/25"));
    assert.equal(data.serialNumber, 17);
    assert.equal(data.serialDisplay, "17/25");
  });

  it("1/1 cards always persist 1/1 even if pull serial was dropped", () => {
    const card = baseCard({
      printRun: 1,
      serialDisplay: "1/1",
      rarity: "LEGENDARY",
      cardType: "ONE_OF_ONE",
      parallelName: "Superfractor",
      parallelSlug: "superfractor",
      estimatedValueCents: 250000,
    });
    const data = buildOpeningPullPersistData(pull(card, null), 0, 1, "uc-1");
    assert.equal(data.serialNumber, 1);
    assert.equal(data.serialDisplay, "1/1");
    assert.equal(data.valueCentsAtOpen, 250000);
  });

  it("falls back to catalog serialDisplay on the card DTO", () => {
    const card = baseCard({
      printRun: 10,
      serialDisplay: "3/10",
      rarity: "ULTRA_RARE",
      cardType: "PARALLEL",
    });
    const resolved = resolvePersistSerial(pull(card, null));
    assert.equal(resolved.serialDisplay, "3/10");
    assert.equal(resolved.serialNumber, 3);
  });

  it("autograph and booklet pulls keep value and identity fields for history", () => {
    const auto = buildOpeningPullPersistData(
      {
        ...pull(
          baseCard({
            id: "auto-1",
            cardType: "AUTOGRAPH",
            setType: "AUTOGRAPH",
            subset: "chrome-auto",
            subsetName: "Chrome Autograph",
            rarity: "MYTHIC",
            estimatedValueCents: 12000,
            playerImageUrl: "/players/star.jpg",
          }),
        ),
        isHit: true,
        celebration: "hit",
      },
      2,
      0,
      null,
    );
    assert.equal(auto.cardId, "auto-1");
    assert.equal(auto.valueCentsAtOpen, 12000);
    assert.equal(auto.isHit, true);
    assert.equal(auto.celebration, "hit");
    assert.equal(auto.packIndex, 2);

    const booklet = buildUserCardPersistData(
      "u1",
      "p1",
      pull(
        baseCard({
          id: "bk-1",
          cardType: "BOOKLET",
          setType: "BOOKLET",
          subset: "campeone",
          subsetName: "Campeone Autograph Book",
          rarity: "LEGENDARY",
          printRun: 25,
          serialDisplay: "8/25",
          estimatedValueCents: 40000,
        }),
        "8/25",
      ),
    );
    assert.equal(booklet.serialDisplay, "8/25");
    assert.equal(booklet.serialNumber, 8);
  });
});
