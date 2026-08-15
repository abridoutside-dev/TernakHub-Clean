// ─── Workspace Subscription Repository ────────────────────────────────────────
//
// The only browser adapter for subscription management. The browser never reads
// or writes subscription tables directly; every operation goes through the
// workspace-subscriptions Supabase Edge Function.

import { supabase } from '../lib/supabase';
import type {
  PackageEntitlement,
  PackageEntitlementInput,
  SubscriptionAdminData,
  SubscriptionAuditEntry,
  SubscriptionHistoryEntryAdmin,
  SubscriptionPackage,
  SubscriptionPackageInput,
  SubscriptionPreflight,
  SubscriptionRecordAdmin,
  WorkspaceEntitlementView,
} from '../types/subscriptionAdmin';

export class SubscriptionRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'SubscriptionRepoError';
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
    'workspace-subscriptions',
    { body: { action: 'workspace-subscriptions', operation, ...payload } },
  );
  if (error) {
    throw new SubscriptionRepoError(await errorMessage(error, 'Operasi subscription gagal.'));
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

export async function repoGetWorkspaceSubscription(workspaceId: string): Promise<SubscriptionRecordAdmin | null> {
  try {
    return await invoke('workspace-detail', { workspace_id: workspaceId });
  } catch {
    return null;
  }
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

export function repoListPackageEntitlements(packageId: string): Promise<PackageEntitlement[]> {
  return invoke('package-entitlements', { package_id: packageId });
}

export function repoUpsertPackageEntitlements(
  packageId: string,
  entitlements: PackageEntitlementInput[],
): Promise<PackageEntitlement[]> {
  return invoke('upsert-package-entitlements', { package_id: packageId, entitlements });
}

export async function repoGetWorkspaceEntitlements(workspaceId: string): Promise<WorkspaceEntitlementView[]> {
  return [];
}

export async function repoCheckEntitlement(
  workspaceId: string,
  featureKey: string,
): Promise<{ allowed: boolean; access_mode: string; usage_limit: number | null; usage_count: number; remaining: number | null }> {
  return { allowed: true, access_mode: 'allowed', usage_limit: null, usage_count: 0, remaining: null };
}

export async function repoIncrementUsage(
  workspaceId: string,
  featureKey: string,
): Promise<{ usage_count: number }> {
  return { usage_count: 0 };
}

export async function repoCreateFormulaWithEntitlement(input: {
  workspace_id: string;
  name: string;
  status: string;
  target_species: string[];
  target_age_group: string | null;
  description: string | null;
  total_cost_per_kg: number | null;
  created_by: string | null;
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('feed_formulas')
    .insert({
      workspace_id: input.workspace_id,
      name: input.name,
      status: input.status,
      target_species: input.target_species,
      target_age_group: input.target_age_group,
      description: input.description,
      total_cost_per_kg: input.total_cost_per_kg,
      created_by: input.created_by,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new SubscriptionRepoError(error?.message || 'Gagal membuat formula.');
  }

  return { id: data.id };
}

export type {
  SubscriptionAdminData,
  SubscriptionAuditEntry,
  SubscriptionHistoryEntryAdmin,
  SubscriptionPackage,
  SubscriptionPackageInput,
  SubscriptionPreflight,
  SubscriptionRecordAdmin,
  PackageEntitlement,
  PackageEntitlementInput,
  WorkspaceEntitlementView,
};