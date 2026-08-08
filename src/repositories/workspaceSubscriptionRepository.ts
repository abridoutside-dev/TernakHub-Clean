// ─── Workspace Subscription Repository ────────────────────────────────────────
//
// The only browser adapter for subscription management. The browser never reads
// or writes subscription tables directly; every operation goes through the
// workspace-subscriptions Supabase Edge Function.

import { supabase } from '../lib/supabase';
import type {
  SubscriptionAdminData,
  SubscriptionAuditEntry,
  SubscriptionHistoryEntryAdmin,
  SubscriptionPackage,
  SubscriptionPackageInput,
  SubscriptionPreflight,
  SubscriptionRecordAdmin,
} from '../types/subscriptionAdmin';

export class SubscriptionRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'SubscriptionRepoError';
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error?: string; code?: string };

async function errorMessage(error: { message?: string; context?: unknown }): Promise<string> {
  const context = error.context;
  if (context instanceof Response) {
    try {
      const body = await context.clone().json() as { error?: unknown; message?: unknown };
      if (typeof body.error === 'string' && body.error.trim()) return body.error;
      if (typeof body.message === 'string' && body.message.trim()) return body.message;
    } catch {
      // Fall through to the SDK message when the response is not JSON.
    }
  }
  return error.message || 'Operasi subscription gagal.';
}

async function invoke<T>(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<Envelope<T>>(
    'workspace-subscriptions',
    { body: { action: 'workspace-subscriptions', operation, ...payload } },
  );
  if (error) {
    throw new SubscriptionRepoError(await errorMessage(error));
  }
  if (!data?.ok) {
    throw new SubscriptionRepoError(
      data?.error || 'Operasi subscription gagal.',
      data?.code,
    );
  }
  return data.data;
}

export function repoListSubscriptionPackages(): Promise<SubscriptionPackage[]> {
  return invoke('packages');
}

export function repoListSubscriptionAdmin(): Promise<SubscriptionAdminData> {
  return invoke('list');
}

export function repoGetWorkspaceSubscription(workspaceId: string): Promise<SubscriptionRecordAdmin | null> {
  return invoke('workspace-detail', { workspace_id: workspaceId });
}

export function repoCreateSubscriptionPackage(input: SubscriptionPackageInput): Promise<SubscriptionPackage> {
  return invoke('create-package', input as unknown as Record<string, unknown>);
}

export function repoUpdateSubscriptionPackage(
  id: string,
  input: Partial<SubscriptionPackageInput>,
): Promise<SubscriptionPackage> {
  return invoke('update-package', { package_id: id, ...input });
}

export function repoSetSubscriptionPackageStatus(id: string, active: boolean): Promise<SubscriptionPackage> {
  return invoke(active ? 'activate-package' : 'deactivate-package', { package_id: id });
}

export function repoGetPackageDeletePreflight(id: string): Promise<SubscriptionPreflight> {
  return invoke('preflight-delete-package', { package_id: id });
}

export function repoDeleteSubscriptionPackage(
  id: string,
  preflight: SubscriptionPreflight,
): Promise<{ removed: boolean }> {
  return invoke('delete-package', {
    package_id: id,
    preflight_checked_at: preflight.checked_at,
  });
}

export function repoAssignSubscription(input: {
  workspace_id: string;
  package_id: string;
  billing_cycle?: 'monthly' | 'yearly';
  expires_at?: string | null;
}): Promise<SubscriptionRecordAdmin> {
  return invoke('assign-package', input);
}

export function repoChangeSubscription(input: {
  subscription_id: string;
  package_id: string;
  billing_cycle?: 'monthly' | 'yearly';
  expires_at?: string | null;
}): Promise<SubscriptionRecordAdmin> {
  return invoke('change-package', input);
}

export function repoTransitionSubscription(
  id: string,
  operation: 'activate' | 'deactivate' | 'expire' | 'cancel',
): Promise<SubscriptionRecordAdmin> {
  return invoke(operation, { subscription_id: id });
}

export function repoListSubscriptionHistory(): Promise<SubscriptionHistoryEntryAdmin[]> {
  return invoke('history');
}

export function repoListWorkspaceSubscriptionHistory(
  workspaceId: string,
): Promise<SubscriptionHistoryEntryAdmin[]> {
  return invoke('workspace-history', { workspace_id: workspaceId });
}

export function repoListSubscriptionAudit(): Promise<SubscriptionAuditEntry[]> {
  return invoke('audit');
}

export type {
  SubscriptionAdminData,
  SubscriptionAuditEntry,
  SubscriptionHistoryEntryAdmin,
  SubscriptionPackage,
  SubscriptionPackageInput,
  SubscriptionPreflight,
  SubscriptionRecordAdmin,
};