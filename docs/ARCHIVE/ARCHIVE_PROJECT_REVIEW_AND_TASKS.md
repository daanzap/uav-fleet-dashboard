# DeltaQuad Fleet Manager — Project Review & Task List

> Current status vs PRD, environment plan, and remaining tasks. All content in this repo is in English.

---

## 1. Current Project Status (What’s Done)

### Done / Partially Done

| Area | Status | Notes |
|------|--------|-------|
| **Base stack** | Done | React (Vite) + Supabase + React Router; login/logout, Profile, Admin routes |
| **Permission model** | Partial | Uses `profiles.role` (viewer / editor / admin). PRD `department` (R&D / Training / Marketing) not yet introduced |
| **Dashboard vehicle list** | Done | Vehicle cards, search, Book / Edit / History; no department-based RLS filtering yet (RLS is role-based) |
| **Booking modal** | Partial | Has date picker, Pilot, Project, Duration, Notes. Missing PRD Risk Level, Location; Soft Lock warning; backend snapshot |
| **Edit vehicle modal** | Partial | Name, Status, Risk Level, hw_config (text), sw_version, Notes. Missing JSONB / key-value editor |
| **Calendar overview** | Partial | Monthly view, mock data. Missing ISO week numbers, real bookings API, vertical stacking for conflicts |
| **DB schema** | Partial | profiles, vehicles, bookings, activities, team_members exist. Missing PRD: `department`, `project_name`, `risk_level`, `location`, `snapshotted_hw_config`; vehicles lack `department`, hw_config is text not jsonb |
| **RLS** | Partial | Role-based (editor/admin). PRD “R&D+Training shared pool, Marketing isolated” not implemented |

### Bugs Fixed (This round)

1. **Pilot dropdown:** Static list, alphabetical order — Devon, Edine, Ezgi, Jaco, Michael, Renzo, Thijm, Tjeerd, Yamac.
2. **Book Vehicle modal:** Date field label set to **Dates (Including Vehicle Transportation)**.

---

## 2. PRD Gaps (Not Yet Implemented)

### 2.1 Database & RLS

- [ ] **Profiles:** Add `department` (R&D / Training / Marketing); maintain via signup/admin.
- [ ] **Vehicles:** Add `department`; change `hw_config` to **JSONB**.
- [ ] **Bookings:** Add `project_name` (NOT NULL), `risk_level`, `location`, `snapshotted_hw_config` (jsonb). Align with `start_time`/`end_time` or document mapping to current columns.
- [ ] **RLS:** Rewrite policies by `profiles.department` — R&D/Training see R&D+Training vehicles; Marketing sees only Marketing; Admin sees all.

### 2.2 Booking & Snapshot

- [ ] **Booking form:** Required Project Name, Risk Level (Low/Medium/High), Location; align field names with DB.
- [ ] **Soft Lock:** Before submit, check same vehicle + overlapping time; show **Warning Toast** (“This slot is already booked by [Project Name]. Please coordinate with the owner.”) but **do not block** submit.
- [ ] **Hardware Snapshot:** On booking **INSERT** (DB trigger or Edge Function), copy current vehicle `hw_config` into `bookings.snapshotted_hw_config`.

### 2.3 Calendar

- [ ] **Week numbers:** Show ISO 8601 week numbers on calendar.
- [ ] **Data source:** Load real Supabase bookings (respecting RLS).
- [ ] **Conflict UI:** Vertical stacking when multiple bookings fall on the same day.

### 2.4 Vehicle editor

- [ ] **hw_config:** Store as JSONB; UI as key-value or JSON editor for non-standard hardware (e.g. experimental payloads, 5G dongles).

### 2.5 Frontend permissions

- [ ] **AuthContext:** Load and expose `department` from profiles.
- [ ] **Dashboard:** Rely on RLS only for vehicle list (R&D sees R&D+Training, Marketing sees Marketing only).

---

## 3. Environment & Testing Plan

### 3.1 Environments

| Env | Purpose | Supabase | Deploy |
|-----|---------|----------|--------|
| **Development** | Local feature work | Dev project or shared | `npm run dev` locally |
| **Staging** | UAT, PRD sign-off, integration | Staging project (separate DB) | e.g. Vercel/Netlify preview or staging URL |
| **Production** | Live service | Production project | Production URL |

### 3.2 Environment variables

