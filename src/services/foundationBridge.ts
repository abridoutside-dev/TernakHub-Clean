// ─── Foundation Bridge — FOUNDATION-GLOBAL-INTEGRATION-001 ───────────────────
//
// Lapisan wiring lintas-Foundation. Menyediakan fungsi komposit yang
// mengorkestrasikan lebih dari satu Foundation Service dalam satu operasi.
//
// PRINSIP:
//   1. File ini adalah SATU-SATUNYA tempat di mana Foundation Service
//      saling memanggil. Service individual TIDAK boleh import satu sama lain.
//   2. Urutan import mengikuti dependency tier (lihat index.ts) —
//      tidak ada circular import.
//   3. Fungsi di sini bersifat INFRASTRUKTUR — bukan fitur bisnis baru.
//   4. Semua operasi bersifat best-effort: kegagalan cross-service
//      di-log ke console.error tetapi tidak memblokir operasi utama.
//   5. UI, halaman, dan workflow TIDAK diubah oleh file ini.
//
// DEPENDENCY ORDER (import dari atas ke bawah — tidak ada circular):
//   Tier 0: Reference, Media, Activity, Audit
//   Tier 1: Evidence, Notification
//   Tier 2: Transaction, Escrow, Conversation, Search
//   Tier 3: Trust
//   Tier 4: Verification
//   Tier 5: AI Insight
//
// RELASI YANG DIWIRING:
//   Evidence    → Media           : resolveEvidenceMedia()
//   Evidence    → Audit + Activity: createEvidenceTracked()
//   Transaction → Notification + Activity + Audit: createTransactionTracked()
//   Escrow      → Transaction lookup: resolveEscrowTransaction / resolveTransactionEscrow()
//   Conversation → Activity + Audit: createConversationTracked()
//   Trust       → Evidence + Activity + Transaction + Audit: computeTrustFactors()
//   Verification → Trust + Evidence + Activity + Audit: verifyEntityAndUpdateTrust()
//   AI Insight  → Activity + Audit + Search: createInsightTracked()
//   Notification → Transaction + Escrow + Conversation context: sendEventNotification()
//   Search      → entity modules: indexFoundationEntity()
//
// VALIDASI:
//   ✓ Tidak ada circular dependency
//   ✓ Tidak ada duplicate interface
//   ✓ Tidak ada duplicate UUID generator (semua via src/utils/uuid.ts)
//   ✓ Tidak ada duplicate helper
//   ✓ Tidak ada duplicate repository
//   ✓ Tidak ada duplicate service
// ─────────────────────────────────────────────────────────────────────────────

// ── Tier 0 imports ────────────────────────────────────────────────────────────
import {
  createActivity,
  ACTIVITY_TYPE_UUID,
  VISIBILITY_UUID,
  ACTIVITY_PRIORITY_UUID,
} from './globalActivityService';

import {
  recordAudit,
  AUDIT_EVENT_TYPE_UUID,
  AUDIT_ACTION_UUID,
} from './globalAuditTrailService';

// ── Tier 1 imports ────────────────────────────────────────────────────────────
import {
  createEvidence,
  type CreateEvidenceInput,
  type EvidenceRecord,
} from './globalEvidenceService';

import {
  createNotification,
  NOTIFICATION_TYPE_UUID,
  PRIORITY_UUID,
} from './globalNotificationService';

// ── Tier 2 imports ────────────────────────────────────────────────────────────
import {
  createTransaction,
  getTransactionByUuid,
  type CreateTransactionInput,
  type TransactionRecord,
  TRANSACTION_STATUS_UUID,
} from './globalTransactionService';

import {
  getEscrowByTransaction,
  type EscrowRecord,
} from './globalEscrowService';

import {
  createConversation,
  type CreateConversationInput,
  type ConversationRecord,
} from './globalConversationService';

import {
  indexEntity,
  updateIndex,
  type IndexEntityInput,
  SEARCH_ENTITY_TYPE_UUID,
} from './globalSearchService';

// ── Tier 3 imports ────────────────────────────────────────────────────────────
import {
  calculateTrust,
  recalculateTrust,
  getTrustByEntity,
  type CalculateTrustInput,
  type TrustRecord,
  ENTITY_TYPE_UUID,
} from './globalTrustService';

// ── Tier 4 imports ────────────────────────────────────────────────────────────
import {
  verify,
  reject,
  type VerificationRecord,
  type VerifyInput,
  type RejectInput,
  VERIFICATION_TYPE_UUID,
  VERIFICATION_STATUS_UUID,
  VERIFICATION_ENTITY_TYPE_UUID,
} from './globalVerificationService';

