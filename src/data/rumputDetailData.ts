// ─── MP-007 — Detail Data: Rumput ─────────────────────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for every Rumput item.
// Merged with base RumputItem from rumputData.ts via getRumputDetail().
//
// Sumber data nutrisi:
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi
//     Pakan untuk Indonesia. Gadjah Mada University Press.
//   • Feedipedia (2023). INRA-CIRAD-AFZ-FAO Animal Feed Resources.
//   • JIRCAS (2013). Feed Composition Tables for Southeast Asia.
//   • NRC (2016). Nutrient Requirements of Beef Cattle, 8th Rev. Ed.
//   • Reksohadiprodjo, S. (1985). Produksi Tanaman Hijauan Makanan Ternak Tropik.
//
// Semua nilai proximate (PK, SK, LK, Abu, BETN) atas dasar as-fed (segar).
// TDN, ME, NDF, ADF dinyatakan atas dasar bahan kering (DM basis).
// Mineral (Ca, P, Mg, Na, K, Cl, S) dinyatakan as-fed (%).

import { getRumputById, type RumputItem } from './rumputData';
import type {
  NutrisiData,
  PenggunaanData,
  HargaData,
  ReferensiData,
  AiInsightItem,
  BentukBahan,
} from './jagungData';

interface RumputDetailFields {
  namaLatin: string;
  asalBahan: string;
  bentuk: BentukBahan[];
  asal: string;
  habitat: string;
  umurPanenIdeal: string;
  tinggiTanaman: string;
  produksiHijauan: string;
  kelebihan: string;
  kekurangan: string;
  nutrisi: NutrisiData;
  penggunaan: PenggunaanData;
  harga: HargaData;
  referensi: ReferensiData;
  aiInsight: AiInsightItem[];
}

