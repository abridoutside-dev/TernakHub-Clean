// ─── Admin Workspace Relationships ───────────────────────────────────────────
// UI → WorkspaceService → WorkspaceRelationshipRepository → Edge Function.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import {
  addWorkspaceRelationship,
  getWorkspaceRelationshipDeletePreflight,
  getWorkspaceRelationships,
  removeWorkspaceRelationship,
  updateWorkspaceRelationshipStatus,
} from '../../../services/workspaceService';
import {
  RELATIONSHIP_STATUS_CONFIG,
  RELATIONSHIP_TYPE_CONFIG,
  WORKSPACE_TYPE_CONFIG,
} from '../../../config/workspaceRelationship';
import type {
  RelationshipCreateInput,
  RelationshipStatus,
  RelationshipType,
  RelationshipWorkspaceOption,
  WorkspaceRelationship,
} from '../../../types/workspaceRelationship';

const PAGE_SIZE = 20;

function dateOf(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Button({
  children,
  onClick,
  disabled = false,
  danger = false,
  secondary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  secondary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 11px',
        borderRadius: 7,
        border: `1px solid ${danger ? '#fecaca' : secondary ? '#e2e8f0' : '#2563eb'}`,
        background: danger ? '#fff1f2' : secondary ? '#fff' : '#2563eb',
        color: danger ? '#be123c' : secondary ? '#475569' : '#fff',
        fontSize: 12,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: RelationshipStatus }) {
  const config = RELATIONSHIP_STATUS_CONFIG[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: config.bg, color: config.color, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.dot }} />
      {config.label}
    </span>
  );
}

function TypeBadge({ type }: { type: RelationshipType }) {
  const config = RELATIONSHIP_TYPE_CONFIG[type];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: config.bg, color: config.color, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {config.icon} {config.label}
    </span>
  );
}