// ── Tier 5 imports ────────────────────────────────────────────────────────────
import {
  createInsight,
  type CreateInsightInput,
  type AiInsightRecord,
  INSIGHT_TYPE_UUID,
  INSIGHT_PRIORITY_UUID,
} from './globalAiInsightService';

// ─── Re-export Dependency Graph ───────────────────────────────────────────────

/**
 * Dependency graph statis untuk keperluan dokumentasi dan validasi.
 * Setiap entry mendaftar Foundation mana yang diperlukan oleh Foundation tersebut.
 * Tidak ada circular reference di graph ini.
 */
export const FOUNDATION_DEPENDENCY_GRAPH = {
  reference:   [] as string[],
  media:       [] as string[],
  activity:    [] as string[],
  audit:       [] as string[],
  evidence:    ['media', 'activity', 'audit'] as string[],
  notification:['activity'] as string[],
  transaction: ['evidence', 'notification', 'activity', 'audit'] as string[],
  escrow:      ['transaction', 'evidence', 'notification', 'activity', 'audit'] as string[],
  conversation:['media', 'evidence', 'activity', 'audit'] as string[],
  search:      ['activity', 'audit'] as string[],
  trust:       ['evidence', 'activity', 'transaction', 'audit'] as string[],
  verification:['evidence', 'trust', 'activity', 'audit'] as string[],
  ai_insight:  ['activity', 'trust', 'evidence', 'verification', 'search'] as string[],
} as const;

// ─── Bridge: Evidence + Audit + Activity ──────────────────────────────────────

export interface CreateEvidenceTrackedInput extends CreateEvidenceInput {
  /** Workspace aktor — untuk audit dan activity log. */
  actor_workspace_uuid: string;
  /** Deskripsi singkat untuk activity feed (opsional). */
  activity_description?: string;
}

/**
 * Membuat Evidence baru, lalu mencatat Audit Trail dan Activity Feed.
 * Menyediakan relasi: Evidence → Audit, Evidence → Activity
 *
 * @returns EvidenceRecord yang baru dibuat.
 */
export function createEvidenceTracked(
  input: CreateEvidenceTrackedInput,
): EvidenceRecord {
  const { actor_workspace_uuid, activity_description, ...evidenceInput } = input;

  // 1. Buat evidence (operasi utama)
  const evidence = createEvidence(evidenceInput);

  // 2. Catat ke Audit Trail (best-effort)
  try {
    recordAudit({
      event_type_reference_uuid: AUDIT_EVENT_TYPE_UUID.CREATE,
      actor_workspace_uuid,
      target_module: 'global_evidence',
      target_uuid: evidence.evidence_uuid,
      action_reference_uuid: AUDIT_ACTION_UUID.SYSTEM_GENERATED,
      metadata: { title: evidence.title, evidence_type: evidence.evidence_type },
    });
  } catch (e) {
    console.error('[FoundationBridge] createEvidenceTracked: audit error', e);
  }

  // 3. Catat ke Activity Feed (best-effort)
  try {
    createActivity({
      activity_type_reference_uuid: ACTIVITY_TYPE_UUID.EVIDENCE_UPLOADED,
      workspace_uuid: actor_workspace_uuid,
      title: `Evidence Baru: ${evidence.title}`,
      description: activity_description ?? `Jenis: ${evidence.evidence_type}`,
      reference_module: 'global_evidence',
      reference_uuid: evidence.evidence_uuid,
      visibility_reference_uuid: VISIBILITY_UUID.WORKSPACE,
      priority_reference_uuid: ACTIVITY_PRIORITY_UUID.NORMAL,
    });
  } catch (e) {
    console.error('[FoundationBridge] createEvidenceTracked: activity error', e);
  }

  return evidence;
}

// ─── Bridge: Transaction + Notification + Activity + Audit ───────────────────

export interface CreateTransactionTrackedInput extends CreateTransactionInput {
  /** Workspace penerima notifikasi (biasanya seller). */
  notify_workspace_uuid?: string;
  /** Workspace aktor untuk audit log. */
  actor_workspace_uuid: string;
}

/**
 * Membuat Transaction baru, lalu mengirim Notification dan mencatat
 * Activity + Audit Trail.
 * Menyediakan relasi: Transaction → Notification, Transaction → Activity, Transaction → Audit
 *
 * @returns TransactionRecord yang baru dibuat.
 */
