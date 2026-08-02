// ─── Global Transaction Service — FOUNDATION-GLOBAL-TRANSACTION-001 ──────────
//
// Satu-satunya entry point yang boleh digunakan modul lain untuk membaca
// atau mengelola transaksi di TernakHub.
//
// PRINSIP:
//   1. Global Transaction Service berdiri sendiri — tidak bergantung pada
//      Marketplace. Marketplace hanya salah satu consumer.
//   2. Status transaksi TIDAK di-hardcode — selalu gunakan TRANSACTION_STATUS_UUID.
//   3. createTransaction() adalah satu-satunya cara membuat transaksi baru.
//   4. Transaksi dengan status terminal (Completed/Cancelled/Refunded) tidak
//      bisa diubah statusnya.
//   5. Transaksi yang sudah diarsipkan tidak bisa diubah apa pun.
//
// API PUBLIK:
//   createTransaction(input)                    → TransactionRecord
//   getTransaction(filters?)                    → TransactionRecord[]
//   getTransactionByUuid(uuid)                  → TransactionRecord | undefined
//   getTransactionByReference(module, refUuid)  → TransactionRecord[]
//   updateTransactionStatus(uuid, statusUuid)   → TransactionRecord
//   cancelTransaction(uuid, reason?, by?)       → TransactionRecord
//   completeTransaction(uuid, by?)              → TransactionRecord
//   archiveTransaction(uuid)                    → TransactionRecord
//
// SIAP DIGUNAKAN OLEH:
//   ✓ Marketplace        — reference_module: 'marketplace'
//   ✓ Transport          — reference_module: 'transport'
//   ✓ Kesehatan Hewan    — reference_module: 'kesehatan_hewan'
//   ✓ Reproduksi         — reference_module: 'reproduksi'
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   transaction_status          → getReferenceByUuid() di Global Reference Service
//   currency_reference_uuid     → MATA_UANG di Global Reference Service
//   payment_method_reference_uuid → PAYMENT_METHOD di Global Reference Service
//   escrow_uuid                 → Global Escrow Service (belum diimplementasi)
//   evidence_uuids[]            → Global Evidence Service (globalEvidenceService.ts)
//   conversation_uuid           → Global Conversation Service (belum diimplementasi)
//   audit_uuid                  → Global Audit Trail Service (belum diimplementasi)
// ─────────────────────────────────────────────────────────────────────────────

import {
  type TransactionRecord,
  type TransactionType,
  type TransactionReferenceModule,
  type TransactionCancellation,
  TRANSACTION_STATUS_UUID,
  TERMINAL_STATUS_UUIDS,
  CURRENCY_UUID,
  _insertTransaction,
  _getAllTransactions,
  _replaceTransaction,
  GLOBAL_TRANSACTION_DB,
  generateTransactionCode,
  generateUUID,
} from '../data/globalTransactionData';

// Re-export types & constants agar consumer tidak import dari data layer langsung.
export type { TransactionRecord, TransactionType, TransactionReferenceModule };
export {
  TRANSACTION_STATUS_UUID,
  TRANSACTION_TYPE_LIST,
  TRANSACTION_TYPE_UUID,
  TRANSACTION_REFERENCE_MODULES,
  PAYMENT_METHOD_UUID,
  CURRENCY_UUID,
  TERMINAL_STATUS_UUIDS,
} from '../data/globalTransactionData';

// ─── Public Filter & Input Types ──────────────────────────────────────────────

export interface GetTransactionFilters {
  /** Filter berdasarkan reference_module. */
  module?: TransactionReferenceModule;
  /** Filter berdasarkan reference_uuid (dalam module tertentu). */
  referenceUuid?: string;
  /** Filter berdasarkan transaction_type. */
  transactionType?: TransactionType;
  /**
   * Filter berdasarkan transaction_status (reference_uuid dari GRS).
   * Gunakan TRANSACTION_STATUS_UUID.{Key} untuk mendapatkan UUID yang benar.
   */
  statusUuid?: string;
  /** Filter berdasarkan buyer_workspace_uuid. */
  buyerWorkspaceUuid?: string;
  /** Filter berdasarkan seller_workspace_uuid. */
  sellerWorkspaceUuid?: string;
  /**
   * Jika true, sertakan transaksi yang sudah diarsipkan.
   * Default: false.
   */
  includeArchived?: boolean;
}

