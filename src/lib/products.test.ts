import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  listProductConfigSlugs,
  loadProductConfig,
  type HitPool,
  type LoadedProductConfig,
} from "@/lib/product-config";
import {
  assignSerialFromId,
  formatPermanentSerial,
  buildUserCardPersistData,
} from "@/lib/card-serial";
import { resolveVisualTheme, getThemeSpec } from "@/lib/visual-themes";
import { celebrationFor, isHit } from "@/lib/pack-engine";
import { resolveCardVisual } from "@/lib/card-visual";
import type { CardDTO, PullResultDTO } from "@/lib/types";

const TOPPS = "topps-chrome-ucl-2024-25";
const PRIZM = "panini-prizm-premier-league-2023-24";

function assertProductShape(cfg: LoadedProductConfig) {
  const p = cfg.product;
  assert.ok(p.slug);
  assert.ok(p.manufacturer.slug);
  assert.ok(p.brand.slug);
  assert.ok(p.box.packsPerBox > 0);
  assert.ok(p.box.cardsPerPack > 0);
  assert.ok(p.guarantees.length > 0);
  assert.ok(p.oddsLabels.length > 0);
  assert.ok(cfg.players.players.length > 0);
  assert.ok(cfg.sets.baseParallels.length > 0);
  assert.ok(cfg.sets.sets.length > 0);
  assert.ok(cfg.sets.sets.some((s) => s.slug === "base"));
  assert.ok(cfg.sets.sets.some((s) => s.autograph || s.pool === "autograph"));
}

function numberedFromConfig(cfg: LoadedProductConfig) {
  return cfg.sets.baseParallels.filter((p) => p.printRun != null && p.printRun > 0);
}

function makeCard(overrides: Partial<CardDTO>): CardDTO {
  return {
    id: "c1",
    slug: "card",
    cardNumber: "1",
    subset: "base",
    subsetName: "Base",
    setType: "BASE",
    parallelId: "p1",
    parallelName: "Base",
    parallelSlug: "base",
    parallelColor: "#fff",
    foil: false,
    rarity: "COMMON",
    cardType: "BASE",
    printRun: null,
    serialDisplay: null,
    estimatedValueCents: 100,
    frontImageUrl: null,
    backImageUrl: null,
    playerImageUrl: "/players/erling-haaland.jpg",
    productId: "prod",
    productSlug: TOPPS,
    productName: "Demo",
    productAccent: "#000",
    year: 2024,
    manufacturerId: "m",
    manufacturerSlug: "topps",
    manufacturerName: "Topps",
    playerId: "pl",
    playerSlug: "erling-haaland",
    playerName: "Erling Haaland",
    playerPosition: "FWD",
    playerEra: "CURRENT",
    isRookie: false,
    clubName: "Manchester City",
    nationalTeamName: null,
    tournamentName: null,
    ...overrides,
  };
}

