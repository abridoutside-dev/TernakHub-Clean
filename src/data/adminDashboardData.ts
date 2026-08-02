// ─── Admin Dashboard Data — ADM-001 / ADMIN-002 ──────────────────────────────
// ADMIN-002: All fake stats, hardcoded numbers, and dummy data removed.
// Dynamic data is fetched from Supabase in AdminDashboard.tsx.
// This file now holds only: types, static UI config, and navigation shortcuts.

// ─── Types ───────────────────────────────────────────────────────────────────

export type SystemStatus = 'Operational' | 'Degraded' | 'Outage' | 'Maintenance' | 'Unknown';

export interface PlatformStat {
  key: string;
  label: string;
  icon: string;
  color: string;
  /** Supabase table to COUNT — empty string means metric is not yet supported. */
  table: string;
}

export interface QuickAction {
  key: string;
  label: string;
  icon: string;
  description: string;
}

// ─── Static UI config ────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<SystemStatus, { color: string; bg: string; dot: string; label: string }> = {
  Operational:  { color: '#059669', bg: '#d1fae5', dot: '#10b981', label: 'Normal'              },
  Degraded:     { color: '#b45309', bg: '#fef3c7', dot: '#f59e0b', label: 'Terdegradasi'        },
  Outage:       { color: '#b91c1c', bg: '#fee2e2', dot: '#ef4444', label: 'Gangguan'            },
  Maintenance:  { color: '#4b5563', bg: '#f3f4f6', dot: '#9ca3af', label: 'Pemeliharaan'        },
  Unknown:      { color: '#94a3b8', bg: '#f8fafc', dot: '#cbd5e1', label: 'Belum dikonfigurasi' },
};

// ─── Platform stat definitions ───────────────────────────────────────────────
// Each entry maps to a Supabase table that will be COUNT-queried at runtime.
// If the table does not yet exist, the count defaults to 0.

export const PLATFORM_STAT_DEFS: PlatformStat[] = [
  { key: 'users',         label: 'Total Pengguna',           icon: '👤', color: '#3b82f6', table: 'profiles'            },
  { key: 'workspaces',    label: 'Total Workspace',          icon: '🏢', color: '#8b5cf6', table: 'workspaces'          },
  { key: 'livestock',     label: 'Total Ternak',             icon: '🐄', color: '#10b981', table: 'livestock'           },
  { key: 'listings',      label: 'Listing Marketplace',      icon: '🛒', color: '#f59e0b', table: 'marketplace_listings'},
  { key: 'transactions',  label: 'Total Transaksi',          icon: '💳', color: '#ef4444', table: 'transactions'        },
  { key: 'subscriptions', label: 'Langganan Aktif',          icon: '⭐', color: '#f97316', table: 'subscriptions'       },
  { key: 'reports',       label: 'Total Laporan',            icon: '🚩', color: '#dc2626', table: 'reports'             },
  { key: 'verifications', label: 'Verifikasi Menunggu',      icon: '✅', color: '#0891b2', table: 'trust_verifications' },
];

// ─── Quick Actions — navigation only, no badges ───────────────────────────────

export const QUICK_ACTIONS: QuickAction[] = [
  { key: 'users',        label: 'Pengguna',       icon: '👤', description: 'Kelola pengguna platform'        },
  { key: 'workspaces',   label: 'Workspace',      icon: '🏢', description: 'Kelola workspace'                },
  { key: 'marketplace',  label: 'Marketplace',    icon: '🛒', description: 'Listing & transaksi'             },
  { key: 'livestock',    label: 'Ternak',          icon: '🐄', description: 'Pengawasan registri ternak'     },
  { key: 'feed',         label: 'Pakan',           icon: '🌾', description: 'Data master pakan & nutrisi'   },
  { key: 'medicine',     label: 'Obat',            icon: '💊', description: 'Katalog obat & kesehatan'      },
  { key: 'subscription', label: 'Langganan',       icon: '⭐', description: 'Paket, tagihan & fitur'        },
  { key: 'announcement', label: 'Pengumuman',      icon: '📢', description: 'Terbitkan notifikasi platform' },
  { key: 'monitoring',   label: 'Monitoring',      icon: '📊', description: 'Metrik & notifikasi sistem'    },
  { key: 'reports',      label: 'Laporan',         icon: '🚩', description: 'Laporan yang dikirim pengguna' },
];
