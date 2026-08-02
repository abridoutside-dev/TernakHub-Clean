// ─── Public & Private Profile Foundation ──────────────────────────────────────
// PROFILE-001 — Public & Private Profile Foundation
//
// Architecture:
//  • PublicWorkspaceProfile  — visible to all users
//  • PrivateWorkspaceProfile — visible only to Workspace members/owners/admins
//  • PublicUserProfile       — limited public identity card
//  • PrivateUserProfile      — full identity, visible only to the account holder
//  • ViewerRole              — derived at query time; gates PrivateProfile access
//
// This module is read-only from the UI layer.
// Editing, privacy management, and social features are out of scope (PROFILE-001).

import { generateUUID } from '../utils/uuid';
import type { WorkspaceJenis } from '../components/TopAppBar';
import type { MembershipTier, VerifikasiStatus } from './profileData';
import { computeTrustScore } from './marketplaceTrustData';

// ─── Access Control Types ────────────────────────────────────────────────────

/** Derived viewer role — determines which profile sections are visible. */
export type ViewerRole = 'public' | 'member' | 'admin' | 'owner' | 'platform_admin';

/** Source of the access decision — for audit/display purposes. */
export type AccessReason =
  | 'not_a_member'
  | 'workspace_member'
  | 'workspace_admin'
  | 'workspace_owner'
  | 'platform_administrator';

export interface AccessDecision {
  role: ViewerRole;
  reason: AccessReason;
  canViewPrivate: boolean;
  canEditProfile: boolean;    // reserved — always false in PROFILE-001
  canManageMembers: boolean;  // reserved — always false in PROFILE-001
}

// ─── Trust & Verification Types ──────────────────────────────────────────────

export type TrustBadge =
  | 'Terverifikasi Penuh'
  | 'Terverifikasi Sebagian'
  | 'Belum Terverifikasi'
  | 'Dalam Proses';

export interface TrustSummary {
  /** 0–100 score, null = not yet computed (placeholder). */
  skor: number | null;
  badge: TrustBadge;
  statusVerifikasi: VerifikasiStatus;
  /** Which verification types have been completed. */
  verifikasiSelesai: string[];
  /** Which verification types are still pending. */
  verifikasiPending: string[];
}

// ─── Public Workspace Profile ─────────────────────────────────────────────────

export interface MarketplaceSummary {
  totalListing: number;
  listingAktif: number;
  totalTransaksiSelesai: number;
  ratingRataRata: number | null;
  jumlahUlasan: number;
}

export interface PublicStatistik {
  totalTernak: number;
  totalBatch: number;
  totalListing: number;
  totalTransaksi: number;
  tahunAktif: number;
}

export interface PublicWorkspaceProfile {
  workspaceId: string;
  namaWorkspace: string;
  jenisWorkspace: WorkspaceJenis;
  /** Emoji logo placeholder — real upload reserved for future phase. */
  logo: string;
  /** Emoji banner placeholder. */
  banner: string;
  slug: string;
  deskripsi: string;
  /** City/Region only — full address is private. */
  lokasiUmum: string;
  /** e.g. ['Domba', 'Kambing', 'Sapi'] */
  jenisTernak: string[];
  /** e.g. ['Penjualan Bibit', 'Jasa Inseminasi', 'Konsultasi'] */
  layanan: string[];
  marketplaceSummary: MarketplaceSummary;
  trustSummary: TrustSummary;
  statistikPublik: PublicStatistik;
  statusVerifikasi: VerifikasiStatus;
  bergabungSejak: string;   // ISO yyyy-mm-dd
}

// ─── Private Workspace Profile ────────────────────────────────────────────────

export interface KontakInternal {
  picNama: string;
  email: string;
  nomorHP: string;
  nomorWA: string;
}

export interface SubscriptionDetail {
  plan: MembershipTier;
  statusBayar: 'Aktif' | 'Jatuh Tempo' | 'Gratis';
  tanggalMulai: string;
  tanggalBerakhir: string | null;
  fiturAktif: string[];
}

export interface PengaturanWorkspace {
  visibilitasProfil: 'Publik' | 'Semua Member' | 'Owner Saja';
  izinListing: boolean;
  izinMarketing: boolean;
  notifikasiEmail: boolean;
  notifikasiWhatsApp: boolean;
}

export interface StatistikInternal {
  estimasiNilaiAset: number;          // IDR
  totalPendapatanBulanIni: number;    // IDR
  totalPengeluaranBulanIni: number;   // IDR
  marginBersih: string;               // e.g. '18.4%'
  tingkatKonversiListing: string;     // e.g. '34%'
  avgResponseTime: string;            // e.g. '< 2 jam'
}

