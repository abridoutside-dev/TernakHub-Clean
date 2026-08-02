// ─── ChatEscrow — extracted from MarketplaceChat.tsx ──
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
import { getActiveTransactionRoomEscrowProviders } from '../../data/masterEscrowData';
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

// ─── Escrow Bar ───────────────────────────────────────────────────────────────
// Thin strip below ServiceBar. Visible when Deal=Locked + Escrow participant Joined.
// Shows current escrow status (or prompt to activate) and opens EscrowSheet.

// ─── EscrowBar — FARM-FIX-005.8 ──────────────────────────────────────────────
// Shows for ALL Locked deals. Routes display based on escrow config type.
// Workflow creation moved into EscrowSheet for clean separation.
export function EscrowBar({
  chatId,
  deal,
  escrowParticipantId,
  onOpen,
  onTick: _onTick,  // reserved for future use; creation is now in EscrowSheet
}: {
  chatId: string;
  deal: Deal | undefined;
  escrowParticipantId: string | null;
  onOpen: () => void;
  onTick: () => void;
}) {
  const isLocked = deal?.status === 'Locked';
  if (!isLocked) return null;

  const escrowConfig = getEscrowConfig(chatId);
  const workflow     = getEscrowWorkflow(chatId);

  // ── No config selected yet ──
  if (!escrowConfig) {
    return (
      <button
        type="button" onClick={onOpen}
        style={{
          width: '100%', padding: '8px 14px',
          background: 'rgba(124,58,237,0.06)',
          borderBottom: '1px solid rgba(124,58,237,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          cursor: 'pointer', border: 'none',
        }}
      >
        <span style={{ fontSize: 14 }}>🏦</span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-escrow)' }}>
          Pilih Metode Pembayaran
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-escrow)', opacity: 0.7 }}>→</span>
      </button>
    );
  }

  // ── Direct Payment ──
  if (escrowConfig.configType === 'Direct') {
    return (
      <button
        type="button" onClick={onOpen}
        style={{
          width: '100%', padding: '7px 14px',
          background: 'rgba(22,163,74,0.06)',
          borderBottom: '1px solid rgba(22,163,74,0.18)',
          display: 'flex', alignItems: 'center', gap: 7,
          cursor: 'pointer', border: 'none',
        }}
      >
        <span style={{ fontSize: 14 }}>💸</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-success)', flex: 1 }}>
          Pembayaran Langsung
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--color-success)',
          background: 'rgba(22,163,74,0.1)', borderRadius: 20, padding: '2px 8px',
        }}>Lihat →</span>
      </button>
    );
  }

  // ── External Escrow ──
  if (escrowConfig.configType === 'External') {
    const hasDetails = !!escrowConfig.externalDetails;
    return (
      <button
        type="button" onClick={onOpen}
        style={{
          width: '100%', padding: '7px 14px',
          background: 'rgba(217,119,6,0.06)',
          borderBottom: '1px solid rgba(217,119,6,0.18)',
          display: 'flex', alignItems: 'center', gap: 7,
          cursor: 'pointer', border: 'none', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 14 }}>🏢</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-warning)' }}>
            Escrow Eksternal
          </span>
          {hasDetails && (
            <span style={{ fontSize: 10, color: 'var(--color-warning)', opacity: 0.8, marginLeft: 6 }}>
              · {escrowConfig.externalDetails!.company}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--color-warning)',
          background: 'rgba(217,119,6,0.1)', borderRadius: 20, padding: '2px 8px', flexShrink: 0,
        }}>
          {hasDetails ? 'Kelola →' : 'Catat Detail →'}
        </span>
      </button>
    );
  }

  // ── TernakHub Escrow ──
  if (!escrowParticipantId) {
    return (
      <button
        type="button" onClick={onOpen}
        style={{
          width: '100%', padding: '8px 14px',
          background: 'rgba(124,58,237,0.06)',
          borderBottom: '1px solid rgba(124,58,237,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          cursor: 'pointer', border: 'none',
        }}
      >
        <span style={{ fontSize: 14 }}>🏦</span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-escrow)' }}>
          Undang Escrow TernakHub ke Room ini
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-escrow)', opacity: 0.7 }}>→</span>
      </button>
    );
  }

  if (!workflow) {
    return (
      <button
        type="button" onClick={onOpen}
        style={{
          width: '100%', padding: '8px 14px',
          background: 'rgba(124,58,237,0.07)',
          borderBottom: '1px solid rgba(124,58,237,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          cursor: 'pointer', border: 'none',
        }}
      >
        <span style={{ fontSize: 14 }}>🏦</span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-escrow)' }}>
          Aktifkan Layanan Escrow
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-escrow)', opacity: 0.7 }}>→</span>
      </button>
    );
  }

  const cfg        = ESCROW_STATUS_CONFIG[workflow.status];
  const isTerminal = TERMINAL_ESCROW_WORKFLOW_STATUSES.has(workflow.status);

  return (
    <button
      type="button" onClick={onOpen}
      style={{
        width: '100%', padding: '7px 14px',
        background: cfg.bg,
        borderBottom: `1px solid ${cfg.color}25`,
        display: 'flex', alignItems: 'center', gap: 7,
        cursor: 'pointer', border: 'none', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 13, flexShrink: 0 }}>{cfg.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: cfg.color }}>
          Escrow: {cfg.label}
        </span>
      </div>
      {!isTerminal && (
        <span style={{
          fontSize: 10, fontWeight: 700, color: cfg.color,
          background: `${cfg.color}18`, borderRadius: 20, padding: '2px 8px', flexShrink: 0,
        }}>
          Kelola →
        </span>
      )}
    </button>
  );
}

// ─── Escrow Sheet ─────────────────────────────────────────────────────────────
// Full escrow workflow management sheet.
// Shows different UI sections based on workflow status and viewer role.

const TRANSFER_IMAGE_PRESETS = ['🧾','📱','💵','🏧','📷','📸','📃','📄','🖼️','✅','💳','🏦'];

