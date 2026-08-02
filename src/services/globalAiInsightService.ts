// ─── Global AI Insight Service — FOUNDATION-GLOBAL-AI-INSIGHT-001 ────────────
//
// Satu-satunya entry point yang boleh digunakan modul lain untuk membuat
// atau mengelola insight di TernakHub.
//
// PRINSIP:
//   1. Semua modul menghasilkan insight HANYA melalui createInsight() — tidak
//      boleh menulis langsung ke GLOBAL_AI_INSIGHT_DB.
//   2. Engine ini TIDAK melakukan AI inference — ia menjadi pusat penyimpanan,
//      manajemen, dan distribusi insight dari berbagai modul.
//   3. Insight HARUS explainable, evidence-based, dan data-driven.
//   4. AI TIDAK boleh membuat kesimpulan tanpa evidence.
//   5. Dashboard, UI, dan workflow TIDAK diubah oleh service ini.
//   6. Wiring/sync ke modul lain BELUM dilakukan — disiapkan sebagai relasi.
//
// API PUBLIK:
//   createInsight(input)                          → AiInsightRecord
//   getInsight(filters?)                          → AiInsightRecord[]
//   getInsightByUuid(uuid)                        → AiInsightRecord | undefined
//   getInsightsByWorkspace(wsUuid, filters?)      → AiInsightRecord[]
//   getInsightsByModule(module, filters?)         → AiInsightRecord[]
//   getInsightsByEntity(typeUuid, entityUuid)     → AiInsightRecord[]
//   archiveInsight(uuid)                          → AiInsightRecord
//   expireInsight(uuid)                           → AiInsightRecord
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   evidence_score              → Global Evidence Service
//   trust update                → Global Trust Service
//   audit log                   → Global Audit Trail Service
//   activity log                → Global Activity Service
//   search index                → Global Search Service
//   source_module: 'livestock'  → Livestock module
//   source_module: 'feed'       → Feed module
//   source_module: 'medicine'   → Medicine module
//   source_module: 'marketplace'→ Marketplace module
//   source_module: 'transaction'→ Global Transaction Service
//
// SIAP DIGUNAKAN OLEH:
//   ✓ Livestock     — source_module: 'livestock'
//   ✓ Batch         — source_module: 'batch'
//   ✓ Feed          — source_module: 'feed' / 'feed_formula' / 'feed_stock'
//   ✓ Medicine      — source_module: 'medicine' / 'medicine_stock'
//   ✓ Health        — source_module: 'health'
//   ✓ Reproduksi    — source_module: 'reproduksi'
//   ✓ Marketplace   — source_module: 'marketplace'
//   ✓ Transaction   — source_module: 'transaction'
//   ✓ Trust Engine  — source_module: 'trust'
//   ✓ Verification  — source_module: 'verification'
//   ✓ News & Event  — source_module: 'news_event'
//   ✓ System        — source_module: 'system'
// ─────────────────────────────────────────────────────────────────────────────

import {
  type AiInsightRecord,
  type CreateInsightInput,
  type GetInsightFilter,
  type InsightSourceModule,
  type InsightGeneratedBy,
  INSIGHT_TYPE_UUID,
  INSIGHT_STATUS_UUID,
  INSIGHT_PRIORITY_UUID,
  _insertInsight,
  _replaceInsight,
  _getAllInsights,
  GLOBAL_AI_INSIGHT_DB,
  generateUUID,
} from '../data/globalAiInsightData';

