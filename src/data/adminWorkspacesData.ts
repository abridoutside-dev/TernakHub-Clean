// ─── Admin Workspace Management Data — ADM-004 ───────────────────────────────
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ⚠️  LEGACY — P0-001B                                                   ║
// ║                                                                          ║
// ║  File ini berstatus LEGACY dan TIDAK lagi menjadi sumber data resmi     ║
// ║  untuk entitas Workspace.                                                ║
// ║                                                                          ║
// ║  Single Source of Truth yang resmi:                                      ║
// ║    src/data/workspaceFoundationData.ts  (via workspaceService.ts)        ║
// ║                                                                          ║
// ║  File ini dipertahankan agar tidak ada perubahan perilaku aplikasi       ║
// ║  selama masa transisi. File ini akan dipensiunkan pada P0-001D.          ║
// ║                                                                          ║
// ║  JANGAN tambahkan data atau logika workspace baru di sini.               ║
// ║  JANGAN buat file baru yang mengimpor dari sini sebagai sumber data      ║
// ║  workspace utama.                                                        ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// Realistic dummy data only. No production database, no external API.

export type WorkspaceStatus = 'Active' | 'Suspended' | 'Archived';
export type WorkspacePlanTier = 'Free' | 'Basic' | 'Pro' | 'Enterprise';
export type WsType = 'Peternakan' | 'Klinik Hewan' | 'Dokter Hewan' | 'Transportasi';
export type WsMemberRole = 'Owner' | 'Admin' | 'Member' | 'Viewer';

export interface WsMemberSummary {
  userId: string;
  name: string;
  role: WsMemberRole;
  joinedAt: string;
}

export interface WsMarketplaceSummary {
  activeListings: number;
  completedTransactions: number;
  totalRevenueMillion: number; // in million IDR
}

export interface WsLivestockSummary {
  total: number;
  active: number;
  archived: number;
  species: string[];
}

export interface WsSubscriptionSummary {
  plan: WorkspacePlanTier;
  billingStatus: 'Active' | 'Expired' | 'Trial' | 'N/A';
  renewalDate: string;
  featuresUsed: number;
  featuresTotal: number;
}

export interface WsActivityItem {
  id: string;
  event: string;
  actor: string;
  timestamp: string;
  icon: string;
  color: string;
}

export interface AdminWorkspaceRecord {
  id: string;            // WS-001
  name: string;
  slug: string;
  type: WsType;
  status: WorkspaceStatus;
  plan: WorkspacePlanTier;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  memberCount: number;
  members: WsMemberSummary[];
  livestockCount: number;
  createdAt: string;     // ISO date
  lastActiveAt: string;  // human-readable
  lastActiveDaysAgo: number;
  marketplaceSummary: WsMarketplaceSummary;
  livestockSummary: WsLivestockSummary;
  subscriptionSummary: WsSubscriptionSummary;
  recentActivity: WsActivityItem[];
  notes?: string;
}

// ─── Platform stats ───────────────────────────────────────────────────────────

export interface WsPlatformStats {
  total: number;
  active: number;
  suspended: number;
  archived: number;
  free: number;
  basic: number;
  pro: number;
  enterprise: number;
  newThisMonth: number;
}

export const WS_PLATFORM_STATS: WsPlatformStats = {
  total: 3_241,
  active: 3_009,
  suspended: 80,
  archived: 152,
  free: 1_876,
  basic: 612,
  pro: 372,
  enterprise: 381,
  newThisMonth: 87,
};

// ─── Config maps ─────────────────────────────────────────────────────────────

