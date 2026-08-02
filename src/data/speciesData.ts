// ─── Master Species Registry ────────────────────────────────────────────────
// Single source of truth for every livestock species (Jenis Ternak) supported
// by the app. Any page that needs to list species (filters, forms, pickers)
// MUST read from MASTER_SPECIES / SPECIES_NAMES instead of hardcoding a list.
//
// To add a new species (e.g. "Kuda", "Kerbau", "Ayam"), add one entry below —
// no other file needs to change for it to appear everywhere species are listed.

export type SpeciesDef = {
  value: string;
  label: string;
  icon: string;
  code: string; // used to build livestock IDs (e.g. 'D' → Domba)
};

export const MASTER_SPECIES: SpeciesDef[] = [
  { value: 'Domba',   label: 'Domba',   icon: '🐑', code: 'D' },
  { value: 'Kambing', label: 'Kambing', icon: '🐐', code: 'K' },
  { value: 'Sapi',    label: 'Sapi',    icon: '🐄', code: 'S' },
  { value: 'Kerbau',  label: 'Kerbau',  icon: '🐃', code: 'R' },
  { value: 'Kuda',    label: 'Kuda',    icon: '🐎', code: 'H' },
  { value: 'Babi',    label: 'Babi',    icon: '🐖', code: 'P' },
];

/** Flat list of species names, derived from MASTER_SPECIES — never hardcode this elsewhere. */
export const SPECIES_NAMES: string[] = MASTER_SPECIES.map((s) => s.value);

/** Looks up a species definition (e.g. for its ID code) by its `value`. */
export function findSpecies(value: string): SpeciesDef | undefined {
  return MASTER_SPECIES.find((s) => s.value === value);
}

// ─── Master Breed (Ras) Registry ────────────────────────────────────────────
// Single source of truth for breed lists per species with a curated Ras
// vocabulary (Domba/Kambing/Sapi). Species not listed here (Kerbau, Kuda,
// Babi) use free-text breed entry in the forms that consume this map.
// Any page that needs a Ras list for these species MUST read from
// RAS_OPTIONS instead of maintaining its own copy.
export const RAS_OPTIONS: Record<string, string[]> = {
  Domba:   ['Garut (Priangan)', 'Batur (Domba Gembel)', 'Domba Ekor Tipis (DET)', 'Domba Ekor Gemuk (DEG)', 'Dorper', 'Texel', 'Merino', 'Suffolk', 'Awassi', 'Compass Agrinak', 'Katahdin', 'Barbados Black Belly', 'Lainnya'],
  Kambing: ['Boer', 'Boerka', 'Kacang', 'Peranakan Etawa (PE)', 'Etawa (Jamnapari)', 'Saanen', 'Sapera', 'Anglo Nubian', 'Lakor', 'Senduro', 'Muara', 'Lainnya'],
  Sapi:    ['Limousin', 'Simental', 'Angus', 'Brahman', 'Bali', 'Madura', 'PO (Peranakan Ongole)', 'Ongole', 'Brangus', 'Belgian Blue', 'Lainnya'],
};
