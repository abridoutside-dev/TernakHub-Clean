// ─── Platform Initialization Context ─────────────────────────────────────────
// AUTH-001 — Tracks whether the one-time platform bootstrap has been completed.
//
// Design rules:
//  - `initialized` is null while the async check is in flight; components that
//    block rendering (guards) must treat null as "still loading".
//  - The check fires once on mount and the result is shared across the whole
//    tree — no component re-fetches independently.
//  - `markInitialized()` is called by the Initialize page after a successful
//    bootstrap so all guards update instantly without a round-trip.
//  - On Supabase error the context defaults to `true` (already initialized).
//    This protects against accidental re-initialization if the database is
//    temporarily unreachable after the platform has been set up.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { checkPlatformInitialized } from '../services/platformInitService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlatformInitContextValue {
  /**
   * null  = check in progress (do not route yet).
   * true  = platform is initialized — /initialize is locked.
   * false = platform needs setup — all other routes redirect to /initialize.
   */
  initialized: boolean | null;
  /**
   * Call this immediately after a successful initialization so the guards
   * flip without waiting for a re-fetch.
   */
  markInitialized: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PlatformInitContext = createContext<PlatformInitContextValue | undefined>(
  undefined,
);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PlatformInitProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    checkPlatformInitialized().then((result) => {
      if (!cancelled) setInitialized(result);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const markInitialized = useCallback(() => setInitialized(true), []);

  return (
    <PlatformInitContext.Provider value={{ initialized, markInitialized }}>
      {children}
    </PlatformInitContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * usePlatformInit — consume platform initialization state.
 *
 * Throws if called outside <PlatformInitProvider>. This is intentional:
 * missing the provider is always a wiring bug, not a runtime condition.
 */
export function usePlatformInit(): PlatformInitContextValue {
  const ctx = useContext(PlatformInitContext);
  if (ctx === undefined) {
    throw new Error(
      '[TernakHub] usePlatformInit must be used inside <PlatformInitProvider>.',
    );
  }
  return ctx;
}
