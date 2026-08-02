// ─── FARM-FIX-005.3 + 005.4 — Room Timeline ──────────────────────────────────
// Immutable event log for participant lifecycle events in a Transaction Room.
//
// Architecture rules:
//  - This file has NO imports from other domain data files (only uuid util).
//  - All actor/target info is passed as strings at log time — no live lookups.
//  - Events are append-only; no deletion or mutation after creation.
//  - getTimeline() always returns a sorted (ASC) copy — never the raw array.
//  - Convenience loggers produce the human-readable `description` string so
//    call-sites stay clean (no string interpolation in pages or data files).
//  - FARM-FIX-005.3 logs: RoomCreated, ParticipantInvited, ParticipantJoined,
//    ParticipantDeclined, ParticipantRemoved.
//  - FARM-FIX-005.4 adds: InvitationCancelled, InvitationExpired.
//    ParticipantCompleted is reserved for future Escrow/Transport completion.

import { generateUUID } from '../utils/uuid';

// ─── Event Types ──────────────────────────────────────────────────────────────

export type RoomTimelineEventType =
  | 'RoomCreated'
  | 'ParticipantInvited'
  | 'ParticipantJoined'
  | 'ParticipantDeclined'
  | 'ParticipantRemoved'
  | 'InvitationCancelled'  // FARM-FIX-005.4 — creator withdraws the invitation
  | 'InvitationExpired'    // FARM-FIX-005.4 — invitation passed its validity window
  | 'ParticipantCompleted'; // reserved for future workflow completion events

export const TIMELINE_EVENT_ICON: Record<RoomTimelineEventType, string> = {
  RoomCreated: '🏠',
  ParticipantInvited: '📨',
  ParticipantJoined: '✅',
  ParticipantDeclined: '❌',
  ParticipantRemoved: '🚫',
  InvitationCancelled: '🚫',
  InvitationExpired: '⏰',
  ParticipantCompleted: '🏁',
};

export const TIMELINE_EVENT_LABEL: Record<RoomTimelineEventType, string> = {
  RoomCreated: 'Ruangan Dibuat',
  ParticipantInvited: 'Peserta Diundang',
  ParticipantJoined: 'Peserta Bergabung',
  ParticipantDeclined: 'Undangan Ditolak',
  ParticipantRemoved: 'Peserta Dihapus',
  InvitationCancelled: 'Undangan Dibatalkan',
  InvitationExpired: 'Undangan Kedaluwarsa',
  ParticipantCompleted: 'Layanan Selesai',
};

// ─── Event Record ─────────────────────────────────────────────────────────────

