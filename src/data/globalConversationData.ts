// ─── Global Conversation Data — FOUNDATION-GLOBAL-CONVERSATION-001 ───────────
//
// Single Source of Truth untuk seluruh percakapan di TernakHub.
//
// ARSITEKTUR:
//   Global Conversation Service bersifat global — bukan hanya Chat Marketplace.
//   Seluruh modul (Marketplace, Escrow, Support, Transport, Veterinary, dll.)
//   menggunakan service yang sama.
//
//   Tiga entitas utama:
//     ConversationRecord  — ruang percakapan (1 per konteks referensi)
//     ParticipantRecord   — anggota percakapan (N per conversation)
//     MessageRecord       — pesan dalam percakapan (N per conversation)
//
//   Relasi polimorfik dibangun via:
//     reference_module  → modul pemilik ('marketplace', 'escrow', 'transport', dll.)
//     reference_uuid    → UUID entitas spesifik dalam modul tersebut
//
//   Semua tipe (ConversationType, MessageType, ParticipantRole, ConversationStatus)
//   disimpan sebagai reference_uuid — JANGAN hardcode string.
//   Gunakan konstanta CONVERSATION_TYPE_UUID, MESSAGE_TYPE_UUID, dst.
//
// ATURAN:
//   • GLOBAL_CONVERSATION_DB, PARTICIPANT_DB, MESSAGE_DB tidak boleh diakses
//     langsung dari modul lain — seluruh akses melalui globalConversationService.ts.
//   • Pesan yang dihapus (deleted_at != null) TETAP ada di store (soft-delete).
//   • Percakapan yang ditutup (Closed) tidak dapat menerima pesan baru.
//
// RELASI DISIAPKAN (belum di-wire):
//   ✓ Supabase media     — message.media_uuid → media metadata
//   ✓ Global Evidence    — message.evidence_uuid → EvidenceRecord
//   ✓ Global Transaction — reference_module: 'transaksi'; transaction_uuid di metadata
//   ✓ Global Escrow      — reference_module: 'escrow'; escrow_uuid di metadata
//   ✓ Global Notification— (akan dipanggil service saat pesan baru masuk)
//   ✓ Global Audit Trail — audit_uuid di ConversationRecord
//   ✓ Marketplace        — reference_module: 'marketplace'
// ─────────────────────────────────────────────────────────────────────────────

import { generateUUID } from '../utils/uuid';

// ─── Stable Type UUID Maps ────────────────────────────────────────────────────
// Semua UUID menunjuk ke seed di globalReferenceData.ts — JANGAN diubah.

/** CONVERSATION_TYPE reference_uuid — sesuai seed a4000001-... */
export const CONVERSATION_TYPE_UUID = {
  Marketplace:  'a4000001-0000-4000-a000-000000000001',
  Escrow:       'a4000001-0000-4000-a000-000000000002',
  Support:      'a4000001-0000-4000-a000-000000000003',
  Transport:    'a4000001-0000-4000-a000-000000000004',
  Veterinary:   'a4000001-0000-4000-a000-000000000005',
  InternalNote: 'a4000001-0000-4000-a000-000000000006',
} as const;

export type ConversationTypeKey = keyof typeof CONVERSATION_TYPE_UUID;

/** CONVERSATION_STATUS reference_uuid — sesuai seed a6000001-... */
export const CONVERSATION_STATUS_UUID = {
  Active:   'a6000001-0000-4000-a000-000000000001',
  Closed:   'a6000001-0000-4000-a000-000000000002',
  Archived: 'a6000001-0000-4000-a000-000000000003',
} as const;

export type ConversationStatusKey = keyof typeof CONVERSATION_STATUS_UUID;

/** MESSAGE_TYPE reference_uuid — sesuai seed a5000001-... */
export const MESSAGE_TYPE_UUID = {
  Text:        'a5000001-0000-4000-a000-000000000001',
  Image:       'a5000001-0000-4000-a000-000000000002',
  Document:    'a5000001-0000-4000-a000-000000000003',
  Evidence:    'a5000001-0000-4000-a000-000000000004',
  System:      'a5000001-0000-4000-a000-000000000005',
  Transaction: 'a5000001-0000-4000-a000-000000000006',
  Escrow:      'a5000001-0000-4000-a000-000000000007',
} as const;

export type MessageTypeKey = keyof typeof MESSAGE_TYPE_UUID;

