// ─── Global Transaction Data — FOUNDATION-GLOBAL-TRANSACTION-001 ─────────────
//
// Single Source of Truth untuk seluruh transaksi di TernakHub.
//
// ARSITEKTUR:
//   Global Transaction Service berdiri sendiri — tidak bergantung pada
//   Marketplace. Marketplace hanya menjadi salah satu consumer.
//
//   Status transaksi TIDAK di-hardcode sebagai enum. Status disimpan sebagai
//   reference_uuid yang menunjuk ke TRANSACTION_STATUS di Global Reference
//   Service. Gunakan TRANSACTION_STATUS_UUID untuk akses yang aman.
//
//   Relasi dengan layanan lain dibangun via UUID foreign key:
//     currency_reference_uuid      → MATA_UANG (Global Reference Service)
//     payment_method_reference_uuid→ PAYMENT_METHOD (Global Reference Service)
//     escrow_uuid                  → Global Escrow Service (belum dibuat)
//     evidence_uuid[]              → Global Evidence Service
//     conversation_uuid            → Global Conversation Service (belum dibuat)
//     audit_uuid                   → Global Audit Trail Service (belum dibuat)
//
// ATURAN:
//   • GLOBAL_TRANSACTION_DB tidak boleh diakses langsung dari modul lain.
//   • Seluruh akses melalui globalTransactionService.ts.
//   • Transaksi yang sudah Completed/Cancelled TIDAK boleh diubah statusnya.
//   • archived_at adalah tanda arsip permanen (bukan penghapusan fisik).
// ─────────────────────────────────────────────────────────────────────────────

import { generateUUID } from '../utils/uuid';

// ─── Transaction Type ─────────────────────────────────────────────────────────
// Jenis transaksi — memetakan ke TRANSACTION_TYPE di Global Reference Service.
// Gunakan TRANSACTION_TYPE_UUID untuk akses UUID yang stabil.
// Untuk menambah jenis baru: tambah ke union DAN TRANSACTION_TYPE_LIST.

export type TransactionType =
  | 'Marketplace Livestock'
  | 'Marketplace Feed'
  | 'Marketplace Medicine'
  | 'Marketplace Transport'
  | 'Marketplace Service';

export const TRANSACTION_TYPE_LIST: readonly TransactionType[] = [
  'Marketplace Livestock',
  'Marketplace Feed',
  'Marketplace Medicine',
  'Marketplace Transport',
  'Marketplace Service',
] as const;

// ─── Reference Module ─────────────────────────────────────────────────────────
// Modul asal transaksi — konteks untuk reference_uuid.
// Untuk menambah modul baru: tambah ke union DAN TRANSACTION_REFERENCE_MODULES.

export type TransactionReferenceModule =
  | 'marketplace'       // Listing Marketplace — marketplaceListingData.ts
  | 'kesehatan_hewan'   // Layanan Kesehatan Hewan
  | 'reproduksi'        // Layanan Reproduksi
  | 'transport'         // Layanan Transport — layananTransportData.ts
  | 'feed_service'      // Layanan Pakan
  | 'direct';           // Transaksi langsung (peer-to-peer, tanpa modul spesifik)

export const TRANSACTION_REFERENCE_MODULES: readonly TransactionReferenceModule[] = [
  'marketplace', 'kesehatan_hewan', 'reproduksi', 'transport',
  'feed_service', 'direct',
] as const;

// ─── Stable Status UUID Map ───────────────────────────────────────────────────
// Peta nama status → reference_uuid di TRANSACTION_STATUS (Global Reference Service).
// UUID ini stabil — sesuai dengan seed di globalReferenceData.ts.
// Gunakan ini alih-alih hardcode string UUID di tempat lain.

export const TRANSACTION_STATUS_UUID = {
  Draft:          'f2000001-0000-4000-a000-000000000011',
  WaitingPayment: 'f2000001-0000-4000-a000-000000000012',
  Paid:           'f2000001-0000-4000-a000-000000000013',
  Processing:     'f2000001-0000-4000-a000-000000000014',
  Shipped:        'f2000001-0000-4000-a000-000000000015',
  Delivered:      'f2000001-0000-4000-a000-000000000016',
  Completed:      'f2000001-0000-4000-a000-000000000017',
  Cancelled:      'f2000001-0000-4000-a000-000000000018',
  Refunded:       'f2000001-0000-4000-a000-000000000019',
  Disputed:       'f2000001-0000-4000-a000-000000000020',
} as const;

