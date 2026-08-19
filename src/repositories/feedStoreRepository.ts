// ─── Feed Store Repository — ADMIN-FOUNDATION-002 ────────────────────────────
//
// Supabase adapter untuk 5 tabel Feed Store:
//   feed_store_suppliers    → daftar pemasok workspace
//   feed_store_customers    → daftar pelanggan workspace
//   feed_store_orders       → order pembelian & penjualan
//   feed_store_order_items  → item per order
//   feed_store_sales        → catatan penjualan
//   feed_store_sales_items  → item per catatan penjualan
//
// Rules:
//   - Semua fungsi async dan mengembalikan typed results.
//   - requireAuthSession() menjaga setiap fungsi read/write.
//   - Tidak ada business logic di sini — hanya query Supabase.
//   - RLS di Supabase mengatur akses antar workspace.
//
// Tables: feed_store_suppliers, feed_store_customers, feed_store_orders,
//         feed_store_order_items, feed_store_sales, feed_store_sales_items

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';
import type {
  FeedStoreSupplierDbRow,
  FeedStoreSupplierCreateInput,
  FeedStoreCustomerDbRow,
  FeedStoreCustomerCreateInput,
  FeedStoreOrderDbRow,
  FeedStoreOrderCreateInput,
  FeedStoreOrderItemDbRow,
  FeedStoreOrderItemCreateInput,
  FeedStoreSalesDbRow,
  FeedStoreSalesCreateInput,
  FeedStoreSalesItemDbRow,
  FeedStoreSalesItemCreateInput,
} from '../types/feedStore';

// ─── Error ────────────────────────────────────────────────────────────────────

export class FeedStoreRepoError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'FeedStoreRepoError';
  }
}

function guard(error: { message: string; code?: string } | null): void {
  if (error) throw new FeedStoreRepoError(error.message, error.code);
}

import type {
  FeedStoreSupplierUpdateInput,
  FeedStoreCustomerUpdateInput,
  FeedStoreOrderUpdateInput,
  FeedStoreSalesUpdateInput,
} from '../types/feedStore';

// ─── feed_store_suppliers ─────────────────────────────────────────────────────

/**
 * Semua supplier workspace, diurutkan by name.
 */
export async function repoGetSuppliersByWorkspace(
  workspaceId: string,
): Promise<FeedStoreSupplierDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_suppliers')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true });
  guard(error);
  return (data ?? []) as FeedStoreSupplierDbRow[];
}

/**
 * Count supplier aktif di workspace.
 */
export async function repoGetActiveSupplierCount(
  workspaceId: string,
): Promise<number> {
  await requireAuthSession();
  const { count, error } = await supabase
    .from('feed_store_suppliers')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'Aktif');
  guard(error);
  return count ?? 0;
}

/**
 * Cari supplier by ID.
 */
export async function repoGetSupplierById(
  id: string,
): Promise<FeedStoreSupplierDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_suppliers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as FeedStoreSupplierDbRow | null;
}

/**
 * Tambah supplier baru.
 */
export async function repoInsertSupplier(
  input: FeedStoreSupplierCreateInput,
): Promise<FeedStoreSupplierDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_suppliers')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as FeedStoreSupplierDbRow;
}

/**
 * Update supplier.
 */
export async function repoUpdateSupplier(
  id: string,
  input: FeedStoreSupplierUpdateInput,
): Promise<FeedStoreSupplierDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_suppliers')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as FeedStoreSupplierDbRow;
}

/**
 * Hapus supplier.
 */
export async function repoDeleteSupplier(id: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('feed_store_suppliers')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── feed_store_customers ─────────────────────────────────────────────────────

/**
 * Semua pelanggan workspace, diurutkan by name.
 */
export async function repoGetCustomersByWorkspace(
  workspaceId: string,
): Promise<FeedStoreCustomerDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_customers')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true });
  guard(error);
  return (data ?? []) as FeedStoreCustomerDbRow[];
}

/**
 * Count pelanggan aktif di workspace.
 */
export async function repoGetActiveCustomerCount(
  workspaceId: string,
): Promise<number> {
  await requireAuthSession();
  const { count, error } = await supabase
    .from('feed_store_customers')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'Aktif');
  guard(error);
  return count ?? 0;
}

/**
 * Cari pelanggan by ID.
 */
