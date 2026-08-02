// ─── Admin Trust & Verification — P0-005-018B ────────────────────────────────
// Wired to adminTrustVerificationData.ts (12 records, live filter, real stats).

import { useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  TV_VERIFICATION_LIST,
  TV_STATUS_CONFIG,
  TV_TYPE_CONFIG,
  type TVTrustStatus,
  type TVVerificationType,
} from '../../../data/adminTrustVerificationData';

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{label}</span>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: TVTrustStatus }) {
  const c = TV_STATUS_CONFIG[status];
  if (!c) return <span style={{ fontSize: 11.5, color: '#64748b' }}>{status}</span>;
  return <span style={{ padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600 }}>{c.icon} {c.label}</span>;
}

function TypeBadge({ type }: { type: TVVerificationType }) {
  const c = TV_TYPE_CONFIG[type];
  if (!c) return <span style={{ fontSize: 11.5, color: '#64748b' }}>{type}</span>;
  return <span style={{ padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600 }}>{c.icon} {c.short}</span>;
}

const STATUS_OPTIONS: TVTrustStatus[] = ['Not Verified', 'Pending', 'Partially Verified', 'Verified', 'Suspended', 'Revoked'];
const TYPE_OPTIONS: TVVerificationType[] = [
  'Identity Verification', 'Workspace Verification', 'Livestock Verification',
  'Veterinary Verification', 'Document Verification', 'Marketplace Verification',
];

export default function TrustModule() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<TVTrustStatus | 'All'>('All');
  const [filterType, setFilterType]     = useState<TVVerificationType | 'All'>('All');

  const totalCount    = TV_VERIFICATION_LIST.length;
  const pendingCount  = useMemo(() => TV_VERIFICATION_LIST.filter(r => r.status === 'Pending').length, []);
  const verifiedCount = useMemo(() => TV_VERIFICATION_LIST.filter(r => r.status === 'Verified').length, []);
  const revokedCount  = useMemo(() => TV_VERIFICATION_LIST.filter(r => r.status === 'Revoked' || r.status === 'Suspended').length, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TV_VERIFICATION_LIST.filter(r => {
      if (filterStatus !== 'All' && r.status !== filterStatus) return false;
      if (filterType   !== 'All' && r.verificationType !== filterType) return false;
      if (q && !r.subjectName.toLowerCase().includes(q) && !r.workspaceName.toLowerCase().includes(q) && !r.verificationId.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, filterStatus, filterType]);

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Trust & Verifikasi</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>✅ Kepercayaan & Verifikasi</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Pengajuan verifikasi platform — {totalCount} entri ditampilkan.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Pengajuan"     value={totalCount}   icon="🔐" color="#3b82f6" />
          <StatCard label="Menunggu Tinjauan"   value={pendingCount}  icon="⏳" color="#f59e0b" />
          <StatCard label="Terverifikasi"       value={verifiedCount} icon="✅" color="#10b981" />
          <StatCard label="Ditangguhkan/Dicabut" value={revokedCount} icon="🚫" color="#ef4444" />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Pemohon</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama, workspace, atau ID verifikasi…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Status</span>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as TVTrustStatus | 'All')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="All">Semua Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{TV_STATUS_CONFIG[s]?.label ?? s}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 190 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Tipe Verifikasi</span>
            <select value={filterType} onChange={e => setFilterType(e.target.value as TVVerificationType | 'All')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="All">Semua Tipe</option>
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TV_TYPE_CONFIG[t]?.short ?? t}</option>)}
            </select>
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Verifikasi</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{filtered.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Subjek', 'Workspace', 'Tipe', 'Status', 'Diajukan', 'Direview', 'Reviewer'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                      <div style={{ fontWeight: 600, color: '#64748b' }}>Tidak ada hasil yang cocok</div>
                    </td>
                  </tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.verificationId} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {r.verificationId}
                    </td>
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{r.subjectIcon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.subjectName}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.ownerName}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: 12.5, color: '#0f172a' }}>{r.workspaceName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{r.workspaceId}</div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <TypeBadge type={r.verificationType} />
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{r.submittedDate}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{r.reviewedDate ?? '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b', verticalAlign: 'middle' }}>{r.reviewer ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
