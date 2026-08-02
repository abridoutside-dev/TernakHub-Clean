// ─── Workspace Subscription Repository — DB-001B ──────────────────────────────
//
// Async Supabase adapter for `workspace_subscriptions` and `subscription_plans`
// (DB-001A). This is a read-only repository; plan changes go through the
// manual payment workflow in workspaceSubscriptionData.ts.
//
// DB-001A column contract (workspace_subscriptions):
//   id             uuid PK
//   workspace_id   uuid UNIQUE FK → workspaces.id ON DELETE CASCADE
//   plan_id        uuid FK → subscription_plans.id
//   status         subscription_status ENUM ('Aktif'|'Trial'|'Kadaluarsa'|'Dibatalkan'|'Ditangguhkan')
//   started_at     timestamptz
//   expires_at     timestamptz
//   trial_ends_at  timestamptz
//   billing_cycle  text ('monthly'|'yearly') nullable
//   auto_renew     boolean NOT NULL DEFAULT false
//   payment_method text nullable
//   created_at     timestamptz NOT NULL DEFAULT now()
//   updated_at     timestamptz NOT NULL DEFAULT now()
//
// DB-001A column contract (subscription_plans):
//   id             uuid PK
//   plan_key       text UNIQUE NOT NULL  (e.g. 'free', 'pro', 'enterprise')
//   name           text NOT NULL
//   price_monthly  integer nullable
//   price_yearly   integer nullable
//   max_livestock  integer nullable
//   max_members    integer nullable
//   max_batches    integer nullable
//   max_listings   integer nullable
//   features       jsonb NOT NULL DEFAULT '[]'
//   is_active      boolean NOT NULL DEFAULT true
//   created_at     timestamptz NOT NULL DEFAULT now()
//
// RLS:
//   workspace_subscriptions_member: FOR SELECT USING (is_workspace_member(workspace_id))
//   subscription_plans: no RLS (public read)
//
// Rules:
//  - Read-only: no INSERT/UPDATE/DELETE on workspace_subscriptions from the browser.
//  - Never import from pages, components, or contexts.
//  - DB status enum is Indonesian; mapped to app WorkspaceSubscriptionStatus.
//  - plan_key in DB is lowercase ('free'); app WorkspacePlan is capitalized ('Free').

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';
import type { WorkspacePlan } from '../types/workspace';
import type { WorkspaceSubscriptionStatus } from '../types/subscription';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Subscription plan as read from the DB.
 * Intentionally flat — no merging with local PLAN_CONFIG.
 */
export interface DbSubscriptionPlan {
  id:            string;
  plan_key:      string;
  name:          string;
  price_monthly: number | null;
  price_yearly:  number | null;
  max_livestock: number | null;
  max_members:   number | null;
  max_batches:   number | null;
  max_listings:  number | null;
  features:      string[];
  is_active:     boolean;
  created_at:    string;
}

/**
 * Workspace subscription record with resolved plan data.
 * `plan` is the app-level WorkspacePlan derived from plan_key.
 */
export interface DbWorkspaceSubscription {
  id:             string;
  workspace_id:   string;
  plan_id:        string;
  plan:           WorkspacePlan;
  plan_key:       string;
  status:         WorkspaceSubscriptionStatus;
  started_at:     string | null;
  expires_at:     string | null;
  trial_ends_at:  string | null;
  billing_cycle:  'monthly' | 'yearly' | null;
  auto_renew:     boolean;
  payment_method: string | null;
  created_at:     string;
  updated_at:     string;
}

// ─── Error type ───────────────────────────────────────────────────────────────

export class SubscriptionRepoError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'SubscriptionRepoError';
  }
}

// ─── Enum translators ─────────────────────────────────────────────────────────

/**
 * DB subscription_status (Indonesian) → app WorkspaceSubscriptionStatus.
 * 'Trial' maps to 'Active' because a trial workspace can use the app.
 * 'Ditangguhkan' (suspended) maps to 'Cancelled' as the closest app concept.
 */
function fromDbStatus(dbStatus: string): WorkspaceSubscriptionStatus {
  const map: Record<string, WorkspaceSubscriptionStatus> = {
    Aktif:        'Active',
    Trial:        'Active',
    Kadaluarsa:   'Expired',
    Dibatalkan:   'Cancelled',
    Ditangguhkan: 'Cancelled',
  };
  return (map[dbStatus] as WorkspaceSubscriptionStatus) ?? 'Expired';
}

/**
 * DB plan_key (lowercase) → app WorkspacePlan (capitalized).
 * Unknown plan_key falls back to 'Free'.
 */
