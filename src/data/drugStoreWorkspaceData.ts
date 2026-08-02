// ─── Drug Store Workspace Data — WORKSPACE-001F ────────────────────────────────
// Operational data layer for DrugStore Workspace (Toko Obat Hewan).
//
// Scope: Store profile, product catalog (obat hewan), batch/expiry tracking,
//        activity history, and dummy transaction data.
//
// Architecture rules:
//  - Does NOT modify Master Obat, Stok Obat, or Marketplace modules.
//  - NO real checkout, NO payment, NO inventory sync.
//  - All prices are display-only placeholders.
//  - Expiry dates and batch numbers are dummy data only.

// ─── Product Categories ───────────────────────────────────────────────────────

export type DrugProductCategory =
  | 'Antibiotik'
  | 'Vitamin & Suplemen'
  | 'Vaksin'
  | 'Antiparasit'
  | 'Analgesik & Antiinflamasi'
  | 'Desinfektan & Biosekuriti'
  | 'Hormon & Reproduksi'
  | 'Peralatan Medis';

export const DRUG_PRODUCT_CATEGORIES: DrugProductCategory[] = [
  'Antibiotik',
  'Vitamin & Suplemen',
  'Vaksin',
  'Antiparasit',
  'Analgesik & Antiinflamasi',
  'Desinfektan & Biosekuriti',
  'Hormon & Reproduksi',
  'Peralatan Medis',
];

export const DRUG_CATEGORY_CONFIG: Record<
  DrugProductCategory,
  { icon: string; color: string; bg: string; description: string }
> = {
  'Antibiotik': {
    icon: '💊',
    color: '#0097a7',
    bg: '#e0f7fa',
    description: 'Antibiotik broad-spectrum dan narrow-spectrum untuk ternak',
  },
  'Vitamin & Suplemen': {
    icon: '🌿',
    color: '#00796b',
    bg: '#e0f2f1',
    description: 'Vitamin, mineral, dan suplemen pendukung kesehatan ternak',
  },
  'Vaksin': {
    icon: '💉',
    color: '#1565c0',
    bg: '#e3f2fd',
    description: 'Vaksin pencegah penyakit infeksius pada ternak',
  },
  'Antiparasit': {
    icon: '🔬',
    color: '#6a1b9a',
    bg: '#f3e5f5',
    description: 'Obat cacing, antiprotozoa, dan ektoparasitisid',
  },
  'Analgesik & Antiinflamasi': {
    icon: '🩺',
    color: '#c62828',
    bg: '#ffebee',
    description: 'Pereda nyeri dan penurun demam untuk ternak sakit',
  },
  'Desinfektan & Biosekuriti': {
    icon: '🧴',
    color: '#558b2f',
    bg: '#f1f8e9',
    description: 'Disinfektan kandang, sanitasi peralatan, dan biosekuriti',
  },
  'Hormon & Reproduksi': {
    icon: '🧬',
    color: '#f57f17',
    bg: '#fffde7',
    description: 'Hormon sinkronisasi birahi, terapi reproduksi, dan support kelahiran',
  },
  'Peralatan Medis': {
    icon: '🔧',
    color: '#37474f',
    bg: '#eceff1',
    description: 'Jarum suntik, infus set, spuit, dan peralatan medis lainnya',
  },
};

// ─── Product Availability ─────────────────────────────────────────────────────

export type DrugProductAvailability = 'Tersedia' | 'Stok Terbatas' | 'Habis';

export const DRUG_AVAILABILITY_CONFIG: Record<
  DrugProductAvailability,
  { icon: string; color: string; bg: string; border: string }
