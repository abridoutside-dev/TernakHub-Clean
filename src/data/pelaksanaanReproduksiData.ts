// ─── RP-003: Pelaksanaan Program Reproduksi ─────────────────────────────────
// Pelaksanaan adalah aktivitas nyata di lapangan berdasarkan sebuah Program
// Reproduksi. Satu Program dapat memiliki satu atau banyak Pelaksanaan
// (contoh: Program Kawin Koloni → Hari ke-1, Hari ke-3, Hari ke-5, Hari ke-8).
//
// Peserta TIDAK disimpan di Pelaksanaan — selalu dibaca dari Program induknya
// (pejantanIds/betinaIds) dan tidak dapat diubah dari sini; peserta hanya
// dapat diubah melalui Program Reproduksi (RP-002).
//
// Belum menentukan hasil bunting/gagal — Pelaksanaan hanya mencatat bahwa
// aktivitas telah dilakukan. Belum ada Monitoring/Pemeriksaan Kebuntingan
// (roadmap RP-004+).

import { generateUUID } from '../utils/uuid';
import {
  PROGRAM_REPRODUKSI_DB,
  METODE_REPRODUKSI_LIST,
  getProgramById,
  validateProgramPeserta,
  type MetodeReproduksi,
  type ReproduksiProgramRecord,
} from './reproduksiProgramData';

// ─── Status Pelaksanaan ──────────────────────────────────────────────────────

export const STATUS_PELAKSANAAN_LIST = ['Direncanakan', 'Dilaksanakan', 'Ditunda', 'Dibatalkan'] as const;

export type StatusPelaksanaan = typeof STATUS_PELAKSANAAN_LIST[number];

// ─── Lampiran (Foto / Dokumen — belum mendukung video) ──────────────────────
// Tidak ada backend upload di aplikasi ini (konvensi yang sama dipakai modul
// lain seperti Tambah Stok Pakan/Obat) — lampiran disimpan sebagai metadata.

export const JENIS_LAMPIRAN_LIST = ['Foto', 'Dokumen'] as const;

export type JenisLampiran = typeof JENIS_LAMPIRAN_LIST[number];

export type LampiranPelaksanaan = {
  id: string;
  jenis: JenisLampiran;
  namaFile: string;
};

// ─── Pelaksanaan Record ──────────────────────────────────────────────────────

export type PelaksanaanRecord = {
  id: string;              // UUID v4
  programId: string;       // relasi ke ReproduksiProgramRecord.id
  nomorPelaksanaan: string; // contoh: RP-2026-001-P1
  tanggal: string;         // yyyy-mm-dd
  jam: string;             // HH:mm
  lokasi: string;
  petugas: string;
  metode: MetodeReproduksi;
  status: StatusPelaksanaan;
  catatan: string | null;
  lampiran: LampiranPelaksanaan[];
  createdDate: string;
  updatedDate: string;
};

export type PelaksanaanInput = {
  tanggal: string;
  jam: string;
  lokasi: string;
  petugas: string;
  metode: MetodeReproduksi;
  status: StatusPelaksanaan;
  catatan: string | null;
  lampiran: LampiranPelaksanaan[];
};

// ─── Registry (empty — populated at runtime) ────────────────────────────────

export const PELAKSANAAN_REPRODUKSI_DB: Record<string, PelaksanaanRecord> = {};

// ─── Validasi ────────────────────────────────────────────────────────────────

/** Program dianggap aktif (dapat menerima Pelaksanaan baru) selama belum Selesai/Dibatalkan. */
export function isProgramAktifUntukPelaksanaan(program: ReproduksiProgramRecord): boolean {
  return program.status !== 'Selesai' && program.status !== 'Dibatalkan';
}

function validatePelaksanaanFields(input: PelaksanaanInput): string | null {
  if (!input.tanggal)        return 'Tanggal wajib diisi.';
  if (!input.jam)             return 'Jam wajib diisi.';
  if (!input.lokasi.trim())   return 'Lokasi wajib diisi.';
  if (!input.petugas.trim())  return 'Petugas wajib diisi.';
  return null;
}

/**
 * Validasi lengkap sebelum membuat/mengubah Pelaksanaan:
 * program harus ada, program masih aktif (belum Selesai/Dibatalkan), peserta
 * program valid, dan field pelaksanaan itu sendiri valid.
 * Throws dengan pesan siap tampil ke user bila gagal.
 */
export function validatePelaksanaan(programId: string, input: PelaksanaanInput): ReproduksiProgramRecord {
  const program = getProgramById(programId);
  if (!program) throw new Error('Program Reproduksi tidak ditemukan.');
  if (!isProgramAktifUntukPelaksanaan(program)) {
    throw new Error(`Tidak dapat membuat Pelaksanaan — Program berstatus "${program.status}".`);
  }
  const pesertaError = validateProgramPeserta(program.betinaIds, program.pejantanIds, program.dataIB);
  if (pesertaError) throw new Error(`Peserta Program tidak valid: ${pesertaError}`);

  const fieldError = validatePelaksanaanFields(input);
  if (fieldError) throw new Error(fieldError);

  return program;
}

// ─── Nomor Pelaksanaan ───────────────────────────────────────────────────────
// Format: <nomorProgram>-P<urutan>, urutan dihitung per program.

