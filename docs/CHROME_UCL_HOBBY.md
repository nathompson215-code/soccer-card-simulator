# Topps Chrome UEFA Club Competitions 2024–25 Hobby Box

Draft Eleven focuses this product before expanding the catalog. Configuration lives in
`data/products/topps-chrome-ucl-2024-25/` and drives both seeding and the pack engine.

## Published hobby configuration (source)

| Spec | Value |
| --- | --- |
| Packs per box | **20** |
| Cards per pack | **4** |
| Boxes per case | 12 |
| Chrome Autograph | **1 per box** |
| Numbered parallels | **3 per box** |
| Pulsar Refractors | **3 per box** |
| Inserts | **9 per box** |

Additional fill behavior (configurable in `product.json`):

- Refractors appear in remaining slots at a rate that feels like ~1:3 packs
- Commons / veterans dominate base pulls via `pullWeight` on each player
- Stars, rookies, legends stay scarcer in base; they concentrate in inserts/autos
- Rare bonus hits (patch, booklet, case hit, extra numbered) can appear beyond guarantees

## Config files

```
data/products/topps-chrome-ucl-2024-25/
  product.json   # box size, guarantees, fill odds, odds labels
  players.json   # clubs + players with tier + pullWeight
  sets.json      # sets, parallels, checklist filters
```

Edit these JSON files and re-run `npm run db:seed` — no component changes required.

## Engine behavior

- **Open Box** places guarantee slots first across the 20 packs, then fills the rest
- **Rip 1 Pack** uses `singlePackApprox` odds (no full-box guarantee enforcement)
- End-of-box summary shows guarantee tracker, rarity breakdown, estimated value,
  full pull list, and product collection progress
