// ─── Global Verification Data — FOUNDATION-GLOBAL-VERIFICATION-001 ────────────
//
// Single Source of Truth untuk seluruh proses verifikasi TernakHub.
//
// ATURAN:
//   • Semua proses verifikasi HANYA melalui globalVerificationService.ts.
//   • Akses langsung ke GLOBAL_VERIFICATION_DB atau fungsi _* dilarang dari luar.
//   • Verification BUKAN approval manual semata — mendukung Manual, Automatic,
//     AI Assisted (future), dan Third Party (future).
//   • verification_type, verification_status, entity_type HARUS menggunakan UUID
//     dari Global Reference Service.
//   • UUID bersifat stabil — jangan diregenerasi setelah ditetapkan.
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   evidence_uuid              → Global Evidence Service
//   trust update               → Global Trust Service
//   audit log                  → Global Audit Trail Service
//   activity log               → Global Activity Service
//   transaction context        → Global Transaction Service
// ─────────────────────────────────────────────────────────────────────────────

import { generateUUID } from '../utils/uuid';

// ─── UUID Konstanta — Verification Type ──────────────────────────────────────
// Stabil — sesuai seed di globalReferenceData.ts.

export const VERIFICATION_TYPE_UUID = {
  IDENTITY:    'b7000001-0000-4000-a000-000000000001',
  OWNERSHIP:   'b7000001-0000-4000-a000-000000000002',
  EVIDENCE:    'b7000001-0000-4000-a000-000000000003',
  HEALTH:      'b7000001-0000-4000-a000-000000000004',
  BREED:       'b7000001-0000-4000-a000-000000000005',
  MARKETPLACE: 'b7000001-0000-4000-a000-000000000006',
  TRANSACTION: 'b7000001-0000-4000-a000-000000000007',
  WORKSPACE:   'b7000001-0000-4000-a000-000000000008',
  DOCUMENT:    'b7000001-0000-4000-a000-000000000009',
} as const;

export type VerificationTypeUuid =
  (typeof VERIFICATION_TYPE_UUID)[keyof typeof VERIFICATION_TYPE_UUID];

// ─── UUID Konstanta — Verification Status ────────────────────────────────────

export const VERIFICATION_STATUS_UUID = {
  PENDING:   'b8000001-0000-4000-a000-000000000001',
  IN_REVIEW: 'b8000001-0000-4000-a000-000000000002',
  VERIFIED:  'b8000001-0000-4000-a000-000000000003',
  REJECTED:  'b8000001-0000-4000-a000-000000000004',
  EXPIRED:   'b8000001-0000-4000-a000-000000000005',
  CANCELLED: 'b8000001-0000-4000-a000-000000000006',
} as const;

export type VerificationStatusUuid =
  (typeof VERIFICATION_STATUS_UUID)[keyof typeof VERIFICATION_STATUS_UUID];

/** Status terminal — tidak dapat bertransisi lagi setelah ini. */
export const TERMINAL_VERIFICATION_STATUSES: ReadonlySet<string> = new Set([
  VERIFICATION_STATUS_UUID.VERIFIED,
  VERIFICATION_STATUS_UUID.REJECTED,
  VERIFICATION_STATUS_UUID.EXPIRED,
  VERIFICATION_STATUS_UUID.CANCELLED,
]);

// ─── UUID Konstanta — Entity Type (dari FOUNDATION-010, diperluas di FOUNDATION-011) ─

export const VERIFICATION_ENTITY_TYPE_UUID = {
  WORKSPACE:            'b6000001-0000-4000-a000-000000000001',
  FARM:                 'b6000001-0000-4000-a000-000000000002',
  LIVESTOCK:            'b6000001-0000-4000-a000-000000000003',
  MARKETPLACE_LISTING:  'b6000001-0000-4000-a000-000000000004',
  SELLER:               'b6000001-0000-4000-a000-000000000005',
  BUYER:                'b6000001-0000-4000-a000-000000000006',
  TRANSPORT:            'b6000001-0000-4000-a000-000000000007',
  VETERINARY:           'b6000001-0000-4000-a000-000000000008',
  EVIDENCE:             'b6000001-0000-4000-a000-000000000009',
  TRANSACTION:          'b6000001-0000-4000-a000-000000000010',
} as const;

// ─── Verification Mode ────────────────────────────────────────────────────────

export type VerificationMode =
  | 'manual'          // Dilakukan oleh verifier manusia
  | 'automatic'       // Dilakukan oleh sistem berdasarkan aturan bisnis
  | 'ai_assisted'     // Dibantu AI — future ready
  | 'third_party';    // Dilakukan pihak ketiga — future ready

// ─── Schema — VerificationRecord ─────────────────────────────────────────────

export interface VerificationRecord {
  /** UUID v4 — primary key. Immutable setelah ditetapkan. */
  verification_uuid: string;

  /**
   * Jenis proses verifikasi — UUID ke VERIFICATION_TYPE.
   * Gunakan VERIFICATION_TYPE_UUID untuk referensi stabil.
   */
  verification_type_reference_uuid: string;

