import assert from 'node:assert/strict';
import test from 'node:test';
import {
  registerUserAtomically,
  RegistrationStepError,
  type AtomicRegistrationInput,
  type RegistrationAdapter,
} from '../server/atomicRegistration.ts';

const input: AtomicRegistrationInput = {
  email: 'atomic@example.com',
  password: 'Password!123',
  fullName: 'Atomic Test',
  phone: '+628123456789',
  province: 'Jawa Barat',
  regency: 'Bandung',
  district: 'Coblong',
  village: 'Dago',
};

function adapterWith(overrides: Partial<RegistrationAdapter> = {}): RegistrationAdapter {
  let authId = 'auth-1';
  return {
    createAuthUser: async () => ({ id: authId }),
    deleteAuthUser: async () => {},
    upsertUserProfile: async () => {},
    deleteUserProfile: async () => {},
    createWorkspace: async () => ({ id: 'workspace-1' }),
    deleteWorkspace: async () => {},
    ...overrides,
  };
}

test('profile failure removes the auth user and profile', async () => {
  const calls: string[] = [];
  const adapter = adapterWith({
    upsertUserProfile: async () => { calls.push('profile'); throw new Error('profile failed'); },
    deleteUserProfile: async () => { calls.push('delete-profile'); },
    deleteAuthUser: async () => { calls.push('delete-auth'); },
  });

  await assert.rejects(() => registerUserAtomically(input, adapter));
  assert.deepEqual(calls, ['profile', 'delete-profile', 'delete-auth']);
});

test('workspace failure removes workspace, profile, and auth user', async () => {
  const calls: string[] = [];
  const adapter = adapterWith({
    createWorkspace: async () => {
      calls.push('workspace');
      throw new RegistrationStepError('workspace failed', 'workspace-1');
    },
    deleteWorkspace: async () => { calls.push('delete-workspace'); },
    deleteUserProfile: async () => { calls.push('delete-profile'); },
    deleteAuthUser: async () => { calls.push('delete-auth'); },
  });

  await assert.rejects(() => registerUserAtomically(input, adapter));
  assert.deepEqual(calls, ['workspace', 'delete-workspace', 'delete-profile', 'delete-auth']);
});