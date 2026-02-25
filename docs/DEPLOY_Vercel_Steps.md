# Vercel Deployment Steps (English)

## Option 1: Connect via Vercel Website + GitHub (Recommended)

### 1. Connect project
1. Open [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New…** → **Project**.
3. Choose **Import Git Repository** and select the `uav-fleet-dashboard` repo.
4. If the repo is not visible, click **Configure GitHub App** to grant Vercel access.

### 2. Build and output settings (often auto-detected)
- **Framework Preset:** Vite (select Vite if not auto-selected).
- **Build Command:** `npm run build` (or leave empty to use project `vercel.json`).
- **Output Directory:** `dist` (or leave empty to use `vercel.json`).
- **Install Command:** `npm install` (optional).

### 3. Environment variables (required)
Under **Environment Variables**, add:

| Variable | Value | Environments |
|----------|--------|--------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon (public) key | Production, Preview, Development |

- Do not add leading/trailing spaces to values.
- If Staging uses a different Supabase project, enable only Preview and set Staging URL/Key there.

### 4. Optional: Node version
- Under **Settings** → **General** → **Build & Development Settings**, set **Node.js Version** to `18.x` or `20.x` (match `package.json` `engines`).

### 5. Deploy
- Click **Deploy** and wait for the build to finish.
- You will get a Staging URL, e.g. `https://uav-fleet-dashboard-xxx.vercel.app`.

---

## Option 2: Vercel CLI

### 1. Log in
```bash
npx vercel login
```
Follow the prompts to sign in with Email or GitHub.

### 2. Set environment variables (local, for CLI builds only)
In the project directory:
```bash
export VITE_SUPABASE_URL="your_Supabase_URL"
export VITE_SUPABASE_ANON_KEY="your_Anon_Key"
```

### 3. Deploy
```bash
# Preview (Staging)
npx vercel

# Production
npx vercel --prod
```
The first run will ask for project name and whether to link to an existing Vercel project.

### 4. Set env in Vercel dashboard (recommended)
- Go to [Vercel Dashboard](https://vercel.com/dashboard) → select project → **Settings** → **Environment Variables**.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` so every deploy uses them without local export.

---

## Checklist

- [ ] Repo connected via GitHub or `vercel login` done.
- [ ] Build Command is `npm run build` (or as in `vercel.json`).
- [ ] Output Directory is `dist` (or as in `vercel.json`).
- [ ] `VITE_SUPABASE_URL` is set.
- [ ] `VITE_SUPABASE_ANON_KEY` is set.
- [ ] (Optional) Node version set to 18 or 20.
- [ ] Deploy succeeded and Staging URL opens in the browser.

---

## Project configuration

- `vercel.json` already sets: `buildCommand`, `outputDirectory`, `installCommand`, `framework: vite`, and SPA `rewrites`.
- `vite.config.js` uses `base: '/'` when `VERCEL` is set; no need to change base.

If the build still fails, share the error from the Vercel build log for further troubleshooting.
