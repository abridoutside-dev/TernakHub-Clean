// ─── Admin Control Plane Data — ADMIN-ARCH-003 / ADMIN-SYNC-002 ─────────────
// Defines every domain's Control Center: widgets, health, sync status,
// statistics, blockers, and last-sync timestamps.
// ADMIN-SYNC-002: BLOCKED_MODULES_PANEL is now auto-computed from widget
// syncStatus (blocked | dummy | not_implemented). No manual entries.

import type { SyncStatus, ModuleHealth } from './adminNavData';

// ─── Widget Status ────────────────────────────────────────────────────────────

export interface WidgetStatus {
  /** Health placeholder — not yet wired to monitoring */
  health: ModuleHealth;
  /** Sync status placeholder */
  syncStatus: SyncStatus;
  /** Statistics placeholder — all null until backend connected */
  statistics: Record<string, number | string | null>;
  /** Blocker placeholder — null when no known blocker */
  blocker: { reason: string; blockedSince: string | null } | null;
  /** ISO date string of last successful sync — null until connected */
  lastSync: string | null;
}

// ─── Domain Widget ────────────────────────────────────────────────────────────

export interface DomainWidget {
  key: string;
  label: string;
  icon: string;
  status: WidgetStatus;
}

// ─── Domain Control Center ────────────────────────────────────────────────────

export interface DomainControlCenter {
  domainKey: string;     // matches AdminNavDomain.key
  label: string;
  icon: string;
  description: string;
  primaryPath: string;   // main nav path for "Open" button
  widgets: DomainWidget[];
}

// ─── Blocked Module Record (dashboard panel) ──────────────────────────────────

/**
 * Extended blocked-module record for the permanent dashboard panel.
 * Richer than BlockedModuleEntry (sidebar) — includes priority, owner,
 * expected dependency, and blocked-since.
 */
export interface BlockedModuleRecord {
  key: string;
  label: string;
  domain: string;
  reason: string;
  blockedSince: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  owner: string | null;
  expectedDependency: string | null;
}

// ─── Widget status helpers ────────────────────────────────────────────────────

// ISO date when ADMIN-SYNC-002 was applied — used as lastSync for verified LIVE widgets.
const SYNC_DATE = '2026-08-02T00:00:00.000Z';

/** Not yet implemented — no data source wired. */
const NI: WidgetStatus = {
  health: 'unknown',
  syncStatus: 'not_implemented',
  statistics: {},
  blocker: null,
  lastSync: null,
};

/** In-memory / placeholder data — not yet synced to Supabase production. */
const DUM: WidgetStatus = {
  health: 'unknown',
  syncStatus: 'dummy',
  statistics: {},
  blocker: null,
  lastSync: null,
};

/** Live — connected to real Supabase production data. */
const LIVE: WidgetStatus = {
  health: 'healthy',
  syncStatus: 'synced',
  statistics: {},
  blocker: null,
  lastSync: SYNC_DATE,
};

/** Build a DomainWidget with a given status (defaults to NI). */
function w(key: string, label: string, icon: string, status: WidgetStatus = NI): DomainWidget {
  return { key, label, icon, status };
}

// ─── Domain Control Centers ───────────────────────────────────────────────────

