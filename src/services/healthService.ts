// ─── Health Service — FLOW-003M2 ─────────────────────────────────────────────
//
// Business logic layer for the Health module.
// All mutations must go through this service — never call the repository
// directly from pages or hooks.
//
// Rules:
//  - No React imports.
//  - Validation is synchronous; persistence is async.
//  - Supabase is SSOT; callers must call refresh() (from useHealth) after any mutation.
//  - Batch-mode health records are not yet stored in Supabase (schema limitation:
//    health_checkups requires livestock_id NOT NULL). They remain in-memory via
//    the existing data layer until a batch_health_checkups table is added.

import type {
  HealthCheckupCreateInput,
  HealthTreatmentCreateInput,
  HealthControlScheduleCreateInput,
  HealthCheckupDbRow,
  HealthTreatmentDbRow,
  HealthControlScheduleDbRow,
} from '../types/health';

import {
  repoInsertCheckup,
  repoPatchCheckup,
  repoInsertTreatment,
  repoInsertTreatments,
  repoInsertControlSchedule,
  repoPatchControlSchedule,
  repoCompleteControlSchedule,
  HealthRepoError,
} from '../repositories/healthRepository';

// ─── Error type ───────────────────────────────────────────────────────────────

export class HealthServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HealthServiceError';
  }
}

// ─── Service result ───────────────────────────────────────────────────────────

export type HealthServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function ok<T>(data: T): HealthServiceResult<T> {
  return { ok: true, data };
}

function fail<T>(message: string): HealthServiceResult<T> {
  return { ok: false, error: message };
}

// ─── Service input types ──────────────────────────────────────────────────────
// These use Indonesian field names matching the existing in-memory PemeriksaanRecord
// so callers (pages and the future useHealth hook) don't need to know about DB column names.

/**
 * UI-facing input for creating a health checkup.
 * Only supports individu (single livestock) mode.
 * Batch mode remains in-memory until a batch_health_checkups DB table is added.
 */
export interface CreateCheckupInput {
  /** FK → livestock.id */
  livestockId: string;
  /** YYYY-MM-DD */
  tanggal: string;
  /** Name of the examiner (petugas lapangan, dokter hewan, peternak) */
  petugas: string;
  /** 'Dokter Hewan' | 'Petugas Lapangan' | 'Peternak' | null */
  petugasTipe?: string | null;
  /** Keluhan from the farmer */
  keluhan: string;
  /** Gejala observed by examiner */
  gejala: string;
  /** Body temperature string e.g. "38.5" — parsed to number */
  suhuTubuh?: string;
  /** Body Condition Score 1–5 — stored as integer */
  bcs?: '1' | '2' | '3' | '4' | '5' | '';
  /** Live weight in kg string e.g. "150" — parsed to number */
  bobot?: string;
  /** Nafsu makan observation */
  nafsuMakan?: string;
  /** Aktivitas observation */
  aktivitas?: string;
  /** Kondisi feses observation */
  kondisiFeses?: string;
  /** Health status outcome */
  healthStatus?: string;
  /** Free-form notes */
  catatan?: string;
  /** FK → auth.users.id — null when submitted by an unauthenticated path */
  recordedBy?: string | null;
}

/**
 * UI-facing input for updating a checkup's diagnosis result.
 * Called after KH-003 (Diagnosa) is completed.
 */
export interface UpdateCheckupDiagnosisInput {
  checkupId: string;
  /** Diagnosis text (from DiagnosaRecord.namaDiagnosa or namaPenyakit) */
  diagnosis: string;
  /** Recommendations / tindakan summary */
  recommendations?: string | null;
  /** YYYY-MM-DD — next follow-up date */
  followUpDate?: string | null;
}

/**
 * UI-facing input for recording a health treatment.
 */
