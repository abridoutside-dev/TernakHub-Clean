// ─── Global Trust Service — FOUNDATION-GLOBAL-TRUST-001 ──────────────────────
//
// Satu-satunya entry point yang boleh digunakan modul lain untuk menghitung
// atau membaca trust score entity di TernakHub.
//
// PRINSIP:
//   1. Trust dihitung SECARA SISTEMATIS dari 7 faktor — tidak diberikan manual.
//   2. Trust BUKAN badge, BUKAN rating bintang, BUKAN like/follow.
//   3. Setiap kalkulasi (baru atau ulang) dicatat ke TrustHistoryRecord.
//   4. GLOBAL_TRUST_DB menyimpan satu record per (entity_type × entity_uuid).
//   5. Marketplace, UI, badge, dan workflow TIDAK diubah oleh service ini.
//   6. Wiring/sync ke modul lain BELUM dilakukan — disiapkan sebagai relasi.
//
// FAKTOR PEMBENTUK TRUST (bobot masing-masing):
//   evidence_score      25% — bukti tervalidasi (Global Evidence)
//   verification_score  20% — status verifikasi identitas/dokumen
//   consistency_score   15% — konsistensi data historis (Audit Trail)
//   activity_score      15% — keaktifan di platform (Global Activity)
//   transaction_score   10% — riwayat transaksi berhasil (Global Transaction)
//   completeness_score  10% — kelengkapan profil dan data
//   audit_score          5% — rekam jejak audit trail bersih
//
// API PUBLIK:
//   calculateTrust(input)                      → TrustRecord
//   getTrust(filters?)                         → TrustRecord[]
//   getTrustByEntity(entityTypeUuid, entityUuid) → TrustRecord | undefined
//   getTrustHistory(entityUuid, entityTypeUuid?) → TrustHistoryRecord[]
//   recalculateTrust(input)                    → TrustRecord
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   evidence_score      → Global Evidence Service (globalEvidenceService.ts)
//   verification_score  → Global Verification (future service)
//   consistency_score   → Global Audit Trail Service (globalAuditTrailService.ts)
//   activity_score      → Global Activity Service (globalActivityService.ts)
//   transaction_score   → Global Transaction Service (globalTransactionService.ts)
//   completeness_score  → Global Reference + modul data
//   audit_score         → Global Audit Trail Service (globalAuditTrailService.ts)
//
// SIAP DIGUNAKAN OLEH:
//   ✓ Workspace          — ENTITY_TYPE_UUID.WORKSPACE
//   ✓ Farm               — ENTITY_TYPE_UUID.FARM
//   ✓ Livestock          — ENTITY_TYPE_UUID.LIVESTOCK
//   ✓ Marketplace Listing — ENTITY_TYPE_UUID.MARKETPLACE_LISTING
//   ✓ Seller             — ENTITY_TYPE_UUID.SELLER
//   ✓ Buyer              — ENTITY_TYPE_UUID.BUYER
//   ✓ Transport          — ENTITY_TYPE_UUID.TRANSPORT
//   ✓ Veterinary         — ENTITY_TYPE_UUID.VETERINARY
// ─────────────────────────────────────────────────────────────────────────────

import {
  type TrustRecord,
  type TrustHistoryRecord,
  type CalculateTrustInput,
  type TrustFactorInput,
  type GetTrustFilter,
  TRUST_LEVEL_UUID,
  ENTITY_TYPE_UUID,
  TRUST_FACTOR_WEIGHTS,
  resolveTrustLevel,
  _trustKey,
  _insertTrust,
  _replaceTrust,
  _getAllTrusts,
  _appendTrustHistory,
  GLOBAL_TRUST_DB,
  GLOBAL_TRUST_HISTORY_DB,
  generateUUID,
} from '../data/globalTrustData';

