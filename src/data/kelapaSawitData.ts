// ─── Master Pakan — Kelapa Sawit Sub Category ────────────────────────────────
// MP-020: List data for "Kelapa Sawit" parent category.
// Single raw-material ingredients sourced from the oil palm plant and its
// direct industrial by-products only.
// EXCLUDES: silase pelepah sawit, sawit fermentasi, complete feed, konsentrat,
// TMR, and any multi-ingredient formulas.

import type { KategoriItem } from './jagungData';
import { KATEGORI_ITEM_STYLE } from './jagungData';
export { KATEGORI_ITEM_STYLE };

export interface KelapaSawitItem {
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

export const KELAPA_SAWIT_KATEGORI_ORDER: KategoriItem[] = [
  'Hasil Utama',
  'Hasil Samping',
  'Limbah Industri',
];

export const KELAPA_SAWIT_DB: KelapaSawitItem[] = [
  // ── Hasil Utama ─────────────────────────────────────────────────────────────
  {
    id: 'buah-kelapa-sawit',
    nama: 'Buah Kelapa Sawit',
    namaLatin: 'Elaeis guineensis Jacq.',
    namaLain: 'Fresh Fruit Bunch, FFB, Tandan Buah Segar',
    deskripsi: 'Buah kelapa sawit segar (TBS) secara keseluruhan. Jarang diberikan langsung; umumnya dijadikan acuan untuk menghitung kontribusi nutrisi seluruh fraksinya dalam ransum.',
    kategoriItem: 'Hasil Utama',
    estimasiHarga: 2200,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'inti-sawit',
    nama: 'Inti Sawit',
    namaLatin: 'Elaeis guineensis Jacq. — endosperm',
    namaLain: 'Palm Kernel, Palm Nut Kernel',
    deskripsi: 'Biji keras di dalam cangkang kelapa sawit. Kaya lemak lauric (48–53%) dan protein sedang (7–9%); bahan baku utama pembuatan minyak dan bungkil inti sawit.',
    kategoriItem: 'Hasil Utama',
    estimasiHarga: 4500,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  // ── Hasil Samping ────────────────────────────────────────────────────────────
  {
    id: 'pelepah-kelapa-sawit',
    nama: 'Pelepah Kelapa Sawit',
    namaLatin: 'Elaeis guineensis Jacq. — frond',
    namaLain: 'Oil Palm Frond, OPF, Palm Frond',
    deskripsi: 'Pelepah daun kelapa sawit yang dipangkas saat pemeliharaan. Sumber hijauan berlimpah di perkebunan sawit; serat tinggi, palatabilitas sedang, dan dapat diberikan segar atau dicacah.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 400,
    hargaUpdated: '01 Jul 2026',
    dataLengkap: true,
    updatedAt: '01 Jul 2026',
  },
  {
    id: 'daun-kelapa-sawit',
    nama: 'Daun Kelapa Sawit',
    namaLatin: 'Elaeis guineensis Jacq. — folium',
    namaLain: 'Oil Palm Leaf, Palm Leaf',
    deskripsi: 'Helaian daun yang diambil dari pelepah kelapa sawit. Lebih lunak dari pelepah; mengandung protein kasar ±10% (BK) dan serat kasar tinggi. Cocok sebagai hijauan suplemen sapi.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 300,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'tandan-kosong-kelapa-sawit',
    nama: 'Tandan Kosong Kelapa Sawit (TKKS)',
    namaLatin: null,
    namaLain: 'Empty Fruit Bunch, EFB, OPEFB',
    deskripsi: 'Rangka tandan buah kelapa sawit setelah buah disterilisasi dan dilepas. Serat kasar sangat tinggi (NDF ±80%); digunakan sebagai roughage atau bahan biogas. Nilai pakan terbatas.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 200,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'cangkang-inti-sawit',
    nama: 'Cangkang Inti Sawit',
    namaLatin: null,
    namaLain: 'Palm Kernel Shell, PKS, Palm Shell',
    deskripsi: 'Kulit keras yang membungkus inti sawit, dihasilkan dari proses pemecahan biji di pabrik pengolahan. Serat dan lignin sangat tinggi; nilai pakan sangat rendah, umumnya digunakan sebagai bahan bakar.',
    kategoriItem: 'Hasil Samping',
    estimasiHarga: 300,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  // ── Limbah Industri ──────────────────────────────────────────────────────────
  {
    id: 'serat-perasan-sawit',
    nama: 'Serat Perasan Sawit',
    namaLatin: null,
    namaLain: 'Palm Pressed Fiber, PPF, Palm Mesocarp Fiber, Serabut Mesokarp',
    deskripsi: 'Serat mesokarp buah sawit sisa pemerasan minyak di pabrik CPO. Serat kasar tinggi (NDF ±65%), lemak residu ±5%; digunakan sebagai sumber serat dan energi dalam ransum ruminansia.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 600,
    hargaUpdated: '05 Jul 2026',
    dataLengkap: true,
    updatedAt: '05 Jul 2026',
  },
  {
    id: 'bungkil-inti-sawit',
    nama: 'Bungkil Inti Sawit (PKM)',
    namaLatin: null,
    namaLain: 'Palm Kernel Meal, PKM, Palm Kernel Cake, Bungkil Sawit',
    deskripsi: 'Residu padat dari ekstraksi minyak inti sawit secara solvent. Protein 14–18%, serat NDF ±75%; suplemen protein dan serat ekonomis untuk ruminansia. Gunakan ≤30% ransum.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 2800,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'bungkil-ekspeller-inti-sawit',
    nama: 'Bungkil Ekspeller Inti Sawit (PKE)',
    namaLatin: null,
    namaLain: 'Palm Kernel Expeller, PKE, Expeller Palm Kernel Cake',
    deskripsi: 'Residu padat dari ekstraksi minyak inti sawit secara mekanis (ekspeller). Lemak residual lebih tinggi (6–10%) dibanding PKM; energi lebih baik namun protein sedikit lebih rendah.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 3200,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'lumpur-sawit',
    nama: 'Lumpur Sawit',
    namaLatin: null,
    namaLain: 'Palm Oil Mill Effluent Sludge, POME Sludge, Palm Sludge',
    deskripsi: 'Padatan yang diendapkan dari limbah cair pabrik sawit (POME). Protein kasar ±12%, lemak ±10%; harus dikeringkan sebelum digunakan. Sumber protein dan lemak alternatif yang murah untuk ruminansia.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 800,
    hargaUpdated: '01 Jul 2026',
    dataLengkap: true,
    updatedAt: '01 Jul 2026',
  },
  {
    id: 'solid-sawit',
    nama: 'Solid Sawit (Decanter Solid)',
    namaLatin: null,
    namaLain: 'Decanter Cake, Palm Decanter Solid, Palm Oil Decanter',
    deskripsi: 'Padatan yang dipisahkan dari POME menggunakan decanter sentrifugal. Kadar air lebih rendah dari lumpur sawit basah; protein kasar ±12%, lemak ±8%. Digunakan langsung atau setelah pengeringan.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 600,
    hargaUpdated: '01 Jul 2026',
    dataLengkap: true,
    updatedAt: '01 Jul 2026',
  },
  {
    id: 'minyak-sawit-mentah-pakan',
    nama: 'Minyak Sawit Mentah (Feed Grade)',
    namaLatin: null,
    namaLain: 'Crude Palm Oil Feed Grade, CPO Feed, Palm Acid Oil',
    deskripsi: 'Minyak sawit kualitas pakan (off-spec atau free fatty acid tinggi). Densitas energi sangat tinggi (ME >8.500 kcal/kg); ditambahkan ≤5% ransum untuk meningkatkan energi tanpa mengurangi kecernaan serat.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 11000,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'minyak-inti-sawit-pakan',
    nama: 'Minyak Inti Sawit (Feed Grade)',
    namaLatin: null,
    namaLain: 'Palm Kernel Oil Feed Grade, CPKO Feed',
    deskripsi: 'Minyak inti sawit kualitas pakan. Kaya asam lemak laurat (C12:0 ±48%); digunakan sebagai sumber energi dan lemak lauric yang mendukung kesehatan sistem pencernaan ternak muda.',
    kategoriItem: 'Limbah Industri',
    estimasiHarga: 13000,
    hargaUpdated: '05 Jul 2026',
    dataLengkap: true,
    updatedAt: '05 Jul 2026',
  },
];

// ─── Computed Helpers ─────────────────────────────────────────────────────────

export function getKelapaSawitList(): KelapaSawitItem[] {
  return KELAPA_SAWIT_DB;
}

export function getKelapaSawitById(id: string): KelapaSawitItem | undefined {
  return KELAPA_SAWIT_DB.find(item => item.id === id);
}

export function computeKelapaSawitRingkasan() {
  const items     = KELAPA_SAWIT_DB;
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
