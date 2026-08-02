// ─── Veterinary Workspace Foundation (VET-001) ────────────────────────────────
// Operational data layer for Veterinary Workspace (DokterHewan & KlinikHewan types).
//
// Scope: Veterinarian registry, service catalog, service areas, activity history.
// NO diagnosis engine · NO prescription workflow · NO medical records · NO telemedicine.
//
// Architecture rules:
//  - This module owns vet staff, services, coverage, and activity log.
//  - Marketplace reads layananVeterinerData (future) via Reference UUID only.
//  - Access gated by ViewerRole (arch-only; production = server-side claims).

import { generateUUID } from '../utils/uuid';

// ─── Veterinary Service Types ─────────────────────────────────────────────────

export type VetServiceType =
  | 'Konsultasi Kesehatan'
  | 'Kunjungan Kandang'
  | 'Vaksinasi'
  | 'Pengobatan Cacing'
  | 'Pemeriksaan Reproduksi'
  | 'Pemeriksaan Kebuntingan'
  | 'Sertifikat Kesehatan'
  | 'Layanan Laboratorium';

export const VET_SERVICE_TYPES: VetServiceType[] = [
  'Konsultasi Kesehatan',
  'Kunjungan Kandang',
  'Vaksinasi',
  'Pengobatan Cacing',
  'Pemeriksaan Reproduksi',
  'Pemeriksaan Kebuntingan',
  'Sertifikat Kesehatan',
  'Layanan Laboratorium',
];

export const VET_SERVICE_CONFIG: Record<
  VetServiceType,
  { icon: string; color: string; bg: string }
> = {
  'Konsultasi Kesehatan':    { icon: '🩺', color: '#1e40af', bg: '#dbeafe' },
  'Kunjungan Kandang':       { icon: '🏡', color: '#166534', bg: '#dcfce7' },
  'Vaksinasi':               { icon: '💉', color: '#0e7490', bg: '#cffafe' },
  'Pengobatan Cacing':       { icon: '🐛', color: '#92400e', bg: '#fef3c7' },
  'Pemeriksaan Reproduksi':  { icon: '🔬', color: '#6d28d9', bg: '#ede9fe' },
  'Pemeriksaan Kebuntingan': { icon: '🤰', color: '#be185d', bg: '#fce7f3' },
  'Sertifikat Kesehatan':    { icon: '📋', color: '#166534', bg: '#dcfce7' },
  'Layanan Laboratorium':    { icon: '🧪', color: '#5b21b6', bg: '#ede9fe' },
};

// ─── Veterinarian Record ──────────────────────────────────────────────────────

export type VetStatus = 'Aktif' | 'Tidak Aktif' | 'Cuti';
export type VetSpecialty =
  | 'Kesehatan Hewan Ternak Besar'
  | 'Kesehatan Hewan Unggas'
  | 'Reproduksi & Kebidanan Hewan'
  | 'Kesehatan Hewan Umum'
  | 'Patologi & Laboratorium';

export interface VeterinarianRecord {
  id: string;
  workspaceId: string;
  nama: string;
  gelar: string;                 // e.g. "drh."
  foto: string;                  // emoji avatar
  /** SIPP = Surat Izin Praktik Profesi — license number placeholder */
  nomorSIPP: string;
  spesialisasi: VetSpecialty;
  /** Services this vet provides */
  layanan: VetServiceType[];
  status: VetStatus;
  pengalamanTahun: number;
  pendidikan: string;            // e.g. "FKH Universitas Gadjah Mada"
  nomorHP: string;
  catatanInternal: string;
}

export const VET_STATUS_CONFIG: Record<
  VetStatus,
  { icon: string; color: string; bg: string; border: string }
