// ─── MP-003 — Detail Data: Jagung ─────────────────────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for every Jagung item.
// Merged with base JagungItem from jagungData.ts via getJagungDetail().

import { getJagungById, getJagungList, type JagungItem } from './jagungData';

type DetailFields = Required<
  Pick<
    JagungItem,
    'namaLatin' | 'asalBahan' | 'bentuk' | 'nutrisi' | 'penggunaan' | 'harga' | 'referensi' | 'aiInsight'
  >
>;

const JAGUNG_DETAIL: Record<string, DetailFields> = {

  // ── 1 ──────────────────────────────────────────────────────────────────────
  'jagung-pipil': {
    namaLatin: 'Zea mays L.',
    asalBahan: 'Biji tanaman jagung matang yang telah dipisahkan dari tongkol',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 87, kadarAir: 13,
      pk: 8.5, sk: 2.2, lk: 3.8, abu: 1.4, betn: 71.1,
      tdn: 82, me: 3380,
      ndf: 9.5, adf: 3.5,
      ca: 0.02, p: 0.28, mg: 0.12, na: 0.02, k: 0.38, cl: 0.05, s: 0.12,
      vitamin: 'Vitamin E (±15 mg/kg), Pro-vitamin A (karotenoid), Thiamin (B1), Niasin',
      mineral: 'Kaya P organik (fitat); rendah Ca — perlu suplementasi kalsium',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 70,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Unggas'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      catatan: 'Giling atau pecahkan sebelum diberikan ke ruminansia untuk meningkatkan kecernaan pati. Simpan di tempat kering (KA ≤14%) untuk mencegah pertumbuhan jamur dan aflatoksin.',
    },
    harga: {
      estimasiAI: 5500, hargaMarketplace: 5400,
      satuan: 'per kg', supplier: 'Petani lokal / KUD / Pabrik pakan',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia, Gadjah Mada University Press',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Rev. Ed.',
        'Tillman et al. (1998) — Ilmu Makanan Ternak Dasar',
      ],
      sumberData: 'Rata-rata 3 laboratorium pakan Indonesia (BPT Ciawi, LIPI, IPB)',
      catatan: 'Nilai nutrisi dapat bervariasi ±10% tergantung varietas jagung dan kondisi penyimpanan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Sumber energi utama ransum (TDN 82%, ME 3.380 kcal/kg) — komponen terbesar dalam formula penggemukan sapi dan pakan unggas.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas sangat baik, mudah digiling dan dicampur. Tidak membutuhkan pre-treatment khusus. Stabil disimpan hingga 6 bulan pada KA ≤14%.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein rendah (8,5%) dan defisien asam amino lisin-triptofan. Harus selalu dikombinasikan dengan sumber protein. Rendah Ca (0,02%).' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi ideal: Bungkil Kedelai (protein + lisin), Dedak Padi (serat + vitamin B), CGM (protein by-pass rumen), Mineral Premix (Ca, P, Mg).' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan melebihi 70% ransum — pati tinggi berisiko asidosis rumen akut. Selalu periksa kadar aflatoksin sebelum digunakan (batas aman <20 ppb).' },
      { type: 'alternatif', icon: '🔄', text: 'Jika harga tinggi: Jagung Afkir (hemat ±20%), Singkong Kering (energi setara). Jika stok kosong: Sorghum, Ubi Kayu Giling, atau Hominy Feed.' },
    ],
  },

  // ── 2 ──────────────────────────────────────────────────────────────────────
  'jagung-pipil-kering': {
    namaLatin: 'Zea mays L.',
    asalBahan: 'Biji jagung yang dikeringkan hingga kadar air ≤14% sebelum disimpan',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 8.8, sk: 2.1, lk: 3.9, abu: 1.4, betn: 71.8,
      tdn: 83, me: 3400,
      ndf: 9.0, adf: 3.3,
      ca: 0.02, p: 0.29, mg: 0.12, na: 0.02, k: 0.38, cl: 0.05, s: 0.12,
      vitamin: 'Vitamin E (±16 mg/kg), Karotenoid, Thiamin (B1), Niasin, Riboflavin',
      mineral: 'Profil mineral identik jagung pipil; suplementasi Ca wajib',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 70,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Unggas'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      catatan: 'Pilihan terbaik untuk penyimpanan jangka panjang. Giling sebelum diberikan. Beli dalam jumlah besar saat harga panen rendah karena stabilitas penyimpanannya.',
    },
    harga: {
      estimasiAI: 5800, hargaMarketplace: 5700,
      satuan: 'per kg', supplier: 'KUD / Pedagang besar beras & jagung',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
        'SNI 01-3920-1995 — Standar Jagung untuk Pakan Ternak',
      ],
      sumberData: 'Laboratorium pakan IPB dan Balai Penelitian Ternak Ciawi',
      catatan: 'Kadar air ≤14% adalah syarat standar perdagangan. Di atas 14%, resiko aflatoksin meningkat signifikan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Identik jagung pipil namun lebih stabil disimpan. Kandungan BK lebih tinggi (88%) berarti nilai nutrisi per kg lebih konsisten.' },
      { type: 'kelebihan', icon: '✅', text: 'Standar mutu terjamin (SNI); bebas resiko jamur jika disimpan benar. Ideal untuk peternak yang membeli stok 3–6 bulan sekaligus.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga sedikit lebih tinggi dibanding jagung pipil basah. Tetap harus digiling sebelum diberikan ke ruminansia.' },
      { type: 'kombinasi', icon: '🔗', text: 'Cocok dicampur dengan DDGS atau Hominy Feed untuk menambah protein dan lemak tanpa mengubah sumber energi utama.' },
      { type: 'peringatan', icon: '🚨', text: 'Meski kering, simpan di gudang berventilasi baik. Kelembaban udara tinggi bisa menaikkan kadar air selama penyimpanan.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif langsung: Jagung Pipil (jika langsung dipakai), Jagung Giling (siap pakai). Lebih ekonomis dari Jagung Giling pabrikan.' },
    ],
  },

  // ── 3 ──────────────────────────────────────────────────────────────────────
  'jagung-pipil-basah': {
    namaLatin: 'Zea mays L.',
    asalBahan: 'Biji jagung segar langsung dari panen, belum dikeringkan',
    bentuk: ['Butiran', 'Segar'],
    nutrisi: {
      bk: 75, kadarAir: 25,
      pk: 7.5, sk: 2.0, lk: 3.2, abu: 1.3, betn: 61.0,
      tdn: 80, me: 3280,
      ndf: 8.5, adf: 3.0,
      ca: 0.02, p: 0.25, mg: 0.11, na: 0.02, k: 0.35, cl: 0.04, s: 0.10,
      vitamin: 'Vitamin E lebih tinggi dibanding jagung kering karena belum teroksidasi; karotenoid segar',
      mineral: 'Profil mineral serupa jagung kering; kandungan bahan kering lebih rendah',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 60,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing Perah'],
      programCocok: ['Menyusui', 'Indukan', 'Grower'],
      catatan: 'Harus digunakan dalam 1–3 hari setelah panen. Alternatif: buat silase jagung pipil basah (High Moisture Corn Silage) untuk penyimpanan hingga 6 bulan.',
    },
    harga: {
      estimasiAI: 4500, hargaMarketplace: 4300,
      satuan: 'per kg', supplier: 'Petani lokal musim panen',
      updatedAt: '05 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2001) — Nutrient Requirements of Dairy Cattle, 7th Ed.',
        'Huntington et al. (2006) — High Moisture Corn Processing, J. Dairy Sci.',
      ],
      sumberData: 'Data musim panen jagung Juli 2026, Jawa Tengah',
      catatan: 'Nilai nutrisi dasar setara jagung kering; yang berubah adalah BK dan kadar air.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Sumber energi segar dengan palatabilitas premium — sapi perah sangat menyukainya, mendukung produksi susu saat musim panen jagung.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga paling murah saat panen raya. Palatabilitas luar biasa baik; ternak langsung mengonsumsinya tanpa penolakan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Umur simpan sangat pendek (1–3 hari). BK hanya 75% sehingga bobot yang dibutuhkan lebih banyak untuk memenuhi kebutuhan energi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Sangat baik dikombinasikan dengan hijauan kering (hay/jerami) untuk menyeimbangkan kadar air ransum. Tambahkan mineral premix standar.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan tumpuk terlalu lama — fermentasi spontan menurunkan nilai nutrisi dan meningkatkan kadar mikotoksin dalam hitungan jam.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika tidak bisa langsung dipakai: buat silase high moisture corn (HMC) dengan plastik anaerob. Alternatif: jagung pipil kering standar.' },
    ],
  },

  // ── 4 ──────────────────────────────────────────────────────────────────────
  'jagung-giling': {
    namaLatin: 'Zea mays L. (processed)',
    asalBahan: 'Biji jagung pipil kering yang digiling kasar atau halus',
    bentuk: ['Tepung', 'Butiran'],
    nutrisi: {
      bk: 87, kadarAir: 13,
      pk: 8.5, sk: 2.0, lk: 3.8, abu: 1.4, betn: 71.3,
      tdn: 84, me: 3450,
      ndf: 8.0, adf: 3.0,
      ca: 0.02, p: 0.28, mg: 0.12, na: 0.02, k: 0.38, cl: 0.05, s: 0.12,
      vitamin: 'Vitamin E (±12 mg/kg, sedikit berkurang setelah penggilingan), Karotenoid, B-kompleks',
      mineral: 'Identik jagung pipil; penggilingan tidak mengubah profil mineral',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 65,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Unggas', 'Babi'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      catatan: 'Ukuran giling optimal untuk ruminansia: butiran kasar (2–4 mm). Untuk unggas: halus. Jangan giling terlalu halus untuk sapi — resiko bloat dan asidosis.',
    },
    harga: {
      estimasiAI: 6000, hargaMarketplace: 5900,
      satuan: 'per kg', supplier: 'Pabrik pakan / Penggilingan lokal',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Ørskov (1986) — Starch Digestion and Utilization in Ruminants, J. Anim. Sci.',
        'Huntington (1997) — Starch Utilization by Ruminants, J. Anim. Sci.',
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
      ],
      sumberData: 'Data rata-rata penggilingan jagung kasar skala pabrik',
      catatan: 'TDN dan ME lebih tinggi dari jagung pipil utuh karena kecernaan pati meningkat setelah penggilingan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Jagung siap-pakai dengan kecernaan pati lebih tinggi (TDN 84% vs 82% jagung utuh) — pilihan terbaik untuk ransum ternak yang tidak punya fasilitas penggilingan.' },
      { type: 'kelebihan', icon: '✅', text: 'Tidak perlu penggilingan di lapangan. Homogen mudah dicampur formula. Dicernaan lebih tinggi dibanding jagung utuh/pecah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga lebih tinggi ±Rp 500/kg dari jagung pipil. Lebih mudah menyerap kelembaban — simpan rapat dalam kantong tertutup.' },
      { type: 'kombinasi', icon: '🔗', text: 'Cocok sebagai basis formula konsentrat penggemukan bersama Bungkil Kedelai, Premix Mineral, dan Urea (untuk ruminansia dewasa).' },
      { type: 'peringatan', icon: '🚨', text: 'Untuk sapi, gunakan giling kasar (bukan tepung halus). Tepung halus meningkatkan fermentasi rumen dan resiko asidosis sub-akut (SARA).' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih murah: Jagung Pipil + giling sendiri. Jika stok kosong: Hominy Feed (kecernaan serupa, protein sedikit lebih tinggi).' },
    ],
  },

  // ── 5 ──────────────────────────────────────────────────────────────────────
  'jagung-pecah': {
    namaLatin: 'Zea mays L. (damaged)',
    asalBahan: 'Biji jagung yang retak atau pecah dari proses penanganan pascapanen',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 87, kadarAir: 13,
      pk: 8.3, sk: 2.3, lk: 3.7, abu: 1.5, betn: 71.2,
      tdn: 81, me: 3340,
      ndf: 9.8, adf: 3.6,
      ca: 0.02, p: 0.27, mg: 0.12, na: 0.02, k: 0.37, cl: 0.05, s: 0.11,
      vitamin: 'Vitamin E (sedikit lebih rendah dari utuh karena oksidasi di area retak), Karotenoid, B1',
      mineral: 'Identik jagung pipil; tidak ada perbedaan signifikan profil mineral',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 65,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower', 'Pejantan'],
      catatan: 'Nilai nutrisi setara jagung utuh. Gunakan segera setelah dibeli karena permukaan retak lebih rentan terhadap penyerapan air dan pertumbuhan jamur.',
    },
    harga: {
      estimasiAI: 4800, hargaMarketplace: 4600,
      satuan: 'per kg', supplier: 'Pabrik pengolahan jagung / Pedagang besar',
      updatedAt: '06 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
        'USDA Grain Inspection — Corn Grading Standards (referensi pembanding)',
      ],
      sumberData: 'Data komposisi jagung pecah dari sortasi pabrik pakan lokal',
      catatan: 'Digunakan sebagai bahan alternatif jagung utuh dengan selisih harga 10–15% lebih murah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Opsi ekonomis pengganti jagung utuh — nutrisi hampir identik, harga 10–15% lebih murah karena tidak lolos standar grade perdagangan.' },
      { type: 'kelebihan', icon: '✅', text: 'Nilai ekonomi tinggi karena harga lebih murah dengan kandungan energi setara. Cocok untuk peternak yang mengelola biaya pakan ketat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Umur simpan lebih pendek dari jagung utuh — retak memudahkan masuknya jamur. Perlu diperiksa aflatoksin lebih rutin.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan dalam formula yang sama dengan jagung pipil. Tidak ada penyesuaian formulasi — nilai nutrisi dapat digunakan identik.' },
      { type: 'peringatan', icon: '🚨', text: 'Periksa bau dan visual sebelum diberikan. Jagung pecah dengan bau apek atau berjamur harus dibuang — jangan diberikan ke ternak.' },
      { type: 'alternatif', icon: '🔄', text: 'Bisa langsung digantikan dengan Jagung Sortiran atau Jagung Afkir di kelas harga yang sama.' },
    ],
  },

  // ── 6 ──────────────────────────────────────────────────────────────────────
  'jagung-muda': {
    namaLatin: 'Zea mays L. (immature)',
    asalBahan: 'Tanaman jagung yang dipanen sebelum mencapai kematangan biji penuh',
    bentuk: ['Segar', 'Butiran'],
    nutrisi: {
      bk: 30, kadarAir: 70,
      pk: 3.0, sk: 1.5, lk: 1.0, abu: 0.5, betn: 24.0,
      tdn: 68, me: 2800,
      ndf: 14, adf: 8,
      ca: 0.01, p: 0.09, mg: 0.05, na: 0.01, k: 0.25, cl: 0.05, s: 0.05,
      vitamin: 'Karotenoid tinggi (pro-vitamin A), Vitamin C (bahan segar), Vitamin E segar',
      mineral: 'Mineral rendah karena BK rendah; nilai absolut per BK setara jagung matang',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 40,
      targetTernak: ['Sapi Perah', 'Kambing Perah', 'Domba'],
      programCocok: ['Menyusui', 'Indukan', 'Bunting'],
      catatan: 'Karena BK hanya 30%, bobot yang dibutuhkan ~3× lebih banyak dari jagung kering untuk memenuhi kebutuhan energi yang sama. Hitung ransum berdasarkan BK.',
    },
    harga: {
      estimasiAI: 3000, hargaMarketplace: 2800,
      satuan: 'per kg segar', supplier: 'Petani lokal / Pasar tradisional',
      updatedAt: '01 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
        'NRC (2001) — Nutrient Requirements of Dairy Cattle',
      ],
      sumberData: 'Analisis proximate jagung muda segar, BPTP Jawa Tengah',
      catatan: 'Semua nilai nutrisi dihitung atas dasar bahan segar. Konversi ke BK: kalikan ×(100/30) = ×3,33.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Suplemen palatabilitas tinggi untuk sapi perah laktasi — meningkatkan konsumsi BK total ransum berkat kadar air dan gula yang tinggi.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas terbaik di antara semua turunan jagung. Kaya karotenoid dan vitamin segar. Harga sangat murah saat musim panen.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK rendah (30%) — ternak harus mengonsumsi banyak untuk mencapai kebutuhan energi. Tidak bisa disimpan; harus langsung diberikan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan hijauan kering (jerami/hay) agar ransum tidak terlalu basah. Tambahkan konsentrat protein untuk sapi perah.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan jadikan sumber energi tunggal — BK terlalu rendah. Batasi di 40% dari BK ransum total. Berikan segar, bukan fermentasi setengah jalan.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: Tebon Jagung (lebih banyak serat), Rumput Segar, atau Silase Jagung untuk palatabilitas tinggi sepanjang tahun.' },
    ],
  },

  // ── 7 ──────────────────────────────────────────────────────────────────────
  'jagung-afkir': {
    namaLatin: 'Zea mays L. (off-grade)',
    asalBahan: 'Biji jagung yang tidak lolos sortir kualitas pangan manusia',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 85, kadarAir: 15,
      pk: 8.0, sk: 2.5, lk: 3.5, abu: 1.6, betn: 69.4,
      tdn: 78, me: 3200,
      ndf: 10.5, adf: 4.0,
      ca: 0.02, p: 0.26, mg: 0.11, na: 0.02, k: 0.36, cl: 0.05, s: 0.11,
      vitamin: 'Vitamin E (lebih rendah dari jagung normal karena kerusakan fisik), B-kompleks',
      mineral: 'Profil mineral serupa jagung pipil biasa',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 60,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'Wajib uji aflatoksin sebelum digunakan. Batas aman aflatoksin total <20 ppb untuk sapi; <10 ppb untuk sapi perah. Tidak disarankan untuk sapi perah dan ternak bunting tanpa uji lab.',
    },
    harga: {
      estimasiAI: 3500, hargaMarketplace: 3300,
      satuan: 'per kg', supplier: 'Pedagang jagung / Gudang sortasi',
      updatedAt: '05 Jul 2026',
    },
    referensi: {
      literatur: [
        'Permentan No. 65/2007 — Persyaratan Teknis Minimal Pakan Ternak',
        'IARC (2002) — Aflatoxin Classification, IARC Monographs Vol. 82',
      ],
      sumberData: 'Data harga jagung afkir dari pedagang besar Semarang dan Surabaya',
      catatan: 'Gunakan maksimal 50–60% untuk mengantisipasi variabilitas kualitas antar lot.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Pengganti ekonomis jagung standar untuk penggemukan sapi potong — selisih harga ±Rp 2.000/kg dengan nilai nutrisi 90–95% jagung normal.' },
      { type: 'kelebihan', icon: '✅', text: 'Sangat hemat biaya pakan. Tersedia melimpah setelah panen raya. Cocok untuk peternak penggemukan yang mengelola margin ketat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kualitas bervariasi antar lot. Resiko aflatoksin lebih tinggi dari jagung standar — wajib uji sebelum masuk gudang pakan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Campur dengan jagung normal (50:50) untuk menjaga konsistensi kualitas ransum. Tambahkan mineral premix dan suplemen protein standar.' },
      { type: 'peringatan', icon: '🚨', text: 'DILARANG untuk sapi perah laktasi, sapi bunting, dan ternak muda (anak sapi) tanpa uji aflatoksin. Aflatoksin masuk ke susu dan merusak perkembangan fetus.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif berkualitas lebih terjamin: Jagung Sortiran (sedikit lebih mahal, kualitas lebih konsisten), Hominy Feed, atau Corn Screenings.' },
    ],
  },

  // ── 8 ──────────────────────────────────────────────────────────────────────
  'tebon-jagung': {
    namaLatin: 'Zea mays L. (whole plant)',
    asalBahan: 'Seluruh tanaman jagung muda yang dipanen pada fase vegetatif hingga awal pengisian biji',
    bentuk: ['Segar'],
    nutrisi: {
      bk: 25, kadarAir: 75,
      pk: 2.5, sk: 6.0, lk: 0.7, abu: 1.0, betn: 14.8,
      tdn: 55, me: 2200,
      ndf: 55, adf: 30,
      ca: 0.09, p: 0.06, mg: 0.06, na: 0.01, k: 0.30, cl: 0.07, s: 0.05,
      vitamin: 'Karotenoid (pro-vitamin A) tinggi; klorofil dan Vitamin K dari bagian hijau',
      mineral: 'Ca lebih tinggi dari biji; K tinggi karena sifat tanaman hijau',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 50,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Bunting', 'Menyusui', 'Grower'],
      catatan: 'Hitung kebutuhan atas dasar BK (25%). Satu kg tebon setara ~0,25 kg BK. Ideal dicacah (chop) menjadi 2–5 cm sebelum diberikan. Tidak perlu dikeringkan — berikan segar.',
    },
    harga: {
      estimasiAI: 800, hargaMarketplace: 700,
      satuan: 'per kg segar', supplier: 'Petani jagung lokal',
      updatedAt: '01 Jul 2026',
    },
    referensi: {
      literatur: [
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik',
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
      ],
      sumberData: 'BPTP Jawa Tengah — Analisis Pakan Hijauan 2023',
      catatan: 'Kualitas nutrisi sangat dipengaruhi usia panen. Panen pada fase V6–VT memberikan NDF dan protein terbaik.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Hijauan berkualitas tinggi dari tanaman jagung muda — kombinasi serat, protein, dan palatabilitas yang jauh lebih baik dari jerami padi.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga sangat murah (Rp 700–800/kg). Palatabilitas sangat baik. Bisa jadi sumber hijauan utama saat rumput sulit didapat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'BK sangat rendah (25%) — perlu banyak secara bobot. Harus diberikan segar; tidak bisa disimpan >24 jam tanpa pengolahan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan hijauan kering (jerami, hay) untuk menyeimbangkan kadar air. Tambahkan konsentrat energi untuk kebutuhan produksi.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan beri tebon jagung yang sudah layu dan mulai fermentasi — resiko bloat pada ruminansia. Cacah sebelum diberikan untuk mencegah tersedak.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: Silase Tebon Jagung (bisa disimpan bulanan), Rumput Gajah segar, atau Jerami Padi (kualitas lebih rendah tapi lebih murah).' },
    ],
  },

  // ── 9 ──────────────────────────────────────────────────────────────────────
  'tongkol-jagung': {
    namaLatin: 'Zea mays L. (rachis)',
    asalBahan: 'Gagang/tongkol sisa setelah biji jagung dipipil',
    bentuk: ['Kering', 'Butiran'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 2.8, sk: 33, lk: 0.5, abu: 1.6, betn: 50.1,
      tdn: 45, me: 1800,
      ndf: 80, adf: 50,
      ca: 0.12, p: 0.04, mg: 0.04, na: 0.01, k: 0.10, cl: 0.05, s: 0.02,
      vitamin: 'Vitamin sangat rendah; tidak menjadi sumber vitamin yang signifikan',
      mineral: 'Ca relatif lebih tinggi dari biji; P sangat rendah',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong'],
      programCocok: ['Penggemukan'],
      catatan: 'Gunakan hanya sebagai sumber roughage/serat — bukan sumber energi utama. Giling atau cacah sebelum diberikan. Batasi 15–20% ransum agar tidak menggantikan pakan berenergi tinggi.',
    },
    harga: {
      estimasiAI: 500, hargaMarketplace: 450,
      satuan: 'per kg', supplier: 'Pabrik pengolahan jagung / Petani',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
        'Utomo et al. (2013) — Limbah Pertanian sebagai Pakan, UGM Press',
      ],
      sumberData: 'Analisis proksimat tongkol jagung kering, Laboratorium Pakan UNDIP',
      catatan: 'NDF 80% mengindikasikan serat dinding sel sangat tinggi — kecernaan rumen rendah, gunakan sebagai penganjal saja.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Sumber roughage paling murah — berfungsi menjaga rasio hijauan:konsentrat (forage:concentrate ratio) agar rumen tetap sehat.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga sangat murah (Rp 450–500/kg). Tersedia melimpah di sentra jagung. Membantu efisiensi biaya ransum penggemukan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'TDN sangat rendah (45%), protein sangat rendah (2,8%). Tidak bisa menjadi sumber energi maupun protein — murni sebagai sumber serat kasar.' },
      { type: 'kombinasi', icon: '🔗', text: 'Wajib dikombinasikan dengan sumber energi tinggi (jagung giling) dan protein (bungkil kedelai, CGM). Gunakan sebagai pengganti jerami padi.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan melebihi 20% ransum — menggantikan pakan berenergi tinggi akan menurunkan pertambahan bobot badan secara signifikan.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif roughage murah: Jerami Padi, Kulit Jagung, Jerami Jagung (corn stover). Janggel Giling lebih mudah dicampur formula.' },
    ],
  },

  // ── 10 ─────────────────────────────────────────────────────────────────────
  'janggel-jagung': {
    namaLatin: 'Zea mays L. (cob core)',
    asalBahan: 'Inti keras tongkol jagung setelah biji dan serabut dilepas',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 2.5, sk: 35, lk: 0.3, abu: 1.5, betn: 50.7,
      tdn: 42, me: 1700,
      ndf: 84, adf: 52,
      ca: 0.10, p: 0.03, mg: 0.03, na: 0.01, k: 0.08, cl: 0.04, s: 0.02,
      vitamin: 'Hampir tidak ada vitamin signifikan',
      mineral: 'Mineral sangat rendah di semua fraksi',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong'],
      programCocok: ['Penggemukan'],
      catatan: 'Palatabilitas rendah — ternak biasanya tidak mau mengonsumsi dalam bentuk utuh. Harus digiling halus sebelum dicampur formula. Gunakan hanya sebagai pengencer ransum.',
    },
    harga: {
      estimasiAI: 500, hargaMarketplace: 450,
      satuan: 'per kg', supplier: 'Pabrik pengolahan jagung',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
        'Utomo et al. (2013) — Limbah Pertanian sebagai Pakan, UGM Press',
      ],
      sumberData: 'Analisis proksimat janggel jagung, Laboratorium Pakan IPB',
      catatan: 'NDF 84% adalah salah satu tertinggi dari bahan pakan lokal — kecernaan rumen sangat terbatas.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Sumber serat kasar ekstrem (SK 35%, NDF 84%) untuk menjaga pH rumen dalam kondisi ransum tinggi pati.' },
      { type: 'kelebihan', icon: '✅', text: 'Salah satu bahan pakan termurah yang ada. Membantu mencegah asidosis rumen jika digunakan dengan benar dalam ransum tinggi konsentrat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Palatabilitas buruk dalam bentuk utuh. TDN terendah dari semua turunan jagung (42%). Nilai nutrisi sangat terbatas.' },
      { type: 'kombinasi', icon: '🔗', text: 'Efektif hanya setelah digiling dan dicampur formula. Gunakan sebagai pengganti jerami padi giling (kualitas serupa, harga lebih murah di sentra jagung).' },
      { type: 'peringatan', icon: '🚨', text: 'Tidak boleh diberikan utuh — ternak tidak akan memakannya dan beresiko tersedak. Wajib digiling menjadi Janggel Giling sebelum digunakan.' },
      { type: 'alternatif', icon: '🔄', text: 'Lebih praktis menggunakan Janggel Giling (versi olahan). Alternatif roughage: Tongkol Jagung, Kulit Jagung, Jerami Padi.' },
    ],
  },

  // ── 11 ─────────────────────────────────────────────────────────────────────
  'janggel-giling': {
    namaLatin: 'Zea mays L. (ground cob core)',
    asalBahan: 'Janggel jagung yang digiling menjadi tepung kasar untuk kemudahan pencampuran ransum',
    bentuk: ['Tepung'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 2.6, sk: 34, lk: 0.4, abu: 1.5, betn: 50.5,
      tdn: 43, me: 1750,
      ndf: 82, adf: 50,
      ca: 0.11, p: 0.04, mg: 0.03, na: 0.01, k: 0.09, cl: 0.04, s: 0.02,
      vitamin: 'Tidak ada vitamin signifikan',
      mineral: 'Mineral sangat rendah; suplementasi lengkap wajib dilakukan',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong'],
      programCocok: ['Penggemukan'],
      catatan: 'Versi janggel yang lebih praktis — bisa langsung dicampur formula tanpa penggilingan tambahan. Fungsi sama dengan janggel utuh sebagai pengencer dan sumber serat kasar.',
    },
    harga: {
      estimasiAI: 800, hargaMarketplace: 750,
      satuan: 'per kg', supplier: 'Penggilingan pakan lokal',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: ['Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia'],
      sumberData: 'Data penggilingan janggel lokal, Jawa Tengah',
      catatan: 'Nilai nutrisi identik janggel utuh; penggilingan hanya meningkatkan kemudahan pencampuran.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Versi siap-pakai dari janggel jagung — sama fungsinya sebagai sumber serat ekstrem, tetapi sudah digiling sehingga bisa langsung masuk mixer formula.' },
      { type: 'kelebihan', icon: '✅', text: 'Lebih mudah dicampur formula dibanding janggel utuh. Palatabilitas sedikit lebih baik dalam bentuk tepung. Harga masih sangat murah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Nilai energi sangat rendah (TDN 43%). Harus dikombinasikan bahan berenergi tinggi agar tidak menurunkan performa ternak.' },
      { type: 'kombinasi', icon: '🔗', text: 'Campurkan dengan jagung giling (energi), bungkil kedelai (protein), dan premix mineral. Gantikan 10–15% dari komponen serat ransum.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan melebihi 15% ransum. Penggunaan berlebihan menurunkan densitas energi ransum dan memperlambat pertambahan bobot badan.' },
      { type: 'alternatif', icon: '🔄', text: 'Bisa digantikan dengan Corn Bran (profil serat serupa, lebih mudah didapat dari pabrik) atau Jerami Padi Giling.' },
    ],
  },

  // ── 12 ─────────────────────────────────────────────────────────────────────
  'kulit-jagung': {
    namaLatin: 'Zea mays L. (husk)',
    asalBahan: 'Daun pembungkus (kelobot) tongkol jagung',
    bentuk: ['Kering', 'Segar'],
    nutrisi: {
      bk: 85, kadarAir: 15,
      pk: 3.5, sk: 30, lk: 0.5, abu: 3.5, betn: 47.5,
      tdn: 40, me: 1600,
      ndf: 75, adf: 42,
      ca: 0.35, p: 0.05, mg: 0.07, na: 0.02, k: 0.50, cl: 0.08, s: 0.03,
      vitamin: 'Klorofil (jika segar); sedikit karotenoid',
      mineral: 'Ca lebih tinggi dari biji jagung; K cukup tinggi',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong'],
      programCocok: ['Penggemukan'],
      catatan: 'Palatabilitas rendah — ternak sering menolak jika diberikan dalam jumlah banyak. Cacah menjadi ukuran pendek (2–3 cm) untuk meningkatkan konsumsi. Gunakan sebagai substitusi sebagian jerami padi.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 350,
      satuan: 'per kg', supplier: 'Pabrik pengolahan jagung / Petani',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: ['Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia'],
      sumberData: 'Analisis proksimat kelobot jagung kering, BPTP Jawa Timur',
      catatan: 'TDN terendah (40%) di antara semua turunan jagung — gunakan hanya sebagai roughage basal.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Sumber roughage paling murah yang tersedia — pengganti jerami padi saat harga jerami naik di musim kemarau.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga terendah (Rp 350–400/kg). Ca lebih tinggi dari biji jagung (0,35%). Tersedia melimpah di sentra pengolahan jagung.' },
      { type: 'kekurangan', icon: '⚠️', text: 'TDN sangat rendah (40%), palatabilitas buruk. Ternak butuh adaptasi bertahap sebelum menerima dalam jumlah besar.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan sebagai pengganti sebagian jerami padi. Kombinasikan dengan molases untuk meningkatkan palatabilitas (sirami atau semprotkan molases tipis).' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan berikan utuh dalam jumlah besar — resiko tersedak dan palatabilitas sangat buruk. Selalu cacah terlebih dahulu.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif roughage murah: Tongkol Jagung, Janggel Giling, Jerami Padi. Untuk nilai nutrisi lebih baik: Tebon Jagung.' },
    ],
  },

  // ── 13 ─────────────────────────────────────────────────────────────────────
  'corn-gluten-feed': {
    namaLatin: 'Zea mays L. (wet milling by-product)',
    asalBahan: 'Hasil samping proses wet milling jagung — campuran kulit ari, serat, dan steep liquor',
    bentuk: ['Tepung', 'Butiran', 'Pellet'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 20.0, sk: 8.0, lk: 3.0, abu: 5.5, betn: 52.5,
      tdn: 75, me: 3000,
      ndf: 40, adf: 12,
      ca: 0.18, p: 0.75, mg: 0.32, na: 0.06, k: 0.45, cl: 0.10, s: 0.25,
      vitamin: 'Niasin tinggi dari steep liquor; B-kompleks dari fermentasi; Vitamin E sedang',
      mineral: 'Fosfor tinggi (0,75%) — salah satu sumber P terbaik dari limbah industri; perhatikan keseimbangan Ca:P',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Menyusui', 'Grower'],
      catatan: 'Sumber protein dan fosfor yang baik dan ekonomis. Rasio Ca:P sangat rendah (0,24:1) — wajib tambahkan sumber Ca (CaCO3, kapur pertanian). Cocok untuk ruminansia, terbatas untuk unggas.',
    },
    harga: {
      estimasiAI: 3200, hargaMarketplace: 3100,
      satuan: 'per kg', supplier: 'Pabrik tepung jagung / Importir pakan',
      updatedAt: '05 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2016) — Nutrient Requirements of Beef Cattle',
        'AFIA (2015) — Corn Gluten Feed Fact Sheet',
      ],
      sumberData: 'Spesifikasi produk CGF importir lokal dan analisis rata-rata pabrik domestik',
      catatan: 'Kandungan nutrisi bervariasi tergantung proses produksi (wet vs semi-wet). Selalu minta Certificate of Analysis dari supplier.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Suplemen protein-energi-fosfor dari limbah industri — PK 20% + P 0,75% menjadikannya bahan multifungsi yang mengurangi kebutuhan suplemen P terpisah.' },
      { type: 'kelebihan', icon: '✅', text: 'Sumber fosfor terbaik di kelas harga ini. Protein cukup (20%) dan energi baik (TDN 75%). Harga kompetitif dibanding bungkil kedelai.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Rasio Ca:P sangat tidak seimbang (0,24:1) — wajib koreksi kalsium. Variabilitas kualitas antar batch tinggi; minta CoA setiap pembelian.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi ideal: CGF + Kapur Pertanian (CaCO3) untuk koreksi Ca. Bisa menggantikan 50% bungkil kedelai + mengurangi suplemen DCP/MCP.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan gunakan tanpa koreksi Ca — rasio Ca:P 0,24:1 jauh di bawah kebutuhan (minimum 1,5:1). Defisiensi Ca kronik merusak tulang ternak.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif jika CGF tidak tersedia: DDGS (protein lebih tinggi), Dedak Padi (serat + P), atau Bungkil Kedelai (protein lebih tinggi, P lebih rendah).' },
    ],
  },

  // ── 14 ─────────────────────────────────────────────────────────────────────
  'corn-gluten-meal': {
    namaLatin: 'Zea mays L. (wet milling protein concentrate)',
    asalBahan: 'Fraksi protein tinggi dari wet milling jagung setelah pemisahan pati dan serat',
    bentuk: ['Tepung', 'Pellet'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 65.0, sk: 1.0, lk: 2.5, abu: 2.5, betn: 19.0,
      tdn: 85, me: 3500,
      ndf: 6, adf: 2,
      ca: 0.05, p: 0.50, mg: 0.12, na: 0.04, k: 0.18, cl: 0.08, s: 0.70,
      vitamin: 'Xanthophyll tinggi (pigmen kuning — meningkatkan warna kuning telur dan lemak), Vitamin E',
      mineral: 'S tinggi (0,70%) — bisa jadi pembatas penggunaan pada sapi (batas S ransum ≤0,4%)',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 10,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Ayam Petelur'],
      programCocok: ['Penggemukan', 'Menyusui', 'Pejantan'],
      catatan: 'Sumber protein by-pass rumen (rumen undegradable protein/RUP) yang sangat efektif untuk sapi perah dan penggemukan. Harga premium — gunakan secukupnya (5–10% ransum). Kandungan S tinggi — batasi 10% ransum sapi.',
    },
    harga: {
      estimasiAI: 8000, hargaMarketplace: 7800,
      satuan: 'per kg', supplier: 'Importir pakan / Distributor bahan pakan',
      updatedAt: '05 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2001) — Nutrient Requirements of Dairy Cattle',
        'Santos et al. (1998) — Corn Gluten Meal in Dairy Diets, J. Dairy Sci.',
      ],
      sumberData: 'Spesifikasi produk CGM grade 60% protein dari produsen Amerika dan Indonesia',
      catatan: 'CGM grade 60% adalah standar perdagangan. Produk <58% protein dianggap under-specification.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Suplemen protein by-pass rumen premium (RUP ~55% dari total protein) — sangat efektif meningkatkan suplai asam amino ke usus halus sapi perah.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein tertinggi (65%) di antara semua turunan jagung. Xanthophyll meningkatkan warna produk ternak. Serat sangat rendah — cocok untuk ternak apapun.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga premium (Rp 7.800–8.000/kg). Sulfur sangat tinggi (0,70%) — bisa menyebabkan Polioencephalomalacia (PEM) pada sapi jika berlebih.' },
      { type: 'kombinasi', icon: '🔗', text: 'Campurkan dengan Jagung Giling (energi) dan Bungkil Kedelai (protein larut rumen) untuk profil asam amino yang lengkap dan seimbang.' },
      { type: 'peringatan', icon: '🚨', text: 'Batasi KETAT di 10% ransum sapi — kandungan S 0,70% sangat tinggi. Ransum sapi dengan S >0,4% beresiko PEM (kebutaan akibat kerusakan otak).' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif by-pass protein yang lebih murah: Bungkil Kedelai (bypass rendah tapi lebih murah), Tepung Ikan (bypass tinggi, harga serupa).' },
    ],
  },

  // ── 15 ─────────────────────────────────────────────────────────────────────
  'ddgs': {
    namaLatin: 'Zea mays L. (fermentation by-product)',
    asalBahan: 'Hasil samping produksi bioetanol: biji jagung yang difermentasi dan dikeringkan bersama larutan fermentasi',
    bentuk: ['Tepung', 'Butiran', 'Pellet'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 27.0, sk: 8.0, lk: 9.0, abu: 5.5, betn: 39.5,
      tdn: 85, me: 3500,
      ndf: 33, adf: 13,
      ca: 0.22, p: 0.83, mg: 0.34, na: 0.40, k: 0.98, cl: 0.20, s: 0.44,
      vitamin: 'Vitamin E lebih tinggi (tokoferol terkonsentrasi dari fermentasi), B-kompleks dari ragi',
      mineral: 'P tertinggi dari semua turunan jagung (0,83%); K dan Na cukup tinggi; S perlu diperhatikan',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Domba'],
      programCocok: ['Penggemukan', 'Menyusui', 'Grower'],
      catatan: 'Wajib periksa kadar belerang (S) sebelum digunakan untuk sapi. Batas S total ransum sapi ≤0,4% BK. Gunakan 15–20% ransum maksimal untuk sapi potong. Sangat baik untuk domba (toleransi S lebih tinggi).',
    },
    harga: {
      estimasiAI: 6500, hargaMarketplace: 6300,
      satuan: 'per kg', supplier: 'Importir pakan / Produsen bioetanol',
      updatedAt: '06 Jul 2026',
    },
    referensi: {
      literatur: [
        'Belyea et al. (2004) — Nutrient Composition of Corn and Sorghum DDGS, Bioresource Technol.',
        'NRC (2016) — Nutrient Requirements of Beef Cattle',
        'Shurson (2012) — The Role of DDGS in Diets for Livestock and Poultry, AFIA',
      ],
      sumberData: 'Spesifikasi produk DDGS Amerika dan data analisis produsen etanol lokal',
      catatan: 'Variabilitas nutrisi DDGS sangat tinggi antar produsen (PK berkisar 25–30%, Lemak 5–13%). Minta CoA setiap batch.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Suplemen protein-lemak-fosfor tertinggi dari kelas limbah jagung (PK 27%, LK 9%, P 0,83%) — nilai nutrisi per rupiah sangat kompetitif.' },
      { type: 'kelebihan', icon: '✅', text: 'PK 27% + LK 9% + energi tinggi (TDN 85%) dalam satu bahan. P 0,83% adalah tertinggi dari semua turunan jagung. Cocok untuk berbagai kelas ternak.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Variabilitas kualitas SANGAT tinggi antar produsen. S 0,44% bisa mendekati batas aman sapi. Harga bervariasi signifikan tergantung sumber impor.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi ideal: DDGS + Jagung Giling + hijauan kering. Bisa menggantikan 50% Bungkil Kedelai dalam ransum penggemukan sapi.' },
      { type: 'peringatan', icon: '🚨', text: 'WAJIB CEK kadar S setiap batch sebelum digunakan untuk sapi — variasi S dari 0,25% hingga 0,60% antar batch. S >0,4% beresiko PEM pada sapi feedlot.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: CGF (protein lebih rendah, S lebih aman), Bungkil Kedelai (protein lebih tinggi, variabilitas rendah, S aman).' },
    ],
  },

  // ── 16 ─────────────────────────────────────────────────────────────────────
  'hominy-feed': {
    namaLatin: 'Zea mays L. (dry milling by-product)',
    asalBahan: 'Campuran lembaga, kulit ari, dan pecahan biji dari proses dry milling jagung untuk produksi tepung maizena/grits',
    bentuk: ['Tepung', 'Butiran'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 10.5, sk: 4.5, lk: 6.0, abu: 2.5, betn: 64.5,
      tdn: 80, me: 3300,
      ndf: 18, adf: 6,
      ca: 0.04, p: 0.45, mg: 0.15, na: 0.02, k: 0.45, cl: 0.06, s: 0.15,
      vitamin: 'Vitamin E dari lembaga (lebih tinggi dari biji utuh); B-kompleks',
      mineral: 'P cukup dari lembaga; Ca tetap rendah — perlu suplementasi',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Unggas'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      catatan: 'Sumber energi dan lemak yang seimbang. LK 6% menjadikannya sumber lemak tambahan alami yang lebih murah dari minyak. Bisa menggantikan sebagian jagung giling.',
    },
    harga: {
      estimasiAI: 3800, hargaMarketplace: 3700,
      satuan: 'per kg', supplier: 'Pabrik tepung jagung / Maizena plant',
      updatedAt: '01 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
        'USDA-ARS (2019) — Feed Composition Database',
      ],
      sumberData: 'Spesifikasi produk Hominy Feed dari industri maizena nasional',
      catatan: 'Komposisi bervariasi tergantung proses dan proporsi lembaga-kulit ari dalam campuran.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Sumber energi + lemak alami yang seimbang (TDN 80%, LK 6%) — pilihan ekonomis untuk meningkatkan densitas energi ransum tanpa menambah minyak.' },
      { type: 'kelebihan', icon: '✅', text: 'Profil nutrisi seimbang: energi baik, protein cukup, lemak alami yang tidak merusak fermentasi rumen. Harga jauh di bawah DDGS dan CGM.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein hanya 10,5% — tidak bisa menggantikan sumber protein utama. Variabilitas komposisi tergantung proses produksi pabrik.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gantikan 20–30% jagung giling dalam formula + tambahkan Bungkil Kedelai untuk protein. Hasilnya: energi lebih tinggi + lemak lebih baik dari jagung saja.' },
      { type: 'peringatan', icon: '🚨', text: 'Lemak 6% cukup tinggi — jangan kombinasikan dengan minyak dalam jumlah besar. Total lemak ransum ruminansia tidak boleh >6–7% BK.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: Jagung Giling (energi serupa, lebih murah, lemak lebih rendah). Corn Germ jika ingin lemak lebih tinggi lagi.' },
    ],
  },

  // ── 17 ─────────────────────────────────────────────────────────────────────
  'corn-germ': {
    namaLatin: 'Zea mays L. (embryo meal)',
    asalBahan: 'Lembaga (embrio) jagung yang tersisa setelah ekstraksi minyak jagung',
    bentuk: ['Tepung'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 13.0, sk: 3.5, lk: 12.0, abu: 2.5, betn: 59.0,
      tdn: 88, me: 3600,
      ndf: 14, adf: 5,
      ca: 0.03, p: 0.58, mg: 0.18, na: 0.02, k: 0.60, cl: 0.05, s: 0.20,
      vitamin: 'Vitamin E sangat tinggi (±50–80 mg/kg tokoferol) — antioksidan alami terbaik dari turunan jagung',
      mineral: 'P dan K cukup tinggi; Ca tetap rendah — perlu koreksi Ca',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 15,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Pejantan', 'Indukan'],
      catatan: 'Energi tertinggi (TDN 88%) di antara semua turunan jagung berkat lemak 12%. Vitamin E tinggi alami bermanfaat untuk reproduksi. Batasi 15% ransum — lemak tinggi mengganggu fermentasi rumen jika berlebih.',
    },
    harga: {
      estimasiAI: 4500, hargaMarketplace: 4400,
      satuan: 'per kg', supplier: 'Pabrik minyak jagung / Industri ekstraksi',
      updatedAt: '01 Jul 2026',
    },
    referensi: {
      literatur: [
        'Schingoethe & Linke (1988) — Corn Germ Meal in Dairy Diets, J. Dairy Sci.',
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
      ],
      sumberData: 'Spesifikasi corn germ meal dari industri minyak jagung Indonesia',
      catatan: 'LK bervariasi 8–15% tergantung efisiensi ekstraksi minyak. Minta analisis lemak dari supplier.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Bahan pakan dengan energi tertinggi (TDN 88%) dari kelas turunan jagung berkat kandungan lemak 12%. Sumber Vitamin E alami terbaik.' },
      { type: 'kelebihan', icon: '✅', text: 'TDN 88% tertinggi dari semua turunan jagung. Vitamin E sangat tinggi (±60 mg/kg) mendukung reproduksi dan imunitas ternak. P cukup (0,58%).' },
      { type: 'kekurangan', icon: '⚠️', text: 'Lemak 12% adalah batas atas yang aman untuk ruminansia. Melebihi 15% ransum beresiko mengganggu fermentasi selulosa di rumen.' },
      { type: 'kombinasi', icon: '🔗', text: 'Ideal untuk ransum pejantan dan indukan yang membutuhkan energi tinggi + Vitamin E. Kombinasikan dengan sumber hijauan (roughage) yang baik.' },
      { type: 'peringatan', icon: '🚨', text: 'Total lemak ransum ruminansia TIDAK BOLEH >6–7% BK. Corn Germ 15% sudah menyumbang ~1,8% LK — perhitungkan total lemak dari semua bahan.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika lemak terlalu tinggi: gunakan Hominy Feed (lemak 6%, energi serupa). Jika Vitamin E tujuan utama: tambahkan premix Vitamin E terpisah.' },
    ],
  },

  // ── 18 ─────────────────────────────────────────────────────────────────────
  'corn-bran': {
    namaLatin: 'Zea mays L. (pericarp)',
    asalBahan: 'Kulit ari terluar biji jagung dari proses wet milling; dipisahkan dari fraksi pati dan protein',
    bentuk: ['Tepung', 'Pellet'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 9.0, sk: 40, lk: 1.5, abu: 2.0, betn: 36.5,
      tdn: 55, me: 2250,
      ndf: 68, adf: 38,
      ca: 0.04, p: 0.20, mg: 0.10, na: 0.02, k: 0.30, cl: 0.05, s: 0.10,
      vitamin: 'B-kompleks sedikit; tidak ada vitamin yang signifikan',
      mineral: 'Mineral moderat; Ca dan P keduanya rendah',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong', 'Sapi Perah'],
      programCocok: ['Penggemukan', 'Menyusui'],
      catatan: 'Sumber serat dinding sel (NDF 68%) dari industri — lebih konsisten kualitasnya dibanding tongkol/janggel. Cocok untuk ransum sapi perah yang butuh serat efektif (effective NDF) dari sumber non-hijauan.',
    },
    harga: {
      estimasiAI: 2800, hargaMarketplace: 2700,
      satuan: 'per kg', supplier: 'Pabrik tepung maizena / Wet milling plant',
      updatedAt: '01 Jul 2026',
    },
    referensi: {
      literatur: [
        'Fahey et al. (1979) — Corn Bran in Ruminant Diets, J. Anim. Sci.',
        'USDA-ARS (2019) — Feed Composition Database',
      ],
      sumberData: 'Spesifikasi corn bran dari wet milling plant domestik',
      catatan: 'SK 40% dari corn bran wet milling lebih konsisten dibanding limbah pertanian karena proses terstandarisasi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Sumber serat kasar terstandarisasi dari industri (NDF 68%, SK 40%) — lebih konsisten dari tongkol/janggel tapi harga masih terjangkau.' },
      { type: 'kelebihan', icon: '✅', text: 'Kualitas lebih konsisten dari limbah pertanian karena proses terstandarisasi. Cocok untuk sapi perah yang butuh sumber serat efektif dari non-hijauan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'TDN rendah (55%) — nilai energi terbatas. Protein hanya 9% — harus dikombinasikan sumber protein. Tidak bisa menjadi sumber energi utama.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan sebagai sumber serat pengganti jerami dalam ransum TMR (Total Mixed Ration) sapi perah. Kombinasikan dengan jagung giling dan bungkil kedelai.' },
      { type: 'peringatan', icon: '🚨', text: 'NDF 68% dari corn bran bukan NDF "efektif" (peNDF) — berbeda dari hijauan. Untuk sapi perah, tetap butuh hijauan fisik (hay/jerami panjang) sebagai penyeimbang.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif serat serupa: Dedak Padi (protein lebih tinggi), Janggel Giling (serat lebih tinggi, harga lebih murah), atau CGF (serat + protein + P).' },
    ],
  },

  // ── 19 ─────────────────────────────────────────────────────────────────────
  'corn-screenings': {
    namaLatin: 'Zea mays L. (by-product)',
    asalBahan: 'Butir jagung kecil, pecahan, dan kotoran ringan yang tersaring dari proses sortir industri pengolahan jagung',
    bentuk: ['Butiran', 'Tepung'],
    nutrisi: {
      bk: 86, kadarAir: 14,
      pk: 9.5, sk: 6.0, lk: 4.0, abu: 3.0, betn: 63.5,
      tdn: 74, me: 3050,
      ndf: 18, adf: 7,
      ca: 0.05, p: 0.28, mg: 0.13, na: 0.02, k: 0.40, cl: 0.06, s: 0.12,
      vitamin: 'B-kompleks, Vitamin E moderat; bervariasi tergantung komposisi lot',
      mineral: 'Profil mineral bervariasi antar lot tergantung komposisi sortiran',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'Kualitas sangat bervariasi antar lot — wajib analisis proksimat sebelum dimasukkan ke formula. Bisa menjadi alternatif ekonomis jagung giling jika kualitas lot terjamin.',
    },
    harga: {
      estimasiAI: 3000, hargaMarketplace: 2900,
      satuan: 'per kg', supplier: 'Pabrik sortasi / Elevator jagung',
      updatedAt: '01 Jul 2026',
    },
    referensi: {
      literatur: [
        'USDA Grain Inspection — Corn Grading Standards',
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
      ],
      sumberData: 'Rata-rata analisis corn screenings dari 5 pabrik sortasi Indonesia',
      catatan: 'Nilai nutrisi adalah rata-rata — variasi aktual sangat tinggi. Gunakan data analisis lot aktual untuk formulasi presisi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Alternatif ekonomis jagung giling dengan kandungan energi cukup (TDN 74%) — harga 40–50% lebih murah dari jagung giling standar.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga sangat kompetitif. Jika lot berkualitas baik: profil nutrisi mendekati jagung giling dengan protein sedikit lebih tinggi (9,5%).' },
      { type: 'kekurangan', icon: '⚠️', text: 'Variabilitas SANGAT TINGGI — kualitas berbeda drastis antar lot dan supplier. Tidak bisa digunakan tanpa analisis proksimat per lot.' },
      { type: 'kombinasi', icon: '🔗', text: 'Setelah analisis proksimat dikonfirmasi, gunakan dalam formula yang sama dengan jagung giling. Proporsi menyesuaikan hasil analisis aktual.' },
      { type: 'peringatan', icon: '🚨', text: 'JANGAN gunakan tanpa analisis proksimat aktual. Lot berkualitas buruk bisa mengandung tanah, kotoran, dan jamur — menurunkan performa ternak.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih konsisten: Jagung Sortiran (kualitas lebih homogen), Jagung Afkir (kualitas lebih terjamin dari sortasi visual).' },
    ],
  },

  // ── 20 ─────────────────────────────────────────────────────────────────────
  'jagung-sortiran': {
    namaLatin: 'Zea mays L. (off-spec)',
    asalBahan: 'Biji jagung yang tidak memenuhi standar kualitas ekspor atau pangan manusia berdasarkan sortir visual dan ukuran',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 86, kadarAir: 14,
      pk: 8.2, sk: 2.5, lk: 3.5, abu: 1.6, betn: 70.2,
      tdn: 79, me: 3250,
      ndf: 10.5, adf: 4.0,
      ca: 0.02, p: 0.26, mg: 0.11, na: 0.02, k: 0.36, cl: 0.05, s: 0.11,
      vitamin: 'Vitamin E (sedikit lebih rendah dari jagung grade A), Karotenoid, B-kompleks',
      mineral: 'Profil mineral identik jagung normal grade B',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 65,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      catatan: 'Pilihan aman dan ekonomis. Tidak lolos sortir visual bukan berarti nilai nutrisi buruk — hanya tidak memenuhi standar estetika pangan manusia. Tetap periksa aflatoksin secara berkala.',
    },
    harga: {
      estimasiAI: 3200, hargaMarketplace: 3100,
      satuan: 'per kg', supplier: 'Gudang sortasi / Eksportir jagung',
      updatedAt: '05 Jul 2026',
    },
    referensi: {
      literatur: [
        'SNI 01-3920-1995 — Jagung untuk Pakan Ternak',
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
      ],
      sumberData: 'Data sortasi eksportir jagung Lampung dan Jawa Timur',
      catatan: 'Grade B perdagangan; nilai nutrisi mendekati grade A. Alasan "sortiran" biasanya hanya warna, ukuran, atau kerusakan fisik minor.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Jagung Grade B yang nilai nutrisinya mendekati jagung standar — perbedaan hanya pada penampilan visual, bukan kandungan gizi.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga lebih murah ±40% dari jagung pipil grade A dengan nutrisi 95%+ identik. Kualitas lebih konsisten dari jagung afkir karena alasan sortir yang lebih jelas.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tetap perlu pemeriksaan aflatoksin berkala. Kadar air bisa sedikit lebih tinggi dari grade A — periksa saat terima barang.' },
      { type: 'kombinasi', icon: '🔗', text: 'Dapat digunakan dalam formula yang sama dengan jagung pipil grade A tanpa perubahan signifikan. Tabungan harga bisa dialihkan ke suplemen protein.' },
      { type: 'peringatan', icon: '🚨', text: 'Pastikan "sortiran" bukan karena kontaminasi — minta penjelasan alasan sortir dari supplier. Aflatoksin tidak terlihat secara visual.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif serupa: Jagung Afkir (lebih murah, resiko lebih tinggi), Jagung Pecah (alasan sortir berbeda — kerusakan fisik). Bisa digunakan bergantian.' },
    ],
  },

  // ── 21 ─────────────────────────────────────────────────────────────────────
  'jagung-pipil-kuning': {
    namaLatin: 'Zea mays L. var. indurata/indentata (kuning)',
    asalBahan: 'Biji jagung pipil dari varietas berpigmen kuning, dipisahkan dari tongkol setelah kering panen',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 87, kadarAir: 13,
      pk: 8.6, sk: 2.1, lk: 3.9, abu: 1.4, betn: 71.0,
      tdn: 82, me: 3390,
      ndf: 9.2, adf: 3.4,
      ca: 0.02, p: 0.28, mg: 0.12, na: 0.02, k: 0.38, cl: 0.05, s: 0.12,
      vitamin: 'Karotenoid (pro-vitamin A) tinggi — pigmen kuning berasal dari zeaxanthin dan lutein; Vitamin E ±15 mg/kg',
      mineral: 'Profil identik jagung pipil standar; tidak ada perbedaan mineral akibat warna biji',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 70,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Unggas'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      catatan: 'Varietas paling umum diperdagangkan di Indonesia. Pigmen karotenoid bermanfaat memberi warna kuning pada kuning telur dan lemak karkas unggas/broiler.',
    },
    harga: {
      estimasiAI: 5600, hargaMarketplace: 5500,
      satuan: 'per kg', supplier: 'Petani lokal / KUD / Pabrik pakan',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Rev. Ed.',
        'Ensminger (1990) — Feeds & Nutrition, Ensminger Publishing',
      ],
      sumberData: 'Rata-rata 3 laboratorium pakan Indonesia (BPT Ciawi, LIPI, IPB)',
      catatan: 'Nilai nutrisi setara jagung pipil putih; perbedaan utama hanya kandungan karotenoid.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Sumber energi utama ransum sekaligus sumber karotenoid alami — memperbaiki pigmentasi kuning telur dan warna kulit broiler.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas sangat baik, pasokan melimpah dan harga kompetitif karena varietas paling banyak ditanam di Indonesia.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein rendah (8,6%) dan defisien lisin-triptofan, sama seperti varietas jagung lain — wajib dikombinasi sumber protein.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan Bungkil Kedelai atau CGM untuk protein, serta Premix Mineral untuk menutup defisiensi Ca.' },
      { type: 'peringatan', icon: '🚨', text: 'Batasi ≤70% ransum untuk mencegah asidosis rumen pada ruminansia. Periksa aflatoksin rutin, terutama pada musim hujan.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika perlu tanpa pigmentasi kuning (mis. formula tertentu): gunakan Jagung Pipil Putih dengan nilai energi setara.' },
    ],
  },

  // ── 22 ─────────────────────────────────────────────────────────────────────
  'jagung-pipil-putih': {
    namaLatin: 'Zea mays L. var. alba (putih)',
    asalBahan: 'Biji jagung pipil dari varietas berpigmen putih (rendah karotenoid), dipisahkan dari tongkol setelah kering panen',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 87, kadarAir: 13,
      pk: 8.4, sk: 2.2, lk: 3.7, abu: 1.4, betn: 71.3,
      tdn: 81, me: 3350,
      ndf: 9.6, adf: 3.6,
      ca: 0.02, p: 0.27, mg: 0.12, na: 0.02, k: 0.37, cl: 0.05, s: 0.12,
      vitamin: 'Karotenoid sangat rendah/nihil (biji tidak berpigmen); Vitamin E ±13 mg/kg, Thiamin (B1)',
      mineral: 'Profil identik jagung pipil kuning; tidak ada perbedaan mineral akibat warna biji',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 70,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Unggas'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      catatan: 'Nilai energi setara jagung kuning. Dipilih ketika formula tidak menghendaki pigmentasi kuning pada produk akhir (telur/daging) atau untuk pasar tertentu.',
    },
    harga: {
      estimasiAI: 5500, hargaMarketplace: 5400,
      satuan: 'per kg', supplier: 'Petani lokal / KUD / Pabrik pakan',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
        'NRC (2016) — Nutrient Requirements of Beef Cattle, 8th Rev. Ed.',
      ],
      sumberData: 'Rata-rata 3 laboratorium pakan Indonesia (BPT Ciawi, LIPI, IPB)',
      catatan: 'Nilai nutrisi dapat bervariasi ±10% tergantung varietas dan kondisi penyimpanan; perbedaan utama dengan jagung kuning hanya kandungan karotenoid.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Sumber energi utama setara jagung kuning (TDN 81%, ME 3.350 kcal/kg) tanpa efek pigmentasi karotenoid pada produk ternak.' },
      { type: 'kelebihan', icon: '✅', text: 'Palatabilitas sangat baik, cocok untuk formula yang mensyaratkan warna produk netral (mis. beberapa standar ekspor telur/daging).' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein rendah (8,4%) dan tanpa kontribusi pro-vitamin A — perlu suplemen vitamin A tambahan pada ransum unggas.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan Bungkil Kedelai (protein), Premix Vitamin A (menutup defisiensi karotenoid), dan Mineral Premix (Ca, P).' },
      { type: 'peringatan', icon: '🚨', text: 'Batasi ≤70% ransum — risiko asidosis rumen sama dengan jagung kuning. Selalu periksa aflatoksin sebelum digunakan.' },
      { type: 'alternatif', icon: '🔄', text: 'Bila ketersediaan terbatas, Jagung Pipil Kuning dapat menggantikan dengan nilai energi setara (perbedaan hanya pigmentasi).' },
    ],
  },

  // ── 23 ─────────────────────────────────────────────────────────────────────
  'jagung-utuh': {
    namaLatin: 'Zea mays L. (whole grain)',
    asalBahan: 'Biji jagung kering yang diberikan langsung tanpa proses giling, pecah, atau flaking',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 87, kadarAir: 13,
      pk: 8.5, sk: 2.2, lk: 3.8, abu: 1.4, betn: 71.1,
      tdn: 78, me: 3200,
      ndf: 9.5, adf: 3.5,
      ca: 0.02, p: 0.28, mg: 0.12, na: 0.02, k: 0.38, cl: 0.05, s: 0.12,
      vitamin: 'Vitamin E (±15 mg/kg), Pro-vitamin A (karotenoid pada varietas kuning), Thiamin (B1)',
      mineral: 'Kaya P organik (fitat); rendah Ca — perlu suplementasi kalsium',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 50,
      targetTernak: ['Unggas Free-range', 'Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower'],
      catatan: 'TDN lebih rendah dari jagung giling/pecah karena biji utuh sebagian lolos tanpa tercerna sempurna di rumen/saluran cerna unggas. Cocok untuk unggas umbaran yang mengais sendiri.',
    },
    harga: {
      estimasiAI: 5400, hargaMarketplace: 5300,
      satuan: 'per kg', supplier: 'Petani lokal / Pedagang pakan unggas',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
        'Ørskov (1986) — Starch Digestion and Utilization in Ruminants, J. Anim. Sci.',
      ],
      sumberData: 'Perbandingan kecernaan jagung utuh vs giling, Laboratorium Nutrisi Ternak IPB',
      catatan: 'Kecernaan pati biji utuh 8–10% lebih rendah dari jagung giling akibat kulit ari (pericarp) yang belum pecah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Bentuk paling praktis tanpa proses tambahan — cocok untuk unggas umbaran/free-range yang secara alami mengais dan mencerna biji utuh.' },
      { type: 'kelebihan', icon: '✅', text: 'Tidak memerlukan biaya pengolahan (giling/pecah). Lebih tahan lama disimpan karena kulit ari masih utuh melindungi endosperma.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Kecernaan pati lebih rendah dari jagung giling/pecah — sebagian energi terbuang lewat feses, terutama pada ruminansia dan unggas kandang.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk ruminansia kandang, kombinasikan dengan sebagian jagung giling agar kecernaan total tetap optimal.' },
      { type: 'peringatan', icon: '🚨', text: 'Untuk anak ternak/DOC, hindari pemberian biji utuh — resiko tersedak dan pencernaan belum optimal untuk mencerna biji utuh.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk ternak kandang yang butuh kecernaan tinggi, gunakan Jagung Giling atau Jagung Pecah sebagai pengganti.' },
    ],
  },

  // ── 24 ─────────────────────────────────────────────────────────────────────
  'jagung-flaking': {
    namaLatin: 'Zea mays L. (flaked, dry-rolled)',
    asalBahan: 'Jagung pipil yang dikondisikan dengan panas/uap ringan lalu dipipihkan (rolling) menjadi serpihan (flakes)',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 8.6, sk: 2.0, lk: 3.9, abu: 1.4, betn: 72.1,
      tdn: 87, me: 3550,
      ndf: 7.5, adf: 2.8,
      ca: 0.02, p: 0.28, mg: 0.12, na: 0.02, k: 0.38, cl: 0.05, s: 0.12,
      vitamin: 'Vitamin E sedikit berkurang akibat proses panas; Karotenoid relatif stabil',
      mineral: 'Profil mineral identik jagung pipil; proses fisik tidak mengubah kadar mineral',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 60,
      targetTernak: ['Sapi Potong', 'Sapi Perah'],
      programCocok: ['Penggemukan', 'Indukan'],
      catatan: 'Proses flaking memecah struktur granula pati sehingga kecernaan rumen meningkat signifikan dibanding jagung giling biasa. Umum dipakai pada feedlot komersial.',
    },
    harga: {
      estimasiAI: 6800, hargaMarketplace: 6600,
      satuan: 'per kg', supplier: 'Pabrik pengolahan pakan feedlot',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Zinn et al. (2002) — Influence of Steam-flaking and Dry-rolling on Corn Utilization, J. Anim. Sci.',
        'Huntington (1997) — Starch Utilization by Ruminants, J. Anim. Sci.',
      ],
      sumberData: 'Data komposisi jagung flaking industri feedlot, adaptasi standar Zinn et al.',
      catatan: 'Nilai TDN lebih tinggi dari jagung giling karena proses flaking meningkatkan gelatinisasi pati.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Pati tergelatinisasi sebagian sehingga kecernaan rumen meningkat — TDN 87% jauh lebih tinggi dari jagung giling biasa (84%).' },
      { type: 'kelebihan', icon: '✅', text: 'Efisiensi konversi pakan (FCR) lebih baik pada program penggemukan intensif berkat kecernaan pati yang tinggi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Biaya pengolahan lebih mahal ±Rp 1.000–1.500/kg dibanding jagung giling biasa; hanya ekonomis pada skala feedlot besar.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan dalam ransum tinggi konsentrat feedlot bersama sumber protein by-pass (CGM, bungkil kedelai) dan buffer rumen (NaHCO₃).' },
      { type: 'peringatan', icon: '🚨', text: 'Karena kecernaan sangat tinggi, resiko asidosis rumen akut meningkat jika ransum diubah mendadak — perlu adaptasi bertahap 10–14 hari.' },
      { type: 'alternatif', icon: '🔄', text: 'Jagung Steam Flake memberikan kecernaan lebih tinggi lagi; Jagung Giling adalah alternatif lebih murah dengan kecernaan sedikit lebih rendah.' },
    ],
  },

  // ── 25 ─────────────────────────────────────────────────────────────────────
  'jagung-steam-flake': {
    namaLatin: 'Zea mays L. (steam-flaked)',
    asalBahan: 'Jagung pipil yang dikukus dengan uap panas bertekanan (steam conditioning) lalu dipipihkan menjadi serpihan tipis',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 8.7, sk: 1.8, lk: 3.9, abu: 1.4, betn: 72.4,
      tdn: 90, me: 3680,
      ndf: 6.8, adf: 2.5,
      ca: 0.02, p: 0.28, mg: 0.12, na: 0.02, k: 0.38, cl: 0.05, s: 0.12,
      vitamin: 'Vitamin E berkurang lebih banyak dari flaking kering akibat panas uap; Karotenoid relatif stabil',
      mineral: 'Profil mineral identik jagung pipil; proses uap tidak mengubah kadar mineral',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 60,
      targetTernak: ['Sapi Potong'],
      programCocok: ['Penggemukan'],
      catatan: 'Kecernaan pati tertinggi di antara semua bentuk olahan jagung — standar industri feedlot skala besar untuk memaksimalkan efisiensi pakan (FCR).',
    },
    harga: {
      estimasiAI: 7200, hargaMarketplace: 7000,
      satuan: 'per kg', supplier: 'Pabrik pengolahan pakan feedlot skala besar',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Zinn et al. (2002) — Influence of Steam-flaking and Dry-rolling on Corn Utilization, J. Anim. Sci.',
        'Owens et al. (1997) — The Effect of Grain Source and Grain Processing on Performance of Feedlot Cattle, J. Anim. Sci.',
      ],
      sumberData: 'Data komposisi jagung steam-flake industri feedlot, adaptasi standar Zinn & Owens et al.',
      catatan: 'TDN 90% adalah nilai tertinggi di antara seluruh olahan jagung karena gelatinisasi pati maksimal.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Gelatinisasi pati maksimal (TDN 90%) menjadikan bahan ini sumber energi paling efisien di antara semua olahan jagung untuk penggemukan intensif.' },
      { type: 'kelebihan', icon: '✅', text: 'FCR terbaik di kelasnya; standar emas industri feedlot Amerika dan Australia untuk penggemukan cepat.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Biaya investasi mesin steam-flaking sangat tinggi — hanya ekonomis untuk feedlot skala besar (>500 ekor).' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan bersama buffer rumen (NaHCO₃, MgO) dan protein by-pass rumen untuk mengimbangi laju fermentasi pati yang sangat cepat.' },
      { type: 'peringatan', icon: '🚨', text: 'Resiko asidosis rumen akut tertinggi di antara semua olahan jagung — wajib program adaptasi bertahap minimal 14–21 hari sebelum full-feed.' },
      { type: 'alternatif', icon: '🔄', text: 'Jagung Flaking (dry-rolled) adalah alternatif lebih murah dengan kecernaan sedikit lebih rendah namun resiko asidosis lebih rendah.' },
    ],
  },

  // ── 26 ─────────────────────────────────────────────────────────────────────
  'tepung-jagung': {
    namaLatin: 'Zea mays L. (fine ground)',
    asalBahan: 'Biji jagung pipil kering yang digiling halus hingga menjadi tepung (corn meal)',
    bentuk: ['Tepung'],
    nutrisi: {
      bk: 87, kadarAir: 13,
      pk: 8.5, sk: 1.8, lk: 3.8, abu: 1.4, betn: 71.5,
      tdn: 85, me: 3480,
      ndf: 7.0, adf: 2.6,
      ca: 0.02, p: 0.28, mg: 0.12, na: 0.02, k: 0.38, cl: 0.05, s: 0.12,
      vitamin: 'Vitamin E berkurang sedikit akibat luas permukaan besar (oksidasi lebih cepat); Karotenoid stabil dalam jangka pendek',
      mineral: 'Profil mineral identik jagung pipil; penggilingan halus tidak mengubah kadar mineral',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 60,
      targetTernak: ['Unggas', 'Anak Sapi', 'Babi', 'Kambing', 'Domba'],
      programCocok: ['Grower', 'Menyusui', 'Indukan'],
      catatan: 'Tekstur halus ideal untuk pakan starter unggas dan pedet karena mudah dicerna. Tidak dianjurkan sebagai komponen utama ransum sapi dewasa karena resiko asidosis rumen dari fermentasi cepat.',
    },
    harga: {
      estimasiAI: 6200, hargaMarketplace: 6000,
      satuan: 'per kg', supplier: 'Pabrik pakan / Penggilingan tepung jagung',
      updatedAt: '07 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
        'Leeson & Summers (2001) — Nutrition of the Chicken, University Books',
      ],
      sumberData: 'Data komposisi tepung jagung pabrik pakan starter unggas',
      catatan: 'Ukuran partikel halus (<1 mm) meningkatkan kecernaan pada unggas namun mempercepat fermentasi rumen pada ruminansia — gunakan sesuai target ternak.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Bahan energi utama pakan starter unggas dan pedet — tekstur halus memudahkan konsumsi dan pencernaan pada ternak muda.' },
      { type: 'kelebihan', icon: '✅', text: 'Kecernaan sangat tinggi (TDN 85%). Ideal untuk formula pakan mash/crumble unggas dan pakan cair pedet.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Mudah menyerap kelembaban dan menggumpal — perlu penyimpanan kering rapat. Berisiko debu (dusty) saat pencampuran.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan Tepung Ikan/Bungkil Kedelai (protein) dan Premix Vitamin-Mineral untuk formula starter lengkap.' },
      { type: 'peringatan', icon: '🚨', text: 'Untuk sapi dewasa, hindari penggunaan >30% ransum konsentrat — fermentasi terlalu cepat meningkatkan resiko asidosis rumen sub-akut (SARA).' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk ruminansia dewasa, gunakan Jagung Giling (tekstur lebih kasar) sebagai pengganti yang lebih aman terhadap rumen.' },
    ],
  },

  // ── 27 ─────────────────────────────────────────────────────────────────────
  'klobot-jagung': {
    namaLatin: 'Zea mays L. (husk leaf, fresh)',
    asalBahan: 'Lapisan daun pembungkus tongkol jagung yang dikupas segar/muda saat panen, sebelum dikeringkan',
    bentuk: ['Segar'],
    nutrisi: {
      bk: 35, kadarAir: 65,
      pk: 3.5, sk: 28, lk: 0.8, abu: 5.5, betn: 61.2,
      tdn: 48, me: 1950,
      ndf: 68, adf: 42,
      ca: 0.35, p: 0.08, mg: 0.10, na: 0.02, k: 1.20, cl: 0.10, s: 0.08,
      vitamin: 'Karotenoid dan klorofil dari jaringan hijau muda',
      mineral: 'K tinggi karena bagian tanaman hijau; Ca lebih tinggi dari batang',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Grower'],
      catatan: 'Diberikan segar sesegera mungkin setelah dikupas — mudah layu dan menurun palatabilitasnya dalam 24 jam. Cacah terlebih dahulu untuk memudahkan konsumsi.',
    },
    harga: {
      estimasiAI: 350, hargaMarketplace: 300,
      satuan: 'per kg segar', supplier: 'Petani jagung lokal / Pasar tradisional saat panen',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: [
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik',
        'Utomo et al. (2013) — Limbah Pertanian sebagai Pakan, UGM Press',
      ],
      sumberData: 'Analisis proksimat klobot jagung segar, Laboratorium Pakan UGM',
      catatan: 'Berbeda dari Kulit Jagung (kering) — klobot dipanen dalam kondisi segar/muda dengan kadar air jauh lebih tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Hijauan tambahan gratis/murah saat musim panen jagung — memanfaatkan limbah panen yang biasanya dibuang.' },
      { type: 'kelebihan', icon: '✅', text: 'Biaya sangat rendah, tersedia melimpah saat musim panen. Kandungan K dan Ca lebih baik dari kulit jagung kering.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Cepat layu dan busuk (kadar air 65%) — tidak bisa disimpan lama. Palatabilitas menurun drastis setelah 1–2 hari.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan hijauan kering atau silase untuk menstabilkan kadar air ransum harian.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan biarkan menumpuk lebih dari 1 hari sebelum diberikan — resiko fermentasi tak terkontrol dan pertumbuhan jamur.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika perlu bentuk tahan simpan, keringkan menjadi Kulit Jagung (Corn Husk) untuk penyimpanan jangka panjang.' },
    ],
  },

  // ── 28 ─────────────────────────────────────────────────────────────────────
  'batang-jagung': {
    namaLatin: 'Zea mays L. (stalk)',
    asalBahan: 'Batang tanaman jagung sisa panen setelah tongkol dan daun dipisahkan',
    bentuk: ['Kering', 'Segar'],
    nutrisi: {
      bk: 30, kadarAir: 70,
      pk: 2.0, sk: 34, lk: 0.5, abu: 6.0, betn: 57.5,
      tdn: 42, me: 1700,
      ndf: 72, adf: 48,
      ca: 0.28, p: 0.05, mg: 0.09, na: 0.02, k: 1.10, cl: 0.09, s: 0.06,
      vitamin: 'Vitamin sangat rendah; sebagian besar terdegradasi setelah tanaman mengering',
      mineral: 'K tinggi (sisa translokasi hara); P dan mineral mikro rendah',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Potong'],
      programCocok: ['Penggemukan'],
      catatan: 'Serat sangat tinggi dan kecernaan rendah — gunakan hanya sebagai sumber roughage pelengkap, dicacah halus (2–3 cm) untuk mempermudah konsumsi.',
    },
    harga: {
      estimasiAI: 300, hargaMarketplace: 250,
      satuan: 'per kg', supplier: 'Petani jagung lokal (sisa panen)',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: [
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik',
        'Utomo et al. (2013) — Limbah Pertanian sebagai Pakan, UGM Press',
      ],
      sumberData: 'Analisis proksimat batang jagung sisa panen, Laboratorium Pakan UNDIP',
      catatan: 'Nilai nutrisi jauh lebih rendah dari daun jagung karena struktur lignoselulosa batang lebih tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Sumber roughage darurat/pelengkap saat hijauan utama langka — memanfaatkan limbah panen yang melimpah pasca panen jagung.' },
      { type: 'kelebihan', icon: '✅', text: 'Biaya sangat murah bahkan gratis dari sisa panen sendiri. Membantu mengisi rasio serat ransum saat musim kering.' },
      { type: 'kekurangan', icon: '⚠️', text: 'TDN dan protein sangat rendah — nilai gizi paling rendah di antara semua bagian tanaman jagung. Kecernaan rumen terbatas.' },
      { type: 'kombinasi', icon: '🔗', text: 'Wajib dikombinasikan dengan konsentrat energi-protein tinggi (jagung giling, bungkil kedelai) agar kebutuhan produksi tetap terpenuhi.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan jadikan sumber pakan utama — hanya sebagai pelengkap serat darurat maksimal 20% ransum.' },
      { type: 'alternatif', icon: '🔄', text: 'Daun Jagung memiliki nilai nutrisi lebih baik untuk fungsi serupa. Jerami Padi juga bisa menjadi alternatif roughage murah.' },
    ],
  },

  // ── 29 ─────────────────────────────────────────────────────────────────────
  'daun-jagung': {
    namaLatin: 'Zea mays L. (leaf)',
    asalBahan: 'Daun tanaman jagung sisa panen, dipisahkan dari batang dan tongkol',
    bentuk: ['Kering', 'Segar'],
    nutrisi: {
      bk: 32, kadarAir: 68,
      pk: 6.5, sk: 26, lk: 1.2, abu: 8.0, betn: 58.3,
      tdn: 52, me: 2100,
      ndf: 62, adf: 38,
      ca: 0.55, p: 0.15, mg: 0.18, na: 0.03, k: 1.50, cl: 0.12, s: 0.12,
      vitamin: 'Karotenoid dan klorofil tinggi (jaringan daun hijau); Vitamin K',
      mineral: 'Ca, K, dan Mg jauh lebih tinggi dari batang — bagian tanaman paling kaya mineral makro',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 35,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Grower', 'Indukan', 'Bunting'],
      catatan: 'Nilai nutrisi terbaik di antara limbah pertanian jagung (batang, kulit, tongkol) — layak dijadikan komponen hijauan utama saat musim panen.',
    },
    harga: {
      estimasiAI: 350, hargaMarketplace: 300,
      satuan: 'per kg', supplier: 'Petani jagung lokal (sisa panen)',
      updatedAt: '01 Jun 2026',
    },
    referensi: {
      literatur: [
        'Reksohadiprodjo (1985) — Produksi Tanaman Hijauan Makanan Ternak Tropik',
        'Hartadi et al. (1997) — Tabel Komposisi Bahan Pakan Indonesia',
      ],
      sumberData: 'Analisis proksimat daun jagung sisa panen, Laboratorium Pakan UGM',
      catatan: 'Protein dan mineral jauh lebih tinggi dari batang karena kandungan klorofil dan jaringan metabolik aktif.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Hijauan bergizi dari limbah panen — protein (6,5%) dan mineral makro (Ca, K) jauh lebih baik dari batang atau tongkol jagung.' },
      { type: 'kelebihan', icon: '✅', text: 'Biaya rendah/gratis dari sisa panen. Kandungan Ca dan K tertinggi di antara limbah tanaman jagung — baik untuk indukan bunting.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Cepat layu bila tidak segera diberikan atau dikeringkan. Serat tetap tinggi (SK 26%) sehingga tidak bisa menjadi sumber energi utama.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan konsentrat energi (jagung giling) untuk melengkapi kebutuhan TDN yang tidak terpenuhi dari daun saja.' },
      { type: 'peringatan', icon: '🚨', text: 'Keringkan atau berikan segera setelah dipanen — daun yang layu dan mulai membusuk dapat menurunkan palatabilitas drastis.' },
      { type: 'alternatif', icon: '🔄', text: 'Tebon Jagung (daun+batang+tongkol muda) memberi nilai gizi serupa dalam bentuk lebih praktis bila tersedia.' },
    ],
  },
};

// ─── Merge Helper ─────────────────────────────────────────────────────────────

export function getJagungDetail(id: string): JagungItem | undefined {
  const base   = getJagungById(id);
  if (!base) return undefined;
  const detail = JAGUNG_DETAIL[id];
  if (!detail) return base;
  return { ...base, ...detail, dataLengkap: true };
}

// ─── Dev-only integrity check ──────────────────────────────────────────────────
// Guards against `dataLengkap` drifting away from actual detail coverage:
// every base item flagged dataLengkap:true must have a JAGUNG_DETAIL entry,
// and every JAGUNG_DETAIL entry must correspond to a base item flagged true.
if (import.meta.env?.DEV) {
  const detailIds = new Set(Object.keys(JAGUNG_DETAIL));
  for (const item of getJagungList()) {
    const hasDetail = detailIds.has(item.id);
    if (item.dataLengkap !== hasDetail) {
      console.warn(
        `[jagungDetailData] dataLengkap mismatch for "${item.id}": ` +
        `base.dataLengkap=${item.dataLengkap} but detail entry ${hasDetail ? 'exists' : 'is missing'}.`
      );
    }
  }
}
