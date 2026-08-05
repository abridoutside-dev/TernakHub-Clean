// ─── Register Page ────────────────────────────────────────────────────────────
// AUTH-006 — Full registration form with Supabase auth + auto sign-in.
//
// Post-registration flow:
//   atomic register (auth + profile + default workspace) → signIn (auto)
//
// Email verification is NOT required before first login (per spec).
// Marketplace transaction restrictions for unverified users are enforced
// on the individual Marketplace pages (future task).

import {
  useState,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';

// ─── Phone number helpers ────────────────────────────────────────────────────

/** Strip formatting characters and normalise to +62XXXXXXXXXX */
function normalisePhone(raw: string): string {
  const stripped = raw.replace(/[\s\-().]/g, '');
  if (stripped.startsWith('+62')) return stripped;
  if (stripped.startsWith('62'))  return '+' + stripped;
  if (stripped.startsWith('0'))   return '+62' + stripped.slice(1);
  return stripped;
}

function validatePhone(raw: string): string | null {
  if (!raw.trim()) return 'Nomor HP wajib diisi.';
  const normalised = normalisePhone(raw);
  // +62 followed by 8, then 8-11 more digits  → total 11-14 chars after +62
  if (!/^\+628[1-9][0-9]{7,10}$/.test(normalised)) {
    return 'Masukkan nomor HP Indonesia yang valid (contoh: 08123456789).';
  }
  return null;
}

// ─── Password strength ───────────────────────────────────────────────────────

type StrengthLevel = 'weak' | 'medium' | 'strong';

interface StrengthInfo {
  level: StrengthLevel;
  label: string;
  color: string;
  bars: number;   // 1–3 filled bars
}

function measureStrength(password: string): StrengthInfo {
  if (!password) return { level: 'weak', label: '', color: '#e0e0e0', bars: 0 };

  const categories = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const long = password.length >= 10;
  const decent = password.length >= 8;

  if (!decent || categories < 2) {
    return { level: 'weak',   label: 'Lemah',  color: 'var(--color-danger)', bars: 1 };
  }
  if (!long && categories < 3) {
    return { level: 'medium', label: 'Sedang', color: 'var(--color-warning)', bars: 2 };
  }
  return   { level: 'strong', label: 'Kuat',   color: '#1b7a43',             bars: 3 };
}

// ─── Supabase error → friendly Indonesian ────────────────────────────────────

function mapSignUpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
  }
  if (m.includes('password should be at least')) {
    return 'Kata sandi terlalu pendek. Gunakan minimal 8 karakter.';
  }
  if (m.includes('invalid email')) {
    return 'Format email tidak valid. Periksa kembali alamat email Anda.';
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch')) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  }
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.';
  }
  return 'Terjadi kesalahan yang tidak terduga. Silakan coba beberapa saat lagi.';
}

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Email wajib diisi.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Masukkan alamat email yang valid.';
  return null;
}

function validatePassword(v: string): string | null {
  if (!v) return 'Kata sandi wajib diisi.';
  if (v.length < 8) return 'Kata sandi minimal 8 karakter.';
  return null;
}

function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return 'Konfirmasi kata sandi wajib diisi.';
  if (confirm !== password) return 'Password tidak sama.';
  return null;
}

