# AUTH-003 — Authentication Layout Foundation
**Date:** 2026-07-17  
**Status:** ✅ COMPLETE

---

## Files Added

| File | Purpose |
|------|---------|
| `src/components/auth/AuthLogo.tsx` | Inline SVG brand mark — TH monogram on a green circle. No external assets. |
| `src/components/auth/AuthErrorMessage.tsx` | Reusable error banner. Renders nothing when `message` is falsy. |
| `src/components/auth/AuthLoadingSpinner.tsx` | Animated CSS spinner. Supports both inline mode (inside a button) and full-card overlay mode. |
| `src/components/auth/AuthLayout.tsx` | Master layout wrapper consumed by every auth page. |

## Files Modified

None. Existing application modules are untouched.

---

## Reusable Components Created

### `AuthLayout` — `src/components/auth/AuthLayout.tsx`

The primary export. Wraps any auth page with the full branded shell.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | ✅ | Page heading inside the card. E.g. `"Masuk ke Akun Anda"` |
| `subtitle` | `string` | — | Secondary line under the title |
| `error` | `string \| null` | — | Auth error message. Pass `null`/`undefined` to hide |
| `loading` | `boolean` | — | Overlays the card with a spinner; dims content; sets `aria-busy` |
| `loadingLabel` | `string` | — | Custom spinner label. Default: `"Memuat…"` |
| `footer` | `ReactNode` | — | Content below the card (sign-up/sign-in cross-links) |
| `children` | `ReactNode` | ✅ | The form or page content |

**Usage example (for AUTH-004):**
```tsx
import AuthLayout from '@/components/auth/AuthLayout';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <AuthLayout
      title="Masuk ke Akun Anda"
      subtitle="Selamat datang kembali di TernakHub"
      error={error}
      loading={loading}
      loadingLabel="Memeriksa kredensial…"
      footer={
        <p>
          Belum punya akun?{' '}
          <a href="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Daftar sekarang
          </a>
        </p>
      }
    >
      {/* email + password form fields here */}
    </AuthLayout>
  );
}
```

---

### `AuthLogo` — `src/components/auth/AuthLogo.tsx`

Self-contained inline SVG. No external image files or icon libraries needed.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `64` | Width and height in pixels |

---

### `AuthErrorMessage` — `src/components/auth/AuthErrorMessage.tsx`

Renders a styled error banner. Mounts/unmounts reactively — caller simply passes the error string or `null`.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `message` | `string \| null \| undefined` | Error text. Component renders nothing when falsy |

---

### `AuthLoadingSpinner` — `src/components/auth/AuthLoadingSpinner.tsx`

CSS-animated spinner. Two modes:

| Mode | How | Use case |
|------|-----|----------|
| Inline | `<AuthLoadingSpinner />` | Inside a submit button label |
| Overlay | `<AuthLoadingSpinner overlay />` | Full-card overlay (via `AuthLayout`'s `loading` prop) |

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `overlay` | `boolean` | `false` | Render as full-card overlay |
| `size` | `number` | `28` | Spinner diameter in pixels |
| `label` | `string` | `"Memuat…"` | `aria-label` + visible text in overlay mode |

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| All styling via inline styles | Matches the entire project — no CSS modules, no Tailwind |
| CSS variables throughout | `var(--color-primary)`, `var(--color-bg)`, etc. — theme-compatible with the main app |
| `position: relative` + `overflow: hidden` on card | Loading overlay clips cleanly to card's `border-radius` without a separate backdrop element |
| `100dvh` for root height | Avoids mobile browser chrome cutting off content vs `100vh` |
| Spinner keyframes injected once as a `<style>` tag | No CSS file needed; avoids duplication across the four overlay instances |
| `ReactNode` for `footer` and `children` | Maximum flexibility for each auth page — links, rich text, or nothing |
| Logo as inline SVG | Zero external dependencies; no broken-image states; scales perfectly at any DPI |

---

## Verification

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ Zero errors |
| No existing files modified | ✅ Confirmed |
| No Supabase calls in new files | ✅ Confirmed |
| No routing changes | ✅ Confirmed |
| Browser console — no new errors | ✅ Confirmed |
| App still runs normally | ✅ Confirmed |

---

## Ready for AUTH-004 (Login)

✅ **Yes.** AUTH-004 (Login page) needs to:

1. Create `src/pages/auth/Login.tsx`
2. Import `AuthLayout` from `@/components/auth/AuthLayout`
3. Wire `signIn()` from `useAuth()` to a form inside `<AuthLayout>`
4. Register the `/login` route in `src/App.tsx`
5. Handle the post-login redirect (to `/` or the originally requested route)
6. Handle the `mailer_autoconfirm: false` case — show "check your email" if `signUp` returns `identities: []`
