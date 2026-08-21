// ─── Workspace Registry — WORKSPACE-001A ─────────────────────────────────────
//
// Single source of truth for workspace kind configuration.
//
// ARCHITECTURE:
//   WorkspaceKind  — product-level concept; 6 values; used by the registry.
//   WorkspaceType  — DB-level enum; 4 values (Farm, FeedStore, Veterinary,
//                    Transport); defined in src/types/workspace.ts.
//   These are intentionally different. The registry maps each WorkspaceKind to
//   its nearest DB WorkspaceType via the `dbType` field.
//
// RULES:
//   - This file is configuration-only. No React, no page imports, no hooks.
//   - WorkspaceType in src/types/workspace.ts must NOT be changed here.
//   - Workspace Farm implementation is the baseline and must not be modified.
//   - Add new workspace kinds by extending WorkspaceKind and WORKSPACE_REGISTRY.
//   - Routes use ':id' as the workspace UUID placeholder; callers replace it
//     via resolveWorkspaceRoute().
//
// USAGE:
//   import { getWorkspaceConfig, resolveWorkspaceRoute } from '@/config/workspaceRegistry';
//   const cfg = getWorkspaceConfig('Farm');
//   const url = resolveWorkspaceRoute(cfg.routeUtama, workspaceId);

import type { WorkspaceType, WorkspaceRecord } from '../types/workspace';

// ─── WorkspaceKind ────────────────────────────────────────────────────────────

/**
 * Product-level workspace kinds supported by TernakHub.
 * This is the registry key — one entry per distinct workspace type the product
 * exposes to users, regardless of the underlying DB WorkspaceType enum.
 *
 * - 'Farm'        → Peternakan
 * - 'FeedStore'   → Toko Pakan
 * - 'DrugStore'   → Toko Obat Hewan
 * - 'DokterHewan' → Dokter Hewan (solo / praktik mandiri)
 * - 'KlinikHewan' → Klinik Hewan (fasilitas multi-dokter)
 * - 'Transport'   → Jasa Transport & Logistik
 */
export type WorkspaceKind =
  | 'Farm'
  | 'FeedStore'
  | 'DrugStore'
  | 'DokterHewan'
  | 'KlinikHewan'
  | 'Transport';

/** Ordered list of all supported workspace kinds. */
export const WORKSPACE_KINDS: WorkspaceKind[] = [
  'Farm',
  'FeedStore',
  'DrugStore',
  'DokterHewan',
  'KlinikHewan',
  'Transport',
];

// ─── WorkspaceConfig ──────────────────────────────────────────────────────────

/**
 * Full configuration record for a single workspace kind.
 * All fields are mandatory — no optional values.
 */
export interface WorkspaceConfig {
  /**
   * Registry key — unique identifier for this workspace kind.
   * Matches the WorkspaceKind union value.
   */
  kind: WorkspaceKind;

  /**
   * Full display name in Indonesian.
   * Example: 'Peternakan', 'Toko Pakan'
   */
  nama: string;

  /**
   * Short one-line description in Indonesian.
   * Used in picker cards, tooltips, and onboarding.
   */
  deskripsi: string;

  /**
   * Emoji icon representing this workspace kind.
   * Used in headers, list items, and navigation chips.
   */
  icon: string;

  /**
   * Primary brand colour in hex.
   * Used for primary buttons, active states, and accent highlights.
   */
  primaryColor: string;

  /**
   * Light background colour in hex.
   * Used for badges, chip backgrounds, and card tints.
   */
  bgColor: string;

  /**
   * Text colour that contrasts with bgColor in hex.
   * Used for text rendered on bgColor surfaces.
   */
  textColor: string;

  /**
   * Nearest DB-level WorkspaceType for this kind.
   * Used when creating a new workspace via workspaceService / Supabase.
   * Multiple WorkspaceKinds may share the same dbType if the DB enum has not
   * yet been extended (e.g. DokterHewan and KlinikHewan both map to 'Veterinary').
   */
  dbType: WorkspaceType;

  /**
   * Dashboard route: the workspace's primary analytics / overview page.
   * May contain ':id' as a workspace UUID placeholder.
   *
   * Farm uses '/dashboard' (active-workspace context, no :id needed).
   * Other kinds use '/workspace/:id/<section>' patterns for future dashboards.
   */
  routeDashboard: string;

