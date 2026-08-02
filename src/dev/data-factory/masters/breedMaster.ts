// ─── Master Breed ───────────────────────────────────────────────────────────
// Curated ras/breed options per species, mirroring the values already used in
// the app's own Ras pickers (CatatBobot.tsx / AddLivestock.tsx RAS_OPTIONS), so
// seeded data looks identical to what a real user would enter. Species without
// a curated list here (including any species added to Master Species later)
// automatically fall back to FALLBACK_BREEDS — no code change required.

export const MASTER_BREED: Record<string, string[]> = {
  Domba: [
    'Garut (Priangan)', 'Batur (Domba Gembel)', 'Domba Ekor Tipis (DET)', 'Domba Ekor Gemuk (DEG)',
    'Dorper', 'Texel', 'Merino', 'Suffolk', 'Awassi', 'Compass Agrinak', 'Katahdin', 'Barbados Black Belly',
  ],
  Kambing: [
    'Boer', 'Boerka', 'Kacang', 'Peranakan Etawa (PE)', 'Etawa (Jamnapari)',
    'Saanen', 'Sapera', 'Anglo Nubian', 'Lakor', 'Senduro', 'Muara',
  ],
  Sapi: [
    'Limousin', 'Simental', 'Angus', 'Brahman', 'Bali', 'Madura',
    'PO (Peranakan Ongole)', 'Ongole', 'Brangus', 'Belgian Blue',
  ],
};

const FALLBACK_BREEDS = ['Lokal', 'Unggul', 'Persilangan', 'Ras Campuran'];

export function getBreedOptions(species: string): string[] {
  return MASTER_BREED[species] ?? FALLBACK_BREEDS;
}
