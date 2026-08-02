// ─── Stok Obat Service — FLOW-003M8 ──────────────────────────────────────────
//
// Business logic layer for the Stok Obat module.
// All Supabase mutations must go through this service — never call the
// repository directly from pages or hooks.
//
// Rules:
//  - No React imports.
//  - Validation is synchronous; persistence is async.
//  - This service is the Supabase write path (Phase 2 of dual-write).
//  - The in-memory write via stokObatData.ts remains Phase 1 (authoritative
//    for UI reactivity). This service never modifies in-memory stores.
//  - Callers should call refresh() (from useStokObat) after any mutation.
//
// DB Trigger notes:
//  - stok_obat_masuk INSERT → triggers add_stok_obat() → auto-increments quantity
//  - stok_obat_keluar INSERT → triggers deduct_stok_obat() → auto-decrements quantity
//  - stok_obat_adjustments INSERT → NO trigger → must call repoPatchStokObatItem()
//
// Notes field convention for metadata round-trip (M8):
//  - The stok_obat.notes column stores a JSON object that carries display fields
//    not present in the DB schema: brand, bentukSediaan, kemasan, produkKomersialUuid,
//    masterObatUuid. This enables useStokObat to reconstruct full StokObatItem
//    records from Supabase rows without additional lookups.

import type {
  StokObatDbRow,
  StokObatMasukDbRow,
  StokObatKeluarDbRow,
  StokObatAdjustmentDbRow,
} from '../types/stokObat';

import {
  repoInsertStokObatItem,
  repoPatchStokObatItem,
  repoInsertStokMasuk,
  repoInsertStokKeluar,
  repoInsertStokAdjustment,
  StokObatRepoError,
} from '../repositories/stokObatRepository';

// ─── Error type ───────────────────────────────────────────────────────────────

export class StokObatServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StokObatServiceError';
  }
}

// ─── Service result ───────────────────────────────────────────────────────────

export type StokObatServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function ok<T>(data: T): StokObatServiceResult<T> {
  return { ok: true, data };
}

function fail<T>(message: string): StokObatServiceResult<T> {
  return { ok: false, error: message };
}

// ─── Service input types ──────────────────────────────────────────────────────

/**
 * UI-facing input for creating a new stok_obat master record.
 * Uses Indonesian field names matching TambahStokObatInput from stokObatData.ts.
 */
export interface AddStokItemInput {
  /** Nama produk dari katalog Produk Komersial Obat */
  namaProduk: string;
  brand: string;
  bentukSediaan: string;
  kemasan: string;
  produkKomersialUuid: string;
  masterObatUuid: string;
  satuan: string;
  /** YYYY-MM-DD */
  tanggalMasuk: string;
  tanggalExpired?: string | null;
  lokasiPenyimpanan?: string;
  nomorBatch?: string;
}

/**
 * UI-facing input for recording a stock receipt (stok masuk).
 * Inserted after addStokItem — the DB trigger auto-increments stok_obat.quantity.
 */
export interface AddStokMasukInput {
  /** Quantity received — must be > 0 */
  jumlah: number;
  /** YYYY-MM-DD */
  tanggalMasuk: string;
  sumber?: string | null;
  supplier?: string | null;
  hargaBeli?: number | null;
  nomorInvoice?: string | null;
  catatan?: string | null;
  recordedBy?: string | null;
}

/**
 * UI-facing input for recording a stock dispensing event (stok keluar).
 * The DB trigger auto-decrements stok_obat.quantity.
 * Used by KH-006 (M9) via treatment_id for linked health treatments.
 */
export interface AddStokKeluarInput {
  /** Quantity dispensed — must be > 0 */
  jumlah: number;
  /** YYYY-MM-DD */
  tanggalKeluar: string;
  alasan?: string | null;
  /** FK → livestock.id — animal that received the drug */
  livestockId?: string | null;
  /** FK → health_treatments.id — KH-006 integration point */
  treatmentId?: string | null;
  catatan?: string | null;
  recordedBy?: string | null;
}

