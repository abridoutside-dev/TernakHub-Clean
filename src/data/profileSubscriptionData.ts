// ─── PROFILE-009 — Subscription Data ─────────────────────────────────────────
// Mengacu pada: docs/architecture/PROFILE_MODULE_CONSTITUTION.md
//
// Aturan utama:
//  - Belum ada Payment Gateway, Wallet, atau pembayaran otomatis.
//  - Upgrade/Downgrade hanya menyiapkan struktur — belum proses pembayaran.
//  - Riwayat (Upgrade/Downgrade/Perpanjangan) bersifat permanen.

import { generateUUID } from '../utils/uuid';
import { type MembershipTier } from './profileData';

// ─── Tipe ─────────────────────────────────────────────────────────────────────

export type SubscriptionStatus = 'Aktif' | 'Kadaluarsa' | 'Pending' | 'Dibatalkan';

export type SubscriptionAksi = 'Aktivasi' | 'Upgrade' | 'Downgrade' | 'Perpanjangan';

export interface SubscriptionBenefit {
  label: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

export interface SubscriptionPlan {
  tier: MembershipTier;
  label: string;
  description: string;
  harga: string;
  highlight: boolean;
  color: string;
  bg: string;
  border: string;
}

export interface SubscriptionHistoryEntry {
  id: string;
  aksi: SubscriptionAksi;
  dari: MembershipTier | null;
  ke: MembershipTier;
  tanggal: string;
  catatan: string | null;
}

export interface SubscriptionRecord {
  userId: string;
  tier: MembershipTier;
  status: SubscriptionStatus;
  tanggalAktivasi: string;
  tanggalBerakhir: string | null;
  riwayat: SubscriptionHistoryEntry[];
}

// ─── Plan Config ──────────────────────────────────────────────────────────────

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier:        'FREE',
    label:       'Free',
    description: 'Untuk peternak pemula yang baru memulai.',
    harga:       'Gratis selamanya',
    highlight:   false,
    color:       '#6b7280',
    bg:          '#f3f4f6',
    border:      '#d1d5db',
  },
  {
    tier:        'PRO',
    label:       'Pro',
    description: 'Untuk peternak aktif yang butuh fitur lengkap.',
    harga:       'Rp 99.000 / bulan',
    highlight:   true,
    color:       '#b45309',
    bg:          '#fef3c7',
    border:      '#fcd34d',
  },
  {
    tier:        'ENTERPRISE',
    label:       'Enterprise',
    description: 'Untuk usaha peternakan skala besar & tim.',
    harga:       'Hubungi kami',
    highlight:   false,
    color:       '#6d28d9',
    bg:          '#ede9fe',
    border:      '#c4b5fd',
  },
];

// ─── Benefit Matrix ───────────────────────────────────────────────────────────

export const SUBSCRIPTION_BENEFITS: SubscriptionBenefit[] = [
  { label: 'Jumlah Ternak',          free: '25 ekor',    pro: '500 ekor',    enterprise: 'Tak terbatas' },
  { label: 'Workspace',              free: '1',           pro: '5',           enterprise: 'Tak terbatas' },
  { label: 'Anggota per Workspace',  free: '2',           pro: '10',          enterprise: 'Tak terbatas' },
  { label: 'Listing Marketplace',    free: '5',           pro: '100',         enterprise: 'Tak terbatas' },
  { label: 'Stok Pakan & Obat',      free: true,          pro: true,          enterprise: true           },
  { label: 'Batch & Catatan Bobot',  free: true,          pro: true,          enterprise: true           },
  { label: 'Business Insight',       free: 'Dasar',       pro: 'Lengkap',     enterprise: 'Lengkap + API'},
  { label: 'Laporan & Export',       free: false,         pro: true,          enterprise: true           },
  { label: 'Produk Komersial',       free: 'Baca saja',   pro: true,          enterprise: true           },
  { label: 'Fitur AI Insight',       free: false,         pro: true,          enterprise: true           },
  { label: 'Transaction Conversation',free: true,         pro: true,          enterprise: true           },
  { label: 'Escrow & Transport',     free: false,         pro: true,          enterprise: true           },
  { label: 'News & Event Submission',free: '2/bulan',     pro: '20/bulan',    enterprise: 'Tak terbatas' },
  { label: 'Priority Support',       free: false,         pro: true,          enterprise: 'Dedicated'    },
  { label: 'Custom Branding',        free: false,         pro: false,         enterprise: true           },
  { label: 'Integrasi API',          free: false,         pro: false,         enterprise: true           },
];

