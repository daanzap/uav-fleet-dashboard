# Handover Guide — UAV Fleet Dashboard

This document helps new colleagues take over development. All project documentation is in **English**.

---

## Repository structure (after cleanup)

| Location | Purpose |
|----------|---------|
| **Root** | `README.md`, `PRD.md`, `TESTING.md`, `TODO.md`, this file |
| **docs/** | All guides: dev setup, deploy, OAuth, database, QA. See `docs/00_README_DOCS_INDEX.md` |
| **docs/ARCHIVE/** | Old phase-specific and legacy docs (reference only). Legacy Chinese design docs are here. |
| **src/** | React app (Vite). Key: `src/App.jsx`, `src/contexts/AuthContext.jsx`, `src/pages/`, `src/components/`, `src/lib/` |
| **db/** | SQL migrations. Run in order in Supabase SQL Editor. See `docs/DEV_Database_Setup.md` |
| **e2e/** | Playwright E2E tests |

---

## First steps for new developers

1. **Read** `README.md` for overview, stack, and getting started.
2. **Setup** Follow `docs/DEV_Quick_Start_Development_Setup.md` and `docs/DEV_Database_Setup.md`.
3. **Auth** For Google sign-in / OAuth issues: `docs/DEV_OAuth_Setup_Checklist.md`, `docs/DEV_Vercel_OAuth_Fix.md`, `docs/DEV_Login_401_Fix.md`.
4. **Deploy** Staging/production: `docs/DEPLOY_Staging_Steps.md`, `docs/DEPLOY_Vercel_Steps.md`, `docs/DEPLOY_Release_and_Task_Flow.md`.
5. **Documentation index** Use `docs/00_README_DOCS_INDEX.md` to find any doc by topic or role.

---

## Key documentation (all in English)

- **Development:** `docs/DEV_Quick_Start_Development_Setup.md`, `docs/DEV_Database_Setup.md`, `docs/ENV_AND_DEPLOY.md`
- **Deployment:** `docs/DEPLOY_Vercel_Steps.md`, `docs/DEPLOY_Staging_Steps.md`, `docs/DEPLOY_Release_and_Task_Flow.md`
- **Auth / Login:** `docs/DEV_OAuth_Setup_Checklist.md`, `docs/DEV_Vercel_OAuth_Fix.md`, `docs/DEV_Login_401_Fix.md`
- **Testing:** `TESTING.md` (root), `docs/TESTING_GUIDE.md`, `docs/QA_Test_Automation_Plan.md`
- **Planning:** `PRD.md`, `TODO.md`, `docs/03_ALL_PHASES_Implementation_Plan.md`, `docs/04_FUTURE_Migration_to_Company_Server.md`

---

## What was cleaned up

- **Removed:** Chinese-named docs (replaced with English: `DEPLOY_Vercel_Steps.md`, `DEV_Login_401_Fix.md`). Chinese deployment/OAuth content translated into existing or new English docs.
- **Replaced:** `docs/DEPLOY_Staging_Steps.md` and `docs/DEV_Vercel_OAuth_Fix.md` are now English-only.
- **Archived:** Root-level phase summaries (Phase 0/2/3), login/fix logs, and legacy Chinese design docs moved to `docs/ARCHIVE/`. See `docs/ARCHIVE/README.md`.
- **Single entry:** This handover + `docs/00_README_DOCS_INDEX.md` so colleagues have one place to find everything.

---

## Tech stack (reminder)

- **Frontend:** React (Vite), Tailwind CSS, Shadcn UI, Lucide React.
- **Backend/DB:** Supabase (PostgreSQL). No `service_role` on client; use RLS.
- **State:** TanStack Query. No Redux.
- **Testing:** Vitest (unit), Playwright (E2E).
- **Commits:** Conventional Commits; atomic commits per logical step.

---

**Last updated:** February 2026. For questions, use the docs index and the README.
