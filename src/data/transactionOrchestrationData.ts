// ─── FARM-FIX-005.9 — Transaction Orchestration State Machine ─────────────────
// ONE authoritative transaction state derived by reading ALL existing modules.
// Does NOT replace any existing data layer — reads from them and computes
// the unified orchestration view.
//
// State machine (ordered):
//   Draft → Negotiation → Deal Proposed → Deal Locked →
//   Service Configuration → Payment → Transport → Delivery →
//   Buyer Confirmation → Settlement → Completed
//
// Alternative endings: Cancelled | Refunded | Disputed

import { onOrchestrationMutation } from './orchestrationBus';
import {
  getTransaksiById,
  type TransaksiItem,
  type TransaksiStatus,
} from './marketplaceTransaksiData';
import {
  getDealByChatId,
  type Deal,
} from './dealData';
import {
  getEscrowByTransaksiId,
  type EscrowRecord,
} from './transaksiEscrowData';
import {
  getEscrowConfig,
  type EscrowConfigRecord,
} from './escrowConfigData';
import {
  getTransportConfig,
  type TransportConfig,
} from './transportConfigData';
import {
  getConversationByTransaksiId,
  getConversationParticipants,
  type ConversationRoom,
  type ConversationParticipant,
} from './transaksiConversationData';
import {
  allRequiredQuotationsLocked,
  computeGrandTotal,
  getLockedQuotationsByChatId,
  getQuotationsByChatId,
} from './serviceQuotationData';
import { WORKSPACES } from '../components/TopAppBar';

// ─── Orchestration Status ──────────────────────────────────────────────────────

export type OrchestrationStatus =
  | 'Draft'
  | 'Negotiation'
  | 'Deal Proposed'
  | 'Deal Locked'
  | 'Service Configuration'
  | 'Payment'
  | 'Transport'
  | 'Delivery'
  | 'Buyer Confirmation'
  | 'Settlement'
  | 'Completed'
  | 'Cancelled'
  | 'Refunded'
  | 'Disputed';

export const ORCHESTRATION_STATUS_ORDER: OrchestrationStatus[] = [
  'Draft',
  'Negotiation',
  'Deal Proposed',
  'Deal Locked',
  'Service Configuration',
  'Payment',
  'Transport',
  'Delivery',
  'Buyer Confirmation',
  'Settlement',
  'Completed',
];

export const TERMINAL_ORCHESTRATION_STATUSES = new Set<OrchestrationStatus>([
  'Completed', 'Cancelled', 'Refunded', 'Disputed',
]);

export const ORCHESTRATION_STATUS_CONFIG: Record<
  OrchestrationStatus,
  { icon: string; color: string; bg: string; label: string; description: string; step: number }
