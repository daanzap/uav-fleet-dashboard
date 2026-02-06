--==========================================
-- Phase 0 - Task 8: Remove vehicles.risk_level Column
-- Estimated Time: 10 minutes
-- Risk Level: 🔴 DESTRUCTIVE (permanent data loss)
-- Execute in: Supabase SQL Editor
--==========================================

-- ===== STEP 1: Check Current State =====
-- Expected Result: 1 row showing the column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND column_name = 'risk_level';

-- ===== STEP 2: Remove Column =====
-- Expected Result: ALTER TABLE confirmation
-- WARNING: This is PERMANENT. Ensure backup exists before proceeding.
ALTER TABLE vehicles DROP COLUMN IF EXISTS risk_level;

-- ===== STEP 3: Verify Removal =====
-- Expected Result: 0 rows (empty result)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND column_name = 'risk_level';

-- ===== STEP 4: Verify Bookings Unchanged =====
-- Expected Result: 1 row (bookings.risk_level preserved)
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name = 'risk_level';

-- ===== STEP 5: Review Final Structure =====
-- Expected Result: Column list WITHOUT risk_level
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- ===== Acceptance Criteria =====
-- [ ] risk_level removed from vehicles table
-- [ ] bookings.risk_level still exists
-- [ ] EditVehicleModal works without errors
-- [ ] Can still create/edit vehicles in UI

-- ===== Business Rationale =====
-- Risk level should be assessed per-booking (dynamic), not as a fixed 
-- vehicle property. Risk depends on mission context, pilot experience, 
-- weather conditions, and other factors that vary per booking.
-- This change aligns the database schema with the correct business logic.

SELECT 'Task 8: vehicles.risk_level removal completed successfully.' as status;
