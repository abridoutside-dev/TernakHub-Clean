// ─── Farm Stok Obat — ADMIN-SYNC-004 ─────────────────────────────────────────
// Cross-workspace admin view of the `stok_obat` table.
// Tables: stok_obat (joined with workspaces)

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';

interface StokObatRow {
  id: string;
  workspace_id: string;
  drug_name: string;
  quantity: number;
  unit: string;
  min_stock: number | null;
  expiry_date: string | null;
  batch_number: string | null;
  status: string;
  location: string | null;
  purchase_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  workspaces?: { name?: string | null; plan?: string | null } | null;
}

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  Aktif:       { color: '#059669', bg: '#d1fae5' },
  Habis:       { color: '#b91c1c', bg: '#fee2e2' },
  Kadaluarsa:  { color: '#d97706', bg: '#fef3c7' },
  Diarsipkan:  { color: '#64748b', bg: '#f1f5f9' },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? { color: '#64748b', bg: '#f1f5f9' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

function SkeletonBox({ height = 20 }: { height?: number }) {
  return (
    <div style={{ width: '100%', height, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite' }} />
  );
}

function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
}

const PAGE_SIZE = 20;

export default function FarmStokObatModule() {
  const [rows, setRows]         = useState<StokObatRow[]>([]);
  const [totalCount, setTotal]  = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setPage]  = useState(1);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const [countRes, dataRes] = await Promise.all([
          supabase.from('stok_obat').select('*', { count: 'exact', head: true }),
          supabase
            .from('stok_obat')
            .select('id, workspace_id, drug_name, quantity, unit, min_stock, expiry_date, batch_number, status, location, purchase_price, notes, created_at, updated_at, workspaces(name, plan)')
            .order('created_at', { ascending: false })
            .limit(1000),
        ]);
        if (cancelled) return;
        if (dataRes.error) { setError(dataRes.error.message); setLoading(false); return; }
        setTotal(countRes.count ?? 0);
        setRows((dataRes.data ?? []) as StokObatRow[]);
        setLastSync(new Date().toISOString());
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const aktif          = rows.filter(r => r.status === 'Aktif').length;
    const habis          = rows.filter(r => r.status === 'Habis').length;
    const kadaluarsa     = rows.filter(r => r.status === 'Kadaluarsa').length;
    const rendah         = rows.filter(r => r.min_stock != null && r.quantity <= r.min_stock && r.status === 'Aktif').length;
    const akanKadaluarsa = rows.filter(r => isExpiringSoon(r.expiry_date) && r.status === 'Aktif').length;
    const workspaces     = new Set(rows.map(r => r.workspace_id)).size;
    return { aktif, habis, kadaluarsa, rendah, akanKadaluarsa, workspaces };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.drug_name.toLowerCase().includes(q) ||
          (r.workspaces?.name ?? '').toLowerCase().includes(q) ||
          (r.batch_number ?? '').toLowerCase().includes(q) ||
          (r.location ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const inputStyle: CSSProperties = {
    padding: '7px 11px', borderRadius: 8, border: '1px solid #e2e8f0',
    fontSize: 13, outline: 'none', background: '#fff',
  };

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Workspace Farm</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Stok Obat</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>
            💊 Stok Obat
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Inventaris obat seluruh platform — dari Supabase{' '}
            <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>stok_obat</code>.
            {lastSync && (
              <span style={{ marginLeft: 8, fontSize: 11.5, color: '#94a3b8' }}>
                Last sync: {new Date(lastSync).toLocaleTimeString('id-ID')}
              </span>
            )}
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #f1f5f9' }}><SkeletonBox height={28} /></div>
          )) : [
            { label: 'Total Item',      value: totalCount,            icon: '💊', color: '#3b82f6' },
            { label: 'Aktif',           value: stats.aktif,           icon: '✅', color: '#10b981' },
            { label: 'Stok Habis',      value: stats.habis,           icon: '🚫', color: '#ef4444' },
            { label: 'Stok Rendah',     value: stats.rendah,          icon: '⚠️', color: '#f59e0b' },
            { label: 'Akan Kadaluarsa', value: stats.akanKadaluarsa,  icon: '⏳', color: '#f97316' },
            { label: 'Workspace',       value: stats.workspaces,      icon: '🏢', color: '#8b5cf6' },
          ].map(card => (
            <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{card.label}</span>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                {card.value.toLocaleString('id-ID')}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #f1f5f9', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <input
            style={{ ...inputStyle, flex: '1 1 200px' }}
            placeholder="🔍 Cari nama obat, workspace, batch..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select style={inputStyle} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Habis">Habis</option>
            <option value="Kadaluarsa">Kadaluarsa</option>
            <option value="Diarsipkan">Diarsipkan</option>
          </select>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            {filtered.length.toLocaleString('id-ID')} dari {totalCount.toLocaleString('id-ID')} item
          </span>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                  {['Nama Obat', 'Workspace', 'Qty', 'Satuan', 'Min Stok', 'Kadaluarsa', 'Lokasi', 'Status', 'Diperbarui'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} style={{ padding: '10px 14px' }}><SkeletonBox height={16} /></td>
                    ))}
                  </tr>
                )) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '32px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      {search || filterStatus ? 'Tidak ada data yang sesuai filter.' : 'Belum ada data stok obat.'}
                    </td>
                  </tr>
                ) : pageRows.map(row => {
                  const isRendah   = row.min_stock != null && row.quantity <= row.min_stock && row.status === 'Aktif';
                  const willExpire = isExpiringSoon(row.expiry_date) && row.status === 'Aktif';
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a', maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.drug_name}</div>
                        {row.batch_number && (
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Batch: {row.batch_number}</div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#374151', maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.workspaces?.name ?? <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: isRendah ? '#d97706' : '#0f172a' }}>
                        {row.quantity.toLocaleString('id-ID')}
                        {isRendah && <span style={{ marginLeft: 4, fontSize: 11, color: '#d97706' }}>⚠️</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{row.unit}</td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{row.min_stock != null ? row.min_stock.toLocaleString('id-ID') : '—'}</td>
                      <td style={{ padding: '10px 14px', color: willExpire ? '#d97706' : '#94a3b8', fontWeight: willExpire ? 600 : 400, whiteSpace: 'nowrap', fontSize: 12 }}>
                        {row.expiry_date
                          ? <>{new Date(row.expiry_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}{willExpire && ' ⚠️'}</>
                          : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', maxWidth: 120 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.location ?? '—'}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}><StatusBadge status={row.status} /></td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {new Date(row.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: safePage === 1 ? 'not-allowed' : 'pointer', color: '#374151', fontSize: 13 }}
            >‹ Prev</button>
            <span style={{ fontSize: 13, color: '#64748b' }}>Halaman {safePage} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', color: '#374151', fontSize: 13 }}
            >Next ›</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
