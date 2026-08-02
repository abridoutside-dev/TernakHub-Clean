// ─── Master Escrow — APP-CHAIN-001.3 ──────────────────────────────────────────
// Single Source of Truth for all Escrow Providers on the platform.
//
// ARCHITECTURE RULES:
//  - This file is the canonical SSOT. All escrow provider data flows FROM here.
//  - escrowDirectoryData.ts reads from this file (public page).
//  - escrowWorkflowData.ts reads fee config from this file (Transaction Room).
//  - No escrow data is hardcoded in any other module.
//  - Contacts and bank accounts are 1-to-many per provider.
//  - Soft delete: status === 'Deleted' — never physically removed.
//  - Fees: percentage stored as decimal rate (e.g. 0.025 = 2.5%).
//    The FeeConfig.percentage field uses the rate directly.

import { generateUUID } from '../utils/uuid';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EscrowContactType = 'WhatsApp' | 'Phone' | 'Email' | 'Telegram' | 'Other';
export type EscrowAccountType = 'Transfer' | 'Virtual Account' | 'QRIS' | 'Other';
export type EscrowFeeType = 'Percentage' | 'Fixed';
export type EscrowFeePaidBy = 'Buyer' | 'Seller' | 'Split' | 'Negotiated';
export type MasterEscrowStatus = 'Active' | 'Inactive' | 'Maintenance' | 'Deleted';

// ─── Contact (1 : M per provider) ────────────────────────────────────────────

export interface EscrowContact {
  uuid: string;
  escrowId: string;
  contactType: EscrowContactType;
  /** Display label, e.g. "CS WhatsApp", "Email Pengaduan" */
  label: string;
  /** The actual contact value, e.g. "+62812…" or "cs@example.com" */
  value: string;
  primary: boolean;
  active: boolean;
  displayOrder: number;
}

// ─── Bank Account (1 : M per provider) ───────────────────────────────────────

export interface EscrowBankAccount {
  uuid: string;
  escrowId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  accountType: EscrowAccountType;
  primary: boolean;
  active: boolean;
  displayOrder: number;
}

// ─── Fee Configuration ────────────────────────────────────────────────────────

export interface EscrowFeeConfig {
  feeType: EscrowFeeType;
  /** Rate as decimal: 0.025 = 2.5%. Ignored when feeType === 'Fixed'. */
  percentage: number;
  minimumFee: number;   // IDR
  maximumFee: number;   // IDR
  feePaidBy: EscrowFeePaidBy;
}

// ─── Service Settings ─────────────────────────────────────────────────────────

export interface EscrowServiceSettings {
  /** e.g. "Seluruh Indonesia" — null → "Belum dikonfigurasi" */
  coverageArea: string | null;
  /** Slugs from KATEGORI_MARKETPLACE — empty array = all categories */
  supportedCategories: string[];
  /** e.g. "08.00–17.00 WIB" — null → "Belum dikonfigurasi" */
  businessHours: string | null;
  /** e.g. "Senin – Jumat" — null → "Belum dikonfigurasi" */
  businessDays: string | null;
  /** e.g. "Aktif", "Tutup Sementara" — null → "Belum dikonfigurasi" */
  operationalStatus: string | null;
}

// ─── Dispute Settings ─────────────────────────────────────────────────────────

export interface EscrowDisputeSettings {
  /** Normal resolution SLA in days */
  normalSLA: number;
  /** Hard maximum SLA in days */
  maximumSLA: number;
  /** null → "Belum dikonfigurasi" */
  evidenceRequirements: string | null;
  /** null → "Belum dikonfigurasi" */
  settlementRules: string | null;
  /** null → not shown */
  notes: string | null;
}

// ─── Master Escrow Provider ───────────────────────────────────────────────────

