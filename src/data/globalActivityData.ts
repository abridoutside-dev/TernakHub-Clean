// ─── Global Activity Data — FOUNDATION-GLOBAL-ACTIVITY-001 ───────────────────
//
// Single Source of Truth untuk seluruh aktivitas bisnis TernakHub.
//
// ATURAN:
//   • Semua modul mengirim aktivitas HANYA melalui globalActivityService.ts.
//   • Akses langsung ke GLOBAL_ACTIVITY_DB atau fungsi _* dilarang dari luar.
//   • Activity BUKAN Audit Trail — digunakan untuk Dashboard, Home,
//     Recent Activity, Timeline, Business Snapshot, AI Insight, News & Event.
//   • activity_type, activity_status, priority, visibility HARUS menggunakan UUID
//     dari Global Reference Service.
//   • UUID bersifat stabil — jangan diregenerasi setelah ditetapkan.
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   media_uuid         → Global Media Service
//   reference_module   → Global Evidence / Transaction / Escrow / Conversation
//                        / Notification / Audit Trail / Livestock / Marketplace
//                        / Feed / Medicine
// ─────────────────────────────────────────────────────────────────────────────

import { generateUUID } from '../utils/uuid';

// ─── UUID Konstanta — Activity Type ──────────────────────────────────────────
// Stabil — sesuai seed di globalReferenceData.ts.

export const ACTIVITY_TYPE_UUID = {
  LIVESTOCK_REGISTERED:         'b2000001-0000-4000-a000-000000000001',
  WEIGHT_RECORDED:              'b2000001-0000-4000-a000-000000000002',
  FEED_RECORDED:                'b2000001-0000-4000-a000-000000000003',
  MEDICINE_RECORDED:            'b2000001-0000-4000-a000-000000000004',
  HEALTH_RECORDED:              'b2000001-0000-4000-a000-000000000005',
  MARKETPLACE_LISTING_CREATED:  'b2000001-0000-4000-a000-000000000006',
  MARKETPLACE_LISTING_UPDATED:  'b2000001-0000-4000-a000-000000000007',
  MARKETPLACE_TRANSACTION:      'b2000001-0000-4000-a000-000000000008',
  ESCROW_UPDATED:               'b2000001-0000-4000-a000-000000000009',
  EVIDENCE_UPLOADED:            'b2000001-0000-4000-a000-000000000010',
  BATCH_CREATED:                'b2000001-0000-4000-a000-000000000011',
  BATCH_UPDATED:                'b2000001-0000-4000-a000-000000000012',
  WORKSPACE_UPDATED:            'b2000001-0000-4000-a000-000000000013',
  AI_INSIGHT_GENERATED:         'b2000001-0000-4000-a000-000000000014',
  NEWS_PUBLISHED:               'b2000001-0000-4000-a000-000000000015',
  SYSTEM_ACTIVITY:              'b2000001-0000-4000-a000-000000000016',
} as const;

export type ActivityTypeUuid =
  (typeof ACTIVITY_TYPE_UUID)[keyof typeof ACTIVITY_TYPE_UUID];

// ─── UUID Konstanta — Activity Status ────────────────────────────────────────

export const ACTIVITY_STATUS_UUID = {
  ACTIVE:   'b3000001-0000-4000-a000-000000000001',
  ARCHIVED: 'b3000001-0000-4000-a000-000000000002',
  DELETED:  'b3000001-0000-4000-a000-000000000003',
} as const;

export type ActivityStatusUuid =
  (typeof ACTIVITY_STATUS_UUID)[keyof typeof ACTIVITY_STATUS_UUID];

// ─── UUID Konstanta — Visibility ──────────────────────────────────────────────

export const VISIBILITY_UUID = {
  PUBLIC:    'b4000001-0000-4000-a000-000000000001',
  WORKSPACE: 'b4000001-0000-4000-a000-000000000002',
  PRIVATE:   'b4000001-0000-4000-a000-000000000003',
  SYSTEM:    'b4000001-0000-4000-a000-000000000004',
} as const;

export type VisibilityUuid = (typeof VISIBILITY_UUID)[keyof typeof VISIBILITY_UUID];

// ─── UUID Konstanta — Priority (dari FOUNDATION-007) ─────────────────────────
// Re-export untuk kemudahan consumer tanpa import tambahan.

export const ACTIVITY_PRIORITY_UUID = {
  LOW:      'a9000001-0000-4000-a000-000000000001',
  NORMAL:   'a9000001-0000-4000-a000-000000000002',
  HIGH:     'a9000001-0000-4000-a000-000000000003',
  CRITICAL: 'a9000001-0000-4000-a000-000000000004',
} as const;

export type ActivityPriorityUuid =
  (typeof ACTIVITY_PRIORITY_UUID)[keyof typeof ACTIVITY_PRIORITY_UUID];

// ─── Reference Module ─────────────────────────────────────────────────────────
// Modul sumber aktivitas. Digunakan bersama reference_uuid untuk deep-link.