export interface RecordTreatmentInput {
  /** FK → livestock.id */
  livestockId: string;
  /** FK → health_checkups.id — null for standalone treatments */
  checkupId?: string | null;
  /** YYYY-MM-DD */
  tanggal: string;
  /**
   * treatment_type_enum values:
   *   'Vaksinasi' | 'Pengobatan' | 'Tindakan Medis' | 'Pencegahan' | 'Suplemen' | 'Lainnya'
   */
  tipe: string;
  /** Drug name (namaProduk) — null for non-drug treatments */
  namaObat?: string | null;
  /** FK → drug_catalog.id — null when using free-text drug name */
  drugId?: string | null;
  /** Dosage string e.g. "5 mL" */
  dosis?: string | null;
  /** Route of administration e.g. "Oral", "Injeksi Intramuskular" */
  caraPemberian?: string | null;
  /** Duration in days */
  lamaPemberian?: number | null;
  /** YYYY-MM-DD — next treatment date */
  tanggalBerikutnya?: string | null;
  /** Cost in IDR */
  biaya?: number | null;
  /** Veterinarian name */
  dokterHewan?: string | null;
  /** Free-form notes */
  catatan?: string | null;
  /** FK → auth.users.id */
  recordedBy?: string | null;
}

/**
 * UI-facing input for scheduling a health control follow-up.
 */
export interface ScheduleControlInput {
  /** FK → livestock.id — null when schedule is for a batch */
  livestockId?: string | null;
  /** FK → batches.id — null when schedule is for an individual */
  batchId?: string | null;
  /** 'Kontrol Rutin' | 'Kontrol Pasca Pengobatan' | 'Vaksinasi' | 'Pemeriksaan Berkala' | 'Lainnya' */
  tipe?: string | null;
  /** YYYY-MM-DD */
  tanggal: string;
  /** Free-form notes */
  catatan?: string | null;
  /** FK → auth.users.id */
  createdBy?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts a string representation of temperature/weight to a number.
 * Returns null for empty, undefined, or non-numeric strings.
 */
function parseNullableFloat(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const n = parseFloat(value.replace(',', '.'));
  return isNaN(n) ? null : n;
}

/**
 * Converts a BCS string ('1'–'5') to an integer.
 * Returns null for empty or undefined.
 */
function parseBcs(value: string | undefined): number | null {
  if (!value || value === '') return null;
  const n = parseInt(value, 10);
  return isNaN(n) ? null : n;
}

/**
 * Builds a `findings` text from the keluhan + gejala fields.
 * Stored as a single text column in the DB; the UI separates them on read.
 */
function buildFindings(keluhan: string, gejala: string): string {
  const parts: string[] = [];
  if (keluhan.trim()) parts.push(`Keluhan: ${keluhan.trim()}`);
  if (gejala.trim()) parts.push(`Gejala: ${gejala.trim()}`);
  return parts.join('\n');
}

/**
 * Builds `notes` text from clinical observations (nafsuMakan, aktivitas, kondisiFeses, catatan).
 */
function buildNotes(
  nafsuMakan?: string,
  aktivitas?: string,
  kondisiFeses?: string,
  catatan?: string,
): string | null {
  const parts: string[] = [];
  if (nafsuMakan && nafsuMakan !== 'Normal') parts.push(`Nafsu Makan: ${nafsuMakan}`);
  if (aktivitas && aktivitas !== 'Normal') parts.push(`Aktivitas: ${aktivitas}`);
  if (kondisiFeses && kondisiFeses !== 'Normal') parts.push(`Kondisi Feses: ${kondisiFeses}`);
  if (catatan?.trim()) parts.push(catatan.trim());
  return parts.length > 0 ? parts.join('\n') : null;
}

// ─── Health Checkup CRUD ──────────────────────────────────────────────────────

/**
 * Create a new health checkup for an individual livestock.
 *
 * Only individu (single livestock) mode is supported here.
 * Batch health checkups are not persisted to Supabase (schema limitation).
 *
 * The checkup status starts without a diagnosis — callers should call
 * updateCheckupDiagnosis() after KH-003 is completed.
 */
export async function createCheckup(
  workspaceId: string,
  input: CreateCheckupInput,
): Promise<HealthServiceResult<HealthCheckupDbRow>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (!input.livestockId) return fail('ID ternak diperlukan.');
  if (!input.tanggal) return fail('Tanggal pemeriksaan diperlukan.');
  if (!input.petugas?.trim()) return fail('Nama petugas diperlukan.');
  if (!input.keluhan?.trim() && !input.gejala?.trim()) {
    return fail('Keluhan atau gejala wajib diisi.');
  }

