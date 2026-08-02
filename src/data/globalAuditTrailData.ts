// ─── Global Audit Trail Data — FOUNDATION-GLOBAL-AUDIT-001 ───────────────────
//
// Single Source of Truth untuk seluruh audit trail TernakHub.
//
// ATURAN:
//   • Semua modul mencatat aktivitas penting HANYA melalui globalAuditTrailService.ts.
//   • Akses langsung ke GLOBAL_AUDIT_TRAIL_DB atau fungsi _* dilarang dari luar.
//   • AuditTrail BUKAN Activity Feed — digunakan untuk pelacakan perubahan,
//     investigasi, debugging, keamanan, dan histori sistem.
//   • Record audit bersifat IMMUTABLE setelah dibuat — tidak ada update/delete.
//   • event_type dan action HARUS menggunakan UUID dari Global Reference Service
//     (AUDIT_EVENT_TYPE dan AUDIT_ACTION).
//   • UUID bersifat stabil — jangan diregenerasi setelah ditetapkan.
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   target_module: 'global_media'        → Global Media Service
//   target_module: 'global_evidence'     → Global Evidence Service
//   target_module: 'global_transaction'  → Global Transaction Service
//   target_module: 'global_escrow'       → Global Escrow Service
//   target_module: 'global_conversation' → Global Conversation Service
//   target_module: 'global_notification' → Global Notification Service
//   target_module: 'livestock'           → Livestock module
//   target_module: 'marketplace'         → Marketplace module
//   target_module: 'feed'                → Feed module
//   target_module: 'medicine'            → Medicine module
// ─────────────────────────────────────────────────────────────────────────────

import { generateUUID } from '../utils/uuid';

// ─── UUID Konstanta — Audit Event Type ───────────────────────────────────────
// Stabil — sesuai seed di globalReferenceData.ts.

export const AUDIT_EVENT_TYPE_UUID = {
  CREATE:        'b0000001-0000-4000-a000-000000000001',
  UPDATE:        'b0000001-0000-4000-a000-000000000002',
  DELETE:        'b0000001-0000-4000-a000-000000000003',
  RESTORE:       'b0000001-0000-4000-a000-000000000004',
  LOGIN:         'b0000001-0000-4000-a000-000000000005',
  LOGOUT:        'b0000001-0000-4000-a000-000000000006',
  IMPORT:        'b0000001-0000-4000-a000-000000000007',
  EXPORT:        'b0000001-0000-4000-a000-000000000008',
  VERIFY:        'b0000001-0000-4000-a000-000000000009',
  REJECT:        'b0000001-0000-4000-a000-000000000010',
  APPROVE:       'b0000001-0000-4000-a000-000000000011',
  TRANSACTION:   'b0000001-0000-4000-a000-000000000012',
  ESCROW:        'b0000001-0000-4000-a000-000000000013',
  EVIDENCE:      'b0000001-0000-4000-a000-000000000014',
  UPLOAD_MEDIA:  'b0000001-0000-4000-a000-000000000015',
} as const;

export type AuditEventTypeUuid =
  (typeof AUDIT_EVENT_TYPE_UUID)[keyof typeof AUDIT_EVENT_TYPE_UUID];

// ─── UUID Konstanta — Audit Action ────────────────────────────────────────────

export const AUDIT_ACTION_UUID = {
  STATUS_CHANGE:     'b1000001-0000-4000-a000-000000000001',
  FIELD_UPDATE:      'b1000001-0000-4000-a000-000000000002',
  BULK_OPERATION:    'b1000001-0000-4000-a000-000000000003',
  PERMISSION_CHANGE: 'b1000001-0000-4000-a000-000000000004',
  SYSTEM_GENERATED:  'b1000001-0000-4000-a000-000000000005',
  MANUAL_OVERRIDE:   'b1000001-0000-4000-a000-000000000006',
  ARCHIVE:           'b1000001-0000-4000-a000-000000000007',
  CONFIRM:           'b1000001-0000-4000-a000-000000000008',
  CANCEL:            'b1000001-0000-4000-a000-000000000009',
  SYNC:              'b1000001-0000-4000-a000-000000000010',
} as const;

export type AuditActionUuid =
  (typeof AUDIT_ACTION_UUID)[keyof typeof AUDIT_ACTION_UUID];

// ─── Target Module ────────────────────────────────────────────────────────────
// Modul / entitas yang menjadi subjek audit.

