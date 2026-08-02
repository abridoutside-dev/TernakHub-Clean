// ─── FARM-FIX-005.9 — Transaction Notification Service ────────────────────────
// Application notifications for key transaction lifecycle events.
// Uses globalNotificationData.ts as the backing store.
// All functions are fire-and-forget — never throw on failure.

import {
  _insertNotification,
  _getAllNotifications,
  _replaceNotification,
  NOTIFICATION_STATUS_UUID,
  NOTIFICATION_TYPE_UUID,
  PRIORITY_UUID,
  generateUUID,
  type NotificationRecord,
} from './globalNotificationData';
import { bump } from '../utils/notifSignal';

// ─── Event Types ──────────────────────────────────────────────────────────────

export type TransactionNotificationEvent =
  | 'Deal Locked'
  | 'Transport Accepted'
  | 'Payment Uploaded'
  | 'Payment Verified'
  | 'Trip Started'
  | 'Near Destination'
  | 'Delivered'
  | 'Buyer Confirmed'
  | 'Funds Released'
  | 'Refund Issued'
  | 'Dispute Opened'
  | 'Dispute Closed'
  | 'Transaction Completed'
  | 'Transaction Cancelled'
  | 'Invitation Received'
  | 'Quotation Received'
  | 'Quotation Locked';

// ─── Event Config ─────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<
  TransactionNotificationEvent,
  {
    icon: string;
    title: (ctx: NotifContext) => string;
    message: (ctx: NotifContext) => string;
    priority: typeof PRIORITY_UUID[keyof typeof PRIORITY_UUID];
    typeUuid: typeof NOTIFICATION_TYPE_UUID[keyof typeof NOTIFICATION_TYPE_UUID];
    actionLabel: string | null;
  }
