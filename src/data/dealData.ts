// ─── FARM-FIX-005.2 — Deal Proposal & Deal Summary Foundation ─────────────────
// Living Deal Summary: the single source of truth for every transaction
// agreement between Buyer and Seller inside a Transaction Room.
//
// Architecture rules:
//  - One active Deal per chatId (Cancelled deals allow a new one to be created).
//  - Escrow / Transport / Veterinarian fields are reserved placeholders (null).
//    Business logic for them is NOT implemented here.
//  - totalPembayaranPembeli and totalDiterimaPenjual are computed live from
//    totalHarga. When Escrow/Transport/Vet fees are added in future tasks,
//    only computeDealSummary() needs to change.
//  - Price, quantity, and notes become immutable once status === 'Locked'.
//  - Every field change records a DealRevision (version, editor, timestamp,
//    changedFields).
//  - marketplaceChatData.ts and transactionRoomData.ts are NOT modified here.

import { generateUUID } from '../utils/uuid';
import { getListingByUuid } from './marketplaceListingData';
import { notifyOrchestrationMutation } from './orchestrationBus';

// ─── Deal Status ──────────────────────────────────────────────────────────────

/**
 * Deal lifecycle statuses.
 *
 * Draft           → being created / edited by either party
 * Waiting Approval→ submitted; both parties vote
 * Approved        → transitional: both voted Approved (immediately → Locked)
 * Rejected        → one party voted Rejected; can be revised via resetRejectedDeal()
 * Cancelled       → deal explicitly cancelled (not yet Locked)
 * Locked          → both approved; fields are immutable; summary is read-only
 */
export type DealStatus =
  | 'Draft'
  | 'Waiting Approval'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Locked';

export const DEAL_STATUS_LABEL: Record<DealStatus, string> = {
  'Draft': 'Draft',
  'Waiting Approval': 'Menunggu Persetujuan',
  'Approved': 'Disetujui',
  'Rejected': 'Ditolak',
  'Cancelled': 'Dibatalkan',
  'Locked': 'Terkunci',
};

export const DEAL_STATUS_COLOR: Record<DealStatus, string> = {
  'Draft': '#6b7280',
  'Waiting Approval': '#d97706',
  'Approved': '#16a34a',
  'Rejected': '#dc2626',
  'Cancelled': '#9ca3af',
  'Locked': '#2563eb',
};

export const DEAL_STATUS_BG: Record<DealStatus, string> = {
  'Draft': 'rgba(107,114,128,0.12)',
  'Waiting Approval': 'rgba(217,119,6,0.12)',
  'Approved': 'rgba(22,163,74,0.12)',
  'Rejected': 'rgba(220,38,38,0.12)',
  'Cancelled': 'rgba(156,163,175,0.12)',
  'Locked': 'rgba(37,99,235,0.12)',
};

/** Icon shown next to the status label throughout the UI. */
export const DEAL_STATUS_ICON: Record<DealStatus, string> = {
  'Draft': '📝',
  'Waiting Approval': '⏳',
  'Approved': '✅',
  'Rejected': '❌',
  'Cancelled': '🚫',
  'Locked': '🔒',
};

// ─── Approval ─────────────────────────────────────────────────────────────────

export type DealApprovalDecision = 'Pending' | 'Approved' | 'Rejected';

export interface DealApprovalRecord {
  workspaceId: string;
  role: 'Pembeli' | 'Penjual';
  decision: DealApprovalDecision;
  /** ISO timestamp of the vote; null when still Pending. */
  timestamp: string | null;
}

// ─── Revision History ─────────────────────────────────────────────────────────

export interface DealRevision {
  version: number;
  editorWorkspaceId: string;
  editorRole: 'Pembeli' | 'Penjual';
  timestamp: string;
  /** Human-readable names of every field that changed in this revision. */
  changedFields: string[];
}

/** Map from internal field key → display name used in revision records. */
export const DEAL_FIELD_LABEL: Record<string, string> = {
  jumlah: 'Jumlah',
  hargaSatuan: 'Harga Satuan',
  catatan: 'Catatan',
};

// ─── Deal Fields (mutable core) ───────────────────────────────────────────────

export interface DealFields {
  /** Quantity of the item being purchased. */
  jumlah: number;
  /** Unit price agreed by both parties (may differ from listing price). */
  hargaSatuan: number;
  /** Free-form notes / terms agreed upon. */
  catatan: string;
}

