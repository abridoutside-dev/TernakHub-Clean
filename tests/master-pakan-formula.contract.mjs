/**
 * Master Pakan + Formula Pakan contract test (MP-001 / FP-001)
 *
 * Static analysis of the Master Pakan and Formula Pakan implementation:
 *   - Verifies Master Pakan catalog structure and data.
 *   - Verifies Formula create/edit/delete flows.
 *   - Verifies ingredient cleanup on edit.
 *   - Verifies nutrition calculation.
 *   - Verifies no dummy/mock data in critical paths.
 *
 * Does NOT require a live Supabase connection — reads source files only.
 * Run: node --test tests/master-pakan-formula.contract.mjs
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
// Contract 1: Master Pakan catalog structure
// ─────────────────────────────────────────────────────────────────────────────

test('Master Pakan has 18 kategori induk', () => {
  const src = readFile('src/data/masterPakanKategoriData.ts');
  assert.ok(src.includes("slug: 'jagung'"), 'Must have jagung category');
  assert.ok(src.includes("slug: 'padi'"), 'Must have padi category');
  assert.ok(src.includes("slug: 'rumput'"), 'Must have rumput category');
  assert.ok(src.includes("slug: 'leguminosa'"), 'Must have leguminosa category');
  assert.ok(src.includes("slug: 'daun-daunan'"), 'Must have daun-daunan category');
  assert.ok(src.includes("slug: 'kacang-biji-bijian'"), 'Must have kacang-biji-bijian category');
  assert.ok(src.includes("slug: 'umbi-umbian'"), 'Must have umbi-umbian category');
  assert.ok(src.includes("slug: 'serealia-lain'"), 'Must have serealia-lain category');
  assert.ok(src.includes("slug: 'kelapa'"), 'Must have kelapa category');
  assert.ok(src.includes("slug: 'kelapa-sawit'"), 'Must have kelapa-sawit category');
  assert.ok(src.includes("slug: 'tebu'"), 'Must have tebu category');
  assert.ok(src.includes("slug: 'buah-limbah-buah'"), 'Must have buah-limbah-buah category');
  assert.ok(src.includes("slug: 'limbah-industri-pangan'"), 'Must have limbah-industri-pangan category');
  assert.ok(src.includes("slug: 'sumber-protein-hewani'"), 'Must have sumber-protein-hewani category');
  assert.ok(src.includes("slug: 'mineral'"), 'Must have mineral category');
  assert.ok(src.includes("slug: 'vitamin-feed-additive'"), 'Must have vitamin-feed-additive category');
  assert.ok(src.includes("slug: 'bahan-cair'"), 'Must have bahan-cair category');
  assert.ok(src.includes("slug: 'lainnya'"), 'Must have lainnya category');
});

test('Master Pakan has legacy flat DB with 16 items', () => {
  const src = readFile('src/data/masterPakanData.ts');
  assert.ok(src.includes("'mp-1':"), 'Must have mp-1');
  assert.ok(src.includes("'mp-2':"), 'Must have mp-2');
  assert.ok(src.includes("'mp-16':"), 'Must have mp-16');
});

test('Master Pakan data has nutrition fields', () => {
  const src = readFile('src/data/masterPakanData.ts');
  assert.ok(src.includes('proteinKasar:'), 'Must have proteinKasar');
  assert.ok(src.includes('seratKasar:'), 'Must have seratKasar');
  assert.ok(src.includes('tdn:'), 'Must have tdn');
  assert.ok(src.includes('me:'), 'Must have me');
  assert.ok(src.includes('ca:'), 'Must have ca');
  assert.ok(src.includes('p:'), 'Must have p');
});

test('Master Pakan has no mock data markers', () => {
  const src = readFile('src/data/masterPakanData.ts');
  assert.ok(!src.includes('mock'), 'Must not contain mock');
  assert.ok(!src.includes('dummy'), 'Must not contain dummy');
  assert.ok(!src.includes('placeholder'), 'Must not contain placeholder');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 2: Formula Pakan CRUD
// ─────────────────────────────────────────────────────────────────────────────

test('Formula data has create/read/update/archive/delete functions', () => {
  const src = readFile('src/data/formulaData.ts');
  assert.ok(src.includes('export function addFormula'), 'Must export addFormula');
  assert.ok(src.includes('export function updateFormula'), 'Must export updateFormula');
  assert.ok(src.includes('export function archiveFormula'), 'Must export archiveFormula');
  assert.ok(src.includes('export function unarchiveFormula'), 'Must export unarchiveFormula');
  assert.ok(src.includes('export function deleteFormula'), 'Must export deleteFormula');
});

test('Formula repository has create/update/delete functions', () => {
  const src = readFile('src/repositories/formulaRepository.ts');
  assert.ok(src.includes('export async function repoInsertFormula'), 'Must export repoInsertFormula');
  assert.ok(src.includes('export async function repoPatchFormula'), 'Must export repoPatchFormula');
  assert.ok(src.includes('export async function repoDeleteFormula'), 'Must export repoDeleteFormula');
  assert.ok(src.includes('export async function repoInsertFormulaIngredients'), 'Must export repoInsertFormulaIngredients');
  assert.ok(src.includes('export async function repoDeleteFormulaIngredients'), 'Must export repoDeleteFormulaIngredients');
});

test('Formula service has create/update/delete/archive functions', () => {
  const src = readFile('src/services/formulaService.ts');
  assert.ok(src.includes('export async function recordCreateFormula'), 'Must export recordCreateFormula');
  assert.ok(src.includes('export async function recordUpdateFormula'), 'Must export recordUpdateFormula');
  assert.ok(src.includes('export async function recordDeleteFormula'), 'Must export recordDeleteFormula');
  assert.ok(src.includes('export async function recordArchiveFormula'), 'Must export recordArchiveFormula');
  assert.ok(src.includes('export async function recordUnarchiveFormula'), 'Must export recordUnarchiveFormula');
  assert.ok(src.includes('export async function recordReplaceFormulaIngredients'), 'Must export recordReplaceFormulaIngredients');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 3: Formula Editor has write paths
// ─────────────────────────────────────────────────────────────────────────────

test('FormulaEditor has create and edit flows', () => {
  const src = readFile('src/pages/FormulaEditor.tsx');
  assert.ok(src.includes('recordCreateFormula'), 'Must call recordCreateFormula on create');
  assert.ok(src.includes('recordUpdateFormula'), 'Must call recordUpdateFormula on edit');
  assert.ok(src.includes('recordReplaceFormulaIngredients'), 'Must call recordReplaceFormulaIngredients on edit');
});

test('FormulaDetail has delete flow wired', () => {
  const src = readFile('src/pages/FormulaDetail.tsx');
  assert.ok(src.includes('recordDeleteFormula'), 'Must import recordDeleteFormula');
  assert.ok(src.includes('deleteFormula'), 'Must import deleteFormula');
  assert.ok(src.includes('handleDelete'), 'Must have delete handler');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 4: Formula Detail has delete button
// ─────────────────────────────────────────────────────────────────────────────

test('FormulaDetail has delete button and handler', () => {
  const src = readFile('src/pages/FormulaDetail.tsx');
  assert.ok(src.includes('deleteFormula'), 'Must import deleteFormula');
  assert.ok(src.includes('recordDeleteFormula'), 'Must import recordDeleteFormula');
  assert.ok(src.includes('Hapus Formula'), 'Must have delete button text');
  assert.ok(src.includes('Hapus Permanen'), 'Must have permanent delete confirmation');
  assert.ok(src.includes('handleDelete'), 'Must have delete handler');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 5: Nutrition calculation uses real Master Pakan data
// ─────────────────────────────────────────────────────────────────────────────

test('FormulaEditor computes nutrition from Master Pakan', () => {
  const src = readFile('src/pages/FormulaEditor.tsx');
  assert.ok(src.includes('computeNutrisi'), 'Must have computeNutrisi function');
  assert.ok(src.includes('getMasterPakanById'), 'Must look up Master Pakan by ID');
  assert.ok(src.includes('getMasterPakanByName'), 'Must fallback to name lookup');
  assert.ok(src.includes('proteinKasar'), 'Must use proteinKasar from Master Pakan');
  assert.ok(src.includes('seratKasar'), 'Must use seratKasar from Master Pakan');
  assert.ok(src.includes('tdn'), 'Must use tdn from Master Pakan');
});

test('Formula nutrition calculation does not hardcode values', () => {
  const src = readFile('src/pages/FormulaEditor.tsx');
  assert.ok(!src.includes('pk: 17'), 'Must not hardcode PK values');
  assert.ok(!src.includes('sk: 16'), 'Must not hardcode SK values');
  assert.ok(!src.includes('tdn: 68'), 'Must not hardcode TDN values');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 6: No mock data in Formula/Master Pakan core paths
// ─────────────────────────────────────────────────────────────────────────────

test('FormulaEditor does not import mock data', () => {
  const src = readFile('src/pages/FormulaEditor.tsx');
  assert.ok(!src.includes('formulaWorkspaceData'), 'Must not import formulaWorkspaceData');
  assert.ok(!src.includes('mock'), 'Must not import mock data');
});

test('FormulaDetail does not import mock data', () => {
  const src = readFile('src/pages/FormulaDetail.tsx');
  assert.ok(!src.includes('formulaWorkspaceData'), 'Must not import formulaWorkspaceData');
  assert.ok(!src.includes('mock'), 'Must not import mock data');
});

test('FormulaTab does not import mock data', () => {
  const src = readFile('src/pages/FormulaTab.tsx');
  assert.ok(!src.includes('formulaWorkspaceData'), 'Must not import formulaWorkspaceData');
  assert.ok(!src.includes('mock'), 'Must not import mock data');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 7: Master Pakan is referenced, not duplicated
// ─────────────────────────────────────────────────────────────────────────────

test('Formula ingredients reference Master Pakan by ID', () => {
  const src = readFile('src/data/formulaData.ts');
  assert.ok(src.includes("referensiId: 'mp-1'"), 'Seed formulas must reference Master Pakan IDs');
  assert.ok(src.includes("referensiId: 'mp-9'"), 'Seed formulas must reference Master Pakan IDs');
});

test('Formula ingredient picker uses Master Pakan catalog', () => {
  const src = readFile('src/pages/FormulaEditor.tsx');
  assert.ok(src.includes('buildMasterPakanOptions'), 'Must build options from Master Pakan');
  assert.ok(src.includes('getAllFormulaMasterPakan'), 'Must use getAllFormulaMasterPakan');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 8: Ampas Kedelai Kering specific checks
// ─────────────────────────────────────────────────────────────────────────────

test('Ampas Kedelai Kering exists in per-category data', () => {
  const src = readFile('src/data/limbahIndustriPanganData.ts');
  assert.ok(src.includes("id: 'ampas-kedelai-kering'"), 'Must have ampas-kedelai-kering ID');
  assert.ok(src.includes("nama: 'Ampas Kedelai Kering'"), 'Must have correct name');
  assert.ok(src.includes("kategoriItem: 'Ampas Protein Nabati'"), 'Must be in Ampas Protein Nabati sub-category');
});

test('Ampas Kedelai Kering exists in legacy Master Pakan DB', () => {
  const src = readFile('src/data/masterPakanData.ts');
  assert.ok(src.includes("'mp-17':"), 'Must have mp-17 ID');
  assert.ok(src.includes("name: 'Ampas Kedelai Kering'"), 'Must have correct name in legacy DB');
  assert.ok(src.includes("category: 'By Product'"), 'Must have By Product category in legacy DB');
});

test('Ampas Kedelai Kering does not duplicate Ampas Tahu', () => {
  const src = readFile('src/data/limbahIndustriPanganData.ts');
  const ampasKedelaiCount = (src.match(/id: 'ampas-kedelai-kering'/g) || []).length;
  const ampasTahuCount = (src.match(/id: 'ampas-tahu'/g) || []).length;
  assert.strictEqual(ampasKedelaiCount, 1, 'Ampas Kedelai Kering must appear exactly once');
  assert.strictEqual(ampasTahuCount, 1, 'Ampas Tahu must still appear exactly once');
});

test('Ampas Kedelai Kering has no fake nutrition numbers', () => {
  const src = readFile('src/data/limbahIndustriPanganData.ts');
  const itemMatch = src.match(/id: 'ampas-kedelai-kering'[\s\S]*?},\s*\/\//);
  assert.ok(itemMatch, 'Must find Ampas Kedelai Kering item');
  const item = itemMatch[0];
  assert.ok(!item.includes('Protein ±'), 'Must not invent protein numbers in description');
  assert.ok(!item.includes('TDN ±'), 'Must not invent TDN numbers in description');
  assert.ok(item.includes('dataLengkap: false'), 'Must mark data as incomplete');
});

test('Ampas Kedelai Kering has no fake price', () => {
  const src = readFile('src/data/limbahIndustriPanganData.ts');
  const itemMatch = src.match(/id: 'ampas-kedelai-kering'[\s\S]*?},\s*\/\//);
  assert.ok(itemMatch, 'Must find Ampas Kedelai Kering item');
  const item = itemMatch[0];
  assert.ok(item.includes('estimasiHarga: null'), 'Must have null price');
});

test('Ampas Kedelai Kering migration file exists', () => {
  const src = readFile('supabase/migrations/20260905000001_add_ampas_kedelai_kering.sql');
  assert.ok(src.includes("'Ampas Kedelai Kering'"), 'Migration must insert Ampas Kedelai Kering');
  assert.ok(src.includes('master_pakan_catalog'), 'Migration must target master_pakan_catalog');
  assert.ok(src.includes('ON CONFLICT (name) DO NOTHING'), 'Migration must be idempotent');
});

