// ─── Global Search Service — FOUNDATION-GLOBAL-SEARCH-001 ────────────────────
//
// Satu-satunya entry point yang boleh digunakan modul lain untuk mengindeks
// dan mencari entity di TernakHub.
//
// PRINSIP:
//   1. Semua modul mengindeks entity HANYA melalui indexEntity() — tidak boleh
//      menulis langsung ke GLOBAL_SEARCH_INDEX_DB.
//   2. Search bersifat global — satu indeks untuk seluruh modul.
//   3. Setiap entity hanya memiliki satu index entry (satu search_uuid per
//      kombinasi entity_type × entity_uuid). updateIndex() memperbarui entry.
//   4. UI, halaman Search, dan Global Search Bar TIDAK diubah.
//   5. Wiring/sync ke modul lain BELUM dilakukan — disiapkan sebagai relasi.
//
// KAPABILITAS PENCARIAN:
//   Full Text Search   — mencari dalam searchable_text (seluruh konten digabung)
//   Keyword Search     — mencari dalam keywords array
//   Prefix Search      — title/subtitle starts-with (case-insensitive)
//   Multi Keyword      — setiap kata query harus cocok setidaknya satu field
//   Filter by Module   — entity_type_reference_uuid (single atau array)
//   Filter by Workspace — workspace_uuid
//   Pagination         — limit + offset
//   Sorting            — relevance_desc / date_desc / date_asc / title_asc / title_desc
//
// API PUBLIK:
//   indexEntity(input)                              → SearchIndexRecord
//   updateIndex(entityTypeUuid, entityUuid, input)  → SearchIndexRecord
//   removeIndex(entityTypeUuid, entityUuid)         → boolean
//   search(query, options?)                         → SearchResult[]
//   searchByWorkspace(workspaceUuid, query, opts?)  → SearchResult[]
//   searchByModule(entityTypeUuid, query, opts?)    → SearchResult[]
//   searchByKeyword(keyword, options?)              → SearchResult[]
//   rebuildIndex(entries)                           → number
//
// ENTITY YANG DAPAT DI-INDEX:
//   Workspace, Livestock, Batch, Feed, Feed Formula, Feed Stock,
//   Medicine, Medicine Stock, Marketplace Listing, Transaction,
//   Conversation, News, Event, Evidence.
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   entity_type_reference_uuid → Global Reference Service
//   status_reference_uuid      → Global Reference Service
//   activity log               → Global Activity Service
//   audit log                  → Global Audit Trail Service
// ─────────────────────────────────────────────────────────────────────────────

import {
  type SearchIndexRecord,
  type IndexEntityInput,
  type UpdateIndexInput,
  type SearchOptions,
  type SearchResult,
  type SearchSortOrder,
  SEARCH_STATUS_UUID,
  SEARCH_ENTITY_TYPE_UUID,
  _entityKey,
  _insertSearchIndex,
  _replaceSearchIndex,
  _getAllSearchIndex,
  GLOBAL_SEARCH_INDEX_DB,
  SEARCH_ENTITY_LOOKUP,
  generateUUID,
} from '../data/globalSearchData';

// Re-export types & konstanta agar consumer tidak import dari data layer langsung.
export type { SearchIndexRecord, IndexEntityInput, UpdateIndexInput, SearchOptions, SearchResult, SearchSortOrder };
export { SEARCH_STATUS_UUID, SEARCH_ENTITY_TYPE_UUID };

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Mengindeks entity baru ke search index global.
 * Jika entity (entity_type × entity_uuid) sudah ada, melempar Error —
 * gunakan updateIndex() untuk memperbarui entry yang sudah ada.
 *
 * `searchable_text` dikonkatenasi otomatis dengan title + subtitle +
 * keywords + tags sehingga tidak perlu menduplikasi field-field tersebut.
 *
 * @example
 * // Index ternak baru
 * indexEntity({
 *   entity_type_reference_uuid: SEARCH_ENTITY_TYPE_UUID.LIVESTOCK,
 *   entity_uuid:  livestock.id,
 *   workspace_uuid: wsUuid,
 *   title:    'Domba Garut – D-2026-042',
 *   subtitle: 'Jantan · 35 kg · Aktif',
 *   keywords: ['domba', 'garut', 'pejantan'],
 *   tags:     ['unggulan'],
 *   searchable_text: 'Kandang A · Dibeli dari Pak Budi · Jan 2025',
 * });
 *
 * // Index listing marketplace
 * indexEntity({
 *   entity_type_reference_uuid: SEARCH_ENTITY_TYPE_UUID.MARKETPLACE_LISTING,
 *   entity_uuid:  listing.listing_uuid,
 *   workspace_uuid: sellerWsUuid,
 *   title:    'Sapi Limousin Jantan Siap Qurban',
 *   subtitle: 'Rp 18.500.000 · Jawa Barat',
 *   keywords: ['sapi', 'limousin', 'qurban'],
 * });
 */
