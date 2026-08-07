// ─── useWorkspacePermission — AUTH-001B ──────────────────────────────────────
//
// React hook that resolves the current user's role and permissions for the
// active workspace.
//
// Resolution order:
//   1. Look up the member record for (activeWorkspace, currentUser) in the
//      in-memory workspaceMembersData cache.
//   2. If member.custom_role_id is set, fetch the CustomRoleRecord async and
//      use its permissions (resolveCustomRolePermissions).
//   3. Otherwise use ROLE_PERMISSION_MATRIX[member.role].
//
// Usage:
//   const { role, can, isOwner, isAdmin } = useWorkspacePermission();
//   if (!can('livestock', 'delete')) return <AccessDenied />;

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { getMemberByUserId } from '../data/workspaceMembersData';
import {
  type MemberRole,
  type PermissionModule,
  type PermissionAction,
} from '../types/workspacePermissions';
import {
  getWorkspaceRoles,
  resolveWorkspaceRolePermissions,
} from '../services/workspaceService';
import type { CustomRoleRecord, WorkspaceRoleRecord } from '../types/customRole';
import type { WorkspaceMemberRecord } from '../data/workspaceMembersData';

// ─── Return shape ─────────────────────────────────────────────────────────────

export interface WorkspacePermissionContext {
  /** Built-in role (Owner/Admin/Manager/Staff/Viewer), or null if not a member. */
  role: MemberRole | null;

  /** Full membership record, or null. */
  membership: WorkspaceMemberRecord | null;

  /** Custom role record if a custom role is assigned, otherwise null. */
  customRole: CustomRoleRecord | null;

  /** True while the custom role is being fetched from Supabase. */
  loading: boolean;

  /** True if the user is the workspace Owner. */
  isOwner: boolean;

  /** True if the user is Owner or Admin. */
  isAdmin: boolean;

  /** Whether the resolver allows the owner-only workspace archive/restore action. */
  canArchive: boolean;

  /**
   * Returns true if the current user has `action` permission on `module`.
   * Always returns false for unauthenticated users / non-members.
   */
  can: (module: PermissionModule, action: PermissionAction) => boolean;

  /**
   * Returns the complete resolved permission map for the current user.
   * Useful for building permission matrices in the UI.
   */
  resolvedPermissions: Record<PermissionModule, Record<PermissionAction, boolean>> | null;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const ACTIONS: PermissionAction[]  = ['view', 'create', 'update', 'delete'];
const MODULES: PermissionModule[]  = [
  'dashboard', 'livestock', 'feed', 'medicine', 'marketplace',
  'workspaceSettings', 'memberManagement', 'reports', 'ai', 'adminFeatures',
];

function buildAllFalse(): Record<PermissionModule, Record<PermissionAction, boolean>> {
  const out = {} as Record<PermissionModule, Record<PermissionAction, boolean>>;
  for (const mod of MODULES) {
    out[mod] = {} as Record<PermissionAction, boolean>;
    for (const a of ACTIONS) out[mod][a] = false;
  }
  return out;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkspacePermission(workspaceId?: string): WorkspacePermissionContext {
  const { currentUser }    = useAuth();
  const { activeWorkspace } = useWorkspace();

  const membership = useMemo<WorkspaceMemberRecord | null>(() => {
    const resolvedWorkspaceId = workspaceId ?? activeWorkspace?.workspace_uuid;
    if (!currentUser || !resolvedWorkspaceId) return null;
    return getMemberByUserId(resolvedWorkspaceId, currentUser.id) ?? null;
  }, [currentUser, activeWorkspace?.workspace_uuid, workspaceId]);

  const [customRole, setCustomRole] = useState<CustomRoleRecord | null>(null);
  const [workspaceRoles, setWorkspaceRoles] = useState<WorkspaceRoleRecord[]>([]);
  const [loading,    setLoading]    = useState(false);
  const customRoleId = (membership as (WorkspaceMemberRecord & { custom_role_id?: string | null }) | null)?.custom_role_id;

  // Permissions are loaded from Supabase through the workspace roles Edge Function.
  useEffect(() => {
    let cancelled = false;
    const resolvedWorkspaceId = workspaceId ?? activeWorkspace?.workspace_uuid;
    if (!resolvedWorkspaceId || !membership) {
      queueMicrotask(() => {
        if (!cancelled) {
          setWorkspaceRoles([]);
          setCustomRole(null);
          setLoading(false);
        }
      });
      return () => { cancelled = true; };
    }
    setLoading(true);
    getWorkspaceRoles(resolvedWorkspaceId).then((roles) => {
      if (!cancelled) {
        setWorkspaceRoles(roles);
        const assigned = customRoleId
          ? roles.find((candidate): candidate is CustomRoleRecord =>
            candidate.role_kind === 'custom' && candidate.id === customRoleId)
          : null;
        setCustomRole(assigned ?? null);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setWorkspaceRoles([]);
        setCustomRole(null);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [activeWorkspace?.workspace_uuid, customRoleId, membership, workspaceId]);

  const role: MemberRole | null = membership?.role ?? null;

  const resolvedPermissions = useMemo<
    Record<PermissionModule, Record<PermissionAction, boolean>> | null
  >(() => {
    if (!role) return null;
    const sourceRole = customRole
      ?? workspaceRoles.find((candidate) =>
        candidate.role_kind === 'builtin' && candidate.name === role);
    return sourceRole ? resolveWorkspaceRolePermissions(sourceRole) : buildAllFalse();
  }, [role, customRole, workspaceRoles]);

  function can(module: PermissionModule, action: PermissionAction): boolean {
    if (!role) return false;
    const sourceRole = customRole
      ?? workspaceRoles.find((candidate) =>
        candidate.role_kind === 'builtin' && candidate.name === role);
    return sourceRole
      ? resolveWorkspaceRolePermissions(sourceRole)[module][action] === true
      : false;
  }

  return {
    role,
    membership,
    customRole,
    loading,
    isOwner: role === 'Owner',
    isAdmin: role === 'Owner' || role === 'Admin',
    canArchive: role === 'Owner' && can('workspaceSettings', 'delete'),
    can,
    resolvedPermissions: resolvedPermissions ?? (role ? buildAllFalse() : null),
  };
}
