// ─── ChatDealSheet — extracted from MarketplaceChat.tsx ──
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
import { formatRupiah, formatDatetime, getWorkspaceName } from './ChatHelpers';
import { EscrowConfigSelectorBlock } from './ChatEscrow';

// Bottom sheet for the full Deal lifecycle:
//   Create → Draft → Waiting Approval → Locked
//   or → Rejected → Draft (edit loop) → Locked
//   or → Cancelled

export function DealSheet({
  deal,
  listing,
  room,
  activeWorkspaceId,
  onClose,
  onTick,
}: {
  deal: Deal | undefined;
  listing: ListingItem | undefined;
  room: TransactionRoom;
  activeWorkspaceId: string;
  onClose: () => void;
  onTick: () => void;
}) {
  // ── Local state ──
  const [editMode, setEditMode] = useState(!deal); // true when creating or editing
  const [jumlah, setJumlah] = useState<string>(
    deal ? String(deal.fields.jumlah) : '1',
  );
  const [hargaSatuan, setHargaSatuan] = useState<string>(
    deal ? String(deal.fields.hargaSatuan) : String(listing?.harga ?? 0),
  );
  const [catatan, setCatatan] = useState<string>(
    deal ? deal.fields.catatan : '',
  );
  const [showHistory, setShowHistory] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isLocked      = deal ? isDealLocked(deal.status) : false;
  const canEdit       = deal ? isDealEditable(deal.status) : true;
  const myApproval    = deal ? getMyApproval(deal, activeWorkspaceId) : undefined;
  const hasVoted      = myApproval?.decision !== 'Pending';

  // Who rejected (for Rejected state display)
  const rejecter = deal?.status === 'Rejected'
    ? deal.approvals.find(a => a.decision === 'Rejected')
    : undefined;

  // Computed summary (recomputed on each render)
  const summaryForDisplay: DealSummary | undefined = deal ? computeDealSummary(deal) : undefined;

  // Preview total from the form inputs
  const previewTotal = (() => {
    const q = parseFloat(jumlah) || 0;
    const p = parseFloat(hargaSatuan) || 0;
    return q * p;
  })();

  // ── Handlers ──
  function handleCreate() {
    setErrorMsg('');
    const q = parseFloat(jumlah);
    const p = parseFloat(hargaSatuan);
    if (!q || q <= 0) { setErrorMsg('Jumlah harus lebih dari 0.'); return; }
    if (isNaN(p) || p < 0) { setErrorMsg('Harga satuan tidak valid.'); return; }
    try {
      createDeal({
        chatId: room.id,
        listingUuid: room.listingUuid,
        workspaceIdPenjual: room.workspaceIdPenjual,
        workspaceIdPembeli: room.workspaceIdPembeli,
        createdByWorkspaceId: activeWorkspaceId,
        fields: { jumlah: q, hargaSatuan: p, catatan },
      });
      onTick();
      onClose();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  }

  function handleSaveEdit() {
    if (!deal) return;
    setErrorMsg('');
    const q = parseFloat(jumlah);
    const p = parseFloat(hargaSatuan);
    if (!q || q <= 0) { setErrorMsg('Jumlah harus lebih dari 0.'); return; }
    if (isNaN(p) || p < 0) { setErrorMsg('Harga satuan tidak valid.'); return; }
    try {
      updateDealFields({
        chatId: room.id,
        editorWorkspaceId: activeWorkspaceId,
        newFields: { jumlah: q, hargaSatuan: p, catatan },
      });
      setEditMode(false);
      onTick();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  }

  function handleEnterEditMode() {
    if (!deal) return;
    setJumlah(String(deal.fields.jumlah));
    setHargaSatuan(String(deal.fields.hargaSatuan));
    setCatatan(deal.fields.catatan);
    setEditMode(true);
  }

  function handleSubmit() {
    if (!deal) return;
    setErrorMsg('');
    try {
      submitDealForApproval(room.id, activeWorkspaceId);
      onTick();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  }

  function handleVote(vote: 'approve' | 'reject') {
    if (!deal) return;
    setErrorMsg('');
    try {
      voteOnDeal({ chatId: room.id, workspaceId: activeWorkspaceId, vote });
      onTick();
      if (vote === 'approve') {
        const updated = getDealByChatId(room.id);
        if (updated?.status === 'Locked') onClose();
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  }

  function handleReset() {
    if (!deal) return;
    setErrorMsg('');
    try {
      resetRejectedDeal(room.id, activeWorkspaceId);
      onTick();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  }

  function handleCancel() {
    if (!deal) return;
    setErrorMsg('');
    try {
      cancelDeal(room.id, activeWorkspaceId);
      onTick();
      onClose();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  }

  // ── Shared sub-components (defined inline for encapsulation) ──

  function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
      <div style={{
        fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
      }}>
        {children}
      </div>
    );
  }

  function InfoRow({ label, value, emphasis }: { label: string; value: React.ReactNode; emphasis?: boolean }) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '8px 12px', borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{ fontSize: 12, color: 'var(--color-muted)', flexShrink: 0, marginRight: 8 }}>{label}</span>
        <span style={{
          fontSize: 12, fontWeight: emphasis ? 800 : 600,
          color: emphasis ? 'var(--color-primary)' : 'var(--color-text)',
          textAlign: 'right',
        }}>{value}</span>
      </div>
    );
  }

  function PlaceholderRow({ label }: { label: string }) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{label}</span>
        <span style={{
          fontSize: 10.5, fontWeight: 600, color: 'var(--color-muted)',
          background: 'rgba(156,163,175,0.12)', borderRadius: 20, padding: '2px 10px',
        }}>
          Belum Dipilih
        </span>
      </div>
    );
  }

  function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 5 }}>
          {label}
        </label>
        {children}
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box',
    border: '1.5px solid var(--color-border)', background: 'var(--color-bg)',
    fontSize: 13, color: 'var(--color-text)', outline: 'none', fontFamily: 'inherit',
  };

  // ── Render ──
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.5)' }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, zIndex: 901,
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.22)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Sheet Header ── */}
        <div style={{
          padding: '14px 16px 12px', flexShrink: 0,
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)', margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>
                {deal ? 'Proposal Deal' : 'Buat Proposal Deal'}
              </span>
              {deal && (
                <span style={{
                  fontSize: 10.5, fontWeight: 700,
                  color: DEAL_STATUS_COLOR[deal.status],
                  background: DEAL_STATUS_BG[deal.status],
                  border: `1px solid ${DEAL_STATUS_COLOR[deal.status]}33`,
                  borderRadius: 20, padding: '2px 9px',
                }}>
                  {DEAL_STATUS_ICON[deal.status]} {DEAL_STATUS_LABEL[deal.status]}
                </span>
              )}
            </div>
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

        {/* ── Scrollable Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 24px' }}>

          {/* ── Error banner ── */}
          {errorMsg && (
            <div style={{
              background: 'rgba(220,38,38,0.09)', border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 8, padding: '10px 12px', marginBottom: 14,
              fontSize: 12.5, color: 'var(--color-danger)', lineHeight: 1.4,
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SECTION A: CREATION FORM (no deal yet)
          ════════════════════════════════════════════════════════════════ */}
          {!deal && (
            <>
              {/* Listing reference */}
              {listing && (
                <div style={{
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  borderRadius: 8, padding: '10px 12px', marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>
                    {listing.media.thumbnail}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {listing.judul}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600, marginTop: 2 }}>
                      Harga listing: {formatRupiah(listing.harga)} / {listing.satuanHarga}
                    </div>
                  </div>
                </div>
              )}

              <FormField label={`Jumlah (${listing?.satuanHarga ?? 'unit'})`}>
                <input
                  type="number" min="1" step="1"
                  value={jumlah}
                  onChange={e => setJumlah(e.target.value)}
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Harga Satuan (Rp)">
                <input
                  type="number" min="0" step="1"
                  value={hargaSatuan}
                  onChange={e => setHargaSatuan(e.target.value)}
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Catatan / Syarat Deal">
                <textarea
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="Catatan pengiriman, garansi, syarat pembayaran, dll."
                  rows={3}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                />
              </FormField>

              {/* Preview total */}
              <div style={{
                background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.18)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
                  Total Perkiraan
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)' }}>
                  {formatRupiah(previewTotal)}
                </span>
              </div>

              <button
                type="button" onClick={handleCreate}
                style={{
                  width: '100%', padding: '13px', borderRadius: 10,
                  background: 'var(--color-primary)', color: '#fff',
                  border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                }}
              >
                📋 Buat Proposal Deal
              </button>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SECTION B: DEAL EXISTS — Summary + contextual panels
          ════════════════════════════════════════════════════════════════ */}
          {deal && summaryForDisplay && (
            <>
              {/* ── B1: Rejected banner ── */}
              {deal.status === 'Rejected' && rejecter && (
                <div style={{
                  background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 8, padding: '10px 14px', marginBottom: 14,
                  fontSize: 12.5, color: 'var(--color-danger)', lineHeight: 1.5,
                }}>
                  ❌ Deal ditolak oleh <strong>{getWorkspaceName(rejecter.workspaceId)}</strong>
                  {rejecter.timestamp && <span style={{ fontSize: 11, opacity: 0.8 }}> pada {formatDatetime(rejecter.timestamp)}</span>}
                  <br />
                  Anda dapat mengedit dan mengajukan ulang.
                </div>
              )}

              {/* ── B2: Locked banner ── */}
              {deal.status === 'Locked' && deal.lockedAt && (
                <div style={{
                  background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)',
                  borderRadius: 8, padding: '10px 14px', marginBottom: 14,
                  fontSize: 12.5, color: 'var(--color-primary)', lineHeight: 1.5,
                }}>
                  🔒 Deal terkunci pada <strong>{formatDatetime(deal.lockedAt)}</strong>.<br />
                  Harga, jumlah, dan catatan tidak dapat diubah.
                </div>
              )}

              {/* ── B3: Deal Summary ── */}
              <SectionTitle>Ringkasan Deal</SectionTitle>
              <div style={{
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                borderRadius: 8, overflow: 'hidden', marginBottom: 16,
              }}>
                {/* Listing info */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderBottom: '1px solid var(--color-border)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>
                    {summaryForDisplay.listingThumbnail}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {summaryForDisplay.listingJudul}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 1 }}>Listing</div>
                  </div>
                </div>

                <InfoRow label="Jumlah" value={`${summaryForDisplay.jumlah.toLocaleString('id-ID')} ${summaryForDisplay.satuanHarga}`} />
                <InfoRow label="Harga Satuan" value={formatRupiah(summaryForDisplay.hargaSatuan)} />
                <InfoRow label="Total Harga" value={formatRupiah(summaryForDisplay.totalHarga)} emphasis />

                {summaryForDisplay.catatan ? (
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 3 }}>Catatan</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {summaryForDisplay.catatan}
                    </div>
                  </div>
                ) : (
                  <InfoRow label="Catatan" value={<span style={{ color: 'var(--color-muted)', fontStyle: 'italic' }}>—</span>} />
                )}

                {/* ── Live service quotation rows ── */}
                {(() => {
                  const escrowWf      = getEscrowWorkflow(room.id);
                  const liveEscrowFee = escrowWf && !TERMINAL_ESCROW_WORKFLOW_STATUSES.has(escrowWf.status)
                    ? escrowWf.escrowFee : 0;
                  const lockedQuotes  = getLockedQuotationsByChatId(room.id);
                  const allQuotes     = getQuotationsByChatId(room.id);
                  const grandTotal    = computeGrandTotal(summaryForDisplay.totalHarga, liveEscrowFee, lockedQuotes);

                  // Collect unique service types from all non-Cancelled quotations
                  const serviceTypes = Array.from(new Set(
                    allQuotes.filter(q => q.status !== 'Cancelled').map(q => q.serviceType)
                  ));

                  return (
                    <>
                      {/* Escrow row */}
                      {escrowWf ? (
                        <InfoRow
                          label={`🏦 Escrow (${ESCROW_STATUS_CONFIG[escrowWf.status].label})`}
                          value={liveEscrowFee > 0 ? formatRupiah(liveEscrowFee) : '—'}
                        />
                      ) : (
                        <PlaceholderRow label="Escrow" />
                      )}

                      {/* Service quotation rows (one per service type with latest locked/active quote) */}
                      {serviceTypes.length > 0 ? serviceTypes.map(svcType => {
                        const locked = lockedQuotes.find(q => q.serviceType === svcType);
                        const active = allQuotes.find(q => q.serviceType === svcType && !TERMINAL_QUOTE_STATUSES.has(q.status));
                        const display = locked ?? active;
                        if (!display) return null;
                        const cfg = QUOTE_STATUS_CONFIG[display.status];
                        return (
                          <InfoRow
                            key={svcType}
                            label={`${SERVICE_ROLE_ICON[svcType]} ${svcType} (${cfg.label})`}
                            value={display.status === 'Locked' ? formatRupiah(display.quotedPrice) : '—'}
                          />
                        );
                      }) : (
                        <>
                          {(() => {
                            const tc = getTransportConfig(room.id);
                            if (!tc?.mode) return <PlaceholderRow label="Transport" />;
                            const mc = TRANSPORT_MODE_CONFIG[tc.mode];
                            const statusLbl = getTransportStatusLabel(tc);
                            return (
                              <InfoRow
                                label={`${mc.icon} Transport (${mc.label})`}
                                value={statusLbl}
                              />
                            );
                          })()}
                          {/* Only show Veterinarian row if there is at least one vet quotation
                              (even cancelled). Never always-show "Belum Dipilih". */}
                          {(() => {
                            const vetQuotes = allQuotes.filter(q => q.serviceType === 'Veterinarian');
                            if (vetQuotes.length === 0) return null;
                            return <InfoRow label="👨‍⚕️ Veterinarian" value="Tidak Digunakan" />;
                          })()}
                        </>
                      )}

                      {/* Grand Total */}
                      <div style={{
                        background: 'rgba(37,99,235,0.04)',
                        borderTop: '1px solid rgba(37,99,235,0.12)',
                      }}>
                        <InfoRow
                          label="Total Deal (Ternak)"
                          value={formatRupiah(summaryForDisplay.totalHarga)}
                        />
                        {lockedQuotes.length > 0 && (
                          <InfoRow
                            label={`Layanan Terkunci (${lockedQuotes.length})`}
                            value={formatRupiah(lockedQuotes.reduce((s, q) => s + q.quotedPrice, 0))}
                          />
                        )}
                        {liveEscrowFee > 0 && (
                          <InfoRow label="Biaya Escrow" value={formatRupiah(liveEscrowFee)} />
                        )}
                        <div style={{ borderBottom: 'none' }}>
                          <InfoRow label="Grand Total" value={formatRupiah(grandTotal)} emphasis />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* ── B3.5: Metode Pembayaran (visible when Locked) ── */}
              {deal.status === 'Locked' && (
                <div style={{ marginBottom: 16 }}>
                  <SectionTitle>Metode Pembayaran</SectionTitle>
                  <EscrowConfigSelectorBlock
                    chatId={room.id}
                    activeWorkspaceId={activeWorkspaceId}
                    onSelected={() => onTick()}
                  />
                </div>
              )}

              {/* ── B4: Edit form (when editable + edit mode) ── */}
              {canEdit && editMode && (
                <>
                  <SectionTitle>Edit Detail Deal</SectionTitle>
                  <div style={{
                    background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                    borderRadius: 8, padding: '14px', marginBottom: 14,
                  }}>
                    <FormField label={`Jumlah (${summaryForDisplay.satuanHarga})`}>
                      <input
                        type="number" min="1" step="1"
                        value={jumlah}
                        onChange={e => setJumlah(e.target.value)}
                        style={inputStyle}
                      />
                    </FormField>
                    <FormField label="Harga Satuan (Rp)">
                      <input
                        type="number" min="0" step="1"
                        value={hargaSatuan}
                        onChange={e => setHargaSatuan(e.target.value)}
                        style={inputStyle}
                      />
                    </FormField>
                    <FormField label="Catatan / Syarat Deal">
                      <textarea
                        value={catatan}
                        onChange={e => setCatatan(e.target.value)}
                        placeholder="Catatan pengiriman, garansi, syarat pembayaran, dll."
                        rows={3}
                        style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                      />
                    </FormField>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: 12,
                    }}>
                      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Preview Total</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)' }}>
                        {formatRupiah(previewTotal)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button" onClick={() => { setEditMode(false); setErrorMsg(''); }}
                        style={{
                          flex: 1, padding: '10px', borderRadius: 8,
                          background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
                          fontSize: 13, fontWeight: 700, color: 'var(--color-muted)', cursor: 'pointer',
                        }}
                      >
                        Batal
                      </button>
                      <button
                        type="button" onClick={handleSaveEdit}
                        style={{
                          flex: 2, padding: '10px', borderRadius: 8,
                          background: 'var(--color-primary)', color: '#fff',
                          border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        💾 Simpan Perubahan
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── B5: Approval section (Waiting Approval only) ── */}
              {deal.status === 'Waiting Approval' && (
                <>
                  <SectionTitle>Status Persetujuan</SectionTitle>
                  <div style={{
                    background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                    borderRadius: 8, overflow: 'hidden', marginBottom: 14,
                  }}>
                    {deal.approvals.map((a, i) => {
                      const decisionColor =
                        a.decision === 'Approved' ? 'var(--color-success)' :
                        a.decision === 'Rejected' ? 'var(--color-danger)' : 'var(--color-warning)';
                      const decisionBg =
                        a.decision === 'Approved' ? 'rgba(22,163,74,0.1)' :
                        a.decision === 'Rejected' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)';
                      const decisionLabel =
                        a.decision === 'Approved' ? '✓ Setuju' :
                        a.decision === 'Rejected' ? '✗ Tolak' : '⏳ Menunggu';

                      return (
                        <div key={a.workspaceId} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderBottom: i < deal.approvals.length - 1 ? '1px solid var(--color-border)' : 'none',
                        }}>
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
                              {getWorkspaceName(a.workspaceId)}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
                              {ROLE_LABEL[a.role]}
                              {a.timestamp && <span> · {formatDatetime(a.timestamp)}</span>}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            color: decisionColor, background: decisionBg,
                            borderRadius: 20, padding: '3px 10px',
                          }}>
                            {decisionLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Vote buttons for current user (if not yet voted) */}
                  {myApproval && !hasVoted && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
                        Berikan persetujuan Anda:
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button" onClick={() => handleVote('reject')}
                          style={{
                            flex: 1, padding: '11px', borderRadius: 8,
                            background: 'rgba(220,38,38,0.08)',
                            border: '1.5px solid rgba(220,38,38,0.25)',
                            fontSize: 13, fontWeight: 700, color: 'var(--color-danger)', cursor: 'pointer',
                          }}
                        >
                          ✗ Tolak
                        </button>
                        <button
                          type="button" onClick={() => handleVote('approve')}
                          style={{
                            flex: 2, padding: '11px', borderRadius: 8,
                            background: 'var(--color-success)', color: '#fff',
                            border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          ✓ Setujui Deal
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Already voted */}
                  {myApproval && hasVoted && myApproval.decision === 'Approved' && (
                    <div style={{
                      background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
                      borderRadius: 8, padding: '10px 14px', marginBottom: 14,
                      fontSize: 12.5, color: 'var(--color-success)',
                    }}>
                      ✓ Anda sudah menyetujui. Menunggu pihak lain.
                    </div>
                  )}
                </>
              )}

              {/* ── B6: Action buttons ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {/* Submit for approval (Draft only) */}
                {deal.status === 'Draft' && (
                  <button
                    type="button" onClick={handleSubmit}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 10,
                      background: 'var(--color-primary)', color: '#fff',
                      border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    }}
                  >
                    📨 Ajukan untuk Persetujuan
                  </button>
                )}

                {/* Edit button (Draft, not already editing) */}
                {deal.status === 'Draft' && !editMode && (
                  <button
                    type="button" onClick={handleEnterEditMode}
                    style={{
                      width: '100%', padding: '11px', borderRadius: 10,
                      background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
                      fontSize: 13, fontWeight: 700, color: 'var(--color-text)', cursor: 'pointer',
                    }}
                  >
                    ✏️ Edit Detail Deal
                  </button>
                )}

                {/* Edit button (Waiting Approval, not already editing) */}
                {deal.status === 'Waiting Approval' && !editMode && (
                  <button
                    type="button" onClick={handleEnterEditMode}
                    style={{
                      width: '100%', padding: '11px', borderRadius: 10,
                      background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
                      fontSize: 13, fontWeight: 700, color: 'var(--color-text)', cursor: 'pointer',
                    }}
                  >
                    ✏️ Edit & Reset Persetujuan
                  </button>
                )}

                {/* Reset rejected deal */}
                {deal.status === 'Rejected' && (
                  <button
                    type="button" onClick={handleReset}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 10,
                      background: 'var(--color-primary)', color: '#fff',
                      border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    }}
                  >
                    🔄 Edit Ulang Deal
                  </button>
                )}

                {/* Cancel (not Locked) */}
                {!isLocked && (
                  <button
                    type="button" onClick={handleCancel}
                    style={{
                      width: '100%', padding: '11px', borderRadius: 10,
                      background: 'rgba(220,38,38,0.07)',
                      border: '1.5px solid rgba(220,38,38,0.2)',
                      fontSize: 13, fontWeight: 700, color: 'var(--color-danger)', cursor: 'pointer',
                    }}
                  >
                    🚫 Batalkan Deal
                  </button>
                )}
              </div>

              {/* ── B7: Revision History ── */}
              {deal.revisions.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowHistory(s => !s)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Riwayat Revisi ({deal.revisions.length})
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                      {showHistory ? '▲ Sembunyikan' : '▼ Tampilkan'}
                    </span>
                  </button>

                  {showHistory && (
                    <div style={{
                      background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                      borderRadius: 8, overflow: 'hidden',
                    }}>
                      {[...deal.revisions].reverse().map((rev, i) => (
                        <div
                          key={rev.version}
                          style={{
                            padding: '10px 12px',
                            borderBottom: i < deal.revisions.length - 1 ? '1px solid var(--color-border)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{
                              fontSize: 10.5, fontWeight: 800,
                              color: 'var(--color-primary)',
                              background: 'rgba(37,99,235,0.1)',
                              borderRadius: 4, padding: '1px 7px',
                            }}>
                              v{rev.version}
                            </span>
                            <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
                              {formatDatetime(rev.timestamp)}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 600, marginBottom: 3 }}>
                            {getWorkspaceName(rev.editorWorkspaceId)}
                            <span style={{
                              marginLeft: 6, fontSize: 10, fontWeight: 700,
                              color: ROLE_COLOR[rev.editorRole],
                              background: ROLE_BG[rev.editorRole],
                              borderRadius: 4, padding: '1px 5px',
                            }}>
                              {ROLE_LABEL[rev.editorRole]}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {rev.changedFields.map(f => (
                              <span key={f} style={{
                                fontSize: 10.5, color: 'var(--color-muted)',
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 4, padding: '1px 6px',
                              }}>
                                {DEAL_FIELD_LABEL[f] ?? f}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Participants Sheet ────────────────────────────────────────────────────────

