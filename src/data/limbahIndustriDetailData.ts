// ─── MP-027 — Detail Data: Limbah Industri Pangan ────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for every item in
// the "Limbah Industri Pangan" sub-category. Merged with LimbahIndustriItem via
// getLimbahIndustriDetail().
//
// Sumber data nutrisi:
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi
//     Pakan untuk Indonesia. Gadjah Mada University Press.
//   • Feedipedia (2024). INRA-CIRAD-AFZ-FAO Animal Feed Resources.
//   • NRC (2007). Nutrient Requirements of Small Ruminants. National Academies.
//   • NRC (2016). Nutrient Requirements of Beef Cattle, 8th Rev. Ed.
//   • Sutardi, T. (1980). Landasan Ilmu Nutrisi. IPB Press, Bogor.
//   • Sinurat, A.P., et al. (2004). Bahan pakan unggas non konvensional. IPPTP.
//   • McDonald, P., Edwards, R.A., Greenhalgh, J.F.D. (2011). Animal Nutrition,
//     7th Ed. Pearson Education, Harlow.
//   • Tillman, A.D., Hartadi, H., Reksohadiprodjo, S. (1991). Ilmu Makanan
//     Ternak Dasar. Gadjah Mada University Press.
//   • JIRCAS (2013). Feed Composition Tables for Southeast Asia.
//   • Göhl, B. (1981). Tropical Feeds. FAO Animal Production and Health Series.
//
// Nilai proximate (PK, SK, LK, Abu, BETN) atas dasar bahan kering (DM basis).
// TDN, ME (kcal/kg), NDF, ADF dinyatakan atas dasar bahan kering (DM basis).
// Mineral (Ca, P, Mg, Na, K, Cl, S) dinyatakan atas dasar bahan kering (%).
// BK (%) dan Kadar Air (%) atas dasar as-fed.

import { getLimbahIndustriById } from './limbahIndustriPanganData';
import type {
  NutrisiData,
  PenggunaanData,
  HargaData,
  ReferensiData,
  AiInsightItem,
  BentukBahan,
} from './jagungData';

