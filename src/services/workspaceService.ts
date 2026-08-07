// ─── Workspace Service — WS-001 / P0-001C ────────────────────────────────────
//
// Business logic and validation layer for the Workspace module.
// All callers (context, pages, other services) must go through this layer —
// never import the repository directly.
//
// Rules:
//  - Validation functions stay synchronous (pure format/type checks).
//  - CRUD commands (create/update/delete) are async — they persist to Supabase.
//  - Read functions are async — they query Supabase via workspaceRepository.ts.
//  - No UI imports. No React. Pure TypeScript.
//  - No cross-service imports (use foundationBridge.ts for that).
//
// Note on slug uniqueness:
//  generateUniqueSlug() uses the local in-memory cache (workspaceFoundationData)
//  for a best-effort UX hint. The Supabase unique constraint is the authoritative
//  guard; slug conflicts are surfaced as WorkspaceRepoError(code='SLUG_TAKEN').

import type {
  WorkspaceRecord,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
  WorkspaceValidationResult,
  WorkspaceValidationError,
  WorkspaceType,
  WorkspaceStatus,
  WorkspacePlan,
  WorkspaceDependencies,
} from '../types/workspace';
import {
  WORKSPACE_TYPES,
  WORKSPACE_STATUSES,
  WORKSPACE_PLANS,
} from '../types/workspace';
import {
  // Slug utilities are pure UX hints; the Supabase unique constraint is authoritative.
  deriveSlug,
  isSlugTaken,
} from '../data/workspaceFoundationData';
import {
  repoGetAllWorkspaces,
  repoGetWorkspacesByStatus,
  repoGetWorkspacesByType,
  repoGetWorkspacesByOwner,
  repoGetWorkspaceByUuid,
  repoGetWorkspaceBySlug,
  repoGetWorkspaceDependencies,
  repoMapWorkspaceRow,
  repoPatchWorkspace,
  repoDeleteWorkspace as repoHardDelete,
  WorkspaceRepoError,
} from '../repositories/workspaceRepository';
import {
  repoGetMembersByWorkspace,
  repoGetMemberByUuid,
  repoGetMemberRemovalPreflight,
  repoInsertMember,
  repoUpdateMemberRole,
  repoUpdateMemberStatus,
  repoDeleteMember,
  repoBatchGetMembersByWorkspaces,
} from '../repositories/workspaceMembersRepository';
import type {
  WorkspaceMemberRecord,
  MemberCreateInput,
} from '../data/workspaceMembersData';
import {
  upsertWorkspaceMembersCache,
  getMemberByUuid,
  upsertWorkspaceMemberCache,
  removeWorkspaceMemberCache,
} from '../data/workspaceMembersData';
import type {
  MemberRole,
  MemberStatus,
  PermissionAction,
  PermissionModule,
} from '../types/workspacePermissions';
import type {
  RelationshipCreateInput,
  RelationshipDeletePreflight,
  RelationshipListResponse,
  WorkspaceRelationship,
} from '../types/workspaceRelationship';
import {
  repoCreateWorkspaceRelationship,
  repoDeleteWorkspaceRelationship,
  repoGetWorkspaceRelationship,
  repoGetWorkspaceRelationshipDeletePreflight,
  repoListWorkspaceRelationships,
  repoUpdateWorkspaceRelationshipStatus,
  WorkspaceRelationshipRepoError,
} from '../repositories/workspaceRelationshipRepository';
import type {
  CustomRoleCreateInput,
  CustomRoleRecord,
  CustomRoleResult,
  CustomRoleUpdateInput,
  WorkspaceRoleRecord,
  WorkspaceRoleRemovalPreflight,
  CustomRoleErrorCode,
} from '../types/customRole';
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
import { supabase } from '../lib/supabase';
import type {
  CreateOwnershipTransferInput,
  OwnershipTransferAction,
  OwnershipTransferListResponse,
  OwnershipTransferPreflight,
  OwnershipTransferRecord,
} from '../types/ownershipTransfer';
import {
  repoCreateOwnershipTransfer,
  repoGetOwnershipTransfer,
  repoGetOwnershipTransferPreflight,
  repoListOwnershipTransfers,
  repoTransitionOwnershipTransfer,
  WorkspaceOwnershipRepoError,
} from '../repositories/workspaceOwnershipRepository';
import {
  repoAssignSubscription,
  repoChangeSubscription,
  repoCreateSubscriptionPackage,
  repoDeleteSubscriptionPackage,
  repoGetPackageDeletePreflight,
  repoGetSubscriptionPackage,
  repoGetWorkspaceSubscription,
  repoListSubscriptionAdmin,
  repoListSubscriptionAudit,
  repoListSubscriptionHistory,
  repoListSubscriptionPlans,
  repoSetSubscriptionPackageStatus,
  repoTransitionSubscription,
  repoUpdateSubscriptionPackage,
  SubscriptionRepoError,
} from '../repositories/workspaceSubscriptionRepository';
import type {
  SubscriptionAdminData,
  SubscriptionAuditEntry,
  SubscriptionHistoryEntryAdmin,
  SubscriptionPackage,
  SubscriptionPackageInput,
  SubscriptionPreflight,
  SubscriptionRecordAdmin,
} from '../types/subscriptionAdmin';

// ─── Re-export slug utilities (consumers import from the service, not the repo)

export { deriveSlug };

