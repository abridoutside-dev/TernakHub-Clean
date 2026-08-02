// ─── Livestock Repository — FLOW-002M2 ────────────────────────────────────────
//
// Supabase adapter for the Livestock module.
// Tables covered:
//   livestock, livestock_extended_metadata, livestock_weight_entries,
//   livestock_photos, pedigree_links, batches, batch_members,
//   livestock_transfers
//
// Rules:
//  - All functions are async and return typed results.
//  - requireAuthSession() guards every exported function.
//  - Never import from pages, components, or contexts.
//  - Business logic lives in livestockService.ts, not here.
//  - Supabase is the SSOT; in-memory stores are populated by useLivestock().

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';
import type {
  LivestockDbRow,
  LivestockExtendedMetadataDbRow,
  WeightEntryDbRow,
  LivestockPhotoDbRow,
  PedigreeLinkDbRow,
  BatchDbRow,
  BatchMemberDbRow,
  LivestockTransferDbRow,
  LivestockCreateInput,
  LivestockExtendedMetadataCreateInput,
  LivestockPatchInput,
  WeightEntryCreateInput,
  BatchCreateInput,
  BatchPatchInput,
  LivestockTransferCreateInput,
  BatchHistoryDbRow,
  BatchHistoryCreateInput,
  BatchOperationDbRow,
  BatchOperationCreateInput,
} from '../types/livestock';

// ─── Error ────────────────────────────────────────────────────────────────────

export class LivestockRepoError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'LivestockRepoError';
  }
}

function guard(error: { message: string; code?: string } | null): void {
  if (error) throw new LivestockRepoError(error.message, error.code);
}

// ─── Livestock ────────────────────────────────────────────────────────────────

/** All livestock belonging to a workspace, ordered by registration date. */
export async function repoGetLivestockByWorkspace(
  workspaceId: string,
): Promise<LivestockDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('livestock')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  guard(error);
  return (data ?? []) as LivestockDbRow[];
}

/** Single livestock by UUID. Returns null when not found. */
export async function repoGetLivestockById(id: string): Promise<LivestockDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('livestock')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as LivestockDbRow | null;
}

/** Insert a new livestock row. Returns the persisted row (with server-generated id). */
export async function repoInsertLivestock(
  workspaceId: string,
  input: LivestockCreateInput,
): Promise<LivestockDbRow> {
  await requireAuthSession();
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('livestock')
    .insert({
      workspace_id:                     workspaceId,
      name:                             input.name,
      species:                          input.species,
      breed:                            input.breed ?? null,
      sex:                              input.sex ?? null,
      birth_date:                       input.birth_date ?? null,
      birth_date_estimated:             input.birth_date_estimated,
      birth_weight_kg:                  input.birth_weight_kg ?? null,
      current_weight_kg:                input.current_weight_kg ?? null,
      health_status:                    input.health_status ?? 'Sehat',
      location_status:                  'Di Kandang',
      location_detail:                  input.location_detail ?? null,
      program:                          input.program ?? null,
      digital_identity_verified:        false,
      digital_identity_issued_by:       input.digital_identity_issued_by ?? null,
      digital_identity_registered_date: today,
    })
    .select()
    .single();
  guard(error);
  return data as LivestockDbRow;
}

/** Apply a partial update to a livestock row. Returns the updated row or null if not found. */
export async function repoPatchLivestock(
  id: string,
  patch: LivestockPatchInput,
): Promise<LivestockDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('livestock')
    .update({ updated_at: new Date().toISOString(), ...patch })
    .eq('id', id)
    .select()
    .maybeSingle();
  guard(error);
  return data as LivestockDbRow | null;
}

/**
 * Archive a livestock animal.
 * Sets location_status → 'Arsip', archive_reason, archived_at.
 */
export async function repoArchiveLivestock(
  id: string,
  reason: 'Mati' | 'Terjual' | 'Hibah',
): Promise<void> {
  await requireAuthSession();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('livestock')
    .update({
      location_status: 'Arsip',
      archive_reason:  reason,
      archived_at:     now,
      updated_at:      now,
    })
    .eq('id', id);
  guard(error);
}

// ─── Extended metadata ────────────────────────────────────────────────────────

