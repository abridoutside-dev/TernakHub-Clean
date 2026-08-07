// ─── Admin User Management Data — ADM-003 ────────────────────────────────────
// Types, status configs, and filter helpers only.
// User records are sourced exclusively from Supabase `user_profiles` table.
// No dummy data, no hardcoded records.

export type UserStatus = 'Active' | 'Suspended' | 'Pending';

export interface AdminUserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarInitials: string;
  avatarColor: string;
  status: UserStatus;
  isAdmin: boolean;
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
