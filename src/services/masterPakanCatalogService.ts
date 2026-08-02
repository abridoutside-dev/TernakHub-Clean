// ─── Master Pakan Catalog Service — FLOW-003M14 ───────────────────────────────
//
// Resolves in-memory ingredient names to Supabase UUIDs in master_pakan_catalog.
// Used by formulaService.ts to satisfy the feed_formula_ingredients FK.
//
// Design:
//   - Session-level name→uuid cache (Map) — warm after first formula save per
//     session; subsequent ingredient writes hit the cache, not Supabase.
//   - Lookup is case-insensitive (ilike) to tolerate minor name differences.
//   - Never writes to master_pakan_catalog — this service is read-only.
//   - Returns null on miss; callers must skip the ingredient row (schema CHECK
//     constraint prohibits inserting with master_pakan_id = null for Master Pakan).
//
// Seeded items (migration 20260730000001):
//   Rumput Gajah, Jerami Kering, Dedak Padi, Jagung Giling, Bungkil Kedelai,
//   Molases, Mineral Mix, Garam Dapur.
//   Any other name returns null until the catalog is expanded.

import { supabase } from '../lib/supabase';

// ─── Session cache ─────────────────────────────────────────────────────────────
// key: trimmed lowercase name → value: Supabase UUID

const CATALOG_CACHE = new Map<string, string>();

// ─── lookupMasterPakanId ───────────────────────────────────────────────────────

/**
 * Resolve an ingredient display name to its `master_pakan_catalog.id` UUID.
 *
 * @param name  Display name of the ingredient (e.g. 'Rumput Gajah').
 * @returns     UUID string on match, null on miss or error.
 */
export async function lookupMasterPakanId(name: string): Promise<string | null> {
  const key = name.trim().toLowerCase();
  if (CATALOG_CACHE.has(key)) return CATALOG_CACHE.get(key) ?? null;

  const { data, error } = await supabase
    .from('master_pakan_catalog')
    .select('id')
    .ilike('name', name.trim())
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.warn('[masterPakanCatalogService] lookup error for', JSON.stringify(name), ':', error.message);
    }
    return null;
  }

  CATALOG_CACHE.set(key, data.id);
  return data.id;
}

// ─── bulkLookupMasterPakanIds ──────────────────────────────────────────────────

/**
 * Resolve multiple ingredient names in a single query.
 * Returns a Map of normalised_name → UUID for names found in the catalog.
 * Names not found are absent from the returned Map.
 *
 * @param names  Array of display names.
 */
export async function bulkLookupMasterPakanIds(
  names: string[],
): Promise<Map<string, string>> {
  if (names.length === 0) return new Map();

  // Split into cached vs uncached
  const result   = new Map<string, string>();
  const uncached: string[] = [];

  for (const name of names) {
    const key = name.trim().toLowerCase();
    const cached = CATALOG_CACHE.get(key);
    if (cached) {
      result.set(key, cached);
    } else {
      uncached.push(name.trim());
    }
  }

  if (uncached.length === 0) return result;

  // Single batch query for all uncached names
  const { data, error } = await supabase
    .from('master_pakan_catalog')
    .select('id, name')
    .in('name', uncached);

  if (error) {
    console.warn('[masterPakanCatalogService] bulk lookup error:', error.message);
    return result;
  }

  for (const row of data ?? []) {
    const key = row.name.trim().toLowerCase();
    CATALOG_CACHE.set(key, row.id);
    result.set(key, row.id);
  }

  return result;
}

/** Expose cache size for diagnostics only. */
export function getMasterPakanCacheSize(): number {
  return CATALOG_CACHE.size;
}
