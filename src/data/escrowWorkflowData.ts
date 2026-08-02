// ─── Escrow Workflow — FARM-FIX-005.5 ────────────────────────────────────────
// Transaction Room Escrow Workflow.
// Keyed by chatId — one EscrowWorkflowRecord per Transaction Room.
//
// Preconditions (enforced by UI, not this layer):
//   - Deal exists and status === 'Locked'
//   - Escrow participant has joined (invitation.status === 'Joined')
//
// Fee calculation:
//   2.5% of deal total
//   Minimum: Rp 25,000
//   Maximum: Rp 2,500,000
//
// Status lifecycle:
//   Waiting Assignment
//     → (Escrow starts) → Waiting Payment Instruction
//     → (Escrow creates instruction) → Waiting Buyer Payment
//     → (Buyer uploads proof) → Waiting Verification
//     → (Escrow approves) → Holding Funds
//       → (Escrow marks ready) → Ready To Release
//         → (Escrow releases) → Released
//       → (Escrow refunds) → Refunded
//     → (any party disputes) → Disputed
//       → (Escrow resolves) → Released | Refunded
//     → (Escrow rejects/requests reupload) → Waiting Buyer Payment (re-upload)
//   Waiting Assignment / any non-terminal → Cancelled

import { generateUUID } from '../utils/uuid';
import { getEscrowAccountById } from './masterEscrowAccountData';
import { WORKSPACES } from '../components/TopAppBar';
import {
  getPrimaryActiveEscrowProvider,
  getMasterEscrowById,
  computeEscrowFee,
} from './masterEscrowData';

// ─── Status ───────────────────────────────────────────────────────────────────

export type EscrowWorkflowStatus =
  | 'Waiting Assignment'
  | 'Waiting Payment Instruction'
  | 'Waiting Buyer Payment'
  | 'Waiting Verification'
  | 'Holding Funds'
  | 'Waiting Delivery'            // FARM-FIX-005.8: delivery gate before release
  | 'Waiting Buyer Confirmation'  // FARM-FIX-005.8: buyer must confirm receipt
  | 'Ready To Release'
  | 'Released'
  | 'Refunded'
  | 'Cancelled'
  | 'Disputed';

export const TERMINAL_ESCROW_WORKFLOW_STATUSES: ReadonlySet<EscrowWorkflowStatus> = new Set([
  'Released',
  'Refunded',
  'Cancelled',
]);

export const ESCROW_STATUS_CONFIG: Record<
  EscrowWorkflowStatus,
  { icon: string; color: string; bg: string; label: string; description: string }
