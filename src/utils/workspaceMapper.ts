// ─── Workspace Mapper Utility ───────────────────────────────────────────────────
// Bridges the domain-level WorkspaceType (Farm/FeedStore/Veterinary/Transport)
// to the display-level WorkspaceJenis (Peternakan/Toko Pakan/Toko Obat/
// Transporter/Dokter Hewan/Klinik Hewan). Centralises icon and label helpers
// so Marketplace & Profil pages never import from TopAppBar's legacy exports.
//
// Note: WorkspaceType collapses VeterinaryClinic + VeterinaryDoctor → 'Veterinary'.
// mapWorkspaceTypeToJenis defaults to 'Dokter Hewan'; callers needing clinic-
// specific behaviour must inspect workspace_name or add a sub-type field.

import type { WorkspaceType, WorkspaceRecord } from '../types/workspace';
import type { WorkspaceJenis } from '../components/TopAppBar';

// ─── WorkspaceType → WorkspaceJenis ─────────────────────────────────────────────

const WORKSPACE_TYPE_TO_JENIS: Record<WorkspaceType, WorkspaceJenis> = {
  Farm:        'Peternakan',
  FeedStore:   'Toko Pakan',
  Veterinary:  'Dokter Hewan',
  DrugStore:   'Toko Obat',
  Transport:   'Transporter',
};

export function mapWorkspaceTypeToJenis(type: WorkspaceType): WorkspaceJenis {
  return WORKSPACE_TYPE_TO_JENIS[type] ?? 'Peternakan';
}

// ─── WorkspaceRecord → icon ────────────────────────────────────────────────────
// Mirrors the private getWorkspaceIcon in TopAppBar.tsx so pages can call
// the same helper without importing from TopAppBar.

export function getWorkspaceIcon(ws: WorkspaceRecord): string {
  if (ws.logo_url) return ws.logo_url;
  switch (ws.workspace_type) {
    case 'Farm':       return '🐑';
    case 'FeedStore':  return '🌾';
    case 'Veterinary': return '🩺';
    case 'DrugStore':  return '💊';
    case 'Transport':  return '🚚';
    default:           return '🏢';
  }
}

// ─── WorkspaceRecord → display type label ──────────────────────────────────────

export function getWorkspaceTypeLabel(ws: WorkspaceRecord): string {
  return mapWorkspaceTypeToJenis(ws.workspace_type);
}
