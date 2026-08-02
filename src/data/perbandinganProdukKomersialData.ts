// ─── Perbandingan Produk Komersial (Readiness) ────────────────────────────────
// PK-008: Menyiapkan struktur data agar Produk Komersial dapat DIBANDINGKAN
// (dua atau lebih) di masa mendatang — TANPA membuat halaman Compare, TANPA
// analisis otomatis, dan TANPA mengubah arsitektur aplikasi, Master Pakan,
// atau modul lain.
//
// Modul ini HANYA menyusun satu "kartu perbandingan" (snapshot) yang konsisten
// per produk, mengambil field yang sama untuk semua produk apa pun
// kategorinya, dari sumber Living Database yang sudah ada:
// • Konsentrat  → konsentratSeriData / konsentratMerekData / konsentratDetailData
// • Kategori lain → produkKomersialData (PRODUK_KOMERSIAL_LIST)
// • Data Nutrisi → nutrisiProdukKomersialData (PK-007)
//
// Tidak ada nilai yang direka-reka: field yang tidak tersedia untuk suatu
// produk dibiarkan NULL/undefined, bukan diisi nilai default palsu.
//
// Belum ada UI Compare dan belum ada logika AI (penjelasan perbedaan,
// kelebihan/kekurangan, rekomendasi) — itu dibangun pada fase terpisah,
// mengonsumsi struktur ini sebagai sumber data siap pakai.

import { KONSENTRAT_DETAIL_LIST, type KonsentratDetail } from './konsentratDetailData';
import type { StatusEntitas } from './produkKomersialLivingDB';
import { KATEGORI_UUID, PRODUK_KOMERSIAL_LIST, type ProdukKomersialItem } from './produkKomersialData';
import { getNutrisiStandarByUUID, type NutrisiStandarProdukKomersial } from './nutrisiProdukKomersialData';

// ─── Struktur Kartu Perbandingan ────────────────────────────────────────────────
// Field yang sama untuk SEMUA Produk Komersial, lintas kategori, agar bisa
// dijajarkan apa adanya oleh fitur Compare di masa depan.

export interface KartuPerbandinganProdukKomersial {
  // ── Relasi data — SATU-SATUNYA kunci yang boleh dipakai untuk join/lookup
  // antar entitas atau modul lain. Field non-relasi di bawah (brand, seri,
  // dll.) HANYA untuk tampilan — jangan pernah dipakai sebagai kunci relasi,
  // meskipun bertipe string dan tampak unik. ───────────────────────────────
  /** UUID produk — identitas permanen, relasi utama (PK-000A). Tidak pernah berubah. */
  produkUuid: string;
  /** UUID kategori (relasi ke KATEGORI_UUID) — bukan slug/nama kategori. */
  kategoriId: string;
  /** UUID brand/merek (relasi ke entitas brand) — bukan nama brand. */
  brandId: string;

  // ── Field pembanding — TAMPILAN SAJA, lihat contoh PK-008. Dilarang
  // dipakai sebagai kunci relasi; untuk relasi gunakan blok UUID di atas. ──
  /** Nama brand — label tampilan. Untuk relasi gunakan `brandId`. */
  brand: string | null;
  /** Nama seri/varian produk — label tampilan. Untuk relasi gunakan `produkUuid`. */
  seri: string | null;
  jenisProduk: string | null;
  targetTernak: string | null;
  fasePemeliharaan: string | null;
  bentukProduk: string | null;
  beratKemasan: string | null;
  statusProduksi: StatusEntitas | null;

  /** Data Nutrisi standar (PK-007) — struktur seragam, semua field opsional/null di dalamnya. */
  dataNutrisi: NutrisiStandarProdukKomersial;

  /** Komposisi bahan utama sesuai info resmi produsen, jika tersedia. */
  komposisi: string[] | null;

  updatedAt: string;
}

/** Kartu kosong (semua field pembanding null) — dipakai saat produk belum punya detail Living Database. */
function kartuKosong(item: ProdukKomersialItem): KartuPerbandinganProdukKomersial {
  return {
    produkUuid: item.id,
    kategoriId: item.kategoriId,
    brandId: item.brandId,
    brand: item.merek ?? null,
    seri: item.seri ?? null,
    jenisProduk: item.jenisProduk ?? null,
    targetTernak: null,
    fasePemeliharaan: null,
    bentukProduk: null,
    beratKemasan: item.beratKemasan ?? null,
    statusProduksi: item.statusProduksi ?? null,
    dataNutrisi: getNutrisiStandarByUUID(item.id),
    komposisi: null,
    updatedAt: item.updatedAt,
  };
}

