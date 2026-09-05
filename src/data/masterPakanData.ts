// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedCategory =
  | 'Hijauan'
  | 'Konsentrat'
  | 'Limbah Pertanian'
  | 'By Product'
  | 'Mineral'
  | 'Vitamin'
  | 'Fermentasi'
  | 'Silase'
  | 'Complete Feed'
  | 'Lainnya';

export type FeedForm =
  | 'Segar'
  | 'Basah'
  | 'Kering'
  | 'Tepung'
  | 'Cacahan'
  | 'Pellet'
  | 'Silase'
  | 'Cair'
  | 'Lainnya';

export type Palatability = 'Sangat Tinggi' | 'Tinggi' | 'Sedang' | 'Rendah';
export type ProteinLevel = 'rendah' | 'sedang' | 'tinggi';
export type EnergiLevel  = 'rendah' | 'sedang' | 'tinggi';

export interface MasterPakanItem {
  id: string;
  icon: string;
  name: string;
  alias: string;               // alternate names, for search
  category: FeedCategory;
  description: string;
  // Nutritional content — null = not recorded (DM-basis unless noted)
  proteinKasar: number | null; // % Crude Protein
  seratKasar: number | null;   // % Crude Fibre
  lemak: number | null;        // % Crude Fat (EE)
  abu: number | null;          // % Ash
  betn: number | null;         // % BETN (100 - CP - CF - EE - Ash)
  tdn: number | null;          // % Total Digestible Nutrients
  me: number | null;           // kcal/kg Metabolizable Energy
  ca: number | null;           // % Calcium
  p: number | null;            // % Phosphorus
  ndf: number | null;          // % Neutral Detergent Fibre
  adf: number | null;          // % Acid Detergent Fibre
  moisture: number | null;     // % Moisture (as-fed)
  bahanKering: number | null;  // % Dry Matter
  // Management
  palatabilitas: Palatability;
  maksimumPenggunaan: number | null; // % max in ration
  bentuk: FeedForm;
  sumber: string;
  referensi: string;           // literature / data source
  // Pricing
  estimasiHarga: number | null;    // IDR/kg
  hargaMarketplace: number | null; // IDR/kg from marketplace (if available)
  hargaUpdated: string;
  // Notes
  catatan: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ─── Category maps ────────────────────────────────────────────────────────────

export const CATEGORY_ICON: Record<FeedCategory, string> = {
  'Hijauan':          '🌿',
  'Konsentrat':       '🫘',
  'Limbah Pertanian': '♻️',
  'By Product':       '🏭',
  'Mineral':          '🧂',
  'Vitamin':          '💊',
  'Fermentasi':       '🧫',
  'Silase':           '🌽',
  'Complete Feed':    '🧩',
  'Lainnya':          '📦',
};

export const CATEGORY_STYLE: Record<FeedCategory, { color: string; bg: string }> = {
  'Hijauan':          { color: '#1b7a43', bg: '#e8f5ee' },
  'Konsentrat':       { color: '#7b5e2a', bg: '#fff8e1' },
  'Limbah Pertanian': { color: '#558b2f', bg: '#f1f8e9' },
  'By Product':       { color: '#ef6c00', bg: '#fff3e0' },
  'Mineral':          { color: '#0277bd', bg: '#e1f5fe' },
  'Vitamin':          { color: '#6a1b9a', bg: '#f3e5f5' },
  'Fermentasi':       { color: '#00695c', bg: '#e0f2f1' },
  'Silase':           { color: '#f9a825', bg: '#fffde7' },
  'Complete Feed':    { color: '#c62828', bg: '#ffebee' },
  'Lainnya':          { color: '#546e7a', bg: '#eceff1' },
};

export const ALL_CATEGORIES: FeedCategory[] = [
  'Hijauan', 'Konsentrat', 'Limbah Pertanian', 'By Product',
  'Mineral', 'Vitamin', 'Fermentasi', 'Silase', 'Complete Feed', 'Lainnya',
];

export const ALL_FORMS: FeedForm[] = [
  'Segar', 'Basah', 'Kering', 'Tepung', 'Cacahan', 'Pellet', 'Silase', 'Cair', 'Lainnya',
];

// Bentuk options for the filter sheet (spec-defined subset)
export const FILTER_FORMS: FeedForm[] = ['Basah', 'Kering', 'Tepung', 'Cacahan', 'Pellet'];

export const ALL_PALATABILITIES: Palatability[] = [
  'Sangat Tinggi', 'Tinggi', 'Sedang', 'Rendah',
];

// ─── Protein / Energy classification ─────────────────────────────────────────

/** Protein Kasar: rendah <10%, sedang 10–18%, tinggi >18% */
export function getProteinLevel(pk: number | null): ProteinLevel | null {
  if (pk === null) return null;
  if (pk < 10)  return 'rendah';
  if (pk <= 18) return 'sedang';
  return 'tinggi';
}

/** Energi by TDN: rendah <55%, sedang 55–70%, tinggi >70% */
export function getEnergiLevel(tdn: number | null): EnergiLevel | null {
  if (tdn === null) return null;
  if (tdn < 55)  return 'rendah';
  if (tdn <= 70) return 'sedang';
  return 'tinggi';
}

export const PROTEIN_LABEL: Record<ProteinLevel, string> = { rendah: 'Protein Rendah', sedang: 'Protein Sedang', tinggi: 'Protein Tinggi' };
export const ENERGI_LABEL:  Record<EnergiLevel,  string> = { rendah: 'Energi Rendah',  sedang: 'Energi Sedang',  tinggi: 'Energi Tinggi' };

// ─── In-memory database ───────────────────────────────────────────────────────

let _nextId = 100;
let _tick   = 0;

export const MASTER_PAKAN_DB: Record<string, MasterPakanItem> = {
  'mp-1': {
    id: 'mp-1', icon: '🌿', name: 'Rumput Gajah',
    alias: 'Rumput Napier, Pennisetum purpureum',
    category: 'Hijauan',
    description: 'Hijauan unggul tropis berproduksi tinggi, cocok untuk semua jenis ternak ruminansia.',
    proteinKasar: 10.2, seratKasar: 28.5, lemak: 2.1, abu: 9.8, betn: 49.4,
    tdn: 54.0, me: 1920, ca: 0.42, p: 0.28, ndf: 63.2, adf: 37.4,
    moisture: 81.5, bahanKering: 18.5,
    palatabilitas: 'Sangat Tinggi', maksimumPenggunaan: 60,
    bentuk: 'Segar', sumber: 'Produksi Sendiri / Lahan',
    referensi: 'NRC 2007; BPTP Jawa Barat 2020',
    estimasiHarga: 800, hargaMarketplace: null, hargaUpdated: '05 Jul 2026',
    catatan: 'Potong setiap 40–60 hari. Hindari pemberian berlebih untuk ternak laktasi.',
    createdAt: '01 Jan 2026', updatedAt: '05 Jul 2026',
  },
  'mp-2': {
    id: 'mp-2', icon: '🌿', name: 'Rumput Raja',
    alias: 'King Grass, Napier Hybrid, Rumput Sudan',
    category: 'Hijauan',
    description: 'Hibrida Napier × Gajah dengan produksi biomassa sangat tinggi.',
    proteinKasar: 8.5, seratKasar: 30.1, lemak: 1.8, abu: 10.2, betn: 49.4,
    tdn: 52.0, me: 1850, ca: 0.38, p: 0.25, ndf: 66.5, adf: 40.1,
    moisture: 83.0, bahanKering: 17.0,
    palatabilitas: 'Tinggi', maksimumPenggunaan: 55,
    bentuk: 'Segar', sumber: 'Produksi Sendiri / Lahan',
    referensi: 'BPTP 2019',
    estimasiHarga: 600, hargaMarketplace: null, hargaUpdated: '01 Jun 2026',
    catatan: 'Kandungan air tinggi. Layu 2–4 jam sebelum diberikan untuk mengurangi risiko kembung.',
    createdAt: '01 Jan 2026', updatedAt: '01 Jun 2026',
  },
  'mp-3': {
    id: 'mp-3', icon: '🌿', name: 'Alfalfa',
    alias: 'Lucerne, Medicago sativa, Semanggi Ungu',
    category: 'Hijauan',
    description: 'Leguminosa berprotein tinggi, ideal sebagai suplemen protein untuk indukan dan pejantan.',
    proteinKasar: 18.5, seratKasar: 25.0, lemak: 2.5, abu: 8.5, betn: 45.5,
    tdn: 60.0, me: 2140, ca: 1.40, p: 0.30, ndf: 42.0, adf: 30.0,
    moisture: 12.0, bahanKering: 88.0,
    palatabilitas: 'Sangat Tinggi', maksimumPenggunaan: 30,
    bentuk: 'Kering', sumber: 'Pembelian',
    referensi: 'NRC 2007; Siregar 2008',
    estimasiHarga: 3500, hargaMarketplace: 3800, hargaUpdated: '01 Jul 2026',
    catatan: 'Harga tinggi — gunakan sebagai suplemen bukan pakan utama. Baik untuk indukan bunting dan laktasi.',
    createdAt: '15 Feb 2026', updatedAt: '01 Jul 2026',
  },
  'mp-4': {
    id: 'mp-4', icon: '🌽', name: 'Silase Tebon Jagung',
    alias: 'Corn Silage, Silase Jagung Muda',
    category: 'Silase',
    description: 'Hijauan fermentasi dari tanaman jagung muda, kaya energi dan palatabilitas tinggi.',
    proteinKasar: 8.0, seratKasar: 22.0, lemak: 2.8, abu: 5.5, betn: 61.7,
    tdn: 66.0, me: 2380, ca: 0.25, p: 0.20, ndf: 48.0, adf: 28.0,
    moisture: 70.0, bahanKering: 30.0,
    palatabilitas: 'Sangat Tinggi', maksimumPenggunaan: 50,
    bentuk: 'Silase', sumber: 'Produksi Sendiri',
    referensi: 'Widyastuti 2018; FAO Silage Guidelines',
    estimasiHarga: 1200, hargaMarketplace: null, hargaUpdated: '20 Jun 2026',
    catatan: 'Simpan kedap udara. pH target ≤ 4,2. Tahan 6–12 bulan jika disimpan benar.',
    createdAt: '10 Mar 2026', updatedAt: '20 Jun 2026',
  },
  'mp-5': {
    id: 'mp-5', icon: '♻️', name: 'Jerami Kering',
    alias: 'Rice Straw, Jerami Padi',
    category: 'Limbah Pertanian',
    description: 'Limbah pertanian bernilai serat tinggi, digunakan sebagai pakan basal murah.',
    proteinKasar: 4.5, seratKasar: 34.0, lemak: 1.5, abu: 13.0, betn: 47.0,
    tdn: 42.0, me: 1500, ca: 0.22, p: 0.10, ndf: 72.0, adf: 47.0,
    moisture: 14.0, bahanKering: 86.0,
    palatabilitas: 'Sedang', maksimumPenggunaan: 40,
    bentuk: 'Kering', sumber: 'Pembelian / Produksi Sendiri',
    referensi: 'Hidayat 2015; BPTP Sulsel',
    estimasiHarga: 500, hargaMarketplace: 550, hargaUpdated: '01 Jul 2026',
    catatan: 'Nilai nutrisi rendah — perlu dikombinasi dengan pakan berprotein atau konsentrat.',
    createdAt: '01 Jan 2026', updatedAt: '01 Jul 2026',
  },
  'mp-6': {
    id: 'mp-6', icon: '♻️', name: 'Dedak Padi',
    alias: 'Rice Bran, Bekatul, Bran Padi',
    category: 'Limbah Pertanian',
    description: 'Hasil samping penggilingan padi, sumber energi dan serat yang ekonomis.',
    proteinKasar: 12.8, seratKasar: 11.0, lemak: 12.5, abu: 10.5, betn: 53.2,
    tdn: 67.0, me: 2390, ca: 0.06, p: 1.50, ndf: 35.0, adf: 15.0,
    moisture: 12.0, bahanKering: 88.0,
    palatabilitas: 'Tinggi', maksimumPenggunaan: 25,
    bentuk: 'Tepung', sumber: 'Pembelian',
    referensi: 'Hartadi 2005; SNI Dedak Padi',
    estimasiHarga: 3500, hargaMarketplace: 3200, hargaUpdated: '07 Jul 2026',
    catatan: 'Mudah tengik — beli segar dan simpan maks 2 minggu. P tinggi tapi bioavailabilitas rendah.',
    createdAt: '01 Jan 2026', updatedAt: '07 Jul 2026',
  },
  'mp-7': {
    id: 'mp-7', icon: '🧩', name: 'Konsentrat Domba',
    alias: 'Sheep Concentrate, Pakan Jadi Domba',
    category: 'Complete Feed',
    description: 'Pakan komplit formulasi khusus domba untuk pertumbuhan dan pemeliharaan optimal.',
    proteinKasar: 16.0, seratKasar: 8.0, lemak: 4.5, abu: 7.0, betn: 64.5,
    tdn: 72.0, me: 2570, ca: 0.80, p: 0.50, ndf: 32.0, adf: 18.0,
    moisture: 12.0, bahanKering: 88.0,
    palatabilitas: 'Tinggi', maksimumPenggunaan: 50,
    bentuk: 'Pellet', sumber: 'Pembelian',
    referensi: 'Label Produk; SNI Complete Feed',
    estimasiHarga: 9000, hargaMarketplace: 8500, hargaUpdated: '06 Jul 2026',
    catatan: 'Gabungkan dengan hijauan 60:40. Berikan 250–400 g/ekor/hari untuk penggemukan.',
    createdAt: '01 Jan 2026', updatedAt: '06 Jul 2026',
  },
  'mp-8': {
    id: 'mp-8', icon: '🫘', name: 'Jagung Giling',
    alias: 'Corn Meal, Tepung Jagung, Ground Corn',
    category: 'Konsentrat',
    description: 'Sumber energi utama dalam pakan ternak, TDN sangat tinggi.',
    proteinKasar: 8.9, seratKasar: 2.2, lemak: 3.8, abu: 1.3, betn: 83.8,
    tdn: 80.0, me: 2860, ca: 0.02, p: 0.27, ndf: 12.0, adf: 4.0,
    moisture: 13.0, bahanKering: 87.0,
    palatabilitas: 'Sangat Tinggi', maksimumPenggunaan: 40,
    bentuk: 'Tepung', sumber: 'Pembelian',
    referensi: 'NRC 2007; Hartadi 2005',
    estimasiHarga: 5500, hargaMarketplace: 5200, hargaUpdated: '07 Jul 2026',
    catatan: 'TDN tertinggi di antara biji-bijian. Hindari penggilingan terlalu halus agar tidak asidosis.',
    createdAt: '01 Feb 2026', updatedAt: '07 Jul 2026',
  },
  'mp-9': {
    id: 'mp-9', icon: '🫘', name: 'Bungkil Kedelai',
    alias: 'Soybean Meal, SBM, Tepung Kedelai',
    category: 'Konsentrat',
    description: 'Sumber protein nabati terbaik untuk ruminansia, kandungan asam amino seimbang.',
    proteinKasar: 44.0, seratKasar: 6.0, lemak: 1.5, abu: 6.5, betn: 42.0,
    tdn: 78.0, me: 2780, ca: 0.30, p: 0.65, ndf: 18.0, adf: 10.0,
    moisture: 11.0, bahanKering: 89.0,
    palatabilitas: 'Tinggi', maksimumPenggunaan: 20,
    bentuk: 'Tepung', sumber: 'Pembelian',
    referensi: 'NRC 2007; Tillman 1998',
    estimasiHarga: 12000, hargaMarketplace: 11500, hargaUpdated: '05 Jul 2026',
    catatan: 'Protein kasar tertinggi dari sumber nabati. Gunakan sebagai suplemen protein pada pakan penggemukan.',
    createdAt: '01 Feb 2026', updatedAt: '05 Jul 2026',
  },
  'mp-10': {
    id: 'mp-10', icon: '🏭', name: 'Bungkil Kopra',
    alias: 'Copra Meal, Coconut Cake, Bungkil Kelapa',
    category: 'By Product',
    description: 'Hasil samping industri minyak kelapa, sumber protein dan lemak yang ekonomis.',
    proteinKasar: 21.0, seratKasar: 13.5, lemak: 8.0, abu: 6.2, betn: 51.3,
    tdn: 65.0, me: 2320, ca: 0.18, p: 0.55, ndf: 55.0, adf: 34.0,
    moisture: 10.0, bahanKering: 90.0,
    palatabilitas: 'Sedang', maksimumPenggunaan: 25,
    bentuk: 'Tepung', sumber: 'Pembelian',
    referensi: 'Hartadi 2005; FAO Feedipedia',
    estimasiHarga: 3000, hargaMarketplace: 2800, hargaUpdated: '01 Jul 2026',
    catatan: 'Hati-hati aflatoksin — beli dari sumber terpercaya. Simpan kering dan hindari kelembapan.',
    createdAt: '10 Mar 2026', updatedAt: '01 Jul 2026',
  },
  'mp-11': {
    id: 'mp-11', icon: '🏭', name: 'Molases',
    alias: 'Tetes Tebu, Blackstrap Molasses, Molasses',
    category: 'By Product',
    description: 'Hasil samping industri gula, pengikat pakan dan sumber energi fermentable cepat.',
    proteinKasar: 3.0, seratKasar: 0.0, lemak: 0.1, abu: 9.5, betn: 87.4,
    tdn: 73.0, me: 2600, ca: 0.74, p: 0.10, ndf: null, adf: null,
    moisture: 25.0, bahanKering: 75.0,
    palatabilitas: 'Sangat Tinggi', maksimumPenggunaan: 10,
    bentuk: 'Cair', sumber: 'Pembelian',
    referensi: 'NRC 2007; Sugeng 2000',
    estimasiHarga: 2500, hargaMarketplace: 2700, hargaUpdated: '01 Jun 2026',
    catatan: 'Batasi maksimum 10% ransum. Tingkatkan palatabilitas pakan berkualitas rendah. Baik untuk silase.',
    createdAt: '15 Feb 2026', updatedAt: '01 Jun 2026',
  },
  'mp-12': {
    id: 'mp-12', icon: '📦', name: 'Urea',
    alias: 'Feed Grade Urea, NPN Urea',
    category: 'Lainnya',
    description: 'Sumber nitrogen non-protein (NPN) untuk sintesis protein mikroba di rumen.',
    proteinKasar: null, seratKasar: null, lemak: null, abu: null, betn: null,
    tdn: null, me: null, ca: null, p: null, ndf: null, adf: null,
    moisture: 1.0, bahanKering: 99.0,
    palatabilitas: 'Rendah', maksimumPenggunaan: 1,
    bentuk: 'Tepung', sumber: 'Pembelian',
    referensi: 'NRC 2007; FAO NPN Guidelines',
    estimasiHarga: 4500, hargaMarketplace: null, hargaUpdated: '01 Jul 2026',
    catatan: 'BAHAYA jika overdosis — dosis maks 15 g/ekor/hari. Campurkan merata, jangan berikan langsung. Setara CP 281%.',
    createdAt: '15 Feb 2026', updatedAt: '01 Jul 2026',
  },
  'mp-13': {
    id: 'mp-13', icon: '🧂', name: 'Mineral Mix',
    alias: 'Complete Mineral, Premix Mineral',
    category: 'Mineral',
    description: 'Campuran mineral makro dan mikro esensial untuk metabolisme ternak.',
    proteinKasar: null, seratKasar: null, lemak: null, abu: null, betn: null,
    tdn: null, me: null, ca: 18.0, p: 8.0, ndf: null, adf: null,
    moisture: 3.0, bahanKering: 97.0,
    palatabilitas: 'Sedang', maksimumPenggunaan: 2,
    bentuk: 'Tepung', sumber: 'Pembelian',
    referensi: 'Label Produk; SNI Premix',
    estimasiHarga: 8000, hargaMarketplace: 7500, hargaUpdated: '03 Jul 2026',
    catatan: 'Berikan 10–15 g/ekor/hari. Simpan kering dan tertutup rapat.',
    createdAt: '01 Jan 2026', updatedAt: '03 Jul 2026',
  },
  'mp-14': {
    id: 'mp-14', icon: '🧂', name: 'Garam (NaCl)',
    alias: 'NaCl, Table Salt, Garam Ternak',
    category: 'Mineral',
    description: 'Mineral esensial pengatur keseimbangan elektrolit dan osmotik.',
    proteinKasar: null, seratKasar: null, lemak: null, abu: null, betn: null,
    tdn: null, me: null, ca: null, p: null, ndf: null, adf: null,
    moisture: 0.5, bahanKering: 99.5,
    palatabilitas: 'Sedang', maksimumPenggunaan: 1,
    bentuk: 'Kering', sumber: 'Pembelian',
    referensi: 'NRC 2007',
    estimasiHarga: 1500, hargaMarketplace: 1200, hargaUpdated: '01 Jun 2026',
    catatan: 'Berikan 5–10 g/ekor/hari atau sediakan jilatan bebas. Kekurangan garam menurunkan produktivitas.',
    createdAt: '01 Jan 2026', updatedAt: '01 Jun 2026',
  },
  'mp-15': {
    id: 'mp-15', icon: '💊', name: 'Vitamin A+D3',
    alias: 'Vitamin AD3, Vit A Vit D',
    category: 'Vitamin',
    description: 'Suplemen vitamin larut lemak untuk kesehatan mata, reproduksi, dan metabolisme kalsium.',
    proteinKasar: null, seratKasar: null, lemak: null, abu: null, betn: null,
    tdn: null, me: null, ca: null, p: null, ndf: null, adf: null,
    moisture: 5.0, bahanKering: 95.0,
    palatabilitas: 'Rendah', maksimumPenggunaan: 1,
    bentuk: 'Tepung', sumber: 'Pembelian',
    referensi: 'Label Produk; SNI Vitamin Ternak',
    estimasiHarga: 15000, hargaMarketplace: 14000, hargaUpdated: '01 Jul 2026',
    catatan: 'Dosis berlebih bersifat toksik — ikuti anjuran label. Simpan jauh dari sinar matahari langsung.',
    createdAt: '01 Jan 2026', updatedAt: '01 Jul 2026',
  },
  'mp-16': {
    id: 'mp-16', icon: '🧫', name: 'Fermentasi Ampas Tahu',
    alias: 'Tofu Waste Fermented, Ampas Tahu Probiotik',
    category: 'Fermentasi',
    description: 'Ampas tahu difermentasi dengan probiotik untuk meningkatkan kecernaan dan nilai nutrisi.',
    proteinKasar: 22.0, seratKasar: 9.5, lemak: 7.5, abu: 4.0, betn: 57.0,
    tdn: 70.0, me: 2500, ca: 0.25, p: 0.40, ndf: 35.0, adf: 20.0,
    moisture: 75.0, bahanKering: 25.0,
    palatabilitas: 'Tinggi', maksimumPenggunaan: 20,
    bentuk: 'Basah', sumber: 'Produksi Sendiri',
    referensi: 'Hidayat 2020; Jurnal Peternakan Indonesia',
    estimasiHarga: 800, hargaMarketplace: null, hargaUpdated: '01 Jul 2026',
    catatan: 'Kandungan air sangat tinggi. Berikan segar — tidak tahan lebih dari 2 hari tanpa fermentasi lanjutan.',
    createdAt: '01 May 2026', updatedAt: '01 Jul 2026',
  },
  'mp-17': {
    id: 'mp-17', icon: '🏭', name: 'Ampas Kedelai Kering',
    alias: 'Dried Soy Pulp, Soybean Pulp, Ampasedelai Kering, Ampas Susu Kedelai',
    category: 'By Product',
    description: 'Sisa padat kering hasil ekstraksi susu kedelai. Berbeda dari ampas tahu basah; versi kering lebih tahan simpan. Digunakan sebagai sumber protein nabati ekonomis dalam ransum ternak. Nilai nutrisi spesifik (PK, SK, TDN) perlu ditambahkan berdasarkan analisis laboratorium.',
    proteinKasar: null, seratKasar: null, lemak: null, abu: null, betn: null,
    tdn: null, me: null, ca: null, p: null, ndf: null, adf: null,
    moisture: null, bahanKering: null,
    palatabilitas: 'Sedang', maksimumPenggunaan: 30,
    bentuk: 'Kering', sumber: 'Industri Pengolahan Kedelai',
    referensi: '',
    estimasiHarga: null, hargaMarketplace: null, hargaUpdated: '',
    catatan: 'Data nutrisi belum lengkap. Tambahkan berdasarkan analisis laboratorium sebelum digunakan untuk perhitungan formula.',
    createdAt: '05 Sep 2026', updatedAt: '05 Sep 2026',
  },
};

// ─── CRUD Functions ───────────────────────────────────────────────────────────

export function getMasterPakanList(): MasterPakanItem[] {
  return Object.values(MASTER_PAKAN_DB);
}

export function getMasterPakanById(id: string): MasterPakanItem | undefined {
  return MASTER_PAKAN_DB[id];
}

/** Case-insensitive name lookup — fallback for bahan referenced by nama instead of id. */
export function getMasterPakanByName(name: string): MasterPakanItem | undefined {
  const q = name.trim().toLowerCase();
  return Object.values(MASTER_PAKAN_DB).find(
    (item) => item.name.toLowerCase() === q || item.alias.toLowerCase().includes(q),
  );
}

export function getMasterPakanTick(): number {
  return _tick;
}

export function addMasterPakan(
  item: Omit<MasterPakanItem, 'id' | 'icon' | 'createdAt' | 'updatedAt'>,
): MasterPakanItem {
  const id = `mp-${++_nextId}`;
  const now = formatDate(new Date());
  const icon = CATEGORY_ICON[item.category];
  const newItem: MasterPakanItem = { ...item, id, icon, createdAt: now, updatedAt: now };
  MASTER_PAKAN_DB[id] = newItem;
  _tick++;
  return newItem;
}

export function updateMasterPakan(
  id: string,
  updates: Partial<Omit<MasterPakanItem, 'id' | 'createdAt'>>,
): void {
  if (!MASTER_PAKAN_DB[id]) return;
  const now = formatDate(new Date());
  MASTER_PAKAN_DB[id] = {
    ...MASTER_PAKAN_DB[id],
    ...updates,
    icon: updates.category ? CATEGORY_ICON[updates.category] : MASTER_PAKAN_DB[id].icon,
    updatedAt: now,
  };
  _tick++;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatPrice(n: number | null, suffix = '/kg'): string {
  if (n === null) return '—';
  return `Rp ${n.toLocaleString('id-ID')}${suffix}`;
}

export function formatPct(n: number | null, decimals = 1): string {
  if (n === null) return '—';
  return `${n.toFixed(decimals)}%`;
}

export function formatMe(n: number | null): string {
  if (n === null) return '—';
  return `${n.toLocaleString('id-ID')} kkal/kg`;
}
