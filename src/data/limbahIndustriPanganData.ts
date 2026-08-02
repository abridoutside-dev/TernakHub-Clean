// ─── Master Pakan — Limbah Industri Pangan Sub Category ──────────────────────
// MP-026: List data for "Limbah Industri Pangan" parent category.
// Single raw-material ingredients sourced from food-processing industry waste
// (by-products of starch, grain milling, brewing, soy/tofu, bakery, and
// plantation processing).
// EXCLUDES: Limbah Industri Fermentasi, Complete Feed, Konsentrat, TMR,
// Campuran Limbah Industri, and any multi-ingredient formulas.

import type { KategoriItem } from './jagungData';
import { KATEGORI_ITEM_STYLE } from './jagungData';
export { KATEGORI_ITEM_STYLE };

export interface LimbahIndustriItem {
  id: string;
  nama: string;
  namaLatin: string | null;
  namaLain: string;           // aliases for search
  deskripsi: string;
  kategoriItem: KategoriItem;
  estimasiHarga: number | null; // IDR/kg
  hargaUpdated: string;
  dataLengkap: boolean;
  updatedAt: string;
}

export const LIMBAH_INDUSTRI_KATEGORI_ORDER: KategoriItem[] = [
  'By-product Serealia',
  'Ampas Pati',
  'Ampas Protein Nabati',
  'By-product Brewing',
  'Ampas Bakeri & Pasta',
  'Ampas Perkebunan',
];