export interface CreateTransactionInput {
  /** Jenis transaksi. */
  transaction_type: TransactionType;
  /** Modul asal transaksi. */
  reference_module: TransactionReferenceModule;
  /** UUID entitas spesifik dalam reference_module. */
  reference_uuid: string;
  /** workspaceId pembeli. */
  buyer_workspace_uuid: string;
  /** workspaceId penjual. */
  seller_workspace_uuid: string;
  /** Total nilai transaksi. */
  total_amount: number;
  /**
   * reference_uuid mata uang dari MATA_UANG (GRS).
   * Default: CURRENCY_UUID.IDR
   */
  currency_reference_uuid?: string;
  /**
   * reference_uuid metode pembayaran dari PAYMENT_METHOD (GRS).
   * null = belum dipilih.
   */
  payment_method_reference_uuid?: string | null;
  /**
   * Status awal. Default: TRANSACTION_STATUS_UUID.Draft
   * Gunakan TRANSACTION_STATUS_UUID.{Key}.
   */
  initial_status_uuid?: string;
  /** UUID escrow jika transaksi menggunakan escrow. */
  escrow_uuid?: string | null;
  /** UUID percakapan jika sudah ada. */
  conversation_uuid?: string | null;
  /** UUID audit trail jika sudah ada. */
  audit_uuid?: string | null;
  /** Data tambahan module-specific. */
  metadata?: Record<string, string | number | boolean | null>;
}

