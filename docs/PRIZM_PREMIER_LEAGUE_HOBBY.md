# 2023–24 Panini Prizm Premier League Hobby Box

Draft Eleven simulates this product from editable JSON under
`data/products/panini-prizm-premier-league-2023-24/`. The shared pack engine
loads those files — no product-specific hard-coding in open logic.

## Published hobby configuration

| Spec | Value |
| --- | --- |
| Packs per box | **12** |
| Cards per pack | **12** |
| Boxes per case | 12 |
| Autograph | **1 per box** |
| Silver Prizms | **4 per box** |
| Numbered Prizms | **5 per box** |
| Additional Prizms | **8 per box** |
| Inserts | **6 per box** |

## Config files

```
data/products/panini-prizm-premier-league-2023-24/
  product.json   # box size, guarantees, fill odds, odds labels, highlights
  players.json   # Premier League clubs + players with tier + pullWeight
  sets.json      # baseParallels + inserts / case hits / autos / patches
```

Pool mapping (config-driven via `pool` fields):

- Silver Prizm → `refractor`
- Additional unnumbered Prizms (Hyper, Ice, Genesis, …) → `pulsar`
- Numbered Prizms → `numbered`
- Inserts → `insert`
- Color Blast / Groovy / Manga → `case_hit`
- Signatures / Penmanship / Dual / Club Legends → `autograph`
- Prizm Patches → `patch`

Choice and Breakaway exclusives are excluded on purpose (other SKUs).

## Themes

Prizm visual themes live in `src/lib/visual-themes.ts` (`prizm-*` keys) with matching
`.d11-theme-prizm-*` CSS in `globals.css`.

Edit JSON → `npm run db:seed`.
