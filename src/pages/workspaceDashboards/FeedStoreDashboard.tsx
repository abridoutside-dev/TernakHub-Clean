// ─── FeedStoreDashboard — ADMIN-FOUNDATION-003 ────────────────────────────────
// Dashboard Home Workspace Toko Pakan — LIVE dari Supabase.
//
// Sumber data:
//   LIVE  → stok_inventaris (produk & stok)
//   LIVE  → stok_inventaris_transactions (gerakan stok)
//   LIVE  → activity_log (aktivitas workspace)
//   LIVE  → workspaces (nama toko)
//   LIVE  → feed_store_orders (pesanan terbaru & ringkasan penjualan hari ini)
//   LIVE  → feed_store_sales (ringkasan penjualan bulan ini)
//   NOT_IMPLEMENTED → AI Insight (service belum diintegrasikan)

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWorkspaceDashboardConfig, type WorkspaceQuickAction } from '../../config/workspaceDashboardRegistry';
import { resolveWorkspaceRoute } from '../../config/workspaceRegistry';
import {
  useFeedStoreDashboardData,
  getLowStockItems,
  getTransaksiMasuk,
  getTransaksiKeluar,
  formatRelativeTime,
  formatNumber,
  formatRupiah,
} from '../../hooks/useFeedStoreDashboardData';
import type { StokInventarisDbRow } from '../../types/stokInventaris';
import type { ActivityLogDbRow } from '../../types/activityLog';
import type { FeedStoreOrderDbRow } from '../../types/feedStore';
import type { FeedStoreSalesSummaryData } from '../../hooks/useFeedStoreDashboardData';
import type { StokTransactionDbRow } from '../../types/stokInventaris';

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 16,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function SectionTitle({ title, badge }: { title: string; badge?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>{title}</h2>
      {badge !== undefined && (
        <span style={{ fontSize: 11, color: '#b45309', fontWeight: 700 }}>{badge}</span>
      )}
    </div>
  );
}

