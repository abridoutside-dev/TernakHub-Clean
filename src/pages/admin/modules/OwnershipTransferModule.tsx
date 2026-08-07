// ─── Admin Ownership Transfer ────────────────────────────────────────────────
// UI → WorkspaceService → OwnershipTransferRepository → Edge Function.

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import {
  createOwnershipTransfer,
  getOwnershipTransfer,
  getOwnershipTransferPreflight,
  getOwnershipTransfers,
  transitionOwnershipTransfer,
} from '../../../services/workspaceService';
import type {
  CreateOwnershipTransferInput,
  OwnershipTransferAction,
  OwnershipTransferListResponse,
  OwnershipTransferPreflight,
  OwnershipTransferRecord,
  OwnershipTransferStatus,
} from '../../../types/ownershipTransfer';

const PAGE_SIZE = 20;
const STATUS_CONFIG: Record<OwnershipTransferStatus, { label: string; color: string; bg: string; dot: string }> = {
  Draft: { label: 'Draft', color: '#64748b', bg: '#f8fafc', dot: '#94a3b8' },
  Requested: { label: 'Diajukan', color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
  PendingVerification: { label: 'Menunggu Verifikasi', color: '#7c3aed', bg: '#f5f3ff', dot: '#a78bfa' },
  Approved: { label: 'Disetujui', color: '#0369a1', bg: '#f0f9ff', dot: '#38bdf8' },
  Rejected: { label: 'Ditolak', color: '#b91c1c', bg: '#fef2f2', dot: '#f87171' },
  Completed: { label: 'Selesai', color: '#15803d', bg: '#f0fdf4', dot: '#22c55e' },
  Cancelled: { label: 'Dibatalkan', color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
  Failed: { label: 'Gagal', color: '#b91c1c', bg: '#fef2f2', dot: '#f87171' },
};

function dateOf(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function dateTimeOf(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: OwnershipTransferStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.Failed;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: config.bg, color: config.color, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.dot }} />{config.label}
    </span>
  );
}

function Button({
  children, onClick, disabled = false, danger = false, secondary = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  secondary?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      padding: '7px 11px', borderRadius: 7,
      border: `1px solid ${danger ? '#fecaca' : secondary ? '#e2e8f0' : '#2563eb'}`,
      background: danger ? '#fff1f2' : secondary ? '#fff' : '#2563eb',
      color: danger ? '#be123c' : secondary ? '#475569' : '#fff',
      fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
    }}>{children}</button>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, color: '#64748b' }}>{label}</span>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{value}</div>
    </div>
  );
}

