// ─── FARM-FIX-005.3 + 005.4 — Participant Management ─────────────────────────
// Invitation lifecycle for service participants in a Transaction Room.
//
// Architecture rules:
//  - One invitation per (chatId + targetWorkspaceId) at a time.
//    A Declined/Removed/Cancelled/Expired invitation allows re-inviting the same workspace.
//  - Invitation status: Pending → Invited → Joined | Declined | Removed | Cancelled | Expired | Completed
//  - On acceptInvitation(): the workspace is added to PARTICIPANT_STORE via
//    addServiceParticipant() from transactionRoomData.ts.
//  - On removeInvitedParticipant(): the PARTICIPANT_STORE entry is marked
//    Removed via removeServiceParticipant() from transactionRoomData.ts.
//  - On cancelInvitation(): only the inviter can cancel before the invitation
//    is accepted; the workspace is NOT added to PARTICIPANT_STORE.
//  - All participant events are written to roomTimelineData.ts.
//  - Notification hooks fire on every status change (fire-and-forget).
//  - Business logic for Escrow/Transport/Vet workflows is NOT here.
//    This file only manages invitation state and room membership.
//  - getEligibleWorkspaces() filters against all live-workspace IDs to prevent
//    double-invitation; it does not filter by workspace type.

import { generateUUID } from '../utils/uuid';
import { WORKSPACES } from '../components/TopAppBar';
import { getAllListing } from './marketplaceListingData';
import {
  getActiveTransactionRoomEscrowProviders,
  getMasterEscrowById,
} from './masterEscrowData';
import { captureProviderSnapshot, type ProviderType } from './serviceProviderSnapshotData';
import {
  addServiceParticipant,
  removeServiceParticipant as _removeServiceParticipant,
  getParticipants,
  ROLE_LABEL,
  type TransactionParticipantRole,
} from './transactionRoomData';
import {
  logParticipantInvited,
  logParticipantJoined,
  logParticipantDeclined,
  logParticipantRemoved,
  logInvitationCancelled,
  logInvitationExpired,
} from './roomTimelineData';
import {
  notifyInvitationCreated,
  notifyInvitationAccepted,
  notifyInvitationDeclined,
  notifyInvitationCancelled,
  notifyInvitationExpired,
} from '../services/serviceInvitationNotificationHooks';

// ─── Invitation Status ────────────────────────────────────────────────────────

export type InvitationStatus =
  | 'Pending'      // created but awaiting dispatch (reserved for async future)
  | 'Invited'      // dispatched — target can accept or decline
  | 'Joined'       // accepted; participant is active in the room
  | 'Declined'     // declined by the target workspace
  | 'Cancelled'    // FARM-FIX-005.4 — cancelled by invitation creator before acceptance
  | 'Expired'      // FARM-FIX-005.4 — invitation past its validity window
  | 'Removed'      // removed by Buyer or Seller after joining
  | 'Completed';   // service finished (reserved for future workflow completion)

export const INVITATION_STATUS_LABEL: Record<InvitationStatus, string> = {
  Pending: 'Menunggu',
  Invited: 'Diundang',
  Joined: 'Bergabung',
  Declined: 'Ditolak',
  Cancelled: 'Dibatalkan',
  Expired: 'Kedaluwarsa',
  Removed: 'Dihapus',
  Completed: 'Selesai',
};

export const INVITATION_STATUS_COLOR: Record<InvitationStatus, string> = {
  Pending: '#6b7280',
  Invited: '#d97706',
  Joined: '#16a34a',
  Declined: '#dc2626',
  Cancelled: '#6b7280',
  Expired: '#9ca3af',
  Removed: '#9ca3af',
  Completed: '#2563eb',
};

export const INVITATION_STATUS_BG: Record<InvitationStatus, string> = {
  Pending: 'rgba(107,114,128,0.12)',
  Invited: 'rgba(217,119,6,0.12)',
  Joined: 'rgba(22,163,74,0.12)',
  Declined: 'rgba(220,38,38,0.12)',
  Cancelled: 'rgba(107,114,128,0.12)',
  Expired: 'rgba(156,163,175,0.12)',
  Removed: 'rgba(156,163,175,0.12)',
  Completed: 'rgba(37,99,235,0.12)',
};

