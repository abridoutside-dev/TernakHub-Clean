// ─── MP-019 — Detail Data: Kelapa ─────────────────────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for every Kelapa item.
// All proximate values (PK, SK, LK, Abu, BETN), TDN, ME, NDF, ADF, and minerals
// are expressed on Dry Matter (Bahan Kering) basis unless noted.
//
// Primary sources:
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi
//     Pakan untuk Indonesia. Gadjah Mada University Press.
//   • Feedipedia (2023). INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.
//   • NRC (2016). Nutrient Requirements of Beef Cattle, 8th Rev. Ed.
//   • FAO (2018). Feed Resources for Tropical Ruminants.
//   • Göhl, B. (1981). Tropical Feeds. FAO Animal Production and Health Series No. 12.

import { getKelapaById, type KelapaItem } from './kelapaData';
import type {
  NutrisiData,
  PenggunaanData,
  HargaData,
  ReferensiData,
  AiInsightItem,
  BentukBahan,
} from './jagungData';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KelapaDetailFields {
  deskripsi: string;
  alias: string;
  asal: string;
  habitat: string;
  bagianDimanfaatkan: string;
  metodePengolahan: string;
  ketersediaan: string;
  kelebihan: string;
  kekurangan: string;
  bentuk: BentukBahan[];
  nutrisi: NutrisiData;
  penggunaan: PenggunaanData;
  harga: HargaData;
  referensi: ReferensiData;
  aiInsight: AiInsightItem[];
}

export type KelapaDetailItem = KelapaItem & KelapaDetailFields;

// ─── Detail Registry ──────────────────────────────────────────────────────────

