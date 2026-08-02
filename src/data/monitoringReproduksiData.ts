// ─── RP-004: Monitoring Program Reproduksi ──────────────────────────────────
// Monitoring adalah pusat pencatatan seluruh kejadian (event) yang terjadi
// selama sebuah Program Reproduksi berlangsung. Monitoring TIDAK menentukan
// status bunting, TIDAK mengubah data Program, dan TIDAK mengubah data
// Pelaksanaan — ia hanya mencatat bahwa sebuah kejadian telah terjadi.
//
// Satu Program dapat memiliki banyak Monitoring. Pelaksanaan terkait bersifat
// opsional (sebagian kejadian — misal Sinkronisasi Birahi atau Pemeriksaan —
// tidak selalu berasal dari satu Pelaksanaan tertentu).
//
// RP-005 membangun Pemeriksaan Kebuntingan sebagai modul tersendiri (lihat
// pemeriksaanKebuntinganData.ts) — event 'Pemeriksaan Kebuntingan' di bawah
// dibuat khusus oleh modul tersebut, bukan lewat form Monitoring generik ini.
// RP-006 membangun Kebuntingan (kebuntinganData.ts) sebagai modul tersendiri —
// event 'Konfirmasi Bunting', 'Monitoring Kebuntingan', 'Abortus', dan dua event
// baru 'Risiko Kebuntingan Diperbarui' serta 'Kebuntingan Selesai' di bawah
// dibuat khusus oleh modul tersebut.
// RP-007 membangun Kelahiran (kelahiranData.ts) sebagai modul tersendiri —
// event 'Melahirkan', 'Kelahiran Selesai', 'Anak Lahir', 'Lahir Mati', dan
// 'Kematian Neonatal' dibuat khusus oleh modul tersebut.
// RP-008 membangun Registrasi Anak (registrasiAnakData.ts) sebagai modul
// tersendiri — event 'Anak Didaftarkan' dan 'Ternak Terdaftar' dibuat khusus
// oleh modul tersebut.
// RP-009 membangun Sapih / Weaning Management (sapihData.ts) sebagai modul
// tersendiri — event 'Sapih Direncanakan', 'Sapih Dimulai', 'Sapih Selesai',
// dan 'Sapih Dibatalkan' dibuat khusus oleh modul tersebut.

import { generateUUID } from '../utils/uuid';
import {
  getProgramById,
  type ReproduksiProgramRecord,
} from './reproduksiProgramData';
import {
  isProgramAktifUntukPelaksanaan,
  getPelaksanaanById,
  JENIS_LAMPIRAN_LIST,
  type JenisLampiran,
} from './pelaksanaanReproduksiData';

// ─── Jenis Kejadian (Event Type) ────────────────────────────────────────────
// Beberapa tipe (Program Dibuat/Dimulai/Selesai/Dibatalkan) diturunkan secara
// otomatis dari Program itu sendiri untuk Timeline (lihat buildProgramLifecycleEvents
// di bawah) — tidak dibuat manual melalui form Monitoring. Sisanya dicatat oleh
// petugas melalui form Monitoring.

export const EVENT_TYPE_LIST = [
  'Program Dibuat',
  'Program Dimulai',
  'Kawin Alami',
  'Kawin Koloni',
  'Titip Kawin (Berangkat)',
  'Titip Kawin (Kembali)',
  'Inseminasi Buatan (IB)',
  'Sinkronisasi Birahi',
  'Pemeriksaan',
  'USG',
  'Palpasi',
  'Konfirmasi Bunting',
  'Monitoring Kebuntingan',
  'Pemeriksaan Kebuntingan',
  'Risiko Kebuntingan Diperbarui',
  'Kebuntingan Selesai',
  'Abortus',
  'Melahirkan',
  'Kelahiran Selesai',
  'Anak Lahir',
  'Lahir Mati',
  'Kematian Neonatal',
  'Anak Didaftarkan',
  'Ternak Terdaftar',
  'Sapih Direncanakan',
  'Sapih Dimulai',
  'Sapih Selesai',
  'Sapih Dibatalkan',
  'Program Selesai',
  'Program Dibatalkan',
  'Lainnya',
] as const;