export const LIMBAH_INDUSTRI_DB: LimbahIndustriItem[] = [

  // ── By-product Serealia ──────────────────────────────────────────────────────
  {
    id: 'pollard-gandum',
    nama: 'Pollard Gandum',
    namaLatin: null,
    namaLain: 'Wheat Pollard, Middlings Kasar, Wheat Feed',
    deskripsi: 'By-product penggilingan gandum berupa campuran dedak kasar, kulit ari, dan sedikit endosperm. Protein ±14–16% BK, serat ±10%, TDN ±70%. Banyak tersedia dari industri tepung terigu; palatabilitas baik untuk ruminansia dan babi.',
    kategoriItem: 'By-product Serealia',
    estimasiHarga: 3200,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'wheat-bran',
    nama: 'Wheat Bran (Dedak Gandum)',
    namaLatin: null,
    namaLain: 'Dedak Gandum, Bran Gandum',
    deskripsi: 'Lapisan luar biji gandum yang terpisah saat penggilingan tepung. Protein ±15% BK, serat kasar ±11%, fosfor tinggi (±1% BK). Sumber fosfor nabati yang baik; kandungan fitat perlu diperhatikan pada unggas.',
    kategoriItem: 'By-product Serealia',
    estimasiHarga: 3000,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'wheat-middlings',
    nama: 'Wheat Middlings',
    namaLatin: null,
    namaLain: 'Shorts Gandum, Middlings, Red Dog',
    deskripsi: 'Fraksi penggilingan gandum antara bran dan tepung, mengandung lebih banyak endosperm dibanding pollard. Protein ±16–18% BK, pati ±30%, TDN ±73%. Nilai nutrisi lebih tinggi dari pollard; cocok untuk sapi perah dan babi.',
    kategoriItem: 'By-product Serealia',
    estimasiHarga: 3500,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'hominy-feed',
    nama: 'Hominy Feed',
    namaLatin: null,
    namaLain: 'Corn Hominy Feed, Limbah Giling Jagung',
    deskripsi: 'By-product wet-milling atau dry-milling jagung: campuran kulit, lembaga, dan sedikit endosperm jagung. Protein ±10% BK, lemak ±5%, TDN ±75%. Kandungan energi relatif tinggi karena lembaga kaya lemak; alternatif jagung yang hemat biaya.',
    kategoriItem: 'By-product Serealia',
    estimasiHarga: 3800,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'corn-gluten-feed',
    nama: 'Corn Gluten Feed (CGF)',
    namaLatin: null,
    namaLain: 'CGF, Corn Feed Meal, Gluten Feed Jagung',
    deskripsi: 'By-product wet-milling jagung: campuran bran jagung dan steep liquor (air rendaman). Protein ±21% BK, serat ±9%, TDN ±78%. Sumber protein dan energi ekonomis; palatabilitas baik, tersedia dalam bentuk basah atau kering.',
    kategoriItem: 'By-product Serealia',
    estimasiHarga: 4500,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'corn-gluten-meal',
    nama: 'Corn Gluten Meal (CGM)',
    namaLatin: null,
    namaLain: 'CGM, Gluten Meal Jagung, Corn Protein Meal',
    deskripsi: 'Fraksi protein tinggi dari wet-milling jagung setelah pemisahan pati. Protein ±60% BK, TDN ±85%, xantofil tinggi (pigmentasi kuning telur/daging unggas). Sumber protein berkonsentrasi tinggi; digunakan sebagai substitusi bungkil kedelai dalam ransum unggas.',
    kategoriItem: 'By-product Serealia',
    estimasiHarga: 8500,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'ddgs',
    nama: 'DDGS (Dried Distillers Grains with Solubles)',
    namaLatin: null,
    namaLain: 'Distillers Dried Grains, Ampas Etanol Jagung',
    deskripsi: 'By-product produksi etanol dari jagung: ampas fermentasi kering + cairan terkonsentrasi. Protein ±26–30% BK, lemak ±10%, serat NDF ±40%. Sumber protein dan energi medium; ketersediaan di Indonesia tergantung impor, harga fluktuatif.',
    kategoriItem: 'By-product Serealia',
    estimasiHarga: 5200,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },

  // ── Ampas Pati ───────────────────────────────────────────────────────────────
  {
    id: 'onggok-tapioka',
    nama: 'Onggok Tapioka',
    namaLatin: null,
    namaLain: 'Onggok, Cassava Pulp, Ampas Singkong, Tapioca Waste',
    deskripsi: 'Ampas padat sisa ekstraksi pati singkong di pabrik tapioka. Protein sangat rendah (±2% BK), pati residu ±60–65% BK, serat ±12% BK, TDN ±75%. Sumber energi pati yang murah; harus difermentasi atau dikombinasi sumber protein untuk ransum seimbang.',
    kategoriItem: 'Ampas Pati',
    estimasiHarga: 1200,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'ampas-tapioka',
    nama: 'Ampas Tapioka',
    namaLatin: null,
    namaLain: 'Tapioca Waste, Limbah Pati Singkong',
    deskripsi: 'Sisa penggilingan singkong skala rumah tangga atau industri kecil, berbeda dari onggok industri besar dalam hal ukuran partikel dan kadar air. Kandungan mirip onggok; kadar air tinggi (±80%) sehingga mudah rusak — harus segera digunakan atau difermentasi.',
    kategoriItem: 'Ampas Pati',
    estimasiHarga: 800,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'ampas-sagu',
    nama: 'Ampas Sagu',
    namaLatin: 'Metroxylon sagu Rottb.',
    namaLain: 'Sago Waste, Limbah Pati Sagu, Ampas Sagu Basah',
    deskripsi: 'Sisa ekstraksi pati dari batang sagu. Protein sangat rendah (±1.5% BK), pati residu ±50% BK, serat tinggi ±30% BK. Tersedia berlimpah di sentra sagu (Maluku, Papua, Kalimantan); harus dikombinasi sumber protein dan mineral untuk ransum ruminansia.',
    kategoriItem: 'Ampas Pati',
    estimasiHarga: 700,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },

  // ── Ampas Protein Nabati ──────────────────────────────────────────────────────
  {
    id: 'ampas-tahu',
    nama: 'Ampas Tahu',
    namaLatin: null,
    namaLain: 'Tofu Waste, Okara, Soy Pulp',
    deskripsi: 'Sisa padat proses pembuatan tahu dari kedelai. Protein ±25–28% BK, serat ±18% BK, lemak ±12% BK. Sumber protein ekonomis berlimpah di sentra tahu; kadar air sangat tinggi (±80%) — harus segera dipakai atau difermentasi untuk mencegah pembusukan.',
    kategoriItem: 'Ampas Protein Nabati',
    estimasiHarga: 1500,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'ampas-tempe',
    nama: 'Ampas Tempe',
    namaLatin: null,
    namaLain: 'Tempeh Waste, Sisa Kedelai Tempe',
    deskripsi: 'Sisa kedelai dari proses pembuatan tempe yang tidak terpakai (kulit ari, kedelai rusak, sisa perebusan). Protein ±22% BK, lebih mudah dicerna dari kedelai mentah karena proses perebusan. Ketersediaan terbatas; cocok sebagai suplemen protein lokal.',
    kategoriItem: 'Ampas Protein Nabati',
    estimasiHarga: 1800,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'ampas-kecap',
    nama: 'Ampas Kecap',
    namaLatin: null,
    namaLain: 'Soy Sauce Waste, Kecap Residue',
    deskripsi: 'Ampas padat sisa fermentasi dan filtrasi kedelai pada produksi kecap. Protein ±30–35% BK (terkonsentrasi pasca ekstraksi cairan), garam tinggi (NaCl ±5–8% BK). Nilai protein tinggi tetapi kadar garam perlu diperhatikan — batasi penggunaannya dan sediakan air minum cukup.',
    kategoriItem: 'Ampas Protein Nabati',
    estimasiHarga: 2000,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },

  // ── By-product Brewing ────────────────────────────────────────────────────────
  {
    id: 'brewers-grain',
    nama: "Brewer's Grain / Ampas Bir",
    namaLatin: null,
    namaLain: "Spent Grain, Ampas Brewery, Grains Bir, Brewer's Spent Grain",
    deskripsi: 'Sisa padat malt barley setelah ekstraksi gula pada proses pembuatan bir. Protein ±22–28% BK, serat NDF ±50%, lemak ±7% BK. Sumber protein dan serat yang baik untuk ruminansia; tersedia dalam kondisi basah (kadar air ±80%) — mudah rusak, harus segera digunakan atau disilase.',
    kategoriItem: 'By-product Brewing',
    estimasiHarga: 1800,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'spent-yeast',
    nama: 'Ragi Roti Bekas (Spent Yeast)',
    namaLatin: 'Saccharomyces cerevisiae',
    namaLain: 'Spent Yeast, Ragi Bekas, Yeast Waste, Brewer\'s Yeast',
    deskripsi: 'Biomassa khamir sisa industri roti atau bir. Protein ±40–50% BK (protein sel tunggal), vitamin B kompleks sangat tinggi, β-glukan imunostimulan. Sumber protein premium dan vitamin B alami; meningkatkan palatabilitas ransum. Perlu pengeringan untuk stabilitas penyimpanan.',
    kategoriItem: 'By-product Brewing',
    estimasiHarga: 6000,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },

  // ── Ampas Bakeri & Pasta ──────────────────────────────────────────────────────
  {
    id: 'ampas-roti',
    nama: 'Ampas Roti',
    namaLatin: null,
    namaLain: 'Bread Waste, Sisa Roti, Roti Afkir',
    deskripsi: 'Sisa produksi atau roti afkir dari industri bakeri. Pati ±50–60% BK, protein ±10%, lemak ±5–10%, TDN ±80%. Sumber energi berkualitas tinggi dan palatabilitas sangat baik. Kandungan garam bervariasi; perlu dikeringkan atau digiling untuk kemudahan penyimpanan dan pemberian.',
    kategoriItem: 'Ampas Bakeri & Pasta',
    estimasiHarga: 2500,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'ampas-biskuit',
    nama: 'Ampas Biskuit',
    namaLatin: null,
    namaLain: 'Biscuit Waste, Sisa Produksi Biskuit, Biskuit Afkir',
    deskripsi: 'Sisa produksi, remahan, atau biskuit afkir dari industri snack/bakeri. Energi sangat tinggi — pati + lemak + gula memberikan TDN ±85%. Palatabilitas luar biasa; kandungan gula dan lemak tinggi — batasi penggunaan maksimal 15–20% ransum untuk menghindari gangguan pencernaan ruminansia.',
    kategoriItem: 'Ampas Bakeri & Pasta',
    estimasiHarga: 3000,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'ampas-mi',
    nama: 'Ampas Mi',
    namaLatin: null,
    namaLain: 'Noodle Waste, Sisa Produksi Mi, Mi Afkir',
    deskripsi: 'Sisa produksi atau mi afkir dari industri mi instan maupun mi basah. Pati ±55–65% BK, protein ±10–12%, lemak ±15–20% (mi goreng/instan). Perhatikan kadar garam dan bumbu pada mi instan afkir — cuci terlebih dahulu atau batasi penggunaan untuk menghindari kelebihan natrium.',
    kategoriItem: 'Ampas Bakeri & Pasta',
    estimasiHarga: 2800,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },

  // ── Ampas Perkebunan ──────────────────────────────────────────────────────────
  {
    id: 'ampas-cokelat',
    nama: 'Ampas Cokelat',
    namaLatin: 'Theobroma cacao L.',
    namaLain: 'Cocoa Pulp Residue, Ampas Kakao, Cocoa Waste',
    deskripsi: 'Ampas cair manis dari pulpa biji kakao setelah fermentasi atau pemisahan biji. Karbohidrat mudah tercerna, asam organik, aroma menarik. Berbeda dari kulit pod dan biji kakao — pulpa ampas relatif aman dan sangat disukai ternak. Ketersediaan bersifat musiman mengikuti panen kakao.',
    kategoriItem: 'Ampas Perkebunan',
    estimasiHarga: 1500,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'ampas-kelapa',
    nama: 'Ampas Kelapa',
    namaLatin: 'Cocos nucifera L.',
    namaLain: 'Coconut Meal Wet, Desiccated Coconut Waste, Sisa Parutan Kelapa',
    deskripsi: 'Sisa penggilingan kelapa setelah ekstraksi santan pada industri makanan. Protein ±5% BK, lemak residu ±10–20% BK, serat ±35% BK. Berbeda dari bungkil kopra (produk press minyak); tersedia segar dari industri santan UHT dan restoran. Kadar air sangat tinggi — gunakan segera atau keringkan.',
    kategoriItem: 'Ampas Perkebunan',
    estimasiHarga: 1000,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'ampas-kopi',
    nama: 'Ampas Kopi',
    namaLatin: 'Coffea spp.',
    namaLain: 'Coffee Grounds, Spent Coffee, Sisa Kopi, Coffee Pulp',
    deskripsi: 'Ampas padat setelah penyeduhan atau pengolahan kopi, atau pulpa biji kopi dari proses wet-processing. Protein ±10–16% BK, kafein ±1–2% (bisa mempengaruhi metabolisme ternak). Batasi penggunaan ≤3% ransum; kafein berlebih dapat menyebabkan kegelisahan dan penurunan produksi. Aman untuk ruminansia dalam jumlah moderat.',
    kategoriItem: 'Ampas Perkebunan',
    estimasiHarga: 500,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
  {
    id: 'ampas-teh',
    nama: 'Ampas Teh',
    namaLatin: 'Camellia sinensis (L.) Kuntze',
    namaLain: 'Tea Waste, Spent Tea, Sisa Teh, Tea Grounds',
    deskripsi: 'Ampas daun teh setelah proses penyeduhan atau pengolahan industri teh. Protein ±15–20% BK, tanin ±10–15% BK (antinutrisi utama), serat tinggi. Tanin mengurangi kecernaan protein secara signifikan — kombinasi dengan PEG (polyethylene glycol) atau molases dapat menetralisir tanin. Batasi ≤5% ransum.',
    kategoriItem: 'Ampas Perkebunan',
    estimasiHarga: 800,
    hargaUpdated: '09 Jul 2026',
    dataLengkap: true,
    updatedAt: '09 Jul 2026',
  },
];

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getLimbahIndustriList(): LimbahIndustriItem[] {
  return LIMBAH_INDUSTRI_DB;
}

export function getLimbahIndustriById(id: string): LimbahIndustriItem | undefined {
  return LIMBAH_INDUSTRI_DB.find(item => item.id === id);
}

export interface LimbahIndustriRingkasan {
  totalReferensi: number;
  hargaRataRata: number | null;
  terakhirUpdate: string;
  dataLengkap: number;
}

export function computeLimbahIndustriRingkasan(): LimbahIndustriRingkasan {
  const items = getLimbahIndustriList();
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
