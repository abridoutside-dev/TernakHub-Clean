// ─── Master Pakan — Vitamin & Feed Additive Sub Category ──────────────────────
// MP-032: List data for "Vitamin & Feed Additive" parent category.
// Single raw-material vitamin sources and feed additive ingredients used in
// livestock feed formulation.
// EXCLUDES: Premix Vitamin, Premix Mineral, Vitamin Mix, Feed Additive Mix,
// Complete Feed, Konsentrat, TMR, and all blended/formulation products.

import type { KategoriItem } from './jagungData';
import { KATEGORI_ITEM_STYLE } from './jagungData';
export { KATEGORI_ITEM_STYLE };

export interface VitaminFeedAdditiveItem {
  id: string;
  nama: string;
  namaIlmiah: string | null;   // scientific / IUPAC name
  namaLain: string;            // aliases for search
  deskripsi: string;
  kategoriItem: KategoriItem;
  estimasiHarga: number | null; // IDR/kg
  hargaUpdated: string;
  dataLengkap: boolean;
  updatedAt: string;
}

export const VITAMIN_FEED_ADDITIVE_KATEGORI_ORDER: KategoriItem[] = [
  'Vitamin Larut Lemak',
  'Vitamin Larut Air',
  'Enzim & Mikroba Pakan',
  'Asam Organik & Buffer',
  'Antioksidan & Pelindung',
];