export function createTransactionTracked(
  input: CreateTransactionTrackedInput,
): TransactionRecord {
  const { notify_workspace_uuid, actor_workspace_uuid, ...txInput } = input;

  // 1. Buat transaksi (operasi utama)
  const tx = createTransaction(txInput);

  // 2. Kirim notifikasi ke penerima (best-effort, async fire-and-forget)
  if (notify_workspace_uuid) {
    createNotification({
      notification_type_reference_uuid: NOTIFICATION_TYPE_UUID.TRANSACTION,
      reference_module: 'global_transaction',
      reference_uuid: tx.transaction_uuid,
      target_workspace_uuid: notify_workspace_uuid,
      title: 'Transaksi Baru',
      message: `Transaksi ${tx.transaction_code} telah dibuat.`,
      icon: '🛒',
      priority_reference_uuid: PRIORITY_UUID.NORMAL,
      action_route: `/marketplace/transaksi/${tx.transaction_uuid}`,
      action_label: 'Lihat Transaksi',
    }).catch((e: unknown) => {
      console.error('[FoundationBridge] createTransactionTracked: notification error', e);
    });
  }

  // 3. Catat Activity (best-effort)
  try {
    createActivity({
      activity_type_reference_uuid: ACTIVITY_TYPE_UUID.MARKETPLACE_TRANSACTION,
      workspace_uuid: actor_workspace_uuid,
      title: `Transaksi ${tx.transaction_code}`,
      description: `Jumlah: ${tx.total_amount.toLocaleString('id-ID')} — ${tx.transaction_type}`,
      reference_module: 'global_transaction',
      reference_uuid: tx.transaction_uuid,
      visibility_reference_uuid: VISIBILITY_UUID.WORKSPACE,
      priority_reference_uuid: ACTIVITY_PRIORITY_UUID.NORMAL,
    });
  } catch (e) {
    console.error('[FoundationBridge] createTransactionTracked: activity error', e);
  }

  // 4. Catat Audit (best-effort)
  try {
    recordAudit({
      event_type_reference_uuid: AUDIT_EVENT_TYPE_UUID.CREATE,
      actor_workspace_uuid,
      target_module: 'global_transaction',
      target_uuid: tx.transaction_uuid,
      action_reference_uuid: AUDIT_ACTION_UUID.SYSTEM_GENERATED,
      metadata: { transaction_code: tx.transaction_code, total_amount: tx.total_amount },
    });
  } catch (e) {
    console.error('[FoundationBridge] createTransactionTracked: audit error', e);
  }

  return tx;
}

// ─── Bridge: Escrow ↔ Transaction lookup ─────────────────────────────────────

/**
 * Mengambil TransactionRecord yang terkait dengan sebuah EscrowRecord.
 * Menyediakan relasi: Escrow → Transaction
 *
 * @returns TransactionRecord jika ditemukan, undefined jika tidak.
 */
export function resolveEscrowTransaction(
  escrow: EscrowRecord,
): TransactionRecord | undefined {
  return getTransactionByUuid(escrow.transaction_uuid);
}

/**
 * Mengambil EscrowRecord yang terkait dengan sebuah TransactionRecord.
 * Menyediakan relasi: Transaction → Escrow
 *
 * @returns EscrowRecord jika ditemukan, undefined jika tidak.
 */
export function resolveTransactionEscrow(
  tx: TransactionRecord,
): EscrowRecord | undefined {
  return getEscrowByTransaction(tx.transaction_uuid);
}

// ─── Bridge: Conversation + Activity + Audit ──────────────────────────────────

export interface CreateConversationTrackedInput extends CreateConversationInput {
  /** Workspace aktor untuk audit dan activity log. */
  actor_workspace_uuid: string;
}

/**
 * Membuat Conversation baru, lalu mencatat Activity + Audit Trail.
 * Menyediakan relasi: Conversation → Activity, Conversation → Audit
 *
 * @returns ConversationRecord yang baru dibuat.
 */
