// ─── Create First Workspace — WS-002 ─────────────────────────────────────────
//
// Shown when a newly registered user has no Workspace yet.
// Also reachable at /workspace/create for any zero-workspace scenario.
//
// Flow: fill form → createWorkspace (WS-001 service)
//       → addWorkspaceLocally (inject record into shared WorkspaceProvider)
//       → setActiveWorkspaceUuid → /workspace/select
//
// FLOW-001F4 fixes applied:
//   • /workspace/create and /workspace/select now share the SAME
//     WorkspaceProviderLayout as the main protected routes (App.tsx).
//     This means the workspace injected here via addWorkspaceLocally()
//     persists in context when React Router navigates to /dashboard,
//     eliminating the two-provider remount that caused the redirect loop.
//   • Replaced fire-and-forget refreshWorkspaces() with addWorkspaceLocally()
//     — the RPC result already contains the full workspace record, so no
//     async Supabase SELECT is needed before navigation.
//   • Removed redundant register_workspace_owner RPC call — the atomic
//     create_workspace_with_owner RPC already inserts the owner member row.
//
// FLOW-001F (prior) fixes applied:
//   • All useState / useEffect hooks moved to top of component (before any
//     conditional return) to comply with React Rules of Hooks.
//
// Rules:
//  - Only one workspace is created here (not multiple).
//  - Required: Workspace Type, Name, Province, City / Regency, District, Village.
//  - Slug is derived automatically from Name and guaranteed unique.
//  - Status defaults to Active; Plan defaults to Free.
//  - Owner is the currently authenticated Supabase user.
//  - No members, invitations, roles, switching, or archive.

import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import AuthLogo from '../../components/auth/AuthLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { isEmailVerified } from '../../utils/emailVerification';
import { hasCompletedOnboarding } from '../../data/onboardingData';
import { supabase } from '../../lib/supabase';
import {
  createWorkspace,
  generateUniqueSlug,
} from '../../services/workspaceService';
// DB-001B-3: seedNewWorkspaceSubscription removed — subscription is read from
// Supabase (workspace_subscriptions table) via workspaceSubscriptionRepository.
// New workspaces start on Free; the DB row is created by the platform trigger
// or via a future server-side bootstrap path.
import {
  WORKSPACE_TYPES,
  WORKSPACE_TYPE_LABEL,
  type WorkspaceType,
} from '../../types/workspace';

// ─── Workspace type metadata ──────────────────────────────────────────────────

const TYPE_META: Record<WorkspaceType, { icon: string; desc: string }> = {
  Farm:       { icon: '🐄', desc: 'Manajemen ternak & pertanian'            },
  FeedStore:  { icon: '🌾', desc: 'Operasional toko pakan & pasokan'        },
  Veterinary: { icon: '🩺', desc: 'Klinik atau praktik veteriner'           },
  Transport:  { icon: '🚚', desc: 'Transportasi & logistik ternak'          },
};

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateEmail(v: string): string | null {
  if (!v.trim()) return null; // optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
    ? null
    : 'Masukkan alamat email yang valid.';
}

function validateCity(v: string): string | null {
  if (!v.trim()) return 'Kota / Kabupaten wajib diisi.';
  if (v.trim().length < 2) return 'Nama kota minimal 2 karakter.';
  return null;
}

function validateProvince(v: string): string | null {
  if (!v.trim()) return 'Provinsi wajib diisi.';
  if (v.trim().length < 2) return 'Nama provinsi minimal 2 karakter.';
  return null;
}

function validateDistrict(v: string): string | null {
  if (!v.trim()) return 'Kecamatan wajib diisi.';
  if (v.trim().length < 2) return 'Nama kecamatan minimal 2 karakter.';
  return null;
}

function validateVillage(v: string): string | null {
  if (!v.trim()) return 'Desa / Kelurahan wajib diisi.';
  if (v.trim().length < 2) return 'Nama desa minimal 2 karakter.';
  return null;
}