export type TransactionStatusKey = keyof typeof TRANSACTION_STATUS_UUID;

/** Set of terminal status UUIDs — transaksi dengan status ini tidak bisa diubah lagi. */
export const TERMINAL_STATUS_UUIDS: ReadonlySet<string> = new Set([
  TRANSACTION_STATUS_UUID.Completed,
  TRANSACTION_STATUS_UUID.Cancelled,
  TRANSACTION_STATUS_UUID.Refunded,
]);

// ─── Stable Payment Method UUID Map ──────────────────────────────────────────
// Peta nama metode pembayaran → reference_uuid di PAYMENT_METHOD (GRS).

export const PAYMENT_METHOD_UUID = {
  TransferBank:    'fc000001-0000-4000-a000-000000000001',
  QRIS:            'fc000001-0000-4000-a000-000000000002',
  VirtualAccount:  'fc000001-0000-4000-a000-000000000003',
  DompetDigital:   'fc000001-0000-4000-a000-000000000004',
  COD:             'fc000001-0000-4000-a000-000000000005',
  Escrow:          'fc000001-0000-4000-a000-000000000006',
} as const;

// ─── Stable Currency UUID Map ─────────────────────────────────────────────────
// Peta kode mata uang → reference_uuid di MATA_UANG (GRS).

export const CURRENCY_UUID = {
  IDR: 'fa000001-0000-4000-a000-000000000001',
  USD: 'fa000001-0000-4000-a000-000000000002',
  SGD: 'fa000001-0000-4000-a000-000000000003',
} as const;

// ─── Stable Transaction Type UUID Map ────────────────────────────────────────
// Peta nama jenis transaksi → reference_uuid di TRANSACTION_TYPE (GRS).

export const TRANSACTION_TYPE_UUID = {
  MarketplaceLivestock:  'fd000001-0000-4000-a000-000000000001',
  MarketplaceFeed:       'fd000001-0000-4000-a000-000000000002',
  MarketplaceMedicine:   'fd000001-0000-4000-a000-000000000003',
  MarketplaceTransport:  'fd000001-0000-4000-a000-000000000004',
  MarketplaceService:    'fd000001-0000-4000-a000-000000000005',
} as const;

// ─── Cancellation Record ──────────────────────────────────────────────────────

