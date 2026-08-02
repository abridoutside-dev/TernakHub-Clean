// ─── Master Pakan — Jagung Sub Categories ─────────────────────────────────────
// Level 2 reference items for the "Jagung" parent category.
// Level 3 detail (nutrisi, penggunaan, harga, referensi) implemented in MP-003.

export type KategoriItem =
  | 'Hasil Utama'
  | 'Hasil Samping'
  | 'Limbah Pertanian'
  | 'Limbah Industri'
  // Rumput sub-categories (MP-006)
  | 'Rumput Unggul'
  | 'Rumput Tropis'
  | 'Rumput Savana'
  | 'Rumput Lokal'
  // Buah & Limbah Buah sub-categories (MP-024)
  | 'Buah Segar'
  | 'Kulit Buah'
  | 'Ampas Buah'
  | 'Biji Buah'
  // Limbah Industri Pangan sub-categories (MP-026)
  | 'By-product Serealia'
  | 'Ampas Pati'
  | 'Ampas Protein Nabati'
  | 'By-product Brewing'
  | 'Ampas Bakeri & Pasta'
  | 'Ampas Perkebunan'
  // Sumber Protein Hewani sub-categories (MP-028)
  | 'Tepung Ikan & Hasil Laut'
  | 'Tepung Daging & Jeroan'
  | 'Produk Unggas & Bulu'
  | 'Produk Perairan Lokal'
  | 'Produk Susu & Telur'
  // Mineral sub-categories (MP-030)
  | 'Sumber Kalsium'
  | 'Sumber Fosfor'
  | 'Mineral Makro'
  | 'Sumber Sulfur'
  | 'Mineral Adsorben'
  // Vitamin & Feed Additive sub-categories (MP-032)
  | 'Vitamin Larut Lemak'
  | 'Vitamin Larut Air'
  | 'Enzim & Mikroba Pakan'
  | 'Asam Organik & Buffer'
  | 'Antioksidan & Pelindung'
  // Bahan Cair sub-categories (MP-034)
  | 'Molases & Nira'
  | 'Produk Susu Cair'
  | 'Minyak Nabati & Ikan'
  | 'Cairan Sintetis'
  // Lainnya sub-categories (MP-036)
  | 'Adsorben & Pengikat'
  | 'Bahan Bioaktif Tanaman'
  | 'Bahan Organik Alami';

export type BentukBahan = 'Segar' | 'Kering' | 'Tepung' | 'Butiran' | 'Cair' | 'Pellet';
export type Palatabilitas = 'Sangat Baik' | 'Baik' | 'Sedang' | 'Kurang';
export type ProgramCocok =
  | 'Penggemukan'
  | 'Indukan'
  | 'Bunting'
  | 'Menyusui'
  | 'Grower'
  | 'Pejantan';
export type InsightType =
  | 'kelebihan'
  | 'kekurangan'
  | 'kombinasi'
  | 'peringatan'
  | 'fungsi'
  | 'alternatif';

export interface NutrisiData {
  pk?: number | null;       // Protein Kasar (%)
  sk?: number | null;       // Serat Kasar (%)
  lk?: number | null;       // Lemak Kasar (%)
  abu?: number | null;      // Abu (%)
  betn?: number | null;     // BETN (%)
  tdn?: number | null;      // TDN (%)
  me?: number | null;       // Energi Metabolis (kcal/kg)
  bk?: number | null;       // Bahan Kering (%)
  kadarAir?: number | null; // Kadar Air (%)
  ndf?: number | null;      // NDF (%)
  adf?: number | null;      // ADF (%)
  ca?: number | null;       // Ca (%)
  p?: number | null;        // P (%)
  mg?: number | null;       // Mg (%)
  na?: number | null;       // Na (%)
  k?: number | null;        // K (%)
  cl?: number | null;       // Cl (%)
  s?: number | null;        // S (%)
  vitamin?: string | null;
  mineral?: string | null;
}

