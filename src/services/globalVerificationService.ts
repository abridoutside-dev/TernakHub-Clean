// ─── Global Verification Service — FOUNDATION-GLOBAL-VERIFICATION-001 ─────────
//
// Satu-satunya entry point yang boleh digunakan modul lain untuk membuat
// atau mengelola proses verifikasi di TernakHub.
//
// PRINSIP:
//   1. Semua proses verifikasi HARUS melalui service ini — tidak boleh menulis
//      langsung ke GLOBAL_VERIFICATION_DB.
//   2. Verification BUKAN approval manual semata — mendukung Manual, Automatic,
//      AI Assisted (future), dan Third Party (future).
//   3. Verification digunakan untuk memvalidasi data berdasarkan evidence,
//      aturan bisnis, dan konsistensi data.
//   4. Status terminal (Verified/Rejected/Expired/Cancelled) tidak bisa diubah.
//   5. UI, Marketplace, halaman Verification, dan workflow TIDAK diubah.
//   6. Wiring/sync ke modul lain BELUM dilakukan — disiapkan sebagai relasi.
//
// API PUBLIK:
//   createVerification(input)                         → VerificationRecord
//   getVerification(filters?)                         → VerificationRecord[]
//   getVerificationByUuid(uuid)                       → VerificationRecord | undefined
//   getVerificationByEntity(typeUuid, entityUuid)     → VerificationRecord[]
//   verify(uuid, input?)                              → VerificationRecord
//   reject(uuid, input)                               → VerificationRecord
//   expire(uuid)                                      → VerificationRecord
//   recalculateVerification(uuid, score)              → VerificationRecord
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   evidence_uuid   → Global Evidence Service (globalEvidenceService.ts)
//   trust update    → Global Trust Service (globalTrustService.ts)
//   audit log       → Global Audit Trail Service (globalAuditTrailService.ts)
//   activity log    → Global Activity Service (globalActivityService.ts)
//   transaction ctx → Global Transaction Service (globalTransactionService.ts)
//   types/statuses  → Global Reference Service (globalReferenceService.ts)
//
// SIAP DIGUNAKAN OLEH:
//   ✓ Workspace          — VERIFICATION_ENTITY_TYPE_UUID.WORKSPACE
//   ✓ Farm               — VERIFICATION_ENTITY_TYPE_UUID.FARM
//   ✓ Livestock          — VERIFICATION_ENTITY_TYPE_UUID.LIVESTOCK
//   ✓ Marketplace Listing — VERIFICATION_ENTITY_TYPE_UUID.MARKETPLACE_LISTING
//   ✓ Seller             — VERIFICATION_ENTITY_TYPE_UUID.SELLER
//   ✓ Buyer              — VERIFICATION_ENTITY_TYPE_UUID.BUYER
//   ✓ Transport          — VERIFICATION_ENTITY_TYPE_UUID.TRANSPORT
//   ✓ Veterinary         — VERIFICATION_ENTITY_TYPE_UUID.VETERINARY
//   ✓ Evidence           — VERIFICATION_ENTITY_TYPE_UUID.EVIDENCE
//   ✓ Transaction        — VERIFICATION_ENTITY_TYPE_UUID.TRANSACTION
// ─────────────────────────────────────────────────────────────────────────────

import {
  type VerificationRecord,
  type CreateVerificationInput,
  type VerifyInput,
  type RejectInput,
  type GetVerificationFilter,
  type VerificationMode,
  VERIFICATION_TYPE_UUID,
  VERIFICATION_STATUS_UUID,
  VERIFICATION_ENTITY_TYPE_UUID,
  TERMINAL_VERIFICATION_STATUSES,
  _insertVerification,
  _replaceVerification,
  _getAllVerifications,
  GLOBAL_VERIFICATION_DB,
  generateUUID,
} from '../data/globalVerificationData';

