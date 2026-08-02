/**
 * pemeriksaanKesehatanData.ts
 * ─────────────────────────────────────────────────────────────────
 * Source-of-truth for Pemeriksaan Kesehatan records (KH-002).
 *
 * Architecture:
 *  - All records live in PEMERIKSAAN_DB (in-memory, no backend yet)
 *  - addPemeriksaan()  → create a new Draft record, returns its id
 *  - getPemeriksaan()  → lookup by id
 *  - getPemeriksaanList() → all records (newest first)
 *
 * Status lifecycle (this module only handles the first two):
 *   Draft → Siap Diagnosa → (KH-003 onward) → Selesai
 */

import { generateUUID } from '../utils/uuid';
import { addKHTimelineEvent } from './kesehatanTimelineData';

// ─── Enums / Literal Types ────────────────────────────────────────────────────

export type StatusPemeriksaan = 'Draft' | 'Siap Diagnosa';
export type ModeKesehatan     = 'individu' | 'batch';
export type NafsuMakan        = 'Normal' | 'Menurun' | 'Tidak Ada';
export type AktivitasTernak   = 'Normal' | 'Menurun' | 'Tidak Ada';
export type KondisiFeses      = 'Normal' | 'Lembek' | 'Keras' | 'Berdarah' | 'Berlendir' | 'Diare' | 'Lainnya';

// ─── Core Record Type ────────────────────────────────────────────────────────

export type PemeriksaanRecord = {
  /** UUID v4 */
  id: string;

  mode: ModeKesehatan;

  /** Filled when mode === 'individu' */
  livestockId: string | null;

  /** Filled when mode === 'batch' */
  batchId: string | null;

  // ── Required fields ──────────────────────────────────────────────────────
  /** YYYY-MM-DD */
  tanggal: string;
  petugas: string;

  // ── At least one must be non-empty ───────────────────────────────────────
  keluhan: string;
  gejala:  string;

  // ── Clinical observations ────────────────────────────────────────────────
  /** Body temperature in °C; stored as string to preserve user input exactly */
  suhuTubuh:    string;
  nafsuMakan:   NafsuMakan | '';
  aktivitas:    AktivitasTernak | '';
  kondisiFeses: KondisiFeses | '';

  /** Body Condition Score 1–5 */
  bcs: '1' | '2' | '3' | '4' | '5' | '';

  /** Optional live weight in kg */
  bobot: string;

  catatan: string;

  // ── Metadata ──────────────────────────────────────────────────────────────
  status: StatusPemeriksaan;
  /** ISO timestamp */
  createdAt: string;
  updatedAt:  string;
  /**
   * Supabase health_checkup UUID — backfilled by PemeriksaanKesehatan.tsx (KH-002)
   * after createCheckup() succeeds. Undefined for batch-mode records (not stored in DB).
   * Used by KH-003..KH-007 for downstream dual-writes without re-querying Supabase.
   */
  supabaseCheckupId?: string;
};

// ─── Database ────────────────────────────────────────────────────────────────

export const PEMERIKSAAN_DB: PemeriksaanRecord[] = [];

// ─── Accessors ───────────────────────────────────────────────────────────────

export function getPemeriksaan(id: string): PemeriksaanRecord | null {
  return PEMERIKSAAN_DB.find((r) => r.id === id) ?? null;
}

/** Returns all records, newest first. */
export function getPemeriksaanList(): PemeriksaanRecord[] {
  return [...PEMERIKSAAN_DB].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getPemeriksaanByLivestock(livestockId: string): PemeriksaanRecord[] {
  return PEMERIKSAAN_DB
    .filter((r) => r.livestockId === livestockId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPemeriksaanByBatch(batchId: string): PemeriksaanRecord[] {
  return PEMERIKSAAN_DB
    .filter((r) => r.batchId === batchId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export type CreatePemeriksaanInput = Omit<PemeriksaanRecord, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

/**
 * Creates a new Draft pemeriksaan.
 * After creation, callers navigate to KH-003 (/kesehatan-hewan/diagnosa/:id)
 * which upgrades status to 'Siap Diagnosa'.
 */
export function addPemeriksaan(input: CreatePemeriksaanInput): string {
  const now = new Date().toISOString();
  const record: PemeriksaanRecord = {
    ...input,
    id:        generateUUID(),
    status:    'Draft',
    createdAt: now,
    updatedAt:  now,
  };
  PEMERIKSAAN_DB.push(record);
  // Log to KH Timeline (MAJ-002 — mirrors PAKAN_TIMELINE_LOG pattern).
  addKHTimelineEvent({
    type:       'pemeriksaan_created',
    recordId:   record.id,
    targetKind: input.mode,
    targetId:   input.livestockId ?? input.batchId ?? null,
    tanggal:    input.tanggal,
    notes:      null,
  });
  return record.id;
}

/** Upgrade a Draft to Siap Diagnosa (called by KH-003). */
export function markSiapDiagnosa(id: string): boolean {
  const idx = PEMERIKSAAN_DB.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  PEMERIKSAAN_DB[idx] = {
    ...PEMERIKSAAN_DB[idx],
    status:    'Siap Diagnosa',
    updatedAt:  new Date().toISOString(),
  };
  return true;
}

/**
 * Backfill the Supabase health_checkup UUID on an in-memory record.
 * Called by PemeriksaanKesehatan.tsx (KH-002) after createCheckup() succeeds.
 * This lets downstream pages (KH-003..KH-007) dual-write to Supabase without
 * re-querying the DB — they read pemeriksaan.supabaseCheckupId when available.
 */
export function setPemeriksaanSupabaseId(localId: string, supabaseCheckupId: string): void {
  const idx = PEMERIKSAAN_DB.findIndex((r) => r.id === localId);
  if (idx !== -1) {
    PEMERIKSAAN_DB[idx] = { ...PEMERIKSAAN_DB[idx], supabaseCheckupId };
  }
}
