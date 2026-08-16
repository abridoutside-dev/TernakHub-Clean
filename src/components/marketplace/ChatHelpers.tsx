// ─── ChatHelpers — extracted from MarketplaceChat.tsx ──
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
import { WORKSPACES } from '../../components/TopAppBar';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isToday) return 'Hari ini';
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDatetime(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function getWorkspaceName(id: string): string {
  return WORKSPACES.find(w => w.id === id)?.name ?? id;
}

export function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

// ─── Status Icon ──────────────────────────────────────────────────────────────

export function StatusIcon({ status }: { status: ChatMessage['status'] }) {
  if (status === 'Terkirim') return <span title="Terkirim" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>✓</span>;
  if (status === 'Diterima') return <span title="Diterima" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>✓✓</span>;
  return <span title="Dibaca" style={{ color: 'var(--color-chat-read)', fontSize: 10 }}>✓✓</span>;
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

export function MessageBubble({ msg, isSelf }: { msg: ChatMessage; isSelf: boolean }) {
  const isGambar = msg.tipe === 'Gambar';
  return (
    <div style={{ display: 'flex', justifyContent: isSelf ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
      <div style={{
        maxWidth: '78%',
        background: isSelf ? 'var(--color-primary)' : 'var(--color-surface)',
        color: isSelf ? '#fff' : 'var(--color-text)',
        borderRadius: isSelf ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        padding: isGambar ? '8px 10px' : '9px 13px',
        border: isSelf ? 'none' : '1.5px solid var(--color-border)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
      }}>
        {isGambar ? (
          <div style={{ fontSize: 48, lineHeight: 1.1, textAlign: 'center' }}>{msg.konten}</div>
        ) : (
          <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {msg.konten}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 3 }}>
          <span style={{ fontSize: 10, opacity: 0.65 }}>{formatTime(msg.timestamp)}</span>
          {isSelf && <StatusIcon status={msg.status} />}
        </div>
      </div>
    </div>
  );
}

// ─── Image Picker ─────────────────────────────────────────────────────────────

export const IMAGE_PRESETS = ['🐑','🐄','🐐','🐓','🦆','🌾','🌿','💊','📦','🚚','🌱','🌾','🏡','📸','✅'];

export function ImagePicker({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }) {
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, right: 0,
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 4,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
        textTransform: 'uppercase', marginBottom: 8,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>Pilih Gambar</span>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-muted)' }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {IMAGE_PRESETS.map((emoji, i) => (
          <button
            key={i} type="button"
            onClick={() => { onPick(emoji); onClose(); }}
            style={{
              width: 40, height: 40, fontSize: 22, borderRadius: 8,
              background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 10.5, color: 'var(--color-muted)' }}>
        Upload gambar nyata akan tersedia pada versi berikutnya.
      </div>
    </div>
  );
}

// ─── Chat Input ───────────────────────────────────────────────────────────────

export function ChatInput({ onSend }: { onSend: (konten: string, tipe: ChatMessageTipe) => void }) {
  const [text, setText] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, 'Teks');
    setText('');
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div style={{ position: 'relative', background: 'var(--color-surface)', borderTop: '1.5px solid var(--color-border)', padding: '10px 12px' }}>
      {showImagePicker && (
        <ImagePicker onPick={e => onSend(e, 'Gambar')} onClose={() => setShowImagePicker(false)} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <button
          type="button" onClick={() => setShowImagePicker(s => !s)} title="Kirim Gambar"
          style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: showImagePicker ? 'var(--color-primary-light)' : 'var(--color-bg)',
            border: '1.5px solid var(--color-border)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}
        >🖼️</button>
        <textarea
          ref={textareaRef} value={text}
          onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Tulis pesan…" rows={1}
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 20,
            border: '1.5px solid var(--color-border)', background: 'var(--color-bg)',
            fontSize: 13, color: 'var(--color-text)',
            resize: 'none', outline: 'none', lineHeight: 1.4,
            maxHeight: 100, overflowY: 'auto', fontFamily: 'inherit',
          }}
        />
        <button
          type="button" onClick={handleSend} disabled={!text.trim()}
          style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: text.trim() ? 'var(--color-primary)' : 'var(--color-border)',
            border: 'none', cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
        >
          <span style={{ color: '#fff', fontSize: 16, lineHeight: 1 }}>➤</span>
        </button>
      </div>
    </div>
  );
}
