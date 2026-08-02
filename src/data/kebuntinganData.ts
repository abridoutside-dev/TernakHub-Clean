// ─── RP-006: Kebuntingan (Pregnancy Management) ─────────────────────────────
// Kebuntingan mengelola satu kebuntingan yang SUDAH TERKONFIRMASI hingga
// Kelahiran — modul ini TIDAK mencatat Kelahiran dan TIDAK membuat data anak
// (offspring); itu adalah roadmap RP-007 (Kelahiran) selanjutnya.
//
// Entry requirement: satu Kebuntingan hanya dapat dibuat dari satu Pemeriksaan
// Kebuntingan (RP-005) yang hasilnya "Bunting" — relasi pemeriksaanId bersifat
// 1:1 (satu Pemeriksaan hanya dapat menghasilkan satu Kebuntingan).
//
// Seekor betina (dam) tidak dapat memiliki lebih dari satu Kebuntingan Aktif
// (Kebuntingan Aktif/Berisiko Tinggi/Dalam Observasi) pada saat yang sama —
// divalidasi lintas Program, karena identitas dam bersifat global (livestock id).

import { generateUUID } from '../utils/uuid';
import {
  getProgramById,
  type ReproduksiProgramRecord,
} from './reproduksiProgramData';
import {
  isProgramAktifUntukPelaksanaan as isProgramAktif,
  JENIS_LAMPIRAN_LIST,
  type JenisLampiran,
} from './pelaksanaanReproduksiData';
import {
  getPemeriksaanById,
  getFullTimelineForProgram as getRp005TimelineForProgram,
  type PemeriksaanKebuntinganRecord,
} from './pemeriksaanKebuntinganData';
import {
  KONDISI_LIST,
  type EventType,
  type ReproduksiEvent,
  type KondisiMonitoring,
} from './monitoringReproduksiData';

export { KONDISI_LIST, JENIS_LAMPIRAN_LIST };

// ─── Risk Level ──────────────────────────────────────────────────────────────

export const RISK_LEVEL_LIST = ['Rendah', 'Sedang', 'Tinggi'] as const;
export type RiskLevel = typeof RISK_LEVEL_LIST[number];

// ─── Status Kebuntingan ──────────────────────────────────────────────────────
// Active Pregnancy / High Risk / Under Observation / Aborted / Completed.

export const STATUS_KEBUNTINGAN_LIST = [
  'Kebuntingan Aktif',
  'Berisiko Tinggi',
  'Dalam Observasi',
  'Keguguran',
  'Selesai',
] as const;
export type StatusKebuntingan = typeof STATUS_KEBUNTINGAN_LIST[number];

/** Status akhir (final) — tidak dapat diubah lagi setelah tercapai. */
const FINAL_STATUSES: StatusKebuntingan[] = ['Keguguran', 'Selesai'];

/** Status yang dianggap "sedang berlangsung" — dipakai untuk validasi 1 dam = 1 kebuntingan aktif. */
const ACTIVE_STATUSES: StatusKebuntingan[] = ['Kebuntingan Aktif', 'Berisiko Tinggi', 'Dalam Observasi'];

/** Status yang dapat dipilih langsung lewat form edit (bukan aksi penutupan khusus). */
export const EDITABLE_STATUS_LIST: StatusKebuntingan[] = ['Kebuntingan Aktif', 'Berisiko Tinggi', 'Dalam Observasi'];

export function isStatusFinal(status: StatusKebuntingan): boolean {
  return FINAL_STATUSES.includes(status);
}

/**
 * Pesan tindak lanjut — murni informasional, tidak memicu perubahan data otomatis:
 *  - Selesai   → lanjutan pencatatan Kelahiran adalah roadmap RP-007 (belum diimplementasikan).
 *  - Keguguran → Kebuntingan ditutup, tidak ada Kelahiran yang dibuat.
 */
export function followUpMessageForStatus(status: StatusKebuntingan): string | null {
  switch (status) {
    case 'Selesai':
      return 'Kebuntingan selesai — pencatatan Kelahiran akan tersedia pada roadmap Kelahiran (RP-007).';
    case 'Keguguran':
      return 'Kebuntingan ditutup karena keguguran. Tidak ada data Kelahiran yang dibuat.';
    default:
      return null;
  }
}