  const dbInput: HealthCheckupCreateInput = {
    livestock_id:        input.livestockId,
    workspace_id:        workspaceId,
    checkup_date:        input.tanggal,
    examiner:            input.petugas.trim(),
    examiner_type:       input.petugasTipe ?? null,
    temperature:         parseNullableFloat(input.suhuTubuh),
    weight_kg:           parseNullableFloat(input.bobot),
    body_condition_score: parseBcs(input.bcs),
    health_status:       input.healthStatus ?? 'Sakit',
    findings:            buildFindings(input.keluhan, input.gejala),
    diagnosis:           null, // set later via updateCheckupDiagnosis
    recommendations:     null, // set later via updateCheckupDiagnosis
    follow_up_date:      null,
    notes:               buildNotes(input.nafsuMakan, input.aktivitas, input.kondisiFeses, input.catatan),
    recorded_by:         input.recordedBy ?? null,
  };

  try {
    const row = await repoInsertCheckup(dbInput);
    return ok(row);
  } catch (err) {
    const msg = err instanceof HealthRepoError ? err.message : 'Gagal menyimpan pemeriksaan.';
    return fail(msg);
  }
}

/**
 * Update a checkup with diagnosis information.
 * Called after KH-003 (Diagnosa) is completed.
 */
export async function updateCheckupDiagnosis(
  input: UpdateCheckupDiagnosisInput,
): Promise<HealthServiceResult<HealthCheckupDbRow | null>> {
  if (!input.checkupId) return fail('ID pemeriksaan diperlukan.');
  if (!input.diagnosis?.trim()) return fail('Diagnosa diperlukan.');

  try {
    const row = await repoPatchCheckup(input.checkupId, {
      diagnosis:       input.diagnosis.trim(),
      recommendations: input.recommendations ?? null,
      follow_up_date:  input.followUpDate ?? null,
    });
    return ok(row);
  } catch (err) {
    const msg = err instanceof HealthRepoError ? err.message : 'Gagal menyimpan diagnosa.';
    return fail(msg);
  }
}

/**
 * Update the health_status field on a checkup (e.g. after treatment).
 */
export async function updateCheckupHealthStatus(
  checkupId: string,
  healthStatus: string,
): Promise<HealthServiceResult<HealthCheckupDbRow | null>> {
  if (!checkupId) return fail('ID pemeriksaan diperlukan.');
  if (!healthStatus) return fail('Status kesehatan diperlukan.');

  try {
    const row = await repoPatchCheckup(checkupId, { health_status: healthStatus });
    return ok(row);
  } catch (err) {
    const msg = err instanceof HealthRepoError ? err.message : 'Gagal memperbarui status kesehatan.';
    return fail(msg);
  }
}

// ─── Health Treatment CRUD ────────────────────────────────────────────────────

/**
 * Record a single health treatment for a livestock.
 * Called from KH-004 (Tindakan) or KH-005 (Pengobatan).
 */
export async function recordTreatment(
  workspaceId: string,
  input: RecordTreatmentInput,
): Promise<HealthServiceResult<HealthTreatmentDbRow>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (!input.livestockId) return fail('ID ternak diperlukan.');
  if (!input.tanggal) return fail('Tanggal tindakan diperlukan.');
  if (!input.tipe) return fail('Tipe tindakan diperlukan.');

  const dbInput: HealthTreatmentCreateInput = {
    livestock_id:        input.livestockId,
    workspace_id:        workspaceId,
    checkup_id:          input.checkupId ?? null,
    treatment_date:      input.tanggal,
    treatment_type:      input.tipe,
    drug_id:             input.drugId ?? null,
    drug_name:           input.namaObat ?? null,
    dosage:              input.dosis ?? null,
    route:               input.caraPemberian ?? null,
    duration_days:       input.lamaPemberian ?? null,
    next_treatment_date: input.tanggalBerikutnya ?? null,
    cost:                input.biaya ?? null,
    veterinarian:        input.dokterHewan ?? null,
    notes:               input.catatan ?? null,
    recorded_by:         input.recordedBy ?? null,
  };

  try {
    const row = await repoInsertTreatment(dbInput);
    return ok(row);
  } catch (err) {
    const msg = err instanceof HealthRepoError ? err.message : 'Gagal menyimpan tindakan.';
    return fail(msg);
  }
}

