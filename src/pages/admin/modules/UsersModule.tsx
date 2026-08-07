// User & Workspace foundation: User operations only.
// Workspace relationships are read-only dependency information for deletion.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { useAuth } from '../../../contexts/AuthContext';
import {
  adminUserService,
  type UserDependencies,
  type UserDetail,
  type UserListItem,
  type UserStats,
  type UserStatus,
} from '../../../services/adminUserService';

const PAGE_SIZE = 20;
const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; bg: string; dot: string }> = {
  Active: { label: 'Aktif', color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  Suspended: { label: 'Suspended', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  Pending: { label: 'Menunggu', color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
};

function nameOf(user: UserListItem | UserDetail): string {
  return user.profile?.full_name ?? user.profile?.display_name ?? '';
}

function dateOf(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function dateTimeOf(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Avatar({ user, size = 38 }: { user: UserListItem | UserDetail; size?: number }) {
  const label = nameOf(user) || user.email || 'User';
  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#0ea5e9'];
  const color = colors[(label.charCodeAt(0) || 85) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, flexShrink: 0,
    }}>
      {label.slice(0, 2).toUpperCase()}
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

function ConfirmDialog({
  title, message, onConfirm, onClose, loading, danger = false,
}: {
  title: string; message: string; onConfirm: () => void; onClose: () => void; loading: boolean; danger?: boolean;
}) {
  return (
    <Modal onClose={onClose} width={420}>
      <div style={{ padding: 22 }}>
        <h2 style={{ margin: '0 0 9px', fontSize: 17, color: '#0f172a' }}>{title}</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose} disabled={loading} secondary>Batal</Button>
          <Button onClick={onConfirm} disabled={loading} danger={danger}>{loading ? 'Memproses…' : 'Konfirmasi'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function DependencySummary({
  dependencies, loading, error, onReload, onClose, onDelete,
}: {
  dependencies: UserDependencies | null; loading: boolean; error: string;
  onReload: () => void; onClose: () => void; onDelete: () => void;
}) {
  const sections = [
    { label: 'Owner Workspace', items: dependencies?.ownerWorkspaces ?? [], detail: (item: { workspace_type?: string }) => item.workspace_type || 'Workspace' },
    { label: 'Member Workspace', items: dependencies?.memberWorkspaces ?? [], detail: (item: { workspace_type?: string; role?: string }) => `${item.workspace_type || 'Workspace'} · ${item.role || 'Member'}` },
    { label: 'Role', items: dependencies?.roles ?? [], detail: (item: { workspace_type?: string; role_kind?: string }) => `${item.workspace_type || 'Workspace'} · ${item.role_kind === 'assigned' ? 'Assigned' : 'Created'}` },
    { label: 'Invitation', items: dependencies?.invitations ?? [], detail: (item: { email?: string; role?: string; status?: string }) => `${item.email || '—'} · ${item.role || '—'} · ${item.status || '—'}` },
  ];
  return (
    <Modal onClose={onClose} width={650}>
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>Dependency User</h2>
            <p style={{ margin: '5px 0 0', fontSize: 12.5, color: '#64748b' }}>
              Ringkasan relasi ditampilkan sebagai informasi. Tidak ada dependency yang dihapus atau diubah.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" style={{ border: 0, background: '#f1f5f9', borderRadius: 7, width: 30, height: 30, cursor: 'pointer' }}>✕</button>
        </div>
      </div>
      <div style={{ padding: '4px 20px 20px' }}>
        {loading && <div style={{ padding: 28, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Memuat dependency…</div>}
        {error && <div style={{ marginTop: 14, padding: 11, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 12.5 }}>{error}</div>}
        {!loading && dependencies && sections.map(section => (
          <section key={section.label} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong style={{ fontSize: 13, color: '#334155' }}>{section.label}</strong>
              <span style={{ fontSize: 12, color: '#64748b' }}>{section.items.length}</span>
            </div>
            {section.items.length === 0
              ? <div style={{ color: '#94a3b8', fontSize: 12 }}>Tidak ada dependency</div>
              : section.items.map(item => (
                <div key={item.id} style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 7, marginTop: 6 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 650, color: '#0f172a' }}>{item.name}</div>
                  <div style={{ marginTop: 2, fontSize: 11.5, color: '#64748b' }}>{section.detail(item)}</div>
                </div>
              ))}
          </section>
        ))}
      </div>
      <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={onReload} disabled={loading} secondary>↻ Muat Ulang</Button>
        {dependencies?.canDelete && <Button onClick={onDelete} disabled={loading} danger>Delete User</Button>}
        <Button onClick={onClose} secondary>Tutup</Button>
      </div>
    </Modal>
  );
}

function EditUserModal({
  user, onSave, onClose, loading,
}: {
  user: UserDetail; onSave: (data: { full_name: string; is_admin: boolean }) => void;
  onClose: () => void; loading: boolean;
}) {
  const [fullName, setFullName] = useState(nameOf(user));
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  return (
    <Modal onClose={onClose} width={460}>
      <div style={{ padding: 22 }}>
        <h2 style={{ margin: '0 0 18px', fontSize: 17, color: '#0f172a' }}>Edit User</h2>
        <label style={{ display: 'block', marginBottom: 14, fontSize: 12, color: '#475569', fontWeight: 650 }}>
          Nama lengkap
          <input value={fullName} onChange={event => setFullName(event.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: '#475569' }}>
          <input type="checkbox" checked={isAdmin} onChange={event => setIsAdmin(event.target.checked)} />
          Administrator sistem
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose} disabled={loading} secondary>Batal</Button>
          <Button onClick={() => onSave({ full_name: fullName.trim(), is_admin: isAdmin })} disabled={loading || !fullName.trim()}>
            {loading ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function UserDrawer({
  userId, onClose, onRefresh, onToast,
}: {
  userId: string; onClose: () => void; onRefresh: () => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<{ key: string; title: string; message: string; danger?: boolean } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [dependencies, setDependencies] = useState<UserDependencies | null>(null);
  const [dependencyOpen, setDependencyOpen] = useState(false);
  const [dependencyLoading, setDependencyLoading] = useState(false);
  const [dependencyError, setDependencyError] = useState('');
  const mounted = useRef(true);

  const loadUser = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await adminUserService.getUser(userId);
      if (mounted.current) setUser(result);
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Detail user tidak dapat dimuat.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    void loadUser();
    return () => { mounted.current = false; document.body.style.overflow = ''; };
  }, [loadUser]);

  const loadDependencies = useCallback(async () => {
    setDependencyLoading(true); setDependencyError('');
    try {
      const result = await adminUserService.getDependencies(userId);
      if (mounted.current) setDependencies(result);
    } catch (cause) {
      if (mounted.current) setDependencyError(cause instanceof Error ? cause.message : 'Dependency tidak dapat dimuat.');
    } finally {
      if (mounted.current) setDependencyLoading(false);
    }
  }, [userId]);

  const run = async (key: string, fn: () => Promise<{ ok: boolean; link?: string }>, success: string) => {
    setAction(key); setConfirm(null);
    try {
      const result = await fn();
      if (!result.ok) throw new Error('Operasi tidak berhasil diproses.');
      onToast(success, 'success');
      await loadUser(); onRefresh();
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : 'Operasi gagal.', 'error');
    } finally {
      if (mounted.current) setAction(null);
    }
  };

  const prepareDelete = async () => {
    await loadDependencies();
    setDependencyOpen(true);
  };

  if (loading) {
    return <Modal onClose={onClose}><div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Memuat detail user…</div></Modal>;
  }
  if (error || !user) {
    return <Modal onClose={onClose}><div style={{ padding: 24, color: '#b91c1c' }}>{error || 'User tidak ditemukan.'}</div></Modal>;
  }

  const title = nameOf(user) || user.email || 'User';
  const actionItems = [
    user.status === 'Suspended'
      ? { key: 'unsuspend', label: 'Unsuspend', fn: () => adminUserService.unsuspendUser(userId), success: 'User berhasil diaktifkan.', danger: false }
      : { key: 'suspend', label: 'Suspend', fn: () => adminUserService.suspendUser(userId), success: 'User berhasil disuspend.', danger: true },
    { key: 'reset', label: 'Reset Password', fn: () => adminUserService.resetPassword(userId), success: 'Link reset password berhasil dibuat.', danger: false },
    { key: 'sign-out', label: 'Sign Out Semua Sesi', fn: () => adminUserService.signOut(userId), success: 'Semua sesi user berhasil dicabut.', danger: false },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 600 }} />
      <aside role="dialog" aria-modal="true" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 601, width: 560,
        maxWidth: 'calc(100vw - 20px)', background: '#fff', overflowY: 'auto',
        boxShadow: '-12px 0 40px rgba(15,23,42,.16)',
      }}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Avatar user={user} size={46} />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>{title}</h2>
            <div style={{ marginTop: 3, fontSize: 12.5, color: '#64748b' }}>{user.email || '—'}</div>
            <div style={{ marginTop: 8 }}><StatusBadge status={user.status} /></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" style={{ border: 0, background: '#f1f5f9', borderRadius: 7, width: 30, height: 30, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 22 }}>
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
            {[
              ['User ID', user.id],
              ['Telepon', user.phone || '—'],
              ['Terdaftar', dateTimeOf(user.created_at)],
              ['Login terakhir', dateTimeOf(user.last_sign_in_at)],
              ['Email terverifikasi', user.email_confirmed_at ? dateTimeOf(user.email_confirmed_at) : 'Belum'],
              ['Provider', user.providers.map(provider => typeof provider === 'string' ? provider : provider.provider).join(', ') || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: 11, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontSize: 10.5, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 12.5, color: '#334155', wordBreak: 'break-word' }}>{value}</div>
              </div>
            ))}
          </section>

          <h3 style={{ margin: '0 0 10px', fontSize: 13, color: '#334155' }}>Operasi User</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 22 }}>
            <Button onClick={() => setEditOpen(true)} disabled={action !== null}>Edit User</Button>
            {actionItems.map(item => (
              <Button key={item.key} onClick={() => setConfirm({
                key: item.key, title: item.label, danger: item.danger,
                message: `Lanjutkan operasi ${item.label} untuk ${title}?`,
              })} disabled={action !== null} danger={item.danger} secondary={!item.danger}>{item.label}</Button>
            ))}
            <Button onClick={() => void prepareDelete()} disabled={action !== null} danger>Delete User</Button>
          </div>

          <section style={{ borderTop: '1px solid #f1f5f9', paddingTop: 18 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#334155' }}>Dependency Workspace (read-only)</h3>
            <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 12.5, lineHeight: 1.5 }}>
              Relasi Workspace hanya ditampilkan agar tahap berikutnya dapat memprosesnya. Modul User tidak menghapus atau mengubah relasi ini.
            </p>
            <Button onClick={() => void prepareDelete()} disabled={dependencyLoading} secondary>
              {dependencyLoading ? 'Memuat…' : 'Tampilkan Dependency Summary'}
            </Button>
          </section>
        </div>
      </aside>

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          danger={confirm.danger}
          loading={action === confirm.key}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            const item = actionItems.find(candidate => candidate.key === confirm.key);
            if (item) void run(item.key, item.fn, item.success);
            if (confirm.key === 'delete') {
              void run('delete', () => adminUserService.deleteUser(userId), 'User berhasil dihapus.')
                .then(() => onClose());
            }
          }}
        />
      )}
      {editOpen && <EditUserModal
        user={user}
        loading={action === 'edit'}
        onClose={() => setEditOpen(false)}
        onSave={data => void run('edit', () => adminUserService.updateUser(userId, data), 'User berhasil diperbarui.').then(() => setEditOpen(false))}
      />}
      {dependencyOpen && <DependencySummary
        dependencies={dependencies}
        loading={dependencyLoading}
        error={dependencyError}
        onReload={() => void loadDependencies()}
        onDelete={() => setConfirm({
          key: 'delete',
          title: 'Delete User',
          danger: true,
          message: `Hapus permanen ${title}? Dependency sudah kosong dan operasi ini tidak dapat dibatalkan.`,
        })}
        onClose={() => setDependencyOpen(false)}
      />}
    </>
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

