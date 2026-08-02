// ─── Pemberian Pakan Repository — FLOW-003M10 ────────────────────────────────
//
// Raw Supabase access for the pemberian_pakan table.
// Never call this from pages or hooks — go through pemberianPakanService.ts.

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';

// ─── Error type ───────────────────────────────────────────────────────────────

export class PemberianPakanRepoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PemberianPakanRepoError';
  }
}

// ─── Insert type ──────────────────────────────────────────────────────────────

export interface PemberianPakanDbInsert {
  workspace_id:  string;
  /** FK → livestock.id — set when targetKind === 'individu' */
  livestock_id:  string | null;
  /** FK → batches.id — set when targetKind === 'batch' */
  batch_id:      string | null;
  /** FK → jadwal_pemberian_pakan.id — null when not from a jadwal */
  jadwal_id:     string | null;
  /** FK → feed_formulas.id — null unless a formula item is present */
  formula_id:    string | null;
  /** YYYY-MM-DD */
  feed_date:     string;
  /** HH:mm — nullable when waktuPemberian is not set */
  feed_time:     string | null;
  /** Total amount (sum of item quantities). DB CHECK: amount_kg > 0 */
  amount_kg:     number;
  notes:         string | null;
  recorded_by:   string | null;
}

// ─── Read type ────────────────────────────────────────────────────────────────

/** Shape of a row returned by SELECT * FROM pemberian_pakan. */
export interface PemberianPakanDbRow {
  id:           string;
  workspace_id: string;
  livestock_id: string | null;
  batch_id:     string | null;
  jadwal_id:    string | null;
  formula_id:   string | null;
  feed_date:    string;
  feed_time:    string | null;
  amount_kg:    number;
  notes:        string | null;
  recorded_by:  string | null;
  created_at:   string;
}

// ─── Repository functions ─────────────────────────────────────────────────────

/**
 * Insert a completed feed session into pemberian_pakan.
 * Returns the new row's id.
 */
export async function repoInsertPemberianPakan(
  input: PemberianPakanDbInsert,
): Promise<{ id: string }> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('pemberian_pakan')
    .insert(input)
    .select('id')
    .single();

  if (error) throw new PemberianPakanRepoError(error.message);
  return data as { id: string };
}

/**
 * Fetch all completed pemberian_pakan rows for a workspace, ordered by
 * created_at ascending so populatePemberianPakanFromDb() gets them oldest-first.
 * Called by usePemberianPakan() to hydrate the in-memory PEMBERIAN_PAKAN_DB.
 */
export async function repoGetPemberianPakanByWorkspace(
  workspaceId: string,
): Promise<PemberianPakanDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('pemberian_pakan')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error) throw new PemberianPakanRepoError(error.message);
  return (data ?? []) as PemberianPakanDbRow[];
}
