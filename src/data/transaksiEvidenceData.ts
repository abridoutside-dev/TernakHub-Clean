// ─── PROFILE-006 — Transaction Evidence Foundation ────────────────────────────
// Evidence adalah bukti resmi transaksi — dipisahkan dari Chat.
// Mengacu pada: docs/architecture/TRANSACTION_CONVERSATION_CONSTITUTION.md
//
// Aturan utama:
//  - Evidence TIDAK BISA dihapus setelah dicatat.
//  - Evidence dipisahkan dari Chat dan Audit Trail.
//  - Warning adalah metadata — belum ada AI OCR di Foundation ini.
//  - Retention policy siap di struktur, belum ada proses otomatis.

import { generateUUID } from '../utils/uuid';
import { getTransaksiById } from './marketplaceTransaksiData';
import { WORKSPACES } from '../components/TopAppBar';
import { type ParticipantRole } from './transaksiConversationData';

// ─── Tipe ─────────────────────────────────────────────────────────────────────

export type EvidenceCategory =
  | 'Agreement'
  | 'Payment'
  | 'Delivery'
  | 'Arrival'
  | 'Livestock Condition'
  | 'Document'
  | 'Other';

export type EvidenceFileType = 'Image' | 'PDF' | 'Video';

export type EvidenceStatus = 'Pending' | 'Verified' | 'Disputed';

export type EvidenceWarningType =
  | 'OCR Tidak Sesuai'
  | 'Nominal Berbeda'
  | 'File Rusak'
  | 'Other';

// ─── Retention Policy ─────────────────────────────────────────────────────────

export interface EvidenceRetentionPolicy {
  /** null = permanen */
  retentionDays: number | null;
  label: string;
}

/** Retensi per kategori Evidence (lebih lama dari Chat). */
export const EVIDENCE_RETENTION: Record<EvidenceCategory, EvidenceRetentionPolicy> = {
  Agreement:            { retentionDays: 730,  label: '2 tahun' },
  Payment:              { retentionDays: 1825, label: '5 tahun' },
  Delivery:             { retentionDays: 365,  label: '1 tahun' },
  Arrival:              { retentionDays: 365,  label: '1 tahun' },
  'Livestock Condition':{ retentionDays: 365,  label: '1 tahun' },
  Document:             { retentionDays: 1825, label: '5 tahun' },
  Other:                { retentionDays: 365,  label: '1 tahun' },
};

/** Retensi Chat (default 90 hari, dapat diubah). */
export const CHAT_RETENTION_DAYS = 90;

// ─── Warning ──────────────────────────────────────────────────────────────────

export interface EvidenceWarning {
  type: EvidenceWarningType;
  detail: string;
  /** ISO datetime */
  flaggedAt: string;
}

// ─── Evidence Record ──────────────────────────────────────────────────────────

export interface EvidenceRecord {
  /** UUID v4 */
  id: string;
  transaksiId: string;
  category: EvidenceCategory;
  fileType: EvidenceFileType;
  /** Nama file atau emoji placeholder */
  fileName: string;
  caption: string;
  /** WorkspaceId pengunggah */
  uploadedBy: string;
  uploadedByRole: ParticipantRole;
  /** Nama workspace — denormalized */
  uploadedByNama: string;
  /** ISO datetime */
  uploadedAt: string;
  status: EvidenceStatus;
  warnings: EvidenceWarning[];
  retention: EvidenceRetentionPolicy;
}

// ─── Input untuk Add Evidence ─────────────────────────────────────────────────

export interface AddEvidenceInput {
  transaksiId: string;
  category: EvidenceCategory;
  fileType: EvidenceFileType;
  fileName: string;
  caption: string;
  uploadedBy: string;
  uploadedByRole: ParticipantRole;
  uploadedByNama: string;
}

// ─── Konfigurasi Kategori ─────────────────────────────────────────────────────

export const EVIDENCE_CATEGORY_CONFIG: Record<
  EvidenceCategory,
  { icon: string; color: string; bg: string; label: string }
