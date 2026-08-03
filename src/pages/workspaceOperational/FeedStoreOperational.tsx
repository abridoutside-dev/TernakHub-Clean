// ─── FeedStoreOperational — ADMIN-SYNC-005 ───────────────────────────────────
// Dashboard Operasional Workspace Toko Pakan — LIVE dari Supabase.
//
// Sumber data:
//   LIVE    → stok_inventaris          (Daftar Produk, Manajemen Stok)
//   LIVE    → stok_inventaris_transactions (Transaksi Masuk, Transaksi Keluar, Gerakan Stok)
//   LIVE    → activity_log            (Aktivitas)
//   BLOCKED → feed_store_suppliers    (Supplier — belum ada tabel)
//   BLOCKED → feed_store_customers    (Pelanggan — belum ada tabel)

import { useState, type ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWorkspaceOperationalConfig } from '../../config/workspaceOperationalRegistry';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
import { resolveWorkspaceRoute } from '../../config/workspaceRegistry';
import {
  useFeedStoreDashboardData,
  getLowStockItems,
  getTransaksiMasuk,
  getTransaksiKeluar,
  formatNumber,
  formatRelativeTime,
} from '../../hooks/useFeedStoreDashboardData';
import type { StokInventarisDbRow, StokTransactionDbRow } from '../../types/stokInventaris';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId = 'products' | 'stock' | 'incoming' | 'outgoing' | 'movements' | 'supplier' | 'customers' | 'reports' | 'ai_insight';

interface Section {
  id: SectionId;
  icon: string;
  title: string;
  description: string;
  blocked: boolean;
  blockReason?: string;
  blockDependency?: string;
  blockPriority?: 'high' | 'medium' | 'low';
}

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: 'products',
    icon: '🌾',
    title: 'Daftar Produk',
    description: 'Item stok tersedia di workspace ini.',
    blocked: false,
  },
  {
    id: 'stock',
    icon: '📦',
    title: 'Manajemen Stok',
    description: 'Pantau stok tersedia, minimum, dan status item.',
    blocked: false,
  },
  {
    id: 'incoming',
    icon: '📥',
    title: 'Transaksi Masuk',
    description: 'Riwayat penerimaan barang (stok_inventaris_transactions type=Masuk).',
    blocked: false,
  },
  {
    id: 'outgoing',
    icon: '📤',
    title: 'Transaksi Keluar',
    description: 'Riwayat pengeluaran barang (stok_inventaris_transactions type=Keluar).',
    blocked: false,
  },
  {
    id: 'movements',
    icon: '🔄',
    title: 'Gerakan Stok',
    description: 'Seluruh riwayat transaksi stok (masuk, keluar, penyesuaian).',
    blocked: false,
  },
  {
    id: 'supplier',
    icon: '🚚',
    title: 'Supplier',
    description: 'Daftar pemasok dan riwayat pembelian.',
    blocked: true,
    blockReason: 'Tabel feed_store_suppliers belum tersedia di database. Informasi supplier saat ini tidak disimpan dalam skema platform.',
    blockDependency: 'feed_store_suppliers',
    blockPriority: 'medium',
  },
  {
    id: 'customers',
    icon: '👥',
    title: 'Pelanggan',
    description: 'Kelola data pelanggan toko dan histori pembelian.',
    blocked: true,
    blockReason: 'Tabel feed_store_customers belum tersedia di database. Data pelanggan direct sales tidak disimpan dalam skema platform saat ini.',
    blockDependency: 'feed_store_customers',
    blockPriority: 'medium',
  },
  {
    id: 'reports',
    icon: '📊',
    title: 'Laporan',
    description: 'Laporan penjualan, stok, dan kinerja toko.',
    blocked: true,
    blockReason: 'Laporan keuangan memerlukan tabel feed_store_sales. Laporan stok tersedia secara parsial melalui stok_inventaris.',
    blockDependency: 'feed_store_sales',
    blockPriority: 'high',
  },
  {
    id: 'ai_insight',
    icon: '🤖',
    title: 'AI Insight',
    description: 'Analisis cerdas berbasis data platform.',
    blocked: false,
  },
];

