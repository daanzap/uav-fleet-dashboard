--==========================================
-- Run this file in Supabase SQL Editor (paste this SQL only).
-- Do NOT paste src/lib/constants.js here; that is JavaScript, not SQL.
-- Update existing public.vehicles data only. NO NEW TABLE.
--==========================================
-- 1. UPDATE: set name on first 7 rows (by id) to the 7 allowlist names.
-- 2. DELETE: remove rows whose name is not in the allowlist (leave 7 rows).
-- Result: same vehicles table, 7 rows, names match dashboard allowlist.
--==========================================

-- 7 names in alphabetical order (must match src/lib/constants.js ALLOWED_VEHICLE_NAMES)
-- RD-117, RD-125, RD-652 (TBD), RD-931, RD-High Altitude, Training-933, Training_TBD

-- Step 1: Assign these 7 names to the first 7 vehicles (by id).
--         Other columns (status, type, department, etc.) are kept.
WITH target_names(name) AS (
  SELECT unnest(ARRAY[
    'RD-117',
    'RD-125',
    'RD-652 (TBD)',
    'RD-931',
    'RD-High Altitude',
    'Training-933',
    'Training_TBD'
  ])
),
numbered_names AS (
  SELECT row_number() OVER () AS rn, name FROM target_names
),
first_seven_ids AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn
  FROM vehicles
  ORDER BY id
  LIMIT 7
)
UPDATE vehicles v
SET name = nn.name
FROM first_seven_ids f
JOIN numbered_names nn ON f.rn = nn.rn
WHERE v.id = f.id;

-- Step 2: Remove any vehicle whose name is not one of the 7.
DELETE FROM vehicles
WHERE name NOT IN (
  'RD-117',
  'RD-125',
  'RD-652 (TBD)',
  'RD-931',
  'RD-High Altitude',
  'Training-933',
  'Training_TBD'
);

-- Confirm: should return 7 rows, names A–Z
-- SELECT name FROM vehicles ORDER BY name;