export const DOMAIN_CONTROL_CENTERS: DomainControlCenter[] = [

  // ── 1. Platform Overview ───────────────────────────────────────────────────
  // ADMIN-SYNC-002: po-health = live DB ping; po-stats = live Supabase counts;
  // po-quick = all 10 routes implemented; po-activity/po-search/po-alerts = NI.
  {
    domainKey: 'domain-overview',
    label: 'Platform Overview',
    icon: '📊',
    description: 'Platform-wide health, global statistics, and activity at a glance.',
    primaryPath: '/admin',
    widgets: [
      w('po-health',   'Platform Health',   '❤️', LIVE),
      w('po-stats',    'Global Statistics', '📈', LIVE),
      w('po-quick',    'Quick Actions',     '⚡', LIVE),
      w('po-activity', 'Recent Activities', '📋'),
      w('po-search',   'Global Search',     '🔍'),
      w('po-alerts',   'Platform Alerts',   '🚨'),
    ],
  },

  // ── 2. User & Workspace ────────────────────────────────────────────────────
  {
    domainKey: 'domain-user-workspace',
    label: 'User & Workspace',
    icon: '👥',
    description: 'User accounts, workspaces, subscriptions, and verification status.',
    primaryPath: '/admin/users',
    widgets: [
      w('uw-workspace',     'Workspace Summary',     '🏢', LIVE),
      w('uw-users',         'Users Summary',         '👤', LIVE),
      w('uw-verification',  'Verification Summary',  '✅', LIVE),
      w('uw-subscription',  'Subscription Summary',  '⭐', LIVE),
      w('uw-blocked',       'Blocked Workspaces',    '🚫', LIVE),
      w('uw-pending',       'Pending Requests',      '⏳', LIVE),
    ],
  },

  // ── 3. Workspace Farm ──────────────────────────────────────────────────────
  // ADMIN-SYNC-004: farm-summary, farm-livestock, farm-batch, farm-bobot,
  // farm-feed, farm-master-pakan, farm-formula, farm-medicine, farm-health,
  // farm-repro, farm-mutasi all wired to live Supabase tables.
  // farm-master-obat / farm-ai = blocked (no backend table).
  {
    domainKey: 'domain-farm',
    label: 'Workspace Farm',
    icon: '🐄',
    description: 'Cross-workspace livestock, feed, medicine, health, and AI insights.',
    primaryPath: '/admin/farm/dashboard',
    widgets: [
      w('farm-summary',       'Farm Dashboard',         '🐄', LIVE),
      w('farm-livestock',     'Livestock Summary',      '🐮', LIVE),
      w('farm-batch',         'Batch Summary',          '📦', LIVE),
      w('farm-bobot',         'Catat Bobot Summary',    '⚖️', LIVE),
      w('farm-feed',          'Stok Pakan Summary',     '🌾', LIVE),
      w('farm-master-pakan',  'Master Pakan',           '📚', LIVE),
      w('farm-formula',       'Formula Pakan',          '🧪', LIVE),
      w('farm-medicine',      'Stok Obat Summary',      '💊', LIVE),
      w('farm-health',        'Kesehatan Hewan',        '🩺', LIVE),
      w('farm-repro',         'Reproduksi',             '🔬', LIVE),
      w('farm-mutasi',        'Mutasi / Transfer',      '🔀', LIVE),
      w('farm-master-obat',   'Master Obat',            '📋', {
        health: 'unknown', syncStatus: 'not_implemented', statistics: {},
        blocker: { reason: 'Tidak ada tabel master_obat_catalog di Supabase; perlu tabel baru untuk master obat platform.', blockedSince: '2026-08-03' },
        lastSync: null,
      }),
      w('farm-ai',            'AI Insight Farm',        '🤖', {
        health: 'unknown', syncStatus: 'not_implemented', statistics: {},
        blocker: { reason: 'Belum ada backend AI/ML untuk farm insight; membutuhkan integrasi AI engine.', blockedSince: '2026-08-03' },
        lastSync: null,
      }),
    ],
  },

  // ── 4. Workspace Feed Store ────────────────────────────────────────────────
  {
    domainKey: 'domain-feed-store',
    label: 'Workspace Feed Store',
    icon: '🌾',
    description: 'Feed store products, inventory, purchases, sales, and transactions.',
    primaryPath: '/admin/feed',
    widgets: [
      w('fs-products',     'Products Summary',     '📦', DUM),
      w('fs-inventory',    'Inventory Summary',    '🏪'),
      w('fs-purchase',     'Purchase Summary',     '🛒'),
      w('fs-sales',        'Sales Summary',        '💰'),
      w('fs-transactions', 'Transactions Summary', '💳'),
      w('fs-ai',           'AI Summary',           '🤖'),
    ],
  },

  // ── 5. Workspace Drug Store ────────────────────────────────────────────────
  {
    domainKey: 'domain-drug-store',
    label: 'Workspace Drug Store',
    icon: '💊',
    description: 'Drug store products, inventory, purchases, sales, and transactions.',
    primaryPath: '/admin/medicine',
    widgets: [
      w('ds-products',     'Products Summary',     '📦', DUM),
      w('ds-inventory',    'Inventory Summary',    '🏪'),
      w('ds-purchase',     'Purchase Summary',     '🛒'),
      w('ds-sales',        'Sales Summary',        '💰'),
      w('ds-transactions', 'Transactions Summary', '💳'),
      w('ds-ai',           'AI Summary',           '🤖'),
    ],
  },

  // ── 6. Workspace Veterinary ────────────────────────────────────────────────
  {
    domainKey: 'domain-veterinary',
    label: 'Workspace Veterinary',
    icon: '🩺',
    description: 'Veterinary appointments, examinations, treatments, and records.',
    primaryPath: '/admin/veterinary/dashboard',
    widgets: [
      w('vet-appointment',    'Appointment Summary',    '📅'),
      w('vet-medical-record', 'Medical Record Summary', '📋'),
      w('vet-treatment',      'Treatment Summary',      '💉'),
      w('vet-prescription',   'Prescription Summary',   '📝'),
      w('vet-reports',        'Reports Summary',        '📊'),
      w('vet-ai',             'AI Summary',             '🤖'),
    ],
  },

  // ── 7. Workspace Transport ─────────────────────────────────────────────────
  {
    domainKey: 'domain-transport',
    label: 'Workspace Transport',
    icon: '🚛',
    description: 'Transport vehicles, drivers, deliveries, routes, and schedules.',
    primaryPath: '/admin/transport/dashboard',
    widgets: [
      w('trans-vehicle',   'Vehicle Summary',   '🚚'),
      w('trans-driver',    'Driver Summary',    '👷'),
      w('trans-delivery',  'Delivery Summary',  '📦'),
      w('trans-schedule',  'Schedule Summary',  '📅'),
      w('trans-route',     'Route Summary',     '🗺️'),
      w('trans-ai',        'AI Summary',        '🤖'),
    ],
  },

  // ── 8. Marketplace & Commerce ─────────────────────────────────────────────
  {
    domainKey: 'domain-marketplace',
    label: 'Marketplace & Commerce',
    icon: '🛒',
    description: 'Listings, escrow, chat, quotations, deal sheets, and analytics.',
    primaryPath: '/admin/marketplace',
    widgets: [
      w('mp-summary',    'Marketplace Summary',    '🛒', DUM),
      w('mp-listings',   'Listings',               '📦', DUM),
      w('mp-escrow',     'Escrow',                 '🔐', DUM),
      w('mp-quotation',  'Quotation',              '📄'),
      w('mp-deal',       'Deal Sheet',             '🤝'),
      w('mp-analytics',  'Marketplace Analytics',  '📈'),
      w('mp-alerts',     'Marketplace Alerts',     '🚨'),
    ],
  },

  // ── 9. Platform Services ───────────────────────────────────────────────────
  {
    domainKey: 'domain-platform-services',
    label: 'Platform Services',
    icon: '⚡',
    description: 'News, notifications, publications, RSS feeds, and AI global service.',
    primaryPath: '/admin/notifications',
    widgets: [
      w('ps-news',          'News Summary',         '📰', DUM),
      w('ps-notification',  'Notification Summary', '🔔', DUM),
      w('ps-publication',   'Publication Summary',  '📤'),
      w('ps-rss',           'RSS Summary',          '📡'),
      w('ps-ai-global',     'AI Global Summary',    '🤖'),
    ],
  },

  // ── 10. Master Data ────────────────────────────────────────────────────────
  {
    domainKey: 'domain-master-data',
    label: 'Master Data',
    icon: '🗂️',
    description: 'Reference data integrity, duplicates, broken references, and approvals.',
    primaryPath: '/admin/data-master',
    widgets: [
      w('md-stats',      'Reference Statistics', '📊', DUM),
      w('md-integrity',  'Reference Integrity',  '🔍'),
      w('md-duplicate',  'Duplicate Detection',  '🔁'),
      w('md-broken',     'Broken Reference',     '🔗'),
      w('md-pending',    'Pending Approval',     '⏳'),
    ],
  },

  // ── 11. Platform Configuration ─────────────────────────────────────────────
  {
    domainKey: 'domain-config',
    label: 'Platform Configuration',
    icon: '🔧',
    description: 'Security, authentication, authorization, feature flags, and rules.',
    primaryPath: '/admin/settings',
    widgets: [
      w('cfg-status',      'Configuration Status',  '⚙️'),
      w('cfg-security',    'Security Status',       '🔒'),
      w('cfg-storage',     'Storage Status',        '🗄️'),
      w('cfg-auth-n',      'Authentication Status', '🔐'),
      w('cfg-auth-z',      'Authorization Status',  '🔑'),
      w('cfg-flags',       'Feature Flags',         '🚩'),
      w('cfg-ai',          'AI Configuration',      '🤖'),
      w('cfg-mp-rules',    'Marketplace Rules',     '🛒'),
      w('cfg-sub-rules',   'Subscription Rules',    '⭐'),
    ],
  },

  // ── 12. Monitoring ─────────────────────────────────────────────────────────
  {
    domainKey: 'domain-monitoring',
    label: 'Monitoring',
    icon: '📡',
    description: 'Database, API, storage, AI, queue, scheduler, workspace, and marketplace health.',
    primaryPath: '/admin/monitoring',
    widgets: [
      w('mon-db',          'Database Health',    '🗄️', DUM),
      w('mon-api',         'API Health',         '🔌'),
      w('mon-storage',     'Storage Health',     '💾'),
      w('mon-ai',          'AI Engine Health',   '🤖'),
      w('mon-queue',       'Queue Health',       '📬'),
      w('mon-scheduler',   'Scheduler Health',   '⏰'),
      w('mon-workspace',   'Workspace Health',   '🏢'),
      w('mon-marketplace', 'Marketplace Health', '🛒'),
    ],
  },

  // ── 13. Audit & Trust ─────────────────────────────────────────────────────
  {
    domainKey: 'domain-audit-trust',
    label: 'Audit & Trust',
    icon: '🛡️',
    description: 'Audit trail, verification queues, trust, logs, backups, and permissions.',
    primaryPath: '/admin/trust',
    widgets: [
      w('at-audit',       'Audit Summary',       '📜'),
      w('at-verification','Verification Queue',  '✅', DUM),
      w('at-trust',       'Trust Queue',         '🛡️', DUM),
      w('at-logs',        'Activity Logs',       '📋'),
      w('at-restore',     'Restore History',     '♻️'),
      w('at-backup',      'Backup History',      '💾'),
      w('at-perm-audit',  'Permission Audit',    '🔑'),
    ],
  },

  // ── 14. Developer ─────────────────────────────────────────────────────────
  {
    domainKey: 'domain-developer',
    label: 'Developer',
    icon: '🛠️',
    description: 'Migrations, database tooling, logs, environment, queues, and jobs.',
    primaryPath: '/admin/developer/migration',
    widgets: [
      w('dev-migration', 'Migration',       '🔄'),
      w('dev-database',  'Database',        '🗄️'),
      w('dev-storage',   'Storage Browser', '📂'),
      w('dev-logs',      'Logs',            '📋'),
      w('dev-env',       'Environment',     '🌐'),
      w('dev-queue',     'Queue',           '📬'),
      w('dev-cron',      'Cron Jobs',       '⏰'),
      w('dev-api',       'API Playground',  '🔌'),
    ],
  },
];

