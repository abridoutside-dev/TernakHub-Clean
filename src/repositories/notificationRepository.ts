// ─── Notification Repository — DB-001B-4 ─────────────────────────────────────
//
// Async Supabase adapter for the production `notifications` table.
// RLS limits reads and updates to the authenticated recipient.
//
// EXPORTED FUNCTIONS (app-internal type — globalNotificationData.NotificationRecord):
//   repoCreateNotification(input, userId)        → GlobalNotificationRecord
//   repoGetNotifications(filters?)               → GlobalNotificationRecord[]
//   repoGetNotificationByUuid(id)                → GlobalNotificationRecord | null
//   repoMarkNotificationRead(id)                 → void
//   repoMarkAllNotificationsRead(workspaceId?)   → number (updated count)
//   repoDeleteNotification(id)                   → void
//   repoArchiveNotification(id)                  → void
//   repoGetUnreadCount(workspaceId?)             → number
//
// LEGACY (used by admin module — adminNotificationsData.NotificationRecord):
//   repoGetNotifications (alias below)

import { supabase } from '../lib/supabase';
import type {
  NotificationRecord as AdminNotificationRecord,
  NotificationSource,
  NotificationType,
  NotificationPriority,
} from '../data/adminNotificationsData';
import type {
  NotificationRecord as GlobalNotificationRecord,
  CreateNotificationInput,
  GetNotificationsFilter,
  NotificationReferenceModule,
} from '../data/globalNotificationData';
import {
  NOTIFICATION_STATUS_UUID,
  PRIORITY_UUID,
  NOTIFICATION_TYPE_UUID,
} from '../data/globalNotificationData';

// ─── DB Row Type ──────────────────────────────────────────────────────────────

type NotificationDbType = 'Info' | 'Peringatan' | 'Kritis' | 'Transaksi' | 'Sistem' | 'Promosi';

type NotificationRow = {
  id: string;
  recipient_user_id: string;
  recipient_workspace_id: string | null;
  notification_type: NotificationDbType;
  source_module: string | null;
  source_entity_id: string | null;
  title: string;
  message: string;
  icon: string | null;
  action_label: string | null;
  action_route: string | null;
  action_params: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Error ────────────────────────────────────────────────────────────────────

export class NotificationRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'NotificationRepoError';
  }
}

// ─── Type UUID ↔ DB Enum Maps ────────────────────────────────────────────────

const TYPE_UUID_TO_DB: Record<string, NotificationDbType> = {
  [NOTIFICATION_TYPE_UUID.INFO]:         'Info',
  [NOTIFICATION_TYPE_UUID.WARNING]:      'Peringatan',
  [NOTIFICATION_TYPE_UUID.CRITICAL]:     'Kritis',
  [NOTIFICATION_TYPE_UUID.SUCCESS]:      'Transaksi',
  [NOTIFICATION_TYPE_UUID.REMINDER]:     'Info',
  [NOTIFICATION_TYPE_UUID.TRANSACTION]:  'Transaksi',
  [NOTIFICATION_TYPE_UUID.SYSTEM]:       'Sistem',
  [NOTIFICATION_TYPE_UUID.ESCROW]:       'Info',
  [NOTIFICATION_TYPE_UUID.MARKETPLACE]:  'Info',
  [NOTIFICATION_TYPE_UUID.LIVESTOCK]:    'Info',
  [NOTIFICATION_TYPE_UUID.FEED]:         'Info',
  [NOTIFICATION_TYPE_UUID.MEDICINE]:     'Info',
  [NOTIFICATION_TYPE_UUID.HEALTH]:       'Info',
  [NOTIFICATION_TYPE_UUID.AI_INSIGHT]:   'Info',
  [NOTIFICATION_TYPE_UUID.VERIFICATION]: 'Info',
  [NOTIFICATION_TYPE_UUID.AUDIT]:        'Info',
};

const DB_TYPE_TO_UUID: Record<NotificationDbType, string> = {
  Info:      NOTIFICATION_TYPE_UUID.INFO,
  Peringatan:NOTIFICATION_TYPE_UUID.WARNING,
  Kritis:    NOTIFICATION_TYPE_UUID.CRITICAL,
  Transaksi: NOTIFICATION_TYPE_UUID.TRANSACTION,
  Sistem:    NOTIFICATION_TYPE_UUID.SYSTEM,
  Promosi:   NOTIFICATION_TYPE_UUID.INFO,
};