// Re-export types & konstanta agar consumer tidak import dari data layer langsung.
export type {
  VerificationRecord,
  CreateVerificationInput,
  VerifyInput,
  RejectInput,
  GetVerificationFilter,
  VerificationMode,
};
export {
  VERIFICATION_TYPE_UUID,
  VERIFICATION_STATUS_UUID,
  VERIFICATION_ENTITY_TYPE_UUID,
  TERMINAL_VERIFICATION_STATUSES,
};

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Membuat proses verifikasi baru dengan status awal Pending.
 * Mengembalikan record yang baru dibuat.
 *
 * GUARD: entity_uuid tidak boleh kosong.
 *
 * @example
 * // Buat verifikasi identitas workspace secara manual
 * createVerification({
 *   verification_type_reference_uuid:  VERIFICATION_TYPE_UUID.IDENTITY,
 *   entity_type_reference_uuid:        VERIFICATION_ENTITY_TYPE_UUID.WORKSPACE,
 *   entity_uuid:                       wsUuid,
 *   verifier_workspace_uuid:           adminWsUuid,
 *   verification_mode:                 'manual',
 *   expired_at:                        '2027-01-01T00:00:00.000Z',
 * });
 *
 * // Buat verifikasi otomatis untuk evidence
 * createVerification({
 *   verification_type_reference_uuid:  VERIFICATION_TYPE_UUID.EVIDENCE,
 *   entity_type_reference_uuid:        VERIFICATION_ENTITY_TYPE_UUID.EVIDENCE,
 *   entity_uuid:                       evidenceUuid,
 *   evidence_uuid:                     evidenceUuid,
 *   verification_mode:                 'automatic',
 * });
 */
export function createVerification(input: CreateVerificationInput): VerificationRecord {
  if (!input.entity_uuid.trim()) {
    throw new Error('[GlobalVerificationService] entity_uuid tidak boleh kosong.');
  }

  const now = new Date().toISOString();

  const record: VerificationRecord = {
    verification_uuid:                  generateUUID(),
    verification_type_reference_uuid:   input.verification_type_reference_uuid,
    verification_status_reference_uuid: VERIFICATION_STATUS_UUID.PENDING,
    entity_type_reference_uuid:         input.entity_type_reference_uuid,
    entity_uuid:                        input.entity_uuid.trim(),
    evidence_uuid:                      input.evidence_uuid ?? null,
    verifier_workspace_uuid:            input.verifier_workspace_uuid ?? null,
    verifier_user_uuid:                 input.verifier_user_uuid ?? null,
    verification_mode:                  input.verification_mode ?? 'manual',
    verification_score:                 null,
    verification_note:                  input.verification_note ?? null,
    verified_at:                        null,
    expired_at:                         input.expired_at ?? null,
    created_at:                         now,
    updated_at:                         now,
  };

  _insertVerification(record);
  return record;
}

/**
 * Mengembalikan satu verification record berdasarkan UUID.
 * Mengembalikan undefined jika tidak ditemukan.
 *
 * @example
 * const vrf = getVerificationByUuid('uuid-vrf-xxx');
 */
export function getVerificationByUuid(uuid: string): VerificationRecord | undefined {
  return GLOBAL_VERIFICATION_DB.get(uuid);
}

/**
 * Mengembalikan daftar verification record sesuai filter.
 * Hasil diurutkan berdasarkan created_at descending (terbaru lebih awal).
 * Mendukung pagination via limit + offset.
 *
 * @example
 * // Semua verifikasi Workspace yang masih Pending
 * getVerification({
 *   entity_type_reference_uuid:         VERIFICATION_ENTITY_TYPE_UUID.WORKSPACE,
 *   verification_status_reference_uuid: VERIFICATION_STATUS_UUID.PENDING,
 * });
 *
 * // Hanya verifikasi aktif (Verified + belum expired)
 * getVerification({ active_only: true });
 */
export function getVerification(filters: GetVerificationFilter = {}): VerificationRecord[] {
  return _queryVerifications(filters);
}

/**
 * Mengembalikan semua verification record untuk entity spesifik
 * (kombinasi entity_type × entity_uuid).
 * Berguna untuk menampilkan riwayat verifikasi suatu entitas.
 * Hasil diurutkan dari yang terbaru.
 *
 * @example
 * // Semua verifikasi untuk livestock tertentu
 * getVerificationByEntity(VERIFICATION_ENTITY_TYPE_UUID.LIVESTOCK, livestock.id);
 *
 * // Semua verifikasi untuk seller tertentu
 * getVerificationByEntity(VERIFICATION_ENTITY_TYPE_UUID.SELLER, wsUuid);
 */
