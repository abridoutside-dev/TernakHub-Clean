// ─── ChatParticipants — extracted from MarketplaceChat.tsx ──
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
import { getWorkspaceName } from './ChatHelpers';

export function ParticipantsSheet({
  room,
  activeWorkspaceId,
  myRole,
  canInvite,
  canRemove,
  onClose,
  onTick,
}: {
  room: TransactionRoom;
  activeWorkspaceId: string;
  myRole: TransactionParticipantRole | null;
  canInvite: boolean;
  canRemove: boolean;
  onClose: () => void;
  onTick: () => void;
}) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ServiceRole>('Transport');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [inviteNotes, setInviteNotes] = useState('');
  const [showTimeline, setShowTimeline] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const activeParticipants = room.participants.filter(p => p.status === 'Active');
  const serviceParticipants = activeParticipants.filter(
    p => p.role !== 'Pembeli' && p.role !== 'Penjual',
  );
  const pendingInvitations    = getPendingInvitations(room.id);
  const joinedInvitations     = getJoinedServiceParticipants(room.id);
  const historicalInvitations = getHistoricalInvitations(room.id);
  const eligibleWorkspaces = getEligibleWorkspaces(
    room.id,
    room.workspaceIdPembeli,
    room.workspaceIdPenjual,
    selectedRole,
  );
  const timeline = getTimeline(room.id);

  const inviterName = getWorkspaceName(activeWorkspaceId);
  const inviterRole: 'Pembeli' | 'Penjual' =
    myRole === 'Penjual' ? 'Penjual' : 'Pembeli';

  function findJoinedInvitation(workspaceUuid: string): ParticipantInvitation | undefined {
    return joinedInvitations.find(i => i.targetWorkspaceId === workspaceUuid);
  }

  function clearError() { setErrorMsg(''); }

  function handleInvite() {
    clearError();
    if (!selectedWorkspaceId) {
      setErrorMsg('Pilih workspace terlebih dahulu.');
      return;
    }
    try {
      createInvitation({
        chatId: room.id,
        inviterWorkspaceId: activeWorkspaceId,
        inviterName,
        inviterRole,
        targetWorkspaceId: selectedWorkspaceId,
        serviceRole: selectedRole,
        notes: inviteNotes,
      });
      setShowInviteForm(false);
      setSelectedWorkspaceId('');
      setInviteNotes('');
      onTick();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  }

  function handleAccept(invUuid: string) {
    clearError();
    try { acceptInvitation(invUuid); onTick(); }
    catch (e) { setErrorMsg(e instanceof Error ? e.message : 'Terjadi kesalahan.'); }
  }

  function handleDecline(invUuid: string) {
    clearError();
    try { declineInvitation(invUuid); onTick(); }
    catch (e) { setErrorMsg(e instanceof Error ? e.message : 'Terjadi kesalahan.'); }
  }

  function handleRemove(invUuid: string) {
    clearError();
    try {
      removeInvitedParticipant({
        invitationUuid: invUuid,
        byWorkspaceId: activeWorkspaceId,
        byWorkspaceName: inviterName,
        byRole: inviterRole,
      });
      onTick();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  }

  function handleCancel(invUuid: string) {
    clearError();
    try {
      cancelInvitation({ invitationUuid: invUuid, byWorkspaceId: activeWorkspaceId });
      onTick();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  }

  function fmtTs(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  }

  // ── Sub-components ─────────────────────────────────────────────────────────

  function SectionHead({ icon, title, count }: { icon: string; title: string; count?: number }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '14px 18px 8px',
        borderTop: '1px solid var(--color-border)',
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', flex: 1 }}>
          {title}
        </span>
        {count !== undefined && (
          <span style={{
            fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)',
            background: 'var(--color-bg)', borderRadius: 10, padding: '1px 7px',
            border: '1px solid var(--color-border)',
          }}>
            {count}
          </span>
        )}
      </div>
    );
  }

  function RolePill({ role }: { role: TransactionParticipantRole }) {
    return (
      <span style={{
        fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
        color: ROLE_COLOR[role], background: ROLE_BG[role],
      }}>
        {ROLE_LABEL[role]}
      </span>
    );
  }

  function StatusPill({ status }: { status: InvitationStatus }) {
    return (
      <span style={{
        fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
        color: INVITATION_STATUS_COLOR[status],
        background: INVITATION_STATUS_BG[status],
      }}>
        {INVITATION_STATUS_ICON[status]} {INVITATION_STATUS_LABEL[status]}
      </span>
    );
  }

  function ParticipantCard({ p }: { p: typeof activeParticipants[0] }) {
    const isCore = p.role === 'Pembeli' || p.role === 'Penjual';
    const isMe   = p.workspaceUuid === activeWorkspaceId;
    const inv    = !isCore ? findJoinedInvitation(p.workspaceUuid) : undefined;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 18px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: `${ROLE_COLOR[p.role]}18`,
          border: `2px solid ${ROLE_COLOR[p.role]}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {p.avatar}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)',
            display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
          }}>
            <span style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 140,
            }}>
              {p.displayName}
            </span>
            {isMe && (
              <span style={{
                fontSize: 9, fontWeight: 800, color: '#fff',
                background: 'var(--color-primary)', borderRadius: 3, padding: '1px 5px',
              }}>
                Anda
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
            <RolePill role={p.role} />
            <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
              Bergabung {fmtTs(p.joinTime)}
            </span>
          </div>
          {inv?.inviterName && (
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
              Diundang oleh {inv.inviterName} ({ROLE_LABEL[inv.inviterRole]})
            </div>
          )}
        </div>

        {/* Remove button (service participants only) */}
        {!isCore && canRemove && inv && (
          <button
            type="button"
            onClick={() => handleRemove(inv.uuid)}
            style={{
              padding: '5px 10px', borderRadius: 6, flexShrink: 0,
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.25)',
              color: 'var(--color-danger)', fontSize: 11, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Hapus
          </button>
        )}
        {isCore && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--color-muted)',
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: 4, padding: '2px 7px', flexShrink: 0,
          }}>
            🔒 Inti
          </span>
        )}
      </div>
    );
  }

  function InvitationCard({ inv }: { inv: ParticipantInvitation }) {
    return (
      <div style={{
        margin: '0 18px 10px',
        background: 'var(--color-bg)',
        border: `1.5px solid ${ROLE_COLOR[inv.serviceRole]}30`,
        borderRadius: 10, padding: '12px 14px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: `${ROLE_COLOR[inv.serviceRole]}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17,
          }}>
            {inv.targetAvatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {inv.targetName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <RolePill role={inv.serviceRole} />
              <StatusPill status={inv.status} />
            </div>
          </div>
        </div>

        {/* Meta */}
        <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginBottom: 8, lineHeight: 1.5 }}>
          Diundang oleh <strong>{inv.inviterName}</strong> ({ROLE_LABEL[inv.inviterRole]})
          &nbsp;·&nbsp;{fmtTs(inv.invitedAt)}
        </div>

        {inv.notes && (
          <div style={{
            fontSize: 11, color: 'var(--color-text)',
            background: 'var(--color-surface)',
            borderRadius: 6, padding: '6px 10px',
            marginBottom: 10, fontStyle: 'italic',
          }}>
            "{inv.notes}"
          </div>
        )}

        {/* Cancel button — only visible to the inviter */}
        {inv.inviterWorkspaceId === activeWorkspaceId && (
          <div style={{ marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => handleCancel(inv.uuid)}
              style={{
                width: '100%', padding: '7px 10px', borderRadius: 7,
                background: 'rgba(107,114,128,0.08)',
                border: '1.5px solid rgba(107,114,128,0.25)',
                color: 'var(--color-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              🚫 Batalkan Undangan
            </button>
          </div>
        )}

        {/* Simulation buttons — simulate the invited workspace's response */}
        <div style={{ background: 'rgba(217,119,6,0.07)', borderRadius: 7, padding: '8px 10px', marginBottom: 8 }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--color-warning)', marginBottom: 6 }}>
            SIMULASI RESPONS — Mewakili {inv.targetName}
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <button
              type="button"
              onClick={() => handleAccept(inv.uuid)}
              style={{
                flex: 1, padding: '7px 10px', borderRadius: 7,
                background: 'rgba(22,163,74,0.1)',
                border: '1.5px solid rgba(22,163,74,0.35)',
                color: 'var(--color-success)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ✅ Terima Undangan
            </button>
            <button
              type="button"
              onClick={() => handleDecline(inv.uuid)}
              style={{
                flex: 1, padding: '7px 10px', borderRadius: 7,
                background: 'rgba(220,38,38,0.08)',
                border: '1.5px solid rgba(220,38,38,0.25)',
                color: 'var(--color-danger)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ❌ Tolak Undangan
            </button>
          </div>
        </div>
      </div>
    );
  }

  function HistoricalCard({ inv }: { inv: ParticipantInvitation }) {
    return (
      <div style={{
        margin: '0 18px 8px',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>{inv.targetAvatar}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {inv.targetName}
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 2, alignItems: 'center' }}>
            <RolePill role={inv.serviceRole} />
            <StatusPill status={inv.status} />
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-muted)', flexShrink: 0 }}>
          {fmtTs(inv.respondedAt ?? inv.removedAt ?? inv.invitedAt)}
        </div>
      </div>
    );
  }

  function TimelineRow({ event }: { event: RoomTimelineEvent }) {
    return (
      <div style={{
        display: 'flex', gap: 10, padding: '8px 18px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13,
        }}>
          {TIMELINE_EVENT_ICON[event.eventType]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, color: 'var(--color-text)', lineHeight: 1.4 }}>
            {event.description}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
            {fmtTs(event.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  // ── Invite form ────────────────────────────────────────────────────────────

  const InviteForm = (
    <div style={{ margin: '0 18px 14px', padding: 14, background: 'var(--color-bg)', borderRadius: 10, border: '1.5px solid var(--color-border)' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
        Undang Peserta Layanan
      </div>

      {/* Role selector */}
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 6 }}>
        PERAN LAYANAN
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
        {SERVICE_ROLES.map(role => (
          <button
            key={role}
            type="button"
            onClick={() => { setSelectedRole(role); setSelectedWorkspaceId(''); }}
            style={{
              padding: '8px 10px', borderRadius: 8, textAlign: 'left',
              background: selectedRole === role ? `${ROLE_COLOR[role]}15` : 'var(--color-surface)',
              border: `1.5px solid ${selectedRole === role ? ROLE_COLOR[role] : 'var(--color-border)'}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 2 }}>{SERVICE_ROLE_ICON[role]}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: selectedRole === role ? ROLE_COLOR[role] : 'var(--color-text)' }}>
              {ROLE_LABEL[role]}
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--color-muted)', marginTop: 1, lineHeight: 1.3 }}>
              {SERVICE_ROLE_DESCRIPTION[role]}
            </div>
          </button>
        ))}
      </div>

      {/* Workspace selector */}
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 6 }}>
        WORKSPACE YANG DIUNDANG
      </div>
      {eligibleWorkspaces.length === 0 ? (
        <div style={{
          padding: '10px 12px', borderRadius: 8,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          fontSize: 11.5, color: 'var(--color-muted)', textAlign: 'center', marginBottom: 12,
        }}>
          Semua workspace yang tersedia sudah diundang atau bergabung.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {eligibleWorkspaces.map(ws => {
            const recommended = WORKSPACE_TYPE_RECOMMENDED_ROLE[ws.type];
            const isSelected  = selectedWorkspaceId === ws.id;
            return (
              <button
                key={ws.id}
                type="button"
                onClick={() => setSelectedWorkspaceId(ws.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, textAlign: 'left',
                  background: isSelected ? 'rgba(37,99,235,0.08)' : 'var(--color-surface)',
                  border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{ws.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {ws.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{ws.type}</span>
                    {recommended === selectedRole && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                        color: 'var(--color-success)', background: 'rgba(22,163,74,0.1)',
                      }}>
                        ✓ Direkomendasikan
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <span style={{ fontSize: 16, flexShrink: 0, color: 'var(--color-primary)' }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Notes */}
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 6 }}>
        CATATAN (OPSIONAL)
      </div>
      <textarea
        value={inviteNotes}
        onChange={e => setInviteNotes(e.target.value)}
        placeholder="Tambahkan catatan untuk peserta yang diundang..."
        rows={2}
        style={{
          width: '100%', borderRadius: 8, resize: 'none',
          border: '1.5px solid var(--color-border)',
          padding: '8px 10px', fontSize: 12.5,
          background: 'var(--color-surface)', color: 'var(--color-text)',
          fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12,
        }}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => { setShowInviteForm(false); setSelectedWorkspaceId(''); setInviteNotes(''); clearError(); }}
          style={{
            flex: 1, padding: '9px', borderRadius: 8,
            background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
            fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', cursor: 'pointer',
          }}
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleInvite}
          disabled={!selectedWorkspaceId || eligibleWorkspaces.length === 0}
          style={{
            flex: 2, padding: '9px', borderRadius: 8,
            background: selectedWorkspaceId ? 'var(--color-primary)' : 'var(--color-border)',
            border: 'none', color: '#fff',
            fontSize: 12, fontWeight: 700,
            cursor: selectedWorkspaceId ? 'pointer' : 'not-allowed',
          }}
        >
          📨 Kirim Undangan
        </button>
      </div>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 900,
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        zIndex: 901,
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.22)',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 18px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <span style={{ fontSize: 18 }}>👥</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>
              Peserta Ruangan
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              {activeParticipants.length} aktif
              {serviceParticipants.length > 0 && ` · ${serviceParticipants.length} layanan`}
              {pendingInvitations.length > 0 && ` · ${pendingInvitations.length} menunggu`}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Error banner */}
          {errorMsg && (
            <div style={{
              margin: '10px 18px 0',
              padding: '9px 12px', borderRadius: 8,
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.25)',
              fontSize: 11.5, color: 'var(--color-danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>⚠ {errorMsg}</span>
              <button
                type="button" onClick={clearError}
                style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Section 1 — Active Participants */}
          <SectionHead icon="✅" title="Peserta Aktif" count={activeParticipants.length} />
          {activeParticipants.map(p => <ParticipantCard key={p.uuid} p={p} />)}

          {/* Section 2 — Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <>
              <SectionHead icon="📨" title="Menunggu Respons" count={pendingInvitations.length} />
              {pendingInvitations.map(inv => <InvitationCard key={inv.uuid} inv={inv} />)}
            </>
          )}

          {/* Section 3 — Invite Form */}
          {canInvite && (
            <>
              <SectionHead icon="➕" title="Undang Peserta" />
              {showInviteForm ? InviteForm : (
                <div style={{ padding: '4px 18px 14px' }}>
                  {eligibleWorkspaces.length === 0 ? (
                    <div style={{
                      padding: '12px', borderRadius: 10,
                      background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                      fontSize: 12, color: 'var(--color-muted)', textAlign: 'center',
                    }}>
                      Semua workspace yang tersedia sudah bergabung atau memiliki undangan aktif.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowInviteForm(true)}
                      style={{
                        width: '100%', padding: '11px', borderRadius: 10,
                        background: 'rgba(37,99,235,0.07)',
                        border: '1.5px dashed rgba(37,99,235,0.35)',
                        color: 'var(--color-primary)',
                        fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      + Undang Peserta Layanan
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Section 4 — Historical (Declined / Removed) */}
          {historicalInvitations.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowHistorical(v => !v)}
                style={{
                  width: '100%', background: 'none', border: 'none',
                  borderTop: '1px solid var(--color-border)',
                  padding: '12px 18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: 'var(--color-muted)',
                }}
              >
                <span style={{ fontSize: 13 }}>🗂</span>
                <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 700 }}>
                  Riwayat Undangan
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 700 }}>
                  {historicalInvitations.length} · {showHistorical ? '▲' : '▼'}
                </span>
              </button>
              {showHistorical && (
                <div style={{ paddingBottom: 6 }}>
                  {historicalInvitations.map(inv => (
                    <HistoricalCard key={inv.uuid} inv={inv} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Section 5 — Room Timeline */}
          <button
            type="button"
            onClick={() => setShowTimeline(v => !v)}
            style={{
              width: '100%', background: 'none', border: 'none',
              borderTop: '1px solid var(--color-border)',
              padding: '12px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              color: 'var(--color-muted)',
            }}
          >
            <span style={{ fontSize: 13 }}>📋</span>
            <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 700 }}>
              Timeline Ruangan
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700 }}>
              {timeline.length} · {showTimeline ? '▲' : '▼'}
            </span>
          </button>
          {showTimeline && (
            <div style={{ paddingBottom: 16 }}>
              {timeline.length === 0 ? (
                <div style={{
                  padding: '12px 18px', fontSize: 12, color: 'var(--color-muted)', textAlign: 'center',
                }}>
                  Belum ada aktivitas tercatat.
                </div>
              ) : (
                timeline.map(event => <TimelineRow key={event.uuid} event={event} />)
              )}
            </div>
          )}

          {/* Bottom spacer */}
          <div style={{ height: 24 }} />
        </div>
      </div>
    </>
  );
}

// ─── Transport Evidence Emoji Presets ─────────────────────────────────────────
