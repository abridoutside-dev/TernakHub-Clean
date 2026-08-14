// ─── Subscription Context — SUB-001 / DB-001B-3 / ENT-002 ─────────────────────
//
// useSubscription() derives the active workspace's subscription state.
// DB-001B-3: subscription status/dates now read from Supabase via
// workspaceSubscriptionRepository (async). plan is read from WorkspaceContext
// (already Supabase-backed). hasFeature() uses the local FEATURE_GATE matrix
// as fallback and package-specific entitlements as override.
//
// RULES:
//  - Subscription is per-Workspace, NOT per-User.
//  - Switching the active workspace triggers a fresh Supabase fetch.
//  - hasFeature() is the sole gate — never compare plan strings in component code.
//  - Package entitlements override plan defaults.
//  - No payment, billing, or invoice state lives here.

import { useState, useEffect, useMemo } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { getWorkspaceSubscription, getWorkspaceEntitlements } from '../services/workspaceService';
import { resolveEntitlement, setEntitlementCache, clearEntitlementCache } from '../utils/workspaceEntitlementResolver';
import type { SubscriptionRecordAdmin } from '../types/subscriptionAdmin';
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
   * Returns true when the active workspace's plan/package grants access to the feature.
   * Package entitlements override plan defaults.
   *
   * @example
   * const { hasFeature } = useSubscription();
   * if (hasFeature('ai_formula_recommendation')) { ... }
   */
  hasFeature: (feature: FeatureKey) => boolean;

  /**
   * Returns detailed entitlement info for a feature.
   * Includes usage count, limit, and remaining quota when applicable.
   */
  getEntitlement: (feature: FeatureKey) => {
    allowed: boolean;
    access_mode: string;
    usage_limit: number | null;
    usage_count: number;
    remaining: number | null;
    is_explicit: boolean;
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSubscription(): SubscriptionState {
  const { activeWorkspace } = useWorkspace();

  const workspaceUuid = activeWorkspace?.workspace_uuid ?? null;

  const plan: WorkspacePlan =
    (activeWorkspace?.workspace_plan as WorkspacePlan) ?? 'Free';

  const [dbSub, setDbSub] = useState<SubscriptionRecordAdmin | null>(null);
  const [entitlements, setEntitlements] = useState<Awaited<ReturnType<typeof getWorkspaceEntitlements>>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!workspaceUuid) {
      setDbSub(null);
      setEntitlements([]);
      clearEntitlementCache(workspaceUuid ?? '');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all([
      getWorkspaceSubscription(workspaceUuid),
      getWorkspaceEntitlements(workspaceUuid),
    ])
      .then(([sub, ents]) => {
        setDbSub(sub);
        setEntitlements(ents);
        setEntitlementCache(workspaceUuid, ents);
      })
      .catch(() => {
        setDbSub(null);
        setEntitlements([]);
        clearEntitlementCache(workspaceUuid);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [workspaceUuid]);

  const hasFeature = useMemo(
    () => (feature: FeatureKey) => {
      const resolved = resolveEntitlement(plan, workspaceUuid, feature, entitlements);
      return resolved.allowed;
    },
    [plan, workspaceUuid, entitlements],
  );

  const getEntitlement = useMemo(
    () => (feature: FeatureKey) => {
      return resolveEntitlement(plan, workspaceUuid, feature, entitlements);
    },
    [plan, workspaceUuid, entitlements],
  );

  return {
    workspaceUuid,
    plan,
    status:      (dbSub?.status      ?? 'Active') as WorkspaceSubscriptionStatus,
    activatedAt: dbSub?.started_at   ?? null,
    expiredAt:   dbSub?.expires_at   ?? null,
    renewalAt:   dbSub?.expires_at   ?? null,
    isLoading,
    hasFeature,
    getEntitlement,
  };
}