// Re-export types & konstanta agar consumer tidak import dari data layer langsung.
export type { TrustRecord, TrustHistoryRecord, CalculateTrustInput, TrustFactorInput, GetTrustFilter };
export { TRUST_LEVEL_UUID, ENTITY_TYPE_UUID, TRUST_FACTOR_WEIGHTS };

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Menghitung trust score untuk entity baru dan menyimpannya ke store.
 * Jika entity sudah memiliki TrustRecord, melempar Error — gunakan
 * recalculateTrust() untuk perhitungan ulang.
 *
 * Trust score dihitung sebagai rata-rata berbobot dari 7 faktor.
 * Faktor dengan nilai null dikecualikan dari perhitungan (bobot didistribusikan ulang
 * secara proporsional ke faktor yang tersedia).
 *
 * Setiap kalkulasi menghasilkan satu TrustHistoryRecord (append-only).
 *
 * @example
 * // Hitung trust workspace baru dengan data completeness saja
 * calculateTrust({
 *   entity_type_reference_uuid: ENTITY_TYPE_UUID.WORKSPACE,
 *   entity_uuid: wsUuid,
 *   factors: { completeness_score: 60 },
 *   trigger_reason: 'workspace_created',
 * });
 *
 * // Hitung trust livestock dengan beberapa faktor
 * calculateTrust({
 *   entity_type_reference_uuid: ENTITY_TYPE_UUID.LIVESTOCK,
 *   entity_uuid: livestock.id,
 *   factors: {
 *     evidence_score: 75,
 *     completeness_score: 80,
 *     activity_score: 50,
 *   },
 *   trigger_reason: 'livestock_registered',
 * });
 */
export function calculateTrust(input: CalculateTrustInput): TrustRecord {
  const key = _trustKey(input.entity_type_reference_uuid, input.entity_uuid);

  if (GLOBAL_TRUST_DB.has(key)) {
    throw new Error(
      `[GlobalTrustService] TrustRecord sudah ada untuk entity "${input.entity_uuid}" ` +
        `(type: "${input.entity_type_reference_uuid}"). Gunakan recalculateTrust().`,
    );
  }

  return _compute(input, null);
}

/**
 * Mengembalikan daftar trust record sesuai filter.
 * Hasil diurutkan berdasarkan trust_score descending (tertinggi lebih awal).
 *
 * @example
 * // Semua trust score Workspace
 * getTrust({ entity_type_reference_uuid: ENTITY_TYPE_UUID.WORKSPACE });
 *
 * // Hanya entity dengan score tinggi
 * getTrust({ min_score: 60 });
 *
 * // Leaderboard 10 Seller terbaik
 * getTrust({
 *   entity_type_reference_uuid: ENTITY_TYPE_UUID.SELLER,
 *   min_score: 0,
 *   limit: 10,
 * });
 */
export function getTrust(filters: GetTrustFilter = {}): TrustRecord[] {
  const {
    entity_type_reference_uuid,
    trust_level_reference_uuid,
    min_score,
    max_score,
    limit,
    offset = 0,
  } = filters;

  let records = _getAllTrusts();

  if (entity_type_reference_uuid !== undefined) {
    records = records.filter((r) => r.entity_type_reference_uuid === entity_type_reference_uuid);
  }
  if (trust_level_reference_uuid !== undefined) {
    records = records.filter((r) => r.trust_level_reference_uuid === trust_level_reference_uuid);
  }
  if (min_score !== undefined) {
    records = records.filter((r) => r.trust_score >= min_score);
  }
  if (max_score !== undefined) {
    records = records.filter((r) => r.trust_score <= max_score);
  }

  // Urutkan berdasarkan trust_score descending
  records = [...records].sort((a, b) => b.trust_score - a.trust_score);

  if (offset > 0) records = records.slice(offset);
  if (limit !== undefined && limit > 0) records = records.slice(0, limit);

  return records;
}

/**
 * Mengembalikan TrustRecord untuk entity spesifik.
 * Mengembalikan undefined jika belum pernah dihitung.
 *
 * @example
 * const trust = getTrustByEntity(ENTITY_TYPE_UUID.LIVESTOCK, livestock.id);
 * console.log(trust?.trust_score); // 67.5
 */
