// ─── Subscription Feature Policy — SUB-002 ────────────────────────────────────
//
// SINGLE SOURCE OF TRUTH for all subscription feature access rules in TernakHub.
//
// RULES:
//  - Every gated feature MUST have exactly one row here.
//  - No module is permitted to define its own subscription rules.
//  - Only System Administrators may change which plan a feature requires.
//  - hasFeature() in workspaceSubscriptionData.ts is the runtime gate — it reads
//    FEATURE_GATE which MUST stay in sync with this policy table.
//  - When adding a new feature: add a FeatureKey to src/types/subscription.ts,
//    add a row here, update FEATURE_GATE + FEATURE_MIN_PLAN in
//    workspaceSubscriptionData.ts.
//  - No payment, billing, invoice, or transaction logic lives here.
//
// UPGRADE POLICY (applies to all rows):
//  - Never hide a locked feature. Always show: feature name, current plan,
//    required plan, benefits, and an Upgrade button.
//
// DOWNGRADE POLICY (applies to all rows):
//  - Never delete user data on downgrade. Premium-only features become
//    Read Only until the workspace upgrades again.
//
// ADMIN POLICY:
//  - Only System Administrators may modify this policy.
//  - Workspace Owners cannot modify subscription rules.
//
// FUTURE COMPATIBILITY:
//  - New modules simply add rows here. No structural changes needed.

import type { FeatureKey, SubscriptionFeaturePolicyRow } from '../types/subscription';

// ─── Convenience aliases ──────────────────────────────────────────────────────

const FREE  = true  as const;
const NO    = false as const;

// ─── Policy Table ─────────────────────────────────────────────────────────────

