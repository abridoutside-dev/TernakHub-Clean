// ─── Formula Repository — FLOW-003M13 ────────────────────────────────────────
//
// Raw Supabase adapter for the Feed Formula module.
// Never call this from pages or hooks — go through formulaService.ts.
//
// Tables covered:
//   feed_formulas          (insert, patch)
//   feed_formula_productions (insert)
//
// Deferred:
//   feed_formula_ingredients — in-memory BahanFormula.referensiId values
//   ('mp-1', 'pk-xxx') are NOT Supabase UUIDs; FK resolution requires a
//   master_pakan_catalog UUID lookup layer (M14+).

import { supabase } from '../lib/supabase';

// ─── Error ────────────────────────────────────────────────────────────────────

export class FormulaRepoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FormulaRepoError';
  }
}

// ─── feed_formulas ────────────────────────────────────────────────────────────

export interface FeedFormulaInsertInput {
  workspace_id: string;
  name: string;
  status: 'Aktif' | 'Draft' | 'Arsip';
  target_species: string[];
  target_age_group: string | null;
  description: string | null;
  total_cost_per_kg: number | null;
  created_by: string | null;
}

export interface FeedFormulaPatchInput {
  name?: string;
  status?: 'Aktif' | 'Draft' | 'Arsip';
  target_species?: string[];
  target_age_group?: string | null;
  description?: string | null;
  total_cost_per_kg?: number | null;
  archived_at?: string | null;
}

/**
 * Insert a new formula row.
 * Returns the Supabase-generated UUID on success.
 */