function WorkspaceCard({ label, workspace }: { label: string; workspace: WorkspaceRelationship['workspace'] }) {
  const config = WORKSPACE_TYPE_CONFIG[workspace.workspace_type] ?? WORKSPACE_TYPE_CONFIG.Farm;
  return (
    <div style={{ padding: 12, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 8 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', marginBottom: 5, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>{config.icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{workspace.workspace_name}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{workspace.owner_name} · {workspace.location}</div>
          <div style={{ fontSize: 10.5, color: '#94a3b8', fontFamily: 'monospace' }}>{workspace.workspace_id}</div>
        </div>
      </div>
    </div>
  );
}

function AddRelationshipModal({
  workspaces,
  onClose,
  onCreated,
}: {
  workspaces: RelationshipWorkspaceOption[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [input, setInput] = useState<RelationshipCreateInput>({
    workspace_id_a: '',
    workspace_id_b: '',
    relationship_type: 'Partner',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    const result = await addWorkspaceRelationship(input);
    if (!result.ok) {
      setError(result.error.message);
      setSaving(false);
      return;
    }
    await onCreated();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div style={{ width: 460, maxWidth: '100%', background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <div><h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Tambah Relationship</h2><p style={{ margin: '5px 0 0', fontSize: 12, color: '#64748b' }}>Buat hubungan baru dalam status Menunggu.</p></div>
          <button type="button" onClick={onClose} style={{ border: 0, background: '#f1f5f9', borderRadius: 7, width: 30, height: 30, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            ['workspace_id_a', 'Workspace A'],
            ['workspace_id_b', 'Workspace B'],
          ].map(([key, label]) => (
            <label key={key} style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 700, color: '#475569' }}>
              {label}
              <select value={input[key as 'workspace_id_a' | 'workspace_id_b']} onChange={(event) => setInput((current) => ({ ...current, [key]: event.target.value }))} style={{ padding: 9, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
                <option value="">Pilih workspace</option>
                {workspaces.map((workspace) => <option key={workspace.workspace_id} value={workspace.workspace_id}>{workspace.workspace_name}</option>)}
              </select>
            </label>
          ))}
          <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 700, color: '#475569' }}>
            Tipe Relationship
            <select value={input.relationship_type} onChange={(event) => setInput((current) => ({ ...current, relationship_type: event.target.value as RelationshipType }))} style={{ padding: 9, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
              {Object.keys(RELATIONSHIP_TYPE_CONFIG).map((type) => <option key={type} value={type}>{RELATIONSHIP_TYPE_CONFIG[type as RelationshipType].label}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 700, color: '#475569' }}>
            Catatan
            <textarea value={input.notes} onChange={(event) => setInput((current) => ({ ...current, notes: event.target.value }))} rows={3} placeholder="Opsional" style={{ padding: 9, border: '1px solid #e2e8f0', borderRadius: 8, resize: 'vertical' }} />
          </label>
        </div>
        {error && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#fff1f2', color: '#be123c', fontSize: 12 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}><Button onClick={onClose} secondary>Batalkan</Button><Button onClick={() => void submit()} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</Button></div>
      </div>
    </div>
  );
}

function RelationshipDrawer({
  record,
  onClose,
  onChanged,
}: {
  record: WorkspaceRelationship;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const mutate = async (operation: 'approve' | 'reject' | 'suspend' | 'reactivate') => {
    setBusy(true);
    setError('');
    const result = await updateWorkspaceRelationshipStatus(record.relationship_id, operation);
    if (!result.ok) setError(result.error.message);
    else await onChanged();
    setBusy(false);
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    const preflight = await getWorkspaceRelationshipDeletePreflight(record.relationship_id);
    if (!preflight) {
      setError('Relationship tidak ditemukan.');
      setBusy(false);
      return;
    }
    if (preflight.dependencies.some((dependency) => dependency.blocksDelete && dependency.count > 0)) {
      setError('Relationship masih memiliki dependency.');
      setBusy(false);
      return;
    }
    const result = await removeWorkspaceRelationship(record.relationship_id, preflight);
    if (!result.ok) setError(result.error.message);
    else {
      await onChanged();
      onClose();
    }
    setBusy(false);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.4)' }} />
      <aside style={{ position: 'fixed', zIndex: 201, right: 0, top: 0, bottom: 0, width: 440, maxWidth: '100vw', background: '#fff', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', padding: 20, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div><div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Detail Relationship</div><div style={{ marginTop: 5, fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>{record.relationship_id}</div></div>
          <button type="button" onClick={onClose} style={{ border: 0, background: '#f1f5f9', borderRadius: 7, width: 30, height: 30, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}><TypeBadge type={record.relationship_type} /><StatusBadge status={record.status} /></div>
        <WorkspaceCard label="Workspace A" workspace={record.workspace} />
        <WorkspaceCard label="Workspace B" workspace={record.partner} />
        <div style={{ display: 'grid', gap: 7, marginTop: 16, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Dibuat</span><strong>{dateOf(record.created_at)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Diperbarui</span><strong>{dateOf(record.updated_at)}</strong></div>
          {record.notes && <div style={{ marginTop: 6, padding: 10, borderRadius: 8, background: '#fffbeb', color: '#78350f' }}>📝 {record.notes}</div>}
        </div>
        {error && <div style={{ marginTop: 14, padding: 10, borderRadius: 8, background: '#fff1f2', color: '#be123c', fontSize: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 20 }}>
          {record.status === 'Pending' && <><Button onClick={() => void mutate('approve')} disabled={busy}>Setujui</Button><Button onClick={() => void mutate('reject')} disabled={busy} danger>Tolak</Button></>}
          {record.status === 'Active' && <Button onClick={() => void mutate('suspend')} disabled={busy} danger>Suspend</Button>}
          {record.status === 'Suspended' && <Button onClick={() => void mutate('reactivate')} disabled={busy}>Aktifkan Kembali</Button>}
          <Button onClick={() => void remove()} disabled={busy} danger>Hapus</Button>
        </div>
      </aside>
    </>
  );
}

export default function RelationshipModule() {
  const location = useLocation();
  const [relationships, setRelationships] = useState<WorkspaceRelationship[]>([]);
  const [workspaces, setWorkspaces] = useState<RelationshipWorkspaceOption[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, suspended: 0, rejected: 0, archived: 0 });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<WorkspaceRelationship | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getWorkspaceRelationships();
      setRelationships(result.relationships);
      setWorkspaces(result.workspaces);
      setStats(result.stats);
      setSelected((current) => current ? result.relationships.find((item) => item.relationship_id === current.relationship_id) ?? null : null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Relationship tidak dapat dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const routeStatus = location.pathname.endsWith('/active') ? 'Active' : location.pathname.endsWith('/pending') ? 'Pending' : '';
  const filtered = useMemo(() => relationships.filter((record) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [record.workspace.workspace_name, record.partner.workspace_name, record.workspace.workspace_id, record.partner.workspace_id].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (!filterType || record.relationship_type === filterType) && (!filterStatus && !routeStatus || record.status === (filterStatus || routeStatus));
  }), [relationships, search, filterType, filterStatus, routeStatus]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}><div style={{ fontSize: 12, color: '#94a3b8' }}>Admin › <span style={{ color: '#3b82f6', fontWeight: 700 }}>Hubungan</span></div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12, flexWrap: 'wrap' }}><div><h1 style={{ margin: '8px 0 0', fontSize: 24, color: '#0f172a' }}>🔗 Hubungan Workspace</h1><p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>Relationship platform dari Supabase — {stats.total} relasi.</p></div><Button onClick={() => setShowAdd(true)}>＋ Tambah Relationship</Button></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
          {[['Total Relasi', stats.total, '🔗'], ['Aktif', stats.active, '✅'], ['Menunggu', stats.pending, '⏳'], ['Ditangguhkan', stats.suspended, '🚫']].map(([label, value, icon]) => <div key={String(label)} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #f1f5f9' }}><div style={{ color: '#64748b', fontSize: 11.5 }}>{icon} {label}</div><div style={{ marginTop: 8, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{value}</div></div>)}
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: 4, flex: 1, minWidth: 180, fontSize: 11, fontWeight: 700, color: '#64748b' }}>Cari Workspace<input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Nama atau ID…" style={{ padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }} /></label>
          <label style={{ display: 'grid', gap: 4, minWidth: 150, fontSize: 11, fontWeight: 700, color: '#64748b' }}>Tipe<select value={filterType} onChange={(event) => { setFilterType(event.target.value); setPage(1); }} style={{ padding: 8, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}><option value="">Semua Tipe</option>{Object.keys(RELATIONSHIP_TYPE_CONFIG).map((type) => <option key={type} value={type}>{RELATIONSHIP_TYPE_CONFIG[type as RelationshipType].label}</option>)}</select></label>
          <label style={{ display: 'grid', gap: 4, minWidth: 140, fontSize: 11, fontWeight: 700, color: '#64748b' }}>Status<select value={filterStatus} onChange={(event) => { setFilterStatus(event.target.value); setPage(1); }} style={{ padding: 8, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}><option value="">Semua</option>{Object.keys(RELATIONSHIP_STATUS_CONFIG).map((status) => <option key={status} value={status}>{RELATIONSHIP_STATUS_CONFIG[status as RelationshipStatus].label}</option>)}</select></label>
        </div>
        {error && <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: '#fff1f2', color: '#be123c', fontSize: 12 }}>{error}</div>}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, alignItems: 'center' }}><strong style={{ color: '#0f172a' }}>{routeStatus === 'Active' ? 'Relationship Aktif' : routeStatus === 'Pending' ? 'Relationship Menunggu' : 'Semua Relationship'}</strong><span style={{ padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b', fontSize: 12 }}>{filtered.length}</span>{loading && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>Memuat…</span>}</div>
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: '#f8fafc' }}>{['Workspace A', 'Workspace B', 'Tipe', 'Status', 'Dibuat', 'Diperbarui'].map((heading) => <th key={heading} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{heading}</th>)}</tr></thead><tbody>{!loading && pageRows.length === 0 ? <tr><td colSpan={6} style={{ padding: 45, textAlign: 'center', color: '#94a3b8' }}>Tidak ada relationship yang cocok.</td></tr> : pageRows.map((record, index) => { const typeA = WORKSPACE_TYPE_CONFIG[record.workspace.workspace_type] ?? WORKSPACE_TYPE_CONFIG.Farm; const typeB = WORKSPACE_TYPE_CONFIG[record.partner.workspace_type] ?? WORKSPACE_TYPE_CONFIG.Farm; return <tr key={record.relationship_id} onClick={() => setSelected(record)} style={{ cursor: 'pointer', background: index % 2 ? '#fafbfc' : '#fff', borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '10px 14px' }}><strong>{typeA.icon} {record.workspace.workspace_name}</strong><div style={{ fontSize: 11, color: '#94a3b8' }}>{record.workspace.owner_name}</div></td><td style={{ padding: '10px 14px' }}><strong>{typeB.icon} {record.partner.workspace_name}</strong><div style={{ fontSize: 11, color: '#94a3b8' }}>{record.partner.owner_name}</div></td><td style={{ padding: '10px 14px' }}><TypeBadge type={record.relationship_type} /></td><td style={{ padding: '10px 14px' }}><StatusBadge status={record.status} /></td><td style={{ padding: '10px 14px', color: '#64748b' }}>{dateOf(record.created_at)}</td><td style={{ padding: '10px 14px', color: '#64748b' }}>{dateOf(record.updated_at)}</td></tr>; })}</tbody></table></div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}><span>Menampilkan {filtered.length ? (safePage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length}</span><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1} secondary>← Prev</Button>{safePage} / {totalPages}<Button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={safePage === totalPages} secondary>Next →</Button></span></div>
        </div>
      </div>
      {selected && <RelationshipDrawer record={selected} onClose={() => setSelected(null)} onChanged={load} />}
      {showAdd && <AddRelationshipModal workspaces={workspaces} onClose={() => setShowAdd(false)} onCreated={load} />}
    </AdminLayout>
  );
}