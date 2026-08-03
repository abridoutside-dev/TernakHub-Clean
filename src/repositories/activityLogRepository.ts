// ─── Activity Log Repository — ADMIN-FOUNDATION-001 ──────────────────────────
//
// Supabase adapter for the platform-wide activity_log table.
// Schema: supabase/migrations/20260803000002_activity_log.sql
//
// Rules:
//   - Read functions do not require requireAuthSession() (RLS handles auth).
//   - Insert functions validate actor_id = auth.uid() via RLS.
//   - Never import from pages, components, or contexts.
//   - activity_log is append-only — no update/delete functions.

import { supabase } from '../lib/supabase';
import type {
  ActivityLogDbRow,
  ActivityLogInsert,
  ActivityLogWithWorkspace,
} from '../types/activityLog';

// ─── Error ────────────────────────────────────────────────────────────────────

export class ActivityLogRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'ActivityLogRepoError';
  }
}

function guard(error: { message: string; code?: string } | null): void {
  if (error) throw new ActivityLogRepoError(error.message, error.code);
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Recent platform-wide activity log entries (admin cross-workspace view).
 * Ordered by created_at DESC.
 */
export async function repoGetRecentActivityLog(opts?: {
  limit?: number;
  domain?: string;
  severity?: string;
  workspaceId?: string;
}): Promise<ActivityLogWithWorkspace[]> {
  const limit = opts?.limit ?? 100;

  let q = supabase
    .from('activity_log')
    .select('*, workspaces(name, plan)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (opts?.domain)      q = q.eq('domain', opts.domain);
  if (opts?.severity)    q = q.eq('severity', opts.severity);
  if (opts?.workspaceId) q = q.eq('workspace_id', opts.workspaceId);

  const { data, error } = await q;
  guard(error);
  return (data ?? []) as ActivityLogWithWorkspace[];
}

/**
 * Total count of activity_log rows (for stats).
 * Optionally filtered by domain or workspace.
 */
export async function repoGetActivityLogCount(opts?: {
  domain?: string;
  workspaceId?: string;
  since?: string; // ISO date string
}): Promise<number> {
  let q = supabase
    .from('activity_log')
    .select('*', { count: 'exact', head: true });

  if (opts?.domain)      q = q.eq('domain', opts.domain);
  if (opts?.workspaceId) q = q.eq('workspace_id', opts.workspaceId);
  if (opts?.since)       q = q.gte('created_at', opts.since);

  const { count, error } = await q;
  guard(error);
  return count ?? 0;
}

/**
 * Activity log entries for a specific workspace (workspace-scoped read).
 */
export async function repoGetActivityLogByWorkspace(
  workspaceId: string,
  limit = 50,
): Promise<ActivityLogDbRow[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);
  guard(error);
  return (data ?? []) as ActivityLogDbRow[];
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Insert a single activity log entry.
 * actor_id must match auth.uid() (enforced by RLS INSERT policy).
 */
export async function repoInsertActivityLog(
  entry: ActivityLogInsert,
): Promise<ActivityLogDbRow> {
  const { data, error } = await supabase
    .from('activity_log')
    .insert(entry)
    .select()
    .single();
  guard(error);
  return data as ActivityLogDbRow;
}

/**
 * Bulk insert activity log entries (e.g. from an import/export operation).
 */
export async function repoInsertActivityLogBatch(
  entries: ActivityLogInsert[],
): Promise<void> {
  if (!entries.length) return;
  const { error } = await supabase.from('activity_log').insert(entries);
  guard(error);
}
