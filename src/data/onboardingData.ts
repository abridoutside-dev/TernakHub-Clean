// ─── Onboarding Data — ONB-001 ───────────────────────────────────────────────
// Stores onboarding completion status in localStorage.
// No backend. No external services.
//
// Rules:
//  - hasCompletedOnboarding() is the single gate used by App.tsx redirect.
//  - resetOnboarding() is the "Restart from Settings" entry point.
//  - markOnboardingSkipped() counts as completed so the flow doesn't re-trigger.

const STORAGE_KEY = 'ternakhub_onboarding_v1';

export interface OnboardingStatus {
  completed: boolean;
  completedAt: string | null;
  skippedAt: string | null;
}

function defaultStatus(): OnboardingStatus {
  return { completed: false, completedAt: null, skippedAt: null };
}

export function getOnboardingStatus(): OnboardingStatus {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStatus();
    return JSON.parse(raw) as OnboardingStatus;
  } catch {
    return defaultStatus();
  }
}

export function hasCompletedOnboarding(): boolean {
  return getOnboardingStatus().completed;
}

export function markOnboardingComplete(): void {
  const status: OnboardingStatus = {
    completed: true,
    completedAt: new Date().toISOString(),
    skippedAt: null,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
}

export function markOnboardingSkipped(): void {
  const existing = getOnboardingStatus();
  const status: OnboardingStatus = {
    completed: true,
    completedAt: existing.completedAt,
    skippedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
}

/** Clears completion flag — used by "Restart Onboarding" in Settings. */
export function resetOnboarding(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Step metadata ────────────────────────────────────────────────────────────

export const TOTAL_STEPS = 7;

export const STEP_TITLES: Record<number, string> = {
  1: 'Selamat Datang',
  2: 'Pilih Tipe Workspace',
  3: 'Buat Workspace Pertama',
  4: 'Tur Platform',
  5: 'Aksi Cepat',
  6: 'Pilih Paket',
  7: 'Selesai',
};
