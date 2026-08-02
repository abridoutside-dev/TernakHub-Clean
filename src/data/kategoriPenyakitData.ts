// ─── Kategori Penyakit per Jenis Ternak ──────────────────────────────────────
// SP-002: 12 kategori dasar penyakit yang mungkin berlaku untuk ternak.
// UUID komposit: kp-{ternakSlug}-{kategoriSlug} agar setiap kombinasi unik.
// SP-005: jumlahPenyakit sekarang dihitung secara nyata dari DAFTAR_PENYAKIT
// (daftarPenyakitData.ts) berdasarkan kombinasi kategoriSlug + jenisTernak.
// Kategori tanpa penyakit nyata untuk jenis ternak tertentu tidak dikembalikan
// oleh getKategoriByTernakSlug — agar setiap jenis ternak hanya menampilkan
// kategori penyakit yang benar-benar relevan untuknya.

import { getPenyakitByKategoriDanTernak } from './daftarPenyakitData';

export interface KategoriPenyakit {
  uuid: string;
  ternakUuid: string;
  slug: string;
  nama: string;
  deskripsi: string;
  icon: string;
  color: string;
  bg: string;
  jumlahPenyakit: number;
}

// ─── 12 Base Categories ───────────────────────────────────────────────────────

interface BaseKategori {
  slug: string;
  nama: string;
  deskripsi: string;
  icon: string;
  color: string;
  bg: string;
  jumlahPenyakit: number;
}

const BASE_KATEGORI: BaseKategori[] = [
  {
    slug: 'penyakit-bakteri',
    nama: 'Penyakit Bakteri',
    deskripsi: 'Infeksi yang disebabkan oleh bakteri patogen, seperti kolibasilosis, mastitis, dan septikemia.',
    icon: '🦠',
    color: '#c62828',
    bg: '#ffebee',
    jumlahPenyakit: 12,
  },
  {
    slug: 'penyakit-virus',
    nama: 'Penyakit Virus',
    deskripsi: 'Penyakit menular yang disebabkan oleh virus, seperti PMK, IBR, dan ND yang berdampak besar pada produktivitas.',
    icon: '🧬',
    color: '#6a1b9a',
    bg: '#f3e5f5',
    jumlahPenyakit: 10,
  },
  {
    slug: 'penyakit-parasit',
    nama: 'Penyakit Parasit',
    deskripsi: 'Infestasi parasit internal (cacing, protozoa) dan eksternal (caplak, kutu) yang mengganggu kesehatan ternak.',
    icon: '🪱',
    color: '#558b2f',
    bg: '#f1f8e9',
    jumlahPenyakit: 8,
  },
  {
    slug: 'penyakit-jamur',
    nama: 'Penyakit Jamur',
    deskripsi: 'Infeksi jamur (mikosis) pada kulit maupun organ dalam, termasuk ringworm dan aspergillosis.',
    icon: '🍄',
    color: '#6d4c41',
    bg: '#efebe9',
    jumlahPenyakit: 5,
  },
  {
    slug: 'gangguan-pencernaan',
    nama: 'Gangguan Pencernaan',
    deskripsi: 'Masalah pada saluran pencernaan, termasuk bloat, diare, dan gangguan rumen pada ternak ruminansia.',
    icon: '🥣',
    color: '#00695c',
    bg: '#e0f2f1',
    jumlahPenyakit: 7,
  },
  {
    slug: 'gangguan-pernapasan',
    nama: 'Gangguan Pernapasan',
    deskripsi: 'Kelainan pada sistem respirasi, seperti pneumonia dan bronkitis, yang sering muncul pada kondisi kandang lembap.',
    icon: '🌬️',
    color: '#0277bd',
    bg: '#e1f5fe',
    jumlahPenyakit: 6,
  },
  {
    slug: 'gangguan-reproduksi',
    nama: 'Gangguan Reproduksi',
    deskripsi: 'Kelainan pada sistem reproduksi, seperti retensi plasenta, endometritis, dan gangguan siklus estrus.',
    icon: '🐣',
    color: '#ad1457',
    bg: '#fce4ec',
    jumlahPenyakit: 8,
  },
  {
    slug: 'gangguan-nutrisi-metabolik',
    nama: 'Gangguan Nutrisi & Metabolik',
    deskripsi: 'Gangguan akibat defisiensi atau ketidakseimbangan nutrisi, seperti milk fever, ketosis, dan defisiensi mineral.',
    icon: '🍽️',
    color: '#e65100',
    bg: '#fff3e0',
    jumlahPenyakit: 9,
  },
  {
    slug: 'gangguan-kulit',
    nama: 'Gangguan Kulit',
    deskripsi: 'Kelainan kulit seperti dermatitis, luka, dan iritasi akibat infeksi, alergi, atau faktor lingkungan.',
    icon: '🩹',
    color: '#ff7043',
    bg: '#fbe9e7',
    jumlahPenyakit: 6,
  },
  {
    slug: 'keracunan',
    nama: 'Keracunan',
    deskripsi: 'Kondisi akibat konsumsi pakan, tanaman, atau zat kimia beracun yang membahayakan kesehatan ternak.',
    icon: '☠️',
    color: '#b71c1c',
    bg: '#ffcdd2',
    jumlahPenyakit: 5,
  },
  {
    slug: 'cedera-trauma',
    nama: 'Cedera & Trauma',
    deskripsi: 'Luka fisik, patah tulang, dan trauma lain akibat kecelakaan, perkelahian antar ternak, atau penanganan yang tidak tepat.',
    icon: '🦴',
    color: '#546e7a',
    bg: '#eceff1',
    jumlahPenyakit: 4,
  },
  {
    slug: 'lainnya',
    nama: 'Lainnya',
    deskripsi: 'Kondisi kesehatan ternak lain yang tidak masuk kategori utama di atas.',
    icon: '📦',
    color: '#607d8b',
    bg: '#eceff1',
    jumlahPenyakit: 3,
  },
];

// ─── Lookup Function ──────────────────────────────────────────────────────────

/**
 * Kembalikan daftar Kategori Penyakit yang relevan untuk jenis ternak tertentu.
 * UUID dibentuk dari kombinasi ternakSlug + kategoriSlug agar unik per pasangan.
 * jumlahPenyakit dihitung nyata dari DAFTAR_PENYAKIT; kategori dengan 0 penyakit
 * nyata untuk ternak ini tidak disertakan (kategori tidak relevan untuk ternak
 * tersebut).
 */
export function getKategoriByTernakSlug(
  ternakSlug: string,
  ternakUuid: string,
): KategoriPenyakit[] {
  return BASE_KATEGORI
    .map((base) => ({
      ...base,
      uuid: `kp-${ternakSlug}-${base.slug}`,
      ternakUuid,
      jumlahPenyakit: getPenyakitByKategoriDanTernak(base.slug, ternakSlug).length,
    }))
    .filter((k) => k.jumlahPenyakit > 0);
}

export function getKategoriBySlug(
  ternakSlug: string,
  ternakUuid: string,
  kategoriSlug: string,
): KategoriPenyakit | undefined {
  return getKategoriByTernakSlug(ternakSlug, ternakUuid).find(
    (k) => k.slug === kategoriSlug,
  );
}
