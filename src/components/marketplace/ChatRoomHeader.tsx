// ─── ChatRoomHeader — extracted from MarketplaceChat.tsx ──
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
import { formatDatetime, getWorkspaceName } from './ChatHelpers';


// ─── Participant Avatar Stack ─────────────────────────────────────────────────
// Renders overlapping circles — extensible to N participants without redesign.

export function AvatarStack({ participants, maxVisible = 4 }: {
  participants: TransactionParticipant[];
  maxVisible?: number;
}) {
  const active = participants.filter(p => p.status === 'Active');
  const visible = active.slice(0, maxVisible);
  const overflow = active.length - maxVisible;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((p, i) => (
        <div
          key={p.uuid}
          title={`${p.displayName} (${ROLE_LABEL[p.role]})`}
          style={{
            width: 26, height: 26, borderRadius: '50%',
            background: ROLE_BG[p.role],
            border: `2px solid var(--color-surface)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, marginLeft: i === 0 ? 0 : -8,
            zIndex: visible.length - i,
            position: 'relative',
          }}
        >
          {p.avatar}
        </div>
      ))}
      {overflow > 0 && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--color-bg)', border: '2px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: 'var(--color-muted)',
          marginLeft: -8, zIndex: 0, position: 'relative',
        }}>
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ─── Room Header ──────────────────────────────────────────────────────────────
// Always-visible compact header. Shows Buyer ↔ Seller, participant count,
// deal status chip, and navigation/info buttons.

export function RoomHeader({
  room,
  listing,
  deal,
  onInfo,
  onViewListing,
  onDeal,
  onParticipants,
}: {
  room: TransactionRoom;
  listing: ListingItem | undefined;
  deal: Deal | undefined;
  onInfo: () => void;
  onViewListing: () => void;
  onDeal: () => void;
  onParticipants: () => void;
}) {
  const participantCount = getActiveParticipantCount(room.id);
  const seller = room.participants.find(p => p.role === 'Penjual');
  const buyer  = room.participants.find(p => p.role === 'Pembeli');
  const verifikasi = getVerifikasiBadge(room.workspaceIdPenjual);

  // Deal status chip values
  const dealStatus = deal?.status;
  const dealColor  = dealStatus ? DEAL_STATUS_COLOR[dealStatus] : 'var(--color-muted)';
  const dealBg     = dealStatus ? DEAL_STATUS_BG[dealStatus]    : 'rgba(107,114,128,0.1)';
  const dealIcon   = dealStatus ? DEAL_STATUS_ICON[dealStatus]  : '📋';
  const dealLabel  = dealStatus ? DEAL_STATUS_LABEL[dealStatus] : 'Tidak Ada Deal';

  return (
    <div style={{
      background: 'var(--color-surface)',
      borderBottom: '1.5px solid var(--color-border)',
      padding: '10px 14px',
    }}>
      {/* Row 1: listing title + deal chip + info button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {listing && (
          <button
            type="button"
            onClick={onViewListing}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              flex: 1, minWidth: 0, background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, textAlign: 'left',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'var(--color-bg)',
              border: '1.5px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>
              {listing.media.thumbnail}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {listing.judul}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>
                Rp {listing.harga.toLocaleString('id-ID')}
                <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}> / {listing.satuanHarga}</span>
              </div>
            </div>
          </button>
        )}
        {!listing && (
          <div style={{ flex: 1, fontSize: 11.5, color: 'var(--color-muted)', fontStyle: 'italic' }}>
            ⚠️ Listing tidak tersedia
          </div>
        )}

        {/* Deal status chip — tappable */}
        <button
          type="button"
          onClick={onDeal}
          title="Proposal Deal"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: dealBg, border: `1px solid ${dealColor}44`,
            borderRadius: 20, padding: '3px 8px', flexShrink: 0, cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 11 }}>{dealIcon}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: dealColor, whiteSpace: 'nowrap' }}>
            {dealLabel}
          </span>
        </button>

        {/* Participants button */}
        <button
          type="button"
          onClick={onParticipants}
          title="Peserta Ruangan"
          style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, cursor: 'pointer',
          }}
        >
          👥
        </button>

        {/* Info button */}
        <button
          type="button"
          onClick={onInfo}
          title="Info Ruang Transaksi"
          style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, cursor: 'pointer', color: 'var(--color-muted)',
          }}
        >
          ℹ
        </button>
      </div>

      {/* Row 2: Participants row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'var(--color-bg)',
        borderRadius: 10, padding: '7px 10px',
        border: '1px solid var(--color-border)',
      }}>
        {/* Seller side */}
        {seller && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: ROLE_BG['Penjual'],
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>
              {seller.avatar}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--color-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {seller.displayName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  fontSize: 9.5, fontWeight: 700,
                  color: ROLE_COLOR['Penjual'], background: ROLE_BG['Penjual'],
                  borderRadius: 4, padding: '1px 5px',
                }}>
                  {ROLE_LABEL['Penjual']}
                </span>
                <span style={{
                  fontSize: 9.5, fontWeight: 700,
                  color: verifikasi.color,
                  background: verifikasi.bg,
                  borderRadius: 4, padding: '1px 5px',
                }}>
                  {verifikasi.icon} {verifikasi.label}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Center: avatar stack + participant count */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 3, padding: '0 10px', flexShrink: 0,
        }}>
          <AvatarStack participants={room.participants} />
          <span style={{
            fontSize: 9, fontWeight: 600, color: 'var(--color-muted)',
            whiteSpace: 'nowrap',
          }}>
            {participantCount} Peserta
          </span>
        </div>

        {/* Buyer side */}
        {buyer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
            <div style={{ minWidth: 0, textAlign: 'right' }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--color-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {buyer.displayName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <span style={{
                  fontSize: 9.5, fontWeight: 700,
                  color: ROLE_COLOR['Pembeli'], background: ROLE_BG['Pembeli'],
                  borderRadius: 4, padding: '1px 5px',
                }}>
                  {ROLE_LABEL['Pembeli']}
                </span>
              </div>
            </div>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: ROLE_BG['Pembeli'],
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>
              {buyer.avatar}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Participant Row (used inside RoomInfoSheet) ───────────────────────────────

export function ParticipantRow({ p }: { p: TransactionParticipant }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: ROLE_BG[p.role],
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>
        {p.avatar}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {p.displayName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: ROLE_COLOR[p.role], background: ROLE_BG[p.role],
            borderRadius: 4, padding: '1px 6px',
          }}>
            {ROLE_LABEL[p.role]}
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
            Bergabung {formatDatetime(p.joinTime)}
          </span>
        </div>
      </div>
      {/* Status badge */}
      <span style={{
        fontSize: 9.5, fontWeight: 700, flexShrink: 0,
        color: p.status === 'Active' ? 'var(--color-success)' : 'var(--color-danger)',
        background: p.status === 'Active' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
        borderRadius: 4, padding: '2px 6px',
      }}>
        {p.status === 'Active' ? 'Aktif' : p.status === 'Left' ? 'Keluar' : 'Dihapus'}
      </span>
    </div>
  );
}

// ─── Room Info Sheet ───────────────────────────────────────────────────────────

export function RoomInfoSheet({
  info,
  listing,
  onClose,
}: {
  info: RoomInfo;
  listing: ListingItem | undefined;
  onClose: () => void;
}) {
  const statusColor = TRANSACTION_STATUS_COLOR[info.transactionStatus];
  const statusBg    = TRANSACTION_STATUS_BG[info.transactionStatus];
  const statusLabel = TRANSACTION_STATUS_LABEL[info.transactionStatus];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 800,
          background: 'rgba(0,0,0,0.45)',
        }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, zIndex: 801,
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
        maxHeight: '82vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)', margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>
              Info Ruang Transaksi
            </span>
            <button
              type="button" onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, cursor: 'pointer', color: 'var(--color-muted)',
              }}
            >✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              ID Ruangan
            </div>
            <div style={{
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '8px 12px',
            }}>
              <span style={{ fontSize: 11.5, fontFamily: 'monospace', color: 'var(--color-text)', wordBreak: 'break-all' }}>
                {info.roomId}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Marketplace Listing
            </div>
            {listing ? (
              <div style={{
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                borderRadius: 8, padding: '8px 12px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {listing.media.thumbnail}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {listing.judul}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-primary)', fontWeight: 700, marginTop: 2 }}>
                    Rp {listing.harga.toLocaleString('id-ID')}
                    <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-muted)', marginLeft: 3 }}>/ {listing.satuanHarga}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 1 }}>
                    Penjual: {getWorkspaceName(listing.workspaceId)}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(245,124,0,0.08)', border: '1px solid rgba(245,124,0,0.3)',
                borderRadius: 8, padding: '8px 12px', fontSize: 11.5, color: 'var(--color-muted)',
              }}>
                ⚠️ Listing sudah tidak tersedia
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Status Transaksi
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: statusBg, border: `1px solid ${statusColor}33`,
              borderRadius: 8, padding: '7px 12px',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: statusColor }}>
                {statusLabel}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Peserta ({info.participants.filter(p => p.status === 'Active').length} Aktif)
            </div>
            <div style={{
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '0 12px',
            }}>
              {info.participants.map((p, i) => (
                <div key={p.uuid} style={{ borderBottom: i < info.participants.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <ParticipantRow p={p} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Waktu
            </div>
            <div style={{
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: 8, overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Dibuat</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
                  {formatDatetime(info.createdAt)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px' }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Aktivitas Terakhir</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
                  {formatDatetime(info.lastActivity)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

