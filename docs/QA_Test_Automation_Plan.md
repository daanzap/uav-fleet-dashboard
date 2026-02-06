# Test Automation Plan — DeltaQuad Fleet Manager

**Status:** Implemented (CI + unit + E2E + docs).  
**Goal:** Have automation tests and unit tests, and run them after every development change.

---

## 1. Current State

### What Exists

| Layer | Tool | Config | What's Covered |
|-------|-----|--------|----------------|
| **Unit** | Vitest | `vite.config.js` → `test` block, `src/test/setup.js` | **1 file:** `src/lib/constants.test.js` (PILOT_OPTIONS only) |
| **E2E** | Playwright | `playwright.config.js`, port 5174 | **1 spec:** `e2e/app.spec.js` — 2 tests: home → login redirect, login page visible |
| **UAT** | Manual | `docs/UAT_SIGN_OFF_SUNDAY.md` | 4 PRD acceptance tests on staging (no automation) |
| **CI** | GitHub Actions | `.github/workflows/deploy.yml` | Build + deploy only; **no test steps** |

### Scripts (package.json)

- `npm run test` — Vitest watch
- `npm run test:run` / `npm run test:unit` — Vitest run once
- `npm run test:e2e` — Playwright (starts app on 5174)

---

## 2. Gaps

1. **Unit tests:** Only constants are tested. No tests for:
   - `src/lib/database.js` (Supabase calls; need mocks)
   - Pure helpers (e.g. date/overlap logic if extracted)
   - Critical UI logic (e.g. overlap warning, JSON validation in EditVehicleModal)
2. **E2E tests:** Only unauthenticated redirect + login page. No coverage for:
   - Login → dashboard → vehicles list
   - Book Vehicle (Risk/Location, overlap warning)
   - Edit Vehicle (JSON hw_config)
   - Calendar Overview
3. **CI:** Tests are not run on push/PR; only build + deploy.
4. **Workflow:** No documented or enforced “run tests after develop” step.

---

## 3. Proposed Plan

### 3.1 Unit Tests (Vitest)

- **Add tests for:**
  - **`src/lib/constants.js`** — Already done.
  - **`src/lib/database.js`** — Mock Supabase client; test that correct methods are called and responses are shaped correctly (e.g. `fetchVehicles`, `createBooking`). No real DB in unit tests.
  - **Pure logic:** If overlap detection or date helpers are extracted to a small module, add unit tests for those.
  - **Components (optional, higher ROI first):** Use React Testing Library to test BookingModal overlap warning visibility and EditVehicleModal JSON validation messages. Mock Supabase/AuthContext.
- **Convention:** Keep `src/**/*.test.js` (or `*.spec.js`); Vitest already includes these.
- **Run after develop:** `npm run test:run` before commit/PR.

### 3.2 E2E Tests (Playwright)

- **Add specs/scenarios:**
  - **Authenticated flow (if test user available):** Login → dashboard → vehicles visible.
  - **Booking flow:** Open Book modal → fill Pilot, Project, Risk, Location, dates → submit (mock or test DB).
  - **Overlap warning:** Create or assume existing booking; pick overlapping dates → assert warning text visible, submit still allowed.
  - **Edit Vehicle:** Open Edit → change hw_config JSON → save → assert no error (or success toast).
  - **Calendar:** Open Calendar Overview → assert calendar visible, week numbers present.
- **Constraints:** E2E against real Supabase (staging or test project) needs a stable test user and possibly seeded data; otherwise run against local dev and document that UAT on staging remains manual.
- **Run after develop:** `npm run test:e2e` after unit tests, especially before PR.

### 3.3 CI (GitHub Actions)

- **Add a test job (or extend deploy workflow):**
  - Run `npm run test:run` on every push/PR.
  - Option A: Run `npm run test:e2e` in same workflow (needs app URL; e.g. start with `npx vite --port 5174` and point Playwright at it).
  - Option B: Run E2E only on push to `main` or on schedule (e.g. nightly) against staging URL to avoid flakiness and secrets in PRs.
- **Branch protection (optional):** Require “test” job to pass before merge.

### 3.4 “Test After Develop” Workflow

- **Document in README and/or TESTING.md:**
  1. After implementing a feature or fix, run:
     - `npm run test:run`
     - `npm run test:e2e`
  2. Fix any failures before pushing.
  3. CI will run the same (or subset of) tests on push/PR.
- **Optional:** Add a `prepush` or `pre-commit` script that runs `npm run test:run` (and optionally `npm run test:e2e`) so developers don’t forget.

### 3.5 UAT (Sunday Sign-off)

- **Keep manual** for now: `docs/UAT_SIGN_OFF_SUNDAY.md` — 4 PRD tests on staging.
- **Later:** If staging has a dedicated test user and stable data, consider automating the same 4 scenarios as E2E (Isolation, Shared Pool, Snapshot, Conflict) and run them in CI against staging URL.

---

## 4. Priority Order (When Implementing)

1. **CI:** Add `npm run test:run` to a new or existing workflow (fast, no new tests).
2. **Unit:** Add database.js tests with mocked Supabase; add any extracted pure-helpers tests.
3. **E2E:** Add authenticated dashboard + vehicles, then Book modal (Risk/Location + overlap), then Edit Vehicle + Calendar.
4. **Docs:** Update TESTING.md and README with “test after develop” and CI behaviour.
5. **Optional:** Pre-push hook or script; later automate UAT scenarios on staging.

---

## 5. Summary

| Question | Answer |
|----------|--------|
| Do we have automation tests? | Yes, but minimal: 1 unit file (constants), 2 E2E tests (redirect + login). |
| Any plans? | TESTING.md and READY_TO_TEST describe manual UAT and optional CI; no written plan for expanding automation. |
| If not, make test automations + unit tests? | Plan above: add unit tests (database + helpers + optional component logic), expand E2E (dashboard, booking, overlap, edit, calendar), add CI for `test:run` (and optionally E2E). |
| Ensure we test after we develop? | Document “run test:run + test:e2e before push”; add CI; optionally add pre-push script. |

---

## 6. Implementation done (Feb 2026)

- **CI:** `.github/workflows/test.yml` — unit job + e2e job on push/PR to `main`.
- **Unit:** `src/lib/database.test.js` — mocked Supabase; tests for getVehicles, getVehicle, getBookings, createBooking, checkBookingConflict, getConflictBooking, getProfile, updateVehicle, deleteBooking. Plus existing `constants.test.js`.
- **E2E:** `e2e/app.spec.js` — redirect, login page, Google sign-in button, no dashboard when unauthenticated. `e2e/dashboard.spec.js` — authenticated flows (skipped unless `E2E_AUTH_EMAIL`/`E2E_AUTH_PASSWORD` set).
- **Docs:** TESTING.md §0 "Test after develop", §2/§3/§5 updated; README "Testing (run after develop)" added.
