// ─── Master Pakan — Leguminosa ────────────────────────────────────────────────
// MP-008: List data for all 15 leguminosa feed items.
// Detail data (nutrisi, harga, referensi) is NOT included in this phase.

export type KategoriLeguminosa =
  | 'Pohon & Perdu'
  | 'Herba & Cover Crop'
  | 'Daun Kacang-kacangan';

export const LEGUMINOSA_KATEGORI_ALL: KategoriLeguminosa[] = [
  'Pohon & Perdu',
  'Herba & Cover Crop',
  'Daun Kacang-kacangan',
];

export const KATEGORI_LEGUMINOSA_STYLE: Record<
  KategoriLeguminosa,
  { color: string; bg: string }
> = {
  'Pohon & Perdu':         { color: '#1b6b3a', bg: '#d4edda' },
  'Herba & Cover Crop':    { color: '#2e7d32', bg: '#e8f5e9' },
  'Daun Kacang-kacangan':  { color: '#388e3c', bg: '#f1f8e9' },
};

export interface LeguminosaItem {
  id: string;
  nama: string;
  namaLatin: string | null;
  namaLain: string | null;
  kategoriItem: KategoriLeguminosa;
  deskripsiSingkat: string;
  dataLengkap: boolean;
  estimasiHarga: number | null;
}

