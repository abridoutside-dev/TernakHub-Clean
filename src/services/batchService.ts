// ─── Batch Service — FLOW-003M12 / FLOW-003M17 ───────────────────────────────
//
// Fire-and-forget Supabase dual-write for the Batch module.
// Called after each successful in-memory mutation in batchData.ts / caller pages.
// Failure is logged but never blocks the UI.
//
// Tables covered (FLOW-003M12):
//   batches (insert, patch)
//   batch_members (insert, soft-remove)
//
// Tables covered (FLOW-003M17):
//   batch_history (insert — lifecycle + member events)
//   batch_operations (insert — execution audit trail)

import {
  repoInsertBatch,
  repoPatchBatch,
  repoInsertBatchMember,
  repoRemoveBatchMember,
  repoInsertBatchHistory,
  repoInsertBatchOperation,
  repoGetBatchOperationsByWorkspace,
  LivestockRepoError,
} from '../repositories/livestockRepository';
import type {
  BatchCreateInput,
  BatchPatchInput,
  DbBatchStatus,
  BatchHistoryCreateInput,
  BatchOperationCreateInput,
  BatchOperationDbRow,
} from '../types/livestock';
import type { BatchRecord, MembershipRecord } from '../data/batchData';
import {
  BATCH_OPERATION_LOG,
  type BatchOperationLogEntry,
  type BatchOperationType,
  type BatchOperationStatus,
  type BatchOperationSkip,
} from '../data/batchOperationsData';

// ─── Service result ───────────────────────────────────────────────────────────

export type BatchServiceResult<T = { id: string }> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

function ok<T>(data: T): BatchServiceResult<T> { return { ok: true, data }; }
function fail<T>(msg: string): BatchServiceResult<T> { return { ok: false, error: msg }; }

// ─── Status mapper ────────────────────────────────────────────────────────────

function mapBatchStatus(status: BatchRecord['status']): DbBatchStatus | null {
  switch (status) {
    case 'Aktif':      return 'Aktif';
    case 'Selesai':    return 'Selesai';
    case 'Diarsipkan': return 'Diarsipkan';
    default:           return null; // 'Draft' | 'Dibatalkan' not in DB enum
  }
}

// ─── recordCreateBatch ────────────────────────────────────────────────────────
// Persist a newly created BatchRecord to `batches`.
// workspaceId + userId are required because BatchRecord has no workspace context.

export async function recordCreateBatch(
  workspaceId: string,
  userId: string,
  record: BatchRecord,
): Promise<BatchServiceResult> {
  if (!workspaceId || !userId || !record.id) {
    return fail('recordCreateBatch: missing workspaceId, userId, or record.id');
  }

  const input: BatchCreateInput = {
    label:           record.label,
    species:         record.livestockType || null,
    start_date:      record.startDate     || null,
    target_weight_kg: null,
    notes:           record.description   || null,
  };

  try {
    const row = await repoInsertBatch(workspaceId, userId, input);
    return ok({ id: row.id });
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : String(err);
    console.error('[batchService] recordCreateBatch failed:', msg);
    return fail(msg);
  }
}

// ─── recordUpdateBatch ────────────────────────────────────────────────────────
// Sync a partial batch update to `batches`.

export async function recordUpdateBatch(
  batchId: string,
  patch: Partial<Pick<BatchRecord, 'label' | 'status' | 'finishedDate' | 'description'>>,
): Promise<BatchServiceResult> {
  if (!batchId) return fail('recordUpdateBatch: missing batchId');

  const dbPatch: BatchPatchInput = {};
  if (patch.label       !== undefined) dbPatch.label         = patch.label;
  if (patch.description !== undefined) dbPatch.notes         = patch.description || null;
  if (patch.finishedDate !== undefined) dbPatch.finished_date = patch.finishedDate || null;
  if (patch.status !== undefined) {
    const mapped = mapBatchStatus(patch.status);
    if (mapped) dbPatch.status = mapped;
  }

  if (Object.keys(dbPatch).length === 0) return ok({ id: batchId });

  try {
    await repoPatchBatch(batchId, dbPatch);
    return ok({ id: batchId });
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : String(err);
    console.error('[batchService] recordUpdateBatch failed:', msg);
    return fail(msg);
  }
}

// ─── recordFinishBatch ────────────────────────────────────────────────────────

export async function recordFinishBatch(
  batchId: string,
  finishedDate: string | null,
): Promise<BatchServiceResult> {
  return recordUpdateBatch(batchId, { status: 'Selesai', finishedDate });
}

// ─── recordArchiveBatch ───────────────────────────────────────────────────────

export async function recordArchiveBatch(
  batchId: string,
): Promise<BatchServiceResult> {
  return recordUpdateBatch(batchId, { status: 'Diarsipkan' });
}

// ─── recordAddBatchMember ─────────────────────────────────────────────────────
// Persist a new batch membership to `batch_members`.

export async function recordAddBatchMember(
  batchId: string,
  livestockId: string,
): Promise<BatchServiceResult> {
  if (!batchId || !livestockId) {
    return fail('recordAddBatchMember: missing batchId or livestockId');
  }

  try {
    const row = await repoInsertBatchMember(batchId, livestockId);
    return ok({ id: row.id });
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : String(err);
    console.error('[batchService] recordAddBatchMember failed:', msg);
    return fail(msg);
  }
}

// ─── recordRemoveBatchMember ──────────────────────────────────────────────────
// Soft-remove a batch member (sets removed_date) in `batch_members`.

