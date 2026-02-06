--==========================================
-- Phase 0: Complete Database Schema Updates
-- Execute ALL tasks in ONE GO (Recommended)
--==========================================
-- Tasks Included:
--   Task 8: Remove vehicles.risk_level column
--   Task 9: Add soft delete support
--   Task 10: Create change_logs audit table
--
-- Total Time: ~45 minutes
-- Execute in: Supabase SQL Editor
-- Project: https://citoiconzejdfjjefnbi.supabase.co
--
-- ⚠️ IMPORTANT: Backup database before running!
--==========================================

-- ========================================
-- TASK 8: Remove vehicles.risk_level Column
-- ========================================

-- Check current state
SELECT 'Task 8: Checking vehicles.risk_level...' as status;

SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND column_name = 'risk_level';

-- Remove column (DESTRUCTIVE - ensure backup exists!)
ALTER TABLE vehicles DROP COLUMN IF EXISTS risk_level;

-- Verify removal
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Task 8 Complete: risk_level removed from vehicles'
    ELSE '❌ Task 8 Failed: risk_level still exists'
  END as status
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND column_name = 'risk_level';

-- Verify bookings.risk_level preserved
SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Verified: bookings.risk_level preserved'
    ELSE '❌ Warning: bookings.risk_level missing'
  END as status
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name = 'risk_level';

-- ========================================
-- TASK 9: Add Soft Delete Support
-- ========================================

SELECT 'Task 9: Adding soft delete support...' as status;

-- Add deleted_at columns
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Verify columns added
SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ Task 9 Step 1 Complete: deleted_at columns added'
    ELSE '❌ Task 9 Step 1 Failed: deleted_at columns missing'
  END as status
FROM information_schema.columns 
WHERE table_name IN ('vehicles', 'bookings')
  AND column_name = 'deleted_at';

-- Update Vehicles RLS Policy
DROP POLICY IF EXISTS "Vehicles are viewable by everyone." ON vehicles;
DROP POLICY IF EXISTS "vehicles_select_by_department" ON vehicles;

CREATE POLICY "vehicles_select_by_department" ON vehicles
  FOR SELECT
  USING (
    deleted_at IS NULL
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

-- Update Bookings RLS Policy
DROP POLICY IF EXISTS "Bookings are viewable by everyone." ON bookings;
DROP POLICY IF EXISTS "bookings_select_by_department" ON bookings;

CREATE POLICY "bookings_select_by_department" ON bookings
  FOR SELECT
  USING (
    deleted_at IS NULL
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

-- Verify RLS policies
SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ Task 9 Complete: RLS policies updated with soft delete'
    ELSE '❌ Task 9 Failed: RLS policies not updated'
  END as status
FROM pg_policies
WHERE tablename IN ('vehicles', 'bookings')
  AND policyname IN ('vehicles_select_by_department', 'bookings_select_by_department');

-- ========================================
-- TASK 10: Create change_logs Audit Table
-- ========================================

SELECT 'Task 10: Creating change_logs audit table...' as status;

-- Create table
CREATE TABLE IF NOT EXISTS change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  
  -- User information
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_display_name text,
  
  -- Entity being changed
  entity_type text NOT NULL CHECK (entity_type IN ('vehicle', 'booking', 'profile')),
  entity_id uuid NOT NULL,
  entity_name text,
  
  -- Change details
  action_type text NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  before_snapshot jsonb,
  after_snapshot jsonb,
  changed_fields jsonb,
  
  -- Additional context
  notes text,
  ip_address text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_change_logs_entity 
  ON change_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_change_logs_user 
  ON change_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_change_logs_created 
  ON change_logs(created_at DESC);

-- Enable RLS
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "Change logs are viewable by editors and admins" ON change_logs;
DROP POLICY IF EXISTS "Authenticated users can insert change logs" ON change_logs;

-- Create RLS policies
CREATE POLICY "Change logs are viewable by editors and admins" ON change_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Authenticated users can insert change logs" ON change_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Verify table exists
SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Task 10 Step 1 Complete: change_logs table created'
    ELSE '❌ Task 10 Step 1 Failed: change_logs table missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'change_logs';

-- Verify indexes (should be 4: 3 custom + 1 primary key)
SELECT 
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ Task 10 Step 2 Complete: indexes created'
    ELSE '❌ Task 10 Step 2 Failed: indexes missing'
  END as status
FROM pg_indexes
WHERE tablename = 'change_logs';

-- Verify RLS enabled
SELECT 
  CASE 
    WHEN rowsecurity = true THEN '✅ Task 10 Step 3 Complete: RLS enabled'
    ELSE '❌ Task 10 Step 3 Failed: RLS not enabled'
  END as status
FROM pg_tables
WHERE tablename = 'change_logs';

-- Verify RLS policies
SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ Task 10 Complete: RLS policies created'
    ELSE '❌ Task 10 Failed: RLS policies missing'
  END as status
FROM pg_policies
WHERE tablename = 'change_logs';

-- ========================================
-- FINAL VERIFICATION
-- ========================================

SELECT '========================================' as separator;
SELECT 'Phase 0 Final Verification' as status;
SELECT '========================================' as separator;

-- 1. Verify vehicles table structure
SELECT 
  'Vehicles Table' as table_name,
  COUNT(*) FILTER (WHERE column_name = 'deleted_at') as has_deleted_at,
  COUNT(*) FILTER (WHERE column_name = 'risk_level') as has_risk_level
FROM information_schema.columns
WHERE table_name = 'vehicles';

-- 2. Verify bookings table structure  
SELECT 
  'Bookings Table' as table_name,
  COUNT(*) FILTER (WHERE column_name = 'deleted_at') as has_deleted_at,
  COUNT(*) FILTER (WHERE column_name = 'risk_level') as has_risk_level
FROM information_schema.columns
WHERE table_name = 'bookings';

-- 3. Verify change_logs exists
SELECT 
  'Change Logs Table' as table_name,
  CASE WHEN COUNT(*) = 1 THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables
WHERE table_name = 'change_logs';

-- 4. Count active vehicles (should show all non-deleted)
SELECT 
  'Active Vehicles' as metric,
  COUNT(*) as count
FROM vehicles
WHERE deleted_at IS NULL;

-- 5. Show RLS policies summary
SELECT 
  'RLS Policies' as metric,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('vehicles', 'bookings', 'change_logs')
GROUP BY tablename
ORDER BY tablename;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

SELECT '========================================' as separator;
SELECT '✅ Phase 0 Database Migration Complete!' as status;
SELECT '========================================' as separator;
SELECT 'Task 8: vehicles.risk_level removed' as completed_tasks
UNION ALL
SELECT 'Task 9: Soft delete support added'
UNION ALL
SELECT 'Task 10: change_logs audit table created'
UNION ALL
SELECT '----------------------------------------'
UNION ALL
SELECT 'Next Steps:'
UNION ALL
SELECT '1. Verify frontend has no console errors'
UNION ALL
SELECT '2. Test vehicle CRUD operations'
UNION ALL
SELECT '3. Verify EditVehicleModal works without risk_level'
UNION ALL
SELECT '4. Run git commit for Phase 0'
UNION ALL
SELECT '5. Proceed to Phase 1 (Bug Fixes)';
