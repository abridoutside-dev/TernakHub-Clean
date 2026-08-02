// ─── Workspace Members Data — DB-001B-3 ──────────────────────────────────────
//
// In-memory cache for WorkspaceMemberRecord, backed by Supabase.
//
// DATA FLOW:
//   Supabase workspace_members table
//     → repoBatchGetMembersByWorkspaces() (async, in WorkspaceContext)
//     → loadMembersFromSupabase()          (populates MEMBERS_DB cache)
//     → getMembersByWorkspace() etc.       (sync reads from cache, used by pages)
//
// RULES:
//   - loadMembersFromSupabase() is the sole write path for Supabase data.
//   - Sync read functions (getMembersByWorkspace, etc.) return from the cache.
//   - Mutation functions (addMember, updateMemberRole, removeMember) write to
//     the cache AND to Supabase via workspaceMembersRepository.ts.
//   - MEMBERS_DB starts empty; it is populated on WorkspaceContext load.
//   - Do NOT re-add seed data here.
//   - Do NOT import from pages, components, or contexts.

import type { MemberRole, MemberStatus } from '../types/workspacePermissions';
import { generateUUID } from '../utils/uuid';
import {
  repoBatchGetMembersByWorkspaces,
  repoInsertMember,
  repoUpdateMemberRole,
  repoUpdateMemberStatus,
  repoDeleteMember,
} from '../repositories/workspaceMembersRepository';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkspaceMemberRecord {
  member_uuid:    string;
  workspace_uuid: string;
  user_id:        string;         // Supabase Auth UID
  name:           string;
  email:          string | null;
  phone:          string | null;
  avatar_url:     string | null;
  role:           MemberRole;
  status:         MemberStatus;
  joined_at:      string;         // ISO timestamp
}

export interface MemberCreateInput {
  workspace_uuid: string;
  user_id:        string;
  name:           string;
  email?:         string | null;
  phone?:         string | null;
  avatar_url?:    string | null;
  role:           MemberRole;
}

export interface MemberUpdateInput {
  name?:       string;
  email?:      string | null;
  phone?:      string | null;
  avatar_url?: string | null;
  role?:       MemberRole;
  status?:     MemberStatus;
}

// ─── Validation errors ────────────────────────────────────────────────────────

export type MemberErrorCode =
  | 'OWNER_IMMUTABLE'
  | 'LAST_OWNER'
  | 'MEMBER_NOT_FOUND'
  | 'DUPLICATE_USER'
  | 'INVALID_ROLE';

export interface MemberError { code: MemberErrorCode; message: string }

export type MemberResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: MemberError };

// ─── In-memory cache (populated from Supabase) ────────────────────────────────

let MEMBERS_DB: WorkspaceMemberRecord[] = [];

// ─── Supabase bridge ─────────────────────────────────────────────────────────

/**
 * Loads members for the given workspace UUIDs from Supabase and replaces the
 * local cache. Called by WorkspaceContext after the workspace list is fetched.
 */
export async function loadMembersFromSupabase(workspaceUuids: string[]): Promise<void> {
  try {
    const records = await repoBatchGetMembersByWorkspaces(workspaceUuids);
    MEMBERS_DB = records;
  } catch (err) {
    console.warn('[workspaceMembersData] Failed to load members from Supabase:', err);
    MEMBERS_DB = [];
  }
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export function getMembersByWorkspace(workspaceUuid: string): WorkspaceMemberRecord[] {
  return MEMBERS_DB.filter((m) => m.workspace_uuid === workspaceUuid);
}

export function getMembersByUserId(userId: string): WorkspaceMemberRecord[] {
  return MEMBERS_DB.filter((m) => m.user_id === userId);
}

export function getMemberByUserId(
  workspaceUuid: string,
  userId: string,
): WorkspaceMemberRecord | undefined {
  return MEMBERS_DB.find(
    (m) => m.workspace_uuid === workspaceUuid && m.user_id === userId,
  );
}

export function getMemberByUuid(memberUuid: string): WorkspaceMemberRecord | undefined {
  return MEMBERS_DB.find((m) => m.member_uuid === memberUuid);
}

function getOwnerCount(workspaceUuid: string): number {
  return MEMBERS_DB.filter(
    (m) => m.workspace_uuid === workspaceUuid && m.role === 'Owner',
  ).length;
}

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Adds a new member to a workspace.
 * Writes to the local cache immediately; also attempts to persist to Supabase.
 * If the user_id is a placeholder (non-UUID) the Supabase write is skipped.
 */
export function addMember(input: MemberCreateInput): MemberResult<WorkspaceMemberRecord> {
  const isDuplicate = MEMBERS_DB.some(
    (m) =>
      m.workspace_uuid === input.workspace_uuid &&
      m.user_id === input.user_id,
  );
  if (isDuplicate) {
    return { ok: false, error: { code: 'DUPLICATE_USER', message: 'User is already a member of this workspace.' } };
  }

  const record: WorkspaceMemberRecord = {
    member_uuid:    generateUUID(),
    workspace_uuid: input.workspace_uuid,
    user_id:        input.user_id,
    name:           input.name,
    email:          input.email ?? null,
    phone:          input.phone ?? null,
    avatar_url:     input.avatar_url ?? null,
    role:           input.role,
    status:         'Active',
    joined_at:      new Date().toISOString(),
  };

  MEMBERS_DB = [...MEMBERS_DB, record];

  // Attempt async Supabase persistence (fire-and-forget).
  // Skip if user_id is a placeholder (non-UUID) created for UI demo purposes.
  const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.user_id);
  if (isRealUuid) {
    repoInsertMember(input).then((saved) => {
      // Replace the optimistic record with the Supabase-assigned UUID.
      MEMBERS_DB = MEMBERS_DB.map((m) =>
        m.member_uuid === record.member_uuid ? { ...saved } : m,
      );
    }).catch((err) => {
      console.warn('[workspaceMembersData] addMember Supabase write failed:', err);
    });
  }

  return { ok: true, data: { ...record } };
}