/** PARTICIPANT_ROLE reference_uuid — sesuai seed a7000001-... */
export const PARTICIPANT_ROLE_UUID = {
  Buyer:        'a7000001-0000-4000-a000-000000000001',
  Seller:       'a7000001-0000-4000-a000-000000000002',
  Support:      'a7000001-0000-4000-a000-000000000003',
  Admin:        'a7000001-0000-4000-a000-000000000004',
  Observer:     'a7000001-0000-4000-a000-000000000005',
  System:       'a7000001-0000-4000-a000-000000000006',
  Veterinarian: 'a7000001-0000-4000-a000-000000000007',
  Driver:       'a7000001-0000-4000-a000-000000000008',
} as const;

export type ParticipantRoleKey = keyof typeof PARTICIPANT_ROLE_UUID;

/** Reference module yang dapat memiliki Conversation. */
export type ConversationReferenceModule =
  | 'marketplace'       // Listing Marketplace
  | 'transaksi'         // Transaksi (Global Transaction Service)
  | 'escrow'            // Escrow (Global Escrow Service)
  | 'transport'         // Layanan Transport
  | 'kesehatan_hewan'   // Layanan Kesehatan Hewan / Veterinary
  | 'support'           // Tiket Support TernakHub
  | 'batch'             // Batch Ternak
  | 'workspace';        // Komunikasi internal dalam satu workspace

export const CONVERSATION_REFERENCE_MODULES: readonly ConversationReferenceModule[] = [
  'marketplace', 'transaksi', 'escrow', 'transport',
  'kesehatan_hewan', 'support', 'batch', 'workspace',
] as const;

// ─── Schema: ConversationRecord ───────────────────────────────────────────────

export interface ConversationRecord {
  // ── Identitas ──────────────────────────────────────────────────────────────

  /** UUID v4 — primary key. Immutable setelah ditetapkan. */
  conversation_uuid: string;

  /**
   * Tipe percakapan — reference_uuid ke CONVERSATION_TYPE di GRS.
   * Gunakan CONVERSATION_TYPE_UUID.{Key}.
   */
  conversation_type_reference_uuid: string;

  /**
   * Status percakapan — reference_uuid ke CONVERSATION_STATUS di GRS.
   * Gunakan CONVERSATION_STATUS_UUID.{Key}.
   */
  conversation_status_reference_uuid: string;

  // ── Relasi Polimorfik ──────────────────────────────────────────────────────

  /** Modul pemilik percakapan. */
  reference_module: ConversationReferenceModule;

  /**
   * UUID entitas spesifik dalam reference_module.
   * e.g. listingId untuk 'marketplace', transaksiId untuk 'transaksi'.
   */
  reference_uuid: string;

  // ── Konten ─────────────────────────────────────────────────────────────────

  /**
   * Judul percakapan.
   * Contoh: 'Diskusi Sapi Limousin #LST-001', 'Tiket Support #SUP-2026-001'.
   */
  title: string;

  // ── Kepemilikan ────────────────────────────────────────────────────────────

  /** workspaceId yang membuat percakapan. */
  created_by_workspace_uuid: string;

  // ── Relasi Layanan Global (FK) ─────────────────────────────────────────────

  /**
   * UUID audit trail terkait.
   * → Global Audit Trail Service (belum diimplementasi).
   */
  audit_uuid: string | null;

  // ── Timestamps ─────────────────────────────────────────────────────────────

  /** ISO 8601 — saat percakapan dibuat. */
  created_at: string;

  /** ISO 8601 — saat percakapan terakhir diperbarui (pesan baru, peserta masuk/keluar). */
  updated_at: string;

  /**
   * ISO 8601 — saat percakapan ditutup.
   * null = masih aktif.
   */
  closed_at: string | null;

  // ── Metadata ───────────────────────────────────────────────────────────────

  /**
   * Data tambahan module-specific.
   * Contoh: { listingTitle: 'Sapi Limousin', transactionCode: 'GTX-20260717-001' }
   */
  metadata: Record<string, string | number | boolean | null>;
}

// ─── Schema: ParticipantRecord ────────────────────────────────────────────────

export interface ParticipantRecord {
  // ── Identitas ──────────────────────────────────────────────────────────────

  /** UUID v4 — primary key. */
  participant_uuid: string;

  /** UUID percakapan yang diikuti. → ConversationRecord. */
  conversation_uuid: string;

  /** workspaceId peserta. */
  workspace_uuid: string;

  /**
   * Peran peserta — reference_uuid ke PARTICIPANT_ROLE di GRS.
   * Gunakan PARTICIPANT_ROLE_UUID.{Key}.
   */
  role_reference_uuid: string;

  // ── Status ─────────────────────────────────────────────────────────────────

  /** ISO 8601 — saat peserta bergabung. */
  joined_at: string;

