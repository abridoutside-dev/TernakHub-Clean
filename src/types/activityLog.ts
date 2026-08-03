// ─── Activity Log DB Types — ADMIN-FOUNDATION-001 ────────────────────────────
//
// TypeScript types for the `activity_log` table.
// Schema: supabase/migrations/20260803000002_activity_log.sql
//
// Distinct from global_audit_trail (which is an immutable diff-based audit).
// activity_log is an observable event feed — "who did what, when, where".
//
// Rules:
//   - All authenticated workspace members can read their own workspace's log.
//   - Any authenticated user can insert (actor_id must match auth.uid()).
//   - Never bulk-import or mutate existing rows.

// ─── Enum types ───────────────────────────────────────────────────────────────

export type ActivitySeverity = 'info' | 'warning' | 'error' | 'critical';
export type ActivityStatus   = 'success' | 'failed' | 'pending';
export type ActivitySource   = 'web' | 'api' | 'system' | 'trigger' | 'import' | 'export';

// ─── activity_log ─────────────────────────────────────────────────────────────

export interface ActivityLogDbRow {
  id: string;
  /** FK → workspaces.id — null for platform-level events */
  workspace_id: string | null;
  /**
   * Top-level domain this event belongs to.
   * e.g. 'farm' | 'feed_store' | 'veterinary' | 'transport' | 'marketplace' | 'platform'
   */
  domain: string;
  /**
   * Sub-module within the domain.
   * e.g. 'livestock' | 'stok_pakan' | 'stok_obat' | 'kesehatan' | 'reproduksi'
   */
  module: string;
  /** Type of entity acted upon, e.g. 'livestock' | 'batch' | 'stok_obat' */
  entity_type: string;
  /** UUID of the specific entity, or null for non-entity events */
  entity_id: string | null;
  /**
   * Action performed, e.g. 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' |
   * 'LOGIN' | 'EXPORT' | 'IMPORT' | 'SYNC'
   */
  action: string;
  /** Human-readable description of what happened */
  description: string | null;
  /** FK → auth.users.id — null for system/trigger events */
  actor_id: string | null;
  /** Arbitrary JSON metadata for the event (before/after, extra context) */
  metadata: Record<string, unknown> | null;
  status: ActivityStatus;
  source: ActivitySource;
  severity: ActivitySeverity;
  created_at: string;
}

// ─── Insert shape ─────────────────────────────────────────────────────────────

export type ActivityLogInsert = Omit<ActivityLogDbRow, 'id' | 'created_at'>;

// ─── Join shape for admin views ───────────────────────────────────────────────

export interface ActivityLogWithWorkspace extends ActivityLogDbRow {
  workspaces: { name: string | null; plan: string | null } | null;
}
