// ─── RP-005: Pemeriksaan Kebuntingan (Pregnancy Examination) ────────────────
// Pemeriksaan Kebuntingan mencatat HASIL PEMERIKSAAN sebuah Program Reproduksi
// — apakah betina yang diperiksa bunting, tidak bunting, belum pasti, atau
// perlu diperiksa ulang. Modul ini TIDAK mencatat kelahiran dan TIDAK membuat
// data anak (offspring) — itu adalah roadmap RP-006 (Kebuntingan) dan
// selanjutnya (Kelahiran/Sapih).
//
// Satu Program dapat memiliki banyak Pemeriksaan Kebuntingan (mis. pemeriksaan
// ulang bila hasil pertama "Tidak Pasti" atau "Perlu Pemeriksaan Ulang"). Setiap
// Pemeriksaan yang dibuat = tepat satu Event pada Timeline Reproduksi — UUID
// record ini juga berfungsi sebagai Event UUID (mengikuti pola MonitoringRecord).

import { generateUUID } from '../utils/uuid';
import {
  getProgramById,
  type ReproduksiProgramRecord,
} from './reproduksiProgramData';
import {
  isProgramAktifUntukPelaksanaan,
  JENIS_LAMPIRAN_LIST,
  type JenisLampiran,
} from './pelaksanaanReproduksiData';
import {
  type EventType,
  type ReproduksiEvent,
  getTimelineForProgram,
} from './monitoringReproduksiData';

// ─── Metode Pemeriksaan ──────────────────────────────────────────────────────
// Arsitektur harus dapat diperluas untuk metode baru di masa depan — tambahkan
// ke daftar ini saja, tidak perlu mengubah bentuk data lain.

export const METODE_PEMERIKSAAN_LIST = [
  'Observasi Visual',
  'Palpasi',
  'USG (Ultrasonografi)',
  'Uji Laboratorium',
  'Pemeriksaan Manual',
  'Lainnya',
] as const;

export type MetodePemeriksaan = typeof METODE_PEMERIKSAAN_LIST[number];

// ─── Hasil Pemeriksaan ───────────────────────────────────────────────────────

export const HASIL_PEMERIKSAAN_LIST = [
  'Bunting',
  'Tidak Bunting',
  'Tidak Pasti',
  'Perlu Pemeriksaan Ulang',
] as const;

export type HasilPemeriksaan = typeof HASIL_PEMERIKSAAN_LIST[number];

/**
 * Pesan tindak lanjut untuk tiap kemungkinan hasil — murni informasional
 * (ditampilkan di UI). Tidak memicu perubahan data otomatis:
 *  - Bunting              → lanjutan pencatatan kebuntingan adalah roadmap RP-006.
 *  - Tidak Bunting         → pemeriksaan ditutup; kelanjutan/akhir Program adalah keputusan user.
 *  - Tidak Pasti           → rekomendasi pemeriksaan ulang.
 *  - Perlu Pemeriksaan Ulang → user dapat menjadwalkan Pemeriksaan Kebuntingan baru pada Program yang sama.
 */
export function followUpMessageForHasil(hasil: HasilPemeriksaan): string {
  switch (hasil) {
    case 'Bunting':
      return 'Bunting terkonfirmasi — pencatatan kebuntingan lebih lanjut akan tersedia pada roadmap Kebuntingan (RP-006).';
    case 'Tidak Bunting':
      return 'Pemeriksaan ditutup. Program dapat dilanjutkan atau diakhiri sesuai keputusan pengguna.';
    case 'Tidak Pasti':
      return 'Hasil belum pasti — direkomendasikan untuk melakukan pemeriksaan ulang.';
    case 'Perlu Pemeriksaan Ulang':
      return 'Perlu pemeriksaan ulang — jadwalkan Pemeriksaan Kebuntingan baru untuk Program ini.';
  }
}

// ─── Lampiran (Foto / Dokumen — mengikuti konvensi Pelaksanaan/Monitoring) ──

export type LampiranPemeriksaan = {
  id: string;
  jenis: JenisLampiran;
  namaFile: string;
};

export { JENIS_LAMPIRAN_LIST };

// ─── Pemeriksaan Kebuntingan Record ──────────────────────────────────────────

export type PemeriksaanKebuntinganRecord = {
  id: string;                        // UUID v4 — juga berfungsi sebagai Event UUID
  programId: string;                 // relasi ke ReproduksiProgramRecord.id
  livestockId: string | null;        // betina yang diperiksa — null jika tidak diketahui atau program seed
  tanggalPemeriksaan: string;        // yyyy-mm-dd
  petugas: string;                   // pemeriksa (examiner)
  metode: MetodePemeriksaan;
  perkiraanUsiaKebuntingan: string | null; // opsional, mis. "6 minggu"
  hasil: HasilPemeriksaan;
  catatan: string | null;
  lampiran: LampiranPemeriksaan[];
  createdDate: string;
  updatedDate: string;
};