> = {
  'Waiting Assignment':         { icon: '⏳', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', label: 'Menunggu Penugasan',        description: 'Escrow bergabung. Menunggu penugasan dimulai.' },
  'Waiting Payment Instruction':{ icon: '📋', color: '#d97706', bg: 'rgba(217,119,6,0.08)',  label: 'Menunggu Instruksi Bayar', description: 'Escrow sedang menyiapkan instruksi pembayaran untuk Buyer.' },
  'Waiting Buyer Payment':      { icon: '💳', color: '#2563eb', bg: 'rgba(37,99,235,0.08)',  label: 'Menunggu Pembayaran',       description: 'Instruksi pembayaran telah dibuat. Menunggu Buyer melakukan transfer.' },
  'Waiting Verification':       { icon: '🔍', color: '#0891b2', bg: 'rgba(8,145,178,0.08)', label: 'Menunggu Verifikasi',       description: 'Buyer telah mengunggah bukti transfer. Escrow sedang memverifikasi.' },
  'Holding Funds':              { icon: '🔐', color: '#1565c0', bg: 'rgba(21,101,192,0.08)',   label: 'Dana Ditahan',                  description: 'Pembayaran terverifikasi. Escrow menahan dana. Monitoring pengiriman dimulai sebelum dana dapat dirilis.' },
  'Waiting Delivery':           { icon: '🚚', color: '#006064', bg: 'rgba(0,96,100,0.08)',    label: 'Menunggu Pengiriman',            description: 'Dana ditahan. Escrow memantau pengiriman. Dana tidak dapat dirilis hingga pengiriman selesai dan Buyer mengkonfirmasi penerimaan.' },
  'Waiting Buyer Confirmation': { icon: '📍', color: '#6a1b9a', bg: 'rgba(106,27,154,0.08)', label: 'Menunggu Konfirmasi Buyer',      description: 'Pengiriman selesai. Menunggu konfirmasi penerimaan dari Buyer sebelum dana dapat dirilis ke Seller.' },
  'Ready To Release':           { icon: '✅', color: '#16a34a', bg: 'rgba(22,163,74,0.08)',  label: 'Siap Dirilis',                  description: 'Buyer telah mengkonfirmasi penerimaan. Dana siap untuk dirilis ke Seller.' },
  'Released':                   { icon: '🎉', color: '#1b5e20', bg: 'rgba(27,94,32,0.08)',   label: 'Dana Dirilis',             description: 'Dana telah berhasil dirilis ke Seller. Escrow selesai.' },
  'Refunded':                   { icon: '↩️',  color: '#e65100', bg: 'rgba(230,81,0,0.08)',  label: 'Dana Dikembalikan',        description: 'Dana telah dikembalikan ke Buyer oleh Escrow.' },
  'Cancelled':                  { icon: '🚫', color: '#5d4037', bg: 'rgba(93,64,55,0.08)',  label: 'Dibatalkan',               description: 'Proses escrow dibatalkan.' },
  'Disputed':                   { icon: '⚠️', color: '#c62828', bg: 'rgba(198,40,40,0.08)', label: 'Sengketa',                 description: 'Terdapat sengketa. Escrow sedang menangani penyelesaian.' },
};

// ─── Fee Payer ────────────────────────────────────────────────────────────────

export type EscrowFeePayer = 'Buyer' | 'Seller';

export const ESCROW_FEE_RATE    = 0.025; // 2.5%
export const ESCROW_FEE_MIN     = 25_000;
export const ESCROW_FEE_MAX     = 2_500_000;

export function calculateEscrowFee(dealTotal: number): number {
  const fee = dealTotal * ESCROW_FEE_RATE;
  return Math.round(Math.min(ESCROW_FEE_MAX, Math.max(ESCROW_FEE_MIN, fee)));
}

// ─── Payment Instruction ──────────────────────────────────────────────────────

export interface PaymentInstruction {
  /** Bank the buyer will transfer FROM */
  buyerBankName: string;
  /** Selected official escrow account ID from masterEscrowAccountData */
  escrowAccountId: string;
  /** Amount buyer must transfer (dealTotal + fee if buyer pays) */
  amountToTransfer: number;
  /** Who pays the escrow fee */
  feePayer: EscrowFeePayer;
  createdAt: string;
  createdBy: string;
}

// ─── Buyer Payment Proof ──────────────────────────────────────────────────────

export interface BuyerPaymentProof {
  /** Emoji representing transfer proof image */
  imageEmoji: string;
  /** Transfer date YYYY-MM-DD */
  transferDate: string;
  /** Amount actually transferred by Buyer (must be > 0) */
  amount: number;
  /** Optional note from buyer */
  note: string | null;
  uploadedAt: string;
  uploadedBy: string;
}

// ─── Verification Result ──────────────────────────────────────────────────────

export type VerificationAction = 'Approve' | 'Reject' | 'Request Reupload';

export interface VerificationResult {
  action: VerificationAction;
  note: string | null;
  verifiedAt: string;
  verifiedBy: string;
}

// ─── Fund Release ─────────────────────────────────────────────────────────────

export interface FundRelease {
  releasedAt: string;
  releasedBy: string;
  referenceNumber: string;
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export interface EscrowRefund {
  reason: string;
  amount: number;
  refundedAt: string;
  referenceNumber: string;
}

// ─── Dispute ──────────────────────────────────────────────────────────────────

export interface EscrowDispute {
  reason: string;
  openedAt: string;
  openedBy: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  /** null = unresolved */
  resolution: 'Released' | 'Refunded' | null;
}

// ─── Buyer Confirmation Result ────────────────────────────────────────────────

export interface BuyerConfirmationResult {
  confirmedAt: string;
  confirmedBy: string;
  note: string | null;
}

// ─── Dispute Additional Action ────────────────────────────────────────────────

export interface DisputeAdditionalAction {
  id: string;
  actionType: 'Request Evidence' | 'Request Clarification';
  note: string;
  requestedAt: string;
  requestedBy: string;
  requestedByName: string;
}

// ─── Timeline Event ───────────────────────────────────────────────────────────

export interface EscrowTimelineEvent {
  id: string;
  eventType: string;
  actor: string;
  actorName: string;
  description: string;
  timestamp: string;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface EscrowAuditEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  target: string;
  referenceUuid: string;
}

// ─── Main Record ──────────────────────────────────────────────────────────────

/**
 * Snapshot of escrow provider config captured at workflow creation time.
 * Ensures historic accuracy even if provider config changes after creation.
 */
export interface EscrowProviderSnapshot {
  /** UUID from masterEscrowData.ts */
  escrowProviderId: string;
  escrowName: string;
  feeType: string;
  feePercentage: number;
  minimumFee: number;
  maximumFee: number;
  feePaidBy: string;
  coverageArea: string | null;
  normalSLA: number;
  maximumSLA: number;
  capturedAt: string;
}

export interface EscrowWorkflowRecord {
  /** UUID v4 */
  id: string;
  /** Transaction Room chatId */
  chatId: string;
  status: EscrowWorkflowStatus;

  buyerWorkspaceId: string;
  sellerWorkspaceId: string;
  /** Workspace ID of the Escrow service participant */
  escrowWorkspaceId: string;

  /** From Deal (jumlah × hargaSatuan) */
  dealTotal: number;
  escrowFee: number;
  feePayer: EscrowFeePayer;

  /**
   * Snapshot of the master escrow provider at workflow creation time.
   * null when provider could not be resolved (e.g. External/Direct escrow).
   */
  providerSnapshot: EscrowProviderSnapshot | null;

  paymentInstruction: PaymentInstruction | null;
  /** Latest upload (reupload replaces) */
  buyerPaymentProof: BuyerPaymentProof | null;
  /** Latest verification (may be Reject / Request Reupload before Approve) */
  verificationHistory: VerificationResult[];
  fundRelease: FundRelease | null;
  refund: EscrowRefund | null;
  dispute: EscrowDispute | null;
  /** Set when Buyer confirms receipt in Waiting Buyer Confirmation status */
  buyerConfirmation: BuyerConfirmationResult | null;
  /** Additional dispute actions (Request Evidence / Request Clarification) */
  disputeAdditionalActions: DisputeAdditionalAction[];

  timeline: EscrowTimelineEvent[];
  auditLog: EscrowAuditEntry[];

  createdAt: string;
  updatedAt: string;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────

/** chatId → EscrowWorkflowRecord */
const ESCROW_WORKFLOW_STORE = new Map<string, EscrowWorkflowRecord>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveWsName(id: string): string {
  return WORKSPACES.find(w => w.id === id)?.name ?? id;
}

function addTimeline(
  record: EscrowWorkflowRecord,
  eventType: string,
  actor: string,
  description: string,
): void {
  record.timeline.push({
    id: generateUUID(),
    eventType,
    actor,
    actorName: resolveWsName(actor),
    description,
    timestamp: new Date().toISOString(),
  });
}

function addAudit(
  record: EscrowWorkflowRecord,
  actor: string,
  action: string,
  target: string,
): void {
  record.auditLog.push({
    id: generateUUID(),
    actor,
    action,
    timestamp: new Date().toISOString(),
    target,
    referenceUuid: record.id,
  });
}

// ─── Getters ──────────────────────────────────────────────────────────────────

export function getEscrowWorkflow(chatId: string): EscrowWorkflowRecord | undefined {
  return ESCROW_WORKFLOW_STORE.get(chatId);
}

export function getAllEscrowWorkflows(): EscrowWorkflowRecord[] {
  return Array.from(ESCROW_WORKFLOW_STORE.values());
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Build an EscrowProviderSnapshot from a master escrow provider UUID.
 * Returns null when the provider is not found or is not active.
 */
function buildProviderSnapshot(masterEscrowProviderId: string | null | undefined): EscrowProviderSnapshot | null {
  const providerLookup = masterEscrowProviderId
    ? getMasterEscrowById(masterEscrowProviderId)
    : getPrimaryActiveEscrowProvider();
  if (!providerLookup || providerLookup.status !== 'Active') return null;
  return {
    escrowProviderId: providerLookup.uuid,
    escrowName:       providerLookup.fullName,
    feeType:          providerLookup.feeConfig.feeType,
    feePercentage:    providerLookup.feeConfig.percentage,
    minimumFee:       providerLookup.feeConfig.minimumFee,
    maximumFee:       providerLookup.feeConfig.maximumFee,
    feePaidBy:        providerLookup.feeConfig.feePaidBy,
    coverageArea:     providerLookup.serviceSettings.coverageArea,
    normalSLA:        providerLookup.disputeSettings.normalSLA,
    maximumSLA:       providerLookup.disputeSettings.maximumSLA,
    capturedAt:       new Date().toISOString(),
  };
}

/**
 * Create a new EscrowWorkflowRecord for a Transaction Room.
 * Called when Escrow participant joins and user activates escrow.
 * Guard: only one record per chatId.
 *
 * @param input.masterEscrowProviderId  UUID from masterEscrowData.ts.
 *   When provided, the provider fee config is used and a snapshot is captured.
 *   When omitted, falls back to the primary active provider.
 */
export function createEscrowWorkflow(input: {
  chatId: string;
  buyerWorkspaceId: string;
  sellerWorkspaceId: string;
  escrowWorkspaceId: string;
  dealTotal: number;
  feePayer: EscrowFeePayer;
  masterEscrowProviderId?: string;
}): EscrowWorkflowRecord {
  if (ESCROW_WORKFLOW_STORE.has(input.chatId)) {
    return ESCROW_WORKFLOW_STORE.get(input.chatId)!;
  }
  const now = new Date().toISOString();

  // Prefer provider fee config; fall back to module-level constants
  const snapshot = buildProviderSnapshot(input.masterEscrowProviderId ?? null);
  const fee = snapshot
    ? computeEscrowFee(input.dealTotal, {
        feeType:    snapshot.feeType as 'Percentage' | 'Fixed',
        percentage: snapshot.feePercentage,
        minimumFee: snapshot.minimumFee,
        maximumFee: snapshot.maximumFee,
        feePaidBy:  snapshot.feePaidBy as 'Buyer' | 'Seller' | 'Split' | 'Negotiated',
      })
    : calculateEscrowFee(input.dealTotal);

  const record: EscrowWorkflowRecord = {
    id: generateUUID(),
    chatId: input.chatId,
    status: 'Waiting Assignment',
    buyerWorkspaceId:   input.buyerWorkspaceId,
    sellerWorkspaceId:  input.sellerWorkspaceId,
    escrowWorkspaceId:  input.escrowWorkspaceId,
    dealTotal:          input.dealTotal,
    escrowFee:          fee,
    feePayer:           input.feePayer,
    providerSnapshot:         snapshot,
    paymentInstruction:       null,
    buyerPaymentProof:        null,
    verificationHistory:      [],
    fundRelease:              null,
    refund:                   null,
    dispute:                  null,
    buyerConfirmation:        null,
    disputeAdditionalActions: [],
    timeline:                 [],
    auditLog:                 [],
    createdAt:                now,
    updatedAt:                now,
  };

  addTimeline(record, 'Escrow Assigned', input.escrowWorkspaceId,
    `Escrow ${resolveWsName(input.escrowWorkspaceId)} ditugaskan. Menunggu penugasan dimulai.`);
  addAudit(record, input.escrowWorkspaceId, 'Escrow Created', 'EscrowWorkflow');

  ESCROW_WORKFLOW_STORE.set(input.chatId, record);
  return record;
}

/**
 * Escrow starts the assignment — moves from Waiting Assignment
 * to Waiting Payment Instruction.
 */
export function startAssignment(chatId: string, byWorkspaceId: string): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec || rec.status !== 'Waiting Assignment') return null;
  const now = new Date().toISOString();
  rec.status = 'Waiting Payment Instruction';
  rec.updatedAt = now;
  addTimeline(rec, 'Assignment Started', byWorkspaceId,
    `Escrow ${resolveWsName(byWorkspaceId)} memulai proses. Membuat instruksi pembayaran.`);
  addAudit(rec, byWorkspaceId, 'Assignment Started', 'EscrowWorkflow');
  return rec;
}

/**
 * Escrow creates a payment instruction.
 * Selects the official escrow account and records buyer's transfer bank.
 */
export function createPaymentInstruction(
  chatId: string,
  input: {
    buyerBankName: string;
    escrowAccountId: string;
    feePayer: EscrowFeePayer;
    byWorkspaceId: string;
  },
): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec || rec.status !== 'Waiting Payment Instruction') return null;

  const account = getEscrowAccountById(input.escrowAccountId);
  if (!account) return null;

  const now = new Date().toISOString();
  const amountToTransfer =
    input.feePayer === 'Buyer'
      ? rec.dealTotal + rec.escrowFee
      : rec.dealTotal;

  rec.feePayer = input.feePayer;
  rec.paymentInstruction = {
    buyerBankName:    input.buyerBankName,
    escrowAccountId:  input.escrowAccountId,
    amountToTransfer,
    feePayer:         input.feePayer,
    createdAt:        now,
    createdBy:        input.byWorkspaceId,
  };
  rec.status    = 'Waiting Buyer Payment';
  rec.updatedAt = now;

  addTimeline(rec, 'Payment Instruction Created', input.byWorkspaceId,
    `Instruksi pembayaran dibuat. Buyer transfer dari ${input.buyerBankName} ke rekening Escrow ${account.bankName} ${account.accountNumber}.`);
  addAudit(rec, input.byWorkspaceId, 'Payment Instruction Created', 'PaymentInstruction');
  return rec;
}

