# Alignment Before Build — What to Align On First

No code here. Use this so we agree on strategy, scope, and constraints **before** implementation and testing. Reduces gaps and rework.

---

## 1. Things you should tell me (or we decide together)

### Scope & demo

- **Demo audience:** Who will see the demo (internal only, external, mixed)? That affects how much we polish vs. ship “good enough.”
- **Demo scope:** Do we demo “full PRD” (department RLS, snapshot, Soft Lock, calendar, hw_config JSONB) or a **minimal viable demo** (booking works, calendar shows data, one conflict scenario)? Agreeing this avoids overbuilding.
- **Staging vs. production for demo:** Will demo use a staging URL or production? If production, we need a clear rollback and “no breaking changes” rule.

### Data & environment

- **Supabase:** One project for dev/staging/demo, or separate projects per environment? (Separate = cleaner but more setup.)
- **Test users:** Do you have (or will you create) at least: one R&D, one Marketing, one Admin? We need these for UAT (Isolation, Shared Pool).
- **Existing data:** Is there real vehicle/booking data we must preserve, or can we reset/migrate freely?

### Priorities when time is short

- **Must have for demo:** List the 3–5 things that **must** work (e.g. “book a vehicle,” “see calendar,” “conflict warning”). Everything else can be “next.”
- **Nice to have:** What can we drop or simplify if we run out of time (e.g. department RLS, JSONB editor, ISO week numbers)?

### Non‑functional

- **Performance:** Any hard requirements (e.g. “dashboard loads in &lt; 2s”) or “make it work first”?
- **Security:** Besides RLS and “no service_role on client,” any extra rules (e.g. audit log, IP allowlist)?
- **Browser/device:** Desktop only, or must work on tablet/mobile for demo?

---

## 2. Things I need from you (so I don’t assume wrong)

### Decisions only you can make

- **Department vs. role:** For demo, is it OK to keep **role-based** (viewer/editor/admin) and add **department** later, or must department-based visibility be in the first demo?
- **Soft Lock wording:** Exact copy for the warning toast? (PRD: “This slot is already booked by [Project Name]. Please coordinate with the owner.” — confirm or change.)
- **Pilot list:** Stay static (Devon, Edine, …) or later come from DB/team_members? Affects whether we add a “manage pilots” flow.

### Access & ops

- **Who runs migrations:** You run SQL in Supabase (or `npm run db:migrate`) or do you want scripts/instructions only?
- **Who deploys staging/prod:** You (e.g. Vercel/Netlify), or should the repo have CI/CD that deploys on tag/push?
- **Rollback:** If something breaks in prod, do you prefer “redeploy previous tag” only, or also a documented “emergency revert” (e.g. feature flag, DB backup)?

### Communication

- **How you prefer to “sign off”:** One message like “scope locked, go build,” or step-by-step (“finish DB, then I’ll test, then we do frontend”)?
- **When to pause:** If I find a big gap (e.g. “PRD says X but current schema can’t support it”), should I stop and ask you before changing schema/scope?

---

## 3. Gaps we should close before coding

### Product ↔ implementation

- **PRD vs. current app:** Some PRD fields (e.g. `project_name`, `risk_level`, `location`) are partially in DB or UI. Confirm: “Booking form must have exactly these fields and validations” so we don’t miss one.
- **UAT = definition of done:** Agree that “testing complete” means: four PRD tests (Isolation, Shared Pool, Snapshot, Conflict) **passed on staging** and documented. That way we don’t ship without UAT.

### Data & schema

- **hw_config today:** Still text in DB; PRD wants JSONB. Do we migrate existing rows (e.g. wrap in `{"raw": "..."}`) or allow a one-time data fix/import?
- **department default:** New users: default department “R&D” or “unset until admin assigns”? Affects RLS and onboarding.

### Frontend ↔ backend

- **Calendar time zone:** Bookings use UTC (e.g. `T00:00:00Z`). Should calendar display in user’s local timezone or keep UTC for simplicity in v1?
- **Conflict definition:** “Same vehicle + overlapping start/end” — confirm. Any exception (e.g. same user can double-book)?

