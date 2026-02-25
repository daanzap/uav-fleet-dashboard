# Phase 0 Quick Start - Database Migration

**Ready to Execute** | **Time: ~45 minutes** | **Priority: 🔴 CRITICAL**

---

## 📋 Quick Checklist

```
Prerequisites:
✅ Database backup complete (TODO-0.1)
✅ Seven vehicles verified (TODO-0.2)
□ Supabase SQL Editor open
□ This guide ready

Execution Order:
□ TODO-0.3: Remove vehicles.risk_level (10 min)
□ TODO-0.4: Add soft delete support (15 min)
□ TODO-0.5: Create change_logs table (20 min)

Final Steps:
□ Verify all changes
□ Test frontend
□ Git commit
```

---

## 🚀 Execution Steps

### Open Supabase SQL Editor

🔗 https://supabase.com/dashboard/project/citoiconzejdfjjefnbi

---

### TODO-0.3: Remove Risk Level (10 min)

**File:** `db/09_remove_vehicles_risk_level.sql`

**Quick Commands:**

```sql
-- 1. Check exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'vehicles' AND column_name = 'risk_level';

-- 2. Remove column
ALTER TABLE vehicles DROP COLUMN IF EXISTS risk_level;

-- 3. Verify removed
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'vehicles' AND column_name = 'risk_level';
-- Expected: 0 rows

-- 4. Confirm bookings unchanged
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'risk_level';
-- Expected: 1 row
```

✅ **Done when:** risk_level gone from vehicles, still in bookings

---

### TODO-0.4: Add Soft Delete (15 min)

**File:** `db/10_add_soft_delete.sql`

**Quick Commands:**

```sql
-- 1. Add columns
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 2. Update vehicles RLS
DROP POLICY IF EXISTS "Vehicles are viewable by everyone." ON vehicles;
CREATE POLICY "Vehicles are viewable by everyone." ON vehicles
  FOR SELECT USING (deleted_at IS NULL);

-- 3. Update bookings RLS
DROP POLICY IF EXISTS "Bookings are viewable by everyone." ON bookings;
CREATE POLICY "Bookings are viewable by everyone." ON bookings
  FOR SELECT USING (deleted_at IS NULL);

-- 4. Verify
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('vehicles', 'bookings') AND column_name = 'deleted_at';
-- Expected: 2 rows
```

✅ **Done when:** deleted_at columns added, RLS policies updated

---

### TODO-0.5: Create Change Logs (20 min)

**File:** `db/11_create_change_logs.sql`

**Quick Commands:**

```sql
-- 1. Create table
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

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_change_logs_entity ON change_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_user ON change_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_created ON change_logs(created_at DESC);

-- 3. Enable RLS
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "Change logs are viewable by editors and admins" ON change_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
  );

CREATE POLICY "Authenticated users can insert change logs" ON change_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Verify
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'change_logs';
-- Expected: 1 row
```

✅ **Done when:** Table created, indexes added, RLS active

---

## 🧪 Final Verification

```sql
-- Check all changes
SELECT 
  'vehicles' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'vehicles'
  AND column_name IN ('risk_level', 'deleted_at')
UNION ALL
SELECT 
  'bookings' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN ('risk_level', 'deleted_at')
UNION ALL
SELECT 
  'change_logs' as table_name,
  'TABLE_EXISTS' as column_name,
  'boolean' as data_type
FROM information_schema.tables
WHERE table_name = 'change_logs'
ORDER BY table_name, column_name;
```

**Expected Results:**
- bookings: deleted_at ✅, risk_level ✅
- change_logs: TABLE_EXISTS ✅
- vehicles: deleted_at ✅, risk_level ❌ (should NOT exist)

---

## 🎨 Frontend Test

1. Open http://localhost:5173
2. Check no console errors
3. Click any vehicle → Edit
4. Confirm NO "Risk Level" field
5. Save changes successfully

---

## 📝 Git Commit

```bash
git add .
git commit -m "feat: [Phase-0] Database schema updates (TODO-0.3, 0.4, 0.5)

- Removed vehicles.risk_level column
- Added soft delete support
- Created change_logs audit table
- Updated EditVehicleModal.jsx"

git push origin main
```

---

## 📚 Full Documentation

For detailed step-by-step instructions:
- See: `docs/PHASE_0_EXECUTION_GUIDE.md`

For SQL scripts:
- `db/09_remove_vehicles_risk_level.sql`
- `db/10_add_soft_delete.sql`
- `db/11_create_change_logs.sql`

---

## ⚠️ Troubleshooting

**Error:** "column does not exist"  
→ Already removed, safe to continue

**Error:** "policy already exists"  
→ Use `DROP POLICY IF EXISTS` first

**Vehicles not showing:**  
→ Check RLS policies include `deleted_at IS NULL`

---

**Status:** Ready to Execute  
**Next:** Phase 1 Bug Fixes (after completion)
