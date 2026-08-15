// ─── Formula Service — FLOW-003M13 ───────────────────────────────────────────
//
// Fire-and-forget Supabase dual-write for the Feed Formula module.
// Called from pages after each successful in-memory mutation.
// Failure is logged but never blocks the UI.
//
// Tables covered:
//   feed_formulas          (insert, patch — create/update/archive/unarchive)
//   feed_formula_productions (insert — after FormulaProduksi confirms)
//
// Deferred:
//   feed_formula_ingredients — BahanFormula.referensiId values are NOT
//   Supabase UUIDs; FK resolution requires a master_pakan_catalog lookup
//   layer (M14+).
//
// UUID Mapping:
//   In-memory formula IDs ('frm-1', 'frm-${Date.now()}-N') are not Supabase
//   UUIDs.  After repoInsertFormula() succeeds, this module stores
//   inMemoryId → supabaseId in FORMULA_SUPABASE_ID_MAP.
//   update/archive/production calls look up the supabaseId from this map.
//   If not found (seed data or cross-session formula), the call is silently
//   skipped — in-memory store remains authoritative.

import {
  repoPatchFormula,
  repoInsertFormula,
  repoInsertFormulaProduction,
  repoInsertFormulaIngredients,
  FormulaRepoError,
} from '../repositories/formulaRepository';
import type { FormulaIngredientInsertInput } from '../repositories/formulaRepository';
import type { FormulaRecord, UpdateFormulaInput, BahanFormula } from '../data/formulaData';
import type { ProduksiBatchRecord } from '../data/produksiFormulaData';
import { bulkLookupMasterPakanIds } from './masterPakanCatalogService';

// ─── Service result ───────────────────────────────────────────────────────────

export type FormulaServiceResult<T = { id: string }> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

function ok<T>(data: T): FormulaServiceResult<T> { return { ok: true, data }; }
function fail<T>(msg: string): FormulaServiceResult<T> { return { ok: false, error: msg }; }

// ─── In-memory UUID mapping ───────────────────────────────────────────────────
// Lives for the duration of the browser session.
// Populated by recordCreateFormula(); consumed by all subsequent calls.

const FORMULA_SUPABASE_ID_MAP = new Map<string, string>();

/** Expose for diagnostics only — never mutate externally. */
export function getFormulaSupabaseId(inMemoryId: string): string | undefined {
  return FORMULA_SUPABASE_ID_MAP.get(inMemoryId);
}

/**
 * Called by useFormula after populateFormulaFromDb() to seed the session UUID map
 * so that update / archive / production dual-writes work for DB-originated formulas
 * after a hard refresh.
 *
 * For DB-hydrated rows the in-memory formula id IS the Supabase UUID, so we simply
 * register identity mappings (id → id) for every row that isn't already mapped.
 */
