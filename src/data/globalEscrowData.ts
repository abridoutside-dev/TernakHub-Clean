// ─── Global Escrow Data — FOUNDATION-GLOBAL-ESCROW-001 ───────────────────────
//
// Single Source of Truth untuk seluruh escrow di TernakHub.
//
// PENTING — PRINSIP DANA:
//   TernakHub TIDAK menyimpan dana secara nyata.
//   Global Escrow Service adalah abstraction layer yang:
//     1. Mencatat status dan aliran escrow secara logis.
//     2. Meneruskan perintah ke EscrowProvider (pihak ketiga) via interface.
//     3. Tidak pernah memegang saldo atau rekening pembayaran.
//
// ARSITEKTUR:
//   Semua status menggunakan reference_uuid dari Global Reference Service.
//   Jangan hardcode string status di mana pun — selalu gunakan konstanta
//   ESCROW_STATUS_UUID, PAYMENT_STATUS_UUID, DISPUTE_STATUS_UUID.
//
//   EscrowProvider adalah abstraction layer untuk integrasi pihak ketiga.
//   Daftarkan provider via registerEscrowProvider() di service layer.
//   Saat ini hanya INTERNAL_MOCK_PROVIDER yang tersedia (development).
//
// RELASI DISIAPKAN (belum di-wire):
//   ✓ Global Transaction   — transaction_uuid → TransactionRecord
//   ✓ Global Evidence      — evidence_uuids[] → EvidenceRecord
//   ✓ Global Conversation  — conversation_uuid (belum ada service)
//   ✓ Global Notification  — (akan dipanggil oleh service saat status berubah)
//   ✓ Global Audit Trail   — audit_uuid (belum ada service)
//   ✓ Marketplace          — reference_module: 'marketplace'
// ─────────────────────────────────────────────────────────────────────────────

import { generateUUID } from '../utils/uuid';

// ─── Stable Status UUID Maps ──────────────────────────────────────────────────
// Semua UUID menunjuk ke seed di globalReferenceData.ts — JANGAN diubah.

/** ESCROW_STATUS reference_uuid — sesuai seed f1000001-... */
export const ESCROW_STATUS_UUID = {
  WaitingPayment:           'f1000001-0000-4000-a000-000000000001',
  HoldingFund:              'f1000001-0000-4000-a000-000000000002',
  Delivery:                 'f1000001-0000-4000-a000-000000000003',
  WaitingConfirmation:      'f1000001-0000-4000-a000-000000000004',
  Dispute:                  'f1000001-0000-4000-a000-000000000005',
  WaitingTransfer:          'f1000001-0000-4000-a000-000000000006',
  TransferProcessing:       'f1000001-0000-4000-a000-000000000007',
  WaitingReceiverConfirm:   'f1000001-0000-4000-a000-000000000008',
  Completed:                'f1000001-0000-4000-a000-000000000009',
  Cancelled:                'f1000001-0000-4000-a000-000000000010',
} as const;

export type EscrowStatusKey = keyof typeof ESCROW_STATUS_UUID;

/** PAYMENT_STATUS reference_uuid — sesuai seed fe000001-... */
export const PAYMENT_STATUS_UUID = {
  Unpaid:    'fe000001-0000-4000-a000-000000000001',
  Pending:   'fe000001-0000-4000-a000-000000000002',
  Confirmed: 'fe000001-0000-4000-a000-000000000003',
  Failed:    'fe000001-0000-4000-a000-000000000004',
  Refunded:  'fe000001-0000-4000-a000-000000000005',
  Expired:   'fe000001-0000-4000-a000-000000000006',
} as const;

export type PaymentStatusKey = keyof typeof PAYMENT_STATUS_UUID;

/** DISPUTE_STATUS reference_uuid — sesuai seed ff000001-... */
export const DISPUTE_STATUS_UUID = {
  None:        'ff000001-0000-4000-a000-000000000001',
  Open:        'ff000001-0000-4000-a000-000000000002',
  UnderReview: 'ff000001-0000-4000-a000-000000000003',
  Resolved:    'ff000001-0000-4000-a000-000000000004',
  Escalated:   'ff000001-0000-4000-a000-000000000005',
  Closed:      'ff000001-0000-4000-a000-000000000006',
} as const;

export type DisputeStatusKey = keyof typeof DISPUTE_STATUS_UUID;

/** ESCROW_PROVIDER_TYPE reference_uuid — sesuai seed a3000001-... */
export const ESCROW_PROVIDER_TYPE_UUID = {
  InternalMock:      'a3000001-0000-4000-a000-000000000001',
  RekeningBersama:   'a3000001-0000-4000-a000-000000000002',
  PaymentGateway:    'a3000001-0000-4000-a000-000000000003',
  Bank:              'a3000001-0000-4000-a000-000000000004',
  MarketplacePartner:'a3000001-0000-4000-a000-000000000005',
} as const;