export interface PrivateWorkspaceProfile {
  workspaceId: string;
  kontakInternal: KontakInternal;
  subscriptionDetail: SubscriptionDetail;
  pengaturan: PengaturanWorkspace;
  statistikInternal: StatistikInternal;
  /** Free-text internal notes — visible to members/owners only. */
  catatanInternal: string;
  terakhirDiperbarui: string;    // ISO
}

// ─── Public User Profile ──────────────────────────────────────────────────────

export interface PublicUserProfile {
  userId: string;
  displayName: string;
  username: string;
  /** Emoji avatar placeholder. */
  avatar: string;
  /** City/Region only. */
  lokasiUmum: string;
  statusVerifikasi: VerifikasiStatus;
  /** Roles the user holds across their workspaces, aggregated. */
  peranUtama: string;
  bergabungSejak: string;
  totalWorkspace: number;
  bio: string;
}

// ─── Private User Profile ────────────────────────────────────────────────────

export interface PrivateUserProfile {
  userId: string;
  email: string;
  nomorHP: string;
  membership: MembershipTier;
  statusAkun: 'Aktif' | 'Nonaktif' | 'Ditangguhkan';
  pengaturanPrivasi: {
    profilTerlihatPublik: boolean;
    emailTerlihat: boolean;
    nomorHPTerlihat: boolean;
  };
  aktivitasAkhir: string;   // ISO
  loginTerakhir: string;    // ISO
  perangkatAktif: number;
}

// ─── Seed Data — Public Workspace Profiles ────────────────────────────────────
// IDs selaras dengan WORKSPACE_MANAGEMENT_LIST (w1–w6).

