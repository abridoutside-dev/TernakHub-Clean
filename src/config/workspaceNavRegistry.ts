// ─── Workspace Bottom Navigation Registry — WORKSPACE-001C ───────────────────
//
// Single source of truth for the Bottom Navigation configuration of every
// workspace kind supported by TernakHub.
//
// ARCHITECTURE:
//   workspaceRegistry.ts    — product-level config (routes, colours, db type).
//   workspaceDashboardRegistry.tsx — React component bindings.
//   workspaceNavRegistry.ts — bottom-nav item sets & ordering (THIS FILE).
//
// RULES:
//   - Config-only. No React, no component imports, no hooks.
//   - No switch-case or if-else in callers — always use getWorkspaceNavConfig().
//   - Shared items (Marketplace, News & Event, Profil) are defined ONCE as
//     constants and referenced by every workspace entry — never duplicated.
//   - Farm's two workspace-specific items ('home', 'operational') must match
//     the hardcoded NAV_ITEMS in BottomNav.tsx exactly so that when the
//     component migrates to this registry the behaviour is unchanged.
//   - Non-Farm routes may contain ':id' placeholders. Callers must expand them
//     with resolveNavItemRoute() before rendering.
//
// USAGE:
//   import { getWorkspaceNavConfig, getResolvedNavItems } from
//     '@/config/workspaceNavRegistry';
//
//   // Config lookup (routes still contain ':id')
//   const cfg = getWorkspaceNavConfig('FeedStore');
//
//   // Fully resolved nav items ready for rendering
//   const items = getResolvedNavItems('FeedStore', workspaceId);

import {
  WORKSPACE_REGISTRY,
  WORKSPACE_KINDS,
  type WorkspaceKind,
} from './workspaceRegistry';

// ─── NavItemId ────────────────────────────────────────────────────────────────

/**
 * Stable identifiers for each bottom-nav slot.
 *
 * 'home'        — workspace dashboard / overview (workspace-specific).
 * 'operational' — primary feature hub, e.g. Livestock, Produk (workspace-specific).
 * 'marketplace' — TernakHub Marketplace (shared across all workspace kinds).
 * 'news-event'  — News & Event hub (shared).
 * 'profile'     — User / workspace profile (shared).
 */
export type NavItemId =
  | 'home'
  | 'operational'
  | 'marketplace'
  | 'news-event'
  | 'profile';

// ─── WorkspaceNavItem ─────────────────────────────────────────────────────────

/**
 * A single bottom-navigation entry.
 */
export interface WorkspaceNavItem {
  /** Stable slot identifier — used as React key and for defaultTab matching. */
  id: NavItemId;

  /** Short display label in Indonesian (max ~10 chars for mobile). */
  label: string;

  /** Emoji icon rendered above the label. */
  icon: string;

  /**
   * Navigation target.
   * Farm routes are absolute (e.g. '/', '/livestock').
   * Non-Farm routes may contain ':id' as the workspace UUID placeholder.
   * Always expand with resolveNavItemRoute() before passing to NavLink.
   */
  route: string;

  /**
   * When true the NavLink's `end` prop is set, preventing prefix-matching.
   * Required for the root route ('/') so it is only active on exact '/'.
   */
  end: boolean;
}

// ─── WorkspaceNavConfig ───────────────────────────────────────────────────────

/**
 * Full bottom-navigation configuration for one workspace kind.
 * Items are stored in display order (left → right).
 */
export interface WorkspaceNavConfig {
  /** Registry key — matches WorkspaceKind. */
  kind: WorkspaceKind;

  /**
   * Ordered list of bottom-nav items for this workspace kind.
   * Always 5 items: [home, operational, marketplace, news-event, profile].
   */
  items: [
    WorkspaceNavItem,  // home        — workspace-specific
    WorkspaceNavItem,  // operational — workspace-specific
    WorkspaceNavItem,  // marketplace — shared
    WorkspaceNavItem,  // news-event  — shared
    WorkspaceNavItem,  // profile     — shared
  ];

  /**
   * The NavItemId that should be treated as the default / landing tab.
   * Always 'home' in WORKSPACE-001C; may be overridden in future milestones.
   */
  defaultTab: NavItemId;

  /**
   * When true, the 'home' and 'operational' nav items share a single shell
   * route distinguished only by a '?tab=' query parameter.
   *
   * BottomNav will:
   *   1. Append '?tab=<item.id>' to the route for home/operational items.
   *   2. Use the query parameter — not react-router's isActive — to determine
   *      the active highlight for those two items.
   *
   * Set to true only for workspace kinds where routeDashboard === routeUtama
   * (same URL for both home and operational tabs).
   * Introduced in WORKSPACE-001E for FeedStore.
   */
  tabBased: boolean;
}