export async function repoGetCustomerById(
  id: string,
): Promise<FeedStoreCustomerDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as FeedStoreCustomerDbRow | null;
}

/**
 * Tambah pelanggan baru.
 */
export async function repoInsertCustomer(
  input: FeedStoreCustomerCreateInput,
): Promise<FeedStoreCustomerDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_customers')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as FeedStoreCustomerDbRow;
}

/**
 * Update pelanggan.
 */
export async function repoUpdateCustomer(
  id: string,
  input: FeedStoreCustomerUpdateInput,
): Promise<FeedStoreCustomerDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_customers')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as FeedStoreCustomerDbRow;
}

/**
 * Hapus pelanggan.
 */
export async function repoDeleteCustomer(id: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('feed_store_customers')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── feed_store_orders ────────────────────────────────────────────────────────

/**
 * Semua order workspace, terbaru dulu. Bisa difilter by type.
 */
export async function repoGetOrdersByWorkspace(
  workspaceId: string,
  opts?: {
    orderType?: 'Pembelian' | 'Penjualan';
    status?: string;
    limit?: number;
    since?: string; // ISO date string YYYY-MM-DD
  },
): Promise<FeedStoreOrderDbRow[]> {
  await requireAuthSession();
  let q = supabase
    .from('feed_store_orders')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (opts?.orderType) q = q.eq('order_type', opts.orderType);
  if (opts?.status)    q = q.eq('status', opts.status);
  if (opts?.since)     q = q.gte('order_date', opts.since);
  if (opts?.limit)     q = q.limit(opts.limit);

  const { data, error } = await q;
  guard(error);
  return (data ?? []) as FeedStoreOrderDbRow[];
}

/**
 * Order terbaru workspace — untuk widget Pesanan Terbaru.
 * Mengembalikan order + nama customer/supplier dengan join manual.
 */
export async function repoGetRecentOrders(
  workspaceId: string,
  limit = 5,
): Promise<FeedStoreOrderDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_orders')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);
  guard(error);
  return (data ?? []) as FeedStoreOrderDbRow[];
}

/**
 * Aggregate penjualan hari ini (order_type = 'Penjualan', order_date = today).
 */
export async function repoGetTodayPenjualanAggregate(
  workspaceId: string,
): Promise<{ totalAmount: number; orderCount: number; completedCount: number; processingCount: number }> {
  await requireAuthSession();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('feed_store_orders')
    .select('total_amount, status')
    .eq('workspace_id', workspaceId)
    .eq('order_type', 'Penjualan')
    .eq('order_date', today);

  guard(error);
  const rows = (data ?? []) as { total_amount: number; status: string }[];
  return {
    totalAmount:     rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0),
    orderCount:      rows.length,
    completedCount:  rows.filter((r) => r.status === 'Selesai').length,
    processingCount: rows.filter((r) => r.status !== 'Selesai' && r.status !== 'Dibatalkan').length,
  };
}

/**
 * Aggregate penjualan kemarin — untuk menghitung growth %.
 */
export async function repoGetYesterdayPenjualanTotal(
  workspaceId: string,
): Promise<number> {
  await requireAuthSession();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('feed_store_orders')
    .select('total_amount')
    .eq('workspace_id', workspaceId)
    .eq('order_type', 'Penjualan')
    .eq('order_date', dateStr);

  guard(error);
  const rows = (data ?? []) as { total_amount: number }[];
  return rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
}

/**
 * Order by ID.
 */
export async function repoGetOrderById(id: string): Promise<FeedStoreOrderDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as FeedStoreOrderDbRow | null;
}

/**
 * Insert order baru.
 */
export async function repoInsertOrder(
  input: FeedStoreOrderCreateInput,
): Promise<FeedStoreOrderDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_orders')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as FeedStoreOrderDbRow;
}

/**
 * Update order.
 */
export async function repoUpdateOrder(
  id: string,
  input: FeedStoreOrderUpdateInput,
): Promise<FeedStoreOrderDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_orders')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as FeedStoreOrderDbRow;
}

/**
 * Hapus order.
 */
export async function repoDeleteOrder(id: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('feed_store_orders')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── feed_store_order_items ───────────────────────────────────────────────────

/**
 * Semua item untuk sebuah order.
 */
export async function repoGetOrderItems(
  orderId: string,
): Promise<FeedStoreOrderItemDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  guard(error);
  return (data ?? []) as FeedStoreOrderItemDbRow[];
}

