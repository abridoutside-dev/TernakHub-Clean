// ─── Livestock Service — FLOW-002M2 ──────────────────────────────────────────
//
// Business logic layer for the Livestock module.
// All mutations must go through this service — never call the repository
// directly from pages or hooks.
//
// Rules:
//  - No React imports.
//  - Validation is synchronous; persistence is async.
//  - Non-critical side effects (extended metadata, pedigree, batch) are
//    logged on failure but never block the core livestock creation.
//  - Supabase is SSOT; callers must refresh() after any mutation.

import type {
  LivestockDbRow,
  LivestockCreateInput,
  LivestockExtendedMetadataCreateInput,
  LivestockPatchInput,
  WeightEntryCreateInput,
  WeightEntryDbRow,
  BatchDbRow,
  BatchCreateInput,
  BatchPatchInput,
  DbArchiveReason,
} from '../types/livestock';

import {
  repoInsertLivestock,
  repoUpsertLivestockExtended,
  repoPatchLivestock,
  repoArchiveLivestock,
  repoInsertPedigreeLink,
  repoInsertWeightEntry,
  repoInsertBatch,
  repoInsertBatchMember,
  repoRemoveBatchMember,
  repoInsertTransfer,
  repoPatchBatch,
  LivestockRepoError,
} from '../repositories/livestockRepository';
import {
  repoDeleteLivestockPhoto,
  repoSetLivestockPrimaryPhoto,
} from '../repositories/mediaRepository';

// ─── Error type ───────────────────────────────────────────────────────────────

export class LivestockServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LivestockServiceError';
  }
}

// ─── Service result ───────────────────────────────────────────────────────────

export type LivestockServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function ok<T>(data: T): LivestockServiceResult<T> {
  return { ok: true, data };
}

function fail<T>(message: string): LivestockServiceResult<T> {
  return { ok: false, error: message };
}

// ─── Livestock CRUD ────────────────────────────────────────────────────────────

export interface CreateLivestockOptions {
  workspaceId: string;
  /** auth.users.id of the registering user */
  userId: string;
  core: LivestockCreateInput;
  /** Optional extended metadata (ear tags, physical traits, purchase info). */
  extended?: LivestockExtendedMetadataCreateInput | null;
  /** Dam (Induk / Ibu) livestock UUID — null when unknown. */
  damId?: string | null;
  /** Sire (Pejantan / Ayah) livestock UUID — null when unknown. */
  sireId?: string | null;
  /** Batch UUID to auto-enroll the new livestock in, optional. */
  batchId?: string | null;
}

/**
 * Register a new livestock animal in Supabase.
 *
 * Core record is always created first (atomic).
 * Extended metadata, pedigree links, and batch membership are created
 * as non-fatal side effects — their failure does not roll back the core insert.
 */
export async function createLivestock(
  options: CreateLivestockOptions,
): Promise<LivestockServiceResult<LivestockDbRow>> {
  const { workspaceId, userId: _userId, core, extended, damId, sireId, batchId } = options;

  if (!workspaceId) return fail('Workspace diperlukan.');
  if (!core.species?.trim()) return fail('Jenis ternak diperlukan.');

  let livestock: LivestockDbRow;
  try {
    livestock = await repoInsertLivestock(workspaceId, core);
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : 'Gagal mendaftarkan ternak.';
    return fail(msg);
  }

  // Extended metadata — non-fatal
  if (extended && Object.values(extended).some((v) => v != null)) {
    try {
      await repoUpsertLivestockExtended(livestock.id, extended);
    } catch (err) {
      console.error('[LivestockService] Extended metadata insert failed:', err);
    }
  }

  // Dam pedigree link — non-fatal
  if (damId) {
    try {
      await repoInsertPedigreeLink(livestock.id, damId, 'Induk');
    } catch (err) {
      console.error('[LivestockService] Dam pedigree link failed:', err);
    }
  }

  // Sire pedigree link — non-fatal
  if (sireId) {
    try {
      await repoInsertPedigreeLink(livestock.id, sireId, 'Pejantan');
    } catch (err) {
      console.error('[LivestockService] Sire pedigree link failed:', err);
    }
  }

  // Batch enrollment — non-fatal
  if (batchId) {
    try {
      await repoInsertBatchMember(batchId, livestock.id);
    } catch (err) {
      console.error('[LivestockService] Batch enrollment failed:', err);
    }
  }

  return ok(livestock);
}

