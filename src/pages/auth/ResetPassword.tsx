// ─── ResetPassword Page ───────────────────────────────────────────────────────
// AUTH-009 — Reset password via Supabase recovery session.
//
// Entry point: user clicks the link in the Supabase password-reset email,
// which redirects to /reset-password with tokens embedded in the URL hash.
// Supabase SDK processes the hash automatically and fires a PASSWORD_RECOVERY
// event in onAuthStateChange.
//
// Design decisions:
//  - AuthContext (AUTH-002) does not expose the raw event type, and AUTH-001–008
//    must not be modified. So this page subscribes to onAuthStateChange directly
//    via `supabase` — strictly limited to this file and this purpose.
//  - supabase.auth.updateUser({ password }) is used to commit the new password
//    within the active recovery session.
//  - Tokens are never logged or stored. Form state is cleared after success.
//  - No OTP, phone, OAuth, invitation, referral, workspace or marketplace changes.

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import AuthLayout from '../../components/auth/AuthLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

type PageStatus = 'loading' | 'form' | 'invalid' | 'success';

// ─── Password strength ────────────────────────────────────────────────────────

interface StrengthResult {
  score: 0 | 1 | 2 | 3;           // 0=weak 1=fair 2=good 3=strong
  label: string;
  color: string;
  barColor: string;
}

function measureStrength(pw: string): StrengthResult {
  if (pw.length === 0) return { score: 0, label: '', color: 'transparent', barColor: 'transparent' };
  const hasLower   = /[a-z]/.test(pw);
  const hasUpper   = /[A-Z]/.test(pw);
  const hasDigit   = /\d/.test(pw);;
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  const long       = pw.length >= 8;
  const veryLong   = pw.length >= 12;

  const variety = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  if (!long || variety <= 1) {
    return { score: 0, label: 'Lemah', color: '#c62828', barColor: '#ef5350' };
  }
  if (variety === 2 && !veryLong) {
    return { score: 1, label: 'Cukup', color: '#e65100', barColor: '#ff9800' };
  }
  if (variety === 3 || (variety === 2 && veryLong)) {
    return { score: 2, label: 'Bagus', color: '#2e7d32', barColor: '#66bb6a' };
  }
  return { score: 3, label: 'Kuat', color: '#1b5e20', barColor: '#1b7a43' };
}

// ─── Strength indicator bar ───────────────────────────────────────────────────

function StrengthBar({ password }: { password: string }) {
  const s = measureStrength(password);
  if (!password) return null;
  const segments = 4;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 4,
              background: i <= s.score ? s.barColor : 'var(--color-border)',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 11.5, color: s.color, fontWeight: 600 }}>
        Kekuatan: {s.label}
      </p>
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validatePassword(pw: string): string | null {
  if (!pw) return 'Kata sandi baru wajib diisi.';
  if (pw.length < 8) return 'Kata sandi minimal 8 karakter.';
  if (measureStrength(pw).score === 0) {
    return 'Kata sandi terlalu lemah. Gunakan kombinasi huruf dan angka.';
  }
  return null;
}

function validateConfirm(pw: string, confirm: string): string | null {
  if (!confirm) return 'Konfirmasi kata sandi wajib diisi.';
  if (pw !== confirm) return 'Kata sandi tidak cocok.';
  return null;
}

// ─── Error mapper ─────────────────────────────────────────────────────────────

function mapUpdateError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes('password should be') || m.includes('password must be') || m.includes('too short')) {
    return 'Kata sandi terlalu pendek. Gunakan minimal 8 karakter.';
  }
  if (m.includes('token') && (m.includes('expired') || m.includes('invalid'))) {
    return 'Sesi reset telah kedaluwarsa. Silakan minta tautan reset baru.';
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch')) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  }
  if (m.includes('too many') || m.includes('rate limit')) {
    return 'Terlalu banyak percobaan. Tunggu beberapa saat, lalu coba lagi.';
  }
  if (m.includes('same password') || m.includes('different from')) {
    return 'Kata sandi baru harus berbeda dari kata sandi lama.';
  }
  return 'Terjadi kesalahan. Silakan coba beberapa saat lagi.';
}

// ─── Eye icon ─────────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ id, label, error, children }: {
  id: string; label: string; error?: string | null; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--color-danger)', lineHeight: 1.4 }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Password input with show/hide ────────────────────────────────────────────