export type EventType = typeof EVENT_TYPE_LIST[number];

/** Event type yang diturunkan otomatis dari status/tanggal Program — tidak dapat dipilih di form Monitoring. */
export const PROGRAM_LIFECYCLE_EVENT_TYPES: EventType[] = [
  'Program Dibuat', 'Program Dimulai', 'Program Selesai', 'Program Dibatalkan',
];

/**
 * Event type yang dibuat oleh modul tersendiri (bukan form Monitoring generik)
 * — RP-005, RP-006, dan RP-007 membuat event ini lewat modulnya masing-masing
 * (lihat pemeriksaanKebuntinganData.ts, kebuntinganData.ts, kelahiranData.ts),
 * sehingga tidak boleh dipilih manual di form Monitoring untuk mencegah
 * pencatatan ganda.
 */
export const DEDICATED_MODULE_EVENT_TYPES: EventType[] = [
  'Pemeriksaan Kebuntingan',
  'Konfirmasi Bunting',
  'Monitoring Kebuntingan',
  'Risiko Kebuntingan Diperbarui',
  'Kebuntingan Selesai',
  'Abortus',
  'Melahirkan',
  'Kelahiran Selesai',
  'Anak Lahir',
  'Lahir Mati',
  'Kematian Neonatal',
  'Anak Didaftarkan',
  'Ternak Terdaftar',
  'Sapih Direncanakan',
  'Sapih Dimulai',
  'Sapih Selesai',
  'Sapih Dibatalkan',
];

/** Event type yang dapat dipilih user saat membuat Monitoring baru. */
export const MONITORING_EVENT_TYPE_LIST = EVENT_TYPE_LIST.filter(
  (t) => !PROGRAM_LIFECYCLE_EVENT_TYPES.includes(t) && !DEDICATED_MODULE_EVENT_TYPES.includes(t),
) as EventType[];

const EVENT_TYPE_ICON: Record<EventType, string> = {
  'Program Dibuat': '🗂️',
  'Program Dimulai': '🚩',
  'Kawin Alami': '🐄',
  'Kawin Koloni': '🐄',
  'Titip Kawin (Berangkat)': '🚚',
  'Titip Kawin (Kembali)': '🔙',
  'Inseminasi Buatan (IB)': '💉',
  'Sinkronisasi Birahi': '🔄',
  'Pemeriksaan': '🩺',
  'USG': '📡',
  'Palpasi': '🖐️',
  'Konfirmasi Bunting': '✅',
  'Monitoring Kebuntingan': '👀',
  'Pemeriksaan Kebuntingan': '🤰',
  'Risiko Kebuntingan Diperbarui': '⚠️',
  'Kebuntingan Selesai': '🏁',
  'Abortus': '💔',
  'Melahirkan': '🐣',
  'Kelahiran Selesai': '🎉',
  'Anak Lahir': '🍼',
  'Lahir Mati': '🕊️',
  'Kematian Neonatal': '😢',
  'Anak Didaftarkan': '📋',
  'Ternak Terdaftar': '🏷️',
  'Sapih Direncanakan': '🗓️',
  'Sapih Dimulai': '🌾',
  'Sapih Selesai': '✅',
  'Sapih Dibatalkan': '🚫',
  'Program Selesai': '🏁',
  'Program Dibatalkan': '🚫',
  'Lainnya': '📝',
};

export function eventTypeIcon(type: EventType): string {
  return EVENT_TYPE_ICON[type] ?? '📝';
}

// ─── Kondisi ─────────────────────────────────────────────────────────────────

export const KONDISI_LIST = ['Normal', 'Perlu Observasi', 'Perlu Pemeriksaan', 'Selesai Monitoring'] as const;

export type KondisiMonitoring = typeof KONDISI_LIST[number];

// ─── Status Monitoring ───────────────────────────────────────────────────────

export const STATUS_MONITORING_LIST = ['Draft', 'Tersimpan'] as const;

export type StatusMonitoring = typeof STATUS_MONITORING_LIST[number];

// ─── Lampiran (Foto / Dokumen — opsional, mengikuti konvensi Pelaksanaan) ───

export type LampiranMonitoring = {
  id: string;
  jenis: JenisLampiran;
  namaFile: string;
};