export interface UpdateStatusOptions {
  /** workspaceId yang melakukan perubahan status (untuk log). */
  updated_by?: string;
  /** Catatan tambahan perubahan status. */
  note?: string;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Membuat dan menyimpan transaksi baru ke dalam store.
 * Status awal default: Draft.
 * Kode transaksi digenerate otomatis (GTX-YYYYMMDD-seq).
 * Mengembalikan record yang baru dibuat.
 *
 * @example
 * // Transaksi Marketplace Livestock
 * const tx = createTransaction({
 *   transaction_type:     'Marketplace Livestock',
 *   reference_module:     'marketplace',
 *   reference_uuid:       'listing-uuid-xxx',
 *   buyer_workspace_uuid:  'ws-buyer-001',
 *   seller_workspace_uuid: 'ws-seller-001',
 *   total_amount:          15000000,
 *   payment_method_reference_uuid: PAYMENT_METHOD_UUID.Escrow,
 *   metadata:             { listingTitle: 'Sapi Limousin 2 ekor' },
 * });
 *
 * // Transaksi Transport dengan status awal Waiting Payment
 * const tx = createTransaction({
 *   transaction_type:     'Marketplace Transport',
 *   reference_module:     'transport',
 *   reference_uuid:       'layanan-uuid-yyy',
 *   buyer_workspace_uuid:  'ws-buyer-001',
 *   seller_workspace_uuid: 'ws-driver-001',
 *   total_amount:          500000,
 *   initial_status_uuid:   TRANSACTION_STATUS_UUID.WaitingPayment,
 * });
 */
export function createTransaction(input: CreateTransactionInput): TransactionRecord {
  const now = new Date().toISOString();

  const record: TransactionRecord = {
    transaction_uuid:              generateUUID(),
    transaction_code:              generateTransactionCode(),
    transaction_type:              input.transaction_type,
    transaction_status:            input.initial_status_uuid ?? TRANSACTION_STATUS_UUID.Draft,
    buyer_workspace_uuid:          input.buyer_workspace_uuid,
    seller_workspace_uuid:         input.seller_workspace_uuid,
    reference_module:              input.reference_module,
    reference_uuid:                input.reference_uuid,
    total_amount:                  input.total_amount,
    currency_reference_uuid:       input.currency_reference_uuid ?? CURRENCY_UUID.IDR,
    payment_method_reference_uuid: input.payment_method_reference_uuid ?? null,
    escrow_uuid:                   input.escrow_uuid ?? null,
    evidence_uuids:                [],
    conversation_uuid:             input.conversation_uuid ?? null,
    audit_uuid:                    input.audit_uuid ?? null,
    cancellation:                  null,
    created_at:                    now,
    updated_at:                    now,
    completed_at:                  null,
    cancelled_at:                  null,
    archived_at:                   null,
    metadata:                      input.metadata ?? {},
  };

  _insertTransaction(record);
  return record;
}

/**
 * Mengembalikan semua transaksi yang sesuai dengan filter.
 * Default: hanya transaksi aktif (archived_at = null).
 * Hasil diurutkan dari terbaru ke terlama (created_at desc).
 *
 * @example
 * // Semua transaksi aktif dari Marketplace
 * getTransaction({ module: 'marketplace' })
 *
 * // Semua transaksi yang Completed
 * getTransaction({ statusUuid: TRANSACTION_STATUS_UUID.Completed })
 *
 * // Semua transaksi sebagai pembeli (termasuk diarsipkan)
 * getTransaction({ buyerWorkspaceUuid: 'ws-001', includeArchived: true })
 */
export function getTransaction(filters: GetTransactionFilters = {}): TransactionRecord[] {
  const {
    module: refModule,
    referenceUuid,
    transactionType,
    statusUuid,
    buyerWorkspaceUuid,
    sellerWorkspaceUuid,
    includeArchived = false,
  } = filters;

  let records = _getAllTransactions();

  if (!includeArchived) {
    records = records.filter((r) => r.archived_at === null);
  }
  if (refModule !== undefined) {
    records = records.filter((r) => r.reference_module === refModule);
  }
  if (referenceUuid !== undefined) {
    records = records.filter((r) => r.reference_uuid === referenceUuid);
  }
  if (transactionType !== undefined) {
    records = records.filter((r) => r.transaction_type === transactionType);
  }
  if (statusUuid !== undefined) {
    records = records.filter((r) => r.transaction_status === statusUuid);
  }
  if (buyerWorkspaceUuid !== undefined) {
    records = records.filter((r) => r.buyer_workspace_uuid === buyerWorkspaceUuid);
  }
  if (sellerWorkspaceUuid !== undefined) {
    records = records.filter((r) => r.seller_workspace_uuid === sellerWorkspaceUuid);
  }

  // Terbaru lebih dulu
  return records.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * Mencari satu transaksi berdasarkan UUID-nya.
 * Mengembalikan undefined jika tidak ditemukan.
 * Mengembalikan record meskipun sudah diarsipkan.
 *
 * @example
 * const tx = getTransactionByUuid('tx-uuid-xxx');
 * console.log(tx?.transaction_code); // 'GTX-20260716-001'
 */
export function getTransactionByUuid(uuid: string): TransactionRecord | undefined {
  return GLOBAL_TRANSACTION_DB.get(uuid);
}

/**
 * Mengembalikan semua transaksi aktif yang terkait dengan entitas tertentu.
 * Setara dengan getTransaction({ module, referenceUuid }).
 *
 * @example
 * // Semua transaksi untuk satu listing Marketplace
 * getTransactionByReference('marketplace', 'listing-uuid-xxx')
 *
 * // Termasuk yang diarsipkan
 * getTransactionByReference('transport', 'layanan-uuid-yyy', true)
 */
export function getTransactionByReference(
  module: TransactionReferenceModule,
  referenceUuid: string,
  includeArchived = false,
): TransactionRecord[] {
  return getTransaction({ module, referenceUuid, includeArchived });
}

/**
 * Memperbarui status transaksi ke status baru.
 * Mengembalikan record yang sudah diperbarui.
 *
 * GUARD:
 *   - Melempar Error jika UUID tidak ditemukan.
 *   - Melempar Error jika transaksi sudah diarsipkan.
 *   - Melempar Error jika status saat ini sudah terminal (Completed/Cancelled/Refunded).
 *
 * @example
 * // Pindah ke status Paid setelah pembayaran dikonfirmasi
 * updateTransactionStatus(
 *   'tx-uuid-xxx',
 *   TRANSACTION_STATUS_UUID.Paid,
 *   { updated_by: 'ws-system', note: 'Pembayaran via BCA dikonfirmasi.' },
 * )
 */
export function updateTransactionStatus(
  uuid: string,
  newStatusUuid: string,
  options: UpdateStatusOptions = {},
): TransactionRecord {
  const existing = _getOrThrow(uuid);
  _assertNotArchived(existing, 'updateTransactionStatus');
  _assertNotTerminal(existing, 'updateTransactionStatus');

  const now = new Date().toISOString();
  const updated: TransactionRecord = {
    ...existing,
    transaction_status: newStatusUuid,
    updated_at:         now,
  };

  _replaceTransaction(updated);
  return updated;
}

/**
 * Membatalkan transaksi — mengubah status ke Cancelled dan mengisi cancellation detail.
 * Mengembalikan record yang sudah diperbarui.
 *
 * GUARD:
 *   - Melempar Error jika UUID tidak ditemukan.
 *   - Melempar Error jika transaksi sudah diarsipkan.
 *   - Melempar Error jika status sudah terminal.
 *
 * @example
 * cancelTransaction(
 *   'tx-uuid-xxx',
 *   'Pembeli tidak jadi membeli.',
 *   'ws-buyer-001',
 * )
 */
export function cancelTransaction(
  uuid: string,
  reason: string = 'Tidak disebutkan.',
  cancelledBy: string = 'System',
): TransactionRecord {
  const existing = _getOrThrow(uuid);
  _assertNotArchived(existing, 'cancelTransaction');
  _assertNotTerminal(existing, 'cancelTransaction');

  const now = new Date().toISOString();
  const cancellation: TransactionCancellation = {
    cancelled_by: cancelledBy,
    reason,
    cancelled_at: now,
  };

  const updated: TransactionRecord = {
    ...existing,
    transaction_status: TRANSACTION_STATUS_UUID.Cancelled,
    cancellation,
    cancelled_at: now,
    updated_at:   now,
  };

  _replaceTransaction(updated);
  return updated;
}

/**
 * Menyelesaikan transaksi — mengubah status ke Completed dan mengisi completed_at.
 * Mengembalikan record yang sudah diperbarui.
 *
 * GUARD:
 *   - Melempar Error jika UUID tidak ditemukan.
 *   - Melempar Error jika transaksi sudah diarsipkan.
 *   - Melempar Error jika status sudah terminal.
 *   - Melempar Error jika status saat ini bukan Delivered (transaksi belum diterima).
 *
 * @example
 * completeTransaction('tx-uuid-xxx', 'ws-buyer-001')
 */
export function completeTransaction(
  uuid: string,
  completedBy: string = 'System',
): TransactionRecord {
  const existing = _getOrThrow(uuid);
  _assertNotArchived(existing, 'completeTransaction');
  _assertNotTerminal(existing, 'completeTransaction');

  // Guard: transaksi hanya bisa diselesaikan dari status Delivered
  if (existing.transaction_status !== TRANSACTION_STATUS_UUID.Delivered) {
    const currentCode = _getStatusCode(existing.transaction_status);
    throw new Error(
      `[GlobalTransactionService] completeTransaction: transaksi "${uuid}" ` +
        `dalam status "${currentCode}" — hanya 'Delivered' yang dapat diselesaikan. ` +
        `Gunakan updateTransactionStatus() untuk memajukan status terlebih dahulu.`,
    );
  }

  const now = new Date().toISOString();
  const updated: TransactionRecord = {
    ...existing,
    transaction_status: TRANSACTION_STATUS_UUID.Completed,
    completed_at:       now,
    updated_at:         now,
  };

  _replaceTransaction(updated);
  return updated;
}

/**
 * Mengarsipkan transaksi — menetapkan archived_at dan membekukan record.
 * Transaksi yang sudah diarsipkan TIDAK BISA diubah apa pun (immutable).
 * Biasanya dipanggil setelah transaksi mencapai status terminal.
 * Operasi ini bersifat idempotent.
 * Mengembalikan record yang sudah diperbarui.
 *
 * GUARD: Melempar Error jika UUID tidak ditemukan.
 *
 * @example
 * archiveTransaction('tx-uuid-xxx')
 */
export function archiveTransaction(uuid: string): TransactionRecord {
  const existing = _getOrThrow(uuid);

  // Idempotent
  if (existing.archived_at !== null) return existing;

  const now = new Date().toISOString();
  const updated: TransactionRecord = {
    ...existing,
    archived_at: now,
    updated_at:  now,
  };

  _replaceTransaction(updated);
  return updated;
}

// ─── Convenience Helpers ──────────────────────────────────────────────────────

/**
 * Menambahkan evidence_uuid ke daftar evidence transaksi.
 * Digunakan oleh Global Evidence Service saat evidence dibuat untuk transaksi ini.
 *
 * @example
 * attachEvidenceToTransaction('tx-uuid-xxx', 'ev-uuid-yyy')
 */
export function attachEvidenceToTransaction(
  transactionUuid: string,
  evidenceUuid: string,
): TransactionRecord {
  const existing = _getOrThrow(transactionUuid);
  _assertNotArchived(existing, 'attachEvidenceToTransaction');

  if (existing.evidence_uuids.includes(evidenceUuid)) return existing;

  const updated: TransactionRecord = {
    ...existing,
    evidence_uuids: [...existing.evidence_uuids, evidenceUuid],
    updated_at:     new Date().toISOString(),
  };

  _replaceTransaction(updated);
  return updated;
}

/**
 * Mengembalikan apakah transaksi berada dalam status terminal.
 * Berguna untuk validasi di UI (nonaktifkan tombol aksi).
 *
 * @example
 * if (isTerminalTransaction('tx-uuid-xxx')) {
 *   // sembunyikan tombol Batalkan, Selesaikan, dll.
 * }
 */
export function isTerminalTransaction(uuid: string): boolean {
  const record = GLOBAL_TRANSACTION_DB.get(uuid);
  if (!record) return false;
  return TERMINAL_STATUS_UUIDS.has(record.transaction_status);
}

/**
 * Mengembalikan transaction_code dari UUID transaksi.
 * Berguna untuk tampilan notifikasi / audit log.
 */
export function getTransactionCode(uuid: string): string | undefined {
  return GLOBAL_TRANSACTION_DB.get(uuid)?.transaction_code;
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

function _getOrThrow(uuid: string): TransactionRecord {
  const record = GLOBAL_TRANSACTION_DB.get(uuid);
  if (!record) {
    throw new Error(
      `[GlobalTransactionService] Transaksi tidak ditemukan: "${uuid}".`,
    );
  }
  return record;
}

function _assertNotArchived(record: TransactionRecord, caller: string): void {
  if (record.archived_at !== null) {
    throw new Error(
      `[GlobalTransactionService] ${caller}: transaksi "${record.transaction_uuid}" ` +
        `(${record.transaction_code}) sudah diarsipkan pada ${record.archived_at} ` +
        `dan tidak dapat diubah.`,
    );
  }
}

function _assertNotTerminal(record: TransactionRecord, caller: string): void {
  if (TERMINAL_STATUS_UUIDS.has(record.transaction_status)) {
    const code = _getStatusCode(record.transaction_status);
    throw new Error(
      `[GlobalTransactionService] ${caller}: transaksi "${record.transaction_uuid}" ` +
        `(${record.transaction_code}) sudah dalam status terminal "${code}" ` +
        `dan tidak dapat diubah lagi.`,
    );
  }
}

/** Cari reference_code dari status UUID untuk pesan error yang informatif. */
function _getStatusCode(statusUuid: string): string {
  const entry = Object.entries(TRANSACTION_STATUS_UUID).find(
    ([, uuid]) => uuid === statusUuid,
  );
  return entry ? entry[0] : statusUuid;
}