export function indexEntity(input: IndexEntityInput): SearchIndexRecord {
  if (!input.title.trim()) {
    throw new Error('[GlobalSearchService] title tidak boleh kosong.');
  }
  if (!input.entity_uuid.trim()) {
    throw new Error('[GlobalSearchService] entity_uuid tidak boleh kosong.');
  }

  const key = _entityKey(input.entity_type_reference_uuid, input.entity_uuid);
  if (SEARCH_ENTITY_LOOKUP.has(key)) {
    throw new Error(
      `[GlobalSearchService] Entity "${input.entity_uuid}" (type: "${input.entity_type_reference_uuid}") ` +
        `sudah diindeks. Gunakan updateIndex() untuk memperbarui.`,
    );
  }

  const now = new Date().toISOString();
  const record: SearchIndexRecord = {
    search_uuid:                generateUUID(),
    entity_type_reference_uuid: input.entity_type_reference_uuid,
    entity_uuid:                input.entity_uuid.trim(),
    workspace_uuid:             input.workspace_uuid ?? null,
    title:                      input.title.trim(),
    subtitle:                   input.subtitle?.trim() ?? null,
    keywords:                   (input.keywords ?? []).map((k) => k.toLowerCase().trim()).filter(Boolean),
    tags:                       (input.tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean),
    searchable_text:            _buildSearchableText(input),
    status_reference_uuid:      SEARCH_STATUS_UUID.ACTIVE,
    last_indexed_at:            now,
    created_at:                 now,
    updated_at:                 now,
  };

  _insertSearchIndex(record);
  return record;
}

/**
 * Memperbarui index entry yang sudah ada.
 * Mengembalikan record yang diperbarui.
 * Melempar Error jika entry tidak ditemukan.
 *
 * Hanya field yang disertakan dalam `input` yang diperbarui;
 * field yang tidak disertakan tetap menggunakan nilai sebelumnya.
 *
 * @example
 * // Perbarui bobot dan status setelah pencatatan berat baru
 * updateIndex(SEARCH_ENTITY_TYPE_UUID.LIVESTOCK, livestock.id, {
 *   subtitle: 'Jantan · 48 kg · Aktif',
 *   searchable_text: 'Kandang B · Berat terakhir Jan 2026',
 * });
 */
export function updateIndex(
  entityTypeUuid: string,
  entityUuid: string,
  input: UpdateIndexInput,
): SearchIndexRecord {
  const existing = _getIndexByEntityOrThrow(entityTypeUuid, entityUuid);

  const mergedKeywords = input.keywords !== undefined
    ? input.keywords.map((k) => k.toLowerCase().trim()).filter(Boolean)
    : existing.keywords;

  const mergedTags = input.tags !== undefined
    ? input.tags.map((t) => t.toLowerCase().trim()).filter(Boolean)
    : existing.tags;

  const now = new Date().toISOString();
  const updated: SearchIndexRecord = {
    ...existing,
    title:           input.title?.trim()    ?? existing.title,
    subtitle:        input.subtitle !== undefined ? (input.subtitle?.trim() ?? null) : existing.subtitle,
    workspace_uuid:  input.workspace_uuid !== undefined ? (input.workspace_uuid ?? null) : existing.workspace_uuid,
    keywords:        mergedKeywords,
    tags:            mergedTags,
    searchable_text: _buildSearchableText({
      title:           input.title             ?? existing.title,
      subtitle:        input.subtitle          ?? existing.subtitle,
      keywords:        mergedKeywords,
      tags:            mergedTags,
      searchable_text: input.searchable_text   ?? '',
      entity_type_reference_uuid: existing.entity_type_reference_uuid,
      entity_uuid:     existing.entity_uuid,
    }),
    last_indexed_at: now,
    updated_at:      now,
  };

  _replaceSearchIndex(updated);
  return updated;
}

