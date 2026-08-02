// ─── MP-021 — Detail Data: Kelapa Sawit ───────────────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for every Kelapa Sawit item.
// All proximate values (PK, SK, LK, Abu, BETN), TDN, ME, NDF, ADF, and minerals
// are expressed on Dry Matter (Bahan Kering) basis unless noted.
//
// Primary sources:
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi
//     Pakan untuk Indonesia. Gadjah Mada University Press.
//   • Feedipedia (2023). INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.
//   • NRC (2016). Nutrient Requirements of Beef Cattle, 8th Rev. Ed.
//   • Göhl, B. (1981). Tropical Feeds. FAO Animal Production and Health Series No. 12.
//   • Jayanegara, A. et al. (2017). Palm by-products as livestock feed in Indonesia. J. Indonesian Trop. Anim. Agric.
//   • Alimon, A.R. & Hair-Bejo, M. (1995). Feeding systems based on oil palm by-products. FAO.
//   • Wan Zahari, M. et al. (2004). Palm kernel expeller — ruminant feed. MARDI, Malaysia.
//   • Sundu, B. et al. (2006). Palm kernel meal in broiler and ruminant diets. World's Poultry Sci. J.

import { getKelapaSawitById, type KelapaSawitItem } from './kelapaSawitData';
import type {
  NutrisiData,
  PenggunaanData,
  HargaData,
  ReferensiData,
  AiInsightItem,
  BentukBahan,
} from './jagungData';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KelapaSawitDetailFields {
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

export type KelapaSawitDetailItem = KelapaSawitItem & KelapaSawitDetailFields;

// ─── Detail Registry ──────────────────────────────────────────────────────────

const KELAPA_SAWIT_DETAIL: Record<string, KelapaSawitDetailFields> = {

  // ── 1. Buah Kelapa Sawit ──────────────────────────────────────────────────────
  'buah-kelapa-sawit': {
    deskripsi: 'Tandan Buah Segar (TBS) kelapa sawit secara keseluruhan mencakup tandan, mesokarp, cangkang, dan inti. Jarang diberikan utuh langsung ke ternak; umumnya dijadikan acuan komposit untuk menghitung kontribusi nutrisi seluruh fraksinya dalam ransum atau pemanfaatan sisa sortir.',
    alias: 'Fresh Fruit Bunch, FFB, Tandan Buah Segar, TBS',
    asal: 'Buah tandan kelapa sawit (Elaeis guineensis Jacq.) yang dipanen dari perkebunan; sentra produksi di Sumatera, Kalimantan, dan Sulawesi',
    habitat: 'Dataran rendah tropis 0–500 mdpl; curah hujan 1.700–2.500 mm/tahun; suhu 25–35°C; tumbuh optimal di tanah mineral berdrainase baik',
    bagianDimanfaatkan: 'Seluruh tandan buah segar termasuk mesokarp berlemak, cangkang, dan inti sawit; masing-masing fraksi memiliki nilai pakan yang berbeda signifikan',
    metodePengolahan: 'Jika diberikan ke ternak, biasanya dalam bentuk buah afkir atau sortiran. Dapat direbus atau dikukus untuk memudahkan pemisahan mesokarp. Biasanya diberikan setelah dibelah agar ternak mengakses isi buah.',
    ketersediaan: 'Tersedia sepanjang tahun di sentra perkebunan sawit; buah afkir/sortiran tersedia dalam jumlah kecil dari pabrik pengolahan; TBS utuh umumnya langsung ke pabrik CPO',
    kelebihan: 'Kandungan lemak mesokarp sangat tinggi (sumber energi); protein inti sawit sedang; buah afkir harga sangat murah; tersedia di seluruh sentra perkebunan sawit Indonesia',
    kekurangan: 'Serat tandan dan cangkang sangat tinggi; nilai nutrisi sangat bervariasi tergantung proporsi bagian yang dikonsumsi; tidak praktis diberikan dalam jumlah besar; biasanya langsung diolah ke pabrik CPO',
    bentuk: ['Segar'],
    nutrisi: {
      bk: 40, kadarAir: 60,
      pk: 2.1, sk: 10.5, lk: 21.0, abu: 3.2, betn: 63.2,
      tdn: 78, me: 3100,
      ndf: 35.0, adf: 22.0,
      ca: 0.14, p: 0.08, mg: 0.06, na: 0.02, k: 0.25, cl: 0.04, s: 0.05,
      vitamin: 'Kaya beta-karoten (pro-vitamin A) dan vitamin E (tokoferol + tokotrienol) dari mesokarp; kadar sangat tinggi pada mesokarp merah matang',
      mineral: 'Komposit seluruh bagian TBS; nilai mineral bervariasi signifikan antar fraksi. Nilai atas dasar BK komposit.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      catatan: 'Gunakan buah afkir/sortiran yang tidak lolos standar pabrik CPO. Belah sebelum diberikan agar ternak mengakses mesokarp. Batasi 20% BK ransum. Hitung kebutuhan atas dasar BK (hanya 40% dari berat segar).',
    },
    harga: {
      estimasiAI: 2200, hargaMarketplace: 2000,
      satuan: 'per kg TBS segar',
      supplier: 'Perkebunan kelapa sawit / Pabrik PKS (buah afkir) / Koperasi sawit',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Alimon, A.R. & Hair-Bejo, M. (1995) — Feeding systems based on oil palm by-products in Malaysia, FAO',
        'Jayanegara, A. et al. (2017) — Palm by-products as livestock feed in Indonesia, J. Indonesian Trop. Anim. Agric.',
        'Feedipedia (2023) — Oil palm fruit (Elaeis guineensis), INRA-CIRAD-AFZ-FAO',
      ],
      sumberData: 'Nilai komposit berdasarkan proporsi fraksi TBS rata-rata; Feedipedia dan Alimon & Hair-Bejo (1995)',
      catatan: 'Nilai nutrisi TBS utuh sangat bergantung pada proporsi mesokarp, cangkang, dan inti yang dikonsumsi ternak. Gunakan data masing-masing fraksi untuk formulasi ransum yang akurat.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌴', text: 'TBS kelapa sawit adalah acuan komposit — energi tinggi berasal dari lemak mesokarp (TDN ±78%), namun nilai pakan sangat bervariasi tergantung berapa banyak mesokarp vs. serat tandan yang dikonsumsi ternak.' },
      { type: 'kelebihan', icon: '✅', text: 'Buah afkir sawit (tidak lolos sortir pabrik) tersedia murah di sekitar pabrik PKS. Mesokarp kaya beta-karoten dan vitamin E — mendukung reproduksi dan imunitas ternak.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein sangat rendah (2,1% BK) — harus selalu dikombinasikan dengan sumber protein. Serat tandan dan cangkang mengurangi kecernaan keseluruhan. BK hanya 40% — ternak perlu konsumsi volume besar.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi optimal: Buah Sawit Afkir + Pelepah Sawit (hijauan) + Bungkil Inti Sawit (protein) + Mineral Premix (Ca, P). Rangkaian produk sawit dapat membentuk ransum berimbang di sentra perkebunan.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan gunakan TBS yang sudah difermentasi lebih dari 24 jam — asam lemak bebas meningkat pesat dan dapat menyebabkan gangguan pencernaan. Pilih buah segar atau afkir panen hari itu.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk sumber energi lemak yang lebih terukur: gunakan CPO Feed Grade (ME 8.500 kcal/kg) atau Bungkil Ekspeller (PKE) sebagai pengganti. Mesokarp diproses lebih baik sebagai solid sawit dari pabrik.' },
    ],
  },

  // ── 2. Inti Sawit ──────────────────────────────────────────────────────────────
  'inti-sawit': {
    deskripsi: 'Biji keras (endosperm padat) di dalam cangkang kelapa sawit. Kaya lemak laurat (C12:0 ±48%) dan protein sedang. Merupakan bahan baku utama pembuatan minyak inti sawit (CPKO) dan bungkil inti sawit (PKM/PKE). Jarang diberikan langsung ke ternak karena biasanya langsung diproses di pabrik pengolahan.',
    alias: 'Palm Kernel, Palm Nut Kernel, PK, Biji Sawit',
    asal: 'Endosperm padat dari biji buah kelapa sawit (Elaeis guineensis Jacq.) setelah cangkang dipecah di pabrik pengolahan sawit',
    habitat: 'Tanaman kelapa sawit dataran rendah tropis; inti sawit dihasilkan sebagai produk antara di pabrik PKS Indonesia (Sumatera, Kalimantan)',
    bagianDimanfaatkan: 'Kernel/endosperm padat putih kekuningan di dalam cangkang keras; diekstrak dari biji sawit setelah pemecahan cangkang',
    metodePengolahan: 'Dipecah dari cangkang menggunakan mesin cracker; inti dipisahkan dari cangkang secara mekanis atau gravitasi. Jika diberikan ke ternak, dapat diberikan utuh atau digiling kasar.',
    ketersediaan: 'Tersedia dari pabrik PKS seluruh Indonesia; diperdagangkan sebagai bahan baku industri oleokimia; biasanya langsung dikirim ke pabrik pengolahan minyak inti sawit',
    kelebihan: 'Energi lemak sangat tinggi (TDN ±90%); protein sedang (8%); kaya asam lemak laurat yang memiliki efek antimikroba; dapat disimpan lebih lama dibanding mesokarp segar',
    kekurangan: 'Lemak jenuh sangat dominan (lauric, miristat); harus dibatasi ketat dalam ransum ruminansia; biasanya lebih menguntungkan dijual ke industri oleokimia daripada digunakan sebagai pakan',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 93, kadarAir: 7,
      pk: 8.0, sk: 7.5, lk: 48.5, abu: 2.0, betn: 34.0,
      tdn: 90, me: 3600,
      ndf: 22.0, adf: 15.0,
      ca: 0.09, p: 0.42, mg: 0.14, na: 0.03, k: 0.35, cl: 0.04, s: 0.10,
      vitamin: 'Vitamin E (tokotrienol ±28 mg/kg BK); sangat sedikit vitamin B larut air; tidak signifikan sebagai sumber vitamin',
      mineral: 'Kaya P (fitat); lemak didominasi asam laurat (C12:0 ±48%), miristat (C14:0 ±16%), palmitat (C16:0 ±9%). Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 10,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      catatan: 'Giling kasar sebelum diberikan untuk meningkatkan aksesibilitas lemak. Batasi sangat ketat ≤10% BK ransum — lemak jenuh tinggi menghambat fermentasi rumen. Selalu sertakan hijauan dan sumber protein. Lebih ekonomis menggunakan PKE/PKM sebagai produk olahan.',
    },
    harga: {
      estimasiAI: 4500, hargaMarketplace: 4200,
      satuan: 'per kg',
      supplier: 'Pabrik PKS / Pedagang biji sawit / Pengepul inti sawit',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Palm kernel (Elaeis guineensis), INRA-CIRAD-AFZ-FAO',
        'Wan Zahari, M. et al. (2004) — Palm kernel expeller for ruminants, MARDI Malaysia',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia dan Wan Zahari et al. (2004); profil asam lemak dari analisis MARDI Malaysia',
      catatan: 'Kadar lemak inti sawit bervariasi (44–52% BK) tergantung kematangan buah dan efisiensi pemisahan di pabrik. Nilai TDN dan ME dihitung berdasarkan energi lemak menggunakan faktor konversi ruminansia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Inti sawit adalah konsentrat energi lemak alami — TDN 90%, ME 3.600 kcal/kg BK. Asam laurat (C12:0 ±48%) memberikan energi cepat dan efek antimikroba dalam saluran pencernaan ternak.' },
      { type: 'kelebihan', icon: '✅', text: 'Energi tertinggi di antara produk padat kelapa sawit. Protein sedang (8% BK). Medium-chain triglyceride (MCT) lebih mudah diabsorpsi dibanding lemak rantai panjang.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Lemak jenuh sangat dominan — melebihi 5% lemak dalam ransum menghambat fermentasi serat di rumen. Harga relatif tinggi. Lebih menguntungkan secara ekonomi dijual ke pabrik PKO daripada digunakan sebagai pakan langsung.' },
      { type: 'kombinasi', icon: '🔗', text: 'Jika digunakan: campur dengan Pelepah Sawit (serat) + Bungkil Kedelai (protein + PUFA) + Mineral Premix. Batasi inti sawit sebagai "fat supplement" maksimal 10% BK.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan mencampur inti sawit dengan PKM/PKE dalam proporsi tinggi sekaligus — akumulasi lemak sawit akan menekan konsumsi dan fermentasi rumen. Pilih salah satu sebagai sumber lemak.' },
      { type: 'alternatif', icon: '🔄', text: 'Lebih praktis dan ekonomis menggunakan PKE (Bungkil Ekspeller Inti Sawit) — protein lebih tinggi (14–15%), lemak terukur (8%), harga lebih terjangkau. CPO Feed Grade untuk kebutuhan energi murni.' },
    ],
  },

  // ── 3. Pelepah Kelapa Sawit ───────────────────────────────────────────────────
  'pelepah-kelapa-sawit': {
    deskripsi: 'Pelepah daun kelapa sawit yang dipangkas secara rutin saat pemeliharaan dan panen. Sumber hijauan berlimpah gratis di perkebunan sawit. Serat tinggi, palatabilitas sedang, dapat diberikan segar atau dicacah. Tersedia 22–26 pelepah/pohon/tahun.',
    alias: 'Oil Palm Frond, OPF, Palm Frond, Pelepah Sawit, Frond Sawit',
    asal: 'Pelepah daun pohon kelapa sawit (Elaeis guineensis Jacq.) yang dipangkas saat panen TBS atau pemangkasan rutin; tersedia berlimpah di seluruh perkebunan sawit Indonesia',
    habitat: 'Perkebunan kelapa sawit dataran rendah tropis seluruh Indonesia; sentra terbesar di Sumatera (Riau, Sumatera Utara) dan Kalimantan (Kaltim, Kalbar)',
    bagianDimanfaatkan: 'Seluruh pelepah termasuk rachis (batang pelepah) dan petiole; helaian daun (leaflet) dipisahkan atau diberikan bersama batang pelepah',
    metodePengolahan: 'Diberikan segar langsung setelah dipangkas; dapat dicacah (chop) menjadi 3–5 cm untuk meningkatkan konsumsi; petiole bagian bawah lebih lunak dan disukai ternak; dapat difermentasi atau dibuat silase untuk penyimpanan',
    ketersediaan: 'Sangat berlimpah di seluruh perkebunan sawit — tersedia 22–26 pelepah/pohon/tahun secara gratis atau sangat murah; kadang diberikan gratis oleh perkebunan kepada peternak sekitar',
    kelebihan: 'Harga sangat murah atau gratis di sentra perkebunan; tersedia sepanjang tahun; sumber hijauan alternatif saat musim kemarau; volume produksi besar; mengandung cairan intrasel yang meningkatkan palatabilitas',
    kekurangan: 'Serat sangat tinggi (NDF ±65%) dengan kecernaan rendah; protein kasar rendah (4–5%); BK rendah (32%) sehingga perlu volume besar; membutuhkan pencacahan sebelum diberikan untuk mencegah tersedak',
    bentuk: ['Segar'],
    nutrisi: {
      bk: 32, kadarAir: 68,
      pk: 4.5, sk: 30.0, lk: 3.5, abu: 5.5, betn: 56.5,
      tdn: 49, me: 1950,
      ndf: 65.0, adf: 42.0,
      ca: 0.55, p: 0.09, mg: 0.18, na: 0.04, k: 0.85, cl: 0.12, s: 0.08,
      vitamin: 'Mengandung beta-karoten dari bagian hijau; vitamin K dari klorofil; kadar terbatas dan tidak signifikan sebagai sumber vitamin',
      mineral: 'Ca dan K relatif tinggi untuk hijauan tropis; Ca:P ratio sangat lebar (±6:1) — perlu suplementasi P. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 50,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kerbau', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower'],
      catatan: 'Cacah menjadi 3–5 cm sebelum diberikan. Bagian petiole (batang bawah lunak) lebih disukai ternak. Kombinasikan dengan PKM/PKE sebagai sumber protein dan energi. Hitung kebutuhan atas dasar BK (32%). Dapat menggantikan hingga 50% kebutuhan hijauan.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 350,
      satuan: 'per kg segar',
      supplier: 'Perkebunan kelapa sawit sekitar / Petani plasma sawit (sering gratis)',
      updatedAt: '01 Jul 2026',
    },
    referensi: {
      literatur: [
        'Alimon, A.R. & Hair-Bejo, M. (1995) — Feeding systems based on oil palm by-products, FAO',
        'Nor Hafizah, M. et al. (2014) — Oil palm frond as roughage for beef cattle, Malaysian J. Anim. Sci.',
        'Feedipedia (2023) — Oil palm fronds (Elaeis guineensis), INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Rata-rata Feedipedia, Alimon & Hair-Bejo (1995), dan Nor Hafizah et al. (2014) untuk pelepah sawit segar tropis',
      catatan: 'Kualitas nutrisi pelepah bervariasi tergantung bagian (petiole vs. rachis vs. leaflet). Leaflet (helaian daun) lebih kaya protein; rachis lebih berserat. Nilai atas dasar pelepah utuh segar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Pelepah kelapa sawit adalah hijauan murah paling berlimpah di sentra perkebunan — 22–26 pelepah/pohon/tahun tersedia gratis. Berfungsi sebagai roughage utama pengganti jerami untuk sapi yang dipelihara di dekat perkebunan sawit.' },
      { type: 'kelebihan', icon: '✅', text: 'Gratis atau Rp 350–400/kg di sekitar perkebunan. Produksi sepanjang tahun tanpa musim. K dan Ca cukup tinggi. Palatabilitas lebih baik dari jerami padi atau tandan kosong.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Serat sangat tinggi (NDF 65%) — kecernaan rumen terbatas. Protein rendah (4,5% BK) — tidak bisa jadi sumber protein. BK hanya 32% sehingga ternak perlu konsumsi banyak secara bobot.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula standar di sentra sawit: Pelepah Sawit (50%) + PKM atau PKE (20%) + Solid/Lumpur Sawit (20%) + Mineral Premix + Urea (opsional). Kombinasi ini memanfaatkan seluruh produk samping sawit secara efisien.' },
      { type: 'peringatan', icon: '🚨', text: 'Ca:P ratio sangat lebar (±6:1) — wajib suplementasi fosfat. Jangan berikan pelepah utuh tanpa dicacah — resiko tersedak pada sapi dan kerbau. Pelepah tua dan keras lebih rendah palatabilitasnya.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika tidak ada perkebunan sawit: Jerami Padi (kualitas mirip, serat lebih rendah) atau Rumput Gajah (protein lebih tinggi, palatabilitas lebih baik). Silase Pelepah dapat dibuat untuk penyimpanan 3–6 bulan.' },
    ],
  },

  // ── 4. Daun Kelapa Sawit ──────────────────────────────────────────────────────
  'daun-kelapa-sawit': {
    deskripsi: 'Helaian daun (leaflet) yang diambil dari pelepah kelapa sawit. Lebih lunak dan lebih kaya protein dibanding batang pelepah (rachis). Mengandung protein kasar ±10% BK dan serat kasar tinggi. Cocok sebagai hijauan suplemen sapi terutama di sentra perkebunan sawit.',
    alias: 'Oil Palm Leaf, Palm Leaf, Leaflet Sawit, Daun Frond Sawit',
    asal: 'Helaian daun (leaflet pinnate) dari pelepah kelapa sawit (Elaeis guineensis Jacq.); dipisahkan dari rachis/batang pelepah setelah pemangkasan',
    habitat: 'Perkebunan kelapa sawit tropis seluruh Indonesia; diperoleh sebagai bagian dari pelepah yang dipangkas saat pemeliharaan dan panen',
    bagianDimanfaatkan: 'Helaian daun tipis (leaflet) berwarna hijau yang tumbuh bilateral di sepanjang rachis pelepah; dipisahkan dari batang pelepah secara manual atau mekanis',
    metodePengolahan: 'Dipisahkan dari batang pelepah, diberikan segar langsung; dapat dicacah menjadi potongan 5–10 cm; dapat dikeringkan untuk penyimpanan (BK meningkat menjadi ±88%); dapat difermentasi dengan urea untuk meningkatkan protein',
    ketersediaan: 'Tersedia bersamaan dengan pelepah yang dipangkas; perlu tenaga kerja tambahan untuk memisahkan dari rachis; di Malaysia dan beberapa daerah Sumatera sudah tersedia mesin pemisah daun',
    kelebihan: 'Protein lebih tinggi dari batang pelepah (±10% BK); lebih lunak dan lebih disukai ternak; mengandung klorofil dan karotenoid; dapat dikeringkan untuk penyimpanan jangka panjang',
    kekurangan: 'Perlu proses pemisahan dari rachis yang membutuhkan tenaga kerja; serat masih tinggi (NDF ±58%); kandungan silika yang cukup tinggi mengurangi kecernaan',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 10.0, sk: 28.0, lk: 5.5, abu: 7.0, betn: 49.5,
      tdn: 52, me: 2050,
      ndf: 58.0, adf: 38.0,
      ca: 0.90, p: 0.18, mg: 0.25, na: 0.06, k: 0.90, cl: 0.15, s: 0.10,
      vitamin: 'Kaya klorofil dan beta-karoten (pro-vitamin A); vitamin K dari jaringan hijau; lebih kaya vitamin dibanding rachis/batang pelepah',
      mineral: 'Ca sangat tinggi (0,90% BK) — salah satu hijauan dengan Ca tertinggi dari produk sawit. Ca:P ±5:1. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower'],
      catatan: 'Cacah atau rajang sebelum diberikan. Lebih baik dicampur dengan pelepah atau hijauan lain untuk variasi. Jika dikeringkan (BK ±88%), nilai nutrisi per kg bahan kering lebih terukur. Suplementasi P wajib karena Ca:P tidak seimbang.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 250,
      satuan: 'per kg kering',
      supplier: 'Perkebunan kelapa sawit / Petani sawit sekitar (sering gratis atau sangat murah)',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: [
        'Alimon, A.R. & Hair-Bejo, M. (1995) — Feeding systems based on oil palm by-products, FAO',
        'Feedipedia (2023) — Oil palm leaves (Elaeis guineensis), INRA-CIRAD-AFZ-FAO',
        'Jayanegara, A. et al. (2017) — Palm by-products as livestock feed in Indonesia, J. Indonesian Trop. Anim. Agric.',
      ],
      sumberData: 'Feedipedia dan Alimon & Hair-Bejo (1995); nilai BK kering dari analisis lapangan perkebunan Sumatera',
      catatan: 'Nilai protein daun (±10% BK) secara signifikan lebih tinggi dari rachis pelepah (±4,5% BK). Pemisahan daun dari batang memberikan hijauan berkualitas lebih baik untuk ternak.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍃', text: 'Daun kelapa sawit menawarkan protein lebih tinggi dari batang pelepah (10% vs 4,5% BK) — menjadikannya hijauan suplemen yang lebih bernilai untuk ternak sapi di sentra perkebunan sawit.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein 10% BK cukup untuk dijadikan hijauan utama saat rumput langka. Kaya Ca (0,90% BK) — membantu pemenuhan kebutuhan kalsium indukan dan sapi bunting. Karotenoid mendukung reproduksi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Perlu proses pemisahan dari rachis — membutuhkan tenaga kerja tambahan. NDF 58% masih cukup tinggi. Silika pada dinding sel mengurangi kecernaan serat. Ca:P tidak seimbang (5:1).' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan PKM atau Bungkil Kedelai (energi + protein tambahan) + sumber fosfat (Ca:P balancer) + Mineral Premix lengkap. Daun sawit + bungkil PKM = ransum ruminansia ekonomis di sentra sawit.' },
      { type: 'peringatan', icon: '🚨', text: 'Suplementasi P wajib — Ca:P ratio 5:1 jauh di luar ideal (1,5–2:1). Tanpa P tambahan, ternak akan mengalami defisiensi fosfat yang menekan nafsu makan dan pertumbuhan tulang.' },
      { type: 'alternatif', icon: '🔄', text: 'Lebih baik menggunakan Pelepah Sawit utuh (lebih mudah tanpa proses pemisahan) atau Silase Pelepah untuk penyimpanan. Untuk protein lebih tinggi: kombinasikan pelepah dengan PKM/PKE.' },
    ],
  },

  // ── 5. Tandan Kosong Kelapa Sawit ─────────────────────────────────────────────
  'tandan-kosong-kelapa-sawit': {
    deskripsi: 'Rangka tandan buah kelapa sawit setelah buah disterilisasi dan dilepas di pabrik PKS. Tersedia dalam jumlah sangat besar sebagai limbah pabrik. Serat kasar sangat tinggi (NDF ±78%); nilai pakan sangat terbatas namun dapat digunakan sebagai roughage atau media biogas.',
    alias: 'Empty Fruit Bunch, EFB, OPEFB, TKKS, Janjangan Kosong',
    asal: 'Limbah padat pabrik pengolahan kelapa sawit (PKS) setelah TBS disterilisasi dan buah dirontokkan dari tandan; setiap ton TBS menghasilkan ±230 kg TKKS',
    habitat: 'Dihasilkan di seluruh pabrik PKS Indonesia; tersedia berlimpah di Sumatera dan Kalimantan; umumnya dikembalikan ke lahan sebagai mulsa organik',
    bagianDimanfaatkan: 'Rangka/rachis tandan yang tersisa setelah buah dilepaskan; mengandung serat selulose dan lignoselulosa sangat tinggi',
    metodePengolahan: 'Untuk pakan: harus dicacah halus (1–3 cm) dan difermentasi dengan jamur (Aspergillus, Trichoderma) atau urea selama 3–4 minggu untuk menurunkan lignin dan meningkatkan kecernaan. Tanpa pengolahan, nilai pakan sangat rendah.',
    ketersediaan: 'Sangat berlimpah di sekitar pabrik PKS — tersedia hampir gratis atau biaya transportasi saja; kadang dikenai biaya pengangkutan; stok tidak terbatas di sentra pabrik sawit',
    kelebihan: 'Harga sangat murah atau gratis; tersedia berlimpah sepanjang tahun di sekitar pabrik; jika difermentasi dapat meningkatkan palatabilitas dan kecernaan; dapat digunakan sebagai sumber serat kasar untuk mengontrol pH rumen',
    kekurangan: 'NDF sangat tinggi (±78%) dengan lignin tinggi — kecernaan sangat rendah tanpa fermentasi; protein sangat rendah (3% BK); TDN hanya 40% — nilai energi sangat terbatas; membutuhkan pengolahan intensif sebelum dapat digunakan efektif',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 3.0, sk: 35.0, lk: 2.5, abu: 6.5, betn: 53.0,
      tdn: 40, me: 1600,
      ndf: 78.0, adf: 53.0,
      ca: 0.35, p: 0.08, mg: 0.12, na: 0.03, k: 0.90, cl: 0.10, s: 0.05,
      vitamin: 'Hampir tidak ada vitamin signifikan; klorofil telah terurai selama proses sterilisasi di pabrik',
      mineral: 'K relatif tinggi (0,90% BK); Ca:P ratio tidak seimbang (±4:1); kandungan silika memperburuk kecernaan serat. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kerbau'],
      programCocok: ['Penggemukan'],
      catatan: 'WAJIB dicacah dan difermentasi sebelum diberikan. Tanpa fermentasi: palatabilitas sangat rendah dan kecernaan <30%. Dengan fermentasi urea/jamur (3–4 minggu): palatabilitas meningkat dan BK dapat ≤25% ransum. Gunakan hanya sebagai roughage — bukan sumber energi atau protein.',
    },
    harga: {
      estimasiAI: 200, hargaMarketplace: 150,
      satuan: 'per kg (harga transportasi)',
      supplier: 'Pabrik PKS sekitar (sering gratis, hanya biaya angkut)',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: [
        'Alimon, A.R. & Hair-Bejo, M. (1995) — Feeding systems based on oil palm by-products, FAO',
        'Jayanegara, A. et al. (2017) — Palm by-products as livestock feed in Indonesia, J. Indonesian Trop. Anim. Agric.',
        'Feedipedia (2023) — Oil palm empty fruit bunches (Elaeis guineensis), INRA-CIRAD-AFZ-FAO',
        'Rahman, M.M. et al. (2013) — EFB fermentation for ruminant feed, Asian-Aust. J. Anim. Sci.',
      ],
      sumberData: 'Feedipedia dan Alimon & Hair-Bejo (1995); nilai pasca-sterilisasi pabrik PKS Indonesia',
      catatan: 'NDF ±78% adalah salah satu tertinggi dari limbah pertanian tropis. Fermentasi dengan Trichoderma sp. selama 4 minggu dapat menurunkan NDF menjadi ±58% dan meningkatkan PK menjadi ±5%. Tanpa pengolahan, gunakan hanya sebagai mulsa lahan atau bahan biogas.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '♻️', text: 'TKKS adalah roughage ekstrem murah — NDF 78% menjadikannya sumber serat kasar untuk menjaga pH rumen pada ransum tinggi konsentrat. Namun kecernaan alami sangat rendah; nilai pakan nyata baru muncul setelah fermentasi.' },
      { type: 'kelebihan', icon: '✅', text: 'Tersedia hampir gratis di sekitar pabrik PKS. Volume sangat besar — tidak akan kehabisan stok. Fermentasi yang baik dapat meningkatkan nilai nutrisi secara signifikan (PK dan kecernaan naik).' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tanpa fermentasi: palatabilitas sangat buruk dan ternak menolak. Protein sangat rendah (3% BK). Lignin tinggi menghambat kecernaan enzim rumen. Tidak cocok sebagai sumber energi maupun protein.' },
      { type: 'kombinasi', icon: '🔗', text: 'TKKS fermentasi (25%) + PKM/PKE (25%) + Pelepah Sawit (25%) + Konsentrat Energi (25%) = ransum sapi potong berbiaya rendah di area pabrik PKS. Tambahkan urea (1%) untuk meningkatkan NPN rumen.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan TKKS tanpa pencacahan dan fermentasi — ternak tidak akan mengonsumsinya. Resiko tersedak pada TKKS segar. Fermentasi tidak sempurna menghasilkan asam laktat berlebih yang mengganggu rumen.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk roughage lebih praktis: Pelepah Sawit Segar (tidak perlu fermentasi, palatabilitas lebih baik). TKKS lebih cocok digunakan sebagai media biogas atau mulsa sawit daripada pakan langsung tanpa pengolahan.' },
    ],
  },

  // ── 6. Cangkang Inti Sawit ────────────────────────────────────────────────────
  'cangkang-inti-sawit': {
    deskripsi: 'Kulit keras yang membungkus inti sawit, dihasilkan dari proses pemecahan biji di pabrik pengolahan. Serat dan lignin sangat tinggi; nilai pakan sangat rendah. Umumnya digunakan sebagai bahan bakar biomassa, media jalan perkebunan, atau campuran pakan dalam jumlah sangat terbatas.',
    alias: 'Palm Kernel Shell, PKS, Palm Shell, Cangkang Sawit, Tempurung Biji Sawit',
    asal: 'Cangkang keras (endocarp) biji buah kelapa sawit yang dihasilkan dari proses pemecahan biji (cracking) di pabrik pengolahan inti sawit atau pabrik PKS',
    habitat: 'Dihasilkan di pabrik PKS dan pabrik pengolahan inti sawit seluruh Indonesia; tersedia berlimpah terutama di Sumatera dan Kalimantan',
    bagianDimanfaatkan: 'Lapisan endocarp keras berwarna coklat-hitam yang menyelimuti inti sawit; dipisahkan dari inti menggunakan mesin cracker dan claybath',
    metodePengolahan: 'Untuk pakan: harus digiling sangat halus dan dicampur dalam proporsi sangat kecil (<5%) sebagai pengisi serat. Sebagian besar digunakan sebagai bahan bakar biomassa atau media jalan di perkebunan.',
    ketersediaan: 'Sangat berlimpah di sekitar pabrik PKS dan pabrik pengolahan inti sawit; harga sangat murah; biasanya dijual sebagai bahan bakar boiler atau diekspor',
    kelebihan: 'Harga sangat murah; tersedia berlimpah; BK sangat tinggi (92%) — stabil disimpan; dapat digunakan sebagai media jalan/lahan sawit dan bahan bakar biomassa',
    kekurangan: 'NDF sangat tinggi (88%) dengan lignin sangat tinggi (>40%) — hampir tidak bisa dicerna; TDN sangat rendah (25%); protein sangat rendah (2%); palatabilitas sangat buruk; nilai pakan sangat terbatas',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 2.0, sk: 62.0, lk: 1.5, abu: 3.5, betn: 31.0,
      tdn: 25, me: 1000,
      ndf: 88.0, adf: 72.0,
      ca: 0.12, p: 0.04, mg: 0.05, na: 0.02, k: 0.20, cl: 0.05, s: 0.03,
      vitamin: 'Tidak ada vitamin signifikan; bahan inert biomassa',
      mineral: 'Semua mineral sangat rendah; nilai pakan mineral hampir nol. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Potong'],
      programCocok: ['Penggemukan'],
      catatan: 'Gunakan HANYA sebagai sumber serat pengisi (bulking agent) dalam jumlah sangat terbatas (<5% BK ransum). Wajib digiling halus sebelum dicampur formula. Ternak tidak akan mengonsumsi dalam bentuk utuh. Nilai ekonomis pakan jauh lebih rendah dibanding nilai bahan bakar biomassanya.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 250,
      satuan: 'per kg',
      supplier: 'Pabrik PKS / Pabrik pengolahan inti sawit / Pengepul biomassa sawit',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Palm kernel shells (Elaeis guineensis), INRA-CIRAD-AFZ-FAO',
        'Jayanegara, A. et al. (2017) — Palm by-products as livestock feed in Indonesia, J. Indonesian Trop. Anim. Agric.',
        'Alimon, A.R. & Hair-Bejo, M. (1995) — Feeding systems based on oil palm by-products, FAO',
      ],
      sumberData: 'Feedipedia dan Jayanegara et al. (2017); data lignin dari analisis Van Soest pabrik PKS Sumatera',
      catatan: 'NDF 88% dan ADF 72% merupakan salah satu tertinggi dari semua bahan pakan yang diketahui. Lignin diperkirakan >40% ADF — hampir tidak ada kecernaan fermentatif di rumen. Rekomendasi utama: gunakan sebagai bahan bakar biomassa, bukan pakan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🪵', text: 'Cangkang inti sawit adalah bahan berlignoselulosa ekstrem — NDF 88%, lignin >40% ADF. Kegunaannya sebagai pakan sangat terbatas: hanya sebagai bulking agent serat inert dalam formula konsentrat, <5% BK.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga sangat murah, BK tinggi (92%) — stabil disimpan. Satu-satunya kelebihan sebagai pakan adalah kemampuannya menambah bulk serat tanpa mengganggu neraca nutrisi lain jika digunakan <5%.' },
      { type: 'kekurangan', icon: '⚠️', text: 'TDN hanya 25% dan protein 2% BK — hampir tidak ada nilai nutrisi nyata. Lignin sangat tinggi mengunci selulosa dari akses enzim rumen. Palatabilitas sangat buruk — ternak menolak.' },
      { type: 'kombinasi', icon: '🔗', text: 'Jika digunakan: campur <5% BK dalam formula konsentrat padat (mash/pellet). Tidak ada kombinasi yang membuatnya efisien sebagai sumber nutrisi. Lebih baik dikombinasikan dengan PKM/PKE dan hijauan untuk melengkapi serat dari sumber yang lebih bergizi.' },
      { type: 'peringatan', icon: '🚨', text: 'JANGAN gunakan lebih dari 5% BK ransum. Penggunaan berlebihan menyebabkan blokade saluran pencernaan karena lignin tidak dapat dicerna. Jangan berikan utuh — wajib giling halus sebelum dicampur formula.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk sumber serat: TKKS fermentasi (lebih baik) atau Pelepah Sawit Segar (jauh lebih palatabel). Cangkang inti sawit jauh lebih bernilai sebagai bahan bakar biomassa pabrik dibanding pakan ternak.' },
    ],
  },

  // ── 7. Serat Perasan Sawit ────────────────────────────────────────────────────
  'serat-perasan-sawit': {
    deskripsi: 'Serat mesokarp buah sawit sisa pemerasan minyak di pabrik CPO (Crude Palm Oil). Mengandung serat kasar tinggi (NDF ±68%) dan lemak residu ±5–6% BK yang tidak terperas sempurna. Digunakan sebagai sumber serat dan energi dalam ransum ruminansia terutama di sekitar pabrik PKS.',
    alias: 'Palm Pressed Fiber, PPF, Palm Mesocarp Fiber, Serabut Mesokarp, Ampas Serat Sawit',
    asal: 'Serat mesokarp buah sawit yang tersisa setelah minyak diekstrak melalui pemerasan di screw press pabrik CPO; dihasilkan sekitar 130–150 kg per ton TBS',
    habitat: 'Dihasilkan di seluruh pabrik PKS Indonesia; tersedia berlimpah di Sumatera (Riau, Sumut) dan Kalimantan (Kaltim, Kalbar)',
    bagianDimanfaatkan: 'Serat mesokarp (lapisan daging buah) setelah diekstrak minyaknya; mengandung serat selulosa, hemiselulosa, dan sisa minyak tidak terperas',
    metodePengolahan: 'Dapat diberikan langsung segar dari pabrik (masih hangat, palatabilitas lebih baik); atau dikeringkan untuk penyimpanan. BK segar ±35–40%, setelah dikeringkan ±90%. Tidak memerlukan fermentasi seperti TKKS.',
    ketersediaan: 'Sangat berlimpah di sekitar pabrik PKS — tersedia sepanjang tahun; harga sangat murah; kadang tersedia gratis atau dengan harga nominal. Kualitas konsisten karena merupakan produk samping pabrik yang terstandardisasi.',
    kelebihan: 'Lemak residu memberikan energi ekstra melebihi roughage biasa; lebih palatabel dibanding TKKS; tersedia konsisten dari pabrik; harga sangat murah; tidak perlu fermentasi; kandungan mineral cukup baik untuk limbah industri',
    kekurangan: 'Serat masih tinggi (NDF ±68%); protein rendah (4–5% BK); kecernaan terbatas; kadar air tinggi jika segar (60–65%) sehingga perlu banyak secara bobot; dapat cepat basi jika disimpan >48 jam',
    bentuk: ['Segar', 'Kering'],
    nutrisi: {
      bk: 91, kadarAir: 9,
      pk: 4.5, sk: 33.0, lk: 5.5, abu: 5.0, betn: 52.0,
      tdn: 46, me: 1840,
      ndf: 68.0, adf: 47.0,
      ca: 0.35, p: 0.09, mg: 0.15, na: 0.04, k: 0.80, cl: 0.10, s: 0.08,
      vitamin: 'Mengandung sisa beta-karoten dan vitamin E dari mesokarp yang tidak terperas sempurna; jumlah lebih rendah dibanding mesokarp segar',
      mineral: 'Ca dan K cukup tinggi; Ca:P ratio ±4:1 — perlu suplementasi P. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      catatan: 'Berikan segar dalam 48 jam atau keringkan untuk penyimpanan. Batasi ≤30% BK ransum. Kombinasikan dengan sumber protein (PKM, bungkil kedelai) dan mineral. Jika segar: nilai nutrisi lebih baik tapi volume besar karena BK rendah. Jika kering: lebih praktis, nutrisi per kg BK sama.',
    },
    harga: {
      estimasiAI: 600, hargaMarketplace: 500,
      satuan: 'per kg kering',
      supplier: 'Pabrik PKS sekitar / Pedagang limbah sawit',
      updatedAt: '05 Jul 2026',
    },
    referensi: {
      literatur: [
        'Alimon, A.R. & Hair-Bejo, M. (1995) — Feeding systems based on oil palm by-products, FAO',
        'Feedipedia (2023) — Palm oil mill fiber (Elaeis guineensis), INRA-CIRAD-AFZ-FAO',
        'Wan Zahari, M. et al. (2004) — Palm by-products for ruminants, MARDI Malaysia',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia dan Alimon & Hair-Bejo (1995); nilai BK kering dari analisis laboratorium pabrik PKS Sumatera',
      catatan: 'Kadar lemak bervariasi (3–8% BK) tergantung efisiensi screw press pabrik. Press dengan efisiensi rendah meninggalkan lebih banyak minyak di serat — nilai energi lebih tinggi namun mengindikasikan loss minyak pabrik yang besar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Serat perasan sawit adalah roughage berlemak — NDF 68% memberikan serat rumen, sementara lemak residu (5,5% BK) menambah kontribusi energi melebihi jerami biasa (TDN ±46% vs. jerami padi ±42%).' },
      { type: 'kelebihan', icon: '✅', text: 'Harga sangat murah di sekitar pabrik PKS. Palatabilitas lebih baik dari TKKS dan cangkang. Tidak perlu fermentasi — dapat diberikan langsung. Lemak residu memberikan ekstra energi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Serat masih tinggi (NDF 68%) — kecernaan terbatas. Protein rendah (4,5% BK). Jika segar (BK 35%): volume konsumsi sangat besar. Cepat basi dalam 48 jam kondisi segar tropis.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi efektif: PPF (30%) + PKM atau PKE (25%) + Pelepah Sawit (20%) + Konsentrat Energi + Mineral. Formula berbasis produk samping sawit yang ekonomis untuk sapi potong di sentra PKS.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan PPF segar yang sudah >48 jam — fermentasi spontan menghasilkan asam butirat dan amonia yang menurunkan palatabilitas drastis. Simpan kering di tempat berventilasi jika tidak segera digunakan.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk roughage lebih palatabel: Pelepah Sawit Segar (lebih disukai ternak). Untuk energi lebih tinggi: tambahkan Minyak Sawit Feed Grade (5% BK) ke dalam formula berbasis PPF.' },
    ],
  },

  // ── 8. Bungkil Inti Sawit (PKM) ───────────────────────────────────────────────
  'bungkil-inti-sawit': {
    deskripsi: 'Residu padat dari ekstraksi minyak inti sawit secara solvent (pelarut). Protein 14–18%, serat NDF ±73%; suplemen protein dan serat ekonomis untuk ruminansia. Merupakan produk samping industri oleokimia yang tersedia berlimpah di Indonesia dan diperdagangkan internasional.',
    alias: 'Palm Kernel Meal, PKM, Palm Kernel Cake, Bungkil Sawit, Meal Inti Sawit',
    asal: 'Residu padat inti sawit setelah ekstraksi minyak menggunakan pelarut (solvent extraction) di pabrik pengolahan inti sawit; lemak residual rendah (1–3%)',
    habitat: 'Diproduksi di pabrik pengolahan minyak inti sawit (PKMO) di Indonesia, Malaysia, dan Papua Nugini; Indonesia adalah produsen PKM terbesar kedua dunia',
    bagianDimanfaatkan: 'Padatan kering inti sawit setelah minyak diekstrak dengan pelarut heksan; BK ±90%, protein ±16%, lemak ±2%',
    metodePengolahan: 'Diberikan langsung sebagai komponen ransum; dapat digiling menjadi tepung halus; biasanya tersedia dalam bentuk tepung atau pellet dari pabrik; tidak memerlukan pengolahan tambahan sebelum digunakan',
    ketersediaan: 'Tersedia luas di seluruh Indonesia; diperdagangkan di pasar pakan nasional dan internasional; harga relatif stabil; tersedia dalam kemasan karung 50 kg hingga curah ton',
    kelebihan: 'Protein cukup tinggi (16% BK) untuk bahan lokal; harga lebih murah dari bungkil kedelai; sumber serat sekaligus protein; tersedia sepanjang tahun; dapat disimpan lama (BK ±90%); palatabilitas baik untuk ruminansia',
    kekurangan: 'NDF sangat tinggi (73%) — membatasi penggunaan pada unggas; asam amino tidak seimbang (rendah lisin); bukan sumber protein bypass rumen yang baik; protein menurun jika dipanaskan berlebihan',
    bentuk: ['Kering', 'Tepung'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 16.0, sk: 18.0, lk: 2.5, abu: 5.5, betn: 58.0,
      tdn: 65, me: 2600,
      ndf: 73.0, adf: 44.0,
      ca: 0.28, p: 0.55, mg: 0.22, na: 0.08, k: 0.62, cl: 0.06, s: 0.28,
      vitamin: 'Sangat rendah vitamin larut lemak; sedikit vitamin B kompleks; tidak signifikan sebagai sumber vitamin',
      mineral: 'P cukup tinggi (0,55% BK); Ca:P ratio terbalik (0,5:1) — perlu suplementasi Ca. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      catatan: 'Batasi ≤30% BK ransum. Suplementasi Ca wajib (Ca:P PKM sangat rendah). Kombinasikan dengan hijauan berserat tinggi untuk menyeimbangkan rumen. Untuk sapi perah: maksimal 20% ransum agar tidak menekan protein susu. Gunakan bersama Urea (1%) untuk meningkatkan NPN rumen jika diperlukan.',
    },
    harga: {
      estimasiAI: 2800, hargaMarketplace: 2700,
      satuan: 'per kg',
      supplier: 'Pabrik pakan / Distributor bahan pakan / PKS terintegrasi',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Sundu, B. et al. (2006) — Palm kernel meal in livestock diets: a review, World\'s Poultry Sci. J.',
        'Wan Zahari, M. et al. (2004) — Palm kernel expeller for ruminants, MARDI Malaysia',
        'Feedipedia (2023) — Palm kernel meal, solvent extracted (Elaeis guineensis), INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'Feedipedia dan Sundu et al. (2006); nilai mineral dari analisis rata-rata 5 PKM Indonesia oleh BPTP',
      catatan: 'PK bervariasi 14–18% BK tergantung kualitas biji dan efisiensi ekstraksi. PKM solvent (NDF ±73%) berbeda dari PKE ekspeller (NDF ±68%) karena lemak residual lebih rendah namun serat relatif sama tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'PKM (Bungkil Inti Sawit solvent) adalah sumber protein-serat ganda untuk ruminansia — PK 16% BK dan NDF 73% menjadikannya penyumbang protein sekaligus roughage dalam satu bahan. Harga jauh lebih murah dari bungkil kedelai.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein 16% BK cukup untuk suplemen protein sapi potong dan kambing. Harga lebih murah dibanding bungkil kedelai (±30%). Tersedia sepanjang tahun di seluruh Indonesia. BK tinggi (90%) — stabil disimpan 3–6 bulan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'NDF 73% sangat tinggi — tidak cocok untuk unggas dan monogastrik. Asam amino tidak seimbang (defisien lisin dan metionin). Ca:P terbalik (0,5:1) — wajib suplementasi Ca setiap formulasi menggunakan PKM.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi standar: PKM (20–25%) + Jagung Giling atau Dedak (energi) + Kapur/Kalsit (Ca balancer) + Mineral Premix + Hijauan (50%). PKM + Pelepah Sawit = ransum ekonomis berbasis produk sawit.' },
      { type: 'peringatan', icon: '🚨', text: 'Ca:P ratio PKM hanya 0,5:1 — jauh di bawah kebutuhan ternak (1,5–2:1). Penggunaan PKM tanpa suplementasi Ca menyebabkan hipokalsemia, terutama pada sapi perah laktasi dan ternak bunting.' },
      { type: 'alternatif', icon: '🔄', text: 'PKE (Bungkil Ekspeller) memiliki lemak lebih tinggi (8%) dan energi lebih baik — pilih PKE jika tersedia dan harga setara. Bungkil Kedelai untuk protein dan asam amino lebih lengkap namun lebih mahal.' },
    ],
  },

  // ── 9. Bungkil Ekspeller Inti Sawit (PKE) ─────────────────────────────────────
  'bungkil-ekspeller-inti-sawit': {
    deskripsi: 'Residu padat dari ekstraksi minyak inti sawit secara mekanis (ekspeller). Lemak residual lebih tinggi (6–10% BK) dibanding PKM solvent, sehingga energi lebih baik. Protein sedikit lebih rendah (13–16%) namun ME lebih tinggi. Banyak digunakan sebagai komponen ransum ruminansia dan babi di Asia Tenggara.',
    alias: 'Palm Kernel Expeller, PKE, Expeller Palm Kernel Cake, Palm Kernel Cake, PKC',
    asal: 'Residu padat inti sawit setelah ekstraksi minyak secara mekanis menggunakan screw press/ekspeller; lemak residual lebih tinggi dibanding PKM karena proses mekanis tidak seefisien solvent',
    habitat: 'Diproduksi di pabrik pengolahan inti sawit (PKMO) skala menengah di Indonesia; juga diimpor dari Malaysia; perdagangan aktif di pasar pakan Asia Tenggara',
    bagianDimanfaatkan: 'Padatan inti sawit pasca-ekpeller; BK ±90%, protein ±14%, lemak ±8%; lemak residu lebih tinggi dari PKM memberi kontribusi energi lebih',
    metodePengolahan: 'Diberikan langsung tanpa pengolahan tambahan; tersedia dalam bentuk tepung, serpihan, atau pellet; dapat dicampur langsung dalam formula ransum. Tidak memerlukan fermentasi.',
    ketersediaan: 'Tersedia di pasar pakan nasional; juga diimpor dari Malaysia; harga sedikit lebih tinggi dari PKM namun energi lebih baik; stok relatif stabil sepanjang tahun',
    kelebihan: 'Energi lebih tinggi dari PKM (lemak 8% vs 2,5%); protein cukup tinggi (14%); palatabilitas baik; tidak perlu pengolahan; dapat disimpan lama; lebih fleksibel digunakan dibanding PKM di formulasi ruminansia',
    kekurangan: 'Lemak tinggi membatasi penggunaan pada unggas; NDF masih tinggi (68–70%); asam amino tidak seimbang (defisien lisin); Ca:P ratio tidak seimbang; kualitas bervariasi antar produsen',
    bentuk: ['Kering', 'Tepung'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 14.5, sk: 19.0, lk: 8.0, abu: 5.0, betn: 53.5,
      tdn: 70, me: 2800,
      ndf: 70.0, adf: 42.0,
      ca: 0.27, p: 0.52, mg: 0.20, na: 0.07, k: 0.58, cl: 0.05, s: 0.25,
      vitamin: 'Mengandung tokoferol dan tokotrienol dari lemak residu inti sawit; lebih kaya vitamin E dibanding PKM solvent; tidak signifikan sebagai sumber vitamin utama',
      mineral: 'Profil mineral serupa PKM; P cukup tinggi; Ca:P rendah (0,5:1) — perlu suplementasi Ca. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 35,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau', 'Babi'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      catatan: 'Lebih disarankan daripada PKM untuk ransum penggemukan intensif karena energi lebih tinggi. Batasi ≤35% BK ransum. Suplementasi Ca wajib. Untuk sapi perah: batasi ≤25% agar tidak menekan kualitas susu dari lemak jenuh. Palatabilitas baik sehingga mudah diterima ternak baru.',
    },
    harga: {
      estimasiAI: 3200, hargaMarketplace: 3000,
      satuan: 'per kg',
      supplier: 'Distributor bahan pakan / Agen PKE impor Malaysia / Pabrik pakan lokal',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Wan Zahari, M. et al. (2004) — Palm kernel expeller for ruminants, MARDI Malaysia',
        'Sundu, B. et al. (2006) — Palm kernel meal and expeller in livestock diets, World\'s Poultry Sci. J.',
        'Feedipedia (2023) — Palm kernel expeller (Elaeis guineensis), INRA-CIRAD-AFZ-FAO',
        'Alimon, A.R. & Hair-Bejo, M. (1995) — Oil palm by-products as livestock feed, FAO',
      ],
      sumberData: 'Wan Zahari et al. (2004) dan Feedipedia; rata-rata analisis PKE Indonesia dan Malaysia dari MARDI',
      catatan: 'PK bervariasi 13–16% BK dan LK 6–10% BK tergantung efisiensi mesin ekspeller. PKE dengan LK >8% mengindikasikan efisiensi ekstraksi rendah namun nilai energi pakan lebih tinggi. Bedakan PKE (ekspeller) dari PKM (solvent) dalam formulasi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'PKE (Bungkil Ekspeller) adalah upgrade dari PKM — lemak residu 8% BK meningkatkan ME menjadi 2.800 kcal/kg (vs. 2.600 PKM). Pilihan terbaik untuk formulasi penggemukan sapi berbasis produk sawit.' },
      { type: 'kelebihan', icon: '✅', text: 'Energi lebih tinggi dari PKM berkat lemak residu 8%. Protein 14,5% masih cukup baik. Tersedia dalam berbagai bentuk (tepung, serpihan, pellet). Palatabilitas baik — mudah diterima sapi dan kambing.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Lemak jenuh 8% membatasi penggunaan pada unggas dan monogastrik. NDF 70% masih tinggi. Asam amino tidak lengkap — defisien lisin dan metionin. Ca:P tidak seimbang (0,5:1) perlu koreksi kalsium.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula penggemukan sapi: PKE (25%) + Jagung Giling (25%) + Dedak Padi (15%) + Kapur/Kalsit (1%) + Pelepah Sawit/Hijauan (30%) + Mineral Premix + Garam. Tambah Urea (1%) untuk ransum sapi dewasa.' },
      { type: 'peringatan', icon: '🚨', text: 'Ca:P PKE hanya 0,5:1 — sama seperti PKM, wajib suplementasi Ca di setiap formula. Pada sapi perah: lemak laurat tinggi dapat menekan produksi susu protein — batasi ≤25% dan monitor kualitas susu.' },
      { type: 'alternatif', icon: '🔄', text: 'PKM untuk formulasi serat-protein lebih ekonomis (lemak lebih rendah). Bungkil Kedelai untuk protein dan asam amino lengkap (lebih mahal). PKE adalah titik tengah optimal untuk ruminansia di sentra sawit.' },
    ],
  },

  // ── 10. Lumpur Sawit ──────────────────────────────────────────────────────────
  'lumpur-sawit': {
    deskripsi: 'Padatan yang diendapkan dari limbah cair pabrik sawit (POME — Palm Oil Mill Effluent). Setelah diendapkan dan dikeringkan, mengandung protein kasar ±12% dan lemak ±10% BK. Sumber protein dan lemak alternatif yang murah namun harus dikeringkan sebelum digunakan sebagai pakan ternak.',
    alias: 'Palm Oil Mill Effluent Sludge, POME Sludge, Palm Sludge, Lumpur PKS, Endapan POME',
    asal: 'Padatan yang mengendap dari air limbah (POME) pabrik PKS setelah proses klarifikasi; mengandung sisa minyak, protein, dan mineral dari proses produksi CPO',
    habitat: 'Dihasilkan di kolam klarifikasi pabrik PKS seluruh Indonesia; tersedia di seluruh sentra pabrik sawit Sumatera dan Kalimantan',
    bagianDimanfaatkan: 'Padatan endapan dari kolam klarifikasi POME setelah dikeringkan (solar drying atau oven drying); BK basah ±20–25%, setelah kering ±88–92%',
    metodePengolahan: 'WAJIB dikeringkan sebelum diberikan — kadar air basah sangat tinggi (75–80%). Pengeringan matahari: 3–5 hari; oven: 60°C selama 24 jam. Dapat disimpan dalam bentuk kering; tidak perlu fermentasi setelah kering.',
    ketersediaan: 'Tersedia berlimpah di sekitar pabrik PKS; kualitas konsisten tergantung proses pabrik; biasanya tersedia dengan harga sangat murah atau gratis; perlu biaya pengeringan sebelum digunakan',
    kelebihan: 'Protein dan lemak cukup tinggi dibanding limbah sawit lainnya; harga sangat murah; sumber energi dan protein alternatif yang tersedia berlimpah di sentra pabrik; kandungan mineral cukup lengkap',
    kekurangan: 'Harus dikeringkan sebelum digunakan — biaya energi pengeringan cukup tinggi; abu sangat tinggi (22% BK) mengurangi nilai nutrisi efektif; kualitas sangat bervariasi antar pabrik; kandungan kontaminan minyak mentah dapat mempengaruhi rasa dan palatabilitas',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 12.0, sk: 20.0, lk: 10.0, abu: 22.0, betn: 36.0,
      tdn: 55, me: 2200,
      ndf: 45.0, adf: 28.0,
      ca: 0.50, p: 0.22, mg: 0.28, na: 0.12, k: 0.55, cl: 0.15, s: 0.15,
      vitamin: 'Mengandung sisa tokoferol dan beta-karoten dari minyak; jumlah tidak signifikan sebagai sumber vitamin',
      mineral: 'Abu sangat tinggi (22% BK) mencerminkan kandungan mineral total tinggi; Ca dan Mg cukup baik untuk limbah industri. Nilai atas dasar BK kering.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      catatan: 'Gunakan HANYA setelah dikeringkan hingga BK ≥88%. Batasi ≤20% BK ransum karena abu sangat tinggi (22%) dapat mengganggu palatabilitas dan pencernaan. Kombinasikan dengan hijauan dan sumber energi fermentable. Periksa bau — lumpur yang tengik atau berbau amonia tidak boleh diberikan.',
    },
    harga: {
      estimasiAI: 800, hargaMarketplace: 600,
      satuan: 'per kg kering',
      supplier: 'Pabrik PKS sekitar (sering gratis, biaya angkut dan pengeringan)',
      updatedAt: '01 Jul 2026',
    },
    referensi: {
      literatur: [
        'Alimon, A.R. & Hair-Bejo, M. (1995) — Feeding systems based on oil palm by-products, FAO',
        'Feedipedia (2023) — Palm oil mill effluent sludge (Elaeis guineensis), INRA-CIRAD-AFZ-FAO',
        'Jayanegara, A. et al. (2017) — Palm by-products as livestock feed in Indonesia, J. Indonesian Trop. Anim. Agric.',
      ],
      sumberData: 'Feedipedia dan Alimon & Hair-Bejo (1995); nilai abu dari analisis lumpur PKS kering Sumatera (rata-rata 5 pabrik)',
      catatan: 'Abu sangat tinggi (18–26% BK) adalah karakteristik utama lumpur sawit kering yang membedakannya dari solid sawit (decanter). Kualitas bervariasi signifikan antar pabrik tergantung sistem klarifikasi dan sumber air pabrik.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '💧', text: 'Lumpur sawit kering adalah sumber protein-lemak ganda dari limbah POME — PK 12% dan LK 10% BK memberikan kontribusi nutrisi nyata pada harga sangat murah. Namun abu 22% adalah pembatas utama penggunaannya.' },
      { type: 'kelebihan', icon: '✅', text: 'Tersedia gratis atau sangat murah di sekitar pabrik PKS. Protein (12%) dan lemak (10%) lebih tinggi dari PPF dan TKKS. Mineral Ca dan Mg cukup baik. Dapat disimpan lama setelah kering.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Abu 22% BK sangat tinggi — nilai nutrisi efektif per unit massa jauh berkurang. Wajib dikeringkan sebelum digunakan. Kualitas sangat bervariasi antar pabrik. Dapat mengandung kontaminan logam berat tergantung sumber air pabrik.' },
      { type: 'kombinasi', icon: '🔗', text: 'Lumpur Sawit Kering (15%) + PKE (20%) + Jagung Giling (20%) + Pelepah Sawit (35%) + Mineral = ransum ekonomis sapi potong. Lumpur sawit efektif menambah protein dan lemak tanpa biaya tinggi.' },
      { type: 'peringatan', icon: '🚨', text: 'Periksa kadar logam berat sebelum digunakan pertama kali — pabrik PKS di dekat area tambang berisiko POME terkontaminasi besi (Fe) dan mangan (Mn) berlebih. Jangan berikan lumpur yang berbau amonia tajam — mengindikasikan proteolisis berlebih.' },
      { type: 'alternatif', icon: '🔄', text: 'Solid Sawit (Decanter Solid) memiliki abu lebih rendah dan kualitas lebih konsisten — lebih direkomendasikan dari lumpur sawit jika pabrik menggunakan decanter. PPF lebih palatabel untuk penggunaan hijauan.' },
    ],
  },

  // ── 11. Solid Sawit (Decanter Solid) ─────────────────────────────────────────
  'solid-sawit': {
    deskripsi: 'Padatan yang dipisahkan dari POME (limbah cair pabrik sawit) menggunakan decanter sentrifugal. Kadar air lebih rendah dari lumpur sawit basah; protein kasar ±12% dan lemak ±8% BK. Abu lebih rendah dari lumpur sawit (15–20% vs 22%). Digunakan langsung atau setelah pengeringan parsial.',
    alias: 'Decanter Cake, Palm Decanter Solid, Palm Oil Decanter, Solid POME, Solid PKS',
    asal: 'Padatan dari POME yang dipisahkan menggunakan decanter (centrifugal separator) di pabrik PKS modern; lebih konsisten kualitasnya dibanding lumpur klarifikasi konvensional',
    habitat: 'Dihasilkan di pabrik PKS yang dilengkapi sistem decanter centrifuge; umumnya pabrik PKS skala besar modern di Sumatera dan Kalimantan',
    bagianDimanfaatkan: 'Padatan organik dari POME setelah pemisahan air dan minyak di decanter; mengandung serat mesokarp, protein mikrobial, dan lemak residu',
    metodePengolahan: 'Kadar air keluar decanter ±60–70%; perlu pengeringan matahari 2–3 hari atau oven 60°C selama 18–24 jam untuk mencapai BK ≥85%. Dapat diberikan semi-kering jika dikonsumsi dalam 24–48 jam. Tidak perlu fermentasi.',
    ketersediaan: 'Tersedia di pabrik PKS modern yang dilengkapi decanter; tidak semua pabrik PKS memiliki decanter; pabrik skala besar (>30 ton TBS/jam) umumnya menggunakan decanter; biasanya tersedia murah atau gratis di pabrik',
    kelebihan: 'Kualitas lebih konsisten dari lumpur klarifikasi konvensional; abu lebih rendah (15–20% vs 22%); protein dan lemak setara dengan lumpur; lebih mudah dikeringkan karena kadar air keluar decanter lebih rendah',
    kekurangan: 'Tidak semua pabrik PKS memiliki decanter; masih perlu pengeringan sebelum digunakan; abu masih cukup tinggi (15–20% BK); palatabilitas sedang; kualitas tergantung kondisi decanter pabrik',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 85, kadarAir: 15,
      pk: 12.5, sk: 18.0, lk: 8.0, abu: 20.0, betn: 41.5,
      tdn: 56, me: 2250,
      ndf: 42.0, adf: 26.0,
      ca: 0.48, p: 0.21, mg: 0.25, na: 0.10, k: 0.52, cl: 0.14, s: 0.13,
      vitamin: 'Sisa tokoferol dan beta-karoten dari minyak residu; tidak signifikan sebagai sumber vitamin utama',
      mineral: 'Abu lebih rendah dari lumpur klarifikasi; Ca dan Mg cukup baik; profil mineral lebih seimbang. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      catatan: 'Keringkan hingga BK ≥85% sebelum diberikan. Batasi ≤20% BK ransum karena abu masih tinggi (20%). Lebih direkomendasikan dari lumpur klarifikasi konvensional. Kombinasikan dengan hijauan dan konsentrat energi. Periksa bau dan warna — solid yang baik berwarna coklat muda, tidak berbau busuk.',
    },
    harga: {
      estimasiAI: 600, hargaMarketplace: 500,
      satuan: 'per kg kering',
      supplier: 'Pabrik PKS modern dengan decanter / Distributor bahan pakan lokal',
      updatedAt: '01 Jul 2026',
    },
    referensi: {
      literatur: [
        'Alimon, A.R. & Hair-Bejo, M. (1995) — Feeding systems based on oil palm by-products, FAO',
        'Feedipedia (2023) — Palm oil mill decanter solid (Elaeis guineensis), INRA-CIRAD-AFZ-FAO',
        'Jayanegara, A. et al. (2017) — Palm by-products as livestock feed in Indonesia, J. Indonesian Trop. Anim. Agric.',
        'Wan Zahari, M. et al. (2004) — Palm by-products for ruminants, MARDI Malaysia',
      ],
      sumberData: 'Feedipedia, Wan Zahari et al. (2004), dan Alimon & Hair-Bejo; rata-rata solid decanter pabrik PKS Malaysia dan Indonesia',
      catatan: 'Abu 15–20% BK pada solid decanter lebih rendah dari lumpur klarifikasi (20–26% BK). Kualitas protein dan lemak relatif setara. Pemilihan antara solid decanter dan lumpur klarifikasi tergantung sistem pabrik yang tersedia.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚙️', text: 'Solid Sawit (Decanter) adalah versi lebih bersih dari lumpur sawit — abu lebih rendah (20% vs 22%), NDF lebih rendah (42% vs 45%), kualitas lebih konsisten. Protein dan lemak setara, nilai nutrisi efektif per unit BK sedikit lebih baik.' },
      { type: 'kelebihan', icon: '✅', text: 'Lebih konsisten kualitasnya dibanding lumpur klarifikasi konvensional. Abu lebih rendah = nilai nutrisi per kg lebih efektif. Kadar air keluar decanter lebih rendah = biaya pengeringan lebih hemat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tidak semua pabrik PKS memiliki decanter — ketersediaan terbatas di pabrik skala kecil. Abu masih 20% BK. Masih perlu pengeringan. Palatabilitas sedang — perlu waktu adaptasi untuk ternak baru.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula: Solid Sawit Kering (15–20%) + PKE (20%) + Pelepah Sawit (30%) + Dedak Padi atau Jagung (25%) + Mineral + Garam. Protein 12% + lemak 8% dari solid berkontribusi nutrisi yang cukup signifikan.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan solid sawit basah (kadar air >50%) — fermentasi cepat menghasilkan asam organik yang menurunkan palatabilitas dan dapat mengganggu rumen. Keringkan dulu hingga BK ≥85%.' },
      { type: 'alternatif', icon: '🔄', text: 'Lumpur Klarifikasi (jika pabrik tidak ada decanter) — kualitas lebih bervariasi tapi prinsip nutrisi sama. PPF lebih palatabel namun protein lebih rendah. PKM/PKE lebih praktis dan kualitas terjamin standar pasar.' },
    ],
  },

  // ── 12. Minyak Sawit Mentah (Feed Grade) ────────────────────────────────────
  'minyak-sawit-mentah-pakan': {
    deskripsi: 'Minyak sawit kualitas pakan (off-spec atau free fatty acid tinggi yang tidak memenuhi standar pangan). Densitas energi sangat tinggi (ME >8.500 kcal/kg BK); ditambahkan ≤5% ransum untuk meningkatkan energi, palatabilitas, dan mengurangi debu dalam formula konsentrat.',
    alias: 'Crude Palm Oil Feed Grade, CPO Feed, Palm Acid Oil, Palm Fatty Acid Distillate, PFAD, Minyak Sawit Pakan',
    asal: 'CPO off-spec dengan kadar FFA (asam lemak bebas) >5% atau parameter mutu pangan tidak terpenuhi; dapat berupa PFAD (distilat asam lemak sawit) dari proses refinery minyak sawit pangan',
    habitat: 'Dihasilkan di pabrik refinery minyak sawit; tersedia dari industri minyak goreng yang memproduksi FFA distilat; diperdagangkan di pasar pakan Asia Tenggara',
    bagianDimanfaatkan: 'Minyak CPO kualitas pakan atau PFAD; kandungan asam palmitat (C16:0) dan oleat (C18:1) sangat tinggi; karotenoid dan vitamin E masih cukup tinggi jika belum di-bleach',
    metodePengolahan: 'Diberikan langsung sebagai fat supplement dalam formula konsentrat; dicampur dengan bahan kering menggunakan fat coater atau spray system; perlu tangki penyimpanan tertutup bersuhu ±40°C untuk menjaga cair. Dapat dikombinasikan dengan PKE/PKM sebelum dicampur formula.',
    ketersediaan: 'Tersedia dari pabrik refinery minyak sawit; diperdagangkan dalam tanki atau drum; harga mengikuti harga CPO internasional; tersedia sepanjang tahun di sentra industri sawit Indonesia',
    kelebihan: 'Densitas energi tertinggi dari semua bahan pakan hewani dan nabati lokal (ME >8.500 kcal/kg); meningkatkan palatabilitas dan menekan debu formula; mengurangi heat increment pada ternak (efisiensi energi tinggi); kaya karotenoid dan vitamin E',
    kekurangan: 'Tidak boleh melebihi 5–6% ransum — menghambat fermentasi rumen secara signifikan; lemak jenuh sangat dominan (palmitat + stearat); harga mengikuti pasar CPO yang fluktuatif; memerlukan peralatan fat spray untuk penggunaan skala pabrik',
    bentuk: ['Cair'],
    nutrisi: {
      bk: 99, kadarAir: 1,
      pk: 0.0, sk: 0.0, lk: 99.0, abu: 0.3, betn: 0.7,
      tdn: 95, me: 8500,
      ndf: 0.0, adf: 0.0,
      ca: 0.00, p: 0.00, mg: 0.01, na: 0.01, k: 0.01, cl: 0.01, s: 0.01,
      vitamin: 'Kaya karotenoid (beta-karoten 500–700 ppm pada CPO mentah) dan vitamin E (tokoferol + tokotrienol ±800 mg/kg); kandungan turun drastis setelah proses bleaching/refining',
      mineral: 'Hampir tidak ada mineral — murni lemak. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      catatan: 'Batasi KETAT ≤5% BK ransum (±3–4% lebih aman). Di atas 5%: fermentasi rumen terhambat signifikan, kecernaan serat turun drastis, dan resiko diare meningkat. Campurkan merata ke bahan kering — jangan biarkan menggumpal. Efektif meningkatkan energi ransum tanpa menambah volume.',
    },
    harga: {
      estimasiAI: 11000, hargaMarketplace: 10500,
      satuan: 'per kg',
      supplier: 'Pabrik refinery minyak sawit / Pedagang CPO feed / Distributor bahan pakan industri',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Rev. Ed. (fat supplementation guidelines)',
        'Jenkins, T.C. (1993) — Lipid metabolism in the rumen, J. Dairy Sci. 76:3851–3863',
        'Feedipedia (2023) — Palm oil, crude (Elaeis guineensis), INRA-CIRAD-AFZ-FAO',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, UGM Press',
      ],
      sumberData: 'NRC (2016) untuk nilai energi lemak; Feedipedia untuk profil asam lemak sawit; data karotenoid dari MPOB Malaysia',
      catatan: 'ME 8.500 kcal/kg dihitung menggunakan faktor konversi energi lemak untuk ruminansia (NRC 2016). Nilai karotenoid sangat bervariasi (100–700 ppm) tergantung proses refinery. PFAD memiliki FFA tinggi namun nilai energi setara CPO.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🔥', text: 'CPO Feed Grade adalah booster energi paling efisien — ME 8.500 kcal/kg adalah 2,5× lebih tinggi dari jagung giling. Hanya butuh 3–5% BK ransum untuk meningkatkan energi setara menambahkan 8–12% jagung giling.' },
      { type: 'kelebihan', icon: '✅', text: 'Efisiensi energi tertinggi dari semua bahan lokal. Meningkatkan palatabilitas dan mengurangi debu formula. Kaya karotenoid (pro-vitamin A) pada CPO yang belum direfinery. Heat increment rendah vs. karbohidrat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Batas 5% BK sangat ketat — melebihi batas menyebabkan penghambatan bakter rumen pencerana serat. Lemak jenuh dominan (palmitat 44%, stearat 5%). Memerlukan peralatan khusus untuk pencampuran merata di skala pabrik.' },
      { type: 'kombinasi', icon: '🔗', text: 'CPO Feed (3–5%) + PKM/PKE (protein + serat) + Jagung/Dedak (karbohidrat) + Hijauan (serat rumen) + Mineral = formula penggemukan berenergi tinggi. CPO terutama efektif menaikkan MEm ternak bunting dan menyusui.' },
      { type: 'peringatan', icon: '🚨', text: '⚠️ BATAS KERAS: ≤5% BK ransum. Melebihi 6% total lemak ransum (dari semua sumber): fermentasi rumen kolaps — pH rumen turun, konsumsi pakan turun, depresi serat. Hitung total lemak dari semua sumber pakan dalam formula.' },
      { type: 'alternatif', icon: '🔄', text: 'Minyak Inti Sawit Feed Grade (CPKO) untuk efek antimikroba lebih kuat dari laurat. Lemak bypass rumen (Ca-soap) untuk sapi perah — lebih aman karena tidak mengganggu fermentasi rumen. Bungkil kelapa jika tersedia lokal.' },
    ],
  },

  // ── 13. Minyak Inti Sawit (Feed Grade) ────────────────────────────────────────
  'minyak-inti-sawit-pakan': {
    deskripsi: 'Minyak inti sawit kualitas pakan (CPKO off-spec atau kualitas feed grade). Kaya asam lemak laurat (C12:0 ±48%) dan miristat (C14:0 ±16%). Digunakan sebagai sumber energi lemak lauric yang mendukung kesehatan sistem pencernaan dan imunitas ternak muda.',
    alias: 'Palm Kernel Oil Feed Grade, CPKO Feed, Minyak Inti Sawit, Palm Kernel Fatty Acid',
    asal: 'Minyak yang diekstrak dari inti sawit (Palm Kernel Oil) kualitas pakan; dapat berupa CPKO off-spec atau distilat asam lemak inti sawit dari proses refinery oleokimia',
    habitat: 'Dihasilkan di pabrik pengolahan inti sawit (PKMO) di Indonesia dan Malaysia; diperdagangkan sebagai bahan baku industri sabun, kosmetik, dan pakan ternak',
    bagianDimanfaatkan: 'Minyak yang diekstrak dari inti sawit menggunakan ekspeller atau solvent; kaya asam lemak jenuh rantai menengah (MCFA): laurat (48%) dan miristat (16%)',
    metodePengolahan: 'Diberikan langsung sebagai fat supplement; penyimpanan dalam tangki tertutup bersuhu 25–35°C (titik leleh 25°C — cair di suhu tropis). Dicampur ke ransum menggunakan fat sprayer. Tidak memerlukan pengolahan khusus untuk pakan.',
    ketersediaan: 'Tersedia dari pabrik PKMO di Indonesia; lebih terbatas dari CPO karena volume produksi lebih kecil; diperdagangkan dalam drum atau tanki; harga lebih tinggi dari CPO karena nilai oleokimia lebih tinggi',
    kelebihan: 'Kaya laurat (48%) dan miristat (16%) dengan efek antimikroba nyata; mendukung kesehatan saluran pencernaan ternak muda dan yang sedang stres; energi sangat tinggi (ME ±8.700 kcal/kg); titik leleh rendah (25°C) — cair alami di iklim tropis',
    kekurangan: 'Harga lebih tinggi dari CPO Feed; volume produksi lebih terbatas; batas penggunaan sama ketat dengan CPO (≤5% BK); lemak jenuh sangat dominan; tidak cocok untuk unggas dalam proporsi tinggi',
    bentuk: ['Cair'],
    nutrisi: {
      bk: 99, kadarAir: 1,
      pk: 0.0, sk: 0.0, lk: 99.0, abu: 0.2, betn: 0.8,
      tdn: 95, me: 8700,
      ndf: 0.0, adf: 0.0,
      ca: 0.00, p: 0.00, mg: 0.01, na: 0.01, k: 0.01, cl: 0.01, s: 0.01,
      vitamin: 'Vitamin E (tokotrienol ±60 mg/kg) lebih rendah dari CPO mentah karena proses ekstraksi; tidak signifikan sebagai sumber vitamin',
      mineral: 'Hampir tidak ada mineral — murni lemak. Profil asam lemak: C12:0 (laurat) 48%, C14:0 (miristat) 16%, C16:0 (palmitat) 9%, C18:0 (stearat) 3%, C18:1 (oleat) 15%. Nilai atas dasar BK.',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Anak Sapi', 'Anak Kambing'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      catatan: 'Batasi ≤5% BK ransum (sama seperti CPO). Terutama efektif untuk ternak muda (anak sapi, anak kambing) sebagai sumber energi dan antimikroba alami. Campurkan ke susu pengganti atau konsentrat starter. Efek laurat terhadap patogen Gram-positif (Cl. perfringens) membantu kesehatan saluran cerna ternak muda.',
    },
    harga: {
      estimasiAI: 13000, hargaMarketplace: 12500,
      satuan: 'per kg',
      supplier: 'Pabrik PKMO / Industri oleokimia berbasis inti sawit / Distributor pakan ternak spesialis',
      updatedAt: '05 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Palm kernel oil (Elaeis guineensis), INRA-CIRAD-AFZ-FAO',
        'Isaacs, C.E. & Thormar, H. (1991) — Lauric acid and fatty acid effects on enveloped viruses, Ann. N.Y. Acad. Sci.',
        'Jenkins, T.C. (1993) — Lipid metabolism in the rumen, J. Dairy Sci. 76:3851–3863',
        'Wan Zahari, M. et al. (2004) — Palm by-products for ruminants, MARDI Malaysia',
      ],
      sumberData: 'Feedipedia; profil asam lemak CPKO dari MPOB Malaysia; nilai antimikroba laurat dari Isaacs & Thormar (1991)',
      catatan: 'ME 8.700 kcal/kg dihitung berdasarkan nilai energi bruto lemak (9 kcal/g) dengan koreksi kecernaan ruminansia. CPKO lebih kaya MCFA (C8–C14) dibanding CPO yang didominasi LCFA (C16–C18).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🛡️', text: 'Minyak Inti Sawit adalah fat supplement unik yang menggabungkan energi sangat tinggi (ME 8.700 kcal/kg) dengan efek antimikroba dari laurat (48%) — mendukung kesehatan saluran cerna ternak muda sekaligus meningkatkan densitas energi ransum.' },
      { type: 'kelebihan', icon: '✅', text: 'Laurat (C12:0) dan miristat (C14:0) memiliki efek antimikroba terhadap bakteri patogen Gram-positif (Clostridiaceae) — mendukung kesehatan saluran cerna anak sapi dan kambing. Titik leleh rendah (25°C) — cair alami di iklim tropis.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga lebih tinggi dari CPO Feed (±Rp 2.000/kg selisih). Batas penggunaan sama ketat (≤5% BK). Efek antimikroba laurat juga berpotensi mengganggu bakteri rumen yang menguntungkan jika melebihi batas.' },
      { type: 'kombinasi', icon: '🔗', text: 'CPKO (3–5%) + Susu Sapi (milk replacer) + Konsentrat Starter = ransum optimal anak sapi pra-weaning. Untuk ternak dewasa: CPKO (3%) + PKM/PKE + Hijauan = formula penggemukan berenergi tinggi berbasis produk sawit.' },
      { type: 'peringatan', icon: '🚨', text: 'Sama seperti CPO: batas keras ≤5% total lemak tambahan per BK ransum. Kombinasi CPKO + CPO + lemak lain tidak boleh melebihi 5% BK total. Laurat berlebihan pada ruminansia dewasa menghambat metanogen rumen yang berguna.' },
      { type: 'alternatif', icon: '🔄', text: 'CPO Feed Grade lebih ekonomis jika efek antimikroba tidak diperlukan. Ca-soap (rumen bypass fat) untuk sapi perah produksi tinggi — tidak mengganggu fermentasi rumen. Coconut Oil juga kaya laurat namun harga lebih mahal.' },
    ],
  },

};

// ─── Lookup Function ──────────────────────────────────────────────────────────

export function getKelapaSawitDetail(id: string): KelapaSawitDetailItem | undefined {
  const base = getKelapaSawitById(id);
  const detail = KELAPA_SAWIT_DETAIL[id];
  if (!base || !detail) return undefined;
  return { ...base, ...detail };
}