// ─── Shared items (identical across all workspace kinds) ──────────────────────
//
// Defined once here; referenced by every registry entry below.
// Changing a shared item here updates every workspace automatically.

const MARKETPLACE_ITEM: WorkspaceNavItem = {
  id:    'marketplace',
  label: 'Marketplace',
  icon:  '🛒',
  route: '/marketplace',
  end:   false,
};

const NEWS_EVENT_ITEM: WorkspaceNavItem = {
  id:    'news-event',
  label: 'News & Event',
  icon:  '📰',
  route: '/news-event',
  end:   false,
};

const PROFILE_ITEM: WorkspaceNavItem = {
  id:    'profile',
  label: 'Profil',
  icon:  '👤',
  route: '/profile',
  end:   false,
};

// ─── Registry ─────────────────────────────────────────────────────────────────

/**
 * Master bottom-navigation registry — one WorkspaceNavConfig per WorkspaceKind.
 * Keyed by WorkspaceKind for O(1) lookup.
 *
 * IMPORTANT: The Farm entry's 'home' and 'operational' items MUST match the
 * hardcoded NAV_ITEMS in src/components/BottomNav.tsx exactly.
 * Do NOT change Farm routes or labels without updating BottomNav.tsx in sync.
 */
export const WORKSPACE_NAV_REGISTRY: Record<WorkspaceKind, WorkspaceNavConfig> = {

  // ── Farm (Peternakan) ─────────────────────────────────────────────────────
  // These two items mirror the first two entries in BottomNav.tsx NAV_ITEMS.
  Farm: {
    kind: 'Farm',
    items: [
      {
        id:    'home',
        label: 'Dashboard',
        icon:  '🏠',
        route: '/dashboard',
        end:   true,   // root route — must use `end` to prevent prefix-matching
      },
      {
        id:    'operational',
        label: 'Livestock',
        icon:  '🐑',
        route: '/livestock',
        end:   false,
      },
      MARKETPLACE_ITEM,
      NEWS_EVENT_ITEM,
      PROFILE_ITEM,
    ],
    defaultTab: 'home',
    tabBased:   false,
  },

  // ── Toko Pakan ─────────────────────────────────────────────────────────────
  // tabBased: true — routeDashboard and routeUtama share one shell URL;
  // home/operational are distinguished by '?tab=home' / '?tab=operational'.
  FeedStore: {
    kind: 'FeedStore',
    items: [
      {
        id:    'home',
        label: 'Dashboard',
        icon:  '🏠',
        route: WORKSPACE_REGISTRY.FeedStore.routeDashboard,  // '/workspace/:id/feed-store'
        end:   false,
      },
      {
        id:    'operational',
        label: 'Toko Pakan',
        icon:  WORKSPACE_REGISTRY.FeedStore.icon,            // '🌾'
        route: WORKSPACE_REGISTRY.FeedStore.routeUtama,      // '/workspace/:id/feed-store'
        end:   false,
      },
      MARKETPLACE_ITEM,
      NEWS_EVENT_ITEM,
      PROFILE_ITEM,
    ],
    defaultTab: 'home',
    tabBased:   true,
  },

  // ── Toko Obat Hewan ────────────────────────────────────────────────────────
  // tabBased: true — routeDashboard dan routeUtama berbagi satu shell URL;
  // home/operational dibedakan oleh '?tab=home' / '?tab=operational'.
  DrugStore: {
    kind: 'DrugStore',
    items: [
      {
        id:    'home',
        label: 'Dashboard',
        icon:  '🏠',
        route: WORKSPACE_REGISTRY.DrugStore.routeDashboard,  // '/workspace/:id/drug-store'
        end:   false,
      },
      {
        id:    'operational',
        label: 'Toko Obat',
        icon:  WORKSPACE_REGISTRY.DrugStore.icon,            // '💊'
        route: WORKSPACE_REGISTRY.DrugStore.routeUtama,      // '/workspace/:id/drug-store'
        end:   false,
      },
      MARKETPLACE_ITEM,
      NEWS_EVENT_ITEM,
      PROFILE_ITEM,
    ],
    defaultTab: 'home',
    tabBased:   true,
  },

  // ── Dokter Hewan ──────────────────────────────────────────────────────────
  DokterHewan: {
    kind: 'DokterHewan',
    items: [
      {
        id:    'home',
        label: 'Dashboard',
        icon:  '🏠',
        route: WORKSPACE_REGISTRY.DokterHewan.routeDashboard, // '/workspace/:id/veterinary'
        end:   false,
      },
      {
        id:    'operational',
        label: 'Layanan',
        icon:  WORKSPACE_REGISTRY.DokterHewan.icon,           // '🩺'
        route: WORKSPACE_REGISTRY.DokterHewan.routeUtama,     // '/workspace/:id/veterinary'
        end:   false,
      },
      MARKETPLACE_ITEM,
      NEWS_EVENT_ITEM,
      PROFILE_ITEM,
    ],
    defaultTab: 'home',
    tabBased:   false,
  },

  // ── Klinik Hewan ──────────────────────────────────────────────────────────
  KlinikHewan: {
    kind: 'KlinikHewan',
    items: [
      {
        id:    'home',
        label: 'Dashboard',
        icon:  '🏠',
        route: WORKSPACE_REGISTRY.KlinikHewan.routeDashboard, // '/workspace/:id/veterinary'
        end:   false,
      },
      {
        id:    'operational',
        label: 'Klinik',
        icon:  WORKSPACE_REGISTRY.KlinikHewan.icon,           // '🏥'
        route: WORKSPACE_REGISTRY.KlinikHewan.routeUtama,     // '/workspace/:id/veterinary'
        end:   false,
      },
      MARKETPLACE_ITEM,
      NEWS_EVENT_ITEM,
      PROFILE_ITEM,
    ],
    defaultTab: 'home',
    tabBased:   false,
  },

  // ── Jasa Transport ────────────────────────────────────────────────────────
  Transport: {
    kind: 'Transport',
    items: [
      {
        id:    'home',
        label: 'Dashboard',
        icon:  '🏠',
        route: WORKSPACE_REGISTRY.Transport.routeDashboard,   // '/workspace/:id/transport'
        end:   false,
      },
      {
        id:    'operational',
        label: 'Armada',
        icon:  WORKSPACE_REGISTRY.Transport.icon,             // '🚚'
        route: WORKSPACE_REGISTRY.Transport.routeUtama,       // '/workspace/:id/transport'
        end:   false,
      },
      MARKETPLACE_ITEM,
      NEWS_EVENT_ITEM,
      PROFILE_ITEM,
    ],
    defaultTab: 'home',
    tabBased:   true,
  },

} as const;