### Testing & release

- **What “green” means:** Unit + E2E pass, or also “manual UAT checklist done”? Agree so we don’t say “tests done” while UAT is missing.
- **Staging data:** Staging DB: copy of prod, or fresh seed? Affects whether we test with real-looking data or minimal fixtures.

---

## 4. Simple “kickoff alignment” checklist

Before implementation, we can confirm:

| # | Topic | Your answer / decision |
|---|--------|------------------------|
| 1 | Demo scope: full PRD or minimal (booking + calendar + one conflict)? | |
| 2 | Demo URL: staging only or production? | |
| 3 | Department-based RLS in first demo, or OK to keep role-based? | |
| 4 | Test users: R&D, Marketing, Admin — do you have them? | |
| 5 | Who runs DB migrations (you vs. me vs. script only)? | |
| 6 | Who deploys staging/prod? | |
| 7 | “Testing complete” = UAT four tests passed on staging? (Y/N) | |
| 8 | If time short: what’s the one thing we **must not** drop? | |

Once we fill this (even roughly), we can lock scope and order of work, then execute and test with fewer surprises.

---

## 5. How to use this doc

- **You:** Fill or comment on the “Your answer / decision” column (or reply in chat with the same points). Call out anything that’s still unclear.
- **Me:** I’ll assume nothing beyond what we’ve agreed here; if I hit a gap, I’ll ask before changing scope or schema.
- **Before each phase:** Quick check: “Scope still the same? Any new constraint?” Then build/test.

This keeps strategy and communication ahead of execution and closes the “middle gaps” before they become bugs or rework.

---

## 6. Recorded decisions (from your reply)

| # | Topic | Decision |
|---|--------|----------|
| 1 | **Demo audience** | Internal, R&D team. Presentable; not minimum — as complete as possible (except hardware config). |
| 2 | **Hardware configuration** | **Postpone.** You will give more instructions after internal discussion. Page/column model not yet decided. Skip hardware-config UI and schema changes for first demo. |
| 3 | **Demo URL** | **Staging.** Supabase for now. Later: migrate to company servers — we should consider how to prepare (e.g. Docker). |
| 4 | **Test accounts** | For now: everything on DeltaQuad company account; can view every pool. Later: separate R&D, Marketing, Training pilot accounts. First demo: role-based is OK. |
| 5 | **Current data** | **Must preserve all data.** No data loss; migrations must be backward-compatible or reversible. |
| 6 | **If time short** | Need: data in calendar, conflict scenario. Can make reservations (priorities). Department RLS and hardware config: **postpone.** |
| 7 | **Department vs. role** | **Keep role-based for first demo.** Department separation later. |
| 8 | **Who runs migration / deploys** | You / your team run migration and deploy for now (Supabase). |
| 9 | **Testing complete** | **Yes.** All four UAT tests passed on staging = testing complete. |

**Summary for build:** Demo = internal R&D, staging URL, Supabase, role-based, full-ish scope except hardware config (postpone). Preserve all data. Staging UAT = done. Later: company servers (consider Docker), department accounts.

---

## 7. Still to decide / optional later

- **Test users for UAT:** You said you haven’t thought it through. For first demo, one DeltaQuad account viewing all pools is OK. When we add department RLS later, we’ll need at least one R&D and one Marketing account for Isolation / Shared Pool tests.
- **Hardware configuration:** After your internal discussion, you’ll give more instructions; we’ll add that then.
- **Migration to company servers:** We’ll keep the app and DB easy to move (e.g. env-based Supabase URL, Docker-friendly setup) so future migration is straightforward.
- **Pilot list:** Stay static for now; we can switch to DB/team_members later if you decide.
- **Calendar time zone / conflict wording:** No change needed unless you specify; we’ll use PRD defaults.

You don’t need to reply to these now. We can lock scope and start implementation; when you have more on test accounts or hardware config, we’ll fold it in.