/** Set of terminal escrow status UUIDs — tidak bisa diubah setelah ini. */
export const TERMINAL_ESCROW_STATUS_UUIDS: ReadonlySet<string> = new Set([
  ESCROW_STATUS_UUID.Completed,
  ESCROW_STATUS_UUID.Cancelled,
]);

// ─── EscrowProvider Interface ──────────────────────────────────────────────────
// Abstraction layer untuk integrasi penyedia Rekening Bersama / Escrow pihak ketiga.
// Implementasi nyata cukup mengimplementasikan interface ini, lalu
// daftarkan via registerEscrowProvider() — tanpa mengubah Global Escrow Service.

export interface EscrowProvider {
  /** UUID v4 — primary key provider. */
  provider_uuid: string;

  /** Nama tampilan provider (e.g. 'TernakHub Internal', 'Midtrans Escrow'). */
  provider_name: string;

  /**
   * Tipe provider — reference_uuid ke ESCROW_PROVIDER_TYPE di GRS.
   * Gunakan ESCROW_PROVIDER_TYPE_UUID.{Key}.
   */
  provider_type_reference_uuid: string;

  /** Kode singkat machine-readable (e.g. 'INTERNAL', 'MIDTRANS', 'BCA'). */
  provider_code: string;

  /** Apakah provider aktif dan bisa menerima escrow baru. */
  is_active: boolean;

  // ── Kapabilitas Provider ──────────────────────────────────────────────────
  // Tidak semua provider mendukung semua operasi.
  // Global Escrow Service akan melempar Error jika operasi tidak didukung.

  /** Mendukung penahanan dana (holdFunds). */
  supports_hold: boolean;
  /** Mendukung pelepasan dana ke Seller (releaseFunds). */
  supports_release: boolean;
  /** Mendukung pengembalian dana ke Buyer (refundFunds). */
  supports_refund: boolean;
  /** Mendukung penanganan sengketa (openDispute/closeDispute). */
  supports_dispute: boolean;
  /** Mendukung expired otomatis saat hold_expired_at terlewat. */
  supports_expiry: boolean;

  /**
   * Data konfigurasi tambahan provider (API endpoint, credential placeholder, dll).
   * Jangan simpan credential nyata di sini — gunakan environment secrets.
   */
  metadata: Record<string, string | number | boolean | null>;
}

// ─── Built-in TernakHub Platform Provider ─────────────────────────────────────
// Provider internal TernakHub untuk transaksi escrow di platform ini.
// Semua operasi ditangani secara manual oleh Admin TernakHub.
// Tidak ada integrasi payment gateway — status dicatat secara logis.

export const TERNAKHUB_PLATFORM_PROVIDER: EscrowProvider = {
  provider_uuid:               '00000000-escrow-4000-a000-internal00001',
  provider_name:               'TernakHub Escrow',
  provider_type_reference_uuid: ESCROW_PROVIDER_TYPE_UUID.InternalMock,
  provider_code:               'TERNAKHUB',
  is_active:                   true,
  supports_hold:               true,
  supports_release:            true,
  supports_refund:             true,
  supports_dispute:            true,
  supports_expiry:             true,
  metadata:                    { note: 'Platform escrow TernakHub — status dikelola secara manual oleh Admin.' },
};

// ─── Provider Registry ─────────────────────────────────────────────────────────
// INTERNAL — akses melalui registerEscrowProvider / getEscrowProvider di service.

export const ESCROW_PROVIDER_REGISTRY: Map<string, EscrowProvider> = new Map([
  [TERNAKHUB_PLATFORM_PROVIDER.provider_uuid, TERNAKHUB_PLATFORM_PROVIDER],
]);

// ─── Dispute Record ───────────────────────────────────────────────────────────

