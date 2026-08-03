// ─── Feed Store DB Types — ADMIN-FOUNDATION-002 ───────────────────────────────
//
// TypeScript types per le 5 tabelle Feed Store in Supabase:
//   feed_store_suppliers    → fornitori del workspace
//   feed_store_customers    → clienti del workspace
//   feed_store_orders       → ordini (acquisto e vendita)
//   feed_store_order_items  → righe d'ordine
//   feed_store_sales        → registrazioni di vendita
//
// Tutte le tabelle hanno workspace_id come FK → workspaces(id).
// RLS: accesso riservato agli utenti autenticati membri del workspace.

// ─── feed_store_suppliers ─────────────────────────────────────────────────────

export interface FeedStoreSupplierDbRow {
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

export interface FeedStoreSupplierCreateInput {
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

// ─── feed_store_customers ─────────────────────────────────────────────────────

export interface FeedStoreCustomerDbRow {
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
  status: string; // 'Aktif' | 'Nonaktif'
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedStoreCustomerCreateInput {
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

// ─── feed_store_orders ────────────────────────────────────────────────────────

export type FeedStoreOrderType   = 'Pembelian' | 'Penjualan';
export type FeedStoreOrderStatus = 'Baru' | 'Diproses' | 'Selesai' | 'Dibatalkan';

export interface FeedStoreOrderDbRow {
  id: string;
  workspace_id: string;
  order_number: string | null;
  order_type: FeedStoreOrderType;
  supplier_id: string | null;
  customer_id: string | null;
  status: FeedStoreOrderStatus;
  /** Bigint stored as number in JS (safe up to ~9007199 trillion IDR) */
  total_amount: number;
  order_date: string; // date YYYY-MM-DD
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedStoreOrderCreateInput {
  workspace_id: string;
  order_type: FeedStoreOrderType;
  supplier_id?: string | null;
  customer_id?: string | null;
  status?: FeedStoreOrderStatus;
  total_amount?: number;
  order_date: string;
  order_number?: string | null;
  notes?: string | null;
  created_by?: string | null;
}

// ─── feed_store_order_items ───────────────────────────────────────────────────

export interface FeedStoreOrderItemDbRow {
  id: string;
  order_id: string;
  workspace_id: string;
  stok_id: string | null; // FK → stok_inventaris(id)
  item_name: string;
  quantity: number;
  unit: string | null;
  unit_price: number; // bigint
  subtotal: number;   // bigint
  notes: string | null;
  created_at: string;
}

export interface FeedStoreOrderItemCreateInput {
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

// ─── feed_store_sales ─────────────────────────────────────────────────────────

export interface FeedStoreSalesDbRow {
  id: string;
  workspace_id: string;
  order_id: string | null;     // FK → feed_store_orders(id)
  customer_id: string | null;  // FK → feed_store_customers(id)
  sale_date: string; // date YYYY-MM-DD
  total_amount: number; // bigint
  payment_method: string | null;
  status: string; // 'Selesai' | 'Pending' | 'Dibatalkan'
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedStoreSalesCreateInput {
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

// ─── Aggregates (computed in hook) ────────────────────────────────────────────

export interface FeedStoreSalesSummary {
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
