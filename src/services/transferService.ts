// ─── Transfer Service — FLOW-003M12 ──────────────────────────────────────────
//
// Fire-and-forget Supabase dual-write for the Transfer module.
// Called after each successful in-memory mutation in transferData.ts.
// Failure is logged but never blocks the UI.
//
// Tables covered:
//   livestock_transfers (insert — all three transfer types)
//
// Deferred:
//   mutation_requests — MutationRecord uses string UUIDs but livestock_ids[] in
//   the schema requires live Supabase livestock UUIDs, not in-memory IDs (M13+)

import {
  repoInsertTransfer,
  LivestockRepoError,
} from '../repositories/livestockRepository';
import type {
  LivestockTransferCreateInput,
  DbTransferType,
  DbArchiveReason,
} from '../types/livestock';
import type { TransferRecord, PermanentTransferReason } from '../data/transferData';

// ─── Service result ───────────────────────────────────────────────────────────

export type TransferServiceResult<T = { id: string }> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

function ok<T>(data: T): TransferServiceResult<T> { return { ok: true, data }; }
function fail<T>(msg: string): TransferServiceResult<T> { return { ok: false, error: msg }; }

// ─── Reason mappers ───────────────────────────────────────────────────────────

function mapArchiveReason(reason: PermanentTransferReason): DbArchiveReason {
  switch (reason) {
    case 'Penjualan':     return 'Terjual';
    case 'Rumah Potong':  return 'Terjual';
    case 'Mati':          return 'Mati';
    case 'Hilang':        return 'Mati';
    case 'Hibah':         return 'Hibah';
    default:              return 'Terjual';
  }
}

function toIso(label: string): string {
  // in-memory date labels are YYYY-MM-DD already for new records; handle Indonesian labels gracefully
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) return label;
  return new Date().toISOString().split('T')[0]; // fallback to today
}

// ─── recordTempTransfer ───────────────────────────────────────────────────────
// Persist a Keluar Sementara record to `livestock_transfers`.

export async function recordTempTransfer(
  workspaceId: string,
  record: TransferRecord,
): Promise<TransferServiceResult> {
  if (!workspaceId || !record.livestockId) {
    return fail('recordTempTransfer: missing workspaceId or livestockId');
  }

  const input: LivestockTransferCreateInput = {
    livestock_id:   record.livestockId,
    workspace_id:   workspaceId,
    transfer_type:  'Keluar Sementara' as DbTransferType,
    from_location:  null,
    to_location:    record.destinationName || null,
    destination:    record.destinationName || null,
    reason:         record.reason || null,
    archive_reason: null,
    notes:          record.notes,
    transfer_date:  toIso(record.departDate),
    return_date:    null,
  };

  try {
    const row = await repoInsertTransfer(input);
    return ok({ id: row.id });
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : String(err);
    console.error('[transferService] recordTempTransfer failed:', msg);
    return fail(msg);
  }
}

// ─── recordReturn ─────────────────────────────────────────────────────────────
// Persist a Masuk Kembali record to `livestock_transfers`.

export async function recordReturn(
  workspaceId: string,
  record: TransferRecord,
): Promise<TransferServiceResult> {
  if (!workspaceId || !record.livestockId) {
    return fail('recordReturn: missing workspaceId or livestockId');
  }

  const input: LivestockTransferCreateInput = {
    livestock_id:   record.livestockId,
    workspace_id:   workspaceId,
    transfer_type:  'Masuk Kembali' as DbTransferType,
    from_location:  null,
    to_location:    null,
    destination:    null,
    reason:         null,
    archive_reason: null,
    notes:          record.notes,
    transfer_date:  toIso(record.departDate),
    return_date:    null,
  };

  try {
    const row = await repoInsertTransfer(input);
    return ok({ id: row.id });
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : String(err);
    console.error('[transferService] recordReturn failed:', msg);
    return fail(msg);
  }
}

// ─── recordPermanentTransfer ──────────────────────────────────────────────────
// Persist a Keluar Permanen record to `livestock_transfers`.
// archiveReason is required for Keluar Permanen per schema constraint.

export async function recordPermanentTransfer(
  workspaceId: string,
  record: TransferRecord,
  archiveReason: PermanentTransferReason,
): Promise<TransferServiceResult> {
  if (!workspaceId || !record.livestockId) {
    return fail('recordPermanentTransfer: missing workspaceId or livestockId');
  }

  const input: LivestockTransferCreateInput = {
    livestock_id:   record.livestockId,
    workspace_id:   workspaceId,
    transfer_type:  'Keluar Permanen' as DbTransferType,
    from_location:  null,
    to_location:    record.destinationName || null,
    destination:    record.destinationName || null,
    reason:         record.reason || null,
    archive_reason: mapArchiveReason(archiveReason),
    notes:          record.notes,
    transfer_date:  toIso(record.departDate),
    return_date:    null,
  };

  try {
    const row = await repoInsertTransfer(input);
    return ok({ id: row.id });
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : String(err);
    console.error('[transferService] recordPermanentTransfer failed:', msg);
    return fail(msg);
  }
}
