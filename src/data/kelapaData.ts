// ─── Master Pakan — Kelapa Sub Category ──────────────────────────────────────
// MP-018: List data for "Kelapa" parent category.
// Single raw-material ingredients sourced directly from the coconut plant only.
// EXCLUDES: silase kelapa, kelapa fermentasi, complete feed, konsentrat, TMR,
// and any multi-ingredient formulas.

import type { KategoriItem } from './jagungData';
import { KATEGORI_ITEM_STYLE } from './jagungData';
export { KATEGORI_ITEM_STYLE };

export interface KelapaItem {
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

export const KELAPA_KATEGORI_ORDER: KategoriItem[] = [
  'Hasil Utama',
  'Hasil Samping',
  'Limbah Industri',
];

export const KELAPA_DB: KelapaItem[] = [
  // ── Hasil Utama ─────────────────────────────────────────────────────────────
  {
    id: 'kelapa-utuh',
    nama: 'Kelapa Utuh',
    namaLatin: 'Cocos nucifera L.',
    namaLain: 'Whole Coconut, Coconut',
    deskripsi: 'Buah kelapa segar secara keseluruhan termasuk daging, air, sabut, dan tempurung. Dapat diberikan langsung kepada ternak besar atau diolah lebih lanjut.',
    kategoriItem: 'Hasil Utama',
    estimasiHarga: 3500,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'daging-kelapa-segar',
    nama: 'Daging Kelapa Segar',
    namaLatin: 'Cocos nucifera L. — endosperm',
    namaLain: 'Fresh Coconut Meat, Coconut Flesh, Endosperm Kelapa',
    deskripsi: 'Bagian putih dalam buah kelapa sebelum dikeringkan. Kaya lemak (32–35% BK) dan energi; palatabilitas baik pada sapi dan kambing.',
    kategoriItem: 'Hasil Utama',
    estimasiHarga: 4500,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'air-kelapa',
    nama: 'Air Kelapa',
    namaLatin: null,
    namaLain: 'Coconut Water, Coconut Liquid Endosperm',
    deskripsi: 'Cairan alami dari dalam buah kelapa muda. Kaya kalium dan gula sederhana; digunakan sebagai suplemen minuman atau campuran ransum cair.',
    kategoriItem: 'Hasil Utama',
    estimasiHarga: 1000,
    hargaUpdated: '05 Jul 2026',
    dataLengkap: true,
    updatedAt: '05 Jul 2026',
  },
  {
    id: 'nira-kelapa',
    nama: 'Nira Kelapa',
    namaLatin: null,
    namaLain: 'Coconut Sap, Palm Sap, Coconut Toddy (fresh)',
    deskripsi: 'Getah manis yang disadap dari tandan bunga kelapa. Kaya gula sederhana (sukrosa 12–17%), digunakan sebagai sumber energi fermentable dalam ransum.',
    kategoriItem: 'Hasil Utama',
    estimasiHarga: 3000,
    hargaUpdated: '01 Jul 2026',
    dataLengkap: true,
    updatedAt: '01 Jul 2026',
  },
  // ── Hasil Samping ────────────────────────────────────────────────────────────
  {
    id: 'kopra',
    nama: 'Kopra',
    namaLatin: null,
    namaLain: 'Copra, Dried Coconut Meat',
    deskripsi: 'Daging kelapa yang telah dikeringkan (kadar air ≤6%). Sumber lemak dan energi tinggi; bahan baku utama untuk produksi minyak dan bungkil kelapa.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 7000,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'ampas-kelapa',
    nama: 'Ampas Kelapa',
    namaLatin: null,
    namaLain: 'Coconut Press Cake, Coconut Residue, Ampas Santan',
    deskripsi: 'Sisa perasan daging kelapa setelah santan diambil. Kaya serat (NDF ±65%) dan lemak residu; digunakan sebagai sumber serat dan energi dalam ransum ruminansia.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 1500,
    hargaUpdated: '06 Jul 2026',
    dataLengkap: true,
    updatedAt: '06 Jul 2026',
  },
  {
    id: 'kulit-ari-kelapa',
    nama: 'Kulit Ari Kelapa',
    namaLatin: null,
    namaLain: 'Testa Kelapa, Coconut Testa, Brown Skin Coconut',
    deskripsi: 'Lapisan tipis coklat yang melapisi daging kelapa. Mengandung tanin dan polifenol; digunakan dalam jumlah terbatas sebagai sumber serat.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 800,
    hargaUpdated: '01 Jul 2026',
    dataLengkap: true,
    updatedAt: '01 Jul 2026',
  },
  {
    id: 'sabut-kelapa',
    nama: 'Sabut Kelapa',
    namaLatin: null,
    namaLain: 'Coconut Husk, Coconut Coir, Coco Peat Sumber',
    deskripsi: 'Serat pembungkus buah kelapa antara kulit luar dan tempurung. Serat kasar sangat tinggi (>70% NDF); umumnya digunakan sebagai roughage atau bedding ternak.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 500,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'tempurung-kelapa',
    nama: 'Tempurung Kelapa',
    namaLatin: null,
    namaLain: 'Coconut Shell, Cangkang Kelapa',
    deskripsi: 'Lapisan keras di dalam sabut kelapa. Lignin sangat tinggi; nilai pakan sangat rendah, terutama digunakan sebagai arang aktif atau media filter air minum ternak.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 400,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'gula-kelapa',
    nama: 'Gula Kelapa',
    namaLatin: null,
    namaLain: 'Coconut Sugar, Palm Sugar, Gula Merah Kelapa',
    deskripsi: 'Nira kelapa yang dipekatkan hingga membentuk padatan atau pasta. Sumber energi cepat; digunakan sebagai palatabilitas enhancer atau sumber gula dalam ransum ternak.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 18000,
    hargaUpdated: '05 Jul 2026',
    dataLengkap: true,
    updatedAt: '05 Jul 2026',
  },
  {
    id: 'daun-kelapa',
    nama: 'Daun Kelapa',
    namaLatin: 'Cocos nucifera L. — folium',
    namaLain: 'Coconut Leaf, Pelepah Kelapa',
    deskripsi: 'Daun dan pelepah pohon kelapa. Serat kasar sangat tinggi; digunakan sebagai roughage darurat atau pakan substitusi hijauan pada saat kelangkaan.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 300,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'janur-kelapa',
    nama: 'Janur Kelapa',
    namaLatin: null,
    namaLain: 'Young Coconut Leaf, Daun Kelapa Muda',
    deskripsi: 'Daun kelapa yang masih muda berwarna kuning kehijauan. Lebih lunak dan palatabel dibanding daun tua; dapat diberikan langsung sebagai hijauan tambahan.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 500,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  // ── Limbah Industri ──────────────────────────────────────────────────────────
  {
    id: 'bungkil-kelapa',
    nama: 'Bungkil Kelapa',
    namaLatin: null,
    namaLain: 'Copra Meal, Coconut Meal, Coconut Cake, Bungkil Kopra',
    deskripsi: 'Residu padat dari ekstraksi minyak kopra. Protein 18–22%, serat tinggi (NDF ±55%). Suplemen protein ekonomis untuk ruminansia, pembatasan penggunaan pada unggas.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 4200,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'tepung-kelapa',
    nama: 'Tepung Kelapa',
    namaLatin: null,
    namaLain: 'Coconut Flour, Desiccated Coconut Flour',
    deskripsi: 'Daging kelapa yang dikeringkan dan digiling halus setelah sebagian lemak diekstrak. Serat tinggi (±14%) dan protein sedang; digunakan sebagai bahan campuran ransum.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 6500,
    hargaUpdated: '05 Jul 2026',
    dataLengkap: true,
    updatedAt: '05 Jul 2026',
  },
  {
    id: 'minyak-kelapa-pakan',
    nama: 'Minyak Kelapa (Feed Grade)',
    namaLatin: null,
    namaLain: 'Crude Coconut Oil, RBD Coconut Oil (feed)',
    deskripsi: 'Minyak kelapa kualitas pakan (tidak memenuhi standar pangan). Sumber energi sangat tinggi (ME >8.000 kcal/kg); ditambahkan dalam jumlah kecil (≤5%) untuk meningkatkan densitas energi ransum.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 12000,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
];

// ─── Computed Helpers ─────────────────────────────────────────────────────────

export function getKelapaList(): KelapaItem[] {
  return KELAPA_DB;
}

export function getKelapaById(id: string): KelapaItem | undefined {
  return KELAPA_DB.find(item => item.id === id);
}

export function computeKelapaRingkasan() {
  const items     = KELAPA_DB;
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
