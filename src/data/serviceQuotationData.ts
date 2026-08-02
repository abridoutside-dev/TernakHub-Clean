// ─── Service Quotation — FARM-FIX-005.6 ──────────────────────────────────────
// Service quotation & negotiation workflow for Transaction Room service
// participants (Transport, Veterinarian, Other).
//
// Business rule: Service price is NEVER fixed. Marketplace introduces the
// provider; final price is determined through negotiation.
//
// One active (non-terminal) quotation per (chatId, serviceProviderWorkspaceId).
//
// Status lifecycle:
//   Draft → (submit) → Submitted
//   Submitted | Revised | Negotiating
//     → (Buyer/Seller accept)          → Locked          [terminal, immutable]
//     → (Buyer/Seller reject)          → Rejected        [terminal]
//     → (Buyer/Seller request revision)→ Negotiating
//   Negotiating
//     → (Provider revise)              → Revised
//     → (Provider withdraw)            → Cancelled       [terminal]
//   Any non-terminal
//     → (Provider withdraw)            → Cancelled       [terminal]

import type { ServiceRole } from './participantManagementData';
import { generateUUID } from '../utils/uuid';
import { WORKSPACES } from '../components/TopAppBar';
import { notifyOrchestrationMutation } from './orchestrationBus';

// ─── Status ───────────────────────────────────────────────────────────────────

export type QuoteStatus =
  | 'Draft'
  | 'Submitted'
  | 'Negotiating'
  | 'Revised'
  | 'Accepted'
  | 'Rejected'
  | 'Cancelled'
  | 'Locked';

export const TERMINAL_QUOTE_STATUSES: ReadonlySet<QuoteStatus> = new Set([
  'Rejected',
  'Cancelled',
  'Locked',
]);

export const QUOTE_STATUS_CONFIG: Record<
  QuoteStatus,
  { icon: string; color: string; bg: string; label: string; description: string }
> = {
  Draft:       { icon: '📝', color: '#6b7280', bg: 'rgba(107,114,128,0.09)', label: 'Draft',        description: 'Quotasi masih dalam tahap penyusunan.' },
  Submitted:   { icon: '📤', color: '#2563eb', bg: 'rgba(37,99,235,0.09)',   label: 'Diajukan',     description: 'Quotasi telah diajukan. Menunggu respons Buyer/Seller.' },
  Negotiating: { icon: '🤝', color: '#d97706', bg: 'rgba(217,119,6,0.09)',   label: 'Negosiasi',    description: 'Buyer/Seller meminta revisi. Provider sedang merevisi.' },
  Revised:     { icon: '✏️',  color: '#7c3aed', bg: 'rgba(124,58,237,0.09)', label: 'Direvisi',     description: 'Provider telah merevisi quotasi. Menunggu respons.' },
  Accepted:    { icon: '✅', color: '#16a34a', bg: 'rgba(22,163,74,0.09)',   label: 'Diterima',     description: 'Quotasi diterima dan dikunci.' },
  Rejected:    { icon: '❌', color: '#dc2626', bg: 'rgba(220,38,38,0.09)',   label: 'Ditolak',      description: 'Quotasi ditolak. Provider dapat membuat quotasi baru.' },
  Cancelled:   { icon: '🚫', color: '#6b7280', bg: 'rgba(107,114,128,0.09)', label: 'Dibatalkan',   description: 'Provider menarik quotasi.' },
  Locked:      { icon: '🔒', color: '#1d4ed8', bg: 'rgba(29,78,216,0.09)',   label: 'Terkunci',     description: 'Quotasi terkunci. Harga tidak dapat diubah.' },
};

// ─── Revision History ─────────────────────────────────────────────────────────

export interface QuoteRevision {
  /** 1-based revision version number */
  version: number;
  previousPrice: number;
  newPrice: number;
  /** workspaceId of the editor */
  editor: string;
  timestamp: string;
  reason: string;
}

// ─── Main Record ──────────────────────────────────────────────────────────────