/**
 * Buyer uploads transfer proof.
 * Replaces any previous proof (reupload flow).
 */
export function uploadPaymentProof(
  chatId: string,
  input: {
    imageEmoji: string;
    transferDate: string;
    amount: number;
    note: string | null;
    byWorkspaceId: string;
  },
): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec || rec.status !== 'Waiting Buyer Payment') return null;
  if (input.amount <= 0) return null;

  const now = new Date().toISOString();
  rec.buyerPaymentProof = {
    imageEmoji:   input.imageEmoji,
    transferDate: input.transferDate,
    amount:       input.amount,
    note:         input.note,
    uploadedAt:   now,
    uploadedBy:   input.byWorkspaceId,
  };
  rec.status    = 'Waiting Verification';
  rec.updatedAt = now;

  addTimeline(rec, 'Buyer Uploaded Proof', input.byWorkspaceId,
    `Buyer ${resolveWsName(input.byWorkspaceId)} mengunggah bukti transfer tanggal ${input.transferDate}. Jumlah: Rp ${input.amount.toLocaleString('id-ID')}.`);
  addAudit(rec, input.byWorkspaceId, 'Payment Proof Uploaded', 'BuyerPaymentProof');
  return rec;
}

/**
 * Escrow verifies buyer payment proof.
 * Approve → Holding Funds
 * Reject | Request Reupload → Waiting Buyer Payment (buyer re-uploads)
 */
