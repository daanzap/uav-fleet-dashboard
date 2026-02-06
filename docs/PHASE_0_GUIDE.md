# Phase 0: Pre-Implementation Guide

**🔴 CRITICAL: Complete ALL of Phase 0 before proceeding to Phase 1**

---

## Phase 0 Overview

| TODO | Title | Priority | Time | Status |
|------|-------|----------|------|--------|
| 0.1 | Database Backup | 🔴 CRITICAL | 15 min | ⬜ |
| 0.2 | Execute Seven Vehicles SQL | 🔴 CRITICAL | 10 min | ⬜ |
| 0.3 | Remove Risk Level Column | 🔴 CRITICAL | 15 min | ⬜ |
| 0.4 | Add Soft Delete Columns | 🔴 CRITICAL | 20 min | ⬜ |
| 0.5 | Create Change Logs Table | 🟡 HIGH | 20 min | ⬜ |

**Total Time:** ~2-3 hours (including testing)

---

## TODO-0.1: Database Backup ⬜

### Quick Steps:
1. Go to: https://supabase.com/dashboard/project/citoiconzejdfjjefnbi
2. Navigate: Database → Backups
3. Click: "Create backup"
4. Download backup file
5. Save to: `backups/backup_20260204_phase0_pre_implementation.sql`
6. Verify file size > 1MB

### Acceptance Criteria:
- [ ] Backup file downloaded
- [ ] File size > 1MB
- [ ] Can open and view SQL content

### Files:
- See: `backups/BACKUP_CHECKLIST.md` for detailed steps
- See: `backups/README.md` for backup procedures

---

## TODO-0.2: Execute Seven Vehicles SQL ⬜

### Why:
Current database might have < 7 vehicles or incorrect names. This script ensures exactly 7 vehicles exist with correct names matching `constants.js`.

### Quick Steps:
1. Open: `db/08_vehicles_seven_names.sql`
2. Copy entire content
3. Go to: Supabase SQL Editor
4. Paste and execute
5. Verify: `SELECT name FROM vehicles ORDER BY name;`
6. Should return exactly 7 rows

### Acceptance Criteria:
- [ ] Exactly 7 vehicles in database
- [ ] Names match ALLOWED_VEHICLE_NAMES in constants.js
- [ ] All vehicles visible on Dashboard

### Expected Vehicle Names:
1. Albatross
2. Bluebird
3. Condor
4. Dragonfly
5. Falcon
6. Heron
7. Kestrel

---

## TODO-0.3: Remove Risk Level Column ⬜

### Why:
`risk_level` field should only be in **bookings**, not in **vehicles**. This was incorrectly added to vehicles table.

### ⚠️ WARNING: DESTRUCTIVE OPERATION
- Risk level data in vehicles table will be **permanently deleted**
- Risk level in bookings table remains **unchanged**
- **BACKUP REQUIRED** before proceeding

### Quick Steps:
1. Verify TODO-0.1 backup exists
2. Go to: Supabase SQL Editor
3. Execute:
```sql
ALTER TABLE vehicles DROP COLUMN IF EXISTS risk_level;
```
4. Verify column removed:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'vehicles' AND column_name = 'risk_level';
-- Should return 0 rows
```

### Acceptance Criteria:
- [ ] risk_level column removed from vehicles
- [ ] Bookings table still has risk_level (unchanged)
- [ ] EditVehicleModal updated (separate step)
- [ ] No errors in console

### Code Changes:
- Update: `src/components/EditVehicleModal.jsx`
  - Remove risk_level from formData
  - Remove risk_level form field
  - Remove risk_level from payload

---

## TODO-0.4: Add Soft Delete Columns ⬜

### Why:
Instead of permanently deleting records (hard delete), we'll mark them as deleted (soft delete). This preserves data for audit trails.

### Quick Steps:
1. Go to: Supabase SQL Editor
2. Execute:

```sql
-- Add deleted_at columns
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Update RLS policies to hide deleted records
DROP POLICY IF EXISTS "Vehicles are viewable by everyone." ON vehicles;
CREATE POLICY "Vehicles are viewable by everyone." ON vehicles
  FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Bookings are viewable by everyone." ON bookings;
CREATE POLICY "Bookings are viewable by everyone." ON bookings
  FOR SELECT USING (deleted_at IS NULL);
```

3. Verify columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('vehicles', 'bookings') 
  AND column_name = 'deleted_at';
```