// Re-export types & konstanta agar consumer tidak import dari data layer langsung.
export type {
  AiInsightRecord,
  CreateInsightInput,
  GetInsightFilter,
  InsightSourceModule,
  InsightGeneratedBy,
};
export { INSIGHT_TYPE_UUID, INSIGHT_STATUS_UUID, INSIGHT_PRIORITY_UUID };

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Membuat insight baru dan menyimpannya ke store global.
 * Mengembalikan record yang baru dibuat.
 *
 * GUARD:
 *   • title tidak boleh kosong.
 *   • summary tidak boleh kosong.
 *   • confidence_score harus dalam rentang 0.00–1.00 jika disertakan.
 *   • evidence_score harus dalam rentang 0–100 jika disertakan.
 *
 * DEFAULT: priority = Normal, status = Active, generated_by = 'rule_based',
 *          generated_at = sekarang.
 *
 * @example
 * // Insight berat di bawah target (rule-based dari modul Livestock)
 * createInsight({
 *   insight_type_reference_uuid: INSIGHT_TYPE_UUID.WEIGHT,
 *   priority_reference_uuid:     INSIGHT_PRIORITY_UUID.HIGH,
 *   workspace_uuid:              wsUuid,
 *   entity_type_reference_uuid:  ENTITY_TYPE_UUID_LIVESTOCK,
 *   entity_uuid:                 livestock.id,
 *   title:       'Bobot Domba D-2026-042 Tidak Mencapai Target',
 *   summary:     'ADG 180 g/hari — 28% di bawah target 250 g/hari selama 14 hari.',
 *   description: 'Berdasarkan 4 data timbang terakhir...',
 *   recommendation: 'Evaluasi komposisi pakan dan cek kondisi kesehatan.',
 *   confidence_score: 0.92,
 *   source_module:   'livestock',
 *   generated_by:    'rule_based',
 * });
 *
 * // Warning stok kritis (dari modul Feed Stock)
 * createInsight({
 *   insight_type_reference_uuid: INSIGHT_TYPE_UUID.INVENTORY,
 *   priority_reference_uuid:     INSIGHT_PRIORITY_UUID.CRITICAL,
 *   workspace_uuid:              wsUuid,
 *   title:       'Stok Dedak Padi Kritis',
 *   summary:     'Sisa stok 12 kg — cukup untuk 2 hari dengan konsumsi normal.',
 *   recommendation: 'Lakukan pemesanan segera.',
 *   confidence_score: 1.0,
 *   source_module:   'feed_stock',
 *   generated_by:    'rule_based',
 *   expired_at:      nextWeekIso,
 * });
 */
export function createInsight(input: CreateInsightInput): AiInsightRecord {
  if (!input.title.trim()) {
    throw new Error('[GlobalAiInsightService] title tidak boleh kosong.');
  }
  if (!input.summary.trim()) {
    throw new Error('[GlobalAiInsightService] summary tidak boleh kosong.');
  }
  if (
    input.confidence_score !== null &&
    input.confidence_score !== undefined &&
    (input.confidence_score < 0 || input.confidence_score > 1)
  ) {
    throw new Error(
      `[GlobalAiInsightService] confidence_score harus 0.00–1.00. Diterima: ${input.confidence_score}.`,
    );
  }
  if (
    input.evidence_score !== null &&
    input.evidence_score !== undefined &&
    (input.evidence_score < 0 || input.evidence_score > 100)
  ) {
    throw new Error(
      `[GlobalAiInsightService] evidence_score harus 0–100. Diterima: ${input.evidence_score}.`,
    );
  }

  const now = new Date().toISOString();

  const record: AiInsightRecord = {
    insight_uuid:                   generateUUID(),
    insight_type_reference_uuid:    input.insight_type_reference_uuid,
    insight_status_reference_uuid:  INSIGHT_STATUS_UUID.ACTIVE,
    priority_reference_uuid:        input.priority_reference_uuid ?? INSIGHT_PRIORITY_UUID.NORMAL,
    workspace_uuid:                 input.workspace_uuid ?? null,
    entity_type_reference_uuid:     input.entity_type_reference_uuid ?? null,
    entity_uuid:                    input.entity_uuid ?? null,
    title:                          input.title.trim(),
    summary:                        input.summary.trim(),
    description:                    input.description ?? null,
    recommendation:                 input.recommendation ?? null,
    confidence_score:               input.confidence_score !== undefined
                                      ? (input.confidence_score !== null
                                          ? Math.round(input.confidence_score * 1000) / 1000
                                          : null)
                                      : null,
    evidence_score:                 input.evidence_score !== undefined
                                      ? (input.evidence_score !== null
                                          ? Math.round(input.evidence_score * 100) / 100
                                          : null)
                                      : null,
    generated_by:                   input.generated_by ?? 'rule_based',
    source_module:                  input.source_module,
    generated_at:                   input.generated_at ?? now,
    expired_at:                     input.expired_at ?? null,
    created_at:                     now,
    updated_at:                     now,
  };

  _insertInsight(record);
  return record;
}

/**
 * Mengembalikan satu insight record berdasarkan UUID.
 * Mengembalikan undefined jika tidak ditemukan.
 *
 * @example
 * const insight = getInsightByUuid('uuid-insight-xxx');
 */
export function getInsightByUuid(uuid: string): AiInsightRecord | undefined {
  return GLOBAL_AI_INSIGHT_DB.get(uuid);
}

