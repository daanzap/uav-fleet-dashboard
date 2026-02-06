# Task 2.1 - Enhanced Conflict Detection Testing Guide

**Date:** February 6, 2026  
**Dev Server:** http://localhost:5174/uav-fleet-dashboard/

---

## 🧪 Quick Test Scenarios

### Test 1: Basic Conflict Detection (5 minutes)

**Setup:**
1. Open the app: http://localhost:5174/uav-fleet-dashboard/
2. Login with your credentials
3. Find a vehicle that has existing bookings

**Steps:**
1. Click "Reserve" on any vehicle
2. Select dates that overlap with an existing booking (you can see existing bookings highlighted in yellow on the calendar)
3. **Expected Result:** 
   - Enhanced conflict warning box appears below the form
   - Shows "Booking Conflict Detected" header with ⚠️ icon
   - Displays conflict count
   - Lists all conflicting bookings with details:
     - Project name
     - Pilot name
     - Date range
     - Who ordered
     - Location (if available)
     - Overlap duration (e.g., "2 days overlap")

4. Click "Confirm Reservation" button
5. **Expected Result:**
   - Override confirmation dialog appears
   - Shows warning message
   - Lists all conflicts with key details
   - Asks "Have you coordinated with the booking owner(s)?"

6. Click "Cancel" in the dialog
7. **Expected Result:**
   - Dialog closes
   - Form remains open
   - Can adjust dates

8. Click "Confirm Reservation" again
9. Click "Yes, Create Booking Anyway"
10. **Expected Result:**
    - Booking is created
    - Success message appears
    - Modal closes

---

### Test 2: No Conflict Scenario (2 minutes)

**Steps:**
1. Open booking modal
2. Select dates that have NO existing bookings (dates without yellow highlighting)
3. **Expected Result:**
   - No conflict warning appears
   - Form is clean and normal
4. Fill in required fields (Pilot, Project)
5. Click "Confirm Reservation"
6. **Expected Result:**
   - No override dialog
   - Booking created immediately
   - Success message

---

### Test 3: Multiple Conflicts (5 minutes)

**Setup:**
Create 2-3 test bookings for the same vehicle with overlapping dates.

**Steps:**
1. Open booking modal for that vehicle
2. Select dates that overlap ALL the test bookings
3. **Expected Result:**
   - Conflict warning shows correct count (e.g., "3 conflicting bookings found")
   - Each conflict is displayed in a separate card
   - All cards are clearly visible and organized
   - Each shows complete information

4. Verify each conflict card shows:
   - Badge: "CONFLICT 1", "CONFLICT 2", etc.
   - Overlap days
   - Project name
   - Pilot name
   - Date range
   - Who ordered
   - Location (if available)

5. Test override flow with multiple conflicts

---

### Test 4: Visual Design Check (3 minutes)

**What to Check:**

1. **Conflict Warning Box**
   - [ ] Has gradient background (yellow/orange to red)
   - [ ] Has orange border (2px solid)
   - [ ] Header has ⚠️ icon
   - [ ] Title is yellow/gold color
   - [ ] Subtitle shows count

2. **Conflict Cards**
   - [ ] Dark background with subtle border
   - [ ] Badge has gradient (orange)
   - [ ] Overlap text is yellow/gold
   - [ ] Labels are gray
   - [ ] Values are white/light
   - [ ] Icons appear before labels (📋, 👤, 📅, 🎯, 📍)

3. **Footer Tip**
   - [ ] Blue background
   - [ ] Blue border
   - [ ] 💡 icon
   - [ ] Light blue text

4. **Override Dialog**
   - [ ] Dark background with gradient
   - [ ] Red border (2px)
   - [ ] ⚠️ icon is pulsing/animated
   - [ ] Header text is light red/pink
   - [ ] Conflict list has left border (orange)
   - [ ] Cancel button is gray
   - [ ] Confirm button is red with gradient

---

### Test 5: Edge Cases (5 minutes)

**Test 5a: Partial Overlap (Start)**
1. Existing booking: Feb 10-15
2. New booking: Feb 8-12
3. **Expected:** Shows 3 days overlap (Feb 10-12)

**Test 5b: Partial Overlap (End)**
1. Existing booking: Feb 10-15
2. New booking: Feb 13-18
3. **Expected:** Shows 3 days overlap (Feb 13-15)

