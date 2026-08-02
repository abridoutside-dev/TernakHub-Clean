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
  repoListCustomRoles,
  repoGetCustomRoleById,
  repoCreateCustomRole,
  repoUpdateCustomRole,
  repoDeleteCustomRole,
  CustomRoleRepoError,
} from '../repositories/customRolesRepository';
import type {
  CustomRoleRecord,
  CustomRoleCreateInput,
  CustomRoleUpdateInput,
  CustomRoleResult,
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
  return repoListCustomRoles(workspaceId);
}

export async function getCustomRoleById(
  id: string,
): Promise<CustomRoleRecord | null> {
  return repoGetCustomRoleById(id);
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
  const existing = await repoListCustomRoles(input.workspace_id);
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
    const record = await repoCreateCustomRole(input);
    return { ok: true, data: record };
  } catch (err) {
    if (err instanceof CustomRoleRepoError && err.code === 'DUPLICATE_NAME') {
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
): Promise<CustomRoleResult<CustomRoleRecord>> {
  if (patch.name !== undefined) {
    const nameError = validateName(patch.name);
    if (nameError) {
      return { ok: false, error: { code: 'NAME_REQUIRED', message: nameError } };
    }
  }

  try {
    const updated = await repoUpdateCustomRole(id, patch);
    if (!updated) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Custom role tidak ditemukan.' } };
    }
    return { ok: true, data: updated };
  } catch (err) {
    if (err instanceof CustomRoleRepoError && err.code === 'DUPLICATE_NAME') {
      return { ok: false, error: { code: 'DUPLICATE_NAME', message: err.message } };
    }
    const message = err instanceof Error ? err.message : 'Gagal memperbarui custom role.';
    return { ok: false, error: { code: 'NOT_FOUND', message } };
  }
}

export async function deleteCustomRole(
  id: string,
): Promise<CustomRoleResult<boolean>> {
  try {
    const deleted = await repoDeleteCustomRole(id);
    if (!deleted) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Custom role tidak ditemukan.' } };
    }
    return { ok: true, data: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus custom role.';
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
