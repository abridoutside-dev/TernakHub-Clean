// ─── Global Notification Data — FOUNDATION-GLOBAL-NOTIFICATION-001 ────────────
//
// Single Source of Truth untuk seluruh notifikasi TernakHub.
//
// ATURAN:
//   • Semua modul mengirim notifikasi HANYA melalui globalNotificationService.ts.
//   • Akses langsung ke GLOBAL_NOTIFICATION_DB atau fungsi _* dilarang dari luar.
//   • notification_type, notification_status, priority HARUS menggunakan UUID
//     dari Global Reference Service (NOTIFICATION_TYPE, NOTIFICATION_STATUS, PRIORITY).
//   • UUID bersifat stabil — jangan diregenerasi setelah ditetapkan.
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   reference_module + reference_uuid → Global Transaction / Escrow / Conversation
//                                       / Evidence / Audit Trail / AI Insight
//                                       / Marketplace / Livestock
// ─────────────────────────────────────────────────────────────────────────────

import { generateUUID } from '../utils/uuid';

// ─── UUID Konstanta — Notification Status ────────────────────────────────────
// Stabil — sesuai seed di globalReferenceData.ts.

export const NOTIFICATION_STATUS_UUID = {
  UNREAD:   'a8000001-0000-4000-a000-000000000001',
  READ:     'a8000001-0000-4000-a000-000000000002',
  ARCHIVED: 'a8000001-0000-4000-a000-000000000003',
  DELETED:  'a8000001-0000-4000-a000-000000000004',
} as const;

export type NotificationStatusUuid =
  (typeof NOTIFICATION_STATUS_UUID)[keyof typeof NOTIFICATION_STATUS_UUID];

// ─── UUID Konstanta — Priority ───────────────────────────────────────────────

export const PRIORITY_UUID = {
  LOW:      'a9000001-0000-4000-a000-000000000001',
  NORMAL:   'a9000001-0000-4000-a000-000000000002',
  HIGH:     'a9000001-0000-4000-a000-000000000003',
  CRITICAL: 'a9000001-0000-4000-a000-000000000004',
} as const;

export type PriorityUuid = (typeof PRIORITY_UUID)[keyof typeof PRIORITY_UUID];

// ─── UUID Konstanta — Notification Type ──────────────────────────────────────

export const NOTIFICATION_TYPE_UUID = {
  // Legacy / generic
  INFO:         'f3000001-0000-4000-a000-000000000001',
  WARNING:      'f3000001-0000-4000-a000-000000000002',
  CRITICAL:     'f3000001-0000-4000-a000-000000000003',
  SUCCESS:      'f3000001-0000-4000-a000-000000000004',
  REMINDER:     'f3000001-0000-4000-a000-000000000005',
  TRANSACTION:  'f3000001-0000-4000-a000-000000000006',
  SYSTEM:       'f3000001-0000-4000-a000-000000000007',
  // Foundation-007 additions
  ESCROW:       'f3000001-0000-4000-a000-000000000008',
  MARKETPLACE:  'f3000001-0000-4000-a000-000000000009',
  LIVESTOCK:    'f3000001-0000-4000-a000-000000000010',
  FEED:         'f3000001-0000-4000-a000-000000000011',
  MEDICINE:     'f3000001-0000-4000-a000-000000000012',
  HEALTH:       'f3000001-0000-4000-a000-000000000013',
  AI_INSIGHT:   'f3000001-0000-4000-a000-000000000014',
  VERIFICATION: 'f3000001-0000-4000-a000-000000000015',
  AUDIT:        'f3000001-0000-4000-a000-000000000016',
} as const;

export type NotificationTypeUuid =
  (typeof NOTIFICATION_TYPE_UUID)[keyof typeof NOTIFICATION_TYPE_UUID];

// ─── Reference Module ─────────────────────────────────────────────────────────
// Modul sumber notifikasi. Digunakan bersama reference_uuid untuk deep-link.

