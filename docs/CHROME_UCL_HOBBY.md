# Topps Chrome UEFA Club Competitions 2024–25 Hobby Box

Draft Eleven simulates this product from editable JSON under
`data/products/topps-chrome-ucl-2024-25/`. The pack engine loads those files —
future products are new data folders, not code changes.

## Published hobby configuration

| Spec | Value |
| --- | --- |
| Packs per box | **20** |
| Cards per pack | **4** |
| Boxes per case | 12 |
| Chrome Autograph | **1 per box** |
| Numbered parallels | **3 per box** |
| Pulsar Refractors | **3 per box** |
| Inserts | **9 per box** |

Approximate published rates used for fill/weighting:

- Base Refractor ≈ 1:2 packs
- Pulsar ≈ 1:6 packs (guaranteed 3/box)
- Wonderkids ≈ 1:5 · Golazo ≈ 1:10 · Final Destination / Circle of Power Power On / Youth League ≈ 1:20
- High Voltage ≈ 1:120 · Shockwave / Radiating Rookies ≈ 1:480
- Shadow Etch ≈ 1:240 · Tifo ≈ 1:1200 · Helix / Munich / White Noise / Grail = deep case hits
- Club & Country / SuperFractor = 1/1

## Config files

```
data/products/topps-chrome-ucl-2024-25/
  product.json   # box size, guarantees, fill odds, odds labels
  players.json   # clubs + players with tier + pullWeight
  sets.json      # baseParallels + every insert / case hit / auto set
```

Each set/parallel may declare:

- `pool` — `base` | `refractor` | `pulsar` | `numbered` | `insert` | `autograph` | `booklet` | `case_hit`
- `insertWeight` — relative odds among insert guarantees
- `visualTheme` — CSS class `d11-theme-*` + reveal style in `src/lib/visual-themes.ts`
- `setParallels` — full rainbow for that insert/auto line

Edit JSON → `npm run db:seed`. Theme CSS lives in `globals.css`; reveal motion in `CardReveal`.

## Catalog coverage (hobby)

**Base rainbow:** Base, Refractor, Pulsar, Violet→Red Lava, RayWave hobby exclusives, XI, Club & Country, SuperFractor.

**Inserts:** Wonderkids, Golazo, Final Destination, Circle of Power (Power On / High Voltage / Shockwave), Bowman UEFA Youth League (+ numbered insert rainbows where published).

**Case hits / SPs:** Hero Variations, Radiating Rookies, Shadow Etch, Tifo, Helix, Munich at Night, White Noise, Hidden Gems (Amber/Sapphire/Ruby), The Grail, Trophies.

**Autographs:** Chrome, Wonderkids, Future Stars, Marks of Excellence, Dual / Triple / Quad, Quad Pundit (+ Refractor rainbows).

**Memorabilia:** Campeone Autograph Book.

Excluded on purpose (other SKUs): Speckle (Jumbo), Wave (Blaster), Prism (retail), Soccer Brush (Blaster), Youthquake / Global Attraction / Geometric (Breakers), Black Lazer (Jumbo), Hongbao exclusives.

## Engine behavior

- **Open Box** places guarantees first, then fills remaining slots from config odds
- **Rip 1 Pack** uses `singlePackApprox` (no full-box guarantee enforcement)
- Commons dominate via player `pullWeight`; stars/rookies/legends concentrate in inserts & autos
- End-of-box summary: guarantee tracker, rarity mix, estimated value, collection progress

## Adding another product

1. Create `data/products/<slug>/{product,players,sets}.json`
2. Reuse the same schema (see types in `src/lib/product-config.ts`)
3. Add any new `visualTheme` keys to `visual-themes.ts` + `.d11-theme-*` CSS
4. Run `npm run db:seed`
