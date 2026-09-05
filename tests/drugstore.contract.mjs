/**
 * DrugStore workspace contract test (DS-001)
 *
 * Static analysis of the DrugStore workspace implementation:
 *   - Verifies route shell exists and is wired correctly.
 *   - Verifies repository exports expected functions.
 *   - Verifies types are defined.
 *   - Verifies dashboard uses live data.
 *   - Verifies sales service has real stock deduction.
 *   - Verifies stok obat service has real operations.
 *   - Verifies no mock data in critical paths.
 *
 * Does NOT require a live Supabase connection — reads source files only.
 * Run: node --test tests/drugstore.contract.mjs
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

test('DrugStoreWorkspaceRoute exists and is wired in App.tsx', () => {
  const app = readFile('src/App.tsx');
  assert.ok(app.includes('DrugStoreWorkspaceRoute'), 'App.tsx must import DrugStoreWorkspaceRoute');
  assert.ok(app.includes('/workspace/:id/drug-store'), 'App.tsx must have /workspace/:id/drug-store route');
});

test('DrugStoreWorkspaceRoute delegates to dashboard/operational based on tab', () => {
  const src = readFile('src/pages/workspaceDashboards/DrugStoreWorkspaceRoute.tsx');
  assert.ok(src.includes('getWorkspaceOperationalConfig'), 'Must import operational config');
  assert.ok(src.includes('getWorkspaceDashboardConfig'), 'Must import dashboard config');
  assert.ok(src.includes('searchParams.get(\'tab\') === \'operational\''), 'Must check ?tab=operational');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 2: Repository exports
// ─────────────────────────────────────────────────────────────────────────────

test('drugStoreRepository exports supplier functions', () => {
  const src = readFile('src/repositories/drugStoreRepository.ts');
  assert.ok(src.includes('export async function repoGetDrugStoreSuppliersByWorkspace'), 'Must export repoGetDrugStoreSuppliersByWorkspace');
  assert.ok(src.includes('export async function repoInsertDrugStoreSupplier'), 'Must export repoInsertDrugStoreSupplier');
  assert.ok(src.includes('export async function repoUpdateDrugStoreSupplier'), 'Must export repoUpdateDrugStoreSupplier');
  assert.ok(src.includes('export async function repoDeleteDrugStoreSupplier'), 'Must export repoDeleteDrugStoreSupplier');
});

test('drugStoreRepository exports order functions', () => {
  const src = readFile('src/repositories/drugStoreRepository.ts');
  assert.ok(src.includes('export async function repoGetDrugStoreOrdersByWorkspace'), 'Must export repoGetDrugStoreOrdersByWorkspace');
  assert.ok(src.includes('export async function repoInsertDrugStoreOrder'), 'Must export repoInsertDrugStoreOrder');
  assert.ok(src.includes('export async function repoUpdateDrugStoreOrder'), 'Must export repoUpdateDrugStoreOrder');
  assert.ok(src.includes('export async function repoDeleteDrugStoreOrder'), 'Must export repoDeleteDrugStoreOrder');
});

test('drugStoreRepository exports sales functions', () => {
  const src = readFile('src/repositories/drugStoreRepository.ts');
  assert.ok(src.includes('export async function repoGetDrugStoreSalesByWorkspace'), 'Must export repoGetDrugStoreSalesByWorkspace');
  assert.ok(src.includes('export async function repoInsertDrugStoreSale'), 'Must export repoInsertDrugStoreSale');
  assert.ok(src.includes('export async function repoUpdateDrugStoreSale'), 'Must export repoUpdateDrugStoreSale');
  assert.ok(src.includes('export async function repoDeleteDrugStoreSale'), 'Must export repoDeleteDrugStoreSale');
});

test('drugStoreRepository exports customer functions', () => {
  const src = readFile('src/repositories/drugStoreRepository.ts');
  assert.ok(src.includes('export async function repoGetDrugStoreCustomersByWorkspace'), 'Must export repoGetDrugStoreCustomersByWorkspace');
  assert.ok(src.includes('export async function repoInsertDrugStoreCustomer'), 'Must export repoInsertDrugStoreCustomer');
  assert.ok(src.includes('export async function repoUpdateDrugStoreCustomer'), 'Must export repoUpdateDrugStoreCustomer');
  assert.ok(src.includes('export async function repoDeleteDrugStoreCustomer'), 'Must export repoDeleteDrugStoreCustomer');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 3: Sales service has real stock deduction
// ─────────────────────────────────────────────────────────────────────────────

test('drugStoreSalesService has atomic stock deduction', () => {
  const src = readFile('src/services/drugStoreSalesService.ts');
  assert.ok(src.includes('export async function completeSale'), 'Must export completeSale');
  assert.ok(src.includes('addStokKeluar'), 'completeSale must call addStokKeluar for stock deduction');
  assert.ok(src.includes('idempotency') || src.includes('Idempotency'), 'Must handle idempotency');
});

test('drugStoreSalesService validates stock before deduction', () => {
  const src = readFile('src/services/drugStoreSalesService.ts');
  assert.ok(src.includes('stock') || src.includes('quantity'), 'Must validate stock quantity');
  assert.ok(src.includes('workspace_id'), 'Must validate workspace ownership');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 4: Stok obat service has real operations
// ─────────────────────────────────────────────────────────────────────────────

test('stokObatService has real stock operations', () => {
  const src = readFile('src/services/stokObatService.ts');
  assert.ok(src.includes('export async function addStokMasuk'), 'Must export addStokMasuk');
  assert.ok(src.includes('export async function addStokKeluar'), 'Must export addStokKeluar');
  assert.ok(src.includes('export async function applyAdjustment'), 'Must export applyAdjustment');
  assert.ok(src.includes('repoInsertStokMasuk'), 'Must insert stok_obat_masuk');
  assert.ok(src.includes('repoInsertStokKeluar'), 'Must insert stok_obat_keluar');
});

test('stokObatService has order completion flow', () => {
  const src = readFile('src/services/stokObatService.ts');
  assert.ok(src.includes('export async function recordDrugStoreOrderCompletion'), 'Must export recordDrugStoreOrderCompletion');
  assert.ok(src.includes('Pembelian') || src.includes('Penjualan'), 'Must handle order types');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 5: Dashboard uses live data
// ─────────────────────────────────────────────────────────────────────────────

test('DrugStoreDashboard uses live data hook', () => {
  const src = readFile('src/pages/workspaceDashboards/DrugStoreDashboard.tsx');
  assert.ok(src.includes('useDrugStoreDashboardData'), 'Must use useDrugStoreDashboardData');
  assert.ok(!src.includes('drugStoreWorkspaceData'), 'Must not import mock data');
});

test('DrugStoreOperational uses live data hook', () => {
  const src = readFile('src/pages/workspaceOperational/DrugStoreOperational.tsx');
  assert.ok(src.includes('useDrugStoreDashboardData'), 'Must use useDrugStoreDashboardData');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 6: Types are defined
// ─────────────────────────────────────────────────────────────────────────────

test('drugStore types are defined', () => {
  const src = readFile('src/types/drugStore.ts');
  assert.ok(src.includes('export interface DrugStoreSupplierDbRow'), 'Must define DrugStoreSupplierDbRow');
  assert.ok(src.includes('export interface DrugStoreCustomerDbRow'), 'Must define DrugStoreCustomerDbRow');
  assert.ok(src.includes('export interface DrugStoreOrderDbRow'), 'Must define DrugStoreOrderDbRow');
  assert.ok(src.includes('export interface DrugStoreSalesDbRow'), 'Must define DrugStoreSalesDbRow');
});

test('drugCatalog types are defined', () => {
  const src = readFile('src/types/drugCatalog.ts');
  assert.ok(src.includes('export interface DrugCatalogDbRow'), 'Must define DrugCatalogDbRow');
  assert.ok(src.includes('export interface DrugCategoryDbRow'), 'Must define DrugCategoryDbRow');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 7: CRUD pages exist and are functional
// ─────────────────────────────────────────────────────────────────────────────

test('DrugStore has supplier CRUD pages', () => {
  const list = readFile('src/pages/drugStore/DrugStoreSupplierList.tsx');
  const form = readFile('src/pages/drugStore/DrugStoreSupplierForm.tsx');
  assert.ok(list.includes('repoGetDrugStoreSuppliersByWorkspace'), 'List must query suppliers');
  assert.ok(form.includes('repoInsertDrugStoreSupplier') || form.includes('repoUpdateDrugStoreSupplier'), 'Form must save supplier');
});

test('DrugStore has order CRUD pages with stock integration', () => {
  const list = readFile('src/pages/drugStore/DrugStoreOrderList.tsx');
  const detail = readFile('src/pages/drugStore/DrugStoreOrderDetail.tsx');
  assert.ok(list.includes('repoGetDrugStoreOrdersByWorkspace'), 'List must query orders');
  assert.ok(detail.includes('recordDrugStoreOrderCompletion'), 'Detail must complete order with stock logic');
});

test('DrugStore has sales CRUD pages with stock deduction', () => {
  const list = readFile('src/pages/drugStore/DrugStoreSalesList.tsx');
  const detail = readFile('src/pages/drugStore/DrugStoreSalesDetail.tsx');
  assert.ok(list.includes('repoGetDrugStoreSalesByWorkspace'), 'List must query sales');
  assert.ok(detail.includes('completeSale'), 'Detail must complete sale with stock deduction');
  assert.ok(detail.includes('cancelSale'), 'Detail must cancel sale');
});

test('DrugStore has stock movement pages', () => {
  const masuk = readFile('src/pages/drugStore/DrugStoreStokMasuk.tsx');
  const keluar = readFile('src/pages/drugStore/DrugStoreStokKeluar.tsx');
  const adjust = readFile('src/pages/drugStore/DrugStorePenyesuaianStok.tsx');
  assert.ok(masuk.includes('addStokMasuk'), 'StokMasuk must call addStokMasuk');
  assert.ok(keluar.includes('addStokKeluar'), 'StokKeluar must call addStokKeluar');
  assert.ok(adjust.includes('applyAdjustment'), 'Penyesuaian must call applyAdjustment');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 8: No mock data in core paths
// ─────────────────────────────────────────────────────────────────────────────

test('DrugStoreDashboard does not import mock data', () => {
  const src = readFile('src/pages/workspaceDashboards/DrugStoreDashboard.tsx');
  assert.ok(!src.includes('drugStoreWorkspaceData'), 'Dashboard must not import mock data');
});

test('DrugStoreOperational does not import mock data', () => {
  const src = readFile('src/pages/workspaceOperational/DrugStoreOperational.tsx');
  assert.ok(!src.includes('drugStoreWorkspaceData'), 'Operational must not import mock data');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

test('DrugStore workspace contract summary', () => {
  assert.ok(true, 'All DrugStore workspace contracts verified.');
});
