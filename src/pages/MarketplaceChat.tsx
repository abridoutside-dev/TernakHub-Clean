// ─── FARM-FIX-005.1 + 005.2 + 005.4 — Transaction Room + Deal + Service Invite ─
// Ruang Transaksi: evolusi dari Chat Marketplace ke Transaction Room.
//
// Architecture:
//  - TransactionRoom = ChatRoom + participants + transactionStatus
//  - All chat functionality (send, image, read, history) is preserved.
//  - RoomHeader replaces ListingInfoPanel: shows Buyer ↔ Seller + count + info.
//  - RoomInfoSheet: bottom drawer with full room metadata.
//  - DealBar: persistent strip below the role indicator; shows deal status +
//    primary action. Taps open DealSheet.
//  - DealSheet: full-featured bottom sheet for creating, editing, approving,
//    and viewing the Living Deal Summary.
//  - ServiceBar (FARM-FIX-005.4): strip below DealBar showing accepted services +
//    pending invitation count + "Undang Layanan" quick-action.
//  - ParticipantsSheet: full invitation management (create, cancel, accept, decline,
//    remove, timeline, history).
//  - Permission-checked via hasPermission() from transactionRoomData.ts.
//  - FARM-FIX-005.4 adds: Cancelled/Expired statuses, cancelInvitation(),
//    notification hooks, Cancel button in InvitationCard, ServiceBar.

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useMarketplace } from '../hooks/useMarketplace';
import { recordSendMessage } from '../services/marketplaceService';
import {
  sendMessage,
  markChatAsRead,
  getChatMessages,
  type ChatMessage,
  type ChatMessageTipe,
} from '../data/marketplaceChatData';
import {
  getTransactionRoom,
  getRoomInfo,
  getMyRole,
  hasPermission,
  getActiveParticipantCount,
  ROLE_LABEL,
  ROLE_COLOR,
  ROLE_BG,
  TRANSACTION_STATUS_LABEL,
  TRANSACTION_STATUS_COLOR,
  TRANSACTION_STATUS_BG,
  type TransactionRoom,
  type TransactionParticipant,
  type TransactionParticipantRole,
  type RoomInfo,
} from '../data/transactionRoomData';
import {
  getDealByChatId,
  createDeal,
  updateDealFields,
  submitDealForApproval,
  voteOnDeal,
  resetRejectedDeal,
  cancelDeal,
  computeDealSummary,
  isDealEditable,
  isDealLocked,
  getMyApproval,
  DEAL_STATUS_LABEL,
  DEAL_STATUS_COLOR,
  DEAL_STATUS_BG,
  DEAL_STATUS_ICON,
  DEAL_FIELD_LABEL,
  type Deal,
  type DealSummary,
} from '../data/dealData';
import { getListingByUuid, type ListingItem } from '../data/marketplaceListingData';
import {
  createInvitation,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  removeInvitedParticipant,
  getPendingInvitations,
  getJoinedServiceParticipants,
  getHistoricalInvitations,
  getEligibleWorkspaces,
  SERVICE_ROLES,
  SERVICE_ROLE_DESCRIPTION,
  SERVICE_ROLE_ICON,
  INVITATION_STATUS_LABEL,
  INVITATION_STATUS_COLOR,
  INVITATION_STATUS_BG,
  INVITATION_STATUS_ICON,
  WORKSPACE_TYPE_RECOMMENDED_ROLE,
  type ServiceRole,
  type ParticipantInvitation,
  type InvitationStatus,
} from '../data/participantManagementData';
import {
  getTimeline,
  logRoomCreated,
  TIMELINE_EVENT_ICON,
  type RoomTimelineEvent,
} from '../data/roomTimelineData';
import {
  getEscrowWorkflow,
  createEscrowWorkflow,
  startAssignment,
  createPaymentInstruction,
  uploadPaymentProof,
  verifyPaymentProof,
  releaseFunds,
  refundBuyer,
  openDispute,
  resolveDispute,
  cancelEscrowWorkflow,
  transitionToWaitingDelivery,
  transitionToBuyerConfirmation,
  buyerConfirmedReceived,
  buyerReportedProblem,
  addDisputeAdditionalAction,
  calculateEscrowFee,
  ESCROW_STATUS_CONFIG,
  TERMINAL_ESCROW_WORKFLOW_STATUSES,
  ESCROW_FEE_MIN,
  ESCROW_FEE_MAX,
  type EscrowWorkflowRecord,
  type EscrowWorkflowStatus,
  type EscrowFeePayer,
  type VerificationAction,
  type BuyerConfirmationResult,
  type DisputeAdditionalAction,
} from '../data/escrowWorkflowData';
import {
  getEscrowConfig,
  setEscrowConfig,
  updateExternalEscrowDetails,
  ESCROW_CONFIG_TYPE_CONFIG,
  type EscrowConfigType,
  type EscrowConfigRecord,
} from '../data/escrowConfigData';
import {
  getActiveEscrowAccounts,
  getEscrowAccountById,
  BUYER_BANK_OPTIONS,
} from '../data/masterEscrowAccountData';
import type { EscrowOfficialAccount } from '../data/masterEscrowAccountData';
import {
  createQuotation,
  submitQuotation,
  requestRevision,
  reviseQuotation,
  acceptQuotation,
  rejectQuotation,
  withdrawQuotation,
  getQuotationsByChatId,
  getLockedQuotationsByChatId,
  getActiveQuotationByProvider,
  allRequiredQuotationsLocked,
  computeGrandTotal,
  QUOTE_STATUS_CONFIG,
  TERMINAL_QUOTE_STATUSES,
  type ServiceQuotation,
} from '../data/serviceQuotationData';
import {
  getTransportConfig,
  getOrCreateTransportConfig,
  setTransportMode,
  updateMarketplaceTransportStatus,
  addPickupEvidence,
  addDeliveryEvidence,
  setLiveLocation,
  clearLiveLocation,
  setBuyerConfirmation,
  updateExternalTransportInfo,
  updateExternalTransportStatus,
  addExternalEvidence,
  updateBuyerPickupSchedule,
  recordBuyerPickedUp,
  confirmBuyerPickup,
  updateSellerArrangesInfo,
  updateSellerArrangesStatus,
  addSellerArrangesEvidence,
  generateAISuggestions,
  getTransportStatusLabel,
  logTripUpdated,
  TRANSPORT_MODE_CONFIG,
  MARKETPLACE_TRANSPORT_STATUS_CONFIG,
  TRANSPORT_STATUS_FLOW,
  EXTERNAL_STATUS_CONFIG,
  BUYER_PICKUP_STATUS_CONFIG,
  SELLER_ARRANGES_STATUS_CONFIG,
  TERMINAL_TRANSPORT_STATUSES,
  type TransportMode,
  type MarketplaceTransportStatus,
  type AISuggestion,
} from '../data/transportConfigData';
import {
  createTrip,
  getTripByChatId,
  addTripStop,
  updateTripStatus,
  updateTrip,
  updateTripStop,
  VEHICLE_TYPES,
  type TransportTrip,
} from '../data/transportTripData';

