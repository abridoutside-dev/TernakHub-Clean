// ─── Marketplace Sub-Pages ────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  ADMIN_LISTING_LIST,
  MARKETPLACE_PLATFORM_STATS,
  LISTING_STATUS_CONFIG,
  SPECIES_CONFIG,
  type AdminListingRecord,
  type ListingStatus,
} from '../../../data/adminMarketplaceData';

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

function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function StatusBadge({ status }: { status: ListingStatus }) {
  const c = LISTING_STATUS_CONFIG[status];
  if (!c) return <span style={{ fontSize: 11.5, color: '#64748b' }}>{status}</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />{c.label}
    </span>
  );
}

// ─── Export 1: MarketplaceTransactionsPage ────────────────────────────────────
export function MarketplaceTransactionsPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const base = useMemo(() => ADMIN_LISTING_LIST.filter((l: AdminListingRecord) => l.status === 'Sold'), []);

  const filtered = useMemo(() => {
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(l => l.title.toLowerCase().includes(q) || l.workspaceName.toLowerCase().includes(q) || l.sellerName.toLowerCase().includes(q));
  }, [base, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Marketplace</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Riwayat Transaksi</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🤝 Riwayat Transaksi</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>Listing yang telah terjual di platform.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Terjual" value={MARKETPLACE_PLATFORM_STATS.sold} icon="✅" color="#10b981" />
          <StatCard label="Aktif" value={MARKETPLACE_PLATFORM_STATS.active} icon="🟢" color="#3b82f6" />
          <StatCard label="Total Listing" value={MARKETPLACE_PLATFORM_STATS.total} icon="📋" color="#64748b" />
          <StatCard label="Dilaporkan" value={MARKETPLACE_PLATFORM_STATS.reported} icon="🚨" color="#ef4444" />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 360 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Transaksi</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Judul, penjual, atau workspace…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Listing Terjual</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{filtered.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Judul', 'Spesies', 'Workspace Penjual', 'Harga', 'Tanggal'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada transaksi ditemukan</td></tr>
                ) : pageRows.map((l: AdminListingRecord, i) => {
                  const sp = SPECIES_CONFIG[l.species];
                  return (
                    <tr key={l.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{l.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{l.id}</div>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: sp.bg, color: sp.color, fontSize: 11.5, fontWeight: 600 }}>
                          {sp.icon} {l.species}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{l.workspaceName}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{formatRupiah(l.price)}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{l.updatedAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Menampilkan {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── Export 2: MarketplaceReportsPage ─────────────────────────────────────────
export function MarketplaceReportsPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const base = useMemo(() => ADMIN_LISTING_LIST.filter((l: AdminListingRecord) => l.status === 'Reported'), []);

  const filtered = useMemo(() => {
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(l => l.title.toLowerCase().includes(q) || l.sellerName.toLowerCase().includes(q));
  }, [base, search]);

  const hiddenCnt = ADMIN_LISTING_LIST.filter(l => l.status === 'Hidden').length;
  const activeCnt = ADMIN_LISTING_LIST.filter(l => l.status === 'Active').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Marketplace</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Laporan Moderasi</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🚨 Laporan Moderasi</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>Listing yang dilaporkan dan membutuhkan tindakan moderasi.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Dilaporkan" value={MARKETPLACE_PLATFORM_STATS.reported} icon="🚨" color="#ef4444" />
          <StatCard label="Disembunyikan" value={hiddenCnt} icon="🙈" color="#374151" />
          <StatCard label="Total Listing" value={MARKETPLACE_PLATFORM_STATS.total} icon="📋" color="#64748b" />
          <StatCard label="Aktif" value={activeCnt} icon="✅" color="#10b981" />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 360 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Laporan</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Judul atau nama penjual…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Listing Dilaporkan</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{filtered.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Judul', 'Spesies', 'Penjual', 'Jml Laporan', 'Alasan Utama', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada laporan ditemukan</td></tr>
                ) : pageRows.map((l: AdminListingRecord, i) => {
                  const sp = SPECIES_CONFIG[l.species];
                  return (
                    <tr key={l.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{l.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{l.id}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 16 }}>{sp.icon}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{l.sellerName}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#b91c1c' }}>{l.reportSummary?.totalReports ?? 0}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(l.reportSummary?.reasons ?? [])[0] ?? '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}><StatusBadge status={l.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Menampilkan {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
