// ─── Custom Role Service — AUTH-001B ─────────────────────────────────────────
//
// Business logic for workspace custom roles.
// Only the workspace Owner can create/update/delete custom roles.
//
// Permission resolution order (useWorkspacePermission hook):
//   1. If member.custom_role_id is set → resolve CustomRoleRecord → use its permissions
//   2. Otherwise → use ROLE_PERMISSION_MATRIX[member.role]
//
// Rules:
//  - No UI imports. No React.
//  - Max 20 custom roles per workspace (soft limit).
//  - Name must be 2–40 characters, unique within workspace.

import {
  repoListWorkspaceRoles,
  repoGetWorkspaceRole,
  repoCreateWorkspaceRole,
  repoUpdateWorkspaceRole,
  repoUpdateWorkspaceRoleStatus,
  repoGetWorkspaceRoleRemovalPreflight,
  repoDeleteWorkspaceRole,
  WorkspaceRolesRepoError,
} from '../repositories/workspaceRolesRepository';
import type {
  BuiltinRoleRecord,
  CustomRoleRecord,
  CustomRoleCreateInput,
  CustomRoleUpdateInput,
  CustomRoleResult,
  WorkspaceRoleRecord,
  WorkspaceRoleRemovalPreflight,
} from '../types/customRole';
import type { PermissionModule, PermissionAction } from '../types/workspacePermissions';
import { ROLE_PERMISSION_MATRIX } from '../types/workspacePermissions';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateName(name: string): string | null {
  const t = name.trim();
  if (!t)        return 'Nama role wajib diisi.';
  if (t.length < 2)  return 'Nama role minimal 2 karakter.';
  if (t.length > 40) return 'Nama role maksimal 40 karakter.';
  return null;
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function listCustomRoles(
  workspaceId: string,
): Promise<CustomRoleRecord[]> {
  const roles = await repoListWorkspaceRoles(workspaceId);
  return roles.filter((role): role is CustomRoleRecord => role.role_kind === 'custom');
}

export async function getCustomRoleById(
  id: string,
  workspaceId?: string,
): Promise<CustomRoleRecord | null> {
  if (!workspaceId) return null;
  const role = await repoGetWorkspaceRole(id, workspaceId, 'custom');
  return role?.role_kind === 'custom' ? role : null;
}

export async function listWorkspaceRoles(
  workspaceId: string,
): Promise<WorkspaceRoleRecord[]> {
  return repoListWorkspaceRoles(workspaceId);
}

export async function getWorkspaceRole(
  id: string,
  workspaceId: string,
  roleKind: 'builtin' | 'custom',
): Promise<WorkspaceRoleRecord | null> {
  return repoGetWorkspaceRole(id, workspaceId, roleKind);
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function createCustomRole(
  input: CustomRoleCreateInput,
): Promise<CustomRoleResult<CustomRoleRecord>> {
  const nameError = validateName(input.name);
  if (nameError) {
    return { ok: false, error: { code: 'NAME_REQUIRED', message: nameError } };
  }

  // Soft limit check
  const existing = await listCustomRoles(input.workspace_id);
  if (existing.length >= 20) {
    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Maksimal 20 custom role per workspace.',
      },
    };
  }

  try {
    const record = await repoCreateWorkspaceRole(input);
    return { ok: true, data: record };
  } catch (err) {
    if (err instanceof WorkspaceRolesRepoError && err.code === 'DUPLICATE_NAME') {
      return {
        ok: false,
        error: { code: 'DUPLICATE_NAME', message: err.message },
      };
    }
    const message = err instanceof Error ? err.message : 'Gagal membuat custom role.';
    return { ok: false, error: { code: 'NOT_FOUND', message } };
  }
}

export async function updateCustomRole(
  id:    string,
  patch: CustomRoleUpdateInput,
  workspaceId?: string,
): Promise<CustomRoleResult<CustomRoleRecord>> {
  if (patch.name !== undefined) {
    const nameError = validateName(patch.name);
    if (nameError) {
      return { ok: false, error: { code: 'NAME_REQUIRED', message: nameError } };
    }
  }

  try {
    if (!workspaceId) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Workspace tidak ditemukan.' } };
    }
    const updated = await repoUpdateWorkspaceRole(id, workspaceId, patch);
    if (!updated) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Custom role tidak ditemukan.' } };
    }
    return { ok: true, data: updated };
  } catch (err) {
    if (err instanceof WorkspaceRolesRepoError && err.code === 'DUPLICATE_NAME') {
      return { ok: false, error: { code: 'DUPLICATE_NAME', message: err.message } };
    }
    const message = err instanceof Error ? err.message : 'Gagal memperbarui custom role.';
    return { ok: false, error: { code: 'NOT_FOUND', message } };
  }
}

