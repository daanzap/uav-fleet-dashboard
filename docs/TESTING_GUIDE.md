# Testing Guide - Dynamic Vehicle Management

**Fix Date:** February 4, 2026  
**Testing Purpose:** Verify dynamic vehicle management functionality works correctly

---

## ✅ Fixes Completed Confirmation

### Modified Files:
- ✅ `src/lib/constants.js` - Removed fixed list restriction
- ✅ `src/pages/Dashboard.jsx` - Removed filtering logic
- ✅ `src/components/EditVehicleModal.jsx` - Added naming guidance and soft validation
- ✅ `db/08_cleanup_test_vehicles.sql` - New cleanup script (safe)
- ✅ Build test passed ✅

---

## 🚀 Quick Test (5 minutes)

### Step 1: Start Development Server

```bash
cd c:\Users\alex.chang\.claude\uav-fleet-dashboard
npm run dev
```

Should display:
```
  VITE v6.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

### Step 2: Open Dashboard

1. Navigate to: `http://localhost:5173/`
2. Login with your account
3. View Dashboard

**Expected Result:**
- ✅ Should see **all 9 vehicles** (if you kept all)
- ✅ Grid layout
- ✅ One card per vehicle
- ✅ No Console errors (press F12 to check)

**Currently should display:**
1. RD-117 (HD)
2. RD-125(??)
3. RD-652 (TBD)
4. RD-931 (OOO)
5. RD-High Altitude
6. RD-Test
7. Training-933
8. Training_TBD
9. 123

---

### Step 3: Test Adding Vehicle

#### Test 3A: Compliant Naming

1. Click "Add Vehicle" button in top right
2. See naming convention guide box (blue background) ✅
3. Enter data:
   - **Name:** `RD-999`
   - **Status:** Available
   - **Department:** R&D
   - **Hardware Config:** Test Config
   - **Software Version:** v1.0.0
   - **Notes:** Testing new vehicle
4. Click "Create Vehicle"

**Expected Result:**
- ✅ Save successful
- ✅ Modal closes
- ✅ Dashboard immediately shows RD-999 (total 10 vehicles)
- ✅ No warning message

---

#### Test 3B: Non-Compliant Naming (Test Soft Validation)

1. Click "Add Vehicle" again
2. Enter data:
   - **Name:** `MyCustomVehicle` (non-compliant)
   - Other fields as desired
3. Click "Create Vehicle"

**Expected Result:**
- ⚠️ Warning dialog appears
- ⚠️ Shows name doesn't follow convention
- ✅ Provides example format
- ✅ Can choose "Continue" or "Cancel"

4. Click "Cancel" → Don't save
5. Try again, this time click "OK" to continue

**Expected Result:**
- ✅ Still can save
- ✅ Dashboard shows MyCustomVehicle
- ✅ Proves it's soft validation (warns but doesn't block)

---

### Step 4: Test Edit Vehicle

1. Select any vehicle card
2. Click "Edit" button (✎)
3. Modify name:
   - Original: `RD-125(??)`
   - New: `RD-125` (remove (??))
4. Click "Save Changes"

**Expected Result:**
- ✅ Save successful
- ✅ Dashboard immediately updates to show `RD-125`
- ✅ No warning (compliant format)

---

### Step 5: Test Search Function

1. Enter in search box: `Training`
2. Observe results

**Expected Result:**
- ✅ Only shows vehicles containing "Training"
- ✅ Should see 2: Training-933, Training_TBD
- ✅ Other vehicles hidden (but not deleted)

3. Clear search box

**Expected Result:**
- ✅ All vehicles reappear

---

## 🧪 Complete Test Checklist

### Basic Functionality Tests

- [ ] **Display All Vehicles**
  - [ ] Dashboard shows all vehicles in database
  - [ ] No count limit (9, 10, 11... all supported)
  - [ ] Grid auto-adjusts layout

- [ ] **Add Vehicle (Compliant)**
  - [ ] Can add vehicles starting with RD-
  - [ ] Can add vehicles starting with Training-
  - [ ] Can add vehicles starting with Marketing-
  - [ ] No warning message
  - [ ] Dashboard immediately displays

- [ ] **Add Vehicle (Non-Compliant)**
  - [ ] Shows warning dialog
  - [ ] Can choose continue or cancel
  - [ ] If continue, still can save
  - [ ] Dashboard will display the vehicle

- [ ] **Edit Vehicle**
  - [ ] Can modify existing vehicle name
  - [ ] Can change to any name
  - [ ] Dashboard updates immediately

- [ ] **Search Function**
  - [ ] Can search vehicle name
  - [ ] Can search vehicle type
  - [ ] Can search status
  - [ ] Clear search restores all display

