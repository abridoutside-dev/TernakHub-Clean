// ─── Master Pakan — Rumput Sub Categories ────────────────────────────────────
// Level 2 reference items for the "Rumput" parent category.
// ⚠️  TIDAK termasuk: Hay, Silase, Rumput Fermentasi, Complete Feed,
//     Formula Hijauan, atau Campuran Hijauan — semuanya produk Formula Pakan.

import type { JagungItem, KategoriItem } from './jagungData';
export type { KategoriItem };

// Re-export shared utilities so MasterPakanRumput.tsx imports from one place
export { KATEGORI_ITEM_STYLE } from './jagungData';

// Type alias — same shape as JagungItem, category values are rumput-specific
export type RumputItem = JagungItem;

// ─── Rumput-specific category order ──────────────────────────────────────────

export const RUMPUT_KATEGORI_ALL: KategoriItem[] = [
  'Rumput Unggul',
  'Rumput Tropis',
  'Rumput Savana',
  'Rumput Lokal',
];

// ─── Database ─────────────────────────────────────────────────────────────────

export const RUMPUT_DB: RumputItem[] = [

  // ── Rumput Unggul ─────────────────────────────────────────────────────────
  // Varietas unggul yang dikembangkan/diseleksi untuk produktivitas tinggi
  {
    id: 'rumput-gajah',
    nama: 'Rumput Gajah',
    namaLain: 'Napier Grass, Elephant Grass',
    namaLatin: 'Pennisetum purpureum',
    deskripsi:
      'Rumput unggul tropis berpotensi produksi tertinggi di Indonesia — hingga 200–300 ton/ha/tahun segar. Batang tebal, palatabilitas tinggi, cocok untuk sapi dan kambing. Potong pada umur 40–60 hari.',
    kategoriItem: 'Rumput Unggul',
    estimasiHarga: 300,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-gajah-mini',
    nama: 'Rumput Gajah Mini',
    namaLain: 'Dwarf Napier Grass',
    namaLatin: 'Pennisetum purpureum var. minimus',
    deskripsi:
      'Varietas gajah berukuran lebih kecil dengan batang dan daun lebih lembut. Kandungan protein sedikit lebih tinggi (10–12%) dan lebih mudah dikonsumsi ternak kecil seperti kambing dan domba.',
    kategoriItem: 'Rumput Unggul',
    estimasiHarga: 350,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-raja',
    nama: 'Rumput Raja',
    namaLain: 'King Grass, Hybrid Napier',
    namaLatin: 'Pennisetum purpureum × P. typhoideum',
    deskripsi:
      'Hibrida antara Rumput Gajah dan Pearl Millet. Batang lebih lembut, protein lebih tinggi (10–12%), produksi massa hijau setara Gajah. Lebih toleran kekeringan dan rasa lebih disukai ternak.',
    kategoriItem: 'Rumput Unggul',
    estimasiHarga: 350,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-odot',
    nama: 'Rumput Odot',
    namaLain: 'Mott Grass, Dwarf Elephant Grass',
    namaLatin: 'Pennisetum purpureum cv. Mott',
    deskripsi:
      'Kultivar Gajah kerdil berdaun lebar dengan ruas pendek. Protein 12–14%, sangat palatabel — salah satu rumput terbaik untuk kambing dan domba. Pertumbuhan rapat, cocok untuk zero-grazing.',
    kategoriItem: 'Rumput Unggul',
    estimasiHarga: 400,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },

  // ── Rumput Tropis ─────────────────────────────────────────────────────────
  // Rumput komersial tropis selain kelompok Pennisetum
  {
    id: 'rumput-setaria',
    nama: 'Rumput Setaria',
    namaLain: 'Setaria Grass, Golden Timothy',
    namaLatin: 'Setaria sphacelata',
    deskripsi:
      'Rumput tegak berakar kuat dengan daun lembut dan produksi tinggi. Protein 8–11%, toleran naungan parsial, tumbuh baik di lahan basah. Populer di perkebunan dan agroforestri.',
    kategoriItem: 'Rumput Tropis',
    estimasiHarga: 250,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-benggala',
    nama: 'Rumput Benggala',
    namaLain: 'Guinea Grass, Green Panic',
    namaLatin: 'Panicum maximum',
    deskripsi:
      'Rumput tropis tinggi (hingga 2 m) dengan daun lebar. Protein 8–10%, produksi melimpah, palatabilitas baik. Cocok untuk padang penggembalaan dan cut-and-carry. Kurang toleran tanah jenuh air.',
    kategoriItem: 'Rumput Tropis',
    estimasiHarga: 250,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-brachiaria',
    nama: 'Rumput Brachiaria',
    namaLain: 'Palisade Grass, Xaraes',
    namaLatin: 'Brachiaria brizantha',
    deskripsi:
      'Rumput Brachiaria tegak berakar dalam, sangat tahan kekeringan. Protein 7–10%, palatabilitas sedang-baik, sangat toleran penggembalaan berat. Digunakan luas di padang penggembalaan intensif.',
    kategoriItem: 'Rumput Tropis',
    estimasiHarga: 200,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-signal',
    nama: 'Rumput Signal',
    namaLain: 'Signal Grass, Creeping Signal Grass',
    namaLatin: 'Brachiaria decumbens',
    deskripsi:
      'Brachiaria menjalar dengan stolon kuat, sangat tahan injakan dan penggembalaan kontinu. Protein 7–9%. Perlu perhatian pada ternak domba/kambing karena potensi fotosensitisasi pada kondisi tertentu.',
    kategoriItem: 'Rumput Tropis',
    estimasiHarga: 200,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-meksiko',
    nama: 'Rumput Meksiko',
    namaLain: 'Tripsacum Grass, False Gama Grass',
    namaLatin: 'Tripsacum laxum',
    deskripsi:
      'Rumput besar menyerupai Gajah dengan batang berongga ringan. Protein 10–12%, cukup palatabel, tumbuh sangat cepat di lahan basah dan pinggir sungai. Sering dimanfaatkan di Jawa dan Sumatra.',
    kategoriItem: 'Rumput Tropis',
    estimasiHarga: 250,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-guatemala',
    nama: 'Rumput Guatemala',
    namaLain: 'Guatemala Grass, Anderson Grass',
    namaLatin: 'Tripsacum andersonii',
    deskripsi:
      'Rumput Tripsacum berukuran besar dengan ruas panjang dan daun lebar. Protein 9–11%, produksi biomassa tinggi, toleran kelembaban tinggi. Cocok untuk daerah curah hujan tinggi di Sulawesi dan Kalimantan.',
    kategoriItem: 'Rumput Tropis',
    estimasiHarga: 280,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },

  // ── Rumput Savana ─────────────────────────────────────────────────────────
  // Rumput savana / padang rumput terbuka, umumnya pendek-sedang
  {
    id: 'rumput-afrika-star',
    nama: 'Rumput Afrika Star',
    namaLain: 'African Star Grass',
    namaLatin: 'Cynodon plectostachyus',
    deskripsi:
      'Cynodon berukuran sedang dengan batang tegak dan stolon kuat. Protein 8–10%, sangat tahan penggembalaan dan kekeringan, palatabilitas baik. Cocok untuk padang penggembalaan lahan kering.',
    kategoriItem: 'Rumput Savana',
    estimasiHarga: 200,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-rhodes',
    nama: 'Rumput Rhodes',
    namaLain: 'Rhodes Grass',
    namaLatin: 'Chloris gayana',
    deskripsi:
      'Rumput tegak dengan batang berbunga khas menyebar menyerupai jari. Protein 8–12%, sangat toleran kekeringan dan tanah alkalis. Bernilai tinggi untuk jerami berkualitas di kawasan semi-arid.',
    kategoriItem: 'Rumput Savana',
    estimasiHarga: 220,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-bermuda',
    nama: 'Rumput Bermuda',
    namaLain: 'Bermuda Grass, Couch Grass',
    namaLatin: 'Cynodon dactylon',
    deskripsi:
      'Rumput menjalar pendek dengan rizom dan stolon sangat kuat. Protein 7–10%, palatabilitas baik, sangat tahan injakan dan kekeringan. Banyak tumbuh alami di padang rumput dan tepi jalan.',
    kategoriItem: 'Rumput Savana',
    estimasiHarga: 180,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-bintang',
    nama: 'Rumput Bintang',
    namaLain: 'Giant Star Grass, Nlemfuensis',
    namaLatin: 'Cynodon nlemfuensis',
    deskripsi:
      'Cynodon berukuran lebih besar dari Bermuda, batang lebih tebal dan daun lebih lebar. Protein 9–11%, palatabilitas lebih baik dari C. dactylon, cocok untuk padang penggembalaan intensif.',
    kategoriItem: 'Rumput Savana',
    estimasiHarga: 200,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },

  // ── Rumput Lokal ──────────────────────────────────────────────────────────
  // Rumput asli/introduksi lama yang tumbuh alami atau dibudidayakan lokal
  {
    id: 'rumput-para',
    nama: 'Rumput Para',
    namaLain: 'Para Grass, Buffalo Grass (Sunda)',
    namaLatin: 'Brachiaria mutica',
    deskripsi:
      'Rumput menjalar di air dan lahan basah, batang tebal dan berakar di ruas. Protein 7–9%, tumbuh sangat lebat di pinggir sungai dan sawah. Mudah diperoleh petani, biaya nol untuk pengumpulan.',
    kategoriItem: 'Rumput Lokal',
    estimasiHarga: 150,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-pangola',
    nama: 'Rumput Pangola',
    namaLain: 'Pangola Grass, Digitgrass',
    namaLatin: 'Digitaria eriantha',
    deskripsi:
      'Rumput stolon halus dan lebat, daun lembut dan palatabel. Protein 8–10%, tumbuh baik di daerah lembab dan drainase baik. Sering digunakan di kebun campuran dan peternakan skala kecil.',
    kategoriItem: 'Rumput Lokal',
    estimasiHarga: 180,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-kolonjono',
    nama: 'Rumput Kolonjono',
    namaLain: 'Kolonjono Grass, Buffalo Grass (Jawa)',
    namaLatin: 'Brachiaria mutica',
    deskripsi:
      'Nama lokal Jawa untuk Brachiaria mutica — morfologi mirip Rumput Para namun dikenal dengan sebutan berbeda di Jawa Tengah dan Jawa Timur. Protein 7–9%, digemari sapi perah karena batang lunak.',
    kategoriItem: 'Rumput Lokal',
    estimasiHarga: 150,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-lapang',
    nama: 'Rumput Lapang',
    namaLain: 'Field Grass, Mixed Native Grass',
    namaLatin: 'Axonopus compressus (dominan)',
    deskripsi:
      'Campuran rumput alam yang tumbuh di padang, pinggir jalan, dan lahan terlantar — didominasi Axonopus compressus (carpet grass) dan Paspalum sp. Protein 5–8%, nilai nutrisi bervariasi antar musim.',
    kategoriItem: 'Rumput Lokal',
    estimasiHarga: 100,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'rumput-alang-alang',
    nama: 'Rumput Alang-alang',
    namaLain: 'Cogon Grass, Alang-alang',
    namaLatin: 'Imperata cylindrica',
    deskripsi:
      'Rumput liar invasif dengan batang keras dan daun bertepi tajam. Protein 4–6%, serat tinggi, palatabilitas rendah — hanya dikonsumsi ternak saat pakan lain langka. Nilai nutrisi meningkat pada tunas muda.',
    kategoriItem: 'Rumput Lokal',
    estimasiHarga: 80,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'teki',
    nama: 'Teki',
    namaLain: 'Nutsedge, Purple Nutsedge',
    namaLatin: 'Cyperus rotundus',
    deskripsi:
      'Tumbuhan bukan rumput sejati (famili Cyperaceae) namun sering dikonsumsi ternak bersama rumput lapang. Protein 5–8%, umbi mengandung pati, dicerna sedang. Dimasukkan sebagai referensi — bukan rekomendasi utama.',
    kategoriItem: 'Rumput Lokal',
    estimasiHarga: 80,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getRumputList(): RumputItem[] {
  return RUMPUT_DB;
}

export function getRumputById(id: string): RumputItem | undefined {
  return RUMPUT_DB.find(item => item.id === id);
}

export function computeRumputRingkasan() {
  const items  = RUMPUT_DB;
  const priced = items.filter(i => i.estimasiHarga !== null).map(i => i.estimasiHarga as number);
  const hargaRata = priced.length > 0
    ? Math.round(priced.reduce((a, b) => a + b, 0) / priced.length)
    : null;
  const terakhir   = items.map(i => i.updatedAt).sort((a, b) => b.localeCompare(a))[0] ?? '—';
  const dataLengkap = items.filter(i => i.dataLengkap).length;

  return {
    totalReferensi: items.length,
    hargaRataRata:  hargaRata,
    terakhirUpdate: terakhir,
    dataLengkap,
  };
}
