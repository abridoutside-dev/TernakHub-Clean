// ─── MP-011 — Detail Data: Daun-daunan ───────────────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for all 22 daun items.
//
// Convention: proximate (PK, SK, LK, Abu, BETN), TDN, ME, NDF, ADF, and minerals
// are expressed on DM (Bahan Kering) basis. bk and kadarAir are % of fresh material.
//
// Primary sources:
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi
//     Pakan untuk Indonesia. Gadjah Mada University Press.
//   • NRC (2016). Nutrient Requirements of Beef Cattle, 8th Rev. Ed.
//   • Feedipedia (2023). INRA-CIRAD-AFZ-FAO Animal Feed Resources.
//   • Devendra, C. (1992). Non-conventional Feed Resources in Asia & the Pacific. FAO.
//   • FAO (2018). Feed Resources for Tropical Ruminants.
//   • Balai Penelitian Ternak Indonesia — Data Hijauan Daun Tropik.
//   • Sirait, J. et al. (2015). Potensi Hijauan Daun sebagai Pakan Ternak Ruminansia. JITV.

import { getDaunanById, type DaunanItem } from './daunanData';
import type {
  NutrisiData,
  PenggunaanData,
  HargaData,
  ReferensiData,
  AiInsightItem,
  BentukBahan,
} from './jagungData';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DaunanDetailFields {
  deskripsi: string;
  alias: string;
  asal: string;
  habitat: string;
  umurPanenIdeal: string;
  bagianDimanfaatkan: string;
  produksi: string;
  kelebihan: string;
  kekurangan: string;
  bentuk: BentukBahan[];
  nutrisi: NutrisiData;
  penggunaan: PenggunaanData;
  harga: HargaData;
  referensi: ReferensiData;
  aiInsight: AiInsightItem[];
}

export type DaunanDetailItem = DaunanItem & DaunanDetailFields;

// ─── Detail Registry ──────────────────────────────────────────────────────────