export type PemeriksaanKebuntinganInput = {
  livestockId: string | null;
  tanggalPemeriksaan: string;
  petugas: string;
  metode: MetodePemeriksaan;
  perkiraanUsiaKebuntingan: string | null;
  hasil: HasilPemeriksaan;
  catatan: string | null;
  lampiran: LampiranPemeriksaan[];
};

// ─── Registry (empty — populated at runtime) ────────────────────────────────

export const PEMERIKSAAN_KEBUNTINGAN_DB: Record<string, PemeriksaanKebuntinganRecord> = {};

// ─── Validasi ────────────────────────────────────────────────────────────────

function validatePemeriksaanFields(input: PemeriksaanKebuntinganInput): string | null {
  if (!input.tanggalPemeriksaan) return 'Tanggal Pemeriksaan wajib diisi.';
  if (!input.petugas.trim())     return 'Petugas (Pemeriksa) wajib diisi.';
  if (!input.metode)             return 'Metode Pemeriksaan wajib dipilih.';
  if (!input.hasil)              return 'Hasil Pemeriksaan wajib dipilih.';
  return null;
}

/**
 * Validasi lengkap sebelum membuat/mengubah Pemeriksaan Kebuntingan: Program
 * harus ada dan masih aktif (belum Selesai/Dibatalkan), dan field pemeriksaan
 * itu sendiri valid. Tidak memeriksa/mengubah data kelahiran atau anak (offspring)
 * — di luar cakupan roadmap ini. Throws dengan pesan siap tampil ke user.
 */
