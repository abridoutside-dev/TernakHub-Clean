// ─── ChatTransport — extracted from MarketplaceChat.tsx ──
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
import { BULAN } from './ChatHelpers';

const TRANSPORT_EVIDENCE_EMOJIS = [
  '📸','🐄','🐐','🐑','🐖','🦆','📦','🚛','🏠','📍','🌿','🤝','🔑','🏷️','📋','🔍',
];

// ─── Transport Bar ─────────────────────────────────────────────────────────────
// FARM-FIX-005.7 — Strip below QuotationBar. Visible when deal exists.
// Shows transport mode/status and opens TransportSheet.

export function TransportBar({
  chatId,
  deal,
  onOpen,
}: {
  chatId: string;
  deal: Deal | undefined;
  onOpen: () => void;
}) {
  if (!deal) return null;

  const config = getTransportConfig(chatId);

  if (!config?.mode) {
    return (
      <button
        type="button"
        onClick={() => { getOrCreateTransportConfig(chatId); onOpen(); }}
        style={{
          width: '100%', padding: '6px 14px',
          background: 'rgba(22,163,74,0.05)',
          borderBottom: '1px solid rgba(22,163,74,0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', border: 'none',
        }}
      >
        <span style={{ fontSize: 13, flexShrink: 0 }}>🚚</span>
        <span style={{ flex: 1, fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic' }}>
          Transport belum dikonfigurasi
        </span>
        <span style={{
          flexShrink: 0, padding: '3px 9px', borderRadius: 20,
          background: 'rgba(22,163,74,0.1)', border: '1.5px solid rgba(22,163,74,0.3)',
          color: 'var(--color-success)', fontSize: 10.5, fontWeight: 700,
        }}>
          Konfigurasi →
        </span>
      </button>
    );
  }

  const modeCfg = TRANSPORT_MODE_CONFIG[config.mode];
  const statusLabel = getTransportStatusLabel(config);
  const isTerminal = config.mode === 'Marketplace' && config.marketplace
    ? TERMINAL_TRANSPORT_STATUSES.has(config.marketplace.status)
    : false;

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        width: '100%', padding: '6px 14px',
        background: modeCfg.bg,
        borderBottom: `1px solid ${modeCfg.color}22`,
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', border: 'none', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 13, flexShrink: 0 }}>{modeCfg.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: modeCfg.color }}>
          Transport: {modeCfg.label}
        </span>
      </div>
      {!isTerminal && (
        <span style={{
          flexShrink: 0, padding: '2px 8px', borderRadius: 20,
          background: `${modeCfg.color}18`, border: `1px solid ${modeCfg.color}33`,
          color: modeCfg.color, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          {statusLabel} →
        </span>
      )}
      {isTerminal && (
        <span style={{
          flexShrink: 0, padding: '2px 8px', borderRadius: 20,
          background: `${modeCfg.color}12`, border: `1px solid ${modeCfg.color}25`,
          color: modeCfg.color, fontSize: 10, fontWeight: 700,
        }}>
          {statusLabel}
        </span>
      )}
    </button>
  );
}

// ─── AI Suggestions Panel ────────────────────────────────────────────────────

function AISuggestionsPanel({
  suggestions,
  onAction,
}: {
  suggestions: AISuggestion[];
  onAction: (key: string) => void;
}) {
  if (suggestions.length === 0) return null;
  const priorityColor: Record<string, string> = { High: 'var(--color-danger)', Medium: 'var(--color-warning)', Low: 'var(--color-muted)' };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(22,163,74,0.05))',
      border: '1.5px solid rgba(37,99,235,0.18)',
      borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 14,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
      }}>
        <span style={{ fontSize: 14 }}>🤖</span>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Saran AI — Kontekstual
        </div>
        <span style={{ fontSize: 9, color: 'var(--color-muted)', marginLeft: 'auto' }}>
          Berdasarkan status transaksi & peran Anda
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {suggestions.map(s => (
          <div
            key={s.id}
            style={{
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '10px 12px',
              borderLeft: `3px solid ${priorityColor[s.priority]}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5, marginBottom: 8 }}>
                  {s.body}
                </div>
                <button
                  type="button"
                  onClick={() => onAction(s.actionKey)}
                  style={{
                    padding: '5px 12px', borderRadius: 20,
                    background: 'rgba(37,99,235,0.1)', border: '1.5px solid rgba(37,99,235,0.25)',
                    color: 'var(--color-primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {s.actionLabel} →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Transport Timeline Log ───────────────────────────────────────────────────

function TransportTimelineLog({ events }: { events: ReturnType<typeof getOrCreateTransportConfig>['timeline'] }) {
  const [expanded, setExpanded] = useState(false);
  const display = expanded ? events : events.slice(-3);
  const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  function fmtTs(ts: string) {
    const d = new Date(ts);
    return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  const catColor: Record<string, string> = {
    Transport: 'var(--color-info)', Payment: 'var(--color-escrow)', Negotiation: 'var(--color-warning)',
    Delivery: 'var(--color-success)', Completion: 'var(--color-primary-dark)',
  };

  return (
    <div style={{ marginTop: 4 }}>
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', padding: '9px 12px',
          background: 'var(--color-bg)', border: '1px solid var(--color-border)',
          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
          cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)',
        }}
      >
        <span>🕐</span>
        <span style={{ flex: 1, textAlign: 'left' }}>
          Timeline Transport ({events.length} event{events.length !== 1 ? 's' : ''})
        </span>
        <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && events.length === 0 && (
        <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--color-muted)', textAlign: 'center' }}>
          Belum ada aktivitas transport.
        </div>
      )}
      {(events.length > 0) && (
        <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
          {display.map((ev, i) => (
            <div key={ev.id} style={{
              display: 'flex', gap: 10, padding: '9px 12px',
              borderBottom: i < display.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{ev.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: catColor[ev.category] ?? 'var(--color-text)', marginBottom: 2 }}>
                  {ev.eventType}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text)', lineHeight: 1.5, marginBottom: 2 }}>
                  {ev.description}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                  {fmtTs(ev.timestamp)} · {ev.actorRole}
                </div>
              </div>
            </div>
          ))}
          {!expanded && events.length > 3 && (
            <button
              type="button" onClick={() => setExpanded(true)}
              style={{
                width: '100%', padding: '7px', fontSize: 10.5, fontWeight: 600,
                color: 'var(--color-muted)', background: 'none', border: 'none',
                cursor: 'pointer', borderTop: '1px solid var(--color-border)',
              }}
            >
              Lihat semua {events.length} event ▼
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Evidence Upload Form (shared) ────────────────────────────────────────────

function TransportEvidenceUpload({
  phase,
  label,
  activeWorkspaceId,
  minPhotos = 2,
  requireReceiver = true,
  onAdd,
}: {
  phase: 'Pickup' | 'InTransit' | 'Delivery';
  label: string;
  activeWorkspaceId: string;
  minPhotos?: number;
  requireReceiver?: boolean;
  onAdd: (photos: string[], gps: string, receiver: string | null, note: string | null) => void;
}) {
  const [photos, setPhotos]       = useState<string[]>([]);
  const [gps, setGps]             = useState('');
  const [receiver, setReceiver]   = useState('');
  const [note, setNote]           = useState('');
  const [gettingGps, setGettingGps] = useState(false);
  const [saving, setSaving]       = useState(false);

  function addPhoto(emoji: string) {
    setPhotos(prev => [...prev, emoji]);
  }
  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  }
  function handleGetGps() {
    setGettingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setGps(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
          setGettingGps(false);
        },
        () => { setGps('Izin lokasi ditolak — masukkan manual'); setGettingGps(false); },
        { timeout: 5000 },
      );
    } else {
      setGps('Geolocation tidak tersedia'); setGettingGps(false);
    }
  }

  const canSubmit = photos.length >= minPhotos && gps.trim() && (!requireReceiver || receiver.trim());

  function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    onAdd(photos, gps.trim(), receiver.trim() || null, note.trim() || null);

    setPhotos([]);

    setGps('');

    setReceiver('');

    setNote('');

    setSaving(false);
  }

  const iStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5,
    border: '1.5px solid var(--color-border)', background: 'var(--color-bg)',
    color: 'var(--color-text)',
  };
  const lStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3,
  };

  return (
    <div style={{
      background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
      borderRadius: 10, padding: '12px 14px', marginBottom: 12,
    }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
        {label}
      </div>

      {/* Photo picker */}
      <div style={{ marginBottom: 10 }}>
        <label style={lStyle}>Foto Bukti (min {minPhotos})</label>
        {photos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {photos.map((p, i) => (
              <div key={i} style={{
                position: 'relative', width: 44, height: 44, borderRadius: 8,
                background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {p}
                <button
                  type="button" onClick={() => removePhoto(i)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--color-danger)', color: '#fff', border: 'none',
                    fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {TRANSPORT_EVIDENCE_EMOJIS.map(emoji => (
            <button
              key={emoji} type="button"
              onClick={() => addPhoto(emoji)}
              style={{
                width: 36, height: 36, fontSize: 18, borderRadius: 7,
                background: photos.includes(emoji) ? 'rgba(37,99,235,0.12)' : 'var(--color-surface)',
                border: `1px solid ${photos.includes(emoji) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                cursor: 'pointer',
              }}
            >{emoji}</button>
          ))}
        </div>
      </div>

      {/* GPS */}
      <div style={{ marginBottom: 8 }}>
        <label style={lStyle}>GPS / Lokasi *</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text" value={gps} onChange={e => setGps(e.target.value)}
            placeholder="Koordinat GPS atau nama lokasi"
            style={{ ...iStyle, flex: 1 }}
          />
          <button
            type="button" onClick={handleGetGps} disabled={gettingGps}
            style={{
              flexShrink: 0, padding: '8px 10px', borderRadius: 7, fontSize: 12,
              background: 'rgba(37,99,235,0.1)', border: '1.5px solid rgba(37,99,235,0.3)',
              color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 700,
            }}
          >{gettingGps ? '…' : '📍 GPS'}</button>
        </div>
      </div>

      {/* Receiver name */}
      {requireReceiver && (
        <div style={{ marginBottom: 8 }}>
          <label style={lStyle}>
            Nama {phase === 'Delivery' ? 'Penerima' : 'Pengirim'} *
          </label>
          <input
            type="text" value={receiver} onChange={e => setReceiver(e.target.value)}
            placeholder={phase === 'Delivery' ? 'Nama penerima barang/ternak' : 'Nama pengirim di lokasi pickup'}
            style={iStyle}
          />
        </div>
      )}

      {/* Note */}
      <div style={{ marginBottom: 10 }}>
        <label style={lStyle}>Catatan (opsional)</label>
        <textarea
          value={note} onChange={e => setNote(e.target.value)}
          rows={2} placeholder="Kondisi hewan/barang, catatan khusus, dll."
          style={{ ...iStyle, resize: 'none', lineHeight: 1.5 }}
        />
      </div>

      {photos.length < minPhotos && (
        <div style={{ fontSize: 10.5, color: 'var(--color-danger)', marginBottom: 8 }}>
          ⚠️ Diperlukan minimal {minPhotos} foto (sudah {photos.length})
        </div>
      )}

      <button
        type="button" onClick={handleSubmit}
        disabled={!canSubmit || saving}
        style={{
          width: '100%', padding: '10px 0', borderRadius: 8,
          background: canSubmit ? 'var(--color-primary)' : 'var(--color-border)',
          color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
          cursor: canSubmit ? 'pointer' : 'default',
        }}
      >
        {saving ? 'Mengunggah…' : `📤 Upload ${photos.length} Foto Bukti`}
      </button>

      {/* Uploaded proof summary */}
      {activeWorkspaceId && (
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--color-muted)' }}>
          Diunggah sebagai: <strong>{WORKSPACES.find(w => w.id === activeWorkspaceId)?.name ?? activeWorkspaceId}</strong>
        </div>
      )}
    </div>
  );
}

