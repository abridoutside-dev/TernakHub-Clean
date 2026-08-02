// ─── MP-031 — Detail Data: Mineral ───────────────────────────────────────────
// Full nutrition, usage, price, reference, and AI insight for every item in
// the "Mineral" sub-category. Merged with MineralItem via getMineralDetail().
//
// Sumber data komposisi mineral:
//   • NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.
//   • NRC (2005). Mineral Tolerance of Animals, 2nd Rev. Ed. NAS.
//   • NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.
//   • NRC (2016). Nutrient Requirements of Beef Cattle, 8th Rev. Ed.
//   • McDowell, L.R. (1992). Minerals in Animal and Human Nutrition. Academic Press.
//   • McDowell, L.R. (2003). Minerals in Animal and Human Nutrition, 2nd Ed. Elsevier.
//   • Suttle, N.F. (2010). Mineral Nutrition of Livestock, 4th Ed. CABI.
//   • Feedipedia (2024). INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi Pakan
//     untuk Indonesia. Gadjah Mada University Press.
//   • AFMA (2023). Feed Ingredient Database. Animal Feed Manufacturers Association.
//   • Pond, W.G., Church, D.C., Pond, K.R. (1995). Basic Animal Nutrition, 4th Ed.
//   • McDonald, P., et al. (2011). Animal Nutrition, 7th Ed. Pearson Education.
//
// Nilai komposisi mineral dinyatakan atas dasar bahan kering (DM basis) kecuali
// dinyatakan lain. Mineral makro (Ca, P, Mg, Na, K, Cl, S) dalam satuan %.
// Mineral mikro/trace (Fe, Zn, Cu, Mn, Co, I, Se, Cr, Mo, F) dalam satuan ppm.
// Kemurnian (%) dinyatakan atas dasar as-fed.

import { getMineralById } from './mineralData';
import type {
  HargaData,
  ReferensiData,
  AiInsightItem,
  BentukBahan,
  ProgramCocok,
} from './jagungData';

export { getMineralById };

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface MineralKomposisi {
  kemurnian: number | null;       // % kemurnian bahan (as-fed)
  ca: number | null;              // % Ca (DM)
  p: number | null;               // % P (DM)
  mg: number | null;              // % Mg (DM)
  na: number | null;              // % Na (DM)
  k: number | null;               // % K (DM)
  cl: number | null;              // % Cl (DM)
  s: number | null;               // % S (DM)
  fe: number | null;              // ppm Fe (DM)
  zn: number | null;              // ppm Zn (DM)
  cu: number | null;              // ppm Cu (DM)
  mn: number | null;              // ppm Mn (DM)
  co: number | null;              // ppm Co (DM)
  iodine: number | null;          // ppm I (DM)
  se: number | null;              // ppm Se (DM)
  cr: number | null;              // ppm Cr (DM)
  mo: number | null;              // ppm Mo (DM)
  f: number | null;               // ppm F / fluorida (DM)
  bioavailabilitas: string | null;
  catatan: string | null;
}

export interface MineralDetailPenggunaan {
  fungsiUtama: string;
  maksPenggunaan: number | null;  // % ransum
  targetTernak: string[];
  programCocok: ProgramCocok[];
  metodePemberian: string;
  kompatibilitas: string | null;
  catatan: string | null;
}

export interface MineralDetailFields {
  namaKimia: string;
  asal: string;
  sumber: string;
  bentukFisik: string;
  kelarutan: string | null;
  kelebihan: string;
  kekurangan: string;
  komposisi: MineralKomposisi;
  penggunaan: MineralDetailPenggunaan;
  harga: HargaData;
  referensi: ReferensiData;
  aiInsight: AiInsightItem[];
  bentuk: BentukBahan[];
}

// ─── Detail Records ───────────────────────────────────────────────────────────