/**
 * Menghapus index entry (soft-remove — status diubah menjadi Removed).
 * Mengembalikan true jika berhasil, false jika entry tidak ditemukan.
 *
 * @example
 * removeIndex(SEARCH_ENTITY_TYPE_UUID.LIVESTOCK, livestock.id);
 */
export function removeIndex(entityTypeUuid: string, entityUuid: string): boolean {
  const key = _entityKey(entityTypeUuid, entityUuid);
  const searchUuid = SEARCH_ENTITY_LOOKUP.get(key);
  if (!searchUuid) return false;

  const existing = GLOBAL_SEARCH_INDEX_DB.get(searchUuid);
  if (!existing) return false;

  const now = new Date().toISOString();
  _replaceSearchIndex({
    ...existing,
    status_reference_uuid: SEARCH_STATUS_UUID.REMOVED,
    updated_at: now,
  });
  return true;
}

/**
 * Mencari entity di seluruh index berdasarkan query string.
 * Mendukung Full Text, Keyword, Prefix, dan Multi Keyword search.
 *
 * Multi Keyword: query "domba garut pejantan" → setiap kata harus cocok
 * setidaknya satu field (title, subtitle, keywords, tags, atau searchable_text).
 *
 * Default: hanya mengembalikan entry dengan status Active.
 * Default sort: relevance_desc.
 *
 * @example
 * // Cari semua ternak "domba garut"
 * search('domba garut', {
 *   entity_type_reference_uuid: SEARCH_ENTITY_TYPE_UUID.LIVESTOCK,
 *   limit: 10,
 * });
 *
 * // Cari listing marketplace di workspace tertentu
 * search('sapi limousin', {
 *   entity_type_reference_uuid: SEARCH_ENTITY_TYPE_UUID.MARKETPLACE_LISTING,
 *   workspace_uuid: wsUuid,
 *   sort: 'date_desc',
 * });
 *
 * // Cari lintas modul
 * search('qurban', { limit: 20 });
 */
export function search(query: string, options: SearchOptions = {}): SearchResult[] {
  return _runSearch(query.trim(), options);
}

/**
 * Mencari entity di dalam workspace tertentu.
 * Filter module tambahan dapat diberikan melalui options.
 *
 * @example
 * searchByWorkspace(wsUuid, 'domba');
 * searchByWorkspace(wsUuid, 'formula', {
 *   entity_type_reference_uuid: SEARCH_ENTITY_TYPE_UUID.FEED_FORMULA,
 * });
 */
export function searchByWorkspace(
  workspaceUuid: string,
  query: string,
  options: Omit<SearchOptions, 'workspace_uuid'> = {},
): SearchResult[] {
  return _runSearch(query.trim(), { ...options, workspace_uuid: workspaceUuid });
}

/**
 * Mencari entity dalam module (entity type) tertentu.
 * Dapat dikombinasikan dengan workspace filter melalui options.
 *
 * @example
 * searchByModule(SEARCH_ENTITY_TYPE_UUID.MEDICINE, 'amoxicillin');
 * searchByModule(SEARCH_ENTITY_TYPE_UUID.NEWS, 'penyakit mulut');
 */
export function searchByModule(
  entityTypeUuid: string,
  query: string,
  options: Omit<SearchOptions, 'entity_type_reference_uuid'> = {},
): SearchResult[] {
  return _runSearch(query.trim(), { ...options, entity_type_reference_uuid: entityTypeUuid });
}

/**
 * Mencari entity berdasarkan satu kata kunci eksplisit (exact match pada keywords array).
 * Berbeda dengan search() yang melakukan contains pada semua field.
 * Berguna untuk tag/category filtering yang presisi.
 *
 * @example
 * // Temukan semua entity ber-tag "unggulan"
 * searchByKeyword('unggulan');
 *
 * // Temukan semua listing ber-tag "lelang"
 * searchByKeyword('lelang', {
 *   entity_type_reference_uuid: SEARCH_ENTITY_TYPE_UUID.MARKETPLACE_LISTING,
 * });
 */
