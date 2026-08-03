// ─── TransportOperational — ADMIN-SYNC-008 ───────────────────────────────────
// Dashboard Operasional khusus Workspace Jasa Transport.
// Dipilih oleh workspaceOperationalRegistry.tsx — tidak di-hardcode di App.tsx.
//
// Sumber data (LIVE dari Supabase):
//   LIVE → workspaces (profil workspace)
//   LIVE → marketplace_listings (layanan aktif)
//   LIVE → marketplace_transactions (order masuk & histori)
//
// Blocked (tidak ada tabel Supabase):
//   BLOCKED → Armada Kendaraan (transport_vehicles belum ada)
//   BLOCKED → Driver (transport_drivers belum ada)
//   BLOCKED → Jadwal & Rute (transport_schedules belum ada)
//   BLOCKED → GPS Tracking (belum ada integrasi GPS)
//
// NOT_IMPLEMENTED → AI Insight Transport

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getWorkspaceOperationalConfig } from '../../config/workspaceOperationalRegistry';
import { getWorkspaceDashboardConfig }    from '../../config/workspaceDashboardRegistry';
import { supabase } from '../../lib/supabase';
import {
  WorkspaceCard,
  WorkspaceSectionTitle,
  WorkspacePageHeader,
  WorkspaceQuickActions,
  WorkspaceStatGrid,
  type WorkspaceStatItem,
} from '../../components/workspace/WorkspacePageHelpers';

// ─── Tema warna Transport ─────────────────────────────────────────────────────