// ActivityDetail digunakan pada panel detail ketika section 'ai_insight' tidak dipilih
// — komponen ini sengaja disimpan untuk future wiring ke tab aktivitas jika ditambahkan.

// ─── Section Detail Views ─────────────────────────────────────────────────────

function ProductsDetail({ items }: { items: StokInventarisDbRow[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="🌾"
        message="Belum ada item stok tercatat di workspace ini."
        hint="Gunakan menu Stok Masuk untuk mulai mencatat inventaris."
      />
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.slice(0, 10).map((item) => (
        <div
          key={item.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 9,
            background: item.status === 'Aktif' ? '#f0fdf4' : '#f9fafb',
            border: `1px solid ${item.status === 'Aktif' ? '#bbf7d0' : '#e5e7eb'}`,
          }}
        >
          <span style={{ fontSize: 18 }}>🌾</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.item_name}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
              {item.source_type} · Stok: {formatNumber(item.quantity)} {item.unit ?? ''}
              {item.min_stock !== null ? ` · Min: ${formatNumber(item.min_stock)}` : ''}
            </p>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: item.status === 'Aktif' ? '#166534' : item.status === 'Habis' ? '#991b1b' : '#6b7280',
          }}>
            {item.status}
          </span>
        </div>
      ))}
      {items.length > 10 && (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
          ... dan {items.length - 10} item lainnya
        </p>
      )}
    </div>
  );
}

function StockDetail({ items }: { items: StokInventarisDbRow[] }) {
  const lowStock = getLowStockItems(items);
  const aktif    = items.filter((i) => i.status === 'Aktif').length;
  const habis    = items.filter((i) => i.status === 'Habis').length;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Total item',      value: formatNumber(items.length),    color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Aktif',           value: formatNumber(aktif),           color: '#166534', bg: '#f0fdf4' },
          { label: 'Habis',           value: formatNumber(habis),           color: '#991b1b', bg: '#fef2f2' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 10, padding: '9px 7px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: stat.color, fontWeight: 600 }}>{stat.label}</p>
          </div>
        ))}
      </div>
      {lowStock.length > 0 && (
        <>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#92400e' }}>
            ⚠️ {lowStock.length} item perlu perhatian
          </p>
          {lowStock.slice(0, 5).map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#fffbeb', borderRadius: 8, marginBottom: 5, border: '1px solid #fde68a' }}>
              <span style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 600 }}>{item.item_name}</span>
              <span style={{ fontSize: 10, color: '#92400e', fontWeight: 700 }}>
                {formatNumber(item.quantity)} {item.unit ?? ''} / Min: {item.min_stock !== null ? formatNumber(item.min_stock) : '-'}
              </span>
            </div>
          ))}
        </>
      )}
      {items.length === 0 && (
        <EmptyState icon="📦" message="Belum ada item stok." hint="Mulai dengan mencatat stok masuk." />
      )}
    </div>
  );
}

function TransactionList({ transactions, type }: { transactions: StokTransactionDbRow[]; type: 'Masuk' | 'Keluar' | 'all' }) {
  const filtered = type === 'all' ? transactions : transactions.filter((t) => t.transaction_type === type);

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={type === 'Masuk' ? '📥' : type === 'Keluar' ? '📤' : '🔄'}
        message={`Belum ada transaksi ${type === 'all' ? 'stok' : type.toLowerCase()} yang tercatat.`}
        hint="Data akan muncul setelah transaksi stok dicatat."
      />
    );
  }

  const sorted = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {sorted.slice(0, 15).map((tx) => {
        const isMasuk = tx.transaction_type === 'Masuk';
        const isPenyesuaian = tx.transaction_type === 'Penyesuaian';
        const color = isMasuk ? '#166534' : isPenyesuaian ? '#1d4ed8' : '#991b1b';
        const bg    = isMasuk ? '#f0fdf4'  : isPenyesuaian ? '#eff6ff'  : '#fef2f2';
        const icon  = isMasuk ? '📥'       : isPenyesuaian ? '🔄'       : '📤';
        const sign  = isMasuk || (isPenyesuaian && tx.quantity_delta > 0) ? '+' : '';

        return (
          <div
            key={tx.id}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, background: bg, border: `1px solid ${isMasuk ? '#bbf7d0' : isPenyesuaian ? '#c7d2fe' : '#fecaca'}` }}
          >
            <span style={{ fontSize: 17 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>
                {tx.reason ?? tx.transaction_type}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                {tx.transaction_date} · {tx.reference_type ?? '-'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color }}>
                {sign}{formatNumber(Math.abs(tx.quantity_delta))}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 9, color: 'var(--color-muted)' }}>
                {formatRelativeTime(tx.created_at)}
              </p>
            </div>
          </div>
        );
      })}
      {filtered.length > 15 && (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
          ... dan {filtered.length - 15} transaksi lainnya
        </p>
      )}
    </div>
  );
}


function AiInsightDetail() {
  return (
    <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>🤖</span>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#312e81' }}>AI Insight Feed Store</p>
          <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, color: '#4338ca', background: '#e0e7ff', padding: '2px 7px', borderRadius: 5 }}>
            not_implemented
          </span>
        </div>
      </div>
      <p style={{ margin: '0 0 10px', fontSize: 11, color: '#4338ca', lineHeight: 1.6 }}>
        Modul AI Insight sudah tersedia untuk diaktifkan. Analisis akan mengonsumsi data platform
        yang ada (stok_inventaris, stok_inventaris_transactions, activity_log) dan memanggil
        AI service eksternal yang akan diintegrasikan kemudian.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { label: 'Prediksi stok hampir habis', source: 'stok_inventaris + stok_inventaris_transactions' },
          { label: 'Analisis tren transaksi keluar', source: 'stok_inventaris_transactions (type=Keluar)' },
          { label: 'Rekomendasi pengisian stok optimal', source: 'stok_inventaris (min_stock threshold)' },
          { label: 'Ringkasan aktivitas anomali', source: 'activity_log (severity=warning|error)' },
        ].map((insight) => (
          <div key={insight.label} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', border: '1px solid #e0e7ff' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#312e81' }}>{insight.label}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: '#6366f1' }}>
              Data: <code style={{ fontSize: 9, background: '#e0e7ff', padding: '1px 4px', borderRadius: 3 }}>{insight.source}</code>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockedDetail({ section }: { section: Section }) {
  const priorityColor = section.blockPriority === 'high' ? '#991b1b' : section.blockPriority === 'medium' ? '#92400e' : '#1d4ed8';
  const priorityBg    = section.blockPriority === 'high' ? '#fef2f2' : section.blockPriority === 'medium' ? '#fffbeb' : '#eff6ff';
  const priorityLabel = section.blockPriority === 'high' ? 'Prioritas Tinggi' : section.blockPriority === 'medium' ? 'Prioritas Sedang' : 'Prioritas Rendah';
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>🚧</span>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>{section.title} — Blocked</p>
          <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, color: priorityColor, background: priorityBg, padding: '2px 7px', borderRadius: 5 }}>
            {priorityLabel}
          </span>
        </div>
      </div>
      <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 10 }}>
        <p style={{ margin: 0, fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
          <strong style={{ color: '#374151' }}>Alasan:</strong> {section.blockReason}
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6b7280' }}>
          <strong style={{ color: '#374151' }}>Dependency:</strong>{' '}
          <code style={{ fontSize: 10, background: '#e5e7eb', padding: '1px 5px', borderRadius: 4 }}>
            {section.blockDependency}
          </code>
        </p>
      </div>
    </div>
  );
}

function EmptyState({ icon, message, hint }: { icon: string; message: string; hint?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 10px' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', fontWeight: 600 }}>{message}</p>
      {hint && <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>{hint}</p>}
    </div>
  );
}

// ─── Count Labels (LIVE) ──────────────────────────────────────────────────────

function getSectionCountLabel(
  sectionId: SectionId,
  items: StokInventarisDbRow[],
  transactions: StokTransactionDbRow[],
): string {
  switch (sectionId) {
    case 'products':  return `${formatNumber(items.length)} item stok`;
    case 'stock': {
      const low = getLowStockItems(items).length;
      return low > 0 ? `${formatNumber(low)} perlu perhatian` : `${formatNumber(items.length)} item`;
    }
    case 'incoming':  return `${formatNumber(getTransaksiMasuk(transactions).length)} transaksi`;
    case 'outgoing':  return `${formatNumber(getTransaksiKeluar(transactions).length)} transaksi`;
    case 'movements': return `${formatNumber(transactions.length)} total gerakan`;
    case 'supplier':  return 'Blocked';
    case 'customers': return 'Blocked';
    case 'reports':   return 'Blocked';
    case 'ai_insight': return 'not_implemented';
    default: return '-';
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FeedStoreOperational(): ReactElement {
  const { id: workspaceId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState<SectionId>('products');

  const config          = getWorkspaceOperationalConfig('FeedStore');
  const dashboardConfig = getWorkspaceDashboardConfig('FeedStore');
  const { data, loading, error } = useFeedStoreDashboardData(workspaceId);

  const workspaceName = data.workspace?.workspace_name ?? config.title;
  const selected      = SECTIONS.find((s) => s.id === selectedSection) ?? SECTIONS[0];

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 24px', background: 'var(--color-bg)' }}>

      {/* ── Header ── */}
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 18 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff3e0', display: 'grid', placeItems: 'center', fontSize: 27 }}>
          {config.icon}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7 }}>
            Dashboard Operasional
          </p>
          <h1 style={{ margin: '3px 0 0', fontSize: 21, color: 'var(--color-text)', fontWeight: 800 }}>
            {workspaceName}
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>{config.subtitle}</p>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {error !== null && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#991b1b' }}>⚠️ Gagal memuat data: {error}</p>
        </div>
      )}

      {/* ── Quick Action ── */}
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

      {/* ── Loading state ── */}
      {loading && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 20, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>⏳ Memuat data dari Supabase...</p>
        </div>
      )}

      {/* ── Section Cards ── */}
      {!loading && (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
            {SECTIONS.map((section) => {
              const active  = section.id === selectedSection;
              const countLabel = getSectionCountLabel(section.id, data.stokItems, data.transactions);
              const isBlocked  = section.blocked;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSection(section.id)}
                  style={{
                    textAlign: 'left',
                    border: active
                      ? '1.5px solid #f59e0b'
                      : isBlocked ? '1px solid #d1d5db' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    background: active ? '#fffbeb' : isBlocked ? '#f9fafb' : 'var(--color-surface)',
                    padding: 13, cursor: 'pointer', minHeight: 110,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 23 }}>{section.icon}</span>
                    {isBlocked
                      ? <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700 }}>Blocked</span>
                      : section.id === 'ai_insight'
                        ? <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 700 }}>N/I</span>
                        : <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>Live</span>
                    }
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 800, color: isBlocked ? '#9ca3af' : 'var(--color-text)' }}>
                    {section.title}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.35 }}>
                    {countLabel}
                  </p>
                </button>
              );
            })}
          </section>

          {/* ── Detail Panel ── */}
          <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>{selected.icon}</span>
              <div>
                <h2 style={{ margin: 0, fontSize: 15, color: 'var(--color-text)' }}>{selected.title}</h2>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>{selected.description}</p>
              </div>
            </div>

            {selected.blocked ? (
              <BlockedDetail section={selected} />
            ) : selected.id === 'products' ? (
              <ProductsDetail items={data.stokItems} />
            ) : selected.id === 'stock' ? (
              <StockDetail items={data.stokItems} />
            ) : selected.id === 'incoming' ? (
              <TransactionList transactions={data.transactions} type="Masuk" />
            ) : selected.id === 'outgoing' ? (
              <TransactionList transactions={data.transactions} type="Keluar" />
            ) : selected.id === 'movements' ? (
              <TransactionList transactions={data.transactions} type="all" />
            ) : selected.id === 'ai_insight' ? (
              <AiInsightDetail />
            ) : null}
          </section>
        </>
      )}
    </main>
  );
}
