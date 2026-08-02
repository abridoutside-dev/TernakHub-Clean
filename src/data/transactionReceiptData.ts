// ─── FARM-FIX-005.9 — Transaction Receipt Generator ───────────────────────────
// Generates a comprehensive final receipt from all transaction data sources.
// Receipt is read-only — computed on demand from live data.

import { getTransaksiById } from './marketplaceTransaksiData';
import { getDealByChatId, computeDealSummary } from './dealData';
import { getLockedQuotationsByChatId } from './serviceQuotationData';
import { getEscrowByTransaksiId } from './transaksiEscrowData';
import { getEscrowConfig, ESCROW_CONFIG_TYPE_CONFIG } from './escrowConfigData';
import { getTransportConfig, TRANSPORT_MODE_CONFIG } from './transportConfigData';
import { getProviderSnapshot } from './serviceProviderSnapshotData';
import { getAuditTrailByTransaksiId } from './transaksiAuditTrailData';
import { getEvidenceByTransaksiId } from './transaksiEvidenceData';
import { computeOrchestrationState } from './transactionOrchestrationData';
import { WORKSPACES } from '../components/TopAppBar';

// ─── Receipt Types ────────────────────────────────────────────────────────────

export interface ReceiptParticipantSummary {
  role: string;
  displayName: string;
  avatar: string;
  workspaceId: string;
  status: string;
  joinedAt: string;
}

export interface ReceiptDealSummary {
  judulListing: string;
  thumbnail: string;
  jumlah: number;
  satuanHarga: string;
  hargaSatuan: number;
  totalHarga: number;
  catatan: string;
  dealStatus: string;
  lockedAt: string | null;
}

export interface ReceiptEscrowSummary {
  mode: string;
  status: string;
  nominalTransaksi: number;
  escrowFee: number | null;
  transactionCost: number | null;
  totalTransferCount: number;
  dispute: {
    opened: boolean;
    reason: string | null;
    resolution: string | null;
    releaseDirection: string | null;
  };
}

export interface ReceiptTransportSummary {
  mode: string;
  status: string;
  companyOrProvider: string;
  pickupEvidenceCount: number;
  deliveryEvidenceCount: number;
  buyerConfirmation: string | null;
}

export interface ReceiptTimelineSummary {
  totalEvents: number;
  firstEvent: string | null;
  lastEvent: string | null;
  keyEvents: Array<{ event: string; timestamp: string; actor: string; description: string }>;
}

export interface ReceiptEvidenceSummary {
  totalCount: number;
  verifiedCount: number;
  categories: string[];
  items: Array<{ category: string; fileName: string; uploadedBy: string; status: string; uploadedAt: string }>;
}

export interface ReceiptFinancialSummary {
  dealTotal: number;
  escrowFee: number;
  transportFee: number;
  otherFees: number;
  grandTotal: number;
  currency: string;
}

// ─── Selected Services Summary ────────────────────────────────────────────────

export type SelectedServiceStatus = 'Digunakan' | 'Tidak Digunakan';

/**
 * One entry per optional service evaluated for this transaction.
 * source distinguishes Platform Services (Escrow) from Marketplace Listing
 * providers (Transport, Dokter Hewan, Klinik Hewan).
 */
export interface SelectedServiceEntry {
  name: string;
  icon: string;
  status: SelectedServiceStatus;
  /** Escrow = Platform Service. Transport/Dokter/Klinik = Marketplace Listing. */
  source: 'Platform Service' | 'Marketplace Listing' | 'Eksternal';
  detail?: string;
}

export interface TransactionReceipt {
  receiptNumber: string;
  transaksiId: string;
  generatedAt: string;

  // ── Core info ──
  finalStatus: string;
  finalStatusIcon: string;
  createdAt: string;
  completedAt: string | null;

  // ── Participants ──
  participants: ReceiptParticipantSummary[];

  // ── Deal ──
  deal: ReceiptDealSummary | null;

  // ── Financial ──
  financial: ReceiptFinancialSummary;

  // ── Price distinction (spec requirement) ──
  /** Agreed price (deal total before service fees). */
  negotiatedPrice: number;
  /** Grand total including all service fees. */
  finalPrice: number;

  // ── Payment ──
  /** Derived from escrow status when escrow is active, else from transaksi status. */
  paymentStatus: string;

  // ── Selected Services (spec requirement) ──
  /** Flat list of every optional service evaluated for this transaction. */
  selectedServices: SelectedServiceEntry[];

  // ── Escrow ──
  escrow: ReceiptEscrowSummary | null;

  // ── Transport ──
  transport: ReceiptTransportSummary | null;

  // ── Timeline ──
  timeline: ReceiptTimelineSummary;

  // ── Evidence ──
  evidence: ReceiptEvidenceSummary;

