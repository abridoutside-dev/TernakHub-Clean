// ─── TransportDashboard — ADMIN-SYNC-008 ──────────────────────────────────────
// Dashboard Home khusus Workspace Jasa Transport.
// Dipilih oleh workspaceDashboardRegistry.tsx — tidak di-hardcode di App.tsx.
//
// Sumber data (LIVE dari Supabase):
//   LIVE → workspaces (nama, deskripsi, lokasi workspace)
//   LIVE → marketplace_listings (layanan transport yang ditawarkan)
//   LIVE → marketplace_transactions (transaksi pengiriman)
//   LIVE → activity_log (aktivitas terkini workspace)
//
// Blocked (tidak ada tabel Supabase):
//   BLOCKED → Armada Kendaraan  (transport_vehicles belum ada)
//   BLOCKED → Driver            (transport_drivers belum ada)
//   BLOCKED → Jadwal & Tracking (transport_schedules / GPS belum ada)
//
//   NOT_IMPLEMENTED → AI Insight Transport

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
import { supabase } from '../../lib/supabase';
import {
  WorkspaceCard,
  WorkspaceSectionTitle,
  WorkspaceQuickActions,
  WorkspaceStatGrid,
  type WorkspaceStatItem,
} from '../../components/workspace/WorkspacePageHelpers';

// ─── Tema warna Transport ─────────────────────────────────────────────────────

const COLORS = {
  primary:      '#f59e0b',
  bg:           '#fef3c7',
  text:         '#92400e',
  border:       '#fcd34d',
  actionBg:     '#fffbeb',
  actionText:   '#92400e',
  actionBorder: '#fde68a',
} as const;

// ─── Supabase row types ────────────────────────────────────────────────────────

interface WsRow {
  id: string;
  name: string | null;
  description: string | null;
  province: string | null;
  city: string | null;
  phone: string | null;
  status: string | null;
  created_at: string | null;
}

interface ListingRow {
  id: string;
  title: string;
  status: string | null;
  price: number | null;
  created_at: string;
}

interface TxRow {
  id: string;
  status: string | null;
  agreed_price: number | null;
  created_at: string;
}

interface ActivityRow {
  id: string;
  action_type: string | null;
  description: string | null;
  created_at: string;
}