const RUMPUT_DETAIL: Record<string, RumputDetailFields> = {

  // ── 1. Rumput Gajah ──────────────────────────────────────────────────────────
  'rumput-gajah': {
    namaLatin: 'Pennisetum purpureum Schumach.',
    asalBahan: 'Tanaman rumput unggul tropis dipanen pada umur 40–60 hari dalam kondisi segar',
    bentuk: ['Segar'],
    asal: 'Afrika Tropis (Afrika Barat dan Tengah); introduksi ke Indonesia sejak awal abad ke-20',
    habitat: 'Tumbuh baik di dataran rendah hingga 2.000 mdpl; toleran berbagai jenis tanah; butuh curah hujan ≥1.000 mm/tahun',
    umurPanenIdeal: '40–60 hari (musim hujan) / 60–90 hari (musim kemarau)',
    tinggiTanaman: '2–4 meter saat dewasa; batang tebal dan tegak',
    produksiHijauan: '150–300 ton/ha/tahun segar; ±30–60 ton BK/ha/tahun',
    kelebihan: 'Produksi biomassa tertinggi; palatabilitas sangat baik; mudah diperbanyak; cocok untuk semua ruminansia besar',
    kekurangan: 'Protein turun drastis jika terlambat dipanen; kandungan air sangat tinggi (±80%); tidak tahan genangan',
    nutrisi: {
      bk: 19, kadarAir: 81,
      pk: 1.9, sk: 6.3, lk: 0.4, abu: 2.1, betn: 8.3,
      tdn: 55, me: 2250,
      ndf: 63, adf: 38,
      ca: 0.08, p: 0.03, mg: 0.05, na: 0.01, k: 0.35, cl: 0.06, s: 0.02,
      vitamin: 'Beta-karoten (pro-vitamin A) ±40–60 mg/kg BK; Vitamin C segar; Vitamin K dari klorofil',
      mineral: 'K tinggi (termasuk hijauan kaya kalium); rasio Ca:P perlu suplementasi Ca untuk ransum optimal',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 70,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      musimTerbaik: 'Musim hujan — pertumbuhan optimal, protein lebih tinggi; musim kemarau produksi menurun ±40%',
      umurPanenTerbaik: '40–50 hari untuk protein maksimal; 60–70 hari untuk biomassa maksimal',
      catatan: 'Cacah menjadi 3–5 cm sebelum diberikan untuk mencegah sisa pakan. Layukan 2–4 jam sebelum diberikan untuk menurunkan HCN pada tanaman muda. Kombinasikan dengan konsentrat protein untuk produksi susu optimal.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 280,
      satuan: 'per kg segar', supplier: 'Peternak / kebun hijauan lokal / KUD Pakan Ternak',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 198',
        'Feedipedia (2023) — Napier grass (Pennisetum purpureum), ruminants',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik, UGM Press',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Rev. Ed.',
      ],
      sumberData: 'Rata-rata nilai analisis proksimat Rumput Gajah varietas lokal, panen 45 hari, Jawa Tengah dan Jawa Timur',
      catatan: 'Nilai nutrisi as-fed. Protein dan TDN sangat dipengaruhi umur panen — panen >70 hari dapat menurunkan PK hingga 50% dibanding panen 40 hari.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Sumber hijauan utama ruminansia Indonesia — produksi biomassa 150–300 ton/ha/tahun dengan palatabilitas sangat baik. TDN 55% (BK basis) memenuhi kebutuhan energi pemeliharaan hingga produksi moderat.' },
      { type: 'kelebihan', icon: '✅', text: 'Produksi segar tertinggi di antara semua rumput tropis. Mudah ditanam di lahan marginal. Tidak perlu replanting tiap tahun — sekali tanam produktif 5–10 tahun.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein kasar hanya 10% BK — tidak cukup untuk produksi susu atau penggemukan intensif tanpa suplementasi. Kandungan air 81% membuat volume ransum sangat besar; hitung kebutuhan berbasis BK.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi ideal: Rumput Gajah 60–70% + Leguminosa (Gamal/Lamtoro/Kaliandra) 20–30% + Konsentrat 10–20%. Untuk sapi perah tambahkan bungkil kedelai atau dedak halus untuk menutup defisit protein.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan panen terlalu muda (<30 hari) — kandungan HCN (pada beberapa varietas) dan nitrat bisa tinggi. Layukan 2–4 jam atau cacah terlebih dahulu sebelum diberikan.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika lahan terbatas: Rumput Odot (produksi lebih sedikit tapi protein lebih tinggi, ideal untuk kambing). Jika butuh protein lebih tinggi: Rumput Raja atau campurkan dengan Leguminosa.' },
    ],
  },

  // ── 2. Rumput Gajah Mini ─────────────────────────────────────────────────────
  'rumput-gajah-mini': {
    namaLatin: 'Pennisetum purpureum Schumach. var. minimus',
    asalBahan: 'Varietas kerdil Rumput Gajah dipanen segar pada umur 30–45 hari',
    bentuk: ['Segar'],
    asal: 'Seleksi varietas dari Afrika; dikembangkan di Asia Tenggara untuk ternak kecil',
    habitat: 'Adaptif di berbagai kondisi tanah; tumbuh lebih baik di lahan subur dengan drainase baik; dataran rendah–menengah',
    umurPanenIdeal: '30–45 hari',
    tinggiTanaman: '0,8–1,5 meter; lebih pendek dan lebih lebat dari Gajah biasa',
    produksiHijauan: '80–150 ton/ha/tahun segar; lebih rendah dari Gajah biasa namun kualitas lebih baik',
    kelebihan: 'Protein lebih tinggi dari Gajah biasa; daun lebih lembut dan mudah dicerna; sangat cocok untuk kambing dan domba',
    kekurangan: 'Produksi biomassa lebih rendah dari Gajah biasa; lebih rentan kekeringan',
    nutrisi: {
      bk: 17, kadarAir: 83,
      pk: 2.0, sk: 5.1, lk: 0.4, abu: 2.0, betn: 7.4,
      tdn: 57, me: 2320,
      ndf: 59, adf: 35,
      ca: 0.07, p: 0.03, mg: 0.05, na: 0.01, k: 0.30, cl: 0.06, s: 0.02,
      vitamin: 'Beta-karoten tinggi (±50 mg/kg BK); Vitamin K dari klorofil; Vitamin C segar',
      mineral: 'Profil mineral serupa Gajah biasa; K cukup tinggi; Ca perlu suplementasi',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 70,
      targetTernak: ['Kambing', 'Domba', 'Sapi Perah', 'Sapi Potong', 'Kelinci'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower'],
      musimTerbaik: 'Musim hujan — pertumbuhan optimal; musim kemarau perlu irigasi',
      umurPanenTerbaik: '30–40 hari untuk kualitas terbaik kambing dan domba',
      catatan: 'Paling cocok untuk zero-grazing kambing dan domba. Tidak perlu dicacah — batang cukup lembut. Berikan segar setiap hari. Kombinasikan dengan leguminosa untuk memaksimalkan protein.',
    },
    harga: {
      estimasiAI: 350, hargaMarketplace: 320,
      satuan: 'per kg segar', supplier: 'Pembibitan hijauan / Peternak kambing lokal',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Dwarf Napier grass (Pennisetum purpureum var. minimus)',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik, UGM Press',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
      ],
      sumberData: 'Data analisis proksimat varietas Gajah Mini, Balai Penelitian Ternak Ciawi (2022)',
      catatan: 'Nilai nutrisi estimasi referensi pada panen 35 hari. Kandungan protein bisa mencapai 14% BK pada panen 30 hari dengan pemupukan optimal.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Rumput Gajah Mini adalah hijauan terbaik untuk kambing dan domba — protein 12% BK (vs 10% Gajah biasa), batang lebih lembut, tidak perlu dicacah. Kecernaan lebih tinggi karena rasio daun:batang lebih baik.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein lebih tinggi dan palatabilitas lebih baik dari Gajah biasa. Batang lembut tidak perlu alat cacah khusus. Tumbuh rapat dan lebat sehingga mudah dipanen.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Produksi ton/ha lebih rendah dari Gajah biasa (±50% lebih sedikit). Lebih rentan kekeringan — perlu irigasi di musim kemarau panjang.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk kambing perah: Gajah Mini 60% + Leguminosa 25% + Konsentrat 15%. Untuk kambing potong: Gajah Mini 70% + Leguminosa 30%. Hasilnya jauh lebih baik dari hijauan tunggal.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan biarkan ternak merumput langsung — densitas tanaman rendah dan stolon mudah rusak. Zero-grazing (potong-angkut) adalah sistem terbaik untuk mempertahankan produksi jangka panjang.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif kualitas serupa: Rumput Odot (protein lebih tinggi, cocok untuk kambing perah). Jika ingin produksi lebih besar: Gajah biasa + ditambah leguminosa.' },
    ],
  },

  // ── 3. Rumput Raja ───────────────────────────────────────────────────────────
  'rumput-raja': {
    namaLatin: 'Pennisetum purpureum × Pennisetum typhoideum',
    asalBahan: 'Hibrida antara Rumput Gajah dan Pearl Millet, dipanen segar umur 40–60 hari',
    bentuk: ['Segar'],
    asal: 'Hibrida dikembangkan di Afrika dan Amerika Latin; masuk Indonesia melalui BPPT dan Balitnak',
    habitat: 'Adaptasi luas di dataran rendah–menengah; lebih toleran kekeringan dari Gajah murni; butuh tanah subur',
    umurPanenIdeal: '40–60 hari',
    tinggiTanaman: '2–4 meter; batang lebih lembut dari Gajah biasa',
    produksiHijauan: '150–280 ton/ha/tahun segar; setara Gajah biasa namun kualitas lebih baik',
    kelebihan: 'Protein lebih tinggi (10–12% BK); batang lebih lunak dan palatabilitas lebih baik; lebih toleran kekeringan',
    kekurangan: 'Biji steril — perbanyakan hanya vegetatif; membutuhkan bibit dalam jumlah besar',
    nutrisi: {
      bk: 18, kadarAir: 82,
      pk: 2.0, sk: 5.6, lk: 0.4, abu: 2.0, betn: 8.1,
      tdn: 57, me: 2330,
      ndf: 60, adf: 36,
      ca: 0.07, p: 0.03, mg: 0.05, na: 0.01, k: 0.32, cl: 0.06, s: 0.02,
      vitamin: 'Beta-karoten ±45 mg/kg BK; Vitamin K; Vitamin E kecil',
      mineral: 'Profil mineral antara Gajah dan Pearl Millet; Ca lebih rendah dari kebutuhan sapi — suplementasi diperlukan',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 70,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      musimTerbaik: 'Musim hujan optimal; lebih tahan musim kemarau dibanding Gajah biasa',
      umurPanenTerbaik: '40–50 hari — keseimbangan terbaik antara protein dan biomassa',
      catatan: 'Cacah 3–5 cm sebelum diberikan. Keunggulan utama dari Gajah biasa: palatabilitas ternak lebih tinggi karena batang lebih lunak. Cocok sebagai hijauan utama dalam sistem penggemukan intensif.',
    },
    harga: {
      estimasiAI: 350, hargaMarketplace: 320,
      satuan: 'per kg segar', supplier: 'Peternak / Pembibitan hijauan unggul',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — King grass, hybrid Napier (Pennisetum purpureum × P. typhoideum)',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik, UGM Press',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data proksimat dari Balai Penelitian Ternak Ciawi dan Feedipedia, panen 45 hari',
      catatan: 'Nilai estimasi referensi. Sebagai hibrida, nilai nutrisi sedikit lebih baik dari Gajah murni namun bervariasi tergantung galur hibrida yang digunakan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Rumput Raja menggabungkan produktivitas Gajah dengan kelunakan batang Pearl Millet — TDN 57% BK, protein 11% BK, palatabilitas sangat tinggi. Pilihan hijauan terbaik untuk penggemukan sapi intensif.' },
      { type: 'kelebihan', icon: '✅', text: 'Batang lebih lunak dari Gajah biasa sehingga konsumsi BK per hari lebih tinggi. Toleransi kekeringan lebih baik. Satu-satunya rumput unggul yang bisa bersaing dengan Gajah dalam produktivitas sekaligus palatabilitas.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Biji steril — tidak bisa diperbanyak dari biji. Perbanyakan harus dari stek atau ratoon. Investasi awal bibit lebih mahal dibanding Gajah biasa.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk penggemukan: Rumput Raja 65% + Leguminosa (Indigofera/Lamtoro) 20% + Konsentrat 15%. Kombinasi ini mendekati kebutuhan nutrisi sapi penggemukan tanpa suplemen mahal.' },
      { type: 'peringatan', icon: '🚨', text: 'Perhatikan umur panen — jangan >70 hari karena lignifikasi batang meningkat drastis dan mengurangi kecernaan. Tanaman muda (<30 hari) perlu dilayukan sebelum diberikan.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika Rumput Raja tidak tersedia: Gajah biasa (produksi sama, palatabilitas sedikit lebih rendah) atau Rumput Odot (produksi lebih rendah, protein lebih tinggi untuk ternak kecil).' },
    ],
  },

  // ── 4. Rumput Odot ───────────────────────────────────────────────────────────
  'rumput-odot': {
    namaLatin: 'Pennisetum purpureum Schumach. cv. Mott',
    asalBahan: 'Kultivar kerdil Gajah berdaun lebar, dipanen segar umur 30–45 hari',
    bentuk: ['Segar'],
    asal: 'Seleksi kultivar di Amerika Serikat (University of Florida); masuk Indonesia ±2010',
    habitat: 'Tumbuh baik di dataran rendah–menengah; toleran kondisi semi-kering; responsif terhadap pemupukan nitrogen',
    umurPanenIdeal: '30–45 hari',
    tinggiTanaman: '0,5–1,2 meter; ruas sangat pendek, daun lebar dan lebat',
    produksiHijauan: '80–160 ton/ha/tahun segar; lebih rendah dari Gajah biasa tetapi kualitas jauh lebih tinggi',
    kelebihan: 'Protein tertinggi di antara kultivar Gajah (12–14% BK); daun sangat lembut; cocok untuk kambing, domba, dan ruminansia kecil',
    kekurangan: 'Produksi biomassa paling rendah di kelompok Gajah; kurang cocok untuk sapi besar karena volume kecil',
    nutrisi: {
      bk: 16, kadarAir: 84,
      pk: 2.1, sk: 4.5, lk: 0.4, abu: 1.9, betn: 7.1,
      tdn: 60, me: 2450,
      ndf: 56, adf: 32,
      ca: 0.07, p: 0.04, mg: 0.05, na: 0.01, k: 0.28, cl: 0.05, s: 0.02,
      vitamin: 'Beta-karoten tinggi (±55 mg/kg BK); Vitamin K; Folat dari daun muda',
      mineral: 'Rasio Ca:P mendekati ideal untuk ternak kecil; tetap perlu suplementasi mineral mikro untuk produksi',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 75,
      targetTernak: ['Kambing', 'Domba', 'Kambing Perah', 'Domba Perah', 'Kelinci', 'Sapi Perah'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower'],
      musimTerbaik: 'Sepanjang tahun dengan irigasi; musim hujan pertumbuhan optimal',
      umurPanenTerbaik: '30–40 hari — protein dan kecernaan paling tinggi',
      catatan: 'Hijauan terbaik untuk kambing dan domba. Tidak perlu dicacah — batang sangat lembut. Berikan segar setiap hari. Untuk kambing perah, Odot adalah hijauan tunggal terbaik yang tersedia di Indonesia.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 380,
      satuan: 'per kg segar', supplier: 'Pembibitan hijauan unggul / Peternak kambing spesialis',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Dwarf Napier grass cv. Mott (Pennisetum purpureum cv. Mott)',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'BPPT & Balitnak (2019) — Evaluasi Kultivar Rumput Unggul untuk Kambing, Ciawi',
      ],
      sumberData: 'Analisis proksimat Rumput Odot panen 35 hari, Balai Penelitian Ternak Ciawi dan IPB',
      catatan: 'Nilai estimasi referensi. PK BK dapat mencapai 14% pada kondisi pemupukan nitrogen optimal (200 kg N/ha/tahun) dan panen 30 hari.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Rumput Odot adalah hijauan premium kambing dan domba Indonesia — protein 13% BK (tertinggi di kelompok Gajah), TDN 60% BK, kecernaan NDF 65%+. Satu-satunya hijauan yang mendekati kebutuhan nutrisi kambing perah tanpa banyak konsentrat.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein tertinggi di antara semua kultivar Pennisetum. NDF dan ADF paling rendah = kecernaan paling tinggi. Tidak perlu dicacah. Palatable untuk semua usia ternak dari anak hingga indukan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Volume produksi paling rendah di kelompok Gajah — untuk sapi besar butuh lahan yang luas. Harga bibit lebih mahal dari Gajah biasa. Tidak ideal untuk sistem penggembalaan terbuka.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk kambing perah: Odot 70% + Indigofera 20% + konsentrat minimal 10%. Produksi susu bisa 2–2,5 liter/ekor/hari. Untuk kambing potong: Odot 80% + konsentrat 20% sudah mencukupi target pertumbuhan 150+ g/hari.' },
      { type: 'peringatan', icon: '🚨', text: 'Pastikan panen pada umur yang tepat (30–45 hari). Terlambat panen drastis menurunkan protein dan meningkatkan lignin. Jangan biarkan rumput berbunga — segera potong dan ratoon ulang.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika Odot tidak tersedia: Gajah Mini (produksi lebih tinggi, protein sedikit lebih rendah). Untuk peternakan besar: kombinasikan Odot untuk ternak kecil + Gajah biasa untuk sapi.' },
    ],
  },

  // ── 5. Rumput Setaria ────────────────────────────────────────────────────────
  'rumput-setaria': {
    namaLatin: 'Setaria sphacelata (Schumach.) Stapf & C.E.Hubb.',
    asalBahan: 'Rumput tegak tropis dipanen segar umur 35–50 hari',
    bentuk: ['Segar'],
    asal: 'Afrika Timur dan Selatan; introduksi luas ke Asia Tenggara dan Australia',
    habitat: 'Tumbuh baik di lahan basah hingga semi-kering; toleran naungan parsial; cocok di bawah tegakan pohon',
    umurPanenIdeal: '35–50 hari',
    tinggiTanaman: '0,6–1,5 meter; tegak dengan malai berbentuk silinder',
    produksiHijauan: '60–120 ton/ha/tahun segar; lebih sedikit dari Gajah namun kualitas baik',
    kelebihan: 'Toleran naungan — cocok untuk agroforestri dan perkebunan; daun lembut; palatabilitas baik',
    kekurangan: 'Produksi lebih rendah dari Gajah; malai dapat menyebabkan gangguan pencernaan jika dikonsumsi berlebihan',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 1.9, sk: 6.4, lk: 0.4, abu: 2.0, betn: 9.3,
      tdn: 54, me: 2200,
      ndf: 65, adf: 40,
      ca: 0.09, p: 0.02, mg: 0.04, na: 0.01, k: 0.33, cl: 0.05, s: 0.02,
      vitamin: 'Beta-karoten ±35 mg/kg BK; Vitamin K; klorofil tinggi',
      mineral: 'Ca lebih tinggi dari Gajah; P rendah — perlu suplementasi P untuk produksi',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 65,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Bunting', 'Grower', 'Penggemukan'],
      musimTerbaik: 'Sepanjang tahun; paling produktif di awal musim hujan',
      umurPanenTerbaik: '35–45 hari untuk keseimbangan kualitas dan kuantitas',
      catatan: 'Hindari memberikan malai (kepala bunga) berlebihan — dapat menyebabkan iritasi di mulut dan tenggorokan ternak. Panen sebelum bermalai untuk kualitas terbaik. Sangat cocok untuk sistem agroforestri.',
    },
    harga: {
      estimasiAI: 250, hargaMarketplace: 230,
      satuan: 'per kg segar', supplier: 'Peternak / kebun hijauan perkebunan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Setaria grass (Setaria sphacelata), ruminants',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data proksimat Setaria sphacelata, panen 40 hari, berbagai sentra hijauan Jawa dan Sulawesi',
      catatan: 'Nilai estimasi referensi. Kandungan oxalat pada beberapa kultivar Setaria dapat menyebabkan hypocalcaemia pada ternak non-adaptasi — perhatikan pada ternak yang baru diperkenalkan ke padang Setaria.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Rumput Setaria adalah solusi hijauan berkualitas untuk sistem agroforestri dan perkebunan — toleran naungan parsial (30–40%) sehingga bisa ditanam di bawah kelapa, karet, atau tanaman keras.' },
      { type: 'kelebihan', icon: '✅', text: 'Satu-satunya rumput unggul yang produktif di bawah naungan. Cocok untuk peternak yang mengintegrasikan ternak dengan kebun. Kualitas nutrisi cukup baik (TDN 54%, PK 9.5% BK) untuk produksi moderat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Beberapa kultivar mengandung oxalat yang bisa menyebabkan hipokalsemia. Malai berbulu bisa mengiritasi mulut ternak. Produksi ton/ha lebih rendah dari Gajah.' },
      { type: 'kombinasi', icon: '🔗', text: 'Dalam sistem agroforestri: Setaria di bawah naungan + Gajah/Odot di lahan terbuka + Leguminosa perambat (Centrosema, Stylosanthes). Kombinasi ini memanfaatkan semua zona lahan secara optimal.' },
      { type: 'peringatan', icon: '🚨', text: 'Introduksi bertahap pada ternak yang baru pertama kali mengonsumsi Setaria — terutama di padang penggembalaan murni. Periksa tanda hipokalsemia (kekakuan otot, produksi susu turun) selama 2 minggu pertama.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika tidak ada naungan: Gajah atau Brachiaria lebih produktif. Untuk agroforestri di lahan basah: Rumput Para juga toleran kondisi semi-naungan.' },
    ],
  },

  // ── 6. Rumput Benggala ───────────────────────────────────────────────────────
  'rumput-benggala': {
    namaLatin: 'Panicum maximum Jacq.',
    asalBahan: 'Rumput tropis tinggi dipanen segar umur 40–60 hari',
    bentuk: ['Segar'],
    asal: 'Afrika tropis; diintroduksi ke seluruh kawasan tropis termasuk Indonesia sejak abad ke-19',
    habitat: 'Tanah subur dengan drainase baik; tidak toleran genangan; dataran rendah–menengah hingga 1.500 mdpl',
    umurPanenIdeal: '40–60 hari',
    tinggiTanaman: '1–2 meter; tegak dengan daun lebar dan lembut',
    produksiHijauan: '80–180 ton/ha/tahun segar; produktif di musim hujan',
    kelebihan: 'Palatabilitas sangat baik; daun lebar dan lembut; cocok untuk padang penggembalaan dan cut-and-carry',
    kekurangan: 'Kurang toleran tanah jenuh air; produksi menurun drastis di musim kemarau panjang',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 1.8, sk: 6.8, lk: 0.4, abu: 1.9, betn: 9.1,
      tdn: 52, me: 2130,
      ndf: 67, adf: 42,
      ca: 0.07, p: 0.02, mg: 0.04, na: 0.01, k: 0.32, cl: 0.05, s: 0.02,
      vitamin: 'Beta-karoten ±30 mg/kg BK; Vitamin K; Vitamin C segar',
      mineral: 'Mineral sedang; Ca dan P rendah — suplementasi wajib untuk produksi',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 65,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Grower', 'Pejantan'],
      musimTerbaik: 'Musim hujan; kurangi intensitas panen saat kemarau panjang',
      umurPanenTerbaik: '40–50 hari untuk kualitas optimal; 60 hari untuk biomassa maksimal',
      catatan: 'Cocok untuk padang penggembalaan rotasi (3–4 petak, interval 6–8 minggu). Untuk cut-and-carry, cacah 3–5 cm. Respon baik terhadap pupuk nitrogen — pemupukan 100 kg N/ha/tahun meningkatkan produksi ±40%.',
    },
    harga: {
      estimasiAI: 250, hargaMarketplace: 230,
      satuan: 'per kg segar', supplier: 'Peternak / padang penggembalaan lokal',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Guinea grass (Panicum maximum), ruminants',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 205',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data proksimat Panicum maximum berbagai kultivar, panen 45 hari, Jawa dan Sulawesi',
      catatan: 'Nilai estimasi referensi. Kualitas nutrisi sangat bervariasi antar kultivar (Common, Gatton, Hamil, Trichoglume) — kultivar Gatton umumnya memiliki PK lebih tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Rumput Benggala adalah hijauan serbaguna yang sangat palatabel — cocok untuk penggembalaan maupun cut-and-carry. TDN 52% BK cukup untuk memenuhi kebutuhan pemeliharaan sapi dan produksi kambing.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas sangat baik — ternak jarang meninggalkan sisa. Cocok untuk berbagai sistem pemberian pakan. Tahan injakan di sistem penggembalaan rotasi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'NDF 67% BK — serat dinding sel relatif tinggi, kecernaan lebih rendah dari Odot atau Gajah Mini. Tidak toleran genangan — jangan tanam di sawah atau lahan rawa.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk padang penggembalaan campur: Benggala + Stylosanthes guianensis 30% (leguminosa tahan kering). Untuk cut-and-carry: Benggala + Gamal atau Lamtoro. Proteinnya akan terpenuhi.' },
      { type: 'peringatan', icon: '🚨', text: 'Beberapa kultivar Panicum maximum berpotensi menyebabkan fotosensitisasi hepatogenik pada domba dan kambing (terutama kultivar berbulu — "green panic"). Observasi ternak selama 2 minggu pertama.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika butuh produksi lebih tinggi: Gajah atau Raja. Jika butuh toleransi kekeringan lebih baik: Brachiaria brizantha. Jika butuh toleransi naungan: Setaria sphacelata.' },
    ],
  },

  // ── 7. Rumput Brachiaria ─────────────────────────────────────────────────────
  'rumput-brachiaria': {
    namaLatin: 'Brachiaria brizantha (A.Rich.) Stapf',
    asalBahan: 'Rumput tegak tahan kekeringan dipanen segar umur 40–60 hari',
    bentuk: ['Segar'],
    asal: 'Afrika Timur dan Tengah; dikembangkan luas di Brasil; masuk Indonesia via Balitnak',
    habitat: 'Tumbuh baik di lahan kering–semi-kering; toleran kekeringan panjang; kurang toleran tanah masam tinggi',
    umurPanenIdeal: '40–60 hari',
    tinggiTanaman: '0,8–1,5 meter; tegak dengan akar dalam',
    produksiHijauan: '60–120 ton/ha/tahun segar; lebih rendah dari Gajah namun sangat stabil',
    kelebihan: 'Toleransi kekeringan sangat baik; tahan penggembalaan berat; cocok untuk padang permanen',
    kekurangan: 'Protein lebih rendah dari Gajah dan Odot; palatabilitas sedang-baik (bukan terbaik)',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 1.9, sk: 7.7, lk: 0.4, abu: 2.0, betn: 10.0,
      tdn: 51, me: 2090,
      ndf: 68, adf: 43,
      ca: 0.08, p: 0.02, mg: 0.04, na: 0.01, k: 0.30, cl: 0.05, s: 0.02,
      vitamin: 'Beta-karoten ±28 mg/kg BK; Vitamin K',
      mineral: 'Mineral moderat; Ca dan P keduanya rendah — wajib suplementasi untuk produksi',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 65,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower', 'Pejantan'],
      musimTerbaik: 'Musim kemarau lebih baik dari rumput lain; tetap produktif saat hijauan lain layu',
      umurPanenTerbaik: '40–55 hari — keseimbangan antara kualitas dan kuantitas',
      catatan: 'Ideal untuk sistem penggembalaan intensif di lahan kering. Tahan terhadap penggembalaan berat (>3 ekor sapi/ha). Respon baik terhadap pupuk P dan K untuk meningkatkan kualitas nutrisi.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 180,
      satuan: 'per kg segar', supplier: 'Peternak / padang penggembalaan sapi potong',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Brachiaria brizantha (palisadegrass), ruminants',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
        'Valle et al. (2009) — Brachiaria: Biology, Agronomy, and Improvement, CIAT',
      ],
      sumberData: 'Data proksimat Brachiaria brizantha cv. Marandu dan Xaraes, panen 50 hari, NTT dan Sulawesi Selatan',
      catatan: 'Nilai estimasi referensi. Kualitas bervariasi antar kultivar — cv. Marandu umumnya lebih palatabel; cv. Xaraes lebih produktif.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Brachiaria brizantha adalah andalan padang penggembalaan Indonesia bagian timur dan lahan kering — tahan kekeringan hingga 4–5 bulan, tetap produktif saat rumput lain mengering.' },
      { type: 'kelebihan', icon: '✅', text: 'Toleransi kekeringan terbaik di antara rumput budidaya. Tahan injakan berat — cocok untuk penggembalaan kontinu atau rotasi di padang permanen. Biaya pemeliharaan rendah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein lebih rendah (8,5% BK) dan NDF lebih tinggi (68% BK) dari rumput unggul — kecernaan lebih rendah. Tidak cocok sebagai satu-satunya hijauan untuk produksi susu atau penggemukan intensif.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk sapi potong di lahan kering: Brachiaria 70% + Leguminosa tahan kering (Stylosanthes, Centrosema) 30%. Mineral premix wajib diberikan karena Ca dan P sangat rendah dari hijauan ini.' },
      { type: 'peringatan', icon: '🚨', text: 'Pada musim hujan pertama setelah musim kemarau panjang, rumput yang tumbuh cepat bisa mengandung nitrat tinggi — layukan beberapa jam sebelum diberikan ke ternak.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika kekeringan tidak menjadi masalah: Benggala atau Gajah lebih baik secara nutrisi. Di lahan sangat kering dan berbatu: Signal Grass (B. decumbens) lebih tahan injakan.' },
    ],
  },

  // ── 8. Rumput Signal ────────────────────────────────────────────────────────
  'rumput-signal': {
    namaLatin: 'Brachiaria decumbens Stapf',
    asalBahan: 'Rumput Brachiaria menjalar dipanen segar umur 40–60 hari',
    bentuk: ['Segar'],
    asal: 'Uganda, Afrika Timur; diintroduksi ke Amerika Latin lalu ke Asia Tenggara',
    habitat: 'Sangat adaptif di tanah miskin dan asam; merayap dengan stolon kuat; tahan injakan berat',
    umurPanenIdeal: '40–60 hari',
    tinggiTanaman: '0,3–0,6 meter; menjalar dengan stolon panjang yang mudah berakar',
    produksiHijauan: '40–80 ton/ha/tahun segar; lebih rendah dari Brachiaria tegak namun sangat tahan kondisi ekstrem',
    kelebihan: 'Paling tahan injakan di antara semua Brachiaria; tumbuh di tanah sangat miskin; biaya pemeliharaan nol',
    kekurangan: 'Perlu perhatian pada domba/kambing — potensi fotosensitisasi; protein terendah di antara rumput unggul',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 1.8, sk: 7.7, lk: 0.4, abu: 2.0, betn: 10.2,
      tdn: 50, me: 2050,
      ndf: 70, adf: 45,
      ca: 0.08, p: 0.02, mg: 0.04, na: 0.01, k: 0.28, cl: 0.05, s: 0.02,
      vitamin: 'Beta-karoten ±25 mg/kg BK; Vitamin K',
      mineral: 'Mineral rendah keseluruhan; Ca dan P sangat rendah — suplementasi intensif diperlukan',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 60,
      targetTernak: ['Sapi Potong', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower', 'Pejantan'],
      musimTerbaik: 'Sepanjang tahun di dataran rendah kering; paling produktif awal musim hujan',
      umurPanenTerbaik: '45–55 hari untuk padang penggembalaan; stolon tumbuh menutup lahan dengan baik',
      catatan: 'HINDARI untuk domba dan kambing muda — risiko fotosensitisasi (kulit merah/terkelupas, mata bengkak). Paling cocok untuk sapi potong dewasa di padang penggembalaan permanen. Suplementasi mineral blok wajib.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 180,
      satuan: 'per kg segar', supplier: 'Padang penggembalaan / peternak sapi potong',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Signal grass (Brachiaria decumbens), ruminants',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Borreani et al. (2018) — Silage review: Brachiaria decumbens feeding management',
        'Miles et al. (2004) — Brachiaria: Biology, Agronomy and Improvement, CIAT-EMBRAPA',
      ],
      sumberData: 'Data proksimat Brachiaria decumbens cv. Basilisk, panen 50 hari, NTT dan Kalimantan Timur',
      catatan: 'Nilai estimasi referensi. Fotosensitisasi hepatogenik (sporidesmin dari jamur Pithomyces chartarum) paling banyak dilaporkan pada domba muda yang merumput di padang Signal Grass lebat.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Signal Grass adalah rumput cover dan padang permanen terkuat — tahan injakan sangat berat, tumbuh di tanah miskin dan asam. Ideal untuk sapi potong extensif di lahan marginal.' },
      { type: 'kelebihan', icon: '✅', text: 'Ketahanan injakan terbaik — tidak rusak meski digembalai >4 ekor sapi/ha. Tumbuh di tanah asam (pH 4.5+) dan miskin hara. Biaya perawatan nyaris nol setelah tegak.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Risiko fotosensitisasi pada domba dan kambing muda — dapat menyebabkan kematian. TDN 50% BK paling rendah di kelompok Brachiaria. Nutrisi tidak cukup untuk produksi tanpa suplementasi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk sapi potong: Signal Grass + Mineral Blok wajib + suplementasi hijauan leguminosa 2–3× per minggu. Hindari memberi Signal Grass murni untuk domba — campurkan maksimal 30% dengan rumput lain.' },
      { type: 'peringatan', icon: '🚨', text: '⚠️ PERINGATAN KESELAMATAN: Jangan gunakan sebagai padang penggembalaan untuk domba dan kambing muda tanpa pengawasan. Fotosensitisasi dapat muncul dalam 1–2 minggu pertama, terutama di musim hujan saat jamur Pithomyces aktif.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk domba/kambing: ganti dengan Brachiaria brizantha (lebih aman) atau Rhodes Grass. Untuk padang sapi potong yang butuh ketahanan injakan serupa: Bermuda Grass di lahan lebih basah.' },
    ],
  },

  // ── 9. Rumput Meksiko ────────────────────────────────────────────────────────
  'rumput-meksiko': {
    namaLatin: 'Tripsacum laxum Nash',
    asalBahan: 'Rumput besar menyerupai Gajah dipanen segar umur 40–60 hari',
    bentuk: ['Segar'],
    asal: 'Amerika Tengah (Meksiko, Guatemala); introduksi ke Indonesia via Jawa dan Sumatra',
    habitat: 'Tumbuh sangat baik di lahan basah, pinggir sungai, dan sawah bera; toleran genangan temporer',
    umurPanenIdeal: '40–60 hari',
    tinggiTanaman: '1,5–3 meter; batang berongga dan ringan',
    produksiHijauan: '80–180 ton/ha/tahun segar; tinggi di lahan basah',
    kelebihan: 'Sangat produktif di lahan basah dan rawa; protein cukup tinggi (10–12% BK); tidak perlu lahan kering',
    kekurangan: 'Kurang cocok untuk lahan kering; rasa batang kurang disukai sapi dibanding Gajah',
    nutrisi: {
      bk: 18, kadarAir: 82,
      pk: 2.0, sk: 5.8, lk: 0.4, abu: 1.8, betn: 8.1,
      tdn: 55, me: 2250,
      ndf: 62, adf: 38,
      ca: 0.08, p: 0.03, mg: 0.05, na: 0.01, k: 0.30, cl: 0.05, s: 0.02,
      vitamin: 'Beta-karoten ±38 mg/kg BK; Vitamin K; klorofil tinggi di lahan basah',
      mineral: 'Ca cukup untuk hijauan; P perlu suplementasi; K tinggi karena lahan basah',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 65,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower'],
      musimTerbaik: 'Musim hujan — optimal di lahan basah; tetap produktif sepanjang tahun jika ada air',
      umurPanenTerbaik: '40–50 hari untuk protein optimal; 60 hari untuk biomassa',
      catatan: 'Manfaatkan lahan sawah bera atau pinggiran sungai untuk menanam Meksiko — tidak bersaing dengan lahan pertanian utama. Cacah 3–5 cm sebelum diberikan.',
    },
    harga: {
      estimasiAI: 250, hargaMarketplace: 230,
      satuan: 'per kg segar', supplier: 'Peternak di sentra hijauan Jawa dan Sumatra',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Guatemala grass (Tripsacum laxum), ruminants',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
      ],
      sumberData: 'Data proksimat Tripsacum laxum, panen 45 hari, Jawa Tengah dan Sumatra Barat',
      catatan: 'Nilai estimasi referensi. Sering disebut Guatemala Grass atau Meksiko Grass bergantian di literatur lokal — keduanya merujuk spesies Tripsacum.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Rumput Meksiko memaksimalkan pemanfaatan lahan basah dan pinggir sungai — area yang tidak bisa digunakan untuk rumput lain. Protein 11% BK dan TDN 55% setara Gajah biasa.' },
      { type: 'kelebihan', icon: '✅', text: 'Memanfaatkan lahan berair yang tidak produktif. Tumbuh sangat cepat di tepi sungai dan sawah bera. Protein cukup untuk produksi moderat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tidak efisien di lahan kering. Batang agak keras jika terlambat dipanen. Palatabilitas sedikit di bawah Gajah biasa.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ideal dikombinasikan dengan Gajah atau Odot (lahan darat) + Meksiko (lahan basah) untuk diversifikasi sumber hijauan. Tambahkan leguminosa untuk menutup defisit protein.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan biarkan tanaman berbunga — segera potong. Tanaman tua (>70 hari) menjadi sangat keras dan tidak palatabel.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif di lahan basah: Rumput Para atau Kolonjono (lebih murah, mudah didapat). Di lahan darat: Gajah biasa lebih produktif.' },
    ],
  },

  // ── 10. Rumput Guatemala ─────────────────────────────────────────────────────
  'rumput-guatemala': {
    namaLatin: 'Tripsacum andersonii J.R.Gray',
    asalBahan: 'Rumput Tripsacum berukuran besar dipanen segar umur 45–60 hari',
    bentuk: ['Segar'],
    asal: 'Amerika Tengah (Guatemala, Meksiko bagian selatan); diintroduksi ke Sulawesi dan Kalimantan',
    habitat: 'Tumbuh optimal di daerah curah hujan tinggi (>1.500 mm/tahun); toleran lahan basah dan tanah berat',
    umurPanenIdeal: '45–60 hari',
    tinggiTanaman: '1,5–3,5 meter; batang tebal dengan ruas panjang dan daun lebar',
    produksiHijauan: '80–180 ton/ha/tahun segar; sangat produktif di lahan basah Kalimantan dan Sulawesi',
    kelebihan: 'Sangat produktif di daerah curah hujan tinggi; biomassa besar; protein cukup baik',
    kekurangan: 'Tidak cocok untuk daerah kering; batang kasar jika terlambat dipanen',
    nutrisi: {
      bk: 18, kadarAir: 82,
      pk: 1.8, sk: 5.9, lk: 0.3, abu: 1.8, betn: 8.1,
      tdn: 54, me: 2200,
      ndf: 64, adf: 40,
      ca: 0.08, p: 0.03, mg: 0.04, na: 0.01, k: 0.28, cl: 0.05, s: 0.02,
      vitamin: 'Beta-karoten ±35 mg/kg BK; Vitamin K dari klorofil daun',
      mineral: 'Profil mineral serupa Tripsacum laxum; Ca cukup; P perlu suplementasi',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 65,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kerbau', 'Kambing'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower', 'Pejantan'],
      musimTerbaik: 'Musim hujan — pertumbuhan sangat cepat; produksi sepanjang tahun jika curah hujan merata',
      umurPanenTerbaik: '45–55 hari untuk keseimbangan kualitas dan kuantitas terbaik',
      catatan: 'Cocok untuk peternak di Kalimantan, Sulawesi, dan Papua dengan curah hujan tinggi. Cacah sebelum diberikan. Manfaatkan lahan semak atau pinggir kebun yang berair.',
    },
    harga: {
      estimasiAI: 280, hargaMarketplace: 260,
      satuan: 'per kg segar', supplier: 'Peternak di Sulawesi, Kalimantan, dan Maluku',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Guatemala grass (Tripsacum andersonii)',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik, UGM Press',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
      ],
      sumberData: 'Data proksimat Tripsacum andersonii, Sulawesi Selatan dan Kalimantan Timur, panen 50 hari',
      catatan: 'Nilai estimasi referensi. Sering disama-artikan dengan Rumput Meksiko (Tripsacum laxum) di lapangan — keduanya dari genus Tripsacum namun spesies berbeda.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Rumput Guatemala (T. andersonii) adalah hijauan utama peternak Kalimantan dan Sulawesi dengan curah hujan tinggi — produktivitas tinggi, adaptasi sempurna untuk kondisi lahan basah tropika basah.' },
      { type: 'kelebihan', icon: '✅', text: 'Pertumbuhan sangat cepat di curah hujan tinggi. Biomassa besar cocok untuk sapi besar. Tidak memerlukan perawatan intensif — tumbuh alami di lahan basah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Nilai nutrisi sedikit di bawah Gajah biasa. Tidak cocok untuk daerah kering. Batang besar memerlukan alat cacah untuk konsumsi optimal.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan leguminosa lokal (Gliricidia, Indigofera, atau kaliandra) untuk meningkatkan protein ransum. Suplementasi mineral blok wajib karena Ca dan P rendah.' },
      { type: 'peringatan', icon: '🚨', text: 'Panen tepat waktu — tanaman yang terlambat dipanen mengeras dan lignin meningkat. Batang tua sangat sulit dicerna dan tidak palatabel.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lokal Kalimantan/Sulawesi: Rumput Meksiko (T. laxum) — profil nutrisi serupa. Di lahan lebih kering: Rumput Benggala atau Brachiaria brizantha.' },
    ],
  },

  // ── 11. Rumput Afrika Star ───────────────────────────────────────────────────
  'rumput-afrika-star': {
    namaLatin: 'Cynodon plectostachyus (K.Schum.) Pilg.',
    asalBahan: 'Rumput Cynodon tegak dipanen segar umur 35–50 hari',
    bentuk: ['Segar'],
    asal: 'Afrika Timur (Kenya, Tanzania); diintroduksi ke Asia Tenggara untuk padang penggembalaan',
    habitat: 'Lahan kering terbuka; sangat toleran kekeringan; tumbuh di berbagai jenis tanah termasuk lempung berat',
    umurPanenIdeal: '35–50 hari',
    tinggiTanaman: '0,5–1,0 meter; tegak dengan stolon kuat',
    produksiHijauan: '40–90 ton/ha/tahun segar; cukup produktif untuk padang penggembalaan kering',
    kelebihan: 'Toleran kekeringan dan penggembalaan berat; tumbuh cepat setelah hujan; palatabilitas baik',
    kekurangan: 'Protein lebih rendah dari Gajah; tidak cocok untuk daerah dengan naungan berat',
    nutrisi: {
      bk: 24, kadarAir: 76,
      pk: 2.2, sk: 7.2, lk: 0.5, abu: 2.4, betn: 11.8,
      tdn: 56, me: 2290,
      ndf: 66, adf: 40,
      ca: 0.10, p: 0.03, mg: 0.05, na: 0.02, k: 0.35, cl: 0.06, s: 0.02,
      vitamin: 'Beta-karoten ±30 mg/kg BK; Vitamin K; mineral relatif tinggi dibanding BK',
      mineral: 'Ca lebih tinggi dari rata-rata rumput tropis; K tinggi; P tetap rendah',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 65,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower', 'Pejantan'],
      musimTerbaik: 'Adaptif sepanjang tahun; pertumbuhan cepat setelah hujan pertama musim hujan',
      umurPanenTerbaik: '35–45 hari untuk padang penggembalaan; biarkan recovery 4–6 minggu',
      catatan: 'Ideal untuk padang penggembalaan lahan kering — kombinasikan dengan leguminosa tahan kering (Stylosanthes, Centrosema). Berikan mineral blok secara permanen di padang untuk melengkapi defisit mineral.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 185,
      satuan: 'per kg segar', supplier: 'Padang penggembalaan / kebun hijauan Nusa Tenggara',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Giant star grass (Cynodon plectostachyus)',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data proksimat Afrika Star, panen 40 hari, NTT dan Sulawesi Selatan',
      catatan: 'Nilai estimasi referensi. BK lebih tinggi (24%) dari rumput unggul karena tumbuh di lahan kering — nilai nutrisi per ton segar lebih baik dari rumput basah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Afrika Star adalah pilihan utama padang penggembalaan lahan kering — toleransi kekeringan dan injakan sangat baik, pertumbuhan kembali cepat setelah hujan. BK 24% lebih tinggi dari rumput basah = lebih efisien secara volume.' },
      { type: 'kelebihan', icon: '✅', text: 'Adaptasi sempurna untuk iklim kering NTT, Sulawesi Selatan, dan kawasan semi-arid. Ca lebih tinggi (0,10% as-fed) dibanding rata-rata rumput tropis. Tahan penggembalaan berat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein hanya 9% BK — tidak cukup untuk penggemukan atau produksi susu tanpa leguminosa. NDF 66% BK menandakan serat cukup tinggi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk padang kering: Afrika Star 70% + Stylosanthes guianensis 30%. Leguminosa ini juga tahan kering dan akan sangat meningkatkan protein ransum ternak.' },
      { type: 'peringatan', icon: '🚨', text: 'Pada musim hujan pertama, rumput tumbuh pesat dan kandungan nitrat bisa meningkat — monitor ternak yang baru dipindahkan ke padang segar.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif di lahan kering serupa: Bermuda Grass (lebih rendek, lebih tahan injakan), Rhodes Grass (untuk daerah semi-arid alkalis). Jika curah hujan cukup: Brachiaria brizantha lebih produktif.' },
    ],
  },

  // ── 12. Rumput Rhodes ────────────────────────────────────────────────────────
  'rumput-rhodes': {
    namaLatin: 'Chloris gayana Kunth',
    asalBahan: 'Rumput tegak semi-arid dipanen segar atau dilayukan umur 35–45 hari',
    bentuk: ['Segar'],
    asal: 'Afrika Selatan dan Timur; diintroduksi luas untuk padang dan produksi hay',
    habitat: 'Lahan kering alkalis (pH 6–8); sangat toleran kekeringan; tidak toleran genangan',
    umurPanenIdeal: '35–45 hari (segar) / 60–70 hari (hay)',
    tinggiTanaman: '0,6–1,5 meter; tegak dengan bunga menyebar seperti jari',
    produksiHijauan: '40–100 ton/ha/tahun segar; 8–15 ton hay/ha/tahun',
    kelebihan: 'Nilai hay berkualitas tinggi; protein baik (8–12% BK); cocok untuk lahan alkalis yang tidak cocok untuk rumput lain',
    kekurangan: 'Tidak tahan genangan; palatabilitas sedikit lebih rendah dari Benggala',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 2.2, sk: 6.8, lk: 0.4, abu: 2.0, betn: 10.6,
      tdn: 56, me: 2290,
      ndf: 64, adf: 39,
      ca: 0.08, p: 0.03, mg: 0.04, na: 0.02, k: 0.32, cl: 0.05, s: 0.02,
      vitamin: 'Beta-karoten ±30 mg/kg BK; Vitamin K; profil vitamin baik untuk hay berkualitas',
      mineral: 'Profil mineral relatif baik untuk rumput savana; Ca dan P perlu suplementasi untuk produksi',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 65,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower', 'Pejantan'],
      musimTerbaik: 'Musim kemarau sangat baik untuk produksi hay berkualitas; musim hujan untuk segar',
      umurPanenTerbaik: '35–45 hari untuk segar; 60–70 hari untuk hay (sebelum bunga penuh)',
      catatan: 'Satu-satunya rumput yang sangat layak diproduksi sebagai hay berkualitas di Indonesia. Untuk hay: panen sebelum bunga mekar penuh, keringkan 3–5 hari, kadar air hay ≤15%. Mineral blok wajib untuk padang penggembalaan.',
    },
    harga: {
      estimasiAI: 220, hargaMarketplace: 200,
      satuan: 'per kg segar', supplier: 'Padang penggembalaan / produsen hay NTT dan Sulawesi',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Rhodes grass (Chloris gayana), ruminants',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data proksimat Chloris gayana panen 40 hari, NTT dan Sulawesi Selatan',
      catatan: 'Nilai estimasi referensi untuk kondisi segar. Hay Rhodes berkualitas tinggi memiliki PK 10–12% BK, TDN 55–60% — nilai tertinggi di antara hay tropis.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Rhodes Grass adalah satu-satunya rumput tropis yang sangat cocok untuk produksi hay berkualitas — daun halus, batang tidak terlalu kasar, nilai nutrisi hay mencapai PK 10–12% BK dan TDN 56%.' },
      { type: 'kelebihan', icon: '✅', text: 'Kualitas hay terbaik di antara rumput lokal. Tumbuh di lahan alkalis yang tidak disukai rumput lain. Protein hay 10–12% BK setara hay alfalfa tropis dalam nilai nutrisi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kurang palatabel saat segar dibanding Benggala. Perlu kondisi kering untuk produksi hay berkualitas — musim hujan tinggi menyulitkan pengeringan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Hay Rhodes + Konsentrat protein 20–25% adalah formula pakan kering musim kemarau yang sangat baik untuk sapi potong. Untuk padang segar: campurkan dengan leguminosa tahan kering.' },
      { type: 'peringatan', icon: '🚨', text: 'Panen untuk hay harus tepat waktu — jangan melewati 70 hari atau bunga sudah terbuka penuh. Hay yang terlambat dipanen memiliki NDF >70% dan nilai nutrisi menurun drastis.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk hay: Setaria (lebih mudah dikeringkan di beberapa kondisi). Untuk padang: Afrika Star atau Bermuda Grass lebih tahan injakan. Untuk lahan basah: Benggala lebih produktif.' },
    ],
  },

  // ── 13. Rumput Bermuda ───────────────────────────────────────────────────────
  'rumput-bermuda': {
    namaLatin: 'Cynodon dactylon (L.) Pers.',
    asalBahan: 'Rumput menjalar pendek tumbuh alami dan dibudidayakan, dipanen segar',
    bentuk: ['Segar'],
    asal: 'Afrika; satu dari rumput paling tersebar di dunia — tumbuh alami di seluruh daerah tropis dan subtropis',
    habitat: 'Sangat adaptif — tumbuh di pinggir jalan, ladang, sawah kering, dan lahan terlantar; toleran garam ringan',
    umurPanenIdeal: '30–40 hari; atau dipanen terus-menerus dari padang penggembalaan',
    tinggiTanaman: '0,1–0,4 meter; menjalar sangat kuat dengan rizom dan stolon',
    produksiHijauan: '20–60 ton/ha/tahun segar dari padang terbuka; tergantung kesuburan lahan',
    kelebihan: 'Sangat mudah diperoleh — tumbuh alami di mana-mana; biaya nol untuk pemanenan dari lahan sendiri; tahan injakan',
    kekurangan: 'Produksi per ha rendah dibanding rumput budidaya; protein dan energi di bawah rumput unggul',
    nutrisi: {
      bk: 25, kadarAir: 75,
      pk: 2.1, sk: 7.3, lk: 0.5, abu: 2.4, betn: 12.8,
      tdn: 56, me: 2290,
      ndf: 63, adf: 38,
      ca: 0.09, p: 0.03, mg: 0.05, na: 0.02, k: 0.32, cl: 0.06, s: 0.02,
      vitamin: 'Beta-karoten ±25 mg/kg BK; Vitamin K; kandungan vitamin bervariasi antar lokasi',
      mineral: 'Profil mineral cukup baik untuk rumput alam; Ca sedikit lebih tinggi dari rata-rata',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 65,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Kerbau', 'Kuda'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower', 'Pejantan'],
      musimTerbaik: 'Musim hujan — pertumbuhan sangat cepat; musim kemarau dorman tetapi akar tetap hidup',
      umurPanenTerbaik: '30–40 hari setelah pemangkasan; tinggi pemotongan 5–10 cm untuk recovery optimal',
      catatan: 'Rumput paling mudah diperoleh di Indonesia — manfaatkan lahan pinggir jalan, galengan sawah, dan pekarangan. Tidak perlu ditanam secara khusus. Untuk produksi intensif: gunakan kultivar unggul (Bermuda Coast Cross) dan beri pupuk.',
    },
    harga: {
      estimasiAI: 180, hargaMarketplace: 160,
      satuan: 'per kg segar', supplier: 'Lahan sendiri / pinggir jalan / sungai (biaya gratis)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Bermuda grass (Cynodon dactylon), ruminants',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Rev. Ed.',
      ],
      sumberData: 'Data proksimat Cynodon dactylon tumbuh alami dan budidaya, panen 35 hari, seluruh Indonesia',
      catatan: 'Nilai estimasi referensi untuk kondisi alam. Kultivar Bermuda Coast Cross yang dipupuk dapat mencapai PK 14–16% BK dan TDN 65%+ — jauh di atas Bermuda alam.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Rumput Bermuda adalah hijauan gratis yang tersedia di seluruh Indonesia — BK 25%, TDN 56% BK, palatabilitas baik. Cocok sebagai suplemen hijauan murah atau sumber pakan darurat di musim kemarau.' },
      { type: 'kelebihan', icon: '✅', text: 'Biaya pengadaan nol jika tersedia di sekitar peternakan. Pulih sangat cepat setelah pemotongan atau kemarau. Akar dalam bertahan selama musim kering panjang.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein (8.5% BK) dan energi tidak cukup untuk penggemukan intensif atau produksi susu tinggi tanpa suplemen. Produksi ton/ha rendah dibanding rumput budidaya.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk peternak dengan anggaran terbatas: Bermuda alam 60–70% + Leguminosa (Gamal, Lamtoro) 20–30% + Konsentrat minimal. Ini adalah formula paling ekonomis yang masih bisa menghasilkan.' },
      { type: 'peringatan', icon: '🚨', text: 'Bermuda yang tumbuh di lahan yang disemprot herbisida atau pupuk kimia berbahaya — jangan panen dari area tersebut. Perhatikan tanda-tanda kontaminasi pestisida.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk produksi lebih serius: Bermuda Coast Cross (kultivar unggul, produksi 3× lebih tinggi) atau Gajah Mini dan Odot. Bermuda alam tetap berguna sebagai suplemen atau pakan darurat.' },
    ],
  },

  // ── 14. Rumput Bintang ───────────────────────────────────────────────────────
  'rumput-bintang': {
    namaLatin: 'Cynodon nlemfuensis Vanderyst',
    asalBahan: 'Rumput Cynodon berukuran sedang dipanen segar umur 35–50 hari',
    bentuk: ['Segar'],
    asal: 'Afrika Timur (Ethiopia, Kenya); introduksi ke Asia Tenggara dan Amerika Tropis',
    habitat: 'Tumbuh baik di lahan kering terbuka; lebih produktif dari Bermuda di lahan subur; tahan injakan',
    umurPanenIdeal: '35–50 hari',
    tinggiTanaman: '0,3–0,7 meter; lebih besar dari Bermuda biasa dengan daun lebih lebar',
    produksiHijauan: '30–80 ton/ha/tahun segar; lebih produktif dari Bermuda biasa',
    kelebihan: 'Palatabilitas lebih baik dari Bermuda (C. dactylon); lebih produktif dan lebih lembut; cocok untuk penggembalaan intensif',
    kekurangan: 'Kurang terkenal dan lebih sulit mendapatkan bibit di Indonesia',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 2.2, sk: 6.2, lk: 0.5, abu: 2.2, betn: 11.0,
      tdn: 57, me: 2330,
      ndf: 62, adf: 37,
      ca: 0.09, p: 0.03, mg: 0.05, na: 0.02, k: 0.33, cl: 0.06, s: 0.02,
      vitamin: 'Beta-karoten ±28 mg/kg BK; Vitamin K; klorofil cukup',
      mineral: 'Profil mineral lebih baik dari Bermuda; Ca sedikit lebih tinggi',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 65,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Kuda'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower', 'Pejantan'],
      musimTerbaik: 'Musim hujan optimal; tahan kemarau sedang lebih baik dari Benggala',
      umurPanenTerbaik: '35–45 hari untuk padang penggembalaan; rotasi 5–6 minggu',
      catatan: 'Lebih produktif dan palatabel dibanding Bermuda alam. Baik untuk padang penggembalaan intensif sapi potong dan kuda. Berikan mineral blok secara permanen di padang.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 185,
      satuan: 'per kg segar', supplier: 'Padang penggembalaan / kebun hijauan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Star grass (Cynodon nlemfuensis), ruminants',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data proksimat Cynodon nlemfuensis, panen 40 hari, berbagai lokasi tropis Indonesia',
      catatan: 'Nilai estimasi referensi. Lebih langka dari Bermuda biasa di Indonesia — sering ditanam bersama atau menggantikan Bermuda di program hijauan unggul.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Rumput Bintang adalah versi premium Bermuda — lebih besar, lebih palatabel, lebih produktif (PK 10% BK, TDN 57% BK). Pilihan upgrade alami untuk peternak yang sudah menggunakan Bermuda biasa.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas lebih baik dari Bermuda (C. dactylon). Daun lebih lebar dan lembut. Produksi lebih tinggi pada kondisi yang sama. Lebih cocok untuk ternak yang selektif.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Bibit sulit diperoleh di beberapa daerah. Masih kalah produktif dari rumput unggul seperti Gajah atau Benggala.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk padang berkualitas: Bintang 70% + Leguminosa (Stylosanthes atau Arachis pintoi) 30%. Kombinasi ini mendekati kebutuhan nutrisi ternak muda dan sapi kering tanpa konsentrat.' },
      { type: 'peringatan', icon: '🚨', text: 'Pastikan sumber bibit bebas dari rumput pengganggu (khususnya jenis Cynodon liar yang kualitasnya lebih rendah) — morfologi antar jenis Cynodon mirip.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika bibit tidak tersedia: Bermuda biasa (kualitas lebih rendah) atau Afrika Star (produksi dan palatabilitas serupa). Untuk produksi lebih tinggi: Benggala atau Gajah Mini.' },
    ],
  },

  // ── 15. Rumput Para ──────────────────────────────────────────────────────────
  'rumput-para': {
    namaLatin: 'Brachiaria mutica (Forssk.) Stapf',
    asalBahan: 'Rumput Brachiaria menjalar lahan basah, dipanen segar dari tepi sungai atau sawah',
    bentuk: ['Segar'],
    asal: 'Afrika tropis; diintroduksi ke Asia Tenggara dan Amerika Tropis; naturalisasi luas di Jawa dan Sumatra',
    habitat: 'Tepi sungai, sawah bera, lahan basah, dan rawa — tumbuh alami tanpa penanaman; merayap di air',
    umurPanenIdeal: 'Panen kapan saja tersedia; kualitas terbaik pada tunas muda 20–35 hari',
    tinggiTanaman: '0,5–1,5 meter; batang tebal dengan bulu kasar di permukaan',
    produksiHijauan: 'Tidak perlu dibudidayakan — tersedia bebas di tepi sungai; panen kapan dibutuhkan',
    kelebihan: 'Tersedia gratis di hampir seluruh Jawa dan Sumatra; mudah dipanen dari tepi sungai dan sawah; biaya nol',
    kekurangan: 'Protein rendah; batang berbulu yang bisa mengiritasi mulut; palatabilitas sedikit di bawah Gajah',
    nutrisi: {
      bk: 17, kadarAir: 83,
      pk: 1.4, sk: 5.8, lk: 0.3, abu: 1.7, betn: 7.8,
      tdn: 50, me: 2050,
      ndf: 68, adf: 44,
      ca: 0.07, p: 0.02, mg: 0.04, na: 0.01, k: 0.28, cl: 0.05, s: 0.02,
      vitamin: 'Beta-karoten ±25 mg/kg BK; Vitamin K; klorofil cukup',
      mineral: 'Mineral rendah keseluruhan; Ca dan P sangat rendah — suplementasi intensif diperlukan',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 60,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Indukan', 'Grower', 'Penggemukan'],
      musimTerbaik: 'Tersedia sepanjang tahun di tepi sungai dan lahan basah',
      umurPanenTerbaik: 'Panen tunas muda 20–35 hari untuk kualitas terbaik; hindari batang tua berbulu',
      catatan: 'Panen bagian ujung batang muda dan daun — hindari batang tua yang keras dan berbulu. Untuk sapi perah: suplemen protein minimal 200g/ekor/hari jika Para sebagai sumber hijauan utama. Suplementasi mineral wajib.',
    },
    harga: {
      estimasiAI: 150, hargaMarketplace: 130,
      satuan: 'per kg segar', supplier: 'Tepi sungai / sawah bera (tersedia gratis)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Para grass (Brachiaria mutica), ruminants',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 208',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data proksimat Brachiaria mutica, tepi sungai Jawa Barat dan Jawa Tengah, panen muda',
      catatan: 'Nilai estimasi referensi. BK 17% karena tumbuh di lahan basah. Para tua (BK >25%) memiliki nilai nutrisi lebih rendah karena lignifikasi batang.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Rumput Para adalah hijauan gratis paling tersedia di Jawa dan Sumatra — tumbuh lebat di tepi sungai dan sawah tanpa perlu ditanam. Nilai ekonomi sangat tinggi bagi peternak kecil yang tidak punya lahan hijauan.' },
      { type: 'kelebihan', icon: '✅', text: 'Biaya pengadaan nol — cukup panen dari tepi sungai. Tersedia sepanjang tahun. Tidak bersaing dengan lahan pertanian. Dikenal luas dan mudah diidentifikasi oleh peternak Jawa.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein hanya 8.5% BK dan NDF 68% BK — nilai nutrisi paling rendah di antara Brachiaria. Tidak cukup untuk produksi optimal. Batang tua berbulu kasar mengurangi konsumsi ternak.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk peternak sapi perah dengan anggaran terbatas: Para 60% + Gamal/Lamtoro 25% + Konsentrat 15%. Ini adalah kombinasi termurah yang masih menghasilkan susu 8–10 liter/ekor/hari.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan panen dari tepi sungai yang tercemar limbah industri atau pertanian. Bulu kasar batang tua bisa menyebabkan lesi di mulut ternak — selalu panen bagian muda.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk kualitas lebih baik dengan biaya rendah: Kolonjono (spesies sama, sebutan berbeda di Jawa). Untuk produksi lebih serius: Gajah atau Odot yang ditanam di lahan sendiri.' },
    ],
  },

  // ── 16. Rumput Pangola ───────────────────────────────────────────────────────
  'rumput-pangola': {
    namaLatin: 'Digitaria eriantha Steud.',
    asalBahan: 'Rumput stolon halus dan lebat dipanen segar umur 30–45 hari',
    bentuk: ['Segar'],
    asal: 'Afrika Selatan; introduksi ke Amerika dan Asia Tenggara pada pertengahan abad ke-20',
    habitat: 'Tanah ringan berpasir hingga lempung berdrainase baik; tidak toleran tanah masam atau genangan berat',
    umurPanenIdeal: '30–45 hari',
    tinggiTanaman: '0,5–1,0 meter; batang stolon halus dan lebat',
    produksiHijauan: '40–100 ton/ha/tahun segar; produktif dengan pupuk dan irigasi',
    kelebihan: 'Daun lembut dan sangat palatabel; tumbuh lebat menutup lahan; cocok untuk lahan ringan',
    kekurangan: 'Rentan kekeringan; tidak toleran tanah masam atau genangan; kurang produktif di musim kemarau',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 1.8, sk: 6.2, lk: 0.4, abu: 1.8, betn: 9.8,
      tdn: 55, me: 2250,
      ndf: 64, adf: 39,
      ca: 0.07, p: 0.02, mg: 0.04, na: 0.01, k: 0.30, cl: 0.05, s: 0.02,
      vitamin: 'Beta-karoten ±30 mg/kg BK; Vitamin K; profil vitamin baik',
      mineral: 'Mineral moderat; Ca dan P rendah — suplementasi diperlukan',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 65,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Menyusui', 'Grower', 'Penggemukan'],
      musimTerbaik: 'Musim hujan — irigasi diperlukan di musim kemarau untuk produktivitas optimal',
      umurPanenTerbaik: '30–40 hari untuk daun muda yang paling palatabel',
      catatan: 'Cocok untuk peternakan di kebun campuran dan lahan ringan. Palatabilitas tinggi — baik untuk ternak yang pilih-pilih pakan. Perlu irigasi di musim kemarau untuk mempertahankan produksi.',
    },
    harga: {
      estimasiAI: 180, hargaMarketplace: 165,
      satuan: 'per kg segar', supplier: 'Kebun hijauan lokal / peternak sapi perah',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Pangola grass (Digitaria eriantha), ruminants',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data proksimat Digitaria eriantha, kebun hijauan Jawa Barat, panen 35 hari',
      catatan: 'Nilai estimasi referensi. Pangola adalah nama umum untuk beberapa spesies Digitaria — nilai nutrisi bervariasi antar spesies namun serupa dalam kisaran yang diberikan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Rumput Pangola menawarkan palatabilitas tinggi dan daun lembut untuk ternak pemilih — ideal untuk sapi perah dan ternak yang sedang masa pemulihan. TDN 55% BK memenuhi kebutuhan pemeliharaan hingga produksi moderat.' },
      { type: 'kelebihan', icon: '✅', text: 'Daun paling lembut di antara rumput lokal — ternak jarang meninggalkan sisa. Menutup lahan dengan rapat mencegah gulma. Cocok untuk sistem zero-grazing di kebun.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Rentan kekeringan dan tanah masam. Kurang produktif di musim kemarau panjang. Perlu investasi irigasi untuk mempertahankan produksi sepanjang tahun.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk sapi perah: Pangola 60% + Gamal atau Kaliandra 25% + Konsentrat 15%. Palatabilitas tinggi mendorong konsumsi BK yang optimal.' },
      { type: 'peringatan', icon: '🚨', text: 'Tanam hanya di lahan dengan drainase baik dan pH tanah ≥5,5. Di lahan masam atau tergenang, Pangola akan mati dalam beberapa musim.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk lahan basah: Rumput Para atau Kolonjono. Untuk kualitas lebih tinggi: Odot atau Gajah Mini. Untuk lahan kering: Brachiaria brizantha atau Afrika Star.' },
    ],
  },

  // ── 17. Rumput Kolonjono ─────────────────────────────────────────────────────
  'rumput-kolonjono': {
    namaLatin: 'Brachiaria mutica (Forssk.) Stapf',
    asalBahan: 'Nama lokal Jawa untuk Brachiaria mutica — dipanen segar dari tepi sungai dan lahan basah',
    bentuk: ['Segar'],
    asal: 'Afrika tropis (sama dengan Rumput Para); naturalisasi sangat luas di Jawa Tengah dan Jawa Timur',
    habitat: 'Tepi sungai, saluran irigasi, sawah bera, dan lahan basah — tumbuh alami dan berlimpah di seluruh Jawa',
    umurPanenIdeal: 'Panen tunas muda 20–35 hari; tersedia sepanjang tahun',
    tinggiTanaman: '0,5–1,5 meter; morfologi identik dengan Para',
    produksiHijauan: 'Tidak perlu dibudidayakan — tumbuh alami melimpah di tepi sungai Jawa',
    kelebihan: 'Tersedia gratis di Jawa; digemari sapi perah karena batang lunak; nama lokal yang dikenal peternak Jawa',
    kekurangan: 'Identik dengan Para — protein rendah, bulu kasar pada batang tua; tidak untuk produksi intensif',
    nutrisi: {
      bk: 18, kadarAir: 82,
      pk: 1.5, sk: 5.9, lk: 0.3, abu: 1.8, betn: 8.4,
      tdn: 50, me: 2050,
      ndf: 68, adf: 44,
      ca: 0.07, p: 0.02, mg: 0.04, na: 0.01, k: 0.27, cl: 0.05, s: 0.02,
      vitamin: 'Beta-karoten ±25 mg/kg BK; Vitamin K; profil vitamin serupa Para',
      mineral: 'Identik dengan Para (B. mutica); Ca dan P rendah — suplementasi wajib',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 60,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Menyusui', 'Grower', 'Penggemukan'],
      musimTerbaik: 'Tersedia sepanjang tahun di tepi sungai Jawa',
      umurPanenTerbaik: 'Panen tunas muda 20–35 hari dari batang; hindari bagian tua berbulu kasar',
      catatan: 'Secara botani identik dengan Rumput Para (B. mutica) — perbedaan hanya pada sebutan lokal. Di Jawa Tengah dan Jawa Timur disebut Kolonjono; di Jawa Barat dan luar Jawa disebut Para. Nilai nutrisi dan cara penggunaan identik.',
    },
    harga: {
      estimasiAI: 150, hargaMarketplace: 130,
      satuan: 'per kg segar', supplier: 'Tepi sungai / saluran irigasi Jawa (tersedia gratis)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Para grass (Brachiaria mutica), ruminants',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 208',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik, UGM Press',
      ],
      sumberData: 'Data proksimat Brachiaria mutica (Kolonjono), tepi sungai Jawa Tengah dan Jawa Timur',
      catatan: 'Nilai estimasi referensi. Kolonjono dan Para adalah nama berbeda untuk spesies identik (B. mutica). Nilai nutrisi dan rekomendasi penggunaan identik dengan Rumput Para.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Kolonjono adalah hijauan gratis andalan peternak sapi Jawa — B. mutica yang tumbuh alami di tepi sungai dan saluran irigasi seluruh Jawa. Berikan terutama pada sapi perah karena batang muda sangat disukai.' },
      { type: 'kelebihan', icon: '✅', text: 'Identik dengan Para — tersedia gratis di tepi sungai Jawa. Dikenal dan digunakan turun-temurun oleh peternak Jawa Tengah dan Jawa Timur. Batang muda sangat lunak dan disukai sapi perah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein hanya 8.5% BK — tidak cukup untuk produksi susu >10 liter/hari tanpa suplemen. Batang tua berbulu sangat kasar. Kualitas bervariasi tergantung lokasi dan musim.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula peternak Jawa yang terbukti: Kolonjono 60–70% + Gamal (Gliricidia) atau Lamtoro 20–30% + Ampas tahu atau Konsentrat 10–20%. Produksi susu bisa mencapai 12–15 liter/ekor/hari.' },
      { type: 'peringatan', icon: '🚨', text: 'Panen dari tepi sungai yang bersih — hindari lokasi tercemar limbah atau yang baru disemprot pestisida. Bulu kasar batang tua bisa melukai mulut sapi — selalu panen bagian muda.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk produksi yang lebih serius: Gajah, Odot, atau Gajah Mini ditanam di pekarangan. Kolonjono sebaiknya dijadikan suplemen atau pakan cadangan, bukan satu-satunya sumber hijauan.' },
    ],
  },

  // ── 18. Rumput Lapang ────────────────────────────────────────────────────────
  'rumput-lapang': {
    namaLatin: 'Axonopus compressus (Sw.) P.Beauv. (dominan)',
    asalBahan: 'Campuran rumput alam yang tumbuh di padang, pinggir jalan, dan lahan terlantar — dipanen segar',
    bentuk: ['Segar'],
    asal: 'Campuran spesies asli dan introduksi — didominasi Axonopus compressus (Amerika Tropis) dan Paspalum sp.',
    habitat: 'Tumbuh di mana saja — padang, ladang terlantar, pinggir jalan, galengan, dan pekarangan kosong',
    umurPanenIdeal: 'Panen kapan tersedia; kualitas terbaik sebelum berbunga (20–35 hari)',
    tinggiTanaman: '0,1–0,4 meter; pendek dan menjalar — menutup tanah dengan rapat',
    produksiHijauan: 'Tidak dibudidayakan — tersedia gratis di seluruh lahan terbuka Indonesia',
    kelebihan: 'Tersedia gratis di mana-mana; tidak perlu penanaman; dapat dipanen kapan saja dari lahan sekitar',
    kekurangan: 'Nilai nutrisi paling rendah di antara semua rumput — protein 5–8% BK, nilai bervariasi antar musim',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 1.4, sk: 7.0, lk: 0.3, abu: 2.2, betn: 11.0,
      tdn: 48, me: 1970,
      ndf: 68, adf: 44,
      ca: 0.08, p: 0.02, mg: 0.03, na: 0.01, k: 0.25, cl: 0.04, s: 0.02,
      vitamin: 'Beta-karoten bervariasi (±20–30 mg/kg BK); Vitamin K; nilai bervariasi antar spesies penyusun',
      mineral: 'Mineral sangat rendah keseluruhan; sangat perlu suplementasi mineral komplit',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 55,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Indukan', 'Grower'],
      musimTerbaik: 'Musim hujan — lebih hijau dan protein lebih tinggi; musim kemarau protein turun ke 5%',
      umurPanenTerbaik: 'Panen sebelum berbunga (20–30 hari); daun muda paling bergizi',
      catatan: 'Gunakan hanya sebagai suplemen atau pakan darurat — jangan sebagai sumber hijauan utama. Jika terpaksa sebagai pakan utama, suplementasi protein (urea untuk ruminansia, atau bungkil kelapa) dan mineral blok wajib diberikan.',
    },
    harga: {
      estimasiAI: 100, hargaMarketplace: 80,
      satuan: 'per kg segar', supplier: 'Lahan terbuka sekitar peternakan (gratis)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Carpet grass (Axonopus compressus), ruminants',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik, UGM Press',
      ],
      sumberData: 'Data proksimat campuran rumput lapang (didominasi A. compressus dan Paspalum sp.), Jawa Barat',
      catatan: 'Nilai estimasi referensi — variasi sangat tinggi tergantung komposisi spesies penyusun, umur panen, dan kesuburan lahan. Musim kemarau: PK bisa turun hingga 5% BK.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Rumput Lapang adalah pakan darurat atau suplemen murah — tersedia gratis di mana-mana, namun nilai nutrisinya paling rendah (TDN 48% BK, PK 6.5% BK). Cocok hanya sebagai tambahan, bukan sumber utama.' },
      { type: 'kelebihan', icon: '✅', text: 'Tersedia gratis di seluruh Indonesia. Tidak perlu persiapan lahan. Dapat mengurangi biaya pakan secara signifikan jika tersedia melimpah di sekitar peternakan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Nilai nutrisi paling rendah dari semua rumput. Protein hanya 6.5% BK — di bawah kebutuhan minimum ruminansia (7–8% BK) untuk pemeliharaan. Tidak bisa sebagai sumber hijauan tunggal.' },
      { type: 'kombinasi', icon: '🔗', text: 'Jika terpaksa menggunakan: Lapang 50% + Gamal/Lamtoro 40% + Konsentrat protein 10%. Suplementasi urea (150–200g/ekor/hari) dan mineral blok wajib untuk menutup defisit protein.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan jadikan Rumput Lapang sebagai satu-satunya pakan ternak produktif. Protein di bawah 7% BK menyebabkan ternak kehilangan bobot badan dan produksi menurun tajam.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika ada lahan: tanam Gajah, Odot, atau Brachiaria — investasi minimal dengan hasil jauh lebih baik. Rumput Lapang hanya sebagai darurat atau suplemen saat hijauan utama kurang.' },
    ],
  },

  // ── 19. Rumput Alang-alang ───────────────────────────────────────────────────
  'rumput-alang-alang': {
    namaLatin: 'Imperata cylindrica (L.) P.Beauv.',
    asalBahan: 'Rumput liar invasif yang dipanen segar — khusus bagian tunas muda',
    bentuk: ['Segar'],
    asal: 'Asia Selatan dan Tenggara; salah satu gulma paling invasif di dunia tropis',
    habitat: 'Lahan terbuka terdegradasi, bekas ladang berpindah, tepi jalan — tumbuh sangat agresif di lahan kering miskin hara',
    umurPanenIdeal: 'Tunas muda 2–3 minggu setelah kebakaran atau pemangkasan; hindari tanaman dewasa',
    tinggiTanaman: '0,5–1,5 meter; batang keras dan tajam; rimpang (rhizoma) sangat dalam',
    produksiHijauan: 'Tidak dibudidayakan; tumbuh alami di lahan terlantar — nilai pakan hanya pada tunas muda',
    kelebihan: 'Tunas muda (setelah kebakaran/pemangkasan) cukup palatabel; tersedia gratis di lahan terlantar',
    kekurangan: 'Protein sangat rendah (4–6% BK); batang dewasa keras dan tajam menyebabkan luka; nilai pakan terendah',
    nutrisi: {
      bk: 28, kadarAir: 72,
      pk: 1.4, sk: 10.6, lk: 0.3, abu: 2.5, betn: 13.1,
      tdn: 44, me: 1800,
      ndf: 74, adf: 50,
      ca: 0.09, p: 0.02, mg: 0.03, na: 0.01, k: 0.22, cl: 0.04, s: 0.02,
      vitamin: 'Beta-karoten sangat rendah pada tanaman dewasa; sedikit lebih tinggi pada tunas muda',
      mineral: 'Mineral sangat rendah; kandungan silika tinggi dari batang keras membatasi kecernaan',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kerbau'],
      programCocok: ['Indukan'],
      musimTerbaik: 'Musim hujan (tunas baru muncul); segera setelah musim kemarau panjang',
      umurPanenTerbaik: 'Tunas 2–3 minggu — HANYA saat tidak ada pakan lain tersedia',
      catatan: 'HANYA gunakan tunas muda (2–3 minggu) — tanaman dewasa tidak palatabel dan berpotensi menyebabkan luka di mulut. Jangan jadikan sumber pakan utama. Gunakan hanya saat pakan lain benar-benar tidak tersedia.',
    },
    harga: {
      estimasiAI: 80, hargaMarketplace: 60,
      satuan: 'per kg segar', supplier: 'Lahan terlantar (gratis — sebaiknya tidak dibeli)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Cogon grass (Imperata cylindrica), ruminants',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik',
      ],
      sumberData: 'Data proksimat Imperata cylindrica dewasa, berbagai lokasi Indonesia; catatan: tunas muda memiliki PK ±8% BK',
      catatan: 'Nilai estimasi referensi untuk tanaman dewasa. Tunas muda (2–3 minggu) memiliki nilai nutrisi lebih baik: PK ±8% BK, NDF ±55% BK, palatabilitas sedang. Tanaman dewasa: TDN 44%, PK 5% BK, palatabilitas kurang.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Alang-alang adalah pakan darurat terakhir — nilai nutrisi paling rendah dari semua hijauan (TDN 44% BK, PK 5% BK), hanya dikonsumsi ternak saat tidak ada pilihan lain. Tunas muda pasca-kebakaran sedikit lebih baik.' },
      { type: 'kelebihan', icon: '✅', text: 'Tersedia gratis di lahan terdegradasi yang tidak bisa digunakan untuk apapun. Membantu darurat pakan di musim kemarau panjang saat semua hijauan lain habis.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Nilai nutrisi terendah dari semua hijauan yang dikenal — bahkan di bawah jerami padi. Batang dewasa keras, tajam, dan dapat melukai mulut dan lidah ternak. Tidak boleh jadi pakan utama.' },
      { type: 'kombinasi', icon: '🔗', text: 'Jika terpaksa menggunakan dalam kondisi darurat: Alang-alang muda 40% + Gamal atau Lamtoro 50% (untuk protein) + Mineral blok 10%. Tanpa leguminosa, gunakan suplementasi urea 150g/ekor/hari.' },
      { type: 'peringatan', icon: '🚨', text: '⚠️ HANYA TUNAS MUDA — tanaman dewasa berpotensi menyebabkan luka fisik pada mulut dan lidah. Jangan beli alang-alang — nilai ekonomisnya tidak sebanding. Prioritaskan menanam rumput unggul sebagai solusi jangka panjang.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika lahan didominasi alang-alang: pertimbangkan konversi ke Brachiaria (bisa mendesak alang-alang) atau Gajah (perlu pengolahan lahan awal). Ini investasi terbaik untuk peternak di lahan terdegradasi.' },
    ],
  },

  // ── 20. Teki ─────────────────────────────────────────────────────────────────
  'teki': {
    namaLatin: 'Cyperus rotundus L.',
    asalBahan: 'Tumbuhan bukan rumput sejati (Cyperaceae) tumbuh alami di ladang dan pekarangan — dipanen segar',
    bentuk: ['Segar'],
    asal: 'Wilayah tropis dan subtropis di seluruh dunia; salah satu gulma pertanian paling tersebar',
    habitat: 'Ladang, sawah, pekarangan, dan lahan lembab — tumbuh agresif sebagai gulma pertanian',
    umurPanenIdeal: 'Panen bagian vegetatif sebelum berbunga (20–30 hari daun baru)',
    tinggiTanaman: '0,2–0,5 meter; daun sempit dan kaku; umbi bawah tanah kecil berwarna kecokelatan',
    produksiHijauan: 'Tidak dibudidayakan — dipanen dari lahan ladang/sawah sebagai tambahan hijauan',
    kelebihan: 'Umbi mengandung pati yang disukai ternak; tersedia gratis di ladang dan sawah; mudah diidentifikasi',
    kekurangan: 'Bukan rumput sejati; nilai nutrisi rendah; batang keras dan sempit; produksi terbatas',
    nutrisi: {
      bk: 25, kadarAir: 75,
      pk: 1.6, sk: 7.5, lk: 0.4, abu: 2.3, betn: 13.3,
      tdn: 48, me: 1970,
      ndf: 62, adf: 40,
      ca: 0.08, p: 0.03, mg: 0.04, na: 0.01, k: 0.25, cl: 0.04, s: 0.02,
      vitamin: 'Beta-karoten rendah; beberapa senyawa aromatik (seskuiterpen) dari umbi bersifat non-toksik',
      mineral: 'Mineral rendah-moderat; P sedikit lebih tinggi dari alang-alang karena umbi mengandung pati',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Grower'],
      musimTerbaik: 'Tersedia sepanjang tahun di ladang dan sawah',
      umurPanenTerbaik: 'Bagian daun muda — sebelum berbunga; umbi dapat diberikan terpisah',
      catatan: 'Teki dimasukkan sebagai referensi — bukan rekomendasi utama. Panen daun dan umbi bersama-sama. Umbi mengandung pati yang disukai ternak. Cocok sebagai suplemen kecil saat membersihkan ladang, bukan sebagai sumber hijauan utama.',
    },
    harga: {
      estimasiAI: 80, hargaMarketplace: 60,
      satuan: 'per kg segar', supplier: 'Ladang/sawah sendiri (gratis saat bersih gulma)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Purple nutsedge (Cyperus rotundus), ruminants',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik',
      ],
      sumberData: 'Data proksimat Cyperus rotundus (bagian vegetatif), ladang Jawa Barat',
      catatan: 'Nilai estimasi referensi. Teki bukan Poaceae (rumput sejati) — termasuk Cyperaceae. Dimasukkan dalam daftar Rumput Lokal karena sering dikonsumsi ternak bersama rumput lapang.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Teki adalah suplemen oportunistik — bukan pakan utama. Nilai nutrisinya rendah (TDN 48% BK, PK 6.5% BK) namun umbi kaya pati memberikan sedikit bonus energi. Berikan saat membersihkan ladang saja.' },
      { type: 'kelebihan', icon: '✅', text: 'Umbi pati yang ditemukan ternak cukup disukai. Tidak perlu beli — sudah ada di ladang. Dapat diberikan bersama tanah yang menempel sebagai sumber mineral alami.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Bukan rumput sejati — batang keras dan sempit tidak seefisien daun lebar. Nilai nutrisi jauh di bawah semua rumput unggul. Tidak ada manfaat signifikan jika ada pilihan hijauan lain.' },
      { type: 'kombinasi', icon: '🔗', text: 'Tidak perlu kombinasi khusus untuk Teki — berikan sebagai sampingan saat membersihkan ladang. Fokuskan investasi hijauan pada Gajah, Odot, atau Brachiaria yang jauh lebih produktif.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan membeli Teki — nilai nutrisinya tidak sebanding biaya transport. Jangan menanamnya khusus untuk pakan — dia adalah gulma yang akan bersaing dengan tanaman lain. Gunakan hanya sebagai by-product pembersihan ladang.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk pakan dari lahan yang sama: Rumput Lapang lebih baik nilai nutrisinya. Untuk produksi yang lebih serius: konversi lahan dari Teki ke Brachiaria atau Gajah.' },
    ],
  },

};

// ─── Merger Function ──────────────────────────────────────────────────────────

export function getRumputDetail(id: string): RumputItem | undefined {
  const base = getRumputById(id);
  if (!base) return undefined;

  const detail = RUMPUT_DETAIL[id];
  if (!detail) return base;

  return {
    ...base,
    namaLatin: detail.namaLatin,
    asalBahan: detail.asalBahan,
    bentuk: detail.bentuk,
    asal: detail.asal,
    habitat: detail.habitat,
    umurPanenIdeal: detail.umurPanenIdeal,
    tinggiTanaman: detail.tinggiTanaman,
    produksiHijauan: detail.produksiHijauan,
    kelebihan: detail.kelebihan,
    kekurangan: detail.kekurangan,
    nutrisi: detail.nutrisi,
    penggunaan: detail.penggunaan,
    harga: detail.harga,
    referensi: detail.referensi,
    aiInsight: detail.aiInsight,
    dataLengkap: true,
  };
}