  // ── Validity ──
  isComplete: boolean;     // true when status === Completed
  hasDispute: boolean;
  hasRefund: boolean;
}

// ─── Receipt Number Registry ──────────────────────────────────────────────────
// Receipt numbers are immutable once issued for a transaction.
// The registry ensures the same number is returned regardless of when the
// receipt page is opened or how many times generateReceipt() is called.

const RECEIPT_NUMBER_REGISTRY = new Map<string, string>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveWsIcon(id: string): string {
  return WORKSPACES.find(w => w.id === id)?.icon ?? '🏪';
}

function genReceiptNumber(transaksiId: string): string {
  // Return the previously issued number if one exists.
  const cached = RECEIPT_NUMBER_REGISTRY.get(transaksiId);
  if (cached) return cached;

  // Generate once: REC-{numeric suffix from transaksiId}-{issuance date}
  const suffix = transaksiId.replace(/[^0-9]/g, '').slice(-8).padStart(8, '0');
  const date   = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const number = `REC-${suffix}-${date}`;
  RECEIPT_NUMBER_REGISTRY.set(transaksiId, number);
  return number;
}

// ─── Main Generator ───────────────────────────────────────────────────────────

/**
 * Generate a full transaction receipt.
 * Returns null if transaksiId is invalid.
 */
