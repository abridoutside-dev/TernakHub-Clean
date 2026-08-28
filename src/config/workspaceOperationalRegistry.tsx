// ─── Workspace Operational Registry — WORKSPACE-001D ─────────────────────────
//
// Single source of truth that binds each WorkspaceKind to its Operational
// Dashboard component (the "Livestock / Operasional" tab content).
//
// ARCHITECTURE:
//   workspaceRegistry.ts         — product-level config (routes, colours, dbType).
//   workspaceDashboardRegistry   — home/overview dashboard component per kind.
//   workspaceOperationalRegistry — operational hub component per kind (THIS FILE).
//   workspaceNavRegistry.ts      — bottom-nav item sets & ordering.
//
// DISTINCTION:
//   dashboardComponent   (WORKSPACE-001B) → home tab — overview / analytics.
//   operationalComponent (WORKSPACE-001D) → operational tab — primary feature hub
//     (livestock list for Farm, products for FeedStore, services for vets, etc.)
//
// RULES:
//   - No switch-case or if-else in callers — use getWorkspaceOperationalConfig().
//   - Farm's operationalComponent is the existing Livestock page — MUST NOT be
//     modified or wrapped (WORKSPACE-001D constraint).
//   - Non-Farm components are placeholders introduced in WORKSPACE-001D;
//     they live in src/pages/workspaceOperational/.
//   - Routes (defaultRoute) are sourced from WORKSPACE_REGISTRY.routeUtama
//     to keep a single source of truth for navigation targets.
//
// USAGE:
//   import { getWorkspaceOperationalConfig } from
//     '@/config/workspaceOperationalRegistry';
//   const cfg = getWorkspaceOperationalConfig('FeedStore');
//   // cfg.operationalComponent → FeedStoreOperational (placeholder)
//   // cfg.defaultRoute         → '/workspace/:id/feed-store'

import React from 'react';

import {
  WORKSPACE_REGISTRY,
  WORKSPACE_KINDS,
  type WorkspaceKind,
} from './workspaceRegistry';

// ─── Component imports ────────────────────────────────────────────────────────
// Farm: existing Livestock page — MUST NOT be modified (WORKSPACE-001D constraint).
import FarmOperational from '../pages/Livestock';

// Non-Farm: placeholder operational components introduced in WORKSPACE-001D.
import FeedStoreOperational  from '../pages/workspaceOperational/FeedStoreOperational';
import DrugStoreOperational  from '../pages/workspaceOperational/DrugStoreOperational';
import DokterHewanOperational from '../pages/workspaceOperational/DokterHewanOperational';
import KlinikHewanOperational from '../pages/workspaceOperational/KlinikHewanOperational';
// Transport: real tab-aware workspace page (Dashboard Home + Armada) — see App.tsx route /workspace/:id/transport
import TransportWorkspace  from '../pages/TransportWorkspace';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Operational Dashboard configuration for a single workspace kind.
 */
export interface WorkspaceOperationalConfig {
  /** Registry key — matches WorkspaceKind. */
  kind: WorkspaceKind;

  /**
   * Display name of the operational section in Indonesian.
   * Used in page headers, tab labels, and breadcrumbs.
   * Examples: 'Livestock' (Farm), 'Produk' (FeedStore), 'Layanan' (DokterHewan).
   */
  title: string;

  /**
   * One-line description of this operational section.
   * Used in tooltips, empty states, and onboarding copy.
   */
  subtitle: string;

  /**
   * Emoji icon for this operational section.
   * Sourced from WorkspaceConfig.icon to maintain visual consistency.
   */
  icon: string;

  /**
   * The React component that renders this workspace's operational hub.
   *
   * Farm     → existing Livestock.tsx (unchanged, baseline implementation).
   * Others   → placeholder components from src/pages/workspaceOperational/.
   */
  operationalComponent: React.ComponentType;

