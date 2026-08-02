// ─── Login Page ───────────────────────────────────────────────────────────────
// AUTH-005 — Production login form with Supabase auth + workspace-aware redirect.
//
// Post-login flow:
//   1 workspace  → / (Dashboard)
//   2+ workspaces → /workspace/select  (implemented in a future task)
//
// Social / OAuth / OTP / Biometric login is intentionally excluded (future tasks).

import { useState, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';

// ─── Supabase error → friendly Indonesian message ────────────────────────────

function mapAuthError(message: string): string {
  const m = message.toLowerCase();

  if (
    m.includes('invalid login credentials') ||
    m.includes('invalid email or password') ||
    m.includes('wrong email or password')
  ) {
    return 'Email atau kata sandi salah. Silakan periksa kembali dan coba lagi.';
  }

  if (m.includes('email not confirmed') || m.includes('email link is invalid or has expired')) {
    return 'Email belum diverifikasi. Periksa kotak masuk Anda dan klik tautan verifikasi.';
  }

  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Terlalu banyak percobaan masuk. Tunggu beberapa saat, lalu coba lagi.';
  }

  if (
    m.includes('network') ||
    m.includes('fetch') ||
    m.includes('failed to fetch') ||
    m.includes('networkerror')
  ) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.';
  }

  if (m.includes('user not found') || m.includes('no user')) {
    return 'Akun dengan email ini tidak ditemukan. Silakan daftar terlebih dahulu.';
  }

  return 'Terjadi kesalahan yang tidak terduga. Silakan coba beberapa saat lagi.';
}

// ─── Field-level validation ───────────────────────────────────────────────────

function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email wajib diisi.';
  // Basic RFC-compliant email check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return 'Masukkan alamat email yang valid.';
  }
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return 'Kata sandi wajib diisi.';
  return null;
}

// ─── Post-login redirect ─────────────────────────────────────────────────────
// AUTH-002B: workspace selector ALWAYS shown after login, even for 1 workspace.

function resolvePostLoginPath(): string {
  return '/workspace/select';
}

// ─── Eye icon (show/hide password) ───────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    // Eye open — password visible
    <svg
      width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    // Eye closed — password hidden
    <svg
      width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
               a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8
               a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ─── Field wrapper & label ────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  error?: string | null;
  children: React.ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div style={fieldStyles.wrapper}>
      <label htmlFor={id} style={fieldStyles.label}>
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" style={fieldStyles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

