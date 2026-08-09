// Admin User Profiles module — end-to-end profile management.
// Pattern: Page → Service → Repository → Edge Function (admin-users).

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  adminUserService,
  type UserProfileDetail,
  type UserProfileListItem,
  type UserProfileListParams,
  type UserStatus,
} from '../../../services/adminUserService';

const PAGE_SIZE = 20;
const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; bg: string; dot: string }> = {
  Active: { label: 'Aktif', color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  Suspended: { label: 'Suspended', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  Pending: { label: 'Menunggu', color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
};

function nameOf(profile: { full_name: string | null; display_name: string | null } | null | undefined): string {
  return profile?.full_name ?? profile?.display_name ?? '';
}

function dateOf(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function dateTimeOf(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function Avatar({ profile, email, size = 38 }: { profile: { full_name: string | null; display_name: string | null; avatar_url: string | null } | null | undefined; email?: string | null; size?: number }) {
  const label = nameOf(profile) || email || 'User';
  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#0ea5e9'];
  const color = colors[(label.charCodeAt(0) || 85) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, flexShrink: 0, overflow: 'hidden',
    }}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        label.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.Active;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px',
      borderRadius: 20, background: config.bg, color: config.color,
      fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.dot }} />
      {config.label}
    </span>
  );
}

function Button({
  children, onClick, disabled = false, danger = false, secondary = false,
}: {
  children: ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; secondary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 11px', borderRadius: 7, border: secondary ? '1px solid #e2e8f0' : 'none',
        background: danger ? '#fff1f2' : secondary ? '#fff' : '#2563eb',
        color: danger ? '#b91c1c' : secondary ? '#475569' : '#fff',
        fontSize: 12, fontWeight: 650, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Modal({ children, onClose, width = 520 }: { children: ReactNode; onClose: () => void; width?: number }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 700 }} />
      <div role="dialog" aria-modal="true" style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 701, background: '#fff', borderRadius: 14, width, maxWidth: 'calc(100vw - 28px)',
        maxHeight: 'calc(100vh - 40px)', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.24)',
      }}>
        {children}
      </div>
    </>
  );
}

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ padding: 11, background: '#f8fafc', borderRadius: 8 }}>
      <div style={{ fontSize: 10.5, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: '#334155', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

function ProfileDrawer({
  profile, onClose, onRefresh, onToast,
}: {
  profile: UserProfileDetail | null; onClose: () => void; onRefresh: () => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  if (!profile) {
    return <Modal onClose={onClose}><div style={{ padding: 24, color: '#b91c1c' }}>Profil tidak ditemukan.</div></Modal>;
  }

  const user = profile.user;
  const p = profile.profile;
  const title = nameOf(p) || user.email || 'User';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 600 }} />
      <aside role="dialog" aria-modal="true" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 601, width: 560,
        maxWidth: 'calc(100vw - 20px)', background: '#fff', overflowY: 'auto',
        boxShadow: '-12px 0 40px rgba(15,23,42,.16)',
      }}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Avatar profile={p} email={user.email} size={46} />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>{title}</h2>
            <div style={{ marginTop: 3, fontSize: 12.5, color: '#64748b' }}>{user.email || '—'}</div>
            <div style={{ marginTop: 8 }}><StatusBadge status={user.status} /></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" style={{ border: 0, background: '#f1f5f9', borderRadius: 7, width: 30, height: 30, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 22 }}>
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
            <FieldRow label="User ID" value={user.id} />
            <FieldRow label="Email" value={user.email || '—'} />
            <FieldRow label="Telepon Auth" value={user.phone || '—'} />
            <FieldRow label="Telepon Profile" value={p?.phone_number || '—'} />
            <FieldRow label="WhatsApp" value={p?.whatsapp_number || '—'} />
            <FieldRow label="Terdaftar" value={dateTimeOf(user.created_at)} />
            <FieldRow label="Login terakhir" value={dateTimeOf(user.last_sign_in_at)} />
            <FieldRow label="Email terverifikasi" value={user.email_confirmed_at ? dateTimeOf(user.email_confirmed_at) : 'Belum'} />
            <FieldRow label="Admin" value={user.is_admin ? 'Ya' : 'Tidak'} />
            <FieldRow label="MFA" value={user.mfa_enabled ? 'Aktif' : 'Nonaktif'} />
          </section>

          <h3 style={{ margin: '0 0 10px', fontSize: 13, color: '#334155' }}>Profil Lengkap</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
            <FieldRow label="Nama Lengkap" value={p?.full_name || '—'} />
            <FieldRow label="Nama Tampilan" value={p?.display_name || '—'} />
            <FieldRow label="Bio" value={p?.bio || '—'} />
            <FieldRow label="KTP Number" value={p?.ktp_number || '—'} />
            <FieldRow label="KTP Verified" value={p?.ktp_verified ? 'Ya' : 'Tidak'} />
            <FieldRow label="KTP Front" value={p?.ktp_front_url ? <a href={p.ktp_front_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Lihat</a> : '—'} />
            <FieldRow label="KTP Back" value={p?.ktp_back_url ? <a href={p.ktp_back_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Lihat</a> : '—'} />
            <FieldRow label="Avatar" value={p?.avatar_url ? <a href={p.avatar_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Lihat</a> : '—'} />
            <FieldRow label="Cover" value={p?.cover_url ? <a href={p.cover_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Lihat</a> : '—'} />
            <FieldRow label="Onboarding Selesai" value={p?.onboarding_completed ? 'Ya' : 'Tidak'} />
            <FieldRow label="Onboarding Step" value={String(p?.onboarding_step ?? 0)} />
            <FieldRow label="Notif Preferences" value={<pre style={{ fontSize: 11, margin: 0 }}>{JSON.stringify(p?.notification_preferences ?? {}, null, 2)}</pre>} />
            <FieldRow label="Security Preferences" value={<pre style={{ fontSize: 11, margin: 0 }}>{JSON.stringify(p?.security_preferences ?? {}, null, 2)}</pre>} />
            <FieldRow label="Dibuat" value={dateTimeOf(p?.created_at)} />
            <FieldRow label="Diperbarui" value={dateTimeOf(p?.updated_at)} />
          </div>

          <h3 style={{ margin: '0 0 10px', fontSize: 13, color: '#334155' }}>Aksi</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            <Button onClick={() => setEditOpen(true)} disabled={loading}>Edit Profile</Button>
          </div>
        </div>
      </aside>

      {editOpen && (
        <EditProfileModal
          profile={p}
          loading={loading}
          onClose={() => setEditOpen(false)}
          onSave={async data => {
            setLoading(true);
            try {
              const result = await adminUserService.updateProfile(user.id, data);
              if (!result.ok) throw new Error('Operasi tidak berhasil.');
              onToast('Profil berhasil diperbarui.', 'success');
              setEditOpen(false);
              onRefresh();
            } catch (cause) {
              onToast(cause instanceof Error ? cause.message : 'Gagal memperbarui profil.', 'error');
            } finally {
              if (mounted.current) setLoading(false);
            }
          }}
        />
      )}
    </>
  );
}

function EditProfileModal({
  profile, onSave, onClose, loading,
}: {
  profile: {
    full_name: string | null;
    display_name: string | null;
    phone_number: string | null;
    whatsapp_number: string | null;
    bio: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    ktp_number: string | null;
    ktp_verified: boolean;
    ktp_front_url: string | null;
    ktp_back_url: string | null;
    onboarding_completed: boolean;
    onboarding_step: number;
  } | null;
  onSave: (data: {
    full_name?: string | null;
    display_name?: string | null;
    phone_number?: string | null;
    whatsapp_number?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    cover_url?: string | null;
    ktp_number?: string | null;
    ktp_verified?: boolean;
    ktp_front_url?: string | null;
    ktp_back_url?: string | null;
    onboarding_completed?: boolean;
    onboarding_step?: number;
  }) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsapp_number ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [coverUrl, setCoverUrl] = useState(profile?.cover_url ?? '');
  const [ktpNumber, setKtpNumber] = useState(profile?.ktp_number ?? '');
  const [ktpVerified, setKtpVerified] = useState(profile?.ktp_verified ?? false);
  const [ktpFrontUrl, setKtpFrontUrl] = useState(profile?.ktp_front_url ?? '');
  const [ktpBackUrl, setKtpBackUrl] = useState(profile?.ktp_back_url ?? '');
  const [onboardingCompleted, setOnboardingCompleted] = useState(profile?.onboarding_completed ?? false);
  const [onboardingStep, setOnboardingStep] = useState(profile?.onboarding_step ?? 0);

  return (
    <Modal onClose={onClose} width={520}>
      <div style={{ padding: 22 }}>
        <h2 style={{ margin: '0 0 18px', fontSize: 17, color: '#0f172a' }}>Edit Profile</h2>
        <div style={{ display: 'grid', gap: 12, maxHeight: '60vh', overflowY: 'auto' }}>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 650 }}>
            Nama Lengkap
            <input value={fullName} onChange={e => setFullName(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
          </label>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 650 }}>
            Nama Tampilan
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
          </label>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 650 }}>
            Nomor Telepon
            <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
          </label>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 650 }}>
            Nomor WhatsApp
            <input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
          </label>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 650 }}>
            Bio
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, resize: 'vertical' }} />
          </label>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 650 }}>
            Avatar URL
            <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
          </label>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 650 }}>
            Cover URL
            <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
          </label>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 650 }}>
            Nomor KTP
            <input value={ktpNumber} onChange={e => setKtpNumber(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
            <input type="checkbox" checked={ktpVerified} onChange={e => setKtpVerified(e.target.checked)} />
            KTP Terverifikasi
          </label>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 650 }}>
            KTP Front URL
            <input value={ktpFrontUrl} onChange={e => setKtpFrontUrl(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
          </label>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 650 }}>
            KTP Back URL
            <input value={ktpBackUrl} onChange={e => setKtpBackUrl(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
            <input type="checkbox" checked={onboardingCompleted} onChange={e => setOnboardingCompleted(e.target.checked)} />
            Onboarding Selesai
          </label>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 650 }}>
            Onboarding Step
            <input type="number" min={0} value={onboardingStep} onChange={e => setOnboardingStep(Number(e.target.value))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <Button onClick={onClose} disabled={loading} secondary>Batal</Button>
          <Button onClick={() => onSave({
            full_name: fullName.trim() || null,
            display_name: displayName.trim() || null,
            phone_number: phoneNumber.trim() || null,
            whatsapp_number: whatsappNumber.trim() || null,
            bio: bio.trim() || null,
            avatar_url: avatarUrl.trim() || null,
            cover_url: coverUrl.trim() || null,
            ktp_number: ktpNumber.trim() || null,
            ktp_verified: ktpVerified,
            ktp_front_url: ktpFrontUrl.trim() || null,
            ktp_back_url: ktpBackUrl.trim() || null,
            onboarding_completed: onboardingCompleted,
            onboarding_step: onboardingStep,
          })} disabled={loading}>
            {loading ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', right: 24, bottom: 24, zIndex: 1000, maxWidth: 380, padding: '12px 15px',
      borderRadius: 9, background: type === 'success' ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
      color: type === 'success' ? '#166534' : '#b91c1c', fontSize: 13, boxShadow: '0 4px 18px rgba(0,0,0,.1)',
    }}>
      {message} <button type="button" onClick={onClose} style={{ marginLeft: 10, border: 0, background: 'transparent', cursor: 'pointer' }}>✕</button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 11, padding: '15px 17px' }}>
    <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 9 }}>{label}</div>
    <div style={{ fontSize: 25, fontWeight: 800, color: '#0f172a' }}>{value}</div>
  </div>;
}

