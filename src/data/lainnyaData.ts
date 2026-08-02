// ─── Master Pakan — Lainnya Sub Category ───────────────────────────────────────
// MP-036: List data for "Lainnya" parent category.
// Single raw-material ingredients that do not belong to any other Master Pakan
// category but are used as feed or feed-support materials in livestock nutrition.
//
// EXCLUDES:
//   Konsentrat, Premix, Mineral Mix, Vitamin Mix, Feed Additive Mix,
//   Complete Feed, TMR, Silase, Hay, Fermentasi, Produk Komersial,
//   Campuran Formula — semua termasuk hasil formulasi atau modul Produk Komersial.

import type { KategoriItem } from './jagungData';
import { KATEGORI_ITEM_STYLE } from './jagungData';
export { KATEGORI_ITEM_STYLE };

export interface LainnyaItem {
  id: string;
  nama: string;
  namaIlmiah: string | null;   // scientific / chemical name
  namaLain: string;            // aliases for search
  deskripsi: string;
  kategoriItem: KategoriItem;
  estimasiHarga: number | null; // IDR/kg
  hargaUpdated: string;
  dataLengkap: boolean;
  updatedAt: string;
}

export const LAINNYA_KATEGORI_ORDER: KategoriItem[] = [
  'Adsorben & Pengikat',
  'Bahan Bioaktif Tanaman',
  'Bahan Organik Alami',
];

