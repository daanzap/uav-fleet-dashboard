# Environment and deploy (Staging vs Production)

## Do I have Staging and Production?

- **One Supabase project**  
  You only have one environment. The app talks to whatever `VITE_SUPABASE_URL` and keys you put in `.env`. You don’t need to label it “staging” or “production” unless you want to.

- **Two Supabase projects**  
  If you create a second project (e.g. one for testing, one for real users):
  - **Staging** = the project you use for testing (run migrations and dev there first).
  - **Production** = the project real users use.
  - Use two `.env` files (e.g. `.env.staging` and `.env.production`) or switch the values in `.env` when you deploy to each.

**Summary:** Your “environment” is decided by the Supabase URL in `.env`. One project = one environment; two projects = usually one staging + one production.

---

## E2E tests (optional)

You **do** have E2E tests (`npm run test:e2e`, Playwright).

- **Without** `E2E_AUTH_EMAIL` / `E2E_AUTH_PASSWORD` in `.env`: E2E runs but **skips the 4 tests** that need a real login. That’s fine for a quick check.
- **With** them: those 4 tests run (dashboard after login, book modal, edit vehicle, etc.).

To enable the authenticated E2E tests:

1. In Supabase: Authentication → create a test user (email + password).
2. In your project `.env` (copy from `.env.example` if needed), add:
   ```env
   E2E_AUTH_EMAIL=that-test-user@example.com
   E2E_AUTH_PASSWORD=that-user-password
   ```
3. Run: `npm run test:e2e`

Keep this test user only for E2E; don’t use a real person’s account.

---

## Version control (Git)

Git is **already set up**: repo exists, `origin` is `git@github.com:Sachakafka/uav-fleet-dashboard.git`, branch `main`.

**Suggested workflow:**

1. After migrations or feature work:
   ```bash
   git status
   git add <files you want>
   git commit -m "feat(db): add run_all_migrations_01_to_12.sql"
   git push origin main
   ```
2. Don’t commit `.env` (it’s in `.gitignore`); do keep `.env.example` updated with variable names and short comments.

If `test-results/.last-run.json` appears as modified, it’s Playwright output; `test-results/` is in `.gitignore`, so you can leave it unstaged or run:
`git checkout -- test-results/` to discard local changes in that folder.
