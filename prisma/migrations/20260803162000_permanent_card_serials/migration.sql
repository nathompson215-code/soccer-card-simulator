-- AlterTable
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "assignedSerial" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Card_assignedSerial_idx" ON "Card"("assignedSerial");

-- Backfill permanent serials for every numbered catalog card (1..printRun).
-- One-of-ones (print run 1) are always serial 1. Others use a stable hash of card id.
UPDATE "Card" AS c
SET "assignedSerial" = CASE
  WHEN src.pr = 1 THEN 1
  WHEN src.pr IS NOT NULL THEN (mod(abs(hashtext(c.id)), src.pr) + 1)
  ELSE NULL
END
FROM (
  SELECT
    c2.id AS card_id,
    COALESCE(n."printRun", p."printRun") AS pr
  FROM "Card" AS c2
  JOIN "Parallel" AS p ON p.id = c2."parallelId"
  LEFT JOIN "NumberingSpec" AS n ON n."cardId" = c2.id
) AS src
WHERE c.id = src.card_id
  AND src.pr IS NOT NULL
  AND c."assignedSerial" IS NULL;

-- Align owned copies to the card's permanent serial (no ?/ placeholders).
UPDATE "UserCard" AS uc
SET
  "serialNumber" = src.assigned_serial,
  "serialDisplay" = src.assigned_serial::text || '/' || src.pr::text
FROM (
  SELECT
    c.id AS card_id,
    c."assignedSerial" AS assigned_serial,
    COALESCE(n."printRun", p."printRun") AS pr
  FROM "Card" AS c
  JOIN "Parallel" AS p ON p.id = c."parallelId"
  LEFT JOIN "NumberingSpec" AS n ON n."cardId" = c.id
  WHERE c."assignedSerial" IS NOT NULL
    AND COALESCE(n."printRun", p."printRun") IS NOT NULL
) AS src
WHERE uc."cardId" = src.card_id
  AND (
    uc."serialDisplay" IS NULL
    OR uc."serialDisplay" LIKE '?/%'
    OR uc."serialNumber" IS DISTINCT FROM src.assigned_serial
  );

-- Align opening history pulls to the same permanent serials.
UPDATE "OpeningPull" AS op
SET
  "serialNumber" = src.assigned_serial,
  "serialDisplay" = src.assigned_serial::text || '/' || src.pr::text
FROM (
  SELECT
    c.id AS card_id,
    c."assignedSerial" AS assigned_serial,
    COALESCE(n."printRun", p."printRun") AS pr
  FROM "Card" AS c
  JOIN "Parallel" AS p ON p.id = c."parallelId"
  LEFT JOIN "NumberingSpec" AS n ON n."cardId" = c.id
  WHERE c."assignedSerial" IS NOT NULL
    AND COALESCE(n."printRun", p."printRun") IS NOT NULL
) AS src
WHERE op."cardId" = src.card_id
  AND (
    op."serialDisplay" IS NULL
    OR op."serialDisplay" LIKE '?/%'
    OR op."serialNumber" IS DISTINCT FROM src.assigned_serial
  );
