// ─── PROFILE-005 — Transaction Conversation Foundation ────────────────────────
// Conversation berbasis transaksi. Mengacu pada:
//   docs/architecture/TRANSACTION_CONVERSATION_CONSTITUTION.md
//
// Aturan utama:
//  - Conversation HANYA ada dalam konteks transaksi aktif.
//  - Participant bergabung berdasarkan peran, bukan hardcode Buyer ↔ Seller.
//  - Chat ≠ Evidence (Evidence diimplementasikan di fase berikutnya).
//  - Escrow, Transport, Veterinarian: arsitektur siap, belum diaktifkan di Foundation.
//  - Audit Trail: TIDAK diimplementasikan di Foundation ini.

import { generateUUID } from '../utils/uuid';
import {
  getTransaksiById,
  getAllTransaksi,
  type TransaksiStatus,
} from './marketplaceTransaksiData';
import { WORKSPACES } from '../components/TopAppBar';

// ─── Tipe ─────────────────────────────────────────────────────────────────────

export type ParticipantRole =
  | 'Buyer'
  | 'Seller'
  | 'Escrow'
  | 'Transport'
  | 'Veterinarian';

export type ConversationMessageTipe = 'Teks' | 'Gambar' | 'File';

export type ConversationMessageStatus =
  | 'Sending'
  | 'Sent'
  | 'Delivered'
  | 'Read';

export type SettlementMethod = 'P2P' | 'Escrow';

// ─── Participant ──────────────────────────────────────────────────────────────

export interface ConversationParticipant {
  /** UUID v4 */
  id: string;
  conversationId: string;
  role: ParticipantRole;
  workspaceId: string;
  workspaceNama: string;
  workspaceIcon: string;
  /** ISO datetime bergabung */
  joinedAt: string;
  isActive: boolean;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  /** Format: MSG-{uuid} */
  id: string;
  conversationId: string;
  fromWorkspaceId: string;
  fromRole: ParticipantRole;
  tipe: ConversationMessageTipe;
  /** Isi teks, emoji (Gambar), atau nama file (File) */
  konten: string;
  /** Hanya untuk tipe File */
  fileName?: string;
  fileSize?: string;
  /** ISO datetime */
  timestamp: string;
  status: ConversationMessageStatus;
}

// ─── Conversation Room ────────────────────────────────────────────────────────