export function verifyPaymentProof(
  chatId: string,
  input: {
    action: VerificationAction;
    note: string | null;
    byWorkspaceId: string;
  },
): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec || rec.status !== 'Waiting Verification') return null;

  const now = new Date().toISOString();
  const result: VerificationResult = {
    action:     input.action,
    note:       input.note,
    verifiedAt: now,
    verifiedBy: input.byWorkspaceId,
  };
  rec.verificationHistory.push(result);
  rec.updatedAt = now;

  if (input.action === 'Approve') {
    rec.status = 'Holding Funds';
    addTimeline(rec, 'Verification Approved', input.byWorkspaceId,
      `Escrow ${resolveWsName(input.byWorkspaceId)} menyetujui bukti transfer. Dana ditahan.`);
    addAudit(rec, input.byWorkspaceId, 'Verification Approved', 'PaymentVerification');
  } else if (input.action === 'Reject') {
    rec.status = 'Waiting Buyer Payment';
    addTimeline(rec, 'Verification Rejected', input.byWorkspaceId,
      `Escrow ${resolveWsName(input.byWorkspaceId)} menolak bukti transfer. ${input.note ?? ''}`);
    addAudit(rec, input.byWorkspaceId, 'Verification Rejected', 'PaymentVerification');
  } else {
    // Request Reupload
    rec.status = 'Waiting Buyer Payment';
    addTimeline(rec, 'Reupload Requested', input.byWorkspaceId,
      `Escrow ${resolveWsName(input.byWorkspaceId)} meminta unggah ulang bukti transfer. ${input.note ?? ''}`);
    addAudit(rec, input.byWorkspaceId, 'Reupload Requested', 'PaymentVerification');
  }
  return rec;
}

