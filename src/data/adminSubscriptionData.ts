// ─── Admin Subscription Data — ADM-003B ──────────────────────────────────────
// UI config constants and DB-aligned types only.
// All actual subscription data is queried from Supabase workspace_subscriptions.

export type SubscriptionPlan = 'Free' | 'Pro' | 'Enterprise';

/** Matches subscription_status enum in Supabase DB (Indonesian). */
export type SubscriptionStatusDB = 'Aktif' | 'Trial' | 'Kadaluarsa' | 'Dibatalkan' | 'Ditangguhkan';

export type BillingCycle = 'Monthly' | 'Annual' | 'N/A';

export interface BillingHistoryItem {
  date: string;
  amount: number;
  description: string;
  status: 'Paid' | 'Failed' | 'Refunded';
}

// ─── Config maps ─────────────────────────────────────────────────────────────

export const PLAN_CONFIG: Record<SubscriptionPlan, { color: string; bg: string; border: string }> = {
  Free:       { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
  Pro:        { color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
  Enterprise: { color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
};

/** DB-aligned subscription status display config. */
export const SUB_STATUS_DB_CONFIG: Record<SubscriptionStatusDB, { label: string; color: string; bg: string; dot: string }> = {
  'Aktif':        { label: 'Aktif',        color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  'Trial':        { label: 'Trial',        color: '#0369a1', bg: '#e0f2fe', dot: '#0ea5e9' },
  'Kadaluarsa':   { label: 'Kadaluarsa',   color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  'Dibatalkan':   { label: 'Dibatalkan',   color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
  'Ditangguhkan': { label: 'Ditangguhkan', color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
};
