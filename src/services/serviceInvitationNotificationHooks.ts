// ─── FARM-FIX-005.4 — Service Invitation Notification Hooks ──────────────────
// Notification hooks for the service participant invitation lifecycle.
//
// Architecture rules:
//  - Every invitation lifecycle event fires ONE notification via createNotification().
//  - Notifications are fire-and-forget — errors are swallowed so a notification
//    failure can never break the invitation mutation.
//  - NO push notification is implemented here. This file is the integration
//    boundary that a future push-notification layer plugs into.
//  - The `reference_module` is 'marketplace' and `reference_uuid` carries the
//    invitation UUID so future consumers can deep-link into the correct room.
//  - All hook functions are pure-output (they do not read or mutate invitation
//    state) and receive fully-resolved strings so this file has zero data-layer
//    imports beyond globalNotificationService.
//
// Future integration points:
//  - Replace createNotification() calls with a push-capable adapter.
//  - Add email / WhatsApp / WebSocket channels by wrapping each hook.
//  - Wire into a server-side event queue by replacing the in-memory store.

import {
  createNotification,
  NOTIFICATION_TYPE_UUID,
  PRIORITY_UUID,
} from './globalNotificationService';

// ─── Shared input shapes ───────────────────────────────────────────────────────

export interface InvitationNotificationContext {
  /** UUID of the ParticipantInvitation record. */
  invitationUuid: string;
  /** UUID of the chat room. */
  chatId: string;
  /** Display name of the workspace that sent the invitation. */
  inviterName: string;
  /** UUID of the workspace that sent the invitation. */
  inviterWorkspaceId: string;
  /** Display name of the workspace that was invited. */
  targetName: string;
  /** UUID of the workspace that was invited. */
  targetWorkspaceId: string;
  /** Human-readable label of the service role (e.g. "Escrow", "Transport"). */
  serviceRoleLabel: string;
}

// ─── Internal helper ──────────────────────────────────────────────────────────

// createNotification is now async; use fire-and-forget pattern.
function safe(fn: () => Promise<unknown>): void {
  fn().catch(() => { /* notifications must never crash the caller */ });
}

// ─── Hook: Invitation Created ─────────────────────────────────────────────────

/**
 * Fire when an invitation is created.
 * Notifies the TARGET workspace that it has been invited.
 */
export function notifyInvitationCreated(ctx: InvitationNotificationContext): void {
  safe(() => createNotification({
    notification_type_reference_uuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    reference_module: 'marketplace',
    reference_uuid: ctx.invitationUuid,
    title: 'Undangan Layanan Baru',
    message: `${ctx.inviterName} mengundang Anda bergabung sebagai ${ctx.serviceRoleLabel} di Ruang Transaksi.`,
    icon: '📨',
    action_label: 'Lihat Ruang',
    action_route: `/marketplace/chat/${ctx.chatId}`,
    priority_reference_uuid: PRIORITY_UUID.NORMAL,
    target_workspace_uuid: ctx.targetWorkspaceId,
    sender_workspace_uuid: ctx.inviterWorkspaceId,
  }));
}

// ─── Hook: Invitation Accepted ────────────────────────────────────────────────

/**
 * Fire when an invitation is accepted.
 * Notifies the INVITER that the service workspace has joined.
 */
export function notifyInvitationAccepted(ctx: InvitationNotificationContext): void {
  safe(() => createNotification({
    notification_type_reference_uuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    reference_module: 'marketplace',
    reference_uuid: ctx.invitationUuid,
    title: 'Undangan Diterima',
    message: `${ctx.targetName} menerima undangan dan bergabung sebagai ${ctx.serviceRoleLabel}.`,
    icon: '✅',
    action_label: 'Lihat Ruang',
    action_route: `/marketplace/chat/${ctx.chatId}`,
    priority_reference_uuid: PRIORITY_UUID.NORMAL,
    target_workspace_uuid: ctx.inviterWorkspaceId,
    sender_workspace_uuid: ctx.targetWorkspaceId,
  }));
}

// ─── Hook: Invitation Declined ────────────────────────────────────────────────

/**
 * Fire when an invitation is declined.
 * Notifies the INVITER that the service workspace has declined.
 */
export function notifyInvitationDeclined(ctx: InvitationNotificationContext): void {
  safe(() => createNotification({
    notification_type_reference_uuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    reference_module: 'marketplace',
    reference_uuid: ctx.invitationUuid,
    title: 'Undangan Ditolak',
    message: `${ctx.targetName} menolak undangan sebagai ${ctx.serviceRoleLabel}.`,
    icon: '❌',
    action_label: 'Lihat Ruang',
    action_route: `/marketplace/chat/${ctx.chatId}`,
    priority_reference_uuid: PRIORITY_UUID.NORMAL,
    target_workspace_uuid: ctx.inviterWorkspaceId,
    sender_workspace_uuid: ctx.targetWorkspaceId,
  }));
}

// ─── Hook: Invitation Cancelled ───────────────────────────────────────────────

/**
 * Fire when an invitation is cancelled by its creator.
 * Notifies the TARGET workspace that the invitation has been withdrawn.
 */
export function notifyInvitationCancelled(ctx: InvitationNotificationContext): void {
  safe(() => createNotification({
    notification_type_reference_uuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    reference_module: 'marketplace',
    reference_uuid: ctx.invitationUuid,
    title: 'Undangan Dibatalkan',
    message: `${ctx.inviterName} membatalkan undangan sebagai ${ctx.serviceRoleLabel}.`,
    icon: '🚫',
    action_label: 'Lihat Ruang',
    action_route: `/marketplace/chat/${ctx.chatId}`,
    priority_reference_uuid: PRIORITY_UUID.LOW,
    target_workspace_uuid: ctx.targetWorkspaceId,
    sender_workspace_uuid: ctx.inviterWorkspaceId,
  }));
}

// ─── Hook: Invitation Expired ─────────────────────────────────────────────────

/**
 * Fire when an invitation expires (future: time-based scheduler calls this).
 * Notifies the INVITER that the invitation window has passed.
 */
export function notifyInvitationExpired(ctx: InvitationNotificationContext): void {
  safe(() => createNotification({
    notification_type_reference_uuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    reference_module: 'marketplace',
    reference_uuid: ctx.invitationUuid,
    title: 'Undangan Kedaluwarsa',
    message: `Undangan untuk ${ctx.targetName} sebagai ${ctx.serviceRoleLabel} telah kedaluwarsa.`,
    icon: '⏰',
    action_label: 'Undang Ulang',
    action_route: `/marketplace/chat/${ctx.chatId}`,
    priority_reference_uuid: PRIORITY_UUID.LOW,
    target_workspace_uuid: ctx.inviterWorkspaceId,
    sender_workspace_uuid: ctx.targetWorkspaceId,
  }));
}