interface DashboardData {
  workspace: WsRow | null;
  listings: ListingRow[];
  listingCount: number;
  activeListingCount: number;
  transactions: TxRow[];
  txCount: number;
  activities: ActivityRow[];
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[72, 120, 110, 100].map((h) => (
        <div key={h} style={{ height: h, background: '#f3f4f6', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );
}

// ─── Listing status config ────────────────────────────────────────────────────

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

// ─── Ringkasan Stats ──────────────────────────────────────────────────────────

function RingkasanCard({ data }: { data: DashboardData }) {
  const completedTx     = data.transactions.filter((t) => t.status === 'Selesai').length;
  const activeTx        = data.transactions.filter((t) => t.status === 'Diproses').length;

  const items: WorkspaceStatItem[] = [
    { value: data.listingCount.toString(),       label: 'Total Layanan',    icon: '📋', color: COLORS.text, bg: COLORS.bg },
    { value: data.activeListingCount.toString(), label: 'Layanan Aktif',    icon: '✅', color: '#0e7490',   bg: '#cffafe' },
    { value: data.txCount.toString(),            label: 'Total Transaksi',  icon: '💰', color: '#1d4ed8',   bg: '#dbeafe' },
    { value: completedTx.toString(),             label: 'Terselesaikan',    icon: '🏁', color: '#166534',   bg: '#dcfce7' },
    { value: activeTx.toString(),                label: 'Sedang Berjalan',  icon: '🚚', color: '#7c3aed',   bg: '#ede9fe' },
  ];

  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle title="Ringkasan Operasional" action="Live" accentColor={COLORS.primary} />
      <WorkspaceStatGrid stats={items} />
      {data.txCount === 0 && data.listingCount === 0 && (
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
          Belum ada listing atau transaksi tercatat. Buat listing layanan untuk memulai.
        </p>
      )}
    </WorkspaceCard>
  );
}

// ─── Layanan Terbaru ──────────────────────────────────────────────────────────

function LayananCard({ listings }: { listings: ListingRow[] }) {
  const recent = listings.slice(0, 5);
  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle
        title="Layanan Transport"
        action={listings.length > 0 ? `${listings.length} total` : 'Live'}
        accentColor={COLORS.primary}
      />
      {recent.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          Belum ada layanan transport. Tambahkan listing layanan di Marketplace.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recent.map((l) => {
            const sc = LISTING_STATUS[l.status ?? 'Nonaktif'] ?? LISTING_STATUS['Nonaktif'];
            return (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 18 }}>🚚</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {l.price != null ? `Rp ${l.price.toLocaleString('id-ID')}` : 'Harga belum ditetapkan'}
                  </div>
                </div>
                <span style={{ padding: '2px 7px', borderRadius: 12, background: sc.bg, color: sc.color, fontSize: 10.5, fontWeight: 600, flexShrink: 0 }}>
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

// ─── Transaksi Terbaru ─────────────────────────────────────────────────────────

function TransaksiCard({ transactions }: { transactions: TxRow[] }) {
  const recent = transactions.slice(0, 5);
  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle
        title="Transaksi Terbaru"
        action={transactions.length > 0 ? `${transactions.length} total` : 'Live'}
        accentColor={COLORS.primary}
      />
      {recent.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          Belum ada transaksi. Transaksi akan muncul setelah layanan transport dipesan.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recent.map((tx) => {
            const sc = TX_STATUS[tx.status ?? 'Menunggu'] ?? TX_STATUS['Menunggu'];
            return (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 18 }}>💰</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{tx.id.substring(0, 14)}…</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {tx.agreed_price != null ? `Rp ${tx.agreed_price.toLocaleString('id-ID')}` : 'Harga belum disepakati'}{' · '}
                    {tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                </div>
                <span style={{ padding: '2px 7px', borderRadius: 12, background: sc.bg, color: sc.color, fontSize: 10.5, fontWeight: 600, flexShrink: 0 }}>{sc.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </WorkspaceCard>
  );
}

// ─── Aktivitas Terkini ────────────────────────────────────────────────────────

function AktivitasCard({ activities }: { activities: ActivityRow[] }) {
  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle title="Aktivitas Terkini" action="Live" accentColor={COLORS.primary} />
      {activities.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          Belum ada aktivitas tercatat untuk workspace ini.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {activities.map((act) => (
            <div key={act.id} style={{ display: 'flex', gap: 10, padding: '7px 10px', borderRadius: 8, background: '#f8fafc' }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🔔</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {act.description ?? act.action_type ?? 'Aktivitas workspace'}
                </div>
                <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                  {act.created_at ? new Date(act.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </WorkspaceCard>
  );
}

// ─── Blocked Sections ─────────────────────────────────────────────────────────

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

export default function TransportDashboard(): React.ReactElement {
  const { id: workspaceId = '' } = useParams<{ id: string }>();
  const config = getWorkspaceDashboardConfig('Transport');

  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [wsRes, listingRes, listingActiveRes, txRes, activityRes] = await Promise.all([
          supabase
            .from('workspaces')
            .select('id,name,description,province,city,phone,status,created_at')
            .eq('id', workspaceId)
            .single(),
          supabase
            .from('marketplace_listings')
            .select('id,title,status,price,created_at', { count: 'exact' })
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false })
            .limit(5),
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
            .limit(5),
          supabase
            .from('activity_log')
            .select('id,action_type,description,created_at')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false })
            .limit(8),
        ]);

        if (!cancelled) {
          setData({
            workspace:          (wsRes.data as WsRow | null),
            listings:           (listingRes.data ?? []) as ListingRow[],
            listingCount:       listingRes.count ?? 0,
            activeListingCount: listingActiveRes.count ?? 0,
            transactions:       (txRes.data ?? []) as TxRow[],
            txCount:            txRes.count ?? 0,
            activities:         (activityRes.data ?? []) as ActivityRow[],
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
        <p style={{ fontWeight: 700, color: '#b91c1c' }}>Gagal memuat dashboard</p>
        <p style={{ fontSize: 12 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: 720, margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <WorkspaceCard style={{ marginBottom: 14, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 36 }}>🚚</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspaceName}</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: COLORS.text, opacity: 0.8 }}>
              {data?.workspace?.description ?? 'Layanan Transportasi Ternak & Logistik'}
            </p>
            {(data?.workspace?.city || data?.workspace?.province) && (
              <p style={{ margin: '4px 0 0', fontSize: 11, color: COLORS.text, opacity: 0.7 }}>
                📍 {[data?.workspace?.city, data?.workspace?.province].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <span style={{ padding: '3px 9px', borderRadius: 20, background: 'rgba(255,255,255,0.6)', color: COLORS.text, fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>Live</span>
        </div>
      </WorkspaceCard>

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <WorkspaceQuickActions
        actions={config.quickActions}
        accentColor={COLORS.primary}
        workspaceId={workspaceId}
      />

      {/* ── Ringkasan ───────────────────────────────────────────────────── */}
      {data && <RingkasanCard data={data} />}

      {/* ── Layanan Transport (Listings) ────────────────────────────────── */}
      {data && <LayananCard listings={data.listings} />}

      {/* ── Transaksi Terbaru ───────────────────────────────────────────── */}
      {data && <TransaksiCard transactions={data.transactions} />}

      {/* ── Armada Kendaraan — BLOCKED ──────────────────────────────────── */}
      <BlockedSection
        title="🚚 Armada Kendaraan"
        icon="🚫"
        reason="Tabel transport_vehicles belum tersedia di Supabase. Data kendaraan belum dapat ditampilkan secara live."
      />

      {/* ── Driver — BLOCKED ────────────────────────────────────────────── */}
      <BlockedSection
        title="👷 Data Driver"
        icon="🚫"
        reason="Tabel transport_drivers belum tersedia di Supabase. Data pengemudi belum dapat ditampilkan secara live."
      />

      {/* ── Aktivitas Terkini ───────────────────────────────────────────── */}
      {data && <AktivitasCard activities={data.activities} />}

      {/* ── AI Insight — NOT IMPLEMENTED ───────────────────────────────── */}
      <WorkspaceCard style={{ marginBottom: 14 }}>
        <WorkspaceSectionTitle title="🤖 AI Insight Transport" action="Not Implemented" accentColor="#94a3b8" />
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(71,85,105,0.06)', border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b' }}>
          AI Insight adalah consumer terhadap data platform. Backend AI belum diintegrasikan. Akan aktif setelah AI service platform tersedia.
        </div>
      </WorkspaceCard>

    </div>
  );
}
