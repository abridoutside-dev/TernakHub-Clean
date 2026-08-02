// ─── Global Trust Data — FOUNDATION-GLOBAL-TRUST-001 ─────────────────────────
//
// Single Source of Truth untuk seluruh trust score entity TernakHub.
//
// ATURAN:
//   • Trust dihitung secara sistematis dari 7 faktor — BUKAN diberikan manual.
//   • Trust BUKAN badge, BUKAN rating bintang, BUKAN like/follow.
//   • Akses hanya melalui globalTrustService.ts — tidak langsung ke DB atau _*.
//   • Setiap perhitungan ulang membuat TrustHistoryRecord baru (append-only).
//   • GLOBAL_TRUST_DB menyimpan satu record per (entity_type × entity_uuid) —
//     selalu state terkini.
//   • UUID seed bersifat stabil — jangan diregenerasi.
//
// FAKTOR PEMBENTUK TRUST (masing-masing 0–100):
//   evidence_score      — Bukti yang diunggah dan divalidasi (bobot 25%)
//   verification_score  — Status verifikasi identitas/dokumen (bobot 20%)
//   consistency_score   — Konsistensi data dan perilaku historis (bobot 15%)
//   activity_score      — Keaktifan di platform (bobot 15%)
//   transaction_score   — Riwayat transaksi berhasil (bobot 10%)
//   completeness_score  — Kelengkapan profil dan data (bobot 10%)
//   audit_score         — Rekam jejak audit trail bersih (bobot 5%)
//
// RELASI YANG DISIAPKAN (belum di-wire):
//   evidence_score      → Global Evidence Service
//   verification_score  → Global Verification (future)
//   consistency_score   → Global Audit Trail Service
//   activity_score      → Global Activity Service
//   transaction_score   → Global Transaction Service
//   completeness_score  → Global Reference + modul data
//   audit_score         → Global Audit Trail Service
// ─────────────────────────────────────────────────────────────────────────────

import { generateUUID } from '../utils/uuid';

// ─── Bobot Faktor ─────────────────────────────────────────────────────────────
// Jumlah total = 1.0 (100%).

export const TRUST_FACTOR_WEIGHTS = {
  evidence:     0.25,
  verification: 0.20,
  consistency:  0.15,
  activity:     0.15,
  transaction:  0.10,
  completeness: 0.10,
  audit:        0.05,
} as const;

// ─── Rentang Trust Level ──────────────────────────────────────────────────────
// Stabil — sesuai seed di globalReferenceData.ts.

export const TRUST_LEVEL_UUID = {
  LEVEL_1: 'b5000001-0000-4000-a000-000000000001', // 0–19
  LEVEL_2: 'b5000001-0000-4000-a000-000000000002', // 20–39
  LEVEL_3: 'b5000001-0000-4000-a000-000000000003', // 40–59
  LEVEL_4: 'b5000001-0000-4000-a000-000000000004', // 60–79
  LEVEL_5: 'b5000001-0000-4000-a000-000000000005', // 80–100
} as const;

export type TrustLevelUuid = (typeof TRUST_LEVEL_UUID)[keyof typeof TRUST_LEVEL_UUID];

/** Mengembalikan trust_level_reference_uuid berdasarkan trust_score (0–100). */
export function resolveTrustLevel(score: number): TrustLevelUuid {
  if (score >= 80) return TRUST_LEVEL_UUID.LEVEL_5;
  if (score >= 60) return TRUST_LEVEL_UUID.LEVEL_4;
  if (score >= 40) return TRUST_LEVEL_UUID.LEVEL_3;
  if (score >= 20) return TRUST_LEVEL_UUID.LEVEL_2;
  return TRUST_LEVEL_UUID.LEVEL_1;
}

// ─── UUID Konstanta — Entity Type ─────────────────────────────────────────────