export function registerFormulaSupabaseIds(rows: ReadonlyArray<{ id: string }>): void {
  for (const row of rows) {
    if (!FORMULA_SUPABASE_ID_MAP.has(row.id)) {
      FORMULA_SUPABASE_ID_MAP.set(row.id, row.id);
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── recordCreateFormula ──────────────────────────────────────────────────────
// Called by FormulaEditor.tsx after addFormula() succeeds.
// Inserts to feed_formulas and stores the returned Supabase UUID.

export async function recordCreateFormula(
  inMemoryId: string,
  workspaceId: string,
  userId: string | null,
  record: FormulaRecord,
): Promise<FormulaServiceResult> {
  if (!workspaceId) return fail('workspaceId diperlukan untuk dual-write formula.');

  try {
    const { data, error } = await repoInsertFormula({
      workspace_id:      workspaceId,
      name:              record.nama,
      status:            record.status,
      target_species:    [record.targetTernak],
      target_age_group:  record.fasePemeliharaan ?? null,
      description:       record.deskripsi ?? record.tujuan ?? null,
      total_cost_per_kg: record.estimasiHPP > 0 ? record.estimasiHPP : null,
      created_by:        userId,
    });

    if (error || !data) {
      console.warn('[formulaService] repoInsertFormula failed:', error);
      return fail(error ?? 'Insert formula gagal.');
    }

    FORMULA_SUPABASE_ID_MAP.set(inMemoryId, data.id);
    return ok({ id: data.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Insert formula gagal.';
    console.error('[formulaService] recordCreateFormula error:', msg);
    return fail(msg);
  }
}

// ─── recordUpdateFormula ──────────────────────────────────────────────────────
// Called by FormulaEditor.tsx after updateFormula() succeeds.
// Looks up the Supabase UUID from the map; skips silently if not found.

export async function recordUpdateFormula(
  inMemoryId: string,
  patch: UpdateFormulaInput,
): Promise<FormulaServiceResult<Record<string, never>>> {
  const supabaseId = FORMULA_SUPABASE_ID_MAP.get(inMemoryId);
  if (!supabaseId) return ok({});  // seed data or cross-session — skip silently

  try {
    const { error } = await repoPatchFormula(supabaseId, {
      ...(patch.nama         !== undefined && { name: patch.nama }),
      ...(patch.status       !== undefined && { status: patch.status }),
      ...(patch.targetTernak !== undefined && { target_species: [patch.targetTernak] }),
      ...(patch.fasePemeliharaan !== undefined && {
        target_age_group: patch.fasePemeliharaan ?? null,
      }),
      ...(patch.deskripsi !== undefined && {
        description: patch.deskripsi ?? null,
      }),
      ...(patch.estimasiHPP !== undefined && {
        total_cost_per_kg: patch.estimasiHPP > 0 ? patch.estimasiHPP : null,
      }),
    });

    if (error) {
      console.warn('[formulaService] repoPatchFormula (update) failed:', error);
      return fail(error);
    }
    return ok({});
  } catch (err) {
    const msg = err instanceof FormulaRepoError ? err.message : String(err);
    console.error('[formulaService] recordUpdateFormula error:', msg);
    return fail(msg);
  }
}

// ─── recordArchiveFormula ─────────────────────────────────────────────────────
// Called by FormulaDetail.tsx after archiveFormula() succeeds.

export async function recordArchiveFormula(
  inMemoryId: string,
): Promise<FormulaServiceResult<Record<string, never>>> {
  const supabaseId = FORMULA_SUPABASE_ID_MAP.get(inMemoryId);
  if (!supabaseId) return ok({});

  try {
    const { error } = await repoPatchFormula(supabaseId, {
      status:      'Arsip',
      archived_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[formulaService] repoPatchFormula (archive) failed:', error);
      return fail(error);
    }
    return ok({});
  } catch (err) {
    const msg = err instanceof FormulaRepoError ? err.message : String(err);
    console.error('[formulaService] recordArchiveFormula error:', msg);
    return fail(msg);
  }
}

// ─── recordUnarchiveFormula ───────────────────────────────────────────────────
// Called by FormulaDetail.tsx after unarchiveFormula() succeeds.

export async function recordUnarchiveFormula(
  inMemoryId: string,
): Promise<FormulaServiceResult<Record<string, never>>> {
  const supabaseId = FORMULA_SUPABASE_ID_MAP.get(inMemoryId);
  if (!supabaseId) return ok({});

  try {
    const { error } = await repoPatchFormula(supabaseId, {
      status:      'Aktif',
      archived_at: null,
    });

    if (error) {
      console.warn('[formulaService] repoPatchFormula (unarchive) failed:', error);
      return fail(error);
    }
    return ok({});
  } catch (err) {
    const msg = err instanceof FormulaRepoError ? err.message : String(err);
    console.error('[formulaService] recordUnarchiveFormula error:', msg);
    return fail(msg);
  }
}

// ─── recordCreateFormulaIngredients ───────────────────────────────────────────
// Called by FormulaEditor.tsx after recordCreateFormula() resolves ok.
// Resolves each BahanFormula.nama to a master_pakan_catalog UUID via
// bulkLookupMasterPakanIds() then bulk-inserts to feed_formula_ingredients.
//
// Rules:
//   - Only fires if the formula's Supabase UUID is known (i.e. recordCreateFormula
//     already succeeded and stored the id in FORMULA_SUPABASE_ID_MAP).
//   - Items with source_type='Produk Komersial' are skipped until produk_komersial_id
//     FK resolution is implemented (M15+).
//   - Items whose name cannot be found in master_pakan_catalog are skipped with a
//     console.warn — the in-memory store remains authoritative.

export async function recordCreateFormulaIngredients(
  inMemoryFormulaId: string,
  bahan: BahanFormula[],
): Promise<FormulaServiceResult<Record<string, never>>> {
  const supabaseFormulaId = FORMULA_SUPABASE_ID_MAP.get(inMemoryFormulaId);
  if (!supabaseFormulaId) return ok({}); // seed formula or cross-session — skip silently

  if (bahan.length === 0) return ok({});

  try {
    // ── Separate Master Pakan vs Produk Komersial ─────────────────────────────
    // PK items deferred — skip them (can't satisfy FK constraint without PK UUIDs)
    const masterPakanItems = bahan.filter(
      (b) => (b.sumberBahan ?? 'Master Pakan') === 'Master Pakan',
    );

    if (masterPakanItems.length === 0) return ok({});

    // ── Bulk-resolve names → Supabase UUIDs ──────────────────────────────────
    const names    = masterPakanItems.map((b) => b.nama);
    const idByName = await bulkLookupMasterPakanIds(names);

    // ── Build insert rows (skip items not found in catalog) ───────────────────
    const rows: FormulaIngredientInsertInput[] = [];

    for (let i = 0; i < masterPakanItems.length; i++) {
      const item   = masterPakanItems[i];
      const nameKey = item.nama.trim().toLowerCase();
      const mpId    = idByName.get(nameKey) ?? null;

      if (!mpId) {
        console.warn(
          `[formulaService] master_pakan_catalog miss for "${item.nama}" — ingredient skipped`,
        );
        continue;
      }

      rows.push({
        formula_id:          supabaseFormulaId,
        source_type:         'Master Pakan',
        master_pakan_id:     mpId,
        produk_komersial_id: null,
        ingredient_name:     item.nama,
        percentage:          item.proporsi,
        amount_kg:           null,
        cost_per_kg:         item.hargaEstimasiPerKg > 0 ? item.hargaEstimasiPerKg : null,
        sort_order:          i,
      });
    }

    if (rows.length === 0) return ok({});

    const { error } = await repoInsertFormulaIngredients(rows);
    if (error) {
      console.warn('[formulaService] repoInsertFormulaIngredients failed:', error);
      return fail(error);
    }

    return ok({});
  } catch (err) {
    const msg = err instanceof FormulaRepoError ? err.message : String(err);
    console.error('[formulaService] recordCreateFormulaIngredients error:', msg);
    return fail(msg);
  }
}

// ─── recordCreateProduction ───────────────────────────────────────────────────
// Called by FormulaProduksi.tsx after addProduksiRecord() succeeds.
// Requires the formula's Supabase UUID — skips silently for seed formulas.

export async function recordCreateProduction(
  inMemoryFormulaId: string,
  workspaceId: string,
  userId: string | null,
  record: ProduksiBatchRecord,
): Promise<FormulaServiceResult> {
  const supabaseFormulaId = FORMULA_SUPABASE_ID_MAP.get(inMemoryFormulaId);
  if (!supabaseFormulaId) return ok({ id: '' }); // seed formula — skip silently

  if (!workspaceId) return fail('workspaceId diperlukan untuk dual-write produksi.');

  try {
    const productionDate = record.waktuProduksi
      ? record.waktuProduksi.split('T')[0]
      : isoDate();

    const { data, error } = await repoInsertFormulaProduction({
      formula_id:      supabaseFormulaId,
      workspace_id:    workspaceId,
      production_date: productionDate,
      quantity_kg:     record.jumlahProduksi,
      batch_code:      record.nomorBatch,
      notes:           record.catatanProduksi ?? null,
      produced_by:     userId,
    });

    if (error || !data) {
      console.warn('[formulaService] repoInsertFormulaProduction failed:', error);
      return fail(error ?? 'Insert produksi formula gagal.');
    }

    return ok({ id: data.id });
  } catch (err) {
    const msg = err instanceof FormulaRepoError ? err.message : String(err);
    console.error('[formulaService] recordCreateProduction error:', msg);
    return fail(msg);
  }
}
