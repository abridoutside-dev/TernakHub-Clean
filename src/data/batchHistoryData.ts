/**
 * batchHistoryData.ts  (BT-005)
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified immutable history for the Batch module.
 *
 * Aggregates from four canonical sources (newest → oldest):
 *   1. BATCH_DB        — batch_created, batch_updated lifecycle events
 *   2. MEMBERSHIP_DB   — member_added, member_removed, member_moved events
 *   3. BATCH_OPERATION_LOG — weight_recording, batch_feeding, health_activity,
 *                            batch_mutation, batch_relocation, batch_observation
 *   4. BATCH_TIMELINE_LOG  — batch_closed, batch_archived
 *
 * History is READ ONLY. No mutations here.
 * No chart components — chart-ready datasets live in batchAnalyticsData.ts.
 */

import {
  BATCH_DB,
  MEMBERSHIP_DB,
  BATCH_TIMELINE_LOG,
  getBatch,
  type BatchRecord,
} from './batchData';
import {
  BATCH_OPERATION_LOG,
  type BatchOperationType,
} from './batchOperationsData';
import { LIVESTOCK_DB } from './livestockData';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BatchHistoryEventType =
  | 'batch_created'
  | 'batch_updated'
  | 'member_added'
  | 'member_removed'
  | 'member_moved'
  | 'weight_recording'
  | 'batch_feeding'
  | 'health_activity'
  | 'batch_mutation'
  | 'batch_relocation'
  | 'batch_observation'
  | 'batch_closed'
  | 'batch_archived';

export const HISTORY_EVENT_LABELS: Record<BatchHistoryEventType, string> = {
  batch_created:     'Batch Dibuat',
  batch_updated:     'Batch Diperbarui',
  member_added:      'Anggota Ditambahkan',
  member_removed:    'Anggota Dikeluarkan',
  member_moved:      'Anggota Dipindahkan',
  weight_recording:  'Pencatatan Bobot Batch',
  batch_feeding:     'Pemberian Pakan Batch',
  health_activity:   'Aktivitas Kesehatan Batch',
  batch_mutation:    'Mutasi Batch',
  batch_relocation:  'Relokasi Batch',
  batch_observation: 'Observasi Batch',
  batch_closed:      'Batch Ditutup',
  batch_archived:    'Batch Diarsipkan',
};

export const HISTORY_EVENT_ICONS: Record<BatchHistoryEventType, string> = {
  batch_created:     '🆕',
  batch_updated:     '✏️',
  member_added:      '➕',
  member_removed:    '➖',
  member_moved:      '🔀',
  weight_recording:  '⚖️',
  batch_feeding:     '🌾',
  health_activity:   '🏥',
  batch_mutation:    '🔄',
  batch_relocation:  '📍',
  batch_observation: '👁️',
  batch_closed:      '✅',
  batch_archived:    '📦',
};

export type BatchHistoryEvent = {
  id: string;
  eventType: BatchHistoryEventType;
  displayDate: string;         // Indonesian date label for display  e.g. "7 Juli 2026"
  sortKey: number;             // epoch ms — used for newest-first ordering
  batchId: string;
  batchName: string | null;
  batchLabel: string;          // display-safe: name ?? id
  officer: string | null;
  affectedLivestockIds: string[];
  affectedLivestockNames: string[];
  notes: string | null;
  attachments: string[];       // Global Media UUIDs — always [] until media extended
  sourceKind: 'registry' | 'membership' | 'operation' | 'timeline';
  sourceId: string;            // UUID / stable key of the originating record
};

export type BatchHistoryFilter = {
  query?: string;
  eventType?: BatchHistoryEventType | '';
  batchId?: string;
  officer?: string;
  dateFrom?: string;   // yyyy-mm-dd
  dateTo?: string;     // yyyy-mm-dd
  batchStatus?: string;
};

// ─── Date Utilities ───────────────────────────────────────────────────────────