export interface MasterEscrowProvider {
  uuid: string;
  /** Legal/display full name */
  fullName: string;
  /** Emoji or image URL — null → default 🛡️ */
  photo: string | null;
  /** Banner image URL — null → not shown */
  banner: string | null;
  /** Short description shown on public listing cards — null → "Belum dikonfigurasi" */
  shortDescription: string | null;
  /** Full about text shown on profile page — null → "Belum dikonfigurasi" */
  about: string | null;
  /** Show official badge (✓ Resmi) on cards and profile */
  officialBadge: boolean;
  status: MasterEscrowStatus;
  /** Sort order for public listing */
  displayOrder: number;
  /** Show this provider on the public Escrow page */
  showOnPublicPage: boolean;
  /** Allow selection of this provider in Transaction Room */
  showInTransactionRoom: boolean;
  createdAt: string;
  updatedAt: string;
  feeConfig: EscrowFeeConfig;
  serviceSettings: EscrowServiceSettings;
  disputeSettings: EscrowDisputeSettings;
}

// ─── In-Memory Stores ─────────────────────────────────────────────────────────

const MASTER_ESCROW_DB: MasterEscrowProvider[] = [];
const ESCROW_CONTACTS_DB: EscrowContact[] = [];
const ESCROW_BANK_ACCOUNTS_DB: EscrowBankAccount[] = [];

// ─── Seed ─────────────────────────────────────────────────────────────────────

(function seed() {
  const now = new Date().toISOString();

  // ── TernakHub Escrow (primary platform provider) ──
  const providerId = 'me-ternakhub-001';

  MASTER_ESCROW_DB.push({
    uuid:               providerId,
    fullName:           'TernakHub Escrow',
    photo:              '🛡️',
    banner:             null,
    shortDescription:
      'Rekening Bersama resmi TernakHub untuk perlindungan transaksi Buyer & Seller.',
    about:
      'TernakHub Escrow adalah layanan Rekening Bersama (Rekber) resmi yang dioperasikan oleh ' +
      'platform TernakHub. Dana Buyer ditahan secara aman oleh Escrow Officer yang terverifikasi ' +
      'hingga Buyer mengkonfirmasi penerimaan barang atau jasa yang diperjanjikan. ' +
      'Berlaku untuk semua kategori transaksi di Marketplace TernakHub: ternak, pakan, obat, ' +
      'transportasi, dokter hewan, dan klinik hewan.',
    officialBadge:         true,
    status:                'Active',
    displayOrder:          1,
    showOnPublicPage:      true,
    showInTransactionRoom: true,
    createdAt: now,
    updatedAt: now,
    feeConfig: {
      feeType:    'Percentage',
      percentage: 0.025,   // 2.5%
      minimumFee: 25_000,
      maximumFee: 2_500_000,
      feePaidBy:  'Buyer',
    },
    serviceSettings: {
      coverageArea:      'Seluruh Indonesia',
      supportedCategories: [],  // empty = all categories
      businessHours:     null,
      businessDays:      null,
      operationalStatus: 'Aktif',
    },
    disputeSettings: {
      normalSLA:  7,
      maximumSLA: 30,
      evidenceRequirements:
        'Bukti transfer (screenshot/struk), bukti pengiriman (foto/resi), dan ' +
        'riwayat komunikasi antara Buyer dan Seller di Transaction Room.',
      settlementRules:
        'Escrow Officer menentukan arah pelepasan atau pengembalian dana ' +
        'berdasarkan bukti dan riwayat komunikasi yang diajukan oleh kedua pihak. ' +
        'Keputusan Officer bersifat final.',
      notes: null,
    },
  });

  // ── Contacts for TernakHub Escrow ──
  ESCROW_CONTACTS_DB.push(
    {
      uuid:         'esc-contact-001',
      escrowId:     providerId,
      contactType:  'WhatsApp',
      label:        'CS WhatsApp',
      value:        'Belum dikonfigurasi',
      primary:      true,
      active:       false,
      displayOrder: 1,
    },
    {
      uuid:         'esc-contact-002',
      escrowId:     providerId,
      contactType:  'Email',
      label:        'Email Pengaduan',
      value:        'Belum dikonfigurasi',
      primary:      false,
      active:       false,
      displayOrder: 2,
    },
    {
      uuid:         'esc-contact-003',
      escrowId:     providerId,
      contactType:  'Telegram',
      label:        'Telegram Channel',
      value:        'Belum dikonfigurasi',
      primary:      false,
      active:       false,
      displayOrder: 3,
    },
  );

  // ── Bank Accounts for TernakHub Escrow ──
  ESCROW_BANK_ACCOUNTS_DB.push(
    {
      uuid:           'esc-bank-001',
      escrowId:       providerId,
      bankName:       'BCA',
      accountNumber:  '1234567890',
      accountHolder:  'TernakHub Rekening Bersama',
      accountType:    'Transfer',
      primary:        true,
      active:         true,
      displayOrder:   1,
    },
    {
      uuid:           'esc-bank-002',
      escrowId:       providerId,
      bankName:       'BRI',
      accountNumber:  '0987654321',
      accountHolder:  'TernakHub Rekening Bersama',
      accountType:    'Transfer',
      primary:        false,
      active:         true,
      displayOrder:   2,
    },
    {
      uuid:           'esc-bank-003',
      escrowId:       providerId,
      bankName:       'Mandiri',
      accountNumber:  '1122334455',
      accountHolder:  'TernakHub Rekening Bersama',
      accountType:    'Transfer',
      primary:        false,
      active:         true,
      displayOrder:   3,
    },
  );
})();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now(): string { return new Date().toISOString(); }

