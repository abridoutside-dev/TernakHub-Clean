import { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  getAllWorkspaces,
  getWorkspaceMembersForWorkspaces,
  updateWorkspaceMemberRole,
  updateWorkspaceMemberStatus,
  getWorkspaceMemberRemovalPreflight,
  removeWorkspaceMember,
} from '../../../services/workspaceService';
import type { WorkspaceRecord } from '../../../types/workspace';
import type { WorkspaceMemberRecord } from '../../../data/workspaceMembersData';

const PAGE_SIZE = 20;
const blue = '#2563eb';
const muted = '#64748b';
const border = '#e2e8f0';
type Notice = { kind: 'success' | 'error'; message: string };

function Button({ children, onClick, disabled = false, danger = false, secondary = false }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; secondary?: boolean;
}) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{
    padding: '6px 10px', borderRadius: 6,
    border: `1px solid ${danger ? '#fecaca' : secondary ? border : blue}`,
    background: danger ? '#fff1f2' : secondary ? '#fff' : blue,
    color: danger ? '#be123c' : secondary ? '#475569' : '#fff',
    fontSize: 11, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .55 : 1,
  }}>{children}</button>;
}

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return <span style={{ padding: '2px 8px', borderRadius: 6, background: bg, color, fontSize: 11, fontWeight: 700 }}>{children}</span>;
}