// ─── EscrowSheet — FARM-FIX-005.8 ────────────────────────────────────────────
// Handles all 3 escrow config types: TernakHub | External | Direct.
// Delivery gate: Holding Funds → Waiting Delivery → Waiting Buyer Confirmation
//                             → Ready To Release → Released.
export function EscrowSheet({
  chatId,
  deal,
  activeWorkspaceId,
  escrowParticipantId,
  onClose,
  onTick,
}: {
  chatId: string;
  deal: Deal;
  activeWorkspaceId: string;
  escrowParticipantId: string | null;
  onClose: () => void;
  onTick: () => void;
}) {
  function refresh() { onTick(); }

  const escrowConfig = getEscrowConfig(chatId);
  const workflow     = getEscrowWorkflow(chatId);

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
  function primaryBtn(label: string, onClick: () => void, disabled = false, color = 'var(--color-primary)') {
    return (
      <button type="button" onClick={onClick} disabled={disabled} style={{
        width: '100%', padding: '11px 0', borderRadius: 8, marginBottom: 8,
        background: disabled ? 'var(--color-border)' : color,
        color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
        cursor: disabled ? 'default' : 'pointer',
      }}>{label}</button>
    );
  }

  // ── Dynamic header ──
  let headerIcon = '🏦', headerLabel = 'Pembayaran & Escrow', headerSub = 'Pilih metode pembayaran', headerColor = 'var(--color-escrow)';
  if (escrowConfig) {
    const cd = ESCROW_CONFIG_TYPE_CONFIG[escrowConfig.configType];
    headerIcon = cd.icon; headerLabel = cd.label; headerColor = cd.color;
    headerSub  = 'Konfigurasi Pembayaran';
  }
  if (escrowConfig?.configType === 'TernakHub' && workflow) {
    const wd = ESCROW_STATUS_CONFIG[workflow.status];
    headerIcon = wd.icon; headerLabel = wd.label; headerColor = wd.color;
    headerSub  = 'TernakHub Escrow';
  }

  const canChangeConfig = !workflow || TERMINAL_ESCROW_WORKFLOW_STATUSES.has(workflow.status);

  // Role derivation used in AI panel and call sites below
  const isBuyerRole  = deal.workspaceIdPembeli === activeWorkspaceId;
  const isSellerRole = deal.workspaceIdPenjual  === activeWorkspaceId;
  const isEscrowRole = escrowParticipantId !== null && escrowParticipantId === activeWorkspaceId;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, background: 'var(--color-surface)',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
        zIndex: 301, maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px 12px', borderBottom: '1.5px solid var(--color-border)' }}>
          <span style={{ fontSize: 22 }}>{headerIcon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: headerColor }}>{headerLabel}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{headerSub}</div>
          </div>
          <button type="button" onClick={onClose} style={{
            width: 30, height: 30, borderRadius: '50%', border: 'none',
            background: 'var(--color-bg)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: 'var(--color-muted)',
          }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

          {/* ══ NO CONFIG: selector ══ */}
          {!escrowConfig && (
            <>
              <div style={{
                background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 8, padding: '10px 12px', marginBottom: 14,
                fontSize: 12, color: 'var(--color-escrow)', lineHeight: 1.5,
              }}>
                🏦 Deal terkunci. Pilih metode pembayaran untuk transaksi ini.
                Pilihan dapat diubah hingga proses pembayaran dimulai.
              </div>
              <EscrowConfigSelectorBlock chatId={chatId} activeWorkspaceId={activeWorkspaceId} onSelected={refresh} />
            </>
          )}

          {/* ══ DIRECT PAYMENT ══ */}
          {escrowConfig?.configType === 'Direct' && (
            <DirectPaymentPanel chatId={chatId} activeWorkspaceId={activeWorkspaceId} escrowConfig={escrowConfig} />
          )}

          {/* ══ EXTERNAL ESCROW ══ */}
          {escrowConfig?.configType === 'External' && (
            <ExternalEscrowPanel
              chatId={chatId} activeWorkspaceId={activeWorkspaceId} escrowConfig={escrowConfig}
              inputStyle={inputStyle} labelStyle={labelStyle} onSaved={refresh}
            />
          )}

          {/* ══ TERNAKHUB ESCROW ══ */}
          {escrowConfig?.configType === 'TernakHub' && (
            <>
              {/* No escrow participant invited */}
              {!escrowParticipantId && (
                <>
                  <InfoNote icon="ℹ️" msg="Undang Escrow TernakHub ke room ini melalui menu Layanan." />
                  <div style={{
                    background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)',
                    borderRadius: 8, padding: '10px 12px', marginBottom: 14,
                    fontSize: 11.5, color: 'var(--color-escrow)', lineHeight: 1.7,
                  }}>
                    <strong>Cara mengundang Escrow:</strong><br />
                    1. Tekan tombol Layanan di atas area chat<br />
                    2. Pilih "Undang Layanan" → pilih peran Escrow<br />
                    3. Pilih workspace Escrow TernakHub<br />
                    4. Setelah diterima, kembali ke sini untuk mengaktifkan
                  </div>
                  <EscrowAIPanel status={null} escrowConfigType="TernakHub" chatId={chatId}
                    isBuyer={isBuyerRole} isEscrow={false} isSeller={isSellerRole} />
                </>
              )}

              {/* Participant joined but no workflow created yet */}
              {escrowParticipantId && !workflow && (
                <>
                  <InfoNote icon="✅" msg="Escrow telah bergabung. Klik tombol di bawah untuk memulai proses." color="var(--color-escrow)" />
                  {primaryBtn('🏦 Aktifkan Layanan Escrow', () => {
                    const dealTotal = deal.fields.jumlah * deal.fields.hargaSatuan;
                    createEscrowWorkflow({
                      chatId,
                      buyerWorkspaceId:  deal.workspaceIdPembeli,
                      sellerWorkspaceId: deal.workspaceIdPenjual,
                      escrowWorkspaceId: escrowParticipantId,
                      dealTotal,
                      feePayer: 'Buyer',
                    });
                    refresh();
                  }, false, 'var(--color-escrow)')}
                  <EscrowAIPanel status={null} escrowConfigType="TernakHub" chatId={chatId}
                    isBuyer={isBuyerRole} isEscrow={isEscrowRole} isSeller={isSellerRole} />
                </>
              )}

              {/* Full workflow */}
              {workflow && (() => {
                const cfg        = ESCROW_STATUS_CONFIG[workflow.status];
                const isEscrow   = activeWorkspaceId === (escrowParticipantId ?? workflow.escrowWorkspaceId);
                const isBuyer    = activeWorkspaceId === workflow.buyerWorkspaceId;
                const isTerminal = TERMINAL_ESCROW_WORKFLOW_STATUSES.has(workflow.status);
                const escrowAccount = workflow.paymentInstruction
                  ? getEscrowAccountById(workflow.paymentInstruction.escrowAccountId)
                  : null;

                return (
                  <>
                    {/* Status description */}
                    <div style={{
                      background: cfg.bg, border: `1.5px solid ${cfg.color}40`,
                      borderRadius: 8, padding: '10px 12px', marginBottom: 14,
                      fontSize: 12, color: cfg.color, lineHeight: 1.5,
                    }}>{cfg.description}</div>

                    {/* Contextual AI */}
                    <EscrowAIPanel status={workflow.status} escrowConfigType="TernakHub" chatId={chatId}
                      isBuyer={isBuyer} isEscrow={isEscrow} isSeller={!isBuyer && !isEscrow} />

                    {/* Fee Summary */}
                    <EscrowFeeSummary workflow={workflow} />

                    {/* ── WAITING ASSIGNMENT ── */}
                    {workflow.status === 'Waiting Assignment' && isEscrow && (
                      <EscrowStartPanel workflow={workflow} onAction={() => {
                        startAssignment(chatId, activeWorkspaceId); refresh();
                      }} />
                    )}
                    {workflow.status === 'Waiting Assignment' && !isEscrow && (
                      <InfoNote icon="⏳" msg="Menunggu Escrow memulai penugasan." />
                    )}

                    {/* ── WAITING PAYMENT INSTRUCTION ── */}
                    {workflow.status === 'Waiting Payment Instruction' && isEscrow && (
                      <>
                        {!allRequiredQuotationsLocked(chatId) && (
                          <div style={{
                            background: 'rgba(245,124,0,0.08)', border: '1.5px solid rgba(245,124,0,0.3)',
                            borderRadius: 8, padding: '10px 12px', marginBottom: 12,
                            fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5,
                          }}>
                            ⚠️ <strong>Quotasi layanan belum terkunci.</strong><br />
                            Semua quotasi aktif harus <strong>Terkunci</strong> sebelum instruksi pembayaran dapat dibuat.
                          </div>
                        )}
                        <PaymentInstructionForm
                          workflow={workflow} chatId={chatId}
                          inputStyle={inputStyle} labelStyle={labelStyle}
                          onSubmit={(buyerBankName, escrowAccountId, feePayer) => {
                            createPaymentInstruction(chatId, { buyerBankName, escrowAccountId, feePayer, byWorkspaceId: activeWorkspaceId });
                            refresh();
                          }}
                        />
                      </>
                    )}
                    {workflow.status === 'Waiting Payment Instruction' && !isEscrow && (
                      <InfoNote icon="📋" msg="Escrow sedang menyiapkan instruksi pembayaran." />
                    )}

                    {/* ── WAITING BUYER PAYMENT ── */}
                    {workflow.status === 'Waiting Buyer Payment' && (
                      <>
                        {workflow.verificationHistory.length > 0 && (() => {
                          const last = workflow.verificationHistory[workflow.verificationHistory.length - 1];
                          return (
                            <div style={{
                              background: 'rgba(245,124,0,0.08)', border: '1px solid rgba(245,124,0,0.3)',
                              borderRadius: 8, padding: '8px 12px', marginBottom: 12,
                              fontSize: 11.5, color: 'var(--color-muted)',
                            }}>
                              ⚠️ <strong>{last.action === 'Reject' ? 'Ditolak' : 'Minta Unggah Ulang'}:</strong> {last.note ?? '—'}
                            </div>
                          );
                        })()}
                        {escrowAccount && workflow.paymentInstruction && (
                          <PaymentInstructionCard
                            instruction={workflow.paymentInstruction} account={escrowAccount}
                            dealTotal={workflow.dealTotal} escrowFee={workflow.escrowFee}
                          />
                        )}
                        {isBuyer ? (
                          <BuyerPaymentProofForm
                            inputStyle={inputStyle} labelStyle={labelStyle}
                            onSubmit={(imageEmoji, transferDate, amount, note) => {
                              uploadPaymentProof(chatId, { imageEmoji, transferDate, amount, note, byWorkspaceId: activeWorkspaceId });
                              refresh();
                            }}
                          />
                        ) : (
                          <InfoNote icon="💳" msg="Menunggu Buyer mengunggah bukti transfer." />
                        )}
                      </>
                    )}

                    {/* ── WAITING VERIFICATION ── */}
                    {workflow.status === 'Waiting Verification' && (
                      <>
                        {workflow.buyerPaymentProof && <BuyerProofCard proof={workflow.buyerPaymentProof} />}
                        {isEscrow ? (
                          <VerificationPanel
                            inputStyle={inputStyle} labelStyle={labelStyle}
                            onAction={(action, note) => {
                              verifyPaymentProof(chatId, { action, note, byWorkspaceId: activeWorkspaceId });
                              refresh();
                            }}
                          />
                        ) : (
                          <InfoNote icon="🔍" msg="Escrow sedang memverifikasi bukti transfer." />
                        )}
                      </>
                    )}

                    {/* ── HOLDING FUNDS ── */}
                    {workflow.status === 'Holding Funds' && (
                      <>
                        <InfoNote icon="🔐" msg="Dana Buyer ditahan oleh Escrow. Mulai monitoring pengiriman sebelum merilis dana." color="var(--color-info)" />
                        {isEscrow && (
                          <>
                            {primaryBtn('🚚 Mulai Monitoring Pengiriman', () => {
                              transitionToWaitingDelivery(chatId, activeWorkspaceId); refresh();
                            }, false, 'var(--color-transport)')}
                            <div style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'center', marginBottom: 10 }}>
                              Dana tidak dapat dirilis sebelum pengiriman selesai dan Buyer mengkonfirmasi penerimaan.
                            </div>
                            <DisputeOpenButton chatId={chatId} activeWorkspaceId={activeWorkspaceId} inputStyle={inputStyle} labelStyle={labelStyle} onDone={refresh} />
                            <RefundButton chatId={chatId} dealTotal={workflow.dealTotal} activeWorkspaceId={activeWorkspaceId} inputStyle={inputStyle} labelStyle={labelStyle} onDone={refresh} />
                          </>
                        )}
                        {!isEscrow && <InfoNote icon="⏳" msg="Menunggu Escrow memulai monitoring pengiriman." />}
                      </>
                    )}

                    {/* ── WAITING DELIVERY ── */}
                    {workflow.status === 'Waiting Delivery' && (
                      <WaitingDeliveryPanel
                        chatId={chatId} isEscrow={isEscrow}
                        inputStyle={inputStyle} labelStyle={labelStyle}
                        activeWorkspaceId={activeWorkspaceId}
                        onAdvance={() => { transitionToBuyerConfirmation(chatId, activeWorkspaceId); refresh(); }}
                        onDone={refresh}
                      />
                    )}

                    {/* ── WAITING BUYER CONFIRMATION ── */}
                    {workflow.status === 'Waiting Buyer Confirmation' && (
                      <BuyerConfirmationPanel
                        chatId={chatId} isBuyer={isBuyer} isEscrow={isEscrow}
                        workflow={workflow}
                        inputStyle={inputStyle} labelStyle={labelStyle}
                        onConfirm={(note) => { buyerConfirmedReceived(chatId, { byWorkspaceId: activeWorkspaceId, note }); refresh(); }}
                        onReportProblem={(reason) => { buyerReportedProblem(chatId, { reason, byWorkspaceId: activeWorkspaceId }); refresh(); }}
                      />
                    )}

                    {/* ── READY TO RELEASE ── */}
                    {workflow.status === 'Ready To Release' && (
                      <>
                        {workflow.buyerConfirmation && (
                          <div style={{
                            background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)',
                            borderRadius: 8, padding: '10px 12px', marginBottom: 12,
                            fontSize: 12, color: 'var(--color-primary-dark)', lineHeight: 1.5,
                          }}>
                            ✅ <strong>Buyer telah mengkonfirmasi penerimaan barang.</strong>
                            {workflow.buyerConfirmation.note && (
                              <span> Catatan: "{workflow.buyerConfirmation.note}"</span>
                            )}
                          </div>
                        )}
                        <InfoNote icon="✅" msg="Dana siap dirilis ke Seller." color="var(--color-success)" />
                        {isEscrow && (
                          <ReleaseFundsForm
                            inputStyle={inputStyle} labelStyle={labelStyle}
                            onSubmit={(referenceNumber) => { releaseFunds(chatId, { byWorkspaceId: activeWorkspaceId, referenceNumber }); refresh(); }}
                            onRefund={(reason, amount, referenceNumber) => { refundBuyer(chatId, { reason, amount, referenceNumber, byWorkspaceId: activeWorkspaceId }); refresh(); }}
                            dealTotal={workflow.dealTotal}
                          />
                        )}
                        {!isEscrow && <InfoNote icon="⏳" msg="Escrow sedang memproses pelepasan dana ke Seller." />}
                      </>
                    )}

                    {/* ── RELEASED ── */}
                    {workflow.status === 'Released' && workflow.fundRelease && <FundReleaseCard release={workflow.fundRelease} />}

                    {/* ── REFUNDED ── */}
                    {workflow.status === 'Refunded' && workflow.refund && <RefundCard refund={workflow.refund} />}

                    {/* ── CANCELLED ── */}
                    {workflow.status === 'Cancelled' && <InfoNote icon="🚫" msg="Proses escrow telah dibatalkan." color="var(--color-cancelled)" />}

                    {/* ── DISPUTED ── */}
                    {workflow.status === 'Disputed' && workflow.dispute && (
                      <DisputePanel
                        chatId={chatId}
                        dispute={workflow.dispute}
                        additionalActions={workflow.disputeAdditionalActions}
                        isEscrow={isEscrow}
                        dealTotal={workflow.dealTotal}
                        activeWorkspaceId={activeWorkspaceId}
                        inputStyle={inputStyle} labelStyle={labelStyle}
                        onResolve={(resolution, resolutionNote, referenceNumber, refundAmount) => {
                          resolveDispute(chatId, { resolution, resolutionNote, referenceNumber, byWorkspaceId: activeWorkspaceId, refundAmount });
                          refresh();
                        }}
                        onAddAction={(actionType, note) => {
                          addDisputeAdditionalAction(chatId, { actionType, note, byWorkspaceId: activeWorkspaceId });
                          refresh();
                        }}
                      />
                    )}

                    {/* Cancel (non-terminal, Escrow only) */}
                    {!isTerminal && workflow.status !== 'Disputed' && isEscrow && (
                      <CancelEscrowButton chatId={chatId} activeWorkspaceId={activeWorkspaceId} inputStyle={inputStyle} labelStyle={labelStyle} onDone={refresh} />
                    )}

                    <EscrowTimeline timeline={workflow.timeline} />
                    <EscrowAuditLog auditLog={workflow.auditLog} />
                  </>
                );
              })()}
            </>
          )}

          {/* Change config (when no active workflow or terminal) */}
          {escrowConfig && canChangeConfig && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginBottom: 8, textAlign: 'center' }}>
                Ganti metode pembayaran:
              </div>
              <EscrowConfigSelectorBlock chatId={chatId} activeWorkspaceId={activeWorkspaceId} onSelected={refresh} />
            </div>
          )}

          <div style={{ height: 24 }} />
        </div>
      </div>
    </>
  );
}

// ─── Escrow Sub-components ────────────────────────────────────────────────────

