// ─── Workspace Members Repository — DB-001B-3 ────────────────────────────────
//
// Async Supabase adapter for the `workspace_members` table.
// This is the authoritative source for workspace membership data.
//
// DB-001A column contract (workspace_members):
//   id           uuid PK
//   workspace_id uuid FK → workspaces.id ON DELETE CASCADE
//   user_id      uuid FK → auth.users
//   role         member_role ENUM  (Owner | Admin | Staff | Viewer | Guest)
//   status       member_status ENUM (Aktif | Nonaktif | Diundang | Ditangguhkan)
//   joined_at    timestamptz (or created_at — depends on migration)
//
// Name / email / avatar come from a separate JOIN with user_profiles.
//
// DB-001A → App enum mapping:
//   member_role:   Owner→Owner  Admin→Admin  Staff→Staff  Viewer→Viewer  Guest→Viewer
//   member_status: Aktif→Active  Nonaktif→Inactive  Diundang→Inactive  Ditangguhkan→Inactive
//
// Rules:
//  - All functions are async.
//  - Never import from pages, components, or contexts.
//  - RLS: the user can only read members of workspaces they belong to.

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';
import type { MemberRole, MemberStatus } from '../types/workspacePermissions';
import type {
  WorkspaceMemberRecord,
  MemberCreateInput,
} from '../data/workspaceMembersData';

// ─── Error type ───────────────────────────────────────────────────────────────

export class WorkspaceMembersRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'WorkspaceMembersRepoError';
  }
}

// ─── DB row types ─────────────────────────────────────────────────────────────

type DbMemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string | null;
  created_at: string | null;
};

type DbProfileRow = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  avatar_url: string | null;
};

// ─── Enum translators ─────────────────────────────────────────────────────────

function fromDbRole(dbRole: string): MemberRole {
  const map: Record<string, MemberRole> = {
    Owner:  'Owner',
    Admin:  'Admin',
    Staff:  'Staff',
    Viewer: 'Viewer',
    Guest:  'Viewer', // Guest → closest app type
  };
  return (map[dbRole] as MemberRole) ?? 'Viewer';
}

function toDbRole(role: MemberRole): string {
  // Manager is an app-only concept — map to Admin for DB storage.
  const map: Record<MemberRole, string> = {
    Owner:   'Owner',
    Admin:   'Admin',
    Manager: 'Admin',
    Staff:   'Staff',
    Viewer:  'Viewer',
  };
  return map[role] ?? 'Viewer';
}

function fromDbStatus(dbStatus: string): MemberStatus {
  // Active → Active; everything else → Inactive.
  return dbStatus === 'Aktif' ? 'Active' : 'Inactive';
}

function toDbStatus(status: MemberStatus): string {
  return status === 'Active' ? 'Aktif' : 'Nonaktif';
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

function mergeMemberWithProfile(
  member: DbMemberRow,
  profile: DbProfileRow | null,
): WorkspaceMemberRecord {
  return {
    member_uuid:    member.id,
    workspace_uuid: member.workspace_id,
    user_id:        member.user_id,
    name:           profile?.full_name
                    ?? profile?.display_name
                    ?? `User ${member.user_id.slice(0, 8)}`,
    email:          null,   // email lives in auth.users — not exposed via RLS
    phone:          profile?.phone_number ?? profile?.whatsapp_number ?? null,
    avatar_url:     profile?.avatar_url ?? null,
    role:           fromDbRole(member.role),
    status:         fromDbStatus(member.status),
    joined_at:      member.joined_at ?? member.created_at ?? new Date().toISOString(),
  };
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Returns all members of a workspace, with profile data merged in.
 */
export async function repoGetMembersByWorkspace(
  workspaceUuid: string,
): Promise<WorkspaceMemberRecord[]> {
  await requireAuthSession();
  const { data: members, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceUuid);

  if (error) {
    console.warn('[workspaceMembersRepository] Failed to load members:', error.message);
    return [];
  }
  if (!members || members.length === 0) return [];

  const rows = members as DbMemberRow[];
  const userIds = [...new Set(rows.map((m) => m.user_id))];

  // Fetch profiles for all member user_ids in one query.
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, full_name, display_name, phone_number, whatsapp_number, avatar_url')
    .in('id', userIds);

  const profileMap = new Map<string, DbProfileRow>(
    (profiles ?? []).map((p) => [p.id as string, p as DbProfileRow]),
  );

  return rows.map((m) => mergeMemberWithProfile(m, profileMap.get(m.user_id) ?? null));
}

/**
 * Returns all workspace memberships for a given user.
 */
export async function repoGetMembersByUserId(
  userId: string,
): Promise<WorkspaceMemberRecord[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.warn('[workspaceMembersRepository] Failed to load memberships by user:', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, full_name, display_name, phone_number, whatsapp_number, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return (data as DbMemberRow[]).map((m) =>
    mergeMemberWithProfile(m, (profile as DbProfileRow | null) ?? null),
  );
}

/**
 * Returns a single membership record for a user in a workspace, or null.
 */
export async function repoGetMemberByUserId(
  workspaceUuid: string,
  userId: string,
): Promise<WorkspaceMemberRecord | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceUuid)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, full_name, display_name, phone_number, whatsapp_number, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return mergeMemberWithProfile(
    data as DbMemberRow,
    (profile as DbProfileRow | null) ?? null,
  );
}

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Inserts a new workspace_members row.
 * The user_id must be a real Supabase auth.users UUID.
 */
export async function repoInsertMember(
  input: MemberCreateInput,
): Promise<WorkspaceMemberRecord> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: input.workspace_uuid,
      user_id:      input.user_id,
      role:         toDbRole(input.role),
      status:       'Aktif',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new WorkspaceMembersRepoError('User is already a member of this workspace.', 'DUPLICATE_USER');
    }
    throw new WorkspaceMembersRepoError(error.message, error.code);
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, full_name, display_name, phone_number, whatsapp_number, avatar_url')
    .eq('id', input.user_id)
    .maybeSingle();

  return mergeMemberWithProfile(
    data as DbMemberRow,
    (profile as DbProfileRow | null) ?? null,
  );
}

