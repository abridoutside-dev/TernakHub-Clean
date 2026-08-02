// ─── MP-025 — Detail Data: Buah & Limbah Buah ────────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for every item in
// the "Buah & Limbah Buah" sub-category. Merged with BuahLimbahBuahItem via
// getBuahLimbahDetail().
//
// Sumber data nutrisi:
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi
//     Pakan untuk Indonesia. Gadjah Mada University Press.
//   • Feedipedia (2023). INRA-CIRAD-AFZ-FAO Animal Feed Resources.
//   • JIRCAS (2013). Feed Composition Tables for Southeast Asia.
//   • NRC (2016). Nutrient Requirements of Beef Cattle, 8th Rev. Ed.
//   • Göhl, B. (1981). Tropical Feeds. FAO Animal Production and Health Series.
//   • Bampidis, V.A. & Robinson, P.H. (2006). Citrus by-products as ruminant
//     feeds: A review. Animal Feed Science and Technology, 128, 175-217.
//   • Devendra, C. (1992). Non-conventional feed resources in Asia and the
//     Pacific. FAO/APHCA Publication No. 16.
//   • Sutardi, T. (1980). Landasan Ilmu Nutrisi. IPB Press, Bogor.
//   • Alimon, A.R. (2004). The nutritive value of cocoa pod husk.
//     Cocoa Growers' Bulletin, 55, 14–21.
//
// Nilai proximate (PK, SK, LK, Abu, BETN) atas dasar as-fed.
// TDN, ME, NDF, ADF dinyatakan atas dasar bahan kering (DM basis).
// Mineral (Ca, P, Mg, Na, K, Cl, S) dinyatakan as-fed (%).

import { getBuahLimbahById } from './buahLimbahBuahData';
import type {
  NutrisiData,
  PenggunaanData,
  HargaData,
  ReferensiData,
  AiInsightItem,
  BentukBahan,
} from './jagungData';

export interface BuahLimbahDetailFields {
  asalBahan: string;
  bentuk: BentukBahan[];
  asal: string;
  bagianDimanfaatkan: string;
  metodePengolahan: string | null;
  ketersediaan: string;
  kelebihan: string;
  kekurangan: string;
  nutrisi: NutrisiData;
  penggunaan: PenggunaanData;
  harga: HargaData;
  referensi: ReferensiData;
  aiInsight: AiInsightItem[];
}

