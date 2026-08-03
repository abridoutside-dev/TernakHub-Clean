// ─── Marketplace Sub-Pages — ADMIN-MARKETPLACE-001 ───────────────────────────
// ADMIN-MARKETPLACE-001: All dummy data removed. Data sourced live from Supabase
// `marketplace_listings`. Shows 0 / empty state when no data.
// No hardcoded values.

import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import {
  LISTING_STATUS_CONFIG,
  SPECIES_CONFIG,
  type AdminListingRecord,
  type ListingStatus,
  type ListingCategory,
  type LivestockSpecies,
  type VerificationStatus,
} from '../../../data/adminMarketplaceData';
import {
  repoGetMarketplaceReportSummary,
  type MarketplaceReportSummaryRow,
} from '../../../repositories/marketplaceRepository';

// ─── Supabase row shape (same as MarketplaceModule) ──────────────────────────

interface ListingRow {
  id: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  species?: string | null;
  price?: number | null;
  status?: string | null;
  verification?: string | null;
  location?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  seller_id?: string | null;
  seller_name?: string | null;
  seller_email?: string | null;
  workspace_id?: string | null;
  workspace_name?: string | null;
  workspace_type?: string | null;
}

const VALID_STATUSES: ListingStatus[] = ['Active', 'Sold', 'Draft', 'Hidden', 'Reported'];
const VALID_SPECIES: LivestockSpecies[] = ['Domba', 'Kambing', 'Sapi', 'Kerbau', 'Kuda'];
const VALID_VERIFS: VerificationStatus[] = ['Verified', 'Unverified', 'Pending'];
const VALID_CATS: ListingCategory[] = ['Ternak Hidup', 'Bibit Ternak', 'Produk Ternak', 'Pakan & Suplemen', 'Peralatan'];
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#0ea5e9'];

function adaptListing(r: ListingRow): AdminListingRecord {
  const name = r.seller_name ?? r.seller_email?.split('@')[0] ?? '—';
  const initials = name.substring(0, 2).toUpperCase();
  const color = COLORS[(r.id.charCodeAt(0) ?? 0) % COLORS.length];
  return {
    id: r.id,
    title: r.title ?? '—',
    description: r.description ?? '—',
    category: (VALID_CATS.includes(r.category as ListingCategory) ? r.category : 'Ternak Hidup') as ListingCategory,
    species: (VALID_SPECIES.includes(r.species as LivestockSpecies) ? r.species : 'Sapi') as LivestockSpecies,
    price: r.price ?? 0,
    status: (VALID_STATUSES.includes(r.status as ListingStatus) ? r.status : 'Active') as ListingStatus,
    verification: (VALID_VERIFS.includes(r.verification as VerificationStatus) ? r.verification : 'Unverified') as VerificationStatus,
    createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    createdDaysAgo: r.created_at ? Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000) : 0,
    updatedAt: r.updated_at ? new Date(r.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    photoColor: color,
    photoEmoji: '🐄',
    sellerId: r.seller_id ?? '—',
    sellerName: name,
    sellerEmail: r.seller_email ?? '—',
    sellerPhone: '—',
    sellerAvatarInitials: initials,
    sellerAvatarColor: color,
    sellerRating: 0,
    sellerJoinedAt: '—',
    sellerTotalListings: 0,
    sellerCompletedSales: 0,
    workspaceId: r.workspace_id ?? '—',
    workspaceName: r.workspace_name ?? '—',
    workspaceType: r.workspace_type ?? '—',
    workspacePlan: 'Free',
    workspaceVerified: false,
    workspaceLocation: r.location ?? '—',
    location: r.location ?? '—',
    viewCount: 0,
    favoriteCount: 0,
    imageCount: 0,
    weight: '—',
    age: '—',
    livestockId: null,
    livestockBreed: null,
    livestockAge: null,
    livestockWeight: null,
    livestockHealthStatus: null,
    livestockVaccinated: false,
    timeline: [],
    reportSummary: { totalReports: 0, pendingReports: 0, resolvedReports: 0, reasons: [], lastReportedAt: null },
    notes: null,
  };
}

async function fetchCountByStatus(status: string): Promise<number> {
  const { count, error } = await supabase
    .from('marketplace_listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', status);
  if (error || count === null) return 0;
  return count;
}

async function fetchTotalCount(): Promise<number> {
  const { count, error } = await supabase
    .from('marketplace_listings')
    .select('*', { count: 'exact', head: true });
  if (error || count === null) return 0;
  return count;
}

// ─── Shared Atoms ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function StatCard({ label, value, icon, color, loading }: {
  label: string; value: number; icon: string; color: string; loading?: boolean;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{label}</span>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</span>
      </div>
      {loading
        ? <div style={{ width: 60, height: 26, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite' }} />
        : <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value.toLocaleString('id-ID')}</div>
      }
    </div>
  );
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

function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

// ─── Export 1: MarketplaceTransactionsPage ────────────────────────────────────