export interface RoomTimelineEvent {
  uuid: string;
  chatId: string;
  eventType: RoomTimelineEventType;
  /** Workspace that triggered the event. */
  actorWorkspaceId: string;
  actorName: string;
  actorRole: string;
  /** Workspace the event is about (null when actor === subject). */
  targetWorkspaceId: string | null;
  targetName: string | null;
  targetRole: string | null;
  timestamp: string;
  /** Pre-built human-readable sentence shown in the timeline UI. */
  description: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

/** chatId → ordered list of events (append-only). */
const TIMELINE_STORE = new Map<string, RoomTimelineEvent[]>();

function getList(chatId: string): RoomTimelineEvent[] {
  let list = TIMELINE_STORE.get(chatId);
  if (!list) { list = []; TIMELINE_STORE.set(chatId, list); }
  return list;
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/** All events for a room, sorted chronologically (oldest first). */
export function getTimeline(chatId: string): RoomTimelineEvent[] {
  return [...getList(chatId)].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

/** Internal writer — used only by the convenience loggers below. */
export function addTimelineEvent(
  input: Omit<RoomTimelineEvent, 'uuid'>,
): RoomTimelineEvent {
  const event: RoomTimelineEvent = { uuid: generateUUID(), ...input };
  getList(input.chatId).push(event);
  return event;
}

/** True when a RoomCreated event already exists for this chatId. */
export function hasRoomCreatedEvent(chatId: string): boolean {
  return getList(chatId).some(e => e.eventType === 'RoomCreated');
}

// ─── Convenience loggers ──────────────────────────────────────────────────────

export function logRoomCreated(input: {
  chatId: string;
  actorWorkspaceId: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
}): void {
  if (hasRoomCreatedEvent(input.chatId)) return; // idempotent
  addTimelineEvent({
    chatId: input.chatId,
    eventType: 'RoomCreated',
    actorWorkspaceId: input.actorWorkspaceId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    targetWorkspaceId: null,
    targetName: null,
    targetRole: null,
    timestamp: input.timestamp,
    description: `Ruang transaksi dibuat oleh ${input.actorName} (${input.actorRole}).`,
  });
}

export function logParticipantInvited(input: {
  chatId: string;
  actorWorkspaceId: string;
  actorName: string;
  actorRole: string;
  targetWorkspaceId: string;
  targetName: string;
  targetRole: string;
  timestamp: string;
}): void {
  addTimelineEvent({
    chatId: input.chatId,
    eventType: 'ParticipantInvited',
    actorWorkspaceId: input.actorWorkspaceId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    targetWorkspaceId: input.targetWorkspaceId,
    targetName: input.targetName,
    targetRole: input.targetRole,
    timestamp: input.timestamp,
    description: `${input.actorName} mengundang ${input.targetName} sebagai ${input.targetRole}.`,
  });
}

export function logParticipantJoined(input: {
  chatId: string;
  actorWorkspaceId: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
}): void {
  addTimelineEvent({
    chatId: input.chatId,
    eventType: 'ParticipantJoined',
    actorWorkspaceId: input.actorWorkspaceId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    targetWorkspaceId: null,
    targetName: null,
    targetRole: null,
    timestamp: input.timestamp,
    description: `${input.actorName} bergabung sebagai ${input.actorRole}.`,
  });
}

export function logParticipantDeclined(input: {
  chatId: string;
  actorWorkspaceId: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
}): void {
  addTimelineEvent({
    chatId: input.chatId,
    eventType: 'ParticipantDeclined',
    actorWorkspaceId: input.actorWorkspaceId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    targetWorkspaceId: null,
    targetName: null,
    targetRole: null,
    timestamp: input.timestamp,
    description: `${input.actorName} menolak undangan sebagai ${input.actorRole}.`,
  });
}

export function logParticipantRemoved(input: {
  chatId: string;
  actorWorkspaceId: string;
  actorName: string;
  actorRole: string;
  targetWorkspaceId: string;
  targetName: string;
  targetRole: string;
  timestamp: string;
}): void {
  addTimelineEvent({
    chatId: input.chatId,
    eventType: 'ParticipantRemoved',
    actorWorkspaceId: input.actorWorkspaceId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    targetWorkspaceId: input.targetWorkspaceId,
    targetName: input.targetName,
    targetRole: input.targetRole,
    timestamp: input.timestamp,
    description: `${input.actorName} menghapus ${input.targetName} dari ruang transaksi.`,
  });
}

export function logInvitationCancelled(input: {
  chatId: string;
  actorWorkspaceId: string;
  actorName: string;
  actorRole: string;
  targetWorkspaceId: string;
  targetName: string;
  targetRole: string;
  timestamp: string;
}): void {
  addTimelineEvent({
    chatId: input.chatId,
    eventType: 'InvitationCancelled',
    actorWorkspaceId: input.actorWorkspaceId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    targetWorkspaceId: input.targetWorkspaceId,
    targetName: input.targetName,
    targetRole: input.targetRole,
    timestamp: input.timestamp,
    description: `${input.actorName} membatalkan undangan untuk ${input.targetName} (${input.targetRole}).`,
  });
}

export function logInvitationExpired(input: {
  chatId: string;
  actorWorkspaceId: string;
  actorName: string;
  actorRole: string;
  targetWorkspaceId: string;
  targetName: string;
  targetRole: string;
  timestamp: string;
}): void {
  addTimelineEvent({
    chatId: input.chatId,
    eventType: 'InvitationExpired',
    actorWorkspaceId: input.actorWorkspaceId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    targetWorkspaceId: input.targetWorkspaceId,
    targetName: input.targetName,
    targetRole: input.targetRole,
    timestamp: input.timestamp,
    description: `Undangan untuk ${input.targetName} sebagai ${input.targetRole} telah kedaluwarsa.`,
  });
}
