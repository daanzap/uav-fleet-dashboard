# Sprint to Demo — Plan

**Goal:** Sunday testing done, demo next week.  
**No code in this doc — planning only.**

---

## Can we finish everything today?

**Realistic:** Not every single PRD item in one day. **Yes** to finishing all **demo-critical** work today, then **Saturday/Sunday = test + fix**, **next week = demo**.

Prioritize: **DB + RLS + Booking (form + Soft Lock + Snapshot) + Calendar real data**.  
Defer if needed: **department-based RLS** (can keep role-based for demo), **hw_config JSONB editor** (keep text field for demo).

---

## What’s left (short list)

| # | Item | Demo need | Effort |
|---|------|-----------|--------|
| 1 | DB: `department` on profiles + vehicles; bookings: `risk_level`, `location`, `snapshotted_hw_config`; `hw_config` → JSONB | High (snapshot, form) | Medium |
| 2 | DB trigger: on booking INSERT, copy vehicle `hw_config` → `snapshotted_hw_config` | High (PRD) | Small |
| 3 | RLS by department (R&D+Training shared, Marketing only, Admin all) | High (PRD) | Medium |
| 4 | Booking form: Risk Level dropdown, Location field; align with DB | High | Small |
| 5 | Soft Lock: overlap check + warning toast, still allow submit | High (PRD) | Small |
| 6 | AuthContext: load `department` from profiles | High (for RLS) | Small |
| 7 | Calendar: real bookings from Supabase, ISO week numbers, vertical stacking for same day | High (PRD) | Medium |
| 8 | Vehicle editor: hw_config as JSONB + key-value or JSON UI | Medium (can demo with text) | Medium |
| 9 | Staging deploy + env (e.g. Vercel preview + staging Supabase) | High (test before demo) | Small |
| 10 | Unit + E2E tests green; UAT checklist on staging | High (confidence) | Medium |

---

## Day-by-day plan

### Today (implementation day)

**Morning — DB & backend**

1. Migration: add `department` (profiles, vehicles); add `risk_level`, `location`, `snapshotted_hw_config` to bookings; `hw_config` → JSONB.
2. Migration: RLS by department (R&D+Training see both; Marketing only Marketing; Admin all).
3. DB trigger: on `bookings` INSERT, set `snapshotted_hw_config` from current vehicle `hw_config`.

**Afternoon — Frontend**

4. AuthContext: fetch and expose `department` from profiles.
5. Booking form: add Risk Level (Low/Medium/High), Location; required; match DB columns.
6. Soft Lock: before submit, check same vehicle + overlapping time; show warning toast; keep submit enabled.
7. Calendar: load bookings from Supabase; show ISO week numbers; same-day events stacked vertically.

**Evening (if time)**

8. Vehicle editor: hw_config JSONB + simple key-value or JSON textarea (or leave as text for demo).
9. Staging: deploy app (e.g. Vercel) + point to staging Supabase (or second project); document URL.

**End of day:** All demo-critical features implemented; app runs locally and on staging.

---

### Saturday — Test & fix

1. Run unit tests (`npm run test:run`); fix failures.
2. Run E2E (`npm run test:e2e`); fix failures.
3. Manual pass on staging: login, book vehicle, check conflict warning, check calendar, edit vehicle.
4. Fix bugs found; redeploy staging if needed.

**End of day:** Tests green; staging stable.

---

### Sunday — UAT & sign-off

1. UAT on staging (PRD §5): Isolation (Marketing sees only Marketing vehicles), Shared Pool (R&D sees R&D+Training), Snapshot (booking shows old hw_config), Conflict (warning but submit succeeds).
2. Document any known limitations for demo.
3. Tag release (e.g. `v1.0.0-demo`); optional: deploy same build to production or keep demo from staging URL.

**End of day:** Testing complete; ready for demo.

---

### Next week — Demo

1. Use staging (or production) URL for demo.
2. Prepare 2–3 user flows: Marketing login (only Marketing vehicles), R&D login (shared pool), create booking with conflict warning, show calendar and snapshot on a past booking.
3. Rollback plan: if prod, “revert = redeploy previous tag”; if staging-only, no prod rollback needed.

---

## Priority if time is short today

**Must have for demo:**

- DB: department, snapshot column + trigger, booking columns (risk_level, location).
- Booking form: Risk Level, Location.
- Soft Lock: warning toast, submit still works.
- Calendar: real data + week numbers (stacking nice-to-have).
- Staging URL so you can test and demo from one link.

**Can simplify for demo:**

- RLS: keep role-based (editor/admin) if department RLS takes too long; say “department RLS next sprint” in demo.
- Vehicle hw_config: keep text field; say “JSONB editor coming” in demo.

---

## One-line summary

**Today:** DB + RLS + Booking (form + Soft Lock + snapshot trigger) + Calendar real data + staging deploy.  
**Saturday:** Unit + E2E green, manual staging pass, fix bugs.  
**Sunday:** UAT (PRD §5), tag, testing complete.  
**Next week:** Demo from staging (or prod) with 2–3 prepared flows.