function validateRequired(v: string, message: string): string | null {
  return v.trim() ? null : message;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  id, label, required = false, error, children,
}: {
  id: string; label: string; required?: boolean;
  error?: string | null; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label htmlFor={id} style={st.label}>
        {label}
        {!required && (
          <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--color-muted)', marginLeft: 4 }}>
            (opsional)
          </span>
        )}
      </label>
      {children}
      {error && <p role="alert" style={st.fieldErr}>{error}</p>}
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function StrengthBar({ password }: { password: string }) {
  const info = measureStrength(password);
  if (!password) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{
            flex: 1, height: 4, borderRadius: 99,
            background: n <= info.bars ? info.color : 'var(--color-border)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      {info.label && (
        <p style={{ margin: 0, fontSize: 11, color: info.color, fontWeight: 600 }}>
          {info.label}
          {info.level === 'weak' && ' — tambahkan huruf besar, angka, atau simbol'}
        </p>
      )}
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Checkmark */}
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#e8f5ee', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
        }}>✅</div>
      </div>

      <p style={{ margin: 0, fontSize: 14, color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.6 }}>
        Akun Anda berhasil dibuat. Langkah berikutnya: verifikasi email, lalu ikuti panduan onboarding untuk membuat workspace pertama Anda.
      </p>

      {/* Email verification required */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'flex-start',
        background: '#fff8e1', border: '1.5px solid #ffe082',
        borderRadius: 'var(--radius-sm)', padding: '12px 14px',
      }}>
        <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.3 }}>📧</span>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e65100' }}>
            Verifikasi email diperlukan
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#bf360c', lineHeight: 1.5 }}>
            Cek kotak masuk Anda dan klik tautan verifikasi sebelum melanjutkan.
            Verifikasi diperlukan untuk mengaktifkan seluruh fitur TernakHub.
          </p>
        </div>
      </div>

      <button onClick={onContinue} style={st.submitBtn}>
        Verifikasi Email →
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Phase = 'form' | 'success';