  /**
   * ISO 8601 — saat peserta keluar dari percakapan.
   * null = masih aktif dalam percakapan.
   */
  left_at: string | null;

  /**
   * UUID pesan terakhir yang sudah dibaca peserta ini.
   * → MessageRecord.
   * null = belum membaca pesan apa pun.
   */
  last_read_message_uuid: string | null;
}

// ─── Schema: MessageRecord ────────────────────────────────────────────────────

export interface MessageRecord {
  // ── Identitas ──────────────────────────────────────────────────────────────

  /** UUID v4 — primary key. Immutable setelah ditetapkan. */
  message_uuid: string;

  /** UUID percakapan tempat pesan dikirim. → ConversationRecord. */
  conversation_uuid: string;

  /** workspaceId pengirim (atau 'System' untuk pesan otomatis). */
  sender_workspace_uuid: string;

  /**
   * Tipe pesan — reference_uuid ke MESSAGE_TYPE di GRS.
   * Gunakan MESSAGE_TYPE_UUID.{Key}.
   */
  message_type_reference_uuid: string;

  // ── Konten ─────────────────────────────────────────────────────────────────

  /**
   * Isi pesan teks.
   * Untuk tipe Image/Document: bisa berisi caption.
   * Untuk tipe System: berisi pesan status otomatis.
   * Untuk tipe Evidence/Transaction/Escrow: bisa berisi keterangan.
   */
  message: string;

  // ── Relasi Layanan Global (FK) ─────────────────────────────────────────────

  /**
   * UUID media terlampir.
   * → Global Media Service.
   * null = tidak ada lampiran media.
   */
  media_uuid: string | null;

  /**
   * UUID evidence terlampir.
   * → Global Evidence Service.
   * null = tidak ada lampiran evidence.
   */
  evidence_uuid: string | null;

  /**
   * UUID pesan yang dibalas (thread/reply).
   * → MessageRecord.
   * null = pesan baru (bukan reply).
   */
  reply_to_message_uuid: string | null;

  // ── Timestamps ─────────────────────────────────────────────────────────────

  /** ISO 8601 — saat pesan dikirim. */
  sent_at: string;

  /**
   * ISO 8601 — saat pesan diedit.
   * null = belum pernah diedit.
   */
  edited_at: string | null;

  /**
   * ISO 8601 — saat pesan dihapus (soft-delete).
   * null = masih aktif.
   * Pesan yang dihapus tetap ada di store untuk audit — kontennya disembunyikan di UI.
   */
  deleted_at: string | null;

  // ── Metadata ───────────────────────────────────────────────────────────────

  /**
   * Data tambahan.
   * Contoh: { transactionCode: 'GTX-20260717-001' } untuk tipe Transaction
   *         { escrowStatus: 'HoldingFund' }          untuk tipe Escrow
   */
  metadata: Record<string, string | number | boolean | null>;
}

// ─── In-Memory Stores ─────────────────────────────────────────────────────────
// INTERNAL — akses hanya melalui globalConversationService.ts.

/** Keyed by conversation_uuid. */
export const GLOBAL_CONVERSATION_DB: Map<string, ConversationRecord> = new Map();

/** Keyed by participant_uuid. */
export const PARTICIPANT_DB: Map<string, ParticipantRecord> = new Map();

/** Keyed by message_uuid. */
export const MESSAGE_DB: Map<string, MessageRecord> = new Map();

// ─── Internal Helpers (package-private) ──────────────────────────────────────

export function _insertConversation(r: ConversationRecord): void {
  GLOBAL_CONVERSATION_DB.set(r.conversation_uuid, r);
}
export function _getAllConversations(): ConversationRecord[] {
  return Array.from(GLOBAL_CONVERSATION_DB.values());
}
export function _replaceConversation(r: ConversationRecord): void {
  GLOBAL_CONVERSATION_DB.set(r.conversation_uuid, r);
}

export function _insertParticipant(r: ParticipantRecord): void {
  PARTICIPANT_DB.set(r.participant_uuid, r);
}
export function _getAllParticipants(): ParticipantRecord[] {
  return Array.from(PARTICIPANT_DB.values());
}
export function _replaceParticipant(r: ParticipantRecord): void {
  PARTICIPANT_DB.set(r.participant_uuid, r);
}

export function _insertMessage(r: MessageRecord): void {
  MESSAGE_DB.set(r.message_uuid, r);
}
export function _getAllMessages(): MessageRecord[] {
  return Array.from(MESSAGE_DB.values());
}
export function _replaceMessage(r: MessageRecord): void {
  MESSAGE_DB.set(r.message_uuid, r);
}

export { generateUUID };
