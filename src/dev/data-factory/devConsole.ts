// ─── Dev Console Bridge ─────────────────────────────────────────────────────
// Attaches the Developer Data Factory to `window` in dev builds only (wired up
// from main.tsx, gated by import.meta.env.DEV — never imported by any page or
// component). This is the manual trigger: nothing here runs automatically.
//
// From the browser DevTools console, on the running app:
//   window.ternakDevFactory.seed()                    // run with default config
//   window.ternakDevFactory.seed({ livestock: 100 })  // override any config field
//   window.ternakDevFactory.clear()                   // remove only seeded data
//   window.ternakDevFactory.defaultConfig             // inspect the defaults

import { runSeed, type SeedResult } from './seed';
import { clearSeed, type ClearResult } from './clear';
import { DEFAULT_SEED_CONFIG, type SeedConfig } from './config';

declare global {
  interface Window {
    ternakDevFactory?: {
      seed: (overrides?: Partial<SeedConfig>) => SeedResult;
      clear: () => ClearResult;
      defaultConfig: SeedConfig;
    };
  }
}

export function installDevFactory(): void {
  if (typeof window === 'undefined') return;

  window.ternakDevFactory = {
    seed: (overrides) => {
      const result = runSeed(overrides);
      console.log('[TernakHub Data Factory] Seed complete:', result);
      return result;
    },
    clear: () => {
      const result = clearSeed();
      console.log('[TernakHub Data Factory] Clear complete:', result);
      return result;
    },
    defaultConfig: DEFAULT_SEED_CONFIG,
  };

  console.log('[TernakHub Data Factory] Ready — window.ternakDevFactory.seed() / .clear()');
}