// ─── Async read helpers ───────────────────────────────────────────────────────
// These are thin pass-throughs to the repository.
// The WorkspaceContext loads all workspaces on mount; within the React tree
// prefer using context.workspaces.find(...) over calling these directly.

export async function getAllWorkspaces(options?: { admin?: boolean }): Promise<WorkspaceRecord[]> {
  return repoGetAllWorkspaces(options);
}

export async function getWorkspacesByStatus(
  status: WorkspaceStatus,
): Promise<WorkspaceRecord[]> {
  return repoGetWorkspacesByStatus(status);
}

export async function getWorkspacesByType(
  type: WorkspaceType,
): Promise<WorkspaceRecord[]> {
  return repoGetWorkspacesByType(type);
}

export async function getWorkspacesByOwner(
  ownerUuid: string,
): Promise<WorkspaceRecord[]> {
  return repoGetWorkspacesByOwner(ownerUuid);
}

export async function getWorkspaceByUuid(
  uuid: string,
): Promise<WorkspaceRecord | null> {
  return repoGetWorkspaceByUuid(uuid);
}

export async function getWorkspaceBySlug(
  slug: string,
): Promise<WorkspaceRecord | null> {
  return repoGetWorkspaceBySlug(slug);
}

export async function getWorkspaceDependencies(
  uuid: string,
): Promise<WorkspaceDependencies> {
  return repoGetWorkspaceDependencies(uuid);
}

// ─── Workspace Members ────────────────────────────────────────────────────────
// Membership operations intentionally live in the Workspace service. Pages and
// hooks must not call workspaceMembersRepository or Supabase directly.

export async function getWorkspaceMembers(
  workspaceUuid: string,
): Promise<WorkspaceMemberRecord[]> {
  const records = await repoGetMembersByWorkspace(workspaceUuid);
  upsertWorkspaceMembersCache(workspaceUuid, records);
  return records;
}

export async function getWorkspaceMembersForWorkspaces(
  workspaceUuids: string[],
): Promise<WorkspaceMemberRecord[]> {
  const records = await repoBatchGetMembersByWorkspaces(workspaceUuids);
  upsertWorkspaceMembersCache(
    workspaceUuids.length === 1 ? workspaceUuids[0] : '',
    records,
  );
  return records;
}

export async function getWorkspaceMember(
  memberUuid: string,
  workspaceUuid: string,
): Promise<WorkspaceMemberRecord | null> {
  return repoGetMemberByUuid(memberUuid, workspaceUuid);
}

export async function getWorkspaceMemberRemovalPreflight(
  memberUuid: string,
  workspaceUuid: string,
): Promise<WorkspaceMemberRemovalPreflight | null> {
  const result = await repoGetMemberRemovalPreflight(memberUuid, workspaceUuid);
  return result
    ? { member: result.member, relatedRecords: result.relatedRecords }
    : null;
}

export async function addWorkspaceMember(
  input: MemberCreateInput,
): Promise<ServiceResult<WorkspaceMemberRecord>> {
  if (!input.workspace_uuid || (!input.user_id && !input.email)) {
    return {
      ok: false,
      errors: [{ field: 'general', message: 'Workspace dan email atau user wajib dipilih.' }],
    };
  }

  try {
    const created = await repoInsertMember(input);
    upsertWorkspaceMemberCache(created);
    return { ok: true, data: created };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menambahkan member.';
    return { ok: false, errors: [{ field: 'general', message }] };
  }
}