// ─── Weight recording ─────────────────────────────────────────────────────────

/**
 * Record a weight measurement for a livestock animal.
 * Automatically syncs the animal's current_weight_kg field.
 */
export async function recordWeight(
  livestockId: string,
  userId: string,
  input: WeightEntryCreateInput,
): Promise<LivestockServiceResult<WeightEntryDbRow>> {
  if (!livestockId) return fail('ID ternak diperlukan.');
  if (isNaN(input.weight_kg) || input.weight_kg < 0) return fail('Berat tidak valid.');
  if (!input.date) return fail('Tanggal diperlukan.');

  try {
    const entry = await repoInsertWeightEntry(livestockId, userId, input);
    return ok(entry);
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : 'Gagal menyimpan berat.';
    return fail(msg);
  }
}

// ─── Archive ──────────────────────────────────────────────────────────────────

/**
 * Archive a livestock animal with a permanent exit reason.
 * Sets location_status → 'Arsip' and records a Keluar Permanen transfer.
 */
export async function archiveLivestock(
  livestockId: string,
  workspaceId: string,
  reason: DbArchiveReason,
  transferDate: string,
  notes: string | null = null,
): Promise<LivestockServiceResult<void>> {
  if (!livestockId) return fail('ID ternak diperlukan.');

  try {
    await repoArchiveLivestock(livestockId, reason);
    // Record the permanent exit event in transfers
    await repoInsertTransfer({
      livestock_id:  livestockId,
      workspace_id:  workspaceId,
      transfer_type: 'Keluar Permanen',
      from_location: null,
      to_location:   null,
      destination:   null,
      reason:        null,
      archive_reason: reason,
      notes,
      transfer_date:  transferDate,
      return_date:    null,
    });
    return ok(undefined);
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : 'Gagal mengarsipkan ternak.';
    return fail(msg);
  }
}

// ─── Transfer ─────────────────────────────────────────────────────────────────

/**
 * Move a livestock animal outside the farm temporarily.
 * Updates location_status → 'Luar Kandang' and records a Keluar Sementara transfer.
 */
export async function moveLivestockOutside(
  livestockId: string,
  workspaceId: string,
  destination: string,
  reason: string,
  notes: string | null,
  transferDate: string,
  fromLocation: string | null,
): Promise<LivestockServiceResult<void>> {
  if (!livestockId) return fail('ID ternak diperlukan.');

  try {
    await repoPatchLivestock(livestockId, { location_status: 'Luar Kandang' });
    await repoInsertTransfer({
      livestock_id:  livestockId,
      workspace_id:  workspaceId,
      transfer_type: 'Keluar Sementara',
      from_location: fromLocation,
      to_location:   destination,
      destination,
      reason,
      archive_reason: null,
      notes,
      transfer_date:  transferDate,
      return_date:    null,
    });
    return ok(undefined);
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : 'Gagal mencatat perpindahan.';
    return fail(msg);
  }
}

/**
 * Return a livestock animal to the farm.
 * Updates location_status → 'Di Kandang' and records a Masuk Kembali transfer.
 */
export async function returnLivestockToFarm(
  livestockId: string,
  workspaceId: string,
  returnLocation: string | null,
  returnDate: string,
  notes: string | null,
): Promise<LivestockServiceResult<void>> {
  if (!livestockId) return fail('ID ternak diperlukan.');

  try {
    await repoPatchLivestock(livestockId, {
      location_status: 'Di Kandang',
      location_detail: returnLocation,
    });
    await repoInsertTransfer({
      livestock_id:  livestockId,
      workspace_id:  workspaceId,
      transfer_type: 'Masuk Kembali',
      from_location: null,
      to_location:   returnLocation,
      destination:   null,
      reason:        null,
      archive_reason: null,
      notes,
      transfer_date:  returnDate,
      return_date:    returnDate,
    });
    return ok(undefined);
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : 'Gagal mencatat kepulangan.';
    return fail(msg);
  }
}

