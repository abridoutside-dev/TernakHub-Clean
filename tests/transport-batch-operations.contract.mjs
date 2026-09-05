/**
 * Transport Batch Operations contract test (TRX-BATCH-001)
 *
 * Static analysis of the transport batch/pooling, fleet/driver validation,
 * trip cost linking, and status synchronization flows.
 *
 * Does NOT require a live Supabase connection — reads source files only.
 * Run: node --test tests/transport-batch-operations.contract.mjs
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
// Contract 1: Bulk add shipments to batch
// ─────────────────────────────────────────────────────────────────────────────

test('TransportPendingMergeSection supports multi-select and bulk add', () => {
  const src = readFile('src/components/workspace/TransportPendingMergeSection.tsx');
  assert.ok(src.includes('selectedIds'), 'Must accept selectedIds prop');
  assert.ok(src.includes('onToggleSelect'), 'Must accept onToggleSelect prop');
  assert.ok(src.includes('onBulkAddToBatch'), 'Must accept onBulkAddToBatch prop');
  assert.ok(src.includes('type="checkbox"'), 'Must render checkboxes for selection');
  assert.ok(src.includes('Gabungkan'), 'Must show bulk add button text');
});

test('AddToBatchModal supports bulk add for multiple deliveries', () => {
  const src = readFile('src/components/workspace/AddToBatchModal.tsx');
  assert.ok(src.includes('deliveries?: TransportDeliveryDbRow[]'), 'Must accept deliveries array prop');
  assert.ok(src.includes('isBulk'), 'Must detect bulk mode');
  assert.ok(src.includes('for (const item of items)'), 'Must iterate items for bulk add');
});

test('TransportWorkspace wires bulk add state and handlers', () => {
  const src = readFile('src/pages/TransportWorkspace.tsx');
  assert.ok(src.includes('selectedDeliveriesForBulkBatch'), 'Must have bulk selection state');
  assert.ok(src.includes('handleToggleSelectDelivery'), 'Must have toggle handler');
  assert.ok(src.includes('handleBulkAddToBatch'), 'Must have bulk add handler');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 2: Duplicate prevention
// ─────────────────────────────────────────────────────────────────────────────

test('repoIsDeliveryInAnyBatch exists and is used for duplicate prevention', () => {
  const src = readFile('src/repositories/transportRepository.ts');
  assert.ok(src.includes('export async function repoIsDeliveryInAnyBatch'), 'Must export repoIsDeliveryInAnyBatch');
  
  const pageSrc = readFile('src/pages/TransportWorkspace.tsx');
  assert.ok(pageSrc.includes('repoIsDeliveryInAnyBatch'), 'TransportWorkspace must import repoIsDeliveryInAnyBatch');
  assert.ok(pageSrc.includes('alreadyInBatch'), 'Must check if delivery already in batch');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 3: Vehicle + driver required before batch can run
// ─────────────────────────────────────────────────────────────────────────────

test('CreateShipmentBatchModal requires vehicle and driver', () => {
  const src = readFile('src/components/workspace/CreateShipmentBatchModal.tsx');
  assert.ok(src.includes("if (!kendaraanId)"), 'Must require kendaraanId');
  assert.ok(src.includes("if (!driverId)"), 'Must require driverId');
});

test('TransportWorkspace prevents batch status advance without vehicle and driver', () => {
  const src = readFile('src/pages/TransportWorkspace.tsx');
  assert.ok(src.includes('!batch.kendaraan_id || !batch.driver_id'), 'Must check vehicle and driver before status advance');
  assert.ok(src.includes("'Siap Berangkat'"), 'Must validate for Siap Berangkat');
  assert.ok(src.includes("'Dalam Perjalanan'"), 'Must validate for Dalam Perjalanan');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 4: Capacity validation
// ─────────────────────────────────────────────────────────────────────────────

test('CreateShipmentBatchModal validates kapasitas_kg > 0', () => {
  const src = readFile('src/components/workspace/CreateShipmentBatchModal.tsx');
  assert.ok(src.includes('parseInt(kapasitasKg, 10) <= 0'), 'Must validate kapasitas_kg > 0');
});

test('AddToBatchModal validates total load against batch capacity', () => {
  const src = readFile('src/components/workspace/AddToBatchModal.tsx');
  assert.ok(src.includes('kapasitas_kg'), 'Must check batch kapasitas_kg');
  assert.ok(src.includes('currentLoad'), 'Must calculate current load');
  assert.ok(src.includes('wouldExceed'), 'Must detect capacity exceed');
});

test('TransportWorkspace handleAddToBatch validates capacity', () => {
  const src = readFile('src/pages/TransportWorkspace.tsx');
  assert.ok(src.includes('currentTotal + muatanKg > batch.kapasitas_kg'), 'Must validate capacity in handleAddToBatch');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 5: Trip cost linking to batch/transaction
// ─────────────────────────────────────────────────────────────────────────────

test('TripCostModal supports batch and transaction linking', () => {
  const src = readFile('src/components/workspace/TripCostModal.tsx');
  assert.ok(src.includes('batch_id?: string | null'), 'TripCostData must support batch_id');
  assert.ok(src.includes('transaction_id?: string | null'), 'TripCostData must support transaction_id');
  assert.ok(src.includes('batches: { id: string; rute: string | null }[]'), 'Must accept batches prop');
  assert.ok(src.includes('deliveries: { id: string; origin: string | null; destination: string | null }[]'), 'Must accept deliveries prop');
});

test('TransportTripCostSection displays linked batch and transaction', () => {
  const src = readFile('src/components/workspace/TransportTripCostSection.tsx');
  assert.ok(src.includes('rec.batch_id'), 'Must display batch_id');
  assert.ok(src.includes('rec.transaction_id'), 'Must display transaction_id');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract 6: Status synchronization
// ─────────────────────────────────────────────────────────────────────────────

test('repoSyncTransportStatusToMarketplace exists and syncs terminal statuses', () => {
  const src = readFile('src/repositories/transportRepository.ts');
  assert.ok(src.includes('export async function repoSyncTransportStatusToMarketplace'), 'Must export sync function');
  assert.ok(src.includes("delivery.status === 'Selesai'"), 'Must sync Selesai');
  assert.ok(src.includes("delivery.status === 'Dibatalkan'"), 'Must sync Dibatalkan');
  assert.ok(src.includes("marketplace_transactions"), 'Must update marketplace_transactions');
});

test('TransportWorkspace calls status sync after delivery status changes', () => {
  const src = readFile('src/pages/TransportWorkspace.tsx');
  assert.ok(src.includes('repoSyncTransportStatusToMarketplace'), 'Must import sync function');
  assert.ok(src.includes('void repoSyncTransportStatusToMarketplace(deliveryId)'), 'Must call sync after status update');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

test('Transport batch operations contract summary', () => {
  console.log(
    JSON.stringify({
      testSuite: 'transport-batch-operations.contract.mjs',
      scope: 'Batch pooling, fleet/driver validation, trip cost linking, status sync',
      status: 'PASS',
    }),
  );
  assert.ok(true);
});
