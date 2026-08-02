// ─── Admin Data Master Data — ADM-003C ───────────────────────────────────────
// Realistic dummy data only. No production database, no external API.

export type MasterCategory =
  | 'Spesies Ternak'
  | 'Ras Ternak'
  | 'Kategori Pakan'
  | 'Kategori Obat'
  | 'Tipe Workspace'
  | 'Tipe Kandang'
  | 'Satuan Berat'
  | 'Alasan Arsip';

export type MasterStatus = 'Aktif' | 'Tidak Aktif' | 'Diarsipkan';
export type MasterScope = 'Platform Global' | 'Indonesia Spesifik' | 'Regional';

export interface MasterEntry {
  id: string;
  kode: string;
  nama: string;
  namaEn?: string;
  kategori: MasterCategory;
  status: MasterStatus;
  scope: MasterScope;
  deskripsi: string;
  parentId?: string;     // for breeds → linked to species
  parentNama?: string;
  jumlahPenggunaan: number;  // how many workspace records reference this
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
}

// ─── Platform stats ───────────────────────────────────────────────────────────

export interface DataMasterPlatformStats {
  feedReferences: number;
  medicineReferences: number;
  breedReferences: number;
  speciesReferences: number;
  locationReferences: number;
  totalEntries: number;
  lastUpdated: string;
}

export const DATA_MASTER_PLATFORM_STATS: DataMasterPlatformStats = {
  feedReferences: 248,
  medicineReferences: 184,
  breedReferences: 127,
  speciesReferences: 18,
  locationReferences: 514,
  totalEntries: 1_091,
  lastUpdated: '2026-07-18 08:00',
};

// ─── Config maps ─────────────────────────────────────────────────────────────