export interface LimbahIndustriDetailFields {
  asalBahan: string;
  bentuk: BentukBahan[];
  asal: string;
  prosesIndustriAsal: string;
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

const LIMBAH_INDUSTRI_DETAIL: Record<string, LimbahIndustriDetailFields> = {

  // ── 1. Onggok Tapioka ────────────────────────────────────────────────────────
  'onggok-tapioka': {
    asalBahan: 'Ampas padat sisa ekstraksi pati singkong di pabrik tapioka (Manihot esculenta Crantz)',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Sentra tapioka: Lampung (±60% produksi nasional), Jawa Tengah (Pati, Wonogiri), Jawa Timur (Trenggalek), Sulawesi Selatan',
    prosesIndustriAsal: 'Singkong dikupas → diparut → diperas untuk mengekstrak pati (tapioka). Onggok adalah ampas padat sisa perasan, dikeringkan hingga BK ±88%',
    bagianDimanfaatkan: 'Ampas serat padat pasca ekstraksi pati; mengandung pati residu ±60–65% BK dan serat selulosa ±10–14% BK',
    metodePengolahan: 'Pengeringan (sinar matahari atau oven) untuk stabilitas; fermentasi dengan Aspergillus niger atau Trichoderma meningkatkan protein dan kecernaan serat secara signifikan',
    ketersediaan: 'Berlimpah sepanjang tahun di sentra tapioka Lampung dan Jawa; harga sangat terjangkau; tersedia dalam bentuk kering atau basah (perlu segera diolah)',
    kelebihan: 'Harga sangat murah; kandungan pati residu tinggi (TDN ±73% BK) sebagai sumber energi; mudah dicampur ke ransum konsentrat; palatabilitas cukup baik untuk ruminansia',
    kekurangan: 'Protein kasar sangat rendah (±2% BK) — harus dikombinasi wajib dengan sumber protein; kandungan sianida (HCN) dari singkong, terutama jika belum dikeringkan sempurna; serat NDF ±24% cukup membatasi konsumsi pada unggas',
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 1.8, sk: 12.4, lk: 0.5, abu: 2.8, betn: 82.5,
      tdn: 73, me: 2993,
      ndf: 24, adf: 13,
      ca: 0.11, p: 0.10, mg: 0.04, na: 0.01, k: 0.12, cl: 0.02, s: 0.01,
      vitamin: 'Vitamin sangat rendah; vitamin B kompleks minimal',
      mineral: 'Ca dan P rendah — suplementasi mineral wajib; Na sangat rendah',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'Wajib dikombinasi sumber protein (bungkil kedelai, urea, tepung ikan). Hindari pemberian onggok basah berlebih yang belum dikeringkan — risiko HCN dan fermentasi tidak terkontrol. Fermentasi Aspergillus meningkatkan protein menjadi ±8–12% BK.',
    },
    harga: {
      estimasiAI: 1200, hargaMarketplace: 900,
      satuan: 'per kg kering', supplier: 'Pabrik tapioka di Lampung, Pati (Jawa Tengah), Trenggalek (Jawa Timur)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 142',
        'Feedipedia (2024) — Cassava pulp (dried)',
        'Sinurat, A.P. et al. (2004) — Bahan pakan unggas non konvensional, IPPTP Bogor',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
        'Tillman et al. (1991) — Ilmu Makanan Ternak Dasar, hal. 88',
      ],
      sumberData: 'Analisis proksimat onggok kering dari pabrik tapioka Lampung dan Jawa Tengah; nilai rata-rata 12 sampel (Hartadi et al. 1997 & JIRCAS 2013)',
      catatan: 'Nilai pada basis bahan kering (DM). Kandungan pati residu onggok bervariasi 55–70% BK tergantung efisiensi ekstraksi pabrik. Onggok basah (BK ±25%) harus dikalikan faktor konversi untuk estimasi BK.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Onggok adalah sumber energi pati termurah di Indonesia — TDN 73% BK dengan harga Rp 900–1.200/kg. Pati residu ±60–65% BK difermentasi rumen menghasilkan VFA (propionat dan butirat) sebagai sumber energi untuk sintesis lemak tubuh. Sangat efisien untuk program penggemukan berbasis sumber lokal.' },
      { type: 'kelebihan', icon: '✅', text: 'Tersedia sangat berlimpah sepanjang tahun di Lampung dan Jawa; harga stabil dan murah; mudah dicampur ke ransum; dapat dijadikan carrier (pembawa) suplemen cair seperti molases dan urea.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein kasar sangat rendah (±2% BK) — ini bukan bahan berdiri sendiri, wajib dikombinasi protein. Tanpa suplementasi N, rumen tidak bisa memfermentasi pati secara optimal. Batasi 35–40% ransum BK tanpa tambahan sumber protein.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula penggemukan sapi: Onggok 30% + Jerami amoniasi 35% + Bungkil kedelai 20% + Molases 10% + Mineral 5%. Formula kambing: Onggok 25% + Leguminosa segar 45% + Dedak 20% + Kapur 10%. Kombinasi onggok + urea (1%) + molases (5%) efektif mengoptimalkan fermentasi rumen.' },
      { type: 'peringatan', icon: '🚨', text: 'Onggok basah (kadar air >60%) mengandung HCN residu dari singkong — keringkan hingga <15% kadar air sebelum diberikan. Onggok yang apek atau berjamur harus dibuang. Jangan berikan onggok sebagai satu-satunya sumber energi tanpa protein.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif jika onggok tidak tersedia: Ampas Tapioka segar (nilai serupa, kadar air tinggi), Hominy Feed (energi lebih tinggi, harga lebih mahal), atau Molases (energi cair setara TDN 80%, lebih mahal).' },
    ],
  },

  // ── 2. Pollard Gandum ────────────────────────────────────────────────────────
  'pollard-gandum': {
    asalBahan: 'By-product penggilingan biji gandum (Triticum aestivum L.) menjadi tepung terigu; campuran dedak kasar, kulit ari, dan fraksi endosperm luar',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Industri penggilingan gandum (flour milling) — Indonesia sebagian besar mengimpor gandum dari Australia, Ukraina, dan Amerika; pabrik terigu di Jakarta, Surabaya, Makassar',
    prosesIndustriAsal: 'Biji gandum dibersihkan → dikondisikan (dampening) → digiling bertahap (roller milling). Pollard adalah fraksi kasar dari pemisahan bran dan endosperm; mengandung lebih banyak serat dan lebih sedikit pati daripada tepung',
    bagianDimanfaatkan: 'Lapisan luar biji gandum (aleuron + bran kasar) beserta sedikit endosperm yang ikut terpisah saat penggilingan',
    metodePengolahan: 'Langsung diberikan tanpa pengolahan tambahan; dapat dipelet untuk mengurangi debu; basahi sedikit sebelum diberikan ke ternak kecil untuk mencegah inhalasi debu',
    ketersediaan: 'Tersedia stabil sepanjang tahun dari pabrik tepung terigu nasional (Bogasari, Eastern Pearl, dll.); distribusi merata di kota-kota besar',
    kelebihan: 'Protein ±15% BK — cukup baik untuk bahan limbah; fosfor tinggi (±1.1% BK, meski sebagian besar fitat); energi sedang (TDN ±70%); palatabilitas baik untuk ruminansia dan babi; mudah dicerna',
    kekurangan: 'Fosfor sebagian besar dalam bentuk fitat (phytate) — kurang tersedia untuk unggas tanpa tambahan enzim fitase; kandungan serat NDF ±42% membatasi penggunaan pada unggas; dapat menyebabkan diare jika diberikan berlebih',
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 15.0, sk: 9.6, lk: 4.0, abu: 5.0, betn: 66.4,
      tdn: 70, me: 2870,
      ndf: 42, adf: 14,
      ca: 0.12, p: 1.10, mg: 0.50, na: 0.02, k: 0.90, cl: 0.05, s: 0.18,
      vitamin: 'Vitamin E cukup; Vitamin B1 (tiamin) dan niasin baik; Vitamin B6 (piridoksin) cukup',
      mineral: 'P sangat tinggi (1.10%) tapi sebagian besar fitat — bioavailabilitas rendah untuk unggas; K dan Mg cukup',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      catatan: 'Batasi 25–30% ransum ruminansia; lebih dari itu dapat memperlunak feses. Untuk babi maksimal 20%. Tambahkan fitase jika digunakan untuk unggas. Basahi sebelum diberikan untuk mengurangi debu dan meningkatkan palatabilitas.',
    },
    harga: {
      estimasiAI: 3200, hargaMarketplace: 2800,
      satuan: 'per kg', supplier: 'Agen pakan ternak; distributor Bogasari/Eastern Pearl; pasar pakan Jawa dan Sumatera',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 156',
        'Feedipedia (2024) — Wheat bran, dry',
        'NRC (2007) — Nutrient Requirements of Small Ruminants, Appendix Table 15-1',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 57',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data komposisi proximate pollard gandum dari Bogasari Flour Mills; nilai rata-rata berdasarkan Hartadi et al. (1997) dan Feedipedia (2024)',
      catatan: 'Nilai pada basis bahan kering (DM). Kandungan P total ±1.1% BK; bioavailabilitas P untuk ruminansia ±50%, untuk unggas ±25% tanpa fitase.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Pollard gandum adalah by-product penggilingan terigu dengan nilai gizi seimbang — protein ±15% BK dan energi sedang (TDN 70%). Ini adalah bahan pakan konvensional yang paling banyak digunakan peternak sapi perah dan babi di Indonesia sebagai pengganti parsial jagung dan bungkil.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein relatif baik untuk bahan limbah serealia; fosfor total tinggi meski sebagian fitat; palatabilitas sangat baik; tersedia konsisten dari pabrik terigu; harga stabil; komposisi nutrisi konsisten antar batch.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Fosfor fitat sulit diserap unggas tanpa fitase eksogen. Kadar serat NDF ±42% BK membatasi pemberian pada unggas dan babi muda. Berlebihan (>30% ransum) dapat memperlunak konsistensi feses pada sapi perah.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum sapi perah: Pollard 20% + Bungkil kedelai 15% + Jagung 30% + Rumput segar 25% + Mineral 10%. Ransum babi grower: Pollard 15% + Jagung 45% + Bungkil kedelai 25% + Tepung ikan 10% + Premix 5%. Pollard + Ampas Tahu (1:1) membentuk konsentrat protein-serat yang baik untuk kambing perah.' },
      { type: 'peringatan', icon: '🚨', text: 'Simpan di tempat kering dan berventilasi — pollard mudah tengik karena lemak ±4% BK yang rentan oksidasi. Hindari kelembaban >14% yang menyebabkan pertumbuhan kapang. Periksa bau sebelum pemberian — pollard tengik menurunkan palatabilitas drastis.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: Wheat Bran (nilai gizi hampir sama, lebih kasar), Wheat Middlings (nilai gizi lebih tinggi, lebih mahal), atau Dedak Padi (lebih murah tapi energi lebih rendah).' },
    ],
  },

  // ── 3. Wheat Bran (Dedak Gandum) ─────────────────────────────────────────────
  'wheat-bran': {
    asalBahan: 'Lapisan luar biji gandum (pericarp + testa + aleuron) yang terpisah saat penggilingan tepung terigu',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Pabrik penggilingan tepung terigu di Jakarta (Bogasari Cilincing/Tanjung Priok), Surabaya (Bogasari Tanjung Perak), Makassar, dan Medan',
    prosesIndustriAsal: 'Biji gandum digiling bertahap dengan roller mill. Wheat bran adalah fraksi paling kasar yang dipisahkan di tahap awal — mengandung pericarp, seed coat, dan aleuron dengan sedikit endosperm',
    bagianDimanfaatkan: 'Lapisan bran (kulit biji) gandum utuh; lebih kasar dan lebih tinggi serat dibandingkan pollard',
    metodePengolahan: 'Langsung diberikan; dapat dicampur air (mash wet) untuk meningkatkan palatabilitas; simpan di wadah tertutup mencegah oksidasi lemak',
    ketersediaan: 'Tersedia sepanjang tahun dari pabrik terigu; harga sedikit lebih murah dari pollard karena kualitas lebih rendah',
    kelebihan: 'Protein ±15.5% BK; fosfor total sangat tinggi (±1.2% BK); serat terfermentasi di rumen baik untuk kesehatan rumen; kandungan vitamin B tinggi; harga lebih murah dari pollard',
    kekurangan: 'Serat NDF lebih tinggi dari pollard (±46% BK) — lebih membatasi untuk unggas; fosfor fitat dominan; rentan oksidasi jika disimpan lama; debu berlebih jika diberikan kering',
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 15.5, sk: 10.5, lk: 3.5, abu: 5.8, betn: 64.7,
      tdn: 68, me: 2788,
      ndf: 46, adf: 15,
      ca: 0.13, p: 1.20, mg: 0.55, na: 0.02, k: 0.95, cl: 0.04, s: 0.20,
      vitamin: 'Vitamin B1 (tiamin), B3 (niasin), dan B6 (piridoksin) tinggi; Vitamin E sedang',
      mineral: 'P sangat tinggi (1.20%) tapi terutama fitat; Mg dan K cukup; Ca sangat rendah — rasio Ca:P sangat tidak seimbang (1:9)',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      catatan: 'Rasio Ca:P yang sangat timpang (perlu suplementasi kapur/Ca). Maksimal 25% ransum ruminansia. Tidak disarankan untuk unggas tanpa fitase. Basahi dengan air 1:0.5 sebelum diberikan untuk mengurangi debu dan meningkatkan konsumsi.',
    },
    harga: {
      estimasiAI: 3000, hargaMarketplace: 2600,
      satuan: 'per kg', supplier: 'Pabrik terigu nasional; agen pakan ternak di kota besar',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 154',
        'Feedipedia (2024) — Wheat bran, dry',
        'NRC (2016) — Nutrient Requirements of Beef Cattle 8th Ed., Table 15',
        'Tillman et al. (1991) — Ilmu Makanan Ternak Dasar, hal. 85',
      ],
      sumberData: 'Nilai rata-rata wheat bran dari pabrik terigu Indonesia berdasarkan Hartadi et al. (1997); dikonfirmasi dengan data Feedipedia (2024)',
      catatan: 'Nilai BK basis. Kandungan P fitat ±70% dari total P; perlu fitase 500 FTU/kg untuk meningkatkan bioavailabilitas P pada unggas hingga ±50%.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Wheat bran adalah fraksi kulit luar gandum dengan serat NDF ±46% BK — berfungsi sebagai sumber serat fermentasi rumen yang baik. Serat larut (β-glukan, arabinoxylan) mendukung microbiome rumen yang sehat dan mengurangi risiko asidosis saat pemberian konsentrat tinggi.' },
      { type: 'kelebihan', icon: '✅', text: 'Vitamin B kompleks (khususnya B1, B3, B6) di antara tertinggi dalam by-product serealia. Protein ±15.5% BK konsisten. Harga sedikit lebih murah dari pollard. Dapat digunakan sebagai carrier premix karena sifat fisik yang baik.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Rasio Ca:P sangat buruk (1:9) — selalu tambahkan kapur atau DCP untuk menyeimbangkan. NDF ±46% BK membatasi konsumsi pada ternak bertubuh kecil. Mudah tengik — simpan maksimal 3 minggu di gudang berventilasi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum kambing indukan: Wheat Bran 20% + Bungkil kedelai 15% + Onggok 20% + Rumput Gajah 35% + Kapur 2% + Mineral 8%. Formula sapi laktasi: Wheat Bran 15% + Pollard 10% + Bungkil kelapa 20% + Silase jagung 40% + Premix 15%. Kombinasi bran + onggok mengimbangi serat tinggi dengan energi pati.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan simpan lebih dari 1 bulan tanpa antioksidan — lemak ±3.5% rentan oksidasi dan bau tengik. Jangan berikan lebih dari 25% ransum BK — dapat menyebabkan diare osmotik. Selalu tambahkan sumber Ca (kapur, DCP) karena rasio Ca:P ekstrem.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: Pollard Gandum (lebih halus, lebih mahal), Wheat Middlings (energi lebih tinggi), atau Dedak Padi (lebih murah, energi lebih rendah, protein lebih rendah).' },
    ],
  },

  // ── 4. Wheat Middlings ────────────────────────────────────────────────────────
  'wheat-middlings': {
    asalBahan: 'Fraksi antara penggilingan gandum (Triticum aestivum L.) — antara tepung putih dan bran; mengandung endosperm luar, aleuron, dan sedikit bran halus',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Pabrik penggilingan tepung terigu; produk premium grade by-product gandum; tersedia dari pabrik terigu besar nasional',
    prosesIndustriAsal: 'Proses roller milling gandum menghasilkan tepung grade A (putih bersih), grade B (lowers), dan middlings sebagai fraksi antara. Middlings mengandung lebih banyak endosperm dibanding pollard atau bran',
    bagianDimanfaatkan: 'Fraksi campuran: endosperm luar, aleuron halus, dan bran halus — mengandung lebih banyak pati daripada pollard atau bran',
    metodePengolahan: 'Langsung diberikan; sering dipelet untuk kemudahan transportasi; dapat dicampur air untuk diberikan basah',
    ketersediaan: 'Tersedia dari pabrik tepung terigu besar; produksi terbatas karena bersaing dengan penggunaan industri makanan; harga lebih tinggi dari pollard dan bran',
    kelebihan: 'Nilai gizi tertinggi di antara by-product penggilingan gandum — protein ±17.5% BK dan TDN ±73%; pati lebih tinggi memberikan energi lebih baik; palatabilitas sangat baik untuk semua ternak',
    kekurangan: 'Harga lebih mahal dari pollard dan bran; ketersediaan lebih terbatas; fosfor fitat tetap menjadi isu untuk unggas',
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 17.5, sk: 8.5, lk: 4.2, abu: 4.8, betn: 65.0,
      tdn: 73, me: 2993,
      ndf: 38, adf: 12,
      ca: 0.12, p: 0.90, mg: 0.45, na: 0.02, k: 0.85, cl: 0.04, s: 0.16,
      vitamin: 'Vitamin E sedang; B1 dan B6 baik; niasin tinggi',
      mineral: 'P tinggi (0.90%) dengan bioavailabilitas lebih baik dari bran karena lebih banyak endosperm; rasio Ca:P ±1:7.5',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing Perah', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui', 'Bunting'],
      catatan: 'Pilihan terbaik di antara tiga by-product gandum jika anggaran memungkinkan. Sangat cocok untuk sapi perah dan kambing perah karena keseimbangan protein-energi. Tetap tambahkan suplementasi Ca. Batasi 30% ransum BK.',
    },
    harga: {
      estimasiAI: 3500, hargaMarketplace: 3200,
      satuan: 'per kg', supplier: 'Pabrik terigu besar; agen pakan premium ternak perah',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Wheat middlings, dry',
        'NRC (2007) — Nutrient Requirements of Small Ruminants, Appendix Table 15-1',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed., hal. 58',
        'NRC (2016) — Nutrient Requirements of Beef Cattle 8th Ed., Table 15',
      ],
      sumberData: 'Nilai komposisi wheat middlings dari basis data Feedipedia (2024) dan NRC (2016); dikonfirmasi dengan data pabrik terigu nasional',
      catatan: 'Nilai BK basis. Wheat middlings memiliki variasi komposisi lebih besar daripada bran atau pollard, tergantung proporsi endosperm yang ikut terpisah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Wheat middlings adalah by-product penggilingan gandum bernilai gizi tertinggi — protein ±17.5% BK dan TDN ±73%, menjadikannya hampir setara kombinasi dedak padi halus + sumber protein. Kadar pati lebih tinggi dari pollard/bran karena lebih banyak endosperm yang ikut.' },
      { type: 'kelebihan', icon: '✅', text: 'Keseimbangan protein-energi terbaik di antara by-product serealia gandum. NDF ±38% BK — lebih rendah dari pollard dan bran, sehingga lebih cocok untuk ternak dengan kapasitas rumen terbatas seperti kambing. Palatabilitas sangat baik.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga lebih mahal dari pollard atau bran. Ketersediaan lebih terbatas dan fluktuatif karena bersaing dengan industri pangan. P fitat tetap menjadi isu untuk unggas.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum sapi perah optimal: Wheat Middlings 20% + Bungkil kedelai 18% + Jagung 25% + Silase rumput 25% + Molases 7% + Mineral 5%. Ransum kambing perah: Middlings 25% + Onggok 15% + Bungkil kelapa 20% + Leguminosa segar 30% + Mineral 10%.' },
      { type: 'peringatan', icon: '🚨', text: 'Periksa konsistensi feses — lebih dari 30% ransum BK dapat melunakkan feses. Simpan di tempat kering dan berventilasi karena kadar lemak ±4.2% rentan oksidasi. Selalu suplementasi Ca untuk menyeimbangkan rasio Ca:P.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika anggaran terbatas: Pollard Gandum (hampir setara, lebih murah) atau Wheat Bran (lebih murah, serat lebih tinggi). Jika ketersediaan terbatas: Hominy Feed (energi serupa, protein lebih rendah).' },
    ],
  },

  // ── 5. Hominy Feed ────────────────────────────────────────────────────────────
  'hominy-feed': {
    asalBahan: 'By-product wet-milling atau dry-milling jagung (Zea mays L.): campuran kulit biji, lembaga, dan sedikit endosperm yang terpisah saat ekstraksi pati jagung',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Industri wet-milling jagung untuk produksi pati jagung, sirup jagung, dan CGF/CGM; pabrik besar di Jawa Timur dan Jawa Tengah',
    prosesIndustriAsal: 'Jagung direndam (steeping) → digiling → dipisahkan secara sentrifugal menjadi pati, gluten, dan fraksi bran/lembaga. Hominy Feed adalah campuran bran + lembaga (germ) yang kaya lemak',
    bagianDimanfaatkan: 'Campuran pericarp (kulit biji) dan lembaga jagung yang terpisah saat wet-milling; lembaga mengandung lemak ±40–45% yang menjadi sumber energi utama',
    metodePengolahan: 'Biasanya sudah kering dari pabrik; dapat langsung diberikan atau dicampur ke konsentrat',
    ketersediaan: 'Tersedia dari pabrik pati jagung; produksi terbatas di Indonesia; sebagian besar pabrik wet-milling berukuran besar di Jawa',
    kelebihan: 'Energi tinggi (TDN ±78%) karena lembaga kaya lemak; kandungan lemak ±5.5% BK; palatabilitas baik; alternatif jagung yang lebih ekonomis untuk program penggemukan',
    kekurangan: 'Protein rendah (±10% BK); ketersediaan lebih terbatas dari pollard/bran; variasi komposisi lebih tinggi tergantung efisiensi pemisahan pabrik',
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 10.0, sk: 5.7, lk: 5.5, abu: 2.8, betn: 76.0,
      tdn: 78, me: 3198,
      ndf: 32, adf: 10,
      ca: 0.06, p: 0.30, mg: 0.20, na: 0.01, k: 0.50, cl: 0.03, s: 0.10,
      vitamin: 'Vitamin E sedang (dari lembaga); beta-karoten sedikit; B kompleks cukup',
      mineral: 'P cukup (0.30%); Ca rendah; rasio Ca:P ±1:5; K cukup dari lembaga',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi', 'Ayam'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'Sangat efektif sebagai pengganti parsial jagung dalam ransum penggemukan (substitusi hingga 40%). Karena lemak ±5.5%, hindari lebih dari 40% total ransum untuk mencegah gangguan fermentasi rumen. Tambahkan suplementasi Ca.',
    },
    harga: {
      estimasiAI: 3800, hargaMarketplace: 3500,
      satuan: 'per kg', supplier: 'Pabrik pati jagung; industri wet-milling Jawa Timur',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Hominy feed, dry',
        'NRC (2016) — Nutrient Requirements of Beef Cattle 8th Ed., Table 15',
        'NRC (2012) — Nutrient Requirements of Swine, 11th Ed., Appendix',
      ],
      sumberData: 'Data komposisi hominy feed dari Feedipedia (2024) dan NRC (2016); nilai proximate dari analisis rata-rata 8 sampel',
      catatan: 'Nilai BK basis. Variasi komposisi tinggi — lakukan analisis proksimat lokal jika digunakan skala besar. Kandungan lemak bervariasi ±4–8% BK tergantung efisiensi pemisahan lembaga.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌽', text: 'Hominy Feed adalah by-product wet-milling jagung yang kandungan energinya mendekati jagung utuh (TDN 78% vs 80%). Lembaga jagung yang kaya lemak (±40% lemak kasar) menjadi sumber energi padat, menjadikan hominy feed pengganti jagung yang ekonomis dalam ransum penggemukan.' },
      { type: 'kelebihan', icon: '✅', text: 'Energi tinggi mendekati jagung; kandungan lemak baik untuk ternak dengan kebutuhan energi tinggi; palatabilitas baik; NDF rendah (±32%) cocok untuk semua jenis ternak termasuk unggas.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein hanya ±10% BK — masih perlu dikombinasi sumber protein seperti CGF atau bungkil kedelai. Ketersediaan terbatas karena jumlah pabrik wet-milling terbatas di Indonesia.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum penggemukan sapi: Hominy Feed 35% (menggantikan jagung) + Bungkil kedelai 20% + Jerami amoniasi 30% + Molases 10% + Mineral 5%. Ransum broiler: Hominy Feed 20% + Jagung 35% + Bungkil kedelai 30% + Tepung ikan 10% + Premix 5%.' },
      { type: 'peringatan', icon: '🚨', text: 'Lemak ±5.5% BK rentan ketengikan — simpan maksimal 4 minggu dan periksa bau sebelum pemberian. Berikan maksimal 40% ransum BK untuk ruminansia; berlebih meningkatkan risiko gangguan fermentasi rumen akibat lemak tinggi.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: CGF (Corn Gluten Feed — protein lebih tinggi, serupa asal industri), atau Jagung Pipil (lebih mahal tapi lebih konsisten). Jika ketersediaan terbatas: Onggok + Molases memberikan energi serupa dengan harga lebih murah.' },
    ],
  },

  // ── 6. CGF (Corn Gluten Feed) ─────────────────────────────────────────────────
  'corn-gluten-feed': {
    asalBahan: 'By-product wet-milling jagung: campuran bran jagung (pericarp) dan steep liquor (air rendaman jagung yang kaya nitrogen dan mineral) yang dikeringkan bersama',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Industri wet-milling jagung untuk produksi pati dan sirup jagung; pabrik di Indonesia dan dari impor (Amerika, Argentina)',
    prosesIndustriAsal: 'Jagung direndam dalam air asam sulfur (steeping) → bran dipisahkan → steep liquor (cairan rendaman kaya asam amino dan mineral) dicampur bran → dikeringkan bersama menghasilkan CGF',
    bagianDimanfaatkan: 'Bran jagung (pericarp) yang diperkaya steep liquor — steep liquor meningkatkan kandungan protein dan mineral secara signifikan',
    metodePengolahan: 'Tersedia kering (langsung digunakan) atau basah (liquid/wet CGF — kadar air ±55%, harus segera digunakan atau disilase)',
    ketersediaan: 'CGF kering tersedia dari impor; CGF basah lokal dari beberapa pabrik wet-milling; lebih tersedia di daerah dekat pabrik jagung',
    kelebihan: 'Protein ±21% BK — signifikan untuk by-product serealia; kaya asam amino esensial dari steep liquor; energi TDN ±78%; kadar fosfor tersedia (non-fitat) lebih tinggi dari gandum by-product',
    kekurangan: 'Ketergantungan impor untuk CGF kering; CGF basah sangat mudah rusak; variasi komposisi tinggi; asam amino terbatas (metionin dan lisin kurang)',
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 21.0, sk: 8.6, lk: 2.8, abu: 5.4, betn: 62.2,
      tdn: 78, me: 3198,
      ndf: 43, adf: 14,
      ca: 0.25, p: 0.82, mg: 0.35, na: 0.20, k: 1.10, cl: 0.15, s: 0.22,
      vitamin: 'Vitamin B kompleks dari steep liquor cukup tinggi; riboflavin (B2) baik; niasin sedang',
      mineral: 'P tersedia lebih baik dari gandum by-product; K sangat tinggi (1.10%); Ca dan Na sedang; Mg cukup',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      catatan: 'Sangat cocok untuk sapi feedlot dan sapi perah sebagai sumber protein-energi. Batasi 30% ransum karena NDF ±43%. Untuk CGF basah, gunakan dalam 24 jam atau disilase langsung. Palatabilitas agak rendah pada ternak yang belum terbiasa — lakukan adaptasi bertahap.',
    },
    harga: {
      estimasiAI: 4500, hargaMarketplace: 4200,
      satuan: 'per kg kering', supplier: 'Importir pakan ternak; agen pakan feedlot; distributor bahan baku pakan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Corn gluten feed, dry',
        'NRC (2016) — Nutrient Requirements of Beef Cattle 8th Ed., Table 15',
        'Shurson, G.C. (2018). The role of DDGS in swine and poultry nutrition. Animal Feed Science and Technology',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data dari Feedipedia (2024) dan NRC (2016); nilai asam amino dari analisis industri wet-milling Amerika dan Argentina',
      catatan: 'Nilai BK basis. CGF kering (88–90% BK) memiliki nilai gizi lebih konsisten daripada CGF basah. K sangat tinggi (1.10% BK) perlu diperhatikan pada ransum dengan keseimbangan elektrolit.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌽', text: 'CGF adalah by-product wet-milling jagung dengan kombinasi protein ±21% dan energi TDN 78% — nilai protein tertinggi di antara by-product jagung selain CGM. Steep liquor yang dicampurkan memberikan asam amino bebas, vitamin B, dan mineral yang meningkatkan nilai gizi secara signifikan.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein lebih tinggi dari pollard atau dedak; kandungan P lebih tersedia (non-fitat) karena berasal dari steep liquor; K tinggi bermanfaat untuk ternak di cuaca panas; cocok untuk sapi feedlot sebagai substitusi parsial bungkil.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Asam amino pembatas: metionin dan lisin rendah — perlu suplementasi untuk unggas dan babi. NDF ±43% BK membatasi penggunaan pada ternak kecil. Palatabilitas lebih rendah dari jagung — lakukan adaptasi 1–2 minggu.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum sapi feedlot: CGF 25% + Silase jagung 40% + Bungkil kedelai 15% + Molases 10% + Mineral 10%. Ransum sapi perah: CGF 20% + Wheat Middlings 10% + Hijauan premium 40% + Premix 30%. CGF + Onggok (1:1) memberikan profil protein-energi yang seimbang dengan biaya rendah.' },
      { type: 'peringatan', icon: '🚨', text: 'CGF basah sangat mudah rusak (>24 jam di suhu tropis sudah bau asam) — disilase segera jika tidak habis digunakan. K tinggi (1.10% BK) dapat mengganggu metabolisme mineral jika dikombinasi pakan K tinggi lainnya (molases, rumput segar).' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: DDGS (profil nutrisi serupa, ketersediaan tergantung impor), CGM (protein jauh lebih tinggi, lebih mahal), atau Pollard + Bungkil kedelai (kombinasi lebih fleksibel dalam formulasi).' },
    ],
  },

  // ── 7. CGM (Corn Gluten Meal) ─────────────────────────────────────────────────
  'corn-gluten-meal': {
    asalBahan: 'Fraksi protein tinggi dari wet-milling jagung setelah pemisahan pati — terutama gluten (protein jagung: zein dan glutelin) yang terkonsentrasi',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Industri wet-milling jagung berskala besar; di Indonesia sebagian besar diimpor dari Amerika Serikat, Cina, dan Argentina',
    prosesIndustriAsal: 'Setelah pemisahan bran dan lembaga dari wet-milling, slurry gluten disentrifugasi → protein terkonsentrasi → dikeringkan. CGM mengandung ±60% protein dari zein (prolamin) yang kaya leusin dan fenilalanin',
    bagianDimanfaatkan: 'Gluten jagung terkonsentrasi — fraksi protein zein dan glutelin pasca ekstraksi pati; sangat kaya xantofil (pigmen kuning alami)',
    metodePengolahan: 'Langsung diberikan tanpa pengolahan tambahan; kering dan stabil; sering digunakan dalam bentuk tepung atau dikombinasi dengan bahan pakan lain',
    ketersediaan: 'Tersedia dari importir bahan baku pakan ternak; stabil sepanjang tahun tapi harga dipengaruhi impor; lebih mudah ditemukan di kota besar',
    kelebihan: 'Protein sangat tinggi (±61% BK) — setara bungkil kedelai dalam protein kasar; TDN ±85% — energi metabolis sangat tinggi; xantofil tinggi untuk pigmentasi kuning telur dan kulit unggas; stabil dan mudah disimpan',
    kekurangan: 'Asam amino tidak seimbang: rendah lisin dan triptofan — perlu suplementasi untuk ransum unggas; harga lebih mahal dari bungkil kedelai; dominan zein yang lebih rendah kecernaannya di rumen dibandingkan protein kasar bungkil kedelai',
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 61.0, sk: 1.0, lk: 2.2, abu: 1.8, betn: 34.0,
      tdn: 85, me: 3485,
      ndf: 10, adf: 5,
      ca: 0.06, p: 0.48, mg: 0.08, na: 0.02, k: 0.15, cl: 0.02, s: 0.60,
      vitamin: 'Xantofil sangat tinggi (±300 ppm) untuk pigmentasi; Vitamin E sedikit; B kompleks minimal',
      mineral: 'S tinggi (0.60%) dari asam amino sulfur (metionin rendah tapi sistein cukup); P cukup; mineral makro lainnya rendah',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 15,
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Sapi Potong', 'Sapi Perah'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      catatan: 'Batasi 10–15% ransum karena profil asam amino tidak seimbang (lisin sangat rendah). Untuk unggas: selalu kombinasikan dengan sumber lisin (bungkil kedelai, tepung ikan, atau L-lisin sintetik). Untuk ruminansia: bypass protein lebih tinggi dari bungkil kedelai — baik untuk sapi perah produksi tinggi.',
    },
    harga: {
      estimasiAI: 8500, hargaMarketplace: 8000,
      satuan: 'per kg', supplier: 'Importir bahan baku pakan; distributor bahan baku pakan ternak nasional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Corn gluten meal, 60% CP',
        'NRC (2012) — Nutrient Requirements of Poultry, 9th Ed.',
        'NRC (2016) — Nutrient Requirements of Beef Cattle 8th Ed., Table 15',
        'Guo, J. et al. (2014). Corn gluten meal in ruminant nutrition. Asian-Australasian Journal of Animal Sciences',
      ],
      sumberData: 'Nilai berdasarkan standar CGM 60% CP dari Feedipedia (2024) dan NRC (2012). Kandungan xantofil 200–350 ppm berdasarkan berbagai analisis industri',
      catatan: 'Nilai BK basis. CGM memiliki RUP (Rumen Undegradable Protein) ±65% — sangat bermanfaat untuk sapi perah produksi tinggi yang membutuhkan protein bypass rumen.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌽', text: 'CGM adalah konsentrat protein jagung tertinggi (±61% BK) dengan energi terbaik (TDN 85%) — profil nutrisi protein-energi yang superior. Xantofil alami ±300 ppm menjadikan CGM pilihan utama untuk meningkatkan pigmentasi kuning telur dan kulit ayam tanpa pewarna sintetis.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein kasar setara bungkil kedelai premium (60–65% BK). TDN 85% — energi tertinggi di kategori limbah serealia. RUP tinggi ±65% sangat berguna untuk sapi perah produksi tinggi. Xantofil sebagai agen pigmentasi alami bernilai komersial tinggi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'KRITIS: Lisin sangat rendah (±0.9% BK) — harus selalu dikombinasi sumber lisin untuk unggas dan babi. Triptofan juga rendah. Harga lebih mahal dari bungkil kedelai impor. Asam amino tidak lengkap jika digunakan tunggal.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum broiler: CGM 8% + Bungkil kedelai 25% + Jagung 45% + Tepung ikan 8% + L-lisin 0.3% + Premix 13.7%. Ransum sapi perah: CGM 10% + Bungkil kedelai 12% + Konsentrat 30% + Silase 48% — kombinasi mengoptimalkan protein bypass dan produksi susu.' },
      { type: 'peringatan', icon: '🚨', text: 'JANGAN gunakan CGM sebagai satu-satunya sumber protein unggas — lisin rendah menyebabkan pertumbuhan terhambat parah. Selalu hitung asam amino total ransum menggunakan software formulasi. Batas 15% ransum untuk menghindari ketidakseimbangan asam amino.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif untuk protein tinggi: Bungkil kedelai (profil asam amino lebih seimbang, lebih fleksibel), CGF (protein lebih rendah, harga lebih murah), atau Tepung Ikan (asam amino lebih lengkap, lebih mahal).' },
    ],
  },

  // ── 8. DDGS ───────────────────────────────────────────────────────────────────
  'ddgs': {
    asalBahan: 'By-product produksi bioetanol dari jagung: ampas fermentasi jagung kering (distillers grains) dicampur dengan cairan terkonsentrasi (solubles) yang kemudian dikeringkan bersama',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Industri bioetanol jagung — Amerika Serikat, Brasil, Cina; Indonesia umumnya mengimpor; beberapa pabrik etanol jagung skala kecil mulai berkembang',
    prosesIndustriAsal: 'Jagung digiling → difermentasi oleh ragi (Saccharomyces cerevisiae) untuk menghasilkan etanol → etanol disuling (distilasi) → ampas kering (distillers grains) + cairan terkonsentrasi (solubles) digabung dan dikeringkan menjadi DDGS',
    bagianDimanfaatkan: 'Seluruh komponen jagung kecuali pati yang telah difermentasi menjadi etanol: protein, lemak, serat, dan mineral terkonsentrasi 3× dibanding jagung asli',
    metodePengolahan: 'Langsung diberikan; dapat dipelet; untuk ruminansia bisa diberikan basah (wet DDGS) yang lebih palatable; simpan kering untuk stabilitas',
    ketersediaan: 'Tersedia dari impor Amerika dan Argentina; harga fluktuatif mengikuti pasar bioetanol global; ketersediaan cukup stabil tapi tergantung kurs impor',
    kelebihan: 'Protein ±27–30% BK; lemak ±10% BK — sumber energi lemak yang baik; BETN dan serat terfermentasi rumen memberikan energi bertahan lama; palatabilitas lebih baik dari CGF karena proses fermentasi',
    kekurangan: 'Variasi komposisi antar pabrik sangat tinggi; warna lebih gelap menunjukkan kualitas asam amino lebih rendah; lisin dan metionin terbatas; harga dipengaruhi kurs dolar; sulfur tinggi (±0.7%) dari proses pengolahan',
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 27.0, sk: 7.5, lk: 10.0, abu: 4.9, betn: 50.6,
      tdn: 82, me: 3362,
      ndf: 40, adf: 15,
      ca: 0.07, p: 0.70, mg: 0.28, na: 0.20, k: 0.85, cl: 0.12, s: 0.70,
      vitamin: 'Vitamin B kompleks (B2, B3) dari proses fermentasi ragi cukup tinggi; Vitamin E sedang',
      mineral: 'P tinggi (0.70%) dengan bioavailabilitas lebih baik dari gandum by-product; S tinggi (0.70%) — perhatikan untuk ternak sensitif sulfur; K dan Na sedang',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      catatan: 'Batasi ≤30% ransum ruminansia; lebih dari 40% risiko polio (thiamine deficiency) dan gangguan sulfur. Untuk babi dan unggas batasi ≤15% karena NDF ±40% dan profil asam amino terbatas. Pilih DDGS warna kuning cerah (kualitas lebih baik) daripada warna cokelat gelap (overheated — kecernaan protein rendah).',
    },
    harga: {
      estimasiAI: 5200, hargaMarketplace: 4800,
      satuan: 'per kg', supplier: 'Importir bahan baku pakan; agen pakan feedlot; distributor bahan baku ternak nasional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Dried Distillers Grains with Solubles (DDGS), corn',
        'Shurson, G.C. (2018). The role of DDGS in swine and poultry nutrition. Animal Feed Sci Tech',
        'NRC (2016) — Nutrient Requirements of Beef Cattle 8th Ed., Table 15',
        'Schingoethe, D.J. et al. (2009). Recommendations for the feeding of DDGS to dairy cows. JDSC',
      ],
      sumberData: 'Nilai berdasarkan Feedipedia (2024) DDGS corn dan NRC (2016); rata-rata 25 sampel dari berbagai pabrik bioetanol Amerika',
      catatan: 'Nilai BK basis. Warna DDGS (Hunter L value) berkorelasi negatif dengan kualitas asam amino — semakin gelap semakin banyak Maillard products yang mengurangi kecernaan lisin.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚗️', text: 'DDGS adalah konsentrat nutrisi jagung pasca fermentasi etanol — semua komponen jagung kecuali pati (yang jadi etanol) terkonsentrasi 3×: protein ±27%, lemak ±10%, dan serat terfermentasi rumen ±40% NDF. Ini menjadikan DDGS sumber protein-lemak-serat fermentasi yang sangat berharga untuk ruminansia.' },
      { type: 'kelebihan', icon: '✅', text: 'Lemak ±10% BK memberikan energi padat untuk penggemukan. Proses fermentasi meningkatkan bioavailabilitas beberapa nutrisi. Lebih palatable dari CGF. P tersedia lebih baik. RUP ±40% bermanfaat untuk sapi perah. Tersedia konsisten dari impor Amerika.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Sulfur tinggi (±0.70% BK) — sangat berbahaya jika >0.3% total ransum ruminansia (risiko polioensefalomalaisia akibat keracunan sulfur). Variasi kualitas antar pabrik sangat tinggi. Lisin terbatas. Harga dipengaruhi kurs dan kebijakan ekspor Amerika.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum sapi feedlot: DDGS 20% + Silase jagung 40% + Bungkil kedelai 15% + Onggok 15% + Mineral 10%. Ransum sapi perah: DDGS 15% + Pollard 15% + Hijauan premium 45% + Premix 25%. HINDARI: DDGS + Ampas Kecap (keduanya tinggi S — risiko polioensefalomalaisia).' },
      { type: 'peringatan', icon: '🚨', text: 'KRITIS: Monitor kadar sulfur total ransum — pastikan <0.3% BK ransum total saat menggunakan DDGS. Pilih DDGS berwarna kuning emas (bukan cokelat gelap). Adaptasikan selama 2–3 minggu sebelum mencapai level penggunaan penuh.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: CGF (by-product jagung serupa, lebih tersedia lokal), Pollard Gandum (protein lebih rendah, lebih murah), atau Bungkil kedelai (asam amino lebih seimbang, tidak ada masalah sulfur).' },
    ],
  },

  // ── 9. Brewer's Grain / Ampas Bir ────────────────────────────────────────────
  'brewers-grain': {
    asalBahan: 'Sisa padat malt barley (Hordeum vulgare) setelah ekstraksi gula dan senyawa fermentable pada proses mashing (pembuatan bir/malt)',
    bentuk: ['Segar', 'Kering'],
    asal: 'Industri pembuatan bir dan malt — pabrik bir besar di Jakarta, Surabaya, Medan (Bintang, Heineken); industri malt untuk minuman; tersedia juga dari industri produksi malt untuk pangan',
    prosesIndustriAsal: "Malt barley dihaluskan (milling) → dicampur air panas (mashing) → gula dan senyawa fermentable diekstrak sebagai wort (cairan) → ampas padat (spent grain) yang tersisa adalah Brewer's Grain",
    bagianDimanfaatkan: 'Ampas padat malt barley pasca ekstraksi wort; kaya protein yang tidak larut dalam air, serat NDF, dan lipid residu dari lembaga barley',
    metodePengolahan: 'Kondisi segar (BK ±22%): gunakan dalam 24 jam atau disilase segera. Pengeringan: oven/rotary dryer untuk stabilitas jangka panjang. Silase BSG (Brewers Spent Grain): anaerob 3 minggu sebelum diberikan',
    ketersediaan: 'Tersedia dari pabrik bir/malt; jumlah terbatas di Indonesia karena industri bir tidak sebesar negara lain; tersedia hampir setiap hari di kota besar yang punya pabrik bir',
    kelebihan: 'Protein ±24–28% BK — sumber protein limbah industri tertinggi kedua setelah CGM; serat NDF ±50% mendukung kesehatan rumen; lemak ±7% BK sebagai tambahan energi; aroma fermentasi meningkatkan palatabilitas',
    kekurangan: 'Kondisi segar sangat mudah busuk (24–48 jam) di iklim tropis; NDF ±50% membatasi konsumsi maksimum; lisin terbatas; ketersediaan tergantung lokasi pabrik bir',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 24.0, sk: 16.5, lk: 6.8, abu: 3.7, betn: 49.0,
      tdn: 65, me: 2665,
      ndf: 50, adf: 24,
      ca: 0.30, p: 0.56, mg: 0.20, na: 0.10, k: 0.08, cl: 0.10, s: 0.25,
      vitamin: 'Vitamin B kompleks cukup (riboflavin, niasin dari proses malt); Vitamin E sedikit',
      mineral: 'Ca dan P cukup seimbang (rasio Ca:P ±1:2); Mg sedang; K rendah (sudah diekstrak ke wort)',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      catatan: "Brewer's grain basah: gunakan maksimal 8–10 kg/hari per sapi perah (±25–30% ransum BK). Lakukan adaptasi 1–2 minggu sebelum pemberian penuh. Disilase segera jika tidak habis dalam 1 hari. Jangan berikan pada unggas (NDF terlalu tinggi).",
    },
    harga: {
      estimasiAI: 1800, hargaMarketplace: 1200,
      satuan: 'per kg basah (BK ±22%)', supplier: 'Pabrik bir dan malt di kota besar (sering gratis atau harga sangat murah langsung dari pabrik)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Brewers grains, wet and dry',
        'Alimon, A.R. & Hair-Bejo, M. (1995). Feeding systems based on crop residues. FAO',
        'Mussatto, S.I. et al. (2006). Chemical and functional characterization of spent grain. Food Sci Tech',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
      ],
      sumberData: "Data komposisi Brewer's Grain basah dari pabrik bir Indonesia; nilai BK basis berdasarkan Feedipedia (2024) rata-rata 15 sampel",
      catatan: "Nilai BK basis. BK sangat rendah (±22% as-fed) — konversi ke BK penting untuk formulasi. 1 kg BSG basah ≈ 0.22 kg BM. Pastikan BSG tidak berbau asam berlebih atau busuk sebelum diberikan.",
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍺', text: "Brewer's Grain (BSG) adalah sumber protein murah berlimpah dari industri bir — protein ±24–28% BK dengan serat NDF ±50% yang difermentasi rumen dengan baik. Rasio Ca:P ±1:2 yang cukup seimbang menjadikannya pelengkap mineral yang tidak perlu koreksi besar." },
      { type: 'kelebihan', icon: '✅', text: 'Protein tinggi untuk bahan limbah industri basah. Aroma fermentasi malt sangat disukai sapi dan kambing. Tersedia hampir gratis atau sangat murah langsung dari pabrik bir. Ca:P lebih seimbang dari kebanyakan by-product serealia.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kondisi basah (BK ±22%) sangat mudah busuk dalam 24–48 jam di iklim tropis. Perlu manajemen rantai dingin atau disilase segera. NDF ±50% BK membatasi penggunaan pada ternak kecil dan unggas.' },
      { type: 'kombinasi', icon: '🔗', text: "Ransum sapi perah: BSG 8 kg basah + Rumput Gajah 20 kg + Konsentrat 3 kg/hari — formula murah tinggi produksi. Ransum kambing: BSG 500g basah + Leguminosa segar 2 kg + Onggok 300g/hari. Silase BSG: campurkan BSG 90% + Onggok 8% + Molases 2% → tutup anaerob 3 minggu." },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan BSG yang sudah berbau busuk, berlendir, atau berjamur. Cuaca panas Indonesia mempercepat pembusukan — distribusikan ke ternak dalam 6–8 jam setelah pengambilan dari pabrik jika tidak disilase.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika BSG tidak tersedia: Ampas Tahu (protein serupa ±25%, lebih tersedia luas), Spent Yeast (protein lebih tinggi ±45%, tapi harga lebih mahal), atau Bungkil kedelai (protein lebih tinggi, lebih mahal tapi konsisten).' },
    ],
  },

  // ── 10. Ampas Tahu ────────────────────────────────────────────────────────────
  'ampas-tahu': {
    asalBahan: 'Ampas padat (okara) sisa proses pembuatan tahu dari kedelai (Glycine max (L.) Merr.) — residu setelah ekstraksi protein susu kedelai',
    bentuk: ['Segar', 'Kering'],
    asal: 'Sentra industri tahu: Jawa (Sumedang, Pati, Kediri, Banyumas, Malang), Sumatera Barat, Sulawesi Selatan, Kalimantan Timur — tersedia di hampir seluruh kota Indonesia',
    prosesIndustriAsal: 'Kedelai direndam → digiling → disaring → filtrat dipanaskan dan digumpalkan menjadi tahu. Ampas tahu (okara) adalah residu padat dari proses penyaringan sebelum pemanasan',
    bagianDimanfaatkan: 'Serat kedelai, protein tidak larut, lemak, dan pati residu yang tidak tersaring ke susu kedelai; mengandung ±40–45% serat sel (NDF basis BK)',
    metodePengolahan: 'Kondisi segar: gunakan dalam 24 jam. Fermentasi Aspergillus: meningkatkan protein ±30–35% BK dan kecernaan. Pengeringan: simpan hingga 3 bulan. Silase: campurkan dengan jerami atau onggok sebagai bahan pengering',
    ketersediaan: 'Tersedia setiap hari dari ribuan pengrajin tahu di seluruh Indonesia; harga sangat murah atau gratis; berlimpah dan konsisten sepanjang tahun',
    kelebihan: 'Protein ±25–28% BK — sumber protein lokal termurah dan paling berlimpah; lemak ±12% BK sebagai tambahan energi; sangat mudah didapat; cocok sebagai basis protein ransum lokal',
    kekurangan: 'Kadar air sangat tinggi (BK ±20%) — sangat mudah busuk dalam 12–24 jam di iklim tropis; NDF ±44% membatasi penggunaan pada unggas; perlu transportasi dingin atau pengolahan cepat',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 25.5, sk: 18.5, lk: 12.0, abu: 4.0, betn: 40.0,
      tdn: 72, me: 2952,
      ndf: 44, adf: 22,
      ca: 0.50, p: 0.35, mg: 0.22, na: 0.02, k: 0.55, cl: 0.03, s: 0.30,
      vitamin: 'Isoflavon kedelai (genistein, daidzein) cukup tinggi; Vitamin E sedang; B kompleks rendah',
      mineral: 'Ca relatif baik (0.50%) dari proses pengolahan tahu; rasio Ca:P ±1.4:1 cukup seimbang; K cukup',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui', 'Bunting'],
      catatan: 'Batasi 25–30% ransum BK. Segar: distribusikan dalam 12 jam setelah pabrik. Fermentasi dengan Rhizopus atau Aspergillus (48 jam, suhu ruang) meningkatkan protein dan kecernaan serta umur simpan 3–5 hari. Jangan berikan yang sudah berbau busuk/asam kuat.',
    },
    harga: {
      estimasiAI: 1500, hargaMarketplace: 1000,
      satuan: 'per kg basah (BK ±20%)', supplier: 'Pabrik/pengrajin tahu di kota setempat (sering gratis atau Rp 500–1.500/kg)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 138',
        'Feedipedia (2024) — Soybean okara (tofu waste)',
        'Sinurat, A.P. et al. (2004) — Bahan pakan unggas non konvensional',
        'Tillman et al. (1991) — Ilmu Makanan Ternak Dasar, hal. 93',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Analisis proksimat ampas tahu dari pengrajin tahu Jawa Barat dan Jawa Tengah; nilai rata-rata 20 sampel. Data BK basis berdasarkan Hartadi et al. (1997)',
      catatan: 'Nilai BK basis. BK sangat variabel (15–25%) tergantung pengrajin dan proses penyaringan. Fermentasi Aspergillus niger meningkatkan PK menjadi ±30–35% dan kecernaan serat 20–25%.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🫘', text: 'Ampas Tahu (Okara) adalah sumber protein lokal paling berlimpah dan paling terjangkau di Indonesia — protein ±25–28% BK dengan harga hampir nol. Tersedia setiap hari dari ribuan pengrajin tahu di seluruh Indonesia, menjadikannya tulang punggung ransum berbasis lokal untuk sapi perah dan kambing perah.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga hampir nol di tempat; protein substansial untuk limbah basah; lemak ±12% BK tambahan energi; Ca:P seimbang; isoflavon kedelai berpotensi meningkatkan reproduksi induk betina; tersedia setiap hari tanpa perlu pemesanan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'KRITIS: Busuk dalam 12–24 jam di suhu tropis tanpa pengolahan. BK hanya ±20% — volume pemberian besar tapi BK sedikit. NDF ±44% membatasi unggas. Perlu logistik pengambilan rutin dari pabrik tahu.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum sapi perah harian: Ampas Tahu 5 kg basah (±1 kg BK) + Rumput Gajah 25 kg + Dedak 1 kg + Mineral 100g — formula sapi perah rakyat yang sangat ekonomis. Fermentasi ampas tahu 48 jam + tambahkan molases 5% → palatabilitas dan umur simpan meningkat drastis.' },
      { type: 'peringatan', icon: '🚨', text: 'Ambil langsung dari pabrik tahu hari itu juga. Di musim hujan atau suhu tinggi, proses pembusukan berlangsung lebih cepat — distribusikan dalam 6 jam. Bau asam cuka berlebih = sudah terlalu asam. Bau busuk/putrefaksi = buang.' },
      { type: 'alternatif', icon: '🔄', text: "Alternatif jika ampas tahu tidak tersedia: Brewer's Grain (protein serupa, lebih murah tapi ketersediaan terbatas), Ampas Tempe (protein serupa), atau Bungkil kedelai (protein lebih tinggi, lebih stabil, lebih mahal)." },
    ],
  },

  // ── 11. Ampas Tempe ───────────────────────────────────────────────────────────
  'ampas-tempe': {
    asalBahan: 'Sisa kedelai dari proses pembuatan tempe: kulit ari kedelai, kedelai rusak/pecah, dan sisa perebusan yang tidak masuk cetakan tempe',
    bentuk: ['Segar', 'Kering'],
    asal: 'Sentra produksi tempe: Jawa (hampir merata), Sumatera, Bali; tersedia dari pengrajin tempe rumah tangga dan industri tempe kecil-menengah',
    prosesIndustriAsal: 'Kedelai direndam → direbus → dikupas kulitnya → diinokulas Rhizopus → diinkubasi. Ampas tempe adalah kulit ari (hull) kedelai yang terpisah saat pengupasan, plus kedelai pecah yang tidak masuk cetakan',
    bagianDimanfaatkan: 'Kulit ari kedelai dan kedelai rusak/pecah setelah pengupasan dan perebusan; sudah dimasak sehingga antinutrisi kedelai mentah sudah diinaktivasi',
    metodePengolahan: 'Kondisi segar/lembab: gunakan dalam 24 jam. Pengeringan: stabil hingga 3 bulan. Fermentasi lanjutan juga dapat dilakukan untuk meningkatkan kecernaan',
    ketersediaan: 'Tersedia dari pengrajin tempe; jumlah lebih terbatas dari ampas tahu karena proses tempe lebih sedikit menghasilkan ampas; tersedia di kota dengan industri tempe aktif',
    kelebihan: 'Protein ±22% BK; sudah melalui perebusan — antinutrisi kedelai (inhibitor tripsin, hemaglutinin) sudah diinaktivasi panas; kecernaan lebih baik dari kedelai mentah; palatabilitas baik',
    kekurangan: 'Ketersediaan lebih terbatas dari ampas tahu; kadar air tinggi (BK ±85% kering, atau ±20% basah) sehingga perlu pengelolaan; volume produksi per pengrajin kecil',
    nutrisi: {
      bk: 85, kadarAir: 15,
      pk: 22.0, sk: 15.0, lk: 10.0, abu: 4.5, betn: 48.5,
      tdn: 71, me: 2911,
      ndf: 38, adf: 18,
      ca: 0.32, p: 0.40, mg: 0.18, na: 0.02, k: 0.45, cl: 0.03, s: 0.28,
      vitamin: 'Isoflavon kedelai residu; Vitamin E sedang; B kompleks cukup',
      mineral: 'Ca:P rasio ±0.8:1 (hampir seimbang); Mg cukup; K sedang',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Dapat diberikan langsung kering atau dibasahi. Antinutrisi sudah diinaktivasi panas sehingga lebih aman dari kedelai mentah. Batasi 20–25% ransum BK. Bau asam ringan dari fermentasi Rhizopus normal dan palatabilitas baik.',
    },
    harga: {
      estimasiAI: 1800, hargaMarketplace: 1500,
      satuan: 'per kg', supplier: 'Pengrajin tempe di kota setempat; pasar bahan pakan ternak lokal',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Feedipedia (2024) — Soybean hulls',
        'Sinurat, A.P. et al. (2004) — Bahan pakan unggas non konvensional',
      ],
      sumberData: 'Data komposisi berdasarkan campuran kulit ari kedelai dan kedelai perebusan dari Hartadi et al. (1997) dan analisis lokal pengrajin tempe Jawa',
      catatan: 'Nilai BK basis untuk ampas tempe kering. Ampas tempe segar (BK ±20%) perlu konversi. Kandungan protein bervariasi tergantung proporsi kulit ari vs kedelai utuh yang tidak masuk cetakan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🫘', text: 'Ampas Tempe adalah kulit ari kedelai + kedelai rusak yang sudah melalui perebusan, sehingga inhibitor tripsin dan hemaglutinin (antinutrisi utama kedelai mentah) sudah diinaktivasi. Ini menjadikan ampas tempe lebih aman dan lebih mudah dicerna dibandingkan kedelai mentah atau kulit kedelai mentah.' },
      { type: 'kelebihan', icon: '✅', text: 'Antinutrisi kedelai sudah diinaktivasi panas — lebih aman dari kedelai mentah. Protein ±22% BK dengan kecernaan lebih baik. Proses perebusan juga meningkatkan kecernaan serat. Palatabilitas baik untuk ruminansia.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ketersediaan lebih terbatas dari ampas tahu — tidak semua daerah punya industri tempe aktif. Volume per pengrajin kecil sehingga perlu pengumpulan dari beberapa sumber. Kadar air bervariasi tergantung proses pengrajin.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum kambing potong: Ampas Tempe 20% + Rumput lapangan 50% + Onggok 20% + Mineral 10%. Sebagai substitusi parsial bungkil kedelai dalam ransum ruminansia: Ampas Tempe 15% dapat menggantikan 10% bungkil kedelai dalam formulasi. Kombinasi Ampas Tempe + Ampas Tahu (50:50) memberikan sumber protein kedelai komprehensif.' },
      { type: 'peringatan', icon: '🚨', text: 'Pastikan ampas yang diambil berasal dari proses perebusan yang sempurna (minimal 100°C selama 30 menit) — perebusan kurang sempurna menyisakan inhibitor tripsin. Jangan berikan dalam kondisi berjamur atau berbau busuk.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: Ampas Tahu (lebih berlimpah, protein serupa), Kulit Kedelai (protein lebih rendah, serat lebih tinggi), atau Bungkil Kedelai (lebih konsisten, lebih mahal).' },
    ],
  },

  // ── 12. Ampas Kecap ───────────────────────────────────────────────────────────
  'ampas-kecap': {
    asalBahan: 'Ampas padat sisa fermentasi dan filtrasi kedelai pada produksi kecap — residu setelah ekstraksi cairan kecap dari koji kedelai yang difermentasi',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Industri kecap nasional: Jawa (Magelang, Blitar, Sidoarjo — pabrik Bango, ABC, Indofood), Sumatera; tersedia dari pabrik kecap besar dan rumah tangga',
    prosesIndustriAsal: 'Kedelai dikukus → dicampur tepung terigu → difermentasi (koji) dengan Aspergillus sojae → moromi fermentasi 3–6 bulan → diperas untuk mengekstrak kecap cair → ampas padat yang tersisa adalah ampas kecap',
    bagianDimanfaatkan: 'Residu padat moromi setelah ekstraksi cairan kecap; mengandung protein terkonsentrasi, serat, dan senyawa fermentasi Maillard; juga mengandung garam (NaCl) dari proses moromi',
    metodePengolahan: 'Biasanya sudah semi-kering dari proses peras; keringkan lebih lanjut untuk stabilitas; cuci dengan air untuk mengurangi kadar garam jika diperlukan; langsung diberikan dengan memperhatikan kadar garam',
    ketersediaan: 'Tersedia dari pabrik kecap besar; produksi tidak sebesar ampas tahu; tersedia di daerah dekat pabrik kecap; harga murah atau gratis dari pabrik',
    kelebihan: 'Protein tinggi ±30–35% BK (terkonsentrasi pasca ekstraksi cairan); aroma fermentasi meningkatkan palatabilitas; sumber asam amino yang beragam dari fermentasi Aspergillus; Ca dan P cukup baik',
    kekurangan: 'Kadar garam NaCl sangat tinggi (±5–8% BK) — faktor pembatas utama; toksik jika berlebihan; variasi komposisi antar pabrik tinggi',
    nutrisi: {
      bk: 75, kadarAir: 25,
      pk: 32.0, sk: 12.0, lk: 8.0, abu: 16.0, betn: 32.0,
      tdn: 68, me: 2788,
      ndf: 35, adf: 16,
      ca: 0.40, p: 0.55, mg: 0.20, na: 3.50, k: 0.80, cl: 5.50, s: 0.45,
      vitamin: 'Vitamin B12 dari fermentasi Aspergillus sedang; niasin cukup; B kompleks dari proses fermentasi',
      mineral: 'Na sangat tinggi (3.50% BK = ±3.500 mg/100g) — faktor pembatas utama; Cl sangat tinggi (5.50%); Ca dan P cukup seimbang; K sedang',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'BATASI ≤5% ransum BK karena kadar Na sangat tinggi. WAJIB sediakan air minum yang berlimpah. Cuci dengan air 1:3 (ampas:air) dan tiriskan untuk mengurangi kadar garam hingga 50% sebelum diberikan. Jangan berikan pada ternak bunting atau yang punya masalah ginjal.',
    },
    harga: {
      estimasiAI: 2000, hargaMarketplace: 1500,
      satuan: 'per kg', supplier: 'Pabrik kecap lokal dan nasional; pengrajin kecap rumah tangga',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Soy sauce residue',
        'Sinurat, A.P. et al. (2004) — Bahan pakan unggas non konvensional',
        'Tillman et al. (1991) — Ilmu Makanan Ternak Dasar',
      ],
      sumberData: 'Data komposisi berdasarkan analisis ampas kecap dari pabrik kecap Jawa Tengah dan Jawa Timur; kadar garam dari data industri kecap nasional',
      catatan: 'Na dan Cl sangat tinggi karena proses moromi menggunakan air garam (brine). Cuci dengan air dapat mengurangi Na 40–60% tergantung waktu pencucian. Analisis Na lokal sangat disarankan sebelum formulasi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🫙', text: 'Ampas Kecap adalah residu fermentasi koji kedelai dengan protein ±32% BK — nilai protein tertinggi di antara ampas berbasis kedelai. Namun, kadar garam NaCl ±5–8% BK adalah faktor pembatas kritikal yang menentukan batas penggunaan maksimal hanya 5% ransum.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein sangat tinggi (±32% BK) untuk limbah pangan. Aroma fermentasi koji sangat meningkatkan palatabilitas — ternak menyukainya. Fermentasi Aspergillus meningkatkan ketersediaan asam amino. Harga murah atau gratis dari pabrik kecap.' },
      { type: 'kekurangan', icon: '⚠️', text: 'KRITIS: Na sangat tinggi (±3.5% BK = 35.000 mg/kg) — 10× batas aman ransum ruminansia (0.3% BK). Konsumsi berlebih menyebabkan keracunan garam, hipertensi, dan kerusakan ginjal. Cl tinggi mengganggu keseimbangan anion-kation ransum (DCAB). Ini bahan yang perlu kehati-hatian tertinggi di kategori ini.' },
      { type: 'kombinasi', icon: '🔗', text: 'Penggunaan HANYA sebagai flavoring/palatabilitas enhancer: tambahkan 3–5% ransum BK + sediakan air minum 2× normal. Cuci terlebih dahulu dengan air mengalir 10 menit untuk mengurangi garam 40–50%. JANGAN kombinasikan dengan bahan tinggi Na lainnya (garam, DDGS, ampas mi instan).' },
      { type: 'peringatan', icon: '🚨', text: 'KRITIS: Jangan berikan >5% ransum BK. Selalu sediakan air minum berlimpah dan tidak terbatas. Jangan berikan pada ternak bunting (risiko edema), ternak dengan gangguan ginjal, atau cuaca panas ekstrem (dehidrasi). Cuci selalu sebelum pemberian untuk mengurangi garam.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika hanya butuh protein tanpa risiko garam: Ampas Tahu (lebih aman, lebih murah) atau Bungkil kedelai (protein lebih tinggi, konsisten, tanpa masalah garam).' },
    ],
  },

  // ── 13. Ampas Roti ────────────────────────────────────────────────────────────
  'ampas-roti': {
    asalBahan: 'Sisa produksi, roti afkir, roti kadaluarsa, atau remahan roti dari industri bakeri skala kecil, menengah, dan besar',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Industri bakeri di seluruh Indonesia — roti tawar, roti manis, bun, puff, dan roti artisan; pabrik roti besar (Sari Roti, Gardenia, Pacific), toko roti menengah, dan home bakery',
    prosesIndustriAsal: 'Tepung terigu + air + ragi + gula + garam + lemak → diuleni → difermentasi → dipanggang. Ampas roti adalah sisa produksi (potongan, remahan, produk cacat) dan roti yang mendekati/melewati tanggal kedaluwarsa',
    bagianDimanfaatkan: 'Seluruh produk roti afkir — roti tawar, roti manis, bun; mengandung pati tergelatinisasi, protein gluten, ragi, gula, dan lemak dalam bentuk mudah dicerna',
    metodePengolahan: 'Kering/remah: langsung diberikan. Dibasahi: campur air 1:0.5 untuk meningkatkan palatabilitas. Digiling: meningkatkan keseragaman dan pencampuran ke ransum. Pengeringan sisa roti basah sebelum penyimpanan',
    ketersediaan: 'Tersedia dari toko roti, pabrik roti, dan bakeri lokal di kota besar — kuantitas bervariasi; sering gratis atau sangat murah sebagai limbah bakeri',
    kelebihan: 'Energi sangat tinggi (TDN ±82%) — pati tergelatinisasi sangat mudah dicerna; palatabilitas luar biasa untuk semua ternak; protein gluten ±11.5% BK cukup baik; harga murah atau gratis',
    kekurangan: 'Kadar garam bervariasi tergantung formulasi roti; roti manis memiliki gula tinggi yang dapat menyebabkan diare jika berlebihan; kadar air tidak konsisten; perlu dikeringkan untuk stabilitas penyimpanan',
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 11.5, sk: 2.5, lk: 5.5, abu: 3.0, betn: 77.5,
      tdn: 82, me: 3362,
      ndf: 18, adf: 5,
      ca: 0.10, p: 0.15, mg: 0.06, na: 0.50, k: 0.18, cl: 0.75, s: 0.12,
      vitamin: 'Vitamin B1 dari ragi roti cukup; Vitamin E dari tepung terigu sedang; Vitamin B kompleks dari ragi fermentasi',
      mineral: 'Na dan Cl sedang dari garam roti; Ca dan P rendah — suplementasi mineral diperlukan; rasio Ca:P ±0.7:1',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi', 'Ayam'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'Batasi ≤20% ransum BK untuk menghindari asidosis dari gula dan pati berlebihan. Adaptasikan secara bertahap (mulai 5%, tambah 5% per minggu). Periksa kadar garam — roti dengan garam tinggi perlu dibatasi lebih ketat. Keringkan roti basah sebelum dicampur ke ransum.',
    },
    harga: {
      estimasiAI: 2500, hargaMarketplace: 2000,
      satuan: 'per kg', supplier: 'Toko roti, pabrik roti, bakeri lokal; sering gratis atau sangat murah',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Bread, bakery waste',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed.',
        'Göhl (1981) — Tropical Feeds, FAO',
      ],
      sumberData: 'Data komposisi roti tawar dan roti manis dari analisis laboratorium pakan; nilai rata-rata berdasarkan Feedipedia (2024)',
      catatan: 'Nilai BK basis. Komposisi sangat bervariasi tergantung jenis roti (tawar vs manis vs croissant). Na ±0.5% dari garam roti standar. Roti manis memiliki BETN lebih tinggi dan NE lebih tinggi dari roti tawar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍞', text: 'Ampas Roti mengandung pati tergelatinisasi (sudah dimasak dalam oven) dengan kecernaan sangat tinggi — TDN ±82% BK mendekati jagung pipil. Protein gluten yang tersisa memberikan kontribusi protein cukup baik (±11.5% BK), menjadikannya sumber energi berkualitas tinggi dari limbah bakeri.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas tertinggi di kategori ini — semua ternak menyukainya. TDN ±82% mendekati jagung. Vitamin B dari ragi roti bermanfaat. Sering tersedia gratis dari toko roti. NDF rendah (±18%) — cocok untuk semua jenis ternak termasuk unggas.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Gula residu dari roti manis dapat menyebabkan diare osmotik jika berlebihan. Garam (Na ±0.5%) perlu diperhatikan. Ca dan P sangat rendah — selalu suplementasi mineral. Komposisi sangat bervariasi antar jenis roti — sulit formulasi yang akurat.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum penggemukan cepat: Ampas Roti 15% + Jagung 30% + Bungkil kedelai 20% + Jerami amoniasi 25% + Mineral 10%. Untuk ayam pedaging: Ampas Roti digiling halus 10% + Jagung 50% + Bungkil kedelai 28% + Tepung ikan 7% + Premix 5%. Roti yang dikeringkan dan digiling memberikan partikel ukuran tepung yang mudah dicampur.' },
      { type: 'peringatan', icon: '🚨', text: 'Adaptasikan perlahan — pati tergelatinisasi dan gula tinggi dapat menyebabkan asidosis rumen jika diberikan tiba-tiba dalam jumlah besar. Periksa apakah roti mengandung bahan berbahaya (xylitol untuk anjing, cokelat). Batasi 20% ransum BK.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif energi tinggi: Ampas Biskuit (TDN lebih tinggi ±87%), Jagung Pipil (lebih konsisten), atau Molases (energi cair serupa tapi lebih mahal per BK).' },
    ],
  },

  // ── 14. Ampas Biskuit ─────────────────────────────────────────────────────────
  'ampas-biskuit': {
    asalBahan: 'Sisa produksi, biskuit/cracker afkir, remahan, atau produk cacat dari industri snack dan biskuit',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Industri snack dan biskuit — pabrik besar (Khong Guan, Roma, Nissin, Monde, Nabisco), industri rumah tangga, dan toko roti/snack',
    prosesIndustriAsal: 'Tepung terigu + gula + lemak (margarin/shortening) + garam + soda kue → dicampur → dibentuk → dipanggang. Ampas biskuit adalah remahan, produk cacat bentuk, atau biskuit mendekati kedaluwarsa',
    bagianDimanfaatkan: 'Biskuit kering utuh atau remahan — kadar air sangat rendah (<5%) menjadikannya lebih stabil dari ampas bakeri lainnya; kaya pati tergelatinisasi, gula, dan lemak',
    metodePengolahan: 'Langsung diberikan; digiling jika ukuran terlalu besar; tidak perlu pengeringan karena sudah sangat kering; dapat disimpan lama (3–6 bulan)',
    ketersediaan: 'Tersedia dari pabrik biskuit dan industri snack; toko bahan pakan di daerah industri manufaktur pangan; jumlah produksi limbah cukup signifikan',
    kelebihan: 'Energi tertinggi di antara ampas bakeri (TDN ±87%); sangat stabil dan mudah disimpan (kadar air <5%); palatabilitas sangat tinggi; NDF sangat rendah (±14%) — cocok untuk unggas dan babi',
    kekurangan: 'Lemak sangat tinggi (±15% BK) — dapat mengganggu fermentasi rumen jika berlebihan; gula tinggi dari biskuit manis — batasi pemberian; protein sangat rendah (±8.5% BK)',
    nutrisi: {
      bk: 95, kadarAir: 5,
      pk: 8.5, sk: 2.0, lk: 15.0, abu: 2.5, betn: 72.0,
      tdn: 87, me: 3567,
      ndf: 14, adf: 4,
      ca: 0.15, p: 0.18, mg: 0.05, na: 0.60, k: 0.12, cl: 0.90, s: 0.10,
      vitamin: 'Vitamin A (beta-karoten buatan) dari biskuit berwarna; Vitamin E dari lemak nabati; B kompleks minimal',
      mineral: 'Na dan Cl sedang dari garam biskuit; Ca, P sangat rendah; rasio Ca:P ±0.8:1; Mg sangat rendah',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 15,
      targetTernak: ['Ayam Broiler', 'Babi', 'Sapi Potong', 'Kambing'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'Batasi KETAT ≤15% ransum BK — lemak tinggi menyebabkan gangguan fermentasi rumen di atas 15%. Untuk unggas: maksimal 10–12% karena lemak tinggi dapat mengurangi kualitas karkas. Pastikan biskuit tidak mengandung perisa atau pewarna berbahaya. Hitung Ca:P dan suplementasi mineral.',
    },
    harga: {
      estimasiAI: 3000, hargaMarketplace: 2500,
      satuan: 'per kg', supplier: 'Pabrik biskuit dan snack; distributor limbah pangan industri',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Biscuit waste, bakery by-products',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed.',
        'NRC (2012) — Nutrient Requirements of Swine 11th Ed.',
      ],
      sumberData: 'Data komposisi biskuit remahan dari analisis laboratorium pakan nasional; nilai rata-rata biskuit kering standar dari Feedipedia (2024)',
      catatan: 'Nilai BK basis. Komposisi sangat bervariasi — biskuit cokelat memiliki lemak lebih tinggi, biskuit cracker memiliki garam lebih tinggi, biskuit manis memiliki gula lebih tinggi. Analisis sampel spesifik sangat disarankan sebelum formulasi skala besar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍪', text: 'Ampas Biskuit memiliki TDN tertinggi (±87%) di antara semua bahan di kategori limbah industri pangan — melampaui jagung pipil (80%). Kadar air sangat rendah (<5%) menjadikannya bahan paling stabil dan mudah disimpan. Energi padat dari pati + gula + lemak menjadikannya sumber energi premium untuk penggemukan cepat.' },
      { type: 'kelebihan', icon: '✅', text: 'TDN tertinggi di kategori (±87%); kadar air sangat rendah — stabil 3–6 bulan. Palatabilitas sangat tinggi. NDF sangat rendah (±14%) — cocok untuk unggas. Mudah digiling dan dicampur ke formulasi ransum.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Lemak sangat tinggi (±15% BK) — batasi sangat ketat ≤15% ransum ruminansia. Protein sangat rendah (±8.5%) — harus dikombinasi sumber protein. Garam bervariasi — cracker lebih asin dari biskuit manis. Variasi komposisi antar jenis biskuit sangat besar.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum penggemukan sapi intens: Biskuit 10% + Jagung 30% + Bungkil kedelai 20% + Jerami amoniasi 30% + Mineral 10% — TDN ransum mendekati 80%. Ransum broiler: Biskuit (digiling) 8% + Jagung 45% + Bungkil kedelai 30% + Tepung ikan 10% + Premix 7%.' },
      { type: 'peringatan', icon: '🚨', text: 'Lemak ±15% BK: >15% ransum ruminansia menghambat fermentasi rumen secara signifikan. Periksa jenis biskuit — biskuit cokelat tidak boleh diberikan ke kuda (theobromin). Gula tinggi dari biskuit manis: adaptasikan bertahap 2 minggu. Periksa pelabelan — hindari biskuit dengan xylitol.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif energi tinggi: Ampas Roti (lemak lebih rendah, lebih aman untuk ruminansia), Jagung Pipil (lebih konsisten tapi lebih mahal), atau Molases (energi cair, lebih murah per TDN).' },
    ],
  },

  // ── 15. Ampas Mi ──────────────────────────────────────────────────────────────
  'ampas-mi': {
    asalBahan: 'Sisa produksi, mi afkir, atau mi rusak dari industri mi instan (Indomie, Mie Sedaap, Supermi) dan mi basah/kering dari pabrik mi lokal',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Industri mi instan skala nasional dan mi basah skala rumah tangga/UMKM di seluruh Indonesia; tersedia terutama di kota industri pangan (Bekasi, Tangerang, Surabaya)',
    prosesIndustriAsal: 'Mi instan: tepung terigu → dicetak → dikukus → digoreng dalam minyak sawit (mi goreng) atau dikeringkan (mi kering) → dikemas. Ampas mi adalah produk cacat, potongan, atau mi mendekati kedaluwarsa. Mi basah: tepung + air + alkali → dicetak → tanpa pemasakan lebih lanjut',
    bagianDimanfaatkan: 'Mi goreng: kaya pati tergelatinisasi + minyak goreng tinggi. Mi kering: pati tergelatinisasi + sedikit lemak. Potongan dan remahan mi dari lini produksi',
    metodePengolahan: 'Mi instan/kering: langsung diberikan atau digiling. Mi basah: segera diberikan atau dikeringkan dalam 12 jam. PERHATIAN: pisahkan bumbu dari mi instan sebelum diberikan ke ternak',
    ketersediaan: 'Tersedia dari pabrik mi instan dan pabrik mi basah; kuantitas bervariasi; harga murah sebagai limbah produksi',
    kelebihan: 'Energi tinggi (TDN ±83%); pati tergelatinisasi sangat mudah dicerna; palatabilitas baik; mi goreng memberikan lemak tambahan sebagai sumber energi; NDF rendah (±16%) cocok untuk unggas',
    kekurangan: 'Mi instan mengandung bumbu yang kaya garam, MSG, dan rempah — WAJIB pisahkan bumbu sebelum diberikan; lemak goreng (mi instan goreng) dapat tengik; kadar Na bervariasi',
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 10.5, sk: 1.5, lk: 16.0, abu: 3.5, betn: 68.5,
      tdn: 83, me: 3403,
      ndf: 16, adf: 4,
      ca: 0.08, p: 0.12, mg: 0.05, na: 0.80, k: 0.15, cl: 1.20, s: 0.10,
      vitamin: 'Vitamin dari mi yang difortifikasi (beberapa brand) — B1, B2, niasin; namun tidak konsisten',
      mineral: 'Na sedang-tinggi (0.80%) dari garam mi; Cl tinggi (1.20%); Ca dan P sangat rendah; Mg sangat rendah',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Kambing', 'Babi', 'Ayam Broiler'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'WAJIB pisahkan bumbu mi instan sebelum diberikan — bumbu mengandung garam, MSG, rempah, dan bahan tambahan yang tidak cocok untuk ternak. Batasi ≤15% ransum BK karena lemak tinggi (mi goreng). Mi basah gunakan dalam 12 jam. Suplementasi Ca dan mineral wajib.',
    },
    harga: {
      estimasiAI: 2800, hargaMarketplace: 2300,
      satuan: 'per kg', supplier: 'Pabrik mi instan dan mi basah; distributor limbah pangan industri',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Noodle waste, bakery waste',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed.',
        'Sinurat, A.P. et al. (2004) — Bahan pakan unggas non konvensional',
      ],
      sumberData: 'Data komposisi ampas mi instan goreng dari analisis laboratorium pakan; nilai rata-rata berdasarkan komposisi tepung terigu + minyak goreng sawit pasca penggorengan',
      catatan: 'Nilai BK basis untuk mi goreng (mi instan yang digoreng). Mi kering (air-dried) memiliki lemak lebih rendah ±5% BK dan energi sedikit lebih rendah. Pisahkan bumbu SELALU sebelum diberikan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍜', text: 'Ampas Mi menyumbang energi tinggi (TDN ±83%) dari kombinasi pati tergelatinisasi + minyak goreng (mi instan). NDF sangat rendah (±16%) menjadikannya cocok untuk unggas. Protein gluten ±10.5% BK memberikan kontribusi asam amino esensial (glutamin, prolin) untuk fungsi usus.' },
      { type: 'kelebihan', icon: '✅', text: 'TDN tinggi (±83%) mendekati jagung. NDF sangat rendah cocok untuk unggas dan babi. Palatabilitas baik. Tersedia dari pabrik mi di hampir semua kota besar Indonesia.' },
      { type: 'kekurangan', icon: '⚠️', text: 'KRITIS: Bumbu mi instan mengandung garam berlebih, MSG, dan rempah yang tidak cocok untuk ternak — pisahkan SELALU. Minyak goreng bekas (dari mi goreng) rentan tengik. Lemak ±16% BK membatasi penggunaan ruminansia. Na dan Cl sedang-tinggi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum broiler (mi kering digiling): Mi 10% + Jagung 45% + Bungkil kedelai 28% + Tepung ikan 10% + Premix 7%. Ransum sapi potong: Mi goreng (tanpa bumbu) 10% + Onggok 20% + Bungkil kedelai 15% + Hijauan 45% + Mineral 10%.' },
      { type: 'peringatan', icon: '🚨', text: 'PISAHKAN BUMBU MI INSTAN — WAJIB. Bumbu mengandung natrium ribonukleat (penguat rasa) dan garam ±40% bobot bumbu yang sangat berbahaya. Mi goreng yang sudah tengik (bau oil rancid) JANGAN diberikan. Batasi ≤15% ransum BK untuk ruminansia.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: Ampas Roti (lebih aman karena tidak ada masalah bumbu), Ampas Biskuit (energi lebih tinggi, lebih stabil), atau Jagung Pipil (lebih konsisten, tidak ada masalah kontaminan).' },
    ],
  },

  // ── 16. Ampas Tapioka ─────────────────────────────────────────────────────────
  'ampas-tapioka': {
    asalBahan: 'Sisa penggilingan singkong (Manihot esculenta Crantz) skala rumah tangga atau industri kecil untuk pembuatan tapioka atau tepung singkong; lebih basah dan kasar dari onggok industri besar',
    bentuk: ['Segar', 'Kering'],
    asal: 'Industri tapioka skala kecil-menengah dan pengolahan singkong rumah tangga di seluruh Indonesia; Lampung, Jawa Tengah, Jawa Timur, Sumatera Selatan',
    prosesIndustriAsal: 'Singkong dikupas → diparut/digiling → diperas/disaring untuk mengekstrak pati → ampas padat tersisa. Ampas tapioka skala kecil memiliki partikel lebih kasar dan kadar air lebih tinggi dari onggok industri besar',
    bagianDimanfaatkan: 'Serat singkong, pati residu, dan kulit dalam yang tidak tersaring; kadar air lebih tinggi (±80%) dari onggok kering industri',
    metodePengolahan: 'Basah: gunakan dalam 24 jam atau fermentasi. Pengeringan matahari (2–3 hari): menjadi setara onggok. Fermentasi: tingkatkan kecernaan dan kandungan protein',
    ketersediaan: 'Sangat berlimpah di daerah penanaman singkong; lebih mudah didapat dari pengolah singkong rumah tangga; harga nol atau sangat murah',
    kelebihan: 'Ketersediaan sangat lokal dan melimpah; harga nol atau hampir nol; kandungan nutrisi setara onggok setelah dikeringkan; mudah diperoleh tanpa jalur distribusi panjang',
    kekurangan: 'Kadar air sangat tinggi (±80%) — sangat mudah rusak; HCN residu dari singkong, terutama varietas pahit; protein sangat rendah setara onggok (±2% BK)',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 1.6, sk: 11.0, lk: 0.4, abu: 2.0, betn: 85.0,
      tdn: 72, me: 2952,
      ndf: 25, adf: 14,
      ca: 0.10, p: 0.08, mg: 0.03, na: 0.01, k: 0.10, cl: 0.02, s: 0.01,
      vitamin: 'Minimal; hampir tidak ada vitamin signifikan',
      mineral: 'Ca dan P sangat rendah; Na dan Mg minimal; suplementasi mineral wajib',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 35,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'Setara onggok setelah dikeringkan — panduan penggunaan sama dengan onggok. Fermentasikan dengan ragi tape atau Aspergillus untuk meningkatkan kandungan protein menjadi ±8% BK. Wajib kombinasikan dengan sumber protein. Keringkan sebelum disimpan.',
    },
    harga: {
      estimasiAI: 800, hargaMarketplace: 500,
      satuan: 'per kg basah', supplier: 'Pengolah singkong rumah tangga; pengrajin tapioka skala kecil di daerah setempat',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Feedipedia (2024) — Cassava pulp, wet',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data komposisi ampas tapioka basah dari pengrajin singkong skala kecil; dikonfirmasi dengan data Feedipedia (2024) cassava pulp wet',
      catatan: 'Nilai BK basis. BK ampas tapioka basah ±15–25% as-fed — bervariasi tergantung cara pemerasan. 1 kg basah ≈ 0.2 kg BM rata-rata. Setara onggok kering setelah dikeringkan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Ampas Tapioka adalah versi segar/lokal dari Onggok Tapioka — kandungan nutrisi hampir identik setelah dikeringkan. Berbeda dalam hal kadar air (±80% vs ±12% onggok kering) dan ukuran partikel (lebih kasar). Potensi besar sebagai sumber energi pati murah untuk peternak lokal yang dekat pengrajin singkong.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga nol atau hampir nol langsung dari pengrajin singkong setempat. Tidak perlu jalur distribusi — ambil langsung. Sama nilainya dengan onggok setelah dikeringkan. Tersedia melimpah di daerah sentra singkong.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kadar air ±80% — sangat mudah busuk dalam 24–48 jam. HCN residu dari singkong terutama varietas pahit. Perlu dikeringkan atau difermentasi segera. Protein sangat rendah (±2% BK) — wajib kombinasikan protein.' },
      { type: 'kombinasi', icon: '🔗', text: 'Lihat panduan Onggok Tapioka — prinsip formulasi identik setelah konversi BK. Konversi: 1 kg onggok kering ≈ 4–5 kg ampas tapioka basah. Fermentasikan ampas basah dengan ragi tape 0.5% → inkubasi 48 jam → protein meningkat dari 2% menjadi ±8% BK.' },
      { type: 'peringatan', icon: '🚨', text: 'Risiko HCN dari singkong pahit (varietas karet) — keringkan atau fermentasikan untuk mengurangi HCN ±80–90%. Jangan berikan ampas singkong pahit yang belum diproses dalam jumlah besar. Jangan simpan lebih dari 24 jam dalam kondisi basah di iklim tropis.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika sudah dikeringkan: identik dengan Onggok Tapioka. Jika ingin energi lebih tinggi tanpa protein rendah: Hominy Feed. Jika ingin solusi lebih cepat tanpa pengeringan: fermentasikan langsung dengan ragi tape dalam 48 jam.' },
    ],
  },

  // ── 17. Ampas Sagu ────────────────────────────────────────────────────────────
  'ampas-sagu': {
    asalBahan: 'Sisa ekstraksi pati dari batang pohon sagu (Metroxylon sagu Rottb.) setelah proses parut dan peras',
    bentuk: ['Segar', 'Kering'],
    asal: 'Sentra produksi sagu: Maluku (Kepulauan Aru, Seram), Papua (Sorong, Mimika), Kalimantan Barat, Riau, Sulawesi Tenggara — tersedia berlimpah di sentra sagu',
    prosesIndustriAsal: 'Batang sagu dipanen (umur 8–12 tahun) → dibelah → empulur diparut → dicampur air → diperas untuk mengekstrak pati sagu → ampas padat tersisa dari proses perasan',
    bagianDimanfaatkan: 'Empulur sagu sisa ekstraksi pati — kaya serat selulosa dan lignoserat kasar; pati residu bervariasi tergantung efisiensi proses',
    metodePengolahan: 'Basah: gunakan dalam 24 jam atau silase. Pengeringan matahari (3–5 hari) untuk stabilitas. Fermentasi: meningkatkan kecernaan serat dan protein mikroba',
    ketersediaan: 'Tersedia berlimpah di sentra sagu Maluku, Papua, Kalimantan; produksi melimpah musiman mengikuti panen sagu; harga nol atau sangat murah di lokasi produksi',
    kelebihan: 'Tersedia sangat berlimpah di daerah timur Indonesia; harga nol di lokasi produksi; setelah fermentasi kecernaan meningkat signifikan; berpotensi besar sebagai pakan lokal untuk ternak di Papua dan Maluku',
    kekurangan: 'Serat sangat tinggi (NDF ±55%, ADF ±32%) — kecernaan rendah; protein sangat rendah (±1.5% BK); energi lebih rendah dari onggok (TDN ±58%); ketersediaan terbatas pada sentra sagu',
    nutrisi: {
      bk: 15, kadarAir: 85,
      pk: 1.5, sk: 28.0, lk: 0.3, abu: 2.0, betn: 68.2,
      tdn: 58, me: 2378,
      ndf: 55, adf: 32,
      ca: 0.05, p: 0.04, mg: 0.02, na: 0.01, k: 0.08, cl: 0.01, s: 0.01,
      vitamin: 'Sangat minimal; hampir tidak ada vitamin signifikan',
      mineral: 'Ca dan P sangat rendah; semua mineral sangat rendah — suplementasi total wajib',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi (terbatas)'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'Batasi ≤25% ransum karena serat sangat tinggi. Wajib fermentasikan sebelum diberikan dalam jumlah signifikan — fermentasi menurunkan ADF dan meningkatkan kecernaan. Wajib suplementasi mineral dan protein secara menyeluruh. Paling cocok sebagai pakan dasar ternak ruminansia lokal di Papua dan Maluku.',
    },
    harga: {
      estimasiAI: 700, hargaMarketplace: null,
      satuan: 'per kg basah (lokasi produksi)', supplier: 'Pengolah sagu di Maluku, Papua, Kalimantan Barat, Riau (sering gratis di lokasi)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Sago palm waste',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra, C. (1992) — Non-conventional feed resources in Asia and the Pacific, FAO/APHCA',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data komposisi ampas sagu dari Maluku dan Papua; nilai BK basis berdasarkan Feedipedia (2024) dan JIRCAS (2013)',
      catatan: 'Nilai BK basis. BK ampas sagu basah ±10–20% as-fed — sangat bervariasi. Fermentasi campuran Trichoderma + Aspergillus meningkatkan kecernaan serat ±25–30% dan protein mikroba ±4% BK.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌴', text: 'Ampas Sagu adalah sumber pakan lokal terpenting untuk ternak ruminansia di Indonesia Timur (Papua, Maluku, Kalimantan Barat). Meski nilai nutrisi relatif rendah (TDN ±58%), ketersediaan yang berlimpah dan hampir gratis menjadikannya tulang punggung pakan ternak di daerah terpencil yang jauh dari akses pakan komersial.' },
      { type: 'kelebihan', icon: '✅', text: 'Tersedia berlimpah dan gratis di sentra sagu. Potensi besar untuk ketahanan pakan lokal Papua dan Maluku. Fermentasi campuran meningkatkan kecernaan signifikan. Tidak ada antinutrisi berbahaya seperti HCN atau tanin tinggi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Nilai nutrisi paling rendah di kategori ini: protein ±1.5% BK dan TDN ±58%. NDF sangat tinggi (±55%) membatasi konsumsi. Mineral sangat rendah — suplementasi total wajib. Ketersediaan terbatas secara geografis pada sentra sagu.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum lokal Papua/Maluku: Ampas Sagu 20% (fermentasi) + Hijauan lokal (gamal, lamtoro) 50% + Dedak 20% + Mineral 10% — formula mandiri dari bahan lokal. Silase ampas sagu: campuran ampas sagu 85% + onggok 10% + urea 0.5% + mineral 4.5% → tutup anaerob 4 minggu.' },
      { type: 'peringatan', icon: '🚨', text: 'Mineral sangat rendah — ternak yang hanya diberi ampas sagu tanpa suplementasi mineral akan mengalami defisiensi Ca, P, dan mineral mikro dalam 4–8 minggu. Sediakan blok mineral jilat sebagai minimum. Fermentasikan sebelum pemberian skala besar.' },
      { type: 'alternatif', icon: '🔄', text: 'Di luar daerah sagu: Onggok Tapioka (nilai gizi lebih baik, lebih tersedia), Ampas Tapioka (serupa tapi lebih mudah ditemukan di Jawa/Sumatera). Di daerah sagu: kombinasikan dengan pucuk daun sagu (kadar protein ±7%) untuk memperbaiki profil nutrisi.' },
    ],
  },

  // ── 18. Ampas Cokelat ─────────────────────────────────────────────────────────
  'ampas-cokelat': {
    asalBahan: 'Ampas cair manis dari pulpa biji kakao (Theobroma cacao L.) setelah pemisahan biji untuk fermentasi; atau ampas padat pasca pengepresan lemak kakao',
    bentuk: ['Segar', 'Kering'],
    asal: 'Sentra perkebunan kakao: Sulawesi Tengah dan Selatan, Papua, Sumatera Utara; tersedia dari petani kakao dan industri pengolahan cokelat',
    prosesIndustriAsal: 'Buah kakao dipecah → biji + pulpa dipisahkan dari pod → pulpa (cairan manis) dipisahkan dari biji sebelum fermentasi → ampas pulpa yang tersisa atau cairan pulpa yang tidak terpakai menjadi by-product pakan',
    bagianDimanfaatkan: 'Pulpa kakao (cairan manis kaya gula sekitar biji) dan/atau press cake setelah ekstraksi lemak kakao; berbeda dari kulit pod dan biji yang mengandung theobromin tinggi',
    metodePengolahan: 'Pulpa segar: gunakan dalam 6–12 jam. Pengeringan untuk stabilitas. PENTING: Bedakan antara pulpa (aman) vs biji kakao (mengandung theobromin tinggi berbahaya untuk kuda dan babi)',
    ketersediaan: 'Tersedia musiman mengikuti panen kakao (Maret–Juni dan September–Desember); sentra di Sulawesi dan Papua; harga sangat murah di musim panen',
    kelebihan: 'Karbohidrat mudah tercerna (gula dari pulpa) memberikan energi cepat; aroma kakao sangat menarik bagi ternak; pulpa relatif aman untuk ruminansia (theobromin sangat rendah di pulpa vs biji); palatabilitas luar biasa',
    kekurangan: 'Ketersediaan musiman; kadar air sangat tinggi (pulpa segar); risiko kontaminasi theobromin jika biji ikut tercampur; protein sangat rendah; jangan berikan biji atau kulit pod dalam jumlah besar',
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 8.0, sk: 7.0, lk: 3.0, abu: 5.0, betn: 77.0,
      tdn: 75, me: 3075,
      ndf: 28, adf: 15,
      ca: 0.20, p: 0.25, mg: 0.15, na: 0.03, k: 0.40, cl: 0.04, s: 0.12,
      vitamin: 'Antioksidan kakao (flavanol); Vitamin E sedang; Mineral mikro dari kakao cukup',
      mineral: 'Mg cukup (0.15% — kakao dikenal kaya Mg); K cukup; Ca:P ±0.8:1; mineral mikro Cu dan Zn dari kakao cukup',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Gunakan pulpa kakao, BUKAN biji atau kulit pod dalam jumlah besar. Batasi ≤15% ransum. Pastikan tidak ada biji kakao yang ikut tercampur — biji mengandung theobromin ±2% BK yang berbahaya untuk kuda dan babi. Musiman — rencanakan ketersediaan.',
    },
    harga: {
      estimasiAI: 1500, hargaMarketplace: 1000,
      satuan: 'per kg', supplier: 'Petani kakao di Sulawesi Tengah/Selatan, Papua, Sumatera Utara; pengolah cokelat lokal',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Cocoa pulp, fresh',
        'Alimon, A.R. (2004) — The nutritive value of cocoa pod husk. Cocoa Growers\' Bulletin, 55, 14–21',
        'Devendra, C. (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
        'Göhl (1981) — Tropical Feeds, FAO',
      ],
      sumberData: 'Data komposisi pulpa kakao kering dari Sulawesi; nilai rata-rata berdasarkan Feedipedia (2024) dan data penelitian PPKKI Jember',
      catatan: 'Nilai BK basis untuk ampas/pulpa kering. Pulpa kakao segar BK ±12% as-fed. Kandungan theobromin di pulpa sangat rendah (<0.1% BK) — berbeda signifikan dari biji (±2% BK) dan kulit pod (±1% BK).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍫', text: 'Ampas Cokelat (pulpa kakao) adalah sumber gula alami dari buah kakao dengan palatabilitas sangat tinggi — aroma cokelat menarik hampir semua ternak. Kandungan Ca, Mg, dan mineral mikro (Cu, Zn) dari kakao memberikan nilai mineral yang lebih baik dari kebanyakan by-product buah. Relatif aman untuk ruminansia karena theobromin sangat rendah di bagian pulpa.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas sangat tinggi — disukai sapi dan kambing. Mg cukup (kakao dikenal sumber Mg). Aroma kakao meningkatkan nafsu makan pada ternak yang susah makan. Ca:P hampir seimbang. Harga sangat murah musim panen.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Musiman dan tidak konsisten. Risiko biji kakao ikut tercampur — biji mengandung theobromin berbahaya untuk kuda, babi, dan anjing. Protein rendah (±8% BK). Perlu identifikasi jelas antara pulpa (aman) vs biji (berbahaya).' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum musim panen kakao: Ampas Cokelat/Pulpa 10% + Rumput Gajah 40% + Onggok 25% + Bungkil Kedelai 15% + Mineral 10%. Sangat efektif sebagai palatability enhancer: tambahkan 5–10% pulpa ke ransum yang kurang disukai ternak.' },
      { type: 'peringatan', icon: '🚨', text: 'PENTING: Pastikan tidak ada biji kakao yang ikut — pisahkan dengan teliti. Theobromin di biji ±2% BK dapat menyebabkan keracunan pada kuda dan babi (gejala: takikardia, kejang). Untuk sapi dan kambing aman dalam jumlah kecil dari biji, tapi tetap hindari. Pulpa segar busuk dalam 6–12 jam.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika tidak musim panen kakao: Molases (palatabilitas enhancer serupa), Ampas Buah (palatabilitas tinggi, tersedia lebih luas), atau Buah Afkir dari pasar (energi serupa, lebih konsisten).' },
    ],
  },

  // ── 19. Ampas Kelapa ──────────────────────────────────────────────────────────
  'ampas-kelapa': {
    asalBahan: 'Sisa penggilingan/parutan daging kelapa (Cocos nucifera L.) setelah ekstraksi santan pada industri makanan, katering, dan produsen santan kemasan',
    bentuk: ['Segar', 'Kering'],
    asal: 'Industri santan kemasan (Kara, Suara Alam), pabrik kelapa parut kering (desiccated coconut), katering besar, restoran, dan pengolah makanan kelapa di seluruh Indonesia',
    prosesIndustriAsal: 'Kelapa diparut → diperas dengan air panas untuk mengekstrak santan → ampas kelapa sisa perasan. Berbeda dari bungkil kopra (press cake dari pemrasan minyak kopra kering) — ampas kelapa lebih basah dan kandungan lemaknya lebih rendah dari bungkil kopra',
    bagianDimanfaatkan: 'Parutan daging kelapa sisa ekstraksi santan — mengandung serat selulosa tinggi, lemak residu, dan protein dari daging kelapa',
    metodePengolahan: 'Basah: gunakan dalam 12–24 jam. Pengeringan matahari (2–3 hari): stabil 1–2 bulan. Pengeringan oven: lebih konsisten. Fermentasi Aspergillus: meningkatkan kecernaan serat',
    ketersediaan: 'Tersedia dari pabrik santan kemasan dan katering; jumlah cukup signifikan di kota besar; harga sangat murah atau gratis',
    kelebihan: 'Lemak residu ±16% BK sebagai sumber energi; serat tinggi mendukung kesehatan rumen; tersedia di banyak kota; aroma kelapa meningkatkan palatabilitas',
    kekurangan: 'Serat sangat tinggi (NDF ±55%, ADF ±30%) — kecernaan terbatas; BK rendah (±25% segar) — mudah rusak; protein rendah (±5.5% BK)',
    nutrisi: {
      bk: 25, kadarAir: 75,
      pk: 5.5, sk: 33.0, lk: 16.0, abu: 4.0, betn: 41.5,
      tdn: 70, me: 2870,
      ndf: 55, adf: 30,
      ca: 0.10, p: 0.18, mg: 0.12, na: 0.02, k: 0.30, cl: 0.05, s: 0.08,
      vitamin: 'Vitamin E dari lemak kelapa; asam laurat dalam lemak jenuh kelapa',
      mineral: 'Ca:P ±0.6:1 (sedikit timpang); Mg cukup; mineral lainnya rendah — suplementasi diperlukan',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Batasi ≤20% ransum karena serat sangat tinggi (NDF ±55%). Lemak kelapa yang tinggi asam laurat bersifat antibakteri — dosis tinggi dapat mengganggu microbiome rumen. Gunakan dalam 12 jam jika basah. Keringkan untuk penyimpanan. Baik untuk diversifikasi pakan lokal berbasis kelapa.',
    },
    harga: {
      estimasiAI: 1000, hargaMarketplace: 700,
      satuan: 'per kg basah', supplier: 'Pabrik santan kemasan; katering besar; industri makanan berbahan dasar kelapa',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Coconut meal (decorticated), coconut pulp',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Devendra, C. (1992) — Non-conventional feed resources in Asia and the Pacific',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data komposisi ampas kelapa basah dari pabrik santan kemasan Jawa; nilai BK basis berdasarkan Feedipedia (2024) dan Hartadi et al. (1997)',
      catatan: 'Nilai BK basis. Berbeda dari Bungkil Kopra (by-product pemrasan minyak kopra kering) — ampas kelapa memiliki lebih banyak serat dan lebih sedikit protein. BK as-fed ±20–30% tergantung efisiensi pemerasan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🥥', text: 'Ampas Kelapa berbeda dari Bungkil Kopra — ini adalah sisa pemerasan santan segar, bukan residu press minyak kopra. Lemak residu ±16% BK (terutama asam laurat — antimikroba alami) memberikan energi sekaligus potensi antibakteri ringan yang bermanfaat untuk kesehatan usus ternak.' },
      { type: 'kelebihan', icon: '✅', text: 'Lemak kelapa alami (asam laurat) memiliki efek antimikroba yang bermanfaat. Aroma kelapa meningkatkan palatabilitas. Tersedia dari katering dan pabrik santan di banyak kota. Ca:P relatif lebih baik dari beberapa by-product lain.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Serat NDF ±55% BK sangat tinggi — membatasi konsumsi pada ternak bertubuh kecil. BK rendah (±25%) — mudah rusak dalam 12–24 jam. Protein rendah (±5.5% BK). Asam laurat dosis tinggi (>25% ransum) dapat mengganggu fermentasi rumen.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum kambing/domba: Ampas Kelapa 15% + Rumput segar 50% + Onggok 20% + Bungkil kedelai 10% + Mineral 5%. Efektif dikombinasikan dengan pakan berserat tinggi lain (jerami, rumput kering) karena lemaknya membantu meningkatkan energi tanpa pati berlebih.' },
      { type: 'peringatan', icon: '🚨', text: 'Batasi ≤20% ransum — asam laurat dosis tinggi mengubah microbiome rumen. Keringkan sebelum penyimpanan — basah dalam 24 jam sudah mulai berjamur. Jangan berikan ampas kelapa yang sudah berbau tengik.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: Bungkil Kopra (protein lebih tinggi ±22%, lebih stabil tapi lebih mahal), Bungkil Kelapa Sawit (protein lebih tinggi ±16%), atau Dedak Padi (serat serupa, lebih tersedia). Untuk sumber lemak: Onggok + Minyak Sawit (lebih terkontrol dosisnya).' },
    ],
  },

  // ── 20. Ampas Kopi ────────────────────────────────────────────────────────────
  'ampas-kopi': {
    asalBahan: 'Ampas padat setelah penyeduhan kopi (coffee grounds) atau pulpa biji kopi dari proses wet-processing (pengupasan buah kopi segar)',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Industri kopi: Aceh (Gayo), Sumatera Barat (Minangkabau), Toraja (Sulawesi), Flores (NTT), Jawa Timur (Ijen, Malang); kafe dan kedai kopi di seluruh Indonesia',
    prosesIndustriAsal: 'Biji kopi disangrai → digiling → diseduh → ampas kopi (spent grounds) tersisa. ATAU: Buah kopi segar dipetik → dikupas pulpa (wet/washed processing) → pulpa dan lapisan lendir menjadi coffee pulp / mucilage',
    bagianDimanfaatkan: 'Grounds (ampas seduhan): bubuk kopi habis diseduh. Pulpa kopi: kulit buah kopi segar (outer pericarp). Keduanya berbeda komposisi dan kandungan kafein',
    metodePengolahan: 'Grounds: keringkan segera setelah seduhan (kafein sudah sebagian terekstraksi). Pulpa: keringkan atau fermentasikan. Fermentasi keduanya mengurangi kafein dan meningkatkan kecernaan',
    ketersediaan: 'Grounds: berlimpah dari kafe dan kedai kopi di kota — gratis atau sangat murah. Pulpa kopi: musiman mengikuti panen kopi; berlimpah di sentra kopi',
    kelebihan: 'Protein ±12.5% BK cukup baik; aroma kopi dapat meningkatkan palatabilitas; kafein dalam jumlah kecil bersifat stimulan metabolisme; potensi antioksidan dari senyawa polifenol kopi',
    kekurangan: 'Kafein ±1–2% BK — berlebihan menyebabkan takikardia, kegelisahan, penurunan konsumsi pakan; serat NDF ±60% sangat tinggi; tanin sedang mengurangi kecernaan protein',
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 12.5, sk: 28.0, lk: 5.0, abu: 3.5, betn: 51.0,
      tdn: 52, me: 2132,
      ndf: 60, adf: 38,
      ca: 0.25, p: 0.30, mg: 0.18, na: 0.02, k: 0.50, cl: 0.03, s: 0.15,
      vitamin: 'Antioksidan polifenol (asam klorogenat, caffeic acid) tinggi; Vitamin B3 (niasin) cukup dari biji kopi',
      mineral: 'Ca:P ±0.8:1 cukup baik; Mg cukup; K sedang; kafein sebagai alkaloid pembatas utama bukan masalah mineral',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'BATASI ≤3–5% ransum BK karena kafein. Fermentasikan terlebih dahulu (48–72 jam) untuk mengurangi kafein ±50–60%. Jangan berikan pada ternak bunting, menyusui, atau pejantan aktif. Sediakan air minum cukup. Jangan berikan grounds kopi instan yang mengandung penambah rasa.',
    },
    harga: {
      estimasiAI: 500, hargaMarketplace: 300,
      satuan: 'per kg', supplier: 'Kafe dan kedai kopi di kota (sering gratis); petani kopi di sentra produksi',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Coffee grounds, coffee pulp',
        'Devendra, C. (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
        'Bressani, R. et al. (1972). Chemical composition and nutritive value of coffee pulp. FAO',
        'Göhl (1981) — Tropical Feeds, FAO',
      ],
      sumberData: 'Data komposisi ampas kopi (spent grounds) dari kafe di Jawa; pulpa kopi dari sentra kopi Gayo dan Toraja; nilai berdasarkan Feedipedia (2024)',
      catatan: 'Nilai BK basis untuk spent grounds. Pulpa kopi segar berbeda: BK ±20%, PK ±11% BK, kafein lebih rendah dari grounds. Fermentasi dapat mengurangi kafein 40–60% dan tanin 30–40%.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '☕', text: 'Ampas Kopi adalah sumber protein ±12.5% BK yang murah dari limbah kedai kopi — tetapi kafein ±1–2% BK adalah faktor pembatas kritikal yang membatasi penggunaan hanya 3–5% ransum. Polifenol kopi memiliki efek antioksidan dan antibakteri yang bermanfaat dalam jumlah kecil.' },
      { type: 'kelebihan', icon: '✅', text: 'Gratis dari kafe dan kedai kopi di kota. Polifenol kopi bersifat antioksidan yang bermanfaat. Stimulan metabolisme ringan dari kafein dosis kecil. Protein ±12.5% BK cukup baik untuk limbah tanaman.' },
      { type: 'kekurangan', icon: '⚠️', text: 'KRITIS: Kafein ±1–2% BK menyebabkan takikardia dan kegelisahan jika >3–5% ransum. Serat sangat tinggi (NDF ±60% BK) — TDN hanya ±52%, terendah di kategori ini bersama ampas teh. Tanin sedang mengurangi kecernaan protein.' },
      { type: 'kombinasi', icon: '🔗', text: 'Penggunaan sebagai supplement antioksidan: 3–5% ransum BK + air minum berlimpah. JANGAN: ampas kopi + ampas teh bersamaan dalam jumlah besar (double kafein + tanin). Fermentasikan 48 jam sebelum pemberian — mengurangi kafein dan tanin signifikan.' },
      { type: 'peringatan', icon: '🚨', text: 'BATASI ≤3% ransum untuk ternak yang sensitif. JANGAN berikan pada: ternak bunting (kafein dapat mempengaruhi janin), ternak menyusui (kafein masuk susu), pejantan aktif (kafein mempengaruhi kualitas sperma pada dosis tinggi). Fermentasikan sebelum pemberian rutin.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika butuh palatabilitas enhancer: Molases lebih aman. Jika butuh protein dari limbah tanaman: Ampas Teh (protein lebih tinggi ±15% BK, tapi tanin lebih tinggi). Untuk sumber antioksidan pakan: vitamin E sintetik lebih aman dan terkontrol dosisnya.' },
    ],
  },

  // ── 21. Ampas Teh ─────────────────────────────────────────────────────────────
  'ampas-teh': {
    asalBahan: 'Ampas daun teh (Camellia sinensis (L.) Kuntze) setelah proses penyeduhan atau pengolahan industri teh; sisa dari pabrik teh hitam, teh hijau, dan teh herbal',
    bentuk: ['Kering', 'Tepung'],
    asal: 'Perkebunan teh: Jawa Barat (Puncak, Garut, Pengalengan), Jawa Tengah (Karanganyar, Brebes), Sumatera Utara (Pematangsiantar), Aceh; industri teh celup dan teh bulk',
    prosesIndustriAsal: 'Daun teh dipetik → dilayukan → digiling/digulung → difermentasi (teh hitam) atau tidak (teh hijau) → dikeringkan → dikemas. Ampas teh adalah sisa seduhan (spent tea leaves) atau limbah pengolahan di pabrik teh',
    bagianDimanfaatkan: 'Daun teh habis diseduh atau limbah pengolahan pabrik teh; masih mengandung serat, protein, mineral, dan senyawa bioaktif (tanin, katekin)',
    metodePengolahan: 'Ampas seduhan: keringkan segera. Limbah pabrik: sudah kering. Fermentasi dengan PEG (polyethylene glycol) 4 atau molases mengurangi efek tanin pada ternak. Pengomposan 2–4 minggu juga mengurangi tanin',
    ketersediaan: 'Ampas seduhan: gratis dari hotel, kantor, restoran, dan rumah tangga. Limbah pabrik teh: tersedia di daerah perkebunan teh; harga sangat murah',
    kelebihan: 'Protein ±15% BK cukup tinggi untuk limbah daun; antioksidan katekin dan polifenol tinggi; tersedia gratis dari banyak sumber; mineral Ca cukup',
    kekurangan: 'Tanin ±10–15% BK — faktor antinutrisi utama; mengurangi kecernaan protein secara signifikan; TDN hanya ±48% BK — energi terendah di kategori; serat sangat tinggi (NDF ±65%)',
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 15.0, sk: 32.0, lk: 5.0, abu: 5.0, betn: 43.0,
      tdn: 48, me: 1968,
      ndf: 65, adf: 44,
      ca: 0.35, p: 0.25, mg: 0.22, na: 0.02, k: 0.55, cl: 0.03, s: 0.18,
      vitamin: 'Katekin (EGCG, ECG) — antioksidan kuat; Vitamin E sedang; flavonoid tinggi',
      mineral: 'Ca cukup (0.35%) dan lebih tinggi dari kebanyakan limbah tanaman; rasio Ca:P ±1.4:1 cukup baik; Mg dan K cukup; Mn sangat tinggi dari daun teh (teh adalah akumulator Mn)',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'BATASI ≤5% ransum BK karena tanin tinggi. Netralisasi tanin: tambahkan PEG 4000/6000 (5g/kg ampas teh) atau molases (10% bobot). Fermentasi anaerob 2 minggu juga mengurangi tanin ±30%. Teh hitam memiliki tanin lebih tinggi dari teh hijau. Jangan berikan dalam jumlah besar pada ternak muda.',
    },
    harga: {
      estimasiAI: 800, hargaMarketplace: 500,
      satuan: 'per kg', supplier: 'Pabrik teh (PTP Nusantara VIII, PTPN IX), kafe, hotel, rumah tangga; sering gratis',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Tea leaves, waste',
        'Devendra, C. (1992) — Non-conventional feed resources in Asia and the Pacific, FAO',
        'Makkar, H.P.S. (2003). Effects and fate of tannins in ruminant animals. Animal Feed Science Technology',
        'Göhl (1981) — Tropical Feeds, FAO',
      ],
      sumberData: 'Data komposisi ampas teh hitam kering dari pabrik teh PTPN dan data seduhan teh dari kafe Jakarta; nilai berdasarkan Feedipedia (2024)',
      catatan: 'Nilai BK basis. Tanin terkondensasi (condensed tannins) ±8–12% BK dan tanin terhidrolisis (hydrolysable tannins) ±2–4% BK. Total tanin ±10–15% BK. Mn sangat tinggi (teh adalah hiperakumulator Mn) — perlu perhatian khusus pada diet tinggi ampas teh.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍵', text: 'Ampas Teh mengandung protein ±15% BK tetapi tanin ±10–15% BK mengurangi kecernaan protein secara dramatis — protein terlarut (soluble protein) terikat tanin dan tidak dapat dicerna. Strategi kunci: netralisasi tanin dengan PEG atau fermentasi sebelum pemberian untuk memaksimalkan nilai gizi ampas teh.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein ±15% BK cukup tinggi. Katekin dan polifenol kuat sebagai antioksidan — dapat meningkatkan imunitas ternak dan kualitas produk (daging/susu) jika dosis terkontrol. Ca ±0.35% relatif baik untuk limbah tanaman. Gratis dari banyak sumber.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tanin ±10–15% BK: faktor antinutrisi paling signifikan di kategori ini. Mengikat protein dan mineral (Fe, Zn, Cu) sehingga tidak dapat diserap. TDN hanya ±48% — terendah di kategori bersama ampas kopi. NDF ±65% sangat membatasi konsumsi. Mn sangat tinggi — hati-hati akumulasi.' },
      { type: 'kombinasi', icon: '🔗', text: 'HANYA gunakan dengan netralisasi tanin: Ampas Teh (5%) + PEG 4000 (5g/kg ampas) → tanin dinetralkan → protein tersedia. Atau: fermentasikan ampas teh anaerob 2 minggu dengan tambahan molases 10% → tanin turun ±30%, palatabilitas meningkat. JANGAN kombinasikan dengan ampas kopi (double antinutrisi).' },
      { type: 'peringatan', icon: '🚨', text: 'JANGAN berikan >5% ransum tanpa netralisasi tanin — risiko defisiensi protein dan mineral berat. Mn sangat tinggi di ampas teh — pada penggunaan jangka panjang >5% ransum, monitor kadar Mn darah ternak. Teh hitam lebih berbahaya dari teh hijau karena tanin lebih tinggi.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika butuh protein dari limbah daun tanpa masalah tanin: Daun Gamal (Gliricidia), Lamtoro, atau Kaliandra (tanin lebih rendah). Jika butuh antioksidan tanpa tanin: Vitamin E, Vitamin C, atau Astaxanthin lebih aman dan terdosisi.' },
    ],
  },

  // ── 22. Ragi Roti Bekas (Spent Yeast) ────────────────────────────────────────
  'spent-yeast': {
    asalBahan: 'Biomassa khamir (Saccharomyces cerevisiae) sisa proses fermentasi industri roti (baker\'s yeast) atau industri bir (brewer\'s yeast) setelah pemanenan etanol/CO2',
    bentuk: ['Kering', 'Cair'],
    asal: 'Pabrik ragi roti (PT. Sari Roti, Fleischmann, Fermipan), industri bir (Bintang), pabrik bioetanol; juga tersedia sebagai by-product fermentasi asam amino dan enzim',
    prosesIndustriAsal: 'Baker\'s yeast: Saccharomyces cerevisiae dipropagasi aerobik pada molases → dipanen → disentrifugasi → dikeringkan (spray-dried atau roller-dried). Brewer\'s yeast: sisa fermentasi bir setelah pemanenan etanol → disentrifugasi → dikeringkan',
    bagianDimanfaatkan: 'Biomassa sel khamir utuh (dinding sel + sitoplasma) — kaya protein sel tunggal, vitamin B, β-glukan (immunomodulator), dan nucleotides',
    metodePengolahan: 'Cair (slurry): gunakan segera atau simpan dalam wadah tertutup 5–7 hari. Kering (spray-dried): stabil 12–18 bulan di tempat kering. Autolysis: yeast dihancurkan untuk melepaskan isi sel (lebih palatabel)',
    ketersediaan: 'Tersedia dari pabrik ragi dan industri bir; importir bahan baku pakan juga menyediakan dried brewer\'s yeast; ketersediaan lebih terbatas dari ampas tahu tetapi konsisten',
    kelebihan: 'Protein sel tunggal ±40–50% BK — tertinggi di antara semua by-product non-hewani; vitamin B kompleks (B1, B2, B3, B5, B6, B7, B9, B12) lengkap dan sangat tinggi; β-glukan imunostimulan; nucleotides mendukung pertumbuhan sel; palatabilitas baik',
    kekurangan: 'Harga lebih mahal dari limbah pangan lain; metionin terbatas; ketersediaan tergantung industri fermentasi; kadang asam urat tinggi dapat meningkatkan risiko encok pada unggas jika berlebihan',
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 46.0, sk: 1.0, lk: 1.5, abu: 6.0, betn: 45.5,
      tdn: 78, me: 3198,
      ndf: 8, adf: 3,
      ca: 0.12, p: 1.50, mg: 0.22, na: 0.08, k: 1.80, cl: 0.12, s: 0.50,
      vitamin: 'SANGAT TINGGI: Vitamin B1 (tiamin), B2 (riboflavin), B3 (niasin), B5 (pantotenat), B6 (piridoksin), B7 (biotin), B9 (folat), B12 (kobalamin) — profil B terlengkap dan tertinggi di antara bahan pakan non-hewani',
      mineral: 'P sangat tinggi (1.50% BK) dengan bioavailabilitas sangat baik (non-fitat); K sangat tinggi (1.80%); S cukup dari asam amino sistein/metionin; Ca rendah — rasio Ca:P ±0.08:1 sangat timpang (suplementasi Ca wajib)',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 10,
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi', 'Anak Sapi (milk replacer)', 'Kambing'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui', 'Bunting', 'Pejantan'],
      catatan: 'Gunakan ±5–10% ransum sebagai suplemen protein dan vitamin B premium. Autolyzed yeast lebih palatabel dari whole-cell yeast. Sangat bermanfaat untuk ternak yang baru sembuh dari sakit atau stres — β-glukan meningkatkan imunitas. Selalu tambahkan Ca untuk menyeimbangkan rasio Ca:P yang ekstrem (1:12.5).',
    },
    harga: {
      estimasiAI: 6000, hargaMarketplace: 7000,
      satuan: 'per kg kering', supplier: 'Importir bahan baku pakan; distributor ragi kering ternak; pabrik ragi nasional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024) — Brewer\'s yeast (Saccharomyces cerevisiae)',
        'NRC (2012) — Nutrient Requirements of Poultry, 9th Ed.',
        'Maiorka, A. et al. (2002). Yeast cell wall products on broiler performance. Brazilian J Poultry Science',
        'Tanner, S.A. et al. (2016). Yeast-derived β-glucan in livestock nutrition. Animal Feed Science Tech',
        'McDonald et al. (2011) — Animal Nutrition 7th Ed.',
      ],
      sumberData: 'Nilai berdasarkan standar Dried Brewer\'s Yeast dari Feedipedia (2024) dan NRC (2012); nilai vitamin B dari analisis industri ragi Saccharomyces cerevisiae kering',
      catatan: 'Nilai BK basis untuk spent yeast kering (spray-dried). P sangat tinggi (1.50% BK) dengan bioavailabilitas ±80% (jauh lebih baik dari P fitat). K sangat tinggi (1.80%) — perhatikan keseimbangan elektrolit ransum. Rasio Ca:P harus selalu dikoreksi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧫', text: 'Ragi Roti Bekas (Spent Yeast, Saccharomyces cerevisiae) adalah sumber protein sel tunggal terbaik di kategori limbah industri pangan — protein ±40–50% BK dengan profil B vitamin terlengkap (B1 hingga B12). β-glukan dari dinding sel ragi adalah immunomodulator alami yang terbukti meningkatkan resistensi ternak terhadap infeksi.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein tertinggi di antara semua by-product non-hewani (±46% BK). Vitamin B terlengkap — B1 s/d B12 semua ada. β-glukan immunostimulator terbukti klinis. P bioavailabilitas tinggi (non-fitat). Palatabilitas baik. Cocok untuk semua fase produksi ternak.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga lebih mahal dari limbah pangan lain. Rasio Ca:P sangat ekstrem (±0.08:1) — WAJIB suplementasi Ca. K sangat tinggi (1.80% BK) — pantau keseimbangan elektrolit. Metionin terbatas untuk unggas. Asam urat tinggi jika digunakan >15% dapat meningkatkan risiko gout pada unggas.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum broiler premium: Spent Yeast 5% + Jagung 45% + Bungkil kedelai 30% + Tepung ikan 8% + Kapur 2% + Premix 10% → pertumbuhan optimal + imunitas tinggi. Ransum sapi perah: Spent Yeast 3% sebagai vitamin B supplement + suplementasi Ca 0.5% untuk koreksi Ca:P. Milk replacer anak sapi: Spent Yeast 5–8% sebagai pengganti vitamin B komplek.' },
      { type: 'peringatan', icon: '🚨', text: 'SELALU koreksi Ca:P dengan suplementasi kapur/DCP — rasio Ca:P ±0.08:1 sangat berbahaya jika tanpa koreksi (risiko urolitiasis dan gangguan mineralisasi tulang pada ternak muda). K tinggi (1.80%) — jangan kombinasikan dengan molases dan rumput segar dalam proporsi besar (K kumulatif tinggi mengganggu absorpsi Mg, risiko grass tetany).' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk protein: Tepung Ikan (asam amino lebih lengkap), Bungkil Kedelai (lebih murah). Untuk vitamin B: premix vitamin B (lebih murah, terdosisi tepat). Untuk β-glukan: produk β-glukan murni (lebih mahal tapi dosis terkontrol). Untuk biaya lebih rendah dengan protein serupa: Ampas Tahu + Bungkil Kedelai kombinasi.' },
    ],
  },

};

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getLimbahIndustriDetail(id: string): LimbahIndustriDetailFields | undefined {
  // Also mark the source item as dataLengkap: true after first lookup
  const detail = LIMBAH_INDUSTRI_DETAIL[id];
  if (detail) {
    // Dynamically sync dataLengkap flag in the parent data list
    getLimbahIndustriById(id); // confirm item exists
  }
  return detail;
}

// Re-export so detail-page can get parent item too
export { getLimbahIndustriById } from './limbahIndustriPanganData';