const fieldStyles: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-text)',
    lineHeight: 1.4,
  },
  error: {
    margin: 0,
    fontSize: 12,
    color: 'var(--color-danger)',
    lineHeight: 1.4,
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

/** Returns true if `path` is a safe same-origin relative path (no protocol). */
function isSafeRedirect(path: string): boolean {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

export default function Login() {
  console.log('[Login] render');
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '';

  // ── Form state ──
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── Error state ──
  const [emailError, setEmailError]     = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError]   = useState<string | null>(null);

  // ── Loading ──
  const [loading, setLoading] = useState(false);

  // ── Inline validation on blur ──
  const handleEmailBlur = useCallback(() => {
    setEmailError(validateEmail(email));
  }, [email]);

  const handlePasswordBlur = useCallback(() => {
    setPasswordError(validatePassword(password));
  }, [password]);

  // Clear field-level error as user types
  const handleEmailChange = useCallback((v: string) => {
    setEmail(v);
    if (emailError) setEmailError(null);
    if (submitError) setSubmitError(null);
  }, [emailError, submitError]);

  const handlePasswordChange = useCallback((v: string) => {
    setPassword(v);
    if (passwordError) setPasswordError(null);
    if (submitError) setSubmitError(null);
  }, [passwordError, submitError]);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    // Run full validation before submitting
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setSubmitError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email.trim(), password);

      if (error) {
        setSubmitError(mapAuthError(error.message));
        return;
      }

      // Success — honour ?redirect if safe, otherwise always go to workspace selector.
      const next = isSafeRedirect(redirectTo)
        ? redirectTo
        : resolvePostLoginPath();
      navigate(next, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(mapAuthError(msg));
    } finally {
      setLoading(false);
    }
  }, [email, password, signIn, navigate]);

  // Allow Enter key on any field to submit
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  }, [handleSubmit, loading]);

  const handleFormSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!loading) handleSubmit();
  }, [handleSubmit, loading]);

  // ── Render ──
  return (
    <AuthLayout
      title="Masuk ke Akun Anda"
      subtitle="Selamat datang kembali di TernakHub"
      error={submitError}
      loading={loading}
      loadingLabel="Sedang masuk…"
      footer={
        <p style={{ margin: 0 }}>
          Belum punya akun?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Buat Akun Gratis
          </Link>
        </p>
      }
    >
      {/* ── Guest entry ── */}
      <div style={guestStyles.wrapper}>
        <p style={guestStyles.heading}>👀 Lanjut sebagai Guest</p>
        <p style={guestStyles.description}>
          Jelajahi Marketplace dan informasi publik tanpa akun. Login diperlukan untuk mulai bertransaksi.
        </p>
        <button
          type="button"
          onClick={() => navigate('/marketplace')}
          disabled={loading}
          style={guestStyles.btn}
        >
          Lanjut sebagai Guest
        </button>
      </div>

      {/* ── Divider ── */}
      <div style={guestStyles.divider}>
        <span style={guestStyles.dividerLine} />
        <span style={guestStyles.dividerLabel}>atau masuk dengan akun</span>
        <span style={guestStyles.dividerLine} />
      </div>

      <form
        onSubmit={handleFormSubmit}
        noValidate
        style={formStyles.form}
        aria-label="Form masuk"
      >
        {/* ── Email ── */}
        <Field id="login-email" label="Email" error={emailError}>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            disabled={loading}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={handleEmailBlur}
            onKeyDown={handleKeyDown}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'login-email-err' : undefined}
            style={{
              ...formStyles.input,
              ...(emailError ? formStyles.inputError : {}),
            }}
          />
        </Field>

        {/* ── Password ── */}
        <Field id="login-password" label="Kata Sandi" error={passwordError}>
          <div style={formStyles.passwordWrapper}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
              value={password}
              disabled={loading}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={handlePasswordBlur}
              onKeyDown={handleKeyDown}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'login-password-err' : undefined}
              style={{
                ...formStyles.input,
                paddingRight: 44,
                ...(passwordError ? formStyles.inputError : {}),
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={loading}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              style={formStyles.eyeBtn}
            >
              <span style={{ color: 'var(--color-muted)', display: 'flex', alignItems: 'center' }}>
                <EyeIcon open={showPassword} />
              </span>
            </button>
          </div>
        </Field>

        {/* ── Forgot password ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            to="/forgot-password"
            tabIndex={loading ? -1 : 0}
            style={formStyles.forgotLink}
          >
            Lupa kata sandi?
          </Link>
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={loading}
          style={{
            ...formStyles.submitBtn,
            ...(loading ? formStyles.submitBtnDisabled : {}),
          }}
        >
          {loading ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
    </AuthLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const formStyles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    height: 44,
    padding: '0 14px',
    fontSize: 15,
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  inputError: {
    borderColor: 'var(--color-danger)',
  },

  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
  },

  rememberRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: -4,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: 'var(--color-muted)',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    width: 16,
    height: 16,
    cursor: 'pointer',
    accentColor: 'var(--color-primary)',
    flexShrink: 0,
  },
  forgotLink: {
    fontSize: 14,
    color: 'var(--color-primary)',
    fontWeight: 500,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },

  submitBtn: {
    width: '100%',
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    background: 'var(--color-primary)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    marginTop: 4,
    transition: 'background 0.15s, opacity 0.15s',
    letterSpacing: '0.01em',
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

// ─── Guest entry styles ───────────────────────────────────────────────────────

const guestStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '14px 16px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-bg)',
    border: '1.5px solid var(--color-border)',
    marginBottom: 4,
  },
  heading: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--color-text)',
    lineHeight: 1.3,
  },
  description: {
    margin: 0,
    fontSize: 13,
    color: 'var(--color-muted)',
    lineHeight: 1.5,
  },
  btn: {
    marginTop: 4,
    width: '100%',
    height: 42,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-primary)',
    background: 'transparent',
    border: '1.5px solid var(--color-primary)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'background 0.15s, opacity 0.15s',
    letterSpacing: '0.01em',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '8px 0',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'var(--color-border)',
    display: 'block',
  },
  dividerLabel: {
    fontSize: 12,
    color: 'var(--color-muted)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};
