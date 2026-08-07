/**
 * Prompt 6 — Ownership Transfer end-to-end contract test.
 *
 * Static guardrails for the browser boundary and the Supabase-only backend
 * path. This intentionally does not re-audit Prompts 1–5.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('Prompt 6 ownership transfer has one repository and one service entrypoint', () => {
  const repository = read('src/repositories/workspaceOwnershipRepository.ts');
  const service = read('src/services/workspaceService.ts');
  const ui = read('src/pages/admin/modules/OwnershipTransferModule.tsx');

  assert.match(repository, /functions\.invoke<Envelope<T>>\(\s*['"]ownership-transfers['"]/);
  assert.match(service, /repo(Create|Get|List|Transition)OwnershipTransfer/);
  assert.doesNotMatch(ui, /from ['"][^'"]*lib\/supabase['"]/);
  assert.doesNotMatch(ui, /from ['"][^'"]*workspaceOwnershipRepository['"]/);
  assert.equal(
    (repository.match(/export (?:class|function) .*Ownership/g) ?? []).length,
    6,
    'ownership repository exports must remain consolidated',
  );
});

test('Prompt 6 migration contains atomic create and transition contracts', () => {
  const migration = read('supabase/migrations/20260807000005_ownership_transfer_contract.sql');
  assert.match(migration, /CREATE OR REPLACE FUNCTION ownership_transfer_create/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION ownership_transfer_transition/);
  assert.match(migration, /next_status := 'Completed'/);
  assert.match(migration, /GRANT .* ON TABLE ownership_transfers TO service_role/);
  assert.match(migration, /GRANT .* ON TABLE ownership_transfer_history TO service_role/);
  assert.match(migration, /REVOKE ALL ON TABLE ownership_transfers FROM authenticated/);
});

test('Prompt 6 Edge Function is the only ownership backend and returns domain data', () => {
  const edge = read('supabase/functions/ownership-transfers/index.ts');
  assert.match(edge, /ownership_transfer_create/);
  assert.match(edge, /ownership_transfer_transition/);
  assert.match(edge, /return response\(\{ ok: true, data: mapped \}\)/);
  assert.match(edge, /listUsers\(\{ page, perPage \}\)/);
  assert.doesNotMatch(edge, /app\.listen|express|Deno\.serveHttp/);
});