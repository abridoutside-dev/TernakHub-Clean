// ─── ChatBars — extracted from MarketplaceChat.tsx ──
// No behavior changes. See MarketplaceChat.tsx for architecture notes.

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
import { getActiveWorkspace, WORKSPACES } from '../../components/TopAppBar';
import {
  sendMessage,
  markChatAsRead,
  getChatMessages,
  type ChatMessage,
  type ChatMessageTipe,
} from '../../data/marketplaceChatData';
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
} from '../../data/transactionRoomData';
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
} from '../../data/dealData';
import { getListingByUuid, type ListingItem } from '../../data/marketplaceListingData';
import { getVerifikasiBadge } from '../../data/marketplaceWorkspaceVerifikasiData';
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
} from '../../data/participantManagementData';
import {
  getTimeline,
  logRoomCreated,
  TIMELINE_EVENT_ICON,
  type RoomTimelineEvent,
} from '../../data/roomTimelineData';
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
} from '../../data/escrowWorkflowData';
import {
  getEscrowConfig,
  setEscrowConfig,
  updateExternalEscrowDetails,
  ESCROW_CONFIG_TYPE_CONFIG,
  type EscrowConfigType,
  type EscrowConfigRecord,
} from '../../data/escrowConfigData';
import {
  getActiveEscrowAccounts,
  getEscrowAccountById,
  BUYER_BANK_OPTIONS,
} from '../../data/masterEscrowAccountData';
import type { EscrowOfficialAccount } from '../../data/masterEscrowAccountData';
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
} from '../../data/serviceQuotationData';
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
} from '../../data/transportConfigData';
import {
  createTrip,
  getTripByChatId,
  addTripStop,
  updateTripStatus,
  updateTrip,
  updateTripStop,
  VEHICLE_TYPES,
  type TransportTrip,
} from '../../data/transportTripData';

// ─── Deal Bar ─────────────────────────────────────────────────────────────────
// Persistent strip between the role indicator and chat history.
// Shows the current deal status and a primary action button.

export function DealBar({
  deal,
  canCreateDeal,
  onOpen,
}: {
  deal: Deal | undefined;
  canCreateDeal: boolean;
  onOpen: () => void;
}) {
  if (!deal) {
    if (!canCreateDeal) return null;
    return (
      <button
        type="button"
        onClick={onOpen}
        style={{
          width: '100%', padding: '9px 14px',
          background: 'rgba(37,99,235,0.07)',
          borderTop: '1px solid rgba(37,99,235,0.15)',
          borderBottom: '1px solid rgba(37,99,235,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          cursor: 'pointer', border: 'none',
        }}
      >
        <span style={{ fontSize: 14 }}>📋</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
          Buat Proposal Deal
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-primary)', opacity: 0.7 }}>→</span>
      </button>
    );
  }

  const color = DEAL_STATUS_COLOR[deal.status];
  const bg    = DEAL_STATUS_BG[deal.status];
  const icon  = DEAL_STATUS_ICON[deal.status];
  const label = DEAL_STATUS_LABEL[deal.status];

  let actionLabel = 'Lihat Deal';
  if (deal.status === 'Draft') actionLabel = 'Lihat & Edit Deal';
  if (deal.status === 'Waiting Approval') actionLabel = 'Tinjau & Setujui';
  if (deal.status === 'Rejected') actionLabel = 'Deal Ditolak — Edit Ulang';
  if (deal.status === 'Cancelled') actionLabel = 'Buat Deal Baru';
  if (deal.status === 'Locked') actionLabel = 'Lihat Ringkasan Deal 🔒';

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        width: '100%', padding: '8px 14px',
        background: bg,
        borderTop: `1px solid ${color}22`,
        borderBottom: `1px solid ${color}22`,
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', border: 'none', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color }}>
          Deal: {label}
        </span>
      </div>
      <span style={{
        fontSize: 10.5, fontWeight: 700, color,
        background: `${color}18`, borderRadius: 20, padding: '2px 9px', flexShrink: 0,
      }}>
        {actionLabel}
      </span>
    </button>
  );
}

// ─── Service Bar ──────────────────────────────────────────────────────────────
// FARM-FIX-005.4 — Thin strip below DealBar showing service participant summary.
// Shows: accepted service avatars, pending count, and "Undang Layanan" action.
// Only visible when canInvite OR there are active/pending service participants.

export function ServiceBar({
  chatId,
  canInvite,
  onOpenParticipants,
}: {
  chatId: string;
  canInvite: boolean;
  onOpenParticipants: () => void;
}) {
  const joined   = getJoinedServiceParticipants(chatId);
  const pending  = getPendingInvitations(chatId);

  if (!canInvite && joined.length === 0 && pending.length === 0) return null;

  return (
    <div style={{
      width: '100%', padding: '7px 14px',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {/* Accepted service chips */}
      {joined.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          {joined.map(inv => (
            <span
              key={inv.uuid}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 10.5, fontWeight: 700,
                color: ROLE_COLOR[inv.serviceRole],
                background: ROLE_BG[inv.serviceRole],
                borderRadius: 12, padding: '2px 8px',
              }}
            >
              <span>{SERVICE_ROLE_ICON[inv.serviceRole]}</span>
              <span style={{
                maxWidth: 70, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {inv.targetName}
              </span>
            </span>
          ))}
          {pending.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: 'var(--color-warning)', background: 'rgba(217,119,6,0.12)',
              borderRadius: 12, padding: '2px 8px',
            }}>
              ⏳ {pending.length} menunggu
            </span>
          )}
        </div>
      )}

      {/* Empty state when no services yet */}
      {joined.length === 0 && pending.length === 0 && (
        <span style={{ flex: 1, fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic' }}>
          Belum ada layanan bergabung
        </span>
      )}

      {/* Quick invite action */}
      {canInvite && (
        <button
          type="button"
          onClick={onOpenParticipants}
          style={{
            flexShrink: 0, padding: '5px 11px', borderRadius: 20,
            background: 'rgba(37,99,235,0.09)',
            border: '1.5px solid rgba(37,99,235,0.3)',
            color: 'var(--color-primary)',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <span>＋</span>
          <span>Undang Layanan</span>
        </button>
      )}
    </div>
  );
}