// ─── Evidence List ─────────────────────────────────────────────────────────────

function EvidenceList({ items, title }: {
  items: { id: string; content: string; type: string; gps: string | null; timestamp: string; recipientName: string | null }[];
  title: string;
}) {
  if (items.length === 0) return null;
  const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  function fmtTs(ts: string) {
    const d = new Date(ts);
    return `${d.getDate()} ${BULAN[d.getMonth()]}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
        {title} ({items.length} bukti)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(ev => (
          <div key={ev.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: 8, padding: '8px 10px',
          }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{ev.content}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>
                {ev.type} · {fmtTs(ev.timestamp)}
              </div>
              {ev.gps && (
                <div style={{ fontSize: 10.5, color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📍 {ev.gps}
                </div>
              )}
              {ev.recipientName && (
                <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
                  👤 {ev.recipientName}
                </div>
              )}
            </div>
            <span style={{
              fontSize: 9, fontWeight: 700, color: 'var(--color-success)',
              background: 'rgba(22,163,74,0.12)', borderRadius: 4, padding: '2px 6px', flexShrink: 0,
            }}>✓ Upload</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Marketplace Transport Status Panel ───────────────────────────────────────

function MarketplaceTransportPanel({
  chatId,
  data,
  myRole,
  activeWorkspaceId,
  transportJoined,
  onRefresh,
  onOpenParticipants,
}: {
  chatId: string;
  data: NonNullable<ReturnType<typeof getOrCreateTransportConfig>['marketplace']>;
  myRole: string | null;
  activeWorkspaceId: string;
  transportJoined: boolean;
  onRefresh: () => void;
  onOpenParticipants: () => void;
}) {
  const [showPickupForm,   setShowPickupForm]   = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [confirmDecision, setConfirmDecision]  = useState<'Confirmed' | 'Disputed' | null>(null);
  const [confirmNote, setConfirmNote]          = useState('');
  const [advanceNote, setAdvanceNote]          = useState('');
  const [showAdvanceForm, setShowAdvanceForm]  = useState(false);
  const [tripForm, setTripForm]               = useState({ driverName: '', phone: '', vehicleType: VEHICLE_TYPES[0], plate: '', capacity: '4', departure: '', route: '' });
  const [showTripForm, setShowTripForm]        = useState(false);
  const [showEditTrip, setShowEditTrip]        = useState(false);
  const [editTripForm, setEditTripForm]        = useState({ driverName: '', phone: '', vehicleType: VEHICLE_TYPES[0], plate: '', capacity: '4', departure: '', route: '', notes: '', pickup: '', drop: '' });

  const cfg        = MARKETPLACE_TRANSPORT_STATUS_CONFIG[data.status];
  const isTransport = data.transportWorkspaceId === activeWorkspaceId;
  const isBuyer    = myRole === 'Pembeli';
  const isTerminal = TERMINAL_TRANSPORT_STATUSES.has(data.status);
  const trip       = getTripByChatId(chatId);

  // Next status to advance to
  const currentIdx = TRANSPORT_STATUS_FLOW.indexOf(data.status);
  const nextStatus: MarketplaceTransportStatus | null = (currentIdx >= 0 && currentIdx < TRANSPORT_STATUS_FLOW.length - 1)
    ? TRANSPORT_STATUS_FLOW[currentIdx + 1]
    : null;

  function handleAdvanceStatus() {
    if (!nextStatus) return;
    updateMarketplaceTransportStatus(chatId, nextStatus, activeWorkspaceId, advanceNote.trim() || null);
    if (trip) updateTripStatus(trip.id, nextStatus);
    setShowAdvanceForm(false);
    setAdvanceNote('');
    onRefresh();
  }

  function handleCancel() {
    updateMarketplaceTransportStatus(chatId, 'Cancelled', activeWorkspaceId, 'Dibatalkan.');
    onRefresh();
  }

  function openEditTrip() {
    if (!trip) return;
    const pickupStop = trip.stops[0];
    const dropStop   = trip.stops[1];
    setEditTripForm({
      driverName:  trip.driver.name,
      phone:       trip.driver.phone,
      vehicleType: trip.vehicle.type,
      plate:       trip.vehicle.licensePlate,
      capacity:    String(trip.vehicle.capacityHeads),
      departure:   trip.estimatedDeparture ?? '',
      route:       trip.route,
      notes:       trip.notes ?? '',
      pickup:      pickupStop?.locationName ?? '',
      drop:        dropStop?.locationName   ?? '',
    });
    setShowEditTrip(true);
  }

  function handleSaveEditTrip() {
    if (!trip) return;
    updateTrip(trip.id, {
      driverName:        editTripForm.driverName.trim(),
      driverPhone:       editTripForm.phone.trim(),
      vehicleType:       editTripForm.vehicleType,
      licensePlate:      editTripForm.plate.trim(),
      capacityHeads:     parseInt(editTripForm.capacity, 10) || 1,
      route:             editTripForm.route.trim(),
      estimatedDeparture: editTripForm.departure || null,
      notes:             editTripForm.notes.trim() || null,
    });
    const pickupStop = trip.stops[0];
    const dropStop   = trip.stops[1];
    if (pickupStop && editTripForm.pickup.trim()) {
      updateTripStop(trip.id, pickupStop.id, { locationName: editTripForm.pickup.trim() });
    }
    if (dropStop && editTripForm.drop.trim()) {
      updateTripStop(trip.id, dropStop.id, { locationName: editTripForm.drop.trim() });
    }
    logTripUpdated(chatId, activeWorkspaceId, trip.tripNumber);
    setShowEditTrip(false);
    onRefresh();
  }

  function handleGetLiveLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLiveLocation(chatId, {
            latitude: pos.coords.latitude, longitude: pos.coords.longitude,
            locationName: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
            speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : null,
            distanceRemaining: null, eta: null,
            sharedBy: activeWorkspaceId, isActive: true,
          });
          onRefresh();
        },
        () => {
          setLiveLocation(chatId, {
            latitude: null, longitude: null,
            locationName: 'Lokasi: izin ditolak — aktifkan manual',
            speed: null, distanceRemaining: null, eta: null,
            sharedBy: activeWorkspaceId, isActive: true,
          });
          onRefresh();
        },
        { timeout: 5000 },
      );
    } else {
      setLiveLocation(chatId, {
        latitude: null, longitude: null,
        locationName: 'Geolocation tidak tersedia di browser ini',
        speed: null, distanceRemaining: null, eta: null,
        sharedBy: activeWorkspaceId, isActive: true,
      });
      onRefresh();
    }
  }

  function handleCreateTrip() {
    const t = createTrip({
      workspaceIdTransport: activeWorkspaceId,
      driverName: tripForm.driverName,
      driverPhone: tripForm.phone,
      vehicleType: tripForm.vehicleType,
      licensePlate: tripForm.plate,
      capacityHeads: parseInt(tripForm.capacity, 10) || 4,
      route: tripForm.route,
      estimatedDeparture: tripForm.departure || undefined,
      initialChatId: chatId,
      listingTitle: 'Transaksi',
    });
    // Add default pickup & delivery stops
    const pickupStop = addTripStop(t.id, { locationName: 'Lokasi Pickup (Penjual)', address: null, eta: tripForm.departure || null, notes: null });
    const dropStop   = addTripStop(t.id, { locationName: 'Lokasi Tujuan (Pembeli)', address: null, eta: null, notes: null });
    if (pickupStop && dropStop) {
      // Assign stops to the transaction in the trip
      const tripFinal = getTripByChatId(chatId);
      if (tripFinal) {
        const tx = tripFinal.transactions.find(tx => tx.chatId === chatId);
        if (tx) { tx.pickupStopId = pickupStop.id; tx.dropStopId = dropStop.id; }
      }
    }
    // Wire trip to the transport config
    const config = getOrCreateTransportConfig(chatId);
    if (config.marketplace) config.marketplace.tripId = t.id;
    updateMarketplaceTransportStatus(chatId, 'Assigned', activeWorkspaceId, `Trip ${t.tripNumber} dibuat.`);
    setShowTripForm(false);
    onRefresh();
  }

  const iStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5,
    border: '1.5px solid var(--color-border)', background: 'var(--color-bg)',
    color: 'var(--color-text)', marginBottom: 8,
  };

  if (!transportJoined) {
    return (
      <div style={{
        background: 'rgba(37,99,235,0.05)', border: '1.5px solid rgba(37,99,235,0.2)',
        borderRadius: 10, padding: '14px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          🚚 Workspace Transport Belum Bergabung
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 10 }}>
          Undang Workspace Transport ke Transaction Room. Transport akan menerima penugasan, membuat Trip, dan mengelola pengiriman secara langsung di sini.
        </div>
        <button
          type="button" onClick={onOpenParticipants}
          style={{
            width: '100%', padding: '10px', borderRadius: 8,
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          ＋ Undang Transport ke Ruangan
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Status chip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        background: cfg.bg, border: `1px solid ${cfg.color}40`, borderRadius: 10, padding: '10px 12px',
      }}>
        <span style={{ fontSize: 20 }}>{cfg.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: 11, color: cfg.color, opacity: 0.8, lineHeight: 1.4 }}>{cfg.description}</div>
        </div>
      </div>

      {/* Status progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
          Progres Pengiriman
        </div>
        <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 4 }}>
          {TRANSPORT_STATUS_FLOW.filter(s => s !== 'Waiting Assignment').map((s, i) => {
            const sidx = TRANSPORT_STATUS_FLOW.indexOf(s);
            const done = currentIdx >= sidx;
            const active = s === data.status;
            const sCfg = MARKETPLACE_TRANSPORT_STATUS_CONFIG[s];
            return (
              <div key={s} title={sCfg.label} style={{
                flex: '0 0 auto', width: 28, height: 28, borderRadius: '50%', fontSize: 13,
                background: done ? sCfg.bg : 'var(--color-surface)',
                border: `2px solid ${active ? sCfg.color : done ? sCfg.color + '60' : 'var(--color-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? `0 0 0 2px ${sCfg.color}33` : 'none',
              }}>
                {sCfg.icon}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trip Info */}
      {trip ? (
        <div style={{
          background: 'var(--color-bg)', border: '1px solid var(--color-border)',
          borderRadius: 8, padding: '10px 12px', marginBottom: 12,
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.3, flex: 1 }}>
              🚛 Trip {trip.tripNumber}
            </div>
            {isTransport && !isTerminal && !showEditTrip && (
              <button
                type="button" onClick={openEditTrip}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
              >✏️ Edit</button>
            )}
          </div>

          {/* Edit form */}
          {showEditTrip ? (
            <div>
              {([
                { key: 'driverName', label: 'Nama Pengemudi *', type: 'text', ph: 'Nama Pengemudi' },
                { key: 'phone',      label: 'No. Telp Pengemudi *', type: 'text', ph: 'No. Telp Pengemudi' },
                { key: 'plate',      label: 'Plat Nomor *', type: 'text', ph: 'D 1234 AB' },
                { key: 'route',      label: 'Rute *', type: 'text', ph: 'Garut → Bandung' },
                { key: 'pickup',     label: 'Nama Lokasi Pickup', type: 'text', ph: 'Lokasi Pickup (Penjual)' },
                { key: 'drop',       label: 'Nama Lokasi Tujuan', type: 'text', ph: 'Lokasi Tujuan (Pembeli)' },
              ] as const).map(f => (
                <input
                  key={f.key} type={f.type}
                  placeholder={f.ph}
                  value={editTripForm[f.key]}
                  onChange={e => setEditTripForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginBottom: 8 }}
                />
              ))}
              <select
                value={editTripForm.vehicleType}
                onChange={e => setEditTripForm(f => ({ ...f, vehicleType: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginBottom: 8, appearance: 'none' }}
              >
                {VEHICLE_TYPES.map(vt => <option key={vt} value={vt}>{vt}</option>)}
              </select>
              <input
                type="number" placeholder="Kapasitas (ekor) *" min="1"
                value={editTripForm.capacity}
                onChange={e => setEditTripForm(f => ({ ...f, capacity: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginBottom: 8 }}
              />
              <input
                type="datetime-local"
                value={editTripForm.departure}
                onChange={e => setEditTripForm(f => ({ ...f, departure: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginBottom: 8 }}
              />
              <textarea
                placeholder="Catatan (opsional)"
                value={editTripForm.notes}
                onChange={e => setEditTripForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5, border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginBottom: 10, resize: 'none', lineHeight: 1.5 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowEditTrip(false)}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--color-muted)' }}>
                  Batal
                </button>
                <button
                  type="button" onClick={handleSaveEditTrip}
                  disabled={!editTripForm.driverName || !editTripForm.phone || !editTripForm.plate || !editTripForm.route}
                  style={{
                    flex: 2, padding: '9px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', color: '#fff',
                    background: (editTripForm.driverName && editTripForm.phone && editTripForm.plate && editTripForm.route) ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >💾 Simpan Perubahan Trip</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {([
                { label: 'Pengemudi', value: trip.driver.name },
                { label: 'Telp',      value: trip.driver.phone },
                { label: 'Kendaraan', value: `${trip.vehicle.type} · ${trip.vehicle.licensePlate}` },
                { label: 'Kapasitas', value: `${trip.vehicle.capacityHeads} ekor` },
                { label: 'Rute',      value: trip.route },
                { label: 'Stops',     value: `${trip.stops.length} titik` },
              ] as const).map(row => (
                <div key={row.label} style={{ background: 'var(--color-surface)', borderRadius: 6, padding: '6px 8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--color-muted)', marginBottom: 1 }}>{row.label}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</div>
                </div>
              ))}
              {trip.notes && (
                <div style={{ gridColumn: '1 / -1', background: 'var(--color-surface)', borderRadius: 6, padding: '6px 8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--color-muted)', marginBottom: 1 }}>Catatan</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)' }}>{trip.notes}</div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : isTransport ? (
        <>
          <button
            type="button" onClick={() => setShowTripForm(s => !s)}
            style={{
              width: '100%', marginBottom: 10, padding: '9px', borderRadius: 8,
              background: 'rgba(37,99,235,0.08)', border: '1.5px dashed rgba(37,99,235,0.3)',
              color: 'var(--color-primary)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {showTripForm ? '▲ Tutup Form Trip' : '＋ Buat Trip Pengiriman'}
          </button>
          {showTripForm && (
            <div style={{
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '12px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>
                Data Trip Pengiriman
              </div>
              <input type="text" placeholder="Nama Pengemudi *" value={tripForm.driverName}
                onChange={e => setTripForm(f => ({ ...f, driverName: e.target.value }))} style={iStyle} />
              <input type="text" placeholder="No. Telp Pengemudi *" value={tripForm.phone}
                onChange={e => setTripForm(f => ({ ...f, phone: e.target.value }))} style={iStyle} />
              <select value={tripForm.vehicleType}
                onChange={e => setTripForm(f => ({ ...f, vehicleType: e.target.value }))}
                style={{ ...iStyle, appearance: 'none' }}>
                {VEHICLE_TYPES.map(vt => <option key={vt} value={vt}>{vt}</option>)}
              </select>
              <input type="text" placeholder="Plat Nomor (cth: D 1234 AB) *" value={tripForm.plate}
                onChange={e => setTripForm(f => ({ ...f, plate: e.target.value }))} style={iStyle} />
              <input type="number" placeholder="Kapasitas (ekor) *" value={tripForm.capacity} min="1"
                onChange={e => setTripForm(f => ({ ...f, capacity: e.target.value }))} style={iStyle} />
              <input type="text" placeholder="Rute (cth: Garut → Bandung) *" value={tripForm.route}
                onChange={e => setTripForm(f => ({ ...f, route: e.target.value }))} style={iStyle} />
              <input type="datetime-local" placeholder="Est. Keberangkatan" value={tripForm.departure}
                onChange={e => setTripForm(f => ({ ...f, departure: e.target.value }))} style={{ ...iStyle, marginBottom: 10 }} />
              <button
                type="button" onClick={handleCreateTrip}
                disabled={!tripForm.driverName || !tripForm.phone || !tripForm.plate || !tripForm.route}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8,
                  background: (tripForm.driverName && tripForm.phone && tripForm.plate && tripForm.route)
                    ? 'var(--color-primary)' : 'var(--color-border)',
                  color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >🚛 Buat Trip</button>
            </div>
          )}
        </>
      ) : (
        <div style={{
          padding: '10px 12px', marginBottom: 12, fontSize: 12, color: 'var(--color-muted)',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8,
        }}>
          ⏳ Menunggu Transporter membuat Trip Pengiriman.
        </div>
      )}

      {/* Status Advance (Transport only, non-terminal) */}
      {isTransport && !isTerminal && nextStatus && (
        <div style={{ marginBottom: 12 }}>
          <button
            type="button" onClick={() => setShowAdvanceForm(s => !s)}
            style={{
              width: '100%', padding: '10px', borderRadius: 8, marginBottom: 6,
              background: MARKETPLACE_TRANSPORT_STATUS_CONFIG[nextStatus].bg,
              border: `1.5px solid ${MARKETPLACE_TRANSPORT_STATUS_CONFIG[nextStatus].color}50`,
              color: MARKETPLACE_TRANSPORT_STATUS_CONFIG[nextStatus].color,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {MARKETPLACE_TRANSPORT_STATUS_CONFIG[nextStatus].icon}{' '}
            Update → {MARKETPLACE_TRANSPORT_STATUS_CONFIG[nextStatus].label}
          </button>
          {showAdvanceForm && (
            <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px' }}>
              <textarea
                value={advanceNote} onChange={e => setAdvanceNote(e.target.value)}
                placeholder="Catatan tambahan (opsional)"
                rows={2}
                style={{ width: '100%', padding: '8px', borderRadius: 7, border: '1px solid var(--color-border)', fontSize: 12, resize: 'none', marginBottom: 8, background: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowAdvanceForm(false)}
                  style={{ flex: 1, padding: '8px', borderRadius: 7, background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--color-muted)' }}>
                  Batal
                </button>
                <button type="button" onClick={handleAdvanceStatus}
                  style={{ flex: 2, padding: '8px', borderRadius: 7, background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Konfirmasi
                </button>
              </div>
            </div>
          )}
          {!isTerminal && (
            <button type="button" onClick={handleCancel}
              style={{ width: '100%', padding: '7px', borderRadius: 8, background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              ✕ Batalkan Transport
            </button>
          )}
        </div>
      )}

      {/* Pickup Evidence */}
      {(data.status === 'Heading to Pickup' || data.status === 'Livestock Picked Up' || data.status === 'Loading' || (data.pickupEvidence && data.pickupEvidence.length > 0)) && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>
            📷 Bukti Pickup
          </div>
          <EvidenceList
            items={data.pickupEvidence.map(e => ({ id: e.id, content: e.content, type: e.type, gps: e.gps, timestamp: e.timestamp, recipientName: e.recipientName }))}
            title="Bukti Pickup Terunggah"
          />
          {isTransport && !isTerminal && (
            <>
              <button type="button" onClick={() => setShowPickupForm(s => !s)}
                style={{ width: '100%', padding: '8px', borderRadius: 8, marginBottom: 8, background: 'none', border: `1.5px dashed ${data.pickupEvidence.length >= 2 ? 'var(--color-border)' : 'var(--color-danger)'}`, color: data.pickupEvidence.length >= 2 ? 'var(--color-muted)' : 'var(--color-danger)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                {data.pickupEvidence.length >= 2 ? '＋ Tambah Bukti Pickup' : `⚠️ Upload Bukti Pickup (${data.pickupEvidence.length}/2 min)`}
              </button>
              {showPickupForm && (
                <TransportEvidenceUpload
                  phase="Pickup"
                  label="Upload Bukti Pickup (min 2 foto)"
                  activeWorkspaceId={activeWorkspaceId}
                  minPhotos={2}
                  requireReceiver={true}
                  onAdd={(photos, gps, receiver, note) => {
                    photos.forEach(p => addPickupEvidence(chatId, {
                      phase: 'Pickup', type: 'Foto', content: p,
                      gps, uploadedBy: activeWorkspaceId,
                      recipientName: receiver,
                    }));
                    if (note) addPickupEvidence(chatId, {
                      phase: 'Pickup', type: 'Catatan', content: note,
                      gps: null, uploadedBy: activeWorkspaceId, recipientName: null,
                    });
                    setShowPickupForm(false);
                    onRefresh();
                  }}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Live Location Panel */}
      {(data.status === 'On The Way' || data.status === 'Stopping' || data.status === 'Near Destination' || data.liveLocation) && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>
            📍 Lokasi Live
          </div>
          {data.liveLocation?.isActive ? (
            <div style={{
              background: 'rgba(22,163,74,0.07)', border: '1.5px solid rgba(22,163,74,0.3)',
              borderRadius: 10, padding: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>📡</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-success)' }}>Lokasi Aktif</div>
                  <div style={{ fontSize: 11, color: 'var(--color-success)', opacity: 0.8 }}>
                    Terakhir diperbarui: {(() => { const d = new Date(data.liveLocation.updatedAt); return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`; })()}
                  </div>
                </div>
                {isTransport && (
                  <button type="button" onClick={() => { clearLiveLocation(chatId); onRefresh(); }}
                    style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 20, background: '#c628281a', border: '1px solid #c6282840', color: 'var(--color-danger)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    ⏹ Stop
                  </button>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                📍 <strong>{data.liveLocation.locationName}</strong>
                {data.liveLocation.speed !== null && <><br />🏎️ Kecepatan: {data.liveLocation.speed} km/h</>}
                {data.liveLocation.distanceRemaining !== null && <><br />📏 Sisa jarak: {data.liveLocation.distanceRemaining} km</>}
                {data.liveLocation.eta && <><br />⏱️ ETA: {data.liveLocation.eta}</>}
              </div>
              {isTransport && (
                <button type="button" onClick={() => { setShowLocationPanel(s => !s); }}
                  style={{ marginTop: 8, width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.3)', color: 'var(--color-success)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                  {showLocationPanel ? '▲ Tutup Update Lokasi' : '🔄 Perbarui Lokasi'}
                </button>
              )}
              {showLocationPanel && isTransport && (
                <div style={{ marginTop: 8 }}>
                  <button type="button" onClick={() => { handleGetLiveLocation(); setShowLocationPanel(false); }}
                    style={{ width: '100%', padding: '9px', borderRadius: 8, background: 'var(--color-success)', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                    📍 Ambil GPS Sekarang
                  </button>
                </div>
              )}
            </div>
          ) : (
            isTransport ? (
              <button type="button" onClick={handleGetLiveLocation}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8,
                  background: 'rgba(22,163,74,0.08)', border: '1.5px dashed rgba(22,163,74,0.3)',
                  color: 'var(--color-success)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                }}>
                📍 Aktifkan Berbagi Lokasi Live
              </button>
            ) : (
              <div style={{ padding: '10px', fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                Transporter belum mengaktifkan live location.
              </div>
            )
          )}
        </div>
      )}

      {/* Delivery Evidence */}
      {(data.status === 'Delivered' || data.status === 'Near Destination' || data.status === 'Completed' || data.deliveryEvidence.length > 0) && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>
            📦 Bukti Pengiriman
          </div>
          <EvidenceList
            items={data.deliveryEvidence.map(e => ({ id: e.id, content: e.content, type: e.type, gps: e.gps, timestamp: e.timestamp, recipientName: e.recipientName }))}
            title="Bukti Pengiriman Terunggah"
          />
          {isTransport && !isTerminal && (
            <>
              <button type="button" onClick={() => setShowDeliveryForm(s => !s)}
                style={{ width: '100%', padding: '8px', borderRadius: 8, marginBottom: 8, background: 'none', border: `1.5px dashed ${data.deliveryEvidence.length >= 2 ? 'var(--color-border)' : 'var(--color-danger)'}`, color: data.deliveryEvidence.length >= 2 ? 'var(--color-muted)' : 'var(--color-danger)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                {data.deliveryEvidence.length >= 2 ? '＋ Tambah Bukti Pengiriman' : `⚠️ Upload Bukti Pengiriman (${data.deliveryEvidence.length}/2 min)`}
              </button>
              {showDeliveryForm && (
                <TransportEvidenceUpload
                  phase="Delivery"
                  label="Upload Bukti Pengiriman (min 2 foto)"
                  activeWorkspaceId={activeWorkspaceId}
                  minPhotos={2}
                  requireReceiver={true}
                  onAdd={(photos, gps, receiver, note) => {
                    photos.forEach(p => addDeliveryEvidence(chatId, {
                      phase: 'Delivery', type: 'Foto', content: p,
                      gps, uploadedBy: activeWorkspaceId, recipientName: receiver,
                    }));
                    if (note) addDeliveryEvidence(chatId, {
                      phase: 'Delivery', type: 'Catatan', content: note,
                      gps: null, uploadedBy: activeWorkspaceId, recipientName: null,
                    });
                    // Auto-advance to Delivered if enough evidence
                    const cfg2 = getOrCreateTransportConfig(chatId);
                    if ((cfg2.marketplace?.deliveryEvidence.length ?? 0) >= 2 && data.status !== 'Delivered' && data.status !== 'Completed') {
                      updateMarketplaceTransportStatus(chatId, 'Delivered', activeWorkspaceId, 'Bukti pengiriman terunggah.');
                      if (trip) updateTripStatus(trip.id, 'Delivered');
                    }
                    setShowDeliveryForm(false);
                    onRefresh();
                  }}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Buyer Confirmation */}
      {data.status === 'Delivered' && isBuyer && !data.buyerConfirmation && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>
            ✅ Konfirmasi Penerimaan
          </div>
          <div style={{
            background: 'rgba(22,163,74,0.06)', border: '1.5px solid rgba(22,163,74,0.25)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 10,
            fontSize: 12, color: 'var(--color-primary)', lineHeight: 1.5,
          }}>
            Transporter melaporkan barang/ternak telah tiba. Periksa kondisi dan konfirmasi penerimaan. Konfirmasi akan merilis dana Escrow ke Penjual.
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: confirmDecision ? 10 : 0 }}>
            <button type="button" onClick={() => setConfirmDecision('Confirmed')}
              style={{ flex: 1, padding: '10px 8px', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', border: `1.5px solid ${confirmDecision === 'Confirmed' ? 'var(--color-success)' : 'var(--color-border)'}`, background: confirmDecision === 'Confirmed' ? 'rgba(22,163,74,0.12)' : 'var(--color-bg)', color: confirmDecision === 'Confirmed' ? 'var(--color-success)' : 'var(--color-muted)' }}>
              ✅ Terima Sesuai
            </button>
            <button type="button" onClick={() => setConfirmDecision('Disputed')}
              style={{ flex: 1, padding: '10px 8px', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', border: `1.5px solid ${confirmDecision === 'Disputed' ? 'var(--color-danger)' : 'var(--color-border)'}`, background: confirmDecision === 'Disputed' ? 'rgba(198,40,40,0.1)' : 'var(--color-bg)', color: confirmDecision === 'Disputed' ? 'var(--color-danger)' : 'var(--color-muted)' }}>
              ⚠️ Laporkan Masalah
            </button>
          </div>
          {confirmDecision && (
            <div style={{ marginTop: 8 }}>
              <textarea
                value={confirmNote} onChange={e => setConfirmNote(e.target.value)}
                rows={2} placeholder={confirmDecision === 'Disputed' ? 'Jelaskan masalah yang ditemukan (wajib) *' : 'Catatan tambahan (opsional)'}
                style={{ width: '100%', padding: '8px', borderRadius: 7, border: '1px solid var(--color-border)', fontSize: 12, resize: 'none', marginBottom: 8, background: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
              <button
                type="button"
                disabled={confirmDecision === 'Disputed' && !confirmNote.trim()}
                onClick={() => {
                  setBuyerConfirmation(chatId, confirmDecision, activeWorkspaceId, confirmNote.trim() || null);
                  onRefresh();
                }}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none',
                  background: confirmDecision === 'Confirmed' ? 'var(--color-success)' : (confirmNote.trim() ? 'var(--color-danger)' : 'var(--color-border)'),
                  color: '#fff',
                }}
              >
                {confirmDecision === 'Confirmed' ? '✅ Konfirmasi Penerimaan' : '⚠️ Kirim Laporan Masalah'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation result */}
      {data.buyerConfirmation && (
        <div style={{
          background: data.buyerConfirmation === 'Confirmed' ? 'rgba(22,163,74,0.08)' : 'rgba(198,40,40,0.08)',
          border: `1px solid ${data.buyerConfirmation === 'Confirmed' ? 'rgba(22,163,74,0.3)' : 'rgba(198,40,40,0.3)'}`,
          borderRadius: 8, padding: '10px 12px', marginBottom: 12,
          fontSize: 12, color: data.buyerConfirmation === 'Confirmed' ? 'var(--color-primary)' : 'var(--color-danger)', lineHeight: 1.5,
        }}>
          {data.buyerConfirmation === 'Confirmed' ? '✅ Buyer mengonfirmasi penerimaan.' : '⚠️ Buyer melaporkan masalah.'}
          {data.buyerNote && <div style={{ marginTop: 4 }}>Catatan: {data.buyerNote}</div>}
        </div>
      )}
    </div>
  );
}

// ─── External Transport Panel ─────────────────────────────────────────────────

function ExternalTransportPanel({
  chatId,
  data,
  myRole,
  activeWorkspaceId,
  onRefresh,
}: {
  chatId: string;
  data: NonNullable<ReturnType<typeof getOrCreateTransportConfig>['external']>;
  myRole: string | null;
  activeWorkspaceId: string;
  onRefresh: () => void;
}) {
  const [editing, setEditing]   = useState(!data.companyName);
  const [showPickup, setShowPickup] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);
  const [form, setForm] = useState({
    companyName: data.companyName, driverName: data.driverName,
    vehicle: data.vehicle, phone: data.phone,
    receiptNumber: data.receiptNumber ?? '', notes: data.notes,
  });
  const isBuyer  = myRole === 'Pembeli';
  const isSeller = myRole === 'Penjual';
  const cfg = EXTERNAL_STATUS_CONFIG[data.status];
  const iStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5,
    border: '1.5px solid var(--color-border)', background: 'var(--color-bg)',
    color: 'var(--color-text)', marginBottom: 8,
  };

  function handleSave() {
    updateExternalTransportInfo(chatId, {
      companyName: form.companyName, driverName: form.driverName,
      vehicle: form.vehicle, phone: form.phone,
      receiptNumber: form.receiptNumber || null, notes: form.notes,
    }, activeWorkspaceId);
    setEditing(false);
    onRefresh();
  }

  const STATUSES: Array<typeof data.status> = ['Configured', 'Pickup Done', 'In Transit', 'Delivered', 'Completed'];
  const statusIdx = STATUSES.indexOf(data.status);
  const nextStatus = statusIdx < STATUSES.length - 1 ? STATUSES[statusIdx + 1] : null;

  return (
    <div>
      {/* Status chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, background: cfg.bg, border: `1px solid ${cfg.color}40`, borderRadius: 10, padding: '10px 12px' }}>
        <span style={{ fontSize: 20 }}>{cfg.icon}</span>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: cfg.color, flex: 1 }}>{cfg.label}</div>
        {nextStatus && (isBuyer || isSeller) && (
          <button type="button"
            onClick={() => { updateExternalTransportStatus(chatId, nextStatus, activeWorkspaceId); onRefresh(); }}
            style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 20, background: EXTERNAL_STATUS_CONFIG[nextStatus].bg, border: `1px solid ${EXTERNAL_STATUS_CONFIG[nextStatus].color}40`, color: EXTERNAL_STATUS_CONFIG[nextStatus].color, fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
            → {EXTERNAL_STATUS_CONFIG[nextStatus].label}
          </button>
        )}
      </div>

      {/* Info / Edit form */}
      {!editing && data.companyName ? (
        <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>🏢 Info Transport Eksternal</div>
          {[
            { label: 'Perusahaan', value: data.companyName },
            { label: 'Pengemudi', value: data.driverName },
            { label: 'Kendaraan', value: data.vehicle },
            { label: 'Telp', value: data.phone },
            { label: 'No. Resi', value: data.receiptNumber ?? '—' },
            { label: 'Catatan', value: data.notes || '—' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{row.label}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)' }}>{row.value}</span>
            </div>
          ))}
          <button type="button" onClick={() => setEditing(true)}
            style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--color-muted)' }}>
            ✏️ Edit Info
          </button>
        </div>
      ) : (
        <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>Info Transport Eksternal</div>
          <input type="text" placeholder="Nama Perusahaan *" value={form.companyName}
            onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} style={iStyle} />
          <input type="text" placeholder="Nama Pengemudi *" value={form.driverName}
            onChange={e => setForm(f => ({ ...f, driverName: e.target.value }))} style={iStyle} />
          <input type="text" placeholder="Jenis Kendaraan & Plat *" value={form.vehicle}
            onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))} style={iStyle} />
          <input type="text" placeholder="No. Telp Pengemudi *" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={iStyle} />
          <input type="text" placeholder="No. Resi (opsional)" value={form.receiptNumber}
            onChange={e => setForm(f => ({ ...f, receiptNumber: e.target.value }))} style={iStyle} />
          <textarea placeholder="Catatan (opsional)" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
            style={{ ...iStyle, resize: 'none', lineHeight: 1.5, marginBottom: 10 }} />
          <button type="button" onClick={handleSave}
            disabled={!form.companyName || !form.driverName || !form.vehicle || !form.phone}
            style={{
              width: '100%', padding: '10px', borderRadius: 8,
              background: (form.companyName && form.driverName && form.vehicle && form.phone) ? 'var(--color-primary)' : 'var(--color-border)',
              color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
            💾 Simpan Info Transport
          </button>
        </div>
      )}

      {/* Pickup Evidence */}
      <div style={{ marginBottom: 12 }}>
        <EvidenceList items={data.pickupEvidence.map(e => ({ id: e.id, content: e.content, type: e.type, gps: e.gps, timestamp: e.timestamp, recipientName: e.recipientName }))} title="Bukti Pickup" />
        <button type="button" onClick={() => setShowPickup(s => !s)}
          style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'none', border: '1.5px dashed var(--color-border)', color: 'var(--color-muted)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', marginBottom: showPickup ? 8 : 0 }}>
          {showPickup ? '▲ Tutup Form Pickup' : `📷 Upload Bukti Pickup (${data.pickupEvidence.length} terunggah)`}
        </button>
        {showPickup && (
          <TransportEvidenceUpload
            phase="Pickup" label="Bukti Pickup Eksternal" activeWorkspaceId={activeWorkspaceId} minPhotos={1} requireReceiver={true}
            onAdd={(photos, gps, receiver, note) => {
              photos.forEach(p => addExternalEvidence(chatId, 'pickup', { phase: 'Pickup', type: 'Foto', content: p, gps, uploadedBy: activeWorkspaceId, recipientName: receiver }));
              if (note) addExternalEvidence(chatId, 'pickup', { phase: 'Pickup', type: 'Catatan', content: note, gps: null, uploadedBy: activeWorkspaceId, recipientName: null });
              setShowPickup(false); onRefresh();
            }}
          />
        )}
      </div>

      {/* Delivery Evidence */}
      <div style={{ marginBottom: 12 }}>
        <EvidenceList items={data.deliveryEvidence.map(e => ({ id: e.id, content: e.content, type: e.type, gps: e.gps, timestamp: e.timestamp, recipientName: e.recipientName }))} title="Bukti Pengiriman" />
        <button type="button" onClick={() => setShowDelivery(s => !s)}
          style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'none', border: '1.5px dashed var(--color-border)', color: 'var(--color-muted)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', marginBottom: showDelivery ? 8 : 0 }}>
          {showDelivery ? '▲ Tutup Form Pengiriman' : `📷 Upload Bukti Pengiriman (${data.deliveryEvidence.length} terunggah)`}
        </button>
        {showDelivery && (
          <TransportEvidenceUpload
            phase="Delivery" label="Bukti Pengiriman Eksternal" activeWorkspaceId={activeWorkspaceId} minPhotos={1} requireReceiver={true}
            onAdd={(photos, gps, receiver, note) => {
              photos.forEach(p => addExternalEvidence(chatId, 'delivery', { phase: 'Delivery', type: 'Foto', content: p, gps, uploadedBy: activeWorkspaceId, recipientName: receiver }));
              if (note) addExternalEvidence(chatId, 'delivery', { phase: 'Delivery', type: 'Catatan', content: note, gps: null, uploadedBy: activeWorkspaceId, recipientName: null });
              setShowDelivery(false); onRefresh();
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Seller Arranges Panel ────────────────────────────────────────────────────

function SellerArrangesPanel({
  chatId,
  data,
  myRole,
  activeWorkspaceId,
  onRefresh,
}: {
  chatId: string;
  data: NonNullable<ReturnType<typeof getOrCreateTransportConfig>['sellerArranges']>;
  myRole: string | null;
  activeWorkspaceId: string;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(!data.transportDescription);
  const [showEvidence, setShowEvidence] = useState(false);
  const [form, setForm] = useState({
    desc: data.transportDescription, driver: data.driverName ?? '',
    vehicle: data.vehicle ?? '', phone: data.phone ?? '', notes: data.notes,
  });
  const isSeller = myRole === 'Penjual';
  const cfg = SELLER_ARRANGES_STATUS_CONFIG[data.status];
  const iStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5,
    border: '1.5px solid var(--color-border)', background: 'var(--color-bg)',
    color: 'var(--color-text)', marginBottom: 8,
  };
  const STATUSES: Array<typeof data.status> = ['Arranging', 'Dispatched', 'Delivered', 'Completed'];
  const statusIdx = STATUSES.indexOf(data.status);
  const nextStatus = statusIdx < STATUSES.length - 1 ? STATUSES[statusIdx + 1] : null;

  function handleSave() {
    updateSellerArrangesInfo(chatId, { transportDescription: form.desc, driverName: form.driver || null, vehicle: form.vehicle || null, phone: form.phone || null, notes: form.notes }, activeWorkspaceId);
    setEditing(false); onRefresh();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, background: cfg.bg, border: `1px solid ${cfg.color}40`, borderRadius: 10, padding: '10px 12px' }}>
        <span style={{ fontSize: 20 }}>{cfg.icon}</span>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: cfg.color, flex: 1 }}>{cfg.label}</div>
        {nextStatus && isSeller && (
          <button type="button" onClick={() => { updateSellerArrangesStatus(chatId, nextStatus, activeWorkspaceId); onRefresh(); }}
            style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 20, background: SELLER_ARRANGES_STATUS_CONFIG[nextStatus].bg, border: `1px solid ${SELLER_ARRANGES_STATUS_CONFIG[nextStatus].color}40`, color: SELLER_ARRANGES_STATUS_CONFIG[nextStatus].color, fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
            → {SELLER_ARRANGES_STATUS_CONFIG[nextStatus].label}
          </button>
        )}
      </div>

      {!editing && data.transportDescription ? (
        <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>🏪 Info Pengiriman Seller</div>
          {[
            { label: 'Keterangan', value: data.transportDescription },
            { label: 'Pengemudi', value: data.driverName ?? '—' },
            { label: 'Kendaraan', value: data.vehicle ?? '—' },
            { label: 'Telp', value: data.phone ?? '—' },
            { label: 'Catatan', value: data.notes || '—' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{row.label}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', maxWidth: '65%', textAlign: 'right' }}>{row.value}</span>
            </div>
          ))}
          {isSeller && (
            <button type="button" onClick={() => setEditing(true)}
              style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--color-muted)' }}>
              ✏️ Edit Info
            </button>
          )}
        </div>
      ) : isSeller ? (
        <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>Info Pengiriman Seller</div>
          <textarea placeholder="Deskripsi metode pengiriman *" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={2} style={{ ...iStyle, resize: 'none' }} />
          <input type="text" placeholder="Nama Pengemudi (opsional)" value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} style={iStyle} />
          <input type="text" placeholder="Kendaraan (opsional)" value={form.vehicle} onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))} style={iStyle} />
          <input type="text" placeholder="No. Telp (opsional)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={iStyle} />
          <textarea placeholder="Catatan (opsional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ ...iStyle, resize: 'none', marginBottom: 10 }} />
          <button type="button" onClick={handleSave} disabled={!form.desc}
            style={{ width: '100%', padding: '10px', borderRadius: 8, background: form.desc ? 'var(--color-primary)' : 'var(--color-border)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            💾 Simpan Info Pengiriman
          </button>
        </div>
      ) : (
        <div style={{ padding: '10px', fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 8, border: '1px solid var(--color-border)', marginBottom: 12 }}>
          ⏳ Seller sedang mengatur pengiriman.
        </div>
      )}

      <EvidenceList items={data.evidence.map(e => ({ id: e.id, content: e.content, type: e.type, gps: e.gps, timestamp: e.timestamp, recipientName: e.recipientName }))} title="Bukti Pengiriman Seller" />
      {isSeller && (
        <>
          <button type="button" onClick={() => setShowEvidence(s => !s)}
            style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'none', border: '1.5px dashed var(--color-border)', color: 'var(--color-muted)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', marginBottom: showEvidence ? 8 : 0 }}>
            {showEvidence ? '▲ Tutup' : `📷 Upload Bukti Pengiriman (${data.evidence.length} terunggah)`}
          </button>
          {showEvidence && (
            <TransportEvidenceUpload
              phase="Delivery" label="Bukti Pengiriman Seller" activeWorkspaceId={activeWorkspaceId} minPhotos={1} requireReceiver={false}
              onAdd={(photos, gps, receiver, note) => {
                photos.forEach(p => addSellerArrangesEvidence(chatId, { phase: 'Delivery', type: 'Foto', content: p, gps, uploadedBy: activeWorkspaceId, recipientName: receiver }));
                if (note) addSellerArrangesEvidence(chatId, { phase: 'Delivery', type: 'Catatan', content: note, gps: null, uploadedBy: activeWorkspaceId, recipientName: null });
                setShowEvidence(false); onRefresh();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── Buyer Pickup Panel ───────────────────────────────────────────────────────

function BuyerPickupPanel({
  chatId,
  data,
  myRole,
  activeWorkspaceId,
  onRefresh,
}: {
  chatId: string;
  data: NonNullable<ReturnType<typeof getOrCreateTransportConfig>['buyerPickup']>;
  myRole: string | null;
  activeWorkspaceId: string;
  onRefresh: () => void;
}) {
  const [date, setDate]   = useState(data.scheduledDate ?? '');
  const [time, setTime]   = useState(data.scheduledTime ?? '');
  const [notes, setNotes] = useState(data.notes);
  const [savedSchedule, setSavedSchedule] = useState(!!data.scheduledDate);
  const [confirmNote, setConfirmNote] = useState('');
  const isBuyer  = myRole === 'Pembeli';
  const isSeller = myRole === 'Penjual';
  const cfg = BUYER_PICKUP_STATUS_CONFIG[data.status];
  const iStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5,
    border: '1.5px solid var(--color-border)', background: 'var(--color-bg)',
    color: 'var(--color-text)', marginBottom: 8,
  };

  function handleSaveSchedule() {
    updateBuyerPickupSchedule(chatId, { scheduledDate: date || undefined, scheduledTime: time || undefined, notes }, activeWorkspaceId);
    setSavedSchedule(true); onRefresh();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, background: cfg.bg, border: `1px solid ${cfg.color}40`, borderRadius: 10, padding: '10px 12px' }}>
        <span style={{ fontSize: 20 }}>{cfg.icon}</span>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: cfg.color, flex: 1 }}>{cfg.label}</div>
      </div>

      {/* Schedule form */}
      {(!savedSchedule || data.status === 'Scheduled') && isBuyer && (
        <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>📅 Jadwal Pickup</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={iStyle} />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={iStyle} />
          <textarea placeholder="Catatan untuk Seller (opsional)" value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...iStyle, resize: 'none', marginBottom: 10 }} />
          <button type="button" onClick={handleSaveSchedule}
            style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            📅 Konfirmasi Jadwal Pickup
          </button>
        </div>
      )}

      {/* Saved schedule display */}
      {savedSchedule && data.status === 'Scheduled' && (
        <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
          📅 Jadwal Pickup: <strong>{data.scheduledDate ?? '—'}</strong>
          {data.scheduledTime && <> pukul <strong>{data.scheduledTime}</strong></>}
          {data.notes && <div style={{ marginTop: 4, color: 'var(--color-muted)' }}>Catatan: {data.notes}</div>}
          {isBuyer && (
            <button type="button" onClick={() => setSavedSchedule(false)}
              style={{ marginTop: 8, padding: '5px 10px', borderRadius: 6, background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--color-muted)' }}>
              ✏️ Ubah Jadwal
            </button>
          )}
        </div>
      )}

      {/* Buyer: mark as picked up */}
      {data.status === 'Scheduled' && isBuyer && (
        <div style={{ marginBottom: 12 }}>
          <textarea value={confirmNote} onChange={e => setConfirmNote(e.target.value)} rows={2} placeholder="Catatan saat pickup (opsional)" style={{ width: '100%', padding: '8px', borderRadius: 7, border: '1px solid var(--color-border)', fontSize: 12, resize: 'none', marginBottom: 8, background: 'var(--color-bg)', color: 'var(--color-text)' }} />
          <button type="button"
            onClick={() => { recordBuyerPickedUp(chatId, activeWorkspaceId, confirmNote.trim() || null); setConfirmNote(''); onRefresh(); }}
            style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'var(--color-warning)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            🛒 Saya Sudah Mengambil Barang/Ternak
          </button>
        </div>
      )}

      {/* Seller: confirm pickup */}
      {data.status === 'Picked Up' && isSeller && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ padding: '10px 12px', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: 8, fontSize: 12, color: 'var(--color-warning)', lineHeight: 1.5, marginBottom: 8 }}>
            🛒 Buyer melaporkan sudah mengambil barang/ternak. Konfirmasi bahwa pengambilan benar-benar terjadi.
            {data.pickedUpAt && <div style={{ marginTop: 4, fontSize: 10.5, color: 'var(--color-muted)' }}>Waktu: {new Date(data.pickedUpAt).toLocaleString('id-ID')}</div>}
          </div>
          <button type="button"
            onClick={() => { confirmBuyerPickup(chatId, activeWorkspaceId); onRefresh(); }}
            style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'var(--color-success)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            ✅ Konfirmasi — Buyer Sudah Ambil
          </button>
        </div>
      )}

      {/* Confirmed state */}
      {data.status === 'Confirmed' && (
        <div style={{ padding: '10px 12px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 8, fontSize: 12, color: 'var(--color-primary)', lineHeight: 1.5, marginBottom: 12 }}>
          ✅ Pickup dikonfirmasi oleh Seller.
          {data.confirmedAt && <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 4 }}>Waktu: {new Date(data.confirmedAt).toLocaleString('id-ID')}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Transport Sheet ──────────────────────────────────────────────────────────
// FARM-FIX-005.7 — Full transport configuration & workflow sheet.

export function TransportSheet({
  chatId,
  deal,
  activeWorkspaceId,
  myRole,
  onClose,
  onTick,
  onOpenParticipants,
}: {
  chatId: string;
  deal: Deal | undefined;
  activeWorkspaceId: string;
  myRole: ReturnType<typeof getMyRole>;
  onClose: () => void;
  onTick: () => void;
  onOpenParticipants: () => void;
}) {
  const [localTick, setLocalTick] = useState(0);
  const [modeToSet, setModeToSet] = useState<TransportMode | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showAI, setShowAI] = useState(true);

  function refresh() { setLocalTick(t => t + 1); onTick(); }

  const config = getOrCreateTransportConfig(chatId);
  const transportInvitations = getJoinedServiceParticipants(chatId).filter(p => p.serviceRole === 'Transport');
  const transportJoined = transportInvitations.length > 0;

  // Resolve AI context
  const escrowWf = getEscrowWorkflow(chatId);
  const aiCtx = {
    dealStatus: deal?.status ?? null,
    escrowStatus: escrowWf?.status ?? null,
    transportMode: config.mode,
    transportStatus: config.marketplace?.status ?? config.external?.status ?? config.sellerArranges?.status ?? config.buyerPickup?.status ?? null,
    myRole: myRole ?? null,
    recentMessages: getChatMessages(chatId).slice(-5).map(m => m.konten),
  };
  const aiSuggestions = generateAISuggestions(aiCtx);

  const MODES: TransportMode[] = ['Marketplace', 'External', 'SellerArranges', 'BuyerPickup'];

  const sharedStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 500,
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
  };

  return (
    <div style={sharedStyle}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div style={{
        position: 'relative', background: 'var(--color-surface)',
        borderRadius: '16px 16px 0 0',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
        maxHeight: '90vh', overflowY: 'auto',
        maxWidth: 480, width: '100%', margin: '0 auto',
      }}>
        {/* Handle */}
        <div style={{ textAlign: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)', display: 'inline-block' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 16px 12px', borderBottom: '1px solid var(--color-border)',
        }}>
          <span style={{ fontSize: 22 }}>🚚</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>
              {config.mode ? TRANSPORT_MODE_CONFIG[config.mode].label : 'Transport Pengiriman'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              {config.mode ? getTransportStatusLabel(config) : 'Pilih metode pengiriman'}
            </div>
          </div>
          <button
            type="button" onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%', fontSize: 14,
              background: 'var(--color-border)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-muted)',
            }}
          >✕</button>
        </div>

        <div style={{ padding: '14px 16px' }}>

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <button type="button" onClick={() => setShowAI(s => !s)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: '4px 0 6px', cursor: 'pointer' }}>
                <span style={{ fontSize: 13 }}>🤖</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  Saran AI ({aiSuggestions.length})
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-muted)' }}>{showAI ? '▲' : '▼'}</span>
              </button>
              {showAI && (
                <AISuggestionsPanel
                  suggestions={aiSuggestions}
                  onAction={key => {
                    if (key === 'open_participants') { onClose(); onOpenParticipants(); }
                    else if (key === 'open_deal' || key === 'open_escrow') { onClose(); }
                    // other keys handled inline in sheet
                  }}
                />
              )}
            </div>
          )}

          {/* Mode Selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)',
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
            }}>
              Metode Pengiriman
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {MODES.map(mode => {
                const mc = TRANSPORT_MODE_CONFIG[mode];
                const isActive = config.mode === mode;
                return (
                  <button
                    key={mode} type="button"
                    onClick={() => setModeToSet(mode)}
                    style={{
                      padding: '10px 10px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                      background: isActive ? mc.bg : (modeToSet === mode ? mc.bg + '80' : 'var(--color-bg)'),
                      border: `1.5px solid ${isActive ? mc.color : (modeToSet === mode ? mc.color + '60' : 'var(--color-border)')}`,
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{mc.icon}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: isActive ? mc.color : 'var(--color-text)', marginBottom: 2 }}>
                      {mc.label}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.4 }}>
                      {mc.description}
                    </div>
                    {isActive && (
                      <div style={{ marginTop: 4, fontSize: 9, fontWeight: 700, color: mc.color, background: mc.bg, borderRadius: 4, padding: '2px 6px', display: 'inline-block' }}>
                        ✓ Aktif
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Confirm mode change */}
            {modeToSet && modeToSet !== config.mode && (
              <div style={{ marginTop: 10, padding: '10px 12px', background: TRANSPORT_MODE_CONFIG[modeToSet].bg, border: `1.5px solid ${TRANSPORT_MODE_CONFIG[modeToSet].color}40`, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: TRANSPORT_MODE_CONFIG[modeToSet].color, marginBottom: 8, fontWeight: 700 }}>
                  {TRANSPORT_MODE_CONFIG[modeToSet].icon} Ganti ke: {TRANSPORT_MODE_CONFIG[modeToSet].label}
                </div>
                {config.mode && (
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 8 }}>
                    ⚠️ Perubahan mode tidak menghapus data mode saat ini.
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setModeToSet(null)}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--color-muted)' }}>
                    Batal
                  </button>
                  <button type="button" onClick={() => {
                    setTransportMode(chatId, modeToSet, activeWorkspaceId);
                    setModeToSet(null); refresh();
                  }}
                    style={{ flex: 2, padding: '8px', borderRadius: 8, background: TRANSPORT_MODE_CONFIG[modeToSet].color, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    ✓ Konfirmasi
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          {config.mode && <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0 14px' }} />}

          {/* Mode Content */}
          {config.mode === 'Marketplace' && config.marketplace && (
            <MarketplaceTransportPanel
              key={localTick}
              chatId={chatId}
              data={config.marketplace}
              myRole={myRole}
              activeWorkspaceId={activeWorkspaceId}
              transportJoined={transportJoined}
              onRefresh={refresh}
              onOpenParticipants={() => { onClose(); onOpenParticipants(); }}
            />
          )}
          {config.mode === 'External' && config.external && (
            <ExternalTransportPanel
              key={localTick}
              chatId={chatId}
              data={config.external}
              myRole={myRole}
              activeWorkspaceId={activeWorkspaceId}
              onRefresh={refresh}
            />
          )}
          {config.mode === 'SellerArranges' && config.sellerArranges && (
            <SellerArrangesPanel
              key={localTick}
              chatId={chatId}
              data={config.sellerArranges}
              myRole={myRole}
              activeWorkspaceId={activeWorkspaceId}
              onRefresh={refresh}
            />
          )}
          {config.mode === 'BuyerPickup' && config.buyerPickup && (
            <BuyerPickupPanel
              key={localTick}
              chatId={chatId}
              data={config.buyerPickup}
              myRole={myRole}
              activeWorkspaceId={activeWorkspaceId}
              onRefresh={refresh}
            />
          )}

          {/* Transport Timeline */}
          {config.timeline.length > 0 && (
            <TransportTimelineLog events={config.timeline} />
          )}

          <div style={{ height: 20 }} />
        </div>
      </div>
    </div>
  );
}
