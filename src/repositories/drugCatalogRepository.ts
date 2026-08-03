// ─── Drug Catalog Repository — ADMIN-FOUNDATION-001 ──────────────────────────
//
// Supabase adapter for platform Master Obat reference data.
// Tables covered:
//   drug_catalog, drug_categories, drug_sub_categories
//
// Rules:
//   - All functions are async and return typed results.
//   - Read-only (SELECT) — drug_catalog is platform-managed reference data.
//   - No requireAuthSession() guard required (RLS handles auth via anon/service).
//   - Never import from pages, components, or contexts.
//
// Schema:  supabase/migrations/20260725000004_reference.sql
// RLS:     supabase/migrations/20260803000001_drug_catalog_rls_grants.sql

import { supabase } from '../lib/supabase';
import type {
  DrugCatalogDbRow,
  DrugCatalogWithCategory,
  DrugCategoryDbRow,
  DrugSubCategoryDbRow,
} from '../types/drugCatalog';

// ─── Error ────────────────────────────────────────────────────────────────────

export class DrugCatalogRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DrugCatalogRepoError';
  }
}

function guard(error: { message: string; code?: string } | null): void {
  if (error) throw new DrugCatalogRepoError(error.message, error.code);
}

// ─── drug_categories ──────────────────────────────────────────────────────────

/**
 * All drug categories, ordered by name.
 * Used by admin Master Obat module and pickers.
 */
export async function repoGetDrugCategories(): Promise<DrugCategoryDbRow[]> {
  const { data, error } = await supabase
    .from('drug_categories')
    .select('*')
    .order('name');
  guard(error);
  return (data ?? []) as DrugCategoryDbRow[];
}

// ─── drug_sub_categories ─────────────────────────────────────────────────────

/**
 * All drug sub-categories, optionally filtered by category.
 */
export async function repoGetDrugSubCategories(
  categoryId?: string,
): Promise<DrugSubCategoryDbRow[]> {
  let q = supabase.from('drug_sub_categories').select('*').order('name');
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data, error } = await q;
  guard(error);
  return (data ?? []) as DrugSubCategoryDbRow[];
}

// ─── drug_catalog ─────────────────────────────────────────────────────────────

/**
 * Paginated list of drug_catalog rows with category and sub-category joined.
 * Used by admin cross-workspace Master Obat module.
 */
export async function repoGetDrugCatalog(opts?: {
  limit?: number;
  offset?: number;
  categoryId?: string;
  search?: string;
}): Promise<{ data: DrugCatalogWithCategory[]; count: number }> {
  const limit  = opts?.limit  ?? 500;
  const offset = opts?.offset ?? 0;

  let q = supabase
    .from('drug_catalog')
    .select(
      'id, name, generic_name, category_id, sub_category_id, species_targets, dosage_form, standard_dosage, withdrawal_period_days, requires_prescription, manufacturer, description, created_at, updated_at, drug_categories(name, slug, icon), drug_sub_categories(name)',
      { count: 'exact' },
    )
    .order('name')
    .range(offset, offset + limit - 1);

  if (opts?.categoryId) {
    q = q.eq('category_id', opts.categoryId);
  }
  if (opts?.search) {
    q = q.or(`name.ilike.%${opts.search}%,generic_name.ilike.%${opts.search}%,manufacturer.ilike.%${opts.search}%`);
  }

  const { data, error, count } = await q;
  guard(error);
  return { data: (data ?? []) as unknown as DrugCatalogWithCategory[], count: count ?? 0 };
}

/**
 * Total count of drug_catalog rows (for stats).
 */
export async function repoGetDrugCatalogCount(): Promise<number> {
  const { count, error } = await supabase
    .from('drug_catalog')
    .select('*', { count: 'exact', head: true });
  guard(error);
  return count ?? 0;
}

/**
 * Single drug_catalog row by UUID.
 * Returns null if not found.
 */
export async function repoGetDrugCatalogById(id: string): Promise<DrugCatalogDbRow | null> {
  const { data, error } = await supabase
    .from('drug_catalog')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as DrugCatalogDbRow | null;
}
