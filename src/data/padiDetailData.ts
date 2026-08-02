// ─── MP-003A — Detail Data: Padi ──────────────────────────────────────────────
// Full nutrition reference, usage, price, and AI insight for every Padi item.
// Merged with base PadiItem from padiData.ts via getPadiDetail().
//
// Sumber data nutrisi:
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi
//     Pakan untuk Indonesia. Gadjah Mada University Press.
//   • NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Ed.
//   • Feedipedia (2023). INRA-CIRAD-AFZ-FAO Animal Feed Resources.
//   • JIRCAS (2013). Feed Composition Tables for Southeast Asia.
//
// Semua nilai dinyatakan dalam basis as-fed (segar), sesuai pola jagungDetailData.ts.
// Label "Estimasi Referensi" ditampilkan di UI untuk menandakan nilai dapat dioverride.

import { getPadiById, getPadiList, type PadiItem } from './padiData';

type DetailFields = Required<
  Pick<
    PadiItem,
    'namaLatin' | 'asalBahan' | 'bentuk' | 'nutrisi' | 'penggunaan' | 'harga' | 'referensi' | 'aiInsight'
  >
>;

const PADI_DETAIL: Record<string, DetailFields> = {

  // ── 1. Gabah ───────────────────────────────────────────────────────────────
  'gabah': {
    namaLatin: 'Oryza sativa L.',
    asalBahan: 'Butir padi utuh bersama sekam, hasil panen tanaman padi sebelum penggilingan',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 6.6, sk: 7.9, lk: 1.6, abu: 4.7, betn: 56.7,
      tdn: 57, me: 2340,
      ndf: 25, adf: 12,
      ca: 0.03, p: 0.24, mg: 0.08, na: 0.02, k: 0.26, s: 0.06,
      vitamin: 'Tiamin (B1) ± 0.4 mg/kg; Niasin; pro-vitamin A (beta-karoten kecil)',
      mineral: 'Silika tinggi berasal dari sekam (±SiO₂ 4–6%); P organik (fitat)',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Ayam Kampung', 'Itik', 'Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Grower', 'Penggemukan'],
      catatan: 'Sekam dalam gabah menurunkan kecernaan energi. Untuk ruminansia, giling atau pecah sekam terlebih dahulu untuk meningkatkan akses pati. Hindari penyimpanan > 3 bulan pada kadar air > 13% untuk mencegah jamur.',
    },
    harga: {
      estimasiAI: 5500, hargaMarketplace: 5300,
      satuan: 'per kg', supplier: 'Petani / KUD / Penggilingan padi',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 112',
        'Feedipedia (2023) — Paddy grain (Oryza sativa), ruminants',
        'NRC (2001) — Nutrient Requirements of Dairy Cattle, Appendix Table',
      ],
      sumberData: 'Gabah varietas IR64 dan Ciherang, area sentra padi Jawa Tengah dan Jawa Timur',
      catatan: 'Nilai estimasi referensi. Kandungan sekam ±20% dari bobot gabah berkontribusi SK dan silika tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Gabah berfungsi sebagai sumber energi-karbohidrat moderat (TDN 57%, ME 2.340 kcal/kg) yang mengandung pati dari beras dan serat dari sekam, cocok untuk ternak kecil dan unggas.' },
      { type: 'kelebihan', icon: '✅', text: 'Tersedia melimpah di sentra padi dengan harga kompetitif (±Rp 5.500/kg). Palatabilitas baik untuk unggas dan ruminansia kecil. Lebih lengkap dibanding beras menir karena sekam memberi serat kasar.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Silika dari sekam (±4–6% BK) membatasi kecernaan di ruminansia — TDN hanya 57%, jauh di bawah jagung (82%). Protein relatif rendah (PK 6,6%) dan P terikat fitat sehingga bioavailabilitas rendah.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan dedak padi halus (PK 11,5%) atau bungkil kedelai untuk menutup defisit protein. Tambahkan Ca suplemen karena rasio Ca:P tidak ideal (0,03:0,24).' },
      { type: 'peringatan', icon: '🚨', text: 'Kadar air > 13% memicu pertumbuhan kapang dan aflatoksin B1. Simpan dalam kondisi kering, ventilasi baik. Batasi penggunaan ≤40% ransum karena silika tinggi dapat mengiritasi saluran cerna bila berlebihan.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif: Gabah Kering Giling (KA ≤14%, lebih stabil); Beras Menir (energi jauh lebih tinggi, minus sekam); Jagung Pipil (TDN 82%, lebih efisien untuk penggemukan).' },
    ],
  },

  // ── 2. Gabah Kering Panen (GKP) ───────────────────────────────────────────
  'gabah-kering-panen': {
    namaLatin: 'Oryza sativa L. (pascapanen segar)',
    asalBahan: 'Gabah yang baru dipanen dari lapangan sebelum pengeringan lanjutan, kadar air 18–25%',
    bentuk: ['Butiran', 'Segar'],
    nutrisi: {
      bk: 80, kadarAir: 20,
      pk: 6.0, sk: 7.2, lk: 1.4, abu: 4.2, betn: 51.2,
      tdn: 52, me: 2130,
      ndf: 23, adf: 11,
      ca: 0.02, p: 0.21, mg: 0.07, na: 0.02, k: 0.23,
      vitamin: 'Tiamin (B1), pro-vitamin A; kadar vitamin lebih rendah dibanding GKG karena masih basah',
      mineral: 'Silika dari sekam; mineral dilutasi oleh kadar air tinggi',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 35,
      targetTernak: ['Ayam Kampung', 'Itik', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Grower'],
      catatan: 'Harus segera digunakan dalam 2–3 hari setelah panen atau dikeringkan ke KA ≤14%. Kadar air tinggi memicu kapang dan fermentasi tidak terkontrol yang menurunkan nilai gizi.',
    },
    harga: {
      estimasiAI: 5200, hargaMarketplace: 5000,
      satuan: 'per kg', supplier: 'Petani langsung saat musim panen',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 113',
        'Feedipedia (2023) — Paddy grain, high moisture',
        'Badan Standarisasi Nasional — SNI 01-0224-1987 (GKP)',
      ],
      sumberData: 'GKP varietas Ciherang, pengukuran lapang pasca-panen musim hujan',
      catatan: 'Nilai nutrisi dinyatakan pada basis 80% BK (KA 20%). Nilai aktual bervariasi 18–25% tergantung waktu panen dan cuaca.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'GKP adalah gabah segar pascapanen (BK 80%, ME 2.130 kcal/kg) — nilai energi lebih rendah dari GKG karena sebagian bobot adalah air, namun palatabilitas sangat baik untuk unggas dan ternak kecil.' },
      { type: 'kelebihan', icon: '✅', text: 'Murah dan mudah diperoleh langsung saat musim panen. Palatabilitas tinggi karena kadar air memberi kesegaran. Cocok untuk ternak yang dekat dengan sentra padi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Umur simpan sangat pendek (< 3 hari tanpa pengeringan). Nilai nutrisi on-DM basis identik gabah, namun volume ransum lebih besar karena dilusi air. TDN 52% (as-fed) tergolong rendah.' },
      { type: 'kombinasi', icon: '🔗', text: 'Segera kombinasikan dengan bahan kering (dedak, konsentrat) untuk menyeimbangkan kadar air ransum total ≤ 30–35% agar konsumsi BK tidak tertekan.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan simpan lebih dari 48 jam dalam kondisi segar. Kapang dan bakteri berkembang cepat di atas 14% KA, menghasilkan aflatoksin dan menurunkan palatabilitas drastis.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih stabil: Gabah Kering Giling (GKG, KA ≤14%) atau Gabah biasa yang sudah dijemur 2–3 hari hingga KA turun ke 15%.' },
    ],
  },

  // ── 3. Gabah Kering Giling (GKG) ──────────────────────────────────────────
  'gabah-kering-giling': {
    namaLatin: 'Oryza sativa L. (grade penggilingan)',
    asalBahan: 'Gabah dengan kadar air ≤14% yang memenuhi standar mutu penggilingan beras',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 86, kadarAir: 14,
      pk: 6.5, sk: 7.7, lk: 1.6, abu: 4.6, betn: 55.6,
      tdn: 56, me: 2295,
      ndf: 24, adf: 12,
      ca: 0.03, p: 0.23, mg: 0.08, na: 0.02, k: 0.25,
      vitamin: 'Tiamin (B1) ± 0.5 mg/kg; Niasin; Vitamin E kecil',
      mineral: 'Silika dari sekam; profil mineral lebih konsisten dibanding GKP',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 40,
      targetTernak: ['Ayam Kampung', 'Itik', 'Sapi Potong', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Grower', 'Penggemukan'],
      catatan: 'Pilihan standar perdagangan dengan nilai gizi yang konsisten dan stabil. Dapat disimpan hingga 6 bulan pada KA ≤14% dan bebas dari aflatoksin yang signifikan.',
    },
    harga: {
      estimasiAI: 5800, hargaMarketplace: 5600,
      satuan: 'per kg', supplier: 'Penggilingan padi / Pedagang gabah',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 112',
        'Feedipedia (2023) — Paddy grain, ruminants & poultry',
        'BSN — SNI 01-0224-1987 Gabah',
      ],
      sumberData: 'Sampel GKG dari penggilingan padi skala menengah, Jawa Tengah',
      catatan: 'Nilai estimasi referensi pada basis 86% BK. GKG memiliki profil nutrisi yang lebih konsisten dibanding GKP.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'GKG adalah bentuk gabah paling stabil untuk penyimpanan (BK 86%, TDN 56%, ME 2.295 kcal/kg). Standar mutu penggilingan menjamin konsistensi nilai nutrisi batch ke batch.' },
      { type: 'kelebihan', icon: '✅', text: 'Mutu nutrisi konsisten (PK 6,5%, TDN 56%) dan umur simpan panjang (≥6 bulan). Tersedia sepanjang tahun dari pedagang gabah dan penggilingan. Harga lebih terprediksi dari GKP.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Seperti semua gabah, sekam tinggi serat (SK 7,7%, NDF 24%) dan silika yang membatasi kecernaan ruminansia. Protein rendah (PK 6,5%) tidak cukup untuk ransum tunggal.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan dedak padi halus (PK 11,5%) untuk meningkatkan protein, atau dengan bungkil kedelai untuk ransum unggas. Suplementasi Ca diperlukan karena Ca sangat rendah (0,03%).' },
      { type: 'peringatan', icon: '🚨', text: 'Walaupun KA ≤14%, tetap periksa aflatoksin secara berkala terutama jika disimpan di gudang lembab. Kadar silika tinggi — jangan jadikan satu-satunya sumber serat ruminansia.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk efisiensi energi yang lebih tinggi: giling sekamnya menjadi beras menir (TDN naik ke 84%). Untuk sumber energi lebih efisien: Jagung Pipil Kering (TDN 82%).' },
    ],
  },

  // ── 4. Gabah Afkir ─────────────────────────────────────────────────────────
  'gabah-afkir': {
    namaLatin: 'Oryza sativa L. (reject/off-grade)',
    asalBahan: 'Gabah yang tidak memenuhi standar mutu: butir hampa, ukuran kecil, atau kadar air tinggi',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 85, kadarAir: 15,
      pk: 5.6, sk: 10.4, lk: 1.4, abu: 5.1, betn: 52.5,
      tdn: 50, me: 2050,
      ndf: 32, adf: 18,
      ca: 0.03, p: 0.20, mg: 0.07, na: 0.02, k: 0.22,
      vitamin: 'Tiamin rendah; karotenoid sangat kecil',
      mineral: 'Silika lebih tinggi karena proporsi butir hampa/sekam lebih besar',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 30,
      targetTernak: ['Ayam Kampung', 'Itik', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Grower'],
      catatan: 'Nilai gizi lebih rendah dari gabah normal karena proporsi butir hampa lebih tinggi. Tetap periksa aflatoksin — gabah afkir sering berasal dari butir yang sudah terekspos lembab. Batasi ≤30% ransum.',
    },
    harga: {
      estimasiAI: 3000, hargaMarketplace: 2800,
      satuan: 'per kg', supplier: 'Penggilingan padi / sortir gabah',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia',
        'Feedipedia (2023) — Paddy, off-grade',
      ],
      sumberData: 'Sampling dari unit sortasi GKG di Jawa Barat dan Jawa Tengah',
      catatan: 'Nilai estimasi referensi. Kualitas bervariasi tergantung proporsi butir hampa. Periksa kadar air dan aflatoksin sebelum penggunaan massal.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Gabah afkir berfungsi sebagai sumber energi murah (TDN 50%, ME 2.050 kcal/kg) dengan harga ±45% lebih rendah dari GKP, cocok untuk ternak kecil dan unggas kampung.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga sangat ekonomis (Rp 3.000/kg). Tersedia dari unit sortasi gabah. Nilai nutrisi masih cukup untuk pemeliharaan ayam kampung dan itik meski lebih rendah dari gabah standar.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein rendah (PK 5,6%), serat tinggi (SK 10,4%, NDF 32%) karena butir hampa lebih banyak. TDN hanya 50% — efisiensi energi buruk dibanding bahan lain seharga. Risiko aflatoksin lebih tinggi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Harus dikombinasi dengan protein suplemen (tepung ikan, bungkil kedelai) karena PK 5,6% jauh dari kebutuhan ayam (≥16%) dan sapi (≥12%). Batasi sebagai "pengencer" ransum saja.' },
      { type: 'peringatan', icon: '🚨', text: 'Wajib cek aflatoksin sebelum penggunaan — gabah afkir dari butir basah/lembab berisiko tinggi. Jangan simpan lebih dari 1 bulan. Batasi ≤30% ransum agar tidak menekan performa ternak.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif lebih baik untuk harga serupa: Dedak Padi Kasar (TDN 52%, PK lebih tinggi); Gabah sortiran — bila "afkir" karena fisik saja bukan kontaminasi, nilai nutrisinya mendekati normal.' },
    ],
  },

  // ── 5. Beras Menir ─────────────────────────────────────────────────────────
  'beras-menir': {
    namaLatin: 'Oryza sativa L. (brokens ≥25% grain)',
    asalBahan: 'Pecahan beras berukuran ≥25% biji utuh, hasil samping penggilingan beras putih',
    bentuk: ['Butiran', 'Kering'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 7.8, sk: 0.5, lk: 0.6, abu: 0.5, betn: 78.6,
      tdn: 84, me: 3360,
      ndf: 2.0, adf: 0.8,
      ca: 0.02, p: 0.15, mg: 0.04, na: 0.01, k: 0.10,
      vitamin: 'Tiamin (B1) lebih rendah dari beras merah (penyosohan menghilangkan aleuron); Niasin kecil',
      mineral: 'Mineral sangat rendah karena aleuron telah dihilangkan; perlu suplementasi mineral lengkap',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 60,
      targetTernak: ['Ayam Broiler', 'Ayam Kampung', 'Itik', 'Babi', 'Sapi Perah', 'Anak Sapi'],
      programCocok: ['Penggemukan', 'Menyusui', 'Grower'],
      catatan: 'Sumber pati sangat mudah dicerna (TDN 84%). Ideal untuk starter ayam dan anak ternak karena serat sangat rendah. Untuk ruminansia, dapat menggantikan jagung pada saat harga kompetitif. Perlu suplementasi mineral dan vitamin.',
    },
    harga: {
      estimasiAI: 4500, hargaMarketplace: 4300,
      satuan: 'per kg', supplier: 'Penggilingan beras / Rice mill',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 108',
        'NRC (1994) — Nutrient Requirements of Poultry',
        'Feedipedia (2023) — Broken rice, poultry & pig',
      ],
      sumberData: 'Beras menir dari penggilingan skala besar Jawa Timur dan Sulawesi Selatan',
      catatan: 'Nilai estimasi referensi. Kualitas nutrisi sangat konsisten karena berasal dari endosperma beras. Variasi utama pada kadar air.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍚', text: 'Beras menir adalah sumber energi pati murni terbaik di antara turunan padi — TDN 84%, ME 3.360 kcal/kg, mendekati nilai jagung giling (TDN ~82%). Serat sangat rendah (SK 0,5%, NDF 2%).' },
      { type: 'kelebihan', icon: '✅', text: 'Kecernaan pati sangat tinggi karena tanpa sekam. Palatabilitas sangat baik untuk semua jenis ternak. TDN 84% setara jagung — bisa saling menggantikan tergantung harga pasar.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein relatif rendah (PK 7,8%) dan mineral sangat rendah (Ca 0,02%, P 0,15%) akibat penyosohan. Tidak bisa digunakan sebagai satu-satunya komponen ransum tanpa suplementasi mineral-vitamin.' },
      { type: 'kombinasi', icon: '🔗', text: 'Wajib dikombinasi dengan suplemen mineral-vitamin lengkap. Tambahkan bekatul atau dedak padi halus untuk protein dan mineral. Untuk ayam: pasangkan dengan tepung ikan + premix. Untuk sapi: kombinasi dengan jerami + mineral blok.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan gunakan sebagai satu-satunya sumber energi tanpa suplementasi — defisit Ca dan P akan menyebabkan gangguan tulang. Pada ruminansia, proposi tinggi pati cepat-cerna bisa memicu asidosis rumen bila tidak diintroduksi bertahap.' },
      { type: 'alternatif', icon: '🔄', text: 'Bila harga kompetitif, dapat menggantikan jagung giling (TDN hampir sama). Saat mahal, Menir Pecah lebih murah dengan nutrisi hampir identik. Untuk keperluan energy-dense: DDGS atau Bekatul bisa melengkapi profil nutrisi.' },
    ],
  },

  // ── 6. Menir Pecah ─────────────────────────────────────────────────────────
  'menir-pecah': {
    namaLatin: 'Oryza sativa L. (fine brokens <25% grain)',
    asalBahan: 'Pecahan beras halus berukuran <25% biji utuh, hasil samping terakhir penggilingan padi',
    bentuk: ['Tepung', 'Kering'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 7.5, sk: 0.4, lk: 0.5, abu: 0.4, betn: 79.2,
      tdn: 85, me: 3400,
      ndf: 1.5, adf: 0.5,
      ca: 0.02, p: 0.13, mg: 0.03, na: 0.01, k: 0.09,
      vitamin: 'Sangat rendah — sebagian besar vitamin hilang bersama aleuron pada penyosohan',
      mineral: 'Mineral paling rendah di antara semua turunan padi; hampir murni endosperma pati',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 55,
      targetTernak: ['Ayam Broiler', 'Ayam Kampung', 'Babi', 'Anak Sapi', 'Anak Kambing'],
      programCocok: ['Grower', 'Penggemukan', 'Menyusui'],
      catatan: 'Tekstur tepung halus mempermudah pencampuran dalam ransum pelleted atau mash. Kecernaan tertinggi di antara semua turunan padi. Perlu suplementasi mineral dan vitamin secara menyeluruh.',
    },
    harga: {
      estimasiAI: 3800, hargaMarketplace: 3600,
      satuan: 'per kg', supplier: 'Rice mill besar / Industri penggilingan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 108',
        'Feedipedia (2023) — Brewers rice / Fine broken rice',
        'NRC (1994) — Nutrient Requirements of Poultry',
      ],
      sumberData: 'Menir pecah (brewers rice) dari industri penggilingan beras skala industri',
      catatan: 'Nilai estimasi referensi. Kualitas nutrisi sangat homogen — hampir murni pati endosperma. Juga dikenal sebagai "Brewers Rice" di industri pakan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍚', text: 'Menir pecah adalah sumber pati termurni dari padi — TDN 85%, ME 3.400 kcal/kg, SK hanya 0,4%. Hampir setara atau sedikit melebihi beras menir dalam ketersediaan energi per kg bahan kering.' },
      { type: 'kelebihan', icon: '✅', text: 'Energi tertinggi di antara semua turunan padi (TDN 85%). Harga lebih murah dari beras menir (Rp 3.800 vs 4.500/kg) dengan nilai nutrisi hampir identik — value for money terbaik untuk sumber pati padi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Mineral dan vitamin hampir nol (Ca 0,02%, P 0,13%). Tanpa suplementasi komprehensif, penggunaan sebagai komponen tunggal akan menyebabkan defisiensi parah. Serat sangat rendah — tidak memberikan efek roughage.' },
      { type: 'kombinasi', icon: '🔗', text: 'Sangat cocok dikombinasi dengan bekatul (menambah PK, LK, mineral) + premix vitamin-mineral. Untuk ransum ayam: menir pecah + bungkil kedelai + tepung tulang + premix sudah memberikan profil nutrisi lengkap.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan gunakan tanpa suplementasi mineral-vitamin. Pada ruminansia: perhatikan rasio NFC:NDF di ransum total — menir pecah sangat mudah difermentasi di rumen dan bisa memicu asidosis bila berlebihan.' },
      { type: 'alternatif', icon: '🔄', text: 'Dapat menggantikan jagung giling dalam ransum unggas saat harga kompetitif (nilai ME setara). Beras menir adalah alternatif harga lebih tinggi dengan profil identik. Untuk industri: sering digunakan dalam ransum standar industri petelur.' },
    ],
  },

  // ── 7. Dedak Padi Kasar ────────────────────────────────────────────────────
  'dedak-padi-kasar': {
    namaLatin: 'Oryza sativa L. — pericarp + hull fractions',
    asalBahan: 'Lapisan luar beras (perikarp) beserta sebagian sekam halus, hasil penggilingan kasar padi',
    bentuk: ['Tepung', 'Kering'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 7.9, sk: 17.6, lk: 6.6, abu: 11.0, betn: 34.9,
      tdn: 46, me: 1885,
      ndf: 43, adf: 27,
      ca: 0.07, p: 0.97, mg: 0.30, na: 0.02, k: 0.65, s: 0.09,
      vitamin: 'Tiamin (B1) ± 4 mg/kg; Niasin; Asam pantotenat; Vitamin B6',
      mineral: 'Kaya P (0,97%) namun sebagian besar terikat fitat — bioavailabilitas P untuk unggas rendah tanpa fitase',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Ayam Kampung'],
      programCocok: ['Indukan', 'Penggemukan', 'Grower'],
      catatan: 'Kandungan serat kasar dan sekam lebih tinggi dari dedak halus membatasi penggunaan ≤25%. Untuk ruminansia lebih cocok dari unggas. Mudah tengik (LK 6,6%) — simpan maksimum 2–3 minggu setelah produksi. Tambahkan antioksidan bila perlu.',
    },
    harga: {
      estimasiAI: 2500, hargaMarketplace: 2300,
      satuan: 'per kg', supplier: 'Penggilingan padi / RMU skala kecil',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 110',
        'Feedipedia (2023) — Rice bran, coarse',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Dedak kasar dari RMU (Rice Milling Unit) skala kecil Jawa Tengah dan Kalimantan',
      catatan: 'Nilai estimasi referensi. Kandungan sekam dalam dedak kasar bervariasi tergantung mesin gilingan — dedak dari gilingan kuno cenderung mengandung lebih banyak sekam.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🏭', text: 'Dedak padi kasar berfungsi sebagai sumber serat-energi moderat (TDN 46%, ME 1.885 kcal/kg) dengan profil B-vitamin yang baik, terutama untuk ransum ruminansia sapi dan kambing.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga ekonomis (Rp 2.500/kg) dengan ketersediaan tinggi dari seluruh penggilingan padi. Mengandung B-vitamin (Tiamin 4 mg/kg) dan P tinggi (0,97%). Cocok untuk ruminansia karena serat membantu fermentasi rumen.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Serat kasar tinggi (SK 17,6%, NDF 43%) membatasi kecernaan unggas. Lemak 6,6% mudah teroksidasi — rentan tengik. P terikat fitat sehingga bioavailabilitas rendah untuk unggas tanpa enzim fitase.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk ruminansia: kombinasikan dengan jerami padi (roughage) + konsentrat protein (bungkil) + mineral. Untuk ayam kampung: batasi ≤15% dan tambahkan enzim fitase untuk meningkatkan ketersediaan P.' },
      { type: 'peringatan', icon: '🚨', text: 'Umur simpan pendek! Lemak (6,6%) mulai tengik dalam 2–3 minggu pada suhu > 30°C. Simpan di tempat sejuk dan kering. Gunakan sesegera mungkin. Jangan campurkan dengan ransum basah yang akan disimpan.' },
      { type: 'alternatif', icon: '🔄', text: 'Dedak padi halus memberikan nilai nutrisi lebih tinggi (PK 11,5%, TDN 65%) dengan serat lebih rendah untuk unggas. Bekatul paling premium namun paling rentan tengik. Pilih sesuai ketersediaan lokal dan umur simpan yang dibutuhkan.' },
    ],
  },

  // ── 8. Dedak Padi Halus ────────────────────────────────────────────────────
  'dedak-padi-halus': {
    namaLatin: 'Oryza sativa L. — aleuron + pericarp (fine fraction)',
    asalBahan: 'Lapisan aleuron dan perikarp luar beras hasil penggilingan halus, bebas dari sekam kasar',
    bentuk: ['Tepung', 'Kering'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 11.5, sk: 11.5, lk: 11.0, abu: 10.0, betn: 46.0,
      tdn: 65, me: 2665,
      ndf: 26, adf: 16,
      ca: 0.07, p: 1.35, mg: 0.45, na: 0.02, k: 0.90, s: 0.11,
      vitamin: 'Tiamin (B1) ± 10 mg/kg; Riboflavin (B2); Niasin; Piridoksin (B6); Tokoferol (Vit E ± 25 mg/kg)',
      mineral: 'Kaya Mg (0,45%) dan K (0,90%); P tinggi namun sebagian fitat',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Ayam Kampung', 'Itik'],
      programCocok: ['Penggemukan', 'Indukan', 'Menyusui', 'Grower'],
      catatan: 'Nutrisi lebih lengkap dari dedak kasar. Tetap rentan tengik karena LK 11% — batas penggunaan 2–4 minggu setelah produksi. Pada sapi perah: batasi ≤20% karena lemak tinggi bisa mempengaruhi komposisi susu.',
    },
    harga: {
      estimasiAI: 3000, hargaMarketplace: 2800,
      satuan: 'per kg', supplier: 'Penggilingan beras modern / Rice miller',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 110',
        'NRC (2001) — Nutrient Requirements of Dairy Cattle',
        'Feedipedia (2023) — Rice bran, fine',
      ],
      sumberData: 'Dedak halus dari penggilingan beras modern berteknologi rubber roll, Jawa Tengah',
      catatan: 'Nilai estimasi referensi. Kualitas dedak halus jauh lebih konsisten dari dedak kasar karena bebas kontaminasi sekam. Cek kadar lemak bebas sebagai indikator ketengikan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🏭', text: 'Dedak padi halus adalah sumber energi-protein seimbang (TDN 65%, PK 11,5%, ME 2.665 kcal/kg) dengan kekayaan B-vitamin — salah satu pakan by-product terbaik dari padi untuk unggas dan ruminansia.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein lebih tinggi dari dedak kasar (PK 11,5% vs 7,9%). TDN 65% mendekati jagung untuk ruminansia. Kaya Tiamin (10 mg/kg), Vitamin E (25 mg/kg), Mg, dan K. Harga terjangkau (Rp 3.000/kg).' },
      { type: 'kekurangan', icon: '⚠️', text: 'Lemak 11% sangat rentan oksidasi — umur simpan hanya 2–4 minggu tanpa antioksidan. P fitat bioavailabilitas rendah untuk unggas. Abu tinggi (10%) menunjukkan kandungan silika yang masih signifikan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk sapi penggemukan: dedak halus + urea (3%) + mineral blok + hijauan. Untuk ayam: batasi ≤20%, kombinasikan dengan tepung ikan, bungkil kedelai, dan premix fitase untuk meningkatkan ketersediaan P.' },
      { type: 'peringatan', icon: '🚨', text: 'Simpan di tempat sejuk (< 25°C), terhindar cahaya. Dedak halus yang tengik (aroma asam atau apek) menurunkan palatabilitas dan konsumsi. Pada sapi perah: lemak tinggi (11%) bisa mengganggu metabolisme lemak susu bila > 20% ransum.' },
      { type: 'alternatif', icon: '🔄', text: 'Bekatul (protein 13%, lemak 16–17%) adalah versi premium dengan nutrisi lebih tinggi namun lebih mahal dan lebih rentan tengik. Dedak kasar lebih murah tapi profil nutrisi lebih rendah. Pilih dedak halus sebagai trade-off terbaik.' },
    ],
  },

  // ── 9. Bekatul ─────────────────────────────────────────────────────────────
  'bekatul': {
    namaLatin: 'Oryza sativa L. — aleuron layer (rice polish)',
    asalBahan: 'Lapisan aleuron murni hasil penyosohan beras putih dari penggilingan modern',
    bentuk: ['Tepung', 'Kering'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 13.0, sk: 7.0, lk: 16.5, abu: 8.5, betn: 45.0,
      tdn: 71, me: 2910,
      ndf: 17, adf: 8,
      ca: 0.06, p: 1.60, mg: 0.65, na: 0.02, k: 1.10, s: 0.13,
      vitamin: 'Vitamin E (tokoferol) ± 45 mg/kg; Tiamin (B1) ± 15 mg/kg; Riboflavin; Niasin; Piridoksin (B6); gamma-Oryzanol',
      mineral: 'Paling kaya mineral di antara turunan padi — Mg 0,65%, K 1,10%, P 1,60%; mengandung fitase alami',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 20,
      targetTernak: ['Sapi Perah', 'Sapi Potong', 'Kambing Perah', 'Domba', 'Ayam Kampung', 'Itik'],
      programCocok: ['Menyusui', 'Penggemukan', 'Indukan', 'Bunting'],
      catatan: 'Bekatul paling kaya nutrisi namun paling rentan oksidasi lemak. Gunakan dalam 1–2 minggu setelah produksi. Untuk sapi perah: batasi ≤15% karena lemak 16,5% dapat menekan fermentasi selulolitik rumen bila berlebihan. Gamma-oryzanol memberikan efek adaptogenik positif.',
    },
    harga: {
      estimasiAI: 3500, hargaMarketplace: 3300,
      satuan: 'per kg', supplier: 'Penggilingan beras premium / Pabrik beras',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 111',
        'Feedipedia (2023) — Rice bran (stabilized), dairy cattle',
        'NRC (2001) — Nutrient Requirements of Dairy Cattle',
        'Luh, B.S. (1991) — Rice: Volume 2, Utilization. Chapman & Hall.',
      ],
      sumberData: 'Bekatul stabilized dari pabrik beras modern Jawa Timur dan Sulawesi Selatan',
      catatan: 'Nilai estimasi referensi untuk bekatul segar (non-stabilized). Bekatul stabilized (dipanaskan) memiliki umur simpan lebih panjang dengan profil nutrisi serupa.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⭐', text: 'Bekatul adalah "premium by-product" padi dengan nilai nutrisi tertinggi — PK 13%, LK 16,5%, TDN 71%, ME 2.910 kcal/kg. Kaya Vitamin E (45 mg/kg), gamma-oryzanol, dan mineral, terutama cocok untuk sapi perah laktasi.' },
      { type: 'kelebihan', icon: '✅', text: 'Profil nutrisi terlengkap di antara semua turunan padi: protein (13%), lemak tinggi bergizi (16,5%), Vitamin E (45 mg/kg), Mg (0,65%), K (1,10%), P (1,60%). Gamma-oryzanol bermanfaat untuk performa reproduksi dan kekebalan ternak.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Umur simpan paling pendek (< 2 minggu tanpa stabilisasi) karena enzim lipase aktif memecah lemak menjadi asam lemak bebas dan tengik. Batas penggunaan ≤20% untuk sapi perah — lemak tinggi bisa menekan selulolisis rumen.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk sapi perah laktasi: bekatul (15%) + dedak padi halus (10%) + hijauan segar + konsentrat protein. Tambahkan vitamin E suplemen bila bekaul sudah > 2 minggu. Untuk ayam: kombinasi dengan premix Ca–P karena Ca bekatul rendah (0,06%).' },
      { type: 'peringatan', icon: '🚨', text: 'Kritis: gunakan dalam 1–2 minggu setelah milling. Bekatul tengik ditandai aroma asam lemak, penurunan palatabilitas, dan potensi gangguan hati pada unggas (peroksidasi lipid). Pilih bekatul stabilized bila perlu simpan lebih lama.' },
      { type: 'alternatif', icon: '🔄', text: 'Bekatul stabilized (heat-treated) lebih tahan lama dengan nutrisi hampir sama. Dedak padi halus lebih murah dan lebih tahan simpan. Untuk pengganti lemak: bisa dikombinasi lemak bypass rumen (protected fat) sebagai alternatif lebih stabil.' },
    ],
  },

  // ── 10. Sekam Padi ─────────────────────────────────────────────────────────
  'sekam-padi': {
    namaLatin: 'Oryza sativa L. — lemma & palea (hull)',
    asalBahan: 'Kulit keras pelindung biji padi yang terlepas saat penggilingan, terdiri dari lemma dan palea',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 3.2, sk: 38.0, lk: 0.8, abu: 19.0, betn: 31.0,
      tdn: 20, me: 820,
      ndf: 70, adf: 52,
      ca: 0.10, p: 0.05, mg: 0.05, na: 0.02, k: 0.30, s: 0.05,
      vitamin: 'Praktis nihil — tidak ada kandungan vitamin yang signifikan',
      mineral: 'Didominasi silika (SiO₂ ± 15–20% BK); Ca dan P sangat rendah',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 10,
      targetTernak: ['Sapi Potong', 'Kerbau'],
      programCocok: ['Indukan'],
      catatan: 'Nilai pakan sangat rendah (TDN 20%). Penggunaan utama sebagai litter kandang unggas, media kompos, dan campuran pakan dalam jumlah sangat kecil (≤10%) hanya sebagai bulking agent atau sumber roughage darurat. Silika tinggi berpotensi abrasif pada saluran cerna bila ≥15%.',
    },
    harga: {
      estimasiAI: 800, hargaMarketplace: 700,
      satuan: 'per kg', supplier: 'Penggilingan padi (by-product murah)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 113',
        'Feedipedia (2023) — Rice husk / hull, ruminants',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Sekam padi dari penggilingan berbagai varietas padi, Jawa dan Kalimantan',
      catatan: 'Nilai estimasi referensi. TDN 20% adalah batas bawah bahan pakan yang masih diterima untuk ternak ruminansia. Silika SiO₂ ±15–20% BK termasuk dalam fraksi abu (19%).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Sekam padi adalah bahan dengan nilai gizi paling rendah di antara semua turunan padi — TDN hanya 20%, ME 820 kcal/kg, SK 38%, NDF 70%. Fungsi utama: litter kandang, media kompos, atau bulking agent darurat.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga sangat murah (Rp 800/kg) dan tersedia melimpah dari semua penggilingan padi. Kandungan silika tinggi membuat sekam tahan busuk — baik untuk litter kandang yang perlu daya serap. Bisa dikompos menjadi pupuk organik bernilai tinggi.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Nilai gizi sangat rendah: TDN 20%, protein 3,2%, hampir tidak ada vitamin. Silika (SiO₂) tinggi menjadi ancaman abrasif pada mukosa saluran cerna bila dikonsumsi berlebih. Palatabilitas sangat buruk.' },
      { type: 'kombinasi', icon: '🔗', text: 'Bila terpaksa digunakan sebagai pakan: batasi ≤5–10% dari total ransum, campur dengan urea-molases blok untuk meningkatkan kecernaan. Lebih baik gunakan sebagai bahan kompos yang dikembalikan ke lahan sawah.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan gunakan > 10% ransum — silika tinggi menyebabkan iritasi dan luka pada mukosa mulut, esofagus, dan rumen. Tidak disarankan untuk unggas sama sekali. Gunakan hanya sebagai pilihan terakhir saat tidak ada bahan lain.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk sumber serat murah yang lebih bergizi: Jerami Padi Kering (TDN 38%, PK 3,5% — jauh lebih baik). Untuk litter kandang: sekam padi ideal. Sekam bakar lebih inert dan lebih baik untuk media tanam.' },
    ],
  },

  // ── 11. Sekam Bakar ────────────────────────────────────────────────────────
  'sekam-bakar': {
    namaLatin: 'Oryza sativa L. hull — partially carbonized (biochar)',
    asalBahan: 'Sekam padi yang dibakar tidak sempurna (karbonisasi parsial, 400–600°C) menghasilkan arang aktif',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 95, kadarAir: 5,
      pk: 1.5, sk: 25.0, lk: 0.3, abu: 48.0, betn: 20.2,
      tdn: 10, me: 410,
      ndf: 66, adf: 50,
      ca: 0.12, p: 0.04, mg: 0.04, na: 0.03, k: 0.35,
      vitamin: 'Nihil — semua vitamin terdestruksi oleh proses pembakaran',
      mineral: 'Silika (SiO₂) + karbon aktif mendominasi fraksi abu yang sangat tinggi (48%)',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Potong'],
      programCocok: ['Indukan'],
      catatan: 'Nilai gizi sangat rendah — tidak direkomendasikan sebagai pakan utama. Penggunaan dalam pakan sangat terbatas (≤5%) dan hanya sebagai adsorben mikotoksin atau untuk mengurangi asidosis. Fungsi utama: litter kandang, media tanam, pembenah tanah.',
    },
    harga: {
      estimasiAI: 600, hargaMarketplace: 550,
      satuan: 'per kg', supplier: 'Pengolah sekam / Petani padi',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Rice husk, charred',
        'Chan, K.Y. et al. (2007) — Agronomic values of greenwaste biochar. Aust. J. Soil Res.',
      ],
      sumberData: 'Sekam bakar dari pembakaran tradisional skala petani (tungku bakar) Jawa Tengah',
      catatan: 'Nilai estimasi referensi. Komposisi bervariasi tergantung suhu dan durasi pembakaran. Abu sangat tinggi (48%) mencerminkan konversi bahan organik menjadi karbon dan silika anorganik.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🔥', text: 'Sekam bakar adalah produk karbonisasi sekam padi (TDN hanya 10%, ME 410 kcal/kg, abu 48%). Fungsi utama bukan pakan, melainkan adsorben, litter kandang, dan pembenah tanah (biochar).' },
      { type: 'kelebihan', icon: '✅', text: 'Sebagai adsorben: karbon aktif dalam sekam bakar mampu mengikat mikotoksin (aflatoksin) di saluran cerna ternak bila ditambahkan dalam dosis kecil (1–3% ransum). Harga sangat murah (Rp 600/kg). Stabil disimpan lama.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Nilai gizi sangat rendah (TDN 10%, PK 1,5%). Abu 48% berarti hampir setengah bobotnya adalah mineral inert. Tidak berkontribusi signifikan pada nutrisi ternak. Sifat adsorptif juga bisa mengikat nutrisi lain bila berlebihan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Bila digunakan sebagai adsorben mikotoksin: campurkan 1–2% dari total ransum. Jangan digunakan bersamaan dengan suplemen mineral oral dalam waktu berdekatan karena sifat adsorptifnya bisa mengikat mineral tersebut.' },
      { type: 'peringatan', icon: '🚨', text: 'Dosis > 5% dapat mengikat vitamin larut lemak dan mineral dari ransum sehingga menyebabkan defisiensi sekunder. Tidak direkomendasikan sebagai komponen pakan regular. Hindari penggunaan untuk unggas karena abu/silika tinggi.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk adsorben mikotoksin yang lebih efektif: gunakan mycotoxin binder komersial (bentonit, smektit) yang terstandardisasi. Sekam padi (non-bakar) lebih baik sebagai litter. Untuk pakan roughage: jerami padi jauh lebih bergizi.' },
    ],
  },

  // ── 12. Jerami Padi Segar ──────────────────────────────────────────────────
  'jerami-padi-segar': {
    namaLatin: 'Oryza sativa L. — straw, fresh',
    asalBahan: 'Batang, daun, dan pelepah padi yang tersisa setelah panen gabah, sebelum dijemur',
    bentuk: ['Segar'],
    nutrisi: {
      // As-fed basis, BK ~30% (KA ~70%)
      bk: 30, kadarAir: 70,
      pk: 1.2, sk: 9.0, lk: 0.5, abu: 3.8, betn: 15.5,
      tdn: 12, me: 492,
      ndf: 20, adf: 13,
      ca: 0.07, p: 0.03, mg: 0.04, na: 0.01, k: 0.44,
      vitamin: 'Kandungan vitamin sangat terdilusi oleh kadar air tinggi',
      mineral: 'Silika tinggi (termasuk dalam abu); K relatif tinggi karena berasal dari jaringan tanaman hijau',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 50,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Penggemukan'],
      catatan: 'Nilai nutrisi dinyatakan as-fed (70% KA). Pada basis bahan kering: PK ±4%, TDN ±40%. Diberikan langsung atau dicacah pendek 5–10 cm untuk meningkatkan konsumsi. Harus dihabiskan dalam hari yang sama — tidak dapat disimpan tanpa fermentasi atau pengeringan.',
    },
    harga: {
      estimasiAI: 400, hargaMarketplace: 350,
      satuan: 'per kg', supplier: 'Petani sawah langsung saat panen',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 114',
        'Feedipedia (2023) — Rice straw, fresh, ruminants',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Jerami segar varietras IR64 dan Ciherang, musim panen Jawa Tengah dan Jawa Timur',
      catatan: 'Nilai estimasi referensi pada basis as-fed (BK 30%). Nilai per kg BK: PK 4%, SK 30%, TDN 40%, ME 1.640 kcal/kg. Kandungan K tinggi karena belum dicuci oleh hujan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌱', text: 'Jerami padi segar adalah roughage murah berbasis air (BK hanya 30%, TDN as-fed 12%, ME 492 kcal/kg). Pada basis BK: TDN 40%, PK 4% — cukup untuk mempertahankan bobot hidup sapi dewasa bila dikombinasi dengan suplemen.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga sangat murah (Rp 400/kg) dan melimpah saat musim panen. Palatabilitas lebih baik dari jerami kering karena masih segar. Kandungan K tinggi (0,44% as-fed) menguntungkan ternak yang kekurangan kalium.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein sangat rendah (PK 1,2% as-fed = 4% BK). Serat kasar tinggi dengan lignin yang membatasi kecernaan (NDF 20% as-fed = 65% BK). Tidak bisa disimpan lebih dari 1 hari — memerlukan segera diberikan atau difermentasi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Wajib dikombinasi dengan suplemen protein: urea (1% dari BK ransum) + molases + mineral blok untuk memenuhi kebutuhan N rumen dan mineral. Atau kombinasi dengan konsentrat berbasis dedak-bungkil untuk ransum penggemukan.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan biarkan menumpuk > 12 jam di tempat panas — fermentasi anaerob menghasilkan asam organik dan gas yang menurunkan palatabilitas. Potong pendek (5–10 cm) sebelum diberikan untuk mengurangi seleksi pakan oleh ternak.' },
      { type: 'alternatif', icon: '🔄', text: 'Jerami padi kering lebih praktis untuk penyimpanan jangka panjang (nilai nutrisi sedikit lebih rendah per kg as-fed, tapi BK lebih tinggi sehingga pemberian lebih efisien). Fermentasi dengan urea (urea-treated straw) bisa meningkatkan PK hingga 7–8%.' },
    ],
  },

  // ── 13. Jerami Padi Kering ─────────────────────────────────────────────────
  'jerami-padi-kering': {
    namaLatin: 'Oryza sativa L. — straw, sun-dried',
    asalBahan: 'Batang dan daun padi yang telah dijemur di bawah sinar matahari hingga kadar air ≤15%',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 87, kadarAir: 13,
      pk: 3.5, sk: 31.0, lk: 1.3, abu: 14.8, betn: 36.4,
      tdn: 33, me: 1353,
      ndf: 61, adf: 40,
      ca: 0.22, p: 0.08, mg: 0.12, na: 0.02, k: 0.88, s: 0.07,
      vitamin: 'Vitamin D₂ (dari paparan sinar matahari, kecil); sebagian besar vitamin terdegradasi pengeringan',
      mineral: 'Silika sangat tinggi (termasuk dalam abu 14,8%); Ca relatif tinggi (0,22%) dibanding P (0,08%)',
    },
    penggunaan: {
      palatabilitas: 'Sedang',
      maksPenggunaan: 60,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Penggemukan'],
      catatan: 'Roughage standar untuk ruminansia di Asia Tenggara. Nilai protein sangat rendah (PK 3,5%) — wajib dikombinasi dengan suplemen protein (urea atau bungkil) dan konsentrat energi. Cacah ≤5 cm untuk meningkatkan konsumsi dan mengurangi pemborosan. Dapat disimpan 6–12 bulan bila kering sempurna.',
    },
    harga: {
      estimasiAI: 600, hargaMarketplace: 550,
      satuan: 'per kg', supplier: 'Petani sawah / pedagang pakan ternak',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 114',
        'Feedipedia (2023) — Rice straw, air-dried, ruminants',
        'NRC (2001) — Nutrient Requirements of Dairy Cattle, Appendix',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Jerami padi kering varitas IR64 dan Mekongga, penjemuran alami 5–7 hari, Jawa Tengah',
      catatan: 'Nilai estimasi referensi pada basis 87% BK. Silika tinggi berkontribusi besar pada abu (14,8%). Ca:P ratio 2,75:1 menguntungkan untuk sapi bunting (batas aman Ca:P = 1,5–2,5:1).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Jerami padi kering adalah roughage standar ruminansia Asia Tenggara — TDN 33%, PK 3,5%, NDF 61%. Berfungsi sebagai sumber serat struktural yang menstimulasi ruminasi dan menjaga pH rumen, bukan sebagai sumber energi atau protein.' },
      { type: 'kelebihan', icon: '✅', text: 'Harga sangat murah (Rp 600/kg), tersedia masif dan stabil sepanjang tahun. Dapat disimpan 6–12 bulan bila kering sempurna. Ca relatif cukup (0,22%) — menguntungkan untuk sapi bunting. NDF 61% memastikan ruminasi cukup untuk menjaga pH rumen.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein sangat rendah (PK 3,5%) — tidak bisa memenuhi kebutuhan N ternak ruminansia dewasa (kebutuhan minimum PK ±7%). TDN 33% hanya cukup untuk hidup pokok sapi 200 kg. Silika tinggi membuat kecernaan lignin-silika rendah.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi wajib: jerami kering + urea (25 g/kg jerami) + molases (50 g/kg) + mineral blok = amoniasi basah yang meningkatkan PK ke ±7–8% dan kecernaan. Atau: jerami kering + konsentrat dedak-bungkil-jagung untuk ransum penggemukan.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan gunakan sebagai satu-satunya sumber pakan tanpa suplementasi — sapi akan mengalami defisiensi N, P, dan vitamin B-kompleks yang menyebabkan penurunan bobot badan. Pastikan jerami benar-benar kering sebelum disimpan untuk mencegah jamur.' },
      { type: 'alternatif', icon: '🔄', text: 'Jerami amoniasi (urea-treated) meningkatkan PK ke ±7–8% dengan biaya minimal — alternatif terbaik meningkatkan nilai jerami tanpa mengganti bahan. Silase jerami (sebelum panen) nilai gizi jauh lebih tinggi namun harus dibuat saat segar. Jerami segar lebih enak tapi tidak bisa disimpan.' },
    ],
  },

  // ── 14. Sekam Giling ───────────────────────────────────────────────────────
  'sekam-giling': {
    namaLatin: 'Oryza sativa L. — hull, ground',
    asalBahan: 'Sekam padi utuh yang digiling menjadi tepung kasar untuk mempermudah pencampuran ransum',
    bentuk: ['Tepung', 'Kering'],
    nutrisi: {
      bk: 92, kadarAir: 8,
      pk: 3.0, sk: 37.0, lk: 0.7, abu: 19.5, betn: 31.8,
      tdn: 19, me: 780,
      ndf: 71, adf: 53,
      ca: 0.10, p: 0.05, mg: 0.05, na: 0.02, k: 0.29, s: 0.05,
      vitamin: 'Praktis nihil — sama seperti sekam padi utuh, tidak ada kandungan vitamin signifikan',
      mineral: 'Didominasi silika (SiO₂); Ca dan P sangat rendah, identik sekam padi utuh',
    },
    penggunaan: {
      palatabilitas: 'Kurang',
      maksPenggunaan: 10,
      targetTernak: ['Sapi Potong', 'Kerbau'],
      programCocok: ['Indukan'],
      catatan: 'Fungsi dan nilai gizi identik sekam padi utuh — hanya bentuk fisik lebih halus sehingga lebih mudah dicampur dalam pelet atau ransum komplit. Tetap hanya sebagai bulking agent, bukan sumber energi.',
    },
    harga: {
      estimasiAI: 900, hargaMarketplace: 850,
      satuan: 'per kg', supplier: 'Penggilingan padi dengan unit penggiling sekam',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 113',
        'Feedipedia (2023) — Rice husk / hull, ground, ruminants',
      ],
      sumberData: 'Sekam giling dari unit penggiling sekam skala pabrik pakan, Jawa Timur',
      catatan: 'Nilai estimasi referensi. Proses penggilingan tidak mengubah komposisi kimia — hanya ukuran partikel yang berbeda dari sekam padi utuh.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Sekam giling berfungsi sama seperti sekam padi utuh (TDN 19%, ME 780 kcal/kg) namun bentuk tepung memudahkan pencampuran homogen dalam ransum pelet atau mash.' },
      { type: 'kelebihan', icon: '✅', text: 'Lebih mudah dicampur merata dalam formula dibanding sekam utuh. Tidak menggumpal saat diproses pelet. Harga tetap sangat murah (Rp 900/kg).' },
      { type: 'kekurangan', icon: '⚠️', text: 'Nilai gizi tetap sangat rendah (TDN 19%, PK 3,0%) — penggilingan tidak menambah nutrisi. Silika tinggi tetap berisiko abrasif pada saluran cerna bila berlebihan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Gunakan hanya sebagai bulking agent pada ransum pelet ruminansia (≤10%), dikombinasikan dengan konsentrat energi-protein tinggi untuk menutup defisit nutrisi.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan melebihi 10% ransum. Debu tepung sekam giling dapat mengiritasi saluran pernapasan pekerja dan ternak bila ditangani tanpa ventilasi yang baik.' },
      { type: 'alternatif', icon: '🔄', text: 'Sekam padi utuh (lebih murah bila tidak perlu bentuk halus). Jerami Padi Cacah jauh lebih bergizi untuk fungsi roughage yang sama.' },
    ],
  },

  // ── 15. Pollard Padi ───────────────────────────────────────────────────────
  'pollard-padi': {
    namaLatin: 'Oryza sativa L. — bran/polish middlings',
    asalBahan: 'Fraksi tengah hasil samping penggilingan padi, campuran perikarp dan sedikit aleuron dengan pecahan endosperma',
    bentuk: ['Tepung', 'Kering'],
    nutrisi: {
      bk: 89, kadarAir: 11,
      pk: 9.8, sk: 13.5, lk: 8.5, abu: 9.5, betn: 47.7,
      tdn: 58, me: 2378,
      ndf: 33, adf: 20,
      ca: 0.07, p: 1.15, mg: 0.36, na: 0.02, k: 0.78, s: 0.10,
      vitamin: 'Tiamin (B1) ± 7 mg/kg; Niasin; Vitamin E ± 18 mg/kg — lebih rendah dari bekatul, lebih tinggi dari dedak kasar',
      mineral: 'P tinggi (1,15%, sebagian fitat); Mg dan K moderat, berada di antara dedak kasar dan dedak halus',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 28,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Ayam Kampung'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower'],
      catatan: 'Profil nutrisi berada tepat di antara dedak kasar dan dedak halus — pilihan seimbang saat kedua bahan tersebut tidak tersedia secara terpisah. Rentan tengik seperti dedak lain — gunakan dalam 2–3 minggu.',
    },
    harga: {
      estimasiAI: 2700, hargaMarketplace: 2550,
      satuan: 'per kg', supplier: 'Penggilingan padi skala menengah',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 110',
        'Feedipedia (2023) — Rice bran, middlings fraction',
      ],
      sumberData: 'Pollard padi dari penggilingan skala menengah tanpa pemisahan fraksi kasar-halus sempurna, Jawa Tengah',
      catatan: 'Nilai estimasi referensi — merupakan rata-rata timbang antara dedak kasar dan dedak halus karena proses pemisahan fraksi tidak selalu sempurna di RMU skala menengah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🏭', text: 'Pollard padi berfungsi sebagai sumber energi-protein moderat (TDN 58%, PK 9,8%, ME 2.378 kcal/kg) — nilai gizi tepat berada di antara dedak kasar dan dedak halus.' },
      { type: 'kelebihan', icon: '✅', text: 'Nutrisi seimbang tanpa perlu memilih antara dedak kasar atau halus. P tinggi (1,15%) berguna untuk ransum indukan. Harga kompetitif (Rp 2.700/kg) dengan ketersediaan luas dari RMU skala menengah.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Komposisi bisa bervariasi antar pabrik karena bukan fraksi standar yang dipisahkan secara konsisten. Lemak 8,5% tetap rentan tengik. P fitat membatasi bioavailabilitas untuk unggas.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan bungkil kedelai untuk protein tambahan pada ransum penggemukan, dan mineral premix untuk menutup rasio Ca:P yang tidak seimbang (0,07:1,15).' },
      { type: 'peringatan', icon: '🚨', text: 'Minta spesifikasi komposisi dari supplier karena variasi antar batch bisa signifikan. Simpan sejuk dan gunakan dalam 2–3 minggu untuk menghindari ketengikan.' },
      { type: 'alternatif', icon: '🔄', text: 'Bila tersedia terpisah, dedak padi halus memberi protein lebih tinggi dan lebih konsisten; dedak padi kasar lebih murah bila anggaran terbatas.' },
    ],
  },

  // ── 16. Rice Bran Pellet ───────────────────────────────────────────────────
  'rice-bran-pellet': {
    namaLatin: 'Oryza sativa L. — bran, pelleted',
    asalBahan: 'Dedak padi (kasar/halus) yang dipadatkan menjadi pelet melalui proses pemanasan dan penekanan (steam pelleting)',
    bentuk: ['Pellet', 'Kering'],
    nutrisi: {
      bk: 90, kadarAir: 10,
      pk: 11.2, sk: 12.0, lk: 10.0, abu: 10.5, betn: 46.3,
      tdn: 64, me: 2624,
      ndf: 27, adf: 17,
      ca: 0.07, p: 1.30, mg: 0.43, na: 0.03, k: 0.85, s: 0.11,
      vitamin: 'Tiamin (B1) berkurang ±20–30% akibat panas pelleting; Vitamin E lebih stabil karena proses pemadatan cepat',
      mineral: 'Profil mineral identik dedak padi halus; proses pelleting tidak mengubah kadar mineral',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 30,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Ayam Kampung'],
      programCocok: ['Penggemukan', 'Indukan', 'Menyusui', 'Grower'],
      catatan: 'Proses pemanasan (steam conditioning ±85–90°C) menginaktivasi enzim lipase sehingga umur simpan jauh lebih panjang (2–3 bulan) dibanding dedak curah. Bentuk pelet mengurangi debu dan memudahkan penanganan serta transportasi.',
    },
    harga: {
      estimasiAI: 3400, hargaMarketplace: 3250,
      satuan: 'per kg', supplier: 'Pabrik pakan / Rice bran pelleting plant',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 110 (basis dedak halus)',
        'Feedipedia (2023) — Rice bran, pelleted',
        'AAFCO (2020) — Official Publication, Rice Bran Pellets definition',
      ],
      sumberData: 'Rice bran pellet dari pabrik pengolahan dedak berteknologi steam-pelleting, Jawa Timur',
      catatan: 'Nilai nutrisi dasar mendekati dedak padi halus; sedikit penurunan pada vitamin B1 akibat panas proses. TDN dan mineral tidak berubah signifikan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🏭', text: 'Rice bran pellet menyediakan nutrisi setara dedak padi halus (TDN 64%, PK 11,2%) dalam bentuk yang jauh lebih stabil dan mudah ditangani — solusi untuk masalah ketengikan dedak curah.' },
      { type: 'kelebihan', icon: '✅', text: 'Umur simpan jauh lebih panjang (2–3 bulan vs 2–4 minggu dedak curah) karena enzim lipase sudah dinonaktifkan panas. Tidak berdebu, mudah diangkut dan disimpan dalam karung.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga lebih mahal ±15% dari dedak curah karena biaya proses pelleting. Sebagian Tiamin (B1) hilang akibat panas — perlu suplementasi vitamin B-kompleks pada ransum tertentu.' },
      { type: 'kombinasi', icon: '🔗', text: 'Dapat langsung menggantikan dedak padi halus dalam formula manapun tanpa penyesuaian rasio karena nilai gizi serupa. Cocok untuk peternak yang kesulitan menyimpan dedak curah dalam jumlah besar.' },
      { type: 'peringatan', icon: '🚨', text: 'Meski lebih tahan lama, tetap periksa kelembaban penyimpanan — pelet yang lembab bisa kembali ditumbuhi jamur. Simpan di tempat kering dan bersirkulasi udara baik.' },
      { type: 'alternatif', icon: '🔄', text: 'Dedak Padi Halus curah lebih murah bila digunakan cepat (< 2 minggu). Rice Bran Expeller adalah alternatif dengan lemak lebih rendah dan umur simpan lebih panjang lagi.' },
    ],
  },

  // ── 17. Rice Bran Expeller ─────────────────────────────────────────────────
  'rice-bran-expeller': {
    namaLatin: 'Oryza sativa L. — bran, defatted (expeller-pressed)',
    asalBahan: 'Dedak padi yang telah diekstraksi sebagian besar minyaknya secara mekanis melalui screw press (expeller)',
    bentuk: ['Tepung', 'Kering'],
    nutrisi: {
      bk: 91, kadarAir: 9,
      pk: 14.5, sk: 13.0, lk: 3.0, abu: 11.5, betn: 49.0,
      tdn: 62, me: 2542,
      ndf: 29, adf: 18,
      ca: 0.08, p: 1.45, mg: 0.48, na: 0.02, k: 0.95, s: 0.12,
      vitamin: 'Vitamin E berkurang signifikan (ikut terekstrak bersama minyak); Tiamin (B1) relatif stabil',
      mineral: 'Mineral terkonsentrasi relatif terhadap bekatul karena minyak (non-mineral) telah dihilangkan',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 25,
      targetTernak: ['Sapi Potong', 'Sapi Perah', 'Kambing', 'Domba', 'Ayam Kampung'],
      programCocok: ['Penggemukan', 'Indukan', 'Menyusui'],
      catatan: 'Protein terkonsentrasi (14,5%) karena minyak yang berkurang meningkatkan proporsi komponen lain per kg. Jauh lebih tahan simpan (3–6 bulan) dibanding bekatul biasa karena lemak rendah menghambat ketengikan.',
    },
    harga: {
      estimasiAI: 3100, hargaMarketplace: 2950,
      satuan: 'per kg', supplier: 'Pabrik ekstraksi minyak dedak padi (rice bran oil mill)',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2023) — Defatted rice bran, ruminants & poultry',
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia (basis pembanding bekatul)',
      ],
      sumberData: 'Rice bran expeller dari pabrik ekstraksi minyak dedak padi, Jawa Timur dan Sulawesi Selatan',
      catatan: 'Nilai estimasi referensi. Kadar lemak residual tergantung efisiensi mesin expeller (umumnya 2–4% LK tersisa).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⭐', text: 'Rice bran expeller adalah versi bekatul rendah-lemak (TDN 62%, PK 14,5%, LK hanya 3%) — protein lebih terkonsentrasi dan jauh lebih tahan simpan karena minyak (sumber ketengikan) sudah diekstrak.' },
      { type: 'kelebihan', icon: '✅', text: 'Protein tertinggi di antara semua by-product dedak (14,5%). Umur simpan 3–6 bulan — jauh lebih lama dari bekatul biasa. Cocok sebagai pengganti bekatul untuk peternak yang butuh stok tahan lama.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Energi (TDN 62%) sedikit lebih rendah dari bekatul (71%) karena kehilangan lemak. Kehilangan sebagian Vitamin E yang ikut terekstrak bersama minyak — perlu suplementasi bila digunakan dalam jangka panjang.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan dengan sumber lemak lain (minyak sawit, minyak ikan) bila ransum membutuhkan energi lebih tinggi. Cocok dipadukan dengan hijauan dan konsentrat energi untuk ransum penggemukan seimbang.' },
      { type: 'peringatan', icon: '🚨', text: 'Meski lebih tahan tengik, tetap simpan di tempat kering — kelembaban tetap dapat memicu jamur meski lemak rendah. Periksa kadar lemak residual dari supplier karena bervariasi antar pabrik.' },
      { type: 'alternatif', icon: '🔄', text: 'Bekatul biasa memberi energi lebih tinggi bila digunakan cepat. Rice Bran Pellet adalah alternatif stabil dengan kadar lemak lebih tinggi dari expeller namun lebih rendah dari bekatul curah.' },
    ],
  },

  // ── 18. Tepung Beras ───────────────────────────────────────────────────────
  'tepung-beras': {
    namaLatin: 'Oryza sativa L. — flour, fine milled',
    asalBahan: 'Beras giling (endosperma) yang digiling halus menjadi tepung, bebas dari sekam dan dedak',
    bentuk: ['Tepung'],
    nutrisi: {
      bk: 88, kadarAir: 12,
      pk: 7.2, sk: 0.6, lk: 0.5, abu: 0.6, betn: 79.1,
      tdn: 85, me: 3400,
      ndf: 2.2, adf: 0.9,
      ca: 0.02, p: 0.14, mg: 0.04, na: 0.01, k: 0.10,
      vitamin: 'Sangat rendah — aleuron dan lapisan luar telah dihilangkan sepenuhnya pada proses penyosohan dan penggilingan',
      mineral: 'Mineral sangat rendah, hampir murni pati endosperma; identik profilnya dengan menir pecah',
    },
    penggunaan: {
      palatabilitas: 'Sangat Baik',
      maksPenggunaan: 50,
      targetTernak: ['Ayam Broiler', 'DOC/Starter Unggas', 'Anak Sapi', 'Anak Kambing', 'Babi'],
      programCocok: ['Grower', 'Menyusui', 'Indukan'],
      catatan: 'Tekstur tepung sangat halus, ideal untuk pakan cair/pasta pedet dan pakan starter unggas (crumble/mash halus). Kecernaan sangat tinggi. Wajib disuplementasi mineral-vitamin karena kandungan alaminya sangat minim.',
    },
    harga: {
      estimasiAI: 6500, hargaMarketplace: 6300,
      satuan: 'per kg', supplier: 'Penggilingan tepung beras / Toko bahan pangan',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 108 (basis pembanding beras menir)',
        'Leeson & Summers (2001) — Nutrition of the Chicken, University Books',
        'Feedipedia (2023) — Rice flour, poultry',
      ],
      sumberData: 'Tepung beras dari penggilingan tepung skala industri pangan, adaptasi untuk pakan starter ternak',
      catatan: 'Nilai nutrisi hampir identik menir pecah/beras menir karena bahan dasarnya sama (endosperma beras); perbedaan hanya ukuran partikel (tepung lebih halus).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🍚', text: 'Tepung beras adalah sumber pati murni bertekstur sangat halus (TDN 85%, ME 3.400 kcal/kg) — ideal untuk pakan cair pedet dan pakan starter unggas yang membutuhkan partikel sangat kecil.' },
      { type: 'kelebihan', icon: '✅', text: 'Kecernaan sangat tinggi dan tekstur seragam memudahkan pembuatan pasta/pakan cair. Palatabilitas sangat baik untuk ternak muda yang sistem pencernaannya belum sempurna.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Harga lebih mahal dari beras menir/menir pecah karena proses penggilingan tambahan menjadi tepung food-grade. Mineral dan vitamin hampir nol — wajib suplementasi penuh.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk pakan cair pedet: tepung beras + susu skim + premix vitamin-mineral. Untuk starter unggas: kombinasikan dengan tepung ikan, bungkil kedelai, dan premix lengkap.' },
      { type: 'peringatan', icon: '🚨', text: 'Jangan gunakan sebagai komponen tunggal — risiko defisiensi mineral (Ca, P) dan vitamin larut lemak pada ternak muda yang sedang tumbuh cepat.' },
      { type: 'alternatif', icon: '🔄', text: 'Menir Pecah atau Beras Menir memberi nilai nutrisi hampir identik dengan harga lebih murah bila tekstur sangat halus tidak diperlukan.' },
    ],
  },

  // ── 19. Jerami Padi Cacah ──────────────────────────────────────────────────
  'jerami-padi-cacah': {
    namaLatin: 'Oryza sativa L. — straw, chopped',
    asalBahan: 'Jerami padi kering yang dicacah pendek (2–5 cm) menggunakan chopper untuk memudahkan konsumsi dan pencampuran',
    bentuk: ['Kering'],
    nutrisi: {
      bk: 87, kadarAir: 13,
      pk: 3.6, sk: 30.5, lk: 1.3, abu: 14.5, betn: 37.1,
      tdn: 34, me: 1394,
      ndf: 60, adf: 39,
      ca: 0.22, p: 0.08, mg: 0.12, na: 0.02, k: 0.87, s: 0.07,
      vitamin: 'Vitamin D₂ (dari paparan sinar matahari, kecil); sebagian besar vitamin terdegradasi pengeringan',
      mineral: 'Silika sangat tinggi (termasuk dalam abu); Ca relatif tinggi (0,22%) dibanding P (0,08%) — identik jerami padi kering',
    },
    penggunaan: {
      palatabilitas: 'Baik',
      maksPenggunaan: 60,
      targetTernak: ['Sapi Potong', 'Kerbau', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Penggemukan'],
      catatan: 'Nilai gizi identik jerami padi kering utuh, namun konsumsi dan efisiensi pemberian jauh lebih baik karena ukuran cacah mengurangi seleksi pakan dan mempermudah pencampuran dalam ransum komplit (TMR). Standar untuk sistem pemberian pakan modern.',
    },
    harga: {
      estimasiAI: 750, hargaMarketplace: 700,
      satuan: 'per kg', supplier: 'Petani sawah / unit pencacah pakan (chopper) komunal',
      updatedAt: '09 Jul 2026',
    },
    referensi: {
      literatur: [
        'Hartadi et al. (1997) — Tabel Komposisi Pakan untuk Indonesia, hal. 114 (basis jerami kering)',
        'Feedipedia (2023) — Rice straw, chopped, ruminants',
        'JIRCAS (2013) — Feed Composition Tables for Southeast Asia',
      ],
      sumberData: 'Jerami padi kering yang dicacah menggunakan chopper mesin, Jawa Tengah dan Jawa Timur',
      catatan: 'Nilai estimasi referensi — komposisi kimia identik jerami padi kering karena pencacahan hanya mengubah ukuran fisik, bukan komposisi nutrisi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Jerami padi cacah memiliki nilai gizi identik jerami padi kering (TDN 34%, PK 3,6%) namun bentuk cacah pendek meningkatkan efisiensi konsumsi dan memudahkan pencampuran dalam ransum komplit (TMR).' },
      { type: 'kelebihan', icon: '✅', text: 'Mengurangi seleksi pakan oleh ternak (sorting) dibanding jerami utuh, sehingga konsumsi bahan kering lebih merata dan pemborosan lebih rendah. Ideal untuk sistem TMR mekanis.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Protein tetap sangat rendah (PK 3,6%) — sama seperti jerami utuh, pencacahan tidak menambah nilai gizi. Biaya tambahan untuk proses pencacahan (mesin/tenaga kerja).' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi wajib sama seperti jerami kering: tambahkan urea + molases + mineral blok, atau konsentrat dedak-bungkil-jagung untuk ransum penggemukan yang lengkap.' },
      { type: 'peringatan', icon: '🚨', text: 'Pastikan jerami benar-benar kering sebelum dicacah dan disimpan — pencacahan meningkatkan luas permukaan sehingga jerami basah lebih cepat berjamur dibanding bentuk utuh.' },
      { type: 'alternatif', icon: '🔄', text: 'Jerami padi kering utuh lebih murah bila tidak memiliki mesin chopper. Jerami amoniasi cacah adalah kombinasi terbaik — nilai gizi lebih tinggi (PK 7–8%) dengan bentuk yang mudah dikonsumsi.' },
    ],
  },

};

// ─── Merge Helper ─────────────────────────────────────────────────────────────

export function getPadiDetail(id: string): PadiItem | undefined {
  const base   = getPadiById(id);
  if (!base) return undefined;
  const detail = PADI_DETAIL[id];
  if (!detail) return base;
  return { ...base, ...detail, dataLengkap: true };
}

// ─── Dev-only integrity check ──────────────────────────────────────────────────
// Guards against `dataLengkap` drifting away from actual detail coverage:
// every base item flagged dataLengkap:true must have a PADI_DETAIL entry,
// and every PADI_DETAIL entry must correspond to a base item flagged true.
if (import.meta.env?.DEV) {
  const detailIds = new Set(Object.keys(PADI_DETAIL));
  for (const item of getPadiList()) {
    const hasDetail = detailIds.has(item.id);
    if (item.dataLengkap !== hasDetail) {
      console.warn(
        `[padiDetailData] dataLengkap mismatch for "${item.id}": ` +
        `base.dataLengkap=${item.dataLengkap} but detail entry ${hasDetail ? 'exists' : 'is missing'}.`
      );
    }
  }
}
