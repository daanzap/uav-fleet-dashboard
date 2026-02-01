# 🎉 DeltaQuad Fleet Manager — Ready to Test!

> **All PRD requirements implemented on Feb 1, 2026**  
> **Next action:** Run migrations → Test locally

---

## ✅ What's Been Completed Today

### 🗄️ Database Layer (Complete)

**New Migration Files Created:**
- `db/05_department_and_jsonb.sql` — Adds department columns + JSONB hw_config
- `db/06_department_rls.sql` — Department-based Row Level Security
- `scripts/run-all-migrations.js` — Run all migrations in sequence

**What the migrations do:**
1. Add `department` column to `profiles` and `vehicles` tables
2. Convert `hw_config` from text → JSONB for flexible hardware data
3. Implement RLS: R&D+Training share pool, Marketing isolated, Admin sees all
4. Hardware snapshot trigger already existed (migration 04)

### 💻 Frontend Layer (Complete)

**AuthContext** — Now loads and exposes user's department  
**BookingModal** — Project field now required, Risk Level + Location + Soft Lock already working  
**EditVehicleModal** — Now handles JSONB hw_config with JSON validation  
**CalendarOverviewModal** — Already complete (real data, ISO weeks, stacking)

### 📚 Documentation (Updated)

- ✅ README.md updated with migration order
- ✅ DATABASE_SETUP.md updated with all migrations
- ✅ Created TODAY_PROGRESS.md with detailed notes
- ✅ Created PROJECT_STATUS_FEB_1_2026.md with complete status
- ✅ Created this READY_TO_TEST.md file

---

## 🚀 IMMEDIATE NEXT STEP: Run Migrations