export function getTrustByEntity(
  entityTypeUuid: string,
  entityUuid: string,
): TrustRecord | undefined {
  return GLOBAL_TRUST_DB.get(_trustKey(entityTypeUuid, entityUuid));
}

/**
 * Mengembalikan seluruh riwayat kalkulasi trust untuk entity tertentu.
 * Hasil diurutkan dari yang terbaru (calculated_at descending).
 * Opsional: filter berdasarkan entity_type_reference_uuid juga.
 *
 * Berguna untuk:
 *   - Melihat tren kepercayaan suatu entity dari waktu ke waktu.
 *   - Debugging perhitungan trust.
 *   - Audit trail perubahan trust score.
 *
 * @example
 * // Semua riwayat trust score workspace tertentu
 * getTrustHistory(workspaceUuid, ENTITY_TYPE_UUID.WORKSPACE);
 *
 * // Semua riwayat trust score entity (lintas type)
 * getTrustHistory(entityUuid);
 */
export function getTrustHistory(
  entityUuid: string,
  entityTypeUuid?: string,
): TrustHistoryRecord[] {
  let records = GLOBAL_TRUST_HISTORY_DB.filter((h) => h.entity_uuid === entityUuid);

  if (entityTypeUuid !== undefined) {
    records = records.filter((h) => h.entity_type_reference_uuid === entityTypeUuid);
  }

  return [...records].sort(
    (a, b) => new Date(b.calculated_at).getTime() - new Date(a.calculated_at).getTime(),
  );
}

/**
 * Menghitung ulang trust score untuk entity yang sudah ada.
 * Jika entity belum memiliki TrustRecord, melempar Error — gunakan
 * calculateTrust() untuk kalkulasi pertama.
 *
 * Faktor yang tidak disertakan dalam input.factors akan diambil dari
 * nilai sebelumnya (persist dari kalkulasi terakhir).
 * Untuk mereset faktor ke null, sertakan eksplisit: { evidence_score: null }.
 *
 * Setiap kalkulasi ulang menghasilkan satu TrustHistoryRecord baru.
 *
 * @example
 * // Setelah evidence baru diunggah, perbarui evidence_score
 * recalculateTrust({
 *   entity_type_reference_uuid: ENTITY_TYPE_UUID.SELLER,
 *   entity_uuid: sellerWsUuid,
 *   factors: { evidence_score: 85 },
 *   trigger_reason: 'evidence_added',
 * });
 *
 * // Setelah transaksi berhasil diselesaikan
 * recalculateTrust({
 *   entity_type_reference_uuid: ENTITY_TYPE_UUID.SELLER,
 *   entity_uuid: sellerWsUuid,
 *   factors: { transaction_score: 70, activity_score: 65 },
 *   trigger_reason: 'transaction_completed',
 * });
 */
