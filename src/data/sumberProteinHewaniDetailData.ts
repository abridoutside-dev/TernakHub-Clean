// ─── MP-029 — Detail Data: Sumber Protein Hewani ─────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for every item in
// the "Sumber Protein Hewani" sub-category. Merged with SumberProteinHewaniItem
// via getSumberProteinHewaniDetail().
//
// Sumber data nutrisi:
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi
//     Pakan untuk Indonesia. Gadjah Mada University Press.
//   • Feedipedia (2024). INRA-CIRAD-AFZ-FAO Animal Feed Resources.
//   • NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.
//   • NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.
//   • NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.
//   • NRC (2016). Nutrient Requirements of Beef Cattle, 8th Rev. Ed.
//   • McDonald, P., Edwards, R.A., Greenhalgh, J.F.D. (2011). Animal Nutrition,
//     7th Ed. Pearson Education, Harlow.
//   • Pond, W.G., Church, D.C., Pond, K.R. (1995). Basic Animal Nutrition and
//     Feeding, 4th Ed. John Wiley & Sons.
//   • Tillman, A.D., Hartadi, H., Reksohadiprodjo, S. (1991). Ilmu Makanan
//     Ternak Dasar. Gadjah Mada University Press.
//   • JIRCAS (2013). Feed Composition Tables for Southeast Asia.
//   • Göhl, B. (1981). Tropical Feeds. FAO Animal Production and Health Series.
//   • Sinurat, A.P., et al. (2004). Bahan pakan unggas non konvensional. IPPTP.
//
// Nilai proximate (PK, SK, LK, Abu, BETN) atas dasar bahan kering (DM basis).
// TDN, ME (kcal/kg), NDF, ADF dinyatakan atas dasar bahan kering (DM basis).
// Mineral (Ca, P, Mg, Na, K, Cl, S) dinyatakan atas dasar bahan kering (%).
// BK (%) dan Kadar Air (%) atas dasar as-fed.
// Silase Ikan dan Telur Afkir: BK rendah (as-fed); nilai proximate pada DM basis.

import { getSumberProteinHewaniById } from './sumberProteinHewaniData';
import type {
  NutrisiData,
  PenggunaanData,
  HargaData,
  ReferensiData,
  AiInsightItem,
  BentukBahan,
} from './jagungData';

