// ─── Master Location ────────────────────────────────────────────────────────
// The app has no centralized location registry today — pages store `location`
// as a free-text string like "Kandang A, Blok 3" (parsed back apart via a
// blok/kandang regex on read). This master invents a coherent, consistent
// naming pattern for the factory to draw from, matching that exact format.

import type { TempTransferReason, PermanentTransferReason } from '../../../data/transferData';

export const MASTER_BLOK: string[] = ['Blok A', 'Blok B', 'Blok C', 'Blok D', 'Blok E'];

/** Number of kandang generated per blok — a master-data constant, not a run quantity. */
export const KANDANG_PER_BLOK = 6;

/** Builds a location label in the app's existing "Kandang N, Blok X" format. */
export function buildLocationLabel(blok: string, kandangNumber: number): string {
  return `Kandang ${kandangNumber}, ${blok}`;
}

// Mirrors transferData.ts's TransferReason unions exactly (typed against them,
// so a future reason added/removed there is caught here at compile time).
export const MASTER_TEMP_TRANSFER_REASONS: TempTransferReason[] = [
  'Antar Kandang', 'Penitipan Farm', 'Dokter Hewan', 'Layanan Kawin', 'Kontes', 'Karantina', 'Lainnya',
];

// 'Hilang' is a valid PermanentTransferReason at the type level but cannot be
// mapped to a valid ArchiveReason (Mati|Terjual|Hibah) by the archive summary
// layer — using it generates a [DATA BUG] console.error. Omit it here so
// factory-seeded archives never produce that noise in QA sessions.
export const MASTER_PERMANENT_TRANSFER_REASONS: PermanentTransferReason[] = [
  'Penjualan', 'Rumah Potong', 'Mati', 'Hibah',
];
