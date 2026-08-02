// ─── Reproduction reference data ────────────────────────────────────────────

import type { ReproEntry } from '../../../data/livestockData';

export const REPRO_ACTIVITIES: ReproEntry['activity'][] = ['Perkawinan', 'Kebuntingan', 'Melahirkan', 'Sapih'];

export const REPRO_STATUS_BY_ACTIVITY: Record<ReproEntry['activity'], string[]> = {
  Perkawinan: ['Berhasil', 'Diulang'],
  Kebuntingan: ['Terkonfirmasi', 'Dalam Pemantauan'],
  Melahirkan: ['Normal', 'Dibantu'],
  Sapih: ['Selesai'],
};

/** Minimum age (months) before an animal is considered breeding-eligible. */
export const MIN_BREEDING_AGE_MONTHS = 10;