export const INVITATION_STATUS_ICON: Record<InvitationStatus, string> = {
  Pending: '⏳',
  Invited: '📨',
  Joined: '✅',
  Declined: '❌',
  Cancelled: '🚫',
  Expired: '⏰',
  Removed: '🗑',
  Completed: '🏁',
};

// ─── Service Role ─────────────────────────────────────────────────────────────

/** Sub-type of TransactionParticipantRole — only roles that can be invited. */
export type ServiceRole = Extract<
  TransactionParticipantRole,
  'Escrow' | 'Transport' | 'Veterinarian' | 'Clinic' | 'Other'
>;

export const SERVICE_ROLES: ServiceRole[] = ['Escrow', 'Transport', 'Veterinarian', 'Clinic', 'Other'];

export const SERVICE_ROLE_DESCRIPTION: Record<ServiceRole, string> = {
  Escrow: 'Perantara pembayaran — menjamin keamanan transaksi',
  Transport: 'Layanan pengiriman ternak atau produk',
  Veterinarian: 'Dokter Hewan — pemeriksaan dan sertifikasi ternak',
  Clinic: 'Klinik Hewan — layanan rawat jalan dan medis ternak',
  Other: 'Layanan lain yang diperlukan dalam transaksi',
};

export const SERVICE_ROLE_ICON: Record<ServiceRole, string> = {
  Escrow: '🏦',
  Transport: '🚚',
  Veterinarian: '👨‍⚕️',
  Clinic: '🏥',
  Other: '🔧',
};

// ─── Workspace type → recommended role mapping ────────────────────────────────
// Used to show a "✓ Direkomendasikan" badge when the workspace type matches
// the selected service role.

export const WORKSPACE_TYPE_RECOMMENDED_ROLE: Record<string, ServiceRole> = {
  Transporter: 'Transport',
  'Dokter Hewan': 'Veterinarian',
  'Klinik Hewan': 'Clinic',
};

// ─── Invitation Record ────────────────────────────────────────────────────────

