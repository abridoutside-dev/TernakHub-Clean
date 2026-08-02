// ─── Produk Komersial — Konsentrat — Detail Produk ───────────────────────────
// PK-004: Living Database detail produk konsentrat komersial.
//
// Setiap record terhubung ke KonsentratSeri melalui seriId (UUID — PK-000A).
// Slug/nama TIDAK boleh digunakan sebagai relasi.
//
// Admin dapat menambah, mengubah, dan menghapus detail tanpa mengubah kode UI.

import { KONSENTRAT_SERI_UUID } from './konsentratSeriData';
import { KONSENTRAT_MEREK_UUID } from './konsentratMerekData';
import { assertAdmin, logRiwayat, type StatusEntitas } from './produkKomersialLivingDB';
import { getTodayISO as todayISO } from '../utils/dateUtils';

// ─── UUID Registry — Konsentrat Detail ───────────────────────────────────────
// UUID permanen untuk setiap record detail. Dibuat sekali, tidak boleh diubah.
export const KONSENTRAT_DETAIL_UUID: Record<string, string> = {
  // UUID v4 — dibuat sekali via crypto.randomUUID(), permanen (PK-000A).
  // Jangan ubah nilai UUID yang sudah ada.
  'cp-144':         '4f79c421-401d-4364-9949-3b3651121ba9',
  'cp-145':         'd78088e3-9e00-4f36-b85f-f3e4af4a8b4a',
  'cp-551':         '3980fe2d-dcf2-44d6-9aea-868e728ad515',
  'cp-552':         '54044ae2-0b78-4f5e-a4a1-c0cbbc123026',
  'cp-141':         '51a32cce-14e7-4bb8-81f5-33f8ee689d2a',
  'cp-146':         '6759b3a8-5a4c-4c21-a326-58c7ec0895c7',
  'jpf-sp118':      '22d9e7be-7a1c-4c91-9b54-690473954ab4',
  'jpf-sp220':      '69e3409b-5cd7-4588-858f-9fe52bf3999b',
  'jpf-sp312':      'd7d01c28-0e76-4a51-ac26-aa37c677279d',
  'jpf-rum1':       '0410d1da-dd27-4f23-913c-e39dcd578951',
  'jpf-rum2':       '3919b344-1f0a-4075-89f6-faa0734ca8fb',
  'nf-rd':          'd06b17fd-ab88-426e-b584-0d145f3036d9',
  'nf-pd':          '8adc3431-1ace-41ca-a27a-819a0cc6a097',
  'nf-sd':          'c1af4a75-4f9b-43e6-a3e3-c6ffa23aa41d',
  'mx-s18':         'caac5328-c6f8-4a3a-981c-892cdb15201e',
  'mx-s20':         '5d8bc851-8b19-495e-bf4e-a99034c4a919',
  'mx-s22':         '08b22c8b-2410-4e5f-bfb5-ca76fb1f1a22',
  'mx-s25':         '85e5cb9c-3c46-4f97-83d0-5d3121cba75f',
  'gc-r1':          'f8f98d96-971a-4b18-89c3-552d5bc73d83',
  'gc-r2':          '2d649ff0-29fe-4675-9a50-93e0b5430ce5',
  'gc-r3':          'ed75c95e-10b4-4595-b4b1-d012a6f6ecd2',
  'gc-r4':          'b45bf06f-9797-48c3-b769-75285801fb34',
  'nh-nt1':         '0a9eea66-e58c-42e2-a8bb-fa7ea2cbb8d1',
  'nh-nt2':         '636273ef-620f-41e1-a99a-5f4cc97578ff',
  'nh-nt3':         'ed655924-b395-44fa-9802-a69949b6a317',
  'cj-veal':        'dd0b76b6-c979-4db0-870b-2e7c547732ce',
  'cj-dairy':       'e9bcbf29-fc5e-4f28-95db-1793ad9ba017',
  'cj-beef':        'eb2f24c4-cc65-4e68-951d-2c7595a9100b',
  'wk-dairy':       '8faa8e29-db75-4077-9de9-1072febf5deb',
  'wk-beef':        '2577af4e-ad90-4e5d-8a44-e32a81225c8c',
  'wk-goat':        '978b3944-c88b-417a-b780-3c65cbe972d0',
  'wk-starter':     'a2200c60-b549-4488-8a59-4a9670246ee9',
  'ml-r1':          '84314ceb-aa33-44f1-92fb-570fcee26b94',
  'ml-r2':          'cbfe0d79-5454-41a4-97c0-3c14a21d43d3',
  'ml-r3':          'ff944b01-db55-4983-b562-f9893a78087b',
  'bd-s1':          '75361ff6-7063-4c6e-bcf1-422f9f1f17e3',
  'bd-s2':          'b97fd3cb-6796-445a-ba9c-26cae4e910f5',
  'gf-gr1':         'be381beb-e27c-4b97-b1d2-9be69b43a020',
  'gf-gr2':         '5c62819f-7874-4c21-a766-9c69dbf6e20e',
  'ca-cow':         '97925f75-d2fd-45ce-841c-458346fd3dca',
  'ca-beef':        '80a12390-3d1f-4f50-8122-f5aa1a5d766f',
  'ca-goat':        '14a0e6f3-eb82-4f2a-8c51-74f9c6ed9652',
  'shs-dairy':      '5494e119-6503-4501-adac-ea73c9d0ae6a',
  'shs-beef':       '4e07c802-0537-410f-a138-1d08142684f8',
  'hp-dairy':       'c815878b-1f83-4428-87cb-264adb8476f4',
  'hp-feedlot':     'a501fc06-ced4-4f6a-89d0-711898fff286',
  'hp-breeding':    '8919d5ef-3877-4817-9213-07cc7f658104',
  'bv-laktasi':     '6b19ba10-fc48-45a7-9954-1f98ee0d4f7b',
  'bv-maintenance': '3c817c53-6681-46d6-b438-f08150b62b28',
  'tb-starter':     'e3866429-6256-4c91-b4a5-f1bc740084d8',
  'tb-grower':      'b90831e8-592c-484f-949a-4454ffc004f0',
  'tb-finisher':    '6c17ba9c-9a30-4439-9688-f8324b2c0648',
  'rf-dairy':       'a479ebd5-9f3a-4d4d-9041-74d875e0c12f',
  'rf-beef':        'ca177e17-0f52-404c-bd8e-2bc21ed4dfdb',
  'yb-dairy':       '5b667b96-d24b-4d08-94f3-5e083d5851fa',
  'yb-beef':        'd32e4416-599a-47ea-8686-2dac2e214f62',
  'fr-perah':       '245e8dba-0d91-4ae7-a0e2-1bf4857eb96f',
  'fr-potong':      '3bbdbd88-6fa5-458d-960d-0076d763ac5b',
  'fk-perah':       'd4bbce48-64b4-4ebf-8fbb-d23a05c74865',
  'fu-sapi':        '0ac49c67-5566-4bb9-91ce-16a24fb63b75',
};

// ─── Tipe Entitas ─────────────────────────────────────────────────────────────

export interface NutrisiKonsentrat {
  proteinKasar?: number;   // % Bahan Kering
  tdn?: number;            // % Bahan Kering
  me?: number;             // Mcal/kg
  lemakKasar?: number;     // %
  seratKasar?: number;     // %
  abu?: number;            // %
  kalsium?: number;        // %
  fosfor?: number;         // %
  kadarAir?: number;       // %
  garam?: number;          // %
  mineralTotal?: number;   // %
  vitaminA?: number;       // IU/kg
  vitaminD3?: number;      // IU/kg
  vitaminE?: number;       // mg/kg
  catatanNutrisi?: string;
}

export interface PetunjukPenggunaan {
  caraPemberian: string;
  dosis: string;
  targetPenggunaan: string;
  catatan?: string;
}

export interface InfoKemasan {
  berat: string;
  keterangan?: string;
}

export interface InfoProdusen {
  nama: string;
  negaraAsal: string;
  website?: string;
}

/** Distributor resmi produk — bagian dari Living Database (PK-009). */
export interface InfoDistributor {
  nama: string;
  wilayah?: string;
  kontak?: string;
}

/** Dokumen pendukung (spesifikasi teknis, sertifikat, dsb) — PK-009. */
export interface DokumenPendukung {
  judul: string;
  jenis?: string; // mis. "Spesifikasi Teknis", "Sertifikat", "Label Resmi"
  url?: string;
}

export interface KonsentratDetail {
  /** UUID record detail ini (PK-000A) */
  uuid: string;
  /** seriId — UUID seri parent (relasi ke KonsentratSeri.uuid) */
  seriId: string;
  /** brandId — UUID brand (relasi ke KonsentratMerek.uuid) */
  brandId: string;

  // ── Informasi Umum ────────────────────────────────────────────────────────
  namaBrand: string;
  namaProduk: string;
  namaSeri: string;
  jenisProduk: string;
  targetTernak: string;
  fasePemeliharaan: string;
  bentukProduk: string;
  statusProduksi: StatusEntitas;

  // ── Kandungan Nutrisi ────────────────────────────────────────────────────
  nutrisi: NutrisiKonsentrat;

  // ── Komposisi ────────────────────────────────────────────────────────────
  /** Bahan-bahan utama sesuai informasi resmi produsen */
  komposisi?: string[];

  // ── Petunjuk Penggunaan ───────────────────────────────────────────────────
  petunjukPenggunaan: PetunjukPenggunaan;

  // ── Kemasan ───────────────────────────────────────────────────────────────
  kemasan: InfoKemasan[];

  // ── Produsen ──────────────────────────────────────────────────────────────
  produsen: InfoProdusen;

  // ── Distributor (PK-009) ─────────────────────────────────────────────────
  distributor?: InfoDistributor[];

  // ── Dokumen Pendukung (PK-009) ───────────────────────────────────────────
  dokumenPendukung?: DokumenPendukung[];

  // ── Catatan ───────────────────────────────────────────────────────────────
  catatan?: string;

  updatedAt: string;
}

// ─── Living Database ──────────────────────────────────────────────────────────