/**
 * Mengembalikan daftar insight sesuai filter.
 * Hasil diurutkan berdasarkan:
 *   1. priority desc (Critical → High → Normal → Low)
 *   2. generated_at desc (terbaru lebih awal)
 *
 * Default: hanya insight dengan status Active.
 *
 * @example
 * // Semua insight aktif untuk workspace
 * getInsight({ workspace_uuid: wsUuid });
 *
 * // Hanya Warning dengan prioritas tinggi
 * getInsight({
 *   insight_type_reference_uuid: INSIGHT_TYPE_UUID.WARNING,
 *   priority_reference_uuid:     INSIGHT_PRIORITY_UUID.HIGH,
 * });
 *
 * // Insight bulan ini dari modul livestock
 * getInsight({
 *   source_module: 'livestock',
 *   from_date:     '2026-07-01T00:00:00Z',
 *   limit:         20,
 * });
 */
export function getInsight(filters: GetInsightFilter = {}): AiInsightRecord[] {
  return _queryInsights(filters);
}

/**
 * Mengembalikan semua insight untuk workspace tertentu.
 * Filter tambahan dapat diberikan untuk mempersempit hasil.
 *
 * @example
 * getInsightsByWorkspace(wsUuid);
 * getInsightsByWorkspace(wsUuid, { insight_type_reference_uuid: INSIGHT_TYPE_UUID.WARNING });
 */
export function getInsightsByWorkspace(
  workspaceUuid: string,
  filters: Omit<GetInsightFilter, 'workspace_uuid'> = {},
): AiInsightRecord[] {
  return _queryInsights({ ...filters, workspace_uuid: workspaceUuid });
}

/**
 * Mengembalikan semua insight dari source_module tertentu.
 * Filter tambahan dapat diberikan untuk mempersempit hasil.
 *
 * @example
 * getInsightsByModule('livestock');
 * getInsightsByModule('marketplace', { priority_reference_uuid: INSIGHT_PRIORITY_UUID.HIGH });
 */
export function getInsightsByModule(
  module: InsightSourceModule,
  filters: Omit<GetInsightFilter, 'source_module'> = {},
): AiInsightRecord[] {
  return _queryInsights({ ...filters, source_module: module });
}

/**
 * Mengembalikan semua insight yang merujuk entity spesifik
 * (kombinasi entity_type × entity_uuid).
 * Berguna untuk menampilkan riwayat insight suatu entity di halaman detailnya.
 * Hasil diurutkan dari yang terbaru.
 *
 * @example
 * getInsightsByEntity(ENTITY_TYPE_UUID_LIVESTOCK, livestock.id);
 */
export function getInsightsByEntity(
  entityTypeUuid: string,
  entityUuid: string,
): AiInsightRecord[] {
  return _queryInsights({
    entity_type_reference_uuid: entityTypeUuid,
    entity_uuid:                entityUuid,
    active_only:                false,
    include_expired:            true,
  });
}

/**
 * Mengarsipkan insight — disembunyikan dari feed aktif tetapi tetap tersimpan.
 * Idempotent pada insight yang sudah diarsipkan.
 * Melempar Error jika insight sudah Expired atau tidak ditemukan.
 *
 * @example
 * archiveInsight('uuid-insight-xxx');
 */
export function archiveInsight(uuid: string): AiInsightRecord {
  const existing = _getOrThrow(uuid);

  // Idempotent
  if (existing.insight_status_reference_uuid === INSIGHT_STATUS_UUID.ARCHIVED) {
    return existing;
  }

  if (existing.insight_status_reference_uuid === INSIGHT_STATUS_UUID.EXPIRED) {
    throw new Error(
      `[GlobalAiInsightService] Insight "${uuid}" sudah Expired — tidak dapat diarsipkan.`,
    );
  }

  const now = new Date().toISOString();
  const updated: AiInsightRecord = {
    ...existing,
    insight_status_reference_uuid: INSIGHT_STATUS_UUID.ARCHIVED,
    updated_at: now,
  };

  _replaceInsight(updated);
  return updated;
}

/**
 * Menandai insight sebagai kedaluwarsa (Expired).
 * Digunakan baik untuk ekspirasi manual maupun otomatis oleh sistem.
 * Idempotent pada insight yang sudah Expired.
 * Melempar Error jika insight tidak ditemukan.
 *
 * @example
 * expireInsight('uuid-insight-xxx');
 */
