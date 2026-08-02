import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStoredWorkspaceUuid, normalizeRecentWorkspaceList } from '../src/utils/workspaceSafety';

test('normalizeStoredWorkspaceUuid handles legacy objects and invalid values', () => {
  assert.equal(normalizeStoredWorkspaceUuid('00000000-0000-4000-8000-000000000001'), '00000000-0000-4000-8000-000000000001');
  assert.equal(normalizeStoredWorkspaceUuid({ workspace_uuid: '11111111-1111-4111-8111-111111111111' } as unknown), '11111111-1111-4111-8111-111111111111');
  assert.equal(normalizeStoredWorkspaceUuid({ workspace: { uuid: '22222222-2222-4222-8222-222222222222' } } as unknown), '22222222-2222-4222-8222-222222222222');
  assert.equal(normalizeStoredWorkspaceUuid({ foo: 'bar' } as unknown), null);
  assert.equal(normalizeStoredWorkspaceUuid(null), null);
});

test('normalizeRecentWorkspaceList ignores malformed cache payloads', () => {
  assert.deepEqual(normalizeRecentWorkspaceList(['ws-1', 'ws-2', 'ws-1']), ['ws-1', 'ws-2']);
  assert.deepEqual(normalizeRecentWorkspaceList({ recent: ['ws-1'] } as unknown), []);
  assert.deepEqual(normalizeRecentWorkspaceList(null), []);
});