export const SUBSCRIPTION_FEATURE_POLICY: SubscriptionFeaturePolicyRow[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Authentication
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'auth_basic',
    module:     'Authentication',
    feature:    'Email / Password Sign-In & Sign-Up',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Basic livestock management must never be locked. Authentication is prerequisite infrastructure.',
  },
  {
    key:        'auth_2fa',
    module:     'Authentication',
    feature:    'Two-Factor Authentication (2FA)',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro productivity feature. On downgrade: 2FA is disabled; account falls back to password-only.',
  },
  {
    key:        'auth_sso',
    module:     'Authentication',
    feature:    'OAuth / Social Login (Google, etc.)',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'On downgrade: SSO connections are deactivated; user must log in with email/password.',
  },
  {
    key:        'auth_saml',
    module:     'Authentication',
    feature:    'SAML 2.0 Enterprise SSO',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise organization & integration feature. Custom IdP configuration required.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Account
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'account_management',
    module:     'Account',
    feature:    'Profile Management & Account Settings',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Core account management is always free.',
  },
  {
    key:        'workspace',
    module:     'Account',
    feature:    'Workspace Creation & Management',
    free:       'Up to 3 workspaces',
    pro:        'Up to 10 workspaces',
    enterprise: 'Unlimited',
    limit:      'Workspace Limit: Free=3, Pro=10, Enterprise=Unlimited',
    notes:      'Limit is per user account across all plans. On downgrade: existing workspaces are preserved Read Only if over limit.',
  },
  {
    key:        'workspace_limit_extended',
    module:     'Account',
    feature:    'Extended Workspace Limit (up to 10)',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Workspace Limit: 10',
    notes:      'Unlocks workspace slots 4–10. On downgrade: extra workspaces become Read Only.',
  },
  {
    key:        'workspace_limit_unlimited',
    module:     'Account',
    feature:    'Unlimited Workspaces',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise scalability feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Workspace
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'workspace_member_limit_extended',
    module:     'Workspace',
    feature:    'Extended Member Limit (up to 20 per workspace)',
    free:       'Up to 5 members',
    pro:        'Up to 20 members',
    enterprise: 'Unlimited',
    limit:      'Workspace Limit: Free=5 members, Pro=20 members, Enterprise=Unlimited',
    notes:      'On downgrade: members over limit lose access until workspace is upgraded.',
  },
  {
    key:        'workspace_member_limit_unlimited',
    module:     'Workspace',
    feature:    'Unlimited Workspace Members',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise scalability feature.',
  },
  {
    key:        'workspace_roles_custom',
    module:     'Workspace',
    feature:    'Custom Role Definitions',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Free plan uses fixed Owner/Admin/Member/Viewer roles. On downgrade: custom roles revert to nearest standard role.',
  },
  {
    key:        'multi_organization',
    module:     'Workspace',
    feature:    'Multi-Organization Management',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise organization feature. Manage multiple farm groups under one organization.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Dashboard
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'dashboard_basic',
    module:     'Dashboard',
    feature:    'Basic Dashboard (Activity, Quick Actions, AI Insight limited)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Core overview is always available. AI Insight on Free is subject to daily quota.',
  },
  {
    key:        'dashboard_business_snapshot',
    module:     'Dashboard',
    feature:    'Business Snapshot (Revenue, Farm Score, Trends)',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro productivity feature. On downgrade: Business Snapshot widget is hidden.',
  },
  {
    key:        'enterprise_dashboard',
    module:     'Dashboard',
    feature:    'Enterprise Organization Dashboard',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Cross-workspace, organization-level consolidated view.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Livestock
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'livestock',
    module:     'Livestock',
    feature:    'Livestock CRUD (add, edit, archive, profile, pedigree)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Basic livestock management must NEVER be locked per subscription principles.',
  },
  {
    key:        'livestock_batch',
    module:     'Livestock',
    feature:    'Batch Management (create, operate, history)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Batch is core livestock productivity. Always free.',
  },
  {
    key:        'livestock_ai_analytics',
    module:     'Livestock',
    feature:    'AI Livestock Performance Analysis',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'AI Usage Limit: Unlimited on Pro/Enterprise',
    notes:      'Pro AI productivity feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Weight
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'weight_recording',
    module:     'Weight',
    feature:    'Weight Recording (catat bobot, ADG, history)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Core livestock data recording. Always free.',
  },
  {
    key:        'weight_ai_prediction',
    module:     'Weight',
    feature:    'AI Growth Prediction & ADG Benchmarking',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'AI Usage Limit: Unlimited on Pro/Enterprise',
    notes:      'Pro AI automation feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Feed
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'feed',
    module:     'Feed',
    feature:    'Feed Management (pemberian pakan, riwayat)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Core livestock management. Always free.',
  },
  {
    key:        'feed_scheduling',
    module:     'Feed',
    feature:    'Feed Scheduling (jadwal pemberian pakan)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Core feed management feature. Always free.',
  },
  {
    key:        'ai_feed_optimization',
    module:     'Feed',
    feature:    'AI Feed Optimization Recommendations',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'AI Usage Limit: Unlimited on Pro/Enterprise',
    notes:      'Pro AI productivity feature.',
  },
  {
    key:        'ai_cost_optimization',
    module:     'Feed',
    feature:    'AI Cost Optimization',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'AI Usage Limit: Unlimited on Pro/Enterprise',
    notes:      'Pro AI productivity feature.',
  },
  {
    key:        'feed_comparison',
    module:     'Feed',
    feature:    'Feed & Formula Comparison',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro productivity feature.',
  },
  {
    key:        'feed_stock_advanced',
    module:     'Feed',
    feature:    'Advanced Feed Stock Analytics',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro analytics feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Feed Formula
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'formula_feed',
    module:     'Feed Formula',
    feature:    'Feed Formula (create, edit, produce)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Feed Formula is available on Free per formula policy. Basic analysis only.',
  },
  {
    key:        'formula_analysis_basic',
    module:     'Feed Formula',
    feature:    'Basic Formula Analysis (PK · TDN · weight · estimated cost)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Free tier formula analysis. Limited to 4 nutritional indicators.',
  },
  {
    key:        'formula_nutrition_complete',
    module:     'Feed Formula',
    feature:    'Complete Nutrition Analysis (DM · PK · TDN · SK · LK · Abu · Ca · P · NDF · ADF · NFC · Energy)',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro formula policy: unlocks complete nutrition analysis. On downgrade: results are Read Only.',
  },
  {
    key:        'ai_formula_recommendation',
    module:     'Feed Formula',
    feature:    'AI Formula Recommendations',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'AI Usage Limit: Unlimited on Pro/Enterprise',
    notes:      'Pro AI formula policy feature.',
  },
  {
    key:        'formula_version_history',
    module:     'Feed Formula',
    feature:    'Formula Version History',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro productivity feature. On downgrade: history is Read Only.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Feed Stock
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'feed_stock_basic',
    module:     'Feed Stock',
    feature:    'Feed Stock Management (stok pakan, riwayat stok)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Core livestock management. Always free.',
  },
  {
    key:        'feed_stock_alerts',
    module:     'Feed Stock',
    feature:    'Low-Stock Threshold Alerts',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro automation feature. On downgrade: alerts are disabled.',
  },
  {
    key:        'feed_stock_auto_reorder',
    module:     'Feed Stock',
    feature:    'Automated Stock Reorder Triggers',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise automation feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Master Feed
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'master_feed_view',
    module:     'Master Feed',
    feature:    'View Master Feed Reference Database',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Read access to master pakan reference is always free.',
  },
  {
    key:        'master_feed_manage',
    module:     'Master Feed',
    feature:    'Add / Edit / Archive Master Feed Items',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro feature for active feed catalog management.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Medicine
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'medicine',
    module:     'Medicine',
    feature:    'Medicine Recording (riwayat obat, health history)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Core livestock management. Always free.',
  },
  {
    key:        'medicine_scheduling',
    module:     'Medicine',
    feature:    'Medicine Scheduling (jadwal pemberian obat)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Core livestock management. Always free.',
  },
  {
    key:        'medicine_ai_analytics',
    module:     'Medicine',
    feature:    'AI Health Trend Analysis & Recommendations',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'AI Usage Limit: Unlimited on Pro/Enterprise',
    notes:      'Pro AI productivity feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Master Medicine
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'master_medicine_view',
    module:     'Master Medicine',
    feature:    'View Master Obat & Master Penyakit Reference',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Read access to medicine reference is always free.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Medicine Stock
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'medicine_stock_basic',
    module:     'Medicine Stock',
    feature:    'Medicine Stock Management (stok obat, penyesuaian)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Core livestock management. Always free.',
  },
  {
    key:        'medicine_stock_alerts',
    module:     'Medicine Stock',
    feature:    'Expiry & Low-Stock Alerts for Medicine',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro automation feature. On downgrade: alerts are disabled.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Marketplace
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'marketplace',
    module:     'Marketplace',
    feature:    'Marketplace (browse, buy, sell, negotiate, chat)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Core marketplace access is always free.',
  },
  {
    key:        'marketplace_analytics',
    module:     'Marketplace',
    feature:    'Seller Analytics (views, conversion rate, revenue)',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro analytics feature. On downgrade: analytics become Read Only.',
  },
  {
    key:        'marketplace_verified',
    module:     'Marketplace',
    feature:    'Apply for Verified Seller / Farm Badge',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro trust feature. Badge remains displayed on downgrade but cannot be renewed.',
  },
  {
    key:        'marketplace_priority_listing',
    module:     'Marketplace',
    feature:    'Featured / Priority Listing Placement',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise scalability feature for high-volume sellers.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: AI Insight
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'ai_basic',
    module:     'AI Insight',
    feature:    'AI Insight (basic, daily quota)',
    free:       'Limited — 5 insights/day',
    pro:        FREE,
    enterprise: FREE,
    limit:      'Daily Limit: 5 on Free; Unlimited on Pro/Enterprise',
    notes:      'Premium sells AI. Free tier has daily quota. On Free: AI insight cards show quota status.',
  },
  {
    key:        'ai_unlimited',
    module:     'AI Insight',
    feature:    'Unlimited AI Insight (no daily quota)',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'AI Usage Limit: Unlimited',
    notes:      'Pro AI productivity feature. On downgrade: quota enforcement resumes.',
  },
  {
    key:        'ai_performance_analysis',
    module:     'AI Insight',
    feature:    'AI-Powered Performance Tracking',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'AI Usage Limit: Unlimited on Pro/Enterprise',
    notes:      'Pro AI productivity feature.',
  },
  {
    key:        'ai_organization',
    module:     'AI Insight',
    feature:    'Organization-Level AI Analytics',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'AI Usage Limit: Unlimited',
    notes:      'Enterprise AI feature. Aggregates AI analysis across all workspaces in an organization.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Reports
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'reports_basic',
    module:     'Reports',
    feature:    'Basic Module Reports (read-only)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Basic reporting is always free.',
  },
  {
    key:        'reports_advanced',
    module:     'Reports',
    feature:    'Advanced Report Builder (custom filters, grouping)',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro analytics feature.',
  },
  {
    key:        'premium_reports',
    module:     'Reports',
    feature:    'Premium Pre-Built Report Templates',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro productivity feature.',
  },
  {
    key:        'reports_export_pdf',
    module:     'Reports',
    feature:    'Export Reports as PDF',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Export Limit: Unlimited on Pro/Enterprise',
    notes:      'Pro export feature. On downgrade: export buttons are locked; existing exports are preserved.',
  },
  {
    key:        'reports_export_excel',
    module:     'Reports',
    feature:    'Export Reports as Excel / CSV',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Export Limit: Unlimited on Pro/Enterprise',
    notes:      'Pro export feature. On downgrade: export buttons are locked; existing exports are preserved.',
  },
  {
    key:        'reports_scheduled',
    module:     'Reports',
    feature:    'Scheduled / Automated Report Delivery',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise automation feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Notification
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'notification_basic',
    module:     'Notification',
    feature:    'In-App Push Notifications',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Core notification is always free.',
  },
  {
    key:        'notification_email',
    module:     'Notification',
    feature:    'Email Notification Delivery',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro productivity feature.',
  },
  {
    key:        'notification_whatsapp',
    module:     'Notification',
    feature:    'WhatsApp Notification Delivery',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro productivity feature.',
  },
  {
    key:        'notification_custom',
    module:     'Notification',
    feature:    'Custom Alert Rules & Escalation Workflows',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise administration feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: News
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'news_view',
    module:     'News',
    feature:    'View Published News & Articles',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'News viewing is always free.',
  },
  {
    key:        'news_submit',
    module:     'News',
    feature:    'Submit Articles / News for Review',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro content feature.',
  },
  {
    key:        'news_publish',
    module:     'News',
    feature:    'Publish Own Content (after admin approval)',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro content feature. Admin approval always required regardless of plan.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Event
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'event_view',
    module:     'Event',
    feature:    'Browse Events',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Event viewing is always free per event policy.',
  },
  {
    key:        'event_register',
    module:     'Event',
    feature:    'Register as Event Participant',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro participation feature. Free users discover events; Pro users participate. On downgrade: cannot register for new events; existing registrations are preserved.',
  },
  {
    key:        'event_cancel_registration',
    module:     'Event',
    feature:    'Cancel Own Event Registration',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro participation feature. Must have registered first (event_register). On downgrade: cannot cancel via platform; must contact event organizer directly.',
  },
  {
    key:        'event_view_registered',
    module:     'Event',
    feature:    'View Own Registered Events List',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro participation feature. Shows history and upcoming registrations for the user.',
  },
  {
    key:        'event_create',
    module:     'Event',
    feature:    'Create Own Events',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro event management feature per event policy.',
  },
  {
    key:        'event_edit',
    module:     'Event',
    feature:    'Edit Own Event Content & Details',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro event management feature. Can only edit events the user created. On downgrade: existing events become Read Only.',
  },
  {
    key:        'event_cancel',
    module:     'Event',
    feature:    'Cancel Own Event',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro event management feature. Can only cancel events the user created.',
  },
  {
    key:        'event_manage_participants',
    module:     'Event',
    feature:    'Manage Event Participants & Check-In',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro event management feature per event policy.',
  },
  {
    key:        'event_analytics',
    module:     'Event',
    feature:    'Event Analytics (registrations, attendance, conversion)',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro analytics feature per event policy.',
  },
  {
    key:        'event_organization',
    module:     'Event',
    feature:    'Organization-Wide Events (across workspaces)',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise organization feature. Enables creating and managing events that span multiple workspaces within the same organization.',
  },
  {
    key:        'event_multi_workspace',
    module:     'Event',
    feature:    'Multi-Workspace Event Management',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise organization feature. Manage participant lists, check-ins, and logistics across multiple workspaces in one unified view.',
  },
  {
    key:        'event_org_analytics',
    module:     'Event',
    feature:    'Organization-Level Event Analytics & Reporting',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise analytics feature. Aggregates event KPIs (registrations, attendance, conversion, revenue) across all workspaces in the organization.',
  },
  {
    key:        'event_bulk_participants',
    module:     'Event',
    feature:    'Bulk Participant Management (across org events)',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise feature. Bulk import/export/update participants across organization events. Includes batch check-in and mass communication.',
  },
  {
    key:        'event_org_dashboard',
    module:     'Event',
    feature:    'Organization Event Dashboard & KPIs',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise feature. Consolidated event dashboard showing all org events, their status, attendance rates, and upcoming schedule in one view.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Public Farm Profile
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'farm_profile_basic',
    module:     'Public Farm Profile',
    feature:    'Basic Public Farm Profile Page',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Basic public profile is always free.',
  },
  {
    key:        'farm_profile_enhanced',
    module:     'Public Farm Profile',
    feature:    'Enhanced Profile (media gallery, farm story, contact)',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Storage Limit: 1 GB on Pro; Unlimited on Enterprise',
    notes:      'Pro productivity feature. On downgrade: enhanced content is Read Only.',
  },
  {
    key:        'farm_profile_verified',
    module:     'Public Farm Profile',
    feature:    'Apply for Verified Farm Badge',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro trust feature. Badge remains on downgrade but cannot be renewed.',
  },
  {
    key:        'farm_profile_premium',
    module:     'Public Farm Profile',
    feature:    'Premium Directory Listing & Featured Placement',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise scalability feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Global Search
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'search_basic',
    module:     'Global Search',
    feature:    'Global Search Across All Modules',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Basic search is always free.',
  },
  {
    key:        'search_advanced',
    module:     'Global Search',
    feature:    'Advanced Search Filters & Saved Searches',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro productivity feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Feed Store Workspace
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'workspace_feed_store',
    module:     'Feed Store Workspace',
    feature:    'Feed Store Workspace Type (access & basic features)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Workspace type access is always free.',
  },
  {
    key:        'workspace_feed_store_analytics',
    module:     'Feed Store Workspace',
    feature:    'Feed Store Analytics',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro analytics feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Veterinary Workspace
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'workspace_vet',
    module:     'Veterinary Workspace',
    feature:    'Veterinary Workspace Type (access & basic features)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Workspace type access is always free.',
  },
  {
    key:        'workspace_vet_analytics',
    module:     'Veterinary Workspace',
    feature:    'Veterinary Workspace Analytics',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro analytics feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Transport Workspace
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'workspace_transport',
    module:     'Transport Workspace',
    feature:    'Transport Workspace Type (access & basic features)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Workspace type access is always free.',
  },
  {
    key:        'workspace_transport_analytics',
    module:     'Transport Workspace',
    feature:    'Transport Workspace Analytics',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro analytics feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Backup
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'backup_manual',
    module:     'Backup',
    feature:    'Manual Backup Snapshot',
    free:       'Monthly — 1 snapshot',
    pro:        FREE,
    enterprise: FREE,
    limit:      'Monthly Limit: 1 on Free; Unlimited on Pro/Enterprise',
    notes:      'On downgrade: existing backups are retained and remain restorable.',
  },
  {
    key:        'auto_backup',
    module:     'Backup',
    feature:    'Automatic Weekly Backup',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro automation feature. On downgrade: auto-backup is disabled; existing snapshots preserved.',
  },
  {
    key:        'backup_unlimited',
    module:     'Backup',
    feature:    'Unlimited Backup History & Retention',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise scalability feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Restore
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'restore_basic',
    module:     'Restore',
    feature:    'Restore from Available Snapshot',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Basic restore is always available. Data is never deleted on downgrade.',
  },
  {
    key:        'restore_point_in_time',
    module:     'Restore',
    feature:    'Point-in-Time Restore (any available snapshot)',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro productivity feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Export
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'export_basic',
    module:     'Export',
    feature:    'Basic Data Export (CSV)',
    free:       'Monthly — 5 exports',
    pro:        FREE,
    enterprise: FREE,
    limit:      'Monthly Limit: 5 on Free; Unlimited on Pro/Enterprise',
    notes:      'On downgrade: export quota is enforced; existing exported files are unaffected.',
  },
  {
    key:        'export_unlimited',
    module:     'Export',
    feature:    'Unlimited Exports (all formats)',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise scalability feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Analytics
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'advanced_analytics',
    module:     'Analytics',
    feature:    'Advanced Cross-Module Analytics',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro analytics feature. On downgrade: analytics become Read Only.',
  },
  {
    key:        'organization_analytics',
    module:     'Analytics',
    feature:    'Organization-Level Aggregated Analytics',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise analytics feature. Cross-workspace aggregation.',
  },
  {
    key:        'analytics_custom_dashboard',
    module:     'Analytics',
    feature:    'Fully Customizable Analytics Dashboards',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise analytics feature. On downgrade: custom dashboards are Read Only.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Monitoring
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'monitoring_basic',
    module:     'Monitoring',
    feature:    'Basic Health Indicators & System Alerts',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Core monitoring is always free.',
  },
  {
    key:        'monitoring_advanced',
    module:     'Monitoring',
    feature:    'Advanced Monitoring & Custom Alert Rules',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro productivity feature. On downgrade: custom rules are disabled.',
  },
  {
    key:        'monitoring_organization',
    module:     'Monitoring',
    feature:    'Organization-Wide Monitoring & SLA Tracking',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise monitoring feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Trust
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'trust_score',
    module:     'Trust',
    feature:    'Basic Trust Score Display',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Basic trust is always free.',
  },
  {
    key:        'trust_badge',
    module:     'Trust',
    feature:    'Trust Badge on Listings & Profile',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro trust feature. Badge remains on downgrade but cannot be upgraded.',
  },
  {
    key:        'trust_verified',
    module:     'Trust',
    feature:    'Full Verified Status with Document Check',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise trust feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Verification
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'verification_self',
    module:     'Verification',
    feature:    'Self-Declared Farm Information',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Basic self-declaration is always free.',
  },
  {
    key:        'verification_basic',
    module:     'Verification',
    feature:    'Basic Identity & Farm Verification',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Pro trust feature.',
  },
  {
    key:        'verification_full',
    module:     'Verification',
    feature:    'Full Verification (identity + farm + documents)',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise trust feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: API
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'api_basic',
    module:     'API',
    feature:    'Read-Only REST API Access',
    free:       NO,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Monthly Limit: 10,000 requests on Pro; Unlimited on Enterprise',
    notes:      'Pro integration feature. On downgrade: API keys are revoked.',
  },
  {
    key:        'api_integration',
    module:     'API',
    feature:    'Full Read/Write API Access + Webhook Support',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise integration feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE: Admin
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN POLICY:
  //  - Only System Administrators may modify the Subscription Feature Policy.
  //  - Workspace Owners cannot modify subscription rules.
  //  - The following features are enterprise administration features for
  //    workspace-level administration controls, distinct from System Admin.
  {
    key:        'advanced_administration',
    module:     'Admin',
    feature:    'Fine-Grained Permission Management',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise administration feature.',
  },
  {
    key:        'audit_trail',
    module:     'Admin',
    feature:    'Immutable Audit Log for All Changes',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise administration feature. Log is append-only and cannot be deleted.',
  },
  {
    key:        'approval_workflow',
    module:     'Admin',
    feature:    'Multi-Step Approval Workflows',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise administration feature.',
  },
  {
    key:        'dedicated_support',
    module:     'Admin',
    feature:    'Dedicated Account Manager & Priority Support',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise administration feature.',
  },
  {
    key:        'sla',
    module:     'Admin',
    feature:    'Uptime SLA Guarantee',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise administration feature. SLA terms defined in service contract.',
  },
  {
    key:        'custom_integration',
    module:     'Admin',
    feature:    'Custom Third-Party Integrations',
    free:       NO,
    pro:        NO,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Enterprise integration feature.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERAL / CROSS-MODULE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key:        'recording',
    module:     'General',
    feature:    'General Data Recording (across all core modules)',
    free:       FREE,
    pro:        FREE,
    enterprise: FREE,
    limit:      'Unlimited',
    notes:      'Core data recording is always free per subscription principles.',
  },
];