/** Fetch the extended metadata row for a livestock (null when not yet created). */
export async function repoGetLivestockExtended(
  livestockId: string,
): Promise<LivestockExtendedMetadataDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('livestock_extended_metadata')
    .select('*')
    .eq('livestock_id', livestockId)
    .maybeSingle();
  guard(error);
  return data as LivestockExtendedMetadataDbRow | null;
}

/**
 * Bulk-fetch all extended metadata rows for a given set of livestock IDs.
 * Returns an empty array when `livestockIds` is empty.
 */
export async function repoGetExtendedMetadataByLivestockIds(
  livestockIds: string[],
): Promise<LivestockExtendedMetadataDbRow[]> {
  if (livestockIds.length === 0) return [];
  await requireAuthSession();
  const { data, error } = await supabase
    .from('livestock_extended_metadata')
    .select('*')
    .in('livestock_id', livestockIds);
  guard(error);
  return (data ?? []) as LivestockExtendedMetadataDbRow[];
}

/**
 * Upsert the extended metadata for a livestock.
 * Uses ON CONFLICT (livestock_id) to merge safely.
 */
export async function repoUpsertLivestockExtended(
  livestockId: string,
  input: LivestockExtendedMetadataCreateInput,
): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('livestock_extended_metadata')
    .upsert(
      { livestock_id: livestockId, ...input, updated_at: new Date().toISOString() },
      { onConflict: 'livestock_id' },
    );
  guard(error);
}

// ─── Weight entries ────────────────────────────────────────────────────────────

/** All weight entries for a livestock animal, newest first. */
export async function repoGetWeightEntries(
  livestockId: string,
): Promise<WeightEntryDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('livestock_weight_entries')
    .select('*')
    .eq('livestock_id', livestockId)
    .order('date', { ascending: false });
  guard(error);
  return (data ?? []) as WeightEntryDbRow[];
}

/**
 * Insert a weight entry and update the livestock's current_weight_kg in one go.
 * Returns the persisted entry row.
 */
export async function repoInsertWeightEntry(
  livestockId: string,
  userId: string,
  input: WeightEntryCreateInput,
): Promise<WeightEntryDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('livestock_weight_entries')
    .insert({
      livestock_id: livestockId,
      recorded_by:  userId,
      weight_kg:    input.weight_kg,
      date:         input.date,
      notes:        input.notes ?? null,
    })
    .select()
    .single();
  guard(error);

  // Keep current_weight_kg in sync — non-fatal if this update races.
  void supabase
    .from('livestock')
    .update({
      current_weight_kg: input.weight_kg,
      updated_at:        new Date().toISOString(),
    })
    .eq('id', livestockId);

  return data as WeightEntryDbRow;
}

// ─── Photos ────────────────────────────────────────────────────────────────────

/** All photos for a livestock animal, ordered by sort_order. */
export async function repoGetLivestockPhotosByWorkspaceLivestock(
  livestockId: string,
): Promise<LivestockPhotoDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('livestock_photos')
    .select('*')
    .eq('livestock_id', livestockId)
    .order('sort_order', { ascending: true });
  guard(error);
  return (data ?? []) as LivestockPhotoDbRow[];
}

// ─── Pedigree ─────────────────────────────────────────────────────────────────

/**
 * All pedigree links where this livestock is the child OR the relative.
 * Used to reconstruct the full family tree.
 */
export async function repoGetPedigreeLinks(
  livestockId: string,
): Promise<PedigreeLinkDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('pedigree_links')
    .select('*')
    .or(`livestock_id.eq.${livestockId},relative_id.eq.${livestockId}`);
  guard(error);
  return (data ?? []) as PedigreeLinkDbRow[];
}

/**
 * Link a livestock to a parent.
 * role: 'Induk' (dam / ibu) | 'Pejantan' (sire / ayah)
 * Silently ignores duplicate links (unique constraint violation).
 */
export async function repoInsertPedigreeLink(
  livestockId: string,
  relativeId: string,
  role: 'Induk' | 'Pejantan',
): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('pedigree_links')
    .insert({ livestock_id: livestockId, relative_id: relativeId, role });
  // 23505 = unique_violation — link already exists, safe to ignore.
  if (error && error.code !== '23505') throw new LivestockRepoError(error.message, error.code);
}