export const ENTITY_TYPE_UUID = {
  WORKSPACE:            'b6000001-0000-4000-a000-000000000001',
  FARM:                 'b6000001-0000-4000-a000-000000000002',
  LIVESTOCK:            'b6000001-0000-4000-a000-000000000003',
  MARKETPLACE_LISTING:  'b6000001-0000-4000-a000-000000000004',
  SELLER:               'b6000001-0000-4000-a000-000000000005',
  BUYER:                'b6000001-0000-4000-a000-000000000006',
  TRANSPORT:            'b6000001-0000-4000-a000-000000000007',
  VETERINARY:           'b6000001-0000-4000-a000-000000000008',
} as const;

export type EntityTypeUuid = (typeof ENTITY_TYPE_UUID)[keyof typeof ENTITY_TYPE_UUID];

// ─── Schema — TrustRecord ─────────────────────────────────────────────────────

export interface TrustRecord {
  /** UUID v4 — primary key. Immutable setelah ditetapkan. */
  trust_uuid: string;

  /**
   * Jenis entity yang dinilai — UUID ke ENTITY_TYPE di Global Reference Service.
   * Gunakan ENTITY_TYPE_UUID untuk referensi stabil.
   */
  entity_type_reference_uuid: string;

  /**
   * UUID entity yang dinilai.
   * Contoh: workspace_uuid, livestock.id, listing_uuid.
   */
  entity_uuid: string;

  /**
   * Skor kepercayaan agregat — hasil bobot dari 7 faktor.
   * Rentang: 0.00–100.00 (dibulatkan 2 desimal).
   */
  trust_score: number;

  /**
   * Level kepercayaan berdasarkan trust_score — UUID ke TRUST_LEVEL.
   * Ditetapkan otomatis oleh resolveTrustLevel().
   */
  trust_level_reference_uuid: string;

  /**
   * Skor faktor Evidence (0–100).
   * Berasal dari Global Evidence Service — belum di-wire.
   * null = faktor belum dapat dievaluasi.
   */
  evidence_score: number | null;

  /**
   * Skor faktor Verification (0–100).
   * Berasal dari Global Verification (future service) — belum di-wire.
   * null = faktor belum dapat dievaluasi.
   */
  verification_score: number | null;

  /**
   * Skor faktor Consistency (0–100).
   * Berasal dari Global Audit Trail — belum di-wire.
   * null = faktor belum dapat dievaluasi.
   */
  consistency_score: number | null;

  /**
   * Skor faktor Activity (0–100).
   * Berasal dari Global Activity Service — belum di-wire.
   * null = faktor belum dapat dievaluasi.
   */
  activity_score: number | null;

  /**
   * Skor faktor Transaction (0–100).
   * Berasal dari Global Transaction Service — belum di-wire.
   * null = faktor belum dapat dievaluasi.
   */
  transaction_score: number | null;

  /**
   * Skor faktor Completeness (0–100).
   * Berasal dari kelengkapan data profil dan referensi — belum di-wire.
   * null = faktor belum dapat dievaluasi.
   */
  completeness_score: number | null;

  /**
   * Skor faktor Audit (0–100).
   * Berasal dari Global Audit Trail — belum di-wire.
   * null = faktor belum dapat dievaluasi.
   */
  audit_score: number | null;

  /** Timestamp ISO 8601 saat trust_score terakhir dihitung. */
  calculated_at: string;

  /** Timestamp ISO 8601 saat record pertama kali dibuat. */
  created_at: string;

  /** Timestamp ISO 8601 saat record terakhir diperbarui. */
  updated_at: string;
}

// ─── Schema — TrustHistoryRecord ─────────────────────────────────────────────
// Append-only — setiap kalkulasi ulang menghasilkan satu entry baru.

export interface TrustHistoryRecord {
  /** UUID v4 — primary key histori. Immutable. */
  history_uuid: string;

  /** UUID TrustRecord yang di-recalculate. */
  trust_uuid: string;

  /** UUID entity yang dinilai — denormalized untuk query efisien. */
  entity_uuid: string;

  /** UUID entity type — denormalized untuk query efisien. */
  entity_type_reference_uuid: string;

  /** Trust score pada saat kalkulasi ini. */
  trust_score: number;

