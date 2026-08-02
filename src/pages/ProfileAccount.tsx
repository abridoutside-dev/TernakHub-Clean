// ─── Profile Account Page (PROFILE-002) ──────────────────────────────────────
// Menampilkan dan mengelola identitas pengguna.
// Email = read-only (mengikuti aturan sistem).
// Mengikuti docs/architecture/PROFILE_MODULE_CONSTITUTION.md

import { useState } from 'react';
import { formatTanggalPendek } from '../utils/profileFormatDate';
import {
  getUserProfile,
  updateUserProfile,
  MEMBERSHIP_CONFIG,
  STATUS_AKUN_CONFIG,
  type UserProfile,
} from '../data/profileData';

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_OPTIONS = [
  '👨‍🌾','👩‍🌾','🧑‍🌾','👨‍💼','👩‍💼','👨‍⚕️','👩‍⚕️',
  '🧑‍💼','👨‍🔧','👩‍🔧','🧑‍🔬','👨','👩','🧑',
  '🐄','🐑','🐐','🐔','🐖','🌾','🏡',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '13px 16px',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div style={{ width: 120, flexShrink: 0, fontSize: 13, color: 'var(--color-muted)', paddingTop: 1 }}>
        {label}
      </div>
      <div
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--color-text)',
          fontFamily: mono ? 'monospace' : undefined,
          wordBreak: 'break-all',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--color-muted)',
          letterSpacing: 0.5,
          marginBottom: 8,
          paddingLeft: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md, 12px)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Avatar Picker Sheet ──────────────────────────────────────────────────────

