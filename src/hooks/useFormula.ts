// ─── useFormula Hook — FLOW-003M20 ───────────────────────────────────────────
//
// React hook that provides workspace-scoped formula and production data from
// Supabase. Design mirrors usePemberianPakan (FLOW-003M19):
//
//  - Fetches feed_formulas + feed_formula_ingredients + feed_formula_productions
//    in a single Promise.all to avoid serial round-trips.
//  - Calls populateFormulaFromDb() to hydrate the in-memory FORMULA_LIST so
//    that getFormulaList() / getFormulaById() work after a hard refresh.
//  - Calls populateProduksiFormulaFromDb() AFTER populateFormulaFromDb() so
//    formulaNama lookup from in-memory FORMULA_LIST resolves correctly.
//  - If DB returns 0 formula rows the in-memory stores are preserved intact
//    (seed data stays visible when DB is empty or not connected).
//  - Uses an abort flag to prevent stale-closure races when workspace changes.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  repoGetFormulasByWorkspace,
  repoGetIngredientsByFormulaIds,
  repoGetFormulaProductionsByWorkspace,
} from '../repositories/formulaRepository';
import { populateFormulaFromDb } from '../data/formulaData';
import { populateProduksiFormulaFromDb } from '../data/produksiFormulaData';
import { registerFormulaSupabaseIds } from '../services/formulaService';

// ─── Result type ──────────────────────────────────────────────────────────────

export interface UseFormulaResult {
  /** True while a fetch is in-flight. */
  loading: boolean;
  /** Non-null when the last fetch failed. */
  error: string | null;
  /** Re-fetches from Supabase and refreshes in-memory stores. */
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFormula(): UseFormulaResult {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.workspace_uuid ?? null;

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Abort flag — prevents stale-closure races when workspace changes mid-fetch.
  const abortRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!workspaceId) {
      // No active workspace — leave seed data intact, stop loading.
      setLoading(false);
      setError(null);
      return;
    }

    abortRef.current = false;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch feed_formulas + feed_formula_productions in parallel.
      //    Ingredients are fetched after we have formula IDs.
      const [formulaRows, productionRows] = await Promise.all([
        repoGetFormulasByWorkspace(workspaceId),
        repoGetFormulaProductionsByWorkspace(workspaceId),
      ]);

      if (abortRef.current) return;

      // 2. Fetch ingredients for the formula IDs we just received.
      const formulaIds = formulaRows.map((r) => r.id);
      const ingredientRows = await repoGetIngredientsByFormulaIds(formulaIds);

      if (abortRef.current) return;

      // 3. Populate in-memory stores — formulas FIRST, then productions
      //    (productions look up formulaNama from the already-populated list).
      //    After populating, seed FORMULA_SUPABASE_ID_MAP so that any subsequent
      //    update / archive / production dual-writes work for DB-originated formulas
      //    (fixes the hard-refresh UUID-mapping gap — FLOW-003M25).
      if (formulaRows.length > 0) {
        populateFormulaFromDb(formulaRows, ingredientRows);
        registerFormulaSupabaseIds(formulaRows);
        populateProduksiFormulaFromDb(productionRows);
      }
      // If formulaRows.length === 0: DB empty / not connected — keep seed data.

    } catch (err) {
      if (abortRef.current) return;
      const msg = err instanceof Error ? err.message : 'Gagal memuat data formula.';
      console.warn('[useFormula] fetch error:', msg);
      setError(msg);
    } finally {
      if (!abortRef.current) setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    abortRef.current = false;
    void fetchAll();
    return () => { abortRef.current = true; };
  }, [fetchAll]);

  const refresh = useCallback(() => {
    abortRef.current = false;
    void fetchAll();
  }, [fetchAll]);

  return { loading, error, refresh };
}
