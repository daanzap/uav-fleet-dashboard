# Phase 0 Database Migration Scripts

**Status:** Ready to Execute  
**Date:** February 6, 2026

---

## 📁 Files Overview

| File | Purpose | Time | Risk |
|------|---------|------|------|
| `PHASE_0_RUN_ALL.sql` | **All-in-one script** (recommended) | 45 min | 🔴 |
| `09_remove_vehicles_risk_level.sql` | Remove risk_level from vehicles | 10 min | 🔴 |
| `10_add_soft_delete.sql` | Add soft delete support | 15 min | 🟡 |
| `11_create_change_logs.sql` | Create audit table | 20 min | 🟢 |

---

## 🚀 Quick Start (Recommended)

### Execute All Tasks in One Go

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/citoiconzejdfjjefnbi/editor/sql
   ```

2. **Copy Script:**
   ```bash
   cat db/PHASE_0_RUN_ALL.sql
   ```

3. **Paste & Execute:**
   - Paste entire script into SQL Editor
   - Click "Run" button
   - Wait for completion (~45 seconds)

4. **Verify Success:**
   - Check output for ✅ status messages
   - Should see: "Phase 0 Database Migration Complete!"

---

## 📋 What Each Task Does

### Task 8: Remove vehicles.risk_level
**Why:** Risk assessment should be per-booking (dynamic), not fixed to vehicle.

**Changes:**
- ❌ Removes `vehicles.risk_level` column
- ✅ Keeps `bookings.risk_level` (correct location)

**Impact:** 
- Frontend already updated (no risk_level in EditVehicleModal)
- Database schema now matches business logic

---

### Task 9: Add Soft Delete Support
**Why:** Preserve audit trail and enable accidental deletion recovery.

**Changes:**
- ➕ Adds `deleted_at` column to vehicles
- ➕ Adds `deleted_at` column to bookings
- 🔒 Updates RLS policies to hide deleted records

**Impact:**
- Records never truly deleted (set deleted_at = NOW())
- Can restore deleted items
- Maintains data integrity for audit

---

### Task 10: Create change_logs Audit Table
**Why:** Track all changes for compliance and debugging.

**Changes:**
- 📊 New `change_logs` table
- 🔍 Indexes for fast queries
- 🔒 RLS policies (editors/admins only)

**Schema:**
```sql
change_logs (
  id, created_at, user_id, user_email, user_display_name,
  entity_type, entity_id, entity_name,
  action_type, before_snapshot, after_snapshot, changed_fields,
  notes, ip_address
)
```

**Use Cases:**
- "Who changed this vehicle's status?"
- "What was the value before the change?"
- "Show me all changes in the last 7 days"

---

## ✅ Verification Commands

After execution, run these to verify:

```sql
-- 1. Check vehicles structure (NO risk_level, HAS deleted_at)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- 2. Check bookings structure (HAS risk_level, HAS deleted_at)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- 3. Check change_logs exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'change_logs';

-- 4. Count active vehicles (should be 7)
SELECT COUNT(*) as active_vehicles 
FROM vehicles 
WHERE deleted_at IS NULL;

-- 5. Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('vehicles', 'bookings', 'change_logs')
ORDER BY tablename;
```

---

## 🐛 Troubleshooting

### Script Fails at Task 8
**Error:** "column does not exist"  
**Fix:** Skip Task 8, risk_level already removed

### Vehicles Not Showing in Dashboard
**Cause:** RLS policy filtering by department  
**Fix:** Check user's `department` field in profiles table

### Change Logs Not Inserting
**Cause:** RLS blocking inserts  
**Fix:** Verify user is authenticated (not anonymous)

---

## 📝 After Execution

### 1. Update Status
Mark tasks complete in `PHASE_0_EXECUTION_CHECKLIST.md`

### 2. Test Frontend
```bash
npm run dev
# Open http://localhost:5173
# Verify no console errors
# Test vehicle CRUD operations
```

### 3. Git Commit
```bash
git add db/*.sql PHASE_0_EXECUTION_CHECKLIST.md
git commit -m "feat(db): Phase 0 - Database schema updates"
git push origin main
```

### 4. Proceed to Phase 1
See `docs/03_ALL_PHASES_Implementation_Plan.md` for next steps

---

## 🔗 Related Documentation

- **Execution Guide:** `docs/02_PHASE_0_Execution_Guide.md` (detailed steps)
- **Checklist:** `PHASE_0_EXECUTION_CHECKLIST.md` (status tracking)
- **Overview:** `docs/01_PHASE_0_Overview.md` (context & goals)

---

## ⚠️ Important Notes

1. **Backup Required:** Task 8 is destructive (drops column permanently)
2. **One-Way Migration:** Cannot undo without restoring backup
3. **Test First:** Run on staging/dev database first if possible
4. **Atomic Execution:** PHASE_0_RUN_ALL.sql wraps all in transaction
5. **RLS Impact:** Policies updated - test with different user roles

---

**Last Updated:** February 6, 2026  
**Author:** DeltaQuad Development Team  
**Supabase Project:** citoiconzejdfjjefnbi