> = {
  Agreement:            { icon: '🤝', color: '#1b7a43', bg: '#e8f5ee', label: 'Agreement' },
  Payment:              { icon: '💳', color: '#e65100', bg: '#fff3e0', label: 'Payment' },
  Delivery:             { icon: '🚚', color: '#006064', bg: '#e0f7fa', label: 'Delivery' },
  Arrival:              { icon: '📍', color: '#6a1b9a', bg: '#f3e5f5', label: 'Arrival' },
  'Livestock Condition':{ icon: '🐑', color: '#1565c0', bg: '#e3f2fd', label: 'Livestock Condition' },
  Document:             { icon: '📄', color: '#5d4037', bg: '#efebe9', label: 'Document' },
  Other:                { icon: '📎', color: '#546e7a', bg: '#eceff1', label: 'Other' },
};

export const EVIDENCE_FILE_ICON: Record<EvidenceFileType, string> = {
  Image: '🖼️',
  PDF:   '📄',
  Video: '🎥',
};

export const EVIDENCE_STATUS_CONFIG: Record<
  EvidenceStatus,
  { icon: string; color: string; bg: string }
> = {
  Pending:  { icon: '⏳', color: '#7b5e2a', bg: '#fff8e1' },
  Verified: { icon: '✅', color: '#1b7a43', bg: '#e8f5ee' },
  Disputed: { icon: '⚠️', color: '#c62828', bg: '#ffebee' },
};

// ─── In-memory Store ──────────────────────────────────────────────────────────

