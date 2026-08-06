// ─── Admin User Management — ADM-003 (Full Implementation) ───────────────────
// Real data from Supabase Auth Admin API via /api/admin/users/*
// Features: list + search + filter + sort + pagination, detail drawer,
// stats, all admin actions, workspace management, UX polish.

import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import {
  adminUserService,
  type UserListItem,
  type UserDetail,
  type WorkspaceMembership,
  type UserStats,
  type UserStatus,
} from '../../../services/adminUserService';

const PAGE_SIZE = 20;

// ─── Color helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; bg: string; dot: string }> = {
  Active:    { label: 'Aktif',     color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  Suspended: { label: 'Suspended', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  Pending:   { label: 'Menunggu',  color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
};

function avatarColor(name: string): string {
  const colors = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#0ea5e9','#ec4899','#14b8a6'];
  return colors[(name.charCodeAt(0) || 85) % colors.length];
}

function initials(name: string, email: string): string {
  if (name) return name.substring(0, 2).toUpperCase();
  if (email) return email.substring(0, 2).toUpperCase();
  return 'U?';
}

function displayName(user: UserListItem | UserDetail): string {
  return user.profile?.full_name ?? user.profile?.display_name ?? '';
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Avatar({ name, email, size = 36 }: { name: string; email?: string; size?: number }) {
  const c = avatarColor(name || email || 'U');
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 700, flexShrink: 0, letterSpacing: 0.5 }}>
      {initials(name, email ?? '')}
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.Active;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

function SkeletonBox({ width = '100%', height = 20 }: { width?: string | number; height?: number }) {
  return <div style={{ width, height, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite' }} />;
}

function Badge({ children, color = '#3b82f6', bg = '#eff6ff' }: { children: React.ReactNode; color?: string; bg?: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{children}</span>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 18 }}>{children}</div>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastItem { id: number; msg: string; type: 'success' | 'error' | 'info'; link?: string }
let _toastCounter = 0;

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          pointerEvents: 'all',
          padding: '12px 16px',
          borderRadius: 10,
          background: t.type === 'success' ? '#f0fdf4' : t.type === 'error' ? '#fef2f2' : '#f0f9ff',
          border: `1px solid ${t.type === 'success' ? '#bbf7d0' : t.type === 'error' ? '#fecaca' : '#bae6fd'}`,
          color: t.type === 'success' ? '#166534' : t.type === 'error' ? '#b91c1c' : '#0c4a6e',
          fontSize: 13,
          fontWeight: 500,
          maxWidth: 360,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          animation: 'fadeInUp 0.2s ease',
        }}>
          <span style={{ fontSize: 15 }}>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          <div style={{ flex: 1 }}>
            <div>{t.msg}</div>
            {t.link && (
              <div style={{ marginTop: 4, fontSize: 11, wordBreak: 'break-all' }}>
                <a href={t.link} target="_blank" rel="noreferrer" style={{ color: 'inherit', opacity: 0.7 }}>Link aktif (klik untuk buka)</a>
              </div>
            )}
          </div>
          <button onClick={() => onDismiss(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.5, fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmDialog({ title, message, confirmLabel = 'Konfirmasi', danger = false, onConfirm, onCancel, loading }: ConfirmProps) {
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 500, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 501, background: '#fff', borderRadius: 14, padding: 24, width: 380, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={loading} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: danger ? '#dc2626' : '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Memproses…' : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────

function EditUserModal({ user, onSave, onClose }: { user: UserDetail; onSave: (data: { full_name: string; is_admin: boolean }) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState(user.profile?.full_name ?? user.profile?.display_name ?? '');
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      await onSave({ full_name: name.trim(), is_admin: isAdmin });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 500, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 501, background: '#fff', borderRadius: 14, padding: 24, width: 420, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>✏️ Edit Pengguna</div>
        {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 14, color: '#b91c1c', fontSize: 12.5 }}>{err}</div>}
        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Nama Lengkap</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama lengkap user"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
          <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 13, color: '#0f172a' }}>Berikan akses Admin</span>
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Add Workspace Modal ──────────────────────────────────────────────────────

function AddWorkspaceModal({ userId, onSave, onClose }: { userId: string; onSave: (workspaceId: string, role: string) => Promise<void>; onClose: () => void }) {
  const [wsId, setWsId] = useState('');
  const [role, setRole] = useState<string>('Viewer');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!wsId.trim()) { setErr('Workspace ID wajib diisi'); return; }
    setSaving(true); setErr('');
    try { await onSave(wsId.trim(), role); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Gagal menambah'); setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 600, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 601, background: '#fff', borderRadius: 14, padding: 24, width: 400, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>➕ Tambah Workspace</div>
        {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 14, color: '#b91c1c', fontSize: 12.5 }}>{err}</div>}
        <label style={{ display: 'block', marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Workspace ID (UUID)</div>
          <input value={wsId} onChange={e => setWsId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 20 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Peran</div>
          <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff' }}>
            {['Owner','Admin','Staff','Viewer','Guest'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Menambah…' : 'Tambah'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── User Detail Drawer ───────────────────────────────────────────────────────

interface DrawerProps {
  userId: string;
  onClose: () => void;
  onAction: (msg: string, type: 'success' | 'error' | 'info', link?: string) => void;
  onRefreshList: () => void;
}

function UserDetailDrawer({ userId, onClose, onAction, onRefreshList }: DrawerProps) {
  const [user, setUser]       = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ key: string; title: string; message: string; danger?: boolean } | null>(null);
  const [showEdit, setShowEdit]     = useState(false);
  const [showAddWs, setShowAddWs]   = useState(false);
  const [wsEditId, setWsEditId]     = useState<string | null>(null);
  const [wsEditRole, setWsEditRole] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const loadUser = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const u = await adminUserService.getUser(userId);
      setUser(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat detail user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadUser(); }, [loadUser]);

  const runAction = async (key: string, fn: () => Promise<{ ok: boolean; link?: string }>, successMsg: string) => {
    setActionLoading(key);
    setConfirm(null);
    try {
      const res = await fn();
      if (res.ok) {
        onAction(successMsg, 'success', res.link);
        await loadUser();
        onRefreshList();
      }
    } catch (e) {
      onAction(e instanceof Error ? e.message : 'Aksi gagal', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const ACTIONS: Array<{ key: string; label: string; icon: string; color: string; bg: string; show?: boolean; danger?: boolean; title: string; message: string; fn: () => Promise<{ ok: boolean; link?: string }> }> = user ? [
    {
      key: 'suspend', label: 'Suspend', icon: '🚫', color: '#dc2626', bg: '#fef2f2',
      show: user.status !== 'Suspended',
      danger: true,
      title: 'Suspend User',
      message: `Apakah Anda yakin ingin menangguhkan ${user.profile?.full_name ?? user.email}? User tidak akan bisa login.`,
      fn: () => adminUserService.suspendUser(userId),
    },
    {
      key: 'unsuspend', label: 'Aktifkan', icon: '✅', color: '#059669', bg: '#f0fdf4',
      show: user.status === 'Suspended',
      danger: false,
      title: 'Aktifkan User',
      message: `Aktifkan kembali akun ${user.profile?.full_name ?? user.email}?`,
      fn: () => adminUserService.unsuspendUser(userId),
    },
    {
      key: 'verify', label: 'Verifikasi Email', icon: '✉️', color: '#0369a1', bg: '#f0f9ff',
      show: !user.email_confirmed_at,
      danger: false,
      title: 'Verifikasi Email',
      message: `Tandai email ${user.email} sebagai terverifikasi?`,
      fn: () => adminUserService.verifyEmail(userId),
    },
    {
      key: 'resend', label: 'Kirim Ulang Verifikasi', icon: '📨', color: '#6d28d9', bg: '#f5f3ff',
      show: !user.email_confirmed_at && !!user.email,
      danger: false,
      title: 'Kirim Ulang Email Verifikasi',
      message: `Kirim ulang email verifikasi ke ${user.email}?`,
      fn: () => adminUserService.resendVerification(userId),
    },
    {
      key: 'reset', label: 'Reset Password', icon: '🔑', color: '#92400e', bg: '#fffbeb',
      show: !!user.email,
      danger: false,
      title: 'Reset Password',
      message: `Kirim link reset password ke ${user.email}?`,
      fn: () => adminUserService.resetPassword(userId),
    },
    {
      key: 'signout', label: 'Sign Out Semua Sesi', icon: '🔒', color: '#475569', bg: '#f8fafc',
      show: true,
      danger: false,
      title: 'Sign Out Semua Sesi',
      message: 'Paksa sign out semua sesi aktif user ini?',
      fn: () => adminUserService.signOut(userId),
    },
    {
      key: 'delete', label: 'Hapus Permanen', icon: '🗑️', color: '#b91c1c', bg: '#fff1f2',
      show: true,
      danger: true,
      title: 'Hapus Permanen',
      message: `PERHATIAN: Aksi ini tidak dapat dibatalkan. Hapus permanen akun ${user.profile?.full_name ?? user.email} beserta semua data terkait?`,
      fn: () => adminUserService.deleteUser(userId),
    },
  ] : [];

  const name = user ? displayName(user) : '';

  const visibleActions = ACTIONS.filter(a => a.show !== false);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '100vw', background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(15,23,42,0.15)', animation: 'slideInRight 0.22s ease' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <SkeletonBox width={48} height={48} />
              <div style={{ flex: 1 }}><SkeletonBox height={16} /><div style={{ marginTop: 6 }}><SkeletonBox height={12} width="60%" /></div></div>
            </div>
          ) : user ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <Avatar name={name} email={user.email} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{name || user.email || '—'}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, wordBreak: 'break-all' }}>{user.email}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  <StatusBadge status={user.status} />
                  {user.is_admin && <Badge color="#b45309" bg="#fef3c7">👑 Admin</Badge>}
                  {user.email_confirmed_at ? <Badge color="#059669" bg="#d1fae5">✉️ Terverifikasi</Badge> : <Badge color="#b45309" bg="#fef3c7">✉️ Belum Verifikasi</Badge>}
                  {user.mfa_enabled && <Badge color="#6d28d9" bg="#f5f3ff">🔐 MFA</Badge>}
                </div>
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#ef4444', fontSize: 13 }}>{error || 'User tidak ditemukan'}</span>
              <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
          )}
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16 }}>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonBox key={i} height={14} width={`${60 + i * 5}%`} />)}
            </div>
          ) : user ? (
            <>
              {/* Informasi Akun */}
              <SectionLabel>Informasi Akun</SectionLabel>
              <InfoRow label="User ID" value={<code style={{ fontSize: 11, background: '#f8fafc', padding: '1px 5px', borderRadius: 4 }}>{user.id}</code>} />
              <InfoRow label="Email" value={user.email || '—'} />
              <InfoRow label="Telepon" value={user.phone || (user.profile as { phone_number?: string } | null)?.phone_number || '—'} />
              <InfoRow label="Status" value={<StatusBadge status={user.status} />} />
              <InfoRow label="Peran Admin" value={user.is_admin ? <Badge color="#b45309" bg="#fef3c7">👑 Admin</Badge> : 'User Biasa'} />
              <InfoRow label="Terdaftar" value={fmtDate(user.created_at)} />
              <InfoRow label="Login Terakhir" value={fmtDateTime(user.last_sign_in_at)} />
              <InfoRow label="Diperbarui" value={fmtDate(user.updated_at)} />

              {/* Keamanan */}
              <SectionLabel>Keamanan</SectionLabel>
              <InfoRow label="Verifikasi Email" value={
                user.email_confirmed_at
                  ? <><Badge color="#059669" bg="#d1fae5">✓ Terverifikasi</Badge><span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>{fmtDate(user.email_confirmed_at)}</span></>
                  : <Badge color="#b45309" bg="#fef3c7">⚠ Belum Verifikasi</Badge>
              } />
              <InfoRow label="MFA" value={user.mfa_enabled ? <Badge color="#6d28d9" bg="#f5f3ff">🔐 Aktif</Badge> : <span style={{ color: '#94a3b8' }}>Tidak aktif</span>} />
              {user.banned_until && <InfoRow label="Suspended Hingga" value={<span style={{ color: '#dc2626' }}>{fmtDateTime(user.banned_until)}</span>} />}
              <InfoRow label="Provider Login" value={
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {(user.providers as Array<{ provider: string } | string>).length === 0
                    ? <span style={{ color: '#94a3b8' }}>—</span>
                    : (user.providers as Array<{ provider: string } | string>).map((p, i) => {
                        const name = typeof p === 'string' ? p : p.provider;
                        return <Badge key={i} color="#0369a1" bg="#e0f2fe">{name}</Badge>;
                      })
                  }
                </div>
              } />
              {(user.factors ?? []).length > 0 && (
                <InfoRow label="MFA Factors" value={
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(user.factors as Array<{ id: string; type: string; status: string }>).map(f => (
                      <Badge key={f.id} color={f.status === 'verified' ? '#059669' : '#94a3b8'} bg={f.status === 'verified' ? '#d1fae5' : '#f1f5f9'}>
                        {f.type} — {f.status}
                      </Badge>
                    ))}
                  </div>
                } />
              )}

              {/* Workspace */}
              <SectionLabel>Workspace</SectionLabel>
              <WorkspaceList
                userId={userId}
                memberships={user.workspaces}
                onAction={onAction}
                onShowAdd={() => setShowAddWs(true)}
                onReload={loadUser}
                editingId={wsEditId}
                editRole={wsEditRole}
                onStartEdit={(id, role) => { setWsEditId(id); setWsEditRole(role); }}
                onCancelEdit={() => setWsEditId(null)}
                onSaveEdit={async (memberId, role) => {
                  try {
                    await adminUserService.updateWorkspace(userId, memberId, { role });
                    onAction('Peran diperbarui', 'success');
                    setWsEditId(null);
                    await loadUser();
                  } catch (e) {
                    onAction(e instanceof Error ? e.message : 'Gagal', 'error');
                  }
                }}
                onRemove={async (memberId) => {
                  try {
                    await adminUserService.removeWorkspace(userId, memberId);
                    onAction('Membership dihapus', 'success');
                    await loadUser();
                  } catch (e) {
                    onAction(e instanceof Error ? e.message : 'Gagal', 'error');
                  }
                }}
              />

              {/* Aksi Admin */}
              <SectionLabel>Aksi Admin</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 8 }}>
                <button
                  onClick={() => setShowEdit(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                  ✏️ Edit User
                </button>
                {visibleActions.map(action => (
                  <button
                    key={action.key}
                    disabled={!!actionLoading}
                    onClick={() => setConfirm({ key: action.key, title: action.title, message: action.message, danger: action.danger })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: `1px solid ${action.color}30`, background: action.bg, color: action.color, fontSize: 12.5, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                    {actionLoading === action.key ? '⏳' : action.icon} {action.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirm && user && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          danger={confirm.danger}
          confirmLabel={confirm.danger ? '⚠️ Ya, Lanjutkan' : 'Konfirmasi'}
          loading={!!actionLoading}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const action = ACTIONS.find(a => a.key === confirm.key);
            if (!action) return;
            if (confirm.key === 'delete') {
              runAction(confirm.key, action.fn, 'User berhasil dihapus').then(() => onClose());
            } else {
              runAction(confirm.key, action.fn, `${action.label} berhasil`);
            }
          }}
        />
      )}

      {/* Edit Modal */}
      {showEdit && user && (
        <EditUserModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSave={async (data) => {
            await adminUserService.updateUser(userId, data);
            onAction('User berhasil diperbarui', 'success');
            setShowEdit(false);
            await loadUser();
            onRefreshList();
          }}
        />
      )}

      {/* Add Workspace Modal */}
      {showAddWs && (
        <AddWorkspaceModal
          userId={userId}
          onClose={() => setShowAddWs(false)}
          onSave={async (wsId, role) => {
            await adminUserService.addWorkspace(userId, { workspace_id: wsId, role });
            onAction('Workspace membership ditambahkan', 'success');
            setShowAddWs(false);
            await loadUser();
          }}
        />
      )}
    </>
  );
}

// ─── Workspace List (used inside detail drawer) ───────────────────────────────

interface WorkspaceListProps {
  userId: string;
  memberships: WorkspaceMembership[];
  onAction: (msg: string, type: 'success' | 'error') => void;
  onShowAdd: () => void;
  onReload: () => void;
  editingId: string | null;
  editRole: string;
  onStartEdit: (id: string, role: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (memberId: string, role: string) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
}

function WorkspaceList({ memberships, onShowAdd, editingId, editRole, onStartEdit, onCancelEdit, onSaveEdit, onRemove }: WorkspaceListProps) {
  const [pendingRole, setPendingRole] = useState(editRole);
  useEffect(() => { setPendingRole(editRole); }, [editRole]);

  if (memberships.length === 0) {
    return (
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px', textAlign: 'center', marginBottom: 8 }}>
        <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 10 }}>Belum ada workspace</div>
        <button onClick={onShowAdd} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #3b82f6', background: '#eff6ff', color: '#3b82f6', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>+ Tambah Workspace</button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 8 }}>
      {memberships.map(m => {
        const ws = m.workspaces;
        const isEditing = editingId === m.id;
        return (
          <div key={m.id} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{ws?.name ?? '—'}</div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>{ws?.type} • {ws?.city ?? ws?.province ?? '—'}</div>
                <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                  <Badge color="#6d28d9" bg="#f5f3ff">{m.role}</Badge>
                  <Badge color={m.status === 'Aktif' ? '#059669' : '#94a3b8'} bg={m.status === 'Aktif' ? '#d1fae5' : '#f1f5f9'}>{m.status}</Badge>
                  {m.joined_at && <span style={{ fontSize: 11, color: '#94a3b8' }}>Bergabung {fmtDate(m.joined_at)}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => onStartEdit(m.id, m.role)} title="Ubah peran" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 11.5, cursor: 'pointer' }}>✏️</button>
                <button onClick={() => onRemove(m.id)} title="Hapus membership" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 11.5, cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
            {isEditing && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
                <select value={pendingRole} onChange={e => setPendingRole(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, background: '#fff' }}>
                  {['Owner','Admin','Staff','Viewer','Guest'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={() => onSaveEdit(m.id, pendingRole)} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Simpan</button>
                <button onClick={onCancelEdit} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12.5, cursor: 'pointer' }}>Batal</button>
              </div>
            )}
          </div>
        );
      })}
      <button onClick={onShowAdd} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', marginTop: 2 }}>
        + Tambah Workspace
      </button>
    </div>
  );
}