export const LAINNYA_DB: LainnyaItem[] = [

  // ── Adsorben & Pengikat ───────────────────────────────────────────────────────

  {
    id: 'arang-aktif',
    nama: 'Arang Aktif',
    namaIlmiah: 'Activated Charcoal / Activated Carbon',
    namaLain: 'Activated Charcoal, Arang Aktif, Carbon Aktif, Activated Carbon',
    deskripsi: 'Arang berpori tinggi hasil aktivasi termal atau kimia dari bahan organik (tempurung kelapa, batubara, kayu). Memiliki luas permukaan sangat besar sehingga mampu mengadsorpsi mikotoksin, gas amonia, dan racun dalam saluran pencernaan ternak. Digunakan sebagai agen detoksifikasi pakan kontaminasi jamur.',
    kategoriItem: 'Adsorben & Pengikat',
    estimasiHarga: 35000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'biochar',
    nama: 'Biochar',
    namaIlmiah: 'Biochar (Pyrolytic Carbon)',
    namaLain: 'Bio-char, Arang Pirolisis, Agricultural Biochar',
    deskripsi: 'Produk karbon padat hasil pirolisis bahan organik (sekam padi, tongkol jagung, limbah pertanian) pada suhu tinggi tanpa oksigen. Digunakan sebagai adsorben mikotoksin dalam pakan, pengkondisi saluran cerna, dan campuran litter unggas untuk mengurangi amonia. Berbeda dari arang aktif karena tidak melalui proses aktivasi lebih lanjut.',
    kategoriItem: 'Adsorben & Pengikat',
    estimasiHarga: 8000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'zeolit-alam',
    nama: 'Zeolit Alam',
    namaIlmiah: 'Natural Zeolite (Clinoptilolite)',
    namaLain: 'Natural Zeolite, Klinoptilolite, Zeolite, Zeolit Klinoptilolite',
    deskripsi: 'Mineral aluminosilikat berpori alami dengan kapasitas tukar kation tinggi. Digunakan dalam ransum ternak sebagai adsorben amonia (mengurangi bau kandang), pengendali mikotoksin, carrier mineral, dan untuk memperbaiki konsistensi kotoran unggas. Zeolit klinoptilolite adalah jenis yang paling umum digunakan di Indonesia.',
    kategoriItem: 'Adsorben & Pengikat',
    estimasiHarga: 3500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'bentonit',
    nama: 'Bentonit',
    namaIlmiah: 'Bentonite (Montmorillonite)',
    namaLain: 'Bentonite, Montmorillonite, Sodium Bentonite, Calcium Bentonite',
    deskripsi: 'Mineral lempung ekspansif berbasis montmorilonit dengan kapasitas pengikatan air dan kation yang sangat tinggi. Dalam nutrisi ternak digunakan sebagai adsorben aflatoksin dan mikotoksin lain, perekat pelet, dan pelindung saluran cerna. Sodium bentonit lebih efektif sebagai adsorben, kalsium bentonit lebih umum sebagai perekat pelet.',
    kategoriItem: 'Adsorben & Pengikat',
    estimasiHarga: 2500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'kaolin',
    nama: 'Kaolin',
    namaIlmiah: 'Kaolin (Kaolinite Al₂Si₂O₅(OH)₄)',
    namaLain: 'Kaolinite, China Clay, Kaolin Clay, Lempung Kaolin',
    deskripsi: 'Mineral lempung kaolonit putih dengan struktur berlapis sederhana dan kapasitas pengikatan yang lebih rendah dari bentonit. Digunakan dalam ransum sebagai anti-caking agent (pencegah menggumpal), carrier dalam premix, dan pelindung mukosa saluran cerna. Lebih inert dibanding bentonit sehingga lebih aman digunakan dalam jumlah besar.',
    kategoriItem: 'Adsorben & Pengikat',
    estimasiHarga: 2000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'diatomit',
    nama: 'Diatomit',
    namaIlmiah: 'Diatomaceous Earth (Amorphous Silica)',
    namaLain: 'Diatomaceous Earth, DE, Tanah Diatom, Kieselguhr, Diatomite',
    deskripsi: 'Batuan sedimen bersilika terbentuk dari cangkang fosil alga diatom, memiliki struktur mikropori yang unik. Dalam pakan ternak digunakan sebagai anti-caking agent, adsorben aflatoksin, dan agen pengendalian serangga gudang (grade food/feed). Juga ditambahkan ke litter unggas untuk mengurangi kelembaban dan parasit eksternal.',
    kategoriItem: 'Adsorben & Pengikat',
    estimasiHarga: 5000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'arang-tempurung-kelapa',
    nama: 'Arang Tempurung Kelapa',
    namaIlmiah: 'Coconut Shell Charcoal (Cocos nucifera)',
    namaLain: 'Coconut Shell Charcoal, Arang Batok, Arang Kelapa, Charcoal Kelapa',
    deskripsi: 'Arang hasil karbonisasi tempurung kelapa, bahan baku utama pembuatan arang aktif berkualitas tinggi. Bila digunakan langsung (tanpa aktivasi) memiliki porositas lebih rendah dari arang aktif namun tetap efektif sebagai adsorben dan pengkondisi saluran cerna pada ternak. Banyak tersedia sebagai produk samping industri pengolahan kelapa di Indonesia.',
    kategoriItem: 'Adsorben & Pengikat',
    estimasiHarga: 12000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Bahan Bioaktif Tanaman ─────────────────────────────────────────────────────

  {
    id: 'kitosan',
    nama: 'Kitosan',
    namaIlmiah: 'Chitosan (Deacetylated Chitin)',
    namaLain: 'Chitosan, Kitin Terdeasetilasi, Chitin Deacetylated',
    deskripsi: 'Polisakarida kationik hasil deasetilasi kitin dari cangkang crustacea (udang, kepiting) atau jamur. Dalam pakan ternak digunakan sebagai antimikroba alami (terutama terhadap bakteri gram negatif dan jamur), pemacu pertumbuhan alami pengganti antibiotik, dan imunomodulator. Memiliki aktivitas antibakteri, antijamur, dan mampu meningkatkan respons imun pada unggas dan ikan.',
    kategoriItem: 'Bahan Bioaktif Tanaman',
    estimasiHarga: 85000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'ekstrak-yucca',
    nama: 'Ekstrak Yucca',
    namaIlmiah: 'Yucca schidigera Extract',
    namaLain: 'Yucca Extract, Yucca schidigera, Desert Yucca Extract',
    deskripsi: 'Ekstrak dari kulit batang tanaman Yucca schidigera (kaktus gurun Amerika), kaya saponin steroidal dan polifenol. Digunakan dalam ransum ternak sebagai agen pengurang amonia pada kandang dan ekskreta, peningkat performa pertumbuhan, dan imunomodulator alami. Saponin yucca berinteraksi dengan amonia membentuk senyawa tidak mudah menguap sehingga sangat efektif mengurangi bau kandang unggas dan sapi.',
    kategoriItem: 'Bahan Bioaktif Tanaman',
    estimasiHarga: 250000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'ekstrak-quillaja',
    nama: 'Ekstrak Quillaja',
    namaIlmiah: 'Quillaja saponaria Extract',
    namaLain: 'Quillaja Extract, Soapbark Extract, Quillaja saponaria',
    deskripsi: 'Ekstrak dari kulit kayu pohon Quillaja saponaria (Chili), sangat kaya saponin triterpenoid. Dalam pakan ternak digunakan sebagai emulsifier pakan cair (meningkatkan emulsifikasi lemak), agen pengurang amonia, dan imunomodulator. Saponin quillaja lebih larut air dibanding yucca sehingga lebih mudah dicampurkan ke pakan basah dan aditif cair.',
    kategoriItem: 'Bahan Bioaktif Tanaman',
    estimasiHarga: 320000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },

  // ── Bahan Organik Alami ───────────────────────────────────────────────────────

  {
    id: 'asam-humat',
    nama: 'Asam Humat',
    namaIlmiah: 'Humic Acid',
    namaLain: 'Humic Acid, HA, Asam Humik, Potassium Humate',
    deskripsi: 'Senyawa organik makromolekul hasil dekomposisi bahan organik tanah (leonardit, lignit, gambut), berwarna coklat-hitam. Dalam nutrisi ternak digunakan sebagai pengkondisi saluran cerna, agen pengikat mikotoksin, pengendali keasaman usus, dan imunomodulator. Meningkatkan penyerapan mineral dan efisiensi penggunaan nutrien, sering dicampur dengan asam fulvat.',
    kategoriItem: 'Bahan Organik Alami',
    estimasiHarga: 45000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'asam-fulvat',
    nama: 'Asam Fulvat',
    namaIlmiah: 'Fulvic Acid',
    namaLain: 'Fulvic Acid, FA, Asam Fulvik, Fulvate',
    deskripsi: 'Fraksi terkecil dan paling larut air dari humus, hasil dekomposisi lanjut bahan organik. Memiliki berat molekul lebih rendah dari asam humat sehingga lebih mudah diserap langsung oleh sel usus. Digunakan dalam pakan ternak sebagai chelator mineral (meningkatkan bioavailabilitas mineral), antioksidan alami, dan pengkondisi saluran cerna. Sering dikombinasikan dengan asam humat untuk efek sinergis.',
    kategoriItem: 'Bahan Organik Alami',
    estimasiHarga: 75000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'lignit',
    nama: 'Lignit',
    namaIlmiah: 'Lignite (Brown Coal)',
    namaLain: 'Brown Coal, Lignite, Batubara Coklat, Leonardite',
    deskripsi: 'Batubara muda dengan tingkat karbonisasi rendah, kaya kandungan asam humat alami (leonardite adalah bentuk lignit teroksidasi dengan kadar asam humat sangat tinggi). Digunakan sebagai sumber asam humat dalam pakan ternak untuk memperbaiki kondisi saluran cerna, mengikat mikotoksin, dan meningkatkan efisiensi ransum. Lebih ekonomis dibanding ekstrak asam humat murni.',
    kategoriItem: 'Bahan Organik Alami',
    estimasiHarga: 4500,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'gambut-pakan',
    nama: 'Gambut Pakan',
    namaIlmiah: 'Feed Grade Peat (Sphagnum Peat)',
    namaLain: 'Feed Grade Peat, Sphagnum Peat, Peat Moss, Gambut Sphagnum',
    deskripsi: 'Gambut sphagnum bermutu pakan (feed grade) hasil dekomposisi parsial lumut sphagnum di lahan basah, mengandung asam humat, serat, dan senyawa fenolik alami. Digunakan dalam ransum ternak sebagai sumber serat kasar larut, pengkondisi saluran cerna, dan agen adsorpsi ringan. Berbeda dari gambut hortikultura yang dapat mengandung kontaminan tidak layak pakan.',
    kategoriItem: 'Bahan Organik Alami',
    estimasiHarga: 6000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
  {
    id: 'bioflok-kering',
    nama: 'Bioflok Kering',
    namaIlmiah: 'Dried Biofloc (Mixed Microbial Biomass)',
    namaLain: 'Dried Biofloc, Biofloc Meal, Biomassa Bioflok, Tepung Bioflok',
    deskripsi: 'Biomassa mikroba campuran (bakteri, mikroalga, zooplankton kecil) hasil teknologi bioflok pada budidaya akuakultur, kemudian dikeringkan menjadi tepung. Mengandung protein kasar 25–40%, lemak, dan karbohidrat dari biomassa campuran. Digunakan sebagai suplemen protein alternatif untuk ternak monogastrik dan ikan, memanfaatkan limbah nutrisi budidaya akuakultur sebagai sumber protein bernilai tinggi.',
    kategoriItem: 'Bahan Organik Alami',
    estimasiHarga: 18000,
    hargaUpdated: '10 Jul 2026',
    dataLengkap: true,
    updatedAt: '10 Jul 2026',
  },
];

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getLainnyaList(): LainnyaItem[] {
  return LAINNYA_DB;
}

export function getLainnyaById(id: string): LainnyaItem | undefined {
  return LAINNYA_DB.find(item => item.id === id);
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

export interface LainnyaRingkasan {
  totalReferensi: number;
  hargaRataRata: number | null;
  terakhirUpdate: string;
  dataLengkap: number;
}

export function computeLainnyaRingkasan(): LainnyaRingkasan {
  const items  = getLainnyaList();
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
