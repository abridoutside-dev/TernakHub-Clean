// ─── Workspace Subscription Data Layer — SUB-001 ──────────────────────────────
//
// SSOT for workspace-level subscription state, plan configs, feature gates,
// and history. Subscription belongs to a Workspace, NOT a User Account.
//
// RULES:
//  - hasFeature() is the SOLE feature gate — never inline plan comparisons.
//  - Subscription lifecycle writes go through WorkspaceService.

import { SUBSCRIPTION_FEATURE_POLICY } from './subscriptionFeaturePolicy';
import type { WorkspacePlan } from '../types/workspace';
import type {
  SubscriptionPlanConfig,
  SubscriptionBenefitRow,
  FeatureKey,
  SubscriptionChangeAction,
  WorkspaceSubscriptionStatus,
} from '../types/subscription';

// ─── Plan Configuration ──────────────────────────────────────────────────────

export const PLAN_ORDER: WorkspacePlan[] = ['Free', 'Pro', 'Enterprise'];

export const PLAN_CONFIG: Record<WorkspacePlan, SubscriptionPlanConfig> = {
  Free: {
    plan:             'Free',
    label:            'Free',
    description:      'Untuk peternak yang baru memulai. Semua fitur dasar tersedia tanpa biaya.',
    price_label:      'Rp 0 — Gratis selamanya',
    price_idr_yearly: 0,
    duration_label:   'Tidak ada masa berlaku',
    highlight:        false,
    badge:            null,
    color:            '#6b7280',
    bg:               '#f3f4f6',
    border:           '#d1d5db',
  },
  Pro: {
    plan:             'Pro',
    label:            'Pro',
    description:      'Untuk peternak aktif yang butuh analisis nutrisi lengkap dan fitur AI.',
    price_label:      'Rp 499.000 / tahun per Workspace',
    price_idr_yearly: 499_000,
    duration_label:   'Per tahun, dapat diperpanjang',
    highlight:        true,
    badge:            'POPULER',
    color:            '#b45309',
    bg:               '#fef3c7',
    border:           '#fcd34d',
  },
  Enterprise: {
    plan:             'Enterprise',
    label:            'Enterprise',
    description:      'Untuk usaha peternakan skala besar, organisasi, dan enterprise. Harga kustomisasi.',
    price_label:      'Mulai Rp 4.999.000 / tahun per Organisasi',
    price_idr_yearly: 4_999_000,
    duration_label:   'Kustomisasi — hubungi kami',
    highlight:        false,
    badge:            null,
    color:            '#6d28d9',
    bg:               '#ede9fe',
    border:           '#c4b5fd',
  },
};

// ─── UI Config Lookups ────────────────────────────────────────────────────────

export const SUBSCRIPTION_STATUS_CONFIG: Record<
  WorkspaceSubscriptionStatus,
  { icon: string; color: string; bg: string; label: string }
> = {
  Active:    { icon: '✅', color: '#1b7a43', bg: '#e8f5ee', label: 'Aktif'        },
  Expired:   { icon: '⏰', color: '#c62828', bg: '#ffebee', label: 'Kadaluarsa'   },
  Pending:   { icon: '⏳', color: '#7b5e2a', bg: '#fff8e1', label: 'Menunggu'     },
  Cancelled: { icon: '❌', color: '#6b7280', bg: '#f3f4f6', label: 'Dibatalkan'   },
};

export const SUBSCRIPTION_ACTION_CONFIG: Record<
  SubscriptionChangeAction,
  { icon: string; color: string; label: string }
> = {
  Aktivasi:    { icon: '🎉', color: '#1b7a43', label: 'Aktivasi'     },
  Upgrade:     { icon: '⬆️', color: '#b45309', label: 'Upgrade'      },
  Downgrade:   { icon: '⬇️', color: '#6b7280', label: 'Downgrade'    },
  Perpanjangan:{ icon: '🔄', color: '#1565c0', label: 'Perpanjangan'  },
};

// ─── Feature Gate Matrix ──────────────────────────────────────────────────────
// Source of truth for feature availability per plan.
// hasFeature() reads this — never duplicate this logic anywhere else.

// ─── Feature Gate Matrix — SUB-002 ───────────────────────────────────────────
// EVERY FeatureKey defined in src/types/subscription.ts MUST appear in all
// three plan rows below. The subscriptionFeaturePolicy.ts table is the human-
// readable authority; this matrix is the runtime enforcement copy. Keep in sync.
//
// Legend: true = full access, false = no access.
// Limits (quotas, monthly caps, etc.) are documented in subscriptionFeaturePolicy.ts
// and enforced by individual module logic, not by this boolean gate.

