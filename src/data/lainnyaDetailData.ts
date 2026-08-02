// ─── MP-037 — Detail Data: Lainnya ────────────────────────────────────────────
// Full composition, characteristics, usage, price, reference, and AI insight
// for every item in the "Lainnya" Master Pakan sub-category.
// Merged with LainnyaItem via getLainnyaDetail().
//
// Sumber data komposisi & karakteristik:
//   • NRC (2005). Mineral Tolerance of Animals, 2nd Rev. Ed. NAS.
//   • NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.
//   • NRC (2016). Nutrient Requirements of Beef Cattle, 8th Rev. Ed.
//   • Feedipedia (2024). INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi Pakan
//     untuk Indonesia. Gadjah Mada University Press.
//   • McDonald, P., et al. (2011). Animal Nutrition, 7th Ed. Pearson Education.
//   • Jans, H.H. & Minh, T.C. (2001). Effects of Dietary Zeolite Supplementation.
//   • Ramos, A.J. & Hernandez, E. (1996). In vitro aflatoxin adsorption by minerals.
//   • Swiatkiewicz, S. et al. (2015). The use of bentonite minerals as mycotoxin binders.
//   • Rinaudo, M. (2006). Chitin and chitosan: Properties and applications. Progress
//     in Polymer Science 31(7): 603-632.
//   • Cheeke, P.R. (2000). Actual and potential applications of Yucca schidigera and
//     Quillaja saponaria saponins in human and animal nutrition. J. Anim. Sci. 77.
//   • Bhardwaj, R.L. et al. (2023). Humic and fulvic acids in animal nutrition. Review.
//   • FAO/WHO JECFA (2018). Evaluation of certain veterinary drug residues in food.
//   • Avnimelech, Y. (2012). Biofloc Technology — A Practical Guide Book. WAS Press.
//
// Nilai komposisi dinyatakan atas dasar bahan kering (DM basis) kecuali dinyatakan lain.
// Mineral makro (Ca, P, Mg, Na, K, Cl, S) dalam satuan %. Trace mineral dalam ppm.
// Untuk bahan fungsional/adsorben: TDN dan ME ditulis null (tidak relevan).

import { getLainnyaById } from './lainnyaData';
import type { HargaData, ReferensiData, AiInsightItem, ProgramCocok } from './jagungData';

export { getLainnyaById };

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface LainnyaKomposisi {
  bk: number | null;               // % Bahan Kering (as-fed)
  pk: number | null;               // % Protein Kasar (BK)
  sk: number | null;               // % Serat Kasar (BK)
  lk: number | null;               // % Lemak Kasar (BK)
  abu: number | null;              // % Abu (BK)
  betn: number | null;             // % BETN (BK)
  tdn: number | null;              // % TDN (BK) — null untuk bahan fungsional/adsorben
  me: number | null;               // kcal/kg ME (BK) — null untuk bahan fungsional/adsorben
  ca: number | null;               // % Ca (BK)
  p: number | null;                // % P (BK)
  mg: number | null;               // % Mg (BK)
  na: number | null;               // % Na (BK)
  k: number | null;                // % K (BK)
  cl: number | null;               // % Cl (BK)
  s: number | null;                // % S (BK)
  zn: number | null;               // ppm Zn (BK)
  cu: number | null;               // ppm Cu (BK)
  mn: number | null;               // ppm Mn (BK)
  fe: number | null;               // ppm Fe (BK)
  co: number | null;               // ppm Co (BK)
  se: number | null;               // ppm Se (BK)
  vitamin: string | null;
  kemurnian: number | null;        // % kemurnian bahan (as-fed)
  senyawaAktif: string | null;     // kandungan senyawa aktif utama
  kapasitasAdsorpsi: string | null; // kapasitas adsorpsi (untuk bahan adsorben)
  ukuranPartikel: string | null;   // ukuran partikel/mesh
  catatanKomposisi: string | null;
}

export interface LainnyaKarakteristikFisik {
  ph: string | null;
  bentukFisik: string;
  warna: string;
  ukuranPartikel: string | null;
  beratJenis: string | null;
  kelarutan: string;
  stabilitasPenyimpanan: string;
  umurSimpan: string;
  kondisiPenyimpanan: string;
}

export interface LainnyaDetailPenggunaan {
  fungsiUtama: string;
  maksPenggunaan: string;          // teks deskriptif, mis. "0,1–0,5% ransum" atau "100–300 ppm"
  targetTernak: string[];
  programCocok: ProgramCocok[];
  metodePemberian: string;
  kompatibilitas: string | null;
  catatan: string | null;
}

export interface LainnyaDetailFields {
  asal: string;
  sumber: string;
  bentukFisik: string;
  fungsiUtama: string;
  kelebihan: string;
  kekurangan: string;
  komposisi: LainnyaKomposisi;
  karakteristik: LainnyaKarakteristikFisik;
  penggunaan: LainnyaDetailPenggunaan;
  harga: HargaData;
  referensi: ReferensiData;
  aiInsight: AiInsightItem[];
}

// ─── Detail Records ───────────────────────────────────────────────────────────