// ── EscrowConfigSelectorBlock ─────────────────────────────────────────────────
// 3-option radio card selector for choosing escrow config type.
// For the TernakHub option, name and description are loaded live from
// masterEscrowData.ts so they always reflect the current active provider.
export function EscrowConfigSelectorBlock({
  chatId,
  activeWorkspaceId,
  onSelected,
}: {
  chatId: string;
  activeWorkspaceId: string;
  onSelected: () => void;
}) {
  const current = getEscrowConfig(chatId);

  // Resolve the primary active TernakHub-style provider from Master Escrow
  const masterProviders = getActiveTransactionRoomEscrowProviders();
  const primaryMasterProvider = masterProviders[0] ?? null;

  return (
    <div style={{ marginBottom: 12 }}>
      {(Object.keys(ESCROW_CONFIG_TYPE_CONFIG) as EscrowConfigType[]).map(type => {
        const cfg        = ESCROW_CONFIG_TYPE_CONFIG[type];
        const isSelected = current?.configType === type;

        // For TernakHub type, override label/description from Master Escrow if available
        const displayLabel = (type === 'TernakHub' && primaryMasterProvider)
          ? `${primaryMasterProvider.photo ?? '🛡️'} ${primaryMasterProvider.fullName}`
          : cfg.label;
        const displayDesc = (type === 'TernakHub' && primaryMasterProvider?.shortDescription)
          ? primaryMasterProvider.shortDescription
          : cfg.description;

        return (
          <button
            key={type} type="button"
            onClick={() => { setEscrowConfig(chatId, type, activeWorkspaceId); onSelected(); }}
            style={{
              width: '100%', padding: '12px 14px', marginBottom: 8,
              background: isSelected ? cfg.bg : 'var(--color-bg)',
              border: `2px solid ${isSelected ? cfg.color : 'var(--color-border)'}`,
              borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}
          >
            {type !== 'TernakHub' && (
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{cfg.icon}</span>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? cfg.color : 'var(--color-text)', marginBottom: 3 }}>
                {displayLabel}
                {isSelected && (
                  <span style={{
                    marginLeft: 8, fontSize: 10, fontWeight: 700, color: cfg.color,
                    background: `${cfg.color}15`, borderRadius: 10, padding: '1px 7px',
                  }}>✓ Dipilih</span>
                )}
                {type === 'TernakHub' && primaryMasterProvider?.officialBadge && (
                  <span style={{
                    marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#7c3aed',
                    background: 'rgba(124,58,237,0.1)', borderRadius: 10, padding: '1px 7px',
                  }}>✓ Resmi</span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>{displayDesc}</div>
              {type === 'TernakHub' && primaryMasterProvider && (
                <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                  Biaya: {(primaryMasterProvider.feeConfig.percentage * 100).toFixed(1)}% · Ditanggung: {primaryMasterProvider.feeConfig.feePaidBy}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── WaitingDeliveryPanel ──────────────────────────────────────────────────────
// Shows live transport status. "Minta Konfirmasi Buyer" enabled only when delivered.
function WaitingDeliveryPanel({
  chatId,
  isEscrow,
  inputStyle,
  labelStyle,
  activeWorkspaceId,
  onAdvance,
  onDone,
}: {
  chatId: string;
  isEscrow: boolean;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  activeWorkspaceId: string;
  onAdvance: () => void;
  onDone: () => void;
}) {
  const tc = getTransportConfig(chatId);
  const [manuallyConfirmed, setManuallyConfirmed] = useState(false);

  // Determine delivery readiness from transport status
  // No bypass: delivery gate must be explicitly satisfied per mode.
  let deliveryIcon  = '📦';
  let deliveryLabel = 'Tidak ada transport dikonfigurasi';
  let deliveryColor = 'var(--color-muted)';
  let isDelivered   = false;  // no bypass — each mode must satisfy its own gate

  if (tc?.mode) {
    const modeCfg = TRANSPORT_MODE_CONFIG[tc.mode];
    deliveryIcon  = modeCfg.icon;

    if (tc.mode === 'Marketplace' && tc.marketplace) {
      const sCfg    = MARKETPLACE_TRANSPORT_STATUS_CONFIG[tc.marketplace.status];
      deliveryLabel = `${modeCfg.label}: ${sCfg.label}`;
      deliveryColor = sCfg.color;
      isDelivered   = tc.marketplace.status === 'Delivered' || tc.marketplace.status === 'Completed';
    } else if (tc.mode === 'External' && tc.external) {
      const sCfg    = EXTERNAL_STATUS_CONFIG[tc.external.status];
      deliveryLabel = `${modeCfg.label}: ${sCfg.label}`;
      deliveryColor = sCfg.color;
      isDelivered   = tc.external.status === 'Delivered' || tc.external.status === 'Completed';
    } else if (tc.mode === 'SellerArranges' && tc.sellerArranges) {
      const sCfg    = SELLER_ARRANGES_STATUS_CONFIG[tc.sellerArranges.status];
      deliveryLabel = `${modeCfg.label}: ${sCfg.label}`;
      deliveryColor = sCfg.color;
      isDelivered   = tc.sellerArranges.status === 'Delivered' || tc.sellerArranges.status === 'Completed';
    } else if (tc.mode === 'BuyerPickup' && tc.buyerPickup) {
      const sCfg    = BUYER_PICKUP_STATUS_CONFIG[tc.buyerPickup.status];
      deliveryLabel = `${modeCfg.label}: ${sCfg.label}`;
      deliveryColor = sCfg.color;
      isDelivered   = tc.buyerPickup.status === 'Picked Up' || tc.buyerPickup.status === 'Confirmed';
    } else {
      deliveryLabel = `${modeCfg.label}: Belum dikonfigurasi`;
      isDelivered   = false;
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Transport status card */}
      <div style={{
        background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
        borderRadius: 8, padding: '12px 14px', marginBottom: 12,
      }}>
        <div style={{
          fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)',
          textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
        }}>Status Pengiriman</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{deliveryIcon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: deliveryColor }}>{deliveryLabel}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
              {(isDelivered || manuallyConfirmed)
                ? '✓ Siap untuk meminta konfirmasi Buyer'
                : '⏳ Menunggu pengiriman selesai…'}
            </div>
          </div>
        </div>
      </div>

      {isEscrow ? (
        <>
          {/* Manual delivery confirmation for no-transport case */}
          {!tc?.mode && (
            <div style={{
              background: 'var(--color-bg)', border: '1.5px dashed var(--color-border)',
              borderRadius: 8, padding: '10px 12px', marginBottom: 10,
            }}>
              <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 8, lineHeight: 1.5 }}>
                Tidak ada transport dikonfigurasi. Konfirmasi manual diperlukan untuk melanjutkan.
              </div>
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                fontSize: 12, color: 'var(--color-text)', cursor: 'pointer', lineHeight: 1.4,
              }}>
                <input
                  type="checkbox"
                  checked={manuallyConfirmed}
                  onChange={e => setManuallyConfirmed(e.target.checked)}
                  style={{ width: 16, height: 16, marginTop: 1, cursor: 'pointer', flexShrink: 0 }}
                />
                Saya mengkonfirmasi bahwa pengiriman barang/ternak telah selesai secara manual
              </label>
            </div>
          )}
          <button
            type="button" onClick={onAdvance} disabled={!isDelivered && !manuallyConfirmed}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 8, marginBottom: 8,
              background: (isDelivered || manuallyConfirmed) ? 'var(--color-escrow)' : 'var(--color-border)',
              color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
              cursor: (isDelivered || manuallyConfirmed) ? 'pointer' : 'default',
            }}
          >
            📍 Minta Konfirmasi Penerimaan dari Buyer
          </button>
          {!isDelivered && !manuallyConfirmed && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'center', marginBottom: 10 }}>
              {tc?.mode
                ? 'Tombol aktif setelah pengiriman mencapai status Terkirim / Selesai.'
                : 'Centang konfirmasi manual di atas untuk mengaktifkan tombol.'}
            </div>
          )}
          <DisputeOpenButton
            chatId={chatId} activeWorkspaceId={activeWorkspaceId}
            inputStyle={inputStyle} labelStyle={labelStyle} onDone={onDone}
          />
        </>
      ) : (
        <InfoNote
          icon="🚚"
          msg="Escrow memantau status pengiriman. Anda akan diminta konfirmasi penerimaan setelah pengiriman selesai."
        />
      )}
    </div>
  );
}

