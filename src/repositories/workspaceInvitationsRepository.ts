// ─── Workspace Invitations Repository — DB-001B ───────────────────────────────
//
// Async Supabase adapter for the `workspace_invitations` table (DB-001A).
// This is the ONLY file that touches workspace_invitations via Supabase.
//
// DB-001A column contract (workspace_invitations):
//   id           uuid PK
//   workspace_id uuid FK → workspaces.id ON DELETE CASCADE
//   invited_by   uuid FK → auth.users.id
//   email        text NOT NULL
//   role         member_role ENUM (Owner | Admin | Staff | Viewer) DEFAULT 'Viewer'
//   token        text UNIQUE NOT NULL
//   status       text CHECK ('Pending' | 'Accepted' | 'Expired' | 'Revoked') DEFAULT 'Pending'
//   expires_at   timestamptz
//   created_at   timestamptz NOT NULL DEFAULT now()
//
// RLS: workspace_invitations_manage_admin
//   FOR ALL USING (is_workspace_member(workspace_id, ARRAY['Owner', 'Admin']))
//
// Rules:
//  - All functions are async.
//  - Never import from pages, components, or contexts.
//  - Token generation is a server-safe random string — client generates UUID as token.
//  - Callers must pass `invited_by` from the current auth session (not derived here).

import { supabase } from '../lib/supabase';
import type { MemberRole } from '../types/workspacePermissions';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvitationStatus = 'Pending' | 'Accepted' | 'Expired' | 'Revoked' | 'Rejected';

export interface WorkspaceInvitationRecord {
  id:           string;
  workspace_id: string;
  invited_by:   string;
  email:        string;
  phone:        string | null;
  role:         MemberRole;
  token:        string;
  status:       InvitationStatus;
  expires_at:   string | null;
  created_at:   string;
}

export interface InvitationCreateInput {
  workspace_id: string;
  invited_by:   string;
  email:        string;
  role:         MemberRole;
  token:        string;
  expires_at?:  string | null;
}

// ─── Error type ───────────────────────────────────────────────────────────────

export class InvitationRepoError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'InvitationRepoError';
  }
}

// ─── Enum translators ─────────────────────────────────────────────────────────

/** App MemberRole → DB member_role enum value */
function toDbRole(role: MemberRole): string {
  // Manager is not a DB-001A enum value; fall back to Staff
  if (role === 'Manager') return 'Staff';
  return role; // Owner, Admin, Staff, Viewer pass through
}

/** DB member_role → App MemberRole */
function fromDbRole(dbRole: string): MemberRole {
  const map: Record<string, MemberRole> = {
    Owner:  'Owner',
    Admin:  'Admin',
    Staff:  'Staff',
    Viewer: 'Viewer',
    Guest:  'Viewer',
  };
  return (map[dbRole] as MemberRole) ?? 'Viewer';
}

/** Raw DB row → WorkspaceInvitationRecord */
function fromDbRow(row: Record<string, unknown>): WorkspaceInvitationRecord {
  return {
    id:           row.id as string,
    workspace_id: row.workspace_id as string,
    invited_by:   row.invited_by as string,
    email:        row.email as string,
    phone:        (row.phone as string | null) ?? null,
    role:         fromDbRole(row.role as string),
    token:        row.token as string,
    status:       row.status as InvitationStatus,
    expires_at:   (row.expires_at as string | null) ?? null,
    created_at:   row.created_at as string,
  };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Returns all invitations for a workspace (any status).
 * Caller must be Owner or Admin of the workspace (enforced by RLS).
 */
export async function repoListWorkspaceInvitations(
  workspaceId: string,
): Promise<WorkspaceInvitationRecord[]> {
  try {
    const { data, error } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[workspaceInvitationsRepository] listInvitations error:', error.message);
      return [];
    }

    return (data ?? []).map((row) => fromDbRow(row as Record<string, unknown>));
  } catch (err) {
    console.warn('[workspaceInvitationsRepository] Unexpected error in listInvitations:', err);
    return [];
  }
}

/**
 * Returns only Pending invitations for a workspace.
 */
export async function repoListPendingInvitations(
  workspaceId: string,
): Promise<WorkspaceInvitationRecord[]> {
  try {
    const { data, error } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[workspaceInvitationsRepository] listPendingInvitations error:', error.message);
      return [];
    }

    return (data ?? []).map((row) => fromDbRow(row as Record<string, unknown>));
  } catch (err) {
    console.warn('[workspaceInvitationsRepository] Unexpected error in listPendingInvitations:', err);
    return [];
  }
}

/**
 * Looks up an invitation by its unique token.
 * Returns null if not found or if the token is expired/revoked.
 */
export async function repoGetInvitationByToken(
  token: string,
): Promise<WorkspaceInvitationRecord | null> {
  try {
    const { data, error } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      console.warn('[workspaceInvitationsRepository] getByToken error:', error.message);
      return null;
    }

    return data ? fromDbRow(data as Record<string, unknown>) : null;
  } catch (err) {
    console.warn('[workspaceInvitationsRepository] Unexpected error in getByToken:', err);
    return null;
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Creates a new workspace invitation.
 * Returns the created record, or throws InvitationRepoError on failure.
 * Caller must be Owner or Admin of the workspace (enforced by RLS).
 */
export async function repoCreateInvitation(
  input: InvitationCreateInput,
): Promise<WorkspaceInvitationRecord> {
  const { data, error } = await supabase
    .from('workspace_invitations')
    .insert({
      workspace_id: input.workspace_id,
      invited_by:   input.invited_by,
      email:        input.email.toLowerCase().trim(),
      role:         toDbRole(input.role),
      token:        input.token,
      status:       'Pending',
      expires_at:   input.expires_at ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new InvitationRepoError(error.message, error.code);
  }

  return fromDbRow(data as Record<string, unknown>);
}

/**
 * Sets an invitation's status to 'Revoked'.
 * Caller must be Owner or Admin of the workspace (enforced by RLS).
 * Returns true on success, false if the invitation was not found.
 */
export async function repoRevokeInvitation(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('workspace_invitations')
    .update({ status: 'Revoked' })
    .eq('id', id)
    .eq('status', 'Pending');  // Only revoke pending invitations

  if (error) {
    throw new InvitationRepoError(error.message, error.code);
  }

  return (count ?? 0) > 0;
}

/**
 * Sets an invitation's status to 'Accepted' by token.
 * Called after a user has successfully joined the workspace.
 * Returns true on success, false if the token is not found or not Pending.
 */
export async function repoAcceptInvitationByToken(token: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('workspace_invitations')
    .update({ status: 'Accepted' })
    .eq('token', token)
    .eq('status', 'Pending');

  if (error) {
    throw new InvitationRepoError(error.message, error.code);
  }

  return (count ?? 0) > 0;
}

/**
 * Marks all Pending invitations for an email as Expired.
 * Called when invitations pass their expires_at date (future: scheduled job).
 * Silently ignores errors to avoid breaking callers.
 */
export async function repoExpireInvitationsByEmail(email: string): Promise<void> {
  const { error } = await supabase
    .from('workspace_invitations')
    .update({ status: 'Expired' })
    .eq('email', email.toLowerCase().trim())
    .eq('status', 'Pending')
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.warn('[workspaceInvitationsRepository] expireByEmail error (non-fatal):', error.message);
  }
}