// ─── Kebuntingan Record ───────────────────────────────────────────────────────

export type KebuntinganRecord = {
  id: string;                        // UUID v4 — juga dipakai sebagai basis Event UUID (Pregnancy Confirmed)
  programId: string;                 // relasi ke ReproduksiProgramRecord.id
  pemeriksaanId: string;             // relasi ke PemeriksaanKebuntinganRecord.id (RP-005) — asal Kebuntingan ini, 1:1
  damId: string;                      // livestock id betina — harus anggota program.betinaIds
  tanggalKawinPerkiraan: string;      // Estimated Mating Date, yyyy-mm-dd
  usiaKebuntinganPerkiraan: string | null; // Estimated Pregnancy Age, opsional, mis. "8 minggu"
  tanggalLahirPerkiraan: string;      // Estimated Due Date, yyyy-mm-dd — harus setelah tanggalKawinPerkiraan
  status: StatusKebuntingan;
  riskLevel: RiskLevel;
  catatan: string | null;
  riskUpdatedDate: string | null;     // tanggal terakhir riskLevel berubah — basis Event "Pregnancy Risk Updated"
  completedDate: string | null;
  abortedDate: string | null;
  createdDate: string;
  updatedDate: string;
};

export type KebuntinganInput = {
  tanggalKawinPerkiraan: string;
  usiaKebuntinganPerkiraan: string | null;
  tanggalLahirPerkiraan: string;
  riskLevel: RiskLevel;
  status: StatusKebuntingan;          // hanya EDITABLE_STATUS_LIST yang valid lewat form edit umum
  catatan: string | null;
};

// ─── Registry (empty — populated at runtime) ────────────────────────────────

export const KEBUNTINGAN_DB: Record<string, KebuntinganRecord> = {};

// ─── Validasi ────────────────────────────────────────────────────────────────

function validateTanggal(input: { tanggalKawinPerkiraan: string; tanggalLahirPerkiraan: string }): string | null {
  if (!input.tanggalKawinPerkiraan) return 'Estimasi Tanggal Kawin wajib diisi.';
  if (!input.tanggalLahirPerkiraan) return 'Estimasi Tanggal Lahir wajib diisi.';
  if (input.tanggalLahirPerkiraan <= input.tanggalKawinPerkiraan) {
    return 'Estimasi Tanggal Lahir harus setelah Estimasi Tanggal Kawin.';
  }
  return null;
}

/** Kebuntingan Aktif/Berisiko Tinggi/Dalam Observasi milik dam ini, di Program manapun (identitas dam bersifat global). */
export function getActivePregnancyForDam(damId: string, excludeId?: string): KebuntinganRecord | null {
  return Object.values(KEBUNTINGAN_DB).find(
    (k) => k.damId === damId && k.id !== excludeId && ACTIVE_STATUSES.includes(k.status),
  ) ?? null;
}

export function getPregnancyByExaminationId(pemeriksaanId: string): KebuntinganRecord | null {
  return Object.values(KEBUNTINGAN_DB).find((k) => k.pemeriksaanId === pemeriksaanId) ?? null;
}

/**
 * Validasi lengkap sebelum membuat Kebuntingan: Program harus aktif, Pemeriksaan
 * Kebuntingan harus ada, milik Program yang sama, hasilnya "Bunting", dan belum
 * pernah menghasilkan Kebuntingan lain (1:1). Dam harus anggota betina Program,
 * dan belum memiliki Kebuntingan aktif lain. Throws dengan pesan siap tampil ke user.
 */
