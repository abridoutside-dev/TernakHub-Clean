import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  useFeedStoreDashboardData,
  getLowStockItems,
  formatNumber,
  formatRupiah,
  type FeedStoreSalesSummaryData,
} from '../../hooks/useFeedStoreDashboardData';
import type { StokInventarisDbRow, StokTransactionDbRow } from '../../types/stokInventaris';
import type { FeedStoreSupplierDbRow, FeedStoreCustomerDbRow } from '../../types/feedStore';
import type { ActivityLogDbRow } from '../../types/activityLog';
import { AiInsightCard, type AiInsightItem } from '../AiInsightCard';
import {
  getAiGeneratedSummary,
  getTopInsights,
  CATEGORY_META,
  PRIORITY_META,
  formatRelativeTime,
  type AiInsightItem as DashboardAiInsightItem,
} from '../../data/aiInsightData';

// ─────────────────────────────────────────────────────────────────────────────
// DB-003 — Dashboard AI Insight
// DB-003R — Revisi: AI Insight WAJIB diringkas.
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Dashboard bukan halaman AI. Card ini HANYA menampilkan:
//   AI Generated Summary → maksimal 3 Insight Prioritas → [Lihat Semua Insight]
// Setiap Insight cukup: Icon, Judul, Ringkasan singkat, tombol "Buka Modul".
// Tidak ada badge/source/timestamp panjang, tidak ada card bertingkat — daftar
// lengkap (semua priority, semua detail) dipindahkan ke halaman
// "Lihat Semua Insight" (/dashboard/ai-insight), lihat DashboardAiInsight.tsx.
//
// Komponen ini TIDAK mengubah data modul manapun — "Buka Modul" hanya
// navigasi, logic bisnis tetap berada di modul asal.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Home Dashboard AI Insight ──────────────────────────────────────────────────
// Insight level Dashboard Home (Control Center) — mengagregasi status operasional
// workspace aktif secara keseluruhan. Untuk workspace Toko Pakan, menggunakan
// data Feed Store yang bersumber langsung dari Supabase (workspace-scoped).
// Insight ini BERBEDA dari AI Insight Dashboard Toko Pakan — level lebih tinggi,
// fokus pada kesehatan operasional workspace secara cross-module.

function computeHomeDashboardInsight(
  wsType: string | undefined,
  stokItems: StokInventarisDbRow[],
  transactions: StokTransactionDbRow[],
  suppliers: FeedStoreSupplierDbRow[],
  customers: FeedStoreCustomerDbRow[],
  salesSummary: FeedStoreSalesSummaryData,
  activities: ActivityLogDbRow[],
): AiInsightItem[] {
  if (wsType !== 'FeedStore') return [];

  const hasStok = stokItems.length > 0;
  const hasTransaction = transactions.length > 0;
  const hasSuppliers = suppliers.length > 0;
  const hasCustomers = customers.length > 0;
  const hasSales = salesSummary.monthRevenue > 0;
  const hasActivity = activities.length > 0;

  if (!hasStok && !hasTransaction && !hasSuppliers && !hasCustomers && !hasSales && !hasActivity) {
    return [];
  }

  const result: AiInsightItem[] = [];

  const lowStockCount = getLowStockItems(stokItems).length;
  const aktifItems = stokItems.filter((i) => i.status === 'Aktif').length;

  if (hasStok) {
    if (lowStockCount > 0) {
      result.push({
        icon: '⚠️',
        text: `${formatNumber(lowStockCount)} item stok perlu restock — segera lakukan Tambah Stok.`,
        color: '#c62828',
      });
    } else if (aktifItems === stokItems.length) {
      result.push({
        icon: '✅',
        text: `Stok sehat: ${formatNumber(stokItems.length)} item semuanya aktif, tidak ada yang perlu restock.`,
      });
    }
  }

  const aktifSuppliers = suppliers.filter((s) => s.status === 'Aktif').length;
  const aktifCustomers = customers.filter((c) => c.status === 'Aktif').length;

  if (hasSuppliers && hasCustomers) {
    result.push({
      icon: '🏪',
      text: `Pasokan & pelanggan: ${formatNumber(aktifSuppliers)} supplier aktif, ${formatNumber(aktifCustomers)} pelanggan aktif teregistrasi.`,
    });
  }

  if (hasSales) {
    result.push({
      icon: '💼',
      text: `Toko Pakan berjalan: pendapatan bulan ini ${formatRupiah(salesSummary.monthRevenue)} dari ${formatNumber(salesSummary.monthSalesCount)} transaksi.`,
    });
  } else if (hasTransaction) {
    const masukCount = transactions.filter((t) => t.transaction_type === 'Masuk').length;
    const keluarCount = transactions.filter((t) => t.transaction_type === 'Keluar').length;
    result.push({
      icon: '📊',
      text: `Aktivitas stok aktif: ${formatNumber(masukCount)} masuk, ${formatNumber(keluarCount)} keluar — belum ada penjualan tercatat.`,
    });
  }

  return result;
}