4. Test soft delete:
```sql
-- Pick a test vehicle
UPDATE vehicles SET deleted_at = NOW() WHERE name = 'Kestrel';

-- Verify it's hidden
SELECT * FROM vehicles WHERE name = 'Kestrel';
-- Should return 0 rows

-- Restore it
UPDATE vehicles SET deleted_at = NULL WHERE name = 'Kestrel';

-- Verify it's back
SELECT * FROM vehicles WHERE name = 'Kestrel';
-- Should return 1 row
```

### Acceptance Criteria:
- [ ] deleted_at column added to vehicles
- [ ] deleted_at column added to bookings
- [ ] RLS policies updated
- [ ] Soft-deleted records hidden from UI
- [ ] Test: Set deleted_at, verify hidden

---

## TODO-0.5: Create Change Logs Table ⬜

### Why:
Audit trail for all changes to vehicles, bookings, and profiles. Tracks who changed what and when.

### Quick Steps:
1. Go to: Supabase SQL Editor
2. Execute:

```sql
CREATE TABLE IF NOT EXISTS change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_display_name text,
  entity_type text NOT NULL CHECK (entity_type IN ('vehicle', 'booking', 'profile')),
  entity_id uuid NOT NULL,
  entity_name text,
  action_type text NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  before_snapshot jsonb,
  after_snapshot jsonb,
  changed_fields jsonb,
  notes text,
  ip_address text
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_change_logs_entity ON change_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_user ON change_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_created ON change_logs(created_at DESC);

-- RLS policies
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Change logs are viewable by editors and admins" ON change_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
  );

CREATE POLICY "Authenticated users can insert change logs" ON change_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

3. Verify table created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'change_logs';
```

4. Test insert:
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
  'Phase 0 test record'
);

-- Verify insert
SELECT * FROM change_logs ORDER BY created_at DESC LIMIT 1;

-- Clean up test record
DELETE FROM change_logs WHERE notes = 'Phase 0 test record';
```

### Acceptance Criteria:
- [ ] change_logs table created
- [ ] All indexes created
- [ ] RLS policies working
- [ ] Can insert test record
- [ ] Can query records

---

## Phase 0 Completion Checklist

### Before Moving to Phase 1:
- [ ] TODO-0.1: Database backed up ✅
- [ ] TODO-0.2: Seven vehicles verified ✅
- [ ] TODO-0.3: risk_level removed from vehicles ✅
- [ ] TODO-0.4: Soft delete columns added ✅
- [ ] TODO-0.5: change_logs table created ✅

### Verification Tests:
- [ ] Dashboard shows 7 vehicles
- [ ] No console errors
- [ ] Can create new booking
- [ ] Can edit vehicle (without risk_level field)
- [ ] Database backup exists and is valid

### Git:
```bash
# Commit Phase 0 changes
git add .
git commit -m "feat: [Phase-0] Complete pre-implementation database setup

- Database backup created
- Seven vehicles ensured (Albatross, Bluebird, Condor, Dragonfly, Falcon, Heron, Kestrel)
- Removed risk_level column from vehicles table
- Added soft delete support (deleted_at columns)
- Created change_logs table for audit trail
- Updated RLS policies

Closes TODO-0.1, TODO-0.2, TODO-0.3, TODO-0.4, TODO-0.5"

git push origin main
```

---

## Next Steps

After Phase 0 is complete, proceed to:
- **Phase 1: Bug Fixes** (TODO-1.1 through TODO-1.4)

See: `IMPLEMENTATION_PLAN.md` for details

---

## Troubleshooting

### "Cannot connect to Supabase"
- Check: `.env` file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Verify: Internet connection
- Verify: Supabase project is active

### "SQL query failed"
- Copy error message
- Check if table/column already exists
- Use `IF EXISTS` or `IF NOT EXISTS` clauses
- Verify you have database admin permissions

### "Backup file is empty"
- Verify backup completed in Supabase dashboard
- Try creating new backup
- Use alternative: pg_dump method (see backups/README.md)

### "Dashboard shows fewer than 7 vehicles"
- Re-run TODO-0.2 script
- Check for errors in browser console
- Verify RLS policies allow you to see vehicles
- Check your user role in profiles table

---

**Phase 0 Status:** ⬜ NOT STARTED / 🔄 IN PROGRESS / ✅ COMPLETE

**Completion Date:** _____________
