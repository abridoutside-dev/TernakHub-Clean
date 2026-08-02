// ─── MP-035 — Detail Data: Bahan Cair ────────────────────────────────────────
// Full nutrition, physical characteristics, usage, price, reference, and AI
// insight for every item in the "Bahan Cair" sub-category.
// Merged with BahanCairItem via getBahanCairDetail().
//
// Sumber data komposisi & karakteristik:
//   • NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.
//   • NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.
//   • NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.
//   • NRC (2016). Nutrient Requirements of Beef Cattle, 8th Rev. Ed.
//   • McDonald, P., et al. (2011). Animal Nutrition, 7th Ed. Pearson Education.
//   • Feedipedia (2024). INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.
//   • Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi Pakan
//     untuk Indonesia. Gadjah Mada University Press.
//   • Orskov, E.R. & Ryle, M. (1990). Energy Nutrition in Ruminants. Elsevier.
//   • Bergner, H. & Chudy, A. (2005). Nutritive Value of Feed. Institut für Tierernährung.
//   • Johnson, L.A. (1987). Corn: Production, Processing and Utilization. AACC.
//   • Sargent, J.R. (1997). Fish oils and human diet. British J. Nutrition 78:S5-S13.
//
// Nilai nutrisi dinyatakan atas dasar bahan kering (DM basis) kecuali dinyatakan lain.
// Untuk minyak/lemak: ME dalam kcal/kg BK; TDN tidak relevan (ditulis null).
// Harga estimasi dalam IDR, satuan per liter kecuali dinyatakan lain.

import { getBahanCairById } from './bahanCairData';
import type { HargaData, ReferensiData, AiInsightItem, ProgramCocok } from './jagungData';

export { getBahanCairById };

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface BahanCairNutrisi {
  bk: number | null;              // % Bahan Kering (as-fed)
  kadarAir: number | null;        // % Kadar Air (as-fed)
  pk: number | null;              // % Protein Kasar (BK)
  sk: number | null;              // % Serat Kasar (BK)
  lk: number | null;              // % Lemak Kasar (BK)
  abu: number | null;             // % Abu (BK)
  betn: number | null;            // % BETN (BK)
  tdn: number | null;             // % TDN (BK) — null untuk minyak murni
  me: number | null;              // kcal/kg ME (BK)
  kadarGula: string | null;       // teks deskriptif, mis. "48–52% as-fed"
  asamLemakUtama: string | null;  // profil asam lemak utama
  ca: number | null;              // % Ca (BK)
  p: number | null;               // % P (BK)
  mg: number | null;              // % Mg (BK)
  na: number | null;              // % Na (BK)
  k: number | null;               // % K (BK)
  cl: number | null;              // % Cl (BK)
  s: number | null;               // % S (BK)
  vitamin: string | null;
  catatanNutrisi: string | null;
}

export interface BahanCairFisik {
  ph: string | null;
  beratJenis: string | null;       // kg/L atau g/mL
  viskositas: string | null;
  kelarutan: string;
  stabilitasPenyimpanan: string;
  umurSimpan: string;
  kondisiPenyimpanan: string;
}

export interface BahanCairDetailPenggunaan {
  fungsiUtama: string;
  maksPenggunaan: string;          // teks, mis. "5–10% ransum" atau "drench 300 mL/hari"
  targetTernak: string[];
  programCocok: ProgramCocok[];
  metodePemberian: string;
  pencampuran: string | null;
  catatan: string | null;
}

export interface BahanCairDetailFields {
  asal: string;
  sumber: string;
  bentukFisik: string;
  warna: string;
  aroma: string;
  kelebihan: string;
  kekurangan: string;
  nutrisi: BahanCairNutrisi;
  fisik: BahanCairFisik;
  penggunaan: BahanCairDetailPenggunaan;
  harga: HargaData;
  referensi: ReferensiData;
  aiInsight: AiInsightItem[];
}

// ─── Detail Records ───────────────────────────────────────────────────────────

