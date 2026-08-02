// ─── Produk Komersial Obat — Admin Validation (PKO-004) ──────────────────────
// Thin, reusable validation for the Kelola Brand / Kelola Produk forms. Mirrors
// masterObatValidation.ts so the two Admin surfaces behave identically.

import { isDuplicateObatBrandNama, isDuplicateObatProdukNama } from '../data/produkKomersialObatData';
import { getObatByUuid } from '../data/obatData';

export interface FieldValidationResult {
  valid: boolean;
  error?: string;
}

/** Brand: nama wajib diisi dan unik (case-insensitive, trimmed). */
export function validateObatBrandInput(nama: string, excludeUuid?: string): FieldValidationResult {
  const trimmed = nama.trim();
  if (!trimmed) return { valid: false, error: 'Nama Brand wajib diisi.' };
  if (isDuplicateObatBrandNama(trimmed, excludeUuid)) return { valid: false, error: 'Nama Brand sudah digunakan.' };
  return { valid: true };
}

/**
 * Produk: Brand wajib dipilih, Master Obat wajib dipilih (dan harus benar-benar
 * ada di Master Obat — SSOT), Nama Produk wajib diisi, dan tidak boleh
 * duplikat pada Brand yang sama.
 */
export function validateObatProdukInput(input: {
  brandId: string; masterObatUuid: string; nama: string;
}, excludeUuid?: string): FieldValidationResult {
  if (!input.brandId) return { valid: false, error: 'Brand wajib dipilih.' };
  if (!input.masterObatUuid || !getObatByUuid(input.masterObatUuid)) {
    return { valid: false, error: 'Master Obat wajib dipilih dari referensi yang valid.' };
  }
  const trimmed = input.nama.trim();
  if (!trimmed) return { valid: false, error: 'Nama Produk wajib diisi.' };
  if (isDuplicateObatProdukNama(input.brandId, trimmed, excludeUuid)) {
    return { valid: false, error: 'Nama Produk sudah digunakan pada Brand ini.' };
  }
  return { valid: true };
}
