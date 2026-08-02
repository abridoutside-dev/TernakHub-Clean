// ─── Global Activity Service — FOUNDATION-GLOBAL-ACTIVITY-001 ─────────────────
//
// Satu-satunya entry point yang boleh digunakan modul lain untuk mencatat
// atau membaca aktivitas bisnis TernakHub.
//
// PRINSIP:
//   1. Semua modul HARUS mengirim aktivitas melalui createActivity() — tidak
//      boleh menulis langsung ke GLOBAL_ACTIVITY_DB.
//   2. Activity BUKAN Audit Trail — digunakan untuk Dashboard, Home,
//      Recent Activity, Timeline, Business Snapshot, AI Insight, News & Event.
//   3. activity_type, activity_status, priority, visibility selalu menggunakan
//      UUID dari Global Reference Service.
//   4. Dashboard, UI, News & Event, dan workflow TIDAK diubah oleh service ini.
//   5. Wiring/sync ke modul lain BELUM dilakukan — disiapkan sebagai relasi.
//
// API PUBLIK:
//   createActivity(input)                          → ActivityRecord
//   getActivity(filters?)                          → ActivityRecord[]
//   getActivityByUuid(uuid)                        → ActivityRecord | undefined
//   getActivityByWorkspace(workspaceUuid, filters?) → ActivityRecord[]
//   getActivityByModule(module, filters?)          → ActivityRecord[]
//   getRecentActivities(workspaceUuid?, limit?)    → ActivityRecord[]
//   archiveActivity(uuid)                          → ActivityRecord
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   media_uuid                        → Global Media Service
//   reference_module: 'global_evidence'     → Global Evidence Service
//   reference_module: 'global_transaction'  → Global Transaction Service
//   reference_module: 'global_escrow'       → Global Escrow Service
//   reference_module: 'global_conversation' → Global Conversation Service
//   reference_module: 'global_notification' → Global Notification Service
//   reference_module: 'global_audit_trail'  → Global Audit Trail Service
//   reference_module: 'livestock'           → Livestock module
//   reference_module: 'marketplace'         → Marketplace module
//   reference_module: 'feed'                → Feed module
//   reference_module: 'medicine'            → Medicine module
//
// SIAP DIGUNAKAN OLEH:
//   ✓ Global Media        — reference_module: 'global_media'
//   ✓ Global Evidence     — reference_module: 'global_evidence'
//   ✓ Global Transaction  — reference_module: 'global_transaction'
//   ✓ Global Escrow       — reference_module: 'global_escrow'
//   ✓ Global Conversation — reference_module: 'global_conversation'
//   ✓ Global Notification — reference_module: 'global_notification'
//   ✓ Global Audit Trail  — reference_module: 'global_audit_trail'
//   ✓ Livestock           — reference_module: 'livestock'
//   ✓ Batch               — reference_module: 'batch'
//   ✓ Marketplace         — reference_module: 'marketplace'
//   ✓ Feed                — reference_module: 'feed'
//   ✓ Medicine            — reference_module: 'medicine'
// ─────────────────────────────────────────────────────────────────────────────

import {
  type ActivityRecord,
  type CreateActivityInput,
  type GetActivityFilter,
  type ActivityReferenceModule,
  ACTIVITY_TYPE_UUID,
  ACTIVITY_STATUS_UUID,
  VISIBILITY_UUID,
  ACTIVITY_PRIORITY_UUID,
  _insertActivity,
  _getAllActivities,
  _replaceActivity,
  GLOBAL_ACTIVITY_DB,
  generateUUID,
} from '../data/globalActivityData';

// Re-export types & konstanta agar consumer tidak import dari data layer langsung.
export type { ActivityRecord, CreateActivityInput, GetActivityFilter, ActivityReferenceModule };
export { ACTIVITY_TYPE_UUID, ACTIVITY_STATUS_UUID, VISIBILITY_UUID, ACTIVITY_PRIORITY_UUID };

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Mencatat aktivitas bisnis baru ke store global.
 * Mengembalikan record yang baru dibuat.
 *
 * GUARD: title tidak boleh kosong.
 * DEFAULT: priority = Normal, visibility = Workspace, status = Active,
 *          activity_at = sekarang.
 *
 * @example
 * // Catat pendaftaran ternak baru
 * createActivity({
 *   activity_type_reference_uuid: ACTIVITY_TYPE_UUID.LIVESTOCK_REGISTERED,
 *   workspace_uuid: wsUuid,
 *   actor_uuid: userUuid,
 *   reference_module: 'livestock',
 *   reference_uuid: livestock.id,
 *   title: 'Domba Garut baru didaftarkan',
 *   summary: 'ID: D-2026-042 · Berat: 35 kg',
 *   icon: '🐑',
 *   color: '#4CAF50',
 * });
 *
 * // Catat transaksi Marketplace
 * createActivity({
 *   activity_type_reference_uuid: ACTIVITY_TYPE_UUID.MARKETPLACE_TRANSACTION,
 *   workspace_uuid: sellerWsUuid,
 *   reference_module: 'global_transaction',
 *   reference_uuid: tx.transaction_uuid,
 *   title: 'Transaksi baru diterima dari Pembeli',
 *   summary: 'Sapi Limousin · Rp 18.500.000',
 *   icon: '🛒',
 *   priority_reference_uuid: ACTIVITY_PRIORITY_UUID.HIGH,
 * });
 */