export interface ConversationRoom {
  /** Format: CONV-{uuid} */
  id: string;
  transaksiId: string;
  judulListing: string;
  thumbnailListing: string;
  kategoriSlug: string;
  // Buyer
  workspaceIdBuyer: string;
  workspaceNamaBuyer: string;
  workspaceIconBuyer: string;
  // Seller
  workspaceIdSeller: string;
  workspaceNamaSeller: string;
  workspaceIconSeller: string;
  // Konteks transaksi
  nilaiTransaksi: number;
  satuanHarga: string;
  qty: number;
  transaksiStatus: TransaksiStatus;
  settlementMethod: SettlementMethod;
  // Meta
  createdAt: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadBuyer: number;
  unreadSeller: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function nowMinus(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function getWorkspaceInfo(id: string): { nama: string; icon: string } {
  const ws = WORKSPACES.find((w) => w.id === id);
  return { nama: ws?.name ?? id, icon: ws?.icon ?? '🏪' };
}

function makeMessage(
  conversationId: string,
  fromWorkspaceId: string,
  fromRole: ParticipantRole,
  tipe: ConversationMessageTipe,
  konten: string,
  minsAgo: number,
  status: ConversationMessageStatus,
  fileName?: string,
  fileSize?: string,
): ConversationMessage {
  return {
    id: `MSG-${generateUUID()}`,
    conversationId,
    fromWorkspaceId,
    fromRole,
    tipe,
    konten,
    fileName,
    fileSize,
    timestamp: nowMinus(minsAgo),
    status,
  };
}

function makeParticipant(
  conversationId: string,
  role: ParticipantRole,
  workspaceId: string,
  joinedAt: string,
): ConversationParticipant {
  const ws = getWorkspaceInfo(workspaceId);
  return {
    id: generateUUID(),
    conversationId,
    role,
    workspaceId,
    workspaceNama: ws.nama,
    workspaceIcon: ws.icon,
    joinedAt,
    isActive: true,
  };
}

// ─── In-memory Store ──────────────────────────────────────────────────────────

let CONVERSATION_ROOMS: ConversationRoom[] = [];
let CONVERSATION_PARTICIPANTS: ConversationParticipant[] = [];
let CONVERSATION_MESSAGES: ConversationMessage[] = [];
let _seeded = false;

// ─── Seed Data ────────────────────────────────────────────────────────────────

function seedIfNeeded(): void {
  if (_seeded) return;
  _seeded = true;

  // Seed conversation untuk 4 transaksi aktif yang diketahui
  const SEED_IDS = [
    'TRX-20260711-001',
    'TRX-20260711-002',
    'TRX-20260712-004',
    'TRX-20260712-005',
  ];

  for (const transaksiId of SEED_IDS) {
    const trx = getTransaksiById(transaksiId);
    if (!trx) continue;

    const convId = `CONV-${generateUUID()}`;
    const buyer = getWorkspaceInfo(trx.workspaceIdPembeli);
    const seller = getWorkspaceInfo(trx.workspaceIdPenjual);
    const createdAt = nowMinus(120 + SEED_IDS.indexOf(transaksiId) * 30);

    // Room
    const room: ConversationRoom = {
      id: convId,
      transaksiId,
      judulListing: trx.judulListing,
      thumbnailListing: trx.thumbnailListing,
      kategoriSlug: trx.kategoriSlug,
      workspaceIdBuyer: trx.workspaceIdPembeli,
      workspaceNamaBuyer: buyer.nama,
      workspaceIconBuyer: buyer.icon,
      workspaceIdSeller: trx.workspaceIdPenjual,
      workspaceNamaSeller: seller.nama,
      workspaceIconSeller: seller.icon,
      nilaiTransaksi: trx.total,
      satuanHarga: trx.satuanHarga,
      qty: trx.qty,
      transaksiStatus: trx.status,
      settlementMethod: 'P2P',
      createdAt,
      lastMessageAt: createdAt,
      lastMessagePreview: '',
      unreadBuyer: 0,
      unreadSeller: 0,
    };

    // Participants
    CONVERSATION_PARTICIPANTS.push(
      makeParticipant(convId, 'Buyer',  trx.workspaceIdPembeli, createdAt),
      makeParticipant(convId, 'Seller', trx.workspaceIdPenjual, createdAt),
    );

    // Seed messages per transaksi
    const msgs: ConversationMessage[] = [];

    if (transaksiId === 'TRX-20260711-001') {
      msgs.push(
        makeMessage(convId, trx.workspaceIdPembeli, 'Buyer',  'Teks', 'Halo, saya tertarik dengan listing ini. Masih tersedia?', 110, 'Read'),
        makeMessage(convId, trx.workspaceIdPenjual, 'Seller', 'Teks', 'Halo! Masih tersedia. Kami sedang meninjau pesanan Anda.', 105, 'Read'),
        makeMessage(convId, trx.workspaceIdPembeli, 'Buyer',  'Teks', 'Baik, terima kasih. Ditunggu konfirmasinya ya.', 100, 'Delivered'),
      );
    } else if (transaksiId === 'TRX-20260711-002') {
      msgs.push(
        makeMessage(convId, trx.workspaceIdPembeli, 'Buyer',  'Teks', 'Pesanan sudah disetujui. Kapan bisa diproses pembayarannya?', 90, 'Read'),
        makeMessage(convId, trx.workspaceIdPenjual, 'Seller', 'Teks', 'Terima kasih atas kepercayaannya. Mohon selesaikan pembayaran untuk melanjutkan.', 85, 'Read'),
        makeMessage(convId, trx.workspaceIdPembeli, 'Buyer',  'Gambar', '💳', 80, 'Read'),
        makeMessage(convId, trx.workspaceIdPembeli, 'Buyer',  'Teks', 'Siap, akan segera saya proses. Rekening tujuan transfer ke mana?', 78, 'Delivered'),
        makeMessage(convId, trx.workspaceIdPenjual, 'Seller', 'Teks', 'Akan kami kirimkan info rekening via pesan selanjutnya.', 70, 'Sent'),
      );
    } else if (transaksiId === 'TRX-20260712-004') {
      msgs.push(
        makeMessage(convId, trx.workspaceIdPembeli, 'Buyer',  'Teks', 'Pembayaran sudah saya transfer ke rekening yang diberikan.', 60, 'Read'),
        makeMessage(convId, trx.workspaceIdPenjual, 'Seller', 'Teks', 'Pembayaran dikonfirmasi. Pesanan sedang diproses.', 55, 'Read'),
        makeMessage(convId, trx.workspaceIdPembeli, 'Buyer',  'Teks', 'Terima kasih. Estimasi pengiriman berapa hari?', 50, 'Read'),
        makeMessage(convId, trx.workspaceIdPenjual, 'Seller', 'Teks', 'Estimasi 2–3 hari kerja. Nomor resi akan kami berikan segera setelah barang dikirim.', 45, 'Read'),
        makeMessage(convId, trx.workspaceIdPembeli, 'Buyer',  'Teks', 'Siap, ditunggu ya. Mohon infokan jika sudah dikirim.', 40, 'Delivered'),
      );
    } else if (transaksiId === 'TRX-20260712-005') {
      msgs.push(
        makeMessage(convId, trx.workspaceIdPenjual, 'Seller', 'Teks', 'Layanan sudah siap diserahkan. Mohon konfirmasi jadwal penjemputan.', 30, 'Read'),
        makeMessage(convId, trx.workspaceIdPembeli, 'Buyer',  'Teks', 'Siap. Saya akan datang besok pagi sekitar pukul 08.00.', 25, 'Read'),
        makeMessage(convId, trx.workspaceIdPenjual, 'Seller', 'Teks', 'Baik, kami siapkan. Sampai jumpa besok.', 20, 'Delivered'),
      );
    }

    CONVERSATION_MESSAGES.push(...msgs);

    // Update room last message
    const last = msgs[msgs.length - 1];
    if (last) {
      room.lastMessageAt = last.timestamp;
      room.lastMessagePreview = last.tipe === 'Teks' ? last.konten.slice(0, 60) : `[${last.tipe}]`;
      // Simulasi unread untuk Buyer
      if (transaksiId === 'TRX-20260712-005') room.unreadBuyer = 0;
    }

    CONVERSATION_ROOMS.push(room);
  }
}

// ─── Fungsi Publik ────────────────────────────────────────────────────────────

/**
 * Mendapatkan atau membuat Conversation untuk transaksiId.
 * Idempotent: memanggil berulang kali menghasilkan room yang sama.
 */
export function getOrCreateConversation(transaksiId: string): ConversationRoom | null {
  seedIfNeeded();

  // Sudah ada?
  const existing = CONVERSATION_ROOMS.find((r) => r.transaksiId === transaksiId);
  if (existing) return existing;

  // Buat baru dari transaksi
  const trx = getTransaksiById(transaksiId);
  if (!trx) return null;

  const convId = `CONV-${generateUUID()}`;
  const buyer  = getWorkspaceInfo(trx.workspaceIdPembeli);
  const seller = getWorkspaceInfo(trx.workspaceIdPenjual);
  const now    = new Date().toISOString();

  const room: ConversationRoom = {
    id: convId,
    transaksiId,
    judulListing:      trx.judulListing,
    thumbnailListing:  trx.thumbnailListing,
    kategoriSlug:      trx.kategoriSlug,
    workspaceIdBuyer:  trx.workspaceIdPembeli,
    workspaceNamaBuyer: buyer.nama,
    workspaceIconBuyer: buyer.icon,
    workspaceIdSeller: trx.workspaceIdPenjual,
    workspaceNamaSeller: seller.nama,
    workspaceIconSeller: seller.icon,
    nilaiTransaksi:    trx.total,
    satuanHarga:       trx.satuanHarga,
    qty:               trx.qty,
    transaksiStatus:   trx.status,
    settlementMethod:  'P2P',
    createdAt:         now,
    lastMessageAt:     now,
    lastMessagePreview: '',
    unreadBuyer:  0,
    unreadSeller: 0,
  };

  CONVERSATION_ROOMS.push(room);

  // Tambah Participant Buyer + Seller
  CONVERSATION_PARTICIPANTS.push(
    makeParticipant(convId, 'Buyer',  trx.workspaceIdPembeli, now),
    makeParticipant(convId, 'Seller', trx.workspaceIdPenjual, now),
  );

  return room;
}

export function getConversationById(id: string): ConversationRoom | undefined {
  seedIfNeeded();
  return CONVERSATION_ROOMS.find((r) => r.id === id);
}

export function getConversationByTransaksiId(transaksiId: string): ConversationRoom | undefined {
  seedIfNeeded();
  return CONVERSATION_ROOMS.find((r) => r.transaksiId === transaksiId);
}

export function getAllConversations(): ConversationRoom[] {
  seedIfNeeded();
  return [...CONVERSATION_ROOMS];
}

// ─── Participant ──────────────────────────────────────────────────────────────

export function getConversationParticipants(conversationId: string): ConversationParticipant[] {
  seedIfNeeded();
  return CONVERSATION_PARTICIPANTS.filter((p) => p.conversationId === conversationId);
}

/**
 * Menambah Participant (Escrow / Transport / Veterinarian).
 * Idempotent per (conversationId + role + workspaceId).
 */
export function addParticipant(
  conversationId: string,
  role: ParticipantRole,
  workspaceId: string,
): ConversationParticipant {
  seedIfNeeded();
  const existing = CONVERSATION_PARTICIPANTS.find(
    (p) => p.conversationId === conversationId && p.role === role && p.workspaceId === workspaceId,
  );
  if (existing) return existing;

  const p = makeParticipant(conversationId, role, workspaceId, new Date().toISOString());
  CONVERSATION_PARTICIPANTS.push(p);
  return p;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export function getConversationMessages(conversationId: string): ConversationMessage[] {
  seedIfNeeded();
  return CONVERSATION_MESSAGES
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * Mengirim pesan baru ke Conversation.
 * fromWorkspaceId menentukan fromRole secara otomatis dari Participant list.
 */
export function sendConversationMessage(
  conversationId: string,
  fromWorkspaceId: string,
  tipe: ConversationMessageTipe,
  konten: string,
  fileName?: string,
  fileSize?: string,
): ConversationMessage | null {
  seedIfNeeded();

  const room = CONVERSATION_ROOMS.find((r) => r.id === conversationId);
  if (!room) return null;

  // Cari role pengirim dari Participant list
  const participant = CONVERSATION_PARTICIPANTS.find(
    (p) => p.conversationId === conversationId && p.workspaceId === fromWorkspaceId && p.isActive,
  );
  const fromRole: ParticipantRole = participant?.role ?? 'Buyer';

  const now = new Date().toISOString();
  const msg: ConversationMessage = {
    id: `MSG-${generateUUID()}`,
    conversationId,
    fromWorkspaceId,
    fromRole,
    tipe,
    konten,
    fileName,
    fileSize,
    timestamp: now,
    status: 'Sent',
  };

  CONVERSATION_MESSAGES.push(msg);

  // Update room metadata
  room.lastMessageAt      = now;
  room.lastMessagePreview = tipe === 'Teks' ? konten.slice(0, 60) : `[${tipe}]`;

  // Increment unread untuk pihak lain
  if (fromWorkspaceId === room.workspaceIdBuyer) {
    room.unreadSeller += 1;
  } else {
    room.unreadBuyer += 1;
  }

  return msg;
}

/**
 * Tandai semua pesan sebagai Read untuk workspaceId tertentu.
 */
export function markConversationAsRead(conversationId: string, workspaceId: string): void {
  seedIfNeeded();

  const room = CONVERSATION_ROOMS.find((r) => r.id === conversationId);
  if (!room) return;

  // Reset unread counter
  if (workspaceId === room.workspaceIdBuyer)  room.unreadBuyer  = 0;
  if (workspaceId === room.workspaceIdSeller) room.unreadSeller = 0;

  // Update status pesan yang diterima oleh workspaceId ini
  CONVERSATION_MESSAGES
    .filter((m) => m.conversationId === conversationId && m.fromWorkspaceId !== workspaceId)
    .forEach((m) => { m.status = 'Read'; });
}

/**
 * Cari pesan berdasarkan isi atau nama pengirim.
 */
export function searchConversationMessages(
  conversationId: string,
  query: string,
): ConversationMessage[] {
  seedIfNeeded();
  if (!query.trim()) return getConversationMessages(conversationId);

  const q = query.toLowerCase();
  const participants = getConversationParticipants(conversationId);

  return getConversationMessages(conversationId).filter((msg) => {
    if (msg.konten.toLowerCase().includes(q)) return true;
    if (msg.fileName?.toLowerCase().includes(q)) return true;
    const sender = participants.find((p) => p.workspaceId === msg.fromWorkspaceId);
    if (sender?.workspaceNama.toLowerCase().includes(q)) return true;
    if (msg.fromRole.toLowerCase().includes(q)) return true;
    return false;
  });
}
