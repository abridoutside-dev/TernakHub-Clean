# AUTH-002B — Configure Redirect URLs
**Date:** 2026-07-17  
**Status:** ✅ COMPLETE — Code is correct; manual Supabase dashboard action required

---

## Detected URLs

### Replit Development Domain
```
https://a46261fa-c09b-439b-8cfd-e95f13afa1da-00-2fgq07463u54d.pike.replit.dev
```

### Production Domain
Not yet deployed. A production URL will be assigned when the app is published via Replit Deployments. The Supabase allowlist must be updated again at that time.

---

## 1. Site URL

**Value to set in Supabase:**
```
https://a46261fa-c09b-439b-8cfd-e95f13afa1da-00-2fgq07463u54d.pike.replit.dev
```

**Purpose:**  
- Default redirect target for email confirmation links when `signUp()` passes no explicit `emailRedirectTo`  
- Shown in Supabase-generated emails as the project's home URL  
- Used as the base for magic-link and OAuth callbacks  

**Current code behaviour:**  
`signUp()` in `src/contexts/AuthContext.tsx` passes no `emailRedirectTo`. Supabase falls back to the Site URL. After confirming their email the user lands on the app root (`/`), which is safe for the current phase.

---

## 2. Redirect URLs (Allowlist)

Supabase validates every `redirectTo` value against this allowlist before sending an email. A request with an unlisted URL is rejected.

**Add these two entries:**

| Entry | Covers |
|-------|--------|
| `https://a46261fa-c09b-439b-8cfd-e95f13afa1da-00-2fgq07463u54d.pike.replit.dev/**` | All current dev paths (including `/reset-password`, `/login`, `/auth/callback`) |
| `http://localhost:5000/**` | Local development outside Replit (optional, for team members running locally) |

> **`**` is Supabase's wildcard** — it matches any path under that origin. One entry covers every future route.

---

## 3. Email Confirmation Redirect

| Property | Value |
|----------|-------|
| Mechanism | Supabase Site URL (no explicit `emailRedirectTo` in `signUp()`) |
| Current landing page | App root `/` |
| AUTH-003 action | When the Login page exists at `/login`, update `signUp()` to pass `emailRedirectTo: \`\${window.location.origin}/login?verified=true\`` so the user lands on the Login page with a confirmation banner |

**No code change needed now.** The root redirect is safe until AUTH-003 defines the Login path.

---

## 4. Password Reset Redirect

| Property | Value |
|----------|-------|
| Set in code | `src/contexts/AuthContext.tsx` line 118 |
| Value | `` `${window.location.origin}/reset-password` `` |
| Dev resolves to | `https://a46261fa-c09b-439b-8cfd-e95f13afa1da-00-2fgq07463u54d.pike.replit.dev/reset-password` |
| Supabase allowlist | ✅ Covered by the `/**` wildcard entry above |
| Route registered | ❌ Not yet — AUTH-005 scope (safe: app root fallback) |

---

## 5. Redirect Flow Compatibility

| Flow | Compatible | Notes |
|------|-----------|-------|
| Email verification | ✅ | Confirmation link → Site URL (app root). Works now. AUTH-003 adds `emailRedirectTo` to land on Login page |
| Password reset | ✅ | `redirectTo` is dynamic (`window.location.origin`), covered by `/**` wildcard. AUTH-005 builds the `/reset-password` page |
| Future Login page (`/login`) | ✅ | Covered by `/**` wildcard; no Supabase config change needed when AUTH-003 adds this route |
| Future OAuth / magic-link | ✅ | `detectSessionInUrl: true` is already set in the Supabase client |

---

## Manual Action Checklist — Supabase Dashboard

> Open: **Supabase Dashboard → [Your Project] → Authentication → URL Configuration**

### Step 1 — Set Site URL
- [ ] In the **Site URL** field, enter:
  ```
  https://a46261fa-c09b-439b-8cfd-e95f13afa1da-00-2fgq07463u54d.pike.replit.dev
  ```
- [ ] Click **Save**

### Step 2 — Add Redirect URLs
- [ ] In the **Redirect URLs** section, click **Add URL** and enter:
  ```
  https://a46261fa-c09b-439b-8cfd-e95f13afa1da-00-2fgq07463u54d.pike.replit.dev/**
  ```
- [ ] Click **Add URL** again and enter (optional — for local dev):
  ```
  http://localhost:5000/**
  ```
- [ ] Click **Save**

### Step 3 — Verify
- [ ] Trigger a password reset email (can use a test account)  
- [ ] Confirm the reset link redirects to the correct dev domain  
- [ ] Confirm the link is not rejected with a "redirect URL not allowed" error  

### Step 4 — When Production is Deployed (future)
- [ ] Add the production URL to Redirect URLs:
  ```
  https://<your-production-domain>/**
  ```
- [ ] Update Site URL to the production domain, or keep dev URL and rely on `window.location.origin` in code (the code handles this dynamically — no code change needed)

---

## No Code Changes Required

All redirect logic in `src/contexts/AuthContext.tsx` is correctly implemented:
- `resetPassword()` uses `${window.location.origin}/reset-password` — dynamic, environment-agnostic ✅
- `signUp()` relies on Site URL — correct for current phase ✅
- `detectSessionInUrl: true` in `src/lib/supabase.ts` handles callback URL token extraction ✅

The only outstanding item is the Supabase dashboard configuration above.

---

## Ready for AUTH-003

✅ **Yes**, once the Supabase dashboard steps above are completed:
- Password reset emails will redirect to the correct dev URL
- Email confirmation links will land on the app root (safe)
- The `/**` wildcard means AUTH-003's `/login` route requires zero additional Supabase config
