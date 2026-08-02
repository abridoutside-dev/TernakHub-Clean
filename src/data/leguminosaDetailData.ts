// ─── MP-009 — Detail Data: Leguminosa ─────────────────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for all 15 leguminosa
// items. Values expressed on dry matter (BK) basis for proximate, TDN, ME, NDF,
// ADF, and minerals, following FAO/NRC convention for leguminosa forages.
// bk field = % dry matter content of fresh material (e.g. 25 → 25% DM, 75% H₂O).
//
// Primary sources:
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi
//     Pakan untuk Indonesia. Gadjah Mada University Press.
//   • NRC (2007). Nutrient Requirements of Small Ruminants.
//   • Feedipedia (2023). INRA-CIRAD-AFZ-FAO Animal Feed Resources.
//   • FAO Feed Resources Database.
//   • Balai Penelitian Ternak Indonesia — Data Pakan Hijauan Tropik.

import { getLeguminosaById, type LeguminosaItem } from './leguminosaData';
import type {
  NutrisiData,
  PenggunaanData,
  HargaData,
  ReferensiData,
  AiInsightItem,
  BentukBahan,
} from './jagungData';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeguminosaDetailFields {
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

export type LeguminosaDetailItem = LeguminosaItem & LeguminosaDetailFields;

// ─── Detail Registry ──────────────────────────────────────────────────────────

const LEGUMINOSA_DETAIL: Record<string, LeguminosaDetailFields> = {

  // ── 1. Lamtoro ──────────────────────────────────────────────────────────────
  'lamtoro': {
    asalBahan: 'Daun muda dan ranting halus pohon Lamtoro yang dipangkas berkala dari tanaman produktif',
    bentuk: ['Segar', 'Kering'],
    asal: 'Amerika Tengah (Meksiko dan Amerika Tengah); telah dinaturalisasi luas di seluruh kawasan tropis Asia',
    habitat: 'Tumbuh optimal di dataran rendah tropik hingga 1.500 mdpl; toleran kekeringan dan lahan marginal; butuh intensitas cahaya penuh',
    umurPanenIdeal: 'Pangkas pertama saat tanaman setinggi 1,5–2 m (±4–6 bulan); rotasi panen berikutnya setiap 6–10 minggu',
    tinggiTanaman: '3–10 m (pohon); dapat dipangkas dan dikelola sebagai perdu 1,5–2 m untuk kemudahan panen',
    produksiHijauan: '20–40 ton BK/ha/tahun pada kondisi optimal; lebih rendah di lahan kering (10–15 ton BK/ha/tahun)',
    kelebihan: 'Protein kasar sangat tinggi (22–28% BK); produktif sepanjang tahun tanpa irigasi; mudah diperbanyak dari biji; memperbaiki nitrogen tanah; multi-manfaat (kayu bakar, pupuk hijau)',
    kekurangan: 'Mengandung mimosin (1–5% BK) — antinutrisi yang menghambat tiroksin; tidak direkomendasikan sebagai pakan tunggal; palatabilitas menurun setelah pangkasan lebat',
    nutrisi: {
      bk: 25, kadarAir: 75,
      pk: 25, sk: 16, lk: 5, abu: 7, betn: 47,
      tdn: 64, me: 2520,
      ndf: 40, adf: 26,
      ca: 1.5, p: 0.25, mg: 0.35, na: 0.02, k: 1.80, cl: null, s: 0.20,
      vitamin: 'Beta-karoten (pro-vitamin A) tinggi pada daun muda; Vitamin C; Vitamin K dari klorofil',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Ca:P rasio 6:1 — Ca berlimpah, perlu perhatian keseimbangan P. Zn ±25 mg/kg, Cu ±8 mg/kg.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Bunting', 'Menyusui', 'Pejantan', 'Grower'],
      musimTerbaik: 'Tersedia sepanjang tahun; produksi puncak pada musim hujan dengan kualitas daun lebih tinggi',
      umurPanenTerbaik: 'Daun muda (pucuk) pada rotasi 6–8 minggu memberikan protein tertinggi (>25% BK)',
      catatan: 'Batasi maksimal 30% dari total ransum untuk menghindari dampak mimosin. Introduksi bertahap selama 2–3 minggu. Sebaiknya dikombinasikan dengan rumput sebagai basis ransum hijauan.',
    },
    harga: {
      estimasiAI: 800, hargaMarketplace: 2000,
      satuan: 'per kg segar', supplier: 'Peternak / kebun hijauan lokal / Koperasi Pakan Ternak',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2007) — Nutrient Requirements of Small Ruminants, National Academies Press',
        'Feedipedia (2023) — Leucaena leucocephala, ruminants, INRA-CIRAD-AFZ-FAO',
        'FAO (2017) — Feed Resources Database — Leucaena leucocephala',
        'Balai Penelitian Ternak Indonesia — Data Komposisi Pakan Hijauan Tropik',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Rata-rata nilai referensi dari Feedipedia, NRC 2007, dan analisis proksimat BALITNAK',
      catatan: 'Nilai nutrisi dapat bervariasi ±15% tergantung umur panen, varietas, lokasi, dan metode analisis. Kadar mimosin bervariasi 1–5% BK.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Lamtoro adalah leguminosa pohon paling populer di Indonesia untuk pakan ruminansia — protein kasar 22–28% BK menjadikannya sumber protein alami yang andal sepanjang tahun, bahkan di lahan kering.' },
      { type: 'kelebihan', icon: '✅', text: 'Produktif tanpa irigasi, tersedia 12 bulan penuh. Memperbaiki kesuburan tanah melalui fiksasi nitrogen. Satu pohon dewasa dapat menghasilkan hijauan untuk 1–2 ekor kambing per hari.' },
      { type: 'peringatan', icon: '🚨', text: 'Mimosin — antinutrisi khas Lamtoro — dapat menyebabkan rambut rontok, penurunan nafsu makan, dan gangguan tiroksin jika dikonsumsi berlebihan. Batasi maksimal 30% ransum dan introduksi bertahap 2–3 minggu.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi ideal: Rumput Gajah/Brachiaria 60–70% + Lamtoro 20–30%. Hasilkan ransum hijauan lengkap tanpa konsentrat protein tambahan untuk pemeliharaan dan pertumbuhan sedang.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Ca tinggi (1,5% BK) dengan P rendah (0,25%) — rasio Ca:P lebar memerlukan suplementasi P dari sumber lain (dedak padi, mineral premix). Tidak mencukupi kebutuhan energi jika diberikan tunggal.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif protein tinggi tanpa mimosin: Indigofera (PK 28%), Gamal (PK 20%), atau Turi (PK 24%). Untuk program sapi perah intensif, tambahkan bungkil kedelai sebagai sumber protein bypass rumen.' },
    ],
  },

  // ── 2. Indigofera ────────────────────────────────────────────────────────────
  'indigofera': {
    asalBahan: 'Daun segar dan batang muda tanaman perdu Indigofera zollingeriana yang dipangkas pada rotasi optimal',
    bentuk: ['Segar', 'Kering'],
    asal: 'Asia Tropis (Asia Tenggara dan Asia Selatan); dikembangkan secara intensif di Indonesia untuk pakan ternak sejak 2010-an',
    habitat: 'Tumbuh baik di dataran rendah hingga 1.000 mdpl; toleran kekeringan moderat; responsif terhadap pemupukan N dan irigasi; suka tanah berdrainase baik',
    umurPanenIdeal: 'Pertama panen saat tanaman setinggi 1–1,5 m (3–4 bulan); rotasi berikutnya setiap 6–8 minggu',
    tinggiTanaman: '1–3 m (perdu); dapat dikelola sebagai tanaman sela atau pagar hidup',
    produksiHijauan: '25–50 ton BK/ha/tahun — termasuk tertinggi di antara leguminosa perdu tropis; sangat responsif terhadap pemupukan',
    kelebihan: 'Protein kasar tertinggi di antara leguminosa perdu (27–29% BK); tidak mengandung mimosin; palatabilitas baik; produksi biomassa tinggi; cepat tumbuh kembali setelah pangkas',
    kekurangan: 'Rentan terhadap genangan air; biji mahal dan sulit didapat; butuh pemupukan rutin untuk mempertahankan produktivitas tinggi; kurang tahan naungan berat',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 28, sk: 14, lk: 4, abu: 8, betn: 46,
      tdn: 68, me: 2720,
      ndf: 35, adf: 24,
      ca: 1.7, p: 0.20, mg: 0.40, na: 0.02, k: 1.95, cl: null, s: 0.22,
      vitamin: 'Kaya beta-karoten dan klorofil; kandungan vitamin relatif tinggi dibanding leguminosa lain',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Ca tinggi (1,7% BK); Zn ±30 mg/kg, Cu ±9 mg/kg. Suplementasi P direkomendasikan.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      musimTerbaik: 'Produksi optimal di musim hujan; tetap produktif di musim kemarau dengan irigasi minimal',
      umurPanenTerbaik: 'Panen pada umur 6–8 minggu setelah pangkas untuk keseimbangan optimal antara kualitas protein dan biomassa',
      catatan: 'Tidak mengandung mimosin sehingga aman hingga 40% ransum. Kombinasikan dengan rumput dan sumber energi untuk ransum seimbang. Keringkan sebagai hay untuk penyimpanan musim kemarau.',
    },
    harga: {
      estimasiAI: 1200, hargaMarketplace: 2500,
      satuan: 'per kg segar', supplier: 'Kebun bibit leguminosa / Koperasi Peternak / Online marketplace pakan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Abdullah, L. (2010) — Herbage Production and Quality of Shrub Indigofera, Media Peternakan',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'Feedipedia (2023) — Indigofera zollingeriana, ruminants',
        'Hassen, A. et al. (2007) — Nutritive value of some Indigofera species, Animal Feed Sci. Tech.',
      ],
      sumberData: 'Data komposisi nutrisi Indigofera zollingeriana dari IPB, BALITNAK, dan Feedipedia',
      catatan: 'Protein kasar dapat bervariasi 24–31% BK tergantung umur panen dan kesuburan tanah. Panen muda (<6 minggu) memberikan PK tertinggi namun biomassa lebih rendah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Indigofera adalah "raja leguminosa perdu" Indonesia — protein kasar 27–29% BK tertinggi di antara semua leguminosa tropis yang dikembangkan secara komersial, tanpa antinutrisi berbahaya seperti mimosin.' },
      { type: 'kelebihan', icon: '✅', text: 'Tidak mengandung mimosin — aman diberikan hingga 40% ransum. Produksi biomassa 25–50 ton BK/ha/tahun merupakan salah satu tertinggi. Cepat pulih setelah pangkas (6–8 minggu rotasi).' },
      { type: 'kekurangan', icon: '⚠️', text: 'Rentan genangan air dan naungan berat. Biji relatif mahal dan sulit didapat. P hanya 0,2% BK — selalu tambahkan sumber P (dedak padi, mineral premix) untuk ternak laktasi dan tumbuh.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi terbaik: Indigofera 30–40% + Rumput Gajah 50–60% + Mineral Premix. Untuk sapi perah intensif: tambahkan dedak padi atau bungkil kelapa untuk menutup kebutuhan energi dan P.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan panen terlalu muda (<4 minggu) secara konsisten — melemahkan tanaman dan mengurangi produktivitas jangka panjang. Pastikan aerasi tanah baik untuk mencegah busuk akar.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika benih tidak tersedia: Lamtoro (tersedia lebih luas, PK 25%) atau Gamal (sangat adaptif). Indigofera adalah investasi jangka panjang — hasilnya sepadan setelah tanaman mapan (tahun ke-2+).' },
    ],
  },

  // ── 3. Kaliandra ─────────────────────────────────────────────────────────────
  'kaliandra': {
    asalBahan: 'Daun, ranting muda, dan bunga tanaman perdu Kaliandra yang dipangkas pada rotasi teratur',
    bentuk: ['Segar', 'Kering'],
    asal: 'Amerika Tengah dan Selatan (Meksiko, Guatemala, Kosta Rika); naturalisasi di Asia Tenggara, termasuk Indonesia',
    habitat: 'Adaptif di ketinggian 100–2.400 mdpl; toleran tanah miskin dan masam; tahan kekeringan; tumbuh baik di lereng dan lahan terdegradasi',
    umurPanenIdeal: 'Rotasi panen setiap 8–12 minggu untuk tanaman mapan; panen pertama saat tinggi 1,5–2 m (4–6 bulan)',
    tinggiTanaman: '2–5 m (perdu bercabang lebat); dipangkas setinggi 50–75 cm untuk stimulasi tunas baru',
    produksiHijauan: '15–30 ton BK/ha/tahun; lebih rendah dari Lamtoro dan Indigofera tetapi sangat stabil di lahan marginal',
    kelebihan: 'Mengandung tanin terkondensasi (3–7% BK) yang berfungsi sebagai bypass protein alami di rumen; adaptif di lahan terdegradasi; berbunga sepanjang tahun (menarik lebah); tidak mengandung mimosin',
    kekurangan: 'Tanin tinggi dapat membatasi kecernaan jika terlalu banyak; palatabilitas lebih rendah dibanding Lamtoro dan Indigofera; tumbuh lebih lambat pada tahun pertama',
    nutrisi: {
      bk: 24, kadarAir: 76,
      pk: 21, sk: 21, lk: 4, abu: 6, betn: 48,
      tdn: 60, me: 2400,
      ndf: 47, adf: 31,
      ca: 1.2, p: 0.20, mg: 0.30, na: 0.02, k: 1.50, cl: null, s: 0.18,
      vitamin: 'Beta-karoten; flavonoid dan polifenol tinggi dari tanin terkondensasi yang bersifat antioksidan',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Tanin terkondensasi 3–7% BK berperan sebagai bypass protein alami di rumen — keunggulan unik Kaliandra.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Bunting', 'Menyusui', 'Pejantan'],
      musimTerbaik: 'Produksi relatif stabil sepanjang tahun; sedikit menurun di musim kemarau panjang',
      umurPanenTerbaik: 'Panen pada rotasi 8–10 minggu; daun muda lebih palatable dan kadar tanin lebih rendah',
      catatan: 'Batasi 20–25% ransum untuk menghindari efek negatif tanin pada kecernaan serat. Sangat efektif sebagai sumber bypass protein untuk sapi perah dan penggemukan intensif. Kombinasikan dengan PEG (polyethylene glycol) jika tanin terlalu tinggi.',
    },
    harga: {
      estimasiAI: 600, hargaMarketplace: 1200,
      satuan: 'per kg segar', supplier: 'Peternak lokal / Kebun leguminosa / Koperasi',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Calliandra calothyrsus, ruminants, INRA-CIRAD-AFZ-FAO',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'Stewart, J.L. (1994) — Calliandra calothyrsus: An Agroforestry Tree for Humid Regions, Oxford Forestry Institute',
        'Laar, A. van & Akça, A. (2007) — Forest Mensuration (referensi produksi)',
        'FAO (2017) — Feed Resources Database — Calliandra calothyrsus',
      ],
      sumberData: 'Feedipedia, FAO, dan analisis proksimat Kaliandra dari lahan tropis Indonesia',
      catatan: 'Kadar tanin terkondensasi bervariasi 3–7% BK tergantung umur panen dan kondisi tanah. Protein bypass dapat mencapai 50–60% dari total protein.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Kaliandra memiliki keistimewaan unik: tanin terkondensasi (3–7% BK) yang bekerja sebagai bypass protein alami di rumen. Protein yang lolos dari degradasi rumen langsung tersedia di usus kecil — meningkatkan efisiensi penggunaan protein.' },
      { type: 'kelebihan', icon: '✅', text: 'Adaptif di lahan terdegradasi, masam, dan kering yang tidak bisa ditanami leguminosa lain. Tidak mengandung mimosin. Bunga menarik serangga penyerbuk — cocok untuk sistem agroforestri lebah madu.' },
      { type: 'peringatan', icon: '🚨', text: 'Tanin tinggi (>7% BK pada panen terlambat) bisa menghambat kecernaan serat dan mengurangi konsumsi. Batasi 20–25% ransum. Jangan panen terlalu tua (>12 minggu) — tanin semakin pekat.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi efektif: Kaliandra 20% + Gamal/Lamtoro 15% + Rumput 65%. Untuk sapi perah: Kaliandra sebagai sumber bypass protein + Indigofera sebagai sumber protein rumen-degradable.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Palatabilitas lebih rendah dari Lamtoro dan Indigofera — ternak perlu 1–2 minggu adaptasi. P rendah (0,2% BK) membutuhkan suplementasi. TDN 60% — tambahkan sumber energi untuk penggemukan intensif.' },
      { type: 'alternatif', icon: '🔄', text: 'Di lahan subur: Indigofera (PK lebih tinggi, palatabilitas lebih baik) lebih efisien. Di lahan marginal/masam: Kaliandra tidak tertandingi. Untuk bypass protein tanpa tanin: campurkan protein heat-treated.' },
    ],
  },

  // ── 4. Gamal ─────────────────────────────────────────────────────────────────
  'gamal': {
    asalBahan: 'Daun segar dan ranting muda pohon Gamal yang dipangkas pada rotasi teratur; dapat digunakan segar atau dilayukan',
    bentuk: ['Segar', 'Kering'],
    asal: 'Amerika Tengah (Meksiko, Guatemala, El Salvador, Honduras); naturalisasi luas di Asia Tropis termasuk Indonesia',
    habitat: 'Dataran rendah tropis 0–1.600 mdpl; sangat toleran kekeringan; tumbuh di berbagai jenis tanah termasuk lahan miskin; toleran naungan parsial',
    umurPanenIdeal: 'Rotasi pangkas setiap 8–12 minggu; panen pertama saat pohon berumur 4–6 bulan',
    tinggiTanaman: '3–10 m; dipangkas dan dikelola setinggi 1,5–2 m untuk kemudahan panen dan stimulasi tunas lateral',
    produksiHijauan: '20–35 ton BK/ha/tahun pada kondisi optimal; stabil bahkan di musim kemarau panjang',
    kelebihan: 'Sangat toleran kekeringan (salah satu terbaik di antara leguminosa pohon); multifungsi sebagai pagar hidup, peneduh, dan pupuk hijau; tidak mengandung mimosin; palatabilitas baik',
    kekurangan: 'Mengandung coumarin (bau seperti vanila) yang mengurangi palatabilitas awal; beberapa spesies mengandung kumatat yang sedikit toksik jika dikonsumsi berlebihan tanpa adaptasi',
    nutrisi: {
      bk: 25, kadarAir: 75,
      pk: 20, sk: 17, lk: 5.5, abu: 8.5, betn: 49,
      tdn: 65, me: 2600,
      ndf: 41, adf: 27,
      ca: 1.3, p: 0.25, mg: 0.32, na: 0.03, k: 1.70, cl: null, s: 0.19,
      vitamin: 'Beta-karoten; Vitamin C; Vitamin K dari klorofil; kandungan fenol yang bersifat antioksidan',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Ca:P = 5,2:1; suplementasi P direkomendasikan untuk ternak produktif.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      musimTerbaik: 'Tersedia sepanjang tahun; produksi di musim kemarau menjadi keunggulan utama Gamal dibanding rumput',
      umurPanenTerbaik: 'Panen muda (6–8 minggu) memberikan palatabilitas terbaik; daun tua lebih pahit karena coumarin',
      catatan: 'Layukan 12–24 jam sebelum diberikan untuk mengurangi bau coumarin dan meningkatkan palatabilitas. Aman hingga 40% ransum setelah ternak beradaptasi. Sangat baik sebagai pagar hidup di antara rumput paddock.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 900,
      satuan: 'per kg segar', supplier: 'Petani pemilik pagar hidup / Kebun Gamal lokal',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Gliricidia sepium, ruminants, INRA-CIRAD-AFZ-FAO',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'Simons, A.J. & Stewart, J.L. (1994) — Gliricidia sepium — A Multipurpose Forage Tree, Oxford Forestry Institute',
        'FAO (2017) — Feed Resources Database — Gliricidia sepium',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia, FAO, dan data komposisi nutrisi Gamal dari BALITNAK Indonesia',
      catatan: 'Nilai nutrisi dapat bervariasi ±10% tergantung umur panen, musim, dan kondisi tanah. Bau coumarin berkurang signifikan setelah dilayukan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Gamal adalah leguminosa pohon paling adaptif untuk kondisi kering — protein 20% BK tersedia bahkan di musim kemarau saat rumput mengering. Sangat strategis sebagai sumber hijauan cadangan di daerah beriklim kering.' },
      { type: 'kelebihan', icon: '✅', text: 'Toleransi kekeringan terbaik di antara leguminosa pohon — bertahan dan produktif saat hijauan lain gagal. Multifungsi: pagar hidup, peneduh ternak, dan pupuk hijau yang memperbaiki tanah secara pasif.' },
      { type: 'peringatan', icon: '🚨', text: 'Coumarin menyebabkan bau khas yang membuat ternak menolak di awal. Layukan 12–24 jam sebelum diberikan dan introduksi bertahap. Daun tua (>12 minggu) jauh lebih pahit — panen muda selalu.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi optimal: Gamal 25–35% + Rumput (Gajah/Brachiaria) 55–65% + Mineral Premix. Di daerah kering: campurkan dengan jerami padi yang diurea-treatment untuk memperkaya serat berkualitas.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein 20% BK — lebih rendah dari Indigofera dan Lamtoro. Palatabilitas awal kurang baik karena coumarin. P 0,25% BK — suplementasi fosfor penting untuk ternak laktasi dan bunting.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk protein lebih tinggi: Indigofera atau Lamtoro. Untuk palatabilitas lebih baik: Turi. Namun untuk daerah dengan curah hujan <800 mm/tahun, Gamal hampir tidak tergantikan sebagai sumber protein hijau.' },
    ],
  },

  // ── 5. Turi ──────────────────────────────────────────────────────────────────
  'turi': {
    asalBahan: 'Daun muda, bunga, dan ranting halus pohon Turi yang dipangkas secara berkala',
    bentuk: ['Segar', 'Kering'],
    asal: 'Asia Tropis (Asia Selatan dan Asia Tenggara); tumbuh alami di India, Sri Lanka, Asia Tenggara termasuk Indonesia',
    habitat: 'Dataran rendah 0–1.200 mdpl; toleran genangan air sementara; tumbuh cepat di tanah lembab dan subur; suka intensitas cahaya penuh',
    umurPanenIdeal: 'Rotasi pangkas setiap 6–10 minggu; sangat cepat tumbuh kembali setelah pangkas',
    tinggiTanaman: '3–10 m; dapat dipangkas setinggi 1–1,5 m untuk kemudahan panen dan produksi daun yang lebih lebat',
    produksiHijauan: '20–40 ton BK/ha/tahun; tumbuh sangat cepat sehingga dapat dipanen lebih awal dari leguminosa lain',
    kelebihan: 'Pertumbuhan sangat cepat (salah satu leguminosa pohon tercepat); daun dan bunga edible (dapat dikonsumsi manusia dan ternak); protein 22–26% BK; palatabilitas baik',
    kekurangan: 'Toleransi terhadap kekeringan lebih rendah dibanding Gamal dan Lamtoro; hidup relatif pendek (5–10 tahun); dapat menjadi invasif di lahan basah',
    nutrisi: {
      bk: 23, kadarAir: 77,
      pk: 24, sk: 15, lk: 5, abu: 8.5, betn: 47.5,
      tdn: 66, me: 2640,
      ndf: 36, adf: 24,
      ca: 1.7, p: 0.30, mg: 0.35, na: 0.03, k: 1.85, cl: null, s: 0.21,
      vitamin: 'Sangat kaya beta-karoten (pro-vitamin A); Vitamin C tinggi pada bunga segar; Vitamin K',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Ca:P lebih seimbang dibanding Lamtoro (5,7:1). Zn ±28 mg/kg, Cu ±9 mg/kg.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 35,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      musimTerbaik: 'Produksi optimal di musim hujan; butuh irigasi minimal di musim kemarau panjang',
      umurPanenTerbaik: 'Panen muda pada rotasi 6–8 minggu untuk protein dan palatabilitas optimal',
      catatan: 'Salah satu leguminosa dengan keseimbangan nutrisi terbaik. Dapat diberikan segar langsung tanpa layuan. Bunga dapat dijadikan suplemen vitamin alami untuk ternak pedet dan kambing muda.',
    },
    harga: {
      estimasiAI: 700, hargaMarketplace: 1500,
      satuan: 'per kg segar', supplier: 'Petani / Kebun leguminosa lokal / Pasar tradisional',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Sesbania grandiflora, ruminants, INRA-CIRAD-AFZ-FAO',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'FAO (2017) — Feed Resources Database — Sesbania grandiflora',
        'Salam, S.M. et al. (1993) — Sesbania grandiflora as a Multi-purpose Tree Legume, Nitrogen Fixing Tree Assoc.',
      ],
      sumberData: 'Feedipedia, FAO, dan referensi komposisi Turi dari Asia Tenggara',
      catatan: 'Nilai nutrisi bervariasi ±10% tergantung umur pangkas dan kondisi tanah. Bunga mengandung nutrisi lebih tinggi dari daun.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Turi adalah leguminosa pohon dengan pertumbuhan tercepat — dapat dipanen hanya 6–8 minggu setelah pangkas, memberikan protein 22–26% BK. Ideal untuk peternak yang butuh protein tinggi dengan investasi waktu singkat.' },
      { type: 'kelebihan', icon: '✅', text: 'Daun dan bunga keduanya bernilai pakan tinggi (bunga lebih kaya beta-karoten). Palatabilitas baik dari awal tanpa perlu layuan khusus. Pertumbuhan cepat = rotasi panen lebih sering = protein lebih banyak per tahun.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi ideal untuk sapi perah: Turi 25–30% + Rumput Odot/Gajah 60% + Dedak Halus 10–15%. Beta-karoten dari Turi mendukung fertilitas dan kualitas susu. Baik juga dikombinasikan dengan Gamal untuk musim kemarau.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kurang toleran kekeringan — produksi menurun signifikan saat curah hujan <600 mm. Umur tanaman relatif pendek (5–10 tahun) — perlu replanting berkala. P 0,30% BK cukup baik tapi tetap perlu pemantauan untuk ternak laktasi intensif.' },
      { type: 'peringatan', icon: '🚨', text: 'Pertumbuhan cepat membuat Turi berpotensi invasif di lahan basah dan tepi sungai. Kontrol penyebaran biji jika ditanam dekat habitat sensitif. Batasi 30–35% ransum meskipun tidak ada antinutrisi serius.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk area kering: gantikan dengan Gamal yang lebih toleran. Untuk protein lebih tinggi: tambahkan Indigofera (PK 28%). Turi paling tepat untuk daerah lembab dengan kebutuhan hijauan protein tinggi secara cepat.' },
    ],
  },

  // ── 6. Daun Kelor ─────────────────────────────────────────────────────────────
  'daun-kelor': {
    asalBahan: 'Daun segar pohon Kelor (Moringa oleifera) yang dipangkas dari tanaman produktif; pucuk dan daun muda diutamakan',
    bentuk: ['Segar', 'Kering', 'Tepung'],
    asal: 'Asia Selatan (India, Pakistan, Bangladesh); naturalisasi luas di seluruh kawasan tropis dan subtropis dunia',
    habitat: 'Dataran rendah 0–1.000 mdpl; sangat toleran kekeringan (akar dalam); tumbuh di hampir semua jenis tanah termasuk yang sangat miskin; suka panas dan sinar matahari penuh',
    umurPanenIdeal: 'Panen pucuk dan daun muda setiap 4–6 minggu; pohon dapat dipangkas berat untuk produksi daun maksimal',
    tinggiTanaman: '3–12 m (pohon); dipangkas setinggi 1–1,5 m untuk panen daun yang mudah dan produksi tinggi',
    produksiHijauan: '15–30 ton BK/ha/tahun daun; sangat tinggi dibandingkan ukuran pohon; responsif terhadap irigasi',
    kelebihan: 'Disebut "pohon ajaib" — kaya protein (25–27% BK), Ca (2,0–3,5% BK), beta-karoten, vitamin C, Fe, Zn; antioksidan tinggi; seluruh bagian pohon bermanfaat',
    kekurangan: 'Ca sangat tinggi (2,7% BK) dapat mengganggu keseimbangan kation-anion ransum; harga relatif mahal; belum banyak dibudidayakan secara komersial untuk pakan ternak',
    nutrisi: {
      bk: 25, kadarAir: 75,
      pk: 26, sk: 11, lk: 6.5, abu: 9, betn: 47.5,
      tdn: 70, me: 2800,
      ndf: 26, adf: 17,
      ca: 2.7, p: 0.40, mg: 0.45, na: 0.08, k: 1.50, cl: null, s: 0.25,
      vitamin: 'Sangat kaya beta-karoten (±440 μg/g BK), Vitamin C (220 mg/100g BK), Vitamin E, Vitamin K, Vitamin B kompleks. Salah satu tanaman dengan profil vitamin terlengkap.',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Ca sangat tinggi (2,7% BK) — perhatikan keseimbangan kation-anion. Fe ±270 mg/kg, Zn ±28 mg/kg, Cu ±8 mg/kg — mineral mikro terlengkap.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Perah', 'Kambing Perah', 'Kambing', 'Domba'],
      programCocok: ['Menyusui', 'Bunting', 'Grower', 'Indukan'],
      musimTerbaik: 'Tersedia sepanjang tahun; produksi optimal di musim kemarau saat hijauan lain langka',
      umurPanenTerbaik: 'Daun muda (pucuk + 3 lembar daun) mengandung nutrisi tertinggi; panen setiap 4–6 minggu',
      catatan: 'Batasi 15–20% ransum karena Ca sangat tinggi dapat mengganggu keseimbangan DCAD (Dietary Cation-Anion Difference). Sangat direkomendasikan sebagai suplemen nutrisi premium untuk sapi perah dan indukan. Tepung daun kelor dapat dicampur konsentrat.',
    },
    harga: {
      estimasiAI: 3000, hargaMarketplace: 8000,
      satuan: 'per kg segar', supplier: 'Kebun Moringa / Toko herbal / Online marketplace',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Anwar, F. et al. (2007) — Moringa oleifera: A Food Plant with Multiple Medicinal Uses, Phytother. Res.',
        'Makkar, H.P.S. & Becker, K. (1996) — Nutritional Value and Antinutritional Components of Moringa leaves, Animal Feed Sci. Tech.',
        'Feedipedia (2023) — Moringa oleifera, ruminants',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'FAO (2017) — Moringa oleifera — A Review of Uses and Nutritional Composition',
      ],
      sumberData: 'Rata-rata analisis proksimat dari Feedipedia, FAO, dan publikasi ilmiah internasional',
      catatan: 'Beta-karoten dan vitamin C sangat sensitif terhadap panas dan cahaya — berikan segar untuk manfaat vitamin optimal. Tepung kelor kehilangan ±50% vitamin C dalam proses pengeringan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun Kelor adalah "suplemen nutrisi premium" dari alam — protein 26% BK, Ca 2,7% BK, Fe 270 mg/kg, beta-karoten 440 μg/g BK. Tidak ada leguminosa lain yang memiliki profil mikronutrien selengkap ini.' },
      { type: 'kelebihan', icon: '✅', text: 'Vitamin lengkap (A, C, E, K, B-kompleks) + mineral makro dan mikro dalam satu tanaman. Palatabilitas sangat baik dari awal. Sangat efektif meningkatkan fertilitas, produksi susu, dan kualitas kolostrum indukan.' },
      { type: 'peringatan', icon: '🚨', text: 'Ca sangat tinggi (2,7% BK) — jangan berikan >20% ransum. Ca berlebih dapat mengganggu DCAD (keseimbangan kation-anion), terutama pada sapi perah pra-partus yang membutuhkan Ca rendah.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan sebagai suplemen (10–20%): Rumput 65% + Kelor 15% + Indigofera/Gamal 20%. Untuk sapi perah produksi tinggi: tambahkan bungkil kedelai untuk protein bypass dan jagung giling untuk energi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga per kg tertinggi di antara leguminosa lokal. Belum banyak peternak yang membudidayakannya khusus untuk pakan ternak. P 0,4% BK relatif baik, namun Ca:P = 6,75:1 terlalu lebar untuk ransum seimbang jika diberikan banyak.' },
      { type: 'alternatif', icon: '🔄', text: 'Sebagai sumber protein: Indigofera atau Turi lebih ekonomis. Sebagai sumber mikronutrien premium tidak ada alternatif sejenis. Tepung kelor (5–10% konsentrat) adalah cara paling efisien menggunakan Kelor untuk ternak perah intensif.' },
    ],
  },

  // ── 7. Daun Singkong ──────────────────────────────────────────────────────────
  'daun-singkong': {
    asalBahan: 'Daun dan batang muda tanaman singkong (Manihot esculenta) — hasil samping budidaya ubi kayu yang dipanen sebelum atau saat pemanenan umbi',
    bentuk: ['Segar', 'Kering'],
    asal: 'Amerika Selatan (Brasil, Amerika Tengah); naturalisasi luas di seluruh kawasan tropis sebagai tanaman pangan strategis',
    habitat: 'Dataran rendah 0–1.800 mdpl; adaptif di berbagai jenis tanah; toleran kekeringan; kurang tahan genangan air; tumbuh subur di iklim tropis panas',
    umurPanenIdeal: 'Daun dipanen pada umur tanaman 3–6 bulan (saat tanaman singkong dipanen umbinya); atau daun muda dipanen berkala setiap 4–8 minggu dari tanaman yang dipertahankan',
    tinggiTanaman: '1,5–4 m (tanaman singkong normal); dapat dipangkas untuk mendorong produksi daun',
    produksiHijauan: '10–25 ton BK/ha/tahun daun + batang muda; tersedia melimpah dari lahan pertanian singkong',
    kelebihan: 'Tersedia berlimpah dan murah sebagai hasil samping panen singkong; protein 15–22% BK — lebih tinggi dari kebanyakan rumput tropis; mudah dikeringkan dan disimpan',
    kekurangan: 'Mengandung HCN (asam sianida) — terutama daun muda dan varietas pahit; WAJIB dilayukan 24–48 jam atau dikukus sebelum diberikan ke ternak; tidak aman diberikan segar dalam jumlah besar',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 18, sk: 15, lk: 6, abu: 8.5, betn: 52.5,
      tdn: 63, me: 2500,
      ndf: 47, adf: 31,
      ca: 1.1, p: 0.30, mg: 0.28, na: 0.03, k: 1.60, cl: null, s: 0.20,
      vitamin: 'Kaya beta-karoten dan vitamin C (segar); kandungan HCN bervariasi 50–1.000 mg/kg segar tergantung varietas',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). PERHATIAN: HCN harus direduksi dengan pelayuan atau pemasakan sebelum pemberian. Kadar HCN aman: <100 ppm bahan segar.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower', 'Pejantan'],
      musimTerbaik: 'Tersedia melimpah saat musim panen singkong (biasanya 2 kali setahun); dapat dikeringkan sebagai cadangan',
      umurPanenTerbaik: 'Daun dari tanaman singkong berumur 3–4 bulan memiliki HCN lebih rendah dan protein lebih tinggi',
      catatan: 'WAJIB: layukan daun segar 24–48 jam di tempat teduh (atau kukus 15 menit) sebelum diberikan ke ternak untuk menurunkan HCN ke level aman (<100 ppm). Jangan berikan daun segar dalam jumlah besar tanpa pre-treatment.',
    },
    harga: {
      estimasiAI: 500, hargaMarketplace: 1500,
      satuan: 'per kg segar', supplier: 'Petani singkong lokal / Pabrik tapioka (hasil samping)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Manihot esculenta, leaves, ruminants, INRA-CIRAD-AFZ-FAO',
        'FAO (1993) — Cassava Leaves as Animal Fodder, Production and Use',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'Fasuyi, A.O. et al. (2005) — Nutritional Potentials of Cassava Leaf Meal as Protein Supplement',
      ],
      sumberData: 'Feedipedia, FAO, dan analisis proksimat daun singkong Indonesia',
      catatan: 'HCN bervariasi sangat lebar (50–1.000 ppm segar) tergantung varietas. Varietas manis (<150 ppm HCN) jauh lebih aman. Pelayuan 24–48 jam mengurangi HCN 70–90%.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun Singkong adalah hasil samping pertanian singkong yang sangat melimpah di Indonesia — protein 18% BK, tersedia murah saat musim panen, ideal sebagai suplemen protein lokal untuk sapi potong dan kambing.' },
      { type: 'peringatan', icon: '🚨', text: 'WAJIB LAYUKAN 24–48 JAM sebelum diberikan ke ternak. HCN (asam sianida) di daun segar bisa mencapai 1.000 ppm pada varietas pahit — ini level berbahaya. Layukan di tempat teduh, bukan dijemur (UV membantu tapi tidak cukup cepat).' },
      { type: 'kelebihan', icon: '✅', text: 'Sangat ekonomis — biasanya gratis dari petani singkong yang tidak memanfaatkan daunnya. Protein 18% BK lebih tinggi dari semua rumput tropis. Mudah dikeringkan dan disimpan sebagai hay musim kemarau.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi efektif: Daun Singkong (dilayukan) 20–25% + Rumput 65–70% + Dedak Padi 10%. Untuk penggemukan: tambahkan jagung giling untuk energi. Keringkan sebagai hay untuk penyimpanan 6+ bulan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'HCN adalah risiko nyata jika tidak di-pre-treatment. P 0,3% BK relatif baik, tapi Ca:P = 3,7:1 masih perlu suplementasi Ca untuk ternak bunting. Tidak cocok untuk sapi perah laktasi intensif sebagai pakan utama.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk protein tinggi tanpa risiko HCN: Indigofera atau Turi. Daun Singkong paling tepat sebagai protein suplemen murah di daerah sentra singkong. Nilai ekonominya tidak tertandingi di wilayah tersebut.' },
    ],
  },

  // ── 8. Alfalfa ────────────────────────────────────────────────────────────────
  'alfalfa': {
    asalBahan: 'Alfalfa hay (jerami Alfalfa kering) yang diimpor dari Amerika Serikat, Australia, atau Eropa; sesekali tersedia dalam bentuk pellet atau tepung',
    bentuk: ['Kering', 'Pellet'],
    asal: 'Asia Tengah (Iran, Afghanistan, wilayah Mediterania); dikembangkan secara komersial di Amerika Utara, Australia, dan Eropa sebagai tanaman pakan utama',
    habitat: 'Iklim sedang hingga subtropis kering; membutuhkan tanah berdrainase baik dan pH 6,5–7,5; tidak cocok untuk iklim tropis lembab Indonesia (umumnya diimpor sebagai hay)',
    umurPanenIdeal: 'Di negara produsen: dipotong pada fase 10% pembungaan setiap 28–35 hari (3–4 panen/musim tanam)',
    tinggiTanaman: '60–90 cm saat siap panen; tanaman tahunan yang produktif 5–10 tahun',
    produksiHijauan: '15–25 ton BK/ha/tahun (di negara produsen dengan irigasi); tidak dapat dibudidayakan secara ekonomis di Indonesia',
    kelebihan: 'Disebut "Ratu Tanaman Pakan" dunia — protein 18% BK, Ca tinggi, kaya vitamin (A, D, E, K, B-kompleks); kualitas hay sangat konsisten; ideal untuk sapi perah produksi tinggi',
    kekurangan: 'Harga sangat mahal karena harus diimpor (Rp 12.000–20.000/kg hay); tidak dapat dibudidayakan di iklim tropis lembab; risiko bloat pada ruminansia jika diberikan terlalu banyak',
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 18, sk: 27, lk: 3, abu: 10, betn: 42,
      tdn: 57, me: 2280,
      ndf: 47, adf: 34,
      ca: 1.4, p: 0.27, mg: 0.35, na: 0.10, k: 2.10, cl: null, s: 0.25,
      vitamin: 'Kaya Vitamin A (beta-karoten ±220 μg/g BK), Vitamin D (hay terjemur), Vitamin E, Vitamin K, Vitamin B-kompleks. Profil vitamin terlengkap di antara semua leguminosa.',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Ca:P = 5,2:1. K tinggi (2,1% BK) — perhatikan DCAD untuk sapi perah pra-partus. Fe ±200 mg/kg, Zn ±22 mg/kg.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 50,
      targetTernak: ['Sapi Perah', 'Kambing Perah', 'Domba'],
      programCocok: ['Menyusui', 'Bunting', 'Grower', 'Indukan'],
      musimTerbaik: 'Tersedia sepanjang tahun sebagai hay impor (tidak tergantung musim Indonesia)',
      umurPanenTerbaik: 'Hay berkualitas Premium (Grade 1): protein ≥20%, NDF ≤40%; Mid-Grade: protein 17–19%; Budget: protein 15–16%',
      catatan: 'Gunakan sebagai sumber protein dan vitamin premium untuk sapi perah dan kambing perah. Batasi 40–50% ransum untuk mencegah bloat. Harga mahal — hitung efisiensi biaya vs. output susu sebelum digunakan dalam jumlah besar.',
    },
    harga: {
      estimasiAI: 12000, hargaMarketplace: 20000,
      satuan: 'per kg hay', supplier: 'Importir pakan ternak / Distributor hay / Toko pakan premium',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2001) — Nutrient Requirements of Dairy Cattle, 7th Ed., National Academies Press',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'Feedipedia (2023) — Medicago sativa, hay, ruminants, INRA-CIRAD-AFZ-FAO',
        'Undersander, D. et al. (2011) — Alfalfa for Grazing and Hay, University of Wisconsin Extension',
      ],
      sumberData: 'Nilai nutrisi Alfalfa hay grade Premium berdasarkan standar NFOQA (National Forage Quality Award) dan Feedipedia',
      catatan: 'Kualitas hay sangat bervariasi (Grade 1–4). Selalu minta hasil analisis nutrisi (lab report) dari pemasok. Grade 1: PK ≥19%, RFV ≥185; Grade 4: PK <15%, RFV <103.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Alfalfa hay adalah gold standard pakan ruminansia dunia — protein 18% BK, vitamin A/D/E/K lengkap, Ca tinggi. Satu-satunya leguminosa yang diimpor secara masif ke Indonesia untuk sapi perah produksi tinggi.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas sangat baik dari awal tanpa adaptasi. Kualitas konsisten (tersedia dalam grade 1–4). Kaya vitamin — mengurangi kebutuhan vitamin premix tambahan. Mendukung produksi susu 20–30+ liter/hari.' },
      { type: 'peringatan', icon: '🚨', text: 'Harga tertinggi di antara semua leguminosa (Rp 12.000–20.000/kg hay). Risiko bloat jika diberikan ke ruminansia yang belum beradaptasi atau diberikan terlalu banyak. K tinggi (2,1% BK) — perhatikan DCAD untuk sapi pra-partus.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi standar sapi perah: Alfalfa hay 30–40% + Jerami Padi 20–30% + Konsentrat 30–40%. Untuk efisiensi biaya: campur Alfalfa Grade 2 dengan Gamal/Indigofera lokal untuk mendapatkan profil protein serupa.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tidak dapat dibudidayakan di Indonesia — 100% bergantung impor, rentan fluktuasi kurs dan harga. P 0,27% BK perlu suplementasi untuk produksi susu tinggi. Ca:P = 5,2:1 masih perlu balancing P.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif protein lokal berkualitas tinggi: Indigofera (PK 28%, tanpa impor) + suplemen vitamin premix. Untuk protein 18% lokal: Gamal 25% + Lamtoro 20% + Rumput 55% mendekati profil nutrisi Alfalfa dengan biaya jauh lebih rendah.' },
    ],
  },

  // ── 9. Centro ─────────────────────────────────────────────────────────────────
  'centro': {
    asalBahan: 'Daun dan batang muda tanaman merambat Centro yang dipanen dari padang penggembalaan campuran atau lahan cover crop',
    bentuk: ['Segar', 'Kering'],
    asal: 'Amerika Tengah dan Karibia; naturalisasi luas di kawasan tropis sebagai tanaman cover crop dan pakan',
    habitat: 'Dataran rendah 0–1.000 mdpl; toleran naungan (cocok untuk lahan di bawah pohon kelapa sawit dan karet); tahan pada tanah masam dan miskin hara',
    umurPanenIdeal: 'Dipanen bersamaan dengan rumput dalam sistem padang penggembalaan; biomassa terbaik saat fase vegetatif aktif (sebelum pembungaan massal)',
    tinggiTanaman: 'Merambat 2–5 m secara horizontal; tinggi tegak hanya 30–60 cm; melilit tanaman atau pohon di sekitarnya',
    produksiHijauan: '3–8 ton BK/ha/tahun sebagai tanaman campuran dengan rumput; produksi murni lebih tinggi tetapi jarang ditanam monokultur',
    kelebihan: 'Toleran naungan berat — satu-satunya leguminosa yang produktif di bawah kelapa sawit dan karet; memperbaiki kesuburan tanah; tahan tanah masam; tidak perlu pemangkasan khusus',
    kekurangan: 'Produksi hijauan lebih rendah dari leguminosa pohon; dapat melilit dan mengganggu tanaman perkebunan jika tidak dikontrol; tidak cocok sebagai pakan tunggal',
    nutrisi: {
      bk: 22, kadarAir: 78,
      pk: 16, sk: 27, lk: 3, abu: 8, betn: 46,
      tdn: 57, me: 2200,
      ndf: 52, adf: 35,
      ca: 1.2, p: 0.25, mg: 0.28, na: 0.02, k: 1.40, cl: null, s: 0.18,
      vitamin: 'Beta-karoten moderat; Vitamin C segar; klorofil tinggi pada daun muda',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Ca:P = 4,8:1. Profil mineral cukup untuk pemeliharaan dasar.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      musimTerbaik: 'Produksi relatif stabil sepanjang tahun di bawah naungan; lebih baik di musim hujan',
      umurPanenTerbaik: 'Panen pada fase vegetatif sebelum berbunga (biasanya ±8–10 minggu pertumbuhan)',
      catatan: 'Paling tepat digunakan sebagai komponen hijauan dalam sistem penggembalaan campuran dengan rumput. Tidak tersedia secara komersial dalam jumlah besar — biasanya dipanen dari padang penggembalaan sendiri.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 700,
      satuan: 'per kg segar', supplier: 'Peternak dengan padang penggembalaan campuran / Bibit dari BPTU/BPTP',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Centrosema pubescens, ruminants, INRA-CIRAD-AFZ-FAO',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'FAO (2017) — Feed Resources Database — Centrosema pubescens',
        'Boonman, J.G. (1993) — East Africa s Grasses and Fodders, Kluwer Academic Publishers',
      ],
      sumberData: 'Feedipedia, FAO, dan data padang penggembalaan campuran Asia Tenggara',
      catatan: 'Nilai nutrisi sangat bervariasi tergantung proporsi daun vs. batang. Daun mengandung 2–3× lebih banyak protein dibanding batang.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Centro adalah leguminosa cover crop terbaik untuk sistem agroforestri — toleran naungan berat di bawah kelapa sawit dan karet. Kontribusinya bukan dari produksi besar, tapi dari ketersediaan protein 16% BK secara pasif di padang penggembalaan.' },
      { type: 'kelebihan', icon: '✅', text: 'Satu-satunya leguminosa pakan yang tumbuh produktif di bawah naungan berat. Memperbaiki kesuburan tanah otomatis. Tidak perlu investasi pemangkasan — ternak merumput langsung dari padang campuran.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Produksi rendah jika dibandingkan leguminosa pohon — tidak bisa jadi sumber protein utama. Kandungan serat cukup tinggi (NDF 52%, ADF 35%). Tidak tersedia secara komersial — harus ditanam sendiri.' },
      { type: 'kombinasi', icon: '🔗', text: 'Sistem ideal: Brachiaria/Rumput Setaria 70% + Centro 20–30% sebagai campuran padang penggembalaan. Centro secara alami meningkatkan protein ransum ternak yang merumput dari rata-rata 8% (rumput saja) menjadi 12–14% BK.' },
      { type: 'peringatan', icon: '🚨', text: 'Kontrol pertumbuhan Centro di perkebunan kelapa sawit — dapat melilit buah yang belum dipanen. Jangan tanam di dekat tanaman semusim yang butuh persiapan lahan rutin karena sulitnya eradikasi.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk area terbuka (tanpa naungan): Stylosanthes lebih produktif dan protein lebih tinggi. Untuk produksi protein yang terukur: tanam Indigofera atau Gamal sebagai strip di antara paddock. Centro paling tepat untuk sistem extensif/silvopastura.' },
    ],
  },

  // ── 10. Stylo ─────────────────────────────────────────────────────────────────
  'stylo': {
    asalBahan: 'Daun dan batang muda tanaman Stylosanthes yang dipanen dari padang penggembalaan atau ditanam secara campuran dengan rumput',
    bentuk: ['Segar', 'Kering'],
    asal: 'Amerika Selatan (Brasil, Venezuela, Guyana); dikembangkan luas di Afrika dan Asia Tenggara sebagai leguminosa padang penggembalaan',
    habitat: 'Dataran rendah 0–1.500 mdpl; sangat toleran tanah masam dan miskin Al/Fe; tahan kekeringan sedang; tidak tahan genangan air',
    umurPanenIdeal: 'Dipanen berkala dalam sistem penggembalaan bergilir; produksi terbaik sebelum pembungaan (±10–12 minggu pertumbuhan)',
    tinggiTanaman: 'Herba setengah tegak, 30–90 cm; beberapa varietas semi-merambat hingga 120 cm',
    produksiHijauan: '3–8 ton BK/ha/tahun sebagai monokultur; lebih rendah dalam campuran dengan rumput tetapi lebih stabil di lahan masam',
    kelebihan: 'Toleran tanah sangat masam (pH 4–5) yang tidak cocok untuk leguminosa lain; stabil di lahan marginal; tahunan dan regenerasi sendiri dari biji; cocok untuk sistem silvopastura',
    kekurangan: 'Protein lebih rendah dari leguminosa pohon (PK 12–16% BK); produksi biomassa lebih rendah; beberapa varietas rentan penyakit antraknosа',
    nutrisi: {
      bk: 23, kadarAir: 77,
      pk: 14, sk: 29, lk: 3.5, abu: 7, betn: 46.5,
      tdn: 53, me: 2100,
      ndf: 56, adf: 37,
      ca: 1.0, p: 0.20, mg: 0.25, na: 0.02, k: 1.20, cl: null, s: 0.16,
      vitamin: 'Beta-karoten moderat; Vitamin K dari klorofil; kandungan vitamin relatif lebih rendah dibanding leguminosa pohon',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Ca:P = 5:1. Profil mineral dasar yang memadai untuk pemeliharaan.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      musimTerbaik: 'Produksi stabil di musim hujan; bertahan di musim kemarau lebih baik dari rumput tropis biasa',
      umurPanenTerbaik: 'Panen sebelum berbunga untuk protein dan palatabilitas terbaik',
      catatan: 'Paling efektif dalam sistem penggembalaan bergilir campuran dengan Brachiaria atau rumput tropis lainnya. Kontribusi utama: memperbaiki kesuburan tanah masam dan meningkatkan protein ransum ternak yang merumput di lahan marginal.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 700,
      satuan: 'per kg segar', supplier: 'Peternak / BPTU / Program reklamasi lahan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Stylosanthes guianensis, ruminants, INRA-CIRAD-AFZ-FAO',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'FAO (2017) — Feed Resources Database — Stylosanthes guianensis',
        'Stür, W.W. et al. (2002) — Forages for Smallholder Farmers in Southeast Asia, CIAT',
      ],
      sumberData: 'Feedipedia, FAO, dan data padang penggembalaan di lahan masam Indonesia',
      catatan: 'Nilai nutrisi dapat bervariasi ±15% tergantung varietas (Stylosanthes guianensis cv. Cook, cv. Endeavour, cv. CIAT 184), umur panen, dan kondisi tanah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Stylo adalah leguminosa perintis untuk lahan masam marginal — satu-satunya leguminosa produktif di tanah pH 4–5 yang tidak cocok untuk Lamtoro, Gamal, atau Indigofera. Protein 14% BK dengan toleransi lahan terbatas tertinggi.' },
      { type: 'kelebihan', icon: '✅', text: 'Tahan tanah masam dengan Al dan Fe tinggi yang mematikan leguminosa lain. Regenerasi alami dari biji — tanam sekali, produktif bertahun-tahun. Sangat cocok untuk reklamasi lahan kritis sebagai sistem agroforestri.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein (14% BK) dan TDN (53%) terendah di antara leguminosa pakan dalam daftar ini. Serat tinggi (NDF 56%). Tidak cocok sebagai pakan protein utama — gunakan hanya sebagai komponen campuran padang penggembalaan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Sistem terbaik: Brachiaria 70% + Stylo 25–30% dalam padang penggembalaan campuran. Di lahan masam ini jauh lebih efektif daripada sistem monokultur rumput + konsentrat protein tambahan.' },
      { type: 'peringatan', icon: '🚨', text: 'Beberapa varietas Stylosanthes rentan anthracnosa (penyakit jamur) di musim hujan yang sangat lembab. Pilih varietas tahan anthracnosa seperti cv. Cook atau CIAT 184 untuk stabilitas produksi jangka panjang.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika pH tanah sudah diperbaiki (pengapuran): Centro atau Indigofera lebih produktif dan berprotein lebih tinggi. Stylo paling tepat untuk tahap awal reklamasi lahan masam sebelum perbaikan pH berjalan.' },
    ],
  },

  // ── 11. Kacang Tanah Hijauan ──────────────────────────────────────────────────
  'kacang-tanah-hijauan': {
    asalBahan: 'Daun, batang muda, dan ranting kacang tanah — hasil samping pemanenan kacang tanah atau dari tanaman yang dibudidayakan khusus untuk hijauan',
    bentuk: ['Segar', 'Kering'],
    asal: 'Amerika Selatan (Brasil, Bolivia, Paraguay); dibudidayakan luas di seluruh kawasan tropis dan subtropis sebagai tanaman pangan',
    habitat: 'Dataran rendah 0–1.000 mdpl; menyukai tanah berpasir berdrainase baik; toleran kekeringan moderat; sensitif terhadap genangan dan tanah berat',
    umurPanenIdeal: 'Hijauan dipanen bersamaan dengan panen polong (3–4 bulan setelah tanam); atau panen daun berkala setiap 6–8 minggu dari tanaman khusus hijauan',
    tinggiTanaman: '30–50 cm (tanaman tegak) atau merambat di tanah; dipanen saat fase R5–R7 (pengisian hingga matang polong)',
    produksiHijauan: '5–12 ton BK/ha/tahun dari hasil samping panen polong; sangat melimpah di sentra produksi kacang tanah',
    kelebihan: 'Tersedia melimpah dan murah sebagai hasil samping panen kacang tanah; protein 9–15% BK — lebih tinggi dari jerami padi; palatabilitas baik; mudah dikeringkan',
    kekurangan: 'Kualitas bervariasi tergantung rasio daun:batang:polong; kadar protein lebih rendah dibanding leguminosa pohon; rentan jamur aflatoksin jika lembab saat penyimpanan',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 12, sk: 25, lk: 4.5, abu: 10, betn: 48.5,
      tdn: 57, me: 2250,
      ndf: 54, adf: 36,
      ca: 1.1, p: 0.27, mg: 0.30, na: 0.03, k: 1.45, cl: null, s: 0.18,
      vitamin: 'Vitamin E; beta-karoten; kandungan vitamin relatif lebih rendah dari leguminosa pohon tropik',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Ca:P = 4,1:1. Abu tinggi (10%) mencerminkan mineral makro yang cukup baik.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 35,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      musimTerbaik: 'Tersedia melimpah saat musim panen kacang tanah (biasanya 2× setahun); dapat dikeringkan untuk cadangan',
      umurPanenTerbaik: 'Panen saat fase R5–R6 (pengisian polong): protein daun masih tinggi, polong belum terlalu kering',
      catatan: 'Periksa kadar aflatoksin sebelum digunakan, terutama jika disimpan dalam kondisi lembab. Keringkan segera setelah panen di tempat berventilasi baik. Dapat dicampur dengan jerami padi untuk meningkatkan kualitas pakan musim kemarau.',
    },
    harga: {
      estimasiAI: 800, hargaMarketplace: 1500,
      satuan: 'per kg segar', supplier: 'Petani kacang tanah lokal (saat panen)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Arachis hypogaea, haulm, ruminants, INRA-CIRAD-AFZ-FAO',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'FAO (2017) — Feed Resources Database — Arachis hypogaea',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia, FAO, dan data komposisi hijauan kacang tanah Indonesia',
      catatan: 'Protein bervariasi 9–15% BK tergantung rasio daun:batang (daun mengandung 2–3× lebih banyak protein). Simpan dalam kondisi kering untuk mencegah aflatoksin.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Hijauan Kacang Tanah adalah protein suplemen yang tersedia gratis atau sangat murah saat musim panen — protein 12% BK, jauh lebih baik dari jerami padi (4–5% BK). Ideal sebagai pengganti rumput berkualitas rendah di musim kemarau.' },
      { type: 'kelebihan', icon: '✅', text: 'Biasanya gratis dari petani kacang tanah yang tidak memanfaatkan daunnya. Nilai nutrisi jauh di atas jerami padi. Mudah dikeringkan dan disimpan 3–6 bulan sebagai cadangan musim kemarau.' },
      { type: 'peringatan', icon: '🚨', text: 'Risiko aflatoksin lebih tinggi dari leguminosa lain jika disimpan dalam kondisi lembab — sama seperti risiko pada jagung. Periksa bau dan visualnya; jika berjamur atau bau apek, buang jangan diberikan ke ternak.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi efektif: Hijauan Kacang Tanah (hay) 25–30% + Jerami Padi 40–50% + Dedak Padi 20–25%. Meningkatkan kualitas ransum musim kemarau berbasis limbah pertanian secara signifikan tanpa biaya konsentrat premium.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein 12% BK lebih rendah dari leguminosa pohon. Kualitas bervariasi antar lot (tergantung berapa banyak daun vs. batang). TDN 57% — perlu sumber energi tambahan untuk penggemukan intensif.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk protein lebih tinggi: Daun Kacang Tunggak (PK 16%) atau Daun Singkong (PK 18%). Hijauan Kacang Tanah paling tepat sebagai suplemen murah di daerah sentra kacang tanah — manfaatkan sebaik-baiknya saat musim panen.' },
    ],
  },

  // ── 12. Desmodium spp. ────────────────────────────────────────────────────────
  'desmodium': {
    asalBahan: 'Daun dan batang muda tanaman Desmodium spp. yang dipanen dari lahan agroforestri atau padang penggembalaan campuran',
    bentuk: ['Segar', 'Kering'],
    asal: 'Pantropik — berbagai spesies berasal dari Amerika, Afrika, dan Asia; tersebar luas di kawasan tropis basah termasuk Indonesia',
    habitat: 'Dataran rendah 0–2.000 mdpl; toleran naungan parsial; tumbuh di tanah lembab dan basah; cocok untuk tepi hutan dan sistem agroforestri',
    umurPanenIdeal: 'Panen sebelum fase pembungaan penuh; dipanen berkala setiap 8–12 minggu atau sesuai pertumbuhan dalam sistem penggembalaan',
    tinggiTanaman: 'Merambat 30–100 cm (semi-tegak hingga merambat); beberapa spesies dapat mencapai 2 m jika ditopang',
    produksiHijauan: '3–8 ton BK/ha/tahun sebagai campuran padang penggembalaan; produksi murni lebih tinggi tapi jarang dilakukan',
    kelebihan: 'Toleran naungan dan genangan sementara; sangat adaptif di berbagai ekosistem; memperbaiki kesuburan tanah; berguna dalam sistem push-pull untuk pengendalian hama (D. uncinatum)',
    kekurangan: 'Produksi per luas lebih rendah dari leguminosa pohon; tidak tersedia secara komersial; nilai nutrisi sedang (PK 12–18% BK); biji lengket dapat menempel di bulu hewan',
    nutrisi: {
      bk: 23, kadarAir: 77,
      pk: 15, sk: 27, lk: 3.5, abu: 7, betn: 47.5,
      tdn: 55, me: 2150,
      ndf: 57, adf: 37,
      ca: 1.2, p: 0.20, mg: 0.26, na: 0.02, k: 1.35, cl: null, s: 0.17,
      vitamin: 'Beta-karoten moderat; Vitamin K dari klorofil; profil vitamin serupa leguminosa herba lainnya',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Ca:P = 6:1; suplementasi P penting untuk ternak produktif. Fe moderat.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Grower', 'Penggemukan'],
      musimTerbaik: 'Produksi lebih baik di musim hujan; relatif stabil di ekosistem lembab sepanjang tahun',
      umurPanenTerbaik: 'Panen sebelum berbunga untuk protein maksimal dan menghindari biji lengket',
      catatan: 'Gunakan sebagai komponen hijauan dalam sistem penggembalaan campuran. Biji Desmodium yang lengket dapat menempel di kulit dan bulu ternak — panen sebelum berbunga untuk menghindari masalah ini. Tidak tersedia secara komersial — harus ditanam sendiri.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 800,
      satuan: 'per kg segar', supplier: 'Kebun sendiri / BPTU / Program agroforestri',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Desmodium spp., ruminants, INRA-CIRAD-AFZ-FAO',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'FAO (2017) — Feed Resources Database — Desmodium spp.',
        'Cook, B.G. et al. (2005) — Tropical Forages, CSIRO/DPI&F(Qld)/CIAT/ILRI',
      ],
      sumberData: 'Feedipedia, FAO, dan referensi internasional Desmodium dari kawasan tropis',
      catatan: 'Nilai nutrisi sangat bervariasi antar spesies (D. uncinatum, D. intortum, D. rensonii). D. rensonii umumnya dianggap memiliki nilai nutrisi tertinggi di antara spesies lokal Asia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Desmodium adalah leguminosa serbaguna untuk sistem agroforestri — protein 15% BK dengan toleransi naungan dan lahan basah yang unik. Peran utamanya dalam sistem push-pull (pengendalian hama biologis) menjadikannya investasi ganda untuk peternak-petani.' },
      { type: 'kelebihan', icon: '✅', text: 'Adaptif di berbagai ekosistem yang sulit untuk leguminosa lain. Toleran naungan parsial — cocok untuk lahan di antara pepohonan. Fiksasi N yang baik memperbaiki kesuburan tanah secara pasif.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein (15% BK) dan TDN (55%) sedang. Serat cukup tinggi (NDF 57%). Biji lengket jadi masalah jika dipanen terlambat. P hanya 0,2% BK — suplementasi fosfor penting untuk ternak yang sedang tumbuh dan laktasi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi dalam sistem silvopastura: Desmodium 20% + Rumput (Brachiaria/Gajah) 70% + mineral premix. Di sistem push-pull: Desmodium sebagai bordertrap di sekeliling paddock — ternak merumput langsung dari tanaman perbatasan.' },
      { type: 'peringatan', icon: '🚨', text: 'Panen sebelum berbunga untuk menghindari biji lengket yang menempel di bulu ternak dan dapat mengganggu pergerakan serta mengurangi kenyamanan. Biji yang menempel di bulu juga sulit dibersihkan dan menurunkan estetika ternak.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk protein lebih tinggi di lahan terbuka: Indigofera atau Gamal. Untuk padang penggembalaan lahan masam: Stylosanthes. Desmodium paling tepat untuk sistem agroforestri berlahan campuran atau push-pull pest management.' },
    ],
  },

  // ── 13. Daun Kacang Panjang ───────────────────────────────────────────────────
  'daun-kacang-panjang': {
    asalBahan: 'Daun, batang muda, dan sulur tanaman kacang panjang — hasil samping panen polong atau dari tanaman setelah masa produktif berakhir',
    bentuk: ['Segar', 'Kering'],
    asal: 'Asia Tropis (Afrika Barat asal leluhurnya, berkembang luas di Asia Tenggara termasuk Indonesia sebagai sayuran utama)',
    habitat: 'Dataran rendah 0–800 mdpl; membutuhkan irigasi atau curah hujan moderat; ditanam di lahan pertanian sayuran tropis',
    umurPanenIdeal: 'Hijauan tersedia saat panen polong (50–70 hari setelah tanam); batang dan daun dipanen setelah produktivitas polong menurun',
    tinggiTanaman: 'Merambat 1,5–4 m dengan tiang/ajir; batang merambat yang menghasilkan banyak daun',
    produksiHijauan: '3–8 ton BK/ha/tahun daun + batang; tersedia melimpah sebagai hasil samping pertanian sayuran',
    kelebihan: 'Tersedia musiman namun sangat melimpah di daerah sentra sayuran; protein 12–17% BK lebih baik dari rumput; palatabilitas baik; mudah dipotong dan diberikan langsung',
    kekurangan: 'Ketersediaan musiman — tidak tersedia sepanjang tahun seperti leguminosa pohon; kualitas bervariasi tergantung umur panen',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 14.5, sk: 25, lk: 3.5, abu: 9, betn: 48,
      tdn: 57, me: 2250,
      ndf: 47, adf: 31,
      ca: 1.0, p: 0.27, mg: 0.28, na: 0.03, k: 1.55, cl: null, s: 0.18,
      vitamin: 'Beta-karoten; Vitamin C (segar); Vitamin K; kandungan vitamin moderat',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Ca:P = 3,7:1. Profil mineral cukup untuk pemeliharaan dasar.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong'],
      programCocok: ['Indukan', 'Grower', 'Penggemukan'],
      musimTerbaik: 'Tersedia saat musim panen kacang panjang (sepanjang tahun di dataran rendah tropis jika irigasi tersedia)',
      umurPanenTerbaik: 'Tanaman berumur 50–60 hari (saat panen polong pertama) memiliki daun berkualitas terbaik',
      catatan: 'Manfaatkan sebagai suplemen hijauan murah di daerah pertanian sayuran. Keringkan untuk cadangan musim kemarau. Campur dengan rumput atau jerami untuk meningkatkan kualitas ransum harian.',
    },
    harga: {
      estimasiAI: 1000, hargaMarketplace: 2000,
      satuan: 'per kg segar', supplier: 'Petani sayuran lokal / Pasar tradisional (saat panen)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Vigna unguiculata subsp. sesquipedalis, leaves, ruminants',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'FAO (2017) — Feed Resources Database — Vigna unguiculata',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia, FAO, dan data analisis proksimat daun Vigna unguiculata dari Asia Tenggara',
      catatan: 'Nilai nutrisi bervariasi tergantung rasio daun vs. batang yang dipanen. Daun muda mengandung 2× lebih banyak protein dibanding batang tua.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun Kacang Panjang adalah hijauan suplemen gratis dari pertanian sayuran — protein 14,5% BK dari bahan yang biasanya terbuang. Ideal untuk kambing dan domba di daerah pertanian sayuran intensif.' },
      { type: 'kelebihan', icon: '✅', text: 'Biasanya sangat murah atau bahkan gratis dari petani sayuran. Palatabilitas baik tanpa pre-treatment khusus. Mudah dikeringkan sebagai hay cadangan. Tersedia sepanjang tahun di dataran rendah tropis dengan irigasi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein (14,5% BK) sedang — tidak setinggi leguminosa pohon. Ketersediaan tergantung musim panen kacang panjang. Batang tua (setelah panen selesai) memiliki protein jauh lebih rendah dari daun muda.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi efektif untuk kambing: Daun Kacang Panjang 20–25% + Rumput 65–70% + Dedak Padi 10%. Untuk domba: campur dengan jerami padi untuk memperbaiki serat kasar total ransum musim panen.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan batang tua berkayu (setelah tanaman sangat tua) — nilai nutrisi sangat rendah dan palatabilitas jelek. Fokus pada daun muda dan batang yang masih hijau segar.' },
      { type: 'alternatif', icon: '🔄', text: 'Protein lebih tinggi dan stabil: Daun Kacang Tunggak (PK 16,5%) atau Indigofera (PK 28%). Daun Kacang Panjang paling tepat sebagai suplemen oportunis di daerah sentra sayuran — manfaatkan saat tersedia murah.' },
    ],
  },

  // ── 14. Daun Kacang Hijau ─────────────────────────────────────────────────────
  'daun-kacang-hijau': {
    asalBahan: 'Daun dan batang muda tanaman kacang hijau (Vigna radiata) — hasil samping panen biji atau dari tanaman yang dipanen khusus daunnya',
    bentuk: ['Segar', 'Kering'],
    asal: 'Asia Selatan (India, Pakistan); dibudidayakan luas di seluruh Asia Tropis termasuk Indonesia sebagai tanaman pangan sumber protein nabati',
    habitat: 'Dataran rendah 0–750 mdpl; adaptif di berbagai jenis tanah; toleran kekeringan sedang; ditanam di lahan kering musiman',
    umurPanenIdeal: 'Hijauan tersedia saat panen biji (55–70 hari setelah tanam); daun muda dapat dipanen berkala sebelum panen akhir',
    tinggiTanaman: '30–90 cm (tegak atau semi-merambat); varietas berbeda memiliki tipe pertumbuhan berbeda',
    produksiHijauan: '3–6 ton BK/ha/tahun daun + batang; melimpah di sentra produksi kacang hijau',
    kelebihan: 'Protein 13–18% BK; palatabilitas baik pada kambing dan domba; mudah dikeringkan; harga murah di daerah produksi; cocok untuk diversifikasi sumber hijauan',
    kekurangan: 'Ketersediaan musiman dan terbatas di area non-sentra produksi; protein lebih rendah dari leguminosa pohon; tanaman semusim — tidak tersedia sepanjang tahun',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 15.5, sk: 23, lk: 3.5, abu: 9, betn: 49,
      tdn: 59, me: 2300,
      ndf: 45, adf: 29,
      ca: 1.1, p: 0.27, mg: 0.29, na: 0.03, k: 1.60, cl: null, s: 0.18,
      vitamin: 'Beta-karoten; Vitamin C pada daun segar; Vitamin K; profil vitamin moderat',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Ca:P = 4,1:1. NDF (45%) lebih rendah dari kacang-kacangan lain — kecernaan relatif lebih baik.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong'],
      programCocok: ['Indukan', 'Grower', 'Menyusui', 'Penggemukan'],
      musimTerbaik: 'Tersedia saat musim panen kacang hijau (biasanya 2× setahun di lahan kering)',
      umurPanenTerbaik: 'Daun muda pada tanaman berumur 40–55 hari memiliki protein dan palatabilitas terbaik',
      catatan: 'Berikan segar atau setelah dilayukan sebentar. Keringkan sebagai hay untuk cadangan. Disukai oleh kambing dan domba. Cocok dicampur dengan rumput atau jerami untuk pakan sehari-hari.',
    },
    harga: {
      estimasiAI: 1000, hargaMarketplace: 2000,
      satuan: 'per kg segar', supplier: 'Petani kacang hijau lokal / Pasar tradisional saat panen',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Vigna radiata, leaves, ruminants, INRA-CIRAD-AFZ-FAO',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'FAO (2017) — Feed Resources Database — Vigna radiata',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia, FAO, dan data analisis proksimat daun kacang hijau dari Asia Tenggara',
      catatan: 'Nilai nutrisi bervariasi ±15% tergantung umur tanaman dan rasio daun:batang. Panen muda memberikan protein lebih tinggi dan serat lebih rendah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun Kacang Hijau adalah hijauan leguminosa musiman dengan nilai nutrisi lebih baik dari kebanyakan rumput tropis — protein 15,5% BK, NDF 45% (lebih rendah dan mudah dicerna). Palatabilitas baik untuk kambing dan domba.' },
      { type: 'kelebihan', icon: '✅', text: 'NDF lebih rendah (45%) dibanding kacang-kacangan lain dalam daftar ini — kecernaan relatif lebih baik. Palatabilitas baik langsung. Murah dan melimpah saat musim panen kacang hijau.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi baik untuk domba dan kambing: Daun Kacang Hijau 20–25% + Rumput Lapang 60–65% + Jerami Padi 15%. Keringkan sebagai hay cadangan untuk 3–4 bulan musim kemarau.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein (15,5% BK) sedang dan hanya tersedia musiman. Ca:P = 4,1:1 — perlu suplementasi P. TDN 59% — perlu sumber energi tambahan untuk penggemukan atau produksi susu.' },
      { type: 'peringatan', icon: '🚨', text: 'Hindari daun yang sudah layu dan berubah warna (kuning/coklat) — nilai nutrisi turun signifikan dan risiko jamur meningkat. Berikan segar atau langsung keringkan dalam kondisi baik.' },
      { type: 'alternatif', icon: '🔄', text: 'Protein lebih stabil sepanjang tahun: Lamtoro atau Indigofera (pohon, tersedia 12 bulan). Daun Kacang Hijau paling tepat sebagai suplemen musiman di daerah sentra kacang hijau — gunakan maksimal saat tersedia murah.' },
    ],
  },

  // ── 15. Daun Kacang Tunggak ───────────────────────────────────────────────────
  'daun-kacang-tunggak': {
    asalBahan: 'Daun, batang muda, dan polong muda tanaman kacang tunggak (Vigna unguiculata) — hasil samping panen biji atau tanaman yang dibudidayakan khusus untuk hijauan',
    bentuk: ['Segar', 'Kering'],
    asal: 'Afrika Barat (Nigeria, Senegal); dibudidayakan luas di seluruh kawasan semi-arid tropis termasuk Indonesia sebagai tanaman pangan dan pakan',
    habitat: 'Dataran rendah 0–1.500 mdpl; sangat toleran kekeringan — tumbuh di lahan kering marginal yang sulit untuk tanaman lain; toleran tanah miskin',
    umurPanenIdeal: 'Hijauan tersedia saat panen biji (60–90 hari); daun muda dipanen berkala setiap 4–6 minggu; tumbuh cepat saat musim kemarau dimana leguminosa lain kurang produktif',
    tinggiTanaman: '30–80 cm (tegak) atau merambat beberapa meter; sangat bervariasi antar varietas',
    produksiHijauan: '4–10 ton BK/ha/tahun daun + batang; sangat produktif di musim kemarau saat leguminosa lain tidak produktif',
    kelebihan: 'Toleransi kekeringan terbaik di antara kacang-kacangan semusim; tumbuh di tanah paling miskin sekalipun; protein 14–19% BK — sangat baik untuk tanaman kering marginal; palatabilitas baik',
    kekurangan: 'Tanaman semusim — perlu ditanam ulang; protein lebih rendah dari leguminosa pohon; tidak toleran suhu rendah dan salju (tidak relevan di Indonesia)',
    nutrisi: {
      bk: 20, kadarAir: 80,
      pk: 16.5, sk: 23, lk: 3.5, abu: 9, betn: 48,
      tdn: 60, me: 2350,
      ndf: 44, adf: 28,
      ca: 1.2, p: 0.27, mg: 0.30, na: 0.03, k: 1.65, cl: null, s: 0.19,
      vitamin: 'Beta-karoten; Vitamin C segar; Vitamin K; kandungan vitamin moderat hingga baik',
      mineral: 'Nilai dinyatakan atas dasar bahan kering (DM basis). Ca:P = 4,4:1. NDF (44%) terendah di antara kacang-kacangan semusim — kecernaan terbaik dalam kelompok ini.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 35,
      targetTernak: ['Kambing', 'Domba', 'Sapi Potong', 'Kerbau'],
      programCocok: ['Indukan', 'Grower', 'Menyusui', 'Penggemukan', 'Pejantan'],
      musimTerbaik: 'Sangat produktif di musim kemarau — keunggulan utama kacang tunggak dibanding leguminosa lain yang produksinya menurun saat kemarau',
      umurPanenTerbaik: 'Panen daun pada 40–60 hari (sebelum panen biji); polong muda pada 50–70 hari memberikan kombinasi daun + polong berkualitas',
      catatan: 'Sangat strategis sebagai hijauan kualitas musim kemarau — saat rumput dan leguminosa pohon produksinya menurun, kacang tunggak justru produktif. Tanam segera setelah hujan pertama untuk panen hijauan kering paling kritis.',
    },
    harga: {
      estimasiAI: 800, hargaMarketplace: 1500,
      satuan: 'per kg segar', supplier: 'Petani kacang tunggak / Pasar tradisional / Daerah sentra produksi',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Vigna unguiculata, leaves, ruminants, INRA-CIRAD-AFZ-FAO',
        'NRC (2007) — Nutrient Requirements of Small Ruminants',
        'FAO (2017) — Feed Resources Database — Vigna unguiculata',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
        'Adeyemi, O.A. et al. (2012) — Nutritive Value of Cowpea, African Journal of Agricultural Research',
      ],
      sumberData: 'Feedipedia, FAO, dan data analisis proksimat daun kacang tunggak dari daerah tropik',
      catatan: 'Nilai nutrisi bervariasi ±15% tergantung varietas, umur panen, dan kondisi lahan. Varietas lokal di Indonesia umumnya memiliki protein 14–18% BK.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Daun Kacang Tunggak adalah protein hijauan terbaik untuk musim kemarau — protein 16,5% BK dan tumbuh subur justru saat kekeringan, ketika rumput dan leguminosa pohon produksinya menurun. Strategi kritis untuk ketersediaan hijauan sepanjang tahun.' },
      { type: 'kelebihan', icon: '✅', text: 'Toleransi kekeringan tertinggi di antara semua kacang-kacangan semusim. NDF 44% — terendah dalam kelompoknya, artinya kecernaan terbaik. Produksi di musim kemarau menjadi jembatan kritis saat hijauan lain langka.' },
      { type: 'kombinasi', icon: '🔗', text: 'Strategi musim kemarau: Daun Kacang Tunggak 25–30% + Jerami Padi (urea-treated) 40–50% + Dedak Padi 20–25%. Atau: Kacang Tunggak 25% + Gamal/Lamtoro 20% + Rumput kering 55% untuk kualitas lebih tinggi.' },
      { type: 'kelebihan', icon: '✅', text: 'Polong muda mengandung protein lebih tinggi dari daun — berikan keduanya untuk memaksimalkan nilai nutrisi total. Sangat disukai kambing dan domba. Tumbuh di tanah paling miskin sekalipun dengan sedikit input.' },
      { type: 'peringatan', icon: '🚨', text: 'Tanam segera setelah musim tanam berakhir untuk memastikan hijauan tersedia 60–90 hari kemudian (puncak kemarau). Jangan tunggu kemarau sudah tiba baru menanam — terlambat untuk panen tepat waktu.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk protein lebih tinggi: Indigofera (28% BK) atau Lamtoro (25% BK), tapi keduanya kurang produktif di kemarau panjang. Kacang Tunggak mengisi celah kritis ini — harus ada dalam kalender tanam peternak di daerah kering.' },
    ],
  },

};

// ─── Merger & Accessor ────────────────────────────────────────────────────────

export function getLeguminosaDetail(id: string): LeguminosaDetailItem | undefined {
  const base = getLeguminosaById(id);
  if (!base) return undefined;

  const detail = LEGUMINOSA_DETAIL[id];
  if (!detail) return undefined;

  return {
    ...base,
    ...detail,
    dataLengkap: true,
  };
}