// ─── Update livestock profile ─────────────────────────────────────────────────

/**
 * Update core fields and extended metadata for a livestock animal.
 * Both writes run sequentially; extended metadata uses UPSERT so it is safe
 * to call even when no extended row exists yet.
 */
export async function updateLivestockProfile(
  livestockId: string,
  patch: LivestockPatchInput,
  extended: LivestockExtendedMetadataCreateInput,
): Promise<LivestockServiceResult<void>> {
  if (!livestockId) return fail('ID ternak diperlukan.');

  try {
    await repoPatchLivestock(livestockId, patch);
    await repoUpsertLivestockExtended(livestockId, extended);
    return ok(undefined);
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : 'Gagal menyimpan data ternak.';
    return fail(msg);
  }
}

// ─── Batch membership change ───────────────────────────────────────────────────

/**
 * Change the batch membership of a livestock animal.
 *
 * - If `currentBatchId` is set, the animal is removed from that batch first.
 * - If `newBatchId` is set, the animal is enrolled in that batch.
 * - Pass both to do a move; pass only `currentBatchId` to remove; pass only
 *   `newBatchId` to add for the first time.
 */
export async function changeBatchMembership(
  livestockId: string,
  currentBatchId: string | null,
  newBatchId: string | null,
  reason: string | null = null,
): Promise<LivestockServiceResult<void>> {
  if (!livestockId) return fail('ID ternak diperlukan.');

  try {
    if (currentBatchId) {
      await repoRemoveBatchMember(currentBatchId, livestockId, reason);
    }
    if (newBatchId) {
      await repoInsertBatchMember(newBatchId, livestockId);
    }
    return ok(undefined);
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : 'Gagal mengubah batch.';
    return fail(msg);
  }
}

// ─── Batch management ─────────────────────────────────────────────────────────

/**
 * Delete a livestock photo from R2 and Supabase.
 * Non-critical — UI should surface the error but not block navigation.
 */
export async function deletePhoto(
  livestockId: string,
  photoId: string,
): Promise<LivestockServiceResult<void>> {
  try {
    await repoDeleteLivestockPhoto(livestockId, photoId);
    return ok(undefined);
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : 'Gagal menghapus foto.';
    return fail(msg);
  }
}

/**
 * Mark a photo as the primary (cover) photo for a livestock record.
 */
export async function setPrimaryPhoto(
  livestockId: string,
  photoId: string,
): Promise<LivestockServiceResult<void>> {
  try {
    await repoSetLivestockPrimaryPhoto(livestockId, photoId);
    return ok(undefined);
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : 'Gagal mengatur foto utama.';
    return fail(msg);
  }
}

/**
 * Create a new batch for a workspace.
 */
export async function createBatch(
  workspaceId: string,
  userId: string,
  input: BatchCreateInput,
): Promise<LivestockServiceResult<BatchDbRow>> {
  if (!input.label.trim()) return fail('Label batch diperlukan.');

  try {
    const batch = await repoInsertBatch(workspaceId, userId, input);
    return ok(batch);
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : 'Gagal membuat batch.';
    return fail(msg);
  }
}

/**
 * Update batch status or metadata.
 */
export async function updateBatch(
  batchId: string,
  patch: BatchPatchInput,
): Promise<LivestockServiceResult<BatchDbRow | null>> {
  try {
    const batch = await repoPatchBatch(batchId, patch);
    return ok(batch);
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : 'Gagal memperbarui batch.';
    return fail(msg);
  }
}

/**
 * Enroll a livestock in a batch.
 */
export async function enrollInBatch(
  batchId: string,
  livestockId: string,
): Promise<LivestockServiceResult<void>> {
  try {
    await repoInsertBatchMember(batchId, livestockId);
    return ok(undefined);
  } catch (err) {
    const msg = err instanceof LivestockRepoError ? err.message : 'Gagal mendaftarkan ke batch.';
    return fail(msg);
  }
}