const PUBLIC_WORKSPACE_PROFILES: PublicWorkspaceProfile[] = [
  {
    workspaceId: 'w1',
    namaWorkspace: 'Berkah Farm Garut',
    jenisWorkspace: 'Peternakan',
    logo: '🐑',
    banner: '🌿',
    slug: 'berkah-farm-garut',
    deskripsi:
      'Peternakan domba dan kambing terpadu di kawasan Garut, Jawa Barat. Fokus pada produksi daging berkualitas tinggi dan bibit unggul bersertifikat. Beroperasi sejak 2024 dengan standar peternakan modern.',
    lokasiUmum: 'Garut, Jawa Barat',
    jenisTernak: ['Domba', 'Kambing'],
    layanan: [
      'Penjualan Bibit Unggul',
      'Penjualan Ternak Siap Potong',
      'Konsultasi Manajemen Ternak',
      'Kemitraan Penggemukan',
    ],
    marketplaceSummary: {
      totalListing: 38,
      listingAktif: 12,
      totalTransaksiSelesai: 94,
      ratingRataRata: 4.8,
      jumlahUlasan: 67,
    },
    trustSummary: {
      skor: null, // computed live via getPublicWorkspaceProfile() — do not hardcode
      badge: 'Terverifikasi Penuh',
      statusVerifikasi: 'Terverifikasi',
      verifikasiSelesai: ['Identitas Pemilik', 'Lokasi Kandang', 'Dokumen Usaha'],
      verifikasiPending: [],
    },
    statistikPublik: {
      totalTernak: 75,
      totalBatch: 8,
      totalListing: 38,
      totalTransaksi: 94,
      tahunAktif: 1,
    },
    statusVerifikasi: 'Terverifikasi',
    bergabungSejak: '2024-03-15',
  },
  {
    workspaceId: 'w2',
    namaWorkspace: 'Berkah Farm Tasik',
    jenisWorkspace: 'Peternakan',
    logo: '🐑',
    banner: '🌾',
    slug: 'berkah-farm-tasik',
    deskripsi:
      'Cabang peternakan di Tasikmalaya, spesialisasi kambing perah dan produk olahan susu segar. Bermitra dengan IKM pengolahan susu lokal untuk rantai pasok yang terintegrasi.',
    lokasiUmum: 'Tasikmalaya, Jawa Barat',
    jenisTernak: ['Kambing Perah'],
    layanan: [
      'Penjualan Kambing Perah',
      'Penjualan Susu Segar',
      'Pelatihan Pemerahan',
    ],
    marketplaceSummary: {
      totalListing: 14,
      listingAktif: 5,
      totalTransaksiSelesai: 31,
      ratingRataRata: 4.6,
      jumlahUlasan: 22,
    },
    trustSummary: {
      skor: null,
      badge: 'Dalam Proses',
      statusVerifikasi: 'Belum Terverifikasi',
      verifikasiSelesai: ['Identitas Pemilik'],
      verifikasiPending: ['Lokasi Kandang', 'Dokumen Usaha'],
    },
    statistikPublik: {
      totalTernak: 24,
      totalBatch: 2,
      totalListing: 14,
      totalTransaksi: 31,
      tahunAktif: 1,
    },
    statusVerifikasi: 'Belum Terverifikasi',
    bergabungSejak: '2024-07-01',
  },
  {
    workspaceId: 'w3',
    namaWorkspace: 'Toko Pakan Berkah',
    jenisWorkspace: 'Toko Pakan',
    logo: '🌾',
    banner: '🌱',
    slug: 'toko-pakan-berkah',
    deskripsi:
      'Distributor pakan ternak berkualitas tinggi. Melayani peternak se-wilayah Garut dan sekitarnya dengan stok pakan lengkap dari produsen terpercaya. Layanan antar untuk pembelian minimal 100 kg.',
    lokasiUmum: 'Garut, Jawa Barat',
    jenisTernak: [],
    layanan: [
      'Penjualan Pakan Konsentrat',
      'Penjualan Hijauan Pakan',
      'Konsultasi Nutrisi Ternak',
      'Layanan Antar',
      'Pembuatan Formula Pakan',
    ],
    marketplaceSummary: {
      totalListing: 62,
      listingAktif: 21,
      totalTransaksiSelesai: 218,
      ratingRataRata: 4.9,
      jumlahUlasan: 143,
    },
    trustSummary: {
      skor: null, // computed live via getPublicWorkspaceProfile() — do not hardcode
      badge: 'Terverifikasi Penuh',
      statusVerifikasi: 'Terverifikasi',
      verifikasiSelesai: ['Identitas Pemilik', 'Lokasi Toko', 'Dokumen Usaha', 'SIUP Perdagangan'],
      verifikasiPending: [],
    },
    statistikPublik: {
      totalTernak: 0,
      totalBatch: 0,
      totalListing: 62,
      totalTransaksi: 218,
      tahunAktif: 1,
    },
    statusVerifikasi: 'Terverifikasi',
    bergabungSejak: '2024-05-20',
  },
  {
    workspaceId: 'w4',
    namaWorkspace: 'Berkah Transport',
    jenisWorkspace: 'Transporter',
    logo: '🚚',
    banner: '🛤️',
    slug: 'berkah-transport',
    deskripsi:
      'Layanan transportasi ternak berpendingin dan berventilasi untuk menjaga kenyamanan hewan selama perjalanan. Armada 4 unit, coverage Jawa Barat–Jawa Tengah. Berpengalaman dalam pengiriman antar kota dan antar provinsi.',
    lokasiUmum: 'Garut, Jawa Barat',
    jenisTernak: ['Semua Jenis Ternak Besar & Kecil'],
    layanan: [
      'Transportasi Ternak Dalam Kota',
      'Transportasi Ternak Antar Kota',
      'Transportasi Antar Provinsi',
      'Sewa Armada Harian',
    ],
    marketplaceSummary: {
      totalListing: 6,
      listingAktif: 4,
      totalTransaksiSelesai: 47,
      ratingRataRata: 4.7,
      jumlahUlasan: 38,
    },
    trustSummary: {
      skor: null,
      badge: 'Terverifikasi Sebagian',
      statusVerifikasi: 'Belum Terverifikasi',
      verifikasiSelesai: ['Identitas Pemilik', 'Data Armada'],
      verifikasiPending: ['Izin Usaha Transportasi'],
    },
    statistikPublik: {
      totalTernak: 0,
      totalBatch: 0,
      totalListing: 6,
      totalTransaksi: 47,
      tahunAktif: 1,
    },
    statusVerifikasi: 'Belum Terverifikasi',
    bergabungSejak: '2024-09-10',
  },
  {
    workspaceId: 'w5',
    namaWorkspace: 'drh. Amelia Putri',
    jenisWorkspace: 'Dokter Hewan',
    logo: '👨‍⚕️',
    banner: '🩺',
    slug: 'drh-amelia-putri',
    deskripsi:
      'Praktik dokter hewan berlisensi, spesialisasi hewan ternak besar (sapi, kerbau, kuda). Layanan kunjungan kandang dan konsultasi online tersedia. Berpengalaman lebih dari 8 tahun di lapangan.',
    lokasiUmum: 'Garut, Jawa Barat',
    jenisTernak: ['Sapi', 'Kerbau', 'Kuda', 'Domba', 'Kambing'],
    layanan: [
      'Pemeriksaan Kesehatan Ternak',
      'Vaksinasi & Imunisasi',
      'Pengobatan & Tindakan Medis',
      'Konsultasi Online',
      'Kunjungan Kandang',
      'Inseminasi Buatan',
    ],
    marketplaceSummary: {
      totalListing: 8,
      listingAktif: 5,
      totalTransaksiSelesai: 112,
      ratingRataRata: 4.95,
      jumlahUlasan: 89,
    },
    trustSummary: {
      skor: null, // computed live via getPublicWorkspaceProfile() — do not hardcode
      badge: 'Terverifikasi Penuh',
      statusVerifikasi: 'Terverifikasi',
      verifikasiSelesai: ['Identitas', 'Lisensi Dokter Hewan', 'Praktik Resmi', 'Lokasi Klinik'],
      verifikasiPending: [],
    },
    statistikPublik: {
      totalTernak: 0,
      totalBatch: 0,
      totalListing: 8,
      totalTransaksi: 112,
      tahunAktif: 1,
    },
    statusVerifikasi: 'Terverifikasi',
    bergabungSejak: '2025-01-05',
  },
  {
    workspaceId: 'w6',
    namaWorkspace: 'Klinik Hewan Sejahtera',
    jenisWorkspace: 'Klinik Hewan',
    logo: '🏥',
    banner: '🏥',
    slug: 'klinik-hewan-sejahtera',
    deskripsi:
      'Klinik hewan dengan fasilitas lengkap meliputi ruang rawat inap, laboratorium dasar, dan apotek hewan. Sementara diarsipkan untuk renovasi gedung. Akan kembali beroperasi penuh Q2 2026.',
    lokasiUmum: 'Garut, Jawa Barat',
    jenisTernak: ['Semua Jenis Hewan Ternak'],
    layanan: [
      'Rawat Jalan',
      'Rawat Inap',
      'Bedah Minor',
      'Laboratorium Dasar',
      'Apotek Hewan',
    ],
    marketplaceSummary: {
      totalListing: 3,
      listingAktif: 0,
      totalTransaksiSelesai: 28,
      ratingRataRata: 4.7,
      jumlahUlasan: 24,
    },
    trustSummary: {
      skor: null,
      badge: 'Dalam Proses',
      statusVerifikasi: 'Belum Terverifikasi',
      verifikasiSelesai: ['Identitas Pemilik'],
      verifikasiPending: ['Izin Klinik', 'Lisensi Praktik'],
    },
    statistikPublik: {
      totalTernak: 0,
      totalBatch: 0,
      totalListing: 3,
      totalTransaksi: 28,
      tahunAktif: 1,
    },
    statusVerifikasi: 'Belum Terverifikasi',
    bergabungSejak: '2025-03-18',
  },
];

