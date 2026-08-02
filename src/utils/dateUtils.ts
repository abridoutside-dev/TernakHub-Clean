/**
 * Shared date-parsing utilities for Dashboard activity data layers.
 *
 * Several modules (Livestock registeredDate, WeightEntry.date, HealthEntry.date)
 * store dates as Indonesian-label strings ("15 Juli 2026") rather than ISO.
 * These helpers read and convert — they never write back to origin modules.
 *
 * Used by: todayActivityData.ts, recentActivityData.ts, alertReminderData.ts
 */

export const BULAN_ID: Record<string, string> = {
  Januari: '01', Februari: '02', Maret: '03', April: '04', Mei: '05', Juni: '06',
  Juli: '07', Agustus: '08', September: '09', Oktober: '10', November: '11', Desember: '12',
};

/**
 * Convert a raw date string to ISO yyyy-mm-dd.
 * Accepts:
 *   - ISO format already: "2026-07-15" or "2026-07-15T12:00:00.000Z"
 *   - Indonesian label format: "15 Juli 2026"
 * Returns null if the format is unrecognised.
 */
export function parseFlexibleDateToIso(raw: string): string | null {
  const trimmed = raw.trim();
  // Already ISO (yyyy-mm-dd or yyyy-mm-ddTHH:...)
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  // Indonesian label: "15 Juli 2026"
  const match = trimmed.match(/^(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})$/);
  if (match) {
    const [, day, monthName, year] = match;
    const month = BULAN_ID[monthName];
    if (!month) return null;
    return `${year}-${month}-${day.padStart(2, '0')}`;
  }
  return null;
}

/** Return today as yyyy-mm-dd from a given Date reference. */
export function todayIso(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Return today's local date as yyyy-mm-dd.
 * Uses local timezone (not UTC) to avoid midnight-boundary issues.
 * Replaces the inline todayISO() helpers previously defined in several pages.
 */
export function getTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Return current local time as HH:MM (24-hour).
 * Replaces the inline nowHHMM() helpers previously defined in several pages.
 */
export function getNowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Build a sort-ready ISO timestamp for a date that has no time component.
 * Uses noon (12:00 UTC) to avoid timezone-boundary edge cases.
 */
export function isoAtNoon(dateIso: string): string {
  return `${dateIso}T12:00:00.000Z`;
}
