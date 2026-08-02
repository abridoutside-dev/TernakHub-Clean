// ─── Stok Obat Repository — FLOW-003M8 ───────────────────────────────────────
//
// Supabase adapter for the Stok Obat module.
// Tables covered:
//   stok_obat, stok_obat_masuk, stok_obat_keluar, stok_obat_adjustments
//
// Rules:
//  - All functions are async and return typed results.
//  - requireAuthSession() guards every exported function.
//  - Never import from pages, components, or contexts.
//  - Business logic lives in stokObatService.ts, not here.
//  - Supabase is the SSOT; in-memory stores are populated by useStokObat().
//
// DB Schema reference:
//   supabase/migrations/20260725000006_health_reproduction.sql
//
// Key DB trigger behaviour:
//   after_stok_obat_masuk  → calls add_stok_obat()   → increments stok_obat.quantity
//   after_stok_obat_keluar → calls deduct_stok_obat() → decrements stok_obat.quantity
//   stok_obat_adjustments  → NO trigger; service must patch quantity directly

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';
import type {
  StokObatDbRow,
  StokObatCreateInput,
  StokObatPatchInput,
  StokObatMasukDbRow,
  StokObatMasukCreateInput,
  StokObatKeluarDbRow,
  StokObatKeluarCreateInput,
  StokObatAdjustmentDbRow,
  StokObatAdjustmentCreateInput,
} from '../types/stokObat';

// ─── Error ────────────────────────────────────────────────────────────────────

export class StokObatRepoError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'StokObatRepoError';
  }
}

function guard(error: { message: string; code?: string } | null): void {
  if (error) throw new StokObatRepoError(error.message, error.code);
}

// ─── stok_obat ────────────────────────────────────────────────────────────────

/**
 * All stok_obat rows for a workspace, ordered by created_at descending.
 * Used by useStokObat() to hydrate the in-memory STOK_OBAT_ITEMS.
 */
export async function repoGetStokObatByWorkspace(
  workspaceId: string,
): Promise<StokObatDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_obat')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  guard(error);
  return (data ?? []) as StokObatDbRow[];
}

/**
 * Insert a new stok_obat row.
 * NOTE: quantity should be 0 on insert — the DB trigger on stok_obat_masuk
 * will increment it automatically when the first receipt is inserted.
 * Returns the persisted row (with server-generated id and timestamps).
 */
export async function repoInsertStokObatItem(
  input: StokObatCreateInput,
): Promise<StokObatDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_obat')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as StokObatDbRow;
}

/**
 * Apply a partial update to a stok_obat row (quantity, status, location, notes).
 * Returns the updated row or null if not found.
 * Used for: archive/unarchive (status) and manual quantity sync after adjustments.
 */
export async function repoPatchStokObatItem(
  id: string,
  patch: StokObatPatchInput,
): Promise<StokObatDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_obat')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  guard(error);
  return data as StokObatDbRow | null;
}

// ─── stok_obat_masuk ─────────────────────────────────────────────────────────

/**
 * Insert a new stok_obat_masuk (stock-in / receipt) row.
 * The DB trigger after_stok_obat_masuk fires and increments stok_obat.quantity.
 * Returns the persisted row.
 */
export async function repoInsertStokMasuk(
  input: StokObatMasukCreateInput,
): Promise<StokObatMasukDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_obat_masuk')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as StokObatMasukDbRow;
}

// ─── stok_obat_keluar ────────────────────────────────────────────────────────

/**
 * Insert a new stok_obat_keluar (stock-out / dispensing) row.
 * The DB trigger after_stok_obat_keluar fires and decrements stok_obat.quantity.
 * Returns the persisted row.
 * Key integration point for KH-006 (M9): treatment_id links to health_treatments.
 */
export async function repoInsertStokKeluar(
  input: StokObatKeluarCreateInput,
): Promise<StokObatKeluarDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_obat_keluar')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as StokObatKeluarDbRow;
}

// ─── stok_obat_adjustments ───────────────────────────────────────────────────

/**
 * Insert a new stok_obat_adjustments (manual stock correction) row.
 * IMPORTANT: Unlike masuk/keluar, there is NO trigger on this table.
 * After inserting, the caller must separately call repoPatchStokObatItem()
 * to update stok_obat.quantity to the new value.
 * Returns the persisted row.
 */
export async function repoInsertStokAdjustment(
  input: StokObatAdjustmentCreateInput,
): Promise<StokObatAdjustmentDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('stok_obat_adjustments')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as StokObatAdjustmentDbRow;
}