function AiSummaryPanel() {
  const summary = getAiGeneratedSummary();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
        ✨
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>AI Generated Summary</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.4 }}>{summary.summaryText}</div>
      </div>
    </div>
  );
}

// HOME-002 — Setiap card WAJIB: Icon, Priority, Category, Judul,
// Deskripsi singkat, Source Module, Relative Time, Tombol "Buka Modul".
function TopInsightRow({ item, onOpen }: { item: DashboardAiInsightItem; onOpen: (item: DashboardAiInsightItem) => void }) {
  const categoryMeta = CATEGORY_META[item.category];
  const priorityMeta = PRIORITY_META[item.priority];

  return (
    <div style={{ paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Icon (dari Category) */}
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{categoryMeta.icon}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Priority badge + Category label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
              textTransform: 'uppercase',
              color: priorityMeta.color, background: priorityMeta.bg,
              borderRadius: 20, padding: '2px 8px',
            }}>
              {priorityMeta.icon} {priorityMeta.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {categoryMeta.label}
            </span>
          </div>

          {/* Judul */}
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>

          {/* Deskripsi singkat */}
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.4 }}>{item.summary}</div>

          {/* Source Module + Relative Time */}
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 5, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>Sumber: {item.sourceModule}</span>
            <span>•</span>
            <span>{formatRelativeTime(item.timestamp)}</span>
          </div>
        </div>

        {/* Tombol Buka Modul */}
        <button
          type="button"
          onClick={() => onOpen(item)}
          style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--color-primary)',
            background: 'var(--color-primary-light)',
            border: 'none',
            borderRadius: 20,
            padding: '6px 10px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            marginTop: 2,
          }}
        >
          Buka Modul
        </button>
      </div>
    </div>
  );
}

/**
 * Section AI Insight (ringkas) — Dashboard bukan halaman AI, sehingga hanya
 * menampilkan AI Generated Summary + maksimal 3 Insight Prioritas tertinggi
 * (Critical → Warning → Recommendation). Daftar Insight lengkap ada di
 * halaman terpisah, dibuka lewat "Lihat Semua Insight".
 */
export default function AiInsightSection() {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const wsUuid = activeWorkspace?.workspace_uuid ?? '';
  const wsType = activeWorkspace?.workspace_type;

  const { data: feedStoreData } = useFeedStoreDashboardData(wsUuid);
  const homeInsight = computeHomeDashboardInsight(
    wsType,
    feedStoreData.stokItems,
    feedStoreData.transactions,
    feedStoreData.suppliers,
    feedStoreData.customers,
    feedStoreData.salesSummary,
    feedStoreData.activities,
  );
  const topInsights = getTopInsights();

  const handleOpen = (item: DashboardAiInsightItem) => {
    // Insight hanya menavigasi ke modul asal — tidak ada logic bisnis di sini.
    const action = item.actions.find((a) => a.type === 'buka-modul') ?? item.actions.find((a) => a.to);
    if (action?.to) navigate(action.to);
  };

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <AiSummaryPanel />

      {homeInsight.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <AiInsightCard
            title="AI Insight Dashboard"
            icon="🤖"
            items={homeInsight}
          />
        </div>
      )}

      {topInsights.length === 0 ? (
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--color-border)', marginTop: 12, fontSize: 12, color: 'var(--color-muted)' }}>
          ✅ Tidak ada Insight yang memerlukan perhatian.
        </div>
      ) : (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topInsights.map((item) => (
            <TopInsightRow key={item.id} item={item} onOpen={handleOpen} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate('/dashboard/ai-insight')}
        style={{
          marginTop: 14,
          background: 'none',
          border: 'none',
          color: 'var(--color-primary)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          padding: '10px 0 0',
          width: '100%',
          textAlign: 'center',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        Lihat Semua Insight &gt;&gt;
      </button>
    </div>
  );
}