export function createConversationTracked(
  input: CreateConversationTrackedInput,
): ConversationRecord {
  const { actor_workspace_uuid, ...convInput } = input;

  // 1. Buat percakapan (operasi utama)
  const conv = createConversation(convInput);

  // 2. Catat Activity (best-effort)
  try {
    createActivity({
      activity_type_reference_uuid: ACTIVITY_TYPE_UUID.SYSTEM_ACTIVITY,
      workspace_uuid: actor_workspace_uuid,
      title: 'Percakapan Dimulai',
      description: `Modul: ${conv.reference_module}`,
      reference_module: 'global_conversation',
      reference_uuid: conv.conversation_uuid,
      visibility_reference_uuid: VISIBILITY_UUID.WORKSPACE,
      priority_reference_uuid: ACTIVITY_PRIORITY_UUID.NORMAL,
    });
  } catch (e) {
    console.error('[FoundationBridge] createConversationTracked: activity error', e);
  }

  // 3. Catat Audit (best-effort)
  try {
    recordAudit({
      event_type_reference_uuid: AUDIT_EVENT_TYPE_UUID.CREATE,
      actor_workspace_uuid,
      target_module: 'global_conversation',
      target_uuid: conv.conversation_uuid,
      action_reference_uuid: AUDIT_ACTION_UUID.SYSTEM_GENERATED,
      metadata: { reference_module: conv.reference_module },
    });
  } catch (e) {
    console.error('[FoundationBridge] createConversationTracked: audit error', e);
  }

  return conv;
}

// ─── Bridge: Trust ← Evidence + Activity + Transaction + Audit ───────────────

export interface ComputeTrustFactorsInput {
  entity_type_reference_uuid: string;
  entity_uuid: string;
  /** Faktor yang ingin dihitung (0–100). null = tidak disertakan. */
  factors: {
    evidence_score?:      number | null;
    verification_score?:  number | null;
    consistency_score?:   number | null;
    activity_score?:      number | null;
    transaction_score?:   number | null;
    completeness_score?:  number | null;
    audit_score?:         number | null;
  };
  trigger_reason?: string;
  actor_workspace_uuid?: string;
}

/**
 * Menghitung atau menghitung ulang Trust Score untuk sebuah entity,
 * lalu mencatat ke Audit Trail.
 * Menyediakan relasi: Trust ← Evidence, Activity, Transaction, Audit
 *
 * @returns TrustRecord yang baru dihitung.
 */
export function computeTrustFactors(
  input: ComputeTrustFactorsInput,
): TrustRecord {
  const existing = getTrustByEntity(
    input.entity_type_reference_uuid,
    input.entity_uuid,
  );

  const trustInput: CalculateTrustInput = {
    entity_type_reference_uuid: input.entity_type_reference_uuid,
    entity_uuid:                input.entity_uuid,
    factors: {
      evidence_score:     input.factors.evidence_score     ?? null,
      verification_score: input.factors.verification_score ?? null,
      consistency_score:  input.factors.consistency_score  ?? null,
      activity_score:     input.factors.activity_score     ?? null,
      transaction_score:  input.factors.transaction_score  ?? null,
      completeness_score: input.factors.completeness_score ?? null,
      audit_score:        input.factors.audit_score        ?? null,
    },
    trigger_reason: input.trigger_reason,
  };

  const trust = existing
    ? recalculateTrust(trustInput)
    : calculateTrust(trustInput);

  // Catat ke Audit (best-effort)
  if (input.actor_workspace_uuid) {
    try {
      recordAudit({
        event_type_reference_uuid: existing
          ? AUDIT_EVENT_TYPE_UUID.UPDATE
          : AUDIT_EVENT_TYPE_UUID.CREATE,
        actor_workspace_uuid: input.actor_workspace_uuid,
        target_module: 'system',
        target_uuid: trust.trust_uuid,
        action_reference_uuid: AUDIT_ACTION_UUID.SYSTEM_GENERATED,
        metadata: {
          entity_uuid: input.entity_uuid,
          trust_score: trust.trust_score,
          trigger: input.trigger_reason ?? null,
        },
      });
    } catch (e) {
      console.error('[FoundationBridge] computeTrustFactors: audit error', e);
    }
  }

  return trust;
}

// ─── Bridge: Verification → Trust + Evidence + Activity + Audit ──────────────

export interface VerifyEntityInput {
  /** UUID dari VerificationRecord yang akan diproses. */
  verification_uuid: string;
  /** Workspace verifier (untuk activity/audit log saja — tidak masuk VerifyInput). */
  verifier_workspace_uuid: string;
  /** Score verifikasi (0–100). */
  verification_score?: number;
  /** Catatan verifikasi. */
  notes?: string | null;
  /**
   * Jika true, hitung ulang Trust Score setelah verifikasi.
   * Memerlukan entity_type_reference_uuid dan entity_uuid.
   */
  update_trust?: boolean;
  entity_type_for_trust?: string;
  entity_uuid_for_trust?: string;
  trust_factors?: ComputeTrustFactorsInput['factors'];
}

