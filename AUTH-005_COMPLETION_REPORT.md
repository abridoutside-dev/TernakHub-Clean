# AUTH-005 — Login Page
**Date:** 2026-07-17  
**Status:** ✅ COMPLETE

---

## Files Created

| File | Purpose |
|------|---------|
| `src/pages/auth/Login.tsx` | Full Login page — replaces AUTH-004 placeholder |

## Files Modified

None. All work is contained inside `Login.tsx`.

---

## Login Form — Feature Checklist

| Feature | Status |
|---------|--------|
| Email field | ✅ |
| Password field | ✅ |
| Show / hide password toggle | ✅ SVG eye icon, aria-label |
| Remember me checkbox | ✅ `accentColor` matches brand green |
| Forgot password link → `/forgot-password` | ✅ |
| Create account link → `/register` | ✅ |
| Disable all controls while loading | ✅ |
| Loading overlay (via `AuthLayout`) | ✅ "Sedang masuk…" label |
| Error banner (via `AuthLayout`) | ✅ |
| Enter key submits on any field | ✅ `onKeyDown` on both inputs |
| `noValidate` on `<form>` | ✅ (native bubbles suppressed) |

---

## Validation

| Check | Trigger | Message |
|-------|---------|---------|
| Email — empty | On blur + on submit | "Email wajib diisi." |
| Email — invalid format | On blur + on submit | "Masukkan alamat email yang valid." |
| Password — empty | On blur + on submit | "Kata sandi wajib diisi." |
| Field error cleared | On keystroke | Inline error disappears as user types |

---

## Error Mapping (`mapAuthError`)

| Supabase error | Displayed message (Indonesian) |
|----------------|-------------------------------|
| `invalid login credentials` | Email atau kata sandi salah. Silakan periksa kembali dan coba lagi. |
| `email not confirmed` | Email belum diverifikasi. Periksa kotak masuk Anda dan klik tautan verifikasi. |
| `too many requests` / `rate limit` | Terlalu banyak percobaan masuk. Tunggu beberapa saat, lalu coba lagi. |
| `network` / `failed to fetch` | Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi. |
| `user not found` | Akun dengan email ini tidak ditemukan. Silakan daftar terlebih dahulu. |
| Anything else | Terjadi kesalahan yang tidak terduga. Silakan coba beberapa saat lagi. |

---

## Post-Login Flow (Workspace-Aware)

```
signIn(email, password) → success
  └─ getWorkspaces().length
        ├─ === 1  →  navigate('/', { replace: true })
        └─  > 1  →  navigate('/workspace/select', { replace: true })
```

`resolvePostLoginPath()` reads the in-memory `workspaceManagementData` prototype store.  
`/workspace/select` is the route placeholder — **its page is not yet implemented**.

---

## Supabase Integration

- `signIn(email, password)` from `useAuth()` (AuthContext) — no direct Supabase import in this file.
- `rememberMe` state is captured in UI but **not yet wired to a Supabase session option**; the current `supabase` client already uses `persistSession: true` globally, so sessions are persisted regardless. Selective "remember me" session management is a future concern (requires `persistSession: false` default + manual token storage).

---

## Verification

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ Zero errors |
| `/login` screenshot | ✅ All form elements visible |
| No TopAppBar / BottomNav | ✅ Confirmed |
| No external UI library used | ✅ Inline styles only |
| No OAuth / Google / OTP | ✅ Excluded |
| Browser console — no new errors | ✅ Confirmed |

---

## Remaining TODO (future tasks)

| Item | Task |
|------|------|
| Register form | AUTH-006 |
| Verify email page | AUTH-007 |
| Forgot password form | AUTH-008 |
| Reset password form | AUTH-009 |
| `/workspace/select` page | Future workspace task |
| Route guards (redirect unauthenticated users) | Future ProtectedRoute task |
| "Remember me" — conditional session persistence | Future session task |
| Supabase dashboard — Site URL + Redirect URL configured | **Manual step** (see AUTH-002B report) |
