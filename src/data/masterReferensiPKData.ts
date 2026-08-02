// ─── Master Referensi Produk Komersial (PK-012) ────────────────────────────────
// Living Database untuk seluruh data referensi yang digunakan oleh modul
// Produk Komersial. Admin dapat menambah, mengubah, dan menghapus referensi
// tanpa mengubah source code.
//
// Cakupan (PK-012):
//   • Jenis Produk       • Bentuk Produk     • Target Ternak
//   • Fase Pemeliharaan  • Jenis Kemasan     • Satuan Berat
//   • Negara Asal        • Produsen          • Distributor
//   • Kategori Produk
//
// UUID v4 permanen (PK-000A): gunakan UUID untuk seluruh relasi antar modul.
// Nama/label hanya untuk tampilan dan backward compatibility.
//
// Aturan:
//   ❌ Jangan hardcode enum di luar file ini.
//   ❌ Jangan gunakan nama/slug untuk relasi — gunakan UUID.
//   ✅ getActiveList() untuk pilihan di form (hanya Aktif).
//   ✅ getList() untuk tampilan admin (semua status).

import { assertAdmin, logRiwayat, type StatusEntitas } from './produkKomersialLivingDB';

// ─── Jenis Referensi ──────────────────────────────────────────────────────────

export type JenisReferensiPK =
  | 'JenisProduk'
  | 'BentukProduk'
  | 'TargetTernak'
  | 'FasePemeliharaan'
  | 'JenisKemasan'
  | 'SatuanBerat'
  | 'NegaraAsal'
  | 'Produsen'
  | 'Distributor'
  | 'KategoriProduk';

export const JENIS_REFERENSI_LIST: JenisReferensiPK[] = [
  'JenisProduk', 'BentukProduk', 'TargetTernak', 'FasePemeliharaan',
  'JenisKemasan', 'SatuanBerat', 'NegaraAsal', 'Produsen', 'Distributor', 'KategoriProduk',
];

export const JENIS_REFERENSI_LABELS: Record<JenisReferensiPK, string> = {
  JenisProduk:      'Jenis Produk',
  BentukProduk:     'Bentuk Produk',
  TargetTernak:     'Target Ternak',
  FasePemeliharaan: 'Fase Pemeliharaan',
  JenisKemasan:     'Jenis Kemasan',
  SatuanBerat:      'Satuan Berat',
  NegaraAsal:       'Negara Asal',
  Produsen:         'Produsen',
  Distributor:      'Distributor',
  KategoriProduk:   'Kategori Produk',
};

export const JENIS_REFERENSI_ICONS: Record<JenisReferensiPK, string> = {
  JenisProduk:      '🏷️',
  BentukProduk:     '🧱',
  TargetTernak:     '🐄',
  FasePemeliharaan: '📅',
  JenisKemasan:     '📦',
  SatuanBerat:      '⚖️',
  NegaraAsal:       '🌏',
  Produsen:         '🏭',
  Distributor:      '🚚',
  KategoriProduk:   '📋',
};

// ─── Tipe Data ────────────────────────────────────────────────────────────────

export interface ReferensiItemPK {
  /** UUID v4 — identitas permanen (PK-000A). Gunakan ini untuk seluruh relasi antar modul. */
  uuid: string;
  /** Nama tampilan — digunakan untuk display dan backward compatibility. */
  nama: string;
  /** Keterangan tambahan — opsional, membantu Admin memahami scope entri ini. */
  keterangan?: string;
  /** Status data — ikuti aturan StatusEntitas Living Database. */
  status: StatusEntitas;
  /** ISO date — tanggal update terakhir. */
  updatedAt: string;
}

// ─── Helper Seed ─────────────────────────────────────────────────────────────

function r(uuid: string, nama: string, keterangan?: string, status: StatusEntitas = 'Aktif'): ReferensiItemPK {
  return { uuid, nama, keterangan, status, updatedAt: '2026-07-10' };
}