function QuickActions({ actions, workspaceId }: { actions: WorkspaceQuickAction[]; workspaceId: string }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => navigate(resolveWorkspaceRoute(action.route, workspaceId))}
          style={{
            border: '1px solid #fed7aa', borderRadius: 12, background: '#fff7ed',
            color: '#9a3412', padding: '10px 5px', minHeight: 76,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 5, cursor: 'pointer',
            fontSize: 10, fontWeight: 700, lineHeight: 1.2,
          }}
        >
          <span style={{ fontSize: 22 }}>{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ─── AI Insight Widget ────────────────────────────────────────────────────────

function AiInsightWidget() {
  return (
    <Card style={{ borderColor: '#c7d2fe', background: '#eef2ff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>🤖</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#312e81' }}>AI Insight Feed Store</h2>
          <span style={{ display: 'inline-block', marginTop: 3, fontSize: 10, fontWeight: 700, color: '#4338ca', background: '#e0e7ff', padding: '2px 7px', borderRadius: 6 }}>
            not_implemented
          </span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: '#4338ca', lineHeight: 1.6 }}>
        Widget AI Insight tersedia untuk diaktifkan. Analisis akan mengonsumsi data platform
        (stok, transaksi, aktivitas) dan memanggil AI service yang akan diintegrasikan kemudian.
        Tidak ada AI engine terpisah yang diperlukan saat ini.
      </p>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[
          'Prediksi stok hampir habis berdasarkan pola transaksi keluar',
          'Analisis tren permintaan produk pakan per kategori',
          'Rekomendasi waktu pengisian stok optimal',
        ].map((item) => (
          <div key={item} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: '#6366f1', marginTop: 1 }}>◦</span>
            <span style={{ fontSize: 11, color: '#4338ca' }}>{item}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

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

// ─── Stock Summary ────────────────────────────────────────────────────────────

function StockSummaryCard({ items }: { items: StokInventarisDbRow[] }) {
  const total          = items.length;
  const active         = items.filter((i) => i.status === 'Aktif').length;
  const lowStock       = getLowStockItems(items);
  const perluPerhatian = lowStock.length;

  return (
    <Card style={{ marginBottom: 14 }}>
      <SectionTitle title="Ringkasan Stok" badge="Live" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {[
          { value: formatNumber(total),          label: 'Total item',       icon: '📦', color: '#1d4ed8', bg: '#eff6ff' },
          { value: formatNumber(active),         label: 'Item aktif',       icon: '✅', color: '#166534', bg: '#f0fdf4' },
          { value: String(perluPerhatian),       label: 'Perlu perhatian',  icon: '⚠️', color: '#b45309', bg: '#fffbeb' },
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
    </Card>
  );
}

// ─── Low Stock List ───────────────────────────────────────────────────────────

function LowStockCard({ items }: { items: StokInventarisDbRow[] }) {
  const lowStock = getLowStockItems(items).slice(0, 5);

  if (lowStock.length === 0) {
    return (
      <Card style={{ marginBottom: 14 }}>
        <SectionTitle title="Item Stok Kritis" badge="Live" />
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          ✅ Semua stok dalam kondisi aman
        </p>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 14 }}>
      <SectionTitle title="Item Stok Kritis" badge={`${getLowStockItems(items).length} item`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {lowStock.map((item) => {
          const isHabis = item.status === 'Habis' || item.status === 'Kadaluarsa';
          return (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 11px', borderRadius: 10,
                background: isHabis ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${isHabis ? '#fecaca' : '#fde68a'}`,
              }}
            >
              <span style={{ fontSize: 20 }}>{isHabis ? '🚫' : '⚠️'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.item_name}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 10, color: '#92400e' }}>
                  {item.source_type} · {item.unit ?? '-'} · Stok: {formatNumber(item.quantity)}
                  {item.min_stock !== null ? ` / Min: ${formatNumber(item.min_stock)}` : ''}
                </p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: isHabis ? '#991b1b' : '#92400e', flexShrink: 0 }}>
                {item.status}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityIcon(domain: string, action: string): string {
  if (action === 'CREATE') return '➕';
  if (action === 'UPDATE') return '✏️';
  if (action === 'DELETE') return '🗑️';
  if (domain === 'feed_store') return '🌾';
  if (domain === 'platform') return '⚙️';
  return '📋';
}

function RecentActivityCard({ activities }: { activities: ActivityLogDbRow[] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <SectionTitle title="Aktivitas Terkini" badge="Live" />
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          Belum ada aktivitas yang tercatat
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle title="Aktivitas Terkini" badge="Live" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activities.slice(0, 8).map((activity) => (
          <div key={activity.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#fff7ed', display: 'grid', placeItems: 'center', flexShrink: 0,
              }}
            >
              {ActivityIcon(activity.domain, activity.action)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
    </Card>
  );
}

// ─── Transaction Summary ──────────────────────────────────────────────────────

function TransactionSummaryCard({ items, transactions }: { items: StokInventarisDbRow[]; transactions: StokTransactionDbRow[] }) {
  const masuk  = getTransaksiMasuk(transactions);
  const keluar = getTransaksiKeluar(transactions);

  return (
    <Card style={{ marginBottom: 14 }}>
      <SectionTitle title="Ringkasan Transaksi Stok" badge="Live" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 13 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#166534' }}>📥 Transaksi Masuk</p>
          <p style={{ margin: '5px 0 0', fontSize: 20, fontWeight: 800, color: '#15803d' }}>
            {formatNumber(masuk.length)}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#166534' }}>total catatan stok masuk</p>
        </div>
        <div style={{ background: '#fff7ed', borderRadius: 12, padding: 13 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#9a3412' }}>📤 Transaksi Keluar</p>
          <p style={{ margin: '5px 0 0', fontSize: 20, fontWeight: 800, color: '#7c2d12' }}>
            {formatNumber(keluar.length)}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9a3412' }}>total catatan stok keluar</p>
        </div>
      </div>
      {items.length === 0 && transactions.length === 0 && (
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
          Belum ada data transaksi. Mulai catat stok masuk untuk mengisi data.
        </p>
      )}
    </Card>
  );
}

// ─── Sales Summary Widget (LIVE) ──────────────────────────────────────────────

function SalesSummaryCard({ summary }: { summary: FeedStoreSalesSummaryData }) {
  const { todayRevenue, todayOrderCount, completedCount, processingCount, growthPercent, monthRevenue, monthSalesCount } = summary;
  const growthColor = growthPercent === null ? '#6b7280' : growthPercent >= 0 ? '#166534' : '#991b1b';
  const growthLabel = growthPercent === null
    ? 'Belum ada data kemarin'
    : growthPercent >= 0
      ? `▲ ${growthPercent.toFixed(1)}% vs kemarin`
      : `▼ ${Math.abs(growthPercent).toFixed(1)}% vs kemarin`;

  return (
    <Card style={{ marginBottom: 14, borderColor: '#bbf7d0' }}>
      <SectionTitle title="Ringkasan Penjualan" badge="Live" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 10 }}>
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 13 }}>
          <p style={{ margin: 0, fontSize: 10, color: '#166534', fontWeight: 700 }}>💰 Penjualan Hari Ini</p>
          <p style={{ margin: '5px 0 0', fontSize: 15, fontWeight: 800, color: '#15803d', wordBreak: 'break-word' }}>
            {todayRevenue > 0 ? formatRupiah(todayRevenue) : 'Rp 0'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: growthColor, fontWeight: 600 }}>{growthLabel}</p>
        </div>
        <div style={{ background: '#fff7ed', borderRadius: 12, padding: 13 }}>
          <p style={{ margin: 0, fontSize: 10, color: '#9a3412', fontWeight: 700 }}>📅 Penjualan Bulan Ini</p>
          <p style={{ margin: '5px 0 0', fontSize: 15, fontWeight: 800, color: '#7c2d12', wordBreak: 'break-word' }}>
            {monthRevenue > 0 ? formatRupiah(monthRevenue) : 'Rp 0'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: '#9a3412' }}>{formatNumber(monthSalesCount)} catatan penjualan</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {[
          { value: formatNumber(todayOrderCount), label: 'Order hari ini',  color: '#1d4ed8', bg: '#eff6ff' },
          { value: formatNumber(completedCount),  label: 'Selesai',         color: '#166534', bg: '#f0fdf4' },
          { value: formatNumber(processingCount), label: 'Diproses',        color: '#92400e', bg: '#fffbeb' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</p>
            <p style={{ margin: '2px 0 0', fontSize: 9, color: stat.color, fontWeight: 600 }}>{stat.label}</p>
          </div>
        ))}
      </div>
      {todayOrderCount === 0 && (
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
          Belum ada penjualan hari ini. Data akan muncul setelah order penjualan dicatat.
        </p>
      )}
    </Card>
  );
}

// ─── Recent Orders Widget (LIVE) ─────────────────────────────────────────────

function RecentOrdersCard({ orders }: { orders: FeedStoreOrderDbRow[] }) {
  const statusColor = (status: string) => {
    if (status === 'Selesai')    return { color: '#166534', bg: '#f0fdf4' };
    if (status === 'Dibatalkan') return { color: '#991b1b', bg: '#fef2f2' };
    if (status === 'Diproses')   return { color: '#92400e', bg: '#fffbeb' };
    return { color: '#1d4ed8', bg: '#eff6ff' };
  };

  return (
    <Card style={{ marginBottom: 14, borderColor: '#bfdbfe' }}>
      <SectionTitle title="Pesanan Terbaru" badge="Live" />
      {orders.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
          Belum ada pesanan yang dicatat. Tambahkan order penjualan atau pembelian untuk mulai.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {orders.map((order) => {
            const sc = statusColor(order.status);
            const isPenjualan = order.order_type === 'Penjualan';
            return (
              <div
                key={order.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 11px', borderRadius: 9,
                  background: isPenjualan ? '#f0fdf4' : '#eff6ff',
                  border: `1px solid ${isPenjualan ? '#bbf7d0' : '#bfdbfe'}`,
                }}
              >
                <span style={{ fontSize: 18 }}>{isPenjualan ? '🧾' : '📋'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.order_number ?? `Order ${order.id.slice(0, 8)}`}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                    {order.order_type} · {order.order_date} · {formatRupiah(order.total_amount)}
                  </p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>
                  {order.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FeedStoreDashboard(): React.ReactElement {
  const { id: routeWorkspaceId = '' } = useParams<{ id: string }>();
  const dashboardConfig = getWorkspaceDashboardConfig('FeedStore');
  const { data, loading, error } = useFeedStoreDashboardData(routeWorkspaceId);

  const workspaceName = data.workspace?.workspace_name ?? dashboardConfig.title;

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 24px', background: 'var(--color-bg)' }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff3e0', display: 'grid', placeItems: 'center', fontSize: 27 }}>
            {dashboardConfig.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7 }}>
              Dashboard Home
            </p>
            <h1 style={{ margin: '3px 0 0', fontSize: 21, color: 'var(--color-text)', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {workspaceName}
            </h1>
          </div>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
          Ringkasan operasional toko — stok, penjualan, pesanan, dan aktivitas workspace secara real-time.
        </p>
      </header>

      {/* ── Error Banner ── */}
      {error !== null && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
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
          <Card style={{ marginBottom: 14 }}>
            <SectionTitle title="Quick Action" />
            <QuickActions actions={dashboardConfig.quickActions} workspaceId={routeWorkspaceId} />
          </Card>

          {/* Ringkasan Penjualan — LIVE */}
          <SalesSummaryCard summary={data.salesSummary} />

          {/* Pesanan Terbaru — LIVE */}
          <RecentOrdersCard orders={data.recentOrders} />

          {/* Ringkasan Stok — LIVE */}
          <StockSummaryCard items={data.stokItems} />

          {/* Ringkasan Transaksi Stok — LIVE */}
          <TransactionSummaryCard items={data.stokItems} transactions={data.transactions} />

          {/* Item Stok Kritis — LIVE */}
          <LowStockCard items={data.stokItems} />

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
