# Phase 0 Execution Guide - Database Schema Updates

**Status:** Ready to Execute  
**Priority:** 🔴 CRITICAL  
**Estimated Time:** ~45 minutes  
**Date:** February 4, 2026

---

## Prerequisites

### ✅ Before You Begin

- [ ] Database backup completed (TODO-0.1 ✅)
- [ ] Seven vehicles verified (TODO-0.2 ✅)
- [ ] Supabase SQL Editor open: https://supabase.com/dashboard/project/citoiconzejdfjjefnbi
- [ ] This guide ready for reference

### ⚠️ Important Warnings

1. **Execute in Order**: Follow TODO-0.3 → TODO-0.4 → TODO-0.5
2. **One Step at a Time**: Don't paste entire files at once
3. **Verify Each Step**: Check results before proceeding
4. **No Rollback After Step 2**: ALTER TABLE DROP COLUMN is permanent (backup required)

---

## TODO-0.3: Remove vehicles.risk_level Column

**File:** `db/09_remove_vehicles_risk_level.sql`  
**Time:** ~10 minutes  
**Risk:** 🔴 Destructive (permanent data loss)

### Why This Change?

Risk level should be assessed per-booking (dynamic), not as a fixed vehicle property. This aligns with the business requirement that risk depends on mission context, not the vehicle itself.

### Execution Steps

#### Step 1: Check Current State (1 min)

```sql
-- Verify risk_level exists in vehicles
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND column_name = 'risk_level';
```

**Expected Result:** 1 row showing the column exists

#### Step 2: Remove Column (1 min)

```sql
-- Remove risk_level from vehicles table
ALTER TABLE vehicles DROP COLUMN IF EXISTS risk_level;
```

**Expected Result:** `ALTER TABLE` confirmation

#### Step 3: Verify Removal (1 min)

```sql
-- Confirm column is gone
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND column_name = 'risk_level';
```

**Expected Result:** 0 rows (empty result)

#### Step 4: Verify Bookings Unchanged (1 min)

```sql
-- Confirm bookings.risk_level still exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name = 'risk_level';
```

**Expected Result:** 1 row (bookings.risk_level preserved)

#### Step 5: Review Final Structure (1 min)

```sql
-- List all vehicles table columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;
```

**Expected Result:** Column list WITHOUT risk_level

### Frontend Changes

The following file has been updated:
- ✅ `src/components/EditVehicleModal.jsx` - Removed risk_level from form

### Acceptance Criteria

- [ ] risk_level removed from vehicles table
- [ ] bookings.risk_level still exists
- [ ] EditVehicleModal works without errors
- [ ] Can still create/edit vehicles in UI

---

## TODO-0.4: Add Soft Delete Support

**File:** `db/10_add_soft_delete.sql`  
**Time:** ~15 minutes  
**Risk:** 🟡 Low (additive change)

### Why This Change?

Soft delete preserves data for:
- Audit trails and compliance
- Accidental deletion recovery
- Historical analysis
- Data retention policies

### Execution Steps

#### Step 1: Add deleted_at to vehicles (1 min)

```sql
-- Add soft delete column
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
```

**Expected Result:** `ALTER TABLE` confirmation

#### Step 2: Add deleted_at to bookings (1 min)

```sql
-- Add soft delete column
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
```

**Expected Result:** `ALTER TABLE` confirmation

#### Step 3: Verify Columns Added (1 min)

```sql
-- Confirm both columns exist
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('vehicles', 'bookings')
  AND column_name = 'deleted_at'
ORDER BY table_name;
```

**Expected Result:** 2 rows (one for each table)

#### Step 4: Update Vehicles RLS Policy (2 min)

```sql
-- Drop old policy
DROP POLICY IF EXISTS "Vehicles are viewable by everyone." ON vehicles;

-- Create new policy with soft delete filter
CREATE POLICY "Vehicles are viewable by everyone." ON vehicles
  FOR SELECT USING (deleted_at IS NULL);
```

**Expected Result:** `DROP POLICY` then `CREATE POLICY` confirmation

#### Step 5: Update Bookings RLS Policy (2 min)

```sql
-- Drop old policy
DROP POLICY IF EXISTS "Bookings are viewable by everyone." ON bookings;

-- Create new policy with soft delete filter
CREATE POLICY "Bookings are viewable by everyone." ON bookings
  FOR SELECT USING (deleted_at IS NULL);
```