> = {
  'Deal Locked': {
    icon: '🔒',
    title: (ctx) => `Deal Terkunci — ${ctx.transaksiId}`,
    message: (ctx) => `Deal untuk ${ctx.judulListing} telah disetujui kedua pihak dan dikunci. Lanjutkan ke konfigurasi layanan.`,
    priority: PRIORITY_UUID.HIGH,
    typeUuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    actionLabel: 'Lihat Transaksi',
  },
  'Transport Accepted': {
    icon: '🚚',
    title: (ctx) => `Transport Bergabung — ${ctx.transaksiId}`,
    message: (ctx) => `${ctx.actorName} telah menerima penugasan transport untuk ${ctx.judulListing}.`,
    priority: PRIORITY_UUID.NORMAL,
    typeUuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    actionLabel: 'Lihat Transport',
  },
  'Payment Uploaded': {
    icon: '💳',
    title: (ctx) => `Bukti Pembayaran Diunggah — ${ctx.transaksiId}`,
    message: (ctx) => `Buyer mengunggah bukti pembayaran untuk ${ctx.judulListing}. Menunggu verifikasi Escrow.`,
    priority: PRIORITY_UUID.HIGH,
    typeUuid: NOTIFICATION_TYPE_UUID.ESCROW,
    actionLabel: 'Verifikasi',
  },
  'Payment Verified': {
    icon: '✅',
    title: (ctx) => `Pembayaran Dikonfirmasi — ${ctx.transaksiId}`,
    message: (ctx) => `Escrow mengkonfirmasi pembayaran diterima untuk ${ctx.judulListing}. Dana sedang ditahan.`,
    priority: PRIORITY_UUID.HIGH,
    typeUuid: NOTIFICATION_TYPE_UUID.ESCROW,
    actionLabel: 'Lihat Escrow',
  },
  'Trip Started': {
    icon: '🚀',
    title: (ctx) => `Pengiriman Dimulai — ${ctx.transaksiId}`,
    message: (ctx) => `Transport berangkat dari titik penjemputan untuk ${ctx.judulListing}.`,
    priority: PRIORITY_UUID.NORMAL,
    typeUuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    actionLabel: 'Pantau Pengiriman',
  },
  'Near Destination': {
    icon: '📍',
    title: (ctx) => `Mendekati Tujuan — ${ctx.transaksiId}`,
    message: (ctx) => `Kendaraan pengiriman untuk ${ctx.judulListing} mendekati lokasi tujuan.`,
    priority: PRIORITY_UUID.NORMAL,
    typeUuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    actionLabel: 'Lacak Posisi',
  },
  'Delivered': {
    icon: '🏁',
    title: (ctx) => `Barang Tiba — ${ctx.transaksiId}`,
    message: (ctx) => `${ctx.judulListing} telah tiba di lokasi Buyer. Segera konfirmasi penerimaan.`,
    priority: PRIORITY_UUID.HIGH,
    typeUuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    actionLabel: 'Konfirmasi Terima',
  },
  'Buyer Confirmed': {
    icon: '✅',
    title: (ctx) => `Buyer Konfirmasi Terima — ${ctx.transaksiId}`,
    message: (ctx) => `Buyer mengkonfirmasi penerimaan ${ctx.judulListing}. Dana siap dilepaskan ke Seller.`,
    priority: PRIORITY_UUID.HIGH,
    typeUuid: NOTIFICATION_TYPE_UUID.ESCROW,
    actionLabel: 'Lihat Status',
  },
  'Funds Released': {
    icon: '💸',
    title: (ctx) => `Dana Dilepaskan — ${ctx.transaksiId}`,
    message: (ctx) => `Escrow melepaskan dana transaksi ${ctx.judulListing} ke Seller.`,
    priority: PRIORITY_UUID.HIGH,
    typeUuid: NOTIFICATION_TYPE_UUID.ESCROW,
    actionLabel: 'Lihat Detail',
  },
  'Refund Issued': {
    icon: '↩️',
    title: (ctx) => `Pengembalian Dana — ${ctx.transaksiId}`,
    message: (ctx) => `Dana transaksi ${ctx.judulListing} dikembalikan ke Buyer sesuai keputusan sengketa.`,
    priority: PRIORITY_UUID.HIGH,
    typeUuid: NOTIFICATION_TYPE_UUID.ESCROW,
    actionLabel: 'Lihat Detail',
  },
  'Dispute Opened': {
    icon: '⚠️',
    title: (ctx) => `Sengketa Dibuka — ${ctx.transaksiId}`,
    message: (ctx) => `${ctx.actorName} membuka sengketa untuk transaksi ${ctx.judulListing}. Siapkan bukti Anda.`,
    priority: PRIORITY_UUID.CRITICAL,
    typeUuid: NOTIFICATION_TYPE_UUID.ESCROW,
    actionLabel: 'Lihat Sengketa',
  },
  'Dispute Closed': {
    icon: '🔒',
    title: (ctx) => `Sengketa Diselesaikan — ${ctx.transaksiId}`,
    message: (ctx) => `Sengketa untuk transaksi ${ctx.judulListing} telah diselesaikan.`,
    priority: PRIORITY_UUID.HIGH,
    typeUuid: NOTIFICATION_TYPE_UUID.ESCROW,
    actionLabel: 'Lihat Resolusi',
  },
  'Transaction Completed': {
    icon: '🎉',
    title: (ctx) => `Transaksi Selesai — ${ctx.transaksiId}`,
    message: (ctx) => `Transaksi ${ctx.judulListing} berhasil diselesaikan. Lihat receipt untuk dokumentasi lengkap.`,
    priority: PRIORITY_UUID.NORMAL,
    typeUuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    actionLabel: 'Lihat Receipt',
  },
  'Transaction Cancelled': {
    icon: '🚫',
    title: (ctx) => `Transaksi Dibatalkan — ${ctx.transaksiId}`,
    message: (ctx) => `Transaksi ${ctx.judulListing} dibatalkan.`,
    priority: PRIORITY_UUID.NORMAL,
    typeUuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    actionLabel: 'Lihat Transaksi',
  },
  'Invitation Received': {
    icon: '📨',
    title: (ctx) => `Undangan Diterima — ${ctx.transaksiId}`,
    message: (ctx) => `${ctx.actorName} mengundang Anda untuk bergabung dalam transaksi ${ctx.judulListing} sebagai ${ctx.roleLabel}.`,
    priority: PRIORITY_UUID.HIGH,
    typeUuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    actionLabel: 'Lihat Undangan',
  },
  'Quotation Received': {
    icon: '📋',
    title: (ctx) => `Quotasi Baru — ${ctx.transaksiId}`,
    message: (ctx) => `${ctx.actorName} mengajukan quotasi layanan untuk ${ctx.judulListing}.`,
    priority: PRIORITY_UUID.NORMAL,
    typeUuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    actionLabel: 'Tinjau Quotasi',
  },
  'Quotation Locked': {
    icon: '🔒',
    title: (ctx) => `Quotasi Dikunci — ${ctx.transaksiId}`,
    message: (ctx) => `Quotasi layanan untuk ${ctx.judulListing} telah dikunci. Harga final.`,
    priority: PRIORITY_UUID.NORMAL,
    typeUuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
    actionLabel: 'Lihat Detail',
  },
};