/**
 * Record multiple health treatments in one atomic round-trip.
 * Used when a tindakan sesi has multiple items.
 * All items succeed or all fail.
 */
export async function recordTreatments(
  workspaceId: string,
  inputs: RecordTreatmentInput[],
): Promise<HealthServiceResult<HealthTreatmentDbRow[]>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (inputs.length === 0) return ok([]);

  const invalid = inputs.find((i) => !i.livestockId || !i.tanggal || !i.tipe);
  if (invalid) return fail('Setiap tindakan memerlukan ID ternak, tanggal, dan tipe.');

  const dbInputs: HealthTreatmentCreateInput[] = inputs.map((input) => ({
    livestock_id:        input.livestockId,
    workspace_id:        workspaceId,
    checkup_id:          input.checkupId ?? null,
    treatment_date:      input.tanggal,
    treatment_type:      input.tipe,
    drug_id:             input.drugId ?? null,
    drug_name:           input.namaObat ?? null,
    dosage:              input.dosis ?? null,
    route:               input.caraPemberian ?? null,
    duration_days:       input.lamaPemberian ?? null,
    next_treatment_date: input.tanggalBerikutnya ?? null,
    cost:                input.biaya ?? null,
    veterinarian:        input.dokterHewan ?? null,
    notes:               input.catatan ?? null,
    recorded_by:         input.recordedBy ?? null,
  }));

  try {
    const rows = await repoInsertTreatments(dbInputs);
    return ok(rows);
  } catch (err) {
    const msg = err instanceof HealthRepoError ? err.message : 'Gagal menyimpan tindakan.';
    return fail(msg);
  }
}

// ─── Health Control Schedule CRUD ─────────────────────────────────────────────

/**
 * Schedule a health control follow-up for a livestock or batch.
 * Called from KH-007 (Kontrol) when statusHasil requires a jadwal.
 */
export async function scheduleControl(
  workspaceId: string,
  input: ScheduleControlInput,
): Promise<HealthServiceResult<HealthControlScheduleDbRow>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (!input.livestockId && !input.batchId) {
    return fail('ID ternak atau batch diperlukan.');
  }
  if (!input.tanggal) return fail('Tanggal kontrol diperlukan.');

  const dbInput: HealthControlScheduleCreateInput = {
    workspace_id:   workspaceId,
    livestock_id:   input.livestockId ?? null,
    batch_id:       input.batchId ?? null,
    schedule_type:  input.tipe ?? 'Kontrol Rutin',
    scheduled_date: input.tanggal,
    status:         'Terjadwal',
    notes:          input.catatan ?? null,
    created_by:     input.createdBy ?? null,
  };

  try {
    const row = await repoInsertControlSchedule(dbInput);
    return ok(row);
  } catch (err) {
    const msg = err instanceof HealthRepoError ? err.message : 'Gagal menjadwalkan kontrol.';
    return fail(msg);
  }
}

/**
 * Mark a scheduled control as completed.
 * Called when a KontrolRecord with statusHasil 'Sembuh' or 'Meninggal' is saved.
 */
export async function completeControl(
  scheduleId: string,
  notes?: string | null,
): Promise<HealthServiceResult<HealthControlScheduleDbRow | null>> {
  if (!scheduleId) return fail('ID jadwal kontrol diperlukan.');

  try {
    await repoCompleteControlSchedule(scheduleId);
    if (notes != null) {
      const row = await repoPatchControlSchedule(scheduleId, { status: 'Selesai', notes });
      return ok(row);
    }
    return ok(null);
  } catch (err) {
    const msg = err instanceof HealthRepoError ? err.message : 'Gagal menyelesaikan kontrol.';
    return fail(msg);
  }
}

/**
 * Cancel a scheduled control (e.g. livestock archived before control date).
 */
export async function cancelControl(
  scheduleId: string,
  reason?: string | null,
): Promise<HealthServiceResult<void>> {
  if (!scheduleId) return fail('ID jadwal kontrol diperlukan.');

  try {
    await repoPatchControlSchedule(scheduleId, {
      status: 'Dibatalkan',
      notes:  reason ?? null,
    });
    return ok(undefined);
  } catch (err) {
    const msg = err instanceof HealthRepoError ? err.message : 'Gagal membatalkan jadwal kontrol.';
    return fail(msg);
  }
}
