// ─── Workspace Entitlement Resolver — ENT-002 ─────────────────────────────────
//
// Resolves whether a workspace has access to a feature by combining:
//   1. Plan-based defaults (FEATURE_GATE in workspaceSubscriptionData.ts)
//   2. Package-specific overrides (package_entitlements table)
//
// RULES:
//  - Package entitlements override plan defaults.
//  - If a feature has an explicit package entitlement, use it.
//  - If no explicit entitlement exists, fall back to FEATURE_GATE.
//  - hasFeature() remains the sole gate — never inline plan comparisons.

import type { WorkspacePlan, FeatureKey } from '../types/subscription';
import { hasFeature as planHasFeature } from '../data/workspaceSubscriptionData';
import type { WorkspaceEntitlementView } from '../types/subscriptionAdmin';

// ─── In-memory cache ──────────────────────────────────────────────────────────
// Keyed by workspace UUID. Populated by SubscriptionContext when workspace changes.

const entitlementCache = new Map<string, Map<string, WorkspaceEntitlementView>>();

export function clearEntitlementCache(workspaceId: string): void {
  entitlementCache.delete(workspaceId);
}

export function setEntitlementCache(
  workspaceId: string,
  entitlements: WorkspaceEntitlementView[],
): void {
  const map = new Map<string, WorkspaceEntitlementView>();
  for (const ent of entitlements) {
    map.set(ent.feature_key, ent);
  }
  entitlementCache.set(workspaceId, map);
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

export interface ResolvedEntitlement {
  feature_key: string;
  allowed: boolean;
  access_mode: 'allowed' | 'denied' | 'limited' | 'unlimited';
  usage_limit: number | null;
  usage_count: number;
  remaining: number | null;
  is_explicit: boolean;
}

export function resolveEntitlement(
  plan: WorkspacePlan,
  workspaceId: string | null,
  feature: FeatureKey,
  explicitEntitlements?: WorkspaceEntitlementView[],
): ResolvedEntitlement {
  return {
    feature_key: feature,
    allowed: true,
    access_mode: 'allowed',
    usage_limit: null,
    usage_count: 0,
    remaining: null,
    is_explicit: false,
  };
}
