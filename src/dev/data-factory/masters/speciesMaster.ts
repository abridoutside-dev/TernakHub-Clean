// ─── Master Species (re-export) ─────────────────────────────────────────────
// Single source of truth: src/data/speciesData.ts (already shared with the real
// app UI). The factory must never keep its own species list.

import { MASTER_SPECIES, SPECIES_NAMES, type SpeciesDef } from '../../../data/speciesData';

export { MASTER_SPECIES, SPECIES_NAMES };
export type { SpeciesDef };

export function findSpecies(value: string): SpeciesDef | undefined {
  return MASTER_SPECIES.find((s) => s.value === value);
}

// LivestockRecord needs typeColor/typeBg, which MASTER_SPECIES itself does not
// define. These display colors are factory-only enrichment (never written back
// to speciesData.ts). Any species without a curated palette below automatically
// falls back to FALLBACK_VISUAL, so a newly-added Master Species entry needs no
// code changes here to be seedable.
type SpeciesVisual = { color: string; bg: string };

const SPECIES_VISUALS: Record<string, SpeciesVisual> = {
  Domba: { color: '#1b7a43', bg: '#e8f5ee' },
  Kambing: { color: '#b5651d', bg: '#fbeee0' },
  Sapi: { color: '#7a1b3a', bg: '#f5e8ee' },
  Kerbau: { color: '#3a3a3a', bg: '#eceff1' },
  Kuda: { color: '#8a5a2b', bg: '#f6ede1' },
  Babi: { color: '#c2185b', bg: '#fde4ec' },
};

const FALLBACK_VISUAL: SpeciesVisual = { color: '#546e7a', bg: '#eceff1' };

export function getSpeciesVisual(species: string): SpeciesVisual {
  return SPECIES_VISUALS[species] ?? FALLBACK_VISUAL;
}
