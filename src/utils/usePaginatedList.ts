import { useEffect, useRef, useState } from 'react';

export const LIST_PAGE_SIZE = 8;

export interface PaginatedListResult<T> {
  /** Slice of items visible in the current window. */
  visible: T[];
  /** Whether more items exist beyond the current window. */
  hasMore: boolean;
  /**
   * Attach to a sentinel <div> at the bottom of the list.
   * When it enters the viewport, the next page is loaded automatically.
   */
  sentinelRef: React.RefObject<HTMLDivElement>;
  /** Total item count before slicing (after filter/search/sort). */
  total: number;
}

/**
 * Client-side pagination with optional infinite scroll.
 *
 * Pass the full (already filtered + sorted) `items` array. The hook slices
 * it to `pageSize` items and exposes a `sentinelRef` div that — when it
 * enters the viewport — loads the next page automatically.
 *
 * Resets to page 1 automatically whenever `items` identity changes (i.e.
 * whenever search/filter/sort changes produce a new array reference).
 */
export function usePaginatedList<T>(
  items: T[],
  pageSize = LIST_PAGE_SIZE,
): PaginatedListResult<T> {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset to first page whenever the source array changes.
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const hasMore = visibleCount < items.length;
  const visible = items.slice(0, visibleCount);

  // Infinite scroll via IntersectionObserver.
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((v) => v + pageSize);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, pageSize]);

  return { visible, hasMore, sentinelRef, total: items.length };
}
