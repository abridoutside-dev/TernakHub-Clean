// ─── Admin Livestock Data — ADM-003A ─────────────────────────────────────────
// Dummy data for Platform Administrator livestock monitoring.
// Read-only. No CRUD. No production database.

// ─── Types ───────────────────────────────────────────────────────────────────

export type LivestockAdminStatus = 'Aktif' | 'Terjual' | 'Mati' | 'Arsip';
export type LivestockSpecies     = 'Domba' | 'Kambing' | 'Sapi' | 'Kerbau' | 'Kuda';
export type LivestockGender      = 'Jantan' | 'Betina';

export interface AdminLivestockTimeline {
  id: string;
  icon: string;
  color: string;
  event: string;
  actor: string;
  timestamp: string;
}

export interface AdminLivestockRecord {
  id: string;              // LVK-YYYYMMDD-NNN
  name: string;
  species: LivestockSpecies;
  breed: string;
  gender: LivestockGender;
  age: string;
  birthDate: string;
  weight: string;
  color: string;           // coat/body color description
  status: LivestockAdminStatus;
  healthStatus: string;    // Sehat | Sakit | Pemulihan | Tidak Diketahui
  vaccinated: boolean;
  lastCheckup: string | null;
  treatmentCount: number;
  photoColor: string;      // placeholder bg color
  photoEmoji: string;

  // Owner & Workspace
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerAvatarInitials: string;
  ownerAvatarColor: string;
  workspaceId: string;
  workspaceName: string;
  workspaceType: string;
  workspacePlan: string;
  workspaceLocation: string;

  // Activity
  registeredAt: string;
  updatedAt: string;
  timeline: AdminLivestockTimeline[];

  // Archive / sale info
  archiveReason: string | null;
  archiveDate: string | null;
  notes: string | null;
}

// ─── Config maps ─────────────────────────────────────────────────────────────

