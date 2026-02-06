# Conflict Analysis & Risk Assessment

**Document Version:** 1.0  
**Date:** February 4, 2026  
**Status:** Pre-Implementation Review

---

## Executive Summary

This document identifies potential conflicts, risks, and incompatibilities between:
1. **Original PRD requirements**
2. **New feature requests**
3. **Current codebase implementation**
4. **Database schema**

**Critical Findings:** 3 Major Conflicts, 5 Medium Risks, 8 Minor Issues

---

## 🚨 Critical Conflicts (Must Fix Before Implementation)

### Conflict #1: Risk Level Field Location

**Issue:**
- **PRD Requirement:** Risk Level should only be in Bookings (Section 3.2)
- **Current Implementation:** Risk Level exists in BOTH `vehicles` table AND `bookings` table
- **User Requirement:** Risk Level should ONLY be in booking functions

**Impact:**
- High: Data model confusion
- Database has redundant column that violates single source of truth
- Frontend shows Risk Level in EditVehicleModal (incorrect)

**Resolution Required:**
```sql
-- MUST RUN BEFORE NEW FEATURES:
-- 1. Remove risk_level from vehicles table
ALTER TABLE vehicles DROP COLUMN IF EXISTS risk_level;

-- 2. Ensure risk_level exists in bookings (already exists)
-- ALTER TABLE bookings ADD COLUMN risk_level text CHECK (risk_level IN ('Low', 'Medium', 'High'));
```

**Frontend Changes:**
- Remove Risk Level from `EditVehicleModal.jsx` (lines 24, 133-142)
- Keep Risk Level ONLY in `BookingModal.jsx` (already correct)

**Risk if Not Fixed:**
- Users will be confused about where Risk Level belongs
- Data inconsistency (vehicle risk vs booking risk)
- Future bugs when risk levels don't match

---

### Conflict #2: Seven Vehicles Display Issue

**Issue:**
- **PRD Section 3.1:** Dashboard should display 7 specific vehicles
- **constants.js:** Defines 7 allowed vehicle names
- **SQL Script:** `08_vehicles_seven_names.sql` exists but may not be executed
- **Current Behavior:** Vehicles not showing after creation

**Impact:**
- High: Users cannot see their vehicles
- Core functionality broken

**Root Cause Analysis:**
1. Database may have vehicles with names NOT in the allowlist
2. Dashboard filters vehicles by `ALLOWED_VEHICLE_NAMES` (Dashboard.jsx line 48)
3. If vehicle names don't match exactly, they're filtered out

**Resolution Required:**
```sql
-- MUST VERIFY IN DATABASE:
-- 1. Check current vehicle names
SELECT id, name, department FROM vehicles ORDER BY name;

-- 2. If names don't match the 7 allowed names, run:
-- Execute db/08_vehicles_seven_names.sql in Supabase SQL Editor

-- 3. Verify result (should return exactly 7 rows):
SELECT name FROM vehicles ORDER BY name;
-- Expected output:
-- RD-117
-- RD-125
-- RD-652 (TBD)
-- RD-931
-- RD-High Altitude
-- Training-933
-- Training_TBD
```

**Frontend Changes:**
- Change EditVehicleModal to use DROPDOWN for vehicle name selection (not free text input)
- This prevents users from creating vehicles with invalid names

**Risk if Not Fixed:**
- Users create vehicles that immediately disappear
- Data integrity issues
- User frustration and loss of data

---

### Conflict #3: Hardware Configuration Data Structure

**Issue:**
- **Current Implementation:** `hw_config` is stored as plain text with `{ raw: "..." }` wrapper
- **PRD Requirement:** JSONB structure for flexibility
- **New Requirement:** Structured hardware config with checkboxes (Radio, GPS, Frequency, etc.)
- **Incompatibility:** Plain text cannot support structured queries or validation

**Impact:**
- Critical: Cannot implement new hardware configuration UI without data migration
- Existing hardware configs are in incompatible format

