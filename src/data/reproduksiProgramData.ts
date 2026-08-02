// ─── RP-002: Program Reproduksi ─────────────────────────────────────────────
// Program Reproduksi adalah induk dari seluruh proses reproduksi — semua
// aktivitas reproduksi (pelaksanaan, pemeriksaan kebuntingan, kelahiran, sapih)
// pada roadmap berikutnya akan bergantung pada sebuah Program Reproduksi.
//
// PROGRAM_DB intentionally starts empty — populated only when users create
// a program through the UI. No CRUD beyond Program Reproduksi itself is
// implemented here (belum ada Pelaksanaan/Pemeriksaan Kebuntingan/Kelahiran/Sapih).

import { generateUUID } from '../utils/uuid';

// ─── Metode Reproduksi ──────────────────────────────────────────────────────
// Minimal 4 metode wajib didukung; 3 lainnya disediakan sebagai struktur yang
// dapat dikembangkan (belum ada workflow khusus untuk masing-masing metode).

export const METODE_REPRODUKSI_LIST = [
  'Kawin Alami',
  'Kawin Koloni',
  'Titip Kawin',
  'Inseminasi Buatan (IB)',
  'Embryo Transfer',
  'IVF',
  'Lainnya',
] as const;

export type MetodeReproduksi = typeof METODE_REPRODUKSI_LIST[number];

// ─── Status Program ─────────────────────────────────────────────────────────

export const STATUS_PROGRAM_LIST = ['Draft', 'Berjalan', 'Selesai', 'Dibatalkan'] as const;

export type StatusProgram = typeof STATUS_PROGRAM_LIST[number];

/** Progress kasar berdasarkan status — belum ada tahapan pelaksanaan nyata. */
export function progressForStatus(status: StatusProgram): number {
  switch (status) {
    case 'Draft':      return 0;
    case 'Berjalan':   return 50;
    case 'Selesai':    return 100;
    case 'Dibatalkan': return 0;
  }
}

// ─── Data IB (Inseminasi Buatan) ────────────────────────────────────────────
// Dipakai ketika program tidak memiliki pejantan fisik terdaftar — memenuhi
// validasi "minimal 1 pejantan ATAU Data IB".

export type DataIB = {
  kodeStraw: string;
  asalPejantan: string;
};

// ─── Program Reproduksi Record ──────────────────────────────────────────────

export type ReproduksiProgramRecord = {
  id: string;                 // UUID v4
  nomorProgram: string;       // contoh: RP-2026-001
  namaProgram: string;
  metode: MetodeReproduksi;
  lokasi: string;
  petugas: string;
  tanggalMulai: string;       // yyyy-mm-dd
  targetSelesai: string;      // yyyy-mm-dd
  status: StatusProgram;
  catatan: string | null;
  /** Peserta pejantan — mendukung 1 atau lebih (livestock id). */
  pejantanIds: string[];
  /** Peserta betina — mendukung 1 hingga banyak (livestock id). */
  betinaIds: string[];
  /** Data IB — hanya relevan bila program tidak memiliki pejantan fisik. */
  dataIB: DataIB | null;
  createdDate: string;
  updatedDate: string;
};

export type ProgramInput = {
  namaProgram: string;
  metode: MetodeReproduksi;
  lokasi: string;
  petugas: string;
  tanggalMulai: string;
  targetSelesai: string;
  status: StatusProgram;
  catatan: string | null;
  pejantanIds: string[];
  betinaIds: string[];
  dataIB: DataIB | null;
};

// ─── Registry (empty — populated at runtime) ────────────────────────────────

export const PROGRAM_REPRODUKSI_DB: Record<string, ReproduksiProgramRecord> = {};

// ─── Validasi ────────────────────────────────────────────────────────────────
// Minimal 1 betina, dan minimal salah satu: 1 pejantan ATAU Data IB terisi.

export function hasValidDataIB(dataIB: DataIB | null): boolean {
  return !!dataIB && dataIB.kodeStraw.trim().length > 0 && dataIB.asalPejantan.trim().length > 0;
}

