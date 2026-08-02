// ─── Produk Komersial — Konsentrat — Seri / Varian Produk ────────────────────
// PK-003: Living Database seri/varian produk konsentrat komersial.
//
// Setiap seri memiliki UUID v4 permanen (PK-000A) sebagai identitas data.
// Relasi ke brand WAJIB menggunakan brandId (UUID), bukan nama/slug merek.
// slug + brandSlug hanya digunakan untuk routing URL.
//
// Admin dapat menambah, mengubah, dan menghapus seri tanpa mengubah source code
// (cukup edit array KONSENTRAT_SERI_LIST di bawah).

import { KONSENTRAT_MEREK_UUID } from './konsentratMerekData';
import { assertAdmin, logRiwayat, type StatusEntitas } from './produkKomersialLivingDB';
import { getTodayISO as todayISO } from '../utils/dateUtils';

// ─── UUID Registry — Konsentrat Seri ─────────────────────────────────────────
// Dibuat sekali (PK-003) — permanen. Jangan ubah nilai UUID yang sudah ada.
export const KONSENTRAT_SERI_UUID: Record<string, string> = {
  // Charoen Pokphand (6)
  'cp-144':         'c920a5c4-8afc-4f7f-a4ec-8e4a285cd329',
  'cp-145':         '01bd8cee-f4b1-4b64-b933-81083fa366f2',
  'cp-551':         '705a40f5-694d-46c7-9aaa-80806917a3f2',
  'cp-552':         'bb3d8d5c-6069-4c11-b1d3-e5022926eca0',
  'cp-141':         'a8c591b5-5758-43a0-80d2-db6c1a1e85f0',
  'cp-146':         'e8d5e563-7513-4762-94fb-5c277bca2db9',
  // Japfa Comfeed (5)
  'jpf-sp118':      '95170ce7-73a4-47f9-8e76-735f8ac97f0d',
  'jpf-sp220':      '7fbbacc4-8b1d-4768-bdc4-5c652ab4b130',
  'jpf-sp312':      '4908685f-e2ad-46ea-9322-e674ac2dcabd',
  'jpf-rum1':       '72cdbe08-bbb6-4649-8ac3-63f1d9180b2e',
  'jpf-rum2':       'b91225c4-b82f-4c67-88a6-d3531c1e7571',
  // Nutrefeed (3)
  'nf-rd':          'bd848ff7-ae76-4471-ad21-f4920c3ee785',
  'nf-pd':          '1b0601d5-7df0-42a1-9afe-ace318f5b51c',
  'nf-sd':          '6e0d634b-64d1-48a9-acc0-e5146362d31f',
  // Mixfeed (4)
  'mx-s18':         '340f1236-f4b0-4ccd-af6a-0fdf519ecefa',
  'mx-s20':         '21e42474-be8b-4b89-9d16-c127a9b12ea1',
  'mx-s22':         '7f23e599-d02a-4884-9867-47108b8a44fb',
  'mx-s25':         '8b0b13fe-7409-4e2f-9c6a-37fc036afb8c',
  // Gold Coin (4)
  'gc-r1':          '72dcc49e-4bf3-4cd1-a438-ba3c9a30820d',
  'gc-r2':          '5d3171ea-dc3c-46cc-81c0-9715d366e94e',
  'gc-r3':          'a44afd16-1b84-4b85-b6da-da592884f48d',
  'gc-r4':          'a7e6cd4b-c29a-4c73-888c-8b1ff48a6a0b',
  // New Hope (3)
  'nh-nt1':         '68eb8bda-f524-4926-be0b-3c08bee4232c',
  'nh-nt2':         'a9a5c95b-3808-49c9-89de-f35013646b0e',
  'nh-nt3':         '538abb3b-d2bb-4927-bb48-394cd157b3be',
  // CJ Feed (3)
  'cj-veal':        'f7a0c768-b0a8-481b-92e5-e4418bbe117e',
  'cj-dairy':       'd41b6c6e-67d0-46c7-b054-53c9ca91e479',
  'cj-beef':        'e26c4269-b46d-4c2f-b511-f53b9392e3b8',
  // Wonokoyo (4)
  'wk-dairy':       'a17eb95f-48ca-4daa-974e-4b0c205f8d9f',
  'wk-beef':        '34338bd6-1b4a-4e99-8f58-06d9b40430e0',
  'wk-goat':        '8768e4d9-ec26-404d-aca0-406d5960bab1',
  'wk-starter':     '3dcf3219-4649-4500-a6f4-079212a46a8c',
  // Malindo (3)
  'ml-r1':          '01f68b68-7a5e-4de3-a656-78fa32dcb133',
  'ml-r2':          '9b1efd2e-a5af-4081-b0fd-dcd8b57bc3a9',
  'ml-r3':          'd6ef7619-855f-4648-9b8f-2f4f7a00bf7b',
  // Berdikari (2)
  'bd-s1':          'fe77c217-ac16-401d-ad2d-3a85475cfb80',
  'bd-s2':          '8398dfc7-e70d-4d29-bb5c-36ea0457abdd',
  // Greenfeed (2)
  'gf-gr1':         'c12cfc78-c0b0-4f3c-9527-b595c31ea85d',
  'gf-gr2':         'b8dfe781-ff06-4d5d-a5fe-b7b1b1cff90a',
  // Cargill (3)
  'ca-cow':         'fc583cad-1ead-4df9-adf7-fe132293f8db',
  'ca-beef':        '00e1955e-5f41-4d6b-ab64-d2f74cba1ab2',
  'ca-goat':        'd3452b9f-7c32-4dc3-b0c6-e0e5a617a834',
  // SHS Feed (2)
  'shs-dairy':      '9f87cc0a-85f7-47dc-827a-6d18b2ba5490',
  'shs-beef':       '59004334-1f67-492f-9c71-259e920c9ca3',
  // HI-PRO (3)
  'hp-dairy':       'fe314f24-98cd-49c1-80d2-df06fec24d3d',
  'hp-feedlot':     '41afadac-461d-47ba-87fe-ee54605f52d3',
  'hp-breeding':    '3bd5e6c2-c399-45aa-904f-99269973e47f',
  // Bonavite (2)
  'bv-laktasi':     '4d548e68-0aae-41af-adbc-30060b9d4266',
  'bv-maintenance': 'c8ec1187-4b7a-40d8-adf7-cd39be0fb2e7',
  // Turbo Feed (3)
  'tb-starter':     'ab38e365-43a4-49fa-bf4c-05e2c2f9113a',
  'tb-grower':      'f14a4725-0923-42ba-ada9-6e51abab0b51',
  'tb-finisher':    'b518c210-70b1-4f7c-96e7-1ef694e78a14',
  // Royal Feed (2)
  'rf-dairy':       'b9c9e61b-1967-498b-9962-130db8947167',
  'rf-beef':        'cea9df53-29ea-4c01-952f-5e055d7bf23a',
  // Yongbee (2)
  'yb-dairy':       'cada83dc-02db-47be-b80f-3c2f70620917',
  'yb-beef':        'fb317ded-9baf-4336-8a76-f59c384aa087',
  // Feedmill Regional (2)
  'fr-perah':       '0e512a63-92cb-4dc7-8f66-338eeff0ac57',
  'fr-potong':      '55e4ef97-4caa-45cb-9d21-4a67fd601084',
  // Feedmill Koperasi (1)
  'fk-perah':       'd2fcb5c4-4f9a-4d73-bd7f-13feb8d67a7e',
  // Feedmill UMKM (1)
  'fu-sapi':        '05c9531e-7e60-44e6-bd04-e1f9bfb8a3cb',
};