/** Returns true if `path` is a safe same-origin relative path (no protocol). */
function isSafeRedirect(path: string): boolean {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

export default function Register() {
  console.log('[Register] render');
  const { registerAtomically, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '';

  // ── Phase ──
  const [phase, setPhase] = useState<Phase>('form');

  // ── Form fields ──
  const [fullName,   setFullName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [province,   setProvince]   = useState('');
  const [regency,    setRegency]    = useState('');
  const [district,   setDistrict]   = useState('');
  const [village,     setVillage]   = useState('');
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePriv,  setAgreePriv]  = useState(false);

  // ── Errors ──
  const [fullNameErr, setFullNameErr] = useState<string | null>(null);
  const [emailErr,   setEmailErr]   = useState<string | null>(null);
  const [phoneErr,   setPhoneErr]   = useState<string | null>(null);
  const [provinceErr, setProvinceErr] = useState<string | null>(null);
  const [regencyErr, setRegencyErr] = useState<string | null>(null);
  const [districtErr, setDistrictErr] = useState<string | null>(null);
  const [villageErr, setVillageErr] = useState<string | null>(null);
  const [passErr,    setPassErr]    = useState<string | null>(null);
  const [confErr,    setConfErr]    = useState<string | null>(null);
  const [termsErr,   setTermsErr]   = useState<string | null>(null);
  const [submitErr,  setSubmitErr]  = useState<string | null>(null);

  // ── Loading ──
  const [loading, setLoading] = useState(false);

  // ── Clear submit error on any change ──
  function clearSubmit() { if (submitErr) setSubmitErr(null); }

  // ── Blur handlers ──
  const onFullNameBlur = useCallback(() => setFullNameErr(validateRequired(fullName, 'Nama lengkap wajib diisi.')), [fullName]);
  const onEmailBlur = useCallback(() => setEmailErr(validateEmail(email)), [email]);
  const onPhoneBlur = useCallback(() => setPhoneErr(validatePhone(phone)), [phone]);
  const onProvinceBlur = useCallback(() => setProvinceErr(validateRequired(province, 'Pilih Provinsi.')), [province]);
  const onRegencyBlur = useCallback(() => setRegencyErr(validateRequired(regency, 'Pilih Kabupaten/Kota.')), [regency]);
  const onDistrictBlur = useCallback(() => setDistrictErr(validateRequired(district, 'Pilih Kecamatan.')), [district]);
  const onVillageBlur = useCallback(() => setVillageErr(validateRequired(village, 'Pilih Desa.')), [village]);
  const onPassBlur  = useCallback(() => setPassErr(validatePassword(password)), [password]);
  const onConfBlur  = useCallback(() => setConfErr(validateConfirm(password, confirm)), [password, confirm]);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    // Run full validation
    const nE = validateRequired(fullName, 'Nama lengkap wajib diisi.');
    const eE = validateEmail(email);
    const pE = validatePhone(phone);
    const prE = validateRequired(province, 'Pilih Provinsi.');
    const rE = validateRequired(regency, 'Pilih Kabupaten/Kota.');
    const dE = validateRequired(district, 'Pilih Kecamatan.');
    const vE = validateRequired(village, 'Pilih Desa.');
    const wE = validatePassword(password);
    const cE = validateConfirm(password, confirm);
    const tE = !agreeTerms
      ? 'Anda harus menyetujui Syarat & Ketentuan.'
      : null;

    setFullNameErr(nE);
    setEmailErr(eE);
    setPhoneErr(pE);
    setProvinceErr(prE);
    setRegencyErr(rE);
    setDistrictErr(dE);
    setVillageErr(vE);
    setPassErr(wE);
    setConfErr(cE);
    setTermsErr(tE);
    if (nE || eE || pE || prE || rE || dE || vE || wE || cE || tE) return;

    setSubmitErr(null);
    setLoading(true);

    try {
      const { error: registrationError } = await registerAtomically({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: normalisePhone(phone),
        province: province.trim(),
        regency: regency.trim(),
        district: district.trim(),
        village: village.trim(),
      });

      if (registrationError) {
        setSubmitErr(mapSignUpError(registrationError));
        return;
      }

      // 2. Auto sign-in (email confirmation not required before first login)
      const { error: signInError } = await signIn(email.trim(), password);

      if (signInError) {
        // Edge case: account was created but session could not be established.
        // Redirect to login so the user can try manually.
        navigate('/login', { replace: true });
        return;
      }

      // 3. Success — show confirmation state with email reminder
      setPhase('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitErr(mapSignUpError(msg));
    } finally {
      setLoading(false);
    }
  }, [email, phone, password, confirm, fullName, province, regency, district, village, agreeTerms, registerAtomically, signIn, navigate]);

  const handleFormSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!loading) handleSubmit();
  }, [handleSubmit, loading]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) handleSubmit();
  }, [handleSubmit, loading]);

  // ── Shared input style ──
  function inputStyle(hasErr: boolean): React.CSSProperties {
    return { ...st.input, ...(hasErr ? st.inputErr : {}) };
  }

  // ── Phase: success ──
  if (phase === 'success') {
    // If the user came from an invite link, take them back there; otherwise
    // require email verification before proceeding to onboarding + workspace.
    const postRegisterPath = isSafeRedirect(redirectTo) ? redirectTo : '/verify-email';
    return (
      <AuthLayout title="Akun Berhasil Dibuat! 🎉">
        <SuccessState onContinue={() => navigate(postRegisterPath, { replace: true })} />
      </AuthLayout>
    );
  }

  // ── Phase: form ──
  return (
    <AuthLayout
      title="Buat Akun Baru"
      subtitle="Bergabunglah dengan ribuan peternak di TernakHub"
      error={submitErr}
      loading={loading}
      loadingLabel="Membuat akun…"
      footer={
        <p style={{ margin: 0 }}>
          Sudah punya akun?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Masuk
          </Link>
        </p>
      }
    >
      <form onSubmit={handleFormSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Full Name ── */}
        <Field id="reg-name" label="Nama Lengkap" required error={fullNameErr}>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            placeholder="Budi Santoso"
            value={fullName}
            disabled={loading}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { setFullName(e.target.value); setFullNameErr(null); clearSubmit(); }}
            onBlur={onFullNameBlur}
            onKeyDown={handleKeyDown}
            aria-invalid={!!fullNameErr}
            style={inputStyle(!!fullNameErr)}
          />
        </Field>

        {/* ── Location ── */}
        <Field id="reg-province" label="Provinsi" required error={provinceErr}>
          <input
            id="reg-province"
            type="text"
            autoComplete="address-level1"
            placeholder="Jawa Barat"
            value={province}
            disabled={loading}
            onChange={(e) => { setProvince(e.target.value); setProvinceErr(null); clearSubmit(); }}
            onBlur={onProvinceBlur}
            onKeyDown={handleKeyDown}
            aria-invalid={!!provinceErr}
            style={inputStyle(!!provinceErr)}
          />
        </Field>

        <Field id="reg-regency" label="Kabupaten/Kota" required error={regencyErr}>
          <input
            id="reg-regency"
            type="text"
            autoComplete="address-level2"
            placeholder="Kabupaten/Kota"
            value={regency}
            disabled={loading}
            onChange={(e) => { setRegency(e.target.value); setRegencyErr(null); clearSubmit(); }}
            onBlur={onRegencyBlur}
            onKeyDown={handleKeyDown}
            aria-invalid={!!regencyErr}
            style={inputStyle(!!regencyErr)}
          />
        </Field>

        <Field id="reg-district" label="Kecamatan" required error={districtErr}>
          <input
            id="reg-district"
            type="text"
            autoComplete="address-level3"
            placeholder="Kecamatan"
            value={district}
            disabled={loading}
            onChange={(e) => { setDistrict(e.target.value); setDistrictErr(null); clearSubmit(); }}
            onBlur={onDistrictBlur}
            onKeyDown={handleKeyDown}
            aria-invalid={!!districtErr}
            style={inputStyle(!!districtErr)}
          />
        </Field>

        <Field id="reg-village" label="Desa" required error={villageErr}>
          <input
            id="reg-village"
            type="text"
            autoComplete="address-level4"
            placeholder="Desa"
            value={village}
            disabled={loading}
            onChange={(e) => { setVillage(e.target.value); setVillageErr(null); clearSubmit(); }}
            onBlur={onVillageBlur}
            onKeyDown={handleKeyDown}
            aria-invalid={!!villageErr}
            style={inputStyle(!!villageErr)}
          />
        </Field>

        {/* ── Email ── */}
        <Field id="reg-email" label="Email" required error={emailErr}>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            disabled={loading}
            onChange={(e) => { setEmail(e.target.value); setEmailErr(null); clearSubmit(); }}
            onBlur={onEmailBlur}
            onKeyDown={handleKeyDown}
            aria-invalid={!!emailErr}
            style={inputStyle(!!emailErr)}
          />
        </Field>

        {/* ── Phone ── */}
        <Field id="reg-phone" label="Nomor HP" required error={phoneErr}>
          <input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            placeholder="08123456789"
            value={phone}
            disabled={loading}
            onChange={(e) => { setPhone(e.target.value); setPhoneErr(null); clearSubmit(); }}
            onBlur={onPhoneBlur}
            onKeyDown={handleKeyDown}
            aria-invalid={!!phoneErr}
            style={inputStyle(!!phoneErr)}
          />
          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>
            Format: 08xx, +628xx, atau 628xx
          </p>
        </Field>

        {/* ── Password ── */}
        <Field id="reg-pass" label="Kata Sandi" required error={passErr}>
          <div style={st.pwWrap}>
            <input
              id="reg-pass"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 karakter"
              value={password}
              disabled={loading}
              onChange={(e) => { setPassword(e.target.value); setPassErr(null); clearSubmit(); }}
              onBlur={onPassBlur}
              onKeyDown={handleKeyDown}
              aria-invalid={!!passErr}
              style={{ ...inputStyle(!!passErr), paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShowPass(v => !v)} disabled={loading}
              aria-label={showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              style={st.eyeBtn}>
              <span style={{ color: 'var(--color-muted)', display: 'flex' }}><EyeIcon open={showPass} /></span>
            </button>
          </div>
          <StrengthBar password={password} />
        </Field>

        {/* ── Confirm Password ── */}
        <Field id="reg-conf" label="Konfirmasi Kata Sandi" required error={confErr}>
          <div style={st.pwWrap}>
            <input
              id="reg-conf"
              type={showConf ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Ulangi kata sandi"
              value={confirm}
              disabled={loading}
              onChange={(e) => { setConfirm(e.target.value); setConfErr(null); clearSubmit(); }}
              onBlur={onConfBlur}
              onKeyDown={handleKeyDown}
              aria-invalid={!!confErr}
              style={{ ...inputStyle(!!confErr), paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShowConf(v => !v)} disabled={loading}
              aria-label={showConf ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              style={st.eyeBtn}>
              <span style={{ color: 'var(--color-muted)', display: 'flex' }}><EyeIcon open={showConf} /></span>
            </button>
          </div>
        </Field>

        {/* ── Checkboxes ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 2 }}>
          <CheckboxRow
            id="reg-terms"
            checked={agreeTerms}
            disabled={loading}
            onChange={(v) => { setAgreeTerms(v); setTermsErr(null); }}
          >
            Saya menyetujui{' '}
            <span style={st.policyLink}>Syarat &amp; Ketentuan</span>
            {' '}TernakHub
          </CheckboxRow>

          <CheckboxRow
            id="reg-priv"
            checked={agreePriv}
            disabled={loading}
            onChange={(v) => { setAgreePriv(v); setTermsErr(null); }}
          >
            Saya menyetujui{' '}
            <span style={st.policyLink}>Kebijakan Privasi</span>
            {' '}TernakHub (opsional)
          </CheckboxRow>

          {termsErr && (
            <p role="alert" style={st.fieldErr}>{termsErr}</p>
          )}
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={loading || !!(
            validateRequired(fullName, '') ||
            validateEmail(email) ||
            validatePhone(phone) ||
            validateRequired(province, '') ||
            validateRequired(regency, '') ||
            validateRequired(district, '') ||
            validateRequired(village, '') ||
            validatePassword(password) ||
            validateConfirm(password, confirm) ||
            !agreeTerms
          )}
          style={{ ...st.submitBtn, ...(loading || !!(
            validateRequired(fullName, '') ||
            validateEmail(email) ||
            validatePhone(phone) ||
            validateRequired(province, '') ||
            validateRequired(regency, '') ||
            validateRequired(district, '') ||
            validateRequired(village, '') ||
            validatePassword(password) ||
            validateConfirm(password, confirm) ||
            !agreeTerms
          ) ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
        >
          {loading ? 'Memproses…' : 'Buat Akun'}
        </button>

      </form>
    </AuthLayout>
  );
}

// ─── Checkbox row helper ──────────────────────────────────────────────────────

function CheckboxRow({
  id, checked, disabled, onChange, children,
}: {
  id: string; checked: boolean; disabled: boolean;
  onChange: (v: boolean) => void; children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5,
      userSelect: 'none',
    }}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer', accentColor: 'var(--color-primary)', flexShrink: 0 }}
      />
      <span>{children}</span>
    </label>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st: Record<string, React.CSSProperties> = {
  label: { fontSize: 14, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.4 },
  fieldErr: { margin: 0, fontSize: 12, color: 'var(--color-danger)', lineHeight: 1.4 },

  input: {
    width: '100%', boxSizing: 'border-box', height: 44,
    padding: '0 14px', fontSize: 15, borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    outline: 'none', transition: 'border-color 0.15s',
  },
  inputErr: { borderColor: 'var(--color-danger)' },

  pwWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  eyeBtn: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
  },

  policyLink: { color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' },

  submitBtn: {
    width: '100%', height: 48,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, fontWeight: 700, color: '#fff',
    background: 'var(--color-primary)',
    border: 'none', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', marginTop: 4,
    transition: 'background 0.15s, opacity 0.15s', letterSpacing: '0.01em',
  },
};