---

### Integration Tests

- [ ] **Booking Function**
  - [ ] Can create bookings for any vehicle
  - [ ] Bookings not affected by vehicle name

- [ ] **Vehicle Card Display**
  - [ ] All vehicles display correctly
  - [ ] Status colors correct
  - [ ] Next booking info correct

- [ ] **Permission Control**
  - [ ] Admin can add/edit vehicles
  - [ ] Editor can add/edit vehicles
  - [ ] Viewer can only view (cannot edit)

---

### Console Tests

Press F12 to open browser developer tools, check:

- [ ] **No Error Messages**
  - [ ] No red errors
  - [ ] No errors about ALLOWED_VEHICLE_NAMES
  - [ ] No undefined warnings

- [ ] **Network Requests Normal**
  - [ ] Supabase queries successful
  - [ ] Vehicle data loads correctly
  - [ ] Booking data loads correctly

---

## 🎯 Expected Vehicle List

### Before Fix (May be hidden):
Some vehicles might be hidden because they weren't in ALLOWED_VEHICLE_NAMES

### After Fix (All visible):

If you kept all vehicles, should see:
1. 123 ⚠️
2. RD-117 (HD)
3. RD-125(??)
4. RD-652 (TBD)
5. RD-931 (OOO)
6. RD-High Altitude
7. RD-Test
8. Training-933
9. Training_TBD

**Total: 9 vehicles**

---

## 🔍 Possible Issues & Solutions

### Issue 1: Dashboard still only shows 7 vehicles

**Cause:** Browser cache

**Solution:**
1. Clear browser cache
2. Or press Ctrl+F5 for hard refresh
3. Or use incognito mode

---

### Issue 2: Console shows errors

**Possible Error:**
```
ALLOWED_VEHICLE_NAMES is not defined
```

**Solution:**
1. Confirm all modifications saved
2. Restart dev server (Ctrl+C to stop, then npm run dev)
3. Clear cache

---

### Issue 3: Dashboard doesn't update after adding vehicle

**Cause:** onSave callback not called

**Check:**
1. Open Dashboard.jsx line 146
2. Confirm: `onSave={fetchVehicles}`
3. If correct, refresh page to see

---

### Issue 4: Build fails

**Execute:**
```bash
npm run build
```

**If errors appear:**
1. Check for syntax errors
2. Confirm all files saved
3. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   npm run build
   ```

---

## ✅ Test Pass Criteria

All following items should pass:

### Basic Functionality ✅
- [x] Dashboard shows all vehicles (no limit)
- [x] Can add vehicles with any name
- [x] Compliant names have no warning
- [x] Non-compliant names warn but can continue
- [x] Dashboard updates immediately after edit
- [x] Search function works

### Technical Indicators ✅
- [x] Build successful (no errors)
- [x] No Console errors
- [x] Network requests normal
- [x] Data saves correctly to database

### User Experience ✅
- [x] Naming convention guide clear
- [x] Operations smooth with no delay
- [x] Warning messages friendly
- [x] Real-time update feedback

---

## 📝 Test Report Template

```markdown
# Test Report

**Test Date:** 2026-02-04
**Tester:** Alex Chang
**Version:** Phase 0 Fixed Version

## Test Results

### Basic Functionality
- [ ] Display all vehicles: ✅ PASS / ❌ FAIL
- [ ] Add vehicle (compliant): ✅ PASS / ❌ FAIL
- [ ] Add vehicle (non-compliant): ✅ PASS / ❌ FAIL
- [ ] Edit vehicle: ✅ PASS / ❌ FAIL
- [ ] Search function: ✅ PASS / ❌ FAIL

### Technical Indicators
- [ ] Build successful: ✅ PASS / ❌ FAIL
- [ ] No Console errors: ✅ PASS / ❌ FAIL
- [ ] Data saves correctly: ✅ PASS / ❌ FAIL

### Issues Found
(If any, record here)

### Improvement Suggestions
(If any, record here)

## Summary
[ ] ✅ Test passed, can proceed with Phase 0
[ ] ⚠️ Minor issues, need fixes
[ ] ❌ Test failed, need review
```

---

## 🎉 After Testing Complete

If all tests pass, continue with:

### ✅ Phase 0 Remaining Steps

1. ⬜ TODO-0.2: Cleanup test data (optional)
2. ⬜ TODO-0.3: Remove risk_level column
3. ⬜ TODO-0.4: Add deleted_at columns
4. ⬜ TODO-0.5: Create change_logs table

---

**Happy Testing! Report any issues!** 🚀