// ─── Internal Store ───────────────────────────────────────────────────────────
// Mutable in-memory Living Database. Admin dapat tambah/ubah/hapus tanpa
// reload. Data di-seed sekali saat modul dimuat.

const STORE: Record<JenisReferensiPK, ReferensiItemPK[]> = {

  // ── Jenis Produk ────────────────────────────────────────────────────────────
  JenisProduk: [
    r('a1b2c3d4-0001-4000-8000-aabbccddeeff', 'Konsentrat',         'Produk pakan terkonsentrasi, dicampurkan dengan bahan lain'),
    r('a1b2c3d4-0002-4000-8000-aabbccddeeff', 'Complete Feed',      'Pakan lengkap siap saji, tidak perlu bahan tambahan'),
    r('a1b2c3d4-0003-4000-8000-aabbccddeeff', 'Premix',             'Campuran vitamin & mineral konsentrasi tinggi'),
    r('a1b2c3d4-0004-4000-8000-aabbccddeeff', 'Mineral Mix',        'Campuran mineral anorganik untuk pakan ternak'),
    r('a1b2c3d4-0005-4000-8000-aabbccddeeff', 'Vitamin',            'Suplemen vitamin tunggal atau kombinasi'),
    r('a1b2c3d4-0006-4000-8000-aabbccddeeff', 'Feed Additive',      'Aditif pakan untuk meningkatkan performa atau kesehatan'),
    r('a1b2c3d4-0007-4000-8000-aabbccddeeff', 'Milk Replacer',      'Pengganti susu induk untuk pedet/anak ternak'),
    r('a1b2c3d4-0008-4000-8000-aabbccddeeff', 'UMB',                'Urea Molasses Block — blok suplemen urea dan molases'),
    r('a1b2c3d4-0009-4000-8000-aabbccddeeff', 'Mineral Block',      'Blok mineral padat, dijilat ternak ad libitum'),
    r('a1b2c3d4-0010-4000-8000-aabbccddeeff', 'Probiotik',          'Mikroorganisme hidup bermanfaat untuk saluran cerna'),
    r('a1b2c3d4-0011-4000-8000-aabbccddeeff', 'Enzim',              'Enzim pencernaan (fitase, xylanase, protease, dll)'),
    r('a1b2c3d4-0012-4000-8000-aabbccddeeff', 'Acidifier',          'Pengasam pakan untuk pengendalian patogen'),
    r('a1b2c3d4-0013-4000-8000-aabbccddeeff', 'Buffer',             'Penyangga pH rumen atau saluran cerna'),
    r('a1b2c3d4-0014-4000-8000-aabbccddeeff', 'Binder',             'Pengikat pellet atau anti-debu'),
    r('a1b2c3d4-0015-4000-8000-aabbccddeeff', 'Toxin Binder',       'Pengikat mikotoksin dan racun dalam pakan'),
    r('a1b2c3d4-0016-4000-8000-aabbccddeeff', 'Yeast',              'Suplemen kultur ragi aktif atau inaktif'),
    r('a1b2c3d4-0017-4000-8000-aabbccddeeff', 'Herbal Komersial',   'Produk herbal/fitogenik komersial'),
    r('a1b2c3d4-0018-4000-8000-aabbccddeeff', 'Silase Komersial',   'Silase kemasan komersial siap pakai'),
    r('a1b2c3d4-0019-4000-8000-aabbccddeeff', 'Hay Komersial',      'Jerami/rumput kering kemasan komersial'),
    r('a1b2c3d4-0020-4000-8000-aabbccddeeff', 'Lainnya',            'Produk komersial yang tidak masuk kategori di atas'),
  ],

  // ── Bentuk Produk ───────────────────────────────────────────────────────────
  BentukProduk: [
    r('b2c3d4e5-0001-4000-8000-aabbccddeeff', 'Mash',    'Tepung/serbuk halus, tidak dicetak'),
    r('b2c3d4e5-0002-4000-8000-aabbccddeeff', 'Pellet',  'Dicetak bentuk silinder padat'),
    r('b2c3d4e5-0003-4000-8000-aabbccddeeff', 'Crumble', 'Pellet dihancurkan menjadi serpihan kasar'),
    r('b2c3d4e5-0004-4000-8000-aabbccddeeff', 'Cube',    'Dicetak bentuk kubus padat'),
    r('b2c3d4e5-0005-4000-8000-aabbccddeeff', 'Liquid',  'Bentuk cair — larutan, suspensi, atau emulsi'),
    r('b2c3d4e5-0006-4000-8000-aabbccddeeff', 'Powder',  'Serbuk halus — umumnya premix atau aditif konsentrasi tinggi'),
    r('b2c3d4e5-0007-4000-8000-aabbccddeeff', 'Tablet',  'Tablet terkompresi, umumnya suplemen dosis kecil'),
    r('b2c3d4e5-0008-4000-8000-aabbccddeeff', 'Granul',  'Butiran kasar — antara mash dan pellet'),
    r('b2c3d4e5-0009-4000-8000-aabbccddeeff', 'Block',   'Blok padat besar — UMB, mineral block'),
    r('b2c3d4e5-0010-4000-8000-aabbccddeeff', 'Pasta',   'Pasta atau gel — suplemen bolus atau topikal'),
  ],

  // ── Target Ternak ───────────────────────────────────────────────────────────
  TargetTernak: [
    r('c3d4e5f6-0001-4000-8000-aabbccddeeff', 'Sapi Perah',         'Sapi perah semua fase'),
    r('c3d4e5f6-0002-4000-8000-aabbccddeeff', 'Sapi Potong',        'Sapi potong lokal dan silangan'),
    r('c3d4e5f6-0003-4000-8000-aabbccddeeff', 'Kerbau',             'Kerbau perah dan potong'),
    r('c3d4e5f6-0004-4000-8000-aabbccddeeff', 'Kambing Perah',      'Kambing perah (Etawa, PE, Saanen)'),
    r('c3d4e5f6-0005-4000-8000-aabbccddeeff', 'Kambing Potong',     'Kambing potong (Kacang, Boer, Jawa Randu)'),
    r('c3d4e5f6-0006-4000-8000-aabbccddeeff', 'Domba',              'Domba potong dan wol'),
    r('c3d4e5f6-0007-4000-8000-aabbccddeeff', 'Babi',               'Babi komersial semua fase'),
    r('c3d4e5f6-0008-4000-8000-aabbccddeeff', 'Ayam Broiler',       'Ayam pedaging (broiler)'),
    r('c3d4e5f6-0009-4000-8000-aabbccddeeff', 'Ayam Petelur',       'Ayam ras petelur layer'),
    r('c3d4e5f6-0010-4000-8000-aabbccddeeff', 'Itik/Bebek',         'Itik petelur dan pedaging'),
    r('c3d4e5f6-0011-4000-8000-aabbccddeeff', 'Ikan',               'Ikan budidaya air tawar dan laut'),
    r('c3d4e5f6-0012-4000-8000-aabbccddeeff', 'Udang',              'Udang budidaya (vanamei, windu)'),
    r('c3d4e5f6-0013-4000-8000-aabbccddeeff', 'Ruminansia (Umum)',  'Berlaku untuk semua jenis ruminansia'),
    r('c3d4e5f6-0014-4000-8000-aabbccddeeff', 'Universal',          'Dapat digunakan untuk berbagai jenis ternak'),
  ],

  // ── Fase Pemeliharaan ───────────────────────────────────────────────────────
  FasePemeliharaan: [
    r('d4e5f6a7-0001-4000-8000-aabbccddeeff', 'Starter',         'Fase awal pertumbuhan — biasanya 0–4 minggu'),
    r('d4e5f6a7-0002-4000-8000-aabbccddeeff', 'Grower',          'Fase pertumbuhan aktif'),
    r('d4e5f6a7-0003-4000-8000-aabbccddeeff', 'Finisher',        'Fase akhir penggemukan atau siap panen'),
    r('d4e5f6a7-0004-4000-8000-aabbccddeeff', 'Penggemukan',     'Fase khusus penambahan bobot badan'),
    r('d4e5f6a7-0005-4000-8000-aabbccddeeff', 'Pre-Laktasi',     'Fase sebelum partus atau awal laktasi'),
    r('d4e5f6a7-0006-4000-8000-aabbccddeeff', 'Laktasi Awal',    'Laktasi 0–8 minggu postpartum'),
    r('d4e5f6a7-0007-4000-8000-aabbccddeeff', 'Laktasi Puncak',  'Laktasi 8–20 minggu postpartum'),
    r('d4e5f6a7-0008-4000-8000-aabbccddeeff', 'Laktasi Akhir',   'Laktasi >20 minggu menjelang kering kandang'),
    r('d4e5f6a7-0009-4000-8000-aabbccddeeff', 'Kering Kandang',  'Fase istirahat laktasi, persiapan partus berikutnya'),
    r('d4e5f6a7-0010-4000-8000-aabbccddeeff', 'Bunting',         'Fase kebuntingan'),
    r('d4e5f6a7-0011-4000-8000-aabbccddeeff', 'Pejantan',        'Ternak jantan induk atau pemacek'),
    r('d4e5f6a7-0012-4000-8000-aabbccddeeff', 'Maintenance',     'Pemeliharaan kondisi tubuh tanpa target produksi khusus'),
  ],

  // ── Jenis Kemasan ───────────────────────────────────────────────────────────
  JenisKemasan: [
    r('e5f6a7b8-0001-4000-8000-aabbccddeeff', 'Karung',          'Karung polypropylene atau goni'),
    r('e5f6a7b8-0002-4000-8000-aabbccddeeff', 'Kantong Plastik', 'Kantong plastik HDPE/PE tertutup'),
    r('e5f6a7b8-0003-4000-8000-aabbccddeeff', 'Dus/Karton',      'Kotak karton bergelombang'),
    r('e5f6a7b8-0004-4000-8000-aabbccddeeff', 'Drum Plastik',    'Drum plastik HDPE bertutup'),
    r('e5f6a7b8-0005-4000-8000-aabbccddeeff', 'Drum Besi',       'Drum logam galvanis'),
    r('e5f6a7b8-0006-4000-8000-aabbccddeeff', 'Jeriken',         'Jeriken plastik untuk produk cair'),
    r('e5f6a7b8-0007-4000-8000-aabbccddeeff', 'Botol',           'Botol plastik atau kaca untuk suplemen/vitamin'),
    r('e5f6a7b8-0008-4000-8000-aabbccddeeff', 'Curah/Bulk',      'Tanpa kemasan individual — dikirim curah'),
  ],

  // ── Satuan Berat ────────────────────────────────────────────────────────────
  SatuanBerat: [
    r('f6a7b8c9-0001-4000-8000-aabbccddeeff', 'kg',       'Kilogram'),
    r('f6a7b8c9-0002-4000-8000-aabbccddeeff', 'gram',     'Gram (g)'),
    r('f6a7b8c9-0003-4000-8000-aabbccddeeff', 'mg',       'Miligram'),
    r('f6a7b8c9-0004-4000-8000-aabbccddeeff', 'liter',    'Liter (L)'),
    r('f6a7b8c9-0005-4000-8000-aabbccddeeff', 'mL',       'Mililiter'),
    r('f6a7b8c9-0006-4000-8000-aabbccddeeff', 'ton',      'Metrik ton (1.000 kg)'),
    r('f6a7b8c9-0007-4000-8000-aabbccddeeff', 'pcs/Unit', 'Per kemasan atau per unit'),
  ],

  // ── Negara Asal ─────────────────────────────────────────────────────────────
  NegaraAsal: [
    r('a7b8c9d0-0001-4000-8000-aabbccddeeff', 'Indonesia'),
    r('a7b8c9d0-0002-4000-8000-aabbccddeeff', 'Amerika Serikat'),
    r('a7b8c9d0-0003-4000-8000-aabbccddeeff', 'Belanda'),
    r('a7b8c9d0-0004-4000-8000-aabbccddeeff', 'Australia'),
    r('a7b8c9d0-0005-4000-8000-aabbccddeeff', 'Belgia'),
    r('a7b8c9d0-0006-4000-8000-aabbccddeeff', 'Jerman'),
    r('a7b8c9d0-0007-4000-8000-aabbccddeeff', 'Tiongkok'),
    r('a7b8c9d0-0008-4000-8000-aabbccddeeff', 'India'),
    r('a7b8c9d0-0009-4000-8000-aabbccddeeff', 'Thailand'),
    r('a7b8c9d0-0010-4000-8000-aabbccddeeff', 'Malaysia'),
    r('a7b8c9d0-0011-4000-8000-aabbccddeeff', 'Singapura'),
    r('a7b8c9d0-0012-4000-8000-aabbccddeeff', 'Jepang'),
    r('a7b8c9d0-0013-4000-8000-aabbccddeeff', 'Korea Selatan'),
  ],

  // ── Produsen ────────────────────────────────────────────────────────────────
  Produsen: [
    r('b8c9d0e1-0001-4000-8000-aabbccddeeff', 'PT Charoen Pokphand Indonesia',  'Anak usaha CP Group Thailand, pusat Jakarta'),
    r('b8c9d0e1-0002-4000-8000-aabbccddeeff', 'PT Japfa Comfeed Indonesia',     'Agribisnis terpadu — pakan, daging, susu'),
    r('b8c9d0e1-0003-4000-8000-aabbccddeeff', 'PT Nutrefeed Indonesia',         'Konsentrat ruminansia berbasis riset nutrisi'),
    r('b8c9d0e1-0004-4000-8000-aabbccddeeff', 'PT Mixfeed Indonesia',           'Spesialis konsentrat sapi perah dan potong'),
    r('b8c9d0e1-0005-4000-8000-aabbccddeeff', 'PT Gold Coin Indonesia',         'Anak usaha Gold Coin Group, Singapura'),
    r('b8c9d0e1-0006-4000-8000-aabbccddeeff', 'PT New Hope Group Indonesia',    'Anak usaha New Hope Group, Tiongkok'),
    r('b8c9d0e1-0007-4000-8000-aabbccddeeff', 'PT CJ Feed Indonesia',           'Anak usaha CJ CheilJedang, Korea Selatan'),
    r('b8c9d0e1-0008-4000-8000-aabbccddeeff', 'PT Wonokoyo Jaya Corporindo',    'Produsen pakan berbasis Jawa Timur'),
    r('b8c9d0e1-0009-4000-8000-aabbccddeeff', 'PT Berdikari (Persero)',         'BUMN pangan dan peternakan'),
    r('b8c9d0e1-0010-4000-8000-aabbccddeeff', 'PT Greenfeed Indonesia',         'Anak usaha Green Feeds Group'),
    r('b8c9d0e1-0011-4000-8000-aabbccddeeff', 'PT Cargill Indonesia',           'Anak usaha Cargill Inc., Amerika Serikat'),
    r('b8c9d0e1-0012-4000-8000-aabbccddeeff', 'PT SHS Feed',                    'Produsen pakan ruminansia skala menengah'),
    r('b8c9d0e1-0013-4000-8000-aabbccddeeff', 'PT HI-PRO Feed',                 'Spesialis pakan sapi perah berperforma tinggi'),
    r('b8c9d0e1-0014-4000-8000-aabbccddeeff', 'PT Bonavite Indonesia',          'Konsentrat premium sapi perah'),
    r('b8c9d0e1-0015-4000-8000-aabbccddeeff', 'PT Trouw Nutrition Indonesia',   'Anak usaha Trouw Nutrition (Nutreco), Belanda'),
  ],

  // ── Distributor ─────────────────────────────────────────────────────────────
  Distributor: [
    r('c9d0e1f2-0001-4000-8000-aabbccddeeff', 'PT Intensif Farm Supply',     'Distributor pakan dan obat ternak nasional'),
    r('c9d0e1f2-0002-4000-8000-aabbccddeeff', 'PT Agriplex Indonesia',       'Distribusi agribisnis Jawa dan Bali'),
    r('c9d0e1f2-0003-4000-8000-aabbccddeeff', 'PT Nutrifarm Utama',          'Distribusi suplemen dan premix ternak'),
    r('c9d0e1f2-0004-4000-8000-aabbccddeeff', 'PT MedionFarma Jaya',         'Distribusi vaksin, obat, dan suplemen ternak'),
    r('c9d0e1f2-0005-4000-8000-aabbccddeeff', 'PT Multifeeds International', 'Importir dan distributor bahan pakan & premix'),
    r('c9d0e1f2-0006-4000-8000-aabbccddeeff', 'PT Anugrah Argon Medica',     'Distribusi produk nutrisi dan kesehatan ternak'),
    r('c9d0e1f2-0007-4000-8000-aabbccddeeff', 'CV Sumber Ternak',            'Distributor lokal pakan ternak ruminansia'),
    r('c9d0e1f2-0008-4000-8000-aabbccddeeff', 'PT Agro Nusa Makmur',         'Distribusi pakan dan peralatan ternak'),
    r('c9d0e1f2-0009-4000-8000-aabbccddeeff', 'PT Indo Nutrisi',             'Distribusi nutrisi ternak Jawa Tengah & DIY'),
    r('c9d0e1f2-0010-4000-8000-aabbccddeeff', 'PT Farmavet',                 'Distribusi farmasetika veteriner dan suplemen'),
  ],

  // ── Kategori Produk ─────────────────────────────────────────────────────────
  // UUID selaras dengan KATEGORI_UUID di produkKomersialData.ts untuk
  // konsistensi relasi lintas modul (PK-000A).
  KategoriProduk: [
    r('ef284065-b9f3-4f7f-828e-9868206ebf3c', 'Konsentrat',         'Pakan terkonsentrasi untuk ruminansia dan monogastrik'),
    r('2bc49fe7-8908-4aa1-9efd-bed0b6b0d550', 'Complete Feed',      'Pakan lengkap tanpa bahan tambahan'),
    r('9eac54c7-3470-4058-9830-ba1fa61a2964', 'Premix',             'Campuran vitamin & mineral konsentrasi tinggi'),
    r('d64ef8c5-f751-49ec-b84d-e4dec5eb2aef', 'Mineral Mix',        'Suplemen mineral anorganik'),
    r('a2e67f79-4610-4e99-9cff-f0444d85352b', 'Vitamin',            'Suplemen vitamin komersial'),
    r('2305e1e2-fe14-44ec-90cb-b0fdd47fdd55', 'Feed Additive',      'Aditif pakan komersial'),
    r('90cd2db1-ad65-4ba2-a77b-e26cea1db351', 'Milk Replacer',      'Pengganti susu untuk pedet/anak ternak'),
    r('580b220e-b4fb-4e5a-9485-ce6dff21bb88', 'UMB',                'Urea Molasses Block'),
    r('854adc57-d1bd-4250-b39d-bbe1d825f15b', 'Mineral Block',      'Blok mineral padat'),
    r('87b36b79-df48-4165-8c3c-d5794f6b386b', 'Probiotik',          'Suplemen probiotik komersial'),
    r('91abe4b1-a359-4147-9f3e-6e851e3c1ad8', 'Enzim',              'Enzim pencernaan komersial'),
    r('01d4a969-69ba-432e-b7fd-185371e87637', 'Acidifier',          'Produk pengasam pakan'),
    r('0718a41a-bb00-4885-ac63-b51b25b09527', 'Buffer',             'Produk penyangga pH'),
    r('08224f98-1e4b-489b-991b-7991e1942282', 'Binder',             'Pengikat pellet dan aditif'),
    r('0bb8aa0c-b4a6-4a25-bd4e-3b766ef611dc', 'Toxin Binder',       'Pengikat toksin dan mikotoksin'),
    r('aafdceb5-c9d6-4bdd-9c9c-a63d2ae7ed7a', 'Yeast',              'Suplemen ragi komersial'),
    r('4adc8bbb-e12a-43b7-a1e9-3f783e3325a3', 'Herbal Komersial',   'Produk herbal/fitogenik'),
    r('925db808-3b5c-4167-926e-248818783539', 'Silase Komersial',   'Silase kemasan siap pakai'),
    r('23d74ddd-0ff0-4d5b-ab39-d888fe9b4b28', 'Hay Komersial',      'Jerami/rumput kering komersial'),
    r('1de7491f-8ce5-409e-bbbb-bab0cdaba72c', 'Lainnya',            'Produk komersial kategori lain'),
  ],

};