// ─── Seed Data — Private Workspace Profiles ───────────────────────────────────

const PRIVATE_WORKSPACE_PROFILES: PrivateWorkspaceProfile[] = [
  {
    workspaceId: 'w1',
    kontakInternal: {
      picNama: 'Budi Santoso',
      email: 'budi.santoso@berkahfarm.id',
      nomorHP: '+62 812-3456-7890',
      nomorWA: '+62 812-3456-7890',
    },
    subscriptionDetail: {
      plan: 'PRO',
      statusBayar: 'Aktif',
      tanggalMulai: '2024-03-15',
      tanggalBerakhir: '2025-03-15',
      fiturAktif: ['AI Insight', 'Marketplace Listing', 'Multi-Member', 'Export Data', 'Priority Support'],
    },
    pengaturan: {
      visibilitasProfil: 'Publik',
      izinListing: true,
      izinMarketing: true,
      notifikasiEmail: true,
      notifikasiWhatsApp: true,
    },
    statistikInternal: {
      estimasiNilaiAset: 187_500_000,
      totalPendapatanBulanIni: 34_200_000,
      totalPengeluaranBulanIni: 22_800_000,
      marginBersih: '33.3%',
      tingkatKonversiListing: '42%',
      avgResponseTime: '< 1 jam',
    },
    catatanInternal:
      'Target ekspansi ke Bandung Q3 2025. Sedang proses kerjasama MOU dengan koperasi peternak Garut. Review harga jual dilakukan setiap awal bulan.',
    terakhirDiperbarui: new Date('2026-07-01').toISOString(),
  },
  {
    workspaceId: 'w2',
    kontakInternal: {
      picNama: 'Budi Santoso',
      email: 'tasik@berkahfarm.id',
      nomorHP: '+62 813-5678-9012',
      nomorWA: '+62 813-5678-9012',
    },
    subscriptionDetail: {
      plan: 'FREE',
      statusBayar: 'Gratis',
      tanggalMulai: '2024-07-01',
      tanggalBerakhir: null,
      fiturAktif: ['Marketplace Listing (max 10)', 'Basic Analytics'],
    },
    pengaturan: {
      visibilitasProfil: 'Publik',
      izinListing: true,
      izinMarketing: false,
      notifikasiEmail: true,
      notifikasiWhatsApp: false,
    },
    statistikInternal: {
      estimasiNilaiAset: 48_000_000,
      totalPendapatanBulanIni: 9_500_000,
      totalPengeluaranBulanIni: 7_100_000,
      marginBersih: '25.3%',
      tingkatKonversiListing: '28%',
      avgResponseTime: '< 4 jam',
    },
    catatanInternal: 'Pertimbangkan upgrade ke PRO untuk akses AI Insight dan listing tidak terbatas.',
    terakhirDiperbarui: new Date('2026-06-15').toISOString(),
  },
  {
    workspaceId: 'w3',
    kontakInternal: {
      picNama: 'Rini Hartati',
      email: 'toko.pakan@berkahfarm.id',
      nomorHP: '+62 812-9988-7766',
      nomorWA: '+62 812-9988-7766',
    },
    subscriptionDetail: {
      plan: 'PRO',
      statusBayar: 'Aktif',
      tanggalMulai: '2024-05-20',
      tanggalBerakhir: '2025-05-20',
      fiturAktif: ['AI Insight', 'Marketplace Listing', 'Stok Pakan Advanced', 'Export Data', 'Priority Support'],
    },
    pengaturan: {
      visibilitasProfil: 'Publik',
      izinListing: true,
      izinMarketing: true,
      notifikasiEmail: true,
      notifikasiWhatsApp: true,
    },
    statistikInternal: {
      estimasiNilaiAset: 312_000_000,
      totalPendapatanBulanIni: 68_400_000,
      totalPengeluaranBulanIni: 51_200_000,
      marginBersih: '25.1%',
      tingkatKonversiListing: '54%',
      avgResponseTime: '< 2 jam',
    },
    catatanInternal:
      'Stok dedak padi menipis — perlu reorder minggu ini. Negosiasi harga bungkil kedelai dengan supplier baru masih berjalan.',
    terakhirDiperbarui: new Date('2026-07-10').toISOString(),
  },
  {
    workspaceId: 'w4',
    kontakInternal: {
      picNama: 'Hendra Prasetyo',
      email: 'ops@berkah-transport.id',
      nomorHP: '+62 811-2233-4455',
      nomorWA: '+62 811-2233-4455',
    },
    subscriptionDetail: {
      plan: 'FREE',
      statusBayar: 'Gratis',
      tanggalMulai: '2024-09-10',
      tanggalBerakhir: null,
      fiturAktif: ['Marketplace Listing (max 10)', 'Basic Analytics'],
    },
    pengaturan: {
      visibilitasProfil: 'Publik',
      izinListing: true,
      izinMarketing: false,
      notifikasiEmail: false,
      notifikasiWhatsApp: true,
    },
    statistikInternal: {
      estimasiNilaiAset: 560_000_000,
      totalPendapatanBulanIni: 22_500_000,
      totalPengeluaranBulanIni: 18_000_000,
      marginBersih: '20.0%',
      tingkatKonversiListing: '38%',
      avgResponseTime: '< 3 jam',
    },
    catatanInternal: 'Servis rutin armada unit TRK-002 jadwal bulan depan. Pertimbangkan tambahan armada 2025.',
    terakhirDiperbarui: new Date('2026-06-28').toISOString(),
  },
  {
    workspaceId: 'w5',
    kontakInternal: {
      picNama: 'drh. Amelia Putri',
      email: 'drh.amelia@gmail.com',
      nomorHP: '+62 818-0099-1122',
      nomorWA: '+62 818-0099-1122',
    },
    subscriptionDetail: {
      plan: 'FREE',
      statusBayar: 'Gratis',
      tanggalMulai: '2025-01-05',
      tanggalBerakhir: null,
      fiturAktif: ['Marketplace Listing (max 10)', 'Basic Analytics'],
    },
    pengaturan: {
      visibilitasProfil: 'Publik',
      izinListing: true,
      izinMarketing: true,
      notifikasiEmail: true,
      notifikasiWhatsApp: true,
    },
    statistikInternal: {
      estimasiNilaiAset: 0,
      totalPendapatanBulanIni: 14_800_000,
      totalPengeluaranBulanIni: 4_200_000,
      marginBersih: '71.6%',
      tingkatKonversiListing: '72%',
      avgResponseTime: '< 1 jam',
    },
    catatanInternal: 'Rencana buka klinik fisik 2026. Sertifikasi PDHI dalam proses perpanjangan.',
    terakhirDiperbarui: new Date('2026-07-05').toISOString(),
  },
  {
    workspaceId: 'w6',
    kontakInternal: {
      picNama: 'drh. Amelia Putri',
      email: 'klinik.sejahtera@gmail.com',
      nomorHP: '+62 819-7788-5544',
      nomorWA: '+62 819-7788-5544',
    },
    subscriptionDetail: {
      plan: 'FREE',
      statusBayar: 'Gratis',
      tanggalMulai: '2025-03-18',
      tanggalBerakhir: null,
      fiturAktif: ['Basic Analytics'],
    },
    pengaturan: {
      visibilitasProfil: 'Semua Member',
      izinListing: false,
      izinMarketing: false,
      notifikasiEmail: true,
      notifikasiWhatsApp: false,
    },
    statistikInternal: {
      estimasiNilaiAset: 1_200_000_000,
      totalPendapatanBulanIni: 0,
      totalPengeluaranBulanIni: 8_500_000,
      marginBersih: '—',
      tingkatKonversiListing: '—',
      avgResponseTime: '—',
    },
    catatanInternal: 'Renovasi gedung sedang berjalan. Target selesai Agustus 2026. Listing dihentikan sementara.',
    terakhirDiperbarui: new Date('2026-05-01').toISOString(),
  },
];

