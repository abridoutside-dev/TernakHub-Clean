/**
 * Shared relative-time formatter used by activity/timeline UI components.
 *
 * Signature accepts an explicit `now: Date` parameter so callers control
 * the reference point — more testable than calling Date.now() internally,
 * and consistent with the useMemo(() => new Date(), []) pattern used in
 * TodayActivity, RecentActivity, and their full-list sub-pages.
 *
 * NOTE: aiInsightData.ts exports its own `formatRelativeTime(iso)` (no `now`
 * param) for use in the AI Insight widget — intentionally separate because
 * that widget always wants the "right now" delta, not a frozen mount-time
 * reference. Do not merge or replace it.
 */
export function formatRelativeTimeWithNow(iso: string, now: Date): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  if (Number.isNaN(diffMs)) return '—';
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;
  const diffWeeks = Math.round(diffDays / 7);
  return `${diffWeeks} minggu lalu`;
}
