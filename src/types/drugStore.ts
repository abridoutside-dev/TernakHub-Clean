// ─── Drug Store DB Types — ADMIN-SYNC-006 FINAL ───────────────────────────────
//
// TypeScript types untuk tabel Drug Store di Supabase:
//   drug_store_suppliers   → PBF/distributor per workspace
//   drug_store_customers   → customer domain untuk Toko Obat
//   drug_store_orders      → order pembelian & penjualan
//   drug_store_order_items → item-level detail untuk orders
//   drug_store_sales       → catatan penjualan toko obat
//   drug_store_sales_items → item-level detail untuk sales
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

// ─── drug_store_customers ─────────────────────────────────────────────────────

export interface DrugStoreCustomerDbRow {
  id: string;
  workspace_id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  province: string | null;
  city: string | null;
  customer_type: string | null; // 'Individu' | 'Perusahaan' | 'Koperasi'
  status: string;               // 'Aktif' | 'Nonaktif'
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DrugStoreCustomerCreateInput {
  workspace_id: string;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  province?: string | null;
  city?: string | null;
  customer_type?: string | null;
  status?: string;
  notes?: string | null;
}

export interface DrugStoreCustomerUpdateInput {
  name?: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  province?: string | null;
  city?: string | null;
  customer_type?: string | null;
  status?: string;
  notes?: string | null;
}

// ─── drug_store_orders ────────────────────────────────────────────────────────

export type DrugStoreOrderType   = 'Pembelian' | 'Penjualan' | 'Retur' | 'Lainnya';
export type DrugStoreOrderStatus = 'Baru' | 'Pending' | 'Diproses' | 'Selesai' | 'Dibatalkan';

export interface DrugStoreOrderDbRow {
  id: string;
  workspace_id: string;
  order_number: string | null;
  order_type: DrugStoreOrderType;
  supplier_id: string | null;      // FK → drug_store_suppliers(id)
  customer_id: string | null;      // FK → drug_store_customers(id)
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
  customer_id?: string | null;
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
  customer_id?: string | null;
}

// ─── drug_store_order_items ────────────────────────────────────────────────────

export interface DrugStoreOrderItemDbRow {
  id: string;
  order_id: string;
  workspace_id: string;
  stok_id: string | null;        // FK → stok_obat(id)
  item_name: string;
  quantity: number;              // bigint
  unit: string | null;
  unit_price: number;            // bigint
  subtotal: number;              // bigint
  notes: string | null;
  created_at: string;
}

export interface DrugStoreOrderItemCreateInput {
  order_id: string;
  workspace_id: string;
  stok_id?: string | null;
  item_name: string;
  quantity: number;
  unit?: string | null;
  unit_price?: number;
  subtotal?: number;
  notes?: string | null;
}

// ─── drug_store_sales ─────────────────────────────────────────────────────────

export interface DrugStoreSalesDbRow {
  id: string;
  workspace_id: string;
  order_id: string | null;        // FK → drug_store_orders(id)
  customer_id: string | null;     // FK → drug_store_customers(id)
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
  customer_id?: string | null;
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
  customer_id?: string | null;
  order_id?: string | null;
}

// ─── drug_store_sales_items ────────────────────────────────────────────────────

export interface DrugStoreSalesItemDbRow {
  id: string;
  sale_id: string;
  workspace_id: string;
  stok_id: string | null;
  item_name: string;
  quantity: number;              // bigint
  unit: string | null;
  unit_price: number;            // bigint
  subtotal: number;              // bigint
  notes: string | null;
  created_at: string;
}

export interface DrugStoreSalesItemCreateInput {
  sale_id?: string;
  workspace_id?: string;
  stok_id?: string | null;
  item_name: string;
  quantity: number;
  unit?: string | null;
  unit_price?: number;
  subtotal?: number;
  notes?: string | null;
}

// ─── Aggregates (computed dalam hook) ────────────────────────────────────────────

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
