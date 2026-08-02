// ─── Global Search Data — FOUNDATION-GLOBAL-SEARCH-001 ───────────────────────
//
// Single Source of Truth untuk search index TernakHub.
//
// ATURAN:
//   • Semua modul mengindeks entity HANYA melalui globalSearchService.ts.
//   • Akses langsung ke GLOBAL_SEARCH_INDEX_DB atau fungsi _* dilarang dari luar.
//   • Search bersifat global — satu indeks untuk seluruh modul.
//   • status_reference_uuid HARUS menggunakan UUID dari Global Reference Service.
//   • UUID bersifat stabil — jangan diregenerasi setelah ditetapkan.
//
// ENTITY YANG DAPAT DI-INDEX:
//   Workspace, Livestock, Batch, Feed, Feed Formula, Feed Stock,
//   Medicine, Medicine Stock, Marketplace Listing, Transaction,
//   Conversation, News, Event, Evidence.
//
// KAPABILITAS PENCARIAN:
//   Full Text Search   — searchable_text (seluruh konten digabung)
//   Keyword Search     — keywords array (exact match / includes)
//   Prefix Search      — title/subtitle starts-with
//   Multi Keyword      — setiap kata query harus cocok setidaknya satu field
//   Filter by Module   — entity_type_reference_uuid
//   Filter by Workspace — workspace_uuid
//   Pagination         — limit + offset
//   Sorting            — relevance desc / date desc / title asc
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   entity_type_reference_uuid → Global Reference Service
//   status_reference_uuid      → Global Reference Service
//   activity log               → Global Activity Service
//   audit log                  → Global Audit Trail Service
//   semua modul entity         → belum sync
// ─────────────────────────────────────────────────────────────────────────────

import { generateUUID } from '../utils/uuid';

// ─── UUID Konstanta — Search Status ──────────────────────────────────────────

export const SEARCH_STATUS_UUID = {
  ACTIVE:   'b9000001-0000-4000-a000-000000000001',
  INACTIVE: 'b9000001-0000-4000-a000-000000000002',
  PENDING:  'b9000001-0000-4000-a000-000000000003',
  REMOVED:  'b9000001-0000-4000-a000-000000000004',
} as const;

export type SearchStatusUuid = (typeof SEARCH_STATUS_UUID)[keyof typeof SEARCH_STATUS_UUID];

// ─── UUID Konstanta — Entity Type (search-indexable) ──────────────────────────
// Subset dari ENTITY_TYPE di globalReferenceData.ts — hanya yang relevan untuk search.

export const SEARCH_ENTITY_TYPE_UUID = {
  WORKSPACE:            'b6000001-0000-4000-a000-000000000001',
  LIVESTOCK:            'b6000001-0000-4000-a000-000000000003',
  MARKETPLACE_LISTING:  'b6000001-0000-4000-a000-000000000004',
  TRANSACTION:          'b6000001-0000-4000-a000-000000000010',
  BATCH:                'b6000001-0000-4000-a000-000000000011',
  FEED:                 'b6000001-0000-4000-a000-000000000012',
  FEED_FORMULA:         'b6000001-0000-4000-a000-000000000013',
  FEED_STOCK:           'b6000001-0000-4000-a000-000000000014',
  MEDICINE:             'b6000001-0000-4000-a000-000000000015',
  MEDICINE_STOCK:       'b6000001-0000-4000-a000-000000000016',
  CONVERSATION:         'b6000001-0000-4000-a000-000000000017',
  NEWS:                 'b6000001-0000-4000-a000-000000000018',
  EVENT:                'b6000001-0000-4000-a000-000000000019',
  EVIDENCE:             'b6000001-0000-4000-a000-000000000009',
} as const;

export type SearchEntityTypeUuid =
  (typeof SEARCH_ENTITY_TYPE_UUID)[keyof typeof SEARCH_ENTITY_TYPE_UUID];

// ─── Schema — SearchIndexRecord ───────────────────────────────────────────────

export interface SearchIndexRecord {
  /** UUID v4 — primary key index. Immutable setelah ditetapkan. */
  search_uuid: string;

  /**
   * Jenis entity yang diindeks — UUID ke ENTITY_TYPE di Global Reference.
   * Gunakan SEARCH_ENTITY_TYPE_UUID untuk referensi stabil.
   */
  entity_type_reference_uuid: string;

  /**
   * UUID entity yang diindeks.
   * Contoh: livestock.id, listing_uuid, batch_uuid.
   */
  entity_uuid: string;

  /**
   * Workspace pemilik entity.
   * null = entity global/sistem (News, Event, dll yang tidak terikat workspace).
   */
  workspace_uuid: string | null;

  /**
   * Judul utama entity untuk tampilan hasil pencarian.
   * Contoh: nama ternak, judul listing, nama batch.
   * Maks 200 karakter. Wajib diisi.
   */
  title: string;

  /**
   * Teks pendukung di bawah judul untuk konteks tambahan.
   * Contoh: jenis hewan, lokasi, kategori, harga.
   * null = tidak ada subtitle.
   */
  subtitle: string | null;

  /**
   * Array kata kunci eksplisit yang disematkan oleh modul asal.
   * Digunakan untuk keyword search dan filter.
   * Contoh: ['domba', 'garut', 'pejantan', 'aktif'].
   */
  keywords: string[];