// ─── Tipe Entitas ─────────────────────────────────────────────────────────────

export type BentukProduk = 'Mash' | 'Pellet' | 'Crumble' | 'Cube' | 'Liquid' | 'Powder' | string;
// PK-009: StatusProduksi kini selaras dengan StatusEntitas Living Database
// (menambahkan 'Arsip'). Data berstatus Arsip tetap tersimpan untuk riwayat &
// referensi — tidak pernah dihapus otomatis hanya karena berubah status.
export type StatusProduksi = StatusEntitas;

export interface KonsentratSeri {
  /**
   * UUID v4 — identitas permanen seri (PK-000A).
   * Tidak boleh ditampilkan pada UI. Digunakan sebagai seriId pada relasi data (PK-004+).
   */
  uuid: string;
  /**
   * brandId — UUID brand pemilik seri (relasi ke KonsentratMerek.uuid).
   * WAJIB menggunakan UUID, bukan nama/slug brand.
   */
  brandId: string;
  /** brandSlug — digunakan HANYA untuk routing URL. Bukan primary key. */
  brandSlug: string;
  /** slug — digunakan HANYA untuk routing URL. Bukan primary key. */
  slug: string;
  /** Nama seri/varian singkat — contoh: "SMG S18", "CP 144", "Comfeed SP 118" */
  namaSeri: string;
  /** Nama produk lengkap */
  namaProduk: string;
  /** Target ternak — contoh: "Sapi Perah Laktasi", "Sapi Potong Finisher" */
  targetTernak: string;
  /** Bentuk fisik produk */
  bentukProduk: BentukProduk;
  /** Berat kemasan standar — contoh: "50 kg", "25 kg" */
  beratKemasan: string;
  /** Status produksi saat ini */
  statusProduksi: StatusProduksi;
  /** Deskripsi singkat fungsi dan kegunaan seri ini */
  deskripsi: string;
  /** ISO date — tanggal update terakhir data seri ini */
  updatedAt: string;
}

// ─── Living Database ──────────────────────────────────────────────────────────
// Admin dapat menambah/mengubah/menghapus entri tanpa mengubah kode aplikasi.
// Pastikan setiap entri baru memiliki UUID unik di KONSENTRAT_SERI_UUID.

