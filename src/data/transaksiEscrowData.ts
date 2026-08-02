// ─── PROFILE-007 — Transaction Escrow Foundation ──────────────────────────────
// Mengacu pada: docs/architecture/ESCROW_MODULE_CONSTITUTION.md
//               docs/architecture/TRANSACTION_CONVERSATION_CONSTITUTION.md
//
// Aturan utama (dari Constitution):
//  - Escrow HANYA menahan dana, mengelola Evidence/AuditTrail, dan Transfer Manual.
//  - Escrow BUKAN Hakim, BUKAN Arbitrase, BUKAN Penegak Hukum.
//  - Transfer Manual hanya dicatat oleh sistem — tidak ada auto-transfer.
//  - Konfirmasi akhir dilakukan oleh PENERIMA DANA, bukan oleh Escrow.
//  - EscrowFee ≠ TransactionCost — keduanya WAJIB dipisahkan.

import { generateUUID } from '../utils/uuid';
import { getTransaksiById } from './marketplaceTransaksiData';
import { WORKSPACES } from '../components/TopAppBar';
import { addAuditEvent } from './transaksiAuditTrailData';
import { notifyOrchestrationMutation } from './orchestrationBus';
// Canonical escrow fee rate — must match escrowWorkflowData.ts ESCROW_FEE_RATE
export const CANONICAL_ESCROW_FEE_RATE = 0.025; // 2.5%

// ─── Tipe ─────────────────────────────────────────────────────────────────────

export type EscrowStatus =
  | 'Waiting Payment'
  | 'Holding Fund'
  | 'Delivery'
  | 'Waiting Confirmation'
  | 'Dispute'
  | 'Waiting Transfer'
  | 'Transfer Processing'
  | 'Waiting Receiver Confirmation'
  | 'Completed'
  | 'Cancelled';

export type EscrowFeePayer = 'Buyer' | 'Seller' | 'Shared';

export type EscrowOCRWarningType =
  | 'Nominal Berbeda'
  | 'Tanggal Berbeda'
  | 'Bank Berbeda'
  | 'Rekening Berbeda'
  | 'Other';

// ─── Pricing Policy ───────────────────────────────────────────────────────────

export interface EscrowPricingPolicy {
  type: 'Percentage' | 'Fixed';
  /** Jika type=Percentage: misal 0.02 = 2% */
  percentage: number | null;
  /** Jika type=Fixed: nominal tetap */
  fixedAmount: number | null;
  minimumFee: number | null;
  maximumFee: number | null;
  feePayer: EscrowFeePayer;
}

// ─── OCR Warning ─────────────────────────────────────────────────────────────

export interface EscrowOCRWarning {
  type: EscrowOCRWarningType;
  detail: string;
  detectedValue: string;
  expectedValue: string;
}

// ─── Manual Transfer Record ───────────────────────────────────────────────────

export interface EscrowTransferRecord {
  /** UUID v4 */
  id: string;
  nominal: number;
  bankTujuan: string;
  noRekening: string;
  namaPenerima: string;
  /** Format: YYYY-MM-DD */
  tanggal: string;
  /** Format: HH:MM */
  jam: string;
  /** Nama file screenshot / foto bukti */
  fileName: string;
  catatan: string | null;
  /** OCR Warning — belum ada AI/OCR di Foundation */
  ocrWarnings: EscrowOCRWarning[];
  /** True jika Escrow mengabaikan OCR warning dengan alasan */
  isOCRIgnored: boolean;
  ignoreReason: string | null;
  /** ISO datetime pencatatan */
  recordedAt: string;
  /** WorkspaceId petugas Escrow atau 'escrow-system' */
  recordedBy: string;
}

// ─── Dispute Record ───────────────────────────────────────────────────────────

export interface EscrowDisputeRecord {
  /** ISO datetime sengketa dibuka */
  openedAt: string;
  openedBy: string;
  reason: string;
  /** Batas normal: 7 hari. Maksimal: 30 hari */
  deadlineAt: string;
  /** ISO datetime sengketa ditutup (null jika masih aktif) */
  closedAt: string | null;
  resolution: string | null;
  /** Dana dilepas ke Seller atau dikembalikan ke Buyer */
  releaseDirection: 'Seller' | 'Buyer' | null;
}

// ─── Status History Entry ─────────────────────────────────────────────────────

