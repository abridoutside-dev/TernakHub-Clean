// ─── Stok Inventaris Service — FLOW-003M16 ────────────────────────────────────
//
// Business logic layer for Stok Inventaris dual-write.
// All Supabase mutations must go through this service — never call the
// repository directly from pages or hooks.
//
// Rules:
//  - No React imports.
//  - Validation is synchronous; persistence is async.
//  - This service is Phase 2 of dual-write. The in-memory write via
//    stokInventarisData.ts is always Phase 1 (authoritative for UI reactivity).
//  - Callers should call refresh() (from useStokInventaris) after any mutation.
//  - Fire-and-forget calls must silence failures via console.warn only.
//
// DB Trigger notes:
//  - stok_inventaris_transactions INSERT → apply_stok_inventaris_transaction()
//    → automatically updates stok_inventaris.quantity by quantity_delta.
//  - A negative quantity_delta triggers a DB exception if quantity would go < 0.
//
// DB CHECK constraint (source_type):
//  - 'Master Pakan'     → master_pakan_id NOT NULL (uses lookupMasterPakanId)
//  - 'Formula'          → formula_id NOT NULL      (lookup deferred — FUTURE FEATURE)
//  - 'Produk Komersial' → both FKs NULL            (referensiId stored in notes)
//
// Notes JSON convention (metadata round-trip via useStokInventaris):
//  { b, sup, loc, rid, hp, tm, c, fn, kat }

import { lookupMasterPakanId } from './masterPakanCatalogService';
import {
  repoGetStokInventarisById,
  repoFindStokInventaris,
  repoInsertStokInventaris,
  repoInsertStokTransaction,
  StokInventarisRepoError,
} from '../repositories/stokInventarisRepository';
import type { StokInventarisDbRow } from '../types/stokInventaris';

// ─── Service result ───────────────────────────────────────────────────────────

export type StokInventarisServiceResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

function ok<T>(data: T): StokInventarisServiceResult<T> { return { ok: true, data }; }
function fail<T>(msg: string): StokInventarisServiceResult<T> { return { ok: false, error: msg }; }

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Returns true if the string looks like a v4 UUID. */
function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

type DbSourceType = 'Master Pakan' | 'Produk Komersial' | 'Formula';

function toDbSourceType(sumber: string): DbSourceType {
  if (sumber === 'Hasil Produksi') return 'Formula';
  if (sumber === 'Master Pakan')   return 'Master Pakan';
  return 'Produk Komersial';
}

/**
 * Serialise display-only metadata into the notes JSON blob.
 * Parsed back by useStokInventaris.toRawItem().
 */
function buildNotes(meta: {
  brand?: string;
  supplier?: string;
  lokasi?: string;
  referensiId?: string;
  hargaBeli?: number;
  tanggalMasuk?: string;
  catatan?: string;
  formulaNama?: string;
  kategori?: string;
}): string {
  return JSON.stringify({
    b:   meta.brand       ?? '',
    sup: meta.supplier    ?? '',
    loc: meta.lokasi      ?? '',
    rid: meta.referensiId ?? '',
    hp:  meta.hargaBeli   ?? null,
    tm:  meta.tanggalMasuk ?? '',
    c:   meta.catatan     ?? '',
    fn:  meta.formulaNama ?? '',
    kat: meta.kategori    ?? '',
  });
}

/**
 * Resolve or create the stok_inventaris DB row for the given item.
 *
 * Resolution order:
 *  1. UUID direct lookup (when itemId is already a DB UUID — post-hook state).
 *  2. (workspace_id, source_type, item_name) lookup — handles legacy inv-N IDs.
 *  3. Insert new row (quantity = 0; trigger handles increments).
 *
 * Skips DB insert (returns null) when the DB CHECK constraint cannot be satisfied:
 *  - 'Master Pakan' item with no match in master_pakan_catalog (FK required).
 *  - 'Formula' item (formula_id FK required; lookup not yet implemented).
 */
