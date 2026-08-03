// ─── Drug Store DB Types — ADMIN-SYNC-006 FINAL ───────────────────────────────
//
// TypeScript types untuk 3 tabel Drug Store di Supabase:
//   drug_store_suppliers  → PBF/distributor per workspace
//   drug_store_orders     → order pembelian & penjualan
//   drug_store_sales      → catatan penjualan toko obat
//
// Semua tabel memiliki workspace_id sebagai FK → workspaces(id).
// Pola mengikuti feedStore.ts

// ─── drug_store_suppliers ─────────────────────────────────────────────────────

export interface DrugStoreSupplierDbRow {
  id: string;
  workspace_id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  province: string | null;
  city: string | null;
  status: string; // 'Aktif' | 'Nonaktif'
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DrugStoreSupplierCreateInput {
  workspace_id: string;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  province?: string | null;
  city?: string | null;
  status?: string;
  notes?: string | null;
}

export interface DrugStoreSupplierUpdateInput {
  name?: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  province?: string | null;
  city?: string | null;
  status?: string;
  notes?: string | null;
}

// ─── drug_store_orders ────────────────────────────────────────────────────────

export type DrugStoreOrderType   = 'Pembelian' | 'Penjualan';
export type DrugStoreOrderStatus = 'Baru' | 'Diproses' | 'Selesai' | 'Dibatalkan';

export interface DrugStoreOrderDbRow {
  id: string;
  workspace_id: string;
  order_number: string | null;
  order_type: DrugStoreOrderType;
  supplier_id: string | null;      // FK → drug_store_suppliers(id)
  customer_name: string | null;    // Nama pelanggan (tidak ada tabel customers)
  status: DrugStoreOrderStatus;
  /** Bigint stored as number in JS */
  total_amount: number;
  order_date: string;              // date YYYY-MM-DD
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DrugStoreOrderCreateInput {
  workspace_id: string;
  order_type: DrugStoreOrderType;
  supplier_id?: string | null;
  customer_name?: string | null;
  status?: DrugStoreOrderStatus;
  total_amount?: number;
  order_date: string;
  order_number?: string | null;
  notes?: string | null;
  created_by?: string | null;
}

export interface DrugStoreOrderUpdateInput {
  order_number?: string | null;
  status?: DrugStoreOrderStatus;
  total_amount?: number;
  order_date?: string;
  notes?: string | null;
  supplier_id?: string | null;
  customer_name?: string | null;
}

// ─── drug_store_sales ─────────────────────────────────────────────────────────

export interface DrugStoreSalesDbRow {
  id: string;
  workspace_id: string;
  order_id: string | null;        // FK → drug_store_orders(id)
  sale_date: string;              // date YYYY-MM-DD
  total_amount: number;           // bigint
  payment_method: string | null;  // 'Tunai' | 'Transfer' | 'QRIS' | dll
  status: string;                 // 'Selesai' | 'Pending' | 'Dibatalkan'
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DrugStoreSalesCreateInput {
  workspace_id: string;
  order_id?: string | null;
  sale_date: string;
  total_amount: number;
  payment_method?: string | null;
  status?: string;
  notes?: string | null;
  created_by?: string | null;
}

export interface DrugStoreSalesUpdateInput {
  sale_date?: string;
  total_amount?: number;
  payment_method?: string | null;
  status?: string;
  notes?: string | null;
  order_id?: string | null;
}

// ─── Aggregates (computed dalam hook) ────────────────────────────────────────

export interface DrugStorePenjualanSummary {
  /** Total penjualan hari ini (IDR) */
  todayRevenue: number;
  /** Jumlah order penjualan hari ini */
  todayOrderCount: number;
  /** Jumlah order selesai */
  completedCount: number;
  /** Jumlah order masih diproses */
  processingCount: number;
  /** Growth vs kemarin (null = tidak ada data kemarin) */
  growthPercent: number | null;
}
