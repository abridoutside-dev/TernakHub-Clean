// ─── useDrugStoreDashboardData — ADMIN-SYNC-006 FINAL ─────────────────────────
//
// Shared data hook untuk Drug Store Dashboard & Operational.
// Mengambil data LIVE dari Supabase menggunakan repository yang sudah ada.
//
// Tabel LIVE:
//   - workspaces             → workspace name/meta
//   - stok_obat              → produk & stok obat workspace
//   - stok_obat_masuk        → transaksi masuk (penerimaan stok)
//   - stok_obat_keluar       → transaksi keluar (pengeluaran/dispensing)
//   - drug_catalog           → master obat platform (count)
//   - activity_log           → aktivitas workspace
//   - drug_store_suppliers   → PBF/distributor per workspace
//   - drug_store_orders      → order pembelian & penjualan
//   - drug_store_sales       → catatan penjualan

import { useState, useEffect, useCallback } from 'react';
import { getWorkspaceByUuid } from '../services/workspaceService';
import {
  repoGetStokObatByWorkspace,
  repoGetStokMasukByWorkspace,
  repoGetStokKeluarByWorkspace,
} from '../repositories/stokObatRepository';
import { repoGetDrugCatalogCount } from '../repositories/drugCatalogRepository';
import { repoGetActivityLogByWorkspace } from '../repositories/activityLogRepository';
import {
  repoGetDrugStoreSuppliersByWorkspace,
  repoGetDrugStoreRecentOrders,
  repoGetDrugStoreTodayPenjualanAggregate,
  repoGetDrugStoreYesterdayPenjualanTotal,
  repoGetDrugStoreSalesByWorkspace,
} from '../repositories/drugStoreRepository';
import type { WorkspaceRecord } from '../types/workspace';
import type { StokObatDbRow, StokObatMasukDbRow, StokObatKeluarDbRow } from '../types/stokObat';
import type { ActivityLogDbRow } from '../types/activityLog';
import type {
  DrugStoreSupplierDbRow,
  DrugStoreOrderDbRow,
  DrugStoreSalesDbRow,
  DrugStorePenjualanSummary,
} from '../types/drugStore';

// ─── Output shapes ────────────────────────────────────────────────────────────

export interface DrugStoreStokSummary {
  /** Total item stok_obat di workspace */
  totalItems: number;
  /** Item aktif (status = 'Aktif') */
  activeItems: number;
  /** Item stok rendah: quantity <= min_stock atau status Habis */
  lowStockItems: number;
  /** Item hampir kadaluarsa: expiry_date ≤ 30 hari ke depan */
  nearExpiryItems: number;
  /** Item sudah kadaluarsa */
  expiredItems: number;
}

export interface DrugStoreDashboardData {
  /** Workspace info dari tabel workspaces */
  workspace: WorkspaceRecord | null;
  /** Semua item stok dari tabel stok_obat */
  stokItems: StokObatDbRow[];
  /** Transaksi masuk dari stok_obat_masuk */
  stokMasuk: StokObatMasukDbRow[];
  /** Transaksi keluar dari stok_obat_keluar */
  stokKeluar: StokObatKeluarDbRow[];
  /** Ringkasan stok */
  stokSummary: DrugStoreStokSummary;
  /** Total item drug_catalog (Master Obat platform) */
  masterObatCount: number;
  /** Log aktivitas workspace */
  activities: ActivityLogDbRow[];
  /** Daftar supplier dari drug_store_suppliers */
  suppliers: DrugStoreSupplierDbRow[];
  /** Order terbaru dari drug_store_orders */
  recentOrders: DrugStoreOrderDbRow[];
  /** Aggregate penjualan hari ini */
  todayPenjualan: DrugStorePenjualanSummary;
  /** Catatan penjualan dari drug_store_sales */
  sales: DrugStoreSalesDbRow[];
}

export interface UseDrugStoreDashboardDataResult {
  data: DrugStoreDashboardData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getExpiryStatusFromDate(expiryDate: string | null): 'Aman' | 'Mendekati' | 'Kadaluarsa' | 'Tidak Ada' {
  if (!expiryDate) return 'Tidak Ada';
  const today  = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)   return 'Kadaluarsa';
  if (diffDays <= 30) return 'Mendekati';
  return 'Aman';
}

export function getLowStokObatItems(items: StokObatDbRow[]): StokObatDbRow[] {
  return items.filter((item) => {
    if (item.status === 'Habis' || item.status === 'Kadaluarsa') return true;
    if (item.min_stock !== null && item.quantity <= item.min_stock) return true;
    return false;
  });
}

export function getNearExpiryStokItems(items: StokObatDbRow[]): StokObatDbRow[] {
  return items.filter((item) => {
    const status = getExpiryStatusFromDate(item.expiry_date);
    return status === 'Mendekati' || status === 'Kadaluarsa';
  });
}

