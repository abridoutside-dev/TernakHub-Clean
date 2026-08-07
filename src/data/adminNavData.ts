// ─── Admin Navigation Data — ADMIN-ARCH-002 ──────────────────────────────────
// Single source of truth for the Admin Control Plane navigation.
// 14 platform domains — every production module assigned to exactly one domain.
// All previous modules preserved for backward compatibility.

// ─── Sync Status ─────────────────────────────────────────────────────────────

/**
 * Placeholder sync-status for each admin module.
 *  synced          — Live from production source.
 *  blocked         — Cannot sync (dependency / permission issue).
 *  dummy           — Seed / mock data only.
 *  not_implemented — Placeholder; no backing data yet.
 */
export type SyncStatus = 'synced' | 'blocked' | 'dummy' | 'not_implemented';

// ─── Module Health ────────────────────────────────────────────────────────────

/**
 * Placeholder health status for each admin module.
 * Will be wired to real monitoring signals in a future task.
 */
export type ModuleHealth = 'healthy' | 'degraded' | 'down' | 'unknown';

// ─── Module Blocker ───────────────────────────────────────────────────────────

/**
 * Placeholder blocker record — populated when a module is gated.
 */
export interface ModuleBlocker {
  reason: string;
  blockedSince?: string;   // ISO date string
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AdminNavChild {
  key: string;
  label: string;
  path: string;
  icon?: string;
  syncStatus?: SyncStatus;
}

export interface AdminNavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  badgeColor?: string;
  /** Sync status placeholder — see SyncStatus */
  syncStatus?: SyncStatus;
  /** Health status placeholder — not yet connected to monitoring */
  health?: ModuleHealth;
  /** Statistics placeholder — key/value pairs, not yet populated */
  statistics?: Record<string, number | string | null>;
  /** Blocker placeholder — populated when module is gated */
  blocker?: ModuleBlocker;
  children?: AdminNavChild[];
}

/** A top-level domain grouping in the Admin Control Plane sidebar. */
export interface AdminNavDomain {
  key: string;
  label: string;
  icon: string;
  items: AdminNavItem[];
}

export interface AdminModuleConfig {
  key: string;
  icon: string;
  title: string;
  description: string;
  purpose: string;
  subSections: AdminSubSection[];
}

export interface AdminSubSection {
  key: string;
  icon: string;
  title: string;
  description: string;
}

// ─── Blocked Modules Registry ─────────────────────────────────────────────────

/**
 * Permanent "Blocked Modules" registry.
 * Populate manually when modules are gated by missing deps or integrations.
 * Do NOT populate dynamically.
 */
export interface BlockedModuleEntry {
  key: string;
  label: string;
  domain: string;
  reason: string;
  /** ISO date string — when the module became blocked */
  blockedSince?: string;
  /** Priority level for unblocking — placeholder */
  priority?: 'critical' | 'high' | 'medium' | 'low';
  /** Team or person responsible for unblocking — placeholder */
  owner?: string;
  /** External service or feature required before unblocking — placeholder */
  expectedDependency?: string;
}

export const BLOCKED_MODULES: BlockedModuleEntry[] = [
  // Placeholder — add entries as blocked modules are identified.
];

// ─── Domain Nav Tree ──────────────────────────────────────────────────────────

