// ─── MPK-011 — Chat Marketplace ───────────────────────────────────────────────
// Komunikasi antara Pembeli dan Penjual melalui Listing.
//
// Aturan utama:
//  - Satu Chat untuk satu Listing dan satu Pembeli (workspaceIdPembeli).
//  - Chat TIDAK bisa dibuat tanpa Listing.
//  - Hanya Pembeli dan Penjual yang terkait dapat masuk ke Chat.
//    Workspace lain dilarang bergabung.
//  - Chat tetap aktif meski sudah ada Negosiasi atau Transaksi.
//  - Tidak ada Group Chat, Feed, Story, atau Komentar.

import { generateUUID } from '../utils/uuid';
import { getAllListing } from './marketplaceListingData';

// ─── Tipe Pesan ───────────────────────────────────────────────────────────────

export type ChatMessageTipe = 'Teks' | 'Gambar';

export type ChatMessageStatus = 'Terkirim' | 'Diterima' | 'Dibaca';

export interface ChatMessage {
  id: string;
  chatId: string;
  fromWorkspaceId: string;
  tipe: ChatMessageTipe;
  /** Konten teks, atau URL / emoji gambar bila tipe === 'Gambar'. */
  konten: string;
  timestamp: string;
  status: ChatMessageStatus;
}

// ─── Tipe Ruang Chat ──────────────────────────────────────────────────────────

export interface ChatRoom {
  /** Format: CHAT-{uuid} */
  id: string;
  /** Wajib ada — Chat tidak boleh ada tanpa Listing. */
  listingUuid: string;
  workspaceIdPenjual: string;
  workspaceIdPembeli: string;
  /** Referensi transaksi bila sudah ada. */
  transaksiId?: string;
  /** Referensi negosiasi bila sudah ada. */
  negosiasiId?: string;
  createdAt: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  /** Pesan belum dibaca untuk Pembeli. */
  unreadPembeli: number;
  /** Pesan belum dibaca untuk Penjual. */
  unreadPenjual: number;
}

// ─── Notifikasi (struktur siap, push notification belum diimplementasikan) ────

export type NotifikasiChatTipe = 'PesanBaru' | 'PesanDibaca';