export async function updateWorkspaceMemberRole(
  memberUuid: string,
  newRole: MemberRole,
  workspaceUuid: string,
): Promise<ServiceResult<WorkspaceMemberRecord>> {
  const member = getMemberByUuid(memberUuid) ?? null;
  if (!member) {
    return { ok: false, errors: [{ field: 'general', message: 'Member tidak ditemukan.' }] };
  }
  if (member.role === 'Owner') {
    return { ok: false, errors: [{ field: 'general', message: 'Role Owner tidak dapat diubah.' }] };
  }

  try {
    const updated = await repoUpdateMemberRole(memberUuid, newRole, workspaceUuid);
    if (updated) upsertWorkspaceMemberCache(updated);
    return updated
      ? { ok: true, data: updated }
      : { ok: false, errors: [{ field: 'general', message: 'Member tidak ditemukan.' }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal mengubah role member.';
    return { ok: false, errors: [{ field: 'general', message }] };
  }
}

export async function updateWorkspaceMemberStatus(
  memberUuid: string,
  status: MemberStatus,
  workspaceUuid: string,
): Promise<ServiceResult<WorkspaceMemberRecord>> {
  const member = getMemberByUuid(memberUuid) ?? null;
  if (!member) {
    return { ok: false, errors: [{ field: 'general', message: 'Member tidak ditemukan.' }] };
  }
  if (member.role === 'Owner') {
    return { ok: false, errors: [{ field: 'general', message: 'Status Owner tidak dapat diubah.' }] };
  }

  try {
    const updated = await repoUpdateMemberStatus(memberUuid, status, workspaceUuid);
    if (updated) upsertWorkspaceMemberCache(updated);
    return updated
      ? { ok: true, data: updated }
      : { ok: false, errors: [{ field: 'general', message: 'Member tidak ditemukan.' }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal mengubah status member.';
    return { ok: false, errors: [{ field: 'general', message }] };
  }
}

export async function removeWorkspaceMember(
  memberUuid: string,
  workspaceUuid: string,
  preflight: WorkspaceMemberRemovalPreflight,
): Promise<ServiceResult<{ removed: boolean }>> {
  const member = preflight.member;
  if (!member) {
    return { ok: false, errors: [{ field: 'general', message: 'Member tidak ditemukan.' }] };
  }
  if (member.role === 'Owner') {
    return { ok: false, errors: [{ field: 'general', message: 'Owner tidak dapat dihapus dari workspace.' }] };
  }

  try {
    if (preflight.member.member_uuid !== memberUuid || preflight.member.workspace_uuid !== workspaceUuid) {
      return { ok: false, errors: [{ field: 'general', message: 'Preflight member tidak cocok.' }] };
    }
    const removed = await repoDeleteMember(memberUuid, workspaceUuid);
    if (removed) removeWorkspaceMemberCache(memberUuid);
    return { ok: true, data: { removed } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus membership.';
    return { ok: false, errors: [{ field: 'general', message }] };
  }
}

// ─── Workspace Roles ─────────────────────────────────────────────────────────
// Workspace Roles uses one browser path only:
// UI → WorkspaceService → WorkspaceRolesRepository → workspace-roles Edge Function.

function validateWorkspaceRoleName(name: string): string | null {
  const normalized = name.trim();
  if (!normalized) return 'Nama role wajib diisi.';
  if (normalized.length < 2) return 'Nama role minimal 2 karakter.';
  if (normalized.length > 40) return 'Nama role maksimal 40 karakter.';
  return null;
}

export async function getWorkspaceRoles(
  workspaceUuid: string,
): Promise<WorkspaceRoleRecord[]> {
  return repoListWorkspaceRoles(workspaceUuid);
}

export async function getWorkspaceRole(
  roleId: string,
  workspaceUuid: string,
  roleKind: 'builtin' | 'custom' = 'custom',
): Promise<WorkspaceRoleRecord | null> {
  return repoGetWorkspaceRole(roleId, workspaceUuid, roleKind);
}

/** Expand the sparse permission payload returned by Supabase into a stable UI map. */
export function resolveWorkspaceRolePermissions(
  role: WorkspaceRoleRecord,
): Record<PermissionModule, Record<PermissionAction, boolean>> {
  const modules: PermissionModule[] = [
    'dashboard', 'livestock', 'feed', 'medicine', 'marketplace',
    'workspaceSettings', 'memberManagement', 'reports', 'ai', 'adminFeatures',
  ];
  const actions: PermissionAction[] = ['view', 'create', 'update', 'delete'];
  const result = {} as Record<PermissionModule, Record<PermissionAction, boolean>>;

  for (const module of modules) {
    result[module] = {} as Record<PermissionAction, boolean>;
    for (const action of actions) {
      result[module][action] = role.permissions[module]?.[action] === true;
    }
  }
  return result;
}

function roleError<T>(error: unknown, fallback: string): CustomRoleResult<T> {
  const message = error instanceof Error ? error.message : fallback;
  const code = error instanceof WorkspaceRolesRepoError ? error.code : undefined;
  const supportedCodes: CustomRoleErrorCode[] = [
    'DUPLICATE_NAME', 'NOT_FOUND', 'NAME_REQUIRED', 'NAME_TOO_LONG', 'FORBIDDEN',
  ];
  return {
    ok: false,
    error: {
      code: supportedCodes.includes(code as CustomRoleErrorCode)
        ? code as CustomRoleErrorCode
        : 'NOT_FOUND',
      message,
    },
  };
}

export async function addWorkspaceRole(
  input: CustomRoleCreateInput,
): Promise<CustomRoleResult<CustomRoleRecord>> {
  const nameError = validateWorkspaceRoleName(input.name);
  if (nameError) return { ok: false, error: { code: 'NAME_REQUIRED', message: nameError } };
  try {
    const roles = await repoListWorkspaceRoles(input.workspace_id);
    if (roles.filter((role) => role.role_kind === 'custom').length >= 20) {
      return { ok: false, error: { code: 'FORBIDDEN', message: 'Maksimal 20 custom role per workspace.' } };
    }
    return { ok: true, data: await repoCreateWorkspaceRole(input) };
  } catch (error) {
    return roleError(error, 'Gagal membuat role.');
  }
}

export async function editWorkspaceRole(
  roleId: string,
  workspaceUuid: string,
  patch: CustomRoleUpdateInput,
): Promise<CustomRoleResult<CustomRoleRecord>> {
  if (patch.name !== undefined) {
    const nameError = validateWorkspaceRoleName(patch.name);
    if (nameError) return { ok: false, error: { code: 'NAME_REQUIRED', message: nameError } };
  }
  try {
    return { ok: true, data: await repoUpdateWorkspaceRole(roleId, workspaceUuid, patch) };
  } catch (error) {
    return roleError(error, 'Gagal memperbarui role.');
  }
}

export async function updateWorkspaceRoleStatus(
  roleId: string,
  workspaceUuid: string,
  status: 'Active' | 'Inactive',
): Promise<CustomRoleResult<CustomRoleRecord>> {
  try {
    return { ok: true, data: await repoUpdateWorkspaceRoleStatus(roleId, workspaceUuid, status) };
  } catch (error) {
    return roleError(error, 'Gagal mengubah status role.');
  }
}

export async function getWorkspaceRoleRemovalPreflight(
  roleId: string,
  workspaceUuid: string,
): Promise<WorkspaceRoleRemovalPreflight | null> {
  return repoGetWorkspaceRoleRemovalPreflight(roleId, workspaceUuid);
}

export async function removeWorkspaceRole(
  roleId: string,
  workspaceUuid: string,
  preflight: WorkspaceRoleRemovalPreflight,
): Promise<CustomRoleResult<boolean>> {
  if (preflight.role.id !== roleId || preflight.role.workspace_id !== workspaceUuid) {
    return { ok: false, error: { code: 'FORBIDDEN', message: 'Pre-check role tidak cocok.' } };
  }
  if (preflight.dependencies.some((dependency) => dependency.blocksDelete && dependency.count > 0)) {
    return { ok: false, error: { code: 'FORBIDDEN', message: 'Role masih digunakan oleh member workspace.' } };
  }
  try {
    const result = await repoDeleteWorkspaceRole(roleId, workspaceUuid);
    return result.removed
      ? { ok: true, data: true }
      : { ok: false, error: { code: 'NOT_FOUND', message: 'Role tidak ditemukan.' } };
  } catch (error) {
    return roleError(error, 'Gagal menghapus role.');
  }
}

// ─── Workspace Relationships ─────────────────────────────────────────────────
// UI → WorkspaceService → WorkspaceRelationshipRepository →
// workspace-relationships Edge Function.

export type WorkspaceRelationshipResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: string } };

function relationshipError(error: unknown, fallback: string): WorkspaceRelationshipResult<never> {
  return {
    ok: false,
    error: {
      message: error instanceof WorkspaceRelationshipRepoError
        ? error.message
        : error instanceof Error ? error.message : fallback,
      code: error instanceof WorkspaceRelationshipRepoError ? error.code : undefined,
    },
  };
}

export async function getWorkspaceRelationships(): Promise<RelationshipListResponse> {
  return repoListWorkspaceRelationships();
}

export async function getWorkspaceRelationship(id: string): Promise<WorkspaceRelationship | null> {
  return repoGetWorkspaceRelationship(id);
}

export async function addWorkspaceRelationship(
  input: RelationshipCreateInput,
): Promise<WorkspaceRelationshipResult<WorkspaceRelationship>> {
  if (!input.workspace_id_a || !input.workspace_id_b) {
    return { ok: false, error: { message: 'Workspace A dan Workspace B wajib dipilih.', code: 'VALIDATION' } };
  }
  if (input.workspace_id_a === input.workspace_id_b) {
    return { ok: false, error: { message: 'Workspace A dan Workspace B harus berbeda.', code: 'VALIDATION' } };
  }
  if (!input.relationship_type) {
    return { ok: false, error: { message: 'Tipe relationship wajib dipilih.', code: 'VALIDATION' } };
  }
  try {
    return { ok: true, data: await repoCreateWorkspaceRelationship(input) };
  } catch (error) {
    return relationshipError(error, 'Gagal menambahkan relationship.');
  }
}

export async function updateWorkspaceRelationshipStatus(
  id: string,
  operation: 'approve' | 'reject' | 'suspend' | 'reactivate',
): Promise<WorkspaceRelationshipResult<WorkspaceRelationship>> {
  try {
    return { ok: true, data: await repoUpdateWorkspaceRelationshipStatus(id, operation) };
  } catch (error) {
    return relationshipError(error, 'Gagal mengubah status relationship.');
  }
}

export async function getWorkspaceRelationshipDeletePreflight(
  id: string,
): Promise<RelationshipDeletePreflight | null> {
  return repoGetWorkspaceRelationshipDeletePreflight(id);
}

export async function removeWorkspaceRelationship(
  id: string,
  preflight: RelationshipDeletePreflight,
): Promise<WorkspaceRelationshipResult<{ removed: boolean }>> {
  if (preflight.relationship.relationship_id !== id) {
    return { ok: false, error: { message: 'Pre-check relationship tidak cocok.', code: 'VALIDATION' } };
  }
  if (preflight.dependencies.some((dependency) => dependency.blocksDelete && dependency.count > 0)) {
    return { ok: false, error: { message: 'Relationship masih memiliki dependency.', code: 'DEPENDENCY' } };
  }
  try {
    return { ok: true, data: await repoDeleteWorkspaceRelationship(id, preflight) };
  } catch (error) {
    return relationshipError(error, 'Gagal menghapus relationship.');
  }
}

// ─── Ownership Transfer ───────────────────────────────────────────────────────
// UI → WorkspaceService → WorkspaceOwnershipRepository → Edge Function.

export type OwnershipTransferResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: string } };

function ownershipTransferError(
  error: unknown,
  fallback: string,
): OwnershipTransferResult<never> {
  return {
    ok: false,
    error: {
      message: error instanceof WorkspaceOwnershipRepoError
        ? error.message
        : error instanceof Error ? error.message : fallback,
      code: error instanceof WorkspaceOwnershipRepoError ? error.code : undefined,
    },
  };
}

export async function getOwnershipTransfers(): Promise<OwnershipTransferListResponse> {
  return repoListOwnershipTransfers();
}

export async function getOwnershipTransfer(
  transferId: string,
): Promise<OwnershipTransferRecord | null> {
  return repoGetOwnershipTransfer(transferId);
}

export async function createOwnershipTransfer(
  input: CreateOwnershipTransferInput,
): Promise<OwnershipTransferResult<OwnershipTransferRecord>> {
  if (!input.workspace_id || !input.to_user_id) {
    return { ok: false, error: { message: 'Workspace dan user penerima wajib dipilih.', code: 'VALIDATION' } };
  }
  try {
    return { ok: true, data: await repoCreateOwnershipTransfer(input) };
  } catch (error) {
    return ownershipTransferError(error, 'Gagal membuat permintaan transfer kepemilikan.');
  }
}

export async function getOwnershipTransferPreflight(
  transferId: string,
): Promise<OwnershipTransferPreflight | null> {
  return repoGetOwnershipTransferPreflight(transferId);
}

export async function transitionOwnershipTransfer(
  transferId: string,
  action: OwnershipTransferAction,
  reason?: string,
): Promise<OwnershipTransferResult<OwnershipTransferRecord>> {
  if (!transferId) {
    return { ok: false, error: { message: 'Transfer ID wajib diisi.', code: 'VALIDATION' } };
  }
  try {
    return { ok: true, data: await repoTransitionOwnershipTransfer(transferId, action, reason) };
  } catch (error) {
    return ownershipTransferError(error, 'Status transfer kepemilikan tidak dapat diperbarui.');
  }
}

// ─── Subscription ──────────────────────────────────────────────────────────────
// UI → WorkspaceService → WorkspaceSubscriptionRepository → Edge Function.

export type SubscriptionServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: string } };