export interface PenggunaanData {
  palatabilitas?: Palatabilitas | null;
  maksPenggunaan?: number | null;  // % maksimal dalam ransum
  targetTernak?: string[];
  programCocok?: ProgramCocok[];
  musimTerbaik?: string | null;      // Rumput: musim panen terbaik
  umurPanenTerbaik?: string | null;  // Rumput: umur panen terbaik
  catatan?: string | null;
}

export interface HargaData {
  estimasiAI?: number | null;       // IDR/kg
  hargaMarketplace?: number | null; // IDR/kg
  satuan?: string;
  supplier?: string | null;
  updatedAt?: string;
}

export interface ReferensiData {
  literatur?: string[];
  sumberData?: string | null;
  catatan?: string | null;
}

export interface AiInsightItem {
  type: InsightType;
  icon: string;
  text: string;
}

export interface JagungItem {
  id: string;
  nama: string;
  namaLain: string;
  deskripsi: string;
  kategoriItem: KategoriItem;
  estimasiHarga: number | null; // IDR/kg (ringkasan list level)
  hargaUpdated: string;
  dataLengkap: boolean;
  updatedAt: string;
  // Detail fields (MP-003) — populated in jagungDetailData.ts
  namaLatin?: string | null;
  asalBahan?: string | null;
  bentuk?: BentukBahan[];
  nutrisi?: NutrisiData;
  penggunaan?: PenggunaanData;
  harga?: HargaData;
  referensi?: ReferensiData;
  aiInsight?: AiInsightItem[];
  // Rumput-specific fields (MP-007)
  asal?: string | null;
  habitat?: string | null;
  umurPanenIdeal?: string | null;
  tinggiTanaman?: string | null;
  produksiHijauan?: string | null;
  kelebihan?: string | null;
  kekurangan?: string | null;
  karakteristik?: string | null;
}

export const KATEGORI_ITEM_STYLE: Record<KategoriItem, { color: string; bg: string }> = {
  'Hasil Utama':       { color: '#e65100', bg: '#fff3e0' },
  'Hasil Samping':     { color: '#7b5e2a', bg: '#fff8e1' },
  'Limbah Pertanian':  { color: '#558b2f', bg: '#f1f8e9' },
  'Limbah Industri':   { color: '#546e7a', bg: '#eceff1' },
  // Rumput categories (MP-006)
  'Rumput Unggul':     { color: '#2e7d32', bg: '#e8f5e9' },
  'Rumput Tropis':     { color: '#00695c', bg: '#e0f2f1' },
  'Rumput Savana':     { color: '#f57c00', bg: '#fff3e0' },
  'Rumput Lokal':      { color: '#558b2f', bg: '#f9fbe7' },
  // Buah & Limbah Buah categories (MP-024)
  'Buah Segar':           { color: '#f57f17', bg: '#fff9c4' },
  'Kulit Buah':           { color: '#8d6e63', bg: '#efebe9' },
  'Ampas Buah':           { color: '#546e7a', bg: '#eceff1' },
  'Biji Buah':            { color: '#6d4c41', bg: '#efebe9' },
  // Limbah Industri Pangan categories (MP-026)
  'By-product Serealia':  { color: '#6d4c41', bg: '#efebe9' },
  'Ampas Pati':           { color: '#7b5e2a', bg: '#fff8e1' },
  'Ampas Protein Nabati': { color: '#1b7a43', bg: '#e8f5ee' },
  'By-product Brewing':   { color: '#00695c', bg: '#e0f2f1' },
  'Ampas Bakeri & Pasta': { color: '#e65100', bg: '#fff3e0' },
  'Ampas Perkebunan':     { color: '#4e342e', bg: '#efebe9' },
  // Sumber Protein Hewani categories (MP-028)
  'Tepung Ikan & Hasil Laut': { color: '#0277bd', bg: '#e1f5fe' },
  'Tepung Daging & Jeroan':   { color: '#bf360c', bg: '#fbe9e7' },
  'Produk Unggas & Bulu':     { color: '#f57f17', bg: '#fff9c4' },
  'Produk Perairan Lokal':    { color: '#2e7d32', bg: '#e8f5e9' },
  'Produk Susu & Telur':      { color: '#6a1b9a', bg: '#f3e5f5' },
  // Mineral categories (MP-030)
  'Sumber Kalsium':  { color: '#0288d1', bg: '#e1f5fe' },
  'Sumber Fosfor':   { color: '#7b1fa2', bg: '#f3e5f5' },
  'Mineral Makro':   { color: '#00695c', bg: '#e0f2f1' },
  'Sumber Sulfur':   { color: '#f57f17', bg: '#fff9c4' },
  'Mineral Adsorben': { color: '#546e7a', bg: '#eceff1' },
  // Vitamin & Feed Additive categories (MP-032)
  'Vitamin Larut Lemak':    { color: '#6a1b9a', bg: '#f3e5f5' },
  'Vitamin Larut Air':      { color: '#0277bd', bg: '#e1f5fe' },
  'Enzim & Mikroba Pakan':  { color: '#00695c', bg: '#e0f2f1' },
  'Asam Organik & Buffer':  { color: '#e65100', bg: '#fff3e0' },
  'Antioksidan & Pelindung': { color: '#c62828', bg: '#fdecea' },
  // Bahan Cair categories (MP-034)
  'Molases & Nira':        { color: '#7b5e2a', bg: '#fff8e1' },
  'Produk Susu Cair':      { color: '#0277bd', bg: '#e1f5fe' },
  'Minyak Nabati & Ikan':  { color: '#f57f17', bg: '#fff9c4' },
  'Cairan Sintetis':       { color: '#00838f', bg: '#e0f7fa' },
  // Lainnya categories (MP-036)
  'Adsorben & Pengikat':      { color: '#455a64', bg: '#eceff1' },
  'Bahan Bioaktif Tanaman':   { color: '#558b2f', bg: '#f1f8e9' },
  'Bahan Organik Alami':      { color: '#795548', bg: '#efebe9' },
};

