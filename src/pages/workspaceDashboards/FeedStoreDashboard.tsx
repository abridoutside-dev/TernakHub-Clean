// ─── FeedStoreDashboard — WORKSPACE-001E ─────────────────────────────────────
// Dashboard Home khusus Workspace Toko Pakan.
//
// This page is intentionally separate from the Farm Dashboard. It is selected
// by workspaceDashboardRegistry.tsx and keeps store-specific presentation/data
// local until the store's transactional data layer is introduced.

import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getFeedStoreWorkspaceMeta,
  getProductsByWorkspace,
} from '../../data/feedStoreWorkspaceData';
import {
  getWorkspaceDashboardConfig,
  type WorkspaceQuickAction,
} from '../../config/workspaceDashboardRegistry';
import { resolveWorkspaceRoute } from '../../config/workspaceRegistry';

const RECENT_ORDERS = [
  { id: 'PJL-0727-014', buyer: 'Koperasi Sapi Makmur', items: 'Konsentrat Sapi Perah · 12 sak', total: 'Rp 4.680.000', status: 'Menunggu diproses', color: '#b45309', bg: '#fffbeb' },
  { id: 'PJL-0727-013', buyer: 'Pak Dedi · Sleman', items: 'Rumput Odot Cincang · 180 kg', total: 'Rp 1.350.000', status: 'Siap dikirim', color: '#166534', bg: '#f0fdf4' },
  { id: 'PJL-0726-012', buyer: 'CV Ternak Sejahtera', items: 'Silase Jagung Premium · 500 kg', total: 'Rp 7.500.000', status: 'Selesai', color: '#1d4ed8', bg: '#eff6ff' },
];

const TODAY_ACTIVITIES = [
  { icon: '🧾', title: 'Penjualan baru dicatat', detail: 'Koperasi Sapi Makmur · Rp 4.680.000', time: '10.42' },
  { icon: '📦', title: 'Stok masuk diterima', detail: 'Dedak Padi · 250 kg dari UD Sumber Tani', time: '09.15' },
  { icon: '👤', title: 'Pelanggan baru ditambahkan', detail: 'Budi Santoso · Bantul', time: '08.37' },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
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

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>{title}</h2>
      {action && <span style={{ fontSize: 11, color: '#b45309', fontWeight: 700 }}>{action}</span>}
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
            border: '1px solid #fed7aa',
            borderRadius: 12,
            background: '#fff7ed',
            color: '#9a3412',
            padding: '10px 5px',
            minHeight: 76,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          <span style={{ fontSize: 22 }}>{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}

export default function FeedStoreDashboard(): React.ReactElement {
  const { id: routeWorkspaceId = 'w7' } = useParams<{ id: string }>();
  const workspaceId = routeWorkspaceId;
  const dashboardConfig = getWorkspaceDashboardConfig('FeedStore');
  const meta = getFeedStoreWorkspaceMeta(workspaceId) ?? getFeedStoreWorkspaceMeta('w7');
  const products = getProductsByWorkspace(workspaceId).length > 0
    ? getProductsByWorkspace(workspaceId)
    : getProductsByWorkspace('w7');
  const lowStockProducts = products.filter((product) => product.ketersediaan === 'Stok Terbatas' || product.ketersediaan === 'Habis');
  const stockUnits = useMemo(() => products.length * 86 + 42, [products.length]);

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 24px', background: 'var(--color-bg)' }}>
      <header style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff3e0', display: 'grid', placeItems: 'center', fontSize: 27 }}>{dashboardConfig.icon}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7 }}>Dashboard Home</p>
            <h1 style={{ margin: '3px 0 0', fontSize: 21, color: 'var(--color-text)', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meta?.nama ?? dashboardConfig.title}
            </h1>
          </div>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
          Ringkasan operasional toko untuk membantu memantau penjualan, stok, dan aktivitas hari ini.
        </p>
      </header>

      <Card style={{ marginBottom: 14 }}>
        <SectionTitle title="Quick Action" />
        <QuickActions actions={dashboardConfig.quickActions} workspaceId={workspaceId} />
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SectionTitle title="Ringkasan Penjualan" action="Hari ini" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <div style={{ background: '#fff7ed', borderRadius: 12, padding: 13 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#9a3412' }}>Total penjualan</p>
            <p style={{ margin: '5px 0 0', fontSize: 20, fontWeight: 800, color: '#7c2d12' }}>Rp 18,45 jt</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#166534' }}>↑ 12,5% dari kemarin</p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 13 }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>Transaksi</p>
            <p style={{ margin: '5px 0 0', fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>42</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>36 selesai · 6 proses</p>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SectionTitle title="Ringkasan Stok" action="Lihat detail" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {[
            { value: formatNumber(stockUnits), label: 'Total unit', icon: '📦', color: '#1d4ed8', bg: '#eff6ff' },
            { value: formatNumber(products.length), label: 'Produk aktif', icon: '✅', color: '#166534', bg: '#f0fdf4' },
            { value: String(lowStockProducts.length), label: 'Perlu perhatian', icon: '⚠️', color: '#b45309', bg: '#fffbeb' },
          ].map((item) => (
            <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: '11px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 18 }}>{item.icon}</div>
              <div style={{ marginTop: 3, fontSize: 17, fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ marginTop: 2, fontSize: 10, color: item.color, fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SectionTitle title="Produk Hampir Habis" action={`${lowStockProducts.length} produk`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {lowStockProducts.slice(0, 4).map((product) => (
            <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
              <span style={{ fontSize: 20 }}>{product.ketersediaan === 'Habis' ? '🚫' : '⚠️'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.namaProduk}</p>
                <p style={{ margin: '3px 0 0', fontSize: 10, color: '#92400e' }}>{product.kategori} · {product.satuan}</p>
              </div>
              <span style={{ fontSize: 10, color: product.ketersediaan === 'Habis' ? '#991b1b' : '#92400e', fontWeight: 800 }}>{product.ketersediaan}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SectionTitle title="Pesanan Terbaru" action="Lihat semua" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {RECENT_ORDERS.map((order) => (
            <div key={order.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 10, borderRadius: 10, background: order.bg }}>
              <span style={{ fontSize: 19 }}>🧾</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.buyer}</p>
                  <span style={{ flexShrink: 0, fontSize: 10, color: order.color, fontWeight: 800 }}>{order.status}</span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>{order.id} · {order.items}</p>
                <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 800, color: order.color }}>{order.total}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Aktivitas Hari Ini" action="27 Juli 2026" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {TODAY_ACTIVITIES.map((activity) => (
            <div key={`${activity.time}-${activity.title}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff7ed', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{activity.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{activity.title}</p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>{activity.detail}</p>
              </div>
              <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{activity.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