function PasswordInput({
  id, value, disabled, placeholder, autoComplete, onChange, onBlur, onKeyDown, hasError,
}: {
  id: string;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  hasError?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        aria-invalid={hasError}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          height: 44,
          padding: '0 44px 0 14px',
          fontSize: 15,
          borderRadius: 'var(--radius-sm)',
          border: `1.5px solid ${hasError ? 'var(--color-danger)' : 'var(--color-border)'}`,
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        disabled={disabled}
        aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color: 'var(--color-muted)',
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
        }}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

// ─── Loading state ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <AuthLayout title="Buat Kata Sandi Baru" loading loadingLabel="Memvalidasi sesi…">
      <div style={{ height: 80 }} />
    </AuthLayout>
  );
}

// ─── Invalid / expired state ──────────────────────────────────────────────────

function InvalidState() {
  return (
    <AuthLayout title="Tautan Tidak Valid">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#ffebee',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, marginBottom: 16,
        }}>
          ⏰
        </div>

        <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
          Sesi Reset Tidak Valid atau Kedaluwarsa
        </h3>

        <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6 }}>
          Tautan reset kata sandi ini sudah tidak berlaku.
        </p>

        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
          Tautan hanya berlaku sekali dan akan kedaluwarsa setelah beberapa waktu.
          Silakan minta tautan reset baru.
        </p>

        <Link
          to="/forgot-password"
          style={{
            display: 'block', width: '100%', textAlign: 'center',
            padding: '13px 0', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary)', color: '#fff',
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
            marginBottom: 10, boxSizing: 'border-box',
          } as React.CSSProperties}
        >
          Minta Tautan Reset Baru
        </Link>

        <Link
          to="/login"
          style={{
            display: 'block', width: '100%', textAlign: 'center',
            padding: '11px 0', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text)',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
            boxSizing: 'border-box',
          } as React.CSSProperties}
        >
          ← Kembali ke Halaman Masuk
        </Link>
      </div>
    </AuthLayout>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState() {
  return (
    <AuthLayout title="Kata Sandi Diperbarui">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#e8f5ee',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, marginBottom: 16,
        }}>
          ✅
        </div>

        <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
          Kata Sandi Berhasil Diperbarui
        </h3>

        <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6 }}>
          Kata sandi Anda telah berhasil diperbarui.
        </p>

        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
          Silakan masuk kembali menggunakan kata sandi baru Anda.
        </p>

        <Link
          to="/login"
          style={{
            display: 'block', width: '100%', textAlign: 'center',
            padding: '13px 0', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary)', color: '#fff',
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
            boxSizing: 'border-box',
          } as React.CSSProperties}
        >
          Masuk dengan Kata Sandi Baru
        </Link>
      </div>
    </AuthLayout>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResetPassword() {
  const [status, setStatus]         = useState<PageStatus>('loading');
  // Recovery session is stored only for the duration of the update call.
  const recoverySessionRef          = useRef<Session | null>(null);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [password,        setPassword]        = useState('');
  const [confirm,         setConfirm]         = useState('');
  const [passwordError,   setPasswordError]   = useState<string | null>(null);
  const [confirmError,    setConfirmError]    = useState<string | null>(null);
  const [submitError,     setSubmitError]     = useState<string | null>(null);
  const [loading,         setLoading]         = useState(false);

  // ── Recovery session detection ───────────────────────────────────────────────
  // Supabase processes the URL hash automatically on page load and fires
  // PASSWORD_RECOVERY in onAuthStateChange. We give it up to 5 seconds;
  // if no event arrives, the link is invalid or already consumed.

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus((prev) => (prev === 'loading' ? 'invalid' : prev));
    }, 5_000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoverySessionRef.current = session;
        clearTimeout(timer);
        setStatus('form');
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  // ── Field handlers ───────────────────────────────────────────────────────────

  const handlePasswordChange = useCallback((v: string) => {
    setPassword(v);
    if (passwordError) setPasswordError(null);
    if (submitError)   setSubmitError(null);
    // Re-validate confirm in real-time when password changes
    if (confirm && confirmError) {
      setConfirmError(v !== confirm ? 'Kata sandi tidak cocok.' : null);
    }
  }, [passwordError, submitError, confirm, confirmError]);

  const handleConfirmChange = useCallback((v: string) => {
    setConfirm(v);
    if (confirmError) setConfirmError(null);
    if (submitError)  setSubmitError(null);
  }, [confirmError, submitError]);

  const handlePasswordBlur = useCallback(() => {
    setPasswordError(validatePassword(password));
  }, [password]);

  const handleConfirmBlur = useCallback(() => {
    setConfirmError(validateConfirm(password, confirm));
  }, [password, confirm]);

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const pErr = validatePassword(password);
    const cErr = validateConfirm(password, confirm);
    setPasswordError(pErr);
    setConfirmError(cErr);
    if (pErr || cErr) return;

    setSubmitError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setSubmitError(mapUpdateError(error.message));
        return;
      }

      // Security: clear sensitive form state before transitioning.
      setPassword('');
      setConfirm('');
      recoverySessionRef.current = null;

      // Sign out so the user must authenticate fresh with the new password.
      await supabase.auth.signOut();

      setStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(mapUpdateError(msg));
    } finally {
      setLoading(false);
    }
  }, [password, confirm]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) handleSubmit();
  }, [handleSubmit, loading]);

  const handleFormSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!loading) handleSubmit();
  }, [handleSubmit, loading]);

  // ── Render by status ─────────────────────────────────────────────────────────

  if (status === 'loading') return <LoadingState />;
  if (status === 'invalid') return <InvalidState />;
  if (status === 'success') return <SuccessState />;

  // ── Form ─────────────────────────────────────────────────────────────────────

  return (
    <AuthLayout
      title="Buat Kata Sandi Baru"
      subtitle="Pilih kata sandi yang kuat untuk melindungi akun Anda."
      error={submitError}
      loading={loading}
      loadingLabel="Memperbarui kata sandi…"
    >
      {/* Lock illustration */}
      <div style={{
        display: 'flex', justifyContent: 'center', marginBottom: 20,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--color-primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36,
        }}>
          🔐
        </div>
      </div>

      <form
        onSubmit={handleFormSubmit}
        noValidate
        aria-label="Form reset kata sandi"
        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        {/* New password */}
        <Field id="rp-password" label="Kata Sandi Baru" error={passwordError}>
          <PasswordInput
            id="rp-password"
            value={password}
            disabled={loading}
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            onKeyDown={handleKeyDown}
            hasError={!!passwordError}
          />
          <StrengthBar password={password} />
        </Field>

        {/* Password requirements hint */}
        <div style={{
          background: 'var(--color-bg)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          fontSize: 12,
          color: 'var(--color-muted)',
          lineHeight: 1.7,
          marginTop: -8,
        }}>
          <strong style={{ color: 'var(--color-text)' }}>Syarat kata sandi kuat:</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
            {[
              ['Minimal 8 karakter',              password.length >= 8],
              ['Huruf kecil (a–z)',                /[a-z]/.test(password)],
              ['Huruf besar (A–Z)',                /[A-Z]/.test(password)],
              ['Angka (0–9)',                      /\d/.test(password)],
              ['Karakter khusus (!@#$…)',          /[^a-zA-Z0-9]/.test(password)],
            ].map(([label, met]) => (
              <li key={label as string} style={{
                color: met ? 'var(--color-primary)' : 'var(--color-muted)',
                fontWeight: met ? 600 : 400,
              }}>
                {met ? '✓' : '○'} {label as string}
              </li>
            ))}
          </ul>
        </div>

        {/* Confirm password */}
        <Field id="rp-confirm" label="Konfirmasi Kata Sandi" error={confirmError}>
          <PasswordInput
            id="rp-confirm"
            value={confirm}
            disabled={loading}
            placeholder="Ulangi kata sandi baru"
            autoComplete="new-password"
            onChange={handleConfirmChange}
            onBlur={handleConfirmBlur}
            onKeyDown={handleKeyDown}
            hasError={!!confirmError}
          />
          {/* Real-time match indicator */}
          {confirm.length > 0 && !confirmError && password === confirm && (
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-primary)', fontWeight: 600 }}>
              ✓ Kata sandi cocok
            </p>
          )}
        </Field>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', height: 48,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary)',
            color: '#fff', border: 'none',
            fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? 'Memperbarui…' : 'Perbarui Kata Sandi'}
        </button>

        {/* Back to login */}
        <Link
          to="/login"
          tabIndex={loading ? -1 : 0}
          style={{
            display: 'block', width: '100%', textAlign: 'center',
            padding: '11px 0', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text)',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
            boxSizing: 'border-box',
          } as React.CSSProperties}
        >
          ← Kembali ke Halaman Masuk
        </Link>
      </form>
    </AuthLayout>
  );
}