/** Flat list of all nav configs in declaration order. */
export const WORKSPACE_NAV_REGISTRY_LIST: WorkspaceNavConfig[] =
  WORKSPACE_KINDS.map((k) => WORKSPACE_NAV_REGISTRY[k]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Look up the bottom-navigation config for a given WorkspaceKind.
 *
 * @param kind  The workspace kind key.
 * @returns     The full WorkspaceNavConfig for that kind.
 */
export function getWorkspaceNavConfig(kind: WorkspaceKind): WorkspaceNavConfig {
  return WORKSPACE_NAV_REGISTRY[kind];
}

/**
 * Replace the ':id' placeholder in a nav item route with a real workspace UUID.
 * Items whose routes do not contain ':id' (shared items & Farm) are returned
 * with their route unchanged.
 *
 * @example
 *   resolveNavItemRoute(feedStoreHomeItem, 'ws-abc-123')
 *   // → { ...item, route: '/workspace/ws-abc-123/feed-store' }
 *
 * @param item         The WorkspaceNavItem to resolve.
 * @param workspaceId  Workspace UUID to substitute into ':id'.
 * @returns            A new WorkspaceNavItem with the route fully resolved.
 */
export function resolveNavItemRoute(
  item: WorkspaceNavItem,
  workspaceId: string,
): WorkspaceNavItem {
  return {
    ...item,
    route: item.route.replace(':id', workspaceId),
  };
}

/**
 * Return the fully-resolved nav items for a workspace kind, ready for rendering.
 * All ':id' placeholders are expanded; the order matches WorkspaceNavConfig.items.
 *
 * @param kind         WorkspaceKind key.
 * @param workspaceId  Workspace UUID to substitute into ':id' placeholders.
 * @returns            Ordered array of WorkspaceNavItems with resolved routes.
 */
export function getResolvedNavItems(
  kind: WorkspaceKind,
  workspaceId: string,
): WorkspaceNavItem[] {
  return WORKSPACE_NAV_REGISTRY[kind].items.map((item) =>
    resolveNavItemRoute(item, workspaceId),
  );
}

/**
 * Find the default nav item for a workspace kind.
 * Convenience wrapper that resolves the defaultTab id to the full item.
 *
 * @param kind         WorkspaceKind key.
 * @param workspaceId  Workspace UUID to substitute into ':id' placeholders.
 * @returns            The resolved WorkspaceNavItem for the default tab.
 */
export function getDefaultNavItem(
  kind: WorkspaceKind,
  workspaceId: string,
): WorkspaceNavItem {
  const cfg = WORKSPACE_NAV_REGISTRY[kind];
  const item = cfg.items.find((i) => i.id === cfg.defaultTab) ?? cfg.items[0];
  return resolveNavItemRoute(item, workspaceId);
}
