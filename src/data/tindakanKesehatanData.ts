/**
 * tindakanKesehatanData.ts
 * ─────────────────────────────────────────────────────────────────
 * Source-of-truth for Tindakan Kesehatan (KH-004).
 *
 * Architecture:
 *  - TindakanItem   — satu entri tindakan (ada banyak per sesi)
 *  - TindakanSesi   — satu sesi per diagnosa; melacak status + keputusan pakai obat
 *
 * Relationship chain:
 *   PemeriksaanRecord → DiagnosaRecord → TindakanSesi ← TindakanItem[]
 *
 * Status lifecycle (sesi):
 *   'Draft' → 'Selesai'
 *   After 'Selesai': pakaiObat=true  → KH-005 (/kesehatan-hewan/pengobatan/:sesiId)
 *                    pakaiObat=false → KH-007 (/kesehatan-hewan/kontrol/:sesiId)
 */

import { generateUUID } from '../utils/uuid';
import { addKHTimelineEvent } from './kesehatanTimelineData';

// ─── Master Tindakan ──────────────────────────────────────────────────────────

export const MASTER_TINDAKAN: string[] = [
  'Observasi',
  'Isolasi',
  'Pembersihan Luka',
  'Perawatan Luka',
  'Pembersihan Kuku',
  'Pemotongan Kuku',
  'Pembersihan Mata',
  'Pembersihan Telinga',
  'Pembersihan Mulut',
  'Rehidrasi',
  'Pemberian Cairan Oral',
  'Kompres',
  'Imobilisasi',
  'Karantina',
  'Monitoring Intensif',
  'Tindakan Lainnya',
];

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusTindakanSesi = 'Draft' | 'Selesai';

/** Satu entri tindakan individual di dalam sesi. */
export type TindakanItem = {
  /** UUID v4 */
  id: string;

  /** Links to TindakanSesi */
  sesiId: string;

  /** Denormalized for easy querying */
  diagnosaId: string;
  pemeriksaanId: string;

  namaTindakan: string;
  catatan: string;

  dilakukanOleh: string;

  /** YYYY-MM-DD */
  tanggal: string;

  /** HH:MM (24h) */
  jam: string;

  /** ISO timestamp */
  createdAt: string;
};

/** Satu sesi tindakan untuk satu diagnosa (dapat memuat banyak TindakanItem). */
export type TindakanSesi = {
  /** UUID v4 */
  id: string;

  /** Links to DiagnosaRecord */
  diagnosaId: string;

  /** Denormalized */
  pemeriksaanId: string;

  /** null = belum diputuskan; true = lanjut KH-005; false = lanjut KH-007 */
  pakaiObat: boolean | null;

  status: StatusTindakanSesi;

  /** ISO timestamp */
  createdAt: string;
  updatedAt: string;
};

// ─── Databases ────────────────────────────────────────────────────────────────

export const TINDAKAN_SESI_DB: TindakanSesi[] = [];
export const TINDAKAN_ITEM_DB: TindakanItem[] = [];

// ─── Sesi Accessors ───────────────────────────────────────────────────────────

export function getTindakanSesi(id: string): TindakanSesi | null {
  return TINDAKAN_SESI_DB.find((s) => s.id === id) ?? null;
}

export function getTindakanSesiByDiagnosa(diagnosaId: string): TindakanSesi | null {
  return TINDAKAN_SESI_DB.find((s) => s.diagnosaId === diagnosaId) ?? null;
}

// ─── Item Accessors ───────────────────────────────────────────────────────────

export function getTindakanItemsBySesi(sesiId: string): TindakanItem[] {
  return TINDAKAN_ITEM_DB
    .filter((i) => i.sesiId === sesiId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getTindakanItem(id: string): TindakanItem | null {
  return TINDAKAN_ITEM_DB.find((i) => i.id === id) ?? null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type CreateTindakanSesiInput = Pick<TindakanSesi, 'diagnosaId' | 'pemeriksaanId'>;

/** Creates a new Draft sesi. Called when the TindakanKesehatan page first loads for a diagnosaId. */
export function createTindakanSesi(input: CreateTindakanSesiInput): TindakanSesi {
  const now = new Date().toISOString();
  const sesi: TindakanSesi = {
    id:            generateUUID(),
    diagnosaId:    input.diagnosaId,
    pemeriksaanId: input.pemeriksaanId,
    pakaiObat:     null,
    status:        'Draft',
    createdAt:     now,
    updatedAt:     now,
  };
  TINDAKAN_SESI_DB.push(sesi);
  // Log to KH Timeline (MAJ-002 — mirrors PAKAN_TIMELINE_LOG pattern).
  addKHTimelineEvent({
    type:       'tindakan_started',
    recordId:   sesi.id,
    targetKind: 'unknown',
    targetId:   null,
    tanggal:    now.slice(0, 10),
    notes:      null,
  });
  return sesi;
}

export type AddTindakanItemInput = Omit<TindakanItem, 'id' | 'createdAt'>;

/** Adds a new item to an existing sesi. */
export function addTindakanItem(input: AddTindakanItemInput): TindakanItem {
  const item: TindakanItem = {
    ...input,
    id:        generateUUID(),
    createdAt: new Date().toISOString(),
  };
  TINDAKAN_ITEM_DB.push(item);
  return item;
}

/** Removes an item from a sesi (only allowed while status === 'Draft'). */
export function removeTindakanItem(itemId: string): boolean {
  const idx = TINDAKAN_ITEM_DB.findIndex((i) => i.id === itemId);
  if (idx === -1) return false;
  TINDAKAN_ITEM_DB.splice(idx, 1);
  return true;
}

/** Sets the pakaiObat decision on a sesi. */
export function setPakaiObat(sesiId: string, pakaiObat: boolean): boolean {
  const idx = TINDAKAN_SESI_DB.findIndex((s) => s.id === sesiId);
  if (idx === -1) return false;
  TINDAKAN_SESI_DB[idx] = {
    ...TINDAKAN_SESI_DB[idx],
    pakaiObat,
    updatedAt: new Date().toISOString(),
  };
  return true;
}

/** Finalises the sesi — sets status to Selesai. */
export function finishTindakanSesi(sesiId: string): boolean {
  const idx = TINDAKAN_SESI_DB.findIndex((s) => s.id === sesiId);
  if (idx === -1) return false;
  TINDAKAN_SESI_DB[idx] = {
    ...TINDAKAN_SESI_DB[idx],
    status:    'Selesai',
    updatedAt:  new Date().toISOString(),
  };
  return true;
}