// ─── Seed Data — Public User Profiles ────────────────────────────────────────

const PUBLIC_USER_PROFILES: PublicUserProfile[] = [
  {
    userId: 'usr-berkah-001',
    displayName: 'Budi Santoso',
    username: '@budi.berkah',
    avatar: '👨‍🌾',
    lokasiUmum: 'Garut, Jawa Barat',
    statusVerifikasi: 'Terverifikasi',
    peranUtama: 'Pemilik Peternakan & Pengusaha Ternak',
    bergabungSejak: '2024-03-15',
    totalWorkspace: 5,
    bio: 'Peternak domba dan kambing generasi kedua di Garut. Mengelola 5 workspace di TernakHub — dari peternakan, toko pakan, hingga transportasi ternak.',
  },
  {
    userId: 'usr-amelia-001',
    displayName: 'drh. Amelia Putri',
    username: '@drh.amelia',
    avatar: '👩‍⚕️',
    lokasiUmum: 'Garut, Jawa Barat',
    statusVerifikasi: 'Terverifikasi',
    peranUtama: 'Dokter Hewan Praktisi',
    bergabungSejak: '2025-01-05',
    totalWorkspace: 2,
    bio: 'Dokter hewan berlisensi dengan spesialisasi ternak besar. Praktik mandiri dan pengelola Klinik Hewan Sejahtera di Garut.',
  },
];

