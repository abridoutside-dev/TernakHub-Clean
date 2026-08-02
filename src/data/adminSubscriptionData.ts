// ─── Admin Subscription Management Data — ADM-003B ───────────────────────────
// Realistic dummy data only. No production database, no external API.

export type SubscriptionPlan = 'Free' | 'Pro' | 'Enterprise';
export type SubscriptionStatus = 'Active' | 'Expired' | 'Pending Renewal' | 'Cancelled';
export type BillingCycle = 'Monthly' | 'Annual' | 'N/A';

export interface BillingHistoryItem {
  date: string;
  amount: number;
  description: string;
  status: 'Paid' | 'Failed' | 'Refunded';
}

export interface AdminSubscriptionRecord {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceType: string;
  ownerName: string;
  ownerEmail: string;
  avatarInitials: string;
  avatarColor: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  amount: number;          // IDR per cycle, 0 for Free
  startDate: string;
  nextRenewal: string;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  paymentMethod: string;
  featureCount: number;
  memberLimit: number;
  currentMembers: number;
  billingHistory: BillingHistoryItem[];
  notes?: string;
}

// ─── Platform stats ───────────────────────────────────────────────────────────

export interface SubscriptionPlatformStats {
  total: number;
  free: number;
  pro: number;
  enterprise: number;
  expired: number;
  pendingRenewal: number;
  mrrIDR: number;
}

export const SUBSCRIPTION_PLATFORM_STATS: SubscriptionPlatformStats = {
  total: 8_412,
  free: 5_804,
  pro: 2_147,
  enterprise: 461,
  expired: 318,
  pendingRenewal: 142,
  mrrIDR: 847_500_000,
};

// ─── Config maps ─────────────────────────────────────────────────────────────

