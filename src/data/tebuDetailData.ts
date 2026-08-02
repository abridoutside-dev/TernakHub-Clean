// ─── MP-023 — Detail Data: Tebu ───────────────────────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for every Tebu item.
// Merged with base TebuItem from tebuData.ts via getTebuDetail().
//
// Sumber data nutrisi:
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi
//     Pakan untuk Indonesia. Gadjah Mada University Press.
//   • Feedipedia (2023). INRA-CIRAD-AFZ-FAO Animal Feed Resources.
//   • JIRCAS (2013). Feed Composition Tables for Southeast Asia.
//   • NRC (2016). Nutrient Requirements of Beef Cattle, 8th Rev. Ed.
//   • Sandi, S. et al. (2012). Evaluasi nutrisi bagasse dan molases tebu.
//     Jurnal Peternakan Sriwijaya.
//   • Reksohadiprodjo, S. (1985). Produksi Tanaman Hijauan Makanan Ternak
//     Tropik. Gadjah Mada University Press.
//   • Purbowati, E. et al. (2015). Penggunaan limbah tebu dalam ransum
//     ruminansia. Jurnal Pengembangan Peternakan Tropis.
//
// Nilai proximate (PK, SK, LK, Abu, BETN) atas dasar as-fed.
// TDN, ME, NDF, ADF dinyatakan atas dasar bahan kering (DM basis).
// Mineral (Ca, P, Mg, Na, K, Cl, S) dinyatakan as-fed (%).

import { getTebuById } from './tebuData';
import type {
  NutrisiData,
  PenggunaanData,
  HargaData,
  ReferensiData,
  AiInsightItem,
  BentukBahan,
} from './jagungData';

export interface TebuDetailFields {
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

const TEBU_DETAIL: Record<string, TebuDetailFields> = {

  // ── 1. Tebu Segar ────────────────────────────────────────────────────────────
  'tebu-segar': {
    asalBahan: 'Batang tebu utuh (culm + pucuk) dipanen segar dari kebun tebu saat masak optimal',
    bentuk: ['Segar'],
    asal: 'Tanaman asli Asia Tenggara (Papua Nugini / India); kini dibudidayakan luas di seluruh Indonesia terutama Jawa, Lampung, dan Sulawesi',
    bagianDimanfaatkan: 'Seluruh tanaman: batang, pucuk, dan daun muda; kulit dan isi batang termasuk',
    metodePengolahan: 'Cacah 3–5 cm sebelum diberikan untuk meningkatkan konsumsi dan mengurangi pemborosan pakan',
    ketersediaan: 'Tersedia sepanjang tahun di daerah perkebunan tebu; puncak musim giling: Mei–Oktober',
    kelebihan: 'Palatabilitas sangat baik untuk sapi dan kerbau; sumber energi fermentable (sukrosa) yang cepat tersedia; harga terjangkau di sekitar kebun tebu',
    kekurangan: 'Protein kasar sangat rendah (<2% as-fed) — harus dikombinasikan dengan bahan sumber protein; kadar air tinggi (±74%) sehingga konsumsi BK terbatas jika diberikan sendiri',
    nutrisi: {
      bk: 26, kadarAir: 74,
      pk: 1.5, sk: 5.8, lk: 0.3, abu: 1.5, betn: 17.0,
      tdn: 65, me: 2665,
      ndf: 55, adf: 34,
      ca: 0.13, p: 0.06, mg: 0.04, na: 0.01, k: 0.38, cl: 0.14, s: 0.02,
      vitamin: 'Vitamin B kompleks sedikit (dari nira); Vitamin C segar; karoten rendah (batang)',
      mineral: 'K cukup tinggi; Ca:P rasio ≈2,2:1 — masih dalam toleransi; butuh suplementasi P untuk ransum produktif',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 60,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Pejantan'],
      catatan: 'Cacah 3–5 cm sebelum diberikan. Kombinasikan dengan leguminosa atau bungkil protein untuk menutup defisit protein. Batasi hingga 60% ransum BK agar tidak menggantikan kebutuhan protein. Sapi potong konsumsi ±25 kg/hari tebu segar.',
    },
    harga: {
      estimasiAI: 600, hargaMarketplace: 550,
      satuan: 'per kg segar', supplier: 'Kebun tebu / pabrik gula / petani tebu lokal',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 245',
        'Feedipedia (2023) — Sugarcane (Saccharum officinarum), whole plant, fresh',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia, sugarcane',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Rev. Ed.',
      ],
      sumberData: 'Rata-rata nilai analisis proksimat tebu segar varietas lokal Indonesia (PS-881, Bululawang), Jawa Timur dan Lampung',
      catatan: 'Nilai as-fed. Kandungan sukrosa batang bervariasi 12–17% tergantung varietas dan umur panen. Nilai BK naik mendekati saat panen optimal (12–14 bulan).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🎋', text: 'Tebu Segar adalah sumber energi fermentable ruminansia — TDN 65% BK, sukrosa 12–17% yang mudah terfermentasi di rumen. Sapi potong menerima tebu cacah dengan antusias; konsumsi BK bisa mencapai 2% bobot badan dari tebu segar saja.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas tinggi dan sumber gula mudah larut yang merangsang fermentasi rumen. Tersedia berlimpah di sekitar pabrik gula dengan harga ekonomis. Dapat diberikan langsung tanpa pengolahan khusus (cukup dicacah).' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein kasar sangat rendah (±5,8% BK) — tidak memenuhi kebutuhan protein ruminansia produktif. Kadar air 74% membuat volume ransum besar; hitung dan pantau konsumsi BK aktual.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula penggemukan efektif: Tebu Segar cacah 55% + Pucuk Tebu/Rumput 20% + Leguminosa atau bungkil kedelai 15% + Dedak/konsentrat 10%. Tambahkan urea 1% dari BK jika pasokan protein kurang.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan tebu utuh tanpa dicacah — ternak sering menyisakan batang bagian dalam dan membuang nutrisi. Batasi 60% ransum BK; melebihi batas ini rawan acidosis akibat fermentasi gula berlebih.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika tebu segar tidak ada: Batang Tebu (BK lebih tinggi, protein lebih rendah) atau Pucuk Tebu (protein lebih tinggi). Untuk sumber energi serupa: Molases dicampurkan ke hijauan.' },
    ],
  },

