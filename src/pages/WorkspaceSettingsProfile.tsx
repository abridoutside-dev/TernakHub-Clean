// ─── Workspace Settings — Profile (WS-003) ───────────────────────────────────
//
// Allows the workspace owner to update workspace profile information.
//
// Uses WS-001 foundation:
//   - WorkspaceContext (useWorkspace) for active workspace state + saveWorkspace
//   - WorkspaceService validation (called internally by saveWorkspace)
//
// Rules:
//   - Only modified fields are sent to the service (delta update).
//   - workspace_uuid, workspace_type, workspace_slug, owner_user_uuid are read-only.
//   - Slug remains immutable — never exposed as an editable field.
//   - No archive flow, member management, or workspace switching here.

import { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useWorkspacePermission } from '../hooks/useWorkspacePermission';
import {
  WORKSPACE_TYPE_LABEL,
  WORKSPACE_STATUS_LABEL,
  WORKSPACE_PLAN_LABEL,
} from '../types/workspace';
import type { WorkspaceUpdateInput } from '../types/workspace';

// ─── Static option lists ──────────────────────────────────────────────────────

const TIMEZONE_OPTIONS = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'UTC',
];

const LANGUAGE_OPTIONS = [
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'en', label: 'English' },
];

const CURRENCY_OPTIONS = [
  { value: 'IDR', label: 'IDR — Rupiah Indonesia' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'MYR', label: 'MYR — Malaysian Ringgit' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
];

// ─── Validation helpers ───────────────────────────────────────────────────────

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidUrl(v: string): boolean {
  try {
    const u = new URL(v.startsWith('http') ? v : `https://${v}`);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function isValidPhone(v: string): boolean {
  return /^[+\d][\d\s\-().]{5,19}$/.test(v.trim());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
        {title}
      </div>
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 12px)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {children}
      </div>
    </div>
  );
}

function ReadOnlyRow({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ width: 130, flexShrink: 0, fontSize: 13, color: 'var(--color-muted)', paddingTop: 1 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--color-muted)', fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-all', lineHeight: 1.4 }}>
        {value || '—'}
      </div>
      <span style={{ fontSize: 10, color: 'var(--color-border)', alignSelf: 'center', flexShrink: 0 }}>🔒</span>
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, required, error, children }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 1 }}>{error}</span>}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastKind = 'success' | 'error';

interface Toast { kind: ToastKind; message: string }

