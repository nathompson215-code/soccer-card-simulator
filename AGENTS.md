<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a single Next.js 16 (App Router) + Prisma + PostgreSQL app ("Draft Eleven", a soccer trading card simulator). Standard commands live in `README.md` and `package.json` scripts (`dev`, `build`, `lint`, `test`, `db:migrate`, `db:seed`). Notes below cover only non-obvious setup/run caveats.

- PostgreSQL is installed via the VM snapshot (cluster `16 main`), not the update script. It does NOT auto-start on boot — run `sudo pg_ctlcluster 16 main start` at the beginning of a session before any DB-backed command (dev server, build, migrate, seed). Connection matches `.env` / `.env.example`: role `striker`/`striker`, db `striker_cards` on `localhost:5432`.
- `.env` is gitignored but persists in the snapshot. If it is ever missing, recreate it with `cp .env.example .env`.
- Seeding gotcha: `npm run db:seed` runs `tsx prisma/seed.ts` directly and does NOT auto-load `.env`, so it fails with "Environment variable not found: DATABASE_URL". Seed via `npx prisma db seed` instead (the Prisma CLI loads `.env`), or export `DATABASE_URL` first. The Prisma CLI commands (`prisma migrate`, `prisma db seed`) load `.env` automatically; scripts run directly through `tsx` do not.
- DB state (migrations + seed: 2 products, ~9.5k cards, demo user `collector@drafteleven.local`) is captured in the snapshot. After a fresh clone or reset, apply migrations with `npx prisma migrate deploy` (or `db:migrate` for dev) then `npx prisma db seed`.
- `npm run lint` currently reports pre-existing errors (mostly `react-hooks/set-state-in-effect` in existing components) and exits non-zero. This is unrelated to environment setup; do not "fix" it as part of setup.
- The dev server binds `0.0.0.0:3000`. Player photos under `/players/*` are optional dev assets (fetched via `npm run photos:fetch`); missing-photo 404s in dev logs are expected and non-blocking.
