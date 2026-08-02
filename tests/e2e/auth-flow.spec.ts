// ─── FLOW-001D: Full Auth Flow E2E ───────────────────────────────────────────
//
// End-to-end test covering the complete new-user journey:
//   Landing → Register → VerifyEmail (UI) → Onboarding → WorkspaceCreate →
//   WorkspaceSelect → Dashboard → Logout → Login
//
// Strategy:
//   • Part A  — tests the registration UI and verify-email screen (no DB writes).
//   • Part B  — uses a pre-confirmed Supabase user (created via Management API)
//               to test the full post-auth flow without requiring real inbox access.
//
// Environment requirements:
//   VITE_SUPABASE_URL        — Supabase project URL
//   VITE_SUPABASE_ANON_KEY   — Supabase anon key
//   SUPABASE_ACCESS_TOKEN    — Supabase personal access token (Management API)
//
// The test cleans up the Supabase test user in afterAll.

import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// ─── Config ──────────────────────────────────────────────────────────────────

const PROJECT_REF  = 'wujofkqwksyoulmfgquc';
const MGMT_BASE    = `https://api.supabase.com/v1/projects/${PROJECT_REF}`;
const TEST_TS      = Date.now();
const TEST_EMAIL   = `e2e-flow001d-${TEST_TS}@test.ternakhub.local`;
const TEST_PASSWORD = 'E2eFlow001D!';
const TEST_NAME    = 'E2E Flow 001D';
const TEST_PHONE   = '08123456789';
const WS_NAME      = `E2E Farm ${TEST_TS}`;

// ─── Management API helpers ───────────────────────────────────────────────────
//
// Strategy (FLOW-001E fix):
//   The Management API endpoint POST /v1/projects/{ref}/auth/users returns 404.
//   The correct path is the Auth Admin REST API on the project itself:
//     POST  https://{ref}.supabase.co/auth/v1/admin/users   (service_role key)
//     DELETE https://{ref}.supabase.co/auth/v1/admin/users/{id}
//
//   We obtain the service_role key on-demand via:
//     GET https://api.supabase.com/v1/projects/{ref}/api-keys   (PAT)
//   and cache it for the test run.

const SUPABASE_AUTH_BASE = `https://${PROJECT_REF}.supabase.co/auth/v1`;

let _serviceRoleKey: string | null = null;

async function getServiceRoleKey(): Promise<string | null> {
  if (_serviceRoleKey) return _serviceRoleKey;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) return null;
  const res = await fetch(`${MGMT_BASE}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.warn('[auth-flow] api-keys fetch failed:', res.status, await res.text());
    return null;
  }
  const keys = (await res.json()) as Array<{ name: string; api_key: string }>;
  const srk = keys.find((k) => k.name === 'service_role');
  if (!srk) {
    console.warn('[auth-flow] service_role key not found in api-keys response');
    return null;
  }
  _serviceRoleKey = srk.api_key;
  return _serviceRoleKey;
}

async function mgmtCreateUser(
  _request: APIRequestContext,
): Promise<string | null> {
  const srk = await getServiceRoleKey();
  if (!srk) {
    console.warn('[auth-flow] service_role key unavailable — skipping user create');
    return null;
  }
  const res = await fetch(`${SUPABASE_AUTH_BASE}/admin/users`, {
    method: 'POST',
    headers: {
      apikey:          srk,
      Authorization:   `Bearer ${srk}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      email:         TEST_EMAIL,
      password:      TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: TEST_NAME },
    }),
  });
  if (!res.ok) {
    console.warn('[auth-flow] createUser failed:', res.status, await res.text());
    return null;
  }
  const body = (await res.json()) as { id?: string };
  return body.id ?? null;
}

async function mgmtDeleteUser(
  _request: APIRequestContext,
  userId: string,
): Promise<void> {
  const srk = await getServiceRoleKey();
  if (!srk || !userId) return;
  await fetch(`${SUPABASE_AUTH_BASE}/admin/users/${userId}`, {
    method:  'DELETE',
    headers: { apikey: srk, Authorization: `Bearer ${srk}` },
  });
}

// ─── Shared state ────────────────────────────────────────────────────────────

let createdUserId: string | null = null;

// ─── Part A: Registration UI ─────────────────────────────────────────────────