// ─── Batches ──────────────────────────────────────────────────────────────────

/** All batches for a workspace, ordered by creation date. */
export async function repoGetBatchesByWorkspace(
  workspaceId: string,
): Promise<BatchDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  guard(error);
  return (data ?? []) as BatchDbRow[];
}

/** Insert a new batch and return the persisted row. */
export async function repoInsertBatch(
  workspaceId: string,
  userId: string,
  input: BatchCreateInput,
): Promise<BatchDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('batches')
    .insert({
      workspace_id: workspaceId,
      created_by:   userId,
      label:        input.label,
      species:      input.species ?? null,
      start_date:   input.start_date ?? null,
      target_weight_kg: input.target_weight_kg ?? null,
      notes:        input.notes ?? null,
    })
    .select()
    .single();
  guard(error);
  return data as BatchDbRow;
}

/** Apply a partial update to a batch. Returns the updated row or null. */
export async function repoPatchBatch(
  batchId: string,
  patch: BatchPatchInput,
): Promise<BatchDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('batches')
    .update({ updated_at: new Date().toISOString(), ...patch })
    .eq('id', batchId)
    .select()
    .maybeSingle();
  guard(error);
  return data as BatchDbRow | null;
}

// ─── Batch members ────────────────────────────────────────────────────────────

/**
 * All active (not removed) batch members for all batches in a workspace.
 * Uses an inner join via filter to avoid a separate batch ID lookup.
 * Used for building the per-livestock active-batch card in useLivestock.
 */
export async function repoGetActiveBatchMembersByWorkspace(
  workspaceId: string,
): Promise<BatchMemberDbRow[]> {
  await requireAuthSession();
  // Supabase: join through batches to filter by workspace_id
  const { data, error } = await supabase
    .from('batch_members')
    .select('*, batches!inner(workspace_id)')
    .eq('batches.workspace_id', workspaceId)
    .is('removed_date', null);
  guard(error);
  // Strip the joined batches column before returning
  return ((data ?? []) as Array<BatchMemberDbRow & { batches: unknown }>).map(
    ({ batches: _batches, ...row }) => row as BatchMemberDbRow,
  );
}

/**
 * ALL batch members (active + removed) for all batches in a workspace.
 * Used to populate MEMBERSHIP_DB so that getBatchMemberships() / getBatchMembersWithLivestock()
 * return the full history (join + leave events) after hard refresh, not just active members.
 */
export async function repoGetAllBatchMembersByWorkspace(
  workspaceId: string,
): Promise<BatchMemberDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('batch_members')
    .select('*, batches!inner(workspace_id)')
    .eq('batches.workspace_id', workspaceId)
    .order('joined_date', { ascending: true });
  guard(error);
  return ((data ?? []) as Array<BatchMemberDbRow & { batches: unknown }>).map(
    ({ batches: _batches, ...row }) => row as BatchMemberDbRow,
  );
}

/** Insert a new batch member. Returns the persisted row. */
export async function repoInsertBatchMember(
  batchId: string,
  livestockId: string,
): Promise<BatchMemberDbRow> {
  await requireAuthSession();
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('batch_members')
    .insert({ batch_id: batchId, livestock_id: livestockId, joined_date: today })
    .select()
    .single();
  guard(error);
  return data as BatchMemberDbRow;
}

/** Soft-remove a livestock from a batch by setting removed_date. */
export async function repoRemoveBatchMember(
  batchId: string,
  livestockId: string,
  reason: string | null = null,
): Promise<void> {
  await requireAuthSession();
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('batch_members')
    .update({ removed_date: today, removal_reason: reason })
    .eq('batch_id', batchId)
    .eq('livestock_id', livestockId)
    .is('removed_date', null);
  guard(error);
}

// ─── Transfers ────────────────────────────────────────────────────────────────

/** All transfers for a workspace, newest first. */
export async function repoGetTransfersByWorkspace(
  workspaceId: string,
): Promise<LivestockTransferDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('livestock_transfers')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('transfer_date', { ascending: false });
  guard(error);
  return (data ?? []) as LivestockTransferDbRow[];
}

// ─── batch_history (read) ─────────────────────────────────────────────────────

