// ─── Detail Penyakit — Adapter Referensi Obat (read-only) ────────────────────
// SP-004: Adapter baca-saja yang menghubungkan Detail Penyakit dengan Master
// Obat dan Produk Komersial Obat TANPA mengubah modul-modul tersebut sama
// sekali (obatData.ts, obatDetailData.ts, produkKomersialObatData.ts tetap
// utuh). Mengikuti pola PK Readiness Integration: bangun adapter berdiri
// sendiri, jangan edit modul target.

import { getObatById, type ObatItem } from './obatData';
import { getObatProdukKomersialList, type ObatProdukKomersial } from '../services/drugCommercialProductService';

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
export async function getReferensiObatDenganProduk(obatIds: string[]): Promise<ReferensiObatPenyakit[]> {
  const hasil: ReferensiObatPenyakit[] = [];
  const allProducts = await getObatProdukKomersialList();
  for (const id of obatIds) {
    const obat = getObatById(id);
    if (!obat) continue;
    const produkKomersial = allProducts.filter(
      (p) => p.masterObatUuid === obat.uuid && p.status === 'aktif',
    );
    hasil.push({ obat, produkKomersial });
  }
  return hasil;
}