const KELAPA_DETAIL: Record<string, KelapaDetailFields> = {

  // ── 1. Kelapa Utuh ──────────────────────────────────────────────────────────
  'kelapa-utuh': {
    deskripsi: 'Buah kelapa matang secara keseluruhan mencakup sabut, tempurung, kulit ari, daging, dan air kelapa. Jarang diberikan utuh langsung kepada ternak; umumnya digunakan sebagai acuan komposit atau diberikan dengan cara dibelah agar ternak mengkonsumsi daging dan air kelapa.',
    alias: 'Whole Coconut, Coconut, Nyiur, Kalapa',
    asal: 'Berasal dari tanaman kelapa (Cocos nucifera) yang tersebar di seluruh wilayah tropis Indonesia, khususnya Sulawesi, Maluku, Sumatera, Jawa, dan Kalimantan',
    habitat: 'Dataran rendah tropis pesisir 0–600 mdpl; curah hujan 1.500–2.500 mm/tahun; suhu 25–35°C; tumbuh optimal di tanah berpasir berdrainase baik',
    bagianDimanfaatkan: 'Daging buah (endosperm), air kelapa, sabut, tempurung; masing-masing memiliki nilai pakan berbeda',
    metodePengolahan: 'Dibelah dua agar ternak dapat menjangkau daging dan air; daging dapat diparut atau dicacah; diberikan segar segera setelah dibelah',
    ketersediaan: 'Tersedia sepanjang tahun; panen terjadi setiap 3–4 bulan di perkebunan rakyat; harga relatif stabil',
    kelebihan: 'Sumber energi tinggi (lemak lauric); palatabilitas sangat baik; mengandung air kelapa yang membantu hidrasi ternak; tersedia melimpah di sentra kelapa',
    kekurangan: 'Protein rendah; nilai pakan sangat bervariasi tergantung proporsi bagian yang dikonsumsi; tempurung dan sabut tidak bernilai pakan; tidak praktis untuk pemberian dalam jumlah besar',
    bentuk: ['Segar'],
    nutrisi: {
      bk: 50, kadarAir: 50,
      pk: 4.5, sk: 10.0, lk: 32.0, abu: 1.8, betn: 51.7,
      tdn: 85, me: 3350,
      ndf: 30.0, adf: 18.0,
      ca: 0.02, p: 0.10, mg: 0.08, na: 0.03, k: 0.30, cl: 0.04, s: 0.06,
      vitamin: 'Vitamin E (tocotrienol ±15 mg/kg BK); sedikit vitamin C; tidak ada vitamin larut air signifikan',
      mineral: 'Nilai bervariasi tergantung proporsi bagian yang dikonsumsi (daging vs. sabut vs. tempurung). Semua nilai atas dasar BK komposit seluruh buah.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing', 'Babi'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      catatan: 'Belah dua sebelum diberikan agar ternak dapat mengakses isi kelapa. Batasi karena kandungan lemak jenuh tinggi — berikan maksimal 10–15% dari BK ransum. Lepaskan tempurung jika memungkinkan.',
    },
    harga: {
      estimasiAI: 3500, hargaMarketplace: 3200,
      satuan: 'per butir (~1,5–2 kg)',
      supplier: 'Petani kelapa lokal / Pengepul buah kelapa / Pasar tradisional',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Feedipedia (2023) — Coconut (Cocos nucifera), INRA-CIRAD-AFZ-FAO',
        'Göhl, B. (1981) — Tropical Feeds, FAO Animal Production Series No. 12',
      ],
      sumberData: 'Nilai komposit berdasarkan proporsi estimasi bagian buah utuh; primer dari Feedipedia dan Hartadi et al.',
      catatan: 'Nilai nutrisi kelapa utuh sangat bergantung pada proporsi daging, air, sabut, dan tempurung yang dikonsumsi ternak. Gunakan data daging kelapa segar untuk estimasi nilai pakan lebih akurat.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🥥', text: 'Kelapa utuh memberikan kombinasi energi lemak tinggi (TDN ±85%) dan hidrasi dari air kelapa — cocok sebagai pakan suplemen untuk sapi di musim kemarau atau ternak yang kehilangan nafsu makan.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas sangat baik — sapi dan kambing sangat menyukai daging kelapa segar. Lemak lauric (C12:0) memberikan efek antimikroba alami yang mendukung kesehatan saluran pencernaan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein sangat rendah (±4,5% BK) dan bervariasi. Sabut dan tempurung tidak bernilai pakan signifikan namun ikut dihitung jika diberikan utuh. Perlu sumber protein pelengkap.' },
      { type: 'peringatan', icon: '🚨', text: 'Lemak jenuh tinggi — jangan melebihi 15% BK ransum. Kelebihan lemak jenuh menghambat fermentasi rumen dan dapat menurunkan kecernaan serat. Selalu padukan dengan hijauan serat tinggi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi optimal: Rumput + Leguminosa (protein) + Kelapa Utuh (energi lemak). Tambahkan Molases atau Dedak Padi sebagai sumber karbohidrat terfermentasi untuk menyeimbangkan energi.' },
      { type: 'alternatif', icon: '🔄', text: 'Lebih praktis menggunakan Bungkil Kelapa (protein + energi lebih terukur) atau Ampas Kelapa (lebih murah, serat tinggi). Kelapa utuh cocok saat stok berlimpah dan harga murah di sentra kelapa.' },
    ],
  },

  // ── 2. Daging Kelapa Segar ───────────────────────────────────────────────────
  'daging-kelapa-segar': {
    deskripsi: 'Bagian putih dalam (endosperm padat) dari buah kelapa matang sebelum diproses lebih lanjut. Kaya lemak lauric acid dan memberikan energi tinggi. Dapat diberikan langsung atau diparut terlebih dahulu.',
    alias: 'Fresh Coconut Meat, Coconut Flesh, Kelapa Parut Segar, Isi Kelapa',
    asal: 'Endosperm padat buah kelapa (Cocos nucifera) matang penuh; dipanen dari buah berumur 11–12 bulan',
    habitat: 'Dataran rendah tropis 0–600 mdpl; sentra produksi di Sulawesi Utara, Maluku, Sumatera Selatan, Jawa Barat, dan Riau',
    bagianDimanfaatkan: 'Lapisan putih daging buah (endosperm solid) setelah tempurung dan sabut dilepas',
    metodePengolahan: 'Buah dibelah, daging dikeruk dari tempurung; dapat diberikan langsung dalam potongan atau diparut; diberikan segar dalam 24 jam karena cepat tengik',
    ketersediaan: 'Tersedia sepanjang tahun; paling berlimpah di sentra perkebunan kelapa; sisa pemarutan santan di industri kuliner juga tersedia sebagai ampas kelapa',
    kelebihan: 'Palatabilitas sangat baik; energi lemak tinggi (TDN ±89%); mengandung lauric acid antimikroba; tidak memerlukan pengolahan khusus; sumber MCT (medium chain triglyceride) alami',
    kekurangan: 'Kadar air tinggi (±50–55%) — cepat basi; protein rendah (±5,6% BK); harga relatif tinggi dibanding bungkil kelapa; tidak stabil untuk penyimpanan jangka panjang',
    bentuk: ['Segar'],
    nutrisi: {
      bk: 47, kadarAir: 53,
      pk: 5.6, sk: 4.5, lk: 34.0, abu: 1.5, betn: 54.4,
      tdn: 89, me: 3450,
      ndf: 22.0, adf: 12.0,
      ca: 0.02, p: 0.12, mg: 0.09, na: 0.03, k: 0.32, cl: 0.04, s: 0.07,
      vitamin: 'Vitamin E (tocotrienol ±18 mg/kg BK); Vitamin K kecil; sangat sedikit vitamin B',
      mineral: 'Rendah Ca dan P; kaya lemak lauric (C12:0 ±48% dari total lemak). Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Babi', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower'],
      catatan: 'Berikan segar maksimal 24 jam setelah diparut. Batasi ≤20% BK ransum karena lemak jenuh tinggi. Untuk sapi perah, ≤10% untuk menghindari penurunan kadar protein susu. Selalu sertakan hijauan serat tinggi.',
    },
    harga: {
      estimasiAI: 4500, hargaMarketplace: 4200,
      satuan: 'per kg daging segar',
      supplier: 'Penjual kelapa pasar tradisional / Pengolah santan skala rumah tangga',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Coconut, fresh meat, INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Göhl, B. (1981) — Tropical Feeds, FAO',
      ],
      sumberData: 'Rata-rata Feedipedia dan Hartadi et al. untuk daging kelapa segar tropis',
      catatan: 'Kadar lemak sangat bervariasi (30–45% BK) tergantung varietas kelapa dan kematangan buah. Nilai tersebut adalah rata-rata kelapa varietas lokal Indonesia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Daging kelapa segar adalah sumber energi lemak tercepat tersedia — TDN 89% dengan ME 3.450 kcal/kg BK menjadikannya salah satu bahan pakan energi tertinggi dari komoditas lokal.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas sangat baik — sangat disukai sapi dan kambing. Lemak lauric (C12:0 ±48%) memiliki efek antimikroba ringan yang mendukung kesehatan saluran pencernaan ternak muda.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein hanya 5,6% BK — sangat defisien; harus selalu dikombinasikan dengan sumber protein tinggi. Mudah tengik karena kadar air tinggi — gunakan dalam 24 jam setelah diparut.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan melebihi 20% BK ransum. Pada sapi perah, lemak jenuh berlebihan dapat menurunkan kadar protein susu. Pada ruminansia, lemak >6% ransum menghambat fermentasi selulosa di rumen.' },
      { type: 'kombinasi', icon: '🔗', text: 'Pasangkan dengan Bungkil Kedelai atau Bungkil Kelapa (protein), Dedak Padi (serat + vitamin B), dan Mineral Premix (Ca, P). Kombinasi daging kelapa + hijauan + bungkil membentuk ransum berimbang.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika tidak tersedia segar: Kopra (setara namun lebih stabil) atau Bungkil Kelapa (lebih murah, protein lebih tinggi). Ampas Kelapa lebih murah namun energi dan lemak lebih rendah.' },
    ],
  },

  // ── 3. Air Kelapa ────────────────────────────────────────────────────────────
  'air-kelapa': {
    deskripsi: 'Cairan endosperm cair dari buah kelapa muda hingga matang. Komposisi utama adalah air, gula sederhana, dan elektrolit. Digunakan sebagai suplemen minuman, campuran ransum cair, atau pembawa obat untuk ternak yang sakit.',
    alias: 'Coconut Water, Coconut Liquid Endosperm, Air Nira Kelapa, Santan Muda',
    asal: 'Cairan dalam rongga buah kelapa (Cocos nucifera) muda berumur 6–9 bulan; volume terbesar pada kelapa hijau muda',
    habitat: 'Identik dengan tanaman kelapa — dataran rendah tropis 0–600 mdpl; tersedia di seluruh sentra perkebunan kelapa Indonesia',
    bagianDimanfaatkan: 'Cairan endosperm cair yang dikeluarkan saat buah dibelah atau dilubang',
    metodePengolahan: 'Diberikan langsung; dapat dicampur dengan dedak atau konsentrat untuk meningkatkan palatabilitas ransum kering; sisa limbah industri air kelapa kemasan juga dapat dimanfaatkan',
    ketersediaan: 'Tersedia dari sisa pengolahan industri santan, minuman air kelapa kemasan, dan pedagang kelapa muda; volume melimpah di sentra industri kelapa',
    kelebihan: 'Sumber elektrolit alami (kalium tinggi); mengandung gula mudah tercerna; palatabilitas baik; membantu rehidrasi ternak yang dehidrasi; mengandung cytokinins yang mendukung pertumbuhan sel',
    kekurangan: 'Nilai nutrisi sangat rendah (BK hanya 5–6%); protein dan lemak hampir tidak ada; cepat basi — fermentasi dalam 4–8 jam pada suhu tropis; biaya pengangkutan relatif tinggi vs. nilai nutrisinya',
    bentuk: ['Cair', 'Segar'],
    nutrisi: {
      bk: 5.5, kadarAir: 94.5,
      pk: 0.5, sk: 0.0, lk: 0.5, abu: 5.5, betn: 93.5,
      tdn: 75, me: 2800,
      ndf: 0.0, adf: 0.0,
      ca: 0.03, p: 0.06, mg: 0.06, na: 0.17, k: 1.50, cl: 0.20, s: 0.04,
      vitamin: 'Vitamin C kecil (2,4 mg/100 ml); Vitamin B kompleks sangat kecil; Cytokinins (zeatin)',
      mineral: 'Sangat kaya Kalium (K 1,5% BK — tertinggi di antara bahan pakan) dan Natrium. Nilai di atas dihitung pada BK 5,5%. Nilai atas dasar bahan segar: K ~0,25%, Na ~0,03%.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Unggas'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      catatan: 'Gunakan dalam 4–6 jam setelah diambil dari buah. Efektif sebagai campuran ransum basah untuk ternak sakit atau kurang nafsu makan. Nilai nutrisinya sangat terbatas — manfaat utama adalah hidrasi dan elektrolit.',
    },
    harga: {
      estimasiAI: 1000, hargaMarketplace: 800,
      satuan: 'per liter',
      supplier: 'Pedagang kelapa muda / Industri minuman air kelapa kemasan (limbah) / Pasar tradisional',
      updatedAt: '05 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Coconut water, INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Yong, J.W.H. et al. (2009) — The Chemical Composition and Biological Properties of Coconut Water, Molecules 14(12)',
      ],
      sumberData: 'Analisis rata-rata Feedipedia untuk air kelapa segar; nilai mineral dari Yong et al. (2009)',
      catatan: 'Komposisi bervariasi signifikan antara kelapa muda (kadar gula lebih tinggi) dan kelapa tua (kadar gula lebih rendah). Nilai atas dasar BK sangat tinggi karena kadar air sangat tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '💧', text: 'Air kelapa adalah suplemen elektrolit alami terbaik — kalium (K) mencapai 1,5% BK, jauh melebihi kebanyakan bahan pakan. Sangat efektif untuk rehidrasi ternak pasca-transportasi atau saat sakit diare.' },
      { type: 'kelebihan', icon: '✅', text: 'Gratis atau sangat murah di sentra kelapa. Mengandung gula sederhana yang langsung diserap. Membantu meningkatkan palatabilitas ransum kering ketika dicampurkan sebagai basah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Nilai nutrisi sangat rendah (BK hanya 5,5%). Tidak bisa diandalkan sebagai pakan utama — gunakan hanya sebagai suplemen rehidrasi atau palatabilitas enhancer. Cepat fermentasi pada suhu tropis.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan simpan lebih dari 6 jam pada suhu ruang — fermentasi menghasilkan alkohol yang berbahaya jika dikonsumsi ternak dalam jumlah besar. Berikan segera setelah diambil dari buah.' },
      { type: 'kombinasi', icon: '🔗', text: 'Campurkan dengan dedak padi, konsentrat, atau bungkil kelapa untuk membuat ransum basah yang palatabel. Sangat baik digunakan sebagai pelarut suplemen mineral atau obat cacing.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk rehidrasi: Air minum biasa + garam + gula sudah cukup. Air kelapa memiliki nilai lebih karena kandungan elektrolit kompleksnya, namun tidak selalu tersedia di luar sentra kelapa.' },
    ],
  },

  // ── 4. Nira Kelapa ────────────────────────────────────────────────────────────
  'nira-kelapa': {
    deskripsi: 'Getah manis yang disadap dari tandan bunga kelapa betina sebelum berkembang menjadi buah. Kaya gula sederhana (sukrosa, glukosa, fruktosa) dengan kadar Brix 12–17%. Dapat diberikan segar atau setelah fermentasi ringan.',
    alias: 'Coconut Sap, Palm Sap, Coconut Toddy (fresh), Gula Aren Muda, Legen',
    asal: 'Getah tandan bunga kelapa (Cocos nucifera) yang disadap; sentra penyadapan di Sulawesi Tenggara, Jawa, dan Nusa Tenggara',
    habitat: 'Pohon kelapa dewasa berumur >5 tahun di dataran rendah tropis; penyadapan dilakukan dini hari sebelum matahari terbit untuk kualitas terbaik',
    bagianDimanfaatkan: 'Getah (sap) dari tandan bunga betina yang dipotong dan ditampung dalam wadah; disadap 2× sehari (pagi dan sore)',
    metodePengolahan: 'Diberikan segar langsung atau dicampur konsentrat; dapat dibuat menjadi gula kelapa (dipekatkan), atau dipakai segar dalam 4 jam. Fermentasi ringan (tuak muda) masih dapat diberikan.',
    ketersediaan: 'Tersedia dari sentra penyadapan kelapa; musiman dan tergantung ketersediaan pohon produktif; pasokan terbatas dibanding produk kelapa lainnya',
    kelebihan: 'Gula terlarut sangat tinggi (Brix 12–17%); palatabilitas luar biasa; sumber energi cepat; mengandung mineral elektrolit dan asam amino kecil; efektif meningkatkan konsumsi ransum',
    kekurangan: 'Kadar BK rendah (15–18%); cepat fermentasi dalam 4–6 jam; protein dan lemak sangat rendah; ketersediaan terbatas; harga lebih mahal per unit nutrisi dibanding molases',
    bentuk: ['Cair', 'Segar'],
    nutrisi: {
      bk: 16, kadarAir: 84,
      pk: 0.5, sk: 0.0, lk: 0.3, abu: 4.5, betn: 94.7,
      tdn: 80, me: 3100,
      ndf: 0.0, adf: 0.0,
      ca: 0.05, p: 0.04, mg: 0.10, na: 0.15, k: 1.20, cl: 0.18, s: 0.03,
      vitamin: 'Vitamin B kompleks (thiamin, riboflavin, niasin) dalam jumlah kecil; vitamin C kecil',
      mineral: 'Kaya Kalium dan Kalsium; lebih kaya mineral dibanding air kelapa. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Menyusui', 'Grower'],
      catatan: 'Gunakan dalam 4 jam setelah penyadapan. Efektif sebagai palatabilitas enhancer dan sumber energi cepat. Batasi 25% BK ransum. Jangan berikan nira yang sudah masam (alkohol >2%) karena dapat menyebabkan gangguan pencernaan.',
    },
    harga: {
      estimasiAI: 3000, hargaMarketplace: 2800,
      satuan: 'per liter',
      supplier: 'Petani penyadap kelapa / Pengepul nira lokal',
      updatedAt: '01 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Coconut sap/toddy, INRA-CIRAD-AFZ-FAO',
        'Mandal, S.C. et al. (2011) — Nutritive Value of Coconut Toddy as Feed for Livestock, Indian J. Animal Sciences',
        'FAO (2018) — Non-Wood Forest Products: Coconut Products',
      ],
      sumberData: 'Feedipedia dan Mandal et al. (2011); Brix dan mineral dari analisis lapangan Sulawesi Tenggara',
      catatan: 'Komposisi gula bervariasi tergantung waktu penyadapan dan varietas kelapa. Semakin pagi disadap, semakin tinggi kadar sukrosa.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍯', text: 'Nira kelapa adalah palatabilitas enhancer paling kuat dari kategori kelapa — gula terlarut Brix 12–17% membuat ternak yang sulit makan (sakit, pasca-lahir, atau stres transportasi) langsung tertarik mengonsumsi ransum.' },
      { type: 'kelebihan', icon: '✅', text: 'Energi cepat tersedia (TDN 80%, gula langsung diserap rumen). Lebih kaya mineral (K, Mg, Ca) dibanding molases dalam proporsi yang lebih seimbang. Rasa manis alami.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Sangat mudah fermentasi — harus diberikan dalam 4 jam. BK rendah (16%) berarti nilai nutrisi per liter terbatas. Ketersediaan tidak stabil dan tergantung musim penyadapan.' },
      { type: 'peringatan', icon: '🚨', text: 'Nira yang sudah berfermentasi menjadi tuak mengandung alkohol yang bisa menyebabkan ataksia dan gangguan pencernaan pada ternak. Selalu periksa rasa dan aroma sebelum memberikan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Campurkan dengan dedak padi + bungkil kelapa + mineral premix untuk ransum basah berenergi tinggi. Sangat efektif digunakan sebagai "starter" pakan baru untuk ternak yang baru dipindahkan ke sistem intensif.' },
      { type: 'alternatif', icon: '🔄', text: 'Molases adalah alternatif praktis dengan ketersediaan lebih stabil, harga lebih murah, dan shelf-life jauh lebih lama. Untuk palatabilitas enhancer skala besar, molases lebih dianjurkan.' },
    ],
  },

  // ── 5. Kopra ──────────────────────────────────────────────────────────────────
  'kopra': {
    deskripsi: 'Daging kelapa yang telah dikeringkan menggunakan panas matahari, asap, atau oven hingga kadar air ≤6%. Merupakan komoditas ekspor utama Indonesia dan bahan baku utama minyak kelapa dan bungkil kelapa.',
    alias: 'Copra, Dried Coconut Meat, Kelapa Kering',
    asal: 'Daging kelapa matang berumur 11–12 bulan yang dikeringkan; diproduksi di sentra kelapa seluruh Indonesia',
    habitat: 'Tanaman kelapa dataran rendah tropis; kualitas kopra terbaik dari kelapa yang ditanam di tanah berpasir berdrainase baik',
    bagianDimanfaatkan: 'Daging buah (endosperm padat) setelah air dikeluarkan dan dikeringkan',
    metodePengolahan: 'Kelapa dibelah, air dibuang, daging dikeringkan 3–4 hari di bawah sinar matahari atau 18–24 jam di oven kopra; kadar air diturunkan dari ±50% menjadi ≤6%',
    ketersediaan: 'Tersedia sepanjang tahun dengan stok relatif stabil; dapat disimpan 3–6 bulan pada kondisi kering; diperdagangkan luas di Indonesia',
    kelebihan: 'Energi lemak sangat tinggi (TDN ±90%); dapat disimpan lama; mudah digiling menjadi tepung; sumber bahan baku minyak kelapa dan bungkil kelapa berkualitas',
    kekurangan: 'Protein rendah (7–9% BK); harga lebih tinggi dari ampas kelapa; lemak jenuh sangat tinggi (≥90% dari total lemak) — berikan terbatas; rentan kontaminasi jamur aflatoksin jika disimpan tidak benar',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 94, kadarAir: 6,
      pk: 8.0, sk: 13.5, lk: 60.0, abu: 1.8, betn: 16.7,
      tdn: 90, me: 3600,
      ndf: 20.0, adf: 15.0,
      ca: 0.02, p: 0.15, mg: 0.10, na: 0.03, k: 0.38, cl: 0.05, s: 0.08,
      vitamin: 'Vitamin E (tocotrienol ±25 mg/kg BK); Vitamin K kecil; defisien vitamin B larut air',
      mineral: 'Rendah Ca dan P; profil lemak didominasi asam laurat (C12:0 ±48%), miristat (C14:0), dan palmitat (C16:0). Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Kambing', 'Babi'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      catatan: 'Giling sebelum diberikan untuk meningkatkan aksesibilitas lemak. Batasi ≤15% BK ransum. Periksa kadar aflatoksin jika kopra sudah disimpan >3 bulan. Selalu sertakan sumber protein dan mineral Ca.',
    },
    harga: {
      estimasiAI: 7000, hargaMarketplace: 6800,
      satuan: 'per kg',
      supplier: 'Pedagang kopra / Pabrik minyak kelapa / Koperasi petani kelapa',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Feedipedia (2023) — Copra (dried coconut), INRA-CIRAD-AFZ-FAO',
        'NRC (2016) — Nutrient Requirements of Dairy Cattle, 7th Ed.',
      ],
      sumberData: 'Hartadi et al. dan Feedipedia untuk kopra kering standar Indonesia',
      catatan: 'Nilai lemak sangat bervariasi (55–65% BK) tergantung metode pengeringan dan kualitas buah. Kopra asap cenderung memiliki kontaminan polisiklik aromatik — hindari untuk pakan ternak.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Kopra adalah konsentrat energi lemak tertinggi dari produk kelapa padat — TDN 90%, ME 3.600 kcal/kg BK. Sangat efektif untuk program penggemukan intensif atau meningkatkan produksi susu lemak.' },
      { type: 'kelebihan', icon: '✅', text: 'Dapat disimpan 3–6 bulan jika kering dan terhindar kelembaban. Mudah digiling menjadi tepung. Lemak MCT (lauric + miristat) lebih cepat diserap dibanding lemak rantai panjang.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein rendah (8% BK); harus dikombinasikan dengan sumber protein. Rentan aflatoksin — periksa sebelum digunakan. Lemak jenuh tinggi membatasi penggunaannya pada ruminansia.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan kopra yang berbau apek atau berjamur. Aflatoksin dari kopra bisa masuk ke susu ternak perah. Batas penggunaan maksimal 15% BK untuk menghindari depresi fermentasi rumen.' },
      { type: 'kombinasi', icon: '🔗', text: 'Optimal dikombinasikan dengan Bungkil Kedelai (protein + ADIN rendah) + Dedak Padi (serat + B vitamin) + Premix mineral. Kopra + bungkil kelapa + hijauan = ransum berimbang untuk penggemukan sapi.' },
      { type: 'alternatif', icon: '🔄', text: 'Bungkil Kelapa lebih ekonomis dan protein lebih tinggi. Minyak Kelapa (feed grade) lebih efisien sebagai sumber energi lemak. Kopra cocok jika bungkil belum tersedia di lokasi.' },
    ],
  },

  // ── 6. Ampas Kelapa ───────────────────────────────────────────────────────────
  'ampas-kelapa': {
    deskripsi: 'Sisa perasan daging kelapa parut setelah santan diambil. Mengandung serat tinggi dengan lemak residu dari minyak yang tidak terperas sempurna. Tersedia berlimpah dari industri santan dan pengolahan kuliner.',
    alias: 'Coconut Press Cake, Coconut Residue, Ampas Santan, Coconut Pulp, Spent Coconut',
    asal: 'Sisa perasan parutan daging kelapa (Cocos nucifera) di rumah tangga, industri santan kemasan, dan pabrik minyak kelapa tradisional',
    habitat: 'Tersedia di seluruh Indonesia sebagai limbah industri kuliner dan pabrik santan; sentra terbesar di Jawa, Sulawesi, dan Sumatera',
    bagianDimanfaatkan: 'Padatan serat daging kelapa setelah santan (lemak + air) diekstrak secara mekanis',
    metodePengolahan: 'Dapat diberikan segar (dalam 12 jam) atau dikeringkan terlebih dahulu untuk memperpanjang umur simpan. Pengeringan di bawah sinar matahari 1–2 hari menurunkan kadar air dari ±50% menjadi ±10%',
    ketersediaan: 'Sangat berlimpah — tersedia setiap hari dari industri pengolahan santan dan kuliner; harga sangat murah; dapat diperoleh gratis dari produsen santan skala kecil',
    kelebihan: 'Harga sangat murah atau gratis; sumber serat kasar yang baik untuk ruminansia; lemak residu masih memberikan kontribusi energi; mudah diperoleh di seluruh Indonesia; palatabilitas cukup baik',
    kekurangan: 'BK bervariasi dan kadar air tinggi jika segar (±50%); serat sangat tinggi (NDF ±65%) dengan kecernaan rendah; protein rendah (5–7% BK); cepat basi (12–24 jam); perlu pengeringan untuk penyimpanan',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 35, kadarAir: 65,
      pk: 6.0, sk: 14.0, lk: 12.0, abu: 2.0, betn: 66.0,
      tdn: 68, me: 2700,
      ndf: 65.0, adf: 35.0,
      ca: 0.03, p: 0.10, mg: 0.08, na: 0.03, k: 0.28, cl: 0.04, s: 0.05,
      vitamin: 'Sedikit vitamin E residu; sangat rendah vitamin B larut air',
      mineral: 'Profil mineral mirip daging kelapa namun lebih encer karena air tersisa dari proses pemerasan. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Kerbau', 'Babi'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      catatan: 'Berikan segar dalam 12 jam atau keringkan untuk penyimpanan. Batasi ≤30% BK ransum karena serat sangat tinggi dapat menurunkan kecernaan keseluruhan ransum. Kombinasikan dengan sumber protein dan mineral.',
    },
    harga: {
      estimasiAI: 1500, hargaMarketplace: 1200,
      satuan: 'per kg basah',
      supplier: 'Pengolah santan rumahan / Pabrik santan kemasan / Pedagang pasar',
      updatedAt: '06 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Feedipedia (2023) — Coconut oil meal/expeller, wet process (ampas basah), INRA-CIRAD-AFZ-FAO',
        'Göhl, B. (1981) — Tropical Feeds, FAO Animal Production Series No. 12',
      ],
      sumberData: 'Hartadi et al. untuk ampas kelapa segar; nilai BK bervariasi 30–40% tergantung metode pemerasan',
      catatan: 'Nilai lemak residu sangat bervariasi (8–18% BK) tergantung efisiensi pemerasan. Pemerasan mekanis (press) menyisakan lebih banyak lemak dibanding pemerasan manual.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '♻️', text: 'Ampas kelapa adalah roughage berlemak yang unik — serat NDF 65% memberikan bulk rumen yang baik, sementara lemak residu (12% BK) menambah kontribusi energi melebihi kebanyakan limbah pertanian.' },
      { type: 'kelebihan', icon: '✅', text: 'Sangat murah (bahkan gratis dari pedagang santan). Palatabilitas baik — ternak suka aroma kelapa. Tersedia setiap hari di hampir seluruh pasar tradisional Indonesia.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Cepat basi — maksimal 12 jam dalam kondisi segar di iklim tropis. BK rendah (35%) berarti perlu diberikan dalam volume besar untuk memenuhi kebutuhan nutrisi. Protein sangat rendah.' },
      { type: 'peringatan', icon: '🚨', text: 'Ampas kelapa basi (berjamur atau berbau asam) mengandung mikotoksin yang berbahaya. Selalu periksa kesegaran sebelum diberikan. Jangan berikan lebih dari 30% ransum karena serat sangat tinggi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Terbaik dikombinasikan dengan Bungkil Kelapa (protein) + Molases (energi fermentable) + Hijauan + Mineral. Ampas kelapa + bungkil kelapa + molases = ransum "all kelapa" yang ekonomis.' },
      { type: 'alternatif', icon: '🔄', text: 'Ampas kelapa kering (BK ±90%) lebih praktis untuk transportasi dan penyimpanan namun lebih mahal. Bungkil Kelapa memiliki nilai nutrisi lebih tinggi namun harga berbeda.' },
    ],
  },

  // ── 7. Kulit Ari Kelapa ───────────────────────────────────────────────────────
  'kulit-ari-kelapa': {
    deskripsi: 'Lapisan tipis berwarna coklat yang melapisi permukaan daging kelapa (antara daging putih dan tempurung). Mengandung tanin dan polifenol sebagai antinutrisi alami. Digunakan dalam jumlah sangat terbatas sebagai sumber serat.',
    alias: 'Testa Kelapa, Coconut Testa, Brown Skin Coconut, Kulit Dalam Kelapa',
    asal: 'Lapisan seed coat (testa) buah kelapa matang; terlepas saat daging kelapa dikupas dari tempurung',
    habitat: 'Tersedia dari semua sentra pengolahan kelapa; biasanya dibuang sebagai limbah pengupasan daging',
    bagianDimanfaatkan: 'Lapisan epidermis coklat tipis (±0,5–1 mm) antara daging dan tempurung',
    metodePengolahan: 'Dikupas dari daging kelapa; dapat diberikan segar atau dikeringkan; biasanya tercampur dengan bungkil kelapa pada proses ekstraksi tidak sempurna',
    ketersediaan: 'Tersedia sebagai limbah pabrik pengolahan kelapa; jumlah terbatas karena proporsinya kecil dari total buah',
    kelebihan: 'Mengandung antioksidan (tanin, polifenol) yang dapat menekan patogen tertentu; sumber serat tambahan; harga sangat murah',
    kekurangan: 'Tanin menghambat kecernaan protein dan dapat menekan konsumsi; nilai energi rendah; perlu dibatasi sangat ketat; tidak direkomendasikan sebagai komponen utama ransum',
    bentuk: ['Kering', 'Segar'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 8.0, sk: 14.0, lk: 10.0, abu: 2.2, betn: 65.8,
      tdn: 60, me: 2400,
      ndf: 55.0, adf: 25.0,
      ca: 0.03, p: 0.12, mg: 0.08, na: 0.02, k: 0.30, cl: 0.03, s: 0.06,
      vitamin: 'Mengandung polifenol dan tanin kondensasi (tidak berdampak positif sebagai vitamin)',
      mineral: 'Profil mineral sedang; kandungan tanin menginterferensi mineral binding. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan'],
      catatan: 'Batasi sangat ketat ≤5% BK ransum karena tanin menghambat kecernaan protein. Biasanya sudah terkandung dalam bungkil kelapa dalam jumlah kecil. Tidak disarankan sebagai sumber pakan tunggal.',
    },
    harga: {
      estimasiAI: 800, hargaMarketplace: 600,
      satuan: 'per kg kering',
      supplier: 'Pabrik pengolahan kelapa / Sisa limbah pengupasan daging kelapa',
      updatedAt: '01 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Coconut testa, INRA-CIRAD-AFZ-FAO',
        'Göhl, B. (1981) — Tropical Feeds, FAO Animal Production Series No. 12',
        'Kumar, V. et al. (2012) — Anti-nutritional factors in coconut by-products, J. of Food Chem.',
      ],
      sumberData: 'Feedipedia dan Kumar et al. untuk kulit ari kelapa; nilai tanin dari literatur antinutrisi',
      catatan: 'Kandungan tanin kondensasi 2–5% BK dapat menurunkan kecernaan protein secara signifikan. Penggunaan ≤5% tidak menimbulkan masalah berarti pada ruminansia dewasa.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🛡️', text: 'Kulit ari kelapa mengandung tanin kondensasi dan polifenol yang bersifat antioksidan — dalam dosis kecil (<5% ransum) dapat membantu menekan protozoa rumen dan meningkatkan protein bypass rumen.' },
      { type: 'kelebihan', icon: '✅', text: 'Polifenol dan tanin dosis rendah memiliki efek antiparasit ringan. Sering sudah terkandung dalam bungkil kelapa standar tanpa perlu ditambahkan secara terpisah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tanin kondensasi (2–5% BK) menghambat kecernaan protein secara nyata jika melebihi 5% ransum. Palatabilitas sedang — beberapa ternak menolak jika proporsinya terlalu tinggi.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan melebihi 5% ransum. Pada ternak muda (pedet, cempe), tanin lebih berbahaya karena kapasitas enzim tanase rumen belum penuh. Hindari pada anak ternak usia <3 bulan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Jika digunakan, campurkan ke dalam bungkil kelapa atau dedak padi sebagai pengecer. Tidak perlu digunakan sebagai bahan pakan tunggal — biasanya sudah terkandung dalam bungkil kelapa.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk manfaat antioksidan pakan: gunakan sumber tanin terkontrol seperti daun gamal atau Leucaena dosis terukur. Bungkil kelapa sudah mengandung kulit ari dalam proporsi wajar.' },
    ],
  },

  // ── 8. Sabut Kelapa ───────────────────────────────────────────────────────────
  'sabut-kelapa': {
    deskripsi: 'Serat pembungkus buah kelapa antara kulit luar dan tempurung (mesokarp berserat). Serat kasar sangat tinggi dengan kecernaan sangat rendah karena kandungan lignin tinggi. Umumnya digunakan sebagai roughage atau alas kandang.',
    alias: 'Coconut Husk, Coconut Coir, Coir, Sabut Kelapa, Serabut Kelapa',
    asal: 'Lapisan mesokarp berserat buah kelapa; dipisahkan dari tempurung di pabrik pengolahan kelapa atau secara manual',
    habitat: 'Tersedia di seluruh sentra pengolahan kelapa; sentra industri sabut kelapa dan cocofiber di Jawa, Sulawesi, dan Sumatera',
    bagianDimanfaatkan: 'Serat mesokarp — dipisahkan menjadi serat panjang (coir fiber) dan serbuk halus (cocopeat)',
    metodePengolahan: 'Dapat diberikan langsung atau dicacah halus untuk meningkatkan konsumsi; perendaman dalam air 24 jam dapat melunakkan serat; penggilingan meningkatkan kecernaan sedikit',
    ketersediaan: 'Sangat berlimpah — Indonesia produsen sabut kelapa terbesar; tersedia sepanjang tahun dengan harga sangat murah',
    kelebihan: 'Harga sangat murah; tersedia sangat melimpah; memberikan efek mengeyangkan (bulking) yang efektif; baik sebagai alas kandang yang menyerap urine',
    kekurangan: 'Kecernaan sangat rendah (TDN ±25%); NDF sangat tinggi (±85%); lignin tinggi menghambat fermentasi selulosa rumen; nilai pakan sebagai sumber nutrisi sangat terbatas; perlu pengolahan kimia untuk meningkatkan kecernaan',
    bentuk: ['Kering', 'Segar'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 2.5, sk: 37.0, lk: 0.3, abu: 3.0, betn: 57.2,
      tdn: 25, me: 900,
      ndf: 85.0, adf: 70.0,
      ca: 0.05, p: 0.05, mg: 0.06, na: 0.05, k: 0.52, cl: 0.10, s: 0.04,
      vitamin: 'Sangat rendah semua vitamin; tidak ada vitamin yang signifikan',
      mineral: 'Cukup tinggi Kalium (K) meskipun kecernaan mineral terhambat oleh lignin. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 10,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing'],
      programCocok: ['Indukan'],
      catatan: 'Hanya sebagai roughage darurat atau alas kandang. Batasi ≤10% BK ransum. Pengolahan NaOH (amoniasi) dapat meningkatkan kecernaan NDF dari 20% menjadi ±35%. Tidak direkomendasikan sebagai komponen pakan utama.',
    },
    harga: {
      estimasiAI: 500, hargaMarketplace: 400,
      satuan: 'per kg kering',
      supplier: 'Industri cocofiber / Pabrik pengolahan kelapa / Petani kelapa',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Coconut husk, INRA-CIRAD-AFZ-FAO',
        'Göhl, B. (1981) — Tropical Feeds, FAO Animal Production Series No. 12',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia dan Hartadi et al. untuk sabut kelapa segar dan kering',
      catatan: 'Nilai TDN sabut kelapa sangat rendah (20–30%) karena lignin tinggi. Perlakuan NaOH 4% dapat meningkatkan kecernaan NDF hingga 35% — pertimbangkan amoniasi jika digunakan dalam jumlah besar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Sabut kelapa berfungsi utama sebagai roughage — memberikan efek bulk pada rumen yang mendorong kontraksi retikulum-rumen dan mempertahankan kesehatan saluran pencernaan ruminansia.' },
      { type: 'kelebihan', icon: '✅', text: 'Sangat murah dan melimpah di seluruh Indonesia. Sebagai alas kandang, menyerap urine dan feses lebih baik dari jerami. Tinggi Kalium — berguna sebagai suplemen mineral K murah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Nilai pakan sangat rendah — TDN hanya 25%, NDF 85%, lignin 30–40% dari ADF. Rumen tidak dapat mencerna lignin. Tidak bisa diandalkan sebagai sumber energi atau nutrisi utama.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan lebih dari 10% ransum tanpa pengolahan amoniasi. Sabut tidak diolah dalam jumlah besar dapat menyebabkan impaksi rumen (tersumbat) terutama pada sapi bunting.' },
      { type: 'kombinasi', icon: '🔗', text: 'Jika digunakan: campurkan dengan molases (palatabilitas) + urea (protein NPN) + mineral. Amoniasi sabut + molases + bungkil kelapa = roughage upgrade yang biaya efektif.' },
      { type: 'alternatif', icon: '🔄', text: 'Jerami padi (lebih umum tersedia, nilai gizi setara) atau Ampas Tebu (Bagasse) lebih direkomendasikan sebagai roughage murah. Sabut cocok hanya jika berlimpah di lokasi.' },
    ],
  },

  // ── 9. Tempurung Kelapa ───────────────────────────────────────────────────────
  'tempurung-kelapa': {
    deskripsi: 'Lapisan keras endokarp buah kelapa yang melindungi daging kelapa. Sangat tinggi lignin dan selulosa kristalin dengan kecernaan mendekati nol. Nilai pakan langsung sangat rendah; terutama digunakan sebagai bahan bakar atau dibuat arang aktif.',
    alias: 'Coconut Shell, Cangkang Kelapa, Endocarp Kelapa',
    asal: 'Lapisan keras endokarp buah kelapa matang; dipisahkan dari daging saat pengolahan kelapa di pabrik atau secara manual',
    habitat: 'Tersedia di seluruh sentra pengolahan kelapa; volume terbesar di industri kopra dan minyak kelapa',
    bagianDimanfaatkan: 'Lapisan keras endokarp — umumnya untuk bahan bakar; arang aktif untuk filtrasi air minum ternak; nilai pakan langsung sangat terbatas',
    metodePengolahan: 'Tidak ada pengolahan standar untuk meningkatkan nilai pakan secara signifikan. Penggilingan menjadi serbuk kasar dapat digunakan sebagai bahan litter/alas kandang.',
    ketersediaan: 'Sangat berlimpah sebagai limbah industri kelapa; harga sangat murah; mudah diperoleh di sentra pengolahan kelapa',
    kelebihan: 'Harga sangat murah; sebagai bahan bakar bernilai energi tinggi; arang tempurung (coconut shell charcoal) efektif sebagai penyerap racun dalam saluran pencernaan',
    kekurangan: 'Nilai pakan sebagai bahan pakan langsung sangat rendah — kecernaan hampir nol; lignin sangat tinggi; keras dan sulit digiling; dapat melukai saluran pencernaan jika diberikan kasar',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 1.8, sk: 40.0, lk: 0.5, abu: 2.5, betn: 55.2,
      tdn: 15, me: 600,
      ndf: 88.0, adf: 80.0,
      ca: 0.04, p: 0.04, mg: 0.05, na: 0.04, k: 0.40, cl: 0.08, s: 0.03,
      vitamin: 'Tidak ada vitamin signifikan',
      mineral: 'Nilai mineral rendah dan hampir tidak dapat diserap karena terikat lignin. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 3,
      targetTernak: ['Sapi Potong'],
      programCocok: ['Indukan'],
      catatan: 'Tidak direkomendasikan sebagai bahan pakan. Jika terpaksa, giling halus dan campur ≤3% ransum hanya sebagai roughage darurat. Arang tempurung aktif dapat digunakan sebagai detoksifikan pada kasus keracunan.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 300,
      satuan: 'per kg',
      supplier: 'Industri pengolahan kelapa / Pabrik arang aktif',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Coconut shell, INRA-CIRAD-AFZ-FAO',
        'Göhl, B. (1981) — Tropical Feeds, FAO Animal Production Series No. 12',
      ],
      sumberData: 'Feedipedia untuk komposisi kimia tempurung kelapa; nilai TDN sangat rendah karena lignin dominan',
      catatan: 'Tempurung kelapa memiliki nilai kalori bahan bakar tinggi (±4.500 kcal/kg) namun nilai pakan ternak sangat rendah karena energi tidak dapat dimetabolisme oleh ternak. Arang aktif (activated carbon) dari tempurung memiliki aplikasi veteriner sebagai detoksifikan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🔥', text: 'Tempurung kelapa hampir tidak memiliki nilai pakan langsung — TDN hanya 15%, kecernaan mendekati nol. Nilai utamanya adalah sebagai bahan bakar (kalori tinggi) dan bahan baku arang aktif veteriner.' },
      { type: 'kelebihan', icon: '✅', text: 'Arang aktif dari tempurung kelapa dapat digunakan sebagai detoksifikan darurat pada kasus keracunan ternak (dosis 1–2 g/kg BB dilarutkan dalam air melalui selang nasogastrik).' },
      { type: 'kekurangan', icon: '⚠️', text: 'Nilai pakan langsung sangat buruk. NDF 88%, lignin dominan — rumen tidak dapat mencerna. Pemberian berlebihan berisiko impaksi fisik pada saluran pencernaan.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan tempurung kasar atau serpihan besar — dapat melukai mukosa rumen dan abomasum. Tidak direkomendasikan sebagai bahan pakan ternak dalam kondisi normal.' },
      { type: 'kombinasi', icon: '🔗', text: 'Tidak perlu dikombinasikan sebagai pakan. Manfaatkan sebagai bahan bakar pengering kopra atau arang aktif untuk kegunaan veteriner saat dibutuhkan.' },
      { type: 'alternatif', icon: '🔄', text: 'Sebagai roughage darurat: Ampas Tebu (Bagasse) atau Jerami Padi jauh lebih baik. Untuk detoksifikasi: Arang aktif komersial tersedia dengan dosis dan kemurnian terkontrol.' },
    ],
  },

  // ── 10. Gula Kelapa ───────────────────────────────────────────────────────────
  'gula-kelapa': {
    deskripsi: 'Nira kelapa yang telah dipekatkan melalui pemanasan hingga membentuk padatan atau pasta berwarna coklat. Mengandung sukrosa 75–90% dengan sedikit mineral. Digunakan sebagai sumber energi cepat atau palatabilitas enhancer dalam ransum.',
    alias: 'Coconut Sugar, Palm Sugar, Gula Merah Kelapa, Gula Jawa, Brown Sugar Palm, Jaggery',
    asal: 'Nira kelapa yang diolah petani penyadap menjadi gula padat; sentra produksi di Jawa Tengah, Jawa Barat, Sulawesi, dan Nusa Tenggara',
    habitat: 'Pohon kelapa produktif >5 tahun di dataran rendah; pengolahan dilakukan di kebun atau sentra industri rumah tangga',
    bagianDimanfaatkan: 'Nira kelapa yang dipekatkan hingga ±95% BK dengan kandungan gula ≥75%',
    metodePengolahan: 'Nira dimasak dalam wajan terbuka selama 3–4 jam sambil diaduk hingga mengental dan dapat dicetak; kadar air diturunkan dari ±84% menjadi ≤5%',
    ketersediaan: 'Tersedia sepanjang tahun di pasar tradisional; tersedia dalam bentuk bongkahan (cetak), serbuk, atau cair; harga lebih stabil dari nira segar',
    kelebihan: 'Kadar gula sangat tinggi (75–90%); palatabilitas sangat baik; dapat disimpan 3–6 bulan; efektif meningkatkan konsumsi ransum; mengandung mineral mikro lebih lengkap dari gula pasir putih',
    kekurangan: 'Harga mahal (tertinggi di antara produk kelapa); bukan sumber protein atau serat; terlalu banyak dapat menyebabkan diare karena fermentasi cepat di rumen; tidak efisien sebagai komponen utama ransum',
    bentuk: ['Kering', 'Cair'],
    nutrisi: {
      bk: 95, kadarAir: 5,
      pk: 1.0, sk: 0.0, lk: 0.5, abu: 2.0, betn: 96.5,
      tdn: 78, me: 3000,
      ndf: 0.0, adf: 0.0,
      ca: 0.04, p: 0.04, mg: 0.12, na: 0.07, k: 1.00, cl: 0.08, s: 0.03,
      vitamin: 'Mengandung sedikit Inositol; jejak Vitamin B kompleks dari nira; lebih kaya mikronutrien dibanding gula pasir putih',
      mineral: 'Lebih kaya K, Mg, dan Zn dibanding gula putih refinasi; Fe kecil. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 10,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kuda'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Pejantan'],
      catatan: 'Gunakan sebagai palatabilitas enhancer ≤10% ransum. Efektif untuk ternak sakit, pasca-lahir, atau yang menolak pakan baru. Batasi karena fermentasi cepat di rumen berisiko asidosis jika berlebihan. Larutkan dalam air atau campurkan rata di ransum.',
    },
    harga: {
      estimasiAI: 18000, hargaMarketplace: 16000,
      satuan: 'per kg',
      supplier: 'Pengrajin gula kelapa / Pasar tradisional / Toko bahan pakan',
      updatedAt: '05 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Coconut sugar, INRA-CIRAD-AFZ-FAO',
        'Purnomo, H. et al. (2018) — Nutritional Composition of Traditional Palm Sugar, Food Chemistry J.',
      ],
      sumberData: 'Feedipedia dan Purnomo et al. untuk gula kelapa cetak standar Indonesia',
      catatan: 'Nilai nutrisi gula kelapa lebih unggul dari gula tebu putih dalam hal mineral mikro. Indeks glikemik lebih rendah dari sukrosa murni karena kandungan inulin kecil dari proses alami.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍯', text: 'Gula kelapa adalah palatabilitas enhancer premium — ternak hampir selalu mau mengkonsumsi ransum baru jika dicampur gula kelapa. Sangat efektif untuk mengatasi off-feed pasca-transportasi atau penyakit.' },
      { type: 'kelebihan', icon: '✅', text: 'Shelf life 3–6 bulan pada kondisi kering. Lebih kaya mineral mikro (K, Mg, Zn) dibanding gula pasir putih. Rasa karamel alami sangat meningkatkan palatabilitas pakan serat rendah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga paling mahal di antara semua produk kelapa. Tidak memberikan protein atau serat. Terlalu banyak (>10%) berisiko asidosis rumen akibat fermentasi gula cepat.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan melebihi 10% ransum. Gula kelapa yang sudah lembap atau berjamur dapat mengandung mikotoksin. Simpan di tempat kering dan sejuk.' },
      { type: 'kombinasi', icon: '🔗', text: 'Optimal dicampur dengan Bungkil Kelapa + Dedak Padi + Hijauan sebagai ransum basah. Untuk ternak sakit: larutkan dalam air + oralit + gula kelapa = solusi rehidrasi darurat berenergi.' },
      { type: 'alternatif', icon: '🔄', text: 'Molases (tetes tebu) adalah alternatif jauh lebih murah dengan fungsi serupa sebagai palatabilitas enhancer. Gula kelapa cocok untuk skala kecil atau peternakan yang memiliki akses langsung ke produsen.' },
    ],
  },

  // ── 11. Daun Kelapa ───────────────────────────────────────────────────────────
  'daun-kelapa': {
    deskripsi: 'Daun kelapa dewasa (helaian pinnae) dan pelepah yang dipangkas saat pemeliharaan pohon. Serat kasar sangat tinggi dengan nilai nutrisi terbatas. Dapat digunakan sebagai hijauan suplemen dalam kondisi kekurangan pakan.',
    alias: 'Coconut Leaf, Pelepah Kelapa, Palm Leaf',
    asal: 'Daun (pinnae dan rachis pelepah) pohon kelapa dewasa yang dipangkas; panen pelepah dilakukan setiap bulan untuk pemeliharaan pohon',
    habitat: 'Perkebunan kelapa rakyat dan perkebunan besar di dataran rendah tropis; tersedia sepanjang tahun dari kegiatan pemangkasan rutin',
    bagianDimanfaatkan: 'Helaian daun muda yang lebih lunak (bagian ujung pelepah); pelepah tua lebih keras dan lignin lebih tinggi',
    metodePengolahan: 'Diberikan langsung atau dicacah menggunakan chopper; pelepah tua sebaiknya dicacah halus <2 cm untuk meningkatkan konsumsi; dapat dikeringkan untuk penyimpanan',
    ketersediaan: 'Tersedia sepanjang tahun dari pemangkasan rutin; gratis di sentra perkebunan kelapa; tidak diperdagangkan secara formal',
    kelebihan: 'Gratis atau sangat murah di sentra kelapa; tersedia rutin setiap bulan dari pemangkasan; dapat menggantikan sebagian jerami saat hijauan langka',
    kekurangan: 'Nilai nutrisi rendah — protein ±4% BK, serat sangat tinggi; lignin tinggi membatasi kecernaan; palatabilitas sedang; perlu pencacahan sebelum diberikan',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 91, kadarAir: 9,
      pk: 4.0, sk: 38.0, lk: 2.0, abu: 8.0, betn: 48.0,
      tdn: 40, me: 1500,
      ndf: 65.0, adf: 50.0,
      ca: 0.30, p: 0.08, mg: 0.15, na: 0.06, k: 1.10, cl: 0.15, s: 0.05,
      vitamin: 'Beta-karoten (pro-vitamin A) dalam jumlah kecil pada daun hijau muda',
      mineral: 'Cukup tinggi Kalsium (0,30% BK) dan Kalium (1,10% BK). Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Grower'],
      catatan: 'Cacah halus <2 cm sebelum diberikan. Batasi ≤20% ransum. Pilih daun muda (hijau, ujung pelepah) karena lebih lunak dan palatabilitas lebih baik dibanding daun tua. Kombinasikan dengan sumber protein dan energi.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 200,
      satuan: 'per kg kering',
      supplier: 'Perkebunan kelapa (gratis/murah dari hasil pemangkasan)',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Coconut (Cocos nucifera), leaves, INRA-CIRAD-AFZ-FAO',
        'Göhl, B. (1981) — Tropical Feeds, FAO Animal Production Series No. 12',
        'Devendra, C. (1992) — Non-Conventional Feed Resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Feedipedia dan Göhl (1981) untuk komposisi daun kelapa tropis',
      catatan: 'Nilai nutrisi daun tua jauh lebih rendah dari daun muda. Pilih helaian ujung pelepah yang masih hijau untuk nilai gizi terbaik. Lignin daun tua mencapai 40% dari ADF.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun kelapa berfungsi sebagai roughage darurat — tersedia gratis dari pemangkasan rutin perkebunan. Nilai terbesar adalah ketersediaan tanpa biaya, bukan nilai nutrisinya yang memang rendah.' },
      { type: 'kelebihan', icon: '✅', text: 'Gratis dan selalu tersedia di sentra kelapa. Cukup tinggi Ca (0,30% BK) yang membantu memenuhi kebutuhan kalsium ternak laktasi. K tinggi mendukung keseimbangan elektrolit.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein hanya 4% BK dan serat sangat tinggi (ADF 50%). TDN hanya 40% — jauh di bawah kebutuhan energi ternak produktif. Harus dikombinasikan dengan sumber energi dan protein.' },
      { type: 'peringatan', icon: '🚨', text: 'Daun kelapa tua sangat keras dan berlignan tinggi — dapat mengurangi konsumsi pakan total jika melebihi 20% ransum. Selalu cacah halus dan pilih daun muda untuk palatabilitas terbaik.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan Bungkil Kelapa (protein) + Molases (energi fermentable) + Mineral Premix. Daun kelapa + bungkil kelapa + nira kelapa = ransum "all coconut" ekonomis di sentra kelapa.' },
      { type: 'alternatif', icon: '🔄', text: 'Pelepah Kelapa Sawit memiliki komposisi serupa namun biasanya lebih tersedia di sentra sawit. Jerami Padi atau Rumput Gajah lebih direkomendasikan sebagai hijauan utama.' },
    ],
  },

  // ── 12. Janur Kelapa ──────────────────────────────────────────────────────────
  'janur-kelapa': {
    deskripsi: 'Daun kelapa yang masih sangat muda berwarna kuning kehijauan, belum berkembang sempurna dari pupus daun. Lebih lunak, lebih palatabel, dan kandungan serat lebih rendah dibanding daun dewasa.',
    alias: 'Young Coconut Leaf, Daun Kelapa Muda, Pupus Kelapa, Pale Palm Leaf',
    asal: 'Daun kelapa yang belum berkembang sempurna dari bagian pupus (terminal bud) pohon kelapa; dipotong saat upacara adat atau pemangkasan hati-hati',
    habitat: 'Pohon kelapa dewasa; pemotongan janur harus selektif agar tidak merusak titik tumbuh pohon',
    bagianDimanfaatkan: 'Helaian daun muda berwarna kuning-hijau terang yang belum membuka sempurna',
    metodePengolahan: 'Diberikan langsung segar; potong-potong panjang 10–15 cm untuk memudahkan konsumsi; tidak perlu pengolahan khusus; dapat disimpan 1–2 hari di tempat teduh',
    ketersediaan: 'Terbatas — pengambilan janur berlebihan merusak pohon; tersedia terutama dari kegiatan budaya (sesaji, hiasan) yang menyisakan bahan; tidak diperdagangkan sebagai pakan ternak',
    kelebihan: 'Lebih lunak dan palatabel dari daun tua; lebih tinggi protein dan lebih rendah serat dari daun dewasa; kandungan beta-karoten lebih tinggi karena masih muda',
    kekurangan: 'Ketersediaan sangat terbatas — pengambilan berlebihan merusak produktivitas pohon; tidak dapat dijadikan sumber pakan andalan; harus digunakan dengan sangat selektif',
    bentuk: ['Segar'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 6.0, sk: 28.0, lk: 2.5, abu: 7.0, betn: 56.5,
      tdn: 52, me: 2000,
      ndf: 52.0, adf: 35.0,
      ca: 0.35, p: 0.10, mg: 0.18, na: 0.07, k: 1.20, cl: 0.16, s: 0.06,
      vitamin: 'Beta-karoten (pro-vitamin A) lebih tinggi dibanding daun dewasa; sedikit Vitamin C',
      mineral: 'Lebih tinggi Ca, K, dan Mg dibanding daun tua. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Grower', 'Bunting'],
      catatan: 'Berikan segar dan gunakan dalam 1–2 hari. Batasi penggunaan ≤15% ransum dan jangan mengambil berlebihan dari satu pohon. Sangat cocok untuk kambing dan domba yang lebih suka daun muda.',
    },
    harga: {
      estimasiAI: 500, hargaMarketplace: 400,
      satuan: 'per kg',
      supplier: 'Perkebunan kelapa (tersedia dari pembersihan pohon yang hati-hati)',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Coconut (Cocos nucifera), young leaves, INRA-CIRAD-AFZ-FAO',
        'Devendra, C. (1992) — Non-Conventional Feed Resources in Asia and the Pacific, FAO',
      ],
      sumberData: 'Feedipedia dan Devendra (1992); nilai lebih baik dibanding daun dewasa karena dinding sel belum lignifikasi penuh',
      catatan: 'Janur memiliki nilai gizi lebih baik dari daun tua karena dinding sel belum terdeposisi lignin sempurna. Namun, pengambilan janur berlebihan dapat menekan produksi buah pohon kelapa.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌱', text: 'Janur kelapa adalah versi premium daun kelapa — protein lebih tinggi (6% vs 4% BK), serat lebih rendah (ADF 35% vs 50%), dan palatabilitas jauh lebih baik. Sangat disukai kambing dan domba.' },
      { type: 'kelebihan', icon: '✅', text: 'Lebih tinggi beta-karoten dibanding daun tua — mendukung fertilitas dan kekebalan tubuh ternak. Tekstur lunak sangat palatabel. Lebih mudah dicerna dibanding daun dewasa.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ketersediaan sangat terbatas. Pengambilan berlebihan dari satu pohon merusak produktivitasnya dan mengurangi hasil buah. Tidak bisa diandalkan sebagai sumber pakan tetap.' },
      { type: 'peringatan', icon: '🚨', text: 'Ambil janur maksimal 2–3 helai per pohon per bulan agar tidak mengganggu pertumbuhan dan produksi buah. Jangan memotong pucuk (pupus) kelapa — mematikan pohon secara permanen.' },
      { type: 'kombinasi', icon: '🔗', text: 'Campurkan dengan hijauan utama (rumput/leguminosa) sebagai variasi pakan. Sangat cocok untuk kambing perah yang membutuhkan beta-karoten untuk produksi susu kuning.' },
      { type: 'alternatif', icon: '🔄', text: 'Daun Kelapa Dewasa (lebih melimpah) atau Daun Gamal (protein lebih tinggi, ±22% BK) adalah alternatif hijauan yang lebih berkelanjutan. Janur sebaiknya hanya sebagai suplemen variasi.' },
    ],
  },

  // ── 13. Bungkil Kelapa ────────────────────────────────────────────────────────
  'bungkil-kelapa': {
    deskripsi: 'Residu padat setelah ekstraksi minyak dari kopra menggunakan pelarut organik (solvent extraction). Protein 18–22% BK dengan serat kasar tinggi (NDF ±55%). Salah satu suplemen protein paling umum digunakan untuk ruminansia di Indonesia.',
    alias: 'Copra Meal, Coconut Meal, Coconut Cake, Bungkil Kopra, Copra Cake',
    asal: 'Sisa ekstraksi minyak kopra di pabrik pengolahan minyak kelapa; diproduksi di sentra industri kelapa Sulawesi, Sumatera, dan Jawa',
    habitat: 'Produk industri pengolahan kopra; tersedia di pabrik minyak kelapa dan pedagang bahan pakan',
    bagianDimanfaatkan: 'Padatan residu setelah lemak kopra diekstrak menggunakan solvent hexane (solvent meal) atau mekanis (expeller cake)',
    metodePengolahan: 'Sudah dalam bentuk akhir pakan; dapat diberikan langsung atau dicampur konsentrat; jika berbentuk cake/bongkahan perlu digiling sebelum diberikan',
    ketersediaan: 'Tersedia sepanjang tahun; diperdagangkan luas di seluruh Indonesia; pasokan cukup stabil mengikuti produksi kopra nasional',
    kelebihan: 'Protein cukup tinggi (18–22% BK) untuk suplemen ruminansia; harga relatif terjangkau; tersedia luas; mudah disimpan (BK ±90%); palatabilitas baik',
    kekurangan: 'Serat sangat tinggi (NDF ±55%) membatasi penggunaan pada unggas; protein rendah lysine — perlu dikombinasikan; lemak residu rendah (3–8%) tergantung metode ekstraksi',
    bentuk: ['Kering', 'Tepung'],
    nutrisi: {
      bk: 91, kadarAir: 9,
      pk: 21.0, sk: 13.0, lk: 6.5, abu: 6.0, betn: 53.5,
      tdn: 72, me: 2750,
      ndf: 55.0, adf: 28.0,
      ca: 0.18, p: 0.58, mg: 0.30, na: 0.05, k: 1.70, cl: 0.07, s: 0.28,
      vitamin: 'Rendah vitamin larut air; defisien vitamin B12; sangat rendah vitamin E setelah ekstraksi',
      mineral: 'Lebih kaya mineral dibanding kopra; P tinggi (0,58% BK) — perlu keseimbangan dengan Ca. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      catatan: 'Batasi ≤30% ransum. Kaya serat — lebih cocok untuk ruminansia dari pada unggas. Serat tinggi dapat menyebabkan bloat pada penggunaan berlebihan. Keseimbangkan Ca:P (target 2:1) karena P tinggi.',
    },
    harga: {
      estimasiAI: 4200, hargaMarketplace: 4000,
      satuan: 'per kg',
      supplier: 'Pabrik minyak kelapa / Distributor pakan ternak / Toko pakan',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Feedipedia (2023) — Copra meal (coconut oil meal), solvent-extracted, INRA-CIRAD-AFZ-FAO',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Rev. Ed.',
      ],
      sumberData: 'Hartadi et al. dan Feedipedia untuk bungkil kelapa solvent-extracted standar Indonesia',
      catatan: 'Bungkil kelapa ekspeller (mekanis) memiliki lemak lebih tinggi (8–12% BK) dan energi lebih baik dibanding bungkil solvent. Nilai yang ditampilkan untuk bungkil solvent standar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧈', text: 'Bungkil kelapa adalah suplemen protein ruminansia paling ekonomis dari kategori kelapa — protein 21% BK dengan harga jauh lebih murah dari bungkil kedelai. Tersedia stabil di seluruh Indonesia.' },
      { type: 'kelebihan', icon: '✅', text: 'Kombinasi protein-serat-lemak yang seimbang untuk ruminansia. Sangat palatabel — ternak sapi dan kambing sangat menyukai aromanya. Dapat menggantikan sebagian bungkil kedelai dengan biaya lebih rendah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein rendah lisin (defisiensi asam amino esensial). Serat sangat tinggi (NDF 55%) membatasi penggunaan pada unggas. Kandungan asam lemak jenuh yang tersisa masih perlu diperhatikan.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan melebihi 30% ransum pada sapi — serat terlalu tinggi menurunkan kecernaan keseluruhan ransum. P tinggi (0,58% BK) — seimbangkan dengan suplemen Ca (kapur/dicalcium phosphate).' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi ideal: Bungkil Kelapa (protein dasar) + Bungkil Kedelai (protein + lisin) + Dedak Padi (energi + B vitamin) + Hijauan + Mineral Premix + Kapur (Ca). Rasio 60:40 bungkil kelapa:bungkil kedelai sangat populer.' },
      { type: 'alternatif', icon: '🔄', text: 'Bungkil Kedelai (protein lebih tinggi + lisin), Bungkil Inti Sawit/PKM (harga serupa, serat lebih tinggi), atau DDGS (protein + lemak lebih baik) adalah alternatif suplemen protein yang dapat dirotasi.' },
    ],
  },

  // ── 14. Tepung Kelapa ─────────────────────────────────────────────────────────
  'tepung-kelapa': {
    deskripsi: 'Daging kelapa yang dikeringkan dan digiling halus setelah sebagian atau seluruh lemaknya diekstrak. Dibedakan dari bungkil kelapa berdasarkan ukuran partikel yang lebih halus dan umumnya kadar lemak lebih terukur.',
    alias: 'Coconut Flour, Desiccated Coconut Flour, Tepung Kopra, Low-Fat Coconut Flour',
    asal: 'Daging kelapa kering (kopra atau fresh-dried) yang digiling halus setelah ekstraksi sebagian lemak; diproduksi di pabrik olahan kelapa',
    habitat: 'Produk industri pengolahan kelapa; tersedia di distributor bahan pakan dan pabrik pakan ternak',
    bagianDimanfaatkan: 'Partikel halus daging kelapa kering setelah sebagian minyak diekstrak',
    metodePengolahan: 'Diberikan langsung; mudah dicampur merata dalam ransum karena ukuran partikel halus; campurkan dengan bahan cair (molases, nira) untuk menghindari berdebu',
    ketersediaan: 'Tersedia di pabrik pengolahan kelapa dan distributor bahan pakan; lebih terbatas dibanding bungkil kelapa karena proses produksi lebih spesifik',
    kelebihan: 'Ukuran partikel halus memudahkan pencampuran dalam ransum; protein cukup (18–22% BK); serat lebih rendah dari sabut namun lebih tinggi dari dedak; mudah diformulasikan dalam pakan unggas',
    kekurangan: 'Berdebu jika terlalu kering; harga umumnya sedikit lebih mahal dari bungkil kelapa; ketersediaan lebih terbatas; masih tinggi serat dibanding bahan konsentrat impor',
    bentuk: ['Tepung', 'Kering'],
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 20.0, sk: 14.0, lk: 13.0, abu: 5.0, betn: 48.0,
      tdn: 77, me: 2900,
      ndf: 52.0, adf: 26.0,
      ca: 0.15, p: 0.50, mg: 0.25, na: 0.05, k: 1.60, cl: 0.06, s: 0.25,
      vitamin: 'Rendah vitamin larut air; lebih tinggi vitamin E residu dibanding bungkil solvent (lemak lebih tinggi dipertahankan)',
      mineral: 'Profil mineral mirip bungkil kelapa; P tinggi — perlu keseimbangan Ca. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Ayam Kampung'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower', 'Menyusui'],
      catatan: 'Batasi ≤25% BK ransum untuk ruminansia; ≤15% untuk unggas karena serat masih tinggi. Campurkan dengan bahan cair untuk menghindari berdebu. Seimbangkan Ca:P dengan suplementasi kapur.',
    },
    harga: {
      estimasiAI: 6500, hargaMarketplace: 6000,
      satuan: 'per kg',
      supplier: 'Pabrik pengolahan kelapa / Distributor bahan pakan / Toko pakan ternak',
      updatedAt: '05 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Coconut flour/meal, desiccated, INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia untuk tepung kelapa low-fat standar; nilai lemak bervariasi (10–18% BK) tergantung derajat ekstraksi',
      catatan: 'Tepung kelapa full-fat (tanpa ekstraksi lemak) memiliki energi jauh lebih tinggi tetapi lebih sulit disimpan. Nilai yang ditampilkan untuk tepung kelapa partially-defatted standar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🏭', text: 'Tepung kelapa mengisi niche antara bungkil kelapa (kasar) dan dedak padi (halus) dalam formulasi ransum — partikel halus memudahkan homogenitas campuran pakan, terutama untuk pakan unggas skala kecil.' },
      { type: 'kelebihan', icon: '✅', text: 'Lebih mudah dicampur merata dibanding bungkil kasar. Lemak lebih tinggi dari bungkil solvent (±13% BK) — energi lebih baik. Aromanya meningkatkan palatabilitas ransum.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Mudah berdebu dalam kondisi kering — tambahkan molases atau air (2–3%) untuk mengurangi debu. Serat masih terlalu tinggi untuk unggas komersial. Ketersediaan lebih terbatas dari bungkil kelapa.' },
      { type: 'peringatan', icon: '🚨', text: 'Simpan di tempat kering dan berventilasi baik — lemak lebih tinggi membuat tepung kelapa lebih rentan tengik dibanding bungkil solvent. Cek aroma sebelum digunakan jika disimpan >2 bulan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Sangat baik sebagai bahan campuran dalam konsentrat: Tepung Kelapa + Bungkil Kedelai + Dedak Padi + Premix + Kapur = konsentrat berimbang. Tambahkan Molases 3–5% untuk merekatkan dan menambah palatabilitas.' },
      { type: 'alternatif', icon: '🔄', text: 'Bungkil Kelapa kasar (lebih murah, fungsi serupa) atau Bungkil Inti Sawit (PKM) — keduanya tersedia lebih luas. Tepung Kelapa adalah pilihan ketika kehalusan partikel penting untuk formulasi.' },
    ],
  },

  // ── 15. Minyak Kelapa (Feed Grade) ─────────────────────────────────────────────
  'minyak-kelapa-pakan': {
    deskripsi: 'Minyak kelapa kualitas pakan yang tidak memenuhi standar pangan (off-spec CPO, atau minyak kelapa dengan FFA tinggi). Densitas energi tertinggi dari semua bahan pakan kelapa. Ditambahkan dalam jumlah sangat kecil ke ransum.',
    alias: 'Crude Coconut Oil Feed Grade, RBD Coconut Oil (feed), Palm Coconut Oil, Minyak Kelapa Off-spec',
    asal: 'Produk ekstraksi minyak dari kopra di pabrik pengolahan; off-spec atau trimming dari produksi minyak kelapa pangan; FFA (free fatty acid) >3%',
    habitat: 'Diproduksi di pabrik minyak kelapa; tersedia dari penolakan kualitas industri pangan atau pabrik pengilangan minyak kelapa',
    bagianDimanfaatkan: 'Minyak lemak murni dari kopra; hampir 100% lemak dengan dominasi asam laurat (C12:0 ±48%) dan asam miristat (C14:0 ±18%)',
    metodePengolahan: 'Dicampur merata ke dalam ransum — cairkan dahulu jika sudah padat (titik lebur ±25°C); tambahkan bertahap ke campuran pakan; hindari penambahan langsung tanpa pengadukan',
    ketersediaan: 'Tersedia dari pabrik pengolahan kelapa dan pengilangan minyak; volume terbatas dan tidak selalu tersedia di semua wilayah; perlu hubungan langsung dengan pabrik',
    kelebihan: 'Densitas energi tertinggi (ME ±8.500 kcal/kg BK); meningkatkan nilai energi ransum secara signifikan hanya dengan tambahan 2–5%; lemak MCT (lauric + miristat) cepat diserap; antimikroba alami',
    kekurangan: 'Lemak jenuh sangat tinggi (>90%) — membatasi penggunaan; mahal per kg; jika terlalu banyak menghambat fermentasi rumen; memerlukan penyimpanan khusus (suhu stabil, tidak terkena udara)',
    bentuk: ['Cair'],
    nutrisi: {
      bk: 99.9, kadarAir: 0.1,
      pk: 0.0, sk: 0.0, lk: 99.0, abu: 0.0, betn: 0.0,
      tdn: 170, me: 8500,
      ndf: 0.0, adf: 0.0,
      ca: 0.0, p: 0.0, mg: 0.0, na: 0.0, k: 0.0, cl: 0.0, s: 0.0,
      vitamin: 'Vitamin E (tocopherol) sangat tinggi pada minyak tak dimurnikan; tocotrienol aktif',
      mineral: 'Tidak ada mineral; murni lemak. Asam laurat (C12:0) 48%, miristat (C14:0) 18%, palmitat (C16:0) 9%, oleat (C18:1) 7%, kaprilat (C8:0) 8%, kaprat (C10:0) 7%. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Babi', 'Anak Ternak'],
      programCocok: ['Penggemukan', 'Menyusui', 'Bunting', 'Grower'],
      catatan: 'Tambahkan maksimal 3–5% BK ransum. Cairkan terlebih dahulu (±30°C) agar mudah dicampur merata. Pada ruminansia, lemak >5% ransum menghambat aktivitas mikroba selulolitik rumen. Sangat efektif pada formula pakan anak sapi pengganti susu.',
    },
    harga: {
      estimasiAI: 12000, hargaMarketplace: 11000,
      satuan: 'per kg',
      supplier: 'Pabrik minyak kelapa (off-spec) / Distributor bahan pakan industri',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Coconut oil, INRA-CIRAD-AFZ-FAO',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Rev. Ed.',
        'Bauman, D.E. et al. (2011) — Fatty Acid Sources in Ruminant Feed, J. of Dairy Science',
      ],
      sumberData: 'Feedipedia dan NRC untuk minyak kelapa murni; nilai ME berdasarkan faktor konversi lemak 2,25× TDN bahan energi standar',
      catatan: 'TDN >100% adalah nilai teoritis untuk lemak murni karena nilai kalori lemak (9 kcal/g) lebih dari dua kali karbohidrat (4 kcal/g). Nilai ME 8.500 kcal/kg BK adalah estimasi berdasarkan energi pembakaran dan koefisien kecernaan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Minyak kelapa feed grade adalah booster energi paling efisien di antara semua bahan pakan — ME 8.500 kcal/kg BK (2,5× energi pati). Tambahkan 2–3% ransum untuk meningkatkan pertambahan bobot badan atau produksi susu lemak secara signifikan.' },
      { type: 'kelebihan', icon: '✅', text: 'Asam laurat (C12:0 48%) memiliki efek antimikroba yang dapat menekan patogen saluran pencernaan tanpa mengganggu bakteri menguntungkan. MCT (C8-C12) lebih cepat diserap sebagai energi dibanding LCFA.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Lemak jenuh >90% — pada ruminansia membatasi penggunaan karena menghambat fermentasi selulosa. Tidak mengandung protein atau mineral. Mahal per kg meski efisien per kalori.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan melebihi 5% BK ransum pada ruminansia. Lemak berlebih melapisi partikel serat di rumen dan mencegah bakteri selulolitik menempel — menyebabkan penurunan kecernaan serat secara drastis.' },
      { type: 'kombinasi', icon: '🔗', text: 'Sangat efektif dalam ransum penggemukan intensif: Jagung Giling + Bungkil Kedelai + Minyak Kelapa 3% + Mineral Premix. Pada sapi perah laktasi tinggi: tambahkan 2–3% untuk meningkatkan kadar lemak susu.' },
      { type: 'alternatif', icon: '🔄', text: 'Minyak Sawit (feed grade) memiliki profil asam lemak berbeda (palmitat dominan); energi serupa namun efek antimikroba lauric lebih rendah. Lemak rumen-protected lebih efisien jika target adalah protein susu, bukan lemak susu.' },
    ],
  },

};

// ─── Accessor ─────────────────────────────────────────────────────────────────

export function getKelapaDetail(id: string): KelapaDetailItem | undefined {
  const base = getKelapaById(id);
  const detail = KELAPA_DETAIL[id];
  if (!base || !detail) return undefined;
  return { ...base, ...detail };
}