export function MarketplaceTransactionsPage() {
  const [rows, setRows]         = useState<AdminListingRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Stats
  const [statSold, setStatSold]       = useState(0);
  const [statActive, setStatActive]   = useState(0);
  const [statTotal, setStatTotal]     = useState(0);
  const [statReported, setStatReported] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const [search, setSearch]         = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const { data, error: fetchErr } = await supabase
          .from('marketplace_listings')
          .select('*')
          .eq('status', 'Sold')
          .order('updated_at', { ascending: false })
          .limit(500);
        if (cancelled) return;
        if (fetchErr) { setError(fetchErr.message); return; }
        setRows((data ?? []).map(adaptListing));
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatsLoading(true);
        const [total, sold, active, reported] = await Promise.all([
          fetchTotalCount(),
          fetchCountByStatus('Sold'),
          fetchCountByStatus('Active'),
          fetchCountByStatus('Reported'),
        ]);
        if (cancelled) return;
        setStatTotal(total);
        setStatSold(sold);
        setStatActive(active);
        setStatReported(reported);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.workspaceName.toLowerCase().includes(q) ||
      l.sellerName.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Marketplace</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Riwayat Transaksi</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🤝 Riwayat Transaksi</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Listing yang telah terjual — data dari Supabase <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>marketplace_listings</code> (status = Sold).
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Terjual"      value={statSold}     icon="✅" color="#10b981" loading={statsLoading} />
          <StatCard label="Aktif"        value={statActive}   icon="🟢" color="#3b82f6" loading={statsLoading} />
          <StatCard label="Total Listing" value={statTotal}   icon="📋" color="#64748b" loading={statsLoading} />
          <StatCard label="Dilaporkan"   value={statReported} icon="🚨" color="#ef4444" loading={statsLoading} />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 360 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Transaksi</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Judul, penjual, atau workspace…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Listing Terjual</span>
              <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>
                {loading ? '…' : filtered.length}
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{loading ? 'Memuat…' : 'Data dari Supabase'}</span>
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} style={{ padding: '12px 14px' }}>
                      <div style={{ height: 18, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite' }} />
                    </td></tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
                      {search ? 'Tidak ada transaksi yang sesuai pencarian.' : 'Belum ada listing terjual di Supabase.'}
                    </td>
                  </tr>
                ) : pageRows.map((l, i) => {
                  const sp = SPECIES_CONFIG[l.species];
                  return (
                    <tr key={l.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{l.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{l.id.substring(0, 16)}…</div>
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
  const [rows, setRows]         = useState<AdminListingRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Stats
  const [statReported, setStatReported]         = useState(0);
  const [statHidden, setStatHidden]             = useState(0);
  const [statTotal, setStatTotal]               = useState(0);
  const [statActive, setStatActive]             = useState(0);
  const [statTotalReports, setStatTotalReports] = useState(0);
  const [statsLoading, setStatsLoading]         = useState(true);

  const [search, setSearch]           = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const [{ data, error: fetchErr }, summaries] = await Promise.all([
          supabase
            .from('marketplace_listings')
            .select('*')
            .eq('status', 'Reported')
            .order('updated_at', { ascending: false })
            .limit(500),
          repoGetMarketplaceReportSummary().catch((): MarketplaceReportSummaryRow[] => []),
        ]);
        if (cancelled) return;
        if (fetchErr) { setError(fetchErr.message); return; }

        // Build summary map keyed by listing_id
        const summaryMap = new Map<string, MarketplaceReportSummaryRow>(
          summaries.map(s => [s.listing_id, s]),
        );

        // Enrich each listing with real report data from v_marketplace_report_summary
        const enriched = (data ?? []).map(r => {
          const base = adaptListing(r);
          const s = summaryMap.get(r.id);
          if (s) {
            base.reportSummary = {
              totalReports:    s.total_reports    ?? 0,
              pendingReports:  s.pending_reports  ?? 0,
              resolvedReports: s.resolved_reports ?? 0,
              reasons:         s.primary_reason ? [s.primary_reason] : [],
              lastReportedAt:  s.last_reported_at ?? null,
            };
          }
          return base;
        });

        setRows(enriched);

        // Total reports = sum of all total_reports across the view
        const totalReports = summaries.reduce((acc, s) => acc + (s.total_reports ?? 0), 0);
        setStatTotalReports(totalReports);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatsLoading(true);
        const [total, reported, hidden, active] = await Promise.all([
          fetchTotalCount(),
          fetchCountByStatus('Reported'),
          fetchCountByStatus('Hidden'),
          fetchCountByStatus('Active'),
        ]);
        if (cancelled) return;
        setStatTotal(total);
        setStatReported(reported);
        setStatHidden(hidden);
        setStatActive(active);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.sellerName.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Marketplace</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Laporan Moderasi</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🚨 Laporan Moderasi</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Listing yang dilaporkan dan membutuhkan tindakan moderasi — data dari Supabase <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>marketplace_listings</code> (status = Reported).
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Dilaporkan"    value={statReported}     icon="🚨" color="#ef4444" loading={statsLoading} />
          <StatCard label="Disembunyikan" value={statHidden}       icon="🙈" color="#374151" loading={statsLoading} />
          <StatCard label="Total Listing" value={statTotal}        icon="📋" color="#64748b" loading={statsLoading} />
          <StatCard label="Aktif"         value={statActive}       icon="✅" color="#10b981" loading={statsLoading} />
          <StatCard label="Total Laporan" value={statTotalReports} icon="📊" color="#f59e0b" loading={loading} />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 360 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Laporan</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Judul atau nama penjual…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Listing Dilaporkan</span>
              <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>
                {loading ? '…' : filtered.length}
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{loading ? 'Memuat…' : 'Data dari Supabase'}</span>
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} style={{ padding: '12px 14px' }}>
                      <div style={{ height: 18, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite' }} />
                    </td></tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🚨</div>
                      {search ? 'Tidak ada laporan yang sesuai pencarian.' : 'Tidak ada listing dengan status Reported di Supabase.'}
                    </td>
                  </tr>
                ) : pageRows.map((l, i) => {
                  const sp = SPECIES_CONFIG[l.species];
                  return (
                    <tr key={l.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{l.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{l.id.substring(0, 16)}…</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 16 }}>{sp.icon}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{l.sellerName}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#b91c1c' }}>
                        {l.reportSummary?.totalReports ?? 0}
                      </td>
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