  /** Trust level UUID pada saat kalkulasi ini. */
  trust_level_reference_uuid: string;

  /** Snapshot 7 sub-scores pada saat kalkulasi. */
  factor_snapshot: {
    evidence:     number | null;
    verification: number | null;
    consistency:  number | null;
    activity:     number | null;
    transaction:  number | null;
    completeness: number | null;
    audit:        number | null;
  };

  /**
   * Alasan pemicu kalkulasi ulang.
   * Contoh: 'evidence_added', 'manual_recalculate', 'transaction_completed'.
   * null = tidak ada alasan spesifik.
   */
  trigger_reason: string | null;

  /** Timestamp ISO 8601 saat kalkulasi ini dilakukan. */
  calculated_at: string;
}

// ─── Input untuk calculateTrust / recalculateTrust ───────────────────────────

export interface TrustFactorInput {
  /** Skor faktor Evidence (0–100). null = tidak tersedia. */
  evidence_score?: number | null;
  /** Skor faktor Verification (0–100). null = tidak tersedia. */
  verification_score?: number | null;
  /** Skor faktor Consistency (0–100). null = tidak tersedia. */
  consistency_score?: number | null;
  /** Skor faktor Activity (0–100). null = tidak tersedia. */
  activity_score?: number | null;
  /** Skor faktor Transaction (0–100). null = tidak tersedia. */
  transaction_score?: number | null;
  /** Skor faktor Completeness (0–100). null = tidak tersedia. */
  completeness_score?: number | null;
  /** Skor faktor Audit (0–100). null = tidak tersedia. */
  audit_score?: number | null;
}

export interface CalculateTrustInput {
  entity_type_reference_uuid: string;
  entity_uuid: string;
  factors: TrustFactorInput;
  /** Alasan pemicu kalkulasi. null = tidak ada alasan spesifik. */
  trigger_reason?: string | null;
}

// ─── Filter untuk getTrust ────────────────────────────────────────────────────

export interface GetTrustFilter {
  /** Filter berdasarkan entity_type_reference_uuid. */
  entity_type_reference_uuid?: string;
  /** Filter berdasarkan trust_level_reference_uuid. */
  trust_level_reference_uuid?: string;
  /** Hanya entity dengan trust_score ≥ nilai ini. */
  min_score?: number;
  /** Hanya entity dengan trust_score ≤ nilai ini. */
  max_score?: number;
  /** Maksimum jumlah record yang dikembalikan. */
  limit?: number;
  /** Offset untuk pagination. Default: 0. */
  offset?: number;
}

// ─── In-Memory Stores ─────────────────────────────────────────────────────────
// INTERNAL — akses hanya melalui globalTrustService.ts.

/**
 * Keyed by `${entity_type_reference_uuid}::${entity_uuid}` untuk O(1) lookup
 * dan memastikan satu record per kombinasi (entity_type × entity_uuid).
 */
export const GLOBAL_TRUST_DB: Map<string, TrustRecord> = new Map();

/** Append-only — seluruh riwayat kalkulasi. */
export const GLOBAL_TRUST_HISTORY_DB: TrustHistoryRecord[] = [];

// ─── Internal Helpers (package-private) ───────────────────────────────────────

export function _trustKey(entityTypeUuid: string, entityUuid: string): string {
  return `${entityTypeUuid}::${entityUuid}`;
}

export function _insertTrust(record: TrustRecord): void {
  GLOBAL_TRUST_DB.set(_trustKey(record.entity_type_reference_uuid, record.entity_uuid), record);
}

export function _replaceTrust(record: TrustRecord): void {
  GLOBAL_TRUST_DB.set(_trustKey(record.entity_type_reference_uuid, record.entity_uuid), record);
}

export function _getAllTrusts(): TrustRecord[] {
  return Array.from(GLOBAL_TRUST_DB.values());
}

export function _appendTrustHistory(record: TrustHistoryRecord): void {
  GLOBAL_TRUST_HISTORY_DB.push(record);
}

// Re-export generateUUID agar service layer tidak import dari utils langsung.
export { generateUUID };