const DB_TYPE_TO_PRIORITY: Record<NotificationDbType, string> = {
  Info:      PRIORITY_UUID.NORMAL,
  Peringatan:PRIORITY_UUID.NORMAL,
  Kritis:    PRIORITY_UUID.HIGH,
  Transaksi: PRIORITY_UUID.NORMAL,
  Sistem:    PRIORITY_UUID.LOW,
  Promosi:   PRIORITY_UUID.LOW,
};

// ─── Auth Helper ──────────────────────────────────────────────────────────────

async function getRecipientId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new NotificationRepoError(error.message, error.status?.toString());
  if (!data.user) throw new NotificationRepoError('Tidak ada pengguna yang sedang login.', 'AUTH_REQUIRED');
  return data.user.id;
}

// ─── Row → GlobalNotificationRecord Adapter ───────────────────────────────────

function adaptToGlobal(row: NotificationRow): GlobalNotificationRecord {
  const typeUuid = DB_TYPE_TO_UUID[row.notification_type] ?? NOTIFICATION_TYPE_UUID.INFO;
  const isArchived = row.action_params?._archived === true;
  const statusUuid = isArchived
    ? NOTIFICATION_STATUS_UUID.ARCHIVED
    : row.is_read
      ? NOTIFICATION_STATUS_UUID.READ
      : NOTIFICATION_STATUS_UUID.UNREAD;

  // Remove internal _archived key from action_params before exposing
  let cleanParams: Record<string, unknown> | null = null;
  if (row.action_params) {
    const { _archived, ...rest } = row.action_params as Record<string, unknown>;
    void _archived;
    cleanParams = Object.keys(rest).length > 0 ? rest : null;
  }

  return {
    notification_uuid:                  row.id,
    notification_type_reference_uuid:   typeUuid,
    notification_status_reference_uuid: statusUuid,
    priority_reference_uuid:            DB_TYPE_TO_PRIORITY[row.notification_type] ?? PRIORITY_UUID.NORMAL,
    target_workspace_uuid:              row.recipient_workspace_id ?? null,
    sender_workspace_uuid:              null,
    reference_module:                   (row.source_module ?? 'system') as NotificationReferenceModule,
    reference_uuid:                     row.source_entity_id ?? null,
    title:                              row.title,
    message:                            row.message,
    icon:                               row.icon ?? null,
    action_label:                       row.action_label ?? null,
    action_route:                       row.action_route ?? null,
    action_params:                      cleanParams,
    is_read:                            row.is_read,
    read_at:                            row.read_at ?? null,
    expires_at:                         row.expires_at ?? null,
    created_at:                         row.created_at,
    updated_at:                         row.updated_at,
  };
}

// ─── Row → AdminNotificationRecord Adapter (legacy, used by admin module) ────

const ADMIN_SOURCE_MAP: Record<string, NotificationSource> = {
  auth: 'Authentication', authentication: 'Authentication',
  workspace: 'Workspace',
  livestock: 'Livestock', health: 'Livestock', kesehatan_hewan: 'Livestock',
  reproduksi: 'Livestock', mutation: 'Livestock', batch: 'Livestock',
  feed: 'Feed', formula: 'Feed Formula', feed_formula: 'Feed Formula',
  medicine: 'Medicine',
  marketplace: 'Marketplace', global_transaction: 'Marketplace',
  global_escrow: 'Marketplace', global_conversation: 'Marketplace',
  global_evidence: 'Trust & Verification', trust: 'Trust & Verification',
  verification: 'Trust & Verification',
  global_audit_trail: 'Monitoring', monitoring: 'Monitoring', reports: 'Reports',
  subscription: 'Subscription', ai_insight: 'AI Insight',
  announcement: 'Announcement', news_event: 'Announcement',
  system: 'System', profile: 'System',
};

function mapAdminSource(value: string | null): NotificationSource {
  if (!value) return 'System';
  return ADMIN_SOURCE_MAP[value.toLowerCase()] ?? 'System';
}