// ─── Blocked Modules — auto-computed (ADMIN-SYNC-002) ────────────────────────
//
// Derived from DOMAIN_CONTROL_CENTERS at module-init time.
// Includes every widget whose syncStatus is blocked | dummy | not_implemented.
// No manual entries — remove this logic only when all widgets reach 'synced'.
//
// Priority mapping:
//   blocked         → high   (hard dependency missing)
//   dummy           → medium (placeholder data, not production-ready)
//   not_implemented → low    (backlog, no active blocker)

function _computeBlockedModules(): BlockedModuleRecord[] {
  const PRIORITY: Record<string, BlockedModuleRecord['priority']> = {
    blocked:         'high',
    dummy:           'medium',
    not_implemented: 'low',
  };
  const REASON: Record<string, string> = {
    blocked:         'Blocked — unresolved dependency',
    dummy:           'Uses placeholder data — not synced to Supabase production',
    not_implemented: 'Not yet implemented',
  };

  const records: BlockedModuleRecord[] = [];
  for (const domain of DOMAIN_CONTROL_CENTERS) {
    for (const widget of domain.widgets) {
      const { syncStatus, blocker } = widget.status;
      if (syncStatus === 'blocked' || syncStatus === 'dummy' || syncStatus === 'not_implemented') {
        records.push({
          key:                widget.key,
          label:              widget.label,
          domain:             domain.label,
          reason:             REASON[syncStatus],
          blockedSince:       blocker?.blockedSince ?? null,
          priority:           PRIORITY[syncStatus],
          owner:              null,
          expectedDependency: blocker?.reason ?? null,
        });
      }
    }
  }
  return records;
}

export const BLOCKED_MODULES_PANEL: BlockedModuleRecord[] = _computeBlockedModules();
