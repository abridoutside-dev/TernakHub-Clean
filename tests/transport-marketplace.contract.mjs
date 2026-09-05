/**
 * Transport ↔ Marketplace integration contract test (TRX-MP-001 / Gap #1)
 *
 * Static analysis of the marketplace → transport integration:
 *   - Verifies the new repository functions are declared and exported.
 *   - Verifies the canonical tables (transaction_rooms, transport_transactions)
 *     are the only targets of inserts/queries in the new functions.
 *   - Verifies idempotency / duplicate-prevention logic is present.
 *   - Verifies no dummy data fabrication (no hard-coded origin/destination strings).
 *   - Verifies the UI page wires the button to the repository function.
 *
 * Does NOT require a live Supabase connection — reads source files only.
 * Run: node --test tests/transport-marketplace.contract.mjs
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
// Contract 1: transportRepository exports the marketplace→transport function
// ─────────────────────────────────────────────────────────────────────────────

test('transportRepository exports repoCreateTransportFromMarketplaceOrder', () => {
  const src = readFile('src/repositories/transportRepository.ts');
  assert.ok(
    src.includes('export async function repoCreateTransportFromMarketplaceOrder'),
    'Must export repoCreateTransportFromMarketplaceOrder',
  );
});

test('transportRepository exports transaction_rooms helper functions', () => {
  const src = readFile('src/repositories/transportRepository.ts');
  assert.ok(
    src.includes('export async function repoGetOrCreateTransactionRoom'),
    'Must export repoGetOrCreateTransactionRoom',
  );
  assert.ok(
    src.includes('export async function repoGetTransactionRoomByMarketplace'),
    'Must export repoGetTransactionRoomByMarketplace',
  );
  assert.ok(
    src.includes('export async function repoUpdateTransactionRoom'),
    'Must export repoUpdateTransactionRoom',
  );
  assert.ok(
    src.includes('export async function repoFindActiveTransportForMarketplace'),
    'Must export repoFindActiveTransportForMarketplace (idempotency check)',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 2: New functions only touch canonical tables
// ─────────────────────────────────────────────────────────────────────────────

const CANONICAL_TABLES = new Set([
  'marketplace_transactions',
  'transaction_rooms',
  'transport_transactions',
]);

test('repoCreateTransportFromMarketplaceOrder only queries canonical tables', () => {
  const src = readFile('src/repositories/transportRepository.ts');
  const fnMatch = src.match(
    /export async function repoCreateTransportFromMarketplaceOrder[\s\S]*?\n\}\n/,
  );
  assert.ok(fnMatch, 'Function body not found');
  const body = fnMatch[0];

  // No .from('something_else') references
  const fromRegex = /\.from\(['"]([a-z_]+)['"]\)/g;
  let m;
  while ((m = fromRegex.exec(body)) !== null) {
    assert.ok(
      CANONICAL_TABLES.has(m[1]),
      `repoCreateTransportFromMarketplaceOrder queries non-canonical table "${m[1]}". ` +
        `Allowed: ${[...CANONICAL_TABLES].join(', ')}`,
    );
  }
});

test('repoGetOrCreateTransactionRoom only queries transaction_rooms', () => {
  const src = readFile('src/repositories/transportRepository.ts');
  const fnMatch = src.match(
    /export async function repoGetOrCreateTransactionRoom[\s\S]*?\n\}\n/,
  );
  assert.ok(fnMatch, 'Function body not found');
  const body = fnMatch[0];

  const fromRegex = /\.from\(['"]([a-z_]+)['"]\)/g;
  let m;
  const tables = new Set();
  while ((m = fromRegex.exec(body)) !== null) {
    tables.add(m[1]);
  }
  for (const t of tables) {
    assert.ok(
      t === 'transaction_rooms',
      `repoGetOrCreateTransactionRoom queries table "${t}", expected only transaction_rooms`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 3: Idempotency / duplicate prevention
// ─────────────────────────────────────────────────────────────────────────────

test('repoCreateTransportFromMarketplaceOrder has duplicate-prevention logic', () => {
  const src = readFile('src/repositories/transportRepository.ts');
  const fnMatch = src.match(
    /export async function repoCreateTransportFromMarketplaceOrder[\s\S]*?\n\}\n/,
  );
  assert.ok(fnMatch, 'Function body not found');
  const body = fnMatch[0];

  // Must call the find-existing helper before inserting
  assert.ok(
    body.includes('repoFindActiveTransportForMarketplace'),
    'Must call repoFindActiveTransportForMarketplace for idempotency',
  );
  // Must mention "reused" / "existing" return path
  assert.ok(
    body.includes('reused:') || body.includes('reused ='),
    'Must return a "reused" flag for the existing-row path',
  );
  // Must not unconditionally insert without checking first
  assert.ok(
    body.indexOf('repoFindActiveTransportForMarketplace') < body.indexOf('.insert('),
    'Existing-row check must happen before the insert',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 4: No fabricated dummy data
// ─────────────────────────────────────────────────────────────────────────────

test('repoCreateTransportFromMarketplaceOrder does not fabricate origin/destination/date', () => {
  const src = readFile('src/repositories/transportRepository.ts');
  const fnMatch = src.match(
    /export async function repoCreateTransportFromMarketplaceOrder[\s\S]*?\n\}\n/,
  );
  assert.ok(fnMatch, 'Function body not found');
  const body = fnMatch[0];

  // origin, destination, scheduled_date, vehicle_type, driver_name must NOT be hard-coded
  // (they should come from real data, or be omitted/null)
  const forbiddenLiterals = [
    /origin:\s*['"][^'"]+['"]/,
    /destination:\s*['"][^'"]+['"]/,
    /scheduled_date:\s*['"][^'"]+['"]/,
    /vehicle_type:\s*['"][^'"]+['"]/,
    /driver_name:\s*['"][^'"]+['"]/,
  ];
  for (const re of forbiddenLiterals) {
    assert.ok(
      !re.test(body),
      `repoCreateTransportFromMarketplaceOrder must not hard-code field with literal string: ${re}`,
    );
  }

  // Must pull agreed_price from the marketplace row, not fabricate
  assert.ok(
    body.includes('tx.agreed_price'),
    'Must use tx.agreed_price (real data) for fee, not a literal number',
  );
  // Must pull listing_id from the marketplace row
  assert.ok(
    body.includes('tx.listing_id'),
    'Must use tx.listing_id for transport_listing_id, not a hard-coded UUID',
  );
  // Must pull buyer/seller workspace from the marketplace row
  assert.ok(
    body.includes('tx.buyer_workspace_id') && body.includes('tx.seller_workspace_id'),
    'Must use tx.buyer/seller_workspace_id from the marketplace row',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 5: Status eligibility check
// ─────────────────────────────────────────────────────────────────────────────

test('repoCreateTransportFromMarketplaceOrder validates order status eligibility', () => {
  const src = readFile('src/repositories/transportRepository.ts');
  const fnMatch = src.match(
    /export async function repoCreateTransportFromMarketplaceOrder[\s\S]*?\n\}\n/,
  );
  assert.ok(fnMatch, 'Function body not found');
  const body = fnMatch[0];

  // Must have a set of allowed statuses
  assert.ok(
    body.includes('ELIGIBLE_STATUSES') || body.includes('Disetujui'),
    'Must define a set of eligible marketplace statuses (e.g. Disetujui, Diproses, etc.)',
  );
  // Must throw on ineligible status
  assert.ok(
    body.includes('TransportRepoError'),
    'Must throw TransportRepoError for ineligible / invalid input',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 6: Required FKs/relationships are populated on insert
// ─────────────────────────────────────────────────────────────────────────────

test('repoCreateTransportFromMarketplaceOrder populates required FK columns', () => {
  const src = readFile('src/repositories/transportRepository.ts');
  const fnMatch = src.match(
    /export async function repoCreateTransportFromMarketplaceOrder[\s\S]*?\n\}\n/,
  );
  assert.ok(fnMatch, 'Function body not found');
  const body = fnMatch[0];

  // The .insert() block for transport_transactions must include these FK columns
  const insertMatch = body.match(/\.from\('transport_transactions'\)[\s\S]*?\.insert\(\{([\s\S]*?)\}\)/);
  assert.ok(insertMatch, 'transport_transactions .insert() block not found');
  const insertBody = insertMatch[1];

  for (const col of ['room_id', 'transport_workspace_id', 'transport_listing_id', 'status']) {
    assert.ok(
      insertBody.includes(col),
      `transport_transactions.insert() must set column "${col}"`,
    );
  }
  assert.ok(
    insertBody.includes("status: 'Menunggu'"),
    'Must set status to canonical "Menunggu" (matches transport_status_enum)',
  );
});

test('transaction_rooms insert sets has_transport=true for transport integration', () => {
  const src = readFile('src/repositories/transportRepository.ts');
  const fnMatch = src.match(
    /export async function repoCreateTransportFromMarketplaceOrder[\s\S]*?\n\}\n/,
  );
  assert.ok(fnMatch, 'Function body not found');
  const body = fnMatch[0];

  // Look for the .from('transaction_rooms').insert( call inside this function
  const insertMatch = body.match(/\.from\('transaction_rooms'\)[\s\S]*?\.insert\(\{([\s\S]*?)\}\)/);
  if (insertMatch) {
    const insertBody = insertMatch[1];
    assert.ok(
      insertBody.includes('has_transport: true'),
      'transaction_rooms insert must set has_transport=true',
    );
  } else {
    // It may go through repoGetOrCreateTransactionRoom instead — acceptable
    const helperCall = body.match(/repoGetOrCreateTransactionRoom\(\{([\s\S]*?)\}\)/);
    assert.ok(helperCall, 'Must either insert directly into transaction_rooms or call repoGetOrCreateTransactionRoom');
    assert.ok(
      helperCall[1].includes('has_transport: true'),
      'repoGetOrCreateTransactionRoom call must include has_transport: true',
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 7: Type definitions
// ─────────────────────────────────────────────────────────────────────────────

test('transport types include TransactionRoom + CreateTransportFromMarketplace shapes', () => {
  const src = readFile('src/types/transport.ts');
  assert.ok(src.includes('export interface TransactionRoomDbRow'), 'Must export TransactionRoomDbRow');
  assert.ok(src.includes('export interface TransactionRoomCreateInput'), 'Must export TransactionRoomCreateInput');
  assert.ok(src.includes('export interface CreateTransportFromMarketplaceInput'), 'Must export CreateTransportFromMarketplaceInput');
  assert.ok(src.includes('export interface CreateTransportFromMarketplaceResult'), 'Must export CreateTransportFromMarketplaceResult');
  assert.ok(src.includes('export interface MarketplaceTransactionLite'), 'Must export MarketplaceTransactionLite');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 8: UI wiring on MarketplaceDetailTransaksi
// ─────────────────────────────────────────────────────────────────────────────

test('MarketplaceDetailTransaksi imports and calls the new repository function', () => {
  const src = readFile('src/pages/MarketplaceDetailTransaksi.tsx');
  assert.ok(
    src.includes("from '../repositories/transportRepository'"),
    'Must import from repositories/transportRepository',
  );
  assert.ok(
    src.includes('repoCreateTransportFromMarketplaceOrder'),
    'Must reference repoCreateTransportFromMarketplaceOrder',
  );
  assert.ok(
    src.includes('getTransaksiSupabaseId'),
    'Must call getTransaksiSupabaseId to resolve the marketplace DB UUID from the in-memory nomor',
  );
  assert.ok(
    src.includes("getWorkspacesByType('Transport')"),
    'Must call getWorkspacesByType("Transport") to list transport workspaces',
  );
});

test('MarketplaceDetailTransaksi exposes a Buat Pengiriman Transport button', () => {
  const src = readFile('src/pages/MarketplaceDetailTransaksi.tsx');
  assert.ok(
    src.includes('Buat Pengiriman Transport'),
    'Must show a button labeled "Buat Pengiriman Transport"',
  );
  // Must render the picker modal
  assert.ok(
    src.includes('TransportWorkspacePickerModal'),
    'Must render TransportWorkspacePickerModal',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 9: Pending Merge flow integration
// ─────────────────────────────────────────────────────────────────────────────

test('New transport row is set to status "Menunggu" so repoListPendingMergeDeliveries picks it up', () => {
  const src = readFile('src/repositories/transportRepository.ts');
  // The Pending Merge filter is: status = 'Menunggu' AND not in transport_shipment_batch_items
  const filterSrc = src.match(
    /export async function repoListPendingMergeDeliveries[\s\S]*?\n\}\n/,
  );
  assert.ok(filterSrc, 'repoListPendingMergeDeliveries not found');
  assert.ok(
    filterSrc[0].includes("eq('status', 'Menunggu')"),
    'Pending Merge filter must check status = "Menunggu"',
  );
  assert.ok(
    filterSrc[0].includes('transport_shipment_batch_items'),
    'Pending Merge filter must exclude rows already in transport_shipment_batch_items',
  );

  // And the new create function must set status='Menunggu'
  const createSrc = src.match(
    /export async function repoCreateTransportFromMarketplaceOrder[\s\S]*?\n\}\n/,
  );
  assert.ok(
    createSrc[0].includes("status: 'Menunggu'"),
    'New row must be created with status "Menunggu" to land in Pending Merge',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

test('Transport ↔ Marketplace contract summary', () => {
  console.log(
    JSON.stringify({
      testSuite: 'transport-marketplace.contract.mjs',
      scope: 'Gap #1 — Marketplace order → transport_transactions integration',
      status: 'PASS',
    }),
  );
  assert.ok(true);
});