async function resolveOrCreateStokRow(opts: {
  workspaceId:  string;
  itemId:       string;
  itemName:     string;
  sumber:       string;
  unit:         string;
  referensiId?: string;
  hargaBeli?:   number;
  brand?:       string;
  supplier?:    string;
  lokasi?:      string;
  tanggalMasuk?: string;
  catatan?:     string;
  formulaNama?: string;
  kategori?:    string;
}): Promise<StokInventarisDbRow | null> {
  const sourceType = toDbSourceType(opts.sumber);

  // 1. UUID direct lookup
  if (isUuid(opts.itemId)) {
    const row = await repoGetStokInventarisById(opts.itemId);
    if (row) return row;
  }

  // 2. (workspace, source_type, item_name) lookup
  const existing = await repoFindStokInventaris(opts.workspaceId, sourceType, opts.itemName);
  if (existing) return existing;

  // 3. Resolve required FKs before inserting
  let masterPakanId: string | null = null;

  if (sourceType === 'Master Pakan') {
    masterPakanId = await lookupMasterPakanId(opts.itemName);
    if (!masterPakanId) {
      // DB CHECK requires master_pakan_id NOT NULL for 'Master Pakan'
      console.warn(
        '[stokInventarisService] master_pakan_catalog miss for',
        JSON.stringify(opts.itemName),
        '— DB write skipped. Add item to catalog migration to enable persistence.',
      );
      return null;
    }
  }

  if (sourceType === 'Formula') {
    // formula_id FK required by CHECK constraint.
    // feed_formulas UUID lookup not yet implemented (FUTURE FEATURE).
    console.warn(
      '[stokInventarisService] formula_id lookup not implemented for',
      JSON.stringify(opts.itemName),
      '— DB write skipped.',
    );
    return null;
  }

  // 4. Insert new master record (quantity = 0, trigger increments on first transaction)
  const notes = buildNotes({
    brand:       opts.brand,
    supplier:    opts.supplier,
    lokasi:      opts.lokasi,
    referensiId: opts.referensiId,
    hargaBeli:   opts.hargaBeli,
    tanggalMasuk: opts.tanggalMasuk,
    catatan:     opts.catatan,
    formulaNama: opts.formulaNama,
    kategori:    opts.kategori,
  });

  try {
    return await repoInsertStokInventaris({
      workspace_id:        opts.workspaceId,
      source_type:         sourceType,
      master_pakan_id:     masterPakanId,
      formula_id:          null,
      item_name:           opts.itemName.trim(),
      quantity:            0,
      unit:                opts.unit || 'Kg',
      purchase_price_per_kg: opts.hargaBeli ?? null,
      status:              'Aktif',
      notes,
    });
  } catch (err) {
    const msg = err instanceof StokInventarisRepoError ? err.message : String(err);
    console.warn('[stokInventarisService] insert failed:', msg);
    return null;
  }
}

// ─── recordTambahStok ─────────────────────────────────────────────────────────

export interface RecordTambahStokInput {
  itemId:        string;
  itemName:      string;
  sumber:        string;
  unit:          string;
  jumlah:        number;
  tanggal:       string; // YYYY-MM-DD
  referensiId?:  string;
  hargaBeli?:    number;
  brand?:        string;
  supplier?:     string;
  lokasi?:       string;
  catatan?:      string;
  kategori?:     string;
  /** Marketplace only — stored in reason for audit trail. */
  nomorTransaksi?: string;
  penjual?:        string;
}

/**
 * Dual-write: record a stock addition (Tambah Stok or Marketplace receipt).
 * Fire-and-forget after addInventarisFromTambahStok / addInventarisFromMarketplace.
 * Inserts a Masuk transaction; DB trigger increments stok_inventaris.quantity.
 */