function AvatarPickerSheet({
  current,
  onSelect,
  onClose,
}: {
  current: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 400 }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--color-surface)',
          borderRadius: '20px 20px 0 0',
          zIndex: 401,
          padding: '0 0 env(safe-area-inset-bottom, 16px)',
          maxHeight: '60vh',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px 14px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Pilih Foto Profil</span>
          <button
            onClick={onClose}
            style={{
              background: 'var(--color-bg)',
              border: 'none',
              borderRadius: '50%',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              color: 'var(--color-muted)',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
            gap: 12,
            padding: 20,
          }}
        >
          {AVATAR_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onSelect(emoji); onClose(); }}
              style={{
                fontSize: 32,
                background: emoji === current ? 'var(--color-primary-light)' : 'var(--color-bg)',
                border: `2px solid ${emoji === current ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 12,
                padding: '8px 4px',
                cursor: 'pointer',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Edit Account Sheet ───────────────────────────────────────────────────────

function EditAccountSheet({
  profile,
  onSave,
  onClose,
}: {
  profile: UserProfile;
  onSave: (patch: Partial<Pick<UserProfile, 'foto' | 'nama' | 'username' | 'nomorHP'>>) => void;
  onClose: () => void;
}) {
  const [foto, setFoto]       = useState(profile.foto);
  const [nama, setNama]       = useState(profile.nama);
  const [username, setUsername] = useState(profile.username);
  const [nomorHP, setNomorHP]   = useState(profile.nomorHP);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!nama.trim())     e.nama     = 'Nama tidak boleh kosong';
    if (!username.trim()) e.username = 'Username tidak boleh kosong';
    if (!nomorHP.trim())  e.nomorHP  = 'Nomor HP tidak boleh kosong';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({ foto, nama: nama.trim(), username: username.trim(), nomorHP: nomorHP.trim() });
    onClose();
  }

  const fieldStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1.5px solid var(--color-border)',
    fontSize: 14,
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    boxSizing: 'border-box' as const,
    outline: 'none',
  };

  return (
    <>
      {avatarOpen && (
        <AvatarPickerSheet
          current={foto}
          onSelect={setFoto}
          onClose={() => setAvatarOpen(false)}
        />
      )}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 400 }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--color-surface)',
          borderRadius: '20px 20px 0 0',
          zIndex: 401,
          maxHeight: '90vh',
          overflow: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 20px 14px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Edit Akun</span>
          <button
            onClick={onClose}
            style={{
              background: 'var(--color-bg)',
              border: 'none',
              borderRadius: '50%',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              color: 'var(--color-muted)',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Foto */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'var(--color-primary-light)',
                border: '3px solid var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
              }}
            >
              {foto}
            </div>
            <button
              onClick={() => setAvatarOpen(true)}
              style={{
                background: 'none',
                border: '1.5px solid var(--color-primary)',
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-primary)',
                cursor: 'pointer',
              }}
            >
              Ganti Foto
            </button>
          </div>

          {/* Nama */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Nama Lengkap</label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama lengkap"
              style={{ ...fieldStyle, borderColor: errors.nama ? '#dc2626' : 'var(--color-border)' }}
            />
            {errors.nama && <span style={{ fontSize: 11, color: '#dc2626' }}>{errors.nama}</span>}
          </div>

          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              style={{ ...fieldStyle, borderColor: errors.username ? '#dc2626' : 'var(--color-border)' }}
            />
            {errors.username && <span style={{ fontSize: 11, color: '#dc2626' }}>{errors.username}</span>}
          </div>

          {/* Nomor HP */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Nomor HP</label>
            <input
              value={nomorHP}
              onChange={(e) => setNomorHP(e.target.value)}
              placeholder="+62 ..."
              type="tel"
              style={{ ...fieldStyle, borderColor: errors.nomorHP ? '#dc2626' : 'var(--color-border)' }}
            />
            {errors.nomorHP && <span style={{ fontSize: 11, color: '#dc2626' }}>{errors.nomorHP}</span>}
          </div>

          {/* Email — read only */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-muted)' }}>Email</label>
            <input
              value={profile.email}
              disabled
              style={{
                ...fieldStyle,
                background: 'var(--color-border)',
                color: 'var(--color-muted)',
                cursor: 'not-allowed',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              Perubahan email memerlukan konfirmasi keamanan tambahan.
            </span>
          </div>
        </div>

        {/* Action */}
        <div style={{ padding: '8px 20px 16px' }}>
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '13px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfileAccount() {
  const [tick, setTick]       = useState(0);
  const [editOpen, setEditOpen] = useState(false);

  const profile = getUserProfile();
  const membershipCfg  = MEMBERSHIP_CONFIG[profile.membership];
  const statusCfg      = STATUS_AKUN_CONFIG[profile.statusAkun];

  function handleSave(patch: Partial<Pick<UserProfile, 'foto' | 'nama' | 'username' | 'nomorHP'>>) {
    updateUserProfile(patch);
    setTick((t) => t + 1);
  }

  // suppress lint warning for tick

  return (
    <div
      style={{
        paddingTop: 16,
        paddingBottom: 40,
        paddingLeft: 16,
        paddingRight: 16,
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxSizing: 'border-box',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      {/* Avatar + Edit button */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '28px 20px 20px',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'var(--color-primary-light)',
            border: '3px solid var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 46,
          }}
        >
          {profile.foto}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>{profile.nama}</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 2 }}>{profile.username}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span
            style={{
              padding: '2px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              color: membershipCfg.color,
              background: membershipCfg.bg,
              border: `1px solid ${membershipCfg.border}`,
            }}
          >
            {membershipCfg.label}
          </span>
          {profile.statusVerifikasi === 'Terverifikasi' && (
            <span
              style={{
                padding: '2px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-primary)',
                background: 'var(--color-primary-light)',
                border: '1px solid var(--color-primary)',
              }}
            >
              ✓ Terverifikasi
            </span>
          )}
        </div>
        <button
          onClick={() => setEditOpen(true)}
          style={{
            padding: '8px 28px',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          Edit Akun
        </button>
      </div>

      {/* Info Dasar */}
      <SectionCard title="INFORMASI DASAR">
        <InfoRow label="Nama Lengkap" value={profile.nama} />
        <InfoRow label="Username"     value={profile.username} />
        <InfoRow label="Email"        value={profile.email} />
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 120, flexShrink: 0, fontSize: 13, color: 'var(--color-muted)', paddingTop: 1 }}>
              Nomor HP
            </div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
              {profile.nomorHP}
            </div>
          </div>
        </div>
        <div style={{ padding: '13px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 120, flexShrink: 0, fontSize: 13, color: 'var(--color-muted)', paddingTop: 1 }}>
              Status Verifikasi
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: profile.statusVerifikasi === 'Terverifikasi' ? 'var(--color-primary)' : '#6b7280',
                }}
              >
                {profile.statusVerifikasi === 'Terverifikasi' ? '✓' : '○'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                {profile.statusVerifikasi}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Status Akun */}
      <SectionCard title="STATUS AKUN">
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 120, flexShrink: 0, fontSize: 13, color: 'var(--color-muted)', paddingTop: 1 }}>
              Membership
            </div>
            <span
              style={{
                padding: '2px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                color: membershipCfg.color,
                background: membershipCfg.bg,
                border: `1px solid ${membershipCfg.border}`,
              }}
            >
              {membershipCfg.label}
            </span>
          </div>
        </div>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 120, flexShrink: 0, fontSize: 13, color: 'var(--color-muted)', paddingTop: 1 }}>
              Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>{statusCfg.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: statusCfg.color }}>{profile.statusAkun}</span>
            </div>
          </div>
        </div>
        <InfoRow label="Bergabung" value={formatTanggalPendek(profile.bergabungSejak)} />
      </SectionCard>

      {/* ID Pengguna — Read Only */}
      <SectionCard title="ID PENGGUNA">
        <div style={{ padding: '13px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 120, flexShrink: 0, fontSize: 13, color: 'var(--color-muted)', paddingTop: 1 }}>
              User ID
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 13,
                  color: 'var(--color-muted)',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  wordBreak: 'break-all',
                }}
              >
                {profile.id}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                ID pengguna bersifat unik dan tidak dapat diubah.
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Edit Sheet */}
      {editOpen && (
        <EditAccountSheet
          profile={profile}
          onSave={handleSave}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// imported from shared util — see src/utils/profileFormatDate.ts
