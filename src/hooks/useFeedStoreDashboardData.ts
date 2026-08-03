// ─── useFeedStoreDashboardData — ADMIN-SYNC-005 ───────────────────────────────
//
// Shared data hook untuk Feed Store Dashboard & Operational.
// Mengambil data LIVE dari Supabase menggunakan repository yang sudah ada.
//
// Tabel yang digunakan:
//   - workspaces               → workspace name/meta
//   - stok_inventaris          → produk & stok
//   - stok_inventaris_transactions → gerakan stok (masuk/keluar/penyesuaian)
//   - activity_log             → aktivitas workspace
//
// Tabel yang belum ada (BLOCKED):
//   - feed_store_sales         → ringkasan penjualan, pesanan terbaru
//   - feed_store_purchases     → pembelian dari supplier
//   - feed_store_suppliers     → daftar supplier
//   - feed_store_customers     → daftar pelanggan

import { useState, useEffect, useCallback } from 'react';
import { repoGetWorkspaceByUuid } from '../repositories/workspaceRepository';
import {
  repoGetStokInventarisByWorkspace,
  repoGetTransactionsByWorkspace,
} from '../repositories/stokInventarisRepository';
import { repoGetActivityLogByWorkspace } from '../repositories/activityLogRepository';
import type { WorkspaceRecord } from '../types/workspace';
import type { StokInventarisDbRow, StokTransactionDbRow } from '../types/stokInventaris';
import type { ActivityLogDbRow } from '../types/activityLog';

// ─── Output shape ─────────────────────────────────────────────────────────────

export interface FeedStoreDashboardData {
  /** Workspace info dari tabel workspaces */
  workspace: WorkspaceRecord | null;
  /** Semua item stok dari tabel stok_inventaris */
  stokItems: StokInventarisDbRow[];
  /** Semua transaksi stok dari tabel stok_inventaris_transactions */
  transactions: StokTransactionDbRow[];
  /** Log aktivitas workspace dari tabel activity_log */
  activities: ActivityLogDbRow[];
}

export interface UseFeedStoreDashboardDataResult {
  data: FeedStoreDashboardData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const EMPTY_DATA: FeedStoreDashboardData = {
  workspace:    null,
  stokItems:    [],
  transactions: [],
  activities:   [],
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
      // Tampilkan state kosong tanpa error.
      setData(EMPTY_DATA);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [workspace, stokItems, transactions, activities] = await Promise.all([
        repoGetWorkspaceByUuid(workspaceId).catch(() => null),
        repoGetStokInventarisByWorkspace(workspaceId).catch(() => []),
        repoGetTransactionsByWorkspace(workspaceId).catch(() => []),
        repoGetActivityLogByWorkspace(workspaceId, 20).catch(() => []),
      ]);

      if (aborted.current) return;

      setData({ workspace, stokItems, transactions, activities });
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