const DAUNAN_DETAIL: Record<string, DaunanDetailFields> = {

  // ── 1. Daun Pisang ──────────────────────────────────────────────────────────
  'daun-pisang': {
    deskripsi: 'Daun tanaman pisang yang tersedia sepanjang tahun sebagai limbah perkebunan pisang. Merupakan hijauan sumber serat yang banyak dimanfaatkan di peternakan rakyat, terutama untuk kambing, domba, dan sapi di daerah sentra pisang. Kandungan tanin rendah membuat palatabilitas cukup baik.',
    alias: 'Banana Leaves, Godhong Gedang (Jawa), Dahon ng Saging (Filipina)',
    asal: 'Asia Tenggara dan Pasifik Selatan; dibudidayakan luas di seluruh Indonesia dari Aceh hingga Papua sebagai tanaman pangan dan perkebunan',
    habitat: 'Dataran rendah hingga 1.200 mdpl; menyukai tanah lembab dan subur; tumbuh baik di iklim tropis basah; banyak ditemukan di pekarangan, kebun, dan tepian sungai',
    umurPanenIdeal: 'Daun muda 2–3 bulan setelah pelepah terbentuk; daun tua tersedia sepanjang tahun sebagai limbah panen buah',
    bagianDimanfaatkan: 'Lamina daun (utama), pelepah (mengandung lebih banyak air dan serat), batang pisang bagian dalam (soft core)',
    produksi: '15–25 ton hijauan segar/ha/tahun tergantung densitas tanaman; limbah daun tersedia pasca panen buah',
    kelebihan: 'Ketersediaan melimpah dan murah di daerah sentra pisang; tidak mengandung antinutrisi berbahaya; palatabilitas baik untuk kambing dan domba; dapat diberikan segar maupun layu; musiman tidak menjadi masalah karena tersedia sepanjang tahun',
    kekurangan: 'Nilai TDN relatif rendah (52–55% BK) sehingga bukan sumber energi prima; protein kasar sedang (10–11% BK) — tidak cukup untuk ternak laktasi tanpa suplementasi; kadar air sangat tinggi (80–85%) pada daun segar sehingga volume pakan besar',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 18, kadarAir: 82,
      pk: 10.5, sk: 24.0, lk: 2.8, abu: 15.2, betn: 47.5,
      tdn: 53, me: 2120,
      ndf: 50.0, adf: 35.0,
      ca: 1.00, p: 0.30, mg: 0.28, na: 0.08, k: 2.80, cl: 0.40, s: 0.18,
      vitamin: 'Beta-karoten sedang; Vitamin C (±8 mg/100g segar); Riboflavin',
      mineral: 'Kalium sangat tinggi (2,8% BK) — perlu perhatian pada ransum intensif. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Kerbau'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      musimTerbaik: 'Sepanjang tahun; paling melimpah saat musim panen pisang',
      umurPanenTerbaik: 'Daun dewasa yang masih hijau dan segar; hindari daun yang sudah menguning atau berjamur',
      catatan: 'Dapat diberikan segar atau dilayukan 4–6 jam. Pelepah pisang mengandung lebih banyak air — kombinasikan dengan hijauan kering. Batang pisang bagian dalam (gedebog) juga dapat diberikan sebagai pakan serat untuk sapi.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 500,
      satuan: 'per kg segar',
      supplier: 'Kebun pisang / petani lokal / pasar tradisional / limbah industri pisang',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Feedipedia (2023) — Musa spp. leaves, INRA-CIRAD-AFZ-FAO',
        'Devendra, C. (1992) — Non-conventional Feed Resources in Asia & the Pacific, FAO',
        'Sirait, J. et al. (2015) — Potensi hijauan daun sebagai pakan ternak ruminansia, JITV',
      ],
      sumberData: 'Rata-rata dari Feedipedia dan Hartadi et al. 1997; BK diukur pada daun segar',
      catatan: 'Nilai nutrisi bervariasi antara varietas pisang (Cavendish, Raja, Kepok) dan umur daun. Daun muda umumnya lebih tinggi PK dan lebih rendah SK.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun pisang adalah hijauan sumber serat yang sangat mudah diperoleh di sentra perkebunan pisang. Cocok sebagai hijauan pelengkap dalam ransum ruminansia untuk memenuhi kebutuhan serat kasar (SK 24% BK) yang mendukung fungsi rumen optimal.' },
      { type: 'kelebihan', icon: '✅', text: 'Ketersediaan melimpah sepanjang tahun dan hampir tidak memiliki biaya pengadaan di daerah sentra pisang. Tidak mengandung antinutrisi berbahaya sehingga aman diberikan segar dalam jumlah besar untuk kambing dan domba.' },
      { type: 'kekurangan', icon: '⚠️', text: 'TDN hanya 53% BK dan protein 10.5% BK — tidak mencukupi kebutuhan ternak laktasi atau dalam fase produksi tinggi. Selalu kombinasikan dengan sumber protein (leguminosa) dan sumber energi (dedak/konsentrat).' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula rekomendasi: Daun Pisang 30% + Rumput Gajah 30% + Lamtoro/Indigofera 20% + Dedak Padi 20%. Tambahkan mineral block untuk menutupi potensi defisiensi P dan Mg.' },
      { type: 'peringatan', icon: '🚨', text: 'Kadar kalium sangat tinggi (2.8% BK). Pada ternak yang sedang mengalami masalah ginjal atau ketidakseimbangan elektrolit, batasi pemberian daun pisang. Hindari daun yang sudah berjamur atau menghitam.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika daun pisang tidak tersedia: Daun Jagung atau Daun Ubi Jalar memiliki nilai nutrisi serupa dengan protein sedikit lebih tinggi. Pelepah pisang (gedebog) dapat menggantikan sebagian volum pakan serat untuk sapi.' },
    ],
  },

  // ── 2. Daun Pepaya ──────────────────────────────────────────────────────────
  'daun-pepaya': {
    deskripsi: 'Daun tanaman pepaya yang mengandung protein kasar tinggi (22–28% BK) dan enzim papain. Di Indonesia banyak dimanfaatkan sebagai pakan kambing, domba, dan unggas. Rasa pahit akibat alkaloid carpaine membatasi palatabilitas, sehingga perlu dilayukan atau dicampur pakan lain sebelum diberikan.',
    alias: 'Papaya Leaves, Daun Gedang (Jawa), Papain Leaf, Carica Leaf',
    asal: 'Amerika Tengah (Meksiko–Kosta Rika); dibawa oleh penjelajah Spanyol ke Asia pada abad ke-16; kini dibudidayakan luas di seluruh Indonesia sebagai buah tropis utama',
    habitat: 'Dataran rendah hingga 1.000 mdpl; tumbuh baik di tanah berdrainase baik; intoleran genangan; sensitif terhadap suhu dingin (<12°C)',
    umurPanenIdeal: 'Daun dewasa pada posisi 4–8 dari pucuk; daun muda lebih tinggi enzim papain namun lebih pahit; daun tua lebih tinggi serat',
    bagianDimanfaatkan: 'Lamina daun (utama), tangkai daun, pucuk muda, buah muda (afkir)',
    produksi: '10–20 ton hijauan segar/ha/tahun; daun tersedia sepanjang produksi tanaman (18–24 bulan/tanaman)',
    kelebihan: 'Protein kasar sangat tinggi (25% BK) — salah satu tertinggi di antara daun non-leguminosa; mengandung enzim papain yang membantu pencernaan protein di rumen; tersedia dari limbah kebun pepaya; membantu mengendalikan parasit internal (anthelmintic alami)',
    kekurangan: 'Mengandung alkaloid carpaine yang menyebabkan rasa pahit dan membatasi palatabilitas; kadar papain tinggi dapat mengganggu mucosa saluran cerna jika diberikan berlebihan; wajib dilayukan 6–12 jam sebelum diberikan untuk mengurangi kepahitan',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 25.0, sk: 15.5, lk: 6.5, abu: 16.0, betn: 37.0,
      tdn: 60, me: 2400,
      ndf: 38.0, adf: 26.0,
      ca: 1.80, p: 0.45, mg: 0.35, na: 0.10, k: 3.20, cl: 0.55, s: 0.28,
      vitamin: 'Beta-karoten sangat tinggi (±2.100 mcg/100g segar); Vitamin C (±62 mg/100g segar); Vitamin E; Folat',
      mineral: 'Kalsium dan kalium sangat tinggi. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 25,
      targetTernak: ['Kambing', 'Domba', 'Ayam Kampung', 'Sapi Potong'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      musimTerbaik: 'Sepanjang tahun; paling melimpah di musim kemarau (produksi buah pepaya puncak)',
      umurPanenTerbaik: 'Daun posisi 4–8 dari pucuk (dewasa namun tidak terlalu tua); hindari daun yang sudah kekuningan',
      catatan: 'Wajib dilayukan minimal 6–12 jam atau dicacah dan dicampur hijauan lain untuk mengurangi kepahitan. Maksimal 25% dari total ransum segar. Untuk unggas: cacah halus dan campur 5–10% ransum.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 600,
      satuan: 'per kg segar',
      supplier: 'Kebun pepaya / petani pepaya / pasar buah tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Feedipedia (2023) — Carica papaya leaves, INRA-CIRAD-AFZ-FAO',
        'Aye, P.A. & Adegun, M.K. (2013) — Chemical composition of Moringa, Telfairia and Carica leaves, Agric. Biol. J. N. Am.',
        'Sirait, J. et al. (2015) — Potensi hijauan daun, JITV',
      ],
      sumberData: 'Feedipedia dan analisis proksimat BALITNAK; BK pada daun segar',
      catatan: 'Kadar alkaloid carpaine bervariasi antar varietas dan kondisi tanah. Daun tanaman pepaya jantan umumnya lebih pahit dari tanaman betina.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun pepaya adalah sumber protein kasar tertinggi (25% BK) di antara daun non-leguminosa yang umum tersedia di Indonesia. Sangat efektif sebagai suplemen protein untuk kambing dan domba dalam fase laktasi atau penggemukan.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein 25% BK + enzim papain alami menjadikan daun pepaya unik: selain menambah protein, papain membantu hidrolisis protein pakan di rumen, meningkatkan utilisasi nitrogen ransum. Juga mengandung beta-karoten sangat tinggi untuk reproduksi ternak.' },
      { type: 'peringatan', icon: '🚨', text: 'Alkaloid carpaine menyebabkan rasa pahit dan dapat menurunkan nafsu makan secara drastis jika diberikan segar. Selalu layukan 6–12 jam sebelum pemberian. Jangan melebihi 25% ransum — dosis berlebih dapat menyebabkan iritasi saluran cerna.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan: Daun Pepaya 15–20% + Rumput Gajah 40% + Jerami Padi 20% + Dedak Padi 20% + Mineral Premix. Formula ini sangat baik untuk kambing laktasi dengan biaya minimal.' },
      { type: 'kekurangan', icon: '⚠️', text: 'TDN 60% BK cukup baik, namun BETN rendah (37% BK) berarti kandungan karbohidrat non-struktural rendah. Untuk penggemukan intensif, selalu kombinasikan dengan sumber energi fermentable seperti singkong atau dedak.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika kepahitan menjadi kendala: Daun Katuk (PK 31% BK, lebih enak) atau Daun Ubi Jalar (PK 20% BK, palatabilitas sangat baik) dapat menggantikan daun pepaya sebagai sumber protein hijauan.' },
    ],
  },

  // ── 3. Daun Tebu ────────────────────────────────────────────────────────────
  'daun-tebu': {
    deskripsi: 'Daun tanaman tebu (sugar cane tops dan daun hijau) yang merupakan hasil samping industri perkebunan tebu. Di Indonesia tersedia melimpah terutama saat musim giling (Mei–Oktober). Meskipun serat kasarnya tinggi, nilai nutrisinya cukup untuk pakan sapi potong dan kerbau sebagai pakan voluminous.',
    alias: 'Sugarcane Leaves, Daun Glagah Manis, Tebu Tops, Sogolan Tebu',
    asal: 'Asia Tenggara (New Guinea); dibudidayakan sejak 8.000 SM; menjadi komoditas perkebunan utama di Jawa, Lampung, dan Sulawesi',
    habitat: 'Dataran rendah hingga 1.200 mdpl; tumbuh optimal di tanah berpasir lempung dengan drainase baik; butuh sinar matahari penuh; toleran kekeringan sedang',
    umurPanenIdeal: 'Daun hijau diambil saat tanaman berumur 8–12 bulan (siap panen); pucuk tebu (top) dipanen bersamaan dengan batang',
    bagianDimanfaatkan: 'Pucuk dan daun hijau (utama untuk pakan), daun kering/sere (silase/kompos), batang tebu afkir',
    produksi: '15–25 ton daun segar/ha/panen; limbah daun perkebunan sangat melimpah saat musim giling',
    kelebihan: 'Tersedia sangat melimpah di wilayah perkebunan tebu; biaya pengadaan sangat rendah (limbah); dapat dibuat silase berkualitas baik; pucuk tebu lebih tinggi nutrisi dan palatabilitas dibanding daun bawah; nilai energi cukup untuk sapi potong dan kerbau',
    kekurangan: 'Serat kasar sangat tinggi (34% BK) membatasi konsumsi pada ternak kecil; silika tinggi pada daun kering dapat menyebabkan keausan gigi; palatabilitas lebih rendah dari rumput unggul; perlu pencacahan karena daun panjang dan tajam di tepinya',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 27, kadarAir: 73,
      pk: 9.0, sk: 34.0, lk: 2.0, abu: 8.5, betn: 46.5,
      tdn: 50, me: 2000,
      ndf: 62.0, adf: 40.0,
      ca: 0.42, p: 0.20, mg: 0.18, na: 0.04, k: 1.45, cl: 0.30, s: 0.15,
      vitamin: 'Beta-karoten rendah hingga sedang; Thiamin',
      mineral: 'Silika tinggi (>1% BK) pada daun kering — berpotensi abrasif. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 45,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Sapi Perah', 'Kambing Besar'],
      programCocok: ['Penggemukan', 'Indukan', 'Pejantan'],
      musimTerbaik: 'Musim giling tebu (Mei–Oktober) — ketersediaan paling melimpah',
      umurPanenTerbaik: 'Pucuk tebu (top 30–50 cm) saat panen — nilai nutrisi tertinggi; daun hijau bagian bawah nilai nutrisi lebih rendah',
      catatan: 'Cacah dengan chopper sebelum diberikan (2–3 cm) untuk meningkatkan konsumsi dan mencegah pemilihan pakan. Silase pucuk tebu dapat dibuat dengan penambahan molases 3% untuk meningkatkan kualitas fermentasi. Hindari daun kering bersilika tinggi untuk ternak muda.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 350,
      satuan: 'per kg segar',
      supplier: 'Pabrik gula / perkebunan tebu / KUD tebu',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Feedipedia (2023) — Saccharum officinarum tops, INRA-CIRAD-AFZ-FAO',
        'Preston, T.R. & Leng, R.A. (1987) — Matching Ruminant Production Systems with Available Resources in the Tropics, Penambul Books',
        'Sarnklong, C. et al. (2010) — Utilization of sugarcane bagasse in beef cattle, Asian-Aust. J. Anim. Sci.',
      ],
      sumberData: 'Feedipedia dan Hartadi et al. 1997; nilai BK pada daun segar musim giling',
      catatan: 'Komposisi nutrisi bervariasi signifikan antara pucuk (top) dan daun bawah, serta antar varietas tebu. Pucuk tebu secara konsisten lebih bergizi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun dan pucuk tebu adalah sumber pakan voluminous murah yang sangat penting bagi peternak sapi di dekat area perkebunan tebu. Nilai TDN 50% BK cukup untuk pemeliharaan sapi potong dewasa jika dikombinasikan dengan sumber protein.' },
      { type: 'kelebihan', icon: '✅', text: 'Biaya pengadaan mendekati nol di wilayah perkebunan tebu. Silase pucuk tebu berkualitas baik (molases 3%) dapat disimpan 3–6 bulan sebagai cadangan pakan musim kemarau — solusi food security pakan yang sangat efisien.' },
      { type: 'kekurangan', icon: '⚠️', text: 'NDF 62% BK sangat tinggi — membatasi konsumsi bahan kering maksimal (intake ceiling). Ternak tidak dapat mengonsumsi cukup energi dari daun tebu saja. Wajib ditambahkan konsentrat energi (dedak, jagung, singkong) untuk produksi yang baik.' },
      { type: 'peringatan', icon: '🚨', text: 'Silika tinggi (>1% BK) pada daun tebu kering dapat menyebabkan keausan email gigi yang signifikan pada ternak yang mengonsumsi dalam jumlah besar jangka panjang. Gunakan lebih banyak pucuk hijau daripada daun kering.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum sapi potong ekonomis: Pucuk Tebu Segar 40% + Dedak Padi 25% + Lamtoro/Gamal 20% + Molases 5% + Mineral 10%. Molases meningkatkan palatabilitas tebu secara dramatis.' },
      { type: 'alternatif', icon: '🔄', text: 'Di luar musim giling: Ampas Tebu (bagasse) sebagai sumber serat struktural, atau Daun Jagung yang memiliki profil nutrisi serupa namun silika lebih rendah.' },
    ],
  },

  // ── 4. Daun Jagung ──────────────────────────────────────────────────────────
  'daun-jagung': {
    deskripsi: 'Daun tanaman jagung yang dipanen sebagai hijauan segar selama pertumbuhan, atau sebagai limbah pasca panen jagung (daun kering bersama batang/jerami). Merupakan salah satu hijauan limbah pertanian terpenting di Indonesia dengan ketersediaan sangat luas di sentra jagung seperti NTB, Jawa Timur, dan Sulawesi.',
    alias: 'Corn Leaves, Maize Fodder, Daun Glagah (Jawa), Fodder Corn, Corn Stover (kering)',
    asal: 'Amerika Tengah (Meksiko); diintroduksi ke Indonesia pada abad ke-16; kini menjadi tanaman pangan terpenting kedua setelah padi dengan luas tanam >3,5 juta ha/tahun',
    habitat: 'Dataran rendah hingga 1.800 mdpl; sangat adaptif di berbagai jenis tanah; musim tanam 2–3 kali/tahun di Indonesia; toleran panas namun butuh curah hujan cukup',
    umurPanenIdeal: 'Sebagai hijauan segar: 40–60 hari (sebelum tassel); sebagai limbah pasca panen: saat panen tongkol (90–105 hari)',
    bagianDimanfaatkan: 'Daun hijau (utama sebagai hijauan segar), batang muda, tongkol afkir, dan seluruh bagian aerial saat dibuat silase jagung',
    produksi: '15–30 ton hijauan segar/ha jika dipanen khusus sebagai hijauan; limbah daun 8–15 ton/ha/musim tanam',
    kelebihan: 'Ketersediaan sangat luas dan merata di seluruh Indonesia; protein cukup untuk hijauan (12% BK); TDN 58% BK — lebih tinggi dari rumput alang-alang; palatabilitas baik untuk semua jenis ternak ruminansia; dapat dibuat silase jagung berkualitas tinggi bersama batangnya',
    kekurangan: 'Musiman — terbatas saat periode panen jagung; daun kering (corn stover) nilai nutrisinya turun drastis (PK 6–7% BK); kadar air sangat tinggi pada daun segar (75–80%) sehingga volume pakan besar; tidak cukup protein untuk indukan dan ternak laktasi',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 12.0, sk: 25.0, lk: 3.5, abu: 9.5, betn: 50.0,
      tdn: 58, me: 2320,
      ndf: 52.0, adf: 34.0,
      ca: 0.50, p: 0.30, mg: 0.22, na: 0.05, k: 1.90, cl: 0.35, s: 0.20,
      vitamin: 'Beta-karoten sedang; Vitamin E; Tiamin',
      mineral: 'Fosfor relatif cukup. Semua nilai atas dasar BK. Daun kering (stover) lebih rendah 30–40% semua nilai.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 50,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Pejantan'],
      musimTerbaik: 'April–Juni dan September–November (panen raya jagung); saat musim tanam jagung segar tersedia melimpah',
      umurPanenTerbaik: '40–60 hari setelah tanam untuk hijauan segar (nilai nutrisi tertinggi, sebelum berbunga)',
      catatan: 'Daun jagung segar terbaik dipanen sebelum tanaman berbunga (tassel). Silase jagung (seluruh tanaman) adalah produk premium — potong 2–3 cm, padatkan, dan tutup rapat untuk fermentasi anaerob 21–28 hari.',
    },
    harga: {
      estimasiAI: 250, hargaMarketplace: 400,
      satuan: 'per kg segar',
      supplier: 'Petani jagung / KUD pertanian / sentra jagung NTB, Jatim, Sulawesi',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Feedipedia (2023) — Zea mays, whole plant fresh, INRA-CIRAD-AFZ-FAO',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Rev. Ed.',
        'Sirait, J. et al. (2015) — Potensi hijauan limbah pertanian, JITV',
      ],
      sumberData: 'Feedipedia dan Hartadi et al. 1997; nilai pada daun segar umur 40–60 hari',
      catatan: 'Komposisi variabel tergantung varietas, umur panen, dan kesuburan tanah. Daun dari tanaman yang dipupuk N tinggi umumnya lebih tinggi PK.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun jagung adalah hijauan limbah pertanian paling luas tersedia di Indonesia. Dengan TDN 58% BK dan PK 12% BK, nilai nutrisinya berada di atas rata-rata hijauan tropis — sangat baik sebagai hijauan utama ransum sapi potong dan kerbau.' },
      { type: 'kelebihan', icon: '✅', text: 'Silase jagung (seluruh tanaman umur 90–105 hari saat biji milky stage) adalah pakan fermentasi berkualitas premium dengan TDN hingga 65% BK dan PK 8–9% BK — cara terbaik memanfaatkan tanaman jagung sepenuhnya sebagai pakan ternak.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein 12% BK tidak cukup untuk sapi perah atau indukan bunting tanpa suplementasi. Daun kering (corn stover pasca panen) hanya memiliki PK 6–7% BK — nilai nutrisinya turun drastis setelah biji dipanen.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum penggemukan sapi: Silase Jagung 40% + Konsentrat (dedak+bungkil) 35% + Indigofera/Gamal 25%. Atau hijauan segar: Daun Jagung 40% + Leguminosa 25% + Rumput Gajah 35%.' },
      { type: 'peringatan', icon: '🚨', text: 'Nitrat dapat terakumulasi tinggi pada daun jagung yang tumbuh di tanah bernitrogen tinggi (pupuk kimia berlebih) atau saat stres kekeringan. Daun layu cepat setelah dipotong — berikan segera atau buat silase.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif di luar musim jagung: Daun Tebu (TDN mirip namun SK lebih tinggi), Rumput Gajah (PK lebih rendah namun stabil sepanjang tahun), atau Silase Jagung yang disimpan dari panen sebelumnya.' },
    ],
  },

  // ── 5. Daun Nanas ───────────────────────────────────────────────────────────
  'daun-nanas': {
    deskripsi: 'Daun tanaman nanas yang merupakan limbah perkebunan nanas tersedia melimpah di Sumatera Selatan, Riau, dan Jawa Barat. Mengandung enzim bromelain dan serat tinggi. Nilai nutrisinya sedang, cocok sebagai pakan sumber serat voluminous untuk sapi dan kerbau.',
    alias: 'Pineapple Leaves, Siwalan Nanas, Ananas Leaves, Daun Ganas',
    asal: 'Amerika Selatan (Brasil–Paraguay); diintroduksi ke Asia oleh bangsa Eropa abad ke-16; sentra perkebunan utama di Indonesia: Subang, Lampung, Palembang, Riau',
    habitat: 'Dataran rendah hingga 800 mdpl; menyukai tanah berdrainase baik, pH 4,5–6,5; toleran kekeringan; tumbuh baik di lahan gambut dangkal',
    umurPanenIdeal: 'Daun tersedia saat panen buah (14–18 bulan setelah tanam) dan saat ratoon crop; limbah daun paling melimpah saat land clearing kebun nanas',
    bagianDimanfaatkan: 'Lamina daun (utama), kulit buah afkir, bonggol buah',
    produksi: '20–35 ton daun segar/ha/siklus; limbah daun sangat melimpah saat replanting',
    kelebihan: 'Sangat berlimpah di sentra perkebunan nanas; biaya pengadaan rendah; bromelain membantu pencernaan protein; dapat dibuat silase; kulit dan bonggol buah juga bernilai sebagai pakan',
    kekurangan: 'Serat kasar tinggi (28% BK) dan NDF tinggi (57% BK) membatasi konsumsi pada ternak kecil; duri halus di tepi daun dapat melukai mulut — perlu pencacahan; bromelain berlebihan dapat mengiritasi saluran cerna; ketersediaan musiman di daerah non-sentra',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 8.5, sk: 28.0, lk: 2.5, abu: 9.0, betn: 52.0,
      tdn: 50, me: 2000,
      ndf: 57.0, adf: 38.0,
      ca: 0.38, p: 0.18, mg: 0.15, na: 0.04, k: 1.20, cl: 0.28, s: 0.12,
      vitamin: 'Vitamin C sedang; Beta-karoten rendah',
      mineral: 'Mineral makro relatif rendah. Suplementasi Ca dan P diperlukan. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 35,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing Besar'],
      programCocok: ['Penggemukan', 'Indukan', 'Pejantan'],
      musimTerbaik: 'Saat panen buah nanas dan saat replanting kebun (tersedia melimpah)',
      umurPanenTerbaik: 'Daun dari tanaman produktif (tidak terlalu tua); hindari daun bawah yang sudah kering',
      catatan: 'Wajib dicacah menggunakan chopper sebelum diberikan untuk menghilangkan duri tepi daun dan meningkatkan konsumsi. Silase dari campuran daun nanas + molases 3% cukup baik. Batasi 35% total ransum. Kulit buah nanas afkir (sangat palatabel) dapat ditambahkan untuk meningkatkan konsumsi.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 350,
      satuan: 'per kg segar',
      supplier: 'Perkebunan nanas / PT Great Giant Pineapple (Lampung) / petani nanas lokal',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Ananas comosus leaves, INRA-CIRAD-AFZ-FAO',
        'Devendra, C. (1992) — Non-conventional Feed Resources in Asia, FAO',
        'Sudirman, et al. (2018) — Pemanfaatan limbah nanas sebagai pakan sapi Bali, JITP',
      ],
      sumberData: 'Feedipedia dan analisis proksimat BALITNAK; nilai pada daun segar saat panen',
      catatan: 'Data komposisi daun nanas relatif terbatas dalam literatur. Nilai menggunakan rata-rata dari sumber Feedipedia dan data BALITNAK Indonesia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun nanas adalah solusi pakan serat voluminous berbiaya rendah untuk peternak sapi di sekitar sentra perkebunan nanas. Dengan TDN 50% BK dan ketersediaan sangat melimpah saat replanting, bahan ini berpotensi besar sebagai pengganti jerami.' },
      { type: 'peringatan', icon: '🚨', text: 'Duri halus di tepi daun nanas WAJIB dihilangkan dengan pencacahan sebelum diberikan. Pemberian daun nanas utuh dapat melukai mulut, lidah, dan saluran pencernaan ternak. Gunakan chopper minimal untuk memotong 2–3 cm.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein hanya 8.5% BK — tidak memadai untuk ternak bunting atau laktasi. NDF 57% BK sangat tinggi, membatasi konsumsi bahan kering pada ternak. Wajib dikombinasikan dengan sumber protein tinggi dan konsentrat energi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum sapi potong: Daun Nanas Cacah 35% + Indigofera/Lamtoro 20% + Dedak Padi 25% + Kulit Buah Nanas 10% + Mineral 10%. Kulit buah nanas meningkatkan palatabilitas dan menambahkan gula fermentable.' },
      { type: 'kelebihan', icon: '✅', text: 'Enzim bromelain dalam daun nanas membantu pemecahan protein di rumen secara alami. Di kebun nanas besar, seluruh biomassa pasca panen (daun + kulit + bonggol) dapat diolah menjadi silase campuran bernilai tinggi.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika daun nanas tidak tersedia: Daun Tebu (profil nutrisi sangat mirip, tersedia luas), atau Jerami Padi yang diamoniasi (NDF serupa, dapat dimodifikasi).' },
    ],
  },

  // ── 6. Daun Talas ───────────────────────────────────────────────────────────
  'daun-talas': {
    deskripsi: 'Daun tanaman talas yang mengandung protein kasar relatif tinggi (20–22% BK) namun mengandung kalsium oksalat (raphides) yang menyebabkan rasa gatal dan iritasi pada mulut jika diberikan segar. Perlu dilayukan atau dimasak sebelum diberikan ke ternak. Populer sebagai pakan kambing di Jawa dan Bali.',
    alias: 'Taro Leaves, Daun Keladi, Daun Bentul (Jawa), Taro Fodder, Colocasia Leaves',
    asal: 'Asia Tenggara dan Asia Selatan; dibudidayakan sejak 7.000 tahun lalu; menjadi tanaman umbi penting di seluruh kepulauan Indonesia dan Pasifik',
    habitat: 'Dataran rendah hingga 2.000 mdpl; menyukai tanah lembab, berdrainase baik; tumbuh di tepian sungai, sawah, dan pekarangan; toleran naungan',
    umurPanenIdeal: 'Daun dapat dipanen mulai umur 3–4 bulan; daun dewasa (posisi 4–8 dari pucuk) paling tinggi nutrisi',
    bagianDimanfaatkan: 'Lamina daun (utama setelah dilayukan), tangkai daun, umbi (utama untuk pangan), kulit umbi',
    produksi: '10–20 ton daun segar/ha/tahun; produksi daun kontinu jika dikelola sebagai tanaman pakan',
    kelebihan: 'Protein kasar cukup tinggi (21% BK); tumbuh liar melimpah di daerah lembab; dapat tumbuh di lahan marginal dan bawah naungan; mudah diperbanyak vegetatif; tidak memerlukan perawatan intensif',
    kekurangan: 'Kalsium oksalat (raphides) menyebabkan iritasi mulut dan saluran cerna — wajib dilayukan 12–24 jam atau direbus sebelum diberikan; tidak boleh diberikan segar dalam jumlah besar; palatabilitas rendah jika diberikan segar',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 16, kadarAir: 84,
      pk: 21.0, sk: 14.0, lk: 4.5, abu: 14.0, betn: 46.5,
      tdn: 63, me: 2520,
      ndf: 36.0, adf: 22.0,
      ca: 2.10, p: 0.42, mg: 0.40, na: 0.06, k: 2.60, cl: 0.50, s: 0.24,
      vitamin: 'Beta-karoten tinggi; Vitamin C; Riboflavin; Vitamin B6',
      mineral: 'Kalsium dan kalium sangat tinggi; kalsium oksalat mengikat sebagian Ca — ketersediaan biologis Ca lebih rendah. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 30,
      targetTernak: ['Kambing', 'Domba', 'Babi', 'Sapi Potong'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      musimTerbaik: 'Sepanjang tahun di daerah lembab; puncak produksi di musim hujan',
      umurPanenTerbaik: 'Daun dewasa (umur 3–4 bulan) yang masih hijau gelap; daun muda lebih tinggi oksalat',
      catatan: 'WAJIB dilayukan minimal 12–24 jam di tempat teduh sebelum diberikan untuk mengurangi kalsium oksalat. Alternatif: rebus atau kukus 15–20 menit. Batasi 30% ransum. Untuk kambing/domba yang sudah terbiasa dapat diberikan lebih banyak.',
    },
    harga: {
      estimasiAI: 350, hargaMarketplace: 500,
      satuan: 'per kg segar',
      supplier: 'Petani talas / pedagang pasar / kebun pekarangan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Colocasia esculenta leaves, INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Sotelo, A. et al. (1995) — Chemical composition of taro (Colocasia esculenta), J. Food Comp. Anal.',
      ],
      sumberData: 'Feedipedia dan Hartadi et al. 1997; nilai pada daun segar setelah dilayukan',
      catatan: 'Kadar kalsium oksalat bervariasi antar kultivar talas. Kultivar untuk konsumsi manusia umumnya lebih rendah oksalat. Analisis selalu berdasarkan bahan kering setelah layuan.',
    },
    aiInsight: [
      { type: 'peringatan', icon: '🚨', text: 'Kalsium oksalat (raphides) dalam daun talas segar menyebabkan rasa terbakar, iritasi mulut, dan edema laring pada ternak jika diberikan dalam jumlah besar. WAJIB dilayukan minimal 12–24 jam atau direbus 15 menit sebelum diberikan.' },
      { type: 'fungsi', icon: '🌿', text: 'Setelah dilayukan, daun talas menjadi pakan bernilai tinggi: PK 21% BK dan TDN 63% BK — setara dengan banyak leguminosa. Sangat baik sebagai suplemen protein untuk kambing dan domba di daerah di mana talas tumbuh berlimpah.' },
      { type: 'kelebihan', icon: '✅', text: 'Tumbuh liar di daerah lembab tanpa perawatan intensif. Dapat tumbuh di bawah naungan kebun lain (agroforestri). SK hanya 14% BK — lebih rendah dari kebanyakan hijauan — sehingga digestibilitasnya tinggi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum kambing: Daun Talas Layu 25% + Rumput 40% + Dedak Padi 25% + Leguminosa 10%. Kandungan beta-karoten tinggi sangat baik untuk reproduksi dan produktivitas indukan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ca 2.1% BK sangat tinggi namun sebagian besar terikat oksalat sehingga ketersediaan biologis lebih rendah. Rasio Ca:P = 5:1 — sangat tinggi; pastikan sumber fosfor cukup dalam ransum untuk mengimbangi.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika kalsium oksalat menjadi kendala: Daun Ubi Jalar (PK serupa, tidak mengandung oksalat, palatabilitas lebih baik) adalah alternatif terbaik dengan nilai nutrisi hampir identik.' },
    ],
  },

  // ── 7. Daun Ubi Jalar ───────────────────────────────────────────────────────
  'daun-ubi-jalar': {
    deskripsi: 'Daun dan sulur tanaman ubi jalar adalah hijauan berkualitas tinggi dengan protein kasar 18–22% BK dan palatabilitas sangat baik. Merupakan salah satu hijauan terbaik dari tanaman pangan — disukai hampir semua jenis ternak. Tidak mengandung antinutrisi berbahaya.',
    alias: 'Sweet Potato Leaves, Daun Ketela Rambat, Kangkung Darat (salah kaprah), Sweet Potato Vine, Ipomea Fodder',
    asal: 'Amerika Selatan (Peru–Ekuador); salah satu tanaman pertanian tertua dunia; kini ditanam luas di seluruh Indonesia terutama di Papua, NTT, dan Jawa',
    habitat: 'Dataran rendah hingga 1.000 mdpl; tumbuh di tanah gembur berpasir; sangat toleran kekeringan; tumbuh subur di musim kemarau dengan sedikit irigasi',
    umurPanenIdeal: 'Sulur dan daun dipanen mulai umur 30 hari; panen rutin setiap 2–3 minggu untuk produksi hijauan berkelanjutan',
    bagianDimanfaatkan: 'Daun dan sulur/batang muda (utama); batang tua lebih keras dan serat tinggi; umbi (untuk pangan/energi ternak)',
    produksi: '10–20 ton hijauan segar/ha/tahun jika dikelola sebagai tanaman hijauan; tersedia dari limbah kebun ubi jalar',
    kelebihan: 'Tidak mengandung antinutrisi berbahaya; palatabilitas sangat baik untuk semua ternak termasuk ternak muda; protein 20% BK cukup tinggi; tumbuh cepat dan dapat dipanen berulang; kaya beta-karoten untuk reproduksi; tidak perlu pengolahan khusus sebelum diberikan',
    kekurangan: 'Kadar air sangat tinggi (82–85%) pada sulur segar — volume pakan besar per kg BK; mudah layu setelah panen jika tidak segera diberikan; ketersediaan musiman bergantung musim tanam ubi jalar; protein tidak setinggi leguminosa pohon',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 16, kadarAir: 84,
      pk: 20.0, sk: 16.0, lk: 4.0, abu: 12.0, betn: 48.0,
      tdn: 65, me: 2600,
      ndf: 38.0, adf: 24.0,
      ca: 1.30, p: 0.35, mg: 0.32, na: 0.06, k: 2.80, cl: 0.45, s: 0.22,
      vitamin: 'Beta-karoten sangat tinggi (varietas oranye: ±9.000 mcg/100g segar); Vitamin C tinggi; Riboflavin; Folat',
      mineral: 'Kalium sangat tinggi (2.8% BK). Ca:P ratio = 3.7:1 — cukup baik. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 50,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Sapi Perah', 'Babi', 'Kelinci'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui', 'Bunting'],
      musimTerbaik: 'Sepanjang tahun; paling melimpah saat musim panen ubi jalar (3–4 bulan setelah tanam)',
      umurPanenTerbaik: 'Sulur umur 30–45 hari (muda, palatabilitas terbaik); panen setiap 2–3 minggu untuk produksi berkelanjutan',
      catatan: 'Dapat diberikan segar langsung tanpa pengolahan khusus. Untuk produksi hijauan berkelanjutan, tanam secara khusus dengan memangkas sulur setiap 2–3 minggu. Sangat baik untuk ternak muda dan indukan bunting/laktasi karena beta-karoten tinggi.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 600,
      satuan: 'per kg segar',
      supplier: 'Petani ubi jalar / pasar tradisional / kebun sendiri',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Ipomoea batatas leaves, INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Nguyen Thi Mui et al. (2001) — Sweet potato as livestock feed in Vietnam. FAO.',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Rev. Ed.',
      ],
      sumberData: 'Feedipedia dan Hartadi et al. 1997; nilai pada sulur/daun segar umur 30–45 hari',
      catatan: 'Beta-karoten sangat bervariasi antar varietas: varietas oranye (Beta Oren, Papua Solossa) jauh lebih tinggi. Semua nilai nutrisi atas dasar BK.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun ubi jalar adalah salah satu hijauan terbaik yang dapat diintegrasikan dengan sistem pertanian pangan. TDN 65% BK dan PK 20% BK dengan palatabilitas sangat baik menjadikannya hijauan multi-purpose terbaik untuk peternak rakyat.' },
      { type: 'kelebihan', icon: '✅', text: 'Tidak ada antinutrisi berbahaya, palatabilitas sangat tinggi (ternak langsung memakannya tanpa perlakukan), dan beta-karoten sangat tinggi untuk reproduksi. Dapat dipanen berulang setiap 2–3 minggu dari tanaman yang sama.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum sempurna untuk kambing laktasi: Daun Ubi Jalar 35% + Rumput Gajah 30% + Indigofera 20% + Dedak Padi 15%. Kandungan beta-karoten tinggi meningkatkan kualitas susu dan fertilitas indukan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kadar air 84% pada sulur segar — ternak perlu mengonsumsi volume sangat besar untuk memenuhi kebutuhan BK. Untuk kambing 30 kg, dibutuhkan ±4–5 kg sulur segar sebagai pakan tunggal. Selalu kombinasikan dengan hijauan kering.' },
      { type: 'peringatan', icon: '🚨', text: 'Kalium sangat tinggi (2.8% BK) — pada ransum yang didominasi daun ubi jalar, perlu monitoring keseimbangan elektrolit. Tidak menjadi masalah pada level normal (≤50% ransum).' },
      { type: 'alternatif', icon: '🔄', text: 'Jika sulur ubi jalar tidak tersedia: Daun Pepaya (PK lebih tinggi 25%, perlu dilayukan) atau Daun Katuk (PK tertinggi 31%, palatabilitas baik) sebagai sumber protein hijauan pengganti.' },
    ],
  },

  // ── 8. Daun Sukun ───────────────────────────────────────────────────────────
  'daun-sukun': {
    deskripsi: 'Daun pohon sukun (breadfruit) yang tersedia melimpah di pekarangan dan kebun campuran. Mengandung protein kasar 13–15% BK dengan serat yang mudah dicerna. Cukup palatabel untuk kambing dan domba. Di Maluku dan Papua dikenal sebagai sumber pakan tradisional ternak.',
    alias: 'Breadfruit Leaves, Daun Timbul (Jawa), Kulu (Maluku), Breadfruit Fodder',
    asal: 'Melanesia (New Guinea dan kepulauan Pasifik); diintroduksi ke seluruh Asia Tenggara; banyak ditanam di pekarangan seluruh Indonesia sebagai pohon pangan multifungsi',
    habitat: 'Dataran rendah tropik hingga 600 mdpl; menyukai tanah subur dan lembab; toleran hujan tinggi; tumbuh baik di iklim pantai tropis',
    umurPanenIdeal: 'Daun dewasa dipanen dari pohon produktif (5+ tahun); daun tersedia sepanjang tahun dari pohon matur',
    bagianDimanfaatkan: 'Lamina daun (utama), daun gugur (pakan serat), buah muda afkir, kulit buah',
    produksi: '5–15 ton daun segar/ha/tahun tergantung populasi pohon; satu pohon menghasilkan 200–800 kg daun/tahun',
    kelebihan: 'Tersedia sepanjang tahun dari pohon matur tanpa biaya tanam ulang; tidak mengandung antinutrisi berbahaya; palatabilitas cukup baik untuk kambing dan domba; pohon tumbuh tanpa perawatan intensif; daun gugur juga dapat dimanfaatkan',
    kekurangan: 'Protein sedang (14% BK) — tidak tinggi untuk hijauan pohon; ketersediaan terbatas di luar daerah penanaman sukun; pohon membutuhkan 5–7 tahun sebelum produksi penuh; tidak sepadat leguminosa dalam kandungan protein',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 23, kadarAir: 77,
      pk: 14.0, sk: 21.0, lk: 3.0, abu: 12.0, betn: 50.0,
      tdn: 58, me: 2320,
      ndf: 46.0, adf: 30.0,
      ca: 1.50, p: 0.28, mg: 0.26, na: 0.06, k: 1.80, cl: 0.32, s: 0.16,
      vitamin: 'Beta-karoten sedang; Vitamin C; Flavonoid',
      mineral: 'Kalsium cukup tinggi; Ca:P ratio = 5.4:1 — perlu suplementasi P. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Kerbau'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Pejantan'],
      musimTerbaik: 'Sepanjang tahun; daun lebih melimpah di musim hujan',
      umurPanenTerbaik: 'Daun dewasa yang masih hijau (tidak terlalu tua/menguning); hindari daun yang sangat muda (keras dan kurang palatabel)',
      catatan: 'Dapat diberikan segar atau dilayukan. Buah sukun muda (afkir atau tidak layak konsumsi manusia) adalah pakan energi yang sangat palatabel untuk kambing dan sapi — dapat diberikan langsung atau dicacah. Kombinasikan daun sukun dengan leguminosa untuk meningkatkan protein ransum.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 450,
      satuan: 'per kg segar',
      supplier: 'Pohon pekarangan / kebun campuran / pedagang pasar lokal (daerah sukun)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Artocarpus altilis leaves, INRA-CIRAD-AFZ-FAO',
        'Devendra, C. (1992) — Non-conventional Feed Resources in Asia, FAO',
        'Sirait, J. et al. (2015) — Potensi hijauan daun pohon, JITV',
      ],
      sumberData: 'Feedipedia; data terbatas — nilai merupakan rata-rata beberapa analisis proksimat',
      catatan: 'Data komposisi daun sukun masih terbatas dalam literatur. Nilai ini adalah estimasi terbaik berdasarkan sumber yang tersedia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun sukun adalah hijauan pohon pekarangan yang sangat berharga di kepulauan Indonesia. Dengan TDN 58% BK dan PK 14% BK, cocok sebagai hijauan suplemen dalam ransum berbasis rumput untuk kambing dan domba.' },
      { type: 'kelebihan', icon: '✅', text: 'Pohon sukun produktif selama 30–50 tahun tanpa perlu penanaman ulang — investasi sekali untuk suplai pakan jangka panjang. Buah sukun muda yang tidak laku dijual adalah pakan energi berkualitas tinggi (TDN 65% BK).' },
      { type: 'kekurangan', icon: '⚠️', text: 'Rasio Ca:P sangat tidak seimbang (5.4:1). Pastikan sumber fosfor (dedak, bungkil, fosfat dikalsium) tersedia dalam ransum agar utilisasi kalsium optimal dan ternak tidak mengalami defisiensi P.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum kambing: Daun Sukun 30% + Rumput Lokal 35% + Indigofera/Gamal 25% + Dedak Padi 10%. Tambahkan mineral mix yang mengandung fosfor tinggi untuk menyeimbangkan rasio Ca:P.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan mengambil semua daun dari satu pohon sekaligus — sisakan minimal 50% daun untuk fotosintesis pohon. Pemangkasan berlebihan melemahkan pohon dan mengurangi produksi buah untuk musim berikutnya.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif dengan protein lebih tinggi: Daun Sengon (PK 24% BK) atau Daun Katuk (PK 31% BK) jika tersedia. Untuk sumber energi dari buah: Buah Pisang afkir memiliki palatabilitas lebih tinggi.' },
    ],
  },

  // ── 9. Daun Katuk ───────────────────────────────────────────────────────────
  'daun-katuk': {
    deskripsi: 'Daun katuk adalah hijauan daun dengan kandungan protein kasar tertinggi di antara daun non-leguminosa yang umum (28–34% BK). Selain itu mengandung senyawa laktagogum (pelancar ASI) yang juga meningkatkan produksi susu pada ternak perah. Palatabilitas baik dan dapat diberikan segar tanpa pengolahan.',
    alias: 'Star Gooseberry Leaves, Katuk, Chekkurmanis (India), Cekur Manis (Malaysia), Sauropus Leaves',
    asal: 'Asia Tenggara; dibudidayakan luas di Indonesia, Malaysia, dan Thailand; di Indonesia banyak ditanam di Jawa, Bali, dan Sumatera sebagai sayuran dan tanaman pagar',
    habitat: 'Dataran rendah hingga 1.300 mdpl; tumbuh baik di tanah subur, semi-naungan; toleran kekeringan sedang; menyukai tanah gembur dengan drainase baik',
    umurPanenIdeal: 'Pucuk dan daun muda dipanen mulai umur 2–3 bulan; panen rutin setiap 2–4 minggu setelah pemangkasan',
    bagianDimanfaatkan: 'Daun dan pucuk (utama); batang muda; seluruh bagian aerial',
    produksi: '8–15 ton hijauan segar/ha/tahun jika ditanam intensif; panen rutin meningkatkan produktivitas',
    kelebihan: 'Protein kasar tertinggi di antara daun non-leguminosa (31% BK); mengandung papaverine yang bersifat laktagogum — meningkatkan produksi susu 10–25%; palatabilitas baik; dapat diberikan segar; kaya zat besi, kalsium, dan beta-karoten',
    kekurangan: 'Mengandung papaverine dan alkaloid lain yang berpotensi toksik jika dikonsumsi berlebihan (>30% ransum dalam jangka panjang); terbatas ketersediaannya di luar daerah penanaman; harga relatif lebih tinggi dari hijauan lain',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 31.0, sk: 12.0, lk: 8.0, abu: 12.0, betn: 37.0,
      tdn: 68, me: 2720,
      ndf: 30.0, adf: 20.0,
      ca: 1.40, p: 0.46, mg: 0.38, na: 0.08, k: 2.20, cl: 0.40, s: 0.30,
      vitamin: 'Beta-karoten sangat tinggi (±6.400 mcg/100g segar); Vitamin C sangat tinggi (±200 mg/100g segar); Zat besi tinggi (±5 mg/100g segar); Vitamin E',
      mineral: 'Zat besi dan kalsium sangat tinggi. Rasio Ca:P = 3:1 — cukup baik. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 25,
      targetTernak: ['Kambing Perah', 'Sapi Perah', 'Domba', 'Kambing Potong'],
      programCocok: ['Menyusui', 'Indukan', 'Grower', 'Bunting'],
      musimTerbaik: 'Sepanjang tahun; produksi meningkat di musim hujan',
      umurPanenTerbaik: 'Pucuk dan daun muda 2–4 minggu setelah pemangkasan terakhir',
      catatan: 'Batasi pemberian maksimal 25% dari total ransum — jangan jadikan pakan tunggal karena kandungan papaverine. Sangat dianjurkan untuk indukan laktasi: 15–20% ransum meningkatkan produksi susu secara signifikan. Dapat diberikan segar tanpa perlu pelayuan.',
    },
    harga: {
      estimasiAI: 1500, hargaMarketplace: 2500,
      satuan: 'per kg segar',
      supplier: 'Petani sayuran / pasar tradisional / penanaman kebun sendiri',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Sauropus androgynus, INRA-CIRAD-AFZ-FAO',
        'Santoso, U. & Fenita, Y. (2016) — Effect of Sauropus androgynus leaf extract on performance and milk production, Pak. J. Biol. Sci.',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Sirait, J. et al. (2015) — Potensi hijauan daun, JITV',
      ],
      sumberData: 'Feedipedia dan Hartadi et al. 1997; nilai pada daun segar',
      catatan: 'Kandungan papaverine (alkaloid) sangat bervariasi antar individu tanaman. Dosis aman: ≤25% ransum. Pada manusia, konsumsi berlebihan menyebabkan bronkiolitis — pada ternak belum ada laporan masalah pada dosis ≤25%.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun katuk adalah "superfood" hijauan pakan — PK 31% BK adalah yang tertinggi di antara semua daun non-leguminosa yang umum di Indonesia. Satu-satunya hijauan yang secara aktif meningkatkan produksi susu (laktagogum papaverine) sambil menyumbangkan protein tinggi.' },
      { type: 'kelebihan', icon: '✅', text: 'Kandungan beta-karoten sangat tinggi (6.400 mcg/100g) + vitamin C tinggi + zat besi tinggi menjadikan daun katuk suplemen nutrisi premium untuk indukan laktasi. Studi menunjukkan peningkatan produksi susu kambing 10–25% dengan suplementasi 15–20% ransum.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan melebihi 25% ransum dalam jangka panjang. Papaverine dan alkaloid lain pada konsentrasi tinggi berpotensi mengganggu sistem pernapasan pada hewan yang sangat sensitif. Pada dosis normal (15–20% ransum) aman untuk semua ternak.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula optimal untuk kambing/sapi perah: Daun Katuk 15–20% + Rumput Gajah 40% + Indigofera 20% + Konsentrat 20–25%. Hasilkan produksi susu maksimal dengan biaya pakan optimal.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga jauh lebih mahal dari hijauan lain (Rp 1.500–2.500/kg). Jika digunakan hanya untuk produksi susu, lakukan cost-benefit analysis: apakah peningkatan produksi susu membenarkan biaya tambahan dibanding leguminosa lain?' },
      { type: 'alternatif', icon: '🔄', text: 'Jika daun katuk terlalu mahal: Indigofera (PK 27–29% BK, lebih murah, produksi masif) atau Daun Ubi Jalar (PK 20% BK, tersedia melimpah, sangat palatabel) sebagai pengganti sumber protein hijauan.' },
    ],
  },

  // ── 10. Daun Waru ───────────────────────────────────────────────────────────
  'daun-waru': {
    deskripsi: 'Daun pohon waru yang tumbuh liar di pesisir dan pinggir jalan. Mengandung protein cukup (17% BK) dan palatabilitas sedang untuk kambing. Sering dijadikan pakan alternatif saat hijauan lain kurang tersedia. Mucilago (lendir) alami dalam daun waru membantu fungsi gastrointestinal.',
    alias: 'Sea Hibiscus Leaves, Daun Baru (Sunda), Whau (Polinesia), Coastal Hibiscus Fodder',
    asal: 'Asia Tropis dan Pasifik; tumbuh liar di seluruh Indonesia terutama di pesisir, tepi sungai, dan pinggir jalan; banyak ditanam sebagai tanaman peneduh',
    habitat: 'Dataran rendah hingga 500 mdpl; tumbuh di tanah lembab hingga tanah kering; sangat toleran terhadap salinitas ringan; tumbuh liar di sepanjang pantai tropis',
    umurPanenIdeal: 'Daun muda hingga dewasa tersedia sepanjang tahun; pemangkasan dapat dilakukan setiap 4–6 minggu',
    bagianDimanfaatkan: 'Daun (utama), kulit kayu muda (berserat tinggi), bunga (palatabel tinggi)',
    produksi: 'Tersedia dari pohon liar tanpa biaya tanam; satu pohon dewasa menghasilkan 50–150 kg daun segar/tahun',
    kelebihan: 'Tumbuh liar melimpah di pesisir tanpa biaya apapun; tersedia sepanjang tahun; mucilago membantu melindungi dinding saluran pencernaan; toleran kondisi salin ringan; bunga sangat palatabel',
    kekurangan: 'Protein sedang (17% BK) — tidak tinggi; palatabilitas sedang sehingga perlu adaptasi ternak; serat kasarnya cukup tinggi (23% BK); nilai TDN hanya 55% BK; distribusi tidak merata (terutama di daerah pesisir)',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 17.0, sk: 23.0, lk: 3.5, abu: 12.5, betn: 44.0,
      tdn: 55, me: 2200,
      ndf: 48.0, adf: 33.0,
      ca: 2.00, p: 0.30, mg: 0.35, na: 0.15, k: 2.10, cl: 0.45, s: 0.20,
      vitamin: 'Beta-karoten sedang; Vitamin C; Quercetin (flavonoid)',
      mineral: 'Kalsium sangat tinggi (2% BK); Ca:P = 6.7:1 — sangat tinggi, wajib suplementasi P. Natrium relatif tinggi (pesisir). Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 35,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Kerbau'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      musimTerbaik: 'Sepanjang tahun; lebih melimpah di musim hujan',
      umurPanenTerbaik: 'Daun muda hingga dewasa yang masih hijau; hindari daun yang sangat tua dan keras',
      catatan: 'Perkenalkan secara bertahap jika ternak belum pernah memakannya. Kombinasikan dengan hijauan yang lebih palatabel. Bunga waru jika tersedia sangat disukai ternak. Ca:P sangat tidak seimbang — wajib tambahkan sumber fosfor (dedak/fosfat dikalsium) dalam ransum.',
    },
    harga: {
      estimasiAI: 0, hargaMarketplace: 200,
      satuan: 'per kg segar (umumnya gratis dari pohon liar)',
      supplier: 'Pohon liar pesisir / pinggir jalan / kebun pekarangan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Hibiscus tiliaceus leaves, INRA-CIRAD-AFZ-FAO',
        'Devendra, C. (1992) — Non-conventional Feed Resources in Asia, FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia; data terbatas — nilai rata-rata beberapa sumber',
      catatan: 'Data komposisi daun waru sangat terbatas dalam literatur ilmiah. Nilai merupakan estimasi terbaik dari sumber tersedia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun waru adalah pakan "gratis" terbaik di wilayah pesisir Indonesia. Meskipun nilai nutrisinya sedang (TDN 55%, PK 17% BK), ketersediaan tanpa biaya menjadikannya solusi pakan darurat atau suplemen serat yang sangat ekonomis.' },
      { type: 'peringatan', icon: '🚨', text: 'Ca:P ratio 6.7:1 sangat tidak seimbang — pemberian daun waru dalam porsi besar tanpa suplementasi fosfor dapat menyebabkan defisiensi P kronis, yang berdampak pada reproduksi, pertumbuhan tulang, dan nafsu makan ternak.' },
      { type: 'kelebihan', icon: '✅', text: 'Mucilago alami dalam daun waru berfungsi sebagai pelindung mukosa saluran cerna — berguna pada ternak yang mengalami diare ringan atau iritasi GI. Bunga waru juga sangat palatabel dan dapat digunakan sebagai "umpan" untuk meningkatkan konsumsi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum pesisir: Daun Waru 25% + Daun Pisang 20% + Indigofera/Gamal 30% + Dedak Padi 25% + Fosfat Dikalsium 50g/ekor/hari. Tambahkan mineral mix khusus untuk wilayah pesisir (Na tinggi — batasi NaCl tambahan).' },
      { type: 'kekurangan', icon: '⚠️', text: 'Palatabilitas sedang — beberapa ternak menolak daun waru pada awalnya, terutama jika bukan bagian dari pakan rutin. Adaptasi bertahap (tambahkan 5–10% per minggu) diperlukan untuk membiasakan ternak.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika palatabilitas menjadi kendala: campurkan daun waru dengan molases encer atau daun yang lebih palatabel (daun pisang/ubi jalar) dalam perbandingan 1:2 untuk meningkatkan konsumsi ternak.' },
    ],
  },

  // ── 11. Daun Randu ──────────────────────────────────────────────────────────
  'daun-randu': {
    deskripsi: 'Daun pohon randu (kapuk) yang merupakan hijauan pakan tradisional untuk kambing di Jawa. Pohon randu ditanam luas di Jawa Tengah dan Jawa Timur untuk serat kapuk. Daun tersedia melimpah terutama saat musim gugur daun. Kandungan protein cukup baik (16% BK).',
    alias: 'Kapok Tree Leaves, Daun Kapuk, Java Kapok Leaves, Silk Cotton Tree Fodder',
    asal: 'Amerika Tropis (Meksiko); diintroduksi ke Asia oleh bangsa Eropa; sentra perkebunan randu di Jawa: Pati, Rembang, Tuban, dan Bojonegoro',
    habitat: 'Dataran rendah hingga 800 mdpl; tumbuh di tanah berpasir hingga lempung; toleran kekeringan dan tanah miskin; tumbuh liar di tepi jalan dan desa',
    umurPanenIdeal: 'Daun muda tersedia musim hujan; gugur daun terjadi saat musim kemarau panjang — perlu dipanen sebelum gugur',
    bagianDimanfaatkan: 'Daun muda dan setengah dewasa (utama); daun tua lebih keras dan serat tinggi; buah muda (afkir)',
    produksi: 'Satu pohon dewasa: 200–500 kg daun segar/tahun; pohon randu ditanam dengan populasi tinggi di Jawa Tengah',
    kelebihan: 'Tersedia melimpah di daerah sentra randu; tidak mengandung antinutrisi berbahaya signifikan; pohon multifungsi (kapuk, kayu, pakan); palatabilitas baik untuk kambing dan domba; dapat dimanfaatkan sebagai pakan bank',
    kekurangan: 'Ketersediaan musiman (gugur saat kemarau justru saat pakan langka); daun tua keras dan serat tinggi; protein 16% BK tidak tinggi; pohon berduri saat muda menyulitkan pemanenan; siklus produksi bergantung musim hujan',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 24, kadarAir: 76,
      pk: 16.0, sk: 21.0, lk: 3.5, abu: 10.0, betn: 49.5,
      tdn: 57, me: 2280,
      ndf: 44.0, adf: 30.0,
      ca: 1.20, p: 0.28, mg: 0.24, na: 0.06, k: 1.60, cl: 0.30, s: 0.18,
      vitamin: 'Beta-karoten sedang; Vitamin E; Flavonoid',
      mineral: 'Profil mineral cukup seimbang. Ca:P = 4.3:1 — perlu sedikit suplementasi P. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Kerbau'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      musimTerbaik: 'Musim hujan (daun muda melimpah); awal kemarau (sebelum daun gugur)',
      umurPanenTerbaik: 'Daun muda dan setengah dewasa — lebih lunak, lebih palatabel, dan lebih tinggi protein',
      catatan: 'Panen sebelum daun gugur untuk memaksimalkan manfaat. Daun kering yang gugur dapat dikumpulkan sebagai pakan serat cadangan. Pohon randu muda berduri — gunakan alat pelindung saat memanen. Kombinasikan dengan leguminosa untuk melengkapi protein.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 350,
      satuan: 'per kg segar',
      supplier: 'Pohon kebun sendiri / perkebunan randu Jawa / petani kapuk',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Ceiba pentandra leaves, INRA-CIRAD-AFZ-FAO',
        'Devendra, C. (1992) — Non-conventional Feed Resources in Asia, FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia dan Hartadi et al. 1997; nilai estimasi berdasarkan data terbatas',
      catatan: 'Data nutrisi daun randu sangat terbatas dalam literatur internasional. Nilai merupakan estimasi terbaik dari sumber tersedia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun randu adalah pakan tradisional kambing di Jawa Tengah yang telah digunakan selama berabad-abad. PK 16% BK dan TDN 57% BK cukup baik untuk ransum pemeliharaan — biaya pengadaan mendekati nol dari pohon kebun sendiri.' },
      { type: 'kelebihan', icon: '✅', text: 'Pohon randu sangat tahan banting, tumbuh di lahan kering dan miskin tanpa perawatan. Di sentra kapuk Jawa, peternak mendapatkan pakan gratis dari pohon sendiri sambil mendapat pendapatan dari serat kapuk.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Musim gugur daun randu sering bertepatan dengan musim kemarau ketika pakan langka. Daun gugur kehilangan nilai nutrisi dan menjadi kering — perlu dipanen sebelum gugur dan disimpan sebagai hay atau silase.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum kambing khas Jawa: Daun Randu 30% + Jerami Padi Amoniasi 30% + Indigofera/Turi 25% + Dedak Padi 15%. Tambahkan molases 50–100 mL/ekor/hari untuk meningkatkan palatabilitas ransum berbasis jerami.' },
      { type: 'peringatan', icon: '🚨', text: 'Daun randu muda dari pohon dengan banyak duri mengandung getah yang dapat menyebabkan iritasi ringan jika diberikan terlalu banyak dalam kondisi segar. Layukan 4–6 jam atau berikan bersama hijauan lain.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika daun randu tidak tersedia di luar musim: Daun Sukun (palatabilitas lebih baik, PK serupa) atau Daun Pisang (lebih mudah didapat) sebagai pengganti di musim kemarau.' },
    ],
  },

  // ── 12. Daun Bambu ──────────────────────────────────────────────────────────
  'daun-bambu': {
    deskripsi: 'Daun berbagai jenis bambu yang tumbuh liar melimpah di Indonesia. Meskipun serat kasarnya sangat tinggi (33% BK) dan NDF 64% BK, protein kasarnya cukup mengejutkan — 16% BK. Digunakan sebagai pakan darurat atau pakan sumber serat untuk sapi dan kerbau terutama di musim kemarau.',
    alias: 'Bamboo Leaves, Daun Pring (Jawa), Folha de Bambu, Bamboo Fodder',
    asal: 'Asia Timur dan Asia Tenggara; bambu tumbuh liar dan dibudidayakan di seluruh Indonesia — melimpah di Jawa, Kalimantan, Sulawesi, dan Sumatera',
    habitat: 'Dataran rendah hingga 3.000 mdpl; tumbuh di berbagai jenis tanah termasuk tanah marginal; toleran kekeringan, banjir singkat, dan lereng curam; rumpun bambu sering ditemukan di pinggir sungai dan perbukitan',
    umurPanenIdeal: 'Daun tersedia sepanjang tahun; daun muda lebih tinggi protein; pemangkasan ranting dapat dilakukan setiap 2–3 bulan',
    bagianDimanfaatkan: 'Daun (utama), rebung bambu (tinggi protein, palatabel), ranting muda',
    produksi: 'Sangat melimpah sebagai bahan liar; satu rumpun bambu menghasilkan 50–200 kg daun/tahun',
    kelebihan: 'Sangat tersedia dan gratis di hampir seluruh wilayah Indonesia; protein 16% BK cukup baik untuk hijauan pohon; rebung bambu muda sangat palatabel dan bergizi; pohon bambu tidak perlu perawatan; tidak ada antinutrisi berbahaya signifikan',
    kekurangan: 'Serat kasar sangat tinggi (33% BK) dan NDF 64% BK — salah satu tertinggi di antara hijauan daun, membatasi konsumsi dan digestibilitas; silika tinggi abrasif untuk gigi; palatabilitas rendah dibanding hijauan lunak; daun keras dan sulit dicerna oleh ternak kecil',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 35, kadarAir: 65,
      pk: 16.0, sk: 33.0, lk: 3.5, abu: 10.0, betn: 37.5,
      tdn: 50, me: 2000,
      ndf: 64.0, adf: 45.0,
      ca: 0.28, p: 0.20, mg: 0.12, na: 0.03, k: 0.90, cl: 0.20, s: 0.14,
      vitamin: 'Beta-karoten rendah; Thiamin; Riboflavin',
      mineral: 'Silika tinggi (>2% BK) — abrasif. Mineral makro rendah. Suplementasi Ca, P, dan mineral wajib. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing Besar'],
      programCocok: ['Indukan', 'Pejantan'],
      musimTerbaik: 'Sepanjang tahun; paling berguna saat musim kemarau ketika hijauan lain langka',
      umurPanenTerbaik: 'Daun muda (2–4 minggu setelah tunas) lebih lunak dan palatabel; daun tua lebih keras dan serat lebih tinggi',
      catatan: 'Gunakan sebagai pakan darurat saat hijauan utama langka. Cacah sebelum diberikan untuk meningkatkan konsumsi. Jangan jadikan pakan utama tunggal — hanya suplemen serat. Rebung bambu yang sangat muda (sebelum keras) jauh lebih palatabel dan bergizi dari daunnya.',
    },
    harga: {
      estimasiAI: 0, hargaMarketplace: 150,
      satuan: 'per kg segar (umumnya gratis)',
      supplier: 'Rumpun bambu liar / kebun bambu / hutan bambu',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Bambusa spp. leaves, INRA-CIRAD-AFZ-FAO',
        'Devendra, C. (1992) — Non-conventional Feed Resources, FAO',
        'Dransfield, S. & Widjaja, E.A. (1995) — Plant Resources of South-East Asia: Bamboos, Prosea',
      ],
      sumberData: 'Feedipedia; nilai bervariasi antar spesies bambu (Bambusa vulgaris, B. bambos, Dendrocalamus asper)',
      catatan: 'Komposisi nutrisi sangat bervariasi antar spesies bambu dan umur daun. Dendrocalamus asper (bambu petung) umumnya lebih baik nutrisinya dari Bambusa vulgaris (bambu ori).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun bambu adalah pakan "last resort" yang sangat berguna saat krisis hijauan di musim kemarau. Dengan protein 16% BK yang mengejutkan dan ketersediaan melimpah gratis, ini adalah jaring pengaman pakan yang penting bagi peternak sapi.' },
      { type: 'peringatan', icon: '🚨', text: 'NDF 64% dan silika >2% BK sangat tinggi — jangan jadikan pakan utama. Konsumsi daun bambu berlebihan jangka panjang menyebabkan keausan gigi serius dan defisiensi mineral karena silika mengikat mineral. Batasi ≤30% ransum.' },
      { type: 'kelebihan', icon: '✅', text: 'Di era climate change dengan musim kemarau makin panjang, rumpun bambu yang tidak pernah mati meski kekeringan ekstrem menjadi "tabungan hijauan" yang sangat berharga. Rebung bambu muda (sebelum keras) jauh lebih palatabel dan bergizi — manfaatkan juga.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum darurat musim kemarau: Daun Bambu Cacah 25% + Jerami Padi Amoniasi 40% + Konsentrat (dedak+bungkil) 25% + Mineral 10%. Tambahkan 100–150 mL molases/ekor/hari untuk meningkatkan konsumsi dan energi fermentable.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Palatabilitas rendah pada daun tua — ternak sering menolak jika ada pilihan lain. Selalu campur dengan hijauan yang lebih palatabel (molases, daun pisang, ampas singkong) untuk meningkatkan penerimaan ternak.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika tersedia: Jerami Padi Amoniasi (NDF serupa namun lebih mudah dimodifikasi dan lebih palatabel) atau Silase Jagung (jauh lebih baik nutrisinya) sebagai pengganti pakan serat musim kemarau.' },
    ],
  },

  // ── 13. Daun Sengon ─────────────────────────────────────────────────────────
  'daun-sengon': {
    deskripsi: 'Daun pohon sengon (albasia) adalah hijauan protein tinggi yang tersedia dari pohon kayu cepat tumbuh terpopuler di Jawa dan Sumatera. Protein kasar 22–26% BK menjadikannya setara leguminosa. Palatabilitas baik untuk kambing dan sapi. Tersedia melimpah di daerah perkebunan sengon.',
    alias: 'Batai Leaves, Albasia, Sengon Laut, Falcata Fodder, Moluccan Albizia Leaves',
    asal: 'Maluku dan New Guinea; diintroduksi dan dibudidayakan luas di seluruh Jawa, Sumatera, dan Kalimantan sebagai pohon kayu komersial cepat tumbuh',
    habitat: 'Dataran rendah hingga 1.200 mdpl; tumbuh sangat cepat (5–7 m/tahun); menyukai tanah lembab dan subur; toleran naungan; populer sebagai pohon reboisasi dan agroforestri',
    umurPanenIdeal: 'Daun tersedia dari pohon umur 1 tahun ke atas; pemangkasan ranting setiap 2–3 bulan pada sistem silvopastura',
    bagianDimanfaatkan: 'Daun muda dan dewasa (utama), ranting muda (< 5 mm diameter), kulit kayu muda',
    produksi: '5–15 ton daun segar/ha/tahun dalam sistem agroforestri; sangat melimpah dari limbah penjarangan dan pemangkasan',
    kelebihan: 'Protein kasar sangat tinggi (24% BK) — setara leguminosa; tersedia sangat melimpah di daerah sentra sengon; palatabilitas baik; pohon tumbuh sangat cepat (3–5 tahun panen kayu) sehingga limbah daun juga cepat tersedia; tidak ada laporan antinutrisi berbahaya signifikan',
    kekurangan: 'Ketersediaan terbatas di luar daerah perkebunan sengon; pohon sengon sangat cepat tumbuh sehingga dalam 2–3 bulan tanpa pemangkasan daun menjadi terlalu tinggi untuk dipanen; beberapa ternak perlu adaptasi terhadap rasa daun sengon muda yang sedikit sepat',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 25, kadarAir: 75,
      pk: 24.0, sk: 18.0, lk: 5.0, abu: 8.0, betn: 45.0,
      tdn: 62, me: 2480,
      ndf: 40.0, adf: 26.0,
      ca: 1.10, p: 0.35, mg: 0.30, na: 0.06, k: 1.40, cl: 0.28, s: 0.22,
      vitamin: 'Beta-karoten sedang; Vitamin E; Flavonoid',
      mineral: 'Profil mineral cukup baik untuk hijauan daun pohon. Ca:P = 3.1:1. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Sapi Perah'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      musimTerbaik: 'Sepanjang tahun; paling melimpah saat musim hujan dan saat pemangkasan kebun',
      umurPanenTerbaik: 'Daun muda hingga dewasa (ranting umur < 3 bulan setelah pemangkasan) — daun terlalu tua lebih keras',
      catatan: 'Perkenalkan secara bertahap (adaptasi 7–10 hari) jika ternak baru pertama kali menerima daun sengon. Sangat cocok untuk sistem silvopastura: tanam sengon sebagai batas ladang sambil memanen daun rutin tiap 2–3 bulan. Protein 24% BK membuatnya bisa menggantikan sebagian konsentrat protein.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 500,
      satuan: 'per kg segar',
      supplier: 'Kebun sengon / perkebunan kayu / petani agroforestri',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Falcataria moluccana leaves, INRA-CIRAD-AFZ-FAO',
        'Sirait, J. et al. (2015) — Potensi hijauan daun pohon dalam sistem silvopastura, JITV',
        'Devendra, C. (1992) — Non-conventional Feed Resources in Asia, FAO',
      ],
      sumberData: 'Feedipedia dan JITV; nilai pada daun segar dari pohon umur 2–5 tahun',
      catatan: 'Data nutrisi daun sengon terbatas. Nilai merupakan rata-rata dari beberapa sumber dengan variabilitas cukup tinggi tergantung kondisi tanah dan iklim.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun sengon adalah temuan berharga bagi peternak di sentra kayu sengon Jawa — PK 24% BK setara leguminosa unggul. Sistem silvopastura sengon (kayu + pakan ternak) adalah integrasi terbaik antara usaha kayu dan peternakan.' },
      { type: 'kelebihan', icon: '✅', text: 'Pohon sengon tumbuh 5–7 m/tahun — produksi daun meningkat eksponensial setiap tahun. Peternak yang menanami lahannya dengan sengon mendapat double benefit: pendapatan kayu 5–7 tahun sekali + pakan ternak gratis setiap 2–3 bulan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum sapi perah berbasis daun sengon: Daun Sengon 30% + Rumput Gajah 40% + Daun Katuk 10% + Konsentrat 20%. Target produksi susu 8–12 liter/hari sangat realistis dengan formula protein tinggi ini.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Pohon sengon sangat cepat tumbuh — dalam 3 bulan tanpa pemangkasan, daun berada di ketinggian >3 m dan sulit dipanen tanpa alat. Rencanakan sistem pemangkasan rutin (pollarding) agar daun selalu tersedia di ketinggian yang dapat dipanen.' },
      { type: 'peringatan', icon: '🚨', text: 'Perkenalkan secara bertahap kepada ternak yang belum pernah menerima daun sengon. Rasa sedikit sepat pada daun muda dapat menyebabkan penolakan jika langsung diberikan dalam porsi besar. Adaptasi 7–14 hari biasanya sudah cukup.' },
      { type: 'alternatif', icon: '🔄', text: 'Daun pohon kayu protein tinggi lainnya: Daun Gamal (Gliricidia, PK 18–22% BK), Daun Lamtoro (PK 20–25% BK), atau Daun Kaliandra (PK 20–23% BK) — semua tersedia sebagai leguminosa pohon yang telah teruji.' },
    ],
  },

  // ── 14. Daun Jati ───────────────────────────────────────────────────────────
  'daun-jati': {
    deskripsi: 'Daun pohon jati yang tersedia melimpah di kawasan hutan jati Jawa, Madura, dan NTT. Mengandung protein sedang (10% BK) dan tannin terkondensat yang membatasi palatabilitas dan digestibilitas. Digunakan sebagai pakan darurat musim kemarau karena jati gugur daun secara alami saat kemarau.',
    alias: 'Teak Leaves, Daun Jati Belanda, Tectona Fodder, Teak Tree Leaves',
    asal: 'Asia Tenggara daratan (Myanmar, Thailand, India); diintroduksi dan dibudidayakan luas di Jawa oleh Belanda; sekarang menguasai sekitar 1,2 juta ha hutan produksi di Jawa',
    habitat: 'Dataran rendah hingga 700 mdpl; tumbuh optimal di iklim monsunal dengan musim kemarau jelas; menyukai tanah berdrainase baik; gugur daun saat kemarau',
    umurPanenIdeal: 'Daun hijau tersedia saat musim hujan (Nov–Apr); daun gugur saat kemarau — kumpulkan sebelum membusuk',
    bagianDimanfaatkan: 'Daun hijau muda (April–Oktober, tertinggi nutrisi), daun gugur kering (nilai lebih rendah), ranting muda',
    produksi: 'Sangat melimpah dari hutan jati Jawa; daun gugur berlimpah saat kemarau di kawasan hutan jati',
    kelebihan: 'Sangat melimpah di kawasan hutan jati (Blora, Grobogan, Ngawi, NTT); tanin terkondensat bermanfaat untuk menurunkan parasit GI pada ternak kecil; biaya pengadaan nol dari hutan rakyat; daun gugur dapat dikumpulkan dan dikeringkan sebagai hay darurat',
    kekurangan: 'Tanin tinggi (>4% BK) menurunkan palatabilitas dan digestibilitas protein secara signifikan; protein hanya 10% BK; TDN hanya 48% BK — terendah di antara daun yang dikaji; gugur daun justru terjadi saat musim kemarau ketika pakan langka; daun sangat besar dan keras saat dewasa',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 30, kadarAir: 70,
      pk: 10.0, sk: 31.0, lk: 3.0, abu: 12.0, betn: 44.0,
      tdn: 48, me: 1920,
      ndf: 58.0, adf: 42.0,
      ca: 1.80, p: 0.22, mg: 0.28, na: 0.05, k: 1.20, cl: 0.25, s: 0.16,
      vitamin: 'Beta-karoten rendah–sedang; Vitamin C rendah',
      mineral: 'Kalsium tinggi; Ca:P = 8.2:1 — sangat tidak seimbang. Wajib suplementasi P intensif. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing Dewasa'],
      programCocok: ['Indukan', 'Pejantan'],
      musimTerbaik: 'Awal musim hujan (daun muda terbaik); musim kemarau hanya sebagai pakan darurat dari daun gugur',
      umurPanenTerbaik: 'Daun muda (April–Mei saat flush daun baru) — palatabilitas dan nutrisi paling baik; hindari daun tua yang keras dan sangat tanin',
      catatan: 'Gunakan HANYA sebagai pakan darurat atau suplemen serat saat tidak ada pilihan lain. Batasi ≤25% ransum. Daun muda (April–Mei) jauh lebih baik dari daun tua/gugur. Suplementasi fosfor wajib karena Ca:P sangat tidak seimbang. Cacah daun besar sebelum diberikan.',
    },
    harga: {
      estimasiAI: 0, hargaMarketplace: 150,
      satuan: 'per kg (umumnya gratis dari hutan rakyat)',
      supplier: 'Kawasan hutan jati / Perhutani / hutan rakyat Jawa',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Tectona grandis leaves, INRA-CIRAD-AFZ-FAO',
        'Devendra, C. (1992) — Non-conventional Feed Resources, FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia dan Hartadi et al. 1997',
      catatan: 'Kandungan tanin bervariasi signifikan antara daun muda (April–Mei) dan daun tua. Daun muda bisa 3–4x lebih rendah tanin dari daun tua.',
    },
    aiInsight: [
      { type: 'peringatan', icon: '🚨', text: 'Tanin terkondensat >4% BK pada daun jati tua secara signifikan mengikat protein pakan di rumen (bypass negatif) dan menurunkan konsumsi. Daun jati BUKAN pilihan baik sebagai pakan utama — hanya untuk darurat. Daun muda April–Mei jauh lebih baik.' },
      { type: 'fungsi', icon: '🌿', text: 'Daun jati paling berguna sebagai pakan anti-parasit darurat. Tanin terkondensat memiliki efek anthelmintik alami — pemberian terbatas (15–20% ransum) membantu mengendalikan cacing saluran cerna terutama pada kambing dan domba.' },
      { type: 'kekurangan', icon: '⚠️', text: 'TDN hanya 48% BK dan Ca:P 8.2:1 — kombinasi terburuk. Jika menggunakan daun jati bahkan sebagai pakan darurat, wajib tambahkan konsentrat energi DAN fosfor secara agresif untuk mencegah defisiensi ganda.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum darurat: Daun Jati Muda 20% + Jerami Padi Amoniasi 35% + Konsentrat Energi 30% + Leguminosa 15% + Fosfat Dikalsium 3g/100kg bobot badan/hari. Molases wajib untuk menutupi rasa tanin.' },
      { type: 'kelebihan', icon: '✅', text: 'Di kawasan hutan jati, daun gugur musim kemarau adalah cadangan pakan nol-biaya yang penting. Dikumpulkan, dikeringkan, dan disimpan sebagai hay kering, daun jati bisa menjembatani periode pakan langka terpendek.' },
      { type: 'alternatif', icon: '🔄', text: 'Segera beralih ke alternatif yang lebih baik begitu tersedia: Daun Pisang, Jerami Padi Amoniasi, atau konsentrat lokal. Daun jati hanya untuk kondisi benar-benar darurat tanpa pilihan lain.' },
    ],
  },

  // ── 15. Daun Mahoni ─────────────────────────────────────────────────────────
  'daun-mahoni': {
    deskripsi: 'Daun pohon mahoni (swietenia) yang tumbuh sebagai pohon peneduh dan hutan produksi di seluruh Jawa. Mengandung protein 12% BK dan limonoid (senyawa pahit) yang membatasi palatabilitas. Penggunaannya sebagai pakan hanya pada kondisi darurat karena rasa pahit yang kuat.',
    alias: 'Mahogany Leaves, Daun Mahoni Jawa, Swietenia Fodder, Tropical Mahogany Leaves',
    asal: 'Amerika Tengah dan Karibia; diintroduksi ke Indonesia sebagai pohon peneduh dan hutan produksi sejak era kolonial; kini menjadi pohon jalan dan hutan rakyat umum di Jawa',
    habitat: 'Dataran rendah hingga 1.000 mdpl; tumbuh baik di tanah berdrainase baik; toleran kekeringan; banyak ditanam sebagai pohon peneduh jalan, perhutanan, dan kebun campuran',
    umurPanenIdeal: 'Daun tersedia sepanjang tahun; daun muda saat flush (permulaan musim hujan) lebih tinggi nutrisi dan lebih rendah limonoid',
    bagianDimanfaatkan: 'Daun muda (terbaik, lebih rendah limonoid), daun dewasa, biji (berpotensi bergizi namun data terbatas)',
    produksi: 'Tersedia dari pohon peneduh dan hutan tanpa biaya; satu pohon dewasa menghasilkan 100–300 kg daun/tahun',
    kelebihan: 'Tersedia gratis dari pohon peneduh jalan dan hutan; tidak mengandung tanin dalam jumlah tinggi; tersedia sepanjang tahun dari pohon matur; daun muda (flush baru) relatif lebih palatabel',
    kekurangan: 'Limonoid dan triterpenoid menyebabkan rasa pahit sangat kuat — palatabilitas sangat rendah; ternak umumnya menolak daun mahoni jika ada pilihan lain; nilai nutrisi sedang saja (TDN 52%, PK 12% BK); perlu pengolahan/pencampuran intensif untuk meningkatkan penerimaan',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 35, kadarAir: 65,
      pk: 12.0, sk: 27.0, lk: 3.0, abu: 9.0, betn: 49.0,
      tdn: 52, me: 2080,
      ndf: 52.0, adf: 36.0,
      ca: 1.20, p: 0.25, mg: 0.22, na: 0.05, k: 1.10, cl: 0.22, s: 0.15,
      vitamin: 'Beta-karoten rendah; flavonoid sedang',
      mineral: 'Profil mineral sedang. Ca:P = 4.8:1 — perlu sedikit suplementasi P. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing Dewasa'],
      programCocok: ['Indukan', 'Pejantan'],
      musimTerbaik: 'Awal musim hujan saat daun muda (flush) tersedia — palatabilitas lebih baik',
      umurPanenTerbaik: 'Daun muda saat flush baru (paling rendah limonoid dan paling palatabel); hindari daun tua yang sangat pahit',
      catatan: 'Hanya gunakan sebagai pakan darurat. Untuk meningkatkan penerimaan: cacah halus dan campur molases 5% + hijauan palatabel lain dalam perbandingan 1:3. Batasi ≤20% ransum. Jika ternak menolak sepenuhnya, jangan paksakan — cari alternatif lain.',
    },
    harga: {
      estimasiAI: 0, hargaMarketplace: 100,
      satuan: 'per kg (umumnya gratis dari pohon peneduh)',
      supplier: 'Pohon peneduh jalan / hutan mahoni / Perhutani',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Swietenia macrophylla leaves, INRA-CIRAD-AFZ-FAO',
        'Devendra, C. (1992) — Non-conventional Feed Resources, FAO',
      ],
      sumberData: 'Feedipedia; data sangat terbatas — estimasi berdasarkan sumber tersedia',
      catatan: 'Data komposisi daun mahoni sangat terbatas dalam literatur ilmiah. Nilai merupakan estimasi terbaik. Verifikasi dengan analisis proksimat lokal sebelum penggunaan skala besar.',
    },
    aiInsight: [
      { type: 'peringatan', icon: '🚨', text: 'Limonoid dalam daun mahoni sangat pahit — mayoritas ternak menolak daun mahoni bahkan dalam kondisi lapar jika ada pilihan lain. Jangan berikan lebih dari 20% ransum dan selalu campur dengan bahan palatabel tinggi (molases, daun pisang, dedak).' },
      { type: 'fungsi', icon: '🌿', text: 'Daun mahoni hanya relevan sebagai pakan darurat di daerah perkotaan/pinggiran kota di mana pohon peneduh mahoni melimpah namun hijauan berkualitas sulit diperoleh. Tidak direkomendasikan sebagai pakan rutin.' },
      { type: 'kekurangan', icon: '⚠️', text: 'TDN hanya 52% BK dan palatabilitas sangat rendah — kombinasi yang membuat daun mahoni menjadi pilihan terakhir dalam daftar pakan. Nilai nutrisinya tidak cukup baik untuk membenarkan upaya paksa pemberian pakan ini.' },
      { type: 'kombinasi', icon: '🔗', text: 'Jika terpaksa menggunakan daun mahoni: Cacah halus 15% + Molases 100 mL + Dedak Padi 25% + Hijauan Palatabel 60%. Presentasikan sebagai campuran agar rasa pahit tertutupi sebelum ternak mendeteksinya.' },
      { type: 'kelebihan', icon: '✅', text: 'Limonoid yang membuat daun mahoni pahit justru bersifat antifungal dan antiparasit. Dalam dosis kecil (5–10% ransum), mungkin ada manfaat kesehatan tambahan — ini adalah satu-satunya justifikasi ilmiah untuk penggunaannya.' },
      { type: 'alternatif', icon: '🔄', text: 'Hampir semua alternatif lebih baik dari daun mahoni: Daun Jati (palatabilitas kurang tapi lebih baik), Daun Bambu (palatabilitas kurang tapi TDN serupa), atau bahkan Jerami Padi tanpa pengolahan sekalipun lebih disukai ternak.' },
    ],
  },

  // ── 16. Daun Labu ───────────────────────────────────────────────────────────
  'daun-labu': {
    deskripsi: 'Daun tanaman labu kuning (waluh) yang mengandung protein kasar tinggi (22–24% BK) dengan palatabilitas baik. Tersedia dari kebun labu sebagai limbah pertanian di seluruh Indonesia. Tidak mengandung antinutrisi berbahaya dan dapat diberikan segar langsung kepada ternak.',
    alias: 'Pumpkin Leaves, Daun Waluh, Daun Labu Kuning, Butternut Squash Leaves, Cucurbita Fodder',
    asal: 'Amerika Selatan dan Tengah; diintroduksi ke Asia Tenggara oleh bangsa Eropa; ditanam luas di Indonesia sebagai sayuran di pekarangan dan ladang',
    habitat: 'Dataran rendah hingga 1.000 mdpl; tumbuh merambat di berbagai jenis tanah; musim tanam 3–4 bulan; sangat produktif di musim kemarau dengan irigasi',
    umurPanenIdeal: 'Daun tersedia dari umur 30 hari; limbah daun melimpah saat panen buah (3–4 bulan)',
    bagianDimanfaatkan: 'Daun, tangkai, dan sulur (utama sebagai hijauan); buah muda afkir; biji labu (protein tinggi ~30% BK)',
    produksi: '10–20 ton daun segar/ha/musim tanam; limbah sangat melimpah dari sentra labu',
    kelebihan: 'Protein kasar cukup tinggi (23% BK); tidak ada antinutrisi berbahaya; palatabilitas baik; mudah diperoleh dari kebun sendiri; buah dan biji labu juga bernilai tinggi sebagai pakan konsentrat; kadar air cukup tinggi',
    kekurangan: 'Musiman — tersedia terutama saat musim tanam labu; daun cepat layu setelah panen; kadar air sangat tinggi (87%) pada daun segar sehingga volume besar; serat agak kasar akibat bulu halus pada permukaan daun (dapat mengurangi palatabilitas awal)',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 13, kadarAir: 87,
      pk: 23.0, sk: 14.0, lk: 4.0, abu: 14.0, betn: 45.0,
      tdn: 65, me: 2600,
      ndf: 35.0, adf: 22.0,
      ca: 2.20, p: 0.48, mg: 0.42, na: 0.08, k: 3.20, cl: 0.52, s: 0.28,
      vitamin: 'Beta-karoten sangat tinggi; Vitamin C tinggi; Vitamin E; Folat',
      mineral: 'Kalsium, kalium, dan magnesium sangat tinggi. Ca:P = 4.6:1. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 45,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Sapi Perah', 'Kelinci', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui', 'Bunting'],
      musimTerbaik: 'Saat musim panen labu (3–4 bulan setelah tanam); bisa 2–3 musim tanam per tahun',
      umurPanenTerbaik: 'Daun dewasa saat panen buah — paling melimpah dan cukup palatabel; daun muda lebih halus dan palatabilitas lebih tinggi',
      catatan: 'Dapat diberikan segar tanpa perlu pengolahan. Bulu halus pada permukaan daun mengurangi palatabilitas pada beberapa ternak — campur dengan hijauan lain jika perlu. Buah labu afkir dan biji labu adalah sumber energi/protein premium yang sangat palatabel.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 600,
      satuan: 'per kg segar',
      supplier: 'Petani labu / pasar sayuran / kebun sendiri',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Cucurbita moschata leaves, INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Devendra, C. (1992) — Non-conventional Feed Resources, FAO',
      ],
      sumberData: 'Feedipedia; nilai pada daun segar dari kebun labu produktif',
      catatan: 'Data variabel antar varietas labu. Cucurbita maxima dan C. pepo memiliki profil nutrisi serupa. Biji labu (setelah dipress minyaknya) memiliki protein hingga 55% BK — sumber protein premium.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun labu adalah hijauan bergizi tinggi (PK 23% BK, TDN 65% BK) yang mudah diintegrasikan dengan kebun pangan keluarga. Dalam sistem pekarangan terpadu (kebun + ternak), labu memberikan hasil ganda: buah untuk konsumsi manusia dan daun untuk pakan ternak.' },
      { type: 'kelebihan', icon: '✅', text: 'Seluruh bagian tanaman labu bernilai sebagai pakan: daun (protein tinggi), buah afkir (energi tinggi, palatabilitas sangat baik), dan biji labu setelah dipres (protein 30–55% BK untuk konsentrat premium). Zero waste dari kebun labu.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum kambing laktasi optimal: Daun Labu Segar 25% + Rumput Gajah 35% + Indigofera 20% + Dedak Padi 20%. Beta-karoten tinggi dalam daun labu sangat mendukung reproduksi dan produksi susu.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kadar air 87% sangat tinggi — ternak perlu makan volume besar untuk memenuhi kebutuhan BK. Selalu kombinasikan dengan pakan kering (hay, jerami, dedak) agar konsumsi BK total mencukupi kebutuhan harian.' },
      { type: 'peringatan', icon: '🚨', text: 'Kalium sangat tinggi (3.2% BK) pada daun labu. Pada ternak yang rentan hypercalemia atau masalah ginjal, batasi porsi. Pada ternak sehat dengan level normal (≤45% ransum), tidak menjadi masalah.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika daun labu musiman: Daun Mentimun atau Daun Melon (dari keluarga Cucurbitaceae yang sama, profil nutrisi sangat serupa) dapat menggantikan di luar musim labu.' },
    ],
  },

  // ── 17. Daun Semangka ───────────────────────────────────────────────────────
  'daun-semangka': {
    deskripsi: 'Daun tanaman semangka yang merupakan limbah perkebunan semangka tersedia saat panen. Mengandung protein cukup tinggi (21% BK) dan palatabilitas baik. Tersedia melimpah di sentra semangka NTB, Jawa Tengah, dan Sumatera Selatan. Tidak mengandung antinutrisi berbahaya.',
    alias: 'Watermelon Leaves, Daun Blewah (salah kaprah), Citrullus Fodder, Watermelon Vine Leaves',
    asal: 'Afrika Selatan (Kalahari); dibudidayakan di Indonesia terutama di NTB, Jateng, Lampung, dan Sumsel; musim panen 2–3 kali/tahun',
    habitat: 'Dataran rendah hingga 600 mdpl; tumbuh di tanah berpasir, drainase baik; sangat toleran kekeringan; membutuhkan musim kemarau untuk produksi buah terbaik',
    umurPanenIdeal: 'Daun tersedia selama pertumbuhan (45–90 hari); limbah daun melimpah saat panen buah dan saat land clearing pasca panen',
    bagianDimanfaatkan: 'Daun, tangkai, dan sulur (utama); kulit buah semangka (sangat palatabel, energi cukup); biji semangka afkir',
    produksi: '8–15 ton daun segar/ha/musim; limbah sangat melimpah dari kebun semangka pasca panen',
    kelebihan: 'Protein cukup tinggi (21% BK); tidak ada antinutrisi berbahaya; palatabilitas baik untuk ruminansia; tersedia berlimpah pasca panen; kulit buah semangka (yang tidak layak konsumsi) juga pakan bernilai tinggi',
    kekurangan: 'Ketersediaan musiman; daun cepat layu setelah panen — harus segera diberikan; kadar air sangat tinggi (86%); terbatas di daerah non-sentra semangka',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 14, kadarAir: 86,
      pk: 21.0, sk: 16.0, lk: 3.5, abu: 14.0, betn: 45.5,
      tdn: 62, me: 2480,
      ndf: 38.0, adf: 25.0,
      ca: 1.60, p: 0.40, mg: 0.38, na: 0.09, k: 2.90, cl: 0.48, s: 0.26,
      vitamin: 'Beta-karoten sedang–tinggi; Vitamin C; Likopen rendah (daun vs buah)',
      mineral: 'Kalsium dan kalium cukup tinggi. Ca:P = 4:1. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 45,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Sapi Perah'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      musimTerbaik: 'Saat panen semangka — biasanya April–Juni dan September–November',
      umurPanenTerbaik: 'Daun segar saat panen buah — kualitas terbaik; berikan segera setelah panen',
      catatan: 'Berikan segera setelah panen karena daun cepat layu. Kulit semangka afkir (termasuk daging merah sisa yang tidak terambil) adalah bonus pakan energi sangat palatabel — kambing dan sapi sangat menyukainya. Simpan dengan cara dikeringkan jika ingin cadangan.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 500,
      satuan: 'per kg segar',
      supplier: 'Petani semangka / pasar buah / kebun sendiri',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Citrullus lanatus leaves, INRA-CIRAD-AFZ-FAO',
        'Devendra, C. (1992) — Non-conventional Feed Resources, FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia; data terbatas — nilai estimasi terbaik',
      catatan: 'Data spesifik daun semangka sangat terbatas. Nilai diekstrapolasi dari data Cucurbitaceae lain dan analisis terbatas yang tersedia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun semangka adalah limbah pertanian yang sering terbuang sia-sia. Dengan PK 21% BK dan TDN 62% BK, nilai nutrisinya cukup baik — setara banyak hijauan yang harus dibeli. Di sentra semangka, ini adalah pakan "gratis" bernilai tinggi.' },
      { type: 'kelebihan', icon: '✅', text: 'Kulit semangka afkir (hijau dan putih) + daun + sulur dari satu hamparan kebun semangka memberikan paket pakan lengkap: kulit (energi, sangat palatabel) + daun (protein). Ternak sangat menyukai seluruh bagian tanaman semangka.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum musim panen semangka: Daun + Sulur Semangka 30% + Kulit Semangka 20% + Rumput/Jerami 30% + Konsentrat 20%. Sangat hemat biaya dan palatabilitas sangat tinggi — ternak akan nafsu makan luar biasa.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Daun semangka layu dalam 4–6 jam setelah dipanen di kondisi panas. Rencanakan pemberian langsung setelah panen atau segera setelah land clearing kebun. Penyimpanan sebagai silase bisa dicoba namun hasilnya variabel karena kadar air sangat tinggi.' },
      { type: 'peringatan', icon: '🚨', text: 'Waspada kontaminasi pestisida pada daun semangka komersial yang biasanya mendapat penyemprotan intensif. Tunggu minimal 7–14 hari setelah penyemprotan terakhir sebelum diberikan ke ternak, atau hanya gunakan dari kebun tanpa pestisida.' },
      { type: 'alternatif', icon: '🔄', text: 'Cucurbitaceae lain sebagai alternatif: Daun Melon, Daun Mentimun, Daun Labu — semua dari famili yang sama dengan profil nutrisi sangat mirip dan tersedia pada musim tanam berbeda.' },
    ],
  },

  // ── 18. Daun Melon ──────────────────────────────────────────────────────────
  'daun-melon': {
    deskripsi: 'Daun tanaman melon dari keluarga Cucurbitaceae dengan profil nutrisi mirip daun semangka. Protein kasar 18% BK dan TDN 60% BK. Tersedia sebagai limbah kebun melon di sentra produksi Jawa Tengah dan DIY. Palatabilitas baik untuk kambing dan sapi.',
    alias: 'Muskmelon Leaves, Daun Blewah, Melon Vine Leaves, Cucumis melo Fodder',
    asal: 'Asia Selatan dan Afrika; dibudidayakan luas di Indonesia terutama di Jawa Tengah (Boyolali, Klaten), DIY, dan Sumatra; musim panen 2–3 kali/tahun',
    habitat: 'Dataran rendah hingga 700 mdpl; tumbuh di tanah berpasir berdrainase baik; membutuhkan iklim kering untuk buah berkualitas; mirip dengan semangka dalam kebutuhan iklim',
    umurPanenIdeal: 'Daun tersedia selama pertumbuhan (60–90 hari); limbah melimpah saat land clearing pasca panen',
    bagianDimanfaatkan: 'Daun dan sulur (utama); kulit buah melon afkir (palatabel, kaya gula); biji melon',
    produksi: '8–15 ton daun segar/ha/musim; tersedia dari limbah kebun melon komersial',
    kelebihan: 'Protein cukup (18% BK); palatabilitas baik; tidak ada antinutrisi berbahaya; kulit buah melon sangat palatabel dan manis — bonus pakan energi; tersedia dari limbah tanpa biaya tambahan',
    kekurangan: 'Musiman; daun cepat layu; kadar air sangat tinggi (86%); terbatas di daerah sentra melon; risiko pestisida pada melon komersial intensif',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 14, kadarAir: 86,
      pk: 18.0, sk: 16.0, lk: 3.5, abu: 13.0, betn: 49.5,
      tdn: 60, me: 2400,
      ndf: 38.0, adf: 24.0,
      ca: 1.40, p: 0.38, mg: 0.36, na: 0.08, k: 2.80, cl: 0.46, s: 0.24,
      vitamin: 'Beta-karoten sedang; Vitamin C; Folat',
      mineral: 'Ca dan K cukup tinggi. Ca:P = 3.7:1. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Sapi Perah'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      musimTerbaik: 'Saat panen melon — musim kemarau (April–Oktober di Jawa)',
      umurPanenTerbaik: 'Daun segar saat panen buah; berikan segera karena cepat layu',
      catatan: 'Sama seperti daun semangka — berikan segera setelah panen. Waspadai residu pestisida pada kebun melon komersial intensif. Kulit melon afkir sangat palatabel karena kandungan gula tinggi — akan meningkatkan konsumsi ransum secara keseluruhan.',
    },
    harga: {
      estimasiAI: 350, hargaMarketplace: 500,
      satuan: 'per kg segar',
      supplier: 'Kebun melon / sentra melon Jawa Tengah / pedagang lokal',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Cucumis melo leaves, INRA-CIRAD-AFZ-FAO',
        'Devendra, C. (1992) — Non-conventional Feed Resources, FAO',
      ],
      sumberData: 'Feedipedia; data terbatas — nilai diestimasi dari Cucurbitaceae family',
      catatan: 'Data spesifik daun melon sangat terbatas dalam literatur. Nilai diekstrapolasi dari keluarga Cucurbitaceae dan sumber terbatas yang tersedia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun melon adalah pakan limbah musiman yang bernilai baik (PK 18%, TDN 60% BK). Di sentra melon, peternak yang mengambil daun dan kulit buah afkir mendapatkan pakan gratis berkualitas cukup baik selama musim panen.' },
      { type: 'kelebihan', icon: '✅', text: 'Kulit melon mengandung gula alami yang meningkatkan palatabilitas seluruh ransum. Kombinasi daun (protein) + kulit (energi) dari satu tanaman memberikan nutrisi yang cukup seimbang tanpa biaya tambahan.' },
      { type: 'peringatan', icon: '🚨', text: 'Melon komersial mendapat penyemprotan pestisida sangat intensif (fungisida, insektisida). Tunggu minimal 14 hari setelah aplikasi terakhir sebelum memberikan daun kepada ternak. Lebih aman menggunakan dari kebun melon organik atau semi-organik.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum musim panen: Daun + Sulur Melon 25% + Kulit Buah Melon 20% + Rumput Gajah 30% + Leguminosa 25%. Total protein dan energi cukup untuk pertumbuhan kambing optimal.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ketersediaan hanya 2–3 bulan per tahun. Jangan membangun ketergantungan ransum pada daun melon — selalu siapkan sumber hijauan alternatif untuk periode non-panen.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif sesama Cucurbitaceae: Daun Semangka (PK sedikit lebih tinggi, profil sangat mirip), Daun Mentimun (PK serupa, lebih umum), atau Daun Labu (PK lebih tinggi, tersedia lebih lama).' },
    ],
  },

  // ── 19. Daun Mentimun ───────────────────────────────────────────────────────
  'daun-mentimun': {
    deskripsi: 'Daun tanaman mentimun/timun dari keluarga Cucurbitaceae. Profil nutrisi mirip daun melon dengan protein 18% BK. Tersedia dari kebun mentimun yang sangat umum di seluruh Indonesia. Palatabilitas cukup baik untuk kambing dan domba.',
    alias: 'Cucumber Leaves, Daun Timun, Daun Ketimun, Cucumis Fodder, Cucumber Vine Leaves',
    asal: 'India Selatan dan Nepal; dibudidayakan di seluruh Indonesia sebagai sayuran umum; tersedia hampir sepanjang tahun dari kebun sayuran',
    habitat: 'Dataran rendah hingga 1.100 mdpl; tumbuh merambat di berbagai jenis tanah; musim tanam pendek (45–60 hari); dapat ditanam sepanjang tahun dengan irigasi',
    umurPanenIdeal: 'Daun tersedia dari umur 20 hari; limbah daun melimpah saat panen dan land clearing (45–60 hari)',
    bagianDimanfaatkan: 'Daun dan sulur (utama); batang muda; mentimun afkir dan kwalitas buruk',
    produksi: '5–10 ton daun segar/ha/musim; sangat umum dari kebun sayuran skala kecil',
    kelebihan: 'Tersedia hampir sepanjang tahun dari kebun sayuran; tidak ada antinutrisi berbahaya; palatabilitas baik; mentimun afkir sangat palatabel (kadar air tinggi baik untuk hidrasi ternak); mudah diintegrasikan dengan kebun sayuran keluarga',
    kekurangan: 'Kadar air sangat tinggi (88%); daun cepat layu; ketersediaan per plot kecil-kecil; sering terkontaminasi pestisida dari kebun sayuran intensif',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 12, kadarAir: 88,
      pk: 18.0, sk: 16.0, lk: 3.5, abu: 13.0, betn: 49.5,
      tdn: 60, me: 2400,
      ndf: 38.0, adf: 24.0,
      ca: 1.40, p: 0.38, mg: 0.35, na: 0.08, k: 2.70, cl: 0.44, s: 0.23,
      vitamin: 'Beta-karoten sedang; Vitamin C; Vitamin K',
      mineral: 'Profil mirip Cucurbitaceae lain. Ca:P = 3.7:1. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Kelinci'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      musimTerbaik: 'Sepanjang tahun dari kebun sayuran; paling melimpah saat musim kemarau',
      umurPanenTerbaik: 'Daun segar saat panen mentimun; berikan segera',
      catatan: 'Mentimun afkir/kualitas rendah adalah bonus pakan yang sangat palatabel dan mengandung air tinggi (mengurangi kebutuhan minum). Waspadai residu pestisida dari kebun komersial.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 600,
      satuan: 'per kg segar',
      supplier: 'Petani sayuran / pasar sayuran / kebun sendiri',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Cucumis sativus leaves, INRA-CIRAD-AFZ-FAO',
        'Devendra, C. (1992) — Non-conventional Feed Resources, FAO',
      ],
      sumberData: 'Feedipedia; data terbatas — nilai diestimasi dari Cucurbitaceae family',
      catatan: 'Data spesifik daun mentimun sangat terbatas. Nilai diekstrapolasi dari sumber Cucurbitaceae yang tersedia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun mentimun adalah hijauan sayuran yang sangat mudah diintegrasikan dengan pertanian keluarga. Mentimun afkir (tidak laku dijual) + daun dari satu kebun memberikan pakan protein (daun) dan sumber air/hidrasi alami (buah) secara gratis.' },
      { type: 'kelebihan', icon: '✅', text: 'Dari satu kebun mentimun 0.1 ha, peternak bisa mendapat 500–1.000 kg daun segar per musim — cukup untuk suplemen hijauan kambing 5–10 ekor selama 1–2 bulan. Biaya nol jika dari kebun sendiri.' },
      { type: 'peringatan', icon: '🚨', text: 'Kebun mentimun komersial umumnya mendapat 15–20 kali semprot pestisida per musim. Jangan gunakan dari kebun tersebut tanpa karantina 14 hari. Gunakan hanya dari kebun sendiri tanpa pestisida atau dengan interval aman.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum kambing sederhana: Daun Mentimun 20% + Mentimun Afkir 15% + Rumput Lapangan 40% + Dedak Padi 25%. Sangat hemat dan kandungan protein cukup untuk kambing Grower.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK hanya 12% — sangat rendah. Ternak perlu makan volume sangat besar (5–6 kg segar untuk setara 0.7 kg BK). Selalu kombinasikan dengan pakan kering agar intake BK harian terpenuhi.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif sesama Cucurbitaceae dengan BK lebih tinggi: Daun Labu (BK 13%, PK 23% lebih tinggi) atau Daun Semangka (BK 14%, PK 21%). Keduanya lebih efisien dalam hal volume pakan.' },
    ],
  },

  // ── 20. Daun Terong ─────────────────────────────────────────────────────────
  'daun-terong': {
    deskripsi: 'Daun tanaman terong (Solanaceae) dengan protein cukup tinggi (20% BK). Mengandung solanin (alkaloid glikoalkaloid) dalam jumlah rendah — aman jika tidak diberikan berlebihan. Tersedia dari kebun sayuran terong yang sangat umum di Indonesia. Palatabilitas sedang untuk kambing dan domba.',
    alias: 'Eggplant Leaves, Daun Terung, Brinjal Leaves, Solanum melongena Fodder',
    asal: 'Asia Selatan (India); dibudidayakan luas di seluruh Indonesia sebagai sayuran; musim tanam 90–120 hari, dapat ditanam sepanjang tahun',
    habitat: 'Dataran rendah hingga 1.200 mdpl; menyukai tanah gembur berdrainase baik; toleran panas; sangat umum di kebun sayuran dan pekarangan rumah',
    umurPanenIdeal: 'Daun tersedia dari umur 30 hari; limbah daun melimpah saat panen (90–120 hari)',
    bagianDimanfaatkan: 'Daun (utama, setelah dilayukan), batang muda, buah terong afkir (sangat palatabel)',
    produksi: '5–12 ton daun segar/ha/musim; tersedia dari kebun terong rakyat yang sangat umum',
    kelebihan: 'Protein cukup tinggi (20% BK); tersedia dari kebun sayuran umum; buah terong afkir sangat palatabel; tidak ada antinutrisi berbahaya dalam jumlah signifikan pada dosis normal',
    kekurangan: 'Solanin (glikoalkaloid) menyebabkan rasa pahit ringan — layukan sebelum diberikan; palatabilitas sedang; kadar air tinggi (85%); risiko pestisida dari kebun terong komersial intensif',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 15, kadarAir: 85,
      pk: 20.0, sk: 15.0, lk: 3.5, abu: 14.0, betn: 47.5,
      tdn: 62, me: 2480,
      ndf: 36.0, adf: 23.0,
      ca: 1.50, p: 0.42, mg: 0.38, na: 0.09, k: 2.80, cl: 0.48, s: 0.26,
      vitamin: 'Beta-karoten sedang; Vitamin C; Nasunin (anthosianin)',
      mineral: 'Ca dan K cukup tinggi. Ca:P = 3.6:1. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 35,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      musimTerbaik: 'Sepanjang tahun dari kebun sayuran; paling melimpah saat panen terong',
      umurPanenTerbaik: 'Daun dewasa saat panen buah; layukan 6–8 jam sebelum diberikan',
      catatan: 'Layukan 6–8 jam sebelum diberikan untuk mengurangi solanin dan meningkatkan palatabilitas. Batasi ≤35% ransum. Buah terong yang sangat matang atau busuk sebagian dapat diberikan setelah bagian busuk dibuang. Waspadai pestisida.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 600,
      satuan: 'per kg segar',
      supplier: 'Petani sayuran / pasar sayuran / kebun sendiri',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Solanum melongena leaves, INRA-CIRAD-AFZ-FAO',
        'Devendra, C. (1992) — Non-conventional Feed Resources, FAO',
      ],
      sumberData: 'Feedipedia; data terbatas — nilai estimasi terbaik',
      catatan: 'Data spesifik daun terong sangat terbatas. Nilai diekstrapolasi dari Solanaceae dan sumber terbatas yang tersedia. Solanin dalam jumlah kecil aman; dosis berbahaya sangat tinggi (>10g solanin/kg BT) dan tidak realistis pada pemberian normal.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun terong adalah sumber protein hijauan sayuran (PK 20% BK, TDN 62% BK) yang sangat mudah diperoleh dari kebun sayuran rakyat. Buah terong afkir sebagai bonus pakan membuat kebun terong menjadi sumber pakan terintegrasi yang sangat baik.' },
      { type: 'peringatan', icon: '🚨', text: 'Solanin dalam daun terong segar menyebabkan rasa pahit dan dapat mengurangi palatabilitas. Selalu layukan 6–8 jam atau campur dengan hijauan palatabel lain. Pada dosis normal (<35% ransum) solanin tidak mencapai level toksik untuk ternak dewasa.' },
      { type: 'kelebihan', icon: '✅', text: 'Kebun terong adalah sumber pakan tak terduga yang berharga. Dalam satu musim tanam, peternak yang juga berkebun terong mendapatkan: daun (protein), buah afkir (energi + palatabilitas), dan batang muda (serat) — semuanya tanpa biaya tambahan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum kambing: Daun Terong Layu 20% + Buah Terong Afkir 10% + Rumput Gajah 40% + Indigofera 20% + Dedak Padi 10%. Palatabilitas sangat meningkat dengan tambahan buah terong yang manis.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kadar air 85% membatasi asupan BK. Pastikan total ransum mencukupi kebutuhan BK dengan menambahkan pakan kering (hay, jerami, dedak). Palatabilitas sedang — ternak mungkin memilih hijauan lain jika ada pilihan.' },
      { type: 'alternatif', icon: '🔄', text: 'Sesama Solanaceae dengan palatabilitas lebih baik: Daun Cabai (PK serupa, sedikit lebih pedas namun beberapa ternak toleran). Cucurbitaceae (labu, semangka, mentimun) umumnya lebih palatabel dari Solanaceae.' },
    ],
  },

  // ── 21. Daun Cabai ──────────────────────────────────────────────────────────
  'daun-cabai': {
    deskripsi: 'Daun tanaman cabai dari keluarga Solanaceae dengan protein 18% BK. Mengandung capsaicin yang menyebabkan rasa pedas/panas dan mempengaruhi palatabilitas pada beberapa ternak. Tersedia dari kebun cabai yang sangat luas di Indonesia. Sapi dan kambing umumnya dapat mentolerir daun cabai lebih baik dari manusia.',
    alias: 'Chili Leaves, Daun Lombok, Daun Lada (salah kaprah), Pepper Leaves, Capsicum Fodder',
    asal: 'Amerika Selatan dan Tengah; dibudidayakan luas di seluruh Indonesia sebagai rempah utama; sentra produksi: Jawa Timur, Aceh, Sumbar, NTT',
    habitat: 'Dataran rendah hingga 1.400 mdpl; menyukai tanah gembur berdrainase baik; membutuhkan sinar matahari penuh; sensitif terhadap genangan',
    umurPanenIdeal: 'Daun tersedia dari umur 30 hari; limbah daun melimpah saat panen dan akhir musim (90–120 hari)',
    bagianDimanfaatkan: 'Daun (utama, setelah dilayukan), batang muda, buah cabai afkir/rusak (dalam jumlah terbatas)',
    produksi: '5–10 ton daun segar/ha/musim; sangat umum dari kebun cabai rakyat',
    kelebihan: 'Protein cukup (18% BK); tersedia dari kebun cabai yang sangat luas; capsaicin dalam jumlah tertentu bersifat antimikroba dan berpotensi meningkatkan digestibilitas; sapi dan kerbau umumnya toleran terhadap capsaicin',
    kekurangan: 'Capsaicin menyebabkan rasa pedas — beberapa ternak (terutama kambing muda) menolak; palatabilitas variabel antar individu ternak; kadar air tinggi (85%); risiko pestisida tinggi dari kebun cabai komersial intensif',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 15, kadarAir: 85,
      pk: 18.0, sk: 15.0, lk: 5.0, abu: 14.0, betn: 48.0,
      tdn: 62, me: 2480,
      ndf: 35.0, adf: 22.0,
      ca: 1.80, p: 0.42, mg: 0.40, na: 0.09, k: 2.90, cl: 0.50, s: 0.27,
      vitamin: 'Beta-karoten tinggi; Vitamin C sangat tinggi (±144 mg/100g segar — tertinggi sayuran); Vitamin E; Capsaicin (kapsaisinoid)',
      mineral: 'Ca dan K tinggi. Ca:P = 4.3:1. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing Dewasa', 'Domba Dewasa'],
      programCocok: ['Penggemukan', 'Indukan', 'Pejantan'],
      musimTerbaik: 'Saat panen cabai (90–120 hari setelah tanam); beberapa kali panen per tahun',
      umurPanenTerbaik: 'Daun dewasa saat panen; layukan 6–12 jam untuk mengurangi intensitas capsaicin',
      catatan: 'Adaptasikan ternak secara bertahap — mulai dengan 5% ransum, tingkatkan perlahan. Sapi dan kerbau umumnya lebih toleran dari kambing. Layukan 6–12 jam untuk mengurangi efek capsaicin. Batasi buah cabai merah/hijau afkir karena konsentrasi capsaicin sangat tinggi di buah.',
    },
    harga: {
      estimasiAI: 500, hargaMarketplace: 800,
      satuan: 'per kg segar',
      supplier: 'Petani cabai / pasar sayuran / kebun sendiri',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Capsicum annuum leaves, INRA-CIRAD-AFZ-FAO',
        'Tekeli, A. et al. (2007) — Effects of red pepper on broiler performance, J. Biol. Sci.',
        'Devendra, C. (1992) — Non-conventional Feed Resources, FAO',
      ],
      sumberData: 'Feedipedia dan data terbatas; nilai estimasi terbaik dari Solanaceae',
      catatan: 'Data spesifik daun cabai sebagai pakan ternak sangat terbatas. Kandungan capsaicin bervariasi ekstrem antar varietas: cabai rawit >>cabai besar. Daun cabai besar umumnya lebih aman dan palatabel dari daun cabai rawit.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun cabai adalah sumber protein sedang (PK 18% BK) yang tersedia dari kebun cabai rakyat yang sangat luas di Indonesia. Capsaicin dalam dosis rendah memiliki efek antimikroba pada saluran cerna yang berpotensi menguntungkan.' },
      { type: 'peringatan', icon: '🚨', text: 'Capsaicin sangat variabel antar varietas. Daun cabai rawit memiliki capsaicin jauh lebih tinggi dari cabai keriting atau cabai besar. Mulai adaptasi dari 5% ransum. Jika ternak menolak setelah 7 hari adaptasi, jangan paksakan — cari alternatif.' },
      { type: 'kelebihan', icon: '✅', text: 'Vitamin C sangat tinggi (144 mg/100g segar — tertinggi sayuran) dan beta-karoten tinggi. Meskipun ruminansia dapat mensintesis vitamin C, suplemen alami dari daun cabai mungkin bermanfaat untuk sistem imun dan reproduksi ternak.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk meningkatkan penerimaan: Daun Cabai Layu 15% + Molases encer 3% + Dedak Padi 25% + Rumput Gajah 40% + Indigofera 17%. Molases sangat efektif menutupi rasa capsaicin.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Toleransi individual ternak terhadap capsaicin sangat bervariasi. Beberapa kambing muda/anak menolak total, sementara sapi dewasa umumnya toleran penuh. Selalu uji pada beberapa ekor ternak sebelum pemberian massal.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih palatabel dari Solanaceae: Daun Terong (solanin lebih rendah dari capsaicin cabai, umumnya lebih diterima). Atau tinggalkan Solanaceae dan gunakan Cucurbitaceae (labu, semangka, melon) yang jauh lebih palatabel.' },
    ],
  },

  // ── 22. Daun Okra ───────────────────────────────────────────────────────────
  'daun-okra': {
    deskripsi: 'Daun tanaman okra (bendi) dari keluarga Malvaceae yang mengandung protein tinggi (22–24% BK) dan mucilago alami. Palatabilitas baik untuk kambing dan domba. Mucilago okra membantu menjaga kelembaban saluran pencernaan dan bermanfaat untuk ternak yang mengalami masalah GI. Tersedia dari kebun okra di Jawa dan Sumatera.',
    alias: 'Okra Leaves, Daun Bendi, Lady Finger Leaves, Abelmoschus Fodder, Daun Kacang Bendi',
    asal: 'Afrika Timur (Ethiopia); diintroduksi ke Asia Selatan dan Tenggara; dibudidayakan di Indonesia terutama di Jawa, Sumatera, dan Sulawesi sebagai sayuran dan pangan fungsional',
    habitat: 'Dataran rendah hingga 800 mdpl; menyukai tanah subur berdrainase baik; sangat toleran panas dan kekeringan; tumbuh baik di musim kemarau; sensit terhadap frost',
    umurPanenIdeal: 'Daun tersedia dari umur 30 hari; tanaman produktif 3–5 bulan; daun dipanen bersamaan atau terpisah dari panen buah',
    bagianDimanfaatkan: 'Daun dan tangkai (utama); batang muda; buah okra tua/afkir (bernutrisi dan palatabel)',
    produksi: '8–15 ton daun segar/ha/musim; dapat dipanen bertahap setiap 2–3 minggu',
    kelebihan: 'Protein sangat tinggi (23% BK) — salah satu tertinggi di antara sayuran daun; mucilago alami melindungi saluran cerna; palatabilitas baik untuk kambing dan domba; tidak ada antinutrisi berbahaya signifikan; Malvaceae — kerabat waru yang juga bernilai',
    kekurangan: 'Ketersediaan relatif terbatas (belum sepopuler sayuran Cucurbitaceae); kadar air tinggi (85%); musiman; mucilago berlebihan pada buah tua menyebabkan tekstur lengket yang kadang mengurangi konsumsi',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 15, kadarAir: 85,
      pk: 23.0, sk: 14.0, lk: 4.5, abu: 14.0, betn: 44.5,
      tdn: 64, me: 2560,
      ndf: 32.0, adf: 20.0,
      ca: 2.10, p: 0.48, mg: 0.44, na: 0.09, k: 2.80, cl: 0.48, s: 0.28,
      vitamin: 'Beta-karoten tinggi; Vitamin C tinggi (±23 mg/100g segar); Vitamin K tinggi; Folat tinggi',
      mineral: 'Kalsium sangat tinggi (2.1% BK); Ca:P = 4.4:1. Magnesium dan folat menonjol. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 45,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Sapi Perah'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui', 'Bunting'],
      musimTerbaik: 'Musim kemarau (tanaman okra tumbuh optimal); beberapa musim tanam per tahun',
      umurPanenTerbaik: 'Daun muda hingga dewasa; panen setiap 2–3 minggu untuk produksi berkelanjutan',
      catatan: 'Daun okra dapat diberikan segar tanpa pengolahan. Mucilago yang dihasilkan (lendir alami) bermanfaat untuk ternak yang pernah mengalami diare atau iritasi GI. Buah okra tua/keras (tidak layak konsumsi manusia) adalah bonus pakan protein yang palatabel. Sangat dianjurkan untuk indukan bunting dan laktasi.',
    },
    harga: {
      estimasiAI: 600, hargaMarketplace: 1000,
      satuan: 'per kg segar',
      supplier: 'Petani okra / pasar sayuran modern / kebun sendiri',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Abelmoschus esculentus leaves, INRA-CIRAD-AFZ-FAO',
        'Ndong, M. et al. (2007) — Assessment of nutrient composition of Okra leaves, J. Food Comp. Anal.',
        'Devendra, C. (1992) — Non-conventional Feed Resources, FAO',
        'Sirait, J. et al. (2015) — Potensi hijauan daun sayuran, JITV',
      ],
      sumberData: 'Feedipedia dan Ndong et al. 2007; nilai pada daun segar dewasa',
      catatan: 'Daun okra memiliki data nutrisi yang lebih lengkap dari kebanyakan sayuran lain karena juga umum dikonsumsi manusia di Afrika. Nilai cukup reliabel.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun okra adalah "hidden gem" pakan hijauan sayuran — PK 23% BK dan TDN 64% BK adalah salah satu terbaik di antara semua daun sayuran yang dikaji. Dengan mucilago yang melindungi saluran cerna, daun okra ideal untuk indukan bunting dan ternak pasca penyakit GI.' },
      { type: 'kelebihan', icon: '✅', text: 'Vitamin K sangat tinggi — penting untuk pembekuan darah dan metabolisme tulang pada ternak bunting dan anak yang baru lahir. Folat tinggi mendukung perkembangan janin. Daun okra adalah suplemen nutrisi premium untuk indukan bunting di fase kritis.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum indukan bunting/laktasi premium: Daun Okra 20% + Daun Katuk 10% + Rumput Gajah 35% + Indigofera 20% + Konsentrat 15%. Kandungan protein, vitamin, dan mineral lengkap untuk fase produksi tertinggi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ca:P ratio 4.4:1 dan Ca sangat tinggi (2.1% BK). Pastikan sumber fosfor (dedak padi, fosfat dikalsium) tersedia dalam ransum. Ca berlebih tanpa P cukup dapat mengganggu absorpsi mineral lain termasuk Mg dan Zn.' },
      { type: 'peringatan', icon: '🚨', text: 'Okra masih relatif mahal dibanding hijauan lain (Rp 600–1.000/kg segar). Untuk penggunaan skala besar, pertimbangkan menanam sendiri — okra sangat produktif, toleran kemarau, dan dapat dipanen 2–3 kali/tahun dengan biaya produksi rendah.' },
      { type: 'alternatif', icon: '🔄', text: 'Dari keluarga Malvaceae yang sama: Daun Waru (lebih murah, PK lebih rendah, tersedia gratis). Untuk protein setinggi okra: Daun Katuk (PK 31% BK, tersedia jika ditanam khusus) atau Daun Pepaya (PK 25% BK, tersedia lebih umum).' },
    ],
  },

};

// ─── Accessor Functions ───────────────────────────────────────────────────────

export function getDaunanDetail(id: string): DaunanDetailFields | undefined {
  return DAUNAN_DETAIL[id];
}

export function getDaunanDetailItem(id: string): DaunanDetailItem | undefined {
  const base = getDaunanById(id);
  const detail = DAUNAN_DETAIL[id];
  if (!base || !detail) return undefined;
  return { ...base, ...detail };
}

export function getAllDaunanDetailItems(): DaunanDetailItem[] {
  return Object.keys(DAUNAN_DETAIL)
    .map(id => getDaunanDetailItem(id))
    .filter((i): i is DaunanDetailItem => !!i);
}

export function computeDaunanRingkasan() {
  const items = getAllDaunanDetailItems();
  const priced = items.filter(i => i.harga.estimasiAI !== null);
  const hargaRataRata = priced.length > 0
    ? Math.round(priced.reduce((s, i) => s + (i.harga.estimasiAI ?? 0), 0) / priced.length)
    : null;
  return {
    totalReferensi: items.length,
    hargaRataRata,
    terakhirUpdate: 'Jul 2026',
    dataLengkap: items.length,
  };
}