// ─── Seed Data — Private User Profiles ───────────────────────────────────────

const PRIVATE_USER_PROFILES: PrivateUserProfile[] = [
  {
    userId: 'usr-berkah-001',
    email: 'budi.santoso@berkahfarm.id',
    nomorHP: '+62 812-3456-7890',
    membership: 'PRO',
    statusAkun: 'Aktif',
    pengaturanPrivasi: {
      profilTerlihatPublik: true,
      emailTerlihat: false,
      nomorHPTerlihat: false,
    },
    aktivitasAkhir: new Date('2026-07-18').toISOString(),
    loginTerakhir: new Date('2026-07-18T07:32:00').toISOString(),
    perangkatAktif: 2,
  },
  {
    userId: 'usr-amelia-001',
    email: 'drh.amelia@gmail.com',
    nomorHP: '+62 818-0099-1122',
    membership: 'FREE',
    statusAkun: 'Aktif',
    pengaturanPrivasi: {
      profilTerlihatPublik: true,
      emailTerlihat: true,
      nomorHPTerlihat: false,
    },
    aktivitasAkhir: new Date('2026-07-17').toISOString(),
    loginTerakhir: new Date('2026-07-17T14:15:00').toISOString(),
    perangkatAktif: 1,
  },
];

// ─── Member Registry (for access control derivation) ─────────────────────────
// Mirror of workspaceManagementData — kept local to avoid circular import.
// owner of w1,w2,w3,w4 = 'usr-berkah-001'; member of w6 = 'usr-berkah-001'