// ─── Extracted component modules ─────────────────────────────────────────────
import { sameDay, formatDateSeparator, getWorkspaceName, MessageBubble, ChatInput } from '../components/marketplace/ChatHelpers';
import { RoomHeader, RoomInfoSheet } from '../components/marketplace/ChatRoomHeader';
import { DealBar, ServiceBar } from '../components/marketplace/ChatBars';
import { EscrowBar, EscrowSheet } from '../components/marketplace/ChatEscrow';
import { QuotationBar, QuotationSheet } from '../components/marketplace/ChatQuotation';
import { DealSheet } from '../components/marketplace/ChatDealSheet';
import { ParticipantsSheet } from '../components/marketplace/ChatParticipants';
import { TransportBar, TransportSheet } from '../components/marketplace/ChatTransport';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplaceChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const activeWs = activeWorkspace;  if (!activeWs) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
        <p style={{ fontSize: 14, fontWeight: 600 }}>Workspace tidak ditemukan</p>
        <p style={{ fontSize: 12 }}>Pilih atau buat workspace terlebih dahulu.</p>
      </div>
    );
  }

  useMarketplace(); // FLOW-003M27: hydrate marketplace data from Supabase on mount
  const [tick, setTick] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showDeal, setShowDeal] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showEscrow,     setShowEscrow]     = useState(false);
  const [showQuotation,  setShowQuotation]  = useState(false);
  const [showTransport,  setShowTransport]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const room: TransactionRoom | undefined = id ? getTransactionRoom(id) : undefined;

  // Permission check: only active participants may enter
  const canAccess = room
    ? hasPermission(room.id, activeWs!.workspace_uuid, 'view_room_info') ||
      (room.workspaceIdPembeli === activeWs!.workspace_uuid || room.workspaceIdPenjual === activeWs!.workspace_uuid)
    : false;

  const myRole      = room ? getMyRole(room.id, activeWs!.workspace_uuid) : null;
  const canSend     = room ? hasPermission(room.id, activeWs!.workspace_uuid, 'send_message') : false;
  const canDeal     = room ? hasPermission(room.id, activeWs!.workspace_uuid, 'create_deal') : false;
  const canViewDeal = room ? hasPermission(room.id, activeWs!.workspace_uuid, 'view_deal') : false;
  const canInvite   = room ? hasPermission(room.id, activeWs!.workspace_uuid, 'invite_participant') : false;
  const canRemove   = room ? hasPermission(room.id, activeWs!.workspace_uuid, 'remove_participant') : false;

  // Mark as read on open + seed Room Timeline's creation event
  useEffect(() => {
    if (room && canAccess) {
      markChatAsRead(room.id, activeWs!.workspace_uuid);
      // Log RoomCreated event once (idempotent — skipped if already logged)
      const seller = room.participants.find(p => p.role === 'Penjual');
      logRoomCreated({
        chatId: room.id,
        actorWorkspaceId: room.workspaceIdPenjual,
        actorName: seller?.displayName ?? getWorkspaceName(room.workspaceIdPenjual),
        actorRole: 'Penjual',
        timestamp: room.createdAt,
      });
      setTick(t => t + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id, activeWs!.workspace_uuid]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tick]);

  function handleSend(konten: string, tipe: ChatMessageTipe) {
    if (!room || !canSend) return;
    sendMessage({ chatId: room.id, fromWorkspaceId: activeWs!.workspace_uuid, tipe, konten });
    // Fire-and-forget: persist message to Supabase (FLOW-003M27)
    if (activeWorkspace?.workspace_uuid && myRole && (myRole === 'Pembeli' || myRole === 'Penjual')) {
      void recordSendMessage(room.id, activeWorkspace.workspace_uuid, myRole, konten);
    }
    setTick(t => t + 1);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  // ── Not found ──
  if (!room) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Ruang transaksi tidak ditemukan
        </div>
        <button
          type="button" onClick={() => navigate('/marketplace/chat')}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8,
          }}
        >
          Kembali ke Daftar Chat
        </button>
      </div>
    );
  }

  // ── Access denied ──
  if (!canAccess) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Akses Ditolak
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--color-muted)', marginBottom: 16, lineHeight: 1.5 }}>
          Hanya peserta yang terdaftar di ruang transaksi ini yang dapat masuk.
        </div>
        <button
          type="button" onClick={() => navigate('/marketplace/chat')}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Kembali ke Daftar Chat
        </button>
      </div>
    );
  }

  const listing    = getListingByUuid(room.listingUuid);
  const messages   = getChatMessages(room.id);
  const roomInfo   = getRoomInfo(room.id)!;
  const deal       = getDealByChatId(room.id);

  // Group messages by day for date separators
  const groups: { dateLabel: string; msgs: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const last = groups[groups.length - 1];
    if (!last || !sameDay(last.msgs[0].timestamp, msg.timestamp)) {
      groups.push({ dateLabel: formatDateSeparator(msg.timestamp), msgs: [msg] });
    } else {
      last.msgs.push(msg);
    }
  }

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      height: 'calc(100dvh - var(--top-app-bar-height))',
      minHeight: 0,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {/* Room Header */}
      <RoomHeader
        room={room}
        listing={listing}
        deal={deal}
        onInfo={() => setShowInfo(true)}
        onViewListing={() => listing && navigate(`/marketplace/${listing.kategoriSlug}/${listing.slug}`)}
        onDeal={() => setShowDeal(true)}
        onParticipants={() => setShowParticipants(true)}
      />

      {/* My Role indicator strip */}
      {myRole && (
        <div style={{
          background: ROLE_BG[myRole],
          borderBottom: `1px solid ${ROLE_COLOR[myRole]}22`,
          padding: '4px 14px',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: ROLE_COLOR[myRole] }}>
            Anda bergabung sebagai
          </span>
          <span style={{
            fontSize: 9.5, fontWeight: 800,
            color: ROLE_COLOR[myRole],
            background: `${ROLE_COLOR[myRole]}20`,
            borderRadius: 4, padding: '1px 6px',
          }}>
            {ROLE_LABEL[myRole]}
          </span>
        </div>
      )}

      {/* Deal Bar */}
      {(canDeal || canViewDeal) && (
        <DealBar
          deal={deal}
          canCreateDeal={canDeal}
          onOpen={() => setShowDeal(true)}
        />
      )}

      {/* Service Bar — FARM-FIX-005.4 */}
      <ServiceBar
        chatId={room.id}
        canInvite={canInvite}
        onOpenParticipants={() => setShowParticipants(true)}
      />

      {/* Escrow Bar — FARM-FIX-005.5 */}
      {(() => {
        const escrowInv = getJoinedServiceParticipants(room.id).find(p => p.serviceRole === 'Escrow');
        return (
          <EscrowBar
            chatId={room.id}
            deal={deal}
            escrowParticipantId={escrowInv?.targetWorkspaceId ?? null}
            onOpen={() => setShowEscrow(true)}
            onTick={() => setTick(t => t + 1)}
          />
        );
      })()}

      {/* Quotation Bar — FARM-FIX-005.6 */}
      {(() => {
        const nonEscrow = getJoinedServiceParticipants(room.id).filter(p => p.serviceRole !== 'Escrow');
        return (
          <QuotationBar
            chatId={room.id}
            nonEscrowInvitations={nonEscrow}
            activeWorkspaceId={activeWs!.workspace_uuid}
            onOpen={() => setShowQuotation(true)}
          />
        );
      })()}

      {/* Transport Bar — FARM-FIX-005.7 */}
      <TransportBar
        chatId={room.id}
        deal={deal}
        onOpen={() => setShowTransport(true)}
      />

      {/* Chat history */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 14px',
        background: 'var(--color-bg)',
        display: 'flex', flexDirection: 'column',
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--color-muted)', fontSize: 12.5, lineHeight: 1.6 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
            Belum ada pesan.<br />Mulai percakapan dengan mengirim pesan pertama.
          </div>
        ) : (
          <>
            {groups.map(group => (
              <div key={group.dateLabel}>
                <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                  <span style={{
                    fontSize: 10.5, color: 'var(--color-muted)', fontWeight: 600,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: 20, padding: '2px 10px',
                  }}>
                    {group.dateLabel}
                  </span>
                </div>
                {group.msgs.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isSelf={msg.fromWorkspaceId === activeWs!.workspace_uuid}
                  />
                ))}
              </div>
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chat input — only shown when user has send_message permission */}
      {canSend && <ChatInput onSend={handleSend} />}

      {/* Room Info Sheet */}
      {showInfo && (
        <RoomInfoSheet
          info={roomInfo}
          listing={listing}
          onClose={() => setShowInfo(false)}
        />
      )}

      {/* Deal Sheet */}
      {showDeal && (
        <DealSheet
          deal={deal}
          listing={listing}
          room={room}
          activeWorkspaceId={activeWs!.workspace_uuid}
          onClose={() => { setShowDeal(false); setTick(t => t + 1); }}
          onTick={() => setTick(t => t + 1)}
        />
      )}

      {/* Participants Sheet */}
      {showParticipants && (
        <ParticipantsSheet
          room={room}
          activeWorkspaceId={activeWs!.workspace_uuid}
          myRole={myRole}
          canInvite={canInvite}
          canRemove={canRemove}
          onClose={() => { setShowParticipants(false); setTick(t => t + 1); }}
          onTick={() => setTick(t => t + 1)}
        />
      )}

      {/* Quotation Sheet — FARM-FIX-005.6 */}
      {showQuotation && (() => {
        const nonEscrow = getJoinedServiceParticipants(room.id).filter(p => p.serviceRole !== 'Escrow');
        return (
          <QuotationSheet
            chatId={room.id}
            room={room}
            activeWorkspaceId={activeWs!.workspace_uuid}
            nonEscrowInvitations={nonEscrow}
            onClose={() => { setShowQuotation(false); setTick(t => t + 1); }}
            onTick={() => setTick(t => t + 1)}
          />
        );
      })()}

      {/* Escrow Sheet — FARM-FIX-005.8 */}
      {showEscrow && deal && (
        <EscrowSheet
          chatId={room.id}
          deal={deal}
          activeWorkspaceId={activeWs!.workspace_uuid}
          escrowParticipantId={
            getJoinedServiceParticipants(room.id).find(p => p.serviceRole === 'Escrow')?.targetWorkspaceId ?? null
          }
          onClose={() => { setShowEscrow(false); setTick(t => t + 1); }}
          onTick={() => setTick(t => t + 1)}
        />
      )}

      {/* Transport Sheet — FARM-FIX-005.7 */}
      {showTransport && (
        <TransportSheet
          chatId={room.id}
          deal={deal}
          activeWorkspaceId={activeWs!.workspace_uuid}
          myRole={myRole}
          onClose={() => { setShowTransport(false); setTick(t => t + 1); }}
          onTick={() => setTick(t => t + 1)}
          onOpenParticipants={() => { setShowTransport(false); setShowParticipants(true); }}
        />
      )}
    </div>
  );
}