/**
 * Escrow marks funds ready to release → Ready To Release.
 */
export function markReadyToRelease(chatId: string, byWorkspaceId: string): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec || rec.status !== 'Holding Funds') return null;
  const now = new Date().toISOString();
  rec.status    = 'Ready To Release';
  rec.updatedAt = now;
  addTimeline(rec, 'Funds Ready To Release', byWorkspaceId,
    `Escrow ${resolveWsName(byWorkspaceId)} menyiapkan pelepasan dana ke Seller.`);
  addAudit(rec, byWorkspaceId, 'Marked Ready To Release', 'EscrowWorkflow');
  return rec;
}

/**
 * Escrow releases funds to Seller.
 */
export function releaseFunds(
  chatId: string,
  input: { byWorkspaceId: string; referenceNumber: string },
): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec || rec.status !== 'Ready To Release') return null;
  const now = new Date().toISOString();
  rec.fundRelease = {
    releasedAt:      now,
    releasedBy:      input.byWorkspaceId,
    referenceNumber: input.referenceNumber,
  };
  rec.status    = 'Released';
  rec.updatedAt = now;
  addTimeline(rec, 'Funds Released', input.byWorkspaceId,
    `Dana dirilis ke Seller oleh Escrow ${resolveWsName(input.byWorkspaceId)}. Ref: ${input.referenceNumber}.`);
  addAudit(rec, input.byWorkspaceId, 'Funds Released', 'FundRelease');
  return rec;
}

