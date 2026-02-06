--==========================================
-- Phase 0 - Task 10: Create change_logs Audit Table
-- Estimated Time: 20 minutes
-- Risk Level: 🟢 NONE (new table only)
-- Execute in: Supabase SQL Editor
--==========================================

-- ===== STEP 1: Create Table =====
-- Expected Result: CREATE TABLE confirmation
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

-- ===== STEP 2: Create Indexes =====
-- Expected Result: 3 CREATE INDEX confirmations

-- Index for entity lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_change_logs_entity 
  ON change_logs(entity_type, entity_id);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_change_logs_user 
  ON change_logs(user_id);

-- Index for time-based queries (audit reports)
CREATE INDEX IF NOT EXISTS idx_change_logs_created 
  ON change_logs(created_at DESC);

-- ===== STEP 3: Enable RLS =====
-- Expected Result: ALTER TABLE confirmation
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;

-- ===== STEP 4: Create SELECT Policy =====
-- Expected Result: CREATE POLICY confirmation
-- Only editors and admins can view logs
CREATE POLICY "Change logs are viewable by editors and admins" ON change_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND role IN ('editor', 'admin')
    )
  );

-- ===== STEP 5: Create INSERT Policy =====
-- Expected Result: CREATE POLICY confirmation
-- Authenticated users can insert logs
CREATE POLICY "Authenticated users can insert change logs" ON change_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===== STEP 6: Verify Table Created =====
-- Expected Result: 1 row
SELECT 
  table_name,
  table_schema,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'change_logs';

-- ===== STEP 7: Verify Indexes =====
-- Expected Result: 4 rows (3 custom + 1 primary key)
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'change_logs'
ORDER BY indexname;

-- ===== STEP 8: Verify RLS Enabled =====
-- Expected Result: rowsecurity = true
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'change_logs';

-- ===== STEP 9: Verify RLS Policies =====
-- Expected Result: 2 rows (SELECT and INSERT policies)
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'change_logs'
ORDER BY policyname;

-- ===== STEP 10: Test Insert =====
-- Expected Result: INSERT 0 1 confirmation
INSERT INTO change_logs (
  user_email, 
  user_display_name, 
  entity_type, 
  entity_id, 
  entity_name, 
  action_type,
  notes
) VALUES (
  'test@example.com',
  'Test User',
  'vehicle',
  gen_random_uuid(),
  'Test Vehicle',
  'create',
  'Phase 0 test record - safe to delete'
);

-- ===== STEP 11: Query Test Record =====
-- Expected Result: 1 row with test data
SELECT 
  id,
  created_at,
  user_email,
  user_display_name,
  entity_type,
  entity_name,
  action_type,
  notes
FROM change_logs 
WHERE notes = 'Phase 0 test record - safe to delete'
ORDER BY created_at DESC 
LIMIT 1;

-- ===== STEP 12: Clean Up Test =====
-- Expected Result: DELETE 1 confirmation
DELETE FROM change_logs 
WHERE notes = 'Phase 0 test record - safe to delete';

-- ===== STEP 13: Verify Cleanup =====
-- Expected Result: 0
SELECT COUNT(*) as remaining_test_records
FROM change_logs 
WHERE notes = 'Phase 0 test record - safe to delete';

-- ===== STEP 14: Review Structure =====
-- Expected Result: Complete column list
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'change_logs'
ORDER BY ordinal_position;

-- ===== Acceptance Criteria =====
-- [ ] change_logs table created
-- [ ] All indexes created (entity, user, time-based)
-- [ ] RLS enabled and policies active
-- [ ] Test insert/query/delete successful
-- [ ] Table structure verified

-- ===== Benefits =====
-- 1. Complete audit trail for compliance (ISO 27001, SOC 2)
-- 2. Track who changed what and when
-- 3. Before/after snapshots for debugging
-- 4. Support rollback and undo operations
-- 5. Troubleshoot data issues
-- 6. Generate audit reports for management

-- ===== Usage Examples =====
-- Query all changes to a specific vehicle:
--   SELECT * FROM change_logs 
--   WHERE entity_type = 'vehicle' AND entity_id = '<vehicle-uuid>'
--   ORDER BY created_at DESC;
--
-- Query all changes by a user:
--   SELECT * FROM change_logs 
--   WHERE user_id = '<user-uuid>'
--   ORDER BY created_at DESC;
--
-- Query recent changes (last 24 hours):
--   SELECT * FROM change_logs 
--   WHERE created_at > NOW() - INTERVAL '24 hours'
--   ORDER BY created_at DESC;

SELECT 'Task 10: change_logs audit table created successfully.' as status;
