--==========================================
-- Phase 0 - Task 9: Add Soft Delete Support
-- Estimated Time: 15 minutes
-- Risk Level: 🟡 LOW (additive change)
-- Execute in: Supabase SQL Editor
--==========================================

-- ===== STEP 1: Add deleted_at to vehicles =====
-- Expected Result: ALTER TABLE confirmation
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- ===== STEP 2: Add deleted_at to bookings =====
-- Expected Result: ALTER TABLE confirmation
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- ===== STEP 3: Verify Columns Added =====
-- Expected Result: 2 rows (one for each table)
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('vehicles', 'bookings')
  AND column_name = 'deleted_at'
ORDER BY table_name;

-- ===== STEP 4: Update Vehicles RLS Policy =====
-- Expected Result: DROP POLICY then CREATE POLICY confirmation

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Vehicles are viewable by everyone." ON vehicles;
DROP POLICY IF EXISTS "vehicles_select_by_department" ON vehicles;

-- Create new policy with soft delete filter
CREATE POLICY "vehicles_select_by_department" ON vehicles
  FOR SELECT
  USING (
    deleted_at IS NULL  -- Only show non-deleted vehicles
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (profiles.department IN ('R&D', 'Training') AND vehicles.department IN ('R&D', 'Training'))
        OR (profiles.department = 'Marketing' AND vehicles.department = 'Marketing')
      )
    )
  );

-- ===== STEP 5: Update Bookings RLS Policy =====
-- Expected Result: DROP POLICY then CREATE POLICY confirmation

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Bookings are viewable by everyone." ON bookings;
DROP POLICY IF EXISTS "bookings_select_by_department" ON bookings;

-- Create new policy with soft delete filter
CREATE POLICY "bookings_select_by_department" ON bookings
  FOR SELECT
  USING (
    deleted_at IS NULL  -- Only show non-deleted bookings
    AND EXISTS (
      SELECT 1 FROM profiles
      JOIN vehicles ON bookings.vehicle_id = vehicles.id
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (profiles.department IN ('R&D', 'Training') AND vehicles.department IN ('R&D', 'Training'))
        OR (profiles.department = 'Marketing' AND vehicles.department = 'Marketing')
      )
    )
  );

-- ===== STEP 6: Verify RLS Policies =====
-- Expected Result: 2 rows showing updated policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('vehicles', 'bookings')
  AND policyname IN ('vehicles_select_by_department', 'bookings_select_by_department')
ORDER BY tablename;

-- ===== STEP 7: Test Soft Delete (Optional) =====
-- UNCOMMENT to test (replace with actual vehicle name)
/*
-- Pick a test vehicle
UPDATE vehicles SET deleted_at = NOW() WHERE name = 'Training_TBD';

-- Verify it's hidden
SELECT COUNT(*) as visible_count FROM vehicles WHERE deleted_at IS NULL; 

-- Restore it
UPDATE vehicles SET deleted_at = NULL WHERE name = 'Training_TBD';

-- Verify it's back
SELECT COUNT(*) as visible_count FROM vehicles WHERE deleted_at IS NULL;
*/

-- ===== STEP 8: Count Visible Vehicles =====
-- Expected Result: Number of non-deleted vehicles
SELECT COUNT(*) as visible_vehicles FROM vehicles WHERE deleted_at IS NULL;

-- ===== Acceptance Criteria =====
-- [ ] deleted_at columns added to both tables
-- [ ] RLS policies updated and active
-- [ ] Soft delete test passed (optional)
-- [ ] Dashboard still shows all vehicles
-- [ ] No console errors

-- ===== Benefits =====
-- 1. Preserves audit trail for compliance
-- 2. Enables accidental deletion recovery
-- 3. Supports historical data analysis
-- 4. Aligns with data retention policies
-- 5. Maintains referential integrity

SELECT 'Task 9: Soft delete support added successfully.' as status;