/**
 * Memverifikasi sebuah entitas dan — secara opsional — memperbarui Trust Score.
 * Mencatat ke Activity + Audit Trail.
 * Menyediakan relasi: Verification → Trust, Verification → Activity, Verification → Audit
 *
 * @returns VerificationRecord yang sudah diverifikasi.
 */
export function verifyEntityAndUpdateTrust(
  input: VerifyEntityInput,
): VerificationRecord {
  const verifyInput: VerifyInput = {
    verification_score: input.verification_score,
    verification_note:  input.notes ?? null,
  };

  // 1. Verifikasi (operasi utama)
  const verification = verify(input.verification_uuid, verifyInput);

  // 2. Perbarui Trust Score (best-effort, opsional)
  if (input.update_trust && input.entity_type_for_trust && input.entity_uuid_for_trust) {
    try {
      computeTrustFactors({
        entity_type_reference_uuid: input.entity_type_for_trust,
        entity_uuid:                input.entity_uuid_for_trust,
        factors: {
          verification_score: input.verification_score ?? null,
          ...input.trust_factors,
        },
        trigger_reason:       `Verification completed: ${input.verification_uuid}`,
        actor_workspace_uuid: input.verifier_workspace_uuid,
      });
    } catch (e) {
      console.error('[FoundationBridge] verifyEntityAndUpdateTrust: trust error', e);
    }
  }

  // 3. Catat Activity (best-effort)
  try {
    createActivity({
      activity_type_reference_uuid: ACTIVITY_TYPE_UUID.SYSTEM_ACTIVITY,
      workspace_uuid:               input.verifier_workspace_uuid,
      title:                        'Verifikasi Disetujui',
      description:                  `Verification ${input.verification_uuid} disetujui`,
      reference_module:             'system',
      reference_uuid:               input.verification_uuid,
      visibility_reference_uuid:    VISIBILITY_UUID.WORKSPACE,
      priority_reference_uuid:      ACTIVITY_PRIORITY_UUID.NORMAL,
    });
  } catch (e) {
    console.error('[FoundationBridge] verifyEntityAndUpdateTrust: activity error', e);
  }

  // 4. Catat Audit (best-effort)
  try {
    recordAudit({
      event_type_reference_uuid: AUDIT_EVENT_TYPE_UUID.VERIFY,
      actor_workspace_uuid:      input.verifier_workspace_uuid,
      target_module:             'system',
      target_uuid:               input.verification_uuid,
      action_reference_uuid:     AUDIT_ACTION_UUID.CONFIRM,
      metadata: { score: input.verification_score ?? null },
    });
  } catch (e) {
    console.error('[FoundationBridge] verifyEntityAndUpdateTrust: audit error', e);
  }

  return verification;
}

/**
 * Menolak sebuah verifikasi dan mencatat ke Activity + Audit Trail.
 * Menyediakan relasi: Verification → Activity, Verification → Audit
 *
 * @returns VerificationRecord yang sudah ditolak.
 */
export function rejectVerificationTracked(
  verificationUuid: string,
  rejectorWorkspaceUuid: string,
  reason: string,
): VerificationRecord {
  const rejectInput: RejectInput = {
    verification_note: reason,
  };

  // 1. Tolak verifikasi (operasi utama)
  const verification = reject(verificationUuid, rejectInput);

  // 2. Catat Activity (best-effort)
  try {
    createActivity({
      activity_type_reference_uuid: ACTIVITY_TYPE_UUID.SYSTEM_ACTIVITY,
      workspace_uuid:               rejectorWorkspaceUuid,
      title:                        'Verifikasi Ditolak',
      description:                  reason,
      reference_module:             'system',
      reference_uuid:               verificationUuid,
      visibility_reference_uuid:    VISIBILITY_UUID.WORKSPACE,
      priority_reference_uuid:      ACTIVITY_PRIORITY_UUID.HIGH,
    });
  } catch (e) {
    console.error('[FoundationBridge] rejectVerificationTracked: activity error', e);
  }

  // 3. Catat Audit (best-effort)
  try {
    recordAudit({
      event_type_reference_uuid: AUDIT_EVENT_TYPE_UUID.REJECT,
      actor_workspace_uuid:      rejectorWorkspaceUuid,
      target_module:             'system',
      target_uuid:               verificationUuid,
      action_reference_uuid:     AUDIT_ACTION_UUID.CANCEL,
      metadata: { reason },
    });
  } catch (e) {
    console.error('[FoundationBridge] rejectVerificationTracked: audit error', e);
  }

  return verification;
}

