// ─── Stok Inventaris Repository — FLOW-003M16 ─────────────────────────────────
//
// Supabase adapter for the Stok Inventaris module.
// Tables covered:
//   stok_inventaris, stok_inventaris_transactions
//
// Rules:
//  - All functions are async and return typed results.
//  - requireAuthSession() guards every exported function.
//  - Never import from pages, components, or contexts.
//  - Business logic lives in stokInventarisService.ts, not here.
//  - Supabase is the SSOT; in-memory stores are populated by useStokInventaris().
//
// DB Schema reference:
//   supabase/migrations/20260725000007_feed_marketplace.sql
//
// Key DB trigger behaviour:
//   apply_stok_inventaris_transaction() → INSERT on stok_inventaris_transactions
//     → updates stok_inventaris.quantity by quantity_delta.
//
// DB CHECK constraint:
//   source_type = 'Master Pakan'     → master_pakan_id NOT NULL, formula_id IS NULL
//   source_type = 'Formula'          → formula_id NOT NULL,      master_pakan_id IS NULL
//   source_type = 'Produk Komersial' → both FKs NULL

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';
import type {
  StokInventarisDbRow,
  StokInventarisCreateInput,
  StokInventarisPatchInput,
  StokTransactionDbRow,
  StokTransactionCreateInput,
} from '../types/stokInventaris';

// ─── Error ────────────────────────────────────────────────────────────────────

export class StokInventarisRepoError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'StokInventarisRepoError';
  }
}

function guard(error: { message: string; code?: string } | null): void {
  if (error) throw new StokInventarisRepoError(error.message, error.code);
}

// ─── stok_inventaris ──────────────────────────────────────────────────────────

/**
 * All stok_inventaris rows for a workspace, ordered by created_at descending.
 * Used by useStokInventaris() to hydrate the in-memory RAW_INVENTARIS.
 */
export async function repoGetStokInventarisByWorkspace(
  workspaceId: string,
): Promise<StokInventarisDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_inventaris')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  guard(error);
  return (data ?? []) as StokInventarisDbRow[];
}

/**
 * Find a single stok_inventaris row by its UUID.
 * Used by the service when the caller already has a DB UUID (post-hook population).
 */
export async function repoGetStokInventarisById(
  id: string,
): Promise<StokInventarisDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_inventaris')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as StokInventarisDbRow | null;
}

/**
 * Find a stok_inventaris row by (workspace_id, source_type, item_name).
 * Used by the service to check for existing rows before inserting.
 * Case-insensitive name match via ilike.
 */
export async function repoFindStokInventaris(
  workspaceId: string,
  sourceType: 'Master Pakan' | 'Produk Komersial' | 'Formula',
  itemName: string,
): Promise<StokInventarisDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_inventaris')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('source_type', sourceType)
    .ilike('item_name', itemName.trim())
    .maybeSingle();
  guard(error);
  return data as StokInventarisDbRow | null;
}

/**
 * Insert a new stok_inventaris master record.
 * quantity should start at 0 — the DB trigger on stok_inventaris_transactions
 * will update it after the first transaction insert.
 */
export async function repoInsertStokInventaris(
  input: StokInventarisCreateInput,
): Promise<StokInventarisDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_inventaris')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as StokInventarisDbRow;
}

/**
 * Partially update a stok_inventaris row (status, notes, purchase_price_per_kg, etc.).
 * Returns the updated row, or null if not found.
 */
export async function repoPatchStokInventaris(
  id: string,
  patch: StokInventarisPatchInput,
): Promise<StokInventarisDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_inventaris')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  guard(error);
  return data as StokInventarisDbRow | null;
}

// ─── stok_inventaris_transactions ─────────────────────────────────────────────

/**
 * Insert a transaction record.
 * The DB trigger apply_stok_inventaris_transaction() fires immediately:
 *   - Masuk (quantity_delta > 0)     → increments stok_inventaris.quantity
 *   - Keluar (quantity_delta < 0)    → decrements stok_inventaris.quantity
 *   - Penyesuaian (either sign)      → adjusts stok_inventaris.quantity
 * The trigger raises an exception if quantity would go negative.
 */
export async function repoInsertStokTransaction(
  input: StokTransactionCreateInput,
): Promise<StokTransactionDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_inventaris_transactions')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as StokTransactionDbRow;
}

/**
 * All transactions for a single stok_inventaris item, newest first.
 * Used for audit / history display.
 */
export async function repoGetTransactionsByStokId(
  stokId: string,
): Promise<StokTransactionDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_inventaris_transactions')
    .select('*')
    .eq('stok_id', stokId)
    .order('created_at', { ascending: false });
  guard(error);
  return (data ?? []) as StokTransactionDbRow[];
}

/**
 * All transactions across the entire workspace, ordered by created_at ascending.
 * Used by useStokInventaris() to hydrate the in-memory RIWAYAT_MASUK and
 * RIWAYAT_PERUBAHAN arrays so Riwayat Keluar Masuk survives a hard refresh.
 */
export async function repoGetTransactionsByWorkspace(
  workspaceId: string,
): Promise<StokTransactionDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_inventaris_transactions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  guard(error);
  return (data ?? []) as StokTransactionDbRow[];
}
