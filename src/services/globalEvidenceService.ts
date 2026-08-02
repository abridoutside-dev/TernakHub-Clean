// ─── Global Evidence Service — FOUNDATION-GLOBAL-EVIDENCE-001 ────────────────
//
// Satu-satunya entry point yang boleh digunakan modul lain untuk membaca
// atau mengelola evidence di TernakHub.
//
// PRINSIP:
//   1. Evidence berdiri sendiri — tidak bergantung pada satu modul saja.
//   2. Setiap modul cukup menyimpan evidence_uuid sebagai foreign key.
//   3. createEvidence() adalah satu-satunya cara menulis evidence baru.
//   4. Evidence TIDAK BISA dihapus — gunakan archiveEvidence() untuk menonaktifkan.
//   5. Media dihubungkan via media_uuid → gunakan repository media untuk resolusi.
//
// API PUBLIK:
//   createEvidence(input)                    → EvidenceRecord
//   getEvidence(filters?)                    → EvidenceRecord[]
//   getEvidenceByUuid(uuid)                  → EvidenceRecord | undefined
//   getEvidenceByReference(module, refUuid)  → EvidenceRecord[]
//   verifyEvidence(uuid, verifiedBy)         → EvidenceRecord
//   rejectEvidence(uuid, rejectedBy, reason) → EvidenceRecord
//   archiveEvidence(uuid)                    → EvidenceRecord
//
// SIAP DIGUNAKAN OLEH:
//   ✓ Livestock         — Bukti Kepemilikan, Foto, Bukti Timbang
//   ✓ Marketplace       — Foto listing, Dokumen listing
//   ✓ Kesehatan Hewan   — Bukti Pemeriksaan, Bukti Vaksinasi, Foto kondisi
//   ✓ Transaksi         — Bukti Pembayaran, Bukti Pengiriman, Bukti Penerimaan
//   ✓ Escrow            — Bukti Transfer, Bukti Pembayaran
//   ✓ Audit Trail       — evidence_uuid dapat disimpan di AuditTrailRecord.metadata
//   ✓ Reproduksi        — Foto perkembangan, Dokumen program
//   ✓ Batch             — Foto batch, Dokumen program
//   ✓ Mutasi            — Bukti Pengiriman, Bukti Penerimaan
//   ✓ Stok Pakan/Obat   — Dokumen, Foto stok
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   media_uuid          → Supabase media repository
//   evidence_uuid       → dapat disimpan di entitas modul sebagai foreign key
//   uploaded_by         → workspaceManagementData.ts (workspace UUID)
//   verified_by         → workspaceManagementData.ts (workspace UUID)
// ─────────────────────────────────────────────────────────────────────────────

import {
  type EvidenceRecord,
  type EvidenceType,
  type EvidenceStatus,
  type EvidenceReferenceModule,
  type EvidenceRejection,
  _insertEvidence,
  _getAllEvidence,
  _replaceEvidence,
  GLOBAL_EVIDENCE_DB,
  generateUUID,
} from '../data/globalEvidenceData';

// Re-export types agar consumer tidak perlu import dari data layer langsung.
export type { EvidenceRecord, EvidenceType, EvidenceStatus, EvidenceReferenceModule };
export {
  EVIDENCE_TYPE_LIST,
  EVIDENCE_STATUS_LIST,
  EVIDENCE_REFERENCE_MODULES,
} from '../data/globalEvidenceData';

// ─── Public Filter & Input Types ──────────────────────────────────────────────

export interface GetEvidenceFilters {
  /** Filter berdasarkan reference_module. */
  module?: EvidenceReferenceModule;
  /** Filter berdasarkan reference_uuid (dalam module tertentu). */
  referenceUuid?: string;
  /** Filter berdasarkan evidence_type. */
  evidenceType?: EvidenceType;
  /** Filter berdasarkan evidence_status. */
  status?: EvidenceStatus;
  /** Filter berdasarkan uploaded_by (workspaceId). */
  uploadedBy?: string;
  /**
   * Jika true, sertakan evidence yang sudah diarsipkan (deleted_at != null).
   * Default: false (hanya evidence aktif).
   */
  includeArchived?: boolean;
}

