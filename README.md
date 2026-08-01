# Draft Eleven — Soccer Card Collection Simulator

A PostgreSQL-backed soccer trading card simulator and archive. Browse products, open packs with database-driven odds, and build a persistent collection.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **PostgreSQL** + **Prisma ORM**
- Framer Motion for pack-opening UX

## Architecture

All catalog data lives in normalized Postgres tables (manufacturers, brands, products, sets, checklists, players, clubs, national teams, tournaments, cards, parallels, autographs, memorabilia, numbering, pack odds, packs, boxes, and user collections). Features read from the database — there are no hard-coded catalog arrays in the app.

The schema is designed to scale past **1,000,000** unique cards via the `Card` table (`ChecklistEntry` × `Parallel`).

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure database
cp .env.example .env
# DATABASE_URL=postgresql://striker:striker@localhost:5432/striker_cards?schema=public

# 3. Migrate + seed a small sample dataset
npx prisma migrate dev
npm run db:seed

# 4. Run the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm run db:seed` | Seed a small development sample |
| `npm run db:migrate` | Create/apply migrations |

## Demo user

Seed creates `collector@drafteleven.local`. Pack openings save `UserCard` rows for that user.

## Image assets

Authorized player photos, full card scans, product art, and logos live under `/public`
(players, cards, products, manufacturers, clubs, national-teams, logos). Paths are
stored on database models — components never hard-code image files.

See **[docs/ASSETS.md](docs/ASSETS.md)** for naming conventions and the bulk upload
process. Player/club slugs use ASCII (`NFD` accent stripping), e.g. `Kylian Mbappé` →
`kylian-mbappe`. Generate the small SVG sample set with:

```bash
npm run assets:sample
npm run db:seed
```

When a card has `frontImageUrl`, the UI shows the real 5∶7 scan (with flip / zoom /
HiDPI). The generated Draft Eleven template is only a fallback.