/** Bangun kartu perbandingan dari satu record detail Konsentrat (Living Database lengkap — PK-004). */
function kartuDariKonsentrat(detail: KonsentratDetail): KartuPerbandinganProdukKomersial {
  // KonsentratDetail tidak menyimpan kategoriId sendiri (satu kategori tetap
  // "Konsentrat" untuk seluruh Living Database ini) — mengambil dari
  // KATEGORI_UUID registry adalah lookup relasi UUID→UUID yang sah, BUKAN
  // relasi berbasis nama/slug.
  return {
    produkUuid: detail.seriId,
    kategoriId: KATEGORI_UUID['konsentrat'],
    brandId: detail.brandId,
    brand: detail.namaBrand,
    seri: detail.namaSeri,
    jenisProduk: detail.jenisProduk,
    targetTernak: detail.targetTernak,
    fasePemeliharaan: detail.fasePemeliharaan,
    bentukProduk: detail.bentukProduk,
    beratKemasan: detail.kemasan[0]?.berat ?? null,
    statusProduksi: detail.statusProduksi,
    dataNutrisi: getNutrisiStandarByUUID(detail.seriId),
    komposisi: detail.komposisi ?? null,
    updatedAt: detail.updatedAt,
  };
}

// ─── Registry Hidup ─────────────────────────────────────────────────────────────
// Dibangun dari Living Database saat modul dimuat. Konsentrat sudah memiliki
// detail lengkap (PK-004); kategori lain memakai PRODUK_KOMERSIAL_LIST yang
// masih kosong saat ini (PK-001) — akan otomatis terisi seiring data
// ditambahkan Admin, tanpa perlu mengubah modul ini.

function bangunRegistryPerbandingan(): Map<string, KartuPerbandinganProdukKomersial> {
  const registry = new Map<string, KartuPerbandinganProdukKomersial>();

  for (const detail of KONSENTRAT_DETAIL_LIST) {
    registry.set(detail.seriId, kartuDariKonsentrat(detail));
  }

  for (const item of PRODUK_KOMERSIAL_LIST) {
    // Konsentrat sudah dipetakan lebih lengkap dari Living Database detail di atas — jangan ditimpa.
    if (item.kategoriId === KATEGORI_UUID['konsentrat']) continue;
    if (registry.has(item.id)) {
      console.error(`[PK-008] Duplikasi produkUuid pada registry perbandingan: ${item.id}`);
      continue;
    }
    registry.set(item.id, kartuKosong(item));
  }

  return registry;
}

const REGISTRY_PERBANDINGAN: Map<string, KartuPerbandinganProdukKomersial> = bangunRegistryPerbandingan();

// ─── API Publik — Baca ─────────────────────────────────────────────────────────

/** Ambil kartu perbandingan satu produk via UUID. Undefined jika UUID tidak dikenal. */
export function getKartuPerbandingan(produkUuid: string): KartuPerbandinganProdukKomersial | undefined {
  return REGISTRY_PERBANDINGAN.get(produkUuid);
}

/** Seluruh kartu perbandingan yang terdaftar (live), untuk keperluan fitur Compare/AI di masa depan. */
export function getAllKartuPerbandingan(): KartuPerbandinganProdukKomersial[] {
  return Array.from(REGISTRY_PERBANDINGAN.values());
}

/**
 * Ambil kartu perbandingan untuk sekumpulan UUID produk (dua atau lebih),
 * dalam urutan UUID yang diminta. UUID yang tidak dikenal dilewati (bukan
 * error) agar pemanggil dapat menampilkan sisanya.
 *
 * Ini murni pengambilan data sejajar — TIDAK menghitung perbedaan, kelebihan/
 * kekurangan, atau rekomendasi apa pun. Itu domain AI/Analisis yang dibangun
 * pada fase terpisah.
 */
export function getKartuPerbandinganUntukUUID(produkUuidList: string[]): KartuPerbandinganProdukKomersial[] {
  return produkUuidList
    .map(uuid => REGISTRY_PERBANDINGAN.get(uuid))
    .filter((kartu): kartu is KartuPerbandinganProdukKomersial => kartu !== undefined);
}