const COLORS = {
  primary: '#f59e0b',
  bg:      '#fef3c7',
  text:    '#92400e',
  border:  '#fcd34d',
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WsRow {
  id: string;
  name: string | null;
  description: string | null;
  province: string | null;
  city: string | null;
  status: string | null;
}

interface ListingRow {
  id: string;
  title: string;
  status: string | null;
  price: number | null;
  kategori_slug: string | null;
  created_at: string;
}

interface TxRow {
  id: string;
  status: string | null;
  agreed_price: number | null;
  created_at: string;
}

interface OpData {
  workspace: WsRow | null;
  listings: ListingRow[];
  listingCount: number;
  activeListingCount: number;
  inactiveListing: number;
  transactions: TxRow[];
  txCount: number;
  txSelesai: number;
  txProses: number;
  txBatal: number;
  totalRevenue: number;
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[72, 110, 130, 100].map((h) => (
        <div key={h} style={{ height: h, background: '#f3f4f6', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );
}

// ─── Listing status ───────────────────────────────────────────────────────────

const LISTING_STATUS: Record<string, { color: string; bg: string }> = {
  Aktif:      { color: '#166534', bg: '#dcfce7' },
  Nonaktif:   { color: '#6b7280', bg: '#f3f4f6' },
  Ditutup:    { color: '#991b1b', bg: '#fee2e2' },
  Diarsipkan: { color: '#92400e', bg: '#fef3c7' },
};

const TX_STATUS: Record<string, { color: string; bg: string; label: string }> = {
  Selesai:    { color: '#166534', bg: '#dcfce7', label: 'Selesai' },
  Diproses:   { color: '#1e40af', bg: '#dbeafe', label: 'Diproses' },
  Menunggu:   { color: '#5d4037', bg: '#efebe9', label: 'Menunggu' },
  Dibatalkan: { color: '#991b1b', bg: '#fee2e2', label: 'Dibatalkan' },
  Negosiasi:  { color: '#6d28d9', bg: '#ede9fe', label: 'Negosiasi' },
};

// ─── Layanan (Listings) Section ───────────────────────────────────────────────

function LayananSection({ listings, listingCount }: { listings: ListingRow[]; listingCount: number }) {
  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle
        title="Layanan Transport Terdaftar"
        action={listingCount > 0 ? `${listingCount} layanan` : 'Live'}
        accentColor={COLORS.primary}
      />
      {listings.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-muted)', fontSize: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <div>Belum ada layanan transport. Tambahkan layanan di Marketplace untuk memulai operasional.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {listings.map((l) => {
            const sc = LISTING_STATUS[l.status ?? 'Nonaktif'] ?? LISTING_STATUS['Nonaktif'];
            return (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>🚛</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                    {l.price != null && (
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Rp {l.price.toLocaleString('id-ID')}</span>
                    )}
                    {l.kategori_slug && (
                      <span style={{ fontSize: 10.5, color: '#94a3b8' }}>#{l.kategori_slug}</span>
                    )}
                  </div>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: 12, background: sc.bg, color: sc.color, fontSize: 10.5, fontWeight: 600, flexShrink: 0 }}>
                  {l.status ?? '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </WorkspaceCard>
  );
}

// ─── Transaksi Operasional Section ─────────────────────────────────────────────

function TransaksiOperasionalSection({ transactions, txCount }: { transactions: TxRow[]; txCount: number }) {
  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle
        title="Order Masuk"
        action={txCount > 0 ? `${txCount} transaksi` : 'Live'}
        accentColor={COLORS.primary}
      />
      {transactions.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-muted)', fontSize: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
          <div>Belum ada order masuk. Order akan muncul setelah pembeli memesan layanan transport.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {transactions.map((tx) => {
            const sc = TX_STATUS[tx.status ?? 'Menunggu'] ?? TX_STATUS['Menunggu'];
            return (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>📦</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{tx.id.substring(0, 16)}…</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                    {tx.agreed_price != null ? `Rp ${tx.agreed_price.toLocaleString('id-ID')}` : 'Harga dinego'}{' · '}
                    {tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: 12, background: sc.bg, color: sc.color, fontSize: 10.5, fontWeight: 600, flexShrink: 0 }}>{sc.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </WorkspaceCard>
  );
}

// ─── Blocked Section ──────────────────────────────────────────────────────────

function BlockedSection({ title, icon, reason }: { title: string; icon: string; reason: string }) {
  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle title={title} action="Blocked" accentColor="#dc2626" />
      <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', marginBottom: 2 }}>Modul Belum Tersedia</div>
          <div style={{ fontSize: 11.5, color: '#475569' }}>{reason}</div>
        </div>
      </div>
    </WorkspaceCard>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TransportOperational(): React.ReactElement {
  const { id: workspaceId = '' } = useParams<{ id: string }>();

  const config          = getWorkspaceOperationalConfig('Transport');
  const dashboardConfig = getWorkspaceDashboardConfig('Transport');

  const [data,    setData]    = useState<OpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [wsRes, listingRes, listingActiveRes, txRes] = await Promise.all([
          supabase
            .from('workspaces')
            .select('id,name,description,province,city,status')
            .eq('id', workspaceId)
            .single(),
          supabase
            .from('marketplace_listings')
            .select('id,title,status,price,kategori_slug,created_at', { count: 'exact' })
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('marketplace_listings')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .eq('status', 'Aktif'),
          supabase
            .from('marketplace_transactions')
            .select('id,status,agreed_price,created_at', { count: 'exact' })
            .eq('seller_workspace_id', workspaceId)
            .order('created_at', { ascending: false })
            .limit(20),
        ]);

        if (!cancelled) {
          const txRows     = (txRes.data ?? []) as TxRow[];
          const totalRev   = txRows
            .filter((t) => t.status === 'Selesai')
            .reduce((s, t) => s + (t.agreed_price ?? 0), 0);

          setData({
            workspace:          (wsRes.data as WsRow | null),
            listings:           (listingRes.data ?? []) as ListingRow[],
            listingCount:       listingRes.count ?? 0,
            activeListingCount: listingActiveRes.count ?? 0,
            inactiveListing:    (listingRes.count ?? 0) - (listingActiveRes.count ?? 0),
            transactions:       txRows,
            txCount:            txRes.count ?? 0,
            txSelesai:          txRows.filter((t) => t.status === 'Selesai').length,
            txProses:           txRows.filter((t) => t.status === 'Diproses').length,
            txBatal:            txRows.filter((t) => t.status === 'Dibatalkan').length,
            totalRevenue:       totalRev,
          });
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [workspaceId]);

  const workspaceName = data?.workspace?.name ?? config.title;

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats: WorkspaceStatItem[] = data ? [
    { value: data.listingCount.toString(),       label: 'Total Layanan',  icon: '📋', color: COLORS.text, bg: COLORS.bg },
    { value: data.activeListingCount.toString(), label: 'Layanan Aktif',  icon: '✅', color: '#0e7490',   bg: '#cffafe' },
    { value: data.txCount.toString(),            label: 'Total Order',    icon: '📦', color: '#1d4ed8',   bg: '#dbeafe' },
    { value: data.txSelesai.toString(),          label: 'Order Selesai',  icon: '✅', color: '#166534',   bg: '#dcfce7' },
    {
      value: data.totalRevenue >= 1_000_000
        ? `${(data.totalRevenue / 1_000_000).toFixed(1)} Jt`
        : data.totalRevenue.toLocaleString('id-ID'),
      label: 'Revenue (Selesai)', icon: '💰', color: '#7c3aed', bg: '#ede9fe',
    },
  ] : [];

  if (loading) {
    return (
      <div style={{ padding: '16px 16px 40px', maxWidth: 720, margin: '0 auto' }}>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
        <p style={{ fontSize: 28 }}>⚠️</p>
        <p style={{ fontWeight: 700, color: '#b91c1c' }}>Gagal memuat data operasional</p>
        <p style={{ fontSize: 12 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: 720, margin: '0 auto' }}>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <WorkspacePageHeader
        icon="🚚"
        label="WORKSPACE TRANSPORT"
        title={workspaceName}
        subtitle={data?.workspace?.description ?? 'Layanan Transportasi Ternak & Logistik'}
        accentColor={COLORS.primary}
        iconBg={COLORS.bg}
      />

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <WorkspaceQuickActions
        actions={dashboardConfig.quickActions}
        workspaceId={workspaceId}
        colors={{ bg: COLORS.bg, border: COLORS.border, text: COLORS.text, accent: COLORS.primary }}
      />

      {/* ── Stats Operasional ───────────────────────────────────────────── */}
      {data && (
        <WorkspaceCard style={{ marginBottom: 14 }}>
          <WorkspaceSectionTitle title="Statistik Operasional" action="Live" accentColor={COLORS.primary} />
          <WorkspaceStatGrid items={stats} />
        </WorkspaceCard>
      )}

      {/* ── Layanan Transport ────────────────────────────────────────────── */}
      {data && <LayananSection listings={data.listings} listingCount={data.listingCount} />}

      {/* ── Order Masuk (Transaksi) ──────────────────────────────────────── */}
      {data && <TransaksiOperasionalSection transactions={data.transactions} txCount={data.txCount} />}

      {/* ── Armada Kendaraan — BLOCKED ──────────────────────────────────── */}
      <BlockedSection
        title="🚚 Armada Kendaraan"
        icon="🚫"
        reason="Tabel transport_vehicles belum tersedia di Supabase. Manajemen armada tidak dapat ditampilkan secara live."
      />

      {/* ── Driver — BLOCKED ────────────────────────────────────────────── */}
      <BlockedSection
        title="👷 Manajemen Driver"
        icon="🚫"
        reason="Tabel transport_drivers belum tersedia di Supabase. Data driver tidak dapat ditampilkan secara live."
      />

      {/* ── Jadwal & Rute — BLOCKED ─────────────────────────────────────── */}
      <BlockedSection
        title="📅 Jadwal & Rute"
        icon="🚫"
        reason="Tabel transport_schedules dan transport_routes belum tersedia di Supabase."
      />

      {/* ── Tracking — BLOCKED ──────────────────────────────────────────── */}
      <BlockedSection
        title="🗺️ Live Tracking"
        icon="🚫"
        reason="GPS tracking tidak tersedia. Platform belum terintegrasi dengan provider GPS third-party."
      />

      {/* ── AI Insight — NOT IMPLEMENTED ───────────────────────────────── */}
      <WorkspaceCard style={{ marginBottom: 14 }}>
        <WorkspaceSectionTitle title="🤖 AI Insight Transport" action="Not Implemented" accentColor="#94a3b8" />
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(71,85,105,0.06)', border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b' }}>
          AI Insight belum tersedia. Akan aktif setelah AI service platform diintegrasikan.
        </div>
      </WorkspaceCard>

    </div>
  );
}