  /**
   * Status siklus hidup verifikasi — UUID ke VERIFICATION_STATUS.
   * Gunakan VERIFICATION_STATUS_UUID untuk referensi stabil.
   */
  verification_status_reference_uuid: string;

  /**
   * Jenis entity yang diverifikasi — UUID ke ENTITY_TYPE.
   * Gunakan VERIFICATION_ENTITY_TYPE_UUID untuk referensi stabil.
   */
  entity_type_reference_uuid: string;

  /**
   * UUID entity yang diverifikasi.
   * Contoh: workspace_uuid, livestock.id, listing_uuid.
   */
  entity_uuid: string;

  /**
   * UUID evidence yang digunakan sebagai dasar verifikasi.
   * Relasi ke Global Evidence Service — belum di-wire.
   * null = verifikasi tidak berbasis evidence spesifik.
   */
  evidence_uuid: string | null;

  /**
   * Workspace yang bertindak sebagai verifier.
   * null = verifikasi otomatis oleh sistem.
   */
  verifier_workspace_uuid: string | null;

  /**
   * UUID pengguna yang melakukan verifikasi.
   * null = verifikasi otomatis oleh sistem.
   */
  verifier_user_uuid: string | null;

  /**
   * Mode verifikasi yang digunakan.
   */
  verification_mode: VerificationMode;

  /**
   * Skor kepercayaan terhadap hasil verifikasi (0–100).
   * Untuk verifikasi manual: 100 (pasti) atau dikurangi sesuai keraguan.
   * Untuk verifikasi otomatis: dihitung dari aturan bisnis.
   * null = belum dihitung (masih Pending/In Review).
   */
  verification_score: number | null;

  /**
   * Catatan dari verifier atau sistem.
   * Wajib diisi saat status Rejected.
   * null = tidak ada catatan.
   */
  verification_note: string | null;

  /**
   * Timestamp ISO 8601 kapan verifikasi dinyatakan valid/rejected.
   * null = belum selesai.
   */
  verified_at: string | null;

  /**
   * Timestamp ISO 8601 kapan verifikasi kedaluwarsa.
   * null = tidak ada masa berlaku (permanen sampai di-expire secara eksplisit).
   */
  expired_at: string | null;

  /** Timestamp ISO 8601 saat record dibuat. */
  created_at: string;

  /** Timestamp ISO 8601 saat record terakhir diperbarui. */
  updated_at: string;
}

// ─── Input untuk createVerification ──────────────────────────────────────────

export interface CreateVerificationInput {
  verification_type_reference_uuid: string;
  entity_type_reference_uuid: string;
  entity_uuid: string;
  evidence_uuid?: string | null;
  verifier_workspace_uuid?: string | null;
  verifier_user_uuid?: string | null;
  verification_mode?: VerificationMode;
  verification_note?: string | null;
  /** Masa berlaku verifikasi. null = tidak ada kedaluwarsa. */
  expired_at?: string | null;
}

// ─── Input untuk verify / reject ─────────────────────────────────────────────

export interface VerifyInput {
  /** Skor kepercayaan (0–100). Default: 100. */
  verification_score?: number;
  /** Catatan opsional dari verifier. */
  verification_note?: string | null;
  /** Masa berlaku verifikasi. null = tidak kedaluwarsa. */
  expired_at?: string | null;
}

export interface RejectInput {
  /** Alasan penolakan — wajib. */
  verification_note: string;
  /** Skor kepercayaan saat penolakan (0–100). Default: 0. */
  verification_score?: number;
}

// ─── Filter untuk getVerification ────────────────────────────────────────────

export interface GetVerificationFilter {
  /** Filter berdasarkan entity_type_reference_uuid. */
  entity_type_reference_uuid?: string;
  /** Filter berdasarkan entity_uuid. */
  entity_uuid?: string;
  /** Filter berdasarkan verification_type_reference_uuid. */
  verification_type_reference_uuid?: string;
  /** Filter berdasarkan verification_status_reference_uuid. */
  verification_status_reference_uuid?: string;
  /** Filter berdasarkan verifier_workspace_uuid. */
  verifier_workspace_uuid?: string;
  /** Filter berdasarkan verification_mode. */
  verification_mode?: VerificationMode;
  /** Jika true, hanya verifikasi yang masih aktif (Verified + belum expired). */
  active_only?: boolean;
  /** Maksimum jumlah record yang dikembalikan. */
  limit?: number;
  /** Offset untuk pagination. Default: 0. */
  offset?: number;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────
// INTERNAL — akses hanya melalui globalVerificationService.ts.

export const GLOBAL_VERIFICATION_DB: Map<string, VerificationRecord> = new Map();

// ─── Internal Helpers (package-private) ───────────────────────────────────────

export function _insertVerification(record: VerificationRecord): void {
  GLOBAL_VERIFICATION_DB.set(record.verification_uuid, record);
}

export function _replaceVerification(record: VerificationRecord): void {
  GLOBAL_VERIFICATION_DB.set(record.verification_uuid, record);
}

export function _getAllVerifications(): VerificationRecord[] {
  return Array.from(GLOBAL_VERIFICATION_DB.values());
}

// Re-export generateUUID agar service layer tidak import dari utils langsung.
export { generateUUID };
