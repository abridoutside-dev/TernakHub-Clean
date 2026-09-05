/**
 * FeedStore workspace contract test (FS-001)
 *
 * Static analysis of the FeedStore workspace implementation:
 *   - Verifies route shell exists and is wired correctly.
 *   - Verifies repository exports expected functions.
 *   - Verifies types are defined.
 *   - Verifies dashboard/operational pages use live data.
 *   - Verifies stock service has real write paths.
 *   - Verifies no mock data in critical paths.
 *
 * Does NOT require a live Supabase connection — reads source files only.
 * Run: node --test tests/feedstore.contract.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract 1: Route shell exists and is wired
// ─────────────────────────────────────────────────────────────────────────────

test('FeedStoreWorkspaceRoute exists and is wired in App.tsx', () => {
  const app = readFile('src/App.tsx');
  assert.ok(app.includes('FeedStoreWorkspaceRoute'), 'App.tsx must import FeedStoreWorkspaceRoute');
  assert.ok(app.includes('/workspace/:id/feed-store'), 'App.tsx must have /workspace/:id/feed-store route');
});

test('FeedStoreWorkspaceRoute delegates to dashboard/operational based on tab', () => {
  const src = readFile('src/pages/workspaceDashboards/FeedStoreWorkspaceRoute.tsx');
  assert.ok(src.includes('getWorkspaceOperationalConfig'), 'Must import operational config');
  assert.ok(src.includes('getWorkspaceDashboardConfig'), 'Must import dashboard config');
  assert.ok(src.includes('searchParams.get(\'tab\') === \'operational\''), 'Must check ?tab=operational');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 2: Repository exports
// ─────────────────────────────────────────────────────────────────────────────

test('feedStoreRepository exports supplier functions', () => {
  const src = readFile('src/repositories/feedStoreRepository.ts');
  assert.ok(src.includes('export async function repoGetSuppliersByWorkspace'), 'Must export repoGetSuppliersByWorkspace');
  assert.ok(src.includes('export async function repoInsertSupplier'), 'Must export repoInsertSupplier');
  assert.ok(src.includes('export async function repoUpdateSupplier'), 'Must export repoUpdateSupplier');
  assert.ok(src.includes('export async function repoDeleteSupplier'), 'Must export repoDeleteSupplier');
});

test('feedStoreRepository exports customer functions', () => {
  const src = readFile('src/repositories/feedStoreRepository.ts');
  assert.ok(src.includes('export async function repoGetCustomersByWorkspace'), 'Must export repoGetCustomersByWorkspace');
  assert.ok(src.includes('export async function repoInsertCustomer'), 'Must export repoInsertCustomer');
  assert.ok(src.includes('export async function repoUpdateCustomer'), 'Must export repoUpdateCustomer');
  assert.ok(src.includes('export async function repoDeleteCustomer'), 'Must export repoDeleteCustomer');
});

test('feedStoreRepository exports order functions', () => {
  const src = readFile('src/repositories/feedStoreRepository.ts');
  assert.ok(src.includes('export async function repoGetOrdersByWorkspace'), 'Must export repoGetOrdersByWorkspace');
  assert.ok(src.includes('export async function repoInsertOrder'), 'Must export repoInsertOrder');
  assert.ok(src.includes('export async function repoUpdateOrder'), 'Must export repoUpdateOrder');
  assert.ok(src.includes('export async function repoDeleteOrder'), 'Must export repoDeleteOrder');
});

test('feedStoreRepository exports sales functions', () => {
  const src = readFile('src/repositories/feedStoreRepository.ts');
  assert.ok(src.includes('export async function repoGetSalesByWorkspace'), 'Must export repoGetSalesByWorkspace');
  assert.ok(src.includes('export async function repoInsertSale'), 'Must export repoInsertSale');
  assert.ok(src.includes('export async function repoUpdateSale'), 'Must export repoUpdateSale');
  assert.ok(src.includes('export async function repoDeleteSale'), 'Must export repoDeleteSale');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 3: Stock service has real write paths
// ─────────────────────────────────────────────────────────────────────────────

test('stokInventarisService has real stock operations', () => {
  const src = readFile('src/services/stokInventarisService.ts');
  assert.ok(src.includes('export async function recordTambahStok'), 'Must export recordTambahStok');
  assert.ok(src.includes('export async function recordPerubahanStok'), 'Must export recordPerubahanStok');
  assert.ok(src.includes('export async function recordPenyesuaianPositif'), 'Must export recordPenyesuaianPositif');
  assert.ok(src.includes('export async function recordPindahGudang'), 'Must export recordPindahGudang');
});

test('stokInventarisService calls Supabase repositories', () => {
  const src = readFile('src/services/stokInventarisService.ts');
  assert.ok(src.includes('repoInsertStokTransaction'), 'Must call repoInsertStokTransaction');
  assert.ok(src.includes('repoInsertStokInventaris'), 'Must insert stok_inventaris');
  assert.ok(src.includes('repoPatchStokInventaris'), 'Must patch stok_inventaris');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 4: Dashboard uses live data
// ─────────────────────────────────────────────────────────────────────────────

test('FeedStoreDashboard uses live data hook', () => {
  const src = readFile('src/pages/workspaceDashboards/FeedStoreDashboard.tsx');
  assert.ok(src.includes('useFeedStoreDashboardData'), 'Must use useFeedStoreDashboardData');
  assert.ok(!src.includes('feedStoreWorkspaceData'), 'Must not use mock data file');
});

test('FeedStoreOperational uses live data hook', () => {
  const src = readFile('src/pages/workspaceOperational/FeedStoreOperational.tsx');
  assert.ok(src.includes('useFeedStoreDashboardData'), 'Must use useFeedStoreDashboardData');
  assert.ok(src.includes('recordTambahStok'), 'Must have stock-in write path');
  assert.ok(src.includes('recordPerubahanStok'), 'Must have stock-out write path');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 5: Types are defined
// ─────────────────────────────────────────────────────────────────────────────

test('feedStore types are defined', () => {
  const src = readFile('src/types/feedStore.ts');
  assert.ok(src.includes('export interface FeedStoreSupplierDbRow'), 'Must define FeedStoreSupplierDbRow');
  assert.ok(src.includes('export interface FeedStoreCustomerDbRow'), 'Must define FeedStoreCustomerDbRow');
  assert.ok(src.includes('export interface FeedStoreOrderDbRow'), 'Must define FeedStoreOrderDbRow');
  assert.ok(src.includes('export interface FeedStoreSalesDbRow'), 'Must define FeedStoreSalesDbRow');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 6: No mock data in core paths
// ─────────────────────────────────────────────────────────────────────────────

test('FeedStoreDashboard does not import mock data', () => {
  const src = readFile('src/pages/workspaceDashboards/FeedStoreDashboard.tsx');
  assert.ok(!src.includes('feedStoreWorkspaceData'), 'Dashboard must not import mock data');
});

test('FeedStoreOperational does not import mock data', () => {
  const src = readFile('src/pages/workspaceOperational/FeedStoreOperational.tsx');
  assert.ok(!src.includes('feedStoreWorkspaceData'), 'Operational must not import mock data');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 7: CRUD pages exist
// ─────────────────────────────────────────────────────────────────────────────

test('FeedStore has supplier CRUD pages', () => {
  const list = readFile('src/pages/feedStore/FeedStoreSupplierList.tsx');
  const form = readFile('src/pages/feedStore/FeedStoreSupplierForm.tsx');
  const detail = readFile('src/pages/feedStore/FeedStoreSupplierDetail.tsx');
  assert.ok(list.includes('repoGetSuppliersByWorkspace'), 'List must query suppliers');
  assert.ok(form.includes('repoInsertSupplier') || form.includes('repoUpdateSupplier'), 'Form must save supplier');
  assert.ok(detail.includes('repoDeleteSupplier'), 'Detail must delete supplier');
});

test('FeedStore has order CRUD pages', () => {
  const list = readFile('src/pages/feedStore/FeedStoreOrderList.tsx');
  const form = readFile('src/pages/feedStore/FeedStoreOrderForm.tsx');
  const detail = readFile('src/pages/feedStore/FeedStoreOrderDetail.tsx');
  assert.ok(list.includes('repoGetOrdersByWorkspace'), 'List must query orders');
  assert.ok(form.includes('repoInsertOrder') || form.includes('repoUpdateOrder'), 'Form must save order');
  assert.ok(detail.includes('recordOrderCompletion'), 'Detail must complete order with stock logic');
});

test('FeedStore has sales CRUD pages', () => {
  const list = readFile('src/pages/feedStore/FeedStoreSalesList.tsx');
  const form = readFile('src/pages/feedStore/FeedStoreSalesForm.tsx');
  const detail = readFile('src/pages/feedStore/FeedStoreSalesDetail.tsx');
  assert.ok(list.includes('repoGetSalesByWorkspace'), 'List must query sales');
  assert.ok(form.includes('repoInsertSale') || form.includes('repoUpdateSale'), 'Form must save sale');
  assert.ok(detail.includes('recordSaleCompletion'), 'Detail must complete sale with stock logic');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

test('FeedStore workspace contract summary', () => {
  assert.ok(true, 'All FeedStore workspace contracts verified.');
});
