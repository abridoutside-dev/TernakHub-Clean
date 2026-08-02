// ─── Jadwal Pemberian Pakan Repository ───────────────────────────────────────
//
// Raw Supabase access for the jadwal_pemberian_pakan table.
// Never call this from pages or hooks — go through useJadwal.ts.

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';

// ─── Error type ───────────────────────────────────────────────────────────────

export class JadwalPemberianPakanRepoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JadwalPemberianPakanRepoError';
  }
}

// ─── Read type ────────────────────────────────────────────────────────────────

/** Shape of a row returned by SELECT * FROM jadwal_pemberian_pakan. */
export interface JadwalPemberianPakanDbRow {
  id:                    string;
  workspace_id:          string;
  livestock_id:          string | null;
  batch_id:              string | null;
  formula_id:            string | null;
  schedule_name:         string | null;
  frequency:             string | null;
  time_slots:            string[] | null;
  amount_per_session_kg: number | null;
  is_active:             boolean;
  start_date:            string | null;
  end_date:              string | null;
  notes:                 string | null;
  created_by:            string | null;
  created_at:            string;
}

// ─── Repository function ──────────────────────────────────────────────────────

/**
 * Fetch all jadwal_pemberian_pakan rows for a workspace, ordered by
 * created_at ascending so populateJadwalFromDb() gets them oldest-first.
 * Called by useJadwal() to hydrate the in-memory JADWAL_PEMBERIAN_DB.
 */
export async function repoGetJadwalByWorkspace(
  workspaceId: string,
): Promise<JadwalPemberianPakanDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('jadwal_pemberian_pakan')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error) throw new JadwalPemberianPakanRepoError(error.message);
  return (data ?? []) as JadwalPemberianPakanDbRow[];
}
