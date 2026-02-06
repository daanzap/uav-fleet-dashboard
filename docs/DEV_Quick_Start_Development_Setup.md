# Quick Start Guide for Implementation

**Use this guide to start working on the DeltaQuad Fleet Dashboard improvements.**

---

## 📚 Required Reading (In Order)

1. **CONFLICT_ANALYSIS_AND_RISKS.md** - Read this FIRST to understand all conflicts
2. **IMPLEMENTATION_PLAN.md** - Your step-by-step TODO list
3. **MIGRATION_PLAN.md** - Future migration to company server (for reference)
4. **PRD.md** - Original requirements (in project root)

---

## 🚨 CRITICAL: Do Phase 0 First!

**Before ANY other work, complete Phase 0 in a single conversation thread:**

### Phase 0 Checklist (2-3 hours)
- [ ] TODO-0.1: Create database backup
- [ ] TODO-0.2: Execute `db/08_vehicles_seven_names.sql` in Supabase
- [ ] TODO-0.3: Remove `risk_level` column from vehicles table
- [ ] TODO-0.4: Add `deleted_at` columns to vehicles and bookings
- [ ] TODO-0.5: Create `change_logs` table

**Why this is critical:** These changes fix the data model. If you don't do this first, other work will fail or cause data corruption.

---

## 🎯 Suggested Conversation Thread Titles

When starting a new conversation, use these exact titles so you can track progress:

### Must Do First:
1. **"Phase 0: Pre-Implementation Database Setup"** ← START HERE

### Bug Fixes:
2. **"Bug Fix: Logo Display and Vehicle Persistence"**
3. **"Bug Fix: Remove Risk Level from Vehicle Editor"**
4. **"Bug Fix: Profile Display Name Synchronization"**

### Core Features:
5. **"Feature: Department-Based Access Control"**
6. **"Feature: Enhanced Booking Conflict Warning"**

### Audit System:
7. **"Feature: Change Logging System - Part 1"**
8. **"Feature: Change Logging System - Part 2"**
9. **"Feature: Change History Viewer"**

### Delete Functions:
10. **"Feature: Vehicle Delete Functionality"**
11. **"Feature: My Bookings Page and Delete Bookings"**

### Hardware Config:
12. **"Feature: Hardware Configuration System - Part 1"**
13. **"Feature: Hardware Configuration System - Part 2"**
14. **"Feature: Hardware Configuration System - Part 3"**

---

## 🔗 Dependencies Chart

```
Phase 0 (ALL TODOS)
    ├─→ Phase 1 (Bug Fixes)
    │   └─→ Phase 2 (Core Adjustments)
    │       └─→ Phase 3 (Audit System)
    │           ├─→ Phase 4 (Delete Functions)
    │           └─→ Phase 5 (Hardware Config)
    │
    └─→ Phase 5: TODO-5.2 (Data Migration)
```

**Key Rule:** Never start a phase until its dependencies are complete!

---

## 🛠️ Before Starting Each TODO

### 1. Check Dependencies
Look at the TODO in `IMPLEMENTATION_PLAN.md` and verify:
- "Dependencies" section shows all prerequisites are done
- If it says "Blocks", those TODOs cannot start until this one is done

### 2. Prepare Your Environment
```bash
# Pull latest changes
git pull origin main

# Create a feature branch
git checkout -b feature/todo-X-Y-description

# Start dev server
npm run dev
```

### 3. Read Related Files
Each TODO lists "Files to Edit" - read those files first before making changes.

---

## 📋 Quick Reference: What Files Do What

### Core Application
- **`src/App.jsx`** - Main app, routing
- **`src/main.jsx`** - Entry point
- **`src/index.css`** - Global styles

### Authentication
- **`src/contexts/AuthContext.jsx`** - User authentication state
- **`src/pages/Login.jsx`** - Login page

### Pages
- **`src/pages/Dashboard.jsx`** - Main dashboard with vehicle grid
- **`src/pages/Profile.jsx`** - User profile editor
- **`src/pages/AdminPanel.jsx`** - Admin controls
- **`src/pages/MyBookings.jsx`** - ⚠️ TO BE CREATED in Phase 4

### Components
- **`src/components/Header.jsx`** - Top navigation bar
- **`src/components/VehicleCard.jsx`** - Individual vehicle display card
- **`src/components/EditVehicleModal.jsx`** - Edit/create vehicle modal
- **`src/components/BookingModal.jsx`** - Create booking modal
- **`src/components/CalendarOverviewModal.jsx`** - Calendar view
- **`src/components/ActivityLog.jsx`** - Activity history
- **`src/components/HardwareConfigModal.jsx`** - ⚠️ TO BE CREATED in Phase 5

### Utilities
- **`src/lib/supabase.js`** - Database connection
- **`src/lib/constants.js`** - Shared constants (7 vehicle names, pilots)
- **`src/lib/database.js`** - Database helper functions
- **`src/lib/changeLogger.js`** - ⚠️ TO BE CREATED in Phase 3
- **`src/lib/hardwareConfig.js`** - ⚠️ TO BE CREATED in Phase 5

### Database Scripts
- **`db/schema.sql`** - Initial schema (reference only)
- **`db/08_vehicles_seven_names.sql`** - ⚠️ MUST RUN in Phase 0
- **`db/09_migrate_hw_config.sql`** - ⚠️ TO BE CREATED in Phase 5

---

## 🧪 Testing Checklist

After completing each TODO, verify:

### Visual Checks
- [ ] No console errors (F12 → Console)
- [ ] No layout breaking
- [ ] Dark theme consistent
- [ ] Buttons work and have hover effects

### Functional Checks
- [ ] Feature works in dev mode (`npm run dev`)
- [ ] Feature works in prod build (`npm run build && npm run preview`)
- [ ] Data persists after page refresh
- [ ] No data loss

### Database Checks (if TODO changes DB)
- [ ] Open Supabase Dashboard → Table Editor
- [ ] Verify data structure is correct
- [ ] Verify no NULL values where they shouldn't be
- [ ] Check RLS policies still work

### User Flow Checks
- [ ] Test as Admin user
- [ ] Test as Editor user (if applicable)
- [ ] Test as Viewer user (if applicable)
- [ ] Test as different departments (R&D vs Marketing)

---

## 🚨 Common Mistakes to Avoid

### 1. ❌ Skipping Phase 0
**Problem:** "I want to fix the logo first"  
**Why it's bad:** Logo fix might work temporarily, but data model issues will cause crashes later  
**Solution:** Always do Phase 0 first, no exceptions

### 2. ❌ Not Reading Dependencies
**Problem:** "I'll start on TODO-5.3 because it looks interesting"  
**Why it's bad:** Hardware Config Modal needs the data structure (TODO-5.1) and migrated data (TODO-5.2) first  
**Solution:** Follow the dependency chain

### 3. ❌ Editing Wrong Files
**Problem:** Making changes to `db/schema.sql`  
**Why it's bad:** That file is just for reference, doesn't run automatically  
**Solution:** Create numbered migration files (e.g., `db/09_new_feature.sql`)

### 4. ❌ Not Testing Before Committing
**Problem:** "It looks fine in the code, I'll commit it"  
**Why it's bad:** Runtime errors might not be visible until you run the app  
**Solution:** Always run `npm run dev` and click through the features

### 5. ❌ Making Too Many Changes at Once
**Problem:** Combining TODO-1.1, TODO-1.2, and TODO-1.3 in one go  
**Why it's bad:** If something breaks, you won't know which change caused it  
**Solution:** One TODO per conversation thread, commit after each

---

## 🔄 Git Workflow

### For Each TODO:
```bash
# 1. Create branch
git checkout main
git pull origin main
git checkout -b feature/todo-X-Y-short-description

# 2. Make changes
# ... edit files ...

# 3. Test changes
npm run dev
# Click through and test

# 4. Commit
git add .
git commit -m "feat: [TODO-X-Y] Short description of what was done"

# 5. Push
git push origin feature/todo-X-Y-short-description

# 6. Merge to main (if working alone)
git checkout main
git merge feature/todo-X-Y-short-description
git push origin main
```

### Commit Message Format:
- `feat: [TODO-1.1] Fix logo display issue`
- `fix: [TODO-1.2] Vehicle persistence after save`
- `refactor: [TODO-5.1] Define hardware config schema`
- `docs: Update implementation plan progress`

---

## 📞 When You Need Help

### If a TODO is Unclear:
1. Re-read the TODO in `IMPLEMENTATION_PLAN.md`
2. Check `CONFLICT_ANALYSIS_AND_RISKS.md` for context
3. Look at the "Acceptance Criteria" - that's what "done" looks like
4. Ask: "I'm working on TODO-X.Y, can you clarify [specific question]?"

### If You Encounter an Error:
1. Copy the full error message
2. Note which file and line number
3. Note what you were trying to do
4. Ask: "I'm on TODO-X.Y, got this error: [paste error]. I was trying to [action]. File: [filename]"

### If Tests Fail:
1. Note which acceptance criteria failed
2. Describe what happens vs what should happen
3. Ask: "TODO-X.Y acceptance criteria #3 fails. Expected: [X], Got: [Y]"

---

## 📊 Progress Tracking

After completing a TODO:

1. Open `IMPLEMENTATION_PLAN.md`
2. Find the TODO in the progress table at the bottom
3. Change status from ⬜ to ✅
4. Add your name and date
5. Commit the update

---

## 🎉 Quick Start Command

**To begin implementation right now:**

1. Open a new conversation with title: **"Phase 0: Pre-Implementation Database Setup"**

2. Paste this message:
```
I'm ready to start implementing the DeltaQuad Fleet Dashboard improvements.

I've read:
- CONFLICT_ANALYSIS_AND_RISKS.md
- IMPLEMENTATION_PLAN.md
- QUICK_START_GUIDE.md

Let's start with Phase 0: Pre-Implementation. Please guide me through:
- TODO-0.1: Database Backup
- TODO-0.2: Execute Seven Vehicles SQL Script
- TODO-0.3: Remove Risk Level from Vehicles Table
- TODO-0.4: Add Soft Delete Columns
- TODO-0.5: Create Change Logs Table

Let's begin with TODO-0.1. What do I need to do?
```

---

## 📝 Final Checklist Before You Start

- [ ] I have read CONFLICT_ANALYSIS_AND_RISKS.md
- [ ] I have read IMPLEMENTATION_PLAN.md
- [ ] I understand I must do Phase 0 first
- [ ] I have access to Supabase Dashboard
- [ ] I have the project running locally (`npm run dev` works)
- [ ] I have git configured and can commit changes
- [ ] I understand the conversation thread structure

---

**If all boxes are checked above, you're ready to start! Good luck! 🚀**

Open a new conversation with title: **"Phase 0: Pre-Implementation Database Setup"**
