// ─── Master Pakan — Sumber Protein Hewani Sub Category ───────────────────────
// MP-028: List data for "Sumber Protein Hewani" parent category.
// Single raw-material ingredients derived from animals or animal-industry
// by-products used as livestock feed.
// EXCLUDES: Fermented animal protein products, Complete Feed, Konsentrat, TMR,
// mixed animal protein blends, and any multi-ingredient formulas.

import type { KategoriItem } from './jagungData';
import { KATEGORI_ITEM_STYLE } from './jagungData';
export { KATEGORI_ITEM_STYLE };

export interface SumberProteinHewaniItem {
  id: string;
  nama: string;
  namaLatin: string | null;
  namaLain: string;           // aliases for search
  deskripsi: string;
  kategoriItem: KategoriItem;
  estimasiHarga: number | null; // IDR/kg (whole product unless noted)
  hargaUpdated: string;
  dataLengkap: boolean;
  updatedAt: string;
}

export const SUMBER_PROTEIN_HEWANI_KATEGORI_ORDER: KategoriItem[] = [
  'Tepung Ikan & Hasil Laut',
  'Tepung Daging & Jeroan',
  'Produk Unggas & Bulu',
  'Produk Perairan Lokal',
  'Produk Susu & Telur',
];

export const SUMBER_PROTEIN_HEWANI_DB: SumberProteinHewaniItem[] = [

  // ── Tepung Ikan & Hasil Laut ─────────────────────────────────────────────────
  {
    id: 'tepung-ikan',
    nama: 'Tepung Ikan (Fish Meal)',
    namaLatin: 'Engraulis sp. / Decapterus sp.',
    namaLain: 'Fish Meal, TI, Tepung Ikan Lokal, Tepung Ikan Impor',
    deskripsi: 'Produk kering dari pengolahan ikan utuh atau sisa industri pengalengan ikan. Protein ±60–65% BK, lisina tinggi ±4–5% BK, metionin ±1,7% BK, TDN ±75%. Sumber protein hewani paling umum dan seimbang dalam ransum unggas, babi, dan ikan budidaya.',
    kategoriItem: 'Tepung Ikan & Hasil Laut',
    estimasiHarga: 9500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'tepung-teri',
    nama: 'Tepung Teri (Anchovy Meal)',
    namaLatin: 'Stolephorus sp.',
    namaLain: 'Anchovy Meal, Tepung Ikan Teri, Anchovy Fish Meal',
    deskripsi: 'Tepung dari ikan teri kering giling — fraksi khusus bermutu tinggi dari tepung ikan. Protein ±58–62% BK, asam amino esensial lengkap, Ca ±3% BK. Palatabilitas superior untuk unggas dan babi; sering dipakai sebagai "attractor" pada pakan starter.',
    kategoriItem: 'Tepung Ikan & Hasil Laut',
    estimasiHarga: 10000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'tepung-rebon',
    nama: 'Tepung Rebon',
    namaLatin: 'Acetes sp.',
    namaLain: 'Shrimp Powder, Dried Rebon, Tepung Udang Rebon',
    deskripsi: 'Tepung dari udang rebon kecil kering — by-product industri terasi dan ebi. Protein ±50–55% BK, kitin ±5–8% BK (menurunkan kecernaan sedikit), Ca ±5% BK dari cangkang. Sumber protein dan mineral lokal yang terjangkau.',
    kategoriItem: 'Tepung Ikan & Hasil Laut',
    estimasiHarga: 8000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'tepung-udang',
    nama: 'Tepung Udang (Shrimp Meal)',
    namaLatin: 'Penaeus vannamei / Penaeus monodon',
    namaLain: 'Shrimp Meal, Tepung Udang Windu, Shrimp By-product Meal',
    deskripsi: 'By-product industri pengolahan udang: kepala, cangkang, dan ekor udang budidaya yang dikeringkan dan digiling. Protein ±38–45% BK, kitin ±15–20% BK, Ca ±7–10% BK. Kandungan kitin tinggi membatasi kecernaan; efektif pada ransum ikan dan udang.',
    kategoriItem: 'Tepung Ikan & Hasil Laut',
    estimasiHarga: 7000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'tepung-cumi',
    nama: 'Tepung Cumi (Squid Meal)',
    namaLatin: 'Loligo sp. / Todarodes pacificus',
    namaLain: 'Squid Meal, Squid By-product Meal, Cuttlefish Meal',
    deskripsi: 'Tepung dari sisa pengolahan cumi: kepala, tentakel, kulit, dan jeroan cumi. Protein ±55–60% BK, taurin tinggi, asam amino esensial seimbang. Palatabilitas sangat baik sebagai "feed attractant" pada pakan ikan dan udang; harga relatif tinggi.',
    kategoriItem: 'Tepung Ikan & Hasil Laut',
    estimasiHarga: 12000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'tepung-kepiting',
    nama: 'Tepung Kepiting (Crab Meal)',
    namaLatin: 'Portunus pelagicus / Scylla sp.',
    namaLain: 'Crab Meal, Kepiting Tepung, Crab By-product Meal',
    deskripsi: 'By-product industri pengolahan kepiting dan rajungan: cangkang, capit, dan sisa daging. Protein ±35–40% BK, kitin ±20–25% BK, Ca ±10–15% BK dari cangkang. Digunakan terutama dalam ransum udang dan ikan; berfungsi sebagai sumber mineral dan protein.',
    kategoriItem: 'Tepung Ikan & Hasil Laut',
    estimasiHarga: 6500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'silase-ikan',
    nama: 'Silase Ikan (Fish Silage)',
    namaLatin: null,
    namaLain: 'Fish Silage, Asam Ikan, Fermented Fish By-product',
    deskripsi: 'Produk fermentasi asam dari ikan segar atau sisa ikan menggunakan asam organik (asam format, propionat) atau bakteri asam laktat. Protein ±50–55% BK (as-fed ±10–12%), sangat mudah dicerna. Murah dan cocok untuk ternak babi dan ikan; penyimpanan lebih mudah dari tepung ikan.',
    kategoriItem: 'Tepung Ikan & Hasil Laut',
    estimasiHarga: 3500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Tepung Daging & Jeroan ────────────────────────────────────────────────────
  {
    id: 'tepung-daging',
    nama: 'Tepung Daging (Meat Meal)',
    namaLatin: null,
    namaLain: 'Meat Meal, MM, Rendered Meat Meal',
    deskripsi: 'Produk rendering daging dan jaringan lunak hewan (sapi, babi, unggas) dengan kandungan tulang minimal. Protein ±50–55% BK, lisina ±3% BK, Ca ±1–2% BK. Sumber protein dan energi baik; kualitas bervariasi tergantung bahan baku dan proses rendering.',
    kategoriItem: 'Tepung Daging & Jeroan',
    estimasiHarga: 10000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'meat-bone-meal',
    nama: 'Tepung Daging & Tulang (MBM)',
    namaLatin: null,
    namaLain: 'Meat and Bone Meal, MBM, Tepung Daging Tulang',
    deskripsi: 'By-product rendering gabungan daging dan tulang hewan ternak. Protein ±45–50% BK, Ca ±9–11% BK, P ±4–5% BK — sumber mineral makro yang signifikan. Dilarang untuk ruminansia di banyak negara (risiko BSE); aman untuk unggas dan babi.',
    kategoriItem: 'Tepung Daging & Jeroan',
    estimasiHarga: 8000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'tepung-tulang',
    nama: 'Tepung Tulang (Bone Meal)',
    namaLatin: null,
    namaLain: 'Bone Meal, Steamed Bone Meal, Tepung Tulang Kukus',
    deskripsi: 'Tulang hewan yang dikukus/dipres dan digiling menjadi tepung. Protein rendah ±10–15% BK, Ca ±25–30% BK, P ±12–14% BK (P tersedia baik). Digunakan terutama sebagai suplemen mineral Ca dan P dalam ransum, bukan sumber protein utama.',
    kategoriItem: 'Tepung Daging & Jeroan',
    estimasiHarga: 5000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'tepung-darah',
    nama: 'Tepung Darah (Blood Meal)',
    namaLatin: null,
    namaLain: 'Blood Meal, BM, Dried Blood Meal, Ring-dried Blood Meal',
    deskripsi: 'Darah segar dari rumah potong hewan yang dikeringkan. Protein sangat tinggi ±80–85% BK — tertinggi di antara sumber protein hewani komersial. Lisina ±8% BK. Palatabilitas buruk; batasi ≤5% ransum dan campur bahan lain. Digestibilitas bervariasi tergantung metode pengeringan.',
    kategoriItem: 'Tepung Daging & Jeroan',
    estimasiHarga: 12000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Produk Unggas & Bulu ─────────────────────────────────────────────────────
  {
    id: 'tepung-bulu-hidrolisis',
    nama: 'Tepung Bulu Hidrolisis (Hydrolyzed Feather Meal)',
    namaLatin: null,
    namaLain: 'Hydrolyzed Feather Meal, HFM, Feather Meal, Tepung Bulu Ayam',
    deskripsi: 'Bulu unggas yang dihidrolisis dengan panas dan tekanan tinggi (autoklaf) lalu dikeringkan. Protein ±75–80% BK namun kaya sistin dan rendah lisina/metionin/triptofan. Kecernaan protein bervariasi ±50–75% — sangat bergantung kualitas hidrolisis. Gunakan ≤5% ransum dan imbangi dengan sumber lisina.',
    kategoriItem: 'Produk Unggas & Bulu',
    estimasiHarga: 8500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'tepung-unggas',
    nama: 'Tepung Unggas (Poultry By-product Meal)',
    namaLatin: null,
    namaLain: 'Poultry By-product Meal, PBM, Poultry Meal, Tepung Ayam',
    deskripsi: 'By-product rendering unggas: kepala, kaki, usus, dan organ dalam yang tidak dikonsumsi manusia. Protein ±55–60% BK, lemak ±10–14% BK, Ca ±3% BK. Profil asam amino lebih seimbang dari tepung bulu; palatabilitas sedang-baik. Kualitas sangat bergantung bahan baku dan rendering.',
    kategoriItem: 'Produk Unggas & Bulu',
    estimasiHarga: 8000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Produk Perairan Lokal ─────────────────────────────────────────────────────
  {
    id: 'tepung-keong-mas',
    nama: 'Tepung Keong Mas',
    namaLatin: 'Pomacea canaliculata',
    namaLain: 'Golden Snail Meal, Tepung Siput Murbei, Keong Mas Giling',
    deskripsi: 'Keong mas (hama sawah) dikeringkan dan digiling. Protein ±45–50% BK, Ca ±6–8% BK dari cangkang, lisina ±3,5% BK. Bahan baku melimpah dan murah dari sawah; perlu dikeringkan dulu untuk mengurangi parasit. Cocok untuk unggas, babi, dan ikan budidaya.',
    kategoriItem: 'Produk Perairan Lokal',
    estimasiHarga: 4500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'tepung-bekicot',
    nama: 'Tepung Bekicot',
    namaLatin: 'Achatina fulica',
    namaLain: 'African Giant Snail Meal, Bekicot Kering, Giant African Land Snail Meal',
    deskripsi: 'Bekicot darat dikeringkan dan digiling. Protein ±50–55% BK, Ca ±5–7% BK, profil asam amino cukup baik. Sumber protein alternatif lokal berbiaya rendah — sering dipanen sebagai pengendalian hama di kebun. Perlu direbus/dikukus dulu untuk inaktivasi parasit sebelum dikeringkan.',
    kategoriItem: 'Produk Perairan Lokal',
    estimasiHarga: 5500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'tepung-cacing',
    nama: 'Tepung Cacing (Earthworm Meal)',
    namaLatin: 'Lumbricus rubellus / Eisenia fetida',
    namaLain: 'Earthworm Meal, Tepung Cacing Tanah, Vermi Meal',
    deskripsi: 'Cacing tanah dikeringkan dan digiling. Protein ±60–65% BK, profil asam amino setara tepung ikan, lizozim alami sebagai antibakteri. Harga tinggi karena belum diproduksi massal; sangat efektif sebagai bahan suplemen premium untuk unggas petelur dan ikan ornamental.',
    kategoriItem: 'Produk Perairan Lokal',
    estimasiHarga: 20000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Produk Susu & Telur ───────────────────────────────────────────────────────
  {
    id: 'whey-bubuk',
    nama: 'Whey Bubuk (Dried Whey)',
    namaLatin: null,
    namaLain: 'Dried Whey, Sweet Whey Powder, Whey Powder, Whey Kering',
    deskripsi: 'Cairan sisa pengolahan keju yang dikeringkan. Protein ±11–13% BK, laktosa ±70–75% BK (sumber energi cepat), mineral baik. Sangat palatable — meningkatkan konsumsi ransum. Efektif untuk anak babi prasapih dan ternak muda; laktosa tinggi harus dikurangi bertahap untuk ternak dewasa.',
    kategoriItem: 'Produk Susu & Telur',
    estimasiHarga: 13000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'susu-bubuk-afkir',
    nama: 'Susu Bubuk Afkir',
    namaLatin: null,
    namaLain: 'Rejected Milk Powder, Susu Bubuk Reject, Off-grade Milk Powder',
    deskripsi: 'Susu bubuk yang tidak memenuhi standar konsumsi manusia (kadar lemak, warna, atau tanggal kadaluarsa). Protein ±30–34% BK (full cream) atau ±35–37% BK (skim), laktosa ±35–50% BK, lemak 1–28% BK. Sumber nutrisi lengkap berkualitas tinggi dengan harga lebih terjangkau dari susu bubuk standar.',
    kategoriItem: 'Produk Susu & Telur',
    estimasiHarga: 9000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'kolostrum-bubuk',
    nama: 'Kolostrum Bubuk (Colostrum Powder)',
    namaLatin: null,
    namaLain: 'Colostrum Powder, Bovine Colostrum, Dried Colostrum',
    deskripsi: 'Kolostrum sapi yang dikeringkan — mengandung IgG ±18–25%, protein ±35–40% BK, growth factor (IGF-1, EGF), dan laktoferin. Digunakan terutama untuk ternak neonatus yang gagal mendapat kolostrum induk. Harga premium; efek utama pada imunitas dan pertumbuhan awal pedet/anak babi/anak kambing.',
    kategoriItem: 'Produk Susu & Telur',
    estimasiHarga: 25000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'telur-afkir',
    nama: 'Telur Afkir (Rejected Eggs)',
    namaLatin: null,
    namaLain: 'Rejected Eggs, Telur Reject, Off-grade Eggs, Infertile Eggs',
    deskripsi: 'Telur ayam ras/petelur yang tidak lolos grading (retak, kotor, infertil, telur hatcher reject). Protein ±47% BK (as-fed ±13%), lemak ±42% BK, nilai biologis protein sangat tinggi. Biasanya diberikan dalam bentuk segar rebus untuk anak babi, anjing, dan unggas. Harus dimasak untuk mencegah Salmonella.',
    kategoriItem: 'Produk Susu & Telur',
    estimasiHarga: 1800,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'tepung-telur',
    nama: 'Tepung Telur (Dried Egg)',
    namaLatin: null,
    namaLain: 'Dried Whole Egg, Egg Powder, Whole Egg Powder, Tepung Telur Ayam',
    deskripsi: 'Telur utuh yang dipasteurisasi dan dikeringkan. Protein ±45–48% BK, lemak ±40–43% BK, nilai biologis protein tertinggi di antara semua sumber protein pakan. Sangat palatabel. Digunakan sebagai standar referensi protein dalam nutrisi ternak; mahal untuk ransum massal tetapi ideal sebagai suplemen starter.',
    kategoriItem: 'Produk Susu & Telur',
    estimasiHarga: 18000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'kasein',
    nama: 'Kasein (Casein)',
    namaLatin: null,
    namaLain: 'Casein, Sodium Caseinate, Acid Casein, Kasein Sapi',
    deskripsi: 'Protein utama susu sapi yang diisolasi melalui pengasaman atau koagulasi enzimatis. Protein ±85–90% BK — sumber protein murni tertinggi dari produk susu. Sangat mahal; digunakan terutama dalam penelitian nutrisi sebagai sumber protein referensi atau pada ransum khusus hewan laboratorium.',
    kategoriItem: 'Produk Susu & Telur',
    estimasiHarga: 28000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
];

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getSumberProteinHewaniList(): SumberProteinHewaniItem[] {
  return SUMBER_PROTEIN_HEWANI_DB;
}

export function getSumberProteinHewaniById(id: string): SumberProteinHewaniItem | undefined {
  return SUMBER_PROTEIN_HEWANI_DB.find(item => item.id === id);
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

export interface SumberProteinHewaniRingkasan {
  totalReferensi: number;
  hargaRataRata: number | null;
  terakhirUpdate: string;
  dataLengkap: number;
}

export function computeSumberProteinHewaniRingkasan(): SumberProteinHewaniRingkasan {
  const items  = getSumberProteinHewaniList();
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