/**
 * Escrow refunds Buyer.
 */
export function refundBuyer(
  chatId: string,
  input: {
    reason: string;
    amount: number;
    referenceNumber: string;
    byWorkspaceId: string;
  },
): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec) return null;
  const allowedStatuses: EscrowWorkflowStatus[] = [
    'Holding Funds', 'Waiting Delivery', 'Waiting Buyer Confirmation',
    'Ready To Release', 'Disputed',
  ];
  if (!allowedStatuses.includes(rec.status)) return null;

  const now = new Date().toISOString();
  rec.refund = {
    reason:          input.reason,
    amount:          input.amount,
    refundedAt:      now,
    referenceNumber: input.referenceNumber,
  };
  rec.status    = 'Refunded';
  rec.updatedAt = now;

  addTimeline(rec, 'Refund Issued', input.byWorkspaceId,
    `Dana dikembalikan ke Buyer. Alasan: ${input.reason}. Ref: ${input.referenceNumber}.`);
  addAudit(rec, input.byWorkspaceId, 'Refund Issued', 'EscrowRefund');
  return rec;
}

/**
 * Open a dispute on this escrow.
 * Allowed from: Holding Funds, Ready To Release, Waiting Buyer Payment, Waiting Verification.
 */
export function openDispute(
  chatId: string,
  input: { reason: string; byWorkspaceId: string },
): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec) return null;
  const allowedStatuses: EscrowWorkflowStatus[] = [
    'Holding Funds', 'Waiting Delivery', 'Waiting Buyer Confirmation',
    'Ready To Release', 'Waiting Buyer Payment', 'Waiting Verification',
  ];
  if (!allowedStatuses.includes(rec.status)) return null;

  const now = new Date().toISOString();
  rec.dispute = {
    reason:         input.reason,
    openedAt:       now,
    openedBy:       input.byWorkspaceId,
    resolvedAt:     null,
    resolutionNote: null,
    resolution:     null,
  };
  rec.status    = 'Disputed';
  rec.updatedAt = now;

  addTimeline(rec, 'Dispute Opened', input.byWorkspaceId,
    `Sengketa dibuka oleh ${resolveWsName(input.byWorkspaceId)}. Alasan: ${input.reason}.`);
  addAudit(rec, input.byWorkspaceId, 'Dispute Opened', 'EscrowDispute');
  return rec;
}