export function recalculateTrust(input: CalculateTrustInput): TrustRecord {
  const key = _trustKey(input.entity_type_reference_uuid, input.entity_uuid);
  const existing = GLOBAL_TRUST_DB.get(key);

  if (!existing) {
    throw new Error(
      `[GlobalTrustService] TrustRecord tidak ditemukan untuk entity "${input.entity_uuid}" ` +
        `(type: "${input.entity_type_reference_uuid}"). Gunakan calculateTrust() terlebih dahulu.`,
    );
  }

  // Merge faktor lama dengan faktor baru (faktor baru menimpa yang lama)
  const mergedFactors: TrustFactorInput = {
    evidence_score:     input.factors.evidence_score     !== undefined ? input.factors.evidence_score     : existing.evidence_score,
    verification_score: input.factors.verification_score !== undefined ? input.factors.verification_score : existing.verification_score,
    consistency_score:  input.factors.consistency_score  !== undefined ? input.factors.consistency_score  : existing.consistency_score,
    activity_score:     input.factors.activity_score     !== undefined ? input.factors.activity_score     : existing.activity_score,
    transaction_score:  input.factors.transaction_score  !== undefined ? input.factors.transaction_score  : existing.transaction_score,
    completeness_score: input.factors.completeness_score !== undefined ? input.factors.completeness_score : existing.completeness_score,
    audit_score:        input.factors.audit_score        !== undefined ? input.factors.audit_score        : existing.audit_score,
  };

  return _compute(
    { ...input, factors: mergedFactors },
    existing,
  );
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

/**
 * Menghitung trust_score dari faktor menggunakan rata-rata berbobot.
 * Faktor dengan nilai null dikecualikan dan bobotnya didistribusikan ulang
 * secara proporsional ke faktor yang tersedia.
 *
 * Jika SEMUA faktor null, trust_score = 0.
 */
function _computeScore(factors: TrustFactorInput): number {
  type FactorKey = keyof typeof TRUST_FACTOR_WEIGHTS;

  const entries: Array<{ key: FactorKey; value: number; weight: number }> = [];

  (Object.keys(TRUST_FACTOR_WEIGHTS) as FactorKey[]).forEach((key) => {
    const value = factors[`${key}_score` as keyof TrustFactorInput];
    if (value !== null && value !== undefined) {
      entries.push({ key, value: Math.min(100, Math.max(0, value)), weight: TRUST_FACTOR_WEIGHTS[key] });
    }
  });

  if (entries.length === 0) return 0;

  // Jumlah bobot faktor yang tersedia
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);

  // Rata-rata berbobot (renormalisasi ke total bobot yang tersedia)
  const weightedSum = entries.reduce((sum, e) => sum + e.value * (e.weight / totalWeight), 0);

  // Bulatkan ke 2 desimal
  return Math.round(weightedSum * 100) / 100;
}

/**
 * Core compute: membuat atau memperbarui TrustRecord + mencatat TrustHistoryRecord.
 */
function _compute(
  input: CalculateTrustInput,
  existing: TrustRecord | null,
): TrustRecord {
  const now = new Date().toISOString();
  const score = _computeScore(input.factors);
  const level = resolveTrustLevel(score);

  const trustUuid = existing?.trust_uuid ?? generateUUID();

  const record: TrustRecord = {
    trust_uuid:                 trustUuid,
    entity_type_reference_uuid: input.entity_type_reference_uuid,
    entity_uuid:                input.entity_uuid,
    trust_score:                score,
    trust_level_reference_uuid: level,
    evidence_score:             input.factors.evidence_score     ?? null,
    verification_score:         input.factors.verification_score ?? null,
    consistency_score:          input.factors.consistency_score  ?? null,
    activity_score:             input.factors.activity_score     ?? null,
    transaction_score:          input.factors.transaction_score  ?? null,
    completeness_score:         input.factors.completeness_score ?? null,
    audit_score:                input.factors.audit_score        ?? null,
    calculated_at:              now,
    created_at:                 existing?.created_at ?? now,
    updated_at:                 now,
  };

  if (existing) {
    _replaceTrust(record);
  } else {
    _insertTrust(record);
  }

  // Append history entry
  const history: TrustHistoryRecord = {
    history_uuid:               generateUUID(),
    trust_uuid:                 trustUuid,
    entity_uuid:                input.entity_uuid,
    entity_type_reference_uuid: input.entity_type_reference_uuid,
    trust_score:                score,
    trust_level_reference_uuid: level,
    factor_snapshot: {
      evidence:     input.factors.evidence_score     ?? null,
      verification: input.factors.verification_score ?? null,
      consistency:  input.factors.consistency_score  ?? null,
      activity:     input.factors.activity_score     ?? null,
      transaction:  input.factors.transaction_score  ?? null,
      completeness: input.factors.completeness_score ?? null,
      audit:        input.factors.audit_score        ?? null,
    },
    trigger_reason: input.trigger_reason ?? null,
    calculated_at:  now,
  };

  _appendTrustHistory(history);
  return record;
}
