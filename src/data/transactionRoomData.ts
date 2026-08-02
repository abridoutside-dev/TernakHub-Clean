// ─── FARM-FIX-005.1 — Transaction Room Foundation ────────────────────────────
// Extends Marketplace Chat into a multi-participant Transaction Room.
//
// Architecture rules:
//  - TransactionRoom is a superset of ChatRoom; all ChatRoom functions still work.
//  - Participants live in a parallel overlay (PARTICIPANT_STORE) keyed by chatId.
//    Buyer + Seller are auto-derived from ChatRoom fields on first access.
//  - Reserved roles (Escrow, Transport, Veterinarian, Other) are architecturally
//    defined but carry NO business logic yet — add it in future feature tasks.
//  - Permission matrix is role-based and fully extensible: add a new role +
//    its allowed permissions here without touching any page component.
//  - marketplaceChatData.ts is NOT modified; all mutations (sendMessage,
//    markChatAsRead, etc.) are imported and re-exported from here unchanged.

import { generateUUID } from '../utils/uuid';
import {
  getChatRoomById,
  getChatRoomsByWorkspace,
  sendMessage as _sendMessage,
  markChatAsRead as _markChatAsRead,
  createChatRoom as _createChatRoom,
  getOrCreateChat as _getOrCreateChat,
  getChatMessages as _getChatMessages,
  getTotalUnread as _getTotalUnread,
  type ChatRoom,
  type ChatMessage,
  type ChatMessageTipe,
  type ChatMessageStatus,
  type NotifikasiChat,
  type NotifikasiChatTipe,
} from './marketplaceChatData';
import { WORKSPACES } from '../components/TopAppBar';

// ─── Re-exports (keep existing call-sites working) ────────────────────────────

export type { ChatMessage, ChatMessageTipe, ChatMessageStatus, NotifikasiChat, NotifikasiChatTipe };
export {
  _sendMessage as sendMessage,
  _markChatAsRead as markChatAsRead,
  _createChatRoom as createChatRoom,
  _getOrCreateChat as getOrCreateChat,
  _getChatMessages as getChatMessages,
  _getTotalUnread as getTotalUnread,
};

// ─── Participant Role ──────────────────────────────────────────────────────────

/**
 * All roles that can ever appear in a Transaction Room.
 * Pembeli + Penjual are active today.
 * The rest are reserved — add their business logic in future phases
 * without changing this union or any existing component.
 */
export type TransactionParticipantRole =
  | 'Pembeli'
  | 'Penjual'
  | 'Escrow'        // reserved — no business logic yet
  | 'Transport'     // reserved — no business logic yet
  | 'Veterinarian'  // reserved — Dokter Hewan workspace
  | 'Clinic'        // reserved — Klinik Hewan workspace (distinct from Veterinarian)
  | 'Other';        // reserved — catch-all for future service providers

export type TransactionParticipantStatus =
  | 'Active'
  | 'Left'
  | 'Removed';

// ─── Participant ───────────────────────────────────────────────────────────────

export interface TransactionParticipant {
  /** Unique record UUID — NOT the workspace UUID. */
  uuid: string;
  /** Workspace this participant represents. */
  workspaceUuid: string;
  role: TransactionParticipantRole;
  displayName: string;
  /** Emoji / icon used as the avatar. */
  avatar: string;
  joinTime: string;
  status: TransactionParticipantStatus;
}

// ─── Transaction Status ────────────────────────────────────────────────────────

export type TransactionStatus =
  | 'Chat'       // conversation only — no deal yet
  | 'Negosiasi'  // negotiation in progress
  | 'Transaksi'  // deal reached, transaction ongoing
  | 'Selesai'    // fully completed
  | 'Dibatalkan'; // cancelled

export const TRANSACTION_STATUS_LABEL: Record<TransactionStatus, string> = {
  Chat: 'Chat',
  Negosiasi: 'Negosiasi',
  Transaksi: 'Transaksi',
  Selesai: 'Selesai',
  Dibatalkan: 'Dibatalkan',
};

export const TRANSACTION_STATUS_COLOR: Record<TransactionStatus, string> = {
  Chat: '#6b7280',
  Negosiasi: '#d97706',
  Transaksi: '#2563eb',
  Selesai: '#16a34a',
  Dibatalkan: '#dc2626',
};

export const TRANSACTION_STATUS_BG: Record<TransactionStatus, string> = {
  Chat: 'rgba(107,114,128,0.1)',
  Negosiasi: 'rgba(217,119,6,0.1)',
  Transaksi: 'rgba(37,99,235,0.1)',
  Selesai: 'rgba(22,163,74,0.1)',
  Dibatalkan: 'rgba(220,38,38,0.1)',
};

// ─── Transaction Room ──────────────────────────────────────────────────────────

/** ChatRoom enriched with participant list and transaction status. */
export interface TransactionRoom extends ChatRoom {
  participants: TransactionParticipant[];
  transactionStatus: TransactionStatus;
}