export async function recordTambahStok(
  workspaceId: string,
  input: RecordTambahStokInput,
): Promise<StokInventarisServiceResult<{ stokId: string }>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (input.jumlah <= 0) return fail('Jumlah harus lebih dari 0.');
  if (!input.tanggal)    return fail('Tanggal diperlukan.');

  try {
    const row = await resolveOrCreateStokRow({
      workspaceId:  workspaceId,
      itemId:       input.itemId,
      itemName:     input.itemName,
      sumber:       input.sumber,
      unit:         input.unit,
      referensiId:  input.referensiId,
      hargaBeli:    input.hargaBeli,
      brand:        input.brand,
      supplier:     input.supplier,
      lokasi:       input.lokasi,
      tanggalMasuk: input.tanggal,
      catatan:      input.catatan,
      kategori:     input.kategori,
    });
    if (!row) return fail('Gagal menemukan/membuat item stok di database.');

    const reason = input.nomorTransaksi
      ? `Masuk via Marketplace — ${input.penjual ?? ''} (${input.nomorTransaksi})`
      : 'Tambah Stok';

    await repoInsertStokTransaction({
      stok_id:          row.id,
      workspace_id:     workspaceId,
      transaction_type: 'Masuk',
      quantity_delta:   input.jumlah,
      quantity_before:  Number(row.quantity),
      quantity_after:   Number(row.quantity) + input.jumlah,
      reason,
      transaction_date: input.tanggal,
    });

    return ok({ stokId: row.id });
  } catch (err) {
    const msg = err instanceof StokInventarisRepoError ? err.message : 'Gagal menyimpan tambah stok.';
    return fail(msg);
  }
}

// ─── recordPerubahanStok ──────────────────────────────────────────────────────

export interface RecordPerubahanStokInput {
  itemId:           string;
  itemName:         string;
  sumber:           string;
  unit:             string;
  jumlah:           number;          // positive — amount REDUCED
  jumlahStokSebelum: number;
  tanggal:          string;          // YYYY-MM-DD
  jenis:            string;          // PerubahanStokJenis label
  catatan?:         string;
  operator?:        string;
  referensiId?:     string;
  kategori?:        string;
}

/**
 * Dual-write: record a stock reduction (Perubahan Stok / Keluarkan Stok).
 * Fire-and-forget after addPerubahanStok.
 * Inserts a Keluar transaction; DB trigger decrements stok_inventaris.quantity.
 */
export async function recordPerubahanStok(
  workspaceId: string,
  input: RecordPerubahanStokInput,
): Promise<StokInventarisServiceResult<{ stokId: string }>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (input.jumlah <= 0) return fail('Jumlah harus lebih dari 0.');

  try {
    const row = await resolveOrCreateStokRow({
      workspaceId: workspaceId,
      itemId:      input.itemId,
      itemName:    input.itemName,
      sumber:      input.sumber,
      unit:        input.unit,
      referensiId: input.referensiId,
      kategori:    input.kategori,
    });
    if (!row) return fail('Item stok tidak ditemukan di database.');

    const reason = input.catatan
      ? `${input.jenis} — ${input.catatan}`
      : input.jenis;

    await repoInsertStokTransaction({
      stok_id:          row.id,
      workspace_id:     workspaceId,
      transaction_type: 'Keluar',
      quantity_delta:   -Math.abs(input.jumlah),
      quantity_before:  input.jumlahStokSebelum,
      quantity_after:   input.jumlahStokSebelum - input.jumlah,
      reason,
      transaction_date: input.tanggal,
    });

    return ok({ stokId: row.id });
  } catch (err) {
    const msg = err instanceof StokInventarisRepoError ? err.message : 'Gagal menyimpan perubahan stok.';
    return fail(msg);
  }
}

// ─── recordPenyesuaianPositif ─────────────────────────────────────────────────