export const LIVESTOCK_STATUS_CONFIG: Record<LivestockAdminStatus, { label: string; color: string; bg: string; dot: string }> = {
  Aktif:   { label: 'Aktif',   color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  Terjual: { label: 'Terjual', color: '#7c3aed', bg: '#ede9fe', dot: '#8b5cf6' },
  Mati:    { label: 'Mati',    color: '#b91c1c', bg: '#fee2e2', dot: '#ef4444' },
  Arsip:   { label: 'Arsip',   color: '#374151', bg: '#f3f4f6', dot: '#9ca3af' },
};

export const LIVESTOCK_SPECIES_CONFIG: Record<LivestockSpecies, { icon: string; color: string; bg: string }> = {
  Domba:   { icon: '🐑', color: '#0369a1', bg: '#e0f2fe' },
  Kambing: { icon: '🐐', color: '#4d7c0f', bg: '#d9f99d' },
  Sapi:    { icon: '🐄', color: '#92400e', bg: '#fef3c7' },
  Kerbau:  { icon: '🦬', color: '#374151', bg: '#f1f5f9' },
  Kuda:    { icon: '🐴', color: '#7c3aed', bg: '#ede9fe' },
};

// ─── Platform Stats ──────────────────────────────────────────────────────────

export const LIVESTOCK_PLATFORM_STATS = {
  total:         1842,
  active:        1124,
  sold:           367,
  dead:           198,
  archived:       153,
  breeds:          38,
  newThisMonth:    94,
};

// ─── Dummy Records ────────────────────────────────────────────────────────────

export const ADMIN_LIVESTOCK_LIST: AdminLivestockRecord[] = [
  // ── Domba ─────────────────────────────────────────────────────────────────
  {
    id: 'LVK-20240315-001',
    name: 'Garuda',
    species: 'Domba',
    breed: 'Garut',
    gender: 'Jantan',
    age: '2 tahun 4 bulan',
    birthDate: '15 Mar 2024',
    weight: '48 kg',
    color: 'Putih berbulu tebal',
    status: 'Aktif',
    healthStatus: 'Sehat',
    vaccinated: true,
    lastCheckup: '10 Jun 2026',
    treatmentCount: 2,
    photoColor: '#bfdbfe',
    photoEmoji: '🐑',
    ownerId: 'USR-0041',
    ownerName: 'Hendra Kusuma',
    ownerEmail: 'hendra.k@mail.com',
    ownerPhone: '+62 812-3344-5566',
    ownerAvatarInitials: 'HK',
    ownerAvatarColor: '#3b82f6',
    workspaceId: 'WS-0011',
    workspaceName: 'Berkah Farm Garut',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Garut, Jawa Barat',
    registeredAt: '16 Mar 2024',
    updatedAt: '10 Jun 2026',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Hendra Kusuma', timestamp: '16 Mar 2024 08:00' },
      { id: 't2', icon: '💉', color: '#10b981', event: 'Vaksinasi pertama', actor: 'drh. Arif Santosa', timestamp: '20 Mar 2024 09:30' },
      { id: 't3', icon: '⚖️', color: '#8b5cf6', event: 'Penimbangan rutin — 48 kg', actor: 'Hendra Kusuma', timestamp: '10 Jun 2026 07:15' },
    ],
    archiveReason: null,
    archiveDate: null,
    notes: null,
  },
  {
    id: 'LVK-20250510-007',
    name: 'Merapi',
    species: 'Domba',
    breed: 'Merino',
    gender: 'Betina',
    age: '1 tahun 2 bulan',
    birthDate: '10 Mei 2025',
    weight: '32 kg',
    color: 'Putih halus bulu panjang',
    status: 'Aktif',
    healthStatus: 'Sehat',
    vaccinated: true,
    lastCheckup: '05 Jun 2026',
    treatmentCount: 0,
    photoColor: '#bfdbfe',
    photoEmoji: '🐑',
    ownerId: 'USR-0078',
    ownerName: 'Nuraini Hasibuan',
    ownerEmail: 'nuraini.h@peternakan.id',
    ownerPhone: '+62 821-7788-9900',
    ownerAvatarInitials: 'NH',
    ownerAvatarColor: '#0ea5e9',
    workspaceId: 'WS-0066',
    workspaceName: 'Hasibuan Agro Farm',
    workspaceType: 'Peternakan',
    workspacePlan: 'Basic',
    workspaceLocation: 'Medan, Sumatera Utara',
    registeredAt: '12 Mei 2025',
    updatedAt: '05 Jun 2026',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Nuraini Hasibuan', timestamp: '12 Mei 2025 10:00' },
      { id: 't2', icon: '💉', color: '#10b981', event: 'Vaksinasi pertama', actor: 'drh. Siti Aminah', timestamp: '18 Mei 2025 08:45' },
    ],
    archiveReason: null,
    archiveDate: null,
    notes: null,
  },
  {
    id: 'LVK-20230820-003',
    name: 'Bagas',
    species: 'Domba',
    breed: 'Ekor Gemuk',
    gender: 'Jantan',
    age: '2 tahun 10 bulan',
    birthDate: '20 Ags 2023',
    weight: '55 kg',
    color: 'Coklat kehitaman, ekor besar',
    status: 'Terjual',
    healthStatus: 'Sehat',
    vaccinated: true,
    lastCheckup: '01 Mei 2026',
    treatmentCount: 1,
    photoColor: '#bfdbfe',
    photoEmoji: '🐑',
    ownerId: 'USR-0091',
    ownerName: 'Iwan Purnomo',
    ownerEmail: 'iwan.purnomo@farm.id',
    ownerPhone: '+62 819-1122-3344',
    ownerAvatarInitials: 'IP',
    ownerAvatarColor: '#0369a1',
    workspaceId: 'WS-0077',
    workspaceName: 'Purnomo Sheep Farm',
    workspaceType: 'Peternakan',
    workspacePlan: 'Basic',
    workspaceLocation: 'Malang, Jawa Timur',
    registeredAt: '21 Ags 2023',
    updatedAt: '10 Mei 2026',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Iwan Purnomo', timestamp: '21 Ags 2023 09:00' },
      { id: 't2', icon: '🏷️', color: '#7c3aed', event: 'Terjual via Marketplace', actor: 'Sistem', timestamp: '10 Mei 2026 14:00' },
    ],
    archiveReason: 'Terjual',
    archiveDate: '10 Mei 2026',
    notes: 'Terjual ke pembeli dari Surabaya melalui marketplace.',
  },

  // ── Kambing ───────────────────────────────────────────────────────────────
  {
    id: 'LVK-20240101-011',
    name: 'Cinta',
    species: 'Kambing',
    breed: 'Etawa',
    gender: 'Betina',
    age: '2 tahun 6 bulan',
    birthDate: '01 Jan 2024',
    weight: '39 kg',
    color: 'Belang hitam-putih',
    status: 'Aktif',
    healthStatus: 'Sehat',
    vaccinated: true,
    lastCheckup: '12 Jun 2026',
    treatmentCount: 1,
    photoColor: '#d9f99d',
    photoEmoji: '🐐',
    ownerId: 'USR-0017',
    ownerName: 'Sari Dewi Rahayu',
    ownerEmail: 'sari.dewi@peternakan.id',
    ownerPhone: '+62 815-2211-8833',
    ownerAvatarInitials: 'SD',
    ownerAvatarColor: '#10b981',
    workspaceId: 'WS-0022',
    workspaceName: 'Etawa Farm Lembang',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Lembang, Jawa Barat',
    registeredAt: '03 Jan 2024',
    updatedAt: '12 Jun 2026',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Sari Dewi Rahayu', timestamp: '03 Jan 2024 07:30' },
      { id: 't2', icon: '💉', color: '#10b981', event: 'Vaksinasi + pemeriksaan', actor: 'drh. Budi Irawan', timestamp: '10 Jan 2024 09:00' },
      { id: 't3', icon: '🍼', color: '#f59e0b', event: 'Melahirkan 1 anak', actor: 'Sistem', timestamp: '15 Apr 2025 03:45' },
    ],
    archiveReason: null,
    archiveDate: null,
    notes: 'Sedang laktasi aktif — produksi susu 2.1 liter/hari.',
  },
  {
    id: 'LVK-20230601-005',
    name: 'Sultan',
    species: 'Kambing',
    breed: 'Boer',
    gender: 'Jantan',
    age: '3 tahun 1 bulan',
    birthDate: '01 Jun 2023',
    weight: '74 kg',
    color: 'Coklat merah kepala, putih badan',
    status: 'Aktif',
    healthStatus: 'Sehat',
    vaccinated: true,
    lastCheckup: '08 Jun 2026',
    treatmentCount: 0,
    photoColor: '#d9f99d',
    photoEmoji: '🐐',
    ownerId: 'USR-0017',
    ownerName: 'Sari Dewi Rahayu',
    ownerEmail: 'sari.dewi@peternakan.id',
    ownerPhone: '+62 815-2211-8833',
    ownerAvatarInitials: 'SD',
    ownerAvatarColor: '#10b981',
    workspaceId: 'WS-0022',
    workspaceName: 'Etawa Farm Lembang',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Lembang, Jawa Barat',
    registeredAt: '02 Jun 2023',
    updatedAt: '08 Jun 2026',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Sari Dewi Rahayu', timestamp: '02 Jun 2023 08:00' },
      { id: 't2', icon: '💉', color: '#10b981', event: 'Vaksinasi lengkap', actor: 'drh. Budi Irawan', timestamp: '08 Jun 2023 10:00' },
    ],
    archiveReason: null,
    archiveDate: null,
    notes: 'Pejantan utama program kawin silang Boer×Etawa.',
  },
  {
    id: 'LVK-20220301-002',
    name: 'Kacang',
    species: 'Kambing',
    breed: 'Kacang',
    gender: 'Betina',
    age: '4 tahun 4 bulan',
    birthDate: '01 Mar 2022',
    weight: '22 kg',
    color: 'Hitam polos',
    status: 'Mati',
    healthStatus: 'Tidak Diketahui',
    vaccinated: false,
    lastCheckup: '10 Jan 2026',
    treatmentCount: 4,
    photoColor: '#d9f99d',
    photoEmoji: '🐐',
    ownerId: 'USR-0119',
    ownerName: 'Doni Prasetyo',
    ownerEmail: 'doni.prasetyo@mail.id',
    ownerPhone: '+62 812-0011-2233',
    ownerAvatarInitials: 'DP',
    ownerAvatarColor: '#94a3b8',
    workspaceId: 'WS-0099',
    workspaceName: 'Prasetyo Farm',
    workspaceType: 'Peternakan',
    workspacePlan: 'Free',
    workspaceLocation: 'Purwokerto, Jawa Tengah',
    registeredAt: '05 Mar 2022',
    updatedAt: '15 Feb 2026',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Doni Prasetyo', timestamp: '05 Mar 2022 08:00' },
      { id: 't2', icon: '🏥', color: '#ef4444', event: 'Dirawat — infeksi saluran pernapasan', actor: 'drh. Hasan Ali', timestamp: '08 Jan 2026 11:00' },
      { id: 't3', icon: '💀', color: '#374151', event: 'Ternak mati', actor: 'Doni Prasetyo', timestamp: '15 Feb 2026 06:00' },
    ],
    archiveReason: 'Mati',
    archiveDate: '15 Feb 2026',
    notes: 'Meninggal akibat komplikasi infeksi pernapasan.',
  },

  // ── Sapi ──────────────────────────────────────────────────────────────────
  {
    id: 'LVK-20250210-012',
    name: 'Bima',
    species: 'Sapi',
    breed: 'Limosin',
    gender: 'Jantan',
    age: '1 tahun 5 bulan',
    birthDate: '10 Feb 2025',
    weight: '325 kg',
    color: 'Merah-coklat, kulit halus',
    status: 'Aktif',
    healthStatus: 'Sehat',
    vaccinated: true,
    lastCheckup: '15 Jun 2026',
    treatmentCount: 0,
    photoColor: '#fef3c7',
    photoEmoji: '🐄',
    ownerId: 'USR-0033',
    ownerName: 'Budi Santoso',
    ownerEmail: 'budi.santoso@limousin.id',
    ownerPhone: '+62 817-5566-7788',
    ownerAvatarInitials: 'BS',
    ownerAvatarColor: '#f59e0b',
    workspaceId: 'WS-0033',
    workspaceName: 'Santoso Cattle Ranch',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Blitar, Jawa Timur',
    registeredAt: '12 Feb 2025',
    updatedAt: '15 Jun 2026',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Budi Santoso', timestamp: '12 Feb 2025 07:00' },
      { id: 't2', icon: '💉', color: '#10b981', event: 'Vaksinasi Anthrax + PMK', actor: 'drh. Joko Prasetyo', timestamp: '20 Feb 2025 09:00' },
      { id: 't3', icon: '⚖️', color: '#8b5cf6', event: 'Penimbangan — 325 kg', actor: 'Budi Santoso', timestamp: '15 Jun 2026 06:30' },
    ],
    archiveReason: null,
    archiveDate: null,
    notes: null,
  },
  {
    id: 'LVK-20220301-005',
    name: 'Mawar',
    species: 'Sapi',
    breed: 'PO (Peranakan Ongole)',
    gender: 'Betina',
    age: '4 tahun 4 bulan',
    birthDate: '01 Mar 2022',
    weight: '382 kg',
    color: 'Putih keabuan, punuk kecil',
    status: 'Terjual',
    healthStatus: 'Sehat',
    vaccinated: true,
    lastCheckup: '19 Mei 2026',
    treatmentCount: 2,
    photoColor: '#fef3c7',
    photoEmoji: '🐄',
    ownerId: 'USR-0033',
    ownerName: 'Budi Santoso',
    ownerEmail: 'budi.santoso@limousin.id',
    ownerPhone: '+62 817-5566-7788',
    ownerAvatarInitials: 'BS',
    ownerAvatarColor: '#f59e0b',
    workspaceId: 'WS-0033',
    workspaceName: 'Santoso Cattle Ranch',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Blitar, Jawa Timur',
    registeredAt: '05 Mar 2022',
    updatedAt: '28 Mei 2026',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Budi Santoso', timestamp: '05 Mar 2022 08:00' },
      { id: 't2', icon: '🍼', color: '#f59e0b', event: 'Melahirkan anak ke-2', actor: 'Sistem', timestamp: '10 Jan 2024 02:30' },
      { id: 't3', icon: '🤝', color: '#059669', event: 'Transaksi selesai — terjual', actor: 'Sistem', timestamp: '28 Mei 2026 14:00' },
    ],
    archiveReason: 'Terjual',
    archiveDate: '28 Mei 2026',
    notes: null,
  },
  {
    id: 'LVK-20240601-019',
    name: 'Brahma',
    species: 'Sapi',
    breed: 'Brahman',
    gender: 'Jantan',
    age: '2 tahun 0 bulan',
    birthDate: '01 Jun 2024',
    weight: '290 kg',
    color: 'Abu-abu gelap, punuk besar',
    status: 'Aktif',
    healthStatus: 'Pemulihan',
    vaccinated: true,
    lastCheckup: '14 Jun 2026',
    treatmentCount: 3,
    photoColor: '#fef3c7',
    photoEmoji: '🐄',
    ownerId: 'USR-0104',
    ownerName: 'Teguh Wibowo',
    ownerEmail: 'teguh.wibowo@cattleranch.id',
    ownerPhone: '+62 822-5566-1122',
    ownerAvatarInitials: 'TW',
    ownerAvatarColor: '#d97706',
    workspaceId: 'WS-0088',
    workspaceName: 'Wibowo Cattle Ranch',
    workspaceType: 'Peternakan',
    workspacePlan: 'Free',
    workspaceLocation: 'Ngawi, Jawa Timur',
    registeredAt: '03 Jun 2024',
    updatedAt: '14 Jun 2026',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Teguh Wibowo', timestamp: '03 Jun 2024 09:00' },
      { id: 't2', icon: '🏥', color: '#f59e0b', event: 'Dirawat — luka kaki kanan', actor: 'drh. Hasan Ali', timestamp: '08 Jun 2026 10:00' },
      { id: 't3', icon: '💊', color: '#8b5cf6', event: 'Pengobatan lanjutan', actor: 'drh. Hasan Ali', timestamp: '14 Jun 2026 09:30' },
    ],
    archiveReason: null,
    archiveDate: null,
    notes: 'Dalam masa pemulihan — luka kaki kanan, prognosis baik.',
  },

  // ── Kerbau ────────────────────────────────────────────────────────────────
  {
    id: 'LVK-20220601-003',
    name: 'Rawa',
    species: 'Kerbau',
    breed: 'Kerbau Rawa',
    gender: 'Jantan',
    age: '4 tahun 1 bulan',
    birthDate: '01 Jun 2022',
    weight: '452 kg',
    color: 'Hitam, tanduk melengkung lebar',
    status: 'Aktif',
    healthStatus: 'Sehat',
    vaccinated: false,
    lastCheckup: '20 Apr 2026',
    treatmentCount: 0,
    photoColor: '#f1f5f9',
    photoEmoji: '🦬',
    ownerId: 'USR-0055',
    ownerName: 'Ahmad Fauzi',
    ownerEmail: 'ahmad.fauzi@rawa.id',
    ownerPhone: '+62 813-9988-7766',
    ownerAvatarInitials: 'AF',
    ownerAvatarColor: '#64748b',
    workspaceId: 'WS-0044',
    workspaceName: 'Fauzi Ternak Kalimantan',
    workspaceType: 'Peternakan',
    workspacePlan: 'Basic',
    workspaceLocation: 'Banjarmasin, Kalimantan Selatan',
    registeredAt: '05 Jun 2022',
    updatedAt: '20 Apr 2026',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Ahmad Fauzi', timestamp: '05 Jun 2022 08:00' },
      { id: 't2', icon: '⚖️', color: '#8b5cf6', event: 'Penimbangan — 452 kg', actor: 'Ahmad Fauzi', timestamp: '20 Apr 2026 07:00' },
    ],
    archiveReason: null,
    archiveDate: null,
    notes: 'Belum divaksinasi — perlu tindak lanjut.',
  },
  {
    id: 'LVK-20210501-008',
    name: 'Hitam',
    species: 'Kerbau',
    breed: 'Kerbau Lumpur',
    gender: 'Betina',
    age: '5 tahun 2 bulan',
    birthDate: '01 Mei 2021',
    weight: '398 kg',
    color: 'Hitam pekat, perut putih',
    status: 'Arsip',
    healthStatus: 'Tidak Diketahui',
    vaccinated: true,
    lastCheckup: '10 Mar 2025',
    treatmentCount: 5,
    photoColor: '#f1f5f9',
    photoEmoji: '🦬',
    ownerId: 'USR-0055',
    ownerName: 'Ahmad Fauzi',
    ownerEmail: 'ahmad.fauzi@rawa.id',
    ownerPhone: '+62 813-9988-7766',
    ownerAvatarInitials: 'AF',
    ownerAvatarColor: '#64748b',
    workspaceId: 'WS-0044',
    workspaceName: 'Fauzi Ternak Kalimantan',
    workspaceType: 'Peternakan',
    workspacePlan: 'Basic',
    workspaceLocation: 'Banjarmasin, Kalimantan Selatan',
    registeredAt: '04 Mei 2021',
    updatedAt: '15 Des 2025',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Ahmad Fauzi', timestamp: '04 Mei 2021 08:00' },
      { id: 't2', icon: '🏥', color: '#ef4444', event: 'Dirawat — mastitis', actor: 'drh. Hasan Ali', timestamp: '10 Mar 2025 10:00' },
      { id: 't3', icon: '📁', color: '#374151', event: 'Diarsipkan', actor: 'Ahmad Fauzi', timestamp: '15 Des 2025 08:00' },
    ],
    archiveReason: 'Tidak produktif',
    archiveDate: '15 Des 2025',
    notes: 'Diarsipkan karena tidak lagi produktif untuk susu.',
  },

  // ── Kuda ──────────────────────────────────────────────────────────────────
  {
    id: 'LVK-20210715-001',
    name: 'Angin',
    species: 'Kuda',
    breed: 'Sandalwood',
    gender: 'Jantan',
    age: '5 tahun 0 bulan',
    birthDate: '15 Jul 2021',
    weight: '385 kg',
    color: 'Coklat kemerahan, kaki putih',
    status: 'Aktif',
    healthStatus: 'Sangat Sehat',
    vaccinated: true,
    lastCheckup: '01 Jun 2026',
    treatmentCount: 0,
    photoColor: '#ede9fe',
    photoEmoji: '🐴',
    ownerId: 'USR-0062',
    ownerName: 'Raden Wijaya',
    ownerEmail: 'raden.wijaya@kudapacu.id',
    ownerPhone: '+62 816-4455-3322',
    ownerAvatarInitials: 'RW',
    ownerAvatarColor: '#7c3aed',
    workspaceId: 'WS-0055',
    workspaceName: 'Sumba Equestrian Farm',
    workspaceType: 'Peternakan',
    workspacePlan: 'Enterprise',
    workspaceLocation: 'Sumba, Nusa Tenggara Timur',
    registeredAt: '16 Jul 2021',
    updatedAt: '01 Jun 2026',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Raden Wijaya', timestamp: '16 Jul 2021 08:00' },
      { id: 't2', icon: '🏆', color: '#f59e0b', event: 'Juara 1 Pacuan Lokal Sumba', actor: 'Sistem', timestamp: '22 Nov 2025 16:00' },
      { id: 't3', icon: '💉', color: '#10b981', event: 'Vaksinasi tahunan', actor: 'drh. Ratna Dewi', timestamp: '01 Jun 2026 09:00' },
    ],
    archiveReason: null,
    archiveDate: null,
    notes: 'Kuda pacuan berprestasi — juara regional 2025.',
  },
  {
    id: 'LVK-20230401-014',
    name: 'Pelangi',
    species: 'Kuda',
    breed: 'Thoroughbred',
    gender: 'Betina',
    age: '3 tahun 3 bulan',
    birthDate: '01 Apr 2023',
    weight: '430 kg',
    color: 'Bay gelap, bintang putih di dahi',
    status: 'Aktif',
    healthStatus: 'Sehat',
    vaccinated: true,
    lastCheckup: '10 Jun 2026',
    treatmentCount: 1,
    photoColor: '#ede9fe',
    photoEmoji: '🐴',
    ownerId: 'USR-0062',
    ownerName: 'Raden Wijaya',
    ownerEmail: 'raden.wijaya@kudapacu.id',
    ownerPhone: '+62 816-4455-3322',
    ownerAvatarInitials: 'RW',
    ownerAvatarColor: '#7c3aed',
    workspaceId: 'WS-0055',
    workspaceName: 'Sumba Equestrian Farm',
    workspaceType: 'Peternakan',
    workspacePlan: 'Enterprise',
    workspaceLocation: 'Sumba, Nusa Tenggara Timur',
    registeredAt: '03 Apr 2023',
    updatedAt: '10 Jun 2026',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Raden Wijaya', timestamp: '03 Apr 2023 09:00' },
      { id: 't2', icon: '💉', color: '#10b981', event: 'Vaksinasi EHV + Influenza', actor: 'drh. Ratna Dewi', timestamp: '10 Jun 2026 08:00' },
    ],
    archiveReason: null,
    archiveDate: null,
    notes: null,
  },
  {
    id: 'LVK-20200601-006',
    name: 'Gagak',
    species: 'Kuda',
    breed: 'Andalusia',
    gender: 'Jantan',
    age: '6 tahun 1 bulan',
    birthDate: '01 Jun 2020',
    weight: '510 kg',
    color: 'Hitam kelam, surai tebal',
    status: 'Mati',
    healthStatus: 'Tidak Diketahui',
    vaccinated: true,
    lastCheckup: '01 Jan 2026',
    treatmentCount: 7,
    photoColor: '#ede9fe',
    photoEmoji: '🐴',
    ownerId: 'USR-0062',
    ownerName: 'Raden Wijaya',
    ownerEmail: 'raden.wijaya@kudapacu.id',
    ownerPhone: '+62 816-4455-3322',
    ownerAvatarInitials: 'RW',
    ownerAvatarColor: '#7c3aed',
    workspaceId: 'WS-0055',
    workspaceName: 'Sumba Equestrian Farm',
    workspaceType: 'Peternakan',
    workspacePlan: 'Enterprise',
    workspaceLocation: 'Sumba, Nusa Tenggara Timur',
    registeredAt: '03 Jun 2020',
    updatedAt: '20 Mar 2026',
    timeline: [
      { id: 't1', icon: '📋', color: '#3b82f6', event: 'Ternak didaftarkan', actor: 'Raden Wijaya', timestamp: '03 Jun 2020 08:00' },
      { id: 't2', icon: '🏥', color: '#ef4444', event: 'Dirawat — kolik parah', actor: 'drh. Ratna Dewi', timestamp: '15 Mar 2026 22:00' },
      { id: 't3', icon: '💀', color: '#374151', event: 'Ternak mati', actor: 'Raden Wijaya', timestamp: '20 Mar 2026 05:00' },
    ],
    archiveReason: 'Mati',
    archiveDate: '20 Mar 2026',
    notes: 'Meninggal akibat kolik equin yang tidak tertangani tepat waktu.',
  },
];

// ─── Filter Function ──────────────────────────────────────────────────────────

export interface LivestockFilterParams {
  keyword?:  string;
  id?:       string;
  owner?:    string;
  species?:  LivestockSpecies | 'All';
  status?:   LivestockAdminStatus | 'All';
  breed?:    string;
  plan?:     string;
}

export function filterLivestock(
  list: AdminLivestockRecord[],
  p: LivestockFilterParams,
): AdminLivestockRecord[] {
  return list.filter((r) => {
    if (p.keyword && !r.name.toLowerCase().includes(p.keyword.toLowerCase())) return false;
    if (p.id      && !r.id.toLowerCase().includes(p.id.toLowerCase()))           return false;
    if (p.owner   && !r.ownerName.toLowerCase().includes(p.owner.toLowerCase())) return false;
    if (p.species && p.species !== 'All' && r.species !== p.species) return false;
    if (p.status  && p.status  !== 'All' && r.status  !== p.status)  return false;
    if (p.breed   && !r.breed.toLowerCase().includes(p.breed.toLowerCase())) return false;
    if (p.plan    && p.plan !== 'All' && r.workspacePlan !== p.plan) return false;
    return true;
  });
}
