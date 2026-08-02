// ─── Global Conversation Service — FOUNDATION-GLOBAL-CONVERSATION-001 ────────
//
// Satu-satunya entry point untuk membaca dan mengelola percakapan di TernakHub.
//
// PRINSIP:
//   1. Global — bukan hanya Chat Marketplace. Seluruh modul menggunakan service ini.
//   2. Semua tipe disimpan sebagai reference_uuid — gunakan konstanta *_UUID.
//   3. createConversation() adalah satu-satunya cara membuat percakapan baru.
//   4. Percakapan Closed tidak bisa menerima pesan baru.
//   5. Pesan yang dihapus tetap di store (soft-delete) untuk audit.
//
// API PUBLIK:
//   createConversation(input)                   → ConversationRecord
//   getConversation(filters?)                   → ConversationRecord[]
//   getConversationByUuid(uuid)                 → ConversationRecord | undefined
//   addParticipant(convUuid, input)             → ParticipantRecord
//   removeParticipant(convUuid, workspaceUuid)  → ParticipantRecord
//   sendMessage(input)                          → MessageRecord
//   editMessage(msgUuid, newContent, by)        → MessageRecord
//   deleteMessage(msgUuid, deletedBy)           → MessageRecord
//   markAsRead(convUuid, workspaceUuid, msgUuid)→ ParticipantRecord
//   closeConversation(convUuid, closedBy?)      → ConversationRecord
//
// HELPERS TAMBAHAN:
//   getMessages(convUuid, filters?)             → MessageRecord[]
//   getParticipants(convUuid, activeOnly?)      → ParticipantRecord[]
//   getOrCreateConversation(module, refUuid, input) → ConversationRecord
//   sendSystemMessage(convUuid, text, meta?)    → MessageRecord
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   message.media_uuid      → Global Media Service
//   message.evidence_uuid   → Global Evidence Service
//   conversation.audit_uuid → Global Audit Trail Service
//   reference_module/uuid   → Global Transaction / Escrow / Marketplace / dll.
// ─────────────────────────────────────────────────────────────────────────────

import {
  type ConversationRecord,
  type ParticipantRecord,
  type MessageRecord,
  type ConversationReferenceModule,
  CONVERSATION_TYPE_UUID,
  CONVERSATION_STATUS_UUID,
  MESSAGE_TYPE_UUID,
  PARTICIPANT_ROLE_UUID,
  _insertConversation,
  _getAllConversations,
  _replaceConversation,
  _insertParticipant,
  _getAllParticipants,
  _replaceParticipant,
  _insertMessage,
  _getAllMessages,
  _replaceMessage,
  GLOBAL_CONVERSATION_DB,
  PARTICIPANT_DB,
  MESSAGE_DB,
  generateUUID,
} from '../data/globalConversationData';

// Re-export types & constants
export type { ConversationRecord, ParticipantRecord, MessageRecord, ConversationReferenceModule };
export {
  CONVERSATION_TYPE_UUID,
  CONVERSATION_STATUS_UUID,
  MESSAGE_TYPE_UUID,
  PARTICIPANT_ROLE_UUID,
  CONVERSATION_REFERENCE_MODULES,
} from '../data/globalConversationData';

// ─── Public Input Types ───────────────────────────────────────────────────────

export interface GetConversationFilters {
  /** Filter berdasarkan reference_module. */
  module?: ConversationReferenceModule;
  /** Filter berdasarkan reference_uuid. */
  referenceUuid?: string;
  /** Filter berdasarkan conversation_type_reference_uuid. Gunakan CONVERSATION_TYPE_UUID.{Key}. */
  typeUuid?: string;
  /** Filter berdasarkan conversation_status_reference_uuid. Gunakan CONVERSATION_STATUS_UUID.{Key}. */
  statusUuid?: string;
  /** Filter — percakapan yang melibatkan workspace ini (sebagai peserta). */
  participantWorkspaceUuid?: string;
  /** Jika true, sertakan percakapan Closed/Archived. Default: false. */
  includeInactive?: boolean;
}