  /**
   * Primary navigation target for the operational tab.
   * Sourced from WorkspaceConfig.routeUtama — may contain ':id' placeholder.
   * Expand with resolveWorkspaceRoute() from workspaceRegistry before use.
   */
  defaultRoute: string;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

/**
 * Master operational registry — one WorkspaceOperationalConfig per WorkspaceKind.
 * Keyed by WorkspaceKind for O(1) lookup.
 *
 * IMPORTANT: The Farm entry's operationalComponent is the existing Livestock
 * page. Do NOT swap, wrap, or modify it here (WORKSPACE-001D constraint).
 */
const WORKSPACE_OPERATIONAL_REGISTRY: Record<WorkspaceKind, WorkspaceOperationalConfig> = {

  // ── Farm (Peternakan) ─────────────────────────────────────────────────────
  // Baseline implementation — operationalComponent must remain Livestock.tsx.
  Farm: {
    kind:                 'Farm',
    title:                'Livestock',
    subtitle:             'Daftar & manajemen ternak aktif, luar kandang, dan arsip',
    icon:                 WORKSPACE_REGISTRY.Farm.icon,       // '🐄'
    operationalComponent: FarmOperational,
    defaultRoute:         WORKSPACE_REGISTRY.Farm.routeUtama, // '/livestock'
  },

  // ── Toko Pakan ─────────────────────────────────────────────────────────────
  FeedStore: {
    kind:                 'FeedStore',
    title:                'Produk Pakan',
    subtitle:             'Manajemen produk, stok, & distribusi pasokan Toko Pakan',
    icon:                 WORKSPACE_REGISTRY.FeedStore.icon,       // '🌾'
    operationalComponent: FeedStoreOperational,
    defaultRoute:         WORKSPACE_REGISTRY.FeedStore.routeUtama, // '/workspace/:id/feed-store'
  },

  // ── Toko Obat Hewan ────────────────────────────────────────────────────────
  DrugStore: {
    kind:                 'DrugStore',
    title:                'Produk Obat',
    subtitle:             'Manajemen produk, stok obat, vaksin, & suplemen ternak',
    icon:                 WORKSPACE_REGISTRY.DrugStore.icon,       // '💊'
    operationalComponent: DrugStoreOperational,
    defaultRoute:         WORKSPACE_REGISTRY.DrugStore.routeUtama, // '/workspace/:id/drug-store'
  },

  // ── Dokter Hewan ──────────────────────────────────────────────────────────
  DokterHewan: {
    kind:                 'DokterHewan',
    title:                'Layanan Dokter',
    subtitle:             'Manajemen kasus, jadwal konsultasi, & riwayat pasien',
    icon:                 WORKSPACE_REGISTRY.DokterHewan.icon,       // '🩺'
    operationalComponent: DokterHewanOperational,
    defaultRoute:         WORKSPACE_REGISTRY.DokterHewan.routeUtama, // '/workspace/:id/veterinary'
  },

  // ── Klinik Hewan ──────────────────────────────────────────────────────────
  KlinikHewan: {
    kind:                 'KlinikHewan',
    title:                'Layanan Klinik',
    subtitle:             'Manajemen klinik, jadwal dokter, & rekam medis pasien',
    icon:                 WORKSPACE_REGISTRY.KlinikHewan.icon,       // '🏥'
    operationalComponent: KlinikHewanOperational,
    defaultRoute:         WORKSPACE_REGISTRY.KlinikHewan.routeUtama, // '/workspace/:id/veterinary'
  },

  // ── Jasa Transport ────────────────────────────────────────────────────────
  Transport: {
    kind:                 'Transport',
    title:                'Armada & Pengiriman',
    subtitle:             'Manajemen armada kendaraan & pengiriman ternak antar lokasi',
    icon:                 WORKSPACE_REGISTRY.Transport.icon,       // '🚚'
    operationalComponent: TransportWorkspace,
    defaultRoute:         WORKSPACE_REGISTRY.Transport.routeUtama, // '/workspace/:id/transport'
  },

} as const;

/** Flat list of all operational configs in declaration order. */
export const WORKSPACE_OPERATIONAL_REGISTRY_LIST: WorkspaceOperationalConfig[] =
  WORKSPACE_KINDS.map((k) => WORKSPACE_OPERATIONAL_REGISTRY[k]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Look up the operational configuration for a given WorkspaceKind.
 *
 * @param kind  The workspace kind key.
 * @returns     The full WorkspaceOperationalConfig for that kind.
 */
export function getWorkspaceOperationalConfig(
  kind: WorkspaceKind,
): WorkspaceOperationalConfig {
  return WORKSPACE_OPERATIONAL_REGISTRY[kind];
}

/**
 * Resolve the operational component for a workspace kind.
 * Convenience wrapper for callers that only need the component reference.
 *
 * @param kind  The workspace kind key.
 * @returns     The React component to render as the operational hub.
 */
export function getOperationalComponent(kind: WorkspaceKind): React.ComponentType {
  return WORKSPACE_OPERATIONAL_REGISTRY[kind].operationalComponent;
}