/**
 * Insert item ke order.
 */
export async function repoInsertOrderItem(
  input: FeedStoreOrderItemCreateInput,
): Promise<FeedStoreOrderItemDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_order_items')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as FeedStoreOrderItemDbRow;
}

/**
 * Hapus semua item untuk sebuah order (digunakan saat edit order).
 */
export async function repoDeleteOrderItemsByOrderId(orderId: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('feed_store_order_items')
    .delete()
    .eq('order_id', orderId);
  guard(error);
}

// ─── feed_store_sales ─────────────────────────────────────────────────────────

/**
 * Catatan penjualan workspace, terbaru dulu.
 */
export async function repoGetSalesByWorkspace(
  workspaceId: string,
  limit = 50,
): Promise<FeedStoreSalesDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_sales')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('sale_date', { ascending: false })
    .limit(limit);
  guard(error);
  return (data ?? []) as FeedStoreSalesDbRow[];
}

/**
 * Aggregate total penjualan dari tabel feed_store_sales (alternatif dari orders).
 */
export async function repoGetSalesAggregate(
  workspaceId: string,
  opts?: { since?: string; until?: string },
): Promise<{ totalAmount: number; count: number }> {
  await requireAuthSession();
  let q = supabase
    .from('feed_store_sales')
    .select('total_amount')
    .eq('workspace_id', workspaceId);

  if (opts?.since) q = q.gte('sale_date', opts.since);
  if (opts?.until) q = q.lte('sale_date', opts.until);

  const { data, error } = await q;
  guard(error);
  const rows = (data ?? []) as { total_amount: number }[];
  return {
    totalAmount: rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0),
    count:       rows.length,
  };
}

/**
 * Sale by ID.
 */
export async function repoGetSaleById(id: string): Promise<FeedStoreSalesDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_sales')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as FeedStoreSalesDbRow | null;
}

/**
 * Insert catatan penjualan.
 */
export async function repoInsertSale(
  input: FeedStoreSalesCreateInput,
): Promise<FeedStoreSalesDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_sales')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as FeedStoreSalesDbRow;
}

/**
 * Update catatan penjualan.
 * Memblokir update jika penjualan sudah Selesai untuk menjaga konsistensi inventory.
 */
export async function repoUpdateSale(
  id: string,
  input: FeedStoreSalesUpdateInput,
): Promise<FeedStoreSalesDbRow> {
  await requireAuthSession();
  const existing = await repoGetSaleById(id);
  if (existing?.status === 'Selesai') {
    throw new FeedStoreRepoError('Penjualan yang sudah Selesai tidak dapat diubah.');
  }
  const { data, error } = await supabase
    .from('feed_store_sales')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as FeedStoreSalesDbRow;
}

/**
 * Hapus catatan penjualan.
 * Memblokir hapus jika penjualan sudah Selesai untuk menjaga konsistensi inventory.
 */
export async function repoDeleteSale(id: string): Promise<void> {
  await requireAuthSession();
  const existing = await repoGetSaleById(id);
  if (existing?.status === 'Selesai') {
    throw new FeedStoreRepoError('Penjualan yang sudah Selesai tidak dapat dihapus.');
  }
  const { error } = await supabase
    .from('feed_store_sales')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── feed_store_sales_items ────────────────────────────────────────────────────

/**
 * Semua item untuk sebuah catatan penjualan, terurut by created_at.
 */
export async function repoGetSalesItemsBySaleId(
  saleId: string,
): Promise<FeedStoreSalesItemDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_sales_items')
    .select('*')
    .eq('sale_id', saleId)
    .order('created_at', { ascending: true });
  guard(error);
  return (data ?? []) as FeedStoreSalesItemDbRow[];
}

/**
 * Insert item ke catatan penjualan.
 */
export async function repoInsertSalesItem(
  input: FeedStoreSalesItemCreateInput,
): Promise<FeedStoreSalesItemDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('feed_store_sales_items')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as FeedStoreSalesItemDbRow;
}

/**
 * Hapus semua item untuk sebuah catatan penjualan (digunakan saat edit penjualan).
 */
export async function repoDeleteSalesItemsBySaleId(saleId: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('feed_store_sales_items')
    .delete()
    .eq('sale_id', saleId);
  guard(error);
}
