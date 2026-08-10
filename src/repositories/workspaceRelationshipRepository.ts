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

function isResponse(value: unknown): value is Response {
  return typeof Response !== 'undefined' && value instanceof Response;
}

async function errorMessage(error: unknown, fallback: string): Promise<string> {
  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; context?: unknown };
    if (isResponse(candidate.context)) {
      try {
        const raw = await candidate.context.clone().text();
        if (raw.trim()) {
          const body = JSON.parse(raw) as Record<string, unknown>;
          const message = [body.error, body.message, body.error_description, body.msg, body.details, body.hint]
            .find(value => typeof value === 'string' && value.trim());
          if (typeof message === 'string') return message.replace(/\s+/g, ' ').trim();
        }
      } catch {
        // Fall through to the SDK error below.
      }
      if (candidate.context.status) return fallback;
    }
    if (typeof candidate.message === 'string' && candidate.message.trim()
      && !/edge function returned.*non-2xx|failed to send a request/i.test(candidate.message)) {
      return candidate.message.replace(/\s+/g, ' ').trim();
    }
  }
  return fallback;
}

async function invoke<T>(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<Envelope<T>>(
    'workspace-relationships',
    { body: { action: 'workspace-relationships', operation, ...payload } },
  );
  if (error) {
    throw new WorkspaceRelationshipRepoError(await errorMessage(error, 'Permintaan relationship gagal.'));
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