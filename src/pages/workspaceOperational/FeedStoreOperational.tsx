// ─── FeedStoreOperational — WORKSPACE-001E ───────────────────────────────────
// Dashboard Operasional khusus Workspace Toko Pakan.

import { useState, type ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFeedStoreWorkspaceMeta, getProductsByWorkspace } from '../../data/feedStoreWorkspaceData';
import { getWorkspaceOperationalConfig } from '../../config/workspaceOperationalRegistry';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
import { resolveWorkspaceRoute } from '../../config/workspaceRegistry';

const OPERATIONAL_SECTIONS = [
  { id: 'products', icon: '🌾', title: 'Daftar Produk', description: 'Kelola katalog dan informasi produk pakan.', count: '25 produk' },
  { id: 'stock', icon: '📦', title: 'Manajemen Stok', description: 'Pantau stok tersedia, minimum, dan habis.', count: '3 perlu perhatian' },
  { id: 'incoming', icon: '📥', title: 'Transaksi Masuk', description: 'Catat penerimaan barang dari supplier.', count: '8 transaksi bulan ini' },
  { id: 'outgoing', icon: '📤', title: 'Transaksi Keluar', description: 'Catat penjualan dan pengeluaran stok.', count: '42 transaksi hari ini' },
  { id: 'supplier', icon: '🚚', title: 'Supplier', description: 'Simpan relasi pemasok dan riwayat pembelian.', count: '7 supplier aktif' },
  { id: 'customers', icon: '👥', title: 'Pelanggan', description: 'Kelola pelanggan toko dan histori pembelian.', count: '64 pelanggan' },
];

export default function FeedStoreOperational(): ReactElement {
  const { id: workspaceId = 'w7' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState('products');
  const config = getWorkspaceOperationalConfig('FeedStore');
  const dashboardConfig = getWorkspaceDashboardConfig('FeedStore');
  const meta = getFeedStoreWorkspaceMeta(workspaceId) ?? getFeedStoreWorkspaceMeta('w7');
  const products = getProductsByWorkspace(workspaceId).length > 0
    ? getProductsByWorkspace(workspaceId)
    : getProductsByWorkspace('w7');
  const selected = OPERATIONAL_SECTIONS.find((section) => section.id === selectedSection) ?? OPERATIONAL_SECTIONS[0];

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 24px', background: 'var(--color-bg)' }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 18 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff3e0', display: 'grid', placeItems: 'center', fontSize: 27 }}>{config.icon}</div>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7 }}>Dashboard Operasional</p>
          <h1 style={{ margin: '3px 0 0', fontSize: 21, color: 'var(--color-text)', fontWeight: 800 }}>{meta?.nama ?? config.title}</h1>
          <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>{config.subtitle}</p>
        </div>
      </header>

      <section style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#7c2d12' }}>Quick Action</p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9a3412' }}>Akses cepat pekerjaan toko</p>
          </div>
          <span style={{ fontSize: 21 }}>{dashboardConfig.icon}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 6 }}>
          {dashboardConfig.quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => navigate(resolveWorkspaceRoute(action.route, workspaceId))}
              style={{ border: '1px solid #fdba74', borderRadius: 9, background: '#fff', color: '#9a3412', padding: '8px 3px', minHeight: 66, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', fontSize: 9, fontWeight: 700, lineHeight: 1.2 }}
            >
              <span style={{ fontSize: 18 }}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
        {OPERATIONAL_SECTIONS.map((section) => {
          const active = section.id === selectedSection;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setSelectedSection(section.id)}
              style={{ textAlign: 'left', border: active ? '1.5px solid #f59e0b' : '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: active ? '#fffbeb' : 'var(--color-surface)', padding: 13, cursor: 'pointer', minHeight: 118 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 23 }}>{section.icon}</span>
                <span style={{ fontSize: 10, color: active ? '#b45309' : 'var(--color-muted)', fontWeight: 700 }}>›</span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>{section.title}</p>
              <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.35 }}>{section.count}</p>
            </button>
          );
        })}
      </section>

      <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
          <span style={{ fontSize: 24 }}>{selected.icon}</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, color: 'var(--color-text)' }}>{selected.title}</h2>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>{selected.description}</p>
          </div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>Ringkasan saat ini</p>
            <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>{selected.count}</p>
          </div>
          <span style={{ fontSize: 11, color: '#b45309', fontWeight: 700 }}>{selected.id === 'products' ? `${products.length} dari katalog` : 'Data dummy'}</span>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5 }}>
          Modul {selected.title.toLowerCase()} siap menjadi titik masuk operasional Toko Pakan. Detail transaksi dan penyimpanan permanen akan mengikuti data layer workspace berikutnya.
        </p>
      </section>
    </main>
  );
}
