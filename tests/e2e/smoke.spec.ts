import { test, expect } from '@playwright/test';

// ─── Login ────────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test('login page loads with form and guest option', async ({ page }) => {
    await page.goto('/login');

    // Branding
    await expect(page.getByRole('heading', { name: 'TernakHub' })).toBeVisible();

    // Form fields
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();

    // Guest entry
    await expect(page.getByRole('button', { name: 'Lanjut sebagai Guest' })).toBeVisible();
  });

  test('guest login navigates to Marketplace', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Lanjut sebagai Guest' }).click();
    await expect(page).toHaveURL(/\/marketplace/);
  });
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
//
// Protected routes redirect unauthenticated visitors to /login.
// Note: the root "/" serves the public Landing page — /dashboard is the
// protected entry point that triggers the auth guard.

test.describe('Dashboard', () => {
  test('root route serves public landing page', async ({ page }) => {
    await page.goto('/');

    // Root shows the public Landing page — no redirect to /login.
    // The Landing page renders the TernakHub brand and CTA links.
    await expect(page.getByText('TernakHub').first()).toBeVisible({ timeout: 8_000 });
  });

  test('/dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');

    // Auth guard must redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });

    // The login page gate is correctly rendered
    await expect(page.getByRole('heading', { name: 'TernakHub' })).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
  });

  test('login form submits correctly (invalid credentials show error)', async ({ page }) => {
    await page.goto('/login');

    // Fill in bogus credentials
    await page.locator('#login-email').fill('smoke@test.invalid');
    await page.locator('#login-password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Masuk' }).click();

    // App must show an error message — not a blank crash
    await expect(
      page.getByText(/salah|tidak ditemukan|gagal|invalid|error/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Marketplace ──────────────────────────────────────────────────────────────

test.describe('Marketplace', () => {
  test('marketplace loads with search and shortcut cards via guest flow', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Lanjut sebagai Guest' }).click();
    await expect(page).toHaveURL(/\/marketplace/);

    // Search input
    await expect(
      page.getByPlaceholder('Cari ternak, pakan, obat, jasa...'),
    ).toBeVisible();

    // Shortcut cards rendered (ShortcutCard with icon + label)
    await expect(
      page.getByRole('button', { name: '➕ Buat Listing' }),
    ).toBeVisible();
  });

  test('marketplace direct navigation is accessible without login', async ({ page }) => {
    await page.goto('/marketplace');

    // Marketplace is a public route — stays on /marketplace (no redirect)
    await expect(page).toHaveURL(/\/marketplace/, { timeout: 8_000 });

    // Page must render the category filter or search bar
    await expect(
      page.getByText(/Semua|Ternak|Pakan|Obat/i).first(),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Workspace ────────────────────────────────────────────────────────────────

test.describe('Workspace', () => {
  test('public workspace profile loads', async ({ page }) => {
    await page.goto('/workspace/w1/profile');

    await expect(page.getByText('Profil Publik & Privat')).toBeVisible();
    await expect(page.getByText('Berkah Farm Garut').first()).toBeVisible();
  });
});

// ─── Farm ─────────────────────────────────────────────────────────────────────
//
// /workspace/:id/farm-profile is inside the authenticated route guard.
// Unauthenticated access redirects to /login (verified behaviour).
// The workspace public profile at /workspace/:id/profile is the public-facing
// page for a farm (accessible without login).

test.describe('Farm', () => {
  test('/workspace/:id/farm-profile redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/workspace/w1/farm-profile');

    // Protected route — must redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});
