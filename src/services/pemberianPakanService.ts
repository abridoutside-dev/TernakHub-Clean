// ─── Pemberian Pakan Service — FLOW-003M10 ────────────────────────────────────
//
// Business logic layer for persisting completed feed sessions to Supabase.
// Called fire-and-forget from PemberianPakan.tsx after selesaikanPemberianPakan()
// succeeds (Phase 1, in-memory).
//
// Rules:
//  - No React imports.
//  - Validation is synchronous; persistence is async.
//  - This service only writes to pemberian_pakan (the session log table).
//  - stok_inventaris_transactions writes are handled from PemberianPakan.tsx
//    directly via recordPerubahanStok() from stokInventarisService.ts, after
//    the feed session is recorded (useStokInventaris now populates Supabase UUIDs).

import {
  repoInsertPemberianPakan,
  PemberianPakanRepoError,
} from '../repositories/pemberianPakanRepository';

// ─── Service result ───────────────────────────────────────────────────────────

export type PemberianPakanServiceResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Input type ───────────────────────────────────────────────────────────────

/**
 * UI-facing input for recording a completed feed session.
 * Maps from PemberianPakanRecord fields (Indonesian names → DB column names).
 */
export interface RecordFeedSessionInput {
  /** 'individu' → writes livestock_id; 'batch' → writes batch_id */
  targetKind:       'individu' | 'batch';
  /** Livestock UUID (individu) or Batch UUID (batch) */
  targetId:         string;
  /** YYYY-MM-DD */
  tanggal:          string;
  /** HH:mm */
  waktuPemberian:   string;
  /**
   * Sum of item.jumlah for all items.
   * Best-effort Kg value — units may differ across items but the DB requires
   * a non-null amount_kg > 0 for the row to be valid.
   */
  totalJumlah:      number;
  /** FK → jadwal_pemberian_pakan.id (from record.sumberJadwalId) */
  jadwalId?:        string | null;
  /**
   * FK → feed_formulas.id.
   * Taken from the first item that has a formulaUuid (if any).
   */
  formulaId?:       string | null;
  catatan?:         string | null;
}

// ─── Service function ─────────────────────────────────────────────────────────

/**
 * Persist a completed feed session to the pemberian_pakan table.
 * Called from PemberianPakan.tsx in a fire-and-forget IIFE after
 * selesaikanPemberianPakan() returns { success: true }.
 */
export async function recordFeedSession(
  workspaceId: string,
  input: RecordFeedSessionInput,
): Promise<PemberianPakanServiceResult<{ id: string }>> {
  if (!workspaceId)     return { ok: false, error: 'Workspace diperlukan.' };
  if (!input.targetId)  return { ok: false, error: 'Target (ternak/batch) diperlukan.' };
  if (!input.tanggal)   return { ok: false, error: 'Tanggal pemberian diperlukan.' };
  if (input.totalJumlah <= 0) {
    return { ok: false, error: 'Jumlah pakan harus lebih dari 0.' };
  }

  try {
    const row = await repoInsertPemberianPakan({
      workspace_id: workspaceId,
      livestock_id: input.targetKind === 'individu' ? input.targetId : null,
      batch_id:     input.targetKind === 'batch'    ? input.targetId : null,
      jadwal_id:    input.jadwalId  ?? null,
      formula_id:   input.formulaId ?? null,
      feed_date:    input.tanggal,
      feed_time:    input.waktuPemberian || null,
      amount_kg:    input.totalJumlah,
      notes:        input.catatan ?? null,
      recorded_by:  null,
    });
    return { ok: true, data: row };
  } catch (err) {
    const msg = err instanceof PemberianPakanRepoError
      ? err.message
      : 'Gagal menyimpan sesi pemberian pakan ke database.';
    return { ok: false, error: msg };
  }
}
