// ─── Workspace Members Repository ────────────────────────────────────────────
//
// The repository is intentionally a thin adapter. Workspace member reads and
// writes all use the workspace-members Supabase Edge Function; there is no
// second direct-table path from the browser.

import { supabase } from '../lib/supabase';
import type { MemberRole, MemberStatus } from '../types/workspacePermissions';
import type {
  WorkspaceMemberRecord,
  MemberCreateInput,
} from '../data/workspaceMembersData';

export class WorkspaceMembersRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'WorkspaceMembersRepoError';
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error?: string };

async function invoke<T>(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<Envelope<T>>(
    'workspace-members',
    { body: { action: 'workspace-members', operation, ...payload } },
  );
  if (error) {
    throw new WorkspaceMembersRepoError(
      error.message || 'Permintaan workspace members gagal.',
    );
  }
  if (!data?.ok) {
    throw new WorkspaceMembersRepoError(
      data?.error || 'Operasi workspace members gagal.',
    );
  }
  return data.data;
}

export function repoGetMembersByWorkspace(
  workspaceUuid: string,
): Promise<WorkspaceMemberRecord[]> {
  return invoke('list', { workspace_id: workspaceUuid });
}

export function repoGetMemberByUuid(
  memberUuid: string,
  workspaceUuid?: string,
): Promise<WorkspaceMemberRecord | null> {
  return invoke('detail', {
    workspace_id: workspaceUuid,
    workspace_member_id: memberUuid,
  });
}

export function repoInsertMember(
  input: MemberCreateInput,
): Promise<WorkspaceMemberRecord> {
  return invoke('add', {
    workspace_id: input.workspace_uuid,
    user_id: input.user_id,
    email: input.email,
    role: input.role,
  });
}

export function repoUpdateMemberRole(
  memberUuid: string,
  newRole: MemberRole,
  workspaceUuid: string,
): Promise<WorkspaceMemberRecord> {
  return invoke('update', {
    workspace_id: workspaceUuid,
    workspace_member_id: memberUuid,
    role: newRole,
  });
}

export function repoUpdateMemberStatus(
  memberUuid: string,
  status: MemberStatus,
  workspaceUuid: string,
): Promise<WorkspaceMemberRecord> {
  return invoke('update', {
    workspace_id: workspaceUuid,
    workspace_member_id: memberUuid,
    status,
  });
}

export async function repoDeleteMember(
  memberUuid: string,
  workspaceUuid: string,
): Promise<boolean> {
  await invoke<{ removed: boolean }>('remove', {
    workspace_id: workspaceUuid,
    workspace_member_id: memberUuid,
  });
  return true;
}

export function repoBatchGetMembersByWorkspaces(
  workspaceUuids: string[],
): Promise<WorkspaceMemberRecord[]> {
  if (workspaceUuids.length === 0) return Promise.resolve([]);
  return invoke('list-many', { workspace_ids: workspaceUuids });
}