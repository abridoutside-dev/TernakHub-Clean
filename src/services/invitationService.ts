// ─── Invitation Service — AUTH-001B ──────────────────────────────────────────
//
// Business logic for workspace invitation flows.
//
// Architecture:
//   sendInvitation   → validates + calls repoCreateInvitation
//   getInvitationByToken → calls DB function get_invitation_details (bypasses RLS)
//   acceptInvitation → calls DB function accept_workspace_invitation (atomic)
//   rejectInvitation → calls DB function reject_workspace_invitation
//   revokeInvitation → calls repoRevokeInvitation (Owner/Admin only)
//   listInvitations  → delegates to repoListWorkspaceInvitations
//
// Invite URL:
//   The service returns the token only. Callers construct:
//   `${window.location.origin}/invite/${token}`
//
// Rules:
//  - No UI imports. No React.
//  - Phone invitations: the link is shared manually (WhatsApp / SMS).
//  - Email invitations: the link is shown to the Owner to copy and paste.
//    (Email delivery is a future feature — out of scope for AUTH-001B.)
//  - Token = UUID v4; cryptographically unguessable.

import { supabase } from '../lib/supabase';
import { generateUUID } from '../utils/uuid';
import {
  repoCreateInvitation,
  repoRevokeInvitation,
  repoListWorkspaceInvitations,
  repoListPendingInvitations,
  type WorkspaceInvitationRecord,
  type InvitationStatus,
} from '../repositories/workspaceInvitationsRepository';
export type { WorkspaceInvitationRecord };
import type { MemberRole } from '../types/workspacePermissions';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendInvitationInput {
  workspace_id: string;
  invited_by:   string;           // auth.users UUID of the inviter
  /** Email OR phone must be provided. */
  email?:       string | null;
  phone?:       string | null;
  role:         MemberRole;
  /** Optional: expiry date. Defaults to 7 days from now. */
  expires_in_days?: number;
}

export interface SendInvitationResult {
  token:    string;
  invitation: WorkspaceInvitationRecord;
}

export interface InvitationDetails {
  id:             string;
  workspace_id:   string;
  workspace_name: string;
  invited_by:     string;
  email:          string | null;
  phone:          string | null;
  role:           MemberRole;
  status:         InvitationStatus;
  expires_at:     string | null;
  created_at:     string;
}

export type InvitationServiceError =
  | 'NO_CONTACT'          // neither email nor phone provided
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'ALREADY_INVITED'     // a Pending invitation for this email/phone already exists
  | 'NOT_FOUND'
  | 'NOT_PENDING'
  | 'EXPIRED'
  | 'ALREADY_MEMBER'
  | 'UNKNOWN';

