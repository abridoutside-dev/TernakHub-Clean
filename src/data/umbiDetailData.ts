// ─── MP-011 — Detail Data: Umbi-umbian ───────────────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for all 20 umbi items.
//
// Convention: proximate (PK, SK, LK, Abu, BETN), TDN, ME, NDF, ADF, and minerals
// are expressed on DM (Bahan Kering) basis. bk and kadarAir are % of fresh material.
//
// Primary sources:
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi
//     Pakan untuk Indonesia. Gadjah Mada University Press.
//   • NRC (2016). Nutrient Requirements of Beef Cattle, 8th Rev. Ed.
//   • Feedipedia (2023). INRA-CIRAD-AFZ-FAO Animal Feed Resources.
//   • FAO (2018). Feed Resources — Root and Tuber Crops.
//   • Balai Penelitian Ternak Indonesia — Data Pakan Umbi Tropik.
//   • Wanapat, M. et al. (2006). Cassava hay as alternative energy source.

import { getUmbiById, type UmbiSubKategori } from './umbiData';
import type {
  NutrisiData,
  PenggunaanData,
  HargaData,
  ReferensiData,
  AiInsightItem,
  BentukBahan,
} from './jagungData';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UmbiDetailFields {
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

export type UmbiDetailItem = UmbiSubKategori & UmbiDetailFields;

// ─── Detail Registry ──────────────────────────────────────────────────────────

const UMBI_DETAIL: Record<string, UmbiDetailFields> = {

  // ── 1. Singkong ─────────────────────────────────────────────────────────────
  'singkong': {
    deskripsi: 'Umbi akar tanaman singkong (ubi kayu) yang merupakan sumber karbohidrat paling populer di Indonesia. Sebagai pakan ternak, singkong segar maupun kering (gaplek) menjadi sumber energi murah yang banyak digunakan dalam ransum ruminansia dan babi.',
    alias: 'Ubi Kayu, Cassava, Gaplek (kering), Ketela Pohon',
    asal: 'Amerika Selatan (Brasil); diintroduksi ke Asia Tenggara oleh Portugis abad ke-16; kini menjadi tanaman pangan & pakan utama di seluruh Indonesia',
    habitat: 'Dataran rendah hingga 1.500 mdpl; tumbuh baik di tanah berpasir hingga tanah merah; toleran kekeringan ekstrem; tidak tahan genangan',
    umurPanenIdeal: '8–12 bulan setelah tanam; panen lebih awal (6–8 bulan) menghasilkan umbi dengan HCN lebih tinggi',
    bagianDimanfaatkan: 'Umbi akar (utama), daun muda (protein tinggi ~25% BK), kulit umbi, dan onggok (ampas tapioka)',
    produksi: '20–40 ton umbi segar/ha/tahun; rata-rata nasional Indonesia ±24 ton/ha',
    kelebihan: 'Sumber energi murah (TDN 77% BK); produksi umbi sangat tinggi per hektar; mudah dibudidayakan di lahan marginal; dapat disimpan sebagai gaplek; daun juga bernilai tinggi sebagai protein',
    kekurangan: 'Mengandung HCN (asam sianida) 20–1.400 ppm tergantung varietas; protein sangat rendah (2,5% BK); defisien mineral Ca, P, dan vitamin; wajib diolah untuk menurunkan HCN sebelum diberikan',
    bentuk: ['Segar', 'Kering', 'Tepung'],
    nutrisi: {
      bk: 35, kadarAir: 65,
      pk: 2.5, sk: 3.8, lk: 0.4, abu: 1.2, betn: 92.1,
      tdn: 77, me: 3080,
      ndf: 18.0, adf: 8.0,
      ca: 0.10, p: 0.10, mg: 0.06, na: 0.01, k: 0.55, cl: 0.04, s: 0.08,
      vitamin: 'Beta-karoten rendah pada umbi putih; Vitamin C (±28 mg/100g segar); Thiamin; Folat',
      mineral: 'Sangat rendah mineral makro (Ca, P). Suplementasi kalsium dan fosfor wajib. Nilai dinyatakan atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Bunting', 'Menyusui', 'Pejantan'],
      musimTerbaik: 'Tersedia sepanjang tahun; puncak produksi September–Desember (musim panen)',
      umurPanenTerbaik: '8–10 bulan — keseimbangan terbaik antara kadar pati tinggi dan kadar HCN moderat',
      catatan: 'Wajib rebus/kukus 30 menit atau jemur 2–3 hari sebagai gaplek untuk menurunkan HCN ke kadar aman (<100 ppm). Batasi 40% ransum karena protein sangat rendah. Selalu lengkapi dengan sumber protein dan mineral.',
    },
    harga: {
      estimasiAI: 1200, hargaMarketplace: 1500,
      satuan: 'per kg segar', supplier: 'Petani lokal / KUD / Pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Wanapat, M. et al. (2006) — Cassava hay as an alternative energy source for ruminants, Asian-Aust. J. Anim. Sci.',
        'Feedipedia (2023) — Manihot esculenta roots, INRA-CIRAD-AFZ-FAO',
        'FAO (2018) — Feed Resources: Cassava and its by-products',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Ed.',
      ],
      sumberData: 'Rata-rata dari Feedipedia, Hartadi et al. 1997, dan analisis proksimat BALITNAK Indonesia',
      catatan: 'Kadar HCN bervariasi sangat lebar: singkong manis <100 ppm, pahit 200–1.400 ppm. Selalu verifikasi varietas sebelum penggunaan massal.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Singkong adalah sumber karbohidrat fermentable terbesar di ransum ruminansia tropik — TDN 77% BK dengan biaya produksi terendah di antara semua sumber energi umbi. Ideal sebagai pengganti sebagian jagung ketika harga jagung tinggi.' },
      { type: 'peringatan', icon: '🚨', text: 'HCN (asam sianida) adalah bahaya utama singkong segar. Varietas pahit mengandung 200–1.400 ppm HCN — sangat toksik untuk ternak. Wajib olah menjadi gaplek (jemur 2–3 hari) atau rebus 30 menit untuk menurunkan ke <100 ppm sebelum diberikan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein kasar hanya 2,5% BK dan defisien semua asam amino esensial. Jika singkong mendominasi ransum tanpa sumber protein, ternak berisiko kwashiorkor, penurunan PBBH, dan masalah reproduksi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula ideal penggemukan: Gaplek Singkong 30–35% + Dedak Padi 20% + Bungkil Kedelai/Lamtoro 15–20% + Hijauan 30%. Tambahkan mineral premix untuk menutupi defisiensi Ca, P, dan Na.' },
      { type: 'kelebihan', icon: '✅', text: 'Produksi umbi 20–40 ton/ha/tahun menjadikan singkong sumber energi paling efisien per hektar lahan. Daun singkong (PK ~25% BK) juga bernilai tinggi sebagai hijauan protein gratis jika dimanfaatkan sekaligus.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika HCN menjadi kendala: Ubi Jalar (aman, palatabilitas lebih baik, protein lebih tinggi). Jika singkong mahal: Onggok (ampas tapioka) — sumber energi serupa dengan harga lebih rendah.' },
    ],
  },

  // ── 2. Ubi Jalar ────────────────────────────────────────────────────────────
  'ubi-jalar': {
    deskripsi: 'Umbi berdaging manis dari tanaman merambat yang kaya karbohidrat dan relatif tinggi protein dibanding umbi lain. Palatabilitas sangat baik untuk semua jenis ternak. Bagian daunnya juga dapat dimanfaatkan sebagai hijauan berprotein tinggi.',
    alias: 'Sweet Potato, Ketela Rambat, Telo Rambat',
    asal: 'Amerika Selatan (Peru–Ekuador); menyebar ke Asia Polinesia sejak ribuan tahun lalu; kini ditanam luas di seluruh Indonesia',
    habitat: 'Dataran rendah hingga 1.000 mdpl; menyukai tanah gembur berpasir; toleran kekeringan sedang; tumbuh baik di musim kering',
    umurPanenIdeal: '3–5 bulan setelah tanam tergantung varietas',
    bagianDimanfaatkan: 'Umbi (utama), daun dan batang muda (protein 18–22% BK), kulit umbi',
    produksi: '15–30 ton umbi segar/ha; daun 10–20 ton/ha/tahun jika dikelola sebagai tanaman pakan',
    kelebihan: 'Tidak mengandung antinutrisi berbahaya; palatabilitas sangat baik; protein lebih tinggi dari singkong (4% BK); kaya beta-karoten (varietas oranye) yang baik untuk reproduksi; daun juga bergizi tinggi',
    kekurangan: 'Mudah rusak setelah panen (umur simpan <2 minggu segar); kadar air sangat tinggi membatasi pengangkutan dan penyimpanan; harga lebih mahal dari singkong',
    bentuk: ['Segar', 'Kering', 'Tepung'],
    nutrisi: {
      bk: 31, kadarAir: 69,
      pk: 4.0, sk: 3.5, lk: 0.5, abu: 1.5, betn: 90.5,
      tdn: 72, me: 2880,
      ndf: 12.0, adf: 6.0,
      ca: 0.06, p: 0.12, mg: 0.07, na: 0.02, k: 0.60, cl: 0.05, s: 0.09,
      vitamin: 'Beta-karoten sangat tinggi pada varietas oranye (±9 mg/100g); Vitamin C; Vitamin B6; Vitamin E',
      mineral: 'Nilai atas dasar BK. Profil mineral lebih baik dari singkong. Masih perlu suplementasi Ca untuk ruminansia.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Babi', 'Unggas'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Bunting', 'Menyusui', 'Pejantan'],
      musimTerbaik: 'Panen Juni–September dan November–Februari (2 musim tanam per tahun)',
      umurPanenTerbaik: '3,5–4 bulan — kadar pati dan palatabilitas optimal',
      catatan: 'Tidak memerlukan pengolahan sebelum diberikan. Iris/cacah untuk memudahkan konsumsi. Daun dapat diberikan segar langsung. Perhatikan pembusukan umbi penyimpanan — hindari memberikan yang sudah berlendir.',
    },
    harga: {
      estimasiAI: 2500, hargaMarketplace: 3000,
      satuan: 'per kg segar', supplier: 'Petani lokal / Pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Feedipedia (2023) — Ipomoea batatas roots, INRA-CIRAD-AFZ-FAO',
        'FAO (2018) — Sweet Potato as Feed Resource',
        'Balai Penelitian Ternak Indonesia — Umbi Tropis sebagai Bahan Pakan',
      ],
      sumberData: 'Rata-rata Feedipedia dan Hartadi et al. 1997',
      catatan: 'Komposisi bervariasi signifikan antar varietas; varietas oranye (beta-karoten tinggi) dan putih (pati tinggi) memiliki nilai nutrisi berbeda.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍠', text: 'Ubi Jalar adalah sumber karbohidrat umbi terlengkap — energi TDN 72% BK, protein lebih tinggi dari singkong, dan kaya beta-karoten yang mendukung reproduksi dan imunitas ternak.' },
      { type: 'kelebihan', icon: '✅', text: 'Satu-satunya umbi pakan tanpa antinutrisi signifikan yang dapat diberikan mentah langsung ke ternak. Palatabilitas sangat baik untuk semua spesies. Daun dan batangnya (PK 18–22% BK) dapat dimanfaatkan sebagai pakan hijauan gratis.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi efektif: Ubi Jalar 30% + Rumput + Lamtoro/Indigofera — ransum hijauan komplet. Untuk sapi perah: Ubi Jalar 20% + Konsentrat berbasis dedak — meningkatkan palatabilitas total ransum.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kadar air sangat tinggi (69%) membatasi konsumsi BK per kg bahan segar. Umur simpan <2 minggu — harus digunakan segera atau dikeringkan. Harga 2× lipat singkong per kg segar.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih ekonomis: Singkong kering (energi serupa, harga lebih murah). Untuk manfaat beta-karoten: Wortel Pakan (kandungan lebih tinggi). Untuk protein: Talas atau Ubi Ungu.' },
    ],
  },

  // ── 3. Talas ────────────────────────────────────────────────────────────────
  'talas': {
    deskripsi: 'Umbi bertekstur berlumpur dari tanaman Colocasia yang mengandung oksalat — zat yang menyebabkan rasa gatal bila dikonsumsi mentah. Setelah dimasak atau difermentasi, talas menjadi bahan pakan karbohidrat yang aman dan disukai ternak.',
    alias: 'Taro, Keladi, Cocoyam, Dasheen',
    asal: 'Asia Selatan dan Tenggara (diduga India dan Asia Tenggara); kini tersebar di seluruh kawasan tropis dan subtropis',
    habitat: 'Dataran rendah hingga 2.700 mdpl; tumbuh baik di tanah lembab berlumpur; sering ditemukan di tepi sungai, sawah, dan daerah semi-basah',
    umurPanenIdeal: '6–12 bulan tergantung varietas; varietas tropis umumnya 7–9 bulan',
    bagianDimanfaatkan: 'Umbi corm (utama), petiole (tangkai daun), daun muda (setelah dimasak)',
    produksi: '10–25 ton umbi/ha/tahun; sangat dipengaruhi ketersediaan air tanah',
    kelebihan: 'Dapat tumbuh di lahan basah/rawa yang tidak cocok untuk singkong atau ubi jalar; umbi bertahan lebih lama dari ubi jalar; kandungan pati yang mudah dicerna setelah pengolahan',
    kekurangan: 'Mengandung oksalat kalsium yang menyebabkan iritasi saluran pencernaan jika diberikan mentah; wajib dimasak atau difermentasi sebelum diberikan; protein rendah; Ca rendah',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 27, kadarAir: 73,
      pk: 3.2, sk: 2.8, lk: 0.3, abu: 1.8, betn: 91.9,
      tdn: 68, me: 2720,
      ndf: 10.0, adf: 5.0,
      ca: 0.08, p: 0.08, mg: 0.06, na: 0.01, k: 0.45, cl: 0.04, s: 0.07,
      vitamin: 'Vitamin C (±11 mg/100g); Vitamin B6; Tiamin; Folat',
      mineral: 'Nilai atas dasar BK. Mengandung oksalat tinggi yang mengganggu penyerapan kalsium — wajib masak. Ca dan P sama-sama rendah.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Pejantan'],
      musimTerbaik: 'Panen Maret–Juni (musim kemarau awal); produksi stabil sepanjang tahun di lahan basah',
      umurPanenTerbaik: '7–9 bulan — pati optimal, belum terlalu berserat',
      catatan: 'Wajib dimasak (rebus/kukus 30–45 menit) atau fermentasi selama 3 hari sebelum diberikan untuk menghilangkan oksalat. Jangan berikan talas mentah — dapat menyebabkan iritasi mulut dan saluran cerna. Batasi 30% ransum.',
    },
    harga: {
      estimasiAI: 3500, hargaMarketplace: 4000,
      satuan: 'per kg segar', supplier: 'Petani lokal / Pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Colocasia esculenta corms, INRA-CIRAD-AFZ-FAO',
        'FAO (2018) — Taro as Feed for Livestock',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
      ],
      sumberData: 'Feedipedia dan Hartadi et al. 1997; verifikasi oksalat dari FAO 2018',
      catatan: 'Kadar oksalat bervariasi 0,1–2% BK antar varietas. Selalu olah sebelum diberikan. Nilai nutrisi setelah pemasakan lebih rendah ±10% akibat pelindian mineral.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Talas adalah pilihan sumber energi umbi untuk lahan basah/rawa yang tidak memungkinkan singkong atau ubi jalar. TDN 68% BK cukup untuk pemeliharaan dan pertumbuhan sedang.' },
      { type: 'peringatan', icon: '🚨', text: 'Oksalat kalsium dalam talas mentah menyebabkan iritasi mulut, lidah, dan saluran pencernaan pada ternak. Wajib rebus 30–45 menit atau fermentasi 3 hari. Tanpa pengolahan, talas tidak aman diberikan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein dan mineral keduanya rendah. Tidak dapat berdiri sendiri sebagai pakan tunggal. Biaya pengolahan (memasak) menambah biaya produksi pakan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi efektif: Talas masak 20–25% + Rumput + Lamtoro. Talas menggantikan sebagian energi konsentrat saat stok jagung terbatas di daerah beriklim basah.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika pengolahan merepotkan: Ubi Jalar (tidak perlu masak, palatabilitas lebih baik). Jika lahan basah tersedia: Kimpul (Xanthosoma) sebagai alternatif talas yang lebih mudah.' },
    ],
  },

  // ── 4. Garut ────────────────────────────────────────────────────────────────
  'garut': {
    deskripsi: 'Umbi rimpang berkadar pati sangat tinggi (±27% BK) dengan tekstur halus yang mudah dicerna. Merupakan sumber energi murni dengan protein sangat rendah. Digunakan terutama dalam ransum babi dan unggas di negara-negara Asia tropis.',
    alias: 'Arrowroot, Ararut, Sagu Belanda, West Indian Arrowroot',
    asal: 'Karibia dan Amerika Tengah; dibawa oleh Portugis ke Asia Tenggara; kini dibudidayakan di dataran tinggi Jawa, Sumatera, dan Kalimantan',
    habitat: 'Dataran tinggi 100–1.200 mdpl; suka tanah lembab gembur; tidak toleran genangan; tumbuh di bawah naungan ringan',
    umurPanenIdeal: '10–11 bulan setelah tanam; daun mengering adalah tanda siap panen',
    bagianDimanfaatkan: 'Rimpang umbi (pati tinggi); ampas pengolahan pati garut (sebagai pakan kasar)',
    produksi: '10–20 ton rimpang/ha; pati murni 8–12 ton/ha',
    kelebihan: 'Kadar pati sangat tinggi dan mudah dicerna; bebas antinutrisi; cocok untuk ternak muda dan sakit karena mudah dicerna; tidak memerlukan pengolahan sebelum diberikan',
    kekurangan: 'Protein sangat rendah (2,2% BK); mineral sangat minim; harga lebih mahal dari singkong; produksi per hektar relatif rendah dibanding singkong',
    bentuk: ['Segar', 'Kering', 'Tepung'],
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 2.2, sk: 2.5, lk: 0.3, abu: 1.5, betn: 93.5,
      tdn: 70, me: 2800,
      ndf: 9.0, adf: 4.0,
      ca: 0.04, p: 0.08, mg: 0.04, na: 0.01, k: 0.42, cl: 0.03, s: 0.06,
      vitamin: 'Sangat rendah; Vitamin C sedikit; praktis tidak ada vitamin lain yang signifikan',
      mineral: 'Profil mineral sangat miskin. Nilai atas dasar BK. Suplementasi mineral lengkap mutlak diperlukan.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 25,
      targetTernak: ['Babi', 'Unggas', 'Kambing', 'Domba', 'Sapi Potong'],
      programCocok: ['Penggemukan', 'Grower'],
      musimTerbaik: 'Panen Oktober–Desember; tersedia terbatas sepanjang tahun dari petani kecil',
      umurPanenTerbaik: '10–11 bulan — pati maksimal',
      catatan: 'Tidak memerlukan pengolahan khusus. Untuk babi dan unggas, haluskan atau buat tepung. Untuk ruminansia, cacah menjadi potongan kecil. Selalu lengkapi dengan sumber protein dan mineral — garut tidak boleh menjadi komponen tunggal.',
    },
    harga: {
      estimasiAI: 6000, hargaMarketplace: 7000,
      satuan: 'per kg segar', supplier: 'Petani spesialis / Koperasi Jamu & Pangan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Maranta arundinacea, INRA-CIRAD-AFZ-FAO',
        'FAO (2018) — Minor Tuber and Root Crops — Arrowroot',
        'Balai Pengkajian Teknologi Pertanian (2020) — Umbi Minor Indonesia',
      ],
      sumberData: 'Feedipedia dan literatur FAO umbi minor tropis',
      catatan: 'Data nutrisi garut terbatas dalam literatur Indonesia. Nilai merupakan estimasi berdasarkan komposisi pati genus Maranta dari Feedipedia 2023.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Garut adalah sumber pati murni yang sangat mudah dicerna — cocok untuk ternak muda, lemah, atau dalam pemulihan yang membutuhkan energi instan tanpa beban serat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein hanya 2,2% BK — terendah di antara semua umbi pakan. Garut tidak bisa menjadi sumber pakan dominan; selalu harus dikombinasikan dengan bahan berprotein tinggi.' },
      { type: 'kelebihan', icon: '✅', text: 'Bebas antinutrisi — tidak ada HCN, oksalat, atau glikosida berbahaya. Pati garut sangat mudah dicerna (kecernaan >95%) sehingga ideal untuk anak ternak atau ternak dalam kondisi stres.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi ideal: Garut 20% + Konsentrat protein (bungkil kedelai/lamtoro) + Hijauan. Atau gunakan sebagai pengganti sebagian jagung dalam ransum anak babi untuk meningkatkan kecernaan.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih ekonomis: Singkong kering (pati serupa, harga lebih rendah). Jika menginginkan kemudahan dicerna serupa: Gaplek singkong yang dimasak.' },
    ],
  },

  // ── 5. Ganyong ──────────────────────────────────────────────────────────────
  'ganyong': {
    deskripsi: 'Rimpang tanaman dari famili Cannaceae yang menghasilkan pati berkualitas tinggi serupa dengan garut. Ganyong merupakan tanaman serbaguna — umbi untuk pakan/pangan, daun untuk pembungkus, dan bunga untuk ornamental.',
    alias: 'Queensland Arrowroot, Achira, Tous-les-mois, Purple Arrowroot',
    asal: 'Amerika Selatan (Andes, Peru); dibawa ke Indonesia pada era kolonial dan kini tumbuh liar di tepi kebun, sungai, dan lahan marginal',
    habitat: 'Dataran rendah hingga 2.000 mdpl; tumbuh di tanah lembab, pinggir sungai, kebun campuran; toleran genangan ringan dan naungan parsial',
    umurPanenIdeal: '8–12 bulan setelah tanam; indikasi: daun menguning dan tanaman mulai mengering',
    bagianDimanfaatkan: 'Rimpang umbi (pati tinggi), ampas pati (pakan ternak), daun muda (hijau segar untuk ternak)',
    produksi: '15–25 ton rimpang/ha/tahun di kondisi optimal',
    kelebihan: 'Tumbuh liar dan mudah diperbanyak dari rimpang; dapat tumbuh di lahan marginal dan tepi sungai; daun muda dapat diberikan langsung sebagai hijauan; bebas antinutrisi berbahaya',
    kekurangan: 'Belum banyak dibudidayakan secara komersial; data nutrisi lebih terbatas; protein rendah; tidak tersedia dalam skala besar di pasaran',
    bentuk: ['Segar', 'Kering', 'Tepung'],
    nutrisi: {
      bk: 23, kadarAir: 77,
      pk: 2.8, sk: 3.2, lk: 0.4, abu: 1.5, betn: 92.1,
      tdn: 68, me: 2720,
      ndf: 11.0, adf: 5.0,
      ca: 0.05, p: 0.09, mg: 0.05, na: 0.01, k: 0.48, cl: 0.03, s: 0.07,
      vitamin: 'Kandungan vitamin rendah; jejak Vitamin C dan Karotenoid',
      mineral: 'Profil mineral rendah. Nilai atas dasar BK. Suplementasi Ca, P, dan mineral mikro diperlukan.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 25,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      musimTerbaik: 'Panen akhir musim kering (Agustus–Oktober); produksi berlanjut sepanjang tahun di dataran tinggi',
      umurPanenTerbaik: '10–12 bulan — kadar pati tertinggi',
      catatan: 'Dapat diberikan segar setelah dicacah. Ampas pati ganyong yang tersisa setelah ekstraksi dapat digunakan langsung sebagai pakan kasar berfermentasi. Daun muda diberikan segar.',
    },
    harga: {
      estimasiAI: 5000, hargaMarketplace: 6000,
      satuan: 'per kg segar', supplier: 'Petani tradisional / kolektor umbi lokal',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Canna edulis rhizomes, INRA-CIRAD-AFZ-FAO',
        'Balai Pengkajian Teknologi Pertanian (2020) — Umbi Minor Indonesia',
        'FAO (2001) — Roots, Tubers, Plantains and Bananas in Human Nutrition',
      ],
      sumberData: 'Feedipedia 2023 dan estimasi dari genus Canna serupa',
      catatan: 'Data nutrisi Canna edulis untuk pakan ternak masih terbatas. Nilai merupakan estimasi berdasarkan komposisi proksimat yang tersedia di Feedipedia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Ganyong adalah sumber energi lokal yang tumbuh liar dan murah — ideal sebagai komponen supplementary feed di daerah pedesaan tanpa akses mudah ke pakan komersial.' },
      { type: 'kelebihan', icon: '✅', text: 'Tumbuh tanpa perawatan intensif di lahan marginal, tepi sungai, dan kebun campuran. Memberikan akses ke sumber energi gratis bagi peternak skala kecil. Daun dan ampas pati dapat dimanfaatkan sekaligus.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ketersediaan pasar sangat terbatas — jarang ada pedagang besar. Variasi kualitas tinggi karena belum ada standar budidaya. Protein rendah sehingga wajib dikombinasikan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi: Ganyong 15–20% + Dedak Padi + Hijauan Leguminosa — ransum ekonomis untuk peternakan rakyat. Ampas pati ganyong fermentasi dapat menggantikan sebagian onggok singkong.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika ganyong tidak tersedia: Garut (komposisi sangat mirip, pati lebih halus). Singkong (lebih ekonomis, lebih mudah didapat).' },
    ],
  },

  // ── 6. Uwi ──────────────────────────────────────────────────────────────────
  'uwi': {
    deskripsi: 'Umbi genus Dioscorea berwarna daging putih hingga ungu dengan kandungan pati cukup tinggi. Uwi merupakan tanaman pangan tradisional Nusantara yang mulai dikembangkan kembali sebagai pakan ternak alternatif musim kemarau.',
    alias: 'Greater Yam, Water Yam, Ubi Kelapa Putih, Purple Yam',
    asal: 'Asia Tenggara dan Asia Selatan; salah satu umbi asli Nusantara yang telah dibudidayakan sejak prasejarah',
    habitat: 'Dataran rendah hingga 600 mdpl; tumbuh memanjat pohon atau ajir; menyukai tanah gembur dan drainase baik; toleran kekeringan sedang',
    umurPanenIdeal: '8–10 bulan setelah tanam; tanaman merambat mulai layu adalah tanda panen',
    bagianDimanfaatkan: 'Umbi (utama), daun muda (terbatas)',
    produksi: '8–15 ton umbi/ha; hasil bervariasi dengan pemupukan dan irigasi',
    kelebihan: 'Protein lebih tinggi dibanding singkong dan garut; tidak mengandung antinutrisi berbahaya signifikan; dapat disimpan 2–4 minggu pasca panen; nilai budaya tinggi mendukung keberlanjutan budidaya lokal',
    kekurangan: 'Produksi per hektar lebih rendah dibanding singkong; sebagian varietas mengandung diosgenin (sapogenin) dalam kadar rendah yang perlu diperhatikan; harga lebih tinggi dari singkong',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 29, kadarAir: 71,
      pk: 3.8, sk: 4.2, lk: 0.3, abu: 1.6, betn: 90.1,
      tdn: 71, me: 2840,
      ndf: 14.0, adf: 7.0,
      ca: 0.07, p: 0.11, mg: 0.06, na: 0.01, k: 0.52, cl: 0.04, s: 0.08,
      vitamin: 'Vitamin C; Vitamin B6; Tiamin; Niasin; Folat',
      mineral: 'Nilai atas dasar BK. Profil mineral lebih baik dari garut. Masih diperlukan suplementasi Ca untuk ruminansia.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 35,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Pejantan'],
      musimTerbaik: 'Panen Juli–Oktober (musim kemarau); ketersediaan terbatas',
      umurPanenTerbaik: '9–10 bulan — pati maksimal, serat belum tinggi',
      catatan: 'Kupas dan cacah sebelum diberikan ke ruminansia. Untuk babi, dapat dimasak untuk meningkatkan palatabilitas dan kecernaan. Hindari varietas pahit yang mengandung diosgenin tinggi.',
    },
    harga: {
      estimasiAI: 6000, hargaMarketplace: 7000,
      satuan: 'per kg segar', supplier: 'Petani lokal / pasar tradisional daerah',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Dioscorea alata tubers, INRA-CIRAD-AFZ-FAO',
        'FAO (2010) — Yam Production and Utilization in Asia',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia 2023 dan FAO 2010',
      catatan: 'Nilai nutrisi bervariasi antar varietas uwi. Varietas berdaging ungu memiliki kandungan antosianin lebih tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍠', text: 'Uwi menawarkan keseimbangan energi (TDN 71% BK) dan protein (3,8% BK) yang lebih baik dari singkong — menjadikannya pilihan umbi pakan berkualitas untuk daerah yang memiliki budidaya lokal.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein tertinggi kedua di antara umbi Dioscorea lokal. Tidak memerlukan pengolahan khusus sebelum diberikan. Umur simpan lebih panjang (2–4 minggu) dibanding ubi jalar.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ketersediaan pasar terbatas dan musiman. Harga lebih tinggi dari singkong. Beberapa varietas pahit memerlukan perendaman air 24 jam sebelum diberikan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Komponen ransum kering musim kemarau: Uwi 25% + Jerami Fermentasi + Dedak Padi + Mineral Premix — ransum pemeliharaan hemat tanpa jagung saat kemarau panjang.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif setara: Ubi Jalar (palatabilitas lebih baik, lebih mudah didapat). Gembili (saudara genus Dioscorea yang lebih manis dan palatable).' },
    ],
  },

  // ── 7. Gadung ───────────────────────────────────────────────────────────────
  'gadung': {
    deskripsi: 'Umbi tanaman Dioscorea hispida yang mengandung racun alkaloid dioscorine dalam kadar signifikan. Gadung TIDAK BOLEH diberikan langsung tanpa pengolahan intensif. Setelah proses detoksifikasi yang benar, gadung menjadi sumber energi yang aman.',
    alias: 'Intoxicating Yam, Gadung Beracun, Asian Bitter Yam',
    asal: 'Asia Tenggara dan India; tumbuh liar di hutan tropis Jawa, Sumatera, Kalimantan, dan Sulawesi',
    habitat: 'Hutan tropik dataran rendah hingga 1.000 mdpl; tumbuh liar memanjat pohon; ditemukan di tepi hutan, semak belukar, dan lahan terbengkalai',
    umurPanenIdeal: '8–10 bulan setelah tunas; sering dipanen dari tanaman liar (tidak dibudidayakan secara massal)',
    bagianDimanfaatkan: 'Umbi (hanya setelah detoksifikasi)',
    produksi: 'Tidak dibudidayakan massal; hasil bervariasi dari tanaman liar 5–15 kg/tanaman dewasa',
    kelebihan: 'Tumbuh liar tanpa biaya budidaya; dapat menjadi sumber pakan darurat musim kemarau setelah diolah; kandungan pati memadai sebagai sumber energi',
    kekurangan: 'BERACUN jika tidak diolah — dioscorine menyebabkan salivasi berlebihan, kejang, dan kematian ternak; proses detoksifikasi memakan waktu 3–5 hari; tidak cocok untuk peternak tanpa pengetahuan pengolahan',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 30, kadarAir: 70,
      pk: 3.2, sk: 4.0, lk: 0.5, abu: 1.7, betn: 90.6,
      tdn: 71, me: 2840,
      ndf: 14.0, adf: 6.5,
      ca: 0.06, p: 0.09, mg: 0.05, na: 0.01, k: 0.50, cl: 0.03, s: 0.07,
      vitamin: 'Data vitamin terbatas; jejak Vitamin C',
      mineral: 'Nilai atas dasar BK setelah detoksifikasi. Data mineral terbatas. Suplementasi lengkap diperlukan.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan'],
      musimTerbaik: 'Ketersediaan tidak menentu (tanaman liar)',
      umurPanenTerbaik: '8–10 bulan dari pertunasan — kadar pati memadai',
      catatan: '⚠️ WAJIB DETOKSIFIKASI: Iris tipis, rendam air mengalir 24–48 jam, jemur 3–5 hari atau rebus 1 jam. Uji palatabilitas dengan pemberian kecil (100g) sebelum pemberian penuh. TIDAK DIREKOMENDASIKAN untuk peternak pemula.',
    },
    harga: {
      estimasiAI: 2500, hargaMarketplace: null,
      satuan: 'per kg (tanaman liar)', supplier: 'Pengepul lokal / pengumpul hasil hutan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Dioscorea hispida, INRA-CIRAD-AFZ-FAO',
        'Balai Penelitian Tanaman Aneka Kacang & Umbi (2018) — Potensi dan Risiko Gadung',
        'FAO (2001) — Toxic Substances in Plant Foodstuffs — Dioscorine',
      ],
      sumberData: 'Feedipedia 2023; nilai nutrisi setelah detoksifikasi standar',
      catatan: 'PERINGATAN KERAS: Jangan gunakan tanpa pengetahuan detoksifikasi yang tepat. Dosis toksik dioscorine untuk ternak kecil: >2 g/kg BB.',
    },
    aiInsight: [
      { type: 'peringatan', icon: '🚨', text: 'GADUNG WAJIB DETOKSIFIKASI sebelum diberikan ke ternak. Alkaloid dioscorine menyebabkan salivasi, kejang, dan kematian. Prosedur: Iris tipis → Rendam air mengalir 48 jam → Jemur 3–5 hari penuh terik. TIDAK DIREKOMENDASIKAN untuk peternak tanpa pengalaman.' },
      { type: 'fungsi', icon: '⚡', text: 'Setelah detoksifikasi sempurna, gadung menjadi sumber energi (TDN 71% BK) setara uwi — potensi pakan darurat musim kemarau dari sumber liar yang zero-cost.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Proses detoksifikasi 3–5 hari adalah hambatan utama penggunaan massal. Kualitas detoksifikasi sulit dikontrol tanpa pengujian. Satu kesalahan dapat berakibat fatal bagi ternak.' },
      { type: 'kombinasi', icon: '🔗', text: 'Jika sudah terdetoksifikasi dengan benar: Gadung 15% + Rumput + Bungkil — sumber energi darurat musim kemarau. Selalu mulai dengan dosis kecil dan tingkatkan bertahap.' },
      { type: 'alternatif', icon: '🔄', text: 'Fortement direkomendasikan untuk beralih ke alternatif AMAN seperti Uwi, Gembili, atau Singkong. Gadung hanya dipertimbangkan jika tidak ada pilihan lain dan peternak memiliki keahlian pengolahan.' },
    ],
  },

  // ── 8. Kentang ──────────────────────────────────────────────────────────────
  'kentang': {
    deskripsi: 'Umbi dari tanaman Solanum tuberosum yang merupakan sumber karbohidrat dan protein terlengkap di antara umbi-umbian. Kentang afkir (grade B/C) dan sisa pengolahan kentang sering digunakan sebagai pakan ternak yang sangat disukai.',
    alias: 'Potato, Ubi Kentang, Aartappel, Spud',
    asal: 'Pegunungan Andes, Amerika Selatan (Peru–Bolivia); dibawa ke Eropa abad ke-16; kini ditanam luas di dataran tinggi Indonesia (Dieng, Karo, Bedugul)',
    habitat: 'Dataran tinggi 1.000–2.000 mdpl (optimal); suhu 15–20°C; tanah gembur, drainase baik; sensitif terhadap suhu tinggi dan genangan',
    umurPanenIdeal: '3–4 bulan setelah tanam tergantung varietas',
    bagianDimanfaatkan: 'Umbi (utama), kulit kentang (pakan dari industri pengolahan), daun (BERACUN — tidak untuk pakan)',
    produksi: '20–35 ton umbi/ha; varietas unggul dapat mencapai 40 ton/ha',
    kelebihan: 'Protein tertinggi di antara umbi pakan (4,5% BK); palatabilitas sangat baik; kentang afkir grade B/C tersedia melimpah dan murah dari sentra produksi; tidak memerlukan pengolahan sebelum diberikan',
    kekurangan: 'Daun, batang, dan kentang hijau mengandung solanin (TOKSIK); kadar air sangat tinggi; harga lebih mahal dari singkong; terbatas di dataran tinggi',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 4.5, sk: 2.5, lk: 0.2, abu: 1.8, betn: 91.0,
      tdn: 70, me: 2800,
      ndf: 8.0, adf: 3.5,
      ca: 0.05, p: 0.15, mg: 0.09, na: 0.03, k: 0.80, cl: 0.04, s: 0.08,
      vitamin: 'Vitamin C tinggi (±17 mg/100g); Vitamin B6; Tiamin; Niasin; Kalium sangat tinggi',
      mineral: 'Nilai atas dasar BK. Kalium (K) sangat tinggi — perhatikan pada ternak bunting (risiko milk fever/hipokalsemia). P lebih baik dari kebanyakan umbi.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Menyusui', 'Grower', 'Pejantan'],
      musimTerbaik: 'Panen Juni–Agustus dan November–Januari di dataran tinggi; tersedia sepanjang tahun dari cold storage',
      umurPanenTerbaik: '3,5–4 bulan — setelah daun mulai menguning',
      catatan: 'WAJIB: Jangan berikan daun, batang, atau kentang berwarna hijau (mengandung solanin). Hanya berikan umbi matang berwarna kuning/cokelat. Cacah atau belah dua untuk ruminansia besar. Sangat efektif untuk sapi perah saat periode laktasi puncak.',
    },
    harga: {
      estimasiAI: 8000, hargaMarketplace: 6000,
      satuan: 'per kg (grade B/C)', supplier: 'Petani dataran tinggi / pedagang kentang / pabrik chips',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2001) — Nutrient Requirements of Dairy Cattle, 7th Ed.',
        'Feedipedia (2023) — Solanum tuberosum tubers, INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'FAO (2008) — Potato: World Food and Agriculture',
      ],
      sumberData: 'Feedipedia 2023; NRC 2001 untuk data sapi perah',
      catatan: 'Kentang hijau mengandung solanin >200 mg/kg — toksik. Selalu periksa warna sebelum diberikan. Nilai K sangat tinggi (0,8% BK) — batasi pada sapi kering bunting untuk mencegah hipokalsemia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🥔', text: 'Kentang afkir adalah bahan pakan umbi terbaik dari sisi keseimbangan energi-protein — TDN 70% BK dengan PK 4,5% BK dan palatabilitas sangat baik untuk sapi perah dan kambing.' },
      { type: 'peringatan', icon: '🚨', text: 'Daun, batang, dan umbi hijau kentang mengandung SOLANIN — glikosida alkaloid toksik. Gejala keracunan: salivasi, diare, kejang. Pastikan hanya umbi matang berwarna kuning/cokelat yang diberikan.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein 4,5% BK tertinggi di antara umbi pakan. Kalium tinggi mendukung produksi susu sapi perah. Kentang afkir dari pabrik chips/pengolahan sering tersedia murah atau gratis di sentra produksi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kalium sangat tinggi (0,8% BK) — dapat menekan penyerapan Ca dan Mg pada sapi bunting dan berisiko milk fever. Batasi pemberian pada sapi kering 2 minggu sebelum beranak.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula sapi perah: Kentang 20–25% + Hijauan Rumput 40% + Konsentrat 35%. Kentang meningkatkan palatabilitas total ransum dan produksi susu melalui energi fermentable tinggi.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika kentang mahal: Ubi Jalar (palatabilitas serupa, lebih aman K). Jika di dataran rendah: Singkong kering (energi setara, tersedia lebih luas).' },
    ],
  },

  // ── 9. Bengkuang ────────────────────────────────────────────────────────────
  'bengkuang': {
    deskripsi: 'Umbi akar renyah berair dari famili Fabaceae (kacang-kacangan) yang berkadar air sangat tinggi. Bengkuang kaya air dan elektrolit — lebih berfungsi sebagai sumber hidrasi dan mineral ringan daripada sumber energi utama.',
    alias: 'Jicama, Mexican Turnip, Yam Bean Root, Singkamas',
    asal: 'Meksiko dan Amerika Tengah; diintroduksi ke Asia oleh Spanyol via Filipina; kini dibudidayakan luas di Jawa dan Sumatera',
    habitat: 'Dataran rendah dan menengah hingga 1.300 mdpl; tumbuh baik di tanah liat berpasir; memerlukan drainase baik; sensitif terhadap suhu rendah',
    umurPanenIdeal: '4–5 bulan setelah tanam untuk umbi segar konsumsi; 5–6 bulan untuk ukuran lebih besar',
    bagianDimanfaatkan: 'Umbi akar (aman); DAUN DAN BIJI BERACUN (mengandung rotenon — insektisida alami)',
    produksi: '15–25 ton umbi/ha; produksi relatif konsisten sepanjang tahun di daerah tropis',
    kelebihan: 'Kadar air 89% memberikan efek hidrasi penting; palatabilitas sangat baik karena manis dan segar; bebas antinutrisi pada umbi; mudah dibudidayakan',
    kekurangan: 'Kadar air sangat tinggi (89%) — nilai nutrisi per kg segar sangat rendah; energi dan protein keduanya rendah; daun dan biji BERACUN (rotenon); biaya transportasi tinggi akibat berat air',
    bentuk: ['Segar'],
    nutrisi: {
      bk: 11, kadarAir: 89,
      pk: 2.5, sk: 1.8, lk: 0.2, abu: 0.9, betn: 94.6,
      tdn: 55, me: 2200,
      ndf: 7.0, adf: 3.0,
      ca: 0.04, p: 0.07, mg: 0.04, na: 0.01, k: 0.35, cl: 0.02, s: 0.04,
      vitamin: 'Vitamin C sangat tinggi (±20 mg/100g); Folat; Tiamin',
      mineral: 'Nilai atas dasar BK. Profil mineral sangat rendah akibat dominasi air. Kandungan BK hanya 11%.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Bunting', 'Menyusui'],
      musimTerbaik: 'Tersedia sepanjang tahun; puncak Desember–Maret (musim panen utama)',
      umurPanenTerbaik: '4–5 bulan — umbi segar, renyah, dan berair optimal',
      catatan: 'PENTING: Jangan berikan daun dan biji bengkuang — mengandung rotenon toksik. Hanya umbi yang aman. Batasi 15% ransum karena nilai BK sangat rendah. Berguna terutama sebagai sumber cairan dan palatabilitas pada musim kemarau.',
    },
    harga: {
      estimasiAI: 4000, hargaMarketplace: 4500,
      satuan: 'per kg segar', supplier: 'Petani lokal / pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Pachyrhizus erosus tubers, INRA-CIRAD-AFZ-FAO',
        'FAO (2001) — Underutilized Andean Food Crops',
        'Balai Pengkajian Teknologi Pertanian — Potensi Bengkuang sebagai Bahan Pakan',
      ],
      sumberData: 'Feedipedia 2023; analisis komposisi umbi bengkuang dari literatur terbatas',
      catatan: 'Data nutrisi bengkuang untuk pakan ternak sangat terbatas. Nilai merupakan estimasi dari Feedipedia dan komposisi proksimat pangan. Daun dan biji TIDAK untuk pakan ternak.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '💧', text: 'Bengkuang berfungsi terutama sebagai suplemen hidrasi dan palatabilitas — kadar air 89% memberikan cairan ekstra di musim kemarau. Bukan sumber energi utama.' },
      { type: 'peringatan', icon: '🚨', text: 'DAUN DAN BIJI BENGKUANG MENGANDUNG ROTENON — insektisida alami yang toksik bagi ternak dan ikan. Hanya umbi akar yang aman diberikan. Pastikan tidak ada bagian daun yang ikut tercampur.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kandungan BK hanya 11% — lebih dari 89% adalah air. Nilai nutrisi per kg segar sangat rendah. Tidak efisien sebagai sumber energi atau protein. Harga cukup mahal relatif terhadap nilai gizinya.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas sangat baik dan dapat meningkatkan konsumsi ransum total. Berguna sebagai "pemancing selera" pada ternak yang nafsu makannya sedang turun atau pada musim kemarau saat pakan kering mendominasi.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk manfaat hidrasi serupa: Wortel Pakan (nilai nutrisi lebih tinggi, lebih bergizi). Untuk palatabilitas: Ubi Jalar (lebih bergizi, harga sebanding).' },
    ],
  },

  // ── 10. Bit Pakan ────────────────────────────────────────────────────────────
  'bit-pakan': {
    deskripsi: 'Umbi akar dari tanaman Beta vulgaris yang dibudidayakan khusus untuk pakan ternak (fodder beet). Bit pakan mengandung gula terlarut sangat tinggi yang menghasilkan energi fermentable berlimpah — sangat popular sebagai pakan sapi perah di Eropa.',
    alias: 'Fodder Beet, Mangel-Wurzel, Sugar Beet (for feed), Beta Bit',
    asal: 'Eropa (Mediterania); kini dibudidayakan secara komersial terutama di Selandia Baru, Eropa, dan mulai diperkenalkan di Indonesia',
    habitat: 'Dataran tinggi beriklim sejuk 500–2.000 mdpl; suhu optimal 15–20°C; tanah dalam gembur; tidak cocok untuk iklim panas tropik dataran rendah',
    umurPanenIdeal: '4–6 bulan setelah tanam; siap panen saat daun mulai menguning',
    bagianDimanfaatkan: 'Umbi (utama), daun dan pucuk (protein 12–15% BK sebagai hijauan tambahan)',
    produksi: '30–80 ton umbi/ha di iklim dingin; lebih rendah di Indonesia',
    kelebihan: 'Gula terlarut 60–70% BK — sumber energi fermentable terbaik untuk ruminansia; palatabilitas luar biasa; daun juga bergizi; protein cukup baik (4,5% BK)',
    kekurangan: 'Belum banyak dibudidayakan di Indonesia; membutuhkan iklim sejuk; kadar air 88% tinggi; gula tinggi berisiko asidosis rumen jika transisi terlalu cepat; kaya Na yang perlu diperhatikan',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 12, kadarAir: 88,
      pk: 4.5, sk: 2.0, lk: 0.2, abu: 2.5, betn: 90.8,
      tdn: 74, me: 2960,
      ndf: 7.0, adf: 3.0,
      ca: 0.07, p: 0.12, mg: 0.10, na: 0.18, k: 0.80, cl: 0.10, s: 0.12,
      vitamin: 'Folat tinggi; Vitamin C; Betain (antioksidan khas bit); Beta-karoten dalam daun',
      mineral: 'Nilai atas dasar BK. Na dan K sangat tinggi. Betain (N-trimetilglisin) sebagai osmoprotektan dan donor metil unik pada bit pakan.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Domba'],
      programCocok: ['Menyusui', 'Penggemukan', 'Grower', 'Bunting'],
      musimTerbaik: 'Panen di dataran tinggi Indonesia: April–Juli; sumber pakan musim dingin di Eropa',
      umurPanenTerbaik: '5–6 bulan — kandungan gula maksimal',
      catatan: 'Lakukan transisi bertahap selama 2–3 minggu untuk menghindari asidosis rumen dan diare (gula tinggi). Mulai 2–3 kg/hari lalu naikkan. Batasi 30% ransum. Iris/cacah sebelum diberikan untuk mencegah tersedak.',
    },
    harga: {
      estimasiAI: 5000, hargaMarketplace: 6000,
      satuan: 'per kg segar', supplier: 'Petani dataran tinggi / impor (saat ini terbatas)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2001) — Nutrient Requirements of Dairy Cattle, 7th Ed.',
        'Feedipedia (2023) — Beta vulgaris fodder beet, INRA-CIRAD-AFZ-FAO',
        'DairyNZ (2021) — Fodder Beet Feeding Guide for Dairy Cattle',
        'FAO (2018) — Feed Resources: Sugar Beet and Fodder Beet',
      ],
      sumberData: 'Feedipedia 2023; DairyNZ 2021; NRC 2001',
      catatan: 'Data berdasarkan literatur Eropa dan Selandia Baru. Budidaya di Indonesia (dataran tinggi) masih dalam tahap pengembangan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Bit Pakan adalah sumber energi fermentable terbaik di antara umbi-umbian — gula terlarut 60–70% BK menghasilkan TDN 74% dengan palatabilitas luar biasa untuk sapi perah. Populer sebagai komponen pakan musim dingin di Eropa.' },
      { type: 'peringatan', icon: '🚨', text: 'Kandungan gula sangat tinggi WAJIB transisi bertahap. Perkenalan langsung >5 kg/hari dapat menyebabkan asidosis rumen akut (pH rumen turun <5,5). Tingkatkan 1–2 kg/hari selama 2–3 minggu pertama.' },
      { type: 'kelebihan', icon: '✅', text: 'Meningkatkan produksi susu sapi perah secara signifikan berkat energi fermentable berlimpah. Betain (osmoprotektan alami) mendukung metabolisme ternak. Daun bit juga bergizi dengan PK 12–15% BK.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Na (0,18% BK) dan K (0,8% BK) sangat tinggi — perlu diimbangi dengan Ca untuk mencegah hipokalsemia. Ketersediaan di Indonesia masih terbatas dan musiman.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula sapi perah optimal: Bit Pakan 20–25% + Hijauan Rumput 40% + Jerami Kering 15% + Konsentrat 20%. Energi bit menggantikan sebagian konsentrat biji-bijian.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika bit pakan tidak tersedia: Singkong kering (energi serupa, lebih mudah didapat) + Tetes Tebu (palatabilitas). Ubi Cilembu sebagai sumber gula alami lokal yang mudah ditemukan.' },
    ],
  },

  // ── 11. Lobak Pakan ─────────────────────────────────────────────────────────
  'lobak-pakan': {
    deskripsi: 'Umbi akar berwarna putih dari famili Brassica yang tumbuh cepat dan kaya air. Digunakan sebagai pakan hijauan segar terutama untuk sapi perah dan kambing. Kadar air 91% menjadikannya sumber hidrasi yang efektif.',
    alias: 'Forage Radish, Daikon (besar), Lobak Putih, Japanese Radish',
    asal: 'Asia Tenggara dan Asia Tengah; kini ditanam luas sebagai sayuran dan pakan di seluruh dunia termasuk dataran tinggi Indonesia',
    habitat: 'Dataran tinggi 500–2.000 mdpl; suhu sejuk 10–22°C; tumbuh cepat (45–60 hari); tanah gembur dalam untuk perkembangan umbi',
    umurPanenIdeal: '45–60 hari setelah semai — sangat cepat dibanding umbi lain',
    bagianDimanfaatkan: 'Umbi (utama), daun dan batang muda (protein 15–18% BK)',
    produksi: '20–40 ton umbi/ha; siklus tanam sangat pendek memungkinkan 4–6 panen/tahun',
    kelebihan: 'Siklus tanam sangat pendek (45–60 hari); palatabilitas baik untuk semua ternak; daun bergizi tinggi; tidak memerlukan pengolahan; dapat dimanfaatkan seluruh bagian tanaman',
    kekurangan: 'Kadar air sangat tinggi (91%) — nilai BK hanya 9%; tidak dapat disimpan lama; musim terbatas di dataran tinggi; glucosinolat dalam jumlah kecil pada varietas tertentu',
    bentuk: ['Segar'],
    nutrisi: {
      bk: 9, kadarAir: 91,
      pk: 3.5, sk: 2.8, lk: 0.2, abu: 1.2, betn: 92.3,
      tdn: 58, me: 2310,
      ndf: 10.0, adf: 4.5,
      ca: 0.06, p: 0.09, mg: 0.05, na: 0.02, k: 0.65, cl: 0.05, s: 0.15,
      vitamin: 'Vitamin C sangat tinggi; Folat; Vitamin K; Glucoraphanin (antioksidan)',
      mineral: 'Nilai atas dasar BK. S tinggi dari glucosinolat. K tinggi. Nilai per kg segar sangat rendah akibat BK hanya 9%.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Perah', 'Kambing', 'Domba', 'Kelinci'],
      programCocok: ['Menyusui', 'Bunting', 'Grower'],
      musimTerbaik: 'Tersedia sepanjang tahun di dataran tinggi dengan penanaman bergulir',
      umurPanenTerbaik: '50–55 hari — sebelum berbunga untuk nutrisi terbaik',
      catatan: 'Batasi 15% ransum karena BK sangat rendah. Manfaatkan daun bersama umbi untuk nilai nutrisi lebih lengkap. Tidak dapat disimpan lebih dari 3–5 hari setelah panen — harus segera diberikan.',
    },
    harga: {
      estimasiAI: 2500, hargaMarketplace: 3000,
      satuan: 'per kg segar', supplier: 'Petani sayuran dataran tinggi / pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Raphanus sativus roots, INRA-CIRAD-AFZ-FAO',
        'Balai Penelitian Ternak (2020) — Hijauan Sayuran sebagai Pakan Ternak',
        'FAO (2018) — Brassica Forages for Livestock',
      ],
      sumberData: 'Feedipedia 2023; data lokal dari BALITNAK',
      catatan: 'BK sangat rendah (9%) berarti nilai per kg segar sangat rendah. Manfaat utama adalah palatabilitas, hidrasi, dan vitamin C. Nilai nutrisi setelah dikeringkan jauh lebih tinggi per kg.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '💧', text: 'Lobak Pakan berfungsi sebagai sumber hidrasi, palatabilitas, dan vitamin C — bukan sebagai sumber energi utama. Siklus tanam 45–60 hari menjadikannya pakan segar cepat yang berguna mengisi celah pakan antar musim.' },
      { type: 'kelebihan', icon: '✅', text: 'Siklus tanam terpendek di antara semua umbi pakan (45–60 hari vs 8–12 bulan singkong). Dapat ditanam sebagai cover crop atau tanaman sela yang memberikan pakan hijauan segar gratis.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK hanya 9% — sapi perlu mengonsumsi 100 kg lobak segar untuk mendapatkan setara 9 kg BK. Tidak efisien sebagai pakan utama. Lebih tepat sebagai supplementary feed dan palatability enhancer.' },
      { type: 'kombinasi', icon: '🔗', text: 'Manfaatkan daun dan umbi lobak bersama untuk memaksimalkan nilai. Kombinasikan: Lobak + Rumput kering + Konsentrat — lobak meningkatkan konsumsi total dan memberikan vitamin segar.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk nilai nutrisi lebih tinggi: Wortel Pakan (BK 11%, beta-karoten lebih tinggi). Untuk palatabilitas serupa: Bengkuang (lebih besar, lebih lama disimpan).' },
    ],
  },

  // ── 12. Wortel Pakan ─────────────────────────────────────────────────────────
  'wortel-pakan': {
    deskripsi: 'Umbi akar dari tanaman Daucus carota yang kaya beta-karoten (provitamin A) dan memiliki palatabilitas sangat baik. Wortel sangat berguna untuk mendukung reproduksi, pertumbuhan, dan sistem imun ternak. Wortel afkir dari pertanian sering tersedia murah.',
    alias: 'Carrot, Wortel Merah, Danggui (Cina)',
    asal: 'Afghanistan dan Iran; dibudidayakan lebih dari 5.000 tahun; kini ditanam di dataran tinggi Indonesia (Karo, Dieng, Cianjur, Lembang)',
    habitat: 'Dataran tinggi 700–1.500 mdpl; suhu 15–22°C; tanah gembur dalam (50 cm) bebas batu untuk perkembangan umbi lurus',
    umurPanenIdeal: '3–4 bulan setelah semai',
    bagianDimanfaatkan: 'Umbi (utama), daun wortel (protein 12–16% BK — dapat diberikan segar)',
    produksi: '20–40 ton umbi/ha; wortel afkir grade C tersedia melimpah dari sentra produksi',
    kelebihan: 'Beta-karoten sangat tinggi (±9.000 µg/100g) — mendukung reproduksi, pertumbuhan anak ternak, dan imunitas; palatabilitas sangat baik; wortel afkir murah dan berlimpah; vitamin C tinggi; tidak memerlukan pengolahan',
    kekurangan: 'Kadar air tinggi (89%); mahal jika membeli wortel konsumsi; ketersediaan di dataran rendah terbatas dan musiman; tidak bisa jadi sumber energi utama',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 11, kadarAir: 89,
      pk: 2.5, sk: 3.5, lk: 0.3, abu: 1.0, betn: 92.7,
      tdn: 62, me: 2480,
      ndf: 12.0, adf: 6.0,
      ca: 0.05, p: 0.08, mg: 0.05, na: 0.02, k: 0.55, cl: 0.04, s: 0.08,
      vitamin: 'Beta-karoten sangat tinggi (±9.000 µg/100g segar = ±82.000 µg/100g BK); Vitamin C; Vitamin K; Biotin',
      mineral: 'Nilai atas dasar BK. Profil mineral cukup seimbang. Beta-karoten adalah nilai utama wortel — setara ±54 mg vitamin A/kg BK.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing', 'Domba', 'Kuda', 'Kelinci'],
      programCocok: ['Bunting', 'Menyusui', 'Grower', 'Indukan'],
      musimTerbaik: 'Panen Mei–September di dataran tinggi; tersedia sepanjang tahun dari cold storage',
      umurPanenTerbaik: '3,5–4 bulan — kadar beta-karoten maksimal',
      catatan: 'Tidak memerlukan pengolahan — berikan langsung atau cacah. Sangat berguna untuk indukan bunting (membantu perkembangan fetus dan vitamin A) dan sapi perah (kualitas susu, imunitas anak). Daun wortel juga diberikan segar.',
    },
    harga: {
      estimasiAI: 4000, hargaMarketplace: 4500,
      satuan: 'per kg (wortel afkir)', supplier: 'Petani dataran tinggi / Pasar Induk / rumah packing wortel',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2001) — Nutrient Requirements of Dairy Cattle',
        'Feedipedia (2023) — Daucus carota roots, INRA-CIRAD-AFZ-FAO',
        'FAO (2018) — Vitamin A and Beta-Carotene in Animal Feed',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
      ],
      sumberData: 'Feedipedia 2023; NRC 2001; analisis beta-karoten dari FAO 2018',
      catatan: 'Beta-karoten wortel adalah nilai utamanya — tidak hanya energi. 1 kg wortel segar mengandung ±90 mg beta-karoten, setara ±50.000 IU vitamin A.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🥕', text: 'Wortel Pakan adalah suplemen beta-karoten (vitamin A) terbaik dari bahan pakan alami — beta-karoten ±82.000 µg/100g BK sangat mendukung reproduksi, imunitas, dan pertumbuhan anak ternak.' },
      { type: 'kelebihan', icon: '✅', text: 'Beta-karoten wortel menurunkan angka kawin berulang pada sapi perah dan meningkatkan angka konsepsi. Wortel afkir grade C tersedia murah atau bahkan gratis dari rumah packing di sentra produksi wortel.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK hanya 11% — seperti lobak, nilai energi per kg segar rendah. Bukan sumber energi utama. Harga wortel konsumsi relatif mahal; gunakan khusus wortel afkir untuk efisiensi biaya.' },
      { type: 'kombinasi', icon: '🔗', text: 'Suplemen reproduksi: Wortel 2–3 kg/hari + ransum standar untuk indukan bunting. Untuk sapi perah: 3–5 kg/hari wortel afkir meningkatkan warna kuning telur dan vitamin A dalam susu.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk beta-karoten: Ubi Jalar oranye (lebih murah, nilai gizi lebih lengkap). Untuk palatabilitas: Ubi Cilembu (gula lebih tinggi). Untuk hidrasi: Bengkuang (air lebih tinggi).' },
    ],
  },

  // ── 13. Ubi Cilembu ──────────────────────────────────────────────────────────
  'ubi-cilembu': {
    deskripsi: 'Varietas premium ubi jalar asal Cilembu, Sumedang, yang terkenal dengan kandungan gula sangat tinggi dan aroma khas seperti madu. Sebagai pakan ternak, Ubi Cilembu memberikan energi tinggi dengan palatabilitas luar biasa dan meningkatkan konsumsi ransum total.',
    alias: 'Ubi Madu Cilembu, Honey Sweet Potato, Sumedang Sweet Potato',
    asal: 'Cilembu, Sumedang, Jawa Barat; dikembangkan secara lokal dari varietas ubi jalar biasa; kini menjadi produk unggulan Kabupaten Sumedang',
    habitat: 'Dataran rendah hingga 800 mdpl dengan suhu 20–32°C; tanah berpasir gembur khas Cilembu memberikan cita rasa khas; adaptif di berbagai lahan',
    umurPanenIdeal: '3,5–4 bulan setelah tanam; ciri: tanaman mulai layu, kulit umbi merah-oranye',
    bagianDimanfaatkan: 'Umbi (utama), daun dan sulur muda (hijauan berprotein tinggi ~18–22% BK)',
    produksi: '15–25 ton umbi/ha; lebih rendah dari ubi jalar biasa karena budidaya lebih intensif',
    kelebihan: 'Gula terlarut sangat tinggi meningkatkan palatabilitas dan energi fermentable; protein 3,8% BK — lebih baik dari singkong; tidak mengandung antinutrisi; daun juga bergizi; mendukung konsumsi ransum total lebih tinggi',
    kekurangan: 'Harga lebih mahal dari ubi jalar biasa; ketersediaan terbatas di luar Jawa Barat; mudah rusak (umur simpan 1–2 minggu); kadar air tinggi',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 33, kadarAir: 67,
      pk: 3.8, sk: 3.2, lk: 0.6, abu: 1.4, betn: 91.0,
      tdn: 74, me: 2960,
      ndf: 11.0, adf: 5.0,
      ca: 0.06, p: 0.12, mg: 0.07, na: 0.02, k: 0.62, cl: 0.05, s: 0.09,
      vitamin: 'Beta-karoten tinggi (varietas oranye); Vitamin C; Vitamin B6; Vitamin E',
      mineral: 'Nilai atas dasar BK. BK lebih tinggi dari ubi jalar biasa (33% vs 31%) karena kadar gula yang lebih terkonsentrasi.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Menyusui', 'Grower', 'Indukan', 'Bunting', 'Pejantan'],
      musimTerbaik: 'Panen September–Desember dan Maret–Juni; tersedia sepanjang tahun di sentra Cilembu',
      umurPanenTerbaik: '3,5–4 bulan — gula terkonsentrasi, palatabilitas terbaik',
      catatan: 'Tidak memerlukan pengolahan sebelum diberikan. Cacah atau iris untuk ruminansia besar. Manfaatkan daun dan sulur muda bersama umbi. Lakukan transisi bertahap jika umbi diberikan dalam jumlah besar (gula tinggi).',
    },
    harga: {
      estimasiAI: 6000, hargaMarketplace: 7000,
      satuan: 'per kg segar', supplier: 'Petani Cilembu / Pasar Sumedang / distributor ubi jalar',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Ipomoea batatas sweet potato varieties, INRA-CIRAD-AFZ-FAO',
        'Balai Penelitian Tanaman Aneka Kacang & Umbi (2019) — Karakteristik Ubi Cilembu',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
      ],
      sumberData: 'Feedipedia 2023 + data komposisi BALITKABI; nilai gula tinggi dikonfirmasi dari analisis proksimat varietas Cilembu',
      catatan: 'Data khusus Ubi Cilembu sebagai pakan ternak masih terbatas. Nilai berdasarkan komposisi ubi jalar premium dengan BK lebih tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍠', text: 'Ubi Cilembu adalah ubi jalar premium dengan TDN 74% BK — energi tertinggi di antara varietas ubi jalar. Gula terlarut tinggi menghasilkan palatabilitas luar biasa yang meningkatkan konsumsi ransum total ternak.' },
      { type: 'kelebihan', icon: '✅', text: 'Gula tinggi meningkatkan fermentasi rumen dan produksi VFA (energi untuk ternak). BK 33% lebih tinggi dari ubi jalar biasa sehingga nilai nutrisi per kg segar lebih baik. Tidak ada antinutrisi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga premi karena reputasi pangan manusia. Ketersediaan terbatas di luar Jawa Barat. Gula tinggi: transisi bertahap diperlukan untuk mencegah diare pada ternak sensitif.' },
      { type: 'kombinasi', icon: '🔗', text: 'Komponen ransum penggemukan intensif: Ubi Cilembu 25–30% + Jerami Fermentasi 30% + Konsentrat 40%. Energi gula tinggi mempercepat pertambahan bobot badan.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih ekonomis: Ubi Jalar biasa (komposisi serupa, harga lebih rendah). Singkong (jika energi yang diinginkan, tidak butuh palatabilitas premium).' },
    ],
  },

  // ── 14. Ubi Ungu ─────────────────────────────────────────────────────────────
  'ubi-ungu': {
    deskripsi: 'Varietas ubi jalar dengan pigmen antosianin ungu yang kuat — antioksidan potent yang memberikan manfaat kesehatan tambahan bagi ternak. Nilai nutrisi setara ubi jalar oranye namun dengan kandungan antosianin jauh lebih tinggi untuk mendukung imunitas dan anti-inflamasi.',
    alias: 'Purple Sweet Potato, Ubi Ungu Jepang, Ayamurasaki, Ubi Kaledonia',
    asal: 'Dikembangkan di Jepang dari varietas Okinawa; kini dibudidayakan di Indonesia terutama Jawa dan Bali sebagai komoditas premium',
    habitat: 'Dataran rendah hingga 800 mdpl; kondisi tumbuh serupa ubi jalar biasa; toleran suhu tropik',
    umurPanenIdeal: '3,5–4 bulan setelah tanam',
    bagianDimanfaatkan: 'Umbi (utama), daun muda (protein 18–22% BK)',
    produksi: '15–20 ton umbi/ha; produktivitas agak lebih rendah dari ubi jalar biasa',
    kelebihan: 'Antosianin (antioksidan) sangat tinggi — mendukung imunitas ternak, mengurangi stres oksidatif, berpotensi menurunkan risiko mastitis pada sapi perah; protein 4,2% BK — tertinggi di antara varietas ubi jalar; tidak ada antinutrisi',
    kekurangan: 'Harga lebih tinggi dari ubi jalar biasa; ketersediaan lebih terbatas; warna ungu daging umbi mungkin membuat beberapa peternak ragu (padahal aman)',
    bentuk: ['Segar', 'Kering', 'Tepung'],
    nutrisi: {
      bk: 28, kadarAir: 72,
      pk: 4.2, sk: 3.0, lk: 0.5, abu: 1.5, betn: 90.8,
      tdn: 73, me: 2920,
      ndf: 11.0, adf: 5.0,
      ca: 0.06, p: 0.12, mg: 0.07, na: 0.02, k: 0.60, cl: 0.05, s: 0.09,
      vitamin: 'Antosianin sangat tinggi (±5.000 mg/100g BK); Vitamin C; Beta-karoten (lebih rendah dari varietas oranye); Vitamin E',
      mineral: 'Nilai atas dasar BK. Profil mineral setara ubi jalar standar. Antosianin adalah keunggulan utama.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Menyusui', 'Grower', 'Indukan', 'Bunting', 'Pejantan'],
      musimTerbaik: 'Tersedia sepanjang tahun di sentra produksi; puncak Agustus–November',
      umurPanenTerbaik: '3,5–4 bulan — antosianin dan pati terkonsentrasi optimal',
      catatan: 'Tidak memerlukan pengolahan. Warna ungu pada feses normal — tidak menandakan masalah kesehatan. Daun muda juga dapat diberikan segar. Sangat baik untuk indukan dan sapi perah karena efek antioksidan.',
    },
    harga: {
      estimasiAI: 5500, hargaMarketplace: 6500,
      satuan: 'per kg segar', supplier: 'Petani lokal / pasar modern / distributor ubi premium',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Ipomoea batatas purple variety, INRA-CIRAD-AFZ-FAO',
        'Yoshimoto, M. et al. (2009) — Anthocyanin composition of purple sweet potato, J. Agric. Food Chem.',
        'Balai Penelitian Tanaman Aneka Kacang & Umbi (2020) — Varietas Unggul Ubi Jalar',
      ],
      sumberData: 'Feedipedia 2023; data antosianin dari Yoshimoto et al. 2009',
      catatan: 'Kandungan antosianin bervariasi signifikan antar varietas ubi ungu. Nilai antosianin tertinggi pada varietas Ayamurasaki dari Jepang.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🟣', text: 'Ubi Ungu menawarkan energi TDN 73% BK dengan manfaat tambahan unik: antosianin ±5.000 mg/100g BK sebagai antioksidan yang mendukung imunitas, mengurangi stres oksidatif, dan potensi menurunkan kasus mastitis subklinis pada sapi perah.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein tertinggi di antara varietas ubi jalar (4,2% BK). Antosianin membantu ternak mengatasi stres panas dan inflamasi. Sangat baik sebagai pakan indukan untuk mendukung imunitas pasif anak ternak lewat kolostrum.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga premium dan ketersediaan terbatas. Efek antioksidan sulit dikuantifikasi secara langsung pada performa produksi. Feses berwarna ungu normal tetapi dapat mengkhawatirkan peternak yang tidak tahu.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ideal untuk sapi perah period laktasi awal: Ubi Ungu 15–20% + Konsentrat + Hijauan. Antosianin membantu pemulihan post-partum dan mendukung kualitas kolostrum untuk anak ternak.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika harga adalah pertimbangan: Ubi Jalar biasa (komposisi setara tanpa antosianin, lebih ekonomis). Untuk antioksidan: Wortel Pakan (beta-karoten, lebih mudah didapat).' },
    ],
  },

  // ── 15. Suweg ────────────────────────────────────────────────────────────────
  'suweg': {
    deskripsi: 'Umbi tanaman Amorphophallus dari famili Araceae yang mengandung glukomanan (serat larut) dalam kadar tinggi. Suweg memerlukan pengolahan sebelum diberikan karena mengandung oksalat dan kalsium oksalat yang menyebabkan iritasi. Setelah dimasak, suweg aman dan bergizi.',
    alias: 'Porang Besar, Elephant Foot Yam, Whitespot Giant Arum, Iles-iles',
    asal: 'Asia Selatan (India) dan Asia Tenggara; tumbuh liar di hutan tropis Jawa, Sumatera, dan Kalimantan',
    habitat: 'Hutan tropik dataran rendah hingga 1.000 mdpl; tumbuh di bawah naungan pohon; sering ditemukan di kebun campuran dan agroforestri',
    umurPanenIdeal: '6–8 bulan setelah tunas muncul; panen saat daun menguning di akhir siklus pertumbuhan',
    bagianDimanfaatkan: 'Umbi corm (setelah dimasak)',
    produksi: '5–15 ton umbi/ha dari budidaya; lebih banyak tersedia dari tanaman liar',
    kelebihan: 'Glukomanan tinggi yang mengontrol kecernaan dan memberikan rasa kenyang; dapat tumbuh di bawah naungan pohon (cocok untuk agroforestri); kandungan gula rendah — aman untuk ternak yang rentan asidosis',
    kekurangan: 'WAJIB DIMASAK — mengandung oksalat kalsium dan raphide yang menyebabkan iritasi; glukomanan tinggi dapat memperlambat fermentasi rumen secara berlebihan jika diberikan dalam jumlah besar; tidak cocok diberikan tunggal',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 24, kadarAir: 76,
      pk: 2.8, sk: 5.5, lk: 0.4, abu: 1.5, betn: 89.8,
      tdn: 65, me: 2600,
      ndf: 20.0, adf: 9.0,
      ca: 0.07, p: 0.09, mg: 0.06, na: 0.01, k: 0.48, cl: 0.03, s: 0.07,
      vitamin: 'Kandungan vitamin rendah; jejak Tiamin dan Niasin',
      mineral: 'Nilai atas dasar BK. NDF lebih tinggi dari umbi lain akibat glukomanan. Oksalat dalam bentuk mentah mengganggu penyerapan Ca.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower'],
      musimTerbaik: 'Panen Juli–Oktober; ketersediaan dari tanaman liar tidak menentu',
      umurPanenTerbaik: '6–8 bulan — pati dan glukomanan terkonsentrasi',
      catatan: 'WAJIB MASAK: Rebus atau kukus 45–60 menit untuk menghilangkan oksalat dan raphide. Jangan berikan mentah. Setelah dimasak, iris atau haluskan. Batasi 20% ransum karena glukomanan dapat mengganggu keseimbangan rumen dalam jumlah besar.',
    },
    harga: {
      estimasiAI: 3500, hargaMarketplace: 4000,
      satuan: 'per kg segar', supplier: 'Petani lokal / pengumpul tanaman hutan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Amorphophallus paeoniifolius, INRA-CIRAD-AFZ-FAO',
        'FAO (2001) — Minor Tubers of Asia — Elephant Foot Yam',
        'Balai Penelitian Tanaman Aneka Kacang & Umbi (2018) — Potensi Suweg sebagai Pakan',
      ],
      sumberData: 'Feedipedia 2023; estimasi dari komposisi genus Amorphophallus',
      catatan: 'Data nutrisi suweg untuk pakan ternak terbatas. Nilai merupakan estimasi berdasarkan data Feedipedia. Kandungan glukomanan ±4–10% BK bervariasi antar ekotipe.',
    },
    aiInsight: [
      { type: 'peringatan', icon: '🚨', text: 'Suweg mentah mengandung oksalat kalsium kristal (raphide) yang menyebabkan iritasi mulut, lidah, dan saluran cerna pada ternak. WAJIB rebus/kukus 45–60 menit sebelum diberikan. Tanpa pengolahan, ternak menolak makan atau mengalami iritasi.' },
      { type: 'fungsi', icon: '🌿', text: 'Setelah dimasak, suweg menjadi sumber karbohidrat moderat (TDN 65% BK) dengan serat glukomanan yang memberikan efek kenyang dan mengontrol kecernaan rumen.' },
      { type: 'kelebihan', icon: '✅', text: 'Tumbuh di bawah naungan pohon — cocok sebagai tanaman pakan di sistem agroforestri. Sumber pakan alternatif dari bawah tegakan pohon yang tidak memerlukan lahan terbuka.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein rendah (2,8% BK) dan wajib dimasak. Glukomanan tinggi dalam jumlah besar dapat memperlambat laju digesta rumen, mengurangi efisiensi pakan secara keseluruhan.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif dari keluarga Araceae yang lebih aman: Kimpul (Xanthosoma) atau Talas (Colocasia) — keduanya tetap perlu dimasak tetapi lebih umum tersedia dan data nutrisi lebih baik.' },
    ],
  },

  // ── 16. Gembili ──────────────────────────────────────────────────────────────
  'gembili': {
    deskripsi: 'Umbi dari genus Dioscorea berasa manis dan bertekstur lembut setelah dimasak. Gembili merupakan saudara lebih kecil uwi dan gadung — namun jauh lebih aman karena tidak mengandung alkaloid toksik. Ternak sangat menyukai gembili karena rasanya yang manis.',
    alias: 'Asiatic Yam, Sweet Yam, Lesser Yam, Ubi Manis',
    asal: 'Asia Tenggara dan Pasifik; salah satu Dioscorea asli Nusantara yang telah lama dimanfaatkan sebagai sumber pangan dan pakan',
    habitat: 'Dataran rendah hingga 1.000 mdpl; tumbuh memanjat pohon atau ajir; menyukai tanah gembur drainase baik; lebih toleran terhadap kondisi lembab dibanding gadung',
    umurPanenIdeal: '5–7 bulan setelah tanam; lebih cepat dari uwi dan gadung',
    bagianDimanfaatkan: 'Umbi (utama); daun muda (terbatas sebagai hijauan)',
    produksi: '8–15 ton umbi/ha; lebih rendah dari singkong tetapi nilai nutrisi per ton lebih tinggi',
    kelebihan: 'Tidak mengandung alkaloid toksik (berbeda dari gadung); palatabilitas baik karena lebih manis; umur panen lebih cepat dari uwi; protein 3,5% BK — lebih baik dari singkong',
    kekurangan: 'Produksi per hektar lebih rendah dari singkong; ketersediaan komersial terbatas; data nutrisi lebih sedikit dibanding umbi utama; harga lebih tinggi dari singkong',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 26, kadarAir: 74,
      pk: 3.5, sk: 3.8, lk: 0.4, abu: 1.8, betn: 90.5,
      tdn: 70, me: 2800,
      ndf: 13.0, adf: 6.5,
      ca: 0.07, p: 0.11, mg: 0.06, na: 0.01, k: 0.50, cl: 0.04, s: 0.08,
      vitamin: 'Vitamin C; Vitamin B6; Tiamin; Niasin — profil serupa dengan uwi',
      mineral: 'Nilai atas dasar BK. Profil mineral lebih baik dari singkong dan garut. Masih perlu suplementasi Ca untuk ruminansia.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 35,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Pejantan'],
      musimTerbaik: 'Panen Mei–September; ketersediaan terbatas dan musiman',
      umurPanenTerbaik: '6–7 bulan — pati dan rasa manis optimal',
      catatan: 'Tidak memerlukan pengolahan wajib seperti gadung atau talas — dapat diberikan segar setelah dikupas dan dicacah. Lebih aman dan lebih palatable dari uwi dan gadung.',
    },
    harga: {
      estimasiAI: 5000, hargaMarketplace: 6000,
      satuan: 'per kg segar', supplier: 'Petani lokal / pengumpul umbi',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Dioscorea esculenta, INRA-CIRAD-AFZ-FAO',
        'FAO (2010) — Yam and Minor Dioscorea Species in Asia',
        'Balai Pengkajian Teknologi Pertanian (2019) — Umbi-umbian Lokal Indonesia',
      ],
      sumberData: 'Feedipedia 2023 dan FAO 2010',
      catatan: 'Data nutrisi Dioscorea esculenta untuk pakan ternak terbatas. Nilai diekstrapolasi dari data proksimat genus Dioscorea serupa.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍠', text: 'Gembili adalah Dioscorea paling aman dan paling palatable untuk pakan ternak — tidak ada alkaloid toksik seperti gadung, manis seperti uwi, namun lebih cepat panen (5–7 bulan).' },
      { type: 'kelebihan', icon: '✅', text: 'Satu-satunya Dioscorea yang dapat diberikan segar tanpa pengolahan wajib dan memiliki palatabilitas baik. Protein 3,5% BK lebih baik dari singkong dan garut.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ketersediaan komersial sangat terbatas — belum ada rantai pasok terorganisir. Harus dicari dari petani skala kecil. Data nutrisi lebih sedikit dari umbi utama.' },
      { type: 'kombinasi', icon: '🔗', text: 'Komponen ransum peternakan rakyat: Gembili 20–25% + Jerami Padi + Dedak + Hijauan. Gembili menambahkan energi dan palatabilitas pada ransum berbasis jerami yang membosankan.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika gembili tidak tersedia: Uwi (saudara Dioscorea, lebih mudah didapat). Ubi Jalar (palatabilitas serupa, jauh lebih mudah diperoleh dan lebih produktif).' },
    ],
  },

  // ── 17. Kimpul ───────────────────────────────────────────────────────────────
  'kimpul': {
    deskripsi: 'Umbi kerabat talas (Xanthosoma sagittifolium) yang cukup populer di daerah perdesaan Jawa dan Sumatera. Seperti talas, kimpul mengandung oksalat dan harus dimasak sebelum diberikan ke ternak. Setelah matang, kimpul adalah pakan karbohidrat yang cukup baik.',
    alias: 'Tannia, Malanga, New Cocoyam, Taro Raksasa',
    asal: 'Amerika Tropis (Karibia dan Amerika Tengah); diperkenalkan ke Afrika dan Asia sebagai tanaman pangan; kini tumbuh liar dan dibudidayakan di Jawa dan Sumatera',
    habitat: 'Dataran rendah hingga 1.000 mdpl; lebih toleran terhadap tanah miskin dibanding talas; sering ditemukan di kebun pekarangan dan lahan basah',
    umurPanenIdeal: '8–10 bulan setelah tanam; masa simpan umbi lebih panjang dari talas',
    bagianDimanfaatkan: 'Umbi (utama, setelah dimasak), daun muda (setelah dimasak)',
    produksi: '10–20 ton umbi/ha; produktivitas stabil di lahan marginal',
    kelebihan: 'Lebih toleran terhadap lahan marginal dan miskin dibanding talas; masa simpan umbi lebih panjang (3–4 minggu); cukup mudah dibudidayakan; protein 3% BK cukup memadai',
    kekurangan: 'WAJIB DIMASAK seperti talas; mengandung oksalat kalsium; palatabilitas lebih rendah dari ubi jalar; data nutrisi sebagai pakan ternak sangat terbatas',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 24, kadarAir: 76,
      pk: 3.0, sk: 4.0, lk: 0.3, abu: 1.5, betn: 91.2,
      tdn: 67, me: 2680,
      ndf: 12.0, adf: 5.5,
      ca: 0.07, p: 0.09, mg: 0.06, na: 0.01, k: 0.46, cl: 0.04, s: 0.07,
      vitamin: 'Vitamin C; Beta-karoten dalam jumlah kecil; Tiamin',
      mineral: 'Nilai atas dasar BK. Oksalat mengganggu penyerapan Ca dalam bentuk mentah — wajib masak.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower'],
      musimTerbaik: 'Panen September–Desember; tersedia dari pekarangan sepanjang tahun dalam jumlah kecil',
      umurPanenTerbaik: '8–9 bulan — pati optimal',
      catatan: 'WAJIB MASAK: Rebus/kukus 30–45 menit sebelum diberikan untuk menghilangkan oksalat. Sama seperti talas dalam hal persiapan. Batasi 25% ransum.',
    },
    harga: {
      estimasiAI: 3500, hargaMarketplace: 4000,
      satuan: 'per kg segar', supplier: 'Petani lokal / kebun pekarangan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Xanthosoma sagittifolium corms, INRA-CIRAD-AFZ-FAO',
        'FAO (2001) — Cocoyam and Tannia as Food and Feed',
        'Balai Pengkajian Teknologi Pertanian (2019) — Umbi-umbian Lokal Indonesia',
      ],
      sumberData: 'Feedipedia 2023; estimasi dari data genus Xanthosoma',
      catatan: 'Data nutrisi kimpul sebagai pakan ternak sangat terbatas. Nilai merupakan estimasi berdasarkan komposisi Xanthosoma yang tersedia di Feedipedia.',
    },
    aiInsight: [
      { type: 'peringatan', icon: '🚨', text: 'Kimpul mentah mengandung oksalat kalsium — WAJIB dimasak (rebus 30–45 menit) sebelum diberikan ke ternak. Prosedur sama dengan talas. Tanpa pengolahan dapat menyebabkan iritasi saluran cerna.' },
      { type: 'fungsi', icon: '🌿', text: 'Setelah dimasak, kimpul memberikan energi TDN 67% BK sebagai sumber karbohidrat tambahan yang tumbuh di lahan marginal — cocok untuk peternakan rakyat berbasis kebun pekarangan.' },
      { type: 'kelebihan', icon: '✅', text: 'Lebih toleran lahan marginal dibanding talas. Umur simpan umbi lebih panjang (3–4 minggu) dibanding ubi jalar. Mudah diperoleh dari kebun pekarangan tanpa biaya budidaya.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Keharusan memasak menambah biaya dan waktu. Palatabilitas lebih rendah dari ubi jalar setelah dimasak. Data nutrisi untuk ternak masih sangat terbatas.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika menginginkan umbi tanpa wajib masak: Ubi Jalar (lebih palatable, tidak perlu masak). Jika lahan marginal tersedia: Suweg (tumbuh di bawah naungan). Talas untuk lahan basah.' },
    ],
  },

  // ── 18. Porang ────────────────────────────────────────────────────────────────
  'porang': {
    deskripsi: 'Umbi tanaman Amorphophallus muelleri yang sangat kaya glukomanan — serat larut yang menjadi komoditas ekspor utama Indonesia untuk industri pangan dan kesehatan. Sebagai pakan ternak, porang memiliki nilai nutrisi moderat dan harus diolah dahulu untuk menghilangkan asam oksalat.',
    alias: 'Konjac, Iles-iles, Devil\'s Tongue, Porang Chip',
    asal: 'Asia Tenggara, khususnya Jawa; kini dibudidayakan intensif di Jawa Timur dan Jawa Tengah sebagai komoditas ekspor bernilai tinggi',
    habitat: 'Dataran rendah hingga 800 mdpl; tumbuh di bawah naungan pohon (intensitas cahaya 50–60%); tanah gembur kaya bahan organik',
    umurPanenIdeal: '6–8 bulan; umbi semakin besar dengan siklus tanam berikutnya (2–3 tahun untuk ukuran panen optimal)',
    bagianDimanfaatkan: 'Umbi (setelah pengolahan untuk pakan); tepung porang (glukomanan) untuk industri',
    produksi: '10–20 ton umbi/ha; harga tinggi untuk industri pangan — sebaiknya prioritaskan ekspor glukomanan',
    kelebihan: 'Glukomanan 40–60% BK — serat larut yang mengontrol kecernaan dan memberikan efek prebiotic; tumbuh di bawah naungan agroforestri; nilai ekonomi umbi untuk ekspor tinggi',
    kekurangan: 'Nilai ekonomi ekspor glukomanan jauh lebih tinggi dari nilai pakan — menjual ke industri lebih menguntungkan dari pada memberi ke ternak; WAJIB DIOLAH untuk menghilangkan oksalat; protein rendah; serat glukomanan sangat tinggi dapat mengganggu kecernaan jika berlebihan',
    bentuk: ['Kering', 'Tepung'],
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 3.5, sk: 8.0, lk: 0.3, abu: 2.0, betn: 86.2,
      tdn: 58, me: 2320,
      ndf: 28.0, adf: 12.0,
      ca: 0.07, p: 0.09, mg: 0.06, na: 0.01, k: 0.48, cl: 0.03, s: 0.07,
      vitamin: 'Data vitamin terbatas; glukomanan adalah komponen dominan',
      mineral: 'Nilai atas dasar BK. NDF sangat tinggi (28%) akibat kandungan glukomanan. Suplementasi mineral lengkap diperlukan.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Kambing'],
      programCocok: ['Penggemukan'],
      musimTerbaik: 'Panen Agustus–Oktober; tidak cocok diberikan segar — harus diolah dahulu',
      umurPanenTerbaik: '6–8 bulan (untuk umbi cukup besar)',
      catatan: 'CATATAN EKONOMI: Umbi porang bernilai sangat tinggi untuk ekspor glukomanan (Rp 20.000–50.000/kg chip kering). Pertimbangkan menjual ke industri daripada digunakan sebagai pakan biasa. Jika menggunakan untuk pakan: olah menjadi chip kering terlebih dahulu. BATASI 15% ransum karena glukomanan tinggi dapat memperlambat laju digesta berlebihan.',
    },
    harga: {
      estimasiAI: 4000, hargaMarketplace: null,
      satuan: 'per kg segar (nilai industri jauh lebih tinggi)', supplier: 'Petani porang / koperasi ekspor',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Amorphophallus muelleri, INRA-CIRAD-AFZ-FAO',
        'Kementerian Pertanian RI (2021) — Pengembangan Porang sebagai Komoditas Ekspor',
        'FAO (2001) — Konjac and Porang in Asia',
      ],
      sumberData: 'Feedipedia 2023; Kementan RI 2021',
      catatan: 'Porang memiliki nilai ekonomi jauh lebih tinggi sebagai sumber glukomanan industri daripada sebagai pakan ternak. Pertimbangkan prioritas penggunaan secara ekonomis.',
    },
    aiInsight: [
      { type: 'peringatan', icon: '🚨', text: 'Porang memiliki nilai ekonomi ekspor glukomanan jauh lebih tinggi (Rp 20.000–50.000/kg chip) dibanding nilai sebagai pakan. Sangat tidak efisien secara ekonomi menggunakannya sebagai pakan biasa. Prioritaskan penjualan ke industri pangan.' },
      { type: 'fungsi', icon: '🌿', text: 'Jika digunakan sebagai pakan (dari sisa pengolahan atau kualitas rendah): glukomanan memberikan efek prebiotic yang mendukung kesehatan rumen. Namun TDN hanya 58% BK — bukan sumber energi efisien.' },
      { type: 'kekurangan', icon: '⚠️', text: 'NDF sangat tinggi (28% BK) akibat glukomanan — dapat memperlambat laju digesta rumen secara berlebihan dan menurunkan konsumsi bahan kering jika diberikan lebih dari 15% ransum.' },
      { type: 'kelebihan', icon: '✅', text: 'Sisa/limbah pengolahan porang (onggok porang, kulit chip) dapat dimanfaatkan sebagai pakan dengan nilai ekonomi nol — turning waste into feed. Glukomanan residu masih memberikan manfaat prebiotic.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk sumber serat larut prebiotic yang lebih mudah dan lebih layak sebagai pakan: Suweg (saudara genus, lebih terjangkau). Untuk sumber energi: Singkong (jauh lebih efisien).' },
    ],
  },

  // ── 19. Ubi Kelapa ───────────────────────────────────────────────────────────
  'ubi-kelapa': {
    deskripsi: 'Umbi Dioscorea rotundata (White Guinea Yam atau Ubi Kelapa) yang merupakan salah satu yam/uwi berukuran besar. Berdaging putih-krem, tekstur keras, dan tidak mengandung alkaloid toksik seperti gadung — menjadikannya alternatif uwi yang lebih aman.',
    alias: 'White Guinea Yam, White Yam, African White Yam, Uwi Putih Besar',
    asal: 'Afrika Barat (asal utama D. rotundata); diintroduksi ke Asia sebagai tanaman pangan tropis; budidaya terbatas di Indonesia',
    habitat: 'Dataran rendah hingga 600 mdpl; iklim tropik basah; tanah gembur dalam; tumbuh memanjat pohon atau ajir',
    umurPanenIdeal: '8–10 bulan setelah tanam; lebih panjang dari uwi tetapi ukuran umbi lebih besar',
    bagianDimanfaatkan: 'Umbi (utama); kulit umbi tipis dapat ikut diberikan',
    produksi: '8–15 ton umbi/ha; belum dibudidayakan intensif di Indonesia',
    kelebihan: 'Tidak mengandung alkaloid toksik signifikan; berdaging putih bersih; tidak perlu pengolahan sebelum diberikan (berbeda dari talas dan kimpul); ukuran umbi besar memudahkan pemanenan dan pemberian',
    kekurangan: 'Sangat langka di pasaran Indonesia — lebih banyak ditemukan di Afrika; data nutrisi untuk ternak di kondisi Indonesia terbatas; harga lebih mahal dari uwi',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 28, kadarAir: 72,
      pk: 3.5, sk: 4.0, lk: 0.3, abu: 1.5, betn: 90.7,
      tdn: 71, me: 2840,
      ndf: 14.0, adf: 7.0,
      ca: 0.07, p: 0.10, mg: 0.06, na: 0.01, k: 0.52, cl: 0.04, s: 0.08,
      vitamin: 'Vitamin C; Vitamin B6; Tiamin; profil vitamin serupa uwi',
      mineral: 'Nilai atas dasar BK. Profil mineral setara uwi (Dioscorea alata). Suplementasi Ca untuk ruminansia masih diperlukan.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 35,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Pejantan'],
      musimTerbaik: 'Panen Juli–Oktober; ketersediaan di Indonesia sangat terbatas',
      umurPanenTerbaik: '9–10 bulan — pati maksimal',
      catatan: 'Tidak memerlukan pengolahan sebelum diberikan — kupas dan cacah. Komposisi nutrisi serupa uwi (Dioscorea alata). Gunakan jika tersedia secara lokal.',
    },
    harga: {
      estimasiAI: 7000, hargaMarketplace: null,
      satuan: 'per kg segar (harga estimasi, langka)', supplier: 'Petani khusus / introduksi terbatas',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Dioscorea rotundata tubers, INRA-CIRAD-AFZ-FAO',
        'FAO (2010) — Yam: Post-Harvest Operations',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
      ],
      sumberData: 'Feedipedia 2023; data dari FAO 2010 untuk genus Dioscorea',
      catatan: 'Data nutrisi Dioscorea rotundata untuk ternak di Indonesia sangat terbatas. Nilai diekstrapolasi dari Dioscorea alata (uwi) karena kesamaan genus.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍠', text: 'Ubi Kelapa (D. rotundata) setara nutrisinya dengan Uwi (D. alata) — TDN 71% BK, protein 3,5% BK — namun tidak mengandung alkaloid toksik, menjadikannya pilihan aman dari genus Dioscorea besar.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Sangat langka di Indonesia — lebih umum di Afrika Barat. Sulit diperoleh secara komersial. Jika tersedia, gunakan seperti uwi dalam ransum.' },
      { type: 'kelebihan', icon: '✅', text: 'Aman diberikan tanpa pengolahan wajib. Ukuran umbi besar memudahkan pemberian. Komposisi nutrisi lebih baik dari singkong dengan profil lebih seimbang.' },
      { type: 'alternatif', icon: '🔄', text: 'Substitusi langsung yang lebih mudah didapat: Uwi (Dioscorea alata) — komposisi hampir identik, lebih banyak tersedia di Indonesia. Ubi Jalar jika menginginkan palatabilitas lebih baik.' },
    ],
  },

  // ── 20. Ganyong Merah ────────────────────────────────────────────────────────
  'ganyong-merah': {
    deskripsi: 'Varietas Canna dengan pigmen merah-ungu kuat pada batang dan daun, namun rimpang berwarna putih serupa ganyong biasa. Nilai nutrisi sangat mirip ganyong (Canna edulis) — keduanya adalah sumber pati yang tumbuh liar dan murah di lahan marginal.',
    alias: 'Purple/Red Canna, Achira Rojo, Red Queensland Arrowroot',
    asal: 'Amerika Selatan (Andes); diintroduksi ke Asia dan tumbuh sebagai tanaman hias maupun pangan/pakan di Indonesia',
    habitat: 'Dataran rendah hingga 2.000 mdpl; sangat adaptif; tumbuh di tepi sungai, kebun, dan lahan bero; toleran naungan parsial',
    umurPanenIdeal: '8–12 bulan setelah tanam; daun mulai mengering adalah tanda panen',
    bagianDimanfaatkan: 'Rimpang (pati tinggi), ampas pati (pakan), daun muda',
    produksi: '15–25 ton rimpang/ha; produksi serupa ganyong biasa',
    kelebihan: 'Tumbuh liar tanpa perawatan intensif di lahan marginal; bebas antinutrisi; daun muda dapat diberikan langsung; warna mencolok memudahkan identifikasi di lapangan',
    kekurangan: 'Sangat langka secara komersial; data nutrisi khusus sangat terbatas; protein rendah; sering disalahidentifikasi dengan tanaman hias non-pangan',
    bentuk: ['Segar', 'Kering', 'Tepung'],
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 2.5, sk: 3.5, lk: 0.4, abu: 1.5, betn: 92.1,
      tdn: 67, me: 2680,
      ndf: 11.0, adf: 5.0,
      ca: 0.05, p: 0.09, mg: 0.05, na: 0.01, k: 0.47, cl: 0.03, s: 0.07,
      vitamin: 'Kandungan vitamin rendah; jejak Vitamin C dan Karotenoid dari pigmen',
      mineral: 'Nilai atas dasar BK. Profil mineral sangat rendah — serupa ganyong biasa. Suplementasi lengkap diperlukan.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 20,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Babi'],
      programCocok: ['Penggemukan', 'Grower'],
      musimTerbaik: 'Panen Agustus–November; tersedia dari lahan marginal lokal',
      umurPanenTerbaik: '10–12 bulan — pati maksimal',
      catatan: 'Gunakan sama seperti ganyong biasa. Cacah rimpang sebelum diberikan. Dapat diberikan segar tanpa pengolahan. Daun muda juga berguna sebagai hijauan tambahan.',
    },
    harga: {
      estimasiAI: 4500, hargaMarketplace: null,
      satuan: 'per kg segar (dari lahan lokal)', supplier: 'Petani lokal / kolektor tanaman umbi',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Canna species rhizomes, INRA-CIRAD-AFZ-FAO',
        'Balai Pengkajian Teknologi Pertanian (2019) — Diversifikasi Umbi Pakan Lokal',
        'FAO (2001) — Minor and Underutilized Crops of Asia',
      ],
      sumberData: 'Feedipedia 2023; estimasi dari Canna edulis (ganyong biasa) — komposisi sangat serupa',
      catatan: 'Data khusus Canna discolor sebagai pakan ternak sangat terbatas. Nilai diekstrapolasi dari Canna edulis karena kesamaan genus dan morfologi rimpang.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Ganyong Merah setara nutrisinya dengan Ganyong biasa — TDN 67% BK, bebas antinutrisi, tumbuh liar di lahan marginal. Warna merah batang memudahkan identifikasi namun tidak mempengaruhi nilai gizi rimpang.' },
      { type: 'kelebihan', icon: '✅', text: 'Sumber pakan energi gratis dari lahan bero dan kebun campuran. Tidak memerlukan budidaya intensif. Dapat dipanen secara bergulir dari koloni tanaman yang sudah established.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tidak tersedia secara komersial — harus dicari dari tanaman liar/kebun. Data nutrisi sangat terbatas. Protein rendah — wajib dikombinasikan dengan sumber protein.' },
      { type: 'kombinasi', icon: '🔗', text: 'Sama seperti ganyong: komponen energi ransum ekonomis. Kombinasikan dengan leguminosa lokal (Lamtoro, Gamal) untuk ransum hijauan lengkap dari sumber lokal gratis.' },
      { type: 'alternatif', icon: '🔄', text: 'Praktis identik dengan Ganyong biasa (Canna edulis) — keduanya dapat digunakan secara bergantian. Singkong jika menginginkan ketersediaan lebih luas dan energi lebih tinggi.' },
    ],
  },

};

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getUmbiDetail(id: string): UmbiDetailItem | undefined {
  const base = getUmbiById(id);
  if (!base) return undefined;
  const detail = UMBI_DETAIL[id];
  if (!detail) return undefined;
  return { ...base, ...detail };
}

export function hasUmbiDetail(id: string): boolean {
  return !!UMBI_DETAIL[id];
}

export function getAllUmbiDetailItems(): UmbiDetailItem[] {
  return Object.keys(UMBI_DETAIL)
    .map(id => getUmbiDetail(id))
    .filter((i): i is UmbiDetailItem => !!i);
}

export function computeUmbiRingkasan() {
  const items = getAllUmbiDetailItems();
  const priced = items.filter(i => i.harga.estimasiAI !== null);
  const hargaRataRata = priced.length > 0
    ? Math.round(priced.reduce((s, i) => s + (i.harga.estimasiAI ?? 0), 0) / priced.length)
    : null;
  const terakhirUpdate = items
    .map(i => i.harga.updatedAt)
    .filter((d): d is string => !!d)
    .sort((a, b) => b.localeCompare(a))[0] ?? '—';
  return {
    totalReferensi: items.length,
    hargaRataRata,
    terakhirUpdate,
    dataLengkap: items.length,
  };
}