/**
 * All batch_history events for every batch in a workspace, newest first.
 * Uses an inner join through `batches` to filter by workspace_id without a
 * separate batch-ID lookup.
 */
export async function repoGetBatchHistoryByWorkspace(
  workspaceId: string,
): Promise<BatchHistoryDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('batch_history')
    .select('*, batches!inner(workspace_id)')
    .eq('batches.workspace_id', workspaceId)
    .order('event_at', { ascending: false });
  guard(error);
  return ((data ?? []) as Array<BatchHistoryDbRow & { batches: unknown }>).map(
    ({ batches: _batches, ...row }) => row as BatchHistoryDbRow,
  );
}

// ─── batch_operations (read) ──────────────────────────────────────────────────

/**
 * All batch_operations for every batch in a workspace, newest first.
 * Used by useBatch to hydrate BATCH_OPERATION_LOG from Supabase on mount.
 */
export async function repoGetBatchOperationsByWorkspace(
  workspaceId: string,
): Promise<BatchOperationDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('batch_operations')
    .select('*, batches!inner(workspace_id)')
    .eq('batches.workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  guard(error);
  return ((data ?? []) as Array<BatchOperationDbRow & { batches: unknown }>).map(
    ({ batches: _batches, ...row }) => row as BatchOperationDbRow,
  );
}

// ─── batch_history (write) ────────────────────────────────────────────────────

/** Insert a batch history event. Returns the persisted row. */
export async function repoInsertBatchHistory(
  input: BatchHistoryCreateInput,
): Promise<BatchHistoryDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('batch_history')
    .insert({
      batch_id:     input.batch_id,
      event_type:   input.event_type,
      event_data:   input.event_data ?? null,
      performed_by: input.performed_by ?? null,
    })
    .select()
    .single();
  guard(error);
  return data as BatchHistoryDbRow;
}

// ─── batch_operations ─────────────────────────────────────────────────────────

/** Insert a batch operation record. Returns the persisted row. */
export async function repoInsertBatchOperation(
  input: BatchOperationCreateInput,
): Promise<BatchOperationDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('batch_operations')
    .insert({
      batch_id:             input.batch_id,
      operation_type:       input.operation_type,
      status:               input.status ?? null,
      target_livestock_ids: input.target_livestock_ids ?? null,
      operation_data:       input.operation_data ?? null,
      performed_by:         input.performed_by ?? null,
      performed_at:         input.performed_at ?? null,
    })
    .select()
    .single();
  guard(error);
  return data as BatchOperationDbRow;
}

// ─── mutation_requests ────────────────────────────────────────────────────────

export interface MutationRequestInsertInput {
  id:             string;    // in-memory UUID (from generateUUID())
  workspace_id:   string;
  livestock_ids:  string[];  // array of Supabase livestock UUIDs (uuid[] NOT NULL, cardinality > 0)
  mutation_type:  'Individual' | 'Batch';
  status:         'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';
  effective_date: string | null;  // YYYY-MM-DD
  reason:         string | null;
  notes:          string | null;
  requested_by:   string | null;
}

export async function repoInsertMutationRequest(
  input: MutationRequestInsertInput,
): Promise<{ data: { id: string } | null; error: string | null }> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('mutation_requests')
    .insert({
      id:             input.id,
      workspace_id:   input.workspace_id,
      livestock_ids:  input.livestock_ids,
      mutation_type:  input.mutation_type,
      status:         input.status,
      effective_date: input.effective_date,
      reason:         input.reason,
      notes:          input.notes,
      requested_by:   input.requested_by,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Update the status of an existing mutation_requests row.
 * Used by mutasiService.updateMutationStatus() to sync lifecycle
 * transitions (Pending→Approved, Approved→Completed, etc.) to Supabase.
 * Returns { error: null } on success or { error: message } on failure.
 * A 0-row update (row was never inserted) is not an error.
 */
export async function repoUpdateMutationStatus(
  id: string,
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled',
): Promise<{ error: string | null }> {
  await requireAuthSession();
  const { error } = await supabase
    .from('mutation_requests')
    .update({ status })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

/** Insert a transfer record. Returns the persisted row. */
export async function repoInsertTransfer(
  input: LivestockTransferCreateInput,
): Promise<LivestockTransferDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('livestock_transfers')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as LivestockTransferDbRow;
}
