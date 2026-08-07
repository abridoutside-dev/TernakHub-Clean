// ─── Subscription Domain Types — SUB-001 / SUB-002 ───────────────────────────
//
// Subscription is attached to a Workspace, NOT a User Account.
// One user may own multiple Workspaces; each Workspace has its own subscription.
//
// Rules:
//  - Never import from pages or components here.
//  - hasFeature() is the single gate function — defined in workspaceSubscriptionData.ts.
//  - Payment is manual only; there is no gateway, invoice, billing, tax, or coupon engine.
//  - All feature access decisions MUST reference subscriptionFeaturePolicy.ts.
//  - No module may define its own subscription rules.

import type { WorkspacePlan } from './workspace';
export type { WorkspacePlan };

// ─── Lifecycle Status ─────────────────────────────────────────────────────────

/** Lifecycle status of a workspace subscription. */
export type WorkspaceSubscriptionStatus =
  | 'Active'      // subscription is current and valid
  | 'Expired'     // paid plan has passed expired_at
  | 'Cancelled'   // explicitly cancelled (e.g. workspace archived)
  | 'Pending';    // plan change requested, awaiting confirmation

// ─── History ──────────────────────────────────────────────────────────────────

/** Action type recorded in the immutable subscription history log. */
export type SubscriptionChangeAction =
  | 'Aktivasi'      // first activation of any plan
  | 'Upgrade'       // moved to a higher tier
  | 'Downgrade'     // moved to a lower tier
  | 'Perpanjangan'; // renewed the same plan

// ─── Feature Gate ─────────────────────────────────────────────────────────────
//
// CANONICAL feature key registry for TernakHub.
// Every key here maps to exactly one row in SUBSCRIPTION_FEATURE_POLICY
// (src/data/subscriptionFeaturePolicy.ts).
//
// RULES:
//  - hasFeature(plan, key) is the ONLY consumer of these keys. Never compare
//    plan strings inline in components or data modules.
//  - Add new keys here AND add a corresponding row to SUBSCRIPTION_FEATURE_POLICY
//    AND update FEATURE_GATE + FEATURE_MIN_PLAN in workspaceSubscriptionData.ts.
//  - Only System Administrators may change which plan a key requires.
//  - No module is allowed to define its own subscription rules outside this file.