type MemberEntry = { userId: string; workspaceId: string; role: 'Owner' | 'Admin' | 'Member' };

const WORKSPACE_MEMBER_ROLES: MemberEntry[] = [
  { userId: 'usr-berkah-001', workspaceId: 'w1', role: 'Owner' },
  { userId: 'usr-berkah-001', workspaceId: 'w2', role: 'Owner' },
  { userId: 'usr-berkah-001', workspaceId: 'w3', role: 'Owner' },
  { userId: 'usr-berkah-001', workspaceId: 'w4', role: 'Owner' },
  { userId: 'usr-amelia-001', workspaceId: 'w5', role: 'Owner' },
  { userId: 'usr-amelia-001', workspaceId: 'w6', role: 'Owner' },
  { userId: 'usr-berkah-001', workspaceId: 'w6', role: 'Admin' },
];

// ─── Queries — Public Workspace Profile ──────────────────────────────────────

/**
 * Overlay a profile's trustSummary.skor with the live value from the
 * marketplace Trust Engine.  All other trustSummary fields (badge,
 * statusVerifikasi, verifikasiSelesai, verifikasiPending) come from the
 * verification system and are intentionally kept as-is.
 */
function withLiveTrustSkor(profile: PublicWorkspaceProfile): PublicWorkspaceProfile {
  const liveSkor = computeTrustScore(profile.workspaceId).skor;
  return {
    ...profile,
    trustSummary: {
      ...profile.trustSummary,
      skor: liveSkor,
    },
  };
}

/** Retrieve the public profile for a workspace. Returns undefined if not found. */
export function getPublicWorkspaceProfile(workspaceId: string): PublicWorkspaceProfile | undefined {
  const profile = PUBLIC_WORKSPACE_PROFILES.find((p) => p.workspaceId === workspaceId);
  return profile ? withLiveTrustSkor(profile) : undefined;
}

/** All public workspace profiles (for directory/search listing). */
export function getAllPublicWorkspaceProfiles(): PublicWorkspaceProfile[] {
  return PUBLIC_WORKSPACE_PROFILES.map(withLiveTrustSkor);
}

// ─── Queries — Private Workspace Profile ──────────────────────────────────────

/**
 * Retrieve the private profile for a workspace.
 * Caller MUST check AccessDecision.canViewPrivate before using this.
 */
export function getPrivateWorkspaceProfile(workspaceId: string): PrivateWorkspaceProfile | undefined {
  return PRIVATE_WORKSPACE_PROFILES.find((p) => p.workspaceId === workspaceId);
}

// ─── Queries — User Profiles ─────────────────────────────────────────────────

export function getPublicUserProfile(userId: string): PublicUserProfile | undefined {
  return PUBLIC_USER_PROFILES.find((p) => p.userId === userId);
}

/**
 * Retrieve private user profile.
 * Caller MUST ensure viewerId === userId (own profile) or role === 'platform_admin'.
 */
export function getPrivateUserProfile(userId: string): PrivateUserProfile | undefined {
  return PRIVATE_USER_PROFILES.find((p) => p.userId === userId);
}

export function getAllPublicUserProfiles(): PublicUserProfile[] {
  return [...PUBLIC_USER_PROFILES];
}

// ─── Access Control — Derive Viewer Role ─────────────────────────────────────

/**
 * Derive the viewer's access level for a given workspace.
 *
 * Architecture note: In production this would be evaluated server-side using
 * authenticated session claims. Here it is simulated using seed membership data
 * for prototype purposes.
 *
 * @param workspaceId  The workspace being viewed.
 * @param viewerUserId The currently authenticated user's ID (or null = guest).
 */
export function deriveAccessDecision(
  workspaceId: string,
  viewerUserId: string | null
): AccessDecision {
  if (!viewerUserId) {
    return {
      role: 'public',
      reason: 'not_a_member',
      canViewPrivate: false,
      canEditProfile: false,
      canManageMembers: false,
    };
  }

  const entry = WORKSPACE_MEMBER_ROLES.find(
    (m) => m.workspaceId === workspaceId && m.userId === viewerUserId
  );

  if (!entry) {
    return {
      role: 'public',
      reason: 'not_a_member',
      canViewPrivate: false,
      canEditProfile: false,
      canManageMembers: false,
    };
  }

  switch (entry.role) {
    case 'Owner':
      return {
        role: 'owner',
        reason: 'workspace_owner',
        canViewPrivate: true,
        canEditProfile: false, // reserved — PROFILE-001 is read-only
        canManageMembers: false,
      };
    case 'Admin':
      return {
        role: 'admin',
        reason: 'workspace_admin',
        canViewPrivate: true,
        canEditProfile: false,
        canManageMembers: false,
      };
    case 'Member':
      return {
        role: 'member',
        reason: 'workspace_member',
        canViewPrivate: true,
        canEditProfile: false,
        canManageMembers: false,
      };
  }
}

