// ─── Custom Role Types — AUTH-001B ────────────────────────────────────────────
//
// Custom roles are workspace-scoped overrides on top of the built-in
// ROLE_PERMISSION_MATRIX. Only the Owner can create/edit/delete them.
//
// Storage: workspace_custom_roles table (Supabase).
// Permission format: { module: { action: boolean } } — partial; absent = denied.

import type { PermissionModule, PermissionAction } from './workspacePermissions';

// ─── Core types ───────────────────────────────────────────────────────────────

/**
 * Sparse permission map stored in the `permissions` JSONB column.
 * Only modules / actions that differ from the default need to be listed.
 */
export type CustomRolePermissions = Partial<
  Record<PermissionModule, Partial<Record<PermissionAction, boolean>>>
>;

export type WorkspaceRoleStatus = 'Active' | 'Inactive';

export interface BuiltinRoleRecord {
  id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  permissions: CustomRolePermissions;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: 'Active';
  role_kind: 'builtin';
}

export interface CustomRoleRecord {
  id:           string;
  workspace_id: string;
  name:         string;
  description:  string | null;
  permissions:  CustomRolePermissions;
  created_by:   string | null;
  created_at:   string;
  updated_at:   string;
  status:       WorkspaceRoleStatus;
  role_kind:    'custom';
}

export type WorkspaceRoleRecord = BuiltinRoleRecord | CustomRoleRecord;

export interface WorkspaceRoleDependency {
  key: 'members';
  label: string;
  count: number;
  description: string;
  blocksDelete: boolean;
}

export interface WorkspaceRoleRemovalPreflight {
  role: CustomRoleRecord;
  dependencies: WorkspaceRoleDependency[];
}

export interface CustomRoleCreateInput {
  workspace_id: string;
  name:         string;
  description?: string | null;
  permissions:  CustomRolePermissions;
  created_by?:  string | null;
}

export interface CustomRoleUpdateInput {
  name?:        string;
  description?: string | null;
  permissions?: CustomRolePermissions;
}

// ─── Error codes ──────────────────────────────────────────────────────────────

export type CustomRoleErrorCode =
  | 'DUPLICATE_NAME'
  | 'NOT_FOUND'
  | 'NAME_REQUIRED'
  | 'NAME_TOO_LONG'
  | 'FORBIDDEN';

export interface CustomRoleError {
  code:    CustomRoleErrorCode;
  message: string;
}

export type CustomRoleResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: CustomRoleError };