export function createActivity(input: CreateActivityInput): ActivityRecord {
  if (!input.title.trim()) {
    throw new Error('[GlobalActivityService] title tidak boleh kosong.');
  }

  const now = new Date().toISOString();

  const record: ActivityRecord = {
    activity_uuid:                generateUUID(),
    activity_type_reference_uuid: input.activity_type_reference_uuid,
    activity_status_reference_uuid: ACTIVITY_STATUS_UUID.ACTIVE,
    workspace_uuid:               input.workspace_uuid ?? null,
    actor_uuid:                   input.actor_uuid ?? null,
    reference_module:             input.reference_module,
    reference_uuid:               input.reference_uuid ?? null,
    title:                        input.title.trim(),
    description:                  input.description ?? null,
    summary:                      input.summary ?? null,
    icon:                         input.icon ?? null,
    color:                        input.color ?? null,
    media_uuid:                   input.media_uuid ?? null,
    priority_reference_uuid:      input.priority_reference_uuid ?? ACTIVITY_PRIORITY_UUID.NORMAL,
    visibility_reference_uuid:    input.visibility_reference_uuid ?? VISIBILITY_UUID.WORKSPACE,
    activity_at:                  input.activity_at ?? now,
    created_at:                   now,
    updated_at:                   now,
  };

  _insertActivity(record);
  return record;
}

/**
 * Mengembalikan satu activity record berdasarkan UUID.
 * Mengembalikan undefined jika tidak ditemukan.
 *
 * @example
 * const act = getActivityByUuid('uuid-activity-xxx');
 */
export function getActivityByUuid(uuid: string): ActivityRecord | undefined {
  return GLOBAL_ACTIVITY_DB.get(uuid);
}

/**
 * Mengembalikan daftar activity sesuai filter.
 * Hasil diurutkan berdasarkan activity_at descending (terbaru terlebih dahulu).
 * Mendukung pagination via limit + offset.
 *
 * Default: hanya activity dengan status Active (bukan archived/deleted).
 *
 * @example
 * // Semua activity aktif
 * getActivity();
 *
 * // Activity Livestock workspace tertentu
 * getActivity({
 *   workspace_uuid: wsUuid,
 *   activity_type_reference_uuid: ACTIVITY_TYPE_UUID.LIVESTOCK_REGISTERED,
 * });
 *
 * // Activity bulan ini dengan pagination
 * getActivity({
 *   from_date: '2026-07-01T00:00:00Z',
 *   limit: 20,
 *   offset: 0,
 * });
 */
export function getActivity(filters: GetActivityFilter = {}): ActivityRecord[] {
  return _queryActivities(filters);
}

/**
 * Mengembalikan semua activity untuk workspace tertentu.
 * Filter tambahan dapat diberikan untuk mempersempit hasil.
 * Hasil diurutkan berdasarkan activity_at descending.
 *
 * @example
 * // Semua activity aktif untuk workspace
 * getActivityByWorkspace(workspaceUuid);
 *
 * // Hanya activity Marketplace dari workspace
 * getActivityByWorkspace(workspaceUuid, {
 *   reference_module: 'marketplace',
 * });
 */
export function getActivityByWorkspace(
  workspaceUuid: string,
  filters: Omit<GetActivityFilter, 'workspace_uuid'> = {},
): ActivityRecord[] {
  return _queryActivities({ ...filters, workspace_uuid: workspaceUuid });
}

/**
 * Mengembalikan semua activity untuk reference_module tertentu.
 * Filter tambahan dapat diberikan untuk mempersempit hasil.
 * Hasil diurutkan berdasarkan activity_at descending.
 *
 * @example
 * // Semua activity modul Livestock
 * getActivityByModule('livestock');
 *
 * // Activity batch yang baru dibuat
 * getActivityByModule('batch', {
 *   activity_type_reference_uuid: ACTIVITY_TYPE_UUID.BATCH_CREATED,
 * });
 */
export function getActivityByModule(
  module: ActivityReferenceModule,
  filters: Omit<GetActivityFilter, 'reference_module'> = {},
): ActivityRecord[] {
  return _queryActivities({ ...filters, reference_module: module });
}