export const PLAN_CONFIG: Record<SubscriptionPlan, { color: string; bg: string; border: string }> = {
  Free:       { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
  Pro:        { color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
  Enterprise: { color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
};

export const SUB_STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string; bg: string; dot: string }> = {
  'Active':          { label: 'Aktif',           color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  'Expired':         { label: 'Expired',          color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  'Pending Renewal': { label: 'Pending Renewal',  color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  'Cancelled':       { label: 'Cancelled',        color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
};

// ─── Dummy subscription list (20 records) ─────────────────────────────────────

export const ADMIN_SUBSCRIPTION_LIST: AdminSubscriptionRecord[] = [
  {
    id: 'SUB-0001', workspaceId: 'WS-001',
    workspaceName: 'Santoso Farm', workspaceType: 'Peternakan',
    ownerName: 'Budi Santoso', ownerEmail: 'budi.santoso@ternakmail.id',
    avatarInitials: 'BS', avatarColor: '#3b82f6',
    plan: 'Pro', status: 'Active', billingCycle: 'Annual',
    amount: 1_188_000, startDate: '2025-04-12', nextRenewal: '2026-04-12',
    lastPaymentDate: '2025-04-12', lastPaymentAmount: 1_188_000,
    paymentMethod: 'BCA Virtual Account', featureCount: 48, memberLimit: 25, currentMembers: 8,
    billingHistory: [
      { date: '2025-04-12', amount: 1_188_000, description: 'Pro Annual — Tahun ke-2', status: 'Paid' },
      { date: '2024-04-12', amount: 1_188_000, description: 'Pro Annual — Tahun ke-1', status: 'Paid' },
    ],
  },
  {
    id: 'SUB-0002', workspaceId: 'WS-005',
    workspaceName: 'Permata Livestock Group', workspaceType: 'Peternakan',
    ownerName: 'Dewi Permata', ownerEmail: 'dewi.permata@ternakpro.co.id',
    avatarInitials: 'DP', avatarColor: '#8b5cf6',
    plan: 'Enterprise', status: 'Active', billingCycle: 'Annual',
    amount: 5_988_000, startDate: '2023-09-01', nextRenewal: '2026-09-01',
    lastPaymentDate: '2025-09-01', lastPaymentAmount: 5_988_000,
    paymentMethod: 'Transfer Bank Mandiri', featureCount: 113, memberLimit: 100, currentMembers: 24,
    billingHistory: [
      { date: '2025-09-01', amount: 5_988_000, description: 'Enterprise Annual — Tahun ke-3', status: 'Paid' },
      { date: '2024-09-01', amount: 5_988_000, description: 'Enterprise Annual — Tahun ke-2', status: 'Paid' },
      { date: '2023-09-01', amount: 5_988_000, description: 'Enterprise Annual — Tahun ke-1', status: 'Paid' },
    ],
  },
  {
    id: 'SUB-0003', workspaceId: 'WS-003',
    workspaceName: 'Rahayu Ternak', workspaceType: 'Peternakan',
    ownerName: 'Siti Rahayu', ownerEmail: 'siti.rahayu@gmail.com',
    avatarInitials: 'SR', avatarColor: '#10b981',
    plan: 'Pro', status: 'Pending Renewal', billingCycle: 'Monthly',
    amount: 129_000, startDate: '2024-05-20', nextRenewal: '2026-07-20',
    lastPaymentDate: '2026-06-20', lastPaymentAmount: 129_000,
    paymentMethod: 'GoPay', featureCount: 48, memberLimit: 25, currentMembers: 4,
    billingHistory: [
      { date: '2026-06-20', amount: 129_000, description: 'Pro Monthly — Juni 2026', status: 'Paid' },
      { date: '2026-05-20', amount: 129_000, description: 'Pro Monthly — Mei 2026', status: 'Paid' },
      { date: '2026-04-20', amount: 129_000, description: 'Pro Monthly — Apr 2026', status: 'Paid' },
    ],
    notes: 'Kartu kredit mendekati batas — perlu konfirmasi perpanjangan',
  },
  {
    id: 'SUB-0004', workspaceId: 'WS-027',
    workspaceName: 'Maharani Agro Utama', workspaceType: 'Peternakan',
    ownerName: 'Kartini Maharani', ownerEmail: 'kartini.maharani@agrobesar.co.id',
    avatarInitials: 'KM', avatarColor: '#f97316',
    plan: 'Enterprise', status: 'Active', billingCycle: 'Annual',
    amount: 5_988_000, startDate: '2023-06-15', nextRenewal: '2026-06-15',
    lastPaymentDate: '2025-06-15', lastPaymentAmount: 5_988_000,
    paymentMethod: 'Transfer Bank BRI', featureCount: 113, memberLimit: 100, currentMembers: 30,
    billingHistory: [
      { date: '2025-06-15', amount: 5_988_000, description: 'Enterprise Annual — Tahun ke-3', status: 'Paid' },
      { date: '2024-06-15', amount: 5_988_000, description: 'Enterprise Annual — Tahun ke-2', status: 'Paid' },
    ],
  },
  {
    id: 'SUB-0005', workspaceId: 'WS-004',
    workspaceName: 'Fauzi Farm', workspaceType: 'Peternakan',
    ownerName: 'Ahmad Fauzi', ownerEmail: 'ahmad.fauzi1990@yahoo.com',
    avatarInitials: 'AF', avatarColor: '#f59e0b',
    plan: 'Free', status: 'Active', billingCycle: 'N/A',
    amount: 0, startDate: '2025-01-08', nextRenewal: '—',
    lastPaymentDate: '—', lastPaymentAmount: 0,
    paymentMethod: 'N/A', featureCount: 12, memberLimit: 3, currentMembers: 1,
    billingHistory: [],
  },
  {
    id: 'SUB-0006', workspaceId: 'WS-015',
    workspaceName: 'Wulandari Agro', workspaceType: 'Peternakan',
    ownerName: 'Ani Wulandari', ownerEmail: 'ani.wulandari@ternakmail.id',
    avatarInitials: 'AW', avatarColor: '#ec4899',
    plan: 'Pro', status: 'Active', billingCycle: 'Annual',
    amount: 1_188_000, startDate: '2023-11-15', nextRenewal: '2026-11-15',
    lastPaymentDate: '2025-11-15', lastPaymentAmount: 1_188_000,
    paymentMethod: 'OVO', featureCount: 48, memberLimit: 25, currentMembers: 12,
    billingHistory: [
      { date: '2025-11-15', amount: 1_188_000, description: 'Pro Annual — Tahun ke-3', status: 'Paid' },
      { date: '2024-11-15', amount: 1_188_000, description: 'Pro Annual — Tahun ke-2', status: 'Paid' },
    ],
  },
  {
    id: 'SUB-0007', workspaceId: 'WS-013',
    workspaceName: 'Hartono Farm', workspaceType: 'Peternakan',
    ownerName: 'Rudi Hartono', ownerEmail: 'rudihartono77@hotmail.com',
    avatarInitials: 'RH', avatarColor: '#ef4444',
    plan: 'Pro', status: 'Expired', billingCycle: 'Monthly',
    amount: 129_000, startDate: '2024-02-14', nextRenewal: '2026-07-06',
    lastPaymentDate: '2026-06-06', lastPaymentAmount: 129_000,
    paymentMethod: 'DANA', featureCount: 48, memberLimit: 25, currentMembers: 3,
    billingHistory: [
      { date: '2026-06-06', amount: 129_000, description: 'Pro Monthly — Jun 2026', status: 'Paid' },
      { date: '2026-07-06', amount: 129_000, description: 'Pro Monthly — Jul 2026', status: 'Failed' },
    ],
    notes: 'Akun suspended — pembayaran Juli gagal',
  },
  {
    id: 'SUB-0008', workspaceId: 'WS-019',
    workspaceName: 'Setiawan Livestock', workspaceType: 'Peternakan',
    ownerName: 'Gunawan Setiawan', ownerEmail: 'gunawan.setiawan@farmplus.id',
    avatarInitials: 'GS', avatarColor: '#3b82f6',
    plan: 'Pro', status: 'Active', billingCycle: 'Monthly',
    amount: 129_000, startDate: '2024-01-22', nextRenewal: '2026-08-22',
    lastPaymentDate: '2026-07-22', lastPaymentAmount: 129_000,
    paymentMethod: 'BNI Virtual Account', featureCount: 48, memberLimit: 25, currentMembers: 9,
    billingHistory: [
      { date: '2026-07-22', amount: 129_000, description: 'Pro Monthly — Jul 2026', status: 'Paid' },
      { date: '2026-06-22', amount: 129_000, description: 'Pro Monthly — Jun 2026', status: 'Paid' },
    ],
  },
  {
    id: 'SUB-0009', workspaceId: 'WS-022',
    workspaceName: 'Lestari Farm', workspaceType: 'Peternakan',
    ownerName: 'Hesti Lestari', ownerEmail: 'hesti.lestari@ternakmail.id',
    avatarInitials: 'HL', avatarColor: '#10b981',
    plan: 'Pro', status: 'Active', billingCycle: 'Annual',
    amount: 1_188_000, startDate: '2024-07-10', nextRenewal: '2026-07-10',
    lastPaymentDate: '2025-07-10', lastPaymentAmount: 1_188_000,
    paymentMethod: 'Kartu Kredit BCA', featureCount: 48, memberLimit: 25, currentMembers: 3,
    billingHistory: [
      { date: '2025-07-10', amount: 1_188_000, description: 'Pro Annual — Tahun ke-2', status: 'Paid' },
    ],
  },
  {
    id: 'SUB-0010', workspaceId: 'WS-046',
    workspaceName: 'Prakoso Group Utama', workspaceType: 'Peternakan',
    ownerName: 'Teguh Prakoso', ownerEmail: 'teguh.prakoso@agrobesar.co.id',
    avatarInitials: 'TP', avatarColor: '#0ea5e9',
    plan: 'Enterprise', status: 'Active', billingCycle: 'Annual',
    amount: 5_988_000, startDate: '2023-07-20', nextRenewal: '2026-07-20',
    lastPaymentDate: '2025-07-20', lastPaymentAmount: 5_988_000,
    paymentMethod: 'Transfer Bank Mandiri', featureCount: 113, memberLimit: 100, currentMembers: 22,
    billingHistory: [
      { date: '2025-07-20', amount: 5_988_000, description: 'Enterprise Annual — Tahun ke-3', status: 'Paid' },
      { date: '2024-07-20', amount: 5_988_000, description: 'Enterprise Annual — Tahun ke-2', status: 'Paid' },
      { date: '2023-07-20', amount: 5_988_000, description: 'Enterprise Annual — Tahun ke-1', status: 'Paid' },
    ],
  },
  {
    id: 'SUB-0011', workspaceId: 'WS-023',
    workspaceName: 'Kusuma Kambing', workspaceType: 'Peternakan',
    ownerName: 'Indra Kusuma', ownerEmail: 'indrakusuma@gmail.com',
    avatarInitials: 'IK', avatarColor: '#8b5cf6',
    plan: 'Free', status: 'Active', billingCycle: 'N/A',
    amount: 0, startDate: '2025-04-03', nextRenewal: '—',
    lastPaymentDate: '—', lastPaymentAmount: 0,
    paymentMethod: 'N/A', featureCount: 12, memberLimit: 3, currentMembers: 1,
    billingHistory: [],
  },
  {
    id: 'SUB-0012', workspaceId: 'WS-033',
    workspaceName: 'Hakim Farm', workspaceType: 'Peternakan',
    ownerName: 'Lukman Hakim', ownerEmail: 'lukman.hakim@ternakmail.id',
    avatarInitials: 'LH', avatarColor: '#0ea5e9',
    plan: 'Pro', status: 'Pending Renewal', billingCycle: 'Annual',
    amount: 1_188_000, startDate: '2024-09-18', nextRenewal: '2026-09-18',
    lastPaymentDate: '2025-09-18', lastPaymentAmount: 1_188_000,
    paymentMethod: 'ShopeePay', featureCount: 48, memberLimit: 25, currentMembers: 5,
    billingHistory: [
      { date: '2025-09-18', amount: 1_188_000, description: 'Pro Annual — Tahun ke-1', status: 'Paid' },
    ],
    notes: 'Perpanjangan mendekati — notifikasi ke-3 sudah dikirim',
  },
  {
    id: 'SUB-0013', workspaceId: 'WS-040',
    workspaceName: 'Nasution Agro', workspaceType: 'Peternakan',
    ownerName: 'Qomariah Nasution', ownerEmail: 'qomariah.nasution@gmail.com',
    avatarInitials: 'QN', avatarColor: '#8b5cf6',
    plan: 'Pro', status: 'Active', billingCycle: 'Annual',
    amount: 1_188_000, startDate: '2023-10-08', nextRenewal: '2026-10-08',
    lastPaymentDate: '2025-10-08', lastPaymentAmount: 1_188_000,
    paymentMethod: 'BCA Virtual Account', featureCount: 48, memberLimit: 25, currentMembers: 14,
    billingHistory: [
      { date: '2025-10-08', amount: 1_188_000, description: 'Pro Annual — Tahun ke-3', status: 'Paid' },
      { date: '2024-10-08', amount: 1_188_000, description: 'Pro Annual — Tahun ke-2', status: 'Paid' },
    ],
  },
  {
    id: 'SUB-0014', workspaceId: 'WS-035',
    workspaceName: 'Hidayat Berkah Farm', workspaceType: 'Peternakan',
    ownerName: 'Nur Hidayat', ownerEmail: 'nur.hidayat@ternakpro.co.id',
    avatarInitials: 'NH', avatarColor: '#3b82f6',
    plan: 'Pro', status: 'Active', billingCycle: 'Monthly',
    amount: 129_000, startDate: '2024-04-05', nextRenewal: '2026-08-05',
    lastPaymentDate: '2026-07-05', lastPaymentAmount: 129_000,
    paymentMethod: 'Dana', featureCount: 48, memberLimit: 25, currentMembers: 11,
    billingHistory: [
      { date: '2026-07-05', amount: 129_000, description: 'Pro Monthly — Jul 2026', status: 'Paid' },
      { date: '2026-06-05', amount: 129_000, description: 'Pro Monthly — Jun 2026', status: 'Paid' },
    ],
  },
  {
    id: 'SUB-0015', workspaceId: 'WS-034',
    workspaceName: 'Kinanti Ternak', workspaceType: 'Peternakan',
    ownerName: 'Maya Putri Kinanti', ownerEmail: 'mayaputri.kinanti@gmail.com',
    avatarInitials: 'MK', avatarColor: '#ec4899',
    plan: 'Free', status: 'Active', billingCycle: 'N/A',
    amount: 0, startDate: '2025-11-02', nextRenewal: '—',
    lastPaymentDate: '—', lastPaymentAmount: 0,
    paymentMethod: 'N/A', featureCount: 12, memberLimit: 3, currentMembers: 1,
    billingHistory: [],
  },
  {
    id: 'SUB-0016', workspaceId: 'WS-044',
    workspaceName: 'Nugroho Ternak', workspaceType: 'Peternakan',
    ownerName: 'Rian Setiadi Nugroho', ownerEmail: 'riansetiadi@yahoo.com',
    avatarInitials: 'RN', avatarColor: '#ec4899',
    plan: 'Free', status: 'Active', billingCycle: 'N/A',
    amount: 0, startDate: '2025-08-14', nextRenewal: '—',
    lastPaymentDate: '—', lastPaymentAmount: 0,
    paymentMethod: 'N/A', featureCount: 12, memberLimit: 3, currentMembers: 1,
    billingHistory: [],
  },
  {
    id: 'SUB-0017', workspaceId: 'WS-025',
    workspaceName: 'Widi Agro', workspaceType: 'Peternakan',
    ownerName: 'Joko Widiantoro', ownerEmail: 'joko.widi77@hotmail.com',
    avatarInitials: 'JW', avatarColor: '#ef4444',
    plan: 'Pro', status: 'Cancelled', billingCycle: 'Monthly',
    amount: 0, startDate: '2023-12-01', nextRenewal: '—',
    lastPaymentDate: '2026-06-27', lastPaymentAmount: 129_000,
    paymentMethod: 'OVO', featureCount: 0, memberLimit: 3, currentMembers: 2,
    billingHistory: [
      { date: '2026-06-27', amount: 129_000, description: 'Pro Monthly — Jun 2026 (terakhir)', status: 'Paid' },
    ],
    notes: 'Dibatalkan akibat penangguhan akun (kasus #MKT-3010)',
  },
  {
    id: 'SUB-0018', workspaceId: 'WS-038',
    workspaceName: 'Farm Indah', workspaceType: 'Peternakan',
    ownerName: 'Prabowo Susanto', ownerEmail: 'prabowo.susanto@farmindah.id',
    avatarInitials: 'PS', avatarColor: '#10b981',
    plan: 'Pro', status: 'Active', billingCycle: 'Annual',
    amount: 1_188_000, startDate: '2024-08-22', nextRenewal: '2026-08-22',
    lastPaymentDate: '2025-08-22', lastPaymentAmount: 1_188_000,
    paymentMethod: 'Kartu Kredit Mandiri', featureCount: 48, memberLimit: 25, currentMembers: 5,
    billingHistory: [
      { date: '2025-08-22', amount: 1_188_000, description: 'Pro Annual — Tahun ke-2', status: 'Paid' },
      { date: '2024-08-22', amount: 1_188_000, description: 'Pro Annual — Tahun ke-1', status: 'Paid' },
    ],
  },
  {
    id: 'SUB-0019', workspaceId: 'WS-007',
    workspaceName: 'Klinik Permata', workspaceType: 'Klinik Hewan',
    ownerName: 'Dewi Permata', ownerEmail: 'dewi.permata@ternakpro.co.id',
    avatarInitials: 'DP', avatarColor: '#8b5cf6',
    plan: 'Pro', status: 'Active', billingCycle: 'Annual',
    amount: 1_188_000, startDate: '2024-01-10', nextRenewal: '2027-01-10',
    lastPaymentDate: '2026-01-10', lastPaymentAmount: 1_188_000,
    paymentMethod: 'Transfer Bank Mandiri', featureCount: 48, memberLimit: 25, currentMembers: 7,
    billingHistory: [
      { date: '2026-01-10', amount: 1_188_000, description: 'Pro Annual — Tahun ke-3', status: 'Paid' },
      { date: '2025-01-10', amount: 1_188_000, description: 'Pro Annual — Tahun ke-2', status: 'Paid' },
    ],
  },
  {
    id: 'SUB-0020', workspaceId: 'WS-042',
    workspaceName: 'Klinik Nasution', workspaceType: 'Klinik Hewan',
    ownerName: 'Qomariah Nasution', ownerEmail: 'qomariah.nasution@gmail.com',
    avatarInitials: 'QN', avatarColor: '#8b5cf6',
    plan: 'Pro', status: 'Expired', billingCycle: 'Monthly',
    amount: 129_000, startDate: '2024-03-15', nextRenewal: '2026-07-15',
    lastPaymentDate: '2026-06-15', lastPaymentAmount: 129_000,
    paymentMethod: 'GoPay', featureCount: 0, memberLimit: 3, currentMembers: 5,
    billingHistory: [
      { date: '2026-06-15', amount: 129_000, description: 'Pro Monthly — Jun 2026', status: 'Paid' },
      { date: '2026-07-15', amount: 129_000, description: 'Pro Monthly — Jul 2026', status: 'Failed' },
    ],
    notes: 'Gagal auto-renew — saldo GoPay tidak cukup',
  },
];

// ─── Filter helper ────────────────────────────────────────────────────────────

export function filterSubscriptions(
  list: AdminSubscriptionRecord[],
  opts: {
    keyword?: string;
    plan?: SubscriptionPlan | 'All';
    status?: SubscriptionStatus | 'All';
    cycle?: BillingCycle | 'All';
  },
): AdminSubscriptionRecord[] {
  return list.filter((r) => {
    const kw = opts.keyword?.toLowerCase();
    if (kw && !r.workspaceName.toLowerCase().includes(kw) && !r.ownerName.toLowerCase().includes(kw) && !r.id.toLowerCase().includes(kw)) return false;
    if (opts.plan && opts.plan !== 'All' && r.plan !== opts.plan) return false;
    if (opts.status && opts.status !== 'All' && r.status !== opts.status) return false;
    if (opts.cycle && opts.cycle !== 'All' && r.billingCycle !== opts.cycle) return false;
    return true;
  });
}