export const KONSENTRAT_SERI_LIST: KonsentratSeri[] = [

  // ── Charoen Pokphand ──────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['cp-144'], brandId: KONSENTRAT_MEREK_UUID['charoen-pokphand'], brandSlug: 'charoen-pokphand', slug: 'cp-144',
    namaSeri: 'CP 144', namaProduk: 'Konsentrat Sapi Potong CP 144',
    targetTernak: 'Sapi Potong — Penggemukan (Grower)',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat penggemukan fase grower dengan protein kasar 14%, diformulasikan untuk pertumbuhan otot optimal pada sapi potong usia 6–18 bulan.',
    updatedAt: '2026-05-15',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['cp-145'], brandId: KONSENTRAT_MEREK_UUID['charoen-pokphand'], brandSlug: 'charoen-pokphand', slug: 'cp-145',
    namaSeri: 'CP 145', namaProduk: 'Konsentrat Sapi Perah CP 145',
    targetTernak: 'Sapi Perah — Laktasi Puncak',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat laktasi dengan protein kasar 18% dan energi tinggi, dirancang untuk menopang produksi susu puncak dan menjaga kondisi tubuh induk selama laktasi.',
    updatedAt: '2026-05-15',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['cp-551'], brandId: KONSENTRAT_MEREK_UUID['charoen-pokphand'], brandSlug: 'charoen-pokphand', slug: 'cp-551',
    namaSeri: 'CP 551', namaProduk: 'Konsentrat Kambing Potong CP 551',
    targetTernak: 'Kambing Potong — Penggemukan',
    bentukProduk: 'Mash', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat khusus kambing potong dengan formulasi seimbang untuk pertumbuhan bobot badan optimal, cocok dicampur hijauan segar atau jerami padi.',
    updatedAt: '2026-04-20',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['cp-552'], brandId: KONSENTRAT_MEREK_UUID['charoen-pokphand'], brandSlug: 'charoen-pokphand', slug: 'cp-552',
    namaSeri: 'CP 552', namaProduk: 'Konsentrat Domba Potong CP 552',
    targetTernak: 'Domba Potong — Penggemukan',
    bentukProduk: 'Mash', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat khusus domba potong dengan kadar sulfur amino tinggi untuk mendukung pertumbuhan wol dan massa otot, disesuaikan untuk sistem pencernaan domba.',
    updatedAt: '2026-04-20',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['cp-141'], brandId: KONSENTRAT_MEREK_UUID['charoen-pokphand'], brandSlug: 'charoen-pokphand', slug: 'cp-141',
    namaSeri: 'CP 141', namaProduk: 'Konsentrat Sapi Dara CP 141',
    targetTernak: 'Sapi Perah — Dara / Heifer',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat untuk sapi dara (heifer) pra-birahi hingga kebuntingan pertama, fokus pada perkembangan kelenjar susu dan persiapan laktasi pertama.',
    updatedAt: '2026-03-10',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['cp-146'], brandId: KONSENTRAT_MEREK_UUID['charoen-pokphand'], brandSlug: 'charoen-pokphand', slug: 'cp-146',
    namaSeri: 'CP 146', namaProduk: 'Konsentrat Sapi Potong Finisher CP 146',
    targetTernak: 'Sapi Potong — Finisher',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat finisher berenergi tinggi untuk 60–90 hari terakhir sebelum panen, meningkatkan deposisi lemak marbling dan bobot karkas sapi potong.',
    updatedAt: '2026-05-15',
  },

  // ── Japfa Comfeed ─────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['jpf-sp118'], brandId: KONSENTRAT_MEREK_UUID['japfa-comfeed'], brandSlug: 'japfa-comfeed', slug: 'jpf-sp118',
    namaSeri: 'Comfeed SP 118', namaProduk: 'Konsentrat Sapi Potong Comfeed SP 118',
    targetTernak: 'Sapi Potong — Starter / Penggemukan Awal',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat starter penggemukan dengan protein kasar 18% untuk sapi potong di awal fase intensif, mendorong pertumbuhan rangka dan otot pada bobot 200–350 kg.',
    updatedAt: '2026-05-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['jpf-sp220'], brandId: KONSENTRAT_MEREK_UUID['japfa-comfeed'], brandSlug: 'japfa-comfeed', slug: 'jpf-sp220',
    namaSeri: 'Comfeed SP 220', namaProduk: 'Konsentrat Sapi Potong Comfeed SP 220',
    targetTernak: 'Sapi Potong — Grower / Penggemukan Tengah',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat grower dengan keseimbangan energi-protein untuk fase pertengahan penggemukan sapi potong bobot 350–500 kg, memaksimalkan pertumbuhan harian (ADG).',
    updatedAt: '2026-05-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['jpf-sp312'], brandId: KONSENTRAT_MEREK_UUID['japfa-comfeed'], brandSlug: 'japfa-comfeed', slug: 'jpf-sp312',
    namaSeri: 'Comfeed SP 312', namaProduk: 'Konsentrat Sapi Potong Comfeed SP 312',
    targetTernak: 'Sapi Potong — Finisher',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat finisher berenergi tinggi untuk 60–90 hari terakhir sebelum panen, meningkatkan akumulasi lemak intramuskular dan kualitas karkas sapi potong.',
    updatedAt: '2026-05-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['jpf-rum1'], brandId: KONSENTRAT_MEREK_UUID['japfa-comfeed'], brandSlug: 'japfa-comfeed', slug: 'jpf-rum1',
    namaSeri: 'Comfeed Ruminan 1', namaProduk: 'Konsentrat Sapi Perah Comfeed Ruminan 1',
    targetTernak: 'Sapi Perah — Awal & Pertengahan Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah fase awal dan pertengahan laktasi dengan protein bypass rumen tinggi untuk menjaga produksi susu dan mencegah defisit energi negatif.',
    updatedAt: '2026-04-15',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['jpf-rum2'], brandId: KONSENTRAT_MEREK_UUID['japfa-comfeed'], brandSlug: 'japfa-comfeed', slug: 'jpf-rum2',
    namaSeri: 'Comfeed Ruminan 2', namaProduk: 'Konsentrat Sapi Perah Comfeed Ruminan 2',
    targetTernak: 'Sapi Perah — Akhir Laktasi & Kering',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat fase akhir laktasi dan masa kering dengan kandungan mineral tinggi untuk memulihkan kondisi tubuh induk dan mempersiapkan laktasi berikutnya.',
    updatedAt: '2026-04-15',
  },

  // ── Nutrefeed ─────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['nf-rd'], brandId: KONSENTRAT_MEREK_UUID['nutrefeed'], brandSlug: 'nutrefeed', slug: 'nf-rd',
    namaSeri: 'Nutrefeed RD', namaProduk: 'Konsentrat Nutrefeed Ruminansia Dairy',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah laktasi dengan formulasi nutrisi seimbang berbasis riset: protein kasar 18%, TDN 70%, diperkaya calcium dan fosfor untuk produksi susu optimal.',
    updatedAt: '2026-04-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['nf-pd'], brandId: KONSENTRAT_MEREK_UUID['nutrefeed'], brandSlug: 'nutrefeed', slug: 'nf-pd',
    namaSeri: 'Nutrefeed PD', namaProduk: 'Konsentrat Nutrefeed Pedet & Dara',
    targetTernak: 'Sapi Perah — Pedet & Dara (Heifer)',
    bentukProduk: 'Mash', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat khusus pedet sapihan dan sapi dara dengan protein tinggi untuk mendukung pertumbuhan optimal dan perkembangan sistem reproduksi sebelum birahi pertama.',
    updatedAt: '2026-03-15',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['nf-sd'], brandId: KONSENTRAT_MEREK_UUID['nutrefeed'], brandSlug: 'nutrefeed', slug: 'nf-sd',
    namaSeri: 'Nutrefeed SD', namaProduk: 'Konsentrat Nutrefeed Sapi Daging',
    targetTernak: 'Sapi Potong — Penggemukan',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat penggemukan sapi potong dengan energi-protein seimbang, formulasi khusus untuk memaksimalkan pertambahan bobot harian (ADG) pada semua fase penggemukan.',
    updatedAt: '2026-03-15',
  },

  // ── Mixfeed ───────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['mx-s18'], brandId: KONSENTRAT_MEREK_UUID['mixfeed'], brandSlug: 'mixfeed', slug: 'mx-s18',
    namaSeri: 'SMG S18', namaProduk: 'Konsentrat Sapi Perah Mixfeed SMG S18',
    targetTernak: 'Sapi Perah — Kering / Maintenance',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah masa kering dan maintenance dengan protein kasar 18%, diformulasikan untuk mempertahankan kondisi tubuh induk di luar masa puncak produksi.',
    updatedAt: '2026-06-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['mx-s20'], brandId: KONSENTRAT_MEREK_UUID['mixfeed'], brandSlug: 'mixfeed', slug: 'mx-s20',
    namaSeri: 'SMG S20', namaProduk: 'Konsentrat Sapi Perah Mixfeed SMG S20',
    targetTernak: 'Sapi Perah — Awal Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat awal laktasi dengan protein kasar 20% dan energi termetabolis tinggi untuk mengatasi defisit energi negatif dan memulai kurva laktasi yang optimal.',
    updatedAt: '2026-06-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['mx-s22'], brandId: KONSENTRAT_MEREK_UUID['mixfeed'], brandSlug: 'mixfeed', slug: 'mx-s22',
    namaSeri: 'SMG S22', namaProduk: 'Konsentrat Sapi Perah Mixfeed SMG S22',
    targetTernak: 'Sapi Perah — Puncak Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat puncak laktasi (peak lactation) dengan protein kasar 22% dan TDN 72%, menjaga produksi susu puncak selama 8–12 minggu pertama setelah beranak.',
    updatedAt: '2026-06-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['mx-s25'], brandId: KONSENTRAT_MEREK_UUID['mixfeed'], brandSlug: 'mixfeed', slug: 'mx-s25',
    namaSeri: 'SMG S25', namaProduk: 'Konsentrat Sapi Perah Mixfeed SMG S25',
    targetTernak: 'Sapi Perah — Produksi Sangat Tinggi (>25 liter/hari)',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat premium untuk sapi perah produksi sangat tinggi (>25 liter/hari) dengan protein kasar 25% dan bypass protein tinggi untuk menopang sintesis susu intensif.',
    updatedAt: '2026-06-01',
  },

  // ── Gold Coin ─────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['gc-r1'], brandId: KONSENTRAT_MEREK_UUID['gold-coin'], brandSlug: 'gold-coin', slug: 'gc-r1',
    namaSeri: 'Gold Coin R1', namaProduk: 'Konsentrat Ruminansia Gold Coin R1',
    targetTernak: 'Sapi Potong — Starter',
    bentukProduk: 'Pellet', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat starter dalam bentuk pellet untuk sapi potong fase awal penggemukan, memudahkan konsumsi dan mengurangi pemilahan pakan.',
    updatedAt: '2026-03-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['gc-r2'], brandId: KONSENTRAT_MEREK_UUID['gold-coin'], brandSlug: 'gold-coin', slug: 'gc-r2',
    namaSeri: 'Gold Coin R2', namaProduk: 'Konsentrat Ruminansia Gold Coin R2',
    targetTernak: 'Sapi Potong — Grower',
    bentukProduk: 'Pellet', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat grower pellet dengan formulasi Asia Tenggara, dioptimalkan untuk pertambahan bobot harian pada sapi potong lokal dan silangan di iklim tropis.',
    updatedAt: '2026-03-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['gc-r3'], brandId: KONSENTRAT_MEREK_UUID['gold-coin'], brandSlug: 'gold-coin', slug: 'gc-r3',
    namaSeri: 'Gold Coin R3', namaProduk: 'Konsentrat Sapi Perah Gold Coin R3',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah laktasi dengan formulasi regional Asia Tenggara, diperkaya vitamin dan mineral tropis untuk produksi susu stabil di iklim panas lembab.',
    updatedAt: '2026-02-15',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['gc-r4'], brandId: KONSENTRAT_MEREK_UUID['gold-coin'], brandSlug: 'gold-coin', slug: 'gc-r4',
    namaSeri: 'Gold Coin R4', namaProduk: 'Konsentrat Ruminansia Kecil Gold Coin R4',
    targetTernak: 'Kambing & Domba — Penggemukan',
    bentukProduk: 'Pellet', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat pellet khusus ruminansia kecil (kambing/domba) dengan ukuran butir lebih kecil, diformulasikan untuk kapasitas rumen dan kebutuhan nutrisi kambing/domba.',
    updatedAt: '2026-02-15',
  },

  // ── New Hope ──────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['nh-nt1'], brandId: KONSENTRAT_MEREK_UUID['new-hope'], brandSlug: 'new-hope', slug: 'nh-nt1',
    namaSeri: 'New Hope NT-1', namaProduk: 'Konsentrat Sapi Perah New Hope NT-1',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah laktasi dari New Hope Liuhe Group dengan teknologi formulasi berbasis riset Tiongkok, fokus pada efisiensi konversi pakan menjadi susu.',
    updatedAt: '2026-02-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['nh-nt2'], brandId: KONSENTRAT_MEREK_UUID['new-hope'], brandSlug: 'new-hope', slug: 'nh-nt2',
    namaSeri: 'New Hope NT-2', namaProduk: 'Konsentrat Sapi Potong New Hope NT-2',
    targetTernak: 'Sapi Potong — Penggemukan',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat penggemukan sapi potong dengan formulasi energi tinggi, dikembangkan dari pengalaman New Hope di pasar Asia yang sangat kompetitif.',
    updatedAt: '2026-02-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['nh-nt3'], brandId: KONSENTRAT_MEREK_UUID['new-hope'], brandSlug: 'new-hope', slug: 'nh-nt3',
    namaSeri: 'New Hope NT-3', namaProduk: 'Konsentrat Unggas-Ruminansia New Hope NT-3',
    targetTernak: 'Kambing & Domba — Penggemukan',
    bentukProduk: 'Pellet', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat pellet untuk ruminansia kecil, memanfaatkan keunggulan rantai suplai bahan baku global New Hope Group untuk harga dan kualitas yang kompetitif.',
    updatedAt: '2026-01-20',
  },

  // ── CJ Feed ───────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['cj-veal'], brandId: KONSENTRAT_MEREK_UUID['cj-feed'], brandSlug: 'cj-feed', slug: 'cj-veal',
    namaSeri: 'CJ Veal', namaProduk: 'Konsentrat Pedet CJ Feed Veal',
    targetTernak: 'Pedet Sapi Potong — Starter',
    bentukProduk: 'Crumble', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat crumble khusus pedet sapi potong lepas sapih hingga bobot 150 kg, berbasis teknologi nutrisi Korea dengan asam amino esensial terproteksi untuk pertumbuhan dini optimal.',
    updatedAt: '2026-01-20',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['cj-dairy'], brandId: KONSENTRAT_MEREK_UUID['cj-feed'], brandSlug: 'cj-feed', slug: 'cj-dairy',
    namaSeri: 'CJ Dairy', namaProduk: 'Konsentrat Sapi Perah CJ Feed Dairy',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah laktasi berbasis teknologi nutrisi Korea dengan bypass protein dan bypass fat inovatif untuk memaksimalkan produksi susu tanpa mengorbankan BCS induk.',
    updatedAt: '2026-01-20',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['cj-beef'], brandId: KONSENTRAT_MEREK_UUID['cj-feed'], brandSlug: 'cj-feed', slug: 'cj-beef',
    namaSeri: 'CJ Beef', namaProduk: 'Konsentrat Sapi Potong CJ Feed Beef',
    targetTernak: 'Sapi Potong — Penggemukan',
    bentukProduk: 'Pellet', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat pellet penggemukan sapi potong dengan formulasi berbasis riset CJ Feed & Care Korea, dioptimalkan untuk marbling dan efisiensi konversi pakan pada sapi silangan.',
    updatedAt: '2026-01-20',
  },

  // ── Wonokoyo ──────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['wk-dairy'], brandId: KONSENTRAT_MEREK_UUID['wonokoyo'], brandSlug: 'wonokoyo', slug: 'wk-dairy',
    namaSeri: 'WK Dairy', namaProduk: 'Konsentrat Sapi Perah Wonokoyo Dairy',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah laktasi dari Wonokoyo, produsen nasional Jawa Timur dengan akses bahan baku lokal berkualitas, diformulasikan untuk kondisi iklim Jawa.',
    updatedAt: '2026-05-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['wk-beef'], brandId: KONSENTRAT_MEREK_UUID['wonokoyo'], brandSlug: 'wonokoyo', slug: 'wk-beef',
    namaSeri: 'WK Beef', namaProduk: 'Konsentrat Sapi Potong Wonokoyo Beef',
    targetTernak: 'Sapi Potong — Penggemukan',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat penggemukan sapi potong Wonokoyo dengan energi-protein seimbang, populer di kalangan peternak Jawa Timur karena harga kompetitif dan ketersediaan regional.',
    updatedAt: '2026-05-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['wk-goat'], brandId: KONSENTRAT_MEREK_UUID['wonokoyo'], brandSlug: 'wonokoyo', slug: 'wk-goat',
    namaSeri: 'WK Goat', namaProduk: 'Konsentrat Kambing Wonokoyo Goat',
    targetTernak: 'Kambing — Penggemukan & Perah',
    bentukProduk: 'Mash', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat khusus kambing yang dapat digunakan untuk kambing potong maupun kambing perah, dengan formulasi fleksibel sesuai kebutuhan peternak kambing skala kecil-menengah.',
    updatedAt: '2026-04-10',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['wk-starter'], brandId: KONSENTRAT_MEREK_UUID['wonokoyo'], brandSlug: 'wonokoyo', slug: 'wk-starter',
    namaSeri: 'WK Starter', namaProduk: 'Konsentrat Pedet Wonokoyo Starter',
    targetTernak: 'Pedet Sapi — Starter',
    bentukProduk: 'Crumble', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat crumble untuk pedet sapi lepas sapih (2–6 bulan) dengan protein tinggi dan palabilitas baik untuk mendorong transisi dari susu ke pakan padat.',
    updatedAt: '2026-04-10',
  },

  // ── Malindo ───────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['ml-r1'], brandId: KONSENTRAT_MEREK_UUID['malindo'], brandSlug: 'malindo', slug: 'ml-r1',
    namaSeri: 'Malindo R1', namaProduk: 'Konsentrat Ruminansia Malindo R1',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah laktasi Malindo Feedmill dengan teknologi Malaysia-Indonesia, diformulasikan untuk kondisi peternak skala menengah dengan akses hijauan terbatas.',
    updatedAt: '2026-04-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['ml-r2'], brandId: KONSENTRAT_MEREK_UUID['malindo'], brandSlug: 'malindo', slug: 'ml-r2',
    namaSeri: 'Malindo R2', namaProduk: 'Konsentrat Sapi Potong Malindo R2',
    targetTernak: 'Sapi Potong — Penggemukan',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat penggemukan sapi potong Malindo dengan formulasi kompetitif, menawarkan keseimbangan biaya-manfaat untuk peternak sapi potong skala komersial.',
    updatedAt: '2026-04-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['ml-r3'], brandId: KONSENTRAT_MEREK_UUID['malindo'], brandSlug: 'malindo', slug: 'ml-r3',
    namaSeri: 'Malindo R3', namaProduk: 'Konsentrat Ruminansia Kecil Malindo R3',
    targetTernak: 'Kambing & Domba — Penggemukan',
    bentukProduk: 'Pellet', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat pellet Malindo untuk kambing dan domba potong, memanfaatkan rantai suplai Malaysia-Indonesia untuk konsistensi kualitas dan ketersediaan produk.',
    updatedAt: '2026-03-15',
  },

  // ── Berdikari ─────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['bd-s1'], brandId: KONSENTRAT_MEREK_UUID['berdikari'], brandSlug: 'berdikari', slug: 'bd-s1',
    namaSeri: 'Berdikari S1', namaProduk: 'Konsentrat Sapi Perah Berdikari S1',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah laktasi dari BUMN pangan Berdikari, mendukung program ketahanan pangan nasional dengan formulasi untuk peternak binaan koperasi susu.',
    updatedAt: '2026-02-20',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['bd-s2'], brandId: KONSENTRAT_MEREK_UUID['berdikari'], brandSlug: 'berdikari', slug: 'bd-s2',
    namaSeri: 'Berdikari S2', namaProduk: 'Konsentrat Sapi Potong Berdikari S2',
    targetTernak: 'Sapi Potong — Penggemukan',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat penggemukan sapi potong Berdikari untuk mendukung program pengembangan sapi potong nasional, dengan distribusi ke daerah-daerah sentra peternakan sapi.',
    updatedAt: '2026-02-20',
  },

  // ── Greenfeed ─────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['gf-gr1'], brandId: KONSENTRAT_MEREK_UUID['greenfeed'], brandSlug: 'greenfeed', slug: 'gf-gr1',
    namaSeri: 'Greenfeed GR1', namaProduk: 'Konsentrat Sapi Perah Greenfeed GR1',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah laktasi Greenfeed Vietnam dengan formulasi tropis, didistribusikan untuk peternak sapi perah di wilayah Asia Tenggara termasuk Indonesia.',
    updatedAt: '2026-01-10',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['gf-gr2'], brandId: KONSENTRAT_MEREK_UUID['greenfeed'], brandSlug: 'greenfeed', slug: 'gf-gr2',
    namaSeri: 'Greenfeed GR2', namaProduk: 'Konsentrat Sapi Potong Greenfeed GR2',
    targetTernak: 'Sapi Potong — Penggemukan',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat penggemukan sapi potong Greenfeed dengan teknologi Vietnam, menawarkan alternatif kompetitif untuk peternak sapi potong yang mencari produk dari produsen Asia.',
    updatedAt: '2026-01-10',
  },

  // ── Cargill ───────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['ca-cow'], brandId: KONSENTRAT_MEREK_UUID['cargill'], brandSlug: 'cargill', slug: 'ca-cow',
    namaSeri: 'OptiCow', namaProduk: 'Konsentrat Sapi Perah Cargill OptiCow',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah laktasi berbasis riset nutrisi internasional Cargill Animal Nutrition, dengan teknologi bypass protein dan bypass fat terdepan untuk produksi susu tinggi.',
    updatedAt: '2026-03-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['ca-beef'], brandId: KONSENTRAT_MEREK_UUID['cargill'], brandSlug: 'cargill', slug: 'ca-beef',
    namaSeri: 'OptiBeef', namaProduk: 'Konsentrat Sapi Potong Cargill OptiBeef',
    targetTernak: 'Sapi Potong — Penggemukan',
    bentukProduk: 'Pellet', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat pellet penggemukan sapi potong Cargill dengan formulasi global, dioptimalkan untuk performa marbling dan efisiensi pakan berbasis standar internasional.',
    updatedAt: '2026-03-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['ca-goat'], brandId: KONSENTRAT_MEREK_UUID['cargill'], brandSlug: 'cargill', slug: 'ca-goat',
    namaSeri: 'OptiGoat', namaProduk: 'Konsentrat Kambing Cargill OptiGoat',
    targetTernak: 'Kambing — Penggemukan & Perah',
    bentukProduk: 'Pellet', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat pellet kambing Cargill berbasis riset global, diformulasikan untuk kambing potong dan perah di pasar Asia Tenggara dengan standar kualitas internasional.',
    updatedAt: '2026-02-10',
  },

  // ── SHS Feed ──────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['shs-dairy'], brandId: KONSENTRAT_MEREK_UUID['shs-feed'], brandSlug: 'shs-feed', slug: 'shs-dairy',
    namaSeri: 'SHS Dairy', namaProduk: 'Konsentrat Sapi Perah SHS Feed Dairy',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah laktasi SHS Feed untuk peternak Jawa dengan formulasi lokal, menggunakan bahan baku regional berkualitas dengan harga terjangkau.',
    updatedAt: '2025-12-15',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['shs-beef'], brandId: KONSENTRAT_MEREK_UUID['shs-feed'], brandSlug: 'shs-feed', slug: 'shs-beef',
    namaSeri: 'SHS Beef', namaProduk: 'Konsentrat Sapi Potong SHS Feed Beef',
    targetTernak: 'Sapi Potong — Penggemukan',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat penggemukan sapi potong SHS Feed berbasis bahan baku lokal Jawa, populer di kalangan peternak skala kecil-menengah di Jawa Tengah dan Jawa Timur.',
    updatedAt: '2025-12-15',
  },

  // ── HI-PRO ────────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['hp-dairy'], brandId: KONSENTRAT_MEREK_UUID['hi-pro'], brandSlug: 'hi-pro', slug: 'hp-dairy',
    namaSeri: 'HI-PRO Dairy', namaProduk: 'Konsentrat Sapi Perah HI-PRO Dairy',
    targetTernak: 'Sapi Perah — Laktasi (Produksi Tinggi)',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Lini konsentrat performa tinggi Charoen Pokphand untuk sapi perah produksi tinggi, dengan kadar bypass protein dan bypass fat di atas standar seri CP reguler.',
    updatedAt: '2026-05-10',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['hp-feedlot'], brandId: KONSENTRAT_MEREK_UUID['hi-pro'], brandSlug: 'hi-pro', slug: 'hp-feedlot',
    namaSeri: 'HI-PRO Feedlot', namaProduk: 'Konsentrat Sapi Potong HI-PRO Feedlot',
    targetTernak: 'Sapi Potong — Penggemukan Intensif',
    bentukProduk: 'Pellet', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat pellet performa tinggi untuk operasi feedlot skala besar, diformulasikan untuk memaksimalkan ADG dan efisiensi konversi pakan dalam sistem penggemukan intensif.',
    updatedAt: '2026-05-10',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['hp-breeding'], brandId: KONSENTRAT_MEREK_UUID['hi-pro'], brandSlug: 'hi-pro', slug: 'hp-breeding',
    namaSeri: 'HI-PRO Breeding', namaProduk: 'Konsentrat Induk HI-PRO Breeding',
    targetTernak: 'Sapi Potong & Perah — Induk Bunting & Breeding',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat khusus induk bunting dan sapi breeding dengan vitamin E, selenium, dan asam folat tinggi untuk memaksimalkan fertilitas, kesuksesan kebuntingan, dan kualitas pedet.',
    updatedAt: '2026-05-10',
  },

  // ── Bonavite ──────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['bv-laktasi'], brandId: KONSENTRAT_MEREK_UUID['bonavite'], brandSlug: 'bonavite', slug: 'bv-laktasi',
    namaSeri: 'Bonavite Laktasi', namaProduk: 'Konsentrat Vitamin-Mineral Bonavite Laktasi',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Powder', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat vitamin-mineral premium khusus sapi perah laktasi dengan rasio Ca:P optimal, vitamin D3 tinggi, dan selenium organik untuk kualitas susu dan kesehatan ambing.',
    updatedAt: '2026-04-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['bv-maintenance'], brandId: KONSENTRAT_MEREK_UUID['bonavite'], brandSlug: 'bonavite', slug: 'bv-maintenance',
    namaSeri: 'Bonavite Maintenance', namaProduk: 'Konsentrat Vitamin-Mineral Bonavite Maintenance',
    targetTernak: 'Sapi Perah — Masa Kering & Pemulihan',
    bentukProduk: 'Powder', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat vitamin-mineral untuk sapi perah masa kering dan pemulihan pasca melahirkan, fokus pada pencegahan milk fever, ketosis, dan masalah metabolik periparturien.',
    updatedAt: '2026-04-01',
  },

  // ── Turbo Feed ────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['tb-starter'], brandId: KONSENTRAT_MEREK_UUID['turbo-feed'], brandSlug: 'turbo-feed', slug: 'tb-starter',
    namaSeri: 'Turbo Starter', namaProduk: 'Konsentrat Penggemukan Turbo Feed Starter',
    targetTernak: 'Sapi Potong — Starter (200–300 kg)',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat starter penggemukan intensif dengan protein kasar tinggi untuk adaptasi pakan di awal penggemukan, mempersiapkan rumen untuk transisi ke pakan energi tinggi.',
    updatedAt: '2026-03-10',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['tb-grower'], brandId: KONSENTRAT_MEREK_UUID['turbo-feed'], brandSlug: 'turbo-feed', slug: 'tb-grower',
    namaSeri: 'Turbo Grower', namaProduk: 'Konsentrat Penggemukan Turbo Feed Grower',
    targetTernak: 'Sapi Potong — Grower (300–450 kg)',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat grower berenergi tinggi untuk fase pertengahan penggemukan intensif, memaksimalkan pertambahan bobot harian (ADG >1,2 kg/hari) pada sapi potong silangan.',
    updatedAt: '2026-03-10',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['tb-finisher'], brandId: KONSENTRAT_MEREK_UUID['turbo-feed'], brandSlug: 'turbo-feed', slug: 'tb-finisher',
    namaSeri: 'Turbo Finisher', namaProduk: 'Konsentrat Penggemukan Turbo Feed Finisher',
    targetTernak: 'Sapi Potong — Finisher (>450 kg)',
    bentukProduk: 'Pellet', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat pellet finisher berenergi sangat tinggi untuk 60 hari terakhir sebelum panen, meningkatkan marbling, kualitas karkas, dan bobot panen sapi potong.',
    updatedAt: '2026-03-10',
  },

  // ── Royal Feed ────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['rf-dairy'], brandId: KONSENTRAT_MEREK_UUID['royal-feed'], brandSlug: 'royal-feed', slug: 'rf-dairy',
    namaSeri: 'Royal Dairy', namaProduk: 'Konsentrat Premium Sapi Perah Royal Feed Dairy',
    targetTernak: 'Sapi Perah — Laktasi (Produksi Tinggi)',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat premium sapi perah produksi tinggi dengan bahan baku impor pilihan, bypass protein dan bypass fat premium, untuk peternak sapi perah kelas atas yang mengejar produksi maksimal.',
    updatedAt: '2026-02-10',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['rf-beef'], brandId: KONSENTRAT_MEREK_UUID['royal-feed'], brandSlug: 'royal-feed', slug: 'rf-beef',
    namaSeri: 'Royal Beef', namaProduk: 'Konsentrat Premium Sapi Potong Royal Feed Beef',
    targetTernak: 'Sapi Potong — Penggemukan Premium',
    bentukProduk: 'Pellet', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat pellet premium penggemukan sapi potong untuk target pasar sapi premium (wagyu silangan/premium beef), dengan formulasi yang mendukung marbling tinggi.',
    updatedAt: '2026-02-10',
  },

  // ── Yongbee ───────────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['yb-dairy'], brandId: KONSENTRAT_MEREK_UUID['yongbee'], brandSlug: 'yongbee', slug: 'yb-dairy',
    namaSeri: 'Yongbee Dairy', namaProduk: 'Konsentrat Asam Amino Yongbee Dairy',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Powder', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat berbasis asam amino terproteksi Korea untuk sapi perah laktasi, menggunakan teknologi rumen-protected amino acid (RPAA) untuk efisiensi sintesis protein susu.',
    updatedAt: '2026-01-15',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['yb-beef'], brandId: KONSENTRAT_MEREK_UUID['yongbee'], brandSlug: 'yongbee', slug: 'yb-beef',
    namaSeri: 'Yongbee Beef', namaProduk: 'Konsentrat Asam Amino Yongbee Beef',
    targetTernak: 'Sapi Potong — Penggemukan',
    bentukProduk: 'Powder', beratKemasan: '25 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat berbasis teknologi asam amino Korea untuk penggemukan sapi potong, meningkatkan efisiensi konversi protein pakan menjadi massa otot dengan supplementasi RPAA.',
    updatedAt: '2026-01-15',
  },

  // ── Feedmill Regional ─────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['fr-perah'], brandId: KONSENTRAT_MEREK_UUID['feedmill-regional'], brandSlug: 'feedmill-regional', slug: 'fr-perah',
    namaSeri: 'Konsentrat Sapi Perah Regional', namaProduk: 'Konsentrat Sapi Perah Feedmill Regional',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah produksi pabrik pakan skala regional, diformulasikan menggunakan bahan baku lokal setempat. Kualitas dan formulasi bervariasi antar produsen regional.',
    updatedAt: '2025-12-01',
  },
  {
    uuid: KONSENTRAT_SERI_UUID['fr-potong'], brandId: KONSENTRAT_MEREK_UUID['feedmill-regional'], brandSlug: 'feedmill-regional', slug: 'fr-potong',
    namaSeri: 'Konsentrat Sapi Potong Regional', namaProduk: 'Konsentrat Sapi Potong Feedmill Regional',
    targetTernak: 'Sapi Potong — Penggemukan',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat penggemukan sapi potong dari pabrik pakan regional, mengutamakan bahan baku lokal dan harga terjangkau. Cocok untuk peternak yang memprioritaskan efisiensi biaya.',
    updatedAt: '2025-12-01',
  },

  // ── Feedmill Koperasi ─────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['fk-perah'], brandId: KONSENTRAT_MEREK_UUID['feedmill-koperasi'], brandSlug: 'feedmill-koperasi', slug: 'fk-perah',
    namaSeri: 'Konsentrat Koperasi Sapi Perah', namaProduk: 'Konsentrat Sapi Perah Feedmill Koperasi',
    targetTernak: 'Sapi Perah — Laktasi',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi perah produksi feedmill koperasi peternak, umumnya dipasarkan eksklusif untuk anggota koperasi. Harga terjangkau dengan kualitas yang dikontrol koperasi setempat.',
    updatedAt: '2025-11-30',
  },

  // ── Feedmill UMKM ─────────────────────────────────────────────────────────
  {
    uuid: KONSENTRAT_SERI_UUID['fu-sapi'], brandId: KONSENTRAT_MEREK_UUID['feedmill-umkm'], brandSlug: 'feedmill-umkm', slug: 'fu-sapi',
    namaSeri: 'Konsentrat Sapi UMKM', namaProduk: 'Konsentrat Sapi Feedmill UMKM',
    targetTernak: 'Sapi Perah & Sapi Potong',
    bentukProduk: 'Mash', beratKemasan: '50 kg', statusProduksi: 'Aktif',
    deskripsi: 'Konsentrat sapi produksi feedmill UMKM skala kecil-menengah. Formulasi dan kualitas bervariasi antar produsen. Cocok untuk peternak yang mencari alternatif harga rendah di pasar lokal.',
    updatedAt: '2025-11-15',
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

/** Ambil semua seri untuk brandId (UUID) tertentu. */
export function getSeriByBrandId(brandId: string): KonsentratSeri[] {
  return KONSENTRAT_SERI_LIST.filter(s => s.brandId === brandId);
}

/** Ambil semua seri untuk brandSlug tertentu (lookup via UUID). */
export function getSeriByBrandSlug(brandSlug: string): KonsentratSeri[] {
  const brandId = KONSENTRAT_MEREK_UUID[brandSlug];
  if (!brandId) return [];
  return getSeriByBrandId(brandId);
}

/** Ambil satu seri berdasarkan UUID. */
export function getSeriByUUID(uuid: string): KonsentratSeri | undefined {
  return KONSENTRAT_SERI_LIST.find(s => s.uuid === uuid);
}

/** Tanggal update terbaru untuk brand tertentu. */
export function getTerakhirDiperbaruiBrand(brandSlug: string): string {
  const seri = getSeriByBrandSlug(brandSlug);
  if (seri.length === 0) return '—';
  const dates = seri.map(s => s.updatedAt).sort((a, b) => b.localeCompare(a));
  return dates[0];
}

// ─── CRUD — Living Database (PK-009) ───────────────────────────────────────────
// Hanya Admin yang dapat menambah/mengubah/menghapus (assertAdmin melempar
// error bila bukan Admin). Setiap perubahan dicatat ke Riwayat.

export type NovaKonsentratSeri = Omit<KonsentratSeri, 'uuid' | 'updatedAt'> & { uuid?: string };

/** Tambah seri/varian baru ke Living Database. UUID dibuat otomatis bila tidak disertakan. */
export function addKonsentratSeri(data: NovaKonsentratSeri, catatan?: string): KonsentratSeri {
  assertAdmin('menambah Seri Produk');
  const uuid = data.uuid ?? crypto.randomUUID();
  const seri: KonsentratSeri = { ...data, uuid, updatedAt: todayISO() };
  KONSENTRAT_SERI_LIST.push(seri);
  logRiwayat({ entityType: 'Seri Produk', entityId: uuid, entityLabel: seri.namaProduk, jenisPerubahan: 'Tambah', catatan, after: seri, brandId: seri.brandId });
  return seri;
}

/** Ubah seri/varian yang sudah ada. UUID tidak pernah berubah. */
export function updateKonsentratSeri(uuid: string, patch: Partial<Omit<KonsentratSeri, 'uuid'>>, catatan?: string): KonsentratSeri | undefined {
  assertAdmin('mengubah Seri Produk');
  const idx = KONSENTRAT_SERI_LIST.findIndex(s => s.uuid === uuid);
  if (idx === -1) return undefined;
  const before = KONSENTRAT_SERI_LIST[idx];
  const after: KonsentratSeri = { ...before, ...patch, uuid, updatedAt: todayISO() };
  KONSENTRAT_SERI_LIST[idx] = after;
  const statusOnly = patch.statusProduksi !== undefined && Object.keys(patch).every(k => k === 'statusProduksi');
  logRiwayat({
    entityType: 'Seri Produk', entityId: uuid, entityLabel: after.namaProduk,
    jenisPerubahan: statusOnly ? 'Ubah Status' : 'Ubah', catatan,
    before, after, brandId: after.brandId,
  });
  return after;
}

/** Hapus seri/varian secara permanen. Riwayat tetap menyimpan jejak sebelum entri dihapus. */
export function deleteKonsentratSeri(uuid: string, catatan?: string): boolean {
  assertAdmin('menghapus Seri Produk');
  const idx = KONSENTRAT_SERI_LIST.findIndex(s => s.uuid === uuid);
  if (idx === -1) return false;
  const [removed] = KONSENTRAT_SERI_LIST.splice(idx, 1);
  logRiwayat({ entityType: 'Seri Produk', entityId: uuid, entityLabel: removed.namaProduk, jenisPerubahan: 'Hapus', catatan, before: removed, brandId: removed.brandId });
  return true;
}
