// ─── MP-013 — Detail Data: Kacang & Biji-bijian ──────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for all Kacang &
// Biji-bijian items (single raw-material seeds/beans — no bungkil/tepung/
// fermented/processed products).
//
// Convention: proximate (PK, SK, LK, Abu, BETN), TDN, ME, NDF, ADF, and minerals
// are expressed on DM (Bahan Kering) basis. bk and kadarAir are % of fresh/whole
// seed material.
//
// Primary sources:
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi
//     Pakan untuk Indonesia. Gadjah Mada University Press.
//   • NRC (2012/2016). Nutrient Requirements of Swine / Beef Cattle.
//   • Feedipedia (2023). INRA-CIRAD-AFZ-FAO Animal Feed Resources.
//   • FAO (2018). Feed Resources for Tropical Ruminants.

import { getKacangBijianById, type KacangBijianItem } from './kacangBijianData';
import type {
  NutrisiData,
  PenggunaanData,
  HargaData,
  ReferensiData,
  AiInsightItem,
  BentukBahan,
} from './jagungData';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KacangBijianDetailFields {
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

export type KacangBijianDetailItem = KacangBijianItem & KacangBijianDetailFields;

// ─── Detail Registry ──────────────────────────────────────────────────────────

const KACANG_BIJIAN_DETAIL: Record<string, KacangBijianDetailFields> = {

  // ── 1. Kedelai ────────────────────────────────────────────────────────────
  'kedelai': {
    deskripsi: 'Biji kedelai utuh merupakan sumber protein dan energi nabati terbaik di antara semua kacang-kacangan — protein kasar 36–40% BK dengan kandungan lemak tinggi (18–20% BK). Umumnya diolah menjadi bungkil, namun biji utuh (whole soybean) juga digunakan langsung, biasanya setelah dipanaskan (toasting) untuk menonaktifkan anti-tripsin.',
    alias: 'Soybean, Whole Soybean, Kacang Kedelai',
    asal: 'Asia Timur (Tiongkok); dibudidayakan luas di seluruh dunia termasuk Indonesia sebagai bahan pangan dan pakan utama',
    habitat: 'Dataran rendah hingga 800 mdpl; menyukai tanah gembur berdrainase baik; butuh curah hujan sedang 350–500 mm selama masa tanam',
    umurPanenIdeal: 'Panen pada umur 80–100 hari setelah tanam saat polong sudah kering kecoklatan dan biji keras',
    bagianDimanfaatkan: 'Biji utuh (kering atau dipanaskan/toasted); kulit biji sebagai limbah serat',
    produksi: '1,5–2,5 ton biji kering/ha/musim tanam pada varietas unggul dengan pemupukan optimal',
    kelebihan: 'Protein kasar tertinggi di antara biji-bijian lokal (36–40% BK); asam amino esensial lengkap (terutama lisin); energi tinggi dari kandungan minyak; sangat palatable untuk semua jenis ternak',
    kekurangan: 'Mengandung faktor anti-nutrisi (tripsin inhibitor, lektin) pada biji mentah — wajib dipanaskan/toasting sebelum diberikan; harga relatif mahal karena bersaing dengan kebutuhan pangan manusia',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 38.0, sk: 6.0, lk: 18.5, abu: 5.5, betn: 32.0,
      tdn: 84, me: 3360,
      ndf: 14.0, adf: 9.0,
      ca: 0.28, p: 0.55, mg: 0.28, na: 0.02, k: 1.80, cl: 0.04, s: 0.30,
      vitamin: 'Vitamin E (tokoferol) tinggi dari kandungan minyak; Vitamin B kompleks; Folat',
      mineral: 'P organik tinggi namun sebagian besar dalam bentuk fitat (ketersediaan terbatas untuk unggas). Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing', 'Ayam Kampung', 'Babi'],
      programCocok: ['Menyusui', 'Grower', 'Penggemukan', 'Bunting'],
      musimTerbaik: 'Tersedia sepanjang tahun dari hasil panen dan impor',
      umurPanenTerbaik: 'Biji kering matang penuh dengan kadar air <13% untuk penyimpanan optimal',
      catatan: 'Wajib dipanaskan (toasting 100–110°C, 15–20 menit) untuk menonaktifkan tripsin inhibitor sebelum diberikan, terutama untuk unggas dan babi. Ruminansia lebih toleran namun tetap disarankan diproses.',
    },
    harga: {
      estimasiAI: 9500, hargaMarketplace: 11000,
      satuan: 'per kg biji kering', supplier: 'Distributor pakan / Koperasi tani kedelai / Importir biji-bijian',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2012) — Nutrient Requirements of Swine, 11th Rev. Ed.',
        'Feedipedia (2023) — Soybean, whole seeds, INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Rata-rata dari NRC 2012 dan Feedipedia untuk biji kedelai utuh',
      catatan: 'Nilai bervariasi tergantung varietas dan proses pemanasan; kandungan lemak dapat menurun jika diekstraksi sebagian.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🫘', text: 'Kedelai utuh adalah sumber protein dan energi nabati premium — kombinasi PK 38% BK dan lemak 18,5% BK menjadikannya bahan pakan serba guna untuk semua jenis ternak produktif.' },
      { type: 'kelebihan', icon: '✅', text: 'Profil asam amino paling lengkap di antara biji-bijian lokal, terutama lisin yang sering menjadi faktor pembatas pada ransum berbasis jagung.' },
      { type: 'peringatan', icon: '🚨', text: 'Biji mentah mengandung tripsin inhibitor yang mengganggu pencernaan protein — wajib toasting sebelum diberikan, terutama untuk unggas dan babi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi klasik: Jagung + Kedelai Toasting sebagai basis konsentrat energi-protein untuk unggas dan babi; untuk ruminansia cukup 10–15% ransum konsentrat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga tinggi karena bersaing dengan kebutuhan pangan manusia — pertimbangkan sumber protein alternatif lokal seperti bungkil kelapa untuk menekan biaya.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif protein biji: Kacang Tanah (Biji) atau Kacang Komak, meski kadar protein sedikit lebih rendah dan profil asam amino kurang lengkap.' },
    ],
  },

  // ── 2. Kacang Tanah (Biji) ───────────────────────────────────────────────
  'kacang-tanah-biji': {
    deskripsi: 'Biji kacang tanah utuh dengan kandungan lemak sangat tinggi (40–50% BK) dan protein 25–28% BK. Umumnya hasil samping/afkir dari industri pengolahan minyak dan kacang konsumsi yang tidak memenuhi standar pangan, dimanfaatkan sebagai bahan pakan sumber energi dan protein.',
    alias: 'Groundnut, Peanut Seed, Kacang Tanah Biji',
    asal: 'Amerika Selatan (Brasil, Bolivia); dibudidayakan luas di seluruh Indonesia sebagai tanaman pangan',
    habitat: 'Dataran rendah hingga 500 mdpl; tanah berpasir lempung berdrainase baik; toleran kekeringan moderat',
    umurPanenIdeal: 'Panen pada umur 90–120 hari setelah tanam saat polong penuh dan kulit biji mengeras',
    bagianDimanfaatkan: 'Biji utuh (afkir/reject grade untuk pakan), kulit polong sebagai serat tambahan',
    produksi: '1,2–2,0 ton biji kering/ha/musim tanam',
    kelebihan: 'Energi sangat tinggi dari kandungan lemak (40–50% BK); protein cukup tinggi (25–28% BK); palatabilitas sangat baik untuk hampir semua ternak',
    kekurangan: 'Sangat rentan kontaminasi jamur Aspergillus flavus penghasil aflatoksin — wajib pemeriksaan kualitas; mudah tengik (rancid) karena kadar lemak tinggi jika disimpan lama',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 26.0, sk: 5.0, lk: 45.0, abu: 3.0, betn: 21.0,
      tdn: 95, me: 3800,
      ndf: 12.0, adf: 8.0,
      ca: 0.08, p: 0.35, mg: 0.20, na: 0.01, k: 0.75, cl: 0.03, s: 0.20,
      vitamin: 'Vitamin E tinggi; Niasin; Biotin',
      mineral: 'P sedang, Ca rendah — perlu suplementasi Ca. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi', 'Ayam Kampung'],
      programCocok: ['Penggemukan', 'Grower'],
      musimTerbaik: 'Tersedia pasca panen musim kering (Apr–Sep)',
      umurPanenTerbaik: 'Biji kering dengan kadar air <9%, bebas jamur dan bau tengik',
      catatan: 'Wajib periksa kontaminasi aflatoksin sebelum digunakan sebagai pakan. Batasi 10–15% ransum karena kadar lemak tinggi dapat mengganggu fermentasi rumen jika berlebihan.',
    },
    harga: {
      estimasiAI: 6000, hargaMarketplace: 8000,
      satuan: 'per kg biji kering', supplier: 'Petani kacang tanah / Grade afkir industri kacang',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2012) — Nutrient Requirements of Swine',
        'Feedipedia (2023) — Groundnut seeds, whole, INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Rata-rata Feedipedia dan Hartadi et al. 1997',
      catatan: 'Kualitas sangat tergantung penyimpanan; hindari biji yang sudah berjamur atau berbau tengik.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🥜', text: 'Kacang tanah biji adalah sumber energi terpekat di antara biji-bijian lokal — kandungan lemak 45% BK menjadikannya bahan densitas energi tinggi untuk fase penggemukan.' },
      { type: 'peringatan', icon: '🚨', text: 'Risiko aflatoksin dari jamur Aspergillus flavus sangat tinggi pada biji yang disimpan lembab — selalu periksa kualitas sebelum digunakan, terutama untuk ternak muda dan induk bunting.' },
      { type: 'kelebihan', icon: '✅', text: 'Kombinasi lemak dan protein tinggi membuatnya efisien sebagai suplemen energi-protein padat dalam jumlah kecil.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan sumber Ca (kapur/mineral premix) karena kadar Ca sangat rendah (0,08% BK).' },
      { type: 'kekurangan', icon: '⚠️', text: 'Mudah tengik karena kadar lemak tinggi — simpan di tempat kering, sejuk, dan gunakan dalam waktu singkat setelah dibuka.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif sumber energi-protein serupa: Biji Bunga Matahari atau Biji Wijen, dengan risiko aflatoksin lebih rendah.' },
    ],
  },

  // ── 3. Kacang Hijau ───────────────────────────────────────────────────────
  'kacang-hijau-biji': {
    deskripsi: 'Biji kacang hijau utuh dengan protein kasar 22–24% BK dan pati mudah cerna. Sering berupa afkir sortiran (biji pecah, ukuran tidak seragam) dari industri pengolahan pangan yang dimanfaatkan sebagai bahan pakan ternak.',
    alias: 'Mung Bean, Green Gram, Kacang Ijo',
    asal: 'Asia Selatan (India); dibudidayakan luas di Asia Tenggara termasuk Indonesia',
    habitat: 'Dataran rendah hingga 800 mdpl; tahan kekeringan; siklus tanam pendek (60–70 hari)',
    umurPanenIdeal: 'Panen pada umur 60–70 hari setelah tanam saat polong kering dan berwarna coklat kehitaman',
    bagianDimanfaatkan: 'Biji utuh (grade afkir/pecah untuk pakan)',
    produksi: '0,8–1,5 ton biji kering/ha/musim tanam',
    kelebihan: 'Protein cukup tinggi dengan pati mudah cerna; harga relatif terjangkau untuk grade afkir; tidak memiliki antinutrisi berbahaya dalam jumlah signifikan',
    kekurangan: 'Mengandung sedikit tripsin inhibitor pada biji mentah; ketersediaan grade pakan tergantung hasil sortiran industri sehingga tidak selalu konsisten',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 23.0, sk: 4.5, lk: 1.5, abu: 3.5, betn: 67.5,
      tdn: 78, me: 3120,
      ndf: 10.0, adf: 6.0,
      ca: 0.15, p: 0.38, mg: 0.20, na: 0.02, k: 1.10, cl: 0.03, s: 0.18,
      vitamin: 'Folat tinggi; Vitamin B1 dan B2',
      mineral: 'P dan K cukup tinggi. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Ayam Kampung', 'Babi', 'Kambing', 'Domba'],
      programCocok: ['Grower', 'Penggemukan'],
      musimTerbaik: 'Tersedia pasca panen (musim kemarau)',
      umurPanenTerbaik: 'Biji kering, bebas kutu dan jamur',
      catatan: 'Dapat diberikan utuh atau digiling untuk meningkatkan kecernaan pada unggas.',
    },
    harga: {
      estimasiAI: 5000, hargaMarketplace: 7000,
      satuan: 'per kg biji kering', supplier: 'Grade afkir industri pangan / Petani kacang hijau',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Mung bean, seeds, INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia dan Hartadi et al. 1997',
      catatan: 'Grade afkir memiliki nilai nutrisi yang mirip dengan grade konsumsi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🫘', text: 'Kacang hijau biji menyediakan pati mudah cerna dan protein sedang — cocok sebagai sumber energi-protein sekunder dalam ransum konsentrat.' },
      { type: 'kelebihan', icon: '✅', text: 'Tidak memiliki antinutrisi berbahaya dalam jumlah signifikan sehingga aman diberikan tanpa pengolahan khusus.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan sumber energi tinggi seperti Kacang Tanah untuk melengkapi profil energi ransum konsentrat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ketersediaan grade pakan tidak selalu konsisten karena bergantung hasil sortiran industri pangan.' },
      { type: 'peringatan', icon: '🚨', text: 'Hindari biji yang berjamur atau berkutu — periksa kualitas sebelum penyimpanan jangka panjang.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif serupa: Kacang Tunggak atau Kacang Merah dengan profil nutrisi yang sebanding.' },
    ],
  },

  // ── 4. Kacang Tunggak ─────────────────────────────────────────────────────
  'kacang-tunggak-biji': {
    deskripsi: 'Biji kacang tunggak (kacang tolo) dengan protein 22–25% BK, tahan kekeringan dan mudah dibudidayakan di lahan marginal. Digunakan sebagai suplemen protein-energi pada ransum ternak kecil dan unggas kampung.',
    alias: 'Cowpea Seed, Kacang Tolo',
    asal: 'Afrika Barat; dibudidayakan luas di Asia Tenggara termasuk Indonesia sebagai tanaman pangan tahan kering',
    habitat: 'Dataran rendah hingga 900 mdpl; sangat toleran kekeringan; tumbuh di tanah marginal berpasir',
    umurPanenIdeal: 'Panen pada umur 65–90 hari setelah tanam',
    bagianDimanfaatkan: 'Biji utuh (grade afkir untuk pakan)',
    produksi: '0,8–1,3 ton biji kering/ha/musim tanam',
    kelebihan: 'Tahan kekeringan sehingga produksi stabil di musim kemarau; protein cukup tinggi; harga relatif murah',
    kekurangan: 'Mengandung tripsin inhibitor tingkat rendah–sedang; kurang populer secara komersial sehingga pasokan grade pakan terbatas',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 23.5, sk: 5.5, lk: 1.8, abu: 3.8, betn: 65.4,
      tdn: 76, me: 3040,
      ndf: 12.0, adf: 7.5,
      ca: 0.14, p: 0.35, mg: 0.19, na: 0.02, k: 1.15, cl: 0.03, s: 0.17,
      vitamin: 'Folat sedang; Vitamin B kompleks',
      mineral: 'Profil mineral mirip kacang hijau. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Ayam Kampung', 'Kambing', 'Domba'],
      programCocok: ['Grower', 'Penggemukan'],
      musimTerbaik: 'Tersedia sepanjang tahun, melimpah pasca panen musim kering',
      umurPanenTerbaik: 'Biji kering bebas kutu dan jamur',
      catatan: 'Cocok sebagai suplemen protein sekunder di daerah kering yang minim akses leguminosa hijauan.',
    },
    harga: {
      estimasiAI: 4500, hargaMarketplace: 6500,
      satuan: 'per kg biji kering', supplier: 'Petani lokal daerah kering / Pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Cowpea, seeds, INRA-CIRAD-AFZ-FAO',
        'FAO (2018) — Feed Resources for Tropical Ruminants',
      ],
      sumberData: 'Feedipedia dan FAO',
      catatan: 'Nilai nutrisi dapat bervariasi antar varietas lokal.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🫘', text: 'Kacang tunggak biji cocok sebagai suplemen protein-energi di daerah kering di mana ketersediaan leguminosa hijauan terbatas.' },
      { type: 'kelebihan', icon: '✅', text: 'Sangat tahan kekeringan sehingga produksi stabil bahkan di musim kemarau panjang.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Pasokan grade pakan terbatas karena kurang dibudidayakan secara komersial dibanding kedelai atau kacang tanah.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan sumber energi seperti Sorgum atau Jewawut untuk ransum daerah kering yang lengkap.' },
      { type: 'peringatan', icon: '🚨', text: 'Kandungan tripsin inhibitor rendah–sedang; pemanasan ringan dapat meningkatkan kecernaan protein.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: Kacang Hijau atau Kacang Komak dengan nilai nutrisi yang sebanding.' },
    ],
  },

  // ── 5. Kacang Merah ───────────────────────────────────────────────────────
  'kacang-merah': {
    deskripsi: 'Biji kacang merah dengan protein 21–23% BK, umumnya berupa grade afkir sortiran industri pangan (biji pecah/cacat) yang dimanfaatkan sebagai bahan pakan sumber protein-energi.',
    alias: 'Red Kidney Bean, Kacang Merah',
    asal: 'Amerika Tengah dan Selatan; dibudidayakan di dataran tinggi Indonesia',
    habitat: 'Dataran tinggi 500–1.500 mdpl; suhu sejuk; tanah gembur subur',
    umurPanenIdeal: 'Panen pada umur 85–100 hari setelah tanam',
    bagianDimanfaatkan: 'Biji utuh (grade afkir untuk pakan)',
    produksi: '1,0–1,8 ton biji kering/ha/musim tanam',
    kelebihan: 'Protein cukup tinggi; pati mudah dicerna setelah pemasakan/pemanasan ringan',
    kekurangan: 'Mengandung lektin (phytohemagglutinin) pada biji mentah yang bersifat toksik bila tidak dipanaskan; wajib diolah dengan pemanasan sebelum diberikan',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 22.0, sk: 5.0, lk: 1.5, abu: 4.0, betn: 67.5,
      tdn: 75, me: 3000,
      ndf: 13.0, adf: 8.0,
      ca: 0.16, p: 0.36, mg: 0.22, na: 0.02, k: 1.30, cl: 0.03, s: 0.19,
      vitamin: 'Folat tinggi; Vitamin B1',
      mineral: 'K tinggi; profil mirip kacang-kacangan lain. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 10,
      targetTernak: ['Babi', 'Ayam Kampung'],
      programCocok: ['Grower'],
      musimTerbaik: 'Tersedia pasca panen dataran tinggi',
      umurPanenTerbaik: 'Biji kering, telah direbus/dipanaskan sebelum diberikan',
      catatan: 'Wajib direbus atau dipanaskan minimal 15 menit pada suhu >100°C untuk menghancurkan lektin sebelum diberikan ke ternak, terutama unggas dan babi.',
    },
    harga: {
      estimasiAI: 8000, hargaMarketplace: 12000,
      satuan: 'per kg biji kering', supplier: 'Grade afkir industri pangan / Pasar tradisional dataran tinggi',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Common bean, seeds, INRA-CIRAD-AFZ-FAO',
        'NRC (2012) — Nutrient Requirements of Swine',
      ],
      sumberData: 'Feedipedia dan NRC 2012',
      catatan: 'Lektin dapat dinetralkan sepenuhnya melalui pemanasan basah yang cukup.',
    },
    aiInsight: [
      { type: 'peringatan', icon: '🚨', text: 'Biji mentah mengandung lektin toksik (phytohemagglutinin) — wajib direbus/dipanaskan sebelum diberikan, terutama untuk unggas dan babi yang sensitif.' },
      { type: 'fungsi', icon: '🫘', text: 'Setelah diolah dengan benar, kacang merah menjadi sumber protein-energi yang baik untuk ransum konsentrat skala kecil.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga relatif mahal karena bersaing dengan kebutuhan pangan; penggunaan sebagai pakan biasanya terbatas pada grade afkir/reject.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan sebagai suplemen kecil (≤10% ransum) dikombinasikan dengan sumber energi utama seperti jagung atau sorgum.' },
      { type: 'kelebihan', icon: '✅', text: 'Pati mudah dicerna setelah dimasak, cocok untuk fase grower unggas dan babi.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih ekonomis: Kacang Hijau atau Kacang Tunggak yang tidak memerlukan pengolahan seintensif kacang merah.' },
    ],
  },

  // ── 6. Kacang Hitam ───────────────────────────────────────────────────────
  'kacang-hitam': {
    deskripsi: 'Biji kacang hitam (black gram) dengan protein 24–26% BK, digunakan sebagai suplemen protein pada ransum ternak kecil dan unggas, biasanya berasal dari grade afkir hasil sortiran.',
    alias: 'Black Gram, Urad Bean',
    asal: 'Asia Selatan (India); dibudidayakan terbatas di beberapa daerah Indonesia',
    habitat: 'Dataran rendah hingga 600 mdpl; tanah lempung berdrainase baik',
    umurPanenIdeal: 'Panen pada umur 70–90 hari setelah tanam',
    bagianDimanfaatkan: 'Biji utuh (grade afkir untuk pakan)',
    produksi: '0,6–1,2 ton biji kering/ha/musim tanam',
    kelebihan: 'Protein tinggi dibanding kacang hijau; kandungan mucilago yang membantu pencernaan',
    kekurangan: 'Mengandung tripsin inhibitor ringan; ketersediaan komersial di Indonesia masih terbatas',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 25.0, sk: 4.8, lk: 1.6, abu: 3.6, betn: 65.0,
      tdn: 77, me: 3080,
      ndf: 11.0, adf: 6.5,
      ca: 0.16, p: 0.40, mg: 0.21, na: 0.02, k: 1.20, cl: 0.03, s: 0.19,
      vitamin: 'Folat tinggi; Vitamin B kompleks',
      mineral: 'P cukup tinggi. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Ayam Kampung', 'Babi', 'Kambing'],
      programCocok: ['Grower'],
      musimTerbaik: 'Tersedia terbatas, tergantung sentra produksi',
      umurPanenTerbaik: 'Biji kering bebas kutu dan jamur',
      catatan: 'Dapat digiling untuk meningkatkan kecernaan pada unggas.',
    },
    harga: {
      estimasiAI: 9000, hargaMarketplace: 13000,
      satuan: 'per kg biji kering', supplier: 'Impor / Toko bahan pangan khusus',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Black gram, seeds, INRA-CIRAD-AFZ-FAO',
      ],
      sumberData: 'Feedipedia',
      catatan: 'Data terbatas untuk konteks Indonesia karena budidaya belum meluas.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🫘', text: 'Kacang hitam biji menawarkan protein lebih tinggi dari kacang hijau, menjadikannya suplemen protein sekunder yang baik jika tersedia.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ketersediaan komersial di Indonesia masih terbatas — harga relatif tinggi dibanding kacang lokal lainnya.' },
      { type: 'kelebihan', icon: '✅', text: 'Kandungan mucilago membantu melancarkan pencernaan pada ternak muda.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan sumber energi lokal (jagung/sorgum) jika digunakan sebagai suplemen protein utama.' },
      { type: 'peringatan', icon: '🚨', text: 'Periksa kualitas biji dari kontaminasi jamur, terutama jika berasal dari stok impor yang disimpan lama.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih terjangkau: Kacang Hijau atau Kacang Tunggak dengan ketersediaan lokal lebih luas.' },
    ],
  },

  // ── 7. Kacang Bogor ───────────────────────────────────────────────────────
  'kacang-bogor': {
    deskripsi: 'Biji kacang bogor (Bambara groundnut) dengan protein 18–20% BK dan lemak sedang, tanaman lokal yang tahan kekeringan dan tanah marginal, dimanfaatkan sebagai suplemen pakan di daerah sentra produksinya.',
    alias: 'Bambara Groundnut, Kacang Bogor',
    asal: 'Afrika Barat; dibudidayakan terbatas di Jawa Barat (Bogor) dan beberapa daerah Indonesia lainnya',
    habitat: 'Dataran rendah hingga 1.000 mdpl; toleran tanah marginal dan kekeringan',
    umurPanenIdeal: 'Panen pada umur 90–120 hari setelah tanam',
    bagianDimanfaatkan: 'Biji utuh (grade afkir untuk pakan)',
    produksi: '0,6–1,0 ton biji kering/ha/musim tanam',
    kelebihan: 'Tahan kekeringan dan tanah marginal; kandungan energi dan protein seimbang',
    kekurangan: 'Skala budidaya kecil sehingga pasokan pakan terbatas dan harga relatif tinggi',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 19.0, sk: 6.5, lk: 6.0, abu: 3.8, betn: 64.7,
      tdn: 74, me: 2960,
      ndf: 14.0, adf: 9.0,
      ca: 0.13, p: 0.30, mg: 0.18, na: 0.02, k: 1.05, cl: 0.03, s: 0.16,
      vitamin: 'Vitamin B kompleks sedang',
      mineral: 'Profil mineral moderat. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 15,
      targetTernak: ['Ayam Kampung', 'Kambing'],
      programCocok: ['Grower'],
      musimTerbaik: 'Tersedia terbatas pasca panen',
      umurPanenTerbaik: 'Biji kering bebas jamur',
      catatan: 'Cocok sebagai suplemen di daerah sentra produksi karena harga limbah/afkir lebih murah dari harga pasar konsumsi.',
    },
    harga: {
      estimasiAI: 7000, hargaMarketplace: 10000,
      satuan: 'per kg biji kering', supplier: 'Petani lokal Jawa Barat / Pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Bambara groundnut, seeds, INRA-CIRAD-AFZ-FAO',
      ],
      sumberData: 'Feedipedia',
      catatan: 'Data spesifik Indonesia masih terbatas; nilai merujuk referensi regional Afrika-Asia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🫘', text: 'Kacang bogor menawarkan keseimbangan energi-protein sedang, cocok sebagai suplemen lokal di daerah sentra produksinya.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Skala budidaya kecil membuat pasokan untuk pakan tidak stabil dan harga relatif mahal dibanding kacang tanah.' },
      { type: 'kelebihan', icon: '✅', text: 'Sangat tahan kekeringan dan tanah marginal — pilihan baik untuk daerah yang sulit menanam kacang lain.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan sebagai pelengkap sumber protein utama (kedelai/kacang tanah) bila tersedia di daerah setempat.' },
      { type: 'peringatan', icon: '🚨', text: 'Pastikan biji kering sempurna sebelum disimpan untuk mencegah pertumbuhan jamur.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih umum tersedia: Kacang Tanah (Biji) dengan kandungan energi lebih tinggi.' },
    ],
  },

  // ── 8. Kacang Gude ────────────────────────────────────────────────────────
  'kacang-gude': {
    deskripsi: 'Biji kacang gude (pigeon pea) dengan protein 20–22% BK, tanaman leguminosa tahunan yang tahan kekeringan, bijinya dimanfaatkan sebagai suplemen pakan sumber protein di daerah kering.',
    alias: 'Pigeon Pea, Kacang Gude, Kacang Kayo',
    asal: 'Asia Selatan; dibudidayakan di berbagai daerah kering di Indonesia (Nusa Tenggara, Jawa)',
    habitat: 'Dataran rendah hingga 1.500 mdpl; sangat toleran kekeringan; tumbuh di tanah marginal',
    umurPanenIdeal: 'Panen pada umur 120–180 hari setelah tanam (tergantung varietas)',
    bagianDimanfaatkan: 'Biji utuh (grade afkir untuk pakan)',
    produksi: '0,8–1,5 ton biji kering/ha/musim tanam',
    kelebihan: 'Tahan kekeringan ekstrem; tanaman tahunan sehingga produksi dapat berulang tanpa tanam ulang; protein cukup baik',
    kekurangan: 'Mengandung tripsin inhibitor ringan; waktu panen relatif lama dibanding kacang semusim lain',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 21.0, sk: 7.0, lk: 1.8, abu: 3.5, betn: 66.7,
      tdn: 73, me: 2920,
      ndf: 15.0, adf: 10.0,
      ca: 0.14, p: 0.32, mg: 0.19, na: 0.02, k: 1.10, cl: 0.03, s: 0.17,
      vitamin: 'Vitamin B kompleks sedang; Folat',
      mineral: 'Profil mineral moderat. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 15,
      targetTernak: ['Kambing', 'Domba', 'Ayam Kampung'],
      programCocok: ['Grower', 'Penggemukan'],
      musimTerbaik: 'Tersedia sepanjang tahun di daerah sentra kering',
      umurPanenTerbaik: 'Biji kering bebas kutu dan jamur',
      catatan: 'Sangat cocok untuk peternak di daerah kering (NTT, NTB) yang minim akses hijauan berkualitas.',
    },
    harga: {
      estimasiAI: 5500, hargaMarketplace: 7500,
      satuan: 'per kg biji kering', supplier: 'Petani lokal daerah kering / Koperasi tani',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Pigeon pea, seeds, INRA-CIRAD-AFZ-FAO',
        'FAO (2018) — Feed Resources for Tropical Ruminants',
      ],
      sumberData: 'Feedipedia dan FAO',
      catatan: 'Nilai nutrisi bervariasi tergantung varietas lokal dan umur panen.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🫘', text: 'Kacang gude adalah suplemen protein andalan untuk peternakan di daerah kering ekstrem seperti NTT dan NTB.' },
      { type: 'kelebihan', icon: '✅', text: 'Sebagai tanaman tahunan, kacang gude dapat dipanen berulang tanpa perlu tanam ulang setiap musim — efisien untuk peternak skala kecil.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan Sorgum atau Jewawut sebagai basis ransum daerah kering yang lengkap energi-protein.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Waktu panen relatif lama (120–180 hari) dibanding kacang hijau atau kacang tunggak yang lebih cepat.' },
      { type: 'peringatan', icon: '🚨', text: 'Tripsin inhibitor ringan tetap ada — pemanasan ringan dapat meningkatkan kecernaan protein pada unggas.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif serupa untuk daerah kering: Kacang Tunggak dengan siklus panen lebih pendek.' },
    ],
  },

  // ── 9. Kacang Komak ───────────────────────────────────────────────────────
  'kacang-komak': {
    deskripsi: 'Biji kacang komak (hyacinth bean) dengan protein 22–25% BK, tanaman merambat multiguna yang bijinya dimanfaatkan sebagai suplemen pakan protein setelah pemasakan untuk menghilangkan sianida.',
    alias: 'Hyacinth Bean, Kacang Komak, Lablab',
    asal: 'Afrika Timur; dibudidayakan di berbagai daerah Indonesia sebagai tanaman pekarangan',
    habitat: 'Dataran rendah hingga 1.500 mdpl; toleran berbagai jenis tanah; tumbuh merambat',
    umurPanenIdeal: 'Panen pada umur 90–120 hari setelah tanam',
    bagianDimanfaatkan: 'Biji utuh (setelah dimasak) untuk pakan',
    produksi: '0,7–1,2 ton biji kering/ha/musim tanam',
    kelebihan: 'Protein tinggi; tanaman mudah dibudidayakan di pekarangan tanpa perawatan intensif',
    kekurangan: 'Biji mentah mengandung glikosida sianogenik — wajib direbus/dimasak sebelum diberikan untuk menghilangkan HCN',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 23.5, sk: 5.5, lk: 1.7, abu: 3.7, betn: 65.6,
      tdn: 76, me: 3040,
      ndf: 12.5, adf: 7.5,
      ca: 0.15, p: 0.34, mg: 0.20, na: 0.02, k: 1.15, cl: 0.03, s: 0.18,
      vitamin: 'Vitamin B kompleks sedang',
      mineral: 'Profil mineral moderat. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 15,
      targetTernak: ['Kambing', 'Domba', 'Ayam Kampung'],
      programCocok: ['Grower'],
      musimTerbaik: 'Tersedia sepanjang tahun di daerah pekarangan',
      umurPanenTerbaik: 'Biji kering, wajib dimasak sebelum diberikan',
      catatan: 'Rebus minimal 20–30 menit untuk menghilangkan glikosida sianogenik sebelum diberikan ke ternak.',
    },
    harga: {
      estimasiAI: 5000, hargaMarketplace: 7000,
      satuan: 'per kg biji kering', supplier: 'Petani pekarangan / Pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Hyacinth bean, seeds, INRA-CIRAD-AFZ-FAO',
      ],
      sumberData: 'Feedipedia',
      catatan: 'Kadar sianogenik menurun signifikan setelah dimasak dengan air mendidih.',
    },
    aiInsight: [
      { type: 'peringatan', icon: '🚨', text: 'Biji mentah mengandung glikosida sianogenik (HCN) — wajib direbus tuntas sebelum diberikan untuk mencegah toksisitas akut pada ternak.' },
      { type: 'fungsi', icon: '🫘', text: 'Setelah diolah dengan benar, kacang komak menjadi suplemen protein yang baik dan mudah dibudidayakan di pekarangan tanpa perawatan intensif.' },
      { type: 'kelebihan', icon: '✅', text: 'Tanaman merambat multiguna — dapat ditanam di pagar atau lahan sempit sebagai sumber protein tambahan tanpa memerlukan lahan luas.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan hijauan leguminosa untuk melengkapi kebutuhan protein ternak kecil di skala rumah tangga.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Proses perebusan menambah waktu dan tenaga kerja dibanding biji-bijian yang bisa diberikan langsung.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif tanpa risiko sianida: Kacang Tunggak atau Kacang Hijau yang dapat diberikan tanpa pemasakan intensif.' },
    ],
  },

  // ── 10. Kacang Koro Pedang ────────────────────────────────────────────────
  'kacang-koro-pedang': {
    deskripsi: 'Biji kacang koro pedang berukuran besar dengan protein 24–28% BK, berpotensi sebagai substitusi kedelai namun mengandung konsentrasi antinutrisi (lektin, asam sianogenik) yang lebih tinggi sehingga memerlukan pengolahan lebih intensif.',
    alias: 'Sword Bean, Jack Bean, Koro Pedang',
    asal: 'Asia Tenggara dan Amerika Tropis; dibudidayakan di beberapa daerah Indonesia sebagai tanaman alternatif kedelai',
    habitat: 'Dataran rendah hingga 1.000 mdpl; toleran tanah marginal dan kekeringan; tanaman merambat kuat',
    umurPanenIdeal: 'Panen pada umur 150–200 hari setelah tanam',
    bagianDimanfaatkan: 'Biji utuh (setelah direndam dan dimasak) untuk pakan',
    produksi: '1,0–2,0 ton biji kering/ha/musim tanam',
    kelebihan: 'Protein tinggi mendekati kedelai; sangat tahan kekeringan dan hama; potensi lokal sebagai substitusi kedelai impor',
    kekurangan: 'Kandungan antinutrisi (lektin, glikosida sianogenik, asam konkanavalin) lebih tinggi dari kedelai — memerlukan perendaman dan pemasakan berulang sebelum diberikan',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 26.0, sk: 6.0, lk: 3.0, abu: 3.5, betn: 61.5,
      tdn: 74, me: 2960,
      ndf: 14.0, adf: 9.0,
      ca: 0.16, p: 0.38, mg: 0.22, na: 0.02, k: 1.20, cl: 0.03, s: 0.20,
      vitamin: 'Vitamin B kompleks sedang',
      mineral: 'Profil mineral moderat. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 10,
      targetTernak: ['Kambing', 'Domba', 'Babi'],
      programCocok: ['Grower'],
      musimTerbaik: 'Tersedia terbatas, pasca panen musim kering',
      umurPanenTerbaik: 'Biji kering, wajib direndam dan dimasak sebelum diberikan',
      catatan: 'Rendam biji 24 jam dan rebus tuntas sebelum diberikan untuk menghilangkan antinutrisi. Belum direkomendasikan untuk unggas karena risiko toksisitas.',
    },
    harga: {
      estimasiAI: 4500, hargaMarketplace: 6500,
      satuan: 'per kg biji kering', supplier: 'Petani daerah kering / Riset dan pengembangan pangan lokal',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Jack bean, seeds, INRA-CIRAD-AFZ-FAO',
        'Doss, A. et al. (2011) — Nutritional Value of Canavalia ensiformis, J. Appl. Sci.',
      ],
      sumberData: 'Feedipedia dan literatur ilmiah terkait Canavalia ensiformis',
      catatan: 'Riset lokal Indonesia tentang koro pedang sebagai pakan masih terus berkembang.',
    },
    aiInsight: [
      { type: 'peringatan', icon: '🚨', text: 'Kandungan antinutrisi (lektin, glikosida sianogenik) lebih tinggi dari kedelai — wajib direndam 24 jam dan direbus tuntas sebelum diberikan.' },
      { type: 'fungsi', icon: '🫘', text: 'Koro pedang berpotensi sebagai substitusi lokal kedelai impor karena protein tinggi dan ketahanan tanaman yang sangat baik.' },
      { type: 'kelebihan', icon: '✅', text: 'Sangat tahan kekeringan dan hama, sehingga biaya budidaya rendah dibanding kedelai.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Proses pengolahan yang intensif (rendam + rebus berulang) menambah biaya tenaga kerja dan waktu persiapan pakan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Setelah diolah, dapat menggantikan sebagian kedelai dalam ransum ruminansia dan babi (maksimal 10% ransum).' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk unggas, gunakan Kedelai toasting yang lebih aman daripada koro pedang yang belum banyak diuji untuk unggas.' },
    ],
  },

  // ── 11. Kacang Arab ───────────────────────────────────────────────────────
  'kacang-arab': {
    deskripsi: 'Biji kacang arab (chickpea) dengan protein 20–22% BK dan energi tinggi, umumnya berupa produk impor grade afkir yang dimanfaatkan sebagai suplemen pakan sumber protein-energi premium.',
    alias: 'Chickpea, Garbanzo Bean, Kacang Arab',
    asal: 'Timur Tengah dan Asia Selatan; sebagian besar dipasok Indonesia melalui impor',
    habitat: 'Daerah beriklim sedang-kering; tidak umum dibudidayakan secara luas di Indonesia',
    umurPanenIdeal: 'Panen pada umur 90–120 hari setelah tanam (di negara produsen)',
    bagianDimanfaatkan: 'Biji utuh (grade afkir impor untuk pakan)',
    produksi: 'Tidak dibudidayakan secara komersial di Indonesia; sepenuhnya impor',
    kelebihan: 'Protein dan energi tinggi; tidak memiliki antinutrisi berbahaya dalam jumlah signifikan',
    kekurangan: 'Harga tinggi karena sepenuhnya impor; ketersediaan tidak stabil dan tidak ekonomis untuk pakan skala besar',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 21.0, sk: 5.5, lk: 5.0, abu: 3.0, betn: 65.5,
      tdn: 80, me: 3200,
      ndf: 12.0, adf: 7.0,
      ca: 0.13, p: 0.35, mg: 0.16, na: 0.02, k: 0.95, cl: 0.03, s: 0.17,
      vitamin: 'Folat sangat tinggi; Vitamin B kompleks',
      mineral: 'Profil mineral moderat. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 10,
      targetTernak: ['Babi', 'Ayam Kampung'],
      programCocok: ['Grower'],
      musimTerbaik: 'Tersedia sepanjang tahun melalui pasokan impor',
      umurPanenTerbaik: 'Biji kering bebas kutu dan jamur',
      catatan: 'Umumnya digunakan sebagai suplemen premium skala kecil karena harga tinggi; kurang ekonomis untuk penggunaan besar.',
    },
    harga: {
      estimasiAI: 15000, hargaMarketplace: 20000,
      satuan: 'per kg biji kering', supplier: 'Importir bahan pangan / Toko bahan pakan khusus',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Chickpea, seeds, INRA-CIRAD-AFZ-FAO',
      ],
      sumberData: 'Feedipedia',
      catatan: 'Nilai berdasarkan referensi produk impor karena tidak dibudidayakan luas di Indonesia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🫘', text: 'Kacang arab adalah bahan pakan protein-energi premium impor yang jarang digunakan secara komersial karena harganya.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga sangat tinggi dan ketersediaan tergantung impor — tidak ekonomis untuk ransum pakan skala besar.' },
      { type: 'kelebihan', icon: '✅', text: 'Tidak memiliki antinutrisi berbahaya dalam jumlah signifikan, aman diberikan tanpa pengolahan khusus.' },
      { type: 'kombinasi', icon: '🔗', text: 'Jika digunakan, batasi sebagai suplemen kecil (≤10% ransum) karena biaya, bukan sebagai komponen utama.' },
      { type: 'peringatan', icon: '🚨', text: 'Periksa asal dan kualitas biji impor untuk memastikan bebas kontaminasi selama penyimpanan/pengiriman.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lokal yang jauh lebih ekonomis: Kacang Hijau, Kacang Tunggak, atau Kacang Tanah (Biji).' },
    ],
  },

  // ── 12. Kacang Lentil ─────────────────────────────────────────────────────
  'kacang-lentil': {
    deskripsi: 'Biji kacang lentil dengan protein 24–26% BK, produk impor yang jarang digunakan sebagai pakan ternak karena harga tinggi, namun berpotensi sebagai suplemen protein premium skala kecil.',
    alias: 'Lentil, Kacang Lentil',
    asal: 'Timur Tengah dan Asia Selatan; seluruhnya dipasok Indonesia melalui impor',
    habitat: 'Daerah beriklim sedang; tidak dibudidayakan di Indonesia',
    umurPanenIdeal: 'Panen pada umur 80–110 hari setelah tanam (di negara produsen)',
    bagianDimanfaatkan: 'Biji utuh (grade afkir impor untuk pakan)',
    produksi: 'Tidak dibudidayakan di Indonesia; sepenuhnya impor',
    kelebihan: 'Protein tinggi; profil asam amino baik',
    kekurangan: 'Harga sangat tinggi karena impor; tidak ekonomis untuk pakan skala besar',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 25.0, sk: 4.5, lk: 1.2, abu: 3.0, betn: 66.3,
      tdn: 78, me: 3120,
      ndf: 11.0, adf: 6.0,
      ca: 0.11, p: 0.37, mg: 0.16, na: 0.02, k: 0.90, cl: 0.03, s: 0.20,
      vitamin: 'Folat sangat tinggi; Vitamin B1',
      mineral: 'Profil mineral moderat. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 10,
      targetTernak: ['Babi', 'Ayam Kampung'],
      programCocok: ['Grower'],
      musimTerbaik: 'Tersedia sepanjang tahun melalui pasokan impor',
      umurPanenTerbaik: 'Biji kering bebas kutu dan jamur',
      catatan: 'Digunakan sebagai suplemen protein premium skala kecil; tidak ekonomis untuk penggunaan rutin skala besar.',
    },
    harga: {
      estimasiAI: 18000, hargaMarketplace: 25000,
      satuan: 'per kg biji kering', supplier: 'Importir bahan pangan / Toko bahan pakan khusus',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Lentil, seeds, INRA-CIRAD-AFZ-FAO',
      ],
      sumberData: 'Feedipedia',
      catatan: 'Nilai berdasarkan referensi produk impor karena tidak dibudidayakan di Indonesia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🫘', text: 'Kacang lentil menawarkan protein tinggi dengan profil asam amino baik, namun jarang dipakai untuk pakan karena harganya.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga sangat tinggi karena seluruhnya impor — hanya ekonomis sebagai suplemen skala sangat kecil.' },
      { type: 'kelebihan', icon: '✅', text: 'Tidak memerlukan pengolahan khusus dan aman diberikan langsung setelah digiling.' },
      { type: 'kombinasi', icon: '🔗', text: 'Bila digunakan, kombinasikan sebagai suplemen kecil untuk fase kritis (grower) dengan basis energi dari sumber lokal.' },
      { type: 'peringatan', icon: '🚨', text: 'Pastikan sumber lentil bebas dari residu pestisida pasca panen sesuai standar impor.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif protein lokal jauh lebih ekonomis: Kedelai atau Kacang Hijau.' },
    ],
  },

  // ── 13. Biji Kapuk ────────────────────────────────────────────────────────
  'biji-kapuk': {
    deskripsi: 'Biji kapuk merupakan hasil samping industri serat kapuk dengan protein 25–30% BK dan lemak tinggi. Bentuk mentahnya mengandung gossypol-like compound sehingga penggunaannya sebagai pakan langsung terbatas dan biasanya diproses lebih lanjut menjadi bungkil.',
    alias: 'Kapok Seed, Biji Kapuk, Ceiba Seed',
    asal: 'Amerika Tropis; dibudidayakan luas di Jawa dan Sumatra sebagai tanaman serat',
    habitat: 'Dataran rendah hingga 800 mdpl; tumbuh di berbagai jenis tanah; pohon besar tahan kekeringan',
    umurPanenIdeal: 'Panen buah kapuk matang pada musim kering, biji dipisahkan dari serat',
    bagianDimanfaatkan: 'Biji utuh (sebagai hasil samping pemisahan serat kapuk)',
    produksi: 'Bervariasi tergantung produksi serat kapuk; sebagai hasil samping bukan produk utama',
    kelebihan: 'Protein cukup tinggi; harga sangat murah sebagai hasil samping industri serat',
    kekurangan: 'Mengandung senyawa mirip gossypol pada minyak biji yang dapat bersifat toksik dalam jumlah besar; wajib penggunaan terbatas dan hati-hati; lebih umum diproses lanjut menjadi bungkil dengan perlakuan khusus',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 91, kadarAir: 9,
      pk: 28.0, sk: 20.0, lk: 20.0, abu: 5.0, betn: 27.0,
      tdn: 68, me: 2720,
      ndf: 35.0, adf: 25.0,
      ca: 0.30, p: 0.60, mg: 0.30, na: 0.03, k: 1.10, cl: 0.05, s: 0.25,
      vitamin: 'Vitamin E dari kandungan minyak',
      mineral: 'P organik tinggi dengan ketersediaan terbatas. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 8,
      targetTernak: ['Sapi Potong', 'Kambing'],
      programCocok: ['Penggemukan'],
      musimTerbaik: 'Tersedia pasca panen kapuk (musim kering)',
      umurPanenTerbaik: 'Biji kering dari buah kapuk matang penuh',
      catatan: 'Batasi maksimal 5–8% ransum karena senyawa mirip gossypol; tidak direkomendasikan untuk ternak muda, bunting, atau unggas.',
    },
    harga: {
      estimasiAI: 1500, hargaMarketplace: 2500,
      satuan: 'per kg biji kering', supplier: 'Industri pengolahan serat kapuk / Petani kapuk',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Kapok seeds, INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia dan Hartadi et al. 1997',
      catatan: 'Kandungan gossypol-like compound bervariasi antar varietas kapuk.',
    },
    aiInsight: [
      { type: 'peringatan', icon: '🚨', text: 'Mengandung senyawa mirip gossypol yang bersifat toksik dalam jumlah besar — batasi ketat maksimal 5–8% ransum dan hindari untuk ternak muda/bunting.' },
      { type: 'fungsi', icon: '🌰', text: 'Sebagai hasil samping industri serat kapuk, biji kapuk menawarkan protein dan energi dengan biaya sangat murah bagi ruminansia dewasa.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga sangat terjangkau karena merupakan hasil samping, bukan produk utama yang dibudidayakan khusus.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kadar serat kasar tinggi (20% BK) membatasi kecernaan; kurang cocok untuk ternak monogastrik.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dalam jumlah kecil dengan sumber protein aman lain seperti bungkil kelapa untuk mengurangi risiko akumulasi toksin.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk sumber protein-lemak biji yang lebih aman: Biji Bunga Matahari atau Biji Wijen.' },
    ],
  },

  // ── 14. Biji Bunga Matahari ───────────────────────────────────────────────
  'biji-bunga-matahari': {
    deskripsi: 'Biji bunga matahari utuh dengan protein 16–20% BK dan lemak sangat tinggi (25–30% BK), sumber energi dan asam lemak esensial yang baik untuk ternak, terutama unggas dan sapi perah.',
    alias: 'Sunflower Seed, Biji Bunga Matahari',
    asal: 'Amerika Utara; dibudidayakan terbatas di beberapa daerah Indonesia (Jawa Tengah, NTT)',
    habitat: 'Dataran rendah hingga 1.500 mdpl; tanah subur berdrainase baik; butuh sinar matahari penuh',
    umurPanenIdeal: 'Panen pada umur 90–100 hari setelah tanam saat kepala bunga mengering',
    bagianDimanfaatkan: 'Biji utuh (dengan atau tanpa kulit)',
    produksi: '1,0–1,8 ton biji kering/ha/musim tanam',
    kelebihan: 'Kaya asam lemak esensial (omega-6); serat kulit biji bermanfaat untuk kecernaan ruminansia; energi tinggi',
    kekurangan: 'Harga cukup tinggi karena skala budidaya lokal kecil; kadar lemak tinggi membutuhkan pembatasan penggunaan',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 93, kadarAir: 7,
      pk: 18.0, sk: 16.0, lk: 28.0, abu: 4.0, betn: 34.0,
      tdn: 85, me: 3400,
      ndf: 30.0, adf: 22.0,
      ca: 0.15, p: 0.55, mg: 0.35, na: 0.02, k: 0.90, cl: 0.04, s: 0.22,
      vitamin: 'Vitamin E sangat tinggi; Vitamin B1',
      mineral: 'P dan Mg tinggi. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Perah', 'Ayam Kampung', 'Kambing'],
      programCocok: ['Menyusui', 'Grower'],
      musimTerbaik: 'Tersedia pasca panen musim kering',
      umurPanenTerbaik: 'Biji kering dengan kadar air <10%',
      catatan: 'Sangat baik sebagai suplemen energi-lemak untuk sapi perah karena meningkatkan kualitas lemak susu; batasi 10–15% ransum.',
    },
    harga: {
      estimasiAI: 7500, hargaMarketplace: 10000,
      satuan: 'per kg biji kering', supplier: 'Petani lokal / Distributor pakan unggas',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Sunflower seeds, whole, INRA-CIRAD-AFZ-FAO',
        'NRC (2001) — Nutrient Requirements of Dairy Cattle',
      ],
      sumberData: 'Feedipedia dan NRC 2001',
      catatan: 'Nilai bervariasi tergantung proporsi kulit biji yang ikut tergiling.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌻', text: 'Biji bunga matahari adalah sumber energi-lemak berkualitas tinggi dengan asam lemak esensial omega-6 yang mendukung kualitas produk susu dan daging.' },
      { type: 'kelebihan', icon: '✅', text: 'Serat kulit biji bermanfaat untuk fungsi rumen ruminansia sekaligus menyediakan energi dari kandungan lemak tinggi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan sumber protein seperti kedelai dalam ransum sapi perah untuk hasil susu dan kualitas lemak optimal.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Skala budidaya lokal masih kecil sehingga harga relatif tinggi dibanding sumber energi lain seperti jagung.' },
      { type: 'peringatan', icon: '🚨', text: 'Batasi 10–15% ransum karena kadar lemak tinggi dapat mengganggu fermentasi rumen bila berlebihan.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif sumber lemak-energi: Biji Wijen atau Kacang Tanah (Biji), tergantung ketersediaan lokal.' },
    ],
  },

  // ── 15. Biji Wijen ────────────────────────────────────────────────────────
  'biji-wijen': {
    deskripsi: 'Biji wijen dengan protein 18–20% BK dan lemak sangat tinggi (45–50% BK), sumber energi dan mineral (terutama kalsium) yang baik, umumnya digunakan sebagai suplemen bernilai tinggi dalam jumlah kecil.',
    alias: 'Sesame Seed, Biji Wijen',
    asal: 'Afrika dan Asia Selatan; dibudidayakan di beberapa daerah Indonesia (Jawa, NTT)',
    habitat: 'Dataran rendah hingga 800 mdpl; tahan kekeringan; tanah berdrainase baik',
    umurPanenIdeal: 'Panen pada umur 90–120 hari setelah tanam',
    bagianDimanfaatkan: 'Biji utuh',
    produksi: '0,5–1,0 ton biji kering/ha/musim tanam',
    kelebihan: 'Kalsium sangat tinggi di antara biji-bijian; energi tinggi dari kandungan lemak; kaya antioksidan (sesamin, sesamol)',
    kekurangan: 'Harga cukup tinggi karena bersaing dengan industri minyak dan pangan; produksi lokal masih terbatas',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 94, kadarAir: 6,
      pk: 19.0, sk: 8.0, lk: 48.0, abu: 5.5, betn: 19.5,
      tdn: 90, me: 3600,
      ndf: 18.0, adf: 12.0,
      ca: 1.20, p: 0.65, mg: 0.35, na: 0.03, k: 0.55, cl: 0.03, s: 0.24,
      vitamin: 'Vitamin E tinggi; antioksidan sesamin dan sesamol',
      mineral: 'Ca sangat tinggi (1,2% BK) — salah satu tertinggi di antara biji-bijian. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 8,
      targetTernak: ['Sapi Perah', 'Ayam Kampung', 'Kambing'],
      programCocok: ['Menyusui'],
      musimTerbaik: 'Tersedia pasca panen musim kering',
      umurPanenTerbaik: 'Biji kering dengan kadar air <8%',
      catatan: 'Digunakan sebagai suplemen mineral-energi dalam jumlah kecil (5–8% ransum) karena kadar lemak sangat tinggi.',
    },
    harga: {
      estimasiAI: 20000, hargaMarketplace: 28000,
      satuan: 'per kg biji kering', supplier: 'Petani lokal / Toko bahan pangan sehat',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Sesame seeds, whole, INRA-CIRAD-AFZ-FAO',
      ],
      sumberData: 'Feedipedia',
      catatan: 'Harga tinggi karena kompetisi dengan industri minyak wijen dan pangan premium.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚪', text: 'Biji wijen menonjol dengan kandungan kalsium tertinggi di antara biji-bijian pakan (1,2% BK), menjadikannya suplemen mineral-energi unik.' },
      { type: 'kelebihan', icon: '✅', text: 'Kaya antioksidan alami (sesamin, sesamol) yang dapat mendukung stabilitas oksidatif ransum berlemak tinggi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga sangat tinggi karena bersaing dengan industri minyak wijen premium — penggunaan sebagai pakan terbatas pada skala kecil.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan sumber P (dedak padi) karena rasio Ca:P wijen cukup tinggi (≈1,8:1).' },
      { type: 'peringatan', icon: '🚨', text: 'Batasi 5–8% ransum karena kadar lemak sangat tinggi (48% BK) dapat mengganggu pencernaan bila berlebihan.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk suplemen kalsium lebih ekonomis: gunakan mineral premix komersial dan pertahankan wijen sebagai suplemen tambahan opsional.' },
    ],
  },

  // ── 16. Biji Rami (Flaxseed) ──────────────────────────────────────────────
  'biji-rami': {
    deskripsi: 'Biji rami (flaxseed/linseed) dengan protein 20–22% BK dan lemak tinggi kaya asam lemak omega-3, digunakan sebagai suplemen premium untuk meningkatkan profil asam lemak produk hewani.',
    alias: 'Flaxseed, Linseed, Biji Rami',
    asal: 'Timur Tengah dan Asia Tengah; sebagian besar dipasok Indonesia melalui impor, budidaya lokal masih sangat terbatas',
    habitat: 'Daerah beriklim sedang; belum umum dibudidayakan luas di Indonesia',
    umurPanenIdeal: 'Panen pada umur 90–110 hari setelah tanam (di negara produsen)',
    bagianDimanfaatkan: 'Biji utuh (utuh atau digiling)',
    produksi: 'Sebagian besar dipasok melalui impor; budidaya lokal sangat terbatas',
    kelebihan: 'Kaya asam lemak omega-3 (ALA) tertinggi di antara biji-bijian nabati; meningkatkan kualitas nutrisi susu dan telur',
    kekurangan: 'Mengandung glikosida sianogenik dalam jumlah kecil pada biji mentah; harga tinggi karena impor',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 93, kadarAir: 7,
      pk: 21.0, sk: 7.0, lk: 40.0, abu: 4.0, betn: 28.0,
      tdn: 88, me: 3520,
      ndf: 22.0, adf: 16.0,
      ca: 0.25, p: 0.60, mg: 0.40, na: 0.02, k: 0.85, cl: 0.03, s: 0.25,
      vitamin: 'Vitamin E tinggi; Lignan (fitoestrogen)',
      mineral: 'Mg dan P cukup tinggi. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 8,
      targetTernak: ['Sapi Perah', 'Ayam Kampung'],
      programCocok: ['Menyusui'],
      musimTerbaik: 'Tersedia sepanjang tahun melalui pasokan impor',
      umurPanenTerbaik: 'Biji kering, sebaiknya digiling kasar sesaat sebelum diberikan untuk menjaga stabilitas omega-3',
      catatan: 'Digunakan sebagai suplemen omega-3 premium untuk meningkatkan kualitas susu/telur; batasi 5–8% ransum.',
    },
    harga: {
      estimasiAI: 25000, hargaMarketplace: 35000,
      satuan: 'per kg biji kering', supplier: 'Importir bahan pangan sehat / Toko suplemen ternak premium',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Linseed, whole seeds, INRA-CIRAD-AFZ-FAO',
      ],
      sumberData: 'Feedipedia',
      catatan: 'Harga sangat dipengaruhi oleh fluktuasi harga impor dan permintaan pasar suplemen kesehatan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🟤', text: 'Biji rami adalah sumber omega-3 (ALA) terkaya di antara biji-bijian nabati — digunakan untuk meningkatkan profil asam lemak sehat pada susu dan telur.' },
      { type: 'kelebihan', icon: '✅', text: 'Lignan alami berfungsi sebagai antioksidan dan berpotensi mendukung kesehatan reproduksi ternak perah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga sangat tinggi karena sepenuhnya impor — hanya ekonomis untuk suplementasi premium skala kecil.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan ransum dasar sapi perah untuk menghasilkan susu omega-3 tinggi bernilai jual premium.' },
      { type: 'peringatan', icon: '🚨', text: 'Giling biji sesaat sebelum digunakan — omega-3 mudah teroksidasi jika biji tergiling disimpan lama di tempat terbuka.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih ekonomis untuk lemak sehat: Biji Chia, meski kandungan omega-3 sedikit lebih rendah.' },
    ],
  },

  // ── 17. Biji Chia ─────────────────────────────────────────────────────────
  'biji-chia': {
    deskripsi: 'Biji chia dengan protein 20–23% BK dan lemak tinggi kaya omega-3, produk impor premium yang mulai dilirik sebagai suplemen fungsional pakan ternak perah dan unggas petelur.',
    alias: 'Chia Seed, Biji Chia',
    asal: 'Amerika Tengah (Meksiko dan Guatemala); seluruhnya dipasok Indonesia melalui impor',
    habitat: 'Daerah beriklim kering subtropis; tidak dibudidayakan di Indonesia',
    umurPanenIdeal: 'Panen pada umur 100–150 hari setelah tanam (di negara produsen)',
    bagianDimanfaatkan: 'Biji utuh',
    produksi: 'Tidak dibudidayakan di Indonesia; sepenuhnya impor',
    kelebihan: 'Kaya omega-3 dan serat larut (mucilago); antioksidan tinggi; tidak mengandung antinutrisi berbahaya',
    kekurangan: 'Harga sangat tinggi karena impor premium; tidak ekonomis untuk penggunaan rutin skala besar',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 94, kadarAir: 6,
      pk: 21.0, sk: 24.0, lk: 32.0, abu: 4.5, betn: 18.5,
      tdn: 82, me: 3280,
      ndf: 30.0, adf: 22.0,
      ca: 0.55, p: 0.55, mg: 0.40, na: 0.02, k: 0.70, cl: 0.03, s: 0.22,
      vitamin: 'Vitamin E tinggi; antioksidan flavonoid',
      mineral: 'Ca cukup tinggi. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Perah', 'Ayam Kampung'],
      programCocok: ['Menyusui'],
      musimTerbaik: 'Tersedia sepanjang tahun melalui pasokan impor',
      umurPanenTerbaik: 'Biji kering utuh',
      catatan: 'Digunakan sebagai suplemen fungsional dalam jumlah sangat kecil (≤5% ransum) untuk meningkatkan kualitas produk susu/telur.',
    },
    harga: {
      estimasiAI: 40000, hargaMarketplace: 55000,
      satuan: 'per kg biji kering', supplier: 'Importir superfood / Toko suplemen kesehatan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Chia seed, INRA-CIRAD-AFZ-FAO',
        'Ayerza, R. (2013) — Chia as a New Source of Omega-3 Fatty Acids, J. Am. Coll. Nutr.',
      ],
      sumberData: 'Feedipedia dan literatur ilmiah terkait Salvia hispanica',
      catatan: 'Penggunaan dalam pakan ternak di Indonesia masih sangat jarang karena harga premium.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚫', text: 'Biji chia adalah suplemen fungsional premium kaya omega-3 dan serat larut, umumnya digunakan dalam skala penelitian atau produk niche bernilai tinggi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga sangat tinggi (superfood impor) menjadikannya tidak ekonomis untuk penggunaan pakan rutin skala peternakan umum.' },
      { type: 'kelebihan', icon: '✅', text: 'Tidak mengandung antinutrisi berbahaya dan kaya antioksidan yang dapat mendukung kualitas produk premium (susu/telur omega-3).' },
      { type: 'kombinasi', icon: '🔗', text: 'Cocok untuk niche market: peternakan skala kecil yang menjual susu/telur bernilai tambah dengan klaim omega-3.' },
      { type: 'peringatan', icon: '🚨', text: 'Kandungan mucilago tinggi dapat mengental bila dicampur cairan — perhatikan tekstur ransum saat pencampuran.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif jauh lebih ekonomis dengan manfaat omega-3 serupa: Biji Rami (Flaxseed).' },
    ],
  },

  // ── 18. Biji Labu ─────────────────────────────────────────────────────────
  'biji-labu': {
    deskripsi: 'Biji labu (pumpkin seed) dengan protein 24–28% BK dan lemak tinggi, umumnya hasil samping pengolahan labu untuk pangan yang dimanfaatkan sebagai suplemen pakan sumber protein-energi.',
    alias: 'Pumpkin Seed, Biji Labu, Kwaci Labu',
    asal: 'Amerika Tengah; dibudidayakan luas di Indonesia sebagai tanaman sayuran',
    habitat: 'Dataran rendah hingga 1.200 mdpl; tanah subur berdrainase baik',
    umurPanenIdeal: 'Biji diambil dari buah labu matang penuh, dikeringkan setelah dipisahkan dari daging buah',
    bagianDimanfaatkan: 'Biji utuh (hasil samping pengolahan daging buah labu)',
    produksi: 'Bervariasi sebagai hasil samping; tergantung produksi labu untuk pangan',
    kelebihan: 'Protein dan lemak tinggi; tersedia murah sebagai limbah pengolahan pangan; tidak mengandung antinutrisi berbahaya',
    kekurangan: 'Pasokan tidak konsisten karena bergantung musim panen labu; skala kecil sehingga sulit didapat dalam jumlah besar',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 26.0, sk: 12.0, lk: 35.0, abu: 4.0, betn: 23.0,
      tdn: 85, me: 3400,
      ndf: 22.0, adf: 16.0,
      ca: 0.20, p: 0.60, mg: 0.35, na: 0.02, k: 0.75, cl: 0.03, s: 0.22,
      vitamin: 'Vitamin E tinggi; Zn tinggi',
      mineral: 'Zn dan P tinggi. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 10,
      targetTernak: ['Ayam Kampung', 'Kambing'],
      programCocok: ['Grower'],
      musimTerbaik: 'Tersedia pasca panen labu (sepanjang tahun tergantung wilayah)',
      umurPanenTerbaik: 'Biji kering bersih dari sisa daging buah',
      catatan: 'Cocok sebagai suplemen protein-energi skala rumah tangga/peternakan kecil dari limbah dapur atau industri pangan lokal.',
    },
    harga: {
      estimasiAI: 6000, hargaMarketplace: 9000,
      satuan: 'per kg biji kering', supplier: 'Limbah industri pengolahan labu / Petani labu',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Pumpkin seeds, INRA-CIRAD-AFZ-FAO',
      ],
      sumberData: 'Feedipedia',
      catatan: 'Data spesifik Indonesia terbatas; nilai merujuk referensi umum biji labu.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🎃', text: 'Biji labu menyediakan protein dan energi yang baik sebagai hasil samping industri pengolahan labu, dengan biaya rendah bila tersedia lokal.' },
      { type: 'kelebihan', icon: '✅', text: 'Kandungan Zn dan Vitamin E tinggi mendukung fungsi kekebalan dan reproduksi ternak.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Pasokan tidak konsisten dan bergantung musim panen labu — kurang cocok sebagai bahan pakan andalan rutin.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan sebagai suplemen tambahan musiman, dikombinasikan dengan sumber protein-energi utama yang lebih stabil pasokannya.' },
      { type: 'peringatan', icon: '🚨', text: 'Pastikan biji benar-benar kering untuk mencegah pertumbuhan jamur selama penyimpanan.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif serupa: Biji Bunga Matahari, dengan pasokan lebih stabil bila dibudidayakan khusus.' },
    ],
  },

  // ── 19. Biji Kecipir ──────────────────────────────────────────────────────
  'biji-kecipir': {
    deskripsi: 'Biji kecipir (winged bean seed) dengan protein sangat tinggi (28–32% BK) mendekati kedelai, tanaman lokal multiguna yang bijinya berpotensi sebagai substitusi protein nabati lokal.',
    alias: 'Winged Bean Seed, Biji Kecipir, Kacang Botor',
    asal: 'Asia Tenggara dan Papua Nugini; dibudidayakan di berbagai daerah Indonesia sebagai tanaman pekarangan',
    habitat: 'Dataran rendah hingga 1.500 mdpl; toleran berbagai jenis tanah; tanaman merambat',
    umurPanenIdeal: 'Panen pada umur 100–150 hari setelah tanam untuk biji kering',
    bagianDimanfaatkan: 'Biji utuh (setelah dipanaskan ringan)',
    produksi: '0,5–1,0 ton biji kering/ha/musim tanam',
    kelebihan: 'Protein mendekati kedelai; tanaman mudah dibudidayakan di pekarangan; seluruh bagian tanaman (daun, bunga, umbi, biji) dapat dimanfaatkan',
    kekurangan: 'Mengandung tripsin inhibitor pada biji mentah — perlu pemanasan ringan sebelum diberikan; belum dibudidayakan secara komersial luas',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 30.0, sk: 6.0, lk: 15.0, abu: 4.0, betn: 45.0,
      tdn: 80, me: 3200,
      ndf: 16.0, adf: 10.0,
      ca: 0.25, p: 0.50, mg: 0.25, na: 0.02, k: 1.25, cl: 0.03, s: 0.28,
      vitamin: 'Vitamin B kompleks; Folat',
      mineral: 'Profil mineral baik, mendekati leguminosa biji lain. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Kambing', 'Domba', 'Ayam Kampung'],
      programCocok: ['Grower', 'Penggemukan'],
      musimTerbaik: 'Tersedia sepanjang tahun di daerah pekarangan tropis',
      umurPanenTerbaik: 'Biji kering, dipanaskan ringan sebelum diberikan',
      catatan: 'Panaskan ringan (sangrai) sebelum diberikan untuk menonaktifkan tripsin inhibitor dan meningkatkan palatabilitas.',
    },
    harga: {
      estimasiAI: 6500, hargaMarketplace: 9000,
      satuan: 'per kg biji kering', supplier: 'Petani pekarangan lokal / Pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Winged bean, seeds, INRA-CIRAD-AFZ-FAO',
        'Khan, T.N. (1976) — Papua New Guinea: A Centre of Genetic Diversity for Winged Bean, Euphytica',
      ],
      sumberData: 'Feedipedia dan literatur genetika kecipir',
      catatan: 'Berpotensi sebagai sumber protein lokal alternatif kedelai yang masih kurang dieksplorasi secara komersial.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🫘', text: 'Biji kecipir memiliki protein mendekati kedelai (30% BK) — berpotensi besar sebagai sumber protein lokal alternatif yang masih kurang dimanfaatkan.' },
      { type: 'kelebihan', icon: '✅', text: 'Tanaman multiguna: daun, bunga, umbi, dan biji semuanya bisa dimanfaatkan, menjadikannya investasi pekarangan yang sangat efisien.' },
      { type: 'peringatan', icon: '🚨', text: 'Biji mentah mengandung tripsin inhibitor — sangrai ringan sebelum diberikan untuk meningkatkan kecernaan dan palatabilitas.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan sumber energi (jagung/sorgum) sebagai pengganti sebagian kedelai dalam ransum ruminansia dan unggas kampung.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Belum dibudidayakan secara komersial luas sehingga pasokan bergantung pada tanaman pekarangan skala kecil.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika kecipir tidak tersedia: Kedelai atau Kacang Komak sebagai sumber protein biji alternatif.' },
    ],
  },

  // ── 20. Sorgum ────────────────────────────────────────────────────────────
  'sorgum': {
    deskripsi: 'Biji sorgum dengan energi tinggi mendekati jagung (TDN 78–80% BK) dan lebih tahan kekeringan, cocok sebagai sumber energi utama di daerah kering yang tidak sesuai untuk budidaya jagung.',
    alias: 'Sorghum, Cantel, Sorgum',
    asal: 'Afrika; dibudidayakan di daerah kering Indonesia (NTT, Jawa Timur, Sulawesi Selatan)',
    habitat: 'Dataran rendah hingga 1.000 mdpl; sangat toleran kekeringan; tumbuh di tanah marginal',
    umurPanenIdeal: 'Panen pada umur 90–120 hari setelah tanam saat biji keras dan mengering',
    bagianDimanfaatkan: 'Biji utuh (pipilan)',
    produksi: '2,0–4,0 ton biji kering/ha/musim tanam',
    kelebihan: 'Sangat tahan kekeringan dibanding jagung; energi tinggi mendekati jagung; harga lebih murah dari jagung di daerah sentra produksinya',
    kekurangan: 'Beberapa varietas mengandung tanin yang menurunkan kecernaan protein; kandungan tanin bervariasi tergantung varietas (sorgum putih vs merah/coklat)',
    bentuk: ['Kering', 'Tepung'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 10.0, sk: 2.5, lk: 3.2, abu: 1.8, betn: 82.5,
      tdn: 80, me: 3200,
      ndf: 12.0, adf: 7.0,
      ca: 0.04, p: 0.30, mg: 0.15, na: 0.02, k: 0.40, cl: 0.05, s: 0.12,
      vitamin: 'Vitamin B kompleks; rendah beta-karoten',
      mineral: 'Profil mineral mirip jagung. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Potong', 'Ayam Kampung', 'Kambing', 'Babi'],
      programCocok: ['Penggemukan', 'Grower'],
      musimTerbaik: 'Tersedia pasca panen daerah kering (musim kemarau)',
      umurPanenTerbaik: 'Biji kering giling dengan kadar air <13%',
      catatan: 'Pilih varietas sorgum putih (tanin rendah) untuk hasil terbaik. Giling sebelum diberikan untuk meningkatkan kecernaan pada unggas.',
    },
    harga: {
      estimasiAI: 4500, hargaMarketplace: 6000,
      satuan: 'per kg biji kering', supplier: 'Petani daerah kering / Koperasi tani sorgum',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Sorghum grain, INRA-CIRAD-AFZ-FAO',
        'NRC (2016) — Nutrient Requirements of Beef Cattle',
      ],
      sumberData: 'Feedipedia dan NRC 2016',
      catatan: 'Kandungan tanin bervariasi signifikan antar varietas; sorgum coklat/merah memiliki tanin lebih tinggi dari sorgum putih.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Sorgum adalah alternatif energi utama jagung untuk daerah kering — TDN 80% BK mendekati jagung dengan ketahanan kekeringan jauh lebih baik.' },
      { type: 'kelebihan', icon: '✅', text: 'Dapat dibudidayakan di lahan yang tidak cocok untuk jagung, memberikan opsi sumber energi lokal murah di daerah kering seperti NTT.' },
      { type: 'peringatan', icon: '🚨', text: 'Varietas coklat/merah mengandung tanin lebih tinggi yang dapat menurunkan kecernaan protein — pilih varietas putih bila tersedia.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan sumber protein (kedelai/kacang tanah) sebagai basis konsentrat energi-protein pengganti jagung di daerah kering.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein lebih rendah dari jagung (10% vs 9% BK relatif serupa) — tetap perlu suplementasi protein tambahan untuk ternak produktif.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif energi serupa untuk daerah kering: Jewawut (Millet), meski produksi per hektar lebih rendah.' },
    ],
  },

  // ── 21. Jewawut (Millet) ──────────────────────────────────────────────────
  'jewawut': {
    deskripsi: 'Biji jewawut (foxtail millet) berukuran kecil dengan energi tinggi dan protein sedang (11–12% BK), sangat tahan kekeringan dan cocok dibudidayakan di lahan marginal sebagai sumber energi alternatif jagung dan sorgum.',
    alias: 'Foxtail Millet, Jewawut, Kenanga',
    asal: 'Asia Timur (Tiongkok); dibudidayakan terbatas di beberapa daerah kering Indonesia',
    habitat: 'Dataran rendah hingga 2.000 mdpl; sangat toleran kekeringan dan tanah marginal',
    umurPanenIdeal: 'Panen pada umur 70–90 hari setelah tanam — salah satu serealia tercepat panen',
    bagianDimanfaatkan: 'Biji utuh (pipilan kecil)',
    produksi: '1,0–2,0 ton biji kering/ha/musim tanam',
    kelebihan: 'Siklus panen sangat cepat (70–90 hari); sangat tahan kekeringan dan lahan marginal; tidak memerlukan pengolahan khusus',
    kekurangan: 'Skala budidaya di Indonesia masih sangat kecil sehingga pasokan terbatas; ukuran biji kecil membuat penanganan pasca panen lebih sulit',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 11.5, sk: 7.0, lk: 4.0, abu: 3.0, betn: 74.5,
      tdn: 76, me: 3040,
      ndf: 16.0, adf: 9.0,
      ca: 0.05, p: 0.32, mg: 0.16, na: 0.02, k: 0.45, cl: 0.05, s: 0.14,
      vitamin: 'Vitamin B kompleks sedang',
      mineral: 'Profil mineral mirip serealia lain. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 35,
      targetTernak: ['Ayam Kampung', 'Kambing', 'Domba'],
      programCocok: ['Grower', 'Penggemukan'],
      musimTerbaik: 'Tersedia pasca panen daerah kering, dapat 2–3 kali tanam per tahun',
      umurPanenTerbaik: 'Biji kering bebas kutu, kadar air <12%',
      catatan: 'Sangat baik untuk pakan unggas kampung karena ukuran biji kecil mudah dikonsumsi langsung tanpa penggilingan.',
    },
    harga: {
      estimasiAI: 6000, hargaMarketplace: 8500,
      satuan: 'per kg biji kering', supplier: 'Petani daerah kering / Toko pakan burung dan unggas',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Foxtail millet, grain, INRA-CIRAD-AFZ-FAO',
        'FAO (2018) — Feed Resources for Tropical Ruminants',
      ],
      sumberData: 'Feedipedia dan FAO',
      catatan: 'Data spesifik Indonesia terbatas; nilai merujuk referensi regional Asia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Jewawut adalah serealia energi dengan siklus panen tercepat (70–90 hari) di antara biji-bijian pakan — ideal untuk rotasi tanam cepat di lahan kering.' },
      { type: 'kelebihan', icon: '✅', text: 'Ukuran biji kecil membuatnya dapat dikonsumsi langsung oleh unggas kampung tanpa perlu digiling, menghemat biaya pengolahan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Skala budidaya di Indonesia masih sangat kecil — pasokan untuk pakan ternak umumnya bersaing dengan pasar pakan burung hias.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan Sorgum dan Kacang Gude sebagai basis ransum lengkap untuk daerah kering dengan siklus tanam cepat.' },
      { type: 'peringatan', icon: '🚨', text: 'Simpan di tempat kering dan tertutup rapat — ukuran biji kecil lebih rentan serangan kutu gudang dibanding jagung/sorgum.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif energi serupa dengan pasokan lebih luas: Sorgum atau Jagung, bila jewawut tidak tersedia di daerah setempat.' },
    ],
  },

};

// ─── Accessor Functions ───────────────────────────────────────────────────────

export function getKacangBijianDetail(id: string): KacangBijianDetailFields | undefined {
  return KACANG_BIJIAN_DETAIL[id];
}

export function getKacangBijianDetailItem(id: string): KacangBijianDetailItem | undefined {
  const base = getKacangBijianById(id);
  const detail = KACANG_BIJIAN_DETAIL[id];
  if (!base || !detail) return undefined;
  return { ...base, ...detail };
}

export function getAllKacangBijianDetailItems(): KacangBijianDetailItem[] {
  return Object.keys(KACANG_BIJIAN_DETAIL)
    .map(id => getKacangBijianDetailItem(id))
    .filter((i): i is KacangBijianDetailItem => !!i);
}

export function computeKacangBijianRingkasan() {
  const items = getAllKacangBijianDetailItems();
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