export type InvitationServiceResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: InvitationServiceError; message: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePhone(phone: string): boolean {
  // Accepts +62..., 08..., or 8... with 8–15 digits
  return /^(\+62|62|0)?[0-9]{8,15}$/.test(phone.replace(/[\s\-()]/g, ''));
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ─── Send ─────────────────────────────────────────────────────────────────────

/**
 * Creates a workspace invitation. Returns the token and full record on success.
 * Token should be used to construct: `${origin}/invite/${token}`
 */
export async function sendInvitation(
  input: SendInvitationInput,
): Promise<InvitationServiceResult<SendInvitationResult>> {
  const email = input.email?.trim() || null;
  const phone = input.phone?.trim() || null;

  // Validation
  if (!email && !phone) {
    return { ok: false, error: 'NO_CONTACT', message: 'Email atau nomor HP wajib diisi.' };
  }
  if (email && !validateEmail(email)) {
    return { ok: false, error: 'INVALID_EMAIL', message: 'Format email tidak valid.' };
  }
  if (phone && !validatePhone(phone)) {
    return { ok: false, error: 'INVALID_PHONE', message: 'Format nomor HP tidak valid.' };
  }

  const token     = generateUUID();
  const expiresAt = addDays(input.expires_in_days ?? 7);

  try {
    const record = await repoCreateInvitation({
      workspace_id: input.workspace_id,
      invited_by:   input.invited_by,
      email:        email ?? (phone ? `phone:${normalizePhone(phone)}` : ''),
      role:         input.role,
      token,
      expires_at:   expiresAt,
    });

    return {
      ok: true,
      data: {
        token,
        invitation: record,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal membuat undangan.';
    const isDuplicate = message.toLowerCase().includes('already') ||
                        message.toLowerCase().includes('unique') ||
                        (err as { code?: string })?.code === '23505';
    return {
      ok: false,
      error: isDuplicate ? 'ALREADY_INVITED' : 'UNKNOWN',
      message: isDuplicate ? 'Sudah ada undangan aktif untuk kontak ini.' : message,
    };
  }
}

// ─── Get by token (bypasses RLS via DB function) ──────────────────────────────

/**
 * Looks up invitation details by token using the get_invitation_details DB function.
 * Works for any authenticated user — used on the /invite/:token accept page.
 */
export async function getInvitationByToken(
  token: string,
): Promise<InvitationServiceResult<InvitationDetails>> {
  try {
    const { data, error } = await supabase.rpc('get_invitation_details', {
      p_token: token,
    });

    if (error) {
      return { ok: false, error: 'UNKNOWN', message: error.message };
    }

    const rows = data as Array<Record<string, unknown>> | null;
    if (!rows || rows.length === 0) {
      return { ok: false, error: 'NOT_FOUND', message: 'Undangan tidak ditemukan.' };
    }

    const row = rows[0];
    return {
      ok: true,
      data: {
        id:             row.id as string,
        workspace_id:   row.workspace_id as string,
        workspace_name: row.workspace_name as string,
        invited_by:     row.invited_by as string,
        email:          (row.email as string | null) ?? null,
        phone:          (row.phone as string | null) ?? null,
        role:           row.role as MemberRole,
        status:         row.status as InvitationStatus,
        expires_at:     (row.expires_at as string | null) ?? null,
        created_at:     row.created_at as string,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal memuat undangan.';
    return { ok: false, error: 'UNKNOWN', message };
  }
}

// ─── Accept (atomic, bypasses RLS via DB function) ────────────────────────────

/**
 * Atomically accepts an invitation: inserts the member row and marks the
 * invitation Accepted. Calls the accept_workspace_invitation DB function.
 */
export async function acceptInvitation(
  token:  string,
  userId: string,
): Promise<InvitationServiceResult<{ workspace_id: string; role: MemberRole }>> {
  try {
    const { data, error } = await supabase.rpc('accept_workspace_invitation', {
      p_token:   token,
      p_user_id: userId,
    });

    if (error) {
      return { ok: false, error: 'UNKNOWN', message: error.message };
    }

    const result = data as { ok: boolean; error?: string; workspace_id?: string; role?: string };

    if (!result.ok) {
      const msg = result.error ?? 'Gagal menerima undangan.';
      const code: InvitationServiceError =
        msg.includes('kadaluarsa') || msg.includes('expired') ? 'EXPIRED' :
        msg.includes('tidak ditemukan') || msg.includes('not found') ? 'NOT_FOUND' :
        'NOT_PENDING';
      return { ok: false, error: code, message: msg };
    }

    return {
      ok: true,
      data: {
        workspace_id: result.workspace_id!,
        role:         result.role as MemberRole,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menerima undangan.';
    return { ok: false, error: 'UNKNOWN', message };
  }
}

// ─── Reject (invitee declines) ────────────────────────────────────────────────

/**
 * Marks the invitation as Rejected. Called when the invitee declines.
 * Calls the reject_workspace_invitation DB function (bypasses RLS).
 */
export async function rejectInvitation(
  token: string,
): Promise<InvitationServiceResult<boolean>> {
  try {
    const { data, error } = await supabase.rpc('reject_workspace_invitation', {
      p_token: token,
    });

    if (error) {
      return { ok: false, error: 'UNKNOWN', message: error.message };
    }

    return { ok: true, data: data as boolean };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menolak undangan.';
    return { ok: false, error: 'UNKNOWN', message };
  }
}

// ─── Revoke (inviter cancels) ─────────────────────────────────────────────────

/**
 * Marks the invitation as Revoked. Called by an Owner/Admin.
 * Requires RLS: caller must be Owner or Admin of the workspace.
 */
export async function revokeInvitation(
  invitationId: string,
): Promise<InvitationServiceResult<boolean>> {
  try {
    const revoked = await repoRevokeInvitation(invitationId);
    return { ok: true, data: revoked };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal membatalkan undangan.';
    return { ok: false, error: 'UNKNOWN', message };
  }
}

// ─── Resend (revoke old + create new) ────────────────────────────────────────

/**
 * Re-sends an invitation by revoking the existing one and creating a fresh one
 * with the same contact (email/phone) and role. Returns the new token on success.
 *
 * Safe to call on both Pending and Expired invitations.
 */
export async function resendInvitation(
  invitation: WorkspaceInvitationRecord,
  invitedBy: string,
): Promise<InvitationServiceResult<SendInvitationResult>> {
  // Silently revoke the old record so it no longer blocks ALREADY_INVITED check.
  await revokeInvitation(invitation.id).catch(() => {/* non-fatal */});

  // Detect whether the original contact was a phone number (stored with "phone:" prefix).
  const isPhone = invitation.email?.startsWith('phone:') ?? false;
  const email   = isPhone ? null : (invitation.email ?? null);
  const phone   = isPhone
    ? (invitation.email?.slice(6) ?? null)
    : (invitation.phone ?? null);

  return sendInvitation({
    workspace_id: invitation.workspace_id,
    invited_by:   invitedBy,
    email,
    phone,
    role: invitation.role,
  });
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listInvitations(
  workspaceId: string,
): Promise<WorkspaceInvitationRecord[]> {
  return repoListWorkspaceInvitations(workspaceId);
}

export async function listPendingInvitations(
  workspaceId: string,
): Promise<WorkspaceInvitationRecord[]> {
  return repoListPendingInvitations(workspaceId);
}
