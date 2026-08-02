// ─── Profile Security Page (PROFILE-009) ─────────────────────────────────────
// Ganti Password, Login Session, Aktivitas Login, Autentikasi Dua Faktor (2FA).
// 2FA diimplementasikan dengan TOTP RFC 6238 (client-side, Web Crypto API).
// Data tersimpan in-memory via profileSecurityData.ts.

import { useState } from 'react';
import {
  getActiveSessions,
  getLoginActivity,
  getSecurityRecord,
  logoutSession,
  logoutAllOtherSessions,
  changePassword,
  enable2FA,
  disable2FA,
} from '../data/profileSecurityData';
import {
  generateBase32Secret,
  formatSecretDisplay,
  getTOTPQRUrl,
  verifyTOTP,
} from '../utils/totp';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins   = Math.floor(diffMs / 60_000);
  const hours  = Math.floor(mins / 60);
  const days   = Math.floor(hours / 24);
  if (mins < 2)   return 'Baru saja';
  if (mins < 60)  return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 30)  return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 700, color: 'var(--color-muted)',
      letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4,
    }}>
      {children}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md, 12px)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function FieldInput({
  label, type = 'text', value, onChange, error, placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 12px', borderRadius: 8,
          border: `1px solid ${error ? '#dc2626' : 'var(--color-border)'}`,
          background: 'var(--color-bg)', color: 'var(--color-text)',
          fontSize: 14, outline: 'none',
        }}
      />
      {error && (
        <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}

// ─── Ganti Password ───────────────────────────────────────────────────────────

function ChangePasswordSection() {
  const [current, setCurrent]   = useState('');
  const [newPass, setNewPass]   = useState('');
  const [confirm, setConfirm]   = useState('');
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [success, setSuccess]   = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!current)       e.current = 'Password saat ini wajib diisi.';
    if (!newPass)       e.newPass = 'Password baru wajib diisi.';
    else if (newPass.length < 8) e.newPass = 'Minimal 8 karakter.';
    if (!confirm)       e.confirm = 'Konfirmasi password wajib diisi.';
    else if (newPass !== confirm) e.confirm = 'Password tidak cocok.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const result = changePassword(current, newPass);
    if (!result.ok) {
      setErrors({ current: result.error ?? 'Gagal mengubah password.' });
      return;
    }
    setSuccess(true);
    setCurrent(''); setNewPass(''); setConfirm('');
    setTimeout(() => setSuccess(false), 4000);
  }

  return (
    <Card style={{ marginBottom: 24 }}>
      <FieldInput label="Password Saat Ini" type="password" value={current}
        onChange={setCurrent} error={errors.current} placeholder="••••••••" />
      <FieldInput label="Password Baru" type="password" value={newPass}
        onChange={setNewPass} error={errors.newPass} placeholder="Minimal 8 karakter" />
      <FieldInput label="Konfirmasi Password Baru" type="password" value={confirm}
        onChange={setConfirm} error={errors.confirm} placeholder="Ulangi password baru" />
      <div style={{ padding: '12px 16px' }}>
        {success && (
          <div style={{
            background: '#e8f5ee', border: '1px solid #a3d9b5', borderRadius: 8,
            padding: '10px 14px', fontSize: 13, color: '#1b7a43', marginBottom: 10,
          }}>
            ✅ Password berhasil diperbarui.
          </div>
        )}
        <button
          onClick={handleSubmit}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 10,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Perbarui Password
        </button>
      </div>
    </Card>
  );
}

// ─── Two-Factor Authentication Section ───────────────────────────────────────

type TwoFAPhase = 'idle' | 'setup' | 'verifying' | 'disabling';

