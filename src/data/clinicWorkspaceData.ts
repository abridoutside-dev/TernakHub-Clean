// ─── Clinic Workspace Data (CLN-001) ──────────────────────────────────────────
// Source of truth untuk halaman Klinik Hewan Workspace (KlinikHewanWorkspace).
// Memodelkan fasilitas klinik fisik multi-dokter, jadwal piket, riwayat
// kunjungan, dan kontrol akses berbasis peran.
// NO diagnosis · NO prescriptions · NO medical records · NO telemedicine.

// ─── Access Control ───────────────────────────────────────────────────────────

export type ClinicViewerRole =
  | 'public'
  | 'member'
  | 'admin'
  | 'owner'
  | 'platform_admin';

export interface ClinicAccessDecision {
  role: ClinicViewerRole;
  /** Tampilkan data operasional (kontak HP staf, riwayat kunjungan). */
  canViewOperational: boolean;
  /** Tampilkan data finansial (biaya kunjungan). */
  canViewFinancial: boolean;
}

type ClinicMemberEntry = {
  userId: string;
  workspaceId: string;
  role: 'Owner' | 'Admin' | 'Member';
};

const CLINIC_MEMBER_ROLES: ClinicMemberEntry[] = [
  { userId: 'user-owner-01',  workspaceId: 'w6', role: 'Owner' },
  { userId: 'user-admin-01',  workspaceId: 'w6', role: 'Admin' },
  { userId: 'user-member-01', workspaceId: 'w6', role: 'Member' },
];

export function deriveClinicAccess(
  workspaceId: string,
  viewerId: string | null,
): ClinicAccessDecision {
  if (viewerId === 'platform-admin') {
    return { role: 'platform_admin', canViewOperational: true, canViewFinancial: true };
  }
  const entry = CLINIC_MEMBER_ROLES.find(
    (m) => m.workspaceId === workspaceId && m.userId === viewerId,
  );
  if (!entry) {
    return { role: 'public', canViewOperational: false, canViewFinancial: false };
  }
  if (entry.role === 'Owner') {
    return { role: 'owner', canViewOperational: true, canViewFinancial: true };
  }
  if (entry.role === 'Admin') {
    return { role: 'admin', canViewOperational: true, canViewFinancial: true };
  }
  return { role: 'member', canViewOperational: true, canViewFinancial: false };
}

// ─── Workspace Meta ───────────────────────────────────────────────────────────

export interface ClinicWorkspaceMeta {
  id: string;
  nama: string;
  logo: string;
  banner: string;
  lokasiUmum: string;
  alamatLengkap: string;
  kontakPublik: string;
  kontakDarurat: string;
  jamOperasional: string;
  nomorIzin: string;
  bergabungSejak: string; // ISO date
  deskripsi: string;
  fasilitas: string[];
}

const CLINIC_META: ClinicWorkspaceMeta[] = [
  {
    id: 'w6',
    nama: 'Klinik Hewan Sejahtera',
    logo: '🏥',
    banner: '🐄',
    lokasiUmum: 'Tasikmalaya, Jawa Barat',
    alamatLengkap: 'Jl. Peternakan Raya No. 45, Tasikmalaya, Jawa Barat 46115',
    kontakPublik: '(0265) 321-567',
    kontakDarurat: '0812-9900-1234',
    jamOperasional: 'Senin–Sabtu 08.00–17.00 | Darurat 24 Jam',
    nomorIzin: 'IKH-4567-TLY-2024',
    bergabungSejak: '2021-03-15',
    deskripsi:
      'Klinik Hewan Sejahtera adalah fasilitas kesehatan ternak terintegrasi yang melayani sapi, kambing, domba, dan kerbau di wilayah Tasikmalaya dan sekitarnya. Dilengkapi ruang rawat inap, laboratorium diagnostik, dan unit darurat 24 jam.',
    fasilitas: [
      'Ruang Periksa Ternak Besar',
      'Ruang Periksa Ternak Kecil',
      'Laboratorium Diagnostik',
      'Ruang Operasi',
      'ICU & Rawat Inap',
      'Apotek Hewan',
      'Unit Darurat 24 Jam',
    ],
  },
];

