// ─── Detail Penyakit — Adapter Referensi Obat (read-only) ────────────────────
// SP-004: Adapter baca-saja yang menghubungkan Detail Penyakit dengan Master
// Obat dan Produk Komersial Obat TANPA mengubah modul-modul tersebut sama
// sekali (obatData.ts, obatDetailData.ts, produkKomersialObatData.ts tetap
// utuh). Mengikuti pola PK Readiness Integration: bangun adapter berdiri
// sendiri, jangan edit modul target.

import { getObatById, type ObatItem } from './obatData';
import { OBAT_PRODUK_LIST, type ObatProdukKomersial } from './produkKomersialObatData';

export interface ReferensiObatPenyakit {
  obat: ObatItem;
  produkKomersial: ObatProdukKomersial[];
}

/**
 * Untuk setiap id obat generik (ObatItem.id) yang direferensikan oleh sebuah
 * penyakit, kembalikan data obat + daftar produk komersial (status aktif)
 * yang mengandung obat tersebut (relasi via ObatProdukKomersial.masterObatUuid).
 * Obat yang id-nya tidak ditemukan di Master Obat dilewati secara aman.
 */
export function getReferensiObatDenganProduk(obatIds: string[]): ReferensiObatPenyakit[] {
  const hasil: ReferensiObatPenyakit[] = [];
  for (const id of obatIds) {
    const obat = getObatById(id);
    if (!obat) continue;
    const produkKomersial = OBAT_PRODUK_LIST.filter(
      (p) => p.masterObatUuid === obat.uuid && p.status === 'aktif',
    );
    hasil.push({ obat, produkKomersial });
  }
  return hasil;
}
