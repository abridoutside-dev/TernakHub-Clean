# AUTH-006 — User Registration
**Date:** 2026-07-17  
**Status:** ✅ COMPLETE

---

## Files Created

| File | Purpose |
|------|---------|
| `src/pages/auth/Register.tsx` | Full registration form — replaces AUTH-004 placeholder |
| `src/pages/auth/WorkspaceCreate.tsx` | Post-registration landing page at `/workspace/create` |

## Files Modified

| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | Extended `signUp` signature + implementation to accept optional `{ data }` metadata |
| `src/App.tsx` | +1 import (`WorkspaceCreate`), +1 resolveMeta entry, +1 `<Route>` for `/workspace/create` |

---

## Registration Form — Feature Checklist

| Field | Required | Notes |
|-------|----------|-------|
| Nama Lengkap (Full Name) | ❌ optional | Labelled "(opsional)" |
| Email | ✅ | Format validation on blur + submit |
| Nomor HP (Phone) | ✅ | Indonesian mobile format; hint shown beneath field |
| Kata Sandi (Password) | ✅ | Min 8 chars; real-time strength meter |
| Konfirmasi Kata Sandi | ✅ | Must match password |
| Setuju Syarat & Ketentuan | ✅ checkbox | Both required before submit |
| Setuju Kebijakan Privasi | ✅ checkbox | Both required before submit |

| Feature | Status |
|---------|--------|
| Show / hide password (both fields) | ✅ SVG eye icon |
| Password strength meter (3-level bar) | ✅ Lemah / Sedang / Kuat |
| Inline field errors on blur | ✅ |
| All errors re-run on submit | ✅ |
| Errors clear as user types | ✅ |
| Enter key submits | ✅ `onKeyDown` on all inputs |
| Disable all controls while loading | ✅ |
| Loading overlay via `AuthLayout` | ✅ "Membuat akun…" label |
| Error banner via `AuthLayout` | ✅ |

---

## Validation Rules

| Check | Message |
|-------|---------|
| Email — empty | "Email wajib diisi." |
| Email — invalid format | "Masukkan alamat email yang valid." |
| Phone — empty | "Nomor HP wajib diisi." |
| Phone — invalid format | "Masukkan nomor HP Indonesia yang valid (contoh: 08123456789)." |
| Password — empty | "Kata sandi wajib diisi." |
| Password — < 8 chars | "Kata sandi minimal 8 karakter." |
| Confirm — empty | "Konfirmasi kata sandi wajib diisi." |
| Confirm — mismatch | "Kata sandi tidak cocok." |
| Checkboxes — not both checked | "Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi." |

### Phone normalisation (`normalisePhone`)

| Input | Stored as |
|-------|-----------|
| `08123456789` | `+628123456789` |
| `628123456789` | `+628123456789` |
| `+628123456789` | `+628123456789` |

---

## Password Strength Meter

| Level | Criteria | Bar colour |
|-------|----------|------------|
| **Lemah** (1 bar) | < 8 chars OR < 2 character categories | `var(--color-danger)` |
| **Sedang** (2 bars) | ≥ 8 chars, 2 character categories, < 10 chars OR < 3 categories | `var(--color-warning)` |
| **Kuat** (3 bars) | ≥ 10 chars + ≥ 3 categories, OR ≥ 8 chars + ≥ 3 categories | `#1b7a43` (brand green) |

Character categories: lowercase, uppercase, digit, special character.

---

## Supabase Error Mapping

| Supabase message | Displayed (Indonesian) |
|-----------------|------------------------|
| `user already registered` | Email ini sudah terdaftar. Silakan masuk atau gunakan email lain. |
| `password should be at least` | Kata sandi terlalu pendek. Gunakan minimal 8 karakter. |
| `invalid email` | Format email tidak valid. Periksa kembali alamat email Anda. |
| `network` / `failed to fetch` | Tidak dapat terhubung ke server. Periksa koneksi internet Anda. |
| `too many requests` | Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi. |
| Anything else | Terjadi kesalahan yang tidak terduga. Silakan coba beberapa saat lagi. |

---

## Supabase — What is stored

### `supabase.auth.signUp` call

```ts
signUp(email, password, {
  data: {
    full_name:    string | null,   // optional; null if not provided
    phone:        string,           // normalised to +62XXXXXXXXXX
    subscription: 'FREE',          // default subscription tier
    foto:         '👤',            // default avatar placeholder
  }
})
```

These fields land in `auth.users.raw_user_meta_data` (Supabase `user_metadata`).

---

## Post-Registration Flow

```
signUp(email, password, { data: metadata })
  ├─ error → show error banner on form, stay on page
  └─ success
       └─ signIn(email, password)   ← auto sign-in, no email confirm required
            ├─ error → navigate('/login', { replace: true })
            └─ success
                 └─ setPhase('success')
                      └─ user clicks "Lanjutkan"
                           └─ navigate('/workspace/create', { replace: true })
```

### Success state (shown before redirect)
- ✅ checkmark icon
- "Akun Anda berhasil dibuat."
- 📧 **Email verification reminder** banner (amber/orange)
- "Lanjutkan" button → `/workspace/create`

---

## Marketplace Rule — Email Verification

| Capability | Unverified user |
|-----------|----------------|
| Browse Marketplace | ✅ Allowed |
| Create Listing | ❌ Blocked (future enforcement on Marketplace pages) |
| Buy Products | ❌ Blocked (future enforcement) |
| Start Transaction | ❌ Blocked (future enforcement) |

Reminder shown in two places:
1. **Register page** — success state, before redirect to `/workspace/create`
2. **`/workspace/create`** — amber banner, visible after redirect

Enforcement on Marketplace pages is a **future task** — those pages will check `user.email_confirmed_at`.

---

## `AuthContext.signUp` — change summary

Before:
```ts
signUp: (email: string, password: string) => Promise<AuthResult>
```

After:
```ts
signUp: (
  email: string,
  password: string,
  options?: { data?: Record<string, unknown> },
) => Promise<AuthResult>
```

The change is backward-compatible — all existing callers that pass only email + password continue to work unchanged.

---

## `/workspace/create` Placeholder

| Element | Detail |
|---------|--------|
| Brand header | AuthLogo + TernakHub + tagline |
| Title | "Buat Workspace Pertama" + 🏗️ icon |
| Description | What a workspace is |
| Coming-soon notice | Grey info box — feature in development |
| Email verification reminder | Amber banner (same copy as Register success state) |
| CTA button | "Masuk ke Dashboard" → `navigate('/', { replace: true })` |

---

## Excluded (per spec)

| Item | Status |
|------|--------|
| Workspace creation | ❌ Excluded — placeholder only |
| Invitation / referral | ❌ Excluded |
| Google / OTP / OAuth | ❌ Excluded |

---

## Verification

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ Zero errors |
| `/register` screenshot | ✅ All 5 fields + checkboxes visible |
| `/workspace/create` screenshot | ✅ Email reminder + CTA visible |
| No TopAppBar / BottomNav on either page | ✅ |
| No external UI library | ✅ Inline styles only |
| Browser console — no new errors | ✅ |

---

## Remaining TODO (future tasks)

| Item | Task |
|------|------|
| Workspace creation page | Future workspace task |
| Route guards (ProtectedRoute) | Future auth task |
| Marketplace enforcement for unverified users | Future Marketplace task |
| Forgot password form | AUTH-008 |
| Reset password form | AUTH-009 |
| Verify email page | AUTH-007 |
