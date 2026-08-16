// ─── ChatQuotation — extracted from MarketplaceChat.tsx ──
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
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { getWorkspaceIcon, getWorkspaceTypeLabel } from '../../utils/workspaceMapper';
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
import { formatRupiah, getWorkspaceName } from './ChatHelpers';

// FARM-FIX-005.6 — Strip below EscrowBar. Visible when joined non-Escrow service
// participants exist OR the current user is a joined service provider.

export function QuotationBar({
  chatId,
  nonEscrowInvitations,
  activeWorkspaceId,
  onOpen,
}: {
  chatId: string;
  nonEscrowInvitations: ParticipantInvitation[];
  activeWorkspaceId: string;
  onOpen: () => void;
}) {
  const isProvider = nonEscrowInvitations.some(
    inv => inv.targetWorkspaceId === activeWorkspaceId,
  );
  if (nonEscrowInvitations.length === 0 && !isProvider) return null;

  const quotations = getQuotationsByChatId(chatId);

  // For each service participant, find their latest relevant quotation
  const chips = nonEscrowInvitations.map(inv => {
    const active: ServiceQuotation | undefined =
      quotations.find(
        q =>
          q.serviceProviderWorkspaceId === inv.targetWorkspaceId &&
          !TERMINAL_QUOTE_STATUSES.has(q.status),
      ) ??
      // findLast not available in ES2022 target — reverse + find instead
      [...quotations].reverse().find(
        q => q.serviceProviderWorkspaceId === inv.targetWorkspaceId && q.status === 'Locked',
      );
    const cfg = active ? QUOTE_STATUS_CONFIG[active.status] : null;
    return { inv, active, cfg };
  });

  const lockedCount   = chips.filter(c => c.active?.status === 'Locked').length;
  const pendingCount  = chips.filter(c => c.active && c.active.status !== 'Locked').length;

  return (
    <div style={{
      width: '100%', padding: '6px 14px',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 13, flexShrink: 0 }}>📝</span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', minWidth: 0 }}>
        {chips.length === 0 ? (
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic' }}>
            Belum ada quotasi
          </span>
        ) : chips.map(({ inv, active, cfg }) => (
          <span
            key={inv.uuid}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 10.5, fontWeight: 700,
              color: cfg ? cfg.color : 'var(--color-muted)',
              background: cfg ? cfg.bg : 'rgba(107,114,128,0.08)',
              borderRadius: 12, padding: '2px 8px',
            }}
          >
            <span>{SERVICE_ROLE_ICON[inv.serviceRole]}</span>
            <span style={{ maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {inv.targetName}
            </span>
            <span>{cfg ? cfg.icon : '–'}</span>
          </span>
        ))}
        {lockedCount > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: 'var(--color-info)', background: 'rgba(29,78,216,0.1)',
            borderRadius: 12, padding: '2px 7px',
          }}>
            🔒 {lockedCount} terkunci
          </span>
        )}
        {pendingCount > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: 'var(--color-warning)', background: 'rgba(217,119,6,0.1)',
            borderRadius: 12, padding: '2px 7px',
          }}>
            ⏳ {pendingCount} aktif
          </span>
        )}
      </div>
      <button
        type="button" onClick={onOpen}
        style={{
          flexShrink: 0, padding: '4px 10px', borderRadius: 20,
          background: 'rgba(37,99,235,0.08)',
          border: '1.5px solid rgba(37,99,235,0.25)',
          color: 'var(--color-primary)',
          fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Quotasi →
      </button>
    </div>
  );
}

// ─── Quotation Sheet ──────────────────────────────────────────────────────────
// FARM-FIX-005.6 — Full service quotation & negotiation sheet.

