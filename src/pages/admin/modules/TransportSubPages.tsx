// ─── Admin Transport Sub-Pages — ADMIN-SYNC-008 ───────────────────────────────
// Sub-pages untuk domain Workspace Transport.
//
// LIVE   → TransportDeliveryAdmin  (marketplace_transactions WHERE seller=transport ws)
// LIVE   → TransportReportsAdmin   (aggregate marketplace data)
// BLOCKED → TransportVehiclesAdmin  (tidak ada tabel transport_vehicles)
// BLOCKED → TransportDriversAdmin   (tidak ada tabel transport_drivers)
// BLOCKED → TransportScheduleAdmin  (tidak ada tabel transport_schedules)
// BLOCKED → TransportTrackingAdmin  (GPS/tracking tidak tersedia)

import { useEffect, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import { getErrorMessage } from '../../../utils/errorUtils';

// ─── Shared helpers ────────────────────────────────────────────────────────────

function SkeletonBox({ height = 20 }: { height?: number }) {
  return (
    <div style={{
      width: '100%', height, borderRadius: 6,
      background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
      backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite',
    }} />
  );
}

function PageHeader({ title, subtitle, badge }: { title: string; subtitle: string; badge?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{title}</h1>
        {badge && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: badge === 'LIVE' ? 'rgba(22,163,74,0.12)' : badge === 'BLOCKED' ? '#fef2f2' : 'rgba(71,85,105,0.12)', color: badge === 'LIVE' ? '#15803d' : badge === 'BLOCKED' ? '#b91c1c' : '#475569' }}>
            {badge}
          </span>
        )}
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{subtitle}</p>
    </div>
  );
}

