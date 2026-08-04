import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import type { Rarity } from "@prisma/client";
import {
  loadProductConfig,
  slugifyName,
  type ParallelConfig,
} from "@/lib/product-config";
import {
  playerPhotoCandidates,
  resolveCardPlayerPhotoSrc,
} from "@/lib/player-assets";
import { estimateValueCents } from "@/lib/pricing";

const PRIZM = "panini-prizm-premier-league-2023-24";
const PLAYERS_DIR = path.join(process.cwd(), "public", "players");

/**
 * Panini Prizm players with no free upstream (Wikipedia/Wikidata) photograph.
 * The runtime gracefully falls back to the shared "photo unavailable" portrait
 * for these — we intentionally do not fabricate placeholder artwork. Kept tiny
 * on purpose so the fix must cover the entire checklist, not one hard-coded name.
 */
const KNOWN_UPSTREAM_PHOTO_GAPS = new Set(["lewis-miley"]);

function hasPhotoOnDisk(playerSlug: string): boolean {
  return playerPhotoCandidates(playerSlug).some((url) =>
    existsSync(path.join(PLAYERS_DIR, path.basename(url))),
  );
}

function firstParallel(...candidates: (ParallelConfig | undefined)[]) {
  return candidates.find((c): c is ParallelConfig => Boolean(c));
}

describe("Panini Prizm player photos", () => {
  it("resolves a non-empty player-photo URL for every Prizm checklist player", () => {
    const cfg = loadProductConfig(PRIZM);
    assert.ok(cfg, "Prizm config should load");

    for (const player of cfg!.players.players) {
      const slug = slugifyName(player.name);
      const src = resolveCardPlayerPhotoSrc({ playerSlug: slug });
      assert.ok(src.trim().length > 0, `${player.name} resolved an empty photo URL`);
      assert.match(src, /^\/players\/.+\.(jpg|webp|jpeg|png)$/);
    }
  });

  it("ships real photo assets for the entire Prizm checklist, not one hard-coded player", () => {
    const cfg = loadProductConfig(PRIZM)!;
    const players = cfg.players.players;

    const missing = players
      .map((p) => slugifyName(p.name))
      .filter((slug) => !hasPhotoOnDisk(slug));

    // Every gap must be a documented upstream miss — no silent regressions.
    for (const slug of missing) {
      assert.ok(
        KNOWN_UPSTREAM_PHOTO_GAPS.has(slug),
        `Prizm player "${slug}" has no photo on disk and is not a known upstream gap`,
      );
    }

    const withPhoto = players.length - missing.length;
    // Guards against a "John Stones only" style fix: nearly the whole roster
    // (>= all but the known upstream gaps) must have a real image asset.
    assert.ok(
      withPhoto >= players.length - KNOWN_UPSTREAM_PHOTO_GAPS.size,
      `only ${withPhoto}/${players.length} Prizm players have photos`,
    );
    assert.ok(withPhoto >= 80, `expected broad Prizm photo coverage, got ${withPhoto}`);

    // A spread of Prizm-exclusive players (legends + current PL) must resolve to
    // real files — proving the shared mapping, not a single card.
    for (const name of [
      "Thierry Henry",
      "Wayne Rooney",
      "David Beckham",
      "Reece James",
      "John Stones",
      "Alisson Becker",
      "Rasmus Højlund",
    ]) {
      const slug = slugifyName(name);
      assert.ok(hasPhotoOnDisk(slug), `${name} (${slug}) is missing a photo asset`);
    }
  });
});

describe("Panini Prizm pricing", () => {
  it("assigns a numeric estimated value to a representative Prizm card", () => {
    const cfg = loadProductConfig(PRIZM)!;
    const year = cfg.product.year;
    const base = cfg.sets.baseParallels.find((p) => p.slug === "base");
    assert.ok(base, "Prizm base parallel should exist");

    const value = estimateValueCents(base!.rarity as Rarity, base!.printRun, year, "star");
    assert.equal(typeof value, "number");
    assert.ok(Number.isFinite(value));
    assert.ok(value > 0, "a Prizm base card should have a positive estimated value");
  });

  it("prices base, parallel, numbered, autograph, and memorabilia Prizm cards", () => {
    const cfg = loadProductConfig(PRIZM)!;
    const year = cfg.product.year;
    const { baseParallels, sets } = cfg.sets;

    const base = baseParallels.find((p) => p.slug === "base");
    const colorParallel = baseParallels.find(
      (p) => p.slug !== "base" && (p.printRun == null || p.printRun > 25),
    );
    const numbered = baseParallels.find((p) => p.printRun != null && p.printRun > 0);

    const autographSet = sets.find((s) => s.autograph || s.pool === "autograph");
    const memorabiliaSet = sets.find((s) => s.memorabilia || s.pool === "patch");

    const setParallel = (set?: typeof autographSet): ParallelConfig | undefined =>
      firstParallel(set?.setParallels?.[0], set?.parallel);

    const cases: Array<[string, ParallelConfig | undefined]> = [
      ["base", base],
      ["parallel", colorParallel],
      ["numbered", numbered],
      ["autograph", setParallel(autographSet)],
      ["memorabilia", setParallel(memorabiliaSet)],
    ];

    for (const [label, parallel] of cases) {
      assert.ok(parallel, `Prizm config should define a ${label} card`);
      const value = estimateValueCents(
        parallel!.rarity as Rarity,
        parallel!.printRun,
        year,
        "legend",
      );
      assert.equal(typeof value, "number", `${label} value should be numeric`);
      assert.ok(Number.isFinite(value), `${label} value should be finite`);
      assert.ok(value > 0, `${label} Prizm card should be priced (> 0), got ${value}`);
    }
  });
});
