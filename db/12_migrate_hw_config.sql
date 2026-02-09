-- ===========================================
-- Phase 5: Migrate vehicles.hw_config to structured schema
-- Preserves legacy { "raw": "..." } in legacy_text.
-- Run after 05_department_and_jsonb.sql (hw_config is JSONB).
-- ===========================================

-- 1. Migrate existing rows: wrap legacy "raw" in new structure
UPDATE vehicles
SET hw_config = jsonb_build_object(
  'legacy_text', COALESCE(hw_config->>'raw', ''),
  'radio', jsonb_build_object(
    'h30', jsonb_build_object('enabled', false),
    'silvus', jsonb_build_object('enabled', false),
    'radioNor', jsonb_build_object('enabled', false),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  ),
  'frequencyBand', jsonb_build_object('s', false, 'c', false, 'l', false, 'custom', ''),
  'visualNavigation', jsonb_build_object('yes', false, 'no', false, 'boson', false),
  'gps', jsonb_build_object(
    'holyBro', jsonb_build_object('enabled', false),
    'hardenGps', jsonb_build_object('enabled', false),
    'arcXL', jsonb_build_object('enabled', false),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  )
)
WHERE hw_config IS NOT NULL
  AND (hw_config ? 'raw' OR hw_config = '{}'::jsonb OR jsonb_typeof(hw_config) != 'object')
  AND NOT (hw_config ? 'radio' AND hw_config ? 'frequencyBand');

-- 2. Set empty structure for null or empty
UPDATE vehicles
SET hw_config = jsonb_build_object(
  'radio', jsonb_build_object(
    'h30', jsonb_build_object('enabled', false),
    'silvus', jsonb_build_object('enabled', false),
    'radioNor', jsonb_build_object('enabled', false),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  ),
  'frequencyBand', jsonb_build_object('s', false, 'c', false, 'l', false, 'custom', ''),
  'visualNavigation', jsonb_build_object('yes', false, 'no', false, 'boson', false),
  'gps', jsonb_build_object(
    'holyBro', jsonb_build_object('enabled', false),
    'hardenGps', jsonb_build_object('enabled', false),
    'arcXL', jsonb_build_object('enabled', false),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  )
)
WHERE hw_config IS NULL OR hw_config::text = '{}' OR hw_config = 'null'::jsonb;

-- 3. Booking snapshot trigger: copy full hw_config JSONB (Phase 5 structured)
CREATE OR REPLACE FUNCTION public.set_booking_snapshot_hw_config()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(v.hw_config, '{}'::jsonb)
  INTO new.snapshotted_hw_config
  FROM public.vehicles v
  WHERE v.id = new.vehicle_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger already exists from 04_bookings_prd_snapshot.sql; ensure it uses new function
DROP TRIGGER IF EXISTS trigger_set_booking_snapshot ON bookings;
CREATE TRIGGER trigger_set_booking_snapshot
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE PROCEDURE public.set_booking_snapshot_hw_config();

SELECT 'Phase 5: hw_config migration and snapshot trigger updated.' AS status;