// ─── Status Config ────────────────────────────────────────────────────────────

export const SUBSCRIPTION_STATUS_CONFIG: Record<
  SubscriptionStatus,
  { icon: string; color: string; bg: string; label: string }
> = {
  Aktif:      { icon: '✅', color: '#1b7a43', bg: '#e8f5ee', label: 'Aktif'      },
  Kadaluarsa: { icon: '⏰', color: '#c62828', bg: '#ffebee', label: 'Kadaluarsa' },
  Pending:    { icon: '⏳', color: '#7b5e2a', bg: '#fff8e1', label: 'Menunggu'   },
  Dibatalkan: { icon: '❌', color: '#6b7280', bg: '#f3f4f6', label: 'Dibatalkan' },
};

export const SUBSCRIPTION_AKSI_CONFIG: Record<
  SubscriptionAksi,
  { icon: string; color: string; label: string }
> = {
  Aktivasi:    { icon: '🎉', color: '#1b7a43', label: 'Aktivasi'    },
  Upgrade:     { icon: '⬆️', color: '#b45309', label: 'Upgrade'     },
  Downgrade:   { icon: '⬇️', color: '#6b7280', label: 'Downgrade'   },
  Perpanjangan:{ icon: '🔄', color: '#1565c0', label: 'Perpanjangan' },
};

// ─── In-memory Store ──────────────────────────────────────────────────────────

let SUBSCRIPTION: SubscriptionRecord | null = null;

function seedIfNeeded(): void {
  if (SUBSCRIPTION) return;

  SUBSCRIPTION = {
    userId:          'usr-berkah-001',
    tier:            'PRO',
    status:          'Aktif',
    tanggalAktivasi: '2025-09-01',
    tanggalBerakhir: '2026-09-01',
    riwayat: [
      {
        id:      generateUUID(),
        aksi:    'Aktivasi',
        dari:    null,
        ke:      'FREE',
        tanggal: '2024-03-15',
        catatan: 'Akun baru dibuat.',
      },
      {
        id:      generateUUID(),
        aksi:    'Upgrade',
        dari:    'FREE',
        ke:      'PRO',
        tanggal: '2024-06-10',
        catatan: 'Upgrade ke Pro untuk fitur Marketplace lebih luas.',
      },
      {
        id:      generateUUID(),
        aksi:    'Perpanjangan',
        dari:    'PRO',
        ke:      'PRO',
        tanggal: '2025-06-10',
        catatan: 'Perpanjangan tahunan.',
      },
      {
        id:      generateUUID(),
        aksi:    'Perpanjangan',
        dari:    'PRO',
        ke:      'PRO',
        tanggal: '2025-09-01',
        catatan: 'Perpanjangan — paket tahunan Pro.',
      },
    ],
  };
}

// ─── Query ────────────────────────────────────────────────────────────────────

export function getSubscription(): SubscriptionRecord {
  seedIfNeeded();
  return SUBSCRIPTION!;
}

export function getSubscriptionHistory(): SubscriptionHistoryEntry[] {
  seedIfNeeded();
  return [...(SUBSCRIPTION?.riwayat ?? [])].reverse();
}

// ─── Mutation ─────────────────────────────────────────────────────────────────

/**
 * Catat permintaan Upgrade/Downgrade — belum ada proses pembayaran.
 * Ini hanya menyimpan intent ke riwayat sebagai Pending.
 */
export function requestPlanChange(
  ke: MembershipTier,
  catatan?: string,
): void {
  seedIfNeeded();
  if (!SUBSCRIPTION) return;

  const dari = SUBSCRIPTION.tier;
  const aksi: SubscriptionAksi = (() => {
    const tiers: MembershipTier[] = ['FREE', 'PRO', 'ENTERPRISE'];
    const fromIdx = tiers.indexOf(dari);
    const toIdx   = tiers.indexOf(ke);
    if (toIdx > fromIdx) return 'Upgrade';
    if (toIdx < fromIdx) return 'Downgrade';
    return 'Perpanjangan';
  })();

  SUBSCRIPTION.riwayat.push({
    id:      generateUUID(),
    aksi,
    dari,
    ke,
    tanggal: new Date().toISOString().slice(0, 10),
    catatan: catatan ?? null,
  });

  // Langsung update tier (simulasi — tanpa pembayaran)
  SUBSCRIPTION.tier   = ke;
  SUBSCRIPTION.status = 'Aktif';
}