export default function AdminUserProfilesModule() {
  const [profiles, setProfiles] = useState<UserProfileListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const mounted = useRef(true);

  const loadProfiles = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await adminUserService.listProfiles({ page, limit: PAGE_SIZE, search });
      if (!mounted.current) return;
      setProfiles(result.profiles); setTotal(result.total); setPages(result.pages);
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Daftar profil tidak dapat dimuat.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [page, search]);

  const loadDetail = useCallback(async (userId: string) => {
    try {
      const result = await adminUserService.getProfile(userId);
      if (mounted.current) setSelectedProfile(result);
    } catch (cause) {
      if (mounted.current) setToast({ message: cause instanceof Error ? cause.message : 'Detail profil tidak dapat dimuat.', type: 'error' });
    }
  }, []);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const applySearch = () => { setSearch(searchInput.trim()); setPage(1); };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Admin › User & Workspace › <span style={{ color: '#2563eb' }}>User Profiles</span></div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>User Profiles</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>Kelola profil pengguna melalui Supabase Edge Function.</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 10, background: '#fff', border: '1px solid #f1f5f9', borderRadius: 11, padding: 15, marginBottom: 18 }}>
          <label style={{ flex: '1 1 260px', fontSize: 11.5, color: '#64748b', fontWeight: 650 }}>Cari nama, email, telepon, atau ID
            <input value={searchInput} onChange={event => setSearchInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') applySearch(); }} placeholder="Cari profil…" style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
          </label>
          <Button onClick={applySearch}>Cari</Button>
        </div>

        {error && <div style={{ padding: 12, marginBottom: 15, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>{error}</div>}
        <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 11, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: 14, fontWeight: 700 }}>{total.toLocaleString('id-ID')} Profil</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>User</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Telepon</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>KTP</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Onboarding</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Aksi</th>
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={7} style={{ padding: 35, textAlign: 'center', color: '#94a3b8' }}>Memuat data…</td></tr>
                  : profiles.length === 0 ? <tr><td colSpan={7} style={{ padding: 35, textAlign: 'center', color: '#94a3b8' }}>Tidak ada profil</td></tr>
                    : profiles.map(item => (
                      <tr key={item.user_id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '11px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar profile={item.profile} email={item.email} /><div><div style={{ fontWeight: 650, color: '#0f172a' }}>{nameOf(item.profile) || '—'}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{item.user_id.slice(0, 8)}…</div></div></div></td>
                        <td style={{ padding: '11px 14px', color: '#475569' }}>{item.email || '—'}</td>
                        <td style={{ padding: '11px 14px', color: '#475569' }}>{item.profile?.phone_number || item.phone || '—'}</td>
                        <td style={{ padding: '11px 14px', color: '#475569' }}>{item.profile?.ktp_verified ? '✅ Verified' : '❌ Unverified'}</td>
                        <td style={{ padding: '11px 14px', color: '#475569' }}>{item.profile?.onboarding_completed ? 'Selesai' : `Step ${item.profile?.onboarding_step ?? 0}`}</td>
                        <td style={{ padding: '11px 14px' }}><StatusBadge status={item.status} /></td>
                        <td style={{ padding: '11px 14px' }}>
                          <Button onClick={() => { setSelectedId(item.user_id); void loadDetail(item.user_id); }} secondary>Detail</Button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#64748b' }}>
            <span>{total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} dari {total}</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Button onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1 || loading} secondary>‹ Sebelumnya</Button>
              <span>{page} / {pages}</span>
              <Button onClick={() => setPage(value => Math.min(pages, value + 1))} disabled={page >= pages || loading} secondary>Berikutnya ›</Button>
            </div>
          </div>
        </div>
      </div>
      {selectedId && selectedProfile && (
        <ProfileDrawer
          profile={selectedProfile}
          onClose={() => { setSelectedId(null); setSelectedProfile(null); }}
          onRefresh={() => void loadProfiles()}
          onToast={(message, type) => setToast({ message, type })}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
