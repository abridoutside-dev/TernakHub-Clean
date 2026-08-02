// ─── Master Growth Parameter Registry ───────────────────────────────────────
// Single source of truth for species-level ADG validation thresholds.
//
// These are reference ranges used for soft validation and read-only insights.
// They do not replace a veterinarian's assessment and are intentionally kept
// separate from individual livestock records.

export interface GrowthParameter {
  species: string;
  adgMinKgPerDay: number;
  adgMaxKgPerDay: number;
}

export const MASTER_GROWTH_PARAMETER: GrowthParameter[] = [
  { species: 'Domba',   adgMinKgPerDay: -0.15, adgMaxKgPerDay: 0.35 },
  { species: 'Kambing', adgMinKgPerDay: -0.12, adgMaxKgPerDay: 0.30 },
  { species: 'Sapi',    adgMinKgPerDay: -0.50, adgMaxKgPerDay: 1.80 },
  { species: 'Kerbau',  adgMinKgPerDay: -0.50, adgMaxKgPerDay: 1.50 },
  { species: 'Kuda',    adgMinKgPerDay: -0.50, adgMaxKgPerDay: 2.00 },
  { species: 'Babi',    adgMinKgPerDay: -0.20, adgMaxKgPerDay: 1.00 },
];

export function getGrowthParameter(species: string): GrowthParameter | null {
  return MASTER_GROWTH_PARAMETER.find((parameter) => parameter.species === species) ?? null;
}