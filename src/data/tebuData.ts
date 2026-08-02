// ─── Master Pakan — Tebu Sub Category ────────────────────────────────────────
// MP-022: List data for "Tebu" parent category.
// Single raw-material ingredients sourced from sugarcane plant and its direct
// industrial by-products only.
// EXCLUDES: silase tebu, tebu fermentasi, complete feed, konsentrat, TMR,
// and any multi-ingredient formulas.

import type { KategoriItem } from './jagungData';
import { KATEGORI_ITEM_STYLE } from './jagungData';
export { KATEGORI_ITEM_STYLE };

export interface TebuItem {
  id: string;
  nama: string;
  namaLatin: string | null;
  namaLain: string;           // aliases for search
  deskripsi: string;
  kategoriItem: KategoriItem;
  estimasiHarga: number | null; // IDR/kg
  hargaUpdated: string;
  dataLengkap: boolean;
  updatedAt: string;
}

export const TEBU_KATEGORI_ORDER: KategoriItem[] = [
  'Hasil Utama',
  'Hasil Samping',
  'Limbah Industri',
];

export const TEBU_DB: TebuItem[] = [
  // ── Hasil Utama ─────────────────────────────────────────────────────────────
  {
    id: 'tebu-segar',
    nama: 'Tebu Segar',
    namaLatin: 'Saccharum officinarum L.',
    namaLain: 'Fresh Sugarcane, Whole Sugarcane',
    deskripsi: 'Batang tebu segar yang baru dipanen, termasuk kulit dan isi. Palatabilitas baik pada sapi dan kerbau; kaya gula mudah tercerna dan sedikit serat. Cocok diberikan langsung atau dicacah.',
    kategoriItem: 'Hasil Utama',
    estimasiHarga: 600,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'batang-tebu',
    nama: 'Batang Tebu',
    namaLatin: 'Saccharum officinarum L. — culm',
    namaLain: 'Sugarcane Stalk, Sugarcane Stem',
    deskripsi: 'Bagian batang tebu tanpa pucuk dan daun. Sumber energi fermentable (sukrosa 12–17%); diberikan cacah atau giling untuk meningkatkan konsumsi dan mengurangi pemborosan.',
    kategoriItem: 'Hasil Utama',
    estimasiHarga: 500,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'nira-tebu',
    nama: 'Nira Tebu',
    namaLatin: null,
    namaLain: 'Sugarcane Juice, Raw Sugarcane Juice',
    deskripsi: 'Cairan manis yang diperoleh dari pemerasan batang tebu. Kadar gula sangat tinggi (Brix 15–20%); digunakan sebagai sumber energi cepat atau palatabilitas enhancer dalam ransum.',
    kategoriItem: 'Hasil Utama',
    estimasiHarga: 1200,
    hargaUpdated: '05 Jul 2026',
    dataLengkap: true,
    updatedAt: '05 Jul 2026',
  },
  // ── Hasil Samping ────────────────────────────────────────────────────────────
  {
    id: 'pucuk-tebu',
    nama: 'Pucuk Tebu',
    namaLatin: 'Saccharum officinarum L. — apex',
    namaLain: 'Sugarcane Top, Sugarcane Shoot, Tops and Leaves',
    deskripsi: 'Bagian ujung tebu beserta daun muda yang dipotong saat panen. Kandungan protein kasar ±8%, palatabilitas baik; tersedia berlimpah saat musim giling dan dapat diberikan segar.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 300,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'daun-tebu',
    nama: 'Daun Tebu',
    namaLatin: 'Saccharum officinarum L. — folium',
    namaLain: 'Sugarcane Leaf, Cane Leaf',
    deskripsi: 'Daun tebu tua yang rontok atau dipangkas. Serat kasar tinggi (NDF ±65%), protein rendah (±4%); digunakan sebagai roughage murah atau alas kandang ternak ruminansia.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 200,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'gula-merah-tebu',
    nama: 'Gula Merah Tebu',
    namaLatin: null,
    namaLain: 'Brown Sugar Cane, Jaggery, Gula Jawa Tebu',
    deskripsi: 'Nira tebu yang dipekatkan hingga membentuk padatan coklat. Sumber energi cepat; digunakan sebagai palatabilitas enhancer atau sumber gula dalam ransum ternak sakit atau bunting.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 14000,
    hargaUpdated: '05 Jul 2026',
    dataLengkap: true,
    updatedAt: '05 Jul 2026',
  },
  {
    id: 'gula-kasar-tebu',
    nama: 'Gula Kasar Tebu (Raw Sugar)',
    namaLatin: null,
    namaLain: 'Raw Sugar, Turbinado Sugar, Gula Kristal Kasar',
    deskripsi: 'Gula kristal setengah jadi sebelum pemurnian penuh. Sukrosa ±96%; digunakan sebagai sumber energi cepat dalam ransum ternak, khususnya untuk mempercepat adaptasi pakan baru.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 10000,
    hargaUpdated: '05 Jul 2026',
    dataLengkap: true,
    updatedAt: '05 Jul 2026',
  },
  // ── Limbah Industri ──────────────────────────────────────────────────────────
  {
    id: 'ampas-tebu',
    nama: 'Ampas Tebu (Bagasse)',
    namaLatin: null,
    namaLain: 'Bagasse, Sugarcane Bagasse, Ampas Perasan Tebu',
    deskripsi: 'Serat batang tebu sisa pemerasan nira di pabrik gula. Serat kasar sangat tinggi (NDF ±75%), energi rendah; digunakan sebagai roughage pengganti jerami atau bahan baku biogas.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 300,
    hargaUpdated: '01 Jul 2026',
    dataLengkap: true,
    updatedAt: '01 Jul 2026',
  },
  {
    id: 'molases',
    nama: 'Molases / Tetes Tebu',
    namaLatin: null,
    namaLain: 'Molasses, Cane Molasses, Blackstrap Molasses, Tetes',
    deskripsi: 'Cairan kental coklat kehitaman sisa kristalisasi gula. Gula terlarut 48–55% (campuran sukrosa, glukosa, fruktosa); palatabilitas sangat baik. Sumber energi murah yang paling umum digunakan dalam ransum ternak.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 2500,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'blotong',
    nama: 'Blotong (Filter Cake)',
    namaLatin: null,
    namaLain: 'Press Mud, Filter Cake, Sugarcane Filter Cake, Blothong',
    deskripsi: 'Ampas penyaringan nira dari proses pemurnian di pabrik gula. Protein kasar ±6%, lemak ±10%, kaya fosfor dan kalsium; digunakan sebagai suplemen mineral organik dan sumber energi murah.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 400,
    hargaUpdated: '01 Jul 2026',
    dataLengkap: true,
    updatedAt: '01 Jul 2026',
  },
  {
    id: 'ampas-tebu-kering',
    nama: 'Ampas Tebu Kering',
    namaLatin: null,
    namaLain: 'Dried Bagasse, Bagasse Dried, Spent Bagasse',
    deskripsi: 'Ampas tebu yang telah dikeringkan untuk menurunkan kadar air. Lebih tahan simpan dan mudah ditransportasi; nilai nutrisi setara ampas segar namun lebih cocok untuk distribusi regional.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 600,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'vinasse-tebu',
    nama: 'Vinasse Tebu',
    namaLatin: null,
    namaLain: 'Cane Vinasse, Stillage, Spent Wash, Vinhoto',
    deskripsi: 'Cairan sisa fermentasi molases dalam produksi bioetanol. Kaya kalium, kalsium, dan nitrogen; digunakan sebagai suplemen mineral cair atau campuran pakan basah pada sapi potong.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 200,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
];

// ─── Computed Helpers ─────────────────────────────────────────────────────────

export function getTebuList(): TebuItem[] {
  return TEBU_DB;
}

export function getTebuById(id: string): TebuItem | undefined {
  return TEBU_DB.find(item => item.id === id);
}

export function computeTebuRingkasan() {
  const items     = TEBU_DB;
  const priced    = items.filter(i => i.estimasiHarga !== null).map(i => i.estimasiHarga as number);
  const hargaRata = priced.length > 0
    ? Math.round(priced.reduce((a, b) => a + b, 0) / priced.length)
    : null;
  const terakhir  = items.map(i => i.updatedAt).sort((a, b) => b.localeCompare(a))[0] ?? '—';
  const dataLengkap = items.filter(i => i.dataLengkap).length;

  return {
    totalReferensi: items.length,
    hargaRataRata:  hargaRata,
    terakhirUpdate: terakhir,
    dataLengkap,
  };
}
