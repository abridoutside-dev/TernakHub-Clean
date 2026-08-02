// ─── RP-007: Kelahiran (Birth Management) ────────────────────────────────────
// Kelahiran mencatat proses kelahiran dari satu Kebuntingan yang sudah Selesai
// (status === 'Selesai'). Satu Kebuntingan hanya dapat memiliki satu Kelahiran
// (1:1). Satu Kelahiran dapat memiliki satu atau banyak Anak (offspring).
//
// Kelahiran TIDAK membuat Livestock permanen dan TIDAK mengubah Lineage secara
// otomatis — pendaftaran Livestock dari Anak adalah roadmap RP-008. Anak yang
// belum didaftarkan tetap tersimpan sebagai AnakRecord (data sementara) yang
// terhubung ke Kelahiran ini sampai didaftarkan via RP-008.
//
// Entry requirement: kebuntingan.status === 'Selesai' dan belum ada Kelahiran
// terkait (relasi 1:1 Kebuntingan→Kelahiran).

import { generateUUID } from '../utils/uuid';
import {
  KEBUNTINGAN_DB,
  getPregnancyById,
  getPregnancyListByProgram,
  type KebuntinganRecord,
} from './kebuntinganData';
import {
  getFullTimelineForProgram as getRp006TimelineForProgram,
} from './kebuntinganData';
import {
  JENIS_LAMPIRAN_LIST,
  type JenisLampiran,
} from './pelaksanaanReproduksiData';
import {
  type ReproduksiProgramRecord,
} from './reproduksiProgramData';
import {
  type EventType,
  type ReproduksiEvent,
} from './monitoringReproduksiData';

export { JENIS_LAMPIRAN_LIST };

// ─── Metode Kelahiran ─────────────────────────────────────────────────────────
// Arsitektur mendukung penambahan metode baru di masa depan — tambahkan ke daftar
// ini saja, tidak perlu mengubah bentuk data lain.

export const METODE_KELAHIRAN_LIST = [
  'Kelahiran Normal',
  'Kelahiran dengan Bantuan',
  'Operasi Caesar',
  'Lainnya',
] as const;
export type MetodeKelahiran = typeof METODE_KELAHIRAN_LIST[number];

// ─── Status Kelahiran ─────────────────────────────────────────────────────────

export const STATUS_KELAHIRAN_LIST = ['Berlangsung', 'Selesai'] as const;
export type StatusKelahiran = typeof STATUS_KELAHIRAN_LIST[number];

// ─── Jenis Kelamin Anak ───────────────────────────────────────────────────────

export const JENIS_KELAMIN_ANAK_LIST = ['Jantan', 'Betina', 'Tidak Diketahui'] as const;
export type JenisKelaminAnak = typeof JENIS_KELAMIN_ANAK_LIST[number];

// ─── Kondisi Awal Anak ────────────────────────────────────────────────────────

export const KONDISI_AWAL_LIST = ['Sehat', 'Lemah', 'Perlu Penanganan', 'Kritis'] as const;
export type KondisiAwal = typeof KONDISI_AWAL_LIST[number];

// ─── Jenis Anak (terkait hasil kelahiran) ─────────────────────────────────────

export const JENIS_ANAK_LIST = ['Hidup', 'Lahir Mati', 'Mati Setelah Lahir'] as const;
export type JenisAnak = typeof JENIS_ANAK_LIST[number];

// ─── Status Registrasi Anak ───────────────────────────────────────────────────
// Anak yang belum didaftarkan sebagai Livestock permanen tetap berstatus
// 'Belum Didaftarkan'. Pendaftaran adalah roadmap RP-008.

export const STATUS_REGISTRASI_ANAK_LIST = ['Belum Didaftarkan', 'Sudah Didaftarkan'] as const;
export type StatusRegistrasiAnak = typeof STATUS_REGISTRASI_ANAK_LIST[number];

// ─── Anak Record (Temporary Offspring) ───────────────────────────────────────

