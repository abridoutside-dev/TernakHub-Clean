// ─── Admin Trust & Verification Data — ADM-003B ───────────────────────────────
// Realistic dummy data only. No production database, no external API.

export type TrustStatus = 'Pending' | 'Verified' | 'Rejected' | 'Suspended' | 'Under Review';
export type TrustLevel = 'None' | 'Basic' | 'Standard' | 'Premium';
export type WorkspaceType = 'Peternakan' | 'Klinik Hewan' | 'Dokter Hewan' | 'Transportasi';

export interface TrustDocument {
  type: 'KTP' | 'Selfie' | 'SIUP' | 'NPWP' | 'Sertifikat' | 'Akta Usaha';
  submitted: boolean;
  verified: boolean;
}

export interface AdminTrustRecord {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceType: WorkspaceType;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  avatarInitials: string;
  avatarColor: string;
  status: TrustStatus;
  trustLevel: TrustLevel;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  documents: TrustDocument[];
  rejectionReason?: string;
  suspensionReason?: string;
  appealCount: number;
  memberCount: number;
  notes?: string;
}

// ─── Platform stats ───────────────────────────────────────────────────────────

export interface TrustPlatformStats {
  pending: number;
  verified: number;
  rejected: number;
  suspended: number;
  underReview: number;
}

export const TRUST_PLATFORM_STATS: TrustPlatformStats = {
  pending: 47,
  verified: 1_284,
  rejected: 218,
  suspended: 36,
  underReview: 23,
};

// ─── Config maps ─────────────────────────────────────────────────────────────