export function searchByKeyword(keyword: string, options: SearchOptions = {}): SearchResult[] {
  const kw = keyword.toLowerCase().trim();
  if (!kw) return [];

  const { status_reference_uuid, include_all_statuses = false, limit, offset = 0, sort = 'relevance_desc' } = options;

  let records = _getAllSearchIndex();
  records = _applyStatusFilter(records, status_reference_uuid, include_all_statuses);
  records = _applyModuleFilter(records, options.entity_type_reference_uuid);
  if (options.workspace_uuid) {
    records = records.filter((r) => r.workspace_uuid === options.workspace_uuid);
  }
  if (options.tags && options.tags.length > 0) {
    const tagSet = new Set(options.tags.map((t) => t.toLowerCase()));
    records = records.filter((r) => r.tags.some((t) => tagSet.has(t)));
  }

  // Exact keyword match on keywords or tags
  const results: SearchResult[] = records
    .filter((r) => r.keywords.includes(kw) || r.tags.includes(kw))
    .map((r) => ({ relevance_score: 80, record: r }));

  return _applySort(results, sort, offset, limit);
}

/**
 * Membangun ulang index untuk daftar entry baru sekaligus.
 * Berguna untuk inisialisasi awal atau rebuild setelah migrasi data.
 * Entry yang sudah ada dengan (entity_type × entity_uuid) yang sama
 * akan diperbarui (upsert).
 *
 * Mengembalikan jumlah entry yang berhasil diindeks.
 *
 * @example
 * const count = rebuildIndex(livestockList.map(buildLivestockIndexEntry));
 * console.log(`Berhasil mengindeks ${count} entry.`);
 */
