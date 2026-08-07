// ─── Subscription Context — SUB-001 / DB-001B-3 ──────────────────────────────
//
// useSubscription() derives the active workspace's subscription state.
// DB-001B-3: subscription status/dates now read from Supabase via
// workspaceSubscriptionRepository (async). plan is read from WorkspaceContext
// (already Supabase-backed). hasFeature() uses the local FEATURE_GATE matrix
// (pure config — no in-memory store).
//
// RULES:
//  - Subscription is per-Workspace, NOT per-User.
//  - Switching the active workspace triggers a fresh Supabase fetch.
//  - hasFeature() is the sole gate — never compare plan strings in component code.
//  - No payment, billing, or invoice state lives here.

import { useState, useEffect } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { getWorkspaceSubscription } from '../services/workspaceService';
import type { SubscriptionRecordAdmin } from '../types/subscriptionAdmin';
import { hasFeature as gateHasFeature } from '../data/workspaceSubscriptionData';
import type { WorkspacePlan } from '../types/workspace';
import type { WorkspaceSubscriptionStatus, FeatureKey } from '../types/subscription';

// ─── Public Interface ─────────────────────────────────────────────────────────

export interface SubscriptionState {
  /** UUID of the currently active workspace — null when none is active. */
  workspaceUuid: string | null;

  /** Current subscription plan of the active workspace. */
  plan: WorkspacePlan;

  /** Lifecycle status of the subscription. */
  status: WorkspaceSubscriptionStatus;

  /** ISO date the current plan was first activated — null if unknown. */
  activatedAt: string | null;

  /** ISO date the plan expires — null for Free (no expiry). */
  expiredAt: string | null;

  /** ISO date the plan is due for renewal — null for Free. */
  renewalAt: string | null;

  /** True while the Supabase subscription fetch is in-flight. */
  isLoading: boolean;

  /**
   * Returns true when the active workspace's plan grants access to the feature.
   *
   * @example
   * const { hasFeature } = useSubscription();
   * if (hasFeature('ai_formula_recommendation')) { ... }
   */
  hasFeature: (feature: FeatureKey) => boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns the subscription state for the currently active workspace.
 *
 * Re-evaluates whenever WorkspaceContext's activeWorkspace changes
 * (e.g. the user switches workspace via the Global Header).
 *
 * DB-001B-3: status/dates fetched from Supabase workspace_subscriptions table
 * via workspaceSubscriptionRepository. plan is always read from
 * activeWorkspace.workspace_plan (Supabase-backed via WorkspaceContext).
 *
 * Must be called inside a component tree wrapped by <WorkspaceProvider>.
 */
export function useSubscription(): SubscriptionState {
  const { activeWorkspace } = useWorkspace();

  const workspaceUuid = activeWorkspace?.workspace_uuid ?? null;

  // Plan is the canonical source from WorkspaceContext (Supabase-backed).
  const plan: WorkspacePlan =
    (activeWorkspace?.workspace_plan as WorkspacePlan) ?? 'Free';

  // Async subscription record from Supabase (status + dates).
  const [dbSub, setDbSub]     = useState<SubscriptionRecordAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!workspaceUuid) {
      setDbSub(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getWorkspaceSubscription(workspaceUuid)
      .then((sub) => {
        setDbSub(sub);
      })
      .catch(() => {
        setDbSub(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [workspaceUuid]);

  return {
    workspaceUuid,
    plan,
    status:      (dbSub?.status      ?? 'Active') as WorkspaceSubscriptionStatus,
    activatedAt: dbSub?.started_at   ?? null,
    expiredAt:   dbSub?.expires_at   ?? null,
    renewalAt:   dbSub?.expires_at   ?? null, // DB has expires_at; renewal aligns with expiry
    isLoading,
    hasFeature:  (feature: FeatureKey) => gateHasFeature(plan, feature),
  };
}
