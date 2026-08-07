// ─── Workspace Relationship domain contract ───────────────────────────────────
//
// The database stores Indonesian enum values. The browser uses stable English
// lifecycle values and this translation is owned by the Edge Function adapter.

export type RelationshipType =
  | 'Supplier'
  | 'Buyer'
  | 'Partner'
  | 'Afiliasi'
  | 'Kompetitor'
  | 'Mitra'
  | 'Lainnya';

export type RelationshipStatus =
  | 'Active'
  | 'Pending'
  | 'Suspended'
  | 'Rejected'
  | 'Archived';

export interface RelationshipWorkspaceRef {
  workspace_id: string;
  workspace_name: string;
  workspace_type: string;
  owner_name: string;
  location: string;
  verified: boolean;
}

export interface WorkspaceRelationship {
  relationship_id: string;
  workspace: RelationshipWorkspaceRef;
  partner: RelationshipWorkspaceRef;
  relationship_type: RelationshipType;
  status: RelationshipStatus;
  initiated_by_workspace_id: string | null;
  created_at: string;
  updated_at: string;
  effective_date: string | null;
  expiry_date: string | null;
  notes: string | null;
}

export interface RelationshipWorkspaceOption {
  workspace_id: string;
  workspace_name: string;
  workspace_type: string;
  owner_name: string;
}

export interface RelationshipStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  rejected: number;
  archived: number;
}

export interface RelationshipListResponse {
  relationships: WorkspaceRelationship[];
  workspaces: RelationshipWorkspaceOption[];
  stats: RelationshipStats;
}

export interface RelationshipCreateInput {
  workspace_id_a: string;
  workspace_id_b: string;
  relationship_type: RelationshipType;
  notes?: string;
}

export interface RelationshipDeletePreflight {
  relationship: WorkspaceRelationship;
  dependencies: Array<{
    key: string;
    label: string;
    count: number;
    description: string;
    blocksDelete: boolean;
  }>;
  checked_at: string;
}