**Current Data Structure (WRONG):**
```json
{
  "raw": "Skynode SN-1024, Here3, SolidState-22Ah"
}
```

**Required Data Structure (CORRECT):**
```json
{
  "radio": {
    "h30": { "enabled": false, "notes": "" },
    "silvus": { "enabled": true, "notes": "Standard config" },
    "radioNor": { "enabled": false, "notes": "" },
    "custom": { "enabled": false, "value": "" }
  },
  "frequencyBand": {
    "s": true,
    "c": true,
    "l": false,
    "custom": ""
  },
  "visualNavigation": {
    "enabled": true
  },
  "gps": {
    "holyBro": { "enabled": true, "notes": "Default GPS" },
    "hardenGps": { "enabled": false, "notes": "" },
    "arcXL": { "enabled": false, "notes": "" },
    "custom": { "enabled": false, "value": "" }
  }
}
```

**Resolution Required:**
```sql
-- Migration script to convert existing data
UPDATE vehicles
SET hw_config = jsonb_build_object(
  'legacy_text', hw_config->'raw',
  'radio', jsonb_build_object(
    'h30', jsonb_build_object('enabled', false, 'notes', ''),
    'silvus', jsonb_build_object('enabled', false, 'notes', ''),
    'radioNor', jsonb_build_object('enabled', false, 'notes', ''),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  ),
  'frequencyBand', jsonb_build_object(
    's', false,
    'c', false,
    'l', false,
    'custom', ''
  ),
  'visualNavigation', jsonb_build_object('enabled', false),
  'gps', jsonb_build_object(
    'holyBro', jsonb_build_object('enabled', false, 'notes', ''),
    'hardenGps', jsonb_build_object('enabled', false, 'notes', ''),
    'arcXL', jsonb_build_object('enabled', false, 'notes', ''),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  )
)
WHERE hw_config IS NOT NULL AND hw_config ? 'raw';
```

**Risk if Not Fixed:**
- Cannot implement new hardware configuration modal
- Data loss when migrating to new structure
- Booking snapshots will be incompatible

---

## ⚠️ Medium Risks (Address During Implementation)

### Risk #1: Soft Delete Implementation Missing

**Issue:**
- User requires soft delete (deleted_at column)
- Current schema does NOT have `deleted_at` columns
- Queries do not filter out deleted records

**Impact:**
- Deleted vehicles/bookings will still appear in lists
- Cannot implement "undo delete" feature
- Audit trail incomplete

**Resolution:**
```sql
-- Add deleted_at columns
ALTER TABLE vehicles ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Update RLS policies to exclude soft-deleted records
CREATE POLICY "Hide deleted vehicles" ON vehicles
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Hide deleted bookings" ON bookings
  FOR SELECT USING (deleted_at IS NULL);
```

**Frontend Changes:**
- All queries must add `WHERE deleted_at IS NULL` or use `.is('deleted_at', null)`
- Delete buttons should UPDATE instead of DELETE

---

### Risk #2: Change Logs Table Does Not Exist

**Issue:**
- User requires audit trail of ALL changes
- `change_logs` table not created yet
- Current `activities` table is insufficient (no before/after snapshots)

**Impact:**
- Cannot track "who changed what and when"
- Compliance issues
- Cannot debug data changes

**Resolution:**
```sql
-- Create change_logs table (see MIGRATION_PLAN.md for full schema)
CREATE TABLE change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  user_display_name text,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  entity_name text,
  action_type text NOT NULL,
  before_snapshot jsonb,
  after_snapshot jsonb,
  changed_fields jsonb,
  notes text,
  ip_address text
);
```

**Frontend Changes:**
- Every UPDATE/DELETE operation must log to `change_logs`
- Implement "Change History" viewer component

---

### Risk #3: Logo Not Displaying

**Issue:**
- Logo file exists at `src/assets/logo.png`
- Header.jsx imports logo correctly (line 5)
- But logo may not display on page

**Possible Causes:**
1. Image file is corrupted
2. Vite build not copying assets correctly
3. CSS issue (height/width)
4. Path issue in production build