export function validateProgramPeserta(betinaIds: string[], pejantanIds: string[], dataIB: DataIB | null): string | null {
  if (betinaIds.length < 1) return 'Program harus memiliki minimal 1 betina.';
  if (pejantanIds.length < 1 && !hasValidDataIB(dataIB)) {
    return 'Program harus memiliki minimal 1 pejantan atau Data IB (kode straw & asal pejantan).';
  }
  return null;
}

function validateProgramFields(input: ProgramInput): string | null {
  if (!input.namaProgram.trim())   return 'Nama Program wajib diisi.';
  if (!input.lokasi.trim())        return 'Lokasi wajib diisi.';
  if (!input.petugas.trim())       return 'Petugas wajib diisi.';
  if (!input.tanggalMulai)         return 'Tanggal Mulai wajib diisi.';
  if (!input.targetSelesai)        return 'Target Selesai wajib diisi.';
  return validateProgramPeserta(input.betinaIds, input.pejantanIds, input.dataIB);
}

// ─── Nomor Program ───────────────────────────────────────────────────────────
// Format: RP-<tahun>-<urutan 3 digit>, urutan dihitung dari tahun yang sama.

function nextNomorProgram(tanggalMulai: string): string {
  const year = (tanggalMulai || '').slice(0, 4) || String(new Date().getFullYear());
  const countThisYear = Object.values(PROGRAM_REPRODUKSI_DB)
    .filter((p) => p.nomorProgram.startsWith(`RP-${year}-`)).length;
  const seq = String(countThisYear + 1).padStart(3, '0');
  return `RP-${year}-${seq}`;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export function getProgramList(): ReproduksiProgramRecord[] {
  return Object.values(PROGRAM_REPRODUKSI_DB)
    .sort((a, b) => (a.createdDate < b.createdDate ? 1 : -1));
}

export function getProgramById(id: string): ReproduksiProgramRecord | null {
  return PROGRAM_REPRODUKSI_DB[id] ?? null;
}

/** Throws with a user-facing message when validation fails. */
export function addProgram(input: ProgramInput): ReproduksiProgramRecord {
  const error = validateProgramFields(input);
  if (error) throw new Error(error);

  const today = input.tanggalMulai || new Date().toISOString().slice(0, 10);
  const record: ReproduksiProgramRecord = {
    id: generateUUID(),
    nomorProgram: nextNomorProgram(input.tanggalMulai),
    namaProgram: input.namaProgram.trim(),
    metode: input.metode,
    lokasi: input.lokasi.trim(),
    petugas: input.petugas.trim(),
    tanggalMulai: input.tanggalMulai,
    targetSelesai: input.targetSelesai,
    status: input.status,
    catatan: input.catatan?.trim() || null,
    pejantanIds: [...input.pejantanIds],
    betinaIds: [...input.betinaIds],
    dataIB: hasValidDataIB(input.dataIB) ? input.dataIB : null,
    createdDate: today,
    updatedDate: today,
  };
  PROGRAM_REPRODUKSI_DB[record.id] = record;
  return record;
}

/** Throws with a user-facing message when validation fails. */
export function updateProgram(id: string, input: ProgramInput): ReproduksiProgramRecord {
  const existing = PROGRAM_REPRODUKSI_DB[id];
  if (!existing) throw new Error('Program Reproduksi tidak ditemukan.');
  const error = validateProgramFields(input);
  if (error) throw new Error(error);

  const updated: ReproduksiProgramRecord = {
    ...existing,
    namaProgram: input.namaProgram.trim(),
    metode: input.metode,
    lokasi: input.lokasi.trim(),
    petugas: input.petugas.trim(),
    tanggalMulai: input.tanggalMulai,
    targetSelesai: input.targetSelesai,
    status: input.status,
    catatan: input.catatan?.trim() || null,
    pejantanIds: [...input.pejantanIds],
    betinaIds: [...input.betinaIds],
    dataIB: hasValidDataIB(input.dataIB) ? input.dataIB : null,
    updatedDate: new Date().toISOString().slice(0, 10),
  };
  PROGRAM_REPRODUKSI_DB[id] = updated;
  return updated;
}

/** Batalkan — hanya valid dari Draft/Berjalan, tidak dapat membatalkan program Selesai. */
export function cancelProgram(id: string): ReproduksiProgramRecord {
  const existing = PROGRAM_REPRODUKSI_DB[id];
  if (!existing) throw new Error('Program Reproduksi tidak ditemukan.');
  if (existing.status === 'Selesai') throw new Error('Program yang sudah Selesai tidak dapat dibatalkan.');
  if (existing.status === 'Dibatalkan') return existing;

  const updated: ReproduksiProgramRecord = {
    ...existing,
    status: 'Dibatalkan',
    updatedDate: new Date().toISOString().slice(0, 10),
  };
  PROGRAM_REPRODUKSI_DB[id] = updated;
  return updated;
}

// ─── populateProgramsFromDb — FLOW-003M21 ─────────────────────────────────────
// Hydrates PROGRAM_REPRODUKSI_DB from reproduksi_programs rows fetched by
// useReproduksi. Must run BEFORE populatePelaksanaanFromDb so that
// nomorPelaksanaan can reference nomorProgram.
//
// Deferred (FUTURE FEATURE):
//   participant_ids uuid[] merges betina + pejantan IDs — split requires a
//   livestock cross-reference; pejantanIds/betinaIds left empty on read-path.
//   lokasi, petugas not stored in reproduksi_programs → default ''.

type ReproduksiProgramDbRowMinimal = {
  id:            string;
  name:          string;
  status:        'Aktif' | 'Selesai' | 'Dihentikan' | 'Draft';
  start_date:    string | null;
  end_date:      string | null;
  mating_method: string | null;
  notes:         string | null;
  created_at:    string;
  updated_at:    string;
};

function mapProgramStatusFromDb(s: string): StatusProgram {
  switch (s) {
    case 'Aktif':      return 'Berjalan';
    case 'Selesai':    return 'Selesai';
    case 'Dihentikan': return 'Dibatalkan';
    default:           return 'Draft';
  }
}

export function populateProgramsFromDb(rows: ReproduksiProgramDbRowMinimal[]): void {
  if (rows.length === 0) return; // nothing from DB — keep in-memory data

  for (const key of Object.keys(PROGRAM_REPRODUKSI_DB)) {
    delete PROGRAM_REPRODUKSI_DB[key];
  }

  // Generate nomorProgram sorted by created_at, counted within calendar year.
  const sorted       = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const yearCounters = new Map<string, number>();

  for (const row of sorted) {
    const year = row.created_at.slice(0, 4);
    const n    = (yearCounters.get(year) ?? 0) + 1;
    yearCounters.set(year, n);

    const nomorProgram = `RP-${year}-${String(n).padStart(3, '0')}`;
    const metode: MetodeReproduksi =
      (METODE_REPRODUKSI_LIST as readonly string[]).includes(row.mating_method ?? '')
        ? (row.mating_method as MetodeReproduksi)
        : 'Lainnya';

    const record: ReproduksiProgramRecord = {
      id:            row.id,
      nomorProgram,
      namaProgram:   row.name,
      metode,
      lokasi:        '',
      petugas:       '',
      tanggalMulai:  row.start_date ?? '',
      targetSelesai: row.end_date ?? '',
      status:        mapProgramStatusFromDb(row.status),
      catatan:       row.notes ?? null,
      pejantanIds:   [],  // FUTURE FEATURE: split from participant_ids uuid[]
      betinaIds:     [],  // FUTURE FEATURE: split from participant_ids uuid[]
      dataIB:        null,
      createdDate:   row.created_at,
      updatedDate:   row.updated_at,
    };

    PROGRAM_REPRODUKSI_DB[record.id] = record;
  }
}