export const VITAMIN_FEED_ADDITIVE_DB: VitaminFeedAdditiveItem[] = [

  // ── Vitamin Larut Lemak ───────────────────────────────────────────────────────

  {
    id: 'vitamin-a',
    nama: 'Vitamin A',
    namaIlmiah: 'Retinol / Retinyl Acetate / Retinyl Palmitate',
    namaLain: 'Retinol, Vitamin A Acetate, Vitamin A Palmitate, Retinyl Acetate, Provitamin A',
    deskripsi: 'Vitamin larut lemak esensial untuk pertumbuhan, penglihatan, reproduksi, dan imunitas ternak. Dalam pakan ternak tersedia sebagai retinyl acetate atau palmitate (feed grade), bukan sebagai retinol murni. Stabilitasnya ditingkatkan dengan enkapsulasi atau coating. Defisiensi menyebabkan kebutaan malam (nyctalopia), penurunan fertilitas, dan peningkatan kerentanan infeksi.',
    kategoriItem: 'Vitamin Larut Lemak',
    estimasiHarga: 850000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'vitamin-d3',
    nama: 'Vitamin D3',
    namaIlmiah: 'Cholecalciferol',
    namaLain: 'Cholecalciferol, Colecalciferol, Vitamin D3 Feed Grade, Animal-Based Vitamin D',
    deskripsi: 'Vitamin D bentuk aktif untuk hewan (kholekalsifereol), berbeda dari Vitamin D2 (ergokalsiferol) yang berasal dari tumbuhan. Mengatur absorpsi Ca dan P di usus, mineralisasi tulang, dan fungsi imun. Esensial untuk unggas dan ruminansia yang tidak terpapar cukup sinar matahari. Defisiensi menyebabkan rachitis (tulang lunak) pada ternak muda dan osteomalasia pada dewasa.',
    kategoriItem: 'Vitamin Larut Lemak',
    estimasiHarga: 1200000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'vitamin-e',
    nama: 'Vitamin E',
    namaIlmiah: 'DL-Alpha-Tocopheryl Acetate',
    namaLain: 'Tocopheryl Acetate, Alpha-Tocopherol, Vitamin E Acetate, DL-α-Tocopheryl Acetate',
    deskripsi: 'Antioksidan biologis utama yang melindungi membran sel dari kerusakan oksidatif. Dalam pakan ternak digunakan sebagai DL-alpha-tocopheryl acetate (lebih stabil dari tocopherol bebas). Esensial untuk fungsi imun, reproduksi (mencegah Encephalomalacia pada unggas), dan kualitas daging (mengurangi lipid oksidasi). Sering digunakan bersama Selenium.',
    kategoriItem: 'Vitamin Larut Lemak',
    estimasiHarga: 180000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'vitamin-k3',
    nama: 'Vitamin K3',
    namaIlmiah: 'Menadione Sodium Bisulfite (MSB)',
    namaLain: 'Menadione, Menadione Sodium Bisulphite, Menadione Bisulfite Complex, MSB, MNB, DMSO',
    deskripsi: 'Vitamin K sintetis (menadion) yang digunakan sebagai sumber vitamin K dalam ransum ternak karena lebih stabil dan murah dibanding K1/K2. Berperan dalam sintesis faktor pembekuan darah (II, VII, IX, X) dan metabolisme tulang. Diberikan sebagai garam bisulfit (MSB) untuk meningkatkan kelarutan. Toksik jika berlebihan — selalu gunakan pada dosis label.',
    kategoriItem: 'Vitamin Larut Lemak',
    estimasiHarga: 95000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Vitamin Larut Air ─────────────────────────────────────────────────────────

  {
    id: 'vitamin-b1',
    nama: 'Vitamin B1 (Thiamin)',
    namaIlmiah: 'Thiamine Mononitrate / Thiamine Hydrochloride',
    namaLain: 'Thiamin, Thiamine, Aneurin, Thiamine Mononitrate, Thiamine HCl, Vitamin B1',
    deskripsi: 'Koenzim esensial dalam metabolisme karbohidrat dan produksi energi (siklus TCA). Hewan tidak dapat mensintesis tiamin; harus disuplai dari pakan. Pada ruminansia, tiamin disintesis oleh mikroba rumen — defisiensi jarang kecuali pada kondisi acidosis rumen (Polioencephalomalacia). Pada unggas dan babi, defisiensi menyebabkan polyneuritis, kehilangan nafsu makan, dan kematian.',
    kategoriItem: 'Vitamin Larut Air',
    estimasiHarga: 75000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'vitamin-b2',
    nama: 'Vitamin B2 (Riboflavin)',
    namaIlmiah: 'Riboflavin',
    namaLain: 'Riboflavin, Laktoflavin, Vitamin G, Vitamin B2, Riboflavine',
    deskripsi: 'Komponen koenzim FMN dan FAD yang esensial dalam rantai respirasi dan metabolisme energi. Tidak dapat disintesis oleh hewan non-ruminansia; harus ditambahkan dalam ransum unggas dan babi. Ruminansia dewasa mendapat pasokan riboflavin dari sintesis mikroba rumen. Defisiensi pada unggas menyebabkan "curled toe paralysis" (kelumpuhan jari melingkar) dan penurunan produksi telur.',
    kategoriItem: 'Vitamin Larut Air',
    estimasiHarga: 110000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'vitamin-b6',
    nama: 'Vitamin B6 (Pyridoxine)',
    namaIlmiah: 'Pyridoxine Hydrochloride',
    namaLain: 'Pyridoxine, Pyridoxal, Pyridoxamine, Vitamin B6, Pyridoxine HCl',
    deskripsi: 'Koenzim dalam lebih dari 100 reaksi metabolik, terutama metabolisme asam amino dan protein. Berperan penting dalam sintesis neurotransmitter, hemoglobin, dan antibodi. Tersedia sebagai pyridoxine hydrochloride (feed grade). Defisiensi pada unggas menyebabkan dermatitis, kejang, dan penurunan pertumbuhan. Ruminansia mensintesis B6 dari mikroba rumen.',
    kategoriItem: 'Vitamin Larut Air',
    estimasiHarga: 85000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'vitamin-b12',
    nama: 'Vitamin B12 (Cobalamin)',
    namaIlmiah: 'Cyanocobalamin / Hydroxocobalamin',
    namaLain: 'Cobalamin, Cyanocobalamin, Vitamin B12, Hydroxocobalamin, Methylcobalamin',
    deskripsi: 'Vitamin yang mengandung kobalt (Co), esensial untuk sintesis DNA, metabolisme asam folat, dan fungsi neurologis. Hanya ditemukan pada sumber hewani atau produk fermentasi mikroba — tidak ada dalam bahan nabati. Penting untuk babi dan unggas dalam ransum berbasis nabati. Ruminansia mensintesis B12 di rumen jika Co tersedia. Defisiensi menyebabkan anemia megaloblastik dan penurunan pertumbuhan.',
    kategoriItem: 'Vitamin Larut Air',
    estimasiHarga: 3500000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'niasin-b3',
    nama: 'Niasin (Vitamin B3)',
    namaIlmiah: 'Nicotinic Acid / Niacinamide',
    namaLain: 'Niacin, Nicotinic Acid, Nicotinamide, Niacinamide, Vitamin B3, Vitamin PP',
    deskripsi: 'Komponen koenzim NAD dan NADP yang terlibat dalam ratusan reaksi redoks dalam metabolisme energi, lipid, dan asam amino. Dapat disintesis dari triptofan, tetapi konversi ini tidak efisien pada unggas. Diperlukan suplementasi eksplisit dalam ransum unggas dan babi. Berperan dalam pencegahan pellagra (dermatitis, diare, demensia). Tersedia sebagai asam nikotinat atau nikotinamida.',
    kategoriItem: 'Vitamin Larut Air',
    estimasiHarga: 35000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'asam-pantotenat',
    nama: 'Asam Pantotenat',
    namaIlmiah: 'D-Pantothenic Acid / Calcium D-Pantothenate',
    namaLain: 'Pantothenic Acid, Calcium Pantothenate, Vitamin B5, D-Pantothenate',
    deskripsi: 'Prekursor koenzim A (CoA), yang esensial dalam metabolisme karbohidrat, lemak, dan protein. Tersedia sebagai kalsium pantotenat (feed grade, lebih stabil). Dibutuhkan oleh semua spesies ternak, terutama unggas dan babi dalam ransum berbasis biji-bijian. Defisiensi menyebabkan "goose-stepping" (gangguan gaya berjalan) pada babi dan dermatitis pada unggas.',
    kategoriItem: 'Vitamin Larut Air',
    estimasiHarga: 55000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'biotin',
    nama: 'Biotin',
    namaIlmiah: 'D-Biotin',
    namaLain: 'Biotin, Vitamin H, Vitamin B7, D-Biotin, Coenzyme R',
    deskripsi: 'Koenzim dalam reaksi karboksilasi, termasuk glukoneogenesis dan sintesis asam lemak. Esensial untuk kesehatan kulit, kuku, dan bulu/rambut ternak. Penting untuk ayam petelur (kualitas kerabang) dan babi (mencegah dermatitis dan retakan telapak kaki). Gandum dan biji rye mengandung faktor anti-biotin (avidin termal tidak stabil; avidin mentah dari putih telur mengikat biotin). Dosis aktif sangat rendah (mg/ton pakan).',
    kategoriItem: 'Vitamin Larut Air',
    estimasiHarga: 4200000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'asam-folat',
    nama: 'Asam Folat',
    namaIlmiah: 'Pteroylglutamic Acid (Folic Acid)',
    namaLain: 'Folic Acid, Folate, Vitamin B9, Pteroylglutamic Acid, Folacin',
    deskripsi: 'Koenzim dalam metabolisme asam amino satu-karbon (sintesis DNA, metionin, kolin). Penting untuk pembelahan sel yang cepat: penting pada unggas fase pertumbuhan dan reproduksi. Berinteraksi erat dengan vitamin B12. Defisiensi menyebabkan anemia megaloblastik, penurunan daya tetas telur, dan cacat neural. Labil terhadap panas dan cahaya — enkapsulasi meningkatkan stabilitas dalam ransum.',
    kategoriItem: 'Vitamin Larut Air',
    estimasiHarga: 180000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'kolin-klorida',
    nama: 'Kolin Klorida',
    namaIlmiah: 'Choline Chloride',
    namaLain: 'Choline Chloride, Kolin, Choline Cl, Bilineurine Chloride',
    deskripsi: 'Nutrien esensial yang berperan dalam sintesis fosfolipid membran (lecithin), transmisi saraf (asetilkolin), dan metabolisme lemak hati (mencegah fatty liver). Digunakan dalam jumlah besar (terbesar di antara vitamin dalam ransum) dan umumnya dihitung terpisah dari vitamin lain. Tersedia sebagai bubuk 50% atau 60% pada carrier silika. Tidak stabil bersama vitamin lain dalam premix — biasanya ditambahkan terpisah.',
    kategoriItem: 'Vitamin Larut Air',
    estimasiHarga: 22000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'asam-askorbat',
    nama: 'Asam Askorbat (Vitamin C)',
    namaIlmiah: 'L-Ascorbic Acid',
    namaLain: 'Ascorbic Acid, Vitamin C, L-Ascorbate, Ascorbate, Sodium Ascorbate, Ascorbyl Phosphate',
    deskripsi: 'Antioksidan larut air dan kofaktor dalam sintesis kolagen, karnitin, dan neurotransmitter. Sebagian besar spesies ternak mensintesis vitamin C sendiri, sehingga kebutuhan suplemen rendah dalam kondisi normal. Suplementasi direkomendasikan pada kondisi stres (panas, transport, penyakit) untuk memperbaiki respons imun dan mengurangi dampak stres termal pada unggas. Tersedia dalam berbagai bentuk: asam askorbat standar, ascorbyl-2-monophosphate (lebih stabil).',
    kategoriItem: 'Vitamin Larut Air',
    estimasiHarga: 28000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Enzim & Mikroba Pakan ─────────────────────────────────────────────────────

  {
    id: 'ragi-yeast',
    nama: 'Ragi / Yeast (Saccharomyces cerevisiae)',
    namaIlmiah: 'Saccharomyces cerevisiae',
    namaLain: 'Brewers Yeast, Active Dry Yeast, Yeast Culture, Ragi Roti, Ragi Tape, Live Yeast, Yeast Fermentate',
    deskripsi: 'Jamur uniseluler yang digunakan sebagai feed additive untuk meningkatkan performa ruminansia dan unggas. Dalam rumen, S. cerevisiae merangsang pertumbuhan bakteri selulolitik, menstabilkan pH rumen, dan meningkatkan kecernaan serat. Pada unggas, meningkatkan respons imun dan memperbaiki integritas usus. Tersedia sebagai yeast culture (sel + media fermentasi) atau active dry yeast. Mengandung mannanoligosaccharide (MOS) dan beta-glucan pada dinding sel.',
    kategoriItem: 'Enzim & Mikroba Pakan',
    estimasiHarga: 65000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'enzim-pakan',
    nama: 'Enzim Pakan',
    namaIlmiah: 'Exogenous Feed Enzyme (NSP-ase)',
    namaLain: 'Feed Enzyme, NSP Enzyme, Carbohydrase, Exogenous Enzyme, Enzim Ekstrinsik, Non-Starch Polysaccharidase',
    deskripsi: 'Enzim ekstrinsik yang mendegradasi Non-Starch Polysaccharide (NSP) — arabinoxilan, beta-glukan, pektin — dalam bahan pakan biji-bijian yang tidak dapat dicerna hewan monogastrik. Berbeda dari fitase, xilanase, dan selulase yang masuk sebagai referensi tersendiri; entri ini mewakili produk enzim pakan komersial berbasis NSP-ase yang dijual sebagai bahan tunggal feed additive. Meningkatkan kecernaan ransum berbasis gandum/rye/barley dan menurunkan viskositas digesta yang menghambat absorpsi nutrien.',
    kategoriItem: 'Enzim & Mikroba Pakan',
    estimasiHarga: 450000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'probiotik',
    nama: 'Probiotik',
    namaIlmiah: 'Lactobacillus spp. / Bacillus spp. / Enterococcus faecium',
    namaLain: 'Probiotic, Direct Fed Microbial (DFM), Viable Microorganism, Lactobacillus, Bacillus subtilis, Microflora Enhancer',
    deskripsi: 'Mikroorganisme hidup yang, jika diberikan dalam jumlah cukup, memberikan manfaat kesehatan pada inang. Dalam pakan ternak bekerja dengan cara: kompetisi pengecualian terhadap patogen (Salmonella, E. coli), produksi asam laktat/propionat yang menurunkan pH usus, modulasi sistem imun mukosa, dan produksi enzim pencernaan. Umum digunakan sebagai alternatif antibiotik growth promoter (AGP). Membutuhkan penyimpanan dingin atau enkapsulasi untuk viabilitas.',
    kategoriItem: 'Enzim & Mikroba Pakan',
    estimasiHarga: 380000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'prebiotik',
    nama: 'Prebiotik',
    namaIlmiah: 'Mannanoligosaccharide (MOS) / Fructooligosaccharide (FOS)',
    namaLain: 'Prebiotic, MOS, FOS, GOS, Mannan Oligosaccharide, Fructooligosaccharide, Galactooligosaccharide, Beta-Glucan',
    deskripsi: 'Substrat selektif yang difermentasi oleh mikrobiota usus untuk memberikan manfaat kesehatan. MOS (dari dinding sel ragi) bekerja dengan mengadsorpsi patogen type-1 fimbriae (Salmonella, E. coli) sehingga mencegah kolonisasi usus. FOS/GOS merangsang pertumbuhan Lactobacillus dan Bifidobacterium (bifidogenic effect). Berbeda dari probiotik — prebiotik adalah bahan kimia/karbohidrat, bukan organisme hidup. Sering dikombinasikan dengan probiotik (sinbiotik).',
    kategoriItem: 'Enzim & Mikroba Pakan',
    estimasiHarga: 520000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'fitase',
    nama: 'Fitase (Phytase)',
    namaIlmiah: 'Phytase (3-phytase / 6-phytase)',
    namaLain: 'Phytase, Phytic Acid Hydrolase, myo-Inositol Hexakisphosphate Phosphohydrolase, Fitase Mikrobial',
    deskripsi: 'Enzim yang menghidrolisis asam fitat (myo-inositol hexaphosphate) — bentuk penyimpanan P pada biji-bijian — menjadi fosfat inorganik yang dapat diserap. Hewan monogastrik (unggas, babi) tidak memiliki fitase endogen; 60–80% P biji-bijian dalam bentuk fitat tidak tersedia. Suplementasi fitase meningkatkan ketersediaan P hingga 25–35%, mengurangi ekskres P feses (ramah lingkungan), dan menurunkan biaya Ca/P suplemen. Tersedia sebagai 3-phytase (Aspergillus niger) atau 6-phytase (E. coli).',
    kategoriItem: 'Enzim & Mikroba Pakan',
    estimasiHarga: 950000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'xilanase',
    nama: 'Xilanase (Xylanase)',
    namaIlmiah: 'Endo-1,4-β-Xylanase',
    namaLain: 'Xylanase, Endo-Xylanase, Hemicellulase, Arabinoxylanase, NSP-ase, Xilanase Mikrobial',
    deskripsi: 'Enzim yang memecah arabinoxylan — NSP utama dalam gandum, rye, barley, dan dedak — yang meningkatkan viskositas digesta dan menghambat penyerapan nutrien pada unggas monogastrik. Penggunaan xilanase pada ransum berbasis gandum menurunkan viskositas usus halus, meningkatkan kecernaan pati dan protein, dan memperbaiki FCR 3–7%. Efektivitas tertinggi pada ransum dengan kandungan gandum/rye >20%. Diproduksi dari Trichoderma, Aspergillus, atau Bacillus.',
    kategoriItem: 'Enzim & Mikroba Pakan',
    estimasiHarga: 720000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'selulase',
    nama: 'Selulase (Cellulase)',
    namaIlmiah: 'Endo-1,4-β-Glucanase (Cellulase Complex)',
    namaLain: 'Cellulase, Beta-Glucanase, Cellulase Complex, Endo-Glucanase, Ekso-Glucanase, Selulase Pakan',
    deskripsi: 'Kompleks enzim (endoglukanase, eksoglukanase, beta-glukosidase) yang mendegradasi selulosa menjadi gula sederhana. Relevan untuk ransum ruminansia berbasis hijauan tinggi serat dan ransum monogastrik berbasis produk samping pertanian. Pada ruminansia bekerja sinergis dengan enzim selulolitik rumen. Efektif memecah beta-glukan dalam barley yang meningkatkan viskositas digesta pada unggas. Diproduksi dari Trichoderma reesei atau Aspergillus spp.',
    kategoriItem: 'Enzim & Mikroba Pakan',
    estimasiHarga: 580000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Asam Organik & Buffer ─────────────────────────────────────────────────────

  {
    id: 'asam-organik',
    nama: 'Asam Organik',
    namaIlmiah: 'Short-Chain Organic Acid Feed Additive',
    namaLain: 'Organic Acid, Asam Format, Formic Acid, Asam Propionat, Propionic Acid, Asam Fumarat, Fumaric Acid, Asam Sitrat, Citric Acid',
    deskripsi: 'Bahan baku tunggal berupa asam organik rantai pendek (SCFA) yang digunakan sebagai pengasam ransum dan pengawet pakan — masing-masing acid adalah satu bahan tunggal tersendiri (bukan campuran). Contoh: asam format (formic acid) untuk pengawet hijauan/silase; asam propionat untuk antijamur biji-bijian; asam fumarat dan sitrat sebagai pengasam ransum unggas yang lebih ramah bahan pakan lain. Mekanisme: menurunkan pH saluran cerna, menghambat patogen (Salmonella, E. coli, Campylobacter), dan meningkatkan aktivitas enzim pencernaan. Setiap jenis asam organik memiliki profil aktivitas dan titik penggunaan yang berbeda.',
    kategoriItem: 'Asam Organik & Buffer',
    estimasiHarga: 85000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'buffer-pakan',
    nama: 'Buffer Pakan',
    namaIlmiah: 'Sodium Bicarbonate / Sodium Sesquicarbonate / Magnesium Oxide',
    namaLain: 'Feed Buffer, Rumen Buffer, Buffer Rumen, Soda Kue, Natrium Bikarbonat, NaHCO3, Sesquicarbonate',
    deskripsi: 'Bahan-bahan alkali yang digunakan untuk menstabilkan pH rumen pada sapi yang diberi ransum kaya karbohidrat fermentable (tinggi biji-bijian). Mencegah Subacute Ruminal Acidosis (SARA) — kondisi pH rumen <5,6 yang menurunkan kecernaan serat dan menyebabkan laminitis, penurunan lemak susu, dan imbalance mikroba rumen. Natrium bikarbonat (NaHCO₃) paling umum digunakan (0,75–1,5% BK ransum). MgO meningkatkan efektivitas buffering dan menyediakan Mg. Perhatian: item ini (buffer rumen) adalah feed additive, berbeda dari NaHCO₃ sebagai sumber mineral yang ada di kategori Mineral.',
    kategoriItem: 'Asam Organik & Buffer',
    estimasiHarga: 4500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Antioksidan & Pelindung ───────────────────────────────────────────────────

  {
    id: 'antioksidan',
    nama: 'Antioksidan',
    namaIlmiah: 'Feed Antioxidant (Lipid Peroxidation Inhibitor)',
    namaLain: 'Antioxidant, Ethoxyquin, BHT, Butylated Hydroxytoluene, BHA, Butylated Hydroxyanisole, TBHQ, Rosemary Extract, Feed Antioxidant',
    deskripsi: 'Bahan baku tunggal yang menghambat oksidasi lemak (lipid peroxidation) dalam bahan pakan dan ransum. Setiap antioksidan adalah satu senyawa tunggal tersendiri: Ethoxyquin (6-ethoxy-1,2-dihydro-2,2,4-trimethylquinoline, paling efektif untuk tepung ikan), BHT (butylated hydroxytoluene, stabilisasi minyak nabati), BHA (butylated hydroxyanisole), TBHQ (tersier butil hidrokinon), atau ekstrak rosemari (sumber alami rosmarinic acid + carnosic acid). Bukan campuran — setiap senyawa ini merupakan bahan feed additive tunggal. Terutama penting untuk bahan tinggi lemak tak jenuh: tepung ikan, minyak nabati, bungkil kedelai. Mencegah ketengikan, kerusakan vitamin larut lemak, dan akumulasi radikal bebas toksik.',
    kategoriItem: 'Antioksidan & Pelindung',
    estimasiHarga: 125000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'toksin-binder',
    nama: 'Toksin Binder (Mycotoxin Binder)',
    namaIlmiah: 'Hydrated Sodium Calcium Aluminosilicate (HSCAS)',
    namaLain: 'Mycotoxin Binder, Toxin Binder, HSCAS, Hydrated Sodium Calcium Aluminosilicate, Smectite Clay, Aflatoxin Binder, Sequestering Agent',
    deskripsi: 'Bahan baku tunggal silikat atau aluminosilikat termodifikasi yang mengikat mikotoksin (terutama aflatoksin) di saluran cerna sehingga mencegah absorpsi ke aliran darah. HSCAS (Hydrated Sodium Calcium Aluminosilicate) adalah toksin binder yang paling terdokumentasi dan disetujui FDA untuk penggunaan pada pakan ternak — berbeda dari bentonit/zeolit umum di kategori Mineral. Aflatoksin — diproduksi Aspergillus flavus pada jagung, kedelai, dan groundnut di kondisi tropis lembap — sangat relevan di Indonesia. Kapasitas ikatan HSCAS: ±90% aflatoksin B1 pada dosis 0,5% ransum. Berbeda dari blend toksin binder atau campuran multi-adsorben.',
    kategoriItem: 'Antioksidan & Pelindung',
    estimasiHarga: 280000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
];

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getVitaminFeedAdditiveList(): VitaminFeedAdditiveItem[] {
  return VITAMIN_FEED_ADDITIVE_DB;
}

export function getVitaminFeedAdditiveById(id: string): VitaminFeedAdditiveItem | undefined {
  return VITAMIN_FEED_ADDITIVE_DB.find(item => item.id === id);
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

export interface VitaminFeedAdditiveRingkasan {
  totalReferensi: number;
  hargaRataRata: number | null;
  terakhirUpdate: string;
  dataLengkap: number;
}

export function computeVitaminFeedAdditiveRingkasan(): VitaminFeedAdditiveRingkasan {
  const items  = getVitaminFeedAdditiveList();
  const priced = items.filter(i => i.estimasiHarga !== null);
  const hargaRataRata = priced.length > 0
    ? Math.round(priced.reduce((sum, i) => sum + i.estimasiHarga!, 0) / priced.length)
    : null;

  const sorted = [...items].sort((a, b) =>
    new Date(b.updatedAt.split(' ').reverse().join('-')).getTime() -
    new Date(a.updatedAt.split(' ').reverse().join('-')).getTime()
  );

  return {
    totalReferensi: items.length,
    hargaRataRata,
    terakhirUpdate: sorted[0]?.updatedAt ?? '—',
    dataLengkap: items.filter(i => i.dataLengkap).length,
  };
}
