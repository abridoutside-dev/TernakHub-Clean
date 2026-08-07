// ─── Workspace Relationship Repository ───────────────────────────────────────
//
// The only browser adapter for workspace relationships. All reads and writes
// are dispatched to the workspace-relationships Supabase Edge Function.

import { supabase } from '../lib/supabase';
import type {
  RelationshipCreateInput,
  RelationshipDeletePreflight,
  RelationshipListResponse,
  WorkspaceRelationship,
} from '../types/workspaceRelationship';

export class WorkspaceRelationshipRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'WorkspaceRelationshipRepoError';
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error?: string; code?: string };

async function invoke<T>(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<Envelope<T>>(
    'workspace-relationships',
    { body: { action: 'workspace-relationships', operation, ...payload } },
  );
  if (error) {
    throw new WorkspaceRelationshipRepoError(error.message || 'Permintaan relationship gagal.');
  }
  if (!data?.ok) {
    throw new WorkspaceRelationshipRepoError(
      data?.error || 'Operasi relationship gagal.',
      data?.code,
    );
  }
  return data.data;
}

export function repoListWorkspaceRelationships(): Promise<RelationshipListResponse> {
  return invoke('list');
}

export function repoGetWorkspaceRelationship(id: string): Promise<WorkspaceRelationship | null> {
  return invoke('detail', { relationship_id: id });
}

export function repoCreateWorkspaceRelationship(
  input: RelationshipCreateInput,
): Promise<WorkspaceRelationship> {
  return invoke('add', { ...input });
}

export function repoUpdateWorkspaceRelationshipStatus(
  id: string,
  operation: 'approve' | 'reject' | 'suspend' | 'reactivate',
): Promise<WorkspaceRelationship> {
  return invoke(operation, { relationship_id: id });
}

export function repoGetWorkspaceRelationshipDeletePreflight(
  id: string,
): Promise<RelationshipDeletePreflight | null> {
  return invoke('preflight-delete', { relationship_id: id });
}

export function repoDeleteWorkspaceRelationship(
  id: string,
  preflight: RelationshipDeletePreflight,
): Promise<{ removed: boolean }> {
  return invoke('delete', {
    relationship_id: id,
    preflight_relationship_id: preflight.relationship.relationship_id,
    preflight_checked_at: preflight.checked_at,
  });
}