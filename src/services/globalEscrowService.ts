// ─── Global Escrow Service — FOUNDATION-GLOBAL-ESCROW-001 ────────────────────
//
// Satu-satunya entry point untuk membaca dan mengelola escrow di TernakHub.
//
// PRINSIP DANA:
//   TernakHub TIDAK menyimpan dana secara nyata.
//   Service ini adalah abstraction layer yang mencatat status escrow secara
//   logis dan meneruskan perintah ke EscrowProvider pihak ketiga.
//
// PRINSIP STATUS:
//   Semua status disimpan sebagai reference_uuid — gunakan konstanta:
//     ESCROW_STATUS_UUID.{Key}
//     PAYMENT_STATUS_UUID.{Key}
//     DISPUTE_STATUS_UUID.{Key}
//   JANGAN hardcode string status UUID di modul lain.
//
// API PUBLIK:
//   createEscrow(input)                        → EscrowRecord
//   getEscrow(filters?)                        → EscrowRecord[]
//   getEscrowByUuid(uuid)                      → EscrowRecord | undefined
//   getEscrowByTransaction(transactionUuid)    → EscrowRecord | undefined
//   holdFunds(uuid, opts?)                     → EscrowRecord
//   releaseFunds(uuid, opts?)                  → EscrowRecord
//   refundFunds(uuid, reason?, refundedBy?)    → EscrowRecord
//   cancelEscrow(uuid, reason?, cancelledBy?)  → EscrowRecord
//   expireEscrow(uuid)                         → EscrowRecord
//   openDispute(uuid, reason, openedBy)        → EscrowRecord
//   closeDispute(uuid, resolution, closedBy)   → EscrowRecord
//
// PROVIDER:
//   registerEscrowProvider(provider)           → void
//   getEscrowProvider(providerUuid)            → EscrowProvider | undefined
//   listEscrowProviders(activeOnly?)           → EscrowProvider[]
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   transaction_uuid     → Global Transaction Service
//   evidence_uuids[]     → Global Evidence Service
//   conversation_uuid    → Global Conversation Service (belum diimplementasi)
//   audit_uuid           → Global Audit Trail Service (belum diimplementasi)
//   provider_uuid        → ESCROW_PROVIDER_REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

import {
  type EscrowRecord,
  type EscrowProvider,
  type EscrowDispute,
  ESCROW_STATUS_UUID,
  PAYMENT_STATUS_UUID,
  DISPUTE_STATUS_UUID,
  TERMINAL_ESCROW_STATUS_UUIDS,
  TERNAKHUB_PLATFORM_PROVIDER,
  ESCROW_PROVIDER_REGISTRY,
  _insertEscrow,
  _getAllEscrows,
  _replaceEscrow,
  GLOBAL_ESCROW_DB,
  generateUUID,
} from '../data/globalEscrowData';

// Re-export types & constants
export type { EscrowRecord, EscrowProvider, EscrowDispute };
export {
  ESCROW_STATUS_UUID,
  PAYMENT_STATUS_UUID,
  DISPUTE_STATUS_UUID,
  ESCROW_PROVIDER_TYPE_UUID,
  TERMINAL_ESCROW_STATUS_UUIDS,
} from '../data/globalEscrowData';

// ─── Public Filter & Input Types ──────────────────────────────────────────────

export interface GetEscrowFilters {
  /** Filter berdasarkan transaction_uuid. */
  transactionUuid?: string;
  /** Filter berdasarkan escrow_status_reference_uuid. Gunakan ESCROW_STATUS_UUID.{Key}. */
  escrowStatusUuid?: string;
  /** Filter berdasarkan payment_status_reference_uuid. Gunakan PAYMENT_STATUS_UUID.{Key}. */
  paymentStatusUuid?: string;
  /** Filter berdasarkan dispute_status_reference_uuid. Gunakan DISPUTE_STATUS_UUID.{Key}. */
  disputeStatusUuid?: string;
  /** Filter berdasarkan provider_uuid. */
  providerUuid?: string;
  /** Jika true, sertakan escrow terminal (Completed/Cancelled). Default: false. */
  includeTerminal?: boolean;
}