export const KONSENTRAT_DETAIL_LIST: KonsentratDetail[] = [

  // ── Charoen Pokphand ──────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['cp-144'], seriId: KONSENTRAT_SERI_UUID['cp-144'], brandId: KONSENTRAT_MEREK_UUID['charoen-pokphand'],
    namaBrand: 'Charoen Pokphand', namaProduk: 'Konsentrat Sapi Potong CP 144', namaSeri: 'CP 144',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan — Fase Grower (6–18 bulan)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 14, tdn: 68, me: 2.72, lemakKasar: 4.0, seratKasar: 12, abu: 10, kalsium: 1.2, fosfor: 0.8, kadarAir: 12, garam: 0.5, vitaminA: 5000, vitaminD3: 1000, vitaminE: 30 },
    komposisi: ['Dedak Padi', 'Bungkil Kedelai', 'Tepung Ikan', 'Jagung', 'Mineral Premix', 'Garam', 'Vitamin Premix', 'Kapur'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan konsentrat dengan hijauan segar atau jerami sebelum diberikan',
      dosis: '3–4 kg/ekor/hari untuk sapi 300–500 kg, dikombinasikan dengan 20–25 kg hijauan',
      targetPenggunaan: 'Sapi potong lokal dan silangan fase grower bobot 200–400 kg',
      catatan: 'Sediakan air minum bersih ad libitum. Jangan berikan tanpa sumber serat kasar.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Charoen Pokphand Indonesia', negaraAsal: 'Indonesia', website: 'https://www.cp.co.id' },
    catatan: 'CP 144 dirancang khusus untuk fase grower. Untuk finisher, gunakan CP 146 yang berenergi lebih tinggi.',
    updatedAt: '2026-05-15',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['cp-145'], seriId: KONSENTRAT_SERI_UUID['cp-145'], brandId: KONSENTRAT_MEREK_UUID['charoen-pokphand'],
    namaBrand: 'Charoen Pokphand', namaProduk: 'Konsentrat Sapi Perah CP 145', namaSeri: 'CP 145',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi Puncak',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 18, tdn: 71, me: 2.84, lemakKasar: 5.0, seratKasar: 10, abu: 11, kalsium: 1.5, fosfor: 1.0, kadarAir: 12, garam: 0.5, vitaminA: 8000, vitaminD3: 1500, vitaminE: 50 },
    komposisi: ['Bungkil Kedelai', 'Jagung', 'Dedak Padi', 'Bungkil Kelapa', 'Bypass Protein (RUP)', 'Calcium', 'Fosfor', 'Garam', 'Vitamin & Mineral Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari (pagi dan sore) bersamaan atau segera setelah pemerahan',
      dosis: '1 kg konsentrat per 2–2,5 liter susu yang diproduksi, ditambah 2 kg maintenance/ekor/hari',
      targetPenggunaan: 'Sapi perah FH murni dan silangan fase laktasi puncak (0–16 minggu postpartum)',
      catatan: 'Pastikan rasio forage:konsentrat minimal 40:60. Naikkan dosis secara bertahap untuk menghindari acidosis.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Charoen Pokphand Indonesia', negaraAsal: 'Indonesia', website: 'https://www.cp.co.id' },
    catatan: 'Untuk sapi perah >20 liter/hari, pertimbangkan seri HI-PRO Dairy yang memiliki bypass protein lebih tinggi.',
    updatedAt: '2026-05-15',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['cp-551'], seriId: KONSENTRAT_SERI_UUID['cp-551'], brandId: KONSENTRAT_MEREK_UUID['charoen-pokphand'],
    namaBrand: 'Charoen Pokphand', namaProduk: 'Konsentrat Kambing Potong CP 551', namaSeri: 'CP 551',
    jenisProduk: 'Konsentrat Kambing Potong', targetTernak: 'Kambing Potong', fasePemeliharaan: 'Penggemukan',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 16, tdn: 65, lemakKasar: 3.5, seratKasar: 14, abu: 10, kalsium: 1.0, fosfor: 0.7, kadarAir: 12, vitaminA: 5000, vitaminD3: 800 },
    komposisi: ['Dedak Padi', 'Bungkil Kedelai', 'Jagung', 'Ampas Tahu Kering', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan segar (rumput, daun leguminosa) atau jerami padi',
      dosis: '0,3–0,5 kg/ekor/hari dikombinasikan dengan 1–2 kg hijauan segar',
      targetPenggunaan: 'Kambing potong lokal (Kacang, PE) dan silangan fase penggemukan (3–8 bulan)',
      catatan: 'Perhatikan kapasitas rumen kambing yang lebih kecil — jangan overfeed konsentrat.',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Charoen Pokphand Indonesia', negaraAsal: 'Indonesia', website: 'https://www.cp.co.id' },
    updatedAt: '2026-04-20',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['cp-552'], seriId: KONSENTRAT_SERI_UUID['cp-552'], brandId: KONSENTRAT_MEREK_UUID['charoen-pokphand'],
    namaBrand: 'Charoen Pokphand', namaProduk: 'Konsentrat Domba Potong CP 552', namaSeri: 'CP 552',
    jenisProduk: 'Konsentrat Domba Potong', targetTernak: 'Domba Potong', fasePemeliharaan: 'Penggemukan',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 16, tdn: 64, lemakKasar: 3.0, seratKasar: 15, abu: 10, kalsium: 1.0, fosfor: 0.65, kadarAir: 12, garam: 0.5 },
    komposisi: ['Dedak Padi', 'Bungkil Kedelai', 'Jagung', 'Methionin', 'Sistin', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan jerami atau hijauan segar, berikan 2× sehari',
      dosis: '0,25–0,4 kg/ekor/hari untuk domba 20–40 kg bobot hidup',
      targetPenggunaan: 'Domba potong lokal (Garut, Merino silangan) fase penggemukan 3–6 bulan',
      catatan: 'Kandungan methionin dan sistin tinggi untuk mendukung pertumbuhan wol sekaligus massa otot.',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Charoen Pokphand Indonesia', negaraAsal: 'Indonesia', website: 'https://www.cp.co.id' },
    catatan: 'Formula khusus domba dengan kandungan sulfur amino yang disesuaikan untuk pertumbuhan wol dan massa otot.',
    updatedAt: '2026-04-20',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['cp-141'], seriId: KONSENTRAT_SERI_UUID['cp-141'], brandId: KONSENTRAT_MEREK_UUID['charoen-pokphand'],
    namaBrand: 'Charoen Pokphand', namaProduk: 'Konsentrat Sapi Dara CP 141', namaSeri: 'CP 141',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah Dara (Heifer)', fasePemeliharaan: 'Pra-Birahi hingga Kebuntingan Pertama',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 66, lemakKasar: 3.5, seratKasar: 13, abu: 10, kalsium: 1.0, fosfor: 0.75, kadarAir: 12, vitaminA: 6000, vitaminD3: 1000, vitaminE: 40 },
    komposisi: ['Bungkil Kedelai', 'Dedak Padi', 'Jagung', 'Bungkil Kelapa', 'Calcium Fosfat', 'Kapur', 'Garam', 'Vitamin & Mineral Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan pagi dan sore hari bersama hijauan berkualitas baik',
      dosis: '2–3 kg/ekor/hari untuk heifer 250–400 kg, dikombinasikan dengan 15–20 kg hijauan',
      targetPenggunaan: 'Sapi perah dara FH murni dan silangan usia 12–24 bulan',
      catatan: 'Hindari pemberian berlebihan agar heifer tidak terlalu gemuk (BCS 3–3,5 ideal). Timbangi bobot rutin setiap bulan.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Charoen Pokphand Indonesia', negaraAsal: 'Indonesia', website: 'https://www.cp.co.id' },
    catatan: 'Fokus pada perkembangan kelenjar susu dan kesiapan reproduksi. Ganti ke CP 145 saat sapi mulai laktasi.',
    updatedAt: '2026-03-10',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['cp-146'], seriId: KONSENTRAT_SERI_UUID['cp-146'], brandId: KONSENTRAT_MEREK_UUID['charoen-pokphand'],
    namaBrand: 'Charoen Pokphand', namaProduk: 'Konsentrat Sapi Potong Finisher CP 146', namaSeri: 'CP 146',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan — Fase Finisher (60–90 hari terakhir)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 14, tdn: 72, me: 2.88, lemakKasar: 5.5, seratKasar: 10, abu: 9, kalsium: 1.0, fosfor: 0.75, kadarAir: 12, garam: 0.5, vitaminA: 5000, vitaminE: 25 },
    komposisi: ['Jagung', 'Dedak Padi', 'Bungkil Kedelai', 'Lemak Nabati (By-pass Fat)', 'Bungkil Kelapa Sawit', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan jerami atau silase jagung, berikan 2× sehari secara teratur',
      dosis: '4–5 kg/ekor/hari untuk sapi 400–600 kg, dikombinasikan dengan 15–20 kg jerami/silase',
      targetPenggunaan: 'Sapi potong fase finisher (Bali, Brahman silangan, Limousin, Simmental) bobot >400 kg',
      catatan: 'Tinggi energi — jangan gunakan untuk fase starter/grower. Naikkan dosis bertahap untuk menghindari acidosis rumen.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Charoen Pokphand Indonesia', negaraAsal: 'Indonesia', website: 'https://www.cp.co.id' },
    catatan: 'Formulasi berenergi tinggi untuk 60–90 hari terakhir. Transisi bertahap dari CP 144.',
    updatedAt: '2026-05-15',
  },

  // ── Japfa Comfeed ─────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['jpf-sp118'], seriId: KONSENTRAT_SERI_UUID['jpf-sp118'], brandId: KONSENTRAT_MEREK_UUID['japfa-comfeed'],
    namaBrand: 'Japfa Comfeed', namaProduk: 'Konsentrat Sapi Potong Comfeed SP 118', namaSeri: 'Comfeed SP 118',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan — Fase Starter (bobot 200–350 kg)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 18, tdn: 68, me: 2.72, lemakKasar: 4.0, seratKasar: 12, abu: 10, kalsium: 1.2, fosfor: 0.85, kadarAir: 12, garam: 0.5, vitaminA: 6000, vitaminD3: 1000, vitaminE: 35 },
    komposisi: ['Bungkil Kedelai', 'Dedak Padi', 'Jagung Giling', 'Tepung Ikan', 'Bungkil Kelapa', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan merata dengan hijauan segar atau jerami sebelum pemberian',
      dosis: '2–3 kg/ekor/hari untuk sapi 200–350 kg, dikombinasikan dengan 20–25 kg hijauan segar',
      targetPenggunaan: 'Sapi potong lokal dan silangan awal fase intensif, bobot masuk 200–350 kg',
      catatan: 'SP 118 adalah tahap pertama dari seri SP Comfeed. Ganti ke SP 220 saat bobot mencapai 350 kg.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Japfa Comfeed Indonesia', negaraAsal: 'Indonesia', website: 'https://www.japfa.co.id' },
    catatan: 'Gunakan secara berurutan: SP 118 → SP 220 → SP 312 untuk hasil penggemukan optimal.',
    updatedAt: '2026-05-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['jpf-sp220'], seriId: KONSENTRAT_SERI_UUID['jpf-sp220'], brandId: KONSENTRAT_MEREK_UUID['japfa-comfeed'],
    namaBrand: 'Japfa Comfeed', namaProduk: 'Konsentrat Sapi Potong Comfeed SP 220', namaSeri: 'Comfeed SP 220',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan — Fase Grower (bobot 350–500 kg)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 16, tdn: 70, me: 2.80, lemakKasar: 4.5, seratKasar: 11, abu: 9.5, kalsium: 1.1, fosfor: 0.80, kadarAir: 12, garam: 0.5, vitaminA: 5500, vitaminD3: 900, vitaminE: 30 },
    komposisi: ['Jagung Giling', 'Dedak Padi', 'Bungkil Kedelai', 'Bungkil Kelapa Sawit', 'Ampas Singkong', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan segar atau jerami, berikan 2–3× sehari',
      dosis: '3–4 kg/ekor/hari untuk sapi 350–500 kg, dikombinasikan dengan 18–22 kg hijauan',
      targetPenggunaan: 'Sapi potong fase pertengahan penggemukan, bobot 350–500 kg',
      catatan: 'Keseimbangan energi-protein dioptimalkan untuk ADG >1,0 kg/hari pada fase grower.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Japfa Comfeed Indonesia', negaraAsal: 'Indonesia', website: 'https://www.japfa.co.id' },
    updatedAt: '2026-05-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['jpf-sp312'], seriId: KONSENTRAT_SERI_UUID['jpf-sp312'], brandId: KONSENTRAT_MEREK_UUID['japfa-comfeed'],
    namaBrand: 'Japfa Comfeed', namaProduk: 'Konsentrat Sapi Potong Comfeed SP 312', namaSeri: 'Comfeed SP 312',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan — Fase Finisher (60–90 hari terakhir)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 14, tdn: 73, me: 2.92, lemakKasar: 6.0, seratKasar: 9, abu: 9, kalsium: 1.0, fosfor: 0.75, kadarAir: 12, garam: 0.5, vitaminA: 5000, vitaminE: 25 },
    komposisi: ['Jagung Giling', 'Lemak Nabati (By-pass Fat)', 'Dedak Padi', 'Bungkil Kedelai', 'Bungkil Kelapa Sawit', 'Ampas Tebu Fermentasi', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan jerami kering atau silase jagung, berikan 2× sehari',
      dosis: '4–5 kg/ekor/hari untuk sapi >500 kg, dikombinasikan dengan 15–18 kg jerami',
      targetPenggunaan: 'Sapi potong fase finisher (bobot panen target >500 kg)',
      catatan: 'Energi sangat tinggi — transisi bertahap dari SP 220 selama 7–10 hari untuk menghindari acidosis rumen.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Japfa Comfeed Indonesia', negaraAsal: 'Indonesia', website: 'https://www.japfa.co.id' },
    catatan: 'Tahap akhir sistem 3-fase Japfa: SP 118 → SP 220 → SP 312.',
    updatedAt: '2026-05-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['jpf-rum1'], seriId: KONSENTRAT_SERI_UUID['jpf-rum1'], brandId: KONSENTRAT_MEREK_UUID['japfa-comfeed'],
    namaBrand: 'Japfa Comfeed', namaProduk: 'Konsentrat Sapi Perah Comfeed Ruminan 1', namaSeri: 'Comfeed Ruminan 1',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Awal dan Pertengahan Laktasi (0–24 minggu postpartum)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 18, tdn: 70, me: 2.80, lemakKasar: 5.0, seratKasar: 10, abu: 11, kalsium: 1.4, fosfor: 0.95, kadarAir: 12, garam: 0.5, vitaminA: 8000, vitaminD3: 1500, vitaminE: 50 },
    komposisi: ['Bungkil Kedelai (Bypass Protein)', 'Jagung', 'Dedak Padi', 'Bungkil Kelapa', 'Tepung Darah', 'Calcium', 'Fosfor', 'Garam', 'Vitamin & Mineral Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan bersamaan dengan pemerahan pagi dan sore, atau dalam TMR (Total Mixed Ration)',
      dosis: '1 kg per 2 liter produksi susu + 2 kg maintenance/ekor/hari',
      targetPenggunaan: 'Sapi perah FH dan silangan fase awal-pertengahan laktasi, produksi 10–20 liter/hari',
      catatan: 'Kandungan bypass protein (RUP) tinggi untuk memenuhi kebutuhan protein pada fase produksi susu puncak.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Japfa Comfeed Indonesia', negaraAsal: 'Indonesia', website: 'https://www.japfa.co.id' },
    catatan: 'Ganti ke Ruminan 2 saat memasuki fase akhir laktasi (>24 minggu) atau saat produksi <8 liter/hari.',
    updatedAt: '2026-04-15',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['jpf-rum2'], seriId: KONSENTRAT_SERI_UUID['jpf-rum2'], brandId: KONSENTRAT_MEREK_UUID['japfa-comfeed'],
    namaBrand: 'Japfa Comfeed', namaProduk: 'Konsentrat Sapi Perah Comfeed Ruminan 2', namaSeri: 'Comfeed Ruminan 2',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Akhir Laktasi dan Masa Kering',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 16, tdn: 67, lemakKasar: 4.0, seratKasar: 12, abu: 12, kalsium: 1.5, fosfor: 1.0, kadarAir: 12, garam: 0.5, vitaminA: 7000, vitaminD3: 1200, vitaminE: 60 },
    komposisi: ['Bungkil Kedelai', 'Dedak Padi', 'Jagung', 'Bungkil Kelapa', 'Calcium', 'Magnesium Oksida', 'Fosfor', 'Garam', 'Selenium', 'Vitamin & Mineral Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersama hijauan berkualitas tinggi',
      dosis: '1,5–2,5 kg/ekor/hari pada akhir laktasi; 1–1,5 kg/ekor/hari pada masa kering',
      targetPenggunaan: 'Sapi perah fase akhir laktasi (>24 minggu) dan periode kering kandang',
      catatan: 'Tinggi mineral (Ca, Mg, Se) untuk memulihkan kondisi tubuh induk dan mencegah masalah periparturien.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Japfa Comfeed Indonesia', negaraAsal: 'Indonesia', website: 'https://www.japfa.co.id' },
    catatan: 'Hentikan pemberian 2–3 hari sebelum beranak. Mulai Ruminan 1 segera setelah beranak dan kolostrum bersih.',
    updatedAt: '2026-04-15',
  },

  // ── Nutrefeed ─────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['nf-rd'], seriId: KONSENTRAT_SERI_UUID['nf-rd'], brandId: KONSENTRAT_MEREK_UUID['nutrefeed'],
    namaBrand: 'Nutrefeed', namaProduk: 'Konsentrat Nutrefeed Ruminansia Dairy', namaSeri: 'Nutrefeed RD',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi (semua fase)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 18, tdn: 70, me: 2.80, lemakKasar: 4.5, seratKasar: 11, abu: 11, kalsium: 1.4, fosfor: 0.95, kadarAir: 12, garam: 0.5, vitaminA: 8000, vitaminD3: 1500, vitaminE: 45 },
    komposisi: ['Bungkil Kedelai', 'Jagung', 'Dedak Padi', 'Bungkil Kelapa Sawit', 'Tepung Ikan', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Vitamin & Mineral Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersamaan atau segera setelah pemerahan',
      dosis: '1 kg per 2–2,5 liter produksi susu, ditambah 1,5–2 kg basal/ekor/hari',
      targetPenggunaan: 'Sapi perah FH dan silangan fase laktasi, produksi 8–18 liter/hari',
      catatan: 'Dioptimalkan berdasarkan riset kebutuhan nutrisi sapi perah tropis. Sediakan hijauan minimum 40% dari total BK ransum.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Nutrifeed Indonesia', negaraAsal: 'Indonesia' },
    updatedAt: '2026-04-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['nf-pd'], seriId: KONSENTRAT_SERI_UUID['nf-pd'], brandId: KONSENTRAT_MEREK_UUID['nutrefeed'],
    namaBrand: 'Nutrefeed', namaProduk: 'Konsentrat Nutrefeed Pedet & Dara', namaSeri: 'Nutrefeed PD',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah Pedet & Dara', fasePemeliharaan: 'Pedet Sapihan hingga Dara Pra-Birahi',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 20, tdn: 68, lemakKasar: 4.0, seratKasar: 10, abu: 10, kalsium: 1.2, fosfor: 0.85, kadarAir: 12, vitaminA: 7000, vitaminD3: 1200, vitaminE: 40 },
    komposisi: ['Bungkil Kedelai', 'Jagung', 'Dedak Padi', 'Tepung Susu Skim', 'Kasein', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan sesuai usia: pedet 2–6 bulan sebagai creep feed; dara 6–18 bulan dicampur hijauan',
      dosis: 'Pedet: 0,5–1 kg/ekor/hari. Dara: 1,5–2,5 kg/ekor/hari dikombinasikan dengan 8–15 kg hijauan',
      targetPenggunaan: 'Pedet sapi perah usia 2–6 bulan dan sapi dara usia 6–18 bulan',
      catatan: 'Protein tinggi mendukung perkembangan kelenjar mammae. Pastikan akses hijauan cukup untuk perkembangan rumen optimal.',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Nutrifeed Indonesia', negaraAsal: 'Indonesia' },
    updatedAt: '2026-03-15',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['nf-sd'], seriId: KONSENTRAT_SERI_UUID['nf-sd'], brandId: KONSENTRAT_MEREK_UUID['nutrefeed'],
    namaBrand: 'Nutrefeed', namaProduk: 'Konsentrat Nutrefeed Sapi Daging', namaSeri: 'Nutrefeed SD',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan (semua fase)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 16, tdn: 70, me: 2.80, lemakKasar: 4.5, seratKasar: 12, abu: 9.5, kalsium: 1.1, fosfor: 0.80, kadarAir: 12, garam: 0.5, vitaminA: 5500, vitaminE: 30 },
    komposisi: ['Jagung', 'Dedak Padi', 'Bungkil Kedelai', 'Bungkil Kelapa Sawit', 'Ampas Singkong', 'Molases', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan segar atau jerami, berikan 2–3× sehari',
      dosis: '2,5–4 kg/ekor/hari sesuai bobot dan fase; dikombinasikan dengan 15–25 kg hijauan atau jerami',
      targetPenggunaan: 'Sapi potong lokal dan silangan semua fase penggemukan, bobot 200–600 kg',
      catatan: 'Formulasi universal yang dapat digunakan dari fase starter hingga finisher dengan penyesuaian dosis.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Nutrifeed Indonesia', negaraAsal: 'Indonesia' },
    catatan: 'Formulasi single-product untuk kemudahan manajemen peternak yang tidak ingin mengganti produk per fase.',
    updatedAt: '2026-03-15',
  },

  // ── Mixfeed ───────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['mx-s18'], seriId: KONSENTRAT_SERI_UUID['mx-s18'], brandId: KONSENTRAT_MEREK_UUID['mixfeed'],
    namaBrand: 'Mixfeed', namaProduk: 'Konsentrat Sapi Perah Mixfeed SMG S18', namaSeri: 'SMG S18',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Masa Kering dan Maintenance',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 18, tdn: 67, me: 2.68, lemakKasar: 4.0, seratKasar: 12, abu: 11, kalsium: 1.3, fosfor: 0.90, kadarAir: 12, garam: 0.5, vitaminA: 7000, vitaminD3: 1200, vitaminE: 55 },
    komposisi: ['Bungkil Kedelai', 'Dedak Padi', 'Jagung', 'Bungkil Kelapa', 'Bungkil Kacang Tanah', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Selenium', 'Vitamin & Mineral Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersama hijauan berkualitas baik',
      dosis: '1,5–2 kg/ekor/hari pada masa kering; 2–3 kg/ekor/hari pada akhir kebuntingan',
      targetPenggunaan: 'Sapi perah FH fase kering kandang dan awal kebuntingan',
      catatan: 'Hindari kelebihan energi saat masa kering untuk mencegah kegemukan induk yang meningkatkan risiko ketosis postpartum.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Mabar Feed Indonesia', negaraAsal: 'Indonesia' },
    catatan: 'Ganti ke SMG S20 segera setelah beranak (2–3 hari pascapartus). Kandungan selenium dan vitamin E tinggi untuk mendukung kesehatan periparturien.',
    updatedAt: '2026-06-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['mx-s20'], seriId: KONSENTRAT_SERI_UUID['mx-s20'], brandId: KONSENTRAT_MEREK_UUID['mixfeed'],
    namaBrand: 'Mixfeed', namaProduk: 'Konsentrat Sapi Perah Mixfeed SMG S20', namaSeri: 'SMG S20',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Awal Laktasi (0–8 minggu postpartum)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 20, tdn: 71, me: 2.84, lemakKasar: 5.0, seratKasar: 10, abu: 11, kalsium: 1.4, fosfor: 1.0, kadarAir: 12, garam: 0.5, vitaminA: 9000, vitaminD3: 1600, vitaminE: 60 },
    komposisi: ['Bungkil Kedelai (Solvent Extracted)', 'Jagung Kuning', 'Dedak Padi Fine', 'Tepung Ikan (LT)', 'By-pass Fat (Rumen Protected Fat)', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Selenium Organik', 'Vitamin A/D3/E', 'Mineral Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan segera setelah pemerahan, 2× sehari. Dapat disajikan dalam TMR atau konsentrat terpisah.',
      dosis: '1 kg per 2 liter produksi + 2 kg basal. Mulai dari 2 kg/hari dan naikkan bertahap 0,5 kg/hari',
      targetPenggunaan: 'Sapi perah FH murni dan silangan fase awal laktasi, produksi target 15–22 liter/hari',
      catatan: 'Kandungan bypass fat dan bypass protein tinggi untuk mengatasi defisit energi negatif (NEB) pada awal laktasi. Pastikan akses hijauan bebas (ad libitum).',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Mabar Feed Indonesia', negaraAsal: 'Indonesia' },
    catatan: 'SMG S20 adalah produk unggulan Mixfeed. Gunakan bersama silase jagung berkualitas untuk hasil terbaik. Ganti ke SMG S22 saat produksi melebihi 20 liter/hari.',
    updatedAt: '2026-06-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['mx-s22'], seriId: KONSENTRAT_SERI_UUID['mx-s22'], brandId: KONSENTRAT_MEREK_UUID['mixfeed'],
    namaBrand: 'Mixfeed', namaProduk: 'Konsentrat Sapi Perah Mixfeed SMG S22', namaSeri: 'SMG S22',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Puncak Laktasi (8–16 minggu postpartum)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 22, tdn: 72, me: 2.88, lemakKasar: 5.5, seratKasar: 9, abu: 11, kalsium: 1.5, fosfor: 1.05, kadarAir: 12, garam: 0.5, vitaminA: 9000, vitaminD3: 1600, vitaminE: 60 },
    komposisi: ['Bungkil Kedelai (Bypass)', 'Jagung Kuning', 'Tepung Ikan (LT)', 'Dedak Padi Fine', 'By-pass Fat Premium', 'Methionin Terproteksi', 'Lisin Terproteksi', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Selenium', 'Vitamin & Mineral Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2–3× sehari bersamaan pemerahan, atau dalam sistem TMR',
      dosis: '1 kg per 2 liter produksi + 2,5 kg basal/ekor/hari',
      targetPenggunaan: 'Sapi perah FH fase puncak laktasi, produksi 20–28 liter/hari',
      catatan: 'Rasio hijauan:konsentrat minimum 40:60 (BK). Dengan produksi sangat tinggi, pertimbangkan SMG S25.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Mabar Feed Indonesia', negaraAsal: 'Indonesia' },
    catatan: 'Protein 22% dengan asam amino terproteksi rumen untuk sintesis protein susu yang efisien. Ideal untuk sapi perah produksi tinggi.',
    updatedAt: '2026-06-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['mx-s25'], seriId: KONSENTRAT_SERI_UUID['mx-s25'], brandId: KONSENTRAT_MEREK_UUID['mixfeed'],
    namaBrand: 'Mixfeed', namaProduk: 'Konsentrat Sapi Perah Mixfeed SMG S25', namaSeri: 'SMG S25',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi — Produksi Sangat Tinggi (>25 liter/hari)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 25, tdn: 73, me: 2.92, lemakKasar: 6.0, seratKasar: 8, abu: 10.5, kalsium: 1.5, fosfor: 1.1, kadarAir: 12, garam: 0.5, vitaminA: 10000, vitaminD3: 1800, vitaminE: 70 },
    komposisi: ['Bungkil Kedelai Premium (High Bypass)', 'Jagung Kuning', 'Tepung Ikan (LT 60% PK)', 'Tepung Darah (Bypass Protein)', 'By-pass Fat Premium', 'Methionin Hidroksi Analog', 'Lisin Terproteksi', 'Kolin Klorida', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Selenium Organik', 'Vitamin A/D3/E', 'Mineral Premix Lengkap'],
    petunjukPenggunaan: {
      caraPemberian: 'Sistem TMR direkomendasikan kuat untuk sapi produksi tinggi. Jika konvensional, berikan 3× sehari.',
      dosis: '1 kg per 2,5 liter produksi + 2,5 kg basal/ekor/hari. Jangan melebihi 12 kg/ekor/hari.',
      targetPenggunaan: 'Sapi perah FH murni produksi sangat tinggi (>25 liter/hari)',
      catatan: 'Protein 25% dengan high-bypass protein premium. Pantau BCS secara ketat — pertahankan BCS 2,75–3,25. Konsultasikan dengan ahli nutrisi untuk ration balancing.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Mabar Feed Indonesia', negaraAsal: 'Indonesia' },
    catatan: 'Produk premium untuk peternak sapi perah profesional dengan sapi produksi >25 liter/hari. Membutuhkan manajemen pakan yang lebih ketat.',
    updatedAt: '2026-06-01',
  },

  // ── Gold Coin ─────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['gc-r1'], seriId: KONSENTRAT_SERI_UUID['gc-r1'], brandId: KONSENTRAT_MEREK_UUID['gold-coin'],
    namaBrand: 'Gold Coin', namaProduk: 'Konsentrat Ruminansia Gold Coin R1', namaSeri: 'Gold Coin R1',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan — Fase Starter',
    bentukProduk: 'Pellet', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 18, tdn: 68, lemakKasar: 4.0, seratKasar: 11, abu: 10, kalsium: 1.2, fosfor: 0.85, kadarAir: 12, garam: 0.5, vitaminA: 6000, vitaminD3: 1000, vitaminE: 35 },
    komposisi: ['Jagung', 'Bungkil Kedelai', 'Dedak Padi', 'Tepung Tapioka', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan atau berikan terpisah bersama hijauan segar',
      dosis: '2–3 kg/ekor/hari untuk sapi 200–350 kg, dikombinasikan dengan 20–25 kg hijauan',
      targetPenggunaan: 'Sapi potong lokal dan silangan fase awal penggemukan',
      catatan: 'Bentuk pellet mengurangi pemilahan pakan (feed sorting) dan dustiness dibandingkan mash.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'Gold Coin Group', negaraAsal: 'Malaysia', website: 'https://www.goldcoingroup.com' },
    updatedAt: '2026-03-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['gc-r2'], seriId: KONSENTRAT_SERI_UUID['gc-r2'], brandId: KONSENTRAT_MEREK_UUID['gold-coin'],
    namaBrand: 'Gold Coin', namaProduk: 'Konsentrat Ruminansia Gold Coin R2', namaSeri: 'Gold Coin R2',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan — Fase Grower',
    bentukProduk: 'Pellet', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 16, tdn: 70, lemakKasar: 5.0, seratKasar: 10, abu: 9.5, kalsium: 1.1, fosfor: 0.80, kadarAir: 12, garam: 0.5, vitaminA: 5500, vitaminE: 30 },
    komposisi: ['Jagung', 'Bungkil Kedelai', 'Bungkil Kelapa Sawit', 'Dedak Padi', 'Tetes Tebu (Molases)', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan atau jerami, berikan 2× sehari',
      dosis: '3–4 kg/ekor/hari untuk sapi 350–500 kg lokal/silangan',
      targetPenggunaan: 'Sapi potong lokal dan silangan tropis Asia Tenggara fase grower',
      catatan: 'Formula dioptimalkan untuk iklim tropis dan genetik sapi lokal Asia Tenggara.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'Gold Coin Group', negaraAsal: 'Malaysia', website: 'https://www.goldcoingroup.com' },
    updatedAt: '2026-03-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['gc-r3'], seriId: KONSENTRAT_SERI_UUID['gc-r3'], brandId: KONSENTRAT_MEREK_UUID['gold-coin'],
    namaBrand: 'Gold Coin', namaProduk: 'Konsentrat Sapi Perah Gold Coin R3', namaSeri: 'Gold Coin R3',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 17, tdn: 69, lemakKasar: 4.5, seratKasar: 11, abu: 11, kalsium: 1.4, fosfor: 0.95, kadarAir: 12, garam: 0.5, vitaminA: 7500, vitaminD3: 1400, vitaminE: 45 },
    komposisi: ['Bungkil Kedelai', 'Jagung', 'Dedak Padi', 'Bungkil Kelapa Sawit', 'Mineral Tropis Premix', 'Calcium', 'Fosfor', 'Garam', 'Vitamin A/D3/E/B-Kompleks'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersamaan dengan pemerahan',
      dosis: '1 kg per 2–2,5 liter produksi + 1,5–2 kg basal/ekor/hari',
      targetPenggunaan: 'Sapi perah laktasi di iklim tropis panas-lembab',
      catatan: 'Formulasi diperkaya dengan vitamin tropis dan elektrolit untuk kompensasi heat stress di daerah panas.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'Gold Coin Group', negaraAsal: 'Malaysia', website: 'https://www.goldcoingroup.com' },
    updatedAt: '2026-02-15',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['gc-r4'], seriId: KONSENTRAT_SERI_UUID['gc-r4'], brandId: KONSENTRAT_MEREK_UUID['gold-coin'],
    namaBrand: 'Gold Coin', namaProduk: 'Konsentrat Ruminansia Kecil Gold Coin R4', namaSeri: 'Gold Coin R4',
    jenisProduk: 'Konsentrat Kambing & Domba', targetTernak: 'Kambing & Domba', fasePemeliharaan: 'Penggemukan',
    bentukProduk: 'Pellet', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 64, lemakKasar: 3.5, seratKasar: 14, abu: 10, kalsium: 1.0, fosfor: 0.70, kadarAir: 12, garam: 0.5, vitaminA: 5000, vitaminD3: 800 },
    komposisi: ['Jagung', 'Bungkil Kedelai', 'Dedak Padi', 'Rumput Kering (Hay Meal)', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan langsung sebagai snack atau campurkan dengan hijauan',
      dosis: '0,3–0,5 kg/ekor/hari untuk kambing; 0,25–0,4 kg/ekor/hari untuk domba',
      targetPenggunaan: 'Kambing dan domba potong fase penggemukan',
      catatan: 'Ukuran pellet lebih kecil disesuaikan dengan mulut ruminansia kecil. Sediakan hijauan segar ad libitum.',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'Gold Coin Group', negaraAsal: 'Malaysia', website: 'https://www.goldcoingroup.com' },
    updatedAt: '2026-02-15',
  },

  // ── New Hope ──────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['nh-nt1'], seriId: KONSENTRAT_SERI_UUID['nh-nt1'], brandId: KONSENTRAT_MEREK_UUID['new-hope'],
    namaBrand: 'New Hope', namaProduk: 'Konsentrat Sapi Perah New Hope NT-1', namaSeri: 'New Hope NT-1',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 18, tdn: 70, lemakKasar: 4.5, seratKasar: 10, abu: 11, kalsium: 1.4, fosfor: 0.95, kadarAir: 12, garam: 0.5, vitaminA: 8000, vitaminD3: 1500, vitaminE: 45 },
    komposisi: ['Bungkil Kedelai', 'Jagung', 'Dedak Padi', 'Bungkil Kanola', 'Tepung Darah', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Vitamin & Mineral Premix Tiongkok'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersamaan pemerahan',
      dosis: '1 kg per 2–2,5 liter produksi + 2 kg maintenance/ekor/hari',
      targetPenggunaan: 'Sapi perah laktasi, produksi 10–18 liter/hari',
      catatan: 'Berdasarkan pengalaman riset New Hope di pasar sapi perah Tiongkok yang diterapkan ke pasar Asia Tenggara.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'New Hope Liuhe Group', negaraAsal: 'Tiongkok', website: 'https://www.newhopegroup.com' },
    updatedAt: '2026-02-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['nh-nt2'], seriId: KONSENTRAT_SERI_UUID['nh-nt2'], brandId: KONSENTRAT_MEREK_UUID['new-hope'],
    namaBrand: 'New Hope', namaProduk: 'Konsentrat Sapi Potong New Hope NT-2', namaSeri: 'New Hope NT-2',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 70, lemakKasar: 5.0, seratKasar: 11, abu: 9.5, kalsium: 1.1, fosfor: 0.80, kadarAir: 12, garam: 0.5, vitaminA: 5500, vitaminE: 30 },
    komposisi: ['Jagung', 'Bungkil Kedelai', 'Dedak Padi', 'Bungkil Kanola', 'Tetes Tebu', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan segar atau jerami',
      dosis: '3–4 kg/ekor/hari dikombinasikan dengan 18–22 kg hijauan atau jerami',
      targetPenggunaan: 'Sapi potong semua fase penggemukan',
      catatan: 'Memanfaatkan rantai suplai bahan baku global New Hope Group untuk kompetitivitas harga.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'New Hope Liuhe Group', negaraAsal: 'Tiongkok', website: 'https://www.newhopegroup.com' },
    updatedAt: '2026-02-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['nh-nt3'], seriId: KONSENTRAT_SERI_UUID['nh-nt3'], brandId: KONSENTRAT_MEREK_UUID['new-hope'],
    namaBrand: 'New Hope', namaProduk: 'Konsentrat Ruminansia Kecil New Hope NT-3', namaSeri: 'New Hope NT-3',
    jenisProduk: 'Konsentrat Kambing & Domba', targetTernak: 'Kambing & Domba', fasePemeliharaan: 'Penggemukan',
    bentukProduk: 'Pellet', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 63, lemakKasar: 3.5, seratKasar: 14, abu: 10, kalsium: 1.0, fosfor: 0.70, kadarAir: 12, garam: 0.5 },
    komposisi: ['Jagung', 'Bungkil Kedelai', 'Dedak Padi', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan langsung atau campurkan dengan hijauan segar',
      dosis: '0,3–0,5 kg/ekor/hari untuk kambing dan domba penggemukan',
      targetPenggunaan: 'Kambing dan domba potong semua fase penggemukan',
      catatan: 'Berdasarkan formula yang sudah terbukti di pasar Asia yang sangat kompetitif.',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'New Hope Liuhe Group', negaraAsal: 'Tiongkok', website: 'https://www.newhopegroup.com' },
    updatedAt: '2026-01-20',
  },

  // ── CJ Feed ───────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['cj-veal'], seriId: KONSENTRAT_SERI_UUID['cj-veal'], brandId: KONSENTRAT_MEREK_UUID['cj-feed'],
    namaBrand: 'CJ Feed', namaProduk: 'Konsentrat Pedet CJ Feed Veal', namaSeri: 'CJ Veal',
    jenisProduk: 'Konsentrat Pedet Sapi Potong', targetTernak: 'Pedet Sapi Potong', fasePemeliharaan: 'Starter — Lepas Sapih hingga 150 kg',
    bentukProduk: 'Crumble', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 22, tdn: 70, lemakKasar: 4.5, seratKasar: 8, abu: 9, kalsium: 1.2, fosfor: 0.90, kadarAir: 12, vitaminA: 8000, vitaminD3: 1800, vitaminE: 50 },
    komposisi: ['Bungkil Kedelai (High Protein)', 'Jagung', 'Tepung Susu Skim', 'Asam Amino Terproteksi (Lisin, Methionin)', 'Mineral Mix', 'Garam', 'Probiotik (Saccharomyces)', 'Vitamin A/D3/E/K'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan sebagai creep feed sejak usia 2 minggu. Bentuk crumble memudahkan konsumsi pedet',
      dosis: 'Pedet 2–4 bulan: 0,3–0,8 kg/ekor/hari. Pedet 4–6 bulan: 0,8–1,5 kg/ekor/hari',
      targetPenggunaan: 'Pedet sapi potong lepas sapih usia 2–6 bulan, bobot 50–150 kg',
      catatan: 'Asam amino esensial terproteksi (rumen bypass) untuk pedet yang belum memiliki rumen fungsional penuh.',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'CJ Feed & Care', negaraAsal: 'Korea Selatan', website: 'https://www.cj.net' },
    catatan: 'Teknologi nutrisi Korea dengan probiotik terintegrasi untuk mendukung perkembangan rumen pedet yang optimal.',
    updatedAt: '2026-01-20',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['cj-dairy'], seriId: KONSENTRAT_SERI_UUID['cj-dairy'], brandId: KONSENTRAT_MEREK_UUID['cj-feed'],
    namaBrand: 'CJ Feed', namaProduk: 'Konsentrat Sapi Perah CJ Feed Dairy', namaSeri: 'CJ Dairy',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi (semua fase)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 19, tdn: 71, me: 2.84, lemakKasar: 5.5, seratKasar: 10, abu: 11, kalsium: 1.45, fosfor: 1.0, kadarAir: 12, garam: 0.5, vitaminA: 9000, vitaminD3: 1600, vitaminE: 55 },
    komposisi: ['Bungkil Kedelai (Bypass)', 'Jagung', 'Bypass Fat (C16 palmitic acid)', 'Tepung Ikan Korea (LT)', 'Dedak Padi', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Selenium Organik', 'Vitamin & Mineral Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersamaan pemerahan. Dapat digunakan dalam sistem TMR.',
      dosis: '1 kg per 2 liter produksi + 2 kg maintenance/ekor/hari',
      targetPenggunaan: 'Sapi perah FH produksi 12–22 liter/hari, fase laktasi apapun',
      catatan: 'Bypass protein dan bypass fat inovatif berbasis riset CJ Korea untuk efisiensi konversi pakan ke susu yang superior.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'CJ Feed & Care', negaraAsal: 'Korea Selatan', website: 'https://www.cj.net' },
    catatan: 'Menggunakan teknologi bypass protein dan bypass fat Korea yang dikenal di industri nutrisi ternak global.',
    updatedAt: '2026-01-20',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['cj-beef'], seriId: KONSENTRAT_SERI_UUID['cj-beef'], brandId: KONSENTRAT_MEREK_UUID['cj-feed'],
    namaBrand: 'CJ Feed', namaProduk: 'Konsentrat Sapi Potong CJ Feed Beef', namaSeri: 'CJ Beef',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan (Grower–Finisher)',
    bentukProduk: 'Pellet', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 16, tdn: 72, lemakKasar: 5.5, seratKasar: 10, abu: 9, kalsium: 1.0, fosfor: 0.80, kadarAir: 12, garam: 0.5, vitaminA: 6000, vitaminE: 35 },
    komposisi: ['Jagung', 'Bungkil Kedelai', 'Bypass Fat', 'Dedak Padi', 'Bungkil Kanola', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan atau jerami, berikan 2× sehari',
      dosis: '3–5 kg/ekor/hari sesuai fase, dikombinasikan dengan 15–22 kg hijauan atau jerami',
      targetPenggunaan: 'Sapi potong (Wagyu silangan, Angus, Brahman) penggemukan dengan target marbling',
      catatan: 'Dioptimalkan untuk marbling (lemak intramuskular) berdasarkan riset CJ pada sapi premium Korea.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'CJ Feed & Care', negaraAsal: 'Korea Selatan', website: 'https://www.cj.net' },
    catatan: 'Teknologi Korea untuk kualitas karkas premium. Cocok untuk peternak yang menarget pasar sapi potong premium.',
    updatedAt: '2026-01-20',
  },

  // ── Wonokoyo ──────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['wk-dairy'], seriId: KONSENTRAT_SERI_UUID['wk-dairy'], brandId: KONSENTRAT_MEREK_UUID['wonokoyo'],
    namaBrand: 'Wonokoyo', namaProduk: 'Konsentrat Sapi Perah Wonokoyo Dairy', namaSeri: 'WK Dairy',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 17, tdn: 69, lemakKasar: 4.0, seratKasar: 11, abu: 11, kalsium: 1.4, fosfor: 0.90, kadarAir: 12, garam: 0.5, vitaminA: 7500, vitaminD3: 1300, vitaminE: 45 },
    komposisi: ['Bungkil Kedelai', 'Dedak Padi Lokal', 'Jagung Lokal', 'Bungkil Kacang Tanah', 'Ampas Tahu Kering', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Vitamin & Mineral Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersamaan pemerahan',
      dosis: '1 kg per 2–2,5 liter produksi + 2 kg basal/ekor/hari',
      targetPenggunaan: 'Sapi perah FH dan silangan di Jawa, produksi 10–18 liter/hari',
      catatan: 'Menggunakan bahan baku lokal Jawa Timur sehingga harga kompetitif dengan kualitas yang terjaga.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Wonokoyo Jaya Corporindo', negaraAsal: 'Indonesia' },
    updatedAt: '2026-05-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['wk-beef'], seriId: KONSENTRAT_SERI_UUID['wk-beef'], brandId: KONSENTRAT_MEREK_UUID['wonokoyo'],
    namaBrand: 'Wonokoyo', namaProduk: 'Konsentrat Sapi Potong Wonokoyo Beef', namaSeri: 'WK Beef',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 68, lemakKasar: 4.0, seratKasar: 13, abu: 10, kalsium: 1.1, fosfor: 0.80, kadarAir: 12, garam: 0.5, vitaminA: 5500, vitaminE: 28 },
    komposisi: ['Jagung Lokal', 'Dedak Padi Lokal', 'Bungkil Kedelai', 'Bungkil Kacang Tanah', 'Ampas Singkong', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan jerami atau hijauan segar, berikan 2× sehari',
      dosis: '3–4 kg/ekor/hari untuk sapi potong 300–500 kg',
      targetPenggunaan: 'Sapi potong lokal (Bali, PO) dan silangan, terutama di wilayah Jawa Timur',
      catatan: 'Populer di kalangan peternak Jawa Timur karena harga kompetitif dan distribusi yang mudah.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Wonokoyo Jaya Corporindo', negaraAsal: 'Indonesia' },
    updatedAt: '2026-05-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['wk-goat'], seriId: KONSENTRAT_SERI_UUID['wk-goat'], brandId: KONSENTRAT_MEREK_UUID['wonokoyo'],
    namaBrand: 'Wonokoyo', namaProduk: 'Konsentrat Kambing Wonokoyo Goat', namaSeri: 'WK Goat',
    jenisProduk: 'Konsentrat Kambing', targetTernak: 'Kambing Potong & Perah', fasePemeliharaan: 'Penggemukan & Laktasi',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 16, tdn: 65, lemakKasar: 3.5, seratKasar: 14, abu: 10, kalsium: 1.0, fosfor: 0.70, kadarAir: 12, garam: 0.5, vitaminA: 5000, vitaminD3: 900 },
    komposisi: ['Dedak Padi', 'Bungkil Kedelai', 'Jagung', 'Ampas Tahu Kering', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan segar (daun singkong, gamal, lamtoro) atau berikan terpisah',
      dosis: 'Kambing potong: 0,3–0,5 kg/ekor/hari. Kambing perah: 0,5–0,8 kg/ekor/hari',
      targetPenggunaan: 'Kambing PE, Etawah, Kacang — potong maupun perah skala kecil-menengah',
      catatan: 'Formulasi fleksibel untuk dua tujuan produksi. Untuk hasil terbaik, sesuaikan dosis dengan tujuan (potong vs perah).',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Wonokoyo Jaya Corporindo', negaraAsal: 'Indonesia' },
    updatedAt: '2026-04-10',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['wk-starter'], seriId: KONSENTRAT_SERI_UUID['wk-starter'], brandId: KONSENTRAT_MEREK_UUID['wonokoyo'],
    namaBrand: 'Wonokoyo', namaProduk: 'Konsentrat Pedet Wonokoyo Starter', namaSeri: 'WK Starter',
    jenisProduk: 'Konsentrat Pedet Sapi', targetTernak: 'Pedet Sapi', fasePemeliharaan: 'Starter — Lepas Sapih (2–6 bulan)',
    bentukProduk: 'Crumble', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 20, tdn: 70, lemakKasar: 4.0, seratKasar: 8, abu: 9, kalsium: 1.2, fosfor: 0.90, kadarAir: 12, vitaminA: 7000, vitaminD3: 1500, vitaminE: 45 },
    komposisi: ['Bungkil Kedelai', 'Jagung', 'Dedak Padi Fine', 'Tepung Susu Skim', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan sebagai creep feed. Bentuk crumble memudahkan konsumsi dan meningkatkan palabilitas',
      dosis: 'Usia 2–4 bulan: 0,5–1 kg/ekor/hari. Usia 4–6 bulan: 1–1,5 kg/ekor/hari',
      targetPenggunaan: 'Pedet sapi perah dan potong usia 2–6 bulan lepas sapih',
      catatan: 'Protein tinggi dan palabilitas baik untuk mendorong transisi mulus dari susu ke pakan padat.',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Wonokoyo Jaya Corporindo', negaraAsal: 'Indonesia' },
    updatedAt: '2026-04-10',
  },

  // ── Malindo ───────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['ml-r1'], seriId: KONSENTRAT_SERI_UUID['ml-r1'], brandId: KONSENTRAT_MEREK_UUID['malindo'],
    namaBrand: 'Malindo', namaProduk: 'Konsentrat Ruminansia Malindo R1', namaSeri: 'Malindo R1',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 17, tdn: 69, lemakKasar: 4.0, seratKasar: 11, abu: 11, kalsium: 1.3, fosfor: 0.90, kadarAir: 12, garam: 0.5, vitaminA: 7000, vitaminD3: 1200, vitaminE: 40 },
    komposisi: ['Bungkil Kedelai', 'Jagung', 'Dedak Padi', 'Bungkil Kelapa Sawit Malaysia', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Vitamin & Mineral Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersamaan pemerahan',
      dosis: '1 kg per 2–2,5 liter produksi + 2 kg basal/ekor/hari',
      targetPenggunaan: 'Sapi perah laktasi di peternakan skala menengah dengan akses hijauan terbatas',
      catatan: 'Memanfaatkan keunggulan rantai suplai Malaysia-Indonesia untuk kelancaran distribusi dan harga stabil.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Malindo Feedmill Indonesia', negaraAsal: 'Malaysia / Indonesia', website: 'https://www.malindo.co.id' },
    updatedAt: '2026-04-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['ml-r2'], seriId: KONSENTRAT_SERI_UUID['ml-r2'], brandId: KONSENTRAT_MEREK_UUID['malindo'],
    namaBrand: 'Malindo', namaProduk: 'Konsentrat Sapi Potong Malindo R2', namaSeri: 'Malindo R2',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 69, lemakKasar: 4.5, seratKasar: 12, abu: 9.5, kalsium: 1.1, fosfor: 0.80, kadarAir: 12, garam: 0.5, vitaminA: 5500, vitaminE: 28 },
    komposisi: ['Jagung', 'Bungkil Kelapa Sawit Malaysia', 'Dedak Padi', 'Bungkil Kedelai', 'Tetes Tebu', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan atau jerami, berikan 2× sehari',
      dosis: '3–4 kg/ekor/hari untuk sapi potong 300–500 kg',
      targetPenggunaan: 'Sapi potong skala komersial di seluruh Indonesia',
      catatan: 'Keseimbangan biaya-manfaat yang baik berkat efisiensi rantai suplai regional.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Malindo Feedmill Indonesia', negaraAsal: 'Malaysia / Indonesia', website: 'https://www.malindo.co.id' },
    updatedAt: '2026-04-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['ml-r3'], seriId: KONSENTRAT_SERI_UUID['ml-r3'], brandId: KONSENTRAT_MEREK_UUID['malindo'],
    namaBrand: 'Malindo', namaProduk: 'Konsentrat Ruminansia Kecil Malindo R3', namaSeri: 'Malindo R3',
    jenisProduk: 'Konsentrat Kambing & Domba', targetTernak: 'Kambing & Domba', fasePemeliharaan: 'Penggemukan',
    bentukProduk: 'Pellet', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 63, lemakKasar: 3.5, seratKasar: 14, abu: 10, kalsium: 1.0, fosfor: 0.68, kadarAir: 12, garam: 0.5 },
    komposisi: ['Jagung', 'Bungkil Kelapa Sawit', 'Bungkil Kedelai', 'Dedak Padi', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan langsung atau campurkan dengan hijauan segar',
      dosis: '0,3–0,5 kg/ekor/hari untuk kambing dan domba potong',
      targetPenggunaan: 'Kambing dan domba potong fase penggemukan',
      catatan: 'Konsistensi kualitas berkat rantai suplai Malaysia-Indonesia yang terjaga.',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Malindo Feedmill Indonesia', negaraAsal: 'Malaysia / Indonesia', website: 'https://www.malindo.co.id' },
    updatedAt: '2026-03-15',
  },

  // ── Berdikari ─────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['bd-s1'], seriId: KONSENTRAT_SERI_UUID['bd-s1'], brandId: KONSENTRAT_MEREK_UUID['berdikari'],
    namaBrand: 'Berdikari', namaProduk: 'Konsentrat Sapi Perah Berdikari S1', namaSeri: 'Berdikari S1',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 17, tdn: 68, lemakKasar: 4.0, seratKasar: 12, abu: 11, kalsium: 1.3, fosfor: 0.90, kadarAir: 12, garam: 0.5, vitaminA: 7000, vitaminD3: 1200, vitaminE: 40 },
    komposisi: ['Bungkil Kedelai', 'Dedak Padi', 'Jagung', 'Bungkil Kelapa', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Vitamin & Mineral Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersamaan pemerahan',
      dosis: '1 kg per 2–2,5 liter produksi + 2 kg basal/ekor/hari',
      targetPenggunaan: 'Sapi perah binaan koperasi susu dan peternak BUMN',
      catatan: 'Diprioritaskan untuk anggota koperasi susu binaan Berdikari dan program ketahanan pangan nasional.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Berdikari (Persero)', negaraAsal: 'Indonesia' },
    updatedAt: '2026-02-20',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['bd-s2'], seriId: KONSENTRAT_SERI_UUID['bd-s2'], brandId: KONSENTRAT_MEREK_UUID['berdikari'],
    namaBrand: 'Berdikari', namaProduk: 'Konsentrat Sapi Potong Berdikari S2', namaSeri: 'Berdikari S2',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 67, lemakKasar: 4.0, seratKasar: 13, abu: 10, kalsium: 1.1, fosfor: 0.80, kadarAir: 12, garam: 0.5, vitaminA: 5000, vitaminE: 25 },
    komposisi: ['Jagung', 'Dedak Padi', 'Bungkil Kedelai', 'Bungkil Kelapa', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan atau jerami, berikan 2× sehari',
      dosis: '3–4 kg/ekor/hari untuk sapi potong 300–500 kg',
      targetPenggunaan: 'Sapi potong di sentra peternakan program nasional BUMN',
      catatan: 'Didistribusikan melalui program pengembangan sapi potong nasional. Ketersediaan tergantung program distribusi Berdikari.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Berdikari (Persero)', negaraAsal: 'Indonesia' },
    updatedAt: '2026-02-20',
  },

  // ── Greenfeed ─────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['gf-gr1'], seriId: KONSENTRAT_SERI_UUID['gf-gr1'], brandId: KONSENTRAT_MEREK_UUID['greenfeed'],
    namaBrand: 'Greenfeed', namaProduk: 'Konsentrat Sapi Perah Greenfeed GR1', namaSeri: 'Greenfeed GR1',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 17, tdn: 69, lemakKasar: 4.0, seratKasar: 11, abu: 11, kalsium: 1.3, fosfor: 0.90, kadarAir: 12, garam: 0.5, vitaminA: 7000, vitaminD3: 1300, vitaminE: 42 },
    komposisi: ['Bungkil Kedelai', 'Jagung Vietnam', 'Dedak Padi', 'Bungkil Kelapa', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Vitamin & Mineral Premix Tropis'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersamaan pemerahan',
      dosis: '1 kg per 2–2,5 liter produksi + 2 kg basal/ekor/hari',
      targetPenggunaan: 'Sapi perah laktasi di iklim tropis Asia Tenggara',
      catatan: 'Formulasi Vietnam yang sudah terbukti untuk kondisi iklim tropis Asia Tenggara.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'Greenfeed Vietnam Corporation', negaraAsal: 'Vietnam', website: 'https://www.greenfeed.com.vn' },
    updatedAt: '2026-01-10',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['gf-gr2'], seriId: KONSENTRAT_SERI_UUID['gf-gr2'], brandId: KONSENTRAT_MEREK_UUID['greenfeed'],
    namaBrand: 'Greenfeed', namaProduk: 'Konsentrat Sapi Potong Greenfeed GR2', namaSeri: 'Greenfeed GR2',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 68, lemakKasar: 4.5, seratKasar: 12, abu: 9.5, kalsium: 1.1, fosfor: 0.78, kadarAir: 12, garam: 0.5, vitaminA: 5000, vitaminE: 28 },
    komposisi: ['Jagung', 'Dedak Padi', 'Bungkil Kedelai', 'Bungkil Kelapa Sawit', 'Tetes Tebu', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan atau jerami, berikan 2× sehari',
      dosis: '3–4 kg/ekor/hari untuk sapi potong 300–500 kg',
      targetPenggunaan: 'Sapi potong penggemukan di Asia Tenggara',
      catatan: 'Alternatif kompetitif dari produsen Vietnam dengan distribusi ke pasar Indonesia.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'Greenfeed Vietnam Corporation', negaraAsal: 'Vietnam', website: 'https://www.greenfeed.com.vn' },
    updatedAt: '2026-01-10',
  },

  // ── Cargill ───────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['ca-cow'], seriId: KONSENTRAT_SERI_UUID['ca-cow'], brandId: KONSENTRAT_MEREK_UUID['cargill'],
    namaBrand: 'Cargill', namaProduk: 'Konsentrat Sapi Perah Cargill OptiCow', namaSeri: 'OptiCow',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi (semua fase)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 19, tdn: 72, me: 2.88, lemakKasar: 5.5, seratKasar: 9, abu: 11, kalsium: 1.5, fosfor: 1.05, kadarAir: 12, garam: 0.5, vitaminA: 10000, vitaminD3: 1800, vitaminE: 60 },
    komposisi: ['Bungkil Kedelai (Bypass Protein)', 'Jagung', 'Bypass Fat (Rumen Protected)', 'Tepung Ikan Skandinavia (LT)', 'Dedak Padi', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Methionin Hidroksi Analog (MHA)', 'Lisin Terproteksi', 'Garam', 'Selenium Organik (Sel-Plex)', 'Vitamin A/D3/E', 'Mineral Premix Lengkap'],
    petunjukPenggunaan: {
      caraPemberian: 'Sistem TMR sangat direkomendasikan. Jika konvensional: 3× sehari bersamaan pemerahan.',
      dosis: '1 kg per 2 liter produksi + 2,5 kg maintenance/ekor/hari',
      targetPenggunaan: 'Sapi perah FH murni produksi tinggi (>15 liter/hari) di peternakan semi-komersial dan komersial',
      catatan: 'Standar internasional Cargill Animal Nutrition. Cocok untuk peternak yang menginvestasikan kualitas premium.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'Cargill Animal Nutrition', negaraAsal: 'Amerika Serikat', website: 'https://www.cargill.com' },
    catatan: 'Produk premium berbasis riset internasional. Teknologi bypass protein dan bypass fat terdepan di industri pakan global.',
    updatedAt: '2026-03-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['ca-beef'], seriId: KONSENTRAT_SERI_UUID['ca-beef'], brandId: KONSENTRAT_MEREK_UUID['cargill'],
    namaBrand: 'Cargill', namaProduk: 'Konsentrat Sapi Potong Cargill OptiBeef', namaSeri: 'OptiBeef',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan (Grower–Finisher)',
    bentukProduk: 'Pellet', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 73, me: 2.92, lemakKasar: 6.0, seratKasar: 9, abu: 9, kalsium: 1.0, fosfor: 0.80, kadarAir: 12, garam: 0.5, vitaminA: 6000, vitaminE: 35 },
    komposisi: ['Jagung', 'Bypass Fat Premium', 'Bungkil Kedelai', 'Dedak Padi', 'Bungkil Kanola', 'Mineral Mix Internasional', 'Garam', 'Vitamin A/D3/E'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan jerami atau silase berkualitas, berikan 2× sehari',
      dosis: '3–5 kg/ekor/hari sesuai fase dan bobot target, dikombinasikan dengan hijauan berkualitas',
      targetPenggunaan: 'Sapi potong premium (Wagyu, Angus, Simmental silangan) penggemukan dengan target marbling',
      catatan: 'Berdasarkan standar kualitas karkas internasional. Kandungan energi sangat tinggi — pantau kondisi rumen.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'Cargill Animal Nutrition', negaraAsal: 'Amerika Serikat', website: 'https://www.cargill.com' },
    catatan: 'Formula global Cargill untuk kualitas karkas premium. Dioptimalkan untuk marbling dan efisiensi pakan berstandar internasional.',
    updatedAt: '2026-03-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['ca-goat'], seriId: KONSENTRAT_SERI_UUID['ca-goat'], brandId: KONSENTRAT_MEREK_UUID['cargill'],
    namaBrand: 'Cargill', namaProduk: 'Konsentrat Kambing Cargill OptiGoat', namaSeri: 'OptiGoat',
    jenisProduk: 'Konsentrat Kambing', targetTernak: 'Kambing Potong & Perah', fasePemeliharaan: 'Penggemukan & Laktasi',
    bentukProduk: 'Pellet', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 16, tdn: 65, lemakKasar: 3.5, seratKasar: 13, abu: 10, kalsium: 1.1, fosfor: 0.75, kadarAir: 12, garam: 0.5, vitaminA: 6000, vitaminD3: 1000, vitaminE: 35 },
    komposisi: ['Jagung', 'Bungkil Kedelai', 'Dedak Padi', 'Bungkil Kanola', 'Mineral Mix Internasional', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan langsung atau campurkan dengan hijauan segar berkualitas',
      dosis: '0,3–0,6 kg/ekor/hari untuk kambing potong dan perah, sesuai produksi',
      targetPenggunaan: 'Kambing Boer, PE, Etawah silangan — potong dan perah Asia Tenggara',
      catatan: 'Berstandar riset global Cargill untuk kambing Asia Tenggara. Cocok untuk peternak yang menginginkan standar internasional.',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'Cargill Animal Nutrition', negaraAsal: 'Amerika Serikat', website: 'https://www.cargill.com' },
    updatedAt: '2026-02-10',
  },

  // ── SHS Feed ──────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['shs-dairy'], seriId: KONSENTRAT_SERI_UUID['shs-dairy'], brandId: KONSENTRAT_MEREK_UUID['shs-feed'],
    namaBrand: 'SHS Feed', namaProduk: 'Konsentrat Sapi Perah SHS Feed Dairy', namaSeri: 'SHS Dairy',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 16, tdn: 67, lemakKasar: 3.5, seratKasar: 12, abu: 11, kalsium: 1.3, fosfor: 0.88, kadarAir: 12, garam: 0.5, vitaminA: 6500, vitaminD3: 1100, vitaminE: 38 },
    komposisi: ['Dedak Padi Jawa', 'Bungkil Kedelai', 'Jagung Lokal', 'Bungkil Kacang Tanah', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Vitamin & Mineral Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersamaan pemerahan',
      dosis: '1 kg per 2,5 liter produksi + 1,5 kg basal/ekor/hari',
      targetPenggunaan: 'Sapi perah laktasi di Jawa Tengah dan Jawa Timur',
      catatan: 'Menggunakan bahan baku lokal Jawa sehingga harga terjangkau untuk peternak skala kecil-menengah.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Sinar Harapan Sejati', negaraAsal: 'Indonesia' },
    updatedAt: '2025-12-15',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['shs-beef'], seriId: KONSENTRAT_SERI_UUID['shs-beef'], brandId: KONSENTRAT_MEREK_UUID['shs-feed'],
    namaBrand: 'SHS Feed', namaProduk: 'Konsentrat Sapi Potong SHS Feed Beef', namaSeri: 'SHS Beef',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 14, tdn: 66, lemakKasar: 3.5, seratKasar: 13, abu: 10, kalsium: 1.0, fosfor: 0.75, kadarAir: 12, garam: 0.5, vitaminA: 5000, vitaminE: 25 },
    komposisi: ['Jagung Lokal', 'Dedak Padi Jawa', 'Bungkil Kedelai', 'Ampas Singkong', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan atau jerami padi, berikan 2× sehari',
      dosis: '2,5–3,5 kg/ekor/hari untuk sapi potong 250–450 kg',
      targetPenggunaan: 'Sapi potong lokal (PO, Bali) skala kecil-menengah di Jawa',
      catatan: 'Alternatif hemat untuk peternak yang mengutamakan efisiensi biaya dengan kualitas terjaga.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Sinar Harapan Sejati', negaraAsal: 'Indonesia' },
    updatedAt: '2025-12-15',
  },

  // ── HI-PRO ────────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['hp-dairy'], seriId: KONSENTRAT_SERI_UUID['hp-dairy'], brandId: KONSENTRAT_MEREK_UUID['hi-pro'],
    namaBrand: 'HI-PRO', namaProduk: 'Konsentrat Sapi Perah HI-PRO Dairy', namaSeri: 'HI-PRO Dairy',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi Produksi Tinggi',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 20, tdn: 72, me: 2.88, lemakKasar: 5.5, seratKasar: 9, abu: 11, kalsium: 1.5, fosfor: 1.05, kadarAir: 12, garam: 0.5, vitaminA: 10000, vitaminD3: 1800, vitaminE: 65 },
    komposisi: ['Bungkil Kedelai High Bypass', 'Jagung Kuning', 'Bypass Fat Premium', 'Tepung Ikan (LT)', 'Dedak Padi Fine', 'Methionin Hidroksi Analog', 'Lisin Terproteksi', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Selenium Organik', 'Vitamin A/D3/E', 'Mineral Premix HI-PRO'],
    petunjukPenggunaan: {
      caraPemberian: 'Sistem TMR direkomendasikan. Konvensional: 3× sehari bersamaan pemerahan.',
      dosis: '1 kg per 2 liter produksi + 2,5 kg maintenance/ekor/hari. Maksimal 12 kg/ekor/hari.',
      targetPenggunaan: 'Sapi perah FH murni produksi tinggi (>18 liter/hari) di peternakan intensif',
      catatan: 'Lini premium CP di atas seri CP reguler (CP 145). Bypass protein dan bypass fat jauh lebih tinggi dari CP 145.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Charoen Pokphand Indonesia', negaraAsal: 'Indonesia', website: 'https://www.cp.co.id' },
    catatan: 'Lini HI-PRO adalah tier premium Charoen Pokphand. Untuk hasil maksimal gunakan bersama silase jagung berkualitas tinggi.',
    updatedAt: '2026-05-10',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['hp-feedlot'], seriId: KONSENTRAT_SERI_UUID['hp-feedlot'], brandId: KONSENTRAT_MEREK_UUID['hi-pro'],
    namaBrand: 'HI-PRO', namaProduk: 'Konsentrat Sapi Potong HI-PRO Feedlot', namaSeri: 'HI-PRO Feedlot',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan Intensif (Feedlot)',
    bentukProduk: 'Pellet', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 74, me: 2.96, lemakKasar: 6.5, seratKasar: 8, abu: 8.5, kalsium: 1.0, fosfor: 0.80, kadarAir: 12, garam: 0.5, vitaminA: 6000, vitaminE: 38 },
    komposisi: ['Jagung Kuning', 'Bypass Fat Premium', 'Bungkil Kedelai', 'Dedak Padi', 'Bungkil Kelapa Sawit', 'Ampas Tebu Fermentasi', 'Mineral Mix HI-PRO', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Sistem feedlot intensif: campurkan dalam TMR atau berikan 3× sehari',
      dosis: '4–6 kg/ekor/hari untuk sapi feedlot >400 kg, dikombinasikan dengan jerami/silase',
      targetPenggunaan: 'Operasi feedlot skala besar (>100 ekor) dengan target ADG >1,2 kg/hari',
      catatan: 'Energi sangat tinggi untuk sistem feedlot intensif. Wajib monitoring kesehatan rumen secara berkala.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Charoen Pokphand Indonesia', negaraAsal: 'Indonesia', website: 'https://www.cp.co.id' },
    catatan: 'Dirancang khusus untuk operasi feedlot profesional skala besar. Diperlukan manajemen pakan yang ketat.',
    updatedAt: '2026-05-10',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['hp-breeding'], seriId: KONSENTRAT_SERI_UUID['hp-breeding'], brandId: KONSENTRAT_MEREK_UUID['hi-pro'],
    namaBrand: 'HI-PRO', namaProduk: 'Konsentrat Induk HI-PRO Breeding', namaSeri: 'HI-PRO Breeding',
    jenisProduk: 'Konsentrat Induk & Breeding', targetTernak: 'Sapi Potong & Perah — Induk', fasePemeliharaan: 'Bunting & Breeding (Persiapan Reproduksi)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 16, tdn: 68, lemakKasar: 4.0, seratKasar: 12, abu: 11, kalsium: 1.4, fosfor: 0.95, kadarAir: 12, garam: 0.5, vitaminA: 12000, vitaminD3: 2000, vitaminE: 80 },
    komposisi: ['Bungkil Kedelai', 'Dedak Padi', 'Jagung', 'Vitamin E High Dose', 'Selenium Organik', 'Asam Folat', 'Beta Karoten', 'Zinc', 'Mangan', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Vitamin A/D3/E', 'Mineral Premix Reproduksi'],
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersama hijauan berkualitas tinggi',
      dosis: '2–3 kg/ekor/hari untuk induk bunting dan breeding, dikombinasikan dengan 20 kg hijauan',
      targetPenggunaan: 'Sapi induk fase pra-birahi, IB, bunting, dan 60 hari pre-partum',
      catatan: 'Vitamin E dan selenium sangat tinggi untuk fertilitas dan mencegah retensi plasenta. Konsultasikan dosis dengan dokter hewan.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Charoen Pokphand Indonesia', negaraAsal: 'Indonesia', website: 'https://www.cp.co.id' },
    catatan: 'Satu-satunya seri HI-PRO yang tidak fokus pada produksi. Fokus pada reproduksi: fertilitas, kebuntingan, dan kualitas pedet.',
    updatedAt: '2026-05-10',
  },

  // ── Bonavite ──────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['bv-laktasi'], seriId: KONSENTRAT_SERI_UUID['bv-laktasi'], brandId: KONSENTRAT_MEREK_UUID['bonavite'],
    namaBrand: 'Bonavite', namaProduk: 'Konsentrat Vitamin-Mineral Bonavite Laktasi', namaSeri: 'Bonavite Laktasi',
    jenisProduk: 'Konsentrat Vitamin-Mineral (Premix)', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi',
    bentukProduk: 'Powder', statusProduksi: 'Aktif',
    nutrisi: { kalsium: 20.0, fosfor: 8.0, kadarAir: 8, vitaminA: 150000, vitaminD3: 30000, vitaminE: 500, catatanNutrisi: 'Konsentrat vitamin-mineral pekat — digunakan sebagai suplementasi, bukan sumber energi/protein utama. Kadar Ca dan P sangat tinggi karena ini adalah premix.' },
    komposisi: ['Kalsium Karbonat', 'Dikalsium Fosfat', 'Magnesium Oksida', 'Zinc Sulfat', 'Mangan Sulfat', 'Kuprum Sulfat', 'Selenium (Selenat)', 'Vitamin A (Retinyl Acetate)', 'Vitamin D3', 'Vitamin E (dl-Alpha Tocopheryl)', 'Biotin', 'Niasin', 'Vitamin B12'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan merata ke dalam konsentrat energi-protein atau TMR sebelum pemberian',
      dosis: '100–150 gram/ekor/hari untuk sapi perah laktasi (jangan melebihi dosis)',
      targetPenggunaan: 'Sapi perah laktasi sebagai suplementasi vitamin-mineral di atas konsentrat utama',
      catatan: 'Ini adalah PREMIX — bukan pengganti konsentrat utama. Harus dikombinasikan dengan sumber energi dan protein.',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Bonafit Nutrisi Indonesia', negaraAsal: 'Indonesia' },
    catatan: 'Cocok untuk melengkapi ransum yang kurang Ca:P atau sebagai suplementasi vitamin untuk meningkatkan produksi dan kualitas susu.',
    updatedAt: '2026-04-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['bv-maintenance'], seriId: KONSENTRAT_SERI_UUID['bv-maintenance'], brandId: KONSENTRAT_MEREK_UUID['bonavite'],
    namaBrand: 'Bonavite', namaProduk: 'Konsentrat Vitamin-Mineral Bonavite Maintenance', namaSeri: 'Bonavite Maintenance',
    jenisProduk: 'Konsentrat Vitamin-Mineral (Premix)', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Masa Kering & Periparturien',
    bentukProduk: 'Powder', statusProduksi: 'Aktif',
    nutrisi: { kalsium: 8.0, fosfor: 5.0, kadarAir: 8, vitaminA: 120000, vitaminD3: 25000, vitaminE: 800, catatanNutrisi: 'Premix khusus masa kering — Ca rendah untuk mencegah milk fever postpartum. Vitamin E sangat tinggi untuk kesehatan periparturien.' },
    komposisi: ['Magnesium Oksida (Tinggi)', 'Selenium Organik', 'Zinc Organik (Zinpro)', 'Vitamin E Premium', 'Vitamin A', 'Vitamin D3', 'Biotin', 'Kolin Klorida', 'Asam Folat', 'Dikalsium Fosfat (Rendah Ca)'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan merata ke dalam konsentrat atau TMR masa kering',
      dosis: '100–150 gram/ekor/hari pada masa kering (2–8 minggu sebelum beranak)',
      targetPenggunaan: 'Sapi perah masa kering kandang dan 2–3 minggu periparturien pre-partum',
      catatan: 'Fokus pada pencegahan milk fever (Ca rendah), ketosis (Kolin), dan retensi plasenta (Se, Vit E). JANGAN berikan pada sapi laktasi normal.',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Bonafit Nutrisi Indonesia', negaraAsal: 'Indonesia' },
    catatan: 'Formulasi khusus periparturien: Ca rendah untuk mencegah milk fever, vitamin E dan selenium sangat tinggi untuk sistem imun dan reproduksi.',
    updatedAt: '2026-04-01',
  },

  // ── Turbo Feed ────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['tb-starter'], seriId: KONSENTRAT_SERI_UUID['tb-starter'], brandId: KONSENTRAT_MEREK_UUID['turbo-feed'],
    namaBrand: 'Turbo Feed', namaProduk: 'Konsentrat Penggemukan Turbo Feed Starter', namaSeri: 'Turbo Starter',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan — Fase Starter (200–300 kg)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 18, tdn: 67, lemakKasar: 4.0, seratKasar: 13, abu: 10, kalsium: 1.2, fosfor: 0.85, kadarAir: 12, garam: 0.5, vitaminA: 6000, vitaminD3: 1000, vitaminE: 35 },
    komposisi: ['Bungkil Kedelai', 'Dedak Padi', 'Jagung', 'Bungkil Kelapa Sawit', 'Buffer Rumen (NaHCO3)', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan segar, berikan 2× sehari. Sediakan air minum bebas.',
      dosis: '2–3 kg/ekor/hari untuk sapi 200–300 kg, dikombinasikan dengan 20–25 kg hijauan',
      targetPenggunaan: 'Sapi potong awal masuk penggemukan intensif, bobot 200–300 kg',
      catatan: 'Mengandung buffer rumen (NaHCO3) untuk membantu adaptasi terhadap pakan berenergi tinggi. Naikkan dosis bertahap selama 2 minggu pertama.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Turbo Pakan Nusantara', negaraAsal: 'Indonesia' },
    updatedAt: '2026-03-10',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['tb-grower'], seriId: KONSENTRAT_SERI_UUID['tb-grower'], brandId: KONSENTRAT_MEREK_UUID['turbo-feed'],
    namaBrand: 'Turbo Feed', namaProduk: 'Konsentrat Penggemukan Turbo Feed Grower', namaSeri: 'Turbo Grower',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan — Fase Grower (300–450 kg)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 71, me: 2.84, lemakKasar: 5.0, seratKasar: 11, abu: 9.5, kalsium: 1.1, fosfor: 0.80, kadarAir: 12, garam: 0.5, vitaminA: 5500, vitaminE: 30 },
    komposisi: ['Jagung', 'Dedak Padi', 'Bungkil Kedelai', 'Bungkil Kelapa Sawit', 'Lemak Nabati', 'Ampas Singkong', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan atau jerami berkualitas, berikan 2× sehari',
      dosis: '3,5–4,5 kg/ekor/hari untuk sapi 300–450 kg, target ADG >1,2 kg/hari',
      targetPenggunaan: 'Sapi potong fase grower intensif, bobot 300–450 kg',
      catatan: 'Energi tinggi untuk memaksimalkan ADG pada fase pertumbuhan aktif. Monitor kondisi rumen setiap minggu.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Turbo Pakan Nusantara', negaraAsal: 'Indonesia' },
    updatedAt: '2026-03-10',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['tb-finisher'], seriId: KONSENTRAT_SERI_UUID['tb-finisher'], brandId: KONSENTRAT_MEREK_UUID['turbo-feed'],
    namaBrand: 'Turbo Feed', namaProduk: 'Konsentrat Penggemukan Turbo Feed Finisher', namaSeri: 'Turbo Finisher',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan — Fase Finisher (>450 kg)',
    bentukProduk: 'Pellet', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 13, tdn: 74, me: 2.96, lemakKasar: 6.5, seratKasar: 9, abu: 8.5, kalsium: 0.9, fosfor: 0.75, kadarAir: 12, garam: 0.5, vitaminA: 5000, vitaminE: 28 },
    komposisi: ['Jagung', 'Lemak Nabati (By-pass Fat Tinggi)', 'Dedak Padi', 'Bungkil Kedelai', 'Bungkil Kelapa Sawit', 'Tetes Tebu', 'Ampas Tebu Fermentasi', 'Mineral Mix', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan jerami kering atau silase jagung, berikan 2× sehari',
      dosis: '4–6 kg/ekor/hari untuk sapi >450 kg, dikombinasikan dengan jerami 12–15 kg',
      targetPenggunaan: 'Sapi potong 60 hari terakhir sebelum panen, bobot >450 kg',
      catatan: 'Energi sangat tinggi — transisi bertahap dari Turbo Grower (7–10 hari). Bentuk pellet memudahkan konsumsi dan mengurangi pemilahan.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Turbo Pakan Nusantara', negaraAsal: 'Indonesia' },
    catatan: 'Gunakan secara berurutan: Turbo Starter → Turbo Grower → Turbo Finisher untuk hasil penggemukan intensif optimal.',
    updatedAt: '2026-03-10',
  },

  // ── Royal Feed ────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['rf-dairy'], seriId: KONSENTRAT_SERI_UUID['rf-dairy'], brandId: KONSENTRAT_MEREK_UUID['royal-feed'],
    namaBrand: 'Royal Feed', namaProduk: 'Konsentrat Premium Sapi Perah Royal Feed Dairy', namaSeri: 'Royal Dairy',
    jenisProduk: 'Konsentrat Sapi Perah Premium', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi Produksi Tinggi',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 21, tdn: 73, me: 2.92, lemakKasar: 6.0, seratKasar: 8, abu: 10.5, kalsium: 1.5, fosfor: 1.1, kadarAir: 12, garam: 0.5, vitaminA: 12000, vitaminD3: 2000, vitaminE: 75 },
    komposisi: ['Bungkil Kedelai Premium (High Bypass)', 'Jagung Import', 'Bypass Fat Premium (C16)', 'Tepung Ikan Skandinavia (LT 65%)', 'Methionin Hidroksi Analog', 'Lisin Terproteksi', 'Kalsium Karbonat', 'Dikalsium Fosfat', 'Garam', 'Selenium Organik Premium', 'Vitamin A/D3/E Premium', 'Mineral Premix Komplet'],
    petunjukPenggunaan: {
      caraPemberian: 'Sistem TMR wajib untuk produksi optimal. Tanpa TMR: 3× sehari bersamaan pemerahan.',
      dosis: '1 kg per 1,8–2 liter produksi + 3 kg maintenance/ekor/hari',
      targetPenggunaan: 'Sapi perah FH produksi sangat tinggi (>22 liter/hari) di peternakan intensif kelas atas',
      catatan: 'Semua bahan baku dipilih dari kelas premium (impor). Untuk hasil maksimal, pantau BCS ketat dan gunakan bersama program kesehatan ternak terstruktur.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Royal Pakan Internasional', negaraAsal: 'Indonesia' },
    catatan: 'Konsentrat paling premium dalam database ini. Diperuntukkan peternak sapi perah kelas atas yang mengejar produksi dan kualitas susu maksimal.',
    updatedAt: '2026-02-10',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['rf-beef'], seriId: KONSENTRAT_SERI_UUID['rf-beef'], brandId: KONSENTRAT_MEREK_UUID['royal-feed'],
    namaBrand: 'Royal Feed', namaProduk: 'Konsentrat Premium Sapi Potong Royal Feed Beef', namaSeri: 'Royal Beef',
    jenisProduk: 'Konsentrat Sapi Potong Premium', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan Premium — Target Marbling Tinggi',
    bentukProduk: 'Pellet', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 14, tdn: 75, me: 3.00, lemakKasar: 7.0, seratKasar: 8, abu: 8, kalsium: 0.9, fosfor: 0.75, kadarAir: 12, garam: 0.5, vitaminA: 7000, vitaminE: 45 },
    komposisi: ['Jagung Import', 'Bypass Fat C16 Premium', 'Bungkil Kedelai', 'Tetes Tebu Kualitas Tinggi', 'Bungkil Kelapa Sawit', 'Zinc Organik', 'Vitamin E Premium', 'Mineral Mix Premium', 'Garam', 'Vitamin Premix'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dalam TMR atau berikan 2–3× sehari dengan jerami berkualitas',
      dosis: '4–7 kg/ekor/hari untuk sapi premium >450 kg, dengan jerami Bermuda atau Rhodes grass',
      targetPenggunaan: 'Sapi potong premium (Wagyu F1/F2, Angus, Shorthorn) target marbling score >5',
      catatan: 'Energi tertinggi dalam database ini (TDN 75%). Wajib monitoring acidosis rumen. Direkomendasikan konsultasi ahli nutrisi sebelum menggunakan.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'PT Royal Pakan Internasional', negaraAsal: 'Indonesia' },
    catatan: 'Untuk produksi sapi potong premium (wagyu silangan). Energi sangat tinggi memerlukan manajemen feedlot profesional.',
    updatedAt: '2026-02-10',
  },

  // ── Yongbee ───────────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['yb-dairy'], seriId: KONSENTRAT_SERI_UUID['yb-dairy'], brandId: KONSENTRAT_MEREK_UUID['yongbee'],
    namaBrand: 'Yongbee', namaProduk: 'Konsentrat Asam Amino Yongbee Dairy', namaSeri: 'Yongbee Dairy',
    jenisProduk: 'Konsentrat Amino Acid (Premix)', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi',
    bentukProduk: 'Powder', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 45, kadarAir: 8, catatanNutrisi: 'Konsentrat asam amino terproteksi rumen — digunakan sebagai suplemen, bukan sumber energi utama. Protein sangat tinggi karena ini adalah amino acid concentrate.' },
    komposisi: ['Methionin Terproteksi Rumen (RPMet)', 'Lisin Terproteksi Rumen (RPLys)', 'Histidin Terproteksi', 'Isoleucin', 'Leusin', 'Carrier (Tepung Jagung)'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan merata ke dalam konsentrat utama atau TMR sebelum pemberian',
      dosis: '50–100 gram/ekor/hari sebagai suplemen amino acid pada ransum defisit methionin dan lisin',
      targetPenggunaan: 'Sapi perah FH produksi tinggi yang rancangan ransumnya defisit asam amino esensial',
      catatan: 'Digunakan sebagai SUPLEMEN di atas konsentrat protein utama. Identifikasi defisit asam amino terlebih dahulu melalui analisis ransum sebelum penggunaan.',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'Yongbee Animal Nutrition', negaraAsal: 'Korea Selatan' },
    catatan: 'Teknologi RPAA (Rumen Protected Amino Acid) Korea. Efektif meningkatkan efisiensi sintesis protein susu pada ransum yang sudah seimbang energi-N.',
    updatedAt: '2026-01-15',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['yb-beef'], seriId: KONSENTRAT_SERI_UUID['yb-beef'], brandId: KONSENTRAT_MEREK_UUID['yongbee'],
    namaBrand: 'Yongbee', namaProduk: 'Konsentrat Asam Amino Yongbee Beef', namaSeri: 'Yongbee Beef',
    jenisProduk: 'Konsentrat Amino Acid (Premix)', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan',
    bentukProduk: 'Powder', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 40, kadarAir: 8, catatanNutrisi: 'Konsentrat asam amino terproteksi rumen untuk sapi potong — digunakan sebagai suplemen. Protein sangat tinggi karena ini adalah amino acid concentrate.' },
    komposisi: ['Methionin Terproteksi Rumen', 'Lisin Terproteksi Rumen', 'Threonin', 'Triptofan', 'Carrier (Tepung Jagung)'],
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan ke dalam konsentrat utama atau TMR',
      dosis: '40–80 gram/ekor/hari sebagai suplemen amino acid untuk sapi potong penggemukan',
      targetPenggunaan: 'Sapi potong feedlot dengan ransum berenergi tinggi yang perlu penyeimbangan asam amino',
      catatan: 'Teknologi RPAA untuk meningkatkan efisiensi konversi protein menjadi massa otot. Idealnya digunakan setelah analisis ransum.',
    },
    kemasan: [{ berat: '25 kg', keterangan: 'Karung standar' }],
    produsen: { nama: 'Yongbee Animal Nutrition', negaraAsal: 'Korea Selatan' },
    catatan: 'Suplemen amino acid terproteksi rumen untuk meningkatkan efisiensi pertumbuhan otot pada sapi potong penggemukan intensif.',
    updatedAt: '2026-01-15',
  },

  // ── Feedmill Regional ─────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['fr-perah'], seriId: KONSENTRAT_SERI_UUID['fr-perah'], brandId: KONSENTRAT_MEREK_UUID['feedmill-regional'],
    namaBrand: 'Feedmill Regional', namaProduk: 'Konsentrat Sapi Perah Feedmill Regional', namaSeri: 'Konsentrat Sapi Perah Regional',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 65, lemakKasar: 3.5, seratKasar: 13, abu: 11, kalsium: 1.2, fosfor: 0.85, kadarAir: 13, garam: 0.6, catatanNutrisi: 'Nilai nutrisi dapat bervariasi antar produsen regional. Data ini adalah estimasi rata-rata.' },
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersamaan pemerahan',
      dosis: '1 kg per 2,5–3 liter produksi + 1,5 kg basal/ekor/hari (sesuaikan dengan label produsen)',
      targetPenggunaan: 'Sapi perah laktasi di wilayah operasional feedmill regional tersebut',
      catatan: 'Kualitas dan formulasi bervariasi antar produsen regional. Minta kartu nutrisi resmi dari produsen sebelum penggunaan.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }, { berat: '40 kg', keterangan: 'Ukuran alternatif (tergantung produsen)' }],
    produsen: { nama: 'Berbagai Pabrik Pakan Regional', negaraAsal: 'Indonesia' },
    catatan: 'Produk kategori ini berasal dari berbagai feedmill regional dengan kualitas bervariasi. Pilih berdasarkan reputasi lokal dan minta kartu nutrisi resmi.',
    updatedAt: '2025-12-01',
  },

  {
    uuid: KONSENTRAT_DETAIL_UUID['fr-potong'], seriId: KONSENTRAT_SERI_UUID['fr-potong'], brandId: KONSENTRAT_MEREK_UUID['feedmill-regional'],
    namaBrand: 'Feedmill Regional', namaProduk: 'Konsentrat Sapi Potong Feedmill Regional', namaSeri: 'Konsentrat Sapi Potong Regional',
    jenisProduk: 'Konsentrat Sapi Potong', targetTernak: 'Sapi Potong', fasePemeliharaan: 'Penggemukan',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 13, tdn: 64, lemakKasar: 3.0, seratKasar: 14, abu: 10, kalsium: 1.0, fosfor: 0.75, kadarAir: 13, garam: 0.6, catatanNutrisi: 'Nilai nutrisi dapat bervariasi antar produsen regional. Data ini adalah estimasi rata-rata.' },
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan atau jerami, berikan 2× sehari',
      dosis: '2,5–3,5 kg/ekor/hari (sesuaikan dengan label produsen)',
      targetPenggunaan: 'Sapi potong lokal penggemukan di wilayah operasional feedmill',
      catatan: 'Kualitas bervariasi antar produsen regional. Prioritaskan harga dan ketersediaan lokal dengan kualitas yang dapat diverifikasi.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }, { berat: '40 kg', keterangan: 'Ukuran alternatif (tergantung produsen)' }],
    produsen: { nama: 'Berbagai Pabrik Pakan Regional', negaraAsal: 'Indonesia' },
    catatan: 'Alternatif ekonomis untuk peternak yang mengutamakan ketersediaan lokal dan biaya rendah. Minta kartu nutrisi dari produsen.',
    updatedAt: '2025-12-01',
  },

  // ── Feedmill Koperasi ─────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['fk-perah'], seriId: KONSENTRAT_SERI_UUID['fk-perah'], brandId: KONSENTRAT_MEREK_UUID['feedmill-koperasi'],
    namaBrand: 'Feedmill Koperasi', namaProduk: 'Konsentrat Sapi Perah Feedmill Koperasi', namaSeri: 'Konsentrat Koperasi Sapi Perah',
    jenisProduk: 'Konsentrat Sapi Perah', targetTernak: 'Sapi Perah', fasePemeliharaan: 'Laktasi',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 15, tdn: 65, lemakKasar: 3.5, seratKasar: 13, abu: 11, kalsium: 1.2, fosfor: 0.85, kadarAir: 13, garam: 0.6, catatanNutrisi: 'Nilai nutrisi dikontrol koperasi. Minta kartu nutrisi resmi dari koperasi setempat.' },
    petunjukPenggunaan: {
      caraPemberian: 'Berikan 2× sehari bersamaan pemerahan',
      dosis: '1 kg per 2,5 liter produksi + 1,5 kg basal/ekor/hari',
      targetPenggunaan: 'Anggota koperasi sapi perah di wilayah operasional koperasi',
      catatan: 'Dipasarkan eksklusif untuk anggota koperasi. Hubungi koperasi setempat untuk ketersediaan dan harga.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar koperasi' }],
    produsen: { nama: 'Berbagai Koperasi Peternak', negaraAsal: 'Indonesia' },
    catatan: 'Kualitas dikontrol koperasi setempat. Harga biasanya lebih kompetitif untuk anggota koperasi karena tidak ada margin distributor.',
    updatedAt: '2025-11-30',
  },

  // ── Feedmill UMKM ─────────────────────────────────────────────────────────

  {
    uuid: KONSENTRAT_DETAIL_UUID['fu-sapi'], seriId: KONSENTRAT_SERI_UUID['fu-sapi'], brandId: KONSENTRAT_MEREK_UUID['feedmill-umkm'],
    namaBrand: 'Feedmill UMKM', namaProduk: 'Konsentrat Sapi Feedmill UMKM', namaSeri: 'Konsentrat Sapi UMKM',
    jenisProduk: 'Konsentrat Sapi (Perah & Potong)', targetTernak: 'Sapi Perah & Sapi Potong', fasePemeliharaan: 'Semua Fase (bervariasi per produsen)',
    bentukProduk: 'Mash', statusProduksi: 'Aktif',
    nutrisi: { proteinKasar: 13, tdn: 62, lemakKasar: 3.0, seratKasar: 15, abu: 11, kalsium: 1.0, fosfor: 0.70, kadarAir: 13, garam: 0.7, catatanNutrisi: 'Nilai nutrisi sangat bervariasi antar UMKM. Data ini adalah estimasi minimum. Selalu minta kartu nutrisi dari produsen UMKM.' },
    petunjukPenggunaan: {
      caraPemberian: 'Campurkan dengan hijauan segar yang berkualitas, berikan 2× sehari',
      dosis: 'Sesuaikan dengan label produsen UMKM yang bersangkutan',
      targetPenggunaan: 'Sapi perah dan potong di wilayah pasar lokal UMKM tersebut',
      catatan: 'PENTING: Kualitas dan formulasi SANGAT bervariasi antar UMKM. Selalu minta sertifikat analisis (CoA) atau kartu nutrisi sebelum pembelian dalam jumlah besar.',
    },
    kemasan: [{ berat: '50 kg', keterangan: 'Karung standar' }, { berat: '25 kg', keterangan: 'Ukuran kecil (tergantung UMKM)' }],
    produsen: { nama: 'Berbagai UMKM Pakan Lokal', negaraAsal: 'Indonesia' },
    catatan: 'Pilihan paling hemat. Risiko variasi kualitas tinggi. Verifikasi kualitas sebelum pembelian besar dengan meminta CoA atau analisis proksimat.',
    updatedAt: '2025-11-15',
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

/** Ambil detail produk berdasarkan seriId (UUID seri parent). */
export function getKonsentratDetailBySeriId(seriId: string): KonsentratDetail | undefined {
  return KONSENTRAT_DETAIL_LIST.find(d => d.seriId === seriId);
}

/** Ambil detail produk berdasarkan UUID record detail itu sendiri. */
export function getKonsentratDetailByUUID(uuid: string): KonsentratDetail | undefined {
  return KONSENTRAT_DETAIL_LIST.find(d => d.uuid === uuid);
}

// ─── CRUD — Living Database (PK-009) ───────────────────────────────────────────
// Mencakup Detail Produk, Nutrisi, Komposisi, Kemasan, Produsen, Distributor,
// dan Dokumen Pendukung — seluruhnya adalah field dari satu record
// KonsentratDetail. Hanya Admin yang dapat menambah/mengubah/menghapus.

export type BaruKonsentratDetail = Omit<KonsentratDetail, 'uuid' | 'updatedAt'> & { uuid?: string };

/** Tambah record Detail Produk baru ke Living Database. */
export function addKonsentratDetail(data: BaruKonsentratDetail, catatan?: string): KonsentratDetail {
  assertAdmin('menambah Detail Produk');
  const uuid = data.uuid ?? crypto.randomUUID();
  const detail: KonsentratDetail = { ...data, uuid, updatedAt: todayISO() };
  KONSENTRAT_DETAIL_LIST.push(detail);
  logRiwayat({ entityType: 'Detail Produk', entityId: uuid, entityLabel: detail.namaProduk, jenisPerubahan: 'Tambah', catatan, after: detail, brandId: detail.brandId });
  return detail;
}

/**
 * Ubah record Detail Produk. `jenisEntitas` menentukan label riwayat sesuai
 * bagian yang benar-benar diubah (Nutrisi/Komposisi/Kemasan/Produsen/
 * Distributor/Dokumen Pendukung/Detail Produk umum) — default 'Detail Produk'.
 */
export function updateKonsentratDetail(
  uuid: string,
  patch: Partial<Omit<KonsentratDetail, 'uuid'>>,
  options?: { catatan?: string; jenisEntitas?: 'Detail Produk' | 'Nutrisi' | 'Komposisi' | 'Kemasan' | 'Produsen' | 'Distributor' | 'Dokumen Pendukung' },
): KonsentratDetail | undefined {
  assertAdmin('mengubah Detail Produk');
  const idx = KONSENTRAT_DETAIL_LIST.findIndex(d => d.uuid === uuid);
  if (idx === -1) return undefined;
  const before = KONSENTRAT_DETAIL_LIST[idx];
  const after: KonsentratDetail = { ...before, ...patch, uuid, updatedAt: todayISO() };
  KONSENTRAT_DETAIL_LIST[idx] = after;
  const statusOnly = patch.statusProduksi !== undefined && Object.keys(patch).every(k => k === 'statusProduksi');
  logRiwayat({
    entityType: options?.jenisEntitas ?? 'Detail Produk',
    entityId: uuid, entityLabel: after.namaProduk,
    jenisPerubahan: statusOnly ? 'Ubah Status' : 'Ubah',
    catatan: options?.catatan,
    before, after, brandId: after.brandId,
  });
  return after;
}

/** Hapus record Detail Produk secara permanen. Riwayat tetap menyimpan jejak. */
export function deleteKonsentratDetail(uuid: string, catatan?: string): boolean {
  assertAdmin('menghapus Detail Produk');
  const idx = KONSENTRAT_DETAIL_LIST.findIndex(d => d.uuid === uuid);
  if (idx === -1) return false;
  const [removed] = KONSENTRAT_DETAIL_LIST.splice(idx, 1);
  logRiwayat({ entityType: 'Detail Produk', entityId: uuid, entityLabel: removed.namaProduk, jenisPerubahan: 'Hapus', catatan, before: removed, brandId: removed.brandId });
  return true;
}