function buildStokSummary(items: StokObatDbRow[]): DrugStoreStokSummary {
  const today    = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  let lowStock   = 0;
  let nearExpiry = 0;
  let expired    = 0;
  let active     = 0;

  for (const item of items) {
    if (item.status === 'Aktif') active++;
    if (item.status === 'Habis' || item.status === 'Kadaluarsa') {
      lowStock++;
    } else if (item.min_stock !== null && item.quantity <= item.min_stock) {
      lowStock++;
    }
    if (item.expiry_date) {
      const expiry   = new Date(item.expiry_date);
      const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0)        expired++;
      else if (diffDays <= 30) nearExpiry++;
    }
  }

  return {
    totalItems:      items.length,
    activeItems:     active,
    lowStockItems:   lowStock,
    nearExpiryItems: nearExpiry,
    expiredItems:    expired,
  };
}

function buildPenjualanSummary(
  todayAgg: { totalAmount: number; orderCount: number; completedCount: number; processingCount: number },
  yesterdayTotal: number,
): DrugStorePenjualanSummary {
  let growthPercent: number | null = null;
  if (yesterdayTotal > 0) {
    growthPercent = Math.round(((todayAgg.totalAmount - yesterdayTotal) / yesterdayTotal) * 100);
  } else if (todayAgg.totalAmount > 0) {
    growthPercent = 100;
  }
  return {
    todayRevenue:    todayAgg.totalAmount,
    todayOrderCount: todayAgg.orderCount,
    completedCount:  todayAgg.completedCount,
    processingCount: todayAgg.processingCount,
    growthPercent,
  };
}

// ─── Empty defaults ───────────────────────────────────────────────────────────

const EMPTY_SUMMARY: DrugStoreStokSummary = {
  totalItems: 0, activeItems: 0, lowStockItems: 0, nearExpiryItems: 0, expiredItems: 0,
};

const EMPTY_PENJUALAN: DrugStorePenjualanSummary = {
  todayRevenue: 0, todayOrderCount: 0, completedCount: 0, processingCount: 0, growthPercent: null,
};

const EMPTY_DATA: DrugStoreDashboardData = {
  workspace:       null,
  stokItems:       [],
  stokMasuk:       [],
  stokKeluar:      [],
  stokSummary:     EMPTY_SUMMARY,
  masterObatCount: 0,
  activities:      [],
  suppliers:       [],
  recentOrders:    [],
  todayPenjualan:  EMPTY_PENJUALAN,
  sales:           [],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDrugStoreDashboardData(
  workspaceId: string,
): UseDrugStoreDashboardDataResult {
  const [data,    setData]    = useState<DrugStoreDashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async (aborted: { current: boolean }) => {
    if (!workspaceId) {
      setData(EMPTY_DATA);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        workspace,
        stokItems,
        stokMasuk,
        stokKeluar,
        masterObatCount,
        activities,
        suppliers,
        recentOrders,
        todayAgg,
        yesterdayTotal,
        sales,
      ] = await Promise.all([
        getWorkspaceByUuid(workspaceId).catch(() => null),
        repoGetStokObatByWorkspace(workspaceId).catch(() => []),
        repoGetStokMasukByWorkspace(workspaceId, 50).catch(() => []),
        repoGetStokKeluarByWorkspace(workspaceId, 50).catch(() => []),
        repoGetDrugCatalogCount().catch(() => 0),
        repoGetActivityLogByWorkspace(workspaceId, 20).catch(() => []),
        repoGetDrugStoreSuppliersByWorkspace(workspaceId).catch(() => []),
        repoGetDrugStoreRecentOrders(workspaceId, 5).catch(() => []),
        repoGetDrugStoreTodayPenjualanAggregate(workspaceId).catch(() => ({
          totalAmount: 0, orderCount: 0, completedCount: 0, processingCount: 0,
        })),
        repoGetDrugStoreYesterdayPenjualanTotal(workspaceId).catch(() => 0),
        repoGetDrugStoreSalesByWorkspace(workspaceId, 50).catch(() => []),
      ]);

      if (aborted.current) return;

      setData({
        workspace,
        stokItems,
        stokMasuk,
        stokKeluar,
        stokSummary:    buildStokSummary(stokItems),
        masterObatCount,
        activities,
        suppliers,
        recentOrders,
        todayPenjualan: buildPenjualanSummary(todayAgg, yesterdayTotal),
        sales,
      });
    } catch (err) {
      if (!aborted.current) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat data Drug Store.';
        console.warn('[useDrugStoreDashboardData] fetch error:', msg);
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

// ─── Utility formatters ───────────────────────────────────────────────────────

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(value);
}

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

export function formatExpiryDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  const bulanNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${d} ${bulanNames[parseInt(m, 10) - 1]} ${y}`;
}

export function formatOrderDate(dateStr: string): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  const bulanNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${d} ${bulanNames[parseInt(m, 10) - 1]} ${y}`;
}