export const ADMIN_NAV_DOMAINS: AdminNavDomain[] = [

  // ── 1. Platform Overview ───────────────────────────────────────────────────
  {
    key: 'domain-overview',
    label: 'Platform Overview',
    icon: '📊',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: '📊',
        path: '/admin',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'platform-health',
        label: 'Platform Health',
        icon: '❤️',
        path: '/admin/platform-health',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'platform-stats',
        label: 'Global Statistics',
        icon: '📈',
        path: '/admin/platform-stats',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'quick-actions',
        label: 'Quick Actions',
        icon: '⚡',
        path: '/admin/quick-actions',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'activity',
        label: 'Recent Activity',
        icon: '📋',
        path: '/admin/activity',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'search',
        label: 'Global Search',
        icon: '🔍',
        path: '/admin/search',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
    ],
  },

  // ── 2. User & Workspace ────────────────────────────────────────────────────
  {
    key: 'domain-user-workspace',
    label: 'User & Workspace',
    icon: '👥',
    items: [
      {
        key: 'users',
        label: 'Users',
        icon: '👤',
        path: '/admin/users',
        syncStatus: 'synced',
        health: 'healthy',
        children: [
          { key: 'users-list', label: 'Daftar Pengguna', path: '/admin/users', icon: '📋' },
        ],
      },
      {
        key: 'user-profiles',
        label: 'User Profiles',
        icon: '🪪',
        path: '/admin/users/profiles',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'workspaces',
        label: 'Workspaces',
        icon: '🏢',
        path: '/admin/workspaces',
        syncStatus: 'synced',
        health: 'healthy',
        children: [
          { key: 'ws-all',          label: 'Semua Workspace',    path: '/admin/workspaces',              icon: '🗂️' },
          { key: 'ws-plans',        label: 'Paket',              path: '/admin/workspaces/plans',        icon: '⭐' },
          { key: 'ws-verification', label: 'Verifikasi',         path: '/admin/workspaces/verification', icon: '✅' },
          { key: 'ws-blocked',      label: 'Terblokir',          path: '/admin/workspaces/blocked',      icon: '🚫' },
          { key: 'ws-pending',      label: 'Permintaan Pending', path: '/admin/workspaces/pending',      icon: '⏳' },
        ],
      },
      {
        key: 'ws-members',
        label: 'Workspace Members',
        icon: '👥',
        path: '/admin/workspaces/members',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'ws-roles',
        label: 'Workspace Roles',
        icon: '🔑',
        path: '/admin/workspaces/roles',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'relationships',
        label: 'Workspace Relationships',
        icon: '🤝',
        path: '/admin/relationships',
        syncStatus: 'dummy',
        health: 'unknown',
        children: [
          { key: 'rel-all',     label: 'Semua Hubungan', path: '/admin/relationships',         icon: '📋' },
          { key: 'rel-active',  label: 'Aktif',           path: '/admin/relationships/active',  icon: '✅' },
          { key: 'rel-pending', label: 'Menunggu',         path: '/admin/relationships/pending', icon: '⏳' },
        ],
      },
      {
        key: 'ownership-transfer',
        label: 'Ownership Transfer',
        icon: '🔄',
        path: '/admin/ownership-transfer',
        syncStatus: 'dummy',
        health: 'unknown',
        children: [
          { key: 'own-all',     label: 'Semua Permintaan', path: '/admin/ownership-transfer',         icon: '📋' },
          { key: 'own-pending', label: 'Dalam Proses',     path: '/admin/ownership-transfer/pending', icon: '⏳' },
          { key: 'own-done',    label: 'Selesai',           path: '/admin/ownership-transfer/done',    icon: '✅' },
        ],
      },
      {
        // Moved from Platform Services — every workspace's subscription context
        key: 'subscription',
        label: 'Subscription',
        icon: '⭐',
        path: '/admin/subscription',
        syncStatus: 'dummy',
        health: 'unknown',
        children: [
          { key: 'sub-plans',    label: 'Paket',         path: '/admin/subscription',          icon: '📋' },
          { key: 'sub-billing',  label: 'Tagihan',       path: '/admin/subscription/billing',  icon: '💳' },
          { key: 'sub-features', label: 'Matriks Fitur', path: '/admin/subscription/features', icon: '🔧' },
        ],
      },
      {
        key: 'uw-trust',
        label: 'Trust & Verification',
        icon: '🛡️',
        path: '/admin/trust',
        syncStatus: 'dummy',
        health: 'unknown',
      },
    ],
  },

  // ── 3. Workspace Farm ──────────────────────────────────────────────────────
  {
    key: 'domain-farm',
    label: 'Workspace Farm',
    icon: '🐄',
    items: [
      {
        key: 'farm-dashboard',
        label: 'Dashboard',
        icon: '📊',
        path: '/admin/farm/dashboard',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'livestock',
        label: 'Livestock',
        icon: '🐄',
        path: '/admin/livestock',
        syncStatus: 'synced',
        health: 'healthy',
        children: [
          { key: 'ls-registry', label: 'Registri',        path: '/admin/livestock',          icon: '📋' },
          { key: 'ls-health',   label: 'Rekam Kesehatan', path: '/admin/livestock/health',   icon: '🩺' },
          { key: 'ls-breeding', label: 'Data Pembiakan',  path: '/admin/livestock/breeding', icon: '🔬' },
        ],
      },
      {
        key: 'lineage',
        label: 'Cross Workspace Lineage',
        icon: '🌳',
        path: '/admin/lineage',
        syncStatus: 'dummy',
        health: 'unknown',
        children: [
          { key: 'lin-registry', label: 'Registri Silsilah',   path: '/admin/lineage',              icon: '📋' },
          { key: 'lin-crossws',  label: 'Referensi Lintas WS', path: '/admin/lineage/cross-ws',     icon: '🌐' },
          { key: 'lin-verify',   label: 'Antrian Verifikasi',  path: '/admin/lineage/verification', icon: '✅' },
        ],
      },
      {
        key: 'farm-batch',
        label: 'Batch',
        icon: '📦',
        path: '/admin/farm/batch',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'farm-bobot',
        label: 'Catat Bobot',
        icon: '⚖️',
        path: '/admin/farm/catat-bobot',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'farm-pemberian-pakan',
        label: 'Pemberian Pakan',
        icon: '🌾',
        path: '/admin/farm/pemberian-pakan',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'farm-stok-pakan',
        label: 'Stok Pakan',
        icon: '🏪',
        path: '/admin/farm/stok-pakan',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'farm-master-pakan',
        label: 'Master Pakan',
        icon: '📚',
        path: '/admin/farm/master-pakan',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'farm-formula-pakan',
        label: 'Formula Pakan',
        icon: '🧪',
        path: '/admin/farm/formula-pakan',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'farm-stok-obat',
        label: 'Stok Obat',
        icon: '💊',
        path: '/admin/farm/stok-obat',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'farm-master-obat',
        label: 'Master Obat',
        icon: '📋',
        path: '/admin/farm/master-obat',
        syncStatus: 'not_implemented',
        health: 'unknown',
        blocker: { reason: 'Tidak ada tabel master_obat_catalog; perlu tabel baru untuk katalog obat platform.', blockedSince: '2026-08-03' },
      },
      {
        key: 'farm-kesehatan',
        label: 'Kesehatan Hewan',
        icon: '🩺',
        path: '/admin/farm/kesehatan-hewan',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'farm-reproduksi',
        label: 'Reproduksi',
        icon: '🔬',
        path: '/admin/farm/reproduksi',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'farm-mutasi',
        label: 'Mutasi',
        icon: '🔀',
        path: '/admin/farm/mutasi',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'farm-ai',
        label: 'AI Insight',
        icon: '🤖',
        path: '/admin/farm/ai-insight',
        syncStatus: 'not_implemented',
        health: 'unknown',
        blocker: { reason: 'Belum ada backend AI/ML untuk farm insight; membutuhkan integrasi AI engine.', blockedSince: '2026-08-03' },
      },
    ],
  },

  // ── 4. Workspace Feed Store ────────────────────────────────────────────────
  {
    key: 'domain-feed-store',
    label: 'Workspace Feed Store',
    icon: '🌾',
    items: [
      {
        key: 'fs-dashboard',
        label: 'Dashboard',
        icon: '📊',
        path: '/admin/feed-store/dashboard',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'fs-produk',
        label: 'Produk',
        icon: '📦',
        path: '/admin/feed-store/produk',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        // Existing feed module kept for backward compat — maps to Stock/Master data
        key: 'feed',
        label: 'Stock',
        icon: '🌾',
        path: '/admin/feed',
        syncStatus: 'synced',
        health: 'healthy',
        children: [
          { key: 'fd-master', label: 'Data Master', path: '/admin/feed',             icon: '📚' },
          { key: 'fd-stock',  label: 'Stok',        path: '/admin/feed/stock',       icon: '📦' },
          { key: 'fd-cons',   label: 'Konsumsi',    path: '/admin/feed/consumption', icon: '📊' },
        ],
      },
      {
        key: 'fs-purchase',
        label: 'Purchase',
        icon: '🛒',
        path: '/admin/feed-store/purchase',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'fs-sales',
        label: 'Sales',
        icon: '💰',
        path: '/admin/feed-store/sales',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'fs-transactions',
        label: 'Transactions',
        icon: '💳',
        path: '/admin/feed-store/transactions',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'fs-reports',
        label: 'Reports',
        icon: '📊',
        path: '/admin/feed-store/reports',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'fs-ai',
        label: 'AI Insight',
        icon: '🤖',
        path: '/admin/feed-store/ai-insight',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
    ],
  },

  // ── 5. Workspace Drug Store ────────────────────────────────────────────────
  {
    key: 'domain-drug-store',
    label: 'Workspace Drug Store',
    icon: '💊',
    items: [
      {
        key: 'ds-dashboard',
        label: 'Dashboard',
        icon: '📊',
        path: '/admin/drug-store/dashboard',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'ds-produk',
        label: 'Produk',
        icon: '📦',
        path: '/admin/drug-store/produk',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        // Existing medicine module kept for backward compat
        key: 'medicine',
        label: 'Stock',
        icon: '💊',
        path: '/admin/medicine',
        syncStatus: 'synced',
        health: 'healthy',
        children: [
          { key: 'med-catalog', label: 'Katalog',          path: '/admin/medicine',       icon: '📚' },
          { key: 'med-stock',   label: 'Stok',             path: '/admin/medicine/stock', icon: '📦' },
          { key: 'med-usage',   label: 'Rekam Penggunaan', path: '/admin/medicine/usage', icon: '📋' },
        ],
      },
      {
        key: 'ds-purchase',
        label: 'Purchase',
        icon: '🛒',
        path: '/admin/drug-store/purchase',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'ds-sales',
        label: 'Sales',
        icon: '💰',
        path: '/admin/drug-store/sales',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'ds-transactions',
        label: 'Transactions',
        icon: '💳',
        path: '/admin/drug-store/transactions',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'ds-reports',
        label: 'Reports',
        icon: '📊',
        path: '/admin/drug-store/reports',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'ds-ai',
        label: 'AI Insight',
        icon: '🤖',
        path: '/admin/drug-store/ai-insight',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
    ],
  },

  // ── 6. Workspace Veterinary ────────────────────────────────────────────────
  {
    key: 'domain-veterinary',
    label: 'Workspace Veterinary',
    icon: '🩺',
    items: [
      {
        key: 'vet-dashboard',
        label: 'Dashboard',
        icon: '📊',
        path: '/admin/veterinary/dashboard',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'vet-appointment',
        label: 'Appointment',
        icon: '📅',
        path: '/admin/veterinary/appointment',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'vet-examination',
        label: 'Examination',
        icon: '🔬',
        path: '/admin/veterinary/examination',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'vet-treatment',
        label: 'Treatment',
        icon: '💉',
        path: '/admin/veterinary/treatment',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'vet-prescription',
        label: 'Prescription',
        icon: '📝',
        path: '/admin/veterinary/prescription',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'vet-medical-record',
        label: 'Medical Record',
        icon: '📋',
        path: '/admin/veterinary/medical-record',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'vet-reports',
        label: 'Reports',
        icon: '📊',
        path: '/admin/veterinary/reports',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'vet-ai',
        label: 'AI Insight',
        icon: '🤖',
        path: '/admin/veterinary/ai-insight',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
    ],
  },

  // ── 7. Workspace Transport ─────────────────────────────────────────────────
  {
    key: 'domain-transport',
    label: 'Workspace Transport',
    icon: '🚛',
    items: [
      // ADMIN-SYNC-008: Dashboard, Delivery, Reports → synced (LIVE)
      {
        key: 'trans-dashboard',
        label: 'Dashboard',
        icon: '📊',
        path: '/admin/transport/dashboard',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'trans-delivery',
        label: 'Delivery',
        icon: '📦',
        path: '/admin/transport/delivery',
        syncStatus: 'synced',
        health: 'healthy',
      },
      {
        key: 'trans-reports',
        label: 'Reports',
        icon: '📊',
        path: '/admin/transport/reports',
        syncStatus: 'synced',
        health: 'healthy',
      },
      // Blocked — no Supabase tables
      {
        key: 'trans-vehicles',
        label: 'Vehicles',
        icon: '🚚',
        path: '/admin/transport/vehicles',
        syncStatus: 'blocked',
        health: 'unknown',
      },
      {
        key: 'trans-drivers',
        label: 'Drivers',
        icon: '👷',
        path: '/admin/transport/drivers',
        syncStatus: 'blocked',
        health: 'unknown',
      },
      {
        key: 'trans-route',
        label: 'Route',
        icon: '🗺️',
        path: '/admin/transport/route',
        syncStatus: 'blocked',
        health: 'unknown',
      },
      {
        key: 'trans-schedule',
        label: 'Schedule',
        icon: '📅',
        path: '/admin/transport/schedule',
        syncStatus: 'blocked',
        health: 'unknown',
      },
      // not_implemented — no AI backend
      {
        key: 'trans-ai',
        label: 'AI Insight',
        icon: '🤖',
        path: '/admin/transport/ai-insight',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
    ],
  },

  // ── 8. Marketplace & Commerce ─────────────────────────────────────────────
  {
    key: 'domain-marketplace',
    label: 'Marketplace & Commerce',
    icon: '🛒',
    items: [
      {
        key: 'marketplace',
        label: 'Marketplace',
        icon: '🛒',
        path: '/admin/marketplace',
        syncStatus: 'dummy',
        health: 'unknown',
        children: [
          { key: 'mp-listings',     label: 'Listing',   path: '/admin/marketplace',              icon: '📦' },
          { key: 'mp-transactions', label: 'Transaksi', path: '/admin/marketplace/transactions', icon: '💳' },
          { key: 'mp-reports',      label: 'Laporan',   path: '/admin/marketplace/reports',      icon: '🚩' },
        ],
      },
      {
        key: 'mp-listings-standalone',
        label: 'Listings',
        icon: '📦',
        path: '/admin/marketplace/listings',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'escrow',
        label: 'Escrow',
        icon: '🔐',
        path: '/admin/escrow',
        syncStatus: 'dummy',
        health: 'unknown',
        children: [
          { key: 'esc-list',    label: 'Semua Escrow', path: '/admin/escrow',         icon: '📋' },
          { key: 'esc-active',  label: 'Aktif',         path: '/admin/escrow/active',  icon: '⏳' },
          { key: 'esc-dispute', label: 'Sengketa',      path: '/admin/escrow/dispute', icon: '⚠️' },
        ],
      },
      {
        key: 'master-escrow',
        label: 'Master Escrow',
        icon: '🛡️',
        path: '/admin/master-escrow',
        syncStatus: 'dummy',
        health: 'unknown',
        children: [
          { key: 'me-providers', label: 'Penyedia Escrow', path: '/admin/master-escrow', icon: '🛡️' },
        ],
      },
      {
        key: 'mp-chat',
        label: 'Chat',
        icon: '💬',
        path: '/admin/marketplace/chat',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'mp-quotation',
        label: 'Quotation',
        icon: '📄',
        path: '/admin/marketplace/quotation',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'mp-deal-sheet',
        label: 'Deal Sheet',
        icon: '🤝',
        path: '/admin/marketplace/deal-sheet',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'mp-analytics',
        label: 'Marketplace Analytics',
        icon: '📈',
        path: '/admin/marketplace/analytics',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
    ],
  },

  // ── 9. Platform Services ───────────────────────────────────────────────────
  {
    key: 'domain-platform-services',
    label: 'Platform Services',
    icon: '⚡',
    items: [
      {
        key: 'news-event',
        label: 'News & Event',
        icon: '📰',
        path: '/admin/news-event/review',
        syncStatus: 'not_implemented',
        health: 'unknown',
        children: [
          { key: 'ne-review',      label: 'Review Konten',       path: '/admin/news-event/review', icon: '📝' },
          { key: 'ne-rss-sources', label: 'Sumber RSS',          path: '/admin/rss/sources',       icon: '📡' },
          { key: 'ne-rss-queue',   label: 'Antrian RSS',         path: '/admin/rss/queue',         icon: '📥' },
          { key: 'ne-publication', label: 'Manajemen Publikasi', path: '/admin/publication',       icon: '📤' },
        ],
      },
      {
        key: 'ps-publication',
        label: 'Publication',
        icon: '📤',
        path: '/admin/publication',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'notifications',
        label: 'Notification',
        icon: '🔔',
        path: '/admin/notifications',
        syncStatus: 'dummy',
        health: 'unknown',
        children: [
          { key: 'notif-all',       label: 'Semua Notifikasi', path: '/admin/notifications',           icon: '📋' },
          { key: 'notif-templates', label: 'Template',         path: '/admin/notifications/templates', icon: '📝' },
        ],
      },
      {
        key: 'ps-rss',
        label: 'RSS',
        icon: '📡',
        path: '/admin/rss/sources',
        syncStatus: 'not_implemented',
        health: 'unknown',
        children: [
          { key: 'rss-sources', label: 'Sumber RSS',  path: '/admin/rss/sources', icon: '📡' },
          { key: 'rss-queue',   label: 'Antrian RSS', path: '/admin/rss/queue',   icon: '📥' },
        ],
      },
      {
        // Admin tool for managing/indexing global search — different from the
        // Platform Overview "Global Search" which is a navigation shortcut.
        key: 'ps-global-search',
        label: 'Global Search',
        icon: '🔍',
        path: '/admin/services/search',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'ps-ai-global',
        label: 'AI Insight Global',
        icon: '🤖',
        path: '/admin/services/ai-global',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        // Kept for backward compat — not in ADMIN-ARCH-002 spec but route exists
        key: 'announcements',
        label: 'Pengumuman',
        icon: '📢',
        path: '/admin/announcements',
        syncStatus: 'dummy',
        health: 'unknown',
        children: [
          { key: 'ann-published', label: 'Diterbitkan', path: '/admin/announcements',           icon: '✅' },
          { key: 'ann-drafts',    label: 'Draf',        path: '/admin/announcements/drafts',    icon: '✏️' },
          { key: 'ann-scheduled', label: 'Terjadwal',   path: '/admin/announcements/scheduled', icon: '📅' },
        ],
      },
    ],
  },

  // ── 10. Master Data ────────────────────────────────────────────────────────
  {
    key: 'domain-master-data',
    label: 'Master Data',
    icon: '🗂️',
    items: [
      {
        // Existing data_master module kept for backward compat
        key: 'data_master',
        label: 'Data Master',
        icon: '🗂️',
        path: '/admin/data-master',
        syncStatus: 'dummy',
        health: 'unknown',
        children: [
          { key: 'dm-categories', label: 'Kategori',      path: '/admin/data-master',         icon: '📁' },
          { key: 'dm-master',     label: 'Daftar Master', path: '/admin/data-master/master',  icon: '📋' },
          { key: 'dm-imports',    label: 'Impor',         path: '/admin/data-master/imports', icon: '📥' },
        ],
      },
      {
        key: 'md-jenis-ternak',
        label: 'Jenis Ternak',
        icon: '🐄',
        path: '/admin/master/jenis-ternak',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'md-ras',
        label: 'Ras',
        icon: '🧬',
        path: '/admin/master/ras',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        // Note: "Master Pakan" also appears in Workspace Farm — different scope.
        // Farm = workspace-level feed master; here = platform-wide reference data.
        key: 'md-master-pakan',
        label: 'Master Pakan',
        icon: '🌾',
        path: '/admin/master/pakan',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        // Note: "Master Obat" also appears in Workspace Farm — different scope.
        // Farm = workspace-level drug master; here = platform-wide reference data.
        key: 'md-master-obat',
        label: 'Master Obat',
        icon: '💊',
        path: '/admin/master/obat',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'md-penyakit',
        label: 'Penyakit',
        icon: '🦠',
        path: '/admin/master/penyakit',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'md-wilayah',
        label: 'Wilayah',
        icon: '🗺️',
        path: '/admin/master/wilayah',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'md-kategori',
        label: 'Kategori',
        icon: '📁',
        path: '/admin/master/kategori',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'md-satuan',
        label: 'Satuan',
        icon: '📏',
        path: '/admin/master/satuan',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'md-referensi',
        label: 'Referensi',
        icon: '📖',
        path: '/admin/master/referensi',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
    ],
  },

  // ── 11. Platform Configuration ─────────────────────────────────────────────
  {
    key: 'domain-config',
    label: 'Platform Configuration',
    icon: '🔧',
    items: [
      {
        // Existing settings module — children expanded for backward compat
        key: 'settings',
        label: 'General',
        icon: '⚙️',
        path: '/admin/settings',
        syncStatus: 'not_implemented',
        health: 'unknown',
        children: [
          { key: 'set-general',  label: 'Umum',     path: '/admin/settings',          icon: '🔧' },
          { key: 'set-security', label: 'Keamanan', path: '/admin/settings/security', icon: '🔒' },
          { key: 'set-api',      label: 'API Keys', path: '/admin/settings/api',      icon: '🔑' },
          { key: 'set-email',    label: 'Email',    path: '/admin/settings/email',    icon: '📧' },
        ],
      },
      {
        key: 'cfg-authentication',
        label: 'Authentication',
        icon: '🔐',
        path: '/admin/config/authentication',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'cfg-authorization',
        label: 'Authorization',
        icon: '🔑',
        path: '/admin/config/authorization',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'cfg-ws-defaults',
        label: 'Workspace Defaults',
        icon: '🏢',
        path: '/admin/config/workspace-defaults',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'cfg-feature-flags',
        label: 'Feature Flags',
        icon: '🚩',
        path: '/admin/config/feature-flags',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'cfg-marketplace-rules',
        label: 'Marketplace Rules',
        icon: '🛒',
        path: '/admin/config/marketplace-rules',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'cfg-escrow-rules',
        label: 'Escrow Rules',
        icon: '🔐',
        path: '/admin/config/escrow-rules',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'cfg-subscription-rules',
        label: 'Subscription Rules',
        icon: '⭐',
        path: '/admin/config/subscription-rules',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'cfg-trust-rules',
        label: 'Trust Rules',
        icon: '🛡️',
        path: '/admin/config/trust-rules',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'cfg-notification-rules',
        label: 'Notification Rules',
        icon: '🔔',
        path: '/admin/config/notification-rules',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'cfg-ai-settings',
        label: 'AI Settings',
        icon: '🤖',
        path: '/admin/config/ai-settings',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'cfg-email',
        label: 'Email',
        icon: '📧',
        path: '/admin/config/email',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'cfg-storage',
        label: 'Storage',
        icon: '🗄️',
        path: '/admin/config/storage',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'cfg-security',
        label: 'Security',
        icon: '🔒',
        path: '/admin/config/security',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
    ],
  },

  // ── 12. Monitoring ─────────────────────────────────────────────────────────
  {
    key: 'domain-monitoring',
    label: 'Monitoring',
    icon: '📡',
    items: [
      {
        // Existing monitoring module — expanded with new children
        key: 'monitoring',
        label: 'Platform Monitoring',
        icon: '📡',
        path: '/admin/monitoring',
        syncStatus: 'dummy',
        health: 'unknown',
        children: [
          { key: 'mon-health', label: 'Kesehatan Sistem', path: '/admin/monitoring',             icon: '❤️' },
          { key: 'mon-errors', label: 'Log Kesalahan',    path: '/admin/monitoring/errors',      icon: '⚠️' },
          { key: 'mon-perf',   label: 'Performa',         path: '/admin/monitoring/performance', icon: '⚡' },
        ],
      },
      {
        key: 'mon-db-health',
        label: 'Database Health',
        icon: '🗄️',
        path: '/admin/monitoring/database',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'mon-api-health',
        label: 'API Health',
        icon: '🔌',
        path: '/admin/monitoring/api',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'mon-queue',
        label: 'Queue',
        icon: '📬',
        path: '/admin/monitoring/queue',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'mon-scheduler',
        label: 'Scheduler',
        icon: '⏰',
        path: '/admin/monitoring/scheduler',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'mon-storage',
        label: 'Storage',
        icon: '🗄️',
        path: '/admin/monitoring/storage',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'mon-performance',
        label: 'Performance',
        icon: '⚡',
        path: '/admin/monitoring/performance',
        syncStatus: 'dummy',
        health: 'unknown',
      },
    ],
  },

  // ── 13. Audit & Trust ─────────────────────────────────────────────────────
  {
    key: 'domain-audit-trust',
    label: 'Audit & Trust',
    icon: '🛡️',
    items: [
      {
        key: 'audit-trail',
        label: 'Audit Trail',
        icon: '📜',
        path: '/admin/audit-trail',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'trust',
        label: 'Trust',
        icon: '✅',
        path: '/admin/trust',
        syncStatus: 'dummy',
        health: 'unknown',
        children: [
          { key: 'tv-pending',  label: 'Antrian Menunggu', path: '/admin/trust',          icon: '⏳' },
          { key: 'tv-approved', label: 'Disetujui',        path: '/admin/trust/approved', icon: '✅' },
          { key: 'tv-rejected', label: 'Ditolak',          path: '/admin/trust/rejected', icon: '❌' },
        ],
      },
      {
        key: 'verification',
        label: 'Verification',
        icon: '🔍',
        path: '/admin/trust/verification',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'reports',
        label: 'Reports',
        icon: '🚩',
        path: '/admin/reports',
        syncStatus: 'dummy',
        health: 'unknown',
        children: [
          { key: 'rpt-user',      label: 'Laporan Pengguna', path: '/admin/reports',           icon: '👤' },
          { key: 'rpt-content',   label: 'Laporan Konten',   path: '/admin/reports/content',   icon: '📄' },
          { key: 'rpt-financial', label: 'Keuangan',         path: '/admin/reports/financial', icon: '💰' },
        ],
      },
      {
        key: 'backup',
        label: 'Backup',
        icon: '💾',
        path: '/admin/backup',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'restore',
        label: 'Restore',
        icon: '♻️',
        path: '/admin/restore',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
    ],
  },

  // ── 14. Developer ─────────────────────────────────────────────────────────
  {
    key: 'domain-developer',
    label: 'Developer',
    icon: '🛠️',
    items: [
      {
        key: 'dev-migration',
        label: 'Migration',
        icon: '🔄',
        path: '/admin/developer/migration',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'dev-database',
        label: 'Database',
        icon: '🗄️',
        path: '/admin/developer/database',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'dev-logs',
        label: 'Logs',
        icon: '📋',
        path: '/admin/developer/logs',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'dev-api',
        label: 'API',
        icon: '🔌',
        path: '/admin/developer/api',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'dev-queue',
        label: 'Queue',
        icon: '📬',
        path: '/admin/developer/queue',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'dev-scheduler',
        label: 'Scheduler',
        icon: '⏰',
        path: '/admin/developer/scheduler',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'dev-jobs',
        label: 'Jobs',
        icon: '⚙️',
        path: '/admin/developer/jobs',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
      {
        key: 'dev-debug',
        label: 'Debug',
        icon: '🐛',
        path: '/admin/developer/debug',
        syncStatus: 'not_implemented',
        health: 'unknown',
      },
    ],
  },
];

// ─── Backward-compatible flat tree ───────────────────────────────────────────
// Used by AdminTopBar for active-path resolution.
// Do NOT use for new rendering code — use ADMIN_NAV_DOMAINS instead.

export const ADMIN_NAV_TREE: AdminNavItem[] = ADMIN_NAV_DOMAINS.flatMap(
  (domain) => domain.items,
);

// ─── Module Configs (used by AdminModuleShell) ────────────────────────────────

export const ADMIN_MODULE_CONFIGS: Record<string, AdminModuleConfig> = {
  users: {
    key: 'users',
    icon: '👤',
    title: 'Pengguna',
    description: 'Kelola pengguna platform, peran, dan izin akses.',
    purpose:
      'Modul ini menyediakan tampilan lengkap seluruh pengguna terdaftar di platform TernakHub. ' +
      'Administrator dapat mencari, memfilter, menangguhkan, atau menghapus akun secara permanen, ' +
      'menetapkan peran dan izin, serta meninjau log aktivitas pengguna.',
    subSections: [
      { key: 'list',     icon: '📋', title: 'Daftar Pengguna',  description: 'Telusuri dan cari semua pengguna terdaftar dengan filter berdasarkan status, paket, dan tanggal daftar.' },
      { key: 'roles',    icon: '🔑', title: 'Peran & Izin',     description: 'Tentukan dan tetapkan peran (Admin, Moderator, Support) dengan cakupan izin yang terperinci.' },
      { key: 'activity', icon: '📜', title: 'Log Aktivitas',    description: 'Jejak audit lengkap semua tindakan yang dilakukan pengguna untuk keperluan kepatuhan dan keamanan.' },
    ],
  },
  workspaces: {
    key: 'workspaces',
    icon: '🏢',
    title: 'Workspaces',
    description: 'Kelola semua workspace terdaftar, paket, dan verifikasi workspace.',
    purpose:
      'Modul ini memberikan pengawasan atas setiap workspace di platform — termasuk yang aktif, ditangguhkan, ' +
      'dan diarsipkan. Admin dapat meninjau detail workspace, meningkatkan atau menurunkan paket, ' +
      'mengelola anggota, dan memproses lencana verifikasi resmi workspace.',
    subSections: [
      { key: 'all',          icon: '🗂️', title: 'Semua Workspace', description: 'Registri lengkap semua workspace dengan status, tingkat paket, jumlah anggota, dan tanggal pembuatan.' },
      { key: 'plans',        icon: '⭐', title: 'Paket',            description: 'Lihat dan kelola penugasan paket, masa percobaan, dan penggantian tagihan.' },
      { key: 'verification', icon: '✅', title: 'Verifikasi',       description: 'Proses permintaan verifikasi workspace dan kelola lencana resmi.' },
    ],
  },
  marketplace: {
    key: 'marketplace',
    icon: '🛒',
    title: 'Marketplace',
    description: 'Awasi listing marketplace, transaksi, dan penyelesaian sengketa.',
    purpose:
      'Modul Marketplace memberi admin pengawasan penuh atas semua aktivitas jual beli di TernakHub. ' +
      'Ini mencakup moderasi listing, pemantauan transaksi, dan penyelesaian sengketa atau konten yang dilaporkan. ' +
      'Admin dapat menangguhkan listing, menerbitkan pengembalian dana, dan mengeskalasi kasus.',
    subSections: [
      { key: 'listings',     icon: '📦', title: 'Listing',    description: 'Tinjau, setujui, tangguhkan, atau hapus semua listing marketplace di seluruh platform.' },
      { key: 'transactions', icon: '💳', title: 'Transaksi',  description: 'Pantau semua catatan transaksi, status pembayaran, dan aktivitas escrow.' },
      { key: 'reports',      icon: '🚩', title: 'Laporan',    description: 'Tindak lanjuti laporan sengketa pembeli/penjual dan tanda konten yang dikirimkan pengguna.' },
    ],
  },
  livestock: {
    key: 'livestock',
    icon: '🐄',
    title: 'Livestock',
    description: 'Registri ternak seluruh platform, pengawasan kesehatan, dan data pembiakan.',
    purpose:
      'Menyediakan tampilan administratif hanya-baca atas semua ternak yang terdaftar di seluruh workspace. ' +
      'Admin dapat mengaudit catatan, memverifikasi integritas data, dan membuat laporan agregat tentang populasi ' +
      'ternak, tren kesehatan, dan distribusi spesies di seluruh platform.',
    subSections: [
      { key: 'registry', icon: '📋', title: 'Registri',        description: 'Tampilan agregat semua entri ternak terdaftar di seluruh platform.' },
      { key: 'health',   icon: '🩺', title: 'Rekam Kesehatan', description: 'Ringkasan kejadian kesehatan seluruh platform, pemantauan wabah penyakit, dan statistik pengobatan.' },
      { key: 'breeding', icon: '🔬', title: 'Data Pembiakan',  description: 'Analitik program pembiakan lintas workspace dan pemeriksaan integritas data silsilah.' },
    ],
  },
  feed: {
    key: 'feed',
    icon: '🌾',
    title: 'Pakan',
    description: 'Kelola data referensi pakan master, tingkat stok, dan analitik konsumsi.',
    purpose:
      'Modul admin Pakan memberikan pengawasan atas pustaka referensi pakan dan nutrisi master ' +
      'yang mendukung semua modul pakan tingkat workspace. Admin dapat menambahkan bahan baru, memperbarui ' +
      'data gizi, mengelola entri produk komersial, dan melihat statistik konsumsi agregat.',
    subSections: [
      { key: 'master', icon: '📚', title: 'Data Master', description: 'Kelola pustaka referensi bahan pakan master yang digunakan oleh semua workspace.' },
      { key: 'stock',  icon: '📦', title: 'Stok',        description: 'Tampilan agregat tingkat stok pakan yang dilaporkan di seluruh workspace.' },
      { key: 'cons',   icon: '📊', title: 'Konsumsi',    description: 'Analitik konsumsi pakan seluruh platform dan laporan tren gizi.' },
    ],
  },
  medicine: {
    key: 'medicine',
    icon: '💊',
    title: 'Obat',
    description: 'Kelola katalog obat hewan, pengawasan stok, dan rekam penggunaan.',
    purpose:
      'Mengadministrasikan katalog obat dan produk kesehatan hewan seluruh platform. Admin dapat menambahkan ' +
      'obat baru, memperbarui panduan dosis, mengelola merek produk komersial, dan meninjau rekam ' +
      'penggunaan obat agregat untuk mengidentifikasi tren penyakit atau masalah pasokan.',
    subSections: [
      { key: 'catalog', icon: '📚', title: 'Katalog',          description: 'Katalog obat hewan master mencakup semua kategori obat dan produk komersial.' },
      { key: 'stock',   icon: '📦', title: 'Stok',             description: 'Tampilan tingkat stok agregat di semua inventaris obat workspace.' },
      { key: 'usage',   icon: '📋', title: 'Rekam Penggunaan', description: 'Jejak audit penggunaan obat seluruh platform untuk kepatuhan regulasi.' },
    ],
  },
  subscription: {
    key: 'subscription',
    icon: '⭐',
    title: 'Langganan',
    description: 'Kelola paket langganan, penggantian tagihan, dan matriks akses fitur.',
    purpose:
      'Mengontrol lapisan langganan dan monetisasi TernakHub. Admin dapat menentukan tingkatan paket ' +
      '(Free, Basic, Pro, Enterprise), menetapkan harga, mengonfigurasi matriks akses fitur, mengelola ' +
      'penggantian tagihan, dan meninjau metrik kesehatan langganan.',
    subSections: [
      { key: 'plans',    icon: '📋', title: 'Paket',         description: 'Tentukan dan kelola tingkatan paket langganan, harga, dan konfigurasi percobaan.' },
      { key: 'billing',  icon: '💳', title: 'Tagihan',       description: 'Tinjau catatan tagihan, proses penggantian manual, dan lihat ringkasan pendapatan.' },
      { key: 'features', icon: '🔧', title: 'Matriks Fitur', description: 'Konfigurasikan fitur mana yang dapat diakses di bawah setiap paket langganan.' },
    ],
  },
  trust: {
    key: 'trust',
    icon: '✅',
    title: 'Kepercayaan & Verifikasi',
    description: 'Proses permintaan verifikasi workspace dan kelola tingkat kepercayaan platform.',
    purpose:
      'Mengelola lapisan kepercayaan dan kredibilitas marketplace TernakHub. Workspace dapat mengajukan ' +
      'lencana verifikasi resmi. Admin meninjau dokumen yang dikirimkan, menyetujui atau menolak permohonan, ' +
      'dan menetapkan tingkat kepercayaan yang memengaruhi visibilitas marketplace dan akses fitur.',
    subSections: [
      { key: 'pending',  icon: '⏳', title: 'Antrian Menunggu', description: 'Tinjau permintaan verifikasi masuk beserta dokumen dan detail workspace yang dikirimkan.' },
      { key: 'approved', icon: '✅', title: 'Disetujui',        description: 'Registri semua workspace terverifikasi dengan tanggal verifikasi dan jenis lencana.' },
      { key: 'rejected', icon: '❌', title: 'Ditolak',          description: 'Riwayat permohonan yang ditolak beserta alasan penolakan untuk pemrosesan banding.' },
    ],
  },
  announcements: {
    key: 'announcements',
    icon: '📢',
    title: 'Pengumuman',
    description: 'Buat dan kelola pengumuman dan spanduk seluruh platform.',
    purpose:
      'Memungkinkan administrator platform berkomunikasi langsung dengan semua pengguna atau segmen audiens tertentu. ' +
      'Admin dapat menerbitkan pemberitahuan pemeliharaan, pengumuman fitur, dan pembaruan regulasi, ' +
      'serta menjadwalkannya untuk publikasi mendatang dengan pengiriman bertarget.',
    subSections: [
      { key: 'published', icon: '✅', title: 'Diterbitkan', description: 'Semua pengumuman aktif yang saat ini terlihat oleh pengguna.' },
      { key: 'drafts',    icon: '✏️', title: 'Draf',        description: 'Pengumuman yang sedang dikerjakan dan belum diterbitkan.' },
      { key: 'scheduled', icon: '📅', title: 'Terjadwal',   description: 'Pengumuman dalam antrian untuk publikasi mendatang dengan waktu pengiriman yang dikonfigurasi.' },
    ],
  },
  notifications: {
    key: 'notifications',
    icon: '🔔',
    title: 'Notifikasi',
    description: 'Kelola template notifikasi platform, log pengiriman, dan pengaturan push.',
    purpose:
      'Mengontrol infrastruktur notifikasi yang mendorong semua peringatan dalam aplikasi, ringkasan email, dan ' +
      'notifikasi push. Admin dapat mengedit template pesan, meninjau tingkat keberhasilan pengiriman, ' +
      'mengonfigurasi pemicu notifikasi, dan mengelola catatan opt-out.',
    subSections: [
      { key: 'all',       icon: '📋', title: 'Semua Notifikasi', description: 'Log lengkap semua notifikasi yang dikirim di seluruh platform dengan status pengiriman.' },
      { key: 'templates', icon: '📝', title: 'Template',         description: 'Edit dan pratinjau template pesan notifikasi untuk semua jenis pemicu.' },
    ],
  },
  reports: {
    key: 'reports',
    icon: '🚩',
    title: 'Laporan',
    description: 'Tinjau dan tindak lanjuti semua laporan, tanda, dan eskalasi yang dikirimkan pengguna.',
    purpose:
      'Antrian triase pusat untuk semua laporan yang dibuat pengguna. Admin dapat meninjau laporan yang dikategorikan ' +
      'berdasarkan jenis (perilaku pengguna, kebijakan konten, penipuan finansial), menetapkan tingkat keparahan, mengambil tindakan ' +
      '(peringatan, penangguhan, pemblokiran), dan melacak status penyelesaian.',
    subSections: [
      { key: 'user',      icon: '👤', title: 'Laporan Pengguna', description: 'Laporan yang menargetkan akun pengguna — pelecehan, peniruan identitas, penipuan.' },
      { key: 'content',   icon: '📄', title: 'Laporan Konten',   description: 'Laporan yang menargetkan listing, pengumuman, atau item konten lainnya.' },
      { key: 'financial', icon: '💰', title: 'Keuangan',         description: 'Sengketa transaksi, laporan penipuan pembayaran, dan eskalasi escrow.' },
    ],
  },
  monitoring: {
    key: 'monitoring',
    icon: '📡',
    title: 'Pemantauan',
    description: 'Kesehatan sistem real-time, pelacakan kesalahan, dan metrik performa.',
    purpose:
      'Memberikan visibilitas operasional ke dalam infrastruktur platform TernakHub. Admin dapat memantau ' +
      'waktu respons API, performa kueri database, tingkat kesalahan, kedalaman antrian, dan pemanfaatan penyimpanan. ' +
      'Peringatan dan pelanggaran SLA ditampilkan di sini untuk tindakan segera.',
    subSections: [
      { key: 'health', icon: '❤️', title: 'Kesehatan Sistem', description: 'Status langsung semua layanan platform dengan metrik uptime dan latensi.' },
      { key: 'errors', icon: '⚠️', title: 'Log Kesalahan',    description: 'Log kesalahan dan pengecualian yang diagregasi dengan stack trace dan analisis frekuensi.' },
      { key: 'perf',   icon: '⚡', title: 'Performa',         description: 'Throughput API, persentil waktu respons, dan analitik kueri database.' },
    ],
  },
  'data-master': {
    key: 'data-master',
    icon: '🗂️',
    title: 'Data Master',
    description: 'Kelola kategori data master, tabel lookup, dan pipeline impor massal.',
    purpose:
      'Modul Data Master adalah tulang punggung lapisan data referensi TernakHub. Admin mengelola ' +
      'katalog spesies, registri ras, taksonomi penyakit, data lokasi, dan tabel lookup lainnya ' +
      'yang direferensikan oleh semua modul tingkat workspace di seluruh platform.',
    subSections: [
      { key: 'categories', icon: '📁', title: 'Kategori',      description: 'Kategori data tingkat atas: Spesies, Ras, Penyakit, Lokasi, dan lainnya.' },
      { key: 'master',     icon: '📋', title: 'Daftar Master', description: 'Kelola daftar lookup individual dengan kemampuan tambah, ubah, arsip.' },
      { key: 'imports',    icon: '📥', title: 'Impor',         description: 'Pipeline impor massal untuk pengisian atau pembaruan data referensi master.' },
    ],
  },
  settings: {
    key: 'settings',
    icon: '⚙️',
    title: 'Pengaturan',
    description: 'Konfigurasikan pengaturan platform, kebijakan keamanan, API keys, dan pengiriman email.',
    purpose:
      'Pusat konfigurasi seluruh platform. Admin dapat memperbarui pengaturan platform umum (nama, logo, ' +
      'lokal), menerapkan kebijakan keamanan (aturan kata sandi, persyaratan 2FA), mengelola kredensial API ' +
      'untuk integrasi pihak ketiga, dan mengonfigurasi penyedia pengiriman email.',
    subSections: [
      { key: 'general',  icon: '🔧', title: 'Umum',     description: 'Nama platform, logo, zona waktu, bahasa, dan pengaturan mode pemeliharaan.' },
      { key: 'security', icon: '🔒', title: 'Keamanan', description: 'Kebijakan kata sandi, penegakan 2FA, batas waktu sesi, dan daftar izin IP.' },
      { key: 'api',      icon: '🔑', title: 'API Keys', description: 'Kelola kredensial API untuk integrasi layanan pihak ketiga.' },
      { key: 'email',    icon: '📧', title: 'Email',    description: 'Konfigurasi penyedia pengiriman email, template, dan log pengiriman.' },
    ],
  },
};