function ToastBanner({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const bg     = toast.kind === 'success' ? '#f0fdf4' : '#fef2f2';
  const border = toast.kind === 'success' ? '#86efac' : '#fca5a5';
  const color  = toast.kind === 'success' ? '#166534' : '#991b1b';
  const icon   = toast.kind === 'success' ? '✓' : '⚠';

  return (
    <div style={{
      position: 'fixed', top: 'calc(var(--top-app-bar-height) + 8px)', left: 0, right: 0, zIndex: 200,
      display: 'flex', justifyContent: 'center', padding: '0 16px',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: bg, border: `1.5px solid ${border}`, borderRadius: 10,
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: 'var(--shadow-md)', maxWidth: 480, width: '100%',
        pointerEvents: 'all',
      }}>
        <span style={{ fontSize: 16, color, flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color }}>{toast.message}</span>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: 16, padding: 0, flexShrink: 0 }}>✕</button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkspaceSettingsProfile() {
  const { activeWorkspace, saveWorkspace, isLoading: wsLoading } = useWorkspace();
  const { can } = useWorkspacePermission();
  const canUpdate = can('workspaceSettings', 'update');

  // ── Form state ─────────────────────────────────────────────────────────────
  const [logoUrl,    setLogoUrl]    = useState('');
  const [name,       setName]       = useState('');
  const [description,setDescription]= useState('');
  const [phone,      setPhone]      = useState('');
  const [email,      setEmail]      = useState('');
  const [website,    setWebsite]    = useState('');
  const [country,    setCountry]    = useState('');
  const [province,   setProvince]   = useState('');
  const [city,       setCity]       = useState('');
  const [district,   setDistrict]   = useState('');
  const [village,    setVillage]    = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address,    setAddress]    = useState('');
  const [latitude,   setLatitude]   = useState('');
  const [longitude,  setLongitude]  = useState('');
  const [timezone,   setTimezone]   = useState('');
  const [language,   setLanguage]   = useState('');
  const [currency,   setCurrency]   = useState('');

  // ── UI state ───────────────────────────────────────────────────────────────
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Seed form from active workspace ───────────────────────────────────────
  useEffect(() => {
    if (!activeWorkspace) return;
    const w = activeWorkspace;
    setLogoUrl(w.logo_url    ?? '');
    setName(w.workspace_name);
    setDescription(w.description ?? '');
    setPhone(w.phone         ?? '');
    setEmail(w.email         ?? '');
    setWebsite(w.website     ?? '');
    setCountry(w.country     ?? '');
    setProvince(w.province   ?? '');
    setCity(w.city           ?? '');
    setDistrict(w.district   ?? '');
    setVillage(w.village     ?? '');
    setPostalCode(w.postal_code ?? '');
    setAddress(w.address     ?? '');
    setLatitude(w.latitude   != null ? String(w.latitude)  : '');
    setLongitude(w.longitude != null ? String(w.longitude) : '');
    setTimezone(w.timezone   ?? '');
    setLanguage(w.language   ?? '');
    setCurrency(w.currency   ?? '');
  }, [activeWorkspace?.workspace_uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toast helpers ──────────────────────────────────────────────────────────
  function showToast(kind: ToastKind, message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, message });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) {
      e.name = 'Nama workspace wajib diisi.';
    } else if (name.trim().length < 2) {
      e.name = 'Nama minimal 2 karakter.';
    } else if (name.trim().length > 120) {
      e.name = 'Nama tidak boleh melebihi 120 karakter.';
    }
    if (!province.trim()) {
      e.province = 'Provinsi wajib diisi.';
    } else if (province.trim().length < 2) {
      e.province = 'Nama provinsi minimal 2 karakter.';
    }
    if (!city.trim()) {
      e.city = 'Kota / Kabupaten wajib diisi.';
    } else if (city.trim().length < 2) {
      e.city = 'Nama kota minimal 2 karakter.';
    }
    if (!district.trim()) {
      e.district = 'Kecamatan wajib diisi.';
    } else if (district.trim().length < 2) {
      e.district = 'Nama kecamatan minimal 2 karakter.';
    }
    if (!village.trim()) {
      e.village = 'Desa/Kelurahan wajib diisi.';
    } else if (village.trim().length < 2) {
      e.village = 'Nama desa minimal 2 karakter.';
    }
    if (email.trim() && !isValidEmail(email.trim())) {
      e.email = 'Masukkan alamat email yang valid.';
    }
    if (website.trim() && !isValidUrl(website.trim())) {
      e.website = 'Masukkan URL yang valid (mis. https://example.com).';
    }
    if (phone.trim() && !isValidPhone(phone.trim())) {
      e.phone = 'Masukkan nomor telepon yang valid.';
    }
    const lat = parseFloat(latitude);
    if (latitude.trim() && (isNaN(lat) || lat < -90 || lat > 90)) {
      e.latitude = 'Lintang harus antara -90 dan 90.';
    }
    const lng = parseFloat(longitude);
    if (longitude.trim() && (isNaN(lng) || lng < -180 || lng > 180)) {
      e.longitude = 'Bujur harus antara -180 dan 180.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!activeWorkspace) return;
    if (!canUpdate) {
      showToast('error', 'Anda tidak memiliki izin untuk memperbarui workspace.');
      return;
    }
    if (!validate()) {
      showToast('error', 'Perbaiki kesalahan sebelum menyimpan.');
      return;
    }

    setSaving(true);
    try {
      const w = activeWorkspace;

      // Build delta — only include fields that changed from the workspace record.
      const patch: WorkspaceUpdateInput = {};
      const trimOr  = (v: string) => v.trim() || null;
      const numOrNull = (v: string) => v.trim() ? parseFloat(v) : null;

      if ((logoUrl.trim() || null) !== w.logo_url)               patch.logo_url    = logoUrl.trim() || null;
      if (name.trim() !== w.workspace_name)                       patch.workspace_name = name.trim();
      if (trimOr(description) !== w.description)            patch.description = description.trim() || null;
      if (trimOr(phone) !== w.phone)                        patch.phone       = phone.trim() || null;
      if (trimOr(email) !== w.email)                        patch.email       = email.trim() || null;
      if (trimOr(website) !== w.website)                    patch.website     = website.trim() || null;
      if (trimOr(country) !== w.country)                    patch.country     = country.trim() || null;
      if (trimOr(province) !== w.province)                  patch.province    = province.trim() || null;
      if (trimOr(city) !== w.city)                          patch.city        = city.trim() || null;
      if (trimOr(district) !== w.district)                  patch.district    = district.trim() || null;
      if (trimOr(village) !== w.village)                    patch.village     = village.trim() || null;
      if (trimOr(postalCode) !== w.postal_code)             patch.postal_code = postalCode.trim() || null;
      if (trimOr(address) !== w.address)                    patch.address     = address.trim() || null;
      if (numOrNull(latitude) !== w.latitude)                     patch.latitude    = numOrNull(latitude);
      if (numOrNull(longitude) !== w.longitude)                   patch.longitude   = numOrNull(longitude);
      if (trimOr(timezone) !== w.timezone)                  patch.timezone    = timezone || null;
      if (trimOr(language) !== w.language)                  patch.language    = language || null;
      if (trimOr(currency) !== w.currency)                  patch.currency    = currency || null;

      if (Object.keys(patch).length === 0) {
        showToast('success', 'No changes to save.');
        setSaving(false);
        return;
      }

      const result = await saveWorkspace(w.workspace_uuid, patch);
      if (result.ok) {
        showToast('success', 'Workspace profile updated successfully.');
      } else {
        const msg = result.errors.map((e) => e.message).join(' · ');
        showToast('error', msg || 'Failed to save. Please try again.');
      }
    } catch {
      showToast('error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Shared input style ─────────────────────────────────────────────────────
  const field: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid var(--color-border)', fontSize: 14,
    background: 'var(--color-bg)', color: 'var(--color-text)',
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
  };
  const fieldErr: React.CSSProperties = { ...field, borderColor: '#dc2626' };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (wsLoading) {
    return (
      <div style={{ paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--color-muted)', fontSize: 14 }}>
        Loading workspace…
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '80px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: 48 }}>🏚️</span>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>No workspace found</div>
        <div style={{ fontSize: 14, color: 'var(--color-muted)' }}>Select a workspace to manage its profile.</div>
      </div>
    );
  }

  const ws = activeWorkspace;

  return (
    <div style={{ paddingTop: 16, paddingBottom: 56, paddingLeft: 16, paddingRight: 16, minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', gap: 20, boxSizing: 'border-box', maxWidth: 600, margin: '0 auto' }}>

      {toast && <ToastBanner toast={toast} onDismiss={() => setToast(null)} />}

      {/* ── Read-only workspace identity ────────────────────────────────── */}
      <SectionCard title="Identitas Workspace">
        <ReadOnlyRow label="UUID"         value={ws.workspace_uuid} mono />
        <ReadOnlyRow label="Tipe"         value={WORKSPACE_TYPE_LABEL[ws.workspace_type]} />
        <ReadOnlyRow label="Slug"         value={ws.workspace_slug} mono />
        <ReadOnlyRow label="Status"       value={WORKSPACE_STATUS_LABEL[ws.workspace_status]} />
        <ReadOnlyRow label="Paket"         value={WORKSPACE_PLAN_LABEL[ws.workspace_plan]} />
        <ReadOnlyRow label="Dibuat"      value={new Date(ws.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px' }}>
          <div style={{ width: 130, flexShrink: 0, fontSize: 13, color: 'var(--color-muted)', paddingTop: 1 }}>Diperbarui</div>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--color-muted)', lineHeight: 1.4 }}>
            {new Date(ws.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <span style={{ fontSize: 10, color: 'var(--color-border)', alignSelf: 'center', flexShrink: 0 }}>🔒</span>
        </div>
      </SectionCard>

      {/* ── Basic info ──────────────────────────────────────────────────── */}
      <SectionCard title="Informasi Dasar">
        <div style={{ padding: '16px 16px 4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="URL Logo" error={errors.logoUrl}>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              style={errors.logoUrl ? fieldErr : field}
            />
          </Field>
          <Field label="Nama Workspace" required error={errors.name}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mis. Peternakan Berkah"
              style={errors.name ? fieldErr : field}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Deskripsi singkat workspace ini…"
              style={{ ...field, resize: 'vertical' }}
            />
          </Field>
        </div>
        <div style={{ height: 12 }} />
      </SectionCard>

      {/* ── Contact ─────────────────────────────────────────────────────── */}
      <SectionCard title="Kontak">
        <div style={{ padding: '16px 16px 4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Telepon" error={errors.phone}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+62 812-3456-7890"
              style={errors.phone ? fieldErr : field}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="workspace@example.com"
              style={errors.email ? fieldErr : field}
            />
          </Field>
          <Field label="Situs Web" error={errors.website}>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              style={errors.website ? fieldErr : field}
            />
          </Field>
        </div>
        <div style={{ height: 12 }} />
      </SectionCard>

      {/* ── Location ────────────────────────────────────────────────────── */}
      <SectionCard title="Lokasi">
        <div style={{ padding: '16px 16px 4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Negara">
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Indonesia" style={field} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Provinsi" required error={errors.province}>
              <input type="text" value={province}
                onChange={(e) => { setProvince(e.target.value); setErrors((prev) => ({ ...prev, province: '' })); }}
                placeholder="Jawa Barat" style={errors.province ? fieldErr : field} />
            </Field>
            <Field label="Kota / Kabupaten" required error={errors.city}>
              <input type="text" value={city}
                onChange={(e) => { setCity(e.target.value); setErrors((prev) => ({ ...prev, city: '' })); }}
                placeholder="Garut" style={errors.city ? fieldErr : field} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Kecamatan" required error={errors.district}>
              <input type="text" value={district}
                onChange={(e) => { setDistrict(e.target.value); setErrors((prev) => ({ ...prev, district: '' })); }}
                placeholder="Samarang" style={errors.district ? fieldErr : field} />
            </Field>
            <Field label="Desa/Kelurahan" required error={errors.village}>
              <input type="text" value={village}
                onChange={(e) => { setVillage(e.target.value); setErrors((prev) => ({ ...prev, village: '' })); }}
                placeholder="Sukamukti" style={errors.village ? fieldErr : field} />
            </Field>
          </div>
          <Field label="Kode Pos">
            <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="44151" style={field} maxLength={10} />
          </Field>
          <Field label="Alamat">
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Nama jalan dan nomor…"
              style={{ ...field, resize: 'vertical' }}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Lintang" error={errors.latitude}>
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="-7.2158"
                step="any"
                style={errors.latitude ? fieldErr : field}
              />
            </Field>
            <Field label="Bujur" error={errors.longitude}>
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="107.9065"
                step="any"
                style={errors.longitude ? fieldErr : field}
              />
            </Field>
          </div>
        </div>
        <div style={{ height: 12 }} />
      </SectionCard>

      {/* ── Regional ────────────────────────────────────────────────────── */}
      <SectionCard title="Pengaturan Regional">
        <div style={{ padding: '16px 16px 4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Zona Waktu">
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={field}>
              <option value="">— Pilih zona waktu —</option>
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </Field>
          <Field label="Bahasa">
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={field}>
              <option value="">— Pilih bahasa —</option>
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Mata Uang">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={field}>
              <option value="">— Pilih mata uang —</option>
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ height: 12 }} />
      </SectionCard>

      {/* ── Save button (only shown to users with update permission) ──── */}
      {canUpdate ? (
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', height: 50,
            background: saving ? 'var(--color-border)' : 'var(--color-primary)',
            color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md, 12px)',
            fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.15s',
          }}
        >
          {saving ? (
            <>
              <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Menyimpan…
            </>
          ) : (
            '💾 Simpan Perubahan'
          )}
        </button>
      ) : (
        <div style={{
          width: '100%', padding: '14px 16px', borderRadius: 12,
          background: '#f1f5f9', border: '1.5px solid var(--color-border)',
          textAlign: 'center', fontSize: 13, color: 'var(--color-muted)',
        }}>
          🔒 Hanya Owner dan Admin yang dapat menyimpan perubahan.
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
