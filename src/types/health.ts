// ─── Health Module DB Row Types — FLOW-003M1 ─────────────────────────────────
//
// Typed representations of Supabase table rows for the Health module.
// These mirror the schema defined in:
//   supabase/migrations/20260725000006_health_reproduction.sql
//
// Rules:
//  - These types are ONLY for the repository layer.
//  - Pages and services use the existing in-memory types from src/data/.
//  - healthRepository.ts converts between DB rows and in-memory types.
//  - Never import these directly from pages or components.

// ─── health_checkups ─────────────────────────────────────────────────────────
// Maps to: Pemeriksaan (KH-002) + embedded Diagnosa (KH-003)

export interface HealthCheckupDbRow {
  /** UUID v4 — server-generated */
  id: string;
  /** FK → livestock.id — NOT NULL */
  livestock_id: string;
  /** FK → workspaces.id — NOT NULL */
  workspace_id: string;
  /** YYYY-MM-DD — date of examination */
  checkup_date: string;
  /** Name of the examiner (petugas) */
  examiner: string | null;
  /** 'Dokter Hewan' | 'Petugas Lapangan' | 'Peternak' | etc. */
  examiner_type: string | null;
  /** Body temperature in °C */
  temperature: number | null;
  /** Live weight in kg at time of checkup */
  weight_kg: number | null;
  /** Body Condition Score 1–9 (DB allows 1–9; UI uses 1–5) */
  body_condition_score: number | null;
  /** health_status_enum: 'Sehat' | 'Sakit' | 'Dalam Perawatan' | 'Karantina' | 'Pemantauan' */
  health_status: string;
  /** Clinical findings / keluhan + gejala summary */
  findings: string | null;
  /** Diagnosis text (denormalized from KH-003 DiagnosaRecord) */
  diagnosis: string | null;
  /** Recommendations / tindakan summary */
  recommendations: string | null;
  /** YYYY-MM-DD — next follow-up date */
  follow_up_date: string | null;
  /** Free-form notes */
  notes: string | null;
  /** FK → auth.users.id */
  recorded_by: string | null;
  /** ISO timestamp */
  created_at: string;
}

export type HealthCheckupCreateInput = Omit<HealthCheckupDbRow, 'id' | 'created_at'>;

export type HealthCheckupPatchInput = Partial<
  Pick<
    HealthCheckupDbRow,
    | 'health_status'
    | 'findings'
    | 'diagnosis'
    | 'recommendations'
    | 'follow_up_date'
    | 'notes'
  >
>;

// ─── health_treatments ───────────────────────────────────────────────────────
// Maps to: TindakanItem (KH-004) and/or PengobatanItem (KH-005)
// treatment_type_enum determines which in-memory type it maps to.

export interface HealthTreatmentDbRow {
  /** UUID v4 — server-generated */
  id: string;
  /** FK → livestock.id — NOT NULL */
  livestock_id: string;
  /** FK → workspaces.id — NOT NULL */
  workspace_id: string;
  /** FK → health_checkups.id — nullable if treatment is standalone */
  checkup_id: string | null;
  /** YYYY-MM-DD */
  treatment_date: string;
  /**
   * treatment_type_enum:
   *   'Vaksinasi' | 'Pengobatan' | 'Tindakan Medis' | 'Pencegahan' | 'Suplemen' | 'Lainnya'
   * 'Pengobatan' → maps to PengobatanItem
   * Others      → maps to TindakanItem
   */
  treatment_type: string;
  /** FK → drug_catalog.id — null for non-drug treatments */
  drug_id: string | null;
  /** Denormalized drug name (or treatment name) */
  drug_name: string | null;
  /** Dosage string e.g. "5 mL" */
  dosage: string | null;
  /** Route of administration e.g. "Oral", "Injeksi Intramuskular" */
  route: string | null;
  /** Duration in days */
  duration_days: number | null;
  /** YYYY-MM-DD — next treatment date */
  next_treatment_date: string | null;
  /** Cost in IDR (smallest integer, no decimal) */
  cost: number | null;
  /** Veterinarian name */
  veterinarian: string | null;
  /** Free-form notes */
  notes: string | null;
  /** FK → auth.users.id */
  recorded_by: string | null;
  /** ISO timestamp */
  created_at: string;
}

export type HealthTreatmentCreateInput = Omit<HealthTreatmentDbRow, 'id' | 'created_at'>;

// ─── health_control_schedules ─────────────────────────────────────────────────
// Maps to: KontrolRecord (KH-007) and JadwalKontrol

export interface HealthControlScheduleDbRow {
  /** UUID v4 — server-generated */
  id: string;
  /** FK → workspaces.id — NOT NULL */
  workspace_id: string;
  /** FK → livestock.id — null when schedule is for a whole batch */
  livestock_id: string | null;
  /** FK → batches.id — null when schedule is for an individual animal */
  batch_id: string | null;
  /** 'Kontrol Rutin' | 'Kontrol Pasca Pengobatan' | 'Vaksinasi' | 'Pemeriksaan Berkala' | 'Lainnya' */
  schedule_type: string | null;
  /** YYYY-MM-DD */
  scheduled_date: string;
  /** 'Terjadwal' | 'Selesai' | 'Dibatalkan' */
  status: string | null;
  /** Free-form notes or catatan perkembangan */
  notes: string | null;
  /** FK → auth.users.id */
  created_by: string | null;
  /** ISO timestamp */
  created_at: string;
}

export type HealthControlScheduleCreateInput = Omit<HealthControlScheduleDbRow, 'id' | 'created_at'>;

export type HealthControlSchedulePatchInput = Partial<
  Pick<HealthControlScheduleDbRow, 'status' | 'notes'>
>;
