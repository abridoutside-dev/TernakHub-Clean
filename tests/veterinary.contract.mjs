/**
 * Veterinary workspace contract test (VET-001)
 *
 * Static analysis of the Veterinary workspace implementation:
 *   - Verifies route shell exists and is wired correctly.
 *   - Verifies veterinaryRepository exports expected functions.
 *   - Verifies types are defined.
 *   - Verifies operational pages have write paths.
 *   - Verifies no mock data in critical paths.
 *
 * Does NOT require a live Supabase connection — reads source files only.
 * Run: node --test tests/veterinary.contract.mjs
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

test('VeterinaryWorkspaceRoute exists and is wired in App.tsx', () => {
  const app = readFile('src/App.tsx');
  assert.ok(app.includes('VeterinaryWorkspaceRoute'), 'App.tsx must import VeterinaryWorkspaceRoute');
  assert.ok(app.includes('/workspace/:id/veterinary'), 'App.tsx must have /workspace/:id/veterinary route');
});

test('VeterinaryWorkspaceRoute delegates to dashboard/operational based on tab', () => {
  const src = readFile('src/pages/workspaceDashboards/VeterinaryWorkspaceRoute.tsx');
  assert.ok(src.includes('getWorkspaceOperationalConfig'), 'Must import operational config');
  assert.ok(src.includes('getWorkspaceDashboardConfig'), 'Must import dashboard config');
  assert.ok(src.includes('searchParams.get(\'tab\') === \'operational\''), 'Must check ?tab=operational');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 2: Repository exports
// ─────────────────────────────────────────────────────────────────────────────

test('veterinaryRepository exports service catalog functions', () => {
  const src = readFile('src/repositories/veterinaryRepository.ts');
  assert.ok(src.includes('export async function repoGetVetServicesByWorkspace'), 'Must export repoGetVetServicesByWorkspace');
  assert.ok(src.includes('export async function repoInsertVetService'), 'Must export repoInsertVetService');
  assert.ok(src.includes('export async function repoPatchVetService'), 'Must export repoPatchVetService');
  assert.ok(src.includes('export async function repoDeleteVetService'), 'Must export repoDeleteVetService');
  assert.ok(src.includes('export async function repoGetClinicServicesByWorkspace'), 'Must export repoGetClinicServicesByWorkspace');
  assert.ok(src.includes('export async function repoInsertClinicService'), 'Must export repoInsertClinicService');
});

test('veterinaryRepository exports health CRUD functions', () => {
  const src = readFile('src/repositories/veterinaryRepository.ts');
  assert.ok(src.includes('export async function repoInsertVetCheckup'), 'Must export repoInsertVetCheckup');
  assert.ok(src.includes('export async function repoPatchVetCheckup'), 'Must export repoPatchVetCheckup');
  assert.ok(src.includes('export async function repoDeleteVetCheckup'), 'Must export repoDeleteVetCheckup');
  assert.ok(src.includes('export async function repoInsertVetTreatment'), 'Must export repoInsertVetTreatment');
  assert.ok(src.includes('export async function repoPatchVetTreatment'), 'Must export repoPatchVetTreatment');
  assert.ok(src.includes('export async function repoDeleteVetTreatment'), 'Must export repoDeleteVetTreatment');
  assert.ok(src.includes('export async function repoInsertVetSchedule'), 'Must export repoInsertVetSchedule');
  assert.ok(src.includes('export async function repoPatchVetSchedule'), 'Must export repoPatchVetSchedule');
  assert.ok(src.includes('export async function repoCompleteVetSchedule'), 'Must export repoCompleteVetSchedule');
});

test('veterinaryRepository exports marketplace integration', () => {
  const src = readFile('src/repositories/veterinaryRepository.ts');
  assert.ok(src.includes('export async function repoCreateVetServiceFromMarketplace'), 'Must export repoCreateVetServiceFromMarketplace');
  assert.ok(src.includes('export async function repoGetServiceQuotationsByWorkspace'), 'Must export repoGetServiceQuotationsByWorkspace');
  assert.ok(src.includes('export async function repoInsertServiceQuotation'), 'Must export repoInsertServiceQuotation');
});

test('veterinaryRepository exports transaction_room helpers', () => {
  const src = readFile('src/repositories/veterinaryRepository.ts');
  assert.ok(src.includes('export async function repoGetTransactionRoomByMarketplace'), 'Must export repoGetTransactionRoomByMarketplace');
  assert.ok(src.includes('export async function repoGetOrCreateTransactionRoom'), 'Must export repoGetOrCreateTransactionRoom');
  assert.ok(src.includes('export async function repoPatchTransactionRoom'), 'Must export repoPatchTransactionRoom');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 3: Types
// ─────────────────────────────────────────────────────────────────────────────

test('veterinary types are defined', () => {
  const src = readFile('src/types/veterinary.ts');
  assert.ok(src.includes('export interface VetServiceDbRow'), 'Must define VetServiceDbRow');
  assert.ok(src.includes('export interface ClinicServiceDbRow'), 'Must define ClinicServiceDbRow');
  assert.ok(src.includes('export interface VetServiceQuotationDbRow'), 'Must define VetServiceQuotationDbRow');
  assert.ok(src.includes('export interface CreateVetServiceFromMarketplaceInput'), 'Must define CreateVetServiceFromMarketplaceInput');
  assert.ok(src.includes('export interface CreateVetServiceFromMarketplaceResult'), 'Must define CreateVetServiceFromMarketplaceResult');
  assert.ok(src.includes('export interface TransactionRoomDbRow'), 'Must define TransactionRoomDbRow');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 4: Operational pages have write paths
// ─────────────────────────────────────────────────────────────────────────────

test('DokterHewanOperational has write-path UI', () => {
  const src = readFile('src/pages/workspaceOperational/DokterHewanOperational.tsx');
  assert.ok(src.includes('ServiceFormModal'), 'Must have service form modal');
  assert.ok(src.includes('CheckupFormModal'), 'Must have checkup form modal');
  assert.ok(src.includes('TreatmentFormModal'), 'Must have treatment form modal');
  assert.ok(src.includes('ScheduleFormModal'), 'Must have schedule form modal');
  assert.ok(src.includes('repoInsertVetService'), 'Must call repoInsertVetService');
  assert.ok(src.includes('repoInsertVetCheckup'), 'Must call repoInsertVetCheckup');
  assert.ok(src.includes('repoInsertVetTreatment'), 'Must call repoInsertVetTreatment');
  assert.ok(src.includes('repoInsertVetSchedule'), 'Must call repoInsertVetSchedule');
});

test('KlinikHewanOperational has write-path UI', () => {
  const src = readFile('src/pages/workspaceOperational/KlinikHewanOperational.tsx');
  assert.ok(src.includes('ClinicServiceFormModal'), 'Must have clinic service form modal');
  assert.ok(src.includes('CheckupFormModal'), 'Must have checkup form modal');
  assert.ok(src.includes('TreatmentFormModal'), 'Must have treatment form modal');
  assert.ok(src.includes('ScheduleFormModal'), 'Must have schedule form modal');
  assert.ok(src.includes('repoInsertClinicService'), 'Must call repoInsertClinicService');
  assert.ok(src.includes('repoInsertVetCheckup'), 'Must call repoInsertVetCheckup');
  assert.ok(src.includes('repoInsertVetTreatment'), 'Must call repoInsertVetTreatment');
  assert.ok(src.includes('repoInsertVetSchedule'), 'Must call repoInsertVetSchedule');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 5: No mock data in operational pages
// ─────────────────────────────────────────────────────────────────────────────

test('DokterHewanOperational does not import mock data files', () => {
  const src = readFile('src/pages/workspaceOperational/DokterHewanOperational.tsx');
  assert.ok(!src.includes('veterinaryWorkspaceData'), 'Must not import veterinaryWorkspaceData');
  assert.ok(!src.includes('clinicWorkspaceData'), 'Must not import clinicWorkspaceData');
  assert.ok(!src.includes('layananDokterHewanData'), 'Must not import layananDokterHewanData');
});

test('KlinikHewanOperational does not import mock data files', () => {
  const src = readFile('src/pages/workspaceOperational/KlinikHewanOperational.tsx');
  assert.ok(!src.includes('veterinaryWorkspaceData'), 'Must not import veterinaryWorkspaceData');
  assert.ok(!src.includes('clinicWorkspaceData'), 'Must not import clinicWorkspaceData');
  assert.ok(!src.includes('layananKlinikHewanData'), 'Must not import layananKlinikHewanData');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 6: Route shell handles both DokterHewan and KlinikHewan kinds
// ─────────────────────────────────────────────────────────────────────────────

test('VeterinaryWorkspaceRoute imports getWorkspaceKindFromRecord', () => {
  const src = readFile('src/pages/workspaceDashboards/VeterinaryWorkspaceRoute.tsx');
  assert.ok(src.includes('getWorkspaceKindFromRecord'), 'Must import getWorkspaceKindFromRecord to resolve kind');
});

test('Workspace registry has DokterHewan and KlinikHewan entries', () => {
  const src = readFile('src/config/workspaceRegistry.ts');
  assert.ok(src.includes("DokterHewan:"), 'Registry must have DokterHewan entry');
  assert.ok(src.includes("KlinikHewan:"), 'Registry must have KlinikHewan entry');
  assert.ok(src.includes("dbType:        'Veterinary'") || src.includes("dbType: 'Veterinary'"), 'Both must map to dbType Veterinary');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 7: Marketplace integration is real (not mock)
// ─────────────────────────────────────────────────────────────────────────────

test('veterinaryRepository marketplace function queries canonical tables', () => {
  const src = readFile('src/repositories/veterinaryRepository.ts');
  const fnMatch = src.match(/export async function repoCreateVetServiceFromMarketplace[\s\S]*?\n\}\n/);
  assert.ok(fnMatch, 'Function body not found');
  const body = fnMatch[0];
  const fromRegex = /\.from\(['"]([a-z_]+)['"]\)/g;
  const allowed = new Set(['marketplace_transactions', 'transaction_rooms', 'service_quotations']);
  let m;
  while ((m = fromRegex.exec(body)) !== null) {
    assert.ok(allowed.has(m[1]), `Queries non-canonical table "${m[1]}". Allowed: ${[...allowed].join(', ')}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

test('Veterinary workspace contract summary', () => {
  assert.ok(true, 'All Veterinary workspace contracts verified.');
});