// ─── Notification Context ─────────────────────────────────────────────────────

export interface NotifContext {
  transaksiId: string;
  judulListing: string;
  actorName?: string;
  roleLabel?: string;
  extra?: Record<string, string>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRecord(
  event: TransactionNotificationEvent,
  ctx: NotifContext,
  targetWorkspaceUuid: string | null,
  senderWorkspaceUuid: string | null,
): NotificationRecord {
  const cfg = EVENT_CONFIG[event];
  const now = new Date().toISOString();
  return {
    notification_uuid: generateUUID(),
    notification_type_reference_uuid: cfg.typeUuid,
    notification_status_reference_uuid: NOTIFICATION_STATUS_UUID.UNREAD,
    priority_reference_uuid: cfg.priority,
    target_workspace_uuid: targetWorkspaceUuid,
    sender_workspace_uuid: senderWorkspaceUuid,
    reference_module: 'global_transaction',
    reference_uuid: ctx.transaksiId,
    title: cfg.title(ctx),
    message: cfg.message(ctx),
    icon: cfg.icon,
    action_label: cfg.actionLabel,
    action_route: `/marketplace/transaksi/${ctx.transaksiId}`,
    action_params: ctx.extra ?? null,
    is_read: false,
    read_at: null,
    expires_at: null,
    created_at: now,
    updated_at: now,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fire a transaction notification.
 * Targets a specific workspace if provided, or broadcasts (null = all workspaces).
 */
export function fireTransactionNotification(
  event: TransactionNotificationEvent,
  ctx: NotifContext,
  targetWorkspaceUuid: string | null = null,
  senderWorkspaceUuid: string | null = null,
): void {
  try {
    const record = buildRecord(event, ctx, targetWorkspaceUuid, senderWorkspaceUuid);
    _insertNotification(record);
    bump();
  } catch {
    // fire-and-forget — never throw
  }
}

/**
 * Fire a notification to multiple workspaces at once.
 */
export function fireTransactionNotificationToMany(
  event: TransactionNotificationEvent,
  ctx: NotifContext,
  targetWorkspaceUuids: string[],
  senderWorkspaceUuid: string | null = null,
): void {
  for (const targetUuid of targetWorkspaceUuids) {
    fireTransactionNotification(event, ctx, targetUuid, senderWorkspaceUuid);
  }
}

/** Get all unread transaction notifications for a workspace. */
export function getUnreadTransactionNotifications(workspaceId: string): NotificationRecord[] {
  return _getAllNotifications()
    .filter(n =>
      (n.target_workspace_uuid === workspaceId || n.target_workspace_uuid === null) &&
      n.reference_module === 'global_transaction' &&
      !n.is_read,
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Get all transaction notifications for a specific transaksiId. */
export function getNotificationsForTransaksi(transaksiId: string): NotificationRecord[] {
  return _getAllNotifications()
    .filter(n => n.reference_uuid === transaksiId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Get all notifications for a workspace (read + unread, transaction-scoped). */
export function getAllTransactionNotifications(workspaceId: string): NotificationRecord[] {
  return _getAllNotifications()
    .filter(n =>
      (n.target_workspace_uuid === workspaceId || n.target_workspace_uuid === null) &&
      n.reference_module === 'global_transaction',
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Mark a notification as read. */
export function markNotificationRead(notificationUuid: string): void {
  const rec = _getAllNotifications().find(r => r.notification_uuid === notificationUuid);
  if (!rec) return;
  _replaceNotification({
    ...rec,
    is_read: true,
    read_at: new Date().toISOString(),
    notification_status_reference_uuid: NOTIFICATION_STATUS_UUID.READ,
    updated_at: new Date().toISOString(),
  });
  bump();
}

/** Mark all notifications for a workspace as read. */
export function markAllTransactionNotificationsRead(workspaceId: string): void {
  const all = _getAllNotifications();
  let changed = false;
  for (const rec of all) {
    if (rec.target_workspace_uuid === workspaceId && !rec.is_read) {
      _replaceNotification({
        ...rec,
        is_read: true,
        read_at: new Date().toISOString(),
        notification_status_reference_uuid: NOTIFICATION_STATUS_UUID.READ,
        updated_at: new Date().toISOString(),
      });
      changed = true;
    }
  }
  if (changed) bump();
}

/** Count unread for badge display. */
export function getUnreadNotificationCount(workspaceId: string): number {
  return getUnreadTransactionNotifications(workspaceId).length;
}