function validateUrl(v: string): string | null {
  if (!v.trim()) return null;
  try {
    const u = new URL(v.startsWith('http') ? v : `https://${v}`);
    return u.protocol === 'https:' || u.protocol === 'http:' ? null : 'Masukkan URL yang valid.';
  } catch {
    return 'Masukkan URL yang valid (mis. https://example.com).';
  }
}

function validatePhone(v: string): string | null {
  if (!v.trim()) return null;
  return /^[+\d][\d\s\-().]{5,19}$/.test(v.trim())
    ? null
    : 'Masukkan nomor telepon yang valid.';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
      color: 'var(--color-muted)', textTransform: 'uppercase' as const,
      paddingTop: 8, marginBottom: 2,
      borderTop: '1px solid var(--color-border)',
    }}>
      {children}
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string | null;
  children: React.ReactNode;
  hint?: string;
}

function Field({ label, required, error, children, hint }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && !error && (
        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkspaceCreate() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const {
    activeWorkspaces,
    isLoading: wsLoading,
    wsError,
    setActiveWorkspaceUuid,
    addWorkspaceLocally,
    refreshWorkspaces,
  } = useWorkspace();

  // ── FLOW-001F: ALL hooks must be declared before any conditional return ─────
  // Moving them here fixes the Rules-of-Hooks violation where useState /
  // useEffect were previously called after early guard returns.

  const [wsType,      setWsType]      = useState<WorkspaceType | ''>('');
  const [name,        setName]        = useState('');
  const [slug,        setSlug]        = useState('');
  const [logoUrl,     setLogoUrl]     = useState('');
  const [description, setDescription] = useState('');
  const [phone,       setPhone]       = useState('');
  const [email,       setEmail]       = useState('');
  const [website,     setWebsite]     = useState('');
  const [country,     setCountry]     = useState('');
  const [province,    setProvince]    = useState('');
  const [city,        setCity]        = useState('');
  const [district,    setDistrict]    = useState('');
  const [village,     setVillage]     = useState('');
  const [postalCode,  setPostalCode]  = useState('');
  const [address,     setAddress]     = useState('');
  const [latitude,    setLatitude]    = useState('');
  const [longitude,   setLongitude]   = useState('');

  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);

  // Auto-derive slug from name (hook — must stay above all conditional returns).
  useEffect(() => {
    if (!name.trim()) { setSlug(''); return; }
    const derived = generateUniqueSlug(name.trim());
    setSlug(derived);
  }, [name]);

  // ── P0-006: Prerequisites guard (conditional renders AFTER all hooks) ─────
  // Still loading auth or workspace — show spinner instead of the form.
  if (authLoading || wsLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ width: 36, height: 36, border: '3.5px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'wc-spin 0.7s linear infinite' }} />
        <style>{`@keyframes wc-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not logged in → send to login.
  if (!currentUser) return <Navigate to="/login" replace />;

  // Email not verified → send to verify.
  if (!isEmailVerified(currentUser)) return <Navigate to="/verify-email" replace />;

  // Onboarding not done → send to onboarding.
  if (!hasCompletedOnboarding()) return <Navigate to="/onboarding" replace />;

  // Workspace fetch errored → do not allow workspace creation; show retry.
  if (wsError) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'var(--color-bg)', gap: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>Gagal Memuat Workspace</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-muted)', maxWidth: 320, lineHeight: 1.6 }}>
          Tidak dapat memverifikasi apakah Anda sudah memiliki workspace. Periksa koneksi Anda lalu coba lagi.
        </p>
        <button onClick={refreshWorkspaces} style={{ marginTop: 8, height: 44, padding: '0 28px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          🔄 Coba Lagi
        </button>
      </div>
    );
  }

  // User already has active workspaces → send them to the selector so they
  // can pick which workspace to enter.  Redirecting straight to /dashboard
  // would bypass the workspace context initialisation that /workspace/select
  // performs (and break the post-create E2E flow).
  if (activeWorkspaces.length > 0) return <Navigate to="/workspace/select" replace />;
  // ── End prerequisites guard ───────────────────────────────────────────────

  // ── Validate ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!wsType)         e.wsType = 'Silakan pilih tipe workspace.';
    if (!name.trim())    e.name   = 'Nama workspace wajib diisi.';
    else if (name.trim().length < 2)   e.name = 'Nama minimal 2 karakter.';
    else if (name.trim().length > 120) e.name = 'Nama tidak boleh melebihi 120 karakter.';
    const provinceErr = validateProvince(province);
    const cityErr     = validateCity(city);
    const districtErr = validateDistrict(district);
    const villageErr  = validateVillage(village);
    const emailErr    = validateEmail(email);
    const urlErr      = validateUrl(website);
    const phoneErr    = validatePhone(phone);
    if (provinceErr) e.province = provinceErr;
    if (cityErr)     e.city     = cityErr;
    if (districtErr) e.district = districtErr;
    if (villageErr)  e.village  = villageErr;
    if (emailErr)    e.email    = emailErr;
    if (urlErr)      e.website  = urlErr;
    if (phoneErr)    e.phone    = phoneErr;
    const lat = parseFloat(latitude);
    if (latitude.trim() && (isNaN(lat) || lat < -90  || lat > 90))  e.latitude  = 'Lintang harus antara -90 dan 90.';
    const lng = parseFloat(longitude);
    if (longitude.trim() && (isNaN(lng) || lng < -180 || lng > 180)) e.longitude = 'Bujur harus antara -180 dan 180.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setGlobalError(null);
    if (!validate()) return;
    if (!wsType) return; // narrowed above but TS needs this

    setSaving(true);
    try {
      if (!currentUser?.id) {
        setGlobalError('Sesi autentikasi tidak ditemukan. Silakan login kembali.');
        setSaving(false);
        return;
      }
      const ownerUuid = currentUser.id;

      const result = await createWorkspace({
        workspace_type:   wsType,
        workspace_name:   name.trim(),
        workspace_slug:   slug,
        workspace_status: 'Active',
        workspace_plan:   'Free',
        owner_user_uuid:  ownerUuid,
        logo_url:         logoUrl.trim()    || null,
        description:      description.trim() || null,
        phone:            phone.trim()       || null,
        email:            email.trim()       || null,
        website:          website.trim()     || null,
        country:          country.trim()     || null,
        province:         province.trim()    || null,
        city:             city.trim()        || null,
        district:         district.trim()    || null,
        village:          village.trim()     || null,
        postal_code:      postalCode.trim()  || null,
        address:          address.trim()     || null,
        latitude:         latitude.trim()  ? parseFloat(latitude)  : null,
        longitude:        longitude.trim() ? parseFloat(longitude) : null,
        timezone:         'Asia/Jakarta',
        currency:         'IDR',
        language:         'id',
      });

      if (!result.ok) {
        const messages = result.errors.map((e) => e.message).join(' · ');
        // Surface slug conflict specifically
        const hasSlugError = result.errors.some((e) => e.field === 'workspace_slug');
        if (hasSlugError) {
          setGlobalError('Workspace dengan nama yang sangat mirip sudah ada. Coba nama yang sedikit berbeda.');
        } else {
          setGlobalError(messages || 'Gagal membuat workspace. Periksa isian Anda dan coba lagi.');
        }
        return;
      }

      // DB-001B-3: subscription seeding moved to Supabase — no local seed needed.

      // FLOW-001F4: inject the new workspace directly into the shared
      // WorkspaceProvider state.  The create_workspace_with_owner RPC returns
      // the full workspace row, so no Supabase SELECT is required here.
      // This guarantees WorkspaceSelect and ProtectedRoute see the workspace
      // immediately, regardless of any RLS timing on the SELECT policy.
      //
      // Note: register_workspace_owner RPC removed — the atomic
      // create_workspace_with_owner RPC already inserts the owner member row.
      addWorkspaceLocally(result.data);
      setActiveWorkspaceUuid(result.data.workspace_uuid);

      // Navigate to WorkspaceSelect — it will auto-navigate to /dashboard
      // when it sees a single active workspace already in context.
      navigate('/workspace/select', { replace: true });

    } catch {
      setGlobalError('Terjadi kesalahan tidak terduga. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  // ── Shared input style ────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid var(--color-border)', fontSize: 14,
    background: 'var(--color-bg)', color: 'var(--color-text)',
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
  };
  const inpErr = (field: string): React.CSSProperties =>
    errors[field] ? { ...inp, borderColor: '#dc2626' } : inp;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '28px 16px 48px',
      background: 'var(--color-bg)', gap: 0,
    }}>

      {/* Brand */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 24 }}>
        <AuthLogo size={56} />
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.3px' }}>
          TernakHub
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)', textAlign: 'center' }}>
          Platform Manajemen Peternakan Modern
        </p>
      </div>

      {/* Panel */}
      <div style={{
        width: '100%', maxWidth: 540,
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
      }}>

        {/* Panel header */}
        <div style={{
          padding: '22px 24px 18px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-primary-light)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}>🏗️</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
            Buat Workspace Anda
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Atur workspace Anda untuk mulai mengelola peternakan, toko, atau layanan.
          </p>
        </div>

        {/* Form body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Global error */}
          {globalError && (
            <div style={{
              background: '#fef2f2', border: '1.5px solid #fca5a5',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#991b1b', lineHeight: 1.5,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span style={{ flexShrink: 0 }}>⚠</span>
              <span>{globalError}</span>
            </div>
          )}

          {/* ── Workspace Type ── */}
          <Field label="Tipe Workspace" required error={errors.wsType}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {WORKSPACE_TYPES.map((t) => {
                const meta    = TYPE_META[t];
                const selected = wsType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setWsType(t); setErrors((prev) => ({ ...prev, wsType: '' })); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      gap: 4, padding: '12px 14px',
                      background: selected ? 'var(--color-primary-light)' : 'var(--color-bg)',
                      border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{meta.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: selected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      {WORKSPACE_TYPE_LABEL[t]}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.3 }}>
                      {meta.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* ── Workspace Name ── */}
          <Field label="Nama Workspace" required error={errors.name}>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: '' })); }}
              placeholder="e.g. Berkah Farm Garut"
              style={inpErr('name')}
              disabled={saving}
            />
          </Field>

          {/* ── Slug preview ── */}
          {slug && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8, fontSize: 12,
            }}>
              <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}>🔗 Slug:</span>
              <code style={{ flex: 1, color: 'var(--color-primary)', fontWeight: 600, wordBreak: 'break-all' }}>
                {slug}
              </code>
              <span style={{ color: 'var(--color-muted)', fontSize: 10, flexShrink: 0 }}>otomatis</span>
            </div>
          )}

          {/* ── Optional: Basic ── */}
          <SectionHeading>Opsional — Informasi Dasar</SectionHeading>

          <Field label="URL Logo" hint="Tautan ke gambar logo workspace Anda">
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              style={inp}
              disabled={saving}
            />
          </Field>

          <Field label="Deskripsi">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Deskripsi singkat workspace Anda…"
              style={{ ...inp, resize: 'vertical' }}
              disabled={saving}
            />
          </Field>

          {/* ── Optional: Contact ── */}
          <SectionHeading>Opsional — Kontak</SectionHeading>

          <Field label="Nomor Telepon" error={errors.phone}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: '' })); }}
              placeholder="+62 812-3456-7890"
              style={inpErr('phone')}
              disabled={saving}
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: '' })); }}
              placeholder="workspace@example.com"
              style={inpErr('email')}
              disabled={saving}
            />
          </Field>

          <Field label="Website" error={errors.website}>
            <input
              type="url"
              value={website}
              onChange={(e) => { setWebsite(e.target.value); setErrors((prev) => ({ ...prev, website: '' })); }}
              placeholder="https://example.com"
              style={inpErr('website')}
              disabled={saving}
            />
          </Field>

          {/* ── Location (Province / City / District / Village required) ── */}
          <SectionHeading>Lokasi (Wajib Diisi)</SectionHeading>

          <Field label="Negara">
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
              placeholder="Indonesia" style={inp} disabled={saving} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Provinsi" required error={errors.province}>
              <input type="text" value={province}
                onChange={(e) => { setProvince(e.target.value); setErrors((prev) => ({ ...prev, province: '' })); }}
                placeholder="Jawa Barat" style={inpErr('province')} disabled={saving} />
            </Field>
            <Field label="Kota / Kabupaten" required error={errors.city}>
              <input type="text" value={city}
                onChange={(e) => { setCity(e.target.value); setErrors((prev) => ({ ...prev, city: '' })); }}
                placeholder="Garut" style={inpErr('city')} disabled={saving} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Kecamatan" required error={errors.district}>
              <input type="text" value={district}
                onChange={(e) => { setDistrict(e.target.value); setErrors((prev) => ({ ...prev, district: '' })); }}
                placeholder="Samarang" style={inpErr('district')} disabled={saving} />
            </Field>
            <Field label="Desa / Kelurahan" required error={errors.village}>
              <input type="text" value={village}
                onChange={(e) => { setVillage(e.target.value); setErrors((prev) => ({ ...prev, village: '' })); }}
                placeholder="Sukamukti" style={inpErr('village')} disabled={saving} />
            </Field>
          </div>

          <Field label="Kode Pos">
            <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
              placeholder="44151" style={inp} disabled={saving} maxLength={10} />
          </Field>

          <Field label="Alamat">
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Alamat lengkap…"
              style={{ ...inp, resize: 'vertical' }}
              disabled={saving}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Lintang" error={errors.latitude} hint="-90 hingga 90">
              <input type="number" value={latitude} step="any"
                onChange={(e) => { setLatitude(e.target.value); setErrors((prev) => ({ ...prev, latitude: '' })); }}
                placeholder="-7.2158" style={inpErr('latitude')} disabled={saving} />
            </Field>
            <Field label="Bujur" error={errors.longitude} hint="-180 hingga 180">
              <input type="number" value={longitude} step="any"
                onChange={(e) => { setLongitude(e.target.value); setErrors((prev) => ({ ...prev, longitude: '' })); }}
                placeholder="107.9065" style={inpErr('longitude')} disabled={saving} />
            </Field>
          </div>

          {/* ── Submit ── */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{
              width: '100%', height: 50, marginTop: 4,
              background: saving ? 'var(--color-border)' : 'var(--color-primary)',
              color: '#fff', border: 'none',
              borderRadius: 'var(--radius-md, 12px)',
              fontSize: 15, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
          >
            {saving ? (
              <>
                <span style={{
                  display: 'inline-block', width: 18, height: 18,
                  border: '2.5px solid rgba(255,255,255,0.35)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'ws-spin 0.7s linear infinite',
                }} />
                Membuat Workspace…
              </>
            ) : (
              '🏗️ Buat Workspace'
            )}
          </button>

        </div>
      </div>

      {/* Info note */}
      <p style={{ marginTop: 20, fontSize: 13, color: 'var(--color-muted)', textAlign: 'center', maxWidth: 420, lineHeight: 1.5 }}>
        Anda dapat memperbarui detail workspace dan menambahkan anggota tim setelah pembuatan.
      </p>

      <p style={{ marginTop: 16, fontSize: 11, color: 'var(--color-border)', textAlign: 'center' }}>
        © {new Date().getFullYear()} TernakHub. Hak cipta dilindungi.
      </p>

      <style>{`@keyframes ws-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
