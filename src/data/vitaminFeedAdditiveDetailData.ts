// ─── MP-033 — Detail Data: Vitamin & Feed Additive ───────────────────────────
// Full nutrition/characteristics, usage, price, reference, and AI insight for
// every item in the "Vitamin & Feed Additive" sub-category. Merged with
// VitaminFeedAdditiveItem via getVitaminFeedAdditiveDetail().
//
// Sumber data komposisi & karakteristik:
//   • NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.
//   • NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.
//   • NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.
//   • McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed. Iowa State University Press.
//   • Leeson, S. & Summers, J.D. (2001). Nutrition of the Chicken, 4th Ed. University Books.
//   • FEFANA (2014). Feed Additives: Nutritional and Technological Feed Additives. FEFANA Publication.
//   • Selle, P.H. & Ravindran, V. (2007). Microbial phytase in poultry nutrition. Anim. Feed Sci. Technol.
//   • Choct, M. (2006). Enzymes for the feed industry: past, present and future. World's Poult. Sci. J.
//   • FAO (2016). Probiotics in Animal Nutrition — Production, Impact and Regulation. FAO Animal Production and Health Paper 179.
//   • European Commission Register of Feed Additives (EU 1831/2003).
//   • Feedipedia (2024). INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi Pakan untuk Indonesia. Gadjah Mada University Press.
//
// Data komposisi dinyatakan sesuai satuan potensi umum industri feed grade
// (IU/g, mg/kg, CFU/g, U/g, atau %) — bukan bentuk kimia murni laboratorium.

import { getVitaminFeedAdditiveById } from './vitaminFeedAdditiveData';
import type { HargaData, ReferensiData, AiInsightItem, ProgramCocok } from './jagungData';

export { getVitaminFeedAdditiveById };

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface VitaminKomposisi {
  bahanAktif: string;              // Active ingredient / carrier form
  kadarBahanAktif: string;         // Active content, e.g. "500,000 IU/g"
  senyawaAktif: string;            // Vitamin / active compound name
  satuanPotensi: string;           // Potency unit (IU, CFU, U/g, %, mg/kg)
  ph: string | null;               // pH if applicable
  kelarutan: string;               // Solubility
  stabilitasPanas: string;         // Heat stability (pelleting)
  stabilitasPenyimpanan: string;   // Storage stability
  dosisReferensi: string;          // Reference dose
}

export interface VitaminDetailPenggunaan {
  fungsiUtama: string;
  dosisPenggunaan: string;
  targetTernak: string[];
  programCocok: ProgramCocok[];
  metodePemberian: string;
  kompatibilitas: string;
  catatan: string;
}

export interface VitaminDetailFields {
  namaKimia: string;
  asal: string;
  fungsiUtama: string;
  bentukFisik: string;
  stabilitasPenyimpanan: string;
  kelebihan: string;
  kekurangan: string;
  komposisi: VitaminKomposisi;
  penggunaan: VitaminDetailPenggunaan;
  harga: HargaData;
  referensi: ReferensiData;
  aiInsight: AiInsightItem[];
}

// ─── Detail Records ───────────────────────────────────────────────────────────

