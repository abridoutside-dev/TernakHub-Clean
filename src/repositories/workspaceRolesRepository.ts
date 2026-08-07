// ─── Workspace Roles Repository ──────────────────────────────────────────────
//
// The only browser data adapter for Workspace Roles. All reads and mutations
// are dispatched to the workspace-roles Supabase Edge Function.

import { supabase } from '../lib/supabase';
import type {
  CustomRoleCreateInput,
  CustomRoleRecord,
  CustomRoleUpdateInput,
  WorkspaceRoleRecord,
  WorkspaceRoleRemovalPreflight,
} from '../types/customRole';

export class WorkspaceRolesRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'WorkspaceRolesRepoError';
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error?: string; code?: string };

async function invoke<T>(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<Envelope<T>>(
    'workspace-roles',
    { body: { action: 'workspace-roles', operation, ...payload } },
  );
  if (error) {
    throw new WorkspaceRolesRepoError(error.message || 'Permintaan workspace roles gagal.');
  }
  if (!data?.ok) {
    throw new WorkspaceRolesRepoError(
      data?.error || 'Operasi workspace roles gagal.',
      data?.code,
    );
  }
  return data.data;
}

export function repoListWorkspaceRoles(workspaceId: string): Promise<WorkspaceRoleRecord[]> {
  return invoke('list', { workspace_id: workspaceId });
}

export function repoGetWorkspaceRole(
  roleId: string,
  workspaceId: string,
  roleKind: 'builtin' | 'custom',
): Promise<WorkspaceRoleRecord | null> {
  return invoke('detail', {
    workspace_id: workspaceId,
    role_id: roleId,
    role_kind: roleKind,
  });
}

export function repoCreateWorkspaceRole(
  input: CustomRoleCreateInput,
): Promise<CustomRoleRecord> {
  return invoke('add', {
    workspace_id: input.workspace_id,
    name: input.name,
    description: input.description ?? null,
    permissions: input.permissions,
  });
}

export function repoUpdateWorkspaceRole(
  id: string,
  workspaceId: string,
  patch: CustomRoleUpdateInput,
): Promise<CustomRoleRecord> {
  return invoke('update', {
    workspace_id: workspaceId,
    role_id: id,
    name: patch.name,
    description: patch.description,
    permissions: patch.permissions,
  });
}

export function repoUpdateWorkspaceRoleStatus(
  id: string,
  workspaceId: string,
  status: 'Active' | 'Inactive',
): Promise<CustomRoleRecord> {
  return invoke('update-status', {
    workspace_id: workspaceId,
    role_id: id,
    status,
  });
}

export function repoGetWorkspaceRoleRemovalPreflight(
  id: string,
  workspaceId: string,
): Promise<WorkspaceRoleRemovalPreflight | null> {
  return invoke('preflight-remove', {
    workspace_id: workspaceId,
    role_id: id,
    role_kind: 'custom',
  });
}

export function repoDeleteWorkspaceRole(
  id: string,
  workspaceId: string,
): Promise<{ removed: boolean }> {
  return invoke('remove', {
    workspace_id: workspaceId,
    role_id: id,
    role_kind: 'custom',
  });
}