- `.env.development` / `.env.staging` / `.env.production` (or CI secrets):  
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` per environment.

### 3.3 Testing strategy (automation & unit tests)

- **Unit tests (Vitest)**  
  - Pure helpers: date formatting, conflict logic, department/role helpers.  
  - Run: `npm run test` (or `npm run test:unit`).  
  - Target: critical utils and hooks; no Supabase in unit tests (mock if needed).

- **E2E tests (Playwright)**  
  - Login → Dashboard vehicle list.  
  - Booking flow (including Soft Lock: warning shown but submit still allowed).  
  - Different department accounts: vehicle visibility (Isolation / Shared Pool).  
  - Run: `npm run test:e2e`.  
  - Optional: run in CI on push/PR against staging.

- **UAT (manual, per PRD §5)**  
  - Isolation Test, Shared Pool Test, Snapshot Test, Conflict Test — documented in PRD; run on Staging before release.

See **Section 5** and repo scripts for concrete automation setup.

---

## 4. Remaining Task List (Suggested Order)

### Phase 1 — Schema & RLS

1. **DB migration (PRD schema)**  
   - Add `department` to profiles (R&D/Training/Marketing).  
   - Add `department` to vehicles; change `hw_config` to JSONB.  
   - Add `project_name`, `risk_level`, `location`, `snapshotted_hw_config` to bookings; align time columns.

2. **RLS rewrite**  
   - Vehicles/bookings SELECT/INSERT/UPDATE by `profiles.department` (R&D+Training shared; Marketing isolated; Admin full).

3. **Hardware snapshot**  
   - DB trigger on `bookings` INSERT: copy `vehicles.hw_config` into `bookings.snapshotted_hw_config`.

### Phase 2 — Booking & UI

4. **Booking form (PRD)**  
   - Required: Project Name, Risk Level, Location; match DB. Pilot static list and “Dates (Including Vehicle Transportation)” label already done.

5. **Soft Lock**  
   - Pre-submit overlap check; show Warning Toast; keep “Confirm booking” enabled.

6. **AuthContext + department**  
   - Include `department` in profile fetch and context.

### Phase 3 — Calendar & vehicle editor

7. **Calendar**  
   - Real bookings API; ISO week numbers; vertical stacking for same-day conflicts.

8. **Vehicle hardware editor**  
   - JSONB `hw_config`; key-value or JSON UI.

### Phase 4 — Environments & quality 🔄 IN PROGRESS

9. **Dev / Staging / Production** ⏳ TODO
   - Separate env vars and Supabase projects; staging deploy (e.g. GitHub Actions + Vercel preview).

10. **Automation & unit tests** ⏳ TODO
    - Vitest unit tests for utils and logic.  
    - Playwright E2E for login, dashboard, booking (including conflict path).  
    - Run UAT from PRD §5 on Staging.

11. **Docs** ✅ PARTIALLY DONE (Feb 1, 2026)
    - ✅ README: architecture, env vars, how to run migrations updated
    - ✅ Created `docs/TODAY_PROGRESS.md` with implementation summary
    - ✅ Created `scripts/run-all-migrations.js` for easy migration running

---

## 🎉 Implementation Status Summary (Updated Feb 1, 2026)

**All PRD demo-critical features are now implemented!**

- ✅ **Phase 1 (Schema & RLS):** Complete
- ✅ **Phase 2 (Booking & UI):** Complete  
- ✅ **Phase 3 (Calendar & Vehicle Editor):** Complete
- ⏳ **Phase 4 (Testing & Deploy):** Next steps

**What's left:** Run migrations, test locally, deploy to staging, run UAT

See `docs/TODAY_PROGRESS.md` for detailed implementation notes and next steps.

---

## 5. Automation Testing & Unit Test Plan

### 5.1 Unit tests (Vitest)

- **Scope:** Pure functions and small modules under `src/lib`, date/format helpers, conflict-detection logic.  
- **Commands:** `npm run test` (watch), `npm run test:run` (CI).  
- **Location:** `src/**/*.test.js` or `src/**/*.spec.js` (or `__tests__` next to source).  
- **No direct Supabase:** Use mocks for any Supabase-dependent code in unit tests.

### 5.2 E2E tests (Playwright)

- **Scope:** Login flow, dashboard load, open Book Vehicle modal, check Pilot dropdown and “Dates (Including Vehicle Transportation)” label; optional: full booking and conflict warning.  
- **Commands:** `npm run test:e2e` (headed or headless).  
- **Config:** `playwright.config.js`; base URL e.g. `http://localhost:5173` (or staging URL for CI).  
- **CI:** Run on PR against main; target staging or local build.

### 5.3 What is set up in this repo

- **Vitest:** Configured in `vite.config.js` (or `vitest.config.js`); example unit test under `src/lib` or `src/__tests__`.  
- **Playwright:** Config and example spec in `e2e/`; scripts in `package.json`: `test`, `test:unit`, `test:e2e`.

(If not yet added, Phase 4 task 10 includes adding these configs and first tests.)

---

## 6. File Reference

| File | Description |
|------|-------------|
| **PRD.md** | Product requirements (project root). |
| **PROJECT_REVIEW_AND_TASKS.md** | This review and task list. |
| **TESTING.md** | Manual test URL, unit/E2E commands, UAT and CI notes. |
| **.cursorrules** | Senior engineering / development guidelines. |

Use Phase 1 → 4 as the implementation order and run UAT on Staging before production release.