export interface EscrowStatusEntry {
  status: EscrowStatus;
  /** ISO datetime */
  timestamp: string;
  actor: string;
  actorNama: string;
  catatan: string | null;
}

// ─── Escrow Record (main entity) ──────────────────────────────────────────────

export interface EscrowRecord {
  /** UUID v4 */
  id: string;
  transaksiId: string;
  status: EscrowStatus;
  statusHistory: EscrowStatusEntry[];

  /** Pricing policy — belum ada nilai default, ditentukan oleh kebijakan platform */
  pricing: EscrowPricingPolicy;

  /** Nominal transaksi (qty × hargaSatuan) */
  nominalTransaksi: number;

  /**
   * Biaya layanan Escrow — pendapatan Escrow.
   * Dihitung dari pricing policy.
   */
  escrowFee: number | null;

  /**
   * Biaya transaksi pihak ketiga (biaya bank, biaya transfer).
   * BUKAN pendapatan Escrow.
   */
  transactionCost: number | null;

  /** Riwayat transfer manual oleh petugas Escrow */
  transfers: EscrowTransferRecord[];

  /** Dispute record (null jika tidak ada dispute) */
  dispute: EscrowDisputeRecord | null;

  workspaceIdBuyer: string;
  workspaceNamaBuyer: string;
  workspaceIdSeller: string;
  workspaceNamaSeller: string;

  /** ISO datetime */
  createdAt: string;
  /** ISO datetime */
  updatedAt: string;
}

// ─── Konfigurasi Status ───────────────────────────────────────────────────────

export const ESCROW_STATUS_CONFIG: Record<
  EscrowStatus,
  { icon: string; color: string; bg: string; label: string; description: string }
> = {
  'Waiting Payment':              { icon: '⏳', color: '#7b5e2a', bg: '#fff8e1', label: 'Menunggu Pembayaran',      description: 'Menunggu pembayaran dari Buyer ke rekening Escrow.' },
  'Holding Fund':                 { icon: '🔐', color: '#1565c0', bg: '#e3f2fd', label: 'Dana Ditahan',             description: 'Dana Buyer telah dikonfirmasi masuk. Escrow menahan dana.' },
  'Delivery':                     { icon: '🚚', color: '#006064', bg: '#e0f7fa', label: 'Pengiriman',               description: 'Seller telah mengirimkan barang. Escrow memantau proses pengiriman.' },
  'Waiting Confirmation':         { icon: '📍', color: '#6a1b9a', bg: '#f3e5f5', label: 'Menunggu Konfirmasi',      description: 'Menunggu konfirmasi kedatangan dari Buyer.' },
  'Dispute':                      { icon: '⚠️', color: '#c62828', bg: '#ffebee', label: 'Sengketa',                 description: 'Sengketa sedang berlangsung. Escrow menunggu kesepakatan para pihak.' },
  'Waiting Transfer':             { icon: '💸', color: '#e65100', bg: '#fff3e0', label: 'Menunggu Transfer',        description: 'Dana siap ditransfer. Escrow sedang mempersiapkan transfer manual.' },
  'Transfer Processing':          { icon: '🏦', color: '#1565c0', bg: '#e3f2fd', label: 'Transfer Diproses',        description: 'Petugas Escrow sedang melakukan transfer melalui aplikasi bank.' },
  'Waiting Receiver Confirmation':{ icon: '📨', color: '#6a1b9a', bg: '#f3e5f5', label: 'Menunggu Konfirmasi Penerima', description: 'Bukti transfer telah diunggah. Menunggu konfirmasi dari penerima dana.' },
  'Completed':                    { icon: '🎉', color: '#1b5e20', bg: '#e8f5ee', label: 'Selesai',                  description: 'Penerima dana telah mengkonfirmasi. Escrow ditutup.' },
  'Cancelled':                    { icon: '🚫', color: '#5d4037', bg: '#efebe9', label: 'Dibatalkan',               description: 'Transaksi dibatalkan. Proses pengembalian dana jika diperlukan.' },
};

// ─── In-memory Store ──────────────────────────────────────────────────────────

let ESCROW_RECORDS: EscrowRecord[] = [];
let _seeded = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWorkspaceNama(id: string): string {
  return WORKSPACES.find((w) => w.id === id)?.name ?? id;
}