export function updateMemberRole(
  memberUuid: string,
  newRole: MemberRole,
): MemberResult<WorkspaceMemberRecord> {
  const member = MEMBERS_DB.find((m) => m.member_uuid === memberUuid);
  if (!member) {
    return { ok: false, error: { code: 'MEMBER_NOT_FOUND', message: 'Member not found.' } };
  }
  if (member.role === 'Owner') {
    return { ok: false, error: { code: 'OWNER_IMMUTABLE', message: "The Owner's role cannot be changed." } };
  }

  const updated = { ...member, role: newRole };
  MEMBERS_DB = MEMBERS_DB.map((m) => (m.member_uuid === memberUuid ? updated : m));

  // Async Supabase persist (fire-and-forget).
  repoUpdateMemberRole(memberUuid, newRole).catch((err) => {
    console.warn('[workspaceMembersData] updateMemberRole Supabase write failed:', err);
  });

  return { ok: true, data: { ...updated } };
}

export function updateMemberStatus(
  memberUuid: string,
  status: 'Active' | 'Inactive',
): MemberResult<WorkspaceMemberRecord> {
  const idx = MEMBERS_DB.findIndex((m) => m.member_uuid === memberUuid);
  if (idx === -1) {
    return { ok: false, error: { code: 'MEMBER_NOT_FOUND', message: 'Member not found.' } };
  }

  const member = MEMBERS_DB[idx];
  if (member.role === 'Owner') {
    return { ok: false, error: { code: 'OWNER_IMMUTABLE', message: "The Owner's status cannot be changed." } };
  }

  const updated = { ...member, status };
  MEMBERS_DB = MEMBERS_DB.map((m) => (m.member_uuid === memberUuid ? updated : m));

  // Async Supabase persist (fire-and-forget).
  repoUpdateMemberStatus(memberUuid, status).catch((err) => {
    console.warn('[workspaceMembersData] updateMemberStatus Supabase write failed:', err);
  });

  return { ok: true, data: { ...updated } };
}

export function removeMember(
  memberUuid: string,
  currentUserId?: string,
): MemberResult<{ removed: boolean }> {
  const member = MEMBERS_DB.find((m) => m.member_uuid === memberUuid);
  if (!member) {
    return { ok: false, error: { code: 'MEMBER_NOT_FOUND', message: 'Member not found.' } };
  }
  if (member.role === 'Owner') {
    return { ok: false, error: { code: 'OWNER_IMMUTABLE', message: 'The Owner cannot be removed from the workspace.' } };
  }

  // Guard: cannot remove yourself if you are the only Owner.
  if (currentUserId && member.user_id === currentUserId) {
    const ownerCount = getOwnerCount(member.workspace_uuid);
    if (ownerCount <= 1) {
      return {
        ok: false,
        error: {
          code: 'LAST_OWNER',
          message: 'You cannot remove yourself because you are the only Owner of this workspace.',
        },
      };
    }
  }

  MEMBERS_DB = MEMBERS_DB.filter((m) => m.member_uuid !== memberUuid);

  // Async Supabase persist (fire-and-forget).
  repoDeleteMember(memberUuid).catch((err) => {
    console.warn('[workspaceMembersData] removeMember Supabase write failed:', err);
  });

  return { ok: true, data: { removed: true } };
}