// ─── Deal Summary (computed view) ─────────────────────────────────────────────

/**
 * Living Deal Summary — computed from a Deal record each time it is read.
 * This is the single source of truth displayed in the Deal Summary UI.
 */
export interface DealSummary {
  listingUuid: string;
  listingJudul: string;
  listingThumbnail: string;
  satuanHarga: string;

  jumlah: number;
  hargaSatuan: number;
  totalHarga: number;
  catatan: string;

  // ── Reserved placeholders (future tasks will populate these) ──────────────
  /** Escrow service ref — will be typed when the escrow workflow is linked. */
  escrow: Record<string, unknown> | null;
  /** Transport service ref — will be typed when transport workflow is linked. */
  transport: Record<string, unknown> | null;
  /** Veterinarian service ref — will be typed when vet workflow is linked. */
  veterinarian: Record<string, unknown> | null;

  // ── Totals ────────────────────────────────────────────────────────────────
  /** Temporary = totalHarga. Will change when Escrow/Transport fees are added. */
  totalPembayaranPembeli: number;
  /** Temporary = totalHarga. Will change when Escrow fees are deducted. */
  totalDiterimaPenjual: number;
}

// ─── Deal Record ──────────────────────────────────────────────────────────────

export interface Deal {
  uuid: string;
  chatId: string;
  listingUuid: string;
  workspaceIdPenjual: string;
  workspaceIdPembeli: string;
  status: DealStatus;
  fields: DealFields;
  approvals: DealApprovalRecord[];
  revisions: DealRevision[];
  createdAt: string;
  createdByWorkspaceId: string;
  /** ISO timestamp set when status transitions to Locked. */
  lockedAt: string | null;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

/** chatId → Deal (one active deal per room; Cancelled allows recreation). */
const DEAL_STORE = new Map<string, Deal>();

// ─── Internal helpers ─────────────────────────────────────────────────────────

function makeApprovals(
  penjualId: string,
  pembeliId: string,
): DealApprovalRecord[] {
  return [
    { workspaceId: penjualId, role: 'Penjual', decision: 'Pending', timestamp: null },
    { workspaceId: pembeliId, role: 'Pembeli', decision: 'Pending', timestamp: null },
  ];
}

function deriveRole(
  workspaceId: string,
  deal: Deal,
): 'Pembeli' | 'Penjual' | null {
  if (workspaceId === deal.workspaceIdPenjual) return 'Penjual';
  if (workspaceId === deal.workspaceIdPembeli) return 'Pembeli';
  return null;
}

// ─── Computed view ────────────────────────────────────────────────────────────

/** Build the living DealSummary from a Deal. Called on every read — no caching. */
export function computeDealSummary(deal: Deal): DealSummary {
  const listing = getListingByUuid(deal.listingUuid);
  const totalHarga = deal.fields.jumlah * deal.fields.hargaSatuan;
  return {
    listingUuid: deal.listingUuid,
    listingJudul: listing?.judul ?? 'Listing tidak tersedia',
    listingThumbnail: listing?.media?.thumbnail ?? '📦',
    satuanHarga: listing?.satuanHarga ?? 'unit',
    jumlah: deal.fields.jumlah,
    hargaSatuan: deal.fields.hargaSatuan,
    totalHarga,
    catatan: deal.fields.catatan,
    escrow: null,
    transport: null,
    veterinarian: null,
    totalPembayaranPembeli: totalHarga,
    totalDiterimaPenjual: totalHarga,
  };
}

// ─── Status guards ────────────────────────────────────────────────────────────

/** True when deal fields can still be changed. */
export function isDealEditable(status: DealStatus): boolean {
  return status === 'Draft' || status === 'Waiting Approval';
}

/** True when the deal has reached its final unalterable state. */
export function isDealLocked(status: DealStatus): boolean {
  return status === 'Locked';
}

// ─── Public getters ───────────────────────────────────────────────────────────

/** Get the active Deal for a chat room (undefined if none exists). */
export function getDealByChatId(chatId: string): Deal | undefined {
  return DEAL_STORE.get(chatId);
}

/** Get the approval record for a specific workspace in a deal. */
export function getMyApproval(deal: Deal, workspaceId: string): DealApprovalRecord | undefined {
  return deal.approvals.find(a => a.workspaceId === workspaceId);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a new Deal Proposal for a Transaction Room.
 * Either Buyer or Seller may call this.
 * If the room already has an active (non-Cancelled) deal, throws.
 * Pre-fills jumlah=1 and hargaSatuan from the listing price.
 */
export function createDeal(input: {
  chatId: string;
  listingUuid: string;
  workspaceIdPenjual: string;
  workspaceIdPembeli: string;
  createdByWorkspaceId: string;
  fields?: Partial<DealFields>;
}): Deal {
  const existing = DEAL_STORE.get(input.chatId);
  if (existing && existing.status !== 'Cancelled') {
    throw new Error('Sudah ada Deal aktif untuk ruang transaksi ini.');
  }

  const listing = getListingByUuid(input.listingUuid);
  const defaultHarga = listing?.harga ?? 0;

  const fields: DealFields = {
    jumlah: input.fields?.jumlah ?? 1,
    hargaSatuan: input.fields?.hargaSatuan ?? defaultHarga,
    catatan: input.fields?.catatan ?? '',
  };

  const now = new Date().toISOString();
  const editorRole: 'Pembeli' | 'Penjual' =
    input.createdByWorkspaceId === input.workspaceIdPenjual ? 'Penjual' : 'Pembeli';

  const deal: Deal = {
    uuid: generateUUID(),
    chatId: input.chatId,
    listingUuid: input.listingUuid,
    workspaceIdPenjual: input.workspaceIdPenjual,
    workspaceIdPembeli: input.workspaceIdPembeli,
    status: 'Draft',
    fields,
    approvals: makeApprovals(input.workspaceIdPenjual, input.workspaceIdPembeli),
    revisions: [
      {
        version: 1,
        editorWorkspaceId: input.createdByWorkspaceId,
        editorRole,
        timestamp: now,
        changedFields: ['jumlah', 'hargaSatuan', 'catatan'],
      },
    ],
    createdAt: now,
    createdByWorkspaceId: input.createdByWorkspaceId,
    lockedAt: null,
  };

  DEAL_STORE.set(input.chatId, deal);
  notifyOrchestrationMutation(input.chatId);
  return deal;
}

/**
 * Update editable fields of a Deal.
 * Allowed only while status is Draft or Waiting Approval.
 * Every call that actually changes at least one field appends a DealRevision
 * and resets all approval votes (forcing both to re-approve after a change).
 */
export function updateDealFields(input: {
  chatId: string;
  editorWorkspaceId: string;
  newFields: Partial<DealFields>;
}): Deal {
  const deal = DEAL_STORE.get(input.chatId);
  if (!deal) throw new Error('Deal tidak ditemukan.');
  if (!isDealEditable(deal.status)) {
    throw new Error(`Deal tidak dapat diubah dalam status "${DEAL_STATUS_LABEL[deal.status]}".`);
  }

  const editorRole = deriveRole(input.editorWorkspaceId, deal);
  if (!editorRole) throw new Error('Workspace tidak terdaftar sebagai peserta deal.');

  const changedFields: string[] = [];

  if (
    input.newFields.jumlah !== undefined &&
    input.newFields.jumlah !== deal.fields.jumlah
  ) {
    if (input.newFields.jumlah <= 0) throw new Error('Jumlah harus lebih dari 0.');
    deal.fields.jumlah = input.newFields.jumlah;
    changedFields.push('jumlah');
  }

  if (
    input.newFields.hargaSatuan !== undefined &&
    input.newFields.hargaSatuan !== deal.fields.hargaSatuan
  ) {
    if (input.newFields.hargaSatuan < 0) throw new Error('Harga satuan tidak boleh negatif.');
    deal.fields.hargaSatuan = input.newFields.hargaSatuan;
    changedFields.push('hargaSatuan');
  }

  if (
    input.newFields.catatan !== undefined &&
    input.newFields.catatan !== deal.fields.catatan
  ) {
    deal.fields.catatan = input.newFields.catatan;
    changedFields.push('catatan');
  }

  if (changedFields.length > 0) {
    const nextVersion = Math.max(...deal.revisions.map(r => r.version)) + 1;
    deal.revisions.push({
      version: nextVersion,
      editorWorkspaceId: input.editorWorkspaceId,
      editorRole,
      timestamp: new Date().toISOString(),
      changedFields,
    });
    // Reset approvals so both must re-approve the revised deal
    deal.approvals = makeApprovals(deal.workspaceIdPenjual, deal.workspaceIdPembeli);
    notifyOrchestrationMutation(input.chatId);
  }

  return deal;
}

/**
 * Submit a Draft deal for approval.
 * Either party may call this. Status becomes Waiting Approval.
 * Approvals are reset to Pending so both must vote fresh.
 */
export function submitDealForApproval(chatId: string, workspaceId: string): Deal {
  const deal = DEAL_STORE.get(chatId);
  if (!deal) throw new Error('Deal tidak ditemukan.');
  if (deal.status !== 'Draft') {
    throw new Error('Hanya Deal berstatus Draft yang dapat diajukan untuk persetujuan.');
  }

  const role = deriveRole(workspaceId, deal);
  if (!role) throw new Error('Hanya peserta yang dapat mengajukan persetujuan.');

  if (deal.fields.jumlah <= 0) throw new Error('Jumlah harus lebih dari 0 sebelum diajukan.');
  if (deal.fields.hargaSatuan < 0) throw new Error('Harga satuan tidak boleh negatif.');

  deal.status = 'Waiting Approval';
  deal.approvals = makeApprovals(deal.workspaceIdPenjual, deal.workspaceIdPembeli);
  notifyOrchestrationMutation(chatId);
  return deal;
}

/**
 * Cast an approval or rejection vote on a deal in Waiting Approval status.
 *
 * approve path:
 *   - Records the vote.
 *   - If both parties have now voted Approved → status transitions to Locked.
 *     (passes through Approved transiently as per spec, stored as Locked)
 *
 * reject path:
 *   - Status becomes Rejected.
 *   - Either party may then call resetRejectedDeal() to return to Draft.
 */
export function voteOnDeal(input: {
  chatId: string;
  workspaceId: string;
  vote: 'approve' | 'reject';
}): Deal {
  const deal = DEAL_STORE.get(input.chatId);
  if (!deal) throw new Error('Deal tidak ditemukan.');
  if (deal.status !== 'Waiting Approval') {
    throw new Error('Deal tidak dalam status Menunggu Persetujuan.');
  }

  const approval = deal.approvals.find(a => a.workspaceId === input.workspaceId);
  if (!approval) throw new Error('Workspace tidak terdaftar sebagai peserta deal.');

  const now = new Date().toISOString();

  if (input.vote === 'reject') {
    approval.decision = 'Rejected';
    approval.timestamp = now;
    deal.status = 'Rejected';
    // Keep approval records intact so UI can show who rejected
  } else {
    approval.decision = 'Approved';
    approval.timestamp = now;

    // Check if ALL parties have now approved
    const allApproved = deal.approvals.every(a => a.decision === 'Approved');
    if (allApproved) {
      // Transitional: passes through Approved → immediately Locked (spec requirement)
      deal.status = 'Locked';
      deal.lockedAt = now;
    }
    // Else: stay Waiting Approval, waiting for the other party
  }

  notifyOrchestrationMutation(input.chatId);
  return deal;
}

/**
 * Reset a Rejected deal back to Draft so it can be revised and re-submitted.
 * Either party may call this.
 */
export function resetRejectedDeal(chatId: string, workspaceId: string): Deal {
  const deal = DEAL_STORE.get(chatId);
  if (!deal) throw new Error('Deal tidak ditemukan.');
  if (deal.status !== 'Rejected') {
    throw new Error('Hanya Deal berstatus Ditolak yang dapat di-reset ke Draft.');
  }

  const role = deriveRole(workspaceId, deal);
  if (!role) throw new Error('Hanya peserta yang dapat mereset deal.');

  deal.status = 'Draft';
  deal.approvals = makeApprovals(deal.workspaceIdPenjual, deal.workspaceIdPembeli);
  notifyOrchestrationMutation(chatId);
  return deal;
}

/**
 * Cancel an active deal (Draft, Waiting Approval, or Rejected).
 * Locked deals cannot be cancelled.
 */
export function cancelDeal(chatId: string, workspaceId: string): Deal {
  const deal = DEAL_STORE.get(chatId);
  if (!deal) throw new Error('Deal tidak ditemukan.');
  if (deal.status === 'Locked') {
    throw new Error('Deal yang sudah Terkunci tidak dapat dibatalkan.');
  }

  const role = deriveRole(workspaceId, deal);
  if (!role) throw new Error('Hanya peserta yang dapat membatalkan deal.');

  deal.status = 'Cancelled';
  notifyOrchestrationMutation(chatId);
  return deal;
}