export type ActivityReferenceModule =
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
  | 'ai_insight'
  | 'profile'
  | 'workspace'
  | 'system';

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface ActivityRecord {
  /** UUID v4 — primary key. Immutable setelah ditetapkan. */
  activity_uuid: string;

  /**
   * Jenis aktivitas bisnis — UUID ke ACTIVITY_TYPE di Global Reference Service.
   * Gunakan ACTIVITY_TYPE_UUID untuk referensi stabil.
   */
  activity_type_reference_uuid: string;

  /**
   * Status siklus hidup activity — UUID ke ACTIVITY_STATUS.
   * Gunakan ACTIVITY_STATUS_UUID untuk referensi stabil.
   */
  activity_status_reference_uuid: string;

  /**
   * Workspace yang memiliki aktivitas ini.
   * null = aktivitas sistem/global (tidak terikat workspace).
   */
  workspace_uuid: string | null;

  /**
   * UUID aktor yang melakukan aktivitas.
   * null = aktivitas otomatis dari sistem.
   */
  actor_uuid: string | null;

  /**
   * Modul asal yang menghasilkan aktivitas.
   * Digunakan bersama reference_uuid untuk navigasi deep-link.
   */
  reference_module: ActivityReferenceModule;

  /**
   * UUID entitas di modul asal.
   * Contoh: livestock.id, listing_uuid, batch_uuid.
   * null jika aktivitas tidak merujuk entitas spesifik.
   */
  reference_uuid: string | null;

  /**
   * Judul singkat aktivitas untuk tampilan feed/timeline.
   * Contoh: 'Domba Garut baru didaftarkan', 'Transaksi selesai'.
   * Maks 160 karakter.
   */
  title: string;

  /**
   * Deskripsi lebih panjang — detail aktivitas.
   * null jika title sudah cukup menjelaskan.
   */
  description: string | null;

  /**
   * Ringkasan satu baris untuk tampilan kompak (card, list).
   * Contoh: 'Bobot 45 kg → 48 kg (+3 kg)'.
   * null = gunakan title sebagai fallback.
   */
  summary: string | null;

  /**
   * Emoji atau nama ikon untuk tampilan activity feed.
   * Contoh: '🐄', '🌾', '💊', '🛒'.
   * null = gunakan ikon default berdasarkan activity_type.
   */
  icon: string | null;

  /**
   * Warna aksen untuk tampilan timeline/card (hex atau named color).
   * Contoh: '#4CAF50', '#FF9800', 'green'.
   * null = gunakan warna default berdasarkan activity_type.
   */
  color: string | null;

  /**
   * UUID media yang dilampirkan ke aktivitas.
   * Relasi ke Global Media Service — belum di-wire.
   * null = tidak ada media.
   */
  media_uuid: string | null;

  /**
   * Tingkat prioritas — UUID ke PRIORITY di Global Reference Service.
   * Gunakan ACTIVITY_PRIORITY_UUID untuk referensi stabil.
   * Default: Normal.
   */
  priority_reference_uuid: string;

  /**
   * Tingkat keterlihatan — UUID ke VISIBILITY di Global Reference Service.
   * Gunakan VISIBILITY_UUID untuk referensi stabil.
   * Default: Workspace.
   */
  visibility_reference_uuid: string;

  /**
   * Timestamp ISO 8601 kapan aktivitas bisnis terjadi.
   * Bisa berbeda dari created_at (misalnya backfill atau import data historis).
   */
  activity_at: string;

  /** Timestamp ISO 8601 saat record dibuat di store. */
  created_at: string;

  /** Timestamp ISO 8601 saat record terakhir diperbarui. */
  updated_at: string;
}

// ─── Input untuk createActivity ───────────────────────────────────────────────

export interface CreateActivityInput {
  activity_type_reference_uuid: string;
  workspace_uuid?: string | null;
  actor_uuid?: string | null;
  reference_module: ActivityReferenceModule;
  reference_uuid?: string | null;
  title: string;
  description?: string | null;
  summary?: string | null;
  icon?: string | null;
  color?: string | null;
  media_uuid?: string | null;
  priority_reference_uuid?: string;
  visibility_reference_uuid?: string;
  /** Timestamp aktivitas bisnis. Default: sekarang. */
  activity_at?: string;
}

// ─── Filter untuk query ───────────────────────────────────────────────────────

export interface GetActivityFilter {
  /** Filter berdasarkan workspace_uuid. */
  workspace_uuid?: string;
  /** Filter berdasarkan activity_type_reference_uuid. */
  activity_type_reference_uuid?: string;
  /** Filter berdasarkan reference_module. */
  reference_module?: ActivityReferenceModule;
  /** Filter berdasarkan reference_uuid. */
  reference_uuid?: string;
  /** Filter berdasarkan visibility_reference_uuid. */
  visibility_reference_uuid?: string;
  /** Filter berdasarkan priority_reference_uuid. */
  priority_reference_uuid?: string;
  /**
   * Jika false, sertakan activity archived.
   * Deleted selalu dikecualikan kecuali include_deleted: true.
   * Default: true (hanya active).
   */
  active_only?: boolean;
  /** Jika true, sertakan activity deleted. Default: false. */
  include_deleted?: boolean;
  /** Hanya activity pada atau setelah timestamp ini (activity_at). ISO 8601. */
  from_date?: string;
  /** Hanya activity pada atau sebelum timestamp ini (activity_at). ISO 8601. */
  to_date?: string;
  /** Maksimum jumlah record yang dikembalikan. Default: tidak terbatas. */
  limit?: number;
  /** Offset untuk pagination. Default: 0. */
  offset?: number;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────
// INTERNAL — akses hanya melalui globalActivityService.ts.

export const GLOBAL_ACTIVITY_DB: Map<string, ActivityRecord> = new Map();

// ─── Internal Helpers (package-private) ───────────────────────────────────────

export function _insertActivity(record: ActivityRecord): void {
  GLOBAL_ACTIVITY_DB.set(record.activity_uuid, record);
}

export function _getAllActivities(): ActivityRecord[] {
  return Array.from(GLOBAL_ACTIVITY_DB.values());
}

export function _replaceActivity(record: ActivityRecord): void {
  GLOBAL_ACTIVITY_DB.set(record.activity_uuid, record);
}

// Re-export generateUUID agar service layer tidak import dari utils langsung.
export { generateUUID };