export function validatePemeriksaan(programId: string, input: PemeriksaanKebuntinganInput): ReproduksiProgramRecord {
  if (!programId) throw new Error('Pemeriksaan Kebuntingan wajib terkait dengan satu Program Reproduksi.');

  const program = getProgramById(programId);
  if (!program) throw new Error('Program Reproduksi tidak ditemukan.');
  if (!isProgramAktifUntukPelaksanaan(program)) {
    throw new Error(`Tidak dapat mencatat Pemeriksaan Kebuntingan — Program berstatus "${program.status}".`);
  }

  const fieldError = validatePemeriksaanFields(input);
  if (fieldError) throw new Error(fieldError);

  return program;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

function sortTerbaruKeTerlama(a: PemeriksaanKebuntinganRecord, b: PemeriksaanKebuntinganRecord): number {
  if (a.tanggalPemeriksaan !== b.tanggalPemeriksaan) return a.tanggalPemeriksaan < b.tanggalPemeriksaan ? 1 : -1;
  return a.createdDate < b.createdDate ? 1 : -1;
}

export function getPemeriksaanListByProgram(programId: string): PemeriksaanKebuntinganRecord[] {
  return Object.values(PEMERIKSAAN_KEBUNTINGAN_DB)
    .filter((p) => p.programId === programId)
    .sort(sortTerbaruKeTerlama);
}

export function getPemeriksaanById(id: string): PemeriksaanKebuntinganRecord | null {
  return PEMERIKSAAN_KEBUNTINGAN_DB[id] ?? null;
}

/** Throws with a user-facing message when validation fails. One call = one Pemeriksaan = one Event. */
export function addPemeriksaanKebuntingan(programId: string, input: PemeriksaanKebuntinganInput): PemeriksaanKebuntinganRecord {
  validatePemeriksaan(programId, input);

  const today = new Date().toISOString().slice(0, 10);
  const record: PemeriksaanKebuntinganRecord = {
    id: generateUUID(),
    programId,
    livestockId: input.livestockId ?? null,
    tanggalPemeriksaan: input.tanggalPemeriksaan,
    petugas: input.petugas.trim(),
    metode: input.metode,
    perkiraanUsiaKebuntingan: input.perkiraanUsiaKebuntingan?.trim() || null,
    hasil: input.hasil,
    catatan: input.catatan?.trim() || null,
    lampiran: [...input.lampiran],
    createdDate: today,
    updatedDate: today,
  };
  PEMERIKSAAN_KEBUNTINGAN_DB[record.id] = record;
  return record;
}

/** Throws with a user-facing message when validation fails. Program relation cannot be moved via edit. */
export function updatePemeriksaanKebuntingan(id: string, input: PemeriksaanKebuntinganInput): PemeriksaanKebuntinganRecord {
  const existing = PEMERIKSAAN_KEBUNTINGAN_DB[id];
  if (!existing) throw new Error('Pemeriksaan Kebuntingan tidak ditemukan.');

  validatePemeriksaan(existing.programId, input);

  const updated: PemeriksaanKebuntinganRecord = {
    ...existing,
    tanggalPemeriksaan: input.tanggalPemeriksaan,
    petugas: input.petugas.trim(),
    metode: input.metode,
    perkiraanUsiaKebuntingan: input.perkiraanUsiaKebuntingan?.trim() || null,
    hasil: input.hasil,
    catatan: input.catatan?.trim() || null,
    lampiran: [...input.lampiran],
    updatedDate: new Date().toISOString().slice(0, 10),
  };
  PEMERIKSAAN_KEBUNTINGAN_DB[id] = updated;
  return updated;
}

// ─── Timeline integration ────────────────────────────────────────────────────
// Pemeriksaan Kebuntingan tidak menyimpan Timeline-nya sendiri — ia hanya
// menambahkan dirinya sebagai Event ke Timeline Reproduksi yang sudah ada
// (RP-004). getTimelineForProgram (RP-004) tidak diubah; fungsi di bawah ini
// hanya menggabungkan hasilnya dengan Event Pemeriksaan Kebuntingan.

const PEMERIKSAAN_EVENT_TYPE: EventType = 'Pemeriksaan Kebuntingan';

function pemeriksaanToEvent(p: PemeriksaanKebuntinganRecord): ReproduksiEvent {
  return {
    eventId: p.id,
    programId: p.programId,
    eventType: PEMERIKSAAN_EVENT_TYPE,
    timestamp: p.tanggalPemeriksaan,
    jam: null,
    petugas: p.petugas,
    catatan: `Hasil: ${p.hasil}${p.catatan ? ` — ${p.catatan}` : ''}`,
    source: 'monitoring',
    lampiran: p.lampiran,
  };
}

function sortEventsTerbaruKeTerlama(a: ReproduksiEvent, b: ReproduksiEvent): number {
  const aKey = `${a.timestamp}T${a.jam ?? '00:00'}`;
  const bKey = `${b.timestamp}T${b.jam ?? '00:00'}`;
  return aKey === bKey ? 0 : (aKey < bKey ? 1 : -1);
}

/**
 * Timeline lengkap satu Program termasuk Pemeriksaan Kebuntingan: event
 * siklus-hidup Program + Monitoring (RP-004, tidak diubah) + Pemeriksaan
 * Kebuntingan (RP-005), terbaru → terlama.
 */
export function getFullTimelineForProgram(program: ReproduksiProgramRecord): ReproduksiEvent[] {
  const events = [
    ...getTimelineForProgram(program),
    ...getPemeriksaanListByProgram(program.id).map(pemeriksaanToEvent),
  ];
  return events.sort(sortEventsTerbaruKeTerlama);
}

// ─── populatePemeriksaanKebuntinganFromDb — FLOW-003M21/M26 ──────────────────
// Hydrates PEMERIKSAAN_KEBUNTINGAN_DB from pemeriksaan_kebuntingan rows.
// livestock_id is now mapped to livestockId in the in-memory record.
//
// Deferred (FUTURE FEATURE): lampiran not persisted to DB.

type PemeriksaanDbRowMinimal = {
  id:            string;
  program_id:    string;
  livestock_id:  string;
  check_date:    string;
  method:        string | null;
  result:        string;
  days_pregnant: number | null;
  examiner:      string | null;
  notes:         string | null;
  created_at:    string;
};

export function populatePemeriksaanKebuntinganFromDb(rows: PemeriksaanDbRowMinimal[]): void {
  if (rows.length === 0) return;

  for (const key of Object.keys(PEMERIKSAAN_KEBUNTINGAN_DB)) {
    delete PEMERIKSAAN_KEBUNTINGAN_DB[key];
  }

  const validMetode = new Set<string>(METODE_PEMERIKSAAN_LIST);
  const validHasil  = new Set<string>(HASIL_PEMERIKSAAN_LIST);

  for (const row of rows) {
    const perkiraanUsia = row.days_pregnant != null ? `${row.days_pregnant} hari` : null;

    const record: PemeriksaanKebuntinganRecord = {
      id:                       row.id,
      programId:                row.program_id,
      livestockId:              row.livestock_id || null,
      tanggalPemeriksaan:       row.check_date,
      petugas:                  row.examiner ?? '',
      metode:                   validMetode.has(row.method ?? '')
                                  ? (row.method as MetodePemeriksaan)
                                  : 'Observasi Visual',
      perkiraanUsiaKebuntingan: perkiraanUsia,
      hasil:                    validHasil.has(row.result)
                                  ? (row.result as HasilPemeriksaan)
                                  : 'Tidak Pasti',
      catatan:                  row.notes ?? null,
      lampiran:                 [],
      createdDate:              row.created_at,
      updatedDate:              row.created_at,
    };

    PEMERIKSAAN_KEBUNTINGAN_DB[record.id] = record;
  }
}