function subscriptionError(error: unknown, fallback: string): SubscriptionServiceResult<never> {
  return {
    ok: false,
    error: {
      message: error instanceof SubscriptionRepoError
        ? error.message
        : error instanceof Error ? error.message : fallback,
      code: error instanceof SubscriptionRepoError ? error.code : undefined,
    },
  };
}

export function getSubscriptionAdmin(): Promise<SubscriptionAdminData> {
  return repoListSubscriptionAdmin();
}

export function getSubscriptionPackages(): Promise<SubscriptionPackage[]> {
  return repoListSubscriptionPlans();
}

export function getSubscriptionPackage(id: string): Promise<SubscriptionPackage | null> {
  return repoGetSubscriptionPackage(id);
}

export function getWorkspaceSubscription(workspaceId: string): Promise<SubscriptionRecordAdmin | null> {
  return repoGetWorkspaceSubscription(workspaceId);
}

export async function createSubscriptionPackage(
  input: SubscriptionPackageInput,
): Promise<SubscriptionServiceResult<SubscriptionPackage>> {
  if (!input.plan_key.trim() || !input.name.trim()) {
    return { ok: false, error: { message: 'Plan key dan nama paket wajib diisi.', code: 'VALIDATION' } };
  }
  try {
    return { ok: true, data: await repoCreateSubscriptionPackage(input) };
  } catch (error) {
    return subscriptionError(error, 'Paket tidak dapat dibuat.');
  }
}

