// ─── DrugStoreDashboard — ADMIN-SYNC-006 FINAL ───────────────────────────────
// Dashboard Home khusus Workspace Toko Obat Hewan.
// Dipilih oleh workspaceDashboardRegistry.tsx — tidak di-hardcode di App.tsx.
//
// Sumber data (semua LIVE dari Supabase):
//   LIVE → workspaces, stok_obat, stok_obat_masuk, stok_obat_keluar
//   LIVE → activity_log, drug_store_suppliers
//   LIVE → drug_store_orders (Pesanan Terbaru, Ringkasan Penjualan)
//   LIVE → drug_store_sales  (Ringkasan Penjualan)
//   NOT_IMPLEMENTED → AI Insight (service belum diintegrasikan)

import React from 'react';
import { useParams } from 'react-router-dom';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
import {
  useDrugStoreDashboardData,
  getLowStokObatItems,
  getNearExpiryStokItems,
  getExpiryStatusFromDate,
  formatNumber,
  formatRupiah,
  formatRelativeTime,
  formatExpiryDate,
  formatOrderDate,
} from '../../hooks/useDrugStoreDashboardData';
import {
  WorkspaceCard,
  WorkspaceSectionTitle,
  WorkspaceQuickActions,
} from '../../components/workspace/WorkspacePageHelpers';
import type { StokObatDbRow } from '../../types/stokObat';
import type { ActivityLogDbRow } from '../../types/activityLog';
import type { DrugStoreOrderDbRow, DrugStorePenjualanSummary } from '../../types/drugStore';

// ─── Tema warna Toko Obat ─────────────────────────────────────────────────────

const COLORS = {
  primary:      '#0097a7',
  bg:           '#e0f7fa',
  text:         '#006064',
  border:       '#80deea',
  actionBg:     '#e0f7fa',
  actionText:   '#006064',
  actionBorder: '#80deea',
} as const;

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[72, 120, 110, 160].map((h) => (
        <div
          key={h}
          style={{ height: h, background: '#f3f4f6', borderRadius: 10, animation: 'pulse 1.5s infinite' }}
        />
      ))}
    </div>
  );
}

// ─── Ringkasan Penjualan Card — LIVE ─────────────────────────────────────────

function RingkasanPenjualanCard({ penjualan }: { penjualan: DrugStorePenjualanSummary }) {
  const growthLabel =
    penjualan.growthPercent === null
      ? '—'
      : penjualan.growthPercent >= 0
        ? `+${penjualan.growthPercent}%`
        : `${penjualan.growthPercent}%`;

  const growthColor =
    penjualan.growthPercent === null
      ? '#6b7280'
      : penjualan.growthPercent >= 0
        ? '#166534'
        : '#991b1b';

  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle title="Ringkasan Penjualan" action="Live" accentColor={COLORS.primary} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 10 }}>
        <div style={{ background: COLORS.bg, borderRadius: 12, padding: 13 }}>
          <p style={{ margin: 0, fontSize: 11, color: COLORS.text, fontWeight: 700 }}>💰 Penjualan Hari Ini</p>
          <p style={{ margin: '5px 0 0', fontSize: 17, fontWeight: 800, color: COLORS.text, wordBreak: 'break-all' }}>
            {formatRupiah(penjualan.todayRevenue)}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: growthColor, fontWeight: 700 }}>
            {growthLabel} vs kemarin
          </p>
        </div>
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 13 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#166534', fontWeight: 700 }}>🧾 Order Hari Ini</p>
          <p style={{ margin: '5px 0 0', fontSize: 20, fontWeight: 800, color: '#15803d' }}>
            {formatNumber(penjualan.todayOrderCount)}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#166534' }}>total transaksi penjualan</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '8px 11px' }}>
          <p style={{ margin: 0, fontSize: 10, color: '#166534', fontWeight: 700 }}>✅ Selesai</p>
          <p style={{ margin: '3px 0 0', fontSize: 16, fontWeight: 800, color: '#15803d' }}>
            {formatNumber(penjualan.completedCount)}
          </p>
        </div>
        <div style={{ background: '#fff7ed', borderRadius: 10, padding: '8px 11px' }}>
          <p style={{ margin: 0, fontSize: 10, color: '#9a3412', fontWeight: 700 }}>⏳ Diproses</p>
          <p style={{ margin: '3px 0 0', fontSize: 16, fontWeight: 800, color: '#7c2d12' }}>
            {formatNumber(penjualan.processingCount)}
          </p>
        </div>
      </div>
      {penjualan.todayOrderCount === 0 && (
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
          Belum ada penjualan hari ini. Data akan muncul setelah transaksi pertama dicatat.
        </p>
      )}
    </WorkspaceCard>
  );
}

