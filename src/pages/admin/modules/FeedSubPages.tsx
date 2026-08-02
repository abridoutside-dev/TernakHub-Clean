// ─── Feed Sub-Pages ────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  ADMIN_FEED_LIST,
  FEED_STOCK_STATUS_CONFIG,
  FEED_TYPE_CONFIG,
  FEED_PLATFORM_STATS,
  type AdminFeedRecord,
  type FeedStockStatus,
  type FeedType,
} from '../../../data/adminFeedData';

const PAGE_SIZE = 20;

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

function StockBadge({ status }: { status: FeedStockStatus }) {
  const c = FEED_STOCK_STATUS_CONFIG[status];
  if (!c) return <span style={{ fontSize: 11.5, color: '#64748b' }}>{status}</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

function TypeBadge({ type }: { type: FeedType }) {
  const c = FEED_TYPE_CONFIG[type];
  if (!c) return <span style={{ fontSize: 11.5, color: '#64748b' }}>{type}</span>;
  return (
    <span style={{ padding: '2px 8px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.icon} {type}
    </span>
  );
}

function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safe = Math.min(page, totalPages);
  const start = (safe - 1) * PAGE_SIZE;
  return (
    <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: '#64748b' }}>
        Menampilkan {total === 0 ? 0 : start + 1}–{Math.min(start + PAGE_SIZE, total)} dari {total}
      </span>
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onPage(Math.max(1, safe - 1))} disabled={safe === 1}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safe === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safe === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
          <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safe} / {totalPages}</span>
          <button onClick={() => onPage(Math.min(totalPages, safe + 1))} disabled={safe === totalPages}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safe === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safe === totalPages ? 'not-allowed' : 'pointer' }}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ─── Export 1: FeedStockPage ──────────────────────────────────────────────────

export function FeedStockPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FeedStockStatus | 'All'>('All');
  const [page, setPage] = useState(1);

  const stats = FEED_PLATFORM_STATS;

  const alertList = useMemo(() =>
    ADMIN_FEED_LIST.filter(r => r.stockStatus === 'Rendah' || r.stockStatus === 'Habis'),
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alertList.filter(r => {
      if (filterStatus !== 'All' && r.stockStatus !== filterStatus) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.workspaceName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, filterStatus, alertList]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safe = Math.min(page, totalPages);
  const pageRows = filtered.slice((safe - 1) * PAGE_SIZE, safe * PAGE_SIZE);

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Pakan</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Status Stok</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🌾 Status Stok Pakan</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>Peringatan stok rendah & habis — {alertList.length} item perlu perhatian.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Habis" value={stats.outOfStock} icon="🚨" color="#ef4444" />
          <StatCard label="Rendah" value={stats.lowStock} icon="⚠️" color="#f59e0b" />
          <StatCard label="Tersedia" value={stats.inStock} icon="✅" color="#10b981" />
          <StatCard label="Total Item" value={stats.totalRecords} icon="🌾" color="#3b82f6" />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 160 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Pakan</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Nama pakan atau workspace…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Status Stok</span>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as FeedStockStatus | 'All'); setPage(1); }}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="All">Semua Peringatan</option>
              <option value="Habis">Habis</option>
              <option value="Rendah">Rendah</option>
            </select>
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Stok Kritis</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{filtered.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Nama', 'Tipe', 'Kategori', 'Workspace', 'Status', 'Qty', 'Satuan'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🌾</div>
                    <div style={{ fontWeight: 600, color: '#64748b' }}>Tidak ada hasil yang cocok</div>
                  </td></tr>
                ) : pageRows.map((r: AdminFeedRecord, i: number) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.photoEmoji} {r.name}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><TypeBadge type={r.type} /></td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#475569' }}>{r.category}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#475569', whiteSpace: 'nowrap' }}>{r.workspaceName}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><StockBadge status={r.stockStatus} /></td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 700, color: r.stockStatus === 'Habis' ? '#ef4444' : '#d97706' }}>{r.stockQty.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b' }}>{r.stockUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} onPage={setPage} />
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── Export 2: FeedConsumptionPage ────────────────────────────────────────────

export function FeedConsumptionPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FeedType | 'All'>('All');
  const [page, setPage] = useState(1);

  const avgQty = useMemo(() => {
    if (ADMIN_FEED_LIST.length === 0) return 0;
    const sum = ADMIN_FEED_LIST.reduce((acc, r) => acc + r.stockQty, 0);
    return Math.round(sum / ADMIN_FEED_LIST.length);
  }, []);

  const uniqueWorkspaces = useMemo(() =>
    new Set(ADMIN_FEED_LIST.map(r => r.workspaceId)).size, []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ADMIN_FEED_LIST.filter(r => {
      if (filterType !== 'All' && r.type !== filterType) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.workspaceName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safe = Math.min(page, totalPages);
  const pageRows = filtered.slice((safe - 1) * PAGE_SIZE, safe * PAGE_SIZE);

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Pakan</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Konsumsi & Penggunaan</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🌾 Konsumsi & Penggunaan Pakan</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>Ikhtisar konsumsi seluruh pakan platform — {ADMIN_FEED_LIST.length} entri.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Item" value={ADMIN_FEED_LIST.length} icon="🌾" color="#3b82f6" />
          <StatCard label="Workspace" value={uniqueWorkspaces} icon="🏢" color="#10b981" />
          <StatCard label="Rata-rata Qty" value={`${avgQty.toLocaleString('id-ID')} kg`} icon="📊" color="#f59e0b" />
          <StatCard label="Total Stok (ton)" value={FEED_PLATFORM_STATS.totalStockTons.toLocaleString('id-ID')} icon="📦" color="#8b5cf6" />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 160 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Pakan</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Nama atau workspace…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Tipe Pakan</span>
            <select value={filterType} onChange={e => { setFilterType(e.target.value as FeedType | 'All'); setPage(1); }}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="All">Semua Tipe</option>
              <option value="Master Pakan">Master Pakan</option>
              <option value="Pakan Komersial">Pakan Komersial</option>
              <option value="Formula">Formula</option>
            </select>
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Konsumsi Pakan</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{filtered.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Nama', 'Tipe', 'Kategori', 'Workspace', 'Qty', 'Satuan', 'Diperbarui'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🌾</div>
                    <div style={{ fontWeight: 600, color: '#64748b' }}>Tidak ada hasil yang cocok</div>
                  </td></tr>
                ) : pageRows.map((r: AdminFeedRecord, i: number) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.photoEmoji} {r.name}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><TypeBadge type={r.type} /></td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#475569' }}>{r.category}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#475569', whiteSpace: 'nowrap' }}>{r.workspaceName}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{r.stockQty.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b' }}>{r.stockUnit}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap' }}>{r.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} onPage={setPage} />
        </div>
      </div>
    </AdminLayout>
  );
}