export function validateKebuntinganBaru(
  programId: string,
  pemeriksaanId: string,
  damId: string,
  input: { tanggalKawinPerkiraan: string; tanggalLahirPerkiraan: string },
): { program: ReproduksiProgramRecord; pemeriksaan: PemeriksaanKebuntinganRecord } {
  const program = getProgramById(programId);
  if (!program) throw new Error('Program Reproduksi tidak ditemukan.');
  if (!isProgramAktif(program)) {
    throw new Error(`Tidak dapat mencatat Kebuntingan — Program berstatus "${program.status}".`);
  }

  const pemeriksaan = getPemeriksaanById(pemeriksaanId);
  if (!pemeriksaan) throw new Error('Pemeriksaan Kebuntingan tidak ditemukan.');
  if (pemeriksaan.programId !== programId) {
    throw new Error('Pemeriksaan Kebuntingan yang dipilih bukan milik Program ini.');
  }
  if (pemeriksaan.hasil !== 'Bunting') {
    throw new Error('Kebuntingan hanya dapat dibuat dari Pemeriksaan Kebuntingan dengan hasil "Bunting".');
  }
  if (getPregnancyByExaminationId(pemeriksaanId)) {
    throw new Error('Pemeriksaan Kebuntingan ini sudah memiliki data Kebuntingan.');
  }

  if (!damId) throw new Error('Dam (betina) wajib dipilih.');
  // Skip participant check if betinaIds is empty — happens for DB-loaded programs
  // where participant_ids uuid[] has not yet been split into betina/pejantan columns.
  if (program.betinaIds.length > 0 && !program.betinaIds.includes(damId)) {
    throw new Error('Dam yang dipilih bukan peserta betina Program ini.');
  }
  if (getActivePregnancyForDam(damId)) {
    throw new Error('Dam ini sudah memiliki Kebuntingan Aktif — satu dam tidak dapat memiliki lebih dari satu Kebuntingan Aktif.');
  }

  const dateError = validateTanggal(input);
  if (dateError) throw new Error(dateError);

  return { program, pemeriksaan };
}

/**
 * Validasi sebelum mengubah Kebuntingan yang sudah ada: tidak dapat diubah bila
 * sudah berstatus final (Keguguran/Selesai); relasi Program/Pemeriksaan/Dam tidak
 * dapat dipindah lewat edit ini. Status hanya boleh salah satu EDITABLE_STATUS_LIST
 * — transisi ke Keguguran/Selesai wajib lewat abortKebuntingan/completeKebuntingan.
 */