export interface CreateConversationInput {
  /** Tipe percakapan — reference_uuid ke CONVERSATION_TYPE di GRS. Gunakan CONVERSATION_TYPE_UUID.{Key}. */
  conversation_type_reference_uuid: string;
  /** Modul pemilik percakapan. */
  reference_module: ConversationReferenceModule;
  /** UUID entitas spesifik dalam reference_module. */
  reference_uuid: string;
  /** Judul percakapan. */
  title: string;
  /** workspaceId pembuat percakapan. */
  created_by_workspace_uuid: string;
  /** UUID audit trail terkait. */
  audit_uuid?: string | null;
  /** Data tambahan. */
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AddParticipantInput {
  /** workspaceId peserta yang akan ditambahkan. */
  workspace_uuid: string;
  /**
   * Peran peserta — reference_uuid ke PARTICIPANT_ROLE di GRS.
   * Gunakan PARTICIPANT_ROLE_UUID.{Key}.
   */
  role_reference_uuid: string;
}

export interface SendMessageInput {
  /** UUID percakapan tujuan. */
  conversation_uuid: string;
  /** workspaceId pengirim (atau 'System' untuk pesan otomatis). */
  sender_workspace_uuid: string;
  /**
   * Tipe pesan — reference_uuid ke MESSAGE_TYPE di GRS.
   * Default: MESSAGE_TYPE_UUID.Text.
   */
  message_type_reference_uuid?: string;
  /** Isi pesan / caption. */
  message: string;
  /** UUID media dari Global Media Service. null = tanpa lampiran. */
  media_uuid?: string | null;
  /** UUID evidence dari Global Evidence Service. null = tanpa evidence. */
  evidence_uuid?: string | null;
  /** UUID pesan yang dibalas. null = bukan reply. */
  reply_to_message_uuid?: string | null;
  /** Data tambahan. */
  metadata?: Record<string, string | number | boolean | null>;
}

export interface GetMessagesFilters {
  /** Filter berdasarkan message_type_reference_uuid. Gunakan MESSAGE_TYPE_UUID.{Key}. */
  typeUuid?: string;
  /** Filter berdasarkan sender_workspace_uuid. */
  senderWorkspaceUuid?: string;
  /** Jika true, sertakan pesan yang dihapus. Default: false. */
  includeDeleted?: boolean;
  /** Ambil pesan setelah message_uuid tertentu (pagination). */
  afterMessageUuid?: string;
  /** Batas maksimum jumlah pesan yang dikembalikan. Default: 100. */
  limit?: number;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Membuat percakapan baru.
 * Status awal: Active.
 *
 * @example
 * // Percakapan Marketplace antara Buyer dan Seller
 * const conv = createConversation({
 *   conversation_type_reference_uuid: CONVERSATION_TYPE_UUID.Marketplace,
 *   reference_module:     'marketplace',
 *   reference_uuid:       'listing-uuid-xxx',
 *   title:                'Diskusi Sapi Limousin — LST-001',
 *   created_by_workspace_uuid: 'ws-buyer-001',
 * });
 *
 * // Percakapan Support
 * const conv = createConversation({
 *   conversation_type_reference_uuid: CONVERSATION_TYPE_UUID.Support,
 *   reference_module:     'support',
 *   reference_uuid:       'ticket-uuid-yyy',
 *   title:                'Tiket: Pembayaran gagal',
 *   created_by_workspace_uuid: 'ws-user-001',
 * });
 */
export function createConversation(input: CreateConversationInput): ConversationRecord {
  const now = new Date().toISOString();
  const record: ConversationRecord = {
    conversation_uuid:                  generateUUID(),
    conversation_type_reference_uuid:   input.conversation_type_reference_uuid,
    conversation_status_reference_uuid: CONVERSATION_STATUS_UUID.Active,
    reference_module:                   input.reference_module,
    reference_uuid:                     input.reference_uuid,
    title:                              input.title,
    created_by_workspace_uuid:          input.created_by_workspace_uuid,
    audit_uuid:                         input.audit_uuid ?? null,
    created_at:                         now,
    updated_at:                         now,
    closed_at:                          null,
    metadata:                           input.metadata ?? {},
  };
  _insertConversation(record);
  return record;
}

/**
 * Mengembalikan percakapan yang sesuai dengan filter.
 * Default: hanya percakapan Active.
 * Hasil diurutkan dari terbaru ke terlama (updated_at desc — percakapan paling aktif dulu).
 *
 * @example
 * // Semua percakapan aktif dari Marketplace
 * getConversation({ module: 'marketplace' })
 *
 * // Percakapan yang melibatkan workspace tertentu
 * getConversation({ participantWorkspaceUuid: 'ws-buyer-001' })
 */
export function getConversation(filters: GetConversationFilters = {}): ConversationRecord[] {
  const {
    module: refModule,
    referenceUuid,
    typeUuid,
    statusUuid,
    participantWorkspaceUuid,
    includeInactive = false,
  } = filters;

  let records = _getAllConversations();

  if (!includeInactive) {
    records = records.filter(
      (r) => r.conversation_status_reference_uuid === CONVERSATION_STATUS_UUID.Active,
    );
  }
  if (refModule !== undefined) {
    records = records.filter((r) => r.reference_module === refModule);
  }
  if (referenceUuid !== undefined) {
    records = records.filter((r) => r.reference_uuid === referenceUuid);
  }
  if (typeUuid !== undefined) {
    records = records.filter((r) => r.conversation_type_reference_uuid === typeUuid);
  }
  if (statusUuid !== undefined) {
    records = records.filter((r) => r.conversation_status_reference_uuid === statusUuid);
  }
  if (participantWorkspaceUuid !== undefined) {
    // Ambil set conversation_uuid yang diikuti workspace ini (peserta aktif)
    const convUuids = new Set(
      _getAllParticipants()
        .filter((p) => p.workspace_uuid === participantWorkspaceUuid && p.left_at === null)
        .map((p) => p.conversation_uuid),
    );
    records = records.filter((r) => convUuids.has(r.conversation_uuid));
  }

  return records.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

/**
 * Mencari satu percakapan berdasarkan UUID.
 * Mengembalikan undefined jika tidak ditemukan (termasuk Closed/Archived).
 */
export function getConversationByUuid(uuid: string): ConversationRecord | undefined {
  return GLOBAL_CONVERSATION_DB.get(uuid);
}

/**
 * Menambahkan peserta ke percakapan.
 * Jika workspace sudah menjadi peserta aktif, operasi ini bersifat idempotent
 * (mengembalikan record yang ada tanpa duplikasi).
 *
 * GUARD: Melempar Error jika percakapan tidak ditemukan atau sudah Closed.
 *
 * @example
 * addParticipant('conv-uuid-xxx', {
 *   workspace_uuid:      'ws-seller-001',
 *   role_reference_uuid:  PARTICIPANT_ROLE_UUID.Seller,
 * })
 */
export function addParticipant(
  conversationUuid: string,
  input: AddParticipantInput,
): ParticipantRecord {
  const conv = _getConvOrThrow(conversationUuid);
  _assertConvActive(conv, 'addParticipant');

  // Idempotent — cek apakah peserta aktif sudah ada
  const existing = _getAllParticipants().find(
    (p) =>
      p.conversation_uuid === conversationUuid &&
      p.workspace_uuid === input.workspace_uuid &&
      p.left_at === null,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const record: ParticipantRecord = {
    participant_uuid:       generateUUID(),
    conversation_uuid:      conversationUuid,
    workspace_uuid:         input.workspace_uuid,
    role_reference_uuid:    input.role_reference_uuid,
    joined_at:              now,
    left_at:                null,
    last_read_message_uuid: null,
  };
  _insertParticipant(record);
  _touchConversation(conv, now);
  return record;
}

/**
 * Mengeluarkan peserta dari percakapan (menetapkan left_at).
 * Operasi idempotent — memanggil ulang pada peserta yang sudah keluar tidak berubah apa pun.
 *
 * GUARD: Melempar Error jika percakapan tidak ditemukan atau peserta tidak ada.
 *
 * @example
 * removeParticipant('conv-uuid-xxx', 'ws-buyer-001')
 */
export function removeParticipant(
  conversationUuid: string,
  workspaceUuid: string,
): ParticipantRecord {
  _getConvOrThrow(conversationUuid);

  const participant = _getAllParticipants().find(
    (p) =>
      p.conversation_uuid === conversationUuid &&
      p.workspace_uuid === workspaceUuid &&
      p.left_at === null,
  );
  if (!participant) {
    throw new Error(
      `[GlobalConversationService] removeParticipant: workspace "${workspaceUuid}" ` +
        `bukan peserta aktif dalam percakapan "${conversationUuid}".`,
    );
  }

  const updated: ParticipantRecord = {
    ...participant,
    left_at: new Date().toISOString(),
  };
  _replaceParticipant(updated);
  return updated;
}

/**
 * Mengirim pesan baru ke dalam percakapan.
 * Secara otomatis memperbarui conversation.updated_at.
 *
 * GUARD:
 *   - Melempar Error jika percakapan tidak ditemukan.
 *   - Melempar Error jika percakapan Closed atau Archived.
 *
 * @example
 * // Pesan teks biasa
 * sendMessage({
 *   conversation_uuid:           'conv-uuid-xxx',
 *   sender_workspace_uuid:       'ws-buyer-001',
 *   message:                     'Apakah ternak masih tersedia?',
 * })
 *
 * // Pesan Evidence
 * sendMessage({
 *   conversation_uuid:           'conv-uuid-xxx',
 *   sender_workspace_uuid:       'ws-buyer-001',
 *   message_type_reference_uuid:  MESSAGE_TYPE_UUID.Evidence,
 *   message:                     'Terlampir bukti transfer.',
 *   evidence_uuid:               'ev-uuid-yyy',
 * })
 *
 * // Pesan System otomatis
 * sendMessage({
 *   conversation_uuid:           'conv-uuid-xxx',
 *   sender_workspace_uuid:       'System',
 *   message_type_reference_uuid:  MESSAGE_TYPE_UUID.System,
 *   message:                     'Transaksi GTX-20260717-001 telah dibuat.',
 *   metadata:                    { transactionCode: 'GTX-20260717-001' },
 * })
 */
export function sendMessage(input: SendMessageInput): MessageRecord {
  const conv = _getConvOrThrow(input.conversation_uuid);

  if (
    conv.conversation_status_reference_uuid === CONVERSATION_STATUS_UUID.Closed ||
    conv.conversation_status_reference_uuid === CONVERSATION_STATUS_UUID.Archived
  ) {
    const statusKey = _convStatusKey(conv.conversation_status_reference_uuid);
    throw new Error(
      `[GlobalConversationService] sendMessage: percakapan "${input.conversation_uuid}" ` +
        `dalam status "${statusKey}" — tidak dapat mengirim pesan baru.`,
    );
  }

  const now = new Date().toISOString();
  const record: MessageRecord = {
    message_uuid:               generateUUID(),
    conversation_uuid:          input.conversation_uuid,
    sender_workspace_uuid:      input.sender_workspace_uuid,
    message_type_reference_uuid: input.message_type_reference_uuid ?? MESSAGE_TYPE_UUID.Text,
    message:                    input.message,
    media_uuid:                 input.media_uuid ?? null,
    evidence_uuid:              input.evidence_uuid ?? null,
    reply_to_message_uuid:      input.reply_to_message_uuid ?? null,
    sent_at:                    now,
    edited_at:                  null,
    deleted_at:                 null,
    metadata:                   input.metadata ?? {},
  };
  _insertMessage(record);
  _touchConversation(conv, now);
  return record;
}

/**
 * Mengedit isi pesan yang ada.
 * Menetapkan edited_at. Tipe pesan tidak berubah.
 *
 * GUARD:
 *   - Melempar Error jika pesan tidak ditemukan.
 *   - Melempar Error jika pesan sudah dihapus.
 *   - Melempar Error jika percakapan sudah Closed.
 *
 * @example
 * editMessage('msg-uuid-xxx', 'Pesan yang sudah diperbaiki.', 'ws-buyer-001')
 */
export function editMessage(
  messageUuid: string,
  newContent: string,
  editedBy: string,
): MessageRecord {
  const msg = _getMsgOrThrow(messageUuid);
  const conv = _getConvOrThrow(msg.conversation_uuid);
  _assertConvActive(conv, 'editMessage');

  if (msg.deleted_at !== null) {
    throw new Error(
      `[GlobalConversationService] editMessage: pesan "${messageUuid}" sudah dihapus dan tidak bisa diedit.`,
    );
  }

  const now = new Date().toISOString();
  const updated: MessageRecord = {
    ...msg,
    message:   newContent,
    edited_at: now,
    metadata: { ...msg.metadata, edited_by: editedBy },
  };
  _replaceMessage(updated);
  _touchConversation(conv, now);
  return updated;
}

/**
 * Menghapus pesan secara soft (menetapkan deleted_at).
 * Pesan tetap ada di store untuk keperluan audit.
 * Operasi idempotent — memanggil ulang tidak mengubah apa pun.
 *
 * GUARD: Melempar Error jika pesan tidak ditemukan.
 *
 * @example
 * deleteMessage('msg-uuid-xxx', 'ws-buyer-001')
 */
export function deleteMessage(messageUuid: string, deletedBy: string): MessageRecord {
  const msg = _getMsgOrThrow(messageUuid);

  // Idempotent
  if (msg.deleted_at !== null) return msg;

  const now = new Date().toISOString();
  const updated: MessageRecord = {
    ...msg,
    deleted_at: now,
    metadata:   { ...msg.metadata, deleted_by: deletedBy },
  };
  _replaceMessage(updated);
  return updated;
}

/**
 * Menandai pesan terakhir yang sudah dibaca oleh peserta.
 * Memperbarui last_read_message_uuid pada ParticipantRecord.
 *
 * GUARD: Melempar Error jika peserta tidak ditemukan dalam percakapan.
 *
 * @example
 * markAsRead('conv-uuid-xxx', 'ws-buyer-001', 'msg-uuid-yyy')
 */
export function markAsRead(
  conversationUuid: string,
  workspaceUuid: string,
  lastReadMessageUuid: string,
): ParticipantRecord {
  const participant = _getAllParticipants().find(
    (p) =>
      p.conversation_uuid === conversationUuid &&
      p.workspace_uuid === workspaceUuid &&
      p.left_at === null,
  );
  if (!participant) {
    throw new Error(
      `[GlobalConversationService] markAsRead: workspace "${workspaceUuid}" ` +
        `bukan peserta aktif dalam percakapan "${conversationUuid}".`,
    );
  }

  const updated: ParticipantRecord = {
    ...participant,
    last_read_message_uuid: lastReadMessageUuid,
  };
  _replaceParticipant(updated);
  return updated;
}

/**
 * Menutup percakapan — mengubah status ke Closed dan menetapkan closed_at.
 * Percakapan Closed tidak bisa menerima pesan baru.
 * Operasi idempotent — memanggil ulang pada percakapan yang sudah Closed tidak berubah.
 *
 * GUARD: Melempar Error jika percakapan tidak ditemukan.
 *
 * @example
 * closeConversation('conv-uuid-xxx', 'ws-admin-001')
 */
export function closeConversation(
  conversationUuid: string,
  closedBy: string = 'System',
): ConversationRecord {
  const conv = _getConvOrThrow(conversationUuid);

  // Idempotent
  if (conv.conversation_status_reference_uuid === CONVERSATION_STATUS_UUID.Closed) {
    return conv;
  }

  const now = new Date().toISOString();
  const updated: ConversationRecord = {
    ...conv,
    conversation_status_reference_uuid: CONVERSATION_STATUS_UUID.Closed,
    closed_at:  now,
    updated_at: now,
    metadata:   { ...conv.metadata, closed_by: closedBy },
  };
  _replaceConversation(updated);
  return updated;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Mengembalikan semua pesan dalam percakapan.
 * Default: exclude pesan yang dihapus, diurutkan dari terlama ke terbaru (sent_at asc).
 *
 * @example
 * getMessages('conv-uuid-xxx')
 * getMessages('conv-uuid-xxx', { includeDeleted: true, limit: 50 })
 */
export function getMessages(
  conversationUuid: string,
  filters: GetMessagesFilters = {},
): MessageRecord[] {
  const {
    typeUuid,
    senderWorkspaceUuid,
    includeDeleted = false,
    afterMessageUuid,
    limit = 100,
  } = filters;

  let msgs = _getAllMessages().filter((m) => m.conversation_uuid === conversationUuid);

  if (!includeDeleted) {
    msgs = msgs.filter((m) => m.deleted_at === null);
  }
  if (typeUuid !== undefined) {
    msgs = msgs.filter((m) => m.message_type_reference_uuid === typeUuid);
  }
  if (senderWorkspaceUuid !== undefined) {
    msgs = msgs.filter((m) => m.sender_workspace_uuid === senderWorkspaceUuid);
  }

  // Urutkan dari terlama ke terbaru
  msgs = msgs.sort((a, b) => a.sent_at.localeCompare(b.sent_at));

  // Pagination: ambil pesan setelah afterMessageUuid
  if (afterMessageUuid !== undefined) {
    const idx = msgs.findIndex((m) => m.message_uuid === afterMessageUuid);
    if (idx >= 0) msgs = msgs.slice(idx + 1);
  }

  return msgs.slice(0, limit);
}

/**
 * Mengembalikan semua peserta dalam percakapan.
 * @param activeOnly Jika true, hanya kembalikan peserta aktif (left_at = null). Default: true.
 */
export function getParticipants(
  conversationUuid: string,
  activeOnly = true,
): ParticipantRecord[] {
  let participants = _getAllParticipants().filter(
    (p) => p.conversation_uuid === conversationUuid,
  );
  if (activeOnly) {
    participants = participants.filter((p) => p.left_at === null);
  }
  return participants.sort((a, b) => a.joined_at.localeCompare(b.joined_at));
}

/**
 * Mengembalikan percakapan yang ada untuk kombinasi (module, referenceUuid).
 * Jika belum ada, buat percakapan baru secara otomatis.
 * Berguna untuk modul yang ingin memastikan percakapan selalu tersedia.
 *
 * @example
 * // Marketplace: pastikan percakapan untuk listing ini ada
 * const conv = getOrCreateConversation('marketplace', 'listing-uuid-xxx', {
 *   conversation_type_reference_uuid: CONVERSATION_TYPE_UUID.Marketplace,
 *   title:                'Diskusi Sapi Limousin',
 *   created_by_workspace_uuid: 'ws-buyer-001',
 * });
 */
export function getOrCreateConversation(
  module: ConversationReferenceModule,
  referenceUuid: string,
  input: Omit<CreateConversationInput, 'reference_module' | 'reference_uuid'>,
): ConversationRecord {
  // Cari percakapan aktif yang sudah ada
  const existing = _getAllConversations().find(
    (c) =>
      c.reference_module === module &&
      c.reference_uuid === referenceUuid &&
      c.conversation_status_reference_uuid === CONVERSATION_STATUS_UUID.Active,
  );
  if (existing) return existing;

  return createConversation({
    ...input,
    reference_module: module,
    reference_uuid:   referenceUuid,
  });
}

/**
 * Mengirim pesan System otomatis ke percakapan.
 * Shorthand untuk sendMessage dengan type=System dan sender=System.
 *
 * @example
 * sendSystemMessage('conv-uuid-xxx', 'Transaksi GTX-20260717-001 telah dibuat.', {
 *   transactionCode: 'GTX-20260717-001',
 * })
 */
export function sendSystemMessage(
  conversationUuid: string,
  text: string,
  metadata: Record<string, string | number | boolean | null> = {},
): MessageRecord {
  return sendMessage({
    conversation_uuid:           conversationUuid,
    sender_workspace_uuid:       'System',
    message_type_reference_uuid: MESSAGE_TYPE_UUID.System,
    message:                     text,
    metadata,
  });
}

/**
 * Mengembalikan jumlah pesan yang belum dibaca oleh workspace dalam percakapan.
 * Berguna untuk badge notifikasi di UI.
 */
export function getUnreadCount(
  conversationUuid: string,
  workspaceUuid: string,
): number {
  const participant = _getAllParticipants().find(
    (p) =>
      p.conversation_uuid === conversationUuid &&
      p.workspace_uuid === workspaceUuid &&
      p.left_at === null,
  );
  if (!participant) return 0;

  const allMsgs = _getAllMessages()
    .filter(
      (m) =>
        m.conversation_uuid === conversationUuid &&
        m.deleted_at === null &&
        m.sender_workspace_uuid !== workspaceUuid,
    )
    .sort((a, b) => a.sent_at.localeCompare(b.sent_at));

  if (!participant.last_read_message_uuid) return allMsgs.length;

  const lastReadIdx = allMsgs.findIndex(
    (m) => m.message_uuid === participant.last_read_message_uuid,
  );
  return lastReadIdx < 0 ? allMsgs.length : allMsgs.length - lastReadIdx - 1;
}

/**
 * Mengarsipkan percakapan — mengubah status ke Archived.
 * Percakapan Archived tidak bisa menerima pesan baru.
 * Idempotent.
 */
export function archiveConversation(
  conversationUuid: string,
  archivedBy: string = 'System',
): ConversationRecord {
  const conv = _getConvOrThrow(conversationUuid);
  if (conv.conversation_status_reference_uuid === CONVERSATION_STATUS_UUID.Archived) {
    return conv;
  }

  const now = new Date().toISOString();
  const updated: ConversationRecord = {
    ...conv,
    conversation_status_reference_uuid: CONVERSATION_STATUS_UUID.Archived,
    updated_at: now,
    metadata:   { ...conv.metadata, archived_by: archivedBy },
  };
  _replaceConversation(updated);
  return updated;
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

function _getConvOrThrow(uuid: string): ConversationRecord {
  const rec = GLOBAL_CONVERSATION_DB.get(uuid);
  if (!rec) {
    throw new Error(
      `[GlobalConversationService] Percakapan tidak ditemukan: "${uuid}".`,
    );
  }
  return rec;
}

function _getMsgOrThrow(uuid: string): MessageRecord {
  const rec = MESSAGE_DB.get(uuid);
  if (!rec) {
    throw new Error(
      `[GlobalConversationService] Pesan tidak ditemukan: "${uuid}".`,
    );
  }
  return rec;
}

function _assertConvActive(conv: ConversationRecord, caller: string): void {
  if (conv.conversation_status_reference_uuid !== CONVERSATION_STATUS_UUID.Active) {
    const key = _convStatusKey(conv.conversation_status_reference_uuid);
    throw new Error(
      `[GlobalConversationService] ${caller}: percakapan "${conv.conversation_uuid}" ` +
        `dalam status "${key}" — operasi ini hanya bisa dilakukan pada percakapan Active.`,
    );
  }
}

/** Touch updated_at conversation tanpa side-effect lain. */
function _touchConversation(conv: ConversationRecord, now: string): void {
  _replaceConversation({ ...conv, updated_at: now });
}

function _convStatusKey(statusUuid: string): string {
  const entry = Object.entries(CONVERSATION_STATUS_UUID).find(([, v]) => v === statusUuid);
  return entry ? entry[0] : statusUuid;
}