export interface ParticipantInvitation {
  uuid: string;
  chatId: string;
  inviterWorkspaceId: string;
  inviterName: string;
  inviterRole: 'Pembeli' | 'Penjual';
  targetWorkspaceId: string;
  targetName: string;
  targetAvatar: string;
  serviceRole: ServiceRole;
  status: InvitationStatus;
  notes: string;
  invitedAt: string;
  /** ISO timestamp of accept/decline response; null while still Invited. */
  respondedAt: string | null;
  removedAt: string | null;
  removedByWorkspaceId: string | null;
  /** ISO timestamp when the creator cancelled the invitation (FARM-FIX-005.4). */
  cancelledAt: string | null;
  /** Workspace UUID of the canceller (always the inviter for now). */
  cancelledByWorkspaceId: string | null;
  /** ISO timestamp when the invitation expired (FARM-FIX-005.4). */
  expiredAt: string | null;
  /** UUID of the TransactionParticipant entry added to PARTICIPANT_STORE on join. */
  participantUuid: string | null;
  /**
   * UUID of the Marketplace Listing that introduced this provider.
   * Populated automatically by createInvitation() for non-Escrow roles.
   * null when role is 'Escrow' (Platform Service) or listing not found.
   * APP-CHAIN-003: source chain — Listing → listingId → workspaceId → Provider.
   */
  listingId: string | null;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

/** chatId → invitation list (order = creation order). */
const INVITATION_STORE = new Map<string, ParticipantInvitation[]>();

function getList(chatId: string): ParticipantInvitation[] {
  let list = INVITATION_STORE.get(chatId);
  if (!list) { list = []; INVITATION_STORE.set(chatId, list); }
  return list;
}

// ─── Workspace resolution helper ──────────────────────────────────────────────

function resolveWorkspace(workspaceId: string): { displayName: string; avatar: string } {
  const ws = WORKSPACES.find(w => w.id === workspaceId);
  if (ws) return { displayName: ws.name, avatar: ws.icon ?? '🏪' };
  // Fallback: check Active Escrow Directory for escrow provider UUIDs
  const escrow = getMasterEscrowById(workspaceId);
  if (escrow) return { displayName: escrow.fullName, avatar: escrow.photo ?? '🛡️' };
  return { displayName: workspaceId, avatar: '🏪' };
}

// ─── Getters ──────────────────────────────────────────────────────────────────

/** All invitations for a room (all statuses), creation order. */
export function getInvitations(chatId: string): ParticipantInvitation[] {
  return [...getList(chatId)];
}

/** Single invitation by UUID. */
export function getInvitationByUuid(uuid: string): ParticipantInvitation | undefined {
  for (const list of INVITATION_STORE.values()) {
    const found = list.find(i => i.uuid === uuid);
    if (found) return found;
  }
  return undefined;
}

/** Active (Invited or Pending) invitations — awaiting a response. */
export function getPendingInvitations(chatId: string): ParticipantInvitation[] {
  return getList(chatId).filter(
    i => i.status === 'Invited' || i.status === 'Pending',
  );
}

/** Invitations where the service workspace has successfully joined. */
export function getJoinedServiceParticipants(chatId: string): ParticipantInvitation[] {
  return getList(chatId).filter(i => i.status === 'Joined');
}

// ─── Eligible Workspace ───────────────────────────────────────────────────────

/**
 * Workspace entry returned by getEligibleWorkspaces().
 * Derived from active Marketplace listings — Marketplace is the single
 * source of truth for which workspaces offer which services.
 */
export interface EligibleWorkspace {
  id:   string;
  name: string;
  icon: string;
  type: string;
  /**
   * UUID of the Marketplace Listing that makes this workspace eligible.
   * The first active listing matching the service role's kategoriSlug is used.
   * Pass this to createInvitation() so the source chain is preserved.
   * APP-CHAIN-003: Marketplace Listing → listingId → workspaceId → Provider.
   */
  listingId: string | null;
}

/**
 * Maps each ServiceRole to the Marketplace kategoriSlug(s) that represent it.
 * An empty array means the role is NOT sourced from Marketplace listings
 * (Escrow = platform-level; Other = any remaining active-listing workspace).
 */
const SERVICE_ROLE_KATEGORI_SLUGS: Record<ServiceRole, string[]> = {
  Escrow:       [],               // platform-level — masterEscrowAccountData.ts
  Transport:    ['transportasi'],
  Veterinarian: ['dokter-hewan'],
  Clinic:       ['klinik-hewan'],
  Other:        [],               // no marketplace listing category qualifies — returns [] always
};

/**
 * Workspaces eligible to be invited for the given service role.
 *
 * Architecture: Marketplace is the SINGLE SOURCE OF TRUTH.
 * The list is derived from active Marketplace listings filtered by the
 * role's kategoriSlug(s).  The WORKSPACES constant is consulted only to
 * enrich display metadata (icon, workspace type label) for known seed
 * workspaces — it is NOT the source of which workspaces appear here.
 *
 * Cancelled and Expired invitations DO allow re-invitation of the same workspace.
 */
export function getEligibleWorkspaces(
  chatId: string,
  buyerWorkspaceId: string,
  sellerWorkspaceId: string,
  serviceRole?: ServiceRole,
): EligibleWorkspace[] {
  // Workspaces that already hold an active invitation in this room.
  const occupied = new Set(
    getList(chatId)
      .filter(i => i.status === 'Invited' || i.status === 'Joined' || i.status === 'Pending')
      .map(i => i.targetWorkspaceId),
  );

  // Escrow is platform-level — source from Active Escrow Directory only.
  // Not from Workspace data or Marketplace Listings.
  if (serviceRole === 'Escrow') {
    return getActiveTransactionRoomEscrowProviders()
      .filter(p => !occupied.has(p.uuid))
      .map(p => ({
        id:        p.uuid,
        name:      p.fullName,
        icon:      p.photo ?? '🛡️',
        type:      'Escrow',
        listingId: null,
      }));
  }

  const activeListings = getAllListing().filter(l => l.status === 'Aktif');

  // Only the three permitted service categories may appear in the picker.
  // 'Other' and any unrecognised role return [] — non-service Marketplace
  // categories (ternak, pakan, obat-kesehatan, peralatan, …) must never
  // appear as eligible service participants.
  if (!serviceRole || serviceRole === 'Other') return [];

  const slugs = SERVICE_ROLE_KATEGORI_SLUGS[serviceRole];
  // serviceRole is one of Transport | Veterinarian | Clinic (Escrow handled above)
  const relevant = activeListings.filter(l => slugs.includes(l.kategoriSlug));

  // Deduplicate by workspaceId and apply exclusion filters.
  const seen   = new Set<string>();
  const result: EligibleWorkspace[] = [];

  for (const listing of relevant) {
    if (listing.workspaceId === buyerWorkspaceId)  continue;
    if (listing.workspaceId === sellerWorkspaceId) continue;
    if (occupied.has(listing.workspaceId))         continue;
    if (seen.has(listing.workspaceId))             continue;

    seen.add(listing.workspaceId);

    // Enrich with WORKSPACES metadata only for display (icon, type).
    const meta = WORKSPACES.find(w => w.id === listing.workspaceId);
    result.push({
      id:       listing.workspaceId,
      name:     listing.workspaceNama,
      icon:     meta?.icon ?? '🏪',
      type:     meta?.type ?? '',
      // Preserve listing source so callers can pass it through to createInvitation()
      // and the Marketplace → listingId → workspaceId chain stays unbroken.
      listingId: listing.uuid,
    });
  }

  return result;
}

/** Invitations that can no longer be acted on (terminal states). */
export function getHistoricalInvitations(chatId: string): ParticipantInvitation[] {
  return getList(chatId).filter(
    i =>
      i.status === 'Declined' ||
      i.status === 'Removed' ||
      i.status === 'Cancelled' ||
      i.status === 'Expired',
  );
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Send a service participant invitation.
 * Status starts as 'Invited' — ready to be acted on immediately in this demo.
 *
 * Guards:
 *  - Target cannot be an existing Buyer or Seller.
 *  - Target cannot already have an active (Invited/Joined/Pending) invitation.
 */
export function createInvitation(input: {
  chatId: string;
  inviterWorkspaceId: string;
  inviterName: string;
  inviterRole: 'Pembeli' | 'Penjual';
  targetWorkspaceId: string;
  serviceRole: ServiceRole;
  notes?: string;
}): ParticipantInvitation {
  // Guard: cannot invite the Buyer or Seller
  const participants = getParticipants(input.chatId);
  const isCoreParticipant = participants.some(
    p =>
      p.workspaceUuid === input.targetWorkspaceId &&
      (p.role === 'Pembeli' || p.role === 'Penjual'),
  );
  if (isCoreParticipant) {
    throw new Error('Workspace ini sudah merupakan Pembeli atau Penjual di ruang ini.');
  }

  // Guard: no duplicate active invitation
  const conflict = getList(input.chatId).find(
    i =>
      i.targetWorkspaceId === input.targetWorkspaceId &&
      (i.status === 'Invited' || i.status === 'Pending' || i.status === 'Joined'),
  );
  if (conflict) {
    throw new Error('Workspace ini sudah memiliki undangan aktif atau sudah bergabung.');
  }

  const targetInfo = resolveWorkspace(input.targetWorkspaceId);
  const now = new Date().toISOString();
  const uuid = generateUUID();

  // ── Auto-resolve listingId for provider snapshot (APP-CHAIN-003) ────────────
  // Marketplace is the source of truth for which workspaces offer which services.
  // Find the first active listing that links this workspace to the requested role.
  let resolvedListingId: string | null = null;
  if (input.serviceRole !== 'Escrow') {
    const slugs = SERVICE_ROLE_KATEGORI_SLUGS[input.serviceRole];
    const matchingListing = getAllListing().find(
      l =>
        l.workspaceId === input.targetWorkspaceId &&
        (slugs.length === 0 || slugs.includes(l.kategoriSlug)) &&
        l.status === 'Aktif',
    );
    if (matchingListing) {
      resolvedListingId = matchingListing.uuid;
      // Capture immutable snapshot now — first-write-wins for history immutability.
      const meta = WORKSPACES.find(w => w.id === input.targetWorkspaceId);
      const providerTypeMap: Record<string, ProviderType> = {
        Transport:    'Transport',
        Veterinarian: 'Dokter Hewan',
        Clinic:       'Klinik Hewan',
      };
      captureProviderSnapshot({
        chatId:             input.chatId,
        serviceRole:        input.serviceRole as import('./serviceProviderSnapshotData').SnapshotServiceRole,
        listingId:          matchingListing.uuid,
        listingTitle:       matchingListing.judul,
        listingKategoriSlug: matchingListing.kategoriSlug,
        workspaceId:        input.targetWorkspaceId,
        workspaceName:      targetInfo.displayName,
        workspaceIcon:      targetInfo.avatar,
        workspaceType:      meta?.type ?? '',
        providerType:       providerTypeMap[input.serviceRole] ?? 'Lainnya',
        capturedAt:         now,
      });
    }
  }

  const invitation: ParticipantInvitation = {
    uuid,
    chatId: input.chatId,
    inviterWorkspaceId: input.inviterWorkspaceId,
    inviterName: input.inviterName,
    inviterRole: input.inviterRole,
    targetWorkspaceId: input.targetWorkspaceId,
    targetName: targetInfo.displayName,
    targetAvatar: targetInfo.avatar,
    serviceRole: input.serviceRole,
    status: 'Invited',
    notes: input.notes?.trim() ?? '',
    invitedAt: now,
    respondedAt: null,
    removedAt: null,
    removedByWorkspaceId: null,
    cancelledAt: null,
    cancelledByWorkspaceId: null,
    expiredAt: null,
    participantUuid: null,
    listingId: resolvedListingId,
  };

  getList(input.chatId).push(invitation);

  logParticipantInvited({
    chatId: input.chatId,
    actorWorkspaceId: input.inviterWorkspaceId,
    actorName: input.inviterName,
    actorRole: ROLE_LABEL[input.inviterRole],
    targetWorkspaceId: input.targetWorkspaceId,
    targetName: targetInfo.displayName,
    targetRole: ROLE_LABEL[input.serviceRole],
    timestamp: now,
  });

  // Notification hook — fire-and-forget
  notifyInvitationCreated({
    invitationUuid: uuid,
    chatId: input.chatId,
    inviterName: input.inviterName,
    inviterWorkspaceId: input.inviterWorkspaceId,
    targetName: targetInfo.displayName,
    targetWorkspaceId: input.targetWorkspaceId,
    serviceRoleLabel: ROLE_LABEL[input.serviceRole],
  });

  return invitation;
}

/**
 * Accept an invitation — the service workspace joins the Transaction Room.
 * Adds the workspace to PARTICIPANT_STORE via addServiceParticipant().
 *
 * In this demo, the call simulates the target workspace's acceptance.
 */
export function acceptInvitation(invitationUuid: string): ParticipantInvitation {
  const invitation = getInvitationByUuid(invitationUuid);
  if (!invitation) throw new Error('Undangan tidak ditemukan.');
  if (invitation.status !== 'Invited' && invitation.status !== 'Pending') {
    throw new Error('Undangan tidak dalam status yang dapat diterima.');
  }

  const now = new Date().toISOString();
  const targetInfo = resolveWorkspace(invitation.targetWorkspaceId);

  // Register in PARTICIPANT_STORE — getMyRole() will now return the service role
  const participantUuid = addServiceParticipant(invitation.chatId, {
    workspaceUuid: invitation.targetWorkspaceId,
    role: invitation.serviceRole,
    displayName: targetInfo.displayName,
    avatar: targetInfo.avatar,
    joinTime: now,
    status: 'Active',
  });

  invitation.status = 'Joined';
  invitation.respondedAt = now;
  invitation.participantUuid = participantUuid;

  logParticipantJoined({
    chatId: invitation.chatId,
    actorWorkspaceId: invitation.targetWorkspaceId,
    actorName: targetInfo.displayName,
    actorRole: ROLE_LABEL[invitation.serviceRole],
    timestamp: now,
  });

  // Notification hook — fire-and-forget
  notifyInvitationAccepted({
    invitationUuid: invitation.uuid,
    chatId: invitation.chatId,
    inviterName: invitation.inviterName,
    inviterWorkspaceId: invitation.inviterWorkspaceId,
    targetName: targetInfo.displayName,
    targetWorkspaceId: invitation.targetWorkspaceId,
    serviceRoleLabel: ROLE_LABEL[invitation.serviceRole],
  });

  return invitation;
}

/**
 * Decline an invitation — the target workspace does not join the room.
 * The room remains with only its existing participants.
 *
 * In this demo, the call simulates the target workspace's declination.
 */
export function declineInvitation(invitationUuid: string): ParticipantInvitation {
  const invitation = getInvitationByUuid(invitationUuid);
  if (!invitation) throw new Error('Undangan tidak ditemukan.');
  if (invitation.status !== 'Invited' && invitation.status !== 'Pending') {
    throw new Error('Undangan tidak dalam status yang dapat ditolak.');
  }

  const now = new Date().toISOString();
  const targetInfo = resolveWorkspace(invitation.targetWorkspaceId);

  invitation.status = 'Declined';
  invitation.respondedAt = now;

  logParticipantDeclined({
    chatId: invitation.chatId,
    actorWorkspaceId: invitation.targetWorkspaceId,
    actorName: targetInfo.displayName,
    actorRole: ROLE_LABEL[invitation.serviceRole],
    timestamp: now,
  });

  // Notification hook — fire-and-forget
  notifyInvitationDeclined({
    invitationUuid: invitation.uuid,
    chatId: invitation.chatId,
    inviterName: invitation.inviterName,
    inviterWorkspaceId: invitation.inviterWorkspaceId,
    targetName: targetInfo.displayName,
    targetWorkspaceId: invitation.targetWorkspaceId,
    serviceRoleLabel: ROLE_LABEL[invitation.serviceRole],
  });

  return invitation;
}

/**
 * Cancel an invitation before it is accepted.
 * Only the invitation creator (inviter) may cancel.
 * Status moves to 'Cancelled'; the target workspace is NOT added to the room.
 */
export function cancelInvitation(input: {
  invitationUuid: string;
  byWorkspaceId: string;
}): ParticipantInvitation {
  const invitation = getInvitationByUuid(input.invitationUuid);
  if (!invitation) throw new Error('Undangan tidak ditemukan.');
  if (invitation.inviterWorkspaceId !== input.byWorkspaceId) {
    throw new Error('Hanya pembuat undangan yang dapat membatalkan undangan ini.');
  }
  if (invitation.status !== 'Invited' && invitation.status !== 'Pending') {
    throw new Error('Undangan hanya dapat dibatalkan selama masih menunggu respons.');
  }

  const now = new Date().toISOString();
  const targetInfo = resolveWorkspace(invitation.targetWorkspaceId);

  invitation.status = 'Cancelled';
  invitation.cancelledAt = now;
  invitation.cancelledByWorkspaceId = input.byWorkspaceId;

  logInvitationCancelled({
    chatId: invitation.chatId,
    actorWorkspaceId: input.byWorkspaceId,
    actorName: invitation.inviterName,
    actorRole: ROLE_LABEL[invitation.inviterRole],
    targetWorkspaceId: invitation.targetWorkspaceId,
    targetName: targetInfo.displayName,
    targetRole: ROLE_LABEL[invitation.serviceRole],
    timestamp: now,
  });

  // Notification hook — fire-and-forget
  notifyInvitationCancelled({
    invitationUuid: invitation.uuid,
    chatId: invitation.chatId,
    inviterName: invitation.inviterName,
    inviterWorkspaceId: invitation.inviterWorkspaceId,
    targetName: targetInfo.displayName,
    targetWorkspaceId: invitation.targetWorkspaceId,
    serviceRoleLabel: ROLE_LABEL[invitation.serviceRole],
  });

  return invitation;
}

/**
 * Expire an invitation — called by a future scheduler when the validity window passes.
 * Architecture is ready for time-based expiry; for now this can be triggered manually.
 */
export function expireInvitation(invitationUuid: string): ParticipantInvitation {
  const invitation = getInvitationByUuid(invitationUuid);
  if (!invitation) throw new Error('Undangan tidak ditemukan.');
  if (invitation.status !== 'Invited' && invitation.status !== 'Pending') {
    throw new Error('Undangan tidak dalam status yang dapat kedaluwarsa.');
  }

  const now = new Date().toISOString();
  const targetInfo = resolveWorkspace(invitation.targetWorkspaceId);

  invitation.status = 'Expired';
  invitation.expiredAt = now;

  logInvitationExpired({
    chatId: invitation.chatId,
    actorWorkspaceId: invitation.inviterWorkspaceId,
    actorName: invitation.inviterName,
    actorRole: ROLE_LABEL[invitation.inviterRole],
    targetWorkspaceId: invitation.targetWorkspaceId,
    targetName: targetInfo.displayName,
    targetRole: ROLE_LABEL[invitation.serviceRole],
    timestamp: now,
  });

  // Notification hook — fire-and-forget
  notifyInvitationExpired({
    invitationUuid: invitation.uuid,
    chatId: invitation.chatId,
    inviterName: invitation.inviterName,
    inviterWorkspaceId: invitation.inviterWorkspaceId,
    targetName: targetInfo.displayName,
    targetWorkspaceId: invitation.targetWorkspaceId,
    serviceRoleLabel: ROLE_LABEL[invitation.serviceRole],
  });

  return invitation;
}

/**
 * Remove an active (Joined) service participant from the room.
 * Only a Buyer or Seller with remove_participant permission may call this.
 * Updates the invitation record and marks the PARTICIPANT_STORE entry as Removed.
 */
export function removeInvitedParticipant(input: {
  invitationUuid: string;
  byWorkspaceId: string;
  byWorkspaceName: string;
  byRole: 'Pembeli' | 'Penjual';
}): ParticipantInvitation {
  const invitation = getInvitationByUuid(input.invitationUuid);
  if (!invitation) throw new Error('Undangan tidak ditemukan.');
  if (invitation.status !== 'Joined') {
    throw new Error('Hanya peserta yang sudah bergabung yang dapat dihapus.');
  }

  const now = new Date().toISOString();
  const targetInfo = resolveWorkspace(invitation.targetWorkspaceId);

  invitation.status = 'Removed';
  invitation.removedAt = now;
  invitation.removedByWorkspaceId = input.byWorkspaceId;

  // Mark the PARTICIPANT_STORE entry as Removed
  _removeServiceParticipant(invitation.chatId, invitation.targetWorkspaceId);

  logParticipantRemoved({
    chatId: invitation.chatId,
    actorWorkspaceId: input.byWorkspaceId,
    actorName: input.byWorkspaceName,
    actorRole: ROLE_LABEL[input.byRole],
    targetWorkspaceId: invitation.targetWorkspaceId,
    targetName: targetInfo.displayName,
    targetRole: ROLE_LABEL[invitation.serviceRole],
    timestamp: now,
  });

  return invitation;
}