export interface CreateEscrowInput {
  /** UUID transaksi induk (dari Global Transaction Service). */
  transaction_uuid: string;
  /** Jumlah dana yang akan ditahan. */
  amount: number;
  /**
   * UUID provider escrow.
   * Default: TERNAKHUB_PLATFORM_PROVIDER.provider_uuid.
   */
  provider_uuid?: string;
  /**
   * Referensi ID dari provider (e.g. nomor VA, order ID gateway).
   * null = belum ada referensi.
   */
  provider_reference?: string | null;
  /**
   * Mata uang — reference_uuid ke MATA_UANG di GRS.
   * Default: IDR ('fa000001-0000-4000-a000-000000000001').
   */
  currency_reference_uuid?: string;
  /**
   * Batas waktu maksimum penahanan dana (ISO 8601).
   * null = tidak ada batas.
   */
  hold_expired_at?: string | null;
  /** UUID percakapan terkait. */
  conversation_uuid?: string | null;
  /** UUID audit trail terkait. */
  audit_uuid?: string | null;
  /** Data tambahan. */
  metadata?: Record<string, string | number | boolean | null>;
}

export interface HoldFundsOptions {
  /** Referensi ID dari provider (update jika berubah setelah hold). */
  provider_reference?: string;
  /** Batas waktu penahanan dana (ISO 8601). */
  hold_expired_at?: string;
}