// ── BuyerConfirmationPanel ────────────────────────────────────────────────────
// Buyer: ✓ Received | ⚠ Report Problem (auto-dispute). Others: wait message.
function BuyerConfirmationPanel({
  chatId,
  isBuyer,
  isEscrow,
  workflow,
  inputStyle,
  labelStyle,
  onConfirm,
  onReportProblem,
}: {
  chatId: string;
  isBuyer: boolean;
  isEscrow: boolean;
  workflow: EscrowWorkflowRecord;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onConfirm: (note: string | null) => void;
  onReportProblem: (reason: string) => void;
}) {
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [confirmNote,    setConfirmNote]    = useState('');
  const [showProblem,    setShowProblem]    = useState(false);
  const [problemReason,  setProblemReason]  = useState('');
  const [saving,         setSaving]         = useState(false);

  const tc = getTransportConfig(chatId);
  const modeName = tc?.mode ? TRANSPORT_MODE_CONFIG[tc.mode].label : null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        background: 'rgba(106,27,154,0.07)', border: '1.5px solid rgba(106,27,154,0.25)',
        borderRadius: 8, padding: '12px 14px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-escrow)', marginBottom: 6 }}>
          📍 Konfirmasi Penerimaan Barang / Ternak
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-escrow)', lineHeight: 1.5 }}>
          {isBuyer
            ? 'Apakah barang/ternak telah Anda terima sesuai ekspektasi? Konfirmasi agar dana dapat dilepas ke Seller.'
            : 'Menunggu Buyer mengkonfirmasi penerimaan barang.'}
        </div>
        {modeName && (
          <div style={{ fontSize: 11, color: 'var(--color-escrow)', opacity: 0.7, marginTop: 5 }}>
            Mode transport: {modeName}
          </div>
        )}
        {workflow.buyerConfirmation && (
          <div style={{
            marginTop: 8, background: 'rgba(22,163,74,0.1)', borderRadius: 6,
            padding: '6px 10px', fontSize: 11.5, color: 'var(--color-primary-dark)',
          }}>
            ✅ Buyer mengkonfirmasi — {workflow.buyerConfirmation.note ?? 'tidak ada catatan'}
          </div>
        )}
      </div>

      {isBuyer && !workflow.buyerConfirmation && (
        <>
          {!showConfirm && !showProblem && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button type="button" onClick={() => setShowConfirm(true)} style={{
                flex: 1, padding: '12px 8px', borderRadius: 10,
                background: 'var(--color-success)', color: '#fff', border: 'none',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              }}>✓ Diterima Sesuai Ekspektasi</button>
              <button type="button" onClick={() => setShowProblem(true)} style={{
                flex: 1, padding: '12px 8px', borderRadius: 10,
                background: 'transparent', color: 'var(--color-danger)',
                border: '2px solid #c62828', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>⚠ Laporkan Masalah</button>
            </div>
          )}

          {showConfirm && (
            <div style={{
              background: 'rgba(22,163,74,0.07)', border: '1.5px solid rgba(22,163,74,0.25)',
              borderRadius: 8, padding: '12px', marginBottom: 10,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-success)', marginBottom: 8 }}>✓ Konfirmasi Penerimaan</div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Catatan (opsional)</label>
                <textarea value={confirmNote} onChange={e => setConfirmNote(e.target.value)}
                  rows={2} placeholder="Kondisi barang, catatan penerimaan…"
                  style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowConfirm(false)} style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, background: 'transparent',
                  border: '1.5px solid #16a34a', color: 'var(--color-success)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Batal</button>
                <button type="button" disabled={saving} onClick={() => {
                  setSaving(true);
                  onConfirm(confirmNote.trim() || null);

                  setSaving(false);
                }} style={{
                  flex: 2, padding: '9px 0', borderRadius: 8, background: 'var(--color-success)',
                  color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                  {saving ? 'Memproses…' : '✓ Konfirmasi Penerimaan'}
                </button>
              </div>
            </div>
          )}

          {showProblem && (
            <div style={{
              background: 'rgba(198,40,40,0.06)', border: '1.5px solid rgba(198,40,40,0.3)',
              borderRadius: 8, padding: '12px', marginBottom: 10,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 8 }}>⚠ Laporan Masalah</div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ ...labelStyle, color: 'var(--color-danger)' }}>Jelaskan masalah *</label>
                <textarea value={problemReason} onChange={e => setProblemReason(e.target.value)}
                  rows={3} placeholder="Barang rusak, tidak sesuai deskripsi, jumlah kurang, dll…"
                  style={inputStyle} />
              </div>
              <div style={{
                fontSize: 11, color: 'var(--color-danger)', marginBottom: 10, lineHeight: 1.5,
                background: 'var(--color-bg)', borderRadius: 6, padding: '6px 8px',
              }}>
                ⚠️ Laporan ini akan membuka sengketa resmi. Escrow Officer akan meninjau dan menyelesaikan.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setShowProblem(false); setProblemReason(''); }} style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, background: 'transparent',
                  border: '1.5px solid #c62828', color: 'var(--color-danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Batal</button>
                <button type="button" disabled={!problemReason.trim() || saving}
                  onClick={() => {
                    if (!problemReason.trim()) return;
                    setSaving(true);
                    onReportProblem(problemReason.trim());

                    setSaving(false);
                  }}
                  style={{
                    flex: 2, padding: '9px 0', borderRadius: 8,
                    background: problemReason.trim() ? 'var(--color-danger)' : 'var(--color-border)',
                    color: '#fff', border: 'none', fontSize: 12, fontWeight: 700,
                    cursor: problemReason.trim() ? 'pointer' : 'default',
                  }}
                >
                  {saving ? 'Memproses…' : '⚠ Laporkan & Buka Sengketa'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isEscrow && !isBuyer && (
        <InfoNote icon="⏳" msg="Menunggu konfirmasi penerimaan dari Buyer. Dana tidak dapat dirilis sebelum Buyer mengkonfirmasi." color="var(--color-escrow)" />
      )}
      {!isBuyer && !isEscrow && (
        <InfoNote icon="⏳" msg="Menunggu Buyer mengkonfirmasi penerimaan barang/ternak." />
      )}
    </div>
  );
}

// ── ExternalEscrowPanel ───────────────────────────────────────────────────────
// Record / display external escrow company details + config timeline.
function ExternalEscrowPanel({
  chatId,
  activeWorkspaceId,
  escrowConfig,
  inputStyle,
  labelStyle,
  onSaved,
}: {
  chatId: string;
  activeWorkspaceId: string;
  escrowConfig: EscrowConfigRecord;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onSaved: () => void;
}) {
  const existing = escrowConfig.externalDetails;
  const [editing,  setEditing]  = useState(!existing);
  const [company,  setCompany]  = useState(existing?.company ?? '');
  const [officer,  setOfficer]  = useState(existing?.officerName ?? '');
  const [refNum,   setRefNum]   = useState(existing?.referenceNumber ?? '');
  const [phone,    setPhone]    = useState(existing?.phone ?? '');
  const [notes,    setNotes]    = useState(existing?.notes ?? '');
  const [saving,   setSaving]   = useState(false);

  const BULAN_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  function fmtDate(iso: string) { const d = new Date(iso); return `${d.getDate()} ${BULAN_SHORT[d.getMonth()]} ${d.getFullYear()}`; }

  function handleSave() {
    if (!company.trim()) return;
    setSaving(true);
      updateExternalEscrowDetails(chatId, {
        company: company.trim(), officerName: officer.trim(),
        referenceNumber: refNum.trim(), phone: phone.trim(), notes: notes.trim(),
      }, activeWorkspaceId);
      setSaving(false); setEditing(false); onSaved();
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        background: 'rgba(217,119,6,0.07)', border: '1.5px solid rgba(217,119,6,0.25)',
        borderRadius: 8, padding: '10px 12px', marginBottom: 14,
        fontSize: 12, color: 'var(--color-warning)', lineHeight: 1.5,
      }}>
        🏢 Escrow pihak ketiga. Catat detail layanan untuk audit trail.
        Dana <strong>tidak dikelola</strong> oleh TernakHub dalam mode ini.
      </div>

      {existing && !editing && (
        <div style={{
          background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
          borderRadius: 8, padding: '12px 14px', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>📋 Detail Escrow Eksternal</div>
            <button type="button" onClick={() => setEditing(true)} style={{
              padding: '4px 10px', borderRadius: 6, background: 'transparent',
              border: '1px solid var(--color-border)', fontSize: 11, color: 'var(--color-muted)', cursor: 'pointer',
            }}>Ubah</button>
          </div>
          {[
            { label: 'Perusahaan',    value: existing.company },
            { label: 'Officer / PIC', value: existing.officerName || '—' },
            { label: 'No. Referensi', value: existing.referenceNumber || '—' },
            { label: 'Telepon',       value: existing.phone || '—' },
            { label: 'Catatan',       value: existing.notes || '—' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '5px 0', borderBottom: '1px solid var(--color-border)',
            }}>
              <span style={{ fontSize: 11, color: 'var(--color-muted)', flexShrink: 0, marginRight: 8 }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, color: 'var(--color-text)' }}>
            Catat Detail Escrow Eksternal
          </div>
          {[
            { label: 'Nama Perusahaan Escrow *', value: company,  setter: setCompany,  ph: 'Mis. Tokopedia Rekber, PayLater…' },
            { label: 'Nama Officer / PIC',       value: officer,  setter: setOfficer,  ph: 'Nama petugas yang menangani' },
            { label: 'Nomor Referensi',          value: refNum,   setter: setRefNum,   ph: 'No. order/referensi dari layanan eksternal' },
            { label: 'No. Telepon Layanan',      value: phone,    setter: setPhone,    ph: 'Telepon customer service' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 10 }}>
              <label style={labelStyle}>{f.label}</label>
              <input type="text" value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.ph} style={inputStyle} />
            </div>
          ))}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Catatan Tambahan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Catatan tambahan…" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {existing && (
              <button type="button" onClick={() => setEditing(false)} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, background: 'transparent',
                border: '1.5px solid var(--color-border)', color: 'var(--color-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Batal</button>
            )}
            <button type="button" onClick={handleSave} disabled={!company.trim() || saving} style={{
              flex: 2, padding: '10px 0', borderRadius: 8,
              background: company.trim() ? 'var(--color-warning)' : 'var(--color-border)',
              color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
              cursor: company.trim() ? 'pointer' : 'default',
            }}>
              {saving ? 'Menyimpan…' : '🏢 Simpan Detail Escrow'}
            </button>
          </div>
        </div>
      )}

      {escrowConfig.timeline.length > 0 && (
        <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', marginTop: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Riwayat Perubahan
          </div>
          {escrowConfig.timeline.slice().reverse().map(ev => (
            <div key={ev.id} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.4 }}>
              <span style={{ flexShrink: 0 }}>🏢</span>
              <div>
                <div style={{ color: 'var(--color-text)', fontWeight: 600 }}>{ev.description}</div>
                <div>{ev.actorName} · {fmtDate(ev.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── DirectPaymentPanel ────────────────────────────────────────────────────────
// Informational panel + warning for direct payment mode.
function DirectPaymentPanel({
  chatId: _chatId,
  activeWorkspaceId: _activeWorkspaceId,
  escrowConfig,
}: {
  chatId: string;
  activeWorkspaceId: string;
  escrowConfig: EscrowConfigRecord;
}) {
  const BULAN_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  function fmtDate(iso: string) { const d = new Date(iso); return `${d.getDate()} ${BULAN_SHORT[d.getMonth()]} ${d.getFullYear()}`; }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        background: 'rgba(22,163,74,0.07)', border: '1.5px solid rgba(22,163,74,0.25)',
        borderRadius: 8, padding: '12px 14px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)', marginBottom: 6 }}>💸 Pembayaran Langsung Dipilih</div>
        <div style={{ fontSize: 12, color: 'var(--color-primary-dark)', lineHeight: 1.5 }}>
          Buyer dan Seller setuju melakukan pembayaran secara langsung tanpa perantara escrow.
        </div>
      </div>
      <div style={{
        background: 'rgba(245,124,0,0.07)', border: '1.5px solid rgba(245,124,0,0.3)',
        borderRadius: 8, padding: '10px 12px', marginBottom: 12,
        fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5,
      }}>
        ⚠️ <strong>Perhatian:</strong> Tanpa escrow, tidak ada perlindungan otomatis untuk dana.
        TernakHub tidak bertanggung jawab atas sengketa dari pembayaran langsung.
      </div>

      {escrowConfig.timeline.length > 0 && (
        <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Riwayat Konfigurasi
          </div>
          {escrowConfig.timeline.slice().reverse().map(ev => (
            <div key={ev.id} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.4 }}>
              <span style={{ flexShrink: 0 }}>💸</span>
              <div>
                <div style={{ color: 'var(--color-text)', fontWeight: 600 }}>{ev.description}</div>
                <div>{ev.actorName} · {fmtDate(ev.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── EscrowAIPanel ─────────────────────────────────────────────────────────────
// Rules-based role-aware guidance. Role props default to false (generic fallback).
// Never takes action automatically.
function EscrowAIPanel({
  status,
  escrowConfigType: _escrowConfigType,
  chatId: _chatId,
  isBuyer = false,
  isEscrow = false,
  isSeller = false,
}: {
  status: EscrowWorkflowStatus | null;
  escrowConfigType: EscrowConfigType;
  chatId: string;
  isBuyer?: boolean;
  isEscrow?: boolean;
  isSeller?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Participants who are none of the above are service participants (e.g. Transport)
  const isTransport = !isBuyer && !isEscrow && !isSeller && status !== null;

  const suggestions: { icon: string; title: string; body: string }[] = [];

  if (!status) {
    if (isEscrow)      suggestions.push({ icon: '🏦', title: 'Aktifkan Layanan Escrow', body: 'Anda telah bergabung sebagai Escrow. Klik "Aktifkan Layanan Escrow" untuk memulai alur pembayaran yang dilindungi.' });
    else if (isBuyer)  suggestions.push({ icon: '⏳', title: 'Menunggu Escrow Aktif', body: 'Escrow Officer perlu mengaktifkan layanan terlebih dahulu. Anda akan diberitahu saat instruksi pembayaran siap.' });
    else if (isSeller) suggestions.push({ icon: '⏳', title: 'Menunggu Escrow Aktif', body: 'Escrow belum diaktifkan. Tunggu proses inisiasi oleh Escrow Officer sebelum transaksi dapat dilanjutkan.' });
    else suggestions.push({ icon: '💡', title: 'Mulai Proses Escrow', body: 'Setelah Escrow bergabung, klik "Aktifkan Layanan Escrow" untuk memulai alur pembayaran yang dilindungi.' });
  } else {
    if (status === 'Waiting Assignment') {
      if (isEscrow)      suggestions.push({ icon: '🚀', title: 'Mulai Penugasan Escrow', body: 'Tekan "Mulai Proses Escrow" untuk memulai dan membuat instruksi pembayaran bagi Buyer.' });
      else if (isBuyer)  suggestions.push({ icon: '⏳', title: 'Menunggu Escrow Memulai', body: 'Escrow Officer sedang menyiapkan proses. Anda akan mendapat instruksi pembayaran segera.' });
      else if (isSeller) suggestions.push({ icon: '⏳', title: 'Escrow Sedang Memulai', body: 'Tunggu Escrow Officer memulai penugasan. Tidak ada tindakan yang diperlukan saat ini.' });
      else suggestions.push({ icon: '⏳', title: 'Tunggu Escrow Memulai', body: 'Escrow Officer perlu menekan "Mulai Proses Escrow" untuk melanjutkan ke instruksi pembayaran.' });
    }
    if (status === 'Waiting Payment Instruction') {
      if (isEscrow)      suggestions.push({ icon: '📋', title: 'Buat Instruksi Pembayaran', body: 'Pilih rekening escrow resmi, tentukan siapa yang menanggung fee, lalu buat instruksi untuk Buyer.' });
      else if (isBuyer)  suggestions.push({ icon: '📋', title: 'Instruksi Sedang Disiapkan', body: 'Pastikan semua quotasi layanan terkunci. Escrow sedang menyiapkan instruksi transfer untuk Anda.' });
      else if (isSeller) suggestions.push({ icon: '⏳', title: 'Escrow Menyiapkan Instruksi', body: 'Escrow sedang membuat instruksi pembayaran untuk Buyer. Tidak ada tindakan dari Seller saat ini.' });
      else suggestions.push({ icon: '📋', title: 'Quotasi Harus Terkunci', body: 'Pastikan semua quotasi layanan sudah Terkunci sebelum Escrow dapat membuat instruksi pembayaran.' });
    }
    if (status === 'Waiting Buyer Payment') {
      if (isBuyer) {
        suggestions.push({ icon: '💳', title: 'Transfer Tepat Sesuai Instruksi', body: 'Transfer sesuai jumlah pada instruksi (termasuk fee jika ditanggung Buyer). Pastikan ke rekening escrow resmi.' });
        suggestions.push({ icon: '📸', title: 'Unggah Bukti Transfer', body: 'Screenshot bukti transfer, pastikan nama rekening tujuan, jumlah, dan tanggal terlihat jelas, lalu unggah.' });
      } else if (isEscrow) {
        suggestions.push({ icon: '⏳', title: 'Menunggu Buyer Transfer', body: 'Buyer sedang melakukan transfer. Anda akan diminta memverifikasi bukti setelah Buyer mengunggahnya.' });
      } else if (isSeller) {
        suggestions.push({ icon: '⏳', title: 'Menunggu Buyer Transfer', body: 'Buyer sedang melakukan pembayaran ke rekening Escrow. Dana akan ditahan hingga pengiriman selesai.' });
      } else {
        suggestions.push({ icon: '💳', title: 'Transfer Tepat Sesuai Instruksi', body: 'Buyer: transfer sesuai jumlah pada instruksi. Jangan ke rekening lain.' });
        suggestions.push({ icon: '📸', title: 'Simpan Bukti Transfer', body: 'Screenshot bukti transfer sebelum diunggah. Pastikan nama rekening tujuan dan jumlah terlihat jelas.' });
      }
    }
    if (status === 'Waiting Verification') {
      if (isEscrow)      suggestions.push({ icon: '🔍', title: 'Verifikasi Bukti Transfer Buyer', body: 'Periksa bukti transfer Buyer: cocokkan nominal, rekening tujuan, dan tanggal. Setujui atau minta unggah ulang.' });
      else if (isBuyer)  suggestions.push({ icon: '🔍', title: 'Bukti Sedang Diverifikasi', body: 'Escrow Officer sedang memeriksa bukti transfer Anda. Proses biasanya selesai dalam 1×24 jam.' });
      else if (isSeller) suggestions.push({ icon: '🔍', title: 'Verifikasi Sedang Berlangsung', body: 'Escrow memverifikasi pembayaran Buyer. Dana akan ditahan setelah verifikasi berhasil.' });
      else suggestions.push({ icon: '🔍', title: 'Verifikasi Oleh Escrow', body: 'Escrow Officer mengecek bukti dengan data rekening resmi. Proses biasanya selesai dalam 1×24 jam.' });
    }
    if (status === 'Holding Funds') {
      if (isEscrow) {
        suggestions.push({ icon: '🚚', title: 'Mulai Monitoring Pengiriman', body: 'Tekan "Mulai Monitoring Pengiriman" untuk memantau status pengiriman sebelum dana dapat dirilis ke Seller.' });
        suggestions.push({ icon: '🔐', title: 'Delivery Gate Aktif', body: 'Dana hanya bisa dirilis setelah pengiriman selesai DAN Buyer mengkonfirmasi penerimaan.' });
      } else if (isBuyer) {
        suggestions.push({ icon: '🔐', title: 'Dana Aman Ditahan', body: 'Dana Anda aman di rekening Escrow. Anda akan diminta mengkonfirmasi penerimaan setelah barang tiba.' });
      } else if (isSeller) {
        suggestions.push({ icon: '📦', title: 'Siapkan Pengiriman', body: 'Dana sudah aman di Escrow. Pastikan pengiriman berjalan lancar dan upload bukti pengiriman di tab Transport.' });
      } else {
        suggestions.push({ icon: '🔐', title: 'Dana Aman Ditahan', body: 'Dana Buyer ditahan oleh Escrow. Lanjutkan proses pengiriman. Escrow akan memulai monitoring sebelum dana dirilis.' });
      }
    }
    if (status === 'Waiting Delivery') {
      if (isEscrow) {
        suggestions.push({ icon: '🚚', title: 'Pantau Tab Transport', body: 'Tombol "Minta Konfirmasi Buyer" aktif setelah status pengiriman = Terkirim / Selesai. Pantau tab Transport.' });
        suggestions.push({ icon: '📍', title: 'Delivery Gate Aktif', body: 'Dana tidak dapat dirilis sebelum pengiriman selesai DAN Buyer mengkonfirmasi penerimaan.' });
      } else if (isBuyer) {
        suggestions.push({ icon: '🚚', title: 'Pantau Status Pengiriman', body: 'Pantau tab Transport untuk status terkini. Anda akan diminta mengkonfirmasi penerimaan setelah barang tiba.' });
      } else if (isSeller) {
        suggestions.push({ icon: '📦', title: 'Upload Bukti Pengiriman', body: 'Upload bukti pengiriman (foto, resi, GPS) di tab Transport untuk mempercepat proses konfirmasi Buyer.' });
      } else if (isTransport) {
        suggestions.push({ icon: '🚚', title: 'Upload Bukti Pickup & Delivery', body: 'Upload bukti pengambilan dan pengiriman di tab Transport. Dibutuhkan sebelum escrow dapat merilis dana.' });
        suggestions.push({ icon: '📍', title: 'Update Status Secara Berkala', body: 'Perbarui status pengiriman secara real-time agar Escrow dapat memantau progress dan Buyer bersiap menerima.' });
      } else {
        suggestions.push({ icon: '🚚', title: 'Monitor Tab Transport', body: 'Pantau tab Transport untuk status terkini. Tombol "Minta Konfirmasi Buyer" aktif setelah status = Terkirim.' });
      }
    }
    if (status === 'Waiting Buyer Confirmation') {
      if (isBuyer) {
        suggestions.push({ icon: '📍', title: 'Periksa Kondisi Barang / Ternak', body: 'Pastikan barang/ternak yang Anda terima sesuai ekspektasi. Klik "Diterima" untuk merilis dana ke Seller.' });
        suggestions.push({ icon: '⚠️', title: 'Jika Ada Masalah', body: 'Gunakan "Laporkan Masalah" untuk membuka sengketa resmi. Escrow akan meminta bukti dari kedua pihak.' });
      } else if (isEscrow) {
        suggestions.push({ icon: '📍', title: 'Menunggu Konfirmasi Buyer', body: 'Buyer sedang memeriksa kondisi barang. Dana tidak dapat dirilis sampai Buyer mengkonfirmasi penerimaan.' });
      } else if (isSeller) {
        suggestions.push({ icon: '⏳', title: 'Menunggu Konfirmasi Buyer', body: 'Buyer sedang memeriksa barang/ternak yang diterima. Dana akan dirilis setelah konfirmasi berhasil.' });
      } else {
        suggestions.push({ icon: '📍', title: 'Buyer: Periksa Kondisi Barang', body: 'Konfirmasi jika sesuai ekspektasi, atau gunakan tombol "Laporkan Masalah" untuk membuka sengketa resmi.' });
      }
    }
    if (status === 'Ready To Release') {
      if (isEscrow)      suggestions.push({ icon: '💸', title: 'Rilis Dana ke Seller', body: 'Buyer sudah mengkonfirmasi penerimaan. Masukkan nomor referensi transfer dan proses pelepasan dana ke Seller.' });
      else if (isBuyer)  suggestions.push({ icon: '✅', title: 'Konfirmasi Berhasil', body: 'Terima kasih sudah mengkonfirmasi penerimaan. Escrow akan segera merilis dana ke Seller.' });
      else if (isSeller) suggestions.push({ icon: '✅', title: 'Dana Akan Segera Dirilis', body: 'Buyer mengkonfirmasi penerimaan barang. Escrow sedang memproses pelepasan dana ke akun Anda.' });
      else suggestions.push({ icon: '✅', title: 'Siap Dirilis', body: 'Buyer mengkonfirmasi penerimaan. Escrow dapat merilis dana ke Seller dengan nomor referensi transfer.' });
    }
    if (status === 'Disputed') {
      if (isEscrow) {
        suggestions.push({ icon: '📁', title: 'Kumpulkan Bukti dari Kedua Pihak', body: 'Gunakan "Minta Bukti" / "Minta Klarifikasi" untuk meminta dokumen, foto, atau penjelasan dari Buyer dan Seller.' });
        suggestions.push({ icon: '⚖️', title: 'Putuskan Penyelesaian', body: 'Setelah bukti lengkap, pilih: Rilis Dana ke Seller atau Refund ke Buyer berdasarkan fakta yang ada.' });
      } else if (isBuyer) {
        suggestions.push({ icon: '📁', title: 'Siapkan Bukti Anda', body: 'Escrow mungkin meminta bukti kondisi barang, foto, atau penjelasan. Siapkan dokumentasi yang mendukung klaim Anda.' });
      } else if (isSeller) {
        suggestions.push({ icon: '📁', title: 'Siapkan Bukti Pengiriman', body: 'Escrow mungkin meminta resi, foto kondisi saat pengiriman, atau bukti lain. Siapkan dokumentasi yang lengkap.' });
      } else {
        suggestions.push({ icon: '📁', title: 'Kumpulkan Bukti', body: 'Escrow dapat meminta bukti: foto kondisi, bukti pembayaran, screenshot chat — untuk mendukung penyelesaian yang adil.' });
        suggestions.push({ icon: '⚖️', title: 'Keputusan Escrow', body: 'Escrow berwenang memutuskan: Rilis ke Seller atau Refund ke Buyer berdasarkan bukti yang dikumpulkan.' });
      }
    }
    if (status === 'Released') {
      if (isBuyer)       suggestions.push({ icon: '🎉', title: 'Transaksi Selesai', body: 'Transaksi berhasil diselesaikan. Berikan ulasan untuk Seller agar meningkatkan kepercayaan di marketplace.' });
      else if (isSeller) suggestions.push({ icon: '🎉', title: 'Dana Telah Dirilis', body: 'Dana telah berhasil ditransfer ke Anda. Berikan ulasan untuk Buyer untuk membangun kepercayaan.' });
      else suggestions.push({ icon: '🎉', title: 'Transaksi Selesai', body: 'Dana berhasil dirilis ke Seller. Berikan ulasan untuk meningkatkan kepercayaan marketplace.' });
    }
    if (status === 'Refunded') {
      if (isBuyer)       suggestions.push({ icon: '↩️', title: 'Dana Dikembalikan', body: 'Dana telah dikembalikan ke akun Anda. Anda dapat memulai transaksi baru jika masih berminat.' });
      else if (isSeller) suggestions.push({ icon: '↩️', title: 'Refund Diproses', body: 'Dana dikembalikan ke Buyer. Tinjau kondisi listing Anda sebelum menerima pembeli berikutnya.' });
      else suggestions.push({ icon: '↩️', title: 'Dana Dikembalikan', body: 'Dana dikembalikan ke Buyer. Buyer dapat memulai transaksi baru jika masih berminat.' });
    }
    if (status === 'Cancelled') suggestions.push({ icon: '🚫', title: 'Escrow Dibatalkan', body: 'Proses escrow dihentikan. Hubungi support TernakHub jika ada pertanyaan mengenai transaksi ini.' });
  }

  if (suggestions.length === 0) return null;

  return (
    <div style={{ marginBottom: 14 }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderRadius: 8, cursor: 'pointer', border: 'none',
        background: 'rgba(124,58,237,0.06)', marginBottom: open ? 8 : 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-escrow)' }}>🤖 Panduan AI Escrow</span>
        <span style={{ fontSize: 11, color: 'var(--color-escrow)', opacity: 0.7 }}>{open ? '▲ Sembunyikan' : `▼ ${suggestions.length} saran`}</span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 4 }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{
              background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.15)',
              borderRadius: 7, padding: '8px 10px', display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-escrow)', marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--color-escrow)', lineHeight: 1.5, opacity: 0.9 }}>{s.body}</div>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'var(--color-muted)', textAlign: 'center', marginTop: 4, lineHeight: 1.5 }}>
            🤖 AI hanya memberikan panduan. Semua keputusan keuangan dilakukan oleh Escrow Officer.
          </div>
        </div>
      )}
    </div>
  );
}

function InfoNote({ icon, msg, color = 'var(--color-muted)' }: { icon: string; msg: string; color?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      background: 'var(--color-bg)', border: '1px solid var(--color-border)',
      borderRadius: 8, padding: '10px 12px', marginBottom: 12,
      fontSize: 12.5, color, lineHeight: 1.5,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <span>{msg}</span>
    </div>
  );
}

function EscrowFeeSummary({ workflow }: { workflow: EscrowWorkflowRecord }) {
  const { dealTotal, escrowFee, feePayer } = workflow;
  const buyerTotal  = feePayer === 'Buyer'  ? dealTotal + escrowFee : dealTotal;
  const sellerTotal = feePayer === 'Seller' ? dealTotal - escrowFee : dealTotal;

  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 12px', marginBottom: 12,
    }}>
      <div style={{
        fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
      }}>Ringkasan Biaya</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        {[
          { label: 'Total Deal', value: `Rp ${dealTotal.toLocaleString('id-ID')}` },
          { label: 'Escrow Fee (2.5%)', value: `Rp ${escrowFee.toLocaleString('id-ID')}` },
          { label: 'Dibayar Buyer', value: `Rp ${buyerTotal.toLocaleString('id-ID')}`, accent: true },
          { label: 'Diterima Seller', value: `Rp ${sellerTotal.toLocaleString('id-ID')}`, accent: true },
        ].map(row => (
          <div key={row.label} style={{
            background: 'var(--color-surface)', borderRadius: 6,
            padding: '7px 10px', border: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 1 }}>{row.label}</div>
            <div style={{
              fontSize: 12.5, fontWeight: 700,
              color: row.accent ? 'var(--color-escrow)' : 'var(--color-text)',
            }}>{row.value}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>
        Fee ditanggung oleh: <strong>{feePayer === 'Buyer' ? 'Pembeli' : 'Penjual'}</strong>
        {' · '}Min Rp {ESCROW_FEE_MIN.toLocaleString('id-ID')} · Maks Rp {ESCROW_FEE_MAX.toLocaleString('id-ID')}
      </div>
    </div>
  );
}

function EscrowStartPanel({ workflow: _w, onAction }: { workflow: EscrowWorkflowRecord; onAction: () => void }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        background: 'rgba(124,58,237,0.06)', border: '1.5px solid rgba(124,58,237,0.25)',
        borderRadius: 8, padding: '10px 12px', marginBottom: 10,
        fontSize: 12, color: 'var(--color-escrow)', lineHeight: 1.5,
      }}>
        🏦 Anda adalah Escrow untuk transaksi ini. Klik tombol di bawah untuk memulai dan membuat instruksi pembayaran.
      </div>
      <button
        type="button" onClick={onAction}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 8,
          background: 'var(--color-escrow)', color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >🚀 Mulai Proses Escrow</button>
    </div>
  );
}

