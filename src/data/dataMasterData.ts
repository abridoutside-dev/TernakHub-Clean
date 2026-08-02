// ─── Data Master Data — DM-001 ────────────────────────────────────────────────
// Centralized platform reference data. Read-only. Realistic Indonesian dummy data.
// DO NOT modify: Master Pakan, Produk Komersial, Master Obat, Produk Komersial Obat.
// Those modules remain authoritative for their respective domains.

// ─── Types ────────────────────────────────────────────────────────────────────

export type MasterCategory =
  | 'Spesies Ternak'
  | 'Ras Ternak'
  | 'Kategori Pakan'
  | 'Kategori Obat'
  | 'Kategori Vaksin'
  | 'Kategori Penyakit'
  | 'Kategori Layanan'
  | 'Tipe Workspace'
  | 'Kategori Marketplace'
  | 'Satuan Ukur'
  | 'Referensi Geografis'
  | 'Mata Uang'
  | 'Konfigurasi Sistem';

export type MasterStatus = 'Aktif' | 'Tidak Aktif' | 'Deprecated';
export type MasterScope  = 'Platform Global' | 'Indonesia Spesifik' | 'Regional';
export type MasterModule =
  | 'Ternak'
  | 'Pakan'
  | 'Kesehatan Hewan'
  | 'Reproduksi'
  | 'Marketplace'
  | 'Workspace'
  | 'Stok & Inventaris'
  | 'Keuangan'
  | 'Layanan'
  | 'Platform'
  | 'Geografis';

export interface MasterEntry {
  id:             string;
  kode:           string;
  nama:           string;
  namaEn?:        string;
  kategori:       MasterCategory;
  status:         MasterStatus;
  scope:          MasterScope;
  modulTerkait:   MasterModule[];
  deskripsi:      string;
  parentId?:      string;
  parentNama?:    string;
  jumlahPenggunaan: number;
  createdAt:      string;
  updatedAt:      string;
  createdBy:      string;
  tags:           string[];
}

export interface CategorySummary {
  kategori:     MasterCategory;
  icon:         string;
  color:        string;
  totalRecords: number;
  aktif:        number;
  tidakAktif:   number;
  deprecated:   number;
  lastUpdated:  string;
  modulTerkait: MasterModule[];
  deskripsi:    string;
}

// ─── Config maps ─────────────────────────────────────────────────────────────