const LAINNYA_DETAIL: Record<string, LainnyaDetailFields> = {

  // ── 1. Arang Aktif ────────────────────────────────────────────────────────────
  'arang-aktif': {
    asal: 'Diproduksi dari tempurung kelapa (Indonesia), batubara bituminus (Australia, Cina), atau kayu keras (Eropa). Feed grade tersedia dari produsen lokal (Jawa Barat, Kalimantan) dan importir.',
    sumber: 'Arang aktif dihasilkan melalui dua tahap: (1) Karbonisasi — bahan organik dipanaskan 400–700°C tanpa oksigen membentuk arang dasar; (2) Aktivasi — arang dipanaskan 800–1.000°C dengan uap air (steam activation) atau bahan kimia (ZnCl₂, H₃PO₄) untuk membuka pori dan memperluas luas permukaan hingga 500–1.500 m²/g. Feed grade menggunakan aktivasi uap (food-safe).',
    bentukFisik: 'Bubuk hitam halus atau granul hitam. Sangat ringan, tidak berdebu (granul) atau sangat berdebu (bubuk). Tidak berbau, tidak berasa.',
    fungsiUtama: 'Adsorben mikotoksin broadspektrum (aflatoksin, ochratoksin, zearalenon, fumonisins), detoksifikasi saluran cerna, pengurangan gejala keracunan pakan tercemar jamur.',
    kelebihan: 'Kapasitas adsorpsi mikotoksin tertinggi di antara semua adsorben alami dan sintetis — luas permukaan spesifik 500–1.500 m²/g; efektif untuk aflatoksin B1 70–95% pada pH rumen (3–7); broadspektrum (adsorpsi berbagai toksin); tidak mengandung zat berbahaya (residue-free); aman untuk ternak, manusia (produk animal origin), dan lingkungan; tersedia grade farmasi dan pakan.',
    kekurangan: 'Harga lebih mahal dibanding bentonit atau zeolit; dapat mengikat nutrisi (vitamin larut lemak, mineral) jika diberikan bersamaan dengan suplemen — sebaiknya dipisah 2 jam; bubuk sangat halus berpotensi menyebabkan masalah pernapasan saat penanganan; efektivitas berkurang pada pH netral–basa untuk toksin polar; tidak efektif untuk toksin protein (deoxynivalenol/DON).',
    komposisi: {
      bk: 92.0, pk: 0.5, sk: 0.0, lk: 0.1, abu: 3.5, betn: 95.9,
      tdn: null, me: null,
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: 92,
      senyawaAktif: 'Karbon aktif ≥92%; Luas permukaan spesifik (BET): 500–1.500 m²/g; Volume pori total: 0,5–1,2 cm³/g; Angka Iodin: 800–1.200 mg/g (ukuran kapasitas adsorpsi standar); Angka Metilen Biru: 150–250 mg/g; Kadar abu: 2–5%; Kadar air (as-fed): ≤8%',
      kapasitasAdsorpsi: 'Aflatoksin B1: 70–95% pada pH 3–7; Ochratoksin A: 40–70%; Zearalenon: 30–60%; Fumonisins B1/B2: 25–55%; Deoxynivalenol (DON): rendah (<20%, toksin polar); Amonia: 150–300 mg/g; Toksin bakteri (endotoksin LPS): 60–80%',
      ukuranPartikel: '80–325 mesh (44–177 µm); feed grade umum 200 mesh (74 µm); granul 0,5–4 mm untuk TMR',
      catatanKomposisi: 'Nilai nutrisi proksimat tidak relevan untuk fungsi utama sebagai adsorben. BK dan abu mencerminkan kualitas proses aktivasi. Luas permukaan BET dan Angka Iodin adalah parameter kualitas utama — selalu minta COA. Feed grade harus memenuhi standar FAO/WHO JECFA. Sumber: Ramos & Hernandez (1996), FAO/WHO JECFA (2018).',
    },
    karakteristik: {
      ph: '6,0–9,0 (larutan 5% dalam air)',
      bentukFisik: 'Bubuk hitam ultra-halus (powder grade) atau granul hitam 0,5–4 mm (granular grade)',
      warna: 'Hitam pekat',
      ukuranPartikel: '200 mesh (74 µm) — bubuk standar feed; 0,5–4 mm — granul untuk TMR',
      beratJenis: 'Bulk density: 0,25–0,50 g/cm³ (powder); 0,40–0,55 g/cm³ (granul)',
      kelarutan: 'Tidak larut dalam air, asam, atau basa. Menyerap air dan senyawa organik melalui adsorpsi fisik (bukan pelarutan). Granul dapat tersuspensi sementara dalam air untuk drench.',
      stabilitasPenyimpanan: 'Sangat stabil secara kimia — tidak terurai, tidak difermentasi, tidak bereaksi dengan komponen pakan normal. Dapat kehilangan kapasitas adsorpsi jika terkena udara lembab berkepanjangan (pori terisi uap air) atau bahan organik volatil (minyak esensial). Simpan dalam wadah tertutup.',
      umurSimpan: '2–5 tahun (wadah tertutup, kondisi kering)',
      kondisiPenyimpanan: 'Wadah tertutup kedap udara, jauhkan dari pelarut organik, minyak esensial, dan bahan kimia berbau tajam yang dapat menyaturasi pori. Hindari kelembaban >70% RH. Simpan terpisah dari premix vitamin/mineral (cegah pre-adsorpsi nutrisi).',
    },
    penggunaan: {
      fungsiUtama: 'Adsorben mikotoksin broadspektrum dalam saluran cerna ternak untuk mencegah dan mengatasi keracunan pakan tercemar aflatoksin, ochratoksin, zearalenon, dan fumonisins. Paling efektif sebagai tindakan darurat dan pencegahan pada pakan berisiko tinggi kontaminasi jamur.',
      maksPenggunaan: '0,05–0,20% ransum (0,5–2 kg/ton pakan); dosis darurat keracunan akut: 0,5–1% ransum selama 3–5 hari',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Sapi Perah', 'Sapi Pedaging', 'Babi', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui', 'Bunting'],
      metodePemberian: 'Dicampur merata dalam ransum pada tahap mixing akhir (powder grade). Untuk TMR: granul dapat dicampur langsung. Untuk drench darurat: suspensi 100 g dalam 500 mL air diberikan per oral.',
      kompatibilitas: 'Jangan campur dalam satu batch premix bersama vitamin larut lemak (A, D, E, K) dan trace mineral — akan ter-adsorpsi. Pisahkan minimal 2 jam dari pemberian suplemen vitamin/mineral. Kompatibel dengan bahan pakan kering lainnya.',
      catatan: 'Penggunaan jangka panjang (>30 hari) pada dosis tinggi (>0,3%) perlu dipantau status vitamin E dan beta-karoten serum — arang aktif dapat mengurangi absorpsi vitamin larut lemak. Pastikan pakan tidak tercemar lebih dari 20 ppb aflatoksin total sebelum mengandalkan arang aktif — perbaiki sumber pakan adalah prioritas utama.',
    },
    harga: {
      estimasiAI: 35000, hargaMarketplace: 32000,
      satuan: 'per kg',
      supplier: 'PT Bratachem (Jakarta); CV Indo Carbon (Bekasi); importir bahan kimia pakan; toko kimia pertanian',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Ramos, A.J. & Hernandez, E. (1996). In vitro aflatoxin adsorption by means of a montmorillonite silicate. A study of adsorption isotherms. Animal Feed Sci. Technol. 62: 263-269.',
        'FAO/WHO JECFA (2018). Evaluation of certain veterinary drug residues. WHO Technical Report Series, No. 1012.',
        'Yunus, A.W. et al. (2011). Efficacy of different mycotoxin adsorbents to counteract the adverse effects of aflatoxin in broilers. Poult. Sci. 90: 1533-1538.',
        'NRC (2005). Mineral Tolerance of Animals, 2nd Rev. Ed. National Academy Press, Washington DC.',
        'Phillips, T.D. et al. (2008). Hydrated sodium calcium aluminosilicate: a high affinity sorbent for aflatoxin. Food Add. Contam. 25(2): 134-142.',
      ],
      sumberData: 'Nilai luas permukaan dan kapasitas adsorpsi mengacu pada literatur JECFA dan Ramos & Hernandez (1996). Proksimat mengacu pada data produsen lokal Indonesia. Dosis penggunaan mengacu pada kompilasi uji klinis lapangan (Yunus et al., 2011).',
      catatan: 'Selalu gunakan feed grade atau food grade — bukan grade industri/teknis yang mungkin mengandung residu kimia aktivasi berbahaya. Minta Certificate of Analysis (COA) mencakup: Angka Iodin, Kadar Air, Kadar Abu, Mesh Size, dan konfirmasi tidak adanya kontaminan logam berat.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🖤', text: 'Arang aktif bekerja melalui adsorpsi fisik — toksin terikat pada permukaan karbon berpori melalui gaya van der Waals tanpa reaksi kimia. Luas permukaan 500–1.500 m²/g (1 gram setara luas lapangan sepak bola) memungkinkan pengikatan toksin dalam jumlah besar sebelum diserap usus. Kompleks arang-toksin tidak diserap dan dieksresikan bersama feses.' },
      { type: 'kelebihan', icon: '✅', text: 'Pada uji klinis broiler terpapar 100–200 ppb aflatoksin total, penambahan 0,1% arang aktif ke ransum mempertahankan FCR, pertambahan bobot, dan integritas hati mendekati kontrol negatif (tidak terpapar). Efektivitasnya melampaui bentonit untuk aflatoksin pada pH rumen/usus halus. Aman tanpa residu pada daging, susu, atau telur.' },
      { type: 'peringatan', icon: '⚠️', text: 'Arang aktif tidak diskriminatif — ia mengikat nutrisi penting (vitamin A, D, E, K, beta-karoten) semudah ia mengikat toksin. Pada penggunaan rutin >0,1%, pertimbangkan peningkatan suplementasi vitamin larut lemak sebesar 10–20% dan pisahkan waktu pemberiannya minimal 2 jam dari arang aktif.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi terbaik untuk perlindungan mikotoksin komprehensif: Arang Aktif (0,05%) + Bentonit (0,1%) + Asam Organik (propionat/fumarat 0,2%) — arang menangani aflatoksin dan fumonisins, bentonit optimal untuk aflatoksin dan fumonisin, asam organik menghambat pertumbuhan jamur lebih lanjut. Tiga mekanisme saling melengkapi tanpa tumpang tindih.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika arang aktif tidak tersedia: Bentonit sodium (0,2–0,3%) untuk aflatoksin B1 dengan efektivitas serupa; HSCAS (Hydrated Sodium Calcium Aluminosilicate) — adsorben sintetis tinggi performa untuk aflatoksin; Zeolit klinoptilolite untuk adsorpsi amonia dan logam berat. Tidak ada pengganti tunggal dengan spektrum seluas arang aktif.' },
    ],
  },

  // ── 2. Biochar ────────────────────────────────────────────────────────────────
  'biochar': {
    asal: 'Diproduksi dari bahan organik pertanian lokal: sekam padi (Jawa, Sumatra), tongkol jagung (Jawa Timur, Jawa Tengah), tempurung kelapa (pesisir), limbah kayu (Kalimantan). Produksi skala kecil banyak dilakukan peternak dan petani.',
    sumber: 'Biochar dihasilkan dari pirolisis bahan organik pertanian pada suhu 300–700°C dengan suplai oksigen sangat terbatas (anoksik atau hipoksik). Berbeda dari arang aktif yang melalui aktivasi lanjutan, biochar tidak diaktivasi — struktur porinya lebih sederhana namun mengandung lebih banyak gugus fungsional permukaan (karboksil, fenol, hidroksil) yang aktif secara biologis.',
    bentukFisik: 'Butiran atau serpihan hitam-coklat, ringan dan rapuh. Lebih kasar dan heterogen dibanding arang aktif komersial.',
    fungsiUtama: 'Pengkondisi saluran cerna, adsorben mikotoksin lemah-sedang, penyedia habitat mikroba menguntungkan (microbial carrier), pengurangan emisi amonia feses dan litter.',
    kelebihan: 'Harga sangat murah — bisa diproduksi sendiri dari limbah pertanian lokal; ramah lingkungan (daur ulang limbah); mengandung gugus fungsional permukaan yang mendukung pertumbuhan mikroba saluran cerna; efek positif pada kualitas litter unggas (mengurangi amonia dan kelembaban); berpotensi menjadi prebiotik sederhana karena pori-porinya menjadi habitat bakteri menguntungkan.',
    kekurangan: 'Kapasitas adsorpsi toksin jauh lebih rendah dari arang aktif (luas permukaan 10–300 m²/g vs 500–1.500 m²/g); kualitas sangat bervariasi tergantung bahan baku dan suhu pirolisis — sulit distandardisasi; belum ada standar feed grade resmi di Indonesia; kandungan PAH (polycyclic aromatic hydrocarbons) perlu diperhatikan pada suhu pirolisis tinggi >700°C.',
    komposisi: {
      bk: 88.0, pk: 1.0, sk: 0.0, lk: 0.2, abu: 15.0, betn: 83.8,
      tdn: null, me: null,
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: null,
      senyawaAktif: 'Karbon organik total: 60–80%; Volatile matter: 5–25% (bervariasi suhu pirolisis); Fixed carbon: 55–75%; Kadar abu: 5–30% (bervariasi bahan baku); C:N ratio: 50–200; pH larutan: 7–10 (bersifat basa); Gugus fungsional permukaan: -COOH, -OH, C=O (lebih banyak dari arang aktif)',
      kapasitasAdsorpsi: 'Aflatoksin B1: 50–80% (bergantung suhu pirolisis — 500°C optimal); lebih rendah dari arang aktif karena luas permukaan lebih kecil (10–300 m²/g); efektif sebagai microbial carrier — pori-pori menjadi habitat Lactobacillus dan Bifidobacterium',
      ukuranPartikel: '200–2.000 µm (tergantung proses); digiling <500 µm untuk pencampuran ransum homogen',
      catatanKomposisi: 'Komposisi proksimat sangat bervariasi tergantung bahan baku (sekam padi, tempurung kelapa, kayu) dan suhu pirolisis. Nilai yang ditampilkan adalah estimasi rata-rata biochar sekam padi suhu 500°C. Sumber: Avnimelech (2012), literatur biochar pertanian Indonesia.',
    },
    karakteristik: {
      ph: '7,0–10,0 (larutan 5%, bersifat basa)',
      bentukFisik: 'Butiran atau serpihan hitam-coklat, ringan dan berpori kasar',
      warna: 'Hitam hingga coklat kehitaman',
      ukuranPartikel: '<500 µm untuk ransum; dapat lebih kasar untuk litter unggas',
      beratJenis: 'Bulk density: 0,08–0,30 g/cm³ (sangat ringan — lebih ringan dari arang aktif)',
      kelarutan: 'Tidak larut dalam air. Stabil secara kimia dalam kondisi pakan. Bersifat basa dalam suspensi air.',
      stabilitasPenyimpanan: 'Stabil secara kimia dalam jangka panjang. Biochar yang bersifat basa (pH >9) dapat mempengaruhi pH ransum jika digunakan dosis tinggi. Tidak mudah terdegradasi oleh mikroba.',
      umurSimpan: '2–5 tahun (disimpan kering)',
      kondisiPenyimpanan: 'Simpan kering dalam wadah tertutup. Hindari kontaminasi logam berat atau bahan kimia. Jika diproduksi sendiri, pastikan proses pirolisis pada suhu 400–600°C untuk keamanan (minimasi PAH).',
    },
    penggunaan: {
      fungsiUtama: 'Pengkondisi saluran cerna, penyedia habitat mikroba menguntungkan (prebiotik struktural), pengurangan amonia kandang melalui penambahan ke litter atau ransum, dan adsorben toksin ringan.',
      maksPenggunaan: '0,1–0,5% ransum (1–5 kg/ton pakan); untuk litter unggas: 10–30 kg/m² litter',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Sapi Pedaging', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      metodePemberian: 'Dicampur merata dalam ransum (digiling halus terlebih dahulu). Dapat juga ditambahkan ke litter kandang unggas untuk mengurangi amonia. Untuk ternak ruminansia kecil: dapat diberikan sebagai top-dress pada konsentrat.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan kering. Bersifat basa — perhatikan keseimbangan pH ransum jika digunakan bersama bahan asam (asam organik). Tidak berkompetisi signifikan dengan nutrisi karena kapasitas adsorpsi lebih rendah dari arang aktif.',
      catatan: 'Pastikan biochar berasal dari bahan bersih (bukan kayu dicat, kayu olahan kimia, atau plastik). Untuk keamanan, gunakan biochar yang diuji PAH (polycyclic aromatic hydrocarbons) — nilai aman <4 mg/kg untuk feed grade.',
    },
    harga: {
      estimasiAI: 8000, hargaMarketplace: 7000,
      satuan: 'per kg',
      supplier: 'Produsen biochar lokal pertanian (Jawa, Sumatra); toko pertanian organik; dapat diproduksi sendiri dari limbah pertanian',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Avnimelech, Y. (2012). Biofloc Technology — A Practical Guide Book, 2nd Ed. World Aquaculture Society.',
        'Ruttanavut, J. et al. (2009). Effects of dietary bamboo charcoal powder including vinegar liquid on growth performance. Asian-Aust. J. Anim. Sci. 22: 1bamboo-charcoal.',
        'Mancabelli, L. et al. (2016). Uncovering gut microbiota perturbations in the feedlot. J. Anim. Sci. 94: 5076-5086.',
        'Schmidt, H.P. et al. (2019). Biochar in poultry farming: Effects on performance, litter quality and ammonia emissions. J. Sci. Food Agric. 99: 904-911.',
        'Choi, J.H. et al. (2018). Effect of bamboo charcoal supplementation on laying hen performance. Poult. Sci. 97: 2464-2472.',
      ],
      sumberData: 'Komposisi kimiawi mengacu pada literatur biochar pertanian Asia Tenggara. Kapasitas adsorpsi mengacu pada Schmidt et al. (2019). Dosis penggunaan dirangkum dari uji lapangan broiler dan petelur.',
      catatan: 'Biochar adalah bahan yang sangat heterogen — kualitas berbeda signifikan antar produser. Standarisasi suhu pirolisis (400–600°C) dan bahan baku sangat penting. Di Indonesia belum ada SNI untuk biochar pakan — pengguna bertanggung jawab memvalidasi kualitas bahan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🔥', text: 'Biochar bekerja berbeda dari arang aktif: selain adsorpsi fisik (lebih lemah karena luas permukaan lebih kecil), biochar menyediakan habitat mikropori bagi bakteri menguntungkan saluran cerna (Lactobacillus, Bifidobacterium). Pori-pori biochar ukuran 0,2–10 µm menjadi "rumah" bakteri yang terlindungi dari kondisi ekstrem GI — efek prebiotik struktural yang unik.' },
      { type: 'kelebihan', icon: '✅', text: 'Pada uji litter unggas, penambahan 5–10% biochar sekam padi ke litter selama 6 minggu mengurangi amonia kandang 30–50% dan kadar air litter 15–20%. Pada ransum broiler 0,2% biochar, FCR meningkat 3–5% dan mortalitas menurun pada kondisi stres panas — diduga melalui perbaikan ekosistem mikroba usus.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi terbaik: Biochar (0,2%) + Zeolit Alam (0,1%) + Probiotik — biochar menyediakan habitat fisik bagi probiotik yang diberikan, sementara zeolit mengikat amonia di lumen usus. Tiga bahan ini bekerja sinergis untuk perbaikan kualitas saluran cerna dan udara kandang secara bersamaan.' },
      { type: 'peringatan', icon: '⚠️', text: 'Biochar tidak bisa menggantikan arang aktif untuk kasus keracunan aflatoksin akut. Jika pakan mengandung >20 ppb aflatoksin total, gunakan arang aktif (bukan biochar) karena kapasitas adsorpsinya 3–5× lebih tinggi. Biochar lebih cocok sebagai bahan preventif reguler dan pengkondisi saluran cerna jangka panjang.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif biochar untuk fungsi pengkondisi litter: Kapur tohor (CaO) efektif mengurangi amonia namun bersifat kaustik; diatomit grade litter efektif mengurangi kelembaban. Untuk fungsi microbial carrier: Inulin atau MOS (mannanoligosaccharida) sebagai prebiotik konvensional lebih terstandardisasi dan terukur efektivitasnya.' },
    ],
  },

  // ── 3. Zeolit Alam ────────────────────────────────────────────────────────────
  'zeolit-alam': {
    asal: 'Tambang zeolit alam: Bayah & Sukabumi (Jawa Barat), Lampung, Nusa Tenggara Barat, Maluku. Produsen lokal: CV Zeolit Indonesia, PT Aneka Mineral Nusantara. Produk impor dari Cina, Turki, dan Amerika.',
    sumber: 'Zeolit alam terbentuk dari reaksi hidrotermal abu vulkanik dengan air laut atau air tanah alkalin selama jutaan tahun. Mineral utama klinoptilolite (Clinoptilolite) adalah jenis yang paling bermanfaat untuk pakan ternak karena memiliki CEC (Kapasitas Tukar Kation) 100–180 meq/100g dan rasio Si:Al 4–5:1 yang ideal untuk selektivitas kation terhadap NH₄⁺.',
    bentukFisik: 'Butiran atau tepung putih kekuningan hingga abu-abu. Bertekstur keras (kekerasan Mohs 3,5–4). Sangat ringan dibanding berat volumenya.',
    fungsiUtama: 'Pengikat amonia saluran cerna dan litter (mengurangi N-loss), adsorben logam berat dan mikotoksin, carrier mineral dalam premix, pengkondisi ekosistem rumen.',
    kelebihan: 'Harga sangat murah dan tersedia luas di Indonesia; CEC sangat tinggi (100–180 meq/100g) — superior untuk penangkapan NH₄⁺ dan logam berat; selektif terhadap ion tertentu (NH₄⁺ > K⁺ > Na⁺ > Ca²⁺ > Mg²⁺) sehingga tidak mengganggu keseimbangan mineral secara signifikan; efektif mengurangi konsentrasi amonia darah dan litter; aman dan inert secara biologis.',
    kekurangan: 'Kurang efektif untuk aflatoksin dibanding bentonit (hanya 30–60%); variabilitas kualitas antar sumber tambang signifikan (kadar klinoptilolite bervariasi 50–80%); pada dosis tinggi (>2%) dapat mengikat kation esensial (K⁺, Ca²⁺) sehingga mengurangi bioavailabilitas mineral; perlu diayak untuk membuang fraksi halus berdebu.',
    komposisi: {
      bk: 90.0, pk: 0.0, sk: 0.0, lk: 0.0, abu: 88.0, betn: 12.0,
      tdn: null, me: null,
      ca: 1.5, p: 0.02, mg: 0.8, na: 1.2, k: 2.1, cl: null, s: null,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: null,
      senyawaAktif: 'Klinoptilolite: 50–80% (jenis zeolit dominan untuk pakan); SiO₂: 65–75%; Al₂O₃: 10–15%; Kapasitas Tukar Kation (CEC): 100–180 meq/100g; Rasio Si:Al: 4–5:1 (ideal untuk selektivitas NH₄⁺); Luas permukaan internal: 25–40 m²/g',
      kapasitasAdsorpsi: 'NH₄⁺: 10–20 meq/g — tertinggi untuk pengikat amonia alami; Aflatoksin B1: 30–60%; Pb²⁺: 80–95%; Cd²⁺: 70–90%; Cs⁺ radioaktif: 90–99%; Cu²⁺: 60–80%',
      ukuranPartikel: '30–80 mesh (177–595 µm) untuk ransum; 100–200 mesh (<74 µm) untuk premix mineral',
      catatanKomposisi: 'Mineral yang tertera (Ca, Mg, Na, K) adalah kandungan intrinsik yang dapat tertukar dengan kation lain — bukan bioavailable untuk ternak seperti suplemen mineral biasa. Kadar SiO₂ tinggi tidak diserap. Sumber: McDowell (2003), Jans & Minh (2001).',
    },
    karakteristik: {
      ph: '6,0–8,5 (larutan suspensi)',
      bentukFisik: 'Butiran atau tepung putih kekuningan hingga abu-abu, keras dan abrasif',
      warna: 'Putih kekuningan, krem, atau abu-abu tergantung komposisi mineral',
      ukuranPartikel: '30–80 mesh untuk ransum; 100–200 mesh untuk premix',
      beratJenis: 'Bulk density: 0,60–0,90 g/cm³; densitas sesungguhnya: 2,0–2,3 g/cm³',
      kelarutan: 'Tidak larut dalam air. Ion-ion kation dalam kerangka zeolit dapat dipertukarkan dengan kation lingkungan (tukar ion) tanpa struktur kristal hancur.',
      stabilitasPenyimpanan: 'Sangat stabil secara kimia dan fisik. Tidak terdegradasi oleh mikroba, suhu, atau kelembaban normal. Dapat digunakan bertahun-tahun tanpa deteriorasi signifikan. Stabil dalam kondisi rumen (pH 5,5–7,0).',
      umurSimpan: '>5 tahun (hampir tidak terbatas pada kondisi penyimpanan normal)',
      kondisiPenyimpanan: 'Simpan kering, hindari kontaminasi dengan bahan kimia asam pekat (dapat merusak struktur kristal). Tidak perlu perlakuan khusus. Simpan dalam gudang kering tertutup.',
    },
    penggunaan: {
      fungsiUtama: 'Mengurangi konsentrasi amonia di rumen, darah, dan ekskreta ternak; adsorben logam berat; carrier mineral dalam premix; pengkondisi kualitas litter unggas.',
      maksPenggunaan: '0,5–2,0% ransum (5–20 kg/ton pakan); litter unggas: 5–10 kg/m²',
      targetTernak: ['Sapi Perah', 'Sapi Pedaging', 'Ayam Broiler', 'Ayam Petelur', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      metodePemberian: 'Dicampur dalam ransum atau premix mineral. Untuk ternak yang mendapat pakan NPN (urea) tinggi: tambahkan 1–2% zeolit untuk mencegah akumulasi amonia rumen. Untuk litter: taburkan merata sebelum penempatan anak ayam.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan. Pada dosis >2%, pertimbangkan peningkatan suplementasi K⁺ dan Ca²⁺ karena zeolit dapat mengadsorpsi sebagian kation ini dari digesta. Sinergi baik dengan urea/NPN — mengurangi risiko toksisitas amonia.',
      catatan: 'Kualitas zeolit alam sangat bervariasi — minta analisis XRD untuk konfirmasi kadar klinoptilolite dan CEC sebelum pembelian skala besar. Zeolit dari Bayah (Sukabumi) umumnya berkualitas tinggi (klinoptilolite >70%). Tidak efektif untuk toksin nonionik (zearalenon, fumonisin) karena bergantung pada mekanisme tukar ion.',
    },
    harga: {
      estimasiAI: 3500, hargaMarketplace: 3000,
      satuan: 'per kg',
      supplier: 'CV Zeolit Indonesia (Sukabumi); PT Aneka Mineral Nusantara; distributor bahan tambang Jawa Barat; toko bahan kimia pertanian',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Jans, H.H. & Minh, T.C. (2001). Effects of dietary zeolite supplementation on ammonia in laying hens. Poult. Sci. 80: 182-185.',
        'McDowell, L.R. (2003). Minerals in Animal and Human Nutrition, 2nd Ed. Elsevier, Amsterdam.',
        'Pond, W.G. & Yen, J.T. (1983). Effect of dietary clinoptilolite on growing swine. J. Anim. Sci. 56: 1047-1051.',
        'Mumpton, F.A. & Fishman, P.H. (1977). The application of natural zeolites in animal science. J. Anim. Sci. 45: 1188-1203.',
        'Swiatkiewicz, S. et al. (2015). The use of bentonite minerals as mycotoxin binders in animal nutrition. Czech J. Anim. Sci. 60: 181-192.',
      ],
      sumberData: 'CEC dan komposisi mineralogi mengacu pada analisis zeolit Bayah, Sukabumi (data lokal). Kapasitas adsorpsi mengacu pada Mumpton & Fishman (1977) dan Pond & Yen (1983). Dosis berdasarkan kompilasi uji lapangan Indonesia.',
      catatan: 'Pastikan zeolit yang digunakan adalah klinoptilolite, bukan jenis zeolit lain (mordenit, ferit) yang CEC-nya lebih rendah. Analisis XRD adalah satu-satunya cara pasti mengidentifikasi jenis mineral zeolit. Produk impor Cina sering merupakan campuran zeolit dengan kualitas bervariasi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🪨', text: 'Zeolit klinoptilolite bekerja melalui dua mekanisme: (1) Tukar ion — NH₄⁺ dari fermentasi rumen dan metabolisme protein bertukar dengan Na⁺ atau K⁺ dalam kerangka zeolit, mengurangi amonia bebas di rumen dan darah; (2) Adsorpsi fisik — toksin dan logam berat terjebak dalam pori-pori kristal berukuran 3,5–8 Å (selektivitas molekular berdasarkan ukuran dan muatan).' },
      { type: 'kelebihan', icon: '✅', text: 'Pada sapi perah yang mendapat ransum NPN/urea tinggi, suplementasi 2% zeolit dalam ransum mengurangi konsentrasi amonia rumen 20–35% dan meningkatkan nitrogen retensi 8–15%. Pada ayam broiler, litter yang mengandung 5% zeolit menunjukkan amonia 30–45% lebih rendah dan kasus footpad dermatitis berkurang 20–30%.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi terbaik untuk program NPN (urea): Zeolit Alam (1,5%) + Urea (1–1,5%) + Molases (5%) — zeolit menjadi buffer amonia yang mencegah akumulasi berbahaya di rumen saat urea dihidrolisis, sementara molases menyediakan energi cepat untuk mikroba rumen yang memetabolisme amonia menjadi protein mikroba.' },
      { type: 'peringatan', icon: '⚠️', text: 'Pada dosis >3% ransum, zeolit dapat mengurangi bioavailabilitas K⁺ dan Ca²⁺ secara signifikan melalui mekanisme tukar ion — pertimbangkan peningkatan suplementasi mineral kation pada dosis tinggi. Zeolit juga berpotensi menghambat absorpsi beberapa obat bermuatan positif (tetrasiklin) — hindari penggunaan bersamaan.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif untuk fungsi pengikat amonia: Bentonit (CEC lebih rendah untuk NH₄⁺ namun lebih baik untuk aflatoksin); MgO dan CaO (mengikat amonia secara kimia melalui reaksi basa — lebih cepat namun meningkatkan pH rumen); Senyawa NPN buffer komersial. Untuk adsorpsi logam berat: karbon aktif atau HSCAS lebih efektif untuk Pb dan Cd.',
      },
    ],
  },

  // ── 4. Bentonit ───────────────────────────────────────────────────────────────
  'bentonit': {
    asal: 'Tambang bentonit: Boyolali & Blora (Jawa Tengah), Tasikmalaya (Jawa Barat), Lombok (NTB), Pacitan. Produsen lokal: PT Agro Bentonite, CV Mineral Indonesia. Produk impor dari Amerika (Wyoming sodium bentonite — standard tertinggi).',
    sumber: 'Bentonit terbentuk dari pelapukan abu vulkanik dalam lingkungan basa selama ribuan–jutaan tahun, menghasilkan mineral smektit (montmorilonit) yang sangat ekspansif. Sodium bentonit (Na-Bentonit) memiliki daya kembang 10–30× dan CEC 90–130 meq/100g, lebih superior untuk adsorpsi aflatoksin dibanding kalsium bentonit. Indonesia memiliki cadangan bentonit besar.',
    bentukFisik: 'Tepung halus putih keabu-abuan hingga krem. Sangat halus dan berpotensi berdebu. Terasa licin saat diremas (greasy feel). Kembang dalam air menjadi gel.',
    fungsiUtama: 'Adsorben aflatoksin terbaik di antara mineral alami (80–99% pada pH GI), binder/perekat pelet, pengkondisi saluran cerna, dan pengurang kadar amonia litter.',
    kelebihan: 'Efektivitas adsorpsi aflatoksin B1 80–99% — tertinggi di antara semua adsorben mineral alami; harga sangat terjangkau dan tersedia melimpah di Indonesia; berfungsi ganda: adsorben mikotoksin DAN binder pelet berkualitas (meningkatkan PDI 5–15%); stabil dalam kondisi rumen (pH 5,5–7); aman tanpa residu untuk ternak, konsumen, dan lingkungan.',
    kekurangan: 'Efektivitas untuk toksin non-aflatoksin jauh lebih rendah (zearalenon <50%, DON <20%); kadar Ca dan Na bentonit yang tinggi dapat mempengaruhi keseimbangan elektrolit jika digunakan dosis tinggi; bubuk sangat halus — masalah debu dan keseragaman pencampuran; kualitas bervariasi signifikan antar sumber — sodium bentonit Wyoming jauh lebih unggul dari lokal.',
    komposisi: {
      bk: 90.0, pk: 0.0, sk: 0.0, lk: 0.0, abu: 85.0, betn: 15.0,
      tdn: null, me: null,
      ca: 1.2, p: 0.01, mg: 2.5, na: 2.8, k: 0.3, cl: null, s: null,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: null,
      senyawaAktif: 'Montmorilonit: 60–90%; SiO₂: 55–65%; Al₂O₃: 15–20%; MgO: 3–5%; Kapasitas Tukar Kation (CEC): 70–130 meq/100g; Daya kembang (swelling index): Na-bentonit 10–30×, Ca-bentonit 1–3×; Luas permukaan total (eksternal+interlayer): 600–800 m²/g',
      kapasitasAdsorpsi: 'Aflatoksin B1: 80–99% pada pH 2–8 — efektivitas terbaik di antara mineral alami; Fumonisin B1: 40–70%; Zearalenon: 20–50%; Ochratoksin A: 40–80%; DON (deoxynivalenol): <20% (tidak efektif untuk toksin trikotesen polar); Sebagai binder pelet (PDI): 0,5–2% meningkatkan PDI 5–15%',
      ukuranPartikel: '200 mesh (74 µm) standar feed grade; ultra-fine <44 µm untuk adsorpsi superior',
      catatanKomposisi: 'Na, Mg, Ca yang tertera adalah komponen intrinsik mineral yang dapat dipertukarkan — bukan sebagai suplemen. Na bentonit mengandung Na intrinsik yang lebih tinggi dari Ca bentonit. Sumber: Swiatkiewicz et al. (2015), Ramos & Hernandez (1996).',
    },
    karakteristik: {
      ph: '8,0–10,0 (suspensi 5% — bersifat basa)',
      bentukFisik: 'Tepung putih-abu halus, terasa licin (soapy feel), kembang dalam air',
      warna: 'Putih, krem, abu-abu, atau kecoklatan tergantung impuritas',
      ukuranPartikel: '200 mesh (74 µm) feed grade standar',
      beratJenis: 'Bulk density: 0,50–0,80 g/cm³; meningkat signifikan saat menyerap air',
      kelarutan: 'Tidak larut; mengembang membentuk gel tebal dalam air (Na-bentonit). Ekspansi interlayer membuka akses toksin ke situs adsorpsi internal.',
      stabilitasPenyimpanan: 'Stabil secara kimia. Rentan menyerap kelembaban dari udara — harus disimpan kering untuk mempertahankan sifat pengembangan dan kapasitas adsorpsi. Kelembaban tinggi mengurangi efektivitas sebagai binder pelet.',
      umurSimpan: '3–5 tahun (simpan kering, wadah tertutup)',
      kondisiPenyimpanan: 'Wadah tertutup kedap udara. Kelembaban relatif gudang <60%. Jangan simpan bersama bahan yang sangat lembab. Gumpalan yang terbentuk karena kelembaban dapat dihancurkan kembali tanpa kehilangan efektivitas adsorpsi signifikan.',
    },
    penggunaan: {
      fungsiUtama: 'Adsorben aflatoksin B1 dan ochratoksin dalam saluran cerna, perekat/binder pelet granul (meningkatkan daya tahan pelet), pengurangan amonia litter, dan pengkondisi saluran cerna.',
      maksPenggunaan: '0,1–0,5% ransum untuk adsorpsi toksin; 0,5–2,0% ransum sebagai binder pelet (5–20 kg/ton pakan)',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Sapi Perah', 'Sapi Pedaging', 'Babi', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui', 'Bunting'],
      metodePemberian: 'Dicampur merata dalam ransum mash atau premix. Untuk fungsi binder pelet: tambahkan pada tahap mixing kering sebelum penambahan uap/air. Dapat dikombinasikan dengan arang aktif untuk spektrum toksin yang lebih luas.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan kering. Bersifat basa — hindari kontak langsung dengan asam organik dosis tinggi dalam premix (dapat menetralkan). Tidak mengganggu nutrisi pada dosis ≤0,5%. Sinergi baik dengan arang aktif untuk cakupan broadspektrum toksin.',
      catatan: 'Spesifikasikan "sodium bentonite" atau "Na-bentonite" saat memesan — Na-bentonit jauh lebih efektif dari Ca-bentonit untuk adsorpsi aflatoksin. Batasi <2% ransum untuk menghindari efek negative pada konsumsi pakan dan keseimbangan mineral. Pada ayam petelur, perhatikan konsumsi pakan tidak turun >5% dari kontrol.',
    },
    harga: {
      estimasiAI: 2500, hargaMarketplace: 2000,
      satuan: 'per kg',
      supplier: 'PT Agro Bentonite (Blora); distributor bahan pakan ternak Jawa Tengah; toko kimia pertanian; importir dari Wyoming, USA untuk grade premium',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Swiatkiewicz, S., Koreleski, J. & Arczewska-Wlosek, A. (2015). The use of bentonite minerals as mycotoxin binders. Czech J. Anim. Sci. 60: 181-192.',
        'Ramos, A.J. & Hernandez, E. (1996). In vitro aflatoxin adsorption by means of a montmorillonite silicate. Animal Feed Sci. Technol. 62: 263-269.',
        'NRC (2005). Mineral Tolerance of Animals, 2nd Rev. Ed. National Academy Press, Washington DC.',
        'Schell, T.C. et al. (1993). Effects of feeding aflatoxin-contaminated corn with and without a high affinity aluminosilicate sorbent. J. Anim. Sci. 71: 1089-1094.',
        'Harvey, R.B. et al. (1991). Prevention of aflatoxicosis by addition of hydrated sodium calcium aluminosilicate to the diets of growing barrows. Am. J. Vet. Res. 52: 152-156.',
      ],
      sumberData: 'Kapasitas adsorpsi aflatoksin mengacu pada Swiatkiewicz et al. (2015) dan Ramos & Hernandez (1996). CEC dan mineralogi mengacu pada analisis bentonit Blora dan Boyolali. Dosis berdasarkan uji lapangan broiler Indonesia.',
      catatan: 'Minta COA mencakup: CEC, swelling index, kadar montmorilonit, dan uji aflatoksin adsorpsi in vitro. Bentonit kelas rendah (montmorilonit <50%) tidak efektif sebagai adsorben dan sebaiknya hanya digunakan sebagai binder pelet. Jangan gunakan bentonit drilling grade (untuk pengeboran minyak) karena kandungan logam berat potensial.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🏔️', text: 'Bentonit (montmorilonit) memiliki struktur kristal berlapis yang unik: lapisan aluminosilikat yang dapat mengembang memberi akses ke permukaan internal 600–800 m²/g. Aflatoksin B1 (senyawa planar hidrofobik) terjebak di antara lapisan interlayer melalui kombinasi ikatan hidrofobik dan interaksi kation-pi — mirip seperti "sandwich" yang mengunci toksin sempurna bahkan di pH rumen dan usus halus.' },
      { type: 'kelebihan', icon: '✅', text: 'Bentonit adalah satu-satunya mineral alami yang secara konsisten menunjukkan adsorpsi aflatoksin B1 >80% dalam kondisi pH GI ternak (2–8) pada uji in vitro dan in vivo. Dalam uji broiler yang terpapar 100 ppb aflatoksin, penambahan 0,3% bentonit memulihkan FCR, pertambahan bobot, dan integritas hati mendekati kontrol negatif.' },
      { type: 'peringatan', icon: '⚠️', text: 'Bentonit tidak efektif untuk trikotesen (DON, T-2 toxin) dan zearalenon polar. Jangan andalkan bentonit sebagai "catch-all" untuk semua mikotoksin — pakan jagung musim hujan sering terkontaminasi campuran aflatoksin + fumonisin + DON, yang memerlukan kombinasi adsorben. Untuk program broadspektrum, kombinasikan dengan arang aktif dan asam organik.' },
      { type: 'kombinasi', icon: '🔗', text: 'Program anti-mikotoksin komprehensif: Bentonit Na (0,2%) + Arang Aktif (0,05%) + Fumonisin binder berbasis HPΒCD atau karbon aktif + Asam Organik (propionat 0,2%). Bentonit menutup aflatoksin dan ochratoksin, arang aktif menangani fumonisin dan sisa aflatoksin, asam organik menghambat pertumbuhan jamur lebih lanjut dalam pakan jadi.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif untuk adsorpsi aflatoksin: HSCAS (Hydrated Sodium Calcium Aluminosilicate) — sintetis, lebih konsisten namun lebih mahal; Zeolit klinoptilolite — lebih selektif untuk amonia tapi kurang efektif untuk aflatoksin; Smektit termodifikasi (organoclay) — efektivitas lebih tinggi untuk spektrum toksin lebih luas namun jauh lebih mahal. Sebagai binder pelet: lignosulfonat atau guar gum dapat menggantikan tanpa efek adsorpsi toksin.' },
    ],
  },

  // ── 5. Kaolin ─────────────────────────────────────────────────────────────────
  'kaolin': {
    asal: 'Tambang kaolin: Belitung & Bangka (cadangan terbesar, kualitas tinggi), Kalimantan Tengah, Jawa Barat (Karawang, Subang). PT Kaolin Indonesia, PT Bangka Belitung Kaolin. Tersedia luas sebagai bahan industri keramik, kertas, dan kosmetik.',
    sumber: 'Kaolin terbentuk dari pelapukan hidrothermal atau kimia feldspar dan mineral silikat lain, menghasilkan mineral kaolinite Al₂Si₂O₅(OH)₄ yang murni. Berbeda dari bentonit, kaolin tidak ekspansif (CEC sangat rendah: 3–15 meq/100g) sehingga lebih inert dan aman pada dosis tinggi. Feed grade menggunakan kaolin yang telah dibersihkan dari impuritas logam berat.',
    bentukFisik: 'Tepung putih bersih halus, sangat lembut saat diraba, tidak kasar. Tidak menggumpal mudah seperti bentonit.',
    fungsiUtama: 'Anti-caking agent (pencegah gumpalan pakan), pelindung mukosa saluran cerna (gastroprotektif), carrier dalam premix mineral/vitamin, perekat pelet ringan.',
    kelebihan: 'Sangat inert dan aman — CEC sangat rendah sehingga hampir tidak mengikat nutrisi penting; tidak toksik pada dosis tinggi; harga sangat murah; digunakan luas dalam formulasi obat antidiare manusia (kaolin pektin) — profil keamanan terdokumentasi baik; excellent anti-caking agent karena daya serap air rendah namun menyerap lemak; putih bersih membantu penampilan pakan.',
    kekurangan: 'Kapasitas adsorpsi mikotoksin sangat rendah — tidak efektif sebagai mycotoxin binder; CEC rendah membuatnya inferior dibanding bentonit dan zeolit untuk penangkapan kation; sebagai binder pelet lebih lemah dari bentonit sodium; debu halus berpotensi mengiritasi saluran pernapasan saat penanganan; tidak menambah nilai nutrisi apapun.',
    komposisi: {
      bk: 90.0, pk: 0.0, sk: 0.0, lk: 0.0, abu: 82.0, betn: 18.0,
      tdn: null, me: null,
      ca: 0.2, p: 0.02, mg: 0.1, na: 0.05, k: 0.2, cl: null, s: null,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: null,
      senyawaAktif: 'Kaolinite: 85–95%; SiO₂: 45–52%; Al₂O₃: 36–42%; Kapasitas Tukar Kation (CEC): 3–15 meq/100g (sangat rendah — sangat inert); pH larutan: 5–7 (hampir netral); Permukaan spesifik: 10–25 m²/g',
      kapasitasAdsorpsi: 'Anti-caking: efektif 0,5–1% ransum; Pelindung mukosa gastrointestinal (gastroprotektif); Adsorpsi toksin: sangat rendah — tidak efektif sebagai mycotoxin binder utama; Adsorpsi air: moderate 30–40% berat sendiri',
      ukuranPartikel: '200–325 mesh (44–74 µm); ultra-fine <5 µm untuk fungsi gastroprotektif farmasi',
      catatanKomposisi: 'Nilai mineral sangat rendah dan tidak signifikan sebagai suplemen. Kaolinite yang hampir murni tidak reaktif terhadap nutrisi pakan. Sumber: McDonald (2011), data produsen lokal Belitung.',
    },
    karakteristik: {
      ph: '5,0–7,0 (hampir netral — keunggulan vs bentonit yang basa)',
      bentukFisik: 'Tepung putih bersih ultra-halus, lembut seperti bedak',
      warna: 'Putih bersih hingga krem sangat muda',
      ukuranPartikel: '200–325 mesh (44–74 µm)',
      beratJenis: 'Bulk density: 0,20–0,40 g/cm³; densitas sesungguhnya: 2,58–2,63 g/cm³',
      kelarutan: 'Tidak larut dalam air. Membentuk suspensi stabil. Tidak mengembang (berbeda dari bentonit). Sangat stabil di semua kondisi pH GI.',
      stabilitasPenyimpanan: 'Sangat stabil — tidak mudah menyerap kelembaban (lebih baik dari bentonit), tidak terdegradasi, tidak teroksidasi. Dapat disimpan tanpa penanganan khusus.',
      umurSimpan: '>5 tahun (hampir tidak terbatas)',
      kondisiPenyimpanan: 'Gudang kering tertutup. Tidak memerlukan penanganan khusus. Lebih mudah disimpan dan ditangani dibanding bentonit karena tidak ekspansif.',
    },
    penggunaan: {
      fungsiUtama: 'Anti-caking agent pada ransum mash dan premix, pelindung mukosa usus halus (mengurangi diare ringan dan gangguan GI), carrier bahan aktif dalam premix, dan perekat pelet ringan.',
      maksPenggunaan: '0,5–2,0% ransum (5–20 kg/ton pakan); anti-caking: 0,5–1,0%; gastroprotektif: 1–2%',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Sapi Pedaging', 'Kambing', 'Domba', 'Babi', 'Anak Ternak (pedet, anak ayam, anak babi)'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      metodePemberian: 'Dicampur merata dalam ransum pada tahap mixing kering. Sangat mudah tercampur karena partikel halus. Ideal sebagai carrier premix karena putih bersih dan tidak reaktif terhadap nutrisi.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan dan suplemen. Hampir tidak bereaksi dengan komponen lain (sangat inert). pH netral tidak mempengaruhi stabilitas vitamin atau enzim. Pilihan carrier terbaik untuk vitamin dan antibiotik sensitif pH dibanding bentonit (basa) atau zeolite.',
      catatan: 'Untuk fungsi anti-mikotoksin, kaolin tidak efektif sebagai bahan tunggal — kombinasikan dengan bentonit atau arang aktif. Pastikan grade "feed grade" atau "food grade" — kaolin industri (untuk kertas, cat) mungkin mengandung impuritas logam berat yang tidak acceptable.',
    },
    harga: {
      estimasiAI: 2000, hargaMarketplace: 1800,
      satuan: 'per kg',
      supplier: 'PT Kaolin Indonesia (Belitung); distributor bahan kimia industri Jawa; toko bahan baku kosmetik dan keramik; impor dari Cina untuk grade premium',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'McDonald, P., Edwards, R.A. & Greenhalgh, J.F.D. (2011). Animal Nutrition, 7th Ed. Pearson Education, Harlow.',
        'NRC (2005). Mineral Tolerance of Animals, 2nd Rev. Ed. National Academy Press.',
        'Underwood, E.J. & Suttle, N.F. (1999). The Mineral Nutrition of Livestock, 3rd Ed. CABI Publishing.',
        'Papich, M.G. (2016). Kaolin and Pectin. In: Saunders Handbook of Veterinary Drugs, 4th Ed.',
        'Jongkees, A.S. et al. (2014). Kaolin as a feed additive: anti-caking and physical effects. J. Anim. Feed Sci. 23: 205-212.',
      ],
      sumberData: 'Komposisi mineral dan CEC mengacu pada analisis kaolin Belitung (data tambang). Penggunaan klinis mengacu pada Papich (2016) dan McDonald (2011).',
      catatan: 'Kaolin adalah salah satu mineral paling aman yang digunakan dalam formulasi veteriner dan pakan ternak. Tidak ada laporan toksisitas pada ternak maupun residu pada produk hewan hingga dosis 5% ransum.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚪', text: 'Kaolin bekerja sebagai pelindung mukosa usus melalui mekanisme fisik — lapisan tipis partikel halus menyelimuti permukaan vili usus, mengurangi kontak langsung iritan (asam empedu berlebih, toksin bakteri ringan, partikel kasar) dengan epitel GI. Efek "coating" ini sudah dimanfaatkan selama berabad-abad dalam formulasi antidiare manusia (kaolin-pektin) dan kini diaplikasikan dalam pakan ternak.' },
      { type: 'kelebihan', icon: '✅', text: 'Keunikan utama kaolin dibanding bentonit dan zeolit adalah keinertannya yang luar biasa — CEC 3–15 meq/100g vs bentonit 70–130 meq/100g berarti kaolin hampir tidak mengikat nutrisi penting (vitamin, mineral, asam amino) dari digesta. Dapat digunakan dosis lebih tinggi (2–3%) tanpa risiko nutrisi imbalance — aman sebagai carrier premix untuk vitamin sensitif.' },
      { type: 'kombinasi', icon: '🔗', text: 'Aplikasi terbaik: Kaolin sebagai carrier premix (1%) + Bentonit sebagai adsorben aflatoksin (0,2%) + Zeolit sebagai pengikat amonia (0,5%). Kaolin bertugas sebagai "matriks inert" yang memastikan distribusi homogen bahan aktif, sementara bentonit dan zeolit melakukan fungsi adsorpsi aktif mereka tanpa kompetisi dari kaolin.' },
      { type: 'peringatan', icon: '⚠️', text: 'Jangan mengandalkan kaolin untuk program anti-mikotoksin — efektivitas adsorpsinya sangat rendah dibanding bentonit dan zeolit. Kaolin terbaik untuk fungsi anti-caking, carrier, dan gastroprotektif ringan. Pastikan spesifikasi feed/food grade sebelum penggunaan karena kaolin industri (grade keramik atau kertas) tidak dijamin bebas logam berat (Pb, As).' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif untuk fungsi anti-caking: Silika amorf (silicon dioxide — E551) lebih efektif namun lebih mahal; diatomit grade halus memiliki efek serupa. Untuk carrier premix: maltodekstrin (mahal), tepung jagung halus, atau dedak halus dapat digunakan namun tidak seputih dan seinert kaolin. Untuk gastroprotektif: pektin (dari ampas jeruk) lebih efektif namun harganya jauh lebih mahal.' },
    ],
  },

  // ── 6. Diatomit ───────────────────────────────────────────────────────────────
  'diatomit': {
    asal: 'Deposit diatomit: Flores (NTT), Kalimantan, Sulawesi. Produsen impor dari Amerika Serikat (Celite®, Hyflo), Denmark (EaglePicher), Cina. Feed/food grade: produk impor mendominasi karena standar pemrosesan yang lebih ketat.',
    sumber: 'Diatomit adalah batuan sedimen yang tersusun dari 80–95% silika amorf (SiO₂) yang berasal dari cangkang fosil alga mikroskopis (diatom) yang terakumulasi di dasar danau atau laut selama jutaan tahun. Setiap diatom memiliki cangkang (frustule) berstruktur mikropori unik yang tidak terdapat pada mineral lain — inilah yang memberi diatomit luas permukaan dan sifat adsorpsi khusus. Feed grade dikalsinasi dan dibersihkan untuk menghilangkan kontaminan organik.',
    bentukFisik: 'Bubuk putih bersih ultra-ringan, terasa seperti bedak kasar. Sangat ringan (bulk density sangat rendah). Tidak higroskopis.',
    fungsiUtama: 'Anti-caking agent premium, pengendalian serangga hama gudang pakan secara mekanis (bukan kimia), adsorpsi kelembaban dalam litter unggas, dan pencegah penggumpalan ransum berlemak tinggi.',
    kelebihan: 'Pengendalian serangga hama gudang 100% mekanis (bukan pestisida kimia) — tidak ada resistensi, tidak ada residu kimia, tidak berbahaya bagi manusia dan ternak; anti-caking sangat efektif untuk pakan berlemak tinggi; tidak reaktif terhadap nutrisi (inert); luas permukaan unik dari struktur frustule diatom; terdaftar sebagai GRAS (Generally Recognized As Safe) oleh FDA Amerika.',
    kekurangan: 'Harga lebih mahal dari kaolin dan bentonit; debu silika amorf berpotensi bahaya paru-paru pada konsentrasi tinggi saat penanganan — gunakan masker; efektivitas sebagai adsorben mikotoksin sangat terbatas; ketersediaan feed grade berkualitas di Indonesia masih terbatas (mayoritas impor); tidak efektif untuk pengendalian hama dalam ransum basah/TMR.',
    komposisi: {
      bk: 90.0, pk: 0.0, sk: 0.0, lk: 0.0, abu: 87.0, betn: 13.0,
      tdn: null, me: null,
      ca: 0.5, p: 0.05, mg: 0.3, na: 0.1, k: 0.2, cl: null, s: null,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: null,
      senyawaAktif: 'SiO₂ amorf: 85–95% (aman — berbeda dari silika kristalin/kwarsa yang berbahaya); Luas permukaan (BET): 10–40 m²/g; Porositas frustule: 80–90%; Kadar air feed grade: ≤10%; Crystallinity: amorf (bukan kristalin — kunci keamanan biologi)',
      kapasitasAdsorpsi: 'Anti-caking: sangat efektif 0,5–2% ransum berlemak; Pengendalian serangga mekanis: merusak lapisan lilin epikutikula serangga (Tribolium, Sitophilus) menyebabkan dehidrasi fatal; Adsorpsi moisture: 100–200% berat sendiri; Adsorpsi toksin: rendah-sedang',
      ukuranPartikel: 'Feed grade: 3–20 µm (median 8–12 µm); insektisida: 5–50 µm; anti-caking: <25 µm',
      catatanKomposisi: 'Silika amorf dalam diatomit aman untuk ternak (berbeda dari silika kristalin/kwarsa yang menyebabkan silikosis). Komponen mineral sangat rendah dan tidak relevan sebagai suplemen. Sumber: data produsen Celite/Hyflo, FDA GRAS designation.',
    },
    karakteristik: {
      ph: '6,5–7,5 (hampir netral)',
      bentukFisik: 'Bubuk putih bersih ultra-ringan, tekstur lembut seperti tepung beras halus',
      warna: 'Putih bersih hingga krem sangat muda',
      ukuranPartikel: '3–20 µm (feed/food grade)',
      beratJenis: 'Bulk density: 0,12–0,25 g/cm³ — salah satu material paling ringan',
      kelarutan: 'Tidak larut dalam air, asam, atau basa pada kondisi normal. Larut dalam HF pekat (asam fluorida) — tidak relevan untuk kondisi pakan.',
      stabilitasPenyimpanan: 'Sangat stabil secara kimia dan fisik. Tidak terdegradasi, tidak mudah menyerap kelembaban (tidak higroskopis). Stabil dalam jangka sangat panjang.',
      umurSimpan: '>10 tahun (hampir permanen pada penyimpanan kering)',
      kondisiPenyimpanan: 'Wadah tertutup, kering. Gunakan masker debu saat penanganan karena partikel halus berpotensi masuk saluran pernapasan. Hindari penyimpanan bersama bahan sangat lembab.',
    },
    penggunaan: {
      fungsiUtama: 'Anti-caking agent pada ransum dan premix, pengendalian hama serangga gudang pakan (Sitophilus, Tribolium, Callosobruchus) secara mekanis, dan pengurangan kelembaban litter unggas.',
      maksPenggunaan: '0,5–2,0% ransum sebagai anti-caking; 500–1.500 ppm (0,05–0,15%) sebagai pengendalian serangga gudang (taburkan pada permukaan tumpukan pakan)',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Sapi Pedaging', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      metodePemberian: 'Dicampur dalam ransum untuk fungsi anti-caking dan adsorpsi. Untuk pengendalian hama: taburkan tipis di permukaan tumpukan bahan pakan dalam gudang. Untuk litter: campurkan 1–3% ke bahan litter sebelum penggunaan.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan. Sangat inert — tidak bereaksi dengan nutrisi, vitamin, atau bahan aktif. Sifat abrasif rendah tidak merusak peralatan. Kompatibel dengan premix dan obat-obatan.',
      catatan: 'Gunakan masker debu FFP2/N95 saat penanganan karena partikel halus berpotensi masuk paru-paru. Debu SiO₂ amorf tidak menyebabkan silikosis (berbeda dari kwarsa), namun paparan kronik berlebihan tetap harus dihindari. Pastikan label "food grade" atau "feed grade" — bukan grade filter industri yang mungkin mengandung silika kristalin.',
    },
    harga: {
      estimasiAI: 5000, hargaMarketplace: 4500,
      satuan: 'per kg',
      supplier: 'Importir bahan pakan (PT Sumber Mas Indah, Jakarta); distributor kimia pertanian; produk Celite®/Hyflo melalui importir resmi',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Korunic, Z. (1998). Diatomaceous earths, a group of natural insecticides. J. Stored Prod. Res. 34(2-3): 87-97.',
        'FDA (2023). GRAS Notice 000779: Diatomaceous Earth for use in animal feed. U.S. Food and Drug Administration.',
        'Alves, L.F.A. et al. (2006). Efficiency of diatomaceous earth to control stored grain insects. Cienc. Rural 36: 1700-1705.',
        'NRC (2005). Mineral Tolerance of Animals, 2nd Rev. Ed. National Academy Press.',
        'Athanassiou, C.G. et al. (2011). Insecticidal effect of diatomaceous earth against adults of Sitophilus. Crop Protection 30: 785-791.',
      ],
      sumberData: 'Komposisi kimia mengacu pada data Celite Corporation dan FDA GRAS designation. Efektivitas insektisida mengacu pada Korunic (1998) dan Athanassiou et al. (2011).',
      catatan: 'Pastikan menggunakan grade "food grade" atau "feed grade" yang telah dikalsinasi untuk menghilangkan kontaminan organik — bukan grade filter industri. Diatomit food grade memiliki kadar SiO₂ kristalin <1% (aman); grade industri bisa mengandung SiO₂ kristalin tinggi (berbahaya untuk paru-paru).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🔬', text: 'Keunikan diatomit adalah strukturnya yang berasal dari cangkang fosil alga — setiap partikel memiliki bentuk frustrasi (cangkang) yang unik dengan lubang mikro berdiameter 0,1–1 µm, memberikan sifat adsorpsi yang tidak dimiliki mineral amorf biasa. Untuk pengendalian serangga, partikel tajam-abrasif merusak lapisan lilin pelindung kutikula serangga secara mekanis, menyebabkan dehidrasi fatal tanpa senyawa kimia.' },
      { type: 'kelebihan', icon: '✅', text: 'Pengendalian serangga gudang dengan diatomit tidak menimbulkan resistensi (mekanisme mekanis, bukan kimia), tidak meninggalkan residu kimia pada pakan, aman bagi manusia dan ternak saat dikonsumsi, dan efektif terhadap semua stadium serangga (larva, pupa, dewasa). Uji lapangan menunjukkan kematian 95–100% kumbang Sitophilus dalam 72 jam pada konsentrasi 1 kg/ton bahan pakan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Strategi pengelolaan gudang pakan terintegrasi: Diatomit (1 kg/ton) untuk pengendalian serangga + Kaolin (0,5%) sebagai anti-caking + penyimpanan dalam silo tertutup dengan fumigasi CO₂ periodik. Diatomit bekerja kontak-langsung, CO₂ membunuh semua stadium termasuk telur, kaolin menjaga kualitas fisik pakan — tiga lapisan perlindungan tanpa pestisida kimia.' },
      { type: 'peringatan', icon: '⚠️', text: 'Selalu gunakan masker debu (minimal FFP1, disarankan FFP2) saat menangani diatomit dalam jumlah besar. Meskipun SiO₂ amorf diatomit berbeda dari kwarsa (tidak menyebabkan silikosis), paparan debu halus berulang tetap perlu diminimasi. Efektivitas insektisida berkurang drastis pada kondisi lembab (RH >70%) — pastikan gudang pakan kering.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif pengendalian serangga gudang non-kimia: Sipermetrin atau pirimifos-metil (insektisida kimia — lebih cepat efektif namun ada residu); CO₂ atmosphere (mahal, perlu silo kedap); Suhu ekstrem (pemanasan 55°C selama 24 jam atau pendinginan <10°C); Penyimpanan vakum. Untuk anti-caking tanpa fungsi insektisida: kaolin atau silika amorf (E551) lebih ekonomis.' },
    ],
  },

  // ── 7. Arang Tempurung Kelapa ─────────────────────────────────────────────────
  'arang-tempurung-kelapa': {
    asal: 'Seluruh daerah penghasil kelapa di Indonesia: Sulawesi Utara, Sulawesi Tengah, Riau, Sumatra Barat, Jawa Barat, Kalimantan. Merupakan hasil samping industri pengolahan kelapa (kopra, santan, VCO) yang sangat melimpah.',
    sumber: 'Arang tempurung kelapa dihasilkan dari karbonisasi tempurung (batok) kelapa kering dalam tungku tradisional (retort kiln) pada suhu 350–500°C tanpa oksigen selama 4–8 jam. Tidak melalui proses aktivasi — ini yang membedakannya dari arang aktif. Merupakan bahan baku premium untuk pembuatan arang aktif berkualitas tinggi (hasil aktivasi lebih lanjut). Karena tidak diaktivasi, luas permukaannya lebih rendah namun mengandung lebih banyak gugus permukaan aktif dari karbonisasi parsial.',
    bentukFisik: 'Potongan tidak beraturan, granul, atau serpihan hitam mengkilap. Keras dan padat. Dapat dihaluskan menjadi bubuk hitam.',
    fungsiUtama: 'Adsorben toksin saluran cerna ringan-sedang, pengkondisi ekosistem usus, penyedia karbon untuk mikroba saluran cerna, detoksifikasi ringan pada kasus keracunan pakan.',
    kelebihan: 'Harga terjangkau dan tersedia melimpah di seluruh Indonesia sebagai produk samping kelapa; luas permukaan lebih tinggi dari biochar sekam padi (50–300 m²/g vs 10–50 m²/g) — lebih dekat ke arang aktif; bahan baku terbaik untuk produksi arang aktif premium (kualitas tertinggi setelah aktivasi); tidak ada isu keamanan; dapat diproduksi dalam skala kecil di kandang.',
    kekurangan: 'Kapasitas adsorpsi toksin jauh lebih rendah dari arang aktif (tanpa aktivasi, luas permukaan hanya 10–20% dari arang aktif); kualitas sangat bervariasi tergantung metode pembakaran dan bahan tempurung; tidak ada standar feed grade resmi; sulit dihaluskan secara homogen pada skala kecil; tidak efektif untuk keracunan aflatoksin dosis tinggi (gunakan arang aktif atau bentonit).',
    komposisi: {
      bk: 92.0, pk: 0.3, sk: 0.0, lk: 0.1, abu: 2.5, betn: 97.1,
      tdn: null, me: null,
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: null,
      senyawaAktif: 'Karbon total: 87–93%; Volatile matter: 5–10% (residu senyawa organik karbonisasi parsial); Fixed carbon: 82–88%; Kadar abu: 2–4% (lebih rendah dari biochar sekam padi); Luas permukaan (BET, tanpa aktivasi): 50–300 m²/g; pH larutan: 7–9 (sedikit basa)',
      kapasitasAdsorpsi: 'Adsorben toksin GI sedang — lebih efektif dari biochar sekam padi namun jauh di bawah arang aktif; Efektif sebagai pengkondisi usus dan carrier mikroba; Adsorpsi aflatoksin: 40–65%; Basis terbaik untuk arang aktif grade premium setelah aktivasi uap 800–1.000°C',
      ukuranPartikel: '0,5–5 mm (kasar, untuk langsung dicampur TMR); 50–200 mesh (untuk ransum mash/pellet)',
      catatanKomposisi: 'Abu sangat rendah (2–4%) dibanding biochar dari biomassa lain — inilah keunggulan bahan baku tempurung kelapa untuk produksi arang aktif premium. Tidak mengandung kontaminan logam berat signifikan (tempurung bersih). Sumber: data industri arang aktif Indonesia, McDonald (2011).',
    },
    karakteristik: {
      ph: '7,0–9,0 (larutan 5%, sedikit basa)',
      bentukFisik: 'Granul atau serpihan hitam mengkilap, keras. Dapat dihaluskan menjadi bubuk.',
      warna: 'Hitam mengkilap (berbeda dari arang aktif yang hitam matte)',
      ukuranPartikel: '0,5–5 mm kasar; 50–200 mesh setelah penggilingan',
      beratJenis: 'Bulk density: 0,20–0,35 g/cm³',
      kelarutan: 'Tidak larut dalam air. Lebih padat dari biochar — tidak mudah mengapung dan tersuspensi dalam pakan cair.',
      stabilitasPenyimpanan: 'Sangat stabil — tidak terdegradasi, tidak teroksidasi pada kondisi normal. Dapat menyerap bau jika tidak disimpan tertutup (karena masih ada pori adsorpsi aktif). Simpan dalam wadah tertutup untuk mempertahankan kapasitas adsorpsi.',
      umurSimpan: '2–5 tahun (wadah tertutup kering)',
      kondisiPenyimpanan: 'Wadah tertutup, jauhkan dari bahan berbau keras (bahan kimia, minyak esensial). Simpan kering dan tertutup untuk mempertahankan kapasitas adsorpsi pori yang belum jenuh.',
    },
    penggunaan: {
      fungsiUtama: 'Adsorben toksin saluran cerna ringan-sedang, pengkondisi ekosistem usus, tindakan pertama untuk gangguan pencernaan ringan pada ternak, dan bahan pendukung detoksifikasi alami.',
      maksPenggunaan: '0,1–0,5% ransum (1–5 kg/ton pakan); untuk TMR: bisa sampai 1% (10 kg/ton)',
      targetTernak: ['Sapi Pedaging', 'Sapi Perah', 'Kambing', 'Domba', 'Ayam Broiler', 'Ayam Petelur'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      metodePemberian: 'Giling halus (50–200 mesh) sebelum dicampur dalam ransum mash/pellet. Untuk TMR: granul kasar dapat langsung ditambahkan dan dicampur. Untuk drench darurat: suspensi 50–100 g dalam air bersih.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan. Seperti arang aktif namun kapasitas adsorpsi nutrisi lebih rendah — risiko pengikat vitamin lebih rendah. Dapat dikombinasikan dengan probiotik (arang menjadi habitat bakteri setelah masuk usus).',
      catatan: 'Jika perlu efektivitas adsorpsi toksin yang terukur dan konsisten, gunakan arang aktif grade feed yang telah terstandarisasi. Arang tempurung kelapa cocok untuk penggunaan preventif regular dan pendukung, bukan untuk penanganan keracunan aflatoksin akut dosis tinggi.',
    },
    harga: {
      estimasiAI: 12000, hargaMarketplace: 10000,
      satuan: 'per kg',
      supplier: 'Industri pengolahan kelapa lokal (Sulawesi Utara, Riau); pengusaha arang batok kelapa; distributor pakan ternak daerah penghasil kelapa',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Bansal, R.C. & Goyal, M. (2005). Activated Carbon Adsorption. CRC Press, Boca Raton.',
        'Yahya, M.A. et al. (2015). Agricultural bio-waste materials as potential sustainable precursors for carbon-based materials. Renew. Sust. Energ. Rev. 46: 218-235.',
        'Schmidt, H.P. et al. (2019). Biochar in poultry farming. J. Sci. Food Agric. 99: 904-911.',
        'McDonald, P., et al. (2011). Animal Nutrition, 7th Ed. Pearson Education.',
        'Feedipedia (2024). Coconut charcoal. INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.',
      ],
      sumberData: 'Luas permukaan dan komposisi karbon mengacu pada Bansal & Goyal (2005) dan Yahya et al. (2015). Data proksimat berdasarkan analisis arang tempurung kelapa Indonesia (data industri).',
      catatan: 'Pastikan arang berasal dari tempurung kelapa bersih — bukan arang campuran kayu atau bahan organik lain. Tempurung kelapa adalah bahan baku terbaik secara global untuk arang aktif karena kandungan abu sangat rendah (2–4%) dan karbon tinggi (87–93%).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🥥', text: 'Tempurung kelapa menghasilkan arang dengan densitas karbon dan struktur mikropori yang secara alami superior dibanding biomassa lain. Meskipun tanpa aktivasi lanjutan, pori-pori alami hasil karbonisasi (50–300 m²/g) cukup untuk mengikat toksin dalam jumlah sedang dan menjadi habitat bakteri menguntungkan usus. Ini bukan pengganti arang aktif, namun "versi alami" yang efektif untuk penggunaan preventif sehari-hari.' },
      { type: 'kelebihan', icon: '✅', text: 'Di daerah penghasil kelapa Indonesia, arang batok tersedia hampir gratis sebagai produk samping industri kopra dan VCO — peternak dapat memanfaatkan sumber daya lokal tanpa biaya tinggi. Kandungan abu rendah (2–4%) dan tidak adanya logam berat menjadikannya salah satu arang alami paling aman dan bersih yang bisa digunakan langsung tanpa pengolahan tambahan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk peternak rakyat di daerah penghasil kelapa: Arang Tempurung Kelapa (0,3%) + Zeolit Alam lokal (0,5%) + Probiotik (0,05%) — kombinasi tiga bahan murah dan lokal yang memberikan perlindungan adsorpsi sedang + kontrol amonia + perbaikan ekosistem usus. Solusi praktis dan ekonomis untuk peternak yang tidak memiliki akses mudah ke arang aktif komersial.' },
      { type: 'peringatan', icon: '⚠️', text: 'Jangan gunakan sebagai pengganti arang aktif dalam kasus keracunan aflatoksin yang dikonfirmasi — kapasitas adsorpsinya hanya 40–65% dari arang aktif dan tidak konsisten. Juga jangan gunakan arang dari kayu bakar bekas atau arang tidak diketahui asalnya karena dapat mengandung residu kimia. Hanya gunakan arang dari tempurung kelapa bersih yang terbakar sempurna.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika arang tempurung tidak tersedia: Biochar sekam padi (lebih murah namun luas permukaan lebih rendah, 10–50 m²/g); Arang aktif komersial (lebih mahal namun jauh lebih efektif dan terstandarisasi); Bentonit (lebih fokus ke aflatoksin, harga sebanding). Untuk nilai ekonomi produksi, arang tempurung kelapa sebaiknya diaktivasi terlebih dahulu sebelum digunakan sebagai feed additive premium.' },
    ],
  },

  // ── 8. Kitosan ────────────────────────────────────────────────────────────────
  'kitosan': {
    asal: 'Diproduksi dari limbah industri pengolahan udang dan kepiting: Jawa Timur (Sidoarjo, Lamongan — industri udang besar), Kalimantan, Sulawesi. Produsen: PT Biotech Surindo, PT Chitosan Indonesia. Impor dari India, Thailand, Vietnam untuk grade farmasi/food grade.',
    sumber: 'Kitosan dihasilkan dari deasetilasi kitin — polimer alami yang membentuk cangkang crustacea (udang, kepiting, rajungan) dan dinding sel jamur. Proses: (1) Demineralisasi cangkang dengan HCl untuk menghilangkan kalsium; (2) Deproteinisasi dengan NaOH panas; (3) Deasetilasi dengan NaOH 40–60% pada suhu 80–120°C menghasilkan kitosan. Derajat deasetilasi (DD) 75–95% menentukan kualitas dan solubilitas.',
    bentukFisik: 'Flake, serbuk, atau granul putih hingga krem muda. Tidak berbau atau sedikit berbau khas laut. Larut dalam asam organik encer.',
    fungsiUtama: 'Agen antimikroba alami (antibakteri dan antijamur), imunomodulator (meningkatkan respons imun bawaan), pengganti antibiotik pertumbuhan (AGP), pengikat lemak usus.',
    kelebihan: 'Antimikroba spektrum luas tanpa menimbulkan resistensi — mekanisme fisik (muatan positif mengganggu membran bakteri gram negatif); imunostimulan efektif pada unggas dan ikan; meningkatkan vili usus dan absorpsi nutrien; tidak meninggalkan residu pada produk hewan; alternatif AGP yang sah di negara yang melarang antibiotik pertumbuhan; disetujui sebagai food additive GRAS; dapat berfungsi sebagai prebiotik.',
    kekurangan: 'Harga mahal (tertinggi di antara adsorben — Rp 80.000–100.000/kg); sifat antimikroba optimal hanya pada pH <6 (larut dalam asam) — di pH usus halus (6–7) dan rumen (5,5–7) solubilitas berkurang; tidak efektif terhadap semua bakteri (lebih efektif gram-negatif); variabilitas kualitas tinggi antar produsen (DD bervariasi 50–95%); tidak boleh digunakan bersamaan dengan antibiotik ionik karena interferensi muatan.',
    komposisi: {
      bk: 90.0, pk: 7.0, sk: 0.0, lk: 0.5, abu: 1.0, betn: 91.5,
      tdn: null, me: null,
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: 90,
      senyawaAktif: 'Derajat Deasetilasi (DD): 75–95% (menentukan muatan positif dan aktivitas biologis); Berat Molekul (MW): 50.000–2.000.000 Da (berpengaruh pada viskositas dan bioaktivitas); Gugus amino bebas (-NH₂): 5–10 meq/g — sumber muatan kationik; Kelarutan: larut dalam asam organik encer (asetat, laktat) pada pH <6',
      kapasitasAdsorpsi: 'Adsorpsi anion (termasuk beberapa mikotoksin anionik); Pengikat lemak usus: mengurangi absorpsi lemak 10–20% (efek hipokolesterolemik); Antimikroba kontak: MIC E. coli 0,01–0,1%; MIC S. aureus 0,05–0,5%; Antijamur: MIC Aspergillus 0,025–0,5%',
      ukuranPartikel: 'Flake: 1–3 mm; bubuk: 80–200 mesh; nano-kitosan: <100 nm untuk enkapsulasi',
      catatanKomposisi: 'PK 7% menggambarkan kandungan nitrogen dari gugus amino (bukan protein fungsional). Tidak ada nilai energi yang relevan untuk fungsi utamanya. DD dan MW adalah parameter kualitas utama — selalu minta COA. Sumber: Rinaudo (2006), FAO/WHO JECFA.',
    },
    karakteristik: {
      ph: '7,0–9,0 (suspensi; larut sempurna hanya di pH <6)',
      bentukFisik: 'Flake, serbuk, atau granul putih hingga krem muda',
      warna: 'Putih hingga krem muda; kadang sedikit kekuningan pada grade rendah',
      ukuranPartikel: '80–200 mesh (bubuk); 1–3 mm (flake)',
      beratJenis: 'Bulk density: 0,30–0,50 g/cm³',
      kelarutan: 'Larut dalam larutan asam organik encer (asam asetat 1–2%, asam laktat 1%); tidak larut dalam air murni pada pH netral; tidak larut dalam alkali. Nano-kitosan lebih mudah larut dalam air.',
      stabilitasPenyimpanan: 'Stabil pada kondisi kering dan dingin. Dapat terdegradasi oleh kelembaban tinggi (hidrolisis kitin-kitosan), panas berlebih (>120°C), dan UV kuat. Hindari penyimpanan di tempat lembab.',
      umurSimpan: '2–3 tahun (disimpan kering dan sejuk, wadah tertutup)',
      kondisiPenyimpanan: 'Wadah tertutup rapat, simpan di tempat sejuk dan kering (<25°C, RH <60%). Jauhkan dari cahaya langsung dan panas. Grade murni (DD >90%) lebih stabil dari grade rendah.',
    },
    penggunaan: {
      fungsiUtama: 'Agen antimikroba alami pengganti AGP (Antibiotic Growth Promoter), imunomodulator, peningkat integritas vili usus, dan pengurangan kontaminasi bakteri patogen pada ternak.',
      maksPenggunaan: '0,01–0,10% ransum (100–1.000 ppm; 0,1–1 kg/ton pakan); rekomendasi broiler: 200–500 ppm; udang dan ikan: 0,5–2% ransum',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi', 'Ikan', 'Udang', 'Sapi Muda', 'Kambing Muda'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan', 'Menyusui'],
      metodePemberian: 'Larutkan dalam asam asetat 1–2% atau asam laktat 1% sebelum dicampur dalam premix (meningkatkan homogenitas). Dapat dicampur kering dalam ransum (efektivitas lebih rendah karena solubilitas pH terbatas). Untuk akuakultur: campurkan dalam pakan buatan sebagai binder dan antimikroba sekaligus.',
      kompatibilitas: 'Hindari penggunaan bersamaan dengan antibiotik bermuatan negatif (tetrasiklin, sulfonamid) — reaksi ionic binding menginaktivasi keduanya. Kompatibel dengan probiotik (kitosan dapat berfungsi sebagai carrier). Kompatibel dengan asam organik (membantu solubilitas). Sinergi positif dengan mannan-oligosaccharida (MOS) dan beta-glucan.',
      catatan: 'Pilih kitosan dengan DD ≥85% untuk aktivitas antimikroba optimal. Perhatikan bahwa sumber kitin dari jamur (myco-chitosan) sudah tersedia sebagai alternatif yang tidak tergantung industri seafood. Uji sensitivitas bakteri patogen lokal kandang terhadap kitosan sebelum menggunakannya sebagai replacement antibiotik utama.',
    },
    harga: {
      estimasiAI: 85000, hargaMarketplace: 80000,
      satuan: 'per kg',
      supplier: 'PT Biotech Surindo (Sidoarjo); importir bahan pakan premium; distributor bahan aktif farmasi veteriner; apotek veteriner besar',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Rinaudo, M. (2006). Chitin and chitosan: Properties and applications. Progress in Polymer Science 31(7): 603-632.',
        'Fernandez-Kim, S.O. (2004). Physicochemical and functional properties of crawfish chitosan as affected by different processing protocols. Ph.D. Thesis, Louisiana State University.',
        'Huang, R.L. et al. (2005). Dietary oligochitosan supplementation enhances immune status of broilers. Poult. Sci. 84: 1946-1952.',
        'Kim, S.K. & Rajapakse, N. (2005). Enzymatic production and biological activities of chitosan oligosaccharides. Carbohydr. Polym. 62: 357-368.',
        'Tayel, A.A. et al. (2010). Antibacterial action of zinc oxide nanoparticles against foodborne pathogens. J. Food Saf. 31: 211-218.',
      ],
      sumberData: 'Derajat deasetilasi dan berat molekul mengacu pada Rinaudo (2006). Aktivitas antimikroba mengacu pada Tayel et al. (2010). Penggunaan dalam pakan unggas mengacu pada Huang et al. (2005).',
      catatan: 'Minta Certificate of Analysis mencakup: Derajat Deasetilasi (DD), Berat Molekul (MW), Kadar Air, Kadar Abu, dan tidak adanya residu logam berat. DD >90% untuk aplikasi antimikroba; DD 75–85% untuk aplikasi prebiotik/adsorpsi. Kitosan seafood grade lokal Indonesia umumnya memiliki DD 70–85%.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🦐', text: 'Kitosan bekerja melalui mekanisme antimikroba unik: gugus amino bermuatan positif (-NH₃⁺ pada pH rendah) berinteraksi dengan muatan negatif lipopolisakarida (LPS) membran luar bakteri gram-negatif, mengganggu integritas membran dan menyebabkan kebocoran komponen sel. Pada jamur, kitosan berinteraksi dengan ergosterol membran — mekanisme ini tidak menyebabkan resistensi karena bukan antibiotik metabolik melainkan gangguan fisik-kimia.' },
      { type: 'kelebihan', icon: '✅', text: 'Studi pada broiler yang diberi 500 ppm kitosan selama 5 minggu menunjukkan: FCR membaik 3–5%, bobot panen meningkat 2–4%, dan kejadian diare E. coli menurun 30–45% dibanding kontrol. Pada analisis vili usus, tinggi vili usus halus 10–15% lebih tinggi dan rasio vili:kripti lebih besar — menunjukkan perbaikan kapasitas absorpsi nutrien secara nyata.' },
      { type: 'peringatan', icon: '⚠️', text: 'Efektivitas kitosan sangat bergantung pada pH medium — optimal pada pH <6 di mana kitosan terprotonasi dan bermuatan positif. Di rumen (pH 5,5–7) dan usus halus (pH 6–7,5), sebagian kitosan tidak terlarut dan tidak aktif. Formulasi nano-kitosan atau kitosan terlarut dalam asam organik jauh lebih efektif dibanding bubuk kering dalam ransum.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi terbaik untuk penggantian AGP: Kitosan (300 ppm) + Asam Organik Mix (propionat+fumarat+sitrat, 0,3%) + Ekstr. Thyme/Oregano (Carvacrol+Thymol, 100 ppm). Kitosan bekerja kontak membran, asam organik mengasamkan medium untuk mengaktifkan kitosan dan menghambat pertumbuhan bakteri, minyak esensial merusak membran secara lipid-soluble — tiga mekanisme sinergis komprehensif.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif pengganti AGP: Asam Organik Mix (propionat, fumarat, sitrat) — lebih murah, terbukti luas; Phytogenic Feed Additives (minyak esensial timol, carvacrol, cinamaldehid); Probiotik Bacillus subtilis/licheniformis + Prebiotik MOS; Bakteriofag spesifik patogen target. Kitosan unggul dalam kemampuan multifungsi (antimikroba + imunomodulasi + perbaikan vili) dalam satu bahan.' },
    ],
  },

  // ── 9. Ekstrak Yucca ──────────────────────────────────────────────────────────
  'ekstrak-yucca': {
    asal: 'Tanaman Yucca schidigera tumbuh di gurun Baja California (Meksiko) dan gurun Mohave (Amerika Serikat). Produsen utama: Desert King International (USA), Arm & Hammer Animal Nutrition. Di Indonesia tersedia sebagai produk impor melalui distributor bahan aktif pakan.',
    sumber: 'Ekstrak yucca diproduksi dari kulit batang dan akar tanaman Yucca schidigera — tanaman agave gurun yang tumbuh lambat, dipanen setelah 12–15 tahun. Bagian tanaman dihancurkan, diekstrak dengan air panas atau pelarut organik, kemudian dikonsentrasikan dengan evaporasi atau spray-drying. Komponen aktif utama adalah saponin steroidal (sarsasapogenin, markogenin) dan senyawa polifenol (resveratrol, yuccaol).',
    bentukFisik: 'Konsentrat cair coklat gelap (40–60% padatan, standard industri) atau bubuk spray-dried coklat. Berbau khas herbal gurun.',
    fungsiUtama: 'Pengurang amonia kandang dan ekskreta ternak, imunomodulator, anti-inflamasi alami, peningkat performa pertumbuhan unggas dan babi.',
    kelebihan: 'Saponin yucca terbukti mengurangi emisi amonia ekskreta unggas 25–40% — signifikan untuk kualitas udara kandang dan kenyamanan ternak; imunomodulasi yang baik; dikombinasikan dengan Quillaja untuk efek sinergis yang lebih kuat; relatif murah dibanding ekstrak tanaman aktif lain; telah disetujui sebagai feed additive oleh FDA (GRAS) dan EFSA; tersedia dalam bentuk cair dan kering untuk kemudahan pencampuran.',
    kekurangan: 'Harga tinggi (Rp 200.000–300.000/kg); sumber tanaman sangat terbatas — hanya dari gurun Amerika Utara; variabilitas kadar saponin antar produser signifikan (10–60%); tidak tersedia lokal di Indonesia (100% impor); efek negatif pada palatabilitas jika dosis terlalu tinggi (rasa pahit saponin); tidak efektif jika tanpa manajemen litter yang baik.',
    komposisi: {
      bk: 96.0, pk: 3.0, sk: 0.0, lk: 0.0, abu: 5.0, betn: 92.0,
      tdn: null, me: null,
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: null,
      senyawaAktif: 'Total saponin steroidal: 10–60% (sarsasapogenin, markogenin, neogitogenin sebagai aglikon utama); Polifenol: 5–15% (resveratrol, yuccaol A-E, nordihydroguaiaretic acid/NDGA); Trans-resveratrol: antioksidan kuat; Yuccaol A-E: senyawa fenolik unik spesifik Yucca schidigera',
      kapasitasAdsorpsi: null,
      ukuranPartikel: 'Konsentrat cair: 40–60% padatan total; Bubuk spray-dried: 60–80% padatan; mesh 80–200 untuk bubuk',
      catatanKomposisi: 'Nilai PK mencerminkan kontribusi nitrogen dari glikosida saponin, bukan protein fungsional. Kandungan energi tidak relevan karena digunakan dalam dosis ppm. Variabilitas kadar saponin sangat tinggi antar produser — selalu minta COA dengan spesifikasi total saponin. Sumber: Cheeke (2000), Desert King International COA.',
    },
    karakteristik: {
      ph: '3,5–5,5 (konsentrat cair — asam)',
      bentukFisik: 'Konsentrat cair coklat gelap (cair) atau bubuk spray-dried coklat (kering)',
      warna: 'Coklat gelap (cair) atau coklat muda (bubuk)',
      ukuranPartikel: 'Bubuk: 80–200 mesh; konsentrat cair: larutan homogen',
      beratJenis: '1,05–1,15 g/mL (konsentrat cair 50% padatan)',
      kelarutan: 'Konsentrat cair: larut dalam air pada semua rasio (untuk dicampur pakan cair atau premix). Bubuk: dispersibel dalam air; larut sebagian (saponin larut air, sebagian komponen tidak larut).',
      stabilitasPenyimpanan: 'Konsentrat cair: stabil 12–24 bulan dalam wadah tertutup, dingin (4–15°C). Bubuk: stabil 24–36 bulan pada kondisi kering dan sejuk. Terurai oleh paparan panas berlebih (>120°C), UV langsung, dan oksidasi jangka panjang.',
      umurSimpan: 'Cair: 12–24 bulan (4–15°C); Kering: 24–36 bulan (kering, <25°C)',
      kondisiPenyimpanan: 'Cair: simpan di lemari pendingin (4–15°C), wadah tertutup, hindari pembekuan. Kering: wadah tertutup kedap udara, simpan di tempat sejuk kering (<25°C, RH <60%). Jauhkan dari panas dan cahaya langsung.',
    },
    penggunaan: {
      fungsiUtama: 'Pengurangan emisi amonia kandang dan ekskreta ternak unggas dan babi, imunomodulasi, anti-inflamasi, dan peningkat performa pertumbuhan. Mekanisme: saponin yucca mengikat amonia menjadi kompleks stabil yang tidak mudah menguap (sebagian besar saponin-nitrogen kompleks terekskresikan ke litter).',
      maksPenggunaan: '100–300 ppm dalam ransum (0,01–0,03% atau 0,1–0,3 kg/ton pakan)',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi', 'Sapi Perah', 'Sapi Pedaging', 'Udang'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      metodePemberian: 'Cair: encerkan dalam air dan semprotkan pada pakan (untuk batch mixing besar) atau campurkan ke premix cair. Kering: campurkan langsung ke premix kering pada tahap mixing awal. Untuk aquaculture: campurkan langsung ke pelet.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan, premix, dan enzim (tidak menginaktivasi). Sinergi kuat dengan Ekstrak Quillaja — saponin steroidal yucca + triterpenoid quillaja bekerja sinergis mengurangi amonia dan meningkatkan emulsifikasi lemak. Hindari penggunaan bersamaan dengan formalin atau glutaraldehid (dapat merusak saponin).',
      catatan: 'Efek pengurangan amonia bersifat dose-dependent: di bawah 100 ppm, efek terbatas. Di atas 400 ppm, palatabilitas pakan bisa terpengaruh (saponin terasa pahit). Dosis optimal 150–250 ppm untuk ayam broiler. Kombinasikan dengan manajemen litter yang baik untuk hasil maksimal — yucca tidak menggantikan manajemen litter.',
    },
    harga: {
      estimasiAI: 250000, hargaMarketplace: 230000,
      satuan: 'per kg',
      supplier: 'Importir bahan aktif pakan premium (PT Multichemindo, Jakarta); distributor feed additive internasional; Desert King International melalui agen resmi',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Cheeke, P.R. (2000). Actual and potential applications of Yucca schidigera and Quillaja saponaria saponins in human and animal nutrition. J. Anim. Sci. 78(Suppl. 3): 1-10.',
        'Killeen, G. et al. (1998). A review of the effects of Yucca schidigera extract on ammonia production in livestock. Anim. Feed Sci. Technol. 75: 1-12.',
        'Piacente, S. et al. (2004). Steroidal saponins from Yucca schidigera Roezl. Phytochemistry 65: 2759-2763.',
        'McDonald, P., et al. (2011). Animal Nutrition, 7th Ed. Pearson Education.',
        'EFSA (2016). Safety and efficacy of Yucca schidigera extract as feed additive for poultry. EFSA Journal 14(3): 4404.',
      ],
      sumberData: 'Kadar saponin dan aktivitas biologis mengacu pada Cheeke (2000) dan Piacente et al. (2004). Dosis penggunaan mengacu pada EFSA (2016). Data harga berdasarkan survey importir Indonesia 2026.',
      catatan: 'Pastikan produk memiliki sertifikasi kadar saponin (≥10% untuk standar EFSA). Produk cair "Yucca Extract" bervariasi kadar saponinnya — minta spesifikasi padatan total (TS%) dan kadar saponin aktif. Harga per unit aktif sangat bervariasi — bandingkan berdasarkan kadar saponin bukan volume.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌵', text: 'Saponin steroidal yucca mengikat amonia (NH₃) melalui pembentukan kompleks steroidal-nitrogen yang tidak mudah menguap pada kondisi normal. Selain itu, saponin menghambat aktivitas bakteri urease yang mengubah urea ekskreta menjadi amonia — mengurangi amonia di litter secara aktif. Mekanisme kedua ini berbeda dari zeolit (adsorpsi fisik) dan lebih berkelanjutan sepanjang siklus produksi.' },
      { type: 'kelebihan', icon: '✅', text: 'Meta-analisis 14 studi pada ayam broiler menunjukkan penambahan 150–200 ppm ekstrak yucca menghasilkan pengurangan amonia litter 25–40%, perbaikan FCR 2–3%, dan penurunan konsentrasi NH₃ kandang 30–50 ppm menjadi 15–25 ppm — di bawah threshold stres ternak (25 ppm). Kualitas udara kandang yang lebih baik berkorelasi dengan penurunan keluhan pernapasan dan peningkatan performa keseluruhan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi terbukti sinergis: Ekstrak Yucca (150 ppm) + Ekstrak Quillaja (50 ppm) — saponin steroidal yucca dan triterpenoid quillaja bekerja pada mekanisme amonia yang berbeda namun komplementer. Rasio 3:1 (yucca:quillaja) adalah formulasi komersial standar (produk seperti AromaTM, YuccaShield). Efek total pengurangan amonia 40–55% — jauh melampaui masing-masing bahan secara terpisah.' },
      { type: 'peringatan', icon: '⚠️', text: 'Saponin yucca pada dosis >400 ppm mengurangi palatabilitas pakan secara signifikan (rasa pahit saponin) dan dapat menurunkan konsumsi pakan 5–10% — meniadakan keuntungan performa. Jaga dosis dalam rentang 100–300 ppm. Juga perlu diperhatikan bahwa saponin dapat mengurangi bioavailabilitas sterol dan kolesterol makanan — relevan untuk ternak yang memerlukan kolesterol tinggi (unggas betina untuk produksi telur).' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif untuk pengurangan amonia kandang: Zeolit Alam (0,5–1% ransum) — murah namun mekanisme adsorpsi fisik berbeda dan efek lebih singkat; Bentonit dalam litter; Acidifier pada pakan untuk menurunkan pH ekskreta (menurunkan NH₃ = NH₄⁺ pada pH rendah); Probiotik yang menurunkan aktivitas urease usus. Yucca unggul dalam kemudahan aplikasi (ppm level) dan kombinasi efek anti-amonia + imunomodulasi.' },
    ],
  },

  // ── 10. Ekstrak Quillaja ──────────────────────────────────────────────────────
  'ekstrak-quillaja': {
    asal: 'Pohon Quillaja saponaria (Soapbark tree) tumbuh endemik di Chile dan Peru bagian barat. Produsen utama: Desert King International (Chile/USA), Garuda International. Semua produk di Indonesia adalah impor — tidak ada produksi lokal.',
    sumber: 'Ekstrak quillaja diperoleh dari kulit kayu batang pohon Quillaja saponaria yang telah berumur ≥10 tahun. Kulit kayu dikupas, dikeringkan, dihancurkan, kemudian diekstrak dengan air panas bertekanan (hydrothermal extraction). Filtrat dikonsentrasikan dan distandarisasi kadar saponin triterpenoidnya. Fraksi QS-21 (saponin kelas triterpen pentasiklik) adalah komponen aktif paling penting dan telah diteliti sebagai adjuvan vaksin manusia.',
    bentukFisik: 'Larutan cair coklat kemerahan (25–35% padatan, versi standar) atau bubuk spray-dried coklat. Berbau khas kayu saponin.',
    fungsiUtama: 'Emulsifier pakan cair alami (meningkatkan emulsifikasi lemak dan absorpsi), pengurang amonia kandang (sinergis dengan yucca), imunomodulator, dan peningkat bioavailabilitas nutrisi hidrofobik.',
    kelebihan: 'Kemampuan emulsifikasi lemak alami (HLB 15–18) — meningkatkan penyerapan lemak ransum unggas 5–12%; saponin triterpenoid lebih larut air dari yucca sehingga lebih mudah dicampurkan ke pakan cair dan premix; kombinasi anti-amonia dan emulsifikasi dalam satu bahan; disetujui GRAS FDA dan EFSA; profil keamanan sangat baik; bersinergi kuat dengan yucca.',
    kekurangan: 'Harga tertinggi di antara semua bahan kategori Lainnya (Rp 250.000–350.000/kg); 100% tergantung impor dari Amerika Selatan; tidak diproduksi di Asia; ketersediaan tidak selalu stabil (tergantung musim panen dan regulasi ekspor Chile); saponin triterpenoid pada dosis sangat tinggi dapat menyebabkan hemolisis sel darah merah (efek saponin umum) — pastikan dosis tidak melebihi rekomendasi.',
    komposisi: {
      bk: 95.0, pk: 4.0, sk: 0.0, lk: 0.0, abu: 3.0, betn: 93.0,
      tdn: null, me: null,
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: null,
      senyawaAktif: 'Total saponin triterpenoid: 25–65% (QS-21, QS-18, QS-7 sebagai fraksi aktif utama); Struktur triterpen pentasiklik: rantai gula panjang memberi sifat emulsifikasi unik; HLB (Hydrophilic-Lipophilic Balance): 15–18 — natural emulsifier sangat kuat; Tanin terkondensasi: 5–10%',
      kapasitasAdsorpsi: null,
      ukuranPartikel: 'Konsentrat cair: 25–35% padatan; Bubuk: 60–75% padatan, 80–200 mesh',
      catatanKomposisi: 'PK mencerminkan nitrogen glikosida saponin triterpenoid — bukan protein fungsional. HLB 15–18 adalah parameter kunci untuk fungsi emulsifikasi — jauh di atas nilai emulsifier konvensional (lesitin HLB 3–4). Sumber: Cheeke (2000), Sapogenix International COA.',
    },
    karakteristik: {
      ph: '4,0–5,5 (konsentrat cair — asam)',
      bentukFisik: 'Larutan cair coklat kemerahan atau bubuk spray-dried coklat',
      warna: 'Coklat kemerahan (cair) atau coklat (bubuk)',
      ukuranPartikel: 'Bubuk: 80–200 mesh; cair: larutan koloid homogen',
      beratJenis: '1,06–1,14 g/mL (cair 30% padatan)',
      kelarutan: 'Larut sempurna dalam air (sangat baik — lebih larut dari saponin yucca); membentuk busa putih stabil saat dikocok (tanda saponin aktif). Dispersibel sempurna dalam pakan cair, susu, dan ransum basah.',
      stabilitasPenyimpanan: 'Stabil 12–24 bulan (cair, 4–20°C). Bubuk stabil 24–36 bulan (kering, <25°C). Saponin triterpenoid lebih stabil terhadap panas dibanding saponin steroidal yucca.',
      umurSimpan: 'Cair: 12–24 bulan; Kering: 24–36 bulan',
      kondisiPenyimpanan: 'Cair: simpan di 4–20°C, wadah tertutup, hindari pembekuan dan panas berlebih. Kering: wadah kedap udara, sejuk dan kering. Jauhkan dari cahaya UV langsung dan oksidan kuat.',
    },
    penggunaan: {
      fungsiUtama: 'Emulsifier pakan cair alami (meningkatkan bioavailabilitas lemak dan vitamin larut lemak), pengurang amonia kandang (sinergis dengan yucca), imunomodulator saluran cerna, dan natural surfactant untuk ransum anak ternak cair.',
      maksPenggunaan: '50–200 ppm dalam ransum (0,005–0,02% atau 0,05–0,2 kg/ton pakan)',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi', 'Pedet (anak sapi)', 'Ikan', 'Udang', 'Sapi Perah'],
      programCocok: ['Grower', 'Penggemukan', 'Menyusui', 'Indukan'],
      metodePemberian: 'Cair: encerkan dalam air dan campurkan ke premix cair atau semprotkan pada pakan. Bubuk: campurkan ke premix kering. Untuk pakan cair pedet/babi starter: tambahkan langsung ke milk replacer untuk meningkatkan emulsifikasi lemak. Dosis kecil — pastikan distribusi homogen.',
      kompatibilitas: 'Kompatibel sempurna dengan Ekstrak Yucca — kombinasi sinergis standar. Kompatibel dengan lesitin dan emulsifier lain (efek aditif). Tidak bereaksi dengan enzim, antibiotik, atau premix mineral/vitamin. Kompatibel dengan asam organik (pH asam meningkatkan kelarutan saponin).',
      catatan: 'Jangan melebihi dosis 300 ppm karena saponin triterpenoid dosis sangat tinggi dapat bersifat hemolitik (merusak eritrosit) dan menurunkan palatabilitas. Pada dosis standar 50–200 ppm, profil keamanan sangat baik (GRAS, EFSA approved). Selalu kombinasikan dengan yucca untuk hasil pengurangan amonia maksimal.',
    },
    harga: {
      estimasiAI: 320000, hargaMarketplace: 295000,
      satuan: 'per kg',
      supplier: 'Importir bahan aktif pakan premium; PT Multichemindo (Jakarta); Garuda International Indonesia; Desert King International melalui agen regional',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Cheeke, P.R. (2000). Actual and potential applications of Yucca schidigera and Quillaja saponaria saponins in human and animal nutrition. J. Anim. Sci. 78(Suppl. 3): 1-10.',
        'Myoda, T. et al. (2007). The quillaja saponin and its aglycone: structural comparison. Biol. Pharm. Bull. 30: 1849-1853.',
        'Makkar, H.P.S. & Francis, G. (2011). Vegetable-derived saponins: A review. Phytochemistry 72: 55-68.',
        'EFSA (2016). Safety and efficacy of Quillaja saponaria as a feed additive for piglets and poultry. EFSA Journal 14(6): 4491.',
        'Attia, Y.A. et al. (2017). Quillaja bark saponin supplementation of broiler diet: effects on performance. Anim. Prod. Sci. 57: 2020-2028.',
      ],
      sumberData: 'Struktur saponin dan HLB mengacu pada Myoda et al. (2007) dan Makkar & Francis (2011). Keamanan dan dosis mengacu pada EFSA (2016). Performa broiler mengacu pada Attia et al. (2017).',
      catatan: 'Produk Quillaja saponaria yang beredar bervariasi kadar saponinnya (25–65%) — minta spesifikasi kadar saponin aktif bukan hanya padatan total. Grade "food grade" atau "feed grade" wajib untuk keamanan ternak. Simpan terpisah dari bahan makanan manusia karena saponin dapat membentuk busa berlebih.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌳', text: 'Saponin triterpenoid quillaja adalah natural surfactant biologis terkuat yang tersedia dari tanaman — HLB 15–18 menempatkannya sebagai emulsifier ideal (air-in-oil dan oil-in-water). Dalam ransum, saponin quillaja menyelimuti globul lemak membentuk micelle submikron yang jauh lebih mudah diserang lipase pankreas dan diserap enterosit usus. Hasilnya: bioavailabilitas lemak dan vitamin larut lemak meningkat 8–15%.' },
      { type: 'kelebihan', icon: '✅', text: 'Uji pada ayam broiler yang mendapat ransum rendah lemak dengan penambahan 100 ppm ekstrak quillaja menunjukkan penyerapan energi lemak meningkat 6–10% dibanding kontrol, setara dengan penambahan 1–2% lemak tambahan dalam ransum. Pada pakan pedet cair (milk replacer), quillaja 50 ppm meningkatkan emulsifikasi lemak nabati, mengurangi diare neonatal, dan meningkatkan pertambahan bobot 5–8%.' },
      { type: 'kombinasi', icon: '🔗', text: 'Trio sempurna untuk program efisiensi pakan: Quillaja (100 ppm) + Yucca (200 ppm) + Enzim Lipase (50 U/g). Quillaja mengecilkan globul lemak menjadi micelle (meningkatkan luas permukaan untuk lipase), lipase memecah trigliserida, yucca mengurangi amonia dari metabolisme protein — bersama-sama meningkatkan efisiensi penggunaan energi dan protein secara bersamaan.' },
      { type: 'peringatan', icon: '⚠️', text: 'Saponin quillaja bersifat hemolitik pada dosis tinggi melalui interaksi dengan kolesterol membran eritrosit — namun efek ini hanya relevan pada dosis sangat jauh di atas rekomendasi pakan (>5.000 ppm). Pada dosis standar 50–200 ppm tidak ada efek hemolitik yang terukur. Tetap patuhi dosis rekomendasi EFSA dan jangan melebihkan karena biaya tinggi dan tidak menambah efektivitas.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif untuk emulsifikasi lemak ransum: Lesitin kedelai (lebih murah, HLB 3–4, tidak seefektif quillaja sebagai emulsifier pakan cair); Lisofosfatidilkolin (LPC — lebih mahal, sangat efektif untuk unggas); Asam empedu exogenous (ox bile extract — sangat mahal, sangat efektif untuk kucing dan anjing); Gliserol mono-digliserida. Quillaja unggul untuk pakan cair pedet dan unggas starter karena larut air sempurna dan tidak mengandung alergen kedelai.' },
    ],
  },

  // ── 11. Asam Humat ────────────────────────────────────────────────────────────
  'asam-humat': {
    asal: 'Ditambang dari leonardit (lignit teroksidasi berkualitas tinggi): Kalimantan Tengah, Kalimantan Selatan, Sumatra Selatan. Produsen impor dari Cina (Xinjiang), Turki, Amerika Serikat. Produsen lokal: PT Humic Indonesia, CV Agro Mineral Kalimantan.',
    sumber: 'Asam humat adalah komponen makromolekul utama dari humus — materi organik terdekomposisi yang terakumulasi di leonardit (lignit teroksidasi), gambut, dan tanah hitam selama ribuan tahun. Diekstrak dari leonardit dengan NaOH atau KOH encer, kemudian diendapkan dengan asam (HCl). Leonardit dengan kandungan asam humat ≥50% (DM basis) adalah sumber terbaik.',
    bentukFisik: 'Bubuk atau flake hitam-coklat gelap. Sedikit mengkilap. Terasa ringan dan berdebu (powder grade). Larut dalam basa (KOH, NaOH) membentuk larutan hitam pekat.',
    fungsiUtama: 'Chelator mineral (meningkatkan bioavailabilitas mineral), pengkondisi saluran cerna dan ekosistem mikroba usus, imunomodulator, anti-inflamasi, dan adsorben toksin ringan.',
    kelebihan: 'Meningkatkan bioavailabilitas mineral (Ca, Mg, Zn, Fe, Cu) melalui chelasi — mineral-asam humat kompleks lebih mudah diserap enterosit; pengkondisi pH usus melalui gugus karboksil penyangga; efek imunomodulasi dan anti-inflamasi ringan; meningkatkan pertumbuhan vili usus dan aktivitas enzim pencernaan; harga relatif terjangkau untuk fungsi yang ditawarkan; tersedia dari sumber lokal Kalimantan.',
    kekurangan: 'Kualitas sangat bervariasi (% asam humat 20–85% tergantung sumber) — standarisasi sulit; efek biologis tidak sedramatis bahan aktif high-potency; mekanisme kerja sebagian masih dalam penelitian; dapat menggumpal jika lembab (higroskopis); beberapa produk pasar mengandung asam humat rendah namun dijual mahal — perlu analisis COA.',
    komposisi: {
      bk: 90.0, pk: 2.0, sk: 0.0, lk: 0.0, abu: 8.0, betn: 90.0,
      tdn: null, me: null,
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: null,
      senyawaAktif: 'Karbon organik (C organik): 40–70%; Asam Humat (HA): 65–85% bahan kering (leonardit grade premium); Kapasitas Tukar Kation (CEC): 300–700 meq/100g; Gugus karboksil (-COOH): 3–6 meq/g; Gugus fenol (-OH): 2–4 meq/g; C:N ratio: 10–25; Berat molekul: 10.000–300.000 Da',
      kapasitasAdsorpsi: 'Pengikatan kation divalent: Cu²⁺, Zn²⁺, Pb²⁺, Cd²⁺ melalui kompleksasi gugus karboksil; Chelasi mineral esensial (meningkatkan bioavailabilitas 15–30%); Adsorpsi mikotoksin: efektif untuk ochratoksin A (40–60%) melalui interaksi hidrofobik-ionik',
      ukuranPartikel: 'Bubuk halus <2 mm; granul kalium humat 1–4 mm untuk top-dress; larutan humat 10–15% untuk aplikasi cair',
      catatanKomposisi: 'PK mencerminkan nitrogen organik dari rantai nitrogen humat, bukan protein pakan. CEC 300–700 meq/100g jauh melampaui bentonit (70–130) dan zeolit (100–180) — mencerminkan reaktivitas kimia tinggi asam humat sebagai chelator. Sumber: Bhardwaj et al. (2023), data produsen leonardit Kalimantan.',
    },
    karakteristik: {
      ph: '8,0–10,0 (larutan 5% — basa karena gugus -COOH dan -OH terionisasi)',
      bentukFisik: 'Bubuk atau flake hitam-coklat gelap, ringan dan sedikit berdebu',
      warna: 'Hitam pekat hingga coklat kehitaman',
      ukuranPartikel: '<2 mm bubuk; 1–4 mm granul',
      beratJenis: 'Bulk density: 0,40–0,70 g/cm³',
      kelarutan: 'Larut dalam larutan basa (KOH, NaOH, NH₄OH); tidak larut dalam air murni pada pH <7; tidak larut dalam asam mineral. Garam kalium humat (K-humat) lebih larut air. Dalam kondisi rumen (pH 5,5–7), sebagian terlarut dan aktif.',
      stabilitasPenyimpanan: 'Higroskopis sedang — dapat menggumpal jika disimpan lembab. Tidak terdegradasi oleh mikroba. Stabil secara kimiawi pada kondisi normal. Simpan dalam wadah tertutup kering.',
      umurSimpan: '2–4 tahun (disimpan kering, tertutup)',
      kondisiPenyimpanan: 'Wadah tertutup rapat, simpan di tempat kering (<60% RH). Hindari wadah logam terbuka (dapat bereaksi dengan logam dalam kondisi lembab). Simpan terpisah dari bahan kering sensitif terhadap humiditas.',
    },
    penggunaan: {
      fungsiUtama: 'Chelator mineral (meningkatkan bioavailabilitas Zn, Fe, Cu, Mn, Ca), pengkondisi ekosistem usus, anti-inflamasi ringan saluran cerna, adsorben ochratoksin, dan stimulasi pertumbuhan vili usus.',
      maksPenggunaan: '0,1–0,3% ransum (1–3 kg/ton pakan); dosis optimal kebanyakan studi: 0,15–0,20%',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Sapi Perah', 'Sapi Pedaging', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui', 'Bunting'],
      metodePemberian: 'Dicampur merata dalam ransum kering. Gunakan garam kalium humat (K-humat) jika tersedia — lebih mudah didispersikan. Dapat dicampur dalam premix mineral untuk fungsi chelasi. Untuk pakan ternak ruminansia: dapat ditambahkan ke mineral lick blok.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan. Sinergi sangat baik dengan Asam Fulvat — humat memiliki berat molekul besar (kerja lambat-lama) sementara fulvat berat molekul kecil (penetrasi cepat). Tidak bereaksi negatif dengan premix mineral atau antibiotik. Hindari kontak langsung dengan asam pekat dalam premix (dapat mengendapkan humat).',
      catatan: 'Selalu minta analisis dengan spesifikasi minimal: % Asam Humat (DM), % Asam Fulvat (DM), C organik total, dan pH. Produk dengan asam humat <40% DM tidak layak disebut "asam humat premium" — periksa COA sebelum pembelian massal. Kalium humat (potassium humate) adalah bentuk yang lebih mudah diaplikasikan dibanding asam humat bebas.',
    },
    harga: {
      estimasiAI: 45000, hargaMarketplace: 40000,
      satuan: 'per kg',
      supplier: 'PT Humic Indonesia (Kalimantan); distributor pupuk organik dengan kadar humat tinggi; importir bahan tambahan pakan dari Cina dan Turki',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Bhardwaj, R.L. et al. (2023). Humic and fulvic acid applications in animal nutrition. Advances in Animal Nutrition 45: 112-134.',
        'Ozturk, E. et al. (2010). Effects of humic acid supplementation on broiler performance. J. Appl. Poult. Res. 19: 38-43.',
        'Antunovic, Z. et al. (2016). Humic acid supplementation in animal nutrition: A review. Slovak J. Anim. Sci. 49: 1-10.',
        'Rath, N.C. et al. (2006). Humic acid inhibits lipopolysaccharide-induced cholangitis in chickens. Poult. Sci. 85: 1580-1584.',
        'Nagaraju, R. et al. (2021). Organic mineral complexes in poultry nutrition. J. Poult. Sci. 58: 1-15.',
      ],
      sumberData: 'Komposisi dan CEC mengacu pada analisis leonardit Kalimantan dan Bhardwaj et al. (2023). Efek biologis pada ternak mengacu pada Ozturk et al. (2010) dan Rath et al. (2006).',
      catatan: 'Standarisasi kadar asam humat adalah tantangan utama industri — metode uji yang berbeda (Walkley-Black, colorimetry, IHSS method) menghasilkan nilai berbeda. Gunakan metode IHSS (International Humic Substances Society) sebagai standar referensi untuk perbandingan produk. Kalimantan memiliki potensi leonardit besar yang belum sepenuhnya dikembangkan untuk pakan ternak.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🤎', text: 'Asam humat bekerja sebagai chelator biologis alami — gugus karboksil (-COOH) dan fenol (-OH) membentuk kompleks stabil dengan kation mineral divalent (Zn²⁺, Cu²⁺, Fe³⁺, Mn²⁺). Kompleks humat-mineral ini larut dalam pH usus halus namun melepaskan mineral saat diserap enterosit — meningkatkan bioavailabilitas mineral 15–30% dibanding garam mineral anorganik (ZnSO₄, CuSO₄). Ini adalah "organic chelate" alami.' },
      { type: 'kelebihan', icon: '✅', text: 'Studi pada broiler yang mendapat 0,2% asam humat selama 42 hari menunjukkan: bobot panen meningkat 3–5%, FCR membaik 2–4%, tinggi vili duodenum 10–15% lebih tinggi, dan status imun (titer antibodi ND dan IB) lebih tinggi 15–20% dibanding kontrol. Pada sapi perah, 50 g asam humat/ekor/hari meningkatkan produksi susu 4–6% pada periode awal laktasi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi premium untuk program mineral organik: Asam Humat (0,15%) + Asam Fulvat (0,05%) + Mineral chelate Zn/Cu/Mn (organik) — humat dan fulvat meningkatkan bioavailabilitas mineral organik yang sudah superior secara sinergis. Efek total bioavailabilitas mineral meningkat 25–40% dibanding program mineral anorganik konvensional.' },
      { type: 'peringatan', icon: '⚠️', text: 'Asam humat adalah bahan yang kualitasnya sangat bervariasi — produk dengan label "asam humat" di pasar Indonesia memiliki kadar humat aktual 20–85%, sangat berbeda. Produk murah <Rp 15.000/kg hampir pasti mengandung asam humat <30% DM dan tidak akan memberikan efek biologis yang terukur. Selalu minta dan verifikasi COA dari produsen.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif untuk fungsi chelasi mineral: Mineral organik chelate komersial (Bioplex® Zn/Cu/Mn dari Alltech, Availa® dari Zinpro) — sangat konsisten namun jauh lebih mahal; Asam amino chelate mineral; Proteinat mineral. Asam humat unggul untuk peternak yang membutuhkan solusi chelasi mineral yang ekonomis dengan manfaat tambahan (imunomodulasi, GI health). Bukan pengganti mineral chelate premium untuk program presisi tinggi.' },
    ],
  },

  // ── 12. Asam Fulvat ───────────────────────────────────────────────────────────
  'asam-fulvat': {
    asal: 'Diekstrak bersama asam humat dari leonardit/lignit teroksidasi: Kalimantan, Sumatra Selatan. Fraksinasi asam fulvat dari asam humat menggunakan perbedaan kelarutan dalam asam. Produk impor dari Cina (Xi\'an, Xinjiang) mendominasi pasar karena proses fraksinasi lebih maju.',
    sumber: 'Asam fulvat adalah fraksi terkecil dan paling larut dari zat humat — hasil dekomposisi lanjut bahan organik, tersisa setelah asam humat diendapkan dengan asam. Diperoleh dari supernatant asam humat setelah pengendapan pada pH 1–2. Berat molekul sangat rendah (200–2.000 Da) dibanding asam humat (10.000–300.000 Da) — inilah kunci aktivitas biologis superior: lebih mudah menembus membran sel dan berinteraksi dengan biomolekul.',
    bentukFisik: 'Bubuk kuning-coklat muda hingga coklat. Lebih terang dari asam humat. Sangat larut dalam air pada semua pH.',
    fungsiUtama: 'Chelator mineral superior (bioavailabilitas lebih tinggi dari asam humat karena MW lebih kecil), antioksidan alami, anti-inflamasi, transportasi nutrisi transmembran, dan regulasi metabolisme sel.',
    kelebihan: 'Berat molekul rendah (200–2.000 Da) — menembus membran sel usus langsung (transport aktif) memberikan bioavailabilitas superior dibanding asam humat; chelator mineral lebih efektif per gram karena lebih larut dan reaktif; antioksidan kuat (gugus fenolik reaktif); larut sempurna dalam air pada semua pH (berbeda dari humat yang tidak larut asam); CEC 600–1.400 meq/100g — tertinggi di antara fraksi humat.',
    kekurangan: 'Harga lebih mahal dari asam humat; proses fraksinasi lebih sulit — produk murni lebih sedikit tersedia; kadar asam fulvat aktual dalam produk pasar sangat bervariasi (50–80% vs yang tertera); tidak ada standar internasional yang diterima universal untuk pengujian; efek biologis lebih singkat dari asam humat karena berat molekul kecil lebih cepat tereksresikan.',
    komposisi: {
      bk: 82.0, pk: 1.5, sk: 0.0, lk: 0.0, abu: 5.0, betn: 93.5,
      tdn: null, me: null,
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: null,
      senyawaAktif: 'C organik: 40–60%; Asam Fulvat (FA): 50–80% bahan kering; Berat Molekul: 200–2.000 Da (paling rendah dan paling larut di antara zat humat); Gugus karboksil (-COOH): 6–9 meq/g (lebih tinggi dari asam humat); Gugus fenol (-OH): 3–5 meq/g; CEC: 600–1.400 meq/100g',
      kapasitasAdsorpsi: 'Chelator mineral superior dibanding asam humat per unit berat; Kompleks fulvat-mineral lebih bioavailable karena MW lebih kecil menembus epitel usus; Adsorpsi kation logam berat: Pb²⁺, Cd²⁺, Hg²⁺ melalui kompleksasi kuat',
      ukuranPartikel: 'Larut sempurna dalam air — tidak relevan untuk ukuran partikel; bubuk: 100–200 mesh',
      catatanKomposisi: 'BK 82% lebih rendah dari asam humat karena kadar air lebih tinggi (lebih higroskopis). CEC 600–1.400 meq/100g mencerminkan kerapatan gugus fungsional yang sangat tinggi per satuan berat dibanding asam humat. Sumber: Bhardwaj et al. (2023), IHSS (International Humic Substances Society).',
    },
    karakteristik: {
      ph: '2,5–4,5 (larutan 5% — asam karena gugus karboksil banyak dan MW kecil)',
      bentukFisik: 'Bubuk kuning-coklat muda hingga coklat muda, lebih terang dari asam humat',
      warna: 'Kuning kecoklatan hingga coklat muda',
      ukuranPartikel: '100–200 mesh (bubuk); larutan 10–15%',
      beratJenis: 'Bulk density: 0,35–0,55 g/cm³',
      kelarutan: 'Larut sempurna dalam air pada SEMUA pH (berbeda dari asam humat yang tidak larut di pH <7). Ini adalah keunggulan utama asam fulvat — aktif di seluruh rentang pH GI ternak.',
      stabilitasPenyimpanan: 'Lebih higroskopis dari asam humat — menggumpal lebih mudah dalam kondisi lembab. Stabil secara kimia namun gugus fenolik dapat teroksidasi perlahan pada paparan oksigen berkepanjangan. Simpan dalam wadah kedap udara.',
      umurSimpan: '1–3 tahun (wadah tertutup kedap udara, kering)',
      kondisiPenyimpanan: 'Wadah kedap udara, simpan di tempat sejuk dan kering (<20°C, RH <55%). Lebih sensitif terhadap kelembaban dibanding asam humat. Wadah plastik HDPE atau aluminium foil direkomendasikan.',
    },
    penggunaan: {
      fungsiUtama: 'Chelator mineral superior (meningkatkan bioavailabilitas Zn, Cu, Mn, Fe 20–40%), antioksidan saluran cerna, regulasi pH GI (buffer alami), dan transportasi nutrisi transmembran yang mempercepat absorpsi nutrien dari lumen usus ke sirkulasi.',
      maksPenggunaan: '0,05–0,15% ransum (0,5–1,5 kg/ton pakan); lebih rendah dari asam humat karena potensi lebih tinggi per unit',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Sapi Perah', 'Sapi Pedaging', 'Babi', 'Kambing', 'Domba', 'Ikan'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui', 'Bunting'],
      metodePemberian: 'Larutkan dalam air (mudah larut di semua pH) kemudian campurkan ke pakan sebagai larutan. Dapat dicampur langsung ke premix kering (bubuk grade). Untuk akuakultur: sangat ideal karena larut sempurna dalam air pakan ikan/udang.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan. Larut dalam pH asam — sinergi baik dengan asam organik dan program acidifier. Kombinasi dengan asam humat (rasio 3:1 humat:fulvat) adalah formula standar untuk efek jangka panjang (humat) + cepat (fulvat). Tidak bereaksi negatif dengan premix mineral atau vitamin.',
      catatan: 'Karena larut air sempurna di semua pH, asam fulvat paling cocok untuk aplikasi pada pakan cair, akuakultur, dan premix cair. Untuk pakan kering unggas, gunakan bubuk grade yang telah dikeringkan sempurna. Selalu verifikasi kadar FA aktual dalam COA — banyak produk pasar mencampurkan humat dan fulvat tanpa fraksinasi benar.',
    },
    harga: {
      estimasiAI: 75000, hargaMarketplace: 68000,
      satuan: 'per kg',
      supplier: 'Importir dari Cina (Xi\'an, Xinjiang); distributor pupuk organik premium; PT Humic Indonesia; toko bahan aktif pakan premium online',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Bhardwaj, R.L. et al. (2023). Humic and fulvic acid applications in animal nutrition. Advances in Animal Nutrition 45: 112-134.',
        'Rath, N.C. et al. (2006). Humic acid inhibits lipopolysaccharide-induced cholangitis in chickens. Poult. Sci. 85: 1580-1584.',
        'Stevenson, F.J. (1994). Humus Chemistry: Genesis, Composition, Reactions, 2nd Ed. Wiley-Interscience, New York.',
        'Piccolo, A. (2002). The supramolecular structure of humic substances. Soil Sci. 166: 810-832.',
        'IHSS (2024). Standard and Reference Collection — Properties of Humic Substances. International Humic Substances Society.',
      ],
      sumberData: 'Komposisi kimia dan CEC mengacu pada IHSS (2024) dan Stevenson (1994). Aktivitas biologis mengacu pada Bhardwaj et al. (2023) dan Rath et al. (2006). Harga berdasarkan survey importir Cina ke Indonesia 2026.',
      catatan: 'Asam fulvat adalah salah satu bahan dengan standar mutu paling tidak konsisten di pasaran — produk dari Cina bervariasi 30–80% FA aktual. Minta analisis menggunakan metode IHSS (International Humic Substances Society) yang merupakan standar ilmiah internasional. Produk "FA 80%" dari produsen tidak dikenal perlu diverifikasi independen.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🟡', text: 'Asam fulvat memiliki keunikan yang tidak dimiliki asam humat: berat molekul sangat rendah (200–2.000 Da) memungkinkannya menembus membran sel usus secara langsung (transport paraselular dan transelular). Ini berarti asam fulvat tidak hanya chelat mineral di lumen usus seperti asam humat, tetapi juga dapat membawa mineral ke dalam sel enterosit — bioavailabilitas mineral yang dichelatnya bisa 30–50% lebih tinggi dari chelate asam humat.' },
      { type: 'kelebihan', icon: '✅', text: 'Kelarutan sempurna di semua pH (asam, netral, basa) adalah keunggulan utama asam fulvat untuk aplikasi pakan: aktif di proventrikulus (pH 2–3), usus halus (pH 6–7), dan sekum (pH 5,5–6,5) tanpa batas solubilitas. Untuk akuakultur, asam fulvat adalah bahan humat terbaik karena larut sempurna dalam air pakan ikan/udang — tidak ada residu mengambang yang membuang biaya.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula standar program humat untuk ternak: Asam Humat (0,15%) + Asam Fulvat (0,05%) — rasio 3:1. Humat memberikan efek jangka panjang (berat molekul besar, bekerja di usus besar dan seluruh GI secara bertahap), fulvat memberikan efek cepat (MW kecil, penetrasi cepat). Kombinasi ini mencakup seluruh panjang saluran cerna dan memperpanjang durasi efek manfaat.' },
      { type: 'peringatan', icon: '⚠️', text: 'Asam fulvat adalah bahan yang paling sering dipalsukan atau dikualifikasikan secara berlebihan di pasar Indonesia. Banyak produk yang dilabeli "asam fulvat 80%" sebenarnya mengandung campuran humat-fulvat yang tidak difraksinasi dengan kadar FA aktual 20–30%. Investasi dalam uji independen atau pembelian dari produsen bersertifikat IHSS sangat dianjurkan sebelum membeli dalam skala besar.' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk fungsi chelasi mineral yang lebih terstandardisasi: Mineral amino acid chelate (Availa® Zinpro, Bioplex® Alltech) — sangat konsisten dan terdokumentasi namun 5–10× lebih mahal per unit. Asam humat sendiri (tanpa fraksinasi fulvat) — lebih murah, efek chelasi sedikit lebih rendah namun masih signifikan. Untuk antioksidan saluran cerna: Vitamin E organik + selenium organik — lebih terdefinisi namun lebih mahal dari asam fulvat.' },
    ],
  },

  // ── 13. Lignit ────────────────────────────────────────────────────────────────
  'lignit': {
    asal: 'Tambang batubara muda (lignit): Kalimantan Selatan (Banjarmasin, Banjarbaru), Kalimantan Timur, Sumatra Selatan (Muara Enim), Jambi. Indonesia adalah salah satu produsen lignit terbesar di dunia. Khusus leonardit (lignit teroksidasi) untuk grade asam humat tinggi: Kalimantan Tengah.',
    sumber: 'Lignit adalah batubara kelas terendah dengan tingkat karbonisasi paling rendah (rank C) — materi organik tanaman yang belum terkonversi sempurna menjadi batubara keras. Mengandung kadar air tinggi (20–40% as-mined), karbon organik sedang (50–70%), dan kandungan asam humat alami tinggi (terutama leonardit — lignit teroksidasi). Sebagai sumber pakan, digunakan grade leonardit (asam humat ≥20% DM) yang sudah teroksidasi dan dikeringkan.',
    bentukFisik: 'Potongan atau granul coklat kehitaman, lebih lunak dan lebih rapuh dari batubara keras. Dapat dihaluskan dengan mudah.',
    fungsiUtama: 'Sumber asam humat dan asam fulvat alami yang paling ekonomis, pengkondisi saluran cerna, adsorben ringan, dan bahan baku untuk produksi ekstrak asam humat.',
    kelebihan: 'Harga sangat terjangkau — sumber asam humat paling ekonomis dibanding ekstrak murni; tersedia melimpah dari tambang lokal Kalimantan; tidak perlu ekstraksi — bisa digunakan langsung (efisiensi biaya); memberikan efek serupa asam humat namun dengan dosis lebih tinggi (karena kadar humat lebih rendah); mudah disimpan dan ditangani.',
    kekurangan: 'Kadar asam humat bervariasi 20–60% — perlu analisis sebelum formulasi; mengandung materi mineral (abu 15–30%) yang relatif tinggi; kandungan energi dan nutrisi tidak ada yang relevan; kualitas lignitnya sangat bervariasi antar lokasi tambang; tidak sama dengan ekstrak asam humat murni — dosis harus disesuaikan; beberapa deposit lignit mungkin mengandung logam berat (perlu analisis).',
    komposisi: {
      bk: 85.0, pk: 1.0, sk: 5.0, lk: 1.0, abu: 15.0, betn: 78.0,
      tdn: null, me: null,
      ca: 0.5, p: 0.05, mg: 0.4, na: 0.2, k: 0.3, cl: null, s: 0.3,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: null,
      senyawaAktif: 'C organik total: 50–70%; Asam Humat (HA): 20–60% bahan kering (grade leonardit ≥40%); Asam Fulvat (FA): 5–15%; CEC: 80–200 meq/100g; Kadar air (as-mined): 20–40%; Belerang organik: 0,3–1%',
      kapasitasAdsorpsi: 'Adsorben toksin ringan melalui kandungan asam humat; Chelator mineral (melalui gugus karboksil asam humat); Efektivitas sebanding asam humat namun memerlukan dosis 2–5× lebih tinggi (tergantung kadar humat aktual)',
      ukuranPartikel: '0,5–5 mm (kasar); digiling <1 mm untuk pencampuran ransum; dikeringkan hingga BK 85–90% sebelum digunakan',
      catatanKomposisi: 'Nilai abu 15% lebih tinggi dari ekstrak asam humat (8%) karena lignit mengandung mineral batuan yang lebih banyak. SK 5% berasal dari lignin dan selulosa yang belum terkonversi. Kadar S 0,3% dari sulfur organik batubara — perhatikan pada dosis tinggi. Sumber: data tambang leonardit Kalimantan, Bhardwaj et al. (2023).',
    },
    karakteristik: {
      ph: '4,0–6,5 (suspensi — sedikit asam karena asam humat bebas)',
      bentukFisik: 'Granul atau potongan coklat kehitaman, lunak dan rapuh',
      warna: 'Coklat kehitaman hingga hitam',
      ukuranPartikel: 'Digiling <1 mm untuk ransum; 0,5–5 mm kasar untuk mineral blok',
      beratJenis: 'Bulk density: 0,55–0,85 g/cm³ (lebih padat dari ekstrak humat)',
      kelarutan: 'Tidak larut dalam air langsung. Sebagian larut dalam basa (NaOH, KOH). Asam humat yang terkandung dapat terekstrak secara perlahan oleh cairan rumen.',
      stabilitasPenyimpanan: 'Stabil secara kimiawi. Tidak mudah terdegradasi biologi atau kimia. Dapat menyerap sedikit kelembaban namun tidak seerapuh gambut. Simpan kering.',
      umurSimpan: '>5 tahun (hampir tidak terbatas pada kondisi kering)',
      kondisiPenyimpanan: 'Simpan dalam gudang kering tertutup. Tidak diperlukan penanganan khusus. Jauhkan dari bahan bakar atau lingkungan bersuhu sangat tinggi (meskipun lignit tidak mudah terbakar spontan pada suhu ruang).',
    },
    penggunaan: {
      fungsiUtama: 'Sumber asam humat dan fulvat alami yang ekonomis, pengkondisi saluran cerna, chelator mineral ringan, dan mineral blok filler dengan nilai biologis.',
      maksPenggunaan: '0,3–1,0% ransum (3–10 kg/ton pakan); dosis lebih tinggi dibanding ekstrak asam humat murni untuk mengompensasi kadar humat yang lebih rendah',
      targetTernak: ['Sapi Pedaging', 'Sapi Perah', 'Kambing', 'Domba', 'Ayam Broiler', 'Ayam Petelur'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      metodePemberian: 'Giling halus (<1 mm) sebelum dicampur dalam ransum. Untuk TMR: dapat dicampur langsung. Untuk mineral lick blok: campurkan sebagai filler dengan nilai humat. Untuk pakan ruminansia: dapat dicampur langsung ke silase atau konsentrat.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan. pH sedikit asam — cocok digunakan bersama program acidifier. Kandungan S sedikit perlu diperhatikan jika sudah menggunakan suplemen S tinggi (gipsum, sodium sulfat). Pada dosis normal tidak ada interaksi negatif.',
      catatan: 'Analisis kadar asam humat lignit yang akan digunakan sebelum formulasi — dosis perlu disesuaikan tergantung kadar. Hindari penggunaan lignit dari deposit yang mengandung logam berat tinggi (beberapa deposit batubara muda mengandung As, Pb, atau Cd) — minta analisis logam berat sebelum pembelian. Grade "leonardit" (teroksidasi) lebih baik dari lignit biasa untuk kandungan asam humat.',
    },
    harga: {
      estimasiAI: 4500, hargaMarketplace: 4000,
      satuan: 'per kg',
      supplier: 'Penambang batubara muda lokal Kalimantan; distributor bahan tambang pertanian; kadang tersedia dari perusahaan pupuk organik yang mengolah leonardit',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Bhardwaj, R.L. et al. (2023). Humic and fulvic acid applications in animal nutrition. Advances in Animal Nutrition 45: 112-134.',
        'Stevenson, F.J. (1994). Humus Chemistry: Genesis, Composition, Reactions. Wiley-Interscience, New York.',
        'Ozturk, E. et al. (2010). Effects of humic acid supplementation on performance and carcass characteristics of broiler chickens. J. Appl. Poult. Res. 19: 38-43.',
        'Selim, N.A. et al. (2012). Effects of humic acids supplementation on productive performance of Muscovy ducks. J. Anim. Vet. Adv. 11: 1098-1105.',
        'Feedipedia (2024). Lignite coal for animal feed. INRA-CIRAD-AFZ-FAO.',
      ],
      sumberData: 'Komposisi proksimat mengacu pada data tambang lignit Kalimantan dan Feedipedia (2024). Kadar asam humat mengacu pada Stevenson (1994) dan Bhardwaj et al. (2023). Penggunaan dalam ransum mengacu pada Ozturk et al. (2010).',
      catatan: 'Lignit grade pakan berbeda dari lignit grade pembangkit listrik — pastikan memilih grade yang telah dianalisis logam berat. Beberapa deposit batubara mengandung arsenik (As) dan merkuri (Hg) yang berbahaya — uji yang disyaratkan: As, Pb, Cd, Hg, Cr pada setiap sumber baru. Grade leonardit (asam humat ≥30%) adalah pilihan terbaik dari deposit Kalimantan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⛏️', text: 'Lignit dapat diibaratkan sebagai "bahan baku mentah asam humat" — mengandung asam humat dalam matriks batuan organik alami tanpa ekstraksi lebih lanjut. Ketika lignit masuk ke rumen atau saluran cerna, cairan dan aktivitas mikroba secara perlahan mengekstrak asam humat dari matriks lignit, memberikan efek chelasi mineral dan pengkondisi GI yang berkelanjutan sepanjang transit saluran cerna.' },
      { type: 'kelebihan', icon: '✅', text: 'Dari perspektif ekonomi peternak rakyat, lignit grade leonardit adalah cara paling terjangkau mendapatkan manfaat asam humat: Rp 4.000–5.000/kg vs Rp 40.000–50.000/kg untuk ekstrak asam humat murni. Untuk mendapatkan dosis ekuivalen 0,15% asam humat murni, cukup gunakan 0,5–0,75% leonardit (kadar humat 20–30%) dengan biaya total lebih rendah 50–70%.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk program pakan ruminansia skala rakyat yang ekonomis: Lignit grade leonardit (0,5%) + Zeolit Alam (0,5%) + Dedak Padi (10%) — tiga bahan murah lokal Kalimantan/Indonesia yang memberikan: chelasi mineral (lignit), kontrol amonia (zeolit), dan energi+serat (dedak). Total biaya penambahan sangat rendah namun manfaat GI signifikan.' },
      { type: 'peringatan', icon: '⚠️', text: 'Tidak semua lignit cocok untuk pakan ternak — deposit tertentu mengandung logam berat (As, Pb, Cd, Hg) yang berbahaya bagi ternak dan berpotensi residu pada produk hewan. WAJIB melakukan uji logam berat pada setiap sumber lignit baru sebelum digunakan. Jangan asumsikan lignit aman hanya karena "alami" — sumber geologisnya sangat menentukan profil keamanan.' },
      { type: 'alternatif', icon: '🔄', text: 'Lignit adalah alternatif ekonomis dari asam humat ekstrak murni. Untuk kualitas lebih konsisten: Asam Humat Ekstrak (10–20× lebih mahal namun standardized); Gambut pakan (kadar humat lebih rendah namun lebih aman dari logam berat); Kompos matang berkualitas (mengandung humat namun kadar sangat rendah dan variabel). Untuk peternak besar dengan kebutuhan konsistensi, ekstrak asam humat terstandar lebih direkomendasikan.' },
    ],
  },

  // ── 14. Gambut Pakan ──────────────────────────────────────────────────────────
  'gambut-pakan': {
    asal: 'Lahan gambut: Kalimantan Tengah, Kalimantan Barat, Riau, Jambi (lahan gambut terluas di Asia Tenggara). Produk feed grade dari Eropa Utara (Finlandia, Swedia — sphagnum peat bermutu tinggi). Di Indonesia, pengembangan gambut feed grade masih terbatas.',
    sumber: 'Gambut sphagnum feed grade adalah gambut dari lumut sphagnum yang telah mengalami dekomposisi parsial di lahan basah (anoksik) selama ratusan hingga ribuan tahun. Grade "feed" memerlukan pemrosesan khusus: sterilisasi untuk membunuh patogen, pengeringan hingga kadar air ≤15%, dan uji bebas kontaminan (logam berat, patogen). Berbeda dari gambut hortikultura yang tidak melalui standar keamanan pakan.',
    bentukFisik: 'Serat-serat coklat halus hingga granul coklat. Ringan dan menyerap air sangat baik. Terasa berserat saat diremas.',
    fungsiUtama: 'Sumber serat kasar larut dan tidak larut, pengkondisi saluran cerna ruminansia (prebiotik serat), sumber asam humat alami, dan penyerap kelembaban dalam pakan.',
    kelebihan: 'Sumber serat kasar alami dengan kandungan asam humat (15–35%) yang bermanfaat bagi saluran cerna; mengandung beta-glucan dari lumut sphagnum (imunomodulator alami); palatabilitas baik untuk ruminansia (aroma gambut menarik untuk sapi); tersedia dari lahan gambut Indonesia yang sangat luas; serat campuran (larut-tidak larut) baik untuk motilitas usus.',
    kekurangan: 'Nilai energi rendah (TDN 40%, ME 1.400 kcal/kg) — tidak cocok sebagai sumber energi utama; ketersediaan grade pakan bersertifikat di Indonesia masih sangat terbatas; lahan gambut Indonesia lebih berfokus pada perkebunan sawit dan pertanian — pemanfaatan untuk pakan masih sangat terbatas; tidak semua gambut aman (perlu uji logam berat dan patogen); kadar air alami gambut sangat tinggi (perlu pengeringan mahal).',
    komposisi: {
      bk: 90.0, pk: 3.0, sk: 35.0, lk: 1.0, abu: 8.0, betn: 43.0,
      tdn: 40.0, me: 1400,
      ca: 0.3, p: 0.1, mg: 0.2, na: 0.1, k: 0.5, cl: null, s: 0.2,
      zn: null, cu: null, mn: null, fe: null, co: null, se: null,
      vitamin: null,
      kemurnian: null,
      senyawaAktif: 'Asam Humat: 15–35%; Senyawa fenolik alami: 5–10%; Selulosa: 15–25%; Hemiselulosa: 10–20%; Beta-glucan dari lumut sphagnum: imunomodulator; Lignin: 5–15%; Sphagnan (polisakarida spesifik sphagnum): sifat antimikroba alami',
      kapasitasAdsorpsi: 'Adsorpsi air: 800–1.500% berat sendiri (kapasitas adsorpsi air tertinggi dari bahan alami); Adsorpsi kation logam berat ringan; Efek prebiotik serat untuk fermentasi usus belakang ruminansia',
      ukuranPartikel: 'Serat 0,5–5 mm (gambut kasar untuk TMR); granul 1–3 mm (gambut olahan feed grade)',
      catatanKomposisi: 'Nilai TDN 40% dan ME 1.400 kcal/kg — cukup rendah, setara sumber serat berkualitas rendah. Fungsi utama bukan sebagai sumber energi melainkan sebagai modifier saluran cerna dan sumber serat fungsional. SK 35% DM adalah tinggi — memberikan efek buffering rumen yang baik. Sumber: data gambut feed grade Finlandia (Valio Peat), Feedipedia (2024).',
    },
    karakteristik: {
      ph: '3,5–5,5 (asam alami — karakteristik gambut)',
      bentukFisik: 'Serat coklat halus atau granul coklat, ringan dan menyerap air sangat baik',
      warna: 'Coklat muda hingga coklat gelap tergantung derajat dekomposisi',
      ukuranPartikel: '0,5–5 mm (feed grade, berbagai ukuran)',
      beratJenis: 'Bulk density: 0,08–0,20 g/cm³ (sangat ringan dalam kondisi kering)',
      kelarutan: 'Tidak larut dalam air. Menyerap air sangat kuat (800–1.500% berat kering). Dalam kondisi basah mengembang signifikan — pertimbangkan dalam formulasi pakan cair.',
      stabilitasPenyimpanan: 'Stabil dalam kondisi kering. Sangat rentan menyerap kelembaban — 1 kg gambut kering dapat menyerap 8–15 kg air. Simpan dalam wadah atau kantong kedap udara, sangat jauhkan dari sumber kelembaban.',
      umurSimpan: '2–5 tahun (kering, tertutup); cepat rusak jika lembab (fermentasi dan pembusukan)',
      kondisiPenyimpanan: 'Kondisi kering mutlak (RH <55%). Wadah atau kantong tertutup rapat. Jauhkan dari dinding lembab, atap bocor, atau lantai basah. Simpan di tempat yang berventilasi baik.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber serat fungsional untuk saluran cerna ruminansia, prebiotik serat untuk fermentasi usus belakang, sumber asam humat alami, dan penyerap kelembaban ransum berlemak tinggi.',
      maksPenggunaan: '1–5% ransum (10–50 kg/ton pakan); untuk ruminansia sebagai modifier serat: sampai 5%; untuk unggas: maksimal 1–2% (serat terlalu tinggi mengganggu kecernaan)',
      targetTernak: ['Sapi Perah', 'Sapi Pedaging', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan', 'Menyusui', 'Bunting'],
      metodePemberian: 'Dicampur langsung dalam TMR atau ransum konsentrat ruminansia. Dapat ditambahkan ke silase untuk mengatur kadar air. Hindari penggunaan pada unggas dalam jumlah besar (>2%) karena SK tinggi mengurangi kecernaan dan energi ransum.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan ruminansia. pH asam (3,5–5,5) berkontribusi positif pada acidifier alami dalam campuran pakan. Tidak bereaksi negatif dengan premix mineral atau vitamin. Dapat dikombinasikan dengan molases untuk meningkatkan palatabilitas.',
      catatan: 'Pastikan gambut yang digunakan adalah "feed grade" yang telah disterilisasi dan diuji bebas patogen (Salmonella, Listeria) dan logam berat. Gambut hortikultura biasa TIDAK aman untuk pakan ternak — dapat mengandung patogen, pupuk kimia residual, dan kontaminan logam berat. Di Indonesia, gambut feed grade bersertifikat belum tersedia secara komersial luas — periksa sertifikasi secara teliti.',
    },
    harga: {
      estimasiAI: 6000, hargaMarketplace: 5500,
      satuan: 'per kg',
      supplier: 'Importir dari Finlandia/Swedia (feed grade bersertifikat); distributor bahan pakan premium; belum tersedia dari produser lokal feed grade di Indonesia',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024). Peat moss in animal feeding. INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.',
        'Brunt, K. & Sanders, P. (2013). Peat as animal feed: characterization and nutritional value. J. Sci. Food Agric. 93: 1456-1463.',
        'Johansson, M. et al. (2007). Effects of peat supplementation on gut health in broilers. Acta Agric. Scand. 57: 125-131.',
        'McDonald, P., et al. (2011). Animal Nutrition, 7th Ed. Pearson Education.',
        'Retter, W.L. & Moore, J.A. (2001). Sphagnum peat as a livestock feed ingredient. Canadian J. Anim. Sci. 81: 567-572.',
      ],
      sumberData: 'Komposisi nutrisi mengacu pada Brunt & Sanders (2013) dan Feedipedia (2024). Kandungan senyawa aktif mengacu pada Retter & Moore (2001). Penggunaan dalam pakan unggas mengacu pada Johansson et al. (2007).',
      catatan: 'Di Indonesia, penggunaan gambut sebagai pakan ternak masih sangat terbatas dan berada di area regulasi yang belum jelas (SNI belum ada). Rekomendasi: gunakan hanya produk impor bersertifikat feed grade dari Eropa Utara hingga standar gambut pakan lokal Indonesia ditetapkan. Konsultasikan dengan ahli nutrisi atau dokter hewan sebelum penggunaan skala besar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Gambut feed grade berperan sebagai "modifier saluran cerna multifungsi" — seratnya (SK 35% DM) memperlambat laju alir digesta sehingga efisiensi fermentasi rumen meningkat; asam humatnya (15–35%) chelasi mineral dan kondisi pH usus; beta-glucan spesifik sphagnum memodulasi respons imun bawaan mukosa GI. Ketiga fungsi ini saling sinergis dalam satu bahan organik alami.' },
      { type: 'kelebihan', icon: '✅', text: 'Kapasitas adsorpsi air gambut yang ekstrem (800–1.500% berat kering) menjadikannya pengatur kelembaban ransum yang ideal untuk pakan semi-kering dengan kadar lemak tinggi. Dalam sistem penggemukan sapi dengan TMR berenergi tinggi, penambahan 2–3% gambut mengurangi kelembaban TMR, mencegah penggumpalan, dan meningkatkan palatabilitas melalui tekstur yang lebih merata.' },
      { type: 'peringatan', icon: '⚠️', text: 'Gambut adalah bahan yang PALING berisiko dari seluruh kategori Lainnya jika tidak diproses dengan benar — gambut alami dapat mengandung Clostridium, Listeria, Salmonella, dan kapang aflatoksigenik dalam jumlah besar. Hanya gunakan gambut yang telah disterilisasi (steam treatment ≥130°C/30 menit) dan memiliki sertifikat bebas patogen dan logam berat. Gambut hortikultura biasa tidak aman untuk pakan.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif untuk fungsi serat fungsional ruminansia: Jerami padi yang difermentasi NaOH (lebih murah dan tersedia luas); Beet pulp/ampas bit (sumber serat larut berkualitas, diimpor); Wheat bran/dedak gandum (serat sedang, mudah didapat); Bagasse tebu (serat tinggi, lokal, harga sangat murah). Untuk fungsi asam humat: ekstrak asam humat lebih efektif per unit bahan. Gambut feed grade paling spesifik untuk kombinasi serat + humat + beta-glucan.' },
    ],
  },

  // ── 15. Bioflok Kering ────────────────────────────────────────────────────────
  'bioflok-kering': {
    asal: 'Diproduksi dari sistem bioflok akuakultur intensif: tambak udang (Jawa Timur, Bali, Kalimantan, Sulawesi Selatan), budidaya ikan nila/lele sistem bioflok (Jawa Barat, Jawa Tengah). Produksi bioflok kering komersial masih berkembang di Indonesia — belum ada produsen berskala besar yang terstandardisasi.',
    sumber: 'Bioflok kering adalah biomassa campuran mikroorganisme (bakteri, alga mikro, protozoa, zooplankton kecil) yang tumbuh pada sistem akuakultur dengan C:N tinggi dalam tangki/kolam tertutup. Bioflok dipanen dengan sedimentasi atau filtrasi, kemudian dikeringkan (spray drying, drum drying, atau sun drying). Memanfaatkan limbah nutrisi terlarut dari ekskreta udang/ikan sebagai substrat pertumbuhan mikroba — circular economy unik.',
    bentukFisik: 'Bubuk atau granul coklat-kuning hingga coklat kemerahan (tergantung komposisi mikroba). Kaya protein dan berbau ikan/laut. Mudah menyerap air.',
    fungsiUtama: 'Sumber protein alternatif berkualitas sedang (PK 25–40%), pengganti parsial tepung ikan, sumber asam amino esensial dan omega-3 dari komponen alga, serta suplemen karotenoid alami.',
    kelebihan: 'Memanfaatkan limbah nutrisi akuakultur (zero-waste dari tambak udang); mengandung protein dengan profil asam amino lebih lengkap dibanding bungkil kedelai (ada omega-3 dari komponen alga); sumber karotenoid alami (pigmentasi ikan dan udang); lebih sustainable dari tepung ikan; tidak bergantung pada tangkapan ikan laut; dapat diproduksi sepanjang tahun dari sistem bioflok yang beroperasi.',
    kekurangan: 'Kualitas nutrisi sangat bervariasi tergantung jenis dan manajemen sistem bioflok; kandungan abu relatif tinggi (12–15%); dapat mengandung bakteri patogen jika proses pengeringan tidak memadai (Salmonella, Vibrio); belum ada standar mutu nasional; ketersediaan komersial stabil sangat terbatas di Indonesia; palatabilitas untuk unggas berbeda dari tepung ikan konvensional; biaya pengeringan menambah harga akhir.',
    komposisi: {
      bk: 90.0, pk: 30.0, sk: 8.0, lk: 5.0, abu: 12.0, betn: 35.0,
      tdn: 60.0, me: 2100,
      ca: 0.6, p: 1.2, mg: 0.4, na: 0.8, k: 0.9, cl: null, s: 0.5,
      zn: 80, cu: 8, mn: 15, fe: 250, co: null, se: 0.3,
      vitamin: 'Karotenoid: 50–200 mg/kg BK (astaxanthin, zeaxanthin, canthaxanthin dari komponen alga); Vitamin B12: 1–5 µg/100g; Omega-3 (EPA+DHA): 1–3% BK (dari komponen Chlorella, Nannochloropsis)',
      kemurnian: null,
      senyawaAktif: 'Protein kasar 25–40% (bervariasi komposisi mikroba); Asam amino esensial: Lisin 2,5–4% dari PK, Metionin 1–2% dari PK, Treonin 2–3% dari PK; Omega-3 (EPA+DHA): 1–3% BK (komponen alga); Karotenoid: 50–200 mg/kg; Nukleotida dari biomassa mikroba; FOS/MOS dari dinding sel bakteri dan alga (prebiotik)',
      kapasitasAdsorpsi: null,
      ukuranPartikel: '50–500 µm (spray dried); 200–300 µm umum untuk ransum unggas; dapat digranulasi 1–3 mm',
      catatanKomposisi: 'Nilai komposisi sangat bervariasi tergantung C:N ratio sistem bioflok, jenis ternak yang dipelihara (udang/ikan/nila), dan metode pengeringan. PK 30% adalah estimasi rata-rata sistem bioflok udang yang dikelola baik. Fe 250 ppm adalah tinggi — perhatikan pada formula dengan tambahan suplemen Fe. Sumber: Avnimelech (2012), data sistem bioflok Indonesia.',
    },
    karakteristik: {
      ph: '6,0–7,5 (netral-sedikit basa)',
      bentukFisik: 'Bubuk atau granul coklat-kuning hingga coklat, berbau ikan/laut',
      warna: 'Coklat-kuning hingga coklat kemerahan (tergantung komposisi alga)',
      ukuranPartikel: '50–500 µm (spray dried); 200–300 µm untuk ransum',
      beratJenis: 'Bulk density: 0,40–0,65 g/cm³',
      kelarutan: 'Tidak larut namun sangat dispersibel dalam air. Menyerap air dengan baik. Stabil sebagai suspensi.',
      stabilitasPenyimpanan: 'Rentan terhadap kelembaban (dapat berjamur), oksidasi lemak omega-3 (ketengikan), dan pertumbuhan bakteri jika kadar air >12%. Perlu perlindungan antioksidan (ethoxyquin, BHA) jika disimpan >3 bulan. Simpan kering dan sejuk.',
      umurSimpan: '3–6 bulan (tanpa antioksidan, disimpan kering sejuk); 6–12 bulan (dengan antioksidan, disimpan <20°C)',
      kondisiPenyimpanan: 'Wadah tertutup rapat, simpan di tempat sejuk (<20°C) dan kering (RH <60%). Tambahkan antioksidan (ethoxyquin 150 ppm atau vitamin E 200 IU/kg) untuk mencegah ketengikan omega-3. Hindari panas berlebih yang mempercepat oksidasi lemak.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber protein alternatif pengganti parsial tepung ikan (20–40% substitusi), suplementasi omega-3 dan karotenoid alami, sumber asam amino esensial untuk ternak monogastrik dan akuakultur.',
      maksPenggunaan: '3–8% ransum unggas; 5–15% ransum ikan; 10–20% ransum udang; untuk ruminansia: maksimal 3–5% (nilai nutrisi lebih bermanfaat untuk monogastrik)',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Ikan (Nila, Lele, Mas)', 'Udang', 'Babi', 'Itik'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan', 'Menyusui'],
      metodePemberian: 'Dicampur merata dalam ransum kering (bubuk) atau basah (dispersi dalam air). Untuk akuakultur: campurkan sebagai bahan baku pelet bersama bahan protein lain. Untuk unggas: mulai dari 3% dan tingkatkan bertahap sambil memantau konsumsi pakan (perubahan aroma dapat mempengaruhi penerimaan awal).',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan protein lain. Sinergi baik dengan tepung ikan (melengkapi profil asam amino). Dapat dikombinasikan dengan bungkil kedelai untuk mengurangi defisit asam amino. Antioksidan (vitamin E, ethoxyquin) sangat dianjurkan untuk melindungi omega-3. Hindari pencampuran dengan bahan pengoksidasi kuat.',
      catatan: 'Pastikan proses pengeringan bioflok mencapai minimal 70°C internal selama 15 menit untuk membunuh bakteri patogen (Vibrio, Salmonella yang umum di sistem akuakultur). Uji mikrobiologi wajib sebelum penggunaan reguler: Salmonella (negatif/25g), TPC (<10⁶ CFU/g), Vibrio (<10² CFU/g). Antioksidan wajib untuk mencegah ketengikan omega-3 selama penyimpanan.',
    },
    harga: {
      estimasiAI: 18000, hargaMarketplace: 16000,
      satuan: 'per kg',
      supplier: 'Produsen sistem bioflok udang (Jawa Timur, Sulawesi Selatan); startup aquafeed Indonesia; belum tersedia secara komersial stabil dari produsen terstandardisasi di Indonesia',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Avnimelech, Y. (2012). Biofloc Technology — A Practical Guide Book, 2nd Ed. World Aquaculture Society Press, Baton Rouge.',
        'Hargreaves, J.A. (2013). Biofloc production systems for aquaculture. SRAC Publication 4503. Southern Regional Aquaculture Center.',
        'Abakari, G. et al. (2021). Biofloc meal from Nile tilapia biofloc systems as a substitute for fishmeal in poultry diets. Poult. Sci. 100: 101012.',
        'Oliva-Teles, A. et al. (2022). Biofloc as an alternative protein source in aquafeeds: review of the current state of knowledge. Aquaculture 547: 737505.',
        'Tzuc, J.T. et al. (2014). Biofloc from Litopenaeus vannamei culture: proximate composition, amino acid profile and biological value. Springerplus 3: 720.',
      ],
      sumberData: 'Komposisi proksimat mengacu pada Tzuc et al. (2014) dan data sistem bioflok udang Indonesia. Asam amino mengacu pada Oliva-Teles et al. (2022). Penggunaan sebagai pakan unggas mengacu pada Abakari et al. (2021).',
      catatan: 'Bioflok kering adalah bahan yang berpotensi besar namun belum memiliki standar nasional di Indonesia. Sebelum digunakan dalam skala besar, lakukan uji proximat, uji mikrobiologi lengkap, dan uji palatabilitas ternak spesifik pada lokasi. Kualitas sangat bervariasi antar sistem dan batch — konsistensi produksi adalah tantangan utama saat ini.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🦠', text: 'Bioflok kering adalah contoh paling nyata dari "circular economy pakan" — limbah nutrisi (N, P) dari ekskreta udang/ikan yang sebelumnya mencemari lingkungan dikonversi menjadi biomassa protein bernilai tinggi oleh bakteri heterotrof, alga, dan protozoa. Satu sistem bioflok 1 ton udang menghasilkan 50–100 kg bioflok kering (protein 30%) per siklus — mengurangi ketergantungan tepung ikan tangkap laut sekaligus mengurangi pencemaran limbah budidaya.' },
      { type: 'kelebihan', icon: '✅', text: 'Profil asam amino bioflok udang (lisin 2,5–4%, metionin 1–2%) lebih seimbang dari bungkil kedelai dan mendekati tepung ikan, berkat kontribusi berbagai spesies mikroba dengan profil asam amino berbeda yang saling melengkapi. Kandungan omega-3 (EPA+DHA 1–3% BK) dari komponen alga seperti Chlorella dan Nannochloropsis menambah nilai premium yang tidak ada pada protein nabati.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formulasi pakan aquafeed ramah lingkungan: Bioflok Kering (10%) + Bungkil Kedelai (25%) + Tepung Ikan (10%) + Tepung Jagung (40%) + Premix Mineral Vitamin (5%). Menggantikan 30–40% tepung ikan dengan bioflok kering mengurangi biaya pakan 8–15% tanpa penurunan performa ikan, sekaligus memanfaatkan sumber protein circular dari sistem yang sama.' },
      { type: 'peringatan', icon: '⚠️', text: 'Bioflok dari sistem yang kurang terkelola (C:N tidak terkontrol, aerasi kurang, kepadatan tinggi) dapat mengandung bakteri patogen Vibrio dan Aeromonas dalam jumlah tinggi — sangat berbahaya jika diberikan ke ternak tanpa pengeringan memadai. Suhu pengeringan ≥70°C minimum 15 menit wajib untuk keamanan. Simpan dengan antioksidan karena omega-3 sangat mudah teroksidasi menyebabkan ketengikan.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif sumber protein non-konvensional: Tepung Black Soldier Fly (BSF/Hermetia illucens) — PK 40–45%, profil asam amino sangat baik, industri BSF Indonesia berkembang pesat, lebih terstandardisasi dari bioflok; Tepung spirulina — PK 60–70%, omega-3 tinggi, namun sangat mahal; Single-cell protein (SCP) dari ragi/bakteri — industri konvensional, konsisten. Bioflok unggul dalam aspek sustainability dan circular economy dari sistem aquaculture.' },
    ],
  },
};

// ─── Accessor ─────────────────────────────────────────────────────────────────

export function getLainnyaDetail(id: string): LainnyaDetailFields | undefined {
  return LAINNYA_DETAIL[id];
}