/**
 * Escrow resolves a dispute — either releases or refunds.
 */
export function resolveDispute(
  chatId: string,
  input: {
    resolution: 'Released' | 'Refunded';
    resolutionNote: string;
    referenceNumber: string;
    byWorkspaceId: string;
    /** Refund amount in IDR. If omitted for Refunded resolution, defaults to dealTotal (full refund). */
    refundAmount?: number;
  },
): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec || rec.status !== 'Disputed' || !rec.dispute) return null;

  const now = new Date().toISOString();
  rec.dispute.resolvedAt     = now;
  rec.dispute.resolutionNote = input.resolutionNote;
  rec.dispute.resolution     = input.resolution;

  if (input.resolution === 'Released') {
    rec.fundRelease = {
      releasedAt:      now,
      releasedBy:      input.byWorkspaceId,
      referenceNumber: input.referenceNumber,
    };
    rec.status = 'Released';
    addTimeline(rec, 'Dispute Resolved — Released', input.byWorkspaceId,
      `Sengketa diselesaikan. Dana dirilis ke Seller. Ref: ${input.referenceNumber}.`);
  } else {
    const refundAmt = input.refundAmount ?? rec.dealTotal;
    rec.refund = {
      reason:          input.resolutionNote,
      amount:          refundAmt,
      refundedAt:      now,
      referenceNumber: input.referenceNumber,
    };
    rec.status = 'Refunded';
    const refundDesc = refundAmt >= rec.dealTotal
      ? 'Refund penuh'
      : `Refund sebagian Rp ${refundAmt.toLocaleString('id-ID')}`;
    addTimeline(rec, 'Dispute Resolved — Refunded', input.byWorkspaceId,
      `Sengketa diselesaikan. ${refundDesc} dikembalikan ke Buyer. Ref: ${input.referenceNumber}.`);
  }
  rec.updatedAt = now;
  addAudit(rec, input.byWorkspaceId, `Dispute Resolved (${input.resolution})`, 'EscrowDispute');
  return rec;
}

/**
 * Cancel the escrow workflow.
 * Not allowed once Released or Refunded.
 */
export function cancelEscrowWorkflow(
  chatId: string,
  input: { reason: string; byWorkspaceId: string },
): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec) return null;
  if (TERMINAL_ESCROW_WORKFLOW_STATUSES.has(rec.status)) return null;
  const now = new Date().toISOString();
  rec.status    = 'Cancelled';
  rec.updatedAt = now;
  addTimeline(rec, 'Escrow Cancelled', input.byWorkspaceId,
    `Escrow dibatalkan oleh ${resolveWsName(input.byWorkspaceId)}. Alasan: ${input.reason}.`);
  addAudit(rec, input.byWorkspaceId, 'Escrow Cancelled', 'EscrowWorkflow');
  return rec;
}

// ─── FARM-FIX-005.8 — Delivery Gate + Buyer Confirmation Mutations ────────────

/**
 * Escrow starts delivery monitoring.
 * Holding Funds → Waiting Delivery.
 * Gate: funds cannot be released until delivery completes AND buyer confirms.
 */
export function transitionToWaitingDelivery(
  chatId: string,
  byWorkspaceId: string,
): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec || rec.status !== 'Holding Funds') return null;
  const now = new Date().toISOString();
  rec.status    = 'Waiting Delivery';
  rec.updatedAt = now;
  addTimeline(rec, 'Delivery Monitoring Started', byWorkspaceId,
    `Escrow ${resolveWsName(byWorkspaceId)} memulai monitoring pengiriman. Dana ditahan hingga pengiriman selesai dan Buyer mengkonfirmasi penerimaan.`);
  addAudit(rec, byWorkspaceId, 'Delivery Monitoring Started', 'EscrowWorkflow');
  return rec;
}

/**
 * Escrow advances to Waiting Buyer Confirmation when delivery is done.
 * Waiting Delivery → Waiting Buyer Confirmation.
 */