function nextNomorPelaksanaan(program: ReproduksiProgramRecord): string {
  const countForProgram = Object.values(PELAKSANAAN_REPRODUKSI_DB)
    .filter((p) => p.programId === program.id).length;
  return `${program.nomorProgram}-P${countForProgram + 1}`;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export function getPelaksanaanListByProgram(programId: string): PelaksanaanRecord[] {
  return Object.values(PELAKSANAAN_REPRODUKSI_DB)
    .filter((p) => p.programId === programId)
    .sort((a, b) => (a.tanggal + a.jam < b.tanggal + b.jam ? 1 : -1));
}

export function getPelaksanaanById(id: string): PelaksanaanRecord | null {
  return PELAKSANAAN_REPRODUKSI_DB[id] ?? null;
}

/** Throws with a user-facing message when validation fails. */
export function addPelaksanaan(programId: string, input: PelaksanaanInput): PelaksanaanRecord {
  const program = validatePelaksanaan(programId, input);

  const today = new Date().toISOString().slice(0, 10);
  const record: PelaksanaanRecord = {
    id: generateUUID(),
    programId,
    nomorPelaksanaan: nextNomorPelaksanaan(program),
    tanggal: input.tanggal,
    jam: input.jam,
    lokasi: input.lokasi.trim(),
    petugas: input.petugas.trim(),
    metode: input.metode,
    status: input.status,
    catatan: input.catatan?.trim() || null,
    lampiran: [...input.lampiran],
    createdDate: today,
    updatedDate: today,
  };
  PELAKSANAAN_REPRODUKSI_DB[record.id] = record;
  return record;
}

/** Throws with a user-facing message when validation fails. Peserta is never editable here. */
export function updatePelaksanaan(id: string, input: PelaksanaanInput): PelaksanaanRecord {
  const existing = PELAKSANAAN_REPRODUKSI_DB[id];
  if (!existing) throw new Error('Pelaksanaan tidak ditemukan.');

  // Editing an existing Pelaksanaan still requires the parent Program to be active,
  // unless this edit is only marking it Dibatalkan/Ditunda (status change should not
  // be blocked just because the program itself later became inactive elsewhere).
  const program = getProgramById(existing.programId);
  if (!program) throw new Error('Program Reproduksi tidak ditemukan.');

  const fieldError = validatePelaksanaanFields(input);
  if (fieldError) throw new Error(fieldError);

  const updated: PelaksanaanRecord = {
    ...existing,
    tanggal: input.tanggal,
    jam: input.jam,
    lokasi: input.lokasi.trim(),
    petugas: input.petugas.trim(),
    metode: input.metode,
    status: input.status,
    catatan: input.catatan?.trim() || null,
    lampiran: [...input.lampiran],
    updatedDate: new Date().toISOString().slice(0, 10),
  };
  PELAKSANAAN_REPRODUKSI_DB[id] = updated;
  return updated;
}

/** Batalkan — tidak dapat membatalkan Pelaksanaan yang sudah Dilaksanakan (sudah terjadi). */
export function cancelPelaksanaan(id: string): PelaksanaanRecord {
  const existing = PELAKSANAAN_REPRODUKSI_DB[id];
  if (!existing) throw new Error('Pelaksanaan tidak ditemukan.');
  if (existing.status === 'Dilaksanakan') throw new Error('Pelaksanaan yang sudah Dilaksanakan tidak dapat dibatalkan.');
  if (existing.status === 'Dibatalkan') return existing;

  const updated: PelaksanaanRecord = {
    ...existing,
    status: 'Dibatalkan',
    updatedDate: new Date().toISOString().slice(0, 10),
  };
  PELAKSANAAN_REPRODUKSI_DB[id] = updated;
  return updated;
}

// ─── populatePelaksanaanFromDb — FLOW-003M21 ──────────────────────────────────
// Hydrates PELAKSANAAN_REPRODUKSI_DB from pelaksanaan_reproduksi rows.
// Must run AFTER populateProgramsFromDb (nomorPelaksanaan references programNomor).
//
// Deferred (FUTURE FEATURE):
//   jam, lokasi, petugas not stored in pelaksanaan_reproduksi → default ''.
//   status defaults to 'Dilaksanakan' (only executed records are persisted).
//   lampiran not persisted to DB.

type PelaksanaanDbRowMinimal = {
  id:             string;
  program_id:     string;
  execution_date: string;
  method:         string | null;
  notes:          string | null;
  created_at:     string;
};

export function populatePelaksanaanFromDb(rows: PelaksanaanDbRowMinimal[]): void {
  if (rows.length === 0) return;

  for (const key of Object.keys(PELAKSANAAN_REPRODUKSI_DB)) {
    delete PELAKSANAAN_REPRODUKSI_DB[key];
  }

  const programCounters = new Map<string, number>();

  for (const row of rows) {
    const n = (programCounters.get(row.program_id) ?? 0) + 1;
    programCounters.set(row.program_id, n);

    const programNomor     = PROGRAM_REPRODUKSI_DB[row.program_id]?.nomorProgram ?? '';
    const nomorPelaksanaan = programNomor ? `${programNomor}-P${n}` : `P${n}`;
    const validMetode      = (METODE_REPRODUKSI_LIST as readonly string[]).includes(row.method ?? '');

    const record: PelaksanaanRecord = {
      id:               row.id,
      programId:        row.program_id,
      nomorPelaksanaan,
      tanggal:          row.execution_date,
      jam:              '',
      lokasi:           '',
      petugas:          '',
      metode:           validMetode ? (row.method as MetodeReproduksi) : 'Kawin Alami',
      status:           'Dilaksanakan',
      catatan:          row.notes ?? null,
      lampiran:         [],
      createdDate:      row.created_at,
      updatedDate:      row.created_at,
    };

    PELAKSANAAN_REPRODUKSI_DB[record.id] = record;
  }
}
