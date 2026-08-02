// ─── MT-002/MT-003: Mutation Type, Workflow & Data Model ────────────────────
// Business-process layer for Livestock Mutation. Defines the Mutation Type
// taxonomy and the request lifecycle:
//
//   Mutation Request → Validation → Approval (optional) → Execution → History
//
// This module is data/workflow ONLY — it does not build any form UI (the
// MT-001 "+ Mutasi Baru" button on Mutasi.tsx stays unwired; a future roadmap
// item connects it to createMutationRequest()). It also does not touch the
// legacy Di Kandang/Luar Kandang/Arsip location engine in transferData.ts —
// syncing Completed mutations into that engine is deferred to a future
// roadmap so this module can be validated in isolation first.
//
// MT-003 completed the entity (added effectiveDate) and business validation
// (duplicate-active-mutation guard, invalid-destination guard, explicit UUID
// integrity assertion) plus a dedicated MUTATION_HISTORY_LOG — every workflow
// transition (not just the 4 Timeline event types) now writes a history entry.
//
// MUTASI_DB is intentionally empty — populated only when requests are
// created through the app.

import { generateUUID } from '../utils/uuid';
import { LIVESTOCK_DB, getLivestock, addOwnershipRecord, type LivestockRecord } from './livestockData';
import { getBatch, getActiveBatchMemberships, type BatchRecord } from './batchData';
import { applyMutationLocationEffect, type LivestockStatus } from './transferData';
import {
  JENIS_LAMPIRAN_LIST,
  type JenisLampiran,
} from './pelaksanaanReproduksiData';

export { JENIS_LAMPIRAN_LIST };
export type { JenisLampiran };

// ─── Mode (Individual / Batch — reused across every Livestock module) ──────

export type MutasiMode = 'individu' | 'batch';

// ─── Mutation Type ───────────────────────────────────────────────────────────
// Open-ended list — architecture must support additional types in the future,
// so this is a plain readonly string array (not a closed union baked into
// business logic); new types can be appended here without touching workflow
// functions below.

export const MUTATION_TYPE_LIST = [
  'Internal Relocation',
  'Transfer to Another Farm',
  'Incoming Transfer',
  'Sale',
  'Purchase',
  'Rental',
  'Return from Rental',
  'Breeding Loan (Titip Kawin)',
  'Return from Breeding Loan',
  'Exhibition / Contest',
  'Return from Exhibition',
  'Slaughter',
  'Death',
  'Lost',
  'Cull',
  'Donation',
  'Other',
] as const;

export type MutationType = typeof MUTATION_TYPE_LIST[number];

// ─── Status ──────────────────────────────────────────────────────────────────

export const MUTATION_STATUS_LIST = [
  'Draft', 'Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled',
] as const;

export type MutationStatus = typeof MUTATION_STATUS_LIST[number];

/** Statuses from which a request may still be edited or cancelled. */
const OPEN_STATUSES: MutationStatus[] = ['Draft', 'Pending', 'Approved'];

// ─── Lampiran (Attachment — reuses RP-003's Foto/Dokumen convention) ───────

export type LampiranMutasi = {
  id: string;
  jenis: JenisLampiran;
  namaFile: string;
};

// ─── Mutation Record ─────────────────────────────────────────────────────────

export type MutationRecord = {
  id: string;                    // UUID v4
  mode: MutasiMode;
  livestockId: string | null;    // required when mode === 'individu'
  batchId: string | null;        // required when mode === 'batch'
  mutationType: MutationType;
  mutationDate: string;          // yyyy-mm-dd — tanggal permintaan dicatat
  effectiveDate: string;         // yyyy-mm-dd — tanggal mutasi berlaku/efektif
  sourceLocation: string;
  destinationLocation: string;
  sourceOwner: string;
  destinationOwner: string;
  officer: string;
  status: MutationStatus;
  notes: string | null;
  lampiran: LampiranMutasi[];    // optional attachments — [] when none
  createdDate: string;
  updatedDate: string;
};

export type MutationRequestInput = {
  mode: MutasiMode;
  livestockId: string | null;
  batchId: string | null;
  mutationType: MutationType;
  mutationDate: string;
  effectiveDate: string;
  sourceLocation: string;
  destinationLocation: string;
  sourceOwner: string;
  destinationOwner: string;
  officer: string;
  notes: string | null;
  lampiran: LampiranMutasi[];
};