const BUAH_LIMBAH_DETAIL: Record<string, BuahLimbahDetailFields> = {

  // ── 1. Pisang ────────────────────────────────────────────────────────────────
  'pisang': {
    asalBahan: 'Buah pisang matang (Musa spp.) segar atau yang sudah terlalu matang dari kebun, pasar, atau sortasi',
    bentuk: ['Segar'],
    asal: 'Tanaman asli Asia Tenggara; dibudidayakan luas di seluruh Indonesia — Lampung, Jawa, Kalimantan, Sulawesi, Sumatera',
    bagianDimanfaatkan: 'Daging buah pisang matang; dapat diberikan dengan atau tanpa kulit',
    metodePengolahan: 'Diberikan langsung segar; cacah atau haluskan untuk unggas kecil; dapat dicampur ke konsentrat',
    ketersediaan: 'Tersedia sepanjang tahun di seluruh Indonesia; harga fluktuatif musiman namun umumnya terjangkau',
    kelebihan: 'Palatabilitas sangat tinggi untuk semua jenis ternak; sumber gula mudah tercerna (sukrosa, glukosa, fruktosa); vitamin B6 dan kalium tinggi; memancing nafsu makan ternak sakit',
    kekurangan: 'Kadar air tinggi (±75%) membatasi konsumsi bahan kering; protein kasar rendah (<5% BK); tidak tahan simpan lebih dari 2–3 hari setelah matang penuh',
    nutrisi: {
      bk: 25, kadarAir: 75,
      pk: 1.1, sk: 0.5, lk: 0.2, abu: 0.8, betn: 22.4,
      tdn: 80, me: 3280,
      ndf: 8, adf: 4,
      ca: 0.01, p: 0.02, mg: 0.03, na: 0.01, k: 0.36, cl: 0.05, s: 0.01,
      vitamin: 'Vitamin B6 tinggi; Vitamin C cukup; beta-karoten rendah; Vitamin B1 (tiamin) dan B2 (riboflavin) sedikit',
      mineral: 'K sangat tinggi (0,36% as-fed); Ca dan P sangat rendah — suplementasi mineral wajib untuk ransum produktif; Mg cukup',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi', 'Ayam'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Bunting'],
      catatan: 'Berikan maksimal 30% ransum BK. Sangat berguna untuk ternak tidak nafsu makan atau pasca sakit. Kombinasikan dengan sumber protein (leguminosa, bungkil) dan mineral. Jangan berikan terlalu banyak sekaligus untuk menghindari diare karena osmotik tinggi.',
    },
    harga: {
      estimasiAI: 2500, hargaMarketplace: 2000,
      satuan: 'per kg segar', supplier: 'Pasar tradisional / kebun pisang / pengepul buah',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 78',
        'Feedipedia (2023) — Banana (Musa spp.), fruit, fresh',
        'Göhl (1981) — Tropical Feeds, FAO, Banana',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat pisang matang (varietas Cavendish dan Raja) dari pasar tradisional Jawa Barat; nilai rata-rata',
      catatan: 'Nilai as-fed. BK bervariasi 20–30% tergantung varietas dan tingkat kematangan. Pisang lebih matang mengandung lebih banyak gula bebas dan BK lebih rendah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍌', text: 'Pisang adalah sumber energi gula cepat tersedia terbaik di antara buah tropis — TDN 80% BK, hampir setara dedak halus. Gula fruktosa dan sukrosa difermentasi cepat di rumen, ideal sebagai pemacing nafsu makan dan energi recovery ternak lemah atau sakit.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas tertinggi di antara semua buah — hampir semua ternak menyukainya tanpa masa adaptasi. K tinggi berguna untuk ternak di cuaca panas. Tersedia sepanjang tahun di seluruh Indonesia dengan harga terjangkau.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein kasar sangat rendah (<5% BK) — harus dikombinasikan dengan sumber protein. Kadar air tinggi membatasi pemberian dalam jumlah besar tanpa diikuti penurunan konsumsi ransum total. Tidak tahan simpan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula kambing perah: Pisang 20% + Hijauan Leguminosa 40% + Dedak 30% + Mineral 10%. Untuk sapi potong: Pisang matang 15% + Jerami amoniasi 45% + Konsentrat 40%. Sangat efektif dicampurkan ke pakan kurang palatabel.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan pisang busuk yang sudah beralkohol — dapat menyebabkan gangguan rumen. Batasi 30% ransum BK; lebih dari itu rawan diare osmotik. Hitung konsumsi BK aktual karena volume pemberian terlihat besar tapi BK sedikit.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika pisang tidak tersedia atau mahal: Pisang Afkir (lebih murah, nilai serupa), Pepaya matang (palatabilitas hampir sama), atau Molases (energi gula serupa dalam bentuk cair).' },
    ],
  },

  // ── 2. Pepaya ────────────────────────────────────────────────────────────────
  'pepaya': {
    asalBahan: 'Buah pepaya matang atau afkir (Carica papaya L.) dari kebun, pasar, atau industri pengolahan',
    bentuk: ['Segar'],
    asal: 'Tanaman asal Amerika Tengah; dibudidayakan luas di seluruh Indonesia terutama Jawa, Sumatera, dan Kalimantan',
    bagianDimanfaatkan: 'Daging buah pepaya matang; termasuk biji yang bisa diberikan dalam jumlah terbatas',
    metodePengolahan: 'Diberikan langsung segar; cacah untuk unggas; dapat dicampurkan ke ransum konsentrat',
    ketersediaan: 'Tersedia sepanjang tahun di hampir seluruh Indonesia; harga murah terutama pepaya afkir dari kebun/pasar',
    kelebihan: 'Kadar air tinggi berguna sebagai sumber hidrasi; vitamin A (beta-karoten) sangat tinggi; enzim papain membantu pencernaan protein; palatabilitas baik',
    kekurangan: 'Protein sangat rendah (<3% BK); BK rendah (±12%) membatasi konsumsi nutrisi; berlebihan dapat menyebabkan diare ringan karena efek laksatif alami',
    nutrisi: {
      bk: 12, kadarAir: 88,
      pk: 0.4, sk: 0.5, lk: 0.1, abu: 0.4, betn: 10.6,
      tdn: 75, me: 3075,
      ndf: 7, adf: 3,
      ca: 0.02, p: 0.01, mg: 0.02, na: 0.01, k: 0.18, cl: 0.03, s: 0.01,
      vitamin: 'Beta-karoten (pro-Vitamin A) sangat tinggi; Vitamin C tinggi; Vitamin E sedikit; Vitamin B kompleks rendah',
      mineral: 'K cukup; Ca dan P rendah; Mg sedikit; suplementasi mineral esensial untuk ransum produktif',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi', 'Ayam'],
      programCocok: ['Grower', 'Indukan', 'Bunting', 'Menyusui'],
      catatan: 'Berikan segar sebagai suplemen vitamin A dan sumber hidrasi. Maksimal 25% ransum BK. Sangat berguna untuk ternak bunting akhir dan menyusui yang butuh vitamin A. Pepaya matang dapat diberikan utuh (termasuk biji dalam jumlah kecil). Hati-hati pemberian berlebihan menyebabkan feses lunak.',
    },
    harga: {
      estimasiAI: 2000, hargaMarketplace: 1500,
      satuan: 'per kg segar', supplier: 'Pasar tradisional / kebun pepaya / pengepul buah afkir',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Feedipedia (2023) — Papaya (Carica papaya), fruit, ripe, fresh',
        'Göhl (1981) — Tropical Feeds, FAO, Papaya',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat pepaya matang varietas lokal (California, Bangkok) dari kebun Jawa Barat; rata-rata nilai nutrisi',
      catatan: 'Nilai as-fed. BK bervariasi 10–15% tergantung varietas dan kematangan. Beta-karoten: ±500–1500 µg/100g tergantung intensitas warna daging (lebih oranye = lebih tinggi).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍈', text: 'Pepaya adalah suplemen vitamin A alami yang ekonomis — beta-karoten sangat tinggi, ideal untuk mencegah defisiensi vitamin A pada ternak bunting dan anakan. Enzim papain juga membantu efisiensi pencernaan protein ransum.' },
      { type: 'kelebihan', icon: '✅', text: 'Sumber beta-karoten (pro-vitamin A) terbaik di antara buah tropis murah. Kadar air tinggi membantu hidrasi ternak di musim kemarau. Pepaya afkir tersedia gratis atau sangat murah dari pasar dan kebun.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK hanya 12% — nilai nutrisi per kg segar sangat rendah. Protein hampir nol. Berlebihan (>25% ransum) menyebabkan feses lembek karena efek laksatif alami papain dan kandungan air tinggi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum kambing bunting: Pepaya segar 10–15% sebagai suplemen vitamin A + Hijauan leguminosa 45% + Dedak 35% + Mineral 10%. Untuk sapi perah: Pepaya 10% + Rumput Gajah 50% + Konsentrat 40% — meningkatkan kualitas vitamin A susu.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan pepaya yang sudah busuk — dapat menyebabkan gangguan rumen. Biji pepaya mengandung karpain — batasi pemberian biji tidak lebih dari 2% ransum. Pepaya muda (mengandung lateks) dalam jumlah besar berpotensi mengiritasi saluran pencernaan.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk vitamin A: Wortel (beta-karoten lebih terkontrol), Daun Pepaya (lebih kaya protein dan vitamin A), atau suplementasi beta-karoten sintetis. Untuk energi buah serupa: Pisang atau Semangka.' },
    ],
  },

  // ── 3. Nanas ─────────────────────────────────────────────────────────────────
  'nanas': {
    asalBahan: 'Buah nanas segar atau afkir (Ananas comosus) dari kebun, pasar, atau sortasi pabrik pengolahan',
    bentuk: ['Segar'],
    asal: 'Tanaman asal Amerika Selatan; sentra produksi Indonesia: Lampung (Pasir Besar), Subang (Jawa Barat), Kediri (Jawa Timur)',
    bagianDimanfaatkan: 'Daging buah nanas termasuk bonggol bagian dalam; umumnya tanpa mahkota dan kulit keras luar',
    metodePengolahan: 'Cacah 3–5 cm sebelum diberikan; hindari pemberian dalam jumlah besar sekaligus karena keasaman; adaptasi bertahap',
    ketersediaan: 'Tersedia cukup stabil terutama di sentra produksi; nanas afkir dan sisa pasar tersedia murah sepanjang tahun',
    kelebihan: 'Mengandung bromelain (protease) yang membantu pencernaan protein; sumber gula mudah tercerna; palatabilitas baik pada sapi dan kambing',
    kekurangan: 'Keasaman tinggi (pH 3,5–4,5) perlu adaptasi bertahap; tidak boleh diberikan berlebihan karena menyebabkan iritasi rumen; protein sangat rendah',
    nutrisi: {
      bk: 13, kadarAir: 87,
      pk: 0.4, sk: 0.4, lk: 0.1, abu: 0.4, betn: 11.7,
      tdn: 72, me: 2952,
      ndf: 6, adf: 3,
      ca: 0.01, p: 0.01, mg: 0.02, na: 0.01, k: 0.11, cl: 0.03, s: 0.01,
      vitamin: 'Vitamin C tinggi (±47 mg/100g); Vitamin B1 sedikit; beta-karoten sangat rendah',
      mineral: 'Mineral secara umum rendah; Mn relatif lebih tinggi dibanding buah lain; Ca dan P rendah',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan'],
      catatan: 'Perkenalkan bertahap selama 5–7 hari (mulai 5% ransum, tingkatkan ke 20%). Tidak boleh lebih dari 20% ransum karena keasaman. Hindari pemberian nanas busuk atau difermentasi spontan. Ideal dikombinasikan dengan hijauan yang mengandung buffer rumen (leguminosa dengan kapasitas buffer tinggi).',
    },
    harga: {
      estimasiAI: 3000, hargaMarketplace: 2500,
      satuan: 'per kg segar', supplier: 'Kebun nanas / pasar tradisional / pabrik pengolahan nanas (nanas afkir)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Pineapple (Ananas comosus), fruit, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Göhl (1981) — Tropical Feeds, FAO, Pineapple',
      ],
      sumberData: 'Analisis proksimat nanas segar varietas lokal (Smooth Cayenne, Queen) dari sentra produksi Lampung; nilai rata-rata',
      catatan: 'Nilai as-fed. BK bervariasi 11–17% tergantung varietas dan tingkat kematangan. Bromelain aktif di daging buah dan batang (bonggol).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍍', text: 'Nanas adalah sumber bromelain — enzim protease yang membantu pencernaan protein ransum di saluran cerna non-ruminan dan berpotensi meningkatkan kecernaan protein pada ruminansia. TDN 72% BK membuatnya sebanding dengan bahan energi moderat.' },
      { type: 'kelebihan', icon: '✅', text: 'Bromelain memiliki efek positif pada kecernaan protein. Vitamin C tinggi mendukung sistem imun ternak. Nanas afkir dari pasar dan kebun tersedia dengan harga sangat murah. Rasa asam manis disukai sapi dan kambing.' },
      { type: 'kekurangan', icon: '⚠️', text: 'pH sangat rendah (3,5–4,5) — keasaman tinggi berpotensi mengganggu buffer rumen jika diberikan terlalu banyak. Protein sangat rendah. Perlu adaptasi bertahap untuk menghindari gangguan rumen akut.' },
      { type: 'kombinasi', icon: '🔗', text: 'Nanas 15% + Hijauan Leguminosa 50% + Dedak 35% — leguminosa berfungsi sebagai buffer rumen yang menetralisir keasaman nanas. Hindari kombinasi dengan bahan pakan asam lain (jeruk, belimbing) dalam proporsi tinggi bersamaan.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan langsung berikan nanas 20% pada ternak yang belum biasa — mulai dari 5% dan adaptasikan 7 hari. Nanas difermentasi spontan (beralkohol/bau) harus dibuang. Keasaman tinggi tidak cocok untuk ternak dengan riwayat acidosis.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika nanas terlalu asam: Pepaya matang (lebih netral pH-nya) atau Pisang (tidak ada masalah keasaman). Untuk efek protease serupa: Pepaya muda (papain) adalah alternatif terbaik.' },
    ],
  },

  // ── 4. Mangga ────────────────────────────────────────────────────────────────
  'mangga': {
    asalBahan: 'Buah mangga matang atau afkir (Mangifera indica L.) dari kebun, pasar, atau industri pengolahan mangga',
    bentuk: ['Segar'],
    asal: 'Tanaman asal Asia Selatan (India); sentra produksi Indonesia: Jawa Timur (Probolinggo, Pasuruan), Jawa Barat (Indramayu, Cirebon), NTB',
    bagianDimanfaatkan: 'Daging buah mangga matang (tanpa biji); dapat diberikan dengan kulit tipis (mango skin)',
    metodePengolahan: 'Diberikan langsung segar; buang biji karena keras; dapat dicacah untuk memudahkan konsumsi; hindari mangga belum matang (getah tinggi)',
    ketersediaan: 'Musiman: puncak musim mangga November–Januari dan April–Juni; afkir pasar tersedia cukup melimpah di musim panen',
    kelebihan: 'Palatabilitas tinggi; vitamin A (beta-karoten) dan C tinggi; gula alami mudah tercerna; kandungan air membantu hidrasi',
    kekurangan: 'Sangat musiman; mangga berlebihan menyebabkan diare karena kandungan gula tinggi; biji keras tidak boleh diberikan; kulit mengandung tanin dan iritan',
    nutrisi: {
      bk: 17, kadarAir: 83,
      pk: 0.5, sk: 0.5, lk: 0.2, abu: 0.4, betn: 15.4,
      tdn: 78, me: 3198,
      ndf: 7, adf: 4,
      ca: 0.01, p: 0.01, mg: 0.02, na: 0.01, k: 0.17, cl: 0.04, s: 0.01,
      vitamin: 'Beta-karoten (Vitamin A) tinggi; Vitamin C tinggi; Vitamin E sedikit; Vitamin B kompleks rendah',
      mineral: 'K cukup; Mg sedikit; Ca dan P sangat rendah; Cu dan Zn rendah',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Bunting'],
      catatan: 'Berikan pada musim panen saat harga turun. Pisahkan biji sebelum diberikan. Batasi 25% ransum BK untuk menghindari diare. Manfaatkan mangga afkir dari pasar yang dijual murah. Kulit mangga dapat diberikan dalam jumlah terbatas (<5% ransum) setelah adaptasi.',
    },
    harga: {
      estimasiAI: 5000, hargaMarketplace: 4000,
      satuan: 'per kg segar', supplier: 'Kebun mangga / pasar tradisional / sentra pengolahan mangga',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Mango (Mangifera indica), fruit, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat mangga matang varietas lokal (Arumanis, Manalagi, Harum Manis) dari Jawa Timur; nilai rata-rata musim panen',
      catatan: 'Nilai as-fed. BK bervariasi 15–20% tergantung varietas. Beta-karoten tinggi pada varietas berdaging oranye (Arumanis ±1800 µg/100g). Biji mangga mengandung asam tanat — jangan diberikan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🥭', text: 'Mangga adalah sumber vitamin A (beta-karoten) dan energi gula musiman yang murah saat panen raya. TDN 78% BK dan palatabilitas tinggi menjadikannya suplemen energi-vitamin yang sangat disenangi ternak.' },
      { type: 'kelebihan', icon: '✅', text: 'Beta-karoten tinggi mendukung reproduksi dan imunitas ternak. Palatabilitas sangat baik tanpa adaptasi. Mangga afkir dari pasar sering dijual Rp 1.000–2.000/kg saat puncak musim, sangat ekonomis.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Sangat musiman — sulit mendapat pasokan konsisten sepanjang tahun. Kandungan gula tinggi berisiko diare jika berlebihan. Biji keras harus dibuang sebelum pemberian karena tidak bisa dicerna.' },
      { type: 'kombinasi', icon: '🔗', text: 'Manfaatkan saat musim panen: Mangga afkir 20% + Jerami amoniasi 40% + Konsentrat 40% — meningkatkan palatabilitas jerami dan menambah vitamin A. Untuk sapi perah: tambahkan 2–3 kg mangga/hari sebagai suplemen beta-karoten alami untuk meningkatkan warna kuning susu.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan biji mangga — terlalu keras dan mengandung asam tanat. Mangga yang belum matang (getah masih banyak) mengandung urushiol dan iritan yang bisa menyebabkan iritasi mulut. Batasi 25% ransum BK.' },
      { type: 'alternatif', icon: '🔄', text: 'Di luar musim mangga: Pepaya matang (tersedia sepanjang tahun, vitamin A serupa), Pisang (energi gula serupa, palatabilitas sama tinggi), atau Wortel sebagai sumber beta-karoten terkontrol.' },
    ],
  },

  // ── 5. Nangka ────────────────────────────────────────────────────────────────
  'nangka': {
    asalBahan: 'Buah nangka matang atau dami nangka (jaringan putih lunak dalam buah) dari pasar tradisional atau industri pengolahan nangka',
    bentuk: ['Segar'],
    asal: 'Tanaman asli Asia Selatan (India/Bangladesh); dibudidayakan luas di Jawa, Sumatera, Kalimantan, Sulawesi',
    bagianDimanfaatkan: 'Dami nangka (jaringan putih serat lunak) dan daging buah kuning matang; berlimpah sebagai limbah pasar',
    metodePengolahan: 'Diberikan langsung; cacah untuk ternak kecil; dami nangka bisa langsung tanpa perlakuan karena sudah lunak',
    ketersediaan: 'Musiman (Januari–April puncak) namun tersedia hampir sepanjang tahun di Jawa; dami nangka sangat berlimpah dari pasar tradisional',
    kelebihan: 'Palatabilitas sangat baik; sumber karbohidrat mudah tercerna; dami nangka sebagai limbah pasar sangat murah atau gratis; vitamin B kompleks cukup',
    kekurangan: 'Sangat musiman; getah dari nangka mentah bisa menyebabkan masalah pencernaan; protein rendah; dami bisa mengandung lateks jika dipanen belum matang penuh',
    nutrisi: {
      bk: 26, kadarAir: 74,
      pk: 1.5, sk: 0.8, lk: 0.3, abu: 0.8, betn: 23.1,
      tdn: 79, me: 3239,
      ndf: 9, adf: 4,
      ca: 0.02, p: 0.03, mg: 0.03, na: 0.01, k: 0.30, cl: 0.04, s: 0.01,
      vitamin: 'Vitamin B6 cukup; Vitamin C sedikit; beta-karoten rendah (dami putih) hingga sedang (daging kuning)',
      mineral: 'K cukup tinggi; Mg sedikit; Ca dan P rendah; Zn dan Fe rendah',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi', 'Kerbau'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Dami nangka khususnya sangat cocok karena banyak tersedia sebagai limbah pasar. Pastikan nangka sudah matang penuh (tidak ada getah berlebih). Berikan hingga 30% ransum BK. Kombinasikan dengan sumber protein. Dami nangka bisa langsung diberikan tanpa pengolahan.',
    },
    harga: {
      estimasiAI: 3500, hargaMarketplace: 3000,
      satuan: 'per kg segar', supplier: 'Pasar tradisional (dami seringkali gratis) / pedagang nangka / kebun nangka',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Jackfruit (Artocarpus heterophyllus), fruit, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat daging dan dami nangka matang dari pasar tradisional Jawa Tengah dan Jawa Barat; nilai rata-rata',
      catatan: 'Nilai as-fed untuk campuran dami + daging kuning nangka matang. Dami saja memiliki BK sedikit lebih rendah. Getah nangka mengandung ficin dan getah polimer — matang sempurna sebelum diberikan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍈', text: 'Nangka dan daminya adalah sumber karbohidrat mudah tercerna — TDN 79% BK — dengan palatabilitas sangat baik. Dami nangka khususnya adalah limbah pasar yang hampir gratis namun bernilai gizi cukup baik sebagai suplemen energi.' },
      { type: 'kelebihan', icon: '✅', text: 'Dami nangka sangat berlimpah di pasar tradisional dan umumnya gratis atau dijual sangat murah. Palatabilitas tinggi — ternak langsung makan tanpa adaptasi. Karbohidrat mudah tercerna mendukung produktivitas.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein rendah (±6% BK) — perlu kombinasi sumber protein. Sangat musiman untuk buah segar. Nangka mentah (belum matang) mengandung getah dan lateks berlebih yang bisa menyumbat saluran cerna ternak kecil.' },
      { type: 'kombinasi', icon: '🔗', text: 'Dami nangka 20–25% + Leguminosa segar (Gamal, Lamtoro) 40% + Dedak 35% + Mineral 5% — formula ekonomis untuk kambing atau sapi dengan dami nangka gratis dari pasar. Cocok untuk program penggemukan sapi di dekat pasar tradisional.' },
      { type: 'peringatan', icon: '🚨', text: 'Pastikan nangka matang sempurna sebelum diberikan — nangka mentah mengandung getah dan lateks berlebih. Jangan berikan biji nangka mentah dalam jumlah besar (lihat "Biji Nangka" untuk panduan khusus). Batasi 30% ransum BK.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika dami nangka tidak tersedia: Sukun matang (pati tinggi, nilai serupa), Pisang (gula tinggi, palatabilitas sama), atau Pepaya matang. Semua tersedia di pasar dengan harga terjangkau.' },
    ],
  },

  // ── 6. Semangka ──────────────────────────────────────────────────────────────
  'semangka': {
    asalBahan: 'Buah semangka segar atau afkir (Citrullus lanatus) dari kebun, pasar, atau sortasi industri',
    bentuk: ['Segar'],
    asal: 'Tanaman asal Afrika; dibudidayakan luas di Indonesia: Jawa Timur, Sumatera Selatan, Lampung, NTB, NTT',
    bagianDimanfaatkan: 'Seluruh buah termasuk daging merah, kulit putih-hijau, dan biji; diberikan utuh atau dipotong',
    metodePengolahan: 'Diberikan langsung segar; dapat dipotong untuk mempermudah akses; buah utuh kecil (<5 kg) bisa langsung tanpa pemotongan',
    ketersediaan: 'Musiman: puncak Maret–Mei dan Agustus–Oktober; afkir pasar tersedia cukup reguler; harga turun drastis di musim panen',
    kelebihan: 'Kadar air sangat tinggi (±92%) — sumber hidrasi terbaik untuk ternak di musim kemarau; palatabilitas sangat baik; gula alami memberikan energi cepat; L-citrulline mendukung fungsi imun',
    kekurangan: 'BK hanya 8% — nilai nutrisi per kg segar sangat rendah; tidak dapat menjadi pakan utama; sangat musiman; tidak tahan simpan',
    nutrisi: {
      bk: 8, kadarAir: 92,
      pk: 0.5, sk: 0.2, lk: 0.1, abu: 0.3, betn: 7.0,
      tdn: 72, me: 2952,
      ndf: 4, adf: 2,
      ca: 0.01, p: 0.01, mg: 0.01, na: 0.01, k: 0.11, cl: 0.02, s: 0.01,
      vitamin: 'Likopen tinggi (antioksidan); Vitamin C cukup; Vitamin A dari beta-karoten sedang; Vitamin B1 dan B6 sedikit',
      mineral: 'Semua mineral sangat rendah karena kandungan air dominan; K relatif tertinggi; perlu suplementasi mineral untuk pakan lengkap',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Kerbau', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Gunakan terutama sebagai sumber hidrasi dan palatabilitas booster di musim kemarau. Berikan 5–15 kg semangka segar/hari untuk sapi besar saat kemarau. Maksimal 20% ransum BK. Nilai gizi per kg rendah karena kadar air tinggi — jangan menggantikan sumber nutrisi utama. Manfaatkan harga murah saat musim panen.',
    },
    harga: {
      estimasiAI: 3000, hargaMarketplace: 2500,
      satuan: 'per kg segar', supplier: 'Kebun semangka / pasar tradisional / petani (afkir)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Watermelon (Citrullus lanatus), fruit, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Göhl (1981) — Tropical Feeds, FAO',
      ],
      sumberData: 'Analisis proksimat semangka segar varietas lokal dari Jawa Timur dan NTB; nilai rata-rata buah utuh (daging + kulit tipis + biji)',
      catatan: 'Nilai as-fed. BK sangat rendah (7–10%) — hampir semua bobotnya adalah air. Likopen dan Vitamin C lebih tinggi pada semangka berdaging merah tua.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍉', text: 'Semangka adalah suplemen hidrasi terbaik untuk ternak di musim kemarau — kadar air 92% dan palatabilitas sangat tinggi. TDN 72% BK dalam basis kering, namun nilai praktis per kg segar sangat rendah karena hampir semua bobotnya adalah air.' },
      { type: 'kelebihan', icon: '✅', text: 'Sumber hidrasi yang sangat efektif — ternak yang enggan minum air lebih mudah menerima semangka. Harga sangat murah saat musim panen (bisa Rp 500–1.000/kg). Palatabilitas tinggi memancing ternak makan di saat stres panas.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK hanya 8% — kontribusi nutrisi per kg segar sangat minimal. Tidak tahan simpan lebih dari 1–2 hari setelah dipotong. Sangat musiman — tidak tersedia sepanjang tahun dengan harga terjangkau.' },
      { type: 'kombinasi', icon: '🔗', text: 'Musim kemarau: Semangka 10–15% ransum BK (atau 10–20 kg/hari sapi) + Jerami amoniasi 50% + Konsentrat 35%. Likopen antioksidan dalam semangka sinergis dengan vitamin E untuk mengurangi stres oksidatif pada ternak di cuaca panas.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan anggap semangka sebagai sumber nutrisi utama — nilai BK terlalu rendah. Semangka yang sudah busuk harus segera dibuang. Berikan segar — tidak bisa disimpan setelah dipotong. Batasi 20% ransum BK agar tidak menggantikan asupan hijauan utama.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk hidrasi serupa: Melon (nilai gizi sedikit lebih tinggi), Kulit Semangka (lebih murah, nilai serupa). Untuk energi sumber gula yang lebih terkonsentrasi: Molases atau Pisang matang.' },
    ],
  },

  // ── 7. Melon ─────────────────────────────────────────────────────────────────
  'melon': {
    asalBahan: 'Buah melon segar atau afkir (Cucumis melo L.) dari kebun, pasar, atau sortasi pabrik pengolahan melon',
    bentuk: ['Segar'],
    asal: 'Tanaman asal Afrika/Asia Tengah; sentra produksi di Indonesia: Jawa Tengah, Jawa Timur, DIY, Sumatera Selatan',
    bagianDimanfaatkan: 'Daging buah melon (putih/oranye/hijau tergantung varietas); dapat dengan kulit tipis',
    metodePengolahan: 'Diberikan langsung segar; potong untuk memudahkan akses; melon afkir utuh kecil bisa langsung',
    ketersediaan: 'Tersedia sepanjang tahun dari sentra pertanian; melon afkir dan grading reject tersedia murah dari kebun dan pasar',
    kelebihan: 'Palatabilitas sangat baik; kadar air tinggi (±90%) berguna sebagai sumber hidrasi; gula alami mudah tercerna; melon afkir tersedia dengan harga sangat terjangkau',
    kekurangan: 'BK hanya 10% — nilai nutrisi per kg sangat rendah; tidak dapat menjadi sumber nutrisi utama; relatif mahal dibanding semangka untuk manfaat serupa',
    nutrisi: {
      bk: 10, kadarAir: 90,
      pk: 0.7, sk: 0.3, lk: 0.1, abu: 0.4, betn: 8.5,
      tdn: 73, me: 2993,
      ndf: 5, adf: 3,
      ca: 0.01, p: 0.01, mg: 0.02, na: 0.01, k: 0.22, cl: 0.03, s: 0.01,
      vitamin: 'Vitamin C cukup; beta-karoten sedang (varietas oranye/kuning lebih tinggi); Vitamin B kompleks rendah',
      mineral: 'K cukup untuk buah berair tinggi; Mg sedikit; Ca dan P sangat rendah',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan'],
      catatan: 'Gunakan terutama sebagai sumber hidrasi dan palatabilitas booster. Melon afkir dari kebun adalah pilihan ekonomis terbaik. Maksimal 20% ransum BK. Kombinasikan dengan sumber protein dan mineral. Ternak sakit atau stres panas sangat menyukai melon.',
    },
    harga: {
      estimasiAI: 6000, hargaMarketplace: 4000,
      satuan: 'per kg segar (afkir jauh lebih murah)', supplier: 'Kebun melon / pasar tradisional / pengepul afkir melon',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Melon (Cucumis melo), fruit, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Göhl (1981) — Tropical Feeds, FAO',
      ],
      sumberData: 'Analisis proksimat melon segar varietas lokal (Honey Dew, Jade Dew, Action) dari sentra produksi Jawa Tengah; nilai rata-rata',
      catatan: 'Nilai as-fed. BK 8–12% tergantung varietas. Melon oranye (varietas cantaloupe) memiliki beta-karoten lebih tinggi. Nilai nutrisi mirip semangka namun protein sedikit lebih tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍈', text: 'Melon adalah suplemen hidrasi dan palatabilitas booster dengan nilai gizi sedikit lebih baik dari semangka. Kadar air 90% dan palatabilitas sangat tinggi menjadikannya ideal untuk ternak stres panas, sakit, atau kurang nafsu makan.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas luar biasa — semua ternak suka tanpa adaptasi. Melon afkir dari kebun bisa didapat gratis atau sangat murah. Kadar air tinggi membantu keseimbangan cairan tubuh di musim kemarau. Beta-karoten varietas oranye mendukung vitamin A.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK hanya 10% — nilai nutrisi per kg segar sangat rendah. Harga melon kualitas pasar cukup tinggi (Rp 5.000–8.000/kg) — tidak ekonomis. Gunakan hanya melon afkir/reject untuk ekonomis. Tidak tahan simpan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk sapi yang kurang nafsu makan: campur 3–5 kg melon ke 10 kg jerami kering + 2 kg konsentrat — melon meningkatkan palatabilitas keseluruhan ransum secara dramatis. Atau melon 10% ransum BK + hijauan 50% + konsentrat 40%.' },
      { type: 'peringatan', icon: '🚨', text: 'Hanya gunakan melon afkir/reject untuk efisiensi ekonomi. Melon busuk harus dibuang. Jangan berikan berlebihan — efek diare ringan mungkin terjadi karena kadar air sangat tinggi. Batasi 20% ransum BK.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih ekonomis: Semangka afkir (lebih murah, kadar air lebih tinggi), Kulit Melon (bahkan lebih murah), atau Pepaya matang (nilai nutrisi lebih tinggi). Semua berperan serupa sebagai palatabilitas booster.' },
    ],
  },

  // ── 8. Jambu Biji ────────────────────────────────────────────────────────────
  'jambu-biji': {
    asalBahan: 'Buah jambu biji segar atau afkir (Psidium guajava L.) dari kebun, pasar, atau industri pengolahan jus',
    bentuk: ['Segar'],
    asal: 'Tanaman asal Amerika Tropis; dibudidayakan luas di Jawa, Sumatera, Sulawesi; sentra: Bogor, Sukabumi, Lampung, Sumatera Barat',
    bagianDimanfaatkan: 'Daging buah jambu biji matang; biji keras dalam (sangat banyak) dapat diberikan tapi kecernaannya rendah',
    metodePengolahan: 'Diberikan langsung segar; dapat dipotong untuk ternak kecil; biji keras mengurangi nilai nutrisi efektif — ampas jus lebih terkontrol',
    ketersediaan: 'Tersedia hampir sepanjang tahun di sentra produksi; jambu afkir dari industri jus (Bogor, Sukabumi, Lampung) tersedia reguler',
    kelebihan: 'Vitamin C sangat tinggi (4–5× lebih tinggi dari jeruk) mendukung imunitas; pektin tinggi mendukung kesehatan saluran cerna; palatabilitas baik pada ruminansia',
    kekurangan: 'Biji keras banyak (±5% dari berat buah) menurunkan nilai nutrisi efektif; protein sangat rendah; agak mahal dibanding buah afkir lainnya',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 0.9, sk: 1.1, lk: 0.2, abu: 0.6, betn: 17.2,
      tdn: 74, me: 3034,
      ndf: 14, adf: 7,
      ca: 0.02, p: 0.02, mg: 0.02, na: 0.01, k: 0.28, cl: 0.04, s: 0.01,
      vitamin: 'Vitamin C sangat tinggi (200–400 mg/100g); beta-karoten cukup (daging merah/oranye); Vitamin B3 (niacin) sedikit',
      mineral: 'K cukup; Mg sedikit; Ca dan P rendah; Mn lebih tinggi dari rata-rata buah',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Grower', 'Indukan', 'Bunting', 'Menyusui'],
      catatan: 'Berikan segar sebagai suplemen vitamin C dan pektin. Maksimal 20% ransum BK. Ampas jambu dari industri jus adalah pilihan terbaik dari segi ekonomi dan nilai nutrisi (lihat Ampas Jambu untuk detail). Ternak bunting dan menyusui mendapat manfaat imunitas dari vitamin C tinggi.',
    },
    harga: {
      estimasiAI: 4000, hargaMarketplace: 3500,
      satuan: 'per kg segar', supplier: 'Kebun jambu biji / pasar tradisional / pabrik jus jambu (afkir)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Guava (Psidium guajava), fruit, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat jambu biji matang varietas lokal (Kristal, Bangkok, Getas Merah) dari Bogor dan Lampung; nilai rata-rata',
      catatan: 'Nilai as-fed. BK 18–22% tergantung varietas. Vitamin C sangat tinggi pada varietas berdaging putih maupun merah. Kandungan biji signifikan mengurangi kecernaan efektif.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍏', text: 'Jambu biji adalah sumber vitamin C terkaya di antara buah-buahan tropis lokal — hingga 400 mg/100g, jauh melebihi jeruk. Digunakan sebagai suplemen imunitas alami untuk ternak bunting, menyusui, atau dalam kondisi stres.' },
      { type: 'kelebihan', icon: '✅', text: 'Vitamin C tertinggi di antara buah lokal tropis — antioksidan kuat mendukung fungsi imun. Pektin tinggi mendukung kesehatan saluran cerna dan fermentasi rumen. Tersedia cukup sepanjang tahun.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Biji keras banyak mengurangi kecernaan efektif. Protein sangat rendah. Harga lebih tinggi dibanding buah afkir lain untuk manfaat yang sebanding. Biji mengandung tanin yang agak menghambat pencernaan jika berlebihan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Jambu 10–15% + Hijauan 50% + Konsentrat 35% + Mineral 5% — sederhana namun efektif untuk menambah vitamin C ransum. Untuk ternak stres pasca transport: Jambu biji 1–2 kg/hari sapi kecil, 3–5 kg sapi besar sebagai recovery booster.' },
      { type: 'peringatan', icon: '🚨', text: 'Biji jambu biji sangat keras — bisa menyebabkan masalah jika diberikan dalam jumlah sangat besar untuk ternak muda. Batasi 20% ransum BK. Jambu busuk mengandung aflatoksin potensial dari jamur — buang yang rusak.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk vitamin C: Pepaya matang (lebih murah, lebih mudah dicerna), Jambu Air (vitamin C lebih rendah tapi lebih murah), atau suplementasi vitamin C sintetis untuk presisi dosis. Ampas Jambu lebih ekonomis dari buah utuh.' },
    ],
  },

  // ── 9. Belimbing ─────────────────────────────────────────────────────────────
  'belimbing': {
    asalBahan: 'Buah belimbing segar atau afkir (Averrhoa carambola L.) dari kebun atau pasar; termasuk belimbing wuluh (A. bilimbi) yang lebih asam dan berlimpah',
    bentuk: ['Segar'],
    asal: 'Tanaman asal Asia Tenggara; dibudidayakan di Jawa, Bali, Kalimantan; belimbing wuluh sangat umum di pekarangan seluruh Indonesia',
    bagianDimanfaatkan: 'Buah belimbing matang atau semi-matang; diberikan segar dengan atau tanpa biji',
    metodePengolahan: 'Diberikan langsung; adaptasi bertahap karena asam oksalat; jangan berikan berlebihan; layukan 1–2 hari bisa mengurangi keasaman sedikit',
    ketersediaan: 'Belimbing wuluh tersedia sepanjang tahun di pekarangan; belimbing manis lebih musiman dari kebun',
    kelebihan: 'Vitamin C cukup tinggi; sumber hidrasi; belimbing wuluh sebagai limbah pekarangan sangat murah atau gratis; antioksidan flavonoid',
    kekurangan: 'Asam oksalat sedang-tinggi dapat membentuk kalsium oksalat — batasi pemberian; keasaman tinggi berpotensi gangguan rumen; protein sangat rendah',
    nutrisi: {
      bk: 9, kadarAir: 91,
      pk: 0.5, sk: 0.3, lk: 0.1, abu: 0.3, betn: 7.8,
      tdn: 65, me: 2665,
      ndf: 6, adf: 3,
      ca: 0.01, p: 0.01, mg: 0.01, na: 0.01, k: 0.13, cl: 0.03, s: 0.01,
      vitamin: 'Vitamin C cukup (34 mg/100g belimbing manis; lebih tinggi pada wuluh); beta-karoten rendah; Vitamin B kompleks sangat rendah',
      mineral: 'Semua mineral rendah; asam oksalat memengaruhi bioavailabilitas Ca — waspadai pada ternak muda; Mg sangat rendah',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 10,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Grower'],
      catatan: 'Batasi ketat 10% ransum BK karena asam oksalat dan keasaman tinggi. Tidak cocok untuk ternak dengan riwayat gangguan ginjal atau masalah kalsium. Belimbing wuluh lebih asam — batasi lebih ketat (5%). Adaptasi bertahap 7–10 hari. Sebaiknya gunakan sebagai suplemen kecil, bukan bahan utama.',
    },
    harga: {
      estimasiAI: 5000, hargaMarketplace: 4000,
      satuan: 'per kg segar', supplier: 'Pekarangan / kebun belimbing / pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Starfruit (Averrhoa carambola), fruit, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Göhl (1981) — Tropical Feeds, FAO',
      ],
      sumberData: 'Analisis proksimat belimbing manis segar (Averrhoa carambola) dari kebun Jawa Barat; komposisi asam oksalat dari literatur ASEAN food composition',
      catatan: 'Nilai as-fed. Belimbing wuluh memiliki asam oksalat dan asam sitrat lebih tinggi dari belimbing manis. Penggunaan dalam jumlah besar pada ternak bunting tidak disarankan karena risiko Ca oksalat.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⭐', text: 'Belimbing adalah suplemen kecil sumber vitamin C dan antioksidan. TDN 65% BK cukup baik untuk buah berair tinggi, namun BK sangat rendah (9%) membatasi kontribusi nutrisi total. Lebih bermanfaat sebagai palatabilitas booster ocasional daripada bahan pakan reguler.' },
      { type: 'kelebihan', icon: '✅', text: 'Belimbing wuluh tersedia gratis dari pekarangan di hampir seluruh Indonesia — limbah pekarangan yang bisa dimanfaatkan. Antioksidan flavonoid (quercetin, rutin) mendukung imunitas ternak.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Asam oksalat mengikat Ca dan membentuk Ca-oksalat yang tidak dapat diserap — dapat memperburuk status Ca jika diberikan berlebihan. Keasaman tinggi (pH 2–3) berpotensi mengganggu buffer rumen. Batasi ketat 10% ransum BK.' },
      { type: 'kombinasi', icon: '🔗', text: 'Jika ingin memanfaatkan: Belimbing 5% + Hijauan leguminosa kaya Ca (Lamtoro, Gamal) 50% + Dedak 40% + Mineral/Kapur 5% — leguminosa dan kapur menetralisir efek oksalat. Jangan kombinasikan dengan sumber asam lain (jeruk, nanas).' },
      { type: 'peringatan', icon: '🚨', text: 'JANGAN berikan pada ternak bunting tinggi atau ternak dengan masalah ginjal — asam oksalat dapat menyebabkan urolitiasis (batu ginjal). Jangan melebihi 10% ransum. Belimbing wuluh lebih berbahaya dari belimbing manis karena kadar asam lebih tinggi.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk vitamin C yang aman: Jambu biji (lebih kaya vitamin C, tanpa risiko oksalat signifikan) atau Pepaya matang. Untuk palatabilitas booster: Pisang atau Semangka lebih aman dan lebih mudah didapat.' },
    ],
  },

  // ── 10. Sukun ────────────────────────────────────────────────────────────────
  'sukun': {
    asalBahan: 'Buah sukun matang atau sisa pengolahan (Artocarpus altilis); umumnya direbus/kukus sebelum diberikan untuk meningkatkan kecernaan pati',
    bentuk: ['Segar'],
    asal: 'Tanaman asal Pasifik; dibudidayakan di Jawa, Maluku, Papua, Sulawesi; pohon sukun umum di pekarangan dan tepi jalan',
    bagianDimanfaatkan: 'Daging buah sukun matang; tanpa kulit tebal luar dan biji (bila ada); paling baik setelah dikukus/direbus',
    metodePengolahan: 'Kukus atau rebus 15–20 menit sebelum diberikan untuk meningkatkan kecernaan pati dan mengurangi antinutrisi laten; dapat diberikan segar juga',
    ketersediaan: 'Musiman (2× setahun di beberapa daerah); berlimpah di daerah yang memiliki banyak pohon sukun; tersedia dari pekarangan dan kebun',
    kelebihan: 'Pati tinggi (±25% BK) sebagai sumber energi; protein lebih baik dari kebanyakan buah (±6% BK); pohon sukun produktif tinggi tanpa banyak perawatan',
    kekurangan: 'Pati mentah kecernaannya terbatas tanpa pemasakan; sangat musiman; tidak tersedia secara komersial dalam jumlah besar; pohon memerlukan lahan',
    nutrisi: {
      bk: 30, kadarAir: 70,
      pk: 1.8, sk: 1.2, lk: 0.3, abu: 1.0, betn: 25.7,
      tdn: 78, me: 3198,
      ndf: 12, adf: 6,
      ca: 0.02, p: 0.03, mg: 0.04, na: 0.01, k: 0.49, cl: 0.06, s: 0.01,
      vitamin: 'Vitamin C cukup; Vitamin B1 sedikit; beta-karoten sangat rendah (daging putih); Vitamin B6 sedikit',
      mineral: 'K lebih tinggi dari rata-rata buah; P sedikit lebih baik dari buah lain; Ca rendah; Mg cukup untuk buah',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 35,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi', 'Kerbau'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Sebaiknya kukus/rebus sebelum diberikan untuk meningkatkan kecernaan pati dan palatabilitas. Dapat diberikan hingga 35% ransum BK setelah dimasak. Sumber karbohidrat pengganti sebagian ubi kayu atau ubi jalar. Kombinasikan dengan sumber protein (leguminosa, bungkil) dan mineral lengkap.',
    },
    harga: {
      estimasiAI: 4000, hargaMarketplace: 3000,
      satuan: 'per kg segar', supplier: 'Pekarangan / kebun sukun / pasar tradisional daerah sentra',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Breadfruit (Artocarpus altilis), fruit, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat sukun matang segar varietas lokal dari Jawa dan Maluku; rata-rata nilai nutrisi',
      catatan: 'Nilai as-fed. BK bervariasi 25–35% tergantung varietas dan kematangan. Pati sukun: 60–70% BK untuk buah matang. Pemasakan meningkatkan gelatinisasi pati dan kecernaan secara signifikan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍞', text: 'Sukun adalah sumber pati dan energi karbohidrat terbaik di antara buah tropis — TDN 78% BK dan BK ±30% jauh lebih baik dari buah berair tinggi. Dijuluki "roti pohon" karena kandungan pati yang mirip umbi-umbian. Cocok sebagai sumber energi utama pengganti sebagian ubi kayu.' },
      { type: 'kelebihan', icon: '✅', text: 'BK 30% dan TDN 78% jauh lebih baik dari buah berair tinggi seperti semangka atau melon. Protein 6% BK — tertinggi di antara buah non-leguminosa. Pohon sukun berumur panjang dan produktif dengan sedikit perawatan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Pati mentah kecernaannya terbatas — wajib dimasak (kukus/rebus) untuk hasil optimal. Sangat musiman dan tidak tersedia secara komersial besar-besaran. Protein masih rendah untuk pakan utama mandiri.' },
      { type: 'kombinasi', icon: '🔗', text: 'Sukun kukus 30% + Leguminosa segar 40% + Dedak 25% + Mineral 5% — formula ekonomis untuk kambing atau sapi di daerah yang banyak pohon sukun. Bisa menggantikan 30–40% ubi kayu dalam ransum energi berbasis umbi.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan sukun mentah dalam jumlah besar — kecernaan pati sangat rendah dan bisa menyebabkan gangguan fermentasi rumen. Selalu kukus/rebus sebelum diberikan dalam skala lebih dari 15% ransum.' },
      { type: 'alternatif', icon: '🔄', text: 'Sumber pati alternatif: Ubi Kayu (lebih mudah didapat), Ubi Jalar (protein dan vitamin A lebih tinggi), atau Pisang matang (palatabilitas lebih tinggi). Untuk daerah pesisir/Maluku: sukun adalah pilihan lokal terbaik.' },
    ],
  },

  // ── 11. Alpukat ──────────────────────────────────────────────────────────────
  'alpukat': {
    asalBahan: 'Daging buah alpukat matang atau afkir (Persea americana Mill.); HANYA daging buah — biji dan kulit mengandung persin (toksin)',
    bentuk: ['Segar'],
    asal: 'Tanaman asal Meksiko/Amerika Tengah; sentra produksi Indonesia: Jawa Barat (Garut, Tasikmalaya), Jawa Tengah, Sumatera Barat',
    bagianDimanfaatkan: 'HANYA daging buah (mesocarp) alpukat matang — biji dan kulit HARUS dibuang karena mengandung persin yang toksik untuk unggas dan babi',
    metodePengolahan: 'Pisahkan biji dan kulit dengan hati-hati; berikan daging buah segar langsung; dapat dicampur ke pakan konsentrat; jangan dimasak (lemak tidak jenuh rusak oleh panas)',
    ketersediaan: 'Tersedia cukup reguler di sentra produksi; afkir industri pengolahan alpukat (guacamole, minyak alpukat) tersedia di Jawa Barat dan DIY',
    kelebihan: 'Lemak tidak jenuh tunggal (oleat) sangat tinggi (±14% BM) — sumber energi padat; vitamin E tinggi; beta-sitosterol mendukung fungsi imun; palatabilitas sedang-baik untuk ruminansia',
    kekurangan: 'Harga tinggi; biji dan kulit sangat toksik (persin) — prosedur pemisahan wajib; lemak tinggi bisa mengganggu fermentasi rumen jika berlebihan; tidak cocok untuk unggas (persin sangat toksik)',
    nutrisi: {
      bk: 28, kadarAir: 72,
      pk: 1.9, sk: 1.7, lk: 14.7, abu: 1.3, betn: 8.4,
      tdn: 85, me: 3485,
      ndf: 16, adf: 8,
      ca: 0.01, p: 0.05, mg: 0.03, na: 0.01, k: 0.49, cl: 0.04, s: 0.01,
      vitamin: 'Vitamin E sangat tinggi (2,1 mg/100g); Vitamin K cukup tinggi; Vitamin B5, B6 cukup; beta-karoten rendah',
      mineral: 'K tinggi; P lebih baik dari kebanyakan buah; Cu dan Zn sedikit lebih baik dari rata-rata buah',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Kerbau'],
      programCocok: ['Penggemukan', 'Menyusui', 'Indukan', 'Bunting'],
      catatan: 'HANYA untuk ruminansia — JANGAN untuk unggas atau babi (persin sangat toksik). Batasi 15% ransum BK — lemak tinggi dapat mengganggu fermentasi rumen dan menurunkan konsumsi serat. Pisahkan biji dan kulit dengan sangat teliti. Sangat berguna untuk sapi perah karena meningkatkan kandungan lemak susu.',
    },
    harga: {
      estimasiAI: 10000, hargaMarketplace: 8000,
      satuan: 'per kg segar daging buah', supplier: 'Kebun alpukat / industri pengolahan alpukat (afkir)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Avocado (Persea americana), pulp, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
        'NRC (2016) — Nutrient Requirements of Beef Cattle',
      ],
      sumberData: 'Analisis proksimat daging buah alpukat varietas lokal (Ijo Panjang, Mentega) dari Jawa Barat; nilai rata-rata kematangan optimal',
      catatan: 'Nilai as-fed. LK sangat bervariasi (10–20% BM) tergantung varietas dan kematangan. PERSIN: toksik untuk unggas, babi, kuda — dosis lethal; ruminansia lebih toleran namun hindari biji dan kulit.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🥑', text: 'Alpukat adalah sumber energi lemak tidak jenuh paling padat di antara buah tropis — TDN 85% BK, LK 14,7% as-fed. Vitamin E sangat tinggi mendukung fungsi reproduksi dan imunitas. Untuk sapi perah: menambah 1–2 kg daging alpukat/hari dapat meningkatkan kadar lemak susu.' },
      { type: 'kelebihan', icon: '✅', text: 'Energi padat dari lemak oleat tidak jenuh — lebih tahan oksidasi dibanding lemak jenuh. Vitamin E tertinggi di antara buah. Berguna untuk ternak kurus yang perlu peningkatan kondisi tubuh cepat. Afkir industri guacamole bisa didapat lebih ekonomis.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga tinggi. Biji dan kulit mengandung persin yang sangat toksik — prosedur pemisahan wajib dan tidak boleh salah. Lemak tinggi mengganggu fermentasi serat rumen jika >15% ransum. TIDAK BOLEH untuk unggas dan babi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Sapi perah: Alpukat daging 1–1,5 kg/hari + Hijauan 60% + Konsentrat 38% — meningkatkan lemak susu dan vitamin E. Untuk penggemukan sapi: 5% daging alpukat + 95% ransum standar — penambah energi padat tanpa overload karbohidrat fermentable.' },
      { type: 'peringatan', icon: '🚨', text: '⛔ JANGAN berikan biji dan kulit alpukat kepada ternak APAPUN — persin adalah toksin yang menyebabkan nekrosis miokardium (kerusakan jantung) pada unggas dan babi, serta mastitis pada sapi perah. HANYA daging buah yang aman untuk ruminansia. JANGAN berikan ke unggas atau babi sama sekali.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk lemak tambahan yang aman: Minyak Sawit atau Lemak Bypass (Ca-soap) lebih terkontrol dan ekonomis. Untuk vitamin E: dedak gandum atau suplementasi vitamin E sintetis lebih praktis. Alpukat paling masuk akal dimanfaatkan saat ada afkir industri murah.' },
    ],
  },

  // ── 12. Pisang Afkir ─────────────────────────────────────────────────────────
  'pisang-afkir': {
    asalBahan: 'Pisang yang ditolak standar pasar ekspor/lokal — terlalu matang, cacat, ukuran tidak seragam, kulit retak; dari kebun, pabrik pengolahan, pasar grosir',
    bentuk: ['Segar'],
    asal: 'Musa spp.; kebun pisang ekspor di Lampung, Jawa, Sumatera Barat; pasar grosir buah seluruh Indonesia',
    bagianDimanfaatkan: 'Buah pisang afkir lengkap (dengan atau tanpa kulit); daging lebih lunak dan manis dari yang layak jual',
    metodePengolahan: 'Diberikan langsung; dapat dicampur ke konsentrat; pisang afkir sangat matang lebih tinggi gula — perkenalkan bertahap untuk ternak yang belum biasa',
    ketersediaan: 'Tersedia reguler dari kebun pisang besar, pengepul, pasar grosir; harga sangat murah (Rp 300–800/kg)',
    kelebihan: 'Gula lebih tinggi dari pisang biasa (lebih matang); harga sangat murah; palatabilitas sangat baik; tersedia reguler dari kebun ekspor; vitamin B6 dan K tinggi',
    kekurangan: 'Sangat cepat busuk karena sudah terlalu matang; protein sangat rendah; perlu segera digunakan setelah diterima',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 0.9, sk: 0.4, lk: 0.2, abu: 0.8, betn: 19.7,
      tdn: 82, me: 3362,
      ndf: 6, adf: 3,
      ca: 0.01, p: 0.02, mg: 0.03, na: 0.01, k: 0.38, cl: 0.05, s: 0.01,
      vitamin: 'Vitamin B6 tinggi; Vitamin C cukup (lebih rendah dari pisang segar karena oksidasi); K tinggi; beta-karoten sangat rendah',
      mineral: 'K sangat tinggi; Ca dan P sangat rendah; Mg cukup; profil mineral mirip pisang biasa',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 35,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi', 'Ayam'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Bunting'],
      catatan: 'Pisang afkir adalah salah satu bahan pakan buah paling ekonomis. Gunakan segera setelah diterima karena cepat busuk. Dapat diberikan hingga 35% ransum BK. Sesuai untuk semua kelas ternak. Beli langsung dari kebun pisang besar atau pasar grosir untuk harga terbaik.',
    },
    harga: {
      estimasiAI: 800, hargaMarketplace: 600,
      satuan: 'per kg segar', supplier: 'Kebun pisang ekspor / pabrik pengolahan pisang / pasar grosir buah',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Banana (Musa spp.), rejected/overripe, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat pisang afkir (overripe, grade B/C) dari kebun pisang ekspor Lampung; nilai rata-rata 3 varietas (Cavendish, Barangan, Raja)',
      catatan: 'Nilai as-fed. Gula bebas lebih tinggi dari pisang segar karena konversi pati → gula selama pematangan lanjut. BK ±20–25%. TDN sedikit lebih tinggi dari pisang biasa karena kadar gula lebih tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍌', text: 'Pisang afkir adalah bahan pakan buah paling cost-effective — harga Rp 300–800/kg dengan nilai nutrisi setara pisang biasa atau bahkan lebih tinggi (gula lebih banyak karena lebih matang). TDN 82% BK. Ideal untuk program penggemukan berbasis buah afkir murah.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga sangat murah (3–5× lebih murah dari pisang biasa). Gula lebih tinggi karena sangat matang. Tersedia reguler dari kebun ekspor yang memiliki standar ketat sortasi. Palatabilitas terbaik di antara semua buah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Sangat cepat busuk — harus digunakan dalam 1–2 hari setelah penerimaan. Protein sangat rendah. Perlu koordinasi logistik yang baik dengan sumber pasokan untuk konsistensi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula penggemukan kambing ekonomis: Pisang afkir 25% + Leguminosa (Gamal/Lamtoro) 40% + Dedak 30% + Mineral 5%. Untuk sapi potong: Pisang afkir 20% + Jerami amoniasi 45% + Konsentrat 35% — meningkatkan palatabilitas jerami secara drastis.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan simpan pisang afkir lebih dari 2 hari — cepat busuk dan beralkohol. Pisang fermentasi spontan (bau alkohol) tidak boleh diberikan. Batasi 35% ransum BK. Hitung konsumsi BK aktual karena BK rendah.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika pisang afkir tidak tersedia: Pisang biasa (lebih mahal), Pepaya afkir (sedikit lebih mahal, nilai serupa), atau sisa buah pasar campuran. Semua bisa menggantikan peran pisang afkir dengan efek similar.' },
    ],
  },

  // ── 13. Pepaya Muda ──────────────────────────────────────────────────────────
  'pepaya-muda': {
    asalBahan: 'Buah pepaya yang belum matang (hijau) dari kebun atau sortasi; juga dari kebun yang memanen buah muda untuk olahan pangan atau yang rontok alami',
    bentuk: ['Segar'],
    asal: 'Carica papaya L.; dibudidayakan luas di seluruh Indonesia; pepaya muda dari kebun sortasi sangat berlimpah',
    bagianDimanfaatkan: 'Seluruh buah pepaya muda termasuk daging putih keras dan biji (biji lebih sedikit pada buah muda)',
    metodePengolahan: 'Dapat diberikan langsung atau dicacah; memasak (kukus) tidak perlu tapi bisa meningkatkan palatabilitas; lateks pada pepaya muda perlu diperhatikan (adaptasi bertahap)',
    ketersediaan: 'Berlimpah dari kebun pepaya terutama buah yang tidak lolos sortasi atau rontok sebelum matang; harga sangat murah',
    kelebihan: 'Papain konsentrasi tertinggi dibanding pepaya matang — enzim protease membantu pencernaan; serat lebih tinggi; harga sangat murah; tersedia reguler dari kebun',
    kekurangan: 'Lateks (getah putih) tinggi pada buah sangat muda bisa mengiritasi saluran cerna; palatabilitas lebih rendah dari pepaya matang; protein rendah; perlu adaptasi bertahap',
    nutrisi: {
      bk: 10, kadarAir: 90,
      pk: 0.9, sk: 0.9, lk: 0.1, abu: 0.5, betn: 7.6,
      tdn: 65, me: 2665,
      ndf: 13, adf: 7,
      ca: 0.02, p: 0.01, mg: 0.02, na: 0.01, k: 0.22, cl: 0.03, s: 0.01,
      vitamin: 'Beta-karoten jauh lebih rendah dari pepaya matang; Vitamin C cukup; papain aktif tinggi (enzim bukan vitamin tapi penting fisiologis)',
      mineral: 'K cukup; Ca sedikit lebih baik dari pepaya matang; P rendah; Mg sedikit',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Grower', 'Indukan', 'Penggemukan'],
      catatan: 'Perkenalkan bertahap 7 hari (mulai 5%, naik ke 20%). Pepaya muda yang sangat mentah (berlateks banyak) batasi lebih ketat. Pepaya setengah matang (semi-ripe) lebih baik dari yang benar-benar hijau. Manfaatkan sortasi kebun pepaya untuk pasokan ekonomis.',
    },
    harga: {
      estimasiAI: 1500, hargaMarketplace: 1000,
      satuan: 'per kg segar', supplier: 'Kebun pepaya / sortasi perkebunan pepaya / pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Papaya (Carica papaya), fruit, unripe, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat pepaya muda (hijau, belum matang, bobot 0,5–1 kg) dari kebun pepaya Jawa Barat; nilai rata-rata',
      catatan: 'Nilai as-fed. BK 9–12% tergantung ukuran dan usia buah. Lateks/getah: dominan pada buah sangat muda, menurun seiring kematangan. Papain: paling aktif pada pepaya muda-setengah matang.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍃', text: 'Pepaya muda adalah sumber papain terkaya — enzim protease yang membantu hidrolisis protein dalam ransum, meningkatkan kecernaan protein terutama pada ternak non-ruminan. TDN 65% BK cukup sebagai suplemen; harganya jauh lebih murah dari pepaya matang.' },
      { type: 'kelebihan', icon: '✅', text: 'Papain aktif sangat tinggi — berguna sebagai feed enzyme alami untuk ternak unggas dan babi terutama. Harga murah dari sortasi kebun. Tersedia reguler dari perkebunan pepaya. Serat sedikit lebih tinggi dari pepaya matang — baik untuk motilitas rumen.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Lateks berlebih pada buah sangat muda bisa menyebabkan iritasi mulut dan saluran cerna. Palatabilitas lebih rendah dari pepaya matang. Perlu adaptasi bertahap. Beta-karoten jauh lebih rendah dari pepaya matang — tidak bisa menggantikan sebagai sumber vitamin A.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk memanfaatkan papain: Pepaya muda 10–15% + Ransum berbasis hijauan leguminosa 50% + Dedak 35%. Enzim papain membantu kecernaan protein ransum secara alami. Untuk unggas: pepaya muda 5–10% dicampur pakan campuran meningkatkan kecernaan protein.' },
      { type: 'peringatan', icon: '🚨', text: 'Pepaya sangat muda (berlateks banyak/berwarna lebih gelap) harus dibatasi ketat — berikan yang sudah ukuran cukup besar (>200g) dengan getah mulai berkurang. Adaptasi bertahap wajib. Batasi 20% ransum BK. Biji pepaya muda mengandung karpain — jangan berikan biji dalam jumlah besar.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika pepaya muda tidak tersedia: Pepaya matang (papain lebih rendah tapi palatabilitas lebih tinggi), atau enzim protease komersial untuk efek papain yang terkontrol. Pepaya muda paling bermanfaat sebagai suplemen kecil untuk meningkatkan kecernaan protein ransum.' },
    ],
  },

  // ── 14. Jeruk Afkir ──────────────────────────────────────────────────────────
  'jeruk-afkir': {
    asalBahan: 'Jeruk yang ditolak kualitas pangan — rusak kulit, terlalu asam, ukuran tidak seragam; dari kebun jeruk, sortasi industri, pasar grosir',
    bentuk: ['Segar'],
    asal: 'Citrus spp.; sentra jeruk Indonesia: Karo (Sumatera Utara), Pontianak (Kalimantan Barat), Malang (Jawa Timur), Bali',
    bagianDimanfaatkan: 'Seluruh buah jeruk afkir termasuk daging, biji, dan kulit (dengan atau tanpa kulit tergantung palatabilitas)',
    metodePengolahan: 'Berikan bertahap; potong/belah untuk memudahkan akses; adaptasi wajib 7–14 hari; mengurangi kulit luar mengurangi kandungan limonene yang menurunkan palatabilitas',
    ketersediaan: 'Tersedia reguler dari kebun jeruk besar dan sortasi industri minuman; lebih berlimpah saat puncak panen jeruk (Juni–September)',
    kelebihan: 'Vitamin C sangat tinggi; d-limonene dan hesperidin memiliki efek antiinflamasi; pektin mendukung kesehatan saluran cerna; harga murah untuk jeruk afkir',
    kekurangan: 'Keasaman tinggi (pH 3–4) perlu adaptasi; d-limonene dan minyak atsiri kulit menurunkan palatabilitas awal; tidak cocok untuk ternak dengan masalah rumen asidosis',
    nutrisi: {
      bk: 13, kadarAir: 87,
      pk: 0.7, sk: 0.5, lk: 0.2, abu: 0.5, betn: 11.1,
      tdn: 70, me: 2870,
      ndf: 8, adf: 4,
      ca: 0.04, p: 0.02, mg: 0.01, na: 0.01, k: 0.18, cl: 0.03, s: 0.01,
      vitamin: 'Vitamin C sangat tinggi (50–70 mg/100g); Vitamin B1 sedikit; beta-karoten sangat rendah; Vitamin B9 (folat) sedikit',
      mineral: 'Ca lebih baik dari kebanyakan buah berair (0,04%); P rendah; K cukup; Mg sangat rendah',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Grower', 'Indukan', 'Menyusui'],
      catatan: 'Wajib adaptasi bertahap 10–14 hari (mulai 3%, naik ke 15%). Pertimbangkan kupas/hilangkan sebagian kulit untuk meningkatkan palatabilitas awal. Sangat berguna sebagai sumber vitamin C alami dan palatabilitas booster. Beli langsung dari sortasi kebun jeruk besar untuk harga paling murah.',
    },
    harga: {
      estimasiAI: 1500, hargaMarketplace: 1200,
      satuan: 'per kg segar', supplier: 'Kebun jeruk / sortasi industri minuman jeruk / pasar grosir',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Citrus (Citrus spp.), whole fruit, fresh',
        'Bampidis & Robinson (2006) — Citrus by-products as ruminant feeds: A review. Animal Feed Science and Technology, 128, 175–217',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
      ],
      sumberData: 'Analisis proksimat jeruk afkir campuran (Mandarin, Navel, lokal) dari sortasi kebun Karo dan Pontianak; nilai rata-rata',
      catatan: 'Nilai as-fed. BK 11–16% tergantung varietas. D-limonene: dominan di kulit — jika ingin meningkatkan palatabilitas, kupas sebagian kulit. Jeruk afkir nilai nutrisinya mirip kulit jeruk tapi palatabilitas lebih baik.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍊', text: 'Jeruk afkir adalah sumber vitamin C alami murah yang mendukung sistem imun ternak. TDN 70% BK cukup baik. Pektin dan serat terlarut mendukung kesehatan saluran cerna. Berguna terutama untuk ternak perah yang butuh vitamin C untuk kualitas susu.' },
      { type: 'kelebihan', icon: '✅', text: 'Vitamin C sangat tinggi — antioksidan kuat untuk imunitas. Pektin mendukung fermentasi mikroba rumen. Jeruk afkir tersedia murah dari sortasi kebun. Hesperidin (flavonoid) memiliki efek antiinflamasi yang menguntungkan ternak bunting/menyusui.' },
      { type: 'kekurangan', icon: '⚠️', text: 'D-limonene dalam kulit jeruk sangat mengurangi palatabilitas awal. Keasaman tinggi wajib adaptasi bertahap 10–14 hari. Tidak cocok untuk ternak dengan riwayat acidosis rumen. Protein sangat rendah.' },
      { type: 'kombinasi', icon: '🔗', text: 'Jeruk afkir 10% + Jerami amoniasi 40% + Konsentrat 45% + Mineral 5% — vitamin C dari jeruk dan nutrisi dari konsentrat. Untuk sapi perah: Jeruk 10% + ransum standar meningkatkan vitamin C susu dan daya tahan ternak. Kombinasikan dengan hijauan leguminosa untuk menetralisir keasaman.' },
      { type: 'peringatan', icon: '🚨', text: 'Wajib adaptasi bertahap 10–14 hari — pemberian langsung dalam jumlah besar menyebabkan penolakan atau gangguan rumen. Batasi 15% ransum BK. JANGAN berikan pada ternak dengan riwayat acidosis. Kulit jeruk mengandung minyak atsiri yang bisa toksik dalam jumlah sangat besar.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk vitamin C yang lebih mudah diterima: Jambu biji (palatabilitas lebih baik, vitamin C serupa), atau Pepaya matang. Untuk pektin terkontrol: Ampas Jeruk Kering (DCP) lebih praktis dan tersedia komersial.' },
    ],
  },

  // ── 15. Jambu Air ────────────────────────────────────────────────────────────
  'jambu-air': {
    asalBahan: 'Buah jambu air segar atau afkir (Syzygium aqueum) dari pekarangan, kebun, atau pasar tradisional',
    bentuk: ['Segar'],
    asal: 'Tanaman asal Asia Tenggara; sangat umum di pekarangan seluruh Indonesia terutama Jawa dan Sumatera',
    bagianDimanfaatkan: 'Seluruh buah termasuk daging dan kulit tipis; biji kecil dapat ikut diberikan',
    metodePengolahan: 'Diberikan langsung segar; tidak memerlukan pengolahan; dapat dipotong untuk ternak kecil',
    ketersediaan: 'Tersedia sepanjang tahun dari pekarangan; produksi terbatas tapi mudah didapat gratis dari pohon di sekitar kandang',
    kelebihan: 'Kadar air sangat tinggi (±90%) berguna untuk hidrasi; palatabilitas baik; tersedia dari pekarangan (gratis); vitamin C cukup',
    kekurangan: 'Nilai nutrisi sangat rendah karena hampir semua air; BK hanya 10%; tidak dapat menjadi sumber nutrisi utama sama sekali; produksi pohon per-tree terbatas',
    nutrisi: {
      bk: 10, kadarAir: 90,
      pk: 0.5, sk: 0.3, lk: 0.1, abu: 0.2, betn: 8.9,
      tdn: 68, me: 2788,
      ndf: 5, adf: 2,
      ca: 0.01, p: 0.01, mg: 0.01, na: 0.01, k: 0.12, cl: 0.02, s: 0.01,
      vitamin: 'Vitamin C cukup; beta-karoten sangat rendah; Vitamin B kompleks hampir tidak ada',
      mineral: 'Semua mineral sangat rendah — didominasi air; tidak bisa diandalkan sebagai sumber mineral',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Babi'],
      programCocok: ['Grower', 'Indukan'],
      catatan: 'Gunakan terutama sebagai suplemen hidrasi dan palatabilitas dari pohon pekarangan. Maksimal 15% ransum BK karena nilai nutrisi sangat rendah. Tidak ekonomis untuk dibeli dalam jumlah besar — manfaatkan hanya jika tersedia gratis di sekitar kandang. Tidak bisa menggantikan sumber nutrisi apapun secara signifikan.',
    },
    harga: {
      estimasiAI: 3000, hargaMarketplace: 2500,
      satuan: 'per kg segar', supplier: 'Pekarangan / pohon di sekitar kandang / pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Water apple (Syzygium aqueum), fruit, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Göhl (1981) — Tropical Feeds, FAO',
      ],
      sumberData: 'Analisis proksimat jambu air segar dari pekarangan Jawa Barat dan Jawa Tengah; nilai perkiraan berdasarkan analisis ASEAN food composition tables',
      catatan: 'Nilai as-fed. BK 8–12%. Nilai nutrisi sangat rendah; jambu air lebih berguna sebagai sumber hidrasi daripada sumber nutrisi. Data nutrisi terbatas di literatur karena nilai pakan sangat rendah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '💧', text: 'Jambu air berfungsi terutama sebagai sumber hidrasi dan palatabilitas booster yang tersedia gratis dari pekarangan. Nilai nutrisi sangat rendah (BK 10%, TDN 68% BK) — kontribusi nutrisi total minimal. Berguna sebagai tambahan kecil gratis, bukan pakan utama.' },
      { type: 'kelebihan', icon: '✅', text: 'Gratis dari pekarangan — biaya nol jika ada pohon di sekitar kandang. Palatabilitas baik. Kadar air tinggi membantu hidrasi di musim kemarau. Ternak suka memakannya sehingga berguna untuk ternak sakit yang butuh dorongan nafsu makan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Nilai nutrisi sangat rendah — hampir tidak ada kontribusi nutrisi berarti per kg pakan. Tidak bisa diandalkan sebagai sumber nutrisi sama sekali. Tidak tersedia dalam jumlah komersial besar. Harga beli tidak sebanding nilainya.' },
      { type: 'kombinasi', icon: '🔗', text: 'Manfaatkan jika tersedia gratis: tambahkan semua sisa buah jambu air dari pekarangan ke ransum ternak. Efek utamanya pada hidrasi dan palatabilitas. Jangan mengurangi sumber nutrisi lain untuk "memberi ruang" bagi jambu air.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan membeli jambu air dalam jumlah besar untuk pakan — tidak ekonomis. Nilai nutrisi sangat rendah tidak sebanding biaya. Batasi 15% ransum BK. Fokus penggunaan hanya pada produksi pohon pekarangan yang tersedia gratis.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk hidrasi: Semangka (lebih murah saat musim panen), Kulit Semangka (bahkan lebih murah). Untuk palatabilitas booster lebih efektif: Pisang matang atau Molases. Jambu air cocok hanya jika kebetulan tersedia gratis.' },
    ],
  },

  // ── 16. Sawo ─────────────────────────────────────────────────────────────────
  'sawo': {
    asalBahan: 'Buah sawo matang atau afkir (Manilkara zapota L. P.Royen) dari kebun, pasar, atau sortasi',
    bentuk: ['Segar'],
    asal: 'Tanaman asal Amerika Tengah; dibudidayakan di Jawa, Bali, NTB, Sumatera; sentra: Jepara, Demak, Gresik',
    bagianDimanfaatkan: 'Daging buah sawo matang sempurna; tanpa biji keras (biji mengandung saponin dalam biji); kulit tipis dapat ikut diberikan',
    metodePengolahan: 'Pastikan buah matang sempurna sebelum diberikan (tidak ada getah/lateks); diberikan langsung segar; pisahkan biji sebelum diberikan ke ternak kecil',
    ketersediaan: 'Musiman; sentra produksi Jawa Tengah dan Jawa Timur; afkir pasar tersedia saat musim panen (September–Desember)',
    kelebihan: 'Gula alami sangat tinggi (±20% BK pada buah matang penuh); palatabilitas sangat baik; tanin sangat rendah; saponin (dalam biji) tidak ada di daging buah',
    kekurangan: 'Sangat musiman; getah lateks pada sawo mentah berbahaya dan tidak bisa diberikan; biji mengandung saponin; harga lebih tinggi dari buah afkir umum',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 0.4, sk: 0.5, lk: 0.1, abu: 0.5, betn: 20.5,
      tdn: 82, me: 3362,
      ndf: 8, adf: 4,
      ca: 0.02, p: 0.01, mg: 0.02, na: 0.01, k: 0.19, cl: 0.04, s: 0.01,
      vitamin: 'Vitamin C sedikit; beta-karoten rendah; Vitamin B3 (niacin) sedikit; Vitamin B6 sedikit',
      mineral: 'K cukup; Ca sedikit; P rendah; Mg sedikit; mineral mikro (Cu, Zn, Fe) sangat rendah',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'HANYA berikan sawo yang sudah matang sempurna — sawo mentah mengandung lateks yang menyebabkan sumbatan saluran cerna. Pisahkan biji sebelum diberikan ke ternak kecil (kambing, domba). Sangat berguna saat musim panen untuk penggemukan cepat karena gula tinggi. Maksimal 25% ransum BK.',
    },
    harga: {
      estimasiAI: 5000, hargaMarketplace: 4500,
      satuan: 'per kg segar', supplier: 'Kebun sawo / pasar tradisional / sortasi pedagang sawo',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Sapodilla (Manilkara zapota), fruit, ripe, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat sawo matang dari sentra produksi Jepara dan Demak, Jawa Tengah; nilai rata-rata varietas lokal',
      catatan: 'Nilai as-fed. BK 20–25% tergantung varietas dan kematangan. Gula sawo matang penuh sangat tinggi (sukrosa + glukosa ±18–22% BK). PERHATIAN: sawo mentah mengandung saponin-tannin dan lateks — tidak boleh diberikan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍬', text: 'Sawo matang adalah sumber gula tertinggi di antara buah tropis lokal — TDN 82% BK dengan sukrosa sangat tinggi. Palatabilitas terbaik, ternak sangat menyukai rasa manisnya. Ideal sebagai sumber energi cepat dan palatabilitas booster premium saat musim panen.' },
      { type: 'kelebihan', icon: '✅', text: 'Kandungan gula tertinggi di antara buah tropis (setara pisang matang penuh). Palatabilitas sangat baik — disukai semua kelas ternak. TDN 82% BK hampir setara dedak halus. Tanin sangat rendah — tidak menghambat pencernaan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Sangat musiman. Sawo mentah dengan lateks sama sekali tidak boleh diberikan — lateks menyebabkan sumbatan padat di saluran cerna. Harga lebih tinggi dibanding pisang atau pepaya untuk manfaat energi serupa.' },
      { type: 'kombinasi', icon: '🔗', text: 'Penggemukan sapi saat musim sawo: Sawo afkir 20% + Jerami amoniasi 45% + Konsentrat 35% — gula sawo memicu fermentasi rumen aktif dan meningkatkan palatabilitas jerami secara dramatis. Nilai ekonomis terbaik saat harga sawo sedang turun di musim panen.' },
      { type: 'peringatan', icon: '🚨', text: '⛔ JANGAN berikan sawo mentah — lateks kental menyebabkan ileus paralitik (sumbatan usus) pada ternak kecil. Selalu pastikan buah lunak dan bebas getah sebelum diberikan. Pisahkan biji (saponin) untuk ternak kecil. Batasi 25% ransum BK.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk energi gula tinggi di luar musim sawo: Pisang matang atau afkir (tersedia sepanjang tahun, harga murah), atau Molases (energi gula setara, tahan simpan, tersedia sepanjang tahun). Sawo paling ekonomis hanya saat musim panen dan harga turun.' },
    ],
  },

  // ── 17. Rambutan Afkir ───────────────────────────────────────────────────────
  'rambutan-afkir': {
    asalBahan: 'Rambutan yang ditolak sortasi pasar (kulit rusak, terlalu matang, ukuran kecil) — daging buah (aril) manis dari Nephelium lappaceum L.',
    bentuk: ['Segar'],
    asal: 'Tanaman asli Asia Tenggara; sentra produksi Indonesia: Jawa Barat, Jawa Tengah, Kalimantan, Sulawesi; puncak musim Desember–Februari',
    bagianDimanfaatkan: 'Daging buah (aril) rambutan; kulit merah juga dapat diberikan dalam jumlah terbatas; biji tidak diberikan langsung',
    metodePengolahan: 'Dapat diberikan dengan kulit dan semua (kecuali biji); kecil bentuknya — tidak perlu pemotongan; diberikan langsung segar',
    ketersediaan: 'Sangat musiman; berlimpah saat puncak musim (Desember–Februari); afkir pasar tersedia murah saat musim; sulit didapat di luar musim',
    kelebihan: 'Palatabilitas sangat baik; gula tinggi (±20% BK); vitamin C cukup; tersedia sangat murah saat musim panen; ternak sangat menyukai rasa manisnya',
    kekurangan: 'Sangat musiman; biji tidak boleh diberikan; protein rendah; tidak praktis dalam jumlah besar karena ukuran kecil dan perlu pemisahan biji',
    nutrisi: {
      bk: 18, kadarAir: 82,
      pk: 0.9, sk: 0.3, lk: 0.1, abu: 0.4, betn: 16.3,
      tdn: 80, me: 3280,
      ndf: 5, adf: 2,
      ca: 0.01, p: 0.02, mg: 0.01, na: 0.01, k: 0.14, cl: 0.03, s: 0.01,
      vitamin: 'Vitamin C cukup; beta-karoten sangat rendah; Vitamin B kompleks sangat rendah',
      mineral: 'Semua mineral rendah; K relatif tertinggi; Mg dan P sangat rendah; Ca sangat rendah',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Manfaatkan saat musim panen dan harga murah. Berikan langsung dengan kulit dan daging (tanpa biji). Maksimal 20% ransum BK. Sangat berguna sebagai palatabilitas booster musiman. Kombinasikan dengan sumber protein dan mineral. Tidak perlu dipisahkan dari kulitnya.',
    },
    harga: {
      estimasiAI: 2000, hargaMarketplace: 1500,
      satuan: 'per kg segar', supplier: 'Kebun rambutan / pasar tradisional / pengepul afkir musiman',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Rambutan (Nephelium lappaceum), fruit, fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat rambutan afkir (daging+kulit) dari kebun rambutan Jawa Barat dan Kalimantan Barat; nilai rata-rata musim panen',
      catatan: 'Nilai as-fed untuk bagian dapat dimakan (daging+kulit merah). Biji rambutan mengandung saponin dan lemak tidak dapat dicerna dengan baik — jangan diberikan. Gula aril matang sangat tinggi (sukrosa + glukosa).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🔴', text: 'Rambutan afkir adalah suplemen energi gula dan palatabilitas booster musiman — TDN 80% BK, gula tinggi, sangat disukai ternak. Berguna selama musim panen untuk memanfaatkan harga yang turun drastis dan meningkatkan palatabilitas ransum berbasis hijauan.' },
      { type: 'kelebihan', icon: '✅', text: 'Gula tinggi dengan palatabilitas sangat baik. Harga sangat murah saat musim panen (Rp 500–1.500/kg untuk afkir). Dapat diberikan langsung dengan kulit merah tanpa pemisahan khusus. Vitamin C mendukung imunitas.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Sangat musiman — tidak tersedia di luar Desember–Februari. Biji harus dipisahkan jika memungkinkan. Protein sangat rendah. Ukuran kecil menyulitkan pemberian dalam jumlah besar secara efisien.' },
      { type: 'kombinasi', icon: '🔗', text: 'Musim rambutan: Rambutan afkir 15% + Hijauan leguminosa 45% + Dedak 35% + Mineral 5%. Berguna sebagai "musim panen" untuk intensifikasi penggemukan singkat memanfaatkan harga buah sangat murah. Kombinasikan dengan sumber protein tinggi karena rambutan hampir tanpa protein.' },
      { type: 'peringatan', icon: '🚨', text: 'Hindari pemberian biji rambutan dalam jumlah besar — mengandung saponin. Maksimal 20% ransum BK. Rambutan fermentasi spontan (bau beralkohol) tidak boleh diberikan. Manfaatkan segera setelah penerimaan karena cepat busuk.' },
      { type: 'alternatif', icon: '🔄', text: 'Di luar musim rambutan: Pisang afkir (tersedia sepanjang tahun, nilai serupa), Sawo afkir (gula tinggi serupa), atau Molases (energi gula tahan simpan). Semua bisa menggantikan peran rambutan sebagai energi gula dan palatabilitas booster.' },
    ],
  },

  // ── 18. Kulit Pisang ─────────────────────────────────────────────────────────
  'kulit-pisang': {
    asalBahan: 'Kulit luar buah pisang (Musa spp.) dari industri pengolahan pisang, pabrik keripik, pasar buah, dan rumah tangga',
    bentuk: ['Segar', 'Kering'],
    asal: 'Limbah industri pengolahan pisang; sentra: Lampung, Jawa Timur, Jawa Barat; pasar buah seluruh Indonesia',
    bagianDimanfaatkan: 'Kulit luar pisang (eksokarp + sebagian mesokarp luar); termasuk kulit dari semua varietas pisang',
    metodePengolahan: 'Diberikan segar langsung; dapat dijemur 2–3 hari menjadi kulit pisang kering (BK naik ke ±85%); fermentasi dengan EM4 meningkatkan palatabilitas',
    ketersediaan: 'Berlimpah dari industri pengolahan pisang, pasar buah, dan usaha keripik pisang; tersedia hampir gratis atau sangat murah sepanjang tahun di sentra pisang',
    kelebihan: 'Protein kasar cukup baik untuk buah limbah (±8% BK); kalium dan pektin tinggi; berlimpah dan murah; dapat dikeringkan untuk tahan simpan; palatabilitas baik pada kambing dan sapi',
    kekurangan: 'Tanin dan polifenol sedang mengurangi kecernaan protein sedikit; kadar air tinggi saat segar (±80%); perlu adaptasi bertahap dalam jumlah besar',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 1.6, sk: 2.0, lk: 0.5, abu: 2.0, betn: 13.9,
      tdn: 60, me: 2460,
      ndf: 30, adf: 18,
      ca: 0.03, p: 0.03, mg: 0.04, na: 0.02, k: 1.15, cl: 0.10, s: 0.02,
      vitamin: 'Vitamin B6 cukup; Vitamin C rendah; beta-karoten sangat rendah; klorofil sedikit dari kulit hijau',
      mineral: 'K sangat tinggi (1,15% as-fed = ±5,7% BK) — tertinggi di antara semua limbah buah; Ca dan P rendah namun lebih baik dari daging buah; Mg cukup',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Kerbau', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Salah satu limbah buah terbaik dari segi protein dan mineral. Berikan segar atau kering. Adaptasi bertahap 5–7 hari. Maksimal 30% ransum BK. Kombinasikan dengan sumber protein dan kalsium (Ca rendah). Kulit pisang kering (tepung) bisa dijadikan bahan pakan jangka panjang.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 200,
      satuan: 'per kg segar', supplier: 'Pabrik keripik pisang / industri pengolahan pisang / pasar buah',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Banana peel (Musa spp.), fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 80',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
        'Göhl (1981) — Tropical Feeds, FAO, Banana peel',
      ],
      sumberData: 'Analisis proksimat kulit pisang segar (varietas Cavendish dan lokal) dari pabrik keripik pisang Lampung; rata-rata nilai nutrisi',
      catatan: 'Nilai as-fed. BK naik signifikan setelah penjemuran (BK kering ±85%). NDF dan ADF dalam BK basis. K sangat tinggi relatif terhadap kulit buah lain — perhatikan keseimbangan DCAD pada sapi perah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍌', text: 'Kulit pisang adalah salah satu limbah buah terbaik untuk pakan — protein ±8% BK (lebih baik dari daging buahnya!), K sangat tinggi (1,15% as-fed), dan tersedia hampir gratis dari industri pengolahan pisang. TDN 60% BK cukup sebagai sumber energi-serat moderat.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein lebih tinggi dari daging pisang (8% vs 4% BK). K tertinggi di antara limbah buah — suplementasi mineral K alami. Tersedia hampir gratis dari pabrik keripik dan industri pisang. Dapat dikeringkan untuk tahan simpan lama.' },
      { type: 'kekurangan', icon: '⚠️', text: 'K sangat tinggi (5,7% BK) — perhatikan DCAD pada sapi perah prepartum. Tanin dan polifenol sedikit mengurangi kecernaan protein. Kadar air tinggi (80%) bila segar membatasi transportasi jarak jauh.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kulit pisang 25% + Rumput Gajah 45% + Dedak/Konsentrat 25% + Mineral/Ca 5% — formula ekonomis kambing peternakan skala kecil. Suplementasi Ca wajib karena Ca rendah. Jangan kombinasikan dengan bahan K tinggi lain (molases banyak) pada sapi perah prepartum.' },
      { type: 'peringatan', icon: '🚨', text: 'K sangat tinggi — batasi pada sapi perah 3 minggu sebelum beranak (risiko milk fever meningkat). Maksimal 30% ransum BK. Kulit pisang yang sudah hitam dan berlendir (membusuk) harus dibuang. Adaptasi bertahap untuk menghindari gangguan pencernaan.' },
      { type: 'alternatif', icon: '🔄', text: 'Limbah buah lain dengan protein serupa: Kulit Kopi (protein lebih tinggi, butuh perhatian kafein), Kulit Kakao/Pod (protein serupa, sentra berbeda). Untuk K tinggi terkontrol: Molases lebih konsisten kadar K-nya.' },
    ],
  },

  // ── 19. Kulit Nanas ──────────────────────────────────────────────────────────
  'kulit-nanas': {
    asalBahan: 'Kulit luar (eksokarp bersisik keras) dan mahkota nanas dari sisa pengolahan industri jus nanas, pengalengan, atau pengupasan pasar',
    bentuk: ['Segar'],
    asal: 'Limbah industri pengolahan nanas; sentra: Lampung (Nusantara Tropical Farm), Subang (PT Great Giant), Kediri; tersedia dalam jumlah besar dari pabrik',
    bagianDimanfaatkan: 'Kulit keras luar (bersisik/mata nanas) dan mahkota; juga sisa daging yang menempel pada kulit dari pengupasan',
    metodePengolahan: 'Cacah/haluskan sebelum diberikan untuk meningkatkan konsumsi; fermentasi dengan EM4 atau lactobacillus 3–5 hari meningkatkan palatabilitas dan menurunkan keasaman; dapat dikeringkan',
    ketersediaan: 'Sangat berlimpah dari pabrik pengolahan nanas di Lampung, Subang, Kediri; hampir gratis dari pabrik (limbah); tersedia reguler sepanjang tahun',
    kelebihan: 'Berlimpah dari pabrik dengan biaya hampir nol; mengandung bromelain aktif; serat sedang (NDF ±60% BK) berguna sebagai roughage; protein cukup untuk limbah (±5% BK)',
    kekurangan: 'Tekstur keras (sisik nanas) menurunkan palatabilitas awal; keasaman tinggi (pH 3,5–4) perlu adaptasi; NDF tinggi membatasi kecernaan; perlu mesin cacah',
    nutrisi: {
      bk: 15, kadarAir: 85,
      pk: 0.7, sk: 4.0, lk: 0.2, abu: 0.8, betn: 9.3,
      tdn: 55, me: 2255,
      ndf: 56, adf: 34,
      ca: 0.02, p: 0.01, mg: 0.02, na: 0.01, k: 0.18, cl: 0.04, s: 0.01,
      vitamin: 'Vitamin C cukup; bromelain aktif; beta-karoten sangat rendah; Vitamin B kompleks sangat rendah',
      mineral: 'Semua mineral rendah; Mn sedikit lebih tinggi; Ca dan P rendah; K cukup',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Grower', 'Penggemukan'],
      catatan: 'Adaptasi bertahap wajib (mulai 5%, naik ke 20% dalam 10 hari). Cacah 3–5 cm sebelum diberikan. Fermentasi 3 hari meningkatkan palatabilitas dan menurunkan keasaman secara signifikan. Paling ekonomis jika diambil langsung dari pabrik pengolahan nanas.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 100,
      satuan: 'per kg segar (hampir gratis dari pabrik)', supplier: 'Pabrik pengolahan nanas / pabrik jus nanas / pengalengan nanas',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Pineapple peel (Ananas comosus), fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
        'Göhl (1981) — Tropical Feeds, FAO, Pineapple by-products',
      ],
      sumberData: 'Analisis proksimat kulit nanas segar (Smooth Cayenne) dari pabrik pengalengan Lampung; rata-rata nilai nutrisi',
      catatan: 'Nilai as-fed. BK 13–18%. NDF/ADF dalam BK basis. Keasaman sangat berpengaruh pada palatabilitas — fermentasi sangat dianjurkan. Bromelain aktif pada kulit nanas lebih rendah dari daging buah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍍', text: 'Kulit nanas adalah limbah pabrik pengolahan yang paling berlimpah di sentra produksi — tersedia hampir gratis. TDN 55% BK dengan serat sedang (NDF 56% BK) berperan sebagai roughage murah. Bromelain aktif membantu pencernaan protein ransum.' },
      { type: 'kelebihan', icon: '✅', text: 'Biaya hampir nol dari pabrik pengolahan nanas. Volume sangat besar tersedia dari pabrik di Lampung, Subang, Kediri. Bromelain aktif mendukung pencernaan protein. Setelah fermentasi, palatabilitas meningkat signifikan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tekstur keras sisik nanas sangat mengurangi palatabilitas awal. Keasaman tinggi wajib adaptasi atau fermentasi. NDF 56% BK membatasi kecernaan serat. Transportasi dari pabrik perlu dipertimbangkan jika jauh.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kulit Nanas fermentasi (3 hari dengan EM4) 15% + Ampas Nanas 10% + Hijauan Leguminosa 45% + Konsentrat 30% — memanfaatkan semua limbah nanas dari pabrik. Kombinasi terbaik untuk peternak di sekitar pabrik pengolahan nanas.' },
      { type: 'peringatan', icon: '🚨', text: 'Wajib adaptasi bertahap dan/atau fermentasi sebelum diberikan dalam jumlah signifikan. Keasaman tinggi tanpa adaptasi dapat menyebabkan acidosis rumen akut. Cacah sebelum diberikan karena tekstur keras. Batasi 20% ransum BK.' },
      { type: 'alternatif', icon: '🔄', text: 'Di luar jangkauan pabrik nanas: Ampas Nanas (lebih lunak, palatabilitas lebih baik), Kulit Pepaya (lebih lunak, kadar air tinggi), atau Jerami Padi (roughage tradisional yang tersedia luas). Kulit nanas paling ekonomis hanya di dekat pabrik nanas.' },
    ],
  },

  // ── 20. Kulit Jeruk ──────────────────────────────────────────────────────────
  'kulit-jeruk': {
    asalBahan: 'Kulit buah jeruk (Citrus spp.) dari industri pengolahan jus, minuman, selai jeruk, atau pengupasan pasar',
    bentuk: ['Segar', 'Kering'],
    asal: 'Limbah industri jus jeruk; sentra: Karo, Pontianak, Malang, Jakarta (industri minuman); secara global dari industri jus jeruk Florida/Brasil pun tersedia kering',
    bagianDimanfaatkan: 'Kulit luar (flavedo, mengandung minyak atsiri) dan lapisan putih dalam (albedo, kaya pektin); bersama-sama menjadi citrus peel',
    metodePengolahan: 'Dapat diberikan segar langsung setelah adaptasi; pengeringan membuat lebih tahan simpan; Dried Citrus Peel (DCP) adalah produk komersial internasional; fermentasi menurunkan limonene',
    ketersediaan: 'Tersedia dari industri minuman dan jus jeruk; DCP bisa diimpor sebagai bahan pakan komersial; segar berlimpah di sentra jeruk saat panen',
    kelebihan: 'Pektin sangat tinggi (±15% BK) — serat terlarut mendukung fermentasi rumen; nilai energi cukup baik (TDN 70% BK); vitamin C tinggi; DCP adalah bahan pakan komersial yang sudah terbukti',
    kekurangan: 'D-limonene menurunkan palatabilitas awal secara signifikan; adaptasi bertahap wajib; minyak atsiri toksik dalam dosis sangat besar; segar tidak tahan simpan',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 1.0, sk: 3.0, lk: 0.5, abu: 1.0, betn: 16.5,
      tdn: 70, me: 2870,
      ndf: 30, adf: 18,
      ca: 0.18, p: 0.04, mg: 0.02, na: 0.01, k: 0.19, cl: 0.04, s: 0.02,
      vitamin: 'Vitamin C sangat tinggi; d-limonene (bukan vitamin tapi aktif biologis); flavonoid (hesperidin, narirutin) tinggi',
      mineral: 'Ca lebih tinggi dari buah lain (0,18% as-fed) dari albedo; P rendah; rasio Ca:P ≈4,5:1 — cukup baik; K cukup',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      catatan: 'Adaptasi bertahap wajib 10–14 hari. Ca lebih tinggi dari limbah buah lain — bermanfaat untuk ransum defisit Ca. Dalam bentuk DCP (Dried Citrus Pulp): sudah tersedia komersial dan palatabilitas lebih baik dari segar. Bisa menggantikan sebagian sumber energi (jagung) karena nilai TDN cukup baik.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 300,
      satuan: 'per kg segar', supplier: 'Industri jus jeruk / pabrik minuman / importir DCP',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Bampidis & Robinson (2006) — Citrus by-products as ruminant feeds: A review. Animal Feed Science and Technology, 128, 175–217',
        'Feedipedia (2023) — Citrus pulp, dried (Citrus spp.)',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'NRC (2016) — Nutrient Requirements of Beef Cattle',
      ],
      sumberData: 'Analisis kulit jeruk segar (campuran Mandarin, Navel) dari industri jus jeruk Jawa; dikombinasikan dengan data DCP internasional (Feedipedia)',
      catatan: 'Nilai as-fed untuk kulit jeruk segar. DCP (kering) memiliki BK ±88% dan nilai nutrisi terkonsentrasi. Ca dalam DCP bisa mencapai 0,6–0,7% BK — sumber Ca yang baik.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍋', text: 'Kulit jeruk (terutama dalam bentuk DCP/Dried Citrus Pulp) adalah bahan pakan sumber energi-pektin yang sudah digunakan luas secara komersial di seluruh dunia. TDN 70% BK, pektin fermentable 15% BK mendukung fermentasi rumen yang sehat. Ca relatif tinggi untuk limbah buah.' },
      { type: 'kelebihan', icon: '✅', text: 'Pektin fermentable tinggi — mendukung pertumbuhan bakteri rumen yang menghasilkan propionate (energi). Ca lebih tinggi dari kebanyakan limbah buah. Hesperidin antiinflamasi. DCP tersedia sebagai produk komersial tahan simpan yang terbukti efektif di industri peternakan global.' },
      { type: 'kekurangan', icon: '⚠️', text: 'D-limonene (minyak atsiri) dalam flavedo sangat mengurangi palatabilitas awal. Adaptasi wajib. Minyak atsiri dalam dosis sangat besar berpotensi toksik pada ternak. Segar tidak tahan simpan — pengeringan atau pengolahan lebih lanjut diperlukan untuk skala besar.' },
      { type: 'kombinasi', icon: '🔗', text: 'DCP 10–15% dapat menggantikan sebagian jagung dalam ransum sapi potong dan perah. Kulit jeruk 15% + Rumput Gajah 50% + Dedak 30% + Mineral 5% — pektin kulit jeruk sinergis dengan serat rumput untuk fermentasi rumen seimbang.' },
      { type: 'peringatan', icon: '🚨', text: 'Wajib adaptasi 10–14 hari karena d-limonene sangat mengurangi palatabilitas awal. Jangan berikan minyak esensial jeruk dalam jumlah terkonsentrasi (bersifat toksik untuk rumen). Batasi 20% ransum BK. Kandungan minyak atsiri bervariasi antar varietas jeruk.' },
      { type: 'alternatif', icon: '🔄', text: 'DCP (Dried Citrus Pulp) komersial impor lebih konsisten kualitasnya dari kulit segar lokal. Alternatif serat-pektin serupa: Ampas Apel atau Ampas Wortel (lebih rendah limonene). Untuk Ca: Tepung Tulang atau Kapur Pertanian lebih terkontrol dosisnya.' },
    ],
  },

  // ── 21. Kulit Kakao (Pod Kakao) ───────────────────────────────────────────────
  'kulit-kakao': {
    asalBahan: 'Cangkang/pod buah kakao (Theobroma cacao L.) setelah biji kakao dikeluarkan; limbah utama kebun kakao Indonesia',
    bentuk: ['Segar', 'Kering'],
    asal: 'Limbah perkebunan kakao; sentra: Sulawesi Tengah, Sulawesi Tenggara, Sulawesi Selatan, Papua, Sumatera Barat; Indonesia produsen kakao terbesar ke-3 dunia',
    bagianDimanfaatkan: 'Pod husk (cangkang buah) kakao; mengandung plasenta (jaringan putih tempat biji menempel) dan serat pod',
    metodePengolahan: 'Diberikan segar langsung; fermentasi dengan Aspergillus niger atau EM4 meningkatkan nilai nutrisi; pengeringan dan penggilingan untuk penyimpanan jangka panjang; ensilase efektif',
    ketersediaan: 'Sangat berlimpah di sentra perkebunan kakao sepanjang tahun; hampir gratis dari kebun; volume produksi sangat besar (±10 pod per kg biji kakao)',
    kelebihan: 'Sangat berlimpah dan gratis di kebun kakao; protein cukup (±8% BK); sumber serat lokal; fermentasi meningkatkan nilai nutrisi secara signifikan; theobromin di kulit pod jauh lebih rendah dari biji kakao',
    kekurangan: 'Theobromin (alkaloida) perlu diperhatikan meski rendah di kulit; tanin dan lignin tinggi mengurangi kecernaan; tidak boleh berlebihan; palatabilitas sedang',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 1.6, sk: 7.8, lk: 0.4, abu: 1.9, betn: 8.3,
      tdn: 48, me: 1968,
      ndf: 65, adf: 42,
      ca: 0.13, p: 0.06, mg: 0.05, na: 0.02, k: 0.58, cl: 0.08, s: 0.02,
      vitamin: 'Vitamin E sedikit; Vitamin C rendah; beta-karoten sangat rendah; Vitamin B kompleks sangat rendah',
      mineral: 'K cukup tinggi (0,58% as-fed); Ca lebih baik dari rata-rata limbah buah (0,13%); P rendah; Mg cukup; rasio Ca:P ≈2:1 cukup baik',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Grower', 'Pejantan', 'Penggemukan'],
      catatan: 'Fermentasi sangat dianjurkan sebelum penggunaan skala besar. Adaptasi bertahap 7–10 hari. Maksimal 30% ransum BK. Theobromin di kulit pod rendah (jauh di bawah batas toksik untuk ruminansia). Sangat ekonomis untuk peternak di sentra kakao. Kombinasikan dengan sumber protein dan mineral.',
    },
    harga: {
      estimasiAI: 350, hargaMarketplace: 200,
      satuan: 'per kg segar (hampir gratis dari kebun)', supplier: 'Kebun kakao / pengolahan biji kakao / koperasi petani kakao',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Alimon, A.R. (2004) — The nutritive value of cocoa pod husk. Cocoa Growers\' Bulletin, 55, 14–21',
        'Feedipedia (2023) — Cocoa pod husk (Theobroma cacao), fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Göhl (1981) — Tropical Feeds, FAO, Cocoa pod husk',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat pod kakao segar dari kebun kakao Sulawesi Tengah dan Sulawesi Selatan; rata-rata 3 varietas (Forastero, Criollo, Trinitario)',
      catatan: 'Nilai as-fed. NDF dan ADF dalam BK basis. Theobromin di kulit pod: ±0,05–0,2% BK (vs biji kakao 1,2–2% BK) — jauh lebih rendah dan aman untuk ruminansia pada dosis <30% ransum.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍫', text: 'Kulit kakao/pod husk adalah limbah perkebunan kakao yang sangat berlimpah — sekitar 75% bobot buah kakao adalah pod yang dibuang. Protein ±8% BK dan TDN 48% BK cocok sebagai roughage lokal berkualitas sedang untuk ruminansia di sentra kakao.' },
      { type: 'kelebihan', icon: '✅', text: 'Tersedia hampir gratis di kebun kakao dalam jumlah sangat besar. Ca 0,13% as-fed lebih baik dari kebanyakan limbah buah. K tinggi. Rasio Ca:P ≈2:1 cukup ideal. Fermentasi meningkatkan kecernaan dan palatabilitas secara signifikan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'NDF 65% BK dan lignin tinggi — kecernaan serat rendah tanpa fermentasi. Tanin dalam pod menghambat pencernaan protein sedikit. Palatabilitas sedang pada ternak yang belum terbiasa.' },
      { type: 'kombinasi', icon: '🔗', text: 'Pod kakao fermentasi (7–10 hari, EM4) 25% + Leguminosa (Gamal/Lamtoro) 40% + Dedak 30% + Mineral 5% — ideal untuk peternak di sentra kakao. Fermentasi dengan Aspergillus niger meningkatkan kecernaan NDF signifikan dan menurunkan tanin.' },
      { type: 'peringatan', icon: '🚨', text: 'Meski theobromin di pod husk jauh lebih rendah dari biji kakao, batasi tetap 30% ransum BK untuk ruminansia. JANGAN berikan pada babi atau unggas (theobromin lebih toksik pada non-ruminan). Fermentasi sangat dianjurkan untuk menurunkan tanin dan meningkatkan kecernaan.' },
      { type: 'alternatif', icon: '🔄', text: 'Roughage lokal alternatif: Jerami Padi (lebih luas tersedia), Ampas Tebu (nilai nutrisi serupa). Di sentra kakao, pod husk adalah pilihan terbaik karena biaya nol. Silase pod kakao adalah cara terbaik memanfaatkan kelebihan pod saat panen raya.' },
    ],
  },

  // ── 22. Kulit Kopi (Cascara) ──────────────────────────────────────────────────
  'kulit-kopi': {
    asalBahan: 'Kulit buah kopi (coffee pulp/husk) dari proses pengupasan biji kopi di penggilingan kopi; meliputi cascara (kulit kering) dan coffee pulp (kulit basah)',
    bentuk: ['Segar', 'Kering'],
    asal: 'Limbah industri pengolahan kopi; sentra: Aceh, Toraja (Sulawesi), Flores, Jawa (Ijen, Temanggung), Sumatera Barat; Indonesia produsen kopi terbesar ke-4 dunia',
    bagianDimanfaatkan: 'Eksokarp (kulit merah/kuning buah kopi) dan mesokarp lendir (mucilage) dari proses pengupasan basah atau kering',
    metodePengolahan: 'Fermentasi atau ensilase sangat dianjurkan untuk menurunkan kafein dan tanin; dapat dikeringkan menjadi cascara; amoniasi menurunkan tanin lebih efektif',
    ketersediaan: 'Sangat berlimpah di sentra perkebunan kopi pasca panen; tersedia Oktober–Januari (puncak panen kopi Arabika) dan sepanjang tahun (Robusta)',
    kelebihan: 'Protein relatif tinggi untuk limbah buah (±11% BK); K tinggi; tersedia berlimpah dari kebun kopi; fermentasi meningkatkan nilai nutrisi dan menurunkan antinutrisi',
    kekurangan: 'Kafein (±1–2% BK tergantung proses) dan tanin tinggi harus dikurangi dengan fermentasi; batas penggunaan ketat (≤15% ransum); ruminan lebih toleran kafein dari non-ruminan tapi tetap perlu diperhatikan',
    nutrisi: {
      bk: 25, kadarAir: 75,
      pk: 2.8, sk: 7.5, lk: 0.6, abu: 1.9, betn: 12.2,
      tdn: 52, me: 2132,
      ndf: 58, adf: 36,
      ca: 0.08, p: 0.05, mg: 0.06, na: 0.02, k: 0.78, cl: 0.08, s: 0.03,
      vitamin: 'Vitamin C residual sedikit; Vitamin B kompleks sangat rendah (sebagian besar di biji); antioksidan polifenol/klorogenik asam tinggi',
      mineral: 'K tinggi (0,78% as-fed = ±3,1% BK); Ca cukup; P rendah; Mg sedikit; rasio Ca:P ≈1,6:1',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing'],
      programCocok: ['Indukan', 'Grower', 'Pejantan'],
      catatan: 'WAJIB fermentasi atau ensilase minimal 3–5 hari sebelum pemberian skala besar untuk menurunkan kafein dan tanin. Batas ketat 15% ransum BK. Adaptasi bertahap 7–14 hari. Tidak disarankan untuk ternak bunting atau menyusui (kafein dapat transfer ke janin/susu). Paling aman dan bermanfaat setelah fermentasi sempurna.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 200,
      satuan: 'per kg segar (hampir gratis dari penggilingan kopi)', supplier: 'Penggilingan kopi / koperasi petani kopi / kebun kopi',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Coffee pulp (Coffea arabica / C. canephora), fresh and dried',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
        'Göhl (1981) — Tropical Feeds, FAO, Coffee pulp',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia, coffee pulp',
      ],
      sumberData: 'Analisis proksimat kulit kopi Arabika segar (coffee pulp, proses basah) dari perkebunan kopi Aceh Tengah dan Toraja; rata-rata nilai nutrisi',
      catatan: 'Nilai as-fed. Kafein: ±1–2% BK tergantung varietas dan proses (Robusta > Arabika). Fermentasi 7 hari dengan Lactobacillus menurunkan kafein hingga 60–70% dan tanin hingga 40–50%. Nilai nutrisi meningkat signifikan setelah fermentasi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '☕', text: 'Kulit kopi adalah limbah penggilingan kopi yang mengandung protein lebih tinggi dari kebanyakan kulit buah (±11% BK) dan K tinggi. TDN 52% BK cukup untuk roughage. Kafein dan tanin adalah kendala utama yang dapat diatasi dengan fermentasi. Paling bermanfaat di daerah perkebunan kopi.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein ±11% BK — tertinggi di antara kulit/limbah buah umum. K 3,1% BK — sumber K mineral alami tinggi. Tersedia gratis dari penggilingan kopi. Fermentasi meningkatkan nilai dan mengurangi antinutrisi secara efektif.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kafein ±1–2% BK dan tanin tinggi WAJIB diturunkan dengan fermentasi sebelum pemberian rutin. Batasan ketat ≤15% ransum BK. Tidak cocok untuk ternak bunting/menyusui tanpa fermentasi sempurna. Palatabilitas rendah tanpa pengolahan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Setelah fermentasi 5 hari: Kulit Kopi fermentasi 12% + Leguminosa 45% + Dedak 38% + Mineral 5% — formula ekonomis untuk peternak di sentra kopi. K tinggi dari kulit kopi dapat mengurangi kebutuhan suplementasi K pada ternak di daerah K-defisien.' },
      { type: 'peringatan', icon: '🚨', text: '⚠️ KAFEIN: meski ruminansia lebih toleran dari non-ruminan (metabolisme kafein lebih cepat di rumen), JANGAN berikan kulit kopi segar tanpa fermentasi dalam jumlah besar. Kafein dapat transfer ke susu — TIDAK COCOK untuk sapi perah tanpa fermentasi sempurna. Toksisitas kafein pada dosis >1g/kg BB. Batasi ≤15% ransum.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk protein serupa tanpa kafein: Kulit Kakao (protein 8% BK, aman lebih luas), Ampas Tomat (protein lebih tinggi, tanpa alkaloid). Di luar sentra kopi, biaya transportasi membuat kulit kopi tidak ekonomis — gunakan bahan lokal yang tersedia.' },
    ],
  },

  // ── 23. Kulit Semangka ───────────────────────────────────────────────────────
  'kulit-semangka': {
    asalBahan: 'Kulit putih-hijau semangka (eksokarp hijau dan mesokarp putih) setelah daging merah dikonsumsi; limbah dari pedagang buah potong, pasar, dan rumah tangga',
    bentuk: ['Segar'],
    asal: 'Limbah pasar buah dan pedagang buah potong; berlimpah di sentra produksi semangka: Jawa Timur, Lampung, NTB; musiman',
    bagianDimanfaatkan: 'Lapisan putih (mesokarp) dan kulit hijau luar (eksokarp); kadang dengan sisa daging merah tipis yang menempel',
    metodePengolahan: 'Diberikan langsung segar; tidak perlu pengolahan; dapat dipotong untuk ternak kecil; tidak tahan simpan',
    ketersediaan: 'Berlimpah dari pedagang buah potong sepanjang tahun; sangat melimpah saat musim semangka; hampir gratis dari pasar',
    kelebihan: 'Kadar air sangat tinggi berguna untuk hidrasi; hampir gratis dari pedagang; palatabilitas baik; L-citrulline (asam amino) dalam mesokarp putih mendukung imunitas',
    kekurangan: 'BK hanya 5% — nilai nutrisi per kg sangat rendah; tidak bisa menjadi sumber nutrisi apapun; sangat cepat busuk; tidak tahan simpan',
    nutrisi: {
      bk: 5, kadarAir: 95,
      pk: 0.2, sk: 0.2, lk: 0.1, abu: 0.2, betn: 4.3,
      tdn: 60, me: 2460,
      ndf: 5, adf: 2,
      ca: 0.01, p: 0.01, mg: 0.01, na: 0.01, k: 0.08, cl: 0.02, s: 0.01,
      vitamin: 'Vitamin C rendah; beta-karoten sangat rendah; L-citrulline cukup di mesokarp putih',
      mineral: 'Semua mineral sangat rendah karena kandungan air dominan; tidak dapat diandalkan sebagai sumber mineral',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Kerbau', 'Babi'],
      programCocok: ['Grower', 'Indukan'],
      catatan: 'Manfaatkan terutama sebagai sumber hidrasi gratis dari pasar. Nilai nutrisi sangat rendah — jangan mengurangi sumber pakan utama untuk memberi "ruang" bagi kulit semangka. Berikan sesegera mungkin setelah pengambilan dari pasar karena sangat cepat busuk.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 100,
      satuan: 'per kg segar (sering gratis)', supplier: 'Pedagang buah potong / pasar tradisional / pedagang semangka',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Watermelon rind (Citrullus lanatus), fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Göhl (1981) — Tropical Feeds, FAO',
      ],
      sumberData: 'Analisis proksimat kulit semangka (putih + hijau) dari pedagang buah potong Jawa Timur; nilai perkiraan berdasarkan komposisi buah semangka utuh dan proporsi bagian',
      catatan: 'Nilai as-fed. BK 4–6% — hampir semua air. Nilai nutrisi sangat rendah. L-citrulline: ±24 mg/100g di mesokarp putih menurut literatur pangan manusia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍉', text: 'Kulit semangka berfungsi semata-mata sebagai suplemen hidrasi gratis. BK hanya 5% — hampir semua bobotnya adalah air. Kontribusi nutrisi hampir nol. Nilai praktisnya adalah: tersedia gratis dari pedagang buah potong dan disukai ternak untuk hidrasi.' },
      { type: 'kelebihan', icon: '✅', text: 'Gratis dari pedagang buah potong dan pasar. Hidrasi efektif untuk ternak yang kurang minum. L-citrulline di mesokarp putih memiliki efek positif pada sirkulasi darah ternak. Ternak sangat suka makan kulit semangka.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK hanya 5% — hampir tidak ada nilai nutrisi. Sangat cepat busuk (24–36 jam setelah dipotong). Kontribusi protein, energi, mineral hampir nol. Tidak ada justifikasi ekonomis untuk membeli kulit semangka.' },
      { type: 'kombinasi', icon: '🔗', text: 'Manfaatkan hanya sebagai bonus gratis dari pasar — tambahkan ke ransum apa adanya. Tidak perlu dikombinasikan secara khusus karena nilai nutrisinya terlalu rendah untuk diperhitungkan dalam formulasi ransum.' },
      { type: 'peringatan', icon: '🚨', text: 'Gunakan segera setelah pengambilan dari pasar — cepat busuk dalam 24 jam di cuaca panas. Kulit semangka busuk/berlendir harus dibuang. Jangan kurangi pakan utama karena ada kulit semangka. Nilai nutrisinya hampir nol.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk hidrasi yang lebih bernilai: Semangka utuh (nutrisi lebih baik), Kulit Melon (nilai sedikit lebih tinggi), atau Pepaya matang. Kulit semangka cocok hanya jika tersedia gratis dan diambil sesegera mungkin.' },
    ],
  },

  // ── 24. Kulit Melon ──────────────────────────────────────────────────────────
  'kulit-melon': {
    asalBahan: 'Kulit luar melon (Cucumis melo L.) dari pedagang buah potong, industri pengolahan melon, atau pasar tradisional',
    bentuk: ['Segar'],
    asal: 'Limbah pedagang buah potong dan industri pengolahan melon; sentra: Jawa Tengah, Jawa Timur, DIY; tersedia dari pasar modern maupun tradisional',
    bagianDimanfaatkan: 'Kulit luar melon (eksokarp jala/kulit berbaret atau halus tergantung varietas) dan lapisan mesokarp hijau; umumnya tanpa daging buah utama',
    metodePengolahan: 'Diberikan langsung segar; tidak perlu pengolahan; cacah untuk ternak kecil; berikan segera',
    ketersediaan: 'Berlimpah dari pedagang buah potong dan industri pengolahan melon; hampir gratis; tersedia cukup sepanjang tahun',
    kelebihan: 'Palatabilitas baik; hampir gratis dari pedagang; kadar air tinggi untuk hidrasi; nilai nutrisi sedikit lebih baik dari kulit semangka',
    kekurangan: 'BK hanya 8% — nilai nutrisi masih sangat rendah; cepat busuk; tidak dapat menjadi sumber nutrisi utama',
    nutrisi: {
      bk: 8, kadarAir: 92,
      pk: 0.4, sk: 0.4, lk: 0.1, abu: 0.4, betn: 6.7,
      tdn: 62, me: 2542,
      ndf: 8, adf: 4,
      ca: 0.01, p: 0.01, mg: 0.01, na: 0.01, k: 0.15, cl: 0.03, s: 0.01,
      vitamin: 'Vitamin C sedikit; beta-karoten rendah (kecuali varietas berdaging oranye); Vitamin B kompleks sangat rendah',
      mineral: 'Semua mineral sangat rendah; K sedikit lebih tinggi dari kulit semangka; Ca dan P sangat rendah',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Babi'],
      programCocok: ['Grower', 'Indukan'],
      catatan: 'Manfaatkan gratis dari pedagang buah potong. Berikan segera (max 24 jam). Tidak bisa menggantikan sumber nutrisi apapun secara signifikan. Berguna terutama untuk hidrasi dan meningkatkan nafsu makan ternak sakit atau stres.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 100,
      satuan: 'per kg segar (sering gratis)', supplier: 'Pedagang buah potong / industri melon / pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Melon rind (Cucumis melo), fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Göhl (1981) — Tropical Feeds, FAO',
      ],
      sumberData: 'Analisis perkiraan berdasarkan komposisi melon utuh (Feedipedia) dan proporsi kulit terhadap buah utuh varietas Honey Dew dan Action',
      catatan: 'Nilai as-fed perkiraan. Data spesifik kulit melon terbatas di literatur. Nilai nutrisi mirip kulit semangka namun BK dan nutrisi sedikit lebih tinggi karena kulit melon lebih tebal.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍈', text: 'Kulit melon berfungsi terutama sebagai suplemen hidrasi dan palatabilitas booster gratis dari pedagang buah potong. BK 8% — nilai nutrisi rendah namun sedikit lebih baik dari kulit semangka. Berguna sebagai pakan bonus gratis.' },
      { type: 'kelebihan', icon: '✅', text: 'Gratis atau sangat murah dari pedagang. Palatabilitas baik. Kadar air tinggi untuk hidrasi. Ternak suka memakannya. Lebih bernilai dari kulit semangka karena kulit melon lebih tebal dengan sedikit lebih banyak mesokarp.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK 8% — nilai nutrisi masih sangat rendah. Cepat busuk dalam 24 jam di cuaca panas. Tidak ada kontribusi protein atau mineral berarti. Tidak bisa dijadikan bahan pakan utama.' },
      { type: 'kombinasi', icon: '🔗', text: 'Manfaatkan sebagai bonus gratis jika ada pedagang buah potong di dekat kandang. Tambahkan apa adanya ke ransum. Tidak perlu formulasi khusus — kontribusi nutrisinya terlalu rendah untuk diperhitungkan secara signifikan.' },
      { type: 'peringatan', icon: '🚨', text: 'Gunakan dalam 24 jam setelah pengambilan. Kulit busuk harus dibuang. Jangan kurangi pakan utama. Nilai nutrisi sangat rendah — jangan mengandalkan kulit melon untuk kebutuhan nutrisi apapun.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk nilai lebih baik dari limbah cucurbit: Melon utuh afkir (BK dan nutrisi lebih tinggi), Semangka utuh afkir, atau Pepaya matang. Semua lebih bernilai per kg dibanding kulit buah saja.' },
    ],
  },

  // ── 25. Kulit Nangka ─────────────────────────────────────────────────────────
  'kulit-nangka': {
    asalBahan: 'Kulit luar nangka (Artocarpus heterophyllus) yang keras berduri-duri beserta dami putih bagian dalam; limbah dari penjual nangka di pasar',
    bentuk: ['Segar'],
    asal: 'Limbah penjual nangka di pasar tradisional yang menjual nangka matang; berlimpah di Jawa, Sumatera, Kalimantan',
    bagianDimanfaatkan: 'Kulit luar (bertekstur kasar/duri kecil), dami putih (jaringan serat), dan plasenta yang menempel pada kulit',
    metodePengolahan: 'Cacah 3–5 cm sebelum diberikan karena tekstur kasar; getah pada kulit nangka perlu diperhatikan — gunakan kulit nangka matang (getah minimal); dapat difermentasi',
    ketersediaan: 'Berlimpah dari pasar tradisional yang menjual nangka matang; terutama tersedia saat musim nangka (Januari–April); hampir gratis',
    kelebihan: 'Dami putih mengandung pati dan gula cukup tinggi; tersedia gratis dari pasar; palatabilitas baik untuk bagian dami; sumber serat dan karbohidrat murah',
    kekurangan: 'Kulit keras luar sulit dimakan tanpa pencacahan; getah lateks pada nangka tidak terlalu matang; sangat musiman; serat lignin pada kulit keras sulit dicerna',
    nutrisi: {
      bk: 18, kadarAir: 82,
      pk: 1.0, sk: 2.2, lk: 0.2, abu: 1.0, betn: 13.6,
      tdn: 62, me: 2542,
      ndf: 38, adf: 22,
      ca: 0.03, p: 0.02, mg: 0.03, na: 0.01, k: 0.38, cl: 0.05, s: 0.01,
      vitamin: 'Vitamin C rendah; beta-karoten sangat rendah (kulit hijau); Vitamin B kompleks sangat rendah',
      mineral: 'K cukup (dari dami); Ca sedikit lebih baik dari rata-rata; P rendah; Mg sedikit',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Kerbau', 'Babi'],
      programCocok: ['Indukan', 'Grower', 'Penggemukan'],
      catatan: 'Cacah sebelum diberikan untuk memudahkan konsumsi. Pastikan nangka sudah matang (getah minimal). Dami putih adalah bagian paling bernilai — berikan utuh bersama kulit. Maksimal 25% ransum BK. Tersedia gratis dari pasar tradisional penjual nangka matang.',
    },
    harga: {
      estimasiAI: 250, hargaMarketplace: 100,
      satuan: 'per kg segar (sering gratis dari pasar)', supplier: 'Penjual nangka di pasar tradisional / kebun nangka',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Jackfruit rind/husk (Artocarpus heterophyllus), fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis perkiraan berdasarkan komposisi nangka matang utuh dan proporsi bagian (kulit + dami ±72% berat buah); data referensi ASEAN food composition',
      catatan: 'Nilai as-fed untuk campuran kulit keras + dami. Dami saja memiliki nilai nutrisi lebih tinggi (pati dan gula lebih banyak). Kulit keras luar murni (tanpa dami) nilai nutrisinya jauh lebih rendah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Kulit nangka (terutama bagian dami) adalah sumber karbohidrat dan serat gratis dari limbah pasar nangka. TDN 62% BK cukup baik untuk roughage. Dami putih berkontribusi pati dan gula sedangkan kulit keras luar berkontribusi serat struktural.' },
      { type: 'kelebihan', icon: '✅', text: 'Tersedia hampir gratis dari penjual nangka di pasar. Dami putih mengandung karbohidrat cukup dan palatabilitas baik. K cukup tinggi dari dami. Ternak ruminan menyukai dami nangka tanpa perlu adaptasi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kulit keras luar perlu pencacahan karena tekstur kasar. Getah lateks pada nangka kurang matang harus dihindari. Sangat musiman. Serat lignin kulit keras sulit dicerna oleh ternak non-ruminan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kulit+dami nangka (cacah) 20% + Leguminosa segar 45% + Dedak 30% + Mineral 5% — manfaatkan limbah pasar nangka gratis. Ternak ruminan di dekat pasar tradisional dapat memanfaatkan kulit nangka sebagai suplemen serat-karbohidrat gratis.' },
      { type: 'peringatan', icon: '🚨', text: 'Cacah sebelum diberikan — tekstur kasar tanpa pencacahan sulit dikonsumsi. Pastikan nangka matang sempurna (tidak bergetah). Batasi 25% ransum BK. Nangka mentah dengan lateks banyak jangan diberikan.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika kulit nangka tidak tersedia: Dami nangka (bagian terbaik dari nangka, tersedia dari penjual yang sama), Kulit Pisang (nilai nutrisi lebih baik), atau Jerami Padi sebagai roughage. Semua bisa menggantikan peran kulit nangka.' },
    ],
  },

  // ── 26. Kulit Pepaya ─────────────────────────────────────────────────────────
  'kulit-pepaya': {
    asalBahan: 'Kulit luar tipis pepaya matang atau muda (Carica papaya L.) dari pengupasan industri pengolahan pepaya atau pasar',
    bentuk: ['Segar'],
    asal: 'Limbah pengupasan pepaya dari industri pengolahan (manisan pepaya, jus pepaya) dan pasar tradisional; berlimpah di daerah sentra pepaya',
    bagianDimanfaatkan: 'Kulit luar tipis pepaya (tebal ±2–3 mm); papain aktif terutama pada kulit pepaya muda',
    metodePengolahan: 'Diberikan langsung segar; tipis dan lunak sehingga tidak perlu pencacahan khusus; berikan segera karena sangat tipis dan cepat layu',
    ketersediaan: 'Berlimpah dari industri pengolahan pepaya dan pasar yang menjual pepaya kupas; hampir gratis sepanjang tahun',
    kelebihan: 'Papain aktif tinggi (terutama kulit pepaya muda) mendukung kecernaan protein; palatabilitas baik; tersedia gratis; tipis sehingga tidak perlu pengolahan',
    kekurangan: 'Nilai nutrisi sangat rendah karena tipis; sangat cepat layu dan busuk; BK hanya ±10%; tidak bisa menjadi sumber nutrisi utama',
    nutrisi: {
      bk: 10, kadarAir: 90,
      pk: 0.7, sk: 0.8, lk: 0.1, abu: 0.6, betn: 7.8,
      tdn: 62, me: 2542,
      ndf: 14, adf: 7,
      ca: 0.03, p: 0.02, mg: 0.02, na: 0.01, k: 0.20, cl: 0.04, s: 0.01,
      vitamin: 'Beta-karoten cukup (kulit oranye pepaya matang); Vitamin C sedikit; papain aktif (bukan vitamin tapi penting)',
      mineral: 'Ca sedikit lebih baik dari daging buah pepaya; K cukup; P rendah; Mg sedikit',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Babi'],
      programCocok: ['Grower', 'Indukan'],
      catatan: 'Manfaatkan gratis dari industri pengolahan pepaya. Berikan segera setelah pengambilan — sangat tipis dan cepat layu. Tidak bisa menjadi sumber nutrisi utama. Berguna terutama sebagai sumber papain dan palatabilitas enhancer. Maksimal 15% ransum BK.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 100,
      satuan: 'per kg segar (hampir gratis)', supplier: 'Industri pengolahan pepaya / pasar buah / usaha manisan pepaya',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Papaya peel (Carica papaya), fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis perkiraan berdasarkan komposisi pepaya utuh dan proporsi kulit; papain aktif dari literatur enzimologi pepaya',
      catatan: 'Nilai as-fed. Data spesifik kulit pepaya terbatas. Papain paling aktif pada kulit pepaya muda-setengah matang. Kulit pepaya matang memiliki beta-karoten lebih tinggi tetapi papain lebih rendah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🟡', text: 'Kulit pepaya berfungsi sebagai sumber papain gratis dan suplemen kecil vitamin A. Papain aktif membantu kecernaan protein ransum secara alami. BK 10% — kontribusi nutrisi rendah tapi biaya nol menjadikannya pelengkap yang bermanfaat.' },
      { type: 'kelebihan', icon: '✅', text: 'Gratis dari industri pengolahan pepaya. Papain aktif (terutama kulit muda) mendukung pencernaan protein. Beta-karoten dari kulit oranye matang menambah asupan vitamin A. Tidak perlu pengolahan karena kulit tipis dan lunak.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK hanya 10% — nilai nutrisi sangat rendah. Sangat cepat layu dan busuk. Harus segera digunakan. Tidak bisa menjadi sumber nutrisi utama untuk jenis nutrisi apapun.' },
      { type: 'kombinasi', icon: '🔗', text: 'Manfaatkan sebagai bonus gratis jika ada usaha pengolahan pepaya di dekat kandang. Tambahkan langsung ke ransum — efek papain membantu kecernaan ransum keseluruhan terutama untuk unggas dan babi.' },
      { type: 'peringatan', icon: '🚨', text: 'Gunakan dalam 12–24 jam setelah pengambilan — kulit tipis sangat cepat layu. Kulit busuk harus dibuang. Batasi 15% ransum BK. Jangan andalkan kulit pepaya sebagai sumber nutrisi utama apapun.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk papain lebih terkontrol: Pepaya muda segar (papain lebih banyak per kg). Untuk beta-karoten: Pepaya matang daging (lebih efisien). Kulit pepaya paling bernilai hanya jika tersedia gratis dari pengolahan pepaya.' },
    ],
  },

  // ── 27. Kulit Mangga ─────────────────────────────────────────────────────────
  'kulit-mangga': {
    asalBahan: 'Kulit buah mangga (Mangifera indica L.) dari industri pengolahan (jus, puree, manisan, selai) atau pasar',
    bentuk: ['Segar', 'Kering'],
    asal: 'Limbah industri pengolahan mangga; sentra: Probolinggo, Pasuruan (Jawa Timur), Indramayu, Cirebon (Jawa Barat), NTB',
    bagianDimanfaatkan: 'Kulit mangga tipis (1–3 mm) dari semua varietas; memiliki tanin dan polifenol lebih tinggi dari daging buah',
    metodePengolahan: 'Adaptasi bertahap karena tanin; dapat dikeringkan untuk tahan simpan; fermentasi menurunkan tanin; berikan segar dalam jumlah terbatas',
    ketersediaan: 'Berlimpah di sentra industri pengolahan mangga saat musim panen (November–Januari, April–Juni); lebih terbatas di luar musim',
    kelebihan: 'Polifenol dan antioksidan tinggi (gallic acid, quercetin) mendukung imunitas; tersedia dari industri pengolahan; palatabilitas sedang setelah adaptasi',
    kekurangan: 'Tanin dan polifenol tinggi menghambat kecernaan protein; urushiol dalam mangga tertentu bisa menyebabkan iritasi kulit dan saluran cerna; adaptasi bertahap wajib',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 0.8, sk: 1.5, lk: 0.3, abu: 0.6, betn: 16.8,
      tdn: 65, me: 2665,
      ndf: 22, adf: 13,
      ca: 0.01, p: 0.01, mg: 0.02, na: 0.01, k: 0.18, cl: 0.04, s: 0.01,
      vitamin: 'Beta-karoten cukup (dari kulit berwarna); Vitamin C sedikit; Vitamin E sedikit',
      mineral: 'Mineral umumnya rendah; K sedikit; Ca dan P sangat rendah; antioksidan polifenol tinggi (bukan mineral tapi penting fisiologis)',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Kambing', 'Kerbau'],
      programCocok: ['Grower', 'Indukan', 'Penggemukan'],
      catatan: 'Adaptasi bertahap wajib 7–10 hari (mulai 3%, naik ke 15%). Tanin tinggi membatasi penggunaan dan kecernaan protein. Tersedia dari industri pengolahan mangga. Paling tepat digunakan saat musim panen mangga saat harga turun. Batasi 15% ransum BK.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 200,
      satuan: 'per kg segar', supplier: 'Industri pengolahan mangga / sentra pengolahan puree / pasar saat musim panen',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Mango peel (Mangifera indica), fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat kulit mangga segar (varietas Arumanis, Manalagi) dari industri pengolahan mangga Jawa Timur; nilai rata-rata',
      catatan: 'Nilai as-fed. Tanin dan polifenol: ±5–8% BK (lebih tinggi dari daging buah). Urushiol hadir dalam spesies Mangifera tertentu — lebih rendah pada varietas komersial dibanding spesies liar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🥭', text: 'Kulit mangga mengandung antioksidan polifenol (quercetin, gallic acid) tinggi yang mendukung imunitas ternak. TDN 65% BK cukup sebagai suplemen energi-serat moderat. Tersedia dari industri pengolahan mangga saat musim dengan harga murah.' },
      { type: 'kelebihan', icon: '✅', text: 'Polifenol antioksidan tinggi mendukung kesehatan dan imunitas. Tersedia dari industri pengolahan. Beta-karoten dari kulit berwarna menambah asupan vitamin A. Dapat dikeringkan untuk tahan simpan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tanin ±5–8% BK menghambat kecernaan protein secara signifikan — perlu pembatasan. Urushiol pada beberapa varietas bisa menyebabkan iritasi. Palatabilitas sedang — ternak butuh adaptasi. Sangat musiman.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kulit mangga (setelah adaptasi) 12% + Leguminosa 45% + Dedak 38% + Mineral 5% — leguminosa membantu menetralisir efek tanin pada kecernaan protein. Atau fermentasi kulit mangga 5 hari untuk menurunkan tanin sebelum digunakan.' },
      { type: 'peringatan', icon: '🚨', text: 'Adaptasi bertahap wajib karena tanin tinggi. Batasi 15% ransum BK. Hindari pada ternak dengan masalah pencernaan aktif. Waspada urushiol — pada beberapa individu ternak sensitif bisa menyebabkan reaksi iritasi. Kulit mangga kering lebih aman dari segar karena proses pengeringan menurunkan urushiol.' },
      { type: 'alternatif', icon: '🔄', text: 'Kulit buah dengan tanin lebih rendah: Kulit Pisang (palatabilitas lebih baik, tanin rendah), Kulit Pepaya (lunak, mudah dicerna). Untuk antioksidan tanpa tanin berlebih: Pepaya matang atau Mangga daging buah langsung.' },
    ],
  },

  // ── 28. Ampas Nanas ──────────────────────────────────────────────────────────
  'ampas-nanas': {
    asalBahan: 'Sisa perasan daging nanas setelah ekstraksi jus di pabrik pengolahan; mengandung serat pomace, sisa daging, biji, dan bonggol',
    bentuk: ['Segar'],
    asal: 'Limbah industri jus nanas; sentra: PT Great Giant (Lampung), pabrik jus nanas Subang (Jawa Barat), Kediri; tersedia dalam volume sangat besar',
    bagianDimanfaatkan: 'Pomace/ampas nanas pasca ekstraksi jus; campuran serat, sisa daging, kulit dalam, dan biji nanas',
    metodePengolahan: 'Dapat diberikan langsung segar; adaptasi bertahap karena keasaman; fermentasi lactobacillus 3–5 hari meningkatkan kualitas; dapat dikeringkan',
    ketersediaan: 'Sangat berlimpah dari pabrik jus nanas di Lampung, Subang, Kediri; hampir gratis atau sangat murah; tersedia reguler sepanjang tahun',
    kelebihan: 'Protein cukup (±8% BK); bromelain masih aktif; berlimpah dari pabrik; tersedia reguler; palatabilitas baik untuk ruminansia',
    kekurangan: 'Keasaman tinggi perlu adaptasi; NDF tinggi (±55% BK) membatasi kecernaan serat; kadar air tinggi; perlu transportasi dari pabrik',
    nutrisi: {
      bk: 18, kadarAir: 82,
      pk: 1.4, sk: 5.5, lk: 0.4, abu: 0.8, betn: 9.9,
      tdn: 58, me: 2378,
      ndf: 55, adf: 32,
      ca: 0.03, p: 0.02, mg: 0.02, na: 0.01, k: 0.20, cl: 0.04, s: 0.01,
      vitamin: 'Vitamin C residual sedikit; bromelain aktif; beta-karoten sangat rendah; Vitamin B kompleks sangat rendah',
      mineral: 'Semua mineral rendah; Mn sedikit; K cukup; Ca dan P rendah; Mg sangat rendah',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Adaptasi bertahap 5–7 hari. Sangat ekonomis jika peternak berlokasi dekat pabrik nanas. Maksimal 25% ransum BK. Fermentasi 3 hari meningkatkan palatabilitas dan menurunkan keasaman. Kombinasikan dengan sumber protein dan mineral. Segar sebaiknya digunakan dalam 24 jam.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 300,
      satuan: 'per kg segar', supplier: 'Pabrik jus nanas / pabrik pengalengan nanas / industri nanas',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Pineapple pomace (Ananas comosus), fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia, pineapple pomace',
      ],
      sumberData: 'Analisis proksimat ampas nanas segar dari pabrik jus nanas Lampung; nilai rata-rata dari 3 batch produksi',
      catatan: 'Nilai as-fed. BK 15–22% tergantung tingkat ekstraksi jus. NDF/ADF dalam BK basis. Bromelain aktif lebih rendah dari buah segar karena proses pengepresan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍍', text: 'Ampas nanas adalah limbah pabrik jus dengan protein ±8% BK dan bromelain aktif — salah satu ampas buah paling bergizi. TDN 58% BK cukup untuk roughage berkualitas sedang. Tersedia dalam volume sangat besar dari pabrik dengan biaya hampir nol.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein ±8% BK — lebih baik dari kebanyakan kulit buah. Bromelain aktif membantu pencernaan protein. Tersedia reguler dan melimpah dari pabrik. Palatabilitas baik pada ruminansia. Ekonomis jika dekat sumber pabrik.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Keasaman tinggi (pH 3,5–4) perlu adaptasi. NDF 55% BK membatasi kecernaan serat. Kadar air tinggi menyulitkan penyimpanan dan transportasi jarak jauh. Cepat fermentasi spontan jika tidak segera digunakan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ampas Nanas 20% + Hijauan Leguminosa 45% + Dedak 30% + Mineral 5% — ideal untuk peternak dekat pabrik nanas. Fermentasi 3 hari ampas nanas sebelum digunakan meningkatkan palatabilitas dan menurunkan keasaman, cocok untuk program konservasi pakan.' },
      { type: 'peringatan', icon: '🚨', text: 'Adaptasi bertahap wajib. Keasaman tinggi berisiko acidosis rumen jika diberikan langsung dalam jumlah besar. Fermentasi sangat dianjurkan untuk penggunaan reguler >10% ransum. Gunakan segar dalam 24 jam atau fermentasikan segera setelah pengambilan dari pabrik.' },
      { type: 'alternatif', icon: '🔄', text: 'Ampas nanas serupa nilainya dengan Kulit Nanas — keduanya tersedia dari pabrik yang sama. Ampas Jeruk (protein serupa, TDN lebih tinggi) adalah alternatif bagus. Di luar jangkauan pabrik nanas: Ampas Tomat atau Ampas Apel sebagai pengganti ampas buah.' },
    ],
  },

  // ── 29. Ampas Jeruk (Citrus Pulp) ─────────────────────────────────────────────
  'ampas-jeruk': {
    asalBahan: 'Residu ampas jeruk (Citrus spp.) dari industri jus/minuman; mencakup kulit, pulp, dan biji yang tersisa setelah ekstraksi jus; tersedia basah atau kering (DCP)',
    bentuk: ['Segar', 'Kering'],
    asal: 'Limbah industri jus jeruk; secara global dari Florida (AS) dan Brasil; di Indonesia dari industri minuman jeruk di Jawa; DCP bisa diimpor',
    bagianDimanfaatkan: 'Pomace jeruk (kulit + pulp + biji) pasca ekstraksi jus; DCP (Dried Citrus Pulp) adalah produk kering komersial internasional',
    metodePengolahan: 'Segar: adaptasi bertahap; DCP: langsung dapat dicampurkan ke ransum; pengapuran (Ca(OH)2) saat pengeringan meningkatkan nilai nutrisi dan palatabilitas DCP',
    ketersediaan: 'DCP tersedia sebagai produk impor komersial; segar dari industri jus jeruk lokal terbatas; DCP lebih umum tersedia di toko pakan ternak',
    kelebihan: 'TDN tertinggi di antara semua ampas buah (±75% BK untuk DCP); pektin sangat tinggi (±24% BK) — sumber energi fermentable dari pektin; protein cukup; palatabilitas DCP baik',
    kekurangan: 'Segar: d-limonene mengurangi palatabilitas awal; DCP: harga impor; tidak tersedia secara lokal dalam jumlah besar di Indonesia; keasaman perlu perhatian',
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 6.5, sk: 11.5, lk: 2.5, abu: 5.8, betn: 63.7,
      tdn: 75, me: 3075,
      ndf: 32, adf: 22,
      ca: 0.55, p: 0.08, mg: 0.10, na: 0.03, k: 0.63, cl: 0.08, s: 0.05,
      vitamin: 'Vitamin C rendah setelah pengeringan; d-limonene masih ada tapi lebih rendah; flavonoid (hesperidin) tahan panas',
      mineral: 'Ca sangat tinggi untuk ampas buah (0,55% as-fed DCP = ±0,6% BK setelah pengapuran); K cukup; P rendah; rasio Ca:P sangat tidak seimbang (7:1) — suplementasi P penting',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      catatan: 'DCP dapat langsung dicampurkan ke ransum hingga 20% tanpa adaptasi khusus. DCP adalah pengganti parsial jagung yang efektif dari segi nilai energi. Suplementasi P penting karena Ca:P tidak seimbang. Sangat berguna untuk sapi perah karena meningkatkan lemak susu (pektin → asetat di rumen).',
    },
    harga: {
      estimasiAI: 500, hargaMarketplace: 4500,
      satuan: 'per kg (DCP kering)', supplier: 'Distributor pakan ternak / importir DCP / industri jus jeruk lokal',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Bampidis & Robinson (2006) — Citrus by-products as ruminant feeds: A review. Animal Feed Science and Technology, 128, 175–217',
        'Feedipedia (2023) — Citrus pulp, dried (DCP)',
        'NRC (2016) — Nutrient Requirements of Beef Cattle',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
      ],
      sumberData: 'Data nutrisi DCP berdasarkan nilai komersial internasional (Feedipedia, NRC); nilai as-fed untuk produk kering (BK ±88–90%)',
      catatan: 'Nilai as-fed untuk DCP kering. Ampas jeruk segar memiliki BK ±20–25%, nilai nutrisi lebih encer. Ca tinggi pada DCP sebagian dari proses pengapuran (lime treatment) selama pengeringan komersial.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍊', text: 'Ampas Jeruk/DCP adalah bahan pakan komersial internasional yang terbukti di industri peternakan dunia — TDN 75% BK, pektin fermentable 24% BK (menghasilkan asetat di rumen yang mendukung lemak susu), dan Ca tinggi. Dapat menggantikan 10–20% jagung dalam ransum penggemukan dan sapi perah.' },
      { type: 'kelebihan', icon: '✅', text: 'TDN tertinggi di antara semua ampas buah (75% BK). Pektin fermentable mendukung produksi lemak susu. Ca tinggi membantu ransum defisit Ca. Produk DCP tersedia komersial dengan kualitas konsisten. Diakui sebagai bahan pakan standar internasional.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Rasio Ca:P ≈7:1 dalam DCP — wajib suplementasi P untuk menyeimbangkan. Harga DCP impor cukup tinggi. Tidak tersedia lokal dalam jumlah besar di Indonesia. D-limonene residual pada DCP menjaga palatabilitas lebih rendah dari biji-bijian.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum sapi perah: DCP 15% (pengganti sebagian jagung) + Hijauan 55% + Konsentrat 30% — pektin DCP meningkatkan proporsi asetat fermentasi rumen → mendukung kadar lemak susu. Tambahkan DCP fosfat atau monokalium fosfat untuk suplementasi P.' },
      { type: 'peringatan', icon: '🚨', text: 'Suplementasi P wajib karena Ca:P DCP sangat tidak seimbang (7:1 vs ideal 2:1). Jangan melebihi 20% ransum BK. Segar jeruk: adaptasi 10–14 hari karena d-limonene. DCP: palatabilitas lebih baik tapi tetap lebih rendah dari biji-bijian.' },
      { type: 'alternatif', icon: '🔄', text: 'DCP bisa diganti dengan sumber pektin lokal: Ampas Apel (pektin serupa), Kulit Jeruk lokal (lebih murah tapi lebih asam). Untuk TDN tinggi serupa tanpa masalah pektin: Ubi Kayu atau Molases. Pilih DCP jika tersedia dengan harga kompetitif.' },
    ],
  },

  // ── 30. Ampas Tomat ──────────────────────────────────────────────────────────
  'ampas-tomat': {
    asalBahan: 'Residu padat pengolahan tomat (Solanum lycopersicum L.) dari industri saos, kecap tomat, jus tomat, atau pasta tomat; terdiri dari kulit, biji, dan ampas daging tomat',
    bentuk: ['Segar', 'Kering'],
    asal: 'Limbah industri pengolahan tomat; sentra: Jawa Timur (Malang, Batu, Pasuruan), Jawa Tengah, Sumatera Barat; musiman sesuai produksi tomat',
    bagianDimanfaatkan: 'Pomace tomat (kulit + biji + ampas daging) pasca ekstraksi jus/pasta; biji tomat yang kaya protein dan lemak mendominasi nilai nutrisi',
    metodePengolahan: 'Segar: gunakan segera atau fermentasi; kering: tahan simpan lama dan nilai nutrisi terkonsentrasi; penggilingan meningkatkan kecernaan biji',
    ketersediaan: 'Tersedia dari industri pengolahan tomat; musiman sesuai panen tomat (puncak Mei–September di Jawa); bisa dikeringkan untuk penyimpanan jangka panjang',
    kelebihan: 'Protein tertinggi di antara ampas buah (±17–20% BK) karena kandungan biji tinggi; lemak cukup (±12% BK); likopen antioksidan tinggi; nilai gizi lebih tinggi dari ampas buah lain',
    kekurangan: 'Sangat musiman; kadar air tinggi bila segar; harga bervariasi; palatabilitas sedang perlu adaptasi; likopen dan asam organik perlu diperhatikan dalam dosis tinggi',
    nutrisi: {
      bk: 25, kadarAir: 75,
      pk: 4.3, sk: 7.2, lk: 3.0, abu: 1.8, betn: 8.7,
      tdn: 62, me: 2542,
      ndf: 52, adf: 34,
      ca: 0.04, p: 0.09, mg: 0.04, na: 0.02, k: 0.38, cl: 0.05, s: 0.03,
      vitamin: 'Likopen sangat tinggi (antioksidan kuat); beta-karoten cukup; Vitamin C sedang; Vitamin E dari biji (tokoferol)',
      mineral: 'P lebih tinggi dari kebanyakan ampas buah (0,09%); K cukup; Ca rendah; rasio Ca:P ±0,4:1 — sangat tidak seimbang; butuh suplementasi Ca',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      catatan: 'Protein tertinggi di antara ampas buah — sangat berguna untuk memperbaiki defisit protein ransum. Suplementasi Ca wajib (Ca:P sangat tidak seimbang). Adaptasi bertahap 5–7 hari. Maksimal 20% ransum BK. Sangat berguna untuk sapi perah karena protein tinggi dan likopen antioksidan.',
    },
    harga: {
      estimasiAI: 600, hargaMarketplace: 500,
      satuan: 'per kg segar', supplier: 'Industri saos tomat / pabrik pasta tomat / industri jus tomat',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Tomato pomace (Solanum lycopersicum), fresh and dried',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, Tomato pomace',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Analisis proksimat ampas tomat segar dari industri saos tomat Jawa Timur; nilai rata-rata dari 3 pabrik',
      catatan: 'Nilai as-fed. Komposisi sangat bervariasi tergantung rasio biji:kulit:daging — biji lebih banyak = protein dan lemak lebih tinggi. Ampas kering (BK ±90%) memiliki nutrisi terkonsentrasi. Likopen: ±50–100 mg/100g dalam ampas segar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍅', text: 'Ampas tomat adalah sumber protein tertinggi di antara semua ampas buah — PK ±17–20% BK dari biji tomat. LK 12% BK dari minyak biji tomat (tocopherol) memberikan energi padat tambahan. Likopen antioksidan tinggi mendukung imunitas dan reproduksi ternak.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein tertinggi di antara ampas buah (17–20% BK) — dapat berkontribusi signifikan pada protein ransum. Likopen antioksidan mendukung imunitas. Lemak dari biji tomat berkualitas baik (kaya tokoferol). Tersedia dari industri pengolahan tomat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ca:P sangat tidak seimbang (0,4:1) — wajib suplementasi Ca. Sangat musiman. Palatabilitas sedang perlu adaptasi. Asam organik dalam ampas tomat perlu diperhatikan untuk ruminan dengan masalah asidosis.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ampas Tomat 15% + Rumput Gajah 50% + Kapur Pertanian (Ca) 1% + Dedak 34% — memanfaatkan protein tinggi ampas tomat dan menyeimbangkan Ca. Untuk sapi perah: Ampas Tomat 15% dalam ransum meningkatkan asupan protein dan likopen (mendukung reproduksi dan imunitas).' },
      { type: 'peringatan', icon: '🚨', text: 'Wajib suplementasi Ca karena rasio Ca:P sangat rendah (0,4:1). Adaptasi bertahap karena asam organik dan palatabilitas sedang. Batasi 20% ransum BK. Ampas tomat segar harus digunakan dalam 24–48 jam atau difermentasi/dikeringkan.' },
      { type: 'alternatif', icon: '🔄', text: 'Ampas buah berprotein tinggi lainnya: Ampas Anggur (protein 11–14% BK), Biji Pepaya (protein 24–30% BK). Untuk protein tanpa batasan Ca:P: Bungkil Kedelai atau Ampas Tahu lebih seimbang mineral.' },
    ],
  },

  // ── 31. Ampas Apel ────────────────────────────────────────────────────────────
  'ampas-apel': {
    asalBahan: 'Residu pengolahan apel (Malus domestica) dari industri jus, cider, selai, atau olahan apel; terdiri dari kulit, biji, dan ampas daging apel',
    bentuk: ['Segar'],
    asal: 'Limbah industri pengolahan apel; sentra utama Indonesia: Kota Batu, Malang (Jawa Timur) yang merupakan sentra apel terbesar; skala lebih kecil di beberapa daerah',
    bagianDimanfaatkan: 'Pomace apel (kulit + biji + ampas daging) pasca ekstraksi jus atau pengolahan; pektin terkonsentrasi di pomace',
    metodePengolahan: 'Segar: gunakan dalam 24–48 jam atau fermentasi; kering: tahan simpan; fermentasi meningkatkan nilai dan palatabilitas; biji apel mengandung amigdalin (HCN dalam dosis sangat besar)',
    ketersediaan: 'Tersedia dari industri pengolahan apel di Batu-Malang; musiman sesuai panen apel (Maret–Agustus); volume terbatas dibanding ampas buah tropis',
    kelebihan: 'Pektin tinggi (±15–20% BK) mendukung fermentasi rumen; TDN lebih baik dari rata-rata ampas buah; palatabilitas baik; antioksidan (quercetin, katekin) tinggi',
    kekurangan: 'Ketersediaan terbatas di luar Jawa Timur; amigdalin dalam biji (HCN potensi minimal dalam dosis normal); musiman; harga lebih tinggi dari ampas buah tropis lain',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 1.6, sk: 4.0, lk: 1.2, abu: 0.9, betn: 14.3,
      tdn: 65, me: 2665,
      ndf: 42, adf: 26,
      ca: 0.02, p: 0.02, mg: 0.03, na: 0.01, k: 0.20, cl: 0.04, s: 0.02,
      vitamin: 'Vitamin C cukup; antioksidan quercetin/katekin tinggi; beta-karoten rendah; Vitamin E dari biji sedikit',
      mineral: 'Mineral moderat; K cukup; Ca dan P seimbang (1:1 rasio); Mg sedikit; Zn dan Fe rendah',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Palatabilitas lebih baik dari ampas nanas atau jeruk (lebih netral pH). Pektin mendukung fermentasi rumen sehat. Tersedia dari industri apel Batu-Malang. Maksimal 20% ransum BK. Amigdalin biji apel sangat rendah dalam jumlah normal — tidak menjadi masalah praktis.',
    },
    harga: {
      estimasiAI: 800, hargaMarketplace: 700,
      satuan: 'per kg segar', supplier: 'Industri pengolahan apel / pabrik jus apel Batu-Malang / cider apel',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Apple pomace (Malus domestica), fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'NRC (2016) — Nutrient Requirements of Beef Cattle',
      ],
      sumberData: 'Analisis proksimat ampas apel segar dari industri jus apel Kota Batu, Malang; dikombinasikan dengan data Feedipedia internasional',
      catatan: 'Nilai as-fed. Pektin: ±15–20% BK pada pomace apel (lebih tinggi dari banyak bahan pakan). Amigdalin dalam biji apel: potensi HCN sangat minimal dalam dosis pakan normal (<5 mg HCN/kg ampas segar). Tidak menjadi masalah praktis dalam pemberian 20% ransum.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍎', text: 'Ampas apel adalah sumber pektin fermentable yang baik — TDN 65% BK dengan pektin 15–20% BK yang difermentasi di rumen menghasilkan asetat (mendukung lemak susu sapi perah). Antioksidan quercetin dan katekin mendukung imunitas ternak. Palatabilitas lebih baik dari ampas buah asam lainnya.' },
      { type: 'kelebihan', icon: '✅', text: 'Pektin tinggi mendukung fermentasi rumen sehat dan produksi lemak susu. Palatabilitas lebih baik dari ampas jeruk atau nanas (pH lebih netral). Ca:P seimbang (1:1) — lebih baik dari banyak ampas buah lain. Antioksidan tinggi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ketersediaan sangat terbatas di luar sentra Batu-Malang. Harga lebih tinggi dari ampas buah tropis yang lebih berlimpah. Musiman sesuai panen apel.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ampas Apel 15% + Rumput Gajah 55% + Konsentrat 30% — ideal untuk sapi perah di dekat sentra apel Malang. Pektin ampas apel sinergis dengan serat rumput untuk fermentasi rumen seimbang dan produksi susu berkualitas.' },
      { type: 'peringatan', icon: '🚨', text: 'Amigdalin dalam biji apel: minimal dalam dosis pakan normal, tidak perlu khawatir berlebihan. Batasi 20% ransum BK. Gunakan segar dalam 24–48 jam atau difermentasi. Perhatikan biaya transportasi dari Batu-Malang jika berlokasi jauh.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika ampas apel terlalu mahal atau tidak tersedia: DCP (Dried Citrus Pulp) sebagai sumber pektin fermentable serupa. Ampas Nanas jika dekat pabrik nanas. Molases sebagai sumber energi fermentable cair dengan pektin lebih rendah.' },
    ],
  },

  // ── 32. Ampas Anggur ─────────────────────────────────────────────────────────
  'ampas-anggur': {
    asalBahan: 'Residu kulit, biji, dan ampas daging anggur (Vitis vinifera L.) setelah pemerasan jus atau pembuatan wine; dikenal sebagai grape pomace atau marc',
    bentuk: ['Segar', 'Kering'],
    asal: 'Limbah industri anggur dan jus anggur; sentra: Bali (Singaraja, Bangli), NTB (Lombok), NTT; produksi anggur Indonesia terbatas namun berkembang',
    bagianDimanfaatkan: 'Pomace anggur (kulit + biji + tangkai/stem) pasca pemerasan; kaya tanin dari kulit dan biji',
    metodePengolahan: 'Segar: fermentasi atau ensilase dianjurkan untuk menurunkan tanin; kering: lebih tahan simpan; penggilingan meningkatkan kecernaan biji anggur',
    ketersediaan: 'Terbatas pada daerah dengan industri anggur (Bali, NTB, NTT); musiman; skala produksi kecil di Indonesia; bisa diimpor dalam bentuk kering',
    kelebihan: 'Protein cukup (±11–14% BK); polifenol dan resveratrol sangat tinggi — antioksidan kuat; OPC (oligomeric proanthocyanidins) mendukung imunitas; serat dari biji dan kulit',
    kekurangan: 'Tanin sangat tinggi dari biji dan kulit menurunkan kecernaan protein signifikan; ketersediaan sangat terbatas; fermentasi wajib untuk penggunaan optimal; palatabilitas rendah tanpa pengolahan',
    nutrisi: {
      bk: 35, kadarAir: 65,
      pk: 4.0, sk: 13.0, lk: 3.5, abu: 2.5, betn: 12.0,
      tdn: 52, me: 2132,
      ndf: 55, adf: 38,
      ca: 0.06, p: 0.07, mg: 0.06, na: 0.02, k: 0.38, cl: 0.06, s: 0.03,
      vitamin: 'Resveratrol sangat tinggi (antioksidan); OPC tinggi; Vitamin E dari biji anggur (tokoferol tinggi); Vitamin C rendah',
      mineral: 'K cukup; Ca dan P sedikit lebih seimbang (Ca:P ≈0,9:1); Mg cukup; Fe dan Mn sedikit lebih baik dari rata-rata ampas buah',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Grower', 'Pejantan'],
      catatan: 'Fermentasi wajib untuk mengurangi tanin dan meningkatkan palatabilitas. Adaptasi bertahap 7–14 hari. Batasi ketat 15% ransum BK karena tanin tinggi. Sangat berguna untuk peternak di sekitar industri anggur Bali sebagai sumber antioksidan alami. Suplementasi Ca dianjurkan karena rasio Ca:P hampir 1:1 (agak rendah).',
    },
    harga: {
      estimasiAI: 1000, hargaMarketplace: 900,
      satuan: 'per kg segar', supplier: 'Industri anggur Bali / winery Bali-NTB / industri jus anggur',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Grape pomace (Vitis vinifera), fresh and dried',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, Grape pomace',
        'Göhl (1981) — Tropical Feeds, FAO',
      ],
      sumberData: 'Analisis proksimat ampas anggur segar dari winery Bali dan data internasional Feedipedia; rata-rata nilai untuk pomace pasca fermentasi wine',
      catatan: 'Nilai as-fed. Tanin: ±3–8% BK tergantung varietas dan proporsi biji:kulit. Resveratrol: ±10–50 mg/100g ampas segar. BK lebih tinggi dari ampas buah tropis karena kandungan kulit dan biji lebih dominan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍇', text: 'Ampas anggur adalah sumber resveratrol dan OPC terkaya di antara semua ampas buah — antioksidan kuat yang mendukung imunitas, reproduksi, dan kesehatan kardiovaskular ternak. Protein ±11–14% BK cukup berkontribusi pada ransum. Tersedia dari industri wine/jus anggur Bali.' },
      { type: 'kelebihan', icon: '✅', text: 'Resveratrol dan OPC sangat tinggi — antioksidan kuat yang meningkatkan imunitas dan performa reproduksi ternak. Protein 11–14% BK lebih baik dari kebanyakan ampas buah. Vitamin E (tokoferol) dari biji anggur tinggi mendukung imunitas dan reproduksi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tanin ±3–8% BK sangat menghambat kecernaan protein — fermentasi wajib. Ketersediaan sangat terbatas (hanya di Bali/NTB/NTT). Palatabilitas rendah tanpa pengolahan. Batasan ketat ≤15% ransum karena tanin.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ampas Anggur (fermentasi 7 hari) 12% + Leguminosa 45% + Dedak 38% + Mineral 5% — memanfaatkan antioksidan ampas anggur sambil menetralisir tanin dengan leguminosa. Cocok untuk program peternakan premium di Bali yang ingin memanfaatkan limbah industri wine lokal.' },
      { type: 'peringatan', icon: '🚨', text: 'Fermentasi WAJIB untuk menurunkan tanin sebelum penggunaan rutin dalam dosis >5%. Adaptasi bertahap 7–14 hari. Batasi ≤15% ransum BK. Tanin sangat tinggi tanpa pengolahan akan menurunkan kecernaan protein ransum secara drastis.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika ampas anggur tidak tersedia: Ampas Tomat (protein serupa, antioksidan juga baik dari likopen), Kulit Kakao (antioksidan dari polifenol kakao). Untuk resveratrol spesifik: tidak ada alternatif murah dari buah lokal — ini keunikan ampas anggur.' },
    ],
  },

  // ── 33. Ampas Jambu Biji ──────────────────────────────────────────────────────
  'ampas-jambu': {
    asalBahan: 'Residu pengolahan jus jambu biji (Psidium guajava L.) dari industri minuman; mengandung kulit, biji keras banyak, dan sisa daging jambu',
    bentuk: ['Segar'],
    asal: 'Limbah industri minuman jus jambu; sentra: Bogor, Sukabumi (Jawa Barat), Lampung; tersedia dari pabrik jus jambu biji yang cukup banyak di Indonesia',
    bagianDimanfaatkan: 'Pomace jambu biji (kulit + biji sangat banyak + ampas daging) pasca ekstraksi jus',
    metodePengolahan: 'Segar: berikan dengan atau tanpa pengolahan; biji keras sangat banyak — giling jika bisa untuk meningkatkan kecernaan; fermentasi EM4 meningkatkan palatabilitas',
    ketersediaan: 'Tersedia dari pabrik jus jambu biji di Bogor, Sukabumi, Lampung; reguler sepanjang tahun; harga murah dari pabrik',
    kelebihan: 'Vitamin C residu masih cukup; pektin tinggi dari kulit; tersedia reguler dari pabrik jus; protein ±7% BK; serat dari biji berguna sebagai roughage',
    kekurangan: 'Biji keras sangat banyak dalam ampas menurunkan nilai nutrisi efektif dan kecernaan; penggilingan biji diperlukan untuk optimal; palatabilitas sedang',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 1.5, sk: 5.0, lk: 0.4, abu: 0.9, betn: 14.2,
      tdn: 57, me: 2337,
      ndf: 48, adf: 30,
      ca: 0.03, p: 0.03, mg: 0.03, na: 0.01, k: 0.25, cl: 0.05, s: 0.02,
      vitamin: 'Vitamin C residual sedikit; polifenol antioksidan cukup; beta-karoten rendah; pektin tinggi dari kulit',
      mineral: 'Ca dan P seimbang (1:1 rasio) — baik; K cukup; Mn sedikit lebih tinggi; Mg sedikit',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Grower', 'Indukan', 'Penggemukan'],
      catatan: 'Giling biji sebelum diberikan jika memungkinkan untuk meningkatkan kecernaan. Tersedia reguler dari pabrik jus jambu. Maksimal 20% ransum BK. Adaptasi sederhana 3–5 hari. Kombinasikan dengan sumber protein. Pektin mendukung fermentasi rumen.',
    },
    harga: {
      estimasiAI: 500, hargaMarketplace: 400,
      satuan: 'per kg segar', supplier: 'Pabrik jus jambu biji / industri minuman jambu (Bogor, Sukabumi, Lampung)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Guava pomace (Psidium guajava), fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat ampas jambu biji segar dari pabrik jus Bogor dan Sukabumi; nilai rata-rata',
      catatan: 'Nilai as-fed. BK 20–25%. Proporsi biji sangat tinggi dalam ampas jambu (±25–30% BM) — menurunkan kecernaan efektif tanpa penggilingan. Pektin dari kulit jambu tetap tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍏', text: 'Ampas jambu biji mengandung pektin fermentable dari kulit dan protein ±7% BK. Vitamin C residu mendukung imunitas. Tersedia dari pabrik jus jambu yang cukup banyak di Indonesia. TDN 57% BK cukup sebagai roughage berkualitas sedang.' },
      { type: 'kelebihan', icon: '✅', text: 'Tersedia reguler dari pabrik jus jambu. Pektin mendukung fermentasi rumen. Rasio Ca:P seimbang (1:1) — baik di antara ampas buah. Antioksidan polifenol mendukung imunitas. Vitamin C residu.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Biji keras sangat banyak dan keras dalam ampas sangat menurunkan kecernaan tanpa penggilingan. Palatabilitas sedang perlu adaptasi. TDN 57% BK — lebih rendah dari ampas jeruk atau apel.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ampas Jambu 15% + Leguminosa segar 45% + Dedak 35% + Mineral 5% — kombinasi untuk memanfaatkan ampas dari pabrik jus jambu. Jika ada alat penggilingan: giling ampas terlebih dahulu untuk meningkatkan kecernaan biji secara signifikan.' },
      { type: 'peringatan', icon: '🚨', text: 'Biji jambu keras dapat mengganggu sistem pencernaan ternak kecil jika diberikan dalam jumlah besar tanpa penggilingan. Batasi 20% ransum BK. Adaptasi bertahap 3–5 hari. Gunakan segar dalam 24 jam atau fermentasi.' },
      { type: 'alternatif', icon: '🔄', text: 'Ampas buah berprotein serupa: Ampas Nanas (lebih berlimpah, protein serupa), Ampas Mangga (lebih musiman, protein sedikit lebih rendah). Untuk pektin tinggi tanpa biji keras: Ampas Apel atau DCP lebih baik.' },
    ],
  },

  // ── 34. Ampas Mangga ─────────────────────────────────────────────────────────
  'ampas-mangga': {
    asalBahan: 'Residu daging dan kulit mangga (Mangifera indica L.) dari industri pengolahan jus, puree, manisan, atau selai mangga',
    bentuk: ['Segar'],
    asal: 'Limbah industri pengolahan mangga; sentra: Probolinggo, Pasuruan (Jawa Timur), Indramayu (Jawa Barat), NTB; musiman sesuai panen mangga',
    bagianDimanfaatkan: 'Pomace mangga (kulit + sisa daging + serat buah) pasca ekstraksi jus atau puree; tanpa biji keras',
    metodePengolahan: 'Segar: gunakan dalam 24 jam atau fermentasi; fermentasi lactobacillus menurunkan tanin dari kulit; kering: tahan simpan; palatabilitas baik saat segar',
    ketersediaan: 'Sangat musiman (puncak Oktober–Januari); tersedia dari industri pengolahan mangga saat musim; dikeringkan untuk penggunaan di luar musim',
    kelebihan: 'Palatabilitas lebih baik dari kebanyakan ampas buah (aroma mangga disukai ternak); antioksidan polifenol; beta-karoten dari kulit dan daging; serat sedang',
    kekurangan: 'Sangat musiman; tanin dari kulit mangga perlu diperhatikan (lebih rendah dari ampas anggur tapi tetap ada); protein masih rendah (±5–7% BK)',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 1.0, sk: 3.0, lk: 0.5, abu: 0.8, betn: 14.7,
      tdn: 62, me: 2542,
      ndf: 38, adf: 22,
      ca: 0.02, p: 0.02, mg: 0.03, na: 0.01, k: 0.22, cl: 0.04, s: 0.01,
      vitamin: 'Beta-karoten cukup dari kulit dan daging oranye; Vitamin C sedikit; Vitamin E dari biji residual sedikit; polifenol/antioksidan cukup',
      mineral: 'Ca dan P seimbang (1:1); K cukup; Mg sedikit; mineral lain sangat rendah',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Palatabilitas sangat baik karena aroma mangga disukai ternak. Manfaatkan saat musim panen mangga ketika harga sangat murah. Maksimal 20% ransum BK. Fermentasi 3 hari meningkatkan nilai nutrisi dan menurunkan tanin dari kulit. Kombinasikan dengan sumber protein.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 300,
      satuan: 'per kg segar', supplier: 'Industri pengolahan mangga / pabrik jus/puree mangga',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Mango pomace (Mangifera indica), fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat ampas mangga segar dari industri jus mangga Jawa Timur dan Jawa Barat; rata-rata nilai nutrisi',
      catatan: 'Nilai as-fed. Komposisi bervariasi tergantung varietas (Arumanis lebih berdaging, Manalagi kulit lebih tipis). Beta-karoten lebih tinggi pada varietas oranye tua.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🥭', text: 'Ampas mangga memiliki palatabilitas terbaik di antara ampas buah karena aroma khas mangga yang sangat disukai ternak. TDN 62% BK cukup sebagai roughage. Beta-karoten dari kulit oranye menambah asupan vitamin A. Tersedia murah saat puncak musim mangga.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas terbaik di antara ampas buah — aroma mangga mengundang ternak makan dengan antusias. Beta-karoten cukup mendukung vitamin A. Ca:P seimbang (1:1) — lebih baik dari banyak ampas buah. Tersedia murah saat puncak musim.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Sangat musiman. Tanin dari kulit mangga perlu adaptasi. Protein masih rendah (5% BK). Harga di luar musim tidak ekonomis. Perlu pengolahan (fermentasi/pengeringan) untuk penggunaan di luar musim.' },
      { type: 'kombinasi', icon: '🔗', text: 'Musim mangga: Ampas Mangga 18% + Leguminosa 45% + Dedak 32% + Mineral 5% — manfaatkan harga murah. Untuk sapi yang susah makan: campur sedikit ampas mangga ke ransum lain untuk meningkatkan palatabilitas keseluruhan karena aroma mangga sangat menarik.' },
      { type: 'peringatan', icon: '🚨', text: 'Adaptasi bertahap 5 hari untuk menghindari gangguan akibat tanin. Batasi 20% ransum BK. Gunakan segar dalam 24 jam atau fermentasi. Sangat musiman — jangan bergantung pada ampas mangga untuk kebutuhan sepanjang tahun.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika di luar musim mangga: Ampas Nanas (lebih tersedia sepanjang tahun), Ampas Pisang (palatabilitas juga baik, lebih tersedia). Untuk beta-karoten di luar musim: Pepaya matang atau Wortel.' },
    ],
  },

  // ── 35. Ampas Pisang ─────────────────────────────────────────────────────────
  'ampas-pisang': {
    asalBahan: 'Residu pengolahan pisang (Musa spp.) dari industri tepung pisang, keripik pisang, atau jus pisang; mengandung pati residu, serat, dan kulit sisa',
    bentuk: ['Segar'],
    asal: 'Limbah industri pengolahan pisang; sentra: Lampung (terbesar — industri tepung pisang), Jawa Timur, Jawa Barat; industri keripik pisang di seluruh Indonesia',
    bagianDimanfaatkan: 'Residu daging pisang dari industri tepung/keripik (sisa pati dan serat setelah ekstraksi) atau dari industri jus pisang',
    metodePengolahan: 'Segar: berikan langsung atau fermentasi; kering: tepung pisang reject/residu tahan simpan; palatabilitas sangat baik karena aroma pisang',
    ketersediaan: 'Tersedia dari industri tepung pisang dan keripik pisang di Lampung dan Jawa; sepanjang tahun dari industri yang cukup berkembang',
    kelebihan: 'Palatabilitas sangat baik (aroma pisang disukai ternak); K tinggi; pati residu memberikan energi; tersedia dari industri yang berkembang; harga murah',
    kekurangan: 'Pati sudah sebagian terekstraksi — nilai energi lebih rendah dari pisang utuh; protein masih rendah; kadar air tinggi bila segar',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 1.5, sk: 2.5, lk: 0.4, abu: 2.0, betn: 15.6,
      tdn: 66, me: 2706,
      ndf: 28, adf: 16,
      ca: 0.02, p: 0.04, mg: 0.05, na: 0.02, k: 0.95, cl: 0.08, s: 0.02,
      vitamin: 'Vitamin B6 sedikit (sebagian besar hilang dalam pengolahan); Vitamin C sangat rendah; beta-karoten sangat rendah',
      mineral: 'K sangat tinggi (0,95% as-fed ≈ ±4,3% BK) — tertinggi di antara ampas buah; P lebih baik dari kulit pisang; Ca rendah; Mg cukup',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Palatabilitas sangat baik — berguna untuk meningkatkan konsumsi ransum berbasis hijauan rendah palatabilitas. K sangat tinggi — perhatikan pada sapi perah prepartum. Suplementasi Ca dianjurkan. Tersedia dari industri tepung pisang Lampung. Maksimal 25% ransum BK.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 250,
      satuan: 'per kg segar', supplier: 'Industri tepung pisang / pabrik keripik pisang / pengolah pisang',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Banana pomace (Musa spp.), fresh',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat ampas pisang segar dari industri tepung pisang Lampung; nilai rata-rata varietas Cavendish',
      catatan: 'Nilai as-fed. K sangat tinggi (±4,3% BK) — perhatikan DCAD pada sapi perah prepartum. NDF dan ADF dalam BK basis. Nilai nutrisi bervariasi tergantung jenis pengolahan (tepung vs keripik vs jus).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍌', text: 'Ampas pisang memiliki palatabilitas tertinggi di antara semua ampas buah — aroma pisang yang khas sangat disukai ternak. K sangat tinggi (4,3% BK) mendukung keseimbangan elektrolit ternak di cuaca panas. TDN 66% BK cukup sebagai sumber energi-serat moderat.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas tertinggi di antara ampas buah — efektif meningkatkan konsumsi ransum rendah palatabilitas. K sangat tinggi mendukung ternak di cuaca panas. Tersedia dari industri tepung pisang yang berkembang di Lampung. Harga murah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'K sangat tinggi (4,3% BK) — TIDAK COCOK untuk sapi perah 3 minggu sebelum beranak (risiko milk fever). Protein masih rendah. Pati sudah terekstraksi — nilai energi lebih rendah dari pisang utuh.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ampas Pisang 20% + Leguminosa 45% + Dedak 30% + Mineral+Ca 5% — suplementasi Ca wajib karena K sangat tinggi (menyeimbangkan DCAD). Ampas pisang 5–10% efektif dicampurkan ke pakan yang kurang palatabel untuk meningkatkan konsumsi keseluruhan.' },
      { type: 'peringatan', icon: '🚨', text: 'K sangat tinggi (4,3% BK) — JANGAN berikan dalam jumlah besar pada sapi perah prepartum (risiko milk fever). Batasi 25% ransum BK. Suplementasi Ca wajib. Monitor DCAD ransum total jika menggabungkan dengan bahan K tinggi lain.' },
      { type: 'alternatif', icon: '🔄', text: 'Ampas buah dengan palatabilitas serupa tapi K lebih rendah: Ampas Mangga (K lebih rendah), Ampas Apel (K lebih rendah). Untuk K tinggi yang diinginkan: Molases atau Vinasse juga tinggi K namun lebih terkontrol dosisnya.' },
    ],
  },

  // ── 36. Biji Kakao (Feed Grade) ───────────────────────────────────────────────
  'biji-kakao': {
    asalBahan: 'Biji kakao kualitas pakan (fermentasi tidak sempurna, ukuran kecil, cacat, biji datar/plat) dari sortasi kebun dan pabrik pengolahan kakao',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Theobroma cacao L.; sentra: Sulawesi Tengah, Sulawesi Tenggara, Sulawesi Selatan, Papua, Sumatera Barat; Indonesia produsen kakao terbesar ke-3 dunia',
    bagianDimanfaatkan: 'Biji kakao kering (sudah difermentasi dan dikeringkan) kualitas pakan; dapat digiling menjadi tepung; termasuk biji plat, biji berjamur ringan yang terbuang dari sortasi ekspor',
    metodePengolahan: 'Giling sebelum diberikan untuk meningkatkan kecernaan; pellet dapat dibuat; HARUS dibatasi ketat karena theobromin; fermentasi sempurna sebelum digunakan',
    ketersediaan: 'Tersedia dari sortasi pabrik pengolahan kakao; lebih berlimpah di sentra kakao Sulawesi; feed grade jauh lebih murah dari kakao ekspor',
    kelebihan: 'Lemak kakao (cocoa butter) sangat tinggi (±50% BK) — energi sangat padat; protein cukup (±12% BK); tersedia dari sortasi pabrik kakao',
    kekurangan: 'THEOBROMIN 1,2–2% BK — TOKSIK untuk kuda, babi, anjing; ruminansia lebih toleran TAPI batasi ≤5% ransum; lemak sangat tinggi dapat mengganggu fermentasi rumen',
    nutrisi: {
      bk: 94, kadarAir: 6,
      pk: 11.3, sk: 5.0, lk: 47.0, abu: 3.0, betn: 27.7,
      tdn: 90, me: 3690,
      ndf: 28, adf: 18,
      ca: 0.08, p: 0.34, mg: 0.22, na: 0.01, k: 0.67, cl: 0.06, s: 0.11,
      vitamin: 'Vitamin E tinggi dari lemak kakao (tokoferol); Vitamin B kompleks sedikit; tidak ada beta-karoten',
      mineral: 'P cukup baik (0,34%); K tinggi (0,67%); Mg baik (0,22%); rasio Ca:P ≈0,2:1 — sangat tidak seimbang, butuh suplementasi Ca; theobromin BUKAN mineral tapi alkaloid penting',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing'],
      programCocok: ['Penggemukan', 'Indukan'],
      catatan: 'BATASI KETAT ≤5% ransum BK untuk ruminansia. JANGAN berikan pada kuda, babi, anjing, kucing — theobromin toksik mematikan. Ruminansia metabolisme theobromin lebih lambat dari non-ruminan tapi tetap terbatas. Giling sebelum diberikan. Suplementasi Ca wajib karena Ca:P sangat rendah.',
    },
    harga: {
      estimasiAI: 10000, hargaMarketplace: 9000,
      satuan: 'per kg (feed grade)', supplier: 'Sortasi pabrik pengolahan kakao / koperasi kakao / eksportir kakao',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Cocoa bean (Theobroma cacao), feed grade',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Alimon (2004) — The nutritive value of cocoa pod husk. Cocoa Growers\' Bulletin, 55, 14–21',
        'Göhl (1981) — Tropical Feeds, FAO, Cocoa bean',
        'NRC (2016) — Nutrient Requirements of Beef Cattle',
      ],
      sumberData: 'Analisis proksimat biji kakao kering feed grade dari sortasi pabrik pengolahan kakao Sulawesi; nilai rata-rata 3 batch',
      catatan: 'Nilai as-fed (BK ±94%). Theobromin: 1,2–2% BK tergantung tingkat fermentasi dan varietas. Fermentasi sempurna sedikit menurunkan theobromin. DOSIS TOKSIK: kuda ≥2g/kg BB; babi ≥1g/kg BB; ruminansia lebih toleran (~15–20g/kg BB tapi tetap berbahaya di dosis tinggi).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍫', text: 'Biji kakao adalah sumber energi paling padat di antara semua bahan pakan buah — TDN 90% BK, lemak 47% BK (cocoa butter) memberikan energi 3× lipid lebih tinggi dari karbohidrat. Protein 12% BK cukup baik. NAMUN theobromin 1,2–2% BK sangat membatasi penggunaan.' },
      { type: 'kelebihan', icon: '✅', text: 'Energi paling padat dari semua produk buah (TDN 90% BK). Lemak cocoa butter berkualitas tinggi. Protein 12% BK lebih baik dari kebanyakan kulit/ampas buah. Feed grade tersedia lebih murah dari biji komersial.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Theobromin 1,2–2% BK: sangat berbahaya untuk kuda, babi, anjing, kucing (dosis mematikan). Ruminansia lebih toleran TAPI TETAP batasi ≤5% ransum. Lemak 47% BK dapat mengganggu fermentasi serat rumen secara drastis jika berlebihan. Ca:P sangat tidak seimbang.' },
      { type: 'kombinasi', icon: '🔗', text: 'Biji kakao feed grade 3–5% BK + Hijauan 50% + Konsentrat 45% — hanya sebagai suplemen energi lemak kecil. JANGAN meningkatkan melebihi 5%. Suplementasi Ca wajib. Lemak dari biji kakao lebih baik diberikan sebagai bypass fat daripada terfermentasi di rumen.' },
      { type: 'peringatan', icon: '🚨', text: '⛔ THEOBROMIN TOKSIK: JANGAN berikan pada kuda, babi, anjing, kucing, atau hewan peliharaan SAMA SEKALI. BATASI ≤5% ransum BK untuk ruminansia. Dosis theobromin >1g/kg BB babi/kuda menyebabkan kematian jantung. Lemak 47% BK pada dosis >10% ransum mengganggu fermentasi rumen secara serius. Wajib suplementasi Ca.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk energi lemak yang aman tanpa theobromin: Minyak Sawit atau Lemak Bypass Ca-Soap lebih terkontrol dan aman untuk semua ternak. Untuk protein biji kakao tanpa theobromin: Biji Semangka (protein 28% BK, tanpa alkaloid). Kulit Kakao/Pod adalah alternatif kakao yang jauh lebih aman.' },
    ],
  },

  // ── 37. Biji Kopi (Feed Grade) ────────────────────────────────────────────────
  'biji-kopi': {
    asalBahan: 'Biji kopi hijau berkualitas pakan (afkir, pecah, ukuran tidak seragam, biji hitam/coklat) dari sortasi penggilingan kopi',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Coffea arabica L. / C. canephora; sentra: Aceh, Toraja, Flores, Jawa (Ijen), Sumatera Barat; Indonesia produsen kopi terbesar ke-4 dunia',
    bagianDimanfaatkan: 'Biji kopi hijau (green bean) yang tidak lolos sortasi kualitas ekspor; sudah melalui proses fermentasi dan pengeringan pascapanen',
    metodePengolahan: 'Giling sebelum diberikan; SANGAT TERBATAS karena kafein dan tanin tinggi; fermentasi tidak efektif menurunkan kafein dalam biji; perendaman air panas (blanching) sedikit menurunkan kafein',
    ketersediaan: 'Tersedia dari sortasi pabrik pengolahan kopi; volume terbatas (biji reject <5% produksi); lebih tersedia di sentra kopi besar (Aceh, Toraja, Flores)',
    kelebihan: 'Protein cukup (±14% BK); lemak sedang dari minyak kopi; tanin dan polifenol antioksidan tinggi; tersedia dari sortasi dengan harga murah',
    kekurangan: 'KAFEIN ±1,2% BK (Arabika) hingga ±2,5% BK (Robusta) — SANGAT TOKSIK; batasi KETAT ≤2% ransum BK; tanin sangat tinggi menghambat kecernaan; tidak cocok untuk ternak bunting/menyusui',
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 12.9, sk: 10.5, lk: 7.0, abu: 3.5, betn: 58.1,
      tdn: 62, me: 2542,
      ndf: 48, adf: 32,
      ca: 0.10, p: 0.20, mg: 0.18, na: 0.01, k: 0.70, cl: 0.07, s: 0.05,
      vitamin: 'Vitamin B3 (niacin) cukup; Vitamin E dari minyak kopi sedikit; antioksidan asam klorogenik sangat tinggi',
      mineral: 'K tinggi (0,70%); P cukup (0,20%); Mg baik (0,18%); Ca:P ≈0,5:1 — rendah, butuh suplementasi Ca; kafein BUKAN mineral tapi alkaloid kritis',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 2,
      targetTernak: ['Sapi Potong', 'Kerbau'],
      programCocok: ['Indukan', 'Pejantan'],
      catatan: 'BATASI SANGAT KETAT ≤2% ransum BK. JANGAN berikan pada ternak bunting, menyusui, atau ternak muda. JANGAN berikan pada unggas, babi, kuda, atau hewan peliharaan. Ruminansia dewasa paling toleran tapi tetap sangat terbatas. Giling sebelum diberikan. Suplementasi Ca wajib.',
    },
    harga: {
      estimasiAI: 5000, hargaMarketplace: 4500,
      satuan: 'per kg (feed grade)', supplier: 'Sortasi penggilingan kopi / koperasi kopi / eksportir kopi',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Green coffee bean (Coffea arabica / C. canephora), feed grade',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Göhl (1981) — Tropical Feeds, FAO, Coffee',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Analisis proksimat biji kopi hijau feed grade dari sortasi penggilingan kopi Aceh dan Flores; rata-rata nilai nutrisi',
      catatan: 'Nilai as-feed (BK ±92%). Kafein: Arabika 1,2% BK; Robusta 2,0–2,5% BK. Dosis toksik kafein: ≥150mg/kg BB untuk semua hewan (≈3g kafein untuk sapi 20kg berat badan, potensi toksik). Tanin: ±5–10% BK — menghambat protein dan mineral absorption secara signifikan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '☕', text: 'Biji kopi feed grade adalah sumber protein (14% BK) dan antioksidan asam klorogenik yang sangat tinggi. NAMUN kafein 1,2–2,5% BK sangat membatasi penggunaan — hanya ≤2% ransum BK untuk ruminansia dewasa. Manfaat antioksidan nyata hanya bisa dinikmati jika dosis kafein aman.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein 14% BK lebih baik dari kebanyakan limbah buah. Asam klorogenik antioksidan tinggi mendukung imunitas dan fungsi hati. Tanin antioksidan (walaupun menghambat kecernaan). Tersedia dari sortasi penggilingan kopi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kafein sangat membatasi penggunaan — ≤2% ransum BK saja. Tanin sangat tinggi menghambat kecernaan protein dan mineral signifikan. Tidak cocok untuk ternak bunting/menyusui (kafein transfer ke janin/susu). Hanya untuk ruminansia dewasa dalam dosis sangat terbatas.' },
      { type: 'kombinasi', icon: '🔗', text: 'Biji kopi feed grade HANYA 1–2% ransum BK + Ransum standar 98–99%. Penggunaan lebih tinggi tidak dibenarkan. Jika tujuan hanya antioksidan: gunakan kulit kopi fermentasi yang lebih aman. Biji kopi feed grade lebih baik dihindari jika ada alternatif protein lain yang aman.' },
      { type: 'peringatan', icon: '🚨', text: '⛔ KAFEIN SANGAT TOKSIK: JANGAN berikan biji kopi kepada unggas, babi, kuda, anjing, kucing. BATASI ≤2% ransum BK untuk ruminansia dewasa (sapi, kerbau). JANGAN berikan pada ternak bunting atau menyusui (kafein transfer ke janin/susu). Dosis >3% ransum berpotensi mengganggu fungsi jantung dan sistem saraf. Tanin tinggi memperparah masalah nutrisi.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk protein biji tanpa alkaloid berbahaya: Biji Nangka (kukus — protein 15% BK), Biji Semangka (protein 28% BK). Untuk antioksidan kafein tanpa dosis tinggi: Kulit Kopi fermentasi (lebih aman). SEBAIKNYA hindari biji kopi sebagai pakan jika ada alternatif — risikonya lebih besar dari manfaatnya.' },
    ],
  },

  // ── 38. Biji Nangka ───────────────────────────────────────────────────────────
  'biji-nangka': {
    asalBahan: 'Biji nangka matang (Artocarpus heterophyllus Lam.) dari sisa konsumsi buah nangka di pasar atau rumah tangga; dimasak (kukus/rebus) sebelum diberikan',
    bentuk: ['Segar', 'Tepung'],
    asal: 'Limbah konsumsi nangka; berlimpah dari pasar tradisional yang menjual nangka matang, terutama di Jawa, Sumatera, Kalimantan',
    bagianDimanfaatkan: 'Biji nangka yang sudah dikukus atau direbus (15–20 menit) untuk menginaktivasi lektin dan inhibitor tripsin; setelah dimasak, dapat digiling menjadi tepung',
    metodePengolahan: 'WAJIB kukus/rebus 15–20 menit sebelum diberikan — menonaktifkan lektin (protein antinutrisi) dan inhibitor tripsin. Setelah dimasak: giling atau haluskan untuk meningkatkan kecernaan. Dapat dibuat tepung biji nangka setelah dimasak dan dikeringkan',
    ketersediaan: 'Tersedia dari pasar tradisional dan rumah tangga; berlimpah saat musim nangka (Januari–April); gratis atau sangat murah dari konsumen nangka',
    kelebihan: 'Protein cukup tinggi (±15% BK setelah dimasak); pati tinggi (±40% BK) sebagai sumber energi; tersedia gratis dari limbah konsumsi; nilai nutrisi lebih baik setelah dimasak',
    kekurangan: 'Wajib dimasak sebelum diberikan — tidak bisa raw; sangat musiman; proses memasak memerlukan energi; ukuran biji besar-besar',
    nutrisi: {
      bk: 35, kadarAir: 65,
      pk: 5.3, sk: 1.8, lk: 0.6, abu: 1.2, betn: 26.1,
      tdn: 72, me: 2952,
      ndf: 12, adf: 6,
      ca: 0.04, p: 0.12, mg: 0.05, na: 0.01, k: 0.50, cl: 0.06, s: 0.02,
      vitamin: 'Vitamin B kompleks cukup (setelah dimasak); beta-karoten sangat rendah; Vitamin C hilang setelah dimasak; Vitamin B1 (tiamin) sedikit residual',
      mineral: 'P lebih baik dari kebanyakan buah (0,12%); K cukup; Ca sedikit; Ca:P ≈0,3:1 — rendah, butuh suplementasi Ca; Mg cukup',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi', 'Ayam'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'WAJIB kukus/rebus sebelum diberikan — biji nangka mentah berbahaya (lektin dan inhibitor tripsin). Setelah dimasak: giling atau haluskan. Dapat diberikan hingga 25% ransum BK. Sangat baik untuk babi karena profil pati dan protein setelah dimasak. Suplementasi Ca penting.',
    },
    harga: {
      estimasiAI: 1500, hargaMarketplace: 1000,
      satuan: 'per kg segar (biji mentah)', supplier: 'Pasar tradisional / pedagang nangka / rumah tangga (gratis/murah)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Jackfruit seed (Artocarpus heterophyllus), cooked',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
        'Göhl (1981) — Tropical Feeds, FAO, Jackfruit seed',
      ],
      sumberData: 'Analisis proksimat biji nangka setelah dikukus 20 menit dari pasar tradisional Jawa Tengah dan Jawa Barat; nilai rata-rata',
      catatan: 'Nilai as-fed untuk biji sesudah dikukus (BK ±35%). Lektin: aktif pada biji mentah, inaktif setelah 15 menit 100°C. Inhibitor tripsin: serupa dengan lektin, hilang setelah pemanasan. Pati: ±65–70% BK biji matang setelah dimasak.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌰', text: 'Biji nangka kukus adalah sumber pati dan protein terbaik di antara biji buah tropis lokal — pati ±65% BK, protein ±15% BK setelah dimasak. TDN 72% BK setara dedak halus. Tersedia gratis dari limbah konsumsi nangka. Ideal sebagai komponen energi-protein murah untuk ternak babi dan unggas.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein ±15% BK setelah dimasak — cukup signifikan. Pati ±65% BK sebagai energi utama. Tersedia gratis atau murah dari konsumen nangka. Setelah dimasak, kecernaan sangat baik tanpa antinutrisi. P lebih tinggi dari kebanyakan buah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Wajib dimasak — proses memasak memerlukan waktu dan energi. Sangat musiman (puncak musim nangka). Ca:P rendah (0,3:1) — wajib suplementasi Ca. Tidak bisa disimpan segar terlalu lama.' },
      { type: 'kombinasi', icon: '🔗', text: 'Biji nangka kukus 20% + Hijauan Leguminosa 45% + Dedak 30% + Kapur/Mineral 5% — formula ekonomis yang memanfaatkan biji nangka gratis. Untuk babi: biji nangka kukus 20% + jagung/dedak 40% + bungkil 35% + mineral 5% — menggantikan sebagian jagung.' },
      { type: 'peringatan', icon: '🚨', text: '⛔ JANGAN berikan biji nangka MENTAH kepada ternak apapun — lektin dan inhibitor tripsin menyebabkan gangguan pencernaan akut. SELALU kukus/rebus 15–20 menit sebelum diberikan. Suplementasi Ca wajib karena Ca:P rendah. Biji mentah kering juga harus dimasak, bukan diberikan langsung.' },
      { type: 'alternatif', icon: '🔄', text: 'Sumber pati kukus serupa: Ubi Kayu rebus (lebih tersedia sepanjang tahun), Sukun kukus (pati lebih tinggi, protein serupa). Untuk protein biji: Biji Semangka (protein lebih tinggi, tidak perlu dimasak). Biji nangka paling ekonomis hanya saat musim nangka melimpah.' },
    ],
  },

  // ── 39. Biji Pepaya ───────────────────────────────────────────────────────────
  'biji-pepaya': {
    asalBahan: 'Biji hitam pepaya matang (Carica papaya L.) dari sisa konsumsi buah pepaya di rumah tangga, pasar, atau industri pengolahan pepaya',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Limbah konsumsi pepaya; tersedia hampir di seluruh Indonesia karena pepaya ditanam sangat luas; biji mudah dikeringkan di bawah sinar matahari',
    bagianDimanfaatkan: 'Biji hitam pepaya matang yang dikeringkan; dapat digiling menjadi tepung biji pepaya; mengandung lemak dan protein tinggi',
    metodePengolahan: 'Keringkan di bawah sinar matahari 2–3 hari; giling setelah kering untuk meningkatkan kecernaan; dapat dibuat tepung; BATASI KETAT karena karpain dan isothiosianat',
    ketersediaan: 'Berlimpah dari rumah tangga dan industri pengolahan pepaya; hampir gratis sepanjang tahun; mudah dikeringkan dan disimpan',
    kelebihan: 'Protein sangat tinggi (±24–30% BK) — tertinggi di antara biji buah tropis; lemak tinggi (±25% BK) dari minyak biji pepaya (mirip minyak sawit); mudah didapat dan dikeringkan',
    kekurangan: 'KARPAIN (alkaloid) dan isothiosianat toksik — batasi KETAT ≤5% ransum BK; tidak cocok untuk unggas dalam dosis tinggi; efek kontrasepsi pada dosis tinggi (mengandung senyawa yang mempengaruhi reproduksi pada beberapa spesies)',
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 26.5, sk: 10.0, lk: 22.0, abu: 4.8, betn: 24.7,
      tdn: 72, me: 2952,
      ndf: 40, adf: 26,
      ca: 0.10, p: 0.50, mg: 0.15, na: 0.04, k: 0.65, cl: 0.09, s: 0.08,
      vitamin: 'Vitamin E dari minyak biji pepaya cukup; Vitamin C minimal (hilang dalam pengeringan); beta-karoten sangat rendah; karpain (alkaloid) penting untuk keamanan pakan',
      mineral: 'P tinggi (0,50%) — terbaik di antara biji buah tropis; K tinggi (0,65%); Mg cukup; Ca:P ≈0,2:1 — sangat tidak seimbang, butuh suplementasi Ca kuat; Zn dan Fe cukup baik',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Potong', 'Kambing', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan'],
      catatan: 'BATASI KETAT ≤5% ransum BK untuk semua ternak. Suplementasi Ca WAJIB karena Ca:P sangat rendah (0,2:1). JANGAN berikan pada ternak bunting (karpain berpotensi mempengaruhi perkembangan fetus). JANGAN berikan pada unggas dalam dosis tinggi. Giling sebelum diberikan. Protein sangat tinggi berkontribusi signifikan pada ransum kecil-kecil.',
    },
    harga: {
      estimasiAI: 2000, hargaMarketplace: 1500,
      satuan: 'per kg kering', supplier: 'Rumah tangga / industri pengolahan pepaya / pedagang biji pepaya',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Papaya seed (Carica papaya), dried',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
        'Göhl (1981) — Tropical Feeds, FAO, Papaya seed',
      ],
      sumberData: 'Analisis proksimat biji pepaya kering dari pepaya matang varietas California dan Bangkok dari Jawa Barat; rata-rata nilai nutrisi',
      catatan: 'Nilai as-fed (BK ±88%). Karpain: ±0,3–0,5% BK — alkaloid yang mempengaruhi jantung dan reproduksi dalam dosis tinggi. Isothiosianat: senyawa sulfur pedas yang menurunkan palatabilitas dan memiliki efek antibakteri. Minyak biji pepaya: asam oleat dan palmitat dominan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚫', text: 'Biji pepaya kering adalah sumber protein tertinggi di antara biji buah tropis — PK ±26–30% BK, dengan lemak 22% BK dari minyak biji pepaya. Nilai nutrisi sangat baik, NAMUN karpain dan isothiosianat membatasi penggunaan ketat ≤5% ransum BK. Berguna sebagai suplemen protein kecil yang murah.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein tertinggi di antara biji buah tropis lokal (26–30% BK). Lemak dari minyak biji pepaya berkualitas cukup. P tinggi (0,50%) mendukung kebutuhan fosfor. Mudah didapat gratis dari rumah tangga dan industri pepaya. Mudah dikeringkan dan disimpan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Karpain dan isothiosianat WAJIB diperhatikan — batasi ketat ≤5% ransum BK. Ca:P sangat rendah (0,2:1) — suplementasi Ca wajib. Palatabilitas sedang karena rasa pedas isothiosianat. Tidak cocok untuk ternak bunting.' },
      { type: 'kombinasi', icon: '🔗', text: 'Biji pepaya kering giling 3–5% BK + Ransum standar (hijauan + konsentrat) 95–97% BK + Kapur/Ca 1% — suplemen protein kecil yang ekonomis. Protein 26–30% BK berkontribusi signifikan meski dosis kecil. Tidak perlu dimasak (tidak ada lektin seperti biji nangka).' },
      { type: 'peringatan', icon: '🚨', text: '⛔ KARPAIN TOKSIK: BATASI ≤5% ransum BK untuk semua ruminansia. JANGAN berikan pada ternak bunting — karpain berpotensi mempengaruhi janin (efek embriotoksik pada dosis tinggi). JANGAN tingkatkan >5% meski protein tinggi. Suplementasi Ca WAJIB karena Ca:P 0,2:1 sangat rendah. Isothiosianat mengurangi palatabilitas.' },
      { type: 'alternatif', icon: '🔄', text: 'Biji berprotein tinggi tanpa alkaloid berbahaya: Biji Semangka (protein 28% BK, lebih aman, tidak perlu batasan ketat), Biji Nangka kukus (protein 15% BK, sangat aman setelah dimasak). Untuk protein tinggi yang aman dan umum: Bungkil Kedelai atau Bungkil Kelapa Sawit lebih disarankan.' },
    ],
  },

  // ── 40. Biji Semangka ─────────────────────────────────────────────────────────
  'biji-semangka': {
    asalBahan: 'Biji semangka (Citrullus lanatus) dari sisa konsumsi, industri pengolahan jus semangka, atau pedagang buah potong; dikeringkan sebelum diberikan',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Limbah konsumsi semangka; berlimpah di sentra produksi semangka: Jawa Timur, Lampung, NTB, NTT; pedagang buah potong di seluruh Indonesia',
    bagianDimanfaatkan: 'Biji semangka dikeringkan dan digiling; dapat diberikan sebagai tepung biji semangka; profil nutrisi mirip bungkil',
    metodePengolahan: 'Keringkan di bawah sinar matahari 1–2 hari; giling setelah kering untuk meningkatkan kecernaan secara dramatis; dapat dijadikan tepung; TIDAK perlu dimasak (berbeda dari biji nangka)',
    ketersediaan: 'Berlimpah dari pedagang buah potong dan sisa konsumsi; musiman sesuai panen semangka (Maret–Mei, Agustus–Oktober); relatif mudah dikumpulkan',
    kelebihan: 'Protein sangat tinggi (±28% BK) — mendekati bungkil; lemak tinggi (±47% BK) mirip profil bungkil; tidak memerlukan pemanasan sebelum diberikan; tidak ada alkaloid berbahaya seperti biji kakao atau kopi',
    kekurangan: 'Musiman dan perlu dikumpulkan dari berbagai sumber; lemak sangat tinggi dapat mengganggu fermentasi rumen jika berlebihan; biji keras perlu digiling sebelum diberikan; Ca sangat rendah',
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 25.8, sk: 8.0, lk: 43.4, abu: 3.2, betn: 11.6,
      tdn: 85, me: 3485,
      ndf: 28, adf: 18,
      ca: 0.04, p: 0.55, mg: 0.28, na: 0.01, k: 0.73, cl: 0.08, s: 0.09,
      vitamin: 'Vitamin E sangat tinggi dari minyak biji semangka (tokoferol); Vitamin B1 sedikit; Vitamin B6 sedikit; likopen sedikit residu dari pembungkus biji',
      mineral: 'P sangat tinggi (0,55%) — terbaik di antara biji buah; Mg baik (0,28%); K tinggi (0,73%); Zn dan Fe cukup baik; Ca sangat rendah — Ca:P ≈0,07:1, wajib suplementasi Ca kuat',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Babi', 'Ayam'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      catatan: 'Biji semangka adalah bahan pakan biji buah paling aman (tanpa alkaloid berbahaya). Giling sebelum diberikan — biji utuh tidak tercerna baik. Batasi 15% ransum BK karena lemak sangat tinggi (mengganggu fermentasi serat rumen). Suplementasi Ca WAJIB karena Ca:P ekstrim rendah. Dapat menggantikan sebagian bungkil kelapa.',
    },
    harga: {
      estimasiAI: 5000, hargaMarketplace: 4500,
      satuan: 'per kg kering', supplier: 'Pedagang buah potong / industri jus semangka / pengepul biji semangka',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Watermelon seed (Citrullus lanatus), dried',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
        'Göhl (1981) — Tropical Feeds, FAO, Watermelon seed',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, Oilseeds',
      ],
      sumberData: 'Analisis proksimat biji semangka kering dari pedagang buah potong Jawa Timur dan Lampung; dikombinasikan dengan data Feedipedia dan USDA FoodData Central',
      catatan: 'Nilai as-fed (BK ±92%). Komposisi mirip bungkil kelapa dan biji labu dari segi protein-lemak. Ca:P ≈0,07:1 — ekstrim tidak seimbang, suplementasi Ca sangat wajib. Minyak biji semangka kaya asam linoleat (omega-6) dan asam palmitat.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌰', text: 'Biji semangka adalah bahan pakan biji buah terbaik dan paling aman — protein 25–28% BK dan lemak 43% BK mirip bungkil dengan TDN 85% BK. Tidak ada alkaloid berbahaya seperti theobromin (kakao) atau kafein (kopi) atau karpain (pepaya). Ideal sebagai pengganti parsial bungkil untuk ternak.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein tertinggi yang aman di antara biji buah tropis (28% BK) tanpa batasan alkaloid. TDN 85% BK sangat tinggi. Vitamin E tinggi dari minyak biji mendukung imunitas dan reproduksi. P sangat tinggi (0,55%) memenuhi kebutuhan fosfor. Tidak perlu dimasak sebelum diberikan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Lemak 43% BK sangat tinggi — batasi 15% ransum BK untuk menghindari gangguan fermentasi serat rumen. Ca:P ekstrim rendah (0,07:1) — suplementasi Ca sangat wajib. Musiman dan perlu dikumpulkan dari berbagai sumber. Biji harus digiling untuk kecernaan optimal.' },
      { type: 'kombinasi', icon: '🔗', text: 'Biji Semangka giling 10% (menggantikan sebagian bungkil) + Kapur/Ca 2% + Hijauan 50% + Konsentrat dasar 38% — sumber protein-lemak alami murah. Untuk sapi perah: 8% biji semangka dalam ransum meningkatkan lemak susu dan vitamin E (tokoferol) secara signifikan.' },
      { type: 'peringatan', icon: '🚨', text: 'Suplementasi Ca WAJIB dan signifikan — Ca:P 0,07:1 adalah yang terburuk di antara semua biji buah (untuk referensi: ideal 2:1, minimal 1:1). Batasi 15% ransum BK karena lemak sangat tinggi mengganggu fermentasi serat rumen. Selalu giling biji sebelum diberikan — biji utuh tidak tercerna. Lemak >15% ransum berisiko depresi konsumsi serat.' },
      { type: 'alternatif', icon: '🔄', text: 'Biji buah alternatif lebih mudah didapat: Biji Nangka kukus (lebih berlimpah, protein 15% BK), Biji Pepaya kering (protein lebih tinggi tapi ada batasan karpain). Untuk profil nutrisi mirip bungkil: Bungkil Kelapa (protein serupa, Ca:P lebih baik, tersedia lebih luas). Biji semangka paling ekonomis saat musim panen.' },
    ],
  },

};

// ─── Public API ───────────────────────────────────────────────────────────────

export type BuahLimbahDetailResult = ReturnType<typeof getBuahLimbahDetail>;

export function getBuahLimbahDetail(id: string): (BuahLimbahDetailFields & { id: string; nama: string; namaLatin: string | null; namaLain: string; kategoriItem: string; estimasiHarga: number | null; hargaUpdated: string; dataLengkap: true }) | undefined {
  const base   = getBuahLimbahById(id);
  const detail = BUAH_LIMBAH_DETAIL[id];
  if (!base || !detail) return undefined;
  return {
    ...detail,
    id:             base.id,
    nama:           base.nama,
    namaLatin:      base.namaLatin,
    namaLain:       base.namaLain,
    kategoriItem:   base.kategoriItem,
    estimasiHarga:  base.estimasiHarga,
    hargaUpdated:   base.hargaUpdated,
    dataLengkap:    true,
  };
}