export const LEGUMINOSA_LIST: LeguminosaItem[] = [
  // ── Pohon & Perdu ──────────────────────────────────────────────────────────
  {
    id: 'lamtoro',
    nama: 'Lamtoro',
    namaLatin: 'Leucaena leucocephala',
    namaLain: 'Petai Cina, Lead Tree',
    kategoriItem: 'Pohon & Perdu',
    deskripsiSingkat:
      'Leguminosa pohon yang sangat populer di Indonesia sebagai sumber protein hijauan — PK 20–25% BK dengan produksi daun melimpah sepanjang tahun.',
    dataLengkap: true,
    estimasiHarga: 800,
  },
  {
    id: 'indigofera',
    nama: 'Indigofera',
    namaLatin: 'Indigofera zollingeriana',
    namaLain: 'Indigofera zollinger',
    kategoriItem: 'Pohon & Perdu',
    deskripsiSingkat:
      'Leguminosa perdu unggul dengan protein kasar 27–29% BK — tertinggi di antara leguminosa tropis. Toleran kekeringan dan produksi biomassa sangat tinggi.',
    dataLengkap: true,
    estimasiHarga: 1200,
  },
  {
    id: 'kaliandra',
    nama: 'Kaliandra',
    namaLatin: 'Calliandra calothyrsus',
    namaLain: 'Kaliandra Merah, Red Calliandra',
    kategoriItem: 'Pohon & Perdu',
    deskripsiSingkat:
      'Leguminosa perdu dengan protein 20–23% BK. Mengandung tanin terkondensasi yang membantu bypass protein di rumen — cocok sebagai suplemen hijauan berkualitas.',
    dataLengkap: true,
    estimasiHarga: 600,
  },
  {
    id: 'gamal',
    nama: 'Gamal',
    namaLatin: 'Gliricidia sepium',
    namaLain: 'Gliricidia, Quick Stick',
    kategoriItem: 'Pohon & Perdu',
    deskripsiSingkat:
      'Leguminosa pohon multiguna — protein 18–22% BK, palatabilitas tinggi untuk ruminansia, serta berfungsi sebagai pagar hidup dan pupuk hijau.',
    dataLengkap: true,
    estimasiHarga: 400,
  },
  {
    id: 'turi',
    nama: 'Turi',
    namaLatin: 'Sesbania grandiflora',
    namaLain: 'Agati, Vegetable Hummingbird',
    kategoriItem: 'Pohon & Perdu',
    deskripsiSingkat:
      'Leguminosa pohon cepat tumbuh dengan protein 22–26% BK. Daun dan bunga dapat dikonsumsi langsung; nilai nutrisi tinggi untuk kambing, sapi, dan kerbau.',
    dataLengkap: true,
    estimasiHarga: 700,
  },
  {
    id: 'daun-kelor',
    nama: 'Daun Kelor',
    namaLatin: 'Moringa oleifera',
    namaLain: 'Kelor, Drumstick Tree, Moringa',
    kategoriItem: 'Pohon & Perdu',
    deskripsiSingkat:
      'Disebut "pohon ajaib" — protein 25–27% BK, kaya beta-karoten, vitamin C, dan mineral esensial. Suplemen nutrisi premium untuk ternak perah dan kambing.',
    dataLengkap: true,
    estimasiHarga: 3000,
  },
  {
    id: 'daun-singkong',
    nama: 'Daun Singkong',
    namaLatin: 'Manihot esculenta',
    namaLain: 'Daun Ubi Kayu, Cassava Leaves',
    kategoriItem: 'Pohon & Perdu',
    deskripsiSingkat:
      'Hasil samping budidaya singkong dengan protein 15–22% BK. Perlu dilayukan atau dikukus untuk menurunkan kandungan HCN sebelum diberikan ke ternak.',
    dataLengkap: true,
    estimasiHarga: 500,
  },

  // ── Herba & Cover Crop ─────────────────────────────────────────────────────
  {
    id: 'alfalfa',
    nama: 'Alfalfa',
    namaLatin: 'Medicago sativa',
    namaLain: 'Lucerne, Semanggi Eropa',
    kategoriItem: 'Herba & Cover Crop',
    deskripsiSingkat:
      'Ratu leguminosa pakan dunia — protein 15–22% BK (segar) hingga 18–21% (hay). Kaya kalsium dan vitamin. Umumnya diimpor sebagai hay untuk sapi perah premium.',
    dataLengkap: true,
    estimasiHarga: 12000,
  },
  {
    id: 'centro',
    nama: 'Centro',
    namaLatin: 'Centrosema pubescens',
    namaLain: 'Sentro, Butterfly Pea Cover',
    kategoriItem: 'Herba & Cover Crop',
    deskripsiSingkat:
      'Leguminosa merambat tahan naungan dengan protein 14–18% BK. Sangat baik sebagai cover crop di kebun kelapa sawit dan karet sekaligus sumber hijauan berkualitas.',
    dataLengkap: true,
    estimasiHarga: 300,
  },
  {
    id: 'stylo',
    nama: 'Stylo',
    namaLatin: 'Stylosanthes guianensis',
    namaLain: 'Stylosanthes, Stylo Guiana',
    kategoriItem: 'Herba & Cover Crop',
    deskripsiSingkat:
      'Leguminosa herba tahunan toleran tanah masam dan kering. Protein 12–16% BK. Cocok dipadukan dengan rumput Brachiaria dalam sistem padang penggembalaan campuran.',
    dataLengkap: true,
    estimasiHarga: 300,
  },
  {
    id: 'kacang-tanah-hijauan',
    nama: 'Kacang Tanah (Hijauan)',
    namaLatin: 'Arachis hypogaea',
    namaLain: 'Groundnut Haulm, Jerami Kacang Tanah',
    kategoriItem: 'Herba & Cover Crop',
    deskripsiSingkat:
      'Hasil samping panen kacang tanah — jerami dan daun mengandung protein 9–15% BK. Nilai nutrisi lebih tinggi dari jerami padi dan tersedia berlimpah saat musim panen.',
    dataLengkap: true,
    estimasiHarga: 800,
  },
  {
    id: 'desmodium',
    nama: 'Desmodium spp.',
    namaLatin: 'Desmodium spp.',
    namaLain: 'Tick Clover, Desmodium',
    kategoriItem: 'Herba & Cover Crop',
    deskripsiSingkat:
      'Genus leguminosa merambat adaptif di lahan tropik basah. Protein 12–18% BK. Tahan genangan dan bermanfaat sebagai cover crop serta pakan suplemen di sistem agroforestri.',
    dataLengkap: true,
    estimasiHarga: 400,
  },

  // ── Daun Kacang-kacangan ──────────────────────────────────────────────────
  {
    id: 'daun-kacang-panjang',
    nama: 'Daun Kacang Panjang',
    namaLatin: 'Vigna unguiculata subsp. sesquipedalis',
    namaLain: 'Yard-long Bean Leaves, Buncis Panjang',
    kategoriItem: 'Daun Kacang-kacangan',
    deskripsiSingkat:
      'Hasil samping budidaya kacang panjang — daun dan batang muda mengandung protein 12–17% BK. Palatabilitas baik dan mudah diperoleh dari lahan pertanian setempat.',
    dataLengkap: true,
    estimasiHarga: 1000,
  },
  {
    id: 'daun-kacang-hijau',
    nama: 'Daun Kacang Hijau',
    namaLatin: 'Vigna radiata',
    namaLain: 'Mung Bean Leaves, Biji Hijau',
    kategoriItem: 'Daun Kacang-kacangan',
    deskripsiSingkat:
      'Daun dan batang kacang hijau pasca panen mengandung protein 13–18% BK. Disukai kambing dan domba. Dapat diberikan segar atau dilayukan sebagai suplemen hijauan.',
    dataLengkap: true,
    estimasiHarga: 1000,
  },
  {
    id: 'daun-kacang-tunggak',
    nama: 'Daun Kacang Tunggak',
    namaLatin: 'Vigna unguiculata',
    namaLain: 'Cowpea Leaves, Kacang Tolo',
    kategoriItem: 'Daun Kacang-kacangan',
    deskripsiSingkat:
      'Leguminosa setahun dengan daun berprotein 14–19% BK. Tahan kekeringan dan tumbuh cepat — ideal sebagai sumber hijauan suplemen di musim kemarau.',
    dataLengkap: true,
    estimasiHarga: 800,
  },
];

export function getLeguminosaList(): LeguminosaItem[] {
  return LEGUMINOSA_LIST;
}

export function getLeguminosaById(id: string): LeguminosaItem | undefined {
  return LEGUMINOSA_LIST.find(item => item.id === id);
}

export function computeLeguminosaRingkasan() {
  const items = getLeguminosaList();
  const priced = items.filter(i => i.estimasiHarga !== null);
  const hargaRataRata = priced.length > 0
    ? Math.round(priced.reduce((s, i) => s + i.estimasiHarga!, 0) / priced.length)
    : null;
  return {
    totalReferensi: items.length,
    dataLengkap: items.filter(i => i.dataLengkap).length,
    terakhirUpdate: 'Jul 2026',
    hargaRataRata,
  };
}