// ─── Room Info ─────────────────────────────────────────────────────────────────

/** Structured view of room metadata, used by RoomInfoSheet. */
export interface RoomInfo {
  roomId: string;
  listingUuid: string;
  transactionStatus: TransactionStatus;
  participants: TransactionParticipant[];
  createdAt: string;
  lastActivity: string;
}

// ─── Permissions ───────────────────────────────────────────────────────────────

export type RoomPermission =
  | 'send_message'
  | 'view_room_info'
  | 'view_listing'
  | 'view_participants'
  | 'create_deal'         // create a new Deal Proposal in this room
  | 'view_deal'           // view the Deal Summary
  | 'edit_deal'           // edit deal fields (while Draft or Waiting Approval)
  | 'submit_deal'         // submit deal for approval
  | 'approve_deal'        // vote approve/reject on a submitted deal
  | 'cancel_deal'         // cancel a deal (not yet Locked)
  | 'invite_participant'  // invite a service participant (Escrow, Transport, etc.)
  | 'remove_participant'  // remove a service participant from the room
  | 'view_timeline';      // view the room event timeline

/**
 * Role → permissions map.
 * To extend: add a new role to TransactionParticipantRole and add its
 * permissions here. No page components need to change.
 */
export const ROLE_PERMISSIONS: Record<TransactionParticipantRole, RoomPermission[]> = {
  Pembeli: [
    'send_message',
    'view_room_info',
    'view_listing',
    'view_participants',
    'create_deal',
    'view_deal',
    'edit_deal',
    'submit_deal',
    'approve_deal',
    'cancel_deal',
    'invite_participant',
    'remove_participant',
    'view_timeline',
  ],
  Penjual: [
    'send_message',
    'view_room_info',
    'view_listing',
    'view_participants',
    'create_deal',
    'view_deal',
    'edit_deal',
    'submit_deal',
    'approve_deal',
    'cancel_deal',
    'invite_participant',
    'remove_participant',
    'view_timeline',
  ],
  // ── Service roles — extend when implementing their business logic ───────────
  Escrow: [
    'view_room_info',
    'view_listing',
    'view_participants',
    'view_deal',
    'view_timeline',
  ],
  Transport: [
    'view_room_info',
    'view_listing',
    'view_participants',
    'view_timeline',
  ],
  Veterinarian: [
    'view_room_info',
    'view_listing',
    'view_participants',
    'view_timeline',
  ],
  Clinic: [
    'view_room_info',
    'view_listing',
    'view_participants',
    'view_timeline',
  ],
  Other: [
    'view_room_info',
    'view_participants',
    'view_timeline',
  ],
};

export const ROLE_LABEL: Record<TransactionParticipantRole, string> = {
  Pembeli: 'Pembeli',
  Penjual: 'Penjual',
  Escrow: 'Escrow',
  Transport: 'Transport',
  Veterinarian: 'Dokter Hewan',
  Clinic: 'Klinik Hewan',
  Other: 'Lainnya',
};

export const ROLE_COLOR: Record<TransactionParticipantRole, string> = {
  Pembeli: '#2563eb',
  Penjual: '#16a34a',
  Escrow: '#7c3aed',
  Transport: '#d97706',
  Veterinarian: '#0891b2',
  Clinic: '#0d9488',
  Other: '#6b7280',
};

export const ROLE_BG: Record<TransactionParticipantRole, string> = {
  Pembeli: 'rgba(37,99,235,0.1)',
  Penjual: 'rgba(22,163,74,0.1)',
  Escrow: 'rgba(124,58,237,0.1)',
  Transport: 'rgba(217,119,6,0.1)',
  Veterinarian: 'rgba(8,145,178,0.1)',
  Clinic: 'rgba(13,148,136,0.1)',
  Other: 'rgba(107,114,128,0.1)',
};

// ─── In-memory overlay stores ──────────────────────────────────────────────────

/** chatId → participant list */
const PARTICIPANT_STORE = new Map<string, TransactionParticipant[]>();

/** chatId → transaction status */
const STATUS_STORE = new Map<string, TransactionStatus>();

// ─── Internal helpers ──────────────────────────────────────────────────────────

function resolveWorkspaceDisplay(workspaceId: string): { displayName: string; avatar: string } {
  const ws = WORKSPACES.find(w => w.id === workspaceId);
  return {
    displayName: ws?.name ?? workspaceId,
    avatar: ws?.icon ?? '🏪',
  };
}

/**
 * Auto-populate participants from a ChatRoom if not yet in the store.
 * Penjual always comes first (index 0), Pembeli second (index 1).
 * Future participants (Escrow, Transport, etc.) are appended after.
 */
