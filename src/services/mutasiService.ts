// ─── Mutasi Service — FLOW-003M15 ────────────────────────────────────────────
//
// Fire-and-forget Supabase dual-write for the Mutasi module.
// Called from Mutasi.tsx after createMutationRequest() + submitMutationRequest()
// succeed (Phase 1, in-memory). Failure is logged but never blocks the UI.
//
// Tables covered:
//   mutation_requests (insert — individu mode only)
//
// Limitations:
//   - Batch mode skipped: expanding batch member IDs to Supabase livestock
//     UUIDs requires live batch member query — deferred (M17+).
//   - livestock_ids[] requires Supabase UUID format — non-UUID in-memory IDs
//     (seed livestock: SAP-J-000001-KAY pattern) are detected and skipped.
//   - The mutation request id (generateUUID() from in-memory) is reused as the
//     Supabase row id for consistent cross-session traceability.

import {
  repoInsertMutationRequest,
  repoUpdateMutationStatus,
  LivestockRepoError,
} from '../repositories/livestockRepository';
import type { MutationRecord } from '../data/mutasiData';

// ─── Service result ───────────────────────────────────────────────────────────

export type MutasiServiceResult<T = { id: string }> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

function ok<T>(data: T): MutasiServiceResult<T>     { return { ok: true, data }; }
function fail<T>(msg: string): MutasiServiceResult<T> { return { ok: false, error: msg }; }

// ─── UUID guard ───────────────────────────────────────────────────────────────
// Detects whether a string is a Supabase-loaded UUID vs a seed in-memory ID.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(val: string | null | undefined): val is string {
  return !!val && UUID_RE.test(val);
}

// ─── Status mapper ────────────────────────────────────────────────────────────
// MutationStatus values are identical to mutation_status_enum — direct cast.

type DbMutationStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';

function mapStatus(status: MutationRecord['status']): DbMutationStatus {
  return status as DbMutationStatus;
}

// ─── updateMutationStatus ─────────────────────────────────────────────────────
// Called after any lifecycle transition (Approve, Execute, Reject, Cancel) that
// happens AFTER the initial insert. Silently skips if `id` is not a UUID (row
// was never inserted because the livestock UUID guard failed in recordMutationRequest).

export async function updateMutationStatus(
  id: string,
  status: DbMutationStatus,
): Promise<MutasiServiceResult<Record<string, never>>> {
  if (!id)        return fail('id diperlukan.');
  if (!isUUID(id)) return ok({});  // was never inserted — nothing to update

  try {
    const { error } = await repoUpdateMutationStatus(id, status);
    if (error) {
      console.warn('[mutasiService] repoUpdateMutationStatus failed:', error);
      return fail(error);
    }
    return ok({});
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : String(err);
    console.error('[mutasiService] updateMutationStatus error:', msg);
    return fail(msg);
  }
}

// ─── recordMutationRequest ────────────────────────────────────────────────────
// Called by Mutasi.tsx (MutasiFormSheet) after submitMutationRequest() succeeds.
//
// Individu mode only — livestock_id must be a Supabase UUID.
// Batch mode silently skipped (members can't be resolved to UUIDs here).

export async function recordMutationRequest(
  workspaceId: string,
  userId: string | null,
  record: MutationRecord,
): Promise<MutasiServiceResult<Record<string, never>>> {
  if (!workspaceId) return fail('workspaceId diperlukan untuk dual-write mutation request.');

  // Only individu mode — batch member expansion deferred
  if (record.mode !== 'individu') return ok({});

  // Mutation record id must be UUID (from generateUUID())
  if (!isUUID(record.id)) return ok({});

  // livestockId must be Supabase UUID — seed livestock silently skipped
  if (!isUUID(record.livestockId)) return ok({});

  try {
    const { error } = await repoInsertMutationRequest({
      id:             record.id,
      workspace_id:   workspaceId,
      livestock_ids:  [record.livestockId],
      mutation_type:  'Individual',
      status:         mapStatus(record.status),
      effective_date: record.effectiveDate || null,
      reason:         record.mutationType  || null,   // MutationType string as reason
      notes:          record.notes         || null,
      requested_by:   userId,
    });

    if (error) {
      console.warn('[mutasiService] repoInsertMutationRequest failed:', error);
      return fail(error);
    }
    return ok({});
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : String(err);
    console.error('[mutasiService] recordMutationRequest error:', msg);
    return fail(msg);
  }
}