export interface EscrowDispute {
  /** UUID v4 — identitas unik sengketa. */
  dispute_uuid: string;
  /** workspaceId yang membuka sengketa. */
  opened_by: string;
  /** Alasan sengketa. */
  reason: string;
  /** Resolusi sengketa saat ditutup. null = belum diselesaikan. */
  resolution: string | null;
  /** workspaceId yang menutup sengketa. null = belum ditutup. */
  resolved_by: string | null;
  /** ISO 8601 — saat sengketa dibuka. */
  opened_at: string;
  /** ISO 8601 — saat sengketa ditutup. null = masih terbuka. */
  closed_at: string | null;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface EscrowRecord {
  // ── Identitas ──────────────────────────────────────────────────────────────

  /** UUID v4 — primary key. Immutable setelah ditetapkan. */
  escrow_uuid: string;

  // ── Relasi ke Transaksi ────────────────────────────────────────────────────

  /**
   * UUID transaksi induk.
   * → Global Transaction Service (globalTransactionService.ts).
   * Relasi 1:1 — satu transaksi maksimal satu escrow aktif.
   */
  transaction_uuid: string;

  // ── Provider ───────────────────────────────────────────────────────────────

  /**
   * UUID provider escrow yang menangani transaksi ini.
   * → ESCROW_PROVIDER_REGISTRY (globalEscrowData.ts).
   * Default: TERNAKHUB_PLATFORM_PROVIDER.provider_uuid.
   */
  provider_uuid: string;

  /**
   * Nama provider saat escrow dibuat (denormalized untuk audit).
   * Memungkinkan nama provider berubah tanpa merusak data historis.
   */
  provider_name: string;

  /**
   * Referensi ID dari sisi provider (e.g. nomor VA, order ID Midtrans).
   * null = belum ada referensi dari provider (escrow baru dibuat).
   * TernakHub tidak menyimpan dana — ini hanya referensi eksternal.
   */
  provider_reference: string | null;

  // ── Status (semua via Global Reference Service) ────────────────────────────

  /**
   * Status escrow saat ini — reference_uuid ke ESCROW_STATUS di GRS.
   * Gunakan ESCROW_STATUS_UUID.{Key}.
   */
  escrow_status_reference_uuid: string;

  /**
   * Status pembayaran — reference_uuid ke PAYMENT_STATUS di GRS.
   * Gunakan PAYMENT_STATUS_UUID.{Key}.
   */
  payment_status_reference_uuid: string;

  /**
   * Status sengketa — reference_uuid ke DISPUTE_STATUS di GRS.
   * Gunakan DISPUTE_STATUS_UUID.{Key}.
   * Default: DISPUTE_STATUS_UUID.None.
   */
  dispute_status_reference_uuid: string;

  // ── Finansial ──────────────────────────────────────────────────────────────

  /** Jumlah dana yang ditahan dalam satuan mata uang. */
  amount: number;

  /**
   * Mata uang — reference_uuid ke MATA_UANG di GRS.
   * Default: 'fa000001-0000-4000-a000-000000000001' (IDR).
   */
  currency_reference_uuid: string;

  // ── Relasi ke Layanan Global (Foreign Keys) ────────────────────────────────

  /**
   * UUID-UUID evidence terkait.
   * → Global Evidence Service (globalEvidenceService.ts).
   */
  evidence_uuids: string[];

  /**
   * UUID percakapan terkait.
   * → Global Conversation Service (belum diimplementasi).
   */
  conversation_uuid: string | null;

  /**
   * UUID audit trail terkait.
   * → Global Audit Trail Service (belum diimplementasi).
   */
  audit_uuid: string | null;

  // ── Dispute ────────────────────────────────────────────────────────────────

  /**
   * Riwayat sengketa dalam escrow ini.
   * Satu escrow bisa memiliki lebih dari satu sengketa (jika terbuka kembali).
   */
  disputes: EscrowDispute[];

  // ── Timestamps ─────────────────────────────────────────────────────────────

  /**
   * ISO 8601 — saat dana mulai ditahan (holdFunds dipanggil).
   * null = dana belum ditahan.
   */
  hold_started_at: string | null;

  /**
   * ISO 8601 — batas waktu maksimum penahanan dana.
   * null = tidak ada batas waktu (ditentukan oleh policy provider).
   */
  hold_expired_at: string | null;

  /**
   * ISO 8601 — saat dana dilepaskan ke Seller.
   * null = belum dilepaskan.
   */
  released_at: string | null;

  /**
   * ISO 8601 — saat dana dikembalikan ke Buyer.
   * null = tidak ada refund.
   */
  refunded_at: string | null;

  /**
   * ISO 8601 — saat escrow dibatalkan.
   * null = tidak dibatalkan.
   */
  cancelled_at: string | null;

  /** ISO 8601 — saat record dibuat. */
  created_at: string;

  /** ISO 8601 — saat record terakhir diperbarui. */
  updated_at: string;

  // ── Metadata Tambahan ──────────────────────────────────────────────────────

  /**
   * Data tambahan module-specific.
   * Contoh: { listingTitle: 'Sapi Limousin', feePercent: 2.5 }
   */
  metadata: Record<string, string | number | boolean | null>;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────
// Keyed by escrow_uuid untuk O(1) lookup.
// INTERNAL — akses hanya melalui globalEscrowService.ts.

export const GLOBAL_ESCROW_DB: Map<string, EscrowRecord> = new Map();

// ─── Internal Helpers (package-private) ──────────────────────────────────────

export function _insertEscrow(record: EscrowRecord): void {
  GLOBAL_ESCROW_DB.set(record.escrow_uuid, record);
}

export function _getAllEscrows(): EscrowRecord[] {
  return Array.from(GLOBAL_ESCROW_DB.values());
}

export function _replaceEscrow(record: EscrowRecord): void {
  GLOBAL_ESCROW_DB.set(record.escrow_uuid, record);
}

export { generateUUID };
