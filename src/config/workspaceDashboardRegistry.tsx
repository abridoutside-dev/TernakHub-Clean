// ─── Workspace Dashboard Registry — WORKSPACE-001B ───────────────────────────
//
// Extends the core workspace registry (workspaceRegistry.ts) with React-level
// concerns: dashboard component, livestock component, and quick actions.
//
// ARCHITECTURE:
//   workspaceRegistry.ts       — configuration-only (no React, no imports).
//   workspaceDashboardRegistry — React layer on top; maps WorkspaceKind to
//                                component references and UI metadata.
//
// RULES:
//   - This is the single place that binds WorkspaceKind → dashboard component.
//   - No switch-case scattered across the app — always read from this registry.
//   - Farm's Dashboard component is imported unchanged; do NOT modify it here.
//   - quickActions is seeded empty; populated in future milestones.
//   - livestockComponent is null for all non-Farm workspace kinds (those
//     workspaces don't manage livestock). Farm's livestock routing is handled
//     by App.tsx; the slot is reserved for future dynamic routing needs.
//
// USAGE:
//   import { getWorkspaceDashboardConfig } from '@/config/workspaceDashboardRegistry';
//   const cfg = getWorkspaceDashboardConfig('FeedStore');
//   // cfg.dashboardComponent → FeedStoreDashboard (placeholder)
//   // cfg.quickActions       → []
//   // cfg.defaultRoute       → '/workspace/:id/feed-store'

import React from 'react';

import {
  WORKSPACE_REGISTRY,
  WORKSPACE_KINDS,
  type WorkspaceKind,
} from './workspaceRegistry';

// ─── Component imports ────────────────────────────────────────────────────────
// Farm: existing Dashboard — MUST NOT be modified (WORKSPACE-001B constraint).
import FarmDashboard from '../pages/Dashboard';

// Non-Farm: placeholder dashboards introduced in WORKSPACE-001B.
import FeedStoreDashboard  from '../pages/workspaceDashboards/FeedStoreDashboard';
import DrugStoreDashboard  from '../pages/workspaceDashboards/DrugStoreDashboard';
import DokterHewanDashboard from '../pages/workspaceDashboards/DokterHewanDashboard';
import KlinikHewanDashboard from '../pages/workspaceDashboards/KlinikHewanDashboard';
import TransportDashboard  from '../pages/workspaceDashboards/TransportDashboard';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A single quick-action entry for the workspace dashboard.
 * quickActions is empty for all workspace kinds in WORKSPACE-001B.
 * Populated in future milestones (e.g. WORKSPACE-002).
 */
export interface WorkspaceQuickAction {
  /** Stable unique key within this workspace kind. */
  id: string;
  /** Short display label in Indonesian. */
  label: string;
  /** Emoji or icon identifier. */
  icon: string;
  /** Route to navigate to. May contain ':id' placeholder. */
  route: string;
}

/**
 * Dashboard-level configuration for a workspace kind.
 * Combines display metadata (sourced from the core registry) with React
 * component references and UI-layer concerns.
 */
export interface WorkspaceDashboardConfig {
  /** Registry key — matches WorkspaceKind. */
  kind: WorkspaceKind;

  /**
   * Full display name in Indonesian.
   * Sourced from WorkspaceConfig.nama to keep a single source of truth.
   */
  title: string;

  /**
   * One-line description in Indonesian.
   * Sourced from WorkspaceConfig.deskripsi.
   */
  subtitle: string;

  /**
   * Emoji icon for this workspace kind.
   * Sourced from WorkspaceConfig.icon.
   */
  icon: string;

  /**
   * Shortcut actions shown on the dashboard.
   * Empty array in WORKSPACE-001B; populated in future milestones.
   */
  quickActions: WorkspaceQuickAction[];

  /**
   * The React component to render as this workspace's main dashboard.
   *
   * Farm → existing Dashboard.tsx (unchanged).
   * Others → placeholder components introduced in WORKSPACE-001B.
   */
  dashboardComponent: React.ComponentType;

  /**
   * React component that renders this workspace's livestock/asset list.
   *
   * Farm's livestock routing is managed by App.tsx; this slot is reserved
   * for future dynamic routing. Currently null for all workspace kinds.
   *
   * Set to a real component in a future milestone when the app dynamically
   * resolves the livestock/asset view based on the active workspace kind.
   */
  livestockComponent: React.ComponentType | null;