const VITAMIN_FEED_ADDITIVE_DETAIL: Record<string, VitaminDetailFields> = {

  // ── Vitamin A ──────────────────────────────────────────────────────────────
  'vitamin-a': {
    namaKimia: 'Retinyl Acetate / Retinyl Palmitate (feed grade, terenkapsulasi gelatin-pati)',
    asal: 'Sintesis kimia industri (BASF, DSM, Adisseo); dipasarkan sebagai beadlet terenkapsulasi untuk melindungi dari oksidasi',
    fungsiUtama: 'Menjaga integritas epitel, penglihatan (siklus rhodopsin), reproduksi, dan respons imun',
    bentukFisik: 'Serbuk beadlet kuning-oranye terenkapsulasi (gelatin/pati/antioksidan), free-flowing',
    stabilitasPenyimpanan: 'Stabil 12–18 bulan dalam kemasan tertutup, sejuk, kering, terlindung cahaya; sangat sensitif terhadap oksidasi, panas, dan sinar UV bila tidak terenkapsulasi',
    kelebihan: 'Enkapsulasi modern (beadlet) meningkatkan stabilitas terhadap pelleting dan mixing; dosis presisi tinggi; kompatibel dengan hampir seluruh bahan pakan dan premix vitamin/mineral.',
    kekurangan: 'Tanpa enkapsulasi sangat labil terhadap oksidasi (kontak logam trace mineral mempercepat degradasi); harga relatif tinggi; overdosis kronis toksik (hipervitaminosis A).',
    komposisi: {
      bahanAktif: 'Retinyl Acetate / Retinyl Palmitate beadlet',
      kadarBahanAktif: '500.000–1.000.000 IU/g (produk feed grade umum)',
      senyawaAktif: 'Retinol (Vitamin A aktif)',
      satuanPotensi: 'IU/g (1 IU = 0,3 µg retinol)',
      ph: null,
      kelarutan: 'Larut lemak; beadlet terdispersi dalam air/pakan berair',
      stabilitasPanas: 'Kehilangan potensi 10–20% pada pelleting suhu >85°C tanpa proteksi tambahan',
      stabilitasPenyimpanan: '85–95% retensi setelah 3 bulan penyimpanan sejuk-kering dalam premix',
      dosisReferensi: 'Ayam broiler: 8.000–12.000 IU/kg pakan; Sapi perah: 4.000–5.000 IU/kg BK ransum',
    },
    penggunaan: {
      fungsiUtama: 'Menjaga fungsi epitel (kulit, mukosa saluran cerna & pernapasan), penglihatan (rhodopsin retina), reproduksi (spermatogenesis, perkembangan embrio), dan respons imun humoral & selular.',
      dosisPenggunaan: 'Unggas: 8.000–15.000 IU/kg pakan; Sapi/kambing/domba: 4.000–8.000 IU/kg BK ransum; Babi: 4.000–8.000 IU/kg pakan',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Sapi Perah', 'Sapi Pedaging', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Bunting', 'Menyusui', 'Pejantan'],
      metodePemberian: 'Dicampur dalam premix vitamin, lalu dicampur homogen ke dalam ransum basal; tidak diberikan langsung tanpa carrier.',
      kompatibilitas: 'Kompatibel dalam premix standar; hindari kontak langsung berkepanjangan dengan trace mineral non-terlapis (Cu, Fe) yang mempercepat oksidasi — gunakan mineral terenkapsulasi/chelated dalam premix kombinasi.',
      catatan: 'Simpan premix di tempat sejuk (<25°C), kering, terlindung cahaya langsung; gunakan dalam 3 bulan setelah kemasan dibuka untuk menjaga potensi.',
    },
    harga: {
      estimasiAI: 850000,
      hargaMarketplace: 820000,
      satuan: 'per kg (produk 500.000 IU/g)',
      supplier: 'Distributor premix vitamin (DSM, BASF, Adisseo Indonesia); toko pakan ternak grosir',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed. National Academy Press.',
        'McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed. Iowa State University Press.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
        'Leeson, S. & Summers, J.D. (2001). Nutrition of the Chicken, 4th Ed.',
      ],
      sumberData: 'Dosis referensi mengacu pada NRC Poultry (1994) dan NRC Dairy Cattle (2001); data stabilitas berdasarkan spesifikasi teknis produk beadlet komersial (DSM/BASF).',
      catatan: 'Kadar IU/g dapat bervariasi sesuai grade produk (250.000–1.000.000 IU/g); selalu cek label COA (Certificate of Analysis) dari supplier.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '👁️', text: 'Vitamin A berperan sentral dalam siklus visual (rhodopsin), menjaga integritas jaringan epitel (kulit, saluran napas, saluran cerna), dan mendukung diferensiasi sel imun. Defisiensi ringan sering tidak terlihat kasat mata tapi menurunkan resistensi terhadap infeksi saluran napas dan pencernaan.' },
      { type: 'kekurangan', icon: '🌙', text: 'Gejala defisiensi: rabun senja (nyctalopia), xerophthalmia, penurunan produksi telur & daya tetas, gangguan pertumbuhan pada unggas muda, serta peningkatan mortalitas anak sapi/kambing akibat diare dan pneumonia.' },
      { type: 'peringatan', icon: '⚠️', text: 'Hipervitaminosis A (dosis kronis >4–10× kebutuhan) menyebabkan kerapuhan tulang, hambatan pertumbuhan, dan gangguan reproduksi. Vitamin A larut lemak terakumulasi di hati — risiko toksisitas meningkat pada penggunaan premix ganda (base pakan + suplemen tambahan) tanpa perhitungan total.' },
      { type: 'kombinasi', icon: '🔗', text: 'Interaksi sinergis dengan Vitamin E dan Zn dalam mendukung fungsi imun; Vitamin D3 berlebih dapat menekan penyerapan Vitamin A pada dosis sangat tinggi. Selalu hitung total asupan dari seluruh sumber (premix + bahan pakan alami seperti hijauan hijau/karoten).' },
      { type: 'kombinasi', icon: '🎯', text: 'Paling efektif diberikan via premix vitamin terenkapsulasi (beadlet) yang dicampur merata dalam pakan basal; hindari pemberian minyak vitamin A curah tanpa proteksi karena oksidasi cepat menurunkan potensi hingga 50% dalam hitungan minggu.' },
    ],
  },

  // ── Vitamin D3 ─────────────────────────────────────────────────────────────
  'vitamin-d3': {
    namaKimia: 'Cholecalciferol (feed grade, beadlet terenkapsulasi)',
    asal: 'Sintesis dari 7-dehidrokolesterol (lanolin domba) melalui iradiasi UV; diproduksi industri (DSM, BASF)',
    fungsiUtama: 'Mengatur absorpsi Ca & P usus, mineralisasi tulang, homeostasis kalsium darah',
    bentukFisik: 'Beadlet serbuk putih-kekuningan terenkapsulasi, free-flowing',
    stabilitasPenyimpanan: 'Stabil 12 bulan dalam kemasan tertutup sejuk-kering; sensitif terhadap kelembapan dan oksidasi tanpa enkapsulasi',
    kelebihan: 'Esensial untuk unggas kandang tanpa sinar matahari; sangat efektif meningkatkan absorpsi Ca untuk kualitas kerabang dan tulang; dosis presisi dalam bentuk beadlet.',
    kekurangan: 'Batas keamanan sempit — margin toksik hanya 4–10× kebutuhan; overdosis menyebabkan hiperkalsemia dan kalsifikasi jaringan lunak (ginjal, pembuluh darah).',
    komposisi: {
      bahanAktif: 'Cholecalciferol beadlet',
      kadarBahanAktif: '500.000 IU/g (produk feed grade umum)',
      senyawaAktif: 'Cholecalciferol (Vitamin D3 aktif)',
      satuanPotensi: 'IU/g (1 IU = 0,025 µg cholecalciferol)',
      ph: null,
      kelarutan: 'Larut lemak; beadlet terdispersi dalam campuran pakan',
      stabilitasPanas: 'Kehilangan potensi 10–15% pada pelleting suhu >80°C',
      stabilitasPenyimpanan: '80–90% retensi setelah 3 bulan dalam premix sejuk-kering',
      dosisReferensi: 'Ayam petelur: 2.500–3.500 IU/kg pakan; Sapi perah: 1.000–1.500 IU/kg BK ransum',
    },
    penggunaan: {
      fungsiUtama: 'Mengatur absorpsi kalsium dan fosfor di usus halus melalui bentuk aktif 1,25-dihydroxycholecalciferol; esensial untuk mineralisasi tulang, kualitas kerabang telur, dan fungsi otot/saraf yang bergantung Ca.',
      dosisPenggunaan: 'Unggas: 2.000–4.000 IU/kg pakan; Sapi/kambing/domba: 1.000–2.000 IU/kg BK ransum; Babi: 800–1.500 IU/kg pakan',
      targetTernak: ['Ayam Petelur', 'Ayam Broiler', 'Sapi Perah', 'Sapi Pedaging', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Grower', 'Indukan', 'Bunting', 'Menyusui', 'Penggemukan'],
      metodePemberian: 'Dicampur dalam premix vitamin bersama Vitamin A, E, K, kemudian dicampur homogen ke ransum basal.',
      kompatibilitas: 'Sinergis kuat dengan Ca dan P (DCP/MCP/batu kapur) — tanpa D3 cukup, suplementasi Ca-P tidak optimal terserap. Hindari overdosis bersamaan dengan sumber Ca tinggi tanpa perhitungan rasio.',
      catatan: 'Kandang tertutup tanpa akses sinar matahari WAJIB memenuhi kebutuhan D3 penuh dari pakan; ternak umbaran/pastura parsial dapat mensintesis sebagian dari sinar UV kulit.',
    },
    harga: {
      estimasiAI: 1200000,
      hargaMarketplace: 1150000,
      satuan: 'per kg (produk 500.000 IU/g)',
      supplier: 'Distributor premix vitamin nasional; toko pakan ternak grosir',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
        'McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed.',
      ],
      sumberData: 'Dosis mengacu pada NRC Poultry (1994) dan NRC Dairy Cattle (2001); data toksisitas dari McDowell (2000).',
      catatan: 'Pastikan produk berlabel D3 (cholecalciferol), bukan D2 (ergocalciferol) yang jauh kurang efektif untuk unggas.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🦴', text: 'Vitamin D3 diaktivasi di hati dan ginjal menjadi calcitriol, hormon steroid yang secara langsung mengatur transkripsi gen protein pengikat kalsium di usus. Tanpa D3 cukup, absorpsi Ca dari pakan hanya ~10–15% dibanding 30–40% saat status D3 optimal.' },
      { type: 'kekurangan', icon: '🦴', text: 'Defisiensi menyebabkan rakhitis pada ternak muda (tulang lunak, kaki bengkok), osteomalasia pada dewasa, kerabang telur tipis/lembek, dan penurunan daya tetas telur tetas.' },
      { type: 'peringatan', icon: '⚠️', text: 'Overdosis D3 (>4–10× kebutuhan) menyebabkan hiperkalsemia, kalsifikasi jaringan lunak (ginjal, aorta, paru-paru) yang ireversibel dan berujung kematian. Margin keamanan D3 jauh lebih sempit dibanding Vitamin A dan E — selalu ikuti dosis label premix.' },
      { type: 'kombinasi', icon: '🔗', text: 'Bekerja sinergis dengan Ca dan P — efektivitas suplementasi mineral tulang bergantung penuh pada status D3 memadai. Kombinasi D3 + fitase meningkatkan pemanfaatan P fitat pada unggas dan babi.' },
      { type: 'kombinasi', icon: '🎯', text: 'Paling kritis pada sistem kandang tertutup (closed house) tanpa paparan sinar matahari — 100% kebutuhan D3 harus dipenuhi dari pakan. Pada ternak umbaran, kebutuhan pakan bisa direduksi sebagian karena sintesis kulit dari sinar UVB.' },
    ],
  },

  // ── Vitamin E ──────────────────────────────────────────────────────────────
  'vitamin-e': {
    namaKimia: 'DL-Alpha-Tocopheryl Acetate (feed grade)',
    asal: 'Sintesis kimia industri (esterifikasi tocopherol dengan asam asetat untuk stabilitas)',
    fungsiUtama: 'Antioksidan biologis utama pelindung membran sel dari kerusakan oksidatif',
    bentukFisik: 'Serbuk adsorbat kuning pucat (pada silika/carrier) atau cairan minyak pekat',
    stabilitasPenyimpanan: 'Stabil 18–24 bulan dalam kemasan tertutup sejuk-kering (bentuk acetate jauh lebih stabil dari tocopherol bebas)',
    kelebihan: 'Bentuk acetate sangat stabil terhadap oksidasi, panas pelleting, dan penyimpanan jangka panjang; kompatibel luas dengan bahan pakan dan mineral.',
    kekurangan: 'Harus dihidrolisis di usus menjadi tocopherol bebas untuk aktif — efikasi sedikit lebih lambat dibanding tocopherol alami (D-alpha-tocopherol) yang lebih mahal.',
    komposisi: {
      bahanAktif: 'DL-Alpha-Tocopheryl Acetate adsorbat',
      kadarBahanAktif: '50% (500 g/kg) — grade adsorbat umum industri',
      senyawaAktif: 'Alpha-Tocopherol (Vitamin E aktif)',
      satuanPotensi: 'IU/g atau mg/kg (1 IU = 1 mg DL-alpha-tocopheryl acetate)',
      ph: null,
      kelarutan: 'Larut lemak; bentuk adsorbat terdispersi baik dalam campuran pakan kering',
      stabilitasPanas: 'Retensi >90% pada pelleting suhu 80–90°C (jauh lebih stabil dari vitamin larut lemak lain)',
      stabilitasPenyimpanan: '90–95% retensi setelah 6 bulan penyimpanan sejuk-kering',
      dosisReferensi: 'Ayam broiler: 20–50 mg/kg pakan (naik hingga 200 mg/kg untuk efek imunomodulasi/kualitas daging)',
    },
    penggunaan: {
      fungsiUtama: 'Antioksidan liposolubel utama yang melindungi membran sel dari peroksidasi lipid; mendukung fungsi imun, integritas otot (mencegah nutritional muscular dystrophy), reproduksi, dan kualitas produk (daging, telur, susu).',
      dosisPenggunaan: 'Unggas: 20–100 mg/kg pakan (level tinggi 150–200 mg/kg untuk broiler stres panas); Sapi/kambing/domba: 15–50 IU/kg BK ransum; Babi: 15–40 mg/kg pakan',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Sapi Perah', 'Sapi Pedaging', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Bunting', 'Menyusui', 'Pejantan'],
      metodePemberian: 'Dicampur dalam premix vitamin, homogenisasi ke ransum basal; dosis dapat dinaikkan pada kondisi stres (panas, transportasi, pasca sakit).',
      kompatibilitas: 'Sinergis kuat dengan Selenium (keduanya bekerja pada jalur antioksidan glutathione peroxidase) — selalu pasangkan E + Se dalam formulasi. Kompatibel dengan hampir semua bahan pakan.',
      catatan: 'Naikkan dosis 2–4× pada periode stres oksidatif tinggi (cuaca panas, transportasi jauh, pasca-vaksinasi) untuk mendukung respons imun optimal.',
    },
    harga: {
      estimasiAI: 180000,
      hargaMarketplace: 165000,
      satuan: 'per kg (produk adsorbat 50%)',
      supplier: 'Distributor premix vitamin nasional; toko pakan ternak grosir',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed.',
        'Surai, P.F. (2002). Natural Antioxidants in Avian Nutrition and Reproduction. Nottingham University Press.',
      ],
      sumberData: 'Dosis dasar mengacu pada NRC Poultry (1994); dosis tinggi untuk efek imunomodulasi mengacu pada Surai (2002).',
      catatan: 'Untuk klaim kualitas daging/susu (shelf-life, oksidasi lemak), diperlukan dosis supra-nutrisional 2–4× kebutuhan dasar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🛡️', text: 'Vitamin E adalah pertahanan antioksidan lini pertama pada membran sel, mencegah peroksidasi asam lemak tak jenuh ganda (PUFA). Perannya krusial pada jaringan dengan aktivitas metabolik tinggi: otot, hati, dan sel imun.' },
      { type: 'kekurangan', icon: '💪', text: 'Defisiensi pada unggas menyebabkan encephalomalacia (kerusakan otak, sering disebut "crazy chick disease"), exudative diathesis, dan nutritional muscular dystrophy. Pada ruminansia/babi: white muscle disease pada anak (bekerja bersama Se).' },
      { type: 'kombinasi', icon: '🔗', text: 'Selenium dan Vitamin E bekerja sinergis pada jalur pertahanan antioksidan yang sama (glutathione peroxidase membutuhkan Se; Vitamin E melindungi membran langsung) — defisiensi salah satu memperberat gejala kekurangan yang lain.' },
      { type: 'kelebihan', icon: '✅', text: 'Dosis supra-nutrisional (100–200 mg/kg pada broiler, jauh di atas kebutuhan dasar 10–20 mg/kg) terbukti meningkatkan respons antibodi, memperpanjang shelf-life daging (mengurangi drip loss & oksidasi lemak), dan memperbaiki kualitas warna daging.' },
      { type: 'peringatan', icon: '⚠️', text: 'Margin keamanan Vitamin E sangat lebar dibanding vitamin larut lemak lain — toksisitas jarang terjadi pada dosis pakan normal, namun dosis ekstrem (>1000 mg/kg berkepanjangan) dapat mengganggu pembekuan darah karena antagonisme dengan Vitamin K.' },
    ],
  },

  // ── Vitamin K3 ─────────────────────────────────────────────────────────────
  'vitamin-k3': {
    namaKimia: 'Menadione Sodium Bisulfite (MSB) / Menadione Sodium Bisulfite Complex (MSBC)',
    asal: 'Sintesis kimia dari menadion (2-methyl-1,4-naphthoquinone) yang direaksikan dengan natrium bisulfit untuk stabilitas dan kelarutan',
    fungsiUtama: 'Kofaktor sintesis faktor pembekuan darah (protrombin) dan metabolisme tulang',
    bentukFisik: 'Serbuk kristal putih-kekuningan, larut air',
    stabilitasPenyimpanan: 'Stabil 12–18 bulan dalam kemasan tertutup kering; sensitif terhadap kelembapan dan alkali kuat',
    kelebihan: 'Jauh lebih stabil dan murah dibanding K1 (phylloquinone) alami; larut air memudahkan pencampuran homogen; bentuk MSB paling umum diregulasi untuk pakan ternak.',
    kekurangan: 'Toksik pada dosis sangat tinggi (>1000× kebutuhan) — dapat menyebabkan anemia hemolitik; kurang stabil dibanding vitamin larut lemak berenkapsulasi terhadap trace mineral reaktif.',
    komposisi: {
      bahanAktif: 'Menadione Sodium Bisulfite (MSB) 50–52%',
      kadarBahanAktif: '50–52% menadione aktif (setara ±33% menadion murni pada basis MSBC)',
      senyawaAktif: 'Menadione (Vitamin K3 sintetis)',
      satuanPotensi: 'mg/kg atau ppm',
      ph: '3,5–5,5 (larutan air 1%)',
      kelarutan: 'Larut air tinggi (>200 g/L pada 20°C)',
      stabilitasPanas: 'Retensi 85–90% pada pelleting suhu 80°C',
      stabilitasPenyimpanan: '80–90% retensi setelah 6 bulan dalam premix kering',
      dosisReferensi: 'Ayam broiler: 1–3 mg menadione/kg pakan; Sapi/kambing/domba: 0,5–1 mg/kg BK ransum',
    },
    penggunaan: {
      fungsiUtama: 'Kofaktor karboksilasi residu asam glutamat pada faktor pembekuan darah II (protrombin), VII, IX, X di hati; juga berperan pada mineralisasi tulang melalui aktivasi osteocalcin.',
      dosisPenggunaan: 'Unggas: 1–4 mg/kg pakan; Sapi/kambing/domba: 0,5–1,5 mg/kg BK ransum; Babi: 0,5–2 mg/kg pakan',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Sapi Perah', 'Sapi Pedaging', 'Kambing', 'Domba', 'Babi'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Bunting', 'Menyusui'],
      metodePemberian: 'Dicampur dalam premix vitamin, homogenisasi ke ransum basal; dosis dinaikkan pada kondisi mikotoksin (yang menghambat sintesis faktor pembekuan) atau penggunaan antikoagulan.',
      kompatibilitas: 'Kompatibel dengan sebagian besar bahan pakan; hindari kontak langsung berkepanjangan dengan alkali kuat (dapat merusak struktur menadion). Dosis dinaikkan bila ransum terkontaminasi mikotoksin dicoumarol-like (jarang, umumnya dari sweet clover moldy).',
      catatan: 'Ruminansia dewasa umumnya mendapat cukup Vitamin K dari sintesis mikroba rumen — suplementasi terutama penting pada unggas dan ternak muda pra-ruminan.',
    },
    harga: {
      estimasiAI: 95000,
      hargaMarketplace: 90000,
      satuan: 'per kg (produk MSB 50%)',
      supplier: 'Distributor premix vitamin nasional; toko pakan ternak grosir',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed.',
      ],
      sumberData: 'Dosis mengacu pada NRC Poultry (1994); data kelarutan & stabilitas dari spesifikasi teknis produk MSB komersial.',
      catatan: 'Regulasi Uni Eropa membatasi penggunaan menadion (K3) karena kekhawatiran toksisitas pada dosis sangat tinggi — selalu ikuti batas maksimum regulasi pakan setempat.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🩸', text: 'Vitamin K adalah kofaktor esensial enzim gamma-glutamyl carboxylase yang mengaktifkan faktor pembekuan darah di hati. Tanpa K3 cukup, waktu pembekuan darah memanjang drastis, meningkatkan risiko perdarahan spontan.' },
      { type: 'kekurangan', icon: '🩸', text: 'Defisiensi menyebabkan perdarahan subkutan/intramuskular, waktu pembekuan darah memanjang, dan pada kasus berat kematian akibat perdarahan internal. Anak unggas paling rentan karena cadangan tubuh minimal saat menetas.' },
      { type: 'peringatan', icon: '⚠️', text: 'Dosis sangat berlebih (jauh di atas rekomendasi, ratusan kali lipat) dapat menyebabkan anemia hemolitik dan hiperbilirubinemia — selalu ikuti dosis label premix, jangan menaikkan dosis K3 secara sembarangan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Interaksi antagonis dengan Vitamin E dosis sangat tinggi (kompetisi jalur metabolik) dan dengan mikotoksin dicoumarol-like yang menghambat regenerasi Vitamin K aktif di hati — pada kasus kontaminasi mikotoksin, dosis K3 perlu dinaikkan sebagai mitigasi.' },
      { type: 'kombinasi', icon: '🎯', text: 'Paling kritis diberikan pada unggas pedaging dan ternak muda pra-ruminan yang belum memiliki populasi mikroba rumen matang untuk sintesis Vitamin K endogen.' },
    ],
  },

  // ── Vitamin B1 (Thiamin) ─────────────────────────────────────────────────
  'vitamin-b1': {
    namaKimia: 'Thiamine Mononitrate (feed grade, lebih stabil dari Thiamine HCl)',
    asal: 'Sintesis kimia industri; tersedia sebagai mononitrate (stabilitas lebih baik) atau hydrochloride (kelarutan lebih tinggi)',
    fungsiUtama: 'Koenzim (TPP) dalam metabolisme karbohidrat dan produksi energi',
    bentukFisik: 'Serbuk kristal putih, sedikit higroskopis',
    stabilitasPenyimpanan: 'Stabil 18–24 bulan dalam kemasan tertutup kering; mononitrate lebih tahan panas dibanding HCl',
    kelebihan: 'Esensial untuk unggas & babi (tidak dapat disintesis); bentuk mononitrate tahan proses pelleting; harga relatif terjangkau.',
    kekurangan: 'Ruminansia dewasa jarang perlu suplementasi (sintesis mikroba rumen cukup) kecuali kondisi asidosis rumen; larut air sehingga rentan tercuci pada pakan basah.',
    komposisi: {
      bahanAktif: 'Thiamine Mononitrate 98–99%',
      kadarBahanAktif: '98–99% murni (feed grade standar)',
      senyawaAktif: 'Thiamine (Vitamin B1 aktif, sebagai koenzim Thiamine Pyrophosphate/TPP)',
      satuanPotensi: 'mg/kg',
      ph: '5,0–6,5 (larutan air 5%)',
      kelarutan: 'Larut air sedang (±1 g/100 mL pada 25°C, lebih rendah dari bentuk HCl)',
      stabilitasPanas: 'Retensi 85–95% pada pelleting suhu 80–85°C',
      stabilitasPenyimpanan: '90% retensi setelah 6 bulan penyimpanan kering',
      dosisReferensi: 'Ayam broiler: 1–2 mg/kg pakan; Babi: 1–1,5 mg/kg pakan',
    },
    penggunaan: {
      fungsiUtama: 'Koenzim Thiamine Pyrophosphate (TPP) dalam dekarboksilasi piruvat dan siklus pentosa fosfat — esensial untuk metabolisme karbohidrat dan produksi energi seluler, terutama jaringan saraf yang sangat bergantung glukosa.',
      dosisPenggunaan: 'Unggas: 1–3 mg/kg pakan; Babi: 1–2 mg/kg pakan; Ruminansia (kondisi asidosis/PEM): 3–10 mg/kg BB/hari secara terapeutik',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi', 'Sapi Perah', 'Sapi Pedaging'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan'],
      metodePemberian: 'Dicampur dalam premix vitamin B-kompleks; pada kasus terapeutik (polioencephalomalacia sapi) dapat diberikan injeksi oleh dokter hewan.',
      kompatibilitas: 'Kompatibel dengan vitamin B-kompleks lain dalam premix standar; hindari kontak berkepanjangan dengan bahan alkali kuat yang mempercepat degradasi.',
      catatan: 'Suplementasi rutin pakan basal terutama penting pada unggas dan babi; pada sapi perah/potong hanya kritis saat rumen tidak berfungsi normal (asidosis akut, PEM/Polioencephalomalacia).',
    },
    harga: {
      estimasiAI: 75000,
      hargaMarketplace: 70000,
      satuan: 'per kg (produk 98% mononitrate)',
      supplier: 'Distributor premix vitamin nasional; toko pakan ternak grosir; apotek hewan',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.',
        'McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed.',
      ],
      sumberData: 'Dosis mengacu pada NRC Poultry (1994) dan NRC Swine (2012); data terapeutik PEM sapi dari literatur veteriner standar.',
      catatan: 'Dosis terapeutik untuk PEM sapi harus di bawah pengawasan dokter hewan — jauh lebih tinggi dari dosis nutrisi rutin pakan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Thiamin (sebagai TPP) adalah koenzim kunci dalam dekarboksilasi piruvat menjadi asetil-KoA — langkah penghubung glikolisis dengan siklus Krebs. Jaringan saraf sangat bergantung glukosa sehingga paling rentan defisiensi.' },
      { type: 'kekurangan', icon: '🧠', text: 'Pada unggas/babi: polyneuritis, kehilangan nafsu makan, kelumpuhan, kematian mendadak. Pada sapi: Polioencephalomalacia (PEM) — kebutaan, kejang, opisthotonus (kepala menengadah ke belakang) — kondisi darurat veteriner.' },
      { type: 'kombinasi', icon: '🔗', text: 'Pada ruminansia, defisiensi thiamin fungsional biasanya dipicu oleh asidosis rumen (ransum tinggi konsentrat) yang mengubah populasi mikroba menjadi memproduksi thiaminase (enzim perusak thiamin) — bukan defisiensi diet murni.' },
      { type: 'peringatan', icon: '⚠️', text: 'PEM pada sapi adalah kondisi darurat — keterlambatan penanganan (injeksi thiamin dosis tinggi) dalam 24–48 jam pertama dapat menyebabkan kerusakan saraf permanen atau kematian.' },
      { type: 'kombinasi', icon: '🎯', text: 'Efektivitas tertinggi diberikan sebagai bagian premix B-kompleks lengkap (B1, B2, B6, B12, niasin, dll.) karena vitamin B saling mendukung dalam jalur metabolisme energi yang sama.' },
    ],
  },

  // ── Vitamin B2 (Riboflavin) ──────────────────────────────────────────────
  'vitamin-b2': {
    namaKimia: 'Riboflavin (feed grade, produksi fermentasi mikroba)',
    asal: 'Fermentasi mikroba industri (Ashbya gossypii, Bacillus subtilis rekombinan) — bukan sintesis kimia total',
    fungsiUtama: 'Komponen koenzim FAD/FMN dalam rantai respirasi dan metabolisme energi',
    bentukFisik: 'Serbuk kristal kuning-oranye terang, fotosensitif',
    stabilitasPenyimpanan: 'Stabil 18–24 bulan dalam kemasan tertutup gelap; sangat sensitif terhadap cahaya (fotodegradasi cepat pada larutan terbuka)',
    kelebihan: 'Sangat stabil terhadap panas pelleting (lebih tahan dibanding thiamin); produksi fermentasi biaya makin efisien; kompatibel luas dalam premix.',
    kekurangan: 'Sangat fotosensitif — larutan/serbuk terbuka terdegradasi cepat oleh cahaya; kelarutan air relatif rendah dibanding vitamin B lain.',
    komposisi: {
      bahanAktif: 'Riboflavin 80% (spray-dried, produk fermentasi)',
      kadarBahanAktif: '80% riboflavin murni (grade feed umum)',
      senyawaAktif: 'Riboflavin, aktif sebagai koenzim FAD (Flavin Adenine Dinucleotide) dan FMN (Flavin Mononucleotide)',
      satuanPotensi: 'mg/kg',
      ph: '6,0–7,0 (suspensi air)',
      kelarutan: 'Larut air rendah (±0,01–0,03 g/100 mL pada 25°C)',
      stabilitasPanas: 'Retensi >90% pada pelleting suhu 85°C (relatif stabil terhadap panas)',
      stabilitasPenyimpanan: '85–90% retensi setelah 6 bulan bila terlindung cahaya',
      dosisReferensi: 'Ayam broiler: 3,6–4 mg/kg pakan; Ayam petelur: 2,5–4 mg/kg pakan',
    },
    penggunaan: {
      fungsiUtama: 'Prekursor koenzim FAD dan FMN yang esensial pada rantai transpor elektron mitokondria dan berbagai reaksi oksidasi-reduksi metabolisme karbohidrat, lemak, dan protein.',
      dosisPenggunaan: 'Unggas: 3–6 mg/kg pakan; Babi: 3–4 mg/kg pakan; Sapi perah/pedaging (suplementasi jarang perlu, mikroba rumen umumnya cukup)',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan'],
      metodePemberian: 'Dicampur dalam premix B-kompleks, disimpan terlindung cahaya sebelum dan sesudah pencampuran ke ransum.',
      kompatibilitas: 'Kompatibel dengan vitamin B lain; hindari paparan cahaya matahari langsung pada bahan baku curah dan produk premix jadi.',
      catatan: 'Ayam petelur khususnya rentan defisiensi karena kebutuhan tinggi untuk produksi telur — pantau kualitas telur dan daya tetas sebagai indikator status riboflavin.',
    },
    harga: {
      estimasiAI: 110000,
      hargaMarketplace: 105000,
      satuan: 'per kg (produk 80%)',
      supplier: 'Distributor premix vitamin nasional; toko pakan ternak grosir',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.',
        'McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed.',
      ],
      sumberData: 'Dosis mengacu pada NRC Poultry (1994) dan NRC Swine (2012).',
      catatan: 'Simpan premix riboflavin di wadah buram/gelap — paparan cahaya fluoresen dapat menurunkan potensi hingga 50% dalam beberapa jam pada larutan terbuka.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Riboflavin membentuk koenzim FAD dan FMN, komponen kunci rantai respirasi mitokondria yang menghasilkan ATP. Berperan dalam >50 reaksi enzimatik metabolisme energi, lemak, dan protein.' },
      { type: 'kekurangan', icon: '🦶', text: 'Defisiensi klasik pada unggas: "curled toe paralysis" — jari kaki melingkar ke dalam akibat degenerasi saraf perifer, disertai penurunan pertumbuhan dan daya tetas telur yang menurun drastis.' },
      { type: 'kombinasi', icon: '🔗', text: 'Bekerja bersama niasin dan B6 dalam jalur metabolisme energi yang saling terkait — defisiensi kombinasi vitamin B sering muncul bersamaan pada ransum berbasis biji-bijian tunggal tanpa suplementasi premix.' },
      { type: 'peringatan', icon: '⚠️', text: 'Riboflavin sangat fotosensitif — penyimpanan bahan baku curah atau premix jadi di area terang/terbuka dapat menurunkan potensi signifikan sebelum sempat digunakan, menyebabkan defisiensi tersembunyi meski sudah "disuplementasi".' },
      { type: 'kombinasi', icon: '🎯', text: 'Ayam petelur membutuhkan asupan lebih tinggi dibanding broiler karena riboflavin ditransfer signifikan ke kuning telur — pemantauan daya tetas adalah indikator praktis status riboflavin peternakan pembibitan.' },
    ],
  },

  // ── Vitamin B6 (Pyridoxine) ──────────────────────────────────────────────
  'vitamin-b6': {
    namaKimia: 'Pyridoxine Hydrochloride (feed grade)',
    asal: 'Sintesis kimia industri',
    fungsiUtama: 'Koenzim (PLP) dalam metabolisme asam amino, sintesis neurotransmitter dan hemoglobin',
    bentukFisik: 'Serbuk kristal putih, larut air tinggi',
    stabilitasPenyimpanan: 'Stabil 18–24 bulan dalam kemasan tertutup kering; cukup stabil terhadap panas namun sensitif cahaya UV',
    kelebihan: 'Kelarutan air sangat baik memudahkan pencampuran homogen; harga terjangkau; stabilitas panas relatif baik untuk pelleting.',
    kekurangan: 'Sensitif terhadap cahaya UV dalam larutan; ruminansia dewasa umumnya tidak perlu suplementasi tambahan (sintesis mikroba rumen mencukupi).',
    komposisi: {
      bahanAktif: 'Pyridoxine Hydrochloride 98–99%',
      kadarBahanAktif: '98–99% murni (feed grade standar)',
      senyawaAktif: 'Pyridoxine, aktif sebagai koenzim Pyridoxal-5-Phosphate (PLP)',
      satuanPotensi: 'mg/kg',
      ph: '2,0–3,0 (larutan air 5%, bentuk HCl bersifat asam)',
      kelarutan: 'Larut air sangat tinggi (>200 g/L pada 25°C)',
      stabilitasPanas: 'Retensi 85–90% pada pelleting suhu 80–85°C',
      stabilitasPenyimpanan: '85–90% retensi setelah 6 bulan penyimpanan kering terlindung cahaya',
      dosisReferensi: 'Ayam broiler: 3–3,5 mg/kg pakan; Babi: 1,5–2 mg/kg pakan',
    },
    penggunaan: {
      fungsiUtama: 'Koenzim Pyridoxal-5-Phosphate (PLP) dalam >100 reaksi enzimatik, terutama transaminasi dan dekarboksilasi asam amino; esensial untuk sintesis neurotransmitter (serotonin, dopamin), hemoglobin, dan antibodi.',
      dosisPenggunaan: 'Unggas: 3–5 mg/kg pakan; Babi: 1,5–3 mg/kg pakan',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan'],
      metodePemberian: 'Dicampur dalam premix B-kompleks, homogenisasi ke ransum basal.',
      kompatibilitas: 'Kompatibel dengan vitamin B-kompleks lain; kebutuhan meningkat pada ransum tinggi protein karena keterlibatan langsung dalam metabolisme asam amino.',
      catatan: 'Ransum berprotein tinggi (misalnya starter unggas fase awal) membutuhkan kadar B6 lebih tinggi karena beban metabolisme asam amino yang meningkat.',
    },
    harga: {
      estimasiAI: 85000,
      hargaMarketplace: 80000,
      satuan: 'per kg (produk 98% HCl)',
      supplier: 'Distributor premix vitamin nasional; toko pakan ternak grosir',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.',
        'McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed.',
      ],
      sumberData: 'Dosis mengacu pada NRC Poultry (1994) dan NRC Swine (2012).',
      catatan: 'Kebutuhan B6 berkorelasi dengan tingkat protein ransum — formula ransum tinggi protein perlu penyesuaian dosis ke atas.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧬', text: 'Pyridoxal-5-Phosphate (bentuk aktif B6) adalah koenzim serbaguna dalam metabolisme asam amino — terlibat pada transaminasi, dekarboksilasi, dan sintesis neurotransmitter penting bagi fungsi saraf normal.' },
      { type: 'kekurangan', icon: '🧠', text: 'Defisiensi pada unggas menyebabkan dermatitis, kejang epileptiform, ataksia, dan penurunan pertumbuhan tajam karena gangguan metabolisme asam amino esensial.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kebutuhan meningkat proporsional dengan level protein/asam amino ransum — ransum tinggi protein (starter, breeder) memerlukan B6 lebih tinggi untuk mendukung laju transaminasi yang meningkat.' },
      { type: 'kombinasi', icon: '🎯', text: 'Bekerja bersama B12 dan asam folat dalam metabolisme homosistein dan sintesis metionin — ketiganya sering dievaluasi bersama pada program breeder untuk optimalisasi daya tetas.' },
      { type: 'alternatif', icon: '🌾', text: 'Ruminansia dewasa umumnya memenuhi kebutuhan B6 dari sintesis mikroba rumen; suplementasi diet langsung lebih relevan untuk unggas dan babi berbasis pakan nabati murni.' },
    ],
  },

  // ── Vitamin B12 (Cobalamin) ──────────────────────────────────────────────
  'vitamin-b12': {
    namaKimia: 'Cyanocobalamin (feed grade, produksi fermentasi mikroba)',
    asal: 'Fermentasi mikroba industri (Pseudomonas denitrificans, Propionibacterium shermanii) — satu-satunya vitamin B yang mengandung mineral (kobalt)',
    fungsiUtama: 'Kofaktor sintesis DNA, metabolisme asam folat, dan fungsi neurologis',
    bentukFisik: 'Serbuk premix merah muda pucat (diluted carrier, karena aktivitas sangat tinggi pada dosis µg)',
    stabilitasPenyimpanan: 'Stabil 18–24 bulan dalam kemasan tertutup kering; relatif stabil terhadap panas dibanding vitamin B larut air lain',
    kelebihan: 'Aktif pada dosis sangat rendah (mg/ton pakan); tidak ditemukan pada bahan nabati sehingga suplementasi esensial untuk ransum berbasis nabati murni; stabil terhadap pelleting.',
    kekurangan: 'Harga per kg sangat mahal (karena kadar aktif diencerkan pada carrier) dibanding vitamin B lain; kebutuhan sangat presisi karena dosis efektif dalam skala mikrogram.',
    komposisi: {
      bahanAktif: 'Cyanocobalamin 1% (diluted premix carrier, kadar aktif murni sangat tinggi)',
      kadarBahanAktif: '1% (10.000 mg/kg) — grade premix standar industri',
      senyawaAktif: 'Cyanocobalamin (Vitamin B12 aktif)',
      satuanPotensi: 'mg/kg atau µg/kg',
      ph: null,
      kelarutan: 'Larut air baik',
      stabilitasPanas: 'Retensi >90% pada pelleting suhu 85°C',
      stabilitasPenyimpanan: '90% retensi setelah 6 bulan penyimpanan kering',
      dosisReferensi: 'Ayam broiler: 0,01–0,015 mg/kg pakan (10–15 µg/kg); Babi: 0,015–0,02 mg/kg pakan',
    },
    penggunaan: {
      fungsiUtama: 'Kofaktor esensial sintesis DNA (metilasi), metabolisme folat, dan sintesis metionin dari homosistein; berperan dalam mielinisasi saraf dan pembentukan sel darah merah.',
      dosisPenggunaan: 'Unggas: 0,01–0,02 mg/kg pakan; Babi: 0,015–0,03 mg/kg pakan; Ruminansia (bergantung ketersediaan Co pakan): suplementasi Co lebih relevan daripada B12 langsung',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan', 'Bunting'],
      metodePemberian: 'Dicampur dalam premix vitamin sebagai bahan pre-diluted (karena dosis sangat kecil, tidak dicampur langsung tanpa carrier).',
      kompatibilitas: 'Bekerja erat dengan asam folat dan kolin dalam siklus metilasi satu-karbon; esensial khususnya untuk ransum berbasis nabati murni (tanpa tepung ikan/produk hewani).',
      catatan: 'Ruminansia mensintesis B12 di rumen dari kobalt (Co) pakan — kekurangan B12 pada ruminansia sebenarnya mencerminkan defisiensi Co, bukan B12 langsung.',
    },
    harga: {
      estimasiAI: 3500000,
      hargaMarketplace: 3300000,
      satuan: 'per kg (produk premix 1%)',
      supplier: 'Distributor premix vitamin nasional (produk khusus, stok terbatas)',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
      ],
      sumberData: 'Dosis mengacu pada NRC Poultry (1994) dan NRC Swine (2012); hubungan Co-B12 ruminansia dari NRC Dairy Cattle (2001).',
      catatan: 'Untuk ruminansia, evaluasi status Co pakan (lihat kategori Mineral) lebih relevan daripada suplementasi B12 langsung.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧬', text: 'Vitamin B12 adalah satu-satunya vitamin yang mengandung mineral (kobalt) dalam struktur molekulnya, esensial untuk sintesis DNA dan regenerasi metionin dari homosistein bersama asam folat.' },
      { type: 'kekurangan', icon: '🩸', text: 'Defisiensi menyebabkan anemia megaloblastik, penurunan pertumbuhan, dan pada breeder menurunkan daya tetas telur secara signifikan akibat gangguan pembelahan sel embrio.' },
      { type: 'alternatif', icon: '🌱', text: 'Tidak ditemukan pada bahan pakan nabati sama sekali — ransum unggas/babi berbasis 100% nabati (tanpa tepung ikan/produk hewani) WAJIB disuplementasi B12 sintetis untuk mencegah defisiensi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Bekerja erat dengan asam folat dalam siklus metilasi satu-karbon — defisiensi salah satu dapat memicu "folate trap" yang memperberat gejala defisiensi keduanya secara bersamaan.' },
      { type: 'kombinasi', icon: '🎯', text: 'Pada ruminansia, kecukupan B12 sepenuhnya bergantung pada ketersediaan kobalt (Co) pakan untuk sintesis mikroba rumen — suplementasi Co lebih tepat sasaran dibanding B12 sintetis langsung.' },
    ],
  },

  // ── Niasin (Vitamin B3) ─────────────────────────────────────────────────
  'niasin-b3': {
    namaKimia: 'Nicotinic Acid / Nicotinamide (feed grade)',
    asal: 'Sintesis kimia industri',
    fungsiUtama: 'Komponen koenzim NAD/NADP dalam metabolisme energi dan redoks',
    bentukFisik: 'Serbuk kristal putih, larut air baik',
    stabilitasPenyimpanan: 'Sangat stabil — salah satu vitamin paling tahan panas, cahaya, dan oksidasi (stabil >24 bulan)',
    kelebihan: 'Vitamin paling stabil di antara vitamin B-kompleks; tahan proses pelleting ekstrem; harga terjangkau.',
    kekurangan: 'Konversi endogen dari triptofan tidak efisien pada unggas — suplementasi eksplisit tetap diperlukan meski ransum tinggi protein/triptofan.',
    komposisi: {
      bahanAktif: 'Nicotinic Acid atau Nicotinamide 99%',
      kadarBahanAktif: '99% murni (feed grade standar)',
      senyawaAktif: 'Niacin, aktif sebagai koenzim NAD (Nicotinamide Adenine Dinucleotide) dan NADP',
      satuanPotensi: 'mg/kg',
      ph: '3,0–4,0 (larutan air, bentuk asam nikotinat)',
      kelarutan: 'Larut air baik (±1,6 g/100 mL pada 25°C untuk asam nikotinat)',
      stabilitasPanas: 'Retensi >95% pada pelleting suhu 90°C — sangat tahan panas',
      stabilitasPenyimpanan: '95%+ retensi setelah 12 bulan penyimpanan standar',
      dosisReferensi: 'Ayam broiler: 30–50 mg/kg pakan; Babi: 10–20 mg/kg pakan',
    },
    penggunaan: {
      fungsiUtama: 'Komponen koenzim NAD dan NADP yang terlibat dalam ratusan reaksi redoks metabolisme energi, sintesis asam lemak, dan perbaikan DNA; esensial untuk kesehatan kulit dan saluran cerna.',
      dosisPenggunaan: 'Unggas: 30–70 mg/kg pakan (broiler perlu lebih tinggi dari layer); Babi: 10–25 mg/kg pakan',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan'],
      metodePemberian: 'Dicampur dalam premix B-kompleks, homogenisasi ke ransum basal.',
      kompatibilitas: 'Sangat kompatibel dengan seluruh bahan pakan dan vitamin lain karena stabilitas tinggi; sering menjadi "vitamin jangkar" dalam premix karena minim risiko degradasi.',
      catatan: 'Ransum berbasis jagung memerlukan suplementasi niasin lebih tinggi karena niasin jagung terikat dalam bentuk tidak tersedia secara biologis (niacytin).',
    },
    harga: {
      estimasiAI: 35000,
      hargaMarketplace: 32000,
      satuan: 'per kg (produk 99%)',
      supplier: 'Distributor premix vitamin nasional; toko pakan ternak grosir',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.',
        'McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed.',
      ],
      sumberData: 'Dosis mengacu pada NRC Poultry (1994) dan NRC Swine (2012).',
      catatan: 'Niasin dalam jagung terikat sebagai niacytin (kompleks tidak tersedia secara biologis) — kandungan niasin total jagung tinggi tapi bioavailabilitasnya sangat rendah.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Niasin membentuk NAD dan NADP, koenzim redoks paling banyak digunakan dalam metabolisme sel — terlibat pada glikolisis, siklus Krebs, sintesis asam lemak, dan perbaikan DNA.' },
      { type: 'kekurangan', icon: '🦶', text: 'Defisiensi klasik pada unggas: dermatitis kaki (bumblefoot-like lesions), radang mulut/lidah, dan pertumbuhan terhambat parah — mirip gejala pellagra pada manusia.' },
      { type: 'peringatan', icon: '💡', text: 'Meski triptofan dapat dikonversi menjadi niasin, efisiensi konversi pada unggas sangat rendah (60 mg triptofan ≈ 1 mg niasin) — ransum tinggi protein TIDAK menggantikan kebutuhan suplementasi niasin langsung.' },
      { type: 'kelebihan', icon: '✅', text: 'Niasin adalah vitamin paling stabil dalam kelompok B-kompleks — tahan terhadap panas ekstrusi/pelleting, oksidasi, dan penyimpanan jangka panjang tanpa kehilangan potensi signifikan.' },
      { type: 'alternatif', icon: '🌽', text: 'Ransum berbasis jagung (sumber energi dominan di Indonesia) memerlukan perhatian khusus karena niasin jagung terikat sebagai niacytin yang hampir tidak tersedia secara biologis bagi unggas monogastrik.' },
    ],
  },

  // ── Asam Pantotenat ──────────────────────────────────────────────────────
  'asam-pantotenat': {
    namaKimia: 'Calcium D-Pantothenate (feed grade)',
    asal: 'Sintesis kimia industri, distabilkan sebagai garam kalsium',
    fungsiUtama: 'Prekursor Koenzim A (CoA) dalam metabolisme energi',
    bentukFisik: 'Serbuk kristal putih, higroskopis ringan',
    stabilitasPenyimpanan: 'Stabil 18 bulan dalam kemasan tertutup kering; bentuk kalsium jauh lebih stabil dibanding asam pantotenat bebas',
    kelebihan: 'Bentuk kalsium D-pantotenat stabil terhadap pelleting dan penyimpanan; esensial universal untuk semua spesies ternak; harga terjangkau.',
    kekurangan: 'Sedikit higroskopis — perlu penyimpanan kering ketat untuk mencegah penggumpalan dan degradasi bertahap.',
    komposisi: {
      bahanAktif: 'Calcium D-Pantothenate 98%',
      kadarBahanAktif: '98% murni, setara ±92% D-pantothenic acid aktif',
      senyawaAktif: 'D-Pantothenic Acid (Vitamin B5 aktif), prekursor Coenzyme A',
      satuanPotensi: 'mg/kg',
      ph: '7,0–9,0 (larutan air, garam kalsium bersifat sedikit basa)',
      kelarutan: 'Larut air baik (±35 g/100 mL pada 25°C)',
      stabilitasPanas: 'Retensi 85–90% pada pelleting suhu 80–85°C',
      stabilitasPenyimpanan: '85–90% retensi setelah 6 bulan penyimpanan kering',
      dosisReferensi: 'Ayam broiler: 10–12 mg/kg pakan; Babi: 10–15 mg/kg pakan',
    },
    penggunaan: {
      fungsiUtama: 'Prekursor Coenzyme A (CoA), esensial dalam metabolisme karbohidrat, lemak, dan protein — terlibat pada siklus Krebs dan sintesis asam lemak/kolesterol/hormon steroid.',
      dosisPenggunaan: 'Unggas: 10–15 mg/kg pakan; Babi: 10–20 mg/kg pakan (level lebih tinggi untuk induk babi menyusui)',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan', 'Menyusui'],
      metodePemberian: 'Dicampur dalam premix B-kompleks, homogenisasi ke ransum basal.',
      kompatibilitas: 'Kompatibel luas dengan vitamin dan mineral lain dalam premix standar.',
      catatan: 'Babi menyusui dan starter perlu dosis lebih tinggi mengingat peran kritis dalam sintesis asam lemak susu dan metabolisme energi fase pertumbuhan cepat.',
    },
    harga: {
      estimasiAI: 55000,
      hargaMarketplace: 50000,
      satuan: 'per kg (produk 98% kalsium D-pantotenat)',
      supplier: 'Distributor premix vitamin nasional; toko pakan ternak grosir',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.',
        'McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed.',
      ],
      sumberData: 'Dosis mengacu pada NRC Poultry (1994) dan NRC Swine (2012).',
      catatan: 'Gejala defisiensi klasik ("goose-stepping" babi) sudah jarang terjadi pada industri modern karena suplementasi rutin dalam premix komersial.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Sebagai prekursor Coenzyme A, asam pantotenat terlibat pada lebih dari 100 reaksi enzimatik metabolisme energi — termasuk oksidasi asam lemak, sintesis kolesterol, dan produksi hormon steroid.' },
      { type: 'kekurangan', icon: '🚶', text: 'Defisiensi klasik pada babi: "goose-stepping" — gaya berjalan kaku tidak normal akibat degenerasi saraf perifer. Pada unggas: dermatitis di sekitar mata dan paruh, pertumbuhan terhambat, dan penurunan daya tetas telur.' },
      { type: 'kombinasi', icon: '🔗', text: 'Bekerja bersama biotin dalam jalur metabolisme lemak — keduanya sering diformulasikan bersamaan dalam premix karena peran komplementer pada sintesis dan oksidasi asam lemak.' },
      { type: 'kelebihan', icon: '✅', text: 'Esensial universal untuk semua spesies ternak tanpa terkecuali — tidak ada spesies ternak yang dapat mensintesis kebutuhan penuh asam pantotenat secara endogen dalam jumlah cukup.' },
      { type: 'kombinasi', icon: '🎯', text: 'Kebutuhan meningkat signifikan pada fase reproduksi (induk bunting/menyusui) karena perannya dalam sintesis komponen lemak susu dan mendukung perkembangan janin/anak.' },
    ],
  },

  // ── Biotin ───────────────────────────────────────────────────────────────
  'biotin': {
    namaKimia: 'D-Biotin (feed grade, produk kristal murni sintetis)',
    asal: 'Sintesis kimia industri (proses multi-tahap kompleks) — biaya produksi tinggi membuat harga per kg sangat mahal',
    fungsiUtama: 'Koenzim karboksilasi dalam glukoneogenesis dan sintesis asam lemak',
    bentukFisik: 'Serbuk premix putih (diluted carrier, karena dosis aktif sangat rendah dalam skala mg/ton)',
    stabilitasPenyimpanan: 'Sangat stabil terhadap panas dan penyimpanan — salah satu vitamin paling tahan proses (>24 bulan)',
    kelebihan: 'Aktif pada dosis sangat rendah; sangat stabil terhadap pelleting/ekstrusi; kritis untuk kualitas kerabang telur dan kesehatan kaki babi.',
    kekurangan: 'Harga per kg sangat tinggi (salah satu vitamin termahal); avidin mentah pada putih telur dapat mengikat biotin jika tercampur tanpa pemanasan (jarang relevan pada pakan ternak modern).',
    komposisi: {
      bahanAktif: 'D-Biotin 2% (diluted premix carrier)',
      kadarBahanAktif: '2% (20.000 mg/kg) — grade premix standar industri',
      senyawaAktif: 'D-Biotin (Vitamin B7/H aktif)',
      satuanPotensi: 'mg/kg atau µg/kg',
      ph: null,
      kelarutan: 'Larut air sedang',
      stabilitasPanas: 'Retensi >95% pada pelleting suhu 90°C — sangat tahan panas',
      stabilitasPenyimpanan: '95%+ retensi setelah 12 bulan penyimpanan standar',
      dosisReferensi: 'Ayam petelur: 0,1–0,15 mg/kg pakan (untuk kualitas kerabang); Babi: 0,2–0,44 mg/kg pakan (untuk kesehatan kaki)',
    },
    penggunaan: {
      fungsiUtama: 'Koenzim pada reaksi karboksilasi (pyruvate carboxylase, acetyl-CoA carboxylase) dalam glukoneogenesis dan sintesis asam lemak; esensial untuk kesehatan kulit, kuku/teracak, dan bulu/rambut.',
      dosisPenggunaan: 'Ayam petelur: 0,1–0,2 mg/kg pakan; Babi (terutama induk): 0,2–0,5 mg/kg pakan; Ayam broiler: 0,1–0,15 mg/kg pakan',
      targetTernak: ['Ayam Petelur', 'Ayam Broiler', 'Babi'],
      programCocok: ['Indukan', 'Bunting', 'Menyusui', 'Grower'],
      metodePemberian: 'Dicampur dalam premix vitamin sebagai bahan pre-diluted (dosis aktif sangat kecil, tidak dicampur langsung tanpa carrier).',
      kompatibilitas: 'Bekerja komplementer dengan asam pantotenat dalam metabolisme lemak; kompatibel dengan seluruh bahan premix standar.',
      catatan: 'Prioritaskan suplementasi pada ayam petelur (kualitas kerabang, mencegah "fatty liver hemorrhagic syndrome") dan babi induk (mencegah retakan telapak kaki/hoof cracking).',
    },
    harga: {
      estimasiAI: 4200000,
      hargaMarketplace: 4000000,
      satuan: 'per kg (produk premix 2%)',
      supplier: 'Distributor premix vitamin nasional (produk khusus, stok terbatas)',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.',
        'McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed.',
      ],
      sumberData: 'Dosis mengacu pada NRC Poultry (1994) dan NRC Swine (2012).',
      catatan: 'Harga per kg tampak sangat tinggi karena kadar aktif diencerkan; kebutuhan total per ton pakan tetap ekonomis karena dosis efektif sangat kecil (µg/kg).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🦶', text: 'Biotin adalah koenzim esensial pada reaksi karboksilasi kunci metabolisme energi dan lemak, serta berperan langsung pada integritas struktural kulit, kuku/teracak, dan bulu/rambut ternak.' },
      { type: 'kekurangan', icon: '🥚', text: 'Defisiensi pada ayam petelur menyebabkan penurunan kualitas kerabang dan Fatty Liver Hemorrhagic Syndrome (FLHS); pada babi menyebabkan dermatitis dan retakan telapak kaki (hoof cracking) yang menyakitkan dan mengurangi mobilitas.' },
      { type: 'kelebihan', icon: '✅', text: 'Biotin adalah salah satu vitamin paling stabil terhadap panas ekstrusi/pelleting — cocok untuk pakan yang diproses dengan suhu tinggi tanpa risiko degradasi signifikan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Bekerja komplementer dengan asam pantotenat dalam jalur metabolisme lemak — kombinasi keduanya dalam premix mendukung kesehatan kulit dan produksi optimal secara sinergis.' },
      { type: 'kombinasi', icon: '🎯', text: 'Prioritas suplementasi tertinggi pada peternakan ayam petelur intensif (kualitas kerabang jangka panjang) dan babi induk (mobilitas dan kesehatan kaki selama masa produktif).' },
    ],
  },

  // ── Asam Folat ───────────────────────────────────────────────────────────
  'asam-folat': {
    namaKimia: 'Folic Acid / Pteroylglutamic Acid (feed grade)',
    asal: 'Sintesis kimia industri',
    fungsiUtama: 'Koenzim metabolisme satu-karbon; sintesis DNA, metionin, dan kolin',
    bentukFisik: 'Serbuk kristal kuning terang, fotosensitif',
    stabilitasPenyimpanan: 'Stabil 12–18 bulan dalam kemasan tertutup gelap-kering; labil terhadap panas dan cahaya tanpa enkapsulasi',
    kelebihan: 'Esensial untuk fase reproduksi/pertumbuhan cepat; enkapsulasi modern meningkatkan stabilitas signifikan terhadap pelleting.',
    kekurangan: 'Tanpa enkapsulasi cukup labil terhadap panas dan cahaya — kehilangan potensi lebih tinggi dibanding niasin/biotin pada proses ekstrusi ekstrem.',
    komposisi: {
      bahanAktif: 'Folic Acid (Pteroylglutamic Acid) 98%',
      kadarBahanAktif: '98% murni (feed grade standar)',
      senyawaAktif: 'Folic Acid (Vitamin B9 aktif)',
      satuanPotensi: 'mg/kg',
      ph: '4,0–5,0 (larutan/suspensi air)',
      kelarutan: 'Larut air rendah (bentuk asam bebas), larut lebih baik sebagai garam natrium',
      stabilitasPanas: 'Retensi 75–85% pada pelleting suhu 80°C tanpa proteksi tambahan',
      stabilitasPenyimpanan: '80–85% retensi setelah 6 bulan terlindung cahaya',
      dosisReferensi: 'Ayam broiler: 0,5–1 mg/kg pakan; Babi: 0,3–1,3 mg/kg pakan',
    },
    penggunaan: {
      fungsiUtama: 'Koenzim dalam metabolisme satu-karbon — esensial untuk sintesis DNA/RNA, regenerasi metionin dari homosistein (bersama B12), dan sintesis kolin; kritis pada pembelahan sel cepat (fase pertumbuhan & reproduksi).',
      dosisPenggunaan: 'Unggas (terutama breeder): 0,5–1,5 mg/kg pakan; Babi (induk): 0,3–1,3 mg/kg pakan',
      targetTernak: ['Ayam Petelur', 'Ayam Broiler', 'Babi'],
      programCocok: ['Indukan', 'Bunting', 'Menyusui', 'Grower'],
      metodePemberian: 'Dicampur dalam premix B-kompleks, disimpan terlindung cahaya sebelum dan sesudah pencampuran.',
      kompatibilitas: 'Bekerja erat dengan B12 dan kolin dalam siklus metilasi satu-karbon — kekurangan salah satu memperberat gejala kekurangan lain.',
      catatan: 'Prioritas suplementasi tertinggi pada breeder/induk untuk mendukung daya tetas telur dan mencegah cacat neural pada embrio.',
    },
    harga: {
      estimasiAI: 180000,
      hargaMarketplace: 170000,
      satuan: 'per kg (produk 98%)',
      supplier: 'Distributor premix vitamin nasional; toko pakan ternak grosir',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.',
        'McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed.',
      ],
      sumberData: 'Dosis mengacu pada NRC Poultry (1994) dan NRC Swine (2012).',
      catatan: 'Simpan bahan baku asam folat curah di tempat gelap-kering — degradasi cahaya dapat menurunkan potensi signifikan sebelum sempat dicampur ke pakan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧬', text: 'Asam folat esensial pada sintesis basa purin/pirimidin (blok bangun DNA/RNA) dan regenerasi metionin — sangat penting pada jaringan dengan laju pembelahan sel tinggi seperti embrio dan sumsum tulang.' },
      { type: 'kekurangan', icon: '🥚', text: 'Defisiensi menyebabkan anemia megaloblastik, penurunan daya tetas telur secara signifikan, dan risiko cacat neural pada embrio unggas akibat gangguan pembelahan sel yang cepat.' },
      { type: 'kombinasi', icon: '🔗', text: 'Berinteraksi erat dengan Vitamin B12 dalam siklus metilasi satu-karbon (regenerasi metionin dari homosistein) — defisiensi salah satu dapat memicu "folate trap" yang memperparah defisiensi fungsional keduanya.' },
      { type: 'peringatan', icon: '⚠️', text: 'Labil terhadap panas dan cahaya tanpa enkapsulasi — proses pelleting suhu tinggi tanpa produk terproteksi dapat menurunkan potensi hingga 25% sebelum sempat dikonsumsi ternak.' },
      { type: 'kombinasi', icon: '🎯', text: 'Paling kritis pada program breeder/pembibitan — status folat induk berkorelasi langsung dengan daya tetas telur dan kualitas anak yang menetas.' },
    ],
  },

  // ── Kolin Klorida ────────────────────────────────────────────────────────
  'kolin-klorida': {
    namaKimia: 'Choline Chloride (feed grade, adsorbat silika 50–60%)',
    asal: 'Sintesis kimia industri, distabilkan pada carrier silika untuk mengurangi higroskopisitas',
    fungsiUtama: 'Sintesis fosfolipid membran, transmisi saraf (asetilkolin), metabolisme lemak hati',
    bentukFisik: 'Serbuk adsorbat kuning-coklat pada carrier silika, higroskopis, berbau amis khas',
    stabilitasPenyimpanan: 'Stabil 12 bulan dalam kemasan tertutup kering; sangat higroskopis — mudah menggumpal bila kelembapan tinggi',
    kelebihan: 'Digunakan dalam jumlah besar dengan harga per kg paling murah di antara semua vitamin; efektif mencegah fatty liver; mudah didapat.',
    kekurangan: 'Sangat tidak stabil bersama vitamin lain dalam premix campuran (bersifat higroskopis dan reaktif) — harus ditambahkan terpisah dari premix vitamin utama; berbau menyengat.',
    komposisi: {
      bahanAktif: 'Choline Chloride 50–60% pada carrier silika/jagung',
      kadarBahanAktif: '50% atau 60% (dua grade umum industri)',
      senyawaAktif: 'Choline (nutrien "vitamin-like", bukan vitamin sejati karena dapat disintesis tubuh dalam jumlah terbatas)',
      satuanPotensi: 'g/kg atau %',
      ph: '6,0–7,0 (larutan air)',
      kelarutan: 'Larut air sangat tinggi (higroskopis kuat)',
      stabilitasPanas: 'Retensi >95% pada pelleting — sangat stabil terhadap panas',
      stabilitasPenyimpanan: '90% retensi setelah 6 bulan bila disimpan kering ketat',
      dosisReferensi: 'Ayam broiler: 1,3–1,9 g/kg pakan (setara ±0,13–0,19% ransum, dosis terbesar di antara vitamin)',
    },
    penggunaan: {
      fungsiUtama: 'Prekursor fosfolipid membran sel (fosfatidilkolin/lecithin), neurotransmitter asetilkolin, dan donor metil dalam metabolisme lemak hati — mencegah akumulasi lemak berlebih di hati (fatty liver).',
      dosisPenggunaan: 'Unggas: 1.000–2.000 mg/kg pakan (jumlah terbesar di antara semua vitamin); Babi: 400–600 mg/kg pakan',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan', 'Menyusui'],
      metodePemberian: 'Ditambahkan TERPISAH dari premix vitamin utama (biasanya dicampur langsung ke ransum basal atau ditambahkan di tahap akhir mixing) karena sifat higroskopis dan reaktifnya.',
      kompatibilitas: 'TIDAK stabil dicampur langsung dengan vitamin lain (terutama vitamin B kompleks dan vitamin terenkapsulasi) dalam waktu lama — dapat mempercepat degradasi vitamin lain dalam premix jika dicampur bersamaan tanpa pemisahan.',
      catatan: 'Selalu simpan dan campurkan kolin klorida terpisah dari premix vitamin kompleks; sifat higroskopisnya juga dapat merusak kualitas fisik pelet bila dosis berlebihan.',
    },
    harga: {
      estimasiAI: 22000,
      hargaMarketplace: 20000,
      satuan: 'per kg (produk 60% adsorbat)',
      supplier: 'Distributor premix vitamin nasional; toko pakan ternak grosir',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.',
        'McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed.',
      ],
      sumberData: 'Dosis mengacu pada NRC Poultry (1994) dan NRC Swine (2012).',
      catatan: 'Kolin secara teknis diklasifikasikan sebagai nutrien "vitamin-like" karena tubuh dapat mensintesisnya dalam jumlah terbatas dari metionin/serin — namun sintesis endogen tidak mencukupi kebutuhan produksi tinggi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧠', text: 'Kolin adalah komponen struktural fosfolipid membran sel (fosfatidilkolin) dan prekursor asetilkolin (neurotransmitter) — juga berperan sebagai donor metil dalam mengangkut lemak keluar dari hati.' },
      { type: 'kekurangan', icon: '🫀', text: 'Defisiensi menyebabkan perosis (slipped tendon) pada unggas muda dan fatty liver syndrome — akumulasi lemak berlebih di hati akibat gagalnya transport lemak keluar dari organ tersebut.' },
      { type: 'peringatan', icon: '⚠️', text: 'Sifat higroskopis dan reaktif kolin klorida membuatnya TIDAK BOLEH dicampur langsung dalam premix vitamin standar dalam jangka waktu lama — dapat mempercepat degradasi vitamin A, D3, dan K yang sensitif terhadap kelembapan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Bekerja bersama metionin, betaine, dan asam folat dalam siklus donor metil — kekurangan metionin dapat memperberat kebutuhan kolin karena keduanya saling menggantikan sebagian sebagai sumber gugus metil.' },
      { type: 'kelebihan', icon: '✅', text: 'Merupakan nutrien vitamin dengan kebutuhan kuantitas terbesar (gram per kg, bukan miligram) namun harga per kg paling murah — komponen ekonomis penting dalam formulasi pakan skala besar.' },
    ],
  },

  // ── Asam Askorbat (Vitamin C) ────────────────────────────────────────────
  'asam-askorbat': {
    namaKimia: 'L-Ascorbic Acid / L-Ascorbyl-2-Monophosphate (bentuk terproteksi lebih stabil)',
    asal: 'Sintesis kimia industri (proses Reichstein atau fermentasi mikroba modern)',
    fungsiUtama: 'Antioksidan larut air; kofaktor sintesis kolagen dan respons stres',
    bentukFisik: 'Serbuk kristal putih (bentuk standar) atau granul terenkapsulasi/terlapis (bentuk terproteksi)',
    stabilitasPenyimpanan: 'Bentuk standar labil (6–12 bulan); bentuk ascorbyl-2-monophosphate/terenkapsulasi jauh lebih stabil (18–24 bulan)',
    kelebihan: 'Efektif mengurangi dampak stres panas dan transportasi; bentuk terproteksi modern jauh lebih stabil untuk pelleting; membantu penyerapan Fe non-heme.',
    kekurangan: 'Bentuk asam askorbat standar sangat labil terhadap oksidasi, panas, dan kelembapan — kehilangan potensi cepat tanpa proteksi khusus; kebutuhan rutin rendah pada kondisi normal (ternak umumnya mensintesis sendiri).',
    komposisi: {
      bahanAktif: 'L-Ascorbic Acid 99% atau L-Ascorbyl-2-Monophosphate (bentuk terproteksi) 35%',
      kadarBahanAktif: '99% (bentuk standar) atau 35% (bentuk fosfat terproteksi, lebih stabil)',
      senyawaAktif: 'L-Ascorbic Acid (Vitamin C aktif)',
      satuanPotensi: 'mg/kg',
      ph: '2,0–3,0 (larutan air, bersifat asam)',
      kelarutan: 'Larut air sangat tinggi (>300 g/L pada 25°C)',
      stabilitasPanas: 'Bentuk standar: retensi 40–60% pada pelleting suhu 80°C; bentuk terproteksi: retensi >85%',
      stabilitasPenyimpanan: 'Bentuk standar: 60–70% retensi setelah 3 bulan; bentuk terproteksi: 85–90% setelah 6 bulan',
      dosisReferensi: 'Ayam broiler stres panas: 200–500 mg/kg pakan (suplementasi kondisional, bukan kebutuhan dasar rutin)',
    },
    penggunaan: {
      fungsiUtama: 'Antioksidan larut air dan kofaktor sintesis kolagen, karnitin, dan neurotransmitter (norepinefrin); mendukung respons imun dan mengurangi dampak fisiologis stres oksidatif.',
      dosisPenggunaan: 'Unggas kondisi stres (panas, transportasi, pasca-sakit, pasca-vaksinasi): 200–500 mg/kg pakan atau 0,5–1 g/L air minum; kondisi normal umumnya tidak memerlukan suplementasi rutin',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur'],
      programCocok: ['Penggemukan', 'Grower'],
      metodePemberian: 'Dicampur dalam pakan (bentuk terproteksi) atau dilarutkan dalam air minum (bentuk standar, untuk pemberian jangka pendek saat kondisi stres akut).',
      kompatibilitas: 'Sinergis dengan Vitamin E dalam sistem pertahanan antioksidan (Vitamin C meregenerasi Vitamin E teroksidasi); membantu meningkatkan absorpsi Fe non-heme jika diberikan bersamaan.',
      catatan: 'Suplementasi paling bermanfaat pada kondisi stres akut (cuaca panas ekstrem, transportasi jarak jauh, pasca-vaksinasi) — bukan kebutuhan nutrisi harian wajib pada kondisi normal karena sebagian besar ternak mensintesis sendiri.',
    },
    harga: {
      estimasiAI: 28000,
      hargaMarketplace: 26000,
      satuan: 'per kg (produk 99% standar)',
      supplier: 'Distributor premix vitamin nasional; toko pakan ternak grosir; apotek hewan',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'McDowell, L.R. (2000). Vitamins in Animal and Human Nutrition, 2nd Ed.',
        'Pardue, S.L. & Thaxton, J.P. (1986). Ascorbic acid in poultry: a review. World\'s Poult. Sci. J.',
      ],
      sumberData: 'Dosis suplementasi kondisional mengacu pada Pardue & Thaxton (1986); data stabilitas dari spesifikasi teknis produk komersial (standar vs terproteksi).',
      catatan: 'Sebagian besar spesies ternak dapat mensintesis Vitamin C sendiri dari glukosa — bukan vitamin esensial diet dalam pengertian ketat, kecuali pada kondisi stres tinggi yang meningkatkan kebutuhan melebihi kapasitas sintesis endogen.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🛡️', text: 'Vitamin C bekerja sebagai antioksidan larut air dan kofaktor enzim prolil/lisil hidroksilase dalam sintesis kolagen, serta terlibat dalam sintesis karnitin dan neurotransmitter katekolamin yang penting saat respons stres.' },
      { type: 'kombinasi', icon: '🔗', text: 'Bersinergi dengan Vitamin E — Vitamin C dapat meregenerasi bentuk teroksidasi Vitamin E kembali ke bentuk aktif, memperpanjang kapasitas antioksidan total tubuh selama periode stres oksidatif tinggi.' },
      { type: 'kelebihan', icon: '✅', text: 'Suplementasi terbukti efektif memperbaiki performa dan kelangsungan hidup ayam broiler pada kondisi stres panas ekstrem (>32°C) dengan menurunkan kadar kortikosteron dan memperbaiki rasio konversi pakan.' },
      { type: 'alternatif', icon: '🐄', text: 'Berbeda dari unggas/babi, sebagian besar ternak (termasuk ruminansia) mampu mensintesis Vitamin C dari glukosa di hati/ginjal dalam jumlah memadai — suplementasi rutin umumnya tidak diperlukan kecuali pada kondisi stres berat.' },
      { type: 'peringatan', icon: '⚠️', text: 'Bentuk asam askorbat standar sangat tidak stabil terhadap panas pelleting dan penyimpanan — untuk aplikasi pakan (bukan air minum), gunakan bentuk terproteksi (ascorbyl-2-monophosphate) agar potensi tidak hilang sebelum dikonsumsi.' },
    ],
  },

  // ── Ragi / Yeast ─────────────────────────────────────────────────────────
  'ragi-yeast': {
    namaKimia: 'Saccharomyces cerevisiae (sel hidup atau produk fermentasi terinaktivasi)',
    asal: 'Produksi fermentasi industri (produk samping industri bir/roti atau kultur murni terdedikasi untuk pakan ternak)',
    fungsiUtama: 'Modulasi mikrobiota rumen/usus; sumber MOS dan beta-glukan dinding sel',
    bentukFisik: 'Serbuk granular coklat muda-krem, sedikit berbau khas fermentasi',
    stabilitasPenyimpanan: 'Live yeast: 6–12 bulan (viabilitas menurun bertahap); yeast culture/fermentate (non-hidup): 18–24 bulan',
    kelebihan: 'Meningkatkan kecernaan serat pada ruminansia; memperbaiki integritas usus unggas; alami dan relatif aman digunakan jangka panjang.',
    kekurangan: 'Live yeast sensitif terhadap panas pelleting tinggi (viabilitas menurun signifikan >85°C); efek performa bervariasi tergantung strain dan kondisi ternak.',
    komposisi: {
      bahanAktif: 'Saccharomyces cerevisiae (sel hidup ≥10 miliar CFU/g atau yeast culture non-hidup)',
      kadarBahanAktif: '1×10¹⁰–2×10¹⁰ CFU/g (live yeast) atau kandungan MOS/beta-glukan 20–30% (yeast cell wall product)',
      senyawaAktif: 'Mannanoligosaccharide (MOS) dan beta-glukan pada dinding sel; enzim & metabolit fermentasi',
      satuanPotensi: 'CFU/g (live yeast) atau % (produk dinding sel)',
      ph: '5,0–6,5 (kondisi optimal pertumbuhan)',
      kelarutan: 'Tidak larut air, terdispersi sebagai suspensi',
      stabilitasPanas: 'Live yeast: viabilitas turun >50% pada suhu >85°C; yeast culture non-hidup: stabil hingga 90°C',
      stabilitasPenyimpanan: 'Live yeast: penurunan viabilitas ±10%/bulan pada suhu ruang; yeast culture: stabil >90% selama 12 bulan',
      dosisReferensi: 'Sapi perah: 10–20 g/ekor/hari (live yeast); Unggas: 0,5–1 kg/ton pakan (yeast cell wall product)',
    },
    penggunaan: {
      fungsiUtama: 'Pada ruminansia: menstabilkan pH rumen dan merangsang pertumbuhan bakteri selulolitik untuk meningkatkan kecernaan serat. Pada unggas: MOS mengikat patogen tipe-1 fimbriae dan beta-glukan memodulasi respons imun mukosa usus.',
      dosisPenggunaan: 'Sapi perah/pedaging: 5–20 g/ekor/hari (live yeast); Unggas: 0,5–2 kg/ton pakan (yeast cell wall/MOS product); Babi: 0,5–1 kg/ton pakan',
      targetTernak: ['Sapi Perah', 'Sapi Pedaging', 'Ayam Broiler', 'Ayam Petelur', 'Babi'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan', 'Menyusui'],
      metodePemberian: 'Dicampur dalam ransum konsentrat (ruminansia) atau pakan komplit (unggas/babi); untuk live yeast, hindari pelleting suhu ekstrem yang membunuh sel hidup — pertimbangkan aplikasi post-pellet coating.',
      kompatibilitas: 'Kompatibel dengan sebagian besar bahan pakan; hindari kombinasi dengan antibiotik/antijamur dosis tinggi yang dapat membunuh sel ragi hidup secara langsung.',
      catatan: 'Efektivitas paling menonjol pada kondisi rumen tidak stabil (transisi pakan, ransum tinggi konsentrat) dan pada unggas fase awal (starter) untuk mendukung perkembangan mikrobiota usus.',
    },
    harga: {
      estimasiAI: 65000,
      hargaMarketplace: 60000,
      satuan: 'per kg',
      supplier: 'Distributor feed additive nasional; produsen ragi pakan ternak lokal',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Chaucheyras-Durand, F. & Durand, H. (2010). Probiotics in animal nutrition and health. Beneficial Microbes.',
        'Spring, P. et al. (2000). The effects of dietary mannaoligosaccharides on cecal parameters and the concentrations of enteric bacteria in the ceca of Salmonella-challenged broiler chicks. Poult. Sci.',
        'FAO (2016). Probiotics in Animal Nutrition. FAO Animal Production and Health Paper 179.',
      ],
      sumberData: 'Mekanisme kerja pada rumen mengacu pada Chaucheyras-Durand & Durand (2010); efek MOS pada unggas mengacu pada Spring et al. (2000).',
      catatan: 'Perbedaan strain S. cerevisiae memberikan hasil performa yang bervariasi — selalu rujuk data klinis strain spesifik produk komersial yang digunakan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🦠', text: 'Pada rumen, S. cerevisiae mengonsumsi oksigen residual dan asam laktat, menciptakan lingkungan lebih stabil bagi bakteri selulolitik anaerob yang meningkatkan kecernaan serat. Pada unggas, dinding sel ragi (MOS) bekerja sebagai "umpan" yang mengikat bakteri patogen sebelum menempel di usus.' },
      { type: 'kelebihan', icon: '✅', text: 'Penggunaan rutin pada sapi perah terbukti meningkatkan kecernaan serat 5–10% dan menstabilkan pH rumen terutama pada ransum tinggi konsentrat yang berisiko asidosis subklinis (SARA).' },
      { type: 'kombinasi', icon: '🔗', text: 'Sering dikombinasikan dengan probiotik bakteri (Lactobacillus, Bacillus) sebagai sinbiotik — MOS/beta-glukan ragi bertindak sebagai prebiotik yang mendukung pertumbuhan bakteri probiotik yang ditambahkan bersamaan.' },
      { type: 'peringatan', icon: '⚠️', text: 'Live yeast sensitif terhadap panas pelleting tinggi (>85°C) — jika pakan diproses dengan suhu ekstrem, pertimbangkan aplikasi pasca-pelleting (coating/spray) untuk mempertahankan viabilitas sel hidup.' },
      { type: 'kombinasi', icon: '🎯', text: 'Paling efektif diberikan pada periode transisi pakan (perubahan ransum mendadak) dan pada ternak muda/starter saat mikrobiota saluran cerna belum matang sepenuhnya.' },
    ],
  },

  // ── Enzim Pakan ──────────────────────────────────────────────────────────
  'enzim-pakan': {
    namaKimia: 'Exogenous NSP-ase (kompleks karbohidrase: xilanase, beta-glukanase, arabinofuranosidase)',
    asal: 'Produksi fermentasi mikroba industri (Trichoderma reesei, Aspergillus niger, atau Bacillus subtilis rekombinan)',
    fungsiUtama: 'Mendegradasi Non-Starch Polysaccharide (NSP) untuk meningkatkan kecernaan ransum biji-bijian',
    bentukFisik: 'Granul/serbuk terlapis (coated) untuk stabilitas panas, atau cairan pekat untuk aplikasi post-pellet spray',
    stabilitasPenyimpanan: 'Produk granul terlapis: 12–18 bulan pada suhu ruang; cairan: 6–12 bulan pada suhu dingin',
    kelebihan: 'Meningkatkan kecernaan ransum berbasis gandum/rye/barley secara signifikan; produk granul modern tahan proses pelleting; mengurangi biaya energi ransum.',
    kekurangan: 'Efektivitas sangat bergantung komposisi ransum (manfaat maksimal pada ransum tinggi gandum/barley, minim pada ransum berbasis jagung-kedelai murni); enzim cair sensitif panas.',
    komposisi: {
      bahanAktif: 'Kompleks enzim NSP-ase (xilanase, beta-glukanase, arabinofuranosidase, selulase minor)',
      kadarBahanAktif: 'Aktivitas enzim bervariasi per produk: umumnya 1.000–10.000 U/g (xilanase sebagai basis pengukuran utama)',
      senyawaAktif: 'Endo-xilanase sebagai komponen utama, didukung enzim NSP pendukung lainnya',
      satuanPotensi: 'U/g (unit aktivitas enzim per gram)',
      ph: 'Optimal aktivitas pH 4,5–6,5 (kondisi usus halus unggas/babi)',
      kelarutan: 'Larut air (bentuk aktif enzim protein)',
      stabilitasPanas: 'Produk terlapis (coated): retensi aktivitas >85% pada pelleting 85–90°C; produk tidak terlapis: kehilangan aktivitas signifikan >75°C',
      stabilitasPenyimpanan: '90% retensi aktivitas setelah 12 bulan pada suhu ruang (produk granul terlapis)',
      dosisReferensi: 'Unggas: 50–100 g/ton pakan; Babi: 50–150 g/ton pakan (tergantung konsentrasi aktivitas produk)',
    },
    penggunaan: {
      fungsiUtama: 'Mendegradasi NSP (arabinoxilan, beta-glukan, pektin) dalam biji-bijian yang tidak dapat dicerna hewan monogastrik, menurunkan viskositas digesta dan meningkatkan akses enzim endogen ke nutrien terperangkap dalam sel tanaman.',
      dosisPenggunaan: 'Unggas: 50–150 g/ton pakan; Babi: 50–150 g/ton pakan (sesuai spesifikasi aktivitas produk dan komposisi ransum)',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi'],
      programCocok: ['Grower', 'Penggemukan'],
      metodePemberian: 'Dicampur dalam ransum sebelum pelleting (produk terlapis panas) atau disemprotkan pasca-pelleting (produk cair/tidak tahan panas).',
      kompatibilitas: 'Kompatibel dengan fitase dan probiotik dalam program enzim kombinasi; efektivitas menurun bila dicampur dengan disinfektan/oksidator kuat yang dapat merusak struktur protein enzim.',
      catatan: 'Manfaat terbesar pada ransum dengan proporsi gandum/rye/barley >20%; pada ransum berbasis jagung-kedelai dominan, manfaat NSP-ase lebih terbatas dan sebaiknya dievaluasi cost-benefit.',
    },
    harga: {
      estimasiAI: 450000,
      hargaMarketplace: 420000,
      satuan: 'per kg',
      supplier: 'Distributor feed enzyme nasional (DSM, AB Vista, Novozymes, Kemin Indonesia)',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Choct, M. (2006). Enzymes for the feed industry: past, present and future. World\'s Poult. Sci. J.',
        'Bedford, M.R. & Partridge, G.G. (2010). Enzymes in Farm Animal Nutrition, 2nd Ed. CABI Publishing.',
        'Cowieson, A.J. (2005). Factors that affect the nutritional value of maize for broilers. Anim. Feed Sci. Technol.',
      ],
      sumberData: 'Mekanisme dan dosis mengacu pada Choct (2006) dan Bedford & Partridge (2010).',
      catatan: 'Aktivitas enzim (U/g) dan dosis efektif sangat bervariasi antar produk komersial — selalu ikuti rekomendasi dosis spesifik dari produsen berdasarkan matriks nutrisi produk.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧪', text: 'NSP-ase memecah polisakarida non-pati (arabinoxilan, beta-glukan) yang membentuk "kurungan sel" di sekitar pati dan protein dalam biji-bijian — pemecahan ini membebaskan nutrien agar dapat diakses enzim pencernaan endogen.' },
      { type: 'kelebihan', icon: '✅', text: 'Pada ransum berbasis gandum/barley, suplementasi NSP-ase terbukti meningkatkan kecernaan energi 3–8% dan memperbaiki FCR (Feed Conversion Ratio) secara konsisten di berbagai studi lapangan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Sering diformulasikan dalam kombinasi multi-enzim bersama fitase (matrix enzim NSP-ase + fitase) untuk efek sinergis ganda: pembebasan energi/protein dari NSP dan pembebasan fosfor dari asam fitat secara bersamaan.' },
      { type: 'peringatan', icon: '⚠️', text: 'Manfaat ekonomis enzim ini sangat bergantung pada komposisi ransum — pada ransum berbasis jagung-kedelai dominan (rendah NSP tinggi-viskositas), respons performa jauh lebih kecil dibanding ransum berbasis gandum/barley.' },
      { type: 'kombinasi', icon: '🎯', text: 'Paling menguntungkan secara ekonomis ketika diformulasikan dengan pendekatan "matrix value" — mengurangi kandungan energi/protein ransum basal karena enzim membebaskan nutrien tambahan, sehingga menurunkan biaya bahan baku pakan.' },
    ],
  },

  // ── Probiotik ────────────────────────────────────────────────────────────
  'probiotik': {
    namaKimia: 'Direct Fed Microbial (DFM) — kultur bakteri hidup (Lactobacillus spp., Bacillus subtilis, Enterococcus faecium)',
    asal: 'Produksi fermentasi mikroba industri; strain terpilih diisolasi dan diperbanyak dalam kondisi terkontrol',
    fungsiUtama: 'Kompetisi eksklusi patogen dan modulasi mikrobiota saluran cerna',
    bentukFisik: 'Serbuk granular atau kapsul mikroenkapsulasi untuk melindungi viabilitas sel hidup',
    stabilitasPenyimpanan: 'Bakteri non-spora (Lactobacillus): 6–12 bulan dengan penyimpanan dingin; Bacillus (pembentuk spora): 18–24 bulan suhu ruang (jauh lebih stabil)',
    kelebihan: 'Bacillus spp. (pembentuk spora) sangat tahan panas pelleting dan penyimpanan jangka panjang; alternatif efektif pengganti antibiotic growth promoter (AGP); relatif aman.',
    kekurangan: 'Lactobacillus non-spora sangat sensitif panas dan perlu rantai dingin; efektivitas sangat bergantung strain spesifik dan dosis viabel saat dikonsumsi (bukan saat produksi).',
    komposisi: {
      bahanAktif: 'Bacillus subtilis / Lactobacillus spp. / Enterococcus faecium (kultur tunggal atau multi-strain)',
      kadarBahanAktif: '1×10⁹–1×10¹¹ CFU/g tergantung produk dan strain',
      senyawaAktif: 'Sel bakteri hidup viable + metabolit (asam laktat, bakteriosin, enzim pencernaan)',
      satuanPotensi: 'CFU/g (Colony Forming Unit per gram)',
      ph: 'Toleransi pH lambung bervariasi per strain; Bacillus spora sangat resisten terhadap pH ekstrem',
      kelarutan: 'Terdispersi dalam air/pakan, tidak larut secara kimiawi',
      stabilitasPanas: 'Bacillus (spora): retensi viabilitas >90% pada pelleting 90°C; Lactobacillus (non-spora): retensi <50% pada suhu >70°C',
      stabilitasPenyimpanan: 'Bacillus: 90%+ viabilitas setelah 18 bulan suhu ruang; Lactobacillus: 60–70% setelah 6 bulan tanpa pendinginan',
      dosisReferensi: 'Unggas: 0,5–1 kg/ton pakan (setara 10⁶–10⁷ CFU/g pakan final); Babi: 0,5–1 kg/ton pakan',
    },
    penggunaan: {
      fungsiUtama: 'Kompetisi eksklusi terhadap patogen (Salmonella, E. coli, Clostridium) melalui kompetisi nutrien dan tempat perlekatan usus; produksi asam organik yang menurunkan pH saluran cerna; modulasi respons imun mukosa.',
      dosisPenggunaan: 'Unggas: 0,5–1,5 kg/ton pakan; Babi: 0,5–1 kg/ton pakan; Ruminansia (khususnya pedet): 1–5 g/ekor/hari',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi', 'Sapi Perah', 'Sapi Pedaging'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan', 'Menyusui'],
      metodePemberian: 'Dicampur dalam pakan (untuk strain tahan panas seperti Bacillus) atau air minum (untuk strain sensitif panas); dapat pula diberikan langsung sebagai bolus/pasta pada pedet baru lahir.',
      kompatibilitas: 'TIDAK kompatibel dengan pemberian antibiotik/antijamur dosis terapeutik secara bersamaan — jeda pemberian minimal 6–12 jam diperlukan agar tidak saling membunuh.',
      catatan: 'Efektivitas tertinggi sebagai pengganti/pendamping strategi pengurangan antibiotic growth promoter (AGP); paling kritis diberikan pada fase awal kehidupan (starter/pedet baru lahir) saat mikrobiota belum matang.',
    },
    harga: {
      estimasiAI: 380000,
      hargaMarketplace: 350000,
      satuan: 'per kg',
      supplier: 'Distributor feed additive nasional (Chr. Hansen, Lallemand, Kemin Indonesia)',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'FAO (2016). Probiotics in Animal Nutrition — Production, Impact and Regulation. FAO Animal Production and Health Paper 179.',
        'Fuller, R. (1989). Probiotics in man and animals. J. Appl. Bacteriol.',
        'Kritas, S.K. & Morrison, R.B. (2005). Evaluation of probiotics as a substitute for antibiotics in a large pig nursery. Vet. Rec.',
      ],
      sumberData: 'Definisi dan mekanisme mengacu pada Fuller (1989) dan FAO (2016); data efektivitas pengganti antibiotik dari Kritas & Morrison (2005).',
      catatan: 'Pilih strain teregistrasi dan teruji klinis (bukan kultur non-standar) untuk memastikan keamanan dan efektivitas — regulasi pakan mensyaratkan strain terdaftar resmi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🦠', text: 'Probiotik bekerja melalui beberapa mekanisme simultan: kompetisi eksklusi patogen di tempat perlekatan usus, produksi asam organik/bakteriosin yang menghambat patogen, dan stimulasi respons imun mukosa (peningkatan IgA sekretori).' },
      { type: 'kelebihan', icon: '✅', text: 'Bacillus subtilis (pembentuk spora) menjadi strain favorit industri karena sangat tahan terhadap panas pelleting dan asam lambung — mempertahankan viabilitas tinggi hingga mencapai usus tempat kerjanya efektif.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi probiotik + prebiotik (sinbiotik) memberikan efek sinergis — prebiotik menyediakan substrat fermentasi yang mempercepat kolonisasi dan pertumbuhan bakteri probiotik yang ditambahkan.' },
      { type: 'peringatan', icon: '⚠️', text: 'Pemberian bersamaan dengan antibiotik dosis terapeutik dapat membunuh sel probiotik hidup sebelum sempat bekerja — programkan jeda waktu pemberian yang tepat jika terapi antibiotik diperlukan.' },
      { type: 'kombinasi', icon: '🎯', text: 'Paling efektif diberikan pada periode kritis: 3 hari pertama kehidupan anak ternak (window kolonisasi usus), pasca-stres (transportasi, sapih), atau sebagai bagian strategi pengurangan penggunaan antibiotic growth promoter.' },
    ],
  },

  // ── Prebiotik ────────────────────────────────────────────────────────────
  'prebiotik': {
    namaKimia: 'Mannanoligosaccharide (MOS) / Fructooligosaccharide (FOS) / Galactooligosaccharide (GOS)',
    asal: 'MOS diekstrak dari dinding sel Saccharomyces cerevisiae; FOS/GOS diproduksi melalui hidrolisis enzimatik inulin atau sintesis enzimatik dari laktosa',
    fungsiUtama: 'Substrat fermentasi selektif yang merangsang pertumbuhan bakteri menguntungkan usus',
    bentukFisik: 'Serbuk putih-krem, larut/terdispersi baik dalam air dan pakan',
    stabilitasPenyimpanan: 'Sangat stabil — komponen karbohidrat (bukan organisme hidup), tahan 18–24 bulan pada penyimpanan standar',
    kelebihan: 'Sangat stabil terhadap panas pelleting dan penyimpanan (bukan organisme hidup, tidak ada risiko kematian sel); bekerja sinergis dengan probiotik; aman digunakan jangka panjang.',
    kekurangan: 'Efek performa lebih moderat/tidak langsung dibanding probiotik/antibiotik; respons bervariasi tergantung status kesehatan usus awal ternak.',
    komposisi: {
      bahanAktif: 'Mannanoligosaccharide (MOS) dari dinding sel ragi atau Fructooligosaccharide (FOS)/Galactooligosaccharide (GOS)',
      kadarBahanAktif: '20–30% MOS murni (produk dinding sel ragi) atau 90–95% FOS/GOS (produk oligosakarida murni)',
      senyawaAktif: 'Oligosakarida rantai pendek non-dicerna (MOS, FOS, GOS, beta-glukan)',
      satuanPotensi: '% atau g/kg',
      ph: 'Stabil pada rentang pH luas (3,0–9,0)',
      kelarutan: 'Larut air baik hingga sangat baik (FOS/GOS)',
      stabilitasPanas: 'Retensi >95% pada pelleting suhu 90°C — sangat stabil (bukan protein/sel hidup)',
      stabilitasPenyimpanan: '95%+ retensi setelah 12 bulan penyimpanan standar',
      dosisReferensi: 'Unggas: 0,5–2 kg/ton pakan (MOS); Babi: 1–3 kg/ton pakan; Anak sapi/kambing: 2–5 g/ekor/hari',
    },
    penggunaan: {
      fungsiUtama: 'MOS mengikat bakteri patogen bertipe fimbriae-1 (Salmonella, E. coli) sehingga mencegah kolonisasi usus (mekanisme "umpan/decoy"); FOS/GOS difermentasi selektif oleh Lactobacillus dan Bifidobacterium (efek bifidogenik) menghasilkan asam lemak rantai pendek yang menyehatkan usus.',
      dosisPenggunaan: 'Unggas: 0,5–2 kg/ton pakan; Babi: 1–3 kg/ton pakan; Anak ternak (sapi/kambing/domba): 2–5 g/ekor/hari selama periode kritis pasca-lahir/sapih',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi', 'Sapi Perah', 'Sapi Pedaging', 'Kambing', 'Domba'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan', 'Menyusui'],
      metodePemberian: 'Dicampur langsung dalam ransum basal sebelum pelleting; dapat pula dilarutkan dalam air minum untuk anak ternak periode kritis.',
      kompatibilitas: 'Sangat kompatibel dengan probiotik (sinbiotik) — prebiotik menyediakan substrat yang mempercepat pertumbuhan bakteri probiotik yang diberikan bersamaan. Kompatibel dengan hampir seluruh bahan pakan.',
      catatan: 'Perbedaan mendasar dari probiotik: prebiotik adalah senyawa kimia/karbohidrat (bukan organisme hidup) sehingga tidak memerlukan pertimbangan viabilitas sel dalam penyimpanan/pengolahan.',
    },
    harga: {
      estimasiAI: 520000,
      hargaMarketplace: 490000,
      satuan: 'per kg',
      supplier: 'Distributor feed additive nasional (Alltech, Lallemand, produsen MOS/FOS lokal)',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Spring, P. et al. (2000). The effects of dietary mannaoligosaccharides on cecal parameters. Poult. Sci.',
        'Gibson, G.R. & Roberfroid, M.B. (1995). Dietary modulation of the human colonic microbiota: introducing the concept of prebiotics. J. Nutr.',
        'Baurhoo, B. et al. (2007). Effects of purified lignin and mannan oligosaccharides on intestinal integrity and microbial populations in the ceca of broiler chickens. Poult. Sci.',
      ],
      sumberData: 'Definisi konsep prebiotik dari Gibson & Roberfroid (1995); mekanisme MOS pada unggas dari Spring et al. (2000) dan Baurhoo et al. (2007).',
      catatan: 'MOS berbeda dari prebiotik "murni" secara definisi ketat (bekerja melalui pengikatan patogen, bukan hanya fermentasi selektif) — namun secara industri tetap dikategorikan dalam kelompok prebiotik/fungsional serupa.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🛡️', text: 'MOS bekerja unik dibanding prebiotik lain — alih-alih hanya menjadi makanan bakteri baik, MOS secara aktif "menjebak" bakteri patogen bertipe fimbriae-1 sehingga terbawa keluar bersama feses sebelum sempat menempel di dinding usus.' },
      { type: 'kelebihan', icon: '✅', text: 'Karena berbasis karbohidrat (bukan sel hidup), prebiotik sangat stabil terhadap seluruh tahap pengolahan pakan (pelleting, penyimpanan jangka panjang) tanpa risiko kehilangan efektivitas akibat kematian sel seperti pada probiotik.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi prebiotik + probiotik (sinbiotik) menghasilkan efek lebih besar dari penjumlahan masing-masing — prebiotik mempercepat kolonisasi dan pertumbuhan strain probiotik spesifik yang ditambahkan bersamaan dalam formulasi.' },
      { type: 'kombinasi', icon: '🎯', text: 'Paling bermanfaat pada periode transisi kritis: sapih anak ternak, ganti pakan mendadak, atau tantangan penyakit tinggi (kepadatan kandang tinggi) — saat risiko kolonisasi patogen meningkat.' },
      { type: 'alternatif', icon: '🌾', text: 'FOS/GOS secara alami juga terdapat pada beberapa bahan pakan (bawang putih, chicory, sebagian legum) meski dalam konsentrasi jauh lebih rendah dibanding produk komersial terkonsentrasi.' },
    ],
  },

  // ── Fitase (Phytase) ─────────────────────────────────────────────────────
  'fitase': {
    namaKimia: '3-Phytase (Aspergillus niger) / 6-Phytase (E. coli rekombinan)',
    asal: 'Produksi fermentasi mikroba rekombinan industri (Aspergillus niger atau E. coli sebagai host produksi)',
    fungsiUtama: 'Menghidrolisis asam fitat untuk membebaskan fosfor terikat pada biji-bijian',
    bentukFisik: 'Granul terlapis (heat-stable coating) untuk aplikasi pelleting, atau cairan pekat untuk post-pellet spray',
    stabilitasPenyimpanan: 'Produk granul terlapis: 12–18 bulan suhu ruang; produk cair: 6–12 bulan suhu dingin (2–8°C)',
    kelebihan: 'Meningkatkan ketersediaan P hingga 25–35%, menurunkan kebutuhan suplemen fosfat anorganik (DCP/MCP) secara signifikan; mengurangi ekskresi P ke lingkungan; produk modern generasi baru sangat tahan panas.',
    kekurangan: 'Efektivitas menurun pada ransum dengan kadar Ca sangat tinggi (Ca membentuk kompleks dengan fitat, menghambat kerja enzim); dosis harus presisi sesuai matriks nutrisi produk.',
    komposisi: {
      bahanAktif: '3-Phytase atau 6-Phytase (enzim fosfatase spesifik fitat)',
      kadarBahanAktif: 'Aktivitas 5.000–10.000 FTU/g (Phytase Unit per gram) — bervariasi per produk',
      senyawaAktif: 'Fitase (myo-inositol hexakisphosphate phosphohydrolase)',
      satuanPotensi: 'FTU/g (Phytase Unit per gram) atau U/kg',
      ph: 'Optimal aktivitas pH 2,5–5,5 (kondisi lambung/proventrikulus unggas dan babi)',
      kelarutan: 'Larut air (bentuk aktif enzim protein)',
      stabilitasPanas: 'Produk generasi baru (thermostable): retensi aktivitas >90% pada pelleting 90–95°C; produk generasi lama: kehilangan signifikan >70°C',
      stabilitasPenyimpanan: '85–90% retensi aktivitas setelah 12 bulan (produk granul terlapis suhu ruang)',
      dosisReferensi: 'Unggas: 50–100 g/ton pakan (500 FTU/kg pakan final); Babi: 50–100 g/ton pakan',
    },
    penggunaan: {
      fungsiUtama: 'Menghidrolisis asam fitat (myo-inositol hexaphosphate) — bentuk penyimpanan P utama pada biji-bijian yang 60–80% tidak tersedia bagi hewan monogastrik — menjadi fosfat inorganik dan myo-inositol yang dapat diserap usus.',
      dosisPenggunaan: 'Unggas: 50–150 g/ton pakan (setara 500–1500 FTU/kg pakan); Babi: 50–100 g/ton pakan',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan'],
      metodePemberian: 'Dicampur dalam ransum sebelum pelleting (produk thermostable) atau disemprotkan pasca-pelleting (produk cair/sensitif panas).',
      kompatibilitas: 'Kompatibel dengan NSP-ase dalam program multi-enzim; efektivitas menurun bila ransum mengandung Ca berlebih (rasio Ca:P efektif fitase optimal pada Ca:P <2:1) — perlu penyesuaian formulasi Ca saat menggunakan fitase dosis tinggi (superdosing).',
      catatan: 'Strategi "superdosing" (dosis 2–3× standar) semakin populer untuk memaksimalkan pembebasan energi dan asam amino tambahan (efek ekstra-fosforik), bukan hanya P — perlu penyesuaian formulasi ransum menyeluruh.',
    },
    harga: {
      estimasiAI: 950000,
      hargaMarketplace: 900000,
      satuan: 'per kg',
      supplier: 'Distributor feed enzyme nasional (DSM, AB Vista, Novozymes, BASF)',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Selle, P.H. & Ravindran, V. (2007). Microbial phytase in poultry nutrition. Anim. Feed Sci. Technol.',
        'Dersjant-Li, Y. et al. (2015). Phytase in non-ruminant animal nutrition: a critical review. J. Sci. Food Agric.',
        'Cowieson, A.J. et al. (2006). Phytic acid and phytase: implications for protein utilization by poultry. Poult. Sci.',
      ],
      sumberData: 'Mekanisme dan dosis mengacu pada Selle & Ravindran (2007) dan Dersjant-Li et al. (2015); konsep superdosing dari Cowieson et al. (2006).',
      catatan: 'Aktivitas FTU/g bervariasi antar produk dan generasi enzim — selalu gunakan matriks nutrisi (nutrient matrix value) resmi dari produsen saat formulasi ulang ransum.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧪', text: 'Fitase membuka ikatan fosfat pada asam fitat secara bertahap, membebaskan P inorganik yang dapat diserap serta "membebaskan" protein dan mineral lain (Zn, Ca) yang sebelumnya terperangkap dalam kompleks fitat-protein-mineral.' },
      { type: 'kelebihan', icon: '✅', text: 'Suplementasi fitase standar dapat menggantikan 1,5–2,5 kg DCP/MCP per ton pakan, memberikan penghematan biaya signifikan sekaligus mengurangi ekskresi P ke lingkungan hingga 30% — manfaat ekonomi dan lingkungan sekaligus.' },
      { type: 'kombinasi', icon: '🔗', text: '"Superdosing" fitase (2–3× dosis standar) menghasilkan efek ekstra-fosforik: pembebasan energi dan asam amino tambahan melalui degradasi fitat yang lebih menyeluruh, sehingga formulasi ransum dapat direduksi energi/proteinnya secara matriks.' },
      { type: 'peringatan', icon: '⚠️', text: 'Rasio Ca:P yang terlalu tinggi (>2:1) menghambat kerja optimal fitase karena Ca membentuk kompleks tidak larut dengan fitat — formulasi ransum ber-fitase perlu penyesuaian kadar Ca, bukan sekadar menambahkan fitase ke ransum standar tanpa modifikasi lain.' },
      { type: 'kombinasi', icon: '🎯', text: 'Wajib digunakan pada seluruh ransum unggas/babi modern berbasis jagung-kedelai sebagai standar industri (bukan lagi opsional) — hampir seluruh P jagung/bungkil kedelai terikat sebagai fitat yang tidak tersedia tanpa enzim ini.' },
    ],
  },

  // ── Xilanase (Xylanase) ──────────────────────────────────────────────────
  'xilanase': {
    namaKimia: 'Endo-1,4-β-Xylanase (produksi rekombinan Trichoderma reesei / Bacillus subtilis)',
    asal: 'Produksi fermentasi mikroba rekombinan industri',
    fungsiUtama: 'Menghidrolisis arabinoxilan (NSP dominan gandum/rye/barley) untuk menurunkan viskositas digesta',
    bentukFisik: 'Granul terlapis heat-stable atau cairan pekat',
    stabilitasPenyimpanan: 'Produk granul terlapis: 12–18 bulan suhu ruang; cairan: 6–12 bulan suhu dingin',
    kelebihan: 'Sangat efektif pada ransum tinggi gandum/rye (viskositas digesta turun drastis); produk generasi baru tahan pelleting; memperbaiki FCR signifikan pada ransum berbasis gandum.',
    kekurangan: 'Manfaat minimal pada ransum berbasis jagung-kedelai murni (kandungan arabinoxilan rendah); spesifik substrat — tidak menggantikan kebutuhan enzim NSP lain.',
    komposisi: {
      bahanAktif: 'Endo-1,4-β-Xylanase',
      kadarBahanAktif: 'Aktivitas 10.000–40.000 U/g tergantung produk (satuan pengukuran bervariasi: XU, EPU, atau BXU per metode uji produsen)',
      senyawaAktif: 'Xilanase (enzim spesifik pemecah ikatan β-1,4 pada rantai xilan)',
      satuanPotensi: 'U/g (unit aktivitas spesifik metode uji masing-masing produsen)',
      ph: 'Optimal aktivitas pH 4,5–6,5',
      kelarutan: 'Larut air (bentuk aktif enzim protein)',
      stabilitasPanas: 'Produk thermostable: retensi aktivitas >85% pada pelleting 85–90°C',
      stabilitasPenyimpanan: '85–90% retensi setelah 12 bulan suhu ruang (produk granul terlapis)',
      dosisReferensi: 'Unggas (ransum tinggi gandum): 50–100 g/ton pakan',
    },
    penggunaan: {
      fungsiUtama: 'Menghidrolisis arabinoxilan — NSP utama gandum, rye, barley, dan dedak — yang secara alami membentuk gel kental (viskositas tinggi) di usus halus unggas monogastrik, menghambat pergerakan enzim pencernaan dan absorpsi nutrien.',
      dosisPenggunaan: 'Unggas: 50–100 g/ton pakan (ransum dengan kandungan gandum/rye >20%); Babi: 50–100 g/ton pakan pada ransum berbasis barley/gandum',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi'],
      programCocok: ['Grower', 'Penggemukan'],
      metodePemberian: 'Dicampur dalam ransum sebelum pelleting (produk thermostable).',
      kompatibilitas: 'Sering dikombinasikan dengan fitase dan beta-glukanase dalam produk multi-enzim komersial untuk efek komplementer pada berbagai jenis NSP sekaligus.',
      catatan: 'Manfaat signifikan HANYA pada ransum dengan proporsi gandum/rye/triticale >15–20% — pada ransum jagung-kedelai dominan (umum di Indonesia), pertimbangkan enzim NSP-ase kompleks yang lebih luas spektrum substratnya.',
    },
    harga: {
      estimasiAI: 720000,
      hargaMarketplace: 680000,
      satuan: 'per kg',
      supplier: 'Distributor feed enzyme nasional (DSM, AB Vista, Novozymes)',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Choct, M. et al. (1996). Increased small intestinal fermentation is partly responsible for the anti-nutritive activity of non-starch polysaccharides in chickens. Br. Poult. Sci.',
        'Bedford, M.R. (2000). Exogenous enzymes in monogastric nutrition — their current value and future benefits. Anim. Feed Sci. Technol.',
      ],
      sumberData: 'Mekanisme viskositas digesta dari Choct et al. (1996); aplikasi industri dari Bedford (2000).',
      catatan: 'Karena Indonesia mengimpor gandum untuk sebagian ransum unggas komersial, xilanase relevan terutama pada pabrik pakan yang menggunakan proporsi gandum signifikan dalam formulasi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧪', text: 'Arabinoxilan larut membentuk struktur gel kental di usus halus yang secara fisik menghambat difusi enzim pencernaan dan penyerapan nutrien — xilanase memutus struktur ini menjadi fragmen lebih pendek yang tidak lagi membentuk gel.' },
      { type: 'kelebihan', icon: '✅', text: 'Pada ransum berbasis gandum >20%, xilanase terbukti menurunkan viskositas digesta hingga 50% dan memperbaiki FCR 3–7% — salah satu enzim dengan return on investment paling terdokumentasi dalam industri pakan unggas.' },
      { type: 'peringatan', icon: '⚠️', text: 'Efektivitas SANGAT bergantung pada komposisi ransum — pada ransum berbasis jagung-kedelai dominan (rendah arabinoxilan), manfaat xilanase minimal dan investasi enzim ini kurang cost-effective dibanding fokus pada fitase.' },
      { type: 'kombinasi', icon: '🔗', text: 'Bekerja komplementer dengan beta-glukanase (untuk barley) dan fitase dalam produk multi-enzim modern — kombinasi ini menargetkan berbagai komponen NSP dan fitat sekaligus untuk efek kecernaan menyeluruh.' },
      { type: 'kombinasi', icon: '🎯', text: 'Paling relevan bagi pabrik pakan yang mengimpor/menggunakan gandum sebagai sumber energi alternatif jagung — situasi umum saat harga jagung domestik tinggi dan gandum impor menjadi lebih kompetitif.' },
    ],
  },

  // ── Selulase (Cellulase) ─────────────────────────────────────────────────
  'selulase': {
    namaKimia: 'Endo-1,4-β-Glucanase Complex (kombinasi endoglukanase, eksoglukanase, beta-glukosidase)',
    asal: 'Produksi fermentasi mikroba industri (Trichoderma reesei atau Aspergillus spp.)',
    fungsiUtama: 'Mendegradasi selulosa dan beta-glukan menjadi gula sederhana yang dapat difermentasi',
    bentukFisik: 'Granul terlapis heat-stable atau cairan pekat',
    stabilitasPenyimpanan: 'Produk granul terlapis: 12–18 bulan suhu ruang; cairan: 6–12 bulan suhu dingin',
    kelebihan: 'Bekerja sinergis dengan enzim selulolitik rumen pada ruminansia; efektif memecah beta-glukan barley yang meningkatkan viskositas pada unggas; mendukung pemanfaatan limbah pertanian tinggi serat.',
    kekurangan: 'Efektivitas pada ruminansia dewasa (yang sudah memiliki populasi mikroba selulolitik aktif) relatif moderat dibanding pada hewan monogastrik atau ternak muda dengan rumen belum berkembang penuh.',
    komposisi: {
      bahanAktif: 'Kompleks selulase (endoglukanase, eksoglukanase/selobiohidrolase, beta-glukosidase)',
      kadarBahanAktif: 'Aktivitas 5.000–20.000 U/g tergantung produk',
      senyawaAktif: 'Selulase kompleks + beta-glukanase pendukung',
      satuanPotensi: 'U/g (unit aktivitas spesifik metode uji produsen, umumnya CMCase unit)',
      ph: 'Optimal aktivitas pH 4,5–6,0',
      kelarutan: 'Larut air (bentuk aktif enzim protein)',
      stabilitasPanas: 'Produk thermostable: retensi aktivitas >80% pada pelleting 80–85°C',
      stabilitasPenyimpanan: '80–85% retensi setelah 12 bulan suhu ruang (produk granul terlapis)',
      dosisReferensi: 'Ruminansia (ransum tinggi hijauan/limbah pertanian): 50–100 g/ton konsentrat; Unggas (ransum barley): 50–100 g/ton pakan',
    },
    penggunaan: {
      fungsiUtama: 'Mendegradasi selulosa (komponen dinding sel tanaman) dan beta-glukan menjadi gula sederhana (glukosa, selobiosa) yang dapat difermentasi mikroba rumen atau diserap langsung pada monogastrik; bekerja sinergis dengan enzim selulolitik endogen rumen.',
      dosisPenggunaan: 'Ruminansia: 50–150 g/ton konsentrat atau disemprot langsung pada hijauan/silase; Unggas (ransum berbasis barley): 50–100 g/ton pakan',
      targetTernak: ['Sapi Perah', 'Sapi Pedaging', 'Kambing', 'Domba', 'Ayam Broiler', 'Ayam Petelur'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan'],
      metodePemberian: 'Dicampur dalam konsentrat ruminansia atau disemprotkan pada hijauan/silase sebelum diberikan; pada unggas dicampur dalam ransum sebelum pelleting (produk thermostable).',
      kompatibilitas: 'Bekerja sinergis dengan enzim selulolitik rumen endogen pada ruminansia; kompatibel dengan xilanase/beta-glukanase dalam produk multi-enzim untuk unggas berbasis barley.',
      catatan: 'Manfaat terbesar pada ransum ruminansia berbasis hijauan tinggi serat/lignifikasi tinggi atau limbah pertanian (jerami, tongkol jagung) dan pada unggas dengan proporsi barley signifikan dalam formulasi.',
    },
    harga: {
      estimasiAI: 580000,
      hargaMarketplace: 550000,
      satuan: 'per kg',
      supplier: 'Distributor feed enzyme nasional (DSM, Novozymes, produsen enzim lokal)',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Beauchemin, K.A. et al. (2003). Use of exogenous fibrolytic enzymes to improve feed utilization by ruminants. J. Anim. Sci.',
        'Choct, M. (2006). Enzymes for the feed industry: past, present and future. World\'s Poult. Sci. J.',
      ],
      sumberData: 'Aplikasi ruminansia mengacu pada Beauchemin et al. (2003); aplikasi unggas dari Choct (2006).',
      catatan: 'Respons performa pada ruminansia dewasa lebih bervariasi dibanding monogastrik — evaluasi cost-benefit spesifik kondisi pakan dan status ternak diperlukan sebelum penggunaan rutin skala besar.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌾', text: 'Selulase memecah ikatan beta-1,4-glikosidik pada selulosa — polimer struktural utama dinding sel tanaman yang sangat resisten terhadap degradasi tanpa bantuan enzim mikroba khusus (selulolitik).' },
      { type: 'kombinasi', icon: '🔗', text: 'Pada ruminansia, selulase eksogen bekerja sebagai "starter" yang mempercepat kolonisasi mikroba selulolitik rumen pada partikel pakan baru, terutama bermanfaat pada ransum hijauan berkualitas rendah/tinggi lignin.' },
      { type: 'kelebihan', icon: '✅', text: 'Pada unggas, komponen beta-glukanase dalam kompleks selulase efektif menurunkan viskositas digesta akibat beta-glukan barley — mekanisme serupa xilanase tetapi menargetkan substrat berbeda.' },
      { type: 'peringatan', icon: '⚠️', text: 'Berbeda dari unggas, ruminansia dewasa sehat sudah memiliki populasi mikroba selulolitik rumen yang aktif — manfaat tambahan enzim eksogen lebih terbatas dibanding pada ternak muda atau kondisi rumen tertekan (transisi pakan, stres).' },
      { type: 'kombinasi', icon: '🎯', text: 'Paling relevan untuk pemanfaatan optimal limbah pertanian tinggi serat (jerami padi, tongkol jagung, pucuk tebu) sebagai pakan alternatif — mendukung program pakan berbasis limbah lokal yang ekonomis.' },
    ],
  },

  // ── Asam Organik ─────────────────────────────────────────────────────────
  'asam-organik': {
    namaKimia: 'Short-Chain Organic Acid (Asam Format / Asam Propionat / Asam Fumarat / Asam Sitrat — bahan tunggal berbeda-beda)',
    asal: 'Sintesis kimia industri (petrokimia) atau fermentasi mikroba (asam sitrat, asam laktat)',
    fungsiUtama: 'Pengasaman saluran cerna dan pengawetan pakan; menghambat pertumbuhan patogen',
    bentukFisik: 'Cairan pekat (asam format, propionat) atau serbuk kristal (asam fumarat, sitrat) — bergantung jenis asam spesifik',
    stabilitasPenyimpanan: 'Bentuk cair: stabil 12 bulan dalam wadah tertutup korosi-resisten; bentuk serbuk/garam terbuffer: 18–24 bulan',
    kelebihan: 'Efektif menurunkan pH saluran cerna dan menghambat patogen (Salmonella, E. coli); asam fumarat/sitrat lebih ramah dicampur langsung ke ransum unggas dibanding asam format/propionat yang korosif.',
    kekurangan: 'Bentuk cair (format, propionat) bersifat korosif dan memerlukan penanganan khusus (wadah tahan korosi, APD); bau menyengat dapat menurunkan palatabilitas bila dosis berlebihan.',
    komposisi: {
      bahanAktif: 'Asam organik spesifik (format 85%, propionat 99%, fumarat 99%, atau sitrat 99% — tergantung produk)',
      kadarBahanAktif: '85–99% tergantung jenis asam dan grade produk',
      senyawaAktif: 'Asam organik rantai pendek (Short-Chain Fatty Acid/SCFA) sesuai jenis: format, propionat, fumarat, sitrat',
      satuanPotensi: '%',
      ph: '<3,0 (bentuk asam bebas pekat)',
      kelarutan: 'Format/propionat: larut air sempurna (miscible); fumarat: larut air sedang; sitrat: larut air tinggi',
      stabilitasPanas: 'Fumarat/sitrat (bentuk kristal): retensi >95% pada pelleting; format/propionat (cair, volatil): kehilangan 10–20% pada suhu tinggi',
      stabilitasPenyimpanan: '90%+ retensi setelah 12 bulan (bentuk kristal); 85% (bentuk cair dalam wadah tertutup)',
      dosisReferensi: 'Unggas: 2–5 kg/ton pakan (asam fumarat/sitrat); Silase/biji-bijian: 5–10 L/ton (asam propionat, pengawet)',
    },
    penggunaan: {
      fungsiUtama: 'Menurunkan pH saluran cerna (lambung/tembolok) sehingga menghambat pertumbuhan bakteri patogen (Salmonella, E. coli, Campylobacter) yang sensitif asam, sekaligus meningkatkan aktivitas enzim pencernaan (pepsin) yang optimal pada pH rendah.',
      dosisPenggunaan: 'Unggas (pengasam ransum): 2–5 kg/ton pakan; Babi (starter, pasca-sapih): 3–8 kg/ton pakan; Pengawetan biji-bijian/silase (asam propionat): 5–15 L/ton',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi'],
      programCocok: ['Grower', 'Penggemukan'],
      metodePemberian: 'Dicampur langsung ke ransum (bentuk kristal fumarat/sitrat) atau disemprotkan pada biji-bijian/hijauan untuk pengawetan (bentuk cair format/propionat).',
      kompatibilitas: 'Kompatibel dengan probiotik Bacillus (tahan asam) namun dapat menghambat sebagian strain probiotik sensitif asam bila dicampur langsung dalam konsentrasi tinggi — pertimbangkan pemisahan waktu aplikasi.',
      catatan: 'Setiap jenis asam organik memiliki karakteristik dan target penggunaan spesifik — asam propionat unggul sebagai pengawet biji-bijian/silase (antijamur), sedangkan asam fumarat/sitrat lebih sesuai sebagai pengasam ransum langsung.',
    },
    harga: {
      estimasiAI: 85000,
      hargaMarketplace: 78000,
      satuan: 'per kg (rata-rata, bervariasi per jenis asam)',
      supplier: 'Distributor bahan kimia industri pakan; toko pakan ternak grosir',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Dibner, J.J. & Buttin, P. (2002). Use of organic acids as a model to study the impact of gut microflora on nutrition and metabolism. J. Appl. Poult. Res.',
        'Ricke, S.C. (2003). Perspectives on the use of organic acids and short chain fatty acids as antimicrobials. Poult. Sci.',
      ],
      sumberData: 'Mekanisme kerja dan dosis mengacu pada Dibner & Buttin (2002) dan Ricke (2003).',
      catatan: 'Setiap entri asam organik (format, propionat, fumarat, sitrat, dll.) adalah bahan baku tunggal berbeda — data komposisi/dosis di atas merupakan gambaran umum kelompok; selalu rujuk spesifikasi produk asam tertentu yang digunakan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧪', text: 'Asam organik dalam bentuk tidak terdisosiasi dapat menembus membran sel bakteri, kemudian terdisosiasi di dalam sel (pH internal netral) melepaskan proton yang mengganggu keseimbangan pH internal bakteri — mekanisme antimikroba khas asam lemah.' },
      { type: 'kelebihan', icon: '✅', text: 'Selain efek antimikroba, penurunan pH lambung meningkatkan aktivitas pepsin (optimal pada pH rendah) sehingga memperbaiki kecernaan protein — manfaat ganda pengasaman dan pencernaan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi beberapa asam organik (blend) sering lebih efektif dibanding asam tunggal karena spektrum antimikroba yang saling melengkapi — namun setiap asam tunggal (seperti dicatat di sini) tetap memiliki peran spesifiknya sendiri dalam formulasi blend.' },
      { type: 'peringatan', icon: '⚠️', text: 'Asam format dan propionat bersifat korosif terhadap peralatan logam dan kulit — wajib menggunakan wadah tahan korosi dan APD (sarung tangan, kacamata pelindung) saat penanganan bentuk cair pekat.' },
      { type: 'kombinasi', icon: '🎯', text: 'Asam propionat secara khusus unggul sebagai pengawet antijamur pada biji-bijian lembap/silase, sementara asam fumarat/sitrat lebih dipilih sebagai pengasam ransum unggas karena lebih mudah ditangani dan tidak sekorosif format/propionat.' },
    ],
  },

  // ── Buffer Pakan ─────────────────────────────────────────────────────────
  'buffer-pakan': {
    namaKimia: 'Sodium Bicarbonate (NaHCO₃) / Sodium Sesquicarbonate / Magnesium Oxide (MgO)',
    asal: 'NaHCO₃: sintesis kimia proses Solvay atau tambang alami (nahcolite); MgO: kalsinasi magnesit/dolomit',
    fungsiUtama: 'Menstabilkan pH rumen pada ransum tinggi konsentrat, mencegah asidosis',
    bentukFisik: 'Serbuk kristal putih halus, free-flowing (NaHCO₃) atau serbuk ringan (MgO)',
    stabilitasPenyimpanan: 'Stabil 18–24 bulan dalam kemasan tertutup kering; NaHCO₃ sedikit higroskopis, MgO lebih stabil',
    kelebihan: 'Efektif mencegah Subacute Ruminal Acidosis (SARA); NaHCO₃ ekonomis dan mudah didapat; kombinasi dengan MgO meningkatkan kapasitas buffering total.',
    kekurangan: 'Penggunaan berlebihan dapat menurunkan palatabilitas ransum (rasa pahit/asin); NaHCO₃ menyumbang Na berlebih bila dikombinasikan dengan sumber Na lain tanpa perhitungan total.',
    komposisi: {
      bahanAktif: 'Sodium Bicarbonate (NaHCO₃) 99,5% food/feed grade, atau Magnesium Oxide (MgO) 85–90%',
      kadarBahanAktif: 'NaHCO₃: 99,5% murni; MgO: 85–90% MgO aktif (kalsinasi kaustik)',
      senyawaAktif: 'Ion bikarbonat (HCO₃⁻) sebagai buffer utama; Mg(OH)₂ pada MgO setelah hidrasi',
      satuanPotensi: '% kemurnian; kapasitas buffering diukur sebagai kapasitas asam-basa (meq/g)',
      ph: 'NaHCO₃: 8,0–8,5 (larutan 5%); MgO: 9,5–10,5 (suspensi, bersifat basa kuat)',
      kelarutan: 'NaHCO₃: larut air baik (±9,6 g/100 mL pada 20°C); MgO: larut air rendah namun reaktif terhadap asam',
      stabilitasPanas: 'Retensi >95% pada pelleting standar — kedua bahan stabil terhadap panas proses',
      stabilitasPenyimpanan: '90–95% retensi setelah 12 bulan penyimpanan kering',
      dosisReferensi: 'Sapi perah: 0,75–1,5% BK ransum (NaHCO₃); MgO: 0,2–0,4% BK ransum sebagai pendamping',
    },
    penggunaan: {
      fungsiUtama: 'Menetralkan produksi asam lemak rantai pendek (VFA) berlebih dari fermentasi karbohidrat cepat-cerna di rumen, menjaga pH rumen pada rentang optimal (6,0–6,8) untuk mendukung populasi mikroba selulolitik dan mencegah Subacute Ruminal Acidosis (SARA).',
      dosisPenggunaan: 'Sapi perah (ransum tinggi konsentrat): 0,75–1,5% BK ransum (NaHCO₃); Sapi pedaging fase finishing: 0,5–1% BK ransum; MgO sebagai pendamping: 0,2–0,4% BK ransum',
      targetTernak: ['Sapi Perah', 'Sapi Pedaging'],
      programCocok: ['Penggemukan', 'Menyusui'],
      metodePemberian: 'Dicampur langsung dalam ransum total mixed ration (TMR) atau konsentrat; dapat pula diberikan free-choice dalam wadah terpisah agar sapi dapat mengatur konsumsi sesuai kebutuhan individual.',
      kompatibilitas: 'Kompatibel dengan seluruh komponen ransum ruminansia standar; kombinasi NaHCO₃ + MgO (rasio umum 3:1 atau 4:1) memberikan kapasitas buffering lebih luas dibanding NaHCO₃ tunggal.',
      catatan: 'PENTING: bahan ini adalah feed additive (rumen buffer) — berbeda dari NaHCO₃ sebagai sumber mineral Na yang dikategorikan terpisah di kategori Mineral. Perhatikan kontribusi total Na ransum bila keduanya digunakan bersamaan.',
    },
    harga: {
      estimasiAI: 4500,
      hargaMarketplace: 4200,
      satuan: 'per kg',
      supplier: 'Distributor bahan kimia pakan ternak; toko pakan ternak grosir',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Erdman, R.A. (1988). Dietary buffering requirements of the lactating dairy cow: a review. J. Dairy Sci.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
        'Krause, K.M. & Oetzel, G.R. (2006). Understanding and preventing subacute ruminal acidosis in dairy herds: a review. Anim. Feed Sci. Technol.',
      ],
      sumberData: 'Dosis dan mekanisme mengacu pada Erdman (1988) dan Krause & Oetzel (2006); rekomendasi umum NRC Dairy Cattle (2001).',
      catatan: 'Kebutuhan buffer meningkat sebanding dengan proporsi konsentrat/karbohidrat cepat-cerna dalam ransum — ransum tinggi hijauan berkualitas umumnya memerlukan buffer lebih sedikit.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚗️', text: 'Buffer rumen menetralkan kelebihan asam lemak rantai pendek (VFA) yang diproduksi cepat dari fermentasi karbohidrat mudah-cerna, mempertahankan pH rumen pada rentang optimal bagi mikroba selulolitik yang sensitif terhadap kondisi asam.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tanpa buffer memadai pada ransum tinggi konsentrat, pH rumen dapat turun di bawah 5,6 (Subacute Ruminal Acidosis/SARA) — kondisi ini menurunkan kecernaan serat, memicu laminitis, penurunan lemak susu, dan gangguan mikrobiota rumen jangka panjang.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi NaHCO₃ + MgO memberikan kapasitas buffering lebih luas — NaHCO₃ bekerja cepat menetralkan asam, sementara MgO memberikan efek buffering berkelanjutan dan menyediakan Mg tambahan yang sering defisien pada ransum tinggi konsentrat.' },
      { type: 'peringatan', icon: '⚠️', text: 'Bahan ini WAJIB dibedakan dari NaHCO₃ sebagai sumber mineral Na (kategori Mineral) — penggunaan sebagai buffer rumen dosis tinggi menyumbang Na signifikan yang perlu diperhitungkan dalam total keseimbangan elektrolit ransum (DCAD).' },
      { type: 'kombinasi', icon: '🎯', text: 'Paling kritis diberikan pada fase awal laktasi sapi perah (ransum tinggi konsentrat untuk mendukung produksi susu puncak) dan sapi pedaging fase finishing dengan ransum grain-based tinggi.' },
    ],
  },

  // ── Antioksidan ──────────────────────────────────────────────────────────
  'antioksidan': {
    namaKimia: 'Ethoxyquin / BHT (Butylated Hydroxytoluene) / BHA (Butylated Hydroxyanisole) / Ekstrak Rosemari — bahan tunggal berbeda-beda',
    asal: 'Sintesis kimia petrokimia (ethoxyquin, BHT, BHA) atau ekstraksi alami (rosemary extract dari Rosmarinus officinalis)',
    fungsiUtama: 'Menghambat oksidasi lemak (lipid peroxidation) pada bahan pakan dan ransum',
    bentukFisik: 'Cairan pekat (ethoxyquin) atau serbuk/granul (BHT, BHA, ekstrak rosemari)',
    stabilitasPenyimpanan: 'Stabil 12–24 bulan dalam kemasan tertutup gelap-kering (produk itu sendiri stabil, tugasnya melindungi bahan lain dari oksidasi)',
    kelebihan: 'Ethoxyquin sangat efektif untuk tepung ikan/bahan tinggi lemak tak jenuh; ekstrak rosemari alami cocok untuk klaim "natural/non-sintetis"; melindungi vitamin larut lemak dari degradasi oksidatif.',
    kekurangan: 'Ethoxyquin menghadapi pembatasan regulasi di beberapa negara/pasar karena kekhawatiran residu; antioksidan alami (rosemari) umumnya kurang poten dan lebih mahal dibanding sintetis.',
    komposisi: {
      bahanAktif: 'Ethoxyquin 66% (cair) / BHT 99% / BHA 99% / Ekstrak Rosemari (kandungan asam karnosat & rosmarinat terstandardisasi)',
      kadarBahanAktif: '66% (ethoxyquin cair) atau 99% (BHT/BHA serbuk) atau standardisasi 5–20% asam karnosat (rosemari)',
      senyawaAktif: 'Ethoxyquin (6-ethoxy-1,2-dihydro-2,2,4-trimethylquinoline), BHT, BHA, atau asam karnosat/rosmarinat',
      satuanPotensi: 'ppm atau mg/kg (dosis dalam bahan pakan/ransum)',
      ph: null,
      kelarutan: 'Larut lemak (seluruh jenis antioksidan ini bekerja pada fase lipid)',
      stabilitasPanas: 'Retensi >90% pada pelleting standar — antioksidan itu sendiri relatif stabil terhadap panas proses',
      stabilitasPenyimpanan: '90%+ retensi setelah 12 bulan penyimpanan gelap-kering',
      dosisReferensi: 'Tepung ikan/bahan tinggi lemak: 100–200 ppm (ethoxyquin); Ransum komplit: 100–150 ppm (BHT/BHA/rosemari)',
    },
    penggunaan: {
      fungsiUtama: 'Menghambat reaksi berantai peroksidasi lipid dengan cara menangkap radikal bebas (free radical scavenging) sebelum merusak asam lemak tak jenuh ganda, mencegah ketengikan (rancidity), kerusakan vitamin larut lemak, dan penurunan palatabilitas.',
      dosisPenggunaan: 'Bahan pakan tinggi lemak (tepung ikan, minyak nabati, bungkil kelapa): 100–200 ppm; Ransum komplit unggas/babi: 100–150 ppm; Premix vitamin: sesuai rekomendasi produsen premix',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi', 'Sapi Perah', 'Sapi Pedaging'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan'],
      metodePemberian: 'Ditambahkan langsung ke bahan pakan tinggi lemak segera setelah produksi/penggilingan (paling efektif sebelum oksidasi dimulai), atau dicampur dalam premix vitamin untuk perlindungan tambahan.',
      kompatibilitas: 'Bekerja sinergis dengan Vitamin E (keduanya antioksidan, namun bekerja pada tahap berbeda: sintetis untuk bahan pakan/premix, Vitamin E untuk jaringan tubuh ternak). Kompatibel dengan hampir seluruh bahan pakan.',
      catatan: 'Efektivitas tertinggi bila ditambahkan SEDINI mungkin setelah produksi bahan pakan tinggi lemak — antioksidan mencegah oksidasi, bukan membalikkan kerusakan yang sudah terjadi (tidak dapat "memperbaiki" bahan yang sudah tengik).',
    },
    harga: {
      estimasiAI: 125000,
      hargaMarketplace: 115000,
      satuan: 'per kg (rata-rata, bervariasi per jenis antioksidan)',
      supplier: 'Distributor feed additive nasional; produsen bahan kimia pakan',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Frankel, E.N. (2005). Lipid Oxidation, 2nd Ed. The Oily Press, Bridgwater.',
        'Botsoglou, N.A. & Fletouris, D.J. (2001). Drug Residues in Foods: Pharmacology, Food Safety, and Analysis. Marcel Dekker.',
        'FEFANA (2014). Feed Additives: Nutritional and Technological Feed Additives.',
      ],
      sumberData: 'Mekanisme oksidasi lipid dari Frankel (2005); aplikasi industri dari FEFANA (2014).',
      catatan: 'Setiap jenis antioksidan (ethoxyquin, BHT, BHA, rosemari) adalah bahan tunggal berbeda dengan profil regulasi dan aplikasi spesifik — selalu cek regulasi pakan lokal/tujuan ekspor sebelum memilih jenis antioksidan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🛡️', text: 'Antioksidan feed grade bekerja sebagai "free radical scavenger" — menangkap radikal bebas yang memulai reaksi berantai peroksidasi lipid sebelum merusak struktur asam lemak tak jenuh ganda dalam bahan pakan.' },
      { type: 'kekurangan', icon: '⚠️', text: 'Tanpa antioksidan, bahan pakan tinggi lemak tak jenuh (tepung ikan, minyak nabati) mengalami ketengikan oksidatif yang menurunkan palatabilitas, merusak vitamin larut lemak (A, D, E, K), dan dapat menghasilkan senyawa toksik (malondialdehyde) yang membahayakan kesehatan ternak.' },
      { type: 'kombinasi', icon: '🔗', text: 'Antioksidan sintetis pakan (ethoxyquin, BHT) melindungi bahan SEBELUM dikonsumsi, sementara Vitamin E melindungi membran sel SETELAH dikonsumsi — keduanya bekerja pada tahap berbeda namun saling melengkapi dalam rantai pertahanan oksidatif total.' },
      { type: 'peringatan', icon: '⚠️', text: 'Ethoxyquin menghadapi pembatasan regulasi ketat di beberapa pasar (termasuk pembatasan Uni Eropa) karena kekhawatiran residu — untuk produk ekspor, verifikasi regulasi negara tujuan sebelum memilih jenis antioksidan.' },
      { type: 'alternatif', icon: '🌿', text: 'Ekstrak rosemari menjadi alternatif populer untuk klaim "natural feed" — meski umumnya kurang poten per unit dibanding antioksidan sintetis, cocok untuk segmen pasar yang menghindari bahan sintetis.' },
    ],
  },

  // ── Toksin Binder (Mycotoxin Binder) ────────────────────────────────────
  'toksin-binder': {
    namaKimia: 'Hydrated Sodium Calcium Aluminosilicate (HSCAS)',
    asal: 'Tambang mineral aluminosilikat alami (bentonit/montmorillonit termodifikasi) yang dimurnikan dan diaktivasi',
    fungsiUtama: 'Mengikat mikotoksin (terutama aflatoksin) di saluran cerna untuk mencegah absorpsi',
    bentukFisik: 'Serbuk halus abu-abu terang hingga putih kekuningan, free-flowing',
    stabilitasPenyimpanan: 'Sangat stabil — mineral inert, tahan >24 bulan pada penyimpanan standar tanpa degradasi',
    kelebihan: 'Kapasitas ikatan aflatoksin sangat tinggi dan terdokumentasi ilmiah kuat (disetujui FDA); stabil tanpa batas waktu praktis; tidak mengganggu penyerapan nutrien mayor pada dosis rekomendasi.',
    kekurangan: 'Efektivitas terbatas untuk mikotoksin non-polar (zearalenon, ochratoxin, fumonisin, DON) dibanding aflatoksin; dosis berlebihan dapat sedikit mengganggu penyerapan vitamin larut lemak.',
    komposisi: {
      bahanAktif: 'Hydrated Sodium Calcium Aluminosilicate (HSCAS) ≥90%',
      kadarBahanAktif: '≥90% HSCAS aktif (grade komersial teraktivasi)',
      senyawaAktif: 'Aluminosilikat berlapis (layered aluminosilicate) dengan luas permukaan dan muatan ionik tinggi',
      satuanPotensi: '% kemurnian; kapasitas adsorpsi diukur sebagai % pengikatan aflatoksin in vitro',
      ph: '7,0–9,0 (suspensi air, sedikit basa)',
      kelarutan: 'Tidak larut air, bekerja sebagai adsorben padat dalam suspensi',
      stabilitasPanas: 'Retensi kapasitas adsorpsi 100% pada pelleting — mineral inert tidak terpengaruh panas',
      stabilitasPenyimpanan: '100% retensi kapasitas tanpa batas waktu praktis (bahan mineral inert)',
      dosisReferensi: 'Unggas/babi (kontaminasi ringan-sedang): 0,25–0,5% ransum; Kontaminasi berat: hingga 1% ransum',
    },
    penggunaan: {
      fungsiUtama: 'Mengikat mikotoksin (terutama aflatoksin B1) secara kuat melalui adsorpsi pada permukaan berlapis aluminosilikat di saluran cerna, membentuk kompleks toksin-binder yang tidak diserap dan dikeluarkan bersama feses, mencegah toksin masuk ke aliran darah.',
      dosisPenggunaan: 'Kontaminasi ringan (<50 ppb aflatoksin): 0,25% ransum; Kontaminasi sedang-berat: 0,5–1% ransum',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi', 'Sapi Perah', 'Sapi Pedaging'],
      programCocok: ['Grower', 'Penggemukan', 'Indukan', 'Menyusui'],
      metodePemberian: 'Dicampur langsung dan homogen ke dalam ransum basal, terutama saat bahan baku (jagung, kedelai) berisiko tinggi terkontaminasi mikotoksin (musim hujan, penyimpanan lembap).',
      kompatibilitas: 'Dosis tinggi berkepanjangan (>1%) dapat sedikit mengikat vitamin larut lemak dan beberapa trace mineral — pertimbangkan suplementasi vitamin/mineral tambahan bila penggunaan toksin binder dosis tinggi dan jangka panjang.',
      catatan: 'HSCAS sangat efektif untuk aflatoksin tetapi kurang efektif untuk mikotoksin non-polar lain (zearalenon, DON, fumonisin, ochratoxin) — untuk kontaminasi multi-mikotoksin, pertimbangkan kombinasi dengan binder organik (dinding sel ragi) atau enzim pendegradasi mikotoksin.',
    },
    harga: {
      estimasiAI: 280000,
      hargaMarketplace: 260000,
      satuan: 'per kg',
      supplier: 'Distributor feed additive nasional; tambang mineral aluminosilikat lokal (Jawa, Sulawesi)',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Phillips, T.D. et al. (1988). Hydrated sodium calcium aluminosilicate: a high affinity sorbent for aflatoxin. Poult. Sci.',
        'Huwig, A. et al. (2001). Mycotoxin detoxication of animal feed by different adsorbents. Toxicol. Lett.',
        'FAO (2004). Worldwide Regulations for Mycotoxins in Food and Feed. FAO Food and Nutrition Paper 81.',
      ],
      sumberData: 'Kapasitas ikatan HSCAS mengacu pada studi seminal Phillips et al. (1988); perbandingan efektivitas antar binder dari Huwig et al. (2001).',
      catatan: 'HSCAS adalah toksin binder paling terdokumentasi ilmiah dan disetujui FDA (GRAS status) untuk aflatoksin spesifik — berbeda dari bentonit/zeolit umum di kategori Mineral yang tidak selalu teraktivasi untuk fungsi pengikatan mikotoksin optimal.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧲', text: 'HSCAS memiliki struktur berlapis dengan muatan negatif tinggi pada permukaannya yang secara elektrostatik dan geometris "menjepit" molekul aflatoksin (yang memiliki struktur planar cocok dengan jarak antar-lapis mineral) sehingga terikat kuat dan tidak terlepas kembali di saluran cerna.' },
      { type: 'kelebihan', icon: '✅', text: 'Kapasitas ikatan HSCAS terhadap aflatoksin B1 mencapai ±90% pada dosis 0,5% ransum — salah satu binder paling efektif dan terdokumentasi ilmiah kuat dibanding jenis clay/mineral binder lainnya.' },
      { type: 'peringatan', icon: '⚠️', text: 'Efektivitas HSCAS jauh lebih rendah untuk mikotoksin non-polar seperti zearalenon, ochratoxin, fumonisin, dan deoxynivalenol (DON) — jangan mengandalkan HSCAS tunggal bila hasil uji lab menunjukkan kontaminasi multi-mikotoksin.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk kontaminasi multi-mikotoksin, kombinasikan HSCAS dengan binder organik (dinding sel ragi/glucomannan) yang lebih efektif mengikat mikotoksin non-polar, atau enzim pendegradasi mikotoksin spesifik (misalnya untuk fumonisin).' },
      { type: 'kombinasi', icon: '🎯', text: 'Penggunaan preventif rutin (dosis rendah 0,1–0,25%) pada musim hujan atau saat kualitas penyimpanan jagung/bahan baku tidak optimal lebih ekonomis dibanding penanganan reaktif setelah gejala keracunan mikotoksin muncul pada ternak.' },
    ],
  },

};

// ─── Accessor ─────────────────────────────────────────────────────────────────

export function getVitaminFeedAdditiveDetail(id: string): VitaminDetailFields | undefined {
  return VITAMIN_FEED_ADDITIVE_DETAIL[id];
}