export interface CreateEvidenceInput {
  /** Jenis fungsional bukti. */
  evidence_type: EvidenceType;
  /** Modul pemilik (konteks relasi polimorfik). */
  reference_module: EvidenceReferenceModule;
  /** UUID entitas spesifik dalam reference_module. */
  reference_uuid: string;
  /**
   * UUID media dari Global Media Service.
   * null jika evidence berupa pernyataan teks tanpa lampiran file.
   */
  media_uuid?: string | null;
  /** Judul singkat evidence. */
  title: string;
  /** Deskripsi / keterangan tambahan. */
  description?: string | null;
  /**
   * Waktu bukti diambil/dibuat di sumber asli.
   * Bisa berbeda dari waktu upload. null jika tidak diketahui.
   */
  captured_at?: string | null;
  /** workspaceId atau user ID yang mengupload. */
  uploaded_by: string;
  /**
   * Data tambahan module-specific.
   * Contoh: { nominal: 5000000, bank: 'BCA' } untuk Bukti Transfer.
   */
  metadata?: Record<string, string | number | boolean | null>;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Membuat dan menyimpan evidence baru ke dalam store.
 * Status awal selalu 'Pending'.
 * Mengembalikan record yang baru dibuat.
 *
 * @example
 * // Bukti transfer dari Transaksi
 * const ev = createEvidence({
 *   evidence_type:     'Bukti Transfer',
 *   reference_module:  'transaksi',
 *   reference_uuid:    'TRX-20260716-001',
 *   media_uuid:        '3f2a1c00-...',
 *   title:             'Bukti transfer ke Escrow',
 *   uploaded_by:       'workspace-buyer-001',
 *   metadata:          { nominal: 5000000, bank: 'BCA' },
 * });
 *
 * // Bukti vaksinasi dari Kesehatan Hewan (tanpa file)
 * const ev = createEvidence({
 *   evidence_type:    'Bukti Vaksinasi',
 *   reference_module: 'kesehatan_hewan',
 *   reference_uuid:   'kh-pemeriksaan-uuid-xxx',
 *   media_uuid:       null,
 *   title:            'Vaksinasi ND-IB batch 2026-001',
 *   uploaded_by:      'workspace-drh-001',
 *   metadata:         { vaksinNama: 'ND-IB', batchNo: 'VK-2026-001' },
 * });
 */
export function createEvidence(input: CreateEvidenceInput): EvidenceRecord {
  const now = new Date().toISOString();

  const record: EvidenceRecord = {
    evidence_uuid:    generateUUID(),
    evidence_type:    input.evidence_type,
    reference_module: input.reference_module,
    reference_uuid:   input.reference_uuid,
    media_uuid:       input.media_uuid ?? null,
    title:            input.title,
    description:      input.description ?? null,
    evidence_status:  'Pending',
    captured_at:      input.captured_at ?? null,
    uploaded_by:      input.uploaded_by,
    verified_by:      null,
    verified_at:      null,
    rejection:        null,
    created_at:       now,
    updated_at:       now,
    deleted_at:       null,
    metadata:         input.metadata ?? {},
  };

  _insertEvidence(record);
  return record;
}

/**
 * Mengembalikan semua evidence yang sesuai dengan filter.
 * Default: hanya evidence aktif (deleted_at = null).
 * Hasil diurutkan dari terbaru ke terlama (created_at desc).
 *
 * @example
 * // Semua evidence aktif dari modul transaksi
 * getEvidence({ module: 'transaksi' })
 *
 * // Semua bukti pembayaran yang sudah terverifikasi
 * getEvidence({ evidenceType: 'Bukti Pembayaran', status: 'Verified' })
 *
 * // Termasuk yang sudah diarsipkan
 * getEvidence({ module: 'escrow', includeArchived: true })
 */
export function getEvidence(filters: GetEvidenceFilters = {}): EvidenceRecord[] {
  const {
    module: refModule,
    referenceUuid,
    evidenceType,
    status,
    uploadedBy,
    includeArchived = false,
  } = filters;

  let records = _getAllEvidence();

  if (!includeArchived) {
    records = records.filter((r) => r.deleted_at === null);
  }
  if (refModule !== undefined) {
    records = records.filter((r) => r.reference_module === refModule);
  }
  if (referenceUuid !== undefined) {
    records = records.filter((r) => r.reference_uuid === referenceUuid);
  }
  if (evidenceType !== undefined) {
    records = records.filter((r) => r.evidence_type === evidenceType);
  }
  if (status !== undefined) {
    records = records.filter((r) => r.evidence_status === status);
  }
  if (uploadedBy !== undefined) {
    records = records.filter((r) => r.uploaded_by === uploadedBy);
  }

  // Terbaru lebih dulu
  return records.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * Mencari satu evidence berdasarkan UUID-nya.
 * Mengembalikan undefined jika tidak ditemukan.
 * Mengembalikan record meskipun sudah diarsipkan (deleted_at != null).
 *
 * @example
 * const ev = getEvidenceByUuid('3f2a1c00-...');
 * console.log(ev?.title);
 */
export function getEvidenceByUuid(uuid: string): EvidenceRecord | undefined {
  return GLOBAL_EVIDENCE_DB.get(uuid);
}

/**
 * Mengembalikan semua evidence aktif yang terkait dengan entitas tertentu.
 * Setara dengan getEvidence({ module, referenceUuid }).
 *
 * @example
 * // Semua evidence untuk transaksi tertentu
 * getEvidenceByReference('transaksi', 'TRX-20260716-001')
 *
 * // Semua evidence untuk satu livestock
 * getEvidenceByReference('livestock', 'D-20260101-001')
 *
 * // Termasuk yang sudah diarsipkan
 * getEvidenceByReference('escrow', 'esc-uuid-xxx', true)
 */
export function getEvidenceByReference(
  module: EvidenceReferenceModule,
  referenceUuid: string,
  includeArchived = false,
): EvidenceRecord[] {
  return getEvidence({ module, referenceUuid, includeArchived });
}

/**
 * Memverifikasi evidence — mengubah status dari 'Pending' ke 'Verified'.
 * Mengembalikan record yang sudah diperbarui.
 *
 * GUARD: Melempar Error jika:
 *   - UUID tidak ditemukan
 *   - Evidence sudah diarsipkan
 *   - Status bukan 'Pending' (sudah Verified/Rejected)
 *
 * @example
 * verifyEvidence('ev-uuid-xxx', 'workspace-escrow-001')
 */
export function verifyEvidence(uuid: string, verifiedBy: string): EvidenceRecord {
  const existing = _getOrThrow(uuid);
  _assertNotArchived(existing, 'verifyEvidence');

  if (existing.evidence_status !== 'Pending') {
    throw new Error(
      `[GlobalEvidenceService] verifyEvidence: evidence "${uuid}" ` +
        `sudah dalam status "${existing.evidence_status}" — hanya 'Pending' yang dapat diverifikasi.`,
    );
  }

  const now = new Date().toISOString();
  const updated: EvidenceRecord = {
    ...existing,
    evidence_status: 'Verified',
    verified_by:     verifiedBy,
    verified_at:     now,
    updated_at:      now,
  };

  _replaceEvidence(updated);
  return updated;
}

/**
 * Menolak evidence — mengubah status dari 'Pending' ke 'Rejected'.
 * Mengembalikan record yang sudah diperbarui.
 *
 * GUARD: Melempar Error jika:
 *   - UUID tidak ditemukan
 *   - Evidence sudah diarsipkan
 *   - Status bukan 'Pending'
 *
 * @example
 * rejectEvidence('ev-uuid-xxx', 'workspace-escrow-001', 'Nominal tidak sesuai kontrak.')
 */
export function rejectEvidence(
  uuid: string,
  rejectedBy: string,
  reason: string = 'Tidak disebutkan.',
): EvidenceRecord {
  const existing = _getOrThrow(uuid);
  _assertNotArchived(existing, 'rejectEvidence');

  if (existing.evidence_status !== 'Pending') {
    throw new Error(
      `[GlobalEvidenceService] rejectEvidence: evidence "${uuid}" ` +
        `sudah dalam status "${existing.evidence_status}" — hanya 'Pending' yang dapat ditolak.`,
    );
  }

  const now = new Date().toISOString();
  const rejection: EvidenceRejection = {
    rejected_by: rejectedBy,
    reason,
    rejected_at: now,
  };

  const updated: EvidenceRecord = {
    ...existing,
    evidence_status: 'Rejected',
    rejection,
    updated_at: now,
  };

  _replaceEvidence(updated);
  return updated;
}

/**
 * Mengarsipkan evidence — mengubah status ke 'Archived' dan menetapkan deleted_at.
 * Evidence yang sudah diarsipkan TIDAK BISA dipulihkan.
 * Operasi ini bersifat idempotent — memanggil ulang tidak mengubah apa pun.
 * Mengembalikan record yang sudah diperbarui.
 *
 * GUARD: Melempar Error jika UUID tidak ditemukan.
 *
 * @example
 * // Arsipkan evidence yang tidak lagi relevan (tetap tersimpan untuk audit)
 * archiveEvidence('ev-uuid-xxx')
 */
export function archiveEvidence(uuid: string): EvidenceRecord {
  const existing = _getOrThrow(uuid);

  // Idempotent — sudah diarsipkan, kembalikan apa adanya
  if (existing.deleted_at !== null) return existing;

  const now = new Date().toISOString();
  const updated: EvidenceRecord = {
    ...existing,
    evidence_status: 'Archived',
    deleted_at:      now,
    updated_at:      now,
  };

  _replaceEvidence(updated);
  return updated;
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

function _getOrThrow(uuid: string): EvidenceRecord {
  const record = GLOBAL_EVIDENCE_DB.get(uuid);
  if (!record) {
    throw new Error(
      `[GlobalEvidenceService] Evidence tidak ditemukan: "${uuid}".`,
    );
  }
  return record;
}

function _assertNotArchived(record: EvidenceRecord, caller: string): void {
  if (record.deleted_at !== null) {
    throw new Error(
      `[GlobalEvidenceService] ${caller}: evidence "${record.evidence_uuid}" ` +
        `sudah diarsipkan pada ${record.deleted_at} dan tidak dapat diubah.`,
    );
  }
}