const ID_MONTH: Record<string, number> = {
  Januari: 0, Februari: 1, Maret: 2, April: 3, Mei: 4, Juni: 5,
  Juli: 6, Agustus: 7, September: 8, Oktober: 9, November: 10, Desember: 11,
};

/** Parse an Indonesian date label ("7 Juli 2026") to epoch ms. Returns 0 on failure. */
export function parseIdDate(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.trim().split(' ');
  if (parts.length !== 3) return 0;
  const day   = parseInt(parts[0], 10);
  const month = ID_MONTH[parts[1]];
  const year  = parseInt(parts[2], 10);
  if (isNaN(day) || month === undefined || isNaN(year)) return 0;
  return new Date(year, month, day).getTime();
}

/** Format an ISO timestamp to an Indonesian date label. */
export function isoToIdDate(iso: string): string {
  const d = new Date(iso);
  const MONTHS = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
  ];
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Convert a yyyy-mm-dd date-input value to epoch ms (local midnight). */
export function inputDateToMs(dateStr: string): number {
  if (!dateStr) return 0;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return 0;
  return new Date(y, m - 1, d).getTime();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveBatch(batchId: string): BatchRecord | null {
  return BATCH_DB[batchId] ?? null;
}

function resolveBatchLabel(batch: BatchRecord | null, fallback: string): string {
  return batch?.name ?? fallback;
}

// ─── Source Builders ─────────────────────────────────────────────────────────

/** 'batch_created' — one event per batch in BATCH_DB. */
function buildCreatedEvents(): BatchHistoryEvent[] {
  return Object.values(BATCH_DB).map((batch, idx) => ({
    id: `hist-created-${batch.id}`,
    eventType: 'batch_created' as const,
    displayDate: batch.createdDate,
    sortKey: parseIdDate(batch.createdDate) + idx,
    batchId: batch.id,
    batchName: batch.name,
    batchLabel: resolveBatchLabel(batch, batch.id),
    officer: null,
    affectedLivestockIds: [],
    affectedLivestockNames: [],
    notes: batch.description,
    attachments: [],
    sourceKind: 'registry' as const,
    sourceId: batch.id,
  }));
}

/** 'batch_updated' — one event per batch where updatedDate !== createdDate. */
function buildUpdatedEvents(): BatchHistoryEvent[] {
  return Object.values(BATCH_DB)
    .filter((b) => b.updatedDate && b.updatedDate !== b.createdDate)
    .map((batch, idx) => ({
      id: `hist-updated-${batch.id}`,
      eventType: 'batch_updated' as const,
      displayDate: batch.updatedDate,
      sortKey: parseIdDate(batch.updatedDate) + idx + 0.5,
      batchId: batch.id,
      batchName: batch.name,
      batchLabel: resolveBatchLabel(batch, batch.id),
      officer: null,
      affectedLivestockIds: [],
      affectedLivestockNames: [],
      notes: null,
      attachments: [],
      sourceKind: 'registry' as const,
      sourceId: `${batch.id}-updated`,
    }));
}

/** 'member_added' — one event per MEMBERSHIP_DB record (covers all statuses — joinDate is immutable). */
function buildMemberAddedEvents(): BatchHistoryEvent[] {
  return MEMBERSHIP_DB.map((m, idx) => {
    const lv    = LIVESTOCK_DB[m.livestockId];
    const batch = resolveBatch(m.batchId);
    return {
      id: `hist-member-add-${m.id}`,
      eventType: 'member_added' as const,
      displayDate: m.joinDate,
      sortKey: parseIdDate(m.joinDate) + idx,
      batchId: m.batchId,
      batchName: batch?.name ?? null,
      batchLabel: resolveBatchLabel(batch, m.batchId),
      officer: null,
      affectedLivestockIds: [m.livestockId],
      affectedLivestockNames: [lv?.name ?? m.livestockId],
      notes: m.notes,
      attachments: [],
      sourceKind: 'membership' as const,
      sourceId: m.id,
    };
  });
}

/** 'member_removed' — membership records with status 'Keluar'. */
function buildMemberRemovedEvents(): BatchHistoryEvent[] {
  return MEMBERSHIP_DB
    .filter((m) => m.status === 'Keluar' && m.leaveDate)
    .map((m, idx) => {
      const lv    = LIVESTOCK_DB[m.livestockId];
      const batch = resolveBatch(m.batchId);
      return {
        id: `hist-member-rem-${m.id}`,
        eventType: 'member_removed' as const,
        displayDate: m.leaveDate!,
        sortKey: parseIdDate(m.leaveDate!) + idx,
        batchId: m.batchId,
        batchName: batch?.name ?? null,
        batchLabel: resolveBatchLabel(batch, m.batchId),
        officer: null,
        affectedLivestockIds: [m.livestockId],
        affectedLivestockNames: [lv?.name ?? m.livestockId],
        notes: m.notes,
        attachments: [],
        sourceKind: 'membership' as const,
        sourceId: `${m.id}-keluar`,
      };
    });
}

/** 'member_moved' — membership records with status 'Dipindahkan' (source batch perspective). */
function buildMemberMovedEvents(): BatchHistoryEvent[] {
  return MEMBERSHIP_DB
    .filter((m) => m.status === 'Dipindahkan' && m.leaveDate)
    .map((m, idx) => {
      const lv    = LIVESTOCK_DB[m.livestockId];
      const batch = resolveBatch(m.batchId);
      return {
        id: `hist-member-mov-${m.id}`,
        eventType: 'member_moved' as const,
        displayDate: m.leaveDate!,
        sortKey: parseIdDate(m.leaveDate!) + idx,
        batchId: m.batchId,
        batchName: batch?.name ?? null,
        batchLabel: resolveBatchLabel(batch, m.batchId),
        officer: null,
        affectedLivestockIds: [m.livestockId],
        affectedLivestockNames: [lv?.name ?? m.livestockId],
        notes: m.notes,
        attachments: [],
        sourceKind: 'membership' as const,
        sourceId: `${m.id}-moved`,
      };
    });
}

const OP_EVENT_MAP: Partial<Record<BatchOperationType, BatchHistoryEventType>> = {
  RecordWeight:      'weight_recording',
  FeedBatch:         'batch_feeding',
  HealthCheck:       'health_activity',
  HealthTreatment:   'health_activity',
  BatchMutation:     'batch_mutation',
  BatchRelocation:   'batch_relocation',
  BatchObservation:  'batch_observation',
};

/** Events derived from BATCH_OPERATION_LOG — one entry per completed operation. */
function buildOperationEvents(): BatchHistoryEvent[] {
  return BATCH_OPERATION_LOG.map((op) => {
    const eventType = OP_EVENT_MAP[op.type] ?? 'health_activity';
    const batch = resolveBatch(op.batchId);
    const sortKey = new Date(op.startedAt).getTime();
    const displayDate = isoToIdDate(op.startedAt);
    const statusNote = `${op.label}: ${op.succeeded}/${op.totalTargets} anggota berhasil`;
    return {
      id: `hist-op-${op.id}`,
      eventType,
      displayDate,
      sortKey,
      batchId: op.batchId,
      batchName: batch?.name ?? null,
      batchLabel: resolveBatchLabel(batch, op.batchId),
      officer: op.officer,
      affectedLivestockIds: [],
      affectedLivestockNames: [],
      notes: op.notes ? `${statusNote} — ${op.notes}` : statusNote,
      attachments: [],
      sourceKind: 'operation' as const,
      sourceId: op.id,
    };
  });
}

/** 'batch_closed' and 'batch_archived' from BATCH_TIMELINE_LOG. */
function buildLifecycleEvents(): BatchHistoryEvent[] {
  return BATCH_TIMELINE_LOG
    .filter((e) => e.type === 'batch_closed' || e.type === 'batch_archived')
    .map((e, idx) => {
      const eventType: BatchHistoryEventType =
        e.type === 'batch_closed' ? 'batch_closed' : 'batch_archived';
      const batch = resolveBatch(e.batchId);
      return {
        id: `hist-tl-${e.id}`,
        eventType,
        displayDate: e.date,
        sortKey: parseIdDate(e.date) + idx,
        batchId: e.batchId,
        batchName: batch?.name ?? null,
        batchLabel: resolveBatchLabel(batch, e.batchId),
        officer: null,
        affectedLivestockIds: e.livestockId ? [e.livestockId] : [],
        affectedLivestockNames: e.livestockName ? [e.livestockName] : [],
        notes: e.notes,
        attachments: [],
        sourceKind: 'timeline' as const,
        sourceId: e.id,
      };
    });
}

// ─── Main History Accessor ────────────────────────────────────────────────────

/**
 * Returns ALL batch history events, merged from all sources, sorted newest → oldest.
 * History is immutable — call this function fresh each time (reads live data).
 */
export function getAllBatchHistory(): BatchHistoryEvent[] {
  const events: BatchHistoryEvent[] = [
    ...buildCreatedEvents(),
    ...buildUpdatedEvents(),
    ...buildMemberAddedEvents(),
    ...buildMemberRemovedEvents(),
    ...buildMemberMovedEvents(),
    ...buildOperationEvents(),
    ...buildLifecycleEvents(),
  ];

  // Sort newest → oldest
  events.sort((a, b) => b.sortKey - a.sortKey);

  return events;
}

/**
 * Returns history events for a specific batch, newest → oldest.
 */
export function getBatchHistory(batchId: string): BatchHistoryEvent[] {
  return getAllBatchHistory().filter((e) => e.batchId === batchId);
}

/**
 * Filtered history query. All filters are AND-combined.
 * Supply only the fields you want to filter on; omit others.
 */
export function queryBatchHistory(filter: BatchHistoryFilter): BatchHistoryEvent[] {
  const all = getAllBatchHistory();
  const q = filter.query?.trim().toLowerCase() ?? '';
  const fromMs = filter.dateFrom ? inputDateToMs(filter.dateFrom) : 0;
  const toMs   = filter.dateTo   ? inputDateToMs(filter.dateTo) + 86_400_000 - 1 : Infinity;

  return all.filter((e) => {
    // Text search across batch name, event type label, officer, notes, livestock names
    if (q) {
      const haystack = [
        e.batchLabel, e.batchId,
        HISTORY_EVENT_LABELS[e.eventType],
        e.officer ?? '',
        e.notes ?? '',
        ...e.affectedLivestockNames,
      ].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // Event type filter
    if (filter.eventType && e.eventType !== filter.eventType) return false;

    // Batch filter
    if (filter.batchId && e.batchId !== filter.batchId) return false;

    // Officer filter (contains match)
    if (filter.officer) {
      const off = filter.officer.trim().toLowerCase();
      if (!e.officer?.toLowerCase().includes(off)) return false;
    }

    // Date range filter (sortKey is epoch ms)
    if (fromMs && e.sortKey < fromMs) return false;
    if (isFinite(toMs) && e.sortKey > toMs) return false;

    // Batch status filter
    if (filter.batchStatus && filter.batchStatus !== 'Semua Status') {
      const batch = resolveBatch(e.batchId);
      if (batch?.status !== filter.batchStatus) return false;
    }

    return true;
  });
}

/** Returns a de-duplicated list of officers referenced in the history. */
export function getKnownOfficers(): string[] {
  const seen = new Set<string>();
  for (const op of BATCH_OPERATION_LOG) {
    if (op.officer) seen.add(op.officer);
  }
  return Array.from(seen).sort();
}