export function getVerificationByEntity(
  entityTypeUuid: string,
  entityUuid: string,
): VerificationRecord[] {
  return _queryVerifications({
    entity_type_reference_uuid: entityTypeUuid,
    entity_uuid:                entityUuid,
  });
}

/**
 * Menyetujui (verify) sebuah proses verifikasi.
 * Status berubah: Pending/In Review → Verified.
 * Idempotent jika sudah Verified.
 * Melempar Error jika status terminal selain Verified.
 *
 * @example
 * // Verifikasi identitas workspace dengan score penuh
 * verify('uuid-vrf-xxx', {
 *   verification_score: 95,
 *   verification_note: 'Dokumen KTP valid, NIK terkonfirmasi.',
 *   expired_at: '2027-07-17T00:00:00.000Z',
 * });
 *
 * // Verifikasi otomatis tanpa catatan
 * verify('uuid-vrf-yyy');
 */
export function verify(uuid: string, input: VerifyInput = {}): VerificationRecord {
  const existing = _getOrThrow(uuid);

  // Idempotent
  if (existing.verification_status_reference_uuid === VERIFICATION_STATUS_UUID.VERIFIED) {
    return existing;
  }

  _guardNotTerminal(existing, 'verify');

  const now = new Date().toISOString();
  const updated: VerificationRecord = {
    ...existing,
    verification_status_reference_uuid: VERIFICATION_STATUS_UUID.VERIFIED,
    verification_score:                 input.verification_score ?? 100,
    verification_note:                  input.verification_note ?? existing.verification_note,
    expired_at:                         input.expired_at !== undefined ? input.expired_at : existing.expired_at,
    verified_at:                        now,
    updated_at:                         now,
  };

  _replaceVerification(updated);
  return updated;
}

/**
 * Menolak (reject) sebuah proses verifikasi.
 * Status berubah: Pending/In Review → Rejected.
 * Melempar Error jika sudah terminal.
 * Catatan alasan penolakan wajib diisi.
 *
 * @example
 * reject('uuid-vrf-xxx', {
 *   verification_note: 'Foto ternak tidak jelas, breed tidak dapat dikonfirmasi.',
 *   verification_score: 15,
 * });
 */
export function reject(uuid: string, input: RejectInput): VerificationRecord {
  if (!input.verification_note.trim()) {
    throw new Error(
      '[GlobalVerificationService] verification_note wajib diisi saat menolak verifikasi.',
    );
  }

  const existing = _getOrThrow(uuid);
  _guardNotTerminal(existing, 'reject');

  const now = new Date().toISOString();
  const updated: VerificationRecord = {
    ...existing,
    verification_status_reference_uuid: VERIFICATION_STATUS_UUID.REJECTED,
    verification_score:                 input.verification_score ?? 0,
    verification_note:                  input.verification_note.trim(),
    verified_at:                        now,
    updated_at:                         now,
  };

  _replaceVerification(updated);
  return updated;
}

/**
 * Menandai verifikasi sebagai kedaluwarsa (Expired).
 * Dapat dipanggil pada verifikasi dengan status apapun yang belum terminal.
 * Idempotent jika sudah Expired.
 * Melempar Error jika status terminal lain (Verified yang kedaluwarsa
 * tetap bisa di-expire secara eksplisit).
 *
 * @example
 * expire('uuid-vrf-xxx');
 */
export function expire(uuid: string): VerificationRecord {
  const existing = _getOrThrow(uuid);

  // Idempotent
  if (existing.verification_status_reference_uuid === VERIFICATION_STATUS_UUID.EXPIRED) {
    return existing;
  }

  // Hanya Rejected dan Cancelled yang tidak bisa di-expire
  if (
    existing.verification_status_reference_uuid === VERIFICATION_STATUS_UUID.REJECTED ||
    existing.verification_status_reference_uuid === VERIFICATION_STATUS_UUID.CANCELLED
  ) {
    throw new Error(
      `[GlobalVerificationService] Verifikasi "${uuid}" berstatus ` +
        `"${existing.verification_status_reference_uuid}" — tidak dapat di-expire.`,
    );
  }

  const now = new Date().toISOString();
  const updated: VerificationRecord = {
    ...existing,
    verification_status_reference_uuid: VERIFICATION_STATUS_UUID.EXPIRED,
    expired_at:                         now,
    updated_at:                         now,
  };

  _replaceVerification(updated);
  return updated;
}

