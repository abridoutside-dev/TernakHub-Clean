// ─── Admin User Management Data — ADM-003 ────────────────────────────────────
// Types, status configs, and filter helpers only.
// User records are sourced exclusively from Supabase `profiles` table.
// No dummy data, no hardcoded records.

export type UserStatus = 'Active' | 'Suspended' | 'Pending';
export type VerificationStatus = 'Verified' | 'Unverified';
export type SubscriptionPlan = 'Free' | 'Basic' | 'Pro' | 'Enterprise';
export type WorkspaceRole = 'Owner' | 'Admin' | 'Member';
export type WorkspaceType = 'Peternakan' | 'Klinik Hewan' | 'Dokter Hewan' | 'Transportasi';

export interface WorkspaceSummaryItem {
  id: string;
  name: string;
  type: WorkspaceType;
  plan: SubscriptionPlan;
  memberCount: number;
  role: WorkspaceRole;
}

export interface UserActivitySummary {
  totalLogins: number;
  avgSessionMinutes: number;
  mostActiveModule: string;
  lastLoginAt: string;
}

export interface UserVerificationDetail {
  ktpSubmitted: boolean;
  selfieSubmitted: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface AdminUserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarInitials: string;
  avatarColor: string;
  status: UserStatus;
  isAdmin: boolean;
  totalWorkspaces: number;
  workspaces: WorkspaceSummaryItem[];
  registeredAt: string;   // human-readable
  lastActiveAt: string;   // human-readable
  lastActiveDaysAgo: number;
  notes?: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

export const USER_STATUS_CONFIG: Record<UserStatus, { label: string; color: string; bg: string; dot: string }> = {
  Active:    { label: 'Aktif',     color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  Suspended: { label: 'Suspended', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  Pending:   { label: 'Menunggu',  color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
};

// ─── Filter helpers ───────────────────────────────────────────────────────────

export function filterUsers(
  users: AdminUserRecord[],
  opts: {
    keyword?: string;
    email?: string;
    phone?: string;
    userId?: string;
    status?: UserStatus | 'All';
    dateFrom?: string;
    dateTo?: string;
  },
): AdminUserRecord[] {
  return users.filter((u) => {
    const kw = opts.keyword?.toLowerCase();
    if (kw && !u.fullName.toLowerCase().includes(kw) && !u.email.toLowerCase().includes(kw) && !u.id.toLowerCase().includes(kw)) return false;
    if (opts.email && !u.email.toLowerCase().includes(opts.email.toLowerCase())) return false;
    if (opts.phone && !u.phone.includes(opts.phone)) return false;
    if (opts.userId && !u.id.toLowerCase().includes(opts.userId.toLowerCase())) return false;
    if (opts.status && opts.status !== 'All' && u.status !== opts.status) return false;
    if (opts.dateFrom && u.registeredAt < opts.dateFrom) return false;
    if (opts.dateTo && u.registeredAt > opts.dateTo) return false;
    return true;
  });
}
