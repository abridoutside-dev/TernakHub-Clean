// ─── Date Factory ───────────────────────────────────────────────────────────
// Realistic, sequential date generation in the same Indonesian label format the
// app already uses (see batchData.ts's todayLabel()).

import type { Rng } from './rng';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function formatIndonesianDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function daysBefore(ref: Date, days: number): Date {
  const d = new Date(ref);
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Builds a descending (index 0 = most recent) series of `count` dates ending at
 * `latest`, walking backward with an average gap of `avgGapDays` (±50% jitter).
 * Matches the app's history-array convention where index 0 is the latest entry.
 *
 * If `notBefore` is given, the walk stops as soon as it would cross that floor
 * (e.g. an animal's birth/registration date) — this keeps history coherent with
 * the animal's real lifecycle instead of fabricating events before it existed,
 * at the cost of returning fewer than `count` entries for young animals.
 */
export function buildDescendingDateSeries(latest: Date, count: number, avgGapDays: number, rng: Rng, notBefore?: Date): Date[] {
  const dates: Date[] = [];
  let cursor = new Date(latest);
  for (let i = 0; i < count; i++) {
    if (notBefore && cursor.getTime() < notBefore.getTime()) break;
    dates.push(new Date(cursor));
    const gap = Math.max(1, Math.round(rng.nextFloat(avgGapDays * 0.5, avgGapDays * 1.5)));
    cursor = daysBefore(cursor, gap);
  }
  return dates;
}

/** Clamps a "days back from now" request so it never goes further back than `maxDaysBack`. */
export function clampDaysBefore(now: Date, requestedDaysBack: number, maxDaysBack: number): Date {
  return daysBefore(now, Math.max(0, Math.min(requestedDaysBack, maxDaysBack)));
}

/** Formats an age in months as an Indonesian label, e.g. "8 bulan" or "2 tahun 3 bulan". */
export function formatAgeLabel(months: number): string {
  if (months < 12) return `${months} bulan`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years} tahun` : `${years} tahun ${rem} bulan`;
}
