# Vercel OAuth Redirect Loop Fix (English)

## Problem

After deploying to Vercel, Google OAuth sign-in goes into a redirect loop and never leaves the login page.

## Root cause

Supabase OAuth redirect URLs are not configured correctly, so the OAuth callback is not handled properly.

## Fix

### 1. Add redirect URLs in Supabase Dashboard

1. Sign in at [Supabase Dashboard](https://app.supabase.com).
2. Select your project.
3. Go to **Authentication** → **URL Configuration**.
4. Under **Redirect URLs**, add (one per line):

```
http://localhost:5173
http://localhost:5173/
https://uav-fleet-dashboard.vercel.app
https://uav-fleet-dashboard.vercel.app/
https://uav-fleet-dashboard-git-main-alexs-projects-043bd484.vercel.app
https://uav-fleet-dashboard-git-main-alexs-projects-043bd484.vercel.app/
```

5. Click **Save**.

### 2. Set Site URL

On the same page, set **Site URL** to:

```
https://uav-fleet-dashboard.vercel.app
```

### 3. Check Google OAuth settings

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Select your project.
3. **APIs & Services** → **Credentials**.
4. Open your **OAuth 2.0 Client ID** (Web application).
5. Under **Authorized redirect URIs**, add:

```
https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
```

Replace `[YOUR-PROJECT-REF]` with your Supabase project reference ID (from the Supabase project URL).

### 4. Redeploy on Vercel

```bash
git add .
git commit -m "fix: improve OAuth redirect handling"
git push origin main
```

## Code changes (AuthContext.jsx)

1. **Simpler redirectTo URL**  
   Use `window.location.origin` instead of a complex baseUrl so it works in all environments.

2. **Auth state handling**  
   Use a `mounted` flag to avoid race conditions; clear URL hash after successful sign-in; clear hash on error only.

3. **Error handling**  
   Clear hash only when it contains `error`; add console logging for debugging if needed.

## Verify

1. Clear browser cookies and localStorage.
2. Open https://uav-fleet-dashboard.vercel.app.
3. Click "Sign in with Google".
4. Sign-in should succeed and redirect to the dashboard.

## FAQ

**Q: Still in a redirect loop?**  
A: Confirm Supabase Redirect URLs are saved, clear cache and cookies, check the browser Console for errors, and confirm Vercel env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly.

**Q: Works locally but not on Vercel?**  
A: Confirm Vercel environment variables are set and Supabase Redirect URLs include the Vercel URL.

**Q: How to see OAuth errors?**  
A: Open DevTools → Console and look for `Auth event:` and `Auth session error:`.

## References

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase OAuth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
