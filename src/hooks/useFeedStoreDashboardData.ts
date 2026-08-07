// ─── useFeedStoreDashboardData — ADMIN-FOUNDATION-003 ─────────────────────────
//
// Shared data hook untuk Feed Store Dashboard & Operational.
// Mengambil data LIVE dari Supabase menggunakan repository yang sudah ada.
//
// Tabel yang digunakan:
//   - workspaces                    → workspace name/meta
//   - stok_inventaris               → produk & stok
//   - stok_inventaris_transactions  → gerakan stok (masuk/keluar/penyesuaian)
//   - activity_log                  → aktivitas workspace
//   - feed_store_suppliers          → daftar pemasok
//   - feed_store_customers          → daftar pelanggan
//   - feed_store_orders             → pesanan (penjualan & pembelian)
//   - feed_store_sales              → catatan penjualan

import { useState, useEffect, useCallback } from 'react';
import { getWorkspaceByUuid } from '../services/workspaceService';
import {
  repoGetStokInventarisByWorkspace,
  repoGetTransactionsByWorkspace,
} from '../repositories/stokInventarisRepository';
import { repoGetActivityLogByWorkspace } from '../repositories/activityLogRepository';
import {
  repoGetSuppliersByWorkspace,
  repoGetCustomersByWorkspace,
  repoGetRecentOrders,
  repoGetTodayPenjualanAggregate,
  repoGetYesterdayPenjualanTotal,
  repoGetSalesAggregate,
  repoGetSalesByWorkspace,
} from '../repositories/feedStoreRepository';
import type { WorkspaceRecord } from '../types/workspace';
import type { StokInventarisDbRow, StokTransactionDbRow } from '../types/stokInventaris';
import type { ActivityLogDbRow } from '../types/activityLog';
import type {
  FeedStoreSupplierDbRow,
  FeedStoreCustomerDbRow,
  FeedStoreOrderDbRow,
  FeedStoreSalesDbRow,
} from '../types/feedStore';

// ─── Output shape ─────────────────────────────────────────────────────────────

export interface FeedStoreSalesSummaryData {
  todayRevenue: number;
  todayOrderCount: number;
  completedCount: number;
  processingCount: number;
  /** null jika tidak ada data kemarin */
  growthPercent: number | null;
  /** Penjualan bulan ini dari feed_store_sales */
  monthRevenue: number;
  monthSalesCount: number;
}

export interface FeedStoreDashboardData {
  /** Workspace info dari tabel workspaces */
  workspace: WorkspaceRecord | null;
  /** Semua item stok dari tabel stok_inventaris */
  stokItems: StokInventarisDbRow[];
  /** Semua transaksi stok dari tabel stok_inventaris_transactions */
  transactions: StokTransactionDbRow[];
  /** Log aktivitas workspace dari tabel activity_log */
  activities: ActivityLogDbRow[];
  /** Daftar supplier dari feed_store_suppliers */
  suppliers: FeedStoreSupplierDbRow[];
  /** Daftar pelanggan dari feed_store_customers */
  customers: FeedStoreCustomerDbRow[];
  /** Pesanan terbaru dari feed_store_orders */
  recentOrders: FeedStoreOrderDbRow[];
  /** Catatan penjualan terbaru dari feed_store_sales */
  recentSales: FeedStoreSalesDbRow[];
  /** Ringkasan penjualan hari ini */
  salesSummary: FeedStoreSalesSummaryData;
}

