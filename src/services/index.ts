// ─── Foundation Services — Barrel Export ─────────────────────────────────────
//
// FOUNDATION-GLOBAL-INTEGRATION-001
//
// Single entry point untuk seluruh 13 Global Foundation Service.
//
// URUTAN DEPENDENSI (dari daun ke akar — tidak ada circular import):
//
//   Tier 0 — Leaf (tidak bergantung pada Foundation lain):
//     Reference, Activity, Audit
//
//   Tier 1 — Bergantung pada Tier 0:
//     Evidence    → Media, Activity, Audit
//     Notification → Activity
//
//   Tier 2 — Bergantung pada Tier 0–1:
//     Transaction  → Evidence, Notification, Activity, Audit
//     Escrow       → Transaction, Evidence, Notification, Activity, Audit
//     Conversation → Media, Evidence, Activity, Audit
//     Search       → Activity, Audit
//
//   Tier 3 — Bergantung pada Tier 0–2:
//     Trust        → Evidence, Activity, Transaction, Audit
//
//   Tier 4 — Bergantung pada Tier 0–3:
//     Verification → Evidence, Trust, Activity, Audit
//
//   Tier 5 — Bergantung pada Tier 0–4:
//     AI Insight   → Activity, Trust, Evidence, Verification, Search
//
// Untuk operasi lintas-Foundation gunakan foundationBridge.ts.
// ─────────────────────────────────────────────────────────────────────────────

// ── Tier 0: Leaf Services ─────────────────────────────────────────────────────

export * as ReferenceService from './globalReferenceService';
export * as ActivityService from './globalActivityService';
export * as AuditService from './globalAuditTrailService';

// ── Tier 1 ────────────────────────────────────────────────────────────────────

export * as EvidenceService from './globalEvidenceService';
export * as NotificationService from './globalNotificationService';

// ── Tier 2 ────────────────────────────────────────────────────────────────────

export * as TransactionService from './globalTransactionService';
export * as EscrowService from './globalEscrowService';
export * as ConversationService from './globalConversationService';
export * as SearchService from './globalSearchService';

// ── Tier 3 ────────────────────────────────────────────────────────────────────

export * as TrustService from './globalTrustService';

// ── Tier 4 ────────────────────────────────────────────────────────────────────

export * as VerificationService from './globalVerificationService';

// ── Tier 5 ────────────────────────────────────────────────────────────────────

export * as AiInsightService from './globalAiInsightService';
