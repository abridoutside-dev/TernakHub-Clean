/**
 * diagnosaKesehatanData.ts
 * ─────────────────────────────────────────────────────────────────
 * Source-of-truth for Diagnosa Kesehatan records (KH-003).
 *
 * Architecture:
 *  - All records live in DIAGNOSA_DB (in-memory, no backend yet)
 *  - addDiagnosa()              → create a new Diagnosa Selesai record, returns its id
 *  - getDiagnosa()              → lookup by id
 *  - getDiagnosaByPemeriksaan() → lookup by pemeriksaanId
 *
 * Sumber Diagnosa:
 *   'master_penyakit' → petugas memilih dari Tab Penyakit (penyakitUuid + namaPenyakit wajib)
 *   'manual'          → petugas ketik sendiri (namaDiagnosa wajib, catatan opsional)
 *
 * Status lifecycle:
 *   'Draft Diagnosa' → 'Diagnosa Selesai' (lanjut ke KH-004)
 */

import { generateUUID } from '../utils/uuid';

// ─── Enums / Literal Types ────────────────────────────────────────────────────

export type SumberDiagnosa = 'master_penyakit' | 'manual';
export type StatusDiagnosa = 'Draft Diagnosa' | 'Diagnosa Selesai';

// ─── Core Record Type ─────────────────────────────────────────────────────────

export type DiagnosaRecord = {
  /** UUID v4 */
  id: string;

  /** Links back to PemeriksaanRecord */
  pemeriksaanId: string;

  sumber: SumberDiagnosa;

  // ── Filled when sumber === 'master_penyakit' ────────────────────────────────
  /** UUID of the PenyakitListItem */
  penyakitUuid: string | null;
  /** Denormalized name at time of diagnosis */
  namaPenyakit: string | null;

  // ── Filled when sumber === 'manual' ─────────────────────────────────────────
  namaDiagnosa: string | null;
  catatan: string;

  // ── Metadata ────────────────────────────────────────────────────────────────
  status: StatusDiagnosa;
  /** ISO timestamp */
  createdAt: string;
  updatedAt: string;
};

// ─── Database ─────────────────────────────────────────────────────────────────

export const DIAGNOSA_DB: DiagnosaRecord[] = [];

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getDiagnosa(id: string): DiagnosaRecord | null {
  return DIAGNOSA_DB.find((r) => r.id === id) ?? null;
}

export function getDiagnosaByPemeriksaan(pemeriksaanId: string): DiagnosaRecord | null {
  return DIAGNOSA_DB.find((r) => r.pemeriksaanId === pemeriksaanId) ?? null;
}

export function getDiagnosaList(): DiagnosaRecord[] {
  return [...DIAGNOSA_DB].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type CreateDiagnosaInput = Omit<DiagnosaRecord, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

/**
 * Creates a new Diagnosa Selesai record.
 * Caller must also call markSiapDiagnosa(pemeriksaanId) from pemeriksaanKesehatanData.
 * After creation, callers navigate to KH-004 (/kesehatan-hewan/tindakan/:id).
 */
export function addDiagnosa(input: CreateDiagnosaInput): string {
  const now = new Date().toISOString();
  const record: DiagnosaRecord = {
    ...input,
    id:        generateUUID(),
    status:    'Diagnosa Selesai',
    createdAt: now,
    updatedAt:  now,
  };
  DIAGNOSA_DB.push(record);
  return record.id;
}
