// ─── Drug Store Repository — ADMIN-SYNC-006 FINAL ────────────────────────────
//
// Supabase adapter untuk 3 tabel Drug Store:
//   drug_store_suppliers  → PBF/distributor workspace
//   drug_store_orders     → order pembelian & penjualan
//   drug_store_sales      → catatan penjualan
//
// Rules:
//   - Semua fungsi async dan mengembalikan typed results.
//   - requireAuthSession() menjaga setiap fungsi read/write.
//   - Tidak ada business logic — hanya query Supabase.
//   - Pola mengikuti feedStoreRepository.ts

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';
import type {
  DrugStoreSupplierDbRow,
  DrugStoreSupplierCreateInput,
  DrugStoreSupplierUpdateInput,
  DrugStoreOrderDbRow,
  DrugStoreOrderCreateInput,
  DrugStoreOrderUpdateInput,
  DrugStoreSalesDbRow,
  DrugStoreSalesCreateInput,
  DrugStoreSalesUpdateInput,
} from '../types/drugStore';

// ─── Error ────────────────────────────────────────────────────────────────────

export class DrugStoreRepoError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'DrugStoreRepoError';
  }
}

function guard(error: { message: string; code?: string } | null): void {
  if (error) throw new DrugStoreRepoError(error.message, error.code);
}

// ─── drug_store_suppliers ─────────────────────────────────────────────────────

/**
 * Semua supplier workspace, diurutkan by name.
 */
export async function repoGetDrugStoreSuppliersByWorkspace(
  workspaceId: string,
): Promise<DrugStoreSupplierDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('drug_store_suppliers')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true });
  guard(error);
  return (data ?? []) as DrugStoreSupplierDbRow[];
}

/**
 * Count supplier aktif di workspace.
 */
export async function repoGetDrugStoreActiveSupplierCount(
  workspaceId: string,
): Promise<number> {
  await requireAuthSession();
  const { count, error } = await supabase
    .from('drug_store_suppliers')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'Aktif');
  guard(error);
  return count ?? 0;
}

/**
 * Supplier by ID.
 */
export async function repoGetDrugStoreSupplierById(
  id: string,
): Promise<DrugStoreSupplierDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('drug_store_suppliers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as DrugStoreSupplierDbRow | null;
}

/**
 * Tambah supplier baru.
 */
export async function repoInsertDrugStoreSupplier(
  input: DrugStoreSupplierCreateInput,
): Promise<DrugStoreSupplierDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('drug_store_suppliers')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as DrugStoreSupplierDbRow;
}

/**
 * Update supplier.
 */
export async function repoUpdateDrugStoreSupplier(
  id: string,
  input: DrugStoreSupplierUpdateInput,
): Promise<DrugStoreSupplierDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('drug_store_suppliers')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as DrugStoreSupplierDbRow;
}

/**
 * Hapus supplier.
 */
export async function repoDeleteDrugStoreSupplier(id: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('drug_store_suppliers')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── drug_store_orders ────────────────────────────────────────────────────────

/**
 * Semua order workspace, terbaru dulu. Bisa difilter by type/status.
 */
export async function repoGetDrugStoreOrdersByWorkspace(
  workspaceId: string,
  opts?: {
    orderType?: 'Pembelian' | 'Penjualan';
    status?: string;
    limit?: number;
    since?: string; // YYYY-MM-DD
  },
): Promise<DrugStoreOrderDbRow[]> {
  await requireAuthSession();
  let q = supabase
    .from('drug_store_orders')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (opts?.orderType) q = q.eq('order_type', opts.orderType);
  if (opts?.status)    q = q.eq('status', opts.status);
  if (opts?.since)     q = q.gte('order_date', opts.since);
  if (opts?.limit)     q = q.limit(opts.limit);

  const { data, error } = await q;
  guard(error);
  return (data ?? []) as DrugStoreOrderDbRow[];
}

/**
 * Order terbaru workspace — untuk widget Pesanan Terbaru.
 */
export async function repoGetDrugStoreRecentOrders(
  workspaceId: string,
  limit = 5,
): Promise<DrugStoreOrderDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('drug_store_orders')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);
  guard(error);
  return (data ?? []) as DrugStoreOrderDbRow[];
}

/**
 * Aggregate penjualan hari ini (order_type = 'Penjualan').
 */
export async function repoGetDrugStoreTodayPenjualanAggregate(
  workspaceId: string,
): Promise<{ totalAmount: number; orderCount: number; completedCount: number; processingCount: number }> {
  await requireAuthSession();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('drug_store_orders')
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
export async function repoGetDrugStoreYesterdayPenjualanTotal(
  workspaceId: string,
): Promise<number> {
  await requireAuthSession();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('drug_store_orders')
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
export async function repoGetDrugStoreOrderById(
  id: string,
): Promise<DrugStoreOrderDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('drug_store_orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as DrugStoreOrderDbRow | null;
}

/**
 * Insert order baru.
 */
export async function repoInsertDrugStoreOrder(
  input: DrugStoreOrderCreateInput,
): Promise<DrugStoreOrderDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('drug_store_orders')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as DrugStoreOrderDbRow;
}

/**
 * Update order.
 */
export async function repoUpdateDrugStoreOrder(
  id: string,
  input: DrugStoreOrderUpdateInput,
): Promise<DrugStoreOrderDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('drug_store_orders')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as DrugStoreOrderDbRow;
}

/**
 * Hapus order.
 */
export async function repoDeleteDrugStoreOrder(id: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('drug_store_orders')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── drug_store_sales ─────────────────────────────────────────────────────────

/**
 * Catatan penjualan workspace, terbaru dulu.
 */
export async function repoGetDrugStoreSalesByWorkspace(
  workspaceId: string,
  limit = 50,
): Promise<DrugStoreSalesDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('drug_store_sales')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('sale_date', { ascending: false })
    .limit(limit);
  guard(error);
  return (data ?? []) as DrugStoreSalesDbRow[];
}

/**
 * Aggregate total penjualan dari tabel drug_store_sales.
 */
export async function repoGetDrugStoreSalesAggregate(
  workspaceId: string,
  opts?: { since?: string; until?: string },
): Promise<{ totalAmount: number; count: number }> {
  await requireAuthSession();
  let q = supabase
    .from('drug_store_sales')
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
export async function repoGetDrugStoreSaleById(
  id: string,
): Promise<DrugStoreSalesDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('drug_store_sales')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as DrugStoreSalesDbRow | null;
}

/**
 * Insert catatan penjualan.
 */
export async function repoInsertDrugStoreSale(
  input: DrugStoreSalesCreateInput,
): Promise<DrugStoreSalesDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('drug_store_sales')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as DrugStoreSalesDbRow;
}

/**
 * Update catatan penjualan.
 */
export async function repoUpdateDrugStoreSale(
  id: string,
  input: DrugStoreSalesUpdateInput,
): Promise<DrugStoreSalesDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('drug_store_sales')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as DrugStoreSalesDbRow;
}

/**
 * Hapus catatan penjualan.
 */
export async function repoDeleteDrugStoreSale(id: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('drug_store_sales')
    .delete()
    .eq('id', id);
  guard(error);
}
