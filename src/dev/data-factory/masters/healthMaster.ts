// ─── Health reference data ──────────────────────────────────────────────────
// Centralizes the enumerations HealthHistoryFactory / LivestockFactory need so
// no generator file carries an inline hardcoded list of its own.

import type { HealthEntry } from '../../../data/livestockData';

/** Mirrors AddLivestock.tsx's STATUS_KESEHATAN options (health status, not location status). Weighted toward "Sehat" since most animals are healthy most of the time. */
export const HEALTH_STATUS_OPTIONS = ['Sehat', 'Sehat', 'Sehat', 'Sakit', 'Dalam Perawatan', 'Karantina'];

export const HEALTH_ACTIVITIES: HealthEntry['activity'][] = ['Pemeriksaan', 'Pengobatan', 'Vaksinasi', 'Deworming', 'Vitamin'];

export const HEALTH_STATUS_BY_ACTIVITY: Record<HealthEntry['activity'], string[]> = {
  Pemeriksaan: ['Sehat', 'Perlu Pemantauan'],
  Pengobatan: ['Dalam Perawatan', 'Sembuh'],
  Vaksinasi: ['Selesai'],
  Deworming: ['Selesai'],
  Vitamin: ['Selesai'],
};