/**
 * Mengembalikan N activity terbaru untuk ditampilkan di feed/dashboard.
 * Opsional: batasi pada workspace tertentu.
 * Hanya mengembalikan activity dengan status Active dan visibility bukan System.
 * Diurutkan berdasarkan activity_at descending.
 *
 * @param workspaceUuid  UUID workspace. undefined = semua workspace.
 * @param limit          Jumlah maksimum record. Default: 10.
 *
 * @example
 * // 10 activity terbaru untuk workspace
 * getRecentActivities(workspaceUuid);
 *
 * // 5 activity terbaru dari semua workspace (untuk admin/global feed)
 * getRecentActivities(undefined, 5);
 */
export function getRecentActivities(
  workspaceUuid?: string,
  limit = 10,
): ActivityRecord[] {
  return _queryActivities({
    workspace_uuid:          workspaceUuid,
    active_only:             true,
    // Exclude System-visibility activity dari recent feed
    // (difilter tambahan di dalam _queryActivities)
    limit,
  }).filter((r) => r.visibility_reference_uuid !== VISIBILITY_UUID.SYSTEM);
}

/**
 * Mengarsipkan activity — disembunyikan dari feed aktif tetapi masih tersimpan.
 * Idempotent pada activity yang sudah diarsipkan.
 * Melempar Error jika UUID tidak ditemukan atau activity sudah dihapus.
 *
 * @example
 * archiveActivity('uuid-activity-xxx');
 */
export function archiveActivity(uuid: string): ActivityRecord {
  const existing = _getOrThrow(uuid);

  if (existing.activity_status_reference_uuid === ACTIVITY_STATUS_UUID.DELETED) {
    throw new Error(
      `[GlobalActivityService] Activity "${uuid}" sudah dihapus — tidak dapat diarsipkan.`,
    );
  }

  // Idempotent
  if (existing.activity_status_reference_uuid === ACTIVITY_STATUS_UUID.ARCHIVED) {
    return existing;
  }

  const now = new Date().toISOString();
  const updated: ActivityRecord = {
    ...existing,
    activity_status_reference_uuid: ACTIVITY_STATUS_UUID.ARCHIVED,
    updated_at: now,
  };

  _replaceActivity(updated);
  return updated;
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

/**
 * Mengambil activity dari store atau melempar Error jika tidak ditemukan.
 */
function _getOrThrow(uuid: string): ActivityRecord {
  const record = GLOBAL_ACTIVITY_DB.get(uuid);
  if (!record) {
    throw new Error(
      `[GlobalActivityService] Activity tidak ditemukan: "${uuid}".`,
    );
  }
  return record;
}

/**
 * Implementasi query internal yang digunakan oleh semua fungsi getActivity*.
 * Hasil diurutkan berdasarkan activity_at descending (terbaru lebih awal).
 */
function _queryActivities(filters: GetActivityFilter): ActivityRecord[] {
  const {
    workspace_uuid,
    activity_type_reference_uuid,
    reference_module,
    reference_uuid,
    visibility_reference_uuid,
    priority_reference_uuid,
    active_only     = true,
    include_deleted = false,
    from_date,
    to_date,
    limit,
    offset = 0,
  } = filters;

  let records = _getAllActivities();

  // Status filter
  if (active_only) {
    records = records.filter(
      (r) => r.activity_status_reference_uuid === ACTIVITY_STATUS_UUID.ACTIVE,
    );
  } else if (!include_deleted) {
    records = records.filter(
      (r) => r.activity_status_reference_uuid !== ACTIVITY_STATUS_UUID.DELETED,
    );
  }

  if (workspace_uuid !== undefined) {
    records = records.filter((r) => r.workspace_uuid === workspace_uuid);
  }
  if (activity_type_reference_uuid !== undefined) {
    records = records.filter(
      (r) => r.activity_type_reference_uuid === activity_type_reference_uuid,
    );
  }
  if (reference_module !== undefined) {
    records = records.filter((r) => r.reference_module === reference_module);
  }
  if (reference_uuid !== undefined) {
    records = records.filter((r) => r.reference_uuid === reference_uuid);
  }
  if (visibility_reference_uuid !== undefined) {
    records = records.filter((r) => r.visibility_reference_uuid === visibility_reference_uuid);
  }
  if (priority_reference_uuid !== undefined) {
    records = records.filter((r) => r.priority_reference_uuid === priority_reference_uuid);
  }
  if (from_date !== undefined) {
    const from = new Date(from_date).getTime();
    records = records.filter((r) => new Date(r.activity_at).getTime() >= from);
  }
  if (to_date !== undefined) {
    const to = new Date(to_date).getTime();
    records = records.filter((r) => new Date(r.activity_at).getTime() <= to);
  }

  // Urutkan berdasarkan activity_at descending (terbaru lebih awal)
  records = [...records].sort(
    (a, b) => new Date(b.activity_at).getTime() - new Date(a.activity_at).getTime(),
  );

  // Pagination
  if (offset > 0) {
    records = records.slice(offset);
  }
  if (limit !== undefined && limit > 0) {
    records = records.slice(0, limit);
  }

  return records;
}