export function expireInsight(uuid: string): AiInsightRecord {
  const existing = _getOrThrow(uuid);

  // Idempotent
  if (existing.insight_status_reference_uuid === INSIGHT_STATUS_UUID.EXPIRED) {
    return existing;
  }

  const now = new Date().toISOString();
  const updated: AiInsightRecord = {
    ...existing,
    insight_status_reference_uuid: INSIGHT_STATUS_UUID.EXPIRED,
    expired_at:                    existing.expired_at ?? now,
    updated_at:                    now,
  };

  _replaceInsight(updated);
  return updated;
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

function _getOrThrow(uuid: string): AiInsightRecord {
  const record = GLOBAL_AI_INSIGHT_DB.get(uuid);
  if (!record) {
    throw new Error(
      `[GlobalAiInsightService] Insight tidak ditemukan: "${uuid}".`,
    );
  }
  return record;
}

/** Urutan priority untuk sorting (Critical → Low). */
const PRIORITY_ORDER: Record<string, number> = {
  'a9000001-0000-4000-a000-000000000004': 4, // Critical
  'a9000001-0000-4000-a000-000000000003': 3, // High
  'a9000001-0000-4000-a000-000000000002': 2, // Normal
  'a9000001-0000-4000-a000-000000000001': 1, // Low
};

function _queryInsights(filters: GetInsightFilter): AiInsightRecord[] {
  const {
    workspace_uuid,
    insight_type_reference_uuid,
    insight_status_reference_uuid,
    priority_reference_uuid,
    entity_type_reference_uuid,
    entity_uuid,
    source_module,
    generated_by,
    active_only     = true,
    include_expired = false,
    min_confidence,
    from_date,
    to_date,
    limit,
    offset = 0,
  } = filters;

  let records = _getAllInsights();

  // Status filter
  if (insight_status_reference_uuid !== undefined) {
    records = records.filter(
      (r) => r.insight_status_reference_uuid === insight_status_reference_uuid,
    );
  } else if (active_only) {
    records = records.filter(
      (r) => r.insight_status_reference_uuid === INSIGHT_STATUS_UUID.ACTIVE,
    );
  } else if (!include_expired) {
    records = records.filter(
      (r) => r.insight_status_reference_uuid !== INSIGHT_STATUS_UUID.EXPIRED,
    );
  }

  if (workspace_uuid !== undefined) {
    records = records.filter((r) => r.workspace_uuid === workspace_uuid);
  }
  if (insight_type_reference_uuid !== undefined) {
    records = records.filter(
      (r) => r.insight_type_reference_uuid === insight_type_reference_uuid,
    );
  }
  if (priority_reference_uuid !== undefined) {
    records = records.filter((r) => r.priority_reference_uuid === priority_reference_uuid);
  }
  if (entity_type_reference_uuid !== undefined) {
    records = records.filter(
      (r) => r.entity_type_reference_uuid === entity_type_reference_uuid,
    );
  }
  if (entity_uuid !== undefined) {
    records = records.filter((r) => r.entity_uuid === entity_uuid);
  }
  if (source_module !== undefined) {
    records = records.filter((r) => r.source_module === source_module);
  }
  if (generated_by !== undefined) {
    records = records.filter((r) => r.generated_by === generated_by);
  }
  if (min_confidence !== undefined) {
    records = records.filter(
      (r) => r.confidence_score !== null && r.confidence_score >= min_confidence,
    );
  }
  if (from_date !== undefined) {
    const from = new Date(from_date).getTime();
    records = records.filter((r) => new Date(r.generated_at).getTime() >= from);
  }
  if (to_date !== undefined) {
    const to = new Date(to_date).getTime();
    records = records.filter((r) => new Date(r.generated_at).getTime() <= to);
  }

  // Auto-expire: insight melewati expired_at → tandai Expired di store
  const now = new Date().toISOString();
  records = records.map((r) => {
    if (
      r.expired_at !== null &&
      r.expired_at < now &&
      r.insight_status_reference_uuid === INSIGHT_STATUS_UUID.ACTIVE
    ) {
      const expired: AiInsightRecord = {
        ...r,
        insight_status_reference_uuid: INSIGHT_STATUS_UUID.EXPIRED,
        updated_at: now,
      };
      _replaceInsight(expired);
      return expired;
    }
    return r;
  });

  // Setelah auto-expire, terapkan ulang filter active_only jika perlu
  if (active_only && insight_status_reference_uuid === undefined) {
    records = records.filter(
      (r) => r.insight_status_reference_uuid === INSIGHT_STATUS_UUID.ACTIVE,
    );
  }

  // Sort: priority desc, then generated_at desc
  records = [...records].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority_reference_uuid] ?? 0;
    const pb = PRIORITY_ORDER[b.priority_reference_uuid] ?? 0;
    if (pb !== pa) return pb - pa;
    return new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime();
  });

  if (offset > 0) records = records.slice(offset);
  if (limit !== undefined && limit > 0) records = records.slice(0, limit);

  return records;
}
