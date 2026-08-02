// ─── MP-017 — Detail Data: Serealia Lain ─────────────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for all "Serealia
// Lain" items (cereal & pseudo-cereal grains besides Jagung, Padi, Sorgum,
// and Jewawut). Single raw-material grains only — no bungkil/tepung/
// fermented/Formula Pakan products.
//
// Convention: proximate (PK, SK, LK, Abu, BETN), TDN, ME, NDF, ADF, and minerals
// are expressed on DM (Bahan Kering) basis. bk and kadarAir are % of fresh/whole
// grain material.
//
// Primary sources:
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi
//     Pakan untuk Indonesia. Gadjah Mada University Press.
//   • NRC (2016). Nutrient Requirements of Beef Cattle, 8th Rev. Ed.
//   • Feedipedia (2023). INRA-CIRAD-AFZ-FAO Animal Feed Resources.
//   • FAO (2018). Feed Resources for Tropical Ruminants.

import { getSerealiaById, type SerealiaItem } from './serealiaData';
import type {
  NutrisiData,
  PenggunaanData,
  HargaData,
  ReferensiData,
  AiInsightItem,
  BentukBahan,
} from './jagungData';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SerealiaDetailFields {
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

export type SerealiaDetailItem = SerealiaItem & SerealiaDetailFields;

// ─── Detail Registry ──────────────────────────────────────────────────────────

const SEREALIA_DETAIL: Record<string, SerealiaDetailFields> = {

  // ── 1. Gandum ────────────────────────────────────────────────────────────
  'gandum': {
    deskripsi: 'Biji gandum utuh, serealia pangan pokok dunia yang juga dimanfaatkan sebagai bahan pakan sumber energi dan protein sedang. Di Indonesia umumnya berupa gandum feed grade impor atau gandum reject yang tidak lolos standar tepung terigu.',
    alias: 'Wheat, Feed Wheat, Wheat Grain',
    asal: 'Bulan Sabit Subur (Timur Tengah); dibudidayakan luas di daerah subtropis-sedang; Indonesia mengimpor sebagian besar kebutuhan gandum',
    habitat: 'Dataran tinggi beriklim sedang/subtropis, 1.000–2.000 mdpl bila ditanam di daerah tropis; butuh musim kering saat panen',
    umurPanenIdeal: '100–130 hari setelah tanam saat biji mengeras dan kadar air ≤14%',
    bagianDimanfaatkan: 'Biji utuh (feed grade) atau biji reject industri tepung',
    produksi: '3–6 ton biji kering/ha/musim tanam pada varietas unggul di daerah subtropis',
    kelebihan: 'Energi tinggi (TDN ±85% BK) dan protein cukup baik (11–13% BK); sangat palatable; tersedia stabil dari pasar impor',
    kekurangan: 'Bergantung penuh pada impor sehingga harga fluktuatif mengikuti pasar global; kandungan gluten tinggi berisiko lengket/menggumpal bila digiling terlalu halus dalam ransum unggas',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 12.5, sk: 3.0, lk: 2.0, abu: 2.0, betn: 80.5,
      tdn: 85, me: 3400,
      ndf: 13.0, adf: 4.0,
      ca: 0.05, p: 0.38, mg: 0.14, na: 0.02, k: 0.45, cl: 0.08, s: 0.15,
      vitamin: 'Vitamin B kompleks (thiamin, niasin) cukup tinggi; Vitamin E rendah',
      mineral: 'P organik tinggi (sebagian fitat); Ca rendah — perlu suplementasi. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Ayam Kampung', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Menyusui'],
      musimTerbaik: 'Tersedia sepanjang tahun dari pasokan impor',
      umurPanenTerbaik: 'Kadar air ≤14% untuk stabilitas penyimpanan',
      catatan: 'Giling kasar (bukan halus) untuk menghindari penggumpalan pada unggas; batasi pada ruminansia untuk mencegah asidosis rumen akibat fermentasi cepat.',
    },
    harga: {
      estimasiAI: 6500, hargaMarketplace: 7200,
      satuan: 'per kg biji feed grade', supplier: 'Importir biji-bijian / Distributor pakan nasional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Wheat grain, INRA-CIRAD-AFZ-FAO',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Ed.',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Rata-rata dari Feedipedia dan NRC untuk gandum feed grade',
      catatan: 'Nilai bervariasi menurut varietas dan negara asal impor (Australia, Kanada, AS).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Gandum feed grade adalah alternatif energi setara jagung dengan protein sedikit lebih tinggi — cocok menggantikan sebagian jagung ketika harga jagung domestik naik.' },
      { type: 'peringatan', icon: '🚨', text: 'Fermentasi pati gandum di rumen lebih cepat dari jagung — batasi maksimal 40% ransum dan giling kasar untuk mencegah asidosis pada sapi.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein 12,5% BK lebih tinggi dari jagung, mengurangi kebutuhan suplemen protein tambahan pada ransum penggemukan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan sumber serat efektif (jerami, rumput) untuk menjaga fungsi rumen normal saat menggunakan gandum sebagai sumber energi utama.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga sangat bergantung pasar impor global — pantau nilai tukar dan harga gandum internasional sebelum kontrak pembelian besar.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika harga gandum tinggi: gunakan Jagung Pipil atau Triticale sebagai substitusi energi dengan karakteristik serupa.' },
    ],
  },

  // ── 2. Jelai (Barley) ────────────────────────────────────────────────────
  'jelai-barley': {
    deskripsi: 'Biji jelai (barley) merupakan serealia serbaguna untuk pakan ternak dan industri malting. Kadar serat sedikit lebih tinggi dari gandum karena adanya sekam yang menempel, menjadikannya cocok untuk ruminansia dengan risiko asidosis lebih rendah.',
    alias: 'Barley, Jelai, Hordeum',
    asal: 'Bulan Sabit Subur; dibudidayakan luas di Eropa, Australia, Kanada; di Indonesia sepenuhnya impor',
    habitat: 'Iklim sedang/subtropis kering, toleran salinitas tanah lebih baik dibanding gandum',
    umurPanenIdeal: '90–110 hari setelah tanam saat kadar air biji ≤13%',
    bagianDimanfaatkan: 'Biji utuh berikut sekam tipis (hulled barley) atau tanpa sekam (hull-less barley)',
    produksi: '3–5 ton biji kering/ha/musim tanam',
    kelebihan: 'Serat lebih tinggi dari gandum/jagung sehingga risiko asidosis rumen lebih rendah; palatabilitas baik; cocok sebagai energi utama sapi perah',
    kekurangan: 'TDN sedikit lebih rendah dari jagung/gandum karena sekam; harga impor fluktuatif; beta-glukan tinggi dapat meningkatkan viskositas digesta pada unggas',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 11.5, sk: 5.5, lk: 2.0, abu: 2.5, betn: 78.5,
      tdn: 80, me: 3200,
      ndf: 18.0, adf: 6.0,
      ca: 0.06, p: 0.35, mg: 0.15, na: 0.02, k: 0.55, cl: 0.10, s: 0.16,
      vitamin: 'Vitamin B kompleks cukup; Vitamin E rendah',
      mineral: 'P organik sedang, Ca rendah. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 50,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Menyusui', 'Penggemukan', 'Grower'],
      musimTerbaik: 'Tersedia sepanjang tahun dari pasokan impor',
      umurPanenTerbaik: 'Kadar air ≤13% untuk stabilitas penyimpanan',
      catatan: 'Cocok sebagai basis energi ransum sapi perah karena risiko asidosis lebih rendah dari jagung/gandum; giling kasar atau flaked untuk daya cerna optimal.',
    },
    harga: {
      estimasiAI: 7000, hargaMarketplace: 7600,
      satuan: 'per kg biji feed grade', supplier: 'Importir biji-bijian / Distributor pakan nasional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Barley grain, INRA-CIRAD-AFZ-FAO',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Ed.',
      ],
      sumberData: 'Rata-rata dari Feedipedia dan NRC untuk jelai feed grade',
      catatan: 'Kadar beta-glukan bervariasi antar varietas; hull-less barley memiliki TDN lebih tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Jelai adalah sumber energi ruminansia dengan risiko asidosis lebih rendah dibanding jagung/gandum karena kandungan seratnya lebih tinggi.' },
      { type: 'kelebihan', icon: '✅', text: 'Cocok untuk sapi perah laktasi tinggi sebagai basis energi yang lebih aman bagi kesehatan rumen dibanding biji-bijian rendah serat.' },
      { type: 'peringatan', icon: '🚨', text: 'Beta-glukan tinggi dapat meningkatkan viskositas digesta pada unggas — tambahkan enzim beta-glukanase bila digunakan pada ransum ayam.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan Gandum atau Jagung untuk menyeimbangkan energi dan menurunkan biaya ransum penggemukan.' },
      { type: 'alternatif', icon: '🔄', text: 'Triticale dapat menggantikan jelai dengan profil nutrisi yang mirip bila pasokan jelai terbatas.' },
    ],
  },

  // ── 3. Oat ───────────────────────────────────────────────────────────────
  'oat': {
    deskripsi: 'Biji oat (haver) dengan sekam yang menempel erat, menghasilkan kadar serat kasar tinggi dibanding serealia lain. Umum digunakan sebagai pakan kuda dan komponen ransum ruminansia muda karena sifatnya yang lembut di pencernaan.',
    alias: 'Oats, Haver, Avena',
    asal: 'Eropa Utara/Timur Tengah; dibudidayakan luas di daerah beriklim sedang; Indonesia sepenuhnya impor',
    habitat: 'Iklim sedang lembab, toleran tanah kurang subur dibanding gandum/jelai',
    umurPanenIdeal: '90–120 hari setelah tanam saat malai menguning penuh',
    bagianDimanfaatkan: 'Biji utuh dengan sekam (whole oat) atau tanpa sekam (naked oat/oat groat)',
    produksi: '2,5–4 ton biji kering/ha/musim tanam',
    kelebihan: 'Serat kasar tinggi membuat pencernaan lebih lambat dan aman dari asidosis; sangat disukai kuda dan ternak muda; energi cukup untuk pakan pelengkap',
    kekurangan: 'TDN lebih rendah dari jagung/gandum akibat sekam tebal (30% dari bobot biji); harga relatif mahal karena niche/impor terbatas',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 11.0, sk: 11.0, lk: 4.5, abu: 3.0, betn: 70.5,
      tdn: 70, me: 2800,
      ndf: 28.0, adf: 14.0,
      ca: 0.09, p: 0.34, mg: 0.14, na: 0.03, k: 0.42, cl: 0.10, s: 0.20,
      vitamin: 'Vitamin B1 (thiamin) tinggi; Vitamin E sedang',
      mineral: 'P sedang, Ca rendah. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 40,
      targetTernak: ['Kuda', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Grower', 'Indukan', 'Menyusui'],
      musimTerbaik: 'Tersedia sepanjang tahun dari pasokan impor',
      umurPanenTerbaik: 'Kadar air ≤12% untuk stabilitas penyimpanan',
      catatan: 'Pilihan utama untuk pakan kuda dan ternak muda karena serat tinggi menurunkan risiko gangguan pencernaan; kurang ekonomis sebagai sumber energi utama ruminansia dewasa.',
    },
    harga: {
      estimasiAI: 8500, hargaMarketplace: 9200,
      satuan: 'per kg biji feed grade', supplier: 'Importir pakan kuda / Distributor pakan khusus',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Oat grain, INRA-CIRAD-AFZ-FAO',
        'NRC (2007) — Nutrient Requirements of Horses, 6th Rev. Ed.',
      ],
      sumberData: 'Rata-rata dari Feedipedia dan NRC Horses untuk oat whole grain',
      catatan: 'Naked oat (tanpa sekam) memiliki TDN dan protein lebih tinggi dibanding whole oat.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🐴', text: 'Oat adalah pilihan energi klasik untuk pakan kuda dan ternak muda karena serat tinggi memperlambat fermentasi dan menurunkan risiko kolik/asidosis.' },
      { type: 'kelebihan', icon: '✅', text: 'Sangat palatable dan lembut di pencernaan — cocok untuk pedet, anak kambing/domba, dan ternak dalam masa transisi pakan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'TDN lebih rendah dari jagung/gandum sehingga kurang efisien sebagai sumber energi utama ransum penggemukan skala besar.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan Jagung atau Gandum untuk ransum starter/grower yang membutuhkan energi lebih tinggi namun tetap aman bagi pencernaan muda.' },
      { type: 'alternatif', icon: '🔄', text: 'Jelai (Barley) dapat menjadi alternatif dengan profil serat sedang bila oat tidak tersedia atau terlalu mahal.' },
    ],
  },

  // ── 4. Rye (Gandum Hitam) ────────────────────────────────────────────────
  'rye': {
    deskripsi: 'Biji rye (gandum hitam) adalah serealia yang tahan terhadap tanah miskin dan iklim dingin ekstrem. Sebagai pakan ternak, rye digunakan dalam jumlah terbatas karena risiko kontaminasi ergot (jamur beracun) yang lebih tinggi dibanding serealia lain.',
    alias: 'Rye, Gandum Hitam, Secale',
    asal: 'Asia Barat/Eropa Timur; dibudidayakan di daerah beriklim dingin; Indonesia sepenuhnya impor',
    habitat: 'Iklim dingin/subtropis, toleran tanah asam dan miskin hara',
    umurPanenIdeal: '100–130 hari setelah tanam saat biji mengeras penuh',
    bagianDimanfaatkan: 'Biji utuh feed grade',
    produksi: '2,5–4 ton biji kering/ha/musim tanam',
    kelebihan: 'Tahan iklim ekstrem dan tanah marginal sehingga stabil dari sisi pasokan negara penghasil; energi cukup tinggi setara gandum',
    kekurangan: 'Risiko kontaminasi ergot (Claviceps purpurea) lebih tinggi — wajib sertifikat bebas ergot; palatabilitas lebih rendah dari gandum/jelai karena rasa pahit ringan',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 11.0, sk: 2.5, lk: 1.7, abu: 2.0, betn: 82.8,
      tdn: 82, me: 3280,
      ndf: 14.0, adf: 4.5,
      ca: 0.06, p: 0.33, mg: 0.13, na: 0.02, k: 0.48, cl: 0.08, s: 0.15,
      vitamin: 'Vitamin B kompleks sedang',
      mineral: 'P sedang, Ca rendah. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Domba'],
      programCocok: ['Penggemukan', 'Grower'],
      musimTerbaik: 'Tersedia sepanjang tahun dari pasokan impor terbatas',
      umurPanenTerbaik: 'Kadar air ≤13% dan bebas kontaminasi ergot',
      catatan: 'Batasi maksimal 20% ransum dan verifikasi sertifikat bebas ergot sebelum digunakan; tidak dianjurkan untuk ternak bunting karena ergot dapat memicu keguguran.',
    },
    harga: {
      estimasiAI: 7500, hargaMarketplace: null,
      satuan: 'per kg biji feed grade', supplier: 'Importir biji-bijian khusus (pesanan terbatas)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Rye grain, INRA-CIRAD-AFZ-FAO',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Ed.',
      ],
      sumberData: 'Rata-rata dari Feedipedia untuk rye feed grade',
      catatan: 'Selalu periksa sertifikat bebas ergot dari pemasok sebelum pembelian dalam jumlah besar.',
    },
    aiInsight: [
      { type: 'peringatan', icon: '🚨', text: 'Rye berisiko terkontaminasi ergot (jamur beracun) yang dapat menyebabkan keguguran dan gangren pada ternak — wajib sertifikat bebas ergot dari pemasok.' },
      { type: 'fungsi', icon: '🌾', text: 'Sebagai sumber energi, rye setara gandum (TDN ±82% BK) namun penggunaannya dibatasi karena risiko keamanan pakan dan palatabilitas lebih rendah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Rasa pahit ringan menurunkan konsumsi pakan bila proporsi rye terlalu tinggi dalam ransum — batasi maksimal 20%.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan sebagai pelengkap kecil bersama Gandum atau Jelai, bukan sebagai sumber energi tunggal.' },
      { type: 'alternatif', icon: '🔄', text: 'Triticale (hasil silang gandum-rye) menawarkan energi serupa dengan risiko ergot lebih rendah.' },
    ],
  },

  // ── 5. Triticale ─────────────────────────────────────────────────────────
  'triticale': {
    deskripsi: 'Triticale adalah serealia hasil persilangan gandum (Triticum) dan rye (Secale) yang menggabungkan hasil tinggi gandum dengan ketahanan rye. Sebagai pakan ternak, triticale menawarkan energi dan protein yang kompetitif dengan gandum pada lahan yang kurang subur.',
    alias: 'Triticale, Hasil Silang Gandum-Rye',
    asal: 'Dikembangkan pertama kali di Skotlandia/Swedia akhir abad ke-19; kini dibudidayakan di Eropa, Amerika Utara, Australia',
    habitat: 'Iklim sedang, toleran tanah marginal dan kekeringan lebih baik dibanding gandum murni',
    umurPanenIdeal: '100–120 hari setelah tanam saat biji mengeras penuh',
    bagianDimanfaatkan: 'Biji utuh feed grade',
    produksi: '3–5 ton biji kering/ha/musim tanam',
    kelebihan: 'Kombinasi hasil tinggi gandum dan ketahanan rye; protein sedikit lebih tinggi dari gandum; palatabilitas baik tanpa risiko ergot setinggi rye murni',
    kekurangan: 'Belum sepopuler gandum/jelai di pasar pakan Indonesia sehingga pasokan terbatas dan harga kurang kompetitif',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 13.0, sk: 2.8, lk: 1.8, abu: 2.0, betn: 80.4,
      tdn: 82, me: 3280,
      ndf: 13.5, adf: 4.2,
      ca: 0.06, p: 0.36, mg: 0.14, na: 0.02, k: 0.47, cl: 0.08, s: 0.16,
      vitamin: 'Vitamin B kompleks cukup',
      mineral: 'P organik sedang, Ca rendah. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Menyusui'],
      musimTerbaik: 'Tersedia dari pasokan impor terbatas',
      umurPanenTerbaik: 'Kadar air ≤13% untuk stabilitas penyimpanan',
      catatan: 'Dapat menggantikan gandum secara langsung pada sebagian besar formula ransum karena profil nutrisi yang mirip.',
    },
    harga: {
      estimasiAI: 6800, hargaMarketplace: null,
      satuan: 'per kg biji feed grade', supplier: 'Importir biji-bijian khusus',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Triticale grain, INRA-CIRAD-AFZ-FAO',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Ed.',
      ],
      sumberData: 'Rata-rata dari Feedipedia untuk triticale feed grade',
      catatan: 'Nilai nutrisi bervariasi tergantung proporsi genetik gandum:rye pada varietas.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Triticale menggabungkan energi tinggi gandum dengan ketahanan rye — pilihan efisien untuk lahan marginal tanpa mengorbankan nilai nutrisi pakan.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein 13% BK, sedikit lebih tinggi dari gandum murni, dengan risiko ergot yang jauh lebih rendah dibanding rye.' },
      { type: 'kombinasi', icon: '🔗', text: 'Dapat menggantikan Gandum satu-untuk-satu dalam sebagian besar formula ransum penggemukan dan sapi perah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ketersediaan di pasar Indonesia masih terbatas dibanding gandum/jelai — perlu perencanaan pengadaan lebih awal.' },
      { type: 'alternatif', icon: '🔄', text: 'Gandum atau Jelai sebagai alternatif utama bila triticale tidak tersedia di pasar lokal.' },
    ],
  },

  // ── 6. Canary Seed ───────────────────────────────────────────────────────
  'canary-seed': {
    deskripsi: 'Canary seed adalah biji serealia kecil dengan kandungan protein tinggi, secara tradisional digunakan sebagai pakan burung namun mulai dilirik sebagai bahan pakan ternak kecil karena profil asam amino yang baik dan bebas gluten.',
    alias: 'Canary Grass Seed, Biji Kenari (bukan kacang kenari)',
    asal: 'Kepulauan Canary dan Mediterania; dibudidayakan di Kanada sebagai penghasil utama dunia',
    habitat: 'Iklim sedang kering; toleran tanah berpasir',
    umurPanenIdeal: '90–100 hari setelah tanam saat malai mengering',
    bagianDimanfaatkan: 'Biji utuh',
    produksi: '1–1,5 ton biji kering/ha/musim tanam',
    kelebihan: 'Protein tinggi (18–22% BK) untuk ukuran serealia; bebas gluten; profil asam amino relatif seimbang',
    kekurangan: 'Harga tinggi karena niche dan sepenuhnya impor; bulu halus pada sekam dapat mengiritasi saluran napas bila ditangani tanpa masker',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 20.0, sk: 8.0, lk: 5.5, abu: 3.0, betn: 55.5,
      tdn: 75, me: 3000,
      ndf: 20.0, adf: 9.0,
      ca: 0.08, p: 0.40, mg: 0.20, na: 0.02, k: 0.55, cl: 0.08, s: 0.20,
      vitamin: 'Vitamin B kompleks sedang',
      mineral: 'P sedang. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Ayam Kampung', 'Kambing', 'Domba'],
      programCocok: ['Grower', 'Indukan'],
      musimTerbaik: 'Tersedia dari pasokan impor terbatas',
      umurPanenTerbaik: 'Kadar air ≤10% untuk stabilitas penyimpanan',
      catatan: 'Gunakan masker saat menangani biji kering karena bulu halus sekam dapat mengiritasi saluran pernapasan pekerja.',
    },
    harga: {
      estimasiAI: 15000, hargaMarketplace: null,
      satuan: 'per kg biji impor', supplier: 'Importir pakan burung / Toko pakan khusus',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Canary seed, INRA-CIRAD-AFZ-FAO',
        'Abdel-Aal, E.S. et al. (2011) — Compositional and nutritional characteristics of spring canary seed',
      ],
      sumberData: 'Rata-rata dari Feedipedia dan literatur agronomi canary seed',
      catatan: 'Data nutrisi masih terbatas di literatur pakan Indonesia; nilai mengacu pada studi internasional.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🐦', text: 'Canary seed menawarkan protein tinggi (20% BK) dan bebas gluten — potensial sebagai suplemen protein niche untuk unggas dan ternak kecil.' },
      { type: 'peringatan', icon: '🚨', text: 'Bulu halus pada sekam biji dapat mengiritasi saluran napas — gunakan masker dan ventilasi baik saat penanganan dalam jumlah besar.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga tinggi dan pasokan sangat terbatas di Indonesia karena sepenuhnya impor dari Kanada — kurang ekonomis untuk skala besar.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan sebagai suplemen kecil (≤15%) bersama serealia utama seperti jagung atau gandum, bukan sumber energi/protein utama.' },
      { type: 'alternatif', icon: '🔄', text: 'Kedelai atau Kacang Hijau sebagai alternatif sumber protein yang lebih terjangkau dan tersedia luas di Indonesia.' },
    ],
  },

  // ── 7. Teff ──────────────────────────────────────────────────────────────
  'teff': {
    deskripsi: 'Teff adalah serealia berbiji sangat kecil asal Ethiopia, terkenal sebagai bahan pangan pokok injera. Sebagai pakan ternak, jerami teff banyak dimanfaatkan namun bijinya juga bernilai gizi tinggi meski jarang digunakan untuk pakan karena harga premium.',
    alias: 'Teff, Williams Lovegrass, Xafi (Ethiopia)',
    asal: 'Dataran tinggi Ethiopia dan Eritrea; kini dibudidayakan terbatas di berbagai negara sebagai tanaman khusus (gluten-free)',
    habitat: 'Dataran tinggi tropis 1.800–2.800 mdpl di daerah asal; toleran kekeringan dan tanah marginal',
    umurPanenIdeal: '70–130 hari setelah tanam tergantung varietas',
    bagianDimanfaatkan: 'Biji utuh (sangat kecil, ±1 mm); jerami sebagai hijauan kering',
    produksi: '0,8–1,5 ton biji kering/ha/musim tanam (produktivitas rendah dibanding serealia besar)',
    kelebihan: 'Bebas gluten; kandungan Ca dan Fe relatif tinggi dibanding serealia lain; jerami bernilai sebagai hijauan kering berkualitas',
    kekurangan: 'Harga sangat tinggi karena diimpor sebagai komoditas pangan premium; produktivitas rendah membuat biji jarang dipakai untuk pakan ternak',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 11.0, sk: 3.0, lk: 2.5, abu: 3.0, betn: 80.5,
      tdn: 75, me: 3000,
      ndf: 15.0, adf: 5.0,
      ca: 0.18, p: 0.35, mg: 0.18, na: 0.02, k: 0.45, cl: 0.10, s: 0.18,
      vitamin: 'Vitamin B kompleks cukup',
      mineral: 'Kalsium dan zat besi relatif tinggi dibanding serealia umum. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 10,
      targetTernak: ['Kambing', 'Domba'],
      programCocok: ['Indukan'],
      musimTerbaik: 'Tersedia dari pasokan impor sangat terbatas',
      umurPanenTerbaik: 'Kadar air ≤11% untuk stabilitas penyimpanan',
      catatan: 'Jarang ekonomis untuk pakan ternak karena harga premium pangan manusia — pertimbangkan hanya untuk kebutuhan riset atau ternak bernilai tinggi.',
    },
    harga: {
      estimasiAI: 25000, hargaMarketplace: null,
      satuan: 'per kg biji impor premium', supplier: 'Importir bahan pangan khusus (toko organik)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Teff grain and straw, INRA-CIRAD-AFZ-FAO',
        'Assefa, K. et al. (2011) — Genetic diversity in tef [Eragrostis tef]',
      ],
      sumberData: 'Estimasi dari Feedipedia dan literatur agronomi teff',
      catatan: 'Data nutrisi biji teff untuk pakan ternak masih terbatas; sebagian besar literatur berfokus pada jerami (straw) sebagai hijauan.',
    },
    aiInsight: [
      { type: 'kekurangan', icon: '⚠️', text: 'Harga sangat tinggi karena teff diperdagangkan sebagai komoditas pangan premium bebas gluten — tidak ekonomis untuk pakan ternak skala komersial.' },
      { type: 'fungsi', icon: '🌾', text: 'Kandungan kalsium dan zat besi relatif tinggi menjadikan teff berpotensi sebagai suplemen mineral alami bila biaya bukan kendala.' },
      { type: 'alternatif', icon: '🔄', text: 'Jerami Teff (bukan biji) jauh lebih ekonomis sebagai hijauan kering dibanding biji teff untuk pakan ternak.' },
      { type: 'kombinasi', icon: '🔗', text: 'Bila digunakan, batasi sebagai suplemen kecil (≤10%) untuk ternak bernilai tinggi seperti indukan pembibitan.' },
      { type: 'peringatan', icon: '🚨', text: 'Pastikan sumber teff bebas dari kontaminasi pasir karena ukuran biji sangat kecil dan mudah tercampur kotoran saat panen tradisional.' },
    ],
  },

  // ── 8. Fonio ─────────────────────────────────────────────────────────────
  'fonio': {
    deskripsi: 'Fonio adalah serealia kuno asal Afrika Barat dengan biji sangat kecil, dikenal sebagai "biji kelaparan" karena mampu tumbuh di tanah paling miskin sekalipun. Sebagai pakan ternak, penggunaannya masih sangat terbatas karena produktivitas rendah dan harga premium di pasar internasional.',
    alias: 'Fonio, Acha, Hungry Rice',
    asal: 'Afrika Barat (Mali, Guinea, Senegal); salah satu serealia tertua yang dibudidayakan manusia',
    habitat: 'Sabana kering hingga semi-arid; tumbuh baik di tanah sangat miskin hara dan berpasir',
    umurPanenIdeal: '70–120 hari setelah tanam tergantung varietas (fonio putih lebih cepat dari fonio hitam)',
    bagianDimanfaatkan: 'Biji utuh (sangat kecil, ±1–1,5 mm)',
    produksi: '0,5–1 ton biji kering/ha/musim tanam (produktivitas rendah)',
    kelebihan: 'Sangat tahan kekeringan dan tanah marginal; bebas gluten; profil asam amino mengandung metionin dan sistein cukup baik',
    kekurangan: 'Produktivitas sangat rendah dan proses penyosohan biji kecil sulit; harga tinggi sebagai komoditas pangan premium ekspor; pasokan di Indonesia hampir tidak ada',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 8.5, sk: 2.5, lk: 2.0, abu: 2.5, betn: 84.5,
      tdn: 72, me: 2880,
      ndf: 14.0, adf: 5.0,
      ca: 0.02, p: 0.20, mg: 0.10, na: 0.01, k: 0.30, cl: 0.05, s: 0.12,
      vitamin: 'Data vitamin terbatas',
      mineral: 'Mineral makro relatif rendah dibanding serealia lain. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 10,
      targetTernak: ['Kambing', 'Domba'],
      programCocok: ['Indukan'],
      musimTerbaik: 'Tidak tersedia rutin di pasar Indonesia',
      umurPanenTerbaik: 'Kadar air ≤11% untuk stabilitas penyimpanan',
      catatan: 'Penggunaan untuk pakan ternak di Indonesia sangat tidak lazim dan tidak ekonomis; dicantumkan sebagai referensi literatur global.',
    },
    harga: {
      estimasiAI: 30000, hargaMarketplace: null,
      satuan: 'per kg biji impor premium', supplier: 'Tidak tersedia rutin di pasar Indonesia',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Fonio, INRA-CIRAD-AFZ-FAO',
        'National Research Council (1996) — Lost Crops of Africa: Volume I, Grains',
      ],
      sumberData: 'Estimasi dari Feedipedia dan literatur agronomi Afrika Barat',
      catatan: 'Data nutrisi terbatas; digunakan terutama sebagai referensi keragaman serealia global, bukan rekomendasi praktik pakan Indonesia.',
    },
    aiInsight: [
      { type: 'kekurangan', icon: '⚠️', text: 'Fonio praktis tidak tersedia di pasar Indonesia dan harganya sangat tinggi sebagai komoditas ekspor premium — tidak direkomendasikan untuk pakan ternak komersial di Indonesia.' },
      { type: 'fungsi', icon: '🌾', text: 'Secara nutrisi, fonio menyediakan energi sedang (TDN ±72% BK) dengan profil asam amino yang relatif seimbang untuk ukuran biji sangat kecil.' },
      { type: 'alternatif', icon: '🔄', text: 'Jewawut (Millet) atau Sorgum adalah alternatif serealia tahan kering yang jauh lebih tersedia dan ekonomis di Indonesia.' },
      { type: 'peringatan', icon: '🚨', text: 'Ukuran biji sangat kecil membuat fonio rentan tercampur kotoran/pasir bila diproses secara tradisional — perlu penyaringan ketat bila digunakan.' },
    ],
  },

  // ── 9. Buckwheat (Soba) ──────────────────────────────────────────────────
  'buckwheat': {
    deskripsi: 'Buckwheat (soba) adalah pseudo-cereal (bukan famili rumput sejati) dengan biji berbentuk segitiga. Digunakan sebagai bahan pangan mi soba dan mulai dilirik sebagai bahan pakan karena profil asam amino lisin yang baik serta bebas gluten.',
    alias: 'Buckwheat, Soba, Common Buckwheat',
    asal: 'Asia Tengah/Tiongkok Barat Daya; menyebar ke Eropa Timur dan Jepang sebagai bahan pangan utama',
    habitat: 'Iklim sedang sejuk; toleran tanah masam dan kurang subur; tidak toleran suhu panas ekstrem',
    umurPanenIdeal: '70–90 hari setelah tanam (siklus tanam sangat pendek)',
    bagianDimanfaatkan: 'Biji utuh berikut kulit ari (hull) atau groat (tanpa kulit)',
    produksi: '1–1,5 ton biji kering/ha/musim tanam',
    kelebihan: 'Siklus tanam sangat pendek (70–90 hari); bebas gluten; profil lisin lebih baik dari kebanyakan serealia sejati; toleran tanah marginal',
    kekurangan: 'Serat kasar tinggi dari kulit ari yang menempel erat; kandungan fagopyrin dapat memicu fotosensitisasi pada ternak berkulit terang bila dikonsumsi berlebihan',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 12.0, sk: 10.5, lk: 2.5, abu: 2.5, betn: 72.5,
      tdn: 68, me: 2720,
      ndf: 22.0, adf: 12.0,
      ca: 0.08, p: 0.32, mg: 0.20, na: 0.02, k: 0.45, cl: 0.06, s: 0.15,
      vitamin: 'Vitamin B kompleks cukup; Rutin (flavonoid) tinggi',
      mineral: 'Mg relatif tinggi dibanding serealia sejati. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 15,
      targetTernak: ['Kambing', 'Domba', 'Ayam Kampung'],
      programCocok: ['Grower'],
      musimTerbaik: 'Tersedia dari pasokan impor terbatas',
      umurPanenTerbaik: 'Kadar air ≤12% untuk stabilitas penyimpanan',
      catatan: 'Hindari pemberian berlebihan pada ternak berkulit/berbulu terang karena fagopyrin dapat memicu fotosensitisasi (iritasi kulit akibat sinar matahari).',
    },
    harga: {
      estimasiAI: 12000, hargaMarketplace: null,
      satuan: 'per kg biji impor', supplier: 'Importir bahan pangan / Toko bahan organik',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Common buckwheat, INRA-CIRAD-AFZ-FAO',
        'Campbell, C.G. (1997) — Buckwheat, Fagopyrum esculentum Moench',
      ],
      sumberData: 'Rata-rata dari Feedipedia dan literatur agronomi buckwheat',
      catatan: 'Kadar fagopyrin bervariasi antar varietas dan bagian tanaman; biji mengandung lebih sedikit dibanding daun/bunga.',
    },
    aiInsight: [
      { type: 'peringatan', icon: '🚨', text: 'Fagopyrin dalam buckwheat dapat menyebabkan fotosensitisasi (kulit melepuh terkena matahari) pada ternak berkulit/berbulu terang bila dikonsumsi berlebihan — batasi maksimal 15% ransum.' },
      { type: 'fungsi', icon: '🌾', text: 'Siklus tanam sangat pendek (70–90 hari) menjadikan buckwheat pilihan tanaman sela yang cepat menghasilkan bahan pakan tambahan.' },
      { type: 'kelebihan', icon: '✅', text: 'Profil lisin yang baik melengkapi kekurangan lisin pada ransum berbasis jagung/gandum.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Serat kasar tinggi dari kulit ari menurunkan TDN dibanding serealia sejati seperti gandum atau jelai.' },
      { type: 'alternatif', icon: '🔄', text: 'Amaranth Grain atau Quinoa sebagai alternatif pseudo-cereal bebas gluten dengan profil nutrisi serupa.' },
    ],
  },

  // ── 10. Quinoa ───────────────────────────────────────────────────────────
  'quinoa': {
    deskripsi: 'Quinoa adalah pseudo-cereal asal pegunungan Andes dengan kandungan protein lengkap (semua asam amino esensial) yang sangat baik. Sebagai bahan pakan, biasanya berupa quinoa reject/afkir dari industri pangan karena harga quinoa food-grade sangat mahal.',
    alias: 'Quinoa, Kinoa, Andean Grain',
    asal: 'Pegunungan Andes (Bolivia, Peru); dibudidayakan sebagai tanaman pangan super (superfood) sejak ribuan tahun lalu',
    habitat: 'Dataran tinggi 2.500–4.000 mdpl di daerah asal; sangat toleran salinitas tanah dan kekeringan',
    umurPanenIdeal: '90–120 hari setelah tanam saat malai mengering',
    bagianDimanfaatkan: 'Biji utuh (setelah dicuci untuk menghilangkan saponin pahit pada kulit ari)',
    produksi: '1–2,5 ton biji kering/ha/musim tanam',
    kelebihan: 'Protein lengkap dengan semua asam amino esensial (unik untuk biji-bijian); bebas gluten; kaya serat dan mineral',
    kekurangan: 'Mengandung saponin pahit pada kulit ari yang wajib dicuci sebelum konsumsi; harga sangat tinggi sebagai komoditas pangan superfood ekspor',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 14.5, sk: 6.5, lk: 6.0, abu: 3.5, betn: 69.5,
      tdn: 78, me: 3120,
      ndf: 16.0, adf: 7.0,
      ca: 0.10, p: 0.45, mg: 0.25, na: 0.02, k: 0.85, cl: 0.06, s: 0.20,
      vitamin: 'Vitamin B kompleks tinggi; Vitamin E cukup',
      mineral: 'Fe, Mg, dan Zn relatif tinggi dibanding serealia sejati. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 10,
      targetTernak: ['Ayam Kampung', 'Kambing'],
      programCocok: ['Indukan', 'Menyusui'],
      musimTerbaik: 'Tersedia dari pasokan impor sangat terbatas (umumnya afkir/reject)',
      umurPanenTerbaik: 'Kadar air ≤11% untuk stabilitas penyimpanan',
      catatan: 'Pastikan saponin sudah dihilangkan (dicuci) sebelum diberikan — saponin mentah dapat mengganggu palatabilitas dan penyerapan nutrisi.',
    },
    harga: {
      estimasiAI: 35000, hargaMarketplace: null,
      satuan: 'per kg biji impor (grade afkir)', supplier: 'Importir bahan pangan sehat / Toko organik',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Quinoa seeds, INRA-CIRAD-AFZ-FAO',
        'Vega-Gálvez, A. et al. (2010) — Nutrition facts and functional potential of quinoa',
      ],
      sumberData: 'Rata-rata dari Feedipedia dan literatur nutrisi quinoa',
      catatan: 'Nilai gizi bervariasi antar varietas (putih, merah, hitam); kandungan saponin tertinggi pada varietas liar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Quinoa unik karena mengandung protein lengkap dengan seluruh asam amino esensial — jarang ditemukan pada biji-bijian lain.' },
      { type: 'peringatan', icon: '🚨', text: 'Saponin pahit pada kulit ari wajib dicuci bersih sebelum digunakan sebagai pakan; saponin mentah dapat menurunkan palatabilitas dan mengiritasi saluran cerna.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga sangat tinggi sebagai komoditas superfood ekspor membuat quinoa tidak ekonomis untuk pakan ternak skala komersial di Indonesia.' },
      { type: 'kombinasi', icon: '🔗', text: 'Bila tersedia sebagai grade afkir murah, gunakan sebagai suplemen protein-mineral kecil untuk indukan bernilai tinggi.' },
      { type: 'alternatif', icon: '🔄', text: 'Amaranth Grain menawarkan profil protein serupa dengan harga yang relatif lebih terjangkau.' },
    ],
  },

  // ── 11. Amaranth Grain ───────────────────────────────────────────────────
  'amaranth-grain': {
    deskripsi: 'Amaranth grain adalah pseudo-cereal dari famili Amaranthaceae dengan biji sangat kecil, kaya protein dan lisin. Berbeda dari Bayam (Amaranthus untuk sayuran daun), varietas grain amaranth dibudidayakan khusus untuk dipanen bijinya sebagai pangan/pakan.',
    alias: 'Amaranth Grain, Biji Bayam Serealia',
    asal: 'Amerika Tengah (peradaban Aztek/Maya); kini dibudidayakan di berbagai negara tropis dan subtropis termasuk sebagian Asia',
    habitat: 'Dataran rendah hingga menengah, toleran kekeringan dan tanah kurang subur; tumbuh cepat di iklim tropis',
    umurPanenIdeal: '90–120 hari setelah tanam saat malai mengering dan biji mudah rontok',
    bagianDimanfaatkan: 'Biji utuh (sangat kecil, <1 mm); daun muda juga dapat dimanfaatkan sebagai hijauan',
    produksi: '1–2 ton biji kering/ha/musim tanam',
    kelebihan: 'Protein tinggi (14–16% BK) dengan lisin melimpah (pelengkap ideal untuk ransum berbasis serealia rendah lisin); bebas gluten; tahan kekeringan',
    kekurangan: 'Biji sangat kecil membuat penanganan dan pembersihan pasca panen lebih sulit; belum ada rantai pasok pakan komersial di Indonesia',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 15.0, sk: 4.5, lk: 6.5, abu: 3.0, betn: 71.0,
      tdn: 78, me: 3120,
      ndf: 12.0, adf: 5.0,
      ca: 0.16, p: 0.48, mg: 0.27, na: 0.02, k: 0.55, cl: 0.06, s: 0.20,
      vitamin: 'Vitamin B kompleks cukup',
      mineral: 'Ca dan Fe relatif tinggi dibanding serealia sejati. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Ayam Kampung', 'Kambing'],
      programCocok: ['Grower', 'Indukan'],
      musimTerbaik: 'Belum tersedia rutin di pasar pakan Indonesia',
      umurPanenTerbaik: 'Kadar air ≤11% untuk stabilitas penyimpanan',
      catatan: 'Berpotensi dikembangkan sebagai tanaman pakan lokal alternatif karena mudah tumbuh di lahan marginal tropis, namun belum ada rantai pasok komersial mapan.',
    },
    harga: {
      estimasiAI: 20000, hargaMarketplace: null,
      satuan: 'per kg biji (grade pangan/pakan)', supplier: 'Petani binaan / Toko bahan pangan sehat',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Amaranth grain, INRA-CIRAD-AFZ-FAO',
        'National Research Council (1984) — Amaranth: Modern Prospects for an Ancient Crop',
      ],
      sumberData: 'Rata-rata dari Feedipedia dan literatur agronomi amaranth',
      catatan: 'Data spesifik untuk pakan ternak masih terbatas; sebagian besar riset berfokus pada nilai gizi pangan manusia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Amaranth grain kaya lisin — asam amino yang sering menjadi faktor pembatas pada ransum berbasis jagung atau gandum.' },
      { type: 'kelebihan', icon: '✅', text: 'Tahan kekeringan dan cepat tumbuh di lahan tropis marginal, berpotensi dikembangkan sebagai tanaman pakan lokal alternatif.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Belum ada rantai pasok pakan komersial di Indonesia — saat ini hanya tersedia dari petani binaan skala kecil atau toko bahan pangan sehat.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan Jagung atau Gandum untuk melengkapi profil asam amino ransum unggas dan ternak kecil.' },
      { type: 'alternatif', icon: '🔄', text: 'Quinoa menawarkan profil protein serupa; Kedelai sebagai sumber lisin yang lebih mapan dan tersedia luas.' },
    ],
  },

  // ── 12. Jali (Job's Tears) ───────────────────────────────────────────────
  'jali': {
    deskripsi: 'Jali (Job\'s tears) adalah serealia tropis asli Asia Tenggara dengan biji keras berbentuk oval mengkilap. Secara tradisional ditanam di pekarangan dan lahan kering sebagai pangan alternatif, dan bijinya dapat dimanfaatkan sebagai bahan pakan sumber energi.',
    alias: "Job's Tears, Hanjeli, Jali-jali, Coix",
    asal: 'Asia Tenggara dan Asia Timur; dibudidayakan tradisional di Indonesia (Jawa, Sumatera) sebagai tanaman pangan alternatif',
    habitat: 'Dataran rendah hingga 1.000 mdpl; toleran tanah kering dan marginal; tumbuh liar di pinggir sawah/kebun',
    umurPanenIdeal: '4–6 bulan setelah tanam saat malai mengering dan biji mengeras',
    bagianDimanfaatkan: 'Biji utuh (perlu dikupas dari cangkang keras)',
    produksi: '1,5–2,5 ton biji kering/ha/musim tanam',
    kelebihan: 'Adaptif tumbuh di lahan marginal Indonesia tanpa perawatan intensif; energi cukup tinggi; sudah dikenal petani lokal sehingga mudah dikembangkan',
    kekurangan: 'Cangkang biji sangat keras sehingga perlu proses pengupasan khusus; belum ada rantai pasok pakan skala komersial',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 12.5, sk: 4.0, lk: 5.5, abu: 2.5, betn: 75.5,
      tdn: 78, me: 3120,
      ndf: 14.0, adf: 6.0,
      ca: 0.05, p: 0.30, mg: 0.15, na: 0.02, k: 0.40, cl: 0.06, s: 0.15,
      vitamin: 'Data vitamin terbatas',
      mineral: 'P sedang. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Ayam Kampung', 'Kambing', 'Domba'],
      programCocok: ['Grower', 'Penggemukan'],
      musimTerbaik: 'Panen musim kemarau saat biji sudah kering sempurna di pohon',
      umurPanenTerbaik: 'Biji berwarna abu-abu mengkilap dan keras penuh',
      catatan: 'Perlu digiling atau dipecah cangkangnya terlebih dahulu agar dapat dicerna optimal oleh ternak, terutama unggas.',
    },
    harga: {
      estimasiAI: 9000, hargaMarketplace: null,
      satuan: 'per kg biji lokal', supplier: 'Petani lokal / Pasar tradisional daerah penghasil',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Job\'s tears (Coix lacryma-jobi), INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Estimasi dari Feedipedia dan data agronomi tanaman pangan lokal Indonesia',
      catatan: 'Penggunaan sebagai pakan ternak di Indonesia masih jarang terdokumentasi secara komersial; potensi pengembangan lokal cukup besar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Jali adalah serealia lokal Indonesia yang adaptif di lahan marginal — berpotensi menjadi sumber energi pakan alternatif berbasis bahan baku domestik.' },
      { type: 'kelebihan', icon: '✅', text: 'Energi cukup tinggi (TDN ±78% BK) dengan lemak lebih tinggi dari serealia umum, mendekati karakteristik sorgum.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Cangkang biji sangat keras memerlukan proses pengupasan khusus sebelum digiling — menambah biaya pengolahan dibanding jagung/sorgum.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan sumber protein lokal (Kedelai, Bungkil Kelapa) untuk ransum penggemukan berbasis bahan baku domestik.' },
      { type: 'alternatif', icon: '🔄', text: 'Sorgum atau Jagung Pipil sebagai alternatif energi serealia dengan rantai pasok yang lebih mapan.' },
    ],
  },

  // ── 13. Proso Millet ─────────────────────────────────────────────────────
  'proso-millet': {
    deskripsi: 'Proso millet adalah serealia berbiji kecil dengan siklus tanam sangat pendek, umum digunakan sebagai pakan burung dan mulai dimanfaatkan sebagai bahan pakan ternak kecil di daerah kering karena ketahanannya terhadap kekeringan ekstrem.',
    alias: 'Proso Millet, Common Millet, Broomcorn Millet',
    asal: 'Asia Tengah/Tiongkok Utara; salah satu serealia tertua yang dibudidayakan manusia',
    habitat: 'Iklim kering-semi arid; siklus tanam sangat pendek sehingga cocok untuk daerah musim tanam terbatas',
    umurPanenIdeal: '60–90 hari setelah tanam (salah satu serealia dengan siklus tercepat)',
    bagianDimanfaatkan: 'Biji utuh',
    produksi: '1–1,8 ton biji kering/ha/musim tanam',
    kelebihan: 'Siklus tanam sangat pendek (60–90 hari) sehingga dapat dipanen 2–3 kali setahun; sangat tahan kekeringan; bebas gluten',
    kekurangan: 'Biji kecil membutuhkan alat panen/pembersih khusus; kurang populer di Indonesia dibanding jewawut (foxtail millet)',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 11.0, sk: 8.0, lk: 3.5, abu: 3.5, betn: 74.0,
      tdn: 72, me: 2880,
      ndf: 18.0, adf: 8.0,
      ca: 0.05, p: 0.30, mg: 0.16, na: 0.02, k: 0.40, cl: 0.06, s: 0.15,
      vitamin: 'Vitamin B kompleks sedang',
      mineral: 'P sedang. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 25,
      targetTernak: ['Ayam Kampung', 'Kambing', 'Domba'],
      programCocok: ['Grower'],
      musimTerbaik: 'Dapat dipanen hingga 2–3 kali setahun di daerah kering',
      umurPanenTerbaik: 'Kadar air ≤11% untuk stabilitas penyimpanan',
      catatan: 'Cocok dikembangkan di daerah kering/musim tanam pendek sebagai sumber energi pakan alternatif lokal.',
    },
    harga: {
      estimasiAI: 10000, hargaMarketplace: null,
      satuan: 'per kg biji', supplier: 'Petani daerah kering / Toko pakan burung',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Proso millet, INRA-CIRAD-AFZ-FAO',
        'FAO (2018) — Feed Resources for Tropical Ruminants',
      ],
      sumberData: 'Rata-rata dari Feedipedia untuk proso millet grain',
      catatan: 'Sering dijual bersama campuran pakan burung; kemurnian perlu diperiksa bila digunakan untuk pakan ternak.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Proso millet memiliki siklus tanam tercepat di antara serealia (60–90 hari), cocok untuk daerah dengan musim tanam sangat terbatas.' },
      { type: 'kelebihan', icon: '✅', text: 'Sangat tahan kekeringan — pilihan tepat untuk daerah rawan kering yang sulit menanam jagung atau padi secara stabil.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Biji kecil menyulitkan panen dan pembersihan manual; belum ada rantai pasok pakan skala besar di Indonesia.' },
      { type: 'kombinasi', icon: '🔗', text: 'Cocok dikombinasikan dengan Sorgum sebagai basis ransum energi untuk daerah kering minim akses jagung.' },
      { type: 'alternatif', icon: '🔄', text: 'Jewawut (Foxtail Millet) sebagai alternatif millet yang lebih dikenal dan tersedia di pasar Indonesia.' },
    ],
  },

  // ── 14. Pearl Millet ─────────────────────────────────────────────────────
  'pearl-millet': {
    deskripsi: 'Pearl millet adalah serealia tahan kering terpenting di Afrika dan Asia Selatan, dengan biji lebih besar dari jenis millet lain. Digunakan luas sebagai bahan pakan ternak di daerah semi-arid karena produktivitas stabil meski curah hujan rendah.',
    alias: 'Pearl Millet, Bajra, Gandum Mutiara',
    asal: 'Afrika Sub-Sahara (Sahel); menyebar ke India dan Asia Selatan sebagai tanaman pangan-pakan utama daerah kering',
    habitat: 'Iklim semi-arid hingga arid; sangat toleran suhu tinggi dan tanah berpasir miskin hara',
    umurPanenIdeal: '75–100 hari setelah tanam saat malai mengeras penuh',
    bagianDimanfaatkan: 'Biji utuh; jerami sebagai hijauan kering tambahan',
    produksi: '1,5–3 ton biji kering/ha/musim tanam',
    kelebihan: 'Sangat tahan kekeringan dan suhu ekstrem melebihi sorgum; energi dan protein setara jagung; tannin rendah (tidak seperti sorgum tertentu)',
    kekurangan: 'Belum dibudidayakan luas di Indonesia sehingga sepenuhnya bergantung impor; daya simpan lebih pendek karena kandungan lemak lebih tinggi (mudah tengik)',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 12.0, sk: 2.2, lk: 5.0, abu: 2.0, betn: 78.8,
      tdn: 78, me: 3120,
      ndf: 12.0, adf: 4.5,
      ca: 0.05, p: 0.35, mg: 0.14, na: 0.02, k: 0.45, cl: 0.06, s: 0.15,
      vitamin: 'Vitamin B kompleks cukup',
      mineral: 'P sedang, Fe relatif tinggi dibanding jagung. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Ayam Kampung'],
      programCocok: ['Penggemukan', 'Grower'],
      musimTerbaik: 'Tersedia dari pasokan impor terbatas',
      umurPanenTerbaik: 'Kadar air ≤12% untuk stabilitas penyimpanan',
      catatan: 'Simpan di tempat sejuk dan kering — kandungan lemak lebih tinggi dari serealia lain membuatnya lebih cepat tengik bila disimpan lama.',
    },
    harga: {
      estimasiAI: 8000, hargaMarketplace: null,
      satuan: 'per kg biji impor', supplier: 'Importir biji-bijian khusus',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Pearl millet grain, INRA-CIRAD-AFZ-FAO',
        'FAO (2018) — Feed Resources for Tropical Ruminants',
      ],
      sumberData: 'Rata-rata dari Feedipedia untuk pearl millet grain',
      catatan: 'Data internasional menunjukkan performa setara jagung pada ransum unggas dan ruminansia di daerah asalnya (Afrika, India).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Pearl millet adalah alternatif energi setara jagung yang sangat tahan kekeringan — berpotensi untuk daerah Indonesia bagian timur yang rawan kering.' },
      { type: 'kelebihan', icon: '✅', text: 'Tannin rendah dibanding sorgum tertentu, sehingga tidak mengganggu penyerapan protein — lebih aman untuk unggas.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kandungan lemak lebih tinggi membuat biji lebih cepat tengik — perlu penyimpanan sejuk dan perputaran stok cepat.' },
      { type: 'kombinasi', icon: '🔗', text: 'Dapat menggantikan Jagung Pipil satu-untuk-satu pada sebagian besar formula ransum penggemukan.' },
      { type: 'alternatif', icon: '🔄', text: 'Sorgum sebagai alternatif serealia tahan kering yang sudah lebih mapan rantai pasoknya di Indonesia.' },
    ],
  },

  // ── 15. Spelt ────────────────────────────────────────────────────────────
  'spelt': {
    deskripsi: 'Spelt adalah gandum kuno (ancient wheat) dengan cangkang yang menempel erat pada biji, sehingga perlu proses dehulling khusus. Digunakan sebagai pangan sehat premium dan mulai dilirik untuk pakan ternak organik/khusus.',
    alias: 'Spelt, Dinkel Wheat, Gandum Dinkel',
    asal: 'Eropa Tengah/Timur Tengah; salah satu jenis gandum tertua yang dibudidayakan sebelum gandum modern (Triticum aestivum) mendominasi',
    habitat: 'Iklim sedang, toleran tanah kurang subur dan cuaca dingin lebih baik dibanding gandum modern',
    umurPanenIdeal: '110–130 hari setelah tanam saat malai mengering',
    bagianDimanfaatkan: 'Biji utuh (setelah dehulling dari cangkang keras)',
    produksi: '2,5–4 ton biji berhull/ha/musim tanam',
    kelebihan: 'Protein lebih tinggi dari gandum modern; sering dipasarkan sebagai bahan pakan organik/premium; toleran cuaca dingin dan tanah marginal',
    kekurangan: 'Cangkang keras memerlukan proses dehulling tambahan yang menaikkan biaya; harga premium karena diposisikan sebagai produk pangan sehat',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 13.5, sk: 3.0, lk: 2.2, abu: 2.0, betn: 79.3,
      tdn: 82, me: 3280,
      ndf: 14.0, adf: 5.0,
      ca: 0.06, p: 0.38, mg: 0.15, na: 0.02, k: 0.48, cl: 0.08, s: 0.16,
      vitamin: 'Vitamin B kompleks cukup',
      mineral: 'P sedang, Ca rendah. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 35,
      targetTernak: ['Sapi Perah', 'Ayam Kampung'],
      programCocok: ['Menyusui', 'Grower'],
      musimTerbaik: 'Tersedia dari pasokan impor terbatas (produk organik/premium)',
      umurPanenTerbaik: 'Kadar air ≤13% untuk stabilitas penyimpanan',
      catatan: 'Umumnya dipasarkan sebagai bahan pakan organik/premium — pertimbangkan biaya vs manfaat dibanding gandum standar.',
    },
    harga: {
      estimasiAI: 15000, hargaMarketplace: null,
      satuan: 'per kg biji dehulled', supplier: 'Importir bahan pangan organik / Toko pakan premium',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Spelt grain, INRA-CIRAD-AFZ-FAO',
        'Bonafaccia, G. et al. (2000) — Nutritional characteristics of spelt wheat',
      ],
      sumberData: 'Rata-rata dari Feedipedia dan literatur nutrisi spelt',
      catatan: 'Nilai gizi mirip gandum modern dengan protein sedikit lebih tinggi; posisi pasar lebih sebagai produk premium/organik.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Spelt adalah gandum kuno dengan protein sedikit lebih tinggi dari gandum modern, sering dipasarkan sebagai bahan pakan organik/premium.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Proses dehulling tambahan menaikkan biaya produksi dibanding gandum modern yang bijinya mudah lepas dari sekam.' },
      { type: 'kelebihan', icon: '✅', text: 'Toleran cuaca dingin dan tanah marginal lebih baik dari gandum modern — stabil di daerah penghasil non-optimal.' },
      { type: 'kombinasi', icon: '🔗', text: 'Dapat menggantikan Gandum standar pada ransum premium/organik dengan penyesuaian harga.' },
      { type: 'alternatif', icon: '🔄', text: 'Gandum standar sebagai alternatif lebih ekonomis dengan profil nutrisi yang sangat mirip.' },
    ],
  },

  // ── 16. Emmer Wheat ──────────────────────────────────────────────────────
  'emmer-wheat': {
    deskripsi: 'Emmer wheat adalah gandum kuno berhull lain yang mendahului gandum modern, dengan protein relatif tinggi. Digunakan terbatas sebagai bahan pangan/pakan khusus di beberapa daerah Mediterania dan mulai dilirik sebagai bahan pakan alternatif bernilai gizi tinggi.',
    alias: 'Emmer Wheat, Farro, Gandum Emmer',
    asal: 'Bulan Sabit Subur; salah satu gandum pertama yang dibudidayakan manusia bersama einkorn',
    habitat: 'Iklim sedang-mediterania; toleran tanah kurang subur dan curah hujan rendah',
    umurPanenIdeal: '100–125 hari setelah tanam saat malai mengering',
    bagianDimanfaatkan: 'Biji utuh (setelah dehulling dari cangkang keras)',
    produksi: '2–3,5 ton biji berhull/ha/musim tanam',
    kelebihan: 'Protein relatif tinggi (14–16% BK); toleran tanah marginal dan curah hujan rendah; dianggap lebih tahan hama dibanding gandum modern',
    kekurangan: 'Produktivitas lebih rendah dari gandum modern; cangkang keras memerlukan dehulling tambahan; pasokan sangat terbatas dan mahal',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 15.0, sk: 3.2, lk: 2.3, abu: 2.2, betn: 77.3,
      tdn: 80, me: 3200,
      ndf: 15.0, adf: 5.5,
      ca: 0.06, p: 0.40, mg: 0.16, na: 0.02, k: 0.50, cl: 0.08, s: 0.18,
      vitamin: 'Vitamin B kompleks cukup',
      mineral: 'P sedang. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Perah', 'Ayam Kampung'],
      programCocok: ['Menyusui', 'Grower'],
      musimTerbaik: 'Tersedia dari pasokan impor sangat terbatas',
      umurPanenTerbaik: 'Kadar air ≤13% untuk stabilitas penyimpanan',
      catatan: 'Ketersediaan sangat terbatas dan mahal — pertimbangkan hanya untuk kebutuhan riset atau ransum khusus bernilai tinggi.',
    },
    harga: {
      estimasiAI: 14000, hargaMarketplace: null,
      satuan: 'per kg biji dehulled', supplier: 'Importir bahan pangan khusus (pesanan terbatas)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Emmer wheat, INRA-CIRAD-AFZ-FAO',
        'Zaharieva, M. et al. (2010) — Cultivated emmer wheat: a review',
      ],
      sumberData: 'Rata-rata dari Feedipedia dan literatur agronomi emmer wheat',
      catatan: 'Data spesifik pakan ternak terbatas; sebagian besar riset berfokus pada nilai gizi pangan manusia (farro).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Emmer wheat menawarkan protein lebih tinggi dari gandum modern (15% vs 12,5% BK), berpotensi sebagai suplemen energi-protein khusus.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Produktivitas rendah dan proses dehulling tambahan membuat harga jauh lebih mahal dari gandum modern — kurang ekonomis untuk pakan komersial.' },
      { type: 'kelebihan', icon: '✅', text: 'Toleran tanah marginal dan hama lebih baik dari gandum modern, cocok untuk pertanian organik/berkelanjutan.' },
      { type: 'alternatif', icon: '🔄', text: 'Gandum standar atau Triticale sebagai alternatif lebih ekonomis dengan energi setara.' },
    ],
  },

  // ── 17. Kañiwa ───────────────────────────────────────────────────────────
  'kaniwa': {
    deskripsi: 'Kañiwa adalah pseudo-cereal kerabat dekat quinoa asal dataran tinggi Andes, dengan biji lebih kecil namun tidak mengandung saponin sehingga tidak perlu dicuci sebelum digunakan. Sangat jarang ditemukan di luar Amerika Selatan.',
    alias: 'Kañiwa, Cañihua, Baby Quinoa',
    asal: 'Dataran tinggi Andes (Peru, Bolivia); dibudidayakan pada ketinggian ekstrem yang bahkan quinoa sulit tumbuh',
    habitat: 'Dataran tinggi 3.800–4.400 mdpl; sangat toleran suhu beku dan tanah miskin hara',
    umurPanenIdeal: '150–170 hari setelah tanam pada iklim asalnya',
    bagianDimanfaatkan: 'Biji utuh (tanpa perlu pencucian saponin seperti quinoa)',
    produksi: '0,5–1 ton biji kering/ha/musim tanam',
    kelebihan: 'Tidak mengandung saponin sehingga tidak perlu diproses sebelum digunakan; protein tinggi mendekati quinoa; sangat tahan suhu ekstrem',
    kekurangan: 'Sangat langka di luar Amerika Selatan dan hampir tidak tersedia di pasar Indonesia; harga sangat tinggi sebagai komoditas niche',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 16.5, sk: 7.0, lk: 7.5, abu: 3.8, betn: 65.2,
      tdn: 76, me: 3040,
      ndf: 18.0, adf: 9.0,
      ca: 0.12, p: 0.42, mg: 0.24, na: 0.02, k: 0.60, cl: 0.06, s: 0.20,
      vitamin: 'Vitamin B kompleks cukup; Vitamin E sedang',
      mineral: 'Fe dan Zn relatif tinggi. Semua nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 10,
      targetTernak: ['Ayam Kampung'],
      programCocok: ['Indukan'],
      musimTerbaik: 'Tidak tersedia rutin di pasar Indonesia',
      umurPanenTerbaik: 'Kadar air ≤11% untuk stabilitas penyimpanan',
      catatan: 'Praktis tidak tersedia secara komersial di Indonesia — dicantumkan sebagai referensi keragaman serealia/pseudo-cereal global.',
    },
    harga: {
      estimasiAI: 40000, hargaMarketplace: null,
      satuan: 'per kg biji impor premium', supplier: 'Tidak tersedia rutin di pasar Indonesia',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Kañiwa, INRA-CIRAD-AFZ-FAO',
        'Repo-Carrasco-Valencia, R. et al. (2010) — Chenopodium pallidicaule: an Andean crop',
      ],
      sumberData: 'Estimasi dari Feedipedia dan literatur agronomi Andes',
      catatan: 'Data untuk konteks pakan ternak Indonesia bersifat referensi global; belum ada praktik penggunaan lokal.',
    },
    aiInsight: [
      { type: 'kekurangan', icon: '⚠️', text: 'Kañiwa hampir tidak tersedia di pasar Indonesia dan harganya sangat tinggi — tidak direkomendasikan untuk praktik pakan ternak komersial saat ini.' },
      { type: 'fungsi', icon: '🌾', text: 'Keunggulan utama kañiwa adalah tidak mengandung saponin seperti quinoa, sehingga tidak memerlukan proses pencucian sebelum digunakan.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein tinggi (16,5% BK) mendekati atau melebihi quinoa, dengan kandungan zat besi dan zinc yang baik.' },
      { type: 'alternatif', icon: '🔄', text: 'Quinoa atau Amaranth Grain sebagai alternatif pseudo-cereal berprotein tinggi yang sedikit lebih mudah diakses.' },
    ],
  },

};

// ─── Accessor Functions ───────────────────────────────────────────────────────

export function getSerealiaDetail(id: string): SerealiaDetailFields | undefined {
  return SEREALIA_DETAIL[id];
}

export function getSerealiaDetailItem(id: string): SerealiaDetailItem | undefined {
  const base = getSerealiaById(id);
  const detail = SEREALIA_DETAIL[id];
  if (!base || !detail) return undefined;
  return { ...base, ...detail };
}

export function getAllSerealiaDetailItems(): SerealiaDetailItem[] {
  return Object.keys(SEREALIA_DETAIL)
    .map(id => getSerealiaDetailItem(id))
    .filter((i): i is SerealiaDetailItem => !!i);
}

export function computeSerealiaRingkasan() {
  const items = getAllSerealiaDetailItems();
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