// ─── UUID Generator ───────────────────────────────────────────────────────────

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

// ─── Query Functions ──────────────────────────────────────────────────────────

/** Seluruh item untuk jenis referensi tertentu (termasuk Arsip). Untuk tampilan admin. */
export function getList(jenis: JenisReferensiPK): ReferensiItemPK[] {
  return STORE[jenis];
}

/**
 * Hanya item berstatus Aktif.
 * Gunakan ini untuk mengisi pilihan form — Arsip tidak boleh muncul sebagai opsi baru.
 */
export function getActiveList(jenis: JenisReferensiPK): ReferensiItemPK[] {
  return STORE[jenis].filter(i => i.status === 'Aktif');
}

/** Lookup item berdasarkan UUID. */
export function getByUUID(jenis: JenisReferensiPK, uuid: string): ReferensiItemPK | undefined {
  return STORE[jenis].find(i => i.uuid === uuid);
}

/**
 * Lookup nama berdasarkan UUID — untuk merender relasi UUID ke label.
 * Kembalikan undefined bila UUID tidak dikenal.
 */
export function getNamaByUUID(jenis: JenisReferensiPK, uuid: string): string | undefined {
  return STORE[jenis].find(i => i.uuid === uuid)?.nama;
}

/**
 * Lookup UUID berdasarkan nama — untuk migrasi data lama yang menyimpan nama string.
 * Gunakan ini saat perlu mengkonversi data lama ke relasi UUID.
 */