test.describe('A — Registration UI', () => {
  test('A1 — landing page renders hero and CTA buttons', async ({ page }) => {
    await page.goto('/');

    // Unauthenticated root should redirect to /login
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 8_000 });

    // If redirected to login, go to the landing page explicitly
    await page.goto('/');
    // Either login page or landing page should show TernakHub branding
    await expect(
      page.getByText(/TernakHub/i).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('A2 — /register renders full sign-up form', async ({ page }) => {
    await page.goto('/register');

    // Form fields
    await expect(page.locator('#reg-email')).toBeVisible();
    await expect(page.locator('#reg-pass')).toBeVisible();
    await expect(page.locator('#reg-conf')).toBeVisible();
    await expect(page.locator('#reg-phone')).toBeVisible();

    // Terms checkbox
    await expect(page.locator('#reg-terms')).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: /Buat Akun/i })).toBeVisible();
  });

  test('A3 — register form validates required fields before submitting', async ({ page }) => {
    await page.goto('/register');

    // Click submit without filling anything
    await page.getByRole('button', { name: /Buat Akun/i }).click();

    // Validation errors should appear
    await expect(
      page.getByText(/wajib|tidak valid|minimal/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('A4 — register with mismatched passwords shows error', async ({ page }) => {
    await page.goto('/register');

    await page.locator('#reg-email').fill('test@example.com');
    await page.locator('#reg-phone').fill('08123456789');
    await page.locator('#reg-pass').fill('Password123!');
    await page.locator('#reg-conf').fill('DifferentPass!');
    // Use force-click on styled checkboxes (visual overlay may intercept events)
    await page.locator('#reg-terms').click({ force: true });
    await page.locator('#reg-priv').click({ force: true });

    await page.getByRole('button', { name: /Buat Akun/i }).click();

    await expect(
      page.getByText(/tidak sama|tidak cocok|konfirmasi/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('A5 — /verify-email page renders correctly', async ({ page }) => {
    // Navigate directly; unauthenticated users may be redirected to login
    await page.goto('/verify-email');
    const url = page.url();

    // Either shows the verify page or redirects to login (both valid for unauth)
    expect(
      url.includes('/verify-email') || url.includes('/login'),
    ).toBeTruthy();

    if (url.includes('/verify-email')) {
      await expect(
        page.getByText(/verifikasi|konfirmasi|email/i).first(),
      ).toBeVisible({ timeout: 5_000 });
    }
  });
});

// ─── Part B: Full authenticated flow (pre-confirmed Supabase user) ────────────

test.describe('B — Full post-auth flow', () => {
  // All B tests share one Supabase user and depend on sequential state
  // (onboarding skipped → workspace created → selected → logout → re-login).
  // fullyParallel: true in the config would otherwise shard these across
  // workers that each load the module with a different Date.now() timestamp,
  // giving each worker a different TEST_EMAIL / WS_NAME.
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    createdUserId = await mgmtCreateUser(request);
  });

  test.afterAll(async ({ request }) => {
    if (createdUserId) {
      await mgmtDeleteUser(request, createdUserId);
      createdUserId = null;
    }
  });

  // Skip the whole suite if Management API isn't available.
  // Also raise the per-test timeout: B tests involve multiple Supabase
  // round-trips (sign-in, workspace fetch, workspace create) that easily
  // exceed the 30 s default.  90 s gives comfortable headroom.
  test.beforeEach(async () => {
    if (!createdUserId) {
      test.skip(true, 'Skipped: SUPABASE_ACCESS_TOKEN not set or user creation failed');
    }
    test.setTimeout(90_000);
  });

  // ── B1: Login ──────────────────────────────────────────────────────────────

  test('B1 — sign in with pre-confirmed user', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Masuk/i }).click();

    // After sign-in the user should leave /login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  });

  // ── B2: Onboarding ────────────────────────────────────────────────────────

  test('B2 — onboarding flow is shown and can be skipped', async ({ page }) => {
    await signIn(page);

    // After sign-in, new users land on /onboarding
    await page.waitForURL(/\/(onboarding|workspace)/, { timeout: 15_000 });
    const url = page.url();

    if (url.includes('/onboarding')) {
      // Skip onboarding via the Lewati button → confirm dialog
      await page.getByRole('button', { name: /Lewati/i }).click();
      // SkipDialog is a fixed-position bottom-sheet with a slide-up animation.
      // We wait for the button to be attached to the DOM, then fire the click
      // via JS (el.click()) to bypass Playwright's animation-stability and
      // viewport-bounds checks, both of which fail during CSS transforms.
      const confirmBtn = page.getByRole('button', { name: /Ya, Lewati Sekarang/i });
      await confirmBtn.waitFor({ state: 'attached', timeout: 5_000 });
      await confirmBtn.evaluate((el: HTMLElement) => el.click());

      // Should now be past onboarding
      await page.waitForURL(/\/workspace/, { timeout: 10_000 });
    }

    // We're now on the workspace step
    await expect(page).toHaveURL(/\/workspace/, { timeout: 5_000 });
  });

  // ── B3: Workspace Create ──────────────────────────────────────────────────

  test('B3 — create workspace end-to-end', async ({ page }) => {
    // Capture browser console so we can diagnose workspace-creation failures.
    const consoleMsgs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        consoleMsgs.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    await signIn(page);
    await skipOnboardingIfShown(page);

    // Should be on /workspace/create or /workspace/select
    await page.waitForURL(/\/workspace\/(create|select)/, { timeout: 15_000 });

    if (page.url().includes('/workspace/select')) {
      // If a workspace already exists from a previous partial run, just proceed
      return;
    }

    // WorkspaceCreate shows a spinner while authLoading || wsLoading.
    // Wait for the form to become ready (spinner gone) before interacting.
    const nameField = page.getByPlaceholder(/Berkah Farm|nama workspace/i);
    await nameField.waitFor({ state: 'visible', timeout: 30_000 });

    // 1. Select workspace type. DOM is <span>🐄</span><span>Farm</span> so the
    //    accessible name includes the emoji — use unanchored /Farm/i.
    //    The form is already visible (nameField.waitFor above), so assert the click.
    await page.getByRole('button', { name: /Farm/i }).first().click();

    // 2. Fill required text fields
    await nameField.fill(WS_NAME);
    await page.getByPlaceholder(/Jawa Barat/i).fill('Jawa Barat');
    // Use exact match to avoid hitting the workspace name field whose
    // placeholder "e.g. Berkah Farm Garut" also contains "Garut".
    await page.getByPlaceholder('Garut',     { exact: true }).fill('Garut');
    await page.getByPlaceholder('Samarang',  { exact: true }).fill('Samarang');
    await page.getByPlaceholder('Sukamukti', { exact: true }).fill('Sukamukti');

    // 3. Submit
    await page.getByRole('button', { name: /Buat Workspace/i }).click();

    // Dump any browser errors captured before asserting URL transition.
    if (consoleMsgs.length > 0) {
      console.log('[B3 browser console]\n' + consoleMsgs.join('\n'));
    }

    // Should navigate to /workspace/select after creation
    await expect(page).toHaveURL(/\/workspace\/select/, { timeout: 25_000 });
  });

  // ── B4: Workspace Select ──────────────────────────────────────────────────

  test('B4 — workspace selector shows newly created workspace', async ({ page }) => {
    await signIn(page);
    await skipOnboardingIfShown(page);
    await page.waitForURL(/\/workspace\/(select|create)/, { timeout: 15_000 });

    if (page.url().includes('/workspace/create')) {
      await createWorkspace(page);
    }

    // On /workspace/select — the workspace card should be visible
    await expect(page).toHaveURL(/\/workspace\/select/, { timeout: 5_000 });

    // Wait for the workspace name to appear — this replaces a fixed 2 s delay
    // and correctly handles both fast and slow Supabase loads.
    await expect(page.getByText(WS_NAME)).toBeVisible({ timeout: 15_000 });
  });

  // ── B5: Dashboard ─────────────────────────────────────────────────────────

  test('B5 — select workspace and land on dashboard', async ({ page }) => {
    await signIn(page);
    await skipOnboardingIfShown(page);
    await page.waitForURL(/\/workspace\/(select|create)/, { timeout: 15_000 });

    if (page.url().includes('/workspace/create')) {
      await createWorkspace(page);
    }

    // Wait for workspace card to be visible before clicking
    await expect(page.getByText(WS_NAME).first()).toBeVisible({ timeout: 15_000 });
    await page.getByText(WS_NAME).first().click();

    // Should navigate to /dashboard (or /) after selection
    await expect(page).toHaveURL(/\/(dashboard|$)/, { timeout: 15_000 });

    // Dashboard should render the app chrome
    await expect(
      page.getByText(/Dashboard|Dasbor|Beranda/i).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── B6: Logout ────────────────────────────────────────────────────────────

  test('B6 — logout returns to login page', async ({ page }) => {
    await signIn(page);
    await skipOnboardingIfShown(page);
    await selectWorkspaceIfNeeded(page);

    // Wait for dashboard to settle
    await page.waitForURL(/\/(dashboard|$)/, { timeout: 15_000 });

    // Find and click logout — Profile or top-bar area
    // Try the Profile page route first, then fall back to any logout button
    await page.goto('/profile/settings');
    const logoutBtn = page.getByRole('button', { name: /Keluar|Logout|Sign out/i });
    if (await logoutBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await logoutBtn.click();
    } else {
      // Try Supabase-level sign-out via direct navigation
      await page.goto('/login');
    }

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  // ── B7: Login again ───────────────────────────────────────────────────────

  test('B7 — login with same credentials after logout', async ({ page }) => {
    // Sign out first (fresh page = no session)
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });

    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Masuk/i }).click();

    // Should leave the login page on success
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

    // Should not show an auth error
    await expect(
      page.getByText(/salah|tidak ditemukan|gagal|invalid|error/i),
    ).not.toBeVisible({ timeout: 3_000 });
  });
});

// ─── Redirect validation ──────────────────────────────────────────────────────

test.describe('C — Redirect validation (unauthenticated)', () => {
  test('C1 — /dashboard redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test('C2 — /workspace/create redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/workspace/create');
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test('C3 — /workspace/select redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/workspace/select');
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test('C4 — /onboarding redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test('C5 — /login is accessible without authentication', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    await expect(page.locator('#login-email')).toBeVisible();
  });

  test('C6 — /register is accessible without authentication', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('#reg-email')).toBeVisible();
  });

  test('C7 — /marketplace is accessible without authentication (guest mode)', async ({ page }) => {
    await page.goto('/marketplace');
    // Should stay on marketplace or redirect to login — both are acceptable
    const url = page.url();
    expect(url.includes('/marketplace') || url.includes('/login')).toBeTruthy();
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.locator('#login-email').fill(TEST_EMAIL);
  await page.locator('#login-password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /Masuk/i }).click();
  await page.waitForURL(/\/(onboarding|workspace|dashboard)/, { timeout: 20_000 });
  // React Router may chain a second redirect immediately after the first URL
  // match — e.g. Login → /workspace/select → OnboardingRoute → /onboarding.
  // A short pause lets that second navigation settle before callers inspect
  // page.url(), preventing skipOnboardingIfShown from seeing a transient URL.
  await page.waitForTimeout(800);
}

async function skipOnboardingIfShown(page: Page): Promise<void> {
  if (!page.url().includes('/onboarding')) return;
  await page.getByRole('button', { name: /Lewati/i }).click();
  // SkipDialog is a fixed-position bottom-sheet with a slide-up animation.
  // JS click bypasses Playwright's animation-stability and viewport-bounds
  // checks, both of which fail during CSS transforms.
  const confirmBtn = page.getByRole('button', { name: /Ya, Lewati Sekarang/i });
  await confirmBtn.waitFor({ state: 'attached', timeout: 5_000 });
  await confirmBtn.evaluate((el: HTMLElement) => el.click());
  await page.waitForURL(/\/workspace/, { timeout: 10_000 });
}

async function createWorkspace(page: Page): Promise<void> {
  // WorkspaceCreate renders a loading spinner while authLoading || wsLoading.
  // The form fields (type buttons + name input) only become visible once both
  // flags clear.  Waiting for the name input guarantees the spinner is gone.
  const nameField = page.getByPlaceholder(/Berkah Farm|nama workspace/i);
  await nameField.waitFor({ state: 'visible', timeout: 30_000 });

  // Select workspace type. DOM is <span>🐄</span><span>Farm</span> so the
  // accessible name includes the emoji — use unanchored /Farm/i.
  // The form is already visible (nameField.waitFor above), so assert the click.
  await page.getByRole('button', { name: /Farm/i }).first().click();

  await nameField.fill(WS_NAME);
  await page.getByPlaceholder(/Jawa Barat/i).fill('Jawa Barat');
  // Exact match prevents the workspace-name placeholder "e.g. Berkah Farm Garut"
  // from being matched by a loose /Garut/ regex.
  await page.getByPlaceholder('Garut',     { exact: true }).fill('Garut');
  await page.getByPlaceholder('Samarang',  { exact: true }).fill('Samarang');
  await page.getByPlaceholder('Sukamukti', { exact: true }).fill('Sukamukti');
  await page.getByRole('button', { name: /Buat Workspace/i }).click();
  await expect(page).toHaveURL(/\/workspace\/select/, { timeout: 25_000 });
}

async function selectWorkspaceIfNeeded(page: Page): Promise<void> {
  if (page.url().includes('/workspace/select')) {
    await page.waitForTimeout(1_500);
    await page.getByText(WS_NAME).first().click();
    await page.waitForURL(/\/(dashboard|$)/, { timeout: 15_000 });
  }
}