export function getClinicWorkspaceMeta(workspaceId: string): ClinicWorkspaceMeta | undefined {
  return CLINIC_META.find((m) => m.id === workspaceId);
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export type StaffStatus = 'Aktif' | 'Cuti' | 'Tidak Aktif';
export type StaffRole = 'Dokter Hewan' | 'Dokter Hewan Spesialis' | 'Teknisi Laboratorium' | 'Perawat Hewan' | 'Resepsionis';

export const STAFF_STATUS_CONFIG: Record<
  StaffStatus,
  { icon: string; color: string; bg: string; border: string }
> = {
  Aktif:       { icon: '✅', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  Cuti:        { icon: '🌙', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  'Tidak Aktif': { icon: '⛔', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};

export const STAFF_ROLE_CONFIG: Record<
  StaffRole,
  { icon: string; color: string; bg: string }
> = {
  'Dokter Hewan':           { icon: '🩺', color: '#1e40af', bg: '#dbeafe' },
  'Dokter Hewan Spesialis': { icon: '⚕️', color: '#6d28d9', bg: '#ede9fe' },
  'Teknisi Laboratorium':   { icon: '🔬', color: '#065f46', bg: '#d1fae5' },
  'Perawat Hewan':          { icon: '💊', color: '#9a3412', bg: '#ffedd5' },
  'Resepsionis':            { icon: '🗂️', color: '#374151', bg: '#f3f4f6' },
};

export interface ClinicStaffRecord {
  id: string;
  workspaceId: string;
  nama: string;
  gelar: string;
  peran: StaffRole;
  spesialisasi: string;
  foto: string;
  nomorSIPP?: string;
  pendidikan: string;
  pengalamanTahun: number;
  status: StaffStatus;
  jadwalPiket: string;
  /** Operational — hanya tampil untuk anggota workspace. */
  nomorHP?: string;
  catatanInternal?: string;
}

const CLINIC_STAFF: ClinicStaffRecord[] = [
  {
    id: 'stf-001',
    workspaceId: 'w6',
    nama: 'Budi Santoso',
    gelar: 'drh.',
    peran: 'Dokter Hewan Spesialis',
    spesialisasi: 'Spesialis Ternak Besar & Reproduksi',
    foto: '👨‍⚕️',
    nomorSIPP: 'SIPP-0234-JB-2022',
    pendidikan: 'FKH Universitas Gadjah Mada',
    pengalamanTahun: 12,
    status: 'Aktif',
    jadwalPiket: 'Senin – Rabu, 08.00–15.00',
    nomorHP: '0812-3344-5566',
    catatanInternal: 'Penanggung jawab klinik utama.',
  },
  {
    id: 'stf-002',
    workspaceId: 'w6',
    nama: 'Sari Kurniawati',
    gelar: 'drh.',
    peran: 'Dokter Hewan',
    spesialisasi: 'Reproduksi & Kebidanan Ternak',
    foto: '👩‍⚕️',
    nomorSIPP: 'SIPP-0891-JB-2023',
    pendidikan: 'FKH Universitas Airlangga',
    pengalamanTahun: 7,
    status: 'Aktif',
    jadwalPiket: 'Kamis – Sabtu, 08.00–15.00',
    nomorHP: '0821-5566-7788',
  },
  {
    id: 'stf-003',
    workspaceId: 'w6',
    nama: 'Ahmad Fauzi',
    gelar: '',
    peran: 'Teknisi Laboratorium',
    spesialisasi: 'Hematologi & Parasitologi',
    foto: '🧑‍🔬',
    pendidikan: 'D3 Analis Kesehatan Hewan, Politeknik Bandung',
    pengalamanTahun: 5,
    status: 'Aktif',
    jadwalPiket: 'Senin – Jumat, 08.00–14.00',
    nomorHP: '0856-7788-9900',
    catatanInternal: 'Bertanggung jawab atas laporan laboratorium harian.',
  },
  {
    id: 'stf-004',
    workspaceId: 'w6',
    nama: 'Dewi Rahayu',
    gelar: '',
    peran: 'Perawat Hewan',
    spesialisasi: 'Perawatan Rawat Inap & Pasca Operasi',
    foto: '👩‍⚕️',
    pendidikan: 'D3 Keperawatan Hewan, Politeknik Pertanian Bogor',
    pengalamanTahun: 4,
    status: 'Aktif',
    jadwalPiket: 'Senin – Sabtu, 08.00–17.00',
    nomorHP: '0878-1122-3344',
  },
  {
    id: 'stf-005',
    workspaceId: 'w6',
    nama: 'Rendi Prasetyo',
    gelar: 'drh.',
    peran: 'Dokter Hewan',
    spesialisasi: 'Penyakit Infeksius & Vaksinasi',
    foto: '👨‍⚕️',
    nomorSIPP: 'SIPP-1102-JB-2024',
    pendidikan: 'FKH Universitas Brawijaya',
    pengalamanTahun: 3,
    status: 'Cuti',
    jadwalPiket: 'Cuti — kembali 1 September 2026',
    nomorHP: '0813-9988-7766',
  },
];

export function getClinicStaffByWorkspace(workspaceId: string): ClinicStaffRecord[] {
  return CLINIC_STAFF.filter((s) => s.workspaceId === workspaceId);
}

// ─── Visit / Patient Records ──────────────────────────────────────────────────

export type ClinicVisitStatus = 'Selesai' | 'Terjadwal' | 'Dalam Proses' | 'Dibatalkan';
export type ClinicKategori =
  | 'Rawat Jalan'
  | 'Rawat Inap'
  | 'Layanan Darurat'
  | 'Laboratorium'
  | 'Bedah';

export const VISIT_STATUS_CONFIG: Record<
  ClinicVisitStatus,
  { icon: string; color: string; bg: string; border: string }
> = {
  Selesai:       { icon: '✅', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  Terjadwal:     { icon: '📅', color: '#1e40af', bg: '#dbeafe', border: '#93c5fd' },
  'Dalam Proses': { icon: '⏳', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  Dibatalkan:    { icon: '❌', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};

export const KATEGORI_CONFIG: Record<
  ClinicKategori,
  { icon: string; color: string; bg: string }
> = {
  'Rawat Jalan':     { icon: '🏥', color: '#1e40af', bg: '#dbeafe' },
  'Rawat Inap':      { icon: '🛏️', color: '#6d28d9', bg: '#ede9fe' },
  'Layanan Darurat': { icon: '🚨', color: '#991b1b', bg: '#fee2e2' },
  'Laboratorium':    { icon: '🔬', color: '#065f46', bg: '#d1fae5' },
  'Bedah':           { icon: '🩺', color: '#9a3412', bg: '#ffedd5' },
};

export interface ClinicVisitRecord {
  id: string;
  workspaceId: string;
  clientWorkspace: string;
  kategori: ClinicKategori;
  ternakDeskripsi: string;
  dokterPenanggung: string;
  tanggal: string; // ISO date
  status: ClinicVisitStatus;
  /** Financial — hanya tampil untuk owner/admin. */
  biaya: number;
  hasilRingkasan?: string;
}

const CLINIC_VISITS: ClinicVisitRecord[] = [
  {
    id: 'KNJ-2026-0041',
    workspaceId: 'w6',
    clientWorkspace: 'Peternakan Maju Jaya (w1)',
    kategori: 'Rawat Jalan',
    ternakDeskripsi: '2 ekor sapi PO, demam & anoreksia',
    dokterPenanggung: 'drh. Budi Santoso',
    tanggal: '2026-07-28',
    status: 'Selesai',
    biaya: 450000,
    hasilRingkasan: 'Diagnosis: Bovine Respiratory Disease. Diberikan antibiotik dan antipiretik.',
  },
  {
    id: 'KNJ-2026-0042',
    workspaceId: 'w6',
    clientWorkspace: 'Ternak Barokah (w2)',
    kategori: 'Laboratorium',
    ternakDeskripsi: '1 ekor sapi Simmental, pemeriksaan parasit',
    dokterPenanggung: 'Ahmad Fauzi (Teknisi)',
    tanggal: '2026-07-29',
    status: 'Selesai',
    biaya: 280000,
    hasilRingkasan: 'Positif Fasciola hepatica. Rekomendasi pengobatan fasiolisida.',
  },
  {
    id: 'KNJ-2026-0043',
    workspaceId: 'w6',
    clientWorkspace: 'Peternakan Berkah Abadi (w3)',
    kategori: 'Layanan Darurat',
    ternakDeskripsi: '1 ekor sapi Friesian Holstein, distokia',
    dokterPenanggung: 'drh. Sari Kurniawati',
    tanggal: '2026-07-30',
    status: 'Selesai',
    biaya: 1200000,
    hasilRingkasan: 'Persalinan dibantu, anak sapi lahir selamat. Induk dipantau 24 jam.',
  },
  {
    id: 'KNJ-2026-0044',
    workspaceId: 'w6',
    clientWorkspace: 'Kandang Mandiri (w7)',
    kategori: 'Rawat Inap',
    ternakDeskripsi: '1 ekor kambing Etawa, pneumonia berat',
    dokterPenanggung: 'drh. Budi Santoso',
    tanggal: '2026-07-31',
    status: 'Dalam Proses',
    biaya: 850000,
    hasilRingkasan: 'Dalam perawatan intensif. Kondisi stabil.',
  },
  {
    id: 'KNJ-2026-0045',
    workspaceId: 'w6',
    clientWorkspace: 'Peternakan Maju Jaya (w1)',
    kategori: 'Rawat Jalan',
    ternakDeskripsi: '3 ekor domba Garut, vaksinasi rutin',
    dokterPenanggung: 'drh. Sari Kurniawati',
    tanggal: '2026-08-01',
    status: 'Selesai',
    biaya: 360000,
    hasilRingkasan: 'Vaksinasi CDT selesai. Jadwal ulangan 6 bulan.',
  },
  {
    id: 'KNJ-2026-0046',
    workspaceId: 'w6',
    clientWorkspace: 'Ternak Barokah (w2)',
    kategori: 'Rawat Jalan',
    ternakDeskripsi: '2 ekor kerbau, pemeriksaan rutin pra-jual',
    dokterPenanggung: 'drh. Budi Santoso',
    tanggal: '2026-08-04',
    status: 'Terjadwal',
    biaya: 320000,
  },
  {
    id: 'KNJ-2026-0047',
    workspaceId: 'w6',
    clientWorkspace: 'Kandang Mandiri (w7)',
    kategori: 'Laboratorium',
    ternakDeskripsi: '5 sampel darah sapi, panel kebuntingan',
    dokterPenanggung: 'Ahmad Fauzi (Teknisi)',
    tanggal: '2026-08-05',
    status: 'Terjadwal',
    biaya: 750000,
  },
  {
    id: 'KNJ-2026-0038',
    workspaceId: 'w6',
    clientWorkspace: 'Peternakan Berkah Abadi (w3)',
    kategori: 'Bedah',
    ternakDeskripsi: '1 ekor sapi, kastrasi elektif',
    dokterPenanggung: 'drh. Budi Santoso',
    tanggal: '2026-07-20',
    status: 'Dibatalkan',
    biaya: 900000,
    hasilRingkasan: 'Dibatalkan atas permintaan klien. Ruang operasi sedang renovasi.',
  },
];

export function getClinicVisitsByWorkspace(workspaceId: string): ClinicVisitRecord[] {
  return CLINIC_VISITS.filter((v) => v.workspaceId === workspaceId);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface ClinicWorkspaceSummary {
  totalDokter: number;
  dokterAktif: number;
  totalStaf: number;
  kapasitasRawatInap: number;
  pasienAktif: number;
  kunjunganBulanIni: number;
  sertifikatDiterbitkan: number;
}

export function getClinicWorkspaceSummary(workspaceId: string): ClinicWorkspaceSummary {
  const staff = getClinicStaffByWorkspace(workspaceId);
  const doctors = staff.filter((s) => s.peran.startsWith('Dokter Hewan'));
  return {
    totalDokter: doctors.length,
    dokterAktif: doctors.filter((d) => d.status === 'Aktif').length,
    totalStaf: staff.length,
    kapasitasRawatInap: 6,
    pasienAktif: 14,
    kunjunganBulanIni: 47,
    sertifikatDiterbitkan: 23,
  };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatRupiahClinic(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggalClinic(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