function PaymentInstructionForm({
  workflow,
  chatId: _chatId,
  inputStyle,
  labelStyle,
  onSubmit,
}: {
  workflow: EscrowWorkflowRecord;
  chatId: string;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onSubmit: (buyerBankName: string, escrowAccountId: string, feePayer: EscrowFeePayer) => void;
}) {
  const accounts = getActiveEscrowAccounts();
  const [buyerBank,    setBuyerBank]    = useState(BUYER_BANK_OPTIONS[0]);
  const [accountId,    setAccountId]    = useState(accounts[0]?.id ?? '');
  const [feePayer,     setFeePayer]     = useState<EscrowFeePayer>('Buyer');
  const [saving,       setSaving]       = useState(false);

  const selectedAccount = accounts.find(a => a.id === accountId);
  const amountToTransfer = feePayer === 'Buyer'
    ? workflow.dealTotal + calculateEscrowFee(workflow.dealTotal)
    : workflow.dealTotal;

  function handleSubmit() {
    if (!accountId) return;
    setSaving(true);
    onSubmit(buyerBank, accountId, feePayer);

    setSaving(false);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
      }}>
        📋 Buat Instruksi Pembayaran
      </div>

      {/* Buyer bank picker */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Bank Transfer Buyer</label>
        <select
          value={buyerBank}
          onChange={e => setBuyerBank(e.target.value)}
          style={{ ...inputStyle, appearance: 'none' }}
        >
          {BUYER_BANK_OPTIONS.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
          Bank yang akan digunakan Buyer untuk transfer
        </div>
      </div>

      {/* Official escrow account picker */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Rekening Escrow Resmi</label>
        {accounts.map(acc => (
          <button
            key={acc.id}
            type="button"
            onClick={() => setAccountId(acc.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '9px 12px', marginBottom: 6,
              background: accountId === acc.id ? 'rgba(124,58,237,0.08)' : 'var(--color-bg)',
              border: `1.5px solid ${accountId === acc.id ? 'var(--color-escrow)' : 'var(--color-border)'}`,
              borderRadius: 10, cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{acc.bankIcon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
                {acc.bankName} · {acc.accountNumber}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{acc.accountHolder}</div>
            </div>
            {/* Official Escrow Badge */}
            <span style={{
              fontSize: 9, fontWeight: 700, color: 'var(--color-escrow)',
              background: 'rgba(124,58,237,0.1)', borderRadius: 4,
              padding: '2px 6px', flexShrink: 0, whiteSpace: 'nowrap',
            }}>✓ Rekening Resmi</span>
          </button>
        ))}
      </div>

      {/* Fee payer */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Siapa yang Menanggung Fee Escrow?</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['Buyer', 'Seller'] as EscrowFeePayer[]).map(fp => (
            <button
              key={fp} type="button"
              onClick={() => setFeePayer(fp)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                border: '1.5px solid',
                borderColor: feePayer === fp ? 'var(--color-escrow)' : 'var(--color-border)',
                background: feePayer === fp ? 'rgba(124,58,237,0.1)' : 'var(--color-bg)',
                color: feePayer === fp ? 'var(--color-escrow)' : 'var(--color-muted)',
                cursor: 'pointer',
              }}
            >
              {fp === 'Buyer' ? '🛒 Pembeli' : '🏪 Penjual'}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {selectedAccount && (
        <div style={{
          background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 8, padding: '8px 12px', marginBottom: 12,
          fontSize: 11.5, color: 'var(--color-escrow)', lineHeight: 1.7,
        }}>
          <div>Buyer transfer dari <strong>{buyerBank}</strong> ke rekening:</div>
          <div><strong>{selectedAccount.bankName}</strong> · {selectedAccount.accountNumber}</div>
          <div>a.n. <strong>{selectedAccount.accountHolder}</strong></div>
          <div style={{ marginTop: 4 }}>
            Jumlah transfer: <strong>Rp {amountToTransfer.toLocaleString('id-ID')}</strong>
          </div>
        </div>
      )}

      <button
        type="button" onClick={handleSubmit} disabled={!accountId || saving}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 8,
          background: accountId ? 'var(--color-escrow)' : 'var(--color-border)',
          color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
          cursor: accountId ? 'pointer' : 'default',
        }}
      >
        {saving ? 'Menyimpan…' : '📋 Buat Instruksi Pembayaran'}
      </button>
    </div>
  );
}

function PaymentInstructionCard({
  instruction,
  account,
  dealTotal,
  escrowFee,
}: {
  instruction: { buyerBankName: string; amountToTransfer: number; feePayer: EscrowFeePayer };
  account: EscrowOfficialAccount;
  dealTotal: number;
  escrowFee: number;
}) {
  return (
    <div style={{
      background: 'rgba(37,99,235,0.06)',
      border: '1.5px solid rgba(37,99,235,0.25)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 14px', marginBottom: 12,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
      }}>
        <span style={{ fontSize: 20 }}>{account.bankIcon}</span>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
            Instruksi Pembayaran
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
            Transfer dari <strong>{instruction.buyerBankName}</strong>
          </div>
        </div>
        <span style={{
          marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: 'var(--color-escrow)',
          background: 'rgba(124,58,237,0.1)', borderRadius: 4, padding: '2px 6px',
        }}>✓ Rekening Resmi Escrow</span>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {[
          { label: 'Bank Tujuan',     value: account.bankName },
          { label: 'No. Rekening',    value: account.accountNumber },
          { label: 'Atas Nama',       value: account.accountHolder },
          { label: 'Jumlah Transfer', value: `Rp ${instruction.amountToTransfer.toLocaleString('id-ID')}` },
        ].map(row => (
          <div key={row.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--color-surface)', borderRadius: 6,
            padding: '6px 10px', border: '1px solid rgba(37,99,235,0.15)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{row.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>{row.value}</span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 8, fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.5,
      }}>
        Fee ({instruction.feePayer === 'Buyer' ? 'Rp ' + escrowFee.toLocaleString('id-ID') + ' sudah termasuk di jumlah transfer' : 'ditanggung Penjual dari penerimaan'})
        · Jangan transfer ke rekening lain selain yang tertera.
      </div>
    </div>
  );
}

function BuyerPaymentProofForm({
  inputStyle,
  labelStyle,
  onSubmit,
}: {
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onSubmit: (imageEmoji: string, transferDate: string, amount: number, note: string | null) => void;
}) {
  const [selectedEmoji, setSelectedEmoji] = useState('🧾');
  const [showPicker,    setShowPicker]    = useState(false);
  const [transferDate,  setTransferDate]  = useState(new Date().toISOString().slice(0, 10));
  const [amountRaw,     setAmountRaw]     = useState('');
  const [note,          setNote]          = useState('');
  const [saving,        setSaving]        = useState(false);

  const parsedAmount = parseInt(amountRaw.replace(/\D/g, ''), 10) || 0;
  const canSubmit = !!selectedEmoji && !!transferDate && parsedAmount > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    onSubmit(selectedEmoji, transferDate, parsedAmount, note.trim() || null);

    setSaving(false);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
      }}>💳 Unggah Bukti Transfer</div>

      {/* Image picker */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Foto / Screenshot Bukti Transfer</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 10, fontSize: 30,
            background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {selectedEmoji}
          </div>
          <button
            type="button" onClick={() => setShowPicker(s => !s)}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 8,
              background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
              fontSize: 12, color: 'var(--color-text)', cursor: 'pointer', textAlign: 'left',
            }}
          >
            {showPicker ? 'Tutup Pemilih' : 'Pilih Gambar Bukti →'}
          </button>
        </div>
        {showPicker && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TRANSFER_IMAGE_PRESETS.map(emoji => (
              <button
                key={emoji} type="button"
                onClick={() => { setSelectedEmoji(emoji); setShowPicker(false); }}
                style={{
                  width: 42, height: 42, fontSize: 22, borderRadius: 8,
                  background: selectedEmoji === emoji ? 'rgba(37,99,235,0.12)' : 'var(--color-bg)',
                  border: `1.5px solid ${selectedEmoji === emoji ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >{emoji}</button>
            ))}
          </div>
        )}
      </div>

      {/* Transfer date */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Tanggal Transfer</label>
        <input
          type="date" value={transferDate}
          onChange={e => setTransferDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Amount — required */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Jumlah Transfer (Rp) *</label>
        <input
          type="number" value={amountRaw} min="1"
          onChange={e => setAmountRaw(e.target.value)}
          placeholder="Contoh: 15750000"
          style={inputStyle}
        />
        {amountRaw !== '' && parsedAmount <= 0 && (
          <div style={{ fontSize: 10.5, color: 'var(--color-danger)', marginTop: 4 }}>
            Jumlah harus lebih dari 0
          </div>
        )}
      </div>

      {/* Optional note */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Catatan (opsional)</label>
        <textarea
          value={note} onChange={e => setNote(e.target.value)}
          rows={2} placeholder="Tambahkan catatan jika ada…"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <button
        type="button" onClick={handleSubmit}
        disabled={!canSubmit || saving}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 8,
          background: canSubmit ? 'var(--color-primary)' : 'var(--color-border)',
          color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
          cursor: canSubmit ? 'pointer' : 'default',
        }}
      >
        {saving ? 'Mengunggah…' : '📤 Kirim Bukti Transfer'}
      </button>
    </div>
  );
}

function BuyerProofCard({ proof }: { proof: NonNullable<EscrowWorkflowRecord['buyerPaymentProof']> }) {
  const d = new Date(proof.uploadedAt);
  const BULAN_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const fmtUploaded = `${d.getDate()} ${BULAN_SHORT[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  return (
    <div style={{
      background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 12,
    }}>
      <div style={{
        fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
      }}>Bukti Transfer dari Buyer</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 10, fontSize: 30,
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {proof.imageEmoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text)', marginBottom: 4 }}>
            Tanggal transfer: <strong>{proof.transferDate}</strong>
          </div>
          {proof.amount > 0 && (
            <div style={{ fontSize: 12, color: 'var(--color-text)', marginBottom: 4 }}>
              Jumlah: <strong>Rp {proof.amount.toLocaleString('id-ID')}</strong>
            </div>
          )}
          {proof.note && (
            <div style={{ fontSize: 12, color: 'var(--color-text)', marginBottom: 4 }}>
              Catatan: {proof.note}
            </div>
          )}
          <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
            Diunggah: {fmtUploaded}
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationPanel({
  inputStyle,
  labelStyle,
  onAction,
}: {
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onAction: (action: VerificationAction, note: string | null) => void;
}) {
  const [selectedAction, setSelectedAction] = useState<VerificationAction>('Approve');
  const [note,    setNote]    = useState('');
  const [saving,  setSaving]  = useState(false);

  const requiresNote = selectedAction !== 'Approve';

  function handleSubmit() {
    if (requiresNote && !note.trim()) return;
    setSaving(true);
    onAction(selectedAction, note.trim() || null);

    setSaving(false);
  }

  const actionConfig: Record<VerificationAction, { color: string; icon: string; label: string }> = {
    Approve:         { color: 'var(--color-success)', icon: '✅', label: 'Setujui' },
    Reject:          { color: 'var(--color-danger)', icon: '❌', label: 'Tolak' },
    'Request Reupload': { color: 'var(--color-warning)', icon: '🔄', label: 'Minta Unggah Ulang' },
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
      }}>🔍 Verifikasi Bukti Transfer</div>

      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Tindakan</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(Object.entries(actionConfig) as [VerificationAction, typeof actionConfig[VerificationAction]][]).map(([action, cfg]) => (
            <button
              key={action} type="button"
              onClick={() => setSelectedAction(action)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                border: `1.5px solid ${selectedAction === action ? cfg.color : 'var(--color-border)'}`,
                background: selectedAction === action ? `${cfg.color}15` : 'var(--color-bg)',
                color: selectedAction === action ? cfg.color : 'var(--color-muted)',
                cursor: 'pointer',
              }}
            >
              {cfg.icon}<br />{cfg.label}
            </button>
          ))}
        </div>
      </div>

      {requiresNote && (
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Catatan{requiresNote ? ' *' : ''}</label>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            rows={2} placeholder="Alasan penolakan atau permintaan ulang…"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      )}

      <button
        type="button" onClick={handleSubmit}
        disabled={(requiresNote && !note.trim()) || saving}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 8,
          background: (!requiresNote || note.trim()) ? actionConfig[selectedAction].color : 'var(--color-border)',
          color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
          cursor: (!requiresNote || note.trim()) ? 'pointer' : 'default',
        }}
      >
        {saving ? 'Menyimpan…' : `${actionConfig[selectedAction].icon} ${actionConfig[selectedAction].label} Pembayaran`}
      </button>
    </div>
  );
}

function ReleaseFundsForm({
  inputStyle,
  labelStyle,
  onSubmit,
  onRefund,
  dealTotal,
}: {
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onSubmit: (referenceNumber: string) => void;
  onRefund: (reason: string, amount: number, referenceNumber: string) => void;
  dealTotal: number;
}) {
  const [refNumber,     setRefNumber]     = useState('');
  const [showRefund,    setShowRefund]    = useState(false);
  const [refundReason,  setRefundReason]  = useState('');
  const [refundRef,     setRefundRef]     = useState('');
  const [refundType,    setRefundType]    = useState<'Full' | 'Partial'>('Full');
  const [partialAmt,    setPartialAmt]    = useState('');
  const [saving,        setSaving]        = useState(false);

  const parsedPartial   = parseInt(partialAmt.replace(/\D/g, ''), 10) || 0;
  const finalRefundAmt  = refundType === 'Full' ? dealTotal : parsedPartial;
  const partialInvalid  = refundType === 'Partial' && (parsedPartial <= 0 || parsedPartial > dealTotal);
  const canRefund       = refundReason.trim() !== '' && refundRef.trim() !== '' && !partialInvalid && finalRefundAmt > 0;

  function handleRelease() {
    if (!refNumber.trim()) return;
    setSaving(true);
    onSubmit(refNumber.trim());

    setSaving(false);
  }

  function handleRefund() {
    if (!canRefund) return;
    setSaving(true);
    onRefund(refundReason.trim(), finalRefundAmt, refundRef.trim());

    setSaving(false);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
      }}>💸 Proses Pelepasan Dana</div>

      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Nomor Referensi Transfer</label>
        <input
          type="text" value={refNumber}
          onChange={e => setRefNumber(e.target.value)}
          placeholder="Nomor referensi dari bank (mis. TXN-BCA-20260718)"
          style={inputStyle}
        />
      </div>

      <button
        type="button" onClick={handleRelease}
        disabled={!refNumber.trim() || saving}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 8, marginBottom: 8,
          background: refNumber.trim() ? 'var(--color-success)' : 'var(--color-border)',
          color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
          cursor: refNumber.trim() ? 'pointer' : 'default',
        }}
      >
        {saving ? 'Memproses…' : '🎉 Rilis Dana ke Seller'}
      </button>

      {!showRefund && (
        <button type="button" onClick={() => setShowRefund(true)} style={{
          width: '100%', padding: '9px 0', borderRadius: 8,
          background: 'transparent', border: '1.5px solid #e65100',
          color: 'var(--color-warning)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>↩️ Kembalikan Dana ke Buyer (Refund)</button>
      )}

      {showRefund && (
        <div style={{
          background: 'rgba(230,81,0,0.06)', border: '1.5px solid rgba(230,81,0,0.3)',
          borderRadius: 8, padding: '12px', marginTop: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-warning)', marginBottom: 8 }}>
            ↩️ Refund ke Buyer
          </div>

          {/* Refund type toggle */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ ...labelStyle, color: 'var(--color-warning)' }}>Tipe Refund</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['Full', 'Partial'] as const).map(t => (
                <button key={t} type="button" onClick={() => setRefundType(t)} style={{
                  flex: 1, padding: '7px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                  border: `1.5px solid ${refundType === t ? 'var(--color-warning)' : 'var(--color-border)'}`,
                  background: refundType === t ? 'rgba(230,81,0,0.1)' : 'var(--color-bg)',
                  color: refundType === t ? 'var(--color-warning)' : 'var(--color-muted)', cursor: 'pointer',
                }}>
                  {t === 'Full' ? `Penuh (Rp ${dealTotal.toLocaleString('id-ID')})` : 'Sebagian'}
                </button>
              ))}
            </div>
          </div>

          {/* Partial amount */}
          {refundType === 'Partial' && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ ...labelStyle, color: 'var(--color-warning)' }}>Jumlah Refund (Rp) *</label>
              <input type="number" value={partialAmt} min="1" max={dealTotal}
                onChange={e => setPartialAmt(e.target.value)}
                placeholder={`Maks. Rp ${dealTotal.toLocaleString('id-ID')}`}
                style={inputStyle} />
              {partialInvalid && partialAmt !== '' && (
                <div style={{ fontSize: 10.5, color: 'var(--color-danger)', marginTop: 4 }}>
                  {parsedPartial <= 0 ? 'Jumlah harus lebih dari 0' : `Tidak boleh melebihi Rp ${dealTotal.toLocaleString('id-ID')}`}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 8 }}>
            <label style={{ ...labelStyle, color: 'var(--color-warning)' }}>Alasan Refund *</label>
            <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)}
              rows={2} placeholder="Alasan pengembalian dana…"
              style={inputStyle} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ ...labelStyle, color: 'var(--color-warning)' }}>Nomor Referensi Refund *</label>
            <input type="text" value={refundRef} onChange={e => setRefundRef(e.target.value)}
              placeholder="Nomor referensi refund"
              style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setShowRefund(false)} style={{
              flex: 1, padding: '9px 0', borderRadius: 8,
              background: 'transparent', border: '1.5px solid #e65100',
              color: 'var(--color-warning)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Batal</button>
            <button type="button" onClick={handleRefund}
              disabled={!canRefund || saving}
              style={{
                flex: 2, padding: '9px 0', borderRadius: 8,
                background: canRefund ? 'var(--color-warning)' : 'var(--color-border)',
                color: '#fff', border: 'none', fontSize: 12, fontWeight: 700,
                cursor: canRefund ? 'pointer' : 'default',
              }}>
              {saving ? 'Memproses…' : `↩️ Refund Rp ${finalRefundAmt.toLocaleString('id-ID')}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FundReleaseCard({ release }: { release: NonNullable<EscrowWorkflowRecord['fundRelease']> }) {
  const d = new Date(release.releasedAt);
  const BULAN_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return (
    <div style={{
      background: 'rgba(22,163,74,0.07)', border: '1.5px solid rgba(22,163,74,0.3)',
      borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 12,
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-success)', marginBottom: 8 }}>🎉 Dana Telah Dirilis</div>
      {[
        { label: 'Waktu Rilis', value: `${d.getDate()} ${BULAN_SHORT[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` },
        { label: 'No. Referensi', value: release.referenceNumber },
      ].map(r => (
        <div key={r.label} style={{ fontSize: 12.5, color: 'var(--color-primary-dark)', marginBottom: 4 }}>
          <span style={{ opacity: 0.75 }}>{r.label}: </span><strong>{r.value}</strong>
        </div>
      ))}
    </div>
  );
}

function RefundCard({ refund }: { refund: NonNullable<EscrowWorkflowRecord['refund']> }) {
  const d = new Date(refund.refundedAt);
  const BULAN_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return (
    <div style={{
      background: 'rgba(230,81,0,0.07)', border: '1.5px solid rgba(230,81,0,0.3)',
      borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 12,
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-warning)', marginBottom: 8 }}>↩️ Dana Dikembalikan</div>
      {[
        { label: 'Alasan',       value: refund.reason },
        { label: 'Jumlah',       value: `Rp ${refund.amount.toLocaleString('id-ID')}` },
        { label: 'Waktu',        value: `${d.getDate()} ${BULAN_SHORT[d.getMonth()]} ${d.getFullYear()}` },
        { label: 'No. Referensi',value: refund.referenceNumber },
      ].map(r => (
        <div key={r.label} style={{ fontSize: 12.5, color: 'var(--color-danger)', marginBottom: 4 }}>
          <span style={{ opacity: 0.75 }}>{r.label}: </span><strong>{r.value}</strong>
        </div>
      ))}
    </div>
  );
}

function DisputeOpenButton({
  chatId,
  activeWorkspaceId,
  inputStyle,
  labelStyle,
  onDone,
}: {
  chatId: string;
  activeWorkspaceId: string;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onDone: () => void;
}) {
  const [show, setShow]     = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  if (!show) {
    return (
      <button type="button" onClick={() => setShow(true)} style={{
        width: '100%', padding: '9px 0', borderRadius: 8, marginBottom: 8,
        background: 'transparent', border: '1.5px solid #c62828',
        color: 'var(--color-danger)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
      }}>⚠️ Buka Sengketa</button>
    );
  }

  return (
    <div style={{
      background: 'rgba(198,40,40,0.06)', border: '1.5px solid rgba(198,40,40,0.3)',
      borderRadius: 8, padding: '12px', marginBottom: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 8 }}>⚠️ Buka Sengketa</div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ ...labelStyle, color: 'var(--color-danger)' }}>Alasan Sengketa *</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          rows={2} placeholder="Jelaskan alasan sengketa…"
          style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setShow(false)} style={{
          flex: 1, padding: '9px 0', borderRadius: 8,
          background: 'transparent', border: '1.5px solid #c62828',
          color: 'var(--color-danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Batal</button>
        <button type="button" onClick={() => {
          if (!reason.trim()) return;
          setSaving(true);
            openDispute(chatId, { reason: reason.trim(), byWorkspaceId: activeWorkspaceId });
            setSaving(false); onDone();
        }}
          disabled={!reason.trim() || saving}
          style={{
            flex: 2, padding: '9px 0', borderRadius: 8,
            background: reason.trim() ? 'var(--color-danger)' : 'var(--color-border)',
            color: '#fff', border: 'none', fontSize: 12, fontWeight: 700,
            cursor: reason.trim() ? 'pointer' : 'default',
          }}>
          {saving ? 'Memproses…' : '⚠️ Buka Sengketa'}
        </button>
      </div>
    </div>
  );
}

function RefundButton({
  chatId,
  dealTotal,
  activeWorkspaceId,
  inputStyle,
  labelStyle,
  onDone,
}: {
  chatId: string;
  dealTotal: number;
  activeWorkspaceId: string;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onDone: () => void;
}) {
  const [show,        setShow]        = useState(false);
  const [reason,      setReason]      = useState('');
  const [refNum,      setRefNum]      = useState('');
  const [refundType,  setRefundType]  = useState<'Full' | 'Partial'>('Full');
  const [partialAmt,  setPartialAmt]  = useState('');
  const [saving,      setSaving]      = useState(false);

  const parsedPartial  = parseInt(partialAmt.replace(/\D/g, ''), 10) || 0;
  const finalAmount    = refundType === 'Full' ? dealTotal : parsedPartial;
  const partialInvalid = refundType === 'Partial' && (parsedPartial <= 0 || parsedPartial > dealTotal);
  const canSubmit      = reason.trim() !== '' && refNum.trim() !== '' && !partialInvalid && finalAmount > 0;

  if (!show) {
    return (
      <button type="button" onClick={() => setShow(true)} style={{
        width: '100%', padding: '9px 0', borderRadius: 8, marginBottom: 8,
        background: 'transparent', border: '1.5px solid #e65100',
        color: 'var(--color-warning)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
      }}>↩️ Kembalikan Dana ke Buyer</button>
    );
  }

  return (
    <div style={{
      background: 'rgba(230,81,0,0.06)', border: '1.5px solid rgba(230,81,0,0.3)',
      borderRadius: 8, padding: '12px', marginBottom: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-warning)', marginBottom: 8 }}>↩️ Refund ke Buyer</div>

      {/* Refund type toggle */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ ...labelStyle, color: 'var(--color-warning)' }}>Tipe Refund</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['Full', 'Partial'] as const).map(t => (
            <button key={t} type="button" onClick={() => setRefundType(t)} style={{
              flex: 1, padding: '7px 8px', borderRadius: 8, fontSize: 11.5, fontWeight: 700,
              border: `1.5px solid ${refundType === t ? 'var(--color-warning)' : 'var(--color-border)'}`,
              background: refundType === t ? 'rgba(230,81,0,0.1)' : 'var(--color-bg)',
              color: refundType === t ? 'var(--color-warning)' : 'var(--color-muted)', cursor: 'pointer',
            }}>
              {t === 'Full' ? `Penuh (Rp ${dealTotal.toLocaleString('id-ID')})` : 'Sebagian'}
            </button>
          ))}
        </div>
      </div>

      {/* Partial amount */}
      {refundType === 'Partial' && (
        <div style={{ marginBottom: 8 }}>
          <label style={{ ...labelStyle, color: 'var(--color-warning)' }}>Jumlah Refund (Rp) *</label>
          <input type="number" value={partialAmt} min="1" max={dealTotal}
            onChange={e => setPartialAmt(e.target.value)}
            placeholder={`Maks. Rp ${dealTotal.toLocaleString('id-ID')}`}
            style={inputStyle} />
          {partialInvalid && partialAmt !== '' && (
            <div style={{ fontSize: 10.5, color: 'var(--color-danger)', marginTop: 4 }}>
              {parsedPartial <= 0 ? 'Jumlah harus lebih dari 0' : `Tidak boleh melebihi Rp ${dealTotal.toLocaleString('id-ID')}`}
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <label style={{ ...labelStyle, color: 'var(--color-warning)' }}>Alasan *</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          rows={2} placeholder="Alasan pengembalian dana…"
          style={inputStyle} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ ...labelStyle, color: 'var(--color-warning)' }}>No. Referensi Refund *</label>
        <input type="text" value={refNum} onChange={e => setRefNum(e.target.value)}
          placeholder="Nomor referensi" style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setShow(false)} style={{
          flex: 1, padding: '9px 0', borderRadius: 8,
          background: 'transparent', border: '1.5px solid #e65100',
          color: 'var(--color-warning)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Batal</button>
        <button type="button" onClick={() => {
          if (!canSubmit) return;
          setSaving(true);
            refundBuyer(chatId, { reason: reason.trim(), amount: finalAmount, referenceNumber: refNum.trim(), byWorkspaceId: activeWorkspaceId });
            setSaving(false); onDone();
        }}
          disabled={!canSubmit || saving}
          style={{
            flex: 2, padding: '9px 0', borderRadius: 8,
            background: canSubmit ? 'var(--color-warning)' : 'var(--color-border)',
            color: '#fff', border: 'none', fontSize: 12, fontWeight: 700,
            cursor: canSubmit ? 'pointer' : 'default',
          }}>
          {saving ? 'Memproses…' : `↩️ Refund Rp ${finalAmount.toLocaleString('id-ID')}`}
        </button>
      </div>
    </div>
  );
}

// ─── DisputePanel — FARM-FIX-005.8 enhanced ─────────────────────────────────
// Adds: Request Evidence, Request Clarification, shows additional actions log.
function DisputePanel({
  chatId: _chatId,
  dispute,
  additionalActions,
  isEscrow,
  dealTotal: _dealTotal,
  activeWorkspaceId: _activeWorkspaceId,
  inputStyle,
  labelStyle,
  onResolve,
  onAddAction,
}: {
  chatId: string;
  dispute: NonNullable<EscrowWorkflowRecord['dispute']>;
  additionalActions: DisputeAdditionalAction[];
  isEscrow: boolean;
  dealTotal: number;
  activeWorkspaceId: string;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onResolve: (resolution: 'Released' | 'Refunded', resolutionNote: string, referenceNumber: string, refundAmount?: number) => void;
  onAddAction: (type: 'Request Evidence' | 'Request Clarification', note: string) => void;
}) {
  const [resolution,  setResolution]  = useState<'Released' | 'Refunded'>('Released');
  const [refundType,  setRefundType]  = useState<'Full' | 'Partial'>('Full');
  const [partialAmt,  setPartialAmt]  = useState('');
  const [note,        setNote]        = useState('');
  const [refNumber,   setRefNumber]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [actionType,  setActionType]  = useState<'Request Evidence' | 'Request Clarification'>('Request Evidence');
  const [actionNote,  setActionNote]  = useState('');
  const [showAction,  setShowAction]  = useState(false);

  const parsedPartial  = parseInt(partialAmt.replace(/\D/g, ''), 10) || 0;
  const partialInvalid = refundType === 'Partial' && (parsedPartial <= 0 || parsedPartial > _dealTotal);
  const finalRefundAmt = refundType === 'Full' ? _dealTotal : parsedPartial;
  const canSubmit      = note.trim() !== '' && refNumber.trim() !== '' && !(resolution === 'Refunded' && partialInvalid);

  const BULAN_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  function fmtDate(iso: string) { const d = new Date(iso); return `${d.getDate()} ${BULAN_SHORT[d.getMonth()]} ${d.getFullYear()}`; }

  return (
    <div style={{ background: 'rgba(198,40,40,0.06)', border: '1.5px solid rgba(198,40,40,0.3)', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 8 }}>⚠️ Sengketa Aktif</div>
      <div style={{ fontSize: 12, color: 'var(--color-text)', marginBottom: 2 }}>Dibuka: {fmtDate(dispute.openedAt)}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text)', marginBottom: 10, lineHeight: 1.4 }}>Alasan: {dispute.reason}</div>

      {/* Additional actions log */}
      {additionalActions.length > 0 && (
        <div style={{ background: 'var(--color-bg)', borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Tindakan Escrow
          </div>
          {additionalActions.map(act => (
            <div key={act.id} style={{ fontSize: 11, color: 'var(--color-text)', marginBottom: 5, lineHeight: 1.5 }}>
              <strong>{act.actionType === 'Request Evidence' ? '📁 Minta Bukti' : '❓ Minta Klarifikasi'}</strong>
              {' — '}{act.note}
              <span style={{ opacity: 0.6, display: 'block', fontSize: 10 }}>{act.requestedByName} · {fmtDate(act.requestedAt)}</span>
            </div>
          ))}
        </div>
      )}

      {dispute.resolvedAt ? (
        <div style={{ background: 'var(--color-bg)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: 'var(--color-primary)' }}>
          ✅ Sengketa diselesaikan: {dispute.resolutionNote}
        </div>
      ) : isEscrow ? (
        <>
          <div style={{ background: 'var(--color-bg)', borderRadius: 6, padding: '6px 10px', marginBottom: 10, fontSize: 11, color: 'var(--color-muted)' }}>
            🔐 Escrow menentukan penyelesaian berdasarkan bukti dari kedua pihak.
          </div>

          {/* Request Evidence / Clarification */}
          {!showAction ? (
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <button type="button" onClick={() => { setActionType('Request Evidence'); setShowAction(true); }} style={{
                flex: 1, padding: '7px 4px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                border: '1.5px solid rgba(198,40,40,0.35)', background: 'var(--color-bg)',
                color: 'var(--color-danger)', cursor: 'pointer',
              }}>📁 Minta Bukti</button>
              <button type="button" onClick={() => { setActionType('Request Clarification'); setShowAction(true); }} style={{
                flex: 1, padding: '7px 4px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                border: '1.5px solid rgba(198,40,40,0.35)', background: 'var(--color-bg)',
                color: 'var(--color-danger)', cursor: 'pointer',
              }}>❓ Minta Klarifikasi</button>
            </div>
          ) : (
            <div style={{ background: 'var(--color-bg)', borderRadius: 7, padding: '10px', marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 6 }}>
                {actionType === 'Request Evidence' ? '📁 Minta Bukti Tambahan' : '❓ Minta Klarifikasi'}
              </div>
              <textarea value={actionNote} onChange={e => setActionNote(e.target.value)}
                rows={2} placeholder={actionType === 'Request Evidence' ? 'Bukti apa yang dibutuhkan…' : 'Klarifikasi apa yang diperlukan…'}
                style={{ ...inputStyle, marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => { setShowAction(false); setActionNote(''); }} style={{
                  flex: 1, padding: '8px 0', borderRadius: 7, background: 'transparent',
                  border: '1.5px solid rgba(198,40,40,0.35)', color: 'var(--color-danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Batal</button>
                <button type="button" onClick={() => {
                  if (!actionNote.trim()) return;
                  onAddAction(actionType, actionNote.trim());
                  setActionNote(''); setShowAction(false);
                }} disabled={!actionNote.trim()} style={{
                  flex: 2, padding: '8px 0', borderRadius: 7,
                  background: actionNote.trim() ? 'var(--color-danger)' : 'var(--color-border)',
                  color: '#fff', border: 'none', fontSize: 12, fontWeight: 700,
                  cursor: actionNote.trim() ? 'pointer' : 'default',
                }}>Kirim</button>
              </div>
            </div>
          )}

          {/* Resolve form */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ ...labelStyle, color: 'var(--color-danger)' }}>Penyelesaian</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['Released', 'Refunded'] as const).map(r => (
                <button key={r} type="button" onClick={() => { setResolution(r); setRefundType('Full'); setPartialAmt(''); }} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11.5, fontWeight: 700,
                  border: `1.5px solid ${resolution === r ? 'var(--color-danger)' : 'rgba(198,40,40,0.25)'}`,
                  background: resolution === r ? 'var(--color-danger)' : 'var(--color-bg)',
                  color: resolution === r ? '#fff' : 'var(--color-muted)', cursor: 'pointer',
                }}>
                  {r === 'Released' ? '🏪 Rilis ke Seller' : '↩️ Refund ke Buyer'}
                </button>
              ))}
            </div>
          </div>

          {/* Refund amount selector — only shown when resolution is Refunded */}
          {resolution === 'Refunded' && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ ...labelStyle, color: 'var(--color-danger)' }}>Jenis Refund</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                {(['Full', 'Partial'] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => { setRefundType(t); setPartialAmt(''); }}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 11.5, fontWeight: 700,
                      border: `1.5px solid ${refundType === t ? 'var(--color-danger)' : 'rgba(198,40,40,0.25)'}`,
                      background: refundType === t ? 'rgba(198,40,40,0.1)' : 'var(--color-bg)',
                      color: refundType === t ? 'var(--color-danger)' : 'var(--color-muted)', cursor: 'pointer',
                    }}>
                    {t === 'Full' ? '💯 Penuh' : '✂️ Sebagian'}
                  </button>
                ))}
              </div>
              {refundType === 'Partial' && (
                <div>
                  <label style={{ ...labelStyle, color: 'var(--color-danger)' }}>
                    Jumlah Refund * (maks. Rp {_dealTotal.toLocaleString('id-ID')})
                  </label>
                  <input
                    type="number" value={partialAmt} min="1" max={_dealTotal}
                    onChange={e => setPartialAmt(e.target.value)}
                    placeholder={`Maks. Rp ${_dealTotal.toLocaleString('id-ID')}`}
                    style={inputStyle}
                  />
                  {partialInvalid && partialAmt !== '' && (
                    <div style={{ fontSize: 10.5, color: 'var(--color-danger)', marginTop: 3 }}>
                      Jumlah harus antara Rp 1 – Rp {_dealTotal.toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 8 }}>
            <label style={{ ...labelStyle, color: 'var(--color-danger)' }}>Keterangan Penyelesaian *</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              rows={2} placeholder="Jelaskan dasar penyelesaian…"
              style={inputStyle} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ ...labelStyle, color: 'var(--color-danger)' }}>No. Referensi Transfer *</label>
            <input type="text" value={refNumber} onChange={e => setRefNumber(e.target.value)}
              placeholder="Nomor referensi transfer" style={inputStyle} />
          </div>
          <button type="button" onClick={() => {
            if (!canSubmit) return;
            setSaving(true);
            onResolve(
              resolution,
              note.trim(),
              refNumber.trim(),
              resolution === 'Refunded' ? finalRefundAmt : undefined,
            );
            setSaving(false);
          }} disabled={!canSubmit || saving} style={{
            width: '100%', padding: '11px 0', borderRadius: 8,
            background: canSubmit ? 'var(--color-danger)' : 'var(--color-border)',
            color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
            cursor: canSubmit ? 'pointer' : 'default',
          }}>
            {saving ? 'Memproses…' : '🔒 Selesaikan Sengketa'}
          </button>
        </>
      ) : (
        <div style={{ background: 'var(--color-bg)', borderRadius: 6, padding: '8px 10px', fontSize: 11.5, color: 'var(--color-muted)' }}>
          Escrow sedang menangani penyelesaian sengketa. Tunggu instruksi lebih lanjut dari Escrow Officer.
        </div>
      )}
    </div>
  );
}

function CancelEscrowButton({
  chatId,
  activeWorkspaceId,
  inputStyle,
  labelStyle,
  onDone,
}: {
  chatId: string;
  activeWorkspaceId: string;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  onDone: () => void;
}) {
  const [show,   setShow]   = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  if (!show) {
    return (
      <button type="button" onClick={() => setShow(true)} style={{
        width: '100%', padding: '8px 0', borderRadius: 8, marginBottom: 12,
        background: 'transparent', border: '1.5px dashed var(--color-border)',
        color: 'var(--color-muted)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
      }}>🚫 Batalkan Escrow</button>
    );
  }

  return (
    <div style={{
      background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
      borderRadius: 8, padding: '12px', marginBottom: 12,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>🚫 Batalkan Escrow</div>
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Alasan Pembatalan *</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          rows={2} placeholder="Alasan pembatalan escrow…" style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setShow(false)} style={{
          flex: 1, padding: '9px 0', borderRadius: 8,
          background: 'transparent', border: '1.5px solid var(--color-border)',
          color: 'var(--color-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Batal</button>
        <button type="button" onClick={() => {
          if (!reason.trim()) return;
          setSaving(true);
            cancelEscrowWorkflow(chatId, { reason: reason.trim(), byWorkspaceId: activeWorkspaceId });
            setSaving(false); onDone();
        }}
          disabled={!reason.trim() || saving}
          style={{
            flex: 2, padding: '9px 0', borderRadius: 8,
            background: reason.trim() ? 'var(--color-cancelled)' : 'var(--color-border)',
            color: '#fff', border: 'none', fontSize: 12, fontWeight: 700,
            cursor: reason.trim() ? 'pointer' : 'default',
          }}>
          {saving ? 'Memproses…' : '🚫 Konfirmasi Batal'}
        </button>
      </div>
    </div>
  );
}

function EscrowTimeline({ timeline }: { timeline: EscrowWorkflowRecord['timeline'] }) {
  const [open, setOpen] = useState(false);
  const events = [...timeline].reverse();
  const BULAN_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

  function fmtTs(iso: string): string {
    const d = new Date(iso);
    return `${d.getDate()} ${BULAN_SHORT[d.getMonth()]}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  const EVENT_ICON: Record<string, string> = {
    'Escrow Assigned': '🏦',
    'Assignment Started': '🚀',
    'Payment Instruction Created': '📋',
    'Buyer Uploaded Proof': '📤',
    'Verification Approved': '✅',
    'Verification Rejected': '❌',
    'Reupload Requested': '🔄',
    'Funds Ready To Release': '⏳',
    'Funds Released': '🎉',
    'Refund Issued': '↩️',
    'Dispute Opened': '⚠️',
    'Dispute Resolved — Released': '🔒',
    'Dispute Resolved — Refunded': '🔒',
    'Escrow Cancelled': '🚫',
  };

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden', marginBottom: 10,
    }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
      }}>
        <span style={{ fontSize: 16 }}>📋</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
          Timeline ({timeline.length} event)
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, transform: open ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', color: 'var(--color-muted)' }}>›</span>
      </button>
      {open && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '10px 12px' }}>
          {events.length === 0 ? (
            <div style={{ fontSize: 11.5, color: 'var(--color-muted)', textAlign: 'center' }}>Belum ada event.</div>
          ) : events.map(ev => (
            <div key={ev.id} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(124,58,237,0.1)', border: '2px solid rgba(124,58,237,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
              }}>{EVENT_ICON[ev.eventType] ?? '•'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)' }}>
                  {ev.eventType}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.4 }}>
                  {ev.description}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
                  {fmtTs(ev.timestamp)} · {ev.actorName}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EscrowAuditLog({ auditLog }: { auditLog: EscrowWorkflowRecord['auditLog'] }) {
  const [open, setOpen] = useState(false);
  const entries = [...auditLog].reverse();
  const BULAN_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

  function fmtTs(iso: string): string {
    const d = new Date(iso);
    return `${d.getDate()} ${BULAN_SHORT[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden', marginBottom: 10,
    }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
      }}>
        <span style={{ fontSize: 16 }}>🔍</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
          Audit Log ({auditLog.length} entri)
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, transform: open ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', color: 'var(--color-muted)' }}>›</span>
      </button>
      {open && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '10px 12px' }}>
          {entries.length === 0 ? (
            <div style={{ fontSize: 11.5, color: 'var(--color-muted)', textAlign: 'center' }}>Belum ada log.</div>
          ) : entries.map(entry => (
            <div key={entry.id} style={{
              display: 'flex', flexDirection: 'column', gap: 2,
              paddingBottom: 8, marginBottom: 8,
              borderBottom: '1px solid var(--color-border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)' }}>{entry.action}</span>
                <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{fmtTs(entry.timestamp)}</span>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
                Aktor: {entry.actor} · Target: {entry.target}
              </div>
              <div style={{
                fontSize: 9.5, fontFamily: 'monospace', color: 'var(--color-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                ref: {entry.referenceUuid}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quotation Bar ────────────────────────────────────────────────────────────
