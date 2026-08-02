/**
 * kesehatanTimelineData.ts  (KH-FIX-001 / MAJ-002)
 * ─────────────────────────────────────────────────────────────────
 * Structured Timeline log for Kesehatan Hewan health events.
 *
 * Mirrors the PAKAN_TIMELINE_LOG / WEIGHT_TIMELINE_LOG / BATCH_TIMELINE_LOG
 * / MUTATION_EVENT_LOG pattern used across all other operational modules.
 *
 * This file is intentionally standalone — it has no imports from other
 * KH data files to avoid circular dependencies.
 *
 * Public API:
 *   KH_TIMELINE_LOG              — raw log array (read-only externally)
 *   addKHTimelineEvent()         — exported for the four KH mutation files
 *   getKHTimeline(targetId)      — all events for a livestock/batch/pemeriksaan
 *   getRecentKHEvents(limit?)    — most-recent events across all targets
 */

import { generateUUID } from '../utils/uuid';

// ─── Types ────────────────────────────────────────────────────────────────────

export type KHTimelineEventType =
  | 'pemeriksaan_created'   // addPemeriksaan() — first step of health workflow
  | 'tindakan_started'      // createTindakanSesi() — treatment session opened
  | 'pengobatan_started'    // createPengobatanSesi() — medication session opened
  | 'kontrol_completed';    // addKontrol() — follow-up evaluation recorded

export type KHTimelineEvent = {
  /** UUID v4 */
  id:          string;
  type:        KHTimelineEventType;
  /** Primary record id for this event (pemeriksaanId, sesiId, etc.). */
  recordId:    string;
  /** Mode of the health case. */
  targetKind:  'individu' | 'batch' | 'unknown';
  /** livestockId or batchId — null when not resolvable at log time. */
  targetId:    string | null;
  /** ISO date YYYY-MM-DD of the health activity. */
  tanggal:     string;
  /** ISO timestamp when the event was logged. */
  recordedAt:  string;
  /** Optional free-text notes (e.g. statusHasil for kontrol). */
  notes:       string | null;
};

// ─── Log ──────────────────────────────────────────────────────────────────────

export const KH_TIMELINE_LOG: KHTimelineEvent[] = [];

// ─── Internal writer ──────────────────────────────────────────────────────────

/**
 * Appends a health event to the immutable timeline log.
 * Exported so the four KH mutation files can call it without circular imports.
 */
export function addKHTimelineEvent(
  event: Omit<KHTimelineEvent, 'id' | 'recordedAt'>,
): KHTimelineEvent {
  const entry: KHTimelineEvent = {
    id:         `khtl-${generateUUID()}`,
    recordedAt: new Date().toISOString(),
    ...event,
  };
  KH_TIMELINE_LOG.push(entry);
  return entry;
}

// ─── Public readers ───────────────────────────────────────────────────────────

/**
 * All timeline events whose targetId OR recordId matches the given id,
 * returned newest → oldest.
 */
export function getKHTimeline(targetId: string): KHTimelineEvent[] {
  return KH_TIMELINE_LOG
    .filter((e) => e.targetId === targetId || e.recordId === targetId)
    .slice()
    .reverse();
}

/** Most-recent health timeline events across all targets, newest → oldest. */
export function getRecentKHEvents(limit = 5): KHTimelineEvent[] {
  return KH_TIMELINE_LOG
    .slice()
    .reverse()
    .slice(0, limit);
}