export const KATEGORI_ITEM_ALL: KategoriItem[] = [
  'Hasil Utama',
  'Hasil Samping',
  'Limbah Pertanian',
  'Limbah Industri',
];

export const JAGUNG_DB: JagungItem[] = [
  {
    id: 'jagung-pipil',
    nama: 'Jagung Pipil',
    namaLain: 'Shelled Corn, Maize Grain',
    deskripsi: 'Biji jagung utuh yang sudah dipisahkan dari tongkol. Sumber energi utama dalam ransum ternak ruminansia dan unggas.',
    kategoriItem: 'Hasil Utama',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 5500,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'jagung-pipil-kuning',
    nama: 'Jagung Pipil Kuning',
    namaLain: 'Yellow Shelled Corn',
    deskripsi: 'Jagung pipil varietas biji kuning, kaya karotenoid (pro-vitamin A). Varietas paling umum digunakan dalam pakan ternak dan unggas.',
    kategoriItem: 'Hasil Utama',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 5600,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'jagung-pipil-putih',
    nama: 'Jagung Pipil Putih',
    namaLain: 'White Shelled Corn',
    deskripsi: 'Jagung pipil varietas biji putih, rendah karotenoid dibanding jagung kuning. Nilai energi setara, dipakai bila ransum tidak memerlukan pigmentasi.',
    kategoriItem: 'Hasil Utama',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 5500,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'jagung-utuh',
    nama: 'Jagung Utuh',
    namaLain: 'Whole Corn Grain',
    deskripsi: 'Biji jagung yang diberikan dalam bentuk utuh tanpa proses giling atau pecah. Umum digunakan pada pakan unggas free-range atau ternak besar.',
    kategoriItem: 'Hasil Utama',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 5400,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'jagung-flaking',
    nama: 'Jagung Flaking',
    namaLain: 'Flaked Corn',
    deskripsi: 'Jagung yang diproses dengan pemanasan dan pemipihan (flaking) untuk meningkatkan kecernaan pati. Umum dipakai pada ransum penggemukan sapi.',
    kategoriItem: 'Hasil Samping',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 6800,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'jagung-steam-flake',
    nama: 'Jagung Steam Flake',
    namaLain: 'Steam Flaked Corn (SFC)',
    deskripsi: 'Jagung yang diolah dengan uap panas bertekanan lalu dipipihkan (steam-flaking). Kecernaan pati rumen jauh lebih tinggi dibanding jagung giling biasa.',
    kategoriItem: 'Hasil Samping',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 7200,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'tepung-jagung',
    nama: 'Tepung Jagung (Corn Meal)',
    namaLain: 'Corn Meal',
    deskripsi: 'Biji jagung yang digiling halus hingga menjadi tepung. Digunakan sebagai bahan pengisi energi dalam ransum unggas dan pakan starter.',
    kategoriItem: 'Hasil Utama',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 6200,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'jagung-pipil-kering',
    nama: 'Jagung Pipil Kering',
    namaLain: 'Dry Shelled Corn',
    deskripsi: 'Jagung pipil dengan kadar air ≤14%, lebih stabil untuk penyimpanan jangka panjang. Kualitas standar perdagangan.',
    kategoriItem: 'Hasil Utama',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 5800,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'jagung-pipil-basah',
    nama: 'Jagung Pipil Basah',
    namaLain: 'High Moisture Corn, Wet Corn',
    deskripsi: 'Jagung pipil segar dengan kadar air >18%. Palatabilitas tinggi, harus segera digunakan atau difermentasi.',
    kategoriItem: 'Hasil Utama',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 4500,
    hargaUpdated: '05 Jul 2026',
    dataLengkap: true,
    updatedAt: '05 Jul 2026',
  },
  {
    id: 'jagung-giling',
    nama: 'Jagung Giling',
    namaLain: 'Corn Meal, Ground Corn, Tepung Jagung',
    deskripsi: 'Jagung yang telah digiling kasar hingga berbentuk tepung atau butiran halus. Dicernaan lebih tinggi dibanding jagung utuh.',
    kategoriItem: 'Hasil Utama',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 6000,
    hargaUpdated: '07 Jul 2026',
    dataLengkap: true,
    updatedAt: '07 Jul 2026',
  },
  {
    id: 'jagung-pecah',
    nama: 'Jagung Pecah (Cracked Corn)',
    namaLain: 'Cracked Corn, Broken Corn',
    deskripsi: 'Biji jagung yang retak atau pecah dari proses penanganan pascapanen. Nilai nutrisi setara jagung pipil, harga lebih murah.',
    kategoriItem: 'Hasil Utama',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 4800,
    hargaUpdated: '06 Jul 2026',
    dataLengkap: true,
    updatedAt: '06 Jul 2026',
  },
  {
    id: 'jagung-muda',
    nama: 'Jagung Muda',
    namaLain: 'Sweet Corn, Baby Corn, Green Corn',
    deskripsi: 'Jagung yang dipanen sebelum mencapai kematangan penuh. Kadar air tinggi, palatabilitas sangat baik, cocok untuk sapi perah.',
    kategoriItem: 'Hasil Utama',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 3000,
    hargaUpdated: '01 Jul 2026',
    dataLengkap: true,
    updatedAt: '01 Jul 2026',
  },
  {
    id: 'jagung-afkir',
    nama: 'Jagung Afkir',
    namaLain: 'Cull Corn, Off-Grade Corn',
    deskripsi: 'Jagung yang tidak memenuhi standar mutu pangan karena ukuran, warna, atau kontaminasi ringan. Nilai nutrisi mendekati jagung normal.',
    kategoriItem: 'Hasil Samping',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 3500,
    hargaUpdated: '05 Jul 2026',
    dataLengkap: true,
    updatedAt: '05 Jul 2026',
  },
  {
    id: 'tebon-jagung',
    nama: 'Tebon Jagung',
    namaLain: 'Corn Stover (Fresh), Whole Plant Corn',
    deskripsi: 'Seluruh bagian tanaman jagung muda (batang, daun, dan tongkol muda) yang dipanen utuh. Sumber hijauan berkualitas tinggi.',
    kategoriItem: 'Hasil Samping',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 800,
    hargaUpdated: '01 Jul 2026',
    dataLengkap: true,
    updatedAt: '01 Jul 2026',
  },
  {
    id: 'tongkol-jagung',
    nama: 'Tongkol Jagung',
    namaLain: 'Whole Corn Cob (Unshelled)',
    deskripsi: 'Gagang/tongkol jagung utuh beserta janggel sebelum biji dipipil bersih. Serat kasar sangat tinggi, nilai energi rendah, digunakan sebagai roughage.',
    kategoriItem: 'Limbah Pertanian',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 500,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'janggel-jagung',
    nama: 'Janggel Jagung (Corn Cob)',
    namaLain: 'Corn Cob, Inti Tongkol',
    deskripsi: 'Inti keras dari tongkol jagung setelah biji dan serabut dilepas. Serat sangat tinggi, digunakan untuk mengganjal ransum serat.',
    kategoriItem: 'Limbah Pertanian',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 500,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'janggel-giling',
    nama: 'Janggel Giling',
    namaLain: 'Ground Corn Cob, Corn Cob Meal',
    deskripsi: 'Janggel jagung yang telah digiling menjadi tepung kasar. Lebih mudah dicampur dalam ransum, digunakan sebagai pengencer atau sumber serat.',
    kategoriItem: 'Limbah Pertanian',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 800,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'kulit-jagung',
    nama: 'Kulit Jagung (Corn Husk)',
    namaLain: 'Corn Husk',
    deskripsi: 'Daun pembungkus terluar tongkol jagung yang sudah kering. Serat kasar tinggi, palatabilitas rendah, digunakan sebagai pakan basal murah.',
    kategoriItem: 'Limbah Pertanian',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 400,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'klobot-jagung',
    nama: 'Klobot Jagung',
    namaLain: 'Corn Husk Leaf, Kelobot',
    deskripsi: 'Lapisan daun pembungkus tongkol jagung yang masih segar/muda, sebelum dikeringkan menjadi kulit jagung. Sering digunakan langsung sebagai hijauan tambahan.',
    kategoriItem: 'Limbah Pertanian',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 350,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'batang-jagung',
    nama: 'Batang Jagung',
    namaLain: 'Corn Stalk',
    deskripsi: 'Batang tanaman jagung sisa panen. Serat kasar sangat tinggi dan kecernaan rendah, biasa dimanfaatkan sebagai roughage murah setelah dicacah.',
    kategoriItem: 'Limbah Pertanian',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 300,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'daun-jagung',
    nama: 'Daun Jagung',
    namaLain: 'Corn Leaf',
    deskripsi: 'Daun tanaman jagung sisa panen. Nilai nutrisi lebih baik dibanding batang, palatabilitas sedang, umum dicampur dalam ransum hijauan.',
    kategoriItem: 'Limbah Pertanian',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 350,
    hargaUpdated: '01 Jun 2026',
    dataLengkap: true,
    updatedAt: '01 Jun 2026',
  },
  {
    id: 'corn-gluten-feed',
    nama: 'Corn Gluten Feed (CGF)',
    namaLain: 'CGF, Gluten Feed Jagung',
    deskripsi: 'Hasil samping wet milling jagung berupa campuran kulit ari dan serat. Protein sedang (18–22%), sumber energi dan serat yang ekonomis.',
    kategoriItem: 'Limbah Industri',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 3200,
    hargaUpdated: '05 Jul 2026',
    dataLengkap: true,
    updatedAt: '05 Jul 2026',
  },
  {
    id: 'corn-gluten-meal',
    nama: 'Corn Gluten Meal (CGM)',
    namaLain: 'CGM, Gluten Meal Jagung',
    deskripsi: 'Hasil samping wet milling dengan konsentrasi protein sangat tinggi (≥60%). Suplemen protein nabati premium pengganti bungkil kedelai.',
    kategoriItem: 'Limbah Industri',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 8000,
    hargaUpdated: '05 Jul 2026',
    dataLengkap: true,
    updatedAt: '05 Jul 2026',
  },
  {
    id: 'ddgs',
    nama: 'DDGS',
    namaLain: 'Distillers Dried Grains with Solubles',
    deskripsi: 'Hasil samping produksi bioetanol dari fermentasi jagung. Protein tinggi (≥27%), serat dan lemak baik untuk ruminansia.',
    kategoriItem: 'Limbah Industri',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 6500,
    hargaUpdated: '06 Jul 2026',
    dataLengkap: true,
    updatedAt: '06 Jul 2026',
  },
  {
    id: 'hominy-feed',
    nama: 'Hominy',
    namaLain: 'Hominy Feed, Corn Hominy Feed',
    deskripsi: 'Campuran lembaga, kulit ari, dan pecahan biji dari proses dry milling jagung. Sumber energi dan lemak yang ekonomis.',
    kategoriItem: 'Limbah Industri',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 3800,
    hargaUpdated: '01 Jul 2026',
    dataLengkap: true,
    updatedAt: '01 Jul 2026',
  },
  {
    id: 'corn-germ',
    nama: 'Corn Germ',
    namaLain: 'Lembaga Jagung, Corn Germ Meal',
    deskripsi: 'Lembaga (embrio) jagung sisa ekstraksi minyak. Kaya lemak residu dan protein, nilai energi tinggi.',
    kategoriItem: 'Limbah Industri',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 4500,
    hargaUpdated: '01 Jul 2026',
    dataLengkap: true,
    updatedAt: '01 Jul 2026',
  },
  {
    id: 'corn-bran',
    nama: 'Corn Bran',
    namaLain: 'Kulit Ari Jagung, Corn Pericarp',
    deskripsi: 'Kulit ari luar biji jagung dari proses wet milling. Serat kasar tinggi (≥40%), digunakan sebagai sumber roughage dalam ransum.',
    kategoriItem: 'Limbah Industri',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 2800,
    hargaUpdated: '01 Jul 2026',
    dataLengkap: true,
    updatedAt: '01 Jul 2026',
  },
  {
    id: 'corn-screenings',
    nama: 'Corn Screenings',
    namaLain: 'Corn By-Product, Sortiran Kasar',
    deskripsi: 'Butir jagung kecil, pecahan, dan kotoran ringan yang tersaring dari proses sortir industri. Nilai nutrisi bervariasi tergantung komposisi.',
    kategoriItem: 'Hasil Samping',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 3000,
    hargaUpdated: '01 Jul 2026',
    dataLengkap: true,
    updatedAt: '01 Jul 2026',
  },
  {
    id: 'jagung-sortiran',
    nama: 'Jagung Sortiran',
    namaLain: 'Off-Spec Corn, Jagung Grade B',
    deskripsi: 'Jagung yang tidak lolos sortir kualitas ekspor atau standar pangan manusia. Nilai nutrisi mendekati jagung normal, harga lebih terjangkau.',
    kategoriItem: 'Hasil Samping',
    namaLatin: 'Zea mays L.',
    estimasiHarga: 3200,
    hargaUpdated: '05 Jul 2026',
    dataLengkap: true,
    updatedAt: '05 Jul 2026',
  },
];

// ─── Computed Helpers ─────────────────────────────────────────────────────────

export function getJagungList(): JagungItem[] {
  return JAGUNG_DB;
}

export function getJagungById(id: string): JagungItem | undefined {
  return JAGUNG_DB.find(item => item.id === id);
}

export function computeJagungRingkasan() {
  const items      = JAGUNG_DB;
  const priced     = items.filter(i => i.estimasiHarga !== null).map(i => i.estimasiHarga as number);
  const hargaRata  = priced.length > 0 ? Math.round(priced.reduce((a, b) => a + b, 0) / priced.length) : null;
  const terakhir   = items.map(i => i.updatedAt).sort((a, b) => b.localeCompare(a))[0] ?? '—';
  const dataLengkap = items.filter(i => i.dataLengkap).length;

  return {
    totalReferensi: items.length,
    hargaRataRata:  hargaRata,
    terakhirUpdate: terakhir,
    dataLengkap,
  };
}