let EVIDENCE_RECORDS: EvidenceRecord[] = [];
let _seeded = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowMinus(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function getWorkspaceNama(id: string): string {
  return WORKSPACES.find((w) => w.id === id)?.name ?? id;
}

function makeEvidence(
  transaksiId: string,
  category: EvidenceCategory,
  fileType: EvidenceFileType,
  fileName: string,
  caption: string,
  uploadedBy: string,
  uploadedByRole: ParticipantRole,
  minsAgo: number,
  status: EvidenceStatus,
  warnings: EvidenceWarning[] = [],
): EvidenceRecord {
  return {
    id: generateUUID(),
    transaksiId,
    category,
    fileType,
    fileName,
    caption,
    uploadedBy,
    uploadedByRole,
    uploadedByNama: getWorkspaceNama(uploadedBy),
    uploadedAt: nowMinus(minsAgo),
    status,
    warnings,
    retention: EVIDENCE_RETENTION[category],
  };
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

function seedIfNeeded(): void {
  if (_seeded) return;
  _seeded = true;

  // TRX-20260711-002: Disetujui (Pakan)
  const t2 = getTransaksiById('TRX-20260711-002');
  if (t2) {
    EVIDENCE_RECORDS.push(
      makeEvidence(
        'TRX-20260711-002', 'Agreement', 'PDF',
        'kesepakatan-harga-pakan.pdf',
        'Kesepakatan harga 10 sak pakan Rp 500.000/sak — sudah disetujui kedua pihak.',
        t2.workspaceIdPembeli, 'Buyer', 85, 'Verified',
      ),
    );
  }

  // TRX-20260712-004: Diproses (Pakan)
  const t4 = getTransaksiById('TRX-20260712-004');
  if (t4) {
    EVIDENCE_RECORDS.push(
      makeEvidence(
        'TRX-20260712-004', 'Payment', 'Image',
        'bukti-transfer-bca-12-juli.jpg',
        'Bukti transfer BCA tanggal 12 Juli 2026 sebesar Rp 10.000.000.',
        t4.workspaceIdPembeli, 'Buyer', 55, 'Verified',
        [
          {
            type: 'Nominal Berbeda',
            detail: 'Nominal pada bukti transfer (Rp 10.000.000) berbeda dengan total transaksi tercatat. Harap verifikasi.',
            flaggedAt: nowMinus(50),
          },
        ],
      ),
      makeEvidence(
        'TRX-20260712-004', 'Payment', 'PDF',
        'konfirmasi-penerimaan-dana.pdf',
        'Konfirmasi penerimaan pembayaran dari penjual. Dana masuk rekening.',
        t4.workspaceIdPenjual, 'Seller', 45, 'Verified',
      ),
    );
  }

  // TRX-20260712-005: Siap Diserahkan (Transport)
  const t5 = getTransaksiById('TRX-20260712-005');
  if (t5) {
    EVIDENCE_RECORDS.push(
      makeEvidence(
        'TRX-20260712-005', 'Agreement', 'Image',
        'konfirmasi-jadwal-penjemputan.jpg',
        'Konfirmasi jadwal penjemputan 14 Juli 2026 pukul 08.00 WIB.',
        t5.workspaceIdPenjual, 'Seller', 25, 'Pending',
      ),
      makeEvidence(
        'TRX-20260712-005', 'Document', 'PDF',
        'surat-jalan-ternak.pdf',
        'Surat jalan ternak dari peternakan ke lokasi pembeli.',
        t5.workspaceIdPenjual, 'Seller', 20, 'Pending',
      ),
    );
  }
}

// ─── Fungsi Publik ────────────────────────────────────────────────────────────

export function getEvidenceByTransaksiId(transaksiId: string): EvidenceRecord[] {
  seedIfNeeded();
  return EVIDENCE_RECORDS
    .filter((e) => e.transaksiId === transaksiId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)); // newest first
}

export function getEvidenceById(id: string): EvidenceRecord | undefined {
  seedIfNeeded();
  return EVIDENCE_RECORDS.find((e) => e.id === id);
}

/**
 * Menambah Evidence baru.
 * Evidence TIDAK BISA dihapus setelah dicatat.
 */
export function addEvidence(input: AddEvidenceInput): EvidenceRecord {
  seedIfNeeded();
  const record: EvidenceRecord = {
    id: generateUUID(),
    transaksiId:    input.transaksiId,
    category:       input.category,
    fileType:       input.fileType,
    fileName:       input.fileName,
    caption:        input.caption,
    uploadedBy:     input.uploadedBy,
    uploadedByRole: input.uploadedByRole,
    uploadedByNama: input.uploadedByNama,
    uploadedAt:     new Date().toISOString(),
    status:         'Pending',
    warnings:       [],
    retention:      EVIDENCE_RETENTION[input.category],
  };
  EVIDENCE_RECORDS.push(record);
  return record;
}

/**
 * Menambah Warning pada Evidence yang ada.
 */
export function addEvidenceWarning(
  evidenceId: string,
  type: EvidenceWarningType,
  detail: string,
): void {
  seedIfNeeded();
  const rec = EVIDENCE_RECORDS.find((e) => e.id === evidenceId);
  if (!rec) return;
  rec.warnings.push({ type, detail, flaggedAt: new Date().toISOString() });
}

/**
 * Update status Evidence (Pending → Verified | Disputed).
 */
export function updateEvidenceStatus(evidenceId: string, status: EvidenceStatus): void {
  seedIfNeeded();
  const rec = EVIDENCE_RECORDS.find((e) => e.id === evidenceId);
  if (rec) rec.status = status;
}

/**
 * Filter Evidence berdasarkan kategori dan/atau query caption.
 */
export function filterEvidence(
  transaksiId: string,
  category?: EvidenceCategory | 'All',
  query?: string,
): EvidenceRecord[] {
  let records = getEvidenceByTransaksiId(transaksiId);
  if (category && category !== 'All') {
    records = records.filter((e) => e.category === category);
  }
  if (query?.trim()) {
    const q = query.toLowerCase();
    records = records.filter(
      (e) =>
        e.caption.toLowerCase().includes(q) ||
        e.fileName.toLowerCase().includes(q) ||
        e.uploadedByNama.toLowerCase().includes(q),
    );
  }
  return records;
}