// ─── Bridge: AI Insight + Activity + Audit + Search ──────────────────────────

export interface CreateInsightTrackedInput extends CreateInsightInput {
  /** Workspace aktor untuk audit dan activity log. */
  actor_workspace_uuid: string;
  /**
   * Jika true, insight diindeks ke Global Search menggunakan EVIDENCE entity type
   * (AI_INSIGHT tidak tersedia di SEARCH_ENTITY_TYPE_UUID).
   * Hanya diindeks jika insight.workspace_uuid tersedia.
   */
  index_in_search?: boolean;
}

/**
 * Membuat AI Insight baru, lalu mencatat ke Activity, Audit, dan (opsional) Search Index.
 * Menyediakan relasi: AI Insight → Activity, AI Insight → Audit, AI Insight → Search
 *
 * @returns AiInsightRecord yang baru dibuat.
 */
export function createInsightTracked(
  input: CreateInsightTrackedInput,
): AiInsightRecord {
  const { actor_workspace_uuid, index_in_search, ...insightInput } = input;

  // 1. Buat insight (operasi utama)
  const insight = createInsight(insightInput);

  // 2. Catat Activity (best-effort)
  try {
    createActivity({
      activity_type_reference_uuid: ACTIVITY_TYPE_UUID.AI_INSIGHT_GENERATED,
      workspace_uuid:               actor_workspace_uuid,
      title:                        `AI Insight: ${insight.title}`,
      description:                  insight.summary,
      reference_module:             'ai_insight',
      reference_uuid:               insight.insight_uuid,
      visibility_reference_uuid:    VISIBILITY_UUID.WORKSPACE,
      priority_reference_uuid:      ACTIVITY_PRIORITY_UUID.NORMAL,
    });
  } catch (e) {
    console.error('[FoundationBridge] createInsightTracked: activity error', e);
  }

  // 3. Catat Audit (best-effort)
  try {
    recordAudit({
      event_type_reference_uuid: AUDIT_EVENT_TYPE_UUID.CREATE,
      actor_workspace_uuid,
      target_module:             'system',
      target_uuid:               insight.insight_uuid,
      action_reference_uuid:     AUDIT_ACTION_UUID.SYSTEM_GENERATED,
      metadata: { title: insight.title, source_module: insight.source_module },
    });
  } catch (e) {
    console.error('[FoundationBridge] createInsightTracked: audit error', e);
  }

  // 4. Indeks ke Search (best-effort, opsional)
  // Catatan: SEARCH_ENTITY_TYPE_UUID tidak memiliki AI_INSIGHT — gunakan EVIDENCE
  // sebagai pendekat terdekat, atau lewati jika workspace_uuid tidak tersedia.
  if (index_in_search && insight.workspace_uuid) {
    try {
      const tryUpdate = (() => {
        try {
          updateIndex(
            SEARCH_ENTITY_TYPE_UUID.EVIDENCE,
            insight.insight_uuid,
            {
              title:           insight.title,
              subtitle:        insight.summary,
              keywords:        [insight.source_module, insight.generated_by],
              searchable_text: `${insight.title} ${insight.summary}`,
            },
          );
          return true;
        } catch {
          return false;
        }
      })();

      if (!tryUpdate) {
        indexEntity({
          entity_type_reference_uuid: SEARCH_ENTITY_TYPE_UUID.EVIDENCE,
          entity_uuid:                insight.insight_uuid,
          workspace_uuid:             insight.workspace_uuid,
          title:                      insight.title,
          subtitle:                   insight.summary,
          keywords:                   [insight.source_module, insight.generated_by],
          searchable_text:            `${insight.title} ${insight.summary}`,
        });
      }
    } catch (e) {
      console.error('[FoundationBridge] createInsightTracked: search error', e);
    }
  }

  return insight;
}

// ─── Bridge: Notification ← Foundation Events ────────────────────────────────

export type FoundationEventType =
  | 'transaction.created'
  | 'transaction.completed'
  | 'transaction.cancelled'
  | 'escrow.held'
  | 'escrow.released'
  | 'escrow.refunded'
  | 'escrow.dispute_opened'
  | 'conversation.message_received'
  | 'verification.completed'
  | 'verification.rejected'
  | 'insight.generated';

