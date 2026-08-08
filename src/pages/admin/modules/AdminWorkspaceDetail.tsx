import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import {
  getWorkspaceByUuid,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceDependencies,
  getWorkspaceSubscription,
  getSubscriptionPackages,
  assignSubscriptionPackage,
  changeSubscriptionPackage,
  getOwnershipTransfers,
  createOwnershipTransfer,
} from '../../../services/workspaceService';
import type { WorkspaceRecord } from '../../../types/workspace';
import type { SubscriptionPackage, SubscriptionRecordAdmin } from '../../../types/subscriptionAdmin';
import type { OwnershipTransferListResponse } from '../../../types/ownershipTransfer';
import type { WorkspaceDependencies } from '../../../types/workspace';

const blue = '#2563eb';
const muted = '#64748b';
const border = '#e2e8f0';
type Notice = { kind: 'success' | 'error'; message: string };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 20 }}>{children}</div>;
}
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}
function Button({ children, onClick, disabled = false, danger = false, secondary = false }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; secondary?: boolean;
}) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{
    padding: '8px 12px', borderRadius: 8,
    border: `1px solid ${danger ? '#fecaca' : secondary ? border : blue}`,
    background: danger ? '#fff1f2' : secondary ? '#fff' : blue,
    color: danger ? '#be123c' : secondary ? '#475569' : '#fff',
    fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .55 : 1,
  }}>{children}</button>;
}
function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return <span style={{ padding: '2px 8px', borderRadius: 6, background: bg, color, fontSize: 11, fontWeight: 700 }}>{children}</span>;
}
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const dialog: React.CSSProperties = { width: 520, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)', overflow: 'auto', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,.2)' };
const dialogHeader: React.CSSProperties = { padding: '18px 20px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16 };
const close: React.CSSProperties = { border: 0, background: '#f1f5f9', borderRadius: 7, width: 30, height: 30, cursor: 'pointer', fontSize: 18 };
const labelStyle: React.CSSProperties = { display: 'grid', gap: 5, color: '#475569', fontSize: 12, fontWeight: 700 };
const inputStyle: React.CSSProperties = { padding: '9px 10px', border: `1px solid ${border}`, borderRadius: 8, background: '#fff', fontSize: 12, color: '#0f172a', boxSizing: 'border-box' };
const footer: React.CSSProperties = { padding: '14px 20px', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 };
const errorBox: React.CSSProperties = { background: '#fff1f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: 11, marginBottom: 16, fontSize: 12 };
const successBox: React.CSSProperties = { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', borderRadius: 8, padding: 11, marginBottom: 16, fontSize: 12 };
const panel: React.CSSProperties = { background: '#fff', border: `1px solid ${border}`, borderRadius: 12, padding: 18 };

export default function AdminWorkspaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ws, setWs] = useState<WorkspaceRecord | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRecordAdmin | null>(null);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [users, setUsers] = useState<OwnershipTransferListResponse['users']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', type: '', status: '' });
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [preflight, setPreflight] = useState<WorkspaceDependencies | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const [wsData, subData, transferData] = await Promise.all([
        getWorkspaceByUuid(id),
        getWorkspaceSubscription(id),
        getOwnershipTransfers(),
      ]);
      let pkgs: SubscriptionPackage[] = [];
      try { pkgs = await getSubscriptionPackages(); } catch {
        // subscription plan service gagal di-load; daftar paket akan kosong.
      }
      setWs(wsData);
      setSubscription(subData);
      setPackages(pkgs);
      setUsers(transferData.users);
      if (wsData) {
        setEditForm({
          name: wsData.workspace_name,
          description: wsData.description ?? '',
          type: wsData.workspace_type,
          status: wsData.workspace_status,
        });
      }
    } catch (e: unknown) {
      if (!(e instanceof Error)) throw e;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const handleEdit = async () => {
    if (!id || !ws) return;
    setBusy(true);
    try {
      const result = await updateWorkspace(id, {
        workspace_name: editForm.name,
        description: editForm.description,
        workspace_type: editForm.type as WorkspaceRecord['workspace_type'],
        workspace_status: editForm.status as WorkspaceRecord['workspace_status'],
      });
      if (!result.ok) {
        setNotice({ kind: 'error', message: result.errors[0]?.message ?? 'Gagal memperbarui workspace.' });
        return;
      }
      setNotice({ kind: 'success', message: 'Workspace berhasil diperbarui.' });
      setWs(result.data);
      setEditing(false);
    } catch (e: unknown) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Gagal memperbarui workspace.' });
    } finally {
      setBusy(false);
    }
  };

  const handleChangePlan = async () => {
    if (!id || !selectedPlanId) return;
    setBusy(true);
    try {
      if (subscription) {
        const result = await changeSubscriptionPackage({
          subscription_id: subscription.id,
          package_id: selectedPlanId,
        });
        if (!result.ok) {
          setNotice({ kind: 'error', message: result.error.message });
          return;
        }
        setNotice({ kind: 'success', message: 'Paket subscription berhasil diubah.' });
        setSubscription(result.data);
      } else {
        const result = await assignSubscriptionPackage({
          workspace_id: id,
          package_id: selectedPlanId,
        });
        if (!result.ok) {
          setNotice({ kind: 'error', message: result.error.message });
          return;
        }
        setNotice({ kind: 'success', message: 'Paket berhasil di-assign.' });
        setSubscription(result.data);
      }
      setChangePlanOpen(false);
      setSelectedPlanId('');
    } catch (e: unknown) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Gagal mengubah paket.' });
    } finally {
      setBusy(false);
    }
  };

  const handleTransfer = async () => {
    if (!id || !selectedUserId) return;
    setBusy(true);
    try {
      const result = await createOwnershipTransfer({
        workspace_id: id,
        to_user_id: selectedUserId,
      });
      if (!result.ok) {
        setNotice({ kind: 'error', message: result.error.message });
        return;
      }
      setNotice({ kind: 'success', message: 'Permintaan transfer kepemilikan berhasil dibuat.' });
      setTransferOpen(false);
      setSelectedUserId('');
    } catch (e: unknown) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Gagal membuat transfer.' });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setBusy(true);
    try {
      const deps = preflight ?? await getWorkspaceDependencies(id);
      if (deps.hasDeleteBlockers) {
        setNotice({ kind: 'error', message: `Workspace belum dapat dihapus: ${deps.items.filter(i => i.blocksDelete).map(i => `${i.label} (${i.count})`).join(', ')}` });
        return;
      }
      const result = await deleteWorkspace(id, deps);
      if (!result.ok) {
        setNotice({ kind: 'error', message: result.errors[0]?.message ?? 'Gagal menghapus workspace.' });
        return;
      }
      setNotice({ kind: 'success', message: 'Workspace berhasil dihapus.' });
      setTimeout(() => navigate('/admin/workspaces'), 800);
    } catch (e: unknown) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Gagal menghapus workspace.' });
    } finally {
      setBusy(false);
    }
  };

  const loadPreflight = async () => {
    if (!id) return;
    const deps = await getWorkspaceDependencies(id);
    setPreflight(deps);
  };

  const currentPackage = useMemo(() => {
    if (!subscription) return null;
    return packages.find(p => p.id === subscription.plan_id) ?? null;
  }, [subscription, packages]);

  const availablePlans = useMemo(() => {
    if (!subscription) return packages.filter(p => p.is_active);
    return packages.filter(p => p.is_active && p.id !== subscription.plan_id);
  }, [packages, subscription]);

  if (loading) return <AdminLayout><div style={{ padding: 50, textAlign: 'center', color: muted }}>Memuat detail workspace…</div></AdminLayout>;
  if (error) return <AdminLayout><div style={{ padding: 50, textAlign: 'center', color: '#b91c1c' }}>{error}</div></AdminLayout>;
  if (!ws) return <AdminLayout><div style={{ padding: 50, textAlign: 'center', color: muted }}>Workspace tidak ditemukan.</div></AdminLayout>;

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Workspace</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Detail</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>{ws.workspace_name}</h1>
            <Badge color={ws.workspace_status === 'Active' ? '#047857' : '#b45309'} bg={ws.workspace_status === 'Active' ? '#d1fae5' : '#fef3c7'}>{ws.workspace_status}</Badge>
          </div>
        </div>

        {notice && <div style={notice.kind === 'success' ? successBox : errorBox}>{notice.message}</div>}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <Button onClick={() => setEditing(!editing)}>{editing ? 'Batal Edit' : 'Edit Workspace'}</Button>
          <Button secondary onClick={() => setChangePlanOpen(true)}>Change Plan</Button>
          <Button secondary onClick={() => setTransferOpen(true)}>Transfer Ownership</Button>
          <Button danger onClick={() => { void loadPreflight(); setDeleteOpen(true); }}>Delete</Button>
        </div>

        {editing && (
          <div style={panel}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Edit Workspace</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={labelStyle}>Nama
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
              </label>
              <label style={labelStyle}>Tipe
                <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} style={{ ...inputStyle, background: '#fff' }}>
                  {['Farm', 'FeedStore', 'Veterinary', 'Transport'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label style={labelStyle}>Status
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} style={{ ...inputStyle, background: '#fff' }}>
                  {['Active', 'Inactive', 'Archived'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>Deskripsi
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} style={inputStyle} />
              </label>
            </div>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button secondary onClick={() => setEditing(false)}>Batal</Button>
              <Button onClick={() => void handleEdit()} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</Button>
            </div>
          </div>
        )}

        <div style={panel}>
          <SectionLabel>Informasi Workspace</SectionLabel>
          <InfoRow label="Workspace ID" value={<code style={{ fontSize: 11.5, background: '#f8fafc', padding: '1px 5px', borderRadius: 4 }}>{ws.workspace_uuid}</code>} />
          <InfoRow label="Nama" value={ws.workspace_name} />
          <InfoRow label="Tipe" value={ws.workspace_type} />
          <InfoRow label="Status" value={ws.workspace_status} />
          <InfoRow label="Owner" value={ws.owner_user_uuid} />
          <InfoRow label="Dibuat" value={new Date(ws.created_at).toLocaleString('id-ID')} />
          <InfoRow label="Diperbarui" value={new Date(ws.updated_at).toLocaleString('id-ID')} />
        </div>

        <div style={panel}>
          <SectionLabel>Subscription</SectionLabel>
          {subscription ? (
            <>
              <InfoRow label="Paket" value={currentPackage?.name ?? '—'} />
              <InfoRow label="Plan Key" value={subscription.plan_key} />
              <InfoRow label="Status" value={subscription.status} />
              <InfoRow label="Billing Cycle" value={subscription.billing_cycle ?? '—'} />
              <InfoRow label="Mulai" value={subscription.started_at ? new Date(subscription.started_at).toLocaleString('id-ID') : '—'} />
              <InfoRow label="Berakhir" value={subscription.expires_at ? new Date(subscription.expires_at).toLocaleString('id-ID') : '—'} />
            </>
          ) : (
            <div style={{ color: muted, fontSize: 13 }}>Workspace belum memiliki subscription.</div>
          )}
        </div>

        {changePlanOpen && (
          <div style={overlay}><div style={dialog}>
            <div style={dialogHeader}><div><strong>Change Plan</strong><div style={{ color: muted, fontSize: 12 }}>{ws.workspace_name} · {currentPackage?.name ?? subscription?.plan_key ?? 'Belum ada paket'}</div></div><button type="button" onClick={() => { setChangePlanOpen(false); setSelectedPlanId(''); }} style={close}>×</button></div>
            <div style={{ padding: 20 }}>
              <label style={labelStyle}>Paket tujuan
                <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                  <option value="">Pilih paket aktif</option>
                  {availablePlans.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.plan_key})</option>)}
                </select>
              </label>
              {!subscription && <div style={{ marginTop: 10, fontSize: 12, color: '#b45309', background: '#fef3c7', padding: '8px 12px', borderRadius: 8 }}>Workspace belum memiliki subscription. Memilih paket akan membuat subscription baru.</div>}
            </div>
            <div style={footer}><Button secondary onClick={() => { setChangePlanOpen(false); setSelectedPlanId(''); }}>Batal</Button><Button onClick={() => void handleChangePlan()} disabled={busy || !selectedPlanId}>{busy ? 'Menyimpan…' : 'Simpan perubahan'}</Button></div>
          </div></div>
        )}

        {transferOpen && (
          <div style={overlay}><div style={dialog}>
            <div style={dialogHeader}><div><strong>Transfer Ownership</strong><div style={{ color: muted, fontSize: 12 }}>{ws.workspace_name}</div></div><button type="button" onClick={() => { setTransferOpen(false); setSelectedUserId(''); }} style={close}>×</button></div>
            <div style={{ padding: 20 }}>
              <label style={labelStyle}>Pilih user penerima
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                  <option value="">Pilih user</option>
                  {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</option>)}
                </select>
              </label>
            </div>
            <div style={footer}><Button secondary onClick={() => { setTransferOpen(false); setSelectedUserId(''); }}>Batal</Button><Button onClick={() => void handleTransfer()} disabled={busy || !selectedUserId}>{busy ? 'Membuat…' : 'Buat Transfer'}</Button></div>
          </div></div>
        )}

        {deleteOpen && (
          <div style={overlay}><div style={dialog}>
            <div style={dialogHeader}><div><strong>Hapus Workspace</strong></div><button type="button" onClick={() => setDeleteOpen(false)} style={close}>×</button></div>
            <div style={{ padding: 20 }}>
              {preflight?.hasDeleteBlockers ? (
                <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>
                  <strong>Workspace tidak dapat dihapus karena masih memiliki dependency:</strong>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    {preflight.items.filter(i => i.blocksDelete).map(i => <li key={i.key}>{i.label} ({i.count})</li>)}
                  </ul>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: muted, marginBottom: 12 }}>
                  Apakah Anda yakin ingin menghapus workspace <strong>{ws.workspace_name}</strong>? Tindakan ini tidak dapat dibatalkan.
                </div>
              )}
            </div>
            <div style={footer}>
              <Button secondary onClick={() => setDeleteOpen(false)}>Batal</Button>
              <Button danger onClick={() => void handleDelete()} disabled={busy || (preflight?.hasDeleteBlockers ?? true)}>{busy ? 'Menghapus…' : 'Hapus'}</Button>
            </div>
          </div></div>
        )}
      </div>
    </AdminLayout>
  );
}