const MINERAL_DETAIL: Record<string, MineralDetailFields> = {

  // ── 1. Batu Kapur (Limestone) ─────────────────────────────────────────────────
  'batu-kapur': {
    namaKimia: 'Kalsium Karbonat (Calcium Carbonate)',
    asal: 'Tambang batu kapur: Tuban, Gresik, Rembang (Jawa); Pangkep (Sulsel); Padalarang (Jabar); Kupang (NTT)',
    sumber: 'Batuan sedimen karbonat alam yang terbentuk dari akumulasi organisme laut (kalsit, aragonit). Ditambang, dihaluskan, dan diayak sesuai ukuran partikel yang diinginkan.',
    bentukFisik: 'Butiran kasar (2–4 mm) untuk ayam petelur; tepung halus (<0,5 mm) untuk pakan mash/broiler; warna putih hingga krem.',
    kelarutan: 'Relatif tidak larut dalam air murni (Ksp = 3,3 × 10⁻⁹); larut dalam asam (HCl, asam lambung pH <3). Partikel kasar larut lebih lambat — ideal untuk petelur yang membutuhkan Ca malam hari.',
    kelebihan: 'Sumber Ca paling ekonomis dan tersedia luas di Indonesia; tidak ada risiko toksisitas F; mudah disimpan; kompatibel dengan semua bahan pakan; tersedia dalam berbagai ukuran partikel sesuai kebutuhan spesies.',
    kekurangan: 'Bioavailabilitas Ca lebih rendah dari kalsium karbonat presipitasi; kandungan impuritas (MgO, SiO₂, Fe₂O₃) bervariasi antar sumber; tidak menyediakan P sama sekali — harus dipasangkan DCP/MCP untuk keseimbangan Ca:P.',
    komposisi: {
      kemurnian: 90,
      ca: 35.0, p: 0.02, mg: 0.30, na: 0.05, k: 0.10, cl: 0.05, s: 0.02,
      fe: 1000, zn: 20, cu: 5, mn: 150, co: 1, iodine: 0.2, se: 0.1, cr: 5, mo: 1, f: 350,
      bioavailabilitas: 'Ca: ±65–70% (ruminansia, partikel kasar); ±50–55% (unggas, halus); ±70% (babi)',
      catatan: 'Komposisi bervariasi tergantung kemurnian deposit. Ca berkisar 33–38% BK; Mg lebih tinggi pada kapur dolomitik. Partikel kasar (2–4 mm) disarankan untuk ayam petelur dewasa agar Ca tersedia malam hari selama pembentukan kerabang.',
    },
    penggunaan: {
      fungsiUtama: 'Suplementasi kalsium (Ca) untuk pembentukan tulang, gigi, kerabang telur, dan kontraksi otot. Mineral makro esensial untuk semua spesies ternak.',
      maksPenggunaan: 8,
      targetTernak: ['Ayam Petelur', 'Ayam Broiler', 'Sapi Perah', 'Sapi Pedaging', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      metodePemberian: 'Dicampur dalam ransum mash/pellet. Ayam petelur: gunakan partikel kasar 2–4 mm (campurkan 50:50 halus:kasar). Dapat juga diberikan terpisah (free choice) untuk ayam petelur.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan. Perhatikan rasio Ca:P = 1,5–2:1 (unggas) dan 1,5–3:1 (ruminansia). Jangan campurkan dengan bahan fosfat tinggi tanpa kalkulasi — risiko imbalance Ca:P. Ca tinggi dapat menghambat absorpsi Zn dan Mg.',
      catatan: 'Level rekomendasi: Ayam petelur 3,5–4,5% ransum; Ayam broiler 0,8–1,0%; Sapi laktasi 0,5–0,7% BK ransum; Kambing/domba menyusui 0,4–0,6% BK. Simpan di tempat kering — tidak higroskopis, stabil untuk jangka panjang.',
    },
    harga: {
      estimasiAI: 800,
      hargaMarketplace: 750,
      satuan: 'per kg',
      supplier: 'Pabrik kapur lokal (Tuban, Gresik); Toko pertanian; Distributor pakan ternak',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed. National Academy Press, Washington DC.',
        'McDowell, L.R. (1992). Minerals in Animal and Human Nutrition. Academic Press, San Diego.',
        'Suttle, N.F. (2010). Mineral Nutrition of Livestock, 4th Ed. CABI Publishing, Wallingford.',
        'Hy-Line International (2023). Hy-Line W-36 Commercial Management Guide. Hy-Line International, Iowa.',
        'Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi Pakan untuk Indonesia. Gadjah Mada University Press.',
      ],
      sumberData: 'Komposisi mineral mengacu pada McDowell (1992) dan Suttle (2010). Nilai Ca adalah rata-rata batu kapur kalsitik Indonesia (analisis BALITNAK 2018). Bioavailabilitas Ca mengacu pada NRC (1994) Poultry dan NRC (2001) Dairy Cattle.',
      catatan: 'Kemurnian dan kadar Ca sangat bervariasi antar deposit. Selalu lakukan analisis kadar Ca setiap batch baru dari supplier berbeda. Batu kapur dolomitik (Mg >1%) tidak ideal untuk unggas karena Mg berlebih dapat menyebabkan litter basah.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '🦴',
        text: 'Kalsium (Ca) adalah mineral paling dominan dalam tubuh ternak — ±98% Ca tubuh berada dalam tulang dan gigi. Pada ayam petelur, kebutuhan Ca melonjak 10× saat produksi telur: tiap butir kerabang membutuhkan ±2 g Ca, sementara Ca tubuh ayam hanya ~25 g. Ini berarti Ca dari ransum WAJIB tersedia sepanjang hari, terutama malam hari (fase pembentukan kerabang).',
      },
      {
        type: 'kelebihan',
        icon: '✅',
        text: 'Batu kapur kasar (2–4 mm) adalah pilihan terbaik untuk ayam petelur: waktu retensi di gizzard lebih lama sehingga Ca tersedia secara bertahap, termasuk malam hari saat kerabang terbentuk. Penelitian menunjukkan penggunaan 50% kapur kasar + 50% halus meningkatkan kualitas kerabang telur dan mengurangi egg breakage 8–12%.',
      },
      {
        type: 'kekurangan',
        icon: '🦴',
        text: 'Defisiensi Ca pada unggas menyebabkan: kerabang lembek/soft-shelled eggs, osteoporosis produksi (cage fatigue), rachitis pada ayam muda. Pada sapi: milk fever (hipokalsemia peri-partus) — Ca darah turun di bawah 8 mg/dL, sapi berbaring tidak bisa berdiri, risiko mortalitas tinggi. Pada ruminansia muda: rachitis (tulang lunak, kaki bengkok).',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'Kelebihan Ca (>4% ransum unggas) menyebabkan: penurunan konsumsi pakan, hambatan absorpsi P, Zn, Mg, dan Mn, urolitiasis pada unggas jantan, kerusakan ginjal. Pada ruminansia >2,5% BK ransum: risiko hipokalsemia rebound, hambatan absorpsi P dan Mg. Jangan overshoot target Ca — selalu hitung total Ca dari semua bahan pakan.',
      },
      {
        type: 'kombinasi',
        icon: '🔗',
        text: 'Selalu pasangkan dengan DCP/MCP untuk memenuhi kebutuhan P dan menjaga rasio Ca:P ideal (unggas 1,5–2:1; ruminansia 1,5–3:1). Hindari kombinasi dengan F tinggi (rock phosphate non-defluorinasi). Vitamin D3 meningkatkan absorpsi Ca sebesar 30–50% — pastikan D3 mencukupi dalam premix. Ca dan Mg bersaing di tempat absorpsi usus.',
      },
      {
        type: 'alternatif',
        icon: '🔄',
        text: 'Alternatif sumber Ca: Kalsium Karbonat feed grade (lebih murni, konsisten, cocok untuk formulasi presisi), Tepung Batu Kapur (lebih halus untuk ransum mash), Dolomit (bila perlu Ca + Mg sekaligus, terutama ruminansia). Untuk sumber Ca + P sekaligus gunakan DCP atau Tepung Tulang Mineral.',
      },
    ],
    bentuk: ['Butiran', 'Tepung'],
  },

  // ── 2. Tepung Batu Kapur ──────────────────────────────────────────────────────
  'tepung-batu-kapur': {
    namaKimia: 'Kalsium Karbonat Giling Halus (Fine Ground Calcium Carbonate)',
    asal: 'Tambang batu kapur: Tuban, Gresik (Jawa Timur); Rembang (Jawa Tengah); Pangkep (Sulawesi Selatan)',
    sumber: 'Batu kapur alam yang ditambang kemudian digiling menggunakan ball mill atau roller mill hingga ukuran partikel <0,5 mm (lolos ayakan 40–60 mesh). Produk sampingan industri semen dan kapur bakar.',
    bentukFisik: 'Tepung putih hingga krem, ukuran partikel <0,5 mm, bulk density ±0,9–1,1 kg/L. Mudah mengalir (free-flowing) karena partikel halus.',
    kelarutan: 'Sama dengan batu kapur: larut dalam asam lambung, tidak larut dalam air murni. Kelarutan lebih cepat dari batu kapur kasar karena luas permukaan lebih besar.',
    kelebihan: 'Harga paling ekonomis di antara semua sumber Ca; mudah dicampur homogen dalam ransum mash dan pellet; tersedia sangat luas di pasar pakan; tidak ada risiko F (bebas dari rock phosphate).',
    kekurangan: 'Ukuran partikel terlalu halus tidak ideal untuk ayam petelur (kurang efektif menyediakan Ca malam hari); perlu dikombinasikan dengan kapur kasar untuk petelur. Tidak ada P sama sekali.',
    komposisi: {
      kemurnian: 92,
      ca: 35.5, p: 0.02, mg: 0.25, na: 0.05, k: 0.08, cl: 0.05, s: 0.02,
      fe: 900, zn: 18, cu: 4, mn: 130, co: 0.8, iodine: 0.1, se: 0.1, cr: 4, mo: 1, f: 300,
      bioavailabilitas: 'Ca: ±50–58% (unggas, fine grind lebih rendah dari kasar); ±65% (ruminansia); ±70% (babi)',
      catatan: 'Kadar Ca sedikit lebih tinggi dari batu kapur kasar karena proses penggilingan memisahkan sebagian material silikat. Tepung halus (<0,1 mm) bioavailabilitas Ca-nya lebih rendah pada unggas karena waktu retensi gizzard lebih singkat.',
    },
    penggunaan: {
      fungsiUtama: 'Suplementasi Ca utama dalam ransum broiler, babi, pakan ikan, dan pellet ruminansia. Lebih mudah dicampur merata vs batu kapur kasar.',
      maksPenggunaan: 8,
      targetTernak: ['Ayam Broiler', 'Babi', 'Ikan Budidaya', 'Sapi Pedaging', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      metodePemberian: 'Dicampur langsung dalam formula ransum. Untuk ayam petelur: campurkan 50% tepung halus + 50% butiran kasar 2–4 mm. Untuk broiler: 100% halus sudah cukup. Untuk pellet: tepung halus lebih baik sebagai binder.',
      kompatibilitas: 'Sama dengan batu kapur kasar. Kompatibel dengan semua bahan pakan. Pastikan rasio Ca:P terpenuhi. Tambahkan DCP/MCP untuk sumber P.',
      catatan: 'Level penggunaan: Broiler 0,8–1,0% ransum; Babi starter 0,7–0,9%; Sapi feedlot 0,4–0,6% BK; Ikan 1–2% ransum. Simpan dalam wadah tertutup, jauhkan dari kelembaban karena mudah menggumpal jika basah.',
    },
    harga: {
      estimasiAI: 600,
      hargaMarketplace: 550,
      satuan: 'per kg',
      supplier: 'Distributor pakan ternak lokal; Pabrik kapur giling (Tuban, Rembang); Toko pertanian',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed. National Academy Press, Washington DC.',
        'NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed. National Academy Press.',
        'McDowell, L.R. (1992). Minerals in Animal and Human Nutrition. Academic Press.',
        'Rao, S.V.R., et al. (2009). Effect of particle size of limestone on performance of laying hens. Asian-Australas. J. Anim. Sci. 22(4):566–571.',
      ],
      sumberData: 'Komposisi mengacu pada McDowell (1992) dan analisis batu kapur Indonesia (BALITNAK). Perbedaan utama dari batu kapur kasar hanya pada ukuran partikel, bukan komposisi kimia.',
      catatan: 'Ukuran partikel adalah faktor kritis untuk ayam petelur. Partikel <0,1 mm tidak direkomendasikan karena melewati gizzard terlalu cepat. Gunakan screen 5–10 mesh untuk memastikan ukuran partikel 2–4 mm untuk komponen kasar.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '🦴',
        text: 'Tepung batu kapur adalah sumber Ca paling ekonomis untuk ransum broiler, babi, dan pakan ikan. Partikel halus memberikan homogenitas campuran yang lebih baik dan mengurangi segregasi dalam ransum mash — penting untuk ransum yang disimpan lama atau ditransportasikan jauh.',
      },
      {
        type: 'kelebihan',
        icon: '✅',
        text: 'Untuk ransum pellet, tepung batu kapur halus berfungsi ganda: sumber Ca sekaligus pengisi (filler) yang meningkatkan pelletability dan durability pelet. Kadar kekerasan pelet meningkat 10–15% dengan penggunaan tepung batu kapur vs kapur kasar.',
      },
      {
        type: 'kekurangan',
        icon: '🔍',
        text: 'Partikel terlalu halus (<0,1 mm) pada ayam petelur justru kontraproduktif: waktu retensi di gizzard lebih singkat, Ca diserap kurang efisien, tidak ada Ca yang tersedia malam hari untuk pembentukan kerabang. Gunakan campuran halus + kasar untuk ayam petelur.',
      },
      {
        type: 'kombinasi',
        icon: '🔗',
        text: 'Selalu pasangkan dengan DCP atau MCP untuk memenuhi P. Tambahkan vitamin D3 dalam premix untuk mengoptimalkan absorpsi Ca. Pada ransum ruminansia, pertimbangkan NaHCO₃ untuk buffer rumen jika penggunaan biji-bijian tinggi.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'Pemeriksaan kadar Ca wajib dilakukan secara berkala karena kandungan Ca batu kapur sangat bervariasi antar deposit (33–38%). Formulasi berdasarkan nilai literatur tanpa analisis aktual dapat menyebabkan defisiensi atau kelebihan Ca yang signifikan.',
      },
    ],
    bentuk: ['Tepung'],
  },

  // ── 3. Kalsium Karbonat Feed Grade ────────────────────────────────────────────
  'kalsium-karbonat': {
    namaKimia: 'Kalsium Karbonat (Calcium Carbonate)',
    asal: 'Diproduksi secara industri di pabrik kimia dengan bahan baku batu kapur kemurnian tinggi. Tersedia juga sebagai precipitated calcium carbonate (PCC) dari proses kimia basah. Impor: China, India.',
    sumber: 'Ground limestone kemurnian tinggi (≥95% CaCO₃) atau precipitated calcium carbonate (PCC) dari reaksi Ca(OH)₂ + CO₂ → CaCO₃. Feed grade memiliki spesifikasi F <200 ppm, heavy metal terkontrol.',
    bentukFisik: 'Tepung sangat halus, putih, ringan. Ukuran partikel <30–50 μm (sangat halus). Bulk density ±0,5–0,8 kg/L. Tidak berbau.',
    kelarutan: 'Larut dalam asam; tidak larut dalam air murni. pH larutan berair ±9. Kecepatan disolusi lebih cepat dari batu kapur alam karena partikel sangat halus.',
    kelebihan: 'Kemurnian sangat tinggi (≥95–98% CaCO₃), kadar Ca konsisten (±37–40%), kadar impuritas rendah, kadar F rendah (<200 ppm), cocok untuk formula presisi. Ideal untuk pakan ikan dan udang yang membutuhkan akurasi tinggi.',
    kekurangan: 'Harga lebih mahal dari tepung batu kapur biasa. Partikel sangat halus dapat menyebabkan dust yang mengganggu pencampuran. Sama seperti batu kapur: tidak ada P.',
    komposisi: {
      kemurnian: 97,
      ca: 39.0, p: 0.01, mg: 0.10, na: 0.02, k: 0.03, cl: 0.02, s: 0.01,
      fe: 200, zn: 8, cu: 2, mn: 30, co: 0.3, iodine: 0.1, se: 0.05, cr: 2, mo: 0.5, f: 150,
      bioavailabilitas: 'Ca: ±55–65% (unggas); ±68–72% (ruminansia); ±72% (babi). Bioavailabilitas sedikit lebih tinggi dari limestone alam karena kemurnian lebih tinggi dan impuritas penghambat lebih sedikit.',
      catatan: 'Komposisi sangat konsisten antar batch (keunggulan utama vs limestone alam). Ca berkisar 37–40% BK. F sangat rendah (<200 ppm) — memenuhi persyaratan semua spesies ternak.',
    },
    penggunaan: {
      fungsiUtama: 'Suplementasi Ca presisi untuk ransum unggas, pakan ikan, udang, dan babi di mana konsistensi dan kemurnian kritis. Digunakan dalam formulasi berbasis komputer yang memerlukan nilai nutrisi yang akurat.',
      maksPenggunaan: 8,
      targetTernak: ['Ayam Petelur', 'Ayam Broiler', 'Ikan Budidaya', 'Udang', 'Babi'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      metodePemberian: 'Dicampur dalam ransum sebagai sumber Ca utama atau tambahan. Untuk pakan ikan dan udang: campurkan halus dan merata, Ca tersedia cepat di air/sistem pencernaan. Untuk unggas broiler dan babi: substitusi langsung tepung batu kapur.',
      kompatibilitas: 'Sama dengan batu kapur. Rasio Ca:P harus dikalkulasikan. Pasangkan dengan DCP/MCP untuk P. Hindari kombinasi langsung dengan Mg tinggi (kompetisi absorpsi).',
      catatan: 'Lebih mahal dari batu kapur alam namun konsistensi kualitas membuatnya lebih ekonomis dalam jangka panjang untuk formulasi presisi. Simpan dalam kondisi kering dan tertutup. Partikel sangat halus — gunakan masker debu saat penanganan.',
    },
    harga: {
      estimasiAI: 1500,
      hargaMarketplace: 1400,
      satuan: 'per kg',
      supplier: 'Distributor bahan kimia pakan (Jakarta, Surabaya); Toko pakan ternak premium; Importir: China Chalk Co., India Calcium Products',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'FAO (2016). Calcium carbonate for use in animal feeding. CXG 80-2013. Codex Alimentarius.',
        'McDowell, L.R. (2003). Minerals in Animal and Human Nutrition, 2nd Ed. Elsevier.',
        'Murakami, A.E., et al. (2012). Effects of different dietary calcium levels on laying hens. Rev. Bras. Cienc. Avic. 14(3):221–226.',
      ],
      sumberData: 'Komposisi mengacu pada spesifikasi teknis Calcium Carbonate Feed Grade (ISO 9001 certified). Nilai Ca mengacu pada analisis XRF produk industri standar.',
      catatan: 'Pastikan produk bersetifikat feed grade (Food Grade Certificate of Analysis dari supplier). Verifikasi kadar F <200 ppm dan heavy metals (Pb <10 ppm, As <2 ppm, Hg <0,1 ppm) sesuai regulasi pakan ternak.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '🏭',
        text: 'Kalsium Karbonat feed grade adalah pilihan terbaik untuk formulasi ransum berbasis komputer (least-cost formulation) karena nilai Ca sangat konsisten (±39% BK) antar batch. Perbedaan hanya ±1% dibanding batch sebelumnya vs batu kapur alam yang bisa berbeda ±5–6% Ca antar sumber.',
      },
      {
        type: 'kelebihan',
        icon: '✅',
        text: 'Kadar fluorida sangat rendah (<200 ppm) membuatnya aman untuk semua spesies ternak tanpa batas penggunaan terkait F. Heavy metal terkontrol (Pb, As, Hg) sesuai standar keamanan pangan. Ideal untuk pakan akuakultur intensif di mana kualitas air juga dipertimbangkan.',
      },
      {
        type: 'kombinasi',
        icon: '🔗',
        text: 'Kombinasikan dengan MCP (Monocalcium Phosphate) untuk ransum pakan ikan dan udang — keduanya memiliki kelarutan baik dalam air asam dan memberikan Ca + P tersedia segera. Pada ransum broiler: kombinasikan dengan DCP untuk sumber Ca + P yang ekonomis.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'Meski kemurnian tinggi, tetap perhatikan rasio Ca:P keseluruhan ransum. Kelebihan Ca pada unggas (>1,5× kebutuhan) menghambat absorpsi P, Zn, dan Mn secara signifikan. Selalu hitung total Ca dari semua sumber pakan termasuk bahan baku nabati.',
      },
    ],
    bentuk: ['Tepung'],
  },

  // ── 4. Dolomit ────────────────────────────────────────────────────────────────
  'dolomit': {
    namaKimia: 'Kalsium Magnesium Karbonat (Calcium Magnesium Carbonate)',
    asal: 'Tambang dolomit: Jawa Tengah (Rembang, Blora); Jawa Barat (Cianjur); Sulawesi Selatan. Deposito batu dolomit terbentuk dari metamorfosa batu kapur dengan penggantian Ca oleh Mg.',
    sumber: 'Batuan sedimen karbonat ganda CaMg(CO₃)₂ yang ditambang, dihancurkan, dan digiling. Berbeda dari limestone — mengandung MgCO₃ ±45% dan CaCO₃ ±55% dalam molekul yang sama.',
    bentukFisik: 'Butiran atau tepung, warna putih hingga abu-abu kecoklatan, lebih keras dari batu kapur biasa. Densitas lebih tinggi dari CaCO₃.',
    kelarutan: 'Lebih sulit larut dari batu kapur murni; kelarutan di rumen lebih lambat. Cocok untuk suplementasi lambat sepanjang hari pada ruminansia.',
    kelebihan: 'Sumber Ca dan Mg sekaligus dalam satu bahan — ekonomis untuk ruminansia yang membutuhkan kedua mineral. Mencegah hipomagnesemia (grass tetany) pada sapi merumput di padang rumput muda. Lebih murah dari kombinasi limestone + MgO.',
    kekurangan: 'Bioavailabilitas Ca lebih rendah dari limestone biasa karena ikatan Ca-Mg menghambat disolusi. Tidak cocok untuk unggas karena Mg berlebih menyebabkan litter basah (feces encer). Rasio Ca:Mg 2:1 tidak selalu sesuai kebutuhan ternak.',
    komposisi: {
      kemurnian: 87,
      ca: 21.5, p: 0.02, mg: 11.0, na: 0.05, k: 0.10, cl: 0.05, s: 0.02,
      fe: 4000, zn: 15, cu: 5, mn: 250, co: 1, iodine: 0.1, se: 0.1, cr: 5, mo: 1, f: 400,
      bioavailabilitas: 'Ca: ±55–60% (ruminansia); kurang direkomendasikan untuk unggas. Mg: ±40–55% (lebih rendah dari MgO tapi lebih mudah tersedia dari dolomit vs batu kapur dolomitik).',
      catatan: 'Kemurnian dolomit sangat bervariasi. Rasio Ca:Mg ideal dolomit stoikiometri adalah 1,09:1 (berat) atau 1,85:1 (Ca%:Mg%). Analisis aktual Ca dan Mg setiap batch sangat dianjurkan. Fe relatif tinggi (±4000 ppm) dari impuritas alaminya.',
    },
    penggunaan: {
      fungsiUtama: 'Suplementasi Ca dan Mg simultan untuk ruminansia. Khususnya efektif mencegah hipomagnesemia (grass tetany/milk tetany) pada sapi laktasi merumput di lahan tinggi kalium.',
      maksPenggunaan: 5,
      targetTernak: ['Sapi Perah', 'Sapi Pedaging', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Menyusui', 'Bunting', 'Penggemukan'],
      metodePemberian: 'Dicampur dalam ransum konsentrat atau diberikan sebagai suplemen bebas (free-choice mineral). Dapat dicampur dalam mineral blok sebagai komponen Ca-Mg. Jangan diberikan tunggal — perlu mineral lain untuk keseimbangan.',
      kompatibilitas: 'Kombinasikan dengan DCP untuk melengkapi P. Hindari kombinasi dengan MgO pada sapi yang sama (kelebihan Mg berisiko). Kombinasikan dengan NaCl untuk palatabilitas. Kompatibel dengan semua hijauan dan konsentrat ruminansia.',
      catatan: 'Dolomit tidak direkomendasikan untuk unggas karena Mg berlebih (>0,8% ransum) menyebabkan wet droppings, menurunkan kualitas litter, dan meningkatkan risiko penyakit kaki. Gunakan hanya untuk ruminansia. Suplementasi Mg via dolomit kurang presisi dibanding MgO — gunakan MgO untuk penanganan darurat grass tetany.',
    },
    harga: {
      estimasiAI: 900,
      hargaMarketplace: 850,
      satuan: 'per kg',
      supplier: 'Distributor mineral ternak; Tambang dolomit lokal (Jawa Tengah); Toko pertanian',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Suttle, N.F. (2010). Mineral Nutrition of Livestock, 4th Ed. CABI, Wallingford.',
        'Hynes, D.N., et al. (2008). Dietary dolomite as a source of Ca and Mg. Ir. J. Agric. Food Res. 47:91–101.',
        'Grace, N.D. (1983). The Mineral Requirements of Grazing Ruminants. New Zealand Soc. Animal Production, Hamilton.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
      ],
      sumberData: 'Komposisi mengacu pada McDowell (1992) dan Suttle (2010). Nilai Ca dan Mg adalah rata-rata dolomit Indonesia (BALITNAK 2015). Bioavailabilitas Ca dan Mg mengacu pada penelitian in vivo pada domba dan sapi perah.',
      catatan: 'Pastikan sumber dolomit bebas dari kontaminan berat (Pb, As, Ni). Beberapa dolomit alam mengandung logam berat tinggi tergantung geologi lokal. Lakukan analisis heavy metal sebelum penggunaan skala besar.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '🌿',
        text: 'Dolomit adalah solusi Ca+Mg satu langkah untuk ruminansia. Rumput muda dan tanaman pasca pemupukan K tinggi mengandung K sangat tinggi yang menghambat absorpsi Mg di usus (antagonisme K-Mg). Sapi merumput di lahan ini berisiko grass tetany (Mg darah turun di bawah 0,7 mmol/L) — gejala: tremor otot, kejang, kematian mendadak.',
      },
      {
        type: 'kekurangan',
        icon: '😰',
        text: 'Hipomagnesemia (grass tetany/hypomagnesemia): Mg darah <0,7 mmol/L. Gejala awal: kegelisahan, ataksia (berjalan tidak stabil), hipersensitivitas. Tahap lanjut: kejang tonik-klonik, kematian dalam 4–8 jam. Tidak ada cadangan Mg yang mudah dimobilisasi dari tulang — absorpsi ransum adalah satu-satunya sumber. Respon cepat: injeksi IV MgSO₄ 50% secara perlahan.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'Jangan gunakan pada unggas: Mg >0,8% ransum menyebabkan wet droppings, menurunkan kualitas litter, meningkatkan dermatitis kaki, dan menurunkan produksi telur. Dolomit bukan pengganti MgO untuk penanganan akut — bioavailabilitas Mg dolomit lambat. Untuk grass tetany akut, gunakan MgSO₄ injeksi IV.',
      },
      {
        type: 'kombinasi',
        icon: '🔗',
        text: 'Untuk pencegahan grass tetany: campurkan dolomit atau MgO dengan garam (NaCl) — palatabilitas meningkat, ternak lebih suka mengonsumsi mineral. Kombinasikan dengan DCP untuk melengkapi P dalam ransum konsentrat. Rasio Ca:Mg:P dalam ransum ruminansia ideal: Ca ±0,5–0,7% BK, Mg ±0,2–0,3% BK, P ±0,25–0,4% BK.',
      },
    ],
    bentuk: ['Butiran', 'Tepung'],
  },

  // ── 5. Dicalcium Phosphate (DCP) ─────────────────────────────────────────────
  'dicalcium-phosphate': {
    namaKimia: 'Dikalcium Fosfat / Kalsium Hidrogen Fosfat (Dicalcium Phosphate / Calcium Hydrogen Phosphate)',
    asal: 'Diproduksi secara industri. Impor utama: China, Vietnam, India. Domestik: PT Petrokimia Gresik (Phonska grade). Tersedia luas di distributor pakan ternak nasional.',
    sumber: 'Reaksi asam fosfat (H₃PO₄) dengan batu kapur atau Ca(OH)₂: CaCO₃ + H₃PO₄ → CaHPO₄ + H₂O + CO₂. Atau dari pemurnian rock phosphate. Feed grade memerlukan defluorinasi untuk F <1000 ppm.',
    bentukFisik: 'Granul atau tepung putih hingga krem, tidak berbau, tidak higroskopis. Tersedia dalam 2 bentuk: granular (0,5–3 mm) untuk ransum dan powder (<0,5 mm) untuk premix/pellet.',
    kelarutan: 'Sedikit larut dalam air (pH 7); larut baik dalam asam encer (HCl). P tersedia tinggi di lambung asam (pH <3) — absorpsi baik pada unggas dan babi.',
    kelebihan: 'Sumber Ca dan P tersedia terbaik untuk semua spesies; bioavailabilitas P ±100% (standar referensi); rasio Ca:P ≈1,2:1 (mendekati kebutuhan) sehingga satu bahan menyuplai kedua mineral penting; tersedia luas; harga moderat.',
    kekurangan: 'Perlu verifikasi kadar F (<1000 ppm untuk unggas; <1800 ppm untuk ruminansia); lebih mahal dari tepung batu kapur; tidak cukup menyuplai Ca untuk ayam petelur (perlu ditambah limestone). Perlu penyimpanan kering.',
    komposisi: {
      kemurnian: 96,
      ca: 23.0, p: 19.0, mg: 0.30, na: 0.20, k: 0.10, cl: 0.05, s: 0.10,
      fe: 800, zn: 30, cu: 5, mn: 50, co: 1, iodine: 0.2, se: 0.2, cr: 3, mo: 1, f: 700,
      bioavailabilitas: 'P: ±100% (referensi standar, NRC 1994). Ca: ±60–70% (semua spesies). Bioavailabilitas P DCP = standar 100% dalam sistem relative bioavailability (RBV) untuk unggas.',
      catatan: 'Rasio Ca:P = 1,21:1 (mendekati kebutuhan unggas 1,5:1 dan ruminansia 1,5–2:1). F <1000 ppm (feed grade). Produk DCP dihydrate (CaHPO₄·2H₂O) lebih umum di pasaran Indonesia; nilai Ca sedikit lebih rendah dari anhydrous karena air kristalisasi.',
    },
    penggunaan: {
      fungsiUtama: 'Mineral wajib dalam ransum unggas dan babi: menyuplai Ca dan P tersedia secara simultan. Digunakan sebagai "backbone" mineral ransum bersama limestone. Esensial untuk pembentukan tulang, metabolisme energi (ATP), dan reproduksi.',
      maksPenggunaan: 3,
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi', 'Ikan Budidaya', 'Udang', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      metodePemberian: 'Dicampur dalam ransum (kompon langsung dalam mixer). Level standar: unggas 1,0–2,0%; babi 0,8–1,5%; sapi 0,3–0,5% BK; ikan 1,0–1,5%. Selalu dikombinasikan dengan limestone untuk menyuplai Ca tambahan pada ayam petelur.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan. Tidak bereaksi dengan vitamin atau enzim dalam kondisi normal. Phytase meningkatkan utilisasi P dari bahan nabati — level DCP bisa dikurangi 25–30% jika phytase ditambahkan. Hindari penambahan Ca berlebihan yang dapat menghambat absorpsi P.',
      catatan: 'Standar kualitas feed grade: Ca ≥22%, P tersedia ≥17%, F ≤1000 ppm (unggas), ≤1800 ppm (ruminansia). Verifikasi Sertifikat Analisis (CoA) dari setiap batch supplier. DCP impor murah kadang mengandung F tinggi — risiko fluorosis ternak.',
    },
    harga: {
      estimasiAI: 7500,
      hargaMarketplace: 7200,
      satuan: 'per kg',
      supplier: 'Distributor pakan ternak nasional; PT Petrokimia Gresik; Importir: Kemira (Finlandia), OCP (Maroko), produk China',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.',
        'Soares, J.H. (1995). Phosphorus bioavailability. In: Bioavailability of Nutrients for Animals. Academic Press.',
        'Selle, P.H. & Ravindran, V. (2007). Microbial phytase in poultry nutrition. Anim. Feed Sci. Technol. 135:1–41.',
      ],
      sumberData: 'Komposisi mengacu pada NRC (1994, 2012) dan spesifikasi teknis DCP feed grade. Bioavailabilitas P sebagai standar referensi (100% RBV) mengacu pada Soares (1995) dan NRC (1994).',
      catatan: 'Perhatikan perbedaan DCP dihydrate (CaHPO₄·2H₂O) vs anhydrous (CaHPO₄): dihydrate mengandung ~21% air kristal, sehingga Ca actual ~23% dan P ~19% (lebih rendah dari anhydrous Ca ~29%, P ~23%). Produk Indonesia umumnya dihydrate.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '⚗️',
        text: 'DCP adalah "mineral wajib" dalam ransum unggas dan babi modern. Fosfor (P) berperan dalam SETIAP proses metabolik: sintesis ATP (energi), DNA/RNA, fosfolipid membran sel, sistem buffer darah (H₂PO₄⁻/HPO₄²⁻), dan aktivasi vitamin B. Ternak tidak bisa hidup tanpa P — bahkan kekurangan P ringan langsung menekan pertumbuhan dan produksi telur.',
      },
      {
        type: 'kekurangan',
        icon: '🦴',
        text: 'Defisiensi P: rachitis/rickets pada ternak muda (tulang lunak, kaki bengkok), osteomalasia pada dewasa (tulang rapuh, mudah patah). Pada unggas: menurunnya produksi telur (P esensial untuk pembentukan membran vitellin), kualitas kerabang buruk, pica (mematuk benda-benda non-pakan). Pada sapi: libido menurun, anestrus, menurunnya produksi susu.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'Kadar F wajib dicek: Feed grade F <1000 ppm (unggas); <1800 ppm (ruminansia). Fluorosis kronis (F >2500 ppm jangka panjang): mottling gigi, kelainan tulang (exostosis), pincang, penurunan produksi. DCP murah dari sumber tidak jelas bisa mengandung F >3000 ppm — BERBAHAYA. Selalu minta CoA dan uji F secara berkala.',
      },
      {
        type: 'kombinasi',
        icon: '🔗',
        text: 'Kombinasi optimal: DCP + Limestone untuk unggas (Ca dari limestone, Ca+P dari DCP). Tambahkan phytase (500–1000 FTU/kg) untuk melepas P fitat dari kedelai/jagung — bisa mengurangi penggunaan DCP 20–30% dengan tetap memenuhi kebutuhan P. Vitamin D3 wajib dalam premix untuk absorpsi Ca dan P optimal.',
      },
      {
        type: 'alternatif',
        icon: '🔄',
        text: 'MCP (Monocalcium Phosphate) mengandung P lebih tinggi (±24% vs 19%) dan kelarutan lebih baik — pilihan lebih baik untuk pakan ikan/udang. DFP (Defluorinated Phosphate) alternatif lebih murah dengan P lebih rendah. Tepung Tulang Mineral bisa sebagai substitusi parsial untuk ransum ruminansia.',
      },
    ],
    bentuk: ['Butiran', 'Tepung'],
  },

  // ── 6. Monocalcium Phosphate (MCP) ────────────────────────────────────────────
  'monocalcium-phosphate': {
    namaKimia: 'Monokalsium Fosfat / Kalsium Dihidrogen Fosfat (Monocalcium Phosphate / Calcium Dihydrogen Phosphate)',
    asal: 'Diproduksi secara industri dari reaksi asam fosfat konsentrasi tinggi. Impor utama: China, Eropa. Distribusi melalui agen bahan pakan ternak premium.',
    sumber: 'Reaksi kalsium karbonat atau kalsium hidroksida dengan asam fosfat berlebih: Ca(OH)₂ + 2H₃PO₄ → Ca(H₂PO₄)₂ + 2H₂O. Menghasilkan garam monobasic dengan kelarutan tinggi.',
    bentukFisik: 'Granul putih keabu-abuan, sedikit asam (pH larutan ±4), higroskopis — mudah menyerap kelembaban. Perlu penyimpanan dalam wadah tertutup.',
    kelarutan: 'Sangat larut dalam air — 1,8 g/100 mL (pH 7). Lebih larut dari DCP. Disolusi sangat cepat di lambung — P tersedia segera. Ideal untuk pakan aquakultur.',
    kelebihan: 'P tersedia tertinggi di antara sumber fosfat komersial (±24% BK); kelarutan tinggi memberikan P segera tersedia; bioavailabilitas P ≈ DCP; cocok untuk pakan ikan/udang. Kandungan Ca lebih rendah dari DCP — fleksibel untuk formula dengan Ca sudah dipenuhi dari limestone.',
    kekurangan: 'Harga paling mahal di antara sumber fosfat; higroskopis — risiko penggumpalan jika penyimpanan tidak baik; kandungan Ca lebih rendah dari DCP sehingga perlu lebih banyak limestone untuk mencukupi Ca.',
    komposisi: {
      kemurnian: 93,
      ca: 16.0, p: 24.0, mg: 0.20, na: 0.10, k: 0.05, cl: 0.03, s: 0.05,
      fe: 500, zn: 20, cu: 3, mn: 30, co: 0.5, iodine: 0.1, se: 0.1, cr: 2, mo: 0.5, f: 800,
      bioavailabilitas: 'P: ±100–110% (relatif terhadap DCP = 100%; beberapa penelitian melaporkan MCP lebih tinggi). Ca: ±65–70%. Kelarutan tinggi menjamin P tersedia di seluruh segmen usus halus.',
      catatan: 'MCP monohydrate: Ca(H₂PO₄)₂·H₂O — bentuk paling umum. Ca ±16%, P ±24%. Anhydrous: Ca ±17,5%, P ±26%. Sangat higroskopis — simpan rapat. F harus <1500 ppm feed grade.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber P tersedia tinggi untuk unggas starter, pakan ikan, dan udang. Digunakan saat kebutuhan P tinggi dan Ca sudah tercukupi dari sumber lain. Penting untuk ayam fase starter (tulang masih berkembang cepat).',
      maksPenggunaan: 2,
      targetTernak: ['Ayam Broiler (Starter)', 'Ikan Budidaya', 'Udang', 'Babi'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan'],
      metodePemberian: 'Dicampur merata dalam ransum. Untuk pakan ikan: granulasi dengan binder memastikan P tidak larut sebelum dikonsumsi. Untuk ayam starter: level 0,5–1,0%; babi starter 0,5–0,8%; ikan 1,0–2,0%.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan. Bersifat sedikit asam — dapat mengurangi pH campuran ransum; pertimbangkan jika menggunakan asam amino atau vitamin sensitif pH. Phytase sangat meningkatkan efisiensi P total ransum; kombinasikan untuk mengurangi penggunaan MCP.',
      catatan: 'Simpan dalam wadah kedap udara dan kering — sangat higroskopis. Hindari penyimpanan >6 bulan dalam kondisi lembab. Cek kelarutan: MCP murni larut jernih dalam air; produk terkontaminasi DCP membentuk endapan.',
    },
    harga: {
      estimasiAI: 9000,
      hargaMarketplace: 8500,
      satuan: 'per kg',
      supplier: 'Distributor bahan pakan premium; Importir produk Eropa/China; PT. Japfa Comfeed (subsidiary chemicals)',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'NRC (2011). Nutrient Requirements of Fish and Shrimp. National Academy Press.',
        'Ravindran, V. & Blair, R. (1992). Feed resources for poultry production in Asia and Pacific. World Poultry Sci. J. 48:205–231.',
        'Sugiura, S.H., et al. (2000). Phosphorus bioavailability in feed ingredients for salmonid fish. Aquaculture 182:299–310.',
      ],
      sumberData: 'Komposisi mengacu pada spesifikasi teknis MCP feed grade dan NRC (1994, 2011). Bioavailabilitas P mengacu pada Soares (1995) dan Ravindran (2000).',
      catatan: 'MCP feed grade harus memenuhi: P ≥22%, Ca ≤17,5%, F ≤1500 ppm, Pb ≤10 ppm, As ≤4 ppm. Untuk akuakultur, pastikan MCP digunakan bersama phytase untuk mengoptimalkan P. MCP menggantikan DCP dengan rasio 1:1,26 berdasarkan kandungan P.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '🐟',
        text: 'MCP adalah sumber fosfat pilihan untuk akuakultur (ikan dan udang) karena kelarutan tinggi memastikan P langsung tersedia di air dan sistem pencernaan. Ikan dan udang tidak memiliki phytase endogen yang cukup — P fitat dari pakan nabati hampir tidak terserap. MCP memberikan "P siap pakai" yang kritis untuk pertumbuhan tulang dan insang.',
      },
      {
        type: 'kelebihan',
        icon: '✅',
        text: 'Kandungan P tertinggi di antara sumber fosfat komersial (±24% BK) — lebih efisien secara volume untuk memenuhi kebutuhan P tinggi (unggas starter, induk babi). Formulasi menggunakan MCP membutuhkan volume mineral lebih kecil, menghemat ruang dalam formula dan mengurangi "dilution" bahan pakan lain.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'Higroskopisitas tinggi adalah tantangan utama: MCP dapat menggumpal keras (caking) dalam kondisi lembab tropis Indonesia. Penggumpalan bukan hanya masalah fisik — Ca(H₂PO₄)₂ yang menggumpal sebagian berkonversi ke DCP (kehilangan kelarutan). Simpan dalam silo tertutup atau karung berlapis polietilen. Gunakan dalam waktu <3 bulan setelah kemasan dibuka.',
      },
      {
        type: 'kombinasi',
        icon: '🔗',
        text: 'Kombinasikan dengan Batu Kapur atau CaCO₃ untuk mencukupi Ca. Tambahkan phytase (Ronozyme P, Natuphos, Axtra PHY) untuk membebaskan P fitat — efisiensi P meningkat 20–30%, biaya MCP bisa ditekan. Vitamin D3 wajib untuk absorpsi Ca dan P optimal di usus.',
      },
    ],
    bentuk: ['Butiran', 'Tepung'],
  },

  // ── 7. Defluorinated Phosphate (DFP) ─────────────────────────────────────────
  'defluorinated-phosphate': {
    namaKimia: 'Fosfat Defluorinasi (Defluorinated Rock Phosphate)',
    asal: 'Diproduksi dari rock phosphate (batu fosfat alam) yang diproses pada suhu tinggi. Bahan baku: deposit rock phosphate Maroko (OCP), China, atau Timur Tengah. Proses defluorinasi dilakukan di pabrik khusus.',
    sumber: 'Rock phosphate alam (apatit: Ca₁₀(PO₄)₆F₂) dipanaskan hingga ≥800°C dengan penambahan SiO₂ atau Na₂SiF₆ untuk menguapkan F. Proses kalsinasi menghasilkan produk dengan F <0,18% tetapi mengubah sebagian struktur kristal, menurunkan kelarutan P.',
    bentukFisik: 'Granul atau tepung abu-abu hingga kecoklatan, bau khas mineral, lebih keras dari DCP. Warna bervariasi tergantung kandungan Fe dan mineral lain dari deposit asal.',
    kelarutan: 'Kelarutan P lebih rendah dari DCP/MCP karena suhu tinggi mengkonversi sebagian CaHPO₄ menjadi Ca₃(PO₄)₂ dan CaF₂ → Ca₃(PO₄)₂ + SiF₄. P tersedia tergantung tes sitrat (in vitro).',
    kelebihan: 'Harga lebih murah dari DCP dan MCP; Ca sangat tinggi (±32%); kandungan Ca+P dalam satu bahan cukup untuk kebutuhan dasar ruminansia; tersedia dari sumber domestik (impor Maroko relatif terjangkau).',
    kekurangan: 'Bioavailabilitas P lebih rendah (±75–85% vs DCP 100%); WAJIB verifikasi F <0,18% setiap batch karena fluorosis sangat berbahaya; kualitas sangat bervariasi antar produsen; tidak disarankan untuk unggas karena bioavailabilitas P rendah dan risiko F.',
    komposisi: {
      kemurnian: 85,
      ca: 32.0, p: 17.5, mg: 0.50, na: 0.30, k: 0.10, cl: 0.05, s: 0.10,
      fe: 3000, zn: 100, cu: 10, mn: 200, co: 2, iodine: 0.5, se: 0.3, cr: 10, mo: 2, f: 1500,
      bioavailabilitas: 'P: ±75–85% (relatif DCP=100%) untuk unggas; ±80–90% untuk ruminansia. Ca: ±55–65%. Bioavailabilitas P rendah dibandingkan DCP karena ikatan Ca₃(PO₄)₂ kurang larut.',
      catatan: 'F harus <1800 ppm (0,18%) untuk semua spesies. Nilai F aktual harus diverifikasi dari CoA setiap batch — rock phosphate alam bisa mengandung F >4000 ppm sebelum defluorinasi. Fe relatif tinggi (±3000 ppm) — perlu dipertimbangkan dalam formula trace mineral. Rasio Ca:P ≈1,83:1.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber Ca dan P ekonomis untuk ruminansia. Digunakan sebagai alternatif DCP yang lebih murah pada formulasi ransum sapi dan domba.',
      maksPenggunaan: 2,
      targetTernak: ['Sapi Pedaging', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Menyusui', 'Bunting'],
      metodePemberian: 'Dicampur dalam konsentrat atau mineral lick/blok. Level: sapi 0,3–0,5% BK ransum; kambing/domba 0,4–0,6% BK. Gunakan phytase pada ransum berbasis biji-bijian untuk memaksimalkan P.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan ruminansia. Jangan gunakan untuk unggas tanpa verifikasi F ketat (<1000 ppm feed grade unggas). Hindari kombinasi dengan mineral F tinggi lainnya.',
      catatan: 'KRITIS: Uji F setiap batch baru — fluorosis adalah risiko nyata jika F melewati batas. Gejala fluorosis kronis muncul bertahap (berbulan-bulan): mottling gigi, lameness, penurunan produksi susu, diare. Tidak ada antidot; pencegahan adalah satu-satunya solusi. Simpan terpisah dari bahan pakan lain untuk menghindari kontaminasi debu F.',
    },
    harga: {
      estimasiAI: 5500,
      hargaMarketplace: 5200,
      satuan: 'per kg',
      supplier: 'Importir mineral pakan; Distributor pakan ruminansia; OCP Group (Maroko) melalui agen lokal',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2005). Mineral Tolerance of Animals, 2nd Rev. Ed. National Academy Press.',
        'Beighle, D.E. (1999). Determining and maintaining proper mineral status. Vet. Clin. North Am. Food Anim. Pract. 15:423–448.',
        'Shupe, J.L., et al. (1984). Fluoride in feeds, water and animal tissues. J. Anim. Sci. 58:839–853.',
        'Cromwell, G.L. (1992). The biological availability of phosphorus in feedstuffs for pigs. Pig News Inf. 13:75N–78N.',
      ],
      sumberData: 'Komposisi mengacu pada spesifikasi DFP feed grade dan NRC (2005). Bioavailabilitas P mengacu pada Cromwell (1992) dan Soares (1995).',
      catatan: 'Standar kualitas DFP internasional: P ≥16%, Ca ≥28%, F ≤0,18%, Pb ≤30 ppm, As ≤10 ppm, Cd ≤10 ppm. Verifikasi standar AFMA (Association of Feed Manufacturers) untuk DFP yang diimpor ke Indonesia.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '⚗️',
        text: 'DFP adalah pilihan mineral Ca+P paling ekonomis untuk ruminansia skala besar (feedlot, peternakan sapi perah intensif). Kandungan Ca sangat tinggi (±32%) dan P tersedia cukup (±17%) — satu bahan hampir mencukupi kebutuhan Ca dan P ruminansia tanpa perlu tambahan limestone yang terpisah.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: '⚠️ FLUOROSIS adalah risiko utama DFP. Fluorida berlebihan (>2500 ppm jangka panjang) menyebabkan: (1) dental fluorosis — mottling/pitting gigi, gigi rapuh; (2) skeletal fluorosis — exostosis (tumbuh tulang abnormal di mandibula, metacarpal, metatarsal, ribs), lameness permanen; (3) sulit makan akibat nyeri gigi/sendi. Tidak reversibel. Uji F SETIAP BATCH dan dokumentasikan.',
      },
      {
        type: 'kekurangan',
        icon: '🔍',
        text: 'Bioavailabilitas P DFP (75–85%) lebih rendah dari DCP (100%) — artinya perlu lebih banyak DFP untuk memenuhi kebutuhan P yang sama. Formulasi harus menggunakan "P tersedia" bukan "P total". Panas tinggi saat defluorinasi mengubah sebagian CaHPO₄ → Ca₃(PO₄)₂ yang kurang larut.',
      },
      {
        type: 'kombinasi',
        icon: '🔗',
        text: 'Kombinasikan dengan garam (NaCl) untuk palatabilitas dalam mineral lick ruminansia. Tambahkan phytase jika ransum mengandung biji-bijian untuk meningkatkan P total. Hindari kombinasi dengan air minum berfluorida tinggi (>1 ppm F di air) — F kumulatif bisa melewati batas aman.',
      },
    ],
    bentuk: ['Butiran', 'Tepung'],
  },

  // ── 8. Tepung Tulang Mineral ──────────────────────────────────────────────────
  'tepung-tulang-mineral': {
    namaKimia: 'Kalsium Fosfat Terhidroksilasi / Hidroksiapatit (Steamed Bone Meal / Hydroxyapatite)',
    asal: 'Pabrik rendering dari Rumah Potong Hewan (RPH) sapi, babi, dan unggas. Tersedia di daerah peternakan intensif: Jawa Timur, Jawa Tengah, Bali. Impor: Australia, New Zealand (grade premium).',
    sumber: 'Tulang sapi, babi, atau unggas dari RPH dikukus bertekanan tinggi (autoclaving 135°C, 3–4 jam) untuk sterilisasi dan ekstraksi lemak-protein, kemudian dikeringkan dan digiling. Produk berbeda dari Tepung Daging & Tulang (MBM) — protein minimal.',
    bentukFisik: 'Tepung putih keabu-abuan, bau khas tulang matang, butiran halus. Berbeda dari MBM: warna lebih putih, protein lebih rendah, Ca/P lebih tinggi.',
    kelarutan: 'P dari hidroksiapatit relatif tidak larut pada pH netral; larut dalam asam (pH <3). Bioavailabilitas P tergantung intensitas autoclaving — terlalu tinggi mengurangi kelarutan.',
    kelebihan: 'Sumber Ca dan P alami dengan rasio Ca:P ≈2:1 (ideal untuk ruminansia); menyuplai trace mineral alami (Mn, Zn, Fe); bahan lokal tersedia dari RPH nasional; P dalam bentuk hidroksiapatit memiliki kelarutan lambat (sustained release).',
    kekurangan: 'Kualitas sangat bervariasi antar RPH dan proses autoclaving; bioavailabilitas P lebih rendah dari DCP; F bisa tinggi dari tulang ternak yang mengonsumsi air/pakan berfluoridasi; risiko BSE/prion pada MBM sapi untuk ruminansia (Tepung Tulang Mineral berbeda dari MBM, tetapi tetap perlu kehati-hatian).',
    komposisi: {
      kemurnian: 92,
      ca: 28.0, p: 13.0, mg: 0.55, na: 0.10, k: 0.10, cl: 0.05, s: 0.10,
      fe: 1500, zn: 150, cu: 8, mn: 50, co: 1, iodine: 0.3, se: 0.3, cr: 2, mo: 1, f: 2000,
      bioavailabilitas: 'P: ±70–80% (ruminansia); ±60–70% (unggas) — lebih rendah dari DCP karena Ca₁₀(PO₄)₆(OH)₂ (hidroksiapatit) kurang larut. Ca: ±60–65%.',
      catatan: 'Rasio Ca:P ≈2,15:1 (ideal untuk sapi). Protein residual ±5–10% BK (perlu dipertimbangkan dalam formula protein). F bisa tinggi (±2000 ppm) — verifikasi jika untuk unggas. Mn dan Zn dari tulang tersedia baik karena terikat dalam matriks organik.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber Ca dan P alami seimbang untuk ruminansia. Juga menyediakan trace mineral tulang (Mn, Zn). Digunakan dalam mineral supplement konsentrat.',
      maksPenggunaan: 3,
      targetTernak: ['Sapi Pedaging', 'Sapi Perah', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Indukan', 'Menyusui', 'Bunting', 'Grower'],
      metodePemberian: 'Dicampur dalam konsentrat atau mineral lick. Level: sapi 0,3–0,5% BK ransum; babi 0,5–1,0%. Tidak direkomendasikan untuk ayam layer (F terlalu tinggi, bioavailabilitas P rendah untuk unggas).',
      kompatibilitas: 'Kompatibel dengan semua pakan ruminansia. Kombinasikan dengan garam dan trace mineral premix untuk suplemen mineral lengkap. Phytase tidak meningkatkan bioavailabilitas P hidroksiapatit (phytase bekerja pada P fitat, bukan hidroksiapatit).',
      catatan: 'Verifikasi asal tulang: tulang sapi dari RPH yang tidak menggunakan limbah saraf/sumsum (untuk menghindari risiko prion) adalah standar keamanan internasional. Cek kandungan F terutama jika tulang dari daerah dengan air berfluorida tinggi. Simpan kering — rentan terhadap kapang.',
    },
    harga: {
      estimasiAI: 5000,
      hargaMarketplace: 4800,
      satuan: 'per kg',
      supplier: 'RPH lokal; pabrik rendering; distributor pakan ternak (Jatim, Jateng)',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
        'Mahan, D.C., et al. (2004). Bone mineral composition of swine. J. Anim. Sci. 82:2434–2444.',
        'Suttle, N.F. (2010). Mineral Nutrition of Livestock, 4th Ed. CABI.',
        'Pond, W.G., et al. (1995). Basic Animal Nutrition and Feeding, 4th Ed. John Wiley.',
      ],
      sumberData: 'Komposisi mengacu pada McDowell (1992) dan Suttle (2010). Nilai Ca:P ratio mengacu pada analisis hidroksiapatit tulang ruminansia.',
      catatan: 'Perhatikan regulasi penggunaan produk animal by-product untuk ternak ruminansia. Di Indonesia, penggunaan Tepung Tulang Mineral untuk ruminansia umumnya diperbolehkan dari tulang unggas/ikan. Ikuti regulasi SNI dan peraturan BSN terkait keamanan pakan.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '🦴',
        text: 'Tepung Tulang Mineral mengandung Ca dan P dalam bentuk hidroksiapatit — struktur kristal yang sama dengan mineral tulang hewan itu sendiri. Ini secara biologis merupakan "sumber Ca dan P paling alamiah" yang bisa diberikan. Rasio Ca:P ≈2:1 sesuai kebutuhan ruminansia dan lebih alami dari produk kimia sintetis.',
      },
      {
        type: 'kelebihan',
        icon: '✅',
        text: 'Selain Ca dan P, tepung tulang menyediakan trace mineral tulang dalam bentuk organik yang tersedia baik: Zn (±150 ppm), Mn (±50 ppm), Fe (±1500 ppm). Trace mineral terikat dalam matriks kolagen tulang memiliki bioavailabilitas lebih baik dari garam anorganik. Bahan lokal, mudah didapat dari RPH.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'Fluorida bisa tinggi (±2000 ppm) pada tepung tulang dari ternak yang mengonsumsi air berfluorida. Batas aman F untuk ruminansia 1800 ppm — tepung tulang bisa mendekati/melewati batas jika sumber tulangnya sudah mengakumulasi F. Uji F setiap batch. Jangan digunakan untuk unggas (F tinggi + bioavailabilitas P rendah).',
      },
      {
        type: 'alternatif',
        icon: '🔄',
        text: 'Untuk presisi formulasi: ganti dengan DCP (P lebih tersedia, konsisten). Untuk ekonomis: DFP. Untuk ruminansia alami/organik: Tepung Tulang Mineral adalah pilihan tepat karena bahan alami. Perhatikan regulasi: beberapa negara melarang tepung tulang sapi untuk ransum ruminansia (BSE concern) — gunakan tepung tulang ayam/ikan sebagai alternatif.',
      },
    ],
    bentuk: ['Tepung'],
  },

  // ── 9. Garam (NaCl) ───────────────────────────────────────────────────────────
  'garam-nacl': {
    namaKimia: 'Natrium Klorida (Sodium Chloride)',
    asal: 'Tambak garam: Madura, Cirebon, NTT, Sulawesi. Garam ternak industri: PT Garam (Persero). Garam feed grade diproses lebih lanjut (pengeringan, penggilingan).',
    sumber: 'Penguapan air laut (solar evaporation) atau penambangan garam batu (rock salt). Garam ternak/feed grade: garam rakyat dimurnikan hingga NaCl ≥97%, kadar air <2%, kadang difortifikasi dengan yodium.',
    bentukFisik: 'Kristal putih atau butiran halus, rasa asin, higroskopis pada kelembaban >75%. Tersedia dalam bentuk: halus (untuk ransum), kasar (mineral lick), dan blok (mineral block).',
    kelarutan: 'Sangat larut dalam air (36 g/100 mL pada 25°C). Disolusi sangat cepat dalam cairan tubuh. Meningkatkan palatabilitas mineral lain (garam sebagai "carrier" mineral kurang palatable).',
    kelebihan: 'Sumber Na dan Cl paling murah dan mudah didapat; meningkatkan palatabilitas ransum dan mineral lick; esensial untuk keseimbangan elektrolit dan fungsi saraf; tersedia di seluruh Indonesia.',
    kekurangan: 'Kelebihan garam (>2% ransum unggas) menyebabkan polydipsia, polyuria, wet litter, dan meningkatkan risiko penyakit kaki. Air minum harus SELALU tersedia saat garam ditingkatkan. Tidak menyediakan mineral lain yang signifikan.',
    komposisi: {
      kemurnian: 98,
      ca: 0.05, p: 0.02, mg: 0.05, na: 39.0, k: 0.05, cl: 61.0, s: 0.02,
      fe: 50, zn: 5, cu: 1, mn: 5, co: 0.1, iodine: 40, se: 0.1, cr: 1, mo: 0.2, f: 10,
      bioavailabilitas: 'Na: ±100% (sangat tinggi, ionisasi sempurna dalam larutan). Cl: ±100%. Salah satu mineral dengan bioavailabilitas tertinggi.',
      catatan: 'Iodium ±40 ppm pada garam beryodium (sesuai standar SNI 3556:2010 garam konsumsi beryodium 30–80 ppm). Garam ternak non-yodium: I ±0–5 ppm. Na (39%) dan Cl (61%) hampir sempurna — total ~100% dari NaCl murni. Nilai di atas pada kemurnian 98%.',
    },
    penggunaan: {
      fungsiUtama: 'Menyuplai Na dan Cl — kation-anion utama cairan ekstrasel dan intraseluler. Mengatur tekanan osmotik, keseimbangan asam-basa (pH), transmisi impuls saraf, kontraksi otot, dan absorpsi glukosa/asam amino di usus.',
      maksPenggunaan: 2,
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Sapi Pedaging', 'Sapi Perah', 'Kambing', 'Domba', 'Babi', 'Ikan Budidaya'],
      programCocok: ['Penggemukan', 'Indukan', 'Bunting', 'Menyusui', 'Grower', 'Pejantan'],
      metodePemberian: 'Dicampur dalam ransum (0,25–0,5% untuk unggas; 0,2–0,4% untuk babi; 0,4–0,8% BK untuk ruminansia). Free-choice mineral lick/blok untuk ruminansia (sapi 30–100 g/hari; kambing/domba 10–20 g/hari). Air minum bersih SELALU tersedia.',
      kompatibilitas: 'Sangat kompatibel dengan semua bahan pakan. Garam adalah "carrier" ideal untuk mineral trace yang tidak palatabel (MgO, kapur). Dalam mineral lick: campurkan garam + DCP + MgO + trace mineral premix untuk suplemen mineral lengkap.',
      catatan: 'KESEIMBANGAN ELEKTROLIT (dEB) ransum unggas = Na + K − Cl (mEq/kg). Target dEB: broiler 200–250 mEq/kg; petelur 180–220 mEq/kg. Saat stres panas, tingkatkan NaHCO₃ dan turunkan garam untuk menjaga dEB optimal. Pastikan garam merata tercampur — hot spot garam lokal bisa menyebabkan keracunan lokal.',
    },
    harga: {
      estimasiAI: 1200,
      hargaMarketplace: 1000,
      satuan: 'per kg',
      supplier: 'PT Garam (Persero); pasar tradisional; distributor pakan ternak; produksi lokal Madura, Cirebon',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
        'Damron, B.L. (2000). Salt and sodium requirements of poultry. Proc. Florida Poultry Institute. University of Florida.',
        'Leeson, S. & Summers, J.D. (2001). Nutrition of the Chicken, 4th Ed. University Books, Guelph.',
      ],
      sumberData: 'Komposisi mengacu pada analisis NaCl food/feed grade standar. Na dan Cl menggunakan nilai teoritik NaCl murni (Na 22,99 g/mol; Cl 35,45 g/mol; total 58,44 g/mol).',
      catatan: 'Garam beryodium (SNI 3556:2010) mengandung I minimal 30 ppm — membantu mencegah defisiensi yodium pada ternak jika tidak ada yodium dalam premix. Tetapi garam non-yodium (grade ternak) sering lebih murah. Pilih sesuai kebutuhan.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '⚡',
        text: 'Natrium (Na) adalah kation utama cairan ekstrasel tubuh, mengendalikan distribusi air antar kompartemen (konsep osmolalitas). Klorida (Cl) adalah anion utama cairan ekstrasel dan lambung (HCl untuk aktivasi pepsinogen). Tanpa Na dan Cl yang cukup, absorpsi glukosa dan asam amino di usus halus terganggu — pertumbuhan langsung terhambat.',
      },
      {
        type: 'kekurangan',
        icon: '💧',
        text: 'Defisiensi Na: penurunan konsumsi pakan, pertumbuhan terhambat, pica (mematuk dan memakan benda asing termasuk bulu, kotoran), kanibalisme pada unggas. Defisiensi Cl: alkalosis metabolik, gangguan pencernaan (pH lambung naik, aktivasi pepsin berkurang), pertumbuhan terhambat. Sapi: defisiensi Na menyebabkan penurunan produksi susu, dehidrasi, dan kehilangan nafsu makan.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'Keracunan garam (salt poisoning) pada unggas dengan akses air terbatas: >2% ransum menyebabkan wet litter, dermatitis kaki (bumblefoot), ascites, dan kematian. Pada babi: garam >2,5% + air terbatas menyebabkan edema otak (poioencephalomalacia salt), kejang, kematian mendadak. Pastikan SELALU air minum bersih ad libitum saat menggunakan garam tinggi.',
      },
      {
        type: 'kombinasi',
        icon: '🔗',
        text: 'Garam adalah komponen kunci dalam pengaturan dEB (Dietary Electrolyte Balance) ransum. Saat stres panas musim kemarau: tambahkan NaHCO₃ 0,1–0,2% menggantikan sebagian garam untuk buffer darah + hindari alkalosis respiratorik. Kombinasikan garam dengan MgO dalam mineral lick ruminansia — garam meningkatkan palatabilitas MgO yang kurang disukai ternak.',
      },
    ],
    bentuk: ['Butiran', 'Tepung'],
  },

  // ── 10. Magnesium Oksida (MgO) ────────────────────────────────────────────────
  'magnesium-oksida': {
    namaKimia: 'Magnesium Oksida (Magnesium Oxide / Calcined Magnesite)',
    asal: 'Diproduksi dari kalsinasi magnesit (MgCO₃) atau dolomit pada suhu >700°C (caustic calcined magnesia). Sumber magnesit: China (produsen terbesar), Austria, Turki. Tersedia melalui importir bahan kimia pakan.',
    sumber: 'MgCO₃ (magnesit) dipanaskan pada 700–1000°C: MgCO₃ → MgO + CO₂. Suhu kalsinasi mempengaruhi reaktivitas: suhu rendah (<800°C) → MgO reaktif (light-burned); suhu tinggi (>1200°C) → MgO dead-burned (kurang reaktif). Untuk pakan ternak, gunakan light-burned MgO (reaktivitas >70%).',
    bentukFisik: 'Serbuk atau butiran putih, bau khas alkalin, tidak larut dalam air dingin. pH larutan berair >10 (sangat basa). Bulk density ±0,3–0,5 kg/L (ringan).',
    kelarutan: 'Larut lambat dalam air (kelarutan rendah 0,006 g/100 mL). Kelarutan meningkat dalam larutan asam. Reaktivitas (citric acid test) menentukan bioavailabilitas — MgO reaktif (citric acid value >70%) lebih baik.',
    kelebihan: 'Konsentrasi Mg tertinggi di antara sumber Mg (±58%); satu-satunya sumber Mg yang digunakan secara luas untuk mencegah grass tetany pada sapi; tersedia luas secara global; stabil dalam penyimpanan.',
    kekurangan: 'Bioavailabilitas Mg sangat bervariasi (30–70%) tergantung reaktivitas MgO; tidak palatabel (ternak menolak jika diberikan tunggal — perlu dicampur garam); tidak mengandung Ca atau P; mahal dibanding dolomit.',
    komposisi: {
      kemurnian: 92,
      ca: 0.50, p: 0.05, mg: 58.0, na: 0.10, k: 0.05, cl: 0.05, s: 0.02,
      fe: 2000, zn: 50, cu: 5, mn: 100, co: 1, iodine: 0.1, se: 0.1, cr: 5, mo: 1, f: 50,
      bioavailabilitas: 'Mg: ±30–70% (sangat bervariasi tergantung reaktivitas/citric acid value MgO). MgO reaktivitas tinggi (CAV >70%): ±55–70%. MgO dead-burned (CAV <30%): ±30–40%. Selalu pilih MgO dengan CAV >60% untuk pakan ternak.',
      catatan: 'Citric Acid Value (CAV) adalah parameter kunci: ≥70% untuk pakan ternak (NRC 2001). MgO murah sering dead-burned (reaktivitas rendah). Fe (±2000 ppm) dari impuritas mineral. Simpan kering — MgO menyerap CO₂ dan air membentuk Mg(OH)₂ dan MgCO₃ yang kurang reaktif.',
    },
    penggunaan: {
      fungsiUtama: 'Suplementasi Mg utama untuk ruminansia, terutama pencegahan hipomagnesemia (grass tetany). Mg berperan dalam 300+ reaksi enzimatis, sintesis protein, metabolisme glukosa, dan transmisi sinaptik.',
      maksPenggunaan: 1,
      targetTernak: ['Sapi Perah', 'Sapi Pedaging', 'Kambing', 'Domba'],
      programCocok: ['Indukan', 'Menyusui', 'Bunting', 'Penggemukan'],
      metodePemberian: 'Dicampur dalam konsentrat (tidak palatabel jika diberikan tunggal — campurkan dengan garam 1:1 atau molases). Level pencegahan grass tetany: sapi laktasi 20–30 g/hari; sapi kering 10–15 g/hari. Free-choice: campurkan 1 bagian MgO + 4 bagian garam. Dapat diberikan via drenching cair (suspensi MgO) untuk kasus akut.',
      kompatibilitas: 'Tidak kompatibel dengan asam — penggunaan bersamaan dengan asam organik menurunkan ketersediaan Mg. Kombinasikan dengan NaCl untuk palatabilitas. Di rumen, Mg bersaing dengan K dan N-NH₃ untuk absorpsi — hindari ransum K tinggi + Mg rendah pada sapi merumput.',
      catatan: 'Untuk penanganan darurat grass tetany: injeksi subkutan Ca-Mg boroglukonate (500 mL larutan 25%) SEGERA — jangan tunda. MgO oral hanya untuk pencegahan, bukan pengobatan akut. Grass tetany dapat menyebabkan kematian dalam 4–8 jam sejak gejala pertama.',
    },
    harga: {
      estimasiAI: 8000,
      hargaMarketplace: 7500,
      satuan: 'per kg',
      supplier: 'Importir bahan kimia pakan; distributor mineral ternak premium; agen produk China/Austria',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Suttle, N.F. (2010). Mineral Nutrition of Livestock, 4th Ed. CABI.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
        'Grace, N.D. (1983). The Mineral Requirements of Grazing Ruminants. NZ Soc. Anim. Prod.',
        'Lean, I.J., et al. (2013). Supplementation of magnesium oxide to grazing dairy cattle. J. Dairy Sci. 96:4604–4617.',
      ],
      sumberData: 'Komposisi mengacu pada McDowell (1992), Suttle (2010), dan spesifikasi MgO feed grade. Rentang bioavailabilitas Mg mengacu pada penelitian Spears (1994) dan Lean (2013).',
      catatan: 'Citric Acid Value (CAV) wajib tercantum dalam CoA. CAV >70% adalah standar minimum untuk pakan ternak (NRC 2001). Verifikasi reaktivitas setiap batch baru — produk murah sering dead-burned. Simpan terpisah dari bahan asam.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '⚡',
        text: 'Magnesium adalah kofaktor untuk >300 enzim metabolik termasuk semua enzim yang menggunakan ATP (Mg-ATP kompleks). Ini berarti hampir SETIAP reaksi yang menghasilkan atau menggunakan energi bergantung pada Mg. Sintesis DNA, RNA, dan protein semuanya membutuhkan Mg. Pada sapi, ±70% Mg tubuh dalam tulang (cadangan lambat) — absorpsi ransum sehari-hari kritis.',
      },
      {
        type: 'kekurangan',
        icon: '😰',
        text: 'Grass Tetany (Hipomagnesemia) adalah emergensi veteriner. Faktor risiko: (1) sapi laktasi awal pasca-melahirkan (kebutuhan Mg tinggi untuk susu), (2) merumput di padang rumput muda tinggi K dan N (K menghambat absorpsi Mg di usus), (3) cuaca dingin tiba-tiba (stres → peningkatan kebutuhan Mg). Gejala: hyperexcitability, tetani, convulsions, kematian. Tidak ada cadangan Mg mobilisable cepat seperti Ca dari tulang.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'Kelebihan Mg (>0,5% ransum) menyebabkan diare pada ruminansia dan wet droppings pada unggas. Pada babi: >0,35% BK ransum menyebabkan diare dan penurunan konsumsi. Dosis akut tinggi MgO bisa menyebabkan hipermagnesemia: depresi CNS, kelumpuhan otot napas, kematian. Jangan overdose.',
      },
      {
        type: 'kombinasi',
        icon: '🔗',
        text: 'Resep mineral lick anti-grass-tetany (per 100 kg): NaCl 50 kg + MgO 25 kg + DCP 15 kg + trace mineral premix 2 kg + S 2 kg + binder 6 kg. Konsumsi target sapi: 50–100 g/hari. Tambahkan molases 5–10% untuk meningkatkan palatabilitas MgO yang tidak enak. Molases + MgO = kombinasi klasik untuk grass tetany prevention.',
      },
    ],
    bentuk: ['Tepung', 'Butiran'],
  },

  // ── 11. Magnesium Sulfat (MgSO₄) ─────────────────────────────────────────────
  'magnesium-sulfat': {
    namaKimia: 'Magnesium Sulfat Monohidrat (Kieserite) / Magnesium Sulfat Heptahidrat (Epsomit)',
    asal: 'Kieserite (MgSO₄·H₂O): tambang mineral, impor Jerman (K+S Group), China. Epsom salt (MgSO₄·7H₂O): diproduksi sintetis dari MgO + H₂SO₄. Tersedia melalui importir bahan kimia.',
    sumber: 'Kieserite: mineral alam tambang evaporit. Epsom salt: reaksi MgO + H₂SO₄ → MgSO₄ + H₂O, kemudian kristalisasi. Feed grade: kieserite diproses dan diayak untuk konsistensi ukuran partikel.',
    bentukFisik: 'Kieserite: granul putih keabuan, tidak terlalu higroskopis. Epsom salt (heptahidrat): kristal putih berbentuk jarum/prisma, higroskopis. Larut dalam air menghasilkan larutan netral-sedikit asam.',
    kelarutan: 'Sangat larut dalam air: MgSO₄ ±71 g/100 mL (25°C). Kelarutan jauh lebih tinggi dari MgO dan dolomit — Mg tersedia segera dalam cairan tubuh. Cocok untuk suplementasi via air minum.',
    kelebihan: 'Kelarutan tinggi memberikan Mg segera tersedia; juga menyuplai S (esensial untuk sintesis metionin, sistin pada ruminansia); bisa diberikan via air minum (larutan MgSO₄) untuk memastikan konsumsi; palatabilitas lebih baik dari MgO.',
    kekurangan: 'Kandungan Mg lebih rendah dari MgO (17% vs 58%); bersifat laksatif jika berlebihan (>1% ransum); Epsom salt higroskopis — risiko penggumpalan; lebih mahal per unit Mg dibanding MgO.',
    komposisi: {
      kemurnian: 99,
      ca: 0.10, p: 0.02, mg: 17.0, na: 0.05, k: 0.05, cl: 0.05, s: 23.0,
      fe: 50, zn: 10, cu: 2, mn: 5, co: 0.1, iodine: 0.1, se: 0.1, cr: 1, mo: 0.2, f: 10,
      bioavailabilitas: 'Mg: ±70–85% (sangat baik karena kelarutan tinggi). S: ±80–90% sebagai sulfat. Kelarutan tinggi = bioavailabilitas tinggi untuk Mg dan S.',
      catatan: 'Nilai di atas untuk kieserite (MgSO₄·H₂O): Mg 17%, S 23%. Untuk epsom salt (MgSO₄·7H₂O): Mg 9,9%, S 13% (per berat produk basah). Harga biasanya dinyatakan per kg — kieserite lebih ekonomis karena konsentrasi Mg lebih tinggi.',
    },
    penggunaan: {
      fungsiUtama: 'Suplementasi Mg dan S simultan. Khusus untuk ruminansia: S dari MgSO₄ diperlukan mikroba rumen untuk sintesis asam amino sulfur (metionin, sistin) dari NPN (urea). Mg untuk pencegahan hipomagnesemia dan fungsi enzimatis.',
      maksPenggunaan: 1,
      targetTernak: ['Sapi Perah', 'Sapi Pedaging', 'Kambing', 'Domba', 'Ayam Broiler'],
      programCocok: ['Indukan', 'Menyusui', 'Penggemukan', 'Grower'],
      metodePemberian: 'Dicampur dalam ransum atau diberikan via air minum (0,1–0,2% larutan). Level: sapi 20–25 g/hari untuk Mg suplementasi; unggas 0,2–0,4% ransum untuk S+Mg. Lebih mudah dicampur merata dalam ransum vs MgO karena granul halus.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan. Kombinasi dengan urea pada ruminansia: MgSO₄ menyediakan S untuk mikroba rumen yang menggunakan N dari urea untuk sintesis protein. Hati-hati: efek laksatif di atas dosis — pastikan tidak over-supplement.',
      catatan: 'Epsom salt (MgSO₄·7H₂O) lebih higroskopis dari kieserite — simpan rapat. Gunakan kieserite untuk pakan granul/pellet (lebih stabil). Untuk darurat grass tetany sapi: larutan 50% MgSO₄ diinjeksi SUBKUTAN perlahan (bukan IV cepat — risiko cardiac arrest). Sering dikombinasikan dengan Ca boroglukonate untuk penanganan milk fever + grass tetany simultaions.',
    },
    harga: {
      estimasiAI: 5000,
      hargaMarketplace: 4700,
      satuan: 'per kg',
      supplier: 'Importir bahan kimia K+S (Jerman); distributor kimia industri; toko pertanian premium',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Suttle, N.F. (2010). Mineral Nutrition of Livestock, 4th Ed. CABI.',
        'Spears, J.W. (1994). Minerals in forages. In: Forage Quality, Evaluation, and Utilization. ASA, CSSA, SSSA.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
        'McDonald, P., et al. (2011). Animal Nutrition, 7th Ed. Pearson.',
      ],
      sumberData: 'Komposisi kieserite (MgSO₄·H₂O): dihitung dari rumus kimia (MW = 138,4; Mg = 17,5%; S = 23,2%). Bioavailabilitas Mg mengacu pada Spears (1994) dan Suttle (2010).',
      catatan: 'Bedakan kieserite vs epsom salt vs anhydrous MgSO₄ dalam pembelian — kandungan Mg per kg sangat berbeda. Kieserite (monohydrate) paling efisien untuk pakan. Pastikan grade feed — industrial grade bisa mengandung logam berat (Pb, Cd).',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '🔬',
        text: 'MgSO₄ adalah sumber Mg DAN S dalam satu bahan — keunggulan unik yang tidak dimiliki MgO. Sulfur (S) esensial untuk ruminansia yang menggunakan urea sebagai NPN: mikroba rumen membutuhkan rasio N:S = 10:1 (berat) untuk sintesis protein mikroba efisien. Tanpa S yang cukup, NPN tidak dimanfaatkan optimal dan protein mikroba menurun.',
      },
      {
        type: 'kelebihan',
        icon: '✅',
        text: 'Kelarutan tinggi MgSO₄ (>70 g/100 mL) memberikan fleksibilitas pemberian: bisa via pakan (granul) ATAU air minum (larutan). Pemberian via air minum memastikan konsumsi merata — sangat berguna untuk ternak yang individual (sapi produktif) atau saat palatabilitas menjadi masalah.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'Efek laksatif adalah risiko utama. MgSO₄ >1% ransum ruminansia atau >0,5% ransum unggas menyebabkan diare osmotik — Mg²⁺ menahan air di lumen usus. Diare berkepanjangan menyebabkan dehidrasi, gangguan keseimbangan elektrolit, dan penurunan pertumbuhan. Gunakan sesuai dosis rekomendasi.',
      },
      {
        type: 'kombinasi',
        icon: '🔗',
        text: 'Formula preventif grass tetany optimal (per 100 kg blok mineral): NaCl 40 kg + MgO 30 kg + MgSO₄ 10 kg (sumber S tambahan) + DCP 10 kg + trace mineral premix 5 kg + molases 5 kg. MgSO₄ menambahkan S dan membantu Mg total dengan bioavailabilitas lebih tinggi dari MgO.',
      },
    ],
    bentuk: ['Butiran', 'Tepung'],
  },

  // ── 12. Kalium Klorida (KCl) ──────────────────────────────────────────────────
  'kalium-klorida': {
    namaKimia: 'Kalium Klorida (Potassium Chloride)',
    asal: 'Diproduksi dari penambangan mineral kalium (sylvite KCl, carnallite KMgCl₃). Sumber utama: Kanada, Rusia, Belarus, Jerman. Impor ke Indonesia melalui distributor pupuk dan bahan kimia.',
    sumber: 'Tambang deposit evaporit mineral kalium. Proses: penambangan → flotasi → penggilingan. Feed grade memerlukan pemurnian lebih dari MOP (Muriate of Potash) pupuk.',
    bentukFisik: 'Kristal putih hingga merah muda (tergantung kemurnian), sedikit pahit-asin, tidak higroskopis pada kelembaban normal. Hampir identik secara fisik dengan NaCl.',
    kelarutan: 'Sangat larut dalam air (34 g/100 mL pada 25°C). Disolusi sangat cepat. K⁺ tersedia segera di darah dan sel.',
    kelebihan: 'Konsentrasi K tertinggi (±52%); sumber K dan Cl sekaligus; sangat larut; berguna untuk memperbaiki dEB (Dietary Electrolyte Balance) pada ransum stres panas; tersedia dari sumber pupuk pertanian.',
    kekurangan: 'Kalium berlebih (>2% ransum) menyebabkan diare pada ternak; tidak mengandung Ca atau P; bisa memperparah hipomagnesemia jika dikombinasikan dengan Mg rendah; rasa pahit mengurangi palatabilitas jika kadar tinggi.',
    komposisi: {
      kemurnian: 96,
      ca: 0.10, p: 0.02, mg: 0.05, na: 0.50, k: 52.0, cl: 47.0, s: 0.05,
      fe: 50, zn: 5, cu: 1, mn: 5, co: 0.1, iodine: 0.1, se: 0.1, cr: 1, mo: 0.2, f: 20,
      bioavailabilitas: 'K: ±95–100% (hampir sempurna, disolusi cepat). Cl: ±98%. Bioavailabilitas setara NaCl — ionisasi sempurna dalam air.',
      catatan: 'Na 0,5% adalah kontaminan dari proses tambang (NaCl bersama KCl). Pastikan grade feed (food-grade KCl) — pupuk MOP bisa mengandung kontaminan. Rasio K:Cl = 1,1:1 (berat).',
    },
    penggunaan: {
      fungsiUtama: 'Menyuplai K dan Cl. K adalah kation utama intraseluler: mengatur tekanan osmotik sel, sintesis protein, dan pompa Na-K (Na⁺/K⁺-ATPase). Digunakan untuk memperbaiki dEB ransum unggas saat stres panas.',
      maksPenggunaan: 1,
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi', 'Sapi Perah'],
      programCocok: ['Penggemukan', 'Indukan', 'Grower', 'Menyusui'],
      metodePemberian: 'Dicampur dalam ransum. Level: unggas 0,2–0,5% BK (sebagai suplemen K bila bahan pakan rendah K); sapi perah 0,2–0,4% BK ransum. Saat stres panas: tingkatkan K ransum dari 0,4% menjadi 0,8–1,0% BK menggunakan KCl.',
      kompatibilitas: 'Kompatibel dengan semua bahan. Jangan kombinasikan KCl tinggi dengan Mg rendah — antagonisme K-Mg menyebabkan hipomagnesemia. Pada sapi: K >3% BK ransum menghambat absorpsi Mg secara signifikan. Pertimbangkan rasio K:(Ca+Mg) dalam formulasi ransum ruminansia.',
      catatan: 'dEB = Na + K − Cl (mEq/kg ransum). Target: broiler 200–250 mEq/kg; sapi perah 200–300 mEq/kg. KCl menambahkan K dan Cl secara simultan — hitung kontribusi keduanya dalam dEB. Konversi: 1 g NaCl = 17,1 mEq Na + 17,1 mEq Cl; 1 g KCl = 13,4 mEq K + 13,4 mEq Cl.',
    },
    harga: {
      estimasiAI: 6000,
      hargaMarketplace: 5700,
      satuan: 'per kg',
      supplier: 'Distributor pupuk (MOP/KCl pupuk vs feed grade berbeda); importir bahan kimia; distributor pakan ternak',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Leeson, S. & Summers, J.D. (2001). Nutrition of the Chicken, 4th Ed. University Books.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
        'Borges, S.A., et al. (2004). Electrolyte balance in broilers during heat stress. Poult. Sci. 83:1699–1706.',
        'McDowell, L.R. (1992). Minerals in Animal and Human Nutrition. Academic Press.',
      ],
      sumberData: 'Komposisi mengacu pada analisis KCl feed grade (steichiometri: K 52,4%, Cl 47,6% dari KCl BM 74,55). Bioavailabilitas mengacu pada McDowell (1992).',
      catatan: 'Bedakan "KCl pupuk" (MOP — Muriate of Potash) dan "KCl feed grade". MOP bisa mengandung kontaminan logam berat dan tidak melalui proses pemurnian food-grade. Selalu gunakan KCl dengan spesifikasi feed/food grade untuk ternak.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '🌡️',
        text: 'KCl adalah alat kunci dalam manajemen stres panas (heat stress management). Saat suhu tinggi, ayam meningkatkan frekuensi napas (panting) → kehilangan CO₂ → alkalosis respiratorik. Meningkatkan K ransum (menggunakan KCl) membantu mempertahankan keseimbangan dEB dan mengurangi dampak alkalosis terhadap produksi telur dan pertumbuhan.',
      },
      {
        type: 'kekurangan',
        icon: '💧',
        text: 'Defisiensi K jarang terjadi pada ransum berbasis bahan nabati (jagung, kedelai kaya K) tetapi bisa terjadi pada ransum berbasis isi rumen/limbah rendah K. Gejala: kelemahan otot progresif, paralisis flaccid (kaki menyeret), pertumbuhan buruk, penurunan produksi susu. Pada unggas: hypokalemia menyebabkan cardiac arrhythmia dan kematian mendadak.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'K berlebih (>2% BK ransum) secara aktif menghambat absorpsi Mg di usus ruminansia — risiko langsung grass tetany. Pada sapi yang merumput di lahan berfertilisasi K tinggi, ransum tidak perlu tambahan KCl — justru harus ditambah MgO. Kontrol rasio K:(Ca+Mg) ≤2,2 (berat) untuk mencegah hipomagnesemia.',
      },
      {
        type: 'kombinasi',
        icon: '🔗',
        text: 'Saat heat stress unggas: tingkatkan K ransum ke 0,8–1,0% BK (dari normal 0,4%) menggunakan KCl 0,2–0,4% ransum. Tambahkan NaHCO₃ 0,15% untuk mengurangi alkalosis respiratorik. Kurangi NaCl sebagian untuk menjaga dEB tetap optimal (200–250 mEq/kg). Kombinasi ini terbukti mempertahankan produksi telur dan FCR selama heat stress musim panas.',
      },
    ],
    bentuk: ['Butiran', 'Tepung'],
  },

  // ── 13. Natrium Bikarbonat (NaHCO₃) ──────────────────────────────────────────
  'natrium-bikarbonat': {
    namaKimia: 'Natrium Bikarbonat / Natrium Hidrogen Karbonat (Sodium Bicarbonate)',
    asal: 'Diproduksi secara industri (proses Solvay: NaCl + CO₂ + NH₃ + H₂O → NaHCO₃). Impor utama: Eropa, China. Tersedia sebagai baking soda industri/food grade. Distribusi melalui importir bahan kimia dan pakan.',
    sumber: 'Sintesis kimia industri. Feed grade menggunakan kemurnian setara food grade (≥99%). Sama persis dengan baking soda/soda kue konsumsi manusia.',
    bentukFisik: 'Serbuk putih halus, tidak berbau, sedikit asin. pH larutan 8,3 (basa lemah). Mudah berdebu — perlu penanganan hati-hati. Tidak higroskopis pada kondisi normal.',
    kelarutan: 'Larut dalam air (9 g/100 mL pada 25°C). Pada suhu >60°C: terurai menjadi Na₂CO₃ + H₂O + CO₂ → jangan dicampur dengan ransum panas/expander.',
    kelebihan: 'Buffer rumen sangat efektif — mencegah asidosis subakut (SARA) pada sapi feedlot; membantu keseimbangan asam-basa darah saat stres panas pada unggas; Na tanpa Cl (satu-satunya sumber Na bebas Cl); dapat menurunkan dEB dengan meningkatkan Na tanpa menambah Cl.',
    kekurangan: 'Lebih mahal dari garam sebagai sumber Na; tidak ada Cl, P, atau mineral lain; bisa menyebabkan alkaliosis jika berlebihan (>2% ransum); efek buffer rumen memerlukan pemberian konsisten setiap hari.',
    komposisi: {
      kemurnian: 99,
      ca: 0.01, p: 0.01, mg: 0.01, na: 27.4, k: 0.05, cl: 0.02, s: 0.01,
      fe: 10, zn: 2, cu: 0.5, mn: 1, co: 0.05, iodine: 0.05, se: 0.05, cr: 0.5, mo: 0.1, f: 5,
      bioavailabilitas: 'Na: ±100%. Setelah diserap, NaHCO₃ berkontribusi HCO₃⁻ ke buffer darah (sistem bikarbonat). Na+HCO₃⁻ merupakan pasangan buffer fisiologis utama darah.',
      catatan: 'Kemurnian sangat tinggi (99%) — minimal impuritas. Na 27,4% = nilai teoritis NaHCO₃ (BM 84,01; Na 22,99 → 27,4%). Tidak ada Cl — keunggulan utama untuk meningkatkan dEB tanpa menambah Cl. Tidak bereaksi dengan pakan dalam kondisi normal (suhu <40°C).',
    },
    penggunaan: {
      fungsiUtama: 'Buffer rumen (mencegah asidosis subakut pada sapi feedlot/perah); sumber Na bebas Cl; memperbaiki keseimbangan dEB unggas saat stres panas. Esensial dalam formulasi ransum sapi TMR intensif.',
      maksPenggunaan: 2,
      targetTernak: ['Sapi Perah', 'Sapi Pedaging (Feedlot)', 'Ayam Broiler', 'Ayam Petelur'],
      programCocok: ['Menyusui', 'Penggemukan', 'Indukan', 'Grower'],
      metodePemberian: 'Sapi feedlot: 0,75–1,5% BK ransum (dicampur dalam TMR). Sapi perah laktasi: 0,75–1,0% BK. Unggas heat stress: 0,1–0,3% ransum sebagai pengganti sebagian NaCl. Bisa dikombinasikan MgO dalam "buffer pack" untuk sapi.',
      kompatibilitas: 'Kompatibel dengan semua bahan pakan dalam kondisi penyimpanan normal. JANGAN campur dengan asam kuat (asam amino HCl-form, MCP) — terjadi reaksi neutralisasi + CO₂ gas. Cocok dikombinasikan dengan MgO sebagai "rumen buffer package". Tidak bereaksi dengan enzim atau vitamin pada suhu normal.',
      catatan: 'Pemanas (expander, pelleting >80°C) mengurai NaHCO₃ → Na₂CO₃ (soda abu) + CO₂. Na₂CO₃ lebih basa dan bisa merusak vitamin. Untuk pakan yang dipelleting, tambahkan NaHCO₃ setelah proses panas (coating). Pada penyimpanan >2 bulan dalam kondisi lembab: cek apakah sudah terurai parsial.',
    },
    harga: {
      estimasiAI: 4500,
      hargaMarketplace: 4200,
      satuan: 'per kg',
      supplier: 'Importir bahan kimia Solvay; distributor pakan; toko bahan kimia industri',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
        'Owens, F.N. & Goetsch, A.L. (1988). Ruminal fermentation. In: The Ruminant Animal. Prentice Hall.',
        'West, J.W. (2003). Effects of heat-stress on production in dairy cattle. J. Dairy Sci. 86:2131–2144.',
        'Borges, S.A., et al. (2007). Sodium bicarbonate and potassium bicarbonate supplementation. Poult. Sci. 86:1059–1064.',
      ],
      sumberData: 'Komposisi: nilai teoritis NaHCO₃ murni (Na 27,4% dihitung dari BM). Bioavailabilitas Na mengacu pada McDowell (1992). Efek buffer rumen mengacu pada Owens & Goetsch (1988).',
      catatan: 'NaHCO₃ feed grade identik dengan baking soda konsumsi. Bisa dibeli dari importir bahan kimia food grade. Perhatikan kondisi penyimpanan: jauhkan dari asam dan panas. Tidak ada isu keamanan pada level yang direkomendasikan.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '🧪',
        text: 'NaHCO₃ adalah buffer rumen klasik untuk sapi feedlot yang mengonsumsi ransum tinggi biji-bijian (>60% konsentrat). Fermentasi cepat pati menghasilkan VFA dan asam laktat, menurunkan pH rumen < 5,8 → SARA (Subacute Ruminal Acidosis). SARA menyebabkan: depresi nafsu makan, laminitis, abses hati, penurunan FCR. NaHCO₃ 0,75–1,5% BK ransum menaikkan pH rumen 0,1–0,3 unit — cukup untuk mencegah SARA.',
      },
      {
        type: 'kelebihan',
        icon: '☀️',
        text: 'Saat heat stress pada unggas: panting (hiperventilasi) → pengeluaran CO₂ berlebih → alkalosis respiratorik (pH darah naik, HCO₃⁻ darah turun). NaHCO₃ 0,1–0,2% ransum mengembalikan HCO₃⁻ darah, menstabilkan pH, dan mempertahankan eggshell quality + FCR selama musim panas. Penelitian di Indonesia (Borges 2007) membuktikan peningkatan produksi telur 3–5% dengan suplementasi NaHCO₃ musim panas.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'Pelleting atau expander menghancurkan NaHCO₃ — terurai menjadi Na₂CO₃ (lebih basa, merusak vitamin larut air) + CO₂. Jika ransum dipellet, JANGAN tambahkan NaHCO₃ sebelum die — tambahkan sebagai coating post-pellet atau gunakan dalam TMR non-pellet. Kelebihan NaHCO₃ (>2% ransum sapi) menyebabkan alkalosis rumen, menurunkan fermentasi, dan menurunkan konsumsi pakan.',
      },
      {
        type: 'kombinasi',
        icon: '🔗',
        text: '"Rumen buffer pack" untuk sapi feedlot: NaHCO₃ 100 g/hari + MgO 30–50 g/hari. NaHCO₃ menyediakan buffer anion (HCO₃⁻) sementara MgO menyediakan buffer kation (Mg²⁺) dan efek alkali tambahan. Kombinasi lebih efektif dari masing-masing komponen sendiri. Untuk unggas heat stress: NaHCO₃ + KCl + pengurangan NaCl untuk optimasi dEB.',
      },
    ],
    bentuk: ['Tepung'],
  },

  // ── 14. Sulfur / Belerang Pakan ───────────────────────────────────────────────
  'sulfur-pakan': {
    namaKimia: 'Sulfur Elemental (Elemental Sulfur)',
    asal: 'Produk samping industri pengolahan minyak bumi (Frasch process dari deposit sulfur alam) dan proses desulfurisasi gas alam (Claus process). Produsen utama: Middle East, Rusia, Kanada. Impor melalui distributor bahan kimia.',
    sumber: 'Sulfur elemental feed grade adalah by-product pemurnian minyak/gas alam. Kandungan S ≥99% setelah pemurnian. Feed grade memiliki spesifikasi bebas kontaminan logam berat.',
    bentukFisik: 'Serbuk kuning atau bubuk halus (flowers of sulfur), atau butiran kuning. Bau khas belerang (agak menyengat jika terbakar). Tidak larut dalam air.',
    kelarutan: 'Tidak larut dalam air. Di rumen: S elemental direduksi oleh bakteri (desulfovibrio) menjadi H₂S dan kemudian S²⁻ yang dapat dimanfaatkan mikroba rumen untuk sintesis asam amino.',
    kelebihan: 'Konsentrasi S tertinggi (99%); diperlukan untuk mikrobial rumen yang menggunakan NPN (urea); esensial untuk sintesis asam amino sulfur (metionin, sistin) pada ruminansia; murah.',
    kekurangan: 'Toksik pada dosis tinggi — sulfur elemental direduksi menjadi H₂S di rumen, toksik pada konsentrasi tinggi; tidak tersedia untuk unggas dan non-ruminansia (tidak ada bakteri pengurai S elemental); penggunaannya sangat terbatas dan harus hati-hati.',
    komposisi: {
      kemurnian: 99,
      ca: 0.01, p: 0.01, mg: 0.01, na: 0.01, k: 0.01, cl: 0.01, s: 99.0,
      fe: 100, zn: 5, cu: 1, mn: 1, co: 0.1, iodine: 0.1, se: 0.1, cr: 1, mo: 0.2, f: 5,
      bioavailabilitas: 'S: ±70–85% (pada ruminansia, melalui reduksi mikrobal S elemental → H₂S → asam amino S). Tidak tersedia untuk unggas dan babi (tidak ada jalur metabolisme S elemental non-ruminansia yang efisien).',
      catatan: 'S elemental direduksi oleh Desulfovibrio spp. dan bakteri sulfat-reduktase di rumen. Produk H₂S diserap dan digunakan untuk sintesis Cys dan Met. Pada konsentrasi tinggi, H₂S akumulasi dapat toksik. HANYA untuk ruminansia. Jangan gunakan untuk unggas.',
    },
    penggunaan: {
      fungsiUtama: 'Suplementasi S untuk mikroba rumen pada ransum urea/NPN tinggi. Mempertahankan rasio N:S = 10:1 untuk efisiensi sintesis protein mikroba optimal.',
      maksPenggunaan: 0,
      targetTernak: ['Sapi Pedaging', 'Sapi Perah', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan', 'Menyusui'],
      metodePemberian: 'Dicampur dalam konsentrat pada level SANGAT RENDAH: 0,10–0,20% BK ransum (1–2 g/kg pakan). Tidak diberikan tunggal. Pastikan akses air minum cukup. Jangan digunakan bersamaan dengan ransum tinggi S alami (bungkil raps/canola sudah kaya S).',
      kompatibilitas: 'Kombinasikan dengan urea (NPN) pada ransum ruminansia: urea menyediakan N, sulfur menyediakan S untuk mikroba rumen. Rasio optimal N:S = 10:1. JANGAN gunakan pada unggas dan babi — tidak ada mekanisme konversi S elemental. MgSO₄ adalah alternatif S yang lebih aman.',
      catatan: 'KRITIS: Batas aman S total ransum ruminansia ≤0,4% BK (NRC 2005). S berlebihan → H₂S akumulasi → Polioencephalomalacia (PEM) pada sapi dan domba: kebutaan, ataksia, kematian. Air minum berfluorida tinggi mengandung S (sulfat) — hitung S total dari semua sumber (pakan + air). PEM tidak reversibel — pencegahan wajib.',
    },
    harga: {
      estimasiAI: 3500,
      hargaMarketplace: 3200,
      satuan: 'per kg',
      supplier: 'Distributor bahan kimia industri; importir pertanian; kadang tersedia di toko agrikultur',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2005). Mineral Tolerance of Animals, 2nd Rev. Ed. National Academy Press.',
        'Suttle, N.F. (2010). Mineral Nutrition of Livestock, 4th Ed. CABI.',
        'McAllister, M.M., et al. (1997). A review of sulfur-induced polioencephalomalacia. J. Vet. Intern. Med. 11:180–190.',
        'Gould, D.H. (1998). Polioencephalomalacia. J. Anim. Sci. 76:309–314.',
      ],
      sumberData: 'Komposisi berdasarkan analisis sulfur elemental feed grade (>99% S). Batasan toksisitas mengacu pada NRC (2005) dan McAllister (1997).',
      catatan: 'Polioencephalomalacia (PEM) akibat sulfur adalah kondisi neurologis serius pada ruminansia — mortalitas tinggi jika tidak ditangani. Curiga PEM jika ternak (terutama sapi feedlot) menunjukkan kebutaan tiba-tiba, head pressing, opisthotonus. Terapi darurat: Tiamin (Vitamin B1) IV dosis tinggi + singkirkan sumber S segera.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '🔬',
        text: 'Sulfur (S) adalah komponen struktural asam amino metionin (Met) dan sistein (Cys), vitamin biotin dan tiamin (B1), koenzim A, dan glutation. Pada ruminansia, mikroba rumen dapat mensintesis Met dan Cys dari S anorganik (sulfat, sulfida, elemental S) + N (ammonia/NPN). Ini memungkinkan sapi menggunakan urea (N murah) menjadi protein — dengan syarat S cukup tersedia.',
      },
      {
        type: 'kekurangan',
        icon: '🦠',
        text: 'Defisiensi S pada ruminansia yang menggunakan urea: pertumbuhan wool/rambut terhambat (wool/rambut sebagian besar terdiri dari keratin kaya Cys dan Met), gangguan pencernaan, efisiensi fermentasi rumen menurun drastis. Rasio N:S ransum di atas 12:1 (terlalu sedikit S) menghambat efisiensi mikroba rumen dalam memanfaatkan NPN.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: '⚠️ POLIOENCEPHALOMALACIA (PEM) adalah emergensi veteriner akibat S berlebih. Mekanisme: S berlebih → H₂S akumulasi di rumen → diserap ke darah → neurologi otak terganggu (thiamin antagonism + H₂S toksisitas langsung). Gejala: kebutaan mendadak, kepala terangkat ke belakang (opisthotonus), kejang, kematian dalam 24–48 jam. S total ransum TIDAK BOLEH >0,4% BK.',
      },
      {
        type: 'alternatif',
        icon: '🔄',
        text: 'Alternatif S yang lebih aman: MgSO₄ (menyediakan S sebagai sulfat — lebih terkontrol, tidak menghasilkan H₂S langsung). DL-Metionin (sumber S organik langsung — bioavailabilitas sempurna untuk semua spesies, tidak ada risiko PEM). Bungkil canola/rapeseed (kaya S alami, ±0,7% BK). Gunakan sulfur elemental hanya jika benar-benar perlu dan tidak ada alternatif.',
      },
    ],
    bentuk: ['Tepung'],
  },

  // ── 15. Zeolit ────────────────────────────────────────────────────────────────
  'zeolit': {
    namaKimia: 'Zeolit Alam / Klinoptilolit (Natural Zeolite / Clinoptilolite)',
    asal: 'Tambang zeolit alam: Wonosari (Yogyakarta), Lampung, Jawa Tengah, Jawa Barat. Deposit zeolit alam Indonesia cukup besar dan tersedia luas. Juga impor China dan USA (St. Cloud Mining).',
    sumber: 'Mineral aluminosilikat terhidrat yang terbentuk dari abu vulkanik yang bereaksi dengan air alkali (zeolitisasi). Komposisi umum: (Na,K,Ca)₂(Al₂Si₇O₁₈)·6H₂O. Proses: penambangan → pengeringan → penggilingan → pengayakan.',
    bentukFisik: 'Serbuk putih keabu-abuan atau krem, tidak berbau, tekstur sedikit kasar. Ukuran partikel bervariasi: halus (<0,5 mm) untuk ransum, kasar (1–3 mm) untuk mineral lick. Sangat ringan (bulk density rendah).',
    kelarutan: 'Tidak larut dalam air (struktur kerangka silika-alumina). Kapasitas tukar kation (CEC) ±100–180 meq/100 g — mengikat dan melepas kation (NH₄⁺, K⁺, Ca²⁺, Mg²⁺) melalui mekanisme pertukaran ion.',
    kelebihan: 'Adsorpsi amonia di saluran cerna (NH₄⁺ ditukar dengan Na⁺/K⁺), mengurangi bau kandang; pengikat mikotoksin (aflatoksin B1); buffer pH rumen; meningkatkan kualitas litter unggas; bahan lokal murah; tidak toksik.',
    kekurangan: 'Tidak menyediakan mineral esensial dalam jumlah signifikan; bisa mengikat kation mineral positif lain (Ca²⁺, Mg²⁺, Zn²⁺) jika digunakan berlebihan; efektivitas sangat tergantung tipe zeolit (CEC); level tinggi bisa menurunkan absorpsi mineral.',
    komposisi: {
      kemurnian: null,
      ca: 2.0, p: 0.10, mg: 0.50, na: 0.70, k: 1.50, cl: 0.10, s: 0.05,
      fe: 8000, zn: 30, cu: 5, mn: 200, co: 2, iodine: 0.2, se: 0.2, cr: 10, mo: 1, f: 100,
      bioavailabilitas: 'Tidak berlaku sebagai sumber mineral — mineral dalam zeolit terikat kuat dalam kerangka silika-alumina dan tidak tersedia biologis. Fungsi utama bukan nutrisi tapi adsorpsi dan pertukaran ion.',
      catatan: 'Nilai mineral di atas mencerminkan komposisi kimia zeolit, bukan nilai nutrisi. Ca, Mg, K, Na adalah kation penyeimbang dalam kerangka kristal — tidak tersedia sebagai sumber mineral nutrisi. Fe tinggi (±8000 ppm) dari impuritas. CEC klinoptilolit: 100–180 meq/100 g (lebih tinggi dari bentonit).',
    },
    penggunaan: {
      fungsiUtama: 'Adsorpsi NH₃/NH₄⁺ di saluran pencernaan dan lingkungan kandang; pengikat mikotoksin (aflatoksin B1); buffer pH rumen; binder pellet; meningkatkan kualitas litter.',
      maksPenggunaan: 3,
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Sapi Pedaging', 'Sapi Perah', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      metodePemberian: 'Dicampur dalam ransum 1–3% BK. Untuk penyerapan amonia kandang: taburkan 0,5 kg/m² litter. Untuk pellet: tambahkan 1–2% sebagai binder. Level >3% bisa menghambat absorpsi mineral dan menurunkan kecernaan bahan pakan.',
      kompatibilitas: 'Hindari kombinasi bersamaan dengan Ca²⁺, Mg²⁺, Zn²⁺ berlebih — zeolit bisa mengikat kation divalensi ini dan mengurangi ketersediaan. Tidak bereaksi dengan vitamin atau asam amino. Penggunaan bersamaan dengan premix trace mineral: pastikan level zeolit ≤2% agar tidak mengganggu absorpsi Zn dan Mn.',
      catatan: 'Efektivitas pengikat mikotoksin zeolit: sangat baik untuk aflatoksin B1 (adsorpsi ≥90% pada pH 3–8); kurang efektif untuk zearalenon, DON, fumonisin. Untuk spektrum mycotoxin luas, kombinasikan dengan bentonit atau agen khusus (PVSA, HSCAS). Zeolit Indonesia (Wonosari) umumnya klinoptilolit dengan CEC cukup tinggi — verifikasi tipe dan CEC dari supplier.',
    },
    harga: {
      estimasiAI: 2000,
      hargaMarketplace: 1700,
      satuan: 'per kg',
      supplier: 'Tambang zeolit lokal (Wonosari, Lampung); distributor mineral pertanian; PT Andalas Zeolit',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Papaioannou, D., et al. (2005). Effects of clinoptilolite on performance of growing pigs. Livest. Prod. Sci. 94:161–172.',
        'Pond, W.G. & Yen, J.T. (1983). Clinoptilolite zeolite in swine starter diets. J. Anim. Sci. 57:1320–1326.',
        'Patterson, D.S.P. & Roberts, B.A. (1979). Mycotoxin detoxification of animal feedstuffs. Vet. Rec. 105:467–469.',
        'Mumpton, F.A. (1999). La roca magica: Uses of natural zeolites in agriculture. Proc. Natl. Acad. Sci. 96:3463–3470.',
      ],
      sumberData: 'Komposisi mengacu pada analisis klinoptilolit Indonesia (LIPI 2018). CEC dan adsorpsi mikotoksin mengacu pada Mumpton (1999) dan Patterson (1979).',
      catatan: 'Tidak semua "zeolit" sama: tipe mineral menentukan CEC dan selektivitas pertukaran ion. Klinoptilolit (selektif untuk NH₄⁺, K⁺, Na⁺) adalah tipe terbaik untuk pakan ternak. Zeolit sintetis (zeolite A, X, Y) lebih mahal dan umumnya tidak digunakan untuk pakan. Minta analisis tipe mineral dan CEC dari supplier.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '🧲',
        text: 'Zeolit (klinoptilolit) bekerja sebagai "ion exchanger" alami dalam saluran pencernaan. Mekanisme utama: mengikat NH₄⁺ (amonia) di usus melalui pertukaran dengan Na⁺ atau K⁺ yang sudah ada dalam kerangka zeolite → mengurangi absorpsi amonia ke darah → menurunkan beban urea darah dan hati → meningkatkan efisiensi nitrogen. Juga mengikat aflatoksin B1 (adsorpsi elektrostatik di pH lambung).',
      },
      {
        type: 'kelebihan',
        icon: '✅',
        text: 'Manfaat ganda zeolit yang jarang diketahui: (1) mengurangi kadar NH₃ litter ayam hingga 30–40% dengan penaburan langsung di kandang (2 kg/m²) — mengurangi dermatitis kaki dan kondisi respiratory; (2) sebagai binder pellet 1–2% meningkatkan PDI (Pellet Durability Index) tanpa pengaruh negatif kecernaan; (3) murah dan lokal tersedia di Indonesia.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'Level >3% zeolit dalam ransum bisa menghambat absorpsi Zn dan Mn — dua mineral kritis untuk sistem imun dan fungsi reproduksi. Dalam penelitian, zeolit 5–10% menyebabkan defisiensi Zn pada babi. Selalu pertahankan suplementasi trace mineral premix yang memadai saat menggunakan zeolit, dan jangan melebihi 3% ransum.',
      },
      {
        type: 'alternatif',
        icon: '🔄',
        text: 'Untuk pengikat mikotoksin spektrum luas: bentonit (lebih baik untuk zearalenon), agen HSCAS (Hydrated Sodium Calcium Aluminosilicate), atau produk komersial multi-toxin binder. Zeolit + bentonit bisa dikombinasikan untuk spektrum yang lebih luas. Untuk pengurangan amonia kandang: kapur (CaO) juga efektif tetapi lebih korosif.',
      },
    ],
    bentuk: ['Tepung', 'Butiran'],
  },

  // ── 16. Bentonit ─────────────────────────────────────────────────────────────
  'bentonit': {
    namaKimia: 'Bentonit / Natrium Bentonit / Kalsium Bentonit (Bentonite / Smectite / Montmorillonite)',
    asal: 'Tambang bentonit: Tasikmalaya (Jabar), Blitar, Pacitan (Jatim). Impor: USA (Wyoming — Sodium Bentonite terbaik), Turki. Indonesia memiliki deposit bentonit yang cukup besar.',
    sumber: 'Mineral lempung aluminosilikat yang terbentuk dari pelapukan abu vulkanik in situ. Komposisi utama: montmorillonit (smektit) dengan kemampuan mengembang (swelling) dalam air. Sodium bentonite: mengembang kuat; calcium bentonite: kurang mengembang.',
    bentukFisik: 'Serbuk halus abu-abu hingga putih kecoklatan. Sangat plastis saat basah, keras dan retak saat kering. Mengembang 10–15× volume saat basah (Na-bentonit). Bau khas tanah lempung.',
    kelarutan: 'Tidak larut — membentuk gel/koloid dalam air. Kapasitas adsorpsi sangat tinggi untuk molekul organik (terutama aflatoksin). CEC: 60–100 meq/100 g (lebih rendah dari klinoptilolit untuk NH₄⁺ tapi lebih baik untuk mikotoksin non-polar).',
    kelebihan: 'Pengikat aflatoksin B1 terbaik di antara mineral adsorben (≥90% adsorpsi); juga mengikat zearalenon lebih baik dari zeolit; binder pellet excellent; murah dan tersedia lokal; aman untuk semua spesies ternak.',
    kekurangan: 'Efektivitas terbatas untuk DON (Deoxynivalenol) dan fumonisin; bisa mengikat beberapa vitamin lipofilik dan mineral; pembengkakan dalam air membatasi penggunaan dalam pakan ikan (mengembang dan menghambat pellet tenggelam).',
    komposisi: {
      kemurnian: null,
      ca: 2.0, p: 0.10, mg: 0.50, na: 2.50, k: 0.20, cl: 0.10, s: 0.10,
      fe: 15000, zn: 50, cu: 10, mn: 300, co: 3, iodine: 0.2, se: 0.2, cr: 15, mo: 2, f: 150,
      bioavailabilitas: 'Tidak berlaku sebagai sumber mineral nutrisi. Mineral dalam bentonit terikat kuat dalam kerangka aluminosilikat dan tidak tersedia biologis dalam jumlah signifikan. Fe sangat tinggi (±15000 ppm) tapi terikat dalam struktur mineral, tidak tersedia.',
      catatan: 'Na 2,5% adalah kation penyeimbang dalam sodium bentonite (lebih tinggi dari Ca-bentonite yang Ca ~2,5%). Nilai Ca 2% untuk Ca-bentonite. Fe sangat tinggi karena impuritas mineral alam. Tidak ada nilai nutrisi signifikan dari komposisi ini.',
    },
    penggunaan: {
      fungsiUtama: 'Pengikat mikotoksin (terutama aflatoksin B1 dan zearalenon); binder pellet pakan ternak dan ikan; pengental litter; adsorben amonia lingkungan kandang.',
      maksPenggunaan: 2,
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi', 'Sapi Pedaging', 'Sapi Perah', 'Ikan Budidaya', 'Udang'],
      programCocok: ['Penggemukan', 'Indukan', 'Menyusui', 'Grower', 'Pejantan'],
      metodePemberian: 'Pengikat mikotoksin: 0,2–0,5% ransum. Binder pellet: 1–2% (meningkatkan PDI). Penaburan litter: 0,5–1 kg/m². Untuk pakan ikan: gunakan Na-bentonit granul yang telah di-preswelling untuk mengurangi efek mengembang dalam air.',
      kompatibilitas: 'Hindari kombinasi tinggi dengan vitamin A, D, E, dan K (lipofilik) — bentonit bisa mengikat vitamin-vitamin ini. Tidak bereaksi dengan mineral anorganik secara langsung. Boleh dikombinasikan dengan zeolit untuk spektrum adsorpsi mikotoksin lebih luas: zeolit (aflatoksin + NH₄⁺) + bentonit (aflatoksin + zearalenon).',
      catatan: 'HSCAS (Hydrated Sodium Calcium Aluminosilicate) adalah bentuk bentonit yang sudah terstandardisasi untuk pakan ternak — lebih konsisten dari bentonit alam murni. Pilih produk dengan sertifikasi mycotoxin binding assay (in vitro adsorpsi ≥85% untuk aflatoksin B1). Jangan gunakan bentonit industri (drilling mud grade) — mungkin mengandung kontaminan berbahaya.',
    },
    harga: {
      estimasiAI: 1800,
      hargaMarketplace: 1600,
      satuan: 'per kg',
      supplier: 'Tambang bentonit lokal (Tasikmalaya, Blitar); distributor mineral pakan; importir bentonit USA (Wyoming)',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Ramos, A.J. & Hernandez, E. (1996). Ochratoxin A and bentonite. J. Food Prot. 59:631–637.',
        'Phillips, T.D., et al. (2008). Hydrated sodium calcium aluminosilicate: a high affinity sorbent for aflatoxin. Food Addit. Contam. 25(1):119–128.',
        'Papaioannou, D.S., et al. (2002). A field study on certain effects of bentonite in sows. Res. Vet. Sci. 72:61–68.',
        'Damgaard-Poulsen, H., et al. (1997). The effect of activated bentonite on performance of weanling pigs. J. Anim. Sci. 75:3042–3049.',
      ],
      sumberData: 'Komposisi mengacu pada analisis bentonit alam Indonesia (Pusat Teknologi Mineral ESDM, 2019) dan sodium bentonite Wyoming (API Grade). Efektivitas adsorpsi mycotoxin mengacu pada Phillips (2008).',
      catatan: 'Bedakan sodium bentonite (Na-bentonite) vs calcium bentonite (Ca-bentonite): Na-bentonite mengembang lebih kuat dan kapasitas adsorpsi mycotoxin lebih tinggi. Untuk pakan ternak, Na-bentonite lebih direkomendasikan. Verifikasi bahwa produk memenuhi standar CODEX Alimentarius untuk clay minerals in feed.',
    },
    aiInsight: [
      {
        type: 'fungsi',
        icon: '🛡️',
        text: 'Bentonit adalah agen proteksi pertama dan utama terhadap kontaminasi aflatoksin pakan ternak di Indonesia. Aflatoksin B1 dari jagung dan kacang lokal bisa mencapai >50 ppb (batas aman <10 ppb untuk unggas). Bentonit 0,2–0,5% ransum mengikat aflatoksin B1 >90% di saluran cerna SEBELUM diserap — mencegah aflatoksikosis hati, imunosupresi, dan penurunan produksi.',
      },
      {
        type: 'kelebihan',
        icon: '✅',
        text: 'Dual function dalam formulasi pellet: (1) sebagai mycotoxin binder, dan (2) sebagai binder pellet. Penambahan bentonit 1–2% meningkatkan PDI (Pellet Durability Index) dari 75% menjadi 85–90% — mengurangi debu dan fines. Ini berarti satu bahan memenuhi dua kebutuhan sekaligus, efisiensi biaya tinggi.',
      },
      {
        type: 'peringatan',
        icon: '⚠️',
        text: 'Bentonit mengikat vitamin A dan E (lipofilik) pada level >2% — defisiensi vitamin jika tidak ada kompensasi. Penelitian Papaioannou (2002) menemukan bentonit 2% ransum babi menurunkan absorpsi vitamin E 15%. Tingkatkan vitamin A (10–15%) dan E (10–20%) dalam premix jika menggunakan bentonit >1%. Jangan gunakan bentonit drilling/industrial grade.',
      },
      {
        type: 'kombinasi',
        icon: '🔗',
        text: '"Multi-mycotoxin protection pack": bentonit 0,3% (aflatoksin + zearalenon) + klinoptilolit/zeolit 1% (aflatoksin + NH₄⁺) + kompensasi vitamin A+E (+20%). Kombinasi ini memberikan perlindungan spektrum lebih luas dan lebih ekonomis daripada menggunakan produk mycotoxin binder komersial tunggal yang harganya jauh lebih tinggi.',
      },
    ],
    bentuk: ['Tepung', 'Butiran'],
  },
};

// ─── Accessor ─────────────────────────────────────────────────────────────────

export function getMineralDetail(id: string): MineralDetailFields | undefined {
  return MINERAL_DETAIL[id];
}
