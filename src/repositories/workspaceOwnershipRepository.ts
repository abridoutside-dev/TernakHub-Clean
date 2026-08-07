// ─── Workspace Ownership Repository ────────────────────────────────────────────
//
// The only browser adapter for ownership transfer operations. Every request is
// dispatched to the ownership-transfers Supabase Edge Function.

import { supabase } from '../lib/supabase';
import type {
  CreateOwnershipTransferInput,
  OwnershipTransferAction,
  OwnershipTransferListResponse,
  OwnershipTransferPreflight,
  OwnershipTransferRecord,
} from '../types/ownershipTransfer';

export class WorkspaceOwnershipRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'WorkspaceOwnershipRepoError';
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error?: string; code?: string };

async function invoke<T>(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<Envelope<T>>(
    'ownership-transfers',
    { body: { action: 'ownership-transfers', operation, ...payload } },
  );
  if (error) {
    throw new WorkspaceOwnershipRepoError(
      error.message || 'Permintaan transfer kepemilikan gagal.',
    );
  }
  if (!data?.ok) {
    throw new WorkspaceOwnershipRepoError(
      data?.error || 'Operasi transfer kepemilikan gagal.',
      data?.code,
    );
  }
  return data.data;
}

export function repoListOwnershipTransfers(): Promise<OwnershipTransferListResponse> {
  return invoke('list');
}

export function repoGetOwnershipTransfer(id: string): Promise<OwnershipTransferRecord | null> {
  return invoke('detail', { transfer_id: id });
}

export function repoCreateOwnershipTransfer(
  input: CreateOwnershipTransferInput,
): Promise<OwnershipTransferRecord> {
  return invoke('create', input as unknown as Record<string, unknown>);
}

export function repoGetOwnershipTransferPreflight(
  id: string,
): Promise<OwnershipTransferPreflight | null> {
  return invoke('preflight', { transfer_id: id });
}

export function repoTransitionOwnershipTransfer(
  id: string,
  action: OwnershipTransferAction,
  reason?: string,
): Promise<OwnershipTransferRecord> {
  return invoke(action, { transfer_id: id, reason: reason?.trim() || null });
}