function TwoFactorSection({ onActivityUpdated }: { onActivityUpdated: () => void }) {
  const [phase, setPhase]   = useState<TwoFAPhase>('idle');
  const [secret, setSecret] = useState('');
  const [code, setCode]     = useState('');
  const [error, setError]   = useState('');
  const [tick, setTick]     = useState(0);

  const record = getSecurityRecord();
  const twoFA  = record.twoFA;

  // ── Activate: start setup ──────────────────────────────────────────────────
  function handleStartSetup() {
    const newSecret = generateBase32Secret();
    setSecret(newSecret);
    setCode('');
    setError('');
    setPhase('setup');
  }

  // ── Activate: verify code → enable ────────────────────────────────────────
  async function handleVerify() {
    setError('');
    if (!/^\d{6}$/.test(code.replace(/\s/g, ''))) {
      setError('Masukkan 6 digit kode dari aplikasi authenticator.');
      return;
    }
    setPhase('verifying');
    const valid = await verifyTOTP(secret, code);
    if (valid) {
      enable2FA(secret);
      setPhase('idle');
      setTick((t) => t + 1);
      onActivityUpdated();
    } else {
      setPhase('setup');
      setError('Kode tidak cocok atau sudah kedaluwarsa. Coba lagi.');
    }
  }

  // ── Deactivate: confirm → disable ─────────────────────────────────────────
  function handleDisable() {
    disable2FA();
    setPhase('idle');
    setTick((t) => t + 1);
    onActivityUpdated();
  }

  void tick; // used only to force re-render after mutations

  // ── Phase: idle (show current status) ─────────────────────────────────────
  if (phase === 'idle') {
    if (twoFA.enabled) {
      return (
        <Card style={{ marginBottom: 24 }}>
          {/* Status: active */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              🛡️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                  Autentikasi Dua Faktor
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: '#e8f5ee', color: '#1b7a43', border: '1px solid #a3d9b5',
                }}>
                  AKTIF
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                Metode: Authenticator App · Aktif sejak{' '}
                {twoFA.setupAt ? formatRelative(twoFA.setupAt) : '—'}
              </div>
            </div>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
              Akun Anda dilindungi dengan verifikasi dua langkah. Setiap login memerlukan
              kode 6 digit dari aplikasi authenticator.
            </p>
            <button
              onClick={() => { setError(''); setPhase('disabling'); }}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 10,
                background: '#fff5f5', color: '#dc2626',
                border: '1.5px solid #fca5a5',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Nonaktifkan 2FA
            </button>
          </div>
        </Card>
      );
    }

    // Status: not active
    return (
      <Card style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            🛡️
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                Autentikasi Dua Faktor
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb',
              }}>
                NONAKTIF
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
              Belum diaktifkan. Tambah lapisan keamanan ekstra ke akun Anda.
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Aktifkan 2FA untuk melindungi akun dari akses tidak sah, meskipun
            password Anda bocor. Gunakan Google Authenticator, Authy, atau aplikasi
            authenticator lainnya.
          </p>
          <button
            onClick={handleStartSetup}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 10,
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Aktifkan 2FA
          </button>
        </div>
      </Card>
    );
  }

  // ── Phase: disabling (confirm) ─────────────────────────────────────────────
  if (phase === 'disabling') {
    return (
      <Card style={{ marginBottom: 24 }}>
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          }}>
            <div style={{ fontSize: 28 }}>⚠️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#c62828', marginBottom: 4 }}>
                Nonaktifkan Autentikasi Dua Faktor?
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                Akun akan kurang aman jika 2FA dinonaktifkan. Pastikan Anda memahami risikonya.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setPhase('idle')}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 10,
                background: 'var(--color-surface)', color: 'var(--color-text)',
                border: '1.5px solid var(--color-border)',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              onClick={handleDisable}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 10,
                background: '#dc2626', color: '#fff',
                border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Ya, Nonaktifkan
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // ── Phase: verifying (async loading) ──────────────────────────────────────
  if (phase === 'verifying') {
    return (
      <Card style={{ marginBottom: 24 }}>
        <div style={{
          padding: '40px 20px', textAlign: 'center', color: 'var(--color-muted)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
            Memverifikasi kode…
          </div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            Mohon tunggu sebentar.
          </div>
        </div>
      </Card>
    );
  }

  // ── Phase: setup (QR code + OTP entry) ────────────────────────────────────
  const userEmail = getSecurityRecord().userId;
  const qrUrl     = getTOTPQRUrl(userEmail, secret);

  return (
    <Card style={{ marginBottom: 24 }}>

      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>📲</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
            Siapkan Authenticator App
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
            Ikuti langkah-langkah berikut untuk mengaktifkan 2FA.
          </div>
        </div>
      </div>

      {/* Step 1: Install app */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6 }}>
          LANGKAH 1 — INSTAL APLIKASI
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>
          Instal salah satu aplikasi authenticator di ponsel Anda:
          <strong> Google Authenticator</strong>, <strong>Authy</strong>,
          atau <strong>Microsoft Authenticator</strong>.
        </div>
      </div>

      {/* Step 2: Scan QR */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10 }}>
          LANGKAH 2 — SCAN KODE QR
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: 8, background: '#fff', borderRadius: 12,
            border: '2px solid var(--color-border)',
            display: 'inline-block',
          }}>
            <img
              src={qrUrl}
              alt="QR Code untuk Google Authenticator"
              width={200} height={200}
              style={{ display: 'block', borderRadius: 6 }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center' }}>
            Tidak bisa scan? Masukkan kunci ini secara manual:
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: 14, fontWeight: 700,
            letterSpacing: 2, color: 'var(--color-text)',
            background: 'var(--color-bg)', padding: '8px 16px', borderRadius: 8,
            border: '1px dashed var(--color-border)',
            wordBreak: 'break-all', textAlign: 'center',
          }}>
            {formatSecretDisplay(secret)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
            Di aplikasi: pilih "Tambah akun" → "Masukkan kode setup" → ketik kunci di atas.
          </div>
        </div>
      </div>

      {/* Step 3: Verify */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10 }}>
          LANGKAH 3 — VERIFIKASI KODE
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 12, lineHeight: 1.5 }}>
          Setelah akun muncul di aplikasi authenticator, masukkan kode 6 digit yang ditampilkan.
        </div>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(v);
            if (error) setError('');
          }}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '12px 14px', borderRadius: 10, marginBottom: 8,
            border: `2px solid ${error ? '#dc2626' : code.length === 6 ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: 'var(--color-bg)', color: 'var(--color-text)',
            fontSize: 22, fontWeight: 700, letterSpacing: 6,
            textAlign: 'center', outline: 'none',
            transition: 'border-color 0.15s',
          }}
        />
        {error && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, marginBottom: 10,
            background: '#ffebee', border: '1px solid #fca5a5',
            fontSize: 13, color: '#c62828',
          }}>
            ⚠️ {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { setPhase('idle'); setCode(''); setError(''); }}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              background: 'var(--color-surface)', color: 'var(--color-text)',
              border: '1.5px solid var(--color-border)',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Batal
          </button>
          <button
            onClick={handleVerify}
            disabled={code.length !== 6}
            style={{
              flex: 2, padding: '11px 0', borderRadius: 10,
              background: code.length === 6 ? 'var(--color-primary)' : '#9ca3af',
              color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 700,
              cursor: code.length === 6 ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            Verifikasi &amp; Aktifkan
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Session Item ──────────────────────────────────────────────────────────────

function SessionItem({
  session,
  onLogout,
}: {
  session: ReturnType<typeof getActiveSessions>[number];
  onLogout: (id: string) => void;
}) {
  const platformEmoji = session.platform.includes('Android') ? '📱'
    : session.platform.includes('iOS') || session.platform.includes('iPad') ? '📱'
    : session.platform.includes('macOS') ? '💻'
    : session.platform.includes('Windows') ? '🖥️'
    : '💻';

  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>{platformEmoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
              {session.device}
            </span>
            {session.isCurrentSession && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#1b7a43',
                background: '#e8f5ee', padding: '2px 7px', borderRadius: 20,
                border: '1px solid #a3d9b5',
              }}>Sesi Ini</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 2 }}>
            {session.browser} · {session.platform}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 2 }}>
            📍 {session.location} · {session.ipAddress}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            Login: {formatDatetime(session.loginTime)} · Aktif: {formatRelative(session.lastActivity)}
          </div>
        </div>
        {!session.isCurrentSession && (
          <button
            onClick={() => onLogout(session.id)}
            style={{
              padding: '6px 12px', borderRadius: 8,
              border: '1px solid #dc2626', background: '#fff5f5',
              color: '#dc2626', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            Keluar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Activity Item ────────────────────────────────────────────────────────────

function ActivityItem({
  entry,
}: {
  entry: ReturnType<typeof getLoginActivity>[number];
}) {
  const aksiConfig: Record<string, { icon: string; color: string }> = {
    'Login':             { icon: '🔓', color: '#1b7a43' },
    'Logout':            { icon: '🔒', color: '#6b7280' },
    'Gagal Login':       { icon: '⚠️', color: '#c62828' },
    'Ganti Password':    { icon: '🔑', color: '#1565c0' },
    '2FA Diaktifkan':    { icon: '🛡️', color: '#6d28d9' },
    '2FA Dinonaktifkan': { icon: '🛡️', color: '#6b7280' },
  };

  const cfg = aksiConfig[entry.aksi] ?? { icon: '•', color: 'var(--color-muted)' };

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 16px',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ fontSize: 20, flexShrink: 0 }}>{cfg.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{entry.aksi}</span>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: entry.status === 'Berhasil' ? '#1b7a43' : '#c62828',
            background: entry.status === 'Berhasil' ? '#e8f5ee' : '#ffebee',
            padding: '1px 6px', borderRadius: 20,
          }}>{entry.status}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 1 }}>
          {entry.device} · {entry.browser} · {entry.platform}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 1 }}>
          📍 {entry.location} · {entry.ipAddress}
        </div>
        {entry.catatan && (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 1 }}>
            {entry.catatan}
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
          {formatRelative(entry.timestamp)}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfileSecurity() {
  const [tick, setTick] = useState(0);
  const [showAllActivity, setShowAllActivity] = useState(false);

  const security   = getSecurityRecord();
  const sessions   = getActiveSessions();
  const activity   = getLoginActivity();
  const otherSessions = sessions.filter((s) => !s.isCurrentSession);

  void tick; // used by onActivityUpdated to force re-render

  function handleLogout(id: string) {
    logoutSession(id);
    setTick((t) => t + 1);
  }

  function handleLogoutAll() {
    logoutAllOtherSessions();
    setTick((t) => t + 1);
  }

  function handleActivityUpdated() {
    setTick((t) => t + 1);
  }

  const displayedActivity = showAllActivity ? activity : activity.slice(0, 5);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 80px' }}>

      {/* ── Ganti Password ────────────────────────────────────────── */}
      <SectionLabel>GANTI PASSWORD</SectionLabel>
      <div style={{
        background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10,
        padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#0369a1',
      }}>
        🔑 Password terakhir diperbarui {formatRelative(security.passwordLastChanged)}.
      </div>
      <ChangePasswordSection />

      {/* ── 2FA ───────────────────────────────────────────────────── */}
      <SectionLabel>AUTENTIKASI DUA FAKTOR (2FA)</SectionLabel>
      <TwoFactorSection onActivityUpdated={handleActivityUpdated} />

      {/* ── Login Session ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5 }}>
          LOGIN SESSION AKTIF
        </div>
        {otherSessions.length > 0 && (
          <button
            onClick={handleLogoutAll}
            style={{
              fontSize: 12, fontWeight: 600, color: '#dc2626',
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
            }}
          >
            Logout Semua
          </button>
        )}
      </div>
      <Card style={{ marginBottom: 24 }}>
        {sessions.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)', fontSize: 14 }}>
            Tidak ada sesi aktif.
          </div>
        ) : (
          sessions.map((session) => (
            <SessionItem key={session.id} session={session} onLogout={handleLogout} />
          ))
        )}
      </Card>

      {/* ── Aktivitas Login ───────────────────────────────────────── */}
      <SectionLabel>AKTIVITAS LOGIN</SectionLabel>
      <Card style={{ marginBottom: 16 }}>
        {activity.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)', fontSize: 14 }}>
            Belum ada aktivitas.
          </div>
        ) : (
          <>
            {displayedActivity.map((entry) => (
              <ActivityItem key={entry.id} entry={entry} />
            ))}
            {activity.length > 5 && (
              <button
                onClick={() => setShowAllActivity((v) => !v)}
                style={{
                  width: '100%', padding: '12px 0',
                  background: 'none', border: 'none',
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--color-primary)', cursor: 'pointer',
                }}
              >
                {showAllActivity
                  ? 'Tampilkan Lebih Sedikit'
                  : `Lihat Semua (${activity.length})`}
              </button>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
