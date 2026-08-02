/**
 * pengobatanKesehatanData.ts
 * ─────────────────────────────────────────────────────────────────
 * Source-of-truth for Pengobatan Kesehatan records (KH-005).
 *
 * Architecture:
 *  - PengobatanSesi  — satu sesi per tindakan-sesi; melacak status keseluruhan
 *  - PengobatanItem  — satu entri obat per penggunaan (banyak per sesi)
 *
 * Relationship chain:
 *   PemeriksaanRecord → DiagnosaRecord → TindakanSesi → PengobatanSesi ← PengobatanItem[]
 *
 * PENTING:
 *  - Sumber obat HANYA dari Stok Obat (stokObatData.ts)
 *  - KH-005 TIDAK mengurangi stok — itu dilakukan di KH-006
 *  - KH-005 TIDAK membuat Riwayat Stok — itu dilakukan di KH-006
 *
 * Status lifecycle (sesi):
 *   'Draft' → 'Siap Diproses' (lanjut ke KH-006)
 */

import { generateUUID } from '../utils/uuid';
import { addKHTimelineEvent } from './kesehatanTimelineData';

// ─── Master Cara Pemberian ────────────────────────────────────────────────────

export const CARA_PEMBERIAN_OPTIONS: string[] = [
  'Oral',
  'Injeksi Intramuskular',
  'Injeksi Subkutan',
  'Injeksi Intravena',
  'Topikal',
  'Intranasal',
  'Intramammary',
  'Lainnya',
];

export const FREKUENSI_OPTIONS: string[] = [
  '1x sehari',
  '2x sehari',
  '3x sehari',
  '4x sehari',
  'Setiap 8 jam',
  'Setiap 12 jam',
  'Setiap 24 jam',
  'Setiap 48 jam',
  'Setiap 72 jam',
  'Sesuai kebutuhan',
];

export const LAMA_PEMBERIAN_OPTIONS: string[] = [
  '1 hari',
  '2 hari',
  '3 hari',
  '4 hari',
  '5 hari',
  '7 hari',
  '10 hari',
  '14 hari',
  'Sesuai kondisi',
];

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusPengobatanSesi = 'Draft' | 'Siap Diproses' | 'Pengobatan Selesai';

/** Satu entri penggunaan obat dalam sesi pengobatan. */
export type PengobatanItem = {
  /** UUID v4 */
  id: string;

  /** Links to PengobatanSesi */
  sesiId: string;

  /** Denormalized — links to TindakanSesi */
  tindakanSesiId: string;
  diagnosaId: string;
  pemeriksaanId: string;

  // ── Stok obat reference ──────────────────────────────────────────────────────
  /** Links to StokObatItem.uuid */
  stokObatUuid: string;
  /** Denormalized at time of recording */
  namaProduk: string;
  namaGenerik: string;
  brand: string;
  bentukSediaan: string;

  // ── Penggunaan fields ────────────────────────────────────────────────────────
  /** Jumlah dosis per pemberian, e.g. "5" */
  dosis: string;
  /** Satuan dosis, e.g. "mL", "mg" — pre-filled from stok satuan */
  satuanDosis: string;
  frekuensi: string;
  lamaPemberian: string;
  caraPemberian: string;
  catatan: string;

  /** ISO timestamp */
  createdAt: string;
};

/** Satu sesi pengobatan, terhubung ke satu TindakanSesi. */
export type PengobatanSesi = {
  /** UUID v4 */
  id: string;

  /** Links to TindakanSesi */
  tindakanSesiId: string;

  /** Denormalized */
  diagnosaId: string;
  pemeriksaanId: string;

  status: StatusPengobatanSesi;

  /** ISO timestamp */
  createdAt: string;
  updatedAt: string;
};

// ─── Databases ────────────────────────────────────────────────────────────────

export const PENGOBATAN_SESI_DB: PengobatanSesi[] = [];
export const PENGOBATAN_ITEM_DB: PengobatanItem[] = [];

// ─── Sesi Accessors ───────────────────────────────────────────────────────────

export function getPengobatanSesi(id: string): PengobatanSesi | null {
  return PENGOBATAN_SESI_DB.find((s) => s.id === id) ?? null;
}

export function getPengobatanSesiByTindakan(tindakanSesiId: string): PengobatanSesi | null {
  return PENGOBATAN_SESI_DB.find((s) => s.tindakanSesiId === tindakanSesiId) ?? null;
}

// ─── Item Accessors ───────────────────────────────────────────────────────────

export function getPengobatanItemsBySesi(sesiId: string): PengobatanItem[] {
  return PENGOBATAN_ITEM_DB
    .filter((i) => i.sesiId === sesiId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type CreatePengobatanSesiInput = Pick<PengobatanSesi, 'tindakanSesiId' | 'diagnosaId' | 'pemeriksaanId'>;

/** Creates a new Draft sesi. */
export function createPengobatanSesi(input: CreatePengobatanSesiInput): PengobatanSesi {
  const now = new Date().toISOString();
  const sesi: PengobatanSesi = {
    id:              generateUUID(),
    tindakanSesiId:  input.tindakanSesiId,
    diagnosaId:      input.diagnosaId,
    pemeriksaanId:   input.pemeriksaanId,
    status:          'Draft',
    createdAt:       now,
    updatedAt:       now,
  };
  PENGOBATAN_SESI_DB.push(sesi);
  // Log to KH Timeline (MAJ-002 — mirrors PAKAN_TIMELINE_LOG pattern).
  addKHTimelineEvent({
    type:       'pengobatan_started',
    recordId:   sesi.id,
    targetKind: 'unknown',
    targetId:   null,
    tanggal:    now.slice(0, 10),
    notes:      null,
  });
  return sesi;
}

export type AddPengobatanItemInput = Omit<PengobatanItem, 'id' | 'createdAt'>;

/** Adds a new obat entry to an existing Draft sesi. */
export function addPengobatanItem(input: AddPengobatanItemInput): PengobatanItem {
  const item: PengobatanItem = {
    ...input,
    id:        generateUUID(),
    createdAt: new Date().toISOString(),
  };
  PENGOBATAN_ITEM_DB.push(item);
  return item;
}

/** Removes an item from a sesi (only while Draft). */
export function removePengobatanItem(itemId: string): boolean {
  const idx = PENGOBATAN_ITEM_DB.findIndex((i) => i.id === itemId);
  if (idx === -1) return false;
  PENGOBATAN_ITEM_DB.splice(idx, 1);
  return true;
}

/** Finalises the sesi — sets status to Siap Diproses. */
export function finishPengobatanSesi(sesiId: string): boolean {
  const idx = PENGOBATAN_SESI_DB.findIndex((s) => s.id === sesiId);
  if (idx === -1) return false;
  PENGOBATAN_SESI_DB[idx] = {
    ...PENGOBATAN_SESI_DB[idx],
    status:    'Siap Diproses',
    updatedAt:  new Date().toISOString(),
  };
  return true;
}

/**
 * Called by integrasiPengobatanService after a successful atomic integration.
 * Sets status to 'Pengobatan Selesai' — prevents duplicate execution.
 */
export function markPengobatanSelesai(sesiId: string): boolean {
  const idx = PENGOBATAN_SESI_DB.findIndex((s) => s.id === sesiId);
  if (idx === -1) return false;
  PENGOBATAN_SESI_DB[idx] = {
    ...PENGOBATAN_SESI_DB[idx],
    status:    'Pengobatan Selesai',
    updatedAt:  new Date().toISOString(),
  };
  return true;
}