/**
 * Menghitung ulang verification_score tanpa mengubah status verifikasi.
 * Berguna saat evidence baru tersedia atau aturan bisnis berubah.
 * Melempar Error jika verifikasi sudah terminal dengan status Cancelled.
 *
 * Score harus dalam rentang 0–100.
 *
 * RELASI (belum di-wire):
 *   Setelah recalculate, skor baru harus dipropagasikan ke Global Trust Service
 *   melalui recalculateTrust() dengan verification_score yang diperbarui.
 *
 * @example
 * // Setelah evidence tambahan diunggah, hitung ulang score
 * recalculateVerification('uuid-vrf-xxx', 88);
 */
export function recalculateVerification(uuid: string, score: number): VerificationRecord {
  if (score < 0 || score > 100) {
    throw new Error(
      `[GlobalVerificationService] verification_score harus dalam rentang 0–100. Diterima: ${score}.`,
    );
  }

  const existing = _getOrThrow(uuid);

  if (existing.verification_status_reference_uuid === VERIFICATION_STATUS_UUID.CANCELLED) {
    throw new Error(
      `[GlobalVerificationService] Verifikasi "${uuid}" sudah dibatalkan — tidak dapat dihitung ulang.`,
    );
  }

  const now = new Date().toISOString();
  const updated: VerificationRecord = {
    ...existing,
    verification_score: Math.round(score * 100) / 100,
    updated_at:         now,
  };

  _replaceVerification(updated);
  return updated;
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

function _getOrThrow(uuid: string): VerificationRecord {
  const record = GLOBAL_VERIFICATION_DB.get(uuid);
  if (!record) {
    throw new Error(
      `[GlobalVerificationService] Verification tidak ditemukan: "${uuid}".`,
    );
  }
  return record;
}

/**
 * Melempar Error jika record sudah dalam status terminal selain Verified
 * (Verified memiliki penanganan idempotent tersendiri di verify()).
 */
function _guardNotTerminal(record: VerificationRecord, operation: string): void {
  const status = record.verification_status_reference_uuid;
  if (
    TERMINAL_VERIFICATION_STATUSES.has(status) &&
    status !== VERIFICATION_STATUS_UUID.VERIFIED
  ) {
    throw new Error(
      `[GlobalVerificationService] Tidak dapat melakukan "${operation}" — ` +
        `verifikasi "${record.verification_uuid}" sudah dalam status terminal "${status}".`,
    );
  }
}

/**
 * Query internal untuk semua fungsi getVerification*.
 * Hasil diurutkan berdasarkan created_at descending.
 */
function _queryVerifications(filters: GetVerificationFilter): VerificationRecord[] {
  const {
    entity_type_reference_uuid,
    entity_uuid,
    verification_type_reference_uuid,
    verification_status_reference_uuid,
    verifier_workspace_uuid,
    verification_mode,
    active_only = false,
    limit,
    offset = 0,
  } = filters;

  let records = _getAllVerifications();

  if (entity_type_reference_uuid !== undefined) {
    records = records.filter((r) => r.entity_type_reference_uuid === entity_type_reference_uuid);
  }
  if (entity_uuid !== undefined) {
    records = records.filter((r) => r.entity_uuid === entity_uuid);
  }
  if (verification_type_reference_uuid !== undefined) {
    records = records.filter(
      (r) => r.verification_type_reference_uuid === verification_type_reference_uuid,
    );
  }
  if (verification_status_reference_uuid !== undefined) {
    records = records.filter(
      (r) => r.verification_status_reference_uuid === verification_status_reference_uuid,
    );
  }
  if (verifier_workspace_uuid !== undefined) {
    records = records.filter((r) => r.verifier_workspace_uuid === verifier_workspace_uuid);
  }
  if (verification_mode !== undefined) {
    records = records.filter((r) => r.verification_mode === verification_mode);
  }
  if (active_only) {
    const now = new Date().toISOString();
    records = records.filter(
      (r) =>
        r.verification_status_reference_uuid === VERIFICATION_STATUS_UUID.VERIFIED &&
        (r.expired_at === null || r.expired_at > now),
    );
  }

  records = [...records].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  if (offset > 0) records = records.slice(offset);
  if (limit !== undefined && limit > 0) records = records.slice(0, limit);

  return records;
}
