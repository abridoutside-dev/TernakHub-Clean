import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Saves scroll position for every route (keyed by location.key) to
 * sessionStorage and restores it when the user returns to that route via
 * the back button. Forward navigations scroll to the top.
 *
 * Works with BrowserRouter (no Data-Router / RouterProvider required).
 */
export default function ScrollRestorer() {
  const location = useLocation();

  useEffect(() => {
    const storageKey = `scroll:${location.key}`;

    // Restore saved position (double rAF so the page has painted before we scroll)
    const saved = sessionStorage.getItem(storageKey);
    let raf1 = 0;
    let raf2 = 0;
    if (saved !== null) {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(saved, 10));
        });
      });
    } else {
      // Fresh forward navigation — start at top
      window.scrollTo(0, 0);
    }

    // When the effect re-runs (location changes), save the scroll position
    // of the route we are LEAVING before the new route's effect fires.
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      sessionStorage.setItem(storageKey, String(window.scrollY));
    };
  }, [location.key]);

  return null;
}