**Resolution:**
- Verify logo file integrity
- Check browser console for 404 errors
- Ensure `vite.config.js` includes assets properly
- Test in both dev and production builds

---

### Risk #4: Vehicle Data Persistence

**Issue:**
- User reports: "After I added the vehicle, I saved it, but when I jump back to dashboard page, it's gone."

**Root Cause (Most Likely):**
1. **Vehicle name not in allowlist** → Filtered out by frontend
2. **RLS policy blocking** → User doesn't have permission to see vehicle
3. **Department mismatch** → User's department doesn't match vehicle department
4. **No refresh after save** → `fetchVehicles()` not called

**Resolution:**
```javascript
// EditVehicleModal.jsx - Ensure onSave callback is called
const handleSubmit = async (e) => {
  e.preventDefault();
  // ... save logic ...
  
  if (error) throw error;
  
  await supabase.from('activities').insert({...});
  
  onClose();
  if (onSave) onSave(); // ← CRITICAL: Must call this
};

// Dashboard.jsx - Ensure callback is passed
<EditVehicleModal
  vehicle={editingVehicle}
  onClose={() => setEditingVehicle(null)}
  onSave={fetchVehicles}  // ← CRITICAL: Must pass this
/>
```

**Additional Check:**
- Verify vehicle department matches user's department (for non-admin users)
- Check Supabase RLS logs for permission denials

---

### Risk #5: Profile Display Name Not Syncing

**Issue:**
- Profile page has "User Name" field (nickname)
- Should sync to booking's "Who Ordered" field
- May not be updating across all components

**Resolution:**
- Ensure `AuthContext` updates `displayName` state after save
- All components using user name should read from `AuthContext.displayName`
- Backend should join `profiles.display_name` when fetching bookings

---

## 🔶 Minor Issues (Nice to Have)

### Issue #1: Department RLS Not Implemented
**Current:** All users can see all vehicles (line 49 in schema.sql)  
**PRD Requirement:** Marketing users should NOT see R&D vehicles  
**Fix:** Update RLS policies (see db/06_department_rls.sql)

### Issue #2: Hardware Snapshot Not Automatic
**Current:** Snapshot must be manually copied  
**PRD Requirement:** Automatic snapshot on booking creation  
**Fix:** Use database trigger or backend API logic

### Issue #3: Calendar Week Numbers Missing
**PRD Requirement:** Monthly view must show ISO 8601 week numbers  
**Current:** CalendarOverviewModal.jsx does not show week numbers  
**Fix:** Add week number column to calendar UI

### Issue #4: Conflict Warning Not Visible Enough
**Current:** Small warning text in BookingModal  
**PRD Requirement:** Toast notification style warning  
**Fix:** Use more prominent warning banner with visual indicator

### Issue #5: No "My Bookings" Page
**User Requirement:** Independent page to view and delete own bookings  
**Current:** No such page exists  
**Fix:** Create new page (part of Phase 4)

### Issue #6: Missing Delete Functionality
**User Requirement:** Delete vehicles (admin only) and bookings  
**Current:** No delete buttons in UI  
**Fix:** Add delete buttons with confirmation dialogs

### Issue #7: No Hardware Config Database
**User Requirement:** Hardware presets and validation  
**Current:** Free-form text input only  
**Fix:** Create hardware_config_presets table (optional)

### Issue #8: Google OAuth Redirect Issues
**Observed:** OAuth flow may fail in some environments  
**Current:** Works on Vercel but may fail on company server  
**Fix:** Test thoroughly and configure correct redirect URLs

---

## 🔒 Database Integrity Risks

### Risk A: Foreign Key Cascades
**Issue:** If a user is deleted, what happens to their bookings?  
**Current:** `ON DELETE SET NULL` (user_id becomes null)  
**Recommendation:** Keep as-is (preserve booking history even if user deleted)

### Risk B: Orphaned Bookings
**Issue:** If a vehicle is soft-deleted, bookings may reference non-existent vehicle  
**Resolution:** UI must handle `vehicles.deleted_at IS NOT NULL` gracefully