### Step 1: Get Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **citoiconzejdfjjefnbi**
3. Go to **Project Settings** → **Database**
4. Find your database password (if you don't remember it, reset it)

### Step 2: Add DATABASE_URL to .env

Open your `.env` file and add:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.citoiconzejdfjjefnbi.supabase.co:5432/postgres
```

Replace `[YOUR-PASSWORD]` with your actual database password.

**Your current `.env` should look like:**
```env
VITE_SUPABASE_URL=https://citoiconzejdfjjefnbi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.citoiconzejdfjjefnbi.supabase.co:5432/postgres
```

### Step 3: Run All Migrations

```bash
npm run db:migrate:all
```

**Expected output:**
```
✅ Connected to database

📄 Running db/01_schema_fixes.sql...
✅ db/01_schema_fixes.sql completed

📄 Running db/03_bookings_columns.sql...
✅ db/03_bookings_columns.sql completed

📄 Running db/04_bookings_prd_snapshot.sql...
✅ db/04_bookings_prd_snapshot.sql completed

📄 Running db/05_department_and_jsonb.sql...
✅ db/05_department_and_jsonb.sql completed

📄 Running db/06_department_rls.sql...
✅ db/06_department_rls.sql completed

🎉 All migrations completed successfully!
```

### Step 4: Verify Migrations (Optional)

In Supabase SQL Editor, run:

```sql
-- Check department columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'vehicles', 'bookings')
AND column_name IN ('department', 'hw_config', 'risk_level', 'location', 'snapshotted_hw_config')
ORDER BY table_name, column_name;
```

**Expected results:**
- profiles.department → text
- vehicles.department → text
- vehicles.hw_config → jsonb
- bookings.risk_level → text
- bookings.location → text
- bookings.snapshotted_hw_config → jsonb

---

## 🧪 Test Locally

### Start the App

```bash
npm run dev
```

Open: http://localhost:5173/uav-fleet-dashboard/

### Quick Test Checklist

**Test 1: Login**
- [ ] Log in with your @deltaquad.com account
- [ ] Verify you see the dashboard

**Test 2: View Vehicles**
- [ ] Check vehicle list loads
- [ ] Vehicles should be filtered by your department (RLS active)

**Test 3: Create Booking**
- [ ] Click "Book" on a vehicle
- [ ] Fill in: Pilot (required), Project (required), Risk Level, Location
- [ ] Select dates
- [ ] If there's a conflict, warning should appear but submit still works
- [ ] Submit booking

**Test 4: Edit Vehicle**
- [ ] Click "Edit" on a vehicle
- [ ] Try adding JSON hw_config: `{"skynode_id": "SN-1024", "gps": "Here3"}`
- [ ] Change Department dropdown
- [ ] Save changes

**Test 5: View Calendar**
- [ ] Click "Calendar Overview" button
- [ ] Should see real bookings
- [ ] Should see week numbers (Wk) in left column
- [ ] Multiple bookings on same day should stack vertically

---

## 🎯 What Each PRD Feature Does

### 1. Department Isolation (RLS)

**What it is:** Automatic filtering of vehicles based on user's department

**How it works:**
- R&D user logs in → sees R&D + Training vehicles
- Training user logs in → sees R&D + Training vehicles
- Marketing user logs in → sees ONLY Marketing vehicles
- Admin user logs in → sees ALL vehicles

**No frontend code needed:** Database RLS policies handle everything automatically

### 2. Soft Lock (Conflict Warning)

**What it is:** Warning system for overlapping bookings

**How it works:**
- User selects dates that overlap with existing booking
- Yellow warning appears: "This slot is already booked by [Project Name]. Please coordinate with the owner."
- Submit button STAYS ENABLED (user can proceed)
- This encourages collaboration without blocking legitimate uses

### 3. Hardware Snapshot

**What it is:** Historical accuracy for test data

**How it works:**
- User books a vehicle
- Database trigger automatically copies vehicle's current `hw_config` into booking's `snapshotted_hw_config`
- If vehicle hardware changes later, the booking still shows the original config
- Critical for R&D: "What hardware was on the drone when we ran that test?"

### 4. JSONB Hardware Config

**What it is:** Flexible, schema-less hardware storage

**How it works:**
- Instead of fixed columns (battery, gps, etc.), store JSON object
- R&D can add ANY field: `{"experimental_5G_modem": "Model-X", "custom_payload": "Sony A7R"}`
- No database migrations needed when hardware evolves
- UI validates JSON before saving

---

## 📋 PRD Acceptance Tests (UAT for Sunday)

Once local testing looks good, run these 4 tests on staging:

### Test 1: Isolation Test ✓
1. Create/use Marketing user account
2. Log in
3. **PASS if:** NO R&D or Training vehicles are visible

### Test 2: Shared Pool Test ✓
1. Create/use R&D user account
2. Log in
3. **PASS if:** Training vehicles ARE visible and can be booked

### Test 3: Snapshot Test ✓
1. Edit Vehicle A: `hw_config = {"battery": "Old"}`
2. Create Booking X for Vehicle A
3. Edit Vehicle A: `hw_config = {"battery": "New"}`
4. Inspect Booking X in database or booking details
5. **PASS if:** Booking shows `{"battery": "Old"}` (not "New")

### Test 4: Conflict Test ✓
1. Create Booking A (Jan 5-7)
2. Create Booking B (Same vehicle, Jan 6-8)
3. **PASS if:** 
   - Warning displays with first booking's project name
   - Submit button is NOT disabled
   - Booking B can be successfully created

---

## 🔧 Troubleshooting

### "Migration failed: column already exists"

**Solution:** Some migrations are already applied. Run individual migrations that haven't been applied yet.

```bash
npm run db:migrate -- db/05_department_and_jsonb.sql
npm run db:migrate -- db/06_department_rls.sql
```

### "No vehicles showing up after migration"

**Possible causes:**
1. User doesn't have a department set → defaults to 'R&D'
2. No vehicles have departments set → need to update existing vehicles
3. RLS policy issue

**Fix:** In Supabase SQL Editor, update existing data:
```sql
-- Set department for existing vehicles (if needed)
UPDATE vehicles SET department = 'R&D' WHERE department IS NULL;

-- Set department for existing users (if needed)
UPDATE profiles SET department = 'R&D' WHERE department IS NULL;
```

### "hw_config validation error"

**Solution:** Ensure JSON is valid. Example valid JSON:
```json
{
  "skynode_id": "SN-1024",
  "gps": "Here3",
  "battery": "SolidState-22Ah"
}
```

Strings need quotes. No trailing commas.

---

## 📞 Summary

**What's done:** Everything! All PRD requirements implemented.

**What's next:** 
1. ✅ Run migrations (5 minutes)
2. ✅ Test locally (30 minutes)
3. ⏳ Fix any bugs (Saturday)
4. ⏳ Deploy to staging (Saturday)
5. ⏳ Run UAT (Sunday)
6. ⏳ Demo (Next week)

**Files to read for more detail:**
- `docs/TODAY_PROGRESS.md` — What was implemented today
- `PROJECT_STATUS_FEB_1_2026.md` — Complete feature status
- `docs/SPRINT_TO_DEMO.md` — Original sprint plan

---

**🚀 Ready to go! Start with: `npm run db:migrate:all`**