function validateKebuntinganEdit(existing: KebuntinganRecord, input: KebuntinganInput): string | null {
  if (isStatusFinal(existing.status)) {
    return `Kebuntingan sudah berstatus "${existing.status}" — tidak dapat diubah lagi.`;
  }
  if (!EDITABLE_STATUS_LIST.includes(input.status)) {
    return 'Status ini hanya dapat diubah lewat aksi "Akhiri Kebuntingan" (Keguguran/Selesai).';
  }
  return validateTanggal(input);
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

function sortTerbaruKeTerlama(a: KebuntinganRecord, b: KebuntinganRecord): number {
  return a.createdDate < b.createdDate ? 1 : -1;
}

export function getPregnancyListByProgram(programId: string): KebuntinganRecord[] {
  return Object.values(KEBUNTINGAN_DB)
    .filter((k) => k.programId === programId)
    .sort(sortTerbaruKeTerlama);
}

export function getPregnancyById(id: string): KebuntinganRecord | null {
  return KEBUNTINGAN_DB[id] ?? null;
}

/** Throws with a user-facing message when validation fails. Entry point: satu Pemeriksaan "Bunting" → satu Kebuntingan. */
export function addKebuntingan(
  programId: string,
  pemeriksaanId: string,
  damId: string,
  input: KebuntinganInput,
): KebuntinganRecord {
  validateKebuntinganBaru(programId, pemeriksaanId, damId, input);

  const today = new Date().toISOString().slice(0, 10);
  const record: KebuntinganRecord = {
    id: generateUUID(),
    programId,
    pemeriksaanId,
    damId,
    tanggalKawinPerkiraan: input.tanggalKawinPerkiraan,
    usiaKebuntinganPerkiraan: input.usiaKebuntinganPerkiraan?.trim() || null,
    tanggalLahirPerkiraan: input.tanggalLahirPerkiraan,
    status: 'Kebuntingan Aktif',
    riskLevel: input.riskLevel,
    catatan: input.catatan?.trim() || null,
    riskUpdatedDate: null,
    completedDate: null,
    abortedDate: null,
    createdDate: today,
    updatedDate: today,
  };
  KEBUNTINGAN_DB[record.id] = record;
  return record;
}

/**
 * Throws with a user-facing message when validation fails. Program/Pemeriksaan/Dam
 * tidak dapat dipindah lewat edit ini. Jika riskLevel berubah, riskUpdatedDate
 * dibarui — ini menjadi basis Event "Pregnancy Risk Updated" pada Timeline.
 */
export function updateKebuntingan(id: string, input: KebuntinganInput): KebuntinganRecord {
  const existing = KEBUNTINGAN_DB[id];
  if (!existing) throw new Error('Kebuntingan tidak ditemukan.');

  const error = validateKebuntinganEdit(existing, input);
  if (error) throw new Error(error);

  const today = new Date().toISOString().slice(0, 10);
  const riskChanged = input.riskLevel !== existing.riskLevel;

  const updated: KebuntinganRecord = {
    ...existing,
    tanggalKawinPerkiraan: input.tanggalKawinPerkiraan,
    usiaKebuntinganPerkiraan: input.usiaKebuntinganPerkiraan?.trim() || null,
    tanggalLahirPerkiraan: input.tanggalLahirPerkiraan,
    status: input.status,
    riskLevel: input.riskLevel,
    catatan: input.catatan?.trim() || null,
    riskUpdatedDate: riskChanged ? today : existing.riskUpdatedDate,
    updatedDate: today,
  };
  KEBUNTINGAN_DB[id] = updated;
  return updated;
}

/** Akhiri Kebuntingan sebagai Keguguran (Aborted) — final, tidak membuat data Kelahiran/Offspring. */
export function abortKebuntingan(id: string, catatan?: string): KebuntinganRecord {
  const existing = KEBUNTINGAN_DB[id];
  if (!existing) throw new Error('Kebuntingan tidak ditemukan.');
  if (isStatusFinal(existing.status)) {
    throw new Error(`Kebuntingan sudah berstatus "${existing.status}" — tidak dapat diubah lagi.`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const updated: KebuntinganRecord = {
    ...existing,
    status: 'Keguguran',
    abortedDate: today,
    catatan: catatan?.trim() || existing.catatan,
    updatedDate: today,
  };
  KEBUNTINGAN_DB[id] = updated;
  return updated;
}

/** Akhiri Kebuntingan sebagai Selesai (Completed) — final. Tidak membuat Kelahiran/Offspring/Lineage; lanjutan ada di RP-007. */
export function completeKebuntingan(id: string, catatan?: string): KebuntinganRecord {
  const existing = KEBUNTINGAN_DB[id];
  if (!existing) throw new Error('Kebuntingan tidak ditemukan.');
  if (isStatusFinal(existing.status)) {
    throw new Error(`Kebuntingan sudah berstatus "${existing.status}" — tidak dapat diubah lagi.`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const updated: KebuntinganRecord = {
    ...existing,
    status: 'Selesai',
    completedDate: today,
    catatan: catatan?.trim() || existing.catatan,
    updatedDate: today,
  };
  KEBUNTINGAN_DB[id] = updated;
  return updated;
}

// ─── Kebuntingan Monitoring ───────────────────────────────────────────────────
// Berbeda dari Monitoring generik (RP-004) — field khusus kebuntingan (berat
// badan, BCS). Mendukung banyak record per Kebuntingan. Setiap record yang
// disimpan = tepat satu Event "Pregnancy Monitoring" pada Timeline.

export type LampiranKebuntinganMonitoring = {
  id: string;
  jenis: JenisLampiran;
  namaFile: string;
};

export type KebuntinganMonitoringRecord = {
  id: string;                  // UUID v4 — juga berfungsi sebagai Event UUID
  kebuntinganId: string;       // relasi ke KebuntinganRecord.id
  tanggal: string;              // yyyy-mm-dd
  petugas: string;
  kondisi: KondisiMonitoring;   // reuse enum RP-004
  beratBadan: number | null;    // Body Weight, opsional
  bcs: number | null;           // Body Condition Score, opsional
  catatan: string | null;
  lampiran: LampiranKebuntinganMonitoring[];
  createdDate: string;
};

export type KebuntinganMonitoringInput = {
  tanggal: string;
  petugas: string;
  kondisi: KondisiMonitoring;
  beratBadan: number | null;
  bcs: number | null;
  catatan: string | null;
  lampiran: LampiranKebuntinganMonitoring[];
};

export const KEBUNTINGAN_MONITORING_DB: Record<string, KebuntinganMonitoringRecord> = {};

function validateKebuntinganMonitoringFields(input: KebuntinganMonitoringInput): string | null {
  if (!input.tanggal)                       return 'Tanggal wajib diisi.';
  if (!input.petugas.trim())                return 'Petugas wajib diisi.';
  if (!input.kondisi)                        return 'Kondisi wajib dipilih.';
  if (input.beratBadan !== null && input.beratBadan <= 0) return 'Berat Badan harus lebih dari 0.';
  if (input.bcs !== null && input.bcs <= 0)  return 'BCS harus lebih dari 0.';
  return null;
}

/** Throws with a user-facing message when validation fails. Hanya dapat mencatat selama Kebuntingan belum berstatus final. */
export function addKebuntinganMonitoring(kebuntinganId: string, input: KebuntinganMonitoringInput): KebuntinganMonitoringRecord {
  const kebuntingan = KEBUNTINGAN_DB[kebuntinganId];
  if (!kebuntingan) throw new Error('Kebuntingan tidak ditemukan.');
  if (isStatusFinal(kebuntingan.status)) {
    throw new Error(`Tidak dapat mencatat Monitoring — Kebuntingan sudah berstatus "${kebuntingan.status}".`);
  }
  const fieldError = validateKebuntinganMonitoringFields(input);
  if (fieldError) throw new Error(fieldError);

  const record: KebuntinganMonitoringRecord = {
    id: generateUUID(),
    kebuntinganId,
    tanggal: input.tanggal,
    petugas: input.petugas.trim(),
    kondisi: input.kondisi,
    beratBadan: input.beratBadan,
    bcs: input.bcs,
    catatan: input.catatan?.trim() || null,
    lampiran: [...input.lampiran],
    createdDate: new Date().toISOString().slice(0, 10),
  };
  KEBUNTINGAN_MONITORING_DB[record.id] = record;
  return record;
}

function sortMonitoringTerbaruKeTerlama(a: KebuntinganMonitoringRecord, b: KebuntinganMonitoringRecord): number {
  if (a.tanggal !== b.tanggal) return a.tanggal < b.tanggal ? 1 : -1;
  return a.createdDate < b.createdDate ? 1 : -1;
}

export function getKebuntinganMonitoringList(kebuntinganId: string): KebuntinganMonitoringRecord[] {
  return Object.values(KEBUNTINGAN_MONITORING_DB)
    .filter((m) => m.kebuntinganId === kebuntinganId)
    .sort(sortMonitoringTerbaruKeTerlama);
}

// ─── Timeline integration ────────────────────────────────────────────────────
// Kebuntingan tidak menyimpan Timeline-nya sendiri — ia menambahkan Event ke
// Timeline Reproduksi yang sudah ada. getFullTimelineForProgram (RP-005, yang
// sendiri menggabungkan RP-004) TIDAK diubah; fungsi di bawah ini hanya
// menggabungkan hasilnya dengan Event Kebuntingan (lifecycle + Monitoring).

const EVENT_CONFIRMED: EventType = 'Konfirmasi Bunting';       // Pregnancy Confirmed
const EVENT_MONITORING: EventType = 'Monitoring Kebuntingan';  // Pregnancy Monitoring
const EVENT_RISK_UPDATED: EventType = 'Risiko Kebuntingan Diperbarui'; // Pregnancy Risk Updated
const EVENT_COMPLETED: EventType = 'Kebuntingan Selesai';      // Pregnancy Completed
const EVENT_ABORTED: EventType = 'Abortus';                    // Pregnancy Aborted

function buildKebuntinganLifecycleEvents(k: KebuntinganRecord): ReproduksiEvent[] {
  const events: ReproduksiEvent[] = [
    {
      eventId: `${k.id}-confirmed`,
      programId: k.programId,
      eventType: EVENT_CONFIRMED,
      timestamp: k.createdDate,
      jam: null,
      petugas: '—',
      catatan: `Kebuntingan dikonfirmasi (Estimasi Lahir: ${k.tanggalLahirPerkiraan}).`,
      source: 'monitoring',
      livestockId: k.damId,
    },
  ];

  if (k.riskUpdatedDate) {
    events.push({
      eventId: `${k.id}-risk-${k.riskUpdatedDate}`,
      programId: k.programId,
      eventType: EVENT_RISK_UPDATED,
      timestamp: k.riskUpdatedDate,
      jam: null,
      petugas: '—',
      catatan: `Tingkat risiko diperbarui: ${k.riskLevel}.`,
      source: 'monitoring',
      livestockId: k.damId,
    });
  }

  if (k.status === 'Selesai' && k.completedDate) {
    events.push({
      eventId: `${k.id}-completed`,
      programId: k.programId,
      eventType: EVENT_COMPLETED,
      timestamp: k.completedDate,
      jam: null,
      petugas: '—',
      catatan: k.catatan ?? 'Kebuntingan selesai.',
      source: 'monitoring',
      livestockId: k.damId,
    });
  }

  if (k.status === 'Keguguran' && k.abortedDate) {
    events.push({
      eventId: `${k.id}-aborted`,
      programId: k.programId,
      eventType: EVENT_ABORTED,
      timestamp: k.abortedDate,
      jam: null,
      petugas: '—',
      catatan: k.catatan ?? 'Kebuntingan ditutup (keguguran).',
      source: 'monitoring',
      livestockId: k.damId,
    });
  }

  return events;
}

function kebuntinganMonitoringToEvent(m: KebuntinganMonitoringRecord, programId: string, damId: string): ReproduksiEvent {
  return {
    eventId: m.id,
    programId,
    eventType: EVENT_MONITORING,
    timestamp: m.tanggal,
    jam: null,
    petugas: m.petugas,
    catatan: m.catatan,
    source: 'monitoring',
    livestockId: damId,
    lampiran: m.lampiran,
  };
}

function sortEventsTerbaruKeTerlama(a: ReproduksiEvent, b: ReproduksiEvent): number {
  const aKey = `${a.timestamp}T${a.jam ?? '00:00'}`;
  const bKey = `${b.timestamp}T${b.jam ?? '00:00'}`;
  return aKey === bKey ? 0 : (aKey < bKey ? 1 : -1);
}

/**
 * Timeline lengkap satu Program termasuk Kebuntingan: Timeline RP-005 (yang
 * sudah menggabungkan RP-004, tidak diubah) + lifecycle Kebuntingan + Monitoring
 * Kebuntingan (RP-006), terbaru → terlama.
 */
export function getFullTimelineForProgram(program: ReproduksiProgramRecord): ReproduksiEvent[] {
  const pregnancies = getPregnancyListByProgram(program.id);
  const kebuntinganEvents = pregnancies.flatMap((k) => [
    ...buildKebuntinganLifecycleEvents(k),
    ...getKebuntinganMonitoringList(k.id).map((m) => kebuntinganMonitoringToEvent(m, program.id, k.damId)),
  ]);

  const events = [
    ...getRp005TimelineForProgram(program),
    ...kebuntinganEvents,
  ];
  return events.sort(sortEventsTerbaruKeTerlama);
}

// ─── populateKebuntinganMonitoringFromDb — FLOW-003M26 ───────────────────────
// Hydrates KEBUNTINGAN_MONITORING_DB from monitoring_reproduksi rows that were
// written with event_type='Monitoring Kebuntingan'. Extra fields (petugas,
// kondisi, kebuntinganId, beratBadan, bcs) are stored in the JSONB `data`
// column by reproduksiService.recordKebuntinganMonitoring().
//
// Called from useReproduksi.ts immediately after populateMonitoringFromDb —
// reuses the same monitoringRows array without an extra DB round-trip.

type KebuntinganMonitoringDbRowMinimal = {
  id:          string;
  event_type:  string;
  event_date:  string;
  description: string | null;
  data:        Record<string, unknown> | null;
  created_at:  string;
};

export function populateKebuntinganMonitoringFromDb(rows: KebuntinganMonitoringDbRowMinimal[]): void {
  // Only process rows that belong to Kebuntingan Monitoring
  const kbRows = rows.filter((r) => r.event_type === 'Monitoring Kebuntingan');
  if (kbRows.length === 0) return;

  for (const key of Object.keys(KEBUNTINGAN_MONITORING_DB)) {
    delete KEBUNTINGAN_MONITORING_DB[key];
  }

  const validKondisi = new Set<string>(KONDISI_LIST);

  for (const row of kbRows) {
    const extra        = row.data ?? {};
    const kebuntinganId = String(extra['kebuntinganId'] ?? '');
    if (!kebuntinganId) continue; // malformed row — skip

    const kondisiRaw   = String(extra['kondisi'] ?? '');
    const beratBadan   = typeof extra['beratBadan'] === 'number' ? extra['beratBadan'] : null;
    const bcs          = typeof extra['bcs'] === 'number'        ? extra['bcs']        : null;

    const record: KebuntinganMonitoringRecord = {
      id:           row.id,
      kebuntinganId,
      tanggal:      row.event_date,
      petugas:      String(extra['petugas'] ?? ''),
      kondisi:      validKondisi.has(kondisiRaw) ? (kondisiRaw as KondisiMonitoring) : 'Normal',
      beratBadan,
      bcs,
      catatan:      row.description ?? null,
      lampiran:     [],
      createdDate:  row.created_at,
    };

    KEBUNTINGAN_MONITORING_DB[record.id] = record;
  }
}

// ─── populateKebuntinganFromDb — FLOW-003M21 ──────────────────────────────────
// Hydrates KEBUNTINGAN_DB from kebuntingan rows.
// Must run AFTER populatePemeriksaanKebuntinganFromDb.
//
// Deferred (FUTURE FEATURE):
//   sire_id (DB) has no counterpart in KebuntinganRecord — dropped on read.
//   usiaKebuntinganPerkiraan not stored in DB → null.
//   riskLevel not stored in DB → defaults to 'Rendah'.
//   abortedDate not stored as a separate column → derived from updated_at
//   when status is 'Keguguran'.

type KebuntinganDbRowMinimal = {
  id:                  string;
  program_id:          string;
  pemeriksaan_id:      string;
  dam_id:              string;
  conception_date:     string | null;
  expected_birth_date: string | null;
  actual_birth_date:   string | null;
  status:              'Aktif' | 'Selesai' | 'Gugur' | 'Dibatalkan';
  notes:               string | null;
  created_at:          string;
  updated_at:          string;
};

function mapKebuntinganStatusFromDb(s: string): StatusKebuntingan {
  switch (s) {
    case 'Selesai': return 'Selesai';
    case 'Gugur':   return 'Keguguran';
    default:        return 'Kebuntingan Aktif';
  }
}

export function populateKebuntinganFromDb(rows: KebuntinganDbRowMinimal[]): void {
  if (rows.length === 0) return;

  for (const key of Object.keys(KEBUNTINGAN_DB)) {
    delete KEBUNTINGAN_DB[key];
  }

  for (const row of rows) {
    const status = mapKebuntinganStatusFromDb(row.status);

    const record: KebuntinganRecord = {
      id:                         row.id,
      programId:                  row.program_id,
      pemeriksaanId:              row.pemeriksaan_id,
      damId:                      row.dam_id,
      tanggalKawinPerkiraan:      row.conception_date   ?? row.created_at.slice(0, 10),
      usiaKebuntinganPerkiraan:   null,
      tanggalLahirPerkiraan:      row.expected_birth_date ?? row.created_at.slice(0, 10),
      status,
      riskLevel:                  'Rendah',
      catatan:                    row.notes ?? null,
      riskUpdatedDate:            null,
      completedDate:              status === 'Selesai'    ? (row.actual_birth_date ?? row.updated_at.slice(0, 10)) : null,
      abortedDate:                status === 'Keguguran'  ? row.updated_at.slice(0, 10) : null,
      createdDate:                row.created_at,
      updatedDate:                row.updated_at,
    };

    KEBUNTINGAN_DB[record.id] = record;
  }
}
