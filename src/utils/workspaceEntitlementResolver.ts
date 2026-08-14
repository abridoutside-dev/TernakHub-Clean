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
  const explicit = explicitEntitlements?.find((e) => e.feature_key === feature);
  const cache = workspaceId ? entitlementCache.get(workspaceId) : undefined;
  const cached = cache?.get(feature);

  // 1. Explicit entitlement from package (highest priority)
  if (explicit) {
    const accessMode = explicit.access_mode as ResolvedEntitlement['access_mode'];
    if (accessMode === 'denied') {
      return {
        feature_key: feature,
        allowed: false,
        access_mode: 'denied',
        usage_limit: null,
        usage_count: explicit.usage_count,
        remaining: 0,
        is_explicit: true,
      };
    }
    if (accessMode === 'limited' && explicit.usage_limit != null) {
      const remaining = Math.max(explicit.usage_limit - explicit.usage_count, 0);
      return {
        feature_key: feature,
        allowed: remaining > 0,
        access_mode: 'limited',
        usage_limit: explicit.usage_limit,
        usage_count: explicit.usage_count,
        remaining,
        is_explicit: true,
      };
    }
    return {
      feature_key: feature,
      allowed: true,
      access_mode: accessMode === 'unlimited' ? 'unlimited' : 'allowed',
      usage_limit: explicit.usage_limit,
      usage_count: explicit.usage_count,
      remaining: null,
      is_explicit: true,
    };
  }

  // 2. Cached entitlement (fallback when not explicitly provided)
  if (!explicit && cached) {
    const accessMode = cached.access_mode as ResolvedEntitlement['access_mode'];
    if (accessMode === 'denied') {
      return {
        feature_key: feature,
        allowed: false,
        access_mode: 'denied',
        usage_limit: null,
        usage_count: cached.usage_count,
        remaining: 0,
        is_explicit: true,
      };
    }
    if (accessMode === 'limited' && cached.usage_limit != null) {
      const remaining = Math.max(cached.usage_limit - cached.usage_count, 0);
      return {
        feature_key: feature,
        allowed: remaining > 0,
        access_mode: 'limited',
        usage_limit: cached.usage_limit,
        usage_count: cached.usage_count,
        remaining,
        is_explicit: true,
      };
    }
    return {
      feature_key: feature,
      allowed: true,
      access_mode: accessMode === 'unlimited' ? 'unlimited' : 'allowed',
      usage_limit: cached.usage_limit,
      usage_count: cached.usage_count,
      remaining: null,
      is_explicit: true,
    };
  }

  // 3. Fallback to plan-based FEATURE_GATE
  const planAllowed = planHasFeature(plan, feature);
  return {
    feature_key: feature,
    allowed: planAllowed,
    access_mode: planAllowed ? 'allowed' : 'denied',
    usage_limit: null,
    usage_count: 0,
    remaining: planAllowed ? null : 0,
    is_explicit: false,
  };
}