export { JENIS_LAMPIRAN_LIST };

// ─── Monitoring Record ───────────────────────────────────────────────────────

export type MonitoringRecord = {
  id: string;                  // UUID v4 — juga berfungsi sebagai Event UUID
  programId: string;           // relasi ke ReproduksiProgramRecord.id
  pelaksanaanId: string | null; // relasi opsional ke PelaksanaanRecord.id
  eventType: EventType;        // tepat satu Event Type per Monitoring
  tanggal: string;              // yyyy-mm-dd
  jam: string;                  // HH:mm
  petugas: string;
  kondisi: KondisiMonitoring;
  status: StatusMonitoring;
  catatan: string | null;
  lampiran: LampiranMonitoring[];
  createdDate: string;
  updatedDate: string;
};

export type MonitoringInput = {
  pelaksanaanId: string | null;
  eventType: EventType;
  tanggal: string;
  jam: string;
  petugas: string;
  kondisi: KondisiMonitoring;
  status: StatusMonitoring;
  catatan: string | null;
  lampiran: LampiranMonitoring[];
};

// ─── Registry (empty — populated at runtime) ────────────────────────────────

export const MONITORING_REPRODUKSI_DB: Record<string, MonitoringRecord> = {};

// ─── Validasi ────────────────────────────────────────────────────────────────

function validateMonitoringFields(input: MonitoringInput): string | null {
  if (!input.eventType)       return 'Jenis Kejadian (Event Type) wajib dipilih.';
  if (!input.tanggal)         return 'Tanggal wajib diisi.';
  if (!input.jam)              return 'Jam wajib diisi.';
  if (!input.petugas.trim())   return 'Petugas wajib diisi.';
  if (!input.kondisi)          return 'Kondisi wajib dipilih.';
  return null;
}

/**
 * Validasi lengkap sebelum membuat/mengubah Monitoring: Program harus ada dan
 * masih aktif (belum Selesai/Dibatalkan), Pelaksanaan (jika dipilih) harus
 * benar-benar milik Program yang sama, dan field Monitoring itu sendiri valid.
 * Tidak boleh membuat Event tanpa Program. Throws dengan pesan siap tampil ke user.
 */