// ─── Policy Lookup Helpers ────────────────────────────────────────────────────

/**
 * Returns the policy row for a given FeatureKey.
 * Returns undefined if the key is not registered (indicates a bug — add the row).
 */
export function getPolicyRow(key: FeatureKey): SubscriptionFeaturePolicyRow | undefined {
  return SUBSCRIPTION_FEATURE_POLICY.find((r) => r.key === key);
}

/**
 * Returns all policy rows for a given module name.
 */
export function getPolicyByModule(module: string): SubscriptionFeaturePolicyRow[] {
  return SUBSCRIPTION_FEATURE_POLICY.filter((r) => r.module === module);
}

/**
 * Returns a deduplicated sorted list of all module names in the policy.
 */
export function getPolicyModules(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const row of SUBSCRIPTION_FEATURE_POLICY) {
    if (!seen.has(row.module)) {
      seen.add(row.module);
      result.push(row.module);
    }
  }
  return result;
}

/**
 * Returns all features available on a given plan.
 * A feature is "available" when its plan cell is `true` or a non-empty string.
 */
export function getFeaturesForPlan(
  plan: 'Free' | 'Pro' | 'Enterprise',
): SubscriptionFeaturePolicyRow[] {
  return SUBSCRIPTION_FEATURE_POLICY.filter((r) => {
    const val = r[plan.toLowerCase() as 'free' | 'pro' | 'enterprise'];
    return val === true || (typeof val === 'string' && val.length > 0);
  });
}