export async function recordRemoveBatchMember(
  _membership: MembershipRecord,
  batchId: string,
  livestockId: string,
  reason: string | null,
): Promise<BatchServiceResult> {
  if (!batchId || !livestockId) {
    return fail('recordRemoveBatchMember: missing batchId or livestockId');
  }

  try {
    await repoRemoveBatchMember(batchId, livestockId, reason);
    return ok({ id: `${batchId}:${livestockId}` });
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : String(err);
    console.error('[batchService] recordRemoveBatchMember failed:', msg);
    return fail(msg);
  }
}

// ─── recordBatchHistoryEvent ──────────────────────────────────────────────────
// Append a lifecycle / member event to `batch_history`.
// event_data is a free-form JSON payload — keep it small and serialisable.

export async function recordBatchHistoryEvent(
  batchId: string,
  eventType: string,
  eventData: Record<string, unknown> | null,
  performedBy: string | null,
): Promise<BatchServiceResult> {
  if (!batchId || !eventType) {
    return fail('recordBatchHistoryEvent: missing batchId or eventType');
  }

  const input: BatchHistoryCreateInput = {
    batch_id:     batchId,
    event_type:   eventType,
    event_data:   eventData,
    performed_by: performedBy,
  };

  try {
    const row = await repoInsertBatchHistory(input);
    return ok({ id: row.id });
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : String(err);
    console.error('[batchService] recordBatchHistoryEvent failed:', msg);
    return fail(msg);
  }
}

// ─── fetchBatchOperationsFromDb ──────────────────────────────────────────────
// Reads all batch_operations for a workspace from Supabase and merges them into
// the in-memory BATCH_OPERATION_LOG.  Called by useBatch on mount so that
// BatchRiwayat / BatchList analytics reflect historical data, not just the
// current session's in-flight writes.

function dbRowToLogEntry(row: BatchOperationDbRow): BatchOperationLogEntry {
  const opData = (row.operation_data ?? {}) as Record<string, unknown>;
  return {
    id:               row.id,
    batchId:          row.batch_id,
    type:             (row.operation_type as BatchOperationType),
    label:            typeof opData.label        === 'string' ? opData.label        : row.operation_type,
    status:           (row.status as BatchOperationStatus)     ?? 'Completed',
    totalTargets:     typeof opData.totalTargets === 'number'  ? opData.totalTargets : 0,
    succeeded:        typeof opData.succeeded    === 'number'  ? opData.succeeded    : 0,
    failed:           Array.isArray(opData.failed)             ? (opData.failed as BatchOperationSkip[]) : [],
    createdRecordIds: Array.isArray(opData.createdRecordIds)   ? (opData.createdRecordIds as string[])   : [],
    startedAt:        typeof opData.startedAt    === 'string'  ? opData.startedAt    : (row.performed_at ?? row.created_at),
    completedAt:      typeof opData.completedAt  === 'string'  ? opData.completedAt  : (row.performed_at ?? row.created_at),
    officer:          row.performed_by ?? null,
    notes:            typeof opData.notes        === 'string'  ? opData.notes        : null,
  };
}

export async function fetchBatchOperationsFromDb(
  workspaceId: string,
): Promise<BatchServiceResult<{ count: number }>> {
  if (!workspaceId) return fail('fetchBatchOperationsFromDb: missing workspaceId');

  try {
    const rows = await repoGetBatchOperationsByWorkspace(workspaceId);

    // Merge into BATCH_OPERATION_LOG — skip IDs already present from the
    // current session to avoid duplicates after a hot-write + remount cycle.
    const existingIds = new Set(BATCH_OPERATION_LOG.map((e) => e.id));
    for (const row of rows) {
      if (!existingIds.has(row.id)) {
        BATCH_OPERATION_LOG.push(dbRowToLogEntry(row));
      }
    }

    return ok({ count: rows.length });
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : String(err);
    console.error('[batchService] fetchBatchOperationsFromDb failed:', msg);
    return fail(msg);
  }
}

// ─── recordBatchOperation ─────────────────────────────────────────────────────
// Persist a completed BatchOperationLogEntry to `batch_operations`.
// Maps the in-memory entry to the DB row shape.

export async function recordBatchOperation(
  entry: BatchOperationLogEntry,
  performedBy: string | null,
): Promise<BatchServiceResult> {
  if (!entry.batchId || !entry.type) {
    return fail('recordBatchOperation: missing batchId or operation type');
  }

  const input: BatchOperationCreateInput = {
    batch_id:       entry.batchId,
    operation_type: entry.type,
    status:         entry.status,
    // target_livestock_ids would require UUID mapping from in-memory IDs;
    // createdRecordIds are in-memory UUIDs already — store as operation_data instead.
    target_livestock_ids: null,
    operation_data: {
      label:            entry.label,
      totalTargets:     entry.totalTargets,
      succeeded:        entry.succeeded,
      failed:           entry.failed,
      createdRecordIds: entry.createdRecordIds,
      notes:            entry.notes,
      startedAt:        entry.startedAt,
      completedAt:      entry.completedAt,
    },
    performed_by: performedBy,
    performed_at: entry.completedAt,
  };

  try {
    const row = await repoInsertBatchOperation(input);
    return ok({ id: row.id });
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : String(err);
    console.error('[batchService] recordBatchOperation failed:', msg);
    return fail(msg);
  }
}
