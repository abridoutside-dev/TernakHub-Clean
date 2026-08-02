/**
 * Shared livestock list utilities
 *
 * Rules enforced here:
 * - buildCountMap: every item in the array counts as 1.
 *   Never reads .total — a batch record is one card, counted once.
 * - paginateItems: single source of truth for page slicing.
 */

/**
 * Build a {key → count} map where each array item contributes exactly 1
 * to its key's bucket.  Use for type breakdown chips (Domba/Kambing/Sapi)
 * and archive category tabs.
 */
export function buildCountMap<T>(
  items: T[],
  getKey: (item: T) => string,
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of items) {
    const key = getKey(item);
    if (key) map[key] = (map[key] ?? 0) + 1;
  }
  return map;
}

/**
 * Slice a filtered list for the current page.
 * Returns both the visible slice and the total page count.
 */
export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): { pagedItems: T[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);
  return { pagedItems, totalPages };
}