> = {
  'Draft':                { icon: '📝', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Draft',                  description: 'Transaksi baru dibuat, menunggu negosiasi.',              step: 1 },
  'Negotiation':          { icon: '🤝', color: '#d97706', bg: 'rgba(217,119,6,0.1)',   label: 'Negosiasi',              description: 'Buyer dan Seller sedang menegosiasikan syarat deal.',      step: 2 },
  'Deal Proposed':        { icon: '📋', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', label: 'Deal Diajukan',          description: 'Deal diajukan, menunggu persetujuan kedua pihak.',         step: 3 },
  'Deal Locked':          { icon: '🔒', color: '#2563eb', bg: 'rgba(37,99,235,0.1)',   label: 'Deal Terkunci',          description: 'Kedua pihak menyetujui deal. Harga tidak bisa diubah.',    step: 4 },
  'Service Configuration':{ icon: '⚙️', color: '#0891b2', bg: 'rgba(8,145,178,0.1)',  label: 'Konfigurasi Layanan',    description: 'Mengonfigurasi escrow, transport, dan layanan pendukung.',   step: 5 },
  'Payment':              { icon: '💳', color: '#e65100', bg: 'rgba(230,81,0,0.1)',    label: 'Pembayaran',             description: 'Menunggu pembayaran dari Buyer.',                          step: 6 },
  'Transport':            { icon: '🚚', color: '#006064', bg: 'rgba(0,96,100,0.1)',    label: 'Transportasi',           description: 'Barang/ternak dalam proses pengiriman.',                   step: 7 },
  'Delivery':             { icon: '📦', color: '#6a1b9a', bg: 'rgba(106,27,154,0.1)', label: 'Pengiriman',             description: 'Barang dalam perjalanan, menunggu tiba di tujuan.',         step: 8 },
  'Buyer Confirmation':   { icon: '✅', color: '#1b7a43', bg: 'rgba(27,122,67,0.1)',   label: 'Konfirmasi Buyer',       description: 'Menunggu konfirmasi penerimaan dari Buyer.',               step: 9 },
  'Settlement':           { icon: '💸', color: '#1565c0', bg: 'rgba(21,101,192,0.1)', label: 'Pelunasan',              description: 'Dana diproses untuk ditransfer ke Seller.',                step: 10 },
  'Completed':            { icon: '🎉', color: '#1b5e20', bg: 'rgba(27,94,32,0.1)',   label: 'Selesai',                description: 'Transaksi berhasil diselesaikan.',                          step: 11 },
  'Cancelled':            { icon: '🚫', color: '#5d4037', bg: 'rgba(93,64,55,0.1)',   label: 'Dibatalkan',             description: 'Transaksi dibatalkan.',                                    step: -1 },
  'Refunded':             { icon: '↩️', color: '#c62828', bg: 'rgba(198,40,40,0.1)',  label: 'Dikembalikan',           description: 'Dana dikembalikan ke Buyer.',                              step: -1 },
  'Disputed':             { icon: '⚠️', color: '#c62828', bg: 'rgba(198,40,40,0.1)',  label: 'Sengketa',               description: 'Transaksi dalam proses sengketa.',                         step: -1 },
};

// ─── Participant in Orchestration View ────────────────────────────────────────

export type ParticipantOrchRole = 'Buyer' | 'Seller' | 'Escrow' | 'Transport' | 'Veterinarian';

export interface OrchParticipant {
  id: string;
  role: ParticipantOrchRole;
  workspaceId: string;
  displayName: string;
  avatar: string;
  currentStatus: string;
  joinedAt: string;
  lastActivity: string;
  isActive: boolean;
}

// ─── Grand Total Breakdown ────────────────────────────────────────────────────

export interface GrandTotalBreakdown {
  dealTotal: number;
  escrowFee: number;
  transportFee: number;
  otherServiceFees: number;
  grandTotal: number;
  currency: 'IDR';
}

// ─── Orchestration State ──────────────────────────────────────────────────────

export interface OrchestrationState {
  transaksiId: string;
  status: OrchestrationStatus;
  statusConfig: typeof ORCHESTRATION_STATUS_CONFIG[OrchestrationStatus];
  progressStep: number;    // 1–11 for main flow, -1 for alternates
  totalSteps: number;

  // ── Source data (live) ──
  transaksi: TransaksiItem;
  deal: Deal | null;
  escrowRecord: EscrowRecord | null;
  escrowConfig: EscrowConfigRecord | null;
  transportConfig: TransportConfig | null;
  conversationRoom: ConversationRoom | null;

  // ── Summary fields (computed) ──
  escrowMode: string;          // 'TernakHub' | 'External' | 'Direct' | 'Tidak Ada'
  transportMode: string;       // mode label or 'Tidak Ada'
  grandTotal: GrandTotalBreakdown;

  // ── Participants ──
  participants: OrchParticipant[];

  // ── Contextual AI suggestions ──
  aiSuggestions: AISuggestion005[];

  // ── Timestamps ──
  computedAt: string;
}

// ─── AI Suggestion ────────────────────────────────────────────────────────────

export interface AISuggestion005 {
  id: string;
  icon: string;
  title: string;
  body: string;
  actionLabel: string | null;
  actionKey: string | null;
  priority: 'High' | 'Medium' | 'Low';
  forRoles: ParticipantOrchRole[];
  category: 'Deal' | 'Payment' | 'Transport' | 'Escrow' | 'Delivery' | 'Settlement' | 'General';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveWsName(id: string): string {
  return WORKSPACES.find(w => w.id === id)?.name ?? id;
}

function resolveWsIcon(id: string): string {
  return WORKSPACES.find(w => w.id === id)?.icon ?? '🏪';
}

/**
 * Map existing TransaksiStatus → base OrchestrationStatus.
 * Fine-grained status is computed by overlaying Deal/Escrow/Transport state.
 */
function mapLegacyStatus(status: TransaksiStatus): OrchestrationStatus {
  switch (status) {
    case 'Menunggu Persetujuan': return 'Negotiation';
    case 'Disetujui':           return 'Service Configuration';
    case 'Ditolak':             return 'Cancelled';
    case 'Menunggu Pembayaran': return 'Payment';
    case 'Diproses':            return 'Payment';
    case 'Siap Diserahkan':     return 'Transport';
    case 'Sedang Dikirim':      return 'Delivery';
    case 'Selesai':             return 'Completed';
    case 'Dibatalkan':          return 'Cancelled';
    default:                    return 'Draft';
  }
}

function computeEscrowMode(config: EscrowConfigRecord | null): string {
  if (!config) return 'Tidak Ada';
  switch (config.configType) {
    case 'TernakHub': return 'TernakHub Escrow';
    case 'External':  return `Escrow Eksternal${config.externalDetails?.company ? ` (${config.externalDetails.company})` : ''}`;
    case 'Direct':    return 'Pembayaran Langsung';
  }
}

function computeTransportMode(config: TransportConfig | null): string {
  if (!config || !config.mode) return 'Tidak Ada';
  switch (config.mode) {
    case 'Marketplace':    return 'Transport Marketplace';
    case 'External':       return 'Transport Eksternal';
    case 'SellerArranges': return 'Seller Mengatur';
    case 'BuyerPickup':    return 'Buyer Ambil Sendiri';
  }
}

function computeGrandTotalBreakdown(
  transaksi: TransaksiItem,
  escrowRecord: EscrowRecord | null,
  chatId: string,
): GrandTotalBreakdown {
  const dealTotal = transaksi.total;
  const escrowFee = escrowRecord?.escrowFee ?? 0;
  const locked = getLockedQuotationsByChatId(chatId);
  const transportFee = locked.filter(q => q.serviceType === 'Transport').reduce((s, q) => s + q.quotedPrice, 0);
  const otherServiceFees = locked.filter(q => q.serviceType !== 'Transport').reduce((s, q) => s + q.quotedPrice, 0);
  return {
    dealTotal,
    escrowFee,
    transportFee,
    otherServiceFees,
    grandTotal: computeGrandTotal(dealTotal, escrowFee, locked),
    currency: 'IDR',
  };
}

function computeParticipants(
  transaksi: TransaksiItem,
  escrowRecord: EscrowRecord | null,
  transportConfig: TransportConfig | null,
  conversationRoom: ConversationRoom | null,
  convParticipants: ConversationParticipant[],
): OrchParticipant[] {
  const participants: OrchParticipant[] = [];
  const now = new Date().toISOString();

  // Buyer
  participants.push({
    id: `${transaksi.workspaceIdPembeli}-buyer`,
    role: 'Buyer',
    workspaceId: transaksi.workspaceIdPembeli,
    displayName: transaksi.workspaceNamaPembeli,
    avatar: resolveWsIcon(transaksi.workspaceIdPembeli),
    currentStatus: 'Aktif',
    joinedAt: transaksi.createdAt + 'T00:00:00.000Z',
    lastActivity: transaksi.updatedAt + 'T00:00:00.000Z',
    isActive: true,
  });

  // Seller
  participants.push({
    id: `${transaksi.workspaceIdPenjual}-seller`,
    role: 'Seller',
    workspaceId: transaksi.workspaceIdPenjual,
    displayName: transaksi.workspaceNamaPenjual,
    avatar: resolveWsIcon(transaksi.workspaceIdPenjual),
    currentStatus: 'Aktif',
    joinedAt: transaksi.createdAt + 'T00:00:00.000Z',
    lastActivity: transaksi.updatedAt + 'T00:00:00.000Z',
    isActive: true,
  });

  // Escrow (if active)
  if (escrowRecord) {
    participants.push({
      id: 'escrow-system',
      role: 'Escrow',
      workspaceId: 'escrow-system',
      displayName: 'TernakHub Escrow',
      avatar: '🏦',
      currentStatus: escrowRecord.status,
      joinedAt: escrowRecord.createdAt,
      lastActivity: escrowRecord.updatedAt,
      isActive: !['Completed', 'Cancelled'].includes(escrowRecord.status),
    });
  }

  // Transport (if configured)
  if (transportConfig?.mode) {
    const transportWsId = transportConfig.marketplace?.transportWorkspaceId;
    const transportName = transportWsId
      ? resolveWsName(transportWsId)
      : (transportConfig.external?.companyName || 'Transport');
    const transportStatus = transportConfig.marketplace?.status
      ?? transportConfig.external?.status
      ?? transportConfig.sellerArranges?.status
      ?? transportConfig.buyerPickup?.status
      ?? 'Configured';

    participants.push({
      id: `${transportWsId ?? 'transport-external'}-transport`,
      role: 'Transport',
      workspaceId: transportWsId ?? 'transport-external',
      displayName: transportName,
      avatar: '🚚',
      currentStatus: transportStatus,
      joinedAt: transportConfig.createdAt,
      lastActivity: transportConfig.updatedAt,
      isActive: true,
    });
  }

  // Veterinarian — derive from conversation participants (service joiners)
  for (const p of convParticipants) {
    if (p.role === 'Veterinarian' && p.isActive) {
      participants.push({
        id: `${p.workspaceId}-veterinarian`,
        role: 'Veterinarian',
        workspaceId: p.workspaceId,
        displayName: p.workspaceNama,
        avatar: p.workspaceIcon,
        currentStatus: 'Bergabung',
        joinedAt: p.joinedAt ?? now,
        lastActivity: now,
        isActive: true,
      });
    }
  }
  void conversationRoom; // used only to derive convParticipants before call

  return participants;
}

function computeAISuggestions(
  state: OrchestrationStatus,
  transaksi: TransaksiItem,
  deal: Deal | null,
  escrowRecord: EscrowRecord | null,
  escrowConfig: EscrowConfigRecord | null,
  transportConfig: TransportConfig | null,
  chatId: string,
): AISuggestion005[] {
  const suggestions: AISuggestion005[] = [];

  switch (state) {
    case 'Draft':
    case 'Negotiation':
      if (!deal) {
        suggestions.push({
          id: 'sug-deal-create_deal',
          icon: '📋',
          title: 'Mulai Proposal Deal',
          body: 'Belum ada Deal Proposal untuk transaksi ini. Buat proposal untuk memulai negosiasi harga dan syarat.',
          actionLabel: 'Buat Deal',
          actionKey: 'create_deal',
          priority: 'High',
          forRoles: ['Buyer', 'Seller'],
          category: 'Deal',
        });
      } else if (deal.status === 'Draft') {
        suggestions.push({
          id: 'sug-deal-submit_deal',
          icon: '📤',
          title: 'Ajukan Deal untuk Persetujuan',
          body: `Deal masih berstatus Draft. Ajukan ke lawan pihak untuk mendapatkan persetujuan.`,
          actionLabel: 'Ajukan',
          actionKey: 'submit_deal',
          priority: 'High',
          forRoles: ['Buyer', 'Seller'],
          category: 'Deal',
        });
      } else if (deal.status === 'Waiting Approval') {
        suggestions.push({
          id: 'sug-deal-review_deal',
          icon: '🤝',
          title: 'Setujui atau Tolak Deal',
          body: 'Deal menunggu persetujuan. Tinjau detail dan berikan keputusan Anda.',
          actionLabel: 'Tinjau',
          actionKey: 'review_deal',
          priority: 'High',
          forRoles: ['Buyer', 'Seller'],
          category: 'Deal',
        });
      }
      break;

    case 'Deal Locked':
    case 'Service Configuration':
      if (!escrowConfig) {
        suggestions.push({
          id: 'sug-escrow-configure_escrow',
          icon: '🔐',
          title: 'Pilih Metode Pembayaran / Escrow',
          body: 'Deal sudah dikunci. Pilih metode pembayaran: TernakHub Escrow, Escrow Eksternal, atau Pembayaran Langsung.',
          actionLabel: 'Pilih Escrow',
          actionKey: 'configure_escrow',
          priority: 'High',
          forRoles: ['Buyer', 'Seller'],
          category: 'Escrow',
        });
      }
      if (!allRequiredQuotationsLocked(chatId)) {
        const quotations = getQuotationsByChatId(chatId);
        const pending = quotations.filter(q => q.status !== 'Locked' && q.status !== 'Cancelled' && q.status !== 'Rejected');
        if (pending.length > 0) {
          suggestions.push({
            id: 'sug-escrow-review_quotations',
            icon: '⚙️',
            title: 'Kunci Semua Quotasi Layanan',
            body: `Ada ${pending.length} quotasi layanan yang belum dikunci. Semua quotasi harus dikunci sebelum pembayaran.`,
            actionLabel: 'Tinjau Quotasi',
            actionKey: 'review_quotations',
            priority: 'High',
            forRoles: ['Buyer', 'Seller'],
            category: 'Escrow',
          });
        }
      }
      break;

    case 'Payment':
      if (escrowRecord?.status === 'Waiting Payment') {
        suggestions.push({
          id: 'sug-payment-upload_payment_proof',
          icon: '💳',
          title: 'Upload Bukti Pembayaran',
          body: `Transfer ke rekening Escrow TernakHub. Setelah transfer, upload bukti pembayaran agar Escrow dapat memverifikasi.`,
          actionLabel: 'Upload Bukti',
          actionKey: 'upload_payment_proof',
          priority: 'High',
          forRoles: ['Buyer'],
          category: 'Payment',
        });
        suggestions.push({
          id: 'sug-payment-waiting_info',
          icon: '⏳',
          title: 'Menunggu Pembayaran Buyer',
          body: 'Escrow sudah aktif. Tunggu Buyer mentransfer dana ke rekening Escrow.',
          actionLabel: null,
          actionKey: null,
          priority: 'Medium',
          forRoles: ['Seller'],
          category: 'Payment',
        });
      }
      break;

    case 'Transport':
    case 'Delivery':
      if (!transportConfig?.mode) {
        suggestions.push({
          id: 'sug-transport-configure_transport',
          icon: '🚚',
          title: 'Konfigurasi Pengiriman',
          body: 'Belum ada metode transport yang dipilih. Pilih: Transport Marketplace, Eksternal, Seller Mengatur, atau Buyer Ambil Sendiri.',
          actionLabel: 'Pilih Transport',
          actionKey: 'configure_transport',
          priority: 'High',
          forRoles: ['Buyer', 'Seller'],
          category: 'Transport',
        });
      } else if (transportConfig.marketplace?.status === 'Delivered') {
        suggestions.push({
          id: 'sug-delivery-confirm_receipt',
          icon: '✅',
          title: 'Konfirmasi Penerimaan Barang',
          body: 'Barang sudah terkirim. Konfirmasi penerimaan agar dana Escrow dapat dilepaskan ke Seller.',
          actionLabel: 'Konfirmasi Terima',
          actionKey: 'confirm_receipt',
          priority: 'High',
          forRoles: ['Buyer'],
          category: 'Delivery',
        });
      }
      break;

    case 'Buyer Confirmation':
      suggestions.push({
        id: 'sug-delivery-buyer_confirm',
        icon: '✅',
        title: 'Konfirmasi Penerimaan',
        body: 'Barang sudah tiba. Segera konfirmasi kondisi dan penerimaan agar transaksi dapat diselesaikan.',
        actionLabel: 'Konfirmasi Sekarang',
        actionKey: 'buyer_confirm',
        priority: 'High',
        forRoles: ['Buyer'],
        category: 'Delivery',
      });
      break;

    case 'Settlement':
      if (escrowRecord?.status === 'Waiting Transfer' || escrowRecord?.status === 'Transfer Processing') {
        suggestions.push({
          id: 'sug-settlement-transfer_info',
          icon: '💸',
          title: 'Escrow Memproses Transfer',
          body: 'Petugas Escrow sedang memproses transfer dana ke Seller. Harap tunggu notifikasi konfirmasi.',
          actionLabel: null,
          actionKey: null,
          priority: 'Medium',
          forRoles: ['Buyer', 'Seller'],
          category: 'Settlement',
        });
      } else if (escrowRecord?.status === 'Waiting Receiver Confirmation') {
        suggestions.push({
          id: 'sug-settlement-confirm_funds',
          icon: '📨',
          title: 'Konfirmasi Penerimaan Dana',
          body: 'Bukti transfer telah diunggah. Konfirmasi bahwa dana sudah masuk ke rekening Anda.',
          actionLabel: 'Konfirmasi Dana',
          actionKey: 'confirm_funds',
          priority: 'High',
          forRoles: ['Seller'],
          category: 'Settlement',
        });
      }
      break;

    case 'Completed':
      suggestions.push({
        id: 'sug-general-view_receipt',
        icon: '📄',
        title: 'Unduh Bukti Transaksi',
        body: 'Transaksi selesai. Unduh receipt lengkap sebagai dokumentasi transaksi Anda.',
        actionLabel: 'Lihat Receipt',
        actionKey: 'view_receipt',
        priority: 'Low',
        forRoles: ['Buyer', 'Seller'],
        category: 'General',
      });
      break;

    case 'Disputed':
      suggestions.push({
        id: 'sug-general-upload_evidence',
        icon: '📋',
        title: 'Siapkan Bukti Sengketa',
        body: 'Sengketa sedang berlangsung. Upload semua bukti yang relevan di tab Evidence untuk memperkuat posisi Anda.',
        actionLabel: 'Upload Bukti',
        actionKey: 'upload_evidence',
        priority: 'High',
        forRoles: ['Buyer', 'Seller'],
        category: 'General',
      });
      break;
  }

  // Always add general suggestions if < 3 total
  if (suggestions.length < 3) {
    suggestions.push({
      id: 'sug-general-view_audit',
      icon: '📋',
      title: 'Pantau Audit Trail',
      body: 'Semua perubahan status tercatat di Audit Trail. Periksa secara berkala untuk memastikan tidak ada aktivitas tidak terduga.',
      actionLabel: 'Lihat Audit',
      actionKey: 'view_audit',
      priority: 'Low',
      forRoles: ['Buyer', 'Seller', 'Escrow', 'Transport'],
      category: 'General',
    });
  }

  return suggestions;
}

// ─── Derive Orchestration Status ──────────────────────────────────────────────

function deriveOrchestrationStatus(
  transaksi: TransaksiItem,
  deal: Deal | null,
  escrowRecord: EscrowRecord | null,
  transportConfig: TransportConfig | null,
  chatId: string,
): OrchestrationStatus {
  const legacyStatus = transaksi.status;

  // Terminal statuses
  if (legacyStatus === 'Dibatalkan' || legacyStatus === 'Ditolak') return 'Cancelled';
  if (legacyStatus === 'Selesai') {
    // Check if escrow was disputed/refunded
    if (escrowRecord?.dispute?.resolution && escrowRecord.dispute.releaseDirection === 'Buyer') {
      return 'Refunded';
    }
    return 'Completed';
  }

  // Check for active dispute
  if (escrowRecord?.status === 'Dispute') return 'Disputed';

  // Settlement phase
  if (escrowRecord && ['Waiting Transfer', 'Transfer Processing', 'Waiting Receiver Confirmation'].includes(escrowRecord.status)) {
    return 'Settlement';
  }

  // Delivery → Buyer Confirmation
  if (legacyStatus === 'Sedang Dikirim') {
    if (transportConfig?.marketplace?.status === 'Delivered') return 'Buyer Confirmation';
    if (transportConfig?.marketplace?.buyerConfirmation === 'Confirmed') return 'Buyer Confirmation';
    return 'Delivery';
  }

  // Transport phase
  if (legacyStatus === 'Siap Diserahkan') return 'Transport';

  // Payment phase
  if (legacyStatus === 'Diproses') return 'Payment';
  if (legacyStatus === 'Menunggu Pembayaran') return 'Payment';

  // After approval — Service Configuration
  if (legacyStatus === 'Disetujui') return 'Service Configuration';

  // Deal flow based on deal status
  if (legacyStatus === 'Menunggu Persetujuan') {
    if (!deal || deal.status === 'Draft') return 'Negotiation';
    if (deal.status === 'Waiting Approval') return 'Deal Proposed';
    if (deal.status === 'Locked') return 'Deal Locked';
    if (deal.status === 'Rejected') return 'Negotiation';
    return 'Negotiation';
  }

  return 'Draft';
}

// ─── Main Compute Function ────────────────────────────────────────────────────

/**
 * Compute the full OrchestrationState for a transaction.
 * Reads from ALL existing data modules. Returns null if transaksiId is invalid.
 *
 * AI NEVER calls mutations — it only reads this output.
 */
export function computeOrchestrationState(transaksiId: string): OrchestrationState | null {
  const transaksi = getTransaksiById(transaksiId);
  if (!transaksi) return null;

  // Derive chatId from transaksiId (convention: chatId = transaksiId)
  const chatId = transaksiId;

  const dealRaw          = getDealByChatId(chatId);
  const escrowRecordRaw  = getEscrowByTransaksiId(transaksiId);
  const escrowConfigRaw  = getEscrowConfig(chatId);
  const transportConfigRaw = getTransportConfig(chatId);

  // Normalize undefined → null for OrchestrationState fields
  const deal:          Deal | null             = dealRaw          ?? null;
  const escrowRecord:  EscrowRecord | null     = escrowRecordRaw  ?? null;
  const escrowConfig:  EscrowConfigRecord | null = escrowConfigRaw  ?? null;
  const transportConfig: TransportConfig | null = transportConfigRaw ?? null;

  let conversationRoom: ConversationRoom | null = null;
  let convParticipants: ConversationParticipant[] = [];
  try {
    conversationRoom = getConversationByTransaksiId(transaksiId) ?? null;
    if (conversationRoom) {
      convParticipants = getConversationParticipants(conversationRoom.id);
    }
  } catch {
    conversationRoom = null;
  }

  const status = deriveOrchestrationStatus(transaksi, deal, escrowRecord, transportConfig, chatId);
  const statusConfig = ORCHESTRATION_STATUS_CONFIG[status];
  const progressStep = statusConfig.step;

  const escrowMode    = computeEscrowMode(escrowConfig);
  const transportMode = computeTransportMode(transportConfig);
  const grandTotal    = computeGrandTotalBreakdown(transaksi, escrowRecord, chatId);
  const participants  = computeParticipants(transaksi, escrowRecord, transportConfig, conversationRoom, convParticipants);
  const aiSuggestions = computeAISuggestions(
    status, transaksi, deal, escrowRecord, escrowConfig, transportConfig, chatId,
  );

  return {
    transaksiId,
    status,
    statusConfig,
    progressStep,
    totalSteps: 11,
    transaksi,
    deal,
    escrowRecord,
    escrowConfig,
    transportConfig,
    conversationRoom,
    escrowMode,
    transportMode,
    grandTotal,
    participants,
    aiSuggestions,
    computedAt: new Date().toISOString(),
  };
}

// ─── State Progress Bar Helpers ───────────────────────────────────────────────

/** Returns [0, 1] progress fraction for the main flow. */
export function getOrchestrationProgress(state: OrchestrationState): number {
  if (TERMINAL_ORCHESTRATION_STATUSES.has(state.status)) {
    return state.status === 'Completed' ? 1 : 0;
  }
  return Math.max(0, (state.progressStep - 1) / (state.totalSteps - 1));
}

/** Returns ordered steps for display in a progress bar. */
export function getOrchestrationSteps(): Array<{ status: OrchestrationStatus; config: typeof ORCHESTRATION_STATUS_CONFIG[OrchestrationStatus] }> {
  return ORCHESTRATION_STATUS_ORDER.map(s => ({ status: s, config: ORCHESTRATION_STATUS_CONFIG[s] }));
}

// ─── Sync Hook ────────────────────────────────────────────────────────────────
// Called by mutation functions across all modules to broadcast state change.
// Keeps listener list simple; no framework dependencies.

type SyncListener = (transaksiId: string, newState: OrchestrationState) => void;
const SYNC_LISTENERS = new Set<SyncListener>();

export function subscribeOrchestration(listener: SyncListener): () => void {
  SYNC_LISTENERS.add(listener);
  return () => SYNC_LISTENERS.delete(listener);
}

/**
 * Call this after any mutation that changes deal/escrow/transport/transaksi state.
 * Recomputes the orchestration state and notifies all subscribers.
 */
export function syncOrchestrationState(transaksiId: string): void {
  const state = computeOrchestrationState(transaksiId);
  if (!state) return;
  for (const listener of SYNC_LISTENERS) {
    try { listener(transaksiId, state); } catch { /* noop */ }
  }
}

// ─── Bus Registration ─────────────────────────────────────────────────────────
// Wire the mutation bus → syncOrchestrationState so components that call
// subscribeOrchestration() are notified after any mutation in any module.
onOrchestrationMutation((transaksiId) => {
  syncOrchestrationState(transaksiId);
});

// Re-export resolveWsName for use by other orchestration files
export { resolveWsName };
