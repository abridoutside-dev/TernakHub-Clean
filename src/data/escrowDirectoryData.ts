// ─── Escrow Directory Data — APP-CHAIN-001.3 ──────────────────────────────────
// Public-facing adapter layer. Reads ONLY from masterEscrowData.ts.
// MarketplaceEscrowInfo.tsx and MarketplaceEscrowProviderDetail.tsx consume this.
//
// ARCHITECTURE RULES:
//  - This file contains NO hardcoded provider data.
//  - All values are derived live from masterEscrowData.ts on every call.
//  - Keeps the EscrowDirectoryProvider interface stable for existing page components.
//  - Do NOT call getEscrowDirectoryProviders() at module load — call inside render/fn.

import {
  getActivePublicEscrowProviders,
  getMasterEscrowById,
  getActiveEscrowContacts,
  getActiveEscrowBankAccounts,
  type MasterEscrowProvider,
  type EscrowBankAccount,
  type EscrowContact,
} from './masterEscrowData';
import { KATEGORI_MARKETPLACE } from './marketplaceKategoriData';

// ─── Types (kept stable for existing UI components) ───────────────────────────

export interface EscrowOfficerConfig {
  id: string;
  nama: string | null;
  avatar: string;
  photoUrl: string | null;
  verificationStatus: 'Terverifikasi' | 'Belum Terverifikasi' | null;
  kontak: {
    email: string | null;
    whatsapp: string | null;
    telepon: string | null;
  };
}

export interface EscrowFeeConfig {
  type: 'Percentage' | 'Fixed';
  /** Decimal rate: 0.025 = 2.5% */
  rate: number;
  minimum: number;
  maximum: number;
  feePayer: 'Buyer' | 'Seller' | 'Negosiasi';
}

export interface EscrowDisputeConfig {
  batasDays: number;
  maksimalDays: number;
  mechanism: string;
}

export type EscrowProviderStatus = 'Aktif' | 'Tidak Aktif' | 'Maintenance';

/** Shape of an official account as consumed by existing UI components */
export interface EscrowOfficialAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isActive: boolean;
  bankIcon: string;
}