export interface RecordPenyesuaianPositifInput {
  itemId:            string;
  itemName:          string;
  sumber:            string;
  unit:              string;
  jumlah:            number;         // positive — amount ADDED
  jumlahStokSebelum: number;
  tanggal:           string;         // YYYY-MM-DD
  catatan?:          string;
  operator?:         string;
  referensiId?:      string;
  kategori?:         string;
}

/**
 * Dual-write: record a positive stock adjustment (Penyesuaian Positif).
 * Fire-and-forget after addPenyesuaianPositif.
 * Inserts a Penyesuaian transaction with positive delta.
 */
export async function recordPenyesuaianPositif(
  workspaceId: string,
  input: RecordPenyesuaianPositifInput,
): Promise<StokInventarisServiceResult<{ stokId: string }>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (input.jumlah <= 0) return fail('Jumlah harus lebih dari 0.');

  try {
    const row = await resolveOrCreateStokRow({
      workspaceId: workspaceId,
      itemId:      input.itemId,
      itemName:    input.itemName,
      sumber:      input.sumber,
      unit:        input.unit,
      referensiId: input.referensiId,
      kategori:    input.kategori,
    });
    if (!row) return fail('Item stok tidak ditemukan di database.');

    const reason = input.catatan
      ? `Penyesuaian Positif — ${input.catatan}`
      : 'Penyesuaian Positif';

    await repoInsertStokTransaction({
      stok_id:          row.id,
      workspace_id:     workspaceId,
      transaction_type: 'Penyesuaian',
      quantity_delta:   Math.abs(input.jumlah),
      quantity_before:  input.jumlahStokSebelum,
      quantity_after:   input.jumlahStokSebelum + input.jumlah,
      reason,
      transaction_date: input.tanggal,
    });

    return ok({ stokId: row.id });
  } catch (err) {
    const msg = err instanceof StokInventarisRepoError ? err.message : 'Gagal menyimpan penyesuaian positif.';
    return fail(msg);
  }
}

// ─── recordPindahGudang ───────────────────────────────────────────────────────

export interface RecordPindahGudangInput {
  // Source item
  asalItemId:         string;
  asalItemName:       string;
  asalSumber:         string;
  asalUnit:           string;
  asalJumlahSebelum:  number;
  asalReferensiId?:   string;
  asalKategori?:      string;
  // Destination item
  tujuanItemId:       string;
  tujuanItemName:     string;
  tujuanSumber:       string;
  tujuanUnit:         string;
  tujuanJumlahSebelum: number;
  tujuanReferensiId?: string;
  tujuanKategori?:    string;
  // Common
  jumlah:   number;
  tanggal:  string; // YYYY-MM-DD
  catatan?: string;
  operator?: string;
}

/**
 * Dual-write: record a Pindah Gudang operation (dual transaction).
 * Fire-and-forget after addPerubahanStok with jenis='Pindah Gudang' + inventarisTujuanId.
 * Inserts Keluar (source) + Masuk (destination) transactions; trigger handles both.
 */
