# AUTH-004 — Authentication Routing
**Date:** 2026-07-17  
**Status:** ✅ COMPLETE

---

## Routes Created

| Route | File | Placeholder Title | Next Phase |
|-------|------|-------------------|------------|
| `/login` | `src/pages/auth/Login.tsx` | "Masuk ke Akun Anda" | AUTH-005 |
| `/register` | `src/pages/auth/Register.tsx` | "Buat Akun Baru" | AUTH-006 |
| `/verify-email` | `src/pages/auth/VerifyEmail.tsx` | "Verifikasi Email" | AUTH-007 |
| `/forgot-password` | `src/pages/auth/ForgotPassword.tsx` | "Lupa Kata Sandi" | AUTH-008 |
| `/reset-password` | `src/pages/auth/ResetPassword.tsx` | "Buat Kata Sandi Baru" | AUTH-009 |

---

## Files Added

```
src/pages/auth/Login.tsx
src/pages/auth/Register.tsx
src/pages/auth/VerifyEmail.tsx
src/pages/auth/ForgotPassword.tsx
src/pages/auth/ResetPassword.tsx
```

## Files Modified

**`src/App.tsx`** — three surgical changes only:

1. **`PageMeta` type** — added `hideTopBar?: boolean` field so auth routes can suppress the TopAppBar independently of `hideNav`

2. **`resolveMeta()`** — added five entries, all with `hideNav: true, hideTopBar: true`:
   ```ts
   if (pathname === '/login')           return { title: '', hideNav: true, hideTopBar: true };
   if (pathname === '/register')        return { title: '', hideNav: true, hideTopBar: true };
   if (pathname === '/verify-email')    return { title: '', hideNav: true, hideTopBar: true };
   if (pathname === '/forgot-password') return { title: '', hideNav: true, hideTopBar: true };
   if (pathname === '/reset-password')  return { title: '', hideNav: true, hideTopBar: true };
   ```

3. **Render block** — `TopAppBar` conditionally rendered; `paddingTop` drops to `0` for auth pages:
   ```tsx
   {!meta.hideTopBar && (
     <TopAppBar title={meta.title} showBack={meta.showBack} showBackWithSwitcher={meta.showBackWithSwitcher} />
   )}
   <div style={{ paddingTop: meta.hideTopBar ? 0 : 56, paddingBottom: meta.hideNav ? 0 : 64 }}>
   ```

4. **`<Routes>`** — five `<Route>` entries registered alongside existing routes

---

## Shell Structure on Auth Routes

```
[No TopAppBar]
[No BottomNav]
[No FloatingAssistant padding offset]

AuthLayout
 └─ AuthLogo + "TernakHub" + tagline
 └─ Card
     └─ Page title + subtitle
     └─ Placeholder body text
 └─ Footer (cross-links where applicable)
 └─ Copyright
```

---

## Verification

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ Zero errors |
| `/login` renders | ✅ Confirmed via screenshot |
| `/register` renders | ✅ Confirmed via screenshot |
| TopAppBar absent on auth routes | ✅ Confirmed |
| BottomNav absent on auth routes | ✅ Confirmed |
| Dashboard (`/`) unaffected | ✅ Confirmed |
| No Supabase calls in placeholder pages | ✅ Confirmed |
| No forms implemented | ✅ Confirmed |
| Browser console — no new errors | ✅ Confirmed |

---

## Ready for AUTH-005 (Login)

✅ **Yes.** AUTH-005 replaces the placeholder body in `src/pages/auth/Login.tsx` with:
- Email + password form fields
- Submit handler wired to `signIn()` from `useAuth()`
- Error state passed to `AuthLayout`'s `error` prop
- Loading state passed to `AuthLayout`'s `loading` prop
- Post-login redirect to `/`
- Cross-link to `/register` (already in the footer)
- "Forgot password?" link to `/forgot-password`

No routing or layout changes needed for AUTH-005.