export type AnakRecord = {
  id: string;                        // UUID v4 — temporary, bukan Livestock UUID permanen
  kelahiranId: string;               // relasi ke KelahiranRecord.id
  jenisKelamin: JenisKelaminAnak;
  jenis: JenisAnak;                  // Hidup / Lahir Mati / Mati Setelah Lahir
  beratLahir: number | null;         // kg, opsional
  warna: string | null;              // warna bulu/kulit, opsional
  ras: string;                       // breed
  kondisiAwal: KondisiAwal;
  catatan: string | null;
  statusRegistrasi: StatusRegistrasiAnak; // selalu 'Belum Didaftarkan' sampai RP-008
  /** Diisi oleh RP-008 saat Anak ini didaftarkan menjadi Livestock permanen — null sampai saat itu. */
  livestockId: string | null;
  /** Tanggal pendaftaran (RP-008) — berbeda dari createdDate (tanggal Anak dicatat saat Kelahiran). */
  registeredDate: string | null;
  createdDate: string;
};

export type AnakInput = {
  jenisKelamin: JenisKelaminAnak;
  jenis: JenisAnak;
  beratLahir: number | null;
  warna: string | null;
  ras: string;
  kondisiAwal: KondisiAwal;
  catatan: string | null;
};

// ─── Kelahiran Record ─────────────────────────────────────────────────────────

export type KelahiranRecord = {
  id: string;                        // UUID v4 — juga dipakai sebagai basis Event UUID
  kebuntinganId: string;             // relasi ke KebuntinganRecord.id — 1:1
  programId: string;                 // denormalized dari Kebuntingan.programId
  damId: string;                     // denormalized dari Kebuntingan.damId
  tanggalLahir: string;              // yyyy-mm-dd
  jamLahir: string;                  // HH:mm
  lokasiLahir: string;
  petugas: string;
  metode: MetodeKelahiran;
  status: StatusKelahiran;
  catatan: string | null;
  createdDate: string;
  updatedDate: string;
};

export type KelahiranInput = {
  tanggalLahir: string;
  jamLahir: string;
  lokasiLahir: string;
  petugas: string;
  metode: MetodeKelahiran;
  catatan: string | null;
};

// ─── Registries (empty — populated at runtime) ───────────────────────────────

export const KELAHIRAN_DB: Record<string, KelahiranRecord> = {};
export const ANAK_DB: Record<string, AnakRecord> = {};

// ─── Validasi ─────────────────────────────────────────────────────────────────

export function getKelahiranByKebuntinganId(kebuntinganId: string): KelahiranRecord | null {
  return Object.values(KELAHIRAN_DB).find((k) => k.kebuntinganId === kebuntinganId) ?? null;
}

function validateKelahiranFields(input: KelahiranInput): string | null {
  if (!input.tanggalLahir)          return 'Tanggal Lahir wajib diisi.';
  if (!input.jamLahir)              return 'Jam Lahir wajib diisi.';
  if (!input.lokasiLahir.trim())    return 'Lokasi Lahir wajib diisi.';
  if (!input.petugas.trim())        return 'Petugas wajib diisi.';
  if (!input.metode)                return 'Metode Kelahiran wajib dipilih.';
  return null;
}

/**
 * Validasi sebelum membuat Kelahiran: Kebuntingan harus ada, berstatus 'Selesai'
 * (Completed), dan belum pernah memiliki data Kelahiran (relasi 1:1).
 * Throws dengan pesan siap tampil ke user.
 */
export function validateKelahiranBaru(
  kebuntinganId: string,
  input: KelahiranInput,
): KebuntinganRecord {
  if (!kebuntinganId) throw new Error('Kelahiran wajib terkait dengan satu Kebuntingan.');

  const kebuntingan = getPregnancyById(kebuntinganId);
  if (!kebuntingan) throw new Error('Kebuntingan tidak ditemukan.');
  if (kebuntingan.status !== 'Selesai') {
    throw new Error(
      `Kelahiran hanya dapat dicatat dari Kebuntingan berstatus "Selesai" — Kebuntingan ini berstatus "${kebuntingan.status}".`,
    );
  }
  if (getKelahiranByKebuntinganId(kebuntinganId)) {
    throw new Error('Kebuntingan ini sudah memiliki data Kelahiran.');
  }

  const fieldError = validateKelahiranFields(input);
  if (fieldError) throw new Error(fieldError);

  return kebuntingan;
}

