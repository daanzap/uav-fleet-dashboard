# Phase 0 Execution Checklist

**Status:** 🔄 Ready to Execute  
**Date:** February 6, 2026  
**Estimated Time:** ~45 minutes

---

## 📋 Pre-Execution Checklist

- [ ] **Database Backup**: Ensure recent backup exists
- [ ] **Supabase Access**: Open SQL Editor at https://supabase.com/dashboard/project/citoiconzejdfjjefnbi
- [ ] **Read Documentation**: Review `docs/02_PHASE_0_Execution_Guide.md`
- [ ] **Clear Schedule**: Block 45 minutes uninterrupted time

---

## 🚀 Execution Options

### Option A: All-in-One Script (Recommended)

Execute the complete Phase 0 migration in one go:

**File:** `db/PHASE_0_RUN_ALL.sql`

**Steps:**
1. Open Supabase SQL Editor
2. Copy entire contents of `db/PHASE_0_RUN_ALL.sql`
3. Paste into SQL Editor
4. Click "Run" button
5. Review verification output
6. Ensure all tasks show ✅ status

**Benefits:**
- ✅ Single execution
- ✅ Built-in verification
- ✅ Atomic transaction
- ✅ Clear success/failure indicators

---

### Option B: Step-by-Step Execution

Execute each task separately for maximum control:

#### Task 8: Remove vehicles.risk_level (10 min)
- [ ] File: `db/09_remove_vehicles_risk_level.sql`
- [ ] Execute all steps sequentially
- [ ] Verify: risk_level removed from vehicles
- [ ] Verify: bookings.risk_level still exists

#### Task 9: Add Soft Delete Support (15 min)
- [ ] File: `db/10_add_soft_delete.sql`
- [ ] Execute all steps sequentially
- [ ] Verify: deleted_at columns added
- [ ] Verify: RLS policies updated

#### Task 10: Create change_logs Table (20 min)
- [ ] File: `db/11_create_change_logs.sql`
- [ ] Execute all steps sequentially
- [ ] Verify: Table, indexes, and RLS created
- [ ] Test: Insert and delete test record

---

## ✅ Post-Execution Verification

### 1. Database Verification

Run these queries in Supabase SQL Editor:

```sql
-- Check vehicles table structure (should NOT have risk_level, SHOULD have deleted_at)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- Check bookings table structure (SHOULD have both risk_level and deleted_at)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- Check change_logs exists
SELECT COUNT(*) as change_logs_exists
FROM information_schema.tables
WHERE table_name = 'change_logs';

-- Count active vehicles
SELECT COUNT(*) as active_vehicles
FROM vehicles
WHERE deleted_at IS NULL;

-- Verify RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('vehicles', 'bookings', 'change_logs')
ORDER BY tablename, policyname;
```

**Expected Results:**
- ✅ vehicles: NO risk_level, HAS deleted_at
- ✅ bookings: HAS risk_level, HAS deleted_at
- ✅ change_logs: EXISTS with proper structure
- ✅ All RLS policies active with soft delete filters

---

### 2. Frontend Verification

**Local Development:**
```bash
cd /Users/alexchang/DQ\ Fleet/uav-fleet-dashboard
npm run dev
```

**Checklist:**
- [ ] Open: http://localhost:5173
- [ ] Login: Successful Google OAuth
- [ ] Dashboard: All vehicles display correctly
- [ ] Console: No errors in browser DevTools
- [ ] Edit Vehicle: Modal opens without errors
- [ ] Form: NO "Risk Level" field present
- [ ] Save: Vehicle update works
- [ ] Create: New vehicle creation works

---

### 3. Data Integrity Checks

```sql
-- Verify no vehicles accidentally soft-deleted
SELECT 
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_count,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_count
FROM vehicles;
-- Expected: deleted_count = 0, active_count = 7

-- Verify no bookings accidentally soft-deleted
SELECT 
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_count,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_count
FROM bookings;
-- Expected: deleted_count = 0

-- Check change_logs is empty (no data before implementation)
SELECT COUNT(*) as log_count FROM change_logs;
-- Expected: 0 (or just test records)
```

---

## 🐛 Troubleshooting

### Error: "column does not exist"
**Cause:** Trying to drop risk_level but it doesn't exist  
**Solution:** Script uses `IF EXISTS` - should not occur

### Error: "policy already exists"
**Cause:** Policy wasn't dropped before recreating  
**Solution:** Script uses `DROP POLICY IF EXISTS` - should not occur