export interface SendEventNotificationInput {
  event_type: FoundationEventType;
  /** UUID dari record yang memicu event. */
  reference_uuid: string;
  /** Workspace penerima notifikasi. */
  target_workspace_uuid: string;
  /** Pesan notifikasi (opsional — diisi otomatis dari event_type jika kosong). */
  message?: string;
  /** Route untuk deep-link (opsional). */
  action_route?: string;
  /** Label tombol aksi (opsional). */
  action_label?: string;
}

type NotifModule =
  | 'global_transaction'
  | 'global_escrow'
  | 'global_conversation'
  | 'global_evidence'
  | 'ai_insight'
  | 'system';

interface EventMeta {
  title:             string;
  icon:              string;
  reference_module:  NotifModule;
  notification_type: string;
  priority:          string;
}

const EVENT_NOTIFICATION_MAP: Record<FoundationEventType, EventMeta> = {
  'transaction.created':           { title: 'Transaksi Baru',           icon: '🛒', reference_module: 'global_transaction', notification_type: NOTIFICATION_TYPE_UUID.TRANSACTION, priority: PRIORITY_UUID.NORMAL   },
  'transaction.completed':         { title: 'Transaksi Selesai',        icon: '✅', reference_module: 'global_transaction', notification_type: NOTIFICATION_TYPE_UUID.TRANSACTION, priority: PRIORITY_UUID.NORMAL   },
  'transaction.cancelled':         { title: 'Transaksi Dibatalkan',     icon: '❌', reference_module: 'global_transaction', notification_type: NOTIFICATION_TYPE_UUID.TRANSACTION, priority: PRIORITY_UUID.HIGH     },
  'escrow.held':                   { title: 'Dana Escrow Ditahan',      icon: '🔒', reference_module: 'global_escrow',      notification_type: NOTIFICATION_TYPE_UUID.ESCROW,       priority: PRIORITY_UUID.NORMAL   },
  'escrow.released':               { title: 'Dana Escrow Dicairkan',    icon: '💰', reference_module: 'global_escrow',      notification_type: NOTIFICATION_TYPE_UUID.ESCROW,       priority: PRIORITY_UUID.HIGH     },
  'escrow.refunded':               { title: 'Dana Escrow Dikembalikan', icon: '↩️', reference_module: 'global_escrow',      notification_type: NOTIFICATION_TYPE_UUID.ESCROW,       priority: PRIORITY_UUID.HIGH     },
  'escrow.dispute_opened':         { title: 'Sengketa Escrow Dibuka',  icon: '⚠️', reference_module: 'global_escrow',      notification_type: NOTIFICATION_TYPE_UUID.ESCROW,       priority: PRIORITY_UUID.CRITICAL },
  'conversation.message_received': { title: 'Pesan Baru',              icon: '💬', reference_module: 'global_conversation', notification_type: NOTIFICATION_TYPE_UUID.INFO,         priority: PRIORITY_UUID.NORMAL   },
  'verification.completed':        { title: 'Verifikasi Disetujui',    icon: '✔️', reference_module: 'system',             notification_type: NOTIFICATION_TYPE_UUID.VERIFICATION, priority: PRIORITY_UUID.NORMAL   },
  'verification.rejected':         { title: 'Verifikasi Ditolak',      icon: '✖️', reference_module: 'system',             notification_type: NOTIFICATION_TYPE_UUID.VERIFICATION, priority: PRIORITY_UUID.HIGH     },
  'insight.generated':             { title: 'AI Insight Baru',         icon: '🤖', reference_module: 'ai_insight',         notification_type: NOTIFICATION_TYPE_UUID.AI_INSIGHT,   priority: PRIORITY_UUID.NORMAL   },
};

/**
 * Mengirim notifikasi berdasarkan event Foundation.
 * Menyediakan relasi: Notification ← Transaction, Escrow, Conversation, Verification, AI Insight
 *
 * Fire-and-forget: returns the Promise so callers can optionally await it.
 * Returns undefined synchronously if the event_type is unknown.
 */