function ensureParticipants(room: ChatRoom): TransactionParticipant[] {
  const existing = PARTICIPANT_STORE.get(room.id);
  if (existing) return existing;

  const sellerDisplay = resolveWorkspaceDisplay(room.workspaceIdPenjual);
  const buyerDisplay = resolveWorkspaceDisplay(room.workspaceIdPembeli);

  const participants: TransactionParticipant[] = [
    {
      uuid: generateUUID(),
      workspaceUuid: room.workspaceIdPenjual,
      role: 'Penjual',
      displayName: sellerDisplay.displayName,
      avatar: sellerDisplay.avatar,
      joinTime: room.createdAt,
      status: 'Active',
    },
    {
      uuid: generateUUID(),
      workspaceUuid: room.workspaceIdPembeli,
      role: 'Pembeli',
      displayName: buyerDisplay.displayName,
      avatar: buyerDisplay.avatar,
      joinTime: room.createdAt,
      status: 'Active',
    },
  ];

  PARTICIPANT_STORE.set(room.id, participants);
  return participants;
}

function ensureStatus(room: ChatRoom): TransactionStatus {
  const existing = STATUS_STORE.get(room.id);
  if (existing) return existing;

  let status: TransactionStatus = 'Chat';
  if (room.transaksiId) status = 'Transaksi';
  else if (room.negosiasiId) status = 'Negosiasi';
  STATUS_STORE.set(room.id, status);
  return status;
}

// ─── Public getters ────────────────────────────────────────────────────────────

/** Get a TransactionRoom (ChatRoom + participants + status) by id. */
export function getTransactionRoom(id: string): TransactionRoom | undefined {
  const room = getChatRoomById(id);
  if (!room) return undefined;
  return {
    ...room,
    participants: ensureParticipants(room),
    transactionStatus: ensureStatus(room),
  };
}

/** Get all TransactionRooms for a workspace (as Penjual or Pembeli). */
export function getTransactionRoomsByWorkspace(workspaceId: string): TransactionRoom[] {
  return getChatRoomsByWorkspace(workspaceId).map(room => ({
    ...room,
    participants: ensureParticipants(room),
    transactionStatus: ensureStatus(room),
  }));
}

/** Get the participant list for a chat room. */
export function getParticipants(chatId: string): TransactionParticipant[] {
  const room = getChatRoomById(chatId);
  if (!room) return [];
  return ensureParticipants(room);
}

/** Get the full RoomInfo object for display in RoomInfoSheet. */
export function getRoomInfo(chatId: string): RoomInfo | undefined {
  const room = getChatRoomById(chatId);
  if (!room) return undefined;
  return {
    roomId: room.id,
    listingUuid: room.listingUuid,
    transactionStatus: ensureStatus(room),
    participants: ensureParticipants(room),
    createdAt: room.createdAt,
    lastActivity: room.lastMessageAt,
  };
}

/** Get the active workspace's role in a room. Returns null if not a participant. */
export function getMyRole(
  chatId: string,
  workspaceId: string,
): TransactionParticipantRole | null {
  const participants = getParticipants(chatId);
  const found = participants.find(
    p => p.workspaceUuid === workspaceId && p.status === 'Active',
  );
  return found?.role ?? null;
}

/** Check if a workspace has a specific permission in a room. */
export function hasPermission(
  chatId: string,
  workspaceId: string,
  permission: RoomPermission,
): boolean {
  const role = getMyRole(chatId, workspaceId);
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Count of Active participants in a room. */
export function getActiveParticipantCount(chatId: string): number {
  return getParticipants(chatId).filter(p => p.status === 'Active').length;
}

// ─── Service participant mutations ────────────────────────────────────────────
// Called by participantManagementData.ts — not called directly from UI.

/**
 * Add a service participant (Escrow, Transport, Vet, Other) to an existing
 * room's PARTICIPANT_STORE. Requires the store to already be initialized
 * (i.e. the room has been accessed at least once via getTransactionRoom).
 * Returns the new participant's UUID.
 */
export function addServiceParticipant(
  chatId: string,
  participant: Omit<TransactionParticipant, 'uuid'>,
): string {
  // Ensure store is initialized — access the room so ensureParticipants() runs
  const list = PARTICIPANT_STORE.get(chatId);
  if (!list) {
    // Room hasn't been accessed yet — can't add (caller should getTransactionRoom first)
    return '';
  }
  const uuid = generateUUID();
  list.push({ uuid, ...participant });
  return uuid;
}

/**
 * Mark a service participant as Removed (by workspaceId).
 * Only removes non-core (non-Buyer, non-Seller) participants.
 * Status is set to 'Removed' rather than spliced out, to preserve history.
 */
export function removeServiceParticipant(chatId: string, workspaceId: string): void {
  const list = PARTICIPANT_STORE.get(chatId);
  if (!list) return;
  const target = list.find(
    p =>
      p.workspaceUuid === workspaceId &&
      p.role !== 'Pembeli' &&
      p.role !== 'Penjual' &&
      p.status === 'Active',
  );
  if (target) target.status = 'Removed';
}