function validateAnakInput(input: AnakInput): string | null {
  if (!input.jenisKelamin)                               return 'Jenis Kelamin wajib dipilih.';
  if (!input.jenis)                                      return 'Jenis (Hidup/Lahir Mati/Mati Setelah Lahir) wajib dipilih.';
  if (!input.ras.trim())                                 return 'Ras wajib diisi.';
  if (!input.kondisiAwal)                                return 'Kondisi Awal wajib dipilih.';
  if (input.beratLahir !== null && input.beratLahir <= 0) return 'Berat Lahir harus lebih dari 0.';
  return null;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

function sortKelahiranTerbaruKeTerlama(a: KelahiranRecord, b: KelahiranRecord): number {
  const aKey = `${a.tanggalLahir}T${a.jamLahir}`;
  const bKey = `${b.tanggalLahir}T${b.jamLahir}`;
  return aKey === bKey ? 0 : (aKey < bKey ? 1 : -1);
}

export function getKelahiranListByProgram(programId: string): KelahiranRecord[] {
  return Object.values(KELAHIRAN_DB)
    .filter((k) => k.programId === programId)
    .sort(sortKelahiranTerbaruKeTerlama);
}

export function getKelahiranById(id: string): KelahiranRecord | null {
  return KELAHIRAN_DB[id] ?? null;
}

/** Throws with a user-facing message when validation fails. One call = one Kelahiran (1:1 Kebuntingan). */
export function addKelahiran(kebuntinganId: string, input: KelahiranInput): KelahiranRecord {
  const kebuntingan = validateKelahiranBaru(kebuntinganId, input);

  const today = new Date().toISOString().slice(0, 10);
  const record: KelahiranRecord = {
    id: generateUUID(),
    kebuntinganId,
    programId: kebuntingan.programId,
    damId: kebuntingan.damId,
    tanggalLahir: input.tanggalLahir,
    jamLahir: input.jamLahir,
    lokasiLahir: input.lokasiLahir.trim(),
    petugas: input.petugas.trim(),
    metode: input.metode,
    status: 'Berlangsung',
    catatan: input.catatan?.trim() || null,
    createdDate: today,
    updatedDate: today,
  };
  KELAHIRAN_DB[record.id] = record;
  return record;
}

/** Tandai Kelahiran sebagai Selesai — status bersifat final setelah transisi ini. */
export function completeKelahiran(id: string): KelahiranRecord {
  const existing = KELAHIRAN_DB[id];
  if (!existing) throw new Error('Kelahiran tidak ditemukan.');
  if (existing.status === 'Selesai') throw new Error('Kelahiran sudah berstatus Selesai.');

  const today = new Date().toISOString().slice(0, 10);
  const updated: KelahiranRecord = { ...existing, status: 'Selesai', updatedDate: today };
  KELAHIRAN_DB[id] = updated;
  return updated;
}

/** Throws with a user-facing message when validation fails. Menambahkan satu Anak ke Kelahiran. */
export function addAnak(kelahiranId: string, input: AnakInput): AnakRecord {
  const kelahiran = KELAHIRAN_DB[kelahiranId];
  if (!kelahiran) throw new Error('Kelahiran tidak ditemukan.');

  const fieldError = validateAnakInput(input);
  if (fieldError) throw new Error(fieldError);

  const record: AnakRecord = {
    id: generateUUID(),
    kelahiranId,
    jenisKelamin: input.jenisKelamin,
    jenis: input.jenis,
    beratLahir: input.beratLahir,
    warna: input.warna?.trim() || null,
    ras: input.ras.trim(),
    kondisiAwal: input.kondisiAwal,
    catatan: input.catatan?.trim() || null,
    statusRegistrasi: 'Belum Didaftarkan',
    livestockId: null,
    registeredDate: null,
    createdDate: new Date().toISOString().slice(0, 10),
  };
  ANAK_DB[record.id] = record;
  return record;
}

export function getAnakListByKelahiran(kelahiranId: string): AnakRecord[] {
  return Object.values(ANAK_DB)
    .filter((a) => a.kelahiranId === kelahiranId)
    .sort((a, b) => (a.createdDate < b.createdDate ? -1 : 1));
}

// ─── Derived birth result counts ──────────────────────────────────────────────

export type KelahiranHasil = {
  totalLahir: number;
  hidup: number;
  lahirMati: number;
  matiSetelahLahir: number;
};

export function getKelahiranHasil(kelahiranId: string): KelahiranHasil {
  const anak = getAnakListByKelahiran(kelahiranId);
  return {
    totalLahir: anak.length,
    hidup:            anak.filter((a) => a.jenis === 'Hidup').length,
    lahirMati:        anak.filter((a) => a.jenis === 'Lahir Mati').length,
    matiSetelahLahir: anak.filter((a) => a.jenis === 'Mati Setelah Lahir').length,
  };
}

// ─── Timeline integration ─────────────────────────────────────────────────────
// Kelahiran tidak menyimpan Timeline-nya sendiri — ia menambahkan Event ke
// Timeline Reproduksi yang sudah ada. getFullTimelineForProgram (RP-006, yang
// sendiri menggabungkan RP-004 dan RP-005) TIDAK diubah; fungsi di bawah ini
// hanya menggabungkan hasilnya dengan Event Kelahiran + Anak (RP-007).

const EVENT_BIRTH_STARTED: EventType    = 'Melahirkan';
const EVENT_BIRTH_COMPLETED: EventType  = 'Kelahiran Selesai';
const EVENT_OFFSPRING: EventType        = 'Anak Lahir';
const EVENT_STILLBIRTH: EventType       = 'Lahir Mati';
const EVENT_NEONATAL_DEATH: EventType   = 'Kematian Neonatal';

function buildKelahiranLifecycleEvents(k: KelahiranRecord): ReproduksiEvent[] {
  const events: ReproduksiEvent[] = [
    {
      eventId: `${k.id}-started`,
      programId: k.programId,
      eventType: EVENT_BIRTH_STARTED,
      timestamp: k.tanggalLahir,
      jam: k.jamLahir || null,
      petugas: k.petugas,
      catatan: `Kelahiran dimulai — Metode: ${k.metode}.`,
      source: 'monitoring',
      livestockId: k.damId,
      kelahiranId: k.id,
    },
  ];

  if (k.status === 'Selesai') {
    events.push({
      eventId: `${k.id}-completed`,
      programId: k.programId,
      eventType: EVENT_BIRTH_COMPLETED,
      timestamp: k.updatedDate,
      jam: null,
      petugas: k.petugas,
      catatan: k.catatan ?? 'Proses kelahiran selesai.',
      source: 'monitoring',
      livestockId: k.damId,
      kelahiranId: k.id,
    });
  }

  return events;
}

function anakToEvent(a: AnakRecord, programId: string, tanggalLahir: string, petugas: string, damId: string, kelahiranId: string): ReproduksiEvent {
  const eventType: EventType =
    a.jenis === 'Lahir Mati'           ? EVENT_STILLBIRTH :
    a.jenis === 'Mati Setelah Lahir'   ? EVENT_NEONATAL_DEATH :
                                         EVENT_OFFSPRING;

  return {
    eventId: `anak-${a.id}`,
    programId,
    eventType,
    timestamp: tanggalLahir,
    jam: null,
    petugas,
    catatan: `${a.jenisKelamin} · Ras: ${a.ras}${a.beratLahir != null ? ` · Berat: ${a.beratLahir} kg` : ''}.`,
    source: 'monitoring',
    // Anak belum tentu punya Livestock permanen (baru ada setelah RP-008) —
    // sampai saat itu, damId dipakai sebagai rujukan Livestock yang paling
    // relevan (induk yang melahirkan), bukan menebak identitas Anak itu sendiri.
    livestockId: a.livestockId ?? damId,
    kelahiranId,
  };
}

function sortEventsTerbaruKeTerlama(a: ReproduksiEvent, b: ReproduksiEvent): number {
  const aKey = `${a.timestamp}T${a.jam ?? '00:00'}`;
  const bKey = `${b.timestamp}T${b.jam ?? '00:00'}`;
  return aKey === bKey ? 0 : (aKey < bKey ? 1 : -1);
}

/**
 * Timeline lengkap satu Program termasuk Kelahiran + Anak: Timeline RP-006 (yang
 * sudah menggabungkan RP-004/RP-005, tidak diubah) + event Kelahiran + Anak
 * (RP-007), terbaru → terlama.
 */
export function getFullTimelineForProgram(program: ReproduksiProgramRecord): ReproduksiEvent[] {
  const kelahiranList = getKelahiranListByProgram(program.id);
  const kelahiranEvents = kelahiranList.flatMap((k) => [
    ...buildKelahiranLifecycleEvents(k),
    ...getAnakListByKelahiran(k.id).map((a) =>
      anakToEvent(a, program.id, k.tanggalLahir, k.petugas, k.damId, k.id),
    ),
  ]);

  return [
    ...getRp006TimelineForProgram(program),
    ...kelahiranEvents,
  ].sort(sortEventsTerbaruKeTerlama);
}

// ─── populateKelahiranFromDb — FLOW-003M21 ────────────────────────────────────
// Hydrates KELAHIRAN_DB and ANAK_DB from kelahiran + registrasi_anak rows.
// Must run AFTER populateKebuntinganFromDb — KelahiranRecord.programId and
// .damId are denormalized from KEBUNTINGAN_DB.
// ANAK_DB keys after populate are the Supabase UUIDs (registrasi_anak.id),
// which populateSapihFromDb uses directly via sapih.registrasi_id.
//
// Deferred (FUTURE FEATURE):
//   lokasiLahir, petugas not stored in kelahiran → default ''.
//   ras, warna, kondisiAwal not stored in registrasi_anak → defaults.

type KelahiranDbRowMinimal = {
  id:             string;
  kebuntingan_id: string;
  birth_date:     string;
  birth_time:     string | null;
  birth_process:  string | null;
  notes:          string | null;
  created_at:     string;
};

type RegistrasiAnakDbRowMinimal = {
  id:              string;
  kelahiran_id:    string;
  livestock_id:    string | null;
  sex:             'Jantan' | 'Betina' | null;
  birth_weight_kg: number | null;
  condition:       'Hidup' | 'Mati';
  notes:           string | null;
  created_at:      string;
};

export function populateKelahiranFromDb(
  kelahiranRows: KelahiranDbRowMinimal[],
  anakRows: RegistrasiAnakDbRowMinimal[],
): void {
  if (kelahiranRows.length === 0 && anakRows.length === 0) return;

  for (const key of Object.keys(KELAHIRAN_DB)) {
    delete KELAHIRAN_DB[key];
  }
  for (const key of Object.keys(ANAK_DB)) {
    delete ANAK_DB[key];
  }

  const validMetode = new Set<string>(METODE_KELAHIRAN_LIST);

  for (const row of kelahiranRows) {
    const kebuntingan = KEBUNTINGAN_DB[row.kebuntingan_id];
    // birth_time is stored as 'HH:MM:SS' — truncate to 'HH:MM'.
    const jamLahir    = row.birth_time ? row.birth_time.slice(0, 5) : '';

    const record: KelahiranRecord = {
      id:            row.id,
      kebuntinganId: row.kebuntingan_id,
      programId:     kebuntingan?.programId ?? '',
      damId:         kebuntingan?.damId ?? '',
      tanggalLahir:  row.birth_date,
      jamLahir,
      lokasiLahir:   '',
      petugas:       '',
      metode:        validMetode.has(row.birth_process ?? '')
                       ? (row.birth_process as MetodeKelahiran)
                       : 'Kelahiran Normal',
      status:        'Selesai',
      catatan:       row.notes ?? null,
      createdDate:   row.created_at,
      updatedDate:   row.created_at,
    };

    KELAHIRAN_DB[record.id] = record;
  }

  for (const row of anakRows) {
    const jenisKelamin: JenisKelaminAnak =
      row.sex === 'Jantan' || row.sex === 'Betina' ? row.sex : 'Tidak Diketahui';
    const jenis: JenisAnak = row.condition === 'Hidup' ? 'Hidup' : 'Lahir Mati';

    const record: AnakRecord = {
      id:               row.id,              // Supabase registrasi_anak.id — used as ANAK_DB key
      kelahiranId:      row.kelahiran_id,
      jenisKelamin,
      jenis,
      beratLahir:       row.birth_weight_kg ?? null,
      warna:            null,
      ras:              '',
      kondisiAwal:      'Sehat',
      catatan:          row.notes ?? null,
      statusRegistrasi: row.livestock_id != null ? 'Sudah Didaftarkan' : 'Belum Didaftarkan',
      livestockId:      row.livestock_id ?? null,
      registeredDate:   row.livestock_id != null ? row.created_at.slice(0, 10) : null,
      createdDate:      row.created_at,
    };

    ANAK_DB[record.id] = record;
  }
}