export interface SumberProteinHewaniDetailFields {
  sumberBahan: string;         // What animal/industry produces this
  bentuk: BentukBahan[];
  asal: string;                // Geographic/industry source
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

const SUMBER_PROTEIN_HEWANI_DETAIL: Record<string, SumberProteinHewaniDetailFields> = {

  // ── 1. Tepung Ikan (Fish Meal) ────────────────────────────────────────────────
  'tepung-ikan': {
    sumberBahan: 'Ikan laut utuh (ikan rucah, teri, lemuru, sardine) atau sisa industri pengalengan ikan (kepala, isi perut, tulang, dan ekor)',
    bentuk: ['Tepung', 'Butiran'],
    asal: 'Sentra perikanan: Juwana (Pati), Brondong (Lamongan), Muncar (Banyuwangi), Bitung (Sulawesi Utara), Peru (impor grade premium)',
    metodePengolahan: 'Ikan dimasak (steam cooking) → dipres untuk memisahkan minyak dan air → dikeringkan (dryer) → digiling menjadi tepung → dikemas. Minyak hasil press dijual sebagai fish oil.',
    ketersediaan: 'Tersedia sepanjang tahun; grade lokal melimpah dari sentra perikanan; grade impor (Peru, Chile) tersedia melalui agen pakan; harga fluktuatif mengikuti musim tangkap',
    kelebihan: 'Profil asam amino esensial terlengkap di antara semua sumber protein pakan — lisina ±5% BK, metionin ±1.7% BK; kecernaan protein >85%; sumber Ca dan P bioavailable tinggi; palatabilitas sangat baik untuk unggas dan babi; meningkatkan konsumsi ransum secara keseluruhan',
    kekurangan: 'Harga tertinggi di antara protein hewani umum; keamanan hayati tergantung proses pengolahan (histamin/biogen amina pada grade rendah); garam tinggi pada tepung ikan lokal (NaCl ±3–5%); mudah tengik karena lemak tidak jenuh tinggi; adulterasi dengan bahan non-protein (urea, tulang giling) perlu diwaspadai',
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 62.0, sk: 0.5, lk: 8.0, abu: 19.0, betn: 10.5,
      tdn: 72, me: 2950,
      ndf: 1.5, adf: 0.8,
      ca: 3.50, p: 2.50, mg: 0.18, na: 0.70, k: 0.90, cl: 0.80, s: 0.60,
      vitamin: 'Vitamin B12 sangat tinggi (±0.2 mg/kg); Niasin (B3) ±60 mg/kg; Riboflavin (B2) ±5 mg/kg; Vitamin D sedang; Vitamin A rendah',
      mineral: 'Ca dan P bioavailable tinggi dengan rasio Ca:P 1.4:1 (ideal); Zn ±90 ppm; Fe ±250 ppm; Se ±1.5 ppm; Co ±0.1 ppm',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 10,
      targetTernak: ['Ayam Pedaging', 'Ayam Petelur', 'Babi', 'Ikan Budidaya', 'Udang'],
      programCocok: ['Penggemukan', 'Grower', 'Menyusui', 'Indukan'],
      catatan: 'Batasi ≤5–8% untuk ayam pedaging (taint daging ikan jika berlebih). Batasi ≤5% untuk ayam petelur (bau telur). Ideal 5–10% pada ransum babi grower. Simpan di tempat sejuk dan kering — lemak oksidasi cepat. Periksa kadar NaCl pada tepung ikan lokal (jika >3% perlu kurangi garam ransum).',
    },
    harga: {
      estimasiAI: 9500, hargaMarketplace: 8500,
      satuan: 'per kg', supplier: 'Pabrik tepung ikan di Juwana, Muncar, Bitung; importir pakan Surabaya/Jakarta',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 98',
        'Feedipedia (2024) — Fish meal',
        'NRC (1994) — Nutrient Requirements of Poultry, 9th Ed., Table A-1',
        'NRC (2012) — Nutrient Requirements of Swine, 11th Ed.',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 312',
      ],
      sumberData: 'Nilai rata-rata tepung ikan lokal Indonesia (Hartadi et al. 1997) dan grade internasional (Feedipedia 2024); nilai nutrisi pada grade ±62% CP',
      catatan: 'Kualitas tepung ikan bervariasi besar: protein 55–70% BK tergantung bahan baku dan proses. Grade Peru (67–70% CP) lebih tinggi dari grade lokal (55–62% CP). Selalu minta Certificate of Analysis dari supplier.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Ikan adalah standar emas sumber protein hewani dalam nutrisi ternak — profil asam amino esensial paling lengkap dan seimbang. Lisina 5% BK dan metionin 1.7% BK melengkapi defisiensi asam amino pada bungkil kedelai dan protein nabati lainnya. TDN 72% BK juga menjadikannya sumber energi metabolis yang baik.' },
      { type: 'kelebihan', icon: '✅', text: 'Kecernaan protein >85%, tertinggi di antara sumber protein hewani umum. Kandungan Ca 3.5% dan P 2.5% BK dengan rasio Ca:P ideal (1.4:1) mengurangi kebutuhan suplementasi mineral fosfat. Vitamin B12 sangat tinggi — esensial untuk ransum unggas berbasis protein nabati.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga premium dan fluktuatif. Tepung ikan lokal grade rendah sering mengandung histamin dan biogen amina dari pembusukan ikan yang dapat menyebabkan gizzard erosion pada ayam. Adulterasi dengan urea atau tepung tulang giling harus diwaspadai — selalu minta COA dan lakukan spot-check NPN.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum ayam pedaging starter: Tepung ikan 5% + Jagung 55% + Bungkil kedelai 30% + Dedak 5% + Premix 5%. Ransum babi grower: Tepung ikan 8% + Jagung 60% + Bungkil kedelai 25% + Pollard 5% + Mineral 2%. Kombinasi tepung ikan + bungkil kedelai memberikan profil asam amino hampir sempurna.' },
      { type: 'peringatan', icon: '🚨', text: 'Batasi ≤5% pada ransum ayam petelur — kadar tinggi menyebabkan bau amis pada telur (trimethylamine). Simpan di wadah tertutup, tempat sejuk, dan hindari paparan udara — lemak omega-3 sangat mudah teroksidasi dalam 30 hari. Perhatikan kandungan NaCl tepung ikan lokal.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika harga tepung ikan terlalu tinggi: Tepung Teri (kualitas hampir sama, lebih mahal), Tepung Unggas (lebih murah, protein sedikit lebih rendah), atau Bungkil Kedelai + Metionin sintetis (protein sebanding, biaya lebih efisien untuk unggas).' },
    ],
  },

  // ── 2. Tepung Teri (Anchovy Meal) ─────────────────────────────────────────────
  'tepung-teri': {
    sumberBahan: 'Ikan teri (Stolephorus sp.) utuh yang dikeringkan dan digiling — bahan baku bermutu tinggi dari perikanan tangkap laut',
    bentuk: ['Tepung'],
    asal: 'Pantai Utara Jawa (Demak, Rembang, Pati); Pelabuhan Ratu (Jawa Barat); Bagan Siapi-api (Riau); Sulawesi Selatan',
    metodePengolahan: 'Ikan teri segar dikeringkan dengan sinar matahari atau mesin pengering → digiling halus. Grade premium menggunakan cold-drying untuk mempertahankan asam amino; grade biasa dijemur langsung.',
    ketersediaan: 'Musiman — puncak tangkapan Maret–Mei dan September–November; tersedia di sentra teri pantai utara Jawa; harga lebih stabil dari tepung ikan rucah karena volume tangkap lebih terprediksi',
    kelebihan: 'Protein ±60% BK, profil asam amino setara atau sedikit lebih baik dari tepung ikan rucah; palatabilitas superior — biasa dipakai sebagai "feed attractant" pada pakan starter; nilai Ca tinggi (±4% BK) dari tulang teri; aroma khas meningkatkan konsumsi pakan secara signifikan',
    kekurangan: 'Harga sedikit lebih tinggi dari tepung ikan biasa; kadar garam bervariasi tergantung proses pengeringan (teri asin vs teri tawar); ketersediaan terbatas dan musiman di luar sentra produksi; risiko kandungan logam berat dari perairan pantai utara Jawa',
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 60.0, sk: 0.5, lk: 7.0, abu: 19.5, betn: 13.0,
      tdn: 70, me: 2870,
      ndf: 1.5, adf: 0.8,
      ca: 4.00, p: 2.80, mg: 0.20, na: 0.90, k: 0.80, cl: 1.00, s: 0.55,
      vitamin: 'Vitamin B12 sangat tinggi; Niasin tinggi; Vitamin D sedang; kandungan vitamin mirip tepung ikan',
      mineral: 'Ca tinggi (4.0%) dari tulang teri; P bioavailable 2.8%; rasio Ca:P 1.4:1; Se ±1.2 ppm; Zn ±80 ppm',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 8,
      targetTernak: ['Ayam Pedaging', 'Ayam Petelur', 'Ikan Budidaya', 'Udang'],
      programCocok: ['Penggemukan', 'Grower', 'Menyusui'],
      catatan: 'Terutama efektif sebagai attractor pada pakan starter ayam (umur 0–14 hari). Periksa kadar NaCl — teri asin dapat mencapai NaCl 5–8% yang perlu diperhitungkan. Batasi ≤5% pada ayam petelur untuk mencegah bau telur.',
    },
    harga: {
      estimasiAI: 10000, hargaMarketplace: 9000,
      satuan: 'per kg', supplier: 'Pengepul teri di Demak, Rembang, Pati; pasar ikan tradisional pantai utara Jawa',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 99',
        'Feedipedia (2024) — Anchovy meal',
        'Göhl, B. (1981) — Tropical Feeds. FAO Animal Production and Health Series',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Nilai komposisi teri kering lokal (Hartadi et al. 1997 & JIRCAS 2013); rata-rata 8 sampel dari sentra produksi pantai utara Jawa',
      catatan: 'Nilai nutrisi teri sangat tergantung spesies (Stolephorus sp.) dan kondisi tangkap. Teri segar saat musim puncak memiliki lemak lebih tinggi (hingga ±10% BK). Kadar garam (NaCl) harus diukur secara terpisah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Teri adalah versi premium tepung ikan lokal dengan palatabilitas luar biasa — aroma khasnya merangsang konsumsi pakan bahkan pada ayam yang stres atau sakit. Sangat efektif sebagai "feed attractant" alami pada fase starter dan grower awal.' },
      { type: 'kelebihan', icon: '✅', text: 'Ca 4% BK dari tulang teri kecil yang terikut — lebih tinggi dari tepung ikan biasa, membantu pemenuhan kebutuhan Ca tanpa suplementasi tambahan. Protein 60% BK dengan asam amino esensial lengkap dan kecernaan >80%.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ketersediaan musiman dan terbatas geografis. Kadar NaCl pada teri asin (diproses dengan garam) bisa mencapai 5–8% — harus dihitung dalam balance elektrolit ransum. Hindari penggunaan teri apek yang sudah tengik.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum ayam starter: Tepung Teri 5% + Jagung 55% + Bungkil kedelai 32% + Premix 3% + CaCO3 5% — formula klasik berperforma tinggi. Tepung teri juga efektif 2–3% dalam pakan udang sebagai attractor alami.' },
      { type: 'peringatan', icon: '🚨', text: 'Jika menggunakan teri asin, kurangi atau hilangkan penambahan garam (NaCl) dalam ransum. Bau telur dapat muncul jika diberikan >5% pada ayam petelur. Simpan di wadah kedap udara karena lemak mudah teroksidasi.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: Tepung Ikan standar (lebih murah, tersedia lebih stabil), Tepung Rebon (lebih murah, kitin lebih tinggi), atau Tepung Unggas (berbeda profil asam amino tapi lebih mudah didapat sepanjang tahun).' },
    ],
  },

  // ── 3. Tepung Rebon ───────────────────────────────────────────────────────────
  'tepung-rebon': {
    sumberBahan: 'Udang rebon kecil (Acetes sp.) utuh kering — by-product dari industri terasi dan ebi; juga diproduksi langsung dari tangkapan rebon yang tidak terserap pasar manusia',
    bentuk: ['Tepung'],
    asal: 'Pantai utara Jawa (Eretan, Indramayu, Brebes, Pekalongan); Kalimantan (Barito Kuala, Banjar); Sulawesi Selatan (Maros)',
    metodePengolahan: 'Rebon segar dikeringkan langsung dengan sinar matahari → digiling kasar atau halus. Pada produksi terasi: rebon difermentasi dengan garam → dipres dan dikeringkan → giling. Tepung rebon langsung dari rebon kering lebih rendah garam.',
    ketersediaan: 'Musiman — melimpah saat musim rebon (Agustus–Oktober di Jawa). Tersedia sepanjang tahun di sentra terasi dalam bentuk by-product. Harga lebih terjangkau dari tepung ikan biasa.',
    kelebihan: 'Harga lebih murah dari tepung ikan; protein ±52% BK cukup tinggi; Ca ±6.5% BK dari cangkang rebon (suplementasi mineral); palatabilitas baik karena aroma khas; mudah diperoleh dari pengrajin terasi lokal',
    kekurangan: 'Kitin ±5–8% BK dari cangkang menurunkan kecernaan pada unggas muda dan ikan; kadar garam tinggi jika dari by-product terasi (NaCl ±4–8%); protein lebih rendah dari tepung ikan; kualitas tidak konsisten antar produsen',
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 52.0, sk: 2.0, lk: 4.0, abu: 24.0, betn: 18.0,
      tdn: 60, me: 2460,
      ndf: 5.5, adf: 3.0,
      ca: 6.50, p: 1.80, mg: 0.22, na: 0.80, k: 0.65, cl: 0.90, s: 0.45,
      vitamin: 'Vitamin B12 sedang; Niasin sedang; sedikit astaxanthin (pigmen karotenoid) yang memberikan warna pada kuning telur dan kulit unggas',
      mineral: 'Ca sangat tinggi (6.5%) dari cangkang rebon; P 1.8%; rasio Ca:P 3.6:1 (sangat tinggi Ca); Zn ±65 ppm; Fe ±200 ppm',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 8,
      targetTernak: ['Ayam Pedaging', 'Ayam Petelur', 'Babi', 'Ikan Budidaya'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Karena Ca sangat tinggi (6.5%), kurangi suplementasi Ca (kapur) saat menggunakan tepung rebon >5%. Batasi ≤5% untuk ayam muda (<4 minggu) karena kitin menghambat kecernaan. Cek kadar NaCl jika bahan berasal dari sisa terasi.',
    },
    harga: {
      estimasiAI: 8000, hargaMarketplace: 7000,
      satuan: 'per kg', supplier: 'Pengrajin terasi di Eretan, Indramayu, Brebes; pasar ikan sentra pantai utara Jawa',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 103',
        'Feedipedia (2024) — Shrimp meal (Acetes sp.)',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
        'Göhl, B. (1981) — Tropical Feeds. FAO, hal. 234',
      ],
      sumberData: 'Komposisi rata-rata tepung rebon kering dari sentra terasi pantai utara Jawa dan Kalimantan (Hartadi et al. 1997)',
      catatan: 'Kandungan kitin dan Ca sangat bervariasi tergantung ukuran rebon dan proporsi cangkang. Rebon dari produksi terasi mengandung NaCl lebih tinggi karena proses fermentasi dengan garam.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Rebon adalah sumber protein hewani lokal yang terjangkau dengan keunggulan Ca sangat tinggi (6.5% BK dari cangkang). Efektif sebagai pengganti parsial tepung ikan dan suplemen Ca-P sekaligus. Astaxanthin alami memberikan bonus pigmentasi kuning telur dan kulit ayam.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga 15–20% lebih murah dari tepung ikan. Ca 6.5% BK mengurangi kebutuhan kapur/CaCO3 dalam ransum ayam petelur. Tersedia dari industri terasi lokal sebagai by-product yang sering terbuang. Aroma kuat meningkatkan palatabilitas ransum.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kitin 5–8% BK menghambat pencernaan unggas — enzim kitinase tidak diproduksi oleh kebanyakan unggas. Batasi ≤5% untuk unggas muda. Kadar NaCl bervariasi tinggi pada produk dari industri terasi — perlu analisis sebelum digunakan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum ayam petelur: Tepung Rebon 5% + Jagung 52% + Bungkil kedelai 28% + Dedak 8% + Premix 3% + CaCO3 4% (kurangi setengah dari normal karena Ca rebon tinggi). Efektif dipadukan dengan bungkil kedelai untuk melengkapi asam amino.' },
      { type: 'peringatan', icon: '🚨', text: 'Ca 6.5% BK sangat tinggi — jika menggunakan >5% tepung rebon, kurangi penambahan CaCO3 secara signifikan untuk mencegah hiperkalsemia. Selalu cek NaCl jika bahan berasal dari sisa produksi terasi (bisa mencapai 8% NaCl).' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: Tepung Udang (protein lebih rendah, kitin lebih tinggi, harga serupa), Tepung Teri (protein lebih tinggi, harga lebih mahal), atau Tepung Keong Mas (lebih murah, protein lebih rendah sedikit).' },
    ],
  },

  // ── 4. Tepung Udang (Shrimp Meal) ────────────────────────────────────────────
  'tepung-udang': {
    sumberBahan: 'By-product industri pengolahan udang vaname dan windu: kepala, cangkang, dan ekor udang yang tidak dikonsumsi manusia — diperoleh dari pabrik udang beku dan pengalengan',
    bentuk: ['Tepung'],
    asal: 'Sentra udang budidaya: Lampung, Jawa Timur (Sidoarjo), Sulawesi Selatan (Barru, Pinrang), Kalimantan Selatan; by-product pabrik udang beku ekspor',
    metodePengolahan: 'Limbah udang (kepala+cangkang+ekor) dikumpulkan dari cold-storage → direbus untuk inaktivasi mikroba → dikeringkan dengan drum dryer atau sinar matahari → digiling menjadi tepung',
    ketersediaan: 'Tersedia sepanjang tahun dari pabrik udang beku — produksi udang Indonesia konsisten dan besar. Harga relatif terjangkau karena ini limbah industri; volume besar terutama dari Lampung dan Sulsel',
    kelebihan: 'By-product berlimpah dari industri udang ekspor besar; protein ±42% BK meski rendah dari tepung ikan; Ca tinggi dari cangkang; aroma dan palatabilitas baik untuk ikan dan udang budidaya; pigmen astaxanthin alami',
    kekurangan: 'Kitin ±15–20% BK dari cangkang sangat membatasi kecernaan — terutama pada unggas dan ternak monogastrik. Protein lebih rendah dari tepung ikan. Ca sangat tinggi (8.5%) dengan P relatif rendah — rasio Ca:P sangat tidak seimbang. Abu sangat tinggi (29% BK)',
    nutrisi: {
      bk: 91, kadarAir: 9,
      pk: 42.0, sk: 4.0, lk: 3.0, abu: 29.0, betn: 22.0,
      tdn: 56, me: 2295,
      ndf: 10.0, adf: 6.0,
      ca: 8.50, p: 1.50, mg: 0.25, na: 0.65, k: 0.55, cl: 0.80, s: 0.40,
      vitamin: 'Astaxanthin (karotenoid) signifikan sebagai pigmen dan antioksidan alami; vitamin B kompleks sedang',
      mineral: 'Ca sangat tinggi (8.5%) dari cangkang; P 1.5%; rasio Ca:P 5.7:1 (jauh tidak seimbang); Zn ±60 ppm; Cu ±50 ppm (lebih tinggi dari tepung ikan)',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 10,
      targetTernak: ['Ikan Budidaya', 'Udang', 'Ayam Pedaging', 'Babi'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'Paling efektif untuk pakan ikan dan udang yang mampu mencerna kitin lebih baik dari unggas. Pada unggas batasi ≤5% karena kitin tinggi. Hitung ulang suplementasi Ca — sangat mungkin overdosis Ca jika tidak dikurangi penambahan CaCO3.',
    },
    harga: {
      estimasiAI: 7000, hargaMarketplace: 6200,
      satuan: 'per kg', supplier: 'Cold storage udang di Lampung, Sidoarjo, Barru; pabrik pengolahan udang ekspor',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Shrimp meal (Penaeus sp.)',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 104',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
        'NRC (1993) — Nutrient Requirements of Fish. National Academies Press.',
      ],
      sumberData: 'Nilai komposisi shrimp meal dari by-product industri udang Indonesia (Hartadi et al. 1997 & Feedipedia 2024)',
      catatan: 'Kadar kitin dan Ca sangat bervariasi tergantung proporsi kepala vs cangkang vs ekor dalam bahan baku. Tepung udang dari kepala saja memiliki protein lebih tinggi (±50% BK) dibanding campuran kepala+cangkang+ekor.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Udang adalah by-product berlimpah dari industri udang ekspor Indonesia yang sangat besar. Fungsi utamanya sebagai sumber protein mid-range (42% BK) dan Ca tinggi (8.5%) untuk pakan akuakultur — udang dan ikan memanfaatkan kitin lebih baik dari unggas.' },
      { type: 'kelebihan', icon: '✅', text: 'Astaxanthin alami dari cangkang memberikan pigmentasi merah-oranye pada daging dan kulit ikan tanpa biaya tambahan. Aroma udang kuat meningkatkan konsumsi pakan ikan. Ca tinggi berguna untuk pembentukan cangkang pada udang budidaya.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kitin 15–20% BK adalah pembatas utama — unggas tidak punya enzim kitinase, sehingga kecernaan protein pada unggas jauh lebih rendah dari angka proxy-nya. Selalu pertimbangkan ini saat formulasi unggas.' },
      { type: 'kombinasi', icon: '🔗', text: 'Pakan ikan nila: Tepung Udang 10% + Tepung Ikan 8% + Bungkil kedelai 25% + Jagung 45% + Tepung Tapioka 8% + Premix 4%. Pakan udang vaname: Tepung Udang 15% + Tepung Cumi 5% + Tepung Ikan 10% + Protein nabati 65% + Premix 5%.' },
      { type: 'peringatan', icon: '🚨', text: 'Rasio Ca:P 5.7:1 sangat tidak seimbang — hampir seluruh formulasi perlu mengurangi kapur dan menambah sumber P. Pada unggas batasi ≤5% dan kombinasikan dengan fitase untuk memaksimalkan kecernaan P. Simpan sejuk untuk mencegah pembusukan protein cangkang.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: Tepung Rebon (lebih murah, protein lebih tinggi, kitin lebih rendah), Tepung Kepiting (serupa profil), atau Tepung Ikan (protein lebih tinggi, kitin tidak ada, harga lebih tinggi).' },
    ],
  },

  // ── 5. Tepung Cumi (Squid Meal) ───────────────────────────────────────────────
  'tepung-cumi': {
    sumberBahan: 'By-product industri pengolahan cumi: kepala, tentakel, kulit, dan jeroan cumi-cumi yang tidak dikonsumsi manusia; juga dari cumi segar grade rendah yang tidak laku pasar',
    bentuk: ['Tepung'],
    asal: 'Sentra cumi: Muncar (Banyuwangi), Palabuhanratu, Brondong (Lamongan), Kendari, Ambon; impor dari Argentina, Peru, dan Jepang',
    metodePengolahan: 'Sisa cumi (jeroan + kepala + kulit) dikumpulkan dari pabrik pengolahan → dikukus → dikeringkan (sinar matahari atau dryer) → digiling. Minyak cumi sering diekstrak terlebih dahulu.',
    ketersediaan: 'Ketersediaan fluktuatif mengikuti musim cumi (Mei–September puncak di Indonesia). Impor dari Argentina dan Peru lebih stabil. Harga relatif tinggi karena volume by-product cumi lebih terbatas dari ikan.',
    kelebihan: 'Taurin sangat tinggi — asam amino non-esensial yang kritis untuk fungsi jantung, retina, dan sistem saraf terutama pada kucing dan anjing; palatable sangat baik sebagai feed attractant untuk ikan; protein ±58% BK dengan profil asam amino baik; hampir tidak ada kitin (berbeda dari udang/kepiting)',
    kekurangan: 'Harga premium — 25–30% lebih mahal dari tepung ikan lokal; ketersediaan tidak konsisten; kandungan logam berat (Pb, Cd) lebih tinggi dari tepung ikan karena cumi sering dari laut dalam; oksidasi lipid cepat karena DHA/EPA tinggi',
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 58.0, sk: 0.5, lk: 5.5, abu: 13.5, betn: 22.5,
      tdn: 68, me: 2788,
      ndf: 1.5, adf: 0.8,
      ca: 1.50, p: 1.80, mg: 0.15, na: 0.85, k: 0.75, cl: 0.95, s: 0.50,
      vitamin: 'Taurin sangat tinggi (±8–12 g/kg BK); Vitamin B12 tinggi; omega-3 (DHA, EPA) tinggi dalam fraksi lipid',
      mineral: 'Ca 1.5% dan P 1.8% — rasio Ca:P 0.83:1 (sedikit defisit Ca, perlu suplementasi); Zn ±80 ppm; Se ±2 ppm',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 8,
      targetTernak: ['Ikan Budidaya', 'Udang', 'Ayam Pedaging', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Terutama efektif sebagai feed attractant untuk ikan laut (kerapu, kakap, ikan hias) dan udang yang merespons sangat baik terhadap aroma cumi. Taurin sangat dianjurkan untuk ransum kucing dan anjing. Batasi ≤3% pada pakan simpan panjang karena minyak cumi mudah tengik.',
    },
    harga: {
      estimasiAI: 12000, hargaMarketplace: 11000,
      satuan: 'per kg', supplier: 'Pengolah cumi di Muncar, Brondong; importir pakan dari Surabaya dan Jakarta',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Squid meal',
        'NRC (1993) — Nutrient Requirements of Fish. National Academies Press.',
        'Hardy, R.W. (2010). Utilization of plant proteins in fish diets. Aquaculture Research.',
        'Kalogeropoulos, N. et al. (2012). Taurine in squid by-products. Food Chemistry.',
      ],
      sumberData: 'Nilai nutrisi berdasarkan Feedipedia (2024) dan analisis by-product cumi dari pabrik Indonesia; taurin dari Kalogeropoulos et al. (2012)',
      catatan: 'Komposisi tepung cumi sangat tergantung bahan baku (jeroan saja vs campuran). Jeroan cumi (liver) memiliki protein lebih rendah tapi DHA jauh lebih tinggi. Ukur kadar logam berat (Cd, Pb) pada tepung cumi laut dalam.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Cumi adalah sumber taurin terbaik dalam pakan ternak — kadar taurin 8–12 g/kg BK jauh lebih tinggi dari sumber protein lain. Taurin esensial untuk perkembangan retina, fungsi jantung, dan sistem imun pada ikan, kucing, dan anjing. Juga berfungsi sebagai feed attractant premium.' },
      { type: 'kelebihan', icon: '✅', text: 'Hampir tidak mengandung kitin (berbeda dari udang/kepiting) sehingga kecernaan protein lebih tinggi. Kandungan DHA dan EPA tinggi dalam minyak cumi mendukung perkembangan otak dan sistem imun ikan laut. Palatabilitas sangat superior untuk pakan ikan kerapu dan kakap.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga 25–30% lebih mahal dari tepung ikan. Risiko logam berat (Cd, Pb) lebih tinggi dari cumi laut dalam — selalu minta analisis logam berat dari supplier. DHA/EPA mudah teroksidasi — tambahkan antioksidan (etoksikuin atau vitamin E) saat formulasi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Pakan ikan kerapu: Tepung Cumi 8% + Tepung Ikan 15% + Bungkil kedelai 20% + Jagung 40% + Minyak ikan 5% + Premix 12%. Sangat efektif dikombinasi dengan minyak cumi untuk pakan ikan hias laut sebagai sumber nutrisi premium.' },
      { type: 'peringatan', icon: '🚨', text: 'Perhatikan logam berat (Cadmium terutama) pada cumi dari laut dalam — ini regulasi penting untuk ekspor produk akuakultur. Simpan di suhu rendah karena DHA/EPA sangat cepat teroksidasi. Jangan campur dengan sumber heat berlebih saat mixing.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk attractor: Tepung Teri (lebih murah, palatabilitas hampir sama). Untuk taurin: tambahkan taurin sintetis (jauh lebih efisien biaya). Untuk pakan ikan laut: kombinasi Tepung Ikan grade tinggi + minyak ikan omega-3.' },
    ],
  },

  // ── 6. Tepung Kepiting (Crab Meal) ───────────────────────────────────────────
  'tepung-kepiting': {
    sumberBahan: 'By-product industri pengolahan kepiting (Portunus pelagicus) dan rajungan — cangkang, capit, dan residu daging dari proses peeling dan canning',
    bentuk: ['Tepung'],
    asal: 'Sentra kepiting dan rajungan: Indramayu, Cirebon, Lampung, Kalimantan Selatan; pabrik pengolahan rajungan ekspor (crab canning)',
    metodePengolahan: 'Cangkang dan sisa kepiting dari pabrik canning → dikeringkan (sinar matahari atau oven) → digiling → tepung kasar atau halus. Bisa juga dari rajungan rebus sisa ekstraksi daging.',
    ketersediaan: 'Tersedia dari pabrik pengolahan rajungan ekspor di Indramayu dan Cirebon. Musiman — puncak musim kepiting April–Juli. Volume lebih terbatas dibanding by-product udang.',
    kelebihan: 'Harga lebih murah dari tepung ikan dan udang; Ca sangat tinggi dari cangkang (±12% BK); palatabilitas baik untuk pakan akuakultur; astaxanthin alami untuk pigmentasi; by-product yang sebelumnya sering dibuang (nilai tambah dari limbah)',
    kekurangan: 'Kitin sangat tinggi (±20–25% BK) — salah satu kandungan kitin tertinggi di antara sumber protein hewani; protein hanya ±38% BK; Abu sangat tinggi (35% BK) dari cangkang; nilai nutrisi lebih rendah dari tepung ikan dan udang; kecernaan terbatas pada unggas',
    nutrisi: {
      bk: 91, kadarAir: 9,
      pk: 38.0, sk: 3.0, lk: 2.5, abu: 35.0, betn: 21.5,
      tdn: 48, me: 1968,
      ndf: 12.0, adf: 8.0,
      ca: 12.0, p: 1.20, mg: 0.28, na: 0.70, k: 0.50, cl: 0.85, s: 0.38,
      vitamin: 'Astaxanthin alami (karotenoid) — pigmen merah-oranye; Vitamin B12 rendah',
      mineral: 'Ca sangat tinggi (12%) dari cangkang kepiting; P sangat rendah (1.2%); rasio Ca:P 10:1 (jauh tidak seimbang — butuh suplementasi P); Zn ±55 ppm; Cu ±65 ppm (lebih tinggi dari tepung ikan)',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 8,
      targetTernak: ['Ikan Budidaya', 'Udang', 'Ayam Pedaging'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'Terutama untuk pakan akuakultur — udang dan kepiting dapat mencerna kitin lebih baik. Pada unggas batasi ≤5%. Rasio Ca:P 10:1 memerlukan suplementasi P organik atau anorganik yang signifikan. Jangan gunakan sebagai sumber protein utama — lebih baik sebagai suplemen mineral Ca.',
    },
    harga: {
      estimasiAI: 6500, hargaMarketplace: 5800,
      satuan: 'per kg', supplier: 'Pabrik pengolahan rajungan di Indramayu, Cirebon; pengepul cangkang kepiting di Kalimantan Selatan',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Crab meal',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 105',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Nilai komposisi crab meal dari Feedipedia (2024) dan JIRCAS (2013); Ca dan kitin dari analisis cangkang rajungan lokal',
      catatan: 'Kandungan kitin dan mineral sangat bergantung pada proporsi daging vs cangkang dalam bahan baku. Crab meal dari pabrik canning (banyak cangkang) lebih tinggi kitin dan Ca dibanding dari hasil ekstraksi manual.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Kepiting berfungsi utama sebagai sumber mineral Ca (12% BK) dan suplemen protein mid-range (38% BK) dalam pakan akuakultur. Astaxanthin alami memberikan pigmentasi merah-oranye pada ikan dan udang budidaya tanpa pigmen sintetis.' },
      { type: 'kelebihan', icon: '✅', text: 'Memanfaatkan limbah industri canning yang sebelumnya dibuang. Harga ekonomis. Ca sangat tinggi berguna untuk udang dan kepiting budidaya dalam pembentukan exoskeleton pasca molting. Aroma khas kepiting meningkatkan palatabilitas pakan akuakultur.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kitin 20–25% BK adalah pembatas utama — kecernaan pada unggas sangat terbatas. TDN hanya 48% BK — terendah di antara sumber protein hewani utama. Rasio Ca:P 10:1 hampir selalu memerlukan suplementasi P tambahan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Pakan udang vaname: Tepung Kepiting 10% + Tepung Ikan 15% + Bungkil kedelai 25% + Jagung 40% + Minyak 5% + Premix 5% (kurangi CaCO3 dari formula normal). Untuk unggas: kombinasikan ≤5% dengan fitase untuk memaksimalkan kecernaan protein dan P.' },
      { type: 'peringatan', icon: '🚨', text: 'Rasio Ca:P 10:1 hampir selalu menyebabkan defisit P jika digunakan dalam jumlah signifikan — selalu tambahkan sumber P (DCP, MCP, atau phytase) saat menggunakan tepung kepiting. Pada unggas batasi ketat ≤5%.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk pakan akuakultur: Tepung Udang (protein lebih tinggi, kitin lebih rendah). Untuk sumber Ca: Tepung Tulang (Ca lebih murni, P lebih tinggi). Untuk sumber protein utama: Tepung Ikan (protein lebih tinggi, kecernaan lebih baik).' },
    ],
  },

  // ── 7. Silase Ikan (Fish Silage) ──────────────────────────────────────────────
  'silase-ikan': {
    sumberBahan: 'Ikan segar utuh atau sisa industri perikanan (ikan rucah, limbah pengolahan) yang diawetkan secara kimiawi dengan asam organik atau secara biologis dengan bakteri asam laktat',
    bentuk: ['Cair', 'Segar'],
    asal: 'Diproduksi langsung di sentra perikanan dari ikan yang tidak terjual atau ikan tangkapan kecil; Norwegia dan Peru sebagai sentra produksi skala industri; Indonesia umumnya produksi mandiri peternak',
    metodePengolahan: 'Metode asam kimia: ikan segar + asam format (1–2%) atau asam propionat → campuran fermentasi 3–7 hari → silase siap pakai. Metode biologi: ikan + bakteri asam laktat + molases → fermentasi anaerobik 7–14 hari. Protein terlarut dalam cairan.',
    ketersediaan: 'Diproduksi mandiri — tidak tersedia komersial secara luas di Indonesia. Sangat ekonomis jika dibuat sendiri di dekat sentra perikanan. Modal: asam format atau molases + wadah anaerob + ikan segar.',
    kelebihan: 'Biaya produksi sangat rendah jika menggunakan ikan rucah lokal; protein ±52% BK mudah dicerna (protein sudah terurai sebagian); palatabilitas baik untuk babi dan ikan; lebih mudah disimpan dari ikan segar; mengurangi limbah pengolahan ikan',
    kekurangan: 'BK sangat rendah (as-fed ±25–35%) — volume besar untuk transport dan penyimpanan; bau asam yang kuat dapat mengganggu; tidak tersedia komersial di Indonesia; harus diproduksi sendiri; dosis asam harus tepat untuk mencegah pembusukan',
    nutrisi: {
      bk: 30, kadarAir: 70,
      pk: 52.0, sk: 0.0, lk: 12.0, abu: 19.0, betn: 17.0,
      tdn: 68, me: 2788,
      ndf: 1.0, adf: 0.5,
      ca: 2.50, p: 1.80, mg: 0.16, na: 0.70, k: 0.85, cl: 0.75, s: 0.50,
      vitamin: 'Vitamin B12 tinggi; protein terlarut kaya histidin dan asam glutamat; omega-3 DHA dan EPA dari lipid ikan',
      mineral: 'Ca 2.5% BK dan P 1.8% BK — rasio Ca:P 1.4:1; profil mineral mirip tepung ikan namun pada basis yang jauh lebih lembab (nilai as-fed sangat berbeda dari DM basis)',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 20,
      targetTernak: ['Babi', 'Ikan Budidaya', 'Ayam Pedaging'],
      programCocok: ['Penggemukan', 'Grower', 'Menyusui'],
      catatan: 'Nilai % penggunaan mengacu pada basis DM (setara ±60% ransum as-fed). Terutama efektif untuk peternak babi yang dekat sentra perikanan. Campurkan dengan bahan padat (jagung giling, dedak) untuk mengurangi kelembaban ransum. Simpan dalam wadah tertutup anaerob — terpapar udara menyebabkan pembusukan.',
    },
    harga: {
      estimasiAI: 3500, hargaMarketplace: null,
      satuan: 'per kg as-fed (produksi mandiri)', supplier: 'Produksi mandiri dari ikan rucah lokal; tidak tersedia komersial di Indonesia',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Raa, J. & Gildberg, A. (1982). Fish silage: a review. CRC Critical Reviews in Food Science and Nutrition.',
        'Feedipedia (2024) — Fish silage',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 316',
        'Pond et al. (1995) — Basic Animal Nutrition and Feeding 4th Ed.',
      ],
      sumberData: 'Nilai nutrisi pada DM basis dari Feedipedia (2024) dan Raa & Gildberg (1982); BK as-fed ±30% sesuai produksi mandiri',
      catatan: 'Nilai nutrisi sangat bervariasi tergantung bahan baku ikan dan metode produksi. Silase kimia (asam format) lebih konsisten dari silase biologis. Nilai as-fed perlu dikalikan faktor konversi BK untuk perbandingan dengan bahan pakan kering.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Silase Ikan mengubah ikan rucah murah dan limbah perikanan menjadi sumber protein mudah-cerna dengan biaya produksi sangat rendah. Protein sudah terurai sebagian (peptida pendek) sehingga mudah diserap usus — kecernaan lebih tinggi dari tepung ikan pada babi dan ikan.' },
      { type: 'kelebihan', icon: '✅', text: 'Dapat diproduksi mandiri dengan modal minimal (asam format + ikan rucah + drum plastik). Sangat ekonomis untuk peternak babi dan ikan yang dekat pantai. Mengurangi biaya pakan secara signifikan dibanding tepung ikan komersial.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK as-fed hanya 25–35% — 3× lebih berat dari tepung ikan kering untuk jumlah protein yang sama. Bau asam yang kuat memerlukan manajemen lokasi penyimpanan. Tidak tersedia komersial — harus diproduksi sendiri dengan teknik yang benar.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum babi grower sederhana: Silase Ikan (as-fed 15%) + Jagung giling 50% + Dedak 25% + Bungkil kelapa 8% + Mineral 2%. Ransum ikan nila: Silase Ikan 20% DM + Bungkil kedelai 25% + Jagung 40% + Dedak 12% + Premix 3%.' },
      { type: 'peringatan', icon: '🚨', text: 'pH silase harus <4.5 agar aman disimpan — ukur dengan pH meter atau kertas lakmus. Silase yang berbau busuk (bukan bau asam) berarti fermentasi gagal dan harus dibuang. Jangan campur silase segar dengan ransum kering terlalu awal sebelum pemberian.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika tidak bisa produksi mandiri: Tepung Ikan lokal grade rendah (lebih mahal tapi lebih praktis), atau Ampas Tahu + Bungkil kedelai untuk pemenuhan protein tanpa bahan hewani.' },
    ],
  },

  // ── 8. Tepung Daging (Meat Meal) ──────────────────────────────────────────────
  'tepung-daging': {
    sumberBahan: 'Daging, jaringan lunak, dan organ dalam hewan ternak (sapi, babi, unggas) yang telah dipisahkan dari tulang — by-product rumah potong hewan (RPH) dan industri rendering',
    bentuk: ['Tepung'],
    asal: 'RPH besar di kota-kota industri: Jakarta, Surabaya, Medan, Makassar; industri rendering terpadu dari pabrik pengolahan daging; impor dari Australia dan Amerika',
    metodePengolahan: 'Jaringan lunak (daging, organ, lemak) dikumpulkan dari RPH → dimasak (steam rendering) pada suhu 115–145°C → dipres untuk memisahkan tallow (lemak render) → dikeringkan → digiling → tepung',
    ketersediaan: 'Tersedia dari industri rendering nasional meski volumenya lebih terbatas dibanding MBM. Impor tersedia dari Australia (high-quality meat meal). Harga lebih tinggi dari MBM karena proses lebih selektif.',
    kelebihan: 'Protein ±52% BK dengan lisina ±3% BK — profil asam amino lebih baik dari MBM; kandungan mineral (Ca, P) lebih rendah dan lebih seimbang dari MBM; kecernaan protein lebih baik dari MBM karena proporsi jaringan lunak lebih tinggi; palatabilitas baik',
    kekurangan: 'Lebih mahal dari MBM; kualitas sangat variabel tergantung bahan baku RPH (persentase daging vs tulang memengaruhi nilai gizi); di Indonesia dilarang untuk ransum ruminansia (pencegahan BSE); akses bahan baku terbatas di luar kota industri',
    nutrisi: {
      bk: 94, kadarAir: 6,
      pk: 52.0, sk: 2.0, lk: 11.0, abu: 28.0, betn: 7.0,
      tdn: 68, me: 2788,
      ndf: 4.0, adf: 2.5,
      ca: 2.00, p: 1.60, mg: 0.22, na: 0.60, k: 0.70, cl: 0.55, s: 0.55,
      vitamin: 'Vitamin B12 tinggi; Niasin sedang; Vitamin B6 sedang; sangat kurang vitamin yang larut lemak (A, D, E)',
      mineral: 'Ca 2.0% dan P 1.6% — rasio Ca:P 1.25:1 (relatif seimbang); Zn ±95 ppm; Fe ±260 ppm; Mn ±15 ppm',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 10,
      targetTernak: ['Ayam Pedaging', 'Ayam Petelur', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Menyusui'],
      catatan: 'DILARANG untuk ransum ruminansia (pencegahan BSE/prion). Aman untuk unggas dan babi. Batasi ≤10% pada unggas. Kualitas sangat variabel — minta COA dan verifikasi protein kasar serta lisina. Grade tinggi (protein >54%) dari sumber terpercaya untuk ransum premium.',
    },
    harga: {
      estimasiAI: 10000, hargaMarketplace: 9000,
      satuan: 'per kg', supplier: 'Industri rendering RPH besar di Jakarta, Surabaya; importir pakan Australia',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Meat meal',
        'NRC (1994) — Nutrient Requirements of Poultry, 9th Ed.',
        'NRC (2012) — Nutrient Requirements of Swine, 11th Ed.',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 314',
      ],
      sumberData: 'Nilai dari Feedipedia (2024) dan NRC (1994) untuk meat meal grade ±52% CP; nilai Ca dan P disesuaikan dengan standar grade reguler',
      catatan: 'Tepung Daging (Meat Meal) ≠ Tepung Daging & Tulang (MBM). Meat Meal memiliki Ca lebih rendah (<4.4%) dan protein lebih tinggi dari MBM. Pastikan spesifikasi jelas saat memesan dari supplier.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Daging adalah sumber protein hewani dari jaringan lunak RPH dengan profil asam amino lebih seimbang dari MBM. Protein 52% BK dengan lisina 3% BK melengkapi ransum berbasis bungkil kedelai yang sering defisit metionin-sistein.' },
      { type: 'kelebihan', icon: '✅', text: 'Rasio Ca:P 1.25:1 lebih seimbang dari MBM — tidak terlalu membutuhkan koreksi mineral besar. Protein berkualitas lebih tinggi dari MBM karena proporsi jaringan lunak lebih dominan. Vitamin B12 tinggi mendukung sintesis sel darah merah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kualitas sangat variabel antar batch dan supplier — SELALU minta COA dan verifikasi protein. Dilarang untuk ruminansia (BSE). Lemak 11% BK mempercepat ketengikan — simpan sejuk dan gunakan dalam 3 bulan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum ayam petelur: Tepung Daging 7% + Jagung 52% + Bungkil kedelai 28% + Dedak 8% + CaCO3 5% — kombinasi ini lebih hemat dibanding tepung ikan dengan profil asam amino mendekati. Kombinasikan dengan metionin DL-Met 0.1% untuk optimasi.' },
      { type: 'peringatan', icon: '🚨', text: 'DILARANG KERAS untuk ransum sapi, kambing, domba, dan ruminansia lainnya (risiko BSE/prion). Pastikan tidak ada kontaminasi silang di pabrik pakan yang memproduksi ransum ruminansia dan nonruminansia secara bersamaan.' },
      { type: 'alternatif', icon: '🔄', text: 'Tepung Daging & Tulang (MBM) — lebih murah, Ca/P lebih tinggi. Tepung Unggas — lebih mudah didapat, profil asam amino berbeda. Tepung Ikan — protein lebih tinggi, kecernaan lebih baik, harga lebih tinggi.' },
    ],
  },

  // ── 9. Tepung Daging & Tulang (MBM) ──────────────────────────────────────────
  'meat-bone-meal': {
    sumberBahan: 'By-product rendering gabungan dari RPH: daging, jaringan lunak, dan tulang hewan ternak (sapi, babi, unggas) yang diproses bersama tanpa pemisahan tulang terlebih dahulu',
    bentuk: ['Tepung'],
    asal: 'Industri rendering RPH skala besar di Jakarta, Surabaya, Medan; impor dari Australia (grade beef), Amerika Serikat, dan Brasil',
    metodePengolahan: 'Seluruh sisa RPH (daging, tulang, organ) dicampur → dimasak (continuous rendering 115–145°C) → dipres (pisahkan tallow) → dikeringkan → digiling. Semua fraksi — termasuk tulang — ikut digiling.',
    ketersediaan: 'Tersedia dari industri rendering — volume lebih besar dari tepung daging karena tidak memisahkan tulang. Impor cukup aktif dari Australia. Harga lebih murah dari meat meal karena proporsi tulang tinggi.',
    kelebihan: 'Harga lebih murah dari tepung daging dan tepung ikan; sumber mineral Ca (±9.5% BK) dan P (±4.5% BK) yang signifikan di samping protein; tersedia dalam volume besar dari industri rendering; protein ±47% BK cukup untuk ransum unggas dan babi',
    kekurangan: 'Dilarang untuk ruminansia (risiko BSE/prion) di banyak negara termasuk Indonesia; kecernaan protein lebih rendah dari tepung daging karena proses rendering suhu tinggi; lisina terdegradasi saat rendering (Maillard reaction); kualitas sangat bervariasi; bau kuat',
    nutrisi: {
      bk: 93, kadarAir: 7,
      pk: 47.0, sk: 2.0, lk: 10.0, abu: 34.0, betn: 7.0,
      tdn: 63, me: 2583,
      ndf: 4.5, adf: 3.0,
      ca: 9.50, p: 4.50, mg: 0.28, na: 0.55, k: 0.60, cl: 0.50, s: 0.52,
      vitamin: 'Vitamin B12 sedang; Niasin rendah; vitamin larut lemak sangat rendah setelah rendering suhu tinggi',
      mineral: 'Ca 9.5% dan P 4.5% BK — suplementasi mineral makro yang signifikan; rasio Ca:P 2.1:1; Zn ±100 ppm; Fe ±280 ppm; Mn ±18 ppm; F (fluorida) ±1000 ppm — perhatikan batas fluorida',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 8,
      targetTernak: ['Ayam Pedaging', 'Ayam Petelur', 'Babi'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'DILARANG untuk ruminansia (BSE). Batasi ≤5–8% pada unggas karena kecernaan protein dan bau. Hitung kontribusi Ca dan P dari MBM — sangat mungkin mengurangi atau menghilangkan kebutuhan suplementasi DCP/MCP dan kapur. Perhatikan kadar fluorida (F) jika tepung tulang berlebih dalam bahan baku.',
    },
    harga: {
      estimasiAI: 8000, hargaMarketplace: 7200,
      satuan: 'per kg', supplier: 'Industri rendering Jakarta, Surabaya, Medan; importir pakan Australia',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Meat and bone meal',
        'NRC (1994) — Nutrient Requirements of Poultry, 9th Ed.',
        'NRC (2012) — Nutrient Requirements of Swine, 11th Ed.',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 315',
        'Pond et al. (1995) — Basic Animal Nutrition 4th Ed.',
      ],
      sumberData: 'Nilai nutrisi grade MBM ±47% CP dari Feedipedia (2024) dan NRC (1994); Ca dan P dari analisis tulang ternak Indonesia',
      catatan: 'MBM grade AAFCO didefinisikan Ca ≤2.2× P dan P >4%. Grade Indonesia bervariasi tergantung proporsi tulang. Selalu verifikasi Ca, P, dan F dari supplier.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'MBM adalah sumber protein, Ca, dan P sekaligus — kombinasi yang efisien untuk formulasi ransum unggas dan babi. Ca 9.5% BK dan P 4.5% BK dapat mengurangi atau mengeliminasi kebutuhan DCP/MCP dan kapur dalam formulasi.' },
      { type: 'kelebihan', icon: '✅', text: 'Nilai ekonomis terbaik di antara sumber protein hewani — protein 47% BK + mineral Ca/P dalam satu bahan. Tersedia dalam volume besar dari industri rendering. Cocok untuk formulasi ekonomis ransum broiler fase grower.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Rendering suhu tinggi menurunkan ketersediaan lisina (Maillard reaction antara lisina dan gula pereduksi). Kadar fluorida (F) tinggi (~1000 ppm) dapat menjadi masalah jika proporsi tulang sangat tinggi dalam bahan baku. Kualitas sangat tidak konsisten.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum broiler grower ekonomis: MBM 5% + Jagung 58% + Bungkil kedelai 28% + Dedak 6% + Premix 3% — hindari penambahan DCP dan kapur karena MBM sudah menyumbang Ca dan P yang cukup. Verifikasi balance Ca:P setelah formulasi.' },
      { type: 'peringatan', icon: '🚨', text: 'DILARANG KERAS untuk sapi, kambing, domba (prion/BSE). Gunakan formulasi terpisah untuk ransum ruminansia dan nonruminansia, dan pastikan tidak ada kontaminasi silang di pabrik pakan. Selalu sertakan bukti sumber bahan bukan ruminansia.' },
      { type: 'alternatif', icon: '🔄', text: 'Tepung Daging — protein lebih tinggi, Ca/P lebih rendah, harga lebih tinggi. Untuk sumber Ca+P saja: DCP atau MCP (lebih murni dan konsisten). Untuk sumber protein: Bungkil kedelai (nabati, aman untuk ruminansia).' },
    ],
  },

  // ── 10. Tepung Tulang (Bone Meal) ─────────────────────────────────────────────
  'tepung-tulang': {
    sumberBahan: 'Tulang hewan ternak (sapi, babi, unggas) dari RPH yang dikukus/dipres dan digiling — digunakan terutama sebagai suplemen mineral, bukan sumber protein utama',
    bentuk: ['Tepung'],
    asal: 'RPH besar: Jakarta, Surabaya, Medan, Makassar; by-product industri rendering dan pengolahan daging',
    metodePengolahan: 'Tulang dari RPH → dikukus (steam rendering) untuk inaktivasi patogen dan sterilisasi → dipres untuk ekstraksi tallow → dikeringkan (drum dryer) → digiling halus menjadi tepung',
    ketersediaan: 'Tersedia dari industri rendering RPH; volume cukup besar dari RPH kota industri besar. Juga tersedia sebagai produk impor berstandar tinggi dari Australia. Harga relatif murah karena mineral berlimpah.',
    kelebihan: 'Ca sangat tinggi (±29% BK) dan P bioavailable tinggi (±13% BK) — suplemen mineral Ca:P paling alami dan bioavailable; rasio Ca:P 2.2:1 mendekati ideal untuk ternak; harga jauh lebih murah dari DCP/MCP komersial per unit Ca+P; palatabilitas netral',
    kekurangan: 'Protein sangat rendah (±12% BK) dan kualitas rendah — tidak dapat diandalkan sebagai sumber protein; fluorida (F) relatif tinggi dari tulang (perlu hati-hati pada penggunaan tinggi); kualitas variabel tergantung umur dan jenis tulang; DILARANG untuk ruminansia (BSE)',
    nutrisi: {
      bk: 95, kadarAir: 5,
      pk: 12.0, sk: 1.0, lk: 4.0, abu: 74.0, betn: 9.0,
      tdn: 28, me: 1148,
      ndf: 2.5, adf: 1.5,
      ca: 29.0, p: 13.0, mg: 0.55, na: 0.25, k: 0.20, cl: 0.18, s: 0.28,
      vitamin: 'Kandungan vitamin sangat rendah setelah rendering suhu tinggi; tidak signifikan sebagai sumber vitamin',
      mineral: 'Ca 29% BK — tertinggi di antara semua sumber pakan. P 13% BK, bioavailabilitas P ±65–70%. Rasio Ca:P 2.23:1 mendekati ideal. F ±2000 ppm — perhatikan batas maksimum F dalam ransum. Mg 0.55% cukup tinggi.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 3,
      targetTernak: ['Ayam Pedaging', 'Ayam Petelur', 'Babi', 'Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui', 'Bunting'],
      catatan: 'Digunakan TERUTAMA sebagai suplemen mineral Ca dan P (seperti DCP), bukan sumber protein. Batasi ≤2–3% ransum karena kandungan fluorida tinggi (F >2000 ppm). Pada ruminansia: pastikan bahan baku BUKAN dari ruminansia (BSE). Gantikan DCP dengan tepung tulang untuk penghematan biaya mineral.',
    },
    harga: {
      estimasiAI: 5000, hargaMarketplace: 4200,
      satuan: 'per kg', supplier: 'Industri rendering RPH kota besar; toko bahan pakan ternak',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 107',
        'Feedipedia (2024) — Bone meal, steamed',
        'NRC (2016) — Nutrient Requirements of Beef Cattle 8th Ed.',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 316',
      ],
      sumberData: 'Nilai Ca, P, dan mineral dari Hartadi et al. (1997) dan Feedipedia (2024) untuk steamed bone meal; F dari analisis tulang sapi Indonesia',
      catatan: 'Tepung Tulang berbeda dari Dicalcium Phosphate (DCP) — tepung tulang dari tulang hewan, DCP dari sumber mineral tambang. Keduanya sebanding secara fungsional; tepung tulang lebih murah tapi lebih bervariasi kualitasnya.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Tulang berfungsi UTAMA sebagai suplemen mineral Ca dan P, bukan sumber protein. Ca 29% BK dan P 13% BK dengan rasio Ca:P 2.23:1 mendekati rasio ideal (2:1) untuk ternak. Sering dipakai sebagai pengganti ekonomis DCP atau MCP komersial.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga per unit Ca+P jauh lebih murah dari DCP/MCP komersial. Bioavailabilitas P dari tepung tulang kukus ±65–70% — cukup baik. Mg 0.55% BK merupakan bonus mineral yang tidak ada pada DCP. Mudah didapat dari RPH lokal.' },
      { type: 'kekurangan', icon: '⚠️', text: 'F (fluorida) ±2000 ppm lebih tinggi dari DCP — batas maksimum F dalam ransum ayam adalah 150 ppm, jadi tepung tulang tidak bisa digunakan >0.75% tanpa risiko fluorosis. Hitung kontribusi F secara teliti.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan 1.5–2% tepung tulang sebagai pengganti DCP dalam ransum ayam petelur (Ca 29% × 2% = 0.58% Ca dari tepung tulang — setara DCP 3%). Untuk ruminansia (bahan non-ruminansia): 1% tepung tulang menambah Ca 0.29% dan P 0.13% ransum.' },
      { type: 'peringatan', icon: '🚨', text: 'Kadar F tinggi (2000 ppm) memerlukan kalkulasi cermat — batasi ≤2% ransum untuk menghindari fluorosis (kerusakan gigi dan tulang). Untuk ruminansia: WAJIB gunakan tepung tulang dari non-ruminansia (sertifikasi supplier) untuk menghindari BSE.' },
      { type: 'alternatif', icon: '🔄', text: 'DCP (Dicalcium Phosphate) — lebih murni, F lebih rendah, harga lebih tinggi. MCP (Monocalcium Phosphate) — P lebih tinggi, lebih mahal. Kapur (CaCO3) — untuk Ca saja tanpa P. Tepung Cangkang Kerang — Ca tinggi, P rendah, harga murah.' },
    ],
  },

  // ── 11. Tepung Darah (Blood Meal) ─────────────────────────────────────────────
  'tepung-darah': {
    sumberBahan: 'Darah segar dari RPH (sapi, babi, unggas) yang dikumpulkan saat penyembelihan, kemudian dikeringkan menjadi tepung',
    bentuk: ['Tepung'],
    asal: 'RPH besar di kota industri: Jakarta (RPH Cakung), Surabaya, Makassar, Medan; pabrik pengolahan darah dari RPH unggas (ayam pedaging)',
    metodePengolahan: 'Darah segar dikumpulkan dalam tangki → dikoagulasi (panas atau agensia koagulasi) → dikeringkan dengan beberapa metode: drum drying (ring dried), flash drying, atau spray drying. Metode drying memengaruhi kecernaan secara signifikan.',
    ketersediaan: 'Tersedia dari RPH besar secara rutin; volume dari RPH unggas besar lebih konsisten. Harga lebih mahal dari MBM karena proses pengeringan lebih mahal. Flash-dried dan spray-dried lebih mahal dari drum-dried.',
    kelebihan: 'Protein tertinggi di antara semua sumber protein hewani komersial (±82% BK); lisina sangat tinggi (±8% BK) — solusi utama defisit lisina tanpa biaya lysine sintetis; harganya lebih ekonomis dari lysine murni per satuan protein',
    kekurangan: 'Palatabilitas sangat buruk — bau dan rasa tidak disukai ternak; isoleucine sangat rendah (±0.9% BK) — pembatas asam amino utama; kecernaan protein sangat bervariasi tergantung metode drying (drum dried kecernaan rendah, spray dried lebih baik); kandungan lemak dan vitamin sangat rendah',
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 82.0, sk: 0.5, lk: 1.0, abu: 4.5, betn: 12.0,
      tdn: 76, me: 3116,
      ndf: 1.0, adf: 0.5,
      ca: 0.30, p: 0.25, mg: 0.08, na: 0.35, k: 0.10, cl: 0.22, s: 0.48,
      vitamin: 'Vitamin B12 sangat tinggi; Riboflavin (B2) tinggi; Niasin sedang; sangat miskin vitamin larut lemak (A, D, E, K)',
      mineral: 'Ca dan P sangat rendah — WAJIB suplementasi mineral lengkap. Rasio Ca:P 1.2:1 sudah seimbang tapi keduanya rendah. Fe sangat tinggi (±2000 ppm) dari hemoglobin — ini sumber Fe alami terbaik. Zn ±25 ppm rendah.',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 5,
      targetTernak: ['Ayam Pedaging', 'Babi', 'Sapi Potong', 'Kambing'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Batasi ≤5% ransum karena palatabilitas buruk — selalu campur dengan bahan palatable (molases, onggok). Untuk mengatasi defisit isoleucine: tambahkan sumber isoleucine (bungkil kedelai tinggi ile) atau gunakan isoleucine sintetis. Gunakan pada ruminansia untuk bypass protein (ADIN tinggi — protein tidak terdegradasi rumen).',
    },
    harga: {
      estimasiAI: 12000, hargaMarketplace: 10500,
      satuan: 'per kg', supplier: 'RPH unggas besar (Charoen Pokphand, Japfa); RPH sapi kota besar; agen pakan ternak',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 96',
        'Feedipedia (2024) — Blood meal',
        'NRC (1994) — Nutrient Requirements of Poultry, 9th Ed.',
        'NRC (2001) — Nutrient Requirements of Dairy Cattle, 7th Ed.',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 313',
      ],
      sumberData: 'Nilai protein dan asam amino dari NRC (1994) dan Feedipedia (2024) untuk ring-dried blood meal; Fe dari Hartadi et al. (1997)',
      catatan: 'Kecernaan lysine di tepung darah: drum dried ±60–70%, ring dried ±80%, spray dried ±90%. Selalu tanyakan metode pengeringan saat memesan. Perbedaan kecernaan lysine ini signifikan dalam formulasi ransum.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Darah adalah sumber lisina terbaik dari bahan pakan alami — lisina 8% BK jauh melampaui bungkil kedelai (3%), tepung ikan (5%), dan protein lainnya. Dalam formulasi berbasis jagung (defisit lysine), tepung darah 2–3% dapat menyelesaikan defisit lysine tanpa lysine sintetis.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein 82% BK tertinggi secara absolut. Fe sangat tinggi (±2000 ppm dari hemoglobin) — berguna untuk ternak anemia atau bunting. Kecernaan lysine pada grade flash-dried/spray-dried sangat tinggi (>85%). Bypass protein di rumen — efektif untuk sapi perah berproduksi tinggi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Isoleucine sangat rendah (±0.9% BK vs kebutuhan ayam 0.67% dari protein) — second limiting amino acid yang sering luput dari perhitungan. Palatabilitas buruk — wajib campur. Metode pengeringan drum-dried memberikan kecernaan lisina yang jauh lebih rendah dari spray-dried.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum sapi perah: Tepung Darah 3% (bypass protein) + Jagung 40% + Bungkil kedelai 20% + Hay alfalfa 30% + Mineral 7%. Ransum babi grower: Tepung Darah 3% + Jagung 65% + Bungkil kedelai 22% + Tepung Ikan 5% + Dedak 2% + Premix 3%.' },
      { type: 'peringatan', icon: '🚨', text: 'SELALU campur tepung darah dengan bahan palatable seperti molases (2–3%) atau jagung basah sebelum diberikan. Jangan berikan tepung darah >5% — ternak akan menolak ransum. Periksa metode drying: drum-dried harga lebih murah tapi kecernaan lysine lebih rendah 20–30%.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk pemenuhan lysine: L-Lysine HCl sintetis (lebih presisi, lebih mahal per kg, lebih murah per unit lysine). Untuk sumber protein tinggi: CGM Corn Gluten Meal (protein 60% BK, bypass protein bagus, tapi lisina sangat rendah). Kombinasi tepung darah + CGM mengoptimalkan lysine dan bypass protein sekaligus.' },
    ],
  },

  // ── 12. Tepung Bulu Hidrolisis ────────────────────────────────────────────────
  'tepung-bulu-hidrolisis': {
    sumberBahan: 'Bulu unggas (ayam pedaging, ayam petelur afkir) dari RPH unggas — by-product paling berlimpah dari industri pemotongan ayam besar',
    bentuk: ['Tepung'],
    asal: 'RPH unggas terintegrasi: Charoen Pokphand, Japfa Comfeed, Malindo di Jawa dan Sulawesi. Impor dari Amerika Serikat dan Brasil.',
    metodePengolahan: 'Bulu segar dikumpulkan dari mesin scalding/picking RPH → dimasak dalam autoklaf (pressure cooker, suhu 130–160°C, tekanan 3–5 atm, 30–60 menit) → bulu terurai dan terdenaturasi → dikeringkan → digiling. Proses hidrolisis membuka ikatan disulfida keratin agar protein dapat dicerna.',
    ketersediaan: 'Tersedia secara rutin dari RPH unggas skala besar yang memiliki unit rendering. Harga relatif lebih murah dari tepung ikan. Volume besar dari industri broiler nasional yang menyembelih ±3 miliar ekor/tahun.',
    kelebihan: 'Protein sangat tinggi (±78% BK); biaya produksi relatif rendah (bulu sering dibuang atau dijual sangat murah); sistin sangat tinggi (±3.5% BK) — bermanfaat untuk ternak dengan kebutuhan belerang tinggi; volume bahan baku sangat besar dari industri broiler',
    kekurangan: 'Kecernaan protein sangat bervariasi (±50–75% tergantung kualitas hidrolisis) — nilai protein 78% BK menyesatkan jika kecernaan rendah; lisin sangat rendah (±2% BK); metionin rendah (±0.5% BK); triptofan rendat; profil asam amino sangat tidak seimbang — tidak dapat berdiri sendiri sebagai sumber protein',
    nutrisi: {
      bk: 93, kadarAir: 7,
      pk: 78.0, sk: 1.0, lk: 3.0, abu: 7.0, betn: 11.0,
      tdn: 60, me: 2460,
      ndf: 2.5, adf: 1.5,
      ca: 0.20, p: 0.60, mg: 0.06, na: 0.20, k: 0.15, cl: 0.25, s: 0.88,
      vitamin: 'Biotin sangat rendah; vitamin B kompleks rendah; kandungan vitamin umumnya tidak signifikan',
      mineral: 'Ca dan P sangat rendah — suplementasi mineral wajib. S (belerang) 0.88% BK dari sistin — tertinggi di antara sumber protein pakan. Zn ±45 ppm rendah. Na, K rendah.',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 5,
      targetTernak: ['Ayam Pedaging', 'Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'Gunakan HANYA sebagai suplemen protein parsial (≤5%) dan SELALU dikombinasi dengan sumber protein berimbang (bungkil kedelai, tepung ikan). Tidak bisa digunakan sebagai sumber protein tunggal karena profil asam amino sangat timpang. Periksa kecernaan in vitro dari supplier sebelum membeli.',
    },
    harga: {
      estimasiAI: 8500, hargaMarketplace: 7500,
      satuan: 'per kg', supplier: 'RPH unggas terintegrasi: Charoen Pokphand, Japfa, Malindo; unit rendering RPH kota besar',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Feather meal, hydrolyzed',
        'NRC (1994) — Nutrient Requirements of Poultry, 9th Ed.',
        'Papadopoulos, M.C. (1985). Feather meal as a protein supplement for poultry. Animal Feed Science and Technology.',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 317',
      ],
      sumberData: 'Nilai dari Feedipedia (2024) dan NRC (1994); kecernaan in vitro dari Papadopoulos (1985) dan literatur terkait',
      catatan: 'Kecernaan tepung bulu sangat bergantung pada kondisi autoklaf. Bulu yang terhidrolisis sempurna memiliki kecernaan pepsin ≥75%. Tepung bulu berkualitas rendah (hidrolisis tidak sempurna) bisa memiliki kecernaan <50% meski protein kasar tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Bulu Hidrolisis memanfaatkan keratin bulu yang sebelumnya sulit dicerna menjadi sumber protein (78% BK) melalui hidrolisis tekanan tinggi. Fungsi utama sebagai suplemen protein parsial dan sumber belerang organik (sistin 3.5% BK) dalam ransum.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein 78% BK sangat tinggi secara absolut. Bahan baku berlimpah dari industri broiler besar. Harga lebih murah dari tepung ikan per kg. Bypass protein di rumen baik — sistin dan keratin terdegradasi lambat, berguna untuk sapi perah produksi tinggi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Profil asam amino sangat tidak seimbang — sistin tinggi tetapi lysine, metionin, dan triptofan sangat rendah. Kecernaan tidak tertera di label — minta data kecernaan pepsin in vitro. Tepung bulu grade rendah (kecernaan <50%) adalah pemborosan — protein tidak diserap ternak.' },
      { type: 'kombinasi', icon: '🔗', text: 'Tepung Bulu 4% + Tepung Ikan 6% + Bungkil kedelai 28% + Jagung 56% + Premix 6% — kombinasi ini memanfaatkan sistin bulu dan lisina ikan+kedelai untuk saling melengkapi. Selalu padukan dengan sumber lysine tinggi dan metionin.' },
      { type: 'peringatan', icon: '🚨', text: 'JANGAN gunakan tepung bulu sebagai sumber protein utama — profil asam amino timpang akan menyebabkan defisiensi multipel (lysine, metionin, triptofan). Selalu verifikasi kecernaan pepsin ≥75% sebelum membeli. Batasi ≤5% ransum.' },
      { type: 'alternatif', icon: '🔄', text: 'Tepung Unggas (Poultry By-product Meal) — lebih seimbang profil asam amino, lebih mahal. Tepung Ikan — lebih seimbang dan kecernaan lebih tinggi tapi mahal. Metionin DL-Met sintetis + sumber protein seimbang — lebih ekonomis dan terukur.' },
    ],
  },

  // ── 13. Tepung Unggas (Poultry By-product Meal) ───────────────────────────────
  'tepung-unggas': {
    sumberBahan: 'By-product rendering unggas dari RPH ayam: kepala, kaki, usus, paru-paru, dan organ dalam yang tidak dikonsumsi manusia — bukan bulu (bulu diproses terpisah menjadi tepung bulu)',
    bentuk: ['Tepung'],
    asal: 'RPH unggas terintegrasi nasional: Charoen Pokphand, Japfa Comfeed, Malindo, Sierad; sentra pembantaian ayam di kota besar',
    metodePengolahan: 'Kepala + kaki + organ dalam dari RPH → dicampur dan dimasak (rendering 110–130°C) → dipres untuk memisahkan lemak unggas (chicken fat) → dikeringkan → digiling menjadi tepung',
    ketersediaan: 'Tersedia secara konsisten dari RPH unggas besar sepanjang tahun — industri broiler Indonesia memotong >3 miliar ekor/tahun, menghasilkan by-product berlimpah. Kualitas lebih konsisten dari MBM karena bahan baku lebih seragam.',
    kelebihan: 'Protein ±57% BK dengan profil asam amino lebih seimbang dari tepung bulu; Ca dan P lebih proporsional dari MBM; palatabilitas lebih baik dari tepung darah; harga lebih kompetitif dari tepung ikan; bahan baku berlimpah dan konsisten dari industri broiler nasional',
    kekurangan: 'Kecernaan bervariasi tergantung proporsi kepala+kaki (lebih tinggi) vs organ dalam (lebih rendah) vs tulang ikutan; dilarang untuk ruminansia (BSE); lisina lebih rendah dari tepung ikan (±3.5% BK vs 5% BK); lemak 13% BK rentan oksidasi',
    nutrisi: {
      bk: 93, kadarAir: 7,
      pk: 57.0, sk: 2.0, lk: 13.0, abu: 14.0, betn: 14.0,
      tdn: 74, me: 3034,
      ndf: 4.5, adf: 3.0,
      ca: 3.00, p: 1.70, mg: 0.18, na: 0.55, k: 0.60, cl: 0.50, s: 0.60,
      vitamin: 'Vitamin B12 tinggi; Niasin sedang; Vitamin B6 sedang; Vitamin D rendah setelah rendering',
      mineral: 'Ca 3.0% dan P 1.7% — rasio Ca:P 1.76:1 (cukup seimbang). Zn ±75 ppm; Fe ±270 ppm; Mn ±18 ppm; Se ±0.8 ppm',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 10,
      targetTernak: ['Ayam Pedaging', 'Ayam Petelur', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      catatan: 'DILARANG untuk ruminansia (BSE). Alternatif ekonomis tepung ikan — dapat menggantikan hingga 50% tepung ikan dalam ransum unggas dan babi. Batasi ≤10% pada unggas. Tambahkan antioksidan (etoksikuin/BHA) saat mixing karena lemak 13% mudah tengik.',
    },
    harga: {
      estimasiAI: 8000, hargaMarketplace: 7200,
      satuan: 'per kg', supplier: 'RPH unggas terintegrasi: Charoen Pokphand, Japfa, Malindo; unit rendering RPH kota besar',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Poultry by-product meal',
        'NRC (1994) — Nutrient Requirements of Poultry, 9th Ed.',
        'NRC (2012) — Nutrient Requirements of Swine, 11th Ed.',
        'Pond et al. (1995) — Basic Animal Nutrition 4th Ed.',
      ],
      sumberData: 'Nilai dari NRC (1994) dan Feedipedia (2024) untuk poultry by-product meal grade reguler; Ca dan P dari analisis lokal',
      catatan: 'Komposisi sangat bergantung proporsi komponen: tepung unggas dari kepala+kaki lebih tinggi protein dan lebih rendah Ca dibanding yang banyak mengandung tulang. Minta COA spesifikasi protein, Ca, dan P.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Unggas adalah substitusi ekonomis tepung ikan dalam ransum unggas dan babi — protein 57% BK dengan profil asam amino lebih seimbang dari tepung bulu dan lebih murah dari tepung ikan. TDN 74% BK juga menjadikannya sumber energi metabolis yang baik.' },
      { type: 'kelebihan', icon: '✅', text: 'Tersedia konsisten sepanjang tahun dari industri broiler besar. Profil asam amino lebih seimbang dari tepung bulu dan MBM. Kandungan lemak 13% BK memberikan energi ME tinggi. Kualitas lebih konsisten dari tepung daging karena bahan baku lebih seragam.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Lemak 13% BK tinggi dan mudah teroksidasi — produk sering tengik jika tidak disimpan dengan baik. Lisina lebih rendah dari tepung ikan. Dilarang untuk ruminansia. Kualitas bervariasi tergantung proporsi komponen bahan baku.' },
      { type: 'kombinasi', icon: '🔗', text: 'Pengganti parsial tepung ikan: Tepung Unggas 8% + Tepung Ikan 3% (dari 10% tepung ikan) + Jagung 55% + Bungkil kedelai 28% + Premix 6% — menghemat biaya protein 15–20% dengan performa mendekati. Tambahkan DL-Methionine 0.1% untuk keseimbangan asam amino.' },
      { type: 'peringatan', icon: '🚨', text: 'DILARANG untuk sapi, kambing, domba (BSE). Lemak rentan oksidasi — tambahkan antioksidan (etoksikuin 100–150 ppm atau butylated hydroxyanisole/BHA) saat formulasi. Simpan di tempat sejuk, hindari panas dan cahaya langsung.' },
      { type: 'alternatif', icon: '🔄', text: 'Tepung Ikan — lebih tinggi protein dan lysine, kecernaan lebih baik, harga lebih tinggi. Tepung Daging — Ca/P lebih rendah, protein serupa. Bungkil kedelai — aman untuk ruminansia, nabati, protein 44–48% BK.' },
    ],
  },

  // ── 14. Tepung Keong Mas ──────────────────────────────────────────────────────
  'tepung-keong-mas': {
    sumberBahan: 'Keong mas (golden apple snail) — hama sawah yang dipanen massal dari area persawahan; keong utuh (daging + cangkang) dikeringkan dan digiling',
    bentuk: ['Tepung', 'Segar'],
    asal: 'Sawah-sawah di Jawa, Sumatera, Sulawesi, dan Kalimantan — keong mas merupakan hama invasif yang melimpah di seluruh Indonesia; paling padat di persawahan irigasi Jawa',
    metodePengolahan: 'Keong mas dipanen dari sawah → direbus/dikukus (inaktivasi parasit, terutama cacing pita/trematoda) → dikeringkan dengan sinar matahari atau oven → digiling bersama cangkang (atau cangkang dibuang untuk tepung lebih tinggi protein)',
    ketersediaan: 'Sangat berlimpah dan tersedia sepanjang tahun dari sawah irigasi; biaya pengumpulan sangat rendah bahkan bisa gratis dari petani yang ingin membasmi hama; belum diproduksi secara komersial besar di Indonesia',
    kelebihan: 'Biaya sangat rendah — sering tersedia gratis atau hampir gratis sebagai hama; protein ±48% BK cukup baik; Ca tinggi dari cangkang (±7% BK); membantu pengendalian hama sawah sekaligus menghasilkan pakan; palatabilitas baik untuk unggas, babi, dan ikan',
    kekurangan: 'Risiko parasit (trematoda, cacing) jika tidak dimasak sempurna sebelum diberikan; Ca:P sangat tidak seimbang jika cangkang ikut digiling; kualitas tidak konsisten tergantung populasi keong dan lokasi sawah; produksi mandiri memerlukan tenaga kerja pengumpulan',
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 48.0, sk: 1.5, lk: 3.5, abu: 29.0, betn: 18.0,
      tdn: 58, me: 2378,
      ndf: 4.0, adf: 2.5,
      ca: 7.00, p: 1.40, mg: 0.24, na: 0.55, k: 0.50, cl: 0.65, s: 0.42,
      vitamin: 'Vitamin B12 sedang; beberapa karotenoid dari keong; kandungan vitamin umumnya rendah',
      mineral: 'Ca 7.0% BK dari cangkang — tinggi; P 1.4% BK; rasio Ca:P 5.0:1 (jauh tidak seimbang — suplementasi P diperlukan). Zn ±70 ppm; Fe ±180 ppm',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 10,
      targetTernak: ['Ayam Pedaging', 'Babi', 'Ikan Budidaya', 'Itik'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'WAJIB direbus atau dikukus minimal 15 menit sebelum diberikan untuk membunuh parasit (Fasciola, trematoda). Jangan berikan keong mas mentah. Sesuaikan Ca ransum — jika cangkang ikut digiling, Ca sangat tinggi. Tanpa cangkang: protein naik ke ±55% BK, Ca turun.',
    },
    harga: {
      estimasiAI: 4500, hargaMarketplace: null,
      satuan: 'per kg (produksi mandiri)', supplier: 'Petani sawah setempat; tidak tersedia komersial secara luas',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Sinurat, A.P. et al. (2004) — Bahan pakan unggas non konvensional. IPPTP Bogor.',
        'Göhl, B. (1981) — Tropical Feeds. FAO Animal Production and Health Series.',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia.',
        'Nari, T. & Purnama, D. (2016). Pemanfaatan keong mas sebagai pakan alternatif. Jurnal Peternakan Indonesia.',
      ],
      sumberData: 'Nilai komposisi dari JIRCAS (2013) dan Sinurat et al. (2004); Ca dari analisis cangkang keong mas lokal',
      catatan: 'Nilai nutrisi untuk tepung keong mas dengan cangkang. Tanpa cangkang: protein ±55% BK, Ca ±1.5% BK. Inaktivasi parasit wajib — keong mas adalah inang perantara beberapa trematoda hewan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Keong Mas mengubah hama sawah yang merugikan menjadi sumber protein berkualitas — konsep "pest to protein" yang sangat relevan untuk peternak yang berdekatan dengan lahan sawah. Protein 48% BK dengan biaya sangat rendah atau bahkan nol.' },
      { type: 'kelebihan', icon: '✅', text: 'Biaya pengadaan hampir nol dari sawah — sekaligus pengendalian hama alami. Ca 7% BK dari cangkang menggantikan kapur/CaCO3 dalam ransum. Palatabilitas baik untuk itik, ayam kampung, dan babi yang sering diberi keong segar di peternakan tradisional.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Risiko parasit sangat nyata — keong mas adalah inang perantara trematoda dan cacing. WAJIB direbus minimal 15 menit. Tanpa perlakuan panas, pemberian keong mentah bisa menyebabkan infeksi parasit masif pada ternak.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum itik kampung: Keong Mas segar rebus 15% + Dedak padi 45% + Jagung 30% + Bekatul 8% + Mineral 2% — formula ekonomis tradisional yang terbukti efektif. Pada ransum ayam: Tepung Keong Mas 8% + Jagung 55% + Bungkil kedelai 28% + Dedak 6% + Premix 3%.' },
      { type: 'peringatan', icon: '🚨', text: 'JANGAN berikan keong mas mentah — risiko infestasi cacing/trematoda sangat tinggi. Keong mas juga mengandung kontaminan pestisida jika diambil dari sawah yang intensif disemprot pestisida — tanyakan riwayat penggunaan pestisida ke petani.' },
      { type: 'alternatif', icon: '🔄', text: 'Tepung Bekicot — profil serupa, biaya rendah dari sumber lokal. Tepung Udang — lebih murah dari tepung ikan, kitin lebih tinggi. Tepung Ikan — protein lebih tinggi, kecernaan lebih baik, harga lebih tinggi.' },
    ],
  },

  // ── 15. Tepung Bekicot ────────────────────────────────────────────────────────
  'tepung-bekicot': {
    sumberBahan: 'Bekicot darat (Achatina fulica) — sering dipanen dari kebun dan ladang sebagai pengendalian hama; dikeringkan dan digiling menjadi tepung',
    bentuk: ['Tepung', 'Segar'],
    asal: 'Kebun dan lahan terbuka di Jawa, Sumatera, dan Kalimantan. Sentra budidaya bekicot untuk kuliner di Jawa Tengah (Solo, Klaten) juga menghasilkan by-product cangkang.',
    metodePengolahan: 'Bekicot dikumpulkan → direbus 15–20 menit (inaktivasi patogen) → daging dikeluarkan dari cangkang (opsional) → dikeringkan dengan sinar matahari atau oven → digiling. Daging saja (tanpa cangkang) menghasilkan tepung berkualitas lebih tinggi.',
    ketersediaan: 'Tersedia dari kebun di daerah pedesaan Jawa dan Sumatera; ada industri kecil pengepul bekicot untuk kuliner. Tidak diproduksi secara massal untuk pakan; belum ada pabrik tepung bekicot komersial di Indonesia.',
    kelebihan: 'Biaya sangat rendah; protein ±52% BK (tanpa cangkang lebih tinggi); Ca dari cangkang berguna sebagai suplemen mineral; dapat dibudidayakan mandiri; palatabilitas baik untuk unggas dan babi; sumber protein alternatif yang berkelanjutan',
    kekurangan: 'Tidak tersedia secara komersial; produksi sangat bergantung tenaga kerja pengumpulan; risiko parasit (Angiostrongylus cantonensis/nematoda serebral) jika tidak dimasak sempurna; kualitas tidak konsisten; Ca:P tidak seimbang jika cangkang ikut',
    nutrisi: {
      bk: 91, kadarAir: 9,
      pk: 52.0, sk: 1.0, lk: 3.0, abu: 27.0, betn: 17.0,
      tdn: 62, me: 2542,
      ndf: 3.0, adf: 2.0,
      ca: 6.00, p: 1.50, mg: 0.22, na: 0.50, k: 0.55, cl: 0.60, s: 0.42,
      vitamin: 'Vitamin B12 sedang; beberapa vitamin B kompleks; kandungan vitamin rendah secara umum',
      mineral: 'Ca 6.0% BK dari cangkang bekicot; P 1.5% BK; rasio Ca:P 4.0:1 (tidak seimbang — perlu suplementasi P). Zn ±65 ppm; Fe ±160 ppm',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 10,
      targetTernak: ['Ayam Pedaging', 'Ayam Kampung', 'Babi', 'Ikan Budidaya'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'WAJIB direbus minimal 20 menit untuk membunuh nematoda dan patogen. Tepung bekicot tanpa cangkang memiliki nilai gizi lebih tinggi (protein ±58% BK). Hitung kontribusi Ca — jika cangkang ikut digiling, Ca tinggi dan perlu kurangi kapur ransum.',
    },
    harga: {
      estimasiAI: 5500, hargaMarketplace: null,
      satuan: 'per kg (produksi mandiri)', supplier: 'Kebun lokal; pengepul bekicot kuliner; tidak tersedia komersial',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Sinurat, A.P. et al. (2004) — Bahan pakan unggas non konvensional. IPPTP Bogor.',
        'Göhl, B. (1981) — Tropical Feeds. FAO Animal Production and Health Series.',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia.',
      ],
      sumberData: 'Komposisi dari JIRCAS (2013) dan Sinurat et al. (2004) untuk tepung bekicot darat lokal Indonesia; nilai Ca dari analisis cangkang Achatina fulica',
      catatan: 'Nilai untuk bekicot utuh (daging + cangkang). Tanpa cangkang: protein ±58% BK, Ca ±1.8% BK. Inaktivasi patogen (khususnya Angiostrongylus) wajib sebelum pemberian.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Bekicot adalah sumber protein lokal yang berkelanjutan — protein 52% BK dengan biaya pengadaan sangat rendah. Dibudidayakan mandiri atau dipanen dari kebun, bekicot adalah solusi protein hemat biaya untuk peternakan skala kecil-menengah.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein 52% BK setara dengan bungkil kedelai. Ca 6% BK dari cangkang menggantikan kapur. Bisa dibudidayakan mandiri dengan modal minimal (media tanam + bibit bekicot). Cocok untuk peternakan organik dan berbasis sumber lokal.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Risiko Angiostrongylus cantonensis (nematoda yang dapat menginfeksi otak) — WAJIB dimasak sempurna. Tidak tersedia komersial — harus diproduksi sendiri. Produksi perlu skala cukup besar untuk signifikan dalam formulasi ransum.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum ayam kampung intensif: Tepung Bekicot 10% + Dedak 40% + Jagung 35% + Bungkil kelapa 10% + Mineral 5% — formula pakan murah berbasis lokal yang baik. Dikombinasikan dengan limbah sayuran untuk ransum lengkap ayam kampung.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan bekicot mentah — Angiostrongylus cantonensis dapat menginfeksi ternak dan secara potensial menular ke manusia yang mengonsumsi produk ternak. Rebus minimal 20 menit sebelum diberikan segar, atau keringkan pada suhu ≥70°C.' },
      { type: 'alternatif', icon: '🔄', text: 'Tepung Keong Mas — lebih berlimpah dari sawah, profil serupa. Tepung Cacing — protein lebih tinggi, harga lebih tinggi. Tepung Udang — lebih mudah didapat komersial, profil sedikit berbeda.' },
    ],
  },

  // ── 16. Tepung Cacing (Earthworm Meal) ───────────────────────────────────────
  'tepung-cacing': {
    sumberBahan: 'Cacing tanah jenis Lumbricus rubellus dan Eisenia fetida — dibudidayakan secara intensif pada media organik (kotoran ternak, kompos) atau dipanen dari tanah subur',
    bentuk: ['Tepung', 'Segar'],
    asal: 'Budidaya vermikompos di Jawa Tengah (Sukoharjo, Klaten), Jawa Barat (Bandung, Bogor), dan Jawa Timur; peternak cacing skala UKM',
    metodePengolahan: 'Cacing dipuasakan 24–48 jam (untuk mengeluarkan isi saluran cerna) → dicuci bersih → dikeringkan (suhu 60°C, oven) → digiling menjadi tepung. Pengeringan suhu rendah dianjurkan untuk mempertahankan kualitas protein.',
    ketersediaan: 'Belum diproduksi massal secara komersial di Indonesia — terutama dari peternak cacing UKM. Harga premium karena proses budidaya intensif. Tersedia dalam volume terbatas di toko pakan khusus dan online.',
    kelebihan: 'Protein ±62% BK setara tepung ikan dengan profil asam amino esensial yang sangat baik; lisozim alami sebagai antibakteri memperkuat imunitas ternak; mengandung faktor pertumbuhan (coelomocytes); kecernaan tinggi; cocok untuk unggas, ikan ornamental, dan ransum premium',
    kekurangan: 'Harga sangat tinggi — 2× lipat tepung ikan — karena budidaya intensif dan belum ada skala industri; ketersediaan sangat terbatas di luar kota-kota besar Jawa; belum ada standar kualitas nasional; produksi musiman tergantung kelembaban media',
    nutrisi: {
      bk: 91, kadarAir: 9,
      pk: 62.0, sk: 1.5, lk: 7.0, abu: 14.0, betn: 15.5,
      tdn: 72, me: 2952,
      ndf: 3.0, adf: 2.0,
      ca: 0.50, p: 0.90, mg: 0.20, na: 0.55, k: 0.65, cl: 0.45, s: 0.42,
      vitamin: 'Vitamin B12 tinggi; Riboflavin sedang; lisozim (enzim antibakteri) signifikan; Vitamin E sedang',
      mineral: 'Ca 0.5% dan P 0.9% BK — keduanya rendah, suplementasi mineral wajib. Rasio Ca:P 0.56:1 (defisit Ca signifikan). Zn ±85 ppm; Fe ±200 ppm; Co ±0.5 ppm (lebih tinggi dari tepung ikan)',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 10,
      targetTernak: ['Ayam Petelur', 'Ayam Pedaging', 'Ikan Ornamental', 'Unggas Indukan'],
      programCocok: ['Grower', 'Indukan', 'Menyusui', 'Bunting'],
      catatan: 'Ideal sebagai suplemen protein premium (5–10%) pada ransum unggas berkualitas tinggi dan ikan ornamental. Ca dan P sangat rendah — suplementasi kapur dan DCP wajib. Kombinasikan dengan sumber Ca tinggi (tepung tulang, CaCO3). Efek imunostimulasi lisozim menjadikannya pilihan menarik untuk ternak indukan.',
    },
    harga: {
      estimasiAI: 20000, hargaMarketplace: 18000,
      satuan: 'per kg', supplier: 'Peternak cacing UKM di Jawa; toko pakan premium online; komunitas vermikultur',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Sabine, J.R. (1983). Earthworms as animal food supplements. Animal Feed Science and Technology.',
        'Minnich, J. (1977). The Earthworm Book. Rodale Press.',
        'Sinha, R.K. et al. (2010). Earthworms: nature\'s gift for ecosystem services. Dynamic Soil, Dynamic Plant.',
        'Feedipedia (2024) — Earthworm meal (Lumbricus rubellus)',
      ],
      sumberData: 'Nilai dari Feedipedia (2024) dan Sabine (1983); lisozim dari Sinha et al. (2010); nilai mineral dari analisis tepung cacing UKM lokal',
      catatan: 'Ca dan P tepung cacing sangat rendah dibanding sumber protein hewani lainnya — selalu suplementasi Ca (CaCO3) dan P (DCP) secara terpisah. Nilai nutrisi pada cacing segar vs kering sangat berbeda — pastikan menggunakan nilai DM basis.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Cacing adalah sumber protein premium yang menyaingi tepung ikan dalam hal nilai biologis — protein 62% BK dengan profil asam amino esensial lengkap dan lisozim alami sebagai bonus imunostimulasi. Sangat efektif untuk unggas indukan, ikan hias, dan ransum premium.' },
      { type: 'kelebihan', icon: '✅', text: 'Lisozim alami (enzim antibakteri) pada dinding sel cacing memberikan efek imunostimulasi — mengurangi kebutuhan antibiotik. Profil asam amino esensial sangat lengkap dan seimbang. Palatabilitas sangat baik. Dapat diproduksi mandiri dengan vermikompos.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga premium (2× tepung ikan) menghambat penggunaan massal. Ca dan P sangat rendah — WAJIB suplementasi mineral lengkap. Ketersediaan terbatas dan belum ada industri skala besar di Indonesia.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum ayam petelur premium: Tepung Cacing 8% + Jagung 52% + Bungkil kedelai 25% + Dedak 8% + CaCO3 5% + DCP 1% + Premix 1% — formula premium untuk ayam petelur dengan nilai gizi tinggi. Untuk ikan hias: Tepung Cacing 15% + Tepung Udang 10% + Bahan nabati 70% + Premix 5%.' },
      { type: 'peringatan', icon: '🚨', text: 'Ca 0.5% BK sangat rendah — pastikan suplementasi CaCO3 pada ransum unggas (kebutuhan Ca ayam petelur 3.5–4.5%) terpenuhi sepenuhnya dari sumber lain. Verifikasi kualitas tepung cacing — cacing yang tidak dipuasakan sebelum dikeringkan mengandung lebih banyak material tanah.' },
      { type: 'alternatif', icon: '🔄', text: 'Tepung Ikan — protein setara, lebih mudah didapat, harga lebih murah. BSF (Black Soldier Fly) Meal — insect protein yang sedang berkembang di Indonesia, harga mulai kompetitif. Tepung Bekicot — lebih mudah diproduksi mandiri, harga lebih murah.' },
    ],
  },

  // ── 17. Whey Bubuk (Dried Whey) ───────────────────────────────────────────────
  'whey-bubuk': {
    sumberBahan: 'Cairan whey yang terpisah saat proses koagulasi pembuatan keju — by-product industri keju sapi (Bos taurus); dikeringkan menjadi bubuk untuk pakan ternak',
    bentuk: ['Tepung', 'Butiran'],
    asal: 'Impor — industri keju skala besar di Eropa (Belanda, Perancis, Jerman, Irlandia), Amerika Serikat, dan Australia; Indonesia belum memiliki industri keju berskala besar',
    metodePengolahan: 'Susu sapi → koagulasi dengan rennet atau asam → pemisahan dadih (curd, untuk keju) dan whey (cairan) → whey dikonsentrasi dengan evaporasi → dikeringkan dengan spray dryer → bubuk whey',
    ketersediaan: 'Tersedia melalui importir pakan ternak di Jakarta dan Surabaya. Volume impor besar karena dipakai industri pakan babi skala komersial. Harga fluktuatif mengikuti produksi susu global.',
    kelebihan: 'Laktosa ±70–75% BK — sumber energi cepat yang sangat disukai ternak muda (anak babi, pedet); palatabilitas sangat superior meningkatkan konsumsi ransum; protein mudah dicerna dengan nilai biologis tinggi; merangsang pertumbuhan flora usus beneficial (Lactobacillus); mengandung immunoglobulin dan laktoferrin residual',
    kekurangan: 'Laktosa tinggi menyebabkan diare jika diberikan terlalu banyak atau terlalu cepat ke ternak dewasa; harga relatif tinggi per satuan protein; sepenuhnya impor — ketersediaan tergantung impor; tidak cocok untuk ruminansia dewasa yang sudah tidak memiliki laktase aktif',
    nutrisi: {
      bk: 95, kadarAir: 5,
      pk: 12.0, sk: 0.0, lk: 1.0, abu: 8.5, betn: 78.5,
      tdn: 78, me: 3198,
      ndf: 0.5, adf: 0.3,
      ca: 0.80, p: 0.75, mg: 0.12, na: 1.10, k: 1.80, cl: 1.60, s: 0.28,
      vitamin: 'Riboflavin (B2) sangat tinggi — sumber B2 terbaik dari bahan pakan alami; vitamin B12 tinggi; B1 (tiamin) sedang; sedikit vitamin A dari whey full fat',
      mineral: 'Ca 0.80% dan P 0.75% BK — keduanya rendah, perlu suplementasi. Na 1.10% dan K 1.80% cukup tinggi — perlu diperhatikan dalam balance elektrolit. Rasio Ca:P 1.07:1 mendekati seimbang.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 20,
      targetTernak: ['Babi', 'Anak Sapi (Pedet)', 'Anak Domba', 'Anak Kambing'],
      programCocok: ['Grower', 'Menyusui', 'Indukan'],
      catatan: 'Terutama efektif untuk anak babi prasapih (prestarter 0–21 hari) — laktosa sangat cocok untuk sistem pencernaan bayi yang kaya laktase. Batasi ≤15% pada babi grower dewasa untuk mencegah diare. Kurangi secara bertahap sesuai umur. Tidak disarankan untuk ruminansia dewasa.',
    },
    harga: {
      estimasiAI: 13000, hargaMarketplace: 12000,
      satuan: 'per kg', supplier: 'Importir pakan ternak: PT. Charoen Pokphand Indonesia, Japfa, agen pakan babi Surabaya/Jakarta',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2012) — Nutrient Requirements of Swine, 11th Ed.',
        'Feedipedia (2024) — Dried whey',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 322',
        'Pond et al. (1995) — Basic Animal Nutrition 4th Ed.',
      ],
      sumberData: 'Nilai dari NRC (2012) dan Feedipedia (2024) untuk sweet dried whey; laktosa dari analisis whey industri Eropa',
      catatan: 'Sweet whey (dari keju coagulated dengan rennet, pH ±6.5) berbeda dari acid whey (dari keju cottage, pH ±4.5, kadar laktosa lebih rendah). Sebagian besar whey bubuk pakan adalah sweet whey. Periksa spesifikasi saat memesan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Whey Bubuk adalah bahan "ajaib" untuk ransum anak babi prasapih — laktosa 70–75% BK adalah sumber energi yang sempurna untuk metabolisme babi muda yang kaya laktase. Palatabilitas sangat superior mendorong konsumsi ransum sejak umur dini, mendukung transisi sapih yang lancar.' },
      { type: 'kelebihan', icon: '✅', text: 'Riboflavin (B2) tertinggi dari semua bahan pakan alami. Immunoglobulin dan laktoferrin residual memberikan perlindungan pasif terhadap patogen usus. Merangsang pertumbuhan Lactobacillus di usus babi muda — prebiotik alami.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein hanya 12% BK — whey bukan sumber protein, melainkan sumber energi (laktosa) dan palatabilitas. Sepenuhnya impor — rentan volatilitas harga. Laktosa berlebih (>20% ransum) pada babi dewasa menyebabkan diare osmotik.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum prestarter babi (0–21 hari): Whey Bubuk 20% + Bungkil kedelai 25% + Jagung 40% + Minyak nabati 5% + Asam amino sintetis 2% + Premix 8% — formula klasik prestarter berperforma tinggi. Whey juga efektif 5–10% dalam ransum pedet sebagai palat enhancer.' },
      { type: 'peringatan', icon: '🚨', text: 'Na 1.10% BK relatif tinggi — perhatikan dalam formulasi balance elektrolit (Ba+K-Cl). Pada babi dewasa (>50 kg), kurangi whey secara bertahap untuk menghindari ketergantungan palatabilitas dan diare. Simpan di tempat kering — whey sangat higroskopis.' },
      { type: 'alternatif', icon: '🔄', text: 'Laktosa murni (lebih mahal, lebih presisi). Permeate susu (by-product ultrafiltrasi, laktosa lebih tinggi, lebih murah). Susu Bubuk Afkir (protein lebih tinggi, lemak tinggi). Molases (sumber energi cepat alternatif yang lebih murah meski palatabilitas berbeda).' },
    ],
  },

  // ── 18. Susu Bubuk Afkir ──────────────────────────────────────────────────────
  'susu-bubuk-afkir': {
    sumberBahan: 'Susu bubuk sapi yang tidak memenuhi standar konsumsi manusia — kadar lemak tidak sesuai spesifikasi, perubahan warna, mendekati/melewati tanggal kadaluarsa, atau kemasan rusak',
    bentuk: ['Tepung', 'Butiran'],
    asal: 'Industri susu bubuk nasional (Indomilk, Frisian Flag, Dancow) dan importir susu bubuk; also dari kadaluarsa stok distributor dan toko ritel',
    metodePengolahan: 'Susu segar → pasteurisasi → standarisasi lemak → evaporasi (konsentrasi) → spray drying atau roller drying → bubuk susu. Susu bubuk afkir adalah produk normal yang gagal QC atau kadaluarsa — tidak ada perbedaan proses produksi.',
    ketersediaan: 'Tidak tersedia secara rutin — muncul sporadis dari reject QC pabrik susu atau kadaluarsa stok distributor. Volume tidak dapat diandalkan untuk formulasi tetap. Harga lebih murah dari susu bubuk standar.',
    kelebihan: 'Sumber nutrisi lengkap berkualitas tinggi (protein, lemak, laktosa, mineral) dengan harga lebih terjangkau dari susu bubuk standar; protein ±32% BK dengan nilai biologis tinggi; palatabilitas sangat baik; cocok untuk ternak muda yang membutuhkan nutrisi intensif',
    kekurangan: 'Ketersediaan tidak konsisten dan tidak dapat diandalkan sebagai bahan baku tetap formulasi; kualitas bervariasi tergantung penyebab afkir (kadaluarsa vs cacat fisik vs komposisi); lemak tinggi rentan oksidasi; harga masih lebih tinggi dari protein konvensional per satuan protein',
    nutrisi: {
      bk: 96, kadarAir: 4,
      pk: 32.0, sk: 0.0, lk: 26.0, abu: 6.0, betn: 36.0,
      tdn: 88, me: 3608,
      ndf: 0.5, adf: 0.3,
      ca: 1.00, p: 0.85, mg: 0.10, na: 0.45, k: 1.50, cl: 0.85, s: 0.28,
      vitamin: 'Vitamin A tinggi; Vitamin D tinggi (biasanya difortifikasi); Riboflavin sangat tinggi; Vitamin B12 tinggi; Vitamin C (jika belum rusak); profil vitamin lengkap dari susu segar',
      mineral: 'Ca 1.0% dan P 0.85% BK — lebih tinggi dari whey. Rasio Ca:P 1.18:1 mendekati seimbang. K 1.50% dan Na 0.45% cukup — balance elektrolit baik. Zn ±40 ppm; Se ±0.2 ppm',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 15,
      targetTernak: ['Anak Sapi (Pedet)', 'Anak Babi', 'Anak Kambing', 'Babi Grower'],
      programCocok: ['Grower', 'Menyusui', 'Indukan'],
      catatan: 'Terutama untuk ransum pengganti susu (milk replacer) pedet dan anak kambing yang kehilangan induk. ME sangat tinggi (3608 kcal/kg BK) menjadikannya sumber energi premium. Periksa kondisi fisik sebelum digunakan — susu bubuk yang telah menggumpal atau berwarna kuning kecoklatan mungkin telah teroksidasi.',
    },
    harga: {
      estimasiAI: 9000, hargaMarketplace: 8000,
      satuan: 'per kg', supplier: 'Pabrik susu bubuk (reject QC); distributor susu bubuk; pedagang pakan ternak khusus',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Dried whole milk',
        'NRC (2001) — Nutrient Requirements of Dairy Cattle, 7th Ed.',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 321',
      ],
      sumberData: 'Nilai dari Feedipedia (2024) untuk dried whole milk (full cream) dengan penyesuaian untuk susu bubuk afkir (kualitas nutrisi diasumsikan setara susu bubuk standar)',
      catatan: 'Nilai nutrisi untuk susu bubuk full cream (lemak ±26%). Susu bubuk skim (lemak <1.5%) memiliki protein lebih tinggi (±36% BK) dan ME lebih rendah. Periksa spesifikasi lemak saat menerima bahan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Susu Bubuk Afkir adalah sumber nutrisi paling lengkap dan komprehensif dalam pakan ternak — protein, lemak, laktosa, vitamin, dan mineral dalam satu bahan dengan kualitas setara susu manusia. ME 3608 kcal/kg BK tertinggi di antara sumber protein pakan. Ideal untuk milk replacer pedet dan anak kambing.' },
      { type: 'kelebihan', icon: '✅', text: 'Nilai biologis protein sangat tinggi — semua asam amino esensial lengkap. Profil vitamin sangat kaya (A, D, B12, Riboflavin). Palatabilitas superior mendorong konsumsi tinggi pada ternak muda. Sering lebih ekonomis dari milk replacer komersial jika tersedia.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ketersediaan tidak konsisten — tidak bisa jadi bahan baku formulasi tetap. Lemak 26% BK sangat rentan oksidasi — periksa kondisi fisik dan bau sebelum digunakan. Kadaluarsa bukan berarti tidak layak pakai — evaluasi berdasarkan kondisi aktual.' },
      { type: 'kombinasi', icon: '🔗', text: 'Milk replacer pedet: Susu Bubuk Afkir 60% + Lemak nabati 20% + Vitamin-mineral 5% + Emulsifier 2% + Air (larutkan 1:7 sebelum diberikan). Ransum prestarter anak babi: Susu Bubuk 15% + Jagung 40% + Bungkil kedelai 30% + Premix 15%.' },
      { type: 'peringatan', icon: '🚨', text: 'WAJIB evaluasi kondisi fisik: warna (putih krem normal, kuning kecoklatan = oksidasi), bau (susu segar normal, tengik/bau asing = rusak), dan tekstur (bubuk halus normal, gumpalan besar = terkontaminasi air). Jangan gunakan susu bubuk yang sudah rusak meski harga sangat murah.' },
      { type: 'alternatif', icon: '🔄', text: 'Whey Bubuk — lebih murah per kg, laktosa lebih tinggi, protein lebih rendah. Kolostrum Bubuk — lebih mahal, nilai imunologis lebih tinggi. Milk replacer komersial — lebih konsisten kualitasnya tapi jauh lebih mahal.' },
    ],
  },

  // ── 19. Kolostrum Bubuk (Colostrum Powder) ───────────────────────────────────
  'kolostrum-bubuk': {
    sumberBahan: 'Kolostrum sapi (susu pertama 24–48 jam pasca melahirkan) yang dikeringkan — mengandung immunoglobulin, growth factor, dan nutrisi tinggi untuk neonatus',
    bentuk: ['Tepung', 'Butiran'],
    asal: 'Industri susu sapi perah di Jawa (KUD Cikaret, KPBS Pangalengan, dll.); impor dari Selandia Baru, Australia, dan Amerika Serikat sebagai bovine colostrum supplement',
    metodePengolahan: 'Kolostrum segar dipanen 24–48 jam pasca partus → diuji kadar IgG (≥50 mg/mL untuk grade feed) → dipasteurisasi suhu rendah (56°C/30 menit, untuk mempertahankan IgG) → spray dried pada suhu inlet rendah → dikemas',
    ketersediaan: 'Terbatas — produksi kolostrum sapi hanya tersedia 3–5 hari per kelahiran. Impor tersedia dari Selandia Baru dan Australia tapi harga sangat premium. Produksi lokal dari KUD susu terbatas.',
    kelebihan: 'IgG ±18–25% — memberikan imunitas pasif yang kritis untuk neonatus yang gagal mendapat kolostrum induk; growth factor (IGF-1, EGF, TGF) merangsang perkembangan epitel usus; laktoferin antibakteri alami; protein berkualitas tinggi ±38% BK; efek terapeutik pada diare neonatus',
    kekurangan: 'Harga sangat premium — 2–3× lipat susu bubuk biasa; ketersediaan sangat terbatas dan tidak konsisten; IgG terdegradasi oleh panas berlebih (spray drying suhu tinggi merusak IgG); tidak efektif untuk ternak yang sudah >24 jam post partus (closure of gut)',
    nutrisi: {
      bk: 96, kadarAir: 4,
      pk: 38.0, sk: 0.0, lk: 28.0, abu: 8.0, betn: 26.0,
      tdn: 90, me: 3690,
      ndf: 0.5, adf: 0.3,
      ca: 1.20, p: 0.95, mg: 0.12, na: 0.50, k: 1.60, cl: 0.90, s: 0.30,
      vitamin: 'Vitamin A sangat tinggi (10–15× susu biasa); Vitamin E tinggi; Vitamin D tinggi; Riboflavin sangat tinggi; IgG, IgM, IgA sebagai komponen imunologis',
      mineral: 'Ca 1.2% dan P 0.95% BK; rasio Ca:P 1.26:1 seimbang. K 1.60% dan Na 0.50% — balance elektrolit baik. Zn ±50 ppm; Se ±0.4 ppm; Mn ±12 ppm',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 10,
      targetTernak: ['Anak Sapi (Pedet)', 'Anak Babi', 'Anak Kambing', 'Anak Domba'],
      programCocok: ['Grower', 'Menyusui'],
      catatan: 'TERUTAMA untuk neonatus 0–24 jam yang gagal mendapat kolostrum induk — jendela absorpsi IgG menutup dalam 24–36 jam post partus. Larutkan 10–15% dalam air hangat (38°C) dan berikan segera via dot/botol. Untuk penggunaan umum imunologi: 5–10% ransum anak babi prestarter.',
    },
    harga: {
      estimasiAI: 25000, hargaMarketplace: 22000,
      satuan: 'per kg', supplier: 'Toko pakan khusus dan suplemen ternak; importir bovine colostrum; KUD susu Jawa Barat',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Godden, S. (2008). Colostrum management for dairy calves. Veterinary Clinics of North America: Food Animal Practice.',
        'NRC (2001) — Nutrient Requirements of Dairy Cattle, 7th Ed.',
        'Feedipedia (2024) — Bovine colostrum',
        'Quigley, J.D. & Drewry, J.J. (1998). Nutrient and immunity transfer from cow to calf. Journal of Dairy Science.',
      ],
      sumberData: 'Nilai nutrisi dari Feedipedia (2024) dan NRC (2001); IgG dari Godden (2008) dan Quigley & Drewry (1998)',
      catatan: 'IgG kolostrum terdegradasi oleh: (1) suhu pasteurisasi >60°C, (2) spray drying suhu inlet >160°C. Selalu tanyakan metode drying dan kadar IgG yang tersisa (target ≥25 mg/g bubuk). Kolostrum segar selalu lebih efektif dari kolostrum bubuk untuk imunitas neonatus.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Kolostrum Bubuk adalah "vaksin alami" pertama untuk neonatus — IgG 18–25% memberikan imunitas pasif yang esensial dalam 24 jam pertama kehidupan. Kritis untuk pedet dan anak kambing yang terpisah dari induk atau induk yang tidak memproduksi kolostrum cukup.' },
      { type: 'kelebihan', icon: '✅', text: 'IgG, growth factor, dan laktoferrin tidak ada substitusinya secara alami. ME 3690 kcal/kg BK tertinggi di antara semua sumber protein pakan. Vitamin A 10–15× lebih tinggi dari susu biasa. Mengurangi kejadian diare neonatus secara signifikan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Efek imunologis (IgG) HANYA efektif dalam jendela 24 jam pertama post-partus — setelah itu usus menutup dan IgG tidak dapat diserap. Harga sangat premium. Kualitas sangat tergantung proses drying — IgG mudah rusak oleh panas.' },
      { type: 'kombinasi', icon: '🔗', text: 'Larutan kolostrum neonatus: Kolostrum Bubuk 150g + Air hangat 1L (38°C) + Elektrolit dasar → berikan 10% berat badan dalam 6 jam pertama. Ransum prestarter pedet (pasca 24 jam): Kolostrum Bubuk 5% + Susu Bubuk 55% + Premix mineral-vitamin 40%.' },
      { type: 'peringatan', icon: '🚨', text: 'Jendela absorpsi IgG menutup dalam 24–36 jam setelah lahir — setelah itu pemberian kolostrum hanya memberikan manfaat nutrisi, bukan imunologis. Larutkan dalam air HANGAT (38°C, bukan panas) untuk mempertahankan IgG. Jangan campur dengan air mendidih.' },
      { type: 'alternatif', icon: '🔄', text: 'Kolostrum segar beku (lebih efektif, perlu penyimpanan -20°C). Serum darah pedet (transfer IgG via plasma — lebih mahal, lebih efektif untuk kegagalan transfer pasif). Susu Bubuk Afkir (untuk nutrisi saja, tanpa manfaat imunologis).' },
    ],
  },

  // ── 20. Telur Afkir (Rejected Eggs) ──────────────────────────────────────────
  'telur-afkir': {
    sumberBahan: 'Telur ayam ras yang tidak lolos grading untuk konsumsi manusia — telur retak (crack eggs), telur kotor, telur infertil dari setter, telur hatcher reject, dan telur kadaluarsa',
    bentuk: ['Segar', 'Cair'],
    asal: 'Peternakan ayam petelur komersial di seluruh Indonesia; mesin setter/hatcher di hatchery broiler (hatcher reject); sortasi di gudang distributor telur kota besar',
    metodePengolahan: 'Telur afkir WAJIB dimasak sebelum diberikan: (1) Direbus 10–15 menit, (2) Dikukus, atau (3) Diacak (scrambled/fried) untuk ternak kecil. Tidak disarankan diberikan mentah karena risiko Salmonella dan avidin (antinutrisi biotin).',
    ketersediaan: 'Tersedia dari peternakan dan hatchery setiap saat — 3–5% telur hatcher adalah reject. Harga sangat murah karena tidak bisa dijual ke manusia. Tersedia langsung dari peternak layer setempat.',
    kelebihan: 'Nilai biologis protein tertinggi dari semua sumber protein pakan alami (BV ±93–100%); profil asam amino esensial sempurna — menjadi standar referensi protein FAO; lemak telur kaya lektin dan fosfolipid (fosfatidilkolin) yang mendukung perkembangan otak; palatabilitas sangat baik; harga sangat murah per satuan nutrisi',
    kekurangan: 'BK hanya ±26% (as-fed) — sebagian besar air; WAJIB dimasak untuk mencegah Salmonella dan mengaktifkan biotin (avidin mengikat biotin pada telur mentah); tidak tersedia dalam volume besar secara konsisten; handling harus hati-hati untuk mencegah pecah dan bau tidak sedap',
    nutrisi: {
      bk: 26, kadarAir: 74,
      pk: 47.0, sk: 0.0, lk: 43.0, abu: 5.0, betn: 5.0,
      tdn: 90, me: 3690,
      ndf: 0.5, adf: 0.3,
      ca: 1.90, p: 0.75, mg: 0.05, na: 0.38, k: 0.45, cl: 0.42, s: 0.55,
      vitamin: 'Vitamin A, D, E, B12, Riboflavin sangat tinggi dari kuning telur; Kolin sangat tinggi (±2500 mg/kg BK); Biotin tinggi; profil vitamin paling lengkap dari sumber pakan alami manapun',
      mineral: 'Ca 1.90% BK dari cangkang dan kuning telur; P 0.75% BK; Zn ±50 ppm; Fe ±150 ppm; Se ±0.3 ppm; Mn ±5 ppm. Semua nilai pada DM basis.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 15,
      targetTernak: ['Babi', 'Anak Sapi (Pedet)', 'Anjing', 'Kucing', 'Ayam Pedaging'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui', 'Bunting'],
      catatan: 'WAJIB dimasak — jangan berikan mentah (Salmonella + avidin antinutrisi). Berikan segar setelah dimasak, jangan simpan lebih 4 jam. Nilai % penggunaan mengacu DM basis (as-fed 4–6× lebih banyak per % DM). Sangat efektif untuk babi dan anjing sebagai protein suplemen premium.',
    },
    harga: {
      estimasiAI: 1800, hargaMarketplace: null,
      satuan: 'per butir (as-fed), setara ~Rp 9.000–12.000/kg BK', supplier: 'Peternakan ayam petelur lokal; hatchery broiler; pengepul telur',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'FAO/WHO/UNU (1985). Energy and Protein Requirements. WHO Technical Report Series.',
        'Feedipedia (2024) — Whole egg, dried',
        'NRC (2012) — Nutrient Requirements of Swine, 11th Ed.',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 323',
      ],
      sumberData: 'Nilai DM basis dari Feedipedia (2024) untuk whole egg; BK as-fed dari analisis telur ayam ras lokal. Nilai biologis protein dari FAO/WHO/UNU (1985).',
      catatan: 'Semua nilai nutrisi pada DM basis. As-fed (BK 26%): protein actual ±12%, lemak actual ±11%, energi actual ±960 kcal/100g. Konversi: per butir (±60g) mengandung ±7.8g protein, ±7g lemak. Nilai Ca pada DM tinggi (1.9%) karena cangkang ikut dihitung jika digunakan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Telur Afkir mengandung protein dengan nilai biologis tertinggi dari seluruh bahan pakan alami — FAO menjadikan telur sebagai standar referensi protein (BV 100). Setiap butir telur menyediakan ±8g protein sempurna, ±7g lemak fosfatidilkolin, dan profil vitamin yang paling lengkap.' },
      { type: 'kelebihan', icon: '✅', text: 'Nilai biologis protein 93–100% — ternak menyerap hampir semua protein yang dimakan. Kolin sangat tinggi (2500 mg/kg BK) mendukung perkembangan otak dan fungsi hati. Harga sangat murah per satuan protein — seringkali lebih ekonomis dari sumber protein konvensional.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK as-fed hanya 26% — untuk setara 1 kg tepung ikan (92% BK), perlu ±3.5 kg telur rebus. WAJIB dimasak — avidin dalam telur mentah mengikat biotin dan menyebabkan defisiensi biotin jika diberikan mentah dalam jumlah besar.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum babi starter premium: Telur Rebus 2 butir/ekor/hari + Jagung giling 500g + Dedak 200g + Bungkil kedelai 100g + Mineral 20g — formula sederhana berbasis bahan lokal. Untuk anjing kerja atau peternakan: 1 telur rebus per 5 kg berat badan sebagai suplemen protein harian.' },
      { type: 'peringatan', icon: '🚨', text: 'JANGAN berikan mentah — Salmonella pada permukaan telur dan avidin (anti-biotin) dalam putih telur mentah berbahaya. Masak hingga kuning telur matang sempurna. Telur retak yang sudah terlalu lama (>4 jam) dapat berkembang bakteri — segera masak atau buang.' },
      { type: 'alternatif', icon: '🔄', text: 'Tepung Telur — lebih praktis disimpan, nilai gizi setara, harga lebih tinggi. Tepung Ikan — protein lebih mudah diukur, penyimpanan lebih lama, harga lebih konsisten. Untuk neonatus: Kolostrum Bubuk (nilai imunologis lebih tinggi).' },
    ],
  },

  // ── 21. Tepung Telur (Dried Egg) ──────────────────────────────────────────────
  'tepung-telur': {
    sumberBahan: 'Telur ayam ras utuh (whole egg) yang dipasteurisasi, diacak, dan dikeringkan dengan spray dryer — produk telur kering berkadar air sangat rendah',
    bentuk: ['Tepung'],
    asal: 'Pabrik pengolahan telur (egg processing plant) — terutama dari peternakan layer besar yang memiliki unit liquid egg atau breaking plant. Impor dari Amerika Serikat, Eropa, dan India.',
    metodePengolahan: 'Telur segar dipecah → isi telur (putih + kuning) dicampur → dipasteurisasi (60°C/3.5 menit) → disaring → spray dried (suhu inlet 150–180°C, outlet 60–80°C) → tepung telur kering dikemas vakum',
    ketersediaan: 'Produksi terbatas di Indonesia — sebagian besar impor. Tersedia dari importir pakan dan toko suplemen ternak premium. Harga jauh lebih mahal dari tepung ikan tapi lebih praktis dari telur segar.',
    kelebihan: 'Nilai biologis protein tertinggi absolut dari semua bahan pakan dalam bentuk kering; BK ±95% jauh lebih praktis dari telur segar (BK 26%); mudah disimpan dan diukur dalam formulasi; profil vitamin dan mineral lengkap; kolin sangat tinggi mendukung fungsi kognitif ternak',
    kekurangan: 'Harga sangat mahal per kg — 2–3× lipat tepung ikan untuk kadar protein yang lebih rendah; terutama digunakan dalam penelitian nutrisi dan ransum hewan peliharaan premium; penggunaan massal untuk ternak produksi tidak ekonomis; Ca:P agak tidak seimbang',
    nutrisi: {
      bk: 95, kadarAir: 5,
      pk: 46.0, sk: 0.0, lk: 42.0, abu: 5.0, betn: 7.0,
      tdn: 92, me: 3772,
      ndf: 0.5, adf: 0.3,
      ca: 1.90, p: 0.75, mg: 0.06, na: 0.42, k: 0.48, cl: 0.40, s: 0.58,
      vitamin: 'Vitamin A, D, E, B12, Riboflavin, Kolin sangat tinggi — profil vitamin paling lengkap dari sumber protein kering manapun; Kolin ±2500 mg/kg BK',
      mineral: 'Ca 1.90% dan P 0.75% BK; rasio Ca:P 2.53:1 (perlu suplementasi P jika digunakan dominan). Zn ±50 ppm; Fe ±155 ppm; Se ±0.3 ppm',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 10,
      targetTernak: ['Babi', 'Anjing', 'Kucing', 'Ikan Ornamental'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      catatan: 'Terutama untuk ransum hewan peliharaan premium (pet food), penelitian nutrisi, dan ransum prestarter neonatus. Untuk ternak produksi massal: gunakan telur afkir segar yang lebih ekonomis. Protein 46% BK setara bungkil kedelai tapi nilai biologis jauh lebih tinggi.',
    },
    harga: {
      estimasiAI: 18000, hargaMarketplace: 16500,
      satuan: 'per kg', supplier: 'Importir pakan premium; toko suplemen hewan peliharaan; distributor produk telur olahan',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Whole egg, dried',
        'FAO/WHO/UNU (1985). Energy and Protein Requirements. WHO Technical Report Series.',
        'NRC (1994) — Nutrient Requirements of Poultry, 9th Ed.',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 323',
      ],
      sumberData: 'Nilai dari Feedipedia (2024) dan NRC (1994) untuk dried whole egg; kolin dari analisis egg powder standar industri',
      catatan: 'ME 3772 kcal/kg BK adalah tertinggi di antara seluruh sumber protein pakan — ini karena lemak kuning telur (terutama trigliserida dan fosfolipid) memiliki energi sangat tinggi. Nilai biologis protein standar FAO = 100 (referensi 100%).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Tepung Telur adalah standar referensi protein dalam nutrisi ternak — nilai biologis 100% menurut FAO berarti semua asam amino esensial tersedia dalam proporsi yang sempurna untuk kebutuhan ternak. ME 3772 kcal/kg BK tertinggi dari semua sumber protein pakan.' },
      { type: 'kelebihan', icon: '✅', text: 'BK 95% jauh lebih praktis dari telur segar untuk formulasi. Kolin 2500 mg/kg BK mendukung fungsi hati dan perkembangan saraf. Profil vitamin paling lengkap dari sumber protein kering manapun. Digunakan dalam penelitian nutrisi sebagai protein standar referensi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga premium yang tidak ekonomis untuk ternak produksi massal. Lemak 42% BK sangat tinggi dan mudah teroksidasi — simpan dalam kemasan vakum/nitrogen flushing di suhu <15°C. Rasio Ca:P 2.53:1 memerlukan suplementasi P.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum penelitian referensi: Tepung Telur 25% + Jagung 50% + Mineral mix 20% + Vitamin mix 5% — formula standar untuk uji coba nutrisi terkontrol. Dalam pet food: Tepung Telur 10% + Tepung Ikan 15% + Bungkil kedelai 20% + Jagung 45% + Premix 10%.' },
      { type: 'peringatan', icon: '🚨', text: 'Lemak 42% BK sangat rentan oksidasi — tepung telur yang sudah tengik TIDAK layak dipakai meski harganya murah karena sudah diobral. Selalu cek bau (harus seperti telur kering normal, tidak tengik). Tambahkan antioksidan (vitamin E atau BHA) saat formulasi.' },
      { type: 'alternatif', icon: '🔄', text: 'Telur Afkir segar — jauh lebih ekonomis untuk ternak produksi. Tepung Ikan — lebih mudah didapat, protein lebih tinggi secara absolut. Kasein — protein lebih murni untuk penelitian (tanpa lemak), lebih mahal.' },
    ],
  },

  // ── 22. Kasein (Casein) ───────────────────────────────────────────────────────
  'kasein': {
    sumberBahan: 'Protein utama susu sapi (80% dari total protein susu) yang diisolasi melalui pengasaman (pH 4.6) atau koagulasi enzimatis (rennet) — produk sangat murni hampir tanpa laktosa dan lemak',
    bentuk: ['Tepung'],
    asal: 'Impor — diproduksi dari susu sapi skim di Eropa (Perancis, Irlandia, Belanda) dan Selandia Baru; tidak diproduksi di Indonesia dalam skala signifikan',
    metodePengolahan: 'Susu skim → pengasaman hingga pH 4.6 (titik isoelektrik kasein) atau penambahan rennet → kasein mengendap → dicuci berulang → dikeringkan (spray dry atau drum dry) → digiling. Sodium caseinate: kasein dilarutkan dengan NaOH → spray dried.',
    ketersediaan: 'Tersedia terbatas dari importir bahan kimia pangan dan suplemen ternak premium. Harga sangat tinggi. Penggunaan di Indonesia terutama untuk penelitian nutrisi, tidak untuk pakan ternak komersial massal.',
    kelebihan: 'Protein sangat murni (±88% BK) — tertinggi dari produk susu dan salah satu tertinggi dari sumber protein alami manapun; tidak mengandung laktosa (aman untuk intoleransi); sebagian besar protein terlarut rumen — bypass protein baik; referensi protein standar internasional dalam penelitian nutrisi',
    kekurangan: 'Harga sangat premium — 3–5× tepung ikan, tidak ekonomis untuk pakan massal; hampir sepenuhnya impor; penggunaan terbatas pada penelitian nutrisi dan aplikasi khusus (hewan laboratorium, neonatus sakit); hampir tidak mengandung vitamin dan mineral',
    nutrisi: {
      bk: 96, kadarAir: 4,
      pk: 88.0, sk: 0.0, lk: 1.0, abu: 8.0, betn: 3.0,
      tdn: 80, me: 3280,
      ndf: 0.5, adf: 0.3,
      ca: 0.70, p: 0.85, mg: 0.03, na: 0.55, k: 0.08, cl: 0.20, s: 0.42,
      vitamin: 'Kandungan vitamin sangat rendah — kasein adalah protein murni, bukan sumber vitamin. Diperlukan suplementasi vitamin lengkap jika digunakan sebagai sumber protein dominan.',
      mineral: 'Ca 0.70% dan P 0.85% BK; rasio Ca:P 0.82:1 (sedikit defisit Ca). Na 0.55% dari sodium caseinate jika menggunakan bentuk ini. Mineral sangat rendah secara keseluruhan — suplementasi mineral lengkap WAJIB.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Hewan Laboratorium', 'Anak Sapi (Pedet)', 'Babi Sakit/Lemah'],
      programCocok: ['Grower', 'Menyusui', 'Indukan'],
      catatan: 'Penggunaan UTAMA untuk penelitian nutrisi (formulasi diet terkontrol tanpa variabel nutrisi lain). Untuk ternak: gunakan hanya pada kasus khusus (neonatus defisit protein, ternak sakit yang perlu protein mudah dicerna). Tidak ekonomis untuk ransum produksi massal. WAJIB suplementasi mineral dan vitamin lengkap.',
    },
    harga: {
      estimasiAI: 28000, hargaMarketplace: 25000,
      satuan: 'per kg', supplier: 'Importir bahan kimia pangan (PT. Lautan Luas, dll.); toko suplemen premium; distributor bahan penelitian',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Casein',
        'FAO/WHO/UNU (1985). Energy and Protein Requirements. WHO Technical Report Series.',
        'NRC (2001) — Nutrient Requirements of Dairy Cattle, 7th Ed.',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 320',
        'Pond et al. (1995) — Basic Animal Nutrition 4th Ed.',
      ],
      sumberData: 'Nilai dari Feedipedia (2024) dan FAO/WHO/UNU (1985); nilai mineral dari analisis acid casein standar industri',
      catatan: 'Kasein adalah protein standar referensi dalam penelitian nutrisi hewan — hampir semua diet semi-purified dalam penelitian menggunakan kasein sebagai sumber protein. Nilai BV kasein ±77, sedikit lebih rendah dari telur (100) karena kekurangan relatif metionin.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Kasein adalah protein susu paling murni yang dikenal — 88% BK protein dengan struktur misel yang unik memperlambat pencernaan (slow-digesting protein). Berfungsi terutama sebagai standar referensi protein dalam penelitian nutrisi dan sumber protein murni terukur untuk aplikasi khusus.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein 88% BK tertinggi dari produk susu. Tidak ada laktosa — aman untuk hewan dengan intoleransi laktosa. Pencernaan lambat (misel kasein) memberikan pelepasan asam amino bertahap — cocok untuk aplikasi malam hari (nocturnal protein release). Bypass protein baik di rumen.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga sangat premium — tidak ada justifikasi ekonomis untuk pakan ternak komersial massal. Hampir tidak ada mineral dan vitamin — jika dipakai dominan, perlu mineral dan vitamin dari nol. Nilai biologis (BV 77) lebih rendah dari tepung telur (BV 100) karena metionin relatif rendah.' },
      { type: 'kombinasi', icon: '🔗', text: 'Diet semi-purified standar penelitian: Kasein 20% + Pati jagung (cornstarch) 65% + Minyak jagung 5% + Mineral AIN-93 3.5% + Vitamin AIN-93 1% + Serat (selulosa) 5% + L-Sistin 0.3% + Kolin 0.2% — formula diet AIN-93G (American Institute of Nutrition).' },
      { type: 'peringatan', icon: '🚨', text: 'Metionin kasein relatif rendah (±2.8% dari protein) — tambahkan L-Methionine atau DL-Met 0.15–0.20% jika kasein digunakan dominan untuk menghindari defisiensi metionin. Mineral sangat rendah — suplementasi mineral makro dan mikro lengkap WAJIB.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk penelitian: Tepung Telur (BV lebih tinggi, harga lebih mahal). Isolat protein kedelai (SPI) (nabati, tidak ada laktosa, lebih murah). Untuk ransum ternak: Tepung Ikan (protein tinggi, jauh lebih ekonomis) atau Bungkil Kedelai (nabati, murah, tersedia luas).' },
    ],
  },

};

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getSumberProteinHewaniDetail(id: string): SumberProteinHewaniDetailFields | undefined {
  const detail = SUMBER_PROTEIN_HEWANI_DETAIL[id];
  if (detail) {
    getSumberProteinHewaniById(id); // confirm item exists in parent registry
  }
  return detail;
}

// Re-export so detail-page can get parent item too
export { getSumberProteinHewaniById } from './sumberProteinHewaniData';