export async function updateSubscriptionPackage(
  id: string,
  input: Partial<SubscriptionPackageInput>,
): Promise<SubscriptionServiceResult<SubscriptionPackage>> {
  if (!id) return { ok: false, error: { message: 'Package ID wajib diisi.', code: 'VALIDATION' } };
  try {
    return { ok: true, data: await repoUpdateSubscriptionPackage(id, input) };
  } catch (error) {
    return subscriptionError(error, 'Paket tidak dapat diperbarui.');
  }
}

export async function setSubscriptionPackageStatus(
  id: string,
  active: boolean,
): Promise<SubscriptionServiceResult<SubscriptionPackage>> {
  try {
    return { ok: true, data: await repoSetSubscriptionPackageStatus(id, active) };
  } catch (error) {
    return subscriptionError(error, 'Status paket tidak dapat diubah.');
  }
}

export function getSubscriptionPackageDeletePreflight(id: string): Promise<SubscriptionPreflight> {
  return repoGetPackageDeletePreflight(id);
}

export async function deleteSubscriptionPackage(
  id: string,
  preflight: SubscriptionPreflight,
): Promise<SubscriptionServiceResult<{ removed: boolean }>> {
  if (preflight.package.id !== id) {
    return { ok: false, error: { message: 'Pre-check paket tidak cocok.', code: 'VALIDATION' } };
  }
  if (preflight.dependencies.some((dependency) => dependency.blocks_delete && dependency.count > 0)) {
    return { ok: false, error: { message: 'Paket masih digunakan oleh subscription aktif.', code: 'DEPENDENCY' } };
  }
  try {
    return { ok: true, data: await repoDeleteSubscriptionPackage(id, preflight) };
  } catch (error) {
    return subscriptionError(error, 'Paket tidak dapat dihapus.');
  }
}

export async function assignSubscriptionPackage(input: {
  workspace_id: string;
  package_id: string;
  billing_cycle?: 'monthly' | 'yearly';
  expires_at?: string | null;
}): Promise<SubscriptionServiceResult<SubscriptionRecordAdmin>> {
  if (!input.workspace_id || !input.package_id) {
    return { ok: false, error: { message: 'Workspace dan paket wajib dipilih.', code: 'VALIDATION' } };
  }
  try {
    return { ok: true, data: await repoAssignSubscription(input) };
  } catch (error) {
    return subscriptionError(error, 'Paket tidak dapat di-assign.');
  }
}

export async function changeSubscriptionPackage(input: {
  subscription_id: string;
  package_id: string;
  billing_cycle?: 'monthly' | 'yearly';
  expires_at?: string | null;
}): Promise<SubscriptionServiceResult<SubscriptionRecordAdmin>> {
  try {
    return { ok: true, data: await repoChangeSubscription(input) };
  } catch (error) {
    return subscriptionError(error, 'Paket subscription tidak dapat diubah.');
  }
}