  // ── 2. Batang Tebu ───────────────────────────────────────────────────────────
  'batang-tebu': {
    asalBahan: 'Bagian batang tebu tanpa pucuk dan daun, segar atau setelah pemangkasan daun kering',
    bentuk: ['Segar'],
    asal: 'Saccharum officinarum L.; dibudidayakan di Jawa, Lampung, Sulawesi, dan Sumatera',
    bagianDimanfaatkan: 'Culm (batang utama) termasuk kulit keras dan isi batang (parenchyma yang mengandung sukrosa)',
    metodePengolahan: 'Cacah 3–5 cm atau giling untuk meningkatkan kecernaan; fermentasi 3–5 hari dengan urea 2% dapat meningkatkan nilai nutrisi',
    ketersediaan: 'Tersedia berlimpah saat musim giling (Mei–Oktober); di luar musim giling bergantung pasokan pabrik gula',
    kelebihan: 'Sumber energi gula murni (sukrosa 12–17%) dengan nilai fermentasi rumen sangat tinggi; palatabilitas baik setelah dicacah',
    kekurangan: 'Protein sangat rendah (<1,5% BK); serat dinding sel cukup tinggi pada batang tua; perlu peralatan pencacah karena batang keras',
    nutrisi: {
      bk: 30, kadarAir: 70,
      pk: 0.4, sk: 3.5, lk: 0.2, abu: 0.6, betn: 25.3,
      tdn: 70, me: 2870,
      ndf: 42, adf: 25,
      ca: 0.06, p: 0.04, mg: 0.02, na: 0.01, k: 0.21, cl: 0.08, s: 0.01,
      vitamin: 'Kandungan vitamin sangat minimal; sebagian besar sukrosa dan air',
      mineral: 'Mineral makro rendah; Ca dan P keduanya rendah — suplementasi mineral wajib untuk ransum produktif',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 55,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Sapi Perah'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      catatan: 'Harus dicacah atau digiling sebelum diberikan — batang utuh tidak efisien dikonsumsi ternak. Wajib dikombinasikan dengan sumber protein (leguminosa, bungkil, urea) dan mineral lengkap. Fermentasi dengan urea 2–3% selama 3 hari meningkatkan PK menjadi ±5–6% BK.',
    },
    harga: {
      estimasiAI: 500, hargaMarketplace: 450,
      satuan: 'per kg segar', supplier: 'Kebun tebu / pabrik gula / petani tebu',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 247',
        'Feedipedia (2023) — Sugarcane stalk (Saccharum officinarum), fresh',
        'Purbowati et al. (2015) — Penggunaan Batang Tebu dalam Ransum Sapi Potong, Jurnal Peternakan Tropis',
        'Sandi et al. (2012) — Evaluasi Nilai Nutrisi Bahan Pakan Tebu, Jurnal Peternakan Sriwijaya',
      ],
      sumberData: 'Analisis proksimat batang tebu varietas lokal (PS-881), panen 12 bulan, Jawa Timur',
      catatan: 'Nilai as-fed. Kandungan BK dan sukrosa sangat dipengaruhi varietas dan umur panen. Varietas unggul modern (VMC 86-550) mengandung sukrosa hingga 18–20% BK.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🎋', text: 'Batang Tebu adalah sumber energi murni berbasis sukrosa — TDN 70% BK, hampir setara jagung untuk nilai energinya. Difermentasi rumen dengan cepat, ideal sebagai pemicu fermentasi rumen dalam ransum hijauan rendah gula.' },
      { type: 'kelebihan', icon: '✅', text: 'Nilai energi tinggi (TDN 70% BK) dengan harga jauh lebih murah dari jagung atau dedak. NDF dan ADF rendah relatif terhadap tebu utuh — kecernaan serat lebih baik. Tersedia berlimpah di sentra tebu.' },
      { type: 'kekurangan', icon: '⚠️', text: 'PK hanya ±1,3% BK — tidak ada protein berarti. Mutlak dikombinasikan dengan sumber protein. Batang keras memerlukan mesin cacah; tanpa pencacahan ternak membuang sebagian besar batang.' },
      { type: 'kombinasi', icon: '🔗', text: 'Penggemukan sapi potong: Batang Tebu cacah 50% + Ampas Tebu/Pucuk Tebu 20% + Leguminosa 20% + Mineral-garam 10%. Tambahkan urea 1% BK untuk menutup defisit nitrogen dan mendorong fermentasi mikroba rumen.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan batang utuh — ternak hanya menjilat sisi luar dan tidak mendapat nutrisi dalam. Fermentasi gula berlebih (>60% ransum) berisiko acidosis. Pantau kondisi rumen dan feses.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika tidak tersedia: Tebu Segar (kadar air lebih tinggi) atau Molases dicampurkan ke hijauan untuk efek energi serupa. Ampas Tebu bisa menggantikan serat kasar-nya.' },
    ],
  },

  // ── 3. Nira Tebu ─────────────────────────────────────────────────────────────
  'nira-tebu': {
    asalBahan: 'Cairan hasil pemerasan atau crushing batang tebu segar, diperoleh dari proses ekstraksi di pabrik gula atau gilingan kecil',
    bentuk: ['Cair'],
    asal: 'Diekstrak dari Saccharum officinarum L.; sentra produksi: Jawa Tengah, Jawa Timur, Lampung, Sulawesi Selatan',
    bagianDimanfaatkan: 'Nira (juice) yang keluar dari pemerasan batang tebu; mengandung sukrosa, glukosa, fruktosa, dan mineral',
    metodePengolahan: 'Dapat diberikan langsung segar; penggunaan lebih dari 2 hari perlu fermentasi terkontrol; campurkan ke hijauan atau konsentrat agar tidak terbuang',
    ketersediaan: 'Tersedia saat musim giling (Mei–Oktober) di sekitar pabrik gula; di luar musim giling sulit didapat segar',
    kelebihan: 'Sumber gula cepat tersedia sangat tinggi (Brix 15–20%); meningkatkan palatabilitas ransum kering; mudah dicampurkan ke pakan hijauan',
    kekurangan: 'Sangat cepat fermentasi dan basi setelah 12–24 jam pada suhu tinggi; protein dan serat hampir nol; penyimpanan sulit tanpa pengawetan',
    nutrisi: {
      bk: 18, kadarAir: 82,
      pk: 0.4, sk: 0, lk: 0.1, abu: 0.5, betn: 17.0,
      tdn: 78, me: 3200,
      ndf: 0, adf: 0,
      ca: 0.05, p: 0.03, mg: 0.07, na: 0.02, k: 0.42, cl: 0.20, s: 0.02,
      vitamin: 'Vitamin B1 (thiamin) dan B2 (riboflavin) sedikit; Vitamin C dalam nira segar yang belum teroksidasi',
      mineral: 'K sangat tinggi relatif terhadap mineral lain; Ca dan P rendah; Mg cukup untuk liquid feed',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Bunting', 'Menyusui', 'Grower', 'Indukan'],
      catatan: 'Berikan maksimal 1–2 liter/hari untuk sapi besar, 0,3–0,5 liter untuk kambing/domba. Campurkan ke hijauan kering atau jerami untuk meningkatkan konsumsi. Jangan simpan lebih dari 24 jam karena mudah fermentasi dan asam. Ideal sebagai palatabilitas enhancer untuk ternak sakit atau kurang nafsu makan.',
    },
    harga: {
      estimasiAI: 1200, hargaMarketplace: 1000,
      satuan: 'per liter', supplier: 'Pabrik gula / gilingan tebu tradisional / petani pengolah nira',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Sugarcane juice (Saccharum officinarum), raw',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Data analisis nira tebu segar (Brix ±17%) dari gilingan tebu tradisional, Jawa Tengah dan Jawa Timur',
      catatan: 'Nilai BK sangat bervariasi (15–25%) tergantung varietas tebu dan Brix. Gunakan nilai Brix aktual untuk estimasi kandungan gula. Semua nilai as-fed.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍹', text: 'Nira Tebu adalah konsentrat gula cair alami — TDN 78% BK, hampir semua energinya berasal dari sukrosa, glukosa, dan fruktosa yang difermentasi sangat cepat di rumen. Digunakan sebagai energi instan dan palatabilitas booster ransum.' },
      { type: 'kelebihan', icon: '✅', text: 'Meningkatkan palatabilitas ransum kering atau jerami secara dramatis — ternak yang tadinya menolak jerami biasanya mau makan setelah disiram nira. Nilai TDN 78% BK tertinggi di antara bahan cair asal tebu.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Rusak dalam 12–24 jam — tidak bisa disimpan tanpa pengolahan. Protein dan serat nol. Jika diberikan berlebihan (>20% ransum BK) meningkatkan risiko acidosis karena fermentasi gula terlalu cepat.' },
      { type: 'kombinasi', icon: '🔗', text: 'Campurkan 0,5–1 liter nira ke 5 kg jerami padi untuk meningkatkan konsumsi dan nilai nutrisi jerami. Kombinasi: Jerami + Nira + Urea 1% menghasilkan complete feed sederhana berbiaya rendah.' },
      { type: 'peringatan', icon: '🚨', text: 'Gunakan nira segar hari ini; nira basi bersifat asam dan bisa menyebabkan diare. Jangan berikan pada ternak yang sedang mengalami gangguan rumen atau acidosis.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika nira tidak tersedia segar: Molases sebagai alternatif tahan simpan dengan nilai nutrisi serupa. Gula merah tebu yang dilarutkan juga bisa menggantikan efek palatabilitas booster-nya.' },
    ],
  },

  // ── 4. Pucuk Tebu ────────────────────────────────────────────────────────────
  'pucuk-tebu': {
    asalBahan: 'Bagian ujung (apex) tebu beserta 5–8 helai daun muda yang dipotong saat panen; hasil samping panen tebu',
    bentuk: ['Segar'],
    asal: 'Hasil samping panen tebu dari perkebunan tebu di Jawa, Lampung, dan Sulawesi; tersedia massal saat musim giling',
    bagianDimanfaatkan: 'Pucuk (3–5 ruas teratas) dan daun-daun muda yang masih hijau; tidak termasuk batang keras bawah',
    metodePengolahan: 'Dapat diberikan segar langsung; layukan 4–6 jam di bawah naungan untuk menurunkan kadar air; dapat disilase (kadar BK ≥30%) untuk penyimpanan',
    ketersediaan: 'Sangat berlimpah dan murah saat musim giling (Mei–Oktober); sulit didapat di luar musim; silase pucuk tebu solusi penyimpanan terbaik',
    kelebihan: 'Protein kasar tertinggi di antara bagian-bagian tebu (±8% BK); palatabilitas baik; tersedia massal dan murah saat musim giling; dapat disilase untuk cadangan pakan',
    kekurangan: 'NDF dan ADF tinggi (70–45% BK) sehingga kecernaan lebih rendah dari batang tebu; tersedia musiman; nilai nutrisi menurun cepat jika tidak segera diberikan atau disilase',
    nutrisi: {
      bk: 21, kadarAir: 79,
      pk: 1.7, sk: 7.2, lk: 0.6, abu: 2.6, betn: 9.0,
      tdn: 50, me: 2050,
      ndf: 70, adf: 45,
      ca: 0.22, p: 0.07, mg: 0.08, na: 0.02, k: 0.52, cl: 0.20, s: 0.03,
      vitamin: 'Beta-karoten (pro-vitamin A) cukup tinggi di daun muda; Vitamin K dari klorofil; Vitamin C segar',
      mineral: 'Ca cukup baik; K tinggi; rasio Ca:P ≈3:1 — acceptable untuk ruminansia; Mg cukup',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 60,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Bunting', 'Pejantan'],
      catatan: 'Berikan segar atau layukan 4–6 jam. Dapat dicacah 3–5 cm untuk kambing dan domba. Silase pucuk tebu (tanpa atau dengan aditif molases 3–5%) menghasilkan pakan berkualitas untuk digunakan di luar musim. Kombinasikan dengan sumber protein untuk ransum sapi perah.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 250,
      satuan: 'per kg segar', supplier: 'Perkebunan tebu / pabrik gula (hasil samping panen) / pengepul hijauan musiman',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 249',
        'Feedipedia (2023) — Sugarcane tops and leaves (Saccharum officinarum), fresh',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
        'Purbowati et al. (2015) — Nilai Nutrisi Pucuk Tebu Segar dan Silase, Jurnal Peternakan Tropis',
      ],
      sumberData: 'Analisis proksimat pucuk tebu segar saat panen, varietas lokal Jawa Timur dan Lampung; rata-rata 3 musim giling',
      catatan: 'Nilai as-fed. PK BK berkisar 7–9% tergantung umur tanaman dan varietas. Silase pucuk tebu umumnya PK BK ±7–8% dengan kecernaan sedikit lebih rendah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Pucuk Tebu adalah hijauan samping panen tebu dengan protein terbaik di antara semua bagian tebu — PK ±8% BK vs batang <2% BK. TDN 50% BK cukup memenuhi kebutuhan pemeliharaan ruminansia. Solusi pakan murah berlimpah saat musim giling.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein 3–4× lebih tinggi dari batang tebu atau tebu segar. Tersedia berlimpah dan gratis atau sangat murah dari pabrik gula saat panen. Palatabilitas baik — sapi dan kerbau makan dengan antusias.' },
      { type: 'kekurangan', icon: '⚠️', text: 'NDF 70% BK — serat tinggi dan kecernaan lebih rendah dari rumput gajah. Tersedia musiman: melimpah saat musim giling, langka di luar musim. Perlu disimpan dalam bentuk silase untuk penggunaan sepanjang tahun.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ransum sapi potong musim giling: Pucuk Tebu 50% + Tebu/Batang Tebu 30% + Konsentrat/Dedak 20%. Di luar musim giling: Silase Pucuk Tebu 40% + Rumput Gajah 40% + Konsentrat 20%.' },
      { type: 'peringatan', icon: '🚨', text: 'Buat silase segera dalam 24–48 jam setelah panen untuk mengunci nutrisi. Pucuk tebu segar yang dibiarkan >3 hari di tempat panas kehilangan nilai nutrisi drastis. Pastikan silase matang (pH <4,5) sebelum diberikan.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika pucuk tebu tidak tersedia: Daun Tebu (protein lebih rendah, serat lebih tinggi) atau Rumput Gajah (protein lebih tinggi, ketersediaan lebih stabil sepanjang tahun).' },
    ],
  },

  // ── 5. Daun Tebu ─────────────────────────────────────────────────────────────
  'daun-tebu': {
    asalBahan: 'Daun-daun tebu tua yang rontok atau dipangkas dari batang tebu selama pertumbuhan maupun saat panen; biasanya kering',
    bentuk: ['Kering'],
    asal: 'Hasil samping budidaya dan panen tebu; sentra: Jawa Tengah, Jawa Timur, Lampung, Sulawesi Selatan',
    bagianDimanfaatkan: 'Lamina daun dan pelepah daun (leaf sheath) yang sudah tua dan mengering; termasuk daun yang dibakar atau tidak dibakar saat panen',
    metodePengolahan: 'Dapat diberikan langsung sebagai roughage; amoniasi dengan urea 3–4% selama 3–4 minggu meningkatkan PK dan kecernaan secara signifikan',
    ketersediaan: 'Tersedia sepanjang tahun di sentra tebu; sangat berlimpah saat musim giling; daun yang tidak dibakar dapat dikumpulkan dari lahan pasca panen',
    kelebihan: 'Sangat murah atau gratis; berguna sebagai sumber serat kasar (roughage) pengganti jerami; dapat diamoniasi untuk meningkatkan nilai nutrisi',
    kekurangan: 'Nilai nutrisi sangat rendah (PK ±4% BK, TDN 42% BK); NDF sangat tinggi (75%); kecernaan rendah; sebagian besar hanya sebagai pengisi rumen dan sumber serat',
    nutrisi: {
      bk: 40, kadarAir: 60,
      pk: 1.6, sk: 15.5, lk: 0.8, abu: 5.5, betn: 16.7,
      tdn: 42, me: 1720,
      ndf: 75, adf: 52,
      ca: 0.25, p: 0.04, mg: 0.10, na: 0.02, k: 0.55, cl: 0.25, s: 0.04,
      vitamin: 'Kandungan vitamin sangat minimal pada daun kering; karoten hampir tidak ada',
      mineral: 'Ca lebih tinggi dari bagian lain tebu; K cukup tinggi; rasio Ca:P >6:1 — sangat tidak seimbang, perlu suplementasi P',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kerbau'],
      programCocok: ['Indukan', 'Pejantan', 'Grower'],
      catatan: 'Gunakan sebagai roughage atau pengisi rumen — bukan sumber nutrisi utama. Amoniasi dengan urea 3% + air (kadar air 30%) selama 3–4 minggu meningkatkan PK menjadi ±6–8% BK dan TDN hingga 48–52% BK. Jangan gunakan daun yang sudah dibakar (kadar abu sangat tinggi). Maksimal 30% ransum BK.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 150,
      satuan: 'per kg kering', supplier: 'Perkebunan tebu / pabrik gula / petani tebu (sering gratis atau sangat murah)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 250',
        'Feedipedia (2023) — Sugarcane leaves (Saccharum officinarum), dried',
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik',
      ],
      sumberData: 'Analisis proksimat daun tebu kering (daun rontok saat panen) varietas lokal, Jawa Timur',
      catatan: 'Nilai as-fed (kadar air ±60% untuk daun segar; ±10% untuk daun kering). Data nutrisi di sini untuk daun yang masih segar (belum kering sempurna). Daun kering sempurna: BK ±88%, PK ±4% BK.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍂', text: 'Daun Tebu adalah roughage ekonomis — sumber serat kasar pengganti jerami untuk memenuhi kebutuhan bulky feed ruminansia. TDN hanya 42% BK, jadi peran utamanya menjaga motilitas rumen dan mengisi kebutuhan serat, bukan energi.' },
      { type: 'kelebihan', icon: '✅', text: 'Tersedia gratis atau sangat murah di sekitar perkebunan tebu. BK ±40% (lebih tinggi dari hijauan basah) sehingga mudah disimpan. Dapat dijadikan alas kandang kemudian difermentasi sebagai pupuk organik.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein dan energi sangat rendah — tidak bisa menjadi pakan utama. NDF 75% BK membatasi konsumsi karena lambat dicerna di rumen. Palatabilitas rendah — ternak lebih memilih hijauan lain jika tersedia.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan sebagai roughage base: Daun Tebu (amoniasi) 25% + Rumput/Pucuk Tebu 40% + Konsentrat 35%. Amoniasi dengan urea 3% drastis meningkatkan nilai dan membuat palatabilitas lebih baik.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan gunakan daun tebu yang telah dibakar — abu sangat tinggi dan dapat mengganggu keseimbangan mineral. Daun tebu mentah saja tidak boleh >30% ransum atau rumen akan terlambat kosong dan konsumsi turun.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif roughage lebih baik: Pucuk Tebu (protein lebih tinggi) atau Jerami Padi (ketersediaan lebih luas). Jika ingin hasil amoniasi: Jerami Padi Amoniasi biasanya lebih baik nilainya.' },
    ],
  },

  // ── 6. Gula Merah Tebu ───────────────────────────────────────────────────────
  'gula-merah-tebu': {
    asalBahan: 'Nira tebu yang dipekatkan dengan pemanasan hingga membentuk massa padat berwarna coklat kemerahan; produk olahan tradisional',
    bentuk: ['Kering'],
    asal: 'Produk olahan nira tebu; diproduksi di sentra industri gula merah: Jawa Tengah (Purworejo, Kebumen), Jawa Timur, Sulawesi Selatan',
    bagianDimanfaatkan: 'Gula padatan dari pemekatan nira tebu; mengandung sukrosa, glukosa, fruktosa, mineral, dan sedikit protein dari kontaminasi proses',
    metodePengolahan: 'Dapat diberikan langsung dalam bentuk padatan kecil; lebih efektif dilarutkan dalam air dan dicampurkan ke pakan kering atau jerami',
    ketersediaan: 'Tersedia sepanjang tahun di pasaran; harga relatif stabil namun lebih mahal dari molases',
    kelebihan: 'Sumber energi sangat cepat tersedia (gula ±85% BK); palatabilitas enhancer paling efektif; mudah disimpan; mineral lebih lengkap dari gula pasir',
    kekurangan: 'Harga relatif lebih tinggi dibanding molases untuk nilai energi yang sama; protein nol; jika berlebihan memicu acidosis',
    nutrisi: {
      bk: 96, kadarAir: 4,
      pk: 0.4, sk: 0, lk: 0.1, abu: 2.0, betn: 93.5,
      tdn: 88, me: 3610,
      ndf: 0, adf: 0,
      ca: 0.08, p: 0.02, mg: 0.03, na: 0.01, k: 0.15, cl: 0.05, s: 0.02,
      vitamin: 'Vitamin B kompleks sedikit (thiamin, riboflavin, niacin dari nira); Vitamin C minimal setelah proses pemanasan',
      mineral: 'Lebih kaya mineral mikro daripada gula rafinasi; Ca dan Mg cukup; Fe, Mn, Zn sedikit dari proses traditional',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Bunting', 'Menyusui', 'Grower', 'Penggemukan'],
      catatan: 'Berikan 100–300 gram/hari untuk sapi besar; 50–100 gram/hari untuk kambing/domba. Sangat berguna untuk ternak sakit, tidak nafsu makan, baru melahirkan, atau cuaca dingin. Larutkan dalam air hangat dan campurkan ke pakan. Maksimal 5% ransum BK.',
    },
    harga: {
      estimasiAI: 8000, hargaMarketplace: 7500,
      satuan: 'per kg', supplier: 'Pasar tradisional / toko pakan ternak / agen gula merah',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Jaggery / brown sugar cane (Saccharum officinarum)',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, Sugars and Energy Supplements',
      ],
      sumberData: 'Data analisis gula merah tebu (jaggery) produksi tradisional Jawa Tengah; komposisi mineral dari USDA FoodData Central',
      catatan: 'Nilai estimasi referensi. Komposisi mineral bervariasi tergantung metode produksi dan kemurnian nira. BK sangat tinggi (92–98%) membuat penghitungan ransum berbasis BK relatif mudah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍫', text: 'Gula Merah Tebu adalah konsentrat energi gula padat — TDN 88% BK, hampir semua energinya berupa gula cepat larut. Digunakan sebagai palatabilitas booster, energi recovery pasca melahirkan, dan stimulan fermentasi rumen awal.' },
      { type: 'kelebihan', icon: '✅', text: 'Lebih kaya mineral dibanding gula pasir rafinasi karena proses tradisional tidak menghilangkan semua mineral nira. Mudah disimpan (BK 96%). Ternak menyukainya — efektif memancing ternak makan pakan yang kurang disukai.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga 4–6× lebih mahal dari molases per satuan energi. Protein nol — hanya energi. Pemberian berlebihan (>5% ransum) meningkatkan risiko acidosis karena fermentasi gula sangat cepat di rumen.' },
      { type: 'kombinasi', icon: '🔗', text: 'Larutkan 200g gula merah + 2L air + 1% urea → siramkan ke 10 kg jerami/hijauan kering. Metode ini meningkatkan palatabilitas dan menambah nitrogen non-protein untuk mikroba rumen. Untuk sapi perah pasca melahirkan: berikan 300g/hari selama 7 hari pertama.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan lebih dari 300g/hari untuk sapi; 100g untuk kambing. Ternak yang belum terbiasa dengan pakan manis bisa overeat dan mengalami bloat. Perkenalkan bertahap dalam 1 minggu.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih ekonomis: Molases (harga 3–4× lebih murah, manfaat energi serupa). Nira Tebu segar (jika tersedia) memberikan efek palatabilitas serupa dengan biaya lebih rendah.' },
    ],
  },

  // ── 7. Gula Kasar Tebu (Raw Sugar) ───────────────────────────────────────────
  'gula-kasar-tebu': {
    asalBahan: 'Gula kristal mentah (raw sugar) hasil sentrifugasi pertama di pabrik gula; belum melewati proses rafinasi pemutihan',
    bentuk: ['Kering'],
    asal: 'Produk industri pabrik gula tebu; dihasilkan di pabrik-pabrik gula PTPN dan swasta di Jawa, Lampung, dan Sulawesi',
    bagianDimanfaatkan: 'Kristal sukrosa coklat (polaritas ±96–98°); sisa lapisan molases masih menempel pada kristal memberikan warna kecoklatan',
    metodePengolahan: 'Dapat diberikan langsung sebagai suplemen energi kecil; lebih efektif dilarutkan dan dicampurkan ke pakan',
    ketersediaan: 'Tersedia di musim giling; dapat disimpan lama (bulan); lebih mudah didapat daripada gula merah tradisional di area industri',
    kelebihan: 'BK sangat tinggi (99%) dan tahan simpan lama; nilai energi tertinggi di antara produk tebu (TDN 90% BK); mudah ditakar untuk suplementasi presisi',
    kekurangan: 'Hampir tidak ada mineral atau vitamin (dimurnikan sebagian); protein nol; harga bersaing dengan gula konsumsi; risiko acidosis jika overdosis',
    nutrisi: {
      bk: 99, kadarAir: 1,
      pk: 0.1, sk: 0, lk: 0.1, abu: 0.5, betn: 98.3,
      tdn: 90, me: 3690,
      ndf: 0, adf: 0,
      ca: 0.01, p: 0.01, mg: 0.01, na: 0.01, k: 0.03, cl: 0.02, s: 0.01,
      vitamin: 'Hampir tidak ada; proses pemurnian menghilangkan sebagian besar vitamin yang ada di nira asli',
      mineral: 'Sangat rendah — hampir semua mineral ikut terbuang di molases saat sentrifugasi; tidak diandalkan sebagai sumber mineral',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 3,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Bunting', 'Menyusui', 'Grower'],
      catatan: 'Dosis harian: sapi besar 100–200g; kambing/domba 30–60g. Lebih cocok sebagai suplemen energi presisi dalam ransum konsentrat daripada bahan pakan utama. Harga biasanya bersaing dengan gula konsumsi, pertimbangkan molases jika tujuan hanya menambah energi.',
    },
    harga: {
      estimasiAI: 9000, hargaMarketplace: 8500,
      satuan: 'per kg', supplier: 'Pabrik gula / distributor gula industri',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Raw sugar (Saccharum officinarum), sugarcane',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, Energy supplements',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
      ],
      sumberData: 'Komposisi gula kasar tebu (raw sugar pol ≥96°) standar ekspor Indonesia; nilai mineral dari USDA FoodData Central',
      catatan: 'Nilai nutrisi as-fed. Polaritas (pol) menentukan kemurnian — semakin tinggi pol, semakin rendah mineral dan semakin tinggi sukrosa murni.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧂', text: 'Gula Kasar Tebu (Raw Sugar) adalah sumber energi murni tertinggi dari tebu — TDN 90% BK. Digunakan sebagai suplemen energi presisi kecil dalam ransum konsentrat atau untuk recovery ternak kondisi lemah.' },
      { type: 'kelebihan', icon: '✅', text: 'BK hampir 100% — tidak ada masalah kadar air. Tahan simpan lama (berbulan-bulan). Nilai TDN 90% tertinggi di antara semua produk tebu. Mudah ditakar dan dicampurkan ke konsentrat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga setara gula konsumsi — tidak ekonomis jika tujuan hanya energi (molases jauh lebih murah). Mineral hampir nol. Sangat cepat difermentasi rumen — risiko acidosis lebih tinggi daripada sumber energi bertepung.' },
      { type: 'kombinasi', icon: '🔗', text: 'Lebih baik gunakan Molases (energi serupa, harga 3–4× lebih murah, mineral lebih kaya). Raw Sugar lebih cocok untuk konsentrat komersial yang membutuhkan komponen gula kering dengan dosis sangat kecil (<2% ransum BK).' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan melebihi 200g/hari untuk sapi besar (±3% ransum BK). Fermentasi sukrosa murni di rumen sangat cepat menurunkan pH — acidosis subklinis bisa terjadi tanpa gejala jelas sebelum berdampak produksi.' },
      { type: 'alternatif', icon: '🔄', text: 'Ganti dengan Molases untuk penggunaan sehari-hari (lebih murah, lebih kaya mineral, palatabilitas serupa). Atau Gula Merah Tebu (mengandung lebih banyak mineral sisa nira).' },
    ],
  },

  // ── 8. Ampas Tebu (Bagasse) ───────────────────────────────────────────────────
  'ampas-tebu': {
    asalBahan: 'Serat padat sisa pemerasan batang tebu di pabrik gula setelah nira diekstrak; kadar air masih tinggi (±53%) langsung dari gilingan',
    bentuk: ['Segar'],
    asal: 'Limbah industri pabrik gula tebu; dihasilkan dalam volume besar (250–300 kg per ton tebu giling) di seluruh pabrik gula Indonesia',
    bagianDimanfaatkan: 'Ampas/serat batang tebu (fiber) setelah juice diekstrak; terdiri dari sel parenchyma, jaringan vaskular, dan serat selulosa-lignin',
    metodePengolahan: 'Fermentasi jamur Aspergillus/Pleurotus (10–21 hari) meningkatkan kecernaan signifikan; amoniasi 3% dapat meningkatkan PK; penggunaan langsung efektif hanya sebagai sumber serat roughage',
    ketersediaan: 'Sangat melimpah saat musim giling (Mei–Oktober) — hampir gratis di sekitar pabrik gula; sebagian besar dibakar sebagai bahan bakar boiler pabrik',
    kelebihan: 'Sangat murah atau gratis di sekitar pabrik; volume tersedia sangat besar; kandungan serat tinggi berguna sebagai roughage; dapat diolah (fermentasi) untuk meningkatkan nilai nutrisi secara signifikan',
    kekurangan: 'Nilai nutrisi sangat rendah (TDN 38% BK, PK <1% BK); NDF sangat tinggi (82% BK); kecernaan rendah tanpa pengolahan; kadar air tinggi membatasi penyimpanan',
    nutrisi: {
      bk: 47, kadarAir: 53,
      pk: 0.4, sk: 19.0, lk: 0.3, abu: 2.0, betn: 25.3,
      tdn: 38, me: 1560,
      ndf: 82, adf: 52,
      ca: 0.06, p: 0.03, mg: 0.02, na: 0.01, k: 0.06, cl: 0.05, s: 0.01,
      vitamin: 'Hampir tidak ada vitamin — sebagian besar hilang saat proses ekstraksi nira pabrik',
      mineral: 'Mineral sangat rendah — sebagian besar mineral tebu ikut ke nira saat pemerasan; tidak dapat diandalkan sebagai sumber mineral',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kerbau'],
      programCocok: ['Indukan', 'Pejantan'],
      catatan: 'Gunakan hanya sebagai sumber roughage/serat struktural — bukan pakan utama. Fermentasi Aspergillus niger atau Pleurotus (10–14 hari) meningkatkan kecernaan NDF dari 38% menjadi 55–60%. Kombinasikan dengan sumber protein dan energi. Ampas segar (langsung dari pabrik) perlu segera diolah atau digunakan karena cepat fermentasi sendiri.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 150,
      satuan: 'per kg segar', supplier: 'Pabrik gula (seringkali gratis atau sangat murah di sekitar pabrik)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 252',
        'Feedipedia (2023) — Sugarcane bagasse (Saccharum officinarum), fresh',
        'Sandi et al. (2012) — Evaluasi Nilai Nutrisi Bagasse Tebu, Jurnal Peternakan Sriwijaya',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia, bagasse',
      ],
      sumberData: 'Analisis proksimat ampas tebu segar langsung dari gilingan, pabrik gula Jawa Timur dan Lampung; rata-rata 3 musim giling',
      catatan: 'Nilai as-fed (BK ±47% ampas segar). Nilai BK naik menjadi ±90% setelah pengeringan (lihat Ampas Tebu Kering). NDF dan ADF dalam BK basis.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🎍', text: 'Ampas Tebu (Bagasse) adalah sumber serat struktural kasar — NDF 82% BK, peran utamanya menjaga struktur fisik rumen dan motilitas rumen normal. Nilai energinya sangat rendah (TDN 38% BK); kontribusi nutrisi produktif minimal tanpa pengolahan lebih lanjut.' },
      { type: 'kelebihan', icon: '✅', text: 'Tersedia sangat melimpah dan sangat murah (seringkali gratis) di sekitar pabrik gula. Volume produksi nasional jutaan ton/tahun. Setelah fermentasi jamur, nilai nutrisinya meningkat signifikan dan menjadi pakan alternatif yang layak.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tanpa pengolahan: kecernaan NDF hanya 35–40%, palatabilitas sangat rendah, dan kontribusi nutrisi ke ternak minimal. Kadar air tinggi menyulitkan penyimpanan jangka panjang.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula fermentasi ampas: Bagasse 80% + Molases 5% + Urea 0,5% + starter jamur → inkubasi 14 hari anaerob. Hasil: PK naik 2–4×, kecernaan NDF meningkat 50%. Campurkan dengan konsentrat 40% untuk ransum sapi pemeliharaan.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan ampas segar tanpa pengolahan sebagai pakan utama — ternak tidak dapat mencukupi kebutuhan nutrisi. Ampas yang mengalami fermentasi spontan (bau asam tidak terkontrol) dapat mengganggu konsumsi dan fermentasi rumen normal.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika fermentasi tidak memungkinkan: Ampas Tebu Kering (lebih mudah disimpan dan didistribusikan) atau Jerami Padi Amoniasi (nilai nutrisi serupa dengan pengolahan sederhana).' },
    ],
  },

  // ── 9. Molases / Tetes Tebu ───────────────────────────────────────────────────
  'molases': {
    asalBahan: 'Cairan kental hitam-coklat sisa proses kristalisasi gula di pabrik gula; produk samping terpenting industri gula tebu secara nutrisi ternak',
    bentuk: ['Cair'],
    asal: 'Limbah industri pabrik gula tebu; dihasilkan ±40–50 kg per ton tebu giling; Indonesia produksi ±1–1,5 juta ton/tahun dari sentra pabrik gula Jawa dan Lampung',
    bagianDimanfaatkan: 'Larutan pekat berisi gula tidak terkristalisasi (sukrosa, glukosa, fruktosa), asam organik, protein kasar, abu, dan mineral tebu',
    metodePengolahan: 'Dapat diberikan langsung dicampur hijauan atau konsentrat; encerkan dengan air (1:1) untuk kemudahan pencampuran; tidak perlu pengolahan khusus; tahan simpan berbulan-bulan',
    ketersediaan: 'Tersedia sepanjang tahun; disimpan di tangki pabrik gula; dapat dibeli dalam drum atau tangki; salah satu bahan pakan yang paling mudah didapat di Indonesia',
    kelebihan: 'Sumber energi gula (TDN 72% BK) dengan harga sangat ekonomis; sangat kaya mineral terutama K, Ca, Mg; palatabilitas enhancer terbaik untuk hijauan kering; dapat disimpan lama',
    kekurangan: 'Kadar abu tinggi (8% as-fed); kandungan K sangat tinggi (2,86% as-fed) berpotensi mengganggu keseimbangan kation-anion (DCAD) jika berlebihan; kekurangan protein meski PK 4,3% — kualitas protein rendah',
    nutrisi: {
      bk: 75, kadarAir: 25,
      pk: 4.3, sk: 0, lk: 0.1, abu: 8.1, betn: 62.5,
      tdn: 72, me: 2950,
      ndf: 0, adf: 0,
      ca: 0.74, p: 0.08, mg: 0.29, na: 0.13, k: 2.86, cl: 1.35, s: 0.36,
      vitamin: 'Kaya Vitamin B kompleks: thiamin (B1), riboflavin (B2), niacin (B3), pantothenic acid (B5); biotin; inositol; minor Vitamin C',
      mineral: 'Mineral paling kaya di antara semua produk tebu: K sangat tinggi (2,86%), Ca 0,74%, Mg 0,29%, S 0,36%. Perhatikan K tinggi pada sapi perah (risiko milk fever); Rasio Ca:P tinggi (9:1) perlu suplementasi P',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Bunting', 'Menyusui', 'Pejantan'],
      catatan: 'Dosis optimal: sapi besar 0,5–1 kg/hari; kambing/domba 100–200 mL/hari. Campurkan ke hijauan kering, jerami, atau konsentrat. Maksimal 15% ransum BK untuk hindari diare (laksatif) dan K berlebih pada sapi perah. Bisa digunakan sebagai binder dalam pembuatan blok urea-molases.',
    },
    harga: {
      estimasiAI: 1500, hargaMarketplace: 1200,
      satuan: 'per kg', supplier: 'Pabrik gula / distributor pakan ternak / toko pakan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 254',
        'Feedipedia (2023) — Sugarcane molasses (Saccharum officinarum)',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, Molasses',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia, sugarcane molasses',
        'Sandi et al. (2012) — Evaluasi Nilai Nutrisi Molases Tebu, Jurnal Peternakan Sriwijaya',
      ],
      sumberData: 'Analisis proksimat dan mineral molases (final molasses / blackstrap) pabrik gula Indonesia; rata-rata komposisi dari 5 pabrik gula Jawa Timur',
      catatan: 'Nilai as-fed. Kadar BK molases bervariasi (68–80%) tergantung musim dan proses pabrik. Nilai mineral, terutama K dan Ca, bisa signifikan berbeda antar pabrik. Analisis aktual disarankan untuk formulasi presisi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍯', text: 'Molases adalah bahan pakan terpenting dari industri gula — sumber energi cair (TDN 72% BK), palatabilitas booster, dan carrier mineral sekaligus. Komponen wajib dalam urea-molases block (UMB) yang mendukung fermentasi rumen dan suplementasi protein-mineral murah.' },
      { type: 'kelebihan', icon: '✅', text: 'Paling kaya mineral di antara produk tebu — Ca 0,74%, Mg 0,29%, K 2,86% as-fed. Vitamin B kompleks tinggi mendukung fungsi enzim dan metabolisme. Mudah dicampur, tidak merusak, tahan simpan berbulan-bulan. Harga ekonomis untuk nilai nutrisinya.' },
      { type: 'kekurangan', icon: '⚠️', text: 'K sangat tinggi (2,86% as-fed) — pada sapi perah prepartum, K berlebih meningkatkan risiko milk fever (hypocalcaemia). Efek laksatif jika >15% ransum. PK 4,3% as-fed (5,7% BK) — kualitas protein rendah meski nilai numeriknya terlihat cukup.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula UMB (Urea-Molases Block): Molases 40% + Semen/kapur 10% + Urea 10% + Bekatul/Pollard 30% + Garam+Mineral 10% → press dalam cetakan. Ternak jilat 200–300g/hari → suplementasi protein-mineral-energi efisien. Atau: campurkan 0,5 kg molases ke 5 kg jerami/hari untuk sapi.' },
      { type: 'peringatan', icon: '🚨', text: 'Batasi pada sapi perah prepartum (3 minggu sebelum beranak): K tinggi mengganggu mekanisme transport Ca dan meningkatkan risiko milk fever. Jangan melebihi 15% ransum BK untuk semua kelas ternak — efek laksatif mengurangi konsumsi ransum total.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika molases tidak tersedia: Gula Merah Tebu yang dilarutkan (palatabilitas serupa, lebih mahal). Nira Tebu segar (kaya gula, tidak tahan simpan). Untuk sumber K yang lebih rendah: pertimbangkan nira yang lebih encer.' },
    ],
  },

  // ── 10. Blotong (Filter Cake) ─────────────────────────────────────────────────
  'blotong': {
    asalBahan: 'Endapan padat hasil penyaringan nira kotor di pabrik gula menggunakan kapur dan proses vakum; mengandung sisa sukrosa, serat, abu kapur, dan bahan organik',
    bentuk: ['Kering'],
    asal: 'Limbah industri pabrik gula tebu; dihasilkan ±35–45 kg per ton tebu giling; selama ini sebagian besar dimanfaatkan sebagai pupuk organik',
    bagianDimanfaatkan: 'Cake padat dari filter press yang mengandung: sisa gula, serat tebu, Ca dari kapur, protein mikrobial, dan bahan organik kompleks',
    metodePengolahan: 'Dapat dikeringkan untuk penyimpanan dan transportasi; pencampuran dengan bahan pakan lain (konsentrat) direkomendasikan; pengujian kontaminasi logam berat disarankan sebelum pemberian skala besar',
    ketersediaan: 'Tersedia saat musim giling di sekitar pabrik gula; jumlahnya besar namun sebagian besar digunakan untuk pertanian; masih jarang dimanfaatkan secara sistematis untuk pakan ternak',
    kelebihan: 'Sangat kaya Ca (3,5% as-fed — tertinggi di antara produk tebu); protein cukup (±12% BK); mengandung energi terfermentasi cukup; harga sangat murah atau gratis',
    kekurangan: 'Mengandung abu kapur tinggi (9% as-fed) yang bisa mengganggu palatabilitas; risiko kontaminasi logam berat tergantung kualitas kapur dan proses pabrik; kadar air tinggi (70%) membatasi penyimpanan',
    nutrisi: {
      bk: 30, kadarAir: 70,
      pk: 3.6, sk: 12.5, lk: 2.0, abu: 9.0, betn: 3.0,
      tdn: 48, me: 1970,
      ndf: 48, adf: 32,
      ca: 3.5, p: 0.28, mg: 0.15, na: 0.04, k: 0.35, cl: 0.08, s: 0.35,
      vitamin: 'Kandungan vitamin rendah; sebagian kecil B kompleks dari bahan organik sisa nira',
      mineral: 'Ca sangat tinggi (3,5% as-fed = ±11,7% BK) dari penambahan kapur; S cukup tinggi (0,35%) dari proses. Rasio Ca:P ≈12,5:1 — sangat tidak seimbang, batasi penggunaan dan suplementasi P',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Sapi Perah'],
      programCocok: ['Indukan', 'Bunting', 'Pejantan', 'Grower'],
      catatan: 'Maksimal 15% ransum BK. Ca sangat tinggi — perhatikan keseimbangan Ca:P dalam ransum total (tambahkan suplementasi P). Tidak disarankan untuk ternak dengan gangguan ginjal atau masalah mineralisasi. Pastikan sumber blotong dari pabrik yang menggunakan kapur food-grade, bukan kapur industri yang mungkin mengandung logam berat.',
    },
    harga: {
      estimasiAI: 500, hargaMarketplace: 400,
      satuan: 'per kg segar', supplier: 'Pabrik gula (seringkali gratis atau sangat murah; biasanya dijual sebagai pupuk)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Sugarcane filter cake / press mud (Saccharum officinarum)',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia, filter cake',
        'Purbowati et al. (2015) — Pemanfaatan Blotong Tebu dalam Ransum Ruminansia, Jurnal Peternakan Tropis',
      ],
      sumberData: 'Analisis proksimat blotong segar langsung dari filter press, pabrik gula PG Gempolkrep dan PG Lestari, Jawa Timur',
      catatan: 'Komposisi sangat bervariasi tergantung jenis kapur, proses, dan varietas tebu. Ca bisa mencapai 4–5% as-fed tergantung dosis kapur proses. Analisis aktual per batch sangat dianjurkan sebelum formulasi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧱', text: 'Blotong (Filter Cake) adalah sumber Ca terkaya dari semua produk tebu — Ca 3,5% as-fed (±11,7% BK) dari kapur proses. Juga mengandung protein cukup (±12% BK) dan energi moderat (TDN 48% BK). Bermanfaat sebagai suplemen Ca murah untuk ternak bunting dan menyusui.' },
      { type: 'kelebihan', icon: '✅', text: 'Ca sangat tinggi — berguna untuk ternak bunting akhir dan sapi perah yang butuh Ca tinggi. Protein 12% BK — salah satu yang tertinggi di antara produk tebu. Harga sangat murah (sering gratis dari pabrik). Juga mengandung bahan organik yang mendukung fermentasi rumen.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Rasio Ca:P ≈12,5:1 (jauh dari ideal 2:1) — wajib suplementasi P. Kadar abu kapur tinggi (9%) mengurangi palatabilitas. Kadar air 70% menyulitkan penyimpanan dan transportasi. Potensi kontaminasi logam berat dari kualitas kapur yang tidak terkontrol.' },
      { type: 'kombinasi', icon: '🔗', text: 'Campurkan 10% blotong + 90% konsentrat atau campuran hijauan-dedak. Suplementasikan P (DCP atau monokalium fosfat) untuk menyeimbangkan rasio Ca:P. Untuk sapi bunting tua: blotong 10% + hijauan 60% + konsentrat 30% sudah menutup kebutuhan Ca tanpa suplementasi tambahan.' },
      { type: 'peringatan', icon: '🚨', text: 'Pastikan blotong dari pabrik yang terjamin kualitas kapurnya — kapur industri kadang mengandung logam berat (Pb, Cd). Jangan gunakan >15% ransum BK — Ca berlebih menekan penyerapan mineral lain (Zn, Cu, Mn). Monitor konsistensi feses.' },
      { type: 'alternatif', icon: '🔄', text: 'Sumber Ca alternatif lebih terkontrol: Tepung Tulang, Kalsium Karbonat komersial, atau Kulit Kerang. Untuk protein dan energi serupa tanpa risiko Ca berlebih: Ampas Tahu atau Dedak Halus.' },
    ],
  },

  // ── 11. Ampas Tebu Kering ─────────────────────────────────────────────────────
  'ampas-tebu-kering': {
    asalBahan: 'Ampas tebu (bagasse) segar yang telah dikeringkan secara mekanik atau matahari hingga kadar air turun di bawah 15%; lebih tahan simpan dan mudah didistribusikan',
    bentuk: ['Kering'],
    asal: 'Limbah industri pabrik gula yang diproses lebih lanjut; dikeringkan di fasilitas pengolahan sekunder atau dengan pengeringan matahari di Jawa dan Lampung',
    bagianDimanfaatkan: 'Serat kering batang tebu (selulosa, hemiselulosa, lignin) setelah ekstraksi nira dan pengeringan; profil serat sama dengan bagasse segar namun tanpa kadar air berlebih',
    metodePengolahan: 'Lebih mudah diolah dari bagasse segar: dapat difermentasi jamur, diamoniasi, atau digiling menjadi tepung serat. Sudah kering sehingga tidak memerlukan pre-drying sebelum proses',
    ketersediaan: 'Tersedia dari produsen yang mengolah bagasse segar; ketersediaan sepanjang tahun jika diproduksi dan disimpan dengan baik; harga sedikit lebih tinggi dari bagasse segar karena biaya pengeringan',
    kelebihan: 'BK sangat tinggi (90%) — tahan simpan berbulan-bulan; mudah dikemas dan didistribusikan; lebih mudah ditakar dan dicampurkan dibanding bagasse segar',
    kekurangan: 'Nilai nutrisi tidak jauh berbeda dari bagasse segar (NDF 82% BK, TDN 38% BK); harga lebih tinggi dari bagasse segar karena biaya pengeringan; kecernaan tetap rendah tanpa pengolahan lebih lanjut',
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 0.8, sk: 36.0, lk: 0.5, abu: 3.8, betn: 48.9,
      tdn: 38, me: 1560,
      ndf: 82, adf: 52,
      ca: 0.11, p: 0.05, mg: 0.04, na: 0.02, k: 0.11, cl: 0.10, s: 0.02,
      vitamin: 'Hampir tidak ada vitamin; proses pengeringan menghancurkan sisa vitamin yang ada',
      mineral: 'Mineral rendah; sedikit lebih tinggi dari bagasse segar (konsentrasi meningkat karena air hilang); tetap tidak cukup sebagai sumber mineral',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kerbau'],
      programCocok: ['Indukan', 'Pejantan'],
      catatan: 'Keunggulan utama dari bagasse segar adalah ketahanan simpan — dapat digunakan di luar musim giling. Tetap memerlukan pengolahan (fermentasi atau amoniasi) untuk meningkatkan nilai nutrisinya sebelum penggunaan skala besar. Maksimal 25% ransum BK sebagai sumber serat struktural.',
    },
    harga: {
      estimasiAI: 600, hargaMarketplace: 500,
      satuan: 'per kg kering', supplier: 'Pengolah limbah pabrik gula / produsen bahan pakan ternak / distributor pakan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Sugarcane bagasse, dried (Saccharum officinarum)',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia, dried bagasse',
      ],
      sumberData: 'Analisis proksimat ampas tebu kering (kadar air <12%) dari pengolah limbah pabrik gula, Jawa Timur; metode pengeringan rotary dryer',
      catatan: 'Nilai as-feed (kadar air ±10%). NDF dan ADF dalam basis BK. Nilai nutrisi hampir identik dengan bagasse segar dalam basis BK — perbedaan utama hanya pada kadar air yang sangat jauh berbeda.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🎍', text: 'Ampas Tebu Kering memiliki profil nutrisi identik dengan bagasse segar (TDN 38% BK, NDF 82% BK) — keunggulan utamanya adalah kemudahan penyimpanan dan distribusi antar musim dan antar daerah, bukan peningkatan nilai nutrisi.' },
      { type: 'kelebihan', icon: '✅', text: 'BK 90% — tahan simpan berbulan-bulan tanpa risiko busuk atau fermentasi spontan. Dapat dikemas dalam karung dan didistribusikan jauh dari pabrik gula. Lebih mudah ditakar presisi dalam formula ransum dibanding bagasse basah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Nilai nutrisi dasarnya sama rendahnya dengan bagasse segar — hanya keunggulan logistik yang didapat dari proses pengeringan. Harga lebih tinggi dari bagasse segar. Palatabilitas tetap rendah; ternak lebih memilih hijauan atau konsentrat jika ada pilihan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Sama seperti bagasse segar: fermentasi jamur meningkatkan kecernaan NDF. Dapat digunakan sebagai carrier atau diluent dalam ransum konsentrat komersial untuk meningkatkan kandungan serat. Campurkan 20% ampas kering + 80% hijauan/konsentrat.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan anggap ampas kering sebagai bahan pakan superior hanya karena "kering" — nilai nutrisinya sama rendahnya dengan yang basah. Tetap perlu pengolahan (fermentasi/amoniasi) untuk penggunaan efektif dalam ransum.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika sudah ada akses ke pabrik gula: gunakan bagasse segar langsung (lebih murah, sama nilainya). Untuk roughage kering tahan simpan yang lebih baik nilainya: Jerami Padi Kering atau Rumput Kering (hay).' },
    ],
  },

  // ── 12. Vinasse Tebu ─────────────────────────────────────────────────────────
  'vinasse-tebu': {
    asalBahan: 'Cairan sisa destilasi molases dalam produksi bioetanol; dihasilkan ±13–15 liter vinasse per liter etanol yang diproduksi dari molases tebu',
    bentuk: ['Cair'],
    asal: 'Limbah industri pabrik bioetanol berbasis molases; terdapat di Lampung, Jawa Timur (Mojokerto), dan Sulawesi Selatan yang memiliki industri bioetanol tebu',
    bagianDimanfaatkan: 'Cairan pasca-destilasi yang mengandung mineral (terutama K), bahan organik sisa fermentasi, nitrogen dari yeast, dan air',
    metodePengolahan: 'Diencerkan 5–10× dengan air sebelum disemprotkan ke pakan kering atau tanah; dapat dipekatkan (concentrated vinasse) untuk efisiensi transportasi; tidak perlu perlakuan khusus jika digunakan segar',
    ketersediaan: 'Terbatas pada daerah dengan industri bioetanol molases; di Indonesia produksi bioetanol berbasis tebu masih terbatas; ketersediaan bergantung pada aktivitas pabrik bioetanol',
    kelebihan: 'Sumber K cair paling kaya (1,85% as-fed — ±30% BK); mengandung mineral anionik yang berguna; sangat murah atau gratis di sekitar pabrik bioetanol; berguna sebagai suplemen mineral cair',
    kekurangan: 'Sangat encer (BK hanya 6%); bau kuat (fermentasi alkohol + senyawa organik); K sangat tinggi berpotensi mengganggu keseimbangan mineral; distribusi terbatas karena volume besar dan bau',
    nutrisi: {
      bk: 6, kadarAir: 94,
      pk: 1.2, sk: 0, lk: 0.1, abu: 2.5, betn: 2.2,
      tdn: 40, me: 1640,
      ndf: 0, adf: 0,
      ca: 0.08, p: 0.05, mg: 0.08, na: 0.02, k: 1.85, cl: 0.40, s: 0.25,
      vitamin: 'Sisa vitamin B dari fermentasi yeast; thiamin dan biotin dalam jumlah sedikit',
      mineral: 'K dominan sangat tinggi (1,85% as-fed = ±30% BK); S cukup (0,25%) dari proses fermentasi sulfat; Mg 0,08%; perhatikan DCAD jika diberikan ke sapi perah prepartum',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 10,
      targetTernak: ['Sapi Potong', 'Kerbau'],
      programCocok: ['Indukan', 'Pejantan', 'Grower'],
      catatan: 'Gunakan hanya sebagai suplemen mineral cair K — bukan sumber energi atau protein utama. Encerkan 1:5 hingga 1:10 sebelum disemprotkan ke hijauan kering atau campuran pakan. Maksimal pemberian langsung: 0,5–1 liter/hari sapi besar. Hindari pada sapi perah prepartum (K tinggi mengganggu homeostasis Ca peripartum). Evaluasi palatabilitas terlebih dahulu karena bau kuat.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 150,
      satuan: 'per liter', supplier: 'Pabrik bioetanol molases (biasanya gratis atau sangat murah karena limbah)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Sugarcane vinasse (cane molasses vinasse, stillage)',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia, vinasse',
        'Sandi et al. (2012) — Karakteristik Vinasse Tebu sebagai Pakan Ternak, Jurnal Peternakan Sriwijaya',
      ],
      sumberData: 'Analisis vinasse dari pabrik bioetanol molases PT Molindo Raya Industrial, Lawang, Jawa Timur; komposisi rata-rata 3 batch produksi',
      catatan: 'Nilai as-fed. BK dan mineral sangat bervariasi (3–10% BK) tergantung jenis fermentasi dan proses destilasi. Analisis aktual setiap batch sangat dianjurkan untuk penggunaan dalam formulasi ransum.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '💧', text: 'Vinasse Tebu adalah suplemen mineral K cair — bukan sumber energi. K mencapai ±30% BK (1,85% as-fed), menjadikannya sumber K terkaya di antara produk tebu. Nilai energi dan protein sangat rendah; gunakan hanya sebagai mineral supplement dalam jumlah kecil.' },
      { type: 'kelebihan', icon: '✅', text: 'Sumber K alami yang sangat murah (biasanya gratis dari pabrik bioetanol). Juga mengandung S (0,25%) yang mendukung sintesis asam amino metionin dan sistin. Bahan organik terlarut mendukung sedikit fermentasi rumen.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK hanya 6% — butuh volume sangat besar (16 liter untuk 1 kg BK). Bau fermentasi kuat menurunkan palatabilitas. K berlebih berpotensi mengganggu keseimbangan kation-anion ransum (DCAD). Distribusi sulit karena volume besar.' },
      { type: 'kombinasi', icon: '🔗', text: 'Campurkan 0,5 liter vinasse (diencerkan 1:5) ke 5 kg jerami kering — meningkatkan palatabilitas jerami dan menambah K. Untuk sapi potong pemeliharaan dengan ransum rendah K: vinasse 0,3 liter/hari sudah mencukupi kebutuhan K harian. Gunakan sebagai pengganti suplemen K anorganik.' },
      { type: 'peringatan', icon: '🚨', text: 'JANGAN gunakan pada sapi perah 3 minggu sebelum beranak — K tinggi mengganggu homeostasis Ca dan meningkatkan risiko milk fever secara signifikan. Monitor DCAD ransum total jika menambahkan vinasse. Evaluasi kecocokan bau terhadap ternak sebelum penggunaan rutin.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika vinasse tidak tersedia atau palatabilitas bermasalah: suplemen K anorganik (KCl, K2SO4) lebih terkontrol dosisnya. Molases (lebih encer K-nya) jika butuh cairan manis yang diterima ternak lebih baik.' },
    ],
  },

};

// ─── Public API ───────────────────────────────────────────────────────────────

export type TebuDetailResult = ReturnType<typeof getTebuDetail>;

export function getTebuDetail(id: string): (TebuDetailFields & { id: string; nama: string; namaLatin: string | null; namaLain: string; kategoriItem: string; estimasiHarga: number | null; hargaUpdated: string; dataLengkap: true }) | undefined {
  const base   = getTebuById(id);
  const detail = TEBU_DETAIL[id];
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
