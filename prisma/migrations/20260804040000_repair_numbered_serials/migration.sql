-- Repair numbered-card serials: no ?/ placeholders, no null/0/out-of-range values.
-- Catalog cards get a permanent assignedSerial; owned copies + opening history align to it.

-- 1) Backfill / repair Card.assignedSerial for every numbered catalog card.
UPDATE "Card" AS c
SET "assignedSerial" = CASE
  WHEN src.pr = 1 THEN 1
  ELSE (mod(abs(hashtext(c.id)), src.pr) + 1)
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
  AND src.pr > 0
  AND (
    c."assignedSerial" IS NULL
    OR c."assignedSerial" < 1
    OR c."assignedSerial" > src.pr
  );

-- 2) Repair UserCard rows with missing, ?/, zero, or out-of-range serials.
UPDATE "UserCard" AS uc
SET
  "serialNumber" = src.assigned_serial,
  "serialDisplay" = CASE
    WHEN src.pr = 1 THEN '1/1'
    ELSE src.assigned_serial::text || '/' || src.pr::text
  END
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
    AND COALESCE(n."printRun", p."printRun") > 0
) AS src
WHERE uc."cardId" = src.card_id
  AND (
    uc."serialDisplay" IS NULL
    OR uc."serialDisplay" LIKE '?/%'
    OR uc."serialNumber" IS NULL
    OR uc."serialNumber" < 1
    OR uc."serialNumber" > src.pr
    OR uc."serialNumber" IS DISTINCT FROM src.assigned_serial
  );

-- 3) Repair OpeningPull rows the same way.
UPDATE "OpeningPull" AS op
SET
  "serialNumber" = src.assigned_serial,
  "serialDisplay" = CASE
    WHEN src.pr = 1 THEN '1/1'
    ELSE src.assigned_serial::text || '/' || src.pr::text
  END
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
    AND COALESCE(n."printRun", p."printRun") > 0
) AS src
WHERE op."cardId" = src.card_id
  AND (
    op."serialDisplay" IS NULL
    OR op."serialDisplay" LIKE '?/%'
    OR op."serialNumber" IS NULL
    OR op."serialNumber" < 1
    OR op."serialNumber" > src.pr
    OR op."serialNumber" IS DISTINCT FROM src.assigned_serial
  );