export function validateMonitoring(programId: string, input: MonitoringInput): ReproduksiProgramRecord {
  if (!programId) throw new Error('Monitoring wajib terkait dengan satu Program Reproduksi.');

  const program = getProgramById(programId);
  if (!program) throw new Error('Program Reproduksi tidak ditemukan.');
  if (!isProgramAktifUntukPelaksanaan(program)) {
    throw new Error(`Tidak dapat mencatat Monitoring — Program berstatus "${program.status}".`);
  }

  if (input.pelaksanaanId) {
    const pelaksanaan = getPelaksanaanById(input.pelaksanaanId);
    if (!pelaksanaan || pelaksanaan.programId !== programId) {
      throw new Error('Pelaksanaan yang dipilih tidak ditemukan atau bukan milik Program ini.');
    }
  }

  const fieldError = validateMonitoringFields(input);
  if (fieldError) throw new Error(fieldError);

  return program;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

function sortTerbaruKeTerlama(a: MonitoringRecord, b: MonitoringRecord): number {
  const aKey = `${a.tanggal}T${a.jam}`;
  const bKey = `${b.tanggal}T${b.jam}`;
  if (aKey !== bKey) return aKey < bKey ? 1 : -1;
  return a.createdDate < b.createdDate ? 1 : -1;
}

/** Seluruh Monitoring, terbaru → terlama (dasar Timeline lintas-Program). */
export function getMonitoringList(): MonitoringRecord[] {
  return Object.values(MONITORING_REPRODUKSI_DB).sort(sortTerbaruKeTerlama);
}

export function getMonitoringListByProgram(programId: string): MonitoringRecord[] {
  return getMonitoringList().filter((m) => m.programId === programId);
}

export function getMonitoringById(id: string): MonitoringRecord | null {
  return MONITORING_REPRODUKSI_DB[id] ?? null;
}

/** Throws with a user-facing message when validation fails. */
export function addMonitoring(programId: string, input: MonitoringInput): MonitoringRecord {
  validateMonitoring(programId, input);

  const today = new Date().toISOString().slice(0, 10);
  const record: MonitoringRecord = {
    id: generateUUID(),
    programId,
    pelaksanaanId: input.pelaksanaanId || null,
    eventType: input.eventType,
    tanggal: input.tanggal,
    jam: input.jam,
    petugas: input.petugas.trim(),
    kondisi: input.kondisi,
    status: input.status,
    catatan: input.catatan?.trim() || null,
    lampiran: [...input.lampiran],
    createdDate: today,
    updatedDate: today,
  };
  MONITORING_REPRODUKSI_DB[record.id] = record;
  return record;
}

/**
 * Throws with a user-facing message when validation fails. Program dan
 * Pelaksanaan hubungan tidak dapat dipindah ke record lain lewat edit ini —
 * hanya isi kejadian yang dapat diperbarui (peserta Program dan data
 * Pelaksanaan tidak pernah disentuh dari sini).
 */
export function updateMonitoring(id: string, input: MonitoringInput): MonitoringRecord {
  const existing = MONITORING_REPRODUKSI_DB[id];
  if (!existing) throw new Error('Monitoring tidak ditemukan.');

  validateMonitoring(existing.programId, input);

  const updated: MonitoringRecord = {
    ...existing,
    pelaksanaanId: input.pelaksanaanId || null,
    eventType: input.eventType,
    tanggal: input.tanggal,
    jam: input.jam,
    petugas: input.petugas.trim(),
    kondisi: input.kondisi,
    status: input.status,
    catatan: input.catatan?.trim() || null,
    lampiran: [...input.lampiran],
    updatedDate: new Date().toISOString().slice(0, 10),
  };
  MONITORING_REPRODUKSI_DB[id] = updated;
  return updated;
}

// ─── Timeline: Event turunan siklus-hidup Program ───────────────────────────
// Diturunkan langsung dari field Program (status/createdDate/updatedDate) —
// tidak disimpan sebagai record tersendiri, dan tidak mengubah Program.

export type ReproduksiEvent = {
  eventId: string;
  programId: string;
  eventType: EventType;
  timestamp: string; // yyyy-mm-dd (+ optional HH:mm bila tersedia dari Monitoring)
  jam: string | null;
  petugas: string;
  catatan: string | null;
  source: 'program' | 'monitoring';
  monitoring?: MonitoringRecord;
  /**
   * Livestock (biasanya dam) yang menjadi subjek Event ini, bila dapat
   * ditentukan — diisi oleh modul yang benar-benar tahu (RP-006..RP-009).
   * undefined/null bila Event bersifat Program-wide (mis. Program/Monitoring
   * generik) — RP-010 (Riwayat Reproduksi) membaca field ini, tidak menebaknya.
   */
  livestockId?: string | null;
  /** Relasi ke KelahiranRecord.id, bila Event berasal dari rantai Kelahiran/Anak/Sapih (RP-007..RP-009) — dipakai RP-010 untuk resolusi Related Offspring. */
  kelahiranId?: string | null;
  /** Lampiran sumber Event ini (Monitoring/Pemeriksaan/Kebuntingan Monitoring), bila ada — dipakai RP-010 untuk Detail Attachments. */
  lampiran?: { id: string; jenis: JenisLampiran; namaFile: string }[];
};

export function buildProgramLifecycleEvents(program: ReproduksiProgramRecord): ReproduksiEvent[] {
  const events: ReproduksiEvent[] = [
    {
      eventId: `${program.id}-created`,
      programId: program.id,
      eventType: 'Program Dibuat',
      timestamp: program.createdDate,
      jam: null,
      petugas: program.petugas,
      catatan: `Program "${program.namaProgram}" (${program.nomorProgram}) dibuat.`,
      source: 'program',
    },
  ];

  if (program.status === 'Berjalan' || program.status === 'Selesai') {
    events.push({
      eventId: `${program.id}-started`,
      programId: program.id,
      eventType: 'Program Dimulai',
      timestamp: program.tanggalMulai || program.createdDate,
      jam: null,
      petugas: program.petugas,
      catatan: `Program mulai berjalan.`,
      source: 'program',
    });
  }

  if (program.status === 'Selesai') {
    events.push({
      eventId: `${program.id}-finished`,
      programId: program.id,
      eventType: 'Program Selesai',
      timestamp: program.updatedDate,
      jam: null,
      petugas: program.petugas,
      catatan: `Program "${program.namaProgram}" selesai.`,
      source: 'program',
    });
  }

  if (program.status === 'Dibatalkan') {
    events.push({
      eventId: `${program.id}-cancelled`,
      programId: program.id,
      eventType: 'Program Dibatalkan',
      timestamp: program.updatedDate,
      jam: null,
      petugas: program.petugas,
      catatan: `Program "${program.namaProgram}" dibatalkan.`,
      source: 'program',
    });
  }

  return events;
}

function monitoringToEvent(m: MonitoringRecord): ReproduksiEvent {
  return {
    eventId: m.id,
    programId: m.programId,
    eventType: m.eventType,
    timestamp: m.tanggal,
    jam: m.jam,
    petugas: m.petugas,
    catatan: m.catatan,
    source: 'monitoring',
    monitoring: m,
    lampiran: m.lampiran,
  };
}

function sortEventsTerbaruKeTerlama(a: ReproduksiEvent, b: ReproduksiEvent): number {
  const aKey = `${a.timestamp}T${a.jam ?? '00:00'}`;
  const bKey = `${b.timestamp}T${b.jam ?? '00:00'}`;
  return aKey === bKey ? 0 : (aKey < bKey ? 1 : -1);
}

/** Timeline lengkap satu Program: event siklus-hidup Program + seluruh Monitoring, terbaru → terlama. */
export function getTimelineForProgram(program: ReproduksiProgramRecord): ReproduksiEvent[] {
  const events = [
    ...buildProgramLifecycleEvents(program),
    ...getMonitoringListByProgram(program.id).map(monitoringToEvent),
  ];
  return events.sort(sortEventsTerbaruKeTerlama);
}

// ─── populateMonitoringFromDb — FLOW-003M21 ───────────────────────────────────
// Hydrates MONITORING_REPRODUKSI_DB from monitoring_reproduksi rows.
// Extra in-memory fields (kondisi, jam, petugas, status) are stored in the
// JSONB `data` column by reproduksiService.recordMonitoring().
//
// Deferred (FUTURE FEATURE): lampiran not persisted to DB.

type MonitoringDbRowMinimal = {
  id:             string;
  program_id:     string;
  pelaksanaan_id: string | null;
  event_type:     string;
  event_date:     string;
  description:    string | null;
  data:           Record<string, unknown> | null;
  created_at:     string;
};

export function populateMonitoringFromDb(rows: MonitoringDbRowMinimal[]): void {
  if (rows.length === 0) return;

  for (const key of Object.keys(MONITORING_REPRODUKSI_DB)) {
    delete MONITORING_REPRODUKSI_DB[key];
  }

  const validEventTypes = new Set<string>(EVENT_TYPE_LIST);
  const validKondisi    = new Set<string>(KONDISI_LIST);
  const validStatus     = new Set<string>(STATUS_MONITORING_LIST);

  for (const row of rows) {
    const extra      = row.data ?? {};
    const kondisiRaw = String(extra['kondisi'] ?? '');
    const statusRaw  = String(extra['status']  ?? '');

    const record: MonitoringRecord = {
      id:            row.id,
      programId:     row.program_id,
      pelaksanaanId: row.pelaksanaan_id ?? null,
      eventType:     validEventTypes.has(row.event_type) ? (row.event_type as EventType) : 'Lainnya',
      tanggal:       row.event_date,
      jam:           String(extra['jam']     ?? ''),
      petugas:       String(extra['petugas'] ?? ''),
      kondisi:       validKondisi.has(kondisiRaw) ? (kondisiRaw as KondisiMonitoring) : 'Normal',
      status:        validStatus.has(statusRaw)   ? (statusRaw  as StatusMonitoring)  : 'Tersimpan',
      catatan:       row.description ?? null,
      lampiran:      [],
      createdDate:   row.created_at,
      updatedDate:   row.created_at,
    };

    MONITORING_REPRODUKSI_DB[record.id] = record;
  }
}