export type FeatureKey =
  // ═══════════════════════════════════════════════════════════════════════════
  // FREE TIER — always available
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Authentication ─────────────────────────────────────────────────────────
  | 'auth_basic'                    // email/password sign-in & sign-up

  // ── Account ────────────────────────────────────────────────────────────────
  | 'account_management'            // profile, password, notification prefs
  | 'workspace'                     // create & manage workspaces (limit: 3)

  // ── Dashboard ──────────────────────────────────────────────────────────────
  | 'dashboard_basic'               // activity summary, quick actions, AI insight (limited)

  // ── Livestock ──────────────────────────────────────────────────────────────
  | 'livestock'                     // full livestock CRUD, unlimited records
  | 'livestock_batch'               // batch management & batch operations
  | 'weight_recording'              // catat bobot, weight history

  // ── Feed ───────────────────────────────────────────────────────────────────
  | 'feed'                          // pemberian pakan, jadwal, riwayat
  | 'feed_scheduling'               // jadwal pemberian pakan

  // ── Feed Formula ───────────────────────────────────────────────────────────
  | 'formula_feed'                  // create & manage feed formulas
  | 'formula_analysis_basic'        // PK · TDN · formula weight · estimated cost

  // ── Feed Stock ─────────────────────────────────────────────────────────────
  | 'feed_stock_basic'              // stok pakan management, riwayat stok

  // ── Master Feed ────────────────────────────────────────────────────────────
  | 'master_feed_view'              // view master pakan reference database

  // ── Medicine ───────────────────────────────────────────────────────────────
  | 'medicine'                      // medicine recording, riwayat obat
  | 'medicine_scheduling'           // jadwal pemberian obat

  // ── Master Medicine ────────────────────────────────────────────────────────
  | 'master_medicine_view'          // view master obat & master penyakit reference

  // ── Medicine Stock ─────────────────────────────────────────────────────────
  | 'medicine_stock_basic'          // stok obat management

  // ── Marketplace ────────────────────────────────────────────────────────────
  | 'marketplace'                   // browse, buy, sell, negotiate, chat

  // ── AI Insight ─────────────────────────────────────────────────────────────
  | 'ai_basic'                      // AI insight with daily quota (≤5 per day)
  | 'recording'                     // general data recording across modules

  // ── Reports ────────────────────────────────────────────────────────────────
  | 'reports_basic'                 // basic module reports, read-only

  // ── Notification ───────────────────────────────────────────────────────────
  | 'notification_basic'            // in-app push notifications

  // ── News ───────────────────────────────────────────────────────────────────
  | 'news_view'                     // view published news & articles

  // ── Event ──────────────────────────────────────────────────────────────────
  | 'event_view'                    // browse / discover events (Free forever)

  // ── Public Farm Profile ────────────────────────────────────────────────────
  | 'farm_profile_basic'            // basic public farm profile page

  // ── Global Search ──────────────────────────────────────────────────────────
  | 'search_basic'                  // global search across all modules

  // ── Workspace Types (Service Workspaces) ───────────────────────────────────
  | 'workspace_feed_store'          // feed store workspace type
  | 'workspace_vet'                 // veterinary workspace type
  | 'workspace_transport'           // transport workspace type

  // ── Backup & Restore ───────────────────────────────────────────────────────
  | 'backup_manual'                 // manual snapshot (limit: 1/month)
  | 'restore_basic'                 // restore from available snapshot

  // ── Export ─────────────────────────────────────────────────────────────────
  | 'export_basic'                  // CSV data export (limit: 5/month)

  // ── Monitoring ─────────────────────────────────────────────────────────────
  | 'monitoring_basic'              // basic health indicators & alerts

  // ── Trust & Verification ───────────────────────────────────────────────────
  | 'trust_score'                   // basic trust score display
  | 'verification_self'             // self-declared farm information

  // ═══════════════════════════════════════════════════════════════════════════
  // PRO TIER — requires Pro or Enterprise
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Authentication (Pro) ───────────────────────────────────────────────────
  | 'auth_2fa'                      // two-factor authentication
  | 'auth_sso'                      // OAuth / social login (Google, etc.)

  // ── Account / Workspace (Pro) ──────────────────────────────────────────────
  | 'workspace_limit_extended'      // up to 10 workspaces per user
  | 'workspace_member_limit_extended' // up to 20 members per workspace
  | 'workspace_roles_custom'        // custom role definitions

  // ── Dashboard (Pro) ────────────────────────────────────────────────────────
  | 'dashboard_business_snapshot'   // revenue snapshot, farm score, trend indicators

  // ── Livestock (Pro) ────────────────────────────────────────────────────────
  | 'livestock_ai_analytics'        // AI-powered livestock performance analysis
  | 'weight_ai_prediction'          // AI growth prediction & ADG benchmarking

  // ── Feed (Pro) ─────────────────────────────────────────────────────────────
  | 'feed_stock_alerts'             // low-stock threshold alerts
  | 'ai_feed_optimization'          // AI pakan optimization recommendations
  | 'ai_cost_optimization'          // AI biaya optimization
  | 'feed_comparison'               // compare feed formulas & ingredients
  | 'feed_stock_advanced'           // advanced stok pakan analytics

  // ── Feed Formula (Pro) ─────────────────────────────────────────────────────
  | 'formula_nutrition_complete'    // DM · PK · TDN · SK · LK · Abu · Ca · P · NDF · ADF · NFC · Energy
  | 'ai_formula_recommendation'     // AI formula recommendations
  | 'formula_version_history'       // version history for formula edits

  // ── Master Feed (Pro) ──────────────────────────────────────────────────────
  | 'master_feed_manage'            // add/edit/archive master pakan items

  // ── Medicine (Pro) ─────────────────────────────────────────────────────────
  | 'medicine_ai_analytics'         // AI health trend analysis & recommendations
  | 'medicine_stock_alerts'         // expiry & low-stock alerts for obat

  // ── Marketplace (Pro) ──────────────────────────────────────────────────────
  | 'marketplace_analytics'         // seller analytics: views, conversion, revenue
  | 'marketplace_verified'          // apply for verified seller/farm badge

  // ── AI Insight (Pro) ───────────────────────────────────────────────────────
  | 'ai_unlimited'                  // unlimited AI insight, no daily quota
  | 'ai_performance_analysis'       // AI-powered livestock & feed performance tracking

  // ── Reports (Pro) ──────────────────────────────────────────────────────────
  | 'reports_advanced'              // advanced report builder with filters & grouping
  | 'premium_reports'               // premium pre-built report templates
  | 'reports_export_pdf'            // export any report as PDF
  | 'reports_export_excel'          // export any report as Excel/CSV

  // ── Notification (Pro) ─────────────────────────────────────────────────────
  | 'notification_email'            // email notification delivery
  | 'notification_whatsapp'         // WhatsApp notification delivery

  // ── News (Pro) ─────────────────────────────────────────────────────────────
  | 'news_submit'                   // submit articles/news for review
  | 'news_publish'                  // publish own content after approval

  // ── Event (Pro) ────────────────────────────────────────────────────────────
  | 'event_register'                // register as event participant (Pro: participate)
  | 'event_cancel_registration'     // cancel own event registration
  | 'event_view_registered'         // view list of events the user has registered for
  | 'event_create'                  // create own events
  | 'event_edit'                    // edit own event content & details
  | 'event_cancel'                  // cancel own event
  | 'event_manage_participants'     // manage event participants & check-in
  | 'event_analytics'               // event analytics: registrations, attendance

  // ── Public Farm Profile (Pro) ──────────────────────────────────────────────
  | 'farm_profile_enhanced'         // enhanced profile with media gallery & story
  | 'farm_profile_verified'         // apply for verified farm badge

  // ── Global Search (Pro) ────────────────────────────────────────────────────
  | 'search_advanced'               // advanced search filters, saved searches

  // ── Service Workspace Analytics (Pro) ──────────────────────────────────────
  | 'workspace_feed_store_analytics'
  | 'workspace_vet_analytics'
  | 'workspace_transport_analytics'

  // ── Backup & Restore (Pro) ─────────────────────────────────────────────────
  | 'auto_backup'                   // automatic weekly backup
  | 'restore_point_in_time'         // restore to any available snapshot

  // ── Export (Pro) ───────────────────────────────────────────────────────────
  // (reports_export_pdf and reports_export_excel cover this tier)

  // ── Monitoring (Pro) ───────────────────────────────────────────────────────
  | 'monitoring_advanced'           // advanced health monitoring & custom alert rules

  // ── Trust & Verification (Pro) ─────────────────────────────────────────────
  | 'trust_badge'                   // trust badge on listings & profile
  | 'verification_basic'            // identity & farm basic verification

  // ── API (Pro) ──────────────────────────────────────────────────────────────
  | 'api_basic'                     // read-only REST API access

  // ── Analytics (Pro) ────────────────────────────────────────────────────────
  | 'advanced_analytics'            // advanced cross-module analytics

  // ═══════════════════════════════════════════════════════════════════════════
  // ENTERPRISE TIER — requires Enterprise
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Authentication (Enterprise) ────────────────────────────────────────────
  | 'auth_saml'                     // SAML 2.0 enterprise SSO

  // ── Account / Workspace (Enterprise) ──────────────────────────────────────
  | 'workspace_limit_unlimited'     // unlimited workspaces per user
  | 'workspace_member_limit_unlimited' // unlimited members per workspace
  | 'multi_organization'            // manage multiple organizations / farm groups

  // ── Dashboard (Enterprise) ────────────────────────────────────────────────
  | 'enterprise_dashboard'          // organization-level consolidated dashboard

  // ── Feed (Enterprise) ──────────────────────────────────────────────────────
  | 'feed_stock_auto_reorder'       // automated stock reorder triggers

  // ── Marketplace (Enterprise) ───────────────────────────────────────────────
  | 'marketplace_priority_listing'  // featured/priority listing placement

  // ── AI Insight (Enterprise) ────────────────────────────────────────────────
  | 'ai_organization'               // organization-level AI analytics

  // ── Reports (Enterprise) ───────────────────────────────────────────────────
  | 'reports_scheduled'             // scheduled/automated report delivery

  // ── Notification (Enterprise) ──────────────────────────────────────────────
  | 'notification_custom'           // custom alert rules & escalation workflows

  // ── Event (Enterprise) ─────────────────────────────────────────────────────
  | 'event_organization'            // organization-wide events across workspaces
  | 'event_multi_workspace'         // multi-workspace event management
  | 'event_org_analytics'           // organization-level event analytics & reporting
  | 'event_bulk_participants'       // bulk participant management across org events
  | 'event_org_dashboard'           // organization event dashboard & KPIs

  // ── Public Farm Profile (Enterprise) ──────────────────────────────────────
  | 'farm_profile_premium'          // premium directory listing & featured placement

  // ── Backup (Enterprise) ────────────────────────────────────────────────────
  | 'backup_unlimited'              // unlimited backup history & retention

  // ── Export (Enterprise) ────────────────────────────────────────────────────
  | 'export_unlimited'              // unlimited exports, all formats

  // ── Analytics (Enterprise) ────────────────────────────────────────────────
  | 'organization_analytics'        // organization-level aggregated analytics
  | 'analytics_custom_dashboard'    // fully customizable analytics dashboards

  // ── Monitoring (Enterprise) ────────────────────────────────────────────────
  | 'monitoring_organization'       // organization-wide monitoring & SLA tracking

  // ── Trust & Verification (Enterprise) ─────────────────────────────────────
  | 'trust_verified'                // full verified status with document check
  | 'verification_full'             // complete verification: identity + farm + documents

  // ── API (Enterprise) ───────────────────────────────────────────────────────
  | 'api_integration'               // full read/write API access + webhook support

  // ── Administration (Enterprise) ────────────────────────────────────────────
  | 'advanced_administration'       // fine-grained permission management
  | 'audit_trail'                   // immutable audit log for all changes
  | 'approval_workflow'             // multi-step approval workflows
  | 'dedicated_support'             // dedicated account manager & priority support
  | 'sla'                           // uptime SLA guarantee
  | 'custom_integration'            // custom third-party integrations;

