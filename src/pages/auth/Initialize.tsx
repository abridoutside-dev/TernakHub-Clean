// ─── Platform Initialize Page ─────────────────────────────────────────────────
// AUTH-001 — Resumable one-time bootstrap for the first System Administrator.
//
// Phase state machine
// ────────────────────
//  checking        Mount effect running — determining current state.
//  form            No prior attempt; show the sign-up form.
//  pending         Auth user created, email confirmation sent; waiting.
//  resuming        Session detected; writing platform_config.
//  signin_resume   Confirmed user exists but config not written; sign in to finish.
//  done            platform_config written; redirecting to /admin.
//
// Resumability rules
// ───────────────────
//  • On every mount, checkPendingAdminInit() + supabase.auth.getSession() run
//    simultaneously.  If a verified session is found, we skip straight to
//    'resuming' → finalizeInitialization() without requiring user interaction.
//  • onAuthStateChange listens for SIGNED_IN while phase === 'pending' so
//    clicking the verification link in the same tab auto-advances.
//  • localStorage key 'ternakhub_init_pending' bridges the B→C gap across
//    page reloads.  It is cleared by finalizeInitialization() on success.

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { usePlatformInit } from '../../contexts/PlatformInitContext';
import { supabase } from '../../lib/supabase';
import {
  initializePlatform,
  finalizeInitialization,
  signInAndFinalize,
  getPendingAdminInit,
  clearPendingAdminInit,
} from '../../services/platformInitService';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | 'checking'
  | 'form'
  | 'pending'
  | 'resuming'
  | 'signin_resume'
  | 'done';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateFullName(v: string): string | null {
  if (!v.trim()) return 'Nama lengkap wajib diisi.';
  if (v.trim().length < 2) return 'Nama lengkap minimal 2 karakter.';
  return null;
}

function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Email wajib diisi.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
    return 'Masukkan alamat email yang valid.';
  }
  return null;
}

function validatePassword(v: string): string | null {
  if (!v) return 'Kata sandi wajib diisi.';
  if (v.length < 8) return 'Kata sandi minimal 8 karakter.';
  if (!/[a-zA-Z]/.test(v)) return 'Kata sandi harus mengandung setidaknya satu huruf.';
  if (!/[0-9]/.test(v)) return 'Kata sandi harus mengandung setidaknya satu angka.';
  return null;
}

function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return 'Konfirmasi kata sandi wajib diisi.';
  if (confirm !== password) return 'Kata sandi tidak cocok.';
  return null;
}

// ─── Eye toggle icon ──────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}

function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label htmlFor={id} style={s.label}>
        {label}
        {hint && <span style={s.hint}>{hint}</span>}
      </label>
      {children}
      {error && <p role="alert" style={s.fieldError}>{error}</p>}
    </div>
  );
}

// ─── Password input with show/hide ────────────────────────────────────────────

interface PasswordFieldProps {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  disabled?: boolean;
  error?: string | null;
  autoComplete?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}

function PasswordField({
  id, label, hint, placeholder, value, disabled, error, autoComplete, onChange, onBlur,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete ?? 'new-password'}
          placeholder={placeholder ?? 'Masukkan kata sandi'}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          style={{ ...s.input, paddingRight: 44, ...(error ? s.inputError : {}) }}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          disabled={disabled}
          aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          style={s.eyeBtn}
        >
          <span style={{ color: 'var(--color-muted)', display: 'flex', alignItems: 'center' }}>
            <EyeIcon open={show} />
          </span>
        </button>
      </div>
    </Field>
  );
}

// ─── Phase screens ────────────────────────────────────────────────────────────

function CheckingScreen() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)', fontSize: 14 }}>
      <div style={s.spinner} aria-hidden="true" />
      <p style={{ margin: '16px 0 0' }}>Memeriksa status platform…</p>
    </div>
  );
}