/** Format percentage rate (0.025) → "2.5%" */
export function formatFeePercent(rate: number): string {
  const pct = rate * 100;
  return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1).replace('.', ',')}%`;
}

/** Format IDR amount */
export function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/** Compute escrow fee from the given fee config */
export function computeEscrowFee(dealTotal: number, cfg: EscrowFeeConfig): number {
  if (cfg.feeType === 'Fixed') return cfg.minimumFee;
  const raw = Math.round(dealTotal * cfg.percentage);
  return Math.min(cfg.maximumFee, Math.max(cfg.minimumFee, raw));
}

// ─── Getters ──────────────────────────────────────────────────────────────────

/** All non-deleted providers, sorted by displayOrder */
export function getMasterEscrowList(): MasterEscrowProvider[] {
  return MASTER_ESCROW_DB
    .filter(p => p.status !== 'Deleted')
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/** All providers including Deleted — for admin list */
export function getAllMasterEscrowList(): MasterEscrowProvider[] {
  return [...MASTER_ESCROW_DB].sort((a, b) => a.displayOrder - b.displayOrder);
}

/** Single provider by UUID */
export function getMasterEscrowById(uuid: string): MasterEscrowProvider | undefined {
  return MASTER_ESCROW_DB.find(p => p.uuid === uuid);
}

/** Active providers that should appear on the public Escrow page */
export function getActivePublicEscrowProviders(): MasterEscrowProvider[] {
  return MASTER_ESCROW_DB
    .filter(p => p.status === 'Active' && p.showOnPublicPage)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/** Active providers available for selection in Transaction Room */
export function getActiveTransactionRoomEscrowProviders(): MasterEscrowProvider[] {
  return MASTER_ESCROW_DB
    .filter(p => p.status === 'Active' && p.showInTransactionRoom)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/** First active Transaction Room provider — used for fee calculation */
export function getPrimaryActiveEscrowProvider(): MasterEscrowProvider | undefined {
  return getActiveTransactionRoomEscrowProviders()[0];
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export function getEscrowContacts(escrowId: string): EscrowContact[] {
  return ESCROW_CONTACTS_DB
    .filter(c => c.escrowId === escrowId)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getActiveEscrowContacts(escrowId: string): EscrowContact[] {
  return getEscrowContacts(escrowId).filter(c => c.active);
}

// ── Bank Accounts ─────────────────────────────────────────────────────────────

export function getEscrowBankAccounts(escrowId: string): EscrowBankAccount[] {
  return ESCROW_BANK_ACCOUNTS_DB
    .filter(a => a.escrowId === escrowId)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getActiveEscrowBankAccounts(escrowId: string): EscrowBankAccount[] {
  return getEscrowBankAccounts(escrowId).filter(a => a.active);
}

export function getPrimaryBankAccount(escrowId: string): EscrowBankAccount | undefined {
  return getEscrowBankAccounts(escrowId).find(a => a.primary && a.active)
    ?? getActiveEscrowBankAccounts(escrowId)[0];
}

// ─── Mutations — Provider ─────────────────────────────────────────────────────

export function addEscrowProvider(
  input: Omit<MasterEscrowProvider, 'uuid' | 'createdAt' | 'updatedAt'>,
): MasterEscrowProvider {
  const record: MasterEscrowProvider = {
    ...input,
    uuid:      generateUUID(),
    createdAt: now(),
    updatedAt: now(),
  };
  MASTER_ESCROW_DB.push(record);
  return record;
}

export function updateEscrowProvider(
  uuid: string,
  updates: Partial<Omit<MasterEscrowProvider, 'uuid' | 'createdAt'>>,
): boolean {
  const idx = MASTER_ESCROW_DB.findIndex(p => p.uuid === uuid);
  if (idx === -1) return false;
  Object.assign(MASTER_ESCROW_DB[idx], updates, { updatedAt: now() });
  return true;
}

export function softDeleteEscrowProvider(uuid: string): boolean {
  return updateEscrowProvider(uuid, { status: 'Deleted' });
}

export function setEscrowProviderStatus(uuid: string, status: MasterEscrowStatus): boolean {
  return updateEscrowProvider(uuid, { status });
}

// ─── Mutations — Contacts ─────────────────────────────────────────────────────

export function addEscrowContact(
  input: Omit<EscrowContact, 'uuid'>,
): EscrowContact {
  const record: EscrowContact = { ...input, uuid: generateUUID() };
  ESCROW_CONTACTS_DB.push(record);
  return record;
}

export function updateEscrowContact(
  uuid: string,
  updates: Partial<Omit<EscrowContact, 'uuid'>>,
): boolean {
  const idx = ESCROW_CONTACTS_DB.findIndex(c => c.uuid === uuid);
  if (idx === -1) return false;
  Object.assign(ESCROW_CONTACTS_DB[idx], updates);
  return true;
}

export function deleteEscrowContact(uuid: string): boolean {
  const idx = ESCROW_CONTACTS_DB.findIndex(c => c.uuid === uuid);
  if (idx === -1) return false;
  ESCROW_CONTACTS_DB.splice(idx, 1);
  return true;
}

// ─── Mutations — Bank Accounts ────────────────────────────────────────────────

export function addEscrowBankAccount(
  input: Omit<EscrowBankAccount, 'uuid'>,
): EscrowBankAccount {
  const record: EscrowBankAccount = { ...input, uuid: generateUUID() };
  ESCROW_BANK_ACCOUNTS_DB.push(record);
  return record;
}

export function updateEscrowBankAccount(
  uuid: string,
  updates: Partial<Omit<EscrowBankAccount, 'uuid'>>,
): boolean {
  const idx = ESCROW_BANK_ACCOUNTS_DB.findIndex(a => a.uuid === uuid);
  if (idx === -1) return false;
  Object.assign(ESCROW_BANK_ACCOUNTS_DB[idx], updates);
  return true;
}

export function deleteEscrowBankAccount(uuid: string): boolean {
  const idx = ESCROW_BANK_ACCOUNTS_DB.findIndex(a => a.uuid === uuid);
  if (idx === -1) return false;
  ESCROW_BANK_ACCOUNTS_DB.splice(idx, 1);
  return true;
}