export default function UsersModule() {
  const { currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [emailFilter, setEmailFilter] = useState('all');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const mounted = useRef(true);
  const isAdmin = currentUser?.user_metadata?.is_admin === true
    || currentUser?.user_metadata?.role === 'admin'
    || currentUser?.user_metadata?.role === 'system_admin';

  const loadUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await adminUserService.listUsers({
        page, limit: PAGE_SIZE, search, status, emailFilter, sort, order,
      });
      if (!mounted.current) return;
      setUsers(result.users); setTotal(result.total); setPages(result.pages);
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Daftar pengguna tidak dapat dimuat.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [page, search, status, emailFilter, sort, order]);

  const loadStats = useCallback(async () => {
    try {
      const result = await adminUserService.getStats();
      if (mounted.current) setStats(result);
    } catch {
      // The list remains usable when the optional summary request fails.
    }
  }, []);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!authLoading && isAdmin) void loadUsers();
  }, [authLoading, isAdmin, loadUsers]);
  useEffect(() => {
    if (!authLoading && isAdmin) void loadStats();
  }, [authLoading, isAdmin, loadStats]);

  const applySearch = () => { setSearch(searchInput.trim()); setPage(1); };
  const changeSort = (value: string) => {
    if (sort === value) setOrder(value === sort ? (order === 'asc' ? 'desc' : 'asc') : 'desc');
    else { setSort(value); setOrder('desc'); }
    setPage(1);
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Admin › User & Workspace › <span style={{ color: '#2563eb' }}>Daftar Pengguna</span></div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Daftar Pengguna</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>Kelola identitas dan operasi User melalui Supabase Edge Function.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 14, marginBottom: 22 }}>
          <StatCard label="Total Pengguna" value={stats?.total ?? '…'} />
          <StatCard label="Aktif" value={stats?.active ?? '…'} />
          <StatCard label="Suspended" value={stats?.suspended ?? '…'} />
          <StatCard label="Terverifikasi" value={stats?.verified ?? '…'} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 10, background: '#fff', border: '1px solid #f1f5f9', borderRadius: 11, padding: 15, marginBottom: 18 }}>
          <label style={{ flex: '1 1 260px', fontSize: 11.5, color: '#64748b', fontWeight: 650 }}>Cari nama, email, telepon, atau ID
            <input value={searchInput} onChange={event => setSearchInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') applySearch(); }} placeholder="Cari user…" style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
          </label>
          <label style={{ fontSize: 11.5, color: '#64748b', fontWeight: 650 }}>Status
            <select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} style={{ display: 'block', marginTop: 5, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', fontSize: 13 }}>
              <option value="all">Semua</option><option value="Active">Aktif</option><option value="Suspended">Suspended</option><option value="Pending">Menunggu</option>
            </select>
          </label>
          <label style={{ fontSize: 11.5, color: '#64748b', fontWeight: 650 }}>Email
            <select value={emailFilter} onChange={event => { setEmailFilter(event.target.value); setPage(1); }} style={{ display: 'block', marginTop: 5, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', fontSize: 13 }}>
              <option value="all">Semua</option><option value="verified">Terverifikasi</option><option value="unverified">Belum terverifikasi</option>
            </select>
          </label>
          <Button onClick={applySearch}>Cari</Button>
        </div>

        {error && <div style={{ padding: 12, marginBottom: 15, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>{error}</div>}
        <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 11, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: 14, fontWeight: 700 }}>{total.toLocaleString('id-ID')} User</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>User</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}><button type="button" onClick={() => changeSort('created_at')} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#64748b', fontWeight: 700 }}>Terdaftar {sort === 'created_at' ? (order === 'asc' ? '↑' : '↓') : ''}</button></th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Aksi</th>
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} style={{ padding: 35, textAlign: 'center', color: '#94a3b8' }}>Memuat data…</td></tr>
                  : users.length === 0 ? <tr><td colSpan={5} style={{ padding: 35, textAlign: 'center', color: '#94a3b8' }}>Tidak ada user</td></tr>
                    : users.map(user => (
                      <tr key={user.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '11px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar user={user} /><div><div style={{ fontWeight: 650, color: '#0f172a' }}>{nameOf(user) || '—'}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{user.id.slice(0, 8)}…</div></div></div></td>
                        <td style={{ padding: '11px 14px', color: '#475569' }}>{user.email || '—'}</td>
                        <td style={{ padding: '11px 14px' }}><StatusBadge status={user.status} /></td>
                        <td style={{ padding: '11px 14px', color: '#64748b' }}>{dateOf(user.created_at)}</td>
                        <td style={{ padding: '11px 14px' }}><Button onClick={() => setSelectedId(user.id)} secondary>Detail User</Button></td>
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
      {selectedId && <UserDrawer userId={selectedId} onClose={() => setSelectedId(null)} onRefresh={() => { void loadUsers(); void loadStats(); }} onToast={(message, type) => setToast({ message, type })} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}