// ─── Pesanan Terbaru Card — LIVE ──────────────────────────────────────────────

const ORDER_STATUS_CFG: Record<string, { color: string; bg: string }> = {
  Baru:       { color: '#1d4ed8', bg: '#dbeafe' },
  Diproses:   { color: '#b45309', bg: '#fef3c7' },
  Selesai:    { color: '#166534', bg: '#dcfce7' },
  Dibatalkan: { color: '#991b1b', bg: '#fee2e2' },
};

function PesananTerbaruCard({ orders }: { orders: DrugStoreOrderDbRow[] }) {
  if (orders.length === 0) {
    return (
      <WorkspaceCard style={{ marginBottom: 14 }}>
        <WorkspaceSectionTitle title="Pesanan Terbaru" action="Live" accentColor={COLORS.primary} />
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          Belum ada pesanan. Pesanan pertama akan muncul di sini.
        </p>
      </WorkspaceCard>
    );
  }

  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle title="Pesanan Terbaru" action={`${orders.length} order`} accentColor={COLORS.primary} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {orders.map((order) => {
          const statusCfg = ORDER_STATUS_CFG[order.status] ?? { color: '#6b7280', bg: '#f3f4f6' };
          const isPembelian = order.order_type === 'Pembelian';
          return (
            <div
              key={order.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 11px', borderRadius: 10,
                background: isPembelian ? '#eff6ff' : '#f0fdf4',
                border: `1px solid ${isPembelian ? '#bfdbfe' : '#bbf7d0'}`,
              }}
            >
              <span style={{ fontSize: 18 }}>{isPembelian ? '🛒' : '🧾'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {order.order_number ?? `Order #${order.id.slice(0, 8)}`}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                  {order.order_type} · {formatOrderDate(order.order_date)}
                  {order.customer_name ? ` · ${order.customer_name}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: statusCfg.color,
                  background: statusCfg.bg, padding: '2px 6px', borderRadius: 5,
                }}>
                  {order.status}
                </span>
                <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>
                  {formatRupiah(order.total_amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </WorkspaceCard>
  );
}

// ─── Stock Summary Card — LIVE ────────────────────────────────────────────────

function StokSummaryCard({ items }: { items: StokObatDbRow[] }) {
  const total      = items.length;
  const lowStock   = getLowStokObatItems(items).length;
  const nearExpiry = getNearExpiryStokItems(items).filter(
    (i) => getExpiryStatusFromDate(i.expiry_date) === 'Mendekati',
  ).length;

  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle title="Ringkasan Stok Obat" action="Live" accentColor={COLORS.primary} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {[
          { value: formatNumber(total), label: 'Produk aktif', icon: '💊', color: COLORS.text,  bg: COLORS.bg },
          { value: String(lowStock),   label: 'Stok rendah',   icon: '⚠️', color: '#b45309',    bg: '#fffbeb' },
          { value: String(nearExpiry), label: 'Hampir ED',      icon: '⏰', color: '#991b1b',    bg: '#fee2e2' },
        ].map((item) => (
          <div
            key={item.label}
            style={{ background: item.bg, borderRadius: 12, padding: '11px 8px', textAlign: 'center' }}
          >
            <div style={{ fontSize: 18 }}>{item.icon}</div>
            <div style={{ marginTop: 3, fontSize: 17, fontWeight: 800, color: item.color }}>{item.value}</div>
            <div style={{ marginTop: 2, fontSize: 10, color: item.color, fontWeight: 600 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}

// ─── Low Stock Card — LIVE ────────────────────────────────────────────────────

function LowStokCard({ items }: { items: StokObatDbRow[] }) {
  const lowStock = getLowStokObatItems(items).slice(0, 4);

  if (lowStock.length === 0) {
    return (
      <WorkspaceCard style={{ marginBottom: 14 }}>
        <WorkspaceSectionTitle title="Obat Hampir Habis" action="Live" accentColor={COLORS.primary} />
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          ✅ Semua stok dalam kondisi aman
        </p>
      </WorkspaceCard>
    );
  }

  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle
        title="Obat Hampir Habis"
        action={`${getLowStokObatItems(items).length} produk`}
        accentColor={COLORS.primary}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {lowStock.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 11px', borderRadius: 10,
              background: '#fffbeb', border: '1px solid #fde68a',
            }}
          >
            <span style={{ fontSize: 20 }}>{item.status === 'Habis' ? '🚫' : '⚠️'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.drug_name}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 10, color: '#92400e' }}>
                Stok: {formatNumber(item.quantity)} {item.unit}
                {item.min_stock !== null ? ` · Min: ${formatNumber(item.min_stock)}` : ''}
              </p>
            </div>
            <span style={{ fontSize: 10, color: item.status === 'Habis' ? '#991b1b' : '#92400e', fontWeight: 800, flexShrink: 0 }}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}

// ─── Near Expiry Card — LIVE ──────────────────────────────────────────────────

const EXPIRY_CFG = {
  Kadaluarsa:  { color: '#991b1b', bg: '#fee2e2', border: '#fca5a5', icon: '❌' },
  Mendekati:   { color: '#b45309', bg: '#fffbeb', border: '#fbbf24', icon: '⏰' },
  Aman:        { color: '#166534', bg: '#dcfce7', border: '#86efac', icon: '✅' },
  'Tidak Ada': { color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db', icon: '—'  },
} as const;

function NearExpiryCard({ items }: { items: StokObatDbRow[] }) {
  const nearExpiry = getNearExpiryStokItems(items).slice(0, 4);

  if (nearExpiry.length === 0) {
    return (
      <WorkspaceCard style={{ marginBottom: 14 }}>
        <WorkspaceSectionTitle title="Obat Mendekati Kedaluwarsa" action="Live" accentColor="#991b1b" />
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          ✅ Tidak ada obat yang mendekati atau sudah kadaluarsa
        </p>
      </WorkspaceCard>
    );
  }

  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle
        title="Obat Mendekati Kedaluwarsa"
        action={`${getNearExpiryStokItems(items).length} produk`}
        accentColor="#991b1b"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {nearExpiry.map((item) => {
          const status = getExpiryStatusFromDate(item.expiry_date);
          const cfg    = EXPIRY_CFG[status];
          return (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 11px', borderRadius: 10,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
              }}
            >
              <span style={{ fontSize: 20 }}>{cfg.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.drug_name}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 10, color: cfg.color }}>
                  {item.batch_number ? `Batch ${item.batch_number} · ` : ''}
                  ED {formatExpiryDate(item.expiry_date)}
                </p>
              </div>
              <span style={{ fontSize: 10, color: cfg.color, fontWeight: 800, flexShrink: 0 }}>
                {status === 'Kadaluarsa' ? 'EXPIRED' : 'Hampir ED'}
              </span>
            </div>
          );
        })}
      </div>
    </WorkspaceCard>
  );
}

// ─── Transaksi Summary Card — LIVE ────────────────────────────────────────────

function TransaksiSummaryCard({
  masukCount,
  keluarCount,
}: { masukCount: number; keluarCount: number }) {
  return (
    <WorkspaceCard style={{ marginBottom: 14 }}>
      <WorkspaceSectionTitle title="Ringkasan Transaksi Stok" action="Live" accentColor={COLORS.primary} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 13 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#166534', fontWeight: 700 }}>📥 Transaksi Masuk</p>
          <p style={{ margin: '5px 0 0', fontSize: 20, fontWeight: 800, color: '#15803d' }}>
            {formatNumber(masukCount)}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#166534' }}>catatan penerimaan stok</p>
        </div>
        <div style={{ background: '#fff7ed', borderRadius: 12, padding: 13 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#9a3412', fontWeight: 700 }}>📤 Transaksi Keluar</p>
          <p style={{ margin: '5px 0 0', fontSize: 20, fontWeight: 800, color: '#7c2d12' }}>
            {formatNumber(keluarCount)}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9a3412' }}>catatan pengeluaran stok</p>
        </div>
      </div>
      {masukCount === 0 && keluarCount === 0 && (
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
          Belum ada transaksi. Mulai catat stok masuk untuk mengisi data.
        </p>
      )}
    </WorkspaceCard>
  );
}

// ─── Activity Card — LIVE ─────────────────────────────────────────────────────

function ActivityIcon(domain: string, action: string): string {
  if (action === 'CREATE') return '➕';
  if (action === 'UPDATE') return '✏️';
  if (action === 'DELETE') return '🗑️';
  if (domain === 'drug_store' || domain === 'stok_obat') return '💊';
  if (domain === 'platform') return '⚙️';
  return '📋';
}

function RecentActivityCard({ activities }: { activities: ActivityLogDbRow[] }) {
  return (
    <WorkspaceCard>
      <WorkspaceSectionTitle title="Aktivitas Terkini" action="Live" accentColor={COLORS.primary} />
      {activities.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          Belum ada aktivitas yang tercatat
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {activities.slice(0, 8).map((activity) => (
            <div key={activity.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: COLORS.bg,
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                {ActivityIcon(activity.domain, activity.action)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {activity.description ?? `${activity.action} · ${activity.entity_type}`}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                  {activity.domain} · {activity.module}
                </p>
              </div>
              <span style={{ fontSize: 10, color: 'var(--color-muted)', flexShrink: 0 }}>
                {formatRelativeTime(activity.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </WorkspaceCard>
  );
}

// ─── AI Insight Widget — not_implemented ──────────────────────────────────────

function AiInsightWidget() {
  return (
    <WorkspaceCard style={{ borderColor: '#c7d2fe', background: '#eef2ff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>🤖</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#312e81' }}>AI Insight Drug Store</h2>
          <span style={{
            display: 'inline-block', marginTop: 3, fontSize: 10, fontWeight: 700,
            color: '#4338ca', background: '#e0e7ff', padding: '2px 7px', borderRadius: 6,
          }}>
            not_implemented
          </span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: '#4338ca', lineHeight: 1.6 }}>
        Widget AI Insight tersedia untuk diaktifkan. Analisis akan mengonsumsi data platform
        (stok, transaksi, aktivitas) dan memanggil AI service yang akan diintegrasikan kemudian.
      </p>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[
          'Prediksi stok obat hampir habis berdasarkan pola transaksi keluar',
          'Peringatan dini obat mendekati tanggal kedaluwarsa',
          'Analisis tren permintaan obat per kategori',
          'Rekomendasi waktu pengisian stok optimal',
        ].map((item) => (
          <div key={item} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: '#6366f1', marginTop: 1 }}>◦</span>
            <span style={{ fontSize: 11, color: '#4338ca' }}>{item}</span>
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DrugStoreDashboard(): React.ReactElement {
  const { id: routeWorkspaceId = '' } = useParams<{ id: string }>();

  const dashboardConfig = getWorkspaceDashboardConfig('DrugStore');
  const { data, loading, error } = useDrugStoreDashboardData(routeWorkspaceId);

  const workspaceName = data.workspace?.workspace_name ?? dashboardConfig.title;

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 24px', background: 'var(--color-bg)' }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: COLORS.bg,
            display: 'grid', placeItems: 'center', fontSize: 27,
          }}>
            {dashboardConfig.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              margin: 0, fontSize: 11, color: COLORS.primary,
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7,
            }}>
              Dashboard Home
            </p>
            <h1 style={{
              margin: '3px 0 0', fontSize: 21, color: 'var(--color-text)',
              fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {workspaceName}
            </h1>
          </div>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
          Ringkasan operasional toko obat — stok, transaksi, penjualan, kedaluwarsa, dan aktivitas workspace secara real-time.
        </p>
      </header>

      {/* ── Error Banner ── */}
      {error !== null && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 10, padding: '10px 14px', marginBottom: 14,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: '#991b1b' }}>
            ⚠️ Gagal memuat sebagian data: {error}
          </p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && <LoadingSkeleton />}

      {/* ── Content ── */}
      {!loading && (
        <>
          {/* Quick Action */}
          <WorkspaceCard style={{ marginBottom: 14 }}>
            <WorkspaceSectionTitle title="Quick Action" accentColor={COLORS.primary} />
            <WorkspaceQuickActions
              actions={dashboardConfig.quickActions}
              workspaceId={routeWorkspaceId}
              cols={6}
              colors={{
                bg:     COLORS.actionBg,
                border: COLORS.actionBorder,
                text:   COLORS.actionText,
                accent: COLORS.primary,
              }}
            />
          </WorkspaceCard>

          {/* Ringkasan Penjualan — LIVE */}
          <RingkasanPenjualanCard penjualan={data.todayPenjualan} />

          {/* Ringkasan Stok Obat — LIVE */}
          <StokSummaryCard items={data.stokItems} />

          {/* Pesanan Terbaru — LIVE */}
          <PesananTerbaruCard orders={data.recentOrders} />

          {/* Obat Hampir Habis — LIVE */}
          <LowStokCard items={data.stokItems} />

          {/* Obat Mendekati Kedaluwarsa — LIVE */}
          <NearExpiryCard items={data.stokItems} />

          {/* Ringkasan Transaksi Stok — LIVE */}
          <TransaksiSummaryCard
            masukCount={data.stokMasuk.length}
            keluarCount={data.stokKeluar.length}
          />

          {/* Aktivitas Terkini — LIVE */}
          <div style={{ marginBottom: 14 }}>
            <RecentActivityCard activities={data.activities} />
          </div>

          {/* AI Insight — not_implemented */}
          <AiInsightWidget />
        </>
      )}
    </main>
  );
}