function mapAdminType(value: NotificationDbType): NotificationType {
  const map: Record<NotificationDbType, NotificationType> = {
    Info: 'Information', Peringatan: 'Warning', Kritis: 'Error',
    Transaksi: 'Success', Sistem: 'Information', Promosi: 'Information',
  };
  return map[value];
}

function mapAdminPriority(value: NotificationDbType): NotificationPriority {
  return value === 'Kritis' ? 'High' : value === 'Info' || value === 'Sistem' ? 'Low' : 'Normal';
}

function adaptToAdmin(row: NotificationRow): AdminNotificationRecord {
  const source = mapAdminSource(row.source_module);
  const type = mapAdminType(row.notification_type);
  const context = row.recipient_workspace_id ? 'Workspace' : 'Platform Admin';
  return {
    id: row.id, title: row.title, source, type,
    priority: mapAdminPriority(row.notification_type),
    readStatus: row.is_read ? 'Read' : 'Unread',
    createdAt: row.created_at,
    excerpt: row.message.length > 120 ? `${row.message.slice(0, 117)}…` : row.message,
    fullMessage: row.message,
    relatedObjectType: row.source_entity_id ? 'ID Entitas' : undefined,
    relatedObjectId: row.source_entity_id ?? undefined,
    context, workspaceId: row.recipient_workspace_id ?? undefined, workspaceName: undefined,
  };
}

// ─── GlobalNotificationRecord CRUD ───────────────────────────────────────────

// ─── Admin NotificationRecord CRUD (used by admin module only) ───────────────

/**
 * Fetch notifications for the admin module, returning AdminNotificationRecord[].
 * Requires an authenticated session.
 */
export async function repoGetAdminNotifications(): Promise<AdminNotificationRecord[]> {
  const recipientId = await getRecipientId();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_user_id', recipientId)
    .order('created_at', { ascending: false });

  if (error) throw new NotificationRepoError(error.message, error.code);
  return (data as NotificationRow[] | null ?? []).map(adaptToAdmin);
}

// ─── GlobalNotificationRecord CRUD ───────────────────────────────────────────

/**
 * Create a notification in Supabase.
 * userId is the authenticated user's UUID (recipient).
 */
export async function repoCreateNotification(
  input: CreateNotificationInput,
  userId: string,
): Promise<GlobalNotificationRecord> {
  const dbType: NotificationDbType = TYPE_UUID_TO_DB[input.notification_type_reference_uuid] ?? 'Info';

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      recipient_user_id:      userId,
      recipient_workspace_id: input.target_workspace_uuid ?? null,
      notification_type:      dbType,
      source_module:          input.reference_module ?? null,
      source_entity_id:       input.reference_uuid ?? null,
      title:                  input.title.trim(),
      message:                input.message.trim(),
      icon:                   input.icon ?? null,
      action_label:           input.action_label ?? null,
      action_route:           input.action_route ?? null,
      action_params:          input.action_params ?? null,
      is_read:                false,
      expires_at:             input.expires_at ?? null,
    })
    .select('*')
    .single();

  if (error) throw new NotificationRepoError(error.message, error.code);
  return adaptToGlobal(data as NotificationRow);
}

/**
 * Fetch all notifications for the current authenticated user.
 * Applies active_only filtering (excludes archived) and optional workspace/unread filters.
 */
export async function repoGetNotifications(
  filters: GetNotificationsFilter = {},
): Promise<GlobalNotificationRecord[]> {
  const recipientId = await getRecipientId();

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('recipient_user_id', recipientId)
    .order('created_at', { ascending: false });

  if (filters.target_workspace_uuid !== undefined) {
    query = query.eq('recipient_workspace_id', filters.target_workspace_uuid);
  }
  if (filters.unread_only) {
    query = query.eq('is_read', false);
  }
  if (filters.limit !== undefined && filters.limit > 0) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new NotificationRepoError(error.message, error.code);

  let records = (data as NotificationRow[] | null ?? []).map(adaptToGlobal);

  // JS-side filtering for what can't be expressed cleanly in PostgREST JSONB
  const activeOnly = filters.active_only !== false; // default true
  if (activeOnly) {
    records = records.filter(
      (r) =>
        r.notification_status_reference_uuid !== NOTIFICATION_STATUS_UUID.ARCHIVED &&
        r.notification_status_reference_uuid !== NOTIFICATION_STATUS_UUID.DELETED,
    );
  }

  if (filters.notification_type_reference_uuid !== undefined) {
    records = records.filter(
      (r) => r.notification_type_reference_uuid === filters.notification_type_reference_uuid,
    );
  }
  if (filters.priority_reference_uuid !== undefined) {
    records = records.filter((r) => r.priority_reference_uuid === filters.priority_reference_uuid);
  }
  if (filters.reference_module !== undefined) {
    records = records.filter((r) => r.reference_module === filters.reference_module);
  }

  return records;
}

