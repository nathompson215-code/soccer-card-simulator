# Authorized image assets

Draft Eleven loads player photos, full card scans, product art, and logos from
`/public` (or absolute URLs stored in the database). Components never hard-code
image files — they read paths from the database DTOs.

## Folder layout

```
public/
  players/           # player portraits
  cards/             # full card front/back scans (one folder per card slug)
  products/          # product / pack / box artwork
  manufacturers/     # manufacturer logos
  clubs/             # club crests
  national-teams/    # national team badges
  logos/             # brand / app / misc logos
```

## Naming conventions

| Asset | Path pattern | Example |
| --- | --- | --- |
| Player portrait | `/players/{player-slug}.{ext}` | `/players/lionel-messi.webp` |
| Player HD | `/players/{player-slug}@2x.{ext}` | `/players/lionel-messi@2x.webp` |
| Card front | `/cards/{card-slug}/front.{ext}` | `/cards/topps-chrome-ucl-2024-25__base__1__base/front.webp` |
| Card back | `/cards/{card-slug}/back.{ext}` | `.../back.webp` |
| Card front HD | `/cards/{card-slug}/front@2x.{ext}` | `.../front@2x.webp` |
| Card back HD | `/cards/{card-slug}/back@2x.{ext}` | `.../back@2x.webp` |
| Product hero | `/products/{product-slug}.{ext}` | `/products/topps-chrome-ucl-2024-25.webp` |
| Pack art | `/products/{product-slug}-pack.{ext}` | `...-pack.webp` |
| Box art | `/products/{product-slug}-box.{ext}` | `...-box.webp` |
| Manufacturer | `/manufacturers/{slug}.{ext}` | `/manufacturers/topps.webp` |
| Club | `/clubs/{slug}.{ext}` | `/clubs/real-madrid.webp` |
| National team | `/national-teams/{slug}.{ext}` | `/national-teams/argentina.webp` |
| Brand / logo | `/logos/{slug}.{ext}` | `/logos/chrome-ucl.webp` |

Supported extensions: **webp** (preferred), **jpg**, **jpeg**, **png**, **svg**.

Card slugs match the `Card.slug` column (product × set × number × parallel). Use
the exact slug as the folder name so uploads map 1:1 without code changes.

Player and club slugs are ASCII: accented characters are stripped (`Mbappé` →
`mbappe`) before hyphenation.

## Database fields

Store public paths (or absolute CDN URLs) on:

| Model | Fields |
| --- | --- |
| `Player` | `imageUrl`, `imageUrlHd` |
| `Card` | `frontImageUrl`, `backImageUrl`, `frontImageUrlHd`, `backImageUrlHd` |
| `Product` | `imageUrl`, `packImageUrl`, `boxImageUrl`, `logoUrl` |
| `Manufacturer` | `logoUrl`, `imageUrl` |
| `Brand` | `logoUrl` |
| `Club` | `logoUrl`, `imageUrl` |
| `NationalTeam` | `logoUrl` |

When `Card.frontImageUrl` is set, the card renderer shows the real full-card
image (5∶7). The generated Draft Eleven template is used only as a fallback.

## Upload process (scale to thousands)

1. Export or scan assets using the naming table above.
2. Drop files into the matching `/public/...` folder (or upload to your CDN).
3. Set the corresponding DB columns to the public path or CDN URL.
   - Bulk option: CSV/SQL update keyed by `slug`.
   - Example:

```sql
UPDATE "Card"
SET
  "frontImageUrl" = '/cards/' || slug || '/front.webp',
  "backImageUrl"  = '/cards/' || slug || '/back.webp',
  "frontImageUrlHd" = '/cards/' || slug || '/front@2x.webp',
  "backImageUrlHd"  = '/cards/' || slug || '/back@2x.webp'
WHERE slug LIKE 'topps-chrome-ucl-2024-25__%';
```

4. No component changes are required. Restart is not required for new static
   files under `/public` in production after deploy.

### Recommended sizes

| Kind | Aspect | Typical pixels |
| --- | --- | --- |
| Card front/back | 5∶7 | 750×1050 (1x), 1500×2100 (@2x) |
| Player portrait | ~4∶5 | 800×1000 (1x), 1600×2000 (@2x) |
| Logos | 1∶1 | 512×512 |

Use WebP where possible for pack opening performance. Keep `@2x` companions for
HiDPI displays; the UI builds a `srcSet` when HD URLs are present.

## Sample seed assets

`npm run assets:sample` writes a small set of SVG stand-ins used by `db:seed`
(Messi / Ronaldo / Mbappé cards, logos, product art). Replace them with licensed
photography using the **same filenames** (or update DB paths).

Path helpers live in `src/lib/assets.ts`.