  /**
   * Main operational route: the primary feature hub for this workspace kind.
   * May contain ':id' as a workspace UUID placeholder.
   */
  routeUtama: string;

  /**
   * Settings route: workspace profile & configuration page.
   * Currently shared ('/workspace/settings/profile') across all kinds.
   * May be kind-specific in future milestones.
   */
  routePengaturan: string;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

/**
 * Master registry — one WorkspaceConfig per WorkspaceKind.
 * Keyed by WorkspaceKind for O(1) lookup.
 *
 * IMPORTANT: Do NOT modify the 'Farm' entry — it is the baseline implementation
 * and its routes must match the existing Farm workspace pages exactly.
 */
export const WORKSPACE_REGISTRY: Record<WorkspaceKind, WorkspaceConfig> = {

  // ── Farm ───────────────────────────────────────────────────────────────────
  // Baseline implementation — do not modify routes or dbType.
  Farm: {
    kind:          'Farm',
    nama:          'Peternakan',
    deskripsi:     'Manajemen ternak, pakan, kesehatan hewan, & reproduksi',
    icon:          '🐄',
    primaryColor:  '#2d7d46',
    bgColor:       '#e8f5ee',
    textColor:     '#1b5e35',
    dbType:        'Farm',
    // Farm uses the global active-workspace dashboard (no :id in URL).
    routeDashboard: '/dashboard',
    // Main operational hub for Farm: livestock list.
    routeUtama:    '/livestock',
    routePengaturan: '/workspace/settings/profile',
  },

  // ── Toko Pakan ─────────────────────────────────────────────────────────────
  FeedStore: {
    kind:          'FeedStore',
    nama:          'Toko Pakan',
    deskripsi:     'Operasional toko pakan, stok, & distribusi pasokan ternak',
    icon:          '🌾',
    primaryColor:  '#f57c00',
    bgColor:       '#fff8e1',
    textColor:     '#e65100',
    dbType:        'FeedStore',
    routeDashboard: '/workspace/:id/feed-store',
    routeUtama:    '/workspace/:id/feed-store',
    routePengaturan: '/workspace/settings/profile',
  },

  // ── Toko Obat Hewan ────────────────────────────────────────────────────────
  // dbType maps to 'Veterinary' until a dedicated DB enum value is added.
  DrugStore: {
    kind:          'DrugStore',
    nama:          'Toko Obat Hewan',
    deskripsi:     'Penjualan & stok obat, vaksin, suplemen, & peralatan ternak',
    icon:          '💊',
    primaryColor:  '#0097a7',
    bgColor:       '#e0f7fa',
    textColor:     '#006064',
    dbType:        'Veterinary',
    routeDashboard: '/workspace/:id/drug-store',
    routeUtama:    '/workspace/:id/drug-store',
    routePengaturan: '/workspace/settings/profile',
  },

  // ── Dokter Hewan ──────────────────────────────────────────────────────────
  // Solo / praktik mandiri. Uses existing Veterinary workspace page.
  DokterHewan: {
    kind:          'DokterHewan',
    nama:          'Dokter Hewan',
    deskripsi:     'Praktik mandiri & manajemen layanan veteriner per kasus',
    icon:          '🩺',
    primaryColor:  '#ad1457',
    bgColor:       '#fce4ec',
    textColor:     '#880e4f',
    dbType:        'Veterinary',
    routeDashboard: '/workspace/:id/veterinary',
    routeUtama:    '/workspace/:id/veterinary',
    routePengaturan: '/workspace/settings/profile',
  },

  // ── Klinik Hewan ──────────────────────────────────────────────────────────
  // Fasilitas multi-dokter. Shares Veterinary workspace page for now.
  KlinikHewan: {
    kind:          'KlinikHewan',
    nama:          'Klinik Hewan',
    deskripsi:     'Fasilitas klinik veteriner multi-dokter & manajemen jadwal',
    icon:          '🏥',
    primaryColor:  '#7b1fa2',
    bgColor:       '#f3e5f5',
    textColor:     '#4a148c',
    dbType:        'Veterinary',
    routeDashboard: '/workspace/:id/veterinary',
    routeUtama:    '/workspace/:id/veterinary',
    routePengaturan: '/workspace/settings/profile',
  },

  // ── Jasa Transport ────────────────────────────────────────────────────────
  Transport: {
    kind:          'Transport',
    nama:          'Jasa Transport',
    deskripsi:     'Transportasi & logistik pengiriman ternak antar lokasi',
    icon:          '🚚',
    primaryColor:  '#1565c0',
    bgColor:       '#e3f2fd',
    textColor:     '#0d47a1',
    dbType:        'Transport',
    routeDashboard: '/workspace/:id/transport',
    routeUtama:    '/workspace/:id/transport',
    routePengaturan: '/workspace/settings/profile',
  },

} as const;

/** Flat list of all workspace configs in declaration order. */
export const WORKSPACE_REGISTRY_LIST: WorkspaceConfig[] = WORKSPACE_KINDS.map(
  (k) => WORKSPACE_REGISTRY[k],
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Look up the configuration for a given WorkspaceKind.
 *
 * @param kind  The workspace kind key.
 * @returns     The full WorkspaceConfig for that kind.
 */
export function getWorkspaceConfig(kind: WorkspaceKind): WorkspaceConfig {
  return WORKSPACE_REGISTRY[kind];
}

/**
 * Replace the ':id' placeholder in a registry route with a real workspace UUID.
 *
 * @example
 *   resolveWorkspaceRoute('/workspace/:id/feed-store', 'ws-abc-123')
 *   // → '/workspace/ws-abc-123/feed-store'
 *
 * @example
 *   // Routes without ':id' (e.g. Farm's '/dashboard') are returned unchanged.
 *   resolveWorkspaceRoute('/dashboard', 'ws-abc-123')
 *   // → '/dashboard'
 */
export function resolveWorkspaceRoute(route: string, workspaceId: string): string {
  return route.replace(':id', workspaceId);
}

/**
 * Find the WorkspaceConfig whose dbType matches the given DB WorkspaceType.
 * When multiple kinds share the same dbType (e.g. DokterHewan & KlinikHewan
 * both map to 'Veterinary'), returns the first match in WORKSPACE_KINDS order.
 *
 * Falls back to the Farm config if no match is found (should not happen in
 * a well-formed registry).
 *
 * @param dbType  The DB-level WorkspaceType value from WorkspaceRecord.
 */
export function getWorkspaceConfigByDbType(
  dbType: WorkspaceType,
): WorkspaceConfig {
  return (
    WORKSPACE_REGISTRY_LIST.find((c) => c.dbType === dbType) ??
    WORKSPACE_REGISTRY.Farm
  );
}

/**
 * Resolve all three canonical routes for a workspace in one call.
 *
 * @param kind         WorkspaceKind key.
 * @param workspaceId  Workspace UUID to substitute into ':id' placeholders.
 * @returns            Object with `dashboard`, `utama`, and `pengaturan` URLs.
 */
export function resolveWorkspaceRoutes(
  kind: WorkspaceKind,
  workspaceId: string,
): { dashboard: string; utama: string; pengaturan: string } {
  const cfg = getWorkspaceConfig(kind);
  return {
    dashboard:   resolveWorkspaceRoute(cfg.routeDashboard,  workspaceId),
    utama:       resolveWorkspaceRoute(cfg.routeUtama,      workspaceId),
    pengaturan:  resolveWorkspaceRoute(cfg.routePengaturan, workspaceId),
  };
}

/**
 * Determine the WorkspaceKind for a given workspace record.
 *
 * DB enum VeterinaryClinic / VeterinaryDoctor both map to app type 'Veterinary',
 * so the route guard cannot rely on workspace_type alone to distinguish
 * DrugStore from DokterHewan / KlinikHewan.
 *
 * This function matches the workspace name (and slug) against the registry
 * nama values. If no match is found, it falls back to dbType mapping.
 */
export function getWorkspaceKindFromRecord(workspace: WorkspaceRecord): WorkspaceKind {
  const name = workspace.workspace_name.toLowerCase();
  const slug = workspace.workspace_slug.toLowerCase();

  for (const kind of WORKSPACE_KINDS) {
    const cfg = WORKSPACE_REGISTRY[kind];
    const namaLower = cfg.nama.toLowerCase();
    const namaSlug = namaLower.replace(/\s+/g, '-');
    if (name.includes(namaLower) || slug.includes(namaSlug)) {
      return kind;
    }
  }

  return getWorkspaceConfigByDbType(workspace.workspace_type).kind;
}