export function transitionToBuyerConfirmation(
  chatId: string,
  byWorkspaceId: string,
): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec || rec.status !== 'Waiting Delivery') return null;
  const now = new Date().toISOString();
  rec.status    = 'Waiting Buyer Confirmation';
  rec.updatedAt = now;
  addTimeline(rec, 'Buyer Confirmation Requested', byWorkspaceId,
    `Escrow ${resolveWsName(byWorkspaceId)} mengkonfirmasi pengiriman selesai. Menunggu konfirmasi penerimaan dari Buyer.`);
  addAudit(rec, byWorkspaceId, 'Transition To Buyer Confirmation', 'EscrowWorkflow');
  return rec;
}

/**
 * Buyer confirms receipt of goods/livestock.
 * Waiting Buyer Confirmation → Ready To Release.
 */
export function buyerConfirmedReceived(
  chatId: string,
  input: { byWorkspaceId: string; note: string | null },
): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec || rec.status !== 'Waiting Buyer Confirmation') return null;
  const now = new Date().toISOString();
  rec.buyerConfirmation = {
    confirmedAt: now,
    confirmedBy: input.byWorkspaceId,
    note:        input.note,
  };
  rec.status    = 'Ready To Release';
  rec.updatedAt = now;
  addTimeline(rec, 'Buyer Confirmed Receipt', input.byWorkspaceId,
    `Buyer ${resolveWsName(input.byWorkspaceId)} mengkonfirmasi penerimaan barang/ternak. Dana siap dirilis ke Seller.`
    + (input.note ? ` Catatan: "${input.note}"` : ''));
  addAudit(rec, input.byWorkspaceId, 'Buyer Receipt Confirmed', 'EscrowWorkflow');
  return rec;
}

/**
 * Buyer reports a problem during confirmation — auto-opens a dispute.
 * Waiting Buyer Confirmation → Disputed.
 */
export function buyerReportedProblem(
  chatId: string,
  input: { reason: string; byWorkspaceId: string },
): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec || rec.status !== 'Waiting Buyer Confirmation') return null;
  const now = new Date().toISOString();
  rec.dispute = {
    reason:         input.reason,
    openedAt:       now,
    openedBy:       input.byWorkspaceId,
    resolvedAt:     null,
    resolutionNote: null,
    resolution:     null,
  };
  rec.status    = 'Disputed';
  rec.updatedAt = now;
  addTimeline(rec, 'Buyer Reported Problem', input.byWorkspaceId,
    `Buyer ${resolveWsName(input.byWorkspaceId)} melaporkan masalah saat konfirmasi penerimaan. Sengketa dibuka otomatis. Alasan: ${input.reason}.`);
  addAudit(rec, input.byWorkspaceId, 'Buyer Reported Problem — Dispute Auto-Opened', 'EscrowDispute');
  return rec;
}

/**
 * Escrow adds a dispute action: Request Evidence or Request Clarification.
 * Only valid when status === 'Disputed'.
 */
export function addDisputeAdditionalAction(
  chatId: string,
  input: {
    actionType: 'Request Evidence' | 'Request Clarification';
    note: string;
    byWorkspaceId: string;
  },
): EscrowWorkflowRecord | null {
  const rec = ESCROW_WORKFLOW_STORE.get(chatId);
  if (!rec || rec.status !== 'Disputed') return null;
  const now = new Date().toISOString();
  rec.disputeAdditionalActions.push({
    id:              generateUUID(),
    actionType:      input.actionType,
    note:            input.note,
    requestedAt:     now,
    requestedBy:     input.byWorkspaceId,
    requestedByName: resolveWsName(input.byWorkspaceId),
  });
  rec.updatedAt = now;
  const actionLabel = input.actionType === 'Request Evidence' ? 'bukti tambahan' : 'klarifikasi';
  addTimeline(rec, input.actionType, input.byWorkspaceId,
    `Escrow ${resolveWsName(input.byWorkspaceId)} meminta ${actionLabel}: ${input.note}`);
  addAudit(rec, input.byWorkspaceId, input.actionType, 'EscrowDispute');
  return rec;
}
