// ─── Admin Trust & Verification ─────────────────────────────────────────────
// UI → WorkspaceService → WorkspaceTrustVerificationRepository → Edge Function.

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  getTrustVerification,
  getTrustVerifications,
  transitionTrustVerification,
} from '../../../services/workspaceService';
import type {
  TrustVerificationAction,
  TrustVerificationListResponse,
  TrustVerificationRecord,
  TrustVerificationStatus,
  TrustVerificationType,
} from '../../../types/workspaceTrustVerification';
import {
  TV_STATUS_CONFIG,
  TV_TYPE_CONFIG,
} from '../../../data/adminTrustVerificationData';

const STATUSES: TrustVerificationStatus[] = ['Draft', 'Submitted', 'Pending', 'UnderReview', 'Approved', 'Verified', 'Unverified', 'Rejected', 'Suspended', 'Expired'];
const TYPES: TrustVerificationType[] = ['KTP', 'NPWP', 'SIUP', 'Sertifikat', 'LokasiUsaha', 'Rekening', 'Lainnya'];
const PAGE_SIZE = 20;
const date = (value: string | null) => value
  ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

function StatusBadge({ status }: { status: TrustVerificationStatus }) {
  const config = TV_STATUS_CONFIG[status];
  return <span style={{ padding: '3px 9px', borderRadius: 20, background: config?.bg ?? '#f1f5f9', color: config?.color ?? '#64748b', fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{config?.icon ?? '•'} {config?.label ?? status}</span>;
}

function TypeBadge({ type }: { type: TrustVerificationType }) {
  const config = TV_TYPE_CONFIG[type];
  return <span style={{ padding: '3px 9px', borderRadius: 20, background: config?.bg ?? '#f1f5f9', color: config?.color ?? '#64748b', fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{config?.icon ?? '📁'} {config?.short ?? type}</span>;
}

function StatCard({ label, value, icon, color, loading }: { label: string; value: number | string; icon: string; color: string; loading: boolean }) {
  return <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#64748b', fontSize: 11.5, fontWeight: 600 }}><span>{label}</span><span style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 8, background: `${color}18` }}>{icon}</span></div>
    {loading ? <div style={{ height: 28, width: '50%', borderRadius: 6, background: '#f1f5f9' }} /> : <strong style={{ fontSize: 26, color: '#0f172a' }}>{value}</strong>}
  </div>;
}

function DetailPanel({ record, onClose, onAction }: { record: TrustVerificationRecord; onClose: () => void; onAction: (action: TrustVerificationAction) => void }) {
  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.38)', zIndex: 20, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
    <aside style={{ width: 'min(560px, 100%)', height: '100%', overflowY: 'auto', background: '#fff', padding: 24, boxShadow: '-12px 0 30px rgba(15,23,42,.15)' }} onClick={(event) => event.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}><div style={{ flex: 1 }}><div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Detail Verifikasi</div><h2 style={{ margin: 0, fontSize: 21, color: '#0f172a' }}>{record.workspace_name}</h2><div style={{ color: '#64748b', fontSize: 12, marginTop: 5 }}>{record.workspace_type ?? 'Workspace'} · {record.owner_name ?? 'Owner tidak tersedia'}</div></div><button type="button" onClick={onClose} aria-label="Tutup detail" style={{ border: 0, background: '#f1f5f9', borderRadius: 8, padding: '7px 10px', cursor: 'pointer' }}>✕</button></div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18 }}><TypeBadge type={record.verification_type} /><StatusBadge status={record.status} /><strong style={{ marginLeft: 'auto', color: '#0f766e' }}>Trust {record.trust_score ?? '—'}</strong></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>{[['Dikirim', date(record.submitted_at)], ['Direview', date(record.reviewed_at)], ['Kedaluwarsa', date(record.expires_at)], ['Evidence', String(record.evidence.length)]].map(([label, value]) => <div key={label} style={{ background: '#f8fafc', borderRadius: 9, padding: 12 }}><div style={{ fontSize: 11, color: '#64748b' }}>{label}</div><div style={{ fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{value}</div></div>)}</div>
      {record.notes && <div style={{ background: '#f8fafc', borderRadius: 9, padding: 12, marginBottom: 16, fontSize: 13, color: '#475569' }}><strong>Catatan:</strong> {record.notes}</div>}
      <section style={{ marginBottom: 22 }}><h3 style={{ fontSize: 14, margin: '0 0 10px', color: '#0f172a' }}>Trust Evidence</h3>{record.evidence.length ? record.evidence.map((item) => <div key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0', fontSize: 12.5 }}><strong>{item.file_name}</strong><div style={{ color: '#64748b' }}>{item.description || item.file_type || 'Evidence tersimpan'} · {date(item.uploaded_at)}</div></div>) : <div style={{ color: '#94a3b8', fontSize: 13 }}>Belum ada evidence.</div>}</section>
      <section style={{ marginBottom: 22 }}><h3 style={{ fontSize: 14, margin: '0 0 10px', color: '#0f172a' }}>Verification Timeline</h3>{record.timeline.length ? record.timeline.map((item) => <div key={item.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12.5 }}><span style={{ color: '#3b82f6' }}>●</span><div><strong>{item.action}</strong><div style={{ color: '#64748b' }}>{item.actor_name} · {date(item.created_at)}{item.reason ? ` · ${item.reason}` : ''}</div></div></div>) : <div style={{ color: '#94a3b8', fontSize: 13 }}>Belum ada riwayat.</div>}</section>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(['approve', 'reject', 'suspend', 'reactivate'] as TrustVerificationAction[]).map((action) => <button type="button" key={action} onClick={() => onAction(action)} style={{ border: 0, borderRadius: 8, padding: '9px 12px', background: action === 'approve' ? '#059669' : action === 'reject' ? '#dc2626' : '#475569', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : action === 'suspend' ? 'Suspend' : 'Re-activate'}</button>)}</div>
    </aside>
  </div>;
}

export default function TrustModule() {
  const [data, setData] = useState<TrustVerificationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TrustVerificationStatus | 'All'>('All');
  const [type, setType] = useState<TrustVerificationType | 'All'>('All');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<TrustVerificationRecord | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true); setError(null);
    try {
      const result = await getTrustVerifications({ page, page_size: PAGE_SIZE, search, status, verification_type: type });
      if (!signal?.cancelled) setData(result);
    } catch (err) {
      if (!signal?.cancelled) setError(err instanceof Error ? err.message : 'Data trust tidak dapat dimuat.');
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [page, search, status, type]);

  useEffect(() => {
    const signal = { cancelled: false };
    void load(signal);
    return () => { signal.cancelled = true; };
  }, [load]);

  const stats = data?.stats;
  const pageLabel = useMemo(() => data ? `Halaman ${data.page} dari ${data.total_pages}` : '—', [data]);
  const openDetail = async (id: string) => {
    try {
      const detail = await getTrustVerification(id);
      if (detail) setSelected(detail);
    } catch (err) { setError(err instanceof Error ? err.message : 'Detail tidak dapat dimuat.'); }
  };
  const performAction = async (action: TrustVerificationAction) => {
    if (!selected) return;
    const needsReason = action === 'reject' || action === 'suspend';
    const reason = needsReason ? window.prompt('Masukkan alasan tindakan:') : null;
    if (needsReason && !reason?.trim()) return;
    if (!window.confirm(`Konfirmasi tindakan ${action} pada verifikasi ini?`)) return;
    setBusy(true); setError(null);
    const result = await transitionTrustVerification(selected.id, action, reason ?? undefined);
    setBusy(false);
    if (!result.ok) { setError(result.error.message); return; }
    setSelected(result.data);
    await load();
  };

  return <AdminLayout><div style={{ maxWidth: 1400, margin: '0 auto' }}>
    <div style={{ marginBottom: 22 }}><div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Admin › <strong style={{ color: '#3b82f6' }}>User & Workspace › Trust & Verification</strong></div><h1 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>Trust &amp; Verification</h1><p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13.5 }}>Dashboard verifikasi, evidence, manual review, dan audit trail.</p></div>
    {error && <div role="alert" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 9, padding: 12, marginBottom: 16 }}>⚠️ {error}</div>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 22 }}><StatCard label="Total" value={stats?.total ?? 0} icon="🔐" color="#3b82f6" loading={loading} /><StatCard label="Manual Review" value={stats?.pending ?? 0} icon="⏳" color="#f59e0b" loading={loading} /><StatCard label="Terverifikasi" value={stats?.verified ?? 0} icon="✅" color="#10b981" loading={loading} /><StatCard label="Suspended" value={stats?.suspended ?? 0} icon="🚫" color="#8b5cf6" loading={loading} /><StatCard label="Trust Score" value={stats?.average_score ?? '—'} icon="★" color="#0f766e" loading={loading} /></div>
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
      <label style={{ flex: 1, minWidth: 220, fontSize: 11, color: '#64748b', fontWeight: 700 }}>Search<input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="ID, workspace, owner…" style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8 }} /></label>
      <label style={{ minWidth: 160, fontSize: 11, color: '#64748b', fontWeight: 700 }}>Status<select value={status} onChange={(e) => { setStatus(e.target.value as TrustVerificationStatus | 'All'); setPage(1); }} style={{ display: 'block', marginTop: 5, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff' }}><option value="All">Semua Status</option>{STATUSES.map((item) => <option key={item} value={item}>{TV_STATUS_CONFIG[item]?.label ?? item}</option>)}</select></label>
      <label style={{ minWidth: 150, fontSize: 11, color: '#64748b', fontWeight: 700 }}>Tipe<select value={type} onChange={(e) => { setType(e.target.value as TrustVerificationType | 'All'); setPage(1); }} style={{ display: 'block', marginTop: 5, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff' }}><option value="All">Semua Tipe</option>{TYPES.map((item) => <option key={item} value={item}>{TV_TYPE_CONFIG[item]?.short ?? item}</option>)}</select></label>
    </div>
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}><div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 8, alignItems: 'center' }}><strong>Daftar Verifikasi</strong><span style={{ color: '#64748b', fontSize: 12 }}>{loading ? 'Memuat…' : `${data?.total ?? 0} hasil`}</span><span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12 }}>{pageLabel}</span></div><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ background: '#f8fafc' }}>{['Workspace', 'Tipe', 'Status', 'Trust', 'Evidence', 'Dikirim', 'Aksi'].map((head) => <th key={head} style={{ textAlign: 'left', padding: 11, color: '#64748b', fontSize: 11 }}>{head}</th>)}</tr></thead><tbody>{loading ? Array.from({ length: 5 }).map((_, index) => <tr key={index}><td colSpan={7} style={{ padding: 16 }}><div style={{ height: 16, background: '#f1f5f9', borderRadius: 5 }} /></td></tr>) : !data?.records.length ? <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>🔐<div style={{ marginTop: 8 }}>{error ? 'Data tidak dapat dimuat.' : 'Tidak ada verifikasi yang cocok.'}</div></td></tr> : data.records.map((record, index) => <tr key={record.id} style={{ background: index % 2 ? '#fafafa' : '#fff', borderTop: '1px solid #f1f5f9' }}><td style={{ padding: 11 }}><strong style={{ fontSize: 12.5 }}>{record.workspace_name}</strong><div style={{ color: '#94a3b8', fontSize: 11 }}>{record.owner_name ?? 'Owner —'}</div></td><td style={{ padding: 11 }}><TypeBadge type={record.verification_type} /></td><td style={{ padding: 11 }}><StatusBadge status={record.status} /></td><td style={{ padding: 11, fontWeight: 700, color: '#0f766e' }}>{record.trust_score ?? '—'}</td><td style={{ padding: 11, color: '#475569' }}>{record.evidence.length}</td><td style={{ padding: 11, color: '#64748b', fontSize: 12 }}>{date(record.submitted_at)}</td><td style={{ padding: 11 }}><button type="button" onClick={() => void openDetail(record.id)} disabled={busy} style={{ border: '1px solid #bfdbfe', color: '#1d4ed8', background: '#eff6ff', borderRadius: 7, padding: '6px 9px', cursor: 'pointer', fontWeight: 700 }}>Detail</button></td></tr>)}</tbody></table></div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 13, borderTop: '1px solid #e2e8f0' }}><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={loading || page <= 1} style={{ padding: '7px 11px' }}>‹ Sebelumnya</button><button type="button" onClick={() => setPage((value) => Math.min(data?.total_pages ?? value, value + 1))} disabled={loading || page >= (data?.total_pages ?? 1)} style={{ padding: '7px 11px' }}>Berikutnya ›</button></div></div>
    {selected && <DetailPanel record={selected} onClose={() => setSelected(null)} onAction={(action) => void performAction(action)} />}
  </div></AdminLayout>;
}