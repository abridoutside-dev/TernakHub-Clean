// ─── Master Pakan — Mineral Sub Category ──────────────────────────────────────
// MP-030: List data for "Mineral" parent category.
// Single raw-material mineral ingredients used in livestock feed formulation.
// EXCLUDES: Mineral Mix, Mineral Blok, Premix Mineral, Complete Feed,
// Konsentrat, TMR, and all mineral blends/formulations.

import type { KategoriItem } from './jagungData';
import { KATEGORI_ITEM_STYLE } from './jagungData';
export { KATEGORI_ITEM_STYLE };

export interface MineralItem {
  id: string;
  nama: string;
  rumusKimia: string | null;   // chemical formula
  namaLain: string;            // aliases for search
  deskripsi: string;
  kategoriItem: KategoriItem;
  estimasiHarga: number | null; // IDR/kg
  hargaUpdated: string;
  dataLengkap: boolean;
  updatedAt: string;
}

export const MINERAL_KATEGORI_ORDER: KategoriItem[] = [
  'Sumber Kalsium',
  'Sumber Fosfor',
  'Mineral Makro',
  'Sumber Sulfur',
  'Mineral Adsorben',
];

export const MINERAL_DB: MineralItem[] = [

  // ── Sumber Kalsium ────────────────────────────────────────────────────────────
  {
    id: 'batu-kapur',
    nama: 'Batu Kapur (Limestone)',
    rumusKimia: 'CaCO₃',
    namaLain: 'Limestone, Kapur Pertanian, Agricultural Limestone, Kapur Alam',
    deskripsi: 'Batu kapur alam digiling kasar sebagai sumber kalsium paling umum dan ekonomis dalam ransum ternak. Ca ±33–38% BK tergantung kemurnian, Mg rendah. Kelarutan baik pada pH lambung asam; diabsorpsi efisien untuk ayam petelur dan ruminansia. Ukuran partikel kasar (2–4 mm) disarankan untuk ayam petelur agar Ca tersedia malam hari saat pembentukan kulit telur.',
    kategoriItem: 'Sumber Kalsium',
    estimasiHarga: 800,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'tepung-batu-kapur',
    nama: 'Tepung Batu Kapur',
    rumusKimia: 'CaCO₃',
    namaLain: 'Ground Limestone, Calcitic Limestone Flour, Kapur Giling Halus, Fine Limestone',
    deskripsi: 'Batu kapur digiling halus (≤0,5 mm) untuk homogenisasi ransum yang lebih merata. Ca ±33–38% BK. Digunakan pada ransum pellet dan mash halus; kelarutan lebih cepat dari butiran kasar. Lebih murah dari kalsium karbonat feed grade; cocok untuk ransum unggas broiler dan babi.',
    kategoriItem: 'Sumber Kalsium',
    estimasiHarga: 600,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'kalsium-karbonat',
    nama: 'Kalsium Karbonat Feed Grade',
    rumusKimia: 'CaCO₃',
    namaLain: 'Calcium Carbonate, CaCO3, Precipitated Calcium Carbonate, PCC Feed Grade',
    deskripsi: 'Kalsium karbonat kemurnian tinggi (≥95% CaCO₃) diproduksi dari batu kapur melalui proses penggilingan atau presipitasi. Ca ±37–40% BK. Lebih murni dan konsisten dari batu kapur alam; digunakan pada ransum unggas petelur intensif dan pakan ikan untuk presisi suplementasi Ca. Harga lebih tinggi dari tepung batu kapur biasa.',
    kategoriItem: 'Sumber Kalsium',
    estimasiHarga: 1500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'dolomit',
    nama: 'Dolomit',
    rumusKimia: 'CaMg(CO₃)₂',
    namaLain: 'Dolomite, Dolomitic Limestone, Kapur Dolomit, CaMg(CO3)2',
    deskripsi: 'Batuan karbonat ganda yang mengandung Ca ±21% dan Mg ±11% BK — sumber Ca dan Mg sekaligus. Lebih lambat larut dari limestone biasa; digunakan sebagai suplemen Ca-Mg pada ruminansia yang berisiko hipomagnesemia (grass tetany). Kurang disarankan untuk unggas karena bioavailabilitas Ca lebih rendah dan Mg berlebih bisa melonggarkan feses.',
    kategoriItem: 'Sumber Kalsium',
    estimasiHarga: 900,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Sumber Fosfor ─────────────────────────────────────────────────────────────
  {
    id: 'dicalcium-phosphate',
    nama: 'Dicalcium Phosphate (DCP)',
    rumusKimia: 'CaHPO₄',
    namaLain: 'DCP, Dibasic Calcium Phosphate, Dikalsium Fosfat, Calcium Hydrogen Phosphate',
    deskripsi: 'Sumber mineral Ca dan P paling umum dalam ransum ternak: Ca ±22–24% dan P tersedia ±18–21% BK. Kelarutan baik; bioavailabilitas P tinggi (relatif 100% sebagai standar). Digunakan pada semua spesies ternak. Fluorida harus <1% (feed grade). Merupakan bahan mineral wajib dalam formula ransum unggas dan babi.',
    kategoriItem: 'Sumber Fosfor',
    estimasiHarga: 7500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'monocalcium-phosphate',
    nama: 'Monocalcium Phosphate (MCP)',
    rumusKimia: 'Ca(H₂PO₄)₂',
    namaLain: 'MCP, Monobasic Calcium Phosphate, Monokalsium Fosfat, Calcium Dihydrogen Phosphate',
    deskripsi: 'Sumber P dengan kelarutan sangat tinggi: Ca ±15–17% dan P tersedia ±22–24% BK. Bioavailabilitas P lebih tinggi dari DCP; digunakan pada ransum unggas starter dan pakan ikan di mana kelarutan P kritis untuk absorpsi. Lebih mahal dari DCP; sering dikombinasikan DCP untuk efisiensi biaya.',
    kategoriItem: 'Sumber Fosfor',
    estimasiHarga: 9000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'defluorinated-phosphate',
    nama: 'Defluorinated Phosphate (DFP)',
    rumusKimia: null,
    namaLain: 'DFP, Defluorinated Rock Phosphate, Fosfat Defluorinasi, Deffluorinated Phosphate',
    deskripsi: 'Rock phosphate alam yang diproses pada suhu tinggi (≥800°C) untuk menurunkan fluorida ke level aman (<0,18% F). Ca ±30–34% dan P tersedia ±16–18% BK. Lebih murah dari DCP/MCP; bioavailabilitas P lebih rendah (±80% vs DCP). Hanya boleh digunakan jika fluorida terverifikasi <0,18% untuk mencegah fluorosis pada ternak.',
    kategoriItem: 'Sumber Fosfor',
    estimasiHarga: 5500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'tepung-tulang-mineral',
    nama: 'Tepung Tulang Mineral (Steamed Bone Meal)',
    rumusKimia: null,
    namaLain: 'Steamed Bone Meal, Mineral Bone Meal, Bone Meal Feed Grade, Tepung Tulang Kukus',
    deskripsi: 'Tulang hewan (sapi, babi, unggas) yang dikukus bertekanan tinggi dan digiling sebagai sumber Ca dan P alami: Ca ±25–30% dan P ±12–14% BK dengan rasio Ca:P ±2:1. Berbeda dari Tepung Tulang di kategori Protein Hewani — produk ini difokuskan sebagai sumber mineral, bukan protein. P bioavailable baik; cocok untuk ruminansia dan babi.',
    kategoriItem: 'Sumber Fosfor',
    estimasiHarga: 5000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Mineral Makro ─────────────────────────────────────────────────────────────
  {
    id: 'garam-nacl',
    nama: 'Garam (NaCl)',
    rumusKimia: 'NaCl',
    namaLain: 'Sodium Chloride, Garam Dapur, Salt, Garam Ternak, Feed Salt, NaCl',
    deskripsi: 'Sumber Na dan Cl paling ekonomis dan umum: Na ±39% dan Cl ±61% BK. Esensial untuk keseimbangan elektrolit, tekanan osmotik, dan transmisi saraf. Level standar dalam ransum 0,25–0,5% BK untuk unggas dan ruminansia. Kelebihan garam (>2%) menyebabkan peningkatan konsumsi air dan masalah litter pada unggas.',
    kategoriItem: 'Mineral Makro',
    estimasiHarga: 1200,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'magnesium-oksida',
    nama: 'Magnesium Oksida (MgO)',
    rumusKimia: 'MgO',
    namaLain: 'Magnesium Oxide, Calcined Magnesite, Kaustik Magnesia, Magnesia, MgO Feed Grade',
    deskripsi: 'Sumber Mg berkonsentrasi tinggi: Mg ±55–60% BK. Digunakan pada ransum sapi laktasi dan ruminansia yang merumput di padang rumput muda (kaya K, rendah Mg) untuk mencegah hipomagnesemia (grass tetany). Bioavailabilitas Mg dari MgO bervariasi (±30–70%) tergantung sumber; pilih grade reaktivitas tinggi. Suplementasi 20–30 g/ekor/hari untuk sapi laktasi berisiko.',
    kategoriItem: 'Mineral Makro',
    estimasiHarga: 8000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'magnesium-sulfat',
    nama: 'Magnesium Sulfat (MgSO₄)',
    rumusKimia: 'MgSO₄',
    namaLain: 'Magnesium Sulfate, Epsom Salt, Garam Inggris, Kieserite, MgSO4',
    deskripsi: 'Sumber Mg dan S yang sangat larut: Mg ±9–16% dan S ±13% BK (anhidrat). Kelarutan tinggi memudahkan suplementasi lewat air minum atau pencampuran merata. Sering digunakan pada unggas untuk suplementasi S selain Mg; bisa bersifat laksatif jika berlebihan. Kieserite (monohydrate) adalah bentuk paling umum untuk pakan.',
    kategoriItem: 'Mineral Makro',
    estimasiHarga: 5000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'kalium-klorida',
    nama: 'Kalium Klorida (KCl)',
    rumusKimia: 'KCl',
    namaLain: 'Potassium Chloride, Muriate of Potash, MOP Feed Grade, KCl, Kalium Klorida Pakan',
    deskripsi: 'Sumber K dan Cl berkonsentrasi tinggi: K ±52% dan Cl ±47% BK. Digunakan untuk memperbaiki keseimbangan elektrolit (dEB = Na + K − Cl, mEq/kg) pada ransum unggas periode panas dan pada babi. Berlebihan menyebabkan diare dan mengurangi konsumsi air; level aman ≤1% ransum. Perlu diimbangi dengan Na untuk menjaga rasio Na:K:Cl.',
    kategoriItem: 'Mineral Makro',
    estimasiHarga: 6000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'natrium-bikarbonat',
    nama: 'Natrium Bikarbonat (NaHCO₃)',
    rumusKimia: 'NaHCO₃',
    namaLain: 'Sodium Bicarbonate, Baking Soda, Soda Kue, Bikarbonat Soda, NaHCO3',
    deskripsi: 'Sumber Na dan buffer rumen: Na ±27% BK. Meningkatkan pH rumen (mencegah asidosis subakut / SARA) pada sapi yang diberi ransum kaya biji-bijian. Level standar 0,75–1,5% BK ransum sapi perah. Juga digunakan pada ransum unggas di musim panas untuk mengurangi stres panas (0,1–0,2% ransum) karena memperbaiki keseimbangan asam-basa darah.',
    kategoriItem: 'Mineral Makro',
    estimasiHarga: 4500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Sumber Sulfur ─────────────────────────────────────────────────────────────
  {
    id: 'sulfur-pakan',
    nama: 'Sulfur / Belerang Pakan',
    rumusKimia: 'S',
    namaLain: 'Elemental Sulfur, Feed Sulfur, Belerang Pakan, Flowers of Sulfur, Sulfur Feed Grade',
    deskripsi: 'Sulfur elemental sebagai sumber S untuk sintesis asam amino (metionin, sistin) dan vitamin (biotin, tiamin) pada ruminansia di mana mikroba rumen mengkonversi S anorganik ke S organik. S ±99% BK. Suplementasi 0,15–0,20% BK ransum untuk ruminansia yang mengonsumsi pakan tinggi NPN (urea). Toksik jika >0,4% ransum (polioencephalomalacia).',
    kategoriItem: 'Sumber Sulfur',
    estimasiHarga: 3500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Mineral Adsorben ──────────────────────────────────────────────────────────
  {
    id: 'zeolit',
    nama: 'Zeolit',
    rumusKimia: null,
    namaLain: 'Zeolite, Natural Zeolite, Klinoptilolit, Clinoptilolite, Zeolit Alam',
    deskripsi: 'Mineral silikat aluminosilikat berstruktur pori mikro dengan kapasitas tukar kation (CEC) tinggi. Digunakan dalam ransum ternak sebagai: (1) adsorben amonia di saluran cerna dan litter, (2) pengikat mikotoksin (aflatoksin), (3) buffer pH rumen. Level 1–3% BK ransum. Tidak memberikan mineral esensial signifikan tetapi memperbaiki efisiensi pakan dan kualitas lingkungan kandang.',
    kategoriItem: 'Mineral Adsorben',
    estimasiHarga: 2000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'bentonit',
    nama: 'Bentonit',
    rumusKimia: null,
    namaLain: 'Bentonite, Sodium Bentonite, Calcium Bentonite, Montmorillonite, Smektit',
    deskripsi: 'Mineral lempung aluminosilikat (montmorillonit) dengan kapasitas adsorpsi tinggi terhadap mikotoksin (aflatoksin, zearalenon, T-2 toxin) dan amonia. Ca ±1–2%, Mg ±0,5% BK. Digunakan sebagai mycotoxin binder 0,2–0,5% ransum dan sebagai binder pellet pakan (1–2%). Sodium bentonite lebih efektif untuk adsorpsi aflatoksin; calcium bentonite untuk zearalenon.',
    kategoriItem: 'Mineral Adsorben',
    estimasiHarga: 1800,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
];

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getMineralList(): MineralItem[] {
  return MINERAL_DB;
}

export function getMineralById(id: string): MineralItem | undefined {
  return MINERAL_DB.find(item => item.id === id);
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

export interface MineralRingkasan {
  totalReferensi: number;
  hargaRataRata: number | null;
  terakhirUpdate: string;
  dataLengkap: number;
}

export function computeMineralRingkasan(): MineralRingkasan {
  const items  = getMineralList();
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
