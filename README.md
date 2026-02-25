# DeltaQuad Fleet Manager (Evo Series)

> **Version:** 2.3 (Final Build)
> **Status:** Active Development
> **Stack:** React (Vite) + Supabase (PostgreSQL)

## 📖 Overview

A unified UAV asset management and reservation system designed for DeltaQuad's internal operations. The system solves the issue of asset isolation between departments while preserving critical R&D history through hardware snapshotting.

## 🏗 System Architecture

### 1. Department Isolation Strategy
The system uses **Row Level Security (RLS)** to manage asset visibility automatically:
* **Technical Pool (Shared Access):** R&D (Pilots & Engineers) and Training departments share a unified pool of vehicles. They can view and book each other's assets.
* **Marketing (Isolated):** The Marketing department operates in a silo. They can only view and book Marketing-designated assets.
* **Admin:** Full visibility across all departments.

### 2. Conflict Resolution (Soft Lock)
We prioritize collaboration over rigid constraints.
* **Logic:** The system **NEVER blocks** a booking due to time conflict.
* **Behavior:** If a conflict is detected (Same Vehicle + Overlapping Time), the system displays a **Warning Toast**, asking the user to coordinate with the existing booker.

### 3. Data Integrity (Hardware Snapshots)
To ensure historical accuracy in test reports:
* **Mechanism:** When a booking is created, the system captures a **Snapshot** of the vehicle's current Hardware Configuration (JSON).
* **Result:** Viewing a past booking shows the drone's configuration *at that specific moment*, not its current state.

---

## 🗄 Database Schema (Supabase)

### A. Profiles (Users)
Extends the default Auth table.
- `id`: UUID (FK)
- `department`: Text (Enum: `'R&D'`, `'Training'`, `'Marketing'`)
- `role`: Text (`'admin'`, `'user'`)

### B. Vehicles (Assets)
- `id`: UUID
- `name`: Text
- `status`: Text (`'Ready'`, `'Maintenance'`, etc.)
- `department`: Text (Assets are tagged `'R&D'`, `'Training'`, or `'Marketing'`)
- `hw_config`: **JSONB** (Flexible schema for evolving hardware)

**Example JSONB Structure:**
```json
{
  "skynode_id": "SN-1024",
  "gps": "Here3",
  "battery": "SolidState-22Ah",
  "custom_modules": { "payload": "Sony A7R" }
}
```

### C. Bookings (Missions)
- `vehicle_id`: UUID
- `project_name`: **Text (Required)** - Displayed on Calendar
- `risk_level`: Text (`'Low'`, `'Medium'`, `'High'`)
- `location`: **Free Text** (e.g., "Lab", "Outdoor", "Rooftop")
- `snapshotted_hw_config`: **JSONB** (Copy of vehicle config at insert time)

---

## 💻 Frontend Specifications

### 1. Dashboard (Vehicle List)
* **No Manual Filtering:** The top-level "Department Switcher" is removed.
* **Auto-Filter:** The list automatically renders vehicles the user is permitted to see based on RLS policies.
    * *R&D / Training User* sees: R&D + Training Vehicles.
    * *Marketing User* sees: Marketing Vehicles only.

### 2. Booking Modal
* **Inputs:**
    * Project Name (Required)
    * Risk Level (Dropdown)
    * Location (Free Text Input)
    * Date & Duration
* **Conflict Logic:** Real-time check. Overlaps trigger a yellow warning UI but keep the "Confirm" button active.

### 3. General Calendar
* **View:** Monthly view with **Week Numbers**.
* **Content:** Aggregates all bookings visible to the user.
* **Visualization:** Stacked bars for overlapping events (to visualize resource contention).

### 4. Vehicle Editor
* **Hardware Config:** Flexible Key-Value input or JSON editor to allow R&D to input non-standard hardware without schema migrations.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+
* Supabase Project

### Installation

```bash
# 1. Clone the repo
git clone [repo-url]

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

### Testing (run after develop)

Before pushing or opening a PR, run:

- **Unit tests:** `npm run test:run`
- **E2E tests:** `npm run test:e2e` (first time: `npx playwright install`)

CI runs these on push/PR to `main`. See **[TESTING.md](TESTING.md)** for full details.

### Database Migration

**Option A — Run from your machine (recommended)**  
See **docs/DEV_Database_Setup.md** for step-by-step instructions (where to find the database password, connection string, and how to run migrations).

**Option B — Supabase SQL Editor**  
Run the SQL files in `/db` in order in the Supabase **SQL Editor**:
1. `schema.sql` — base tables
2. `01_schema_fixes.sql` — extra columns (e.g. `who_ordered`, `purpose`)
3. `03_bookings_columns.sql` — booking form columns: `duration`, `notes`, `project_name`, `status`
4. `04_bookings_prd_snapshot.sql` — PRD: `risk_level`, `location`, `snapshotted_hw_config` + snapshot trigger
5. `05_department_and_jsonb.sql` — PRD: `department` columns + `hw_config` JSONB conversion
6. `06_department_rls.sql` — PRD: Department-based RLS (R&D+Training shared, Marketing isolated)
7. `02_enhanced_rls.sql` — Enhanced RLS (optional, if not using 06)
8. `deltaquad_update.sql` — domain/admin (optional)

**Important:** Migrations 5 and 6 implement the PRD department isolation requirements.

If the booking form errors with *"Could not find the 'duration' column"*, run `03_bookings_columns.sql`.

### Deploy (staging / production)

- **Order:** Deploy to Staging → Staging UAT sign-off → tag and deploy production from tag. Rollback = redeploy the previous tag.
- **Steps:** See **docs/DEPLOY_Staging_Steps.md** (Vercel/Netlify, PRD §5 UAT, tagging, rollback) and **docs/DEPLOY_Release_and_Task_Flow.md**.
- **Staging:** Connect this repo in Vercel or Netlify and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Rollback:** Redeploy the previous tag (e.g. v0.9.0). See **docs/DEPLOY_Release_and_Task_Flow.md** §3.
