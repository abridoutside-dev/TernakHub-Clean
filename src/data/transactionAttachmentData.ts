// ─── FARM-FIX-005.9 — Unified Attachment Center ───────────────────────────────
// Aggregates all attachments across:
//   - transaksiEvidenceData (Evidence)
//   - transportConfigData (Transport pickup/delivery evidence)
// Categories: Deal | Payment | Transport | Evidence | Dispute
// Every attachment links back to the Audit Trail via transaksiId.

import {
  getEvidenceByTransaksiId,
  EVIDENCE_CATEGORY_CONFIG,
  EVIDENCE_FILE_ICON,
  EVIDENCE_STATUS_CONFIG,
  type EvidenceCategory,
  type EvidenceRecord,
} from './transaksiEvidenceData';
import {
  getTransportConfig,
  type TransportEvidence,
} from './transportConfigData';
import { getEscrowByTransaksiId } from './transaksiEscrowData';

// ─── Attachment Category ──────────────────────────────────────────────────────

export type AttachmentCategory =
  | 'Deal'
  | 'Payment'
  | 'Transport'
  | 'Evidence'
  | 'Dispute'
  | 'All';

export const ATTACHMENT_CATEGORY_CONFIG: Record<
  Exclude<AttachmentCategory, 'All'>,
  { icon: string; label: string; color: string; bg: string }
> = {
  Deal:      { icon: '🤝', label: 'Deal',      color: '#2563eb', bg: 'rgba(37,99,235,0.09)'  },
  Payment:   { icon: '💳', label: 'Pembayaran', color: '#e65100', bg: 'rgba(230,81,0,0.09)'   },
  Transport: { icon: '🚚', label: 'Transport',  color: '#006064', bg: 'rgba(0,96,100,0.09)'   },
  Evidence:  { icon: '📎', label: 'Evidence',   color: '#1b7a43', bg: 'rgba(27,122,67,0.09)'  },
  Dispute:   { icon: '⚠️', label: 'Sengketa',   color: '#c62828', bg: 'rgba(198,40,40,0.09)'  },
};

// ─── Unified Attachment Record ─────────────────────────────────────────────────

export interface UnifiedAttachment {
  id: string;
  transaksiId: string;
  category: Exclude<AttachmentCategory, 'All'>;
  fileType: string;        // 'Image' | 'PDF' | 'Video' | 'Foto' | 'Catatan' | etc.
  fileIcon: string;
  fileName: string;
  caption: string;
  uploadedBy: string;      // workspace name
  uploadedAt: string;
  status: 'Pending' | 'Verified' | 'Disputed' | 'Active';
  source: 'Evidence' | 'Transport' | 'Escrow';
  sourceDetail: string;    // e.g. 'Pickup Evidence', 'Payment Proof'
  /** Link back to Audit Trail route */
  auditLink: string;
  warnings: Array<{ type: string; detail: string }>;
}

// ─── Evidence Category → Attachment Category Mapping ─────────────────────────

const EVIDENCE_TO_ATTACH_CATEGORY: Record<EvidenceCategory, Exclude<AttachmentCategory, 'All'>> = {
  Agreement:            'Deal',
  Payment:              'Payment',
  Delivery:             'Transport',
  Arrival:              'Transport',
  'Livestock Condition':'Evidence',
  Document:             'Evidence',
  Other:                'Evidence',
};

// ─── Converters ───────────────────────────────────────────────────────────────

function fromEvidence(e: EvidenceRecord): UnifiedAttachment {
  const cat = EVIDENCE_TO_ATTACH_CATEGORY[e.category];
  const fileIcon = EVIDENCE_FILE_ICON[e.fileType as keyof typeof EVIDENCE_FILE_ICON] ?? '📎';
  const statusCfg = EVIDENCE_STATUS_CONFIG[e.status];

  return {
    id:           e.id,
    transaksiId:  e.transaksiId,
    category:     cat,
    fileType:     e.fileType,
    fileIcon,
    fileName:     e.fileName,
    caption:      e.caption,
    uploadedBy:   e.uploadedByNama,
    uploadedAt:   e.uploadedAt,
    status:       e.status,
    source:       'Evidence',
    sourceDetail: `${EVIDENCE_CATEGORY_CONFIG[e.category].label} Evidence`,
    auditLink:    `/marketplace/audit/${e.transaksiId}`,
    warnings:     e.warnings.map(w => ({ type: w.type, detail: w.detail })),
  };
}

