// ─── FeedStoreOperational — ADMIN-FOUNDATION-003 ──────────────────────────────
// Dashboard Operasional Workspace Toko Pakan — LIVE dari Supabase.
//
// Sumber data:
//   LIVE    → stok_inventaris               (Daftar Produk, Manajemen Stok)
//   LIVE    → stok_inventaris_transactions  (Transaksi Masuk, Transaksi Keluar, Gerakan Stok)
//   LIVE    → activity_log                  (Aktivitas)
//   LIVE    → feed_store_suppliers          (Supplier)
//   LIVE    → feed_store_customers          (Pelanggan)
//   LIVE    → feed_store_orders             (Pesanan — digunakan di Laporan)
//   LIVE    → feed_store_sales              (Penjualan — digunakan di Laporan)

import { useState, useEffect, type ReactElement } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  formatRupiah,
} from '../../hooks/useFeedStoreDashboardData';
import { useStokInventaris } from '../../hooks/useStokInventaris';
import { computeStokAiInsights, type StokInsight } from '../../utils/stokInsight';
import {
  recordTambahStok,
  type RecordTambahStokInput,
} from '../../services/stokInventarisService';
import { addInventarisFromTambahStok } from '../../data/stokInventarisData';
import type { StokInventarisDbRow, StokTransactionDbRow } from '../../types/stokInventaris';
import type { FeedStoreSupplierDbRow, FeedStoreCustomerDbRow, FeedStoreOrderDbRow, FeedStoreSalesDbRow } from '../../types/feedStore';
import type { FeedStoreSalesSummaryData } from '../../hooks/useFeedStoreDashboardData';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId = 'products' | 'stock' | 'incoming' | 'outgoing' | 'movements' | 'supplier' | 'customers' | 'reports';

interface Section {
  id: SectionId;
  icon: string;
  title: string;
  description: string;
  blocked: boolean;
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
    blocked: false,
  },
  {
    id: 'customers',
    icon: '👥',
    title: 'Pelanggan',
    description: 'Kelola data pelanggan toko dan histori pembelian.',
    blocked: false,
  },
  {
    id: 'reports',
    icon: '📊',
    title: 'Laporan',
    description: 'Laporan penjualan, stok, dan kinerja toko.',
    blocked: false,
  },
];

// ─── Shared UI ────────────────────────────────────────────────────────────────

