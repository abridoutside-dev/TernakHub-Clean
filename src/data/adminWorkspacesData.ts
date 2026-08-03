// ─── Admin Workspace Management Data — ADM-004 ───────────────────────────────
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ⚠️  LEGACY — P0-001B                                                   ║
// ║  File ini dipertahankan hanya untuk UI config maps (WS_STATUS_CONFIG,   ║
// ║  WS_PLAN_CONFIG, WS_TYPE_CONFIG) dan tipe-tipe AdminWorkspaceRecord.    ║
// ║  Semua data workspace nyata diambil langsung dari Supabase.             ║
// ║  Tidak ada dummy records di file ini.                                    ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkspaceStatus   = 'Active' | 'Suspended' | 'Archived';
export type WorkspacePlanTier = 'Free' | 'Basic' | 'Pro' | 'Enterprise';

/** Matches workspace_type enum in Supabase DB. */
export type WsType =
  | 'Farm'
  | 'FeedStore'
  | 'VeterinaryClinic'
  | 'VeterinaryDoctor'
  | 'Transport'
  | 'Marketplace';

export type WsMemberRole = 'Owner' | 'Admin' | 'Member' | 'Viewer';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface WsMemberSummary {
  userId: string;
  name: string;
  role: WsMemberRole;
  joinedAt: string;
}

export interface WsMarketplaceSummary {
  activeListings: number;
  completedTransactions: number;
  totalRevenueMillion: number;
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
  id: string;
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
  createdAt: string;
  lastActiveAt: string;
  lastActiveDaysAgo: number;
  marketplaceSummary: WsMarketplaceSummary;
  livestockSummary: WsLivestockSummary;
  subscriptionSummary: WsSubscriptionSummary;
  recentActivity: WsActivityItem[];
  notes?: string;
}

// ─── Config maps ─────────────────────────────────────────────────────────────

export const WS_STATUS_CONFIG: Record<WorkspaceStatus, { label: string; color: string; bg: string; dot: string }> = {
  Active:    { label: 'Aktif',        color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  Suspended: { label: 'Ditangguhkan', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  Archived:  { label: 'Diarsipkan',   color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
};

export const WS_PLAN_CONFIG: Record<WorkspacePlanTier, { color: string; bg: string }> = {
  Free:       { color: '#64748b', bg: '#f1f5f9' },
  Basic:      { color: '#0369a1', bg: '#e0f2fe' },
  Pro:        { color: '#7c3aed', bg: '#ede9fe' },
  Enterprise: { color: '#b45309', bg: '#fef3c7' },
};

/** Keys match workspace_type enum in Supabase DB. */
export const WS_TYPE_CONFIG: Record<WsType, { icon: string; color: string; bg: string; label: string }> = {
  'Farm':             { icon: '🐄', color: '#059669', bg: '#d1fae5', label: 'Peternakan' },
  'FeedStore':        { icon: '🌾', color: '#d97706', bg: '#fef3c7', label: 'Toko Pakan' },
  'VeterinaryClinic': { icon: '🏥', color: '#0ea5e9', bg: '#e0f2fe', label: 'Klinik Hewan' },
  'VeterinaryDoctor': { icon: '👨‍⚕️', color: '#8b5cf6', bg: '#ede9fe', label: 'Dokter Hewan' },
  'Transport':        { icon: '🚛', color: '#f59e0b', bg: '#fef3c7', label: 'Transportasi' },
  'Marketplace':      { icon: '🛒', color: '#ec4899', bg: '#fce7f3', label: 'Marketplace' },
};
