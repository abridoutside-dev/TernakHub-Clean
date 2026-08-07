// ─── Workspace Members read cache ─────────────────────────────────────────────
//
// Supabase access belongs to workspaceMembersRepository and business rules
// belong to workspaceService. This module only exposes the shared read cache
// used by permission resolution and workspace summaries.

import type { MemberRole, MemberStatus } from '../types/workspacePermissions';

export interface WorkspaceMemberRecord {
  member_uuid: string;
  workspace_uuid: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
}

export interface MemberCreateInput {
  workspace_uuid: string;
  user_id?: string;
  email?: string | null;
  name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: MemberRole;
}

export interface MemberUpdateInput {
  role?: MemberRole;
  status?: MemberStatus;
}

let MEMBERS_DB: WorkspaceMemberRecord[] = [];

export function replaceMembersCache(records: WorkspaceMemberRecord[]): void {
  MEMBERS_DB = records;
}

export function upsertWorkspaceMembersCache(
  workspaceUuid: string,
  records: WorkspaceMemberRecord[],
): void {
  MEMBERS_DB = [
    ...MEMBERS_DB.filter((member) => member.workspace_uuid !== workspaceUuid),
    ...records,
  ];
}

export function getMembersByWorkspace(workspaceUuid: string): WorkspaceMemberRecord[] {
  return MEMBERS_DB.filter((member) => member.workspace_uuid === workspaceUuid);
}

export function getMembersByUserId(userId: string): WorkspaceMemberRecord[] {
  return MEMBERS_DB.filter((member) => member.user_id === userId);
}

export function getMemberByUserId(
  workspaceUuid: string,
  userId: string,
): WorkspaceMemberRecord | undefined {
  return MEMBERS_DB.find(
    (member) => member.workspace_uuid === workspaceUuid && member.user_id === userId,
  );
}

export function getMemberByUuid(memberUuid: string): WorkspaceMemberRecord | undefined {
  return MEMBERS_DB.find((member) => member.member_uuid === memberUuid);
}