/**
 * UI-facing input for a manual stock adjustment (penyesuaian stok).
 * applyAdjustment() inserts the adjustment record AND patches stok_obat.quantity
 * directly, since there is no DB trigger for this table.
 */
export interface ApplyAdjustmentInput {
  /** Current quantity before adjustment (captured from in-memory before mutation) */
  jumlahSebelum: number;
  /** Positive number — how much to reduce */
  jumlahDikurangi: number;
  /** AlasanPenyesuaianStok value */
  alasan: string;
  /** YYYY-MM-DD — date of the physical adjustment */
  tanggal: string;
  adjustedBy?: string | null;
}

// ─── stok_obat CRUD ───────────────────────────────────────────────────────────

/**
 * Create a new stok_obat master record (item master, no stock yet).
 * quantity is set to 0 — call addStokMasuk() afterwards so the DB trigger
 * increments it to the correct initial value.
 *
 * Display-only fields (brand, bentukSediaan, kemasan, produkKomersialUuid,
 * masterObatUuid) are serialised into the notes column so that useStokObat()
 * can reconstruct a full StokObatItem after a hard refresh.
 */
export async function addStokItem(
  workspaceId: string,
  input: AddStokItemInput,
): Promise<StokObatServiceResult<StokObatDbRow>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (!input.namaProduk?.trim()) return fail('Nama produk diperlukan.');
  if (!input.satuan) return fail('Satuan diperlukan.');
  if (!input.tanggalMasuk) return fail('Tanggal masuk diperlukan.');

  // Serialise metadata into notes for round-trip reconstruction by useStokObat.
  const meta = JSON.stringify({
    b: input.brand,
    s: input.bentukSediaan,
    k: input.kemasan,
    p: input.produkKomersialUuid,
    o: input.masterObatUuid,
  });

  try {
    const row = await repoInsertStokObatItem({
      workspace_id:  workspaceId,
      drug_id:       null,
      drug_name:     input.namaProduk.trim(),
      category_id:   null,
      quantity:      0, // incremented by DB trigger after stok_obat_masuk insert
      unit:          input.satuan,
      min_stock:     null,
      expiry_date:   input.tanggalExpired ?? null,
      batch_number:  input.nomorBatch ?? null,
      status:        'Aktif',
      location:      input.lokasiPenyimpanan ?? null,
      purchase_price: null,
      notes:         meta,
    });
    return ok(row);
  } catch (err) {
    const msg = err instanceof StokObatRepoError ? err.message : 'Gagal menyimpan stok obat.';
    return fail(msg);
  }
}

/**
 * Record a stock receipt.
 * The DB trigger after_stok_obat_masuk fires and increments stok_obat.quantity.
 * Call this after addStokItem() to set the initial stock level.
 */
export async function addStokMasuk(
  workspaceId: string,
  stokObatId: string,
  input: AddStokMasukInput,
): Promise<StokObatServiceResult<StokObatMasukDbRow>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (!stokObatId) return fail('ID stok obat diperlukan.');
  if (!input.jumlah || input.jumlah <= 0) return fail('Jumlah harus lebih dari 0.');
  if (!input.tanggalMasuk) return fail('Tanggal masuk diperlukan.');

  try {
    const row = await repoInsertStokMasuk({
      stok_obat_id:   stokObatId,
      workspace_id:   workspaceId,
      quantity:       input.jumlah,
      source:         input.sumber ?? null,
      supplier:       input.supplier ?? null,
      purchase_price: input.hargaBeli ?? null,
      invoice_number: input.nomorInvoice ?? null,
      received_date:  input.tanggalMasuk,
      notes:          input.catatan ?? null,
      recorded_by:    input.recordedBy ?? null,
    });
    return ok(row);
  } catch (err) {
    const msg = err instanceof StokObatRepoError ? err.message : 'Gagal menyimpan stok masuk.';
    return fail(msg);
  }
}

/**
 * Record a stock dispensing event.
 * The DB trigger after_stok_obat_keluar fires and decrements stok_obat.quantity.
 * Used by KH-006 (M9): pass treatmentId to link the dispensing to a health treatment.
 */