export async function repoInsertFormula(
  input: FeedFormulaInsertInput,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('feed_formulas')
    .insert({
      workspace_id:      input.workspace_id,
      name:              input.name,
      status:            input.status,
      target_species:    input.target_species,
      target_age_group:  input.target_age_group,
      description:       input.description,
      total_cost_per_kg: input.total_cost_per_kg,
      created_by:        input.created_by,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/**
 * Patch an existing formula row by Supabase UUID.
 */
export async function repoPatchFormula(
  supabaseId: string,
  patch: FeedFormulaPatchInput,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('feed_formulas')
    .update({
      ...(patch.name              !== undefined && { name: patch.name }),
      ...(patch.status            !== undefined && { status: patch.status }),
      ...(patch.target_species    !== undefined && { target_species: patch.target_species }),
      ...(patch.target_age_group  !== undefined && { target_age_group: patch.target_age_group }),
      ...(patch.description       !== undefined && { description: patch.description }),
      ...(patch.total_cost_per_kg !== undefined && { total_cost_per_kg: patch.total_cost_per_kg }),
      ...(patch.archived_at       !== undefined && { archived_at: patch.archived_at }),
    })
    .eq('id', supabaseId);

  if (error) return { error: error.message };
  return { error: null };
}

// ─── feed_formula_ingredients ─────────────────────────────────────────────────

export interface FormulaIngredientInsertInput {
  formula_id:           string;                          // Supabase UUID of the parent feed_formula
  source_type:          'Master Pakan' | 'Produk Komersial';
  master_pakan_id:      string | null;                   // required when source_type = 'Master Pakan'
  produk_komersial_id:  string | null;                   // required when source_type = 'Produk Komersial'
  ingredient_name:      string;
  percentage:           number;
  amount_kg:            number | null;
  cost_per_kg:          number | null;
  sort_order:           number;
}

/**
 * Bulk-insert ingredient rows for a formula.
 * The DB CHECK constraint requires master_pakan_id NOT NULL for source_type='Master Pakan'
 * and produk_komersial_id NOT NULL for 'Produk Komersial'.
 * Callers must guarantee only valid rows are passed — invalid rows must be skipped upstream.
 */
export async function repoInsertFormulaIngredients(
  ingredients: FormulaIngredientInsertInput[],
): Promise<{ error: string | null }> {
  if (ingredients.length === 0) return { error: null };

  const { error } = await supabase
    .from('feed_formula_ingredients')
    .insert(ingredients);

  if (error) return { error: error.message };
  return { error: null };
}

// ─── Read types ───────────────────────────────────────────────────────────────

/** Shape of a row returned by SELECT * FROM feed_formulas. */
export interface FormulaDbRow {
  id:                string;
  workspace_id:      string;
  name:              string;
  status:            'Aktif' | 'Draft' | 'Arsip';
  target_species:    string[] | null;
  target_age_group:  string | null;
  description:       string | null;
  total_cost_per_kg: number | null;
  created_by:        string | null;
  created_at:        string;
  updated_at:        string;
  archived_at:       string | null;
}

/** Shape of a row returned by SELECT * FROM feed_formula_ingredients. */
export interface FormulaIngredientDbRow {
  id:                  string;
  formula_id:          string;
  source_type:         'Master Pakan' | 'Produk Komersial';
  master_pakan_id:     string | null;
  produk_komersial_id: string | null;
  ingredient_name:     string;
  percentage:          number;
  amount_kg:           number | null;
  cost_per_kg:         number | null;
  sort_order:          number;
  created_at:          string;
}

/** Shape of a row returned by SELECT * FROM feed_formula_productions. */
export interface FormulaProductionDbRow {
  id:              string;
  formula_id:      string;
  workspace_id:    string;
  production_date: string;   // YYYY-MM-DD
  quantity_kg:     number;
  batch_code:      string | null;
  notes:           string | null;
  produced_by:     string | null;
  created_at:      string;
}

// ─── Read functions ───────────────────────────────────────────────────────────

/**
 * Fetch all feed_formulas rows for a workspace, ordered by created_at ascending.
 * Called by useFormula() to hydrate the in-memory FORMULA_LIST.
 */
export async function repoGetFormulasByWorkspace(
  workspaceId: string,
): Promise<FormulaDbRow[]> {
  const { data, error } = await supabase
    .from('feed_formulas')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error) throw new FormulaRepoError(error.message);
  return (data ?? []) as FormulaDbRow[];
}

/**
 * Fetch all feed_formula_ingredients for the given formula UUIDs.
 * Ordered by (formula_id, sort_order) so callers can group by formula_id.
 */
export async function repoGetIngredientsByFormulaIds(
  formulaIds: string[],
): Promise<FormulaIngredientDbRow[]> {
  if (formulaIds.length === 0) return [];
  const { data, error } = await supabase
    .from('feed_formula_ingredients')
    .select('*')
    .in('formula_id', formulaIds)
    .order('formula_id', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw new FormulaRepoError(error.message);
  return (data ?? []) as FormulaIngredientDbRow[];
}

/**
 * Fetch all feed_formula_productions for a workspace, ordered by created_at ascending.
 * Called by useFormula() to hydrate the in-memory RIWAYAT_PRODUKSI.
 */
export async function repoGetFormulaProductionsByWorkspace(
  workspaceId: string,
): Promise<FormulaProductionDbRow[]> {
  const { data, error } = await supabase
    .from('feed_formula_productions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error) throw new FormulaRepoError(error.message);
  return (data ?? []) as FormulaProductionDbRow[];
}

// ─── feed_formula_productions ─────────────────────────────────────────────────

export interface FeedFormulaProductionInsertInput {
  formula_id:      string; // Supabase UUID of the parent feed_formula
  workspace_id:    string;
  production_date: string; // YYYY-MM-DD
  quantity_kg:     number;
  batch_code:      string | null;
  notes:           string | null;
  produced_by:     string | null; // auth.users.id
}

/**
 * Insert a new production record.
 * Returns the Supabase-generated UUID on success.
 */
export async function repoInsertFormulaProduction(
  input: FeedFormulaProductionInsertInput,
): Promise<{ data: { id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from('feed_formula_productions')
    .insert({
      formula_id:      input.formula_id,
      workspace_id:    input.workspace_id,
      production_date: input.production_date,
      quantity_kg:     input.quantity_kg,
      batch_code:      input.batch_code,
      notes:           input.notes,
      produced_by:     input.produced_by,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