export function getUUIDByNama(jenis: JenisReferensiPK, nama: string): string | undefined {
  return STORE[jenis].find(i => i.nama === nama)?.uuid;
}

/** Jumlah item (semua status) untuk jenis tertentu. */
export function getCount(jenis: JenisReferensiPK): number {
  return STORE[jenis].length;
}

/** Jumlah item aktif untuk jenis tertentu. */
export function getActiveCount(jenis: JenisReferensiPK): number {
  return STORE[jenis].filter(i => i.status === 'Aktif').length;
}

/** Total seluruh referensi di semua kategori (semua status). */
export function getTotalReferensi(): number {
  return JENIS_REFERENSI_LIST.reduce((acc, jenis) => acc + STORE[jenis].length, 0);
}

// ─── CRUD (hanya Admin) ───────────────────────────────────────────────────────

/**
 * Tambah entri referensi baru.
 * @throws bila bukan Admin atau nama kosong.
 */
export function addReferensi(
  jenis: JenisReferensiPK,
  data: Pick<ReferensiItemPK, 'nama'> & Partial<Pick<ReferensiItemPK, 'keterangan' | 'status'>>,
  catatan?: string,
): ReferensiItemPK {
  assertAdmin(`menambah ${JENIS_REFERENSI_LABELS[jenis]}`);
  const nama = data.nama.trim();
  if (!nama) throw new Error('Nama referensi tidak boleh kosong.');
  const newItem: ReferensiItemPK = {
    uuid:       generateUUID(),
    nama,
    keterangan: data.keterangan?.trim() || undefined,
    status:     data.status ?? 'Aktif',
    updatedAt:  new Date().toISOString().slice(0, 10),
  };
  STORE[jenis].push(newItem);
  logRiwayat({
    entityType: 'Master Referensi',
    entityId:    newItem.uuid,
    entityLabel: `${JENIS_REFERENSI_LABELS[jenis]}: ${newItem.nama}`,
    jenisPerubahan: 'Tambah',
    catatan, after: newItem,
  });
  return newItem;
}

