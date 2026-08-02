// ─── ForgotPassword Page ──────────────────────────────────────────────────────
// AUTH-008 — Forgot password form with Supabase password reset email.
//
// Flow:
//   1. User enters email → "Send Reset Link" → Supabase sends email with link.
//   2. Link redirects to /reset-password (AUTH-005).
//   3. Page transitions to a success state regardless of whether the email
//      exists in Supabase — this prevents user enumeration (security rule).
//
// Rules:
//  - No OTP, no phone, no OAuth, no invitation/referral.
//  - Never reveal whether an email is registered — always show generic success.
//  - Technical errors are console.error'd only, not surfaced verbatim.

import { useState, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email wajib diisi.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return 'Masukkan alamat email yang valid.';
  }
  return null;
}

// ─── Error mapper — never leaks enumeration info ──────────────────────────────
// Any Supabase error that could indicate the email is / isn't registered is
// silently swallowed and treated as success (see security rule above).
// Only non-enumeration errors (network, rate-limit) are shown.

function mapResetError(message: string): string | null {
  const m = message.toLowerCase();

  if (m.includes('too many requests') || m.includes('rate limit') || m.includes('email rate limit')) {
    return 'Terlalu banyak permintaan. Tunggu beberapa menit, lalu coba lagi.';
  }

  if (
    m.includes('network') ||
    m.includes('fetch') ||
    m.includes('failed to fetch') ||
    m.includes('networkerror')
  ) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.';
  }

  // "User not found", "Invalid email", etc. → treat as success (no enumeration)
  return null;
}

// ─── Open Email App helper ────────────────────────────────────────────────────

function openEmailApp() {
  window.location.href = 'mailto:';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  error?: string | null;
  children: React.ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={fieldS.label}>{label}</label>
      {children}
      {error && (
        <p role="alert" style={fieldS.error}>{error}</p>
      )}
    </div>
  );
}

const fieldS: Record<string, React.CSSProperties> = {
  label: { fontSize: 14, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.4 },
  error: { margin: 0, fontSize: 12, color: 'var(--color-danger)', lineHeight: 1.4 },
};

// ─── Illustration ─────────────────────────────────────────────────────────────

function Illustration() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'var(--color-primary-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
      }}>
        🔑
      </div>
    </div>
  );
}

// ─── Success State ────────────────────────────────────────────────────────────

function SuccessState({ email }: { email: string }) {
  // Detect if mailto: is likely to open an app (best-effort; not perfect).
  const canOpenEmail = typeof window !== 'undefined';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0 }}>
      {/* Checkmark illustration */}
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: '#e8f5ee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        marginBottom: 16,
      }}>
        ✅
      </div>

      <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
        Tautan Telah Dikirim
      </h3>

      <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6 }}>
        Kami telah mengirimkan tautan reset kata sandi ke email Anda.
      </p>

      <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
        Periksa kotak masuk atau folder{' '}
        <strong style={{ color: 'var(--color-text)' }}>Spam / Junk</strong>{' '}
        untuk email dari TernakHub.
      </p>

      {/* Masked email hint */}
      <div style={{
        marginBottom: 24,
        padding: '8px 14px',
        background: 'var(--color-bg)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        fontSize: 13,
        color: 'var(--color-muted)',
      }}>
        📧 Dikirim ke: <strong style={{ color: 'var(--color-text)' }}>{email}</strong>
      </div>

      {/* Open Email App — optional */}
      {canOpenEmail && (
        <button
          type="button"
          onClick={openEmailApp}
          style={btnS.primary}
        >
          Buka Aplikasi Email
        </button>
      )}

      <Link
        to="/login"
        style={btnS.secondaryLink}
      >
        ← Kembali ke Halaman Masuk
      </Link>
    </div>
  );
}

const btnS: Record<string, React.CSSProperties> = {
  primary: {
    width: '100%',
    height: 48,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 10,
    transition: 'opacity 0.15s',
  },
  primaryDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  secondary: {
    width: '100%',
    height: 44,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1.5px solid var(--color-border)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryLink: {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    padding: '11px 0',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-surface)',
    border: '1.5px solid var(--color-border)',
    color: 'var(--color-text)',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    boxSizing: 'border-box',
  } as React.CSSProperties,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail]           = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [sentEmail, setSentEmail]   = useState('');

  // ── Inline validation on blur ──────────────────────────────────────────────
  const handleEmailBlur = useCallback(() => {
    setEmailError(validateEmail(email));
  }, [email]);

  const handleEmailChange = useCallback((v: string) => {
    setEmail(v);
    if (emailError) setEmailError(null);
    if (submitError) setSubmitError(null);
  }, [emailError, submitError]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setSubmitError(null);
    setLoading(true);

    try {
      const { error } = await resetPassword(email.trim());

      if (error) {
        // Security: some errors (user-not-found, invalid-email) are silenced
        // and treated as success to prevent email enumeration.
        const friendlyError = mapResetError(error.message);
        if (friendlyError) {
          // Non-enumeration error (network / rate-limit) — show to user.
          setSubmitError(friendlyError);
          return;
        }
        // Enumeration-risk error — log only, show generic success.
        console.error('[AUTH-008] resetPassword error (hidden from user):', error.message);
      }

      // Always show success — email exists or not.
      setSentEmail(email.trim());
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const friendlyError = mapResetError(msg);
      if (friendlyError) {
        setSubmitError(friendlyError);
      } else {
        console.error('[AUTH-008] Unexpected error (hidden from user):', msg);
        // Still show success to avoid enumeration.
        setSentEmail(email.trim());
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  }, [email, resetPassword]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) handleSubmit();
  }, [handleSubmit, loading]);

  const handleFormSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!loading) handleSubmit();
  }, [handleSubmit, loading]);

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <AuthLayout title="Periksa Email Anda">
        <SuccessState email={sentEmail} />
      </AuthLayout>
    );
  }

  // ── Form screen ────────────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Lupa Kata Sandi"
      subtitle="Masukkan email Anda dan kami akan mengirimkan tautan untuk mereset kata sandi."
      error={submitError}
      loading={loading}
      loadingLabel="Mengirim tautan…"
      footer={
        <p style={{ margin: 0 }}>
          Ingat kata sandi?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Kembali Masuk
          </Link>
        </p>
      }
    >
      <Illustration />

      <form
        onSubmit={handleFormSubmit}
        noValidate
        aria-label="Form lupa kata sandi"
        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        {/* Email */}
        <Field id="fp-email" label="Alamat Email" error={emailError}>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            disabled={loading}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={handleEmailBlur}
            onKeyDown={handleKeyDown}
            aria-invalid={!!emailError}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: 44,
              padding: '0 14px',
              fontSize: 15,
              borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${emailError ? 'var(--color-danger)' : 'var(--color-border)'}`,
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
          />
        </Field>

        {/* Send Reset Link */}
        <button
          type="submit"
          disabled={loading}
          style={{
            ...btnS.primary,
            ...(loading ? btnS.primaryDisabled : {}),
            marginBottom: 0,
          }}
        >
          {loading ? 'Mengirim…' : 'Kirim Tautan Reset'}
        </button>

        {/* Back to Login */}
        <Link
          to="/login"
          tabIndex={loading ? -1 : 0}
          style={btnS.secondaryLink}
        >
          ← Kembali ke Halaman Masuk
        </Link>
      </form>
    </AuthLayout>
  );
}
