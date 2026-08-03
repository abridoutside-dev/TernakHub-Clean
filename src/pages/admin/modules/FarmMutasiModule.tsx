// ─── Farm Mutasi — ADMIN-SYNC-004 ────────────────────────────────────────────
// Cross-workspace admin view of livestock_transfers and mutation_requests tables.

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';

interface TransferRow {
  id: string;
  livestock_id: string;
  workspace_id: string;
  transfer_type: string;
  from_location: string | null;
  to_location: string | null;
  destination: string | null;
  reason: string | null;
  archive_reason: string | null;
  transfer_date: string;
  notes: string | null;
  created_at: string;
  livestock?: { name?: string | null; species?: string | null } | null;
  workspaces?: { name?: string | null; plan?: string | null } | null;
}

interface MutationRow {
  id: string;
  workspace_id: string;
  mutation_type: string | null;
  status: string;
  effective_date: string | null;
  reason: string | null;
  created_at: string;
  workspaces?: { name?: string | null; plan?: string | null } | null;
}

const TRANSFER_TYPE_CFG: Record<string, { color: string; bg: string }> = {
  'Pindah Kandang':    { color: '#2563eb', bg: '#dbeafe' },
  'Keluar Permanen':   { color: '#b91c1c', bg: '#fee2e2' },
  'Keluar Sementara':  { color: '#d97706', bg: '#fef3c7' },
  'Kembali':           { color: '#059669', bg: '#d1fae5' },
};

function TypeBadge({ type }: { type: string }) {
  const c = TRANSFER_TYPE_CFG[type] ?? { color: '#64748b', bg: '#f1f5f9' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {type}
    </span>
  );
}

function SkeletonBox({ height = 20 }: { height?: number }) {
  return (
    <div style={{ width: '100%', height, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite' }} />
  );
}

const PAGE_SIZE = 20;
type TabKey = 'transfers' | 'mutations';

export default function FarmMutasiModule() {
  const [tab, setTab]           = useState<TabKey>('transfers');
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [mutations, setMutations] = useState<MutationRow[]>([]);
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [totalMutations, setTotalMutations] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [currentPage, setPage]  = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const [tCount, tData, mCount, mData] = await Promise.all([
          supabase.from('livestock_transfers').select('*', { count: 'exact', head: true }),
          supabase.from('livestock_transfers')
            .select('*, livestock(name, species), workspaces(name, plan)')
            .order('created_at', { ascending: false })
            .limit(500),
          supabase.from('mutation_requests').select('*', { count: 'exact', head: true }),
          supabase.from('mutation_requests')
            .select('*, workspaces(name, plan)')
            .order('created_at', { ascending: false })
            .limit(500),
        ]);
        if (cancelled) return;
        if (tData.error) { setError(tData.error.message); setLoading(false); return; }
        if (mData.error) { setError(mData.error.message); setLoading(false); return; }
        setTotalTransfers(tCount.count ?? 0);
        setTotalMutations(mCount.count ?? 0);
        setTransfers((tData.data ?? []) as TransferRow[]);
        setMutations((mData.data ?? []) as MutationRow[]);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredTransfers = useMemo(() => transfers.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.livestock?.name ?? '').toLowerCase().includes(q) ||
           (r.workspaces?.name ?? '').toLowerCase().includes(q) ||
           (r.transfer_type ?? '').toLowerCase().includes(q);
  }), [transfers, search]);

  const filteredMutations = useMemo(() => mutations.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.workspaces?.name ?? '').toLowerCase().includes(q) ||
           (r.status ?? '').toLowerCase().includes(q);
  }), [mutations, search]);

  const currentList = tab === 'transfers' ? filteredTransfers : filteredMutations;
  const totalPages  = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  const safePage    = Math.min(currentPage, totalPages);
  const pageRows    = currentList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Workspace Farm</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Mutasi</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🔀 Mutasi Ternak</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Transfer dan mutasi ternak seluruh platform — dari Supabase{' '}
            <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>livestock_transfers</code> &amp;{' '}
            <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>mutation_requests</code>.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #f1f5f9' }}><SkeletonBox height={28} /></div>
          )) : (<>
            {[
              { label: 'Total Transfer',   value: totalTransfers, icon: '🔀', color: '#3b82f6' },
              { label: 'Keluar Permanen',  value: transfers.filter(t => t.transfer_type === 'Keluar Permanen').length, icon: '📤', color: '#ef4444' },
              { label: 'Total Mutasi',     value: totalMutations, icon: '📋', color: '#8b5cf6' },
              { label: 'Mutasi Pending',   value: mutations.filter(m => m.status === 'Draft' || m.status === 'Pending').length, icon: '⏳', color: '#f59e0b' },
            ].map(card => (
              <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{card.label}</span>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{card.icon}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{card.value.toLocaleString('id-ID')}</div>
              </div>
            ))}
          </>)}
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f8fafc', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {(['transfers', 'mutations'] as TabKey[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1); setSearch(''); }}
              style={{ padding: '6px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f172a' : '#64748b',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {t === 'transfers' ? `🔀 Transfer (${totalTransfers})` : `📋 Permintaan Mutasi (${totalMutations})`}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 20px', border: '1px solid #f1f5f9', marginBottom: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 320 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Nama ternak, workspace, atau tipe…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              {tab === 'transfers' ? 'Transfer Ternak' : 'Permintaan Mutasi'}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>
              {loading ? '…' : `${currentList.length} dari ${tab === 'transfers' ? totalTransfers : totalMutations}`}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#94a3b8' }}>
              {loading ? 'Memuat…' : 'Data dari Supabase'}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {(tab === 'transfers'
                    ? ['Ternak', 'Workspace', 'Tipe Transfer', 'Dari', 'Ke', 'Tanggal', 'Dibuat']
                    : ['Workspace', 'Tipe Mutasi', 'Status', 'Alasan', 'Tanggal Efektif', 'Dibuat']
                  ).map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_el, i) => (
                    <tr key={i}><td colSpan={7} style={{ padding: '12px 14px' }}><SkeletonBox height={18} /></td></tr>
                  ))
                ) : currentList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🔀</div>
                      <div style={{ fontWeight: 600, color: '#64748b' }}>
                        {(tab === 'transfers' ? transfers : mutations).length === 0
                          ? 'Belum ada data di Supabase.' : 'Tidak ada hasil yang cocok'}
                      </div>
                    </td>
                  </tr>
                ) : tab === 'transfers'
                  ? (pageRows as TransferRow[]).map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.livestock?.name ?? '—'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.livestock?.species ?? ''}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 12.5, color: '#0f172a' }}>{r.workspaces?.name ?? '—'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.workspaces?.plan ?? ''}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}><TypeBadge type={r.transfer_type} /></td>
                      <td style={{ padding: '10px 14px', color: '#475569', fontSize: 12 }}>{r.from_location ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#475569', fontSize: 12 }}>{r.to_location ?? r.destination ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{r.transfer_date}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))
                  : (pageRows as MutationRow[]).map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 12.5, color: '#0f172a' }}>{r.workspaces?.name ?? '—'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.workspaces?.plan ?? ''}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569', fontSize: 12 }}>{r.mutation_type ?? '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 9px', borderRadius: 20, background: '#f1f5f9', color: '#374151', fontSize: 11.5, fontWeight: 600 }}>{r.status}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569', fontSize: 12 }}>{r.reason ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12 }}>{r.effective_date ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {currentList.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, currentList.length)} dari {currentList.length}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