const successBox: React.CSSProperties = { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', borderRadius: 8, padding: 11, marginBottom: 16, fontSize: 12 };
const errorBox: React.CSSProperties = { background: '#fff1f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: 11, marginBottom: 16, fontSize: 12 };

export default function AdminWorkspaceMembers() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [members, setMembers] = useState<WorkspaceMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const wsList = await getAllWorkspaces({ admin: true });
        if (cancelled) return;
        setWorkspaces(wsList);
        const wsUuids = wsList.map(w => w.workspace_uuid);
        const memberList = await getWorkspaceMembersForWorkspaces(wsUuids);
        if (cancelled) return;
        setMembers(memberList);
      } catch (e: unknown) {
        if (!(e instanceof Error)) throw e;
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const workspaceMap = useMemo(() => {
    const m = new Map<string, WorkspaceRecord>();
    workspaces.forEach(w => m.set(w.workspace_uuid, w));
    return m;
  }, [workspaces]);

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.email?.toLowerCase().includes(q) ?? false) ||
      workspaceMap.get(m.workspace_uuid)?.workspace_name.toLowerCase().includes(q),
    );
  }, [members, search, workspaceMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const handleRoleChange = async (memberUuid: string, workspaceUuid: string) => {
    setBusy(true);
    try {
      const result = await updateWorkspaceMemberRole(memberUuid, editRole as WorkspaceMemberRecord['role'], workspaceUuid);
      if (!result.ok) {
        setNotice({ kind: 'error', message: result.errors[0]?.message ?? 'Gagal mengubah role.' });
        return;
      }
      setNotice({ kind: 'success', message: 'Role berhasil diubah.' });
      setEditingMember(null);
      const wsUuids = workspaces.map(w => w.workspace_uuid);
      const memberList = await getWorkspaceMembersForWorkspaces(wsUuids);
      setMembers(memberList);
    } catch (e: unknown) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Gagal mengubah role.' });
    } finally {
      setBusy(false);
    }
  };

  const handleStatusToggle = async (memberUuid: string, workspaceUuid: string, currentStatus: WorkspaceMemberRecord['status']) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setBusy(true);
    try {
      const result = await updateWorkspaceMemberStatus(memberUuid, newStatus, workspaceUuid);
      if (!result.ok) {
        setNotice({ kind: 'error', message: result.errors[0]?.message ?? 'Gagal mengubah status.' });
        return;
      }
      setNotice({ kind: 'success', message: 'Status member berhasil diubah.' });
      const wsUuids = workspaces.map(w => w.workspace_uuid);
      const memberList = await getWorkspaceMembersForWorkspaces(wsUuids);
      setMembers(memberList);
    } catch (e: unknown) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Gagal mengubah status.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (memberUuid: string, workspaceUuid: string) => {
    if (!window.confirm('Hapus member ini dari workspace?')) return;
    setBusy(true);
    try {
      const preflight = await getWorkspaceMemberRemovalPreflight(memberUuid, workspaceUuid);
      if (!preflight) {
        setNotice({ kind: 'error', message: 'Pre-check member gagal.' });
        return;
      }
      const result = await removeWorkspaceMember(memberUuid, workspaceUuid, preflight);
      if (!result.ok) {
        setNotice({ kind: 'error', message: result.errors[0]?.message ?? 'Gagal menghapus member.' });
        return;
      }
      setNotice({ kind: 'success', message: 'Member berhasil dihapus.' });
      const wsUuids = workspaces.map(w => w.workspace_uuid);
      const memberList = await getWorkspaceMembersForWorkspaces(wsUuids);
      setMembers(memberList);
    } catch (e: unknown) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Gagal menghapus member.' });
    } finally {
      setBusy(false);
    }
  };

  const roleColor: Record<string, string> = { Owner: '#b91c1c', Admin: '#1d4ed8', Manager: '#059669', Staff: '#0369a1', Viewer: '#64748b' };
  const statusColor: Record<string, { color: string; bg: string }> = { Active: { color: '#047857', bg: '#d1fae5' }, Inactive: { color: '#b45309', bg: '#fef3c7' } };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Workspace</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Members</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>👥 Workspace Members</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Menampilkan {members.length} member di {workspaces.length} workspace.
          </p>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>Gagal memuat data: {error}</div>}
        {notice && <div style={notice.kind === 'success' ? successBox : errorBox}>{notice.message}</div>}

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20 }}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Cari nama, email, atau workspace…"
            style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', width: '100%', maxWidth: 400 }}
          />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Workspace', 'Member', 'Role', 'Status', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} style={{ padding: '12px 14px' }}><div style={{ height: 16, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%' }} /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: muted }}>Tidak ada member.</td></tr>
                ) : pageRows.map(m => {
                  const ws = workspaceMap.get(m.workspace_uuid);
                  const isEditing = editingMember === m.member_uuid;
                  return (
                    <tr key={m.member_uuid} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{ws?.workspace_name ?? '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.email ?? '—'}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {isEditing ? (
                          <select value={editRole} onChange={e => setEditRole(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${border}`, fontSize: 12, background: '#fff' }}>
                            {['Owner', 'Admin', 'Manager', 'Staff', 'Viewer'].map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <Badge color={roleColor[m.role] ?? '#64748b'} bg={`${roleColor[m.role] ?? '#64748b'}18`}>{m.role}</Badge>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <Badge color={statusColor[m.status]?.color ?? muted} bg={statusColor[m.status]?.bg ?? '#f1f5f9'}>{m.status}</Badge>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {isEditing ? (
                            <>
                              <Button onClick={() => void handleRoleChange(m.member_uuid, m.workspace_uuid)} disabled={busy || !editRole}>Simpan</Button>
                              <Button secondary onClick={() => setEditingMember(null)}>Batal</Button>
                            </>
                          ) : (
                            <>
                              <Button secondary onClick={() => { setEditingMember(m.member_uuid); setEditRole(m.role); }} disabled={busy || m.role === 'Owner'}>Edit Role</Button>
                              <Button secondary onClick={() => void handleStatusToggle(m.member_uuid, m.workspace_uuid, m.status)} disabled={busy || m.role === 'Owner'}>{m.status === 'Active' ? 'Deactivate' : 'Activate'}</Button>
                              <Button danger onClick={() => void handleRemove(m.member_uuid, m.workspace_uuid)} disabled={busy || m.role === 'Owner'}>Remove</Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: muted }}>
              Menampilkan {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>
                  ← Sebelumnya
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === '…' ? (
                    <span key={`e-${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: 12 }}>…</span>
                  ) : (
                    <button key={p} onClick={() => setCurrentPage(p as number)}
                      style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #e2e8f0', background: p === safePage ? '#3b82f6' : '#fff', color: p === safePage ? '#fff' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {p}
                    </button>
                  ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>
                  Berikutnya →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