describe("multi-product catalog configs", () => {
  it("lists both Topps Chrome and Panini Prizm product folders", () => {
    const slugs = listProductConfigSlugs();
    assert.ok(slugs.includes(TOPPS));
    assert.ok(slugs.includes(PRIZM));
  });

  it("loads Topps Chrome with Topps manufacturer and Chrome brand", () => {
    const cfg = loadProductConfig(TOPPS);
    assert.ok(cfg);
    assertProductShape(cfg!);
    assert.equal(cfg!.product.manufacturer.slug, "topps");
    assert.equal(cfg!.product.brand.slug, "chrome-ucl");
    assert.equal(cfg!.product.box.packsPerBox, 20);
    assert.equal(cfg!.product.box.cardsPerPack, 4);
    assert.deepEqual(
      cfg!.product.guarantees.map((g) => [g.id, g.count, g.pool]),
      [
        ["autograph", 1, "autograph"],
        ["numbered", 3, "numbered"],
        ["pulsar", 3, "pulsar"],
        ["insert", 9, "insert"],
      ],
    );
  });

  it("loads Prizm with Panini manufacturer and Prizm brand", () => {
    const cfg = loadProductConfig(PRIZM);
    assert.ok(cfg);
    assertProductShape(cfg!);
    assert.equal(cfg!.product.manufacturer.slug, "panini");
    assert.equal(cfg!.product.manufacturer.name, "Panini");
    assert.equal(cfg!.product.brand.slug, "prizm-premier-league");
    assert.equal(cfg!.product.brand.name, "Prizm");
    assert.equal(cfg!.product.box.packsPerBox, 12);
    assert.equal(cfg!.product.box.cardsPerPack, 12);
    assert.equal(cfg!.product.league?.slug, "premier-league");
    assert.deepEqual(
      cfg!.product.guarantees.map((g) => [g.id, g.count, g.pool]),
      [
        ["autograph", 1, "autograph"],
        ["silver", 4, "refractor"],
        ["numbered", 5, "numbered"],
        ["prizm", 8, "pulsar"],
        ["insert", 6, "insert"],
      ],
    );
  });

  it("keeps Topps and Prizm checklist data in separate product folders", () => {
    const topps = loadProductConfig(TOPPS)!;
    const prizm = loadProductConfig(PRIZM)!;
    assert.notEqual(topps.dir, prizm.dir);
    assert.ok(topps.sets.sets.some((s) => s.slug === "wonderkids"));
    assert.ok(prizm.sets.sets.some((s) => s.slug === "brilliance"));
    assert.ok(!prizm.sets.sets.some((s) => s.slug === "wonderkids"));
    assert.ok(!topps.sets.sets.some((s) => s.slug === "brilliance"));
  });

  it("assigns permanent serials for numbered and 1/1 cards in both products", () => {
    for (const slug of [TOPPS, PRIZM]) {
      const cfg = loadProductConfig(slug)!;
      const numbered = numberedFromConfig(cfg);
      assert.ok(numbered.length > 0, `${slug} should have numbered parallels`);

      const sample = numbered.find((p) => (p.printRun ?? 0) > 1)!;
      const oneOfOne = numbered.find((p) => p.printRun === 1)!;
      assert.ok(sample, `${slug} needs a multi-print numbered parallel`);
      assert.ok(oneOfOne, `${slug} needs a 1/1 parallel`);

      const cardSlug = `${slug}__base__1__${sample.slug}`;
      const serial = assignSerialFromId(cardSlug, sample.printRun!);
      const display = formatPermanentSerial(serial, sample.printRun!);
      assert.ok(display);
      assert.match(display!, /^\d+\/\d+$/);
      assert.ok(!display!.startsWith("?"));
      const [n, run] = display!.split("/").map(Number);
      assert.ok(n >= 1 && n <= run);
      assert.equal(run, sample.printRun);

      assert.equal(formatPermanentSerial(1, 1), "1/1");
      assert.equal(
        formatPermanentSerial(assignSerialFromId(`${slug}__1of1`, 1), 1),
        "1/1",
      );
    }
  });

  it("wires Prizm pools for silver, inserts, autos, memorabilia, and case hits", () => {
    const cfg = loadProductConfig(PRIZM)!;
    assert.equal(cfg.parallelPoolBySlug.silver, "refractor");
    assert.equal(cfg.parallelPoolBySlug.hyper, "pulsar");
    assert.equal(cfg.parallelPoolBySlug.gold, "numbered");
    assert.equal(cfg.setPoolBySlug.brilliance, "insert");
    assert.equal(cfg.setPoolBySlug.signatures, "autograph");
    assert.equal(cfg.setPoolBySlug["color-blast"], "case_hit");
    assert.equal(cfg.setPoolBySlug["prizm-patches"], "patch");

    const pools = new Set<HitPool>();
    for (const v of Object.values(cfg.parallelPoolBySlug)) pools.add(v);
    for (const v of Object.values(cfg.setPoolBySlug)) pools.add(v);
    for (const required of ["base", "refractor", "pulsar", "numbered", "insert", "autograph", "patch", "case_hit"] as HitPool[]) {
      assert.ok(pools.has(required), `missing pool ${required}`);
    }
  });

  it("resolves Prizm-specific visual themes without breaking Topps themes", () => {
    assert.equal(resolveVisualTheme("base", "refractor"), "refractor");
    assert.equal(resolveVisualTheme("wonderkids", "insert-base"), "wonderkids");
    assert.equal(getThemeSpec("refractor").reveal, "chrome");

    assert.equal(resolveVisualTheme("base", "silver"), "prizm-silver");
    assert.equal(resolveVisualTheme("brilliance", "insert-base"), "prizm-brilliance");
    assert.equal(resolveVisualTheme("signatures", "auto-base"), "prizm-signatures");
    assert.equal(resolveVisualTheme("color-blast", "case-base"), "prizm-color-blast");
    assert.equal(getThemeSpec("prizm-silver").reveal, "chrome");
    assert.equal(getThemeSpec("prizm-manga").celebrationBoost, "jackpot");
  });

  it("preserves autograph signature overlay + pricing for both product card shapes", () => {
    const toppsAuto: PullResultDTO = {
      card: makeCard({
        productSlug: TOPPS,
        manufacturerSlug: "topps",
        manufacturerName: "Topps",
        cardType: "AUTOGRAPH",
        setType: "AUTOGRAPH",
        subset: "chrome-autographs",
        subsetName: "Chrome Autographs",
        parallelSlug: "chrome-auto",
        parallelName: "Chrome Autograph",
        rarity: "MYTHIC",
        estimatedValueCents: 18500,
      }),
      serialDisplay: null,
      isHit: true,
      celebration: "hit",
    };
    const prizmAuto: PullResultDTO = {
      card: makeCard({
        productSlug: PRIZM,
        productName: "Prizm PL",
        manufacturerSlug: "panini",
        manufacturerName: "Panini",
        cardType: "AUTOGRAPH",
        setType: "AUTOGRAPH",
        subset: "signatures",
        subsetName: "Signatures",
        parallelSlug: "auto-base",
        parallelName: "Signatures",
        rarity: "MYTHIC",
        estimatedValueCents: 21000,
        year: 2024,
      }),
      serialDisplay: null,
      isHit: true,
      celebration: celebrationFor("MYTHIC", "AUTOGRAPH", null),
    };

    for (const pull of [toppsAuto, prizmAuto]) {
      assert.equal(isHit(pull.card.rarity, pull.card.cardType, pull.card.printRun), true);
      const visual = resolveCardVisual(pull.card, pull.celebration);
      assert.equal(visual.template, "autograph");
      assert.equal(visual.showSignature, true);
      assert.ok(pull.card.playerImageUrl);
      assert.ok(pull.card.estimatedValueCents > 0);
      const persist = buildUserCardPersistData("user", "product", pull);
      assert.equal(persist.serialDisplay, null);
    }
  });
});