export function QuotationSheet({
  chatId,
  room,
  activeWorkspaceId,
  nonEscrowInvitations,
  onClose,
  onTick,
}: {
  chatId: string;
  room: TransactionRoom;
  activeWorkspaceId: string;
  nonEscrowInvitations: ParticipantInvitation[];
  onClose: () => void;
  onTick: () => void;
}) {
  const [localTick,  setLocalTick]  = useState(0);
  const [createFor,  setCreateFor]  = useState<ParticipantInvitation | null>(null);

  function refresh() { setLocalTick(t => t + 1); onTick(); }

  const quotations = getQuotationsByChatId(chatId);

  const isBuyer   = activeWorkspaceId === room.workspaceIdPembeli;
  const isSeller  = activeWorkspaceId === room.workspaceIdPenjual;
  const myInvitation = nonEscrowInvitations.find(
    inv => inv.targetWorkspaceId === activeWorkspaceId,
  );
  const isProvider = !!myInvitation;

  const labelStyle: React.CSSProperties = {
    fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)',
    textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4,
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: '1.5px solid var(--color-border)', fontSize: 13,
    background: 'var(--color-bg)', color: 'var(--color-text)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 350 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'var(--color-surface)',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
        zIndex: 351, maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px 12px', borderBottom: '1.5px solid var(--color-border)',
        }}>
          <span style={{ fontSize: 22 }}>📝</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>Quotasi Layanan</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              {quotations.length} quotasi · {quotations.filter(q => q.status === 'Locked').length} terkunci
            </div>
          </div>
          <button type="button" onClick={onClose} style={{
            width: 30, height: 30, borderRadius: '50%', border: 'none',
            background: 'var(--color-bg)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: 'var(--color-muted)',
          }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

          {/* ── Service provider: create quotation prompt ── */}
          {isProvider && myInvitation && (() => {
            const myActive = getActiveQuotationByProvider(chatId, activeWorkspaceId);
            if (myActive) return null; // Already has an active quotation
            if (createFor) return null; // Form is open
            return (
              <div style={{
                background: 'rgba(37,99,235,0.06)',
                border: '1.5px solid rgba(37,99,235,0.2)',
                borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 12,
              }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                  {SERVICE_ROLE_ICON[myInvitation.serviceRole]} Anda terdaftar sebagai {myInvitation.serviceRole}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                  Buat quotasi untuk mengajukan harga layanan Anda kepada Buyer dan Seller.
                </div>
                <button type="button" onClick={() => setCreateFor(myInvitation)} style={{
                  width: '100%', padding: '10px 0', borderRadius: 8,
                  background: 'var(--color-primary)', color: '#fff',
                  border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                  + Buat Quotasi Baru
                </button>
              </div>
            );
          })()}

          {/* ── Create quotation form ── */}
          {createFor && (
            <CreateQuotationForm
              chatId={chatId}
              invitation={createFor}
              inputStyle={inputStyle}
              labelStyle={labelStyle}
              onSubmit={(quotedPrice, estimatedDuration, notes) => {
                createQuotation({
                  chatId,
                  invitationId: createFor.uuid,
                  serviceType: createFor.serviceRole,
                  serviceProviderWorkspaceId: activeWorkspaceId,
                  quotedPrice,
                  estimatedDuration,
                  notes,
                });
                setCreateFor(null);
                refresh();
              }}
              onCancel={() => setCreateFor(null)}
            />
          )}

          {/* ── Quotation cards ── */}
          {quotations.length === 0 && !createFor && (
            <div style={{
              textAlign: 'center', padding: '32px 16px',
              fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.7,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
              Belum ada quotasi.<br />
              {isProvider ? 'Buat quotasi di atas untuk memulai.' : 'Menunggu penyedia layanan membuat quotasi.'}
            </div>
          )}

          {quotations.map(q => (
            <QuotationCard
              key={`${q.uuid}-${localTick}`}
              quotation={q}
              activeWorkspaceId={activeWorkspaceId}
              isBuyer={isBuyer}
              isSeller={isSeller}
              isProvider={q.serviceProviderWorkspaceId === activeWorkspaceId}
              inputStyle={inputStyle}
              labelStyle={labelStyle}
              onRefresh={refresh}
            />
          ))}

          <div style={{ height: 24 }} />
        </div>
      </div>
    </>
  );
}

// ─── Quotation Sub-components ─────────────────────────────────────────────────

function CreateQuotationForm({
  chatId: _chatId,
  invitation,
  inputStyle,
  labelStyle,
  onSubmit,
  onCancel,
}: {
  chatId: string;
  invitation: ParticipantInvitation;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onSubmit: (price: number, duration: string, notes: string) => void;
  onCancel: () => void;
}) {
  const [price,    setPrice]    = useState('');
  const [duration, setDuration] = useState('');
  const [notes,    setNotes]    = useState('');
  const [saving,   setSaving]   = useState(false);

  const canSubmit = parseFloat(price) > 0 && duration.trim();

  function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    onSubmit(parseFloat(price), duration.trim(), notes.trim());

    setSaving(false);
  }

  return (
    <div style={{
      background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: 12,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
      }}>
        <span style={{ fontSize: 18 }}>{SERVICE_ROLE_ICON[invitation.serviceRole]}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
            Buat Quotasi — {invitation.serviceRole}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
            Harga bersifat negosiasi dengan Buyer dan Seller.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Harga Penawaran (Rp) *</label>
        <input
          type="number" min="0" step="1000"
          value={price} onChange={e => setPrice(e.target.value)}
          placeholder="Contoh: 500000"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Estimasi Durasi *</label>
        <input
          type="text"
          value={duration} onChange={e => setDuration(e.target.value)}
          placeholder="Contoh: 1–2 hari, 4 jam, Segera"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Catatan Layanan</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          rows={2} placeholder="Syarat, cakupan layanan, atau informasi tambahan…"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel} style={{
          flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
          background: 'transparent', border: '1.5px solid var(--color-border)',
          color: 'var(--color-muted)', cursor: 'pointer',
        }}>Batal</button>
        <button type="button" onClick={handleSubmit}
          disabled={!canSubmit || saving}
          style={{
            flex: 2, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: canSubmit ? 'var(--color-primary)' : 'var(--color-border)',
            color: '#fff', border: 'none',
            cursor: canSubmit ? 'pointer' : 'default',
          }}>
          {saving ? 'Menyimpan…' : '💾 Simpan Draft'}
        </button>
      </div>
    </div>
  );
}

function QuotationCard({
  quotation,
  activeWorkspaceId,
  isBuyer,
  isSeller,
  isProvider,
  inputStyle,
  labelStyle,
  onRefresh,
}: {
  quotation: ServiceQuotation;
  activeWorkspaceId: string;
  isBuyer: boolean;
  isSeller: boolean;
  isProvider: boolean;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onRefresh: () => void;
}) {
  const [showHistory,   setShowHistory]   = useState(false);
  const [showRevForm,   setShowRevForm]   = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showReqRevForm, setShowReqRevForm] = useState(false);

  const cfg      = QUOTE_STATUS_CONFIG[quotation.status];
  const isLocked = quotation.status === 'Locked';
  const canNegotiate = ['Submitted', 'Revised', 'Negotiating'].includes(quotation.status);

  const d = new Date(quotation.updatedAt);
  const fmtDate = `${d.getDate()} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][d.getMonth()]} ${d.getFullYear()}`;

  return (
    <div style={{
      background: 'var(--color-bg)', border: `1.5px solid ${cfg.color}35`,
      borderRadius: 'var(--radius-md)', marginBottom: 12, overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', background: cfg.bg,
        borderBottom: `1px solid ${cfg.color}20`,
      }}>
        <span style={{ fontSize: 20 }}>{SERVICE_ROLE_ICON[quotation.serviceType]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
            {quotation.serviceType}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getWorkspaceName(quotation.serviceProviderWorkspaceId)}
          </div>
        </div>
        <span style={{
          fontSize: 10.5, fontWeight: 700, color: cfg.color,
          background: `${cfg.color}18`, borderRadius: 20, padding: '2px 9px', flexShrink: 0,
        }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 12px' }}>
        {/* Price */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
        }}>
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>Harga Penawaran</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: isLocked ? 'var(--color-info)' : 'var(--color-text)' }}>
            {formatRupiah(quotation.quotedPrice)}
          </span>
        </div>

        {/* Duration + notes */}
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 3 }}>
          ⏱ Durasi: <strong style={{ color: 'var(--color-text)' }}>{quotation.estimatedDuration}</strong>
        </div>
        {quotation.notes && (
          <div style={{
            fontSize: 11.5, color: 'var(--color-text)',
            background: 'var(--color-surface)', borderRadius: 6,
            padding: '5px 8px', marginTop: 6, lineHeight: 1.5,
          }}>
            {quotation.notes}
          </div>
        )}
        <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 6 }}>
          Diperbarui: {fmtDate} · {quotation.revisionHistory.length} revisi
        </div>

        {/* ── Provider actions ── */}
        {isProvider && !isLocked && (
          <div style={{ marginTop: 10 }}>
            {/* Submit (Draft only) */}
            {quotation.status === 'Draft' && (
              <button type="button"
                onClick={() => { submitQuotation(quotation.uuid); onRefresh(); }}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 8, marginBottom: 6,
                  background: 'var(--color-primary)', color: '#fff',
                  border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                }}>
                📤 Ajukan Quotasi
              </button>
            )}

            {/* Revise (Negotiating) */}
            {quotation.status === 'Negotiating' && !showRevForm && (
              <button type="button" onClick={() => setShowRevForm(true)} style={{
                width: '100%', padding: '9px 0', borderRadius: 8, marginBottom: 6,
                background: 'rgba(124,58,237,0.1)', color: 'var(--color-escrow)',
                border: '1.5px solid rgba(124,58,237,0.3)',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              }}>✏️ Revisi Quotasi</button>
            )}

            {/* Revise form */}
            {showRevForm && (
              <ReviseQuotationForm
                quotation={quotation}
                activeWorkspaceId={activeWorkspaceId}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                onSubmit={(newPrice, duration, notes, reason) => {
                  reviseQuotation(quotation.uuid, {
                    newPrice, estimatedDuration: duration, notes,
                    byWorkspaceId: activeWorkspaceId, reason,
                  });
                  setShowRevForm(false);
                  onRefresh();
                }}
                onCancel={() => setShowRevForm(false)}
              />
            )}

            {/* Withdraw */}
            {!['Rejected', 'Cancelled'].includes(quotation.status) && (
              <button type="button"
                onClick={() => { withdrawQuotation(quotation.uuid); onRefresh(); }}
                style={{
                  width: '100%', padding: '8px 0', borderRadius: 8,
                  background: 'transparent', border: '1.5px dashed var(--color-border)',
                  color: 'var(--color-muted)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                }}>
                🚫 Tarik Quotasi
              </button>
            )}
          </div>
        )}

        {/* ── Buyer / Seller negotiation actions ── */}
        {(isBuyer || isSeller) && canNegotiate && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              {/* Accept → Locked */}
              <button type="button"
                onClick={() => { acceptQuotation(quotation.uuid, activeWorkspaceId); onRefresh(); }}
                style={{
                  flex: 2, padding: '9px 0', borderRadius: 8,
                  background: 'var(--color-success)', color: '#fff', border: 'none',
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                }}>✅ Terima & Kunci</button>

              {/* Reject */}
              <button type="button" onClick={() => setShowRejectForm(v => !v)} style={{
                flex: 1, padding: '9px 0', borderRadius: 8,
                background: 'rgba(220,38,38,0.09)',
                border: '1.5px solid rgba(220,38,38,0.3)',
                color: 'var(--color-danger)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
              }}>❌ Tolak</button>
            </div>

            {/* Request revision */}
            {!showReqRevForm && (
              <button type="button" onClick={() => setShowReqRevForm(true)} style={{
                width: '100%', padding: '8px 0', borderRadius: 8,
                background: 'rgba(217,119,6,0.09)',
                border: '1.5px solid rgba(217,119,6,0.3)',
                color: 'var(--color-warning)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>🤝 Minta Revisi</button>
            )}

            {/* Reject form */}
            {showRejectForm && (
              <NegotiationNoteForm
                title="Alasan Penolakan"
                placeholder="Jelaskan alasan penolakan…"
                buttonLabel="❌ Konfirmasi Tolak"
                buttonColor="var(--color-danger)"
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                onSubmit={(reason) => {
                  rejectQuotation(quotation.uuid, activeWorkspaceId, reason);
                  setShowRejectForm(false);
                  onRefresh();
                }}
                onCancel={() => setShowRejectForm(false)}
              />
            )}

            {/* Request revision form */}
            {showReqRevForm && (
              <NegotiationNoteForm
                title="Catatan Permintaan Revisi"
                placeholder="Apa yang perlu direvisi? (harga, durasi, dll.)"
                buttonLabel="🤝 Kirim Permintaan Revisi"
                buttonColor="var(--color-warning)"
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                onSubmit={(reason) => {
                  requestRevision(quotation.uuid, activeWorkspaceId, reason);
                  setShowReqRevForm(false);
                  onRefresh();
                }}
                onCancel={() => setShowReqRevForm(false)}
              />
            )}
          </div>
        )}

        {/* ── Revision history ── */}
        {quotation.revisionHistory.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button type="button" onClick={() => setShowHistory(v => !v)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: 'var(--color-muted)',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                Riwayat Revisi ({quotation.revisionHistory.length})
              </span>
              <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                {showHistory ? '▲' : '▼'}
              </span>
            </button>
            {showHistory && (
              <div style={{
                background: 'var(--color-surface)', borderRadius: 8,
                border: '1px solid var(--color-border)', overflow: 'hidden', marginTop: 4,
              }}>
                {[...quotation.revisionHistory].reverse().map((rev, i) => {
                  const rd = new Date(rev.timestamp);
                  const rdFmt = `${rd.getDate()} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][rd.getMonth()]}, ${String(rd.getHours()).padStart(2,'0')}:${String(rd.getMinutes()).padStart(2,'0')}`;
                  const priceChanged = rev.previousPrice !== rev.newPrice;
                  return (
                    <div key={rev.version} style={{
                      padding: '8px 10px',
                      borderBottom: i < quotation.revisionHistory.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800, color: 'var(--color-primary)',
                          background: 'rgba(37,99,235,0.1)', borderRadius: 4, padding: '1px 5px',
                        }}>v{rev.version}</span>
                        <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{rdFmt}</span>
                      </div>
                      {priceChanged && (
                        <div style={{ fontSize: 11, color: 'var(--color-text)', marginBottom: 2 }}>
                          Harga: <span style={{ textDecoration: 'line-through', color: 'var(--color-muted)' }}>
                            {formatRupiah(rev.previousPrice)}
                          </span> → <strong>{formatRupiah(rev.newPrice)}</strong>
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.4 }}>
                        {rev.reason}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
                        Oleh: {getWorkspaceName(rev.editor)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviseQuotationForm({
  quotation,
  activeWorkspaceId,
  inputStyle,
  labelStyle,
  onSubmit,
  onCancel,
}: {
  quotation: ServiceQuotation;
  activeWorkspaceId: string;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onSubmit: (newPrice: number, duration: string, notes: string, reason: string) => void;
  onCancel: () => void;
}) {
  const [price,    setPrice]    = useState(String(quotation.quotedPrice));
  const [duration, setDuration] = useState(quotation.estimatedDuration);
  const [notes,    setNotes]    = useState(quotation.notes);
  const [reason,   setReason]   = useState('');
  const [saving,   setSaving]   = useState(false);

  void activeWorkspaceId; // used by caller

  const canSubmit = parseFloat(price) > 0 && reason.trim();

  return (
    <div style={{
      background: 'rgba(124,58,237,0.06)', border: '1.5px solid rgba(124,58,237,0.25)',
      borderRadius: 8, padding: '12px', marginBottom: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-escrow)', marginBottom: 10 }}>✏️ Revisi Quotasi</div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ ...labelStyle, color: 'var(--color-escrow)' }}>Harga Baru (Rp) *</label>
        <input type="number" min="0" step="1000" value={price}
          onChange={e => setPrice(e.target.value)} style={{ ...inputStyle, background: 'rgba(255,255,255,0.8)' }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ ...labelStyle, color: 'var(--color-escrow)' }}>Estimasi Durasi</label>
        <input type="text" value={duration} onChange={e => setDuration(e.target.value)}
          style={{ ...inputStyle, background: 'rgba(255,255,255,0.8)' }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ ...labelStyle, color: 'var(--color-escrow)' }}>Catatan</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          style={{ ...inputStyle, resize: 'vertical', background: 'rgba(255,255,255,0.8)' }} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ ...labelStyle, color: 'var(--color-escrow)' }}>Alasan Revisi *</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
          placeholder="Jelaskan perubahan yang dilakukan…"
          style={{ ...inputStyle, resize: 'vertical', background: 'rgba(255,255,255,0.8)' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel} style={{
          flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700,
          background: 'transparent', border: '1.5px solid rgba(124,58,237,0.3)',
          color: 'var(--color-escrow)', cursor: 'pointer',
        }}>Batal</button>
        <button type="button" onClick={() => {
          if (!canSubmit) return;
          setSaving(true);
          onSubmit(parseFloat(price), duration, notes, reason.trim());

          setSaving(false);
        }} disabled={!canSubmit || saving} style={{
          flex: 2, padding: '9px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
          background: canSubmit ? 'var(--color-escrow)' : 'var(--color-border)',
          color: '#fff', border: 'none', cursor: canSubmit ? 'pointer' : 'default',
        }}>
          {saving ? 'Menyimpan…' : '✏️ Simpan Revisi'}
        </button>
      </div>
    </div>
  );
}

function NegotiationNoteForm({
  title,
  placeholder,
  buttonLabel,
  buttonColor,
  inputStyle,
  labelStyle,
  onSubmit,
  onCancel,
}: {
  title: string;
  placeholder: string;
  buttonLabel: string;
  buttonColor: string;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [note,   setNote]   = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 8, padding: '10px 12px', marginTop: 6,
    }}>
      <label style={labelStyle}>{title} *</label>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
        placeholder={placeholder} style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" onClick={onCancel} style={{
          flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11.5, fontWeight: 700,
          background: 'transparent', border: '1.5px solid var(--color-border)',
          color: 'var(--color-muted)', cursor: 'pointer',
        }}>Batal</button>
        <button type="button" onClick={() => {
          if (!note.trim()) return;
          setSaving(true);
          onSubmit(note.trim());

          setSaving(false);
        }} disabled={!note.trim() || saving} style={{
          flex: 2, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700,
          background: note.trim() ? buttonColor : 'var(--color-border)',
          color: '#fff', border: 'none', cursor: note.trim() ? 'pointer' : 'default',
        }}>
          {saving ? 'Memproses…' : buttonLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Deal Sheet ───────────────────────────────────────────────────────────────
