// ─── Master Obat — Validation & Referential Integrity (SO-006) ──────────────
// Thin, reusable entry point over the validation/integrity checks that live
// next to their data (to avoid a circular import between the three
// Kategori/Sub Kategori/Detail Obat registries). Used by both the CRUD form
// sheets (MasterObatTab / MasterObatSubKategori / MasterObatDetail) and the
// Import/Export pipeline, so the two paths can never disagree on what counts
// as valid data.

import { getKategoriObatBySlug, isDuplicateKategoriNama, canDeactivateKategori } from '../data/masterObatKategoriData';
import { getSubKategoriByUuid, isDuplicateSubKategoriNama, canDeactivateSubKategori } from '../data/masterObatSubKategoriData';
import { isDuplicateDetailObatNama, canDeactivateDetailObat, type StatusObat } from '../data/masterObatDetailData';

export interface FieldValidationResult {
  valid: boolean;
  error?: string;
}

const VALID_STATUS = new Set(['Aktif', 'Nonaktif']);

/** Nama wajib diisi, tidak boleh hanya spasi, dan unik (case-insensitive, trimmed). */
export function validateKategoriNama(nama: string, excludeUuid?: string): FieldValidationResult {
  const trimmed = nama.trim();
  if (!trimmed) return { valid: false, error: 'Nama wajib diisi.' };
  if (isDuplicateKategoriNama(trimmed, excludeUuid)) return { valid: false, error: 'Nama sudah digunakan.' };
  return { valid: true };
}

/** Sub Kategori: nama valid + unik dalam Kategori yang sama + parent Kategori benar-benar ada. */
export function validateSubKategoriInput(
  kategoriSlug: string, nama: string, excludeUuid?: string,
): FieldValidationResult {
  if (!getKategoriObatBySlug(kategoriSlug)) {
    return { valid: false, error: 'Data referensi tidak valid: kategori induk tidak ditemukan.' };
  }
  const trimmed = nama.trim();
  if (!trimmed) return { valid: false, error: 'Nama wajib diisi.' };
  if (isDuplicateSubKategoriNama(kategoriSlug, trimmed, excludeUuid)) {
    return { valid: false, error: 'Nama sudah digunakan.' };
  }
  return { valid: true };
}

/** Detail Obat: nama valid + unik dalam Sub Kategori yang sama + parent Sub Kategori ada + status valid. */
export function validateDetailObatInput(
  subKategoriUuid: string, nama: string, status: string, excludeUuid?: string,
): FieldValidationResult {
  if (!getSubKategoriByUuid(subKategoriUuid)) {
    return { valid: false, error: 'Data referensi tidak valid: sub kategori induk tidak ditemukan.' };
  }
  const trimmed = nama.trim();
  if (!trimmed) return { valid: false, error: 'Nama wajib diisi.' };
  if (isDuplicateDetailObatNama(subKategoriUuid, trimmed, excludeUuid)) {
    return { valid: false, error: 'Nama sudah digunakan.' };
  }
  if (!VALID_STATUS.has(status)) {
    return { valid: false, error: 'Status tidak valid.' };
  }
  return { valid: true };
}

// Re-exported so callers only need to import from this one validation module.
export { canDeactivateKategori, canDeactivateSubKategori, canDeactivateDetailObat };
export type { StatusObat };