function DetailDrawer({
  record, preflight, loadingPreflight, actionBusy, onClose, onPreflight, onAction,
}: {
  record: OwnershipTransferRecord;
  preflight: OwnershipTransferPreflight | null;
  loadingPreflight: boolean;
  actionBusy: boolean;
  onClose: () => void;
  onPreflight: () => void;
  onAction: (action: OwnershipTransferAction) => void;
}) {
  const canAct = ['Requested', 'PendingVerification', 'Approved'].includes(record.status);
  const canCancel = ['Draft', 'Requested', 'PendingVerification'].includes(record.status);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 200 }} />
      <aside style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '100vw', background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{record.workspace.workspace_name}</div>
            <code style={{ fontSize: 11, color: '#94a3b8' }}>{record.transfer_id}</code>
            <div style={{ marginTop: 8 }}><StatusBadge status={record.status} /></div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, border: 0, borderRadius: 8, background: '#f1f5f9', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
          <h3 style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20 }}>Transfer</h3>
          {[
            ['Workspace ID', record.workspace.workspace_id],
            ['Tipe', record.workspace.workspace_type],
            ['Lokasi', record.workspace.location],
            ['Owner saat ini', `${record.current_owner.full_name} · ${record.current_owner.email}`],
            ['Owner baru', `${record.proposed_owner.full_name} · ${record.proposed_owner.email}`],
            ['Alasan', record.reason ?? '—'],
            ['Diajukan', dateTimeOf(record.requested_at ?? record.created_at)],
            ['Diperbarui', dateTimeOf(record.updated_at)],
            ['Selesai', dateTimeOf(record.completed_at)],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
              <span style={{ color: '#64748b' }}>{label}</span><strong style={{ textAlign: 'right', color: '#0f172a' }}>{value}</strong>
            </div>
          ))}
          {record.notes && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#fffbeb', color: '#78350f', fontSize: 12 }}>📝 {record.notes}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <h3 style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, margin: 0 }}>Dependency pre-check</h3>
            <Button secondary onClick={onPreflight} disabled={loadingPreflight}>{loadingPreflight ? 'Memeriksa…' : 'Periksa'}</Button>
          </div>
          {preflight && (
            <div style={{ marginTop: 10, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              {preflight.dependencies.map((dependency) => (
                <div key={dependency.key} style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                  <strong>{dependency.label}: {dependency.count}</strong>
                  <div style={{ color: '#64748b', marginTop: 2 }}>{dependency.description}</div>
                </div>
              ))}
            </div>
          )}

          {record.history && record.history.length > 0 && (
            <>
              <h3 style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24 }}>Riwayat status</h3>
              {record.history.map((item) => <div key={item.id} style={{ padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                <strong>{item.from_status ?? '—'} → {item.to_status}</strong>
                <div style={{ color: '#64748b' }}>{dateTimeOf(item.created_at)} · {item.changed_by}</div>
                {item.reason && <div style={{ color: '#64748b' }}>{item.reason}</div>}
              </div>)}
            </>
          )}
          {record.audit_log && record.audit_log.length > 0 && (
            <>
              <h3 style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24 }}>Audit log</h3>
              {record.audit_log.map((item) => <div key={item.id} style={{ padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                <strong>{item.action}</strong><div style={{ color: '#64748b' }}>{dateTimeOf(item.created_at)} · {item.user_id ?? 'system'}</div>
              </div>)}
            </>
          )}
        </div>
        {(canAct || canCancel) && (
          <div style={{ padding: 16, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {canAct && <Button onClick={() => onAction('approve')} disabled={actionBusy}>Approve</Button>}
            {canAct && <Button danger onClick={() => onAction('reject')} disabled={actionBusy}>Reject</Button>}
            {canCancel && <Button secondary onClick={() => onAction('cancel')} disabled={actionBusy}>Cancel</Button>}
          </div>
        )}
      </aside>
    </>
  );
}

function CreateDialog({ data, onClose, onCreated }: {
  data: OwnershipTransferListResponse;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [workspaceId, setWorkspaceId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setBusy(true); setError('');
    const input: CreateOwnershipTransferInput = { workspace_id: workspaceId, to_user_id: toUserId, reason, notes };
    const result = await createOwnershipTransfer(input);
    if (!result.ok) setError(result.error.message);
    else { onCreated(); return; }
    setBusy(false);
  };
  const selectedWorkspace = data.workspaces.find((item) => item.workspace_id === workspaceId);
  const users = data.users.filter((user) => user.user_id !== selectedWorkspace?.owner_user_id);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 210 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 520, maxWidth: 'calc(100vw - 32px)', background: '#fff', zIndex: 211, borderRadius: 14, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={{ margin: 0, fontSize: 18 }}>Buat permintaan transfer</h2><button type="button" onClick={onClose} style={{ border: 0, background: 'none', cursor: 'pointer' }}>✕</button></div>
        <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          <label style={{ fontSize: 12, color: '#475569' }}>Workspace
            <select value={workspaceId} onChange={(event) => { setWorkspaceId(event.target.value); setToUserId(''); }} style={{ display: 'block', width: '100%', marginTop: 4, padding: 9, border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <option value="">Pilih workspace</option>{data.workspaces.map((item) => <option key={item.workspace_id} value={item.workspace_id}>{item.workspace_name} · {item.owner.full_name}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12, color: '#475569' }}>Owner baru
            <select value={toUserId} onChange={(event) => setToUserId(event.target.value)} disabled={!workspaceId} style={{ display: 'block', width: '100%', marginTop: 4, padding: 9, border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <option value="">Pilih user</option>{users.map((user) => <option key={user.user_id} value={user.user_id}>{user.full_name} · {user.email}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12, color: '#475569' }}>Alasan<input value={reason} onChange={(event) => setReason(event.target.value)} style={{ display: 'block', width: '100%', marginTop: 4, padding: 9, border: '1px solid #e2e8f0', borderRadius: 8 }} /></label>
          <label style={{ fontSize: 12, color: '#475569' }}>Catatan<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} style={{ display: 'block', width: '100%', marginTop: 4, padding: 9, border: '1px solid #e2e8f0', borderRadius: 8, resize: 'vertical' }} /></label>
        </div>
        {error && <div style={{ marginTop: 12, color: '#b91c1c', background: '#fff1f2', padding: 10, borderRadius: 8, fontSize: 12 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}><Button secondary onClick={onClose}>Batal</Button><Button onClick={submit} disabled={busy || !workspaceId || !toUserId}>{busy ? 'Menyimpan…' : 'Buat permintaan'}</Button></div>
      </div>
    </>
  );
}

export default function OwnershipTransferModule() {
  const location = useLocation();
  const [data, setData] = useState<OwnershipTransferListResponse | null>(null);
  const [selected, setSelected] = useState<OwnershipTransferRecord | null>(null);
  const [preflight, setPreflight] = useState<OwnershipTransferPreflight | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await getOwnershipTransfers();
      setData(result);
      setSelected((current) => current ? result.transfers.find((item) => item.transfer_id === current.transfer_id) ?? null : null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Transfer tidak dapat dimuat.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const routeStatus = location.pathname.endsWith('/pending') ? ['Draft', 'Requested', 'PendingVerification', 'Approved'] : location.pathname.endsWith('/done') ? ['Completed'] : null;
    return (data?.transfers ?? []).filter((item) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || [item.transfer_id, item.workspace.workspace_name, item.current_owner.full_name, item.proposed_owner.full_name].some((value) => value.toLowerCase().includes(q));
      return matchesSearch && (!status || item.status === status) && (!routeStatus || routeStatus.includes(item.status));
    });
  }, [data, location.pathname, search, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openDetail = async (record: OwnershipTransferRecord) => {
    setSelected(record); setPreflight(null);
    const detail = await getOwnershipTransfer(record.transfer_id);
    if (detail) setSelected(detail);
  };
  const runPreflight = async () => {
    if (!selected) return;
    setBusy(true);
    try { setPreflight(await getOwnershipTransferPreflight(selected.transfer_id)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Pre-check gagal.'); }
    finally { setBusy(false); }
  };
  const action = async (next: OwnershipTransferAction) => {
    if (!selected || !window.confirm(`Lanjutkan operasi ${next} pada transfer ini?`)) return;
    setBusy(true); setError('');
    const result = await transitionOwnershipTransfer(selected.transfer_id, next);
    if (!result.ok) setError(result.error.message);
    else { await load(); setSelected(result.data); }
    setBusy(false);
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 22 }}>
          <div><div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Admin › <span style={{ color: '#3b82f6' }}>Transfer Kepemilikan</span></div><h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>🔁 Transfer Kepemilikan</h1><p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13.5 }}>Pengelolaan transfer ownership workspace melalui Supabase.</p></div>
          <Button onClick={() => setShowCreate(true)}>＋ Buat permintaan</Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total" value={data?.stats.total ?? 0} icon="🔁" color="#3b82f6" /><StatCard label="Diajukan" value={data?.stats.requested ?? 0} icon="⏳" color="#f59e0b" /><StatCard label="Verifikasi" value={data?.stats.pending_verification ?? 0} icon="🔎" color="#8b5cf6" /><StatCard label="Selesai" value={data?.stats.completed ?? 0} icon="✅" color="#10b981" />
        </div>
        {error && <div style={{ marginBottom: 14, padding: 11, borderRadius: 8, background: '#fff1f2', color: '#b91c1c', fontSize: 12 }}>{error}</div>}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari workspace, user, atau ID transfer…" style={{ flex: 1, minWidth: 220, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8 }} />
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}><option value="">Semua status</option>{Object.entries(STATUS_CONFIG).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select>
          <Button secondary onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>Reset</Button>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10 }}><strong>Daftar transfer</strong><span style={{ color: '#64748b' }}>{filtered.length}</span><span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 12 }}>{loading ? 'Memuat dari Supabase…' : 'Data real'}</span></div>
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: '#f8fafc' }}>{['Workspace', 'Owner lama', 'Owner baru', 'Alasan', 'Status', 'Diajukan'].map((header) => <th key={header} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, color: '#64748b' }}>{header}</th>)}</tr></thead><tbody>
            {loading ? <tr><td colSpan={6} style={{ padding: 42, textAlign: 'center', color: '#94a3b8' }}>Memuat data…</td></tr> : rows.length === 0 ? <tr><td colSpan={6} style={{ padding: 42, textAlign: 'center', color: '#94a3b8' }}>Belum ada transfer yang cocok.</td></tr> : rows.map((row) => <tr key={row.transfer_id} onClick={() => void openDetail(row)} style={{ cursor: 'pointer', borderTop: '1px solid #f1f5f9' }}><td style={{ padding: '11px 14px' }}><strong>{row.workspace.workspace_name}</strong><div style={{ fontSize: 11, color: '#94a3b8' }}>{row.transfer_id}</div></td><td style={{ padding: '11px 14px' }}>{row.current_owner.full_name}<div style={{ fontSize: 11, color: '#94a3b8' }}>{row.current_owner.email}</div></td><td style={{ padding: '11px 14px' }}>{row.proposed_owner.full_name}<div style={{ fontSize: 11, color: '#94a3b8' }}>{row.proposed_owner.email}</div></td><td style={{ padding: '11px 14px', color: '#475569' }}>{row.reason ?? '—'}</td><td style={{ padding: '11px 14px' }}><StatusBadge status={row.status} /></td><td style={{ padding: '11px 14px', color: '#64748b' }}>{dateOf(row.created_at)}</td></tr>)}
          </tbody></table></div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}><span>{filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length}</span><span style={{ display: 'flex', gap: 8 }}><button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>{safePage} / {pages}<button type="button" disabled={safePage === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>›</button></span></div>
        </div>
      </div>
      {selected && <DetailDrawer record={selected} preflight={preflight} loadingPreflight={busy} actionBusy={busy} onClose={() => setSelected(null)} onPreflight={() => void runPreflight()} onAction={(next) => void action(next)} />}
      {showCreate && data && <CreateDialog data={data} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); void load(); }} />}
    </AdminLayout>
  );
}