export const MASTER_STATUS_CONFIG: Record<MasterStatus, { label: string; color: string; bg: string; dot: string }> = {
  'Aktif':        { label: 'Aktif',        color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  'Tidak Aktif':  { label: 'Tidak Aktif',  color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  'Diarsipkan':   { label: 'Diarsipkan',   color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
};

export const MASTER_CATEGORY_CONFIG: Record<MasterCategory, { icon: string; color: string }> = {
  'Spesies Ternak':   { icon: '🐄', color: '#10b981' },
  'Ras Ternak':       { icon: '🐮', color: '#059669' },
  'Kategori Pakan':   { icon: '🌾', color: '#f59e0b' },
  'Kategori Obat':    { icon: '💊', color: '#ef4444' },
  'Tipe Workspace':   { icon: '🏢', color: '#3b82f6' },
  'Tipe Kandang':     { icon: '🏠', color: '#8b5cf6' },
  'Satuan Berat':     { icon: '⚖️', color: '#64748b' },
  'Alasan Arsip':     { icon: '📁', color: '#94a3b8' },
};

// ─── Dummy data (30 entries) ──────────────────────────────────────────────────

export const ADMIN_MASTER_LIST: MasterEntry[] = [
  // ── Spesies ─────────────────────────────────────────────────────────────────
  {
    id: 'SP-001', kode: 'SP-SAPI', nama: 'Sapi', namaEn: 'Cattle',
    kategori: 'Spesies Ternak', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Ternak sapi (Bos taurus / Bos indicus) untuk keperluan daging, susu, dan pembibitan.',
    jumlahPenggunaan: 48_240, createdAt: '2023-01-15', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['unggulan', 'daging', 'susu'],
  },
  {
    id: 'SP-002', kode: 'SP-KAMBING', nama: 'Kambing', namaEn: 'Goat',
    kategori: 'Spesies Ternak', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Kambing (Capra hircus) — ternak kecil produktif untuk daging dan susu.',
    jumlahPenggunaan: 24_180, createdAt: '2023-01-15', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['ternak kecil', 'daging'],
  },
  {
    id: 'SP-003', kode: 'SP-DOMBA', nama: 'Domba', namaEn: 'Sheep',
    kategori: 'Spesies Ternak', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Domba (Ovis aries) — ternak ruminansia kecil untuk daging dan wol.',
    jumlahPenggunaan: 12_840, createdAt: '2023-01-15', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['ternak kecil', 'wol'],
  },
  {
    id: 'SP-004', kode: 'SP-BABI', nama: 'Babi', namaEn: 'Pig',
    kategori: 'Spesies Ternak', status: 'Aktif', scope: 'Indonesia Spesifik',
    deskripsi: 'Babi (Sus scrofa domesticus) — ternak monogastrik di wilayah non-Muslim.',
    jumlahPenggunaan: 8_420, createdAt: '2023-01-15', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['monogastrik', 'regional'],
  },
  {
    id: 'SP-005', kode: 'SP-AYAM', nama: 'Ayam', namaEn: 'Chicken',
    kategori: 'Spesies Ternak', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Ayam (Gallus gallus domesticus) — unggas paling umum untuk daging dan telur.',
    jumlahPenggunaan: 62_800, createdAt: '2023-01-15', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['unggas', 'telur', 'daging'],
  },

  // ── Ras Ternak ───────────────────────────────────────────────────────────────
  {
    id: 'RAS-001', kode: 'RAS-SIMENTAL', nama: 'Simental', namaEn: 'Simmental',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Ras sapi pedaging asal Swiss. Pertumbuhan cepat, produksi daging tinggi.',
    parentId: 'SP-001', parentNama: 'Sapi',
    jumlahPenggunaan: 14_820, createdAt: '2023-02-01', updatedAt: '2026-05-12',
    createdBy: 'System Admin', tags: ['pedaging', 'impor'],
  },
  {
    id: 'RAS-002', kode: 'RAS-LIMOUSIN', nama: 'Limousin', namaEn: 'Limousin',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Ras sapi asal Prancis. Dikenal karena efisiensi pakan dan karkas berkualitas.',
    parentId: 'SP-001', parentNama: 'Sapi',
    jumlahPenggunaan: 11_240, createdAt: '2023-02-01', updatedAt: '2026-05-12',
    createdBy: 'System Admin', tags: ['pedaging', 'impor'],
  },
  {
    id: 'RAS-003', kode: 'RAS-PO', nama: 'Peranakan Ongole (PO)', namaEn: 'Ongole Cross',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Indonesia Spesifik',
    deskripsi: 'Ras sapi lokal Indonesia. Adaptif terhadap iklim tropis dan pakan lokal.',
    parentId: 'SP-001', parentNama: 'Sapi',
    jumlahPenggunaan: 18_400, createdAt: '2023-02-01', updatedAt: '2026-05-12',
    createdBy: 'System Admin', tags: ['lokal', 'adaptif'],
  },
  {
    id: 'RAS-004', kode: 'RAS-ETAWA', nama: 'Peranakan Etawah (PE)', namaEn: 'Etawah Cross',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Indonesia Spesifik',
    deskripsi: 'Ras kambing unggul Indonesia hasil silang Etawah–Kacang. Produksi susu tinggi.',
    parentId: 'SP-002', parentNama: 'Kambing',
    jumlahPenggunaan: 9_840, createdAt: '2023-02-01', updatedAt: '2026-06-01',
    createdBy: 'System Admin', tags: ['lokal', 'susu'],
  },
  {
    id: 'RAS-005', kode: 'RAS-BLIGON', nama: 'Bligon', namaEn: 'Bligon',
    kategori: 'Ras Ternak', status: 'Aktif', scope: 'Indonesia Spesifik',
    deskripsi: 'Ras kambing lokal asal Jawa Tengah. Prolifik, tahan penyakit lokal.',
    parentId: 'SP-002', parentNama: 'Kambing',
    jumlahPenggunaan: 4_210, createdAt: '2023-03-10', updatedAt: '2026-06-01',
    createdBy: 'Dewi Admin', tags: ['lokal', 'Jawa Tengah'],
  },

  // ── Kategori Pakan ────────────────────────────────────────────────────────────
  {
    id: 'KP-001', kode: 'KP-HIJAUAN', nama: 'Hijauan Segar', namaEn: 'Fresh Forage',
    kategori: 'Kategori Pakan', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Rumput dan leguminosa segar sebagai pakan utama ruminansia.',
    jumlahPenggunaan: 38_400, createdAt: '2023-01-20', updatedAt: '2026-04-15',
    createdBy: 'System Admin', tags: ['ruminansia', 'utama'],
  },
  {
    id: 'KP-002', kode: 'KP-KONSENTRAT', nama: 'Konsentrat', namaEn: 'Concentrate',
    kategori: 'Kategori Pakan', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Pakan berenergi tinggi: dedak, ampas tahu, bungkil kelapa sawit, dsb.',
    jumlahPenggunaan: 29_800, createdAt: '2023-01-20', updatedAt: '2026-04-15',
    createdBy: 'System Admin', tags: ['energi tinggi', 'suplemen'],
  },
  {
    id: 'KP-003', kode: 'KP-SILASE', nama: 'Silase', namaEn: 'Silage',
    kategori: 'Kategori Pakan', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Pakan fermentasi dari hijauan untuk mempertahankan nilai nutrisi.',
    jumlahPenggunaan: 14_200, createdAt: '2023-02-10', updatedAt: '2026-04-15',
    createdBy: 'System Admin', tags: ['fermentasi', 'awet'],
  },
  {
    id: 'KP-004', kode: 'KP-MINERAL', nama: 'Mineral & Vitamin', namaEn: 'Minerals & Vitamins',
    kategori: 'Kategori Pakan', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Suplemen mineral dan vitamin untuk mendukung pertumbuhan dan produktivitas ternak.',
    jumlahPenggunaan: 22_400, createdAt: '2023-01-20', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['suplemen', 'kesehatan'],
  },
  {
    id: 'KP-005', kode: 'KP-JERAMI', nama: 'Pakan Berserat (Roughage)', namaEn: 'Roughage',
    kategori: 'Kategori Pakan', status: 'Aktif', scope: 'Indonesia Spesifik',
    deskripsi: 'Jerami padi, sekam, dan bahan berserat lain sebagai pakan alternatif.',
    jumlahPenggunaan: 18_900, createdAt: '2023-01-20', updatedAt: '2026-04-15',
    createdBy: 'System Admin', tags: ['alternatif', 'murah'],
  },

  // ── Kategori Obat ─────────────────────────────────────────────────────────────
  {
    id: 'KO-001', kode: 'KO-ANTIBIOTIK', nama: 'Antibiotik', namaEn: 'Antibiotic',
    kategori: 'Kategori Obat', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Agen antibakteri untuk pengobatan infeksi bakteri pada ternak.',
    jumlahPenggunaan: 28_400, createdAt: '2023-01-25', updatedAt: '2026-06-10',
    createdBy: 'System Admin', tags: ['resep dokter', 'bakteri'],
  },
  {
    id: 'KO-002', kode: 'KO-ANTIPARASIT', nama: 'Antiparasit', namaEn: 'Antiparasitic',
    kategori: 'Kategori Obat', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Obat untuk mengatasi parasit internal (cacing) dan eksternal (kutu, tungau).',
    jumlahPenggunaan: 21_840, createdAt: '2023-01-25', updatedAt: '2026-06-10',
    createdBy: 'System Admin', tags: ['cacing', 'parasit eksternal'],
  },
  {
    id: 'KO-003', kode: 'KO-VAKSIN', nama: 'Vaksin', namaEn: 'Vaccine',
    kategori: 'Kategori Obat', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Vaksin pencegahan penyakit ternak: Anthrax, Brucella, PMK, dll.',
    jumlahPenggunaan: 34_200, createdAt: '2023-01-25', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['pencegahan', 'wajib'],
  },
  {
    id: 'KO-004', kode: 'KO-VITAMIN', nama: 'Vitamin & Suplemen', namaEn: 'Vitamin & Supplement',
    kategori: 'Kategori Obat', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Suplemen vitamin A, D, E, B-kompleks untuk menjaga kesehatan dan produktivitas.',
    jumlahPenggunaan: 19_400, createdAt: '2023-01-25', updatedAt: '2026-06-10',
    createdBy: 'System Admin', tags: ['suplemen', 'OTC'],
  },
  {
    id: 'KO-005', kode: 'KO-HORMON', nama: 'Hormon Reproduksi', namaEn: 'Reproductive Hormone',
    kategori: 'Kategori Obat', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Hormon untuk sinkronisasi birahi, IB, dan manajemen reproduksi.',
    jumlahPenggunaan: 12_800, createdAt: '2023-02-10', updatedAt: '2026-07-01',
    createdBy: 'System Admin', tags: ['reproduksi', 'resep dokter'],
  },

  // ── Tipe Workspace ────────────────────────────────────────────────────────────
  {
    id: 'TW-001', kode: 'TW-PETERNAKAN', nama: 'Peternakan', namaEn: 'Livestock Farm',
    kategori: 'Tipe Workspace', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Workspace utama untuk operasional peternakan: ternak, pakan, kesehatan hewan.',
    jumlahPenggunaan: 5_840, createdAt: '2023-01-10', updatedAt: '2026-01-01',
    createdBy: 'System Admin', tags: ['utama'],
  },
  {
    id: 'TW-002', kode: 'TW-KLINIK', nama: 'Klinik Hewan', namaEn: 'Veterinary Clinic',
    kategori: 'Tipe Workspace', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Workspace untuk klinik hewan yang menyediakan layanan kesehatan ternak.',
    jumlahPenggunaan: 842, createdAt: '2023-01-10', updatedAt: '2026-01-01',
    createdBy: 'System Admin', tags: ['layanan'],
  },
  {
    id: 'TW-003', kode: 'TW-DOKTER', nama: 'Dokter Hewan', namaEn: 'Veterinarian',
    kategori: 'Tipe Workspace', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Workspace personal untuk dokter hewan mandiri yang berpraktik di lapangan.',
    jumlahPenggunaan: 480, createdAt: '2023-01-10', updatedAt: '2026-01-01',
    createdBy: 'System Admin', tags: ['layanan', 'personal'],
  },
  {
    id: 'TW-004', kode: 'TW-TRANSPORT', nama: 'Jasa Transportasi', namaEn: 'Livestock Transport',
    kategori: 'Tipe Workspace', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Workspace untuk penyedia jasa transportasi khusus ternak.',
    jumlahPenggunaan: 214, createdAt: '2023-04-20', updatedAt: '2026-03-01',
    createdBy: 'Siti Admin', tags: ['layanan', 'logistik'],
  },
  {
    id: 'TW-005', kode: 'TW-KOPERASI', nama: 'Koperasi Peternak', namaEn: 'Livestock Cooperative',
    kategori: 'Tipe Workspace', status: 'Tidak Aktif', scope: 'Indonesia Spesifik',
    deskripsi: 'Tipe workspace koperasi — dalam evaluasi untuk pengembangan fitur kolaboratif.',
    jumlahPenggunaan: 38, createdAt: '2023-06-01', updatedAt: '2026-05-01',
    createdBy: 'Budi Admin', tags: ['koperasi', 'evaluasi'],
  },

  // ── Tipe Kandang ──────────────────────────────────────────────────────────────
  {
    id: 'TK-001', kode: 'TK-INDIVIDU', nama: 'Kandang Individu', namaEn: 'Individual Pen',
    kategori: 'Tipe Kandang', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Kandang satu ekor — biasanya untuk pejantan atau hewan sakit.',
    jumlahPenggunaan: 12_800, createdAt: '2023-01-15', updatedAt: '2026-03-01',
    createdBy: 'System Admin', tags: ['individu'],
  },
  {
    id: 'TK-002', kode: 'TK-KELOMPOK', nama: 'Kandang Kelompok', namaEn: 'Group Pen',
    kategori: 'Tipe Kandang', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Kandang untuk sejumlah hewan — pengelompokan berdasarkan usia/berat.',
    jumlahPenggunaan: 28_400, createdAt: '2023-01-15', updatedAt: '2026-03-01',
    createdBy: 'System Admin', tags: ['kelompok', 'umum'],
  },

  // ── Satuan Berat ──────────────────────────────────────────────────────────────
  {
    id: 'SB-001', kode: 'SB-KG', nama: 'Kilogram (kg)', namaEn: 'Kilogram',
    kategori: 'Satuan Berat', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Satuan berat utama untuk ternak dan pakan.',
    jumlahPenggunaan: 284_000, createdAt: '2023-01-01', updatedAt: '2023-01-01',
    createdBy: 'System Admin', tags: ['utama'],
  },
  {
    id: 'SB-002', kode: 'SB-GRAM', nama: 'Gram (g)', namaEn: 'Gram',
    kategori: 'Satuan Berat', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Satuan berat untuk obat dan suplemen dosis kecil.',
    jumlahPenggunaan: 48_400, createdAt: '2023-01-01', updatedAt: '2023-01-01',
    createdBy: 'System Admin', tags: ['obat'],
  },
  {
    id: 'SB-003', kode: 'SB-TON', nama: 'Ton (t)', namaEn: 'Metric Ton',
    kategori: 'Satuan Berat', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Satuan berat untuk pengiriman dan stok pakan skala besar.',
    jumlahPenggunaan: 8_400, createdAt: '2023-01-01', updatedAt: '2023-01-01',
    createdBy: 'System Admin', tags: ['bulk', 'logistik'],
  },

  // ── Alasan Arsip ─────────────────────────────────────────────────────────────
  {
    id: 'AA-001', kode: 'AA-MATI', nama: 'Mati', namaEn: 'Deceased',
    kategori: 'Alasan Arsip', status: 'Aktif', scope: 'Platform Global',
    deskripsi: 'Ternak diarsipkan karena kematian alami atau penyakit.',
    jumlahPenggunaan: 14_820, createdAt: '2023-01-15', updatedAt: '2026-01-01',
    createdBy: 'System Admin', tags: ['final'],
  },
];

// ─── Filter helper ────────────────────────────────────────────────────────────

export function filterMasterEntries(
  list: MasterEntry[],
  opts: {
    keyword?: string;
    kategori?: MasterCategory | 'All';
    status?: MasterStatus | 'All';
    scope?: MasterScope | 'All';
  },
): MasterEntry[] {
  return list.filter((r) => {
    const kw = opts.keyword?.toLowerCase();
    if (kw && !r.nama.toLowerCase().includes(kw) && !r.kode.toLowerCase().includes(kw) && !r.deskripsi.toLowerCase().includes(kw)) return false;
    if (opts.kategori && opts.kategori !== 'All' && r.kategori !== opts.kategori) return false;
    if (opts.status && opts.status !== 'All' && r.status !== opts.status) return false;
    if (opts.scope && opts.scope !== 'All' && r.scope !== opts.scope) return false;
    return true;
  });
}