export interface UseFeedStoreDashboardDataResult {
  data: FeedStoreDashboardData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const EMPTY_SALES_SUMMARY: FeedStoreSalesSummaryData = {
  todayRevenue: 0,
  todayOrderCount: 0,
  completedCount: 0,
  processingCount: 0,
  growthPercent: null,
  monthRevenue: 0,
  monthSalesCount: 0,
};

const EMPTY_DATA: FeedStoreDashboardData = {
  workspace:    null,
  stokItems:    [],
  transactions: [],
  activities:   [],
  suppliers:    [],
  customers:    [],
  recentOrders: [],
  recentSales:  [],
  salesSummary: EMPTY_SALES_SUMMARY,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFeedStoreDashboardData(
  workspaceId: string,
): UseFeedStoreDashboardDataResult {
  const [data,    setData]    = useState<FeedStoreDashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async (aborted: { current: boolean }) => {
    if (!workspaceId || workspaceId === 'w7') {
      // workspaceId 'w7' adalah seed ID — tidak ada di Supabase.
      setData(EMPTY_DATA);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Hitung awal bulan ini untuk aggregate penjualan bulan ini
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const [
        workspace,
        stokItems,
        transactions,
        activities,
        suppliers,
        customers,
        recentOrders,
        recentSales,
        todayAggregate,
        yesterdayTotal,
        monthSales,
      ] = await Promise.all([
        getWorkspaceByUuid(workspaceId).catch(() => null),
        repoGetStokInventarisByWorkspace(workspaceId).catch(() => []),
        repoGetTransactionsByWorkspace(workspaceId).catch(() => []),
        repoGetActivityLogByWorkspace(workspaceId, 20).catch(() => []),
        repoGetSuppliersByWorkspace(workspaceId).catch(() => []),
        repoGetCustomersByWorkspace(workspaceId).catch(() => []),
        repoGetRecentOrders(workspaceId, 8).catch(() => []),
        repoGetSalesByWorkspace(workspaceId, 20).catch(() => []),
        repoGetTodayPenjualanAggregate(workspaceId).catch(() => ({ totalAmount: 0, orderCount: 0, completedCount: 0, processingCount: 0 })),
        repoGetYesterdayPenjualanTotal(workspaceId).catch(() => 0),
        repoGetSalesAggregate(workspaceId, { since: monthStart }).catch(() => ({ totalAmount: 0, count: 0 })),
      ]);

      if (aborted.current) return;

      // Hitung growth vs kemarin
      let growthPercent: number | null = null;
      if (yesterdayTotal > 0) {
        growthPercent = ((todayAggregate.totalAmount - yesterdayTotal) / yesterdayTotal) * 100;
      } else if (todayAggregate.totalAmount > 0) {
        growthPercent = 100;
      }

      const salesSummary: FeedStoreSalesSummaryData = {
        todayRevenue:    todayAggregate.totalAmount,
        todayOrderCount: todayAggregate.orderCount,
        completedCount:  todayAggregate.completedCount,
        processingCount: todayAggregate.processingCount,
        growthPercent,
        monthRevenue:    monthSales.totalAmount,
        monthSalesCount: monthSales.count,
      };

      setData({
        workspace,
        stokItems,
        transactions,
        activities,
        suppliers,
        customers,
        recentOrders,
        recentSales,
        salesSummary,
      });
    } catch (err) {
      if (!aborted.current) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat data Feed Store.';
        console.warn('[useFeedStoreDashboardData] fetch error:', msg);
        setError(msg);
      }
    } finally {
      if (!aborted.current) setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    const aborted = { current: false };
    void fetchData(aborted);
    return () => { aborted.current = true; };
  }, [fetchData]);

  const refresh = useCallback(() => {
    const aborted = { current: false };
    void fetchData(aborted);
  }, [fetchData]);

  return { data, loading, error, refresh };
}

// ─── Computed selectors ───────────────────────────────────────────────────────

/** Item stok yang perlu perhatian: habis atau di bawah min_stock */
export function getLowStockItems(items: StokInventarisDbRow[]): StokInventarisDbRow[] {
  return items.filter((item) => {
    if (item.status === 'Habis' || item.status === 'Kadaluarsa') return true;
    if (item.min_stock !== null && item.quantity <= item.min_stock) return true;
    return false;
  });
}

/** Transaksi masuk (stock-in) */
export function getTransaksiMasuk(transactions: StokTransactionDbRow[]): StokTransactionDbRow[] {
  return transactions.filter((t) => t.transaction_type === 'Masuk');
}

/** Transaksi keluar (stock-out) */
export function getTransaksiKeluar(transactions: StokTransactionDbRow[]): StokTransactionDbRow[] {
  return transactions.filter((t) => t.transaction_type === 'Keluar');
}

/** Format waktu relatif dari ISO string */
export function formatRelativeTime(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '-';
  const now    = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM  = Math.floor(diffMs / 60_000);
  const diffH  = Math.floor(diffMs / 3_600_000);
  const diffD  = Math.floor(diffMs / 86_400_000);
  if (diffM  < 1)  return 'Baru saja';
  if (diffM  < 60) return `${diffM} menit lalu`;
  if (diffH  < 24) return `${diffH} jam lalu`;
  if (diffD  < 7)  return `${diffD} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

/** Format angka dengan separator ribuan */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

/** Format nilai IDR */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}
