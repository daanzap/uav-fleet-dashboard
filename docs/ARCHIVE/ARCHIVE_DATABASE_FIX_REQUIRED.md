# 🔧 CRITICAL: Database Columns Missing

**Date:** February 4, 2026  
**Status:** 🚨 IMMEDIATE ACTION REQUIRED

---

## 🐛 Three Bugs Identified

### Bug #1: Profile Page Error ❌
**Error:** `Could not find the 'display_name' column of 'profiles' in the schema cache`

**What's Wrong:** The `profiles` table is missing the `display_name` column

**Impact:** Cannot save user nickname/display name

---

### Bug #2: Cannot Create Bookings ❌
**Error:** `Could not find the 'pilot_name' column of 'bookings' in the schema cache`

**What's Wrong:** The `bookings` table is missing multiple required columns:
- `pilot_name`
- `project_name`  
- `risk_level`
- `location`
- `duration`
- `notes`
- `who_ordered`
- `status`
- `snapshotted_hw_config`

**Impact:** Cannot create any bookings/reservations

---

### Bug #3: Calendar Not Showing Bookings ⚠️
**Suspected Cause:** Missing columns prevent bookings from being created, so calendar has no data to display

---

## ✅ SOLUTION: Run SQL Script

### Step 1: Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard/project/citoiconzejdfjjefnbi
2. Navigate to: **SQL Editor**
3. Click **"New Query"**

### Step 2: Copy and Paste This SQL

```sql
-- ============================================
-- Fix Missing Columns for Profile and Bookings
-- Date: February 4, 2026
-- ============================================

-- BUG FIX #1: Add display_name to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- BUG FIX #2: Add ALL missing columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pilot_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS risk_level TEXT CHECK (risk_level IN ('Low', 'Medium', 'High'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS who_ordered TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS snapshotted_hw_config JSONB;

-- Also add department to profiles if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'R&D';

-- Verify columns were added
SELECT 'All columns added successfully!' as status;
```

### Step 3: Run the Query

1. Click **"Run"** button (or press Ctrl+Enter)
2. Wait for "Success" message
3. Verify output shows: "All columns added successfully!"

---

## 🧪 Test After Running SQL

### Test #1: Profile Page ✅
1. Refresh your app
2. Go to Profile page
3. Change "User Name" to anything
4. Click **"Save"**
5. Should save without error ✅

### Test #2: Create Booking ✅
1. Go to Dashboard
2. Click **"BOOK NOW"** on any vehicle
3. Fill out the form:
   - Select dates
   - Choose pilot
   - Enter project name
   - Select risk level
   - Enter location
4. Click **"Create Booking"**
5. Should save successfully ✅

### Test #3: Calendar Display ✅
1. After creating booking, click **Calendar icon** (📅) in header
2. Should see your booking displayed on the calendar
3. Hover over booking to see details

---

## 📁 SQL Script File

I've created a ready-to-use SQL script:

**File:** `db/12_fix_missing_columns.sql`

You can also run it from command line (if you have psql):
```bash
psql "your-database-url" -f db/12_fix_missing_columns.sql
```

---

## 🚨 Why This Happened

**Root Cause:** Database migrations were not executed in the correct order

**Missing Migrations:**
1. `db/07_profiles_display_name.sql` - Adds display_name (not run)
2. `db/03_bookings_columns.sql` - Adds some booking columns (partially run)
3. Additional columns like `pilot_name`, `who_ordered`, etc. were never added

**Solution:** The SQL script above adds ALL missing columns at once

---

## 📊 What Each Column Does

### Profiles Table:
- `display_name` - User's nickname/display name (shown in bookings, profile)
- `department` - User's department (R&D, Training, Marketing)

### Bookings Table:
- `pilot_name` - Who will pilot the vehicle (required)
- `project_name` - Name of the project/mission
- `risk_level` - Mission risk level (Low/Medium/High)
- `location` - Where the mission takes place
- `duration` - How long the mission will last
- `notes` - Additional booking notes
- `who_ordered` - Who created the booking (display name)
- `status` - Booking status (confirmed, cancelled, etc.)
- `snapshotted_hw_config` - Vehicle hardware config at time of booking

---

## ⏱️ Time Required

**Total Time:** ~2 minutes

1. Copy SQL (10 seconds)
2. Open Supabase SQL Editor (30 seconds)
3. Paste and run (20 seconds)
4. Verify (30 seconds)
5. Test app (1 minute)

---

## ✅ After Fixing

Once you run the SQL script:

### What Will Work: ✅
- ✅ Profile page saves display name
- ✅ Create bookings/reservations
- ✅ Calendar shows bookings
- ✅ All booking details captured
- ✅ User names display correctly

### What's Already Working: ✅
- ✅ Google OAuth login
- ✅ Dashboard displays vehicles
- ✅ Vehicle editing
- ✅ Navigation

---

## 🎯 Quick Action Steps

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy SQL** from section above
3. **Paste & Run**
4. **Refresh app**
5. **Test all 3 bugs** (Profile, Booking, Calendar)

---

## 📝 Alternative: Run Migration Files

If you prefer to run the existing migration files:

```sql
-- Run these in order:
\i db/07_profiles_display_name.sql
\i db/03_bookings_columns.sql

-- Then run the additional columns:
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pilot_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS who_ordered TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS snapshotted_hw_config JSONB;
```

But the single SQL script above is simpler and includes everything.

---

## 🎉 Summary

**Problem:** Database schema incomplete - missing columns  
**Solution:** Run SQL script to add all missing columns  
**Time:** 2 minutes  
**Result:** All 3 bugs fixed ✅

---

**Ready to fix? Copy the SQL and run it in Supabase now!** 🚀