export type AuditTargetModule =
  | 'global_media'
  | 'global_evidence'
  | 'global_transaction'
  | 'global_escrow'
  | 'global_conversation'
  | 'global_notification'
  | 'global_audit_trail'
  | 'livestock'
  | 'batch'
  | 'marketplace'
  | 'feed'
  | 'medicine'
  | 'health'
  | 'reproduksi'
  | 'mutation'
  | 'news_event'
  | 'profile'
  | 'workspace'
  | 'reference'
  | 'system';

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface AuditTrailRecord {
  /** UUID v4 — primary key. Immutable. */
  audit_uuid: string;

  /**
   * UUID event dalam konteks proses induk.
   * Digunakan untuk mengelompokkan audit entries ke dalam satu "sesi" atau transaksi.
   * Contoh: semua audit dalam satu request HTTP atau satu workflow dapat berbagi event_uuid.
   * null = audit mandiri (tidak bagian dari event yang lebih besar).
   */
  event_uuid: string | null;

  /**
   * Jenis event — UUID ke AUDIT_EVENT_TYPE di Global Reference Service.
   * Gunakan AUDIT_EVENT_TYPE_UUID untuk referensi stabil.
   */
  event_type_reference_uuid: string;

  /**
   * Workspace pelaku aksi.
   * null = aksi oleh sistem (bukan pengguna).
   */
  actor_workspace_uuid: string | null;

  /**
   * UUID pengguna pelaku aksi.
   * null = aksi oleh sistem (bukan pengguna).
   */
  actor_user_uuid: string | null;

  /**
   * Modul / entitas yang menjadi subjek audit.
   */
  target_module: AuditTargetModule;

  /**
   * UUID entitas di modul target.
   * null = audit tidak merujuk entitas spesifik (misal: login event).
   */
  target_uuid: string | null;

  /**
   * Tindakan spesifik yang dilakukan — UUID ke AUDIT_ACTION di Global Reference Service.
   * Gunakan AUDIT_ACTION_UUID untuk referensi stabil.
   * null = tindakan tidak memerlukan granularitas lebih dari event_type.
   */
  action_reference_uuid: string | null;

  /**
   * Snapshot data entitas SEBELUM perubahan.
   * null untuk event Create atau event yang tidak mengubah state entitas.
   * Format: JSON-serializable object (snapshot partial atau lengkap).
   */
  before_data: Record<string, unknown> | null;

  /**
   * Snapshot data entitas SETELAH perubahan.
   * null untuk event Delete atau event yang tidak menghasilkan state baru.
   * Format: JSON-serializable object (snapshot partial atau lengkap).
   */
  after_data: Record<string, unknown> | null;

  /**
   * Metadata tambahan terkait event.
   * Contoh: { reason: 'Admin override', batch_size: 42, source: 'import_csv' }.
   * null = tidak ada metadata tambahan.
   */
  metadata: Record<string, unknown> | null;

  /**
   * Alamat IP pelaku.
   * null = tidak tersedia (sistem/internal/belum ada backend).
   */
  ip_address: string | null;

  /**
   * User-agent browser/client pelaku.
   * null = tidak tersedia (sistem/internal/belum ada backend).
   */
  user_agent: string | null;

  /** Timestamp ISO 8601 saat audit dicatat. Immutable. */
  created_at: string;
}

// ─── Input untuk recordAudit ──────────────────────────────────────────────────

export interface RecordAuditInput {
  /** UUID event induk — untuk mengelompokkan entri dalam satu proses. */
  event_uuid?: string | null;
  /** UUID ke AUDIT_EVENT_TYPE — wajib. Gunakan AUDIT_EVENT_TYPE_UUID. */
  event_type_reference_uuid: string;
  /** Workspace pelaku. null = sistem. */
  actor_workspace_uuid?: string | null;
  /** UUID pengguna pelaku. null = sistem. */
  actor_user_uuid?: string | null;
  /** Modul target. */
  target_module: AuditTargetModule;
  /** UUID entitas target. null = tidak spesifik. */
  target_uuid?: string | null;
  /** UUID ke AUDIT_ACTION. null = tidak perlu granularitas. */
  action_reference_uuid?: string | null;
  /** Snapshot sebelum perubahan. */
  before_data?: Record<string, unknown> | null;
  /** Snapshot setelah perubahan. */
  after_data?: Record<string, unknown> | null;
  /** Metadata tambahan. */
  metadata?: Record<string, unknown> | null;
  /** Alamat IP (opsional — tidak tersedia di frontend). */
  ip_address?: string | null;
  /** User-agent (opsional — tidak tersedia di frontend). */
  user_agent?: string | null;
}

// ─── Filter untuk query ───────────────────────────────────────────────────────

export interface GetAuditFilter {
  /** Filter berdasarkan event_type_reference_uuid. */
  event_type_reference_uuid?: string;
  /** Filter berdasarkan actor_workspace_uuid. */
  actor_workspace_uuid?: string;
  /** Filter berdasarkan actor_user_uuid. */
  actor_user_uuid?: string;
  /** Filter berdasarkan target_module. */
  target_module?: AuditTargetModule;
  /** Filter berdasarkan target_uuid. */
  target_uuid?: string;
  /** Filter berdasarkan action_reference_uuid. */
  action_reference_uuid?: string;
  /** Hanya record setelah timestamp ini (ISO 8601). */
  from_date?: string;
  /** Hanya record sebelum timestamp ini (ISO 8601). */
  to_date?: string;
  /** Maksimum jumlah record yang dikembalikan. Default: tidak terbatas. */
  limit?: number;
  /** Offset untuk pagination. Default: 0. */
  offset?: number;
}

// ─── Export Record ────────────────────────────────────────────────────────────

export interface AuditExportRecord {
  audit_uuid:               string;
  event_uuid:               string | null;
  event_type_reference_uuid: string;
  actor_workspace_uuid:     string | null;
  actor_user_uuid:          string | null;
  target_module:            string;
  target_uuid:              string | null;
  action_reference_uuid:    string | null;
  has_before_data:          boolean;
  has_after_data:           boolean;
  metadata_keys:            string[];
  ip_address:               string | null;
  created_at:               string;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────
// INTERNAL — akses hanya melalui globalAuditTrailService.ts.
// Array (bukan Map) karena audit trail adalah append-only dan sering diquery
// secara range (by date, by module) — array lebih natural untuk ini.

export const GLOBAL_AUDIT_TRAIL_DB: AuditTrailRecord[] = [];

// ─── Internal Helpers (package-private) ───────────────────────────────────────

export function _appendAudit(record: AuditTrailRecord): void {
  GLOBAL_AUDIT_TRAIL_DB.push(record);
}

export function _getAllAudits(): AuditTrailRecord[] {
  return GLOBAL_AUDIT_TRAIL_DB;
}

// Re-export generateUUID agar service layer tidak import dari utils langsung.
export { generateUUID };