// ─── Registry (empty — populated at runtime) ─────────────────────────────────

export const MUTASI_DB: Record<string, MutationRecord> = {};

export function todayLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Timeline / Event Log ────────────────────────────────────────────────────
// Appended to the Livestock Timeline on the four lifecycle transitions the
// roadmap calls out. Mirrors monitoringReproduksiData.ts's event-log shape.

export const MUTATION_EVENT_TYPE_LIST = [
  'Mutation Created', 'Mutation Approved', 'Mutation Completed', 'Mutation Cancelled',
] as const;

export type MutationEventType = typeof MUTATION_EVENT_TYPE_LIST[number];

export type MutationEvent = {
  id: string;             // UUID v4
  mutationId: string;     // relasi ke MutationRecord.id
  mode: MutasiMode;
  livestockId: string | null;
  batchId: string | null;
  eventType: MutationEventType;
  mutationType: MutationType;
  timestamp: string;       // yyyy-mm-dd
  petugas: string;
  catatan: string | null;
};

export const MUTATION_EVENT_LOG: MutationEvent[] = [];

function logMutationEvent(record: MutationRecord, eventType: MutationEventType, catatan: string | null = null): void {
  MUTATION_EVENT_LOG.push({
    id: generateUUID(),
    mutationId: record.id,
    mode: record.mode,
    livestockId: record.livestockId,
    batchId: record.batchId,
    eventType,
    mutationType: record.mutationType,
    timestamp: todayLabel(),
    petugas: record.officer,
    catatan,
  });
}

/** Full Timeline for one Mutation Request, oldest → newest. */
export function getMutationTimeline(mutationId: string): MutationEvent[] {
  return MUTATION_EVENT_LOG.filter((e) => e.mutationId === mutationId);
}

/** Livestock Timeline — every Mutation event for one animal, oldest → newest. */
export function getMutationEventsByLivestock(livestockId: string): MutationEvent[] {
  return MUTATION_EVENT_LOG.filter((e) => e.livestockId === livestockId);
}