export interface ReleaseFundsOptions {
  /** workspaceId yang memicu pelepasan dana. */
  released_by?: string;
  /** Catatan pelepasan. */
  note?: string;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Membuat escrow baru untuk transaksi.
 * Status awal: escrow=WaitingPayment, payment=Unpaid, dispute=None.
 *
 * GUARD: Melempar Error jika provider tidak ditemukan atau tidak aktif.
 *
 * @example
 * const escrow = createEscrow({
 *   transaction_uuid: 'GTX-uuid-xxx',
 *   amount:           15_000_000,
 *   metadata:         { feePercent: 2.5 },
 * });
 */
export function createEscrow(input: CreateEscrowInput): EscrowRecord {
  const providerUuid = input.provider_uuid ?? TERNAKHUB_PLATFORM_PROVIDER.provider_uuid;
  const provider = ESCROW_PROVIDER_REGISTRY.get(providerUuid);

  if (!provider) {
    throw new Error(
      `[GlobalEscrowService] createEscrow: provider "${providerUuid}" tidak ditemukan.`,
    );
  }
  if (!provider.is_active) {
    throw new Error(
      `[GlobalEscrowService] createEscrow: provider "${provider.provider_name}" tidak aktif.`,
    );
  }

  const now = new Date().toISOString();
  const record: EscrowRecord = {
    escrow_uuid:                   generateUUID(),
    transaction_uuid:              input.transaction_uuid,
    provider_uuid:                 providerUuid,
    provider_name:                 provider.provider_name,
    provider_reference:            input.provider_reference ?? null,
    escrow_status_reference_uuid:  ESCROW_STATUS_UUID.WaitingPayment,
    payment_status_reference_uuid: PAYMENT_STATUS_UUID.Unpaid,
    dispute_status_reference_uuid: DISPUTE_STATUS_UUID.None,
    amount:                        input.amount,
    currency_reference_uuid:       input.currency_reference_uuid ?? 'fa000001-0000-4000-a000-000000000001',
    evidence_uuids:                [],
    conversation_uuid:             input.conversation_uuid ?? null,
    audit_uuid:                    input.audit_uuid ?? null,
    disputes:                      [],
    hold_started_at:               null,
    hold_expired_at:               input.hold_expired_at ?? null,
    released_at:                   null,
    refunded_at:                   null,
    cancelled_at:                  null,
    created_at:                    now,
    updated_at:                    now,
    metadata:                      input.metadata ?? {},
  };

  _insertEscrow(record);
  return record;
}

/**
 * Mengembalikan semua escrow yang sesuai dengan filter.
 * Default: exclude terminal (Completed/Cancelled).
 * Hasil diurutkan dari terbaru ke terlama.
 *
 * @example
 * getEscrow({ escrowStatusUuid: ESCROW_STATUS_UUID.HoldingFund })
 */
export function getEscrow(filters: GetEscrowFilters = {}): EscrowRecord[] {
  const {
    transactionUuid,
    escrowStatusUuid,
    paymentStatusUuid,
    disputeStatusUuid,
    providerUuid,
    includeTerminal = false,
  } = filters;

  let records = _getAllEscrows();

  if (!includeTerminal) {
    records = records.filter((r) => !TERMINAL_ESCROW_STATUS_UUIDS.has(r.escrow_status_reference_uuid));
  }
  if (transactionUuid !== undefined) {
    records = records.filter((r) => r.transaction_uuid === transactionUuid);
  }
  if (escrowStatusUuid !== undefined) {
    records = records.filter((r) => r.escrow_status_reference_uuid === escrowStatusUuid);
  }
  if (paymentStatusUuid !== undefined) {
    records = records.filter((r) => r.payment_status_reference_uuid === paymentStatusUuid);
  }
  if (disputeStatusUuid !== undefined) {
    records = records.filter((r) => r.dispute_status_reference_uuid === disputeStatusUuid);
  }
  if (providerUuid !== undefined) {
    records = records.filter((r) => r.provider_uuid === providerUuid);
  }

  return records.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * Mencari satu escrow berdasarkan UUID.
 * Mengembalikan undefined jika tidak ditemukan (termasuk terminal).
 */
export function getEscrowByUuid(uuid: string): EscrowRecord | undefined {
  return GLOBAL_ESCROW_DB.get(uuid);
}

/**
 * Mencari escrow berdasarkan transaction_uuid.
 * Relasi 1:1 — satu transaksi maksimal satu escrow aktif.
 * Jika ada lebih dari satu (edge case), mengembalikan yang terbaru.
 */
export function getEscrowByTransaction(transactionUuid: string): EscrowRecord | undefined {
  const results = _getAllEscrows()
    .filter((r) => r.transaction_uuid === transactionUuid)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return results[0];
}

/**
 * Menahan dana escrow — mengubah status ke HoldingFund.
 * Menetapkan hold_started_at dan payment_status ke Confirmed.
 *
 * GUARD:
 *   - Hanya dari status WaitingPayment.
 *   - Provider harus mendukung supports_hold.
 *   - Tidak bisa dilakukan pada escrow terminal.
 *
 * @example
 * holdFunds('escrow-uuid-xxx', { provider_reference: 'VA-BCA-001' })
 */
export function holdFunds(uuid: string, options: HoldFundsOptions = {}): EscrowRecord {
  const existing = _getOrThrow(uuid);
  _assertNotTerminal(existing, 'holdFunds');
  _assertProviderSupports(existing, 'supports_hold', 'holdFunds');

  if (existing.escrow_status_reference_uuid !== ESCROW_STATUS_UUID.WaitingPayment) {
    throw new Error(
      `[GlobalEscrowService] holdFunds: escrow "${uuid}" harus dalam status ` +
        `'WaitingPayment' untuk menahan dana. Status saat ini: ${_escrowStatusKey(existing.escrow_status_reference_uuid)}.`,
    );
  }

  const now = new Date().toISOString();
  const updated: EscrowRecord = {
    ...existing,
    escrow_status_reference_uuid:  ESCROW_STATUS_UUID.HoldingFund,
    payment_status_reference_uuid: PAYMENT_STATUS_UUID.Confirmed,
    provider_reference:            options.provider_reference ?? existing.provider_reference,
    hold_started_at:               now,
    hold_expired_at:               options.hold_expired_at ?? existing.hold_expired_at,
    updated_at:                    now,
  };

  _replaceEscrow(updated);
  return updated;
}

/**
 * Melepaskan dana ke Seller — mengubah status ke Completed.
 * Menetapkan released_at.
 *
 * GUARD:
 *   - Hanya dari status WaitingConfirmation, WaitingTransfer, atau TransferProcessing.
 *   - Provider harus mendukung supports_release.
 *   - Tidak bisa dilakukan pada escrow terminal.
 *
 * @example
 * releaseFunds('escrow-uuid-xxx', { released_by: 'ws-buyer-001' })
 */
export function releaseFunds(uuid: string, options: ReleaseFundsOptions = {}): EscrowRecord {
  const existing = _getOrThrow(uuid);
  _assertNotTerminal(existing, 'releaseFunds');
  _assertProviderSupports(existing, 'supports_release', 'releaseFunds');

  const releasableStatuses: ReadonlySet<string> = new Set([
    ESCROW_STATUS_UUID.WaitingConfirmation,
    ESCROW_STATUS_UUID.WaitingTransfer,
    ESCROW_STATUS_UUID.TransferProcessing,
    ESCROW_STATUS_UUID.WaitingReceiverConfirm,
  ]);

  if (!releasableStatuses.has(existing.escrow_status_reference_uuid)) {
    throw new Error(
      `[GlobalEscrowService] releaseFunds: escrow "${uuid}" tidak dalam status yang ` +
        `bisa dilepaskan (WaitingConfirmation / WaitingTransfer / TransferProcessing / WaitingReceiverConfirm). ` +
        `Status saat ini: ${_escrowStatusKey(existing.escrow_status_reference_uuid)}.`,
    );
  }

  const now = new Date().toISOString();
  const updated: EscrowRecord = {
    ...existing,
    escrow_status_reference_uuid: ESCROW_STATUS_UUID.Completed,
    released_at:                  now,
    updated_at:                   now,
    metadata: {
      ...existing.metadata,
      ...(options.released_by ? { released_by: options.released_by } : {}),
      ...(options.note        ? { release_note: options.note }        : {}),
    },
  };

  _replaceEscrow(updated);
  return updated;
}

/**
 * Mengembalikan dana ke Buyer — mengubah status ke Cancelled dan payment ke Refunded.
 * Menetapkan refunded_at dan cancelled_at.
 *
 * GUARD:
 *   - Tidak bisa dilakukan pada escrow terminal.
 *   - Provider harus mendukung supports_refund.
 *
 * @example
 * refundFunds('escrow-uuid-xxx', 'Barang tidak sesuai deskripsi.', 'ws-admin-001')
 */
export function refundFunds(
  uuid: string,
  reason: string = 'Tidak disebutkan.',
  refundedBy: string = 'System',
): EscrowRecord {
  const existing = _getOrThrow(uuid);
  _assertNotTerminal(existing, 'refundFunds');
  _assertProviderSupports(existing, 'supports_refund', 'refundFunds');

  const now = new Date().toISOString();
  const updated: EscrowRecord = {
    ...existing,
    escrow_status_reference_uuid:  ESCROW_STATUS_UUID.Cancelled,
    payment_status_reference_uuid: PAYMENT_STATUS_UUID.Refunded,
    refunded_at:                   now,
    cancelled_at:                  now,
    updated_at:                    now,
    metadata: {
      ...existing.metadata,
      refund_reason:  reason,
      refunded_by:    refundedBy,
    },
  };

  _replaceEscrow(updated);
  return updated;
}

/**
 * Membatalkan escrow tanpa refund — mengubah status ke Cancelled.
 * Gunakan refundFunds() jika Buyer harus menerima dananya kembali.
 *
 * GUARD: Tidak bisa dilakukan pada escrow terminal.
 *
 * @example
 * cancelEscrow('escrow-uuid-xxx', 'Transaksi dibatalkan pembeli.', 'ws-buyer-001')
 */
export function cancelEscrow(
  uuid: string,
  reason: string = 'Tidak disebutkan.',
  cancelledBy: string = 'System',
): EscrowRecord {
  const existing = _getOrThrow(uuid);
  _assertNotTerminal(existing, 'cancelEscrow');

  const now = new Date().toISOString();
  const updated: EscrowRecord = {
    ...existing,
    escrow_status_reference_uuid: ESCROW_STATUS_UUID.Cancelled,
    cancelled_at:                 now,
    updated_at:                   now,
    metadata: {
      ...existing.metadata,
      cancel_reason:  reason,
      cancelled_by:   cancelledBy,
    },
  };

  _replaceEscrow(updated);
  return updated;
}

/**
 * Mengekspirasi escrow saat hold_expired_at terlewat.
 * Mengubah payment_status ke Expired dan escrow ke Cancelled.
 * Biasanya dipanggil oleh scheduler / cron job.
 *
 * GUARD:
 *   - Tidak bisa dilakukan pada escrow terminal.
 *   - Provider harus mendukung supports_expiry.
 *   - Hanya dari status WaitingPayment (belum dibayar).
 *
 * @example
 * expireEscrow('escrow-uuid-xxx')
 */
export function expireEscrow(uuid: string): EscrowRecord {
  const existing = _getOrThrow(uuid);
  _assertNotTerminal(existing, 'expireEscrow');
  _assertProviderSupports(existing, 'supports_expiry', 'expireEscrow');

  if (existing.escrow_status_reference_uuid !== ESCROW_STATUS_UUID.WaitingPayment) {
    throw new Error(
      `[GlobalEscrowService] expireEscrow: escrow "${uuid}" hanya bisa diekspirasikan ` +
        `dari status 'WaitingPayment'. Status saat ini: ${_escrowStatusKey(existing.escrow_status_reference_uuid)}.`,
    );
  }

  const now = new Date().toISOString();
  const updated: EscrowRecord = {
    ...existing,
    escrow_status_reference_uuid:  ESCROW_STATUS_UUID.Cancelled,
    payment_status_reference_uuid: PAYMENT_STATUS_UUID.Expired,
    cancelled_at:                  now,
    updated_at:                    now,
    metadata: { ...existing.metadata, expired: true },
  };

  _replaceEscrow(updated);
  return updated;
}

/**
 * Membuka sengketa pada escrow — mengubah escrow ke Dispute dan dispute ke Open.
 *
 * GUARD:
 *   - Tidak bisa dilakukan pada escrow terminal.
 *   - Provider harus mendukung supports_dispute.
 *   - Tidak bisa membuka sengketa baru jika sengketa sebelumnya masih Open/UnderReview.
 *
 * @example
 * openDispute('escrow-uuid-xxx', 'Ternak tidak sesuai kondisi di listing.', 'ws-buyer-001')
 */
export function openDispute(
  uuid: string,
  reason: string,
  openedBy: string,
): EscrowRecord {
  const existing = _getOrThrow(uuid);
  _assertNotTerminal(existing, 'openDispute');
  _assertProviderSupports(existing, 'supports_dispute', 'openDispute');

  // Guard: jangan buka sengketa baru jika masih ada yang aktif
  const activeDisputeStatuses: ReadonlySet<string> = new Set([
    DISPUTE_STATUS_UUID.Open,
    DISPUTE_STATUS_UUID.UnderReview,
    DISPUTE_STATUS_UUID.Escalated,
  ]);
  if (activeDisputeStatuses.has(existing.dispute_status_reference_uuid)) {
    throw new Error(
      `[GlobalEscrowService] openDispute: escrow "${uuid}" sudah memiliki sengketa aktif. ` +
        `Tutup sengketa yang ada terlebih dahulu dengan closeDispute().`,
    );
  }

  const now = new Date().toISOString();
  const dispute: EscrowDispute = {
    dispute_uuid: generateUUID(),
    opened_by:    openedBy,
    reason,
    resolution:   null,
    resolved_by:  null,
    opened_at:    now,
    closed_at:    null,
  };

  const updated: EscrowRecord = {
    ...existing,
    escrow_status_reference_uuid:   ESCROW_STATUS_UUID.Dispute,
    dispute_status_reference_uuid:  DISPUTE_STATUS_UUID.Open,
    disputes:                       [...existing.disputes, dispute],
    updated_at:                     now,
  };

  _replaceEscrow(updated);
  return updated;
}

/**
 * Menutup sengketa pada escrow.
 * Escrow kembali ke WaitingConfirmation (resolusi ke Buyer/Seller ditentukan di luar).
 * dispute_status diubah ke Closed.
 *
 * GUARD:
 *   - Tidak bisa dilakukan pada escrow terminal.
 *   - Harus ada sengketa aktif (Open/UnderReview/Escalated) yang bisa ditutup.
 *
 * @example
 * closeDispute('escrow-uuid-xxx', 'Seller setuju mengganti ternak.', 'ws-admin-001')
 */
export function closeDispute(
  uuid: string,
  resolution: string,
  closedBy: string,
): EscrowRecord {
  const existing = _getOrThrow(uuid);
  _assertNotTerminal(existing, 'closeDispute');

  const activeDisputeStatuses: ReadonlySet<string> = new Set([
    DISPUTE_STATUS_UUID.Open,
    DISPUTE_STATUS_UUID.UnderReview,
    DISPUTE_STATUS_UUID.Escalated,
  ]);
  if (!activeDisputeStatuses.has(existing.dispute_status_reference_uuid)) {
    throw new Error(
      `[GlobalEscrowService] closeDispute: escrow "${uuid}" tidak memiliki sengketa aktif.`,
    );
  }

  const now = new Date().toISOString();

  // Tutup sengketa yang aktif (yang paling baru)
  const updatedDisputes = [...existing.disputes];
  let activeIdx = -1;
  for (let i = updatedDisputes.length - 1; i >= 0; i--) {
    if (updatedDisputes[i].closed_at === null) { activeIdx = i; break; }
  }
  if (activeIdx >= 0) {
    updatedDisputes[activeIdx] = {
      ...updatedDisputes[activeIdx],
      resolution,
      resolved_by: closedBy,
      closed_at:   now,
    };
  }

  const updated: EscrowRecord = {
    ...existing,
    // Kembali ke WaitingConfirmation — pihak yang tepat perlu mengkonfirmasi
    escrow_status_reference_uuid:   ESCROW_STATUS_UUID.WaitingConfirmation,
    dispute_status_reference_uuid:  DISPUTE_STATUS_UUID.Closed,
    disputes:                       updatedDisputes,
    updated_at:                     now,
  };

  _replaceEscrow(updated);
  return updated;
}

// ─── Provider Management ───────────────────────────────────────────────────────

/**
 * Mendaftarkan EscrowProvider baru ke registry.
 * Gunakan ini untuk mengintegrasikan provider pihak ketiga tanpa mengubah service.
 *
 * @example
 * registerEscrowProvider({
 *   provider_uuid:               crypto.randomUUID(),
 *   provider_name:               'Midtrans Escrow',
 *   provider_type_reference_uuid: ESCROW_PROVIDER_TYPE_UUID.PaymentGateway,
 *   provider_code:               'MIDTRANS',
 *   is_active:                   true,
 *   supports_hold:               true,
 *   supports_release:            true,
 *   supports_refund:             true,
 *   supports_dispute:            false,
 *   supports_expiry:             true,
 *   metadata:                    { apiEndpoint: 'https://api.midtrans.com' },
 * });
 */
export function registerEscrowProvider(provider: EscrowProvider): void {
  ESCROW_PROVIDER_REGISTRY.set(provider.provider_uuid, provider);
}

/**
 * Mengambil satu EscrowProvider berdasarkan UUID.
 */
export function getEscrowProvider(providerUuid: string): EscrowProvider | undefined {
  return ESCROW_PROVIDER_REGISTRY.get(providerUuid);
}

/**
 * Mengembalikan semua provider yang terdaftar.
 * @param activeOnly Jika true, hanya kembalikan provider aktif. Default: false.
 */
export function listEscrowProviders(activeOnly = false): EscrowProvider[] {
  const all = Array.from(ESCROW_PROVIDER_REGISTRY.values());
  return activeOnly ? all.filter((p) => p.is_active) : all;
}

// ─── Convenience Helpers ──────────────────────────────────────────────────────

/**
 * Menambahkan evidence_uuid ke daftar evidence escrow.
 */
export function attachEvidenceToEscrow(
  escrowUuid: string,
  evidenceUuid: string,
): EscrowRecord {
  const existing = _getOrThrow(escrowUuid);
  if (existing.evidence_uuids.includes(evidenceUuid)) return existing;

  const updated: EscrowRecord = {
    ...existing,
    evidence_uuids: [...existing.evidence_uuids, evidenceUuid],
    updated_at:     new Date().toISOString(),
  };

  _replaceEscrow(updated);
  return updated;
}

/**
 * Mengubah escrow_status ke status berikutnya secara manual.
 * Gunakan hanya untuk transisi yang belum memiliki fungsi dedicated.
 * Contoh: WaitingConfirmation → WaitingTransfer → TransferProcessing.
 *
 * GUARD: Tidak bisa dilakukan pada escrow terminal.
 */
export function advanceEscrowStatus(
  uuid: string,
  newEscrowStatusUuid: string,
): EscrowRecord {
  const existing = _getOrThrow(uuid);
  _assertNotTerminal(existing, 'advanceEscrowStatus');

  const updated: EscrowRecord = {
    ...existing,
    escrow_status_reference_uuid: newEscrowStatusUuid,
    updated_at:                   new Date().toISOString(),
  };

  _replaceEscrow(updated);
  return updated;
}

/**
 * Mengembalikan apakah escrow sudah dalam status terminal.
 */
export function isTerminalEscrow(uuid: string): boolean {
  const record = GLOBAL_ESCROW_DB.get(uuid);
  if (!record) return false;
  return TERMINAL_ESCROW_STATUS_UUIDS.has(record.escrow_status_reference_uuid);
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

function _getOrThrow(uuid: string): EscrowRecord {
  const record = GLOBAL_ESCROW_DB.get(uuid);
  if (!record) {
    throw new Error(`[GlobalEscrowService] Escrow tidak ditemukan: "${uuid}".`);
  }
  return record;
}

function _assertNotTerminal(record: EscrowRecord, caller: string): void {
  if (TERMINAL_ESCROW_STATUS_UUIDS.has(record.escrow_status_reference_uuid)) {
    const key = _escrowStatusKey(record.escrow_status_reference_uuid);
    throw new Error(
      `[GlobalEscrowService] ${caller}: escrow "${record.escrow_uuid}" ` +
        `sudah dalam status terminal "${key}" dan tidak dapat diubah.`,
    );
  }
}

function _assertProviderSupports(
  record: EscrowRecord,
  capability: keyof EscrowProvider,
  caller: string,
): void {
  const provider = ESCROW_PROVIDER_REGISTRY.get(record.provider_uuid);
  if (!provider) return; // Provider tidak ada — biarkan operasi berlanjut
  if (!provider[capability]) {
    throw new Error(
      `[GlobalEscrowService] ${caller}: provider "${provider.provider_name}" ` +
        `tidak mendukung operasi "${capability}".`,
    );
  }
}

function _escrowStatusKey(statusUuid: string): string {
  const entry = Object.entries(ESCROW_STATUS_UUID).find(([, v]) => v === statusUuid);
  return entry ? entry[0] : statusUuid;
}