export const WS_STATUS_CONFIG: Record<WorkspaceStatus, { label: string; color: string; bg: string; dot: string }> = {
  Active:    { label: 'Aktif',     color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  Suspended: { label: 'Suspended', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  Archived:  { label: 'Archived',  color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
};

export const WS_PLAN_CONFIG: Record<WorkspacePlanTier, { color: string; bg: string }> = {
  Free:       { color: '#64748b', bg: '#f1f5f9' },
  Basic:      { color: '#0369a1', bg: '#e0f2fe' },
  Pro:        { color: '#7c3aed', bg: '#ede9fe' },
  Enterprise: { color: '#b45309', bg: '#fef3c7' },
};

export const WS_TYPE_CONFIG: Record<WsType, { icon: string; color: string; bg: string }> = {
  'Peternakan':   { icon: '🐄', color: '#059669', bg: '#d1fae5' },
  'Klinik Hewan': { icon: '🏥', color: '#0ea5e9', bg: '#e0f2fe' },
  'Dokter Hewan': { icon: '👨‍⚕️', color: '#8b5cf6', bg: '#ede9fe' },
  'Transportasi': { icon: '🚛', color: '#f59e0b', bg: '#fef3c7' },
};

// ─── Dummy workspace records (20) ─────────────────────────────────────────────

export const ADMIN_WORKSPACE_LIST: AdminWorkspaceRecord[] = [
  {
    id: 'WS-001',
    name: 'Santoso Farm',
    slug: 'santoso-farm',
    type: 'Peternakan',
    status: 'Active',
    plan: 'Pro',
    ownerId: 'USR-0001',
    ownerName: 'Budi Santoso',
    ownerEmail: 'budi.santoso@ternakmail.id',
    ownerPhone: '+62 812-3456-7890',
    memberCount: 8,
    members: [
      { userId: 'USR-0001', name: 'Budi Santoso',   role: 'Owner',  joinedAt: '2024-03-12' },
      { userId: 'USR-0031', name: 'Agus Riyanto',   role: 'Admin',  joinedAt: '2024-03-15' },
      { userId: 'USR-0032', name: 'Wati Lestari',   role: 'Member', joinedAt: '2024-04-01' },
      { userId: 'USR-0033', name: 'Hendra Saputra', role: 'Member', joinedAt: '2024-05-10' },
    ],
    livestockCount: 142,
    createdAt: '2024-03-12',
    lastActiveAt: '2 hours ago',
    lastActiveDaysAgo: 0,
    marketplaceSummary: { activeListings: 12, completedTransactions: 47, totalRevenueMillion: 384 },
    livestockSummary: { total: 142, active: 128, archived: 14, species: ['Sapi Bali', 'Sapi Limousin', 'Kambing Boer'] },
    subscriptionSummary: { plan: 'Pro', billingStatus: 'Active', renewalDate: '2027-03-12', featuresUsed: 28, featuresTotal: 35 },
    recentActivity: [
      { id: 'a1', event: 'New livestock registered', actor: 'Budi Santoso', timestamp: '2 hours ago', icon: '🐄', color: '#10b981' },
      { id: 'a2', event: 'Marketplace listing created', actor: 'Agus Riyanto', timestamp: '5 hours ago', icon: '🛒', color: '#3b82f6' },
      { id: 'a3', event: 'Feed stock adjusted', actor: 'Wati Lestari', timestamp: 'Yesterday', icon: '🌾', color: '#f59e0b' },
    ],
  },
  {
    id: 'WS-002',
    name: 'Santoso Sapi',
    slug: 'santoso-sapi',
    type: 'Peternakan',
    status: 'Active',
    plan: 'Basic',
    ownerId: 'USR-0001',
    ownerName: 'Budi Santoso',
    ownerEmail: 'budi.santoso@ternakmail.id',
    ownerPhone: '+62 812-3456-7890',
    memberCount: 3,
    members: [
      { userId: 'USR-0001', name: 'Budi Santoso',  role: 'Owner',  joinedAt: '2024-06-01' },
      { userId: 'USR-0034', name: 'Slamet Hadi',   role: 'Member', joinedAt: '2024-06-15' },
      { userId: 'USR-0035', name: 'Rina Yuliana',  role: 'Viewer', joinedAt: '2024-07-01' },
    ],
    livestockCount: 38,
    createdAt: '2024-06-01',
    lastActiveAt: 'Yesterday',
    lastActiveDaysAgo: 1,
    marketplaceSummary: { activeListings: 4, completedTransactions: 11, totalRevenueMillion: 82 },
    livestockSummary: { total: 38, active: 35, archived: 3, species: ['Sapi Bali'] },
    subscriptionSummary: { plan: 'Basic', billingStatus: 'Active', renewalDate: '2027-06-01', featuresUsed: 12, featuresTotal: 18 },
    recentActivity: [
      { id: 'b1', event: 'Batch weaning completed', actor: 'Budi Santoso', timestamp: 'Yesterday', icon: '✅', color: '#10b981' },
      { id: 'b2', event: 'Health check recorded', actor: 'Slamet Hadi', timestamp: '2 days ago', icon: '💊', color: '#8b5cf6' },
    ],
  },
  {
    id: 'WS-003',
    name: 'Rahayu Ternak',
    slug: 'rahayu-ternak',
    type: 'Peternakan',
    status: 'Active',
    plan: 'Basic',
    ownerId: 'USR-0002',
    ownerName: 'Siti Rahayu',
    ownerEmail: 'siti.rahayu@gmail.com',
    ownerPhone: '+62 813-7654-3210',
    memberCount: 4,
    members: [
      { userId: 'USR-0002', name: 'Siti Rahayu',   role: 'Owner',  joinedAt: '2024-05-20' },
      { userId: 'USR-0036', name: 'Deni Kurniawan', role: 'Admin',  joinedAt: '2024-06-01' },
      { userId: 'USR-0037', name: 'Titi Sundari',   role: 'Member', joinedAt: '2024-07-10' },
    ],
    livestockCount: 75,
    createdAt: '2024-05-20',
    lastActiveAt: 'Yesterday',
    lastActiveDaysAgo: 1,
    marketplaceSummary: { activeListings: 7, completedTransactions: 23, totalRevenueMillion: 156 },
    livestockSummary: { total: 75, active: 69, archived: 6, species: ['Kambing Ettawa', 'Domba Garut'] },
    subscriptionSummary: { plan: 'Basic', billingStatus: 'Active', renewalDate: '2027-05-20', featuresUsed: 14, featuresTotal: 18 },
    recentActivity: [
      { id: 'c1', event: 'New member joined', actor: 'Siti Rahayu', timestamp: '3 days ago', icon: '👤', color: '#3b82f6' },
      { id: 'c2', event: 'Marketplace transaction completed', actor: 'Deni Kurniawan', timestamp: '4 days ago', icon: '💰', color: '#10b981' },
    ],
  },
  {
    id: 'WS-004',
    name: 'Fauzi Farm',
    slug: 'fauzi-farm',
    type: 'Peternakan',
    status: 'Active',
    plan: 'Free',
    ownerId: 'USR-0003',
    ownerName: 'Ahmad Fauzi',
    ownerEmail: 'ahmad.fauzi1990@yahoo.com',
    ownerPhone: '+62 815-9876-5432',
    memberCount: 1,
    members: [
      { userId: 'USR-0003', name: 'Ahmad Fauzi', role: 'Owner', joinedAt: '2025-01-08' },
    ],
    livestockCount: 11,
    createdAt: '2025-01-08',
    lastActiveAt: '3 days ago',
    lastActiveDaysAgo: 3,
    marketplaceSummary: { activeListings: 1, completedTransactions: 2, totalRevenueMillion: 14 },
    livestockSummary: { total: 11, active: 11, archived: 0, species: ['Ayam Kampung'] },
    subscriptionSummary: { plan: 'Free', billingStatus: 'N/A', renewalDate: '-', featuresUsed: 4, featuresTotal: 8 },
    recentActivity: [
      { id: 'd1', event: 'Workspace created', actor: 'Ahmad Fauzi', timestamp: '2025-01-08', icon: '🏗️', color: '#64748b' },
    ],
  },
  {
    id: 'WS-005',
    name: 'Permata Livestock Group',
    slug: 'permata-livestock-group',
    type: 'Peternakan',
    status: 'Active',
    plan: 'Enterprise',
    ownerId: 'USR-0004',
    ownerName: 'Dewi Permata',
    ownerEmail: 'dewi.permata@ternakpro.co.id',
    ownerPhone: '+62 811-2233-4455',
    memberCount: 24,
    members: [
      { userId: 'USR-0004', name: 'Dewi Permata',     role: 'Owner',  joinedAt: '2023-09-01' },
      { userId: 'USR-0038', name: 'Firman Hidayat',   role: 'Admin',  joinedAt: '2023-09-05' },
      { userId: 'USR-0039', name: 'Yanti Marlina',    role: 'Admin',  joinedAt: '2023-09-10' },
      { userId: 'USR-0040', name: 'Adi Prayitno',     role: 'Member', joinedAt: '2023-10-01' },
    ],
    livestockCount: 541,
    createdAt: '2023-09-01',
    lastActiveAt: '1 hour ago',
    lastActiveDaysAgo: 0,
    marketplaceSummary: { activeListings: 38, completedTransactions: 214, totalRevenueMillion: 4_280 },
    livestockSummary: { total: 541, active: 490, archived: 51, species: ['Sapi Brahman', 'Sapi Bali', 'Kerbau', 'Kambing Boer', 'Domba'] },
    subscriptionSummary: { plan: 'Enterprise', billingStatus: 'Active', renewalDate: '2027-09-01', featuresUsed: 52, featuresTotal: 60 },
    recentActivity: [
      { id: 'e1', event: 'Bulk livestock import', actor: 'Firman Hidayat', timestamp: '1 hour ago', icon: '📦', color: '#10b981' },
      { id: 'e2', event: 'Enterprise report generated', actor: 'Dewi Permata', timestamp: '3 hours ago', icon: '📊', color: '#3b82f6' },
      { id: 'e3', event: 'New marketplace listing', actor: 'Yanti Marlina', timestamp: '5 hours ago', icon: '🛒', color: '#f59e0b' },
    ],
  },
  {
    id: 'WS-006',
    name: 'Hartono Farm',
    slug: 'hartono-farm',
    type: 'Peternakan',
    status: 'Suspended',
    plan: 'Basic',
    ownerId: 'USR-0005',
    ownerName: 'Rudi Hartono',
    ownerEmail: 'rudihartono77@hotmail.com',
    ownerPhone: '+62 819-6543-2109',
    memberCount: 3,
    members: [
      { userId: 'USR-0005', name: 'Rudi Hartono',  role: 'Owner',  joinedAt: '2024-02-14' },
      { userId: 'USR-0041', name: 'Andi Prakoso',  role: 'Member', joinedAt: '2024-03-01' },
    ],
    livestockCount: 22,
    createdAt: '2024-02-14',
    lastActiveAt: '12 days ago',
    lastActiveDaysAgo: 12,
    marketplaceSummary: { activeListings: 0, completedTransactions: 8, totalRevenueMillion: 54 },
    livestockSummary: { total: 22, active: 20, archived: 2, species: ['Sapi Bali'] },
    subscriptionSummary: { plan: 'Basic', billingStatus: 'Expired', renewalDate: '2026-07-14', featuresUsed: 9, featuresTotal: 18 },
    recentActivity: [
      { id: 'f1', event: 'Workspace suspended (marketplace fraud)', actor: 'Platform Admin', timestamp: '12 days ago', icon: '🚫', color: '#ef4444' },
    ],
    notes: 'Suspended: reported marketplace fraud — case #MKT-2241. Pending review.',
  },
  {
    id: 'WS-007',
    name: 'Klinik Permata',
    slug: 'klinik-permata',
    type: 'Klinik Hewan',
    status: 'Active',
    plan: 'Pro',
    ownerId: 'USR-0004',
    ownerName: 'Dewi Permata',
    ownerEmail: 'dewi.permata@ternakpro.co.id',
    ownerPhone: '+62 811-2233-4455',
    memberCount: 7,
    members: [
      { userId: 'USR-0004', name: 'Dewi Permata',   role: 'Owner',  joinedAt: '2023-10-15' },
      { userId: 'USR-0042', name: 'drh. Sinta Dewi', role: 'Admin', joinedAt: '2023-10-20' },
      { userId: 'USR-0043', name: 'Bambang Irawan',  role: 'Member', joinedAt: '2023-11-01' },
    ],
    livestockCount: 0,
    createdAt: '2023-10-15',
    lastActiveAt: 'Today',
    lastActiveDaysAgo: 0,
    marketplaceSummary: { activeListings: 5, completedTransactions: 89, totalRevenueMillion: 210 },
    livestockSummary: { total: 0, active: 0, archived: 0, species: [] },
    subscriptionSummary: { plan: 'Pro', billingStatus: 'Active', renewalDate: '2027-10-15', featuresUsed: 22, featuresTotal: 35 },
    recentActivity: [
      { id: 'g1', event: 'Health examination recorded', actor: 'drh. Sinta Dewi', timestamp: 'Today', icon: '💊', color: '#8b5cf6' },
      { id: 'g2', event: 'New service listing posted', actor: 'Bambang Irawan', timestamp: 'Yesterday', icon: '🛒', color: '#3b82f6' },
    ],
  },
  {
    id: 'WS-008',
    name: 'Drh. Permata Konsultan',
    slug: 'drh-permata-konsultan',
    type: 'Dokter Hewan',
    status: 'Active',
    plan: 'Basic',
    ownerId: 'USR-0004',
    ownerName: 'Dewi Permata',
    ownerEmail: 'dewi.permata@ternakpro.co.id',
    ownerPhone: '+62 811-2233-4455',
    memberCount: 3,
    members: [
      { userId: 'USR-0004', name: 'Dewi Permata',    role: 'Owner',  joinedAt: '2024-01-10' },
      { userId: 'USR-0044', name: 'drh. Andi Surya', role: 'Member', joinedAt: '2024-01-15' },
    ],
    livestockCount: 0,
    createdAt: '2024-01-10',
    lastActiveAt: '2 days ago',
    lastActiveDaysAgo: 2,
    marketplaceSummary: { activeListings: 3, completedTransactions: 44, totalRevenueMillion: 88 },
    livestockSummary: { total: 0, active: 0, archived: 0, species: [] },
    subscriptionSummary: { plan: 'Basic', billingStatus: 'Active', renewalDate: '2027-01-10', featuresUsed: 10, featuresTotal: 18 },
    recentActivity: [
      { id: 'h1', event: 'Consultation completed', actor: 'drh. Andi Surya', timestamp: '2 days ago', icon: '👨‍⚕️', color: '#8b5cf6' },
    ],
  },
  {
    id: 'WS-009',
    name: 'Permata Logistik',
    slug: 'permata-logistik',
    type: 'Transportasi',
    status: 'Active',
    plan: 'Basic',
    ownerId: 'USR-0004',
    ownerName: 'Dewi Permata',
    ownerEmail: 'dewi.permata@ternakpro.co.id',
    ownerPhone: '+62 811-2233-4455',
    memberCount: 5,
    members: [
      { userId: 'USR-0004', name: 'Dewi Permata',  role: 'Owner',  joinedAt: '2024-03-01' },
      { userId: 'USR-0045', name: 'Yusuf Habibie', role: 'Admin',  joinedAt: '2024-03-05' },
      { userId: 'USR-0046', name: 'Maman Suherman', role: 'Member', joinedAt: '2024-04-01' },
    ],
    livestockCount: 0,
    createdAt: '2024-03-01',
    lastActiveAt: '4 hours ago',
    lastActiveDaysAgo: 0,
    marketplaceSummary: { activeListings: 6, completedTransactions: 31, totalRevenueMillion: 124 },
    livestockSummary: { total: 0, active: 0, archived: 0, species: [] },
    subscriptionSummary: { plan: 'Basic', billingStatus: 'Active', renewalDate: '2027-03-01', featuresUsed: 11, featuresTotal: 18 },
    recentActivity: [
      { id: 'i1', event: 'Transport job completed', actor: 'Yusuf Habibie', timestamp: '4 hours ago', icon: '🚛', color: '#f59e0b' },
      { id: 'i2', event: 'New route listing added', actor: 'Maman Suherman', timestamp: 'Yesterday', icon: '🗺️', color: '#3b82f6' },
    ],
  },
  {
    id: 'WS-010',
    name: 'Wulandari Agro',
    slug: 'wulandari-agro',
    type: 'Peternakan',
    status: 'Active',
    plan: 'Pro',
    ownerId: 'USR-0006',
    ownerName: 'Ani Wulandari',
    ownerEmail: 'ani.wulandari@ternakmail.id',
    ownerPhone: '+62 812-5544-7788',
    memberCount: 12,
    members: [
      { userId: 'USR-0006', name: 'Ani Wulandari',  role: 'Owner',  joinedAt: '2023-11-15' },
      { userId: 'USR-0047', name: 'Bambang Sutopo', role: 'Admin',  joinedAt: '2023-11-20' },
      { userId: 'USR-0048', name: 'Lina Susanti',   role: 'Member', joinedAt: '2023-12-01' },
    ],
    livestockCount: 203,
    createdAt: '2023-11-15',
    lastActiveAt: '4 hours ago',
    lastActiveDaysAgo: 0,
    marketplaceSummary: { activeListings: 18, completedTransactions: 96, totalRevenueMillion: 862 },
    livestockSummary: { total: 203, active: 188, archived: 15, species: ['Sapi Bali', 'Sapi Madura', 'Domba'] },
    subscriptionSummary: { plan: 'Pro', billingStatus: 'Active', renewalDate: '2026-11-15', featuresUsed: 30, featuresTotal: 35 },
    recentActivity: [
      { id: 'j1', event: 'Reproduction program started', actor: 'Ani Wulandari', timestamp: '4 hours ago', icon: '🧬', color: '#ec4899' },
      { id: 'j2', event: 'Feed batch processed', actor: 'Bambang Sutopo', timestamp: 'Yesterday', icon: '🌾', color: '#f59e0b' },
    ],
  },
  {
    id: 'WS-011',
    name: 'Setiawan Livestock',
    slug: 'setiawan-livestock',
    type: 'Peternakan',
    status: 'Active',
    plan: 'Pro',
    ownerId: 'USR-0009',
    ownerName: 'Gunawan Setiawan',
    ownerEmail: 'gunawan.setiawan@farmplus.id',
    ownerPhone: '+62 811-9988-7766',
    memberCount: 9,
    members: [
      { userId: 'USR-0009', name: 'Gunawan Setiawan', role: 'Owner',  joinedAt: '2024-01-22' },
      { userId: 'USR-0049', name: 'Putri Handayani',  role: 'Admin',  joinedAt: '2024-02-01' },
      { userId: 'USR-0050', name: 'Cahyo Nugroho',    role: 'Member', joinedAt: '2024-03-10' },
    ],
    livestockCount: 168,
    createdAt: '2024-01-22',
    lastActiveAt: 'Today',
    lastActiveDaysAgo: 0,
    marketplaceSummary: { activeListings: 14, completedTransactions: 62, totalRevenueMillion: 548 },
    livestockSummary: { total: 168, active: 151, archived: 17, species: ['Sapi Bali', 'Kambing Boer', 'Ayam Petelur'] },
    subscriptionSummary: { plan: 'Pro', billingStatus: 'Active', renewalDate: '2027-01-22', featuresUsed: 27, featuresTotal: 35 },
    recentActivity: [
      { id: 'k1', event: 'Livestock batch mutation approved', actor: 'Gunawan Setiawan', timestamp: 'Today', icon: '🔄', color: '#3b82f6' },
      { id: 'k2', event: 'Medicine stock updated', actor: 'Putri Handayani', timestamp: 'Yesterday', icon: '💊', color: '#8b5cf6' },
    ],
  },
  {
    id: 'WS-012',
    name: 'Maharani Agro Utama',
    slug: 'maharani-agro-utama',
    type: 'Peternakan',
    status: 'Active',
    plan: 'Enterprise',
    ownerId: 'USR-0013',
    ownerName: 'Kartini Maharani',
    ownerEmail: 'kartini.maharani@agrobesar.co.id',
    ownerPhone: '+62 811-1122-3344',
    memberCount: 30,
    members: [
      { userId: 'USR-0013', name: 'Kartini Maharani',  role: 'Owner',  joinedAt: '2023-06-15' },
      { userId: 'USR-0051', name: 'Hendri Wijaya',     role: 'Admin',  joinedAt: '2023-06-20' },
      { userId: 'USR-0052', name: 'Ratna Kusumawati',  role: 'Admin',  joinedAt: '2023-07-01' },
      { userId: 'USR-0053', name: 'Faris Abdurrahman', role: 'Member', joinedAt: '2023-08-01' },
    ],
    livestockCount: 892,
    createdAt: '2023-06-15',
    lastActiveAt: '30 minutes ago',
    lastActiveDaysAgo: 0,
    marketplaceSummary: { activeListings: 65, completedTransactions: 430, totalRevenueMillion: 12_400 },
    livestockSummary: { total: 892, active: 820, archived: 72, species: ['Sapi Brahman', 'Sapi Bali', 'Kerbau', 'Kambing PE', 'Domba Garut', 'Babi'] },
    subscriptionSummary: { plan: 'Enterprise', billingStatus: 'Active', renewalDate: '2028-06-15', featuresUsed: 58, featuresTotal: 60 },
    recentActivity: [
      { id: 'l1', event: 'Quarterly analytics report exported', actor: 'Kartini Maharani', timestamp: '30 minutes ago', icon: '📊', color: '#3b82f6' },
      { id: 'l2', event: 'New staff onboarded (6 members)', actor: 'Hendri Wijaya', timestamp: '2 days ago', icon: '👥', color: '#10b981' },
      { id: 'l3', event: 'Feed formula production run', actor: 'Ratna Kusumawati', timestamp: '3 days ago', icon: '🌾', color: '#f59e0b' },
    ],
  },
  {
    id: 'WS-013',
    name: 'Klinik Maharani',
    slug: 'klinik-maharani',
    type: 'Klinik Hewan',
    status: 'Active',
    plan: 'Pro',
    ownerId: 'USR-0013',
    ownerName: 'Kartini Maharani',
    ownerEmail: 'kartini.maharani@agrobesar.co.id',
    ownerPhone: '+62 811-1122-3344',
    memberCount: 10,
    members: [
      { userId: 'USR-0013', name: 'Kartini Maharani',  role: 'Owner',  joinedAt: '2023-08-01' },
      { userId: 'USR-0054', name: 'drh. Rini Astuti',  role: 'Admin',  joinedAt: '2023-08-05' },
      { userId: 'USR-0055', name: 'drh. Arif Budiman', role: 'Member', joinedAt: '2023-09-01' },
    ],
    livestockCount: 0,
    createdAt: '2023-08-01',
    lastActiveAt: '1 hour ago',
    lastActiveDaysAgo: 0,
    marketplaceSummary: { activeListings: 8, completedTransactions: 167, totalRevenueMillion: 334 },
    livestockSummary: { total: 0, active: 0, archived: 0, species: [] },
    subscriptionSummary: { plan: 'Pro', billingStatus: 'Active', renewalDate: '2027-08-01', featuresUsed: 24, featuresTotal: 35 },
    recentActivity: [
      { id: 'm1', event: '5 health examinations conducted', actor: 'drh. Rini Astuti', timestamp: '1 hour ago', icon: '🏥', color: '#0ea5e9' },
    ],
  },
  {
    id: 'WS-014',
    name: 'Hidayat Berkah Farm',
    slug: 'hidayat-berkah-farm',
    type: 'Peternakan',
    status: 'Active',
    plan: 'Pro',
    ownerId: 'USR-0016',
    ownerName: 'Nur Hidayat',
    ownerEmail: 'nur.hidayat@ternakpro.co.id',
    ownerPhone: '+62 822-5566-7788',
    memberCount: 11,
    members: [
      { userId: 'USR-0016', name: 'Nur Hidayat',     role: 'Owner',  joinedAt: '2024-04-05' },
      { userId: 'USR-0056', name: 'Sari Wahyuningsih', role: 'Admin', joinedAt: '2024-04-10' },
      { userId: 'USR-0057', name: 'Teguh Saputro',    role: 'Member', joinedAt: '2024-05-01' },
    ],
    livestockCount: 187,
    createdAt: '2024-04-05',
    lastActiveAt: '3 hours ago',
    lastActiveDaysAgo: 0,
    marketplaceSummary: { activeListings: 16, completedTransactions: 58, totalRevenueMillion: 472 },
    livestockSummary: { total: 187, active: 172, archived: 15, species: ['Sapi Limosin', 'Sapi Bali', 'Kambing Boer'] },
    subscriptionSummary: { plan: 'Pro', billingStatus: 'Active', renewalDate: '2027-04-05', featuresUsed: 29, featuresTotal: 35 },
    recentActivity: [
      { id: 'n1', event: 'New batch program started', actor: 'Nur Hidayat', timestamp: '3 hours ago', icon: '📋', color: '#3b82f6' },
      { id: 'n2', event: 'Livestock mutation approved', actor: 'Sari Wahyuningsih', timestamp: 'Yesterday', icon: '🔄', color: '#10b981' },
    ],
  },
  {
    id: 'WS-015',
    name: 'Nasution Agro',
    slug: 'nasution-agro',
    type: 'Peternakan',
    status: 'Active',
    plan: 'Pro',
    ownerId: 'USR-0019',
    ownerName: 'Qomariah Nasution',
    ownerEmail: 'qomariah.nasution@gmail.com',
    ownerPhone: '+62 813-4433-2211',
    memberCount: 14,
    members: [
      { userId: 'USR-0019', name: 'Qomariah Nasution', role: 'Owner', joinedAt: '2023-10-08' },
      { userId: 'USR-0058', name: 'Eko Budiyanto',     role: 'Admin', joinedAt: '2023-10-15' },
    ],
    livestockCount: 244,
    createdAt: '2023-10-08',
    lastActiveAt: '5 hours ago',
    lastActiveDaysAgo: 0,
    marketplaceSummary: { activeListings: 21, completedTransactions: 112, totalRevenueMillion: 1_080 },
    livestockSummary: { total: 244, active: 224, archived: 20, species: ['Sapi Brahman', 'Sapi Bali', 'Kambing Boer', 'Domba'] },
    subscriptionSummary: { plan: 'Pro', billingStatus: 'Active', renewalDate: '2026-10-08', featuresUsed: 31, featuresTotal: 35 },
    recentActivity: [
      { id: 'o1', event: 'Pregnancy monitoring updated', actor: 'Qomariah Nasution', timestamp: '5 hours ago', icon: '🧬', color: '#ec4899' },
      { id: 'o2', event: 'Feed stock low alert', actor: 'System', timestamp: '1 day ago', icon: '⚠️', color: '#f59e0b' },
    ],
  },
  {
    id: 'WS-016',
    name: 'Prakoso Group Utama',
    slug: 'prakoso-group-utama',
    type: 'Peternakan',
    status: 'Active',
    plan: 'Enterprise',
    ownerId: 'USR-0022',
    ownerName: 'Teguh Prakoso',
    ownerEmail: 'teguh.prakoso@agrobesar.co.id',
    ownerPhone: '+62 811-3344-5566',
    memberCount: 22,
    members: [
      { userId: 'USR-0022', name: 'Teguh Prakoso',   role: 'Owner',  joinedAt: '2023-07-20' },
      { userId: 'USR-0059', name: 'Dicky Prasetyo',  role: 'Admin',  joinedAt: '2023-07-25' },
      { userId: 'USR-0060', name: 'Mira Hartanti',   role: 'Admin',  joinedAt: '2023-08-01' },
    ],
    livestockCount: 678,
    createdAt: '2023-07-20',
    lastActiveAt: 'Today',
    lastActiveDaysAgo: 0,
    marketplaceSummary: { activeListings: 44, completedTransactions: 318, totalRevenueMillion: 8_640 },
    livestockSummary: { total: 678, active: 622, archived: 56, species: ['Sapi Brahman', 'Sapi Bali', 'Kerbau', 'Kambing Boer', 'Ayam Broiler'] },
    subscriptionSummary: { plan: 'Enterprise', billingStatus: 'Active', renewalDate: '2028-07-20', featuresUsed: 55, featuresTotal: 60 },
    recentActivity: [
      { id: 'p1', event: 'AI insight report generated', actor: 'System', timestamp: 'Today', icon: '🤖', color: '#3b82f6' },
      { id: 'p2', event: 'Livestock export completed', actor: 'Dicky Prasetyo', timestamp: 'Yesterday', icon: '📦', color: '#10b981' },
    ],
  },
  {
    id: 'WS-017',
    name: 'Widi Agro',
    slug: 'widi-agro',
    type: 'Peternakan',
    status: 'Suspended',
    plan: 'Pro',
    ownerId: 'USR-0012',
    ownerName: 'Joko Widiantoro',
    ownerEmail: 'joko.widi77@hotmail.com',
    ownerPhone: '+62 821-7766-5544',
    memberCount: 6,
    members: [
      { userId: 'USR-0012', name: 'Joko Widiantoro', role: 'Owner',  joinedAt: '2023-12-01' },
      { userId: 'USR-0061', name: 'Tono Sumarjo',    role: 'Member', joinedAt: '2024-01-01' },
    ],
    livestockCount: 44,
    createdAt: '2023-12-01',
    lastActiveAt: '3 weeks ago',
    lastActiveDaysAgo: 21,
    marketplaceSummary: { activeListings: 0, completedTransactions: 19, totalRevenueMillion: 112 },
    livestockSummary: { total: 44, active: 40, archived: 4, species: ['Sapi Bali', 'Kambing Kacang'] },
    subscriptionSummary: { plan: 'Pro', billingStatus: 'Expired', renewalDate: '2026-06-27', featuresUsed: 18, featuresTotal: 35 },
    recentActivity: [
      { id: 'q1', event: 'Workspace suspended (spam listings)', actor: 'Platform Admin', timestamp: '3 weeks ago', icon: '🚫', color: '#ef4444' },
    ],
    notes: 'Suspended: spam listings in marketplace — case #MKT-3010.',
  },
  {
    id: 'WS-018',
    name: 'Prakoso Ekspedisi',
    slug: 'prakoso-ekspedisi',
    type: 'Transportasi',
    status: 'Active',
    plan: 'Basic',
    ownerId: 'USR-0022',
    ownerName: 'Teguh Prakoso',
    ownerEmail: 'teguh.prakoso@agrobesar.co.id',
    ownerPhone: '+62 811-3344-5566',
    memberCount: 4,
    members: [
      { userId: 'USR-0022', name: 'Teguh Prakoso', role: 'Owner',  joinedAt: '2024-02-01' },
      { userId: 'USR-0062', name: 'Joko Santoso',  role: 'Member', joinedAt: '2024-02-10' },
    ],
    livestockCount: 0,
    createdAt: '2024-02-01',
    lastActiveAt: '6 hours ago',
    lastActiveDaysAgo: 0,
    marketplaceSummary: { activeListings: 4, completedTransactions: 28, totalRevenueMillion: 96 },
    livestockSummary: { total: 0, active: 0, archived: 0, species: [] },
    subscriptionSummary: { plan: 'Basic', billingStatus: 'Active', renewalDate: '2027-02-01', featuresUsed: 9, featuresTotal: 18 },
    recentActivity: [
      { id: 'r1', event: 'Transport order confirmed', actor: 'Joko Santoso', timestamp: '6 hours ago', icon: '🚛', color: '#f59e0b' },
    ],
  },
  {
    id: 'WS-019',
    name: 'Wahyuni Farm',
    slug: 'wahyuni-farm',
    type: 'Peternakan',
    status: 'Suspended',
    plan: 'Basic',
    ownerId: 'USR-0021',
    ownerName: 'Sri Wahyuni',
    ownerEmail: 'sri.wahyuni.sragen@gmail.com',
    ownerPhone: '+62 816-6655-4433',
    memberCount: 2,
    members: [
      { userId: 'USR-0021', name: 'Sri Wahyuni',   role: 'Owner',  joinedAt: '2024-06-01' },
      { userId: 'USR-0063', name: 'Bejo Suwarto',  role: 'Member', joinedAt: '2024-06-15' },
    ],
    livestockCount: 18,
    createdAt: '2024-06-01',
    lastActiveAt: '1 month ago',
    lastActiveDaysAgo: 30,
    marketplaceSummary: { activeListings: 0, completedTransactions: 3, totalRevenueMillion: 18 },
    livestockSummary: { total: 18, active: 17, archived: 1, species: ['Ayam Kampung'] },
    subscriptionSummary: { plan: 'Basic', billingStatus: 'Expired', renewalDate: '2026-06-01', featuresUsed: 7, featuresTotal: 18 },
    recentActivity: [
      { id: 's1', event: 'Workspace suspended (ToS violation)', actor: 'Platform Admin', timestamp: '1 month ago', icon: '🚫', color: '#ef4444' },
    ],
    notes: 'Suspended: repeated ToS violations (no-show marketplace transactions).',
  },
  {
    id: 'WS-020',
    name: 'Lestari Farm',
    slug: 'lestari-farm',
    type: 'Peternakan',
    status: 'Archived',
    plan: 'Free',
    ownerId: 'USR-0010',
    ownerName: 'Hesti Lestari',
    ownerEmail: 'hesti.lestari@ternakmail.id',
    ownerPhone: '+62 818-4455-6677',
    memberCount: 1,
    members: [
      { userId: 'USR-0010', name: 'Hesti Lestari', role: 'Owner', joinedAt: '2023-11-01' },
    ],
    livestockCount: 0,
    createdAt: '2023-11-01',
    lastActiveAt: '8 months ago',
    lastActiveDaysAgo: 240,
    marketplaceSummary: { activeListings: 0, completedTransactions: 1, totalRevenueMillion: 5 },
    livestockSummary: { total: 5, active: 0, archived: 5, species: ['Kambing Kacang'] },
    subscriptionSummary: { plan: 'Free', billingStatus: 'N/A', renewalDate: '-', featuresUsed: 2, featuresTotal: 8 },
    recentActivity: [
      { id: 't1', event: 'Workspace archived by owner', actor: 'Hesti Lestari', timestamp: '8 months ago', icon: '📦', color: '#64748b' },
    ],
    notes: 'Archived by owner — migrated to new workspace (Lestari Farm Baru).',
  },
];

// ─── Filter helper ────────────────────────────────────────────────────────────

export function filterWorkspaces(
  list: AdminWorkspaceRecord[],
  opts: {
    name?: string;
    wsId?: string;
    owner?: string;
    email?: string;
    status?: WorkspaceStatus | 'All';
    plan?: WorkspacePlanTier | 'All';
    type?: WsType | 'All';
    dateFrom?: string;
    dateTo?: string;
  },
): AdminWorkspaceRecord[] {
  return list.filter((ws) => {
    const nm = opts.name?.toLowerCase();
    if (nm && !ws.name.toLowerCase().includes(nm) && !ws.slug.toLowerCase().includes(nm)) return false;
    if (opts.wsId && !ws.id.toLowerCase().includes(opts.wsId.toLowerCase())) return false;
    if (opts.owner && !ws.ownerName.toLowerCase().includes(opts.owner.toLowerCase())) return false;
    if (opts.email && !ws.ownerEmail.toLowerCase().includes(opts.email.toLowerCase())) return false;
    if (opts.status && opts.status !== 'All' && ws.status !== opts.status) return false;
    if (opts.plan   && opts.plan   !== 'All' && ws.plan   !== opts.plan) return false;
    if (opts.type   && opts.type   !== 'All' && ws.type   !== opts.type) return false;
    if (opts.dateFrom && ws.createdAt < opts.dateFrom) return false;
    if (opts.dateTo   && ws.createdAt > opts.dateTo)   return false;
    return true;
  });
}
