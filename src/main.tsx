import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { PlatformInitProvider } from './contexts/PlatformInitContext';
import RootErrorBoundary from './components/RootErrorBoundary';
import './index.css';

// Developer Data Factory — dev-only, excluded from production builds.
//
// devAutoSeed runs BEFORE React mounts so that every page's initial render
// already sees a populated LIVESTOCK_DB. Without the await the seed would
// resolve after the first render, leaving CatatBobot (and other list pages)
// with an empty list on cold load.
//
// devConsole is wired up lazily (fire-and-forget) because window.ternakDevFactory
// is only used from the browser console and doesn't need to be ready before paint.
async function boot() {
  // Restore user-recorded weight entries from localStorage before React mounts,
  // so every page's initial render already sees the user's latest weights.
  // This runs unconditionally (dev and prod) since user data lives in localStorage.
  const { restoreUserWeightToLivestock } = await import('./data/livestockData');

  if (import.meta.env.DEV) {
    try {
      const { devAutoSeed } = await import('./dev/data-factory/devAutoSeed');
      devAutoSeed();
    } catch (e) {
      console.warn('[TernakHub Auto-Seed] Failed — app will start with empty database.', e);
    }
    import('./dev/data-factory/devConsole').then(({ installDevFactory }) => installDevFactory());
  }

  // Apply user weights AFTER the seed so user entries overwrite the seed values
  // on LIVESTOCK_DB base records. Safe to call when USER_WEIGHT_DB is empty.
  restoreUserWeightToLivestock();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <PlatformInitProvider>
          <RootErrorBoundary>
            <AuthProvider>
              <App />
            </AuthProvider>
          </RootErrorBoundary>
        </PlatformInitProvider>
      </BrowserRouter>
    </StrictMode>,
  );
}

boot();
