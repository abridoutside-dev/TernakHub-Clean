// ─── Produk Komersial — Pencarian Lintas Living Database (PK-009) ────────────
// Mendukung pencarian berdasarkan Brand, Seri Produk, Nama Produk, Target
// Ternak, Jenis Produk, dan Produsen — lintas seluruh kategori Produk
// Komersial (Konsentrat sudah memiliki Living Database penuh; kategori lain
// dicari melalui PRODUK_KOMERSIAL_LIST begitu datanya tersedia).

import { KONSENTRAT_MEREK_LIST, getMerekStatus } from './konsentratMerekData';
import { KONSENTRAT_SERI_LIST } from './konsentratSeriData';
import { KONSENTRAT_DETAIL_LIST } from './konsentratDetailData';
import { PRODUK_KOMERSIAL_LIST, getKategoriSlugByUUID } from './produkKomersialData';
import type { StatusEntitas } from './produkKomersialLivingDB';

export interface HasilPencarianProdukKomersial {
  uuid: string;
  jenis: 'Brand' | 'Seri Produk' | 'Detail Produk';
  nama: string;
  brand?: string;
  seri?: string;
  targetTernak?: string;
  jenisProduk?: string;
  produsen?: string;
  status: StatusEntitas;
  href?: string;
}

/**
 * Cari lintas Brand / Seri Produk / Nama Produk / Target Ternak / Jenis
 * Produk / Produsen. Pencocokan case-insensitive substring pada seluruh
 * field yang relevan. Data Arsip tetap ikut dicari (tetap dapat digunakan
 * untuk referensi & riwayat).
 */
export function searchProdukKomersial(query: string): HasilPencarianProdukKomersial[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hasil: HasilPencarianProdukKomersial[] = [];

  for (const merek of KONSENTRAT_MEREK_LIST) {
    const haystack = [merek.nama, merek.produsen, merek.negaraAsal].join(' ').toLowerCase();
    if (haystack.includes(q)) {
      hasil.push({
        uuid: merek.uuid, jenis: 'Brand', nama: merek.nama, produsen: merek.produsen,
        status: getMerekStatus(merek), href: `/stok-pakan/komersial/konsentrat/${merek.slug}`,
      });
    }
  }

  for (const seri of KONSENTRAT_SERI_LIST) {
    const brand = KONSENTRAT_MEREK_LIST.find(m => m.uuid === seri.brandId);
    const haystack = [seri.namaSeri, seri.namaProduk, seri.targetTernak, brand?.nama ?? ''].join(' ').toLowerCase();
    if (haystack.includes(q)) {
      hasil.push({
        uuid: seri.uuid, jenis: 'Seri Produk', nama: seri.namaProduk,
        brand: brand?.nama, seri: seri.namaSeri, targetTernak: seri.targetTernak,
        status: seri.statusProduksi, href: `/stok-pakan/komersial/konsentrat/${seri.brandSlug}/${seri.slug}`,
      });
    }
  }

  for (const detail of KONSENTRAT_DETAIL_LIST) {
    const haystack = [
      detail.namaProduk, detail.namaBrand, detail.namaSeri,
      detail.jenisProduk, detail.targetTernak, detail.produsen.nama,
    ].join(' ').toLowerCase();
    if (haystack.includes(q)) {
      const seri = KONSENTRAT_SERI_LIST.find(s => s.uuid === detail.seriId);
      hasil.push({
        uuid: detail.uuid, jenis: 'Detail Produk', nama: detail.namaProduk,
        brand: detail.namaBrand, seri: detail.namaSeri, targetTernak: detail.targetTernak,
        jenisProduk: detail.jenisProduk, produsen: detail.produsen.nama,
        status: detail.statusProduksi,
        href: seri ? `/stok-pakan/komersial/konsentrat/${seri.brandSlug}/${seri.slug}` : undefined,
      });
    }
  }

  for (const item of PRODUK_KOMERSIAL_LIST) {
    const haystack = [item.nama, item.merek, item.produsen, item.seri ?? '', item.jenisProduk ?? ''].join(' ').toLowerCase();
    if (haystack.includes(q)) {
      hasil.push({
        uuid: item.id, jenis: 'Detail Produk', nama: item.nama,
        brand: item.merek, seri: item.seri, jenisProduk: item.jenisProduk ?? getKategoriSlugByUUID(item.kategoriId),
        produsen: item.produsen, status: item.statusProduksi ?? 'Aktif',
      });
    }
  }

  return hasil;
}
