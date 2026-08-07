// ─── Profile Module — Data Foundation ─────────────────────────────────────────
// PROFILE-001 — Profile Foundation
// Mengikuti docs/architecture/PROFILE_MODULE_CONSTITUTION.md
//
// Profile = Control Center bagi identitas pengguna TernakHub.
// BUKAN Dashboard, BUKAN Marketplace, BUKAN Livestock.
//
// Data di sini hanya mencakup identitas pengguna dan preferensi.
// Business Insight dibaca live dari modul lain — tidak disimpan di sini.
// Audit Trail disediakan untuk perubahan data sensitif.

import { getActiveWorkspace, WORKSPACES } from '../components/TopAppBar';
import { generateUUID } from '../utils/uuid';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MembershipTier = 'FREE' | 'PRO' | 'ENTERPRISE';
export type AkunStatus    = 'Aktif' | 'Nonaktif' | 'Ditangguhkan';
export type VerifikasiStatus = 'Terverifikasi' | 'Belum Terverifikasi';

export interface UserProfile {
  id: string;
  foto: string;                  // emoji avatar (placeholder sebelum upload real)
  nama: string;
  username: string;
  email: string;
  nomorHP: string;
  statusVerifikasi: VerifikasiStatus;
  membership: MembershipTier;
  statusAkun: AkunStatus;
  bergabungSejak: string;        // ISO date yyyy-mm-dd
}

// ─── Seed Data ─────────────────────────────────────────────────────────────────
// Placeholder — akan digantikan auth layer pada fase berikutnya.

let USER_PROFILE: UserProfile = {
  id:                'usr-berkah-001',
  foto:              '👨‍🌾',
  nama:              'Budi Santoso',
  username:          '@budi.berkah',
  email:             'budi.santoso@berkahfarm.id',
  nomorHP:           '+62 812-3456-7890',
  statusVerifikasi:  'Terverifikasi',
  membership:        'PRO',
  statusAkun:        'Aktif',
  bergabungSejak:    '2024-03-15',
};

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface ProfileAuditEntry {
  id: string;
  aksi: string;
  field?: string;
  timestamp: string;
}

const PROFILE_AUDIT_LOG: ProfileAuditEntry[] = [];

function logProfileAudit(aksi: string, field?: string) {
  PROFILE_AUDIT_LOG.push({ id: generateUUID(), aksi, field, timestamp: new Date().toISOString() });
}

export function getProfileAuditLog(): ProfileAuditEntry[] {
  return [...PROFILE_AUDIT_LOG];
}

// ─── Queries ───────────────────────────────────────────────────────────────────

export function getUserProfile(): UserProfile {
  return USER_PROFILE;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Perbarui data akun pengguna (foto, nama, username, nomorHP).
 *  Email tidak dapat diubah melalui fungsi ini — memerlukan konfirmasi keamanan. */
export function updateUserProfile(
  patch: Partial<Pick<UserProfile, 'foto' | 'nama' | 'username' | 'nomorHP'>>
): void {
  const fields = Object.keys(patch) as (keyof typeof patch)[];
  fields.forEach((f) => {
    if (patch[f] !== undefined) {
      logProfileAudit(`Perubahan ${f}`, f);
    }
  });
  USER_PROFILE = { ...USER_PROFILE, ...patch };
}

/** Jumlah Workspace yang terdaftar di registry Global Header (read-only). */
export function getTotalWorkspace(): number {
  return WORKSPACES.length;
}

/** Workspace yang sedang aktif — hanya untuk tampilan info, bukan switcher. */
export function getActiveWorkspaceInfo() {
  return getActiveWorkspace();
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const APP_VERSION = '1.0.0-dev';

export const MEMBERSHIP_CONFIG: Record<
  MembershipTier,
  { label: string; color: string; bg: string; border: string }
> = {
  FREE:       { label: 'FREE',       color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
  PRO:        { label: 'PRO',        color: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
  ENTERPRISE: { label: 'ENTERPRISE', color: '#6d28d9', bg: '#ede9fe', border: '#c4b5fd' },
};

export const STATUS_AKUN_CONFIG: Record<
  AkunStatus,
  { icon: string; color: string }
> = {
  Aktif:        { icon: '✅', color: 'var(--color-primary)' },
  Nonaktif:     { icon: '⚪', color: 'var(--color-muted)'   },
  Ditangguhkan: { icon: '🚫', color: '#dc2626'              },
};

// ─── Main Menu Definition ──────────────────────────────────────────────────────
// Urutan sesuai Constitution: Account → Workspace → Business Insight →
// Subscription → Security → Notification → About TernakHub → Support.

export interface ProfileMenuItem {
  id: string;
  icon: string;
  label: string;
  subtitle: string;
  route: string;
  badge?: string;
}

export const PROFILE_MENU: ProfileMenuItem[] = [
  {
    id:       'account',
    icon:     '👤',
    label:    'Account',
    subtitle: 'Foto, nama, email, nomor HP',
    route:    '/profile/account',
  },
  {
    id:       'workspace',
    icon:     '🏢',
    label:    'Workspace',
    subtitle: 'Kelola workspace Anda',
    route:    '/profile/workspace',
  },
  {
    id:       'business-insight',
    icon:     '📊',
    label:    'Business Insight',
    subtitle: 'Nilai aset, pendapatan & laporan',
    route:    '/profile/business-insight',
  },
  {
    id:       'security',
    icon:     '🔒',
    label:    'Security',
    subtitle: 'Password, session, device, 2FA',
    route:    '/profile/security',
  },
  {
    id:       'notification',
    icon:     '🔔',
    label:    'Notification',
    subtitle: 'Push, email, WhatsApp',
    route:    '/profile/notification',
  },
  {
    id:       'about',
    icon:     'ℹ️',
    label:    'About TernakHub',
    subtitle: 'Filosofi, roadmap, kebijakan',
    route:    '/profile/about',
  },
  {
    id:       'support',
    icon:     '🆘',
    label:    'Support',
    subtitle: 'Help center, FAQ, feedback',
    route:    '/profile/support',
  },
];