### Error: "permission denied"
**Cause:** Insufficient database privileges  
**Solution:** Ensure logged in as project admin in Supabase

### Vehicles Not Showing in Dashboard
**Cause:** RLS policy too restrictive  
**Solution:** Check user's `department` field in profiles table

### Frontend Errors After Migration
**Cause:** Caching or old queries referencing risk_level  
**Solution:** Clear browser cache, restart dev server

---

## 📝 Git Commit

After successful execution and verification:

```bash
# Stage database migration files
git add db/09_remove_vehicles_risk_level.sql
git add db/10_add_soft_delete.sql
git add db/11_create_change_logs.sql
git add db/PHASE_0_RUN_ALL.sql
git add PHASE_0_EXECUTION_CHECKLIST.md

# Commit with detailed message
git commit -m "feat(db): Phase 0 - Database schema updates (Tasks 8-10)

Schema Changes:
- Remove risk_level column from vehicles table (Task 8)
- Add soft delete support with deleted_at columns (Task 9)
- Create change_logs audit table (Task 10)
- Update RLS policies for soft delete filtering

Migration Files:
- db/09_remove_vehicles_risk_level.sql
- db/10_add_soft_delete.sql
- db/11_create_change_logs.sql
- db/PHASE_0_RUN_ALL.sql (all-in-one execution)

Frontend Status:
- EditVehicleModal already updated (risk_level removed)
- No code changes required

Database Impact:
- DESTRUCTIVE: vehicles.risk_level permanently removed
- ADDITIVE: deleted_at columns enable soft delete
- ADDITIVE: change_logs enables audit trail

Testing:
- ✅ All verification steps passed
- ✅ Frontend displays vehicles correctly
- ✅ CRUD operations working
- ✅ No console errors

Closes: TODO-0.3, TODO-0.4, TODO-0.5
Next: Phase 1 (Bug Fixes)"

# Push to remote
git push origin main
```

---

## 🎯 Success Criteria

Phase 0 is complete when ALL criteria met:

### Database:
- ✅ vehicles.risk_level column removed
- ✅ bookings.risk_level column preserved
- ✅ deleted_at columns added to vehicles and bookings
- ✅ RLS policies updated with soft delete filters
- ✅ change_logs table created with indexes and RLS

### Frontend:
- ✅ Dashboard displays all vehicles
- ✅ No console errors
- ✅ Edit Vehicle modal works (no risk_level field)
- ✅ Vehicle CRUD operations successful
- ✅ Bookings still work correctly

### Code Quality:
- ✅ Migration scripts well-documented
- ✅ Verification queries included
- ✅ Git commit with detailed message
- ✅ Changes pushed to remote

---

## 📊 Progress Tracking

| Task | File | Time | Status |
|------|------|------|--------|
| Task 8 | `09_remove_vehicles_risk_level.sql` | 10 min | ⬜ |
| Task 9 | `10_add_soft_delete.sql` | 15 min | ⬜ |
| Task 10 | `11_create_change_logs.sql` | 20 min | ⬜ |
| **Total** | | **45 min** | **⬜** |

**Update this table after execution:**
- ⬜ Not Started
- 🔄 In Progress
- ✅ Complete
- ❌ Failed

---

## 🔜 Next Steps

After Phase 0 completion:

1. **Phase 1: Bug Fixes** (TODO-1.1 through TODO-1.4)
   - Fix booking time conflicts
   - Improve error handling
   - Add loading states
   - Enhance UX

2. **Integrate change_logs in Frontend**
   - Display change history in vehicle details
   - Show "who changed what" audit trail
   - Add "View History" button

3. **Implement Soft Delete UI**
   - Add "Restore" functionality for deleted items
   - Admin panel to view deleted vehicles
   - Soft delete confirmation dialogs

4. **Create Admin Panel for Change Logs**
   - Filter by date range
   - Filter by user
   - Export audit reports

---

## 📚 Reference Documentation

- **Detailed Guide:** `docs/02_PHASE_0_Execution_Guide.md`
- **Overview:** `docs/01_PHASE_0_Overview.md`
- **All Phases:** `docs/03_ALL_PHASES_Implementation_Plan.md`
- **Database Setup:** `docs/DEV_Database_Setup.md`

---

**Phase 0 Status:** 🔄 READY TO EXECUTE  
**Last Updated:** February 6, 2026  
**Executed By:** _______________  
**Execution Date:** _______________  
**Verification:** _______________
