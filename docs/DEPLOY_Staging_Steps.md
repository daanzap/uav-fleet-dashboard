# Staging Deployment Steps (Vercel / Netlify) — English

Follow this order: **Deploy to Staging → Staging UAT sign-off → Tag and deploy production from tag**.  
Rollback = redeploy the previous tag.

---

## 1. Deploy to Staging

Create a project in **Vercel** or **Netlify** linked to this repo, set environment variables, deploy, and get the Staging URL.

### 1.1 Vercel

1. Sign in at [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. **Import** this Git repo (GitHub/GitLab/Bitbucket).
3. **Configure Project**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Root Directory:** leave empty (or project root)
4. **Environment Variables** (required)
   - `VITE_SUPABASE_URL` = your Supabase **Project URL** (API Settings)
   - `VITE_SUPABASE_ANON_KEY` = Supabase **anon** key (API Settings)
5. **Deploy**. You will get a Staging URL, e.g. `https://uav-fleet-dashboard-xxx.vercel.app`.

### 1.2 Netlify

1. Sign in at [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**.
2. Connect this Git repo.
3. **Build settings** (from `netlify.toml`; verify)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. **Site settings** → **Environment variables** → **Add variable**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. **Deploy site**. You will get a Staging URL.

### 1.3 Notes

- Staging can use the **same Supabase project** (dev) or a separate Staging project.
- After deploy, open the Staging URL and confirm: you can sign in and see the vehicle list.

---

## 2. Staging UAT (PRD §5)

Run these four checks on the **Staging URL**. Proceed only when **all four pass**.

| # | Item | Description |
|---|------|-------------|
| 1 | **Isolation** | Sign in with a Marketing account → only Marketing vehicles are visible; R&D/Training vehicles are not. |
| 2 | **Shared pool** | Sign in with an R&D account → Training vehicles are visible and bookable. |
| 3 | **Snapshot** | Change Vehicle A’s battery to "Battery-Old" → create booking X → change Vehicle A to "Battery-New" → view booking X; it should show "Battery-Old". |
| 4 | **Conflict** | Create two bookings for the same vehicle with overlapping times → warning is shown, but submit is still allowed and both bookings succeed. |

**Sign-off:** Use the UAT sign-off checklist. **All passed** = Staging UAT complete; you can proceed to production release.

---

## 3. Production release (tag and deploy from tag)

**Do not deploy production directly from a branch.** Always deploy from a tag.

### 3.1 Create and push tag

```bash
# On main (or release branch)
git tag v1.0.0

# Push tag to remote
git push origin v1.0.0
```

### 3.2 Deploy production from that tag

- **Vercel:** Project → **Settings** → **Git**: set Production Branch to `none` if needed, and use **Deploy Hook** or manual **Deploy** and select **tag v1.0.0**; or create a separate Production project that deploys only from tags.
- **Netlify:** **Site settings** → **Build & deploy** → **Continuous Deployment**: set Production branch to `main`; for tag-based deploy use **Deploys** → **Trigger deploy** or configure build to use a tag.

**Simple flow:**

1. After UAT, tag the release commit: `git tag v1.0.0`, `git push origin v1.0.0`.
2. If Production is tied to `main`, ensure that commit is on `main` (e.g. after merge); then the next deploy is that version.
3. If the platform supports “Deploy from tag”, trigger a production build from tag `v1.0.0`.

### 3.3 Rollback

Redeploy the **previous tag** (e.g. if production is `v1.0.0`, rollback = deploy `v0.9.0`). In Vercel/Netlify, select the deploy for that tag and set it as **Production**, or trigger a new deploy from that tag.

---

## 4. Optional: E2E all green

Some E2E tests are **skipped** when auth is not configured (`e2e/dashboard.spec.js` authenticated tests).

- **Local:** Set `E2E_AUTH_EMAIL` and `E2E_AUTH_PASSWORD` in `.env` (test account), then run `npm run test:e2e`.
- **CI:** Add `E2E_AUTH_EMAIL` and `E2E_AUTH_PASSWORD` in GitHub **Settings → Secrets** and pass them in the `.github/workflows/test.yml` e2e job `env`. See `TESTING.md` and `.env.example`.

---

**Summary:** Deploy Staging → Staging UAT sign-off → tag and deploy production from tag; rollback = redeploy previous tag.