export function rebuildIndex(entries: IndexEntityInput[]): number {
  let count = 0;
  for (const entry of entries) {
    try {
      const key = _entityKey(entry.entity_type_reference_uuid, entry.entity_uuid);
      if (SEARCH_ENTITY_LOOKUP.has(key)) {
        updateIndex(entry.entity_type_reference_uuid, entry.entity_uuid, {
          title:           entry.title,
          subtitle:        entry.subtitle,
          keywords:        entry.keywords,
          tags:            entry.tags,
          searchable_text: entry.searchable_text,
          workspace_uuid:  entry.workspace_uuid,
        });
      } else {
        indexEntity(entry);
      }
      count++;
    } catch {
      // Abaikan error per-entry agar batch tidak gagal total
    }
  }
  return count;
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

/**
 * Membangun string searchable_text gabungan dari semua field yang tersedia.
 * Menggunakan lowercase dan membuang duplikasi konten.
 */
function _buildSearchableText(input: IndexEntityInput): string {
  const parts: string[] = [
    input.title,
    input.subtitle ?? '',
    (input.keywords ?? []).join(' '),
    (input.tags ?? []).join(' '),
    input.searchable_text ?? '',
  ];
  return parts.filter(Boolean).join(' ').trim();
}

/**
 * Menghitung skor relevansi sebuah record terhadap satu kata query (lowercase).
 * Skor lebih tinggi berarti lebih relevan.
 *
 * Bobot:
 *   +40  — judul sama persis (exact title match)
 *   +30  — judul dimulai dengan query (prefix)
 *   +20  — judul mengandung query (contains)
 *   +15  — subtitle exact match
 *   +12  — subtitle prefix
 *   +10  — subtitle contains
 *   +10  — keyword exact match
 *   + 8  — keyword prefix match
 *   + 6  — tag exact match
 *   + 4  — searchable_text contains
 */
function _scoreRecord(record: SearchIndexRecord, word: string): number {
  const title    = record.title.toLowerCase();
  const subtitle = (record.subtitle ?? '').toLowerCase();
  const stext    = record.searchable_text.toLowerCase();
  let score = 0;

  // Title
  if (title === word)             score += 40;
  else if (title.startsWith(word)) score += 30;
  else if (title.includes(word))   score += 20;

  // Subtitle
  if (subtitle) {
    if (subtitle === word)              score += 15;
    else if (subtitle.startsWith(word)) score += 12;
    else if (subtitle.includes(word))   score += 10;
  }

  // Keywords
  if (record.keywords.includes(word))                        score += 10;
  else if (record.keywords.some((k) => k.startsWith(word))) score += 8;

  // Tags
  if (record.tags.includes(word))                            score += 6;

  // Full-text
  if (stext.includes(word))                                  score += 4;

  return score;
}

/**
 * Core search runner — digunakan oleh semua fungsi search publik.
 */
function _runSearch(query: string, options: SearchOptions): SearchResult[] {
  const {
    workspace_uuid,
    status_reference_uuid,
    include_all_statuses = false,
    tags,
    sort = 'relevance_desc',
    limit,
    offset = 0,
  } = options;

  let records = _getAllSearchIndex();

  // Status filter
  records = _applyStatusFilter(records, status_reference_uuid, include_all_statuses);

  // Module filter
  records = _applyModuleFilter(records, options.entity_type_reference_uuid);

  // Workspace filter
  if (workspace_uuid !== undefined) {
    records = records.filter((r) => r.workspace_uuid === workspace_uuid);
  }

  // Tag filter
  if (tags && tags.length > 0) {
    const tagSet = new Set(tags.map((t) => t.toLowerCase()));
    records = records.filter((r) => r.tags.some((t) => tagSet.has(t)));
  }

  // Jika query kosong, kembalikan semua (dengan skor 0) tanpa filtering konten
  if (!query) {
    const results: SearchResult[] = records.map((r) => ({ relevance_score: 0, record: r }));
    return _applySort(results, sort, offset, limit);
  }

  // Multi keyword: setiap kata harus cocok setidaknya satu field
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  const results: SearchResult[] = records
    .map((record) => {
      let totalScore = 0;
      for (const word of words) {
        const ws = _scoreRecord(record, word);
        if (ws === 0) {
          // Kata ini tidak cocok sama sekali — record dikecualikan
          return null;
        }
        totalScore += ws;
      }
      // Normalisasi ke 0–100 berdasarkan jumlah kata
      const normalized = Math.min(100, totalScore / words.length);
      return { relevance_score: Math.round(normalized * 10) / 10, record };
    })
    .filter((r): r is SearchResult => r !== null);

  return _applySort(results, sort, offset, limit);
}

function _applyStatusFilter(
  records: SearchIndexRecord[],
  statusUuid: string | undefined,
  includeAll: boolean,
): SearchIndexRecord[] {
  if (statusUuid !== undefined) {
    return records.filter((r) => r.status_reference_uuid === statusUuid);
  }
  if (includeAll) return records;
  // Default: hanya Active
  return records.filter((r) => r.status_reference_uuid === SEARCH_STATUS_UUID.ACTIVE);
}

function _applyModuleFilter(
  records: SearchIndexRecord[],
  moduleFilter: string | string[] | undefined,
): SearchIndexRecord[] {
  if (moduleFilter === undefined) return records;
  if (Array.isArray(moduleFilter)) {
    if (moduleFilter.length === 0) return records;
    const set = new Set(moduleFilter);
    return records.filter((r) => set.has(r.entity_type_reference_uuid));
  }
  return records.filter((r) => r.entity_type_reference_uuid === moduleFilter);
}

function _applySort(
  results: SearchResult[],
  sort: SearchSortOrder,
  offset: number,
  limit: number | undefined,
): SearchResult[] {
  const sorted = [...results].sort((a, b) => {
    switch (sort) {
      case 'relevance_desc':
        return b.relevance_score - a.relevance_score;
      case 'date_desc':
        return new Date(b.record.last_indexed_at).getTime() -
               new Date(a.record.last_indexed_at).getTime();
      case 'date_asc':
        return new Date(a.record.last_indexed_at).getTime() -
               new Date(b.record.last_indexed_at).getTime();
      case 'title_asc':
        return a.record.title.localeCompare(b.record.title, 'id');
      case 'title_desc':
        return b.record.title.localeCompare(a.record.title, 'id');
      default:
        return b.relevance_score - a.relevance_score;
    }
  });

  const sliced = offset > 0 ? sorted.slice(offset) : sorted;
  return limit !== undefined && limit > 0 ? sliced.slice(0, limit) : sliced;
}

function _getIndexByEntityOrThrow(entityTypeUuid: string, entityUuid: string): SearchIndexRecord {
  const key = _entityKey(entityTypeUuid, entityUuid);
  const searchUuid = SEARCH_ENTITY_LOOKUP.get(key);
  if (!searchUuid) {
    throw new Error(
      `[GlobalSearchService] Index entry tidak ditemukan untuk entity "${entityUuid}" ` +
        `(type: "${entityTypeUuid}"). Gunakan indexEntity() terlebih dahulu.`,
    );
  }
  const record = GLOBAL_SEARCH_INDEX_DB.get(searchUuid);
  if (!record) {
    throw new Error(
      `[GlobalSearchService] Index entry "${searchUuid}" tidak ditemukan di store.`,
    );
  }
  return record;
}