/**
 * Ubah entri referensi yang sudah ada.
 * @throws bila bukan Admin atau UUID tidak dikenal.
 */
export function updateReferensi(
  jenis: JenisReferensiPK,
  uuid: string,
  patch: Partial<Pick<ReferensiItemPK, 'nama' | 'keterangan' | 'status'>>,
  catatan?: string,
): void {
  assertAdmin(`mengubah ${JENIS_REFERENSI_LABELS[jenis]}`);
  const idx = STORE[jenis].findIndex(i => i.uuid === uuid);
  if (idx < 0) throw new Error(`[PK-012] ${JENIS_REFERENSI_LABELS[jenis]} UUID "${uuid}" tidak ditemukan.`);
  const prev = STORE[jenis][idx];
  const updated: ReferensiItemPK = {
    ...prev,
    ...(patch.nama       !== undefined && { nama:       patch.nama.trim() }),
    ...(patch.keterangan !== undefined && { keterangan: patch.keterangan.trim() || undefined }),
    ...(patch.status     !== undefined && { status:     patch.status }),
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  if (!updated.nama) throw new Error('Nama referensi tidak boleh kosong.');
  STORE[jenis][idx] = updated;
  const jenisPerubahan = patch.status !== undefined && patch.status !== prev.status ? 'Ubah Status' : 'Ubah';
  logRiwayat({
    entityType: 'Master Referensi',
    entityId:    uuid,
    entityLabel: `${JENIS_REFERENSI_LABELS[jenis]}: ${updated.nama}`,
    jenisPerubahan,
    catatan, before: prev, after: updated,
  });
}

/**
 * Hapus entri referensi.
 * Catatan: data produk yang sudah memakai referensi ini tidak otomatis terpengaruh —
 * mereka tetap menyimpan nilai lama (nama string). Hapus hanya bila yakin tidak ada relasi aktif.
 * @throws bila bukan Admin atau UUID tidak dikenal.
 */
export function deleteReferensi(
  jenis: JenisReferensiPK,
  uuid: string,
  catatan?: string,
): void {
  assertAdmin(`menghapus ${JENIS_REFERENSI_LABELS[jenis]}`);
  const idx = STORE[jenis].findIndex(i => i.uuid === uuid);
  if (idx < 0) throw new Error(`[PK-012] ${JENIS_REFERENSI_LABELS[jenis]} UUID "${uuid}" tidak ditemukan.`);
  const before = STORE[jenis][idx];
  const label = before.nama;
  STORE[jenis].splice(idx, 1);
  logRiwayat({
    entityType: 'Master Referensi',
    entityId:    uuid,
    entityLabel: `${JENIS_REFERENSI_LABELS[jenis]}: ${label}`,
    jenisPerubahan: 'Hapus',
    catatan, before,
  });
}
