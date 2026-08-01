# Striker Cards — Soccer Card Collection Simulator

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

Seed creates `collector@strikercards.local`. Pack openings save `UserCard` rows for that user.