function BlockedPage({ title, subtitle, reason, dependency, priority }: {
  title: string; subtitle: string; reason: string; dependency: string; priority: 'high' | 'medium' | 'low';
}) {
  const cfg = {
    high:   { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', label: 'HIGH' },
    medium: { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', label: 'MEDIUM' },
    low:    { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', label: 'LOW'  },
  }[priority];

  return (
    <AdminLayout>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <PageHeader title={title} subtitle={subtitle} badge="BLOCKED" />
        <div style={{ padding: 20, borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 28 }}>🚫</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>Widget Blocked</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Modul ini tidak dapat LIVE karena dependency platform belum tersedia.
              </div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fff', border: `1px solid ${cfg.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Alasan Blocker</div>
              <div style={{ fontSize: 13, color: '#374151' }}>{reason}</div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fff', border: `1px solid ${cfg.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Dependency yang Dibutuhkan</div>
              <code style={{ fontSize: 12, color: '#0f172a', background: '#f8fafc', padding: '4px 8px', borderRadius: 6, display: 'block', lineHeight: 1.6 }}>{dependency}</code>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 12, color: '#92400e' }}>
              ⚠️ Widget ini masuk ke <strong>Blocked Modules Panel</strong> di Admin Dashboard. Akan diaktifkan setelah tabel/dependency tersedia di platform.
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── 1. Vehicles — BLOCKED ────────────────────────────────────────────────────

export function TransportVehiclesAdmin() {
  return (
    <BlockedPage
      title="🚚 Kendaraan Transport"
      subtitle="Fleet management — armada kendaraan transport"
      reason="Tabel transport_vehicles belum tersedia di Supabase. Data kendaraan saat ini disimpan di in-memory store (src/data/transportWorkspaceData.ts) dan tidak persisten."
      dependency="transport_vehicles (id UUID, workspace_id UUID, jenis_kendaraan TEXT, nomor_polisi TEXT, kapasitas_kg INT, status TEXT, tahun_beli INT, jenis_layanan TEXT[], catatan_operasional TEXT, created_at TIMESTAMPTZ)"
      priority="high"
    />
  );
}

// ─── 2. Drivers — BLOCKED ─────────────────────────────────────────────────────

export function TransportDriversAdmin() {
  return (
    <BlockedPage
      title="👷 Driver Transport"
      subtitle="Manajemen pengemudi dan penugasan kendaraan"
      reason="Tabel transport_drivers belum tersedia di Supabase. Data driver saat ini disimpan di in-memory store dan tidak persisten lintas sesi."
      dependency="transport_drivers (id UUID, workspace_id UUID, nama TEXT, nomor_sim TEXT, kategori_sim TEXT, kendaraan_id UUID REFERENCES transport_vehicles, status TEXT, pengalaman_tahun INT, nomor_hp TEXT, catatan TEXT, created_at TIMESTAMPTZ)"
      priority="high"
    />
  );
}

// ─── 3. Schedule — BLOCKED ────────────────────────────────────────────────────

export function TransportScheduleAdmin() {
  return (
    <BlockedPage
      title="📅 Jadwal Transport"
      subtitle="Penjadwalan trip dan rute pengiriman"
      reason="Tabel transport_schedules belum tersedia di Supabase. Jadwal pengiriman tidak dapat disimpan secara persisten."
      dependency="transport_schedules (id UUID, workspace_id UUID, rute TEXT, tanggal DATE, status TEXT, driver_id UUID, kendaraan_id UUID, muatan TEXT, catatan TEXT, created_at TIMESTAMPTZ)"
      priority="medium"
    />
  );
}

// ─── 4. Tracking — BLOCKED ────────────────────────────────────────────────────

export function TransportRouteAdmin() {
  return (
    <BlockedPage
      title="🗺️ Rute & Tracking Transport"
      subtitle="Perencanaan rute pengiriman dan live tracking armada"
      reason="Platform tidak memiliki tabel transport_routes maupun GPS tracking backend. Fitur ini membutuhkan integrasi GPS third-party atau tabel transport_routes yang belum tersedia."
      dependency="transport_routes (id UUID, workspace_id UUID, asal TEXT, tujuan TEXT, jarak_km FLOAT, estimasi_menit INT, biaya_tol INT) + integrasi GPS provider"
      priority="low"
    />
  );
}

// ─── 6. Delivery — LIVE ───────────────────────────────────────────────────────

interface TxRow {
  id: string;
  listing_id: string | null;
  buyer_workspace_id: string | null;
  seller_workspace_id: string | null;
  agreed_price: number | null;
  status: string | null;
  created_at: string | null;
  seller_name?: string | null;
  buyer_name?: string | null;
}

interface DeliveryStats {
  total: number;
  selesai: number;
  diproses: number;
  dibatalkan: number;
}

const TX_STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  Selesai:    { color: '#166534', bg: '#dcfce7', label: 'Selesai' },
  Diproses:   { color: '#1e40af', bg: '#dbeafe', label: 'Diproses' },
  Menunggu:   { color: '#5d4037', bg: '#efebe9', label: 'Menunggu' },
  Dibatalkan: { color: '#991b1b', bg: '#fee2e2', label: 'Dibatalkan' },
  Negosiasi:  { color: '#6d28d9', bg: '#ede9fe', label: 'Negosiasi' },
};

export function TransportDeliveryAdmin() {
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [stats,        setStats]        = useState<DeliveryStats | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Get transport workspace IDs
        const { data: wsData } = await supabase
          .from('workspaces')
          .select('id')
          .eq('type', 'Transport');

        const wsIds = (wsData ?? []).map((w: { id: string }) => w.id);

        if (wsIds.length === 0) {
          if (!cancelled) { setTransactions([]); setStats({ total: 0, selesai: 0, diproses: 0, dibatalkan: 0 }); setLoading(false); }
          return;
        }

        // Get transactions where transport workspace is seller
        const { data: txData, error: txErr } = await supabase
          .from('marketplace_transactions')
          .select('id,listing_id,buyer_workspace_id,seller_workspace_id,agreed_price,status,created_at')
          .in('seller_workspace_id', wsIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (txErr) throw txErr;

        const txRows = (txData ?? []) as TxRow[];

        if (!cancelled) {
          setTransactions(txRows);
          setStats({
            total:       txRows.length,
            selesai:     txRows.filter((t) => t.status === 'Selesai').length,
            diproses:    txRows.filter((t) => t.status === 'Diproses').length,
            dibatalkan:  txRows.filter((t) => t.status === 'Dibatalkan').length,
          });
        }
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PageHeader title="📦 Pengiriman & Transaksi Transport" subtitle="Transaksi marketplace di mana Transport Workspace bertindak sebagai seller" badge="LIVE" />

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Transaksi', value: stats?.total      ?? 0, icon: '📦', color: '#3b82f6' },
            { label: 'Selesai',         value: stats?.selesai    ?? 0, icon: '✅', color: '#16a34a' },
            { label: 'Diproses',        value: stats?.diproses   ?? 0, icon: '🔄', color: '#f59e0b' },
            { label: 'Dibatalkan',      value: stats?.dibatalkan ?? 0, icon: '❌', color: '#dc2626' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
                <span style={{ fontSize: 14 }}>{icon}</span>
              </div>
              {loading ? <div style={{ height: 24, borderRadius: 4, background: '#f1f5f9' }} /> : (
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{value.toLocaleString('id-ID')}</div>
              )}
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Transaksi</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Sumber: marketplace_transactions (seller = Transport workspace)</span>
          </div>
          {loading ? (
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3, 4].map((i) => <SkeletonBox key={i} height={36} />)}
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
              <div>Belum ada transaksi untuk workspace Transport.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['ID Transaksi', 'Buyer Workspace', 'Harga Disepakati', 'Status', 'Tanggal'].map((h) => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const sc = TX_STATUS_CFG[tx.status ?? ''] ?? TX_STATUS_CFG['Menunggu'];
                    return (
                      <tr key={tx.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{tx.id.substring(0, 16)}…</td>
                        <td style={{ padding: '8px 14px', fontSize: 12, color: '#0f172a' }}>{tx.buyer_workspace_id?.substring(0, 12) ?? '—'}…</td>
                        <td style={{ padding: '8px 14px', fontSize: 12, color: '#0f172a', fontWeight: 600 }}>
                          {tx.agreed_price != null ? `Rp ${tx.agreed_price.toLocaleString('id-ID')}` : '—'}
                        </td>
                        <td style={{ padding: '8px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 600 }}>{sc.label}</span>
                        </td>
                        <td style={{ padding: '8px 14px', fontSize: 12, color: '#64748b' }}>
                          {tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── 7. Reports — LIVE ────────────────────────────────────────────────────────

interface ReportStats {
  totalRevenue: number;
  completedTx: number;
  activeListings: number;
  avgOrderValue: number;
}

export function TransportReportsAdmin() {
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastSync,    setLastSync]    = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Get transport workspace IDs
        const { data: wsData } = await supabase
          .from('workspaces')
          .select('id')
          .eq('type', 'Transport');

        const wsIds = (wsData ?? []).map((w: { id: string }) => w.id);

        if (wsIds.length === 0) {
          if (!cancelled) { setReportStats({ totalRevenue: 0, completedTx: 0, activeListings: 0, avgOrderValue: 0 }); setLoading(false); }
          return;
        }

        const [completedRes, listingRes] = await Promise.all([
          supabase
            .from('marketplace_transactions')
            .select('agreed_price')
            .in('seller_workspace_id', wsIds)
            .eq('status', 'Selesai'),
          supabase
            .from('marketplace_listings')
            .select('*', { count: 'exact', head: true })
            .in('workspace_id', wsIds)
            .eq('status', 'Aktif'),
        ]);

        const completedTx  = (completedRes.data ?? []) as { agreed_price: number | null }[];
        const totalRevenue = completedTx.reduce((s, tx) => s + (tx.agreed_price ?? 0), 0);
        const avgOrderValue = completedTx.length > 0 ? totalRevenue / completedTx.length : 0;

        if (!cancelled) {
          setReportStats({
            totalRevenue,
            completedTx:    completedTx.length,
            activeListings: listingRes.count ?? 0,
            avgOrderValue:  Math.round(avgOrderValue),
          });
          setLastSync(new Date().toLocaleTimeString('id-ID'));
        }
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const fmt = (n: number) => n >= 1_000_000
    ? `Rp ${(n / 1_000_000).toFixed(1)} Jt`
    : `Rp ${n.toLocaleString('id-ID')}`;

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <PageHeader title="📊 Laporan Transport" subtitle="Ringkasan kinerja dari marketplace data" />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {lastSync && <span style={{ fontSize: 11, color: '#94a3b8' }}>Sync: {lastSync}</span>}
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: 'rgba(22,163,74,0.12)', color: '#15803d' }}>LIVE</span>
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total Revenue (Selesai)',  value: loading ? '—' : fmt(reportStats?.totalRevenue ?? 0),           icon: '💰', color: '#16a34a' },
            { label: 'Transaksi Selesai',        value: loading ? '—' : String(reportStats?.completedTx ?? 0),        icon: '✅', color: '#3b82f6' },
            { label: 'Listing Aktif',            value: loading ? '—' : String(reportStats?.activeListings ?? 0),     icon: '📋', color: '#f59e0b' },
            { label: 'Rata-rata Nilai Order',    value: loading ? '—' : fmt(reportStats?.avgOrderValue ?? 0),         icon: '📈', color: '#8b5cf6' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>{label}</span>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</span>
              </div>
              {loading ? <SkeletonBox height={28} /> : (
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b' }}>
          <strong>Sumber data:</strong> marketplace_transactions (seller = Transport workspace, status = Selesai) + marketplace_listings (workspace_id = Transport workspace, status = Aktif)
          <br /><strong>Catatan:</strong> Laporan kendaraan, driver, dan jadwal detail tidak tersedia (tabel belum ada di platform).
        </div>
      </div>
    </AdminLayout>
  );
}
