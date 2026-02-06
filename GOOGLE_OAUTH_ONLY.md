# 🔐 Google OAuth Only - Configuration Guide

**Date:** February 4, 2026  
**Status:** ✅ Configured for Google OAuth ONLY

---

## ✅ Changes Applied

### 1. UI Configuration
**File:** `src/pages/Login.jsx`
- ✅ Email/password login form **DISABLED**
- ✅ Only Google OAuth button visible
- ✅ Clean, single sign-on interface

### 2. Auth Flow Fixed
**File:** `src/contexts/AuthContext.jsx`
- ✅ OAuth redirect URL includes correct base path
- ✅ Works in development: `http://localhost:5174/uav-fleet-dashboard/`
- ✅ Works in production: `https://your-domain.vercel.app/`

---

## 🎯 What Users See Now

### Login Page (Single Method):
```
┌─────────────────────────────────────┐
│          Sign In                    │
│     UAV Fleet Command               │
│                                     │
│  [🔵 Sign in with Google]          │
│                                     │
│  [Try another way] (disabled)       │
└─────────────────────────────────────┘
```

**Only one active login method: Google OAuth** ✅

---

## 🔧 Supabase Configuration Required

### Step 1: Verify Google OAuth is Enabled
1. Go to **Supabase Dashboard**
2. Navigate to: **Authentication → Providers**
3. Find **Google** provider
4. Ensure it's **ENABLED** ✅
5. Verify **Client ID** and **Client Secret** are configured

### Step 2: Add Redirect URLs
1. Go to: **Authentication → URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   http://localhost:5174/uav-fleet-dashboard/
   http://localhost:5173/uav-fleet-dashboard/
   https://your-production-domain.vercel.app/
   ```
3. **Save** changes

### Step 3: Disable Email Provider (Optional but Recommended)
Since you don't want email/password login:
1. Go to: **Authentication → Providers**
2. Find **Email** provider
3. **Disable** it
4. This prevents users from creating email/password accounts

**Benefits of disabling email provider:**
- ✅ Forces SSO (Google Workspace)
- ✅ Centralized authentication
- ✅ No password management needed
- ✅ Better security (Google's 2FA, etc.)

---

## 🧪 Testing Checklist

### Test Google OAuth Login:
- [ ] Refresh browser at `http://localhost:5174/uav-fleet-dashboard/`
- [ ] Only see "Sign in with Google" button
- [ ] No email/password form visible
- [ ] Click "Sign in with Google"
- [ ] Browser console shows: `Initiating Google OAuth with redirect: http://localhost:5174/uav-fleet-dashboard/`
- [ ] Redirects to Google login page
- [ ] Select Google account
- [ ] Returns to dashboard logged in
- [ ] Top-right shows your email initial
- [ ] Can navigate to Profile, Admin, etc.

### Verify Email Login is Hidden:
- [ ] No email input field on login page
- [ ] No password input field on login page
- [ ] No "Create account" link visible
- [ ] Only Google OAuth button active

---

## 🚨 Troubleshooting

### "OAuth Error" or "Invalid Redirect URL"
**Solution:** Add redirect URLs to Supabase
```
1. Supabase Dashboard → Authentication → URL Configuration
2. Add: http://localhost:5174/uav-fleet-dashboard/
3. Add: Your production URL
4. Save
```

### "Provider Not Configured"
**Solution:** Enable Google OAuth in Supabase
```
1. Supabase Dashboard → Authentication → Providers
2. Find Google
3. Click Enable
4. Enter Client ID and Secret from Google Cloud Console
5. Save
```

### Google OAuth Not Set Up Yet
**You need to configure Google Cloud Console first:**

1. **Create Google Cloud Project:**
   - Go to: https://console.cloud.google.com
   - Create new project or select existing

2. **Enable Google OAuth:**
   - APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application

3. **Configure Authorized Origins:**
   ```
   http://localhost:5174
   https://your-domain.vercel.app
   ```

4. **Configure Redirect URIs:**
   ```
   https://citoiconzejdfjjefnbi.supabase.co/auth/v1/callback
   ```

5. **Copy Credentials:**
   - Copy Client ID
   - Copy Client Secret
   - Add to Supabase Dashboard

### Still Can't Login
**Verify these items:**
- [ ] Google OAuth enabled in Supabase
- [ ] Client ID and Secret configured
- [ ] Redirect URLs added (both Google and Supabase)
- [ ] Browser allows popups/redirects
- [ ] No browser extensions blocking OAuth
- [ ] Clear browser cache/cookies
- [ ] Try incognito/private mode

---

## 🔒 Security Benefits of Google OAuth Only

### Advantages:
- ✅ **Single Sign-On (SSO):** Users authenticate with Google Workspace
- ✅ **No Password Management:** No password resets, no password leaks
- ✅ **2FA Built-in:** Google's security features protect accounts
- ✅ **Centralized Control:** Admin can manage access via Google Workspace
- ✅ **Domain Restriction:** Can restrict to `@deltaquad.com` emails only
- ✅ **Audit Trail:** Google provides login audits

### Google Workspace Integration:
If you want to restrict to company emails only:
1. Configure Google OAuth consent screen
2. Set user type to "Internal" (Google Workspace only)
3. Or add domain verification in Google Cloud Console
4. Supabase will only allow `@deltaquad.com` accounts

---

## 📝 Files Changed

**Modified:**
1. `src/pages/Login.jsx` - Disabled email/password form
2. `src/contexts/AuthContext.jsx` - Fixed OAuth redirect URL

**Configuration Needed (Supabase Dashboard):**
1. Enable Google OAuth provider
2. Add Client ID and Secret
3. Add redirect URLs
4. (Optional) Disable Email provider

---

## 🎯 Current Status

### Code: ✅ Complete
- Only Google OAuth visible
- Email login completely hidden
- OAuth redirect path fixed

### Supabase: ⚠️ Configuration Required
- Add redirect URLs
- Verify Google OAuth enabled
- (Optional) Disable Email provider

---

## 📋 Quick Setup Checklist

### In Code: ✅ DONE
- [x] Email/password login disabled in UI
- [x] OAuth redirect includes base path
- [x] Only Google button shows

### In Supabase: ⚠️ TODO
- [ ] Go to Authentication → Providers → Google
- [ ] Verify enabled with Client ID and Secret
- [ ] Go to URL Configuration
- [ ] Add: `http://localhost:5174/uav-fleet-dashboard/`
- [ ] Add production URL when deployed
- [ ] (Optional) Disable Email provider

### Test: ⏳ READY
- [ ] Refresh browser
- [ ] Click "Sign in with Google"
- [ ] Verify login works

---

## 🎉 Summary

**Configured:** Google OAuth ONLY  
**Hidden:** Email/password login  
**Status:** Code complete, Supabase configuration required  

**Next Step:** Add redirect URLs in Supabase Dashboard, then test login!

---

**Need the exact steps? See sections above for detailed Supabase configuration.**
