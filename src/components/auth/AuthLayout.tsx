// ─── AuthLayout ───────────────────────────────────────────────────────────────
// AUTH-003 — Shared layout wrapper for every authentication page.
//
// Usage:
//   <AuthLayout
//     title="Masuk ke Akun Anda"
//     subtitle="Selamat datang kembali di TernakHub"
//     error={authError}
//     loading={isSubmitting}
//     footer={<p>Belum punya akun? <a href="/register">Daftar</a></p>}
//   >
//     {/* form goes here */}
//   </AuthLayout>
//
// Rules:
//  - No Supabase calls — pure presentational.
//  - No routing logic — caller handles navigation.
//  - `loading` shows a translucent overlay; the card remains in the DOM so
//    form values are preserved and screen readers see aria-busy.
//  - `error` is cleared by the caller on each new submission attempt.

import type { ReactNode } from 'react';
import AuthLogo from './AuthLogo';
import AuthErrorMessage from './AuthErrorMessage';
import AuthLoadingSpinner from './AuthLoadingSpinner';

// ─── keyframe injection (once per page load) ──────────────────────────────────
const SPIN_STYLE = `@keyframes auth-spin { to { transform: rotate(360deg); } }`;

export interface AuthLayoutProps {
  /** Page-level heading shown inside the card. E.g. "Masuk", "Buat Akun". */
  title: string;
  /** Optional secondary line under the page title. */
  subtitle?: string;
  /** Auth error message to display. Pass null/undefined to hide. */
  error?: string | null;
  /** When true, overlays the card with a loading spinner. */
  loading?: boolean;
  /** Label shown next to the spinner. Defaults to "Memuat…". */
  loadingLabel?: string;
  /** Content rendered below the card (e.g. sign-up / sign-in links). */
  footer?: ReactNode;
  /** The form or content for this auth page. */
  children: ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  error,
  loading = false,
  loadingLabel,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div style={styles.root}>
      {/* Inject spinner keyframes once */}
      <style>{SPIN_STYLE}</style>

      {/* ── Brand header ── */}
      <div style={styles.brand}>
        <AuthLogo size={60} />

        <h1 style={styles.appName}>TernakHub</h1>

        <p style={styles.tagline}>
          Platform Ternak Terintegrasi
        </p>
      </div>

      {/* ── Card ── */}
      <div style={styles.card}>
        {/* Loading overlay lives inside the card so it clips to the card border */}
        {loading && (
          <AuthLoadingSpinner overlay size={30} label={loadingLabel} />
        )}

        {/* Page title */}
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>{title}</h2>
          {subtitle && (
            <p style={styles.cardSubtitle}>{subtitle}</p>
          )}
        </div>

        {/* Error banner — sits above the form so it's the first thing read */}
        <AuthErrorMessage message={error} />

        {/* Page content (form, info, etc.) */}
        <div style={loading ? styles.contentBlurred : undefined}>
          {children}
        </div>
      </div>

      {/* ── Footer (links, copyright) ── */}
      {footer && (
        <div style={styles.footer}>
          {footer}
        </div>
      )}

      {/* Copyright */}
      <p style={styles.copyright}>
        © {new Date().getFullYear()} TernakHub. Semua hak dilindungi.
      </p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px 32px',
    background: 'var(--color-bg)',
    gap: 0,
  },

  // ── Brand ──
  brand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  appName: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    color: 'var(--color-primary)',
    letterSpacing: '-0.3px',
  },
  tagline: {
    margin: 0,
    fontSize: 13,
    color: 'var(--color-muted)',
    fontWeight: 400,
    textAlign: 'center',
  },

  // ── Card ──
  card: {
    position: 'relative',           // needed for loading overlay
    width: '100%',
    maxWidth: 420,
    background: 'var(--color-surface)',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    padding: '28px 24px 24px',
    overflow: 'hidden',             // clips the loading overlay to card corners
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--color-text)',
    lineHeight: 1.3,
  },
  cardSubtitle: {
    margin: '6px 0 0',
    fontSize: 14,
    color: 'var(--color-muted)',
    lineHeight: 1.5,
  },

  // ── Content dim while loading ──
  contentBlurred: {
    opacity: 0.4,
    pointerEvents: 'none',
    userSelect: 'none',
  },

  // ── Footer ──
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    color: 'var(--color-muted)',
    lineHeight: 1.6,
  },
  copyright: {
    marginTop: 32,
    fontSize: 11,
    color: 'var(--color-border)',
    textAlign: 'center',
  },
};