export interface NotifikasiChat {
  id: string;
  chatId: string;
  tipe: NotifikasiChatTipe;
  fromWorkspaceId: string;
  /** Workspace tujuan notifikasi. */
  targetWorkspaceId: string;
  timestamp: string;
  dibaca: boolean;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

let CHAT_ROOMS: ChatRoom[] = [];
let CHAT_MESSAGES: ChatMessage[] = [];
let NOTIFIKASI_CHAT: NotifikasiChat[] = [];
let _seeded = false;

// ─── Helper ───────────────────────────────────────────────────────────────────

function nowMinus(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function makeMessage(
  chatId: string,
  fromWorkspaceId: string,
  tipe: ChatMessageTipe,
  konten: string,
  minsAgo: number,
  status: ChatMessageStatus,
): ChatMessage {
  return {
    id: `MSG-${generateUUID()}`,
    chatId,
    fromWorkspaceId,
    tipe,
    konten,
    timestamp: nowMinus(minsAgo),
    status,
  };
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
// Menggunakan listing dari getAllListing() agar UUID konsisten meski UUID
// di-generate runtime. Seed hanya dipanggil sekali (lazy, saat pertama akses).

function seedIfNeeded(): void {
  if (_seeded) return;
  _seeded = true;

  const listings = getAllListing().filter(l => l.status === 'Aktif');
  if (listings.length === 0) return;

  // ── Chat 1: Pembeli w2 → Penjual w1 (listing milik w1) ────────────────────
  const l1 = listings.find(l => l.workspaceId === 'w1');
  if (l1) {
    const chatId1 = 'CHAT-seed-0001';
    const msgs1: ChatMessage[] = [
      makeMessage(chatId1, 'w2', 'Teks', 'Halo, apakah stok masih tersedia?', 90, 'Dibaca'),
      makeMessage(chatId1, 'w1', 'Teks', 'Halo! Ya, masih tersedia. Ada yang bisa kami bantu?', 85, 'Dibaca'),
      makeMessage(chatId1, 'w2', 'Teks', 'Berapa harga minimalnya kalau ambil dalam jumlah banyak?', 80, 'Dibaca'),
      makeMessage(chatId1, 'w1', 'Teks', 'Untuk pembelian ≥ 10 unit bisa negosiasi harga. Silakan ajukan penawaran lewat fitur Negosiasi.', 75, 'Dibaca'),
      makeMessage(chatId1, 'w2', 'Teks', 'Baik, terima kasih informasinya. Saya akan pertimbangkan dulu.', 70, 'Dibaca'),
    ];
    const last1 = msgs1[msgs1.length - 1];
    CHAT_ROOMS.push({
      id: chatId1,
      listingUuid: l1.uuid,
      workspaceIdPenjual: 'w1',
      workspaceIdPembeli: 'w2',
      createdAt: nowMinus(95),
      lastMessageAt: last1.timestamp,
      lastMessagePreview: last1.konten.slice(0, 60),
      unreadPembeli: 0,
      unreadPenjual: 0,
    });
    CHAT_MESSAGES.push(...msgs1);
  }

  // ── Chat 2: Pembeli w1 → Penjual w3 (listing milik w3) ────────────────────
  const l2 = listings.find(l => l.workspaceId === 'w3');
  if (l2) {
    const chatId2 = 'CHAT-seed-0002';
    const msgs2: ChatMessage[] = [
      makeMessage(chatId2, 'w1', 'Teks', 'Selamat siang, produk ini masih ready?', 45, 'Dibaca'),
      makeMessage(chatId2, 'w3', 'Teks', 'Selamat siang! Masih ready. Lokasi pengambilan di Garut.', 40, 'Dibaca'),
      makeMessage(chatId2, 'w1', 'Teks', 'Bisa kirim ke Tasikmalaya?', 35, 'Dibaca'),
      makeMessage(chatId2, 'w3', 'Teks', 'Bisa, ongkir ditanggung pembeli. Estimasi 1 hari.', 30, 'Diterima'),
      makeMessage(chatId2, 'w1', 'Teks', 'Oke siap, saya mau pesan. Bagaimana prosedur pembayarannya?', 10, 'Terkirim'),
    ];
    const last2 = msgs2[msgs2.length - 1];
    CHAT_ROOMS.push({
      id: chatId2,
      listingUuid: l2.uuid,
      workspaceIdPenjual: 'w3',
      workspaceIdPembeli: 'w1',
      createdAt: nowMinus(50),
      lastMessageAt: last2.timestamp,
      lastMessagePreview: last2.konten.slice(0, 60),
      unreadPembeli: 0,
      unreadPenjual: 2,
    });
    CHAT_MESSAGES.push(...msgs2);
  }

  // ── Chat 3: Pembeli w1 → Penjual w2 (listing milik w2) ────────────────────
  const l3 = listings.find(l => l.workspaceId === 'w2');
  if (l3) {
    const chatId3 = 'CHAT-seed-0003';
    const msgs3: ChatMessage[] = [
      makeMessage(chatId3, 'w1', 'Teks', 'Halo, apakah ada garansi untuk produk ini?', 200, 'Dibaca'),
      makeMessage(chatId3, 'w2', 'Teks', 'Ada garansi kualitas 3 hari sejak penerimaan barang.', 195, 'Dibaca'),
      makeMessage(chatId3, 'w1', 'Gambar', '🐑', 190, 'Dibaca'),
      makeMessage(chatId3, 'w1', 'Teks', 'Ini foto ternak yang saya maksud. Apakah kondisi serupa?', 188, 'Dibaca'),
      makeMessage(chatId3, 'w2', 'Teks', 'Ya, kondisi serupa. Kami jaga kualitas dengan standar yang ketat.', 180, 'Dibaca'),
    ];
    const last3 = msgs3[msgs3.length - 1];
    CHAT_ROOMS.push({
      id: chatId3,
      listingUuid: l3.uuid,
      workspaceIdPenjual: 'w2',
      workspaceIdPembeli: 'w1',
      createdAt: nowMinus(210),
      lastMessageAt: last3.timestamp,
      lastMessagePreview: last3.konten.slice(0, 60),
      unreadPembeli: 0,
      unreadPenjual: 0,
    });
    CHAT_MESSAGES.push(...msgs3);
  }
}

// ─── Getter ───────────────────────────────────────────────────────────────────

/** Semua ruang chat yang melibatkan workspaceId (sebagai penjual atau pembeli). */
export function getChatRoomsByWorkspace(workspaceId: string): ChatRoom[] {
  seedIfNeeded();
  return CHAT_ROOMS
    .filter(r => r.workspaceIdPenjual === workspaceId || r.workspaceIdPembeli === workspaceId)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

/** Satu ruang chat berdasarkan id. */
export function getChatRoomById(id: string): ChatRoom | undefined {
  seedIfNeeded();
  return CHAT_ROOMS.find(r => r.id === id);
}

/**
 * Cari ruang chat berdasarkan listing + pembeli.
 * Dipakai saat "Hubungi Penjual" — satu ruang per (listing, pembeli).
 */
export function getChatRoomByListingAndPembeli(
  listingUuid: string,
  workspaceIdPembeli: string,
): ChatRoom | undefined {
  seedIfNeeded();
  return CHAT_ROOMS.find(
    r => r.listingUuid === listingUuid && r.workspaceIdPembeli === workspaceIdPembeli,
  );
}

/** Semua pesan dalam satu ruang chat, urut timestamp ASC. */
export function getChatMessages(chatId: string): ChatMessage[] {
  seedIfNeeded();
  return CHAT_MESSAGES
    .filter(m => m.chatId === chatId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/** Total pesan belum dibaca untuk workspace tertentu di semua chat-nya. */
export function getTotalUnread(workspaceId: string): number {
  seedIfNeeded();
  return CHAT_ROOMS.reduce((sum, r) => {
    if (r.workspaceIdPembeli === workspaceId) return sum + r.unreadPembeli;
    if (r.workspaceIdPenjual === workspaceId) return sum + r.unreadPenjual;
    return sum;
  }, 0);
}

// ─── Mutasi ───────────────────────────────────────────────────────────────────

/**
 * Buat ruang chat baru.
 * Validasi: listingUuid, workspaceIdPenjual, workspaceIdPembeli wajib ada.
 * Pembeli tidak boleh sama dengan Penjual.
 */
export function createChatRoom(input: {
  listingUuid: string;
  workspaceIdPenjual: string;
  workspaceIdPembeli: string;
  transaksiId?: string;
  negosiasiId?: string;
}): ChatRoom {
  seedIfNeeded();

  if (!input.listingUuid) throw new Error('Chat harus memiliki Listing UUID.');
  if (!input.workspaceIdPenjual) throw new Error('Chat harus memiliki Workspace Penjual.');
  if (!input.workspaceIdPembeli) throw new Error('Chat harus memiliki Workspace Pembeli.');
  if (input.workspaceIdPenjual === input.workspaceIdPembeli) {
    throw new Error('Pembeli dan Penjual tidak boleh workspace yang sama.');
  }

  const now = new Date().toISOString();
  const room: ChatRoom = {
    id: `CHAT-${generateUUID()}`,
    listingUuid: input.listingUuid,
    workspaceIdPenjual: input.workspaceIdPenjual,
    workspaceIdPembeli: input.workspaceIdPembeli,
    transaksiId: input.transaksiId,
    negosiasiId: input.negosiasiId,
    createdAt: now,
    lastMessageAt: now,
    lastMessagePreview: '',
    unreadPembeli: 0,
    unreadPenjual: 0,
  };
  CHAT_ROOMS.push(room);
  return room;
}

/**
 * Buka atau buat ruang chat berdasarkan listing + pembeli.
 * Digunakan oleh tombol "Hubungi Penjual" di Detail Listing.
 */
export function getOrCreateChat(input: {
  listingUuid: string;
  workspaceIdPenjual: string;
  workspaceIdPembeli: string;
}): ChatRoom {
  const existing = getChatRoomByListingAndPembeli(input.listingUuid, input.workspaceIdPembeli);
  if (existing) return existing;
  return createChatRoom(input);
}

/**
 * Kirim pesan ke ruang chat.
 * Validasi: pengirim harus Pembeli atau Penjual dari chat tersebut.
 */
export function sendMessage(input: {
  chatId: string;
  fromWorkspaceId: string;
  tipe: ChatMessageTipe;
  konten: string;
}): ChatMessage {
  seedIfNeeded();

  const room = CHAT_ROOMS.find(r => r.id === input.chatId);
  if (!room) throw new Error('Ruang chat tidak ditemukan.');

  if (
    input.fromWorkspaceId !== room.workspaceIdPenjual &&
    input.fromWorkspaceId !== room.workspaceIdPembeli
  ) {
    throw new Error('Workspace tidak berhak mengirim pesan di chat ini.');
  }

  const konten = input.konten.trim();
  if (!konten) throw new Error('Pesan tidak boleh kosong.');

  const now = new Date().toISOString();
  const msg: ChatMessage = {
    id: `MSG-${generateUUID()}`,
    chatId: input.chatId,
    fromWorkspaceId: input.fromWorkspaceId,
    tipe: input.tipe,
    konten,
    timestamp: now,
    status: 'Terkirim',
  };
  CHAT_MESSAGES.push(msg);

  // Update room
  room.lastMessageAt = now;
  room.lastMessagePreview = konten.slice(0, 60);
  if (input.fromWorkspaceId === room.workspaceIdPembeli) {
    room.unreadPenjual += 1;
  } else {
    room.unreadPembeli += 1;
  }

  // Antrian notifikasi (struktur siap, push belum diimplementasikan)
  const target =
    input.fromWorkspaceId === room.workspaceIdPembeli
      ? room.workspaceIdPenjual
      : room.workspaceIdPembeli;
  NOTIFIKASI_CHAT.push({
    id: `NOTIF-${generateUUID()}`,
    chatId: input.chatId,
    tipe: 'PesanBaru',
    fromWorkspaceId: input.fromWorkspaceId,
    targetWorkspaceId: target,
    timestamp: now,
    dibaca: false,
  });

  return msg;
}

/**
 * Tandai semua pesan di chat sebagai Dibaca untuk workspace tertentu.
 * Juga mereset counter unread.
 */
export function markChatAsRead(chatId: string, workspaceId: string): void {
  seedIfNeeded();

  const room = CHAT_ROOMS.find(r => r.id === chatId);
  if (!room) return;

  // Tandai pesan dari lawan bicara sebagai Dibaca
  const lawan =
    workspaceId === room.workspaceIdPembeli
      ? room.workspaceIdPenjual
      : room.workspaceIdPembeli;

  CHAT_MESSAGES
    .filter(m => m.chatId === chatId && m.fromWorkspaceId === lawan && m.status !== 'Dibaca')
    .forEach(m => {
      m.status = 'Dibaca';

      // Notifikasi PesanDibaca (struktur)
      NOTIFIKASI_CHAT.push({
        id: `NOTIF-${generateUUID()}`,
        chatId,
        tipe: 'PesanDibaca',
        fromWorkspaceId: workspaceId,
        targetWorkspaceId: lawan,
        timestamp: new Date().toISOString(),
        dibaca: false,
      });
    });

  // Reset unread counter
  if (workspaceId === room.workspaceIdPembeli) room.unreadPembeli = 0;
  if (workspaceId === room.workspaceIdPenjual) room.unreadPenjual = 0;
}

/** Semua notifikasi (untuk debugging / admin). */
export function getAllNotifikasiChat(): NotifikasiChat[] {
  seedIfNeeded();
  return [...NOTIFIKASI_CHAT];
}