const BAHAN_CAIR_DETAIL: Record<string, BahanCairDetailFields> = {

  // ── 1. Molases Tebu ─────────────────────────────────────────────────────────
  'molases-tebu': {
    asal: 'Pabrik gula tebu: Jawa Timur (PTPN X, XI), Jawa Tengah (PTPN IX), Jawa Barat (PTPN VIII), Lampung, dan daerah penghasil tebu lainnya di Indonesia',
    sumber: 'Hasil samping (by-product) akhir dari proses kristalisasi gula tebu. Setelah nira tebu mengalami beberapa siklus evaporasi dan sentrifugasi, sirup yang tidak lagi dapat dikristalisasi disebut molases. Kadar gula 48–55% as-fed tetapi tidak dapat dipisahkan lebih lanjut secara ekonomis.',
    bentukFisik: 'Cairan kental berwarna coklat gelap hingga hitam, sangat viskos, lengket. Bulk density ±1,40–1,46 kg/L. Mengalir lambat pada suhu ruang.',
    warna: 'Coklat tua hingga hitam pekat',
    aroma: 'Manis khas, aroma karamel-melasse, sangat palatable',
    kelebihan: 'Palatabilitas sangat tinggi — meningkatkan konsumsi ransum secara keseluruhan; sumber energi cepat serap (gula sederhana); tersedia luas dan harga terjangkau di Indonesia; berfungsi sebagai binder pelet yang efektif; mengandung biotin (vitamin B7) alami; meningkatkan kecernaan bahan kering ransum.',
    kekurangan: 'Kandungan protein sangat rendah dan tidak mengandung asam amino esensial; kadar kalium tinggi bersifat laksatif jika berlebih (>15% ransum); mudah fermentasi jika terkontaminasi air; kualitas bervariasi antar pabrik gula; tidak mengandung lemak untuk energi jangka panjang.',
    nutrisi: {
      bk: 75.0, kadarAir: 25.0,
      pk: 4.5, sk: 0.1, lk: 0.1, abu: 8.5, betn: 86.8,
      tdn: 73.0, me: 2590,
      kadarGula: '64–72% BK (48–55% as-fed); terutama sukrosa, glukosa, dan fruktosa',
      asamLemakUtama: null,
      ca: 0.98, p: 0.13, mg: 0.47, na: 0.20, k: 5.00, cl: 1.60, s: 0.60,
      vitamin: 'Biotin (B7): 100–200 μg/kg as-fed; Niasin: 25–40 mg/kg as-fed; Riboflavin: 4–6 mg/kg as-fed; Pantotenat: 30–60 mg/kg as-fed',
      catatanNutrisi: 'Komposisi bervariasi antar pabrik gula dan musim panen. BK 73–78%; kadar kalium sangat tinggi (K 3–6% BK) — perhatikan efek laksatif. Nilai nutrisi dinyatakan dalam BK kecuali kadar gula (as-fed). Sumber: Feedipedia (2024), Hartadi et al. (1997).',
    },
    fisik: {
      ph: '5.0–5.5',
      beratJenis: '1.40–1.46 kg/L (20°C)',
      viskositas: '2.000–8.000 cP (25°C); meningkat tajam di suhu rendah',
      kelarutan: 'Larut sempurna dalam air pada semua rasio; larutan molases : air = 1:1 digunakan untuk drench atau suplemen minum',
      stabilitasPenyimpanan: 'Stabil 6–12 bulan dalam tangki tertutup pada suhu ruang. Dapat mengalami fermentasi spontan jika terkontaminasi air (kadar air >30%) atau terkena panas berlebih (>40°C). Pertumbuhan kapang/ragi mungkin terjadi pada permukaan terbuka.',
      umurSimpan: '6–12 bulan (tangki tertutup, suhu ruang)',
      kondisiPenyimpanan: 'Tangki/drum tertutup, terlindung dari hujan dan kontaminasi air. Suhu ruang (20–35°C). Jangan simpan bersama bahan yang mudah terbakar. Pompa tangki sebelum pengambilan untuk homogenisasi.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber energi cepat serap (gula sederhana), penambah palatabilitas ransum, perekat/binder pelet, dan sumber biotin alami. Meningkatkan kecernaan bahan kering dan konsumsi pakan keseluruhan.',
      maksPenggunaan: '5–10% ransum (sapi); 3–5% (unggas); 10–15% (pakan sapi dolomit/blok garam mineral)',
      targetTernak: ['Sapi Pedaging', 'Sapi Perah', 'Kambing', 'Domba', 'Kerbau', 'Ayam Broiler', 'Ayam Petelur'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      metodePemberian: 'Dicampur langsung ke dalam ransum mash atau TMR. Dapat diencerkan (1:1 dengan air) untuk drench atau disemprotkan ke hijauan. Untuk pelet: dilarutkan hangat lalu dicampurkan ke mesin pelleting.',
      pencampuran: 'Campurkan pada tahap mixing akhir. Panaskan ringan (30–40°C) untuk menurunkan viskositas jika suhu dingin. Jangan campurkan langsung dengan bahan ureaseaktif (urea) tanpa pencampuran bertahap.',
      catatan: 'Efek laksatif muncul jika >12% ransum (akibat K tinggi) — mulai dari diare ringan, kurangi bertahap. Pada ternak bunting akhir: batasi <5% untuk menghindari gangguan elektrolit. Molases + urea (kombinasi NPN) harus dicampur hati-hati dan diberikan secara bertahap untuk menghindari keracunan amonia.',
    },
    harga: {
      estimasiAI: 3200, hargaMarketplace: 3000,
      satuan: 'per liter (as-fed)',
      supplier: 'Pabrik gula (PTPN X Surabaya, PTPN IX Semarang); Koperasi peternak lokal; Distributor pakan ternak (tersedia di sebagian besar daerah)',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024). Sugarcane molasses. INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed. National Academy Press, Washington DC.',
        'Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi Pakan untuk Indonesia. Gadjah Mada University Press, Yogyakarta.',
        'McDonald, P., et al. (2011). Animal Nutrition, 7th Ed. Pearson Education, Harlow.',
        'Preston, T.R. & Leng, R.A. (1987). Matching Ruminant Production Systems with Available Resources. Penambul Books, Armidale.',
      ],
      sumberData: 'Nilai BK, protein, energi mengacu pada Feedipedia (2024) dan Hartadi et al. (1997). Mineral mengacu pada analisis molases Indonesia (PTPN). Biotin mengacu pada McDonald (2011).',
      catatan: 'Kualitas molases sangat bervariasi antar pabrik gula — selalu minta COA (Certificate of Analysis) untuk kadar BK, gula, dan K. Molases hasil panen akhir musim (last draw) biasanya lebih rendah kadar gula dari first draw.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'Molases tebu adalah sumber energi paling terjangkau dan tersedia luas di Indonesia. Gula sederhana (sukrosa, glukosa, fruktosa) langsung difermentasi mikroba rumen menjadi VFA (propionat, asetat, butirat) sebagai sumber energi utama sapi. Fermentasi cepat di rumen berarti energi tersedia dalam 1–2 jam setelah konsumsi.' },
      { type: 'kelebihan', icon: '✅', text: 'Penggunaan molases 5–8% ransum terbukti meningkatkan palatabilitas dan konsumsi bahan kering (DMI) sapi 8–15%, terutama untuk ransum berbahan jerami berkualitas rendah. Sebagai binder pelet, molases menggantikan 50–75% bentonit dengan hasil durability pelet yang setara namun menambahkan nilai nutrisi.' },
      { type: 'peringatan', icon: '⚠️', text: 'Kalium (K) molases sangat tinggi (5% BK) — penggunaan >12% ransum menyebabkan diare osmotik akibat beban K di intestin. Pada sapi perah prapersalinan (3 minggu terakhir), molases harus dibatasi <5% karena K tinggi meningkatkan risiko hipokalsemia (milk fever) dengan menghambat absorpsi Ca.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi terbaik: Molases (5%) + Urea (1%) + Jerami/hijauan kering — sistem Urea-Molasses Block (UMB) atau UMMB terbukti meningkatkan kecernaan jerami 20–30% dan pertambahan bobot hidup sapi 150–250 g/hari. Selalu campurkan molases terlebih dahulu baru urea untuk homogenisasi aman.' },
      { type: 'alternatif', icon: '🔄', text: 'Alternatif jika molases langka: Nira tebu segar (lebih murah, gula lebih tinggi tapi cepat terfermentasi), Gliserol dari biodiesel (sumber energi glucogenic). Untuk fungsi binder pelet: dapat digantikan Bentonit atau Lignosulfonat meskipun tanpa nilai nutrisi tambahan.' },
    ],
  },

  // ── 2. Molases Bit ──────────────────────────────────────────────────────────
  'molases-bit': {
    asal: 'Eropa Barat (Jerman, Prancis, Belanda, Polandia) dan Amerika Serikat sebagai daerah produksi utama. Di Indonesia tersedia sebagai produk impor.',
    sumber: 'Hasil samping kristalisasi gula dari umbi bit gula (Beta vulgaris). Proses mirip molases tebu namun menghasilkan molases dengan protein lebih tinggi, kadar biotin jauh lebih tinggi, dan komposisi mineral berbeda (Na lebih tinggi, K sedikit lebih rendah).',
    bentukFisik: 'Cairan kental coklat tua hingga hitam, viskositas lebih rendah dari molases tebu. Berat jenis sedikit lebih rendah.',
    warna: 'Coklat tua hingga hitam',
    aroma: 'Manis khas bit, sedikit earthy/bersahaja, berbeda dari molases tebu',
    kelebihan: 'Kadar biotin sangat tinggi (1.000–2.500 μg/kg as-fed) — jauh melampaui molases tebu; kadar protein lebih tinggi (PK ~10% BK); palatabilitas baik; kadar betain alami tinggi (manfaat osmoprotektan pada unggas); stabil disimpan.',
    kekurangan: 'Harga lebih mahal dari molases tebu (produk impor di Indonesia); ketersediaan tidak selalu tersedia; Na lebih tinggi — perhatikan keseimbangan elektrolit; tidak seefektif molases tebu sebagai binder pelet karena viskositas lebih rendah.',
    nutrisi: {
      bk: 78.0, kadarAir: 22.0,
      pk: 10.3, sk: 0.1, lk: 0.1, abu: 12.2, betn: 77.3,
      tdn: 72.0, me: 2550,
      kadarGula: '60–65% BK (47–50% as-fed); terutama sukrosa; glukosa/fruktosa lebih rendah dari molases tebu',
      asamLemakUtama: null,
      ca: 0.26, p: 0.04, mg: 0.19, na: 1.03, k: 5.38, cl: 0.77, s: 0.58,
      vitamin: 'Biotin (B7): 1.000–2.500 μg/kg as-fed (sangat tinggi); Betaine: 40–60 g/kg BK; Niasin, Riboflavin, Pantotenat tersedia',
      catatanNutrisi: 'Kadar biotin molases bit 8–20× lebih tinggi dari molases tebu — efektif untuk pencegahan dermatitis biotin pada babi dan perbaikan kualitas kuku sapi. Betain alami berfungsi sebagai osmoprotektan dan donor gugus metil (methyl donor). Na lebih tinggi dari molases tebu. Sumber: Feedipedia (2024), McDonald (2011).',
    },
    fisik: {
      ph: '5.5–6.0',
      beratJenis: '1.40–1.45 kg/L (20°C)',
      viskositas: '1.500–4.000 cP (25°C); lebih encer dari molases tebu',
      kelarutan: 'Larut sempurna dalam air; lebih mudah dicampur dari molases tebu karena viskositas lebih rendah',
      stabilitasPenyimpanan: 'Stabil 6–12 bulan dalam tangki tertutup. Risiko fermentasi lebih rendah dari molases tebu karena pH lebih tinggi.',
      umurSimpan: '6–12 bulan (tangki tertutup, suhu ruang)',
      kondisiPenyimpanan: 'Tangki/drum tertutup, suhu ruang. Terlindung dari kontaminasi air dan sumber panas berlebih.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber energi dan biotin alami, palatabilitas ransum, binder pelet. Sangat efektif untuk pencegahan defisiensi biotin pada babi dan perbaikan kualitas kuku sapi.',
      maksPenggunaan: '5–10% ransum (sapi); 3–8% (babi, unggas)',
      targetTernak: ['Sapi Perah', 'Sapi Pedaging', 'Babi', 'Kambing', 'Domba', 'Ayam Broiler'],
      programCocok: ['Penggemukan', 'Indukan', 'Menyusui', 'Grower'],
      metodePemberian: 'Dicampur dalam ransum atau TMR. Untuk babi: campurkan dalam pakan basah atau semi-kering sebagai sumber biotin. Untuk sapi perah: TMR atau ransum campuran.',
      pencampuran: 'Lebih mudah dicampur dari molases tebu karena viskositas lebih rendah. Dapat dicampur langsung tanpa pemanasan pada suhu ruang >20°C.',
      catatan: 'Kadar Na lebih tinggi dari molases tebu — pertimbangkan asupan Na total. Penggunaan untuk sapi prapersalinan: sama seperti molases tebu, batasi <5% ransum. Biasanya diimpor — periksa COA dari importir untuk memastikan keaslian dan kemurnian.',
    },
    harga: {
      estimasiAI: 4500, hargaMarketplace: 4200,
      satuan: 'per liter (as-fed)',
      supplier: 'Importir bahan pakan (Jakarta, Surabaya); Distributor premium pakan; Agen bahan kimia pakan',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024). Sugar beet molasses. INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.',
        'NRC (1998). Nutrient Requirements of Swine, 10th Rev. Ed. National Academy Press.',
        'McDonald, P., et al. (2011). Animal Nutrition, 7th Ed. Pearson Education.',
        'Zinn, R.A. & Plascencia, A. (1993). Effects of forage level on the comparative feeding value of supplemental fat in growing-finishing diets for feedlot cattle. J. Anim. Sci. 71:1330–1336.',
      ],
      sumberData: 'Komposisi mengacu pada Feedipedia (2024) untuk sugar beet molasses. Nilai biotin dan betain mengacu pada McDonald (2011). Na dan K mengacu pada rata-rata analisis Eropa (INRA, 2004).',
      catatan: 'Karena merupakan produk impor, verifikasi COA sangat penting. Pastikan kadar BK, gula, biotin, dan betain sesuai spesifikasi. Harga bervariasi tergantung nilai tukar rupiah terhadap Euro.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧬', text: 'Keunggulan utama molases bit dibanding molases tebu adalah kandungan biotin 8–20× lebih tinggi. Biotin esensial untuk sintesis asam lemak, metabolisme karbohidrat, dan integritas jaringan epitel — termasuk kuku dan kulit. Defisiensi biotin pada sapi menyebabkan white line disease dan kelaminan (laminitis), terutama pada sapi perah produksi tinggi.' },
      { type: 'kelebihan', icon: '✅', text: 'Betain alami (40–60 g/kg BK) dalam molases bit berfungsi sebagai osmoprotektan sel dan methyl donor penting. Pada unggas, betain menggantikan sebagian fungsi kolin (penghematan kolin 25–30%) dan meningkatkan pertumbuhan dalam kondisi heat stress. Pada babi, betain meningkatkan deposisi protein dan mengurangi lemak karkas.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan molases bit dengan vitamin B-kompleks yang rendah biotin (jangan double dosis biotin). Untuk sapi perah laminitis-prone: molases bit 3–5% ransum sebagai sumber biotin alami terbukti lebih hemat dari suplementasi biotin murni yang mahal. Betain dalam molases bit dapat mengurangi kebutuhan suplemen kolin 20–30%.' },
      { type: 'peringatan', icon: '⚠️', text: 'Na lebih tinggi dari molases tebu (1% BK vs 0.2% BK) — kombinasikan dengan Na dari sumber lain (garam, bahan pakan tinggi Na) harus dihitung total. Pada ternak gagal ginjal atau hipertensi: hindari. K tetap tinggi seperti molases tebu — efek laksatif serupa jika berlebih.' },
    ],
  },

  // ── 3. Nira Tebu ────────────────────────────────────────────────────────────
  'nira-tebu': {
    asal: 'Area perkebunan tebu di Jawa Timur, Jawa Tengah, Jawa Barat, Lampung, dan Sulawesi Selatan. Hanya tersedia lokal di sekitar pabrik gula atau kebun tebu.',
    sumber: 'Cairan hasil perasan batang tebu (Saccharum officinarum) segar sebelum proses pemurnian. Nira segar mengandung 13–18% sukrosa bersama air, mineral, dan sedikit protein. Mudah terfermentasi dalam beberapa jam setelah pemerasan.',
    bentukFisik: 'Cairan encer, kuning kehijauan hingga coklat muda. Sangat mudah mengalir.',
    warna: 'Kuning kehijauan hingga coklat muda (tergantung kesegaran dan varietas tebu)',
    aroma: 'Manis segar khas tebu, aroma alami; bila sudah fermentasi: asam/alkohol',
    kelebihan: 'Kadar gula sangat tinggi (13–18% as-fed, terutama sukrosa); sumber energi cair segar yang langsung tersedia; harga sangat murah di area perkebunan tebu; mengandung mineral alami (K, Mg); tidak perlu pengolahan lebih lanjut untuk pemberian segar.',
    kekurangan: 'Sangat mudah fermentasi (3–6 jam setelah pemerasan di suhu tropis); kadar BK sangat rendah (16–18%) — volume besar untuk energi setara; tidak ada asam amino esensial; tidak tersedia di luar area perkebunan tebu; tidak bisa disimpan lama.',
    nutrisi: {
      bk: 17.0, kadarAir: 83.0,
      pk: 0.6, sk: 1.2, lk: 0.3, abu: 1.5, betn: 96.4,
      tdn: 75.0, me: 2700,
      kadarGula: '76–88% BK (13–16% as-fed); terutama sukrosa (70–90% dari total gula)',
      asamLemakUtama: null,
      ca: 0.24, p: 0.12, mg: 0.18, na: 0.18, k: 1.18, cl: 0.59, s: 0.06,
      vitamin: 'Vitamin C: 5–15 mg/100 mL segar; Inositol, Biotin dalam jumlah kecil',
      catatanNutrisi: 'Nilai nutrisi sangat tergantung varietas tebu dan umur tanaman. BK berkisar 15–20%; kadar gula berkisar 13–18% as-fed. Nutrisi DM basis dihitung dari komposisi rata-rata. Fermentasi cepat mengubah sukrosa menjadi etanol dan asam laktat — nira fermentasi tidak sesuai untuk semua ternak.',
    },
    fisik: {
      ph: '5.0–5.5 (segar); 3.5–4.5 (setelah 6 jam fermentasi)',
      beratJenis: '1.06–1.08 kg/L (segar, suhu 25°C)',
      viskositas: '1.5–3 cP (25°C, sangat encer)',
      kelarutan: 'Sudah berupa larutan — larut sempurna dalam air',
      stabilitasPenyimpanan: 'SANGAT TIDAK STABIL. Fermentasi spontan dalam 3–6 jam di suhu tropis (30–35°C). Ragi liar mengubah sukrosa → alkohol + CO₂ dalam hitungan jam.',
      umurSimpan: '3–6 jam segar (suhu ruang tropis); 12–24 jam dalam pendingin (4°C)',
      kondisiPenyimpanan: 'Berikan langsung setelah pemerasan. Jika perlu disimpan: dalam wadah tertutup, suhu <10°C. Tambahkan kapur (Ca(OH)₂ 0.05–0.1%) untuk memperlambat fermentasi (nira alkali). Jangan simpan dalam tangki besi yang korosif.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber energi cair segar untuk ternak di sekitar area perkebunan tebu. Meningkatkan palatabilitas dan konsumsi hijauan berkualitas rendah. Dapat menggantikan sebagian molases dalam ransum fermentasi.',
      maksPenggunaan: '3–8 liter/hari/ekor sapi (as-fed); batasi karena volume besar dan fermentasi cepat',
      targetTernak: ['Sapi Pedaging', 'Kerbau', 'Kambing', 'Domba'],
      programCocok: ['Penggemukan', 'Indukan'],
      metodePemberian: 'Berikan segar segera setelah pemerasan. Bisa dicampur dengan hijauan atau disemprotkan ke hijauan kering. Untuk TMR: campurkan pada saat pemberian pakan, jangan biarkan >2 jam.',
      pencampuran: 'Semprotkan ke hijauan kering/jerami sambil diaduk untuk pemerataan. Jangan campur dengan urea sebelum benar-benar homogen (risiko hidrolis urea cepat jika ada ragi dari nira).',
      catatan: 'Hanya ekonomis jika peternak berlokasi <5 km dari pabrik gula/kebun tebu. Nira yang sudah mulai fermentasi (berbau asam/alkohol) tetap dapat diberikan ke sapi dalam jumlah terbatas tetapi harus dikurangi dari ransum total. Jangan berikan nira fermentasi kepada ternak bunting atau menyusui.',
    },
    harga: {
      estimasiAI: 2200, hargaMarketplace: null,
      satuan: 'per liter (as-fed)',
      supplier: 'Langsung dari pabrik gula atau kebun tebu lokal; tidak tersedia di distributor umum',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024). Sugarcane juice. INRA-CIRAD-AFZ-FAO.',
        'Preston, T.R. & Leng, R.A. (1987). Matching Ruminant Production Systems with Available Resources. Penambul Books.',
        'Perez, R. (1995). Feeding pigs in the tropics. FAO Animal Production and Health Paper 132.',
        'Hartadi, H., Reksohadiprodjo, S., Tillman, A.D. (1997). Tabel Komposisi Pakan untuk Indonesia.',
      ],
      sumberData: 'Komposisi mengacu pada Feedipedia (2024) untuk sugarcane juice dan Hartadi et al. (1997). Nilai gula mengacu pada analisis tebu Indonesia (PTPN). Stabilitas mengacu pada Preston & Leng (1987).',
      catatan: 'Tidak ada standar perdagangan khusus untuk nira tebu sebagai pakan ternak. Kualitas sangat tergantung varietas tebu, umur panen, dan kondisi pemerasan. Gunakan dalam 3 jam setelah pemerasan.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌿', text: 'Nira tebu adalah sumber energi cair paling murah yang dapat diakses peternak dekat perkebunan tebu. Sukrosa dalam nira segar langsung difermentasi mikroba rumen menjadi VFA — khususnya propionat yang bersifat glukogenik untuk mendukung produksi daging dan susu. Penggunaan 3–5 L/hari/sapi memberikan tambahan 2.000–3.500 kkal ME.' },
      { type: 'peringatan', icon: '⚠️', text: 'Fermentasi adalah musuh utama nira tebu. Dalam 3–6 jam di suhu 30°C, yeast liar mengubah 50–80% sukrosa menjadi etanol (alkohol) dan CO₂. Nira beralkohol diberikan dalam jumlah besar dapat menyebabkan intoksikasi ternak dan gangguan reproduksi. Selalu berikan SEGAR atau tidak lebih dari 3 jam setelah pemerasan.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi terbaik: Nira tebu segar (2–4 L) + jerami padi/jagung + urea blok. Nira bertindak sebagai sumber energi dan meningkatkan palatabilitas jerami berkualitas rendah. Untuk konservasi: nira dapat difermentasi terkontrol menjadi silase cair (ensiling) bersama jerami untuk penyimpanan 2–4 minggu.' },
      { type: 'alternatif', icon: '🔄', text: 'Jika tidak tersedia nira segar: molases tebu adalah alternatif terbaik yang stabil. Untuk fungsi serupa (energi cair + palatabilitas): gliserol atau propilen glikol memberikan energi tanpa masalah fermentasi, namun dengan harga lebih tinggi.' },
    ],
  },

  // ── 4. Nira Kelapa ──────────────────────────────────────────────────────────
  'nira-kelapa': {
    asal: 'Daerah penghasil kelapa: Sulawesi Utara (Minahasa, Gorontalo), Sulawesi Tengah, Jawa Tengah (Kebumen, Cilacap), Lampung, Sumatera Selatan, dan Maluku. Area penghasil gula aren/kelapa tradisional.',
    sumber: 'Cairan manis hasil penyadapan (tapping) bunga (mayang/tandan) kelapa (Cocos nucifera). Petani nira mengiris ujung tandan setiap hari dan menampung tetesan nira dalam bambu atau jerigen. Produksi per pohon: 1–3 L/hari.',
    bentukFisik: 'Cairan encer jernih hingga putih susu, sangat mudah mengalir. Kadar air sangat tinggi.',
    warna: 'Jernih hingga putih susu (segar); kekuningan hingga coklat (mulai fermentasi)',
    aroma: 'Manis segar khas kelapa; bila fermentasi: asam seperti tuak/wine',
    kelebihan: 'Kadar gula alami lebih beragam (glukosa, fruktosa, sukrosa, inositol); mengandung mineral alami (K, Mg, Ca, P); mengandung asam amino dan vitamin kecil; sangat palatable untuk ternak; tersedia segar di daerah perkebunan kelapa.',
    kekurangan: 'Kadar BK sangat rendah (14–17%); sangat mudah fermentasi — tidak tahan >6 jam di suhu tropis; ketersediaan terbatas pada area kelapa; produksi per pohon rendah (1–3 L/hari); tidak dapat disimpan lama tanpa refrigerasi.',
    nutrisi: {
      bk: 16.0, kadarAir: 84.0,
      pk: 4.4, sk: 0.0, lk: 1.3, abu: 7.5, betn: 86.8,
      tdn: 73.0, me: 2400,
      kadarGula: '68–80% BK (11–14% as-fed); campuran sukrosa, glukosa, fruktosa, inositol',
      asamLemakUtama: null,
      ca: 0.25, p: 0.13, mg: 0.13, na: 0.31, k: 1.13, cl: 0.75, s: null,
      vitamin: 'Riboflavin (B2): 0.01 mg/100 mL; Niasin: 0.06 mg/100 mL; Vitamin C: 2–3 mg/100 mL; Inositol: 3–5 mg/100 mL (osmolit)',
      catatanNutrisi: 'Komposisi bervariasi antar varietas kelapa, umur pohon, dan musim. Inositol relatif tinggi dibanding nira tebu. BK berkisar 14–18%. Mineral lebih seimbang dari molases. Sumber: Feedipedia (2024), analisis nira kelapa Indonesia (Balai Penelitian Tanaman Kelapa).',
    },
    fisik: {
      ph: '6.0–7.0 (segar); 4.0–5.0 (setelah fermentasi 6 jam)',
      beratJenis: '1.04–1.07 kg/L (segar)',
      viskositas: '1.2–2.0 cP (25°C, sangat encer)',
      kelarutan: 'Sudah berupa larutan encer — larut sempurna dalam air',
      stabilitasPenyimpanan: 'TIDAK STABIL. Fermentasi cepat dalam 4–8 jam di suhu tropis. Ragi dan bakteri liar segera mengkonversi gula → tuak (alkohol) atau asam. Lebih lambat dari nira tebu karena pH lebih tinggi.',
      umurSimpan: '4–8 jam (suhu ruang tropis); 12–18 jam (suhu 4°C)',
      kondisiPenyimpanan: 'Berikan segera setelah penyadapan. Untuk memperlambat fermentasi: tambahkan kapur sedikit (Ca(OH)₂ 0.05%) atau simpan dalam jerigen tertutup di tempat sejuk. Hindari wadah logam korosif.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber energi dan elektrolit alami untuk ternak. Sangat efektif sebagai suplemen elektrolitik untuk ternak stres panas (heat stress) dan pedet/anak ternak sakit.',
      maksPenggunaan: '2–5 liter/hari/ekor sapi; 0.5–1 liter/hari/ekor kambing/domba',
      targetTernak: ['Sapi Perah', 'Sapi Pedaging', 'Kambing', 'Domba', 'Kerbau', 'Pedet'],
      programCocok: ['Penggemukan', 'Indukan', 'Menyusui'],
      metodePemberian: 'Berikan segar. Dapat dicampur air minum untuk suplemen elektrolitik. Campurkan ke hijauan untuk meningkatkan palatabilitas. Tidak dianjurkan disimpan lebih dari 6 jam.',
      pencampuran: 'Campurkan ke pakan atau air minum segera sebelum pemberian. Jangan campurkan dengan urea karena fermentasi cepat meningkatkan risiko keracunan amonia.',
      catatan: 'Sangat berguna sebagai suplemen oral rehidrasi alami untuk pedet diare atau ternak stres panas — kombinasikan dengan garam (NaCl 5 g/L) dan sedikit soda kue (NaHCO₃ 3 g/L). Nira yang sudah menjadi tuak (kadar alkohol >2%) tidak boleh diberikan ke ternak bunting dan anak ternak.',
    },
    harga: {
      estimasiAI: 3500, hargaMarketplace: null,
      satuan: 'per liter (as-fed)',
      supplier: 'Petani nira kelapa setempat; tidak tersedia di distributor pakan; hanya di daerah penghasil kelapa',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024). Coconut sap. INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.',
        'Prades, A., Dornier, M., Diop, N. & Pain, J.P. (2012). Coconut water uses, composition and properties: a review. Fruits 67:87–107.',
        'Barlina, R. (2004). Potensi buah kelapa muda untuk kesehatan dan pengolahannya. Perspektif 3:46–60. Balai Penelitian Tanaman Kelapa dan Palma Lain.',
      ],
      sumberData: 'Komposisi mengacu pada Feedipedia (2024) dan analisis nira kelapa (Balai Penelitian Kelapa). Kadar mineral mengacu pada Prades et al. (2012).',
      catatan: 'Nira kelapa belum memiliki standar perdagangan sebagai pakan ternak di Indonesia. Kualitas sangat tergantung varietas kelapa dan teknik penyadapan. Penyadapan yang bersih menghasilkan nira lebih lambat fermentasi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌴', text: 'Nira kelapa adalah sumber elektrolit alami yang kaya K, Mg, Ca, dan Na dalam rasio yang lebih seimbang dari molases. Sebagai minuman ternak pada heat stress, nira segar 2–3 L/hari membantu mencegah deplesi elektrolit akibat keringat berlebih, terutama pada sapi perah produksi tinggi.' },
      { type: 'kelebihan', icon: '✅', text: 'Inositol dalam nira kelapa (3–5 mg/100 mL) adalah osmolit intraseluler yang melindungi sel dari stres osmotik dan panas. Berbeda dari gula biasa, inositol tidak difermentasi cepat oleh ragi. Mineral lebih seimbang (K:Na lebih rendah dari molases) sehingga lebih aman untuk ternak prapersalinan.' },
      { type: 'peringatan', icon: '⚠️', text: 'Fermentasi alami mengubah nira menjadi tuak (toddy) dengan kadar etanol 2–8% dalam 8–24 jam. Tuak dalam jumlah besar menyebabkan intoksikasi ternak (sempoyongan, penurunan koordinasi). Untuk pedet dan ternak muda: hanya gunakan nira yang benar-benar segar (<2 jam).' },
      { type: 'alternatif', icon: '🔄', text: 'Untuk fungsi elektrolitik: air kelapa muda lebih stabil dan lebih mudah diperoleh dari industri pengolahan kelapa. Untuk fungsi energi: molases tebu lebih ekonomis dan stabil. Nira kelapa paling relevan sebagai suplemen segar di peternakan yang berlokasi di daerah penghasil kelapa.' },
    ],
  },

  // ── 5. Nira Aren ────────────────────────────────────────────────────────────
  'nira-aren': {
    asal: 'Daerah penghasil pohon aren: Sulawesi (Minahasa, Gorontalo, Toraja), Maluku, Papua, Jawa Barat (Priangan), Sumatera Barat. Sentra gula aren/gula merah tradisional.',
    sumber: 'Cairan manis hasil penyadapan tandan bunga pohon aren (Arenga pinnata). Pohon aren disadap pada tandan jantan maupun betina. Produksi per pohon: 5–15 L/hari (lebih produktif dari kelapa).',
    bentukFisik: 'Cairan encer jernih hingga putih susu, sangat mudah mengalir. Mirip nira kelapa namun aroma lebih kuat.',
    warna: 'Jernih hingga putih susu; kekuningan saat mulai fermentasi',
    aroma: 'Manis khas aren, sedikit lebih intens dari nira kelapa; bila fermentasi: asam kuat',
    kelebihan: 'Kadar gula tinggi (mirip nira kelapa); produktivitas pohon lebih tinggi (5–15 L/hari vs 1–3 L/hari kelapa); mineral alami lebih tinggi dari nira kelapa; sangat palatable untuk ternak; tersedia di daerah pegunungan/pedesaan yang kaya pohon aren.',
    kekurangan: 'Sama seperti nira kelapa: sangat mudah fermentasi; BK rendah; hanya tersedia lokal; tidak untuk penyimpanan; produksi musiman tergantung tandan pohon aren.',
    nutrisi: {
      bk: 17.0, kadarAir: 83.0,
      pk: 3.5, sk: 0.2, lk: 1.0, abu: 7.5, betn: 87.8,
      tdn: 73.0, me: 2450,
      kadarGula: '72–82% BK (12–15% as-fed); sukrosa, glukosa, fruktosa; sedikit inulin',
      asamLemakUtama: null,
      ca: 0.24, p: 0.14, mg: 0.14, na: 0.18, k: 1.06, cl: 0.65, s: null,
      vitamin: 'Riboflavin, Niasin, Vitamin C dalam jumlah kecil (mirip nira kelapa)',
      catatanNutrisi: 'Komposisi mirip nira kelapa dengan kadar gula sedikit lebih tinggi. BK berkisar 15–20%. Data lebih terbatas dibanding nira tebu/kelapa. Sumber: Feedipedia (2024), analisis aren Indonesia.',
    },
    fisik: {
      ph: '6.5–7.0 (segar); 4.0–5.0 (fermentasi)',
      beratJenis: '1.05–1.08 kg/L',
      viskositas: '1.2–2.5 cP (25°C)',
      kelarutan: 'Sudah berupa larutan encer',
      stabilitasPenyimpanan: 'TIDAK STABIL. Fermentasi dalam 4–8 jam di suhu tropis. pH awal lebih tinggi (6.5–7.0) dibanding nira tebu/kelapa sehingga sedikit lebih lambat fermentasi.',
      umurSimpan: '4–8 jam segar (suhu ruang); 12–18 jam dalam pendingin',
      kondisiPenyimpanan: 'Berikan segera setelah penyadapan. Sama seperti nira kelapa.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber energi dan elektrolit alami. Penggunaan serupa dengan nira kelapa. Lebih produktif per pohon sehingga lebih relevant untuk peternakan di sentra aren.',
      maksPenggunaan: '2–5 liter/hari/ekor sapi (as-fed)',
      targetTernak: ['Sapi Pedaging', 'Kambing', 'Domba', 'Kerbau'],
      programCocok: ['Penggemukan', 'Indukan'],
      metodePemberian: 'Berikan segar. Campurkan ke hijauan atau pakan untuk meningkatkan palatabilitas. Hindari pemberian nira yang sudah fermentasi kepada ternak bunting.',
      pencampuran: 'Semprotkan ke hijauan kering segera sebelum pemberian. Tidak dianjurkan dicampur urea.',
      catatan: 'Di daerah penghasil gula aren: nira aren yang tidak terjual untuk gula dapat diberikan segar ke ternak sebagai suplemen murah. Ekonomis sebagai "waste utilization" dari industri gula aren. Nira fermentasi (saguer/tuak aren) jangan diberikan ke ternak bunting atau menyusui.',
    },
    harga: {
      estimasiAI: 3800, hargaMarketplace: null,
      satuan: 'per liter (as-fed)',
      supplier: 'Petani gula aren setempat; sentra produksi gula aren',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024). Sugar palm sap. INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.',
        'Lutony, T.L. (1993). Tanaman Sumber Pemanis. Penebar Swadaya, Jakarta.',
        'Bawalan, D.D. & Chapman, K.R. (2006). Virgin Coconut Oil Production Manual. FAO-RAP Publication.',
      ],
      sumberData: 'Komposisi mengacu pada Feedipedia (2024) untuk sugar palm sap dan analisis nira aren Indonesia (BPTP). Data mineral diekstrapolasi dari nira kelapa dengan penyesuaian literatur.',
      catatan: 'Data komposisi nira aren lebih terbatas dibanding nira tebu/kelapa. Disarankan analisis lokal jika digunakan dalam formulasi intensif.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌺', text: 'Nira aren memiliki keunggulan produktivitas dibanding nira kelapa — satu pohon aren menghasilkan 5–15 L/hari vs 1–3 L/hari kelapa. Di sentra aren (Minahasa, Toraja), ini bisa menjadi sumber energi cair yang signifikan bagi ternak kecil (kambing, domba) sebagai suplemen harian.' },
      { type: 'kombinasi', icon: '🔗', text: 'Paling efektif digunakan sebagai suplemen segar untuk ternak ruminansia kecil (kambing-domba) di peternakan rakyat dekat sentra aren. Kombinasikan 0.5–1 L nira aren segar dengan hijauan segar dan konsentrat sederhana untuk meningkatkan pertambahan bobot hidup 50–80 g/hari.' },
      { type: 'peringatan', icon: '⚠️', text: 'Saguer/tuak aren (nira fermentasi alami mengandung alkohol 4–10%) digunakan secara tradisional sebagai minuman fermentasi. JANGAN berikan tuak aren ke ternak bunting, menyusui, atau ternak muda karena kandungan etanol merusak perkembangan janin dan sistem saraf anak ternak.' },
      { type: 'alternatif', icon: '🔄', text: 'Di luar sentra aren, molases tebu adalah pengganti yang lebih praktis dan stabil. Nira aren paling relevan sebagai pemanfaatan lokal dari industri gula merah tradisional.' },
    ],
  },

  // ── 6. Air Kelapa ───────────────────────────────────────────────────────────
  'air-kelapa': {
    asal: 'Industri pengolahan kelapa: kopra (Sulawesi Utara, Maluku, Riau), santan/VCO (Jawa Tengah, Lampung). Air kelapa adalah by-product dari industri pengolahan kelapa muda/tua.',
    sumber: 'Cairan endosperma cair (liquid endosperm) dari buah kelapa (Cocos nucifera). Air kelapa muda: lebih banyak gula, rasa segar. Air kelapa tua: lebih encer, mineral lebih tinggi. Tersedia sebagai hasil samping pengolahan kopra, minyak kelapa, dan pengalengan.',
    bentukFisik: 'Cairan bening hingga putih transparan, sangat encer, mudah mengalir.',
    warna: 'Bening hingga putih pucat',
    aroma: 'Segar khas kelapa muda; sedikit manis; tidak berbau busuk jika segar',
    kelebihan: 'Kaya elektrolit alami (K, Na, Mg, Ca, P) dalam rasio yang mirip plasma darah — sangat efektif untuk rehidrasi; mengandung sitokinin (zeathin riboside) yang bersifat anti-inflamasi; lebih stabil dari nira (3–4 hari dalam kemasan tertutup); tersedia sebagai waste product industri kelapa; harga murah.',
    kekurangan: 'Kadar BK sangat rendah (5–6%); kandungan energi dan protein sangat rendah — bukan sumber nutrisi utama; cepat basi jika terkontaminasi; kadar gula rendah tidak efektif meningkatkan palatabilitas sebaik molases.',
    nutrisi: {
      bk: 5.5, kadarAir: 94.5,
      pk: 5.5, sk: 0.0, lk: 1.8, abu: 8.2, betn: 84.5,
      tdn: 70.0, me: 2200,
      kadarGula: '45–55% BK (2.4–3.5% as-fed); glukosa, fruktosa, sukrosa; sedikit sorbitol',
      asamLemakUtama: null,
      ca: 1.09, p: 0.73, mg: 1.09, na: 1.64, k: 3.64, cl: 1.09, s: null,
      vitamin: 'Vitamin C: 2.4–3.7 mg/100 mL; Riboflavin: 0.057 mg/100 mL; Niasin: 0.08 mg/100 mL; Sitokinin (zeatin): jejak — efek anti-inflamasi',
      catatanNutrisi: 'Nilai nutrisi DM basis dihitung dari rata-rata komposisi as-fed. BK sangat rendah (5–6%) sehingga volume besar diperlukan untuk kontribusi energi signifikan. Keunggulan utama: mineral elektrolit yang seimbang, bukan energi. Sumber: Prades et al. (2012), Feedipedia (2024).',
    },
    fisik: {
      ph: '4.7–5.5 (air kelapa segar)',
      beratJenis: '1.005–1.010 kg/L (20°C, mirip air)',
      viskositas: '1.0–1.5 cP (25°C, sangat encer)',
      kelarutan: 'Sudah berupa larutan — larut sempurna dalam air',
      stabilitasPenyimpanan: 'Segar: 3–4 hari dalam kemasan tertutup (suhu ruang) atau 1–2 minggu (refrigerasi 4°C). Lebih stabil dari nira tebu/kelapa karena pH lebih rendah (4.7–5.5) menghambat pertumbuhan bakteri. Kemasan UHT: 6–12 bulan.',
      umurSimpan: '3–4 hari (suhu ruang, kemasan tertutup); 7–14 hari (refrigerasi)',
      kondisiPenyimpanan: 'Wadah tertutup bersih. Suhu ruang maksimal 35°C. Refrigerasi dianjurkan untuk penggunaan >1 hari. Hindari wadah besi yang mempercepat oksidasi.',
    },
    penggunaan: {
      fungsiUtama: 'Suplemen elektrolit alami untuk rehidrasi ternak stres panas, pedet diare, dan ternak pascaoperasi. Bukan sumber energi atau protein utama — fungsi utama sebagai fluid therapy tambahan.',
      maksPenggunaan: '2–5 liter/hari/ekor sapi (sebagai suplemen air minum); 200–500 mL/hari pedet',
      targetTernak: ['Sapi Perah', 'Pedet', 'Kambing', 'Domba', 'Anak Kambing'],
      programCocok: ['Indukan', 'Menyusui', 'Grower'],
      metodePemberian: 'Berikan sebagai campuran air minum atau drench langsung. Untuk pedet diare: campurkan dengan larutan oralit (garam + soda kue) sebagai terapi rehidrasi oral. Dapat dicampur ke susu pengganti untuk meningkatkan elektrolit.',
      pencampuran: 'Campurkan dengan air minum 1:1 hingga 1:3 untuk mengencerkan. Dapat dicampurkan ke susu pengganti pedet. Hindari mencampur dengan urea.',
      catatan: 'Efektivitas sebagai terapi rehidrasi meningkat jika dikombinasikan dengan: NaCl 3.5 g/L + NaHCO₃ 2.5 g/L + Glukosa 20 g/L (standar oralit WHO yang dimodifikasi dengan air kelapa). Jangan mengandalkan air kelapa sebagai satu-satunya sumber nutrisi — gunakan sebagai suplemen atau terapi, bukan pakan utama.',
    },
    harga: {
      estimasiAI: 800, hargaMarketplace: 700,
      satuan: 'per liter (as-fed)',
      supplier: 'Pabrik minyak kelapa/VCO; Industri pengolahan santan; Pasar tradisional (air kelapa segar); Pabrik air kelapa kemasan',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Prades, A., Dornier, M., Diop, N. & Pain, J.P. (2012). Coconut water uses, composition and properties: a review. Fruits 67:87–107.',
        'Yong, J.W.H., et al. (2009). The chemical composition and biological properties of coconut (Cocos nucifera L.) water. Molecules 14:5144–5164.',
        'Feedipedia (2024). Coconut water. INRA-CIRAD-AFZ-FAO.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
      ],
      sumberData: 'Komposisi mineral mengacu pada Yong et al. (2009) dan Prades et al. (2012). Nilai nutrisi DM mengacu pada Feedipedia (2024). Penggunaan terapi mengacu pada NRC (2001) fluid therapy recommendations.',
      catatan: 'Komposisi air kelapa bervariasi signifikan tergantung umur buah, varietas, dan kondisi pertumbuhan. Air kelapa muda (7–9 bulan) lebih kaya mineral dan gula dari air kelapa tua (11–12 bulan).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '💧', text: 'Air kelapa adalah "sport drink alami" ternak — komposisi elektrolit (K 290 mg/100 mL, Na 105 mg/100 mL, Mg 10 mg/100 mL) mirip plasma darah sehingga ideal untuk rehidrasi. Pada sapi heat stress, kehilangan 3–5% bobot badan akibat keringat dalam 8 jam — air kelapa membantu pemulihan elektrolit lebih cepat dari air biasa.' },
      { type: 'kelebihan', icon: '✅', text: 'Dibanding minuman elektrolitik sintetis, air kelapa alami mengandung sitokinin (zeatin) yang bersifat anti-inflamasi dan mendukung regenerasi sel. Pada pedet diare dengan dehidrasi ringan-sedang, terapi oral dengan air kelapa + oralit setara efektivitasnya dengan rehidrasi IV parsial dan jauh lebih murah.' },
      { type: 'peringatan', icon: '⚠️', text: 'Air kelapa BUKAN pengganti pakan utama — kandungan energi sangat rendah (5.5% BK). Jangan gunakan sebagai pengganti susu pada pedet lepas kolostrum. Jika digunakan berlebihan sebagai pengganti air minum murni: kadar K tinggi (3.6% BK as-fed basis) dapat mengganggu keseimbangan elektrolit jika konsumsi air normal juga rendah.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula rehidrasi oral terbaik untuk pedet diare: 500 mL air kelapa + 500 mL air bersih + 3 g NaCl + 2 g NaHCO₃ + 10 g glukosa. Berikan 2–3 L/hari pada pedet diare ringan-sedang. Untuk sapi heat stress: berikan 2–3 L air kelapa + air minum ad libitum untuk mempertahankan produksi susu.' },
    ],
  },

  // ── 7. Whey Cair ────────────────────────────────────────────────────────────
  'whey-cair': {
    asal: 'Industri pengolahan susu/keju: pabrik keju mozzarella, cheddar, kasein (Jawa Timur — Malang, Pasuruan; Jawa Barat — Bandung). Whey adalah hasil samping utama produksi keju dan kasein.',
    sumber: 'Cairan yang tersisa setelah pemisahan dadih (curd) dari susu dalam proses pembuatan keju atau kasein. Mengandung laktosa (70–75% DM), protein whey terlarut (laktoglobulin, laktalbumin), mineral (Ca, P, K, Na), dan vitamin B-kompleks.',
    bentukFisik: 'Cairan kuning kehijauan hingga kuning muda, encer, sedikit berbusa. Bau khas susu asam jika fresh sweet whey; asam tajam jika acid whey.',
    warna: 'Kuning kehijauan (whey kasein) hingga kuning muda (sweet whey)',
    aroma: 'Aroma susu segar (sweet whey) atau asam khas yogurt (acid whey); sangat palatable',
    kelebihan: 'Sumber protein berkualitas tinggi (12–13% BK) dengan profil asam amino esensial lengkap; laktosa sebagai sumber energi untuk ternak non-ruminansia (babi, pedet, unggas); kaya vitamin B-kompleks; mineral seimbang (Ca:P rasio baik); palatabilitas sangat tinggi untuk babi dan pedet.',
    kekurangan: 'Sangat mudah rusak — harus digunakan segar dalam 24–48 jam; kadar BK sangat rendah (6–7%); tidak cocok untuk ternak dewasa ruminansia dalam jumlah besar (laktosa tidak bisa dicerna oleh rumen dewasa); perlu penanganan higiene ketat; ketersediaan terbatas di area pabrik keju.',
    nutrisi: {
      bk: 6.4, kadarAir: 93.6,
      pk: 12.5, sk: 0.0, lk: 1.6, abu: 8.6, betn: 77.3,
      tdn: 80.0, me: 3100,
      kadarGula: '70–76% BK (4.5–5.2% as-fed); terutama laktosa (disakarida, glukosa+galaktosa)',
      asamLemakUtama: null,
      ca: 0.97, p: 0.78, mg: 0.14, na: 0.47, k: 1.72, cl: 0.94, s: 0.16,
      vitamin: 'Riboflavin (B2): 1.5–2.0 mg/100 mL (sangat tinggi); B12: 0.5–1.5 μg/100 mL; Thiamin, Niasin, Pantotenat tersedia',
      catatanNutrisi: 'Nilai DM basis sangat tinggi karena BK hanya 6.4% — konversi ke as-fed: PK ~0.8%, Energi sangat rendah per liter. Whey manis (sweet whey, pH 6.0–6.5) memiliki komposisi lebih baik dari whey asam (acid whey, pH 4.5–5.0). Kadar riboflavin (B2) sangat tinggi. Sumber: NRC (2012), Feedipedia (2024).',
    },
    fisik: {
      ph: '4.5–5.5 (acid whey); 6.0–6.5 (sweet whey)',
      beratJenis: '1.021–1.027 kg/L (20°C)',
      viskositas: '1.2–1.8 cP (25°C, mirip air)',
      kelarutan: 'Sudah berupa larutan; larut sempurna dalam air',
      stabilitasPenyimpanan: 'Sangat tidak stabil — harus digunakan dalam 24–48 jam pada suhu <8°C. Pasteurisasi dapat memperpanjang umur 5–7 hari. Asam laktat dari fermentasi alami menurunkan pH dan menyebabkan bau tengik.',
      umurSimpan: '24–48 jam (suhu <8°C, segar); 5–7 hari (setelah pasteurisasi, refrigerasi)',
      kondisiPenyimpanan: 'Tangki refrigerasi (<8°C), ditutup rapat. Pasteurisasi (72°C/15 detik) untuk penyimpanan lebih lama. Jauhkan dari sinar matahari. Bersihkan tangki penyimpanan setiap 24–48 jam untuk mencegah biofilm bakteri.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber protein dan laktosa berkualitas tinggi untuk pakan pedet, babi, dan unggas. Menggantikan susu pengganti parsial pada pedet lepas kolostrum. Sumber riboflavin (B2) yang sangat baik.',
      maksPenggunaan: '3–5 liter/hari pedet; 2–5 liter/hari babi muda; 15–20% ransum unggas (dalam pakan basah)',
      targetTernak: ['Pedet', 'Babi Muda', 'Babi Finisher', 'Ayam Broiler', 'Sapi Perah (pedet)'],
      programCocok: ['Grower', 'Penggemukan'],
      metodePemberian: 'Berikan segar atau setelah pasteurisasi. Untuk pedet: campurkan dengan susu pengganti atau berikan terpisah. Untuk babi: campurkan ke pakan basah. Untuk unggas: campurkan ke air minum atau pakan basah (max 20%).',
      pencampuran: 'Tidak dianjurkan dicampur lebih dari 2 jam sebelum pemberian karena fermentasi laktosa. Untuk ransum basah babi: campurkan whey + konsentrat tepung = ransum liquid feeding.',
      catatan: 'Pedet lepas kolostrum (<7 hari): berikan 4–6 liter whey segar/hari + susu kolostrum sisa untuk mendukung pertumbuhan. JANGAN gunakan whey yang sudah berbau busuk (bau amoniak atau busuk sayuran) — indikasi kontaminasi bakteri patogen. Pada babi: whey meningkatkan pertambahan bobot 20–30% dibanding ransum kering sebanding karena palatabilitas tinggi.',
    },
    harga: {
      estimasiAI: 1500, hargaMarketplace: 1200,
      satuan: 'per liter (as-fed)',
      supplier: 'Pabrik keju lokal (Malang, Bandung, Semarang); Koperasi susu yang memiliki unit pengolahan keju',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024). Whey, liquid. INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.',
        'NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed. National Academy Press.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
        'McDonald, P., et al. (2011). Animal Nutrition, 7th Ed. Pearson Education.',
        'Lammers, P.J. et al. (2015). Liquid feeding of pigs: potential for reducing feed costs. Iowa State University Extension Publication.',
      ],
      sumberData: 'Komposisi mengacu pada Feedipedia (2024) dan NRC Swine (2012). Riboflavin mengacu pada McDonald (2011). Penggunaan pada pedet mengacu pada NRC Dairy Cattle (2001).',
      catatan: 'Kualitas whey bervariasi tergantung jenis keju (sweet whey dari rennet vs acid whey dari asam). Sweet whey lebih berkualitas untuk pakan. Acid whey (dari produksi kasein atau Greek yogurt) memiliki pH lebih rendah dan mineral lebih bervariasi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🧀', text: 'Whey cair adalah sumber protein paling berkualitas dalam kategori bahan cair — profil asam amino esensialnya mendekati susu sapi utuh, kaya leusin (pemicu sintesis protein otot) dan sistein (prekursor glutation antioksidan). Untuk babi muda (10–30 kg), whey cair meningkatkan ADG 15–25% dibanding ransum kering sebanding.' },
      { type: 'kelebihan', icon: '✅', text: 'Riboflavin (B2) whey cair 15–20× lebih tinggi dari bahan pakan nabati — efektif mencegah defisiensi B2 (dermatitis, gangguan reproduksi). Laktosa adalah prebiotik alami yang mendukung pertumbuhan Lactobacillus di usus pedet dan babi muda, mengurangi diare pasca-sapih. Sumber protein whey terbukti meningkatkan efisiensi pakan (FCR) pada pedet lepas susu.' },
      { type: 'peringatan', icon: '⚠️', text: 'Ruminansia dewasa memiliki kemampuan terbatas mencerna laktosa — laktase di usus hilang setelah dewasa. Pemberian whey berlebih (>5 L/hari) pada sapi dewasa menyebabkan diare osmotik akibat laktosa tidak tercerna. Untuk pedet: berikan secara bertahap meningkat agar sistem pencernaan adaptasi.' },
      { type: 'kombinasi', icon: '🔗', text: 'Liquid feeding system (whey + tepung konsentrat + air) untuk babi adalah sistem paling efisien secara FCR dan ADG di Eropa — babi tumbuh 15–20% lebih cepat dengan FCR lebih baik. Di Indonesia: kombinasikan whey dari pabrik keju lokal + tepung jagung + dedak + konsentrat protein = pakan babi premium murah.' },
    ],
  },

  // ── 8. Susu Segar Afkir ─────────────────────────────────────────────────────
  'susu-segar-afkir': {
    asal: 'Peternakan sapi perah dan koperasi susu: Jawa Barat (KPSBU Lembang, KUD Cisarua), Jawa Tengah, Jawa Timur (Pujon, Batu). Susu afkir berasal dari sapi yang mendapat antibiotik, susu dengan kadar somatic cell count (SCC) tinggi, atau susu with off-grade quality.',
    sumber: 'Susu sapi segar yang tidak memenuhi standar penerimaan industri pengolahan susu (IPS) atau standar SNI. Penyebab utama: (1) masa withdrawl antibiotik (3–7 hari pasca pengobatan), (2) SCC >400.000 sel/mL, (3) bau/rasa abnormal, (4) uji alkohol positif, (5) kadar BK rendah (<11.5%).',
    bentukFisik: 'Cairan putih susu, encer hingga sedikit kental. Komposisi mirip susu segar normal namun dengan kualitas off-grade.',
    warna: 'Putih susu',
    aroma: 'Aroma susu segar; dapat berbau antibiotik (jika susu antibiotik) atau asam (jika SCC tinggi)',
    kelebihan: 'Kandungan nutrisi setara susu segar normal — tinggi protein (25–28% BK), lemak (29–33% BK), dan energi; sangat palatable; mendukung pertumbuhan pedet dengan baik; sumber Ca, P berkualitas untuk mineralisasi tulang; nilai ekonomis bagi peternak (daripada dibuang).',
    kekurangan: 'Risiko residu antibiotik jika berasal dari sapi dalam masa pengobatan — berbahaya untuk ternak dan chain produk (daging/susu tidak boleh positif antibiotik); SCC tinggi mengindikasikan bakteri patogen (Staphylococcus aureus, Streptococcus); mudah rusak; perlu seleksi ketat sebelum digunakan sebagai pakan.',
    nutrisi: {
      bk: 12.5, kadarAir: 87.5,
      pk: 26.4, sk: 0.0, lk: 31.2, abu: 5.6, betn: 36.8,
      tdn: 81.0, me: 3200,
      kadarGula: '34–40% BK (4.0–5.0% as-fed); terutama laktosa',
      asamLemakUtama: 'Asam butirat (C4:0) 3.4%, Asam laurat (C12:0) 3.2%, Asam palmitat (C16:0) 27%, Asam oleat (C18:1) 27%, Asam stearat (C18:0) 12%',
      ca: 1.12, p: 0.88, mg: 0.11, na: 0.35, k: 1.42, cl: 0.96, s: 0.30,
      vitamin: 'Vitamin A: 40–60 IU/100 mL; Vitamin D: 0.1–0.4 IU/100 mL; Riboflavin: 0.15 mg/100 mL; B12: 0.4 μg/100 mL; Vit E: 0.1–0.2 mg/100 mL',
      catatanNutrisi: 'Komposisi nutrisi setara susu segar normal. Perbedaan dari susu komersial hanya pada kualitas (bukan komposisi) — residu AB, SCC, atau organoleptik. BK berkisar 11–13%. Sumber: NRC Dairy Cattle (2001), McDonald (2011).',
    },
    fisik: {
      ph: '6.5–6.7 (susu normal); <6.4 (susu mulai asam/SCC tinggi)',
      beratJenis: '1.028–1.034 kg/L (20°C)',
      viskositas: '1.5–2.0 cP (25°C)',
      kelarutan: 'Emulsi stabil; larut dalam air (protein dan laktosa); lemak susu tersuspensi sebagai globula lemak',
      stabilitasPenyimpanan: 'Sangat tidak stabil tanpa refrigerasi — rusak dalam 4–6 jam di suhu tropis (30°C). Refrigerasi 4°C: 2–3 hari. Pasteurisasi: 5–7 hari.',
      umurSimpan: '4–6 jam (suhu ruang); 2–3 hari (refrigerasi 4°C)',
      kondisiPenyimpanan: 'Refrigerasi <8°C segera setelah pengambilan. Pasteurisasi dianjurkan sebelum diberikan ke pedet untuk membunuh patogen (Mycobacterium bovis, Salmonella, E. coli O157). Gunakan segera — jangan simpan lebih dari 24 jam tanpa pasteurisasi.',
    },
    penggunaan: {
      fungsiUtama: 'Pengganti susu (milk replacer) alami untuk pedet sebelum sapih. Sumber protein dan energi berkualitas tinggi untuk babi muda. Harus dipasteurisasi atau direbus sebelum diberikan.',
      maksPenggunaan: '5–8 liter/hari pedet (sesuai umur); 2–4 liter/hari babi muda',
      targetTernak: ['Pedet (anak sapi)', 'Babi Muda', 'Anak Kambing'],
      programCocok: ['Grower'],
      metodePemberian: 'PASTEURISASI DULU (72°C/15 detik atau rebus 5 menit, dinginkan ke 38°C). Berikan menggunakan botol susu atau ember nipple untuk pedet. Mulai 2–4 L/hari untuk pedet baru lahir, tingkatkan bertahap hingga 6–8 L/hari.',
      pencampuran: 'Dapat dicampur dengan susu pengganti komersial atau molases 1–2% untuk meningkatkan palatabilitas. Jangan campurkan dengan air panas langsung (denaturasi protein).',
      catatan: 'PERHATIAN UTAMA: Susu dari sapi yang sedang diobati antibiotik JANGAN diberikan ke ternak jika masa withdrawl belum selesai. Residu antibiotik dapat mengganggu flora usus pedet dan menyebabkan resistensi. Selalu tanyakan riwayat pengobatan sapi ke peternak sebelum menggunakan susu afkir. Susu SCC tinggi mengandung bakteri mastitis — pasteurisasi wajib.',
    },
    harga: {
      estimasiAI: 2500, hargaMarketplace: 2000,
      satuan: 'per liter (as-fed)',
      supplier: 'Koperasi susu dan peternak sapi perah setempat; harga jauh di bawah harga susu komersial',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed. National Academy Press.',
        'Feedipedia (2024). Whole milk. INRA-CIRAD-AFZ-FAO.',
        'USDA-FSIS (2016). Safe Milk Handling Guidelines for Calves. United States Department of Agriculture.',
        'Godden, S. (2008). Colostrum management for dairy calves. Vet. Clin. North Am. Food Anim. Pract. 24:19–39.',
      ],
      sumberData: 'Komposisi susu mengacu pada NRC Dairy Cattle (2001) dan Feedipedia (2024) whole milk. Asam lemak mengacu pada McDonald (2011). Panduan penggunaan mengacu pada Godden (2008) dan USDA-FSIS (2016).',
      catatan: 'Regulasi Indonesia (Permentan No. 33/2014 tentang pakan ternak): susu afkir dari sapi dalam pengobatan antibiotik tidak boleh digunakan sebagai pakan ternak selama masa karantina pengobatan. Selalu dokumentasikan sumber dan riwayat pengobatan sapi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🥛', text: 'Susu afkir adalah pengganti susu induk paling lengkap untuk pedet sebelum sapih — komposisi nutrisi identik dengan susu normal. Pedet yang diberi susu afkir pasteurisasi mencapai pertumbuhan 700–900 g/hari (sebanding dengan susu segar komersial) dengan biaya jauh lebih rendah. Ini adalah solusi ekonomis untuk peternakan yang memiliki akses ke koperasi susu.' },
      { type: 'peringatan', icon: '⚠️', text: 'RISIKO PATOGEN: Susu afkir dapat mengandung Mycobacterium bovis (penyebab TBC sapi), Salmonella, E. coli O157:H7, dan virus BVD. PASTEURISASI WAJIB (72°C/15 detik atau LTLT 63°C/30 menit) sebelum diberikan ke pedet. Susu mentah dari sapi sakit menyebabkan diare, pneumonia, dan kematian pedet dengan tingkat mortalitas tinggi.' },
      { type: 'peringatan', icon: '💊', text: 'Residu antibiotik: susu dari sapi yang mendapat antibiotik (ampisilin, penisilin, tetrasiklin) selama masa withdrawal (3–7 hari tergantung obat) DILARANG diberikan ke ternak atau manusia. Residu AB mengganggu mikrobiota usus pedet dan meningkatkan risiko resistensi antimikroba (AMR) — isu keamanan pangan global yang serius.' },
      { type: 'kombinasi', icon: '🔗', text: 'Program pemberian susu afkir untuk pedet: hari 1–3 kolostrum (4 L/hari), hari 4–7 transisi ke susu afkir pasteurisasi (4 L/hari), hari 8–56 susu afkir 5–6 L/hari + starter pelet ad libitum, hari 60–70 sapih bertahap. Program ini menghasilkan pertambahan bobot 750–850 g/hari dengan biaya paling ekonomis.' },
    ],
  },

  // ── 9. Susu Skim Cair ───────────────────────────────────────────────────────
  'susu-skim-cair': {
    asal: 'Industri pengolahan susu yang memproduksi krim/mentega: pabrik susu (Jawa Barat, Jawa Timur). Susu skim adalah produk samping dari pemisahan krim menggunakan separator sentrifugal.',
    sumber: 'Susu sapi yang telah dipisahkan sebagian besar lemaknya menggunakan separator sentrifugal. Kandungan lemak turun dari 3.5–4.5% menjadi <0.5%. Protein dan laktosa tetap penuh. Dapat berupa cairan segar (liquid skim milk) atau produk UHT.',
    bentukFisik: 'Cairan putih kebiruan, lebih encer dari susu full-fat. Terlihat lebih transparan.',
    warna: 'Putih kebiruan (akibat lemak dihilangkan)',
    aroma: 'Aroma susu segar, lebih ringan dari susu full-fat; tidak ada aroma lemak susu',
    kelebihan: 'Protein sangat tinggi (36–38% BK) dengan profil AA esensial lengkap; laktosa tinggi sebagai sumber energi; Ca:P rasio ideal untuk mineralisasi tulang pedet; lemak sangat rendah sehingga lebih stabil dari susu full-fat; sangat palatable; sumber riboflavin, B12 yang sangat baik.',
    kekurangan: 'Kurang vitamin A, D, E (larut lemak dihilangkan bersama krim); kadar BK rendah (9–10%) — volume besar untuk energi setara; tidak cocok sebagai satu-satunya sumber pakan pedet karena kurang vitamin larut lemak; perlu suplementasi vitamin A dan D jika digunakan jangka panjang.',
    nutrisi: {
      bk: 9.5, kadarAir: 90.5,
      pk: 36.8, sk: 0.0, lk: 1.6, abu: 7.4, betn: 54.2,
      tdn: 78.0, me: 3050,
      kadarGula: '50–55% BK (4.8–5.2% as-fed); terutama laktosa',
      asamLemakUtama: null,
      ca: 1.37, p: 1.05, mg: 0.13, na: 0.47, k: 1.68, cl: 0.84, s: 0.32,
      vitamin: 'Riboflavin (B2): 0.17 mg/100 mL; B12: 0.5 μg/100 mL; B6: 0.04 mg/100 mL; RENDAH vitamin A, D, E (terhilang bersama krim)',
      catatanNutrisi: 'Protein DM basis sangat tinggi (36.8%) karena BK rendah. Setara 3.5% protein as-fed. Lemak sangat rendah (<0.5% as-fed). Harus disuplementasi vitamin A dan D jika digunakan sebagai sole milk replacer. Sumber: NRC Dairy Cattle (2001), Feedipedia (2024).',
    },
    fisik: {
      ph: '6.5–6.7',
      beratJenis: '1.033–1.036 kg/L (20°C, sedikit lebih berat dari susu full-fat karena lemak lebih sedikit)',
      viskositas: '1.5–1.8 cP (25°C)',
      kelarutan: 'Larut sempurna dalam air; emulsi stabil tanpa lemak globula',
      stabilitasPenyimpanan: 'Segar: 2–3 hari (refrigerasi <8°C). UHT: 6–12 bulan (suhu ruang dalam kemasan aseptik).',
      umurSimpan: '2–3 hari (segar, refrigerasi); 6–12 bulan (UHT)',
      kondisiPenyimpanan: 'Susu skim segar: refrigerasi <8°C, gunakan dalam 48–72 jam. UHT: suhu ruang, hindari sinar matahari langsung.',
    },
    penggunaan: {
      fungsiUtama: 'Pengganti susu induk (milk replacer) untuk pedet lepas kolostrum — lebih tinggi protein dari susu full-fat per unit BK. Sumber protein berkualitas tinggi untuk babi muda. Digunakan dalam formulasi susu pengganti komersial.',
      maksPenggunaan: '4–7 liter/hari pedet; 2–4 liter/hari babi muda',
      targetTernak: ['Pedet (anak sapi)', 'Anak Kambing', 'Babi Muda'],
      programCocok: ['Grower'],
      metodePemberian: 'Berikan pada suhu 37–38°C (suhu tubuh). Pasteurisasi susu segar skim sebelum diberikan ke pedet. UHT langsung dapat digunakan. Mulai dari 4 L/hari untuk pedet baru lepas kolostrum.',
      pencampuran: 'Dapat dicampur dengan susu pengganti komersial. Tambahkan 500–1000 IU vitamin A dan 500–1000 IU vitamin D per liter jika digunakan sebagai sole milk replacer jangka panjang (>2 minggu).',
      catatan: 'Suplementasi vitamin A, D, E WAJIB jika susu skim digunakan sebagai satu-satunya pengganti susu selama >2 minggu. Pedet yang hanya diberi susu skim tanpa vitamin larut lemak dapat mengalami rachitis (kekurangan D) dan rabun senja (kekurangan A) dalam 4–6 minggu.',
    },
    harga: {
      estimasiAI: 3000, hargaMarketplace: 2800,
      satuan: 'per liter (as-fed)',
      supplier: 'Pabrik susu dengan unit pemisah krim; distributor produk susu industri',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed. National Academy Press.',
        'Feedipedia (2024). Skimmed milk, liquid. INRA-CIRAD-AFZ-FAO.',
        'Drackley, J.K. (2008). Calf nutrition from birth to weaning. Proc. 24th Annual Florida Ruminant Nutrition Symposium.',
        'McDonald, P., et al. (2011). Animal Nutrition, 7th Ed.',
      ],
      sumberData: 'Komposisi mengacu pada Feedipedia (2024) liquid skim milk dan NRC (2001). Penggunaan pedet mengacu pada Drackley (2008). Mineral mengacu pada McDonald (2011).',
      catatan: 'Pastikan susu skim UHT yang digunakan adalah grade pakan (feed grade) atau food grade — hindari susu skim kadaluarsa dari industri makanan manusia karena mungkin mengandung pengawet atau bahan tambahan yang tidak aman untuk ternak.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🐄', text: 'Susu skim cair memberikan protein whey dan kasein berkualitas tinggi untuk pedet — leusin dan isoleusin tinggi memicu sintesis protein otot (mTOR pathway), menghasilkan pertumbuhan optimal 750–900 g/hari. Dibanding milk replacer serbuk komersial, susu skim segar lebih bioavailable karena protein tidak terdenaturasi panas.' },
      { type: 'kelebihan', icon: '✅', text: 'Ca:P = 1.37:1.05 (rasio mendekati ideal 1.3:1) menjadikan susu skim cair sumber mineral tulang paling seimbang di antara semua bahan cair. Untuk mineralisasi tulang pedet: 1 liter susu skim menyumbang ~130 mg Ca dan ~100 mg P yang langsung bioavailable dari laktosa-mineral kompleks.' },
      { type: 'peringatan', icon: '⚠️', text: 'Vitamin A dan D SANGAT RENDAH pada susu skim (keduanya larut lemak — hilang bersama krim). Tanpa suplementasi, pedet yang diberi susu skim >3 minggu mengalami: kekurangan Vitamin D → rachitis (tulang lunak, pertumbuhan terhambat), kekurangan Vitamin A → kerentanan infeksi, gangguan penglihatan. Selalu tambahkan vitamin A/D/E.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula milk replacer ekonomis: 1 L susu skim segar + 10 g lemak sawit/minyak kelapa (untuk energi larut lemak) + 500 IU Vitamin A + 500 IU Vitamin D3 + 5 IU Vitamin E per liter. Campuran ini mendekati komposisi susu sapi utuh dengan biaya 30–40% lebih murah dari milk replacer komersial.' },
    ],
  },

  // ── 10. Minyak Kelapa ───────────────────────────────────────────────────────
  'minyak-kelapa': {
    asal: 'Daerah penghasil kelapa: Sulawesi Utara, Maluku, Riau, Jawa Tengah, Lampung. Industri kopra (Kelapa → kopra → minyak kelapa) adalah industri utama; VCO (virgin coconut oil) dari pressing dingin semakin berkembang.',
    sumber: 'Hasil ekstraksi daging buah kelapa (kopra) melalui pengepresan panas atau dingin (VCO). Minyak kelapa konvensional: kopra dipress atau diekstrak solvent (RBD — Refined, Bleached, Deodorized). VCO: pressing dingin kelapa segar tanpa pemanasan.',
    bentukFisik: 'Cair jernih pada suhu >25°C; padat putih di bawah 25°C (titik beku 23–26°C). Tidak berwarna hingga putih jernih dalam kondisi cair.',
    warna: 'Tidak berwarna (jernih) saat cair; putih padat saat dingin',
    aroma: 'VCO: aroma khas kelapa lembut. RBD/kopra: netral/tidak berbau (setelah deodorisasi)',
    kelebihan: 'Kaya asam lemak rantai sedang (MCFA: C8–C14, terutama laurat C12) yang diserap langsung portal vena tanpa perlu emulsifikasi empedu — sumber energi cepat; bersifat anti-mikroba (laurat terbukti menghambat bakteri gram-positif dan virus); ME tertinggi di antara semua bahan pakan; meningkatkan kecernaan ransum; stabil terhadap panas dan oksidasi (saturated).',
    kekurangan: 'Harga tinggi dibanding minyak sawit; kandungan omega-6 dan omega-3 sangat rendah — tidak menyediakan PUFA esensial; MCFA tinggi dapat menghambat sintesis lemak susu (milk fat depression) pada sapi perah; dapat mengurangi konsumsi pakan jika berlebih (>6% ransum unggas); tidak mengandung protein, serat, atau mineral.',
    nutrisi: {
      bk: 99.5, kadarAir: 0.5,
      pk: 0.0, sk: 0.0, lk: 99.5, abu: 0.01, betn: 0.49,
      tdn: null, me: 8200,
      kadarGula: null,
      asamLemakUtama: 'Laurat (C12:0): 45–52% | Miristat (C14:0): 16–21% | Kaprilat (C8:0): 5–9% | Kapirat (C10:0): 4–8% | Palmitat (C16:0): 7–11% | Oleat (C18:1 n-9): 5–8% | Linoleat (C18:2 n-6): 1–3% | MCFA total: ~68%',
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      vitamin: 'Tokoferol (Vit E): 0.5–3 mg/100g; VCO: 0.5–1.5 mg/100g; lebih rendah dari minyak nabati PUFA',
      catatanNutrisi: 'TDN tidak relevan untuk minyak murni (TDN formula berasumsi campuran normal). ME 8.200 kcal/kg BK (ruminansia, dihitung dari EE × 8.3 × efisiensi pencernaan lemak jenuh). ME untuk unggas: ~8.800 kcal/kg AME. Tidak ada protein, serat, atau mineral signifikan. Sumber: Feedipedia (2024), NRC Poultry (1994).',
    },
    fisik: {
      ph: 'Tidak terukur/tidak relevan (minyak murni, pH hanya untuk larutan berair)',
      beratJenis: '0.900–0.925 kg/L (cair, 25°C)',
      viskositas: '50–70 cP (20°C, cair); padat <25°C',
      kelarutan: 'Tidak larut dalam air; larut dalam pelarut organik (heksan, eter). Dapat diemulsifikasi dengan lesitin.',
      stabilitasPenyimpanan: 'Sangat stabil terhadap oksidasi karena lemak jenuh dominan (tidak ada PUFA). Umur simpan 1–2 tahun dalam kemasan tertutup suhu ruang. Terlindung dari cahaya dan panas berlebih. Rentan solidifikasi di suhu dingin (<25°C) — tidak merusak kualitas.',
      umurSimpan: '12–24 bulan (kemasan tertutup, suhu ruang)',
      kondisiPenyimpanan: 'Drum/jerigen tertutup, suhu ruang. Jangan simpan bersama bahan berbau kuat (absorpsi bau). Jika mengeras (suhu dingin): panaskan ringan untuk mencairkan, tidak merusak kualitas.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber energi terkonsentrasi (ME tertinggi semua bahan pakan); anti-mikroba alami (laurat); meningkatkan kecernaan dan kepadatan energi ransum; mengurangi debu pakan; meningkatkan palatabilitas.',
      maksPenggunaan: '2–5% ransum (sapi/kambing/domba); 2–4% ransum (unggas); 3–6% ransum (babi)',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi Finisher', 'Sapi Perah (transisi)', 'Kambing Perah'],
      programCocok: ['Penggemukan', 'Indukan', 'Menyusui', 'Grower'],
      metodePemberian: 'Semprotkan/campurkan ke ransum dalam mixer. Lelehkan dulu jika mengeras (<25°C). Dapat disemprotkan ke pelet untuk meningkatkan palatabilitas dan mengurangi debu.',
      pencampuran: 'Campurkan paling akhir dalam proses mixing (setelah bahan kering homogen) untuk hindari penggumpalan. Untuk liquid phase: campurkan dengan minyak lain sebelum ditambahkan ke mixer.',
      catatan: 'Laurat dalam minyak kelapa terbukti menghambat Clostridium perfringens (penyebab necrotic enteritis unggas) pada dosis 2–3% ransum — potensi pengganti antibiotic growth promoter (AGP). Pada sapi perah: >3% ransum DM dapat menyebabkan milk fat depression (penurunan %lemak susu) karena MCFA menghambat sintesis asam butirat di rumen.',
    },
    harga: {
      estimasiAI: 16000, hargaMarketplace: 15000,
      satuan: 'per liter (as-fed)',
      supplier: 'Pabrik minyak kelapa (Sulawesi, Jawa); Distributor minyak nabati pakan; Pasar bahan pakan ternak',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024). Coconut oil. INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.',
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed. National Academy Press.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
        'Annison, G. (1991). Relationship between digestibility and production performance in broilers given diets containing whole grain wheat and fat. Brit. J. Nutr. 65:85–95.',
        'Solis de los Santos, F. et al. (2008). Effect of dietary coconut oil on healthy broilers. Poult. Sci. 87:2386.',
      ],
      sumberData: 'Profil asam lemak mengacu pada Feedipedia (2024) coconut oil dan NRC Poultry (1994). ME ruminansia dihitung berdasarkan gross energy lemak jenuh × kecernaan (NRC Dairy 2001). Efek anti-mikroba mengacu pada Solis de los Santos et al. (2008).',
      catatan: 'Minyak kelapa dari sumber berbeda (kopra lama vs VCO vs RBD) memiliki profil asam lemak serupa tetapi kandungan tokoferol dan asam lemak bebas berbeda. Pilih produk food/feed grade dengan kadar asam lemak bebas (FFA) <0.5% untuk kualitas terbaik.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '⚡', text: 'MCFA (asam lemak rantai sedang C8–C14) dalam minyak kelapa memiliki jalur metabolisme unik — diserap langsung ke portal vena dan oksidasi di hati tanpa melalui limfatik (seperti LCFA). Energi tersedia lebih cepat dan lebih efisien. Pada unggas, penambahan 2% minyak kelapa meningkatkan ME ransum 120–180 kcal/kg dan ADG 3–5%.' },
      { type: 'kelebihan', icon: '✅', text: 'Asam laurat (45–52%) terbukti secara in vitro dan in vivo memiliki aktivitas anti-mikroba terhadap Clostridium perfringens, Staphylococcus, dan beberapa virus (termasuk influenza). Pada dosis 2–3% ransum unggas: necrotic enteritis berkurang 40–60% dalam penelitian lapangan, berpotensi mengurangi ketergantungan pada AGP.' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasikan minyak kelapa (2%) + vitamin E (100 IU/kg) + selenium (0.3 ppm) untuk ransum unggas: manfaat anti-oksidan melengkapi manfaat anti-mikroba. Untuk sapi perah: batasi kombinasi minyak kelapa dengan minyak sawit untuk mengontrol total lemak <6% ransum DM. Jangan kombinasikan dengan minyak ikan (flavor transfer ke produk susu).' },
      { type: 'peringatan', icon: '⚠️', text: 'Milk fat depression pada sapi perah: minyak kelapa >3% ransum DM mengganggu biohydrogenation di rumen, menghasilkan fatty acid intermediate yang menghambat lipogenesis di kelenjar susu. Tanda-tanda: % lemak susu turun dari 3.8% ke 2.5–3.0% dalam 2–3 minggu pemberian. Kurangi dosis ke <2% atau hentikan.' },
    ],
  },

  // ── 11. Minyak Sawit ────────────────────────────────────────────────────────
  'minyak-sawit': {
    asal: 'Indonesia (produsen terbesar dunia): Sumatera (Riau, Jambi, Sumatera Utara, Kalimantan). Tersedia sangat luas di seluruh Indonesia dari PKS (Pabrik Kelapa Sawit) lokal. Harga paling kompetitif di antara semua minyak nabati.',
    sumber: 'Diekstraksi dari mesokarp (daging buah) kelapa sawit (Elaeis guineensis). CPO (Crude Palm Oil): produk pertama dari PKS, belum dimurnikan. RBDPO (Refined Bleached Deodorized Palm Oil): sudah dimurnikan, cocok untuk pakan.',
    bentukFisik: 'Semi-padat atau semi-cair pada suhu ruang (titik beku 33–39°C). Cair jika suhu >35°C. CPO: oranye-kemerahan. RBDPO: kuning muda.',
    warna: 'CPO: oranye-kemerahan (kaya β-karoten); RBDPO: kuning pucat',
    aroma: 'CPO: aroma khas sawit; RBDPO: netral setelah deodorisasi',
    kelebihan: 'Harga paling murah dan tersedia paling luas di Indonesia; kandungan ME sangat tinggi; β-karoten (CPO) sebagai prekursor vitamin A; tokoferol dan tokotrienol (vitamin E alami) tinggi; asam palmitat memiliki stabilitasoksidasi baik; ideal untuk meningkatkan kepadatan energi ransum unggas dan babi.',
    kekurangan: 'Tinggi asam lemak jenuh (palmitat 39–45%) yang dapat meningkatkan kadar LDL produk ternak; rasio omega-6:omega-3 sangat tinggi (tidak menyediakan omega-3); penanganan sulit karena semi-padat di suhu dingin; CPO perlu pemanasan sebelum pencampuran; kandungan PUFA esensial (LA, ALA) rendah.',
    nutrisi: {
      bk: 99.5, kadarAir: 0.5,
      pk: 0.0, sk: 0.0, lk: 99.5, abu: 0.01, betn: 0.49,
      tdn: null, me: 8000,
      kadarGula: null,
      asamLemakUtama: 'Palmitat (C16:0): 39–46% | Oleat (C18:1 n-9): 36–44% | Linoleat (C18:2 n-6): 9–11% | Stearat (C18:0): 4–6% | Miristat (C14:0): 0.5–2% | Linolenat (C18:3 n-3): 0.2–0.4%',
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      vitamin: 'CPO: β-Karoten 500–700 ppm (prekursor Vitamin A); Tokoferol + Tokotrienol: 600–1.000 ppm total (Vit E alami). RBDPO: lebih rendah setelah refining.',
      catatanNutrisi: 'ME untuk ruminansia: ~8.000 kcal/kg BK. ME untuk unggas (AME): ~8.500–8.800 kcal/kg. CPO mengandung β-karoten dan tokotrienol yang hilang dalam RBDPO. Rasio asam lemak jenuh:tak jenuh = ~50:50. Sumber: Feedipedia (2024), NRC Poultry (1994).',
    },
    fisik: {
      ph: 'Tidak relevan (minyak)',
      beratJenis: '0.888–0.895 kg/L (cair, 40°C)',
      viskositas: '30–50 cP (40°C, cair); semakin kental di suhu lebih rendah',
      kelarutan: 'Tidak larut dalam air; larut dalam pelarut organik. Emulsifikasi memerlukan emulsifier.',
      stabilitasPenyimpanan: 'Lebih stabil dari minyak PUFA (jagung, kedelai) karena kandungan lemak jenuh tinggi. Umur simpan 6–12 bulan (CPO) hingga 18–24 bulan (RBDPO). Lindungi dari cahaya UV dan suhu >60°C.',
      umurSimpan: '6–12 bulan CPO; 18–24 bulan RBDPO (kemasan tertutup)',
      kondisiPenyimpanan: 'Tangki tertutup, suhu >35°C untuk menjaga dalam bentuk cair (CPO). Jika mengeras: panaskan perlahan ≤60°C sebelum pencampuran. Jangan overheat (>70°C) karena merusak tokoferol dan β-karoten (CPO).',
    },
    penggunaan: {
      fungsiUtama: 'Sumber energi terkonsentrasi paling ekonomis di Indonesia; meningkatkan kepadatan energi ransum; mengurangi debu pakan; meningkatkan palatabilitas dan penampilan pellet.',
      maksPenggunaan: '2–5% ransum (unggas/babi); 2–4% ransum BK (ruminansia)',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi Finisher', 'Sapi Pedaging', 'Sapi Perah', 'Kambing'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan', 'Menyusui'],
      metodePemberian: 'Lelehkan CPO (>35°C) sebelum pencampuran. Semprotkan ke ransum kering dalam mixer. Untuk pelet: tambahkan dalam molten state sebelum conditioning. Tidak dianjurkan dicampur dalam ransum dingin/padat karena menggumpal.',
      pencampuran: 'Campurkan ke mixer setelah bahan kering bercampur, semprotkan secara merata. Untuk hot-pellet coating: semprotkan setelah pelet keluar dari die. Jangan campurkan langsung dengan air atau larutan berair.',
      catatan: 'Untuk unggas pedaging fase finisher: penambahan CPO 3–4% meningkatkan efisiensi pakan (FCR) 5–8% dan menghemat biaya ransum 3–5%. Kombinasi CPO + minyak ikan (1:1) memberikan energi tinggi + omega-3 seimbang untuk ransum broiler premium. Panaskan CPO sebelum digunakan jika disimpan di suhu rendah.',
    },
    harga: {
      estimasiAI: 13500, hargaMarketplace: 13000,
      satuan: 'per liter (as-fed)',
      supplier: 'PKS setempat (CPO); distributor minyak nabati pakan; toko bahan pakan besar',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024). Palm oil. INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.',
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'Tangendjaja, B. (2009). Utilization of palm products in poultry feeds. Proc. 4th AAAP Animal Science Congress, Brisbane.',
        'Zinn, R.A. & Plascencia, A. (1993). Effects of forage level on the comparative feeding value of supplemental fat. J. Anim. Sci. 71:1330–1336.',
      ],
      sumberData: 'Profil asam lemak mengacu pada Feedipedia (2024) dan analisis IOPRI (Indonesian Oil Palm Research Institute). ME dihitung dari kecernaan lemak sawit pada unggas (Tangendjaja, 2009). β-karoten mengacu pada MPOB (Malaysian Palm Oil Board, 2023).',
      catatan: 'Gunakan CPO atau RBDPO yang fresh (FFA <5%) untuk kualitas terbaik. CPO dengan FFA >7% mengindikasikan kualitas rendah (rancid) dan dapat mengurangi palatabilitas. Selalu cek FFA dan angka peroksida dari supplier.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌴', text: 'Minyak sawit adalah sumber energi paling murah yang tersedia luas di Indonesia. Pada unggas: setiap 1% penambahan minyak sawit meningkatkan ME ransum ±80 kcal/kg — setara menambah energi 50 g jagung per kg pakan dengan biaya lebih rendah. Satu pabrik ayam broiler 100.000 ekor menghemat Rp 15–25 juta/batch dengan optimasi lemak sawit.' },
      { type: 'kelebihan', icon: '✅', text: 'CPO mengandung tokotrienol (isoform Vitamin E) dengan potensi anti-oksidan 50–70× lebih kuat dari tokoferol konvensional. Pada broiler: CPO 2–3% mengurangi oksidasi lemak daging (TBARS) dan meningkatkan masa simpan produk. β-Karoten CPO (500–700 ppm) sebagai prekursor Vitamin A mengurangi kebutuhan vitamin A tambahan 20–30%.' },
      { type: 'kombinasi', icon: '🔗', text: 'Blending optimal untuk broiler: minyak sawit (2.5%) + minyak kedelai (0.5%) untuk menyediakan energi tinggi + LA (asam linoleat esensial). Untuk sapi perah: minyak sawit (1.5%) + kalsium soap (bypass fat 1%) = strategi fat supplementation optimal yang meningkatkan milk energy intake tanpa mengganggu fermentasi rumen.' },
      { type: 'peringatan', icon: '⚠️', text: 'Total lemak ransum unggas tidak boleh melebihi 8–10% — risiko lemak berlebih menyebabkan perlemakan hati (fatty liver syndrome) pada petelur dan menurunkan konversi pakan. Monitoring BCS (body condition score) penting jika minyak sawit >4% ransum. Pertahankan rasio lemak jenuh:tak jenuh <3:1 untuk kesehatan kardiovaskular ternak.' },
    ],
  },

  // ── 12. Minyak Jagung ───────────────────────────────────────────────────────
  'minyak-jagung': {
    asal: 'Diekstraksi dari lembaga (germ) jagung selama proses wet milling atau dry milling industri jagung. Di Indonesia: pabrik tepung jagung (maizena) dan ethanol berbasis jagung.',
    sumber: 'Ekstraksi lembaga jagung (±7–8% dari biji jagung) melalui pengepresan atau ekstraksi solvent. Produk utama industri pengolahan jagung bersama tepung jagung dan gluten feed.',
    bentukFisik: 'Minyak kuning keemasan, cair pada suhu ruang (titik beku sekitar -18°C — tidak membeku di suhu tropis).',
    warna: 'Kuning keemasan',
    aroma: 'Ringan khas minyak nabati, hampir tidak berbau setelah refining',
    kelebihan: 'Sangat kaya asam linoleat (LA, C18:2 n-6 omega-6): 54–62% — asam lemak esensial untuk unggas dan babi; tinggi tokoferol (vitamin E alami) 20–40 mg/100g; tidak membeku di suhu tropis; ME sangat tinggi; meningkatkan kecernaan nutrisi; PUFA tinggi mendukung produksi telur (egg yolk yang kaya PUFA).',
    kekurangan: 'Harga lebih mahal dari minyak sawit; kandungan PUFA tinggi lebih mudah teroksidasi (rancid) — umur simpan lebih pendek; tidak ada omega-3 (ALA sangat rendah <2%); perlu antioksidan tambahan untuk penyimpanan >3 bulan; ketergantungan impor jagung untuk produksinya.',
    nutrisi: {
      bk: 99.5, kadarAir: 0.5,
      pk: 0.0, sk: 0.0, lk: 99.5, abu: 0.01, betn: 0.49,
      tdn: null, me: 8350,
      kadarGula: null,
      asamLemakUtama: 'Linoleat (C18:2 n-6): 54–62% | Oleat (C18:1 n-9): 24–32% | Palmitat (C16:0): 8–12% | Stearat (C18:0): 2–4% | Linolenat (C18:3 n-3, ALA): 0.5–2.0% | Omega-6:Omega-3 rasio ±30–60:1',
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      vitamin: 'α-Tokoferol (Vit E): 20–40 mg/100g (tinggi); γ-Tokoferol lebih dominan; total tokoferol 80–120 mg/100g',
      catatanNutrisi: 'ME unggas (AME): ~8.700–9.000 kcal/kg. ME ruminansia: ~8.200–8.500 kcal/kg. PUFA tinggi meningkatkan kebutuhan antioksidan ransum. Kadar LA yang sangat tinggi menjadikan minyak jagung sumber asam lemak esensial terbaik untuk unggas. Sumber: Feedipedia (2024), NRC Poultry (1994).',
    },
    fisik: {
      ph: 'Tidak relevan (minyak)',
      beratJenis: '0.917–0.925 kg/L (20°C)',
      viskositas: '50–70 cP (20°C)',
      kelarutan: 'Tidak larut dalam air; larut dalam pelarut organik',
      stabilitasPenyimpanan: 'Lebih mudah teroksidasi dari minyak sawit/kelapa karena PUFA tinggi. Umur simpan 3–6 bulan tanpa antioksidan. Tambahkan BHA/BHT 200 ppm atau tokoferol alami untuk memperpanjang hingga 12 bulan.',
      umurSimpan: '3–6 bulan tanpa antioksidan; 9–12 bulan dengan antioksidan (kemasan tertutup)',
      kondisiPenyimpanan: 'Drum tertutup, suhu sejuk (<30°C), terlindung cahaya UV. Nitrogen blanket dianjurkan untuk penyimpanan >3 bulan. Periksa angka peroksida setiap 1–2 bulan.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber energi terkonsentrasi dan asam lemak esensial (LA/omega-6) untuk unggas dan babi. Meningkatkan kualitas kuning telur (yolk enrichment). Sumber vitamin E alami.',
      maksPenggunaan: '2–5% ransum unggas; 2–4% ransum babi; 1–3% ransum ruminansia',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi Starter', 'Babi Finisher'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      metodePemberian: 'Campurkan ke ransum kering dalam mixer. Dapat dipakai sebagai pellet coating. Untuk layer: penambahan 2–3% meningkatkan ukuran kuning telur dan warna yolk (lebih kuning keemasan).',
      pencampuran: 'Campurkan setelah bahan kering homogen. Tambahkan antioksidan (BHA/BHT 100–200 ppm atau rosemary extract) bersamaan saat mencampurkan minyak ke ransum.',
      catatan: 'Untuk ayam petelur: minyak jagung 2–3% meningkatkan produksi telur 2–5% dan berat telur 1–3 g/butir. Pertimbangkan penambahan etoksikuin atau tokoferol 200 IU/kg ke ransum yang mengandung minyak jagung untuk mencegah rancidity dan encephalomalacia (defisiensi Vit E). Jangan gunakan minyak jagung yang sudah bau tengik (angka peroksida >20 meq/kg).',
    },
    harga: {
      estimasiAI: 22000, hargaMarketplace: 21000,
      satuan: 'per liter (as-fed)',
      supplier: 'Pabrik tepung jagung/maizena; importir minyak nabati; distributor bahan pakan premium',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024). Corn oil, maize oil. INRA-CIRAD-AFZ-FAO.',
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'Lesson, S. & Summers, J.D. (2001). Nutrition of the Chicken, 4th Ed. University Books.',
        'Cabel, M.C. & Waldroup, P.W. (1990). Effect of dietary crude fat level on performance of broiler chickens. Poult. Sci. 69:1311–1315.',
      ],
      sumberData: 'Profil asam lemak mengacu pada Feedipedia (2024) dan USDA nutrient database (corn oil). ME dihitung dari True Metabolizable Energy (TME) untuk unggas (Lesson & Summers, 2001).',
      catatan: 'Minyak jagung yang diimpor dapat bervariasi kualitasnya. Selalu verifikasi: FFA <0.5%, peroxida value <5 meq/kg, warna sesuai standar Lovibond. Minyak jagung dengan FFA tinggi mengindikasikan kualitas rendah dan mengurangi palatabilitas.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🌽', text: 'Asam linoleat (LA, 54–62%) dalam minyak jagung adalah asam lemak esensial yang tidak bisa disintesis unggas dan babi. LA dibutuhkan untuk: integritas membran sel (fosfolipid), sintesis arachidonate (AA, prekursor prostaglandin), kualitas kuning telur, dan perkembangan janin. Defisiensi LA pada ayam: penurunan produksi dan ukuran telur 15–20%, gangguan pertumbuhan bulu.' },
      { type: 'kelebihan', icon: '✅', text: 'Tokoferol alami minyak jagung (80–120 mg/100g total) adalah antioksidan alami yang melindungi PUFA dari oksidasi in vivo. Pada broiler: minyak jagung 2–3% mengurangi oksidasi daging (TBARS) dan meningkatkan masa simpan daging beku 2–3 minggu dibanding ransum tanpa suplemen Vit E. Lebih alami dan economical dari tokoferol sintetis.' },
      { type: 'peringatan', icon: '⚠️', text: 'Rasio omega-6:omega-3 minyak jagung sangat tinggi (30–60:1) — penggunaan eksklusif minyak jagung tanpa sumber omega-3 (minyak ikan, flaxseed) menghasilkan produk ternak (daging, telur) dengan rasio n-6:n-3 yang buruk untuk kesehatan konsumen manusia. Kombinasikan dengan minyak ikan 0.3–0.5% untuk memperbaiki rasio.' },
      { type: 'kombinasi', icon: '🔗', text: 'Formula minyak optimal untuk ayam petelur: minyak jagung (2%) + minyak ikan (0.3%) + vitamin E 200 IU/kg = energi tinggi + LA esensial + omega-3 (DHA ke kuning telur) + antioksidan. Telur yang dihasilkan mengandung 2× lebih banyak DHA (enriched eggs) yang bernilai jual lebih tinggi.' },
    ],
  },

  // ── 13. Minyak Kedelai ──────────────────────────────────────────────────────
  'minyak-kedelai': {
    asal: 'Produk samping ekstraksi protein kedelai (SBM). Pabrik pengolahan kedelai di Indonesia dan impor dari Amerika Selatan (Brasil, Argentina) — produsen terbesar kedelai dunia.',
    sumber: 'Diekstraksi dari biji kedelai (Glycine max) melalui pengepresan atau ekstraksi heksan selama proses produksi tepung kedelai (SBM). ±18–20% dari berat kedelai kering adalah minyak.',
    bentukFisik: 'Minyak kuning muda hingga kuning tua, cair pada suhu ruang. Tidak membeku di suhu tropis.',
    warna: 'Kuning muda hingga kuning tua',
    aroma: 'Ringan khas kedelai; hampir tidak berbau setelah refining',
    kelebihan: 'Kaya PUFA (asam linoleat LA + linolenat ALA): total >60%; sumber ALA (omega-3, C18:3 n-3) terbaik di antara minyak nabati umum (5–10%); ME sangat tinggi; membantu meningkatkan rasio omega-6:omega-3 yang lebih baik dari minyak jagung/sawit; mudah tersedia karena bersumber dari industri SBM Indonesia.',
    kekurangan: 'ALA mudah teroksidasi (highly unsaturated); umur simpan lebih pendek dari minyak sawit/kelapa; kandungan n-6:n-3 masih cukup tinggi (5–7:1); lebih mahal dari minyak sawit; rantai n-3 (ALA) sebagian besar tidak efisien dikonversi ke EPA/DHA di tubuh ternak — tidak setara minyak ikan.',
    nutrisi: {
      bk: 99.5, kadarAir: 0.5,
      pk: 0.0, sk: 0.0, lk: 99.5, abu: 0.01, betn: 0.49,
      tdn: null, me: 8300,
      kadarGula: null,
      asamLemakUtama: 'Linoleat (C18:2 n-6, LA): 51–57% | Oleat (C18:1 n-9): 22–25% | Linolenat (C18:3 n-3, ALA): 6–10% | Palmitat (C16:0): 9–12% | Stearat (C18:0): 3–5% | Omega-6:Omega-3 rasio ±6–8:1',
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      vitamin: 'Tokoferol total: 100–150 mg/100g; γ-Tokoferol dominan; Vitamin K1: 18–20 μg/100g',
      catatanNutrisi: 'ME ruminansia: ~8.100 kcal/kg. ME unggas (AME): ~8.500–8.700 kcal/kg. Rasio n-6:n-3 ±7:1 lebih baik dari minyak jagung (30–60:1) dan minyak sawit (tidak ada n-3). ALA konversi ke EPA/DHA sangat rendah pada unggas (<1%) dan ruminansia (5–15% di jaringan). Sumber: Feedipedia (2024), NRC (2012).',
    },
    fisik: {
      ph: 'Tidak relevan (minyak)',
      beratJenis: '0.919–0.925 kg/L (20°C)',
      viskositas: '50–60 cP (20°C)',
      kelarutan: 'Tidak larut dalam air; larut dalam pelarut organik',
      stabilitasPenyimpanan: 'Rentan oksidasi karena PUFA tinggi (LA + ALA). Umur simpan 2–4 bulan tanpa antioksidan. Dengan antioksidan (tokoferol/BHT): 9–12 bulan. Nilai peroksida naik cepat setelah kemasan dibuka.',
      umurSimpan: '2–4 bulan tanpa antioksidan; 9–12 bulan dengan antioksidan',
      kondisiPenyimpanan: 'Drum tertutup, suhu <25°C, terlindung cahaya. Nitrogen blanket dianjurkan. Periksa peroxide value setiap bulan (batas: <5 meq/kg untuk kualitas baik, >20 meq/kg tidak layak pakai).',
    },
    penggunaan: {
      fungsiUtama: 'Sumber energi tinggi dan PUFA (LA + ALA) untuk ransum unggas, babi, dan ruminansia. Pilihan terbaik jika ingin menyediakan omega-3 dari sumber nabati untuk meningkatkan kualitas produk ternak.',
      maksPenggunaan: '2–5% ransum unggas/babi; 1–3% ransum ruminansia',
      targetTernak: ['Ayam Broiler', 'Ayam Petelur', 'Babi Starter', 'Babi Finisher', 'Sapi Pedaging'],
      programCocok: ['Penggemukan', 'Grower', 'Indukan'],
      metodePemberian: 'Campurkan ke ransum kering dalam mixer. Tambahkan antioksidan bersamaan. Untuk ransum petelur: 2–3% meningkatkan ukuran dan kandungan ALA kuning telur.',
      pencampuran: 'Campurkan setelah bahan kering homogen. Tambahkan BHT atau etoksikuin 100–200 ppm saat pencampuran untuk mencegah rancidity dalam ransum.',
      catatan: 'Minyak kedelai yang sudah rancid (bau tengik, peroxide >20 meq/kg) JANGAN digunakan — menurunkan palatabilitas ransum, merusak vitamin larut lemak, dan menyebabkan oksidasi jaringan ternak (defisiensi fungsional Vit E). Selalu gunakan minyak kedelai segar atau dengan antioksidan yang terverifikasi.',
    },
    harga: {
      estimasiAI: 19500, hargaMarketplace: 18500,
      satuan: 'per liter (as-fed)',
      supplier: 'Importir minyak nabati; pabrik SBM dengan unit ekstraksi minyak; distributor bahan pakan',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024). Soybean oil. INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.',
        'NRC (2012). Nutrient Requirements of Swine, 11th Rev. Ed.',
        'NRC (1994). Nutrient Requirements of Poultry, 9th Rev. Ed.',
        'Stahly, T.S. (1984). Use of fats in diets for growing pigs. In Fats in Animal Nutrition (J. Wiseman ed.). Butterworths, London.',
      ],
      sumberData: 'Profil asam lemak mengacu pada Feedipedia (2024) soybean oil dan analisis USDA nutrient database. ME dihitung dari energi bruto × kecernaan (NRC Swine 2012, NRC Poultry 1994). Tokoferol mengacu pada USDA.',
      catatan: 'Minyak kedelai industri (crude, degummed, atau RBD) tersedia dalam beberapa grade. Untuk pakan ternak: degummed soybean oil sudah cukup baik. Periksa kandungan fosfatida (gums) — jika >0.5% menunjukkan kualitas penghilangan gum yang kurang baik.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🫘', text: 'Minyak kedelai adalah sumber nabati omega-3 (ALA) paling mudah didapat di Indonesia, meskipun efisiensi konversi ALA → EPA/DHA sangat terbatas. Untuk unggas: hanya <1% ALA dikonversi ke DHA. Namun ALA sendiri berperan dalam membran sel dan menurunkan respons inflamasi, bermanfaat untuk ternak dengan stres kronik.' },
      { type: 'kelebihan', icon: '✅', text: 'Rasio n-6:n-3 minyak kedelai (6–8:1) jauh lebih baik dari minyak jagung (30–60:1) dan minyak sawit (tidak ada n-3). Untuk ransum broiler: menggantikan 50% minyak jagung dengan minyak kedelai meningkatkan rasio n-6:n-3 daging dari 15:1 ke 8:1, lebih mendekati rekomendasi nutrisi manusia (5:1 atau lebih baik).' },
      { type: 'kombinasi', icon: '🔗', text: 'Kombinasi terbaik untuk kualitas daging/telur: minyak kedelai (1.5%) + minyak ikan (0.5%) = n-6:n-3 rasio mendekati ideal; energi tinggi; DHA dari ikan langsung bioavailable ke jaringan. Kombinasi ini menghasilkan telur kaya omega-3 dengan DHA 2–3× lebih tinggi dari telur biasa.' },
      { type: 'peringatan', icon: '⚠️', text: 'Oksidasi minyak kedelai menghasilkan malondialdehid (MDA) dan produk oksidasi PUFA lain yang pro-inflamasi. Ransum dengan minyak kedelai rancid meningkatkan kadar stres oksidatif ternak, menurunkan imunitas, dan menguras vitamin E jaringan. Monitoring peroxide value WAJIB — jangan pakai minyak >20 meq peroxide/kg.' },
    ],
  },

  // ── 14. Minyak Ikan ─────────────────────────────────────────────────────────
  'minyak-ikan': {
    asal: 'Industri pengolahan ikan: pabrik tepung ikan (fish meal) di Sumatera Utara (Sibolga), Jawa Timur, NTB (Lombok), NTT. Minyak ikan adalah by-product rendering ikan pelagis (lemuru, teri, layang, pindang) dan proses pembuatan fish meal.',
    sumber: 'Diekstraksi selama proses rendering (pemasakan dan pengepresan) ikan utuh atau bagian ikan (kepala, jeroan, tulang) dari industri pengalengan dan pengolahan ikan. Minyak ikan crude kemudian dimurnikan untuk pakan ternak.',
    bentukFisik: 'Minyak kuning-coklat kemerahan, cair pada suhu ruang. Berat jenis sedikit berbeda antar spesies sumber.',
    warna: 'Kuning keemasan hingga coklat kemerahan (tergantung sumber ikan dan proses refining)',
    aroma: 'Khas bau ikan yang kuat — ini adalah karakteristik utama yang membatasi penggunaan dalam ransum produk susu/telur konsumsi premium',
    kelebihan: 'Satu-satunya sumber EPA (C20:5 n-3) dan DHA (C22:6 n-3) siap pakai (long-chain omega-3) untuk ternak — langsung terdeposit ke jaringan; mendukung fungsi reproduksi dan kekebalan; ME sangat tinggi; vitamin A dan D tersedia; terbukti meningkatkan produksi telur, daya tetas, dan kualitas semen pada ternak jantan.',
    kekurangan: 'Bau ikan kuat — transfer flavor ke produk susu, telur, dan daging jika berlebih; sangat mudah teroksidasi (PUFA sangat tidak jenuh); harga mahal; kualitas bervariasi tergantung sumber ikan dan proses; potensi kontaminasi logam berat (Hg, Cd) dari laut tercemar; bukan sumber yang berkelanjutan (ketersediaan ikan pelagis fluktuatif).',
    nutrisi: {
      bk: 99.5, kadarAir: 0.5,
      pk: 0.0, sk: 0.0, lk: 99.5, abu: 0.01, betn: 0.49,
      tdn: null, me: 8100,
      kadarGula: null,
      asamLemakUtama: 'EPA (C20:5 n-3): 10–18% | DHA (C22:6 n-3): 8–15% | DPA (C22:5 n-3): 2–5% | Oleat (C18:1 n-9): 8–18% | Palmitat (C16:0): 10–20% | Palmitoleat (C16:1 n-7): 5–10% | Total omega-3 LC-PUFA: 25–35%',
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      vitamin: 'Vitamin A: 2.500–5.000 IU/g (tinggi); Vitamin D3: 200–500 IU/g; Vitamin E: rendah — perlu suplementasi antioksidan',
      catatanNutrisi: 'ME ruminansia: ~8.100 kcal/kg. ME unggas (AME): ~8.700 kcal/kg. Kandungan EPA+DHA sangat bervariasi (15–30%) tergantung spesies ikan dan musim. Minyak ikan dari lemuru/sardine Indonesia: EPA+DHA ±25–30%. Vitamin A dan D tinggi — pertimbangkan total asupan vitamin larut lemak. Sumber: Sargent (1997), Feedipedia (2024).',
    },
    fisik: {
      ph: 'Tidak relevan (minyak)',
      beratJenis: '0.912–0.925 kg/L (20°C)',
      viskositas: '60–100 cP (20°C, lebih kental dari minyak nabati karena PUFA sangat panjang)',
      kelarutan: 'Tidak larut dalam air; larut dalam pelarut organik',
      stabilitasPenyimpanan: 'SANGAT RENTAN OKSIDASI karena kandungan PUFA sangat tinggi (EPA, DHA sangat tidak jenuh). Tanpa antioksidan: rusak dalam 2–4 minggu setelah kemasan dibuka. Wajib tambah etoksikuin (500–1000 ppm) atau BHT (200 ppm) + nitrogen blanket.',
      umurSimpan: '1–3 bulan tanpa antioksidan; 6–12 bulan dengan antioksidan memadai dan kemasan tertutup',
      kondisiPenyimpanan: 'Drum tertutup, suhu <15°C (ideal refrigerasi untuk jangka panjang). Nitrogen blanket SANGAT dianjurkan. Periksa angka peroksida setiap 2–4 minggu. Jangan simpan bersama oksidator atau katalis oksidasi (besi, tembaga).',
    },
    penggunaan: {
      fungsiUtama: 'Sumber EPA dan DHA langsung (long-chain omega-3) untuk meningkatkan kualitas reproduksi, kekebalan, perkembangan otak dan retina anak ternak, serta enrichment produk (telur omega-3, daging omega-3).',
      maksPenggunaan: '0.5–2% ransum (unggas); 0.5–1.5% ransum (babi); 1–3% ransum (akuakultur); 1–2% BK ransum (ruminansia indukan)',
      targetTernak: ['Ayam Petelur', 'Ayam Broiler (finisher)', 'Induk Sapi Perah', 'Induk Kambing', 'Ikan Budidaya', 'Babi Induk'],
      programCocok: ['Indukan', 'Bunting', 'Menyusui', 'Pejantan'],
      metodePemberian: 'Campurkan ke ransum dalam jumlah kecil dengan dibantu emulsifier (lesitin kedelai 0.1–0.2%) untuk distribusi merata. Tambahkan etoksikuin/BHT bersamaan. Jangan gunakan untuk ransum unggas petelur premium >1% — transfer flavor ke kuning telur.',
      pencampuran: 'Campurkan paling terakhir dengan bahan cair lain. Selalu sertakan antioksidan. Gunakan segera setelah batch dibuat — jangan simpan ransum jadi yang mengandung minyak ikan >24 jam.',
      catatan: 'BATASAN FLAVOR: pada ayam petelur >0.5–1%: telur berbau ikan (tidak dapat dijual premium). Pada sapi perah >1% BK: susu berbau ikan. Untuk produk enriched: gunakan dosis terendah yang efektif (0.3–0.5%). Untuk indukan: flavor bukan masalah, gunakan 1.5–2%. Periksa kadar Hg, Cd, Pb dari supplier untuk keamanan pangan rantai produk.',
    },
    harga: {
      estimasiAI: 28000, hargaMarketplace: 27000,
      satuan: 'per liter (as-fed)',
      supplier: 'Pabrik tepung ikan (Sumatera Utara, Jawa Timur, NTB); importir minyak ikan dari Chile/Peru; distributor akuakultur',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Sargent, J.R. (1997). Fish oils and human diet. British J. Nutrition 78(Suppl 1):S5-S13.',
        'NRC (2011). Nutrient Requirements of Fish and Shrimp. National Academy Press.',
        'Feedipedia (2024). Fish oil. INRA-CIRAD-AFZ-FAO Animal Feed Resources Information System.',
        'Schroeder, J.P., Becker, K. & Kloas, W. (2010). Analysis of fish oil fatty acid compositions. Rev. Aquaculture 2:1–12.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
      ],
      sumberData: 'Profil EPA/DHA mengacu pada Feedipedia (2024) dan Sargent (1997). Vitamin A/D mengacu pada analisis minyak ikan lemuru Indonesia (BPPL, Muara Baru). ME dihitung dari kecernaan lemak omega-3 pada ruminansia (NRC Dairy 2001).',
      catatan: 'Minyak ikan dari Indonesia (lemuru, teri) umumnya kaya EPA+DHA total 25–30%. Minyak ikan dari perairan tropis berbeda dari minyak ikan cod liver (Eropa). Selalu minta COA mencakup: total omega-3, EPA, DHA, peroxide value, anisidin value, dan analisis logam berat (Hg <0.1 ppm untuk feed grade).',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🐟', text: 'Minyak ikan adalah satu-satunya sumber EPA dan DHA dalam bentuk siap pakai (langsung terdeposit ke jaringan tanpa konversi). DHA esensial untuk: perkembangan retina dan otak anak ternak, motilitas sperma, membran sel ovum, dan sintesis prostaglandin reproduksi. Pada induk sapi perah yang diberi minyak ikan 2% BK: pregnancy rate meningkat 8–12% dan kematian embrio dini turun 30%.' },
      { type: 'kelebihan', icon: '✅', text: 'Telur omega-3 enriched (minyak ikan 0.3–0.5% ransum petelur): DHA kuning telur meningkat dari 30–60 mg menjadi 150–300 mg/butir — label "Omega-3 Eggs" dapat dijual 2–3× harga telur biasa. Pada ternak jantan: DHA meningkatkan motilitas sperma dan integritas DNA sperma, meningkatkan fertility rate 5–10%.' },
      { type: 'peringatan', icon: '⚠️', text: 'Oksidasi minyak ikan menghasilkan aldehid dan keton berantai panjang yang sangat toksik untuk hepatosit dan sel epitel saluran cerna. Minyak ikan rancid (peroxide >20 meq/kg + anisidin >5) dalam ransum menyebabkan: penurunan konsumsi pakan, lesi hati, defisiensi fungsional Vit E, dan penurunan imunitas. Selalu gunakan antioksidan (etoksikuin 500 ppm atau natural rosemary extract).' },
      { type: 'kombinasi', icon: '🔗', text: 'Sinergis terbaik: minyak ikan (EPA/DHA) + vitamin E 300 IU/kg + selenium 0.3 ppm = trio antioksidan-omega3. EPA/DHA membutuhkan antioksidan untuk proteksi in vivo. Untuk enriched egg: minyak ikan 0.4% + lin seed meal 5% (sumber ALA) + vitamin E = profil omega-3 lengkap dengan ALA+EPA+DHA. Hindari kombinasi dengan Cu tinggi (katalis oksidasi).' },
    ],
  },

  // ── 15. Gliserol ────────────────────────────────────────────────────────────
  'gliserol': {
    asal: 'Pabrik biodiesel berbahan baku minyak kelapa sawit: Sumatera (Riau, Sumatera Utara), Kalimantan, Jawa. Indonesia adalah produsen biodiesel terbesar ASEAN — gliserol crude (crude glycerol) tersedia berlimpah sebagai by-product.',
    sumber: 'Hasil samping (by-product) proses transesterifikasi minyak nabati (sawit, kedelai) atau lemak hewani menjadi biodiesel (FAME — Fatty Acid Methyl Ester). Setiap 9 L biodiesel menghasilkan 1 L gliserol crude. Crude glycerol: 80–88% gliserol + 7–12% metanol (harus diuapkan) + garam + air. Refined glycerol: kemurnian >99.5%.',
    bentukFisik: 'Cairan kental, sedikit lebih berat dari air. Crude: coklat gelap/hitam karena pigmen dan kontaminan sawit. Refined: tidak berwarna, sangat jernih.',
    warna: 'Crude glycerol: coklat tua hingga hitam; Refined: tidak berwarna jernih',
    aroma: 'Crude: bau khas biodiesel/sabun ringan; Refined: tidak berbau/sedikit manis',
    kelebihan: 'Sumber energi glucogenic sangat efisien — dimetabolisme di hati menjadi glukosa melalui glukoneogenesis (phosphorylation → DHAP → glukosa); sangat efektif mencegah ketosis pada sapi perah awal laktasi; berat jenis tinggi (1.24–1.26 kg/L) = energi lebih per liter; harga murah karena by-product biodiesel; tersedia berlimpah di Indonesia.',
    kekurangan: 'Crude glycerol mengandung metanol residu yang toksik — harus diuapkan sebelum digunakan (metanol <0.2% untuk feed grade); palatabilitas kurang baik (pahit-manis, aroma biodiesel) — perlu adaptasi ternak; crude glycerol bervariasi kualitasnya antar batch; tidak menyediakan asam amino, serat, atau mineral; bukan sumber energi untuk rumen (tidak difermentasi rumen secara efisien).',
    nutrisi: {
      bk: 89.0, kadarAir: 11.0,
      pk: 0.0, sk: 0.0, lk: 0.0, abu: 4.0, betn: 96.0,
      tdn: 62.0, me: 1860,
      kadarGula: null,
      asamLemakUtama: 'Tidak mengandung asam lemak (bukan minyak/lemak — gliserol adalah alkohol trihidrik yang larut air)',
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      vitamin: 'Tidak mengandung vitamin',
      catatanNutrisi: 'Nilai ME as-fed (crude glycerol ~89% BK): ~1.660 kcal/kg as-fed. ME per kg BK gliserol murni: ~3.600 kcal/kg. TDN tidak representatif untuk gliserol. Gliserol dimetabolisme via glukoneogenesis di hati, bukan via fermentasi rumen VFA. Crude glycerol: kadar gliserol aktual 80–88%, residu metanol harus <0.2% untuk feed grade. Sumber: NRC (2001), Feedipedia (2024).',
    },
    fisik: {
      ph: '5.0–7.5 (crude); 6.5–7.5 (refined)',
      beratJenis: '1.24–1.26 kg/L (crude); 1.261 kg/L (refined, 25°C)',
      viskositas: '950–1.500 cP (25°C, crude); 1.412 cP (refined, 25°C) — sangat kental',
      kelarutan: 'Larut sempurna dalam air dan etanol; tidak larut dalam minyak/lemak (hidrofil)',
      stabilitasPenyimpanan: 'Stabil secara kimia untuk jangka panjang (tidak teroksidasi, tidak mudah fermentasi). Crude glycerol: simpan terpisah dari sumber panas (titik nyala 160°C). Hindari kontaminasi bakteri (Clostridium dapat memfermentasi gliserol menjadi 1,3-PDO dan asam lemak).',
      umurSimpan: '12–24 bulan (dalam tangki tertutup, suhu ruang)',
      kondisiPenyimpanan: 'Tangki tertutup. Suhu ruang. Jauhkan dari sumber api (titik nyala tinggi tapi hindari sebagai tindakan pencegahan). Crude glycerol: pastikan kandungan metanol <0.2% sebelum digunakan.',
    },
    penggunaan: {
      fungsiUtama: 'Sumber energi glukogenik untuk sapi perah periode transisi (3 minggu sebelum hingga 3 minggu setelah partus) untuk mencegah NEB (Negative Energy Balance) dan ketosis. Binder pelet tambahan. Sumber energi alternatif ransum ruminansia.',
      maksPenggunaan: '300–500 mL/hari drench (sapi perah awal laktasi); 5–10% ransum (TMR); max 15% ransum untuk ruminansia',
      targetTernak: ['Sapi Perah (transisi/awal laktasi)', 'Sapi Pedaging', 'Kambing Perah', 'Domba'],
      programCocok: ['Indukan', 'Menyusui'],
      metodePemberian: 'Drench oral: 300 mL/hari selama 10–14 hari pasca partus untuk mencegah ketosis. Campuran TMR: tambahkan hingga 5–10% sebagai sumber energi dan binder. Binder pelet: 2–5% menggantikan molases.',
      pencampuran: 'Mudah dicampur dengan pakan berair/TMR karena larut air. Viskositas tinggi — panaskan ringan (30–40°C) atau encerkan dengan air 1:1 untuk memudahkan penanganan dan pencampuran merata.',
      catatan: 'Crude glycerol HARUS diuji kadar metanol (<0.2%) sebelum digunakan sebagai pakan. Metanol di atas 0.2% menyebabkan intoksikasi ternak (buta, ataksia, kematian). Minta Certificate of Analysis dari produsen biodiesel. Gliserol refined (pharmaceutical/food grade) lebih aman tapi lebih mahal. Adaptasi bertahap diperlukan: mulai dari 3% ransum, tingkatkan perlahan ke dosis target.',
    },
    harga: {
      estimasiAI: 8500, hargaMarketplace: 7500,
      satuan: 'per liter (crude, as-fed)',
      supplier: 'Pabrik biodiesel kelapa sawit (Sumatera, Kalimantan, Jawa); distributor bahan kimia',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'Feedipedia (2024). Glycerol, crude glycerin. INRA-CIRAD-AFZ-FAO.',
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed.',
        'Donkin, S.S. (2008). Glycerol from biodiesel production: the new corn for dairy cattle. Rev. Bras. Zootec. 37:280–286.',
        'DeFrain, J.M. et al. (2004). Feeding glycerol to transition dairy cows: effects on blood metabolites and lactation performance. J. Dairy Sci. 87:4195–4206.',
        'Rémond, B. et al. (2004). Effects of glycerol administration on performance of dairy cows. Anim. Res. 53:453–470.',
      ],
      sumberData: 'Komposisi dan ME mengacu pada Feedipedia (2024) crude glycerol dan Donkin (2008). Efek metabolik mengacu pada DeFrain et al. (2004). Batas metanol mengacu pada regulasi EU feed additive (EC No 767/2009).',
      catatan: 'Kualitas crude glycerol sangat bervariasi antar pabrik biodiesel — kadar gliserol aktual 60–90%, metanol 0–8%, garam 0–8%, air 5–15%. SELALU minta COA mencakup: kadar gliserol, metanol, Na, K, dan pH sebelum digunakan. Crude glycerol dari sawit lebih umum tersedia di Indonesia vs dari kedelai.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '🔬', text: 'Gliserol adalah substrat glukoneogenik efisien: setelah diserap usus, gliserol difosforilasi menjadi gliserol-3-fosfat → DHAP → glukosa di hati. Pada sapi perah awal laktasi (hari 1–21 pasca partus): kebutuhan glukosa susu (laktosa) mencapai 2–3 kg/hari sementara intake energi turun — gliserol 300 mL/hari menyumbang ±200 g glukosa ekstra, mengurangi NEB dan risiko ketosis 40–50%.' },
      { type: 'kelebihan', icon: '✅', text: 'Studi DeFrain et al. (2004): sapi perah yang diberi 1 L gliserol/hari sejak 21 hari prepartus hingga 42 hari postpartus menghasilkan susu 1.9 kg/hari lebih banyak dan BHB (betahydroxybutyrate, penanda ketosis) 40% lebih rendah vs kontrol. Investasi Rp 250–300/kg susu ekstra jauh lebih menguntungkan dari biaya gliserol.' },
      { type: 'peringatan', icon: '⚠️', text: 'METANOL dalam crude glycerol adalah risiko utama. Metanol diserap cepat dan dioksidasi di hati menjadi formaldehid dan format — menyebabkan asidosis metabolik, kebutaan (degenerasi retina), ataksia, dan kematian. Ambang batas keamanan: <0.2% metanol untuk crude glycerol feed grade. Selalu minta analisis metanol sebelum pembelian dan gunakan per batch.' },
      { type: 'kombinasi', icon: '🔗', text: 'Untuk pencegahan ketosis sapi perah: Gliserol 300 mL/hari (hari 0–14 postpartus) + Propilen Glikol 250 mL/hari (hari 7–21 postpartus) = coverage glukogenik selama 3 minggu kritis. Kombinasikan dengan niasin 6–12 g/hari untuk meningkatkan efisiensi glukoneogenesis. Lebih ekonomis dari gliserol atau PG saja.' },
    ],
  },

  // ── 16. Propilen Glikol ─────────────────────────────────────────────────────
  'propilen-glikol': {
    asal: 'Diproduksi industri kimia dari propilen oksida (petrochemical). Importir utama ke Indonesia: China, Korea, AS. Tidak diproduksi secara lokal di Indonesia. Tersedia sebagai produk farmasi veteriner dan bahan kimia industri.',
    sumber: 'Senyawa sintetis (1,2-propanediol) yang diproduksi melalui hidrolisis propilen oksida. Feed/veterinary grade: kemurnian >99%, tidak mengandung kontaminan berbahaya. Berbeda dari gliserol yang merupakan by-product alami — PG adalah bahan sintetis murni.',
    bentukFisik: 'Cairan jernih tidak berwarna, sedikit kental, berat jenis sedikit lebih berat dari air. Tidak memadat pada suhu normal.',
    warna: 'Tidak berwarna, jernih (transparan)',
    aroma: 'Hampir tidak berbau; sedikit aroma manis ringan',
    kelebihan: 'Glucogenic sangat efisien (dimetabolisme menjadi piruvat/propionat di hati → glukosa); kemurnian sangat tinggi dan konsisten (>99%); tidak ada risiko metanol (berbeda dari crude glycerol); palatabilitas sedikit lebih baik dari gliserol; stabil disimpan lama; dosis presisi mudah (liquid yang konsisten); tersedia sebagai produk veteriner bermerek (Propycare, Propylene Glycol BP).',
    kekurangan: 'Harga jauh lebih mahal dari gliserol; 100% impor — rentan fluktuasi kurs; tidak mengandung nutrisi lain (protein, mineral, vitamin); ME per liter lebih rendah dari minyak; tidak efektif untuk unggas/babi (difokuskan untuk ruminansia).',
    nutrisi: {
      bk: 100.0, kadarAir: 0.0,
      pk: 0.0, sk: 0.0, lk: 0.0, abu: 0.0, betn: 100.0,
      tdn: 59.0, me: 1690,
      kadarGula: null,
      asamLemakUtama: 'Tidak mengandung asam lemak (PG adalah alkohol diol C3, bukan lipid)',
      ca: null, p: null, mg: null, na: null, k: null, cl: null, s: null,
      vitamin: 'Tidak mengandung vitamin',
      catatanNutrisi: 'ME 1.690 kcal/kg BK dihitung dari energi metabolis propilen glikol pada ruminansia (glukoneogenik): 1 mol PG (76g) → ~0.7 mol glukosa + 0.3 mol propionat. Pada as-fed: ME ≈ 1.690 kcal/kg (BK 100%). PG tidak difermentasi di rumen dengan efisien — jalur utama metabolisme adalah di dinding rumen (propionat) dan hati (glukoneogenesis). Sumber: NRC (2001), Grummer (1993).',
    },
    fisik: {
      ph: '6.5–7.5 (larutan encer)',
      beratJenis: '1.036 kg/L (20°C)',
      viskositas: '56 cP (20°C); 31 cP (40°C) — lebih encer dari gliserol',
      kelarutan: 'Larut sempurna dalam air, etanol, aseton; bercampur dengan gliserol. Tidak larut dalam minyak. Higroskopik.',
      stabilitasPenyimpanan: 'Sangat stabil — tidak teroksidasi, tidak befermentasi dalam kondisi normal. Umur simpan >24 bulan dalam kemasan tertutup suhu ruang.',
      umurSimpan: '24–36 bulan (kemasan tertutup, suhu ruang)',
      kondisiPenyimpanan: 'Drum/jerigen tertutup, suhu ruang. Hindari kontaminasi air berlebih dan suhu >100°C. Simpan jauh dari pengoksidasi kuat. Tidak mudah terbakar pada suhu normal (titik nyala 99°C).',
    },
    penggunaan: {
      fungsiUtama: 'Terapi dan pencegahan ketosis pada sapi perah periode transisi (awal laktasi). Standar emas (gold standard) dalam manajemen ketosis sapi perah. Sumber energi glukogenik yang dapat diprediksi dan aman.',
      maksPenggunaan: '250–500 mL/hari (drench, terapi ketosis sapi perah); 200–300 mL/hari (pencegahan preventif); max 1 L/hari (terapi akut ketosis berat)',
      targetTernak: ['Sapi Perah (transisi/awal laktasi)', 'Kambing Perah (ketosis)'],
      programCocok: ['Indukan', 'Menyusui'],
      metodePemberian: 'Drench oral (menggunakan drench gun): berikan 250–500 mL/hari per os, 1–2 kali sehari. Untuk pencegahan: mulai 3 hari sebelum partus hingga 14 hari postpartus. Dapat dicampurkan ke TMR (200–300 mL/hari) sebagai suplemen rutin pada sapi risiko tinggi.',
      pencampuran: 'Larut sempurna dalam air — encerkan 1:2 dengan air hangat untuk drench yang lebih mudah ditelan. Dapat dicampur dengan molases (palatabilitas) atau propylene glycol veteriner siap pakai.',
      catatan: 'Dosis >1 L/hari dapat menyebabkan ataksia dan depresi pada beberapa sapi — mulai dari dosis rendah (200 mL) dan tingkatkan. Pastikan sapi tidak dalam kondisi dehidrasi parah sebelum drench. Gunakan produk veterinary grade (TIDAK pharmaceutical grade yang bisa mengandung bahan tambahan berbahaya untuk ternak). Pantau BHB darah target <1.2 mmol/L setelah terapi 5–7 hari.',
    },
    harga: {
      estimasiAI: 24000, hargaMarketplace: 23000,
      satuan: 'per liter (as-fed)',
      supplier: 'Distributor bahan kimia feed grade; toko obat hewan/veteriner; importir kimia industri',
      updatedAt: '10 Jul 2026',
    },
    referensi: {
      literatur: [
        'NRC (2001). Nutrient Requirements of Dairy Cattle, 7th Rev. Ed. National Academy Press.',
        'Grummer, R.R. (1993). Etiology of lipid-related metabolic disorders in periparturient dairy cows. J. Dairy Sci. 76:3882–3896.',
        'Feedipedia (2024). Propylene glycol. INRA-CIRAD-AFZ-FAO.',
        'Nielsen, N.I. & Ingvartsen, K.L. (2004). Propylene glycol for dairy cows: a review of the metabolism of propylene glycol and its effects on physiological parameters, feed intake, milk production and risk of ketosis. Anim. Feed Sci. Technol. 115:191–213.',
      ],
      sumberData: 'Metabolisme dan dosis efektif mengacu pada Nielsen & Ingvartsen (2004) — review komprehensif 30+ studi PG pada sapi perah. ME dihitung berdasarkan Grummer (1993). Fisikokimia mengacu pada spesifikasi USP (United States Pharmacopeia) Propylene Glycol.',
      catatan: 'Selalu gunakan Propylene Glycol USP/BP (veterinary atau food grade), bukan PG industrial yang mungkin mengandung diethylene glycol (DEG) atau etilen glikol (sangat toksik). Verifikasi CoA mencantumkan "1,2-Propanediol" dan kemurnian >99.5%. Hindari produk yang mengklaim PG tapi tidak memiliki CoA dari laboratorium terakreditasi.',
    },
    aiInsight: [
      { type: 'fungsi', icon: '💉', text: 'Propilen Glikol adalah gold standard terapi ketosis klinis pada sapi perah. Mekanisme: PG diserap di epitel rumen → dikonversi hati menjadi piruvat dan laktat → masuk gluconeogenesis → glukosa darah naik dalam 2–4 jam. Pada ketosis klinis (BHB >3 mmol/L): 500 mL PG oral 2×/hari + infus glukosa 50% IV memberikan recovery 85–90% dalam 3–5 hari.' },
      { type: 'kelebihan', icon: '✅', text: 'Dibanding gliserol: PG memiliki kemurnian lebih tinggi (>99.5% vs 80–88%), tidak ada risiko metanol, dan respons glukogenik lebih cepat dan dapat diprediksi. Studi Nielsen & Ingvartsen (2004) dari 32 penelitian: PG 300–500 mL/hari selama 14 hari postpartus mengurangi insiden ketosis subklinis 35–45% dan meningkatkan milk yield 0.8–1.5 kg/hari.' },
      { type: 'kombinasi', icon: '🔗', text: 'Protokol pencegahan ketosis komprehensif: (1) Pakan DCAD negatif 3 minggu prepartus (anionic salts), (2) PG 250 mL/hari 3 hari sebelum partus, (3) PG 500 mL/hari hari 1–7 postpartus, (4) Niasin 6 g/hari + Kolin terlindung 30 g/hari. Program ini mengurangi ketosis dari 20–30% insiden menjadi <5% pada peternakan intensif.' },
      { type: 'peringatan', icon: '⚠️', text: 'Etilen glikol (EG, senyawa serupa PG) SANGAT TOKSIK — dapat menyebabkan gagal ginjal akut dan kematian. Pastikan produk yang dibeli adalah 1,2-PROPANEDIOL (bukan 1,2-ETANEDIOL atau etilen glikol). Keduanya berpenampilan fisik serupa (tidak berwarna, encer). Selalu verifikasi CoA sebelum pembelian, terutama dari pemasok baru.' },
    ],
  },

};

// ─── Accessor ─────────────────────────────────────────────────────────────────

export function getBahanCairDetail(id: string): BahanCairDetailFields | undefined {
  return BAHAN_CAIR_DETAIL[id];
}