export interface ServiceQuotation {
  /** UUID v4 */
  uuid: string;
  /** Transaction Room chatId */
  chatId: string;
  /** ParticipantInvitation.uuid — links this quote to the service participant */
  invitationId: string;
  serviceType: ServiceRole;
  serviceProviderWorkspaceId: string;
  /** 'IDR' */
  currency: string;
  quotedPrice: number;
  /** Human-readable e.g. "1–2 hari", "4 jam" */
  estimatedDuration: string;
  notes: string;
  status: QuoteStatus;
  /** Append-only; latest entry is the most recent revision */
  revisionHistory: QuoteRevision[];
  createdAt: string;
  updatedAt: string;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────

/** UUID → ServiceQuotation */
const QUOTATION_STORE = new Map<string, ServiceQuotation>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveWsName(id: string): string {
  return WORKSPACES.find(w => w.id === id)?.name ?? id;
}
// Keep reference to avoid lint warning
void resolveWsName;

// ─── Getters ──────────────────────────────────────────────────────────────────

/** All quotations for a Transaction Room (any status, chronological) */
export function getQuotationsByChatId(chatId: string): ServiceQuotation[] {
  return Array.from(QUOTATION_STORE.values())
    .filter(q => q.chatId === chatId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Only Locked quotations — used for Grand Total calculation */
export function getLockedQuotationsByChatId(chatId: string): ServiceQuotation[] {
  return getQuotationsByChatId(chatId).filter(q => q.status === 'Locked');
}

/** Latest non-terminal quotation for a specific provider in a room */
export function getActiveQuotationByProvider(
  chatId: string,
  providerWorkspaceId: string,
): ServiceQuotation | undefined {
  return Array.from(QUOTATION_STORE.values()).find(
    q =>
      q.chatId === chatId &&
      q.serviceProviderWorkspaceId === providerWorkspaceId &&
      !TERMINAL_QUOTE_STATUSES.has(q.status),
  );
}

export function getQuotationByUuid(uuid: string): ServiceQuotation | undefined {
  return QUOTATION_STORE.get(uuid);
}

/**
 * Escrow gate check.
 * Returns true when all non-cancelled, non-rejected quotations are Locked.
 * A room with zero active-or-locked quotations also passes (no services required).
 */
export function allRequiredQuotationsLocked(chatId: string): boolean {
  const quotations = getQuotationsByChatId(chatId);
  // Filter out Cancelled and Rejected (they don't block escrow)
  const relevant = quotations.filter(
    q => q.status !== 'Cancelled' && q.status !== 'Rejected',
  );
  if (relevant.length === 0) return true;
  return relevant.every(q => q.status === 'Locked');
}

/**
 * Grand Total for Deal Summary.
 *   = dealTotal + escrowFee (0 if no escrow) + Σ locked service prices
 */
export function computeGrandTotal(
  dealTotal: number,
  escrowFee: number,
  lockedQuotations: ServiceQuotation[],
): number {
  return dealTotal + escrowFee + lockedQuotations.reduce((s, q) => s + q.quotedPrice, 0);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Service provider creates a quotation (status: Draft).
 * Guard: must not have an existing non-terminal quotation for this provider in
 * this room (caller should check getActiveQuotationByProvider first).
 */
export function createQuotation(input: {
  chatId: string;
  invitationId: string;
  serviceType: ServiceRole;
  serviceProviderWorkspaceId: string;
  quotedPrice: number;
  estimatedDuration: string;
  notes: string;
}): ServiceQuotation {
  const now = new Date().toISOString();
  const q: ServiceQuotation = {
    uuid:                       generateUUID(),
    chatId:                     input.chatId,
    invitationId:               input.invitationId,
    serviceType:                input.serviceType,
    serviceProviderWorkspaceId: input.serviceProviderWorkspaceId,
    currency:                   'IDR',
    quotedPrice:                input.quotedPrice,
    estimatedDuration:          input.estimatedDuration,
    notes:                      input.notes,
    status:                     'Draft',
    revisionHistory:            [],
    createdAt:                  now,
    updatedAt:                  now,
  };
  QUOTATION_STORE.set(q.uuid, q);
  notifyOrchestrationMutation(input.chatId);
  return q;
}

/** Service provider submits draft → Submitted */
export function submitQuotation(uuid: string): ServiceQuotation | null {
  const q = QUOTATION_STORE.get(uuid);
  if (!q || q.status !== 'Draft') return null;
  q.status    = 'Submitted';
  q.updatedAt = new Date().toISOString();
  notifyOrchestrationMutation(q.chatId);
  return q;
}

/**
 * Buyer or Seller requests revision → Negotiating.
 * Logs a revision entry (price unchanged; just a request note).
 */
export function requestRevision(
  uuid: string,
  byWorkspaceId: string,
  reason: string,
): ServiceQuotation | null {
  const q = QUOTATION_STORE.get(uuid);
  if (!q) return null;
  const allowed: QuoteStatus[] = ['Submitted', 'Revised', 'Negotiating'];
  if (!allowed.includes(q.status)) return null;
  const now = new Date().toISOString();
  q.revisionHistory.push({
    version:       q.revisionHistory.length + 1,
    previousPrice: q.quotedPrice,
    newPrice:      q.quotedPrice,
    editor:        byWorkspaceId,
    timestamp:     now,
    reason:        `[Permintaan Revisi] ${reason}`,
  });
  q.status    = 'Negotiating';
  q.updatedAt = now;
  notifyOrchestrationMutation(q.chatId);
  return q;
}

/**
 * Service provider revises quotation → Revised.
 * Appends full revision record with old/new price.
 */
export function reviseQuotation(
  uuid: string,
  input: {
    newPrice: number;
    estimatedDuration?: string;
    notes?: string;
    byWorkspaceId: string;
    reason: string;
  },
): ServiceQuotation | null {
  const q = QUOTATION_STORE.get(uuid);
  if (!q) return null;
  const allowed: QuoteStatus[] = ['Draft', 'Submitted', 'Negotiating', 'Revised'];
  if (!allowed.includes(q.status)) return null;
  const now = new Date().toISOString();
  q.revisionHistory.push({
    version:       q.revisionHistory.length + 1,
    previousPrice: q.quotedPrice,
    newPrice:      input.newPrice,
    editor:        input.byWorkspaceId,
    timestamp:     now,
    reason:        input.reason,
  });
  q.quotedPrice = input.newPrice;
  if (input.estimatedDuration !== undefined) q.estimatedDuration = input.estimatedDuration;
  if (input.notes !== undefined)             q.notes = input.notes;
  q.status    = 'Revised';
  q.updatedAt = now;
  notifyOrchestrationMutation(q.chatId);
  return q;
}

/**
 * Buyer or Seller accepts quotation → Locked immediately.
 * Spec: "When quotation is accepted: Status becomes Locked."
 */
export function acceptQuotation(
  uuid: string,
  byWorkspaceId: string,
): ServiceQuotation | null {
  const q = QUOTATION_STORE.get(uuid);
  if (!q) return null;
  const allowed: QuoteStatus[] = ['Submitted', 'Revised', 'Negotiating'];
  if (!allowed.includes(q.status)) return null;
  const now = new Date().toISOString();
  q.revisionHistory.push({
    version:       q.revisionHistory.length + 1,
    previousPrice: q.quotedPrice,
    newPrice:      q.quotedPrice,
    editor:        byWorkspaceId,
    timestamp:     now,
    reason:        '[Diterima & Dikunci]',
  });
  q.status    = 'Locked';
  q.updatedAt = now;
  notifyOrchestrationMutation(q.chatId);
  return q;
}

/**
 * Buyer or Seller rejects quotation → Rejected.
 * Provider may create a new quotation after rejection.
 */
export function rejectQuotation(
  uuid: string,
  byWorkspaceId: string,
  reason: string,
): ServiceQuotation | null {
  const q = QUOTATION_STORE.get(uuid);
  if (!q) return null;
  const allowed: QuoteStatus[] = ['Submitted', 'Revised', 'Negotiating'];
  if (!allowed.includes(q.status)) return null;
  const now = new Date().toISOString();
  if (reason) {
    q.revisionHistory.push({
      version:       q.revisionHistory.length + 1,
      previousPrice: q.quotedPrice,
      newPrice:      q.quotedPrice,
      editor:        byWorkspaceId,
      timestamp:     now,
      reason:        `[Ditolak] ${reason}`,
    });
  }
  q.status    = 'Rejected';
  q.updatedAt = now;
  notifyOrchestrationMutation(q.chatId);
  return q;
}

/**
 * Service provider withdraws quotation → Cancelled.
 * Not allowed once Locked.
 */
export function withdrawQuotation(uuid: string): ServiceQuotation | null {
  const q = QUOTATION_STORE.get(uuid);
  if (!q || q.status === 'Locked' || q.status === 'Cancelled') return null;
  q.status    = 'Cancelled';
  q.updatedAt = new Date().toISOString();
  notifyOrchestrationMutation(q.chatId);
  return q;
}