export const TRUST_STATUS_CONFIG: Record<TrustStatus, { label: string; color: string; bg: string; dot: string }> = {
  Pending:      { label: 'Menunggu',     color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  Verified:     { label: 'Verified',     color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  Rejected:     { label: 'Rejected',     color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  Suspended:    { label: 'Suspended',    color: '#7c3aed', bg: '#ede9fe', dot: '#8b5cf6' },
  'Under Review': { label: 'Under Review', color: '#0369a1', bg: '#e0f2fe', dot: '#0ea5e9' },
};

export const TRUST_LEVEL_CONFIG: Record<TrustLevel, { color: string; bg: string }> = {
  None:     { color: '#94a3b8', bg: '#f1f5f9' },
  Basic:    { color: '#0369a1', bg: '#e0f2fe' },
  Standard: { color: '#059669', bg: '#d1fae5' },
  Premium:  { color: '#b45309', bg: '#fef3c7' },
};

// ─── Dummy trust list (18 records) ───────────────────────────────────────────

export const ADMIN_TRUST_LIST: AdminTrustRecord[] = [
  {
    id: 'VRF-0001', workspaceId: 'WS-001',
    workspaceName: 'Santoso Farm', workspaceType: 'Peternakan',
    ownerName: 'Budi Santoso', ownerEmail: 'budi.santoso@ternakmail.id', ownerPhone: '+62 812-3456-7890',
    avatarInitials: 'BS', avatarColor: '#3b82f6',
    status: 'Verified', trustLevel: 'Standard',
    submittedAt: '2024-03-12', reviewedAt: '2024-03-14', reviewedBy: 'admin@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: true },
      { type: 'Selfie', submitted: true, verified: true },
      { type: 'SIUP', submitted: true, verified: true },
    ],
    appealCount: 0, memberCount: 8,
  },
  {
    id: 'VRF-0002', workspaceId: 'WS-005',
    workspaceName: 'Permata Livestock Group', workspaceType: 'Peternakan',
    ownerName: 'Dewi Permata', ownerEmail: 'dewi.permata@ternakpro.co.id', ownerPhone: '+62 811-2233-4455',
    avatarInitials: 'DP', avatarColor: '#8b5cf6',
    status: 'Verified', trustLevel: 'Premium',
    submittedAt: '2023-09-01', reviewedAt: '2023-09-03', reviewedBy: 'superadmin@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: true },
      { type: 'Selfie', submitted: true, verified: true },
      { type: 'SIUP', submitted: true, verified: true },
      { type: 'NPWP', submitted: true, verified: true },
      { type: 'Akta Usaha', submitted: true, verified: true },
    ],
    appealCount: 0, memberCount: 24,
  },
  {
    id: 'VRF-0003', workspaceId: 'WS-051',
    workspaceName: 'Klinik Harapan Sehat', workspaceType: 'Klinik Hewan',
    ownerName: 'drh. Ratna Dewi Kusuma', ownerEmail: 'ratna.kusuma@klinikharapan.co.id', ownerPhone: '+62 817-5544-3322',
    avatarInitials: 'RK', avatarColor: '#10b981',
    status: 'Pending',
    trustLevel: 'None',
    submittedAt: '2026-07-15',
    documents: [
      { type: 'KTP', submitted: true, verified: false },
      { type: 'Selfie', submitted: true, verified: false },
      { type: 'Sertifikat', submitted: true, verified: false },
      { type: 'SIUP', submitted: false, verified: false },
    ],
    appealCount: 0, memberCount: 6,
  },
  {
    id: 'VRF-0004', workspaceId: 'WS-052',
    workspaceName: 'Agro Mandiri Sejahtera', workspaceType: 'Peternakan',
    ownerName: 'Hendra Wijaya', ownerEmail: 'hendra.wijaya@agromandiri.id', ownerPhone: '+62 813-6677-8899',
    avatarInitials: 'HW', avatarColor: '#f97316',
    status: 'Under Review',
    trustLevel: 'None',
    submittedAt: '2026-07-10', reviewedAt: undefined, reviewedBy: 'moderator01@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: true },
      { type: 'Selfie', submitted: true, verified: false },
      { type: 'SIUP', submitted: true, verified: false },
      { type: 'NPWP', submitted: false, verified: false },
    ],
    appealCount: 0, memberCount: 11,
    notes: 'Foto selfie kurang jelas — meminta foto ulang',
  },
  {
    id: 'VRF-0005', workspaceId: 'WS-053',
    workspaceName: 'Transport Nusantara Ekspres', workspaceType: 'Transportasi',
    ownerName: 'Bambang Setiabudi', ownerEmail: 'bambang.setiabudi@tnekspres.id', ownerPhone: '+62 812-1111-2222',
    avatarInitials: 'BS', avatarColor: '#0ea5e9',
    status: 'Rejected',
    trustLevel: 'None',
    submittedAt: '2026-06-20', reviewedAt: '2026-06-22', reviewedBy: 'admin@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: false },
      { type: 'Selfie', submitted: true, verified: false },
      { type: 'SIUP', submitted: false, verified: false },
    ],
    rejectionReason: 'KTP tidak valid — nama tidak sesuai dengan dokumen lain. SIUP wajib untuk tipe Transportasi.',
    appealCount: 1, memberCount: 4,
  },
  {
    id: 'VRF-0006', workspaceId: 'WS-027',
    workspaceName: 'Maharani Agro Utama', workspaceType: 'Peternakan',
    ownerName: 'Kartini Maharani', ownerEmail: 'kartini.maharani@agrobesar.co.id', ownerPhone: '+62 811-1122-3344',
    avatarInitials: 'KM', avatarColor: '#f97316',
    status: 'Verified', trustLevel: 'Premium',
    submittedAt: '2023-06-15', reviewedAt: '2023-06-16', reviewedBy: 'superadmin@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: true },
      { type: 'Selfie', submitted: true, verified: true },
      { type: 'SIUP', submitted: true, verified: true },
      { type: 'NPWP', submitted: true, verified: true },
      { type: 'Akta Usaha', submitted: true, verified: true },
    ],
    appealCount: 0, memberCount: 30,
  },
  {
    id: 'VRF-0007', workspaceId: 'WS-054',
    workspaceName: 'Drh. Surya Veteriner', workspaceType: 'Dokter Hewan',
    ownerName: 'drh. Surya Pramana', ownerEmail: 'drh.surya@veteriner.id', ownerPhone: '+62 819-7788-9900',
    avatarInitials: 'SP', avatarColor: '#8b5cf6',
    status: 'Pending',
    trustLevel: 'None',
    submittedAt: '2026-07-17',
    documents: [
      { type: 'KTP', submitted: true, verified: false },
      { type: 'Selfie', submitted: true, verified: false },
      { type: 'Sertifikat', submitted: true, verified: false },
    ],
    appealCount: 0, memberCount: 2,
  },
  {
    id: 'VRF-0008', workspaceId: 'WS-055',
    workspaceName: 'Peternakan Barokah Jaya', workspaceType: 'Peternakan',
    ownerName: 'Muslimin Hadi', ownerEmail: 'muslimin.hadi@barokahjaya.com', ownerPhone: '+62 815-3344-5566',
    avatarInitials: 'MH', avatarColor: '#ef4444',
    status: 'Suspended',
    trustLevel: 'Basic',
    submittedAt: '2024-11-10', reviewedAt: '2024-11-12', reviewedBy: 'admin@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: true },
      { type: 'Selfie', submitted: true, verified: true },
    ],
    suspensionReason: 'Ditemukan penjualan ternak ilegal melalui marketplace — kasus #MKT-4412',
    appealCount: 2, memberCount: 7,
    notes: 'Banding ke-2 sedang dalam proses peninjauan',
  },
  {
    id: 'VRF-0009', workspaceId: 'WS-019',
    workspaceName: 'Setiawan Livestock', workspaceType: 'Peternakan',
    ownerName: 'Gunawan Setiawan', ownerEmail: 'gunawan.setiawan@farmplus.id', ownerPhone: '+62 811-9988-7766',
    avatarInitials: 'GS', avatarColor: '#3b82f6',
    status: 'Verified', trustLevel: 'Standard',
    submittedAt: '2024-01-22', reviewedAt: '2024-01-24', reviewedBy: 'admin@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: true },
      { type: 'Selfie', submitted: true, verified: true },
      { type: 'SIUP', submitted: true, verified: true },
    ],
    appealCount: 0, memberCount: 9,
  },
  {
    id: 'VRF-0010', workspaceId: 'WS-056',
    workspaceName: 'Klinik Satwa Prima', workspaceType: 'Klinik Hewan',
    ownerName: 'drh. Indah Puspitasari', ownerEmail: 'drh.indah@satwaprimatama.id', ownerPhone: '+62 813-2200-1100',
    avatarInitials: 'IP', avatarColor: '#ec4899',
    status: 'Under Review',
    trustLevel: 'None',
    submittedAt: '2026-07-12', reviewedBy: 'moderator02@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: true },
      { type: 'Selfie', submitted: true, verified: true },
      { type: 'Sertifikat', submitted: true, verified: false },
      { type: 'SIUP', submitted: true, verified: false },
    ],
    appealCount: 0, memberCount: 8,
    notes: 'Sertifikat praktik perlu diverifikasi ke Dinas Peternakan setempat',
  },
  {
    id: 'VRF-0011', workspaceId: 'WS-046',
    workspaceName: 'Prakoso Group Utama', workspaceType: 'Peternakan',
    ownerName: 'Teguh Prakoso', ownerEmail: 'teguh.prakoso@agrobesar.co.id', ownerPhone: '+62 811-3344-5566',
    avatarInitials: 'TP', avatarColor: '#0ea5e9',
    status: 'Verified', trustLevel: 'Premium',
    submittedAt: '2023-07-20', reviewedAt: '2023-07-22', reviewedBy: 'superadmin@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: true },
      { type: 'Selfie', submitted: true, verified: true },
      { type: 'SIUP', submitted: true, verified: true },
      { type: 'NPWP', submitted: true, verified: true },
      { type: 'Akta Usaha', submitted: true, verified: true },
    ],
    appealCount: 0, memberCount: 22,
  },
  {
    id: 'VRF-0012', workspaceId: 'WS-057',
    workspaceName: 'Maju Bersama Transport', workspaceType: 'Transportasi',
    ownerName: 'Wahyu Tri Nugroho', ownerEmail: 'wahyutri@majubersama.id', ownerPhone: '+62 822-4433-5544',
    avatarInitials: 'WN', avatarColor: '#f59e0b',
    status: 'Rejected',
    trustLevel: 'None',
    submittedAt: '2026-07-01', reviewedAt: '2026-07-03', reviewedBy: 'admin@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: true },
      { type: 'Selfie', submitted: false, verified: false },
      { type: 'SIUP', submitted: false, verified: false },
    ],
    rejectionReason: 'Selfie wajib dikirimkan. SIUP operasional transportasi ternak tidak dilampirkan.',
    appealCount: 0, memberCount: 3,
  },
  {
    id: 'VRF-0013', workspaceId: 'WS-058',
    workspaceName: 'Berkah Kambing Jawa', workspaceType: 'Peternakan',
    ownerName: 'Slamet Riyadi', ownerEmail: 'slamet.riyadi@berkahjawa.id', ownerPhone: '+62 817-8877-6655',
    avatarInitials: 'SR', avatarColor: '#10b981',
    status: 'Pending',
    trustLevel: 'None',
    submittedAt: '2026-07-18',
    documents: [
      { type: 'KTP', submitted: true, verified: false },
      { type: 'Selfie', submitted: true, verified: false },
    ],
    appealCount: 0, memberCount: 5,
  },
  {
    id: 'VRF-0014', workspaceId: 'WS-059',
    workspaceName: 'Drh. Agus Veteriner', workspaceType: 'Dokter Hewan',
    ownerName: 'drh. Agus Prasetyo', ownerEmail: 'drh.agus@agusveterinair.id', ownerPhone: '+62 812-9988-7700',
    avatarInitials: 'AP', avatarColor: '#0ea5e9',
    status: 'Verified', trustLevel: 'Standard',
    submittedAt: '2025-03-10', reviewedAt: '2025-03-12', reviewedBy: 'admin@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: true },
      { type: 'Selfie', submitted: true, verified: true },
      { type: 'Sertifikat', submitted: true, verified: true },
    ],
    appealCount: 0, memberCount: 3,
  },
  {
    id: 'VRF-0015', workspaceId: 'WS-060',
    workspaceName: 'Ekspedisi Ternak Cepat', workspaceType: 'Transportasi',
    ownerName: 'Rizal Firmansyah', ownerEmail: 'rizal.firmansyah@ternakcepat.id', ownerPhone: '+62 819-6655-4433',
    avatarInitials: 'RF', avatarColor: '#8b5cf6',
    status: 'Suspended',
    trustLevel: 'Basic',
    submittedAt: '2025-01-15', reviewedAt: '2025-01-17', reviewedBy: 'admin@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: true },
      { type: 'Selfie', submitted: true, verified: true },
      { type: 'SIUP', submitted: true, verified: true },
    ],
    suspensionReason: 'Ditemukan pengiriman ternak tanpa dokumen kesehatan resmi — kasus #TRANS-0881',
    appealCount: 1, memberCount: 5,
  },
  {
    id: 'VRF-0016', workspaceId: 'WS-015',
    workspaceName: 'Wulandari Agro', workspaceType: 'Peternakan',
    ownerName: 'Ani Wulandari', ownerEmail: 'ani.wulandari@ternakmail.id', ownerPhone: '+62 812-5544-7788',
    avatarInitials: 'AW', avatarColor: '#ec4899',
    status: 'Verified', trustLevel: 'Premium',
    submittedAt: '2023-11-15', reviewedAt: '2023-11-17', reviewedBy: 'admin@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: true },
      { type: 'Selfie', submitted: true, verified: true },
      { type: 'SIUP', submitted: true, verified: true },
      { type: 'NPWP', submitted: true, verified: true },
    ],
    appealCount: 0, memberCount: 12,
  },
  {
    id: 'VRF-0017', workspaceId: 'WS-061',
    workspaceName: 'Peternakan Subur Makmur', workspaceType: 'Peternakan',
    ownerName: 'Dedy Kurniawan', ownerEmail: 'dedy.kurniawan@suburmakmur.id', ownerPhone: '+62 813-0011-2233',
    avatarInitials: 'DK', avatarColor: '#f97316',
    status: 'Pending',
    trustLevel: 'None',
    submittedAt: '2026-07-16',
    documents: [
      { type: 'KTP', submitted: true, verified: false },
      { type: 'Selfie', submitted: false, verified: false },
      { type: 'SIUP', submitted: true, verified: false },
    ],
    appealCount: 0, memberCount: 9,
  },
  {
    id: 'VRF-0018', workspaceId: 'WS-062',
    workspaceName: 'Klinik Hewan Sehat Bersama', workspaceType: 'Klinik Hewan',
    ownerName: 'drh. Fiqi Ramadhan', ownerEmail: 'drh.fiqi@sehathewan.id', ownerPhone: '+62 815-4422-3311',
    avatarInitials: 'FR', avatarColor: '#10b981',
    status: 'Under Review',
    trustLevel: 'None',
    submittedAt: '2026-07-14', reviewedBy: 'moderator01@ternakhub.id',
    documents: [
      { type: 'KTP', submitted: true, verified: true },
      { type: 'Selfie', submitted: true, verified: true },
      { type: 'Sertifikat', submitted: true, verified: false },
      { type: 'SIUP', submitted: true, verified: false },
      { type: 'NPWP', submitted: false, verified: false },
    ],
    appealCount: 0, memberCount: 10,
    notes: 'Dokumen sertifikat sedang dicek ke Kementan',
  },
];

// ─── Filter helper ────────────────────────────────────────────────────────────

export function filterTrustRecords(
  list: AdminTrustRecord[],
  opts: {
    keyword?: string;
    status?: TrustStatus | 'All';
    wsType?: WorkspaceType | 'All';
    trustLevel?: TrustLevel | 'All';
  },
): AdminTrustRecord[] {
  return list.filter((r) => {
    const kw = opts.keyword?.toLowerCase();
    if (kw && !r.workspaceName.toLowerCase().includes(kw) && !r.ownerName.toLowerCase().includes(kw) && !r.id.toLowerCase().includes(kw)) return false;
    if (opts.status && opts.status !== 'All' && r.status !== opts.status) return false;
    if (opts.wsType && opts.wsType !== 'All' && r.workspaceType !== opts.wsType) return false;
    if (opts.trustLevel && opts.trustLevel !== 'All' && r.trustLevel !== opts.trustLevel) return false;
    return true;
  });
}