export async function expireSubscription(id: string): Promise<SubscriptionServiceResult<SubscriptionRecordAdmin>> {
  try {
    return { ok: true, data: await repoTransitionSubscription(id, 'expire') };
  } catch (error) {
    return subscriptionError(error, 'Subscription tidak dapat di-expire.');
  }
}

export async function cancelSubscription(id: string): Promise<SubscriptionServiceResult<SubscriptionRecordAdmin>> {
  try {
    return { ok: true, data: await repoTransitionSubscription(id, 'cancel') };
  } catch (error) {
    return subscriptionError(error, 'Subscription tidak dapat dibatalkan.');
  }
}

export function getSubscriptionHistory(): Promise<SubscriptionHistoryEntryAdmin[]> {
  return repoListSubscriptionHistory();
}

export function getSubscriptionAudit(): Promise<SubscriptionAuditEntry[]> {
  return repoListSubscriptionAudit();
}

export interface WorkspaceMemberRemovalPreflight {
  member: WorkspaceMemberRecord;
  /** Membership is the only relation removed; user and workspace remain intact. */
  relatedRecords: readonly [];
}

// ─── Validation ───────────────────────────────────────────────────────────────
// Pure synchronous format and type checks.
// Slug uniqueness is enforced by the Supabase unique constraint.
// These functions validate shape only; existence is checked by the command layer.

/**
 * Validates a WorkspaceCreateInput before insertion.
 *
 * Rules enforced:
 *  - workspace_type    : required, must be a known WorkspaceType
 *  - workspace_name    : required, 2–120 characters
 *  - workspace_slug    : required, URL-safe format
 *  - workspace_status  : required, must be a known WorkspaceStatus
 *  - workspace_plan    : required, must be a known WorkspacePlan
 *  - owner_user_uuid   : required, non-empty string
 */
