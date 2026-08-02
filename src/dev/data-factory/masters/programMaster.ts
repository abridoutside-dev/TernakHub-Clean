// ─── Master Program ─────────────────────────────────────────────────────────
// Mirrors PROGRAM_OPTS used across the app's own Program filters/pickers
// (CatatBobot.tsx, KesehatanHewan.tsx, Mutasi.tsx, etc.), excluding the "Semua
// Program" filter sentinel which is a UI-only "show all" option, not a real value.

export const MASTER_PROGRAM: string[] = [
  'Fattening', 'Breeding', 'Kontes', 'Karantina', 'Replacement', 'Lainnya',
];