export async function addStokKeluar(
  workspaceId: string,
  stokObatId: string,
  input: AddStokKeluarInput,
): Promise<StokObatServiceResult<StokObatKeluarDbRow>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (!stokObatId) return fail('ID stok obat diperlukan.');
  if (!input.jumlah || input.jumlah <= 0) return fail('Jumlah harus lebih dari 0.');
  if (!input.tanggalKeluar) return fail('Tanggal keluar diperlukan.');

  try {
    const row = await repoInsertStokKeluar({
      stok_obat_id: stokObatId,
      workspace_id: workspaceId,
      treatment_id: input.treatmentId ?? null,
      quantity:     input.jumlah,
      reason:       input.alasan ?? null,
      livestock_id: input.livestockId ?? null,
      usage_date:   input.tanggalKeluar,
      notes:        input.catatan ?? null,
      recorded_by:  input.recordedBy ?? null,
    });
    return ok(row);
  } catch (err) {
    const msg = err instanceof StokObatRepoError ? err.message : 'Gagal menyimpan stok keluar.';
    return fail(msg);
  }
}

/**
 * Apply a manual stock adjustment (penyesuaian stok).
 * Inserts an adjustment record AND patches stok_obat.quantity directly,
 * because stok_obat_adjustments has no DB trigger.
 */
export async function applyAdjustment(
  workspaceId: string,
  stokObatId: string,
  input: ApplyAdjustmentInput,
): Promise<StokObatServiceResult<StokObatAdjustmentDbRow>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (!stokObatId) return fail('ID stok obat diperlukan.');
  if (!input.alasan?.trim()) return fail('Alasan penyesuaian diperlukan.');
  if (!input.tanggal) return fail('Tanggal diperlukan.');
  if (input.jumlahDikurangi <= 0) return fail('Jumlah pengurangan harus lebih dari 0.');
  if (input.jumlahDikurangi > input.jumlahSebelum) {
    return fail('Jumlah pengurangan tidak boleh melebihi stok tersedia.');
  }

  const quantityAfter = input.jumlahSebelum - input.jumlahDikurangi;

  try {
    // 1. Insert adjustment record (no DB trigger — quantity NOT auto-updated).
    const row = await repoInsertStokAdjustment({
      stok_obat_id:    stokObatId,
      workspace_id:    workspaceId,
      quantity_before: input.jumlahSebelum,
      quantity_after:  quantityAfter,
      quantity_delta:  -input.jumlahDikurangi,
      reason:          input.alasan.trim(),
      adjusted_by:     input.adjustedBy ?? null,
    });

    // 2. Explicitly patch stok_obat.quantity (no trigger for adjustments).
    await repoPatchStokObatItem(stokObatId, { quantity: quantityAfter });

    return ok(row);
  } catch (err) {
    const msg = err instanceof StokObatRepoError ? err.message : 'Gagal menyimpan penyesuaian stok.';
    return fail(msg);
  }
}

/**
 * Archive a stok_obat item (soft-delete — sets status to 'Diarsipkan').
 * Item is hidden from the active stock list but data is preserved.
 */
export async function archiveStokItem(
  id: string,
): Promise<StokObatServiceResult<StokObatDbRow | null>> {
  if (!id) return fail('ID stok obat diperlukan.');

  try {
    const row = await repoPatchStokObatItem(id, { status: 'Diarsipkan' });
    return ok(row);
  } catch (err) {
    const msg = err instanceof StokObatRepoError ? err.message : 'Gagal mengarsipkan item stok.';
    return fail(msg);
  }
}

/**
 * Restore an archived stok_obat item (sets status back to 'Aktif').
 */
export async function unarchiveStokItem(
  id: string,
): Promise<StokObatServiceResult<StokObatDbRow | null>> {
  if (!id) return fail('ID stok obat diperlukan.');

  try {
    const row = await repoPatchStokObatItem(id, { status: 'Aktif' });
    return ok(row);
  } catch (err) {
    const msg = err instanceof StokObatRepoError ? err.message : 'Gagal memulihkan item stok.';
    return fail(msg);
  }
}