export interface TransactionCancellation {
  /** workspaceId atau 'System' yang membatalkan. */
  cancelled_by: string;
  /** Alasan pembatalan. */
  reason: string;
  /** ISO 8601 timestamp pembatalan. */
  cancelled_at: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface TransactionRecord {
  // ── Identitas ──────────────────────────────────────────────────────────────

  /** UUID v4 — primary key. Immutable setelah ditetapkan. */
  transaction_uuid: string;

  /**
   * Kode transaksi yang dapat dibaca manusia.
   * Format: GTX-{YYYYMMDD}-{seq}
   * Contoh: GTX-20260716-001
   */
  transaction_code: string;

  // ── Jenis & Status ─────────────────────────────────────────────────────────

  /**
   * Jenis transaksi.
   * Gunakan TRANSACTION_TYPE_UUID untuk referensi ke GRS.
   */
  transaction_type: TransactionType;

  /**
   * Status transaksi saat ini — reference_uuid ke TRANSACTION_STATUS di GRS.
   * Gunakan TRANSACTION_STATUS_UUID.{StatusKey} untuk mendapatkan UUID yang benar.
   * Gunakan getReferenceByUuid(transaction_status)?.reference_name untuk tampilan.
   */
  transaction_status: string;

  // ── Pihak-pihak ───────────────────────────────────────────────────────────

  /** workspaceId pembeli. */
  buyer_workspace_uuid: string;

  /** workspaceId penjual. */
  seller_workspace_uuid: string;

  // ── Relasi Polimorfik ──────────────────────────────────────────────────────

  /** Modul asal transaksi. */
  reference_module: TransactionReferenceModule;

  /**
   * UUID entitas spesifik dalam reference_module.
   * Contoh: listingId untuk 'marketplace', layananId untuk 'transport'.
   */
  reference_uuid: string;

  // ── Finansial ──────────────────────────────────────────────────────────────

  /** Total nilai transaksi dalam satuan mata uang. */
  total_amount: number;

  /**
   * Mata uang — reference_uuid ke MATA_UANG di Global Reference Service.
   * Default: CURRENCY_UUID.IDR ('fa000001-0000-4000-a000-000000000001')
   */
  currency_reference_uuid: string;

  /**
   * Metode pembayaran — reference_uuid ke PAYMENT_METHOD di GRS.
   * null = belum dipilih (status Draft/Waiting Payment).
   * Gunakan PAYMENT_METHOD_UUID.{Key} untuk mendapatkan UUID yang benar.
   */
  payment_method_reference_uuid: string | null;

  // ── Relasi ke Layanan Global (Foreign Keys) ────────────────────────────────

  /**
   * UUID escrow terkait.
   * → Global Escrow Service (belum diimplementasi).
   * null = transaksi tidak menggunakan escrow.
   */
  escrow_uuid: string | null;

  /**
   * UUID-UUID evidence yang terkait.
   * → Global Evidence Service (globalEvidenceService.ts).
   * Diisi saat evidence dilampirkan ke transaksi ini.
   */
  evidence_uuids: string[];

  /**
   * UUID percakapan terkait.
   * → Global Conversation Service (belum diimplementasi).
   * null = belum ada percakapan.
   */
  conversation_uuid: string | null;

  /**
   * UUID audit trail terkait.
   * → Global Audit Trail Service (belum diimplementasi).
   * null = belum ada audit trail.
   */
  audit_uuid: string | null;

  // ── Status Pembatalan ──────────────────────────────────────────────────────

  /**
   * Detail pembatalan jika transaction_status = TRANSACTION_STATUS_UUID.Cancelled.
   * null = tidak dibatalkan.
   */
  cancellation: TransactionCancellation | null;

  // ── Timestamps ─────────────────────────────────────────────────────────────

  /** ISO 8601 — saat transaksi dibuat. */
  created_at: string;

  /** ISO 8601 — saat record terakhir diperbarui. */
  updated_at: string;

  /**
   * ISO 8601 — saat transaksi selesai (status → Completed).
   * null = belum selesai.
   */
  completed_at: string | null;

  /**
   * ISO 8601 — saat transaksi dibatalkan (status → Cancelled).
   * null = tidak dibatalkan.
   */
  cancelled_at: string | null;

  /**
   * ISO 8601 — saat transaksi diarsipkan (soft-delete).
   * null = masih aktif.
   * Transaksi yang sudah diarsipkan TIDAK BISA diubah statusnya.
   */
  archived_at: string | null;

  // ── Metadata Tambahan ──────────────────────────────────────────────────────

  /**
   * Pasangan key-value untuk data tambahan module-specific.
   * Memungkinkan consumer menyimpan field khusus tanpa mengubah schema.
   *
   * Contoh:
   *   { listingTitle: 'Sapi Limousin Jantan', quantity: 2 }  // Marketplace
   *   { noKendaraan: 'B 1234 CD', driverName: 'Budi' }       // Transport
   */
  metadata: Record<string, string | number | boolean | null>;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────
// Keyed by transaction_uuid untuk O(1) lookup.
// INTERNAL — akses hanya melalui globalTransactionService.ts.
//
// Store sengaja dimulai kosong — transaksi dibuat oleh modul saat runtime.

export const GLOBAL_TRANSACTION_DB: Map<string, TransactionRecord> = new Map();

// ─── Transaction Code Generator ───────────────────────────────────────────────
// Format: GTX-{YYYYMMDD}-{seq-3digit}
// GTX = Global Transaction (dibedakan dari TRX- Marketplace lama)

let _txSeq = 0;

export function generateTransactionCode(): string {
  _txSeq += 1;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(_txSeq).padStart(3, '0');
  return `GTX-${today}-${seq}`;
}

/** Reset sequence — hanya untuk testing. Jangan panggil di production. */
export function _resetTransactionSeq(): void {
  _txSeq = 0;
}

// ─── Internal Helpers (package-private) ──────────────────────────────────────
// Prefix _ menandakan fungsi ini hanya untuk digunakan oleh service layer.

/** Sisipkan record ke store. Dipanggil hanya oleh createTransaction(). */
export function _insertTransaction(record: TransactionRecord): void {
  GLOBAL_TRANSACTION_DB.set(record.transaction_uuid, record);
}

/** Baca semua record sebagai array. Digunakan oleh fungsi query di service. */
export function _getAllTransactions(): TransactionRecord[] {
  return Array.from(GLOBAL_TRANSACTION_DB.values());
}

/** Ganti record yang ada di tempat. Digunakan oleh update/cancel/complete/archive. */
export function _replaceTransaction(record: TransactionRecord): void {
  GLOBAL_TRANSACTION_DB.set(record.transaction_uuid, record);
}

// Re-export UUID generator untuk service
export { generateUUID };