> = {
  Aktif:         { icon: '✅', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  'Tidak Aktif': { icon: '⛔', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
  Cuti:          { icon: '🏖️', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
};

// ─── Veterinary Service Catalog ───────────────────────────────────────────────

export interface VetServiceRecord {
  id: string;
  workspaceId: string;
  tipeLayanan: VetServiceType;
  namaLayanan: string;
  deskripsi: string;
  targetTernak: string[];
  hargaMulaiDari: number | null;   // IDR, null if quote-based
  estimasiDurasi: string;          // e.g. "30–60 menit"
  tersedia: boolean;
  catatan: string;
}

// ─── Service Area ─────────────────────────────────────────────────────────────

export interface VetServiceArea {
  id: string;
  workspaceId: string;
  namaWilayah: string;
  provinsi: string;
  kabupatenKota: string[];
  layananTersedia: VetServiceType[];
  jarakMaksKunjungan: string;    // e.g. "≤ 30 km dari klinik"
  biayaKunjungan: string;        // e.g. "Rp 100.000 – Rp 300.000 (tergantung jarak)"
  keterangan: string;
}

// ─── Activity Record ──────────────────────────────────────────────────────────

export type ActivityStatus =
  | 'Selesai'
  | 'Dalam Proses'
  | 'Terjadwal'
  | 'Dibatalkan';

export interface VetActivityRecord {
  id: string;                       // e.g. "VET-2026-001"
  workspaceId: string;
  vetId: string;
  /** Client workspace name */
  clientWorkspace: string;
  clientId: string;
  tipeLayanan: VetServiceType;
  /** Description of livestock involved */
  ternakDeskripsi: string;
  jumlahTernak: number;
  status: ActivityStatus;
  tanggal: string;                  // ISO yyyy-mm-dd
  tanggalSelesai: string | null;
  lokasiKunjungan: string;
  hasilRingkasan: string;           // brief result, no diagnosis
  biaya: number | null;             // IDR
}

export const ACTIVITY_STATUS_CONFIG: Record<
  ActivityStatus,
  { icon: string; color: string; bg: string; border: string }
> = {
  Selesai:       { icon: '🏁', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  'Dalam Proses':{ icon: '⚙️', color: '#1e40af', bg: '#dbeafe', border: '#93c5fd' },
  Terjadwal:     { icon: '📅', color: '#0e7490', bg: '#cffafe', border: '#67e8f9' },
  Dibatalkan:    { icon: '❌', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};

// ─── Access Control ───────────────────────────────────────────────────────────

export type VetViewerRole = 'public' | 'member' | 'admin' | 'owner' | 'platform_admin';

export interface VetAccessDecision {
  role: VetViewerRole;
  canViewOperational: boolean;   // vet details, phone, activity history, internal notes
  canViewFinancial: boolean;     // biaya per activity
  canEditStaff: boolean;         // always false in VET-001
}

type VetMemberEntry = { userId: string; workspaceId: string; role: 'Owner' | 'Admin' | 'Member' };

const VET_MEMBER_ROLES: VetMemberEntry[] = [
  { userId: 'usr-amelia-001', workspaceId: 'w5', role: 'Owner' },
  { userId: 'usr-amelia-001', workspaceId: 'w6', role: 'Admin' },
];

export function deriveVetAccess(
  workspaceId: string,
  viewerUserId: string | null
): VetAccessDecision {
  if (!viewerUserId) {
    return { role: 'public', canViewOperational: false, canViewFinancial: false, canEditStaff: false };
  }
  const entry = VET_MEMBER_ROLES.find(
    (m) => m.workspaceId === workspaceId && m.userId === viewerUserId
  );
  if (!entry) {
    return { role: 'public', canViewOperational: false, canViewFinancial: false, canEditStaff: false };
  }
  return {
    role: entry.role === 'Owner' ? 'owner' : entry.role === 'Admin' ? 'admin' : 'member',
    canViewOperational: true,
    canViewFinancial: entry.role === 'Owner' || entry.role === 'Admin',
    canEditStaff: false,  // reserved — VET-001
  };
}

/**
 * @deprecated P0-002B — viewer identity must come from AuthContext (useAuth).
 * Nullified; kept only for backward-compat during migration.
 */
export const CURRENT_VET_VIEWER_ID: string | null = null;

// ─── Workspace Meta ───────────────────────────────────────────────────────────

export interface VetWorkspaceMeta {
  workspaceId: string;
  nama: string;
  logo: string;
  banner: string;
  tipeWorkspace: 'DokterHewan' | 'KlinikHewan';
  deskripsi: string;
  lokasiUmum: string;
  kontakPublik: string;
  bergabungSejak: string;
  jamOperasional: string;
}

const VET_WORKSPACE_META: VetWorkspaceMeta[] = [
  {
    workspaceId: 'w5',
    nama: 'drh. Amelia Putri',
    logo: '👩‍⚕️',
    banner: '🩺',
    tipeWorkspace: 'DokterHewan',
    deskripsi:
      'Praktik dokter hewan berlisensi dengan spesialisasi hewan ternak besar (sapi, kerbau, kuda) dan layanan reproduksi. Melayani kunjungan kandang dan konsultasi online di seluruh wilayah Priangan, Jawa Barat. Berpengalaman lebih dari 8 tahun dalam pelayanan kesehatan ternak peternakan skala kecil dan menengah.',
    lokasiUmum: 'Garut, Jawa Barat',
    kontakPublik: '+62 851-1234-5678',
    bergabungSejak: '2025-01-15',
    jamOperasional: 'Senin–Sabtu 08.00–17.00 WIB',
  },
  {
    workspaceId: 'w6',
    nama: 'Klinik Hewan Sejahtera',
    logo: '🏥',
    banner: '🔬',
    tipeWorkspace: 'KlinikHewan',
    deskripsi:
      'Klinik hewan ternak terpadu di Garut, melayani pemeriksaan kesehatan, vaksinasi, pengobatan, dan penerbitan sertifikat kesehatan untuk keperluan jual-beli dan ekspor ternak lokal. Dilengkapi fasilitas laboratorium dasar dan ruang isolasi hewan sakit.',
    lokasiUmum: 'Garut, Jawa Barat',
    kontakPublik: '+62 812-9876-5432',
    bergabungSejak: '2025-03-20',
    jamOperasional: 'Senin–Minggu 07.00–20.00 WIB',
  },
];

// ─── Seed Data — Veterinarians ────────────────────────────────────────────────

let VETERINARIAN_DB: VeterinarianRecord[] = [
  {
    id: 'VET-001',
    workspaceId: 'w5',
    nama: 'Amelia Putri',
    gelar: 'drh.',
    foto: '👩‍⚕️',
    nomorSIPP: 'SIPP-0012/KHT/JB/2022',
    spesialisasi: 'Kesehatan Hewan Ternak Besar',
    layanan: [
      'Konsultasi Kesehatan',
      'Kunjungan Kandang',
      'Vaksinasi',
      'Pengobatan Cacing',
      'Pemeriksaan Reproduksi',
      'Pemeriksaan Kebuntingan',
      'Sertifikat Kesehatan',
    ],
    status: 'Aktif',
    pengalamanTahun: 8,
    pendidikan: 'FKH Universitas Gadjah Mada (2016)',
    nomorHP: '+62 851-1234-5678',
    catatanInternal: 'Spesialis sapi perah dan domba garut. Aktif sebagai konsultan di 3 koperasi peternak.',
  },
  {
    id: 'VET-002',
    workspaceId: 'w5',
    nama: 'Reza Firmansyah',
    gelar: 'drh.',
    foto: '👨‍⚕️',
    nomorSIPP: 'SIPP-0089/KHR/JB/2023',
    spesialisasi: 'Reproduksi & Kebidanan Hewan',
    layanan: [
      'Pemeriksaan Reproduksi',
      'Pemeriksaan Kebuntingan',
      'Konsultasi Kesehatan',
      'Kunjungan Kandang',
    ],
    status: 'Aktif',
    pengalamanTahun: 4,
    pendidikan: 'FKH Institut Pertanian Bogor (2020)',
    nomorHP: '+62 813-2222-3333',
    catatanInternal: 'Asisten praktik. Menangani program IB (inseminasi buatan) dan deteksi birahi ternak.',
  },
  {
    id: 'VET-003',
    workspaceId: 'w6',
    nama: 'Hendra Gunawan',
    gelar: 'drh.',
    foto: '👨‍🔬',
    nomorSIPP: 'SIPP-0155/KHU/JB/2021',
    spesialisasi: 'Kesehatan Hewan Umum',
    layanan: [
      'Konsultasi Kesehatan',
      'Vaksinasi',
      'Pengobatan Cacing',
      'Sertifikat Kesehatan',
      'Layanan Laboratorium',
    ],
    status: 'Aktif',
    pengalamanTahun: 6,
    pendidikan: 'FKH Universitas Airlangga (2018)',
    nomorHP: '+62 819-4444-5555',
    catatanInternal: 'Kepala klinik. Mengelola operasional harian dan koordinasi dengan Dinas Peternakan.',
  },
  {
    id: 'VET-004',
    workspaceId: 'w6',
    nama: 'Siti Nurhaliza',
    gelar: 'drh.',
    foto: '👩‍🔬',
    nomorSIPP: 'SIPP-0201/PL/JB/2024',
    spesialisasi: 'Patologi & Laboratorium',
    layanan: [
      'Layanan Laboratorium',
      'Sertifikat Kesehatan',
      'Konsultasi Kesehatan',
    ],
    status: 'Aktif',
    pengalamanTahun: 2,
    pendidikan: 'FKH Universitas Padjadjaran (2022)',
    nomorHP: '+62 822-6666-7777',
    catatanInternal: 'Mengelola laboratorium dasar: hematologi, parasitologi, urinalisis ternak.',
  },
  {
    id: 'VET-005',
    workspaceId: 'w6',
    nama: 'Bambang Setiawan',
    gelar: 'drh.',
    foto: '👨‍🏫',
    nomorSIPP: 'SIPP-0099/KHU/JB/2020',
    spesialisasi: 'Kesehatan Hewan Ternak Besar',
    layanan: [
      'Kunjungan Kandang',
      'Vaksinasi',
      'Pengobatan Cacing',
      'Pemeriksaan Kebuntingan',
    ],
    status: 'Cuti',
    pengalamanTahun: 7,
    pendidikan: 'FKH Universitas Gadjah Mada (2017)',
    nomorHP: '+62 815-8888-9999',
    catatanInternal: 'Cuti sakit. Kembali bertugas estimasi 1 Agustus 2026. Pasien dialihkan ke drh. Hendra.',
  },
];

// ─── Seed Data — Service Catalog ─────────────────────────────────────────────

const SERVICE_CATALOG_DB: VetServiceRecord[] = [
  {
    id: 'SVC-001',
    workspaceId: 'w5',
    tipeLayanan: 'Konsultasi Kesehatan',
    namaLayanan: 'Konsultasi Kesehatan Ternak',
    deskripsi: 'Konsultasi kondisi kesehatan ternak secara langsung di kandang atau via telepon/pesan. Evaluasi gejala umum dan rekomendasi tindakan lanjut.',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    hargaMulaiDari: 100_000,
    estimasiDurasi: '30–60 menit',
    tersedia: true,
    catatan: 'Tersedia hari kerja dan Sabtu. Konsultasi telepon tanpa biaya kunjungan.',
  },
  {
    id: 'SVC-002',
    workspaceId: 'w5',
    tipeLayanan: 'Kunjungan Kandang',
    namaLayanan: 'Kunjungan Kandang (Farm Visit)',
    deskripsi: 'Kunjungan dokter hewan langsung ke kandang untuk pemeriksaan fisik menyeluruh, evaluasi kondisi kandang, dan tata laksana kesehatan kawanan.',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau', 'Kuda'],
    hargaMulaiDari: 200_000,
    estimasiDurasi: '1–3 jam',
    tersedia: true,
    catatan: 'Biaya kunjungan belum termasuk obat/vaksin. Coverage Garut dan sekitarnya.',
  },
  {
    id: 'SVC-003',
    workspaceId: 'w5',
    tipeLayanan: 'Vaksinasi',
    namaLayanan: 'Program Vaksinasi Ternak',
    deskripsi: 'Vaksinasi ternak terhadap penyakit prioritas: Anthrax, Brucellosis, PMK, Jembrana, dan Newcastle Disease. Sesuai kalender vaksinasi nasional.',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    hargaMulaiDari: 50_000,
    estimasiDurasi: '15–30 menit per ekor',
    tersedia: true,
    catatan: 'Harga per ekor, belum termasuk vaksin. Diskon untuk >10 ekor.',
  },
  {
    id: 'SVC-004',
    workspaceId: 'w5',
    tipeLayanan: 'Pengobatan Cacing',
    namaLayanan: 'Pengobatan & Pencegahan Parasit',
    deskripsi: 'Program antelmintik (pengobatan cacing) untuk ternak ruminansia. Pemilihan obat disesuaikan dengan jenis cacing yang teridentifikasi.',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    hargaMulaiDari: 35_000,
    estimasiDurasi: '10–20 menit per ekor',
    tersedia: true,
    catatan: 'Direkomendasikan tiap 3 bulan. Harga per ekor, belum termasuk obat.',
  },
  {
    id: 'SVC-005',
    workspaceId: 'w5',
    tipeLayanan: 'Pemeriksaan Reproduksi',
    namaLayanan: 'Pemeriksaan Sistem Reproduksi',
    deskripsi: 'Evaluasi kondisi reproduksi ternak betina dan jantan. Meliputi deteksi kelainan reproduksi, evaluasi kualitas semen, dan konsultasi program perkawinan.',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    hargaMulaiDari: 150_000,
    estimasiDurasi: '30–60 menit per ekor',
    tersedia: true,
    catatan: 'Dilakukan oleh drh. Reza Firmansyah (spesialis reproduksi).',
  },
  {
    id: 'SVC-006',
    workspaceId: 'w5',
    tipeLayanan: 'Pemeriksaan Kebuntingan',
    namaLayanan: 'Deteksi dan Pemantauan Kebuntingan',
    deskripsi: 'Deteksi kebuntingan dini dan pemantauan perkembangan janin. Menggunakan metode palpasi rektal dan evaluasi klinis.',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    hargaMulaiDari: 100_000,
    estimasiDurasi: '20–40 menit per ekor',
    tersedia: true,
    catatan: 'Deteksi dini kebuntingan dapat dilakukan mulai 45 hari setelah perkawinan.',
  },
  {
    id: 'SVC-007',
    workspaceId: 'w5',
    tipeLayanan: 'Sertifikat Kesehatan',
    namaLayanan: 'Penerbitan Sertifikat Kesehatan Hewan',
    deskripsi: 'Penerbitan sertifikat kesehatan untuk keperluan jual-beli antar daerah, pengiriman, dan kurban. Sesuai prosedur Dinas Peternakan setempat.',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau', 'Kuda'],
    hargaMulaiDari: 75_000,
    estimasiDurasi: '30–60 menit',
    tersedia: true,
    catatan: 'Pemeriksaan klinis wajib sebelum penerbitan sertifikat. Berlaku 14 hari sejak tanggal penerbitan.',
  },
  // Klinik Hewan Sejahtera services
  {
    id: 'SVC-101',
    workspaceId: 'w6',
    tipeLayanan: 'Konsultasi Kesehatan',
    namaLayanan: 'Pemeriksaan & Konsultasi Klinis',
    deskripsi: 'Pemeriksaan kesehatan ternak di klinik atau kunjungan kandang. Tersedia dokter hewan berpengalaman setiap hari termasuk hari Minggu.',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau', 'Ayam', 'Itik'],
    hargaMulaiDari: 80_000,
    estimasiDurasi: '30–60 menit',
    tersedia: true,
    catatan: 'Buka 7 hari seminggu. Darurat 24 jam via telepon.',
  },
  {
    id: 'SVC-102',
    workspaceId: 'w6',
    tipeLayanan: 'Vaksinasi',
    namaLayanan: 'Vaksinasi Massal & Individual',
    deskripsi: 'Program vaksinasi terstruktur untuk berbagai jenis ternak. Tersedia paket vaksinasi kawanan untuk peternak skala menengah.',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau', 'Ayam', 'Itik'],
    hargaMulaiDari: 45_000,
    estimasiDurasi: '15–30 menit per ekor',
    tersedia: true,
    catatan: 'Tersedia paket kawanan ≥20 ekor dengan harga khusus.',
  },
  {
    id: 'SVC-103',
    workspaceId: 'w6',
    tipeLayanan: 'Layanan Laboratorium',
    namaLayanan: 'Pemeriksaan Laboratorium Dasar',
    deskripsi: 'Analisis hematologi (darah lengkap), parasitologi (feses), dan urinalisis untuk ternak. Hasil tersedia dalam 1–3 hari kerja.',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau', 'Ayam'],
    hargaMulaiDari: 150_000,
    estimasiDurasi: '1–3 hari kerja',
    tersedia: true,
    catatan: 'Sampel diantar langsung ke klinik atau dijemput (area Garut).',
  },
  {
    id: 'SVC-104',
    workspaceId: 'w6',
    tipeLayanan: 'Sertifikat Kesehatan',
    namaLayanan: 'Sertifikasi Kesehatan & Lalu Lintas Ternak',
    deskripsi: 'Penerbitan SKKH (Surat Keterangan Kesehatan Hewan) untuk keperluan jual-beli, pengiriman antar daerah, dan qurban. Koordinasi dengan Dinas Peternakan Garut.',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    hargaMulaiDari: 60_000,
    estimasiDurasi: '30–60 menit + 1 hari kerja untuk pengesahan',
    tersedia: true,
    catatan: 'Berlaku 14 hari. Ekspedisi dan qurban tersedia paket khusus.',
  },
  {
    id: 'SVC-105',
    workspaceId: 'w6',
    tipeLayanan: 'Kunjungan Kandang',
    namaLayanan: 'Kunjungan Kandang Terjadwal',
    deskripsi: 'Kunjungan rutin dokter hewan ke kandang pelanggan. Tersedia paket bulanan untuk peternak dengan populasi ≥20 ekor.',
    targetTernak: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
    hargaMulaiDari: 300_000,
    estimasiDurasi: '2–4 jam per kunjungan',
    tersedia: true,
    catatan: 'Paket kunjungan bulanan lebih hemat 20% dari tarif per kunjungan.',
  },
];

// ─── Seed Data — Service Areas ────────────────────────────────────────────────

const VET_SERVICE_AREA_DB: VetServiceArea[] = [
  {
    id: 'VSA-001',
    workspaceId: 'w5',
    namaWilayah: 'Garut Kota & Sekitarnya',
    provinsi: 'Jawa Barat',
    kabupatenKota: ['Garut Kota', 'Tarogong', 'Leles', 'Samarang', 'Bayongbong', 'Cilawu'],
    layananTersedia: ['Konsultasi Kesehatan', 'Kunjungan Kandang', 'Vaksinasi', 'Pengobatan Cacing', 'Pemeriksaan Reproduksi', 'Pemeriksaan Kebuntingan', 'Sertifikat Kesehatan'],
    jarakMaksKunjungan: '≤ 20 km dari praktik',
    biayaKunjungan: 'Gratis kunjungan kandang (termasuk tarif layanan)',
    keterangan: 'Area utama. Semua layanan tersedia. Kunjungan darurat dapat dilayani dalam 2–4 jam.',
  },
  {
    id: 'VSA-002',
    workspaceId: 'w5',
    namaWilayah: 'Garut Selatan',
    provinsi: 'Jawa Barat',
    kabupatenKota: ['Cikajang', 'Banjarwangi', 'Pameungpeuk', 'Pamulihan'],
    layananTersedia: ['Konsultasi Kesehatan', 'Kunjungan Kandang', 'Vaksinasi', 'Pemeriksaan Kebuntingan'],
    jarakMaksKunjungan: '21–50 km dari praktik',
    biayaKunjungan: 'Rp 100.000 – Rp 200.000 (biaya tambahan kunjungan)',
    keterangan: 'Kunjungan dijadwalkan 2x seminggu. Booking H-2 minimal.',
  },
  {
    id: 'VSA-003',
    workspaceId: 'w5',
    namaWilayah: 'Tasikmalaya',
    provinsi: 'Jawa Barat',
    kabupatenKota: ['Tasikmalaya Kota', 'Singaparna', 'Ciawi'],
    layananTersedia: ['Konsultasi Kesehatan', 'Vaksinasi', 'Pemeriksaan Kebuntingan'],
    jarakMaksKunjungan: '> 50 km — khusus request',
    biayaKunjungan: 'Rp 200.000 – Rp 350.000 (tergantung jarak)',
    keterangan: 'Kunjungan khusus request. Min. 5 ekor ternak per kunjungan.',
  },
  {
    id: 'VSA-101',
    workspaceId: 'w6',
    namaWilayah: 'Garut & Sekitarnya',
    provinsi: 'Jawa Barat',
    kabupatenKota: ['Garut Kota', 'Tarogong', 'Leles', 'Samarang', 'Bayongbong', 'Cikajang', 'Bungbulang'],
    layananTersedia: ['Konsultasi Kesehatan', 'Kunjungan Kandang', 'Vaksinasi', 'Pengobatan Cacing', 'Sertifikat Kesehatan', 'Layanan Laboratorium'],
    jarakMaksKunjungan: '≤ 30 km dari klinik',
    biayaKunjungan: 'Rp 100.000 – Rp 300.000 (tergantung jarak)',
    keterangan: 'Area utama klinik. Laboratorium hanya tersedia di klinik (tidak mobile). Antar sampel jemput untuk area ≤15 km.',
  },
  {
    id: 'VSA-102',
    workspaceId: 'w6',
    namaWilayah: 'Bandung Raya',
    provinsi: 'Jawa Barat',
    kabupatenKota: ['Bandung Kota', 'Cimahi', 'Bandung Barat'],
    layananTersedia: ['Sertifikat Kesehatan', 'Konsultasi Kesehatan'],
    jarakMaksKunjungan: 'Khusus sertifikasi dan konsultasi via telepon',
    biayaKunjungan: 'Konsultasi telepon tanpa biaya kunjungan',
    keterangan: 'Pengurusan sertifikat kesehatan dapat dilakukan secara remote dengan kirim dokumen. Kunjungan tidak tersedia.',
  },
];

// ─── Seed Data — Activity History ─────────────────────────────────────────────

let ACTIVITY_DB: VetActivityRecord[] = [
  {
    id: 'VET-ACT-001',
    workspaceId: 'w5',
    vetId: 'VET-001',
    clientWorkspace: 'Berkah Farm Garut',
    clientId: 'usr-berkah-001',
    tipeLayanan: 'Kunjungan Kandang',
    ternakDeskripsi: 'Kawanan domba garut (25 ekor)',
    jumlahTernak: 25,
    status: 'Selesai',
    tanggal: '2026-07-15',
    tanggalSelesai: '2026-07-15',
    lokasiKunjungan: 'Samarang, Garut',
    hasilRingkasan: 'Pemeriksaan fisik menyeluruh. Kondisi umum kawanan baik. Ditemukan 3 ekor dengan gejala ringan parasit eksternal — ditangani on-site.',
    biaya: 350_000,
  },
  {
    id: 'VET-ACT-002',
    workspaceId: 'w5',
    vetId: 'VET-001',
    clientWorkspace: 'Berkah Farm Garut',
    clientId: 'usr-berkah-001',
    tipeLayanan: 'Pemeriksaan Kebuntingan',
    ternakDeskripsi: 'Domba betina (8 ekor)',
    jumlahTernak: 8,
    status: 'Selesai',
    tanggal: '2026-07-10',
    tanggalSelesai: '2026-07-10',
    lokasiKunjungan: 'Samarang, Garut',
    hasilRingkasan: '6 dari 8 ekor positif bunting. Estimasi partus dalam 2–4 minggu. 2 ekor perlu observasi lebih lanjut.',
    biaya: 800_000,
  },
  {
    id: 'VET-ACT-003',
    workspaceId: 'w5',
    vetId: 'VET-002',
    clientWorkspace: 'Peternakan H. Rahmat',
    clientId: 'cust-002',
    tipeLayanan: 'Pemeriksaan Reproduksi',
    ternakDeskripsi: 'Sapi FH betina (4 ekor)',
    jumlahTernak: 4,
    status: 'Selesai',
    tanggal: '2026-07-08',
    tanggalSelesai: '2026-07-08',
    lokasiKunjungan: 'Leles, Garut',
    hasilRingkasan: 'Evaluasi siklus estrus dan kondisi organ reproduksi. 2 ekor siap program IB. 1 ekor perlu interval istirahat reproduksi 60 hari.',
    biaya: 600_000,
  },
  {
    id: 'VET-ACT-004',
    workspaceId: 'w5',
    vetId: 'VET-001',
    clientWorkspace: 'Berkah Farm Tasik',
    clientId: 'usr-berkah-001',
    tipeLayanan: 'Vaksinasi',
    ternakDeskripsi: 'Kambing PE dan domba (15 ekor)',
    jumlahTernak: 15,
    status: 'Selesai',
    tanggal: '2026-07-05',
    tanggalSelesai: '2026-07-05',
    lokasiKunjungan: 'Tasikmalaya, Jawa Barat',
    hasilRingkasan: 'Vaksinasi Anthrax + PMK dosis pertama. Seluruh ternak sehat saat divaksinasi. Vaksinasi booster dijadwalkan 30 hari ke depan.',
    biaya: 1_125_000,
  },
  {
    id: 'VET-ACT-005',
    workspaceId: 'w5',
    vetId: 'VET-001',
    clientWorkspace: 'Hendi Agro Sukabumi',
    clientId: 'cust-004',
    tipeLayanan: 'Sertifikat Kesehatan',
    ternakDeskripsi: 'Sapi potong (4 ekor)',
    jumlahTernak: 4,
    status: 'Selesai',
    tanggal: '2026-07-12',
    tanggalSelesai: '2026-07-13',
    lokasiKunjungan: 'Garut (di klinik/praktik)',
    hasilRingkasan: 'SKKH diterbitkan untuk 4 ekor sapi potong. Semua hewan sehat dan bebas dari tanda klinis penyakit menular.',
    biaya: 300_000,
  },
  {
    id: 'VET-ACT-006',
    workspaceId: 'w5',
    vetId: 'VET-002',
    clientWorkspace: 'Berkah Farm Garut',
    clientId: 'usr-berkah-001',
    tipeLayanan: 'Pengobatan Cacing',
    ternakDeskripsi: 'Domba garut (12 ekor)',
    jumlahTernak: 12,
    status: 'Selesai',
    tanggal: '2026-06-28',
    tanggalSelesai: '2026-06-28',
    lokasiKunjungan: 'Samarang, Garut',
    hasilRingkasan: 'Program antelmintik kuartalan. Seluruh ternak mendapat dosis sesuai berat badan. Tidak ada reaksi merugikan pasca pemberian.',
    biaya: 540_000,
  },
  {
    id: 'VET-ACT-007',
    workspaceId: 'w5',
    vetId: 'VET-001',
    clientWorkspace: 'KPG Garut',
    clientId: 'cust-007',
    tipeLayanan: 'Konsultasi Kesehatan',
    ternakDeskripsi: 'Sapi perah (2 ekor bergejala)',
    jumlahTernak: 2,
    status: 'Selesai',
    tanggal: '2026-07-17',
    tanggalSelesai: '2026-07-17',
    lokasiKunjungan: 'Bayongbong, Garut',
    hasilRingkasan: 'Konsultasi kondisi 2 ekor sapi dengan penurunan produksi susu. Rekomendasi evaluasi pakan dan perbaikan manajemen kandang.',
    biaya: 200_000,
  },
  {
    id: 'VET-ACT-008',
    workspaceId: 'w5',
    vetId: 'VET-001',
    clientWorkspace: 'Berkah Farm Garut',
    clientId: 'usr-berkah-001',
    tipeLayanan: 'Kunjungan Kandang',
    ternakDeskripsi: 'Seluruh kawanan (75 ekor)',
    jumlahTernak: 75,
    status: 'Terjadwal',
    tanggal: '2026-07-22',
    tanggalSelesai: null,
    lokasiKunjungan: 'Samarang, Garut',
    hasilRingkasan: 'Kunjungan rutin bulanan. Termasuk evaluasi kondisi kandang pasca renovasi.',
    biaya: null,
  },
  {
    id: 'VET-ACT-009',
    workspaceId: 'w6',
    vetId: 'VET-003',
    clientWorkspace: 'Peternakan Cikajang Makmur',
    clientId: 'cust-006',
    tipeLayanan: 'Layanan Laboratorium',
    ternakDeskripsi: 'Sampel feses domba (10 sampel)',
    jumlahTernak: 10,
    status: 'Selesai',
    tanggal: '2026-07-16',
    tanggalSelesai: '2026-07-17',
    lokasiKunjungan: 'Klinik Hewan Sejahtera, Garut',
    hasilRingkasan: 'Pemeriksaan parasitologi feses. 6 sampel positif telur cacing nematoda (EPG sedang). Rekomendasi program antelmintik segera.',
    biaya: 1_500_000,
  },
  {
    id: 'VET-ACT-010',
    workspaceId: 'w6',
    vetId: 'VET-004',
    clientWorkspace: 'Soni Farm Bandung',
    clientId: 'cust-009',
    tipeLayanan: 'Sertifikat Kesehatan',
    ternakDeskripsi: 'Domba garut pilihan (4 ekor)',
    jumlahTernak: 4,
    status: 'Selesai',
    tanggal: '2026-07-18',
    tanggalSelesai: '2026-07-18',
    lokasiKunjungan: 'Klinik Hewan Sejahtera, Garut',
    hasilRingkasan: 'SKKH diterbitkan untuk 4 ekor domba garut pilihan untuk pengiriman ke Bandung Barat. Semua hewan dalam kondisi sehat.',
    biaya: 240_000,
  },
  {
    id: 'VET-ACT-011',
    workspaceId: 'w6',
    vetId: 'VET-003',
    clientWorkspace: 'Ternak Bu Tini',
    clientId: 'cust-008',
    tipeLayanan: 'Vaksinasi',
    ternakDeskripsi: 'Sapi potong (5 ekor)',
    jumlahTernak: 5,
    status: 'Dibatalkan',
    tanggal: '2026-07-14',
    tanggalSelesai: null,
    lokasiKunjungan: 'Leles, Garut',
    hasilRingkasan: 'Dibatalkan oleh pelanggan H-1. Jadwal ulang belum dikonfirmasi.',
    biaya: null,
  },
  {
    id: 'VET-ACT-012',
    workspaceId: 'w6',
    vetId: 'VET-005',
    clientWorkspace: 'Berkah Farm Garut',
    clientId: 'usr-berkah-001',
    tipeLayanan: 'Kunjungan Kandang',
    ternakDeskripsi: 'Sapi FH perah (10 ekor)',
    jumlahTernak: 10,
    status: 'Terjadwal',
    tanggal: '2026-07-25',
    tanggalSelesai: null,
    lokasiKunjungan: 'Samarang, Garut',
    hasilRingkasan: 'Kunjungan rutin — belum berlangsung.',
    biaya: null,
  },
];

// ─── Queries ──────────────────────────────────────────────────────────────────

export function getVetWorkspaceMeta(workspaceId: string): VetWorkspaceMeta | undefined {
  return VET_WORKSPACE_META.find((m) => m.workspaceId === workspaceId);
}

export function getVeterinariansByWorkspace(workspaceId: string): VeterinarianRecord[] {
  return VETERINARIAN_DB.filter((v) => v.workspaceId === workspaceId);
}

export function getServiceCatalogByWorkspace(workspaceId: string): VetServiceRecord[] {
  return SERVICE_CATALOG_DB.filter((s) => s.workspaceId === workspaceId);
}

export function getVetServiceAreasByWorkspace(workspaceId: string): VetServiceArea[] {
  return VET_SERVICE_AREA_DB.filter((a) => a.workspaceId === workspaceId);
}

export function getActivitiesByWorkspace(workspaceId: string): VetActivityRecord[] {
  return ACTIVITY_DB.filter((a) => a.workspaceId === workspaceId);
}

// ─── Summary Statistics ───────────────────────────────────────────────────────

export interface VetWorkspaceSummary {
  totalDokterHewan: number;
  dokterAktif: number;
  totalKlinik: number;           // clinics sub-facilities (1 per workspace for now)
  pasienAktif: number;           // activities with status Dalam Proses | Terjadwal
  kunjunganKandang: number;      // completed farm visits
  sertifikatDiterbitkan: number; // completed health certificates
}

export function getVetWorkspaceSummary(workspaceId: string): VetWorkspaceSummary {
  const vets       = getVeterinariansByWorkspace(workspaceId);
  const activities = getActivitiesByWorkspace(workspaceId);

  return {
    totalDokterHewan:      vets.length,
    dokterAktif:           vets.filter((v) => v.status === 'Aktif').length,
    totalKlinik:           1,
    pasienAktif:           activities.filter(
      (a) => a.status === 'Dalam Proses' || a.status === 'Terjadwal'
    ).length,
    kunjunganKandang:      activities.filter(
      (a) => a.tipeLayanan === 'Kunjungan Kandang' && a.status === 'Selesai'
    ).length,
    sertifikatDiterbitkan: activities.filter(
      (a) => a.tipeLayanan === 'Sertifikat Kesehatan' && a.status === 'Selesai'
    ).length,
  };
}

// ─── Format Helpers ───────────────────────────────────────────────────────────

export function formatRupiahVet(amount: number | null): string {
  if (amount === null) return '—';
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(2).replace('.', ',')} Jt`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function formatTanggalVet(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export { generateUUID };
