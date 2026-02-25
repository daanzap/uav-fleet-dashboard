# Login Bug Diagnosis

**Date:** February 4, 2026  
**Issue:** Unable to login - Authentication session not initializing

---

## 🐛 Symptoms

From the browser console:
```
Initial session check: false
Auth event: INITIAL_SESSION Session: false
```

Additionally, there's a CSP warning:
```
The Content Security Policy directive 'frame-ancestors' is ignored 
when delivered via a <meta> element.
```

---

## 🔍 Root Causes Identified

### 1. Google OAuth Not Configured in Supabase ⚠️
**Most Likely Cause**

The app is trying to use Google OAuth (`signInWithGoogle`), but:
- Google OAuth provider needs to be enabled in Supabase Dashboard
- Google OAuth Client ID and Secret need to be configured
- Authorized redirect URLs need to be set

**To Fix:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add Google OAuth credentials (Client ID & Secret)
4. Add authorized redirect URLs:
   - `http://localhost:5174/uav-fleet-dashboard/` (dev)
   - Your production URL (Vercel)

### 2. Email/Password Auth is Disabled 🔒
**Feature Flag Set to False**

In `Login.jsx` line 6:
```javascript
const ENABLE_EMAIL_AUTH = false
```

This means **ONLY Google OAuth is available** for login. If Google OAuth isn't configured, there's no way to login.

---

## ✅ Quick Fix Options

### Option A: Enable Email/Password Login (Temporary)
**Use this to test the app immediately**

Change `Login.jsx` line 6:
```javascript
const ENABLE_EMAIL_AUTH = true  // Changed from false
```

Then you can create an account with email/password.

### Option B: Configure Google OAuth (Recommended)
**Proper production solution**

1. **Get Google OAuth Credentials:**
   - Go to Google Cloud Console
   - Create OAuth 2.0 Client ID
   - Add authorized JavaScript origins:
     - `http://localhost:5174`
     - Your Vercel domain
   - Add authorized redirect URIs:
     - `https://citoiconzejdfjjefnbi.supabase.co/auth/v1/callback`

2. **Configure in Supabase:**
   - Go to Supabase Dashboard
   - Authentication → Providers → Google
   - Enable Google provider
   - Enter Client ID and Secret from Google Console
   - Save

3. **Update Redirect URLs in Supabase:**
   - Site URL: Your main domain
   - Redirect URLs: Add all allowed URLs

---

## 🧪 Testing Checklist

### After Enabling Email/Password:
- [ ] Can see email/password form on login page
- [ ] Can create new account
- [ ] Receive confirmation email (check Supabase email templates)
- [ ] Can login with created credentials
- [ ] Redirects to dashboard after login

### After Configuring Google OAuth:
- [ ] Click "Sign in with Google" doesn't error
- [ ] Redirects to Google login page
- [ ] After Google auth, returns to app
- [ ] User is logged in and sees dashboard
- [ ] Session persists on page refresh

---

## 🔧 Additional Fixes Needed

### 1. Check Supabase Connection
Verify the Supabase credentials are correct:
```javascript
// In supabase.js
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
```

### 2. Check RLS Policies
Ensure Row Level Security policies allow:
- Creating new user profiles
- Reading user profiles during login
- Writing activity logs

### 3. CSP Warning (Low Priority)
The Content Security Policy warning is informational and doesn't block login, but can be fixed by:
- Removing CSP from `<meta>` tags in `index.html`
- Adding CSP headers at server level (Vercel headers config)

---

## 📝 Recommended Immediate Action

**Do this NOW to unblock development:**

1. Enable email/password authentication
2. Create a test account
3. Verify login works
4. Then configure Google OAuth properly for production

**Command to apply quick fix:**
```bash
# Edit Login.jsx
# Change line 6 from:
const ENABLE_EMAIL_AUTH = false
# To:
const ENABLE_EMAIL_AUTH = true
```

---

## 🚨 Important Notes

### Why Email Auth is Disabled
The original developer likely disabled it because:
- Company policy: Use Google Workspace SSO only
- Security: Centralized authentication via Google
- Convenience: No password management needed

### Production Recommendation
For production, you should:
- Configure Google OAuth properly
- Keep email/password disabled (if company policy requires SSO)
- OR enable email/password as backup authentication method

---

**Next Steps:**
1. Apply quick fix to enable email login
2. Test login functionality
3. Configure Google OAuth for production
4. Update this document with results