export async function deleteCustomRole(
  id: string,
  workspaceId?: string,
  preflight?: WorkspaceRoleRemovalPreflight,
): Promise<CustomRoleResult<boolean>> {
  try {
    if (!workspaceId) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Workspace tidak ditemukan.' } };
    }
    if (!preflight) {
      return { ok: false, error: { code: 'FORBIDDEN', message: 'Pre-check penghapusan wajib dilakukan.' } };
    }
    if (preflight.role.id !== id || preflight.role.workspace_id !== workspaceId) {
      return { ok: false, error: { code: 'FORBIDDEN', message: 'Pre-check role tidak cocok.' } };
    }
    if (preflight.dependencies.some((dependency) => dependency.blocksDelete && dependency.count > 0)) {
      return { ok: false, error: { code: 'FORBIDDEN', message: 'Role masih digunakan oleh member workspace.' } };
    }
    const deleted = await repoDeleteWorkspaceRole(id, workspaceId);
    if (!deleted.removed) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Custom role tidak ditemukan.' } };
    }
    return { ok: true, data: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus custom role.';
    return { ok: false, error: { code: 'NOT_FOUND', message } };
  }
}

export async function getWorkspaceRoleRemovalPreflight(
  id: string,
  workspaceId: string,
): Promise<WorkspaceRoleRemovalPreflight | null> {
  return repoGetWorkspaceRoleRemovalPreflight(id, workspaceId);
}

export async function updateCustomRoleStatus(
  id: string,
  workspaceId: string,
  status: 'Active' | 'Inactive',
): Promise<CustomRoleResult<CustomRoleRecord>> {
  try {
    const updated = await repoUpdateWorkspaceRoleStatus(id, workspaceId, status);
    return { ok: true, data: updated };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal mengubah status role.';
    return { ok: false, error: { code: 'NOT_FOUND', message } };
  }
}

// ─── Permission resolution ────────────────────────────────────────────────────

/**
 * Resolves whether a custom role allows a given action on a module.
 * The custom role's permissions are treated as absolute (not additive on base role).
 */
export function customRoleCan(
  role:    CustomRoleRecord,
  module:  PermissionModule,
  action:  PermissionAction,
): boolean {
  return role.permissions[module]?.[action] === true;
}

/**
 * Builds a full RolePermissionMap-compatible object from a CustomRoleRecord.
 * Missing modules / actions default to false.
 */
export function resolveCustomRolePermissions(
  role: CustomRoleRecord,
): Record<PermissionModule, Record<PermissionAction, boolean>> {
  const MODULES: PermissionModule[] = [
    'dashboard', 'livestock', 'feed', 'medicine', 'marketplace',
    'workspaceSettings', 'memberManagement', 'reports', 'ai', 'adminFeatures',
  ];
  const ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete'];

  const result = {} as Record<PermissionModule, Record<PermissionAction, boolean>>;
  for (const mod of MODULES) {
    result[mod] = {} as Record<PermissionAction, boolean>;
    for (const action of ACTIONS) {
      result[mod][action] = role.permissions[mod]?.[action] === true;
    }
  }
  return result;
}

/**
 * Returns a full permission map merging a custom role's permissions on top of
 * a base built-in role. Useful for the "based on Staff + custom overrides" UX.
 */
export function mergeCustomOnBase(
  baseRole:    keyof typeof ROLE_PERMISSION_MATRIX,
  customPerms: CustomRoleRecord['permissions'],
): Record<PermissionModule, Record<PermissionAction, boolean>> {
  const MODULES: PermissionModule[] = [
    'dashboard', 'livestock', 'feed', 'medicine', 'marketplace',
    'workspaceSettings', 'memberManagement', 'reports', 'ai', 'adminFeatures',
  ];
  const ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete'];

  const base   = ROLE_PERMISSION_MATRIX[baseRole];
  const result = {} as Record<PermissionModule, Record<PermissionAction, boolean>>;

  for (const mod of MODULES) {
    result[mod] = {} as Record<PermissionAction, boolean>;
    for (const action of ACTIONS) {
      // Custom override wins if present; otherwise fall back to base role
      const override = customPerms[mod]?.[action];
      result[mod][action] = override !== undefined
        ? override
        : (base[mod][action] === true);
    }
  }
  return result;
}