export function validateCreate(input: WorkspaceCreateInput): WorkspaceValidationResult {
  const errors: WorkspaceValidationError[] = [];

  // workspace_type
  if (!input.workspace_type) {
    errors.push({ field: 'workspace_type', message: 'Workspace type is required.' });
  } else if (!(WORKSPACE_TYPES as string[]).includes(input.workspace_type)) {
    errors.push({
      field: 'workspace_type',
      message: `Invalid workspace type "${input.workspace_type}". Must be one of: ${WORKSPACE_TYPES.join(', ')}.`,
    });
  }

  // workspace_name
  if (!input.workspace_name || input.workspace_name.trim().length === 0) {
    errors.push({ field: 'workspace_name', message: 'Workspace name is required.' });
  } else if (input.workspace_name.trim().length < 2) {
    errors.push({ field: 'workspace_name', message: 'Workspace name must be at least 2 characters.' });
  } else if (input.workspace_name.trim().length > 120) {
    errors.push({ field: 'workspace_name', message: 'Workspace name must not exceed 120 characters.' });
  }

  // workspace_slug — format only; uniqueness is enforced by the database
  if (!input.workspace_slug || input.workspace_slug.trim().length === 0) {
    errors.push({ field: 'workspace_slug', message: 'Workspace slug is required.' });
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.workspace_slug)) {
    errors.push({
      field: 'workspace_slug',
      message: 'Slug must be lowercase alphanumeric with hyphens only (e.g. "my-farm").',
    });
  }

  // workspace_status
  if (!input.workspace_status) {
    errors.push({ field: 'workspace_status', message: 'Workspace status is required.' });
  } else if (!(WORKSPACE_STATUSES as string[]).includes(input.workspace_status)) {
    errors.push({
      field: 'workspace_status',
      message: `Invalid status "${input.workspace_status}". Must be one of: ${WORKSPACE_STATUSES.join(', ')}.`,
    });
  }

  // workspace_plan
  if (!input.workspace_plan) {
    errors.push({ field: 'workspace_plan', message: 'Workspace plan is required.' });
  } else if (!(WORKSPACE_PLANS as string[]).includes(input.workspace_plan)) {
    errors.push({
      field: 'workspace_plan',
      message: `Invalid plan "${input.workspace_plan}". Must be one of: ${WORKSPACE_PLANS.join(', ')}.`,
    });
  }

  // owner_user_uuid
  if (!input.owner_user_uuid || input.owner_user_uuid.trim().length === 0) {
    errors.push({ field: 'owner_user_uuid', message: 'Owner user UUID is required.' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a WorkspaceUpdateInput patch.
 * Only validates fields that are present in the patch.
 * Slug uniqueness is enforced by the database on save.
 */
export function validateUpdate(
  uuid: string,
  patch: WorkspaceUpdateInput,
): WorkspaceValidationResult {
  const errors: WorkspaceValidationError[] = [];

  if (!uuid) {
    errors.push({ field: 'workspace_uuid', message: 'workspace_uuid is required for update.' });
    return { valid: false, errors };
  }

  if (patch.workspace_type !== undefined) {
    if (!(WORKSPACE_TYPES as string[]).includes(patch.workspace_type)) {
      errors.push({
        field: 'workspace_type',
        message: `Invalid workspace type "${patch.workspace_type}".`,
      });
    }
  }

  if (patch.workspace_name !== undefined) {
    const name = patch.workspace_name.trim();
    if (name.length < 2) {
      errors.push({ field: 'workspace_name', message: 'Workspace name must be at least 2 characters.' });
    } else if (name.length > 120) {
      errors.push({ field: 'workspace_name', message: 'Workspace name must not exceed 120 characters.' });
    }
  }

  if (patch.workspace_slug !== undefined) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(patch.workspace_slug)) {
      errors.push({
        field: 'workspace_slug',
        message: 'Slug must be lowercase alphanumeric with hyphens only.',
      });
    }
  }

  if (patch.workspace_status !== undefined) {
    if (!(WORKSPACE_STATUSES as string[]).includes(patch.workspace_status)) {
      errors.push({ field: 'workspace_status', message: `Invalid status "${patch.workspace_status}".` });
    }
  }

  if (patch.workspace_plan !== undefined) {
    if (!(WORKSPACE_PLANS as string[]).includes(patch.workspace_plan)) {
      errors.push({ field: 'workspace_plan', message: `Invalid plan "${patch.workspace_plan}".` });
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Service Result Type ──────────────────────────────────────────────────────

export type ServiceResult<T> =
  | { ok: true;  data: T }
  | { ok: false; errors: WorkspaceValidationError[]; dependencies?: WorkspaceDependencies };

// ─── Commands ─────────────────────────────────────────────────────────────────

/**
 * Creates a new workspace after validating the input.
 * Persists to Supabase. Returns the created record or validation/repo errors.
 */
export async function createWorkspace(
  input: WorkspaceCreateInput,
): Promise<ServiceResult<WorkspaceRecord>> {
  const validation = validateCreate(input);
  if (!validation.valid) return { ok: false, errors: validation.errors };

  // FLOW-001F4 fix: use the create_workspace_with_owner SECURITY DEFINER RPC
  // (migration 20260728000006) instead of the two-step INSERT approach.
  //
  // Root cause: the workspace_members_owner_bootstrap RLS WITH CHECK policy
  // cannot reliably evaluate auth.uid() during an INSERT in the PostgreSQL 17 /
  // PostgREST execution model — even the simplest `user_id = auth.uid()` check
  // fails with 42501.  The SECURITY DEFINER RPC bypasses this broken path by
  // running the workspace INSERT + member bootstrap in a single atomic DB
  // function that validates ownership at the SQL level (auth.uid() = p_owner_id).
  try {
    const name = input.workspace_name.trim();
    const slug = input.workspace_slug.trim();

    const { data: wsRow, error } = await supabase.rpc('create_workspace_with_owner', {
      p_owner_id:    input.owner_user_uuid,
      p_name:        name,
      p_type:        input.workspace_type as string,
      p_status:      'Aktif',
      p_description: input.description  ?? null,
      p_icon:        input.logo_url     ?? null,
      p_province:    input.province     ?? null,
      p_city:        input.city         ?? null,
      p_district:    input.district     ?? null,
      p_village:     input.village      ?? null,
      p_address:     input.address      ?? null,
      p_latitude:    input.latitude     ?? null,
      p_longitude:   input.longitude    ?? null,
      p_phone:       input.phone        ?? null,
      p_email:       input.email        ?? null,
      p_website:     input.website      ?? null,
      p_metadata: {
        slug,
        plan:        input.workspace_plan ?? 'Free',
        timezone:    input.timezone    ?? 'Asia/Jakarta',
        currency:    input.currency    ?? 'IDR',
        language:    input.language    ?? 'id',
        country:     input.country     ?? null,
        postal_code: input.postal_code ?? null,
      },
    });

    if (error) {
      // Unique slug violation surfaced as a Postgres unique-constraint error
      if (error.code === '23505' || error.message?.toLowerCase().includes('slug')) {
        return { ok: false, errors: [{ field: 'workspace_slug', message: 'Slug sudah digunakan.' }] };
      }
      return { ok: false, errors: [{ field: 'general', message: error.message }] };
    }

    if (!wsRow) {
      return { ok: false, errors: [{ field: 'general', message: 'Workspace creation returned no data.' }] };
    }

    // Keep the DB-to-domain mapping in the repository so every Workspace read
    // uses the same adapter.
    const row = wsRow as Record<string, unknown>;
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    const record = {
      workspace_uuid:   String(row.id ?? ''),
      workspace_type:   (() => {
        const t = String(row.type ?? 'Farm');
        if (t === 'VeterinaryClinic' || t === 'VeterinaryDoctor') return 'Veterinary' as const;
        return t as WorkspaceType;
      })(),
      workspace_name:   String(row.name ?? ''),
      workspace_slug:   String(meta.slug ?? slug),
      workspace_status: (() => {
        const s = String(row.status ?? 'Nonaktif');
        const m: Record<string, string> = { Aktif: 'Active', Nonaktif: 'Inactive', Diarsipkan: 'Archived', Pending: 'Inactive' };
        return (m[s] ?? 'Inactive') as WorkspaceStatus;
      })(),
      workspace_plan:   ((meta.plan as WorkspacePlan) ?? 'Free'),
      owner_user_uuid:  String(row.owner_id ?? input.owner_user_uuid),
      logo_url:    (row.icon        as string | null) ?? null,
      description: (row.description as string | null) ?? null,
      phone:       (row.phone       as string | null) ?? null,
      email:       (row.email       as string | null) ?? null,
      website:     (row.website     as string | null) ?? null,
      country:     (meta.country    as string | null) ?? null,
      province:    (row.province    as string | null) ?? null,
      city:        (row.city        as string | null) ?? null,
      district:    (row.district    as string | null) ?? null,
      village:     (row.village     as string | null) ?? null,
      postal_code: (meta.postal_code as string | null) ?? null,
      address:     (row.address     as string | null) ?? null,
      latitude:    typeof row.latitude  === 'number' ? (row.latitude  as number) : null,
      longitude:   typeof row.longitude === 'number' ? (row.longitude as number) : null,
      timezone:    (meta.timezone   as string | null) ?? null,
      currency:    (meta.currency   as string | null) ?? null,
      language:    (meta.language   as string | null) ?? null,
      created_at:  String(row.created_at  ?? ''),
      updated_at:  String(row.updated_at  ?? ''),
      archived_at: (row.archived_at as string | null) ?? null,
    };

    return { ok: true, data: repoMapWorkspaceRow(wsRow as Record<string, unknown>) };
  } catch (err) {
    if (err instanceof WorkspaceRepoError && err.code === 'SLUG_TAKEN') {
      return {
        ok: false,
        errors: [{ field: 'workspace_slug', message: err.message }],
      };
    }
    const message =
      err instanceof Error ? err.message : 'Failed to create workspace.';
    return { ok: false, errors: [{ field: 'general', message }] };
  }
}

/**
 * Updates an existing workspace with the provided patch.
 * Persists to Supabase. Returns the updated record or validation/repo errors.
 */
export async function updateWorkspace(
  uuid: string,
  patch: WorkspaceUpdateInput,
): Promise<ServiceResult<WorkspaceRecord>> {
  const validation = validateUpdate(uuid, patch);
  if (!validation.valid) return { ok: false, errors: validation.errors };

  try {
    if (patch.workspace_status === 'Archived') {
      const dependencies = await repoGetWorkspaceDependencies(uuid);
      if (dependencies.hasArchiveBlockers) {
        const blockers = dependencies.items
          .filter((item) => item.blocksArchive && item.count > 0)
          .map((item) => `${item.label} (${item.count})`)
          .join(', ');
        return {
          ok: false,
          errors: [{
            field: 'general',
            message: `Workspace tidak dapat diarsipkan karena masih memiliki dependency aktif: ${blockers}.`,
          }],
        };
      }
    }

    const updated = await repoPatchWorkspace(uuid, patch);
    if (!updated) {
      return {
        ok: false,
        errors: [{ field: 'general', message: `Workspace "${uuid}" not found.` }],
      };
    }
    return { ok: true, data: updated };
  } catch (err) {
    if (err instanceof WorkspaceRepoError && err.code === 'SLUG_TAKEN') {
      return {
        ok: false,
        errors: [{ field: 'workspace_slug', message: err.message }],
      };
    }
    const message =
      err instanceof Error ? err.message : 'Failed to update workspace.';
    return { ok: false, errors: [{ field: 'general', message }] };
  }
}

/**
 * Permanently deletes a workspace by UUID.
 * Prefer status → 'Archived' for recoverable soft-deletes.
 */
export async function deleteWorkspace(
  uuid: string,
  preflight?: WorkspaceDependencies,
): Promise<ServiceResult<{ deleted: boolean; dependencies: WorkspaceDependencies }>> {
  try {
    // The UI may pass the dependency preflight it already displayed. This
    // keeps the delete workflow to one dependency read while the repository
    // remains the only source of dependency counts.
    const dependencies = preflight ?? await repoGetWorkspaceDependencies(uuid);
    if (dependencies.hasDeleteBlockers) {
      const blockers = dependencies.items
        .filter((item) => item.blocksDelete && item.count > 0)
        .map((item) => `${item.label} (${item.count})`)
        .join(', ');
      return {
        ok: false,
        errors: [{
          field: 'general',
          message: `Workspace belum dapat dihapus. Selesaikan dependency berikut terlebih dahulu: ${blockers}.`,
        }],
        dependencies,
      };
    }

    const deleted = await repoHardDelete(uuid);
    return { ok: true, data: { deleted, dependencies } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to delete workspace.';
    return { ok: false, errors: [{ field: 'general', message }] };
  }
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────
// generateUniqueSlug uses the local in-memory cache for a best-effort UX hint
// (auto-suggests a unique slug while typing). The database unique constraint
// is the authoritative guard; slug conflicts are returned from save operations.

/**
 * Generates a unique slug candidate for a given name.
 * Checks the local in-memory cache only — use as a UX hint, not as a guarantee.
 */
export function generateUniqueSlug(name: string, excludeUuid?: string): string {
  const base = deriveSlug(name);
  if (!isSlugTaken(base, excludeUuid)) return base;

  let suffix = 2;
  while (isSlugTaken(`${base}-${suffix}`, excludeUuid)) {
    suffix++;
  }
  return `${base}-${suffix}`;
}

// ─── Type Guards ──────────────────────────────────────────────────────────────

export function isWorkspaceType(value: unknown): value is WorkspaceType {
  return typeof value === 'string' && (WORKSPACE_TYPES as string[]).includes(value);
}

export function isWorkspaceStatus(value: unknown): value is WorkspaceStatus {
  return typeof value === 'string' && (WORKSPACE_STATUSES as string[]).includes(value);
}

export function isWorkspacePlan(value: unknown): value is WorkspacePlan {
  return typeof value === 'string' && (WORKSPACE_PLANS as string[]).includes(value);
}