  /**
   * Primary navigation target when the user opens this workspace.
   * May contain ':id' placeholder — use resolveWorkspaceRoute() to expand.
   * Sourced from WorkspaceConfig.routeDashboard.
   */
  defaultRoute: string;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

/**
 * Master dashboard registry — one WorkspaceDashboardConfig per WorkspaceKind.
 * Keyed by WorkspaceKind for O(1) lookup.
 *
 * Source-of-truth fields (title, subtitle, icon, defaultRoute) are read
 * directly from WORKSPACE_REGISTRY to avoid duplication.
 */
const WORKSPACE_DASHBOARD_REGISTRY: Record<WorkspaceKind, WorkspaceDashboardConfig> = {

  // ── Farm ───────────────────────────────────────────────────────────────────
  // Baseline implementation. dashboardComponent must remain the existing
  // Dashboard.tsx — do NOT swap or wrap it (WORKSPACE-001B constraint).
  Farm: {
    kind:               'Farm',
    title:              WORKSPACE_REGISTRY.Farm.nama,
    subtitle:           WORKSPACE_REGISTRY.Farm.deskripsi,
    icon:               WORKSPACE_REGISTRY.Farm.icon,
    quickActions:       [],
    dashboardComponent: FarmDashboard,
    livestockComponent: null,
    defaultRoute:       WORKSPACE_REGISTRY.Farm.routeDashboard,
  },

  // ── Toko Pakan ─────────────────────────────────────────────────────────────
  FeedStore: {
    kind:               'FeedStore',
    title:              WORKSPACE_REGISTRY.FeedStore.nama,
    subtitle:           WORKSPACE_REGISTRY.FeedStore.deskripsi,
    icon:               WORKSPACE_REGISTRY.FeedStore.icon,
    quickActions: [
      { id: 'stok-masuk',    label: 'Stok Masuk',    icon: '📥', route: `${WORKSPACE_REGISTRY.FeedStore.routeUtama}?tab=operational&action=stok-masuk` },
      { id: 'stok-keluar',   label: 'Stok Keluar',   icon: '📤', route: `${WORKSPACE_REGISTRY.FeedStore.routeUtama}?tab=operational&action=stok-keluar` },
      { id: 'penjualan',     label: 'Buat Penjualan', icon: '🧾', route: `${WORKSPACE_REGISTRY.FeedStore.routeUtama}?tab=operational&action=penjualan` },
      { id: 'pembelian',     label: 'Buat Pembelian', icon: '🛒', route: `${WORKSPACE_REGISTRY.FeedStore.routeUtama}?tab=operational&action=pembelian` },
    ],
    dashboardComponent: FeedStoreDashboard,
    livestockComponent: null,
    defaultRoute:       WORKSPACE_REGISTRY.FeedStore.routeDashboard,
  },

  // ── Toko Obat Hewan ────────────────────────────────────────────────────────
  DrugStore: {
    kind:               'DrugStore',
    title:              WORKSPACE_REGISTRY.DrugStore.nama,
    subtitle:           WORKSPACE_REGISTRY.DrugStore.deskripsi,
    icon:               WORKSPACE_REGISTRY.DrugStore.icon,
    quickActions: [
      { id: 'tambah-produk',      label: 'Tambah Produk',      icon: '＋',  route: '/workspace/:id/drug-store/stok-masuk' },
      { id: 'stok-masuk',         label: 'Stok Masuk',         icon: '📥', route: '/workspace/:id/drug-store/stok-masuk' },
      { id: 'stok-keluar',        label: 'Stok Keluar',        icon: '📤', route: '/workspace/:id/drug-store/stok-keluar' },
      { id: 'penjualan',          label: 'Buat Penjualan',     icon: '🧾', route: '/workspace/:id/drug-store/sales/new' },
      { id: 'pembelian',          label: 'Buat Pembelian',     icon: '🛒', route: '/workspace/:id/drug-store/orders/new' },
      { id: 'penyesuaian-stok',   label: 'Penyesuaian Stok',  icon: '⚖️', route: '/workspace/:id/drug-store/penyesuaian-stok' },
    ],
    dashboardComponent: DrugStoreDashboard,
    livestockComponent: null,
    defaultRoute:       WORKSPACE_REGISTRY.DrugStore.routeDashboard,
  },

  // ── Dokter Hewan ──────────────────────────────────────────────────────────
  DokterHewan: {
    kind:               'DokterHewan',
    title:              WORKSPACE_REGISTRY.DokterHewan.nama,
    subtitle:           WORKSPACE_REGISTRY.DokterHewan.deskripsi,
    icon:               WORKSPACE_REGISTRY.DokterHewan.icon,
    quickActions: [
      { id: 'pemeriksaan', label: 'Pemeriksaan', icon: '🩺', route: `${WORKSPACE_REGISTRY.DokterHewan.routeUtama}?action=pemeriksaan` },
      { id: 'tindakan',    label: 'Tindakan',    icon: '💉', route: `${WORKSPACE_REGISTRY.DokterHewan.routeUtama}?action=tindakan`    },
      { id: 'jadwal',      label: 'Jadwal',      icon: '📅', route: `${WORKSPACE_REGISTRY.DokterHewan.routeUtama}?action=jadwal`      },
      { id: 'pasien',      label: 'Pasien',      icon: '🐄', route: `${WORKSPACE_REGISTRY.DokterHewan.routeUtama}?action=pasien`      },
    ],
    dashboardComponent: DokterHewanDashboard,
    livestockComponent: null,
    defaultRoute:       WORKSPACE_REGISTRY.DokterHewan.routeDashboard,
  },

  // ── Klinik Hewan ──────────────────────────────────────────────────────────
  KlinikHewan: {
    kind:               'KlinikHewan',
    title:              WORKSPACE_REGISTRY.KlinikHewan.nama,
    subtitle:           WORKSPACE_REGISTRY.KlinikHewan.deskripsi,
    icon:               WORKSPACE_REGISTRY.KlinikHewan.icon,
    quickActions: [
      { id: 'kunjungan',   label: 'Kunjungan',   icon: '🏥', route: `${WORKSPACE_REGISTRY.KlinikHewan.routeUtama}?action=kunjungan`   },
      { id: 'pemeriksaan', label: 'Pemeriksaan', icon: '🩺', route: `${WORKSPACE_REGISTRY.KlinikHewan.routeUtama}?action=pemeriksaan` },
      { id: 'tindakan',    label: 'Tindakan',    icon: '💉', route: `${WORKSPACE_REGISTRY.KlinikHewan.routeUtama}?action=tindakan`    },
      { id: 'jadwal',      label: 'Jadwal',      icon: '📅', route: `${WORKSPACE_REGISTRY.KlinikHewan.routeUtama}?action=jadwal`      },
    ],
    dashboardComponent: KlinikHewanDashboard,
    livestockComponent: null,
    defaultRoute:       WORKSPACE_REGISTRY.KlinikHewan.routeDashboard,
  },

  // ── Jasa Transport ────────────────────────────────────────────────────────
  Transport: {
    kind:               'Transport',
    title:              WORKSPACE_REGISTRY.Transport.nama,
    subtitle:           WORKSPACE_REGISTRY.Transport.deskripsi,
    icon:               WORKSPACE_REGISTRY.Transport.icon,
    quickActions:       [],
    dashboardComponent: TransportDashboard,
    livestockComponent: null,
    defaultRoute:       WORKSPACE_REGISTRY.Transport.routeDashboard,
  },

} as const;

/** Flat list of all dashboard configs in declaration order. */
export const WORKSPACE_DASHBOARD_REGISTRY_LIST: WorkspaceDashboardConfig[] =
  WORKSPACE_KINDS.map((k) => WORKSPACE_DASHBOARD_REGISTRY[k]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Look up the dashboard configuration for a given WorkspaceKind.
 *
 * @param kind  The workspace kind key.
 * @returns     The full WorkspaceDashboardConfig for that kind.
 */
export function getWorkspaceDashboardConfig(kind: WorkspaceKind): WorkspaceDashboardConfig {
  return WORKSPACE_DASHBOARD_REGISTRY[kind];
}

/**
 * Resolve the dashboard component for a workspace kind.
 * Convenience wrapper — avoids callers from destructuring the full config
 * when they only need the component.
 *
 * @param kind  The workspace kind key.
 * @returns     The React component to render as the dashboard.
 */
export function getDashboardComponent(kind: WorkspaceKind): React.ComponentType {
  return WORKSPACE_DASHBOARD_REGISTRY[kind].dashboardComponent;
}