function ResumingScreen() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)', fontSize: 14 }}>
      <div style={s.spinner} aria-hidden="true" />
      <p style={{ margin: '16px 0 0' }}>Menyelesaikan inisialisasi…</p>
    </div>
  );
}

function DoneScreen() {
  return (
    <div style={s.successBox}>
      <div style={s.successIcon}>✅</div>
      <p style={s.successText}>
        Platform berhasil diinisialisasi. Mengalihkan ke Admin Dashboard…
      </p>
    </div>
  );
}

interface PendingScreenProps {
  email: string;
  loading: boolean;
  error: string | null;
  onCheck: () => void;
  onBack: () => void;
}

function PendingScreen({ email, loading, error, onCheck, onBack }: PendingScreenProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Info box */}
      <div style={{ ...s.notice, background: 'rgba(34,197,94,0.07)', border: '1.5px solid rgba(34,197,94,0.25)' }}>
        <span style={s.noticeIcon}>📧</span>
        <div>
          <p style={{ ...s.noticeText, fontWeight: 600, marginBottom: 4 }}>
            Email verifikasi telah dikirim
          </p>
          <p style={s.noticeText}>
            Kami mengirim tautan verifikasi ke <strong>{email}</strong>.
            Klik tautan tersebut, lalu kembali ke halaman ini.
          </p>
        </div>
      </div>

      {/* Steps */}
      <ol style={s.stepList}>
        <li style={s.stepItem}>Buka kotak masuk email <strong>{email}</strong></li>
        <li style={s.stepItem}>Cari email dari TernakHub / Supabase</li>
        <li style={s.stepItem}>Klik tautan <em>"Konfirmasi email Anda"</em></li>
        <li style={s.stepItem}>Kembali ke halaman ini dan klik tombol di bawah</li>
      </ol>

      {error && (
        <div style={s.errorBox} role="alert">
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onCheck}
        disabled={loading}
        style={{ ...s.submitBtn, ...(loading ? s.submitBtnDisabled : {}) }}
      >
        {loading ? 'Memeriksa…' : 'Sudah Verifikasi — Lanjutkan Inisialisasi'}
      </button>

      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        style={s.ghostBtn}
      >
        Kembali &amp; Gunakan Email Berbeda
      </button>
    </div>
  );
}

interface SignInResumeFormProps {
  email: string;
  loading: boolean;
  error: string | null;
  onSubmit: (password: string) => void;
  onBack: () => void;
}