**Expected Result:** `DROP POLICY` then `CREATE POLICY` confirmation

#### Step 6: Verify RLS Policies (2 min)

```sql
-- Check policies are active
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('vehicles', 'bookings')
  AND policyname IN ('Vehicles are viewable by everyone.', 'Bookings are viewable by everyone.')
ORDER BY tablename;
```

**Expected Result:** 2 rows showing updated policies

#### Step 7: Test Soft Delete (Optional, 3 min)

```sql
-- Pick a test vehicle (replace 'Training_TBD' with actual name)
UPDATE vehicles SET deleted_at = NOW() WHERE name = 'Training_TBD';

-- Verify it's hidden
SELECT COUNT(*) FROM vehicles; 
-- Should be one less than before

-- Restore it
UPDATE vehicles SET deleted_at = NULL WHERE name = 'Training_TBD';

-- Verify it's back
SELECT COUNT(*) FROM vehicles;
-- Should be back to original count
```

**Expected Result:** Count decreases by 1, then returns to original

#### Step 8: Count Visible Vehicles (1 min)

```sql
-- Show only visible vehicles
SELECT COUNT(*) as visible_vehicles FROM vehicles;
```

**Expected Result:** Number of non-deleted vehicles

### Acceptance Criteria

- [ ] deleted_at columns added to both tables
- [ ] RLS policies updated and active
- [ ] Soft delete test passed (optional)
- [ ] Dashboard still shows all vehicles
- [ ] No console errors

---

## TODO-0.5: Create change_logs Audit Table

**File:** `db/11_create_change_logs.sql`  
**Time:** ~20 minutes  
**Risk:** 🟢 None (new table only)

### Why This Change?

Audit trail provides:
- Complete change history
- Who changed what and when
- Before/after snapshots
- Regulatory compliance
- Debugging and troubleshooting

### Execution Steps

#### Step 1: Create Table (2 min)

```sql
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
```

**Expected Result:** `CREATE TABLE` confirmation

#### Step 2: Create Indexes (3 min)

```sql
-- Index for entity lookups
CREATE INDEX IF NOT EXISTS idx_change_logs_entity 
  ON change_logs(entity_type, entity_id);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_change_logs_user 
  ON change_logs(user_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_change_logs_created 
  ON change_logs(created_at DESC);
```

**Expected Result:** 3 `CREATE INDEX` confirmations

#### Step 3: Enable RLS (1 min)

```sql
-- Turn on Row Level Security
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;
```

**Expected Result:** `ALTER TABLE` confirmation

#### Step 4: Create SELECT Policy (2 min)

```sql
-- Only editors and admins can view logs
CREATE POLICY "Change logs are viewable by editors and admins" ON change_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND role IN ('editor', 'admin')
    )
  );
```

**Expected Result:** `CREATE POLICY` confirmation

#### Step 5: Create INSERT Policy (2 min)

```sql
-- Authenticated users can insert logs
CREATE POLICY "Authenticated users can insert change logs" ON change_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

**Expected Result:** `CREATE POLICY` confirmation

#### Step 6: Verify Table Created (1 min)

```sql
-- Confirm table exists
SELECT 
  table_name,
  table_schema,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'change_logs';
```

**Expected Result:** 1 row

#### Step 7: Verify Indexes (2 min)

```sql
-- Check all indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'change_logs'
ORDER BY indexname;
```

**Expected Result:** 4 rows (3 custom + 1 primary key)

#### Step 8: Verify RLS Enabled (1 min)

```sql
-- Confirm RLS is on
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'change_logs';
```

**Expected Result:** rowsecurity = true

#### Step 9: Verify RLS Policies (2 min)

```sql
-- Check policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'change_logs'
ORDER BY policyname;
```

**Expected Result:** 2 rows (SELECT and INSERT policies)

#### Step 10: Test Insert (2 min)

```sql
-- Insert test record
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
```

**Expected Result:** `INSERT 0 1` confirmation

#### Step 11: Query Test Record (1 min)

```sql
-- Find the test record
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
```

**Expected Result:** 1 row with test data

#### Step 12: Clean Up Test (1 min)

```sql
-- Delete test record
DELETE FROM change_logs 
WHERE notes = 'Phase 0 test record - safe to delete';
```

**Expected Result:** `DELETE 1` confirmation

#### Step 13: Verify Cleanup (1 min)

```sql
-- Confirm deletion
SELECT COUNT(*) as remaining_test_records
FROM change_logs 
WHERE notes = 'Phase 0 test record - safe to delete';
```

**Expected Result:** 0

#### Step 14: Review Structure (1 min)

```sql
-- Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'change_logs'
ORDER BY ordinal_position;
```

**Expected Result:** Complete column list

### Acceptance Criteria

- [ ] change_logs table created
- [ ] All indexes created
- [ ] RLS enabled and policies active
- [ ] Test insert/query/delete successful
- [ ] Table structure verified

---

## Phase 0 Completion Checklist

### All Tasks Complete

- [ ] TODO-0.3: vehicles.risk_level removed ✅
- [ ] TODO-0.4: Soft delete support added ✅
- [ ] TODO-0.5: change_logs table created ✅

### Final Verification Tests

```sql
-- 1. Verify vehicles table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;
-- Should NOT include risk_level
-- Should include deleted_at

