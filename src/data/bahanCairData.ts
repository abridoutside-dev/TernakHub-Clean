// ─── Master Pakan — Bahan Cair Sub Category ────────────────────────────────────
// MP-034: List data for "Bahan Cair" parent category.
// Single raw-material liquid ingredients used in livestock feed formulation.
// EXCLUDES: Larutan Premix, Vitamin Cair Campuran, Mineral Cair Campuran,
// Complete Feed Cair, TMR Cair, dan seluruh produk hasil Formula/campuran.

import type { KategoriItem } from './jagungData';
import { KATEGORI_ITEM_STYLE } from './jagungData';
export { KATEGORI_ITEM_STYLE };

export interface BahanCairItem {
  id: string;
  nama: string;
  namaIlmiah: string | null;   // scientific / chemical name
  namaLain: string;            // aliases for search
  deskripsi: string;
  kategoriItem: KategoriItem;
  estimasiHarga: number | null; // IDR/liter
  hargaUpdated: string;
  dataLengkap: boolean;
  updatedAt: string;
}

export const BAHAN_CAIR_KATEGORI_ORDER: KategoriItem[] = [
  'Molases & Nira',
  'Produk Susu Cair',
  'Minyak Nabati & Ikan',
  'Cairan Sintetis',
];

export const BAHAN_CAIR_DB: BahanCairItem[] = [

  // ── Molases & Nira ────────────────────────────────────────────────────────────

  {
    id: 'molases-tebu',
    nama: 'Molases Tebu',
    namaIlmiah: 'Saccharum officinarum Molasses',
    namaLain: 'Molasses, Tetes Tebu, Cane Molasses, Sugarcane Molasses',
    deskripsi: 'Hasil samping cair dari proses pemurnian gula tebu, kaya akan gula sederhana (sukrosa) dan sangat palatabel. Digunakan sebagai sumber energi cepat serap, perekat pelet, dan penambah palatabilitas ransum ruminansia dan unggas.',
    kategoriItem: 'Molases & Nira',
    estimasiHarga: 3200,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'molases-bit',
    nama: 'Molases Bit',
    namaIlmiah: 'Beta vulgaris Molasses',
    namaLain: 'Beet Molasses, Tetes Bit Gula, Sugar Beet Molasses',
    deskripsi: 'Hasil samping cair dari pengolahan gula bit, komposisi gula mirip molases tebu namun kadar biotin lebih tinggi. Digunakan sebagai sumber energi dan pelekat pelet, umumnya diimpor karena bit gula tidak dibudidayakan luas di Indonesia.',
    kategoriItem: 'Molases & Nira',
    estimasiHarga: 4500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'nira-tebu',
    nama: 'Nira Tebu',
    namaIlmiah: 'Saccharum officinarum Sap',
    namaLain: 'Sugarcane Juice, Air Tebu, Cane Juice',
    deskripsi: 'Cairan manis hasil perasan batang tebu segar sebelum diproses menjadi gula, mengandung sukrosa tinggi dan air. Digunakan sebagai sumber energi cair segar pada peternakan skala kecil di sekitar area perkebunan tebu.',
    kategoriItem: 'Molases & Nira',
    estimasiHarga: 2200,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'nira-kelapa',
    nama: 'Nira Kelapa',
    namaIlmiah: 'Cocos nucifera Sap',
    namaLain: 'Coconut Sap, Toddy, Air Nira, Legen',
    deskripsi: 'Cairan manis hasil sadapan bunga (mayang) kelapa, mengandung gula alami dan sedikit mineral. Digunakan sebagai sumber energi cair alternatif pada peternakan rakyat di daerah penghasil kelapa, biasanya digunakan segar sebelum fermentasi.',
    kategoriItem: 'Molases & Nira',
    estimasiHarga: 3500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'nira-aren',
    nama: 'Nira Aren',
    namaIlmiah: 'Arenga pinnata Sap',
    namaLain: 'Palm Sap, Air Aren, Sugar Palm Sap',
    deskripsi: 'Cairan manis hasil sadapan tandan bunga pohon aren, komposisi mirip nira kelapa dengan kandungan gula tinggi. Digunakan sebagai sumber energi cair pada peternakan rakyat di sekitar sentra produksi gula aren.',
    kategoriItem: 'Molases & Nira',
    estimasiHarga: 3800,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Produk Susu Cair ──────────────────────────────────────────────────────────

  {
    id: 'air-kelapa',
    nama: 'Air Kelapa',
    namaIlmiah: 'Cocos nucifera Liquid Endosperm',
    namaLain: 'Coconut Water, Air Buah Kelapa',
    deskripsi: 'Cairan bening di dalam buah kelapa, hasil samping industri pengolahan kelapa (kopra, santan). Mengandung elektrolit alami dan sedikit gula, digunakan sebagai sumber cairan dan elektrolit tambahan pada ternak, terutama pedet dan ternak dalam kondisi stres panas.',
    kategoriItem: 'Produk Susu Cair',
    estimasiHarga: 800,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'whey-cair',
    nama: 'Whey Cair',
    namaIlmiah: 'Liquid Milk Whey',
    namaLain: 'Whey, Liquid Whey, Whey Susu, Sweet Whey',
    deskripsi: 'Cairan hasil samping industri keju dan kasein, kaya laktosa dan protein whey terlarut. Digunakan sebagai sumber energi dan protein cair berkualitas tinggi, terutama untuk pakan pedet dan babi, harus digunakan segar karena mudah terfermentasi.',
    kategoriItem: 'Produk Susu Cair',
    estimasiHarga: 1500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'susu-segar-afkir',
    nama: 'Susu Segar Afkir',
    namaIlmiah: 'Rejected Fresh Milk',
    namaLain: 'Waste Milk, Susu Reject, Susu Afkir, Off-Grade Milk',
    deskripsi: 'Susu sapi segar yang tidak memenuhi standar mutu untuk konsumsi manusia (misalnya kadar antibiotik residu, kontaminasi ringan, atau kualitas di bawah standar industri pengolahan). Dimanfaatkan sebagai pakan cair sumber energi dan protein untuk pedet atau babi, dengan perhatian pada residu obat.',
    kategoriItem: 'Produk Susu Cair',
    estimasiHarga: 2500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'susu-skim-cair',
    nama: 'Susu Skim Cair',
    namaIlmiah: 'Liquid Skim Milk',
    namaLain: 'Skim Milk, Liquid Skimmed Milk, Susu Skim',
    deskripsi: 'Susu sapi yang telah dipisahkan sebagian besar lemaknya, hasil samping produksi krim/mentega. Kaya protein dan laktosa dengan kandungan lemak rendah, digunakan sebagai pengganti susu induk pada pemeliharaan pedet lepas kolostrum.',
    kategoriItem: 'Produk Susu Cair',
    estimasiHarga: 3000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Minyak Nabati & Ikan ──────────────────────────────────────────────────────

  {
    id: 'minyak-kelapa',
    nama: 'Minyak Kelapa',
    namaIlmiah: 'Cocos nucifera Oil',
    namaLain: 'Coconut Oil, Minyak Klentik, CNO',
    deskripsi: 'Minyak nabati hasil ekstraksi daging buah kelapa, kaya asam lemak rantai sedang (MCFA) seperti asam laurat. Digunakan sebagai sumber energi terkonsentrasi dan agen anti-mikroba alami dalam ransum, khususnya unggas dan babi.',
    kategoriItem: 'Minyak Nabati & Ikan',
    estimasiHarga: 16000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'minyak-sawit',
    nama: 'Minyak Sawit',
    namaIlmiah: 'Elaeis guineensis Oil (Crude Palm Oil)',
    namaLain: 'Palm Oil, CPO, Crude Palm Oil, Minyak Kelapa Sawit',
    deskripsi: 'Minyak nabati hasil ekstraksi daging buah kelapa sawit, sumber energi terkonsentrasi dengan kandungan asam lemak jenuh dan tak jenuh seimbang. Banyak digunakan sebagai penambah energi dan pengurang debu pada pakan unggas dan ruminansia karena harga relatif terjangkau di Indonesia.',
    kategoriItem: 'Minyak Nabati & Ikan',
    estimasiHarga: 13500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'minyak-jagung',
    nama: 'Minyak Jagung',
    namaIlmiah: 'Zea mays Oil (Corn Oil)',
    namaLain: 'Corn Oil, Maize Oil',
    deskripsi: 'Minyak nabati hasil ekstraksi lembaga (germ) jagung, kaya asam lemak tak jenuh ganda (linoleat) dan vitamin E alami. Digunakan sebagai sumber energi dan asam lemak esensial berkualitas tinggi, terutama pada ransum unggas petelur dan pakan starter.',
    kategoriItem: 'Minyak Nabati & Ikan',
    estimasiHarga: 22000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'minyak-kedelai',
    nama: 'Minyak Kedelai',
    namaIlmiah: 'Glycine max Oil (Soybean Oil)',
    namaLain: 'Soybean Oil, Soy Oil',
    deskripsi: 'Minyak nabati hasil ekstraksi biji kedelai, kaya asam lemak tak jenuh ganda (linoleat, linolenat). Digunakan luas sebagai sumber energi dan asam lemak esensial dalam ransum unggas dan babi, serta sebagai carrier untuk vitamin larut lemak.',
    kategoriItem: 'Minyak Nabati & Ikan',
    estimasiHarga: 19500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'minyak-ikan',
    nama: 'Minyak Ikan',
    namaIlmiah: 'Fish Oil (Omega-3 Rich)',
    namaLain: 'Fish Oil, Cod Liver Oil, Minyak Ikan Lemuru',
    deskripsi: 'Minyak hasil ekstraksi/rendering ikan atau hasil samping industri pengalengan ikan, kaya asam lemak omega-3 (EPA, DHA) dan vitamin A/D larut lemak. Digunakan sebagai sumber energi dan asam lemak esensial pada pakan ikan, unggas, dan ternak indukan untuk mendukung reproduksi.',
    kategoriItem: 'Minyak Nabati & Ikan',
    estimasiHarga: 28000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Cairan Sintetis ───────────────────────────────────────────────────────────

  {
    id: 'gliserol',
    nama: 'Gliserol (Glycerol)',
    namaIlmiah: 'Glycerol / 1,2,3-Propanetriol',
    namaLain: 'Glycerol, Glycerin, Gliserin, Propanetriol',
    deskripsi: 'Cairan kental hasil samping industri biodiesel (transesterifikasi minyak nabati) atau produksi sabun, sumber energi cair yang cepat dimetabolisme menjadi glukosa (glukoneogenik). Digunakan sebagai sumber energi alternatif pada ransum sapi perah periode transisi dan sebagai bahan pengikat pelet.',
    kategoriItem: 'Cairan Sintetis',
    estimasiHarga: 8500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'propilen-glikol',
    nama: 'Propilen Glikol (Propylene Glycol)',
    namaIlmiah: 'Propylene Glycol / 1,2-Propanediol',
    namaLain: 'Propylene Glycol, PG, 1,2-Propanediol',
    deskripsi: 'Cairan sintetis glukogenik yang umum digunakan sebagai drench atau campuran pakan untuk mencegah dan mengobati ketosis pada sapi perah periode awal laktasi. Dimetabolisme di hati menjadi glukosa, berbeda dari gliserol yang berasal dari hasil samping biodiesel alami.',
    kategoriItem: 'Cairan Sintetis',
    estimasiHarga: 24000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
];

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getBahanCairList(): BahanCairItem[] {
  return BAHAN_CAIR_DB;
}

export function getBahanCairById(id: string): BahanCairItem | undefined {
  return BAHAN_CAIR_DB.find(item => item.id === id);
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

export interface BahanCairRingkasan {
  totalReferensi: number;
  hargaRataRata: number | null;
  terakhirUpdate: string;
  dataLengkap: number;
}

export function computeBahanCairRingkasan(): BahanCairRingkasan {
  const items  = getBahanCairList();
  const priced = items.filter(i => i.estimasiHarga !== null);
  const hargaRataRata = priced.length > 0
    ? Math.round(priced.reduce((sum, i) => sum + i.estimasiHarga!, 0) / priced.length)
    : null;

  const sorted = [...items].sort((a, b) =>
    new Date(b.updatedAt.split(' ').reverse().join('-')).getTime() -
    new Date(a.updatedAt.split(' ').reverse().join('-')).getTime()
  );

  return {
    totalReferensi: items.length,
    hargaRataRata,
    terakhirUpdate: sorted[0]?.updatedAt ?? '—',
    dataLengkap: items.filter(i => i.dataLengkap).length,
  };
}