> = {
  Tersedia:        { icon: '✅', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  'Stok Terbatas': { icon: '⚠️', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  Habis:           { icon: '🚫', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};

// ─── Expiry Status ────────────────────────────────────────────────────────────

export type ExpiryStatus = 'Aman' | 'Mendekati Kedaluwarsa' | 'Kedaluwarsa';

export function getExpiryStatus(tanggalKedaluwarsa: string): ExpiryStatus {
  const today = new Date();
  const expiry = new Date(tanggalKedaluwarsa);
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Kedaluwarsa';
  if (diffDays <= 30) return 'Mendekati Kedaluwarsa';
  return 'Aman';
}

export function formatExpiryDate(tanggalKedaluwarsa: string): string {
  const [y, m, d] = tanggalKedaluwarsa.split('-');
  const bulanNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${d} ${bulanNames[parseInt(m, 10) - 1]} ${y}`;
}

export const EXPIRY_STATUS_CONFIG: Record<
  ExpiryStatus,
  { color: string; bg: string; border: string; icon: string }
> = {
  'Aman':                   { color: '#166534', bg: '#dcfce7', border: '#86efac',  icon: '✅' },
  'Mendekati Kedaluwarsa':  { color: '#b45309', bg: '#fffbeb', border: '#fbbf24',  icon: '⏰' },
  'Kedaluwarsa':            { color: '#991b1b', bg: '#fee2e2', border: '#fca5a5',  icon: '❌' },
};

// ─── Product Record ───────────────────────────────────────────────────────────

export interface DrugStoreProductRecord {
  id: string;
  workspaceId: string;
  namaProduk: string;
  kategori: DrugProductCategory;
  satuan: string;
  ketersediaan: DrugProductAvailability;
  hargaPlaceholder: string;
  deskripsiSingkat: string;
  noRegistrasi: string;
  noBatch: string;
  tanggalKedaluwarsa: string; // ISO yyyy-mm-dd
  suhuPenyimpanan: string;
  targetTernak: string[];
}

// ─── Workspace Meta ───────────────────────────────────────────────────────────

export interface DrugStoreWorkspaceMeta {
  workspaceId: string;
  nama: string;
  logo: string;
  deskripsi: string;
  lokasiUmum: string;
  kontakPublik: string;
  bergabungSejak: string;
  jamOperasional: string;
  apotekerPenanggungJawab: string;
  noSIPT: string; // Surat Izin Penyalur/Toko Obat
}

// ─── Seed Data — Workspace Meta ───────────────────────────────────────────────

const DSW_WORKSPACE_META: DrugStoreWorkspaceMeta[] = [
  {
    workspaceId: 'w-drug-001',
    nama: 'Apotek Hewan Sehat',
    logo: '💊',
    deskripsi:
      'Toko obat hewan terpercaya di Bandung. Menyediakan antibiotik, vaksin, antiparasit, vitamin, dan perlengkapan medis ternak berkualitas. Produk resmi terdaftar di Ditjen PKH. Melayani peternak mandiri, klinik hewan, dan kelompok tani.',
    lokasiUmum: 'Bandung, Jawa Barat',
    kontakPublik: '+62 811-2233-4455',
    bergabungSejak: '2025-05-01',
    jamOperasional: 'Senin–Sabtu 08.00–17.00 WIB',
    apotekerPenanggungJawab: 'Apt. Rini Kusumastuti, S.Farm',
    noSIPT: 'SIPT-JB-2025-0419',
  },
];

// ─── Seed Data — Product Catalog ──────────────────────────────────────────────

const DSW_PRODUCT_DB: DrugStoreProductRecord[] = [
  // ── Antibiotik ──
  {
    id: 'DSW-PRD-001',
    workspaceId: 'w-drug-001',
    namaProduk: 'Oxytetracycline 20% Injeksi (100 mL)',
    kategori: 'Antibiotik',
    satuan: 'botol 100 mL',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 85.000/botol',
    deskripsiSingkat: 'Antibiotik broad-spectrum untuk infeksi saluran pernafasan, pneumonia, dan infeksi sistemik pada sapi, kambing, dan babi.',
    noRegistrasi: 'KEMENTAN RI No. D1509374',
    noBatch: 'OTC-2025-B12',
    tanggalKedaluwarsa: '2027-03-31',
    suhuPenyimpanan: 'Simpan di bawah 25°C, hindarkan dari cahaya langsung',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Babi'],
  },
  {
    id: 'DSW-PRD-002',
    workspaceId: 'w-drug-001',
    namaProduk: 'Amoksisilin 15% Injeksi (50 mL)',
    kategori: 'Antibiotik',
    satuan: 'vial 50 mL',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 65.000/vial',
    deskripsiSingkat: 'Antibiotik penisilin spektrum luas untuk infeksi bakteri gram positif dan gram negatif. Efektif untuk mastitis, pneumonia, dan luka terinfeksi.',
    noRegistrasi: 'KEMENTAN RI No. D1509211',
    noBatch: 'AMX-2025-A07',
    tanggalKedaluwarsa: '2026-08-15',
    suhuPenyimpanan: 'Simpan 2–8°C (rantai dingin)',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Ayam'],
  },
  {
    id: 'DSW-PRD-003',
    workspaceId: 'w-drug-001',
    namaProduk: 'Enrofloksasin 10% Oral (1 L)',
    kategori: 'Antibiotik',
    satuan: 'jerigen 1 L',
    ketersediaan: 'Stok Terbatas',
    hargaPlaceholder: 'Rp 245.000/jerigen',
    deskripsiSingkat: 'Fluorokuinolon untuk CRD kompleks, kolibacilosis, dan infeksi Mycoplasma pada unggas. Diberikan melalui air minum.',
    noRegistrasi: 'KEMENTAN RI No. D1503887',
    noBatch: 'ENR-2025-C03',
    tanggalKedaluwarsa: '2027-06-30',
    suhuPenyimpanan: 'Simpan di bawah 30°C',
    targetTernak: ['Ayam', 'Itik', 'Puyuh'],
  },

  // ── Vitamin & Suplemen ──
  {
    id: 'DSW-PRD-004',
    workspaceId: 'w-drug-001',
    namaProduk: 'Vitamin ADE Injeksi (100 mL)',
    kategori: 'Vitamin & Suplemen',
    satuan: 'botol 100 mL',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 55.000/botol',
    deskripsiSingkat: 'Kombinasi vitamin A, D3, E larutan injeksi. Mencegah defisiensi vitamin pada ternak bunting, laktasi, dan pasca-sakit.',
    noRegistrasi: 'KEMENTAN RI No. D1512044',
    noBatch: 'ADE-2025-J09',
    tanggalKedaluwarsa: '2027-09-30',
    suhuPenyimpanan: 'Simpan di bawah 25°C, hindarkan cahaya langsung',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Ayam'],
  },
  {
    id: 'DSW-PRD-005',
    workspaceId: 'w-drug-001',
    namaProduk: 'Multivitamin Oral B-Kompleks (500 mL)',
    kategori: 'Vitamin & Suplemen',
    satuan: 'botol 500 mL',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 48.000/botol',
    deskripsiSingkat: 'Suplemen B-kompleks cair untuk mendukung metabolisme energi, meningkatkan nafsu makan, dan mempercepat pemulihan pasca-sakit.',
    noRegistrasi: 'KEMENTAN RI No. D1513299',
    noBatch: 'MVB-2025-D11',
    tanggalKedaluwarsa: '2026-09-30',
    suhuPenyimpanan: 'Simpan di bawah 30°C',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Ayam', 'Itik'],
  },
  {
    id: 'DSW-PRD-006',
    workspaceId: 'w-drug-001',
    namaProduk: 'Kalsium Boroglukonat 23% Injeksi (400 mL)',
    kategori: 'Vitamin & Suplemen',
    satuan: 'botol 400 mL',
    ketersediaan: 'Stok Terbatas',
    hargaPlaceholder: 'Rp 95.000/botol',
    deskripsiSingkat: 'Terapi milk fever (hipokalsemia) pada sapi perah periparturient. Diberikan IV pelan atau SC. Mengandung Ca, Mg, dan fosfor.',
    noRegistrasi: 'KEMENTAN RI No. D1511762',
    noBatch: 'CAB-2025-F04',
    tanggalKedaluwarsa: '2027-01-31',
    suhuPenyimpanan: 'Simpan di bawah 25°C',
    targetTernak: ['Sapi Perah', 'Sapi Potong'],
  },

  // ── Vaksin ──
  {
    id: 'DSW-PRD-007',
    workspaceId: 'w-drug-001',
    namaProduk: 'Vaksin Anthrax (10 dosis)',
    kategori: 'Vaksin',
    satuan: 'vial 10 dosis',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 75.000/vial',
    deskripsiSingkat: 'Vaksin hidup untuk pencegahan anthraks pada sapi, kerbau, kambing, dan domba di daerah endemis. Vaksinasi tahunan.',
    noRegistrasi: 'KEMENTAN RI No. V2001114',
    noBatch: 'ANT-2025-H01',
    tanggalKedaluwarsa: '2026-08-31',
    suhuPenyimpanan: 'Simpan 2–8°C (wajib rantai dingin)',
    targetTernak: ['Sapi', 'Kerbau', 'Kambing', 'Domba'],
  },
  {
    id: 'DSW-PRD-008',
    workspaceId: 'w-drug-001',
    namaProduk: 'Vaksin SE (Septicemia Epizootica) 20 dosis',
    kategori: 'Vaksin',
    satuan: 'vial 20 dosis',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 120.000/vial',
    deskripsiSingkat: 'Vaksin SE (ngorok/pasteurellosis) untuk pencegahan pada sapi dan kerbau. Vaksinasi 2x setahun di daerah endemis.',
    noRegistrasi: 'KEMENTAN RI No. V2001877',
    noBatch: 'SEP-2025-G06',
    tanggalKedaluwarsa: '2027-02-28',
    suhuPenyimpanan: 'Simpan 2–8°C (wajib rantai dingin)',
    targetTernak: ['Sapi', 'Kerbau'],
  },
  {
    id: 'DSW-PRD-009',
    workspaceId: 'w-drug-001',
    namaProduk: 'Vaksin ND-IB (Newcastle-IB Combo) 1000 dosis',
    kategori: 'Vaksin',
    satuan: 'vial 1000 dosis',
    ketersediaan: 'Habis',
    hargaPlaceholder: 'Rp 185.000/vial',
    deskripsiSingkat: 'Vaksin kombinasi Newcastle Disease dan Infectious Bronchitis untuk ayam. Diberikan tetes mata atau air minum. Mulai umur 4 hari.',
    noRegistrasi: 'KEMENTAN RI No. V2003451',
    noBatch: 'NDB-2025-B09',
    tanggalKedaluwarsa: '2026-07-15',
    suhuPenyimpanan: 'Simpan 2–8°C (wajib rantai dingin)',
    targetTernak: ['Ayam Broiler', 'Ayam Petelur'],
  },

  // ── Antiparasit ──
  {
    id: 'DSW-PRD-010',
    workspaceId: 'w-drug-001',
    namaProduk: 'Albendazol 10% (1 L)',
    kategori: 'Antiparasit',
    satuan: 'botol 1 L',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 130.000/botol',
    deskripsiSingkat: 'Antelmintik broad-spectrum untuk nematoda GI, cacing pita, dan cacing hati. Dosis sapi 7,5 mg/kgBB oral. Tidak diberikan pada trimester 1 kebuntingan.',
    noRegistrasi: 'KEMENTAN RI No. D1508734',
    noBatch: 'ABZ-2025-K05',
    tanggalKedaluwarsa: '2027-11-30',
    suhuPenyimpanan: 'Simpan di bawah 30°C, kocok sebelum pakai',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
  },
  {
    id: 'DSW-PRD-011',
    workspaceId: 'w-drug-001',
    namaProduk: 'Ivermektin 1% Injeksi (500 mL)',
    kategori: 'Antiparasit',
    satuan: 'botol 500 mL',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 320.000/botol',
    deskripsiSingkat: 'Antiparasit broad-spectrum untuk endo dan ektoparasit (kutu, tungau, nematoda). Dosis 0,2 mg/kgBB SC. Withdrawl time 28 hari.',
    noRegistrasi: 'KEMENTAN RI No. D1507921',
    noBatch: 'IVM-2025-L02',
    tanggalKedaluwarsa: '2028-04-30',
    suhuPenyimpanan: 'Simpan di bawah 25°C, hindarkan cahaya',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Babi'],
  },
  {
    id: 'DSW-PRD-012',
    workspaceId: 'w-drug-001',
    namaProduk: 'Prazikuantel 600 mg Tablet (20 tablet)',
    kategori: 'Antiparasit',
    satuan: 'strip 20 tablet',
    ketersediaan: 'Stok Terbatas',
    hargaPlaceholder: 'Rp 45.000/strip',
    deskripsiSingkat: 'Antelmintik khusus cacing pita (cestodesid). Efektif untuk Taenia spp. pada anjing, kucing, dan ternak kecil.',
    noRegistrasi: 'KEMENTAN RI No. D1506341',
    noBatch: 'PZQ-2025-M08',
    tanggalKedaluwarsa: '2026-08-25',
    suhuPenyimpanan: 'Simpan di bawah 30°C',
    targetTernak: ['Kambing', 'Domba', 'Anjing', 'Kucing'],
  },

  // ── Analgesik & Antiinflamasi ──
  {
    id: 'DSW-PRD-013',
    workspaceId: 'w-drug-001',
    namaProduk: 'Meloksikam 5 mg/mL Injeksi (100 mL)',
    kategori: 'Analgesik & Antiinflamasi',
    satuan: 'botol 100 mL',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 155.000/botol',
    deskripsiSingkat: 'NSAID COX-2 selektif untuk nyeri akut dan inflamasi pasca-operasi, mastitis, dan penyakit muskuloskeletal pada sapi dan babi.',
    noRegistrasi: 'KEMENTAN RI No. D1514088',
    noBatch: 'MLX-2025-N01',
    tanggalKedaluwarsa: '2027-07-31',
    suhuPenyimpanan: 'Simpan di bawah 25°C',
    targetTernak: ['Sapi', 'Babi', 'Kambing'],
  },
  {
    id: 'DSW-PRD-014',
    workspaceId: 'w-drug-001',
    namaProduk: 'Dipirona (Metamizol) 50% Injeksi (100 mL)',
    kategori: 'Analgesik & Antiinflamasi',
    satuan: 'botol 100 mL',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 78.000/botol',
    deskripsiSingkat: 'Analgesik-antipiretik untuk demam, kolik, dan nyeri akut. Onset cepat IV. Dosis sapi 25–50 mg/kgBB IM/IV. Umum digunakan oleh drh lapangan.',
    noRegistrasi: 'KEMENTAN RI No. D1508112',
    noBatch: 'DPN-2025-O04',
    tanggalKedaluwarsa: '2026-08-10',
    suhuPenyimpanan: 'Simpan di bawah 25°C, hindarkan cahaya',
    targetTernak: ['Sapi', 'Kerbau', 'Kambing', 'Domba', 'Kuda'],
  },

  // ── Desinfektan & Biosekuriti ──
  {
    id: 'DSW-PRD-015',
    workspaceId: 'w-drug-001',
    namaProduk: 'Formaldehid 37% (Formalin) 5 L',
    kategori: 'Desinfektan & Biosekuriti',
    satuan: 'jerigen 5 L',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 145.000/jerigen',
    deskripsiSingkat: 'Desinfektan dan fumigan untuk fumigasi kandang, inkubator, dan peralatan. Diencerkan 0,5–2% untuk desinfeksi permukaan. Gunakan APD.',
    noRegistrasi: 'KEMENTAN RI No. D1501023',
    noBatch: 'FML-2025-P07',
    tanggalKedaluwarsa: '2028-01-31',
    suhuPenyimpanan: 'Simpan di tempat berventilasi, suhu 15–25°C',
    targetTernak: ['Semua Ternak'],
  },
  {
    id: 'DSW-PRD-016',
    workspaceId: 'w-drug-001',
    namaProduk: 'Iodine Teat Dip 0,5% (1 L)',
    kategori: 'Desinfektan & Biosekuriti',
    satuan: 'botol 1 L',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 85.000/botol',
    deskripsiSingkat: 'Larutan iodine untuk dipping puting sapi perah pasca-pemerahan. Mencegah mastitis akibat kontaminasi bakteri dari lingkungan.',
    noRegistrasi: 'KEMENTAN RI No. D1502844',
    noBatch: 'ITD-2025-Q03',
    tanggalKedaluwarsa: '2027-05-31',
    suhuPenyimpanan: 'Simpan di bawah 25°C, hindarkan cahaya',
    targetTernak: ['Sapi Perah'],
  },

  // ── Hormon & Reproduksi ──
  {
    id: 'DSW-PRD-017',
    workspaceId: 'w-drug-001',
    namaProduk: 'Prostaglandin F2α (PGF2α) 5 mL',
    kategori: 'Hormon & Reproduksi',
    satuan: 'vial 5 mL',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 185.000/vial',
    deskripsiSingkat: 'Luteolisis dan sinkronisasi birahi pada sapi. Indikasi: siklus tidak normal, mumi fetus, pyometra. Wajib resep dokter hewan.',
    noRegistrasi: 'KEMENTAN RI No. D1516701',
    noBatch: 'PGF-2025-R02',
    tanggalKedaluwarsa: '2027-03-31',
    suhuPenyimpanan: 'Simpan 2–8°C',
    targetTernak: ['Sapi', 'Kambing'],
  },
  {
    id: 'DSW-PRD-018',
    workspaceId: 'w-drug-001',
    namaProduk: 'Oksitosin 10 IU Injeksi (10 mL)',
    kategori: 'Hormon & Reproduksi',
    satuan: 'ampul 10 mL',
    ketersediaan: 'Stok Terbatas',
    hargaPlaceholder: 'Rp 32.000/ampul',
    deskripsiSingkat: 'Hormon untuk induksi persalinan, mengatasi retentio plasenta, dan merangsang let-down susu. Dosis sapi 20–30 IU IM/IV. Wajib resep drh.',
    noRegistrasi: 'KEMENTAN RI No. D1516302',
    noBatch: 'OXT-2025-S05',
    tanggalKedaluwarsa: '2026-08-20',
    suhuPenyimpanan: 'Simpan 2–8°C, hindarkan pembekuan',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Babi'],
  },

  // ── Peralatan Medis ──
  {
    id: 'DSW-PRD-019',
    workspaceId: 'w-drug-001',
    namaProduk: 'Spuit Disposable 20 mL (10 pcs)',
    kategori: 'Peralatan Medis',
    satuan: 'pak 10 pcs',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 28.000/pak',
    deskripsiSingkat: 'Spuit plastik steril sekali pakai ukuran 20 mL. Jarum 21G×1,5 inch. Cocok untuk injeksi IM/SC pada sapi dan ternak besar.',
    noRegistrasi: 'MDN-SPT-20ML-10P',
    noBatch: 'SPT-2025-T01',
    tanggalKedaluwarsa: '2030-12-31',
    suhuPenyimpanan: 'Simpan di tempat kering, suhu ruangan',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Babi'],
  },
  {
    id: 'DSW-PRD-020',
    workspaceId: 'w-drug-001',
    namaProduk: 'Infus Set Veteriner (10 set)',
    kategori: 'Peralatan Medis',
    satuan: 'kotak 10 set',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 65.000/kotak',
    deskripsiSingkat: 'Set infus steril untuk terapi cairan IV pada ternak besar. Selang PE 150 cm, jarum trokar 14G, drip chamber, flow regulator.',
    noRegistrasi: 'MDN-IFS-VET-10S',
    noBatch: 'IFS-2025-U01',
    tanggalKedaluwarsa: '2030-06-30',
    suhuPenyimpanan: 'Simpan di tempat kering, suhu ruangan',
    targetTernak: ['Sapi', 'Kerbau', 'Kuda'],
  },
];

// ─── Seed Data — Recent Orders ────────────────────────────────────────────────

export interface DrugStoreOrder {
  id: string;
  buyer: string;
  items: string;
  total: string;
  status: 'Menunggu diproses' | 'Siap dikirim' | 'Selesai' | 'Dibatalkan';
  tanggal: string;
}

const DSW_RECENT_ORDERS: DrugStoreOrder[] = [
  {
    id: 'ORD-DS-0727-009',
    buyer: 'drh. Ahmad Fauzi — Klinik Mandiri',
    items: 'Oxytetracycline 20% · 10 botol',
    total: 'Rp 850.000',
    status: 'Menunggu diproses',
    tanggal: '27 Jul 2026',
  },
  {
    id: 'ORD-DS-0727-008',
    buyer: 'Koperasi Peternak Sapi Garut',
    items: 'Vaksin SE 20 dosis · 5 vial + Ivermektin 1% · 2 botol',
    total: 'Rp 1.240.000',
    status: 'Siap dikirim',
    tanggal: '27 Jul 2026',
  },
  {
    id: 'ORD-DS-0726-007',
    buyer: 'Pak Hendra — Peternakan Maju Jaya',
    items: 'Albendazol 10% · 3 botol + Vitamin ADE · 5 botol',
    total: 'Rp 665.000',
    status: 'Selesai',
    tanggal: '26 Jul 2026',
  },
];

// ─── Seed Data — Activities ────────────────────────────────────────────────────

export interface DrugStoreActivity {
  icon: string;
  title: string;
  detail: string;
  time: string;
}

const DSW_TODAY_ACTIVITIES: DrugStoreActivity[] = [
  { icon: '🧾', title: 'Pesanan baru diterima', detail: 'drh. Ahmad Fauzi · Rp 850.000', time: '10.15' },
  { icon: '📦', title: 'Stok masuk dicatat', detail: 'Vaksin ND-IB 1000 dosis · 20 vial dari distributor', time: '08.45' },
  { icon: '⏰', title: 'Peringatan kedaluwarsa', detail: 'Vaksin Anthrax — exp 31 Agu 2026 (35 hari lagi)', time: '08.00' },
  { icon: '👤', title: 'Pelanggan baru terdaftar', detail: 'Koperasi Peternak Sapi Garut · Bandung Selatan', time: '07.30' },
];

// ─── Accessor Functions ────────────────────────────────────────────────────────

export function getDrugStoreWorkspaceMeta(
  workspaceId: string,
): DrugStoreWorkspaceMeta | null {
  return DSW_WORKSPACE_META.find((m) => m.workspaceId === workspaceId) ?? null;
}

export function getProductsByDrugStoreWorkspace(
  workspaceId: string,
): DrugStoreProductRecord[] {
  return DSW_PRODUCT_DB.filter((p) => p.workspaceId === workspaceId);
}

export function getDrugStoreRecentOrders(): DrugStoreOrder[] {
  return DSW_RECENT_ORDERS;
}

export function getDrugStoreTodayActivities(): DrugStoreActivity[] {
  return DSW_TODAY_ACTIVITIES;
}

export function getDrugStoreLowStockProducts(
  workspaceId: string,
): DrugStoreProductRecord[] {
  return getProductsByDrugStoreWorkspace(workspaceId).filter(
    (p) => p.ketersediaan === 'Stok Terbatas' || p.ketersediaan === 'Habis',
  );
}

export function getDrugStoreNearExpiryProducts(
  workspaceId: string,
): DrugStoreProductRecord[] {
  return getProductsByDrugStoreWorkspace(workspaceId).filter((p) => {
    const status = getExpiryStatus(p.tanggalKedaluwarsa);
    return status === 'Mendekati Kedaluwarsa' || status === 'Kedaluwarsa';
  });
}

/** Fallback to first seeded workspace meta if workspace-specific meta not found. */
export function getDrugStoreWorkspaceMetaWithFallback(
  workspaceId: string,
): DrugStoreWorkspaceMeta {
  return getDrugStoreWorkspaceMeta(workspaceId) ?? DSW_WORKSPACE_META[0];
}

/** Fallback to first seeded workspace products if workspace-specific products not found. */
export function getProductsByDrugStoreWorkspaceWithFallback(
  workspaceId: string,
): DrugStoreProductRecord[] {
  const products = getProductsByDrugStoreWorkspace(workspaceId);
  return products.length > 0
    ? products
    : getProductsByDrugStoreWorkspace('w-drug-001');
}