/**
 * Updates a member's role. Owner role is immutable.
 */
export async function repoUpdateMemberRole(
  memberUuid: string,
  newRole: MemberRole,
): Promise<WorkspaceMemberRecord | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspace_members')
    .update({ role: toDbRole(newRole) })
    .eq('id', memberUuid)
    .select()
    .maybeSingle();

  if (error) throw new WorkspaceMembersRepoError(error.message, error.code);
  if (!data) return null;

  const row = data as DbMemberRow;
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, full_name, display_name, phone_number, whatsapp_number, avatar_url')
    .eq('id', row.user_id)
    .maybeSingle();

  return mergeMemberWithProfile(row, (profile as DbProfileRow | null) ?? null);
}

/**
 * Updates a member's status.
 */
export async function repoUpdateMemberStatus(
  memberUuid: string,
  status: MemberStatus,
): Promise<WorkspaceMemberRecord | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspace_members')
    .update({ status: toDbStatus(status) })
    .eq('id', memberUuid)
    .select()
    .maybeSingle();

  if (error) throw new WorkspaceMembersRepoError(error.message, error.code);
  if (!data) return null;

  const row = data as DbMemberRow;
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, full_name, display_name, phone_number, whatsapp_number, avatar_url')
    .eq('id', row.user_id)
    .maybeSingle();

  return mergeMemberWithProfile(row, (profile as DbProfileRow | null) ?? null);
}

/**
 * Hard-deletes a workspace_members row.
 * Returns true if a row was removed.
 */
export async function repoDeleteMember(memberUuid: string): Promise<boolean> {
  await requireAuthSession();
  const { error, count } = await supabase
    .from('workspace_members')
    .delete({ count: 'exact' })
    .eq('id', memberUuid);

  if (error) throw new WorkspaceMembersRepoError(error.message, error.code);
  return (count ?? 0) > 0;
}

/**
 * Loads members for multiple workspaces in one batch.
 * Used by WorkspaceContext to warm the local members cache after login.
 */
export async function repoBatchGetMembersByWorkspaces(
  workspaceUuids: string[],
): Promise<WorkspaceMemberRecord[]> {
  await requireAuthSession();
  if (workspaceUuids.length === 0) return [];

  const { data: members, error } = await supabase
    .from('workspace_members')
    .select('*')
    .in('workspace_id', workspaceUuids);

  if (error) {
    console.warn('[workspaceMembersRepository] Batch fetch failed:', error.message);
    return [];
  }
  if (!members || members.length === 0) return [];

  const rows = members as DbMemberRow[];
  const userIds = [...new Set(rows.map((m) => m.user_id))];

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, full_name, display_name, phone_number, whatsapp_number, avatar_url')
    .in('id', userIds);

  const profileMap = new Map<string, DbProfileRow>(
    (profiles ?? []).map((p) => [p.id as string, p as DbProfileRow]),
  );

  return rows.map((m) => mergeMemberWithProfile(m, profileMap.get(m.user_id) ?? null));
}