  /**
   * Array tag/label yang diassign ke entity.
   * Digunakan untuk pengelompokan dan filter.
   * Contoh: ['unggulan', 'lelang', 'expired'].
   */
  tags: string[];

  /**
   * String gabungan seluruh konten yang dapat dicari (full-text).
   * Modul asal bertanggung jawab mengisi ini dengan semua teks relevan,
   * termasuk deskripsi, catatan, nama pemilik, lokasi, dll.
   * Search engine mencari dalam string ini menggunakan contains/includes.
   */
  searchable_text: string;

  /**
   * Status entry di search index — UUID ke SEARCH_STATUS.
   * Gunakan SEARCH_STATUS_UUID untuk referensi stabil.
   * Default: Active.
   */
  status_reference_uuid: string;

  /** Timestamp ISO 8601 saat index entry terakhir diperbarui. */
  last_indexed_at: string;

  /** Timestamp ISO 8601 saat index entry pertama dibuat. */
  created_at: string;

  /** Timestamp ISO 8601 saat record terakhir diperbarui. */
  updated_at: string;
}

// ─── Input untuk indexEntity ───────────────────────────────────────────────────

export interface IndexEntityInput {
  entity_type_reference_uuid: string;
  entity_uuid: string;
  workspace_uuid?: string | null;
  title: string;
  subtitle?: string | null;
  keywords?: string[];
  tags?: string[];
  /**
   * Seluruh teks yang dapat dicari, termasuk deskripsi, catatan, lokasi, dll.
   * Dikonkatenasi otomatis dengan title + subtitle + keywords + tags
   * sehingga tidak perlu menduplikasi field-field tersebut.
   */
  searchable_text?: string;
}

// ─── Input untuk updateIndex ───────────────────────────────────────────────────

export type UpdateIndexInput = Partial<
  Pick<
    IndexEntityInput,
    'title' | 'subtitle' | 'keywords' | 'tags' | 'searchable_text' | 'workspace_uuid'
  >
>;

// ─── Search Options ────────────────────────────────────────────────────────────

export type SearchSortOrder =
  | 'relevance_desc'   // Skor relevansi tertinggi lebih awal (default)
  | 'date_desc'        // Terbaru (last_indexed_at) lebih awal
  | 'date_asc'         // Terlama lebih awal
  | 'title_asc'        // Abjad judul A–Z
  | 'title_desc';      // Abjad judul Z–A

export interface SearchOptions {
  /** Batasi pencarian pada entity type tertentu. */
  entity_type_reference_uuid?: string | string[];
  /** Batasi pencarian pada workspace tertentu. */
  workspace_uuid?: string;
  /** Batasi pencarian pada status tertentu. Default: hanya Active. */
  status_reference_uuid?: string;
  /** Sertakan semua status (termasuk Inactive/Removed). Default: false. */
  include_all_statuses?: boolean;
  /** Batasi pencarian pada tag tertentu. */
  tags?: string[];
  /** Cara pengurutan hasil. Default: 'relevance_desc'. */
  sort?: SearchSortOrder;
  /** Maksimum jumlah hasil. Default: 20. */
  limit?: number;
  /** Offset untuk pagination. Default: 0. */
  offset?: number;
}

// ─── Search Result ─────────────────────────────────────────────────────────────

export interface SearchResult {
  /** Skor relevansi internal (0–100). Lebih tinggi = lebih relevan. */
  relevance_score: number;
  /** Index entry yang cocok. */
  record: SearchIndexRecord;
}

// ─── In-Memory Stores ─────────────────────────────────────────────────────────
// INTERNAL — akses hanya melalui globalSearchService.ts.

/**
 * Primary index — keyed by search_uuid.
 */
export const GLOBAL_SEARCH_INDEX_DB: Map<string, SearchIndexRecord> = new Map();

/**
 * Secondary index — keyed by `${entity_type_uuid}::${entity_uuid}`.
 * Menyimpan search_uuid untuk lookup O(1) saat updateIndex/removeIndex.
 */
export const SEARCH_ENTITY_LOOKUP: Map<string, string> = new Map();

// ─── Internal Helpers (package-private) ───────────────────────────────────────

export function _entityKey(entityTypeUuid: string, entityUuid: string): string {
  return `${entityTypeUuid}::${entityUuid}`;
}

export function _insertSearchIndex(record: SearchIndexRecord): void {
  GLOBAL_SEARCH_INDEX_DB.set(record.search_uuid, record);
  SEARCH_ENTITY_LOOKUP.set(_entityKey(record.entity_type_reference_uuid, record.entity_uuid), record.search_uuid);
}

export function _replaceSearchIndex(record: SearchIndexRecord): void {
  GLOBAL_SEARCH_INDEX_DB.set(record.search_uuid, record);
  SEARCH_ENTITY_LOOKUP.set(_entityKey(record.entity_type_reference_uuid, record.entity_uuid), record.search_uuid);
}

export function _getAllSearchIndex(): SearchIndexRecord[] {
  return Array.from(GLOBAL_SEARCH_INDEX_DB.values());
}

// Re-export generateUUID agar service layer tidak import dari utils langsung.
export { generateUUID };