function nowMinus(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function makeStatusEntry(
  status: EscrowStatus,
  actor: string,
  timestamp: string,
  catatan: string | null = null,
): EscrowStatusEntry {
  return {
    status, timestamp, actor, catatan,
    actorNama: actor === 'escrow-system' ? 'TernakHub Escrow' : getWorkspaceNama(actor),
  };
}

function calculateFee(nominal: number, pricing: EscrowPricingPolicy): number | null {
  if (pricing.type === 'Fixed' && pricing.fixedAmount !== null) {
    let fee = pricing.fixedAmount;
    if (pricing.minimumFee !== null) fee = Math.max(fee, pricing.minimumFee);
    if (pricing.maximumFee !== null) fee = Math.min(fee, pricing.maximumFee);
    return fee;
  }
  if (pricing.type === 'Percentage' && pricing.percentage !== null) {
    let fee = nominal * pricing.percentage;
    if (pricing.minimumFee !== null) fee = Math.max(fee, pricing.minimumFee);
    if (pricing.maximumFee !== null) fee = Math.min(fee, pricing.maximumFee);
    return Math.round(fee);
  }
  return null;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

function seedIfNeeded(): void {
  if (_seeded) return;
  _seeded = true;

  // Pricing policy — fee rate is canonical: CANONICAL_ESCROW_FEE_RATE (2.5%)
  // Must stay in sync with escrowWorkflowData.ts ESCROW_FEE_RATE
  const defaultPricing: EscrowPricingPolicy = {
    type:        'Percentage',
    percentage:  CANONICAL_ESCROW_FEE_RATE, // 2.5%
    fixedAmount: null,
    minimumFee:  25_000,      // Rp 25.000
    maximumFee:  2_500_000,   // Rp 2.500.000
    feePayer:    'Shared',
  };

  // ── TRX-20260711-002: Disetujui, Pakan — status: Waiting Payment ─────────────
  const t2 = getTransaksiById('TRX-20260711-002');
  if (t2) {
    const nominal = t2.qty * t2.hargaSatuan;
    const fee = calculateFee(nominal, defaultPricing);
    const createdAt = nowMinus(4);
    ESCROW_RECORDS.push({
      id: generateUUID(),
      transaksiId: 'TRX-20260711-002',
      status: 'Waiting Payment',
      statusHistory: [
        makeStatusEntry('Waiting Payment', 'escrow-system', createdAt, 'Escrow diaktifkan untuk transaksi ini.'),
      ],
      pricing: { ...defaultPricing },
      nominalTransaksi: nominal,
      escrowFee: fee,
      transactionCost: 6_500, // contoh biaya transfer bank
      transfers: [],
      dispute: null,
      workspaceIdBuyer:   t2.workspaceIdPembeli,
      workspaceNamaBuyer: getWorkspaceNama(t2.workspaceIdPembeli),
      workspaceIdSeller:   t2.workspaceIdPenjual,
      workspaceNamaSeller: getWorkspaceNama(t2.workspaceIdPenjual),
      createdAt,
      updatedAt: createdAt,
    });
  }

  // ── TRX-20260712-004: Diproses, Pakan — status: Holding Fund ─────────────────
  const t4 = getTransaksiById('TRX-20260712-004');
  if (t4) {
    const nominal = t4.qty * t4.hargaSatuan;
    const fee = calculateFee(nominal, defaultPricing);
    const createdAt = nowMinus(8);
    const holdAt    = nowMinus(6);
    ESCROW_RECORDS.push({
      id: generateUUID(),
      transaksiId: 'TRX-20260712-004',
      status: 'Holding Fund',
      statusHistory: [
        makeStatusEntry('Waiting Payment', 'escrow-system', createdAt, 'Escrow diaktifkan.'),
        makeStatusEntry('Holding Fund', 'escrow-system', holdAt,
          'Dana masuk dikonfirmasi oleh petugas Escrow setelah pengecekan rekening manual.'),
      ],
      pricing: { ...defaultPricing },
      nominalTransaksi: nominal,
      escrowFee: fee,
      transactionCost: 6_500,
      transfers: [],
      dispute: null,
      workspaceIdBuyer:   t4.workspaceIdPembeli,
      workspaceNamaBuyer: getWorkspaceNama(t4.workspaceIdPembeli),
      workspaceIdSeller:   t4.workspaceIdPenjual,
      workspaceNamaSeller: getWorkspaceNama(t4.workspaceIdPenjual),
      createdAt,
      updatedAt: holdAt,
    });
  }
}

// ─── Fungsi Baca ──────────────────────────────────────────────────────────────

export function getEscrowByTransaksiId(transaksiId: string): EscrowRecord | undefined {
  seedIfNeeded();
  return ESCROW_RECORDS.find((r) => r.transaksiId === transaksiId);
}

export function getEscrowById(id: string): EscrowRecord | undefined {
  seedIfNeeded();
  return ESCROW_RECORDS.find((r) => r.id === id);
}

export function getAllEscrowRecords(): EscrowRecord[] {
  seedIfNeeded();
  return [...ESCROW_RECORDS];
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Membuat EscrowRecord baru untuk transaksi yang memilih Settlement Escrow. */
export function createEscrowRecord(
  transaksiId: string,
  pricing: EscrowPricingPolicy,
): EscrowRecord | null {
  seedIfNeeded();
  const trx = getTransaksiById(transaksiId);
  if (!trx) return null;
  if (ESCROW_RECORDS.find((r) => r.transaksiId === transaksiId)) return null; // sudah ada

  const now = new Date().toISOString();
  const nominal = trx.qty * trx.hargaSatuan;
  const fee = calculateFee(nominal, pricing);

  const record: EscrowRecord = {
    id: generateUUID(),
    transaksiId,
    status: 'Waiting Payment',
    statusHistory: [makeStatusEntry('Waiting Payment', 'escrow-system', now, 'Escrow diaktifkan.')],
    pricing,
    nominalTransaksi: nominal,
    escrowFee: fee,
    transactionCost: null,
    transfers: [],
    dispute: null,
    workspaceIdBuyer:   trx.workspaceIdPembeli,
    workspaceNamaBuyer: getWorkspaceNama(trx.workspaceIdPembeli),
    workspaceIdSeller:   trx.workspaceIdPenjual,
    workspaceNamaSeller: getWorkspaceNama(trx.workspaceIdPenjual),
    createdAt: now,
    updatedAt: now,
  };
  ESCROW_RECORDS.push(record);
  addAuditEvent(transaksiId, 'Payment Requested', 'escrow-system', 'Escrow', 'Escrow diaktifkan — menunggu pembayaran dari Buyer.');
  notifyOrchestrationMutation(transaksiId);
  return record;
}

/** Escrow mengkonfirmasi dana masuk setelah pengecekan rekening manual. */
export function confirmPaymentReceived(escrowId: string, catatan?: string): void {
  seedIfNeeded();
  const rec = ESCROW_RECORDS.find((r) => r.id === escrowId);
  if (!rec || rec.status !== 'Waiting Payment') return;
  const now = new Date().toISOString();
  rec.status = 'Holding Fund';
  rec.statusHistory.push(makeStatusEntry('Holding Fund', 'escrow-system', now,
    catatan ?? 'Dana masuk dikonfirmasi oleh petugas Escrow setelah pengecekan rekening manual.'));
  rec.updatedAt = now;
  addAuditEvent(rec.transaksiId, 'Holding Fund', 'escrow-system', 'Escrow',
    'Dana Buyer dikonfirmasi masuk ke rekening Escrow.');
  notifyOrchestrationMutation(rec.transaksiId);
}

/** Escrow mencatat bahwa pengiriman telah dimulai. */
export function startDelivery(escrowId: string, catatan?: string): void {
  seedIfNeeded();
  const rec = ESCROW_RECORDS.find((r) => r.id === escrowId);
  if (!rec || rec.status !== 'Holding Fund') return;
  const now = new Date().toISOString();
  rec.status = 'Delivery';
  rec.statusHistory.push(makeStatusEntry('Delivery', 'escrow-system', now, catatan ?? null));
  rec.updatedAt = now;
  addAuditEvent(rec.transaksiId, 'Delivery Started', 'escrow-system', 'Escrow',
    'Escrow mencatat bahwa pengiriman barang telah dimulai.');
  notifyOrchestrationMutation(rec.transaksiId);
}

/** Escrow mengubah status ke Waiting Confirmation (barang sudah tiba/dikirim). */
export function requestArrivalConfirmation(escrowId: string, catatan?: string): void {
  seedIfNeeded();
  const rec = ESCROW_RECORDS.find((r) => r.id === escrowId);
  if (!rec || rec.status !== 'Delivery') return;
  const now = new Date().toISOString();
  rec.status = 'Waiting Confirmation';
  rec.statusHistory.push(makeStatusEntry('Waiting Confirmation', 'escrow-system', now, catatan ?? null));
  rec.updatedAt = now;
  addAuditEvent(rec.transaksiId, 'Arrival Confirmed', 'escrow-system', 'Escrow',
    'Menunggu konfirmasi kedatangan barang dari Buyer.');
  notifyOrchestrationMutation(rec.transaksiId);
}

/** Salah satu pihak membuka sengketa. Dispute berlangsung max 30 hari. */
export function openDispute(
  escrowId: string,
  openedBy: string,
  reason: string,
): void {
  seedIfNeeded();
  const rec = ESCROW_RECORDS.find((r) => r.id === escrowId);
  if (!rec) return;
  if (rec.status !== 'Delivery' && rec.status !== 'Waiting Confirmation') return;
  const now = new Date().toISOString();
  rec.status = 'Dispute';
  rec.dispute = {
    openedAt: now,
    openedBy,
    reason,
    deadlineAt: addDays(now, 30), // Maksimal 30 hari
    closedAt: null,
    resolution: null,
    releaseDirection: null,
  };
  rec.statusHistory.push(makeStatusEntry('Dispute', openedBy, now, reason));
  rec.updatedAt = now;
  addAuditEvent(rec.transaksiId, 'Dispute Opened', openedBy, 'Buyer', reason);
  notifyOrchestrationMutation(rec.transaksiId);
}

/**
 * Menutup sengketa setelah para pihak bersepakat.
 * Escrow TIDAK menentukan siapa yang benar.
 */
export function closeDispute(
  escrowId: string,
  resolution: string,
  releaseDirection: 'Seller' | 'Buyer',
  catatan?: string,
): void {
  seedIfNeeded();
  const rec = ESCROW_RECORDS.find((r) => r.id === escrowId);
  if (!rec || rec.status !== 'Dispute' || !rec.dispute) return;
  const now = new Date().toISOString();
  rec.dispute.closedAt = now;
  rec.dispute.resolution = resolution;
  rec.dispute.releaseDirection = releaseDirection;
  rec.status = 'Waiting Transfer';
  rec.statusHistory.push(makeStatusEntry('Waiting Transfer', 'escrow-system', now,
    catatan ?? `Sengketa diselesaikan. Dana akan dikirim ke ${releaseDirection}.`));
  rec.updatedAt = now;
  addAuditEvent(rec.transaksiId, 'Dispute Closed', 'escrow-system', 'Escrow',
    `Sengketa ditutup. Kesepakatan: dana ke ${releaseDirection}. ${resolution}`);
  notifyOrchestrationMutation(rec.transaksiId);
}

/** Escrow memulai proses transfer manual. */
export function initiateTransfer(escrowId: string, catatan?: string): void {
  seedIfNeeded();
  const rec = ESCROW_RECORDS.find((r) => r.id === escrowId);
  if (!rec) return;
  if (rec.status !== 'Waiting Transfer' && rec.status !== 'Waiting Confirmation') return;
  const now = new Date().toISOString();
  // Jika dari Waiting Confirmation langsung (tanpa dispute)
  if (rec.status === 'Waiting Confirmation') {
    rec.status = 'Waiting Transfer';
    rec.statusHistory.push(makeStatusEntry('Waiting Transfer', 'escrow-system', now,
      catatan ?? 'Buyer mengkonfirmasi kedatangan. Dana siap ditransfer.'));
  }
  // Ubah ke Transfer Processing
  const now2 = new Date().toISOString();
  rec.status = 'Transfer Processing';
  rec.statusHistory.push(makeStatusEntry('Transfer Processing', 'escrow-system', now2,
    catatan ?? null));
  rec.updatedAt = now2;
  notifyOrchestrationMutation(rec.transaksiId);
}

/**
 * Petugas Escrow mencatat transfer manual.
 * Sistem hanya menyimpan catatan — tidak ada auto-transfer.
 * Setelah ini, status berubah ke Waiting Receiver Confirmation.
 */
export function recordManualTransfer(
  escrowId: string,
  input: Omit<EscrowTransferRecord, 'id' | 'ocrWarnings' | 'isOCRIgnored' | 'ignoreReason' | 'recordedAt'>,
): EscrowTransferRecord | null {
  seedIfNeeded();
  const rec = ESCROW_RECORDS.find((r) => r.id === escrowId);
  if (!rec) return null;
  if (rec.status !== 'Transfer Processing' && rec.status !== 'Waiting Transfer') return null;

  const transfer: EscrowTransferRecord = {
    id: generateUUID(),
    ...input,
    ocrWarnings:  [],
    isOCRIgnored: false,
    ignoreReason: null,
    recordedAt:   new Date().toISOString(),
  };
  rec.transfers.push(transfer);

  const now = new Date().toISOString();
  rec.status = 'Waiting Receiver Confirmation';
  rec.statusHistory.push(makeStatusEntry(
    'Waiting Receiver Confirmation', input.recordedBy, now,
    `Bukti transfer diunggah: ${input.fileName}. Nominal: Rp ${input.nominal.toLocaleString('id-ID')}.`,
  ));
  rec.updatedAt = now;
  addAuditEvent(rec.transaksiId, 'Transfer Released', input.recordedBy, 'Escrow',
    `Transfer manual dicatat. Nominal: Rp ${input.nominal.toLocaleString('id-ID')} ke ${input.bankTujuan} ${input.noRekening}.`);
  notifyOrchestrationMutation(rec.transaksiId);
  return transfer;
}

/**
 * Penerima dana mengkonfirmasi bahwa dana telah diterima.
 * Escrow TIDAK BOLEH melakukan konfirmasi ini.
 * Jika dana ke Seller → Seller yang mengkonfirmasi.
 * Jika dana kembali ke Buyer → Buyer yang mengkonfirmasi.
 */
export function receiverConfirm(escrowId: string, confirmedBy: string, catatan?: string): void {
  seedIfNeeded();
  const rec = ESCROW_RECORDS.find((r) => r.id === escrowId);
  if (!rec || rec.status !== 'Waiting Receiver Confirmation') return;
  const now = new Date().toISOString();
  rec.status = 'Completed';
  rec.statusHistory.push(makeStatusEntry('Completed', confirmedBy, now,
    catatan ?? 'Dana dikonfirmasi diterima oleh penerima.'));
  rec.updatedAt = now;
  // Peran aktor harus mengikuti arah penerima dana yang sebenarnya —
  // default Seller pada alur normal, tapi bisa Buyer jika sengketa
  // diselesaikan dengan dana dikembalikan ke Buyer.
  const receiverRole = rec.dispute?.releaseDirection ?? 'Seller';
  addAuditEvent(rec.transaksiId, 'Final Confirmation', confirmedBy, receiverRole,
    'Penerima dana mengkonfirmasi bahwa dana telah diterima. Escrow ditutup.');
  notifyOrchestrationMutation(rec.transaksiId);
}

/** Membatalkan escrow (hanya dari Waiting Payment atau Holding Fund). */
export function cancelEscrow(escrowId: string, reason: string): void {
  seedIfNeeded();
  const rec = ESCROW_RECORDS.find((r) => r.id === escrowId);
  if (!rec) return;
  if (rec.status !== 'Waiting Payment' && rec.status !== 'Holding Fund') return;
  const now = new Date().toISOString();
  rec.status = 'Cancelled';
  rec.statusHistory.push(makeStatusEntry('Cancelled', 'escrow-system', now, reason));
  rec.updatedAt = now;
  addAuditEvent(rec.transaksiId, 'Final Confirmation', 'escrow-system', 'Escrow',
    `Escrow dibatalkan: ${reason}`);
  notifyOrchestrationMutation(rec.transaksiId);
}

/** Menambahkan OCR Warning pada transfer record. */
export function addOCRWarning(
  escrowId: string,
  transferId: string,
  warning: EscrowOCRWarning,
): void {
  seedIfNeeded();
  const rec = ESCROW_RECORDS.find((r) => r.id === escrowId);
  if (!rec) return;
  const transfer = rec.transfers.find((t) => t.id === transferId);
  if (transfer) transfer.ocrWarnings.push(warning);
}

/** Petugas Escrow mengabaikan OCR Warning dengan alasan terdokumentasi. */
export function ignoreOCRWarning(
  escrowId: string,
  transferId: string,
  ignoreReason: string,
): void {
  seedIfNeeded();
  const rec = ESCROW_RECORDS.find((r) => r.id === escrowId);
  if (!rec) return;
  const transfer = rec.transfers.find((t) => t.id === transferId);
  if (transfer) {
    transfer.isOCRIgnored = true;
    transfer.ignoreReason = ignoreReason;
  }
}