function EmptyState({ icon, message, hint }: { icon: string; message: string; hint?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 10px' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', fontWeight: 600 }}>{message}</p>
      {hint && <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>{hint}</p>}
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
      }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function FieldWrap({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
      {label}{required ? ' *' : ''}
      <div style={{ marginTop: 4 }}>{children}</div>
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
  fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none',
};

// ─── AI Insight Card ─────────────────────────────────────────────────────────────
// Komponen reusable — tiap modul menyediakan item insight spesifiknya.

interface AiInsightItem {
  icon: string;
  text: string;
  color?: string;
}

interface AiInsightCardProps {
  title: string;
  icon: string;
  items: AiInsightItem[];
  emptyMessage?: string;
}

function AiInsightCard({ title, icon, items, emptyMessage = 'Belum ada data yang dapat dianalisis.' }: AiInsightCardProps) {
  if (items.length === 0) {
    return (
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{title}</span>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11 }}>{item.icon}</span>
            <p style={{ margin: 0, fontSize: 10, lineHeight: 1.4, color: item.color ?? '#334155' }}>
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Per-module AI Insight Functions ─────────────────────────────────────────────
// Setiap fungsi menerima data LIVE dari modul masing-masing dan mengembalikan
// insight item yang spesifik. AiInsightCard bersifat reusable, namun sumber
// datanya tetap spesifik per modul.

function computeStockInsight(): AiInsightItem[] {
  const insights: StokInsight[] = computeStokAiInsights();
  const active = insights.slice(0, 6);
  return active.map((insight) => ({
    icon: insight.icon,
    text: insight.text,
    color: insight.color,
  }));
}

function computeProductsInsight(items: StokInventarisDbRow[]): AiInsightItem[] {
  if (items.length === 0) return [];

  const aktif = items.filter((i) => i.status === 'Aktif');
  const habis = items.filter((i) => i.status === 'Habis');
  const kadaluarsa = items.filter((i) => i.status === 'Kadaluarsa');
  const diarsipkan = items.filter((i) => i.status === 'Diarsipkan');

  const bySource: Record<string, number> = {};
  items.forEach((i) => {
    const s = i.source_type ?? 'Lain';
    bySource[s] = (bySource[s] ?? 0) + 1;
  });

  const result: AiInsightItem[] = [
    {
      icon: '📦',
      text: `${formatNumber(items.length)} jenis produk tercatat — ${formatNumber(aktif.length)} aktif, ${formatNumber(habis.length)} habis.`,
    },
  ];

  if (kadaluarsa.length > 0 || diarsipkan.length > 0) {
    result.push({
      icon: '⚠️',
      text: `${formatNumber(kadaluarsa.length)} kadaluarsa, ${formatNumber(diarsipkan.length)} diarsipkan.`,
      color: '#92400e',
    });
  }

  const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0];
  if (topSource) {
    result.push({
      icon: '🏷️',
      text: `Sumber terbanyak: ${topSource[0]} (${formatNumber(topSource[1])} item).`,
    });
  }

  const lowStock = items.filter((i) => i.min_stock !== null && i.quantity <= i.min_stock);
  if (lowStock.length > 0) {
    result.push({
      icon: '📉',
      text: `${formatNumber(lowStock.length)} produk di bawah stok minimum.`,
      color: '#c62828',
    });
  }

  return result;
}

// ─── Section Detail Views ─────────────────────────────────────────────────────

function ProductsDetail({ items, onItemClick }: { items: StokInventarisDbRow[]; onItemClick: (item: StokInventarisDbRow) => void }) {
  return (
    <div>
      <AiInsightCard
        title="AI Insight Daftar Produk"
        icon="🤖"
        items={computeProductsInsight(items)}
      />

      {items.length === 0 ? (
        <EmptyState
          icon="🌾"
          message="Belum ada item stok tercatat di workspace ini."
          hint="Gunakan menu Stok Masuk untuk mulai mencatat inventaris."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.slice(0, 10).map((item) => (
        <div
          key={item.id}
           onClick={() => onItemClick(item)}
           style={{
             display: 'flex', alignItems: 'center', gap: 10,
             padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
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
      )}
    </div>
  );
}

function StockDetail({ items, onItemClick }: { items: StokInventarisDbRow[]; onItemClick: (item: StokInventarisDbRow) => void }) {
  const lowStock = getLowStockItems(items);
  const aktif    = items.filter((i) => i.status === 'Aktif').length;
  const habis    = items.filter((i) => i.status === 'Habis').length;
  const stockInsights: AiInsightItem[] = computeStockInsight();

  return (
    <div>
      {/* AI Insight Manajemen Stok — setelah header, sebelum ringkasan */}
      <AiInsightCard
        title="AI Insight Manajemen Stok"
        icon="🤖"
        items={stockInsights}
        emptyMessage={items.length === 0 ? 'Belum ada data yang dapat dianalisis.' : undefined}
      />

      {/* Ringkasan */}
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
            <div key={item.id} onClick={() => onItemClick(item)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#fffbeb', borderRadius: 8, marginBottom: 5, border: '1px solid #fde68a', cursor: 'pointer' }}>
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

// ─── Supplier Detail (LIVE) ───────────────────────────────────────────────────

function SupplierDetail({ suppliers }: { suppliers: FeedStoreSupplierDbRow[] }) {
  const aktif    = suppliers.filter((s) => s.status === 'Aktif').length;
  const nonaktif = suppliers.filter((s) => s.status !== 'Aktif').length;

  if (suppliers.length === 0) {
    return (
      <EmptyState
        icon="🚚"
        message="Belum ada supplier yang terdaftar."
        hint="Tambahkan supplier untuk mencatat pemasok pakan."
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Total supplier', value: formatNumber(suppliers.length), color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Aktif',          value: formatNumber(aktif),            color: '#166534', bg: '#f0fdf4' },
          { label: 'Nonaktif',       value: formatNumber(nonaktif),         color: '#6b7280', bg: '#f9fafb' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 10, padding: '9px 7px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: stat.color, fontWeight: 600 }}>{stat.label}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {suppliers.slice(0, 10).map((sup) => (
          <div
            key={sup.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 9,
              background: sup.status === 'Aktif' ? '#f0fdf4' : '#f9fafb',
              border: `1px solid ${sup.status === 'Aktif' ? '#bbf7d0' : '#e5e7eb'}`,
            }}
          >
            <span style={{ fontSize: 20 }}>🚚</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sup.name}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                {[sup.contact_name, sup.phone, sup.city].filter(Boolean).join(' · ') || 'Tidak ada kontak'}
              </p>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, flexShrink: 0,
              color: sup.status === 'Aktif' ? '#166534' : '#6b7280',
              background: sup.status === 'Aktif' ? '#dcfce7' : '#f3f4f6',
            }}>
              {sup.status}
            </span>
          </div>
        ))}
        {suppliers.length > 10 && (
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
            ... dan {suppliers.length - 10} supplier lainnya
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Customer Detail (LIVE) ───────────────────────────────────────────────────

function CustomerDetail({ customers }: { customers: FeedStoreCustomerDbRow[] }) {
  const aktif = customers.filter((c) => c.status === 'Aktif').length;
  const byType: Record<string, number> = {};
  for (const c of customers) {
    const t = c.customer_type ?? 'Lainnya';
    byType[t] = (byType[t] ?? 0) + 1;
  }

  if (customers.length === 0) {
    return (
      <EmptyState
        icon="👥"
        message="Belum ada pelanggan yang terdaftar."
        hint="Tambahkan data pelanggan untuk mencatat pembeli pakan."
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Total pelanggan', value: formatNumber(customers.length), color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Aktif',           value: formatNumber(aktif),            color: '#166534', bg: '#f0fdf4' },
          { label: 'Nonaktif',        value: formatNumber(customers.length - aktif), color: '#6b7280', bg: '#f9fafb' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 10, padding: '9px 7px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: stat.color, fontWeight: 600 }}>{stat.label}</p>
          </div>
        ))}
      </div>
      {Object.keys(byType).length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {Object.entries(byType).map(([type, count]) => (
            <span key={type} style={{ fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#5b21b6', padding: '3px 8px', borderRadius: 6 }}>
              {type}: {count}
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {customers.slice(0, 10).map((cust) => (
          <div
            key={cust.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 9,
              background: cust.status === 'Aktif' ? '#f5f3ff' : '#f9fafb',
              border: `1px solid ${cust.status === 'Aktif' ? '#ddd6fe' : '#e5e7eb'}`,
            }}
          >
            <span style={{ fontSize: 20 }}>👤</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cust.name}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                {[cust.customer_type, cust.phone, cust.city].filter(Boolean).join(' · ') || 'Tidak ada kontak'}
              </p>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, flexShrink: 0,
              color: cust.status === 'Aktif' ? '#5b21b6' : '#6b7280',
              background: cust.status === 'Aktif' ? '#ede9fe' : '#f3f4f6',
            }}>
              {cust.status}
            </span>
          </div>
        ))}
        {customers.length > 10 && (
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
            ... dan {customers.length - 10} pelanggan lainnya
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Reports Detail (LIVE) ────────────────────────────────────────────────────

function ReportsDetail({
  salesSummary,
  recentOrders,
  recentSales,
  stokItems,
  transactions,
}: {
  salesSummary: FeedStoreSalesSummaryData;
  recentOrders: FeedStoreOrderDbRow[];
  recentSales: FeedStoreSalesDbRow[];
  stokItems: StokInventarisDbRow[];
  transactions: StokTransactionDbRow[];
}) {
  const totalStokValue  = 0; // harga beli tidak ada di stok_inventaris
  const masukCount      = getTransaksiMasuk(transactions).length;
  const keluarCount     = getTransaksiKeluar(transactions).length;
  const penjualanOrders = recentOrders.filter((o) => o.order_type === 'Penjualan');
  const pembelianOrders = recentOrders.filter((o) => o.order_type === 'Pembelian');

  return (
    <div>
      {/* Ringkasan Finansial */}
      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: 'var(--color-text)' }}>💰 Ringkasan Finansial</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
        <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 12 }}>
          <p style={{ margin: 0, fontSize: 10, color: '#166534', fontWeight: 700 }}>Penjualan Hari Ini</p>
          <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 800, color: '#15803d', wordBreak: 'break-word' }}>
            {salesSummary.todayRevenue > 0 ? formatRupiah(salesSummary.todayRevenue) : 'Rp 0'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#166534' }}>{formatNumber(salesSummary.todayOrderCount)} order</p>
        </div>
        <div style={{ background: '#fff7ed', borderRadius: 10, padding: 12 }}>
          <p style={{ margin: 0, fontSize: 10, color: '#9a3412', fontWeight: 700 }}>Penjualan Bulan Ini</p>
          <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 800, color: '#7c2d12', wordBreak: 'break-word' }}>
            {salesSummary.monthRevenue > 0 ? formatRupiah(salesSummary.monthRevenue) : 'Rp 0'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#9a3412' }}>{formatNumber(salesSummary.monthSalesCount)} catatan penjualan</p>
        </div>
      </div>

      {/* Ringkasan Order */}
      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: 'var(--color-text)' }}>📋 Ringkasan Order</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
        <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 12 }}>
          <p style={{ margin: 0, fontSize: 10, color: '#166534', fontWeight: 700 }}>🧾 Order Penjualan</p>
          <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: '#15803d' }}>{formatNumber(penjualanOrders.length)}</p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#166534' }}>dari {recentOrders.length} total order</p>
        </div>
        <div style={{ background: '#eff6ff', borderRadius: 10, padding: 12 }}>
          <p style={{ margin: 0, fontSize: 10, color: '#1d4ed8', fontWeight: 700 }}>📦 Order Pembelian</p>
          <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: '#1e40af' }}>{formatNumber(pembelianOrders.length)}</p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#1d4ed8' }}>dari {recentOrders.length} total order</p>
        </div>
      </div>

      {/* Ringkasan Stok */}
      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: 'var(--color-text)' }}>📦 Ringkasan Stok</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Total item stok', value: formatNumber(stokItems.length),   color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Stok masuk',      value: formatNumber(masukCount),         color: '#166534', bg: '#f0fdf4' },
          { label: 'Stok keluar',     value: formatNumber(keluarCount),        color: '#991b1b', bg: '#fef2f2' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 10, padding: '9px 7px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</p>
            <p style={{ margin: '2px 0 0', fontSize: 9, color: stat.color, fontWeight: 600 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Catatan Penjualan Terbaru */}
      {recentSales.length > 0 && (
        <>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: 'var(--color-text)' }}>🧾 Catatan Penjualan Terbaru</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentSales.slice(0, 5).map((sale) => {
              const statusColor = sale.status === 'Selesai' ? '#166534' : sale.status === 'Dibatalkan' ? '#991b1b' : '#92400e';
              const statusBg    = sale.status === 'Selesai' ? '#f0fdf4'  : sale.status === 'Dibatalkan' ? '#fef2f2'  : '#fffbeb';
              return (
                <div key={sale.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: 16 }}>🧾</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>
                      {formatRupiah(sale.total_amount)}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                      {sale.sale_date} · {sale.payment_method ?? 'Metode tidak dicatat'}
                    </p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, background: statusBg, padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>
                    {sale.status}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {recentOrders.length === 0 && recentSales.length === 0 && (
        <div style={{ marginTop: 8 }}>
          <EmptyState icon="📊" message="Belum ada data laporan." hint="Data akan muncul setelah order dan catatan penjualan dicatat." />
        </div>
      )}

      {totalStokValue === 0 && (
        <p style={{ margin: '12px 0 0', fontSize: 10, color: 'var(--color-muted)', fontStyle: 'italic' }}>
          * Nilai stok tidak tersedia — tabel stok_inventaris tidak menyimpan harga satuan.
        </p>
      )}
    </div>
  );
}

// ─── Stock Item Detail Modal ──────────────────────────────────────────────────

function StockItemDetailModal({
  item,
  transactions,
  onClose,
}: {
  item: StokInventarisDbRow;
  transactions: StokTransactionDbRow[];
  onClose: () => void;
}) {
  const itemTx = transactions
    .filter((t) => t.stok_id === item.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const isLowStock = getLowStockItems([item]).length > 0;

  return (
    <ModalOverlay onClose={onClose}>
      {/* AI Insight Baru saja diperbarui */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>🌾</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>
            {item.item_name}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>
            {item.source_type} · Stok: {formatNumber(item.quantity)} {item.unit ?? ''} · Min: {item.min_stock !== null ? formatNumber(item.min_stock) : '-'}
          </p>
        </div>
      </div>

      {isLowStock && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 10, padding: '10px 12px', marginBottom: 14,
        }}>
          <p style={{ margin: 0, fontSize: 11, color: '#92400e', fontWeight: 700 }}>
            ⚠️ Stok di bawah ambang minimum — segera lakukan Tambah Stok.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Status',   value: item.status, color: '#166534', bg: '#f0fdf4' },
          { label: 'Stok',     value: `${formatNumber(item.quantity)} ${item.unit ?? ''}`, color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Min Stok', value: item.min_stock !== null ? formatNumber(item.min_stock) : '-', color: '#92400e', bg: '#fffbeb' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 10, padding: '9px 7px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 10, color: stat.color, fontWeight: 600 }}>{stat.label}</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 800, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {item.purchase_price_per_kg !== null && item.purchase_price_per_kg !== undefined && (
        <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--color-muted)' }}>
          Harga beli: {formatRupiah(item.purchase_price_per_kg)}/{item.unit ?? 'Kg'}
        </p>
      )}

      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: 'var(--color-text)' }}>📜 Riwayat Transaksi</p>
      {itemTx.length === 0 ? (
        <EmptyState icon="📜" message="Belum ada transaksi untuk item ini." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {itemTx.slice(0, 20).map((tx) => {
            const isMasuk = tx.transaction_type === 'Masuk';
            const isPenyesuaian = tx.transaction_type === 'Penyesuaian';
            const color = isMasuk ? '#166534' : isPenyesuaian ? '#1d4ed8' : '#991b1b';
            const bg = isMasuk ? '#f0fdf4' : isPenyesuaian ? '#eff6ff' : '#fef2f2';
            const icon = isMasuk ? '📥' : isPenyesuaian ? '🔄' : '📤';
            const sign = isMasuk || (isPenyesuaian && tx.quantity_delta > 0) ? '+' : '';
            return (
              <div
                key={tx.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: bg, border: `1px solid ${isMasuk ? '#bbf7d0' : isPenyesuaian ? '#c7d2fe' : '#fecaca'}` }}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>
                    {tx.reason ?? tx.transaction_type}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                    {tx.transaction_date} · {tx.reference_type ?? '-'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color }}>{sign}{formatNumber(Math.abs(tx.quantity_delta))}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 9, color: 'var(--color-muted)' }}>{formatRelativeTime(tx.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ background: '#f1f5f9', color: '#374151', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Tutup
        </button>
      </div>
    </ModalOverlay>
  );
}

// ─── Stok Masuk Modal ────────────────────────────────────────────────────────

function StokMasukModal({
  items,
  workspaceId,
  onClose,
  onSaved,
}: {
  items: StokInventarisDbRow[];
  workspaceId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('Kg');
  const [jumlah, setJumlah] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [supplier, setSupplier] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [catatan, setCatatan] = useState('');
  const [hargaBeli, setHargaBeli] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const matchedItem = items.find(
    (i) => i.item_name.toLowerCase() === itemName.trim().toLowerCase(),
  );

  async function handleSubmit() {
    if (!itemName.trim()) { setError('Nama item wajib diisi.'); return; }
    if (!jumlah || Number(jumlah) <= 0) { setError('Jumlah harus lebih dari 0.'); return; }

    setSaving(true);
    setError('');

    try {
      const sumber = matchedItem?.source_type ?? 'Produk Komersial';
      const itemId = matchedItem?.id ?? '';
      const kategori = sumber === 'Produk Komersial' ? 'Produk Komersial' : sumber;

      const input: RecordTambahStokInput = {
        itemId:      itemId,
        itemName:    itemName.trim(),
        sumber:      sumber as 'Master Pakan' | 'Produk Komersial' | 'Formula',
        unit:        unit || 'Kg',
        jumlah:      Number(jumlah),
        tanggal:     tanggal,
        supplier:    supplier || undefined,
        lokasi:      lokasi || undefined,
        catatan:     catatan || undefined,
        hargaBeli:   hargaBeli ? Number(hargaBeli) : undefined,
        kategori:    kategori,
      };

      const result = await recordTambahStok(workspaceId, input);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Phase 1: dual-write to in-memory store for immediate UI reactivity
      const sumberInventaris: 'Master Pakan' | 'Produk Komersial' | 'Hasil Produksi' =
        sumber === 'Produk Komersial' ? 'Produk Komersial'
        : sumber === 'Master Pakan' ? 'Master Pakan'
        : 'Hasil Produksi';

      addInventarisFromTambahStok({
        referensiId:   matchedItem?.id ?? '',
        nama:          itemName.trim(),
        kategori:      kategori,
        sumber:        sumberInventaris,
        jumlahStok:    Number(jumlah),
        satuan:        unit || 'Kg',
        tanggalMasuk:  tanggal,
        supplier:      supplier || undefined,
        lokasiPenyimpanan: lokasi || undefined,
        hargaBeli:     hargaBeli ? Number(hargaBeli) : undefined,
         catatan:       catatan || undefined,
       });

      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan stok.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: 'var(--color-text)' }}>
        📥 Tambah Stok
      </h2>

      <p style={{ margin: '0 0 14px', fontSize: 11, color: 'var(--color-muted)' }}>
        Lengkapi form di bawah untuk mencatat penambahan stok ke sistem.
      </p>

      <FieldWrap label="Nama Item" required>
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="mis. Konsentrat Sapi Pro"
          style={inputStyle}
        />
        {matchedItem && (
          <p style={{ margin: '4px 0 0', fontSize: 10, color: '#166534' }}>
            Ditemukan di stok: {matchedItem.item_name} (stok: {formatNumber(matchedItem.quantity)} {matchedItem.unit})
          </p>
        )}
      </FieldWrap>

      <FieldWrap label="Satuan">
        <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} />
      </FieldWrap>

      <FieldWrap label="Jumlah" required>
        <input
          type="number"
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value)}
          placeholder="mis. 100"
          style={inputStyle}
        />
      </FieldWrap>

      <FieldWrap label="Tanggal" required>
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={inputStyle} />
      </FieldWrap>

      <FieldWrap label="Supplier">
        <input
          type="text"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="mis. CV. Sumber Jaya"
          style={inputStyle}
        />
      </FieldWrap>

      <FieldWrap label="Lokasi Penyimpanan">
        <input
          type="text"
          value={lokasi}
          onChange={(e) => setLokasi(e.target.value)}
          placeholder="mis. Gudang A"
          style={inputStyle}
        />
      </FieldWrap>

      <FieldWrap label="Harga Beli per Satuan">
        <input
          type="number"
          value={hargaBeli}
          onChange={(e) => setHargaBeli(e.target.value)}
          placeholder="mis. 12000"
          style={inputStyle}
        />
      </FieldWrap>

      <FieldWrap label="Catatan">
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan tambahan (opsional)"
          rows={3}
          style={{ ...inputStyle, fontFamily: 'inherit' }}
        />
      </FieldWrap>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
          padding: '8px 10px', marginBottom: 12,
        }}>
          <p style={{ margin: 0, fontSize: 11, color: '#991b1b' }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          disabled={saving}
          style={{ background: '#f1f5f9', color: '#374151', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}
        >
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: '#166534', color: '#fff', padding: '10px 20px',
            borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </ModalOverlay>
  );
}

