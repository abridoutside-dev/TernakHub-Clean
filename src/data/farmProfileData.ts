// ─── Farm Profile Foundation (PFP-001) ────────────────────────────────────────
// Public-facing profile data for Farm Workspaces.
//
// Scope: Farm profile, livestock showcase, services, gallery, summary stats,
//        verification status, and access control.
//
// Architecture rules:
//  - NO private operational data exposed (no weights, health records, financials).
//  - NO editing, messaging, social features, or booking logic.
//  - Reads from this module only — does NOT sync with livestockData.ts in PFP-001.
//  - Access gated by ViewerRole (arch-only; production = server-side claims).
//  - Gallery uses placeholder art — no real image URLs in PFP-001.

// ─── Livestock Species & Breeds ───────────────────────────────────────────────

export type FarmLivestockSpecies =
  | 'Domba'
  | 'Kambing'
  | 'Sapi'
  | 'Kerbau'
  | 'Ayam'
  | 'Itik'
  | 'Kuda';

export const SPECIES_CONFIG: Record<
  FarmLivestockSpecies,
  { icon: string; color: string; bg: string }
> = {
  Domba:  { icon: '🐑', color: '#166534', bg: '#dcfce7' },
  Kambing:{ icon: '🐐', color: '#92400e', bg: '#fef3c7' },
  Sapi:   { icon: '🐄', color: '#1e40af', bg: '#dbeafe' },
  Kerbau: { icon: '🦬', color: '#6b21a8', bg: '#f3e8ff' },
  Ayam:   { icon: '🐔', color: '#b45309', bg: '#fef3c7' },
  Itik:   { icon: '🦆', color: '#0e7490', bg: '#cffafe' },
  Kuda:   { icon: '🐎', color: '#9d174d', bg: '#fce7f3' },
};

// ─── Verification Status ──────────────────────────────────────────────────────

export type FarmVerificationStatus =
  | 'Terverifikasi'
  | 'Dalam Proses'
  | 'Belum Terverifikasi';

export const VERIFICATION_CONFIG: Record<
  FarmVerificationStatus,
  { icon: string; label: string; color: string; bg: string; border: string }