export interface EscrowDirectoryProvider {
  id: string;
  name: string;
  type: string;
  status: EscrowProviderStatus;
  description: string | null;
  officialBadge: boolean;
  photo: string | null;
  officer: EscrowOfficerConfig;
  feeConfig: EscrowFeeConfig;
  paymentMechanism: string;
  bankAccounts: EscrowOfficialAccount[];
  coverageArea: string | null;
  supportedKategoriSlugs: string[];
  disputeConfig: EscrowDisputeConfig;
  operationalJam: string | null;
  operationalDays: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatFeeRate(rate: number): string {
  const pct = rate * 100;
  return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1).replace('.', ',')}%`;
}

export function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const BANK_ICONS: Record<string, string> = {
  BCA: '🏦', BRI: '🏛️', Mandiri: '🏢', BNI: '🏣', BSI: '🕌',
  'CIMB Niaga': '🏦', Danamon: '🏦', Permata: '🏦', BTN: '🏠',
};

function bankIcon(name: string): string {
  return BANK_ICONS[name] ?? '🏦';
}

function statusMap(s: MasterEscrowProvider['status']): EscrowProviderStatus {
  if (s === 'Active')      return 'Aktif';
  if (s === 'Maintenance') return 'Maintenance';
  return 'Tidak Aktif';
}

function feePayer(fp: string): 'Buyer' | 'Seller' | 'Negosiasi' {
  if (fp === 'Buyer')  return 'Buyer';
  if (fp === 'Seller') return 'Seller';
  return 'Negosiasi';
}

function buildOfficer(
  provider: MasterEscrowProvider,
  contacts: EscrowContact[],
): EscrowOfficerConfig {
  const whatsapp = contacts.find(c => c.contactType === 'WhatsApp' && c.active)?.value ?? null;
  const email    = contacts.find(c => c.contactType === 'Email'    && c.active)?.value ?? null;
  const telepon  = contacts.find(c => c.contactType === 'Phone'    && c.active)?.value ?? null;
  return {
    id:                 `officer-${provider.uuid}`,
    nama:               provider.fullName,
    avatar:             provider.photo ?? '🛡️',
    photoUrl:           null,
    verificationStatus: provider.officialBadge ? 'Terverifikasi' : 'Belum Terverifikasi',
    kontak: {
      whatsapp: whatsapp && whatsapp !== 'Belum dikonfigurasi' ? whatsapp : null,
      email:    email    && email    !== 'Belum dikonfigurasi' ? email    : null,
      telepon:  telepon  && telepon  !== 'Belum dikonfigurasi' ? telepon  : null,
    },
  };
}

function buildBankAccounts(banks: EscrowBankAccount[]): EscrowOfficialAccount[] {
  return banks.map(b => ({
    id:            b.uuid,
    bankName:      b.bankName,
    accountNumber: b.accountNumber,
    accountHolder: b.accountHolder,
    isActive:      b.active,
    bankIcon:      bankIcon(b.bankName),
  }));
}

function buildPaymentMechanism(banks: EscrowBankAccount[], provider: MasterEscrowProvider): string {
  const types = [...new Set(banks.map(b => b.accountType))];
  if (types.includes('QRIS')) return `Pembayaran via QRIS & Transfer Bank ke Rekening Resmi ${provider.fullName}`;
  if (types.includes('Virtual Account')) return `Transfer Virtual Account ke Rekening Resmi ${provider.fullName}`;
  return `Transfer Bank Manual ke Rekening Resmi ${provider.fullName}`;
}

function buildSupportedSlugs(provider: MasterEscrowProvider): string[] {
  if (provider.serviceSettings.supportedCategories.length === 0) {
    // empty = all categories
    return KATEGORI_MARKETPLACE.map((k: { slug: string }) => k.slug);
  }
  return provider.serviceSettings.supportedCategories;
}

function buildDisputeConfig(provider: MasterEscrowProvider): EscrowDisputeConfig {
  const d = provider.disputeSettings;
  const mechanism = [d.settlementRules, d.evidenceRequirements]
    .filter(Boolean)
    .join(' ')
    .trim()
    || `Sengketa ditangani oleh ${provider.fullName} berdasarkan bukti yang diajukan kedua pihak.`;
  return {
    batasDays:    d.normalSLA,
    maksimalDays: d.maximumSLA,
    mechanism,
  };
}

// ─── Main adapter ─────────────────────────────────────────────────────────────

function toDirectoryProvider(p: MasterEscrowProvider): EscrowDirectoryProvider {
  const contacts = getActiveEscrowContacts(p.uuid);
  const banks    = getActiveEscrowBankAccounts(p.uuid);
  return {
    id:            p.uuid,
    name:          p.fullName,
    type:          'Platform Escrow',
    status:        statusMap(p.status),
    description:   p.shortDescription,
    officialBadge: p.officialBadge,
    photo:         p.photo,
    officer:       buildOfficer(p, contacts),
    feeConfig: {
      type:      p.feeConfig.feeType,
      rate:      p.feeConfig.percentage,
      minimum:   p.feeConfig.minimumFee,
      maximum:   p.feeConfig.maximumFee,
      feePayer:  feePayer(p.feeConfig.feePaidBy),
    },
    paymentMechanism:     buildPaymentMechanism(banks, p),
    bankAccounts:         buildBankAccounts(banks),
    coverageArea:         p.serviceSettings.coverageArea,
    supportedKategoriSlugs: buildSupportedSlugs(p),
    disputeConfig:        buildDisputeConfig(p),
    operationalJam:       p.serviceSettings.businessHours,
    operationalDays:      p.serviceSettings.businessDays,
  };
}

// ─── Public Getters ───────────────────────────────────────────────────────────

/**
 * Returns all active public escrow providers derived from Master Escrow.
 * Call inside React render — not at module load (lazy to ensure fresh data).
 */
export function getEscrowDirectoryProviders(): EscrowDirectoryProvider[] {
  return getActivePublicEscrowProviders().map(toDirectoryProvider);
}

/**
 * Returns a single provider by its Master Escrow UUID, or undefined if not found.
 */
export function getEscrowProviderById(id: string): EscrowDirectoryProvider | undefined {
  const p = getMasterEscrowById(id);
  if (!p || p.status === 'Deleted') return undefined;
  return toDirectoryProvider(p);
}