**Test 5c: Complete Overlap (New Contains Existing)**
1. Existing booking: Feb 12-14
2. New booking: Feb 10-16
3. **Expected:** Shows 3 days overlap (Feb 12-14)

**Test 5d: Complete Overlap (Existing Contains New)**
1. Existing booking: Feb 10-20
2. New booking: Feb 12-14
3. **Expected:** Shows 3 days overlap (Feb 12-14)

**Test 5e: Exact Same Dates**
1. Existing booking: Feb 10-15
2. New booking: Feb 10-15
3. **Expected:** Shows 6 days overlap

---

### Test 6: Responsive Design (3 minutes)

**Desktop (> 800px)**
- [ ] Calendar and form are side-by-side
- [ ] Conflict warning fits well in form column
- [ ] Override dialog is centered and readable

**Mobile (< 800px)**
- [ ] Calendar appears first (top)
- [ ] Form appears second (bottom)
- [ ] Conflict warning is readable
- [ ] Override dialog is responsive
- [ ] All text is legible
- [ ] Buttons are touch-friendly

**To Test:**
1. Open browser dev tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Test at 375px width (iPhone)
4. Test at 768px width (iPad)
5. Test at 1920px width (Desktop)

---

### Test 7: User Flow (5 minutes)

**Scenario:** User accidentally selects wrong dates

1. Open booking modal
2. Select dates with conflicts
3. See conflict warning
4. Realize mistake
5. Change dates to non-conflicting dates
6. **Expected:** Conflict warning disappears immediately
7. Submit booking
8. **Expected:** No override dialog, booking created

**Scenario:** User wants to override

1. Open booking modal
2. Select dates with conflicts
3. Review conflict details
4. Decide to proceed anyway
5. Click "Confirm Reservation"
6. Review conflicts in override dialog
7. Click "Yes, Create Booking Anyway"
8. **Expected:** Booking created successfully

---

## 🎯 Success Criteria

All of the following should be TRUE:

- [ ] Conflict detection works in real-time
- [ ] All conflicting bookings are displayed
- [ ] Each conflict shows complete information
- [ ] Overlap days are calculated correctly
- [ ] Visual design is polished and professional
- [ ] Override dialog requires explicit confirmation
- [ ] No console errors
- [ ] No layout issues
- [ ] Responsive on mobile
- [ ] Smooth animations and transitions
- [ ] Icons render correctly
- [ ] Colors match design (yellow/orange warnings, red override)
- [ ] Text is readable
- [ ] Buttons work correctly
- [ ] Cancel buttons close dialogs
- [ ] Confirm button creates booking after override
- [ ] No conflicts = no warning
- [ ] Changing dates updates conflicts immediately

---

## 🐛 Common Issues to Check

1. **Conflict not showing:**
   - Check browser console for errors
   - Verify dates actually overlap
   - Check database has existing bookings

2. **Override dialog not appearing:**
   - Verify conflicts exist
   - Check console for errors
   - Ensure form has id="booking-form"

3. **Styling issues:**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
   - Check CSS file loaded

4. **Date calculation wrong:**
   - Check timezone handling
   - Verify date format in database
   - Test with different date ranges

---

## 📸 Visual Checklist

Take screenshots of:
1. [ ] Conflict warning with single conflict
2. [ ] Conflict warning with multiple conflicts
3. [ ] Override confirmation dialog
4. [ ] Mobile view of conflict warning
5. [ ] Mobile view of override dialog

---

## ✅ Sign-Off

After completing all tests:

- [ ] All tests passed
- [ ] No console errors
- [ ] Visual design approved
- [ ] Mobile responsive
- [ ] User flow is intuitive
- [ ] Ready for production

**Tested By:** _______________  
**Date:** _______________  
**Status:** _______________

---

## 🚀 Next Steps After Testing

1. If issues found → Document and fix
2. If all tests pass → Mark Task 2.1 as complete
3. Proceed to Task 2.2: Add Loading States

---

**Quick Test Command:**
```bash
# Start dev server
npm run dev

# Open in browser
open http://localhost:5174/uav-fleet-dashboard/

# Login and test booking modal
```

---

**Last Updated:** February 6, 2026  
**Status:** Ready for Testing