function fromDbPlanKey(planKey: string): WorkspacePlan {
  const map: Record<string, WorkspacePlan> = {
    free:       'Free',
    pro:        'Pro',
    enterprise: 'Enterprise',
  };
  return (map[planKey.toLowerCase()] as WorkspacePlan) ?? 'Free';
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function planFromRow(row: Record<string, unknown>): DbSubscriptionPlan {
  return {
    id:            row.id as string,
    plan_key:      row.plan_key as string,
    name:          row.name as string,
    price_monthly: (row.price_monthly as number | null) ?? null,
    price_yearly:  (row.price_yearly as number | null) ?? null,
    max_livestock: (row.max_livestock as number | null) ?? null,
    max_members:   (row.max_members as number | null) ?? null,
    max_batches:   (row.max_batches as number | null) ?? null,
    max_listings:  (row.max_listings as number | null) ?? null,
    features:      Array.isArray(row.features) ? (row.features as string[]) : [],
    is_active:     Boolean(row.is_active),
    created_at:    row.created_at as string,
  };
}

function subscriptionFromRow(
  row: Record<string, unknown>,
  plan: DbSubscriptionPlan,
): DbWorkspaceSubscription {
  return {
    id:             row.id as string,
    workspace_id:   row.workspace_id as string,
    plan_id:        row.plan_id as string,
    plan:           fromDbPlanKey(plan.plan_key),
    plan_key:       plan.plan_key,
    status:         fromDbStatus(row.status as string),
    started_at:     (row.started_at as string | null) ?? null,
    expires_at:     (row.expires_at as string | null) ?? null,
    trial_ends_at:  (row.trial_ends_at as string | null) ?? null,
    billing_cycle:  (row.billing_cycle as 'monthly' | 'yearly' | null) ?? null,
    auto_renew:     Boolean(row.auto_renew),
    payment_method: (row.payment_method as string | null) ?? null,
    created_at:     row.created_at as string,
    updated_at:     row.updated_at as string,
  };
}

// ─── Read: workspace subscription ────────────────────────────────────────────

/**
 * Returns the subscription record for a workspace, with plan data resolved.
 * Returns null if the workspace has no subscription row or if RLS denies access.
 *
 * The caller must be an authenticated member of the workspace for RLS to pass.
 */
export async function repoGetWorkspaceSubscription(
  workspaceId: string,
): Promise<DbWorkspaceSubscription | null> {
  await requireAuthSession();
  try {
    const { data, error } = await supabase
      .from('workspace_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (error) {
      console.warn('[workspaceSubscriptionRepository] getSubscription error:', error.message);
      return null;
    }

    if (!data) return null;

    const row = data as Record<string, unknown>;
    const planRow = row.plan as Record<string, unknown> | null;

    if (!planRow) {
      console.warn('[workspaceSubscriptionRepository] plan join returned null for workspace:', workspaceId);
      return null;
    }

    return subscriptionFromRow(row, planFromRow(planRow));
  } catch (err) {
    console.warn('[workspaceSubscriptionRepository] Unexpected error in getSubscription:', err);
    return null;
  }
}

// ─── Read: subscription plans ─────────────────────────────────────────────────

/**
 * Returns all active subscription plans from the DB.
 * No RLS on subscription_plans — anon users can read this.
 * Returns [] on error (non-blocking; caller falls back to local PLAN_CONFIG).
 */
export async function repoListSubscriptionPlans(): Promise<DbSubscriptionPlan[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_yearly', { ascending: true, nullsFirst: true });

    if (error) {
      console.warn('[workspaceSubscriptionRepository] listPlans error:', error.message);
      return [];
    }

    return (data ?? []).map((row) => planFromRow(row as Record<string, unknown>));
  } catch (err) {
    console.warn('[workspaceSubscriptionRepository] Unexpected error in listPlans:', err);
    return [];
  }
}

/**
 * Returns a single subscription plan by plan_key (e.g. 'free', 'pro').
 * Returns null if not found.
 */
export async function repoGetSubscriptionPlanByKey(
  planKey: string,
): Promise<DbSubscriptionPlan | null> {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_key', planKey.toLowerCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.warn('[workspaceSubscriptionRepository] getPlanByKey error:', error.message);
      return null;
    }

    return data ? planFromRow(data as Record<string, unknown>) : null;
  } catch (err) {
    console.warn('[workspaceSubscriptionRepository] Unexpected error in getPlanByKey:', err);
    return null;
  }
}