export async function recordPindahGudang(
  workspaceId: string,
  input: RecordPindahGudangInput,
): Promise<StokInventarisServiceResult<{ asalStokId: string; tujuanStokId: string }>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (input.jumlah <= 0) return fail('Jumlah harus lebih dari 0.');

  try {
    const [asalRow, tujuanRow] = await Promise.all([
      resolveOrCreateStokRow({
        workspaceId: workspaceId,
        itemId:      input.asalItemId,
        itemName:    input.asalItemName,
        sumber:      input.asalSumber,
        unit:        input.asalUnit,
        referensiId: input.asalReferensiId,
        kategori:    input.asalKategori,
      }),
      resolveOrCreateStokRow({
        workspaceId: workspaceId,
        itemId:      input.tujuanItemId,
        itemName:    input.tujuanItemName,
        sumber:      input.tujuanSumber,
        unit:        input.tujuanUnit,
        referensiId: input.tujuanReferensiId,
        kategori:    input.tujuanKategori,
      }),
    ]);

    if (!asalRow)   return fail('Item stok asal tidak ditemukan di database.');
    if (!tujuanRow) return fail('Item stok tujuan tidak ditemukan di database.');

    const reason = input.catatan ? `Pindah Gudang — ${input.catatan}` : 'Pindah Gudang';

    await Promise.all([
      repoInsertStokTransaction({
        stok_id:          asalRow.id,
        workspace_id:     workspaceId,
        transaction_type: 'Keluar',
        quantity_delta:   -Math.abs(input.jumlah),
        quantity_before:  input.asalJumlahSebelum,
        quantity_after:   input.asalJumlahSebelum - input.jumlah,
        reason,
        reference_id:     tujuanRow.id,
        reference_type:   'stok_inventaris',
        transaction_date: input.tanggal,
      }),
      repoInsertStokTransaction({
        stok_id:          tujuanRow.id,
        workspace_id:     workspaceId,
        transaction_type: 'Masuk',
        quantity_delta:   Math.abs(input.jumlah),
        quantity_before:  input.tujuanJumlahSebelum,
        quantity_after:   input.tujuanJumlahSebelum + input.jumlah,
        reason:           `Penerimaan Pindah Gudang dari ${input.asalItemName}`,
        reference_id:     asalRow.id,
        reference_type:   'stok_inventaris',
        transaction_date: input.tanggal,
      }),
    ]);

    return ok({ asalStokId: asalRow.id, tujuanStokId: tujuanRow.id });
  } catch (err) {
    const msg = err instanceof StokInventarisRepoError ? err.message : 'Gagal menyimpan pindah gudang.';
    return fail(msg);
  }
}

// ─── recordPemberianPakanTransaction ─────────────────────────────────────────

export interface RecordPemberianPakanTransactionInput {
  itemId:             string;
  itemName:           string;
  sumber:             string;
  unit:               string;
  jumlah:             number;
  jumlahStokSebelum:  number;
  tanggal:            string; // YYYY-MM-DD
  livestockName?:     string;
  referensiId?:       string;
  kategori?:          string;
  /** FK → pemberian_pakan.id for traceability. */
  pemberianPakanId?:  string;
}

/**
 * Dual-write: record a Pemberian Pakan stock deduction.
 * Called from pemberianPakanService after recording the feed session.
 * One call per feed item in the session.
 */
export async function recordPemberianPakanTransaction(
  workspaceId: string,
  input: RecordPemberianPakanTransactionInput,
): Promise<StokInventarisServiceResult<{ stokId: string }>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (input.jumlah <= 0) return fail('Jumlah harus lebih dari 0.');

  try {
    const row = await resolveOrCreateStokRow({
      workspaceId: workspaceId,
      itemId:      input.itemId,
      itemName:    input.itemName,
      sumber:      input.sumber,
      unit:        input.unit,
      referensiId: input.referensiId,
      kategori:    input.kategori,
    });
    if (!row) return fail('Item stok tidak ditemukan di database.');

    await repoInsertStokTransaction({
      stok_id:          row.id,
      workspace_id:     workspaceId,
      transaction_type: 'Keluar',
      quantity_delta:   -Math.abs(input.jumlah),
      quantity_before:  input.jumlahStokSebelum,
      quantity_after:   input.jumlahStokSebelum - input.jumlah,
      reason: input.livestockName
        ? `Pemberian Pakan — ${input.livestockName}`
        : 'Pemberian Pakan',
      reference_id:   input.pemberianPakanId ?? null,
      reference_type: input.pemberianPakanId ? 'pemberian_pakan' : null,
      transaction_date: input.tanggal,
    });

    return ok({ stokId: row.id });
  } catch (err) {
    const msg = err instanceof StokInventarisRepoError ? err.message : 'Gagal menyimpan transaksi pemberian pakan.';
    return fail(msg);
  }
}