/**
 * Fetch a single notification by its UUID for the current authenticated user.
 */
export async function repoGetNotificationByUuid(id: string): Promise<GlobalNotificationRecord | null> {
  const recipientId = await getRecipientId();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .eq('recipient_user_id', recipientId)
    .maybeSingle();

  if (error) throw new NotificationRepoError(error.message, error.code);
  if (!data) return null;
  return adaptToGlobal(data as NotificationRow);
}

/**
 * Mark a single notification as read.
 */
export async function repoMarkNotificationRead(id: string): Promise<void> {
  const recipientId = await getRecipientId();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('recipient_user_id', recipientId);

  if (error) throw new NotificationRepoError(error.message, error.code);
}

/**
 * Mark all unread notifications as read.
 * Optionally scoped to a workspace.
 * Returns the number of records updated.
 */
export async function repoMarkAllNotificationsRead(workspaceId?: string): Promise<number> {
  const recipientId = await getRecipientId();
  const now = new Date().toISOString();

  let query = supabase
    .from('notifications')
    .update({ is_read: true, read_at: now, updated_at: now })
    .eq('recipient_user_id', recipientId)
    .eq('is_read', false)
    .select('id');

  if (workspaceId !== undefined) {
    query = query.eq('recipient_workspace_id', workspaceId);
  }

  const { data, error } = await query;
  if (error) throw new NotificationRepoError(error.message, error.code);
  return data?.length ?? 0;
}

/**
 * Hard-delete a notification row.
 */
export async function repoDeleteNotification(id: string): Promise<void> {
  const recipientId = await getRecipientId();
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('recipient_user_id', recipientId);

  if (error) throw new NotificationRepoError(error.message, error.code);
}

/**
 * Archive a notification by setting _archived=true in action_params.
 * The notification is excluded from active queries but preserved in the DB.
 */
export async function repoArchiveNotification(id: string): Promise<void> {
  const recipientId = await getRecipientId();

  // Fetch current action_params first so we can merge
  const { data: row, error: fetchErr } = await supabase
    .from('notifications')
    .select('action_params')
    .eq('id', id)
    .eq('recipient_user_id', recipientId)
    .maybeSingle();

  if (fetchErr) throw new NotificationRepoError(fetchErr.message, fetchErr.code);
  if (!row) throw new NotificationRepoError(`Notifikasi tidak ditemukan: "${id}".`, 'NOT_FOUND');

  const merged = { ...((row as { action_params: Record<string, unknown> | null }).action_params ?? {}), _archived: true };

  const { error } = await supabase
    .from('notifications')
    .update({ action_params: merged, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('recipient_user_id', recipientId);

  if (error) throw new NotificationRepoError(error.message, error.code);
}

/**
 * Count unread, non-archived notifications.
 * Optionally scoped to a workspace.
 */
export async function repoGetUnreadCount(workspaceId?: string): Promise<number> {
  const recipientId = await getRecipientId();

  // Fetch unread rows (is_read=false); filter archived in JS
  let query = supabase
    .from('notifications')
    .select('id, action_params')
    .eq('recipient_user_id', recipientId)
    .eq('is_read', false);

  if (workspaceId !== undefined) {
    query = query.eq('recipient_workspace_id', workspaceId);
  }

  const { data, error } = await query;
  if (error) throw new NotificationRepoError(error.message, error.code);

  // Exclude archived
  const rows = (data as { id: string; action_params: Record<string, unknown> | null }[] | null) ?? [];
  return rows.filter((r) => r.action_params?._archived !== true).length;
}