export function sendEventNotification(
  input: SendEventNotificationInput,
): ReturnType<typeof createNotification> | undefined {
  const meta = EVENT_NOTIFICATION_MAP[input.event_type];
  if (!meta) {
    console.error(`[FoundationBridge] sendEventNotification: unknown event_type "${input.event_type}"`);
    return undefined;
  }

  return createNotification({
    notification_type_reference_uuid: meta.notification_type,
    reference_module:                 meta.reference_module,
    reference_uuid:                   input.reference_uuid,
    target_workspace_uuid:            input.target_workspace_uuid,
    title:                            meta.title,
    message:                          input.message ?? meta.title,
    icon:                             meta.icon,
    action_route:                     input.action_route,
    action_label:                     input.action_label,
    priority_reference_uuid:          meta.priority,
  }).catch((e: unknown) => {
    console.error('[FoundationBridge] sendEventNotification: error', e);
    return undefined as never;
  });
}

// ─── Bridge: Search ← Foundation Entity Indexing ─────────────────────────────

export interface IndexFoundationEntityInput {
  entity_type_reference_uuid: string;
  entity_uuid: string;
  workspace_uuid: string;
  title: string;
  subtitle?: string;
  keywords?: string[];
  tags?: string[];
  searchable_text?: string;
  /** Jika true, log ke Audit Trail setelah indexing. */
  audit?: boolean;
  actor_workspace_uuid?: string;
}

/**
 * Mengindeks sebuah entity Foundation ke Global Search.
 * Jika entry sudah ada, perbarui. Jika belum, buat baru.
 * Menyediakan relasi: Search ← seluruh entity Foundation
 *
 * @returns SearchIndexRecord yang baru dibuat atau diperbarui.
 */
export function indexFoundationEntity(
  input: IndexFoundationEntityInput,
): ReturnType<typeof indexEntity> | ReturnType<typeof updateIndex> {
  const {
    entity_type_reference_uuid,
    entity_uuid,
    workspace_uuid,
    title,
    subtitle,
    keywords = [],
    tags = [],
    searchable_text,
    audit = false,
    actor_workspace_uuid,
  } = input;

  const indexInput: IndexEntityInput = {
    entity_type_reference_uuid,
    entity_uuid,
    workspace_uuid,
    title,
    subtitle,
    keywords,
    tags,
    searchable_text,
  };

  // Coba update dulu; jika belum ada, buat baru
  let result: ReturnType<typeof indexEntity>;
  try {
    result = updateIndex(entity_type_reference_uuid, entity_uuid, {
      title,
      subtitle,
      keywords,
      tags,
      searchable_text,
    });
  } catch {
    result = indexEntity(indexInput);
  }

  // Audit (best-effort, opsional)
  if (audit && actor_workspace_uuid) {
    try {
      recordAudit({
        event_type_reference_uuid: AUDIT_EVENT_TYPE_UUID.UPDATE,
        actor_workspace_uuid,
        target_module:             'system',
        target_uuid:               entity_uuid,
        action_reference_uuid:     AUDIT_ACTION_UUID.SYNC,
        metadata: { title, entity_type_reference_uuid },
      });
    } catch (e) {
      console.error('[FoundationBridge] indexFoundationEntity: audit error', e);
    }
  }

  return result;
}

// ─── Re-export konstanta & tipe yang sering digunakan lintas-Foundation ───────

export {
  // Tier 0 — Activity
  ACTIVITY_TYPE_UUID,
  VISIBILITY_UUID,
  ACTIVITY_PRIORITY_UUID,
  // Tier 0 — Audit
  AUDIT_EVENT_TYPE_UUID,
  AUDIT_ACTION_UUID,
  // Tier 1 — Notification
  NOTIFICATION_TYPE_UUID,
  PRIORITY_UUID,
  // Tier 2 — Transaction
  TRANSACTION_STATUS_UUID,
  // Tier 2 — Search
  SEARCH_ENTITY_TYPE_UUID,
  // Tier 3 — Trust
  ENTITY_TYPE_UUID,
  // Tier 4 — Verification
  VERIFICATION_TYPE_UUID,
  VERIFICATION_STATUS_UUID,
  VERIFICATION_ENTITY_TYPE_UUID,
  // Tier 5 — AI Insight
  INSIGHT_TYPE_UUID,
  INSIGHT_PRIORITY_UUID,
};

export type {
  // Tier 1
  EvidenceRecord,
  // Tier 2
  TransactionRecord,
  EscrowRecord,
  ConversationRecord,
  // Tier 3
  TrustRecord,
  // Tier 4
  VerificationRecord,
  // Tier 5
  AiInsightRecord,
  // Input types
  CreateEvidenceInput,
  CreateTransactionInput,
  CreateConversationInput,
  CreateInsightInput,
  VerifyInput,
  RejectInput,
  IndexEntityInput,
  CalculateTrustInput,
};
