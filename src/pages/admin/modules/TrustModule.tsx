// ─── Admin Trust & Verification — ADMIN-SYNC-003 ─────────────────────────────
// Data from Supabase `trust_verifications` table (real, no dummy data).
// Access limited by RLS: only workspace_members with role Owner/Admin can read.
// Cross-workspace platform aggregation requires service_role key (server-side).

import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import {
  TV_STATUS_CONFIG,
  TV_TYPE_CONFIG,
  type TVTrustStatus,
  type TVVerificationType,
} from '../../../data/adminTrustVerificationData';

// ─── Supabase row shape ───────────────────────────────────────────────────────

interface TrustRow {
  id: string;
  workspace_id: string | null;
  verification_type: string | null;
  status: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  expires_at: string | null;
  created_at: string | null;
  workspaces: { name: string | null } | null;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, loading }: {
  label: string; value: number; icon: string; color: string; loading: boolean;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{label}</span>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</span>
      </div>
      {loading
        ? <div style={{ height: 28, borderRadius: 6, background: '#f1f5f9', width: '55%' }} />
        : <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c = TV_STATUS_CONFIG[status as TVTrustStatus] ?? { label: status, bg: '#f1f5f9', color: '#64748b', icon: '•' };
  return (
    <span style={{ padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.icon} {c.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const c = TV_TYPE_CONFIG[type as TVVerificationType] ?? { icon: '📁', bg: '#f1f5f9', color: '#64748b', short: type };
  return (
    <span style={{ padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.icon} {c.short}
    </span>
  );
}

const ALL_STATUSES: TVTrustStatus[] = ['Draft', 'Submitted', 'Pending', 'UnderReview', 'Approved', 'Verified', 'Unverified', 'Rejected', 'Suspended', 'Expired'];
const ALL_TYPES: TVVerificationType[] = ['KTP', 'NPWP', 'SIUP', 'Sertifikat', 'LokasiUsaha', 'Rekening', 'Lainnya'];

// ─── Main Module ──────────────────────────────────────────────────────────────

export default function TrustModule() {
  const [rows, setRows]       = useState<TrustRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState<TVTrustStatus | 'All'>('All');
  const [filterType, setFilterType]     = useState<TVVerificationType | 'All'>('All');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const { data, error: fetchErr } = await supabase
          .from('trust_verifications')
          .select('id, workspace_id, verification_type, status, submitted_at, reviewed_at, rejection_reason, expires_at, created_at, workspaces(name)')
          .order('created_at', { ascending: false })
          .limit(200);
        if (cancelled) return;
        if (fetchErr) { setError(fetchErr.message); setLoading(false); return; }
        setRows((data ?? []) as unknown as TrustRow[]);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const pendingCount  = useMemo(() => rows.filter(r => r.status === 'Pending' || r.status === 'Submitted' || r.status === 'UnderReview').length, [rows]);
  const verifiedCount = useMemo(() => rows.filter(r => r.status === 'Verified' || r.status === 'Approved').length, [rows]);
  const rejectedCount = useMemo(() => rows.filter(r => r.status === 'Rejected' || r.status === 'Suspended' || r.status === 'Expired').length, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (filterStatus !== 'All' && r.status !== filterStatus) return false;
      if (filterType   !== 'All' && r.verification_type !== filterType) return false;
      if (q && !r.id.toLowerCase().includes(q) && !(r.workspaces?.name?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, search, filterStatus, filterType]);

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Header ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Trust &amp; Verifikasi</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>✅ Kepercayaan &amp; Verifikasi</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Data dari Supabase{' '}
            <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>trust_verifications</code>
            {' '}— {loading ? '…' : `${rows.length} entri terakses`}
          </p>
        </div>

        {/* ── RLS notice ───────────────────────────────────────────── */}
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12.5, color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
          <div>
            <strong>Akses dibatasi RLS:</strong> Menampilkan hanya verifikasi dari workspace
            di mana akun admin terdaftar sebagai <em>Owner</em> atau <em>Admin</em>.
            Agregasi lintas-workspace platform memerlukan <code>service_role</code> key (server-side).
            Jumlah di bawah mencerminkan data yang dapat diakses oleh akun ini.
          </div>
        </div>

        {/* ── Error ────────────────────────────────────────────────── */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        {/* ── Stat cards ───────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Terlihat"          value={rows.length}  icon="🔐" color="#3b82f6" loading={loading} />
          <StatCard label="Menunggu / Dikirim"      value={pendingCount}  icon="⏳" color="#f59e0b" loading={loading} />
          <StatCard label="Terverifikasi"           value={verifiedCount} icon="✅" color="#10b981" loading={loading} />
          <StatCard label="Ditolak / Ditangguhkan"  value={rejectedCount} icon="🚫" color="#ef4444" loading={loading} />
        </div>

        {/* ── Filters ──────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari (ID / Workspace)</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ID verifikasi atau nama workspace…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Status</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as TVTrustStatus | 'All')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}
            >
              <option value="All">Semua Status</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{TV_STATUS_CONFIG[s]?.label ?? s}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Tipe Dokumen</span>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as TVVerificationType | 'All')}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}
            >
              <option value="All">Semua Tipe</option>
              {ALL_TYPES.map(t => (
                <option key={t} value={t}>{TV_TYPE_CONFIG[t]?.short ?? t}</option>
              ))}
            </select>
          </label>
        </div>

        {/* ── Table ────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Verifikasi</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>
              {loading ? '…' : filtered.length}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#94a3b8' }}>
              {loading ? 'Memuat dari Supabase…' : 'Data real · trust_verifications'}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Workspace', 'Tipe Dokumen', 'Status', 'Dikirim', 'Direview', 'Alasan Tolak'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} style={{ padding: '12px 14px' }}>
                        <div style={{ height: 16, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%' }} />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
                      {rows.length === 0 ? (
                        <>
                          <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Tidak ada data verifikasi yang dapat diakses</div>
                          <div style={{ fontSize: 12 }}>RLS membatasi akses — akun ini bukan Owner/Admin di workspace manapun, atau belum ada pengajuan verifikasi.</div>
                        </>
                      ) : (
                        <div style={{ fontWeight: 600, color: '#64748b' }}>Tidak ada hasil yang cocok dengan filter.</div>
                      )}
                    </td>
                  </tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {r.id.slice(0, 8)}…
                    </td>
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{r.workspaces?.name ?? '—'}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{r.workspace_id?.slice(0, 12) ?? ''}…</div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {r.verification_type ? <TypeBadge type={r.verification_type} /> : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {r.status ? <StatusBadge status={r.status} /> : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {r.submitted_at
                        ? new Date(r.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {r.reviewed_at
                        ? new Date(r.reviewed_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b', verticalAlign: 'middle', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.rejection_reason ?? '—'}
                    </td>
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
