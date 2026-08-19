// ─── Subscription Change Request Repository ─────────────────────────────────────
//
// Thin adapter over Supabase for the subscription_change_requests table.
// No edge function yet — direct table access with RLS boundary.

import { supabase } from '../lib/supabase';
import type {
  CreateSubscriptionChangeRequestInput,
  SubscriptionChangeRequest,
} from '../types/subscriptionChangeRequest';

export class SubscriptionRequestRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'SubscriptionRequestRepoError';
  }
}

export async function repoCreateSubscriptionChangeRequest(
  input: CreateSubscriptionChangeRequestInput,
): Promise<SubscriptionChangeRequest> {
  const { data, error } = await supabase
    .from('subscription_change_requests')
    .insert({
      workspace_id: input.workspace_id,
      subscription_id: input.subscription_id ?? null,
      requested_by: input.requested_by,
      from_plan_key: input.from_plan_key,
      to_plan_key: input.to_plan_key,
      note: input.note ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new SubscriptionRequestRepoError(
      error?.message || 'Gagal membuat permintaan perubahan paket.',
      error?.code,
    );
  }

  return data as SubscriptionChangeRequest;
}

export async function repoListSubscriptionChangeRequests(
  status?: string,
): Promise<SubscriptionChangeRequest[]> {
  let query = supabase
    .from('subscription_change_requests')
    .select('*, workspaces(name)')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new SubscriptionRequestRepoError(
      error.message || 'Gagal memuat daftar permintaan.',
      error.code,
    );
  }

  return (data ?? []).map((row) => ({
    ...row,
    workspace_name: (row.workspaces as { name?: string } | null)?.name ?? row.workspace_name ?? undefined,
  })) as SubscriptionChangeRequest[];
}

export async function repoGetSubscriptionChangeRequest(
  id: string,
): Promise<SubscriptionChangeRequest | null> {
  const { data, error } = await supabase
    .from('subscription_change_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as SubscriptionChangeRequest;
}

export async function repoGetPendingSubscriptionChangeRequest(
  workspaceId: string,
  fromPlanKey: string,
  toPlanKey: string,
): Promise<SubscriptionChangeRequest | null> {
  const { data, error } = await supabase
    .from('subscription_change_requests')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('from_plan_key', fromPlanKey)
    .eq('to_plan_key', toPlanKey)
    .eq('status', 'Pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as SubscriptionChangeRequest;
}

export async function repoUpdateSubscriptionChangeRequest(
  id: string,
  patch: {
    status: string;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    note?: string | null;
  },
): Promise<SubscriptionChangeRequest> {
  const updatePayload: Record<string, unknown> = {
    status: patch.status,
    updated_at: new Date().toISOString(),
  };
  if (patch.reviewed_by !== undefined) updatePayload.reviewed_by = patch.reviewed_by;
  if (patch.reviewed_at !== undefined) updatePayload.reviewed_at = patch.reviewed_at;
  if (patch.note !== undefined) updatePayload.note = patch.note;

  const { data, error } = await supabase
    .from('subscription_change_requests')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new SubscriptionRequestRepoError(
      error?.message || 'Gagal memperbarui permintaan.',
      error?.code,
    );
  }

  return data as SubscriptionChangeRequest;
}