// ─── Count Labels ─────────────────────────────────────────────────────────────

function getSectionCountLabel(
  sectionId: SectionId,
  items: StokInventarisDbRow[],
  transactions: StokTransactionDbRow[],
  suppliers: FeedStoreSupplierDbRow[],
  customers: FeedStoreCustomerDbRow[],
  recentOrders: FeedStoreOrderDbRow[],
  salesSummary: FeedStoreSalesSummaryData,
): string {
  switch (sectionId) {
    case 'products':  return `${formatNumber(items.length)} item stok`;
    case 'stock': {
      const low = getLowStockItems(items).length;
      return low > 0 ? `${formatNumber(low)} perlu perhatian` : `${formatNumber(items.length)} item`;
    }
    case 'incoming':   return `${formatNumber(getTransaksiMasuk(transactions).length)} transaksi`;
    case 'outgoing':   return `${formatNumber(getTransaksiKeluar(transactions).length)} transaksi`;
    case 'movements':  return `${formatNumber(transactions.length)} total gerakan`;
    case 'supplier':   return `${formatNumber(suppliers.length)} supplier`;
    case 'customers':  return `${formatNumber(customers.length)} pelanggan`;
    case 'reports':    return salesSummary.todayRevenue > 0 ? formatRupiah(salesSummary.todayRevenue) : `${formatNumber(recentOrders.length)} order`;
    default: return '-';
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FeedStoreOperational(): ReactElement {
  const { id: workspaceId = '' } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState<SectionId>('products');
  const [itemDetailOpen, setItemDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StokInventarisDbRow | null>(null);
  const [stokMasukOpen, setStokMasukOpen] = useState(false);

  const config          = getWorkspaceOperationalConfig('FeedStore');
  const dashboardConfig = getWorkspaceDashboardConfig('FeedStore');
  const { data, loading, error, refresh: dataRefresh } = useFeedStoreDashboardData(workspaceId);

  // Populate in-memory stores so computeStokAiInsights() reads production data LIVE.
  useStokInventaris();

  const workspaceName = data.workspace?.workspace_name ?? config.title;
  const selected      = SECTIONS.find((s) => s.id === selectedSection) ?? SECTIONS[0];

  // Handle ?action= params from Quick Actions / Dashboard module cards
  useEffect(() => {
    const action = searchParams.get('action');
    if (!action) return;

    if (action === 'stok-masuk') {
      setSelectedSection('stock');
      setStokMasukOpen(true);
      window.setTimeout(() => {
        searchParams.delete('action');
        setSearchParams(searchParams, { replace: true });
      }, 100);
    } else if (action === 'stok-keluar' || action === 'transaksi-keluar') {
      setSelectedSection('outgoing');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'transaksi-masuk') {
      setSelectedSection('incoming');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'tambah-produk' || action === 'penjualan' || action === 'pembelian') {
      setSelectedSection('products');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const handleItemClick = (item: StokInventarisDbRow) => {
    setSelectedItem(item);
    setItemDetailOpen(true);
  };

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
              const active     = section.id === selectedSection;
              const countLabel = getSectionCountLabel(
                section.id,
                data.stokItems,
                data.transactions,
                data.suppliers,
                data.customers,
                data.recentOrders,
                data.salesSummary,
              );
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSection(section.id)}
                  style={{
                    textAlign: 'left',
                    border: active ? '1.5px solid #f59e0b' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    background: active ? '#fffbeb' : 'var(--color-surface)',
                    padding: 13, cursor: 'pointer', minHeight: 110,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 23 }}>{section.icon}</span>
                    <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>Live</span>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
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
               <div style={{ flex: 1, minWidth: 0 }}>
                 <h2 style={{ margin: 0, fontSize: 15, color: 'var(--color-text)' }}>{selected.title}</h2>
                 <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>{selected.description}</p>
               </div>
               {selected.id === 'stock' && (
                 <button
                   type="button"
                   onClick={() => setStokMasukOpen(true)}
                   style={{
                     border: '1px solid #166534', borderRadius: 9, background: '#166534',
                     color: '#fff', padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                     display: 'flex', alignItems: 'center', gap: 4,
                   }}
                 >
                   <span>＋</span> Stok Masuk
                 </button>
                )}
              </div>

             {selected.id === 'products' ? (
              <ProductsDetail items={data.stokItems} onItemClick={handleItemClick} />
            ) : selected.id === 'stock' ? (
              <StockDetail items={data.stokItems} onItemClick={handleItemClick} />
            ) : selected.id === 'incoming' ? (
              <TransactionList transactions={data.transactions} type="Masuk" />
            ) : selected.id === 'outgoing' ? (
              <TransactionList transactions={data.transactions} type="Keluar" />
            ) : selected.id === 'movements' ? (
              <TransactionList transactions={data.transactions} type="all" />
            ) : selected.id === 'supplier' ? (
              <SupplierDetail suppliers={data.suppliers} />
            ) : selected.id === 'customers' ? (
              <CustomerDetail customers={data.customers} />
             ) : selected.id === 'reports' ? (
               <ReportsDetail
                 salesSummary={data.salesSummary}
                 recentOrders={data.recentOrders}
                 recentSales={data.recentSales}
                 stokItems={data.stokItems}
                 transactions={data.transactions}
               />
             ) : null}
         </section>
        </>
      )}

      {itemDetailOpen && selectedItem && (
        <StockItemDetailModal
          item={selectedItem}
          transactions={data.transactions}
          onClose={() => {
            setItemDetailOpen(false);
            setSelectedItem(null);
          }}
        />
      )}

      {stokMasukOpen && (
        <StokMasukModal
          items={data.stokItems}
          workspaceId={workspaceId}
          onClose={() => setStokMasukOpen(false)}
          onSaved={dataRefresh}
        />
      )}
    </main>
  );
}