### Risk C: JSONB Query Performance
**Issue:** Complex hardware config queries may be slow  
**Resolution:** Add GIN indexes on hw_config column if needed:
```sql
CREATE INDEX idx_vehicles_hw_config_gin ON vehicles USING GIN (hw_config);
```

### Risk D: Concurrent Booking Conflicts
**Issue:** Two users book same vehicle at same time (race condition)  
**Current:** Soft lock allows both bookings (by design)  
**PRD Requirement:** This is INTENTIONAL (soft lock, not hard lock)  
**No fix needed:** Working as designed

---

## 📊 Priority Matrix

| Issue | Severity | Impact on Users | Fix Complexity | Fix Before Phase |
|-------|----------|-----------------|----------------|------------------|
| Risk Level in Vehicles | 🔴 Critical | High | Low | Phase 1 |
| Seven Vehicles Not Showing | 🔴 Critical | High | Low | Phase 1 |
| Hardware Config Structure | 🔴 Critical | High | Medium | Phase 5 |
| Soft Delete Missing | 🟡 High | Medium | Low | Phase 4 |
| Change Logs Missing | 🟡 High | Medium | Medium | Phase 3 |
| Logo Not Showing | 🟡 High | Low | Low | Phase 1 |
| Vehicle Data Persistence | 🟡 High | High | Low | Phase 1 |
| Profile Name Sync | 🟡 High | Low | Low | Phase 2 |
| Department RLS | 🟢 Medium | Medium | Medium | Phase 2 |
| Hardware Snapshot | 🟢 Medium | Medium | Low | Phase 3 |
| Calendar Week Numbers | 🟢 Low | Low | Low | Phase 3 |
| Conflict Warning Style | 🟢 Low | Low | Low | Phase 2 |

---

## ✅ Recommended Fix Order

### Pre-Implementation (DO FIRST)
1. ✅ Execute `08_vehicles_seven_names.sql` in Supabase
2. ✅ Remove `risk_level` from vehicles table
3. ✅ Verify logo file is valid
4. ✅ Add `deleted_at` columns to vehicles and bookings
5. ✅ Create `change_logs` table

### Phase 1: Bug Fixes
1. Fix logo display
2. Fix vehicle persistence (ensure name is in allowlist)
3. Remove Risk Level from EditVehicleModal
4. Verify seven vehicles display correctly

### Phase 2: Core Adjustments
1. Fix Profile display name sync
2. Update Department RLS policies
3. Improve conflict warning UI

### Phase 3: Audit System
1. Implement change logging in all edit operations
2. Add hardware snapshot trigger/logic
3. Add week numbers to calendar

### Phase 4: Delete Functions
1. Implement soft delete for vehicles (admin only)
2. Create "My Bookings" page
3. Add delete booking functionality

### Phase 5: Hardware Config
1. Migrate existing hw_config data to new structure
2. Implement HardwareConfigModal component
3. Test hardware snapshots in bookings

---

## 🛡️ Risk Mitigation Strategies

### Strategy 1: Database Backup Before Any Schema Change
```bash
# ALWAYS run before ALTER TABLE or UPDATE
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Strategy 2: Test in Development First
- Create test Supabase project
- Run all migrations there first
- Verify no data loss
- Only then apply to production

### Strategy 3: Feature Flags
- Implement new features behind feature flags
- Enable for admin users first
- Gradually roll out to all users

### Strategy 4: Rollback Plan
- Keep old code in git branches
- Document how to revert each change
- Test rollback procedure

---

## 📋 Pre-Implementation Checklist

Before starting any phase:

- [ ] Full database backup created
- [ ] All conflicts in this document reviewed
- [ ] Schema changes planned and scripted
- [ ] RLS policies verified
- [ ] Test environment prepared
- [ ] Rollback plan documented
- [ ] Team notified of upcoming changes

---

**Document End**

*Review this document before starting implementation to avoid costly mistakes.*