/** Livestock Timeline (batch mode) — every Mutation event for one batch, oldest → newest. */
export function getMutationEventsByBatch(batchId: string): MutationEvent[] {
  return MUTATION_EVENT_LOG.filter((e) => e.batchId === batchId);
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Throws if the target (Livestock or Batch, per mode) does not exist. */
function assertTargetExists(mode: MutasiMode, livestockId: string | null, batchId: string | null): void {
  if (mode === 'individu') {
    if (!livestockId) throw new Error('Livestock wajib dipilih untuk mode Individu.');
    if (!LIVESTOCK_DB[livestockId]) throw new Error(`Livestock dengan ID "${livestockId}" tidak ditemukan.`);
  } else {
    if (!batchId) throw new Error('Batch wajib dipilih untuk mode Batch.');
    if (!getBatch(batchId)) throw new Error(`Batch dengan ID "${batchId}" tidak ditemukan.`);
  }
}

/** Throws listing every missing required field before a request may leave Draft. */
function assertRequiredFields(input: {
  mutationDate: string;
  effectiveDate: string;
  sourceLocation: string;
  destinationLocation: string;
  sourceOwner: string;
  destinationOwner: string;
  officer: string;
}): void {
  const missing: string[] = [];
  if (!input.mutationDate)        missing.push('Mutation Date');
  if (!input.effectiveDate)       missing.push('Effective Date');
  if (!input.sourceLocation)      missing.push('Source Location');
  if (!input.destinationLocation) missing.push('Destination Location');
  if (!input.sourceOwner)         missing.push('Source Owner');
  if (!input.destinationOwner)    missing.push('Destination Owner');
  if (!input.officer)             missing.push('Officer');
  if (missing.length > 0) {
    throw new Error(`Field wajib belum diisi: ${missing.join(', ')}.`);
  }
}

/** Prevents a Destination Location that is empty or identical to the Source Location. */
function assertValidDestination(sourceLocation: string, destinationLocation: string): void {
  if (!destinationLocation || !destinationLocation.trim()) {
    throw new Error('Destination Location tidak valid (kosong).');
  }
  if (sourceLocation && destinationLocation.trim().toLowerCase() === sourceLocation.trim().toLowerCase()) {
    throw new Error('Destination Location tidak boleh sama dengan Source Location.');
  }
}

/**
 * Prevents a target (Livestock or Batch) from having more than one active
 * Mutation Request at a time. "Active" = Draft/Pending/Approved — the same
 * OPEN_STATUSES used by cancelMutationRequest. Completed/Rejected/Cancelled
 * requests never block a new request for the same target.
 */
function assertNoDuplicateActiveMutation(mode: MutasiMode, livestockId: string | null, batchId: string | null, excludeId?: string): void {
  const activeForSameTarget = getMutationList().some((m) => {
    if (m.id === excludeId) return false;
    if (!OPEN_STATUSES.includes(m.status)) return false;
    if (m.mode !== mode) return false;
    return mode === 'individu' ? m.livestockId === livestockId : m.batchId === batchId;
  });
  if (activeForSameTarget) {
    throw new Error(
      mode === 'individu'
        ? 'Livestock ini sudah memiliki Mutation Request aktif (Draft/Pending/Approved). Selesaikan atau batalkan request tersebut terlebih dahulu.'
        : 'Batch ini sudah memiliki Mutation Request aktif (Draft/Pending/Approved). Selesaikan atau batalkan request tersebut terlebih dahulu.',
    );
  }
}

/** Throws if a workflow transition accidentally changed the record's UUID. */
function assertUuidIntegrity(before: MutationRecord, after: MutationRecord): void {
  if (before.id !== after.id) {
    throw new Error('UUID integrity violation: Mutation Request ID tidak boleh berubah.');
  }
}

/**
 * MT-004 — guards executeMutationRequest against duplicate execution and
 * executing a Mutation Request that is Cancelled/Rejected/Completed, on top of
 * the existing destination/UUID checks.
 */
function assertExecutable(record: MutationRecord): void {
  if (!record.id) {
    throw new Error('Mutation Request tidak memiliki UUID yang valid (missing UUID).');
  }
  if (record.status === 'Completed') {
    throw new Error('Mutation Request ini sudah Completed — eksekusi ganda tidak diperbolehkan.');
  }
  if (record.status === 'Cancelled') {
    throw new Error('Mutation Request berstatus Cancelled tidak dapat dieksekusi.');
  }
  if (record.status === 'Rejected') {
    throw new Error('Mutation Request berstatus Rejected tidak dapat dieksekusi.');
  }
  if (record.status !== 'Pending' && record.status !== 'Approved') {
    throw new Error(`Hanya Mutation Request berstatus Pending/Approved yang dapat dieksekusi (status saat ini: ${record.status}).`);
  }
  assertValidDestination(record.sourceLocation, record.destinationLocation);
}

/** Validates a Mutation Request end-to-end (target + required fields + destination). Safe to call at any stage. */
export function validateMutationRequest(record: Pick<MutationRecord,
  'mode' | 'livestockId' | 'batchId' | 'mutationDate' | 'effectiveDate' | 'sourceLocation' | 'destinationLocation' | 'sourceOwner' | 'destinationOwner' | 'officer'
>): void {
  assertTargetExists(record.mode, record.livestockId, record.batchId);
  assertRequiredFields(record);
  assertValidDestination(record.sourceLocation, record.destinationLocation);
}

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

export function getMutationById(id: string): MutationRecord | null {
  return MUTASI_DB[id] ?? null;
}

export function getMutationList(): MutationRecord[] {
  return Object.values(MUTASI_DB);
}

/** History (Individual mode) — every Mutation Request for one animal, newest → oldest. */
export function getMutationHistoryByLivestock(livestockId: string): MutationRecord[] {
  return getMutationList()
    .filter((m) => m.mode === 'individu' && m.livestockId === livestockId)
    .sort((a, b) => (a.mutationDate < b.mutationDate ? 1 : -1));
}

/** History (Batch mode) — every Mutation Request for one batch, newest → oldest. */
export function getMutationHistoryByBatch(batchId: string): MutationRecord[] {
  return getMutationList()
    .filter((m) => m.mode === 'batch' && m.batchId === batchId)
    .sort((a, b) => (a.mutationDate < b.mutationDate ? 1 : -1));
}

export function countMutationByStatus(): Record<MutationStatus, number> {
  const counts: Record<MutationStatus, number> = {
    Draft: 0, Pending: 0, Approved: 0, Rejected: 0, Completed: 0, Cancelled: 0,
  };
  for (const m of getMutationList()) counts[m.status] += 1;
  return counts;
}

// ─── Summary (live aggregation — MT-003) ────────────────────────────────────
// Mutasi.tsx's Summary cards (Mutasi Masuk/Keluar/Pending/Selesai) read this
// instead of hardcoded values. "Masuk"/"Keluar" only count Completed requests
// so in-flight (Draft/Pending/Approved) mutations don't get double-counted as
// both Pending and Masuk/Keluar.

export const INCOMING_MUTATION_TYPES: MutationType[] = [
  'Incoming Transfer', 'Purchase', 'Return from Rental', 'Return from Breeding Loan', 'Return from Exhibition',
];

export const OUTGOING_MUTATION_TYPES: MutationType[] = [
  'Transfer to Another Farm', 'Sale', 'Rental', 'Breeding Loan (Titip Kawin)',
  'Exhibition / Contest', 'Slaughter', 'Death', 'Lost', 'Cull', 'Donation',
];

/** MT-005 — direction classification reused by the AI Insight/Analytics engine so it never re-derives this list. */
export function getMutationDirection(mutationType: MutationType): 'Masuk' | 'Keluar' | 'Netral' {
  if (INCOMING_MUTATION_TYPES.includes(mutationType)) return 'Masuk';
  if (OUTGOING_MUTATION_TYPES.includes(mutationType)) return 'Keluar';
  return 'Netral';
}

// ─── Livestock Status Effect (MT-004) ───────────────────────────────────────
// Maps each Mutation Type to the LivestockStatus (transferData.ts) it produces
// once the request Completes. Types not listed keep the animal on-farm
// ('Di Kandang') and only relocate it (e.g. Internal Relocation, Other).

const ARCHIVING_MUTATION_TYPES: MutationType[] = [
  'Sale', 'Transfer to Another Farm', 'Slaughter', 'Death', 'Lost', 'Cull', 'Donation',
];

const TEMPORARY_OUT_MUTATION_TYPES: MutationType[] = [
  'Rental', 'Breeding Loan (Titip Kawin)', 'Exhibition / Contest',
];

function resolveLivestockStatusEffect(mutationType: MutationType): LivestockStatus {
  if (ARCHIVING_MUTATION_TYPES.includes(mutationType)) return 'Arsip';
  if (TEMPORARY_OUT_MUTATION_TYPES.includes(mutationType)) return 'Luar Kandang';
  return 'Di Kandang'; // Internal Relocation, Incoming Transfer, Purchase, Return from *, Other
}

export type MutationSummary = {
  masuk: number;
  keluar: number;
  pending: number;
  selesai: number;
};

export function getMutationSummary(): MutationSummary {
  const list = getMutationList();
  return {
    masuk:   list.filter((m) => m.status === 'Completed' && INCOMING_MUTATION_TYPES.includes(m.mutationType)).length,
    keluar:  list.filter((m) => m.status === 'Completed' && OUTGOING_MUTATION_TYPES.includes(m.mutationType)).length,
    pending: list.filter((m) => m.status === 'Pending' || m.status === 'Approved').length,
    selesai: list.filter((m) => m.status === 'Completed').length,
  };
}

// ─── History Log (MT-003) ────────────────────────────────────────────────────
// Distinct from MUTATION_EVENT_LOG (Livestock Timeline — only the 4 roadmap
// event types). Every workflow transition, with no exception, writes one
// entry here — this is the audit trail requirement: "Every mutation must
// automatically create a history record."

export type MutationHistoryEntry = {
  id: string;               // UUID v4
  mutationId: string;       // relasi ke MutationRecord.id
  statusFrom: MutationStatus | null; // null hanya untuk entry pertama (create)
  statusTo: MutationStatus;
  timestamp: string;        // yyyy-mm-dd
  officer: string;
  catatan: string | null;
};

export const MUTATION_HISTORY_LOG: MutationHistoryEntry[] = [];

function logMutationHistory(record: MutationRecord, statusFrom: MutationStatus | null, catatan: string | null = null): void {
  MUTATION_HISTORY_LOG.push({
    id: generateUUID(),
    mutationId: record.id,
    statusFrom,
    statusTo: record.status,
    timestamp: todayLabel(),
    officer: record.officer,
    catatan,
  });
}

/** Full audit history for one Mutation Request, oldest → newest. */
export function getMutationHistory(mutationId: string): MutationHistoryEntry[] {
  return MUTATION_HISTORY_LOG.filter((e) => e.mutationId === mutationId);
}

// ─── Notifications (MT-004) ──────────────────────────────────────────────────
// System notifications for the three terminal outcomes of a Mutation Request.
// Self-contained to this module — there is no shared cross-module notification
// center in this codebase yet, so (matching MUTATION_EVENT_LOG's precedent)
// each module keeps its own notification log.

export const MUTATION_NOTIFICATION_TYPE_LIST = [
  'Mutation Completed', 'Mutation Rejected', 'Mutation Cancelled',
] as const;

export type MutationNotificationType = typeof MUTATION_NOTIFICATION_TYPE_LIST[number];

export type MutationNotification = {
  id: string;
  mutationId: string;
  type: MutationNotificationType;
  title: string;
  message: string;
  mode: MutasiMode;
  livestockId: string | null;
  batchId: string | null;
  timestamp: string;
  read: boolean;
};

export const MUTATION_NOTIFICATION_LOG: MutationNotification[] = [];

function targetLabel(record: MutationRecord): string {
  if (record.mode === 'individu' && record.livestockId) {
    return getLivestock(record.livestockId)?.name ?? record.livestockId;
  }
  if (record.mode === 'batch' && record.batchId) {
    return getBatch(record.batchId)?.name ?? record.batchId;
  }
  return 'target tidak diketahui';
}

function pushMutationNotification(record: MutationRecord, type: MutationNotificationType, message: string): void {
  MUTATION_NOTIFICATION_LOG.push({
    id: generateUUID(),
    mutationId: record.id,
    type,
    title: `${type} — ${record.mutationType}`,
    message,
    mode: record.mode,
    livestockId: record.livestockId,
    batchId: record.batchId,
    timestamp: todayLabel(),
    read: false,
  });
}

/** All notifications, newest → oldest. */
export function getMutationNotifications(): MutationNotification[] {
  return [...MUTATION_NOTIFICATION_LOG].reverse();
}

export function getUnreadMutationNotificationCount(): number {
  return MUTATION_NOTIFICATION_LOG.filter((n) => !n.read).length;
}

export function markMutationNotificationRead(id: string): void {
  const idx = MUTATION_NOTIFICATION_LOG.findIndex((n) => n.id === id);
  if (idx >= 0) MUTATION_NOTIFICATION_LOG[idx] = { ...MUTATION_NOTIFICATION_LOG[idx], read: true };
}

// ─── Workflow ─────────────────────────────────────────────────────────────────
//
//   createMutationRequest   Draft            (target validated, fields not yet required)
//   submitMutationRequest   Draft → Pending  (full validation enforced)
//   approveMutationRequest  Pending → Approved
//   rejectMutationRequest   Pending → Rejected
//   executeMutationRequest  Pending/Approved → Completed   (Approval is optional —
//                           low-risk types may go straight from Pending to Completed)
//   cancelMutationRequest   Draft/Pending/Approved → Cancelled

/**
 * Step 1 — Mutation Request. Target must exist and must not already have
 * another active request open (Draft/Pending/Approved). Other fields may
 * still be incomplete (Draft) — full validation runs at submitMutationRequest.
 */
export function createMutationRequest(input: MutationRequestInput): MutationRecord {
  assertTargetExists(input.mode, input.livestockId, input.batchId);
  assertNoDuplicateActiveMutation(input.mode, input.livestockId, input.batchId);

  const today = todayLabel();
  const record: MutationRecord = {
    id: generateUUID(),
    mode: input.mode,
    livestockId: input.mode === 'individu' ? input.livestockId : null,
    batchId: input.mode === 'batch' ? input.batchId : null,
    mutationType: input.mutationType,
    mutationDate: input.mutationDate,
    effectiveDate: input.effectiveDate,
    sourceLocation: input.sourceLocation,
    destinationLocation: input.destinationLocation,
    sourceOwner: input.sourceOwner,
    destinationOwner: input.destinationOwner,
    officer: input.officer,
    status: 'Draft',
    notes: input.notes,
    lampiran: input.lampiran,
    createdDate: today,
    updatedDate: today,
  };

  MUTASI_DB[record.id] = record;
  logMutationEvent(record, 'Mutation Created');
  logMutationHistory(record, null);
  return record;
}

function getOrThrow(id: string): MutationRecord {
  const record = getMutationById(id);
  if (!record) throw new Error(`Mutation Request dengan ID "${id}" tidak ditemukan.`);
  return record;
}

/** Step 2 — Validation. Draft → Pending; runs full field + target validation. */
export function submitMutationRequest(id: string): MutationRecord {
  const record = getOrThrow(id);
  if (record.status !== 'Draft') {
    throw new Error(`Hanya Mutation Request berstatus Draft yang dapat diajukan (status saat ini: ${record.status}).`);
  }
  validateMutationRequest(record);

  const updated: MutationRecord = { ...record, status: 'Pending', updatedDate: todayLabel() };
  assertUuidIntegrity(record, updated);
  MUTASI_DB[id] = updated;
  logMutationHistory(updated, record.status);
  return updated;
}

/** Step 3 — Approval (optional). Pending → Approved. */
export function approveMutationRequest(id: string, catatan: string | null = null): MutationRecord {
  const record = getOrThrow(id);
  if (record.status !== 'Pending') {
    throw new Error(`Hanya Mutation Request berstatus Pending yang dapat disetujui (status saat ini: ${record.status}).`);
  }

  const updated: MutationRecord = { ...record, status: 'Approved', updatedDate: todayLabel() };
  assertUuidIntegrity(record, updated);
  MUTASI_DB[id] = updated;
  logMutationEvent(updated, 'Mutation Approved', catatan);
  logMutationHistory(updated, record.status, catatan);
  return updated;
}

/** Step 3b — Approval (optional). Pending → Rejected. */
export function rejectMutationRequest(id: string, catatan: string | null = null): MutationRecord {
  const record = getOrThrow(id);
  if (record.status !== 'Pending') {
    throw new Error(`Hanya Mutation Request berstatus Pending yang dapat ditolak (status saat ini: ${record.status}).`);
  }

  const updated: MutationRecord = {
    ...record,
    status: 'Rejected',
    notes: catatan ? [record.notes, catatan].filter(Boolean).join(' | ') : record.notes,
    updatedDate: todayLabel(),
  };
  assertUuidIntegrity(record, updated);
  MUTASI_DB[id] = updated;
  logMutationHistory(updated, record.status, catatan);
  pushMutationNotification(updated, 'Mutation Rejected', `Mutation Request untuk ${targetLabel(updated)} ditolak.`);
  return updated;
}

// ─── Execution side effects (MT-004) ─────────────────────────────────────────

export type MutationExecutionSkip = { livestockId: string; reason: string };

export type MutationExecutionResult = {
  mutationId: string;
  mode: MutasiMode;
  totalTargets: number;
  executed: number;
  skipped: MutationExecutionSkip[];
};

/** Applies the Completed effect (location/owner/status) for one livestock. Never throws — returns a skip reason instead. */
function applyEffectToOneLivestock(record: MutationRecord, livestockId: string): MutationExecutionSkip | null {
  const lv = getLivestock(livestockId);
  if (!lv) return { livestockId, reason: 'Livestock tidak ditemukan.' };

  const newStatus = resolveLivestockStatusEffect(record.mutationType);

  applyMutationLocationEffect({
    livestockId,
    newStatus,
    newLocation: record.destinationLocation,
    recordedDate: record.effectiveDate || todayLabel(),
  });

  if (record.destinationOwner && record.destinationOwner.trim() &&
      record.destinationOwner.trim().toLowerCase() !== (record.sourceOwner ?? '').trim().toLowerCase()) {
    addOwnershipRecord(livestockId, {
      owner: record.destinationOwner,
      workspace: record.destinationOwner,
      startDate: record.effectiveDate || todayLabel(),
      method: 'Transfer Masuk',
      notes: `Mutasi: ${record.mutationType} (Mutation Request ${record.id})`,
    });
  }

  return null;
}

/**
 * Step 4 — Execution. Pending or Approved → Completed. Approval is optional,
 * so execution is allowed directly from Pending as well as from Approved.
 * Re-validates the target still exists, then applies the Completed effect:
 * - Individual mode: updates the one livestock's location/owner/status.
 * - Batch mode: applies the same effect to every ACTIVE batch member
 *   simultaneously, skipping invalid members (e.g. deleted livestock) while
 *   continuing the rest — never partially commits the Mutation Request itself.
 * Appends to the Livestock Timeline (MUTATION_EVENT_LOG), the audit History
 * (MUTATION_HISTORY_LOG), refreshes Summary (getMutationSummary is always
 * live), and generates a Mutation Completed notification.
 */
export function executeMutationRequest(id: string): { record: MutationRecord; execution: MutationExecutionResult } {
  const record = getOrThrow(id);
  assertExecutable(record);
  assertTargetExists(record.mode, record.livestockId, record.batchId);

  const targets: string[] = record.mode === 'individu'
    ? (record.livestockId ? [record.livestockId] : [])
    : getActiveBatchMemberships(record.batchId as string).map((m) => m.livestockId);

  if (record.mode === 'batch' && targets.length === 0) {
    throw new Error('Batch ini tidak memiliki anggota aktif — tidak ada livestock untuk dieksekusi.');
  }

  const skipped: MutationExecutionSkip[] = [];
  let executed = 0;
  for (const livestockId of targets) {
    const skip = applyEffectToOneLivestock(record, livestockId);
    if (skip) skipped.push(skip);
    else executed += 1;
  }

  if (executed === 0) {
    throw new Error('Eksekusi dibatalkan: seluruh target tidak valid (' + skipped.map((s) => s.reason).join('; ') + ').');
  }

  const updated: MutationRecord = { ...record, status: 'Completed', updatedDate: todayLabel() };
  assertUuidIntegrity(record, updated);
  MUTASI_DB[id] = updated;
  logMutationEvent(updated, 'Mutation Completed');
  logMutationHistory(
    updated,
    record.status,
    skipped.length > 0 ? `${executed}/${targets.length} berhasil; dilewati: ${skipped.map((s) => s.livestockId).join(', ')}` : null,
  );
  pushMutationNotification(
    updated,
    'Mutation Completed',
    `Mutation Request untuk ${targetLabel(updated)} selesai (${executed}/${targets.length} livestock diproses).`,
  );

  return {
    record: updated,
    execution: { mutationId: updated.id, mode: updated.mode, totalTargets: targets.length, executed, skipped },
  };
}

export type BulkExecutionSkip = { mutationId: string; reason: string };

export type BulkExecutionResult = {
  total: number;
  executed: number;
  skipped: BulkExecutionSkip[];
  results: MutationExecutionResult[];
};

/**
 * Batch Mutation — executes several Mutation Requests at once (e.g. a
 * multi-select "Eksekusi Terpilih" action on the Daftar Mutasi list). Invalid
 * requests (already Completed/Cancelled/Rejected, invalid destination, etc.)
 * are skipped with a reason while the rest continue; returns a summary for
 * the UI to display.
 */
export function executeMutationRequestsBulk(ids: string[]): BulkExecutionResult {
  const skipped: BulkExecutionSkip[] = [];
  const results: MutationExecutionResult[] = [];

  for (const id of ids) {
    try {
      const { execution } = executeMutationRequest(id);
      results.push(execution);
    } catch (err) {
      skipped.push({ mutationId: id, reason: err instanceof Error ? err.message : 'Gagal dieksekusi.' });
    }
  }

  return { total: ids.length, executed: results.length, skipped, results };
}

/** Draft/Pending/Approved → Cancelled. Completed and Rejected are final and cannot be cancelled. */
export function cancelMutationRequest(id: string, catatan: string | null = null): MutationRecord {
  const record = getOrThrow(id);
  if (!OPEN_STATUSES.includes(record.status)) {
    throw new Error(`Mutation Request berstatus ${record.status} tidak dapat dibatalkan.`);
  }

  const updated: MutationRecord = {
    ...record,
    status: 'Cancelled',
    notes: catatan ? [record.notes, catatan].filter(Boolean).join(' | ') : record.notes,
    updatedDate: todayLabel(),
  };
  assertUuidIntegrity(record, updated);
  MUTASI_DB[id] = updated;
  logMutationEvent(updated, 'Mutation Cancelled', catatan);
  logMutationHistory(updated, record.status, catatan);
  pushMutationNotification(updated, 'Mutation Cancelled', `Mutation Request untuk ${targetLabel(updated)} dibatalkan.`);
  return updated;
}

// ─── Display Helpers ──────────────────────────────────────────────────────────

/** Resolves the display target (Livestock or Batch) for a Mutation Request. */
export function getMutationTarget(record: MutationRecord): { livestock: LivestockRecord | null; batch: BatchRecord | null } {
  return {
    livestock: record.mode === 'individu' && record.livestockId ? getLivestock(record.livestockId) : null,
    batch: record.mode === 'batch' && record.batchId ? getBatch(record.batchId) : null,
  };
}
