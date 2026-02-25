# Login 401 Fix (English)

**Situation:** Vercel deployment protection is off, but after clicking "Sign in with Google" you get **401**. That indicates **Supabase and Google OAuth configuration**, not Vercel.

---

## Do not change: OAuth Server page

If you see **Authentication → OAuth Server** (Site URL, Authorization Path, Allow Dynamic OAuth Apps, etc.):

- **Leave it as is.** That page is for using your project as an OAuth provider for other apps, not for users signing in with Google on your site.
- Change only: **URL Configuration** and **Providers → Google**.

---

## Summary — What to do for Google sign-in

| # | Where | What to change |
|---|--------|----------------|
| 1 | Supabase → **Authentication** → **URL Configuration** | Set **Site URL** = `https://uav-fleet-dashboard.vercel.app`, add the URLs from "Step 1" below to **Redirect URLs**, then **Save**. |
| 2 | **Google Cloud Console** → APIs & Services → Credentials → your OAuth client | Add to **Authorized redirect URIs**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (get project ref from Supabase project URL), then save. |

After 1 and 2, clear browser cache or try in an incognito window.

---

## Not using Google Cloud Console — Use email + password

If you do not want to use Google Cloud Console, you can skip Google OAuth and use **email + password** for internal testing:

1. **Code:** `ENABLE_EMAIL_AUTH` is set to `true`; the login page shows the email/password form.
2. **Supabase:** **Authentication** → **Providers** → **Email** → ensure **Enabled**, then save.
3. **First use:** On the login page choose "Create account", register with a company email, then use that to sign in.

No Google Cloud Console is required; only Supabase URL Configuration (Step 1) needs to be correct for internal testing. You can add Google OAuth later if needed.

---

## Why 401?

A 401 on the browser’s `grant_type=pkce` request usually means:

1. **Supabase Site URL** does not match the URL you open in the browser.
2. **Supabase Redirect URLs** do not include the URL used after OAuth callback.
3. **Google Cloud Console** "Authorized redirect URIs" does not include the Supabase callback URL.

Fixing the three items above resolves the issue.

---

## Step 1: Supabase dashboard

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → select your project.
2. Go to **Authentication** → **URL Configuration**.
3. Set:

   | Field | Value |
   |-------|--------|
   | **Site URL** | `https://uav-fleet-dashboard.vercel.app` (no trailing slash) |
   | **Redirect URLs** | Add all of the following, one per line: |

   ```
   https://uav-fleet-dashboard.vercel.app
   https://uav-fleet-dashboard.vercel.app/
   http://localhost:5173
   http://localhost:5173/
   http://localhost:5174/uav-fleet-dashboard/
   ```

   If you use other preview URLs (e.g. `uav-fleet-dashboard-git-main-xxx.vercel.app`), add both with and without trailing slash.
4. Click **Save**.

---

## Step 2: Google Cloud Console (Google OAuth)

1. Open [Google Cloud Console](https://console.cloud.google.com) → select project.
2. **APIs & Services** → **Credentials**.
3. Open your **OAuth 2.0 Client ID** (Web application).
4. **Authorized JavaScript origins** should include:
   - `https://uav-fleet-dashboard.vercel.app`
   - `http://localhost:5173` (for local testing).
5. **Authorized redirect URIs** must include the Supabase callback (replace the project ref with yours):
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
6. Save.

---

## Step 3: Vercel environment variables

1. Vercel project → **Settings** → **Environment Variables**.
2. Ensure these are set for Production and Preview:
   - `VITE_SUPABASE_URL` = your Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key.
3. If you change them, **Redeploy** so the new build uses the new values.

---

## Checklist

- [ ] Supabase **Site URL** = `https://uav-fleet-dashboard.vercel.app`
- [ ] Supabase **Redirect URLs** include all URLs above (including local).
- [ ] Google **Authorized redirect URIs** includes Supabase `/auth/v1/callback`.
- [ ] Vercel has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` and has been redeployed.

Then clear cache or use incognito and try "Sign in with Google" again. If it still returns 401, share the full browser Console error message.

---

## Site is already on Vercel

The app is already deployed at **https://uav-fleet-dashboard.vercel.app**. You do not need to "push to another site"; configure Supabase and Google as above and use the same URL for internal sign-in testing.