// ─── Data Models ──────────────────────────────────────────────────────────────

// ─── UI Config ────────────────────────────────────────────────────────────────

/** Display configuration for each plan rendered in the subscription UI. */
export interface SubscriptionPlanConfig {
  plan:             WorkspacePlan;
  label:            string;
  description:      string;
  price_label:      string;            // human-readable price string
  price_idr_yearly: number | null;     // 0 = free, null = custom quotation
  duration_label:   string;
  highlight:        boolean;
  badge:            string | null;     // e.g. "POPULER"
  color:            string;
  bg:               string;
  border:           string;
}

/** A single row in the plan comparison table. */
export interface SubscriptionBenefitRow {
  label:      string;
  free:       boolean | string;
  pro:        boolean | string;
  enterprise: boolean | string;
  group?:     string;   // if present, renders a section header before this row
}

// ─── Policy Row ───────────────────────────────────────────────────────────────

/**
 * A single row in the Subscription Feature Policy table.
 * This is the canonical policy record — every gated feature MUST have one.
 *
 * Source of truth: src/data/subscriptionFeaturePolicy.ts
 */
export interface SubscriptionFeaturePolicyRow {
  /** Machine key — must match a FeatureKey value. */
  key:        FeatureKey;
  /** Module name (e.g. 'Livestock', 'Feed Formula'). */
  module:     string;
  /** Human-readable feature name (English). */
  feature:    string;
  /** Free plan access: true = full access, false = no access, string = partial/limited. */
  free:       boolean | string;
  /** Pro plan access. */
  pro:        boolean | string;
  /** Enterprise plan access. */
  enterprise: boolean | string;
  /**
   * Limit descriptor.
   * Examples: 'Daily Limit: 5', 'Monthly Limit: 1', 'Workspace Limit: 3', 'Unlimited'.
   * Use 'Unlimited' when no limit applies.
   */
  limit:      string;
  /** Additional policy notes (enforcement rules, downgrade behavior, etc.). */
  notes:      string;
}