-- 2. Verify bookings table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
-- Should include risk_level
-- Should include deleted_at

-- 3. Verify change_logs exists
SELECT COUNT(*) as change_logs_exists
FROM information_schema.tables
WHERE table_name = 'change_logs';
-- Should be 1

-- 4. Count active vehicles
SELECT COUNT(*) as active_vehicles
FROM vehicles
WHERE deleted_at IS NULL;
-- Should show all current vehicles

-- 5. Test RLS policies
SELECT policyname, tablename
FROM pg_policies
WHERE tablename IN ('vehicles', 'bookings', 'change_logs')
ORDER BY tablename, policyname;
-- Should show updated policies
```

### Frontend Verification

1. Open Dashboard: http://localhost:5173
2. Check no console errors
3. Verify all vehicles display
4. Click "Edit" on any vehicle
5. Confirm no "Risk Level" field in form
6. Save changes successfully

---

## Git Commit

After all tasks complete and verification passes:

```bash
# Stage all changes
git add .

# Commit with detailed message
git commit -m "feat: [Phase-0] Complete database schema updates (TODO-0.3, 0.4, 0.5)

Schema Changes:
- Removed risk_level column from vehicles table (TODO-0.3)
- Added soft delete support with deleted_at columns (TODO-0.4)
- Created change_logs audit table (TODO-0.5)
- Updated RLS policies for soft delete filtering

Frontend Changes:
- Removed risk_level from EditVehicleModal.jsx
- Updated form to exclude risk_level field

Migration Files:
- db/09_remove_vehicles_risk_level.sql
- db/10_add_soft_delete.sql
- db/11_create_change_logs.sql

Benefits:
- Risk assessment now per-booking only (correct business logic)
- Soft delete preserves audit trail
- Change logs enable complete history tracking

Tested: ✅ All verification steps passed
Closes: TODO-0.3, TODO-0.4, TODO-0.5"

# Push to remote
git push origin main
```

---

## Troubleshooting

### Error: "column does not exist"

**Problem:** Trying to drop risk_level but it doesn't exist  
**Solution:** Use `DROP COLUMN IF EXISTS` (already in script)

### Error: "policy already exists"

**Problem:** RLS policy wasn't dropped before recreating  
**Solution:** Use `DROP POLICY IF EXISTS` (already in script)

### Error: "permission denied"

**Problem:** Not enough database privileges  
**Solution:** Ensure you're logged in as admin in Supabase

### Vehicles Not Showing in Dashboard

**Problem:** RLS policy too restrictive  
**Solution:** Check RLS policies, ensure deleted_at IS NULL clause

### Change Logs Not Inserting

**Problem:** RLS blocking inserts  
**Solution:** Verify INSERT policy exists and auth.role() = 'authenticated'

---

## Next Steps

After Phase 0 completion:

1. **Phase 1: Bug Fixes** (TODO-1.1 through TODO-1.4)
2. Implement change log integration in frontend
3. Add soft delete UI (restore deleted items)
4. Create admin panel for viewing change logs

See: `IMPLEMENTATION_PLAN.md` for Phase 1 details

---

**Phase 0 Status:** 🔄 IN PROGRESS  
**Completion Date:** _____________

---

## Support

If you encounter issues:

1. Check this troubleshooting section
2. Review SQL error messages carefully
3. Verify database backup exists
4. Test changes in Supabase SQL Editor
5. Check browser console for frontend errors

**Database Backup Location:** `backups/backup_20260204_phase0_pre_implementation.sql`