const FEATURE_GATE: Record<WorkspacePlan, Record<FeatureKey, boolean>> = {
  // ─────────────────────────────────────────────────────────────────────────
  Free: {
    // ── Authentication ──────────────────────────────────────────────────────
    auth_basic:                       true,
    auth_2fa:                         false,
    auth_sso:                         false,
    auth_saml:                        false,
    // ── Account / Workspace ─────────────────────────────────────────────────
    account_management:               true,
    workspace:                        true,   // limit: 3 workspaces
    workspace_limit_extended:         false,
    workspace_limit_unlimited:        false,
    workspace_member_limit_extended:  false,
    workspace_member_limit_unlimited: false,
    workspace_roles_custom:           false,
    multi_organization:               false,
    // ── Dashboard ───────────────────────────────────────────────────────────
    dashboard_basic:                  true,
    dashboard_business_snapshot:      false,
    enterprise_dashboard:             false,
    // ── Livestock ───────────────────────────────────────────────────────────
    livestock:                        true,
    livestock_batch:                  true,
    livestock_ai_analytics:           false,
    // ── Weight ──────────────────────────────────────────────────────────────
    weight_recording:                 true,
    weight_ai_prediction:             false,
    // ── Feed ────────────────────────────────────────────────────────────────
    feed:                             true,
    feed_scheduling:                  true,
    ai_feed_optimization:             false,
    ai_cost_optimization:             false,
    feed_comparison:                  false,
    feed_stock_advanced:              false,
    // ── Feed Formula ────────────────────────────────────────────────────────
    formula_feed:                     true,
    formula_analysis_basic:           true,
    formula_nutrition_complete:       false,
    ai_formula_recommendation:        false,
    formula_version_history:          false,
    // ── Feed Stock ──────────────────────────────────────────────────────────
    feed_stock_basic:                 true,
    feed_stock_alerts:                false,
    feed_stock_auto_reorder:          false,
    // ── Master Feed ─────────────────────────────────────────────────────────
    master_feed_view:                 true,
    master_feed_manage:               false,
    // ── Medicine ────────────────────────────────────────────────────────────
    medicine:                         true,
    medicine_scheduling:              true,
    medicine_ai_analytics:            false,
    // ── Master Medicine ─────────────────────────────────────────────────────
    master_medicine_view:             true,
    // ── Medicine Stock ──────────────────────────────────────────────────────
    medicine_stock_basic:             true,
    medicine_stock_alerts:            false,
    // ── Marketplace ─────────────────────────────────────────────────────────
    marketplace:                      true,
    marketplace_analytics:            false,
    marketplace_verified:             false,
    marketplace_priority_listing:     false,
    // ── AI Insight ──────────────────────────────────────────────────────────
    ai_basic:                         true,   // daily quota enforced by module
    ai_unlimited:                     false,
    ai_performance_analysis:          false,
    ai_organization:                  false,
    // ── Reports ─────────────────────────────────────────────────────────────
    recording:                        true,
    reports_basic:                    true,
    reports_advanced:                 false,
    premium_reports:                  false,
    reports_export_pdf:               false,
    reports_export_excel:             false,
    reports_scheduled:                false,
    // ── Notification ────────────────────────────────────────────────────────
    notification_basic:               true,
    notification_email:               false,
    notification_whatsapp:            false,
    notification_custom:              false,
    // ── News ────────────────────────────────────────────────────────────────
    news_view:                        true,
    news_submit:                      false,
    news_publish:                     false,
    // ── Event ───────────────────────────────────────────────────────────────
    event_view:                       true,   // Free: discover events
    event_register:                   false,  // Pro: participate
    event_cancel_registration:        false,
    event_view_registered:            false,
    event_create:                     false,
    event_edit:                       false,
    event_cancel:                     false,
    event_manage_participants:        false,
    event_analytics:                  false,
    event_organization:               false,
    event_multi_workspace:            false,
    event_org_analytics:              false,
    event_bulk_participants:          false,
    event_org_dashboard:              false,
    // ── Public Farm Profile ─────────────────────────────────────────────────
    farm_profile_basic:               true,
    farm_profile_enhanced:            false,
    farm_profile_verified:            false,
    farm_profile_premium:             false,
    // ── Global Search ───────────────────────────────────────────────────────
    search_basic:                     true,
    search_advanced:                  false,
    // ── Service Workspace Types ─────────────────────────────────────────────
    workspace_feed_store:             true,
    workspace_feed_store_analytics:   false,
    workspace_vet:                    true,
    workspace_vet_analytics:          false,
    workspace_transport:              true,
    workspace_transport_analytics:    false,
    // ── Backup & Restore ────────────────────────────────────────────────────
    backup_manual:                    true,   // monthly limit: 1
    auto_backup:                      false,
    backup_unlimited:                 false,
    restore_basic:                    true,
    restore_point_in_time:            false,
    // ── Export ──────────────────────────────────────────────────────────────
    export_basic:                     true,   // monthly limit: 5
    export_unlimited:                 false,
    // ── Analytics ───────────────────────────────────────────────────────────
    advanced_analytics:               false,
    organization_analytics:           false,
    analytics_custom_dashboard:       false,
    // ── Monitoring ──────────────────────────────────────────────────────────
    monitoring_basic:                 true,
    monitoring_advanced:              false,
    monitoring_organization:          false,
    // ── Trust & Verification ────────────────────────────────────────────────
    trust_score:                      true,
    trust_badge:                      false,
    trust_verified:                   false,
    verification_self:                true,
    verification_basic:               false,
    verification_full:                false,
    // ── API ─────────────────────────────────────────────────────────────────
    api_basic:                        false,
    api_integration:                  false,
    // ── Admin ───────────────────────────────────────────────────────────────
    advanced_administration:          false,
    audit_trail:                      false,
    approval_workflow:                false,
    dedicated_support:                false,
    sla:                              false,
    custom_integration:               false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  Pro: {
    // ── Authentication ──────────────────────────────────────────────────────
    auth_basic:                       true,
    auth_2fa:                         true,
    auth_sso:                         true,
    auth_saml:                        false,
    // ── Account / Workspace ─────────────────────────────────────────────────
    account_management:               true,
    workspace:                        true,
    workspace_limit_extended:         true,   // up to 10
    workspace_limit_unlimited:        false,
    workspace_member_limit_extended:  true,   // up to 20 per workspace
    workspace_member_limit_unlimited: false,
    workspace_roles_custom:           true,
    multi_organization:               false,
    // ── Dashboard ───────────────────────────────────────────────────────────
    dashboard_basic:                  true,
    dashboard_business_snapshot:      true,
    enterprise_dashboard:             false,
    // ── Livestock ───────────────────────────────────────────────────────────
    livestock:                        true,
    livestock_batch:                  true,
    livestock_ai_analytics:           true,
    // ── Weight ──────────────────────────────────────────────────────────────
    weight_recording:                 true,
    weight_ai_prediction:             true,
    // ── Feed ────────────────────────────────────────────────────────────────
    feed:                             true,
    feed_scheduling:                  true,
    ai_feed_optimization:             true,
    ai_cost_optimization:             true,
    feed_comparison:                  true,
    feed_stock_advanced:              true,
    // ── Feed Formula ────────────────────────────────────────────────────────
    formula_feed:                     true,
    formula_analysis_basic:           true,
    formula_nutrition_complete:       true,
    ai_formula_recommendation:        true,
    formula_version_history:          true,
    // ── Feed Stock ──────────────────────────────────────────────────────────
    feed_stock_basic:                 true,
    feed_stock_alerts:                true,
    feed_stock_auto_reorder:          false,
    // ── Master Feed ─────────────────────────────────────────────────────────
    master_feed_view:                 true,
    master_feed_manage:               true,
    // ── Medicine ────────────────────────────────────────────────────────────
    medicine:                         true,
    medicine_scheduling:              true,
    medicine_ai_analytics:            true,
    // ── Master Medicine ─────────────────────────────────────────────────────
    master_medicine_view:             true,
    // ── Medicine Stock ──────────────────────────────────────────────────────
    medicine_stock_basic:             true,
    medicine_stock_alerts:            true,
    // ── Marketplace ─────────────────────────────────────────────────────────
    marketplace:                      true,
    marketplace_analytics:            true,
    marketplace_verified:             true,
    marketplace_priority_listing:     false,
    // ── AI Insight ──────────────────────────────────────────────────────────
    ai_basic:                         true,
    ai_unlimited:                     true,
    ai_performance_analysis:          true,
    ai_organization:                  false,
    // ── Reports ─────────────────────────────────────────────────────────────
    recording:                        true,
    reports_basic:                    true,
    reports_advanced:                 true,
    premium_reports:                  true,
    reports_export_pdf:               true,
    reports_export_excel:             true,
    reports_scheduled:                false,
    // ── Notification ────────────────────────────────────────────────────────
    notification_basic:               true,
    notification_email:               true,
    notification_whatsapp:            true,
    notification_custom:              false,
    // ── News ────────────────────────────────────────────────────────────────
    news_view:                        true,
    news_submit:                      true,
    news_publish:                     true,
    // ── Event ───────────────────────────────────────────────────────────────
    event_view:                       true,
    event_register:                   true,   // Pro: participate
    event_cancel_registration:        true,
    event_view_registered:            true,
    event_create:                     true,
    event_edit:                       true,
    event_cancel:                     true,
    event_manage_participants:        true,
    event_analytics:                  true,
    event_organization:               false,  // Enterprise: organize
    event_multi_workspace:            false,
    event_org_analytics:              false,
    event_bulk_participants:          false,
    event_org_dashboard:              false,
    // ── Public Farm Profile ─────────────────────────────────────────────────
    farm_profile_basic:               true,
    farm_profile_enhanced:            true,
    farm_profile_verified:            true,
    farm_profile_premium:             false,
    // ── Global Search ───────────────────────────────────────────────────────
    search_basic:                     true,
    search_advanced:                  true,
    // ── Service Workspace Types ─────────────────────────────────────────────
    workspace_feed_store:             true,
    workspace_feed_store_analytics:   true,
    workspace_vet:                    true,
    workspace_vet_analytics:          true,
    workspace_transport:              true,
    workspace_transport_analytics:    true,
    // ── Backup & Restore ────────────────────────────────────────────────────
    backup_manual:                    true,
    auto_backup:                      true,
    backup_unlimited:                 false,
    restore_basic:                    true,
    restore_point_in_time:            true,
    // ── Export ──────────────────────────────────────────────────────────────
    export_basic:                     true,
    export_unlimited:                 false,
    // ── Analytics ───────────────────────────────────────────────────────────
    advanced_analytics:               true,
    organization_analytics:           false,
    analytics_custom_dashboard:       false,
    // ── Monitoring ──────────────────────────────────────────────────────────
    monitoring_basic:                 true,
    monitoring_advanced:              true,
    monitoring_organization:          false,
    // ── Trust & Verification ────────────────────────────────────────────────
    trust_score:                      true,
    trust_badge:                      true,
    trust_verified:                   false,
    verification_self:                true,
    verification_basic:               true,
    verification_full:                false,
    // ── API ─────────────────────────────────────────────────────────────────
    api_basic:                        true,
    api_integration:                  false,
    // ── Admin ───────────────────────────────────────────────────────────────
    advanced_administration:          false,
    audit_trail:                      false,
    approval_workflow:                false,
    dedicated_support:                false,
    sla:                              false,
    custom_integration:               false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  Enterprise: {
    // ── All features available ───────────────────────────────────────────────
    auth_basic:                       true,
    auth_2fa:                         true,
    auth_sso:                         true,
    auth_saml:                        true,
    account_management:               true,
    workspace:                        true,
    workspace_limit_extended:         true,
    workspace_limit_unlimited:        true,
    workspace_member_limit_extended:  true,
    workspace_member_limit_unlimited: true,
    workspace_roles_custom:           true,
    multi_organization:               true,
    dashboard_basic:                  true,
    dashboard_business_snapshot:      true,
    enterprise_dashboard:             true,
    livestock:                        true,
    livestock_batch:                  true,
    livestock_ai_analytics:           true,
    weight_recording:                 true,
    weight_ai_prediction:             true,
    feed:                             true,
    feed_scheduling:                  true,
    ai_feed_optimization:             true,
    ai_cost_optimization:             true,
    feed_comparison:                  true,
    feed_stock_advanced:              true,
    formula_feed:                     true,
    formula_analysis_basic:           true,
    formula_nutrition_complete:       true,
    ai_formula_recommendation:        true,
    formula_version_history:          true,
    feed_stock_basic:                 true,
    feed_stock_alerts:                true,
    feed_stock_auto_reorder:          true,
    master_feed_view:                 true,
    master_feed_manage:               true,
    medicine:                         true,
    medicine_scheduling:              true,
    medicine_ai_analytics:            true,
    master_medicine_view:             true,
    medicine_stock_basic:             true,
    medicine_stock_alerts:            true,
    marketplace:                      true,
    marketplace_analytics:            true,
    marketplace_verified:             true,
    marketplace_priority_listing:     true,
    ai_basic:                         true,
    ai_unlimited:                     true,
    ai_performance_analysis:          true,
    ai_organization:                  true,
    recording:                        true,
    reports_basic:                    true,
    reports_advanced:                 true,
    premium_reports:                  true,
    reports_export_pdf:               true,
    reports_export_excel:             true,
    reports_scheduled:                true,
    notification_basic:               true,
    notification_email:               true,
    notification_whatsapp:            true,
    notification_custom:              true,
    news_view:                        true,
    news_submit:                      true,
    news_publish:                     true,
    event_view:                       true,
    event_register:                   true,
    event_cancel_registration:        true,
    event_view_registered:            true,
    event_create:                     true,
    event_edit:                       true,
    event_cancel:                     true,
    event_manage_participants:        true,
    event_analytics:                  true,
    event_organization:               true,
    event_multi_workspace:            true,
    event_org_analytics:              true,
    event_bulk_participants:          true,
    event_org_dashboard:              true,
    farm_profile_basic:               true,
    farm_profile_enhanced:            true,
    farm_profile_verified:            true,
    farm_profile_premium:             true,
    search_basic:                     true,
    search_advanced:                  true,
    workspace_feed_store:             true,
    workspace_feed_store_analytics:   true,
    workspace_vet:                    true,
    workspace_vet_analytics:          true,
    workspace_transport:              true,
    workspace_transport_analytics:    true,
    backup_manual:                    true,
    auto_backup:                      true,
    backup_unlimited:                 true,
    restore_basic:                    true,
    restore_point_in_time:            true,
    export_basic:                     true,
    export_unlimited:                 true,
    advanced_analytics:               true,
    organization_analytics:           true,
    analytics_custom_dashboard:       true,
    monitoring_basic:                 true,
    monitoring_advanced:              true,
    monitoring_organization:          true,
    trust_score:                      true,
    trust_badge:                      true,
    trust_verified:                   true,
    verification_self:                true,
    verification_basic:               true,
    verification_full:                true,
    api_basic:                        true,
    api_integration:                  true,
    advanced_administration:          true,
    audit_trail:                      true,
    approval_workflow:                true,
    dedicated_support:                true,
    sla:                              true,
    custom_integration:               true,
  },
};

/**
 * Returns true if the given plan grants access to the feature.
 * This is the SOLE feature gate function — use it everywhere instead of
 * inline plan comparisons.
 */
export function hasFeature(plan: WorkspacePlan, feature: FeatureKey): boolean {
  return FEATURE_GATE[plan][feature];
}

// ─── Dev-Mode Policy/Gate Drift Detection — MAJOR-002 ────────────────────────
// Imports SUBSCRIPTION_FEATURE_POLICY at runtime so the policy table is a
// genuine runtime input, not just documentation-as-code.
// Any future drift between the policy table and FEATURE_GATE is caught at
// app startup during development — a console.error surfaces the discrepancy.

if (import.meta.env.DEV) {
  const policyKeys = new Set(SUBSCRIPTION_FEATURE_POLICY.map((r) => r.key));
  const gateKeys   = new Set(Object.keys(FEATURE_GATE.Free) as FeatureKey[]);
  const missing    = [...policyKeys].filter((k) => !gateKeys.has(k));
  const extra      = [...gateKeys].filter((k) => !policyKeys.has(k));
  if (missing.length || extra.length) {
    console.error('[SUB] Policy/Gate drift detected', { missing, extra });
  }
}

// ─── Feature Minimum Plan Lookup ──────────────────────────────────────────────
// Maps each FeatureKey to the MINIMUM plan that unlocks it.
// Used by UpgradeDialog and FeatureGate to determine the upgrade target.

export const FEATURE_MIN_PLAN: Record<FeatureKey, WorkspacePlan> = {
  // ── FREE ──────────────────────────────────────────────────────────────────
  auth_basic:                       'Free',
  account_management:               'Free',
  workspace:                        'Free',
  dashboard_basic:                  'Free',
  livestock:                        'Free',
  livestock_batch:                  'Free',
  weight_recording:                 'Free',
  feed:                             'Free',
  feed_scheduling:                  'Free',
  formula_feed:                     'Free',
  formula_analysis_basic:           'Free',
  feed_stock_basic:                 'Free',
  master_feed_view:                 'Free',
  medicine:                         'Free',
  medicine_scheduling:              'Free',
  master_medicine_view:             'Free',
  medicine_stock_basic:             'Free',
  marketplace:                      'Free',
  ai_basic:                         'Free',
  recording:                        'Free',
  reports_basic:                    'Free',
  notification_basic:               'Free',
  news_view:                        'Free',
  event_view:                       'Free',
  farm_profile_basic:               'Free',
  search_basic:                     'Free',
  workspace_feed_store:             'Free',
  workspace_vet:                    'Free',
  workspace_transport:              'Free',
  backup_manual:                    'Free',
  restore_basic:                    'Free',
  export_basic:                     'Free',
  monitoring_basic:                 'Free',
  trust_score:                      'Free',
  verification_self:                'Free',
  // ── PRO ───────────────────────────────────────────────────────────────────
  auth_2fa:                         'Pro',
  auth_sso:                         'Pro',
  workspace_limit_extended:         'Pro',
  workspace_member_limit_extended:  'Pro',
  workspace_roles_custom:           'Pro',
  dashboard_business_snapshot:      'Pro',
  livestock_ai_analytics:           'Pro',
  weight_ai_prediction:             'Pro',
  ai_feed_optimization:             'Pro',
  ai_cost_optimization:             'Pro',
  feed_comparison:                  'Pro',
  feed_stock_advanced:              'Pro',
  formula_nutrition_complete:       'Pro',
  ai_formula_recommendation:        'Pro',
  formula_version_history:          'Pro',
  feed_stock_alerts:                'Pro',
  master_feed_manage:               'Pro',
  medicine_ai_analytics:            'Pro',
  medicine_stock_alerts:            'Pro',
  marketplace_analytics:            'Pro',
  marketplace_verified:             'Pro',
  ai_unlimited:                     'Pro',
  ai_performance_analysis:          'Pro',
  reports_advanced:                 'Pro',
  premium_reports:                  'Pro',
  reports_export_pdf:               'Pro',
  reports_export_excel:             'Pro',
  notification_email:               'Pro',
  notification_whatsapp:            'Pro',
  news_submit:                      'Pro',
  news_publish:                     'Pro',
  event_register:                   'Pro',
  event_cancel_registration:        'Pro',
  event_view_registered:            'Pro',
  event_create:                     'Pro',
  event_edit:                       'Pro',
  event_cancel:                     'Pro',
  event_manage_participants:        'Pro',
  event_analytics:                  'Pro',
  farm_profile_enhanced:            'Pro',
  farm_profile_verified:            'Pro',
  search_advanced:                  'Pro',
  workspace_feed_store_analytics:   'Pro',
  workspace_vet_analytics:          'Pro',
  workspace_transport_analytics:    'Pro',
  auto_backup:                      'Pro',
  restore_point_in_time:            'Pro',
  advanced_analytics:               'Pro',
  monitoring_advanced:              'Pro',
  trust_badge:                      'Pro',
  verification_basic:               'Pro',
  api_basic:                        'Pro',
  // ── ENTERPRISE ────────────────────────────────────────────────────────────
  auth_saml:                        'Enterprise',
  workspace_limit_unlimited:        'Enterprise',
  workspace_member_limit_unlimited: 'Enterprise',
  multi_organization:               'Enterprise',
  enterprise_dashboard:             'Enterprise',
  feed_stock_auto_reorder:          'Enterprise',
  marketplace_priority_listing:     'Enterprise',
  ai_organization:                  'Enterprise',
  reports_scheduled:                'Enterprise',
  notification_custom:              'Enterprise',
  event_organization:               'Enterprise',
  event_multi_workspace:            'Enterprise',
  event_org_analytics:              'Enterprise',
  event_bulk_participants:          'Enterprise',
  event_org_dashboard:              'Enterprise',
  farm_profile_premium:             'Enterprise',
  backup_unlimited:                 'Enterprise',
  export_unlimited:                 'Enterprise',
  organization_analytics:           'Enterprise',
  analytics_custom_dashboard:       'Enterprise',
  monitoring_organization:          'Enterprise',
  trust_verified:                   'Enterprise',
  verification_full:                'Enterprise',
  api_integration:                  'Enterprise',
  advanced_administration:          'Enterprise',
  audit_trail:                      'Enterprise',
  approval_workflow:                'Enterprise',
  dedicated_support:                'Enterprise',
  sla:                              'Enterprise',
  custom_integration:               'Enterprise',
};

/**
 * Returns the minimum WorkspacePlan required to access a feature.
 * Used by UpgradeDialog to determine the upgrade target.
 */
export function getMinimumPlan(feature: FeatureKey): WorkspacePlan {
  return FEATURE_MIN_PLAN[feature];
}

// ─── Plan Upgrade Unlocks ─────────────────────────────────────────────────────
// Human-readable list of features unlocked when upgrading TO each plan.
// Shown in UpgradeDialog and FeatureGate locked-card "benefits" section.

export const PLAN_UPGRADE_UNLOCKS: Record<WorkspacePlan, string[]> = {
  Free: [], // "Upgrading to Free" unlocks nothing — already available to all
  Pro: [
    // AI — Productivity
    'AI Insight Tidak Terbatas (tanpa batas harian)',
    'AI Rekomendasi & Optimasi Formula Pakan',
    'AI Optimasi Biaya Pakan',
    'AI Analisis Performa & Pertumbuhan Ternak',
    // Formula
    'Analisis Nutrisi Lengkap (DM · PK · TDN · SK · LK · Abu · Ca · P · NDF · ADF · NFC · Energi)',
    'Riwayat Versi Formula',
    'Perbandingan Formula & Pakan',
    // Reports & Export
    'Laporan Lanjutan & Export PDF / Excel',
    // Marketplace
    'Analitik Penjual Marketplace (views, konversi, omzet)',
    'Verified Seller / Farm Badge',
    // Notification
    'Notifikasi Email & WhatsApp',
    // Events
    'Daftar & Batalkan Pendaftaran Event',
    'Buat & Kelola Event Sendiri, Analitik Peserta',
    // News
    'Kirim & Publikasi Konten / Berita',
    // Auth
    'Two-Factor Authentication (2FA) & SSO',
    // Backup
    'Backup Otomatis Mingguan',
    // API
    'Akses REST API Read-Only',
    // Workspace
    'Hingga 10 Workspace & 20 Anggota per Workspace',
  ],
  Enterprise: [
    // Organization
    'Multi Organisasi — kelola beberapa farm dalam satu akun',
    'Enterprise Dashboard terkonsolidasi lintas workspace',
    'Analitik Organisasi & AI Insight Organisasi',
    // Administration
    'Izin & Administrasi Lanjutan',
    'Audit Trail — log perubahan lengkap & immutable',
    'Approval Workflow multi-level',
    // API & Integration
    'Full Read/Write API + Webhook Support',
    'Custom Integration pihak ketiga',
    // Event
    'Event Lintas Workspace & Organisasi',
    'Analitik Event Organisasi & Dashboard KPI',
    'Manajemen Peserta Massal (Bulk) lintas org events',
    // Marketplace
    'Priority / Featured Listing di Marketplace',
    // Monitoring
    'Monitoring Organisasi & SLA Garansi Uptime',
    // Trust
    'Full Verification & Verified Status',
    // Backup & Export
    'Backup Tidak Terbatas, Export Semua Format',
    // Support
    'Dedicated Account Manager & Priority Support',
    // Workspace
    'Workspace & Anggota Tidak Terbatas',
  ],
};

// ─── Benefit Comparison Table ─────────────────────────────────────────────────
// Curated human-readable rows for subscription feature messaging.
// All 33 feature modules are represented here. Kept in sync with
// SUBSCRIPTION_FEATURE_POLICY via the dev-mode drift detection above.

export const BENEFIT_ROWS: SubscriptionBenefitRow[] = [

  // ── Fitur Dasar (Free) ──────────────────────────────────────────────────────
  { group: 'Fitur Dasar',              label: 'Manajemen Workspace',              free: 'Hingga 3 workspace',              pro: 'Hingga 10 workspace',              enterprise: 'Tidak terbatas'              },
  {                                    label: 'Anggota per Workspace',            free: 'Hingga 5 anggota',                pro: 'Hingga 20 anggota',                enterprise: 'Tidak terbatas'              },
  {                                    label: 'Pencatatan Ternak (Livestock)',     free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Manajemen Batch Ternak',           free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Marketplace (Beli, Jual, Nego)',   free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Lihat & Telusuri Event',           free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Bagikan Event & Tambah ke Kalender', free: true,                            pro: true,                               enterprise: true                          },
  {                                    label: 'Lihat Berita & Artikel',           free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Laporan Dasar',                    free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Notifikasi In-App',                free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Profil Farm Publik (Dasar)',       free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Pencarian Global',                 free: true,                              pro: true,                               enterprise: true                          },

  // ── Manajemen Ternak ────────────────────────────────────────────────────────
  { group: 'Manajemen Ternak',         label: 'Catat Berat & ADG',               free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Jadwal & Riwayat Pemberian Pakan', free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Pencatatan Obat & Jadwal',         free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Stok Pakan (Dasar)',               free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Stok Obat (Dasar)',                free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Master Referensi Pakan',           free: 'Baca saja',                       pro: 'Baca + Kelola',                    enterprise: 'Baca + Kelola'               },
  {                                    label: 'Master Referensi Obat & Penyakit', free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Formula Pakan',                    free: true,                              pro: true,                               enterprise: true                          },
  {                                    label: 'Analisis Formula Dasar',           free: 'PK · TDN · Berat · Estimasi Biaya', pro: 'PK · TDN · Berat · Estimasi Biaya', enterprise: 'PK · TDN · Berat · Estimasi Biaya' },
  {                                    label: 'Ekspor Data Dasar (CSV)',          free: 'Hingga 5/bulan',                  pro: true,                               enterprise: true                          },
  {                                    label: 'Backup Manual',                    free: '1 snapshot/bulan',                pro: true,                               enterprise: true                          },
  {                                    label: 'Pemulihan Data (Restore)',          free: true,                              pro: true,                               enterprise: true                          },

  // ── AI Insight ──────────────────────────────────────────────────────────────
  { group: 'AI Insight',               label: 'AI Insight Dasar',                free: 'Terbatas (kuota harian)',          pro: true,                               enterprise: true                          },
  {                                    label: 'AI Insight Tidak Terbatas',        free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'AI Rekomendasi Formula Pakan',     free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'AI Optimasi Pakan & Biaya',        free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'AI Analisis Performa Ternak',      free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'AI Prediksi Pertumbuhan & ADG',    free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'AI Analisis Kesehatan & Obat',     free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'AI Insight Organisasi',            free: false,                             pro: false,                              enterprise: true                          },

  // ── Fitur Pro ───────────────────────────────────────────────────────────────
  { group: 'Fitur Pro',                label: 'Analisis Nutrisi Lengkap',         free: false,                             pro: 'DM · PK · TDN · SK · LK · Abu · Ca · P · NDF · ADF · NFC · Energi', enterprise: 'DM · PK · TDN · SK · LK · Abu · Ca · P · NDF · ADF · NFC · Energi' },
  {                                    label: 'Riwayat Versi Formula',            free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Perbandingan Formula & Pakan',     free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Peringatan Stok Pakan Menipis',    free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Peringatan Kedaluwarsa Obat',      free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Analitik Stok Pakan Lanjutan',     free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Pencarian Lanjutan & Filter Tersimpan', free: false,                        pro: true,                               enterprise: true                          },
  {                                    label: 'Laporan Lanjutan & Report Builder', free: false,                            pro: true,                               enterprise: true                          },
  {                                    label: 'Export PDF',                       free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Export Excel / CSV',               free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Backup Otomatis Mingguan',         free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Point-in-Time Restore',            free: false,                             pro: true,                               enterprise: true                          },

  // ── Marketplace & Kepercayaan ───────────────────────────────────────────────
  { group: 'Marketplace & Kepercayaan', label: 'Analitik Penjual',               free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Verified Seller / Farm Badge',     free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Trust Badge di Profil & Listing',  free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Verifikasi Identitas & Farm',      free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Priority / Featured Listing',      free: false,                             pro: false,                              enterprise: true                          },

  // ── News & Event ────────────────────────────────────────────────────────────
  { group: 'News & Event',             label: 'Daftar (Register) ke Event',      free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Batalkan Pendaftaran Event',       free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Lihat Daftar Event Saya',          free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Kirim Artikel / Berita',          free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Publikasi Konten (setelah approval)', free: false,                          pro: true,                               enterprise: true                          },
  {                                    label: 'Buat & Edit Event Sendiri',        free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Batalkan Event Sendiri',           free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Kelola Peserta & Check-In Event',  free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Analitik Event',                   free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Event Lintas Workspace & Organisasi', free: false,                          pro: false,                              enterprise: true                          },
  {                                    label: 'Analitik Event Organisasi',        free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Kelola Peserta Massal (Bulk)',      free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Dashboard Event Organisasi',       free: false,                             pro: false,                              enterprise: true                          },

  // ── Notifikasi & Komunikasi ─────────────────────────────────────────────────
  { group: 'Notifikasi & Komunikasi',  label: 'Notifikasi Email',                free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Notifikasi WhatsApp',              free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Custom Alert Rules & Eskalasi',    free: false,                             pro: false,                              enterprise: true                          },

  // ── Keamanan & Akun ─────────────────────────────────────────────────────────
  { group: 'Keamanan & Akun',          label: 'Two-Factor Authentication (2FA)',  free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'OAuth / Social Login (Google, dll)', free: false,                           pro: true,                               enterprise: true                          },
  {                                    label: 'SAML 2.0 Enterprise SSO',          free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Role Kustom per Workspace',        free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Dashboard Business Snapshot',      free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Analitik Lanjutan (Cross-Module)', free: false,                             pro: true,                               enterprise: true                          },
  {                                    label: 'Monitoring Lanjutan & Custom Alert', free: false,                           pro: true,                               enterprise: true                          },
  {                                    label: 'Akses REST API (Read-Only)',       free: false,                             pro: '10.000 req/bulan',                 enterprise: 'Tidak terbatas'              },

  // ── Fitur Enterprise ────────────────────────────────────────────────────────
  { group: 'Fitur Enterprise',         label: 'Multi Organisasi',                 free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Enterprise Dashboard Terkonsolidasi', free: false,                          pro: false,                              enterprise: true                          },
  {                                    label: 'Analitik & AI Organisasi',          free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Dashboard Analitik Kustom',        free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Monitoring & SLA Organisasi',      free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Izin & Administrasi Lanjutan',     free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Audit Trail (Log Immutable)',       free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Approval Workflow Multi-Level',    free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Full Read/Write API + Webhook',   free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Custom Integration Pihak Ketiga',  free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Reorder Stok Otomatis',            free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Backup Tidak Terbatas',            free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Export Semua Format (Tidak Terbatas)', free: false,                         pro: false,                              enterprise: true                          },
  {                                    label: 'Laporan Otomatis Terjadwal',       free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Workspace & Anggota Tidak Terbatas', free: false,                           pro: false,                              enterprise: true                          },
  {                                    label: 'Verifikasi Penuh (Identitas + Farm + Dokumen)', free: false,               pro: false,                              enterprise: true                          },
  {                                    label: 'Full Verified Status',             free: false,                             pro: false,                              enterprise: true                          },
  {                                    label: 'Dedicated Account Manager & Priority Support', free: false,                 pro: false,                              enterprise: true                          },
  {                                    label: 'Garansi Uptime SLA',               free: false,                             pro: false,                              enterprise: true                          },
];

// Subscription status and history are read from Supabase through the
// WorkspaceService. This module contains only shared plan policy/configuration.