function SignInResumeForm({ email, loading, error, onSubmit, onBack }: SignInResumeFormProps) {
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const pwErr = touched && !password ? 'Kata sandi wajib diisi.' : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!password) return;
    onSubmit(password);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={s.notice}>
        <span style={s.noticeIcon}>ℹ️</span>
        <p style={s.noticeText}>
          Akun administrator dengan email <strong>{email}</strong> sudah ada dan
          sudah diverifikasi, tetapi inisialisasi platform belum selesai.
          Masuk dengan kata sandi Anda untuk menyelesaikan proses ini.
        </p>
      </div>

      {error && (
        <div style={s.errorBox} role="alert">
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={s.form}>
        <Field id="resume-email" label="Alamat Email">
          <input
            id="resume-email"
            type="email"
            value={email}
            disabled
            style={{ ...s.input, opacity: 0.6, cursor: 'not-allowed' }}
          />
        </Field>

        <PasswordField
          id="resume-password"
          label="Kata Sandi"
          placeholder="Masukkan kata sandi administrator"
          value={password}
          disabled={loading}
          error={pwErr}
          autoComplete="current-password"
          onChange={setPassword}
          onBlur={() => setTouched(true)}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ ...s.submitBtn, ...(loading ? s.submitBtnDisabled : {}) }}
        >
          {loading ? 'Masuk & Menginisialisasi…' : 'Masuk & Selesaikan Inisialisasi'}
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        style={s.ghostBtn}
      >
        Kembali
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Initialize() {
  const { markInitialized } = usePlatformInit();
  const navigate = useNavigate();

  // ── Phase ──
  const [phase, setPhase] = useState<Phase>('checking');

  // ── Pending email (shown in the PendingScreen) ──
  const [pendingEmail, setPendingEmail] = useState('');

  // ── Sign-up form state ──
  const [fullName, setFullName]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');

  // ── Sign-in resume state (email pre-filled from pending or form) ──
  const [resumeEmail, setResumeEmail] = useState('');

  // ── Touched flags ──
  const [touchedName,    setTouchedName]    = useState(false);
  const [touchedEmail,   setTouchedEmail]   = useState(false);
  const [touchedPw,      setTouchedPw]      = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  // ── Shared UI state ──
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);

  // Ref so the auth-state-change listener can read the latest phase without
  // being re-created on every phase change.
  const phaseRef = useRef<Phase>('checking');
  phaseRef.current = phase;

  // ── Field errors ──
  const nameErr    = touchedName    ? validateFullName(fullName)      : null;
  const emailErr   = touchedEmail   ? validateEmail(email)            : null;
  const pwErr      = touchedPw      ? validatePassword(password)      : null;
  const confirmErr = touchedConfirm ? validateConfirm(password, confirm) : null;

  // ── Finalize helper (shared by mount check + "check session" button) ──
  const runFinalize = useCallback(async () => {
    setPhase('resuming');
    setSubmitError(null);

    const result = await finalizeInitialization();

    if (result.error) {
      // Could not write platform_config — surface the error and let the user
      // decide (stay on pending screen or restart).
      setSubmitError(result.error);
      const pending = getPendingAdminInit();
      setPhase(pending ? 'pending' : 'form');
      return;
    }

    // Success: navigate first so InitializeGuard is no longer rendered, then
    // flip initialized to prevent PlatformInitGuard from blocking /admin.
    setPhase('done');
    navigate('/admin', { replace: true });
    markInitialized();
  }, [markInitialized, navigate]);

  // ── Mount effect — determine starting phase ───────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const pending = getPendingAdminInit();

      // Fetch session in parallel with reading localStorage
      const { data: { session } } = await supabase.auth.getSession();

      if (cancelled) return;

      if (session?.user) {
        // We have an active, verified session → finalize immediately.
        await runFinalize();
        return;
      }

      if (pending) {
        // Auth user was created but email not yet confirmed.
        setPendingEmail(pending.email);
        setEmail(pending.email);        // pre-fill form if user goes back
        setPhase('pending');
        return;
      }

      // No prior attempt → show the form.
      setPhase('form');
    };

    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // ── Auth-state-change listener (same-tab link click) ─────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          event === 'SIGNED_IN' &&
          session?.user &&
          (phaseRef.current === 'pending' || phaseRef.current === 'form')
        ) {
          await runFinalize();
        }
      },
    );
    return () => subscription.unsubscribe();
  }, [runFinalize]);

  // ── Sign-up form submit ───────────────────────────────────────────────────
  const handleSignUpSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setTouchedName(true);
    setTouchedEmail(true);
    setTouchedPw(true);
    setTouchedConfirm(true);

    if (
      validateFullName(fullName) ||
      validateEmail(email) ||
      validatePassword(password) ||
      validateConfirm(password, confirm)
    ) return;

    setSubmitError(null);
    setLoading(true);

    try {
      const result = await initializePlatform({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      if (result.userAlreadyExists) {
        // Confirmed user exists but no platform_config.
        setResumeEmail(email.trim());
        setPhase('signin_resume');
        return;
      }

      if (result.error) {
        setSubmitError(result.error);
        return;
      }

      if (result.needsEmailConfirmation) {
        // Auth user created; email not yet confirmed.
        setPendingEmail(email.trim());
        setPhase('pending');
        return;
      }

      // Email confirmation disabled — fully initialized.
      setPhase('done');
      navigate('/admin', { replace: true });
      markInitialized();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg || 'Terjadi kesalahan yang tidak terduga.');
    } finally {
      setLoading(false);
    }
  }, [fullName, email, password, confirm, markInitialized, navigate]);

  // ── "Check verification" button on PendingScreen ─────────────────────────
  const handleCheckVerification = useCallback(async () => {
    setLoading(true);
    setSubmitError(null);

    // Refresh session — Supabase SDK may have updated it after email click.
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      setSubmitError(
        'Email belum diverifikasi. Buka kotak masuk Anda dan klik tautan ' +
        'verifikasi, kemudian coba lagi.',
      );
      setLoading(false);
      return;
    }

    setLoading(false);
    await runFinalize();
  }, [runFinalize]);

  // ── "Back & use different email" on PendingScreen ────────────────────────
  const handleBackFromPending = useCallback(() => {
    clearPendingAdminInit();
    setPendingEmail('');
    setSubmitError(null);
    setPhase('form');
  }, []);

  // ── Sign-in-to-resume submit ──────────────────────────────────────────────
  const handleSignInResume = useCallback(async (pw: string) => {
    setLoading(true);
    setSubmitError(null);

    try {
      const result = await signInAndFinalize({ email: resumeEmail, password: pw });

      if (result.error) {
        setSubmitError(result.error);
        return;
      }

      setPhase('done');
      navigate('/admin', { replace: true });
      markInitialized();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg || 'Terjadi kesalahan yang tidak terduga.');
    } finally {
      setLoading(false);
    }
  }, [resumeEmail, markInitialized, navigate]);

  // ── Render ────────────────────────────────────────────────────────────────

  const renderBody = () => {
    switch (phase) {
      case 'checking':
        return <CheckingScreen />;

      case 'resuming':
        return <ResumingScreen />;

      case 'done':
        return <DoneScreen />;

      case 'pending':
        return (
          <PendingScreen
            email={pendingEmail}
            loading={loading}
            error={submitError}
            onCheck={handleCheckVerification}
            onBack={handleBackFromPending}
          />
        );

      case 'signin_resume':
        return (
          <SignInResumeForm
            email={resumeEmail}
            loading={loading}
            error={submitError}
            onSubmit={handleSignInResume}
            onBack={() => { setSubmitError(null); setPhase('form'); }}
          />
        );

      case 'form':
      default:
        return (
          <>
            {/* ── One-time notice ── */}
            <div style={s.notice}>
              <span style={s.noticeIcon}>🔐</span>
              <p style={s.noticeText}>
                Halaman ini hanya muncul sekali. Setelah akun dibuat, halaman
                ini tidak dapat diakses kembali.
              </p>
            </div>

            {submitError && (
              <div style={{ ...s.errorBox, marginBottom: 4 }} role="alert">
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span>{submitError}</span>
              </div>
            )}

            <form
              onSubmit={handleSignUpSubmit}
              noValidate
              style={s.form}
              aria-label="Form inisialisasi platform"
            >
              <Field id="init-name" label="Nama Lengkap Administrator" error={nameErr}>
                <input
                  id="init-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Nama lengkap Anda"
                  value={fullName}
                  disabled={loading}
                  onChange={(e) => { setFullName(e.target.value); if (submitError) setSubmitError(null); }}
                  onBlur={() => setTouchedName(true)}
                  aria-invalid={!!nameErr}
                  style={{ ...s.input, ...(nameErr ? s.inputError : {}) }}
                />
              </Field>

              <Field id="init-email" label="Alamat Email" error={emailErr}>
                <input
                  id="init-email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@domain.com"
                  value={email}
                  disabled={loading}
                  onChange={(e) => { setEmail(e.target.value); if (submitError) setSubmitError(null); }}
                  onBlur={() => setTouchedEmail(true)}
                  aria-invalid={!!emailErr}
                  style={{ ...s.input, ...(emailErr ? s.inputError : {}) }}
                />
              </Field>

              <PasswordField
                id="init-password"
                label="Kata Sandi"
                hint=" (min. 8 karakter, huruf + angka)"
                placeholder="Buat kata sandi yang kuat"
                value={password}
                disabled={loading}
                error={pwErr}
                autoComplete="new-password"
                onChange={(v) => { setPassword(v); if (submitError) setSubmitError(null); }}
                onBlur={() => setTouchedPw(true)}
              />

              <PasswordField
                id="init-confirm"
                label="Konfirmasi Kata Sandi"
                placeholder="Ulangi kata sandi"
                value={confirm}
                disabled={loading}
                error={confirmErr}
                autoComplete="new-password"
                onChange={(v) => { setConfirm(v); if (submitError) setSubmitError(null); }}
                onBlur={() => setTouchedConfirm(true)}
              />

              <button
                type="submit"
                disabled={loading}
                style={{ ...s.submitBtn, ...(loading ? s.submitBtnDisabled : {}) }}
              >
                {loading ? 'Menginisialisasi…' : 'Buat Akun & Inisialisasi Platform'}
              </button>
            </form>
          </>
        );
    }
  };

  const titles: Record<Phase, { title: string; subtitle: string }> = {
    checking:      { title: 'Inisialisasi Platform', subtitle: 'Memeriksa status…' },
    form:          { title: 'Inisialisasi Platform', subtitle: 'Buat akun System Administrator pertama untuk TernakHub' },
    pending:       { title: 'Verifikasi Email', subtitle: 'Satu langkah lagi sebelum platform siap digunakan' },
    resuming:      { title: 'Inisialisasi Platform', subtitle: 'Menyelesaikan konfigurasi…' },
    signin_resume: { title: 'Lanjutkan Inisialisasi', subtitle: 'Masuk untuk menyelesaikan proses bootstrap' },
    done:          { title: 'Inisialisasi Selesai', subtitle: 'Platform siap digunakan' },
  };

  const { title, subtitle } = titles[phase];

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      {renderBody()}
    </AuthLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-text)',
    lineHeight: 1.4,
  },
  hint: {
    fontWeight: 400,
    color: 'var(--color-muted)',
    fontSize: 12,
  },
  fieldError: {
    margin: 0,
    fontSize: 12,
    color: 'var(--color-danger)',
    lineHeight: 1.4,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
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
  eyeBtn: {
    position: 'absolute' as const,
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
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 18,
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
    transition: 'opacity 0.15s',
    letterSpacing: '0.01em',
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  ghostBtn: {
    width: '100%',
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--color-muted)',
    background: 'none',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  notice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(59, 130, 246, 0.07)',
    border: '1.5px solid rgba(59, 130, 246, 0.22)',
    marginBottom: 4,
  },
  noticeIcon: {
    fontSize: 18,
    flexShrink: 0,
    lineHeight: 1.4,
  },
  noticeText: {
    margin: 0,
    fontSize: 13,
    color: 'var(--color-muted)',
    lineHeight: 1.55,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(239,68,68,0.07)',
    border: '1.5px solid rgba(239,68,68,0.25)',
    fontSize: 13,
    color: 'var(--color-danger)',
    lineHeight: 1.5,
  },
  stepList: {
    margin: 0,
    paddingLeft: 22,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  stepItem: {
    fontSize: 13,
    color: 'var(--color-text)',
    lineHeight: 1.5,
  },
  successBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
    padding: '32px 16px',
    textAlign: 'center' as const,
  },
  successIcon: {
    fontSize: 40,
  },
  successText: {
    margin: 0,
    fontSize: 14,
    color: 'var(--color-text)',
    lineHeight: 1.6,
    fontWeight: 500,
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid var(--color-border)',
    borderTopColor: 'var(--color-primary)',
    borderRadius: '50%',
    animation: 'auth-spin 0.8s linear infinite',
    margin: '0 auto',
  },
};