// ─── Sort Header ──────────────────────────────────────────────────────────────

function SortTh({ col, label, sortBy, order, onSort }: { col: string; label: string; sortBy: string; order: string; onSort: (col: string) => void }) {
  const active = sortBy === col;
  return (
    <th onClick={() => onSort(col)} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: active ? '#3b82f6' : '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', userSelect: 'none', background: active ? '#f0f9ff' : '#f8fafc' }}>
      {label} {active ? (order === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↕</span>}
    </th>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersModule() {
  // ── Auth guard: check current user is admin ────────────────────────────────
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const meta = data.session?.user?.user_metadata ?? {};
      const app  = data.session?.user?.app_metadata ?? {};
      // Mirror AdminGuard exactly: source of truth is user_metadata.role (set by platformInitService)
      setIsAdminUser(meta.is_admin === true || meta.role === 'admin' || meta.role === 'system_admin');
      setAuthChecked(true);
    });
  }, []);

  // ── State ──────────────────────────────────────────────────────────────────
  const [users, setUsers]     = useState<UserListItem[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [stats, setStats]     = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEmail, setFilterEmail]   = useState('all');
  const [sortBy, setSortBy]             = useState('created_at');
  const [order, setOrder]               = useState('desc');
  const [page, setPage]                 = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toasts, setToasts]         = useState<ToastItem[]>([]);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const toast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success', link?: string) => {
    const id = ++_toastCounter;
    setToasts(t => [...t, { id, msg, type, link }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), link ? 10000 : 4000);
  }, []);

  // ── Load users ────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async (p: number = page) => {
    setLoading(true); setError(null);
    try {
      const res = await adminUserService.listUsers({
        page: p, limit: PAGE_SIZE,
        search: search || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        emailFilter: filterEmail !== 'all' ? filterEmail : undefined,
        sort: sortBy, order,
      });
      setUsers(res.users);
      setTotal(res.total);
      setPages(res.pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat users');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterEmail, sortBy, order]);

  // ── Load stats ────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await adminUserService.getStats();
      setStats(s);
    } catch {
      // non-fatal
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authChecked || !isAdminUser) return;
    loadUsers(page);
  }, [authChecked, isAdminUser, page, search, filterStatus, filterEmail, sortBy, order]);

  useEffect(() => {
    if (!authChecked || !isAdminUser) return;
    loadStats();
  }, [authChecked, isAdminUser]);

  const handleSort = (col: string) => {
    if (sortBy === col) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setOrder('desc'); }
    setPage(1);
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleSearchInput = (v: string) => {
    setSearchInput(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(v); setPage(1); }, 600);
  };

  const resetFilters = () => {
    setSearchInput(''); setSearch('');
    setFilterStatus('all'); setFilterEmail('all');
    setSortBy('created_at'); setOrder('desc');
    setPage(1);
  };

  const handleRefresh = () => { loadUsers(page); loadStats(); };
  const hasFilter = search || filterStatus !== 'all' || filterEmail !== 'all';

  if (!authChecked) {
    return <AdminLayout><div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Memverifikasi akses…</div></AdminLayout>;
  }

  if (!isAdminUser) {
    return (
      <AdminLayout>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>Akses Ditolak</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Halaman ini hanya dapat diakses oleh admin.</div>
        </div>
      </AdminLayout>
    );
  }

  // ── Stat cards ────────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Users',    value: stats?.total     ?? 0, icon: '👥', color: '#3b82f6' },
    { label: 'User Aktif',     value: stats?.active    ?? 0, icon: '✅', color: '#10b981' },
    { label: 'Suspended',      value: stats?.suspended ?? 0, icon: '🚫', color: '#ef4444' },
    { label: 'Terverifikasi',  value: stats?.verified  ?? 0, icon: '✉️', color: '#6d28d9' },
    { label: 'Belum Verifikasi', value: stats?.unverified ?? 0, icon: '⏳', color: '#f59e0b' },
    { label: 'Anonim',         value: stats?.anonymous ?? 0, icon: '👤', color: '#94a3b8' },
  ];

  return (
    <AdminLayout>
      <style>{`
        @keyframes adm-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
              <span style={{ color: '#3b82f6', fontWeight: 600 }}>Pengguna</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>👤 Manajemen Pengguna</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
              Pusat manajemen pengguna — data langsung dari Supabase Auth Admin API.
            </p>
          </div>
          <button onClick={handleRefresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            🔄 {loading ? 'Memuat…' : 'Refresh'}
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {error}</span>
            <button onClick={() => loadUsers(page)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#b91c1c', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Coba Lagi</button>
          </div>
        )}

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, marginBottom: 24 }}>
          {statCards.map(card => (
            <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{card.label}</span>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{card.icon}</span>
              </div>
              {statsLoading ? <SkeletonBox height={28} /> : <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{card.value.toLocaleString()}</div>}
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>🔍 Cari</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={searchInput}
                  onChange={e => handleSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Nama, email, ID, telepon…"
                  style={{ flex: 1, padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }}
                />
                <button onClick={handleSearch} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cari</button>
              </div>
            </div>

            {/* Status Filter */}
            <div style={{ minWidth: 140 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Status</div>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff' }}>
                <option value="all">Semua Status</option>
                <option value="Active">✅ Aktif</option>
                <option value="Suspended">🚫 Suspended</option>
                <option value="Pending">⏳ Belum Verifikasi</option>
              </select>
            </div>

            {/* Email Filter */}
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Verifikasi Email</div>
              <select value={filterEmail} onChange={e => { setFilterEmail(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff' }}>
                <option value="all">Semua</option>
                <option value="verified">✉️ Terverifikasi</option>
                <option value="unverified">⏳ Belum Verifikasi</option>
              </select>
            </div>

            {hasFilter && (
              <button onClick={resetFilters} style={{ alignSelf: 'flex-end', padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                ✕ Reset
              </button>
            )}
          </div>
        </div>

        {/* User Table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Pengguna</span>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#eff6ff', color: '#3b82f6' }}>
                {loading ? '…' : `${total.toLocaleString()} total`}
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
              {loading ? 'Memuat…' : `Halaman ${page} dari ${pages} · Klik baris untuk detail`}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <SortTh col="name"            label="Pengguna"      sortBy={sortBy} order={order} onSort={handleSort} />
                  <SortTh col="email"           label="Email"         sortBy={sortBy} order={order} onSort={handleSort} />
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Keamanan</th>
                  <SortTh col="created_at"      label="Terdaftar"     sortBy={sortBy} order={order} onSort={handleSort} />
                  <SortTh col="last_sign_in_at" label="Login Terakhir" sortBy={sortBy} order={order} onSort={handleSort} />
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} style={{ padding: '12px 14px' }}><SkeletonBox height={16} /></td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
                      <div>{hasFilter ? 'Tidak ada user yang sesuai filter.' : 'Belum ada user terdaftar.'}</div>
                      {hasFilter && (
                        <button onClick={resetFilters} style={{ display: 'block', margin: '10px auto 0', padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>Hapus Filter</button>
                      )}
                    </td>
                  </tr>
                ) : (
                  users.map((user, idx) => {
                    const name = displayName(user);
                    return (
                      <tr
                        key={user.id}
                        onClick={() => setSelectedId(user.id)}
                        style={{ cursor: 'pointer', background: idx % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f0f9ff'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? '#fff' : '#fafbfc'}
                      >
                        {/* User */}
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={name} email={user.email} size={32} />
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tanpa Nama</span>}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{user.id.substring(0, 14)}…</div>
                            </div>
                          </div>
                        </td>
                        {/* Email */}
                        <td style={{ padding: '10px 14px', color: '#475569', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.email || '—'}
                        </td>
                        {/* Status */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <StatusBadge status={user.status} />
                            {user.is_admin && <Badge color="#b45309" bg="#fef3c7">👑 Admin</Badge>}
                          </div>
                        </td>
                        {/* Security */}
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {user.email_confirmed_at
                              ? <Badge color="#059669" bg="#d1fae5">✉️</Badge>
                              : <Badge color="#f59e0b" bg="#fef3c7">✉️?</Badge>}
                            {user.mfa_enabled && <Badge color="#6d28d9" bg="#f5f3ff">🔐</Badge>}
                            {user.providers.slice(0, 2).map((p, i) => (
                              <Badge key={i} color="#0369a1" bg="#e0f2fe">{p}</Badge>
                            ))}
                          </div>
                        </td>
                        {/* Terdaftar */}
                        <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDate(user.created_at)}</td>
                        {/* Login */}
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontSize: 12 }}>
                          {user.last_sign_in_at
                            ? <span style={{ color: (new Date().getTime() - new Date(user.last_sign_in_at).getTime()) < 7 * 86400000 ? '#059669' : '#64748b' }}>{fmtDate(user.last_sign_in_at)}</span>
                            : <span style={{ color: '#94a3b8' }}>—</span>}
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedId(user.id); }}
                            style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Detail →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {loading ? '…' : `${total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} dari ${total.toLocaleString()}`}
            </span>
            {pages > 1 && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button onClick={() => setPage(1)} disabled={page === 1 || loading} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: page === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>«</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: page === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>‹ Seb</button>
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === '…' ? (
                    <span key={`e-${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: 12 }}>…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p as number)} disabled={loading}
                      style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #e2e8f0', background: p === page ? '#3b82f6' : '#fff', color: p === page ? '#fff' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {p}
                    </button>
                  ))}
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages || loading} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: page === pages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: page === pages ? 'not-allowed' : 'pointer' }}>Ber ›</button>
                <button onClick={() => setPage(pages)} disabled={page === pages || loading} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: page === pages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: page === pages ? 'not-allowed' : 'pointer' }}>»</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedId && (
        <UserDetailDrawer
          userId={selectedId}
          onClose={() => setSelectedId(null)}
          onAction={toast}
          onRefreshList={() => loadUsers(page)}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(t => t.filter(x => x.id !== id))} />
    </AdminLayout>
  );
}