export function generateReceipt(transaksiId: string): TransactionReceipt | null {
  const transaksi = getTransaksiById(transaksiId);
  if (!transaksi) return null;

  const chatId = transaksiId;
  const orch   = computeOrchestrationState(transaksiId);

  // ── Deal ──────────────────────────────────────────────────────────────────
  const deal = getDealByChatId(chatId);
  let dealSummary: ReceiptDealSummary | null = null;
  if (deal) {
    const ds = computeDealSummary(deal);
    dealSummary = {
      judulListing: ds.listingJudul,
      thumbnail:    ds.listingThumbnail,
      jumlah:       ds.jumlah,
      satuanHarga:  ds.satuanHarga,
      hargaSatuan:  ds.hargaSatuan,
      totalHarga:   ds.totalHarga,
      catatan:      ds.catatan,
      dealStatus:   deal.status,
      lockedAt:     deal.lockedAt,
    };
  }

  // Fall back to transaksi data if no deal
  if (!dealSummary) {
    dealSummary = {
      judulListing: transaksi.judulListing,
      thumbnail:    transaksi.thumbnailListing,
      jumlah:       transaksi.qty,
      satuanHarga:  transaksi.satuanHarga,
      hargaSatuan:  transaksi.hargaSatuan,
      totalHarga:   transaksi.total,
      catatan:      '',
      dealStatus:   'Completed',
      lockedAt:     null,
    };
  }

  // ── Escrow ────────────────────────────────────────────────────────────────
  const escrowRecord = getEscrowByTransaksiId(transaksiId);
  const escrowConfig = getEscrowConfig(chatId);
  let escrowSummary: ReceiptEscrowSummary | null = null;

  if (escrowRecord) {
    escrowSummary = {
      mode:               escrowConfig?.configType ?? 'TernakHub',
      status:             escrowRecord.status,
      nominalTransaksi:   escrowRecord.nominalTransaksi,
      escrowFee:          escrowRecord.escrowFee,
      transactionCost:    escrowRecord.transactionCost,
      totalTransferCount: escrowRecord.transfers.length,
      dispute: {
        opened:          escrowRecord.dispute !== null,
        reason:          escrowRecord.dispute?.reason ?? null,
        resolution:      escrowRecord.dispute?.resolution ?? null,
        releaseDirection:escrowRecord.dispute?.releaseDirection ?? null,
      },
    };
  } else if (escrowConfig) {
    escrowSummary = {
      mode:               escrowConfig.configType,
      status:             'Tidak Ada Escrow',
      nominalTransaksi:   transaksi.total,
      escrowFee:          null,
      transactionCost:    null,
      totalTransferCount: 0,
      dispute:            { opened: false, reason: null, resolution: null, releaseDirection: null },
    };
  }

  // ── Transport ─────────────────────────────────────────────────────────────
  const transportConfig = getTransportConfig(chatId);
  let transportSummary: ReceiptTransportSummary | null = null;

  if (transportConfig?.mode) {
    const modeLabel = TRANSPORT_MODE_CONFIG[transportConfig.mode].label;
    let statusLabel = 'Tidak Ada';
    let provider = '';
    let pickupCount = 0;
    let deliveryCount = 0;
    let buyerConfirm: string | null = null;

    if (transportConfig.marketplace) {
      statusLabel = transportConfig.marketplace.status;
      // APP-CHAIN-003: resolve provider name from immutable snapshot first.
      // Fallback to live WORKSPACES only for backward-compat with transactions
      // that predate the snapshot system.
      const transportSnapshot = getProviderSnapshot(chatId, 'Transport');
      provider = transportSnapshot?.workspaceName
        ?? (transportConfig.marketplace.transportWorkspaceId
          ? (WORKSPACES.find(w => w.id === transportConfig.marketplace!.transportWorkspaceId)?.name ?? 'Transport Marketplace')
          : 'Transport Marketplace');
      pickupCount   = transportConfig.marketplace.pickupEvidence.length;
      deliveryCount = transportConfig.marketplace.deliveryEvidence.length;
      buyerConfirm  = transportConfig.marketplace.buyerConfirmation;
    } else if (transportConfig.external) {
      statusLabel = transportConfig.external.status;
      provider    = transportConfig.external.companyName || 'Transport Eksternal';
      pickupCount   = transportConfig.external.pickupEvidence.length;
      deliveryCount = transportConfig.external.deliveryEvidence.length;
    } else if (transportConfig.sellerArranges) {
      statusLabel = transportConfig.sellerArranges.status;
      provider    = transportConfig.sellerArranges.transportDescription || 'Seller Mengatur';
    } else if (transportConfig.buyerPickup) {
      statusLabel = transportConfig.buyerPickup.status;
      provider    = 'Buyer Pickup';
    }

    transportSummary = {
      mode:                 modeLabel,
      status:               statusLabel,
      companyOrProvider:    provider,
      pickupEvidenceCount:  pickupCount,
      deliveryEvidenceCount:deliveryCount,
      buyerConfirmation:    buyerConfirm,
    };
  }

  // ── Timeline ──────────────────────────────────────────────────────────────
  const auditTrail = getAuditTrailByTransaksiId(transaksiId);
  const timelineSummary: ReceiptTimelineSummary = {
    totalEvents: auditTrail.length,
    firstEvent:  auditTrail.length > 0 ? auditTrail[auditTrail.length - 1].timestamp : null,
    lastEvent:   auditTrail.length > 0 ? auditTrail[0].timestamp : null,
    keyEvents:   auditTrail
      .slice(0, 8)
      .map(e => ({
        event:       e.event,
        timestamp:   e.timestamp,
        actor:       e.actorNama,
        description: e.description,
      })),
  };

  // ── Evidence ──────────────────────────────────────────────────────────────
  const evidenceList = getEvidenceByTransaksiId(transaksiId);
  const evidenceSummary: ReceiptEvidenceSummary = {
    totalCount:    evidenceList.length,
    verifiedCount: evidenceList.filter(e => e.status === 'Verified').length,
    categories:    [...new Set(evidenceList.map(e => e.category))],
    items:         evidenceList.map(e => ({
      category:   e.category,
      fileName:   e.fileName,
      uploadedBy: e.uploadedByNama,
      status:     e.status,
      uploadedAt: e.uploadedAt,
    })),
  };

  // ── Financial ─────────────────────────────────────────────────────────────
  // Derive transport fee from locked quotations so it's always accurate,
  // even when orchestration state is not yet available.
  const lockedQuotations  = getLockedQuotationsByChatId(transaksiId);
  const rawTransportFee   = lockedQuotations
    .filter(q => q.serviceType === 'Transport')
    .reduce((sum, q) => sum + q.quotedPrice, 0);
  const escrowFeeAmt      = escrowRecord?.escrowFee ?? 0;

  const financial: ReceiptFinancialSummary = {
    dealTotal:    transaksi.total,
    escrowFee:    escrowFeeAmt,
    transportFee: rawTransportFee,
    otherFees:    0,
    grandTotal:   transaksi.total + escrowFeeAmt + rawTransportFee,
    currency:     'IDR',
  };
  if (orch) {
    // Orchestration provides the authoritative breakdown when available.
    financial.transportFee = orch.grandTotal.transportFee;
    financial.otherFees    = orch.grandTotal.otherServiceFees;
    financial.grandTotal   = orch.grandTotal.grandTotal;
  }

  // ── Participants ──────────────────────────────────────────────────────────
  const participantsSummary: ReceiptParticipantSummary[] = orch
    ? orch.participants.map(p => ({
        role:        p.role,
        displayName: p.displayName,
        avatar:      p.avatar,
        workspaceId: p.workspaceId,
        status:      p.currentStatus,
        joinedAt:    p.joinedAt,
      }))
    : [
        {
          role:        'Buyer',
          displayName: transaksi.workspaceNamaPembeli,
          avatar:      resolveWsIcon(transaksi.workspaceIdPembeli),
          workspaceId: transaksi.workspaceIdPembeli,
          status:      'Aktif',
          joinedAt:    transaksi.createdAt + 'T00:00:00.000Z',
        },
        {
          role:        'Seller',
          displayName: transaksi.workspaceNamaPenjual,
          avatar:      resolveWsIcon(transaksi.workspaceIdPenjual),
          workspaceId: transaksi.workspaceIdPenjual,
          status:      'Aktif',
          joinedAt:    transaksi.createdAt + 'T00:00:00.000Z',
        },
      ];

  // ── Final Status ──────────────────────────────────────────────────────────
  const finalStatus   = orch?.status ?? 'Completed';
  const finalStatusCfg = orch?.statusConfig ?? { icon: '🎉', label: 'Selesai' };

  // ── Selected Services (spec requirement) ──────────────────────────────────
  const selectedServices: SelectedServiceEntry[] = [];

  // Escrow — always a Platform Service, shown whenever configured
  if (escrowRecord || escrowConfig) {
    const cfgLabel = escrowConfig
      ? (ESCROW_CONFIG_TYPE_CONFIG[escrowConfig.configType]?.label ?? escrowConfig.configType)
      : undefined;
    selectedServices.push({
      name:   'Escrow',
      icon:   '🛡️',
      status: (escrowRecord || (escrowConfig && escrowConfig.configType !== 'Direct'))
        ? 'Digunakan'
        : 'Tidak Digunakan',
      source: 'Platform Service',
      detail: cfgLabel,
    });
  }

  // Transport — source depends on mode (Marketplace = Listing provider, others = Eksternal)
  if (transportConfig?.mode) {
    const tLabel = TRANSPORT_MODE_CONFIG[transportConfig.mode]?.label ?? transportConfig.mode;
    selectedServices.push({
      name:   'Transport',
      icon:   '🚚',
      status: 'Digunakan',
      source: transportConfig.mode === 'Marketplace' ? 'Marketplace Listing' : 'Eksternal',
      detail: tLabel,
    });
  }

  // Dokter Hewan — locked Veterinarian quotations
  // APP-CHAIN-003: use immutable snapshot for provider name; fallback to count.
  const vetQuotes = lockedQuotations.filter(q => q.serviceType === 'Veterinarian');
  if (vetQuotes.length > 0) {
    const vetSnapshot = getProviderSnapshot(chatId, 'Veterinarian');
    selectedServices.push({
      name:   'Dokter Hewan',
      icon:   '👨‍⚕️',
      status: 'Digunakan',
      source: 'Marketplace Listing',
      detail: vetSnapshot?.workspaceName
        ?? (vetQuotes.length === 1 ? '1 layanan' : `${vetQuotes.length} layanan`),
    });
  }

  // Klinik Hewan — locked Clinic quotations
  // APP-CHAIN-003: use immutable snapshot for provider name; fallback to count.
  const clinicQuotes = lockedQuotations.filter(q => q.serviceType === 'Clinic');
  if (clinicQuotes.length > 0) {
    const clinicSnapshot = getProviderSnapshot(chatId, 'Clinic');
    selectedServices.push({
      name:   'Klinik Hewan',
      icon:   '🏥',
      status: 'Digunakan',
      source: 'Marketplace Listing',
      detail: clinicSnapshot?.workspaceName
        ?? (clinicQuotes.length === 1 ? '1 layanan' : `${clinicQuotes.length} layanan`),
    });
  }

  // ── Payment Status ────────────────────────────────────────────────────────
  let paymentStatus: string;
  if (escrowRecord) {
    paymentStatus = escrowRecord.status;
  } else if (transaksi.status === 'Selesai') {
    paymentStatus = 'Lunas';
  } else if (transaksi.status === 'Dibatalkan') {
    paymentStatus = 'Dibatalkan';
  } else {
    paymentStatus = transaksi.status;
  }

  // ── Negotiated vs Final Price ─────────────────────────────────────────────
  const negotiatedPrice = dealSummary?.totalHarga ?? transaksi.total;
  const finalPrice      = financial.grandTotal;

  return {
    receiptNumber: genReceiptNumber(transaksiId),
    transaksiId,
    generatedAt:   new Date().toISOString(),
    finalStatus:   finalStatusCfg.label,
    finalStatusIcon: finalStatusCfg.icon,
    createdAt:     transaksi.createdAt,
    completedAt:   transaksi.selesaiAt ?? null,
    participants:  participantsSummary,
    deal:          dealSummary,
    financial,
    negotiatedPrice,
    finalPrice,
    paymentStatus,
    selectedServices,
    escrow:        escrowSummary,
    transport:     transportSummary,
    timeline:      timelineSummary,
    evidence:      evidenceSummary,
    isComplete:    transaksi.status === 'Selesai' || finalStatus === 'Completed',
    hasDispute:    escrowRecord !== undefined && escrowRecord.dispute !== null,
    hasRefund:     escrowRecord?.dispute?.releaseDirection === 'Buyer',
  };
}