export const MASTER_STATUS_CONFIG: Record<MasterStatus, { label: string; color: string; bg: string; dot: string }> = {
  'Aktif':      { label: 'Aktif',      color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  'Tidak Aktif':{ label: 'Tidak Aktif',color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  'Deprecated': { label: 'Deprecated', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
};

export const MASTER_CATEGORY_CONFIG: Record<MasterCategory, { icon: string; color: string; bg: string }> = {
  'Spesies Ternak':      { icon: '🐄', color: '#059669', bg: '#d1fae5' },
  'Ras Ternak':          { icon: '🐮', color: '#10b981', bg: '#ecfdf5' },
  'Kategori Pakan':      { icon: '🌾', color: '#d97706', bg: '#fef3c7' },
  'Kategori Obat':       { icon: '💊', color: '#ef4444', bg: '#fee2e2' },
  'Kategori Vaksin':     { icon: '💉', color: '#8b5cf6', bg: '#ede9fe' },
  'Kategori Penyakit':   { icon: '🦠', color: '#dc2626', bg: '#fef2f2' },
  'Kategori Layanan':    { icon: '🤝', color: '#0ea5e9', bg: '#e0f2fe' },
  'Tipe Workspace':      { icon: '🏢', color: '#3b82f6', bg: '#dbeafe' },
  'Kategori Marketplace':{ icon: '🛒', color: '#f59e0b', bg: '#fffbeb' },
  'Satuan Ukur':         { icon: '⚖️', color: '#64748b', bg: '#f1f5f9' },
  'Referensi Geografis': { icon: '📍', color: '#0891b2', bg: '#cffafe' },
  'Mata Uang':           { icon: '💰', color: '#16a34a', bg: '#dcfce7' },
  'Konfigurasi Sistem':  { icon: '⚙️', color: '#475569', bg: '#f8fafc' },
};

export const MODULE_CONFIG: Record<MasterModule, { color: string }> = {
  'Ternak':             { color: '#059669' },
  'Pakan':              { color: '#d97706' },
  'Kesehatan Hewan':    { color: '#ef4444' },
  'Reproduksi':         { color: '#ec4899' },
  'Marketplace':        { color: '#f59e0b' },
  'Workspace':          { color: '#3b82f6' },
  'Stok & Inventaris':  { color: '#8b5cf6' },
  'Keuangan':           { color: '#16a34a' },
  'Layanan':            { color: '#0ea5e9' },
  'Platform':           { color: '#475569' },
  'Geografis':          { color: '#0891b2' },
};

// ─── Master Data Records ──────────────────────────────────────────────────────

export const DM_MASTER_LIST: MasterEntry[] = [

  // ═══════════════════════════════════════════════════════
  // 1. SPESIES TERNAK
  // ═══════════════════════════════════════════════════════
  {
    id: 'SP-001', kode: 'SP-SAPI', nama: 'Sapi', namaEn: 'Cattle',
    kategori: 'Spesies Ternak', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Ternak', 'Pakan', 'Kesehatan Hewan', 'Reproduksi', 'Marketplace'],
    deskripsi: 'Ternak sapi (Bos taurus / Bos indicus) untuk keperluan daging, susu, dan pembibitan. Spesies paling dominan di platform.',
    jumlahPenggunaan: 48_240, createdAt: '2023-01-15', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['unggulan', 'daging', 'susu', 'ruminansia'],
  },
  {
    id: 'SP-002', kode: 'SP-KAMBING', nama: 'Kambing', namaEn: 'Goat',
    kategori: 'Spesies Ternak', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Ternak', 'Pakan', 'Kesehatan Hewan', 'Reproduksi', 'Marketplace'],
    deskripsi: 'Kambing (Capra hircus) — ternak kecil produktif untuk daging (Eid al-Adha) dan susu.',
    jumlahPenggunaan: 24_180, createdAt: '2023-01-15', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['ternak kecil', 'daging', 'ruminansia'],
  },
  {
    id: 'SP-003', kode: 'SP-DOMBA', nama: 'Domba', namaEn: 'Sheep',
    kategori: 'Spesies Ternak', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Ternak', 'Pakan', 'Kesehatan Hewan', 'Reproduksi', 'Marketplace'],
    deskripsi: 'Domba (Ovis aries) — ternak ruminansia kecil untuk daging dan wol. Populer di Jawa Barat dan Jawa Tengah.',
    jumlahPenggunaan: 12_840, createdAt: '2023-01-15', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['ternak kecil', 'wol', 'ruminansia'],
  },
  {
    id: 'SP-004', kode: 'SP-BABI', nama: 'Babi', namaEn: 'Pig',
    kategori: 'Spesies Ternak', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Ternak', 'Pakan', 'Kesehatan Hewan'],
    deskripsi: 'Babi (Sus scrofa domesticus) — ternak monogastrik di wilayah non-Muslim (Bali, NTT, Sumatera Utara).',
    jumlahPenggunaan: 8_420, createdAt: '2023-01-15', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['monogastrik', 'regional'],
  },
  {
    id: 'SP-005', kode: 'SP-AYAM', nama: 'Ayam', namaEn: 'Chicken',
    kategori: 'Spesies Ternak', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Ternak', 'Pakan', 'Kesehatan Hewan', 'Marketplace'],
    deskripsi: 'Ayam (Gallus gallus domesticus) — unggas paling umum untuk daging dan telur di seluruh Indonesia.',
    jumlahPenggunaan: 62_800, createdAt: '2023-01-15', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['unggas', 'telur', 'daging'],
  },
  {
    id: 'SP-006', kode: 'SP-ITIK', nama: 'Itik / Bebek', namaEn: 'Duck',
    kategori: 'Spesies Ternak', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Ternak', 'Pakan', 'Kesehatan Hewan', 'Marketplace'],
    deskripsi: 'Itik / bebek (Anas platyrhynchos domesticus) — unggas air populer untuk telur asin dan daging bebek.',
    jumlahPenggunaan: 9_640, createdAt: '2023-03-01', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['unggas', 'telur asin', 'air'],
  },
  {
    id: 'SP-007', kode: 'SP-KERBAU', nama: 'Kerbau', namaEn: 'Buffalo',
    kategori: 'Spesies Ternak', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Ternak', 'Pakan', 'Kesehatan Hewan', 'Marketplace'],
    deskripsi: 'Kerbau (Bubalus bubalis) — ternak kerja dan daging. Populer di Sulawesi Selatan (Toraja) dan NTB.',
    jumlahPenggunaan: 4_210, createdAt: '2023-03-01', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['ruminansia', 'kerja', 'lokal'],
  },

  // ═══════════════════════════════════════════════════════
  // 2. RAS TERNAK
  // ═══════════════════════════════════════════════════════
  {
    id: 'RAS-001', kode: 'RAS-SIMENTAL', nama: 'Simental', namaEn: 'Simmental',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Ternak', 'Reproduksi', 'Marketplace'],
    deskripsi: 'Ras sapi pedaging asal Swiss. Pertumbuhan cepat, produksi daging tinggi. Banyak disilangkan dengan sapi lokal.',
    parentId: 'SP-001', parentNama: 'Sapi',
    jumlahPenggunaan: 14_820, createdAt: '2023-02-01', updatedAt: '2026-05-12',
    createdBy: 'System Admin', tags: ['pedaging', 'impor', 'sapi'],
  },
  {
    id: 'RAS-002', kode: 'RAS-LIMOUSIN', nama: 'Limousin', namaEn: 'Limousin',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Ternak', 'Reproduksi', 'Marketplace'],
    deskripsi: 'Ras sapi asal Prancis. Dikenal karena efisiensi pakan dan karkas berkualitas tinggi.',
    parentId: 'SP-001', parentNama: 'Sapi',
    jumlahPenggunaan: 11_240, createdAt: '2023-02-01', updatedAt: '2026-05-12',
    createdBy: 'System Admin', tags: ['pedaging', 'impor', 'sapi'],
  },
  {
    id: 'RAS-003', kode: 'RAS-PO', nama: 'Peranakan Ongole (PO)', namaEn: 'Ongole Cross',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Ternak', 'Reproduksi', 'Marketplace'],
    deskripsi: 'Ras sapi lokal Indonesia. Adaptif terhadap iklim tropis dan pakan lokal. Dominan di Jawa.',
    parentId: 'SP-001', parentNama: 'Sapi',
    jumlahPenggunaan: 18_400, createdAt: '2023-02-01', updatedAt: '2026-05-12',
    createdBy: 'System Admin', tags: ['lokal', 'adaptif', 'sapi'],
  },
  {
    id: 'RAS-004', kode: 'RAS-ETAWA', nama: 'Peranakan Etawah (PE)', namaEn: 'Etawah Cross',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Ternak', 'Reproduksi', 'Marketplace'],
    deskripsi: 'Ras kambing unggul Indonesia hasil silang Etawah–Kacang. Produksi susu tinggi hingga 1,5 liter/hari.',
    parentId: 'SP-002', parentNama: 'Kambing',
    jumlahPenggunaan: 9_840, createdAt: '2023-02-01', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['lokal', 'susu', 'kambing'],
  },
  {
    id: 'RAS-005', kode: 'RAS-BLIGON', nama: 'Bligon', namaEn: 'Bligon',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Ternak', 'Reproduksi'],
    deskripsi: 'Ras kambing lokal asal Jawa Tengah. Prolifik, tahan penyakit lokal, cocok sistem kandang sederhana.',
    parentId: 'SP-002', parentNama: 'Kambing',
    jumlahPenggunaan: 4_210, createdAt: '2023-03-10', updatedAt: '2026-06-01',
    createdBy: 'Dewi Admin', tags: ['lokal', 'Jawa Tengah', 'kambing'],
  },
  {
    id: 'RAS-006', kode: 'RAS-GARUT', nama: 'Domba Garut', namaEn: 'Garut Sheep',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Ternak', 'Reproduksi', 'Marketplace'],
    deskripsi: 'Ras domba lokal Jawa Barat. Terkenal sebagai domba tangkas (adu domba) dan daging berkualitas.',
    parentId: 'SP-003', parentNama: 'Domba',
    jumlahPenggunaan: 6_810, createdAt: '2023-03-10', updatedAt: '2026-06-15',
    createdBy: 'System Admin', tags: ['lokal', 'Garut', 'domba'],
  },
  {
    id: 'RAS-007', kode: 'RAS-BRAHMAN', nama: 'Brahman', namaEn: 'Brahman',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Ternak', 'Reproduksi', 'Marketplace'],
    deskripsi: 'Ras sapi asal India. Sangat adaptif terhadap panas, tahan caplak, dan tahan cekaman pakan.',
    parentId: 'SP-001', parentNama: 'Sapi',
    jumlahPenggunaan: 8_920, createdAt: '2023-03-15', updatedAt: '2026-05-20',
    createdBy: 'System Admin', tags: ['impor', 'tropis', 'sapi'],
  },
  {
    id: 'RAS-008', kode: 'RAS-BROILER', nama: 'Broiler (Pedaging)', namaEn: 'Broiler',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Ternak', 'Pakan', 'Kesehatan Hewan'],
    deskripsi: 'Strain ayam pedaging komersial. Pertumbuhan sangat cepat (panen 30–35 hari). Paling dominan di industri.',
    parentId: 'SP-005', parentNama: 'Ayam',
    jumlahPenggunaan: 42_800, createdAt: '2023-01-20', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['komersial', 'pedaging', 'ayam'],
  },
  {
    id: 'RAS-009', kode: 'RAS-LAYER', nama: 'Layer (Petelur)', namaEn: 'Layer',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Ternak', 'Pakan', 'Kesehatan Hewan'],
    deskripsi: 'Strain ayam petelur komersial. Produksi telur 250–300 butir/tahun. Dominan di industri telur nasional.',
    parentId: 'SP-005', parentNama: 'Ayam',
    jumlahPenggunaan: 28_400, createdAt: '2023-01-20', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['komersial', 'petelur', 'ayam'],
  },

  // ═══════════════════════════════════════════════════════
  // 3. KATEGORI PAKAN
  // ═══════════════════════════════════════════════════════
  {
    id: 'KP-001', kode: 'KP-HIJAUAN', nama: 'Hijauan Segar', namaEn: 'Fresh Forage',
    kategori: 'Kategori Pakan', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Pakan', 'Stok & Inventaris'],
    deskripsi: 'Rumput dan leguminosa segar sebagai pakan utama ruminansia. Rumput gajah, rumput odot, setaria, dll.',
    jumlahPenggunaan: 38_400, createdAt: '2023-01-20', updatedAt: '2026-04-15',
    createdBy: 'System Admin', tags: ['ruminansia', 'utama', 'segar'],
  },
  {
    id: 'KP-002', kode: 'KP-KONSENTRAT', nama: 'Konsentrat', namaEn: 'Concentrate',
    kategori: 'Kategori Pakan', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Pakan', 'Stok & Inventaris'],
    deskripsi: 'Pakan berenergi dan protein tinggi: dedak padi, ampas tahu, bungkil kelapa sawit, jagung giling.',
    jumlahPenggunaan: 29_800, createdAt: '2023-01-20', updatedAt: '2026-04-15',
    createdBy: 'System Admin', tags: ['energi tinggi', 'protein'],
  },
  {
    id: 'KP-003', kode: 'KP-SILASE', nama: 'Silase & Fermentasi', namaEn: 'Silage & Fermented Feed',
    kategori: 'Kategori Pakan', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Pakan', 'Stok & Inventaris'],
    deskripsi: 'Pakan fermentasi anaerob dari hijauan (jagung, sorghum, rumput) untuk mempertahankan nilai nutrisi.',
    jumlahPenggunaan: 14_200, createdAt: '2023-02-10', updatedAt: '2026-04-15',
    createdBy: 'System Admin', tags: ['fermentasi', 'awet', 'anaerob'],
  },
  {
    id: 'KP-004', kode: 'KP-MINERAL', nama: 'Mineral & Vitamin', namaEn: 'Minerals & Vitamins',
    kategori: 'Kategori Pakan', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Pakan', 'Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'Suplemen mineral makro/mikro dan vitamin untuk mendukung pertumbuhan, reproduksi, dan produktivitas ternak.',
    jumlahPenggunaan: 22_400, createdAt: '2023-01-20', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['suplemen', 'kesehatan', 'mikro'],
  },
  {
    id: 'KP-005', kode: 'KP-ROUGHAGE', nama: 'Pakan Berserat (Roughage)', namaEn: 'Roughage',
    kategori: 'Kategori Pakan', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Pakan', 'Stok & Inventaris'],
    deskripsi: 'Jerami padi, sekam, batang jagung, dan bahan berserat lain sebagai pakan alternatif musim kemarau.',
    jumlahPenggunaan: 18_900, createdAt: '2023-01-20', updatedAt: '2026-04-15',
    createdBy: 'System Admin', tags: ['alternatif', 'murah', 'kering'],
  },
  {
    id: 'KP-006', kode: 'KP-ADDITIVE', nama: 'Feed Additive', namaEn: 'Feed Additive',
    kategori: 'Kategori Pakan', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Pakan', 'Stok & Inventaris'],
    deskripsi: 'Bahan tambahan pakan: probiotik, enzim, antioksidan, mold inhibitor, untuk meningkatkan performa.',
    jumlahPenggunaan: 11_200, createdAt: '2023-04-01', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['additive', 'probiotik', 'enzim'],
  },

  // ═══════════════════════════════════════════════════════
  // 4. KATEGORI OBAT
  // ═══════════════════════════════════════════════════════
  {
    id: 'KO-001', kode: 'KO-ANTIBIOTIK', nama: 'Antibiotik', namaEn: 'Antibiotic',
    kategori: 'Kategori Obat', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'Agen antibakteri untuk pengobatan infeksi bakteri sistemik dan lokal pada ternak. Wajib resep dokter.',
    jumlahPenggunaan: 28_400, createdAt: '2023-01-25', updatedAt: '2026-06-10',
    createdBy: 'System Admin', tags: ['resep dokter', 'bakteri', 'RX'],
  },
  {
    id: 'KO-002', kode: 'KO-ANTIPARASIT', nama: 'Antiparasit', namaEn: 'Antiparasitic',
    kategori: 'Kategori Obat', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'Obat untuk mengatasi parasit internal (cacing nematoda, trematoda) dan eksternal (kutu, tungau, lalat).',
    jumlahPenggunaan: 21_840, createdAt: '2023-01-25', updatedAt: '2026-06-10',
    createdBy: 'System Admin', tags: ['cacing', 'parasit eksternal', 'OTC'],
  },
  {
    id: 'KO-003', kode: 'KO-VITAMIN-OB', nama: 'Vitamin & Suplemen', namaEn: 'Vitamin & Supplement',
    kategori: 'Kategori Obat', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'Suplemen vitamin A, D, E, B-kompleks untuk menjaga kesehatan, daya tahan, dan produktivitas.',
    jumlahPenggunaan: 19_400, createdAt: '2023-01-25', updatedAt: '2026-06-10',
    createdBy: 'System Admin', tags: ['suplemen', 'OTC', 'preventif'],
  },
  {
    id: 'KO-004', kode: 'KO-HORMON', nama: 'Hormon Reproduksi', namaEn: 'Reproductive Hormone',
    kategori: 'Kategori Obat', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan', 'Reproduksi', 'Stok & Inventaris'],
    deskripsi: 'Hormon untuk sinkronisasi birahi, induksi kelahiran, dan manajemen reproduksi. Wajib resep dokter.',
    jumlahPenggunaan: 12_800, createdAt: '2023-02-10', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['reproduksi', 'resep dokter', 'RX'],
  },
  {
    id: 'KO-005', kode: 'KO-ANTIINFLAMASI', nama: 'Anti-Inflamasi & Analgesik', namaEn: 'Anti-inflammatory & Analgesic',
    kategori: 'Kategori Obat', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'NSAID dan kortikosteroid untuk mengurangi peradangan, demam, dan nyeri pasca operasi atau trauma.',
    jumlahPenggunaan: 14_200, createdAt: '2023-02-15', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['NSAID', 'demam', 'RX'],
  },
  {
    id: 'KO-006', kode: 'KO-TOPIKAL', nama: 'Obat Topikal & Luka', namaEn: 'Topical & Wound Care',
    kategori: 'Kategori Obat', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'Salep, spray, dan larutan antiseptik untuk perawatan luka, mastitis, dan infeksi kulit lokal.',
    jumlahPenggunaan: 8_920, createdAt: '2023-03-01', updatedAt: '2026-05-01',
    createdBy: 'System Admin', tags: ['luka', 'antiseptik', 'topikal'],
  },

  // ═══════════════════════════════════════════════════════
  // 5. KATEGORI VAKSIN
  // ═══════════════════════════════════════════════════════
  {
    id: 'KV-001', kode: 'KV-PMK', nama: 'Vaksin PMK (Penyakit Mulut & Kuku)', namaEn: 'FMD Vaccine',
    kategori: 'Kategori Vaksin', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'Vaksin wajib nasional untuk pencegahan Penyakit Mulut & Kuku (PMK) pada sapi, kambing, domba, dan babi.',
    jumlahPenggunaan: 38_400, createdAt: '2023-01-25', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['wajib', 'nasional', 'ruminansia'],
  },
  {
    id: 'KV-002', kode: 'KV-ANTHRAX', nama: 'Vaksin Anthrax', namaEn: 'Anthrax Vaccine',
    kategori: 'Kategori Vaksin', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'Vaksin pencegahan Anthrax (Bacillus anthracis). Wajib di daerah endemik: Jawa Barat, NTT, NTB.',
    jumlahPenggunaan: 12_840, createdAt: '2023-01-25', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['wajib', 'endemik', 'zoonosis'],
  },
  {
    id: 'KV-003', kode: 'KV-BRUCELLA', nama: 'Vaksin Brucellosis', namaEn: 'Brucellosis Vaccine',
    kategori: 'Kategori Vaksin', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Kesehatan Hewan', 'Reproduksi', 'Stok & Inventaris'],
    deskripsi: 'Vaksin pencegahan Brucellosis (Brucella abortus). Program vaksinasi nasional untuk sapi dara.',
    jumlahPenggunaan: 18_200, createdAt: '2023-02-01', updatedAt: '2026-06-10',
    createdBy: 'System Admin', tags: ['wajib', 'reproduksi', 'zoonosis'],
  },
  {
    id: 'KV-004', kode: 'KV-AI', nama: 'Vaksin Avian Influenza (AI)', namaEn: 'Avian Influenza Vaccine',
    kategori: 'Kategori Vaksin', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'Vaksin flu burung (H5N1, H5N2) untuk unggas. Wajib dan disubsidi pemerintah di daerah berisiko.',
    jumlahPenggunaan: 44_800, createdAt: '2023-01-25', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['wajib', 'unggas', 'zoonosis'],
  },
  {
    id: 'KV-005', kode: 'KV-ND', nama: 'Vaksin Newcastle Disease (ND)', namaEn: 'Newcastle Disease Vaccine',
    kategori: 'Kategori Vaksin', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'Vaksin tetelo (ND) untuk ayam. Wajib rutin tiap 2–3 bulan pada ayam kampung dan layer.',
    jumlahPenggunaan: 52_400, createdAt: '2023-01-25', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['wajib', 'unggas', 'rutin'],
  },
  {
    id: 'KV-006', kode: 'KV-AFTOSA', nama: 'Vaksin SE (Septicaemia Epizootica)', namaEn: 'SE Vaccine',
    kategori: 'Kategori Vaksin', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'Vaksin ngorok (SE) untuk sapi dan kerbau. Program vaksinasi pemerintah di pulau Jawa dan Sumatera.',
    jumlahPenggunaan: 14_200, createdAt: '2023-03-01', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['wajib', 'ruminansia', 'pemerintah'],
  },

  // ═══════════════════════════════════════════════════════
  // 6. KATEGORI PENYAKIT
  // ═══════════════════════════════════════════════════════
  {
    id: 'PY-001', kode: 'PY-INFEKSI-BAKTERI', nama: 'Infeksi Bakteri', namaEn: 'Bacterial Infection',
    kategori: 'Kategori Penyakit', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan'],
    deskripsi: 'Kategori penyakit akibat infeksi bakteri: Anthrax, Brucellosis, Mastitis, Pasteurellosis, dll.',
    jumlahPenggunaan: 24_800, createdAt: '2023-02-01', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['bakteri', 'infeksi', 'diagnosis'],
  },
  {
    id: 'PY-002', kode: 'PY-INFEKSI-VIRUS', nama: 'Infeksi Virus', namaEn: 'Viral Infection',
    kategori: 'Kategori Penyakit', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan'],
    deskripsi: 'Kategori penyakit akibat infeksi virus: PMK, AI, ND, IBR, BVD, Rabies, Jembrana.',
    jumlahPenggunaan: 28_400, createdAt: '2023-02-01', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['virus', 'infeksi', 'karantina'],
  },
  {
    id: 'PY-003', kode: 'PY-PARASIT', nama: 'Infestasi Parasit', namaEn: 'Parasitic Infestation',
    kategori: 'Kategori Penyakit', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan'],
    deskripsi: 'Penyakit akibat parasit internal (cacing: Fasciola, Ascaris, Haemonchus) dan eksternal (caplak, kutu).',
    jumlahPenggunaan: 18_200, createdAt: '2023-02-01', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['parasit', 'cacing', 'caplak'],
  },
  {
    id: 'PY-004', kode: 'PY-METABOLIK', nama: 'Gangguan Metabolik', namaEn: 'Metabolic Disorder',
    kategori: 'Kategori Penyakit', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan', 'Pakan'],
    deskripsi: 'Penyakit terkait nutrisi dan metabolisme: Ketosis, Milk fever, Bloat, Defisiensi mineral.',
    jumlahPenggunaan: 12_800, createdAt: '2023-02-10', updatedAt: '2026-05-01',
    createdBy: 'System Admin', tags: ['nutrisi', 'metabolisme', 'pakan'],
  },
  {
    id: 'PY-005', kode: 'PY-REPRODUKSI', nama: 'Gangguan Reproduksi', namaEn: 'Reproductive Disorder',
    kategori: 'Kategori Penyakit', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan', 'Reproduksi'],
    deskripsi: 'Gangguan sistem reproduksi: Repeat breeding, Endometritis, Kista ovarium, Abortus.',
    jumlahPenggunaan: 9_400, createdAt: '2023-02-10', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['reproduksi', 'infertilitas', 'aborsi'],
  },
  {
    id: 'PY-006', kode: 'PY-ZOONOSIS', nama: 'Zoonosis', namaEn: 'Zoonosis',
    kategori: 'Kategori Penyakit', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan'],
    deskripsi: 'Penyakit yang dapat menular dari hewan ke manusia: Anthrax, Brucellosis, Rabies, Leptospirosis, AI.',
    jumlahPenggunaan: 14_200, createdAt: '2023-02-01', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['zoonosis', 'karantina', 'darurat'],
  },

  // ═══════════════════════════════════════════════════════
  // 7. KATEGORI LAYANAN
  // ═══════════════════════════════════════════════════════
  {
    id: 'KL-001', kode: 'KL-VETERINER', nama: 'Layanan Veteriner', namaEn: 'Veterinary Service',
    kategori: 'Kategori Layanan', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Layanan', 'Kesehatan Hewan'],
    deskripsi: 'Jasa pemeriksaan, diagnosis, dan pengobatan ternak oleh dokter hewan bersertifikat.',
    jumlahPenggunaan: 8_420, createdAt: '2023-01-20', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['dokter hewan', 'klinik', 'medis'],
  },
  {
    id: 'KL-002', kode: 'KL-IB', nama: 'Inseminasi Buatan (IB)', namaEn: 'Artificial Insemination',
    kategori: 'Kategori Layanan', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Layanan', 'Reproduksi'],
    deskripsi: 'Layanan inseminasi buatan oleh inseminator bersertifikat. Program nasional UPSUS SIWAB.',
    jumlahPenggunaan: 12_800, createdAt: '2023-02-01', updatedAt: '2026-06-10',
    createdBy: 'System Admin', tags: ['reproduksi', 'IB', 'pemerintah'],
  },
  {
    id: 'KL-003', kode: 'KL-TRANSPORT', nama: 'Transportasi Ternak', namaEn: 'Livestock Transport',
    kategori: 'Kategori Layanan', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Layanan', 'Marketplace'],
    deskripsi: 'Jasa angkut ternak antar kota/provinsi menggunakan armada khusus berpendingin dan berventilasi.',
    jumlahPenggunaan: 4_840, createdAt: '2023-04-01', updatedAt: '2026-05-01',
    createdBy: 'System Admin', tags: ['logistik', 'armada', 'antar kota'],
  },
  {
    id: 'KL-004', kode: 'KL-PAKAN-KONSULTASI', nama: 'Konsultasi Nutrisi Pakan', namaEn: 'Feed Nutrition Consulting',
    kategori: 'Kategori Layanan', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Layanan', 'Pakan'],
    deskripsi: 'Jasa konsultasi formulasi ransum dan nutrisi oleh ahli nutrisi ternak bersertifikat.',
    jumlahPenggunaan: 2_840, createdAt: '2023-05-01', updatedAt: '2026-05-15',
    createdBy: 'System Admin', tags: ['konsultasi', 'nutrisi', 'ransum'],
  },
  {
    id: 'KL-005', kode: 'KL-SERTIFIKASI', nama: 'Sertifikasi & Pengujian', namaEn: 'Certification & Testing',
    kategori: 'Kategori Layanan', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Layanan', 'Platform'],
    deskripsi: 'Layanan sertifikasi halal, SKKNI peternak, dan pengujian kualitas produk ternak oleh lembaga terakreditasi.',
    jumlahPenggunaan: 1_840, createdAt: '2023-06-01', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['halal', 'sertifikat', 'akreditasi'],
  },
  {
    id: 'KL-006', kode: 'KL-PELATIHAN', nama: 'Pelatihan & Penyuluhan', namaEn: 'Training & Extension',
    kategori: 'Kategori Layanan', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Layanan', 'Platform'],
    deskripsi: 'Pelatihan budidaya ternak, penyuluhan pertanian, dan program Good Farming Practices (GFP).',
    jumlahPenggunaan: 3_240, createdAt: '2023-06-01', updatedAt: '2026-05-01',
    createdBy: 'System Admin', tags: ['pelatihan', 'penyuluhan', 'GFP'],
  },

  // ═══════════════════════════════════════════════════════
  // 8. TIPE WORKSPACE
  // ═══════════════════════════════════════════════════════
  {
    id: 'TW-001', kode: 'TW-PETERNAKAN', nama: 'Peternakan', namaEn: 'Livestock Farm',
    kategori: 'Tipe Workspace', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Workspace', 'Ternak', 'Pakan', 'Kesehatan Hewan'],
    deskripsi: 'Workspace utama untuk operasional peternakan: manajemen ternak, pakan, kesehatan hewan, dan reproduksi.',
    jumlahPenggunaan: 5_840, createdAt: '2023-01-10', updatedAt: '2026-01-01',
    createdBy: 'System Admin', tags: ['utama', 'peternakan'],
  },
  {
    id: 'TW-002', kode: 'TW-KLINIK', nama: 'Klinik Hewan', namaEn: 'Veterinary Clinic',
    kategori: 'Tipe Workspace', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Workspace', 'Layanan', 'Kesehatan Hewan'],
    deskripsi: 'Workspace untuk klinik hewan yang menyediakan layanan kesehatan ternak multi-dokter.',
    jumlahPenggunaan: 842, createdAt: '2023-01-10', updatedAt: '2026-01-01',
    createdBy: 'System Admin', tags: ['layanan', 'medis'],
  },
  {
    id: 'TW-003', kode: 'TW-DOKTER', nama: 'Dokter Hewan', namaEn: 'Veterinarian',
    kategori: 'Tipe Workspace', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Workspace', 'Layanan', 'Kesehatan Hewan'],
    deskripsi: 'Workspace personal untuk dokter hewan mandiri yang berpraktik di lapangan.',
    jumlahPenggunaan: 480, createdAt: '2023-01-10', updatedAt: '2026-01-01',
    createdBy: 'System Admin', tags: ['layanan', 'personal', 'mandiri'],
  },
  {
    id: 'TW-004', kode: 'TW-TRANSPORT', nama: 'Jasa Transportasi', namaEn: 'Livestock Transport',
    kategori: 'Tipe Workspace', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Workspace', 'Layanan'],
    deskripsi: 'Workspace untuk penyedia jasa transportasi khusus ternak antar kota dan antar provinsi.',
    jumlahPenggunaan: 214, createdAt: '2023-04-20', updatedAt: '2026-03-01',
    createdBy: 'Siti Admin', tags: ['layanan', 'logistik', 'armada'],
  },
  {
    id: 'TW-005', kode: 'TW-TOKO-PAKAN', nama: 'Toko Pakan & Obat', namaEn: 'Feed & Medicine Store',
    kategori: 'Tipe Workspace', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Workspace', 'Marketplace', 'Stok & Inventaris'],
    deskripsi: 'Workspace untuk toko yang menjual pakan ternak, obat hewan, dan alat peternakan.',
    jumlahPenggunaan: 328, createdAt: '2023-05-01', updatedAt: '2026-04-01',
    createdBy: 'System Admin', tags: ['ritel', 'pakan', 'obat'],
  },
  {
    id: 'TW-006', kode: 'TW-KOPERASI', nama: 'Koperasi Peternak', namaEn: 'Livestock Cooperative',
    kategori: 'Tipe Workspace', status: 'Tidak Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Workspace'],
    deskripsi: 'Tipe workspace koperasi — dalam evaluasi untuk pengembangan fitur kolaboratif multi-anggota.',
    jumlahPenggunaan: 38, createdAt: '2023-06-01', updatedAt: '2026-05-01',
    createdBy: 'Budi Admin', tags: ['koperasi', 'evaluasi', 'kolaboratif'],
  },

  // ═══════════════════════════════════════════════════════
  // 9. KATEGORI MARKETPLACE
  // ═══════════════════════════════════════════════════════
  {
    id: 'KM-001', kode: 'KM-TERNAK-HIDUP', nama: 'Ternak Hidup', namaEn: 'Live Livestock',
    kategori: 'Kategori Marketplace', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Marketplace', 'Ternak'],
    deskripsi: 'Kategori listing jual-beli ternak hidup: sapi, kambing, domba, ayam, itik, kerbau.',
    jumlahPenggunaan: 28_400, createdAt: '2023-01-15', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['jual-beli', 'ternak', 'unggulan'],
  },
  {
    id: 'KM-002', kode: 'KM-PAKAN-TERNAK', nama: 'Pakan Ternak', namaEn: 'Animal Feed',
    kategori: 'Kategori Marketplace', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Marketplace', 'Pakan'],
    deskripsi: 'Kategori listing penjualan pakan ternak: hijauan, konsentrat, silase, suplemen, produk komersial.',
    jumlahPenggunaan: 14_200, createdAt: '2023-02-01', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['pakan', 'nutrisi'],
  },
  {
    id: 'KM-003', kode: 'KM-OBAT-HEWAN', nama: 'Obat & Vaksin Hewan', namaEn: 'Veterinary Medicine',
    kategori: 'Kategori Marketplace', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Marketplace', 'Kesehatan Hewan'],
    deskripsi: 'Kategori listing penjualan obat hewan, vaksin, dan suplemen kesehatan ternak.',
    jumlahPenggunaan: 8_420, createdAt: '2023-02-01', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['obat', 'vaksin', 'RX'],
  },
  {
    id: 'KM-004', kode: 'KM-PERALATAN', nama: 'Peralatan Peternakan', namaEn: 'Farming Equipment',
    kategori: 'Kategori Marketplace', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Marketplace'],
    deskripsi: 'Peralatan dan infrastruktur peternakan: kandang, timbangan, alat IB, mesin chopper, dll.',
    jumlahPenggunaan: 4_840, createdAt: '2023-03-01', updatedAt: '2026-05-01',
    createdBy: 'System Admin', tags: ['peralatan', 'infrastruktur'],
  },
  {
    id: 'KM-005', kode: 'KM-JASA', nama: 'Jasa & Layanan', namaEn: 'Services',
    kategori: 'Kategori Marketplace', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Marketplace', 'Layanan'],
    deskripsi: 'Kategori listing penawaran jasa: veteriner, IB, transportasi, konsultasi nutrisi, pelatihan.',
    jumlahPenggunaan: 6_210, createdAt: '2023-03-15', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['jasa', 'layanan', 'B2B'],
  },
  {
    id: 'KM-006', kode: 'KM-BIBIT', nama: 'Bibit & Semen Beku', namaEn: 'Seeds & Frozen Semen',
    kategori: 'Kategori Marketplace', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Marketplace', 'Reproduksi'],
    deskripsi: 'Bibit tanaman pakan (rumput, leguminosa), semen beku dari pejantan unggul, dan embrio.',
    jumlahPenggunaan: 3_840, createdAt: '2023-04-01', updatedAt: '2026-06-10',
    createdBy: 'System Admin', tags: ['bibit', 'semen beku', 'IB'],
  },

  // ═══════════════════════════════════════════════════════
  // 10. SATUAN UKUR
  // ═══════════════════════════════════════════════════════
  {
    id: 'SU-001', kode: 'SU-KG', nama: 'Kilogram (kg)', namaEn: 'Kilogram',
    kategori: 'Satuan Ukur', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Pakan', 'Stok & Inventaris', 'Marketplace'],
    deskripsi: 'Satuan berat utama untuk pakan dan bobot ternak. Digunakan di seluruh modul.',
    jumlahPenggunaan: 284_000, createdAt: '2023-01-01', updatedAt: '2023-01-01',
    createdBy: 'System Admin', tags: ['berat', 'utama', 'SI'],
  },
  {
    id: 'SU-002', kode: 'SU-GRAM', nama: 'Gram (g)', namaEn: 'Gram',
    kategori: 'Satuan Ukur', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'Satuan berat untuk dosis obat, suplemen, dan mineral.',
    jumlahPenggunaan: 48_400, createdAt: '2023-01-01', updatedAt: '2023-01-01',
    createdBy: 'System Admin', tags: ['berat', 'dosis', 'SI'],
  },
  {
    id: 'SU-003', kode: 'SU-TON', nama: 'Ton (t)', namaEn: 'Metric Ton',
    kategori: 'Satuan Ukur', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Pakan', 'Stok & Inventaris', 'Marketplace'],
    deskripsi: 'Satuan berat untuk pengiriman dan stok pakan skala besar.',
    jumlahPenggunaan: 8_400, createdAt: '2023-01-01', updatedAt: '2023-01-01',
    createdBy: 'System Admin', tags: ['berat', 'bulk', 'logistik'],
  },
  {
    id: 'SU-004', kode: 'SU-LITER', nama: 'Liter (L)', namaEn: 'Liter',
    kategori: 'Satuan Ukur', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Pakan', 'Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'Satuan volume untuk pakan cair, obat cair, larutan antiseptik, dan produksi susu.',
    jumlahPenggunaan: 22_800, createdAt: '2023-01-01', updatedAt: '2023-01-01',
    createdBy: 'System Admin', tags: ['volume', 'cairan', 'SI'],
  },
  {
    id: 'SU-005', kode: 'SU-ML', nama: 'Mililiter (mL)', namaEn: 'Milliliter',
    kategori: 'Satuan Ukur', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Kesehatan Hewan', 'Stok & Inventaris'],
    deskripsi: 'Satuan volume untuk dosis suntikan, obat tetes, dan larutan obat.',
    jumlahPenggunaan: 14_400, createdAt: '2023-01-01', updatedAt: '2023-01-01',
    createdBy: 'System Admin', tags: ['volume', 'dosis', 'injeksi'],
  },
  {
    id: 'SU-006', kode: 'SU-EKOR', nama: 'Ekor', namaEn: 'Head (livestock unit)',
    kategori: 'Satuan Ukur', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Ternak', 'Marketplace'],
    deskripsi: 'Satuan hitung untuk jumlah individu ternak. Standar Indonesia untuk populasi ternak.',
    jumlahPenggunaan: 184_000, createdAt: '2023-01-01', updatedAt: '2023-01-01',
    createdBy: 'System Admin', tags: ['hitung', 'individu', 'populasi'],
  },
  {
    id: 'SU-007', kode: 'SU-SAK', nama: 'Sak (50kg)', namaEn: 'Sack (50kg)',
    kategori: 'Satuan Ukur', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Pakan', 'Stok & Inventaris', 'Marketplace'],
    deskripsi: 'Satuan kemasan standar pakan ternak Indonesia. 1 sak = 50 kg. Umum untuk dedak, konsentrat, dll.',
    jumlahPenggunaan: 42_800, createdAt: '2023-01-01', updatedAt: '2023-01-01',
    createdBy: 'System Admin', tags: ['kemasan', 'bulk', 'lokal'],
  },

  // ═══════════════════════════════════════════════════════
  // 11. REFERENSI GEOGRAFIS
  // ═══════════════════════════════════════════════════════
  {
    id: 'GEO-001', kode: 'GEO-ID', nama: 'Indonesia', namaEn: 'Indonesia',
    kategori: 'Referensi Geografis', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Geografis', 'Platform'],
    deskripsi: 'Negara utama platform TernakHub. Mencakup 38 provinsi, 514 kabupaten/kota.',
    jumlahPenggunaan: 284_000, createdAt: '2023-01-01', updatedAt: '2026-01-01',
    createdBy: 'System Admin', tags: ['negara', 'nasional'],
  },
  {
    id: 'GEO-002', kode: 'GEO-JABAR', nama: 'Jawa Barat', namaEn: 'West Java',
    kategori: 'Referensi Geografis', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Geografis', 'Ternak', 'Layanan'],
    deskripsi: 'Provinsi dengan populasi ternak ruminansia terbesar. Pusat kambing PE, domba Garut, sapi Simental.',
    parentId: 'GEO-001', parentNama: 'Indonesia',
    jumlahPenggunaan: 42_800, createdAt: '2023-01-15', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['provinsi', 'Jawa', 'sentra ternak'],
  },
  {
    id: 'GEO-003', kode: 'GEO-JATIM', nama: 'Jawa Timur', namaEn: 'East Java',
    kategori: 'Referensi Geografis', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Geografis', 'Ternak', 'Marketplace'],
    deskripsi: 'Provinsi dengan populasi sapi terbesar nasional. Sentra sapi peranakan: Ngawi, Tuban, Lamongan.',
    parentId: 'GEO-001', parentNama: 'Indonesia',
    jumlahPenggunaan: 48_400, createdAt: '2023-01-15', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['provinsi', 'Jawa', 'sapi'],
  },
  {
    id: 'GEO-004', kode: 'GEO-JATENG', nama: 'Jawa Tengah', namaEn: 'Central Java',
    kategori: 'Referensi Geografis', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Geografis', 'Ternak'],
    deskripsi: 'Sentra ternak kambing (Bligon, Jawarandu) dan sapi perah (Boyolali, Wonosobo).',
    parentId: 'GEO-001', parentNama: 'Indonesia',
    jumlahPenggunaan: 28_400, createdAt: '2023-01-15', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['provinsi', 'Jawa', 'sapi perah'],
  },
  {
    id: 'GEO-005', kode: 'GEO-SULSEL', nama: 'Sulawesi Selatan', namaEn: 'South Sulawesi',
    kategori: 'Referensi Geografis', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Geografis', 'Ternak'],
    deskripsi: 'Sentra kerbau (Tana Toraja) dan sapi Bali. Penting untuk program perbibitan nasional.',
    parentId: 'GEO-001', parentNama: 'Indonesia',
    jumlahPenggunaan: 12_840, createdAt: '2023-02-01', updatedAt: '2026-05-01',
    createdBy: 'System Admin', tags: ['provinsi', 'Sulawesi', 'kerbau'],
  },
  {
    id: 'GEO-006', kode: 'GEO-NTB', nama: 'Nusa Tenggara Barat (NTB)', namaEn: 'West Nusa Tenggara',
    kategori: 'Referensi Geografis', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Geografis', 'Ternak', 'Marketplace'],
    deskripsi: 'Sentra sapi Bali dan sapi Bima. Provinsi pengekspor sapi terbesar kedua di Indonesia.',
    parentId: 'GEO-001', parentNama: 'Indonesia',
    jumlahPenggunaan: 18_200, createdAt: '2023-02-01', updatedAt: '2026-05-01',
    createdBy: 'System Admin', tags: ['provinsi', 'NTT', 'sapi Bali'],
  },
  {
    id: 'GEO-007', kode: 'GEO-SUMBAR', nama: 'Sumatera Barat', namaEn: 'West Sumatra',
    kategori: 'Referensi Geografis', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Geografis', 'Ternak'],
    deskripsi: 'Sentra sapi Pesisir dan kerbau Agam. Tradisi ternak kerbau erat dengan budaya Minangkabau.',
    parentId: 'GEO-001', parentNama: 'Indonesia',
    jumlahPenggunaan: 8_420, createdAt: '2023-03-01', updatedAt: '2026-04-01',
    createdBy: 'System Admin', tags: ['provinsi', 'Sumatera', 'kerbau'],
  },
  {
    id: 'GEO-008', kode: 'GEO-BALI', nama: 'Bali', namaEn: 'Bali',
    kategori: 'Referensi Geografis', status: 'Aktif', scope: 'Indonesia Spesifik',
    modulTerkait: ['Geografis', 'Ternak', 'Layanan'],
    deskripsi: 'Sentra sapi Bali murni. Sapi Bali adalah plasma nutfah asli Indonesia yang dilindungi.',
    parentId: 'GEO-001', parentNama: 'Indonesia',
    jumlahPenggunaan: 14_200, createdAt: '2023-02-01', updatedAt: '2026-05-01',
    createdBy: 'System Admin', tags: ['provinsi', 'sapi Bali', 'plasma nutfah'],
  },

  // ═══════════════════════════════════════════════════════
  // 12. MATA UANG
  // ═══════════════════════════════════════════════════════
  {
    id: 'MT-001', kode: 'MT-IDR', nama: 'Rupiah (IDR)', namaEn: 'Indonesian Rupiah',
    kategori: 'Mata Uang', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Keuangan', 'Marketplace'],
    deskripsi: 'Mata uang utama platform TernakHub. Semua transaksi, harga, dan laporan keuangan menggunakan Rupiah.',
    jumlahPenggunaan: 284_000, createdAt: '2023-01-01', updatedAt: '2026-01-01',
    createdBy: 'System Admin', tags: ['utama', 'IDR', 'Rupiah'],
  },
  {
    id: 'MT-002', kode: 'MT-USD', nama: 'Dolar Amerika (USD)', namaEn: 'US Dollar',
    kategori: 'Mata Uang', status: 'Tidak Aktif', scope: 'Platform Global',
    modulTerkait: ['Keuangan', 'Marketplace'],
    deskripsi: 'Mata uang USD — dipersiapkan untuk ekspansi internasional. Belum aktif di transaksi platform.',
    jumlahPenggunaan: 0, createdAt: '2023-01-01', updatedAt: '2026-01-01',
    createdBy: 'System Admin', tags: ['ekspansi', 'internasional', 'reserved'],
  },
  {
    id: 'MT-003', kode: 'MT-MYR', nama: 'Ringgit Malaysia (MYR)', namaEn: 'Malaysian Ringgit',
    kategori: 'Mata Uang', status: 'Tidak Aktif', scope: 'Regional',
    modulTerkait: ['Keuangan', 'Marketplace'],
    deskripsi: 'Mata uang MYR — dipersiapkan untuk ekspansi ke Malaysia. Belum aktif di transaksi platform.',
    jumlahPenggunaan: 0, createdAt: '2023-06-01', updatedAt: '2026-01-01',
    createdBy: 'System Admin', tags: ['ekspansi', 'ASEAN', 'reserved'],
  },

  // ═══════════════════════════════════════════════════════
  // 13. KONFIGURASI SISTEM
  // ═══════════════════════════════════════════════════════
  {
    id: 'KS-001', kode: 'KS-PLAN-FREE', nama: 'Free Plan', namaEn: 'Free Plan',
    kategori: 'Konfigurasi Sistem', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Platform', 'Workspace'],
    deskripsi: 'Paket langganan gratis. Akses terbatas: maks 10 ternak, fitur dasar saja. Entry-level untuk peternak baru.',
    jumlahPenggunaan: 4_284, createdAt: '2023-01-01', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['plan', 'gratis', 'entry-level'],
  },
  {
    id: 'KS-002', kode: 'KS-PLAN-PRO', nama: 'Pro Plan', namaEn: 'Pro Plan',
    kategori: 'Konfigurasi Sistem', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Platform', 'Workspace'],
    deskripsi: 'Paket langganan berbayar. Akses penuh: ternak tidak terbatas, AI Insight, ekspor laporan, marketplace.',
    jumlahPenggunaan: 1_842, createdAt: '2023-01-01', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['plan', 'berbayar', 'pro'],
  },
  {
    id: 'KS-003', kode: 'KS-ROLE-OWNER', nama: 'Peran: Owner', namaEn: 'Role: Owner',
    kategori: 'Konfigurasi Sistem', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Platform', 'Workspace'],
    deskripsi: 'Peran tertinggi dalam workspace. Hak akses penuh: kelola anggota, arsipkan workspace, atur langganan.',
    jumlahPenggunaan: 5_284, createdAt: '2023-01-01', updatedAt: '2026-01-01',
    createdBy: 'System Admin', tags: ['peran', 'akses penuh', 'admin'],
  },
  {
    id: 'KS-004', kode: 'KS-ROLE-MEMBER', nama: 'Peran: Member', namaEn: 'Role: Member',
    kategori: 'Konfigurasi Sistem', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Platform', 'Workspace'],
    deskripsi: 'Peran standar dalam workspace. Dapat mengelola data operasional, tidak bisa mengubah pengaturan workspace.',
    jumlahPenggunaan: 8_420, createdAt: '2023-01-01', updatedAt: '2026-01-01',
    createdBy: 'System Admin', tags: ['peran', 'operasional'],
  },
  {
    id: 'KS-005', kode: 'KS-VERIF-LEVEL', nama: 'Level Verifikasi Workspace', namaEn: 'Workspace Verification Level',
    kategori: 'Konfigurasi Sistem', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Platform', 'Workspace'],
    deskripsi: 'Sistem 4 level verifikasi workspace: Unverified → Basic → Advanced → Premium. Mempengaruhi batas fitur.',
    jumlahPenggunaan: 5_284, createdAt: '2023-06-01', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['verifikasi', 'trust', 'level'],
  },
  {
    id: 'KS-006', kode: 'KS-NOTIF-PUSH', nama: 'Notifikasi Push', namaEn: 'Push Notification',
    kategori: 'Konfigurasi Sistem', status: 'Aktif', scope: 'Platform Global',
    modulTerkait: ['Platform'],
    deskripsi: 'Referensi tipe notifikasi push platform: jadwal pakan, kesehatan hewan, transaksi marketplace, sistem.',
    jumlahPenggunaan: 48_400, createdAt: '2023-03-01', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['notifikasi', 'push', 'real-time'],
  },
];

// ─── Category Summary (derived from DM_MASTER_LIST) ───────────────────────────

function buildCategorySummaries(): CategorySummary[] {
  const map = new Map<MasterCategory, {
    entries: MasterEntry[];
    lastUpdated: string;
  }>();

  for (const e of DM_MASTER_LIST) {
    if (!map.has(e.kategori)) map.set(e.kategori, { entries: [], lastUpdated: e.updatedAt });
    const rec = map.get(e.kategori)!;
    rec.entries.push(e);
    if (e.updatedAt > rec.lastUpdated) rec.lastUpdated = e.updatedAt;
  }

  const summaries: CategorySummary[] = [];
  for (const [kategori, rec] of map.entries()) {
    const cfg = MASTER_CATEGORY_CONFIG[kategori];
    const allModules = Array.from(new Set(rec.entries.flatMap(e => e.modulTerkait)));
    summaries.push({
      kategori,
      icon:         cfg.icon,
      color:        cfg.color,
      totalRecords: rec.entries.length,
      aktif:        rec.entries.filter(e => e.status === 'Aktif').length,
      tidakAktif:   rec.entries.filter(e => e.status === 'Tidak Aktif').length,
      deprecated:   rec.entries.filter(e => e.status === 'Deprecated').length,
      lastUpdated:  rec.lastUpdated,
      modulTerkait: allModules as MasterModule[],
      deskripsi: {
        'Spesies Ternak':      'Spesies ternak yang didukung platform.',
        'Ras Ternak':          'Ras / breed per spesies yang terdaftar.',
        'Kategori Pakan':      'Kategori pakan ternak lintas spesies.',
        'Kategori Obat':       'Klasifikasi obat hewan berdasarkan farmakoterapi.',
        'Kategori Vaksin':     'Vaksin pencegahan penyakit ternak berdasarkan target patogen.',
        'Kategori Penyakit':   'Klasifikasi penyakit ternak berdasarkan etiologi.',
        'Kategori Layanan':    'Tipe jasa yang tersedia di platform.',
        'Tipe Workspace':      'Jenis workspace yang dapat dibuat peternak.',
        'Kategori Marketplace':'Kategori listing jual-beli di Marketplace.',
        'Satuan Ukur':         'Satuan pengukuran berat, volume, dan jumlah.',
        'Referensi Geografis': 'Wilayah administratif Indonesia yang relevan untuk ternak.',
        'Mata Uang':           'Mata uang yang didukung untuk transaksi.',
        'Konfigurasi Sistem':  'Referensi konfigurasi dan kebijakan platform.',
      }[kategori] ?? '',
    });
  }
  return summaries;
}

export const DM_CATEGORY_SUMMARIES: CategorySummary[] = buildCategorySummaries();

// ─── Platform Stats ───────────────────────────────────────────────────────────

export interface DataMasterStats {
  totalCategories:  number;
  totalRecords:     number;
  activeRecords:    number;
  deprecatedRecords:number;
  inactiveRecords:  number;
  lastUpdated:      string;
}

export const DM_PLATFORM_STATS: DataMasterStats = (() => {
  const list = DM_MASTER_LIST;
  return {
    totalCategories:   DM_CATEGORY_SUMMARIES.length,
    totalRecords:      list.length,
    activeRecords:     list.filter(r => r.status === 'Aktif').length,
    deprecatedRecords: list.filter(r => r.status === 'Deprecated').length,
    inactiveRecords:   list.filter(r => r.status === 'Tidak Aktif').length,
    lastUpdated:       '2026-07-18 08:00',
  };
})();

// ─── Filter helpers ───────────────────────────────────────────────────────────

export function filterDmEntries(
  list: MasterEntry[],
  opts: {
    keyword?:   string;
    kategori?:  MasterCategory | 'All';
    status?:    MasterStatus   | 'All';
    modul?:     MasterModule   | 'All';
    updatedAfter?: string;
  },
): MasterEntry[] {
  return list.filter(r => {
    const kw = (opts.keyword ?? '').trim().toLowerCase();
    if (kw && !r.nama.toLowerCase().includes(kw) && !r.kode.toLowerCase().includes(kw) && !r.namaEn?.toLowerCase().includes(kw)) return false;
    if (opts.kategori && opts.kategori !== 'All' && r.kategori !== opts.kategori) return false;
    if (opts.status   && opts.status   !== 'All' && r.status   !== opts.status)   return false;
    if (opts.modul    && opts.modul    !== 'All' && !r.modulTerkait.includes(opts.modul)) return false;
    if (opts.updatedAfter && r.updatedAt < opts.updatedAfter) return false;
    return true;
  });
}

export const ALL_MASTER_CATEGORIES: MasterCategory[] = [
  'Spesies Ternak', 'Ras Ternak', 'Kategori Pakan', 'Kategori Obat',
  'Kategori Vaksin', 'Kategori Penyakit', 'Kategori Layanan', 'Tipe Workspace',
  'Kategori Marketplace', 'Satuan Ukur', 'Referensi Geografis', 'Mata Uang',
  'Konfigurasi Sistem',
];

export const ALL_MODULES: MasterModule[] = [
  'Ternak', 'Pakan', 'Kesehatan Hewan', 'Reproduksi', 'Marketplace',
  'Workspace', 'Stok & Inventaris', 'Keuangan', 'Layanan', 'Platform', 'Geografis',
];