function fromTransportEvidence(
  e: TransportEvidence,
  transaksiId: string,
  phase: 'Pickup' | 'Delivery',
): UnifiedAttachment {
  const fileIconMap: Record<string, string> = {
    Foto: '🖼️', Video: '🎥', Lokasi: '📍', Catatan: '📝',
  };

  return {
    id:           e.id,
    transaksiId,
    category:     'Transport',
    fileType:     e.type,
    fileIcon:     fileIconMap[e.type] ?? '📎',
    fileName:     e.content,
    caption:      `${phase} Evidence — ${e.gps ?? 'GPS tidak tersedia'}`,
    uploadedBy:   e.recipientName ?? e.uploadedBy,
    uploadedAt:   e.timestamp,
    status:       'Active',
    source:       'Transport',
    sourceDetail: `${phase} Evidence`,
    auditLink:    `/marketplace/audit/${transaksiId}`,
    warnings:     [],
  };
}

function fromEscrowTransfer(
  transfer: { id: string; fileName: string; nominal: number; bankTujuan: string; recordedBy: string; recordedAt: string; ocrWarnings: Array<{ type: string; detail: string }> },
  transaksiId: string,
): UnifiedAttachment {
  return {
    id:           transfer.id,
    transaksiId,
    category:     'Payment',
    fileType:     'Image',
    fileIcon:     '🖼️',
    fileName:     transfer.fileName,
    caption:      `Bukti Transfer Rp ${transfer.nominal.toLocaleString('id-ID')} ke ${transfer.bankTujuan}`,
    uploadedBy:   transfer.recordedBy,
    uploadedAt:   transfer.recordedAt,
    status:       'Verified',
    source:       'Escrow',
    sourceDetail: 'Bukti Transfer Escrow',
    auditLink:    `/marketplace/audit/${transaksiId}`,
    warnings:     transfer.ocrWarnings,
  };
}

// ─── Main Aggregator ──────────────────────────────────────────────────────────

/**
 * Get all unified attachments for a transaction, sorted newest first.
 * Aggregates from Evidence, Transport, and Escrow.
 */
export function getUnifiedAttachments(transaksiId: string): UnifiedAttachment[] {
  const result: UnifiedAttachment[] = [];

  // 1. Evidence
  const evidenceList = getEvidenceByTransaksiId(transaksiId);
  for (const e of evidenceList) {
    result.push(fromEvidence(e));
  }

  // 2. Transport Evidence
  const transportConfig = getTransportConfig(transaksiId);
  if (transportConfig?.marketplace) {
    for (const e of transportConfig.marketplace.pickupEvidence) {
      result.push(fromTransportEvidence(e, transaksiId, 'Pickup'));
    }
    for (const e of transportConfig.marketplace.deliveryEvidence) {
      result.push(fromTransportEvidence(e, transaksiId, 'Delivery'));
    }
  }
  if (transportConfig?.external) {
    for (const e of transportConfig.external.pickupEvidence) {
      result.push(fromTransportEvidence(e, transaksiId, 'Pickup'));
    }
    for (const e of transportConfig.external.deliveryEvidence) {
      result.push(fromTransportEvidence(e, transaksiId, 'Delivery'));
    }
  }
  if (transportConfig?.sellerArranges) {
    for (const e of transportConfig.sellerArranges.evidence) {
      result.push(fromTransportEvidence(e, transaksiId, 'Delivery'));
    }
  }

  // 3. Escrow Transfer Proof
  const escrowRecord = getEscrowByTransaksiId(transaksiId);
  if (escrowRecord) {
    for (const t of escrowRecord.transfers) {
      result.push(fromEscrowTransfer(t, transaksiId));
    }
  }

  // Sort newest first
  return result.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/**
 * Filter attachments by category.
 */
export function filterAttachments(
  attachments: UnifiedAttachment[],
  category: AttachmentCategory,
  query?: string,
): UnifiedAttachment[] {
  let result = [...attachments];

  if (category !== 'All') {
    result = result.filter(a => a.category === category);
  }

  if (query?.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      a =>
        a.fileName.toLowerCase().includes(q) ||
        a.caption.toLowerCase().includes(q) ||
        a.uploadedBy.toLowerCase().includes(q) ||
        a.sourceDetail.toLowerCase().includes(q),
    );
  }

  return result;
}

/**
 * Count attachments per category for badge display.
 */
export function countAttachmentsByCategory(
  attachments: UnifiedAttachment[],
): Record<Exclude<AttachmentCategory, 'All'>, number> {
  return {
    Deal:      attachments.filter(a => a.category === 'Deal').length,
    Payment:   attachments.filter(a => a.category === 'Payment').length,
    Transport: attachments.filter(a => a.category === 'Transport').length,
    Evidence:  attachments.filter(a => a.category === 'Evidence').length,
    Dispute:   attachments.filter(a => a.category === 'Dispute').length,
  };
}