// ─── Search Helpers (UI-only stubs) ──────────────────────────────────────────

export interface ProfileSearchFilters {
  query: string;
  jenisWorkspace: WorkspaceJenis | '';
  lokasiKota: string;
  jenisTernak: string;
}

/**
 * Search public workspace profiles.
 * UI-only in PROFILE-001 — returns a filtered subset for demonstration.
 */
export function searchPublicProfiles(filters: ProfileSearchFilters): PublicWorkspaceProfile[] {
  return PUBLIC_WORKSPACE_PROFILES.filter((p) => {
    const q = filters.query.toLowerCase();
    const matchQuery =
      !q ||
      p.namaWorkspace.toLowerCase().includes(q) ||
      p.deskripsi.toLowerCase().includes(q) ||
      p.lokasiUmum.toLowerCase().includes(q) ||
      p.jenisTernak.some((t) => t.toLowerCase().includes(q));
    const matchJenis = !filters.jenisWorkspace || p.jenisWorkspace === filters.jenisWorkspace;
    const matchLokasi =
      !filters.lokasiKota ||
      p.lokasiUmum.toLowerCase().includes(filters.lokasiKota.toLowerCase());
    const matchTernak =
      !filters.jenisTernak ||
      p.jenisTernak.some((t) => t.toLowerCase().includes(filters.jenisTernak.toLowerCase()));
    return matchQuery && matchJenis && matchLokasi && matchTernak;
  }).map(withLiveTrustSkor);
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const TRUST_BADGE_CONFIG: Record<
  TrustBadge,
  { color: string; bg: string; border: string; icon: string }
> = {
  'Terverifikasi Penuh':    { color: '#166534', bg: '#dcfce7', border: '#86efac', icon: '✓✓' },
  'Terverifikasi Sebagian': { color: '#92400e', bg: '#fef3c7', border: '#fcd34d', icon: '✓'  },
  'Dalam Proses':           { color: '#1e40af', bg: '#dbeafe', border: '#93c5fd', icon: '⋯'  },
  'Belum Terverifikasi':    { color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db', icon: '?'  },
};

export const VIEWER_ROLE_CONFIG: Record<
  ViewerRole,
  { label: string; color: string; bg: string }
> = {
  public:          { label: 'Pengunjung Publik', color: '#6b7280', bg: '#f3f4f6' },
  member:          { label: 'Anggota Workspace', color: '#1e40af', bg: '#dbeafe' },
  admin:           { label: 'Admin Workspace',   color: '#92400e', bg: '#fef3c7' },
  owner:           { label: 'Owner Workspace',   color: '#166534', bg: '#dcfce7' },
  platform_admin:  { label: 'Platform Admin',    color: '#6d28d9', bg: '#ede9fe' },
};

export const JENIS_WORKSPACE_OPTIONS: WorkspaceJenis[] = [
  'Peternakan', 'Toko Pakan', 'Toko Obat', 'Transporter', 'Dokter Hewan', 'Klinik Hewan',
];

export const JENIS_TERNAK_OPTIONS: string[] = [
  'Sapi', 'Kerbau', 'Domba', 'Kambing', 'Babi', 'Ayam', 'Bebek', 'Kuda',
  'Kambing Perah', 'Semua Jenis',
];

/**
 * @deprecated P0-002B — viewer identity must come from AuthContext (useAuth).
 * Nullified; kept only for backward-compat during migration.
 */
export const CURRENT_VIEWER_ID: string | null = null;

// ─── Format Helpers ───────────────────────────────────────────────────────────

export function formatRupiah(amount: number): string {
  if (amount === 0) return 'Rp 0';
  if (amount >= 1_000_000_000)
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  if (amount >= 1_000_000)
    return `Rp ${(amount / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function formatTahunAktif(bergabungSejak: string): number {
  const start = new Date(bergabungSejak).getFullYear();
  const now   = new Date().getFullYear();
  return Math.max(1, now - start + 1);
}

export function formatRating(rating: number | null): string {
  if (rating === null) return '—';
  return rating.toFixed(1);
}

// ─── Unique ID generation (re-export for completeness) ───────────────────────
export { generateUUID };