export type NotificationReferenceModule =
  | 'global_transaction'
  | 'global_escrow'
  | 'global_conversation'
  | 'global_evidence'
  | 'global_audit_trail'
  | 'ai_insight'
  | 'marketplace'
  | 'livestock'
  | 'batch'
  | 'feed'
  | 'medicine'
  | 'health'
  | 'reproduksi'
  | 'mutation'
  | 'news_event'
  | 'profile'
  | 'system';

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface NotificationRecord {
  /** UUID v4 — primary key. Immutable setelah ditetapkan. */
  notification_uuid: string;

  /**
   * Jenis notifikasi — UUID ke NOTIFICATION_TYPE di Global Reference Service.
   * Gunakan NOTIFICATION_TYPE_UUID untuk referensi stabil.
   */
  notification_type_reference_uuid: string;

  /**
   * Status siklus hidup notifikasi — UUID ke NOTIFICATION_STATUS.
   * Gunakan NOTIFICATION_STATUS_UUID untuk referensi stabil.
   */
  notification_status_reference_uuid: string;

  /**
   * Tingkat prioritas — UUID ke PRIORITY di Global Reference Service.
   * Gunakan PRIORITY_UUID untuk referensi stabil.
   */
  priority_reference_uuid: string;

  /**
   * Workspace penerima notifikasi.
   * null = broadcast ke semua workspace (system-wide).
   */
  target_workspace_uuid: string | null;

  /**
   * Workspace pengirim notifikasi.
   * null = sistem TernakHub sebagai pengirim.
   */
  sender_workspace_uuid: string | null;

  /**
   * Modul asal yang menghasilkan notifikasi.
   * Digunakan bersama reference_uuid untuk navigasi deep-link.
   */
  reference_module: NotificationReferenceModule;

  /**
   * UUID entitas di modul asal.
   * Contoh: transaction_uuid, livestock_id, listing_uuid.
   * null jika notifikasi tidak merujuk entitas spesifik.
   */
  reference_uuid: string | null;

  /** Judul singkat notifikasi — maks 120 karakter. */
  title: string;

  /** Pesan penjelasan notifikasi. */
  message: string;

  /**
   * Emoji atau nama ikon untuk tampilan notifikasi.
   * Contoh: '🐄', '💊', '🛒', 'bell', 'alert'.
   * null = gunakan ikon default berdasarkan notification_type.
   */
  icon: string | null;

  /**
   * Label tombol aksi (CTA).
   * Contoh: 'Lihat Transaksi', 'Periksa Sekarang'.
   * null = tidak ada aksi.
   */
  action_label: string | null;

  /**
   * Route tujuan saat aksi diklik.
   * Contoh: '/marketplace/transaksi/uuid-xxx'.
   * null = tidak ada navigasi.
   */
  action_route: string | null;

  /**
   * Parameter tambahan untuk action_route dalam format JSON-serializable.
   * Contoh: { tab: 'escrow', filter: 'active' }.
   * null = tidak ada parameter tambahan.
   */
  action_params: Record<string, unknown> | null;

  /** true jika penerima sudah membaca notifikasi. */
  is_read: boolean;

  /** Timestamp ISO 8601 saat notifikasi dibaca. null jika belum dibaca. */
  read_at: string | null;

  /**
   * Timestamp ISO 8601 saat notifikasi kedaluwarsa.
   * null = tidak ada kedaluwarsa (permanen sampai dihapus/diarsipkan).
   */
  expires_at: string | null;

  /** Timestamp ISO 8601 saat notifikasi dibuat. */
  created_at: string;

  /** Timestamp ISO 8601 saat notifikasi terakhir diperbarui. */
  updated_at: string;
}

// ─── Input untuk createNotification ──────────────────────────────────────────

export interface CreateNotificationInput {
  notification_type_reference_uuid: string;
  priority_reference_uuid?: string;
  target_workspace_uuid?: string | null;
  sender_workspace_uuid?: string | null;
  reference_module: NotificationReferenceModule;
  reference_uuid?: string | null;
  title: string;
  message: string;
  icon?: string | null;
  action_label?: string | null;
  action_route?: string | null;
  action_params?: Record<string, unknown> | null;
  expires_at?: string | null;
}

// ─── Filter untuk getNotifications ───────────────────────────────────────────

export interface GetNotificationsFilter {
  /** Filter berdasarkan target_workspace_uuid. */
  target_workspace_uuid?: string;
  /** Filter berdasarkan notification_type_reference_uuid. */
  notification_type_reference_uuid?: string;
  /** Filter berdasarkan priority_reference_uuid. */
  priority_reference_uuid?: string;
  /** Filter berdasarkan reference_module. */
  reference_module?: NotificationReferenceModule;
  /** Jika true, hanya notifikasi yang belum dibaca. */
  unread_only?: boolean;
  /** Jika false, sertakan notifikasi archived dan deleted. Default: true. */
  active_only?: boolean;
  /** Maksimum jumlah record yang dikembalikan. Default: tidak terbatas. */
  limit?: number;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────
// INTERNAL — akses hanya melalui globalNotificationService.ts.

export const GLOBAL_NOTIFICATION_DB: Map<string, NotificationRecord> = new Map();

// ─── Internal Helpers (package-private) ───────────────────────────────────────

export function _insertNotification(record: NotificationRecord): void {
  GLOBAL_NOTIFICATION_DB.set(record.notification_uuid, record);
}

export function _getAllNotifications(): NotificationRecord[] {
  return Array.from(GLOBAL_NOTIFICATION_DB.values());
}

export function _replaceNotification(record: NotificationRecord): void {
  GLOBAL_NOTIFICATION_DB.set(record.notification_uuid, record);
}

// Re-export generateUUID agar service layer tidak import dari utils langsung.
export { generateUUID };
