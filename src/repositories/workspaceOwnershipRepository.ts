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

function isResponse(value: unknown): value is Response {
  return typeof Response !== 'undefined' && value instanceof Response;
}

async function errorMessage(error: unknown, fallback: string): Promise<string> {
  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; context?: unknown };
    if (isResponse(candidate.context)) {
      try {
        const raw = await candidate.context.clone().text();
        if (raw.trim()) {
          const body = JSON.parse(raw) as Record<string, unknown>;
          const message = [body.error, body.message, body.error_description, body.msg, body.details, body.hint]
            .find(value => typeof value === 'string' && value.trim());
          if (typeof message === 'string') return message.replace(/\s+/g, ' ').trim();
        }
      } catch {
        // Fall through to the SDK error below.
      }
      if (candidate.context.status) return fallback;
    }
    if (typeof candidate.message === 'string' && candidate.message.trim()
      && !/edge function returned.*non-2xx|failed to send a request/i.test(candidate.message)) {
      return candidate.message.replace(/\s+/g, ' ').trim();
    }
  }
  return fallback;
}

async function invoke<T>(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<Envelope<T>>(
    'ownership-transfers',
    { body: { action: 'ownership-transfers', operation, ...payload } },
  );
  if (error) {
    throw new WorkspaceOwnershipRepoError(await errorMessage(error, 'Permintaan transfer kepemilikan gagal.'));
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