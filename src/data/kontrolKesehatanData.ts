/**
 * kontrolKesehatanData.ts
 * ─────────────────────────────────────────────────────────────────
 * Source-of-truth for Kontrol Kesehatan (KH-007).
 *
 * A health case (kasus) can have multiple KontrolRecords.
 * Kasus status is derived from the last kontrol's statusHasil.
 *
 * Architecture:
 *  - KontrolRecord  — one evaluation entry per control visit
 *  - JadwalKontrol  — optional next follow-up schedule (embedded in record)
 *
 * Relationship chain:
 *   TindakanSesi → KontrolRecord[]
 *
 * Status lifecycle (kasus):
 *   (no records)                     → 'Aktif' (first kontrol not yet done)
 *   last.statusHasil === 'Sembuh'    → 'Selesai' (workflow closed)
 *   last.statusHasil === 'Meninggal' → 'Ditutup' (workflow closed)
 *   otherwise                        → 'Aktif'
 *
 * Validation rules:
 *   - No new kontrol allowed when kasus is 'Selesai' or 'Ditutup'
 *   - JadwalKontrol only allowed when statusHasil requires follow-up
 *   - 'Sembuh' and 'Meninggal' must NOT have a jadwal
 */

import { generateUUID } from '../utils/uuid';
import { addKHTimelineEvent } from './kesehatanTimelineData';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusHasilKontrol =
  | 'Sembuh'
  | 'Masih Perawatan'
  | 'Perlu Kontrol'
  | 'Perlu Isolasi'
  | 'Meninggal';

export type StatusKasus = 'Aktif' | 'Selesai' | 'Ditutup';

export type JadwalKontrol = {
  /** YYYY-MM-DD */
  tanggal: string;
  /** HH:MM (24h) */
  jam: string;
  catatan: string;
};

export type KontrolRecord = {
  /** UUID v4 */
  uuid: string;

  /** Links to TindakanSesi.id — the :id param in /kesehatan-hewan/kontrol/:id */
  tindakanSesiId: string;

  /** Denormalized from TindakanSesi for easy querying */
  pemeriksaanId: string;

  // ── Required fields ──────────────────────────────────────────────────────────
  /** YYYY-MM-DD */
  tanggal: string;
  petugas: string;
  kondisiSaatIni: string;
  nafsuMakan: 'Normal' | 'Menurun' | 'Tidak Ada';
  aktivitas: 'Normal' | 'Menurun' | 'Tidak Ada';

  // ── Optional clinical observations ───────────────────────────────────────────
  /** Body temperature in °C; empty string = not recorded */
  suhuTubuh: string;
  /** Body Condition Score 1–5; empty string = not recorded */
  bcs: '1' | '2' | '3' | '4' | '5' | '';
  /** Live weight in kg; empty string = not recorded */
  bobot: string;

  catatanPerkembangan: string;

  // ── Outcome ──────────────────────────────────────────────────────────────────
  statusHasil: StatusHasilKontrol;

  /** Only set when statusHasil requires follow-up (not Sembuh/Meninggal). */
  jadwalKontrol: JadwalKontrol | null;

  /** ISO timestamp */
  createdAt: string;

  /**
   * Supabase health_control_schedules UUID — backfilled when scheduleControl()
   * succeeds (fire-and-forget). Undefined for records without a jadwal, or
   * when the Supabase write failed/workspace unauthenticated.
   * Used by the NEXT kontrol visit to call completeControl/cancelControl.
   */
  supabaseScheduleId?: string;
};

// ─── In-memory Store ──────────────────────────────────────────────────────────

export const KONTROL_RECORDS: KontrolRecord[] = [];

// ─── Accessors ────────────────────────────────────────────────────────────────

/** All kontrol records for a tindakanSesi, newest first. */
export function getKontrolBySesi(tindakanSesiId: string): KontrolRecord[] {
  return KONTROL_RECORDS
    .filter((r) => r.tindakanSesiId === tindakanSesiId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getKontrolById(uuid: string): KontrolRecord | undefined {
  return KONTROL_RECORDS.find((r) => r.uuid === uuid);
}

/**
 * Derives the current status of a health case from its kontrol records.
 * - No records              → 'Aktif' (first kontrol not yet done)
 * - Last kontrol = Sembuh   → 'Selesai'
 * - Last kontrol = Meninggal → 'Ditutup'
 * - Otherwise               → 'Aktif'
 */
export function getKasusStatus(tindakanSesiId: string): StatusKasus {
  const records = getKontrolBySesi(tindakanSesiId);
  if (records.length === 0) return 'Aktif';
  const last = records[0]; // newest first
  if (last.statusHasil === 'Sembuh') return 'Selesai';
  if (last.statusHasil === 'Meninggal') return 'Ditutup';
  return 'Aktif';
}

/** Returns the most recent jadwal kontrol for a sesi, or null if none. */
export function getJadwalTerakhir(tindakanSesiId: string): JadwalKontrol | null {
  for (const r of getKontrolBySesi(tindakanSesiId)) {
    if (r.jadwalKontrol) return r.jadwalKontrol;
  }
  return null;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/** Returns true if a new kontrol can be added (kasus not closed). */
export function canAddKontrol(tindakanSesiId: string): boolean {
  return getKasusStatus(tindakanSesiId) === 'Aktif';
}

/** Returns true if the given statusHasil requires a jadwal (follow-up). */
export function statusNeedsJadwal(statusHasil: StatusHasilKontrol): boolean {
  return statusHasil !== 'Sembuh' && statusHasil !== 'Meninggal';
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type AddKontrolInput = Omit<KontrolRecord, 'uuid' | 'createdAt'>;

/**
 * Backfill the Supabase health_control_schedules UUID on a KontrolRecord.
 * Called by KontrolKesehatan.tsx after scheduleControl() succeeds.
 * This lets the NEXT kontrol visit call completeControl/cancelControl
 * without re-querying Supabase.
 */
export function setKontrolSupabaseScheduleId(uuid: string, supabaseScheduleId: string): void {
  const idx = KONTROL_RECORDS.findIndex((r) => r.uuid === uuid);
  if (idx !== -1) {
    KONTROL_RECORDS[idx] = { ...KONTROL_RECORDS[idx], supabaseScheduleId };
  }
}

/**
 * Adds a new kontrol record for a health case.
 * Callers MUST verify canAddKontrol() before calling.
 */
export function addKontrol(input: AddKontrolInput): KontrolRecord {
  const record: KontrolRecord = {
    ...input,
    uuid:      generateUUID(),
    createdAt: new Date().toISOString(),
  };
  KONTROL_RECORDS.push(record);
  // Log to KH Timeline (MAJ-002 — mirrors PAKAN_TIMELINE_LOG pattern).
  addKHTimelineEvent({
    type:       'kontrol_completed',
    recordId:   record.uuid,
    targetKind: 'unknown',
    targetId:   input.tindakanSesiId,
    tanggal:    input.tanggal,
    notes:      input.statusHasil,
  });
  return record;
}
