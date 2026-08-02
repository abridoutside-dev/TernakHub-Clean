// ─── Global Notification Service — DB-001B-4 ──────────────────────────────────
//
// Async facade over NotificationRepository (Supabase).
// All operations are now async — no more GLOBAL_NOTIFICATION_DB.
//
// API PUBLIK:
//   createNotification(input)                    → Promise<NotificationRecord>
//   getNotification(filters?)                    → Promise<NotificationRecord[]>
//   getNotifications(filters?)                   → Promise<NotificationRecord[]>
//   getNotificationByUuid(uuid)                  → Promise<NotificationRecord | undefined>
//   markAsRead(uuid)                             → Promise<void>
//   markAllAsRead(target_workspace_uuid?)        → Promise<number>
//   archiveNotification(uuid)                    → Promise<void>
//   deleteNotification(uuid)                     → Promise<void>
//   countUnread(target_workspace_uuid?)          → Promise<number>

import { supabase } from '../lib/supabase';
import {
  repoCreateNotification,
  repoGetNotifications,
  repoGetNotificationByUuid,
  repoMarkNotificationRead,
  repoMarkAllNotificationsRead,
  repoDeleteNotification,
  repoArchiveNotification,
  repoGetUnreadCount,
  repoGetAdminNotifications,
} from '../repositories/notificationRepository';
import type {
  NotificationRecord,
  CreateNotificationInput,
  GetNotificationsFilter,
  NotificationReferenceModule,
} from '../data/globalNotificationData';
import type { NotificationRecord as AdminNotifRecord } from '../data/adminNotificationsData';
import { NOTIFICATION_STATUS_UUID, PRIORITY_UUID, NOTIFICATION_TYPE_UUID } from '../data/globalNotificationData';
import { bump } from '../utils/notifSignal';

// Re-export types & konstanta agar consumer tidak import dari data layer langsung.
export type { NotificationRecord, CreateNotificationInput, GetNotificationsFilter, NotificationReferenceModule };
export { NOTIFICATION_STATUS_UUID, PRIORITY_UUID, NOTIFICATION_TYPE_UUID };

// ─── Auth Helper ──────────────────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('[GlobalNotificationService] Tidak ada pengguna yang sedang login.');
  return data.user.id;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Membuat notifikasi baru dan menyimpannya ke Supabase.
 * Mengembalikan record yang baru dibuat.
 */
export async function createNotification(input: CreateNotificationInput): Promise<NotificationRecord> {
  if (!input.title.trim()) throw new Error('[GlobalNotificationService] title tidak boleh kosong.');
  if (!input.message.trim()) throw new Error('[GlobalNotificationService] message tidak boleh kosong.');

  const userId = await getCurrentUserId();
  const record = await repoCreateNotification(input, userId);
  bump();
  return record;
}

/**
 * Mengembalikan satu notifikasi berdasarkan UUID.
 * Mengembalikan undefined jika tidak ditemukan.
 */
export async function getNotificationByUuid(uuid: string): Promise<NotificationRecord | undefined> {
  const record = await repoGetNotificationByUuid(uuid);
  return record ?? undefined;
}

/**
 * Mengembalikan daftar notifikasi sesuai filter.
 * Alias publik dari getNotifications().
 */
export async function getNotification(filters: GetNotificationsFilter = {}): Promise<NotificationRecord[]> {
  return repoGetNotifications(filters);
}

/**
 * Mengembalikan daftar notifikasi sesuai filter.
 */
export async function getNotifications(filters: GetNotificationsFilter = {}): Promise<NotificationRecord[]> {
  return repoGetNotifications(filters);
}

/**
 * Menandai satu notifikasi sebagai sudah dibaca.
 */
export async function markAsRead(uuid: string): Promise<void> {
  await repoMarkNotificationRead(uuid);
  bump();
}

/**
 * Menandai SEMUA notifikasi yang belum dibaca sebagai sudah dibaca.
 * Opsional: batasi pada target_workspace_uuid tertentu.
 * Mengembalikan jumlah notifikasi yang diperbarui.
 */
export async function markAllAsRead(target_workspace_uuid?: string): Promise<number> {
  const count = await repoMarkAllNotificationsRead(target_workspace_uuid);
  if (count > 0) bump();
  return count;
}

/**
 * Mengarsipkan notifikasi — disembunyikan dari inbox aktif tetapi masih tersimpan.
 */
export async function archiveNotification(uuid: string): Promise<void> {
  await repoArchiveNotification(uuid);
  bump();
}

/**
 * Menghapus notifikasi (hard delete dari DB).
 */
export async function deleteNotification(uuid: string): Promise<void> {
  await repoDeleteNotification(uuid);
  bump();
}

/**
 * Menghitung jumlah notifikasi yang belum dibaca.
 * Opsional: batasi pada target_workspace_uuid tertentu.
 */
export async function countUnread(target_workspace_uuid?: string): Promise<number> {
  return repoGetUnreadCount(target_workspace_uuid);
}

// ─── Admin Notification helpers ───────────────────────────────────────────────

/**
 * Fetches all notifications for the admin module.
 * Service-layer wrapper over repoGetAdminNotifications — admin pages must
 * call this, not the repository directly.
 */
export async function getAdminNotifications(): Promise<AdminNotifRecord[]> {
  return repoGetAdminNotifications();
}

/**
 * Marks all notifications as read (admin scope, no workspace filter).
 * Service-layer wrapper over repoMarkAllNotificationsRead.
 */
export async function markAllAdminNotificationsRead(): Promise<void> {
  await repoMarkAllNotificationsRead();
}