> = {
  Terverifikasi:        { icon: '✅', label: 'Terverifikasi',     color: '#166534', bg: '#dcfce7', border: '#86efac' },
  'Dalam Proses':       { icon: '⏳', label: 'Verifikasi Proses', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  'Belum Terverifikasi':{ icon: '⭕', label: 'Belum Terverifikasi',color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
};

// ─── Farm Service ──────────────────────────────────────────────────────────────

export interface FarmServiceRecord {
  id: string;
  workspaceId: string;
  namaLayanan: string;
  deskripsi: string;
  icon: string;
  kategori: string;
  tersedia: boolean;
}

// ─── Showcase Livestock ───────────────────────────────────────────────────────

export interface ShowcaseLivestockRecord {
  id: string;
  workspaceId: string;
  nama: string;
  jenis: FarmLivestockSpecies;
  ras: string;
  kelamin: 'Jantan' | 'Betina';
  umurTampilan: string;          // e.g. "14 bulan"
  bobotTampilan: string;         // e.g. "±42 kg"
  foto: string;                  // emoji avatar
  prestasi: string[];            // public achievements/awards
  deskripsiPublik: string;       // public-facing description, no health detail
  unggulan: boolean;             // featured in header showcase
}

// ─── Gallery Photo ────────────────────────────────────────────────────────────

export interface FarmGalleryPhoto {
  id: string;
  workspaceId: string;
  judul: string;
  caption: string;
  emoji: string;                 // decorative emoji for placeholder art
  gradientFrom: string;          // CSS color for placeholder gradient
  gradientTo: string;
  tanggal: string;               // ISO date
}

// ─── Farm Profile Meta ────────────────────────────────────────────────────────

export interface FarmProfileMeta {
  workspaceId: string;
  nama: string;
  logo: string;                   // emoji logo
  banner: string;                 // emoji for banner pattern
  deskripsiPublik: string;
  lokasiUmum: string;             // "Garut, Jawa Barat" — never precise address
  provinsi: string;
  tahunBerdiri: number;
  kontakPublik: string;           // phone for public display
  website: string | null;
  verifikasiStatus: FarmVerificationStatus;
  spesies: FarmLivestockSpecies[];
  rasUnggulan: string[];          // featured breeds
  tagline: string;
  bergabungTernakHub: string;     // ISO date
}

// ─── Farm Profile Summary ─────────────────────────────────────────────────────

export interface FarmProfileSummary {
  totalTernak: number;
  listingAktif: number;
  totalTransaksi: number;
  trustScorePlaceholder: string;  // "—" until engine exists
  catatanTerverifikasi: number;   // verified livestock records
}

// ─── Access Control ───────────────────────────────────────────────────────────

export type FarmProfileViewerRole =
  | 'public'
  | 'member'
  | 'admin'
  | 'owner'
  | 'platform_admin';

export interface FarmProfileAccessDecision {
  role: FarmProfileViewerRole;
  canViewPrivateContact: boolean;   // full address, internal phone
  canEditProfile: boolean;          // always false in PFP-001
}

type FarmMemberEntry = {
  userId: string;
  workspaceId: string;
  role: 'Owner' | 'Admin' | 'Member';
};

const FARM_MEMBER_ROLES: FarmMemberEntry[] = [
  { userId: 'usr-budi-001', workspaceId: 'w1', role: 'Owner' },
  { userId: 'usr-sari-002', workspaceId: 'w1', role: 'Admin' },
  { userId: 'usr-joko-003', workspaceId: 'w1', role: 'Member' },
  { userId: 'usr-budi-001', workspaceId: 'w2', role: 'Owner' },
  { userId: 'usr-dedi-004', workspaceId: 'w2', role: 'Member' },
];

export function deriveFarmProfileAccess(
  workspaceId: string,
  viewerUserId: string | null,
): FarmProfileAccessDecision {
  if (!viewerUserId) {
    return { role: 'public', canViewPrivateContact: false, canEditProfile: false };
  }
  const entry = FARM_MEMBER_ROLES.find(
    (m) => m.workspaceId === workspaceId && m.userId === viewerUserId,
  );
  if (!entry) {
    return { role: 'public', canViewPrivateContact: false, canEditProfile: false };
  }
  return {
    role: entry.role === 'Owner' ? 'owner'
        : entry.role === 'Admin' ? 'admin'
        : 'member',
    canViewPrivateContact: true,
    canEditProfile: false, // reserved — PFP-001
  };
}

/**
 * @deprecated P0-002B — viewer identity must come from AuthContext (useAuth).
 * Always null; kept only for backward-compat during migration.
 */
export const CURRENT_FARM_VIEWER_ID: string | null = null;

// ─── Seed Data — Farm Profile Meta ────────────────────────────────────────────

const FARM_PROFILE_META_DB: FarmProfileMeta[] = [
  {
    workspaceId:        'w1',
    nama:               'Berkah Farm Garut',
    logo:               '🐑',
    banner:             '🌿',
    tagline:            'Peternak Domba & Kambing Unggul Priangan Timur',
    deskripsiPublik:
      'Berkah Farm Garut adalah peternakan domba dan kambing terpadu yang berdiri sejak 2018 di kawasan Samarang, Garut, Jawa Barat. Kami berfokus pada produksi bibit unggul Domba Garut asli dan Kambing PE berkualitas tinggi, penggemukan ternak, serta edukasi pertanian bagi peternak lokal. Seluruh proses produksi menggunakan sistem manajemen kandang modern dengan rekam jejak digital melalui TernakHub.',
    lokasiUmum:         'Garut, Jawa Barat',
    provinsi:           'Jawa Barat',
    tahunBerdiri:       2018,
    kontakPublik:       '+62 812-3456-7890',
    website:            'www.berkahfarmgarut.id',
    verifikasiStatus:   'Terverifikasi',
    spesies:            ['Domba', 'Kambing'],
    rasUnggulan:        ['Domba Garut Asli', 'Kambing Peranakan Ettawa (PE)', 'Domba Priangan'],
    bergabungTernakHub: '2024-03-15',
  },
  {
    workspaceId:        'w2',
    nama:               'Berkah Farm Tasik',
    logo:               '🐐',
    banner:             '🌾',
    tagline:            'Spesialis Kambing Perah & Produk Olahan Susu Priangan',
    deskripsiPublik:
      'Berkah Farm Tasik merupakan cabang peternakan yang berspesialisasi pada kambing perah, khususnya Kambing Peranakan Ettawa (PE) dan Saanen crossbreed. Berlokasi di Singaparna, Tasikmalaya, kami memproduksi susu kambing segar, bibit kambing perah berkualitas, dan menyediakan layanan penitipan ternak bagi peternak mitra. Bergabung dengan jaringan TernakHub untuk transparansi dan kemudahan transaksi.',
    lokasiUmum:         'Tasikmalaya, Jawa Barat',
    provinsi:           'Jawa Barat',
    tahunBerdiri:       2021,
    kontakPublik:       '+62 813-5678-9012',
    website:            null,
    verifikasiStatus:   'Dalam Proses',
    spesies:            ['Kambing'],
    rasUnggulan:        ['Kambing PE (Peranakan Ettawa)', 'Kambing Saanen Crossbreed', 'Kambing Boerawa'],
    bergabungTernakHub: '2024-07-01',
  },
];

// ─── Seed Data — Profile Summary ──────────────────────────────────────────────

const FARM_PROFILE_SUMMARY_DB: Record<string, FarmProfileSummary> = {
  w1: {
    totalTernak:            75,
    listingAktif:            8,
    totalTransaksi:         42,
    trustScorePlaceholder:  '—',
    catatanTerverifikasi:   68,
  },
  w2: {
    totalTernak:            31,
    listingAktif:            4,
    totalTransaksi:         19,
    trustScorePlaceholder:  '—',
    catatanTerverifikasi:   22,
  },
};

// ─── Seed Data — Showcase Livestock ───────────────────────────────────────────

const SHOWCASE_LIVESTOCK_DB: ShowcaseLivestockRecord[] = [
  // ── Berkah Farm Garut (w1) ──
  {
    id: 'SLC-001',
    workspaceId: 'w1',
    nama: 'Singo Garut',
    jenis: 'Domba',
    ras: 'Domba Garut Asli',
    kelamin: 'Jantan',
    umurTampilan: '22 bulan',
    bobotTampilan: '±58 kg',
    foto: '🐏',
    prestasi: ['Juara 2 Kontes Domba Garut 2025', 'Bibit Unggul Bersertifikat'],
    deskripsiPublik:
      'Domba Garut jantan dewasa dengan postur ideal dan tanduk simetris. Keturunan indukan juara dari Samarang. Cocok sebagai pejantan unggul atau koleksi.',
    unggulan: true,
  },
  {
    id: 'SLC-002',
    workspaceId: 'w1',
    nama: 'Melati',
    jenis: 'Domba',
    ras: 'Domba Garut Asli',
    kelamin: 'Betina',
    umurTampilan: '18 bulan',
    bobotTampilan: '±38 kg',
    foto: '🐑',
    prestasi: ['Indukan Produktif — 3x beranak kembar'],
    deskripsiPublik:
      'Indukan domba betina produktif dengan rekam jejak 3 kelahiran kembar berturut-turut. Ideal untuk program pengembangan kawanan.',
    unggulan: true,
  },
  {
    id: 'SLC-003',
    workspaceId: 'w1',
    nama: 'Gatotkaca',
    jenis: 'Kambing',
    ras: 'Kambing Peranakan Ettawa (PE)',
    kelamin: 'Jantan',
    umurTampilan: '16 bulan',
    bobotTampilan: '±45 kg',
    foto: '🐐',
    prestasi: ['Bibit Pejantan Terseleksi'],
    deskripsiPublik:
      'Pejantan PE muda dengan konformasi tubuh yang baik — telinga panjang, profil muka khas, dan tulang yang kuat. Cocok untuk program inseminasi.',
    unggulan: false,
  },
  {
    id: 'SLC-004',
    workspaceId: 'w1',
    nama: 'Pertiwi',
    jenis: 'Kambing',
    ras: 'Kambing Peranakan Ettawa (PE)',
    kelamin: 'Betina',
    umurTampilan: '20 bulan',
    bobotTampilan: '±32 kg',
    foto: '🐐',
    prestasi: ['Produksi Susu ±1,2 L/hari'],
    deskripsiPublik:
      'Kambing PE betina laktasi dengan produksi susu konsisten. Temperamen jinak dan mudah dikelola. Cocok untuk peternak pemula.',
    unggulan: false,
  },
  {
    id: 'SLC-005',
    workspaceId: 'w1',
    nama: 'Arjuna',
    jenis: 'Domba',
    ras: 'Domba Priangan',
    kelamin: 'Jantan',
    umurTampilan: '12 bulan',
    bobotTampilan: '±34 kg',
    foto: '🐏',
    prestasi: [],
    deskripsiPublik:
      'Domba Priangan muda dengan pertumbuhan bobot yang baik. Cocok untuk program penggemukan atau qurban berkualitas.',
    unggulan: false,
  },

  // ── Berkah Farm Tasik (w2) ──
  {
    id: 'SLC-101',
    workspaceId: 'w2',
    nama: 'Rinjani',
    jenis: 'Kambing',
    ras: 'Kambing PE (Peranakan Ettawa)',
    kelamin: 'Jantan',
    umurTampilan: '24 bulan',
    bobotTampilan: '±52 kg',
    foto: '🐐',
    prestasi: ['Pejantan Unggul — Keturunan Terdokumentasi 3 Generasi'],
    deskripsiPublik:
      'Pejantan PE premium dengan silsilah terdokumentasi tiga generasi. Postur besar, ras murni PE, telah digunakan dalam 6 program perkawinan.',
    unggulan: true,
  },
  {
    id: 'SLC-102',
    workspaceId: 'w2',
    nama: 'Srikandi',
    jenis: 'Kambing',
    ras: 'Kambing Saanen Crossbreed',
    kelamin: 'Betina',
    umurTampilan: '19 bulan',
    bobotTampilan: '±35 kg',
    foto: '🐐',
    prestasi: ['Produksi Susu ±2,1 L/hari — Rekor Internal Farm'],
    deskripsiPublik:
      'Indukan Saanen-PE dengan produksi susu tertinggi di farm kami. Susu berkualitas tinggi dengan kadar lemak ±4,2%. Bibit betina yang tersedia untuk dijual.',
    unggulan: true,
  },
  {
    id: 'SLC-103',
    workspaceId: 'w2',
    nama: 'Dewi Susu',
    jenis: 'Kambing',
    ras: 'Kambing PE (Peranakan Ettawa)',
    kelamin: 'Betina',
    umurTampilan: '26 bulan',
    bobotTampilan: '±40 kg',
    foto: '🐐',
    prestasi: ['Indukan 4x Beranak', 'Susu Stabil ±1,5 L/hari'],
    deskripsiPublik:
      'Indukan PE senior yang telah beranak 4 kali. Produksi susu stabil di semua laktasi. Genetik yang terbukti untuk program pembibitan.',
    unggulan: false,
  },
];

// ─── Seed Data — Farm Services ────────────────────────────────────────────────

const FARM_SERVICE_DB: FarmServiceRecord[] = [
  // ── Berkah Farm Garut (w1) ──
  {
    id: 'SVC-P001',
    workspaceId: 'w1',
    namaLayanan: 'Penjualan Bibit Unggul',
    deskripsi:
      'Bibit domba dan kambing terseleksi dari indukan terdokumentasi. Tersedia Domba Garut jantan/betina dan Kambing PE usia sapih hingga dewasa. Dilengkapi sertifikat kesehatan.',
    icon: '🐑',
    kategori: 'Penjualan',
    tersedia: true,
  },
  {
    id: 'SVC-P002',
    workspaceId: 'w1',
    namaLayanan: 'Program Penggemukan Mitra',
    deskripsi:
      'Kerjasama penggemukan domba dan kambing dengan sistem bagi hasil. Peternak mitra menyediakan kandang, Berkah Farm menyediakan bibit dan pendampingan teknis.',
    icon: '📈',
    kategori: 'Kerjasama',
    tersedia: true,
  },
  {
    id: 'SVC-P003',
    workspaceId: 'w1',
    namaLayanan: 'Kunjungan Edukasi Farm',
    deskripsi:
      'Program kunjungan terbuka untuk pelajar, mahasiswa, dan calon peternak. Mengenal sistem manajemen kandang modern, feeding, dan pencatatan digital TernakHub.',
    icon: '🎓',
    kategori: 'Edukasi',
    tersedia: true,
  },
  {
    id: 'SVC-P004',
    workspaceId: 'w1',
    namaLayanan: 'Penyediaan Ternak Qurban',
    deskripsi:
      'Domba dan kambing pilihan untuk keperluan qurban. Tersedia paket perorangan maupun kolektif. Pemesanan dibuka mulai 3 bulan sebelum Idul Adha.',
    icon: '🕌',
    kategori: 'Musiman',
    tersedia: false,
  },
  {
    id: 'SVC-P005',
    workspaceId: 'w1',
    namaLayanan: 'Konsultasi Manajemen Peternakan',
    deskripsi:
      'Sesi konsultasi teknis manajemen kandang, nutrisi pakan, dan pencatatan ternak untuk peternak pemula hingga skala menengah di wilayah Priangan.',
    icon: '💡',
    kategori: 'Konsultasi',
    tersedia: true,
  },

  // ── Berkah Farm Tasik (w2) ──
  {
    id: 'SVC-P101',
    workspaceId: 'w2',
    namaLayanan: 'Penjualan Susu Kambing Segar',
    deskripsi:
      'Susu kambing PE dan Saanen segar diproduksi setiap pagi. Tersedia dalam kemasan 250 mL, 500 mL, dan 1 liter. Pengiriman area Tasikmalaya dan sekitarnya.',
    icon: '🥛',
    kategori: 'Produk',
    tersedia: true,
  },
  {
    id: 'SVC-P102',
    workspaceId: 'w2',
    namaLayanan: 'Penjualan Bibit Kambing Perah',
    deskripsi:
      'Bibit kambing PE dan Saanen crossbreed dari indukan berproduksi susu tinggi. Tersedia jantan dan betina. Dilengkapi rekam jejak produksi indukan.',
    icon: '🐐',
    kategori: 'Penjualan',
    tersedia: true,
  },
  {
    id: 'SVC-P103',
    workspaceId: 'w2',
    namaLayanan: 'Penitipan Kambing Perah',
    deskripsi:
      'Layanan penitipan kambing perah bagi peternak yang tidak memiliki fasilitas kandang memadai. Ternak dikelola penuh oleh tim Berkah Farm Tasik.',
    icon: '🏡',
    kategori: 'Layanan',
    tersedia: true,
  },
  {
    id: 'SVC-P104',
    workspaceId: 'w2',
    namaLayanan: 'Pelatihan Pemerahan & Pengolahan Susu',
    deskripsi:
      'Pelatihan teknis pemerahan yang higienis dan pengolahan susu kambing menjadi produk olahan (yogurt, sabun). Cocok untuk UMKM dan ibu rumah tangga.',
    icon: '🎓',
    kategori: 'Edukasi',
    tersedia: false,
  },
];

// ─── Seed Data — Gallery Photos ───────────────────────────────────────────────

const FARM_GALLERY_DB: FarmGalleryPhoto[] = [
  // ── Berkah Farm Garut (w1) ──
  {
    id: 'GAL-001',
    workspaceId: 'w1',
    judul: 'Kawanan Domba Garut',
    caption: 'Kawanan domba garut asli saat makan siang di padang penggembalaan Samarang.',
    emoji: '🐑',
    gradientFrom: '#14532d',
    gradientTo: '#166534',
    tanggal: '2026-06-15',
  },
  {
    id: 'GAL-002',
    workspaceId: 'w1',
    judul: 'Kandang Modern',
    caption: 'Kandang berventilasi baik dengan sistem manajemen limbah terpadu.',
    emoji: '🏠',
    gradientFrom: '#78350f',
    gradientTo: '#92400e',
    tanggal: '2026-05-20',
  },
  {
    id: 'GAL-003',
    workspaceId: 'w1',
    judul: 'Kontes Domba Garut 2025',
    caption: 'Singo Garut meraih Juara 2 di Kontes Domba Garut tingkat kabupaten, Juli 2025.',
    emoji: '🏆',
    gradientFrom: '#d97706',
    gradientTo: '#b45309',
    tanggal: '2025-07-22',
  },
  {
    id: 'GAL-004',
    workspaceId: 'w1',
    judul: 'Pemberian Pakan Hijauan',
    caption: 'Rutinitas pemberian pakan hijauan segar setiap pagi untuk kawanan kambing PE.',
    emoji: '🌿',
    gradientFrom: '#166534',
    gradientTo: '#15803d',
    tanggal: '2026-07-01',
  },
  {
    id: 'GAL-005',
    workspaceId: 'w1',
    judul: 'Kunjungan Mahasiswa',
    caption: 'Mahasiswa Fakultas Peternakan IPB dalam program kunjungan edukasi farm Mei 2026.',
    emoji: '🎓',
    gradientFrom: '#1e3a5f',
    gradientTo: '#1e40af',
    tanggal: '2026-05-12',
  },
  {
    id: 'GAL-006',
    workspaceId: 'w1',
    judul: 'Anakan Domba Musim Semi',
    caption: 'Enam anakan domba lahir kembar di bulan April 2026. Semua sehat dan aktif.',
    emoji: '🐣',
    gradientFrom: '#0e7490',
    gradientTo: '#0891b2',
    tanggal: '2026-04-18',
  },

  // ── Berkah Farm Tasik (w2) ──
  {
    id: 'GAL-101',
    workspaceId: 'w2',
    judul: 'Pemerahan Pagi Hari',
    caption: 'Proses pemerahan susu kambing PE dan Saanen setiap pukul 06.00 WIB.',
    emoji: '🥛',
    gradientFrom: '#9d174d',
    gradientTo: '#be185d',
    tanggal: '2026-07-10',
  },
  {
    id: 'GAL-102',
    workspaceId: 'w2',
    judul: 'Kandang Kambing Perah',
    caption: 'Kandang kambing perah dengan sistem drainase dan ventilasi yang baik di Singaparna.',
    emoji: '🐐',
    gradientFrom: '#4c1d95',
    gradientTo: '#6d28d9',
    tanggal: '2026-06-05',
  },
  {
    id: 'GAL-103',
    workspaceId: 'w2',
    judul: 'Produk Susu Segar',
    caption: 'Kemasan susu kambing segar 500 mL siap distribusi ke pelanggan harian.',
    emoji: '🍼',
    gradientFrom: '#155e75',
    gradientTo: '#0e7490',
    tanggal: '2026-07-05',
  },
  {
    id: 'GAL-104',
    workspaceId: 'w2',
    judul: 'Bibit Kambing PE Muda',
    caption: 'Kelompok cempe PE usia 2–3 bulan yang siap disapih dan dijual sebagai bibit.',
    emoji: '🐑',
    gradientFrom: '#14532d',
    gradientTo: '#166534',
    tanggal: '2026-05-28',
  },
];

// ─── Accessor Functions ────────────────────────────────────────────────────────

export function getFarmProfileMeta(workspaceId: string): FarmProfileMeta | null {
  return FARM_PROFILE_META_DB.find((m) => m.workspaceId === workspaceId) ?? null;
}

export function getFarmProfileSummary(workspaceId: string): FarmProfileSummary {
  return (
    FARM_PROFILE_SUMMARY_DB[workspaceId] ?? {
      totalTernak:           0,
      listingAktif:          0,
      totalTransaksi:        0,
      trustScorePlaceholder: '—',
      catatanTerverifikasi:  0,
    }
  );
}

export function getShowcaseLivestockByWorkspace(
  workspaceId: string,
): ShowcaseLivestockRecord[] {
  return SHOWCASE_LIVESTOCK_DB.filter((s) => s.workspaceId === workspaceId);
}

export function getFarmServicesByWorkspace(
  workspaceId: string,
): FarmServiceRecord[] {
  return FARM_SERVICE_DB.filter((s) => s.workspaceId === workspaceId);
}

export function getGalleryByWorkspace(workspaceId: string): FarmGalleryPhoto[] {
  return FARM_GALLERY_DB
    .filter((g) => g.workspaceId === workspaceId)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatTahunAktif(tahunBerdiri: number): string {
  const tahun = new Date().getFullYear() - tahunBerdiri;
  return tahun === 0 ? 'Kurang dari 1 tahun' : `${tahun} tahun`;
}

export function formatTanggalPFP(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('id-ID', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });
}
