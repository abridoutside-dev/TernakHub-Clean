// ─── Workspace Permissions — WS-004 ──────────────────────────────────────────
//
// Reusable role-based permission architecture for TernakHub workspaces.
//
// Architecture:
//   MemberRole → PermissionModule → PermissionAction → boolean
//
// Usage:
//   hasPermission('Manager', 'livestock', 'delete')  // → false
//   getRolePermissions('Admin')                       // → full RolePermissionMap
//
// Rules:
//   - Owner has all permissions on all modules, always.
//   - Permissions are additive per role; no inheritance chain.
//   - This file is read-only data — mutations go through workspaceMembersData.ts.
//   - Future: store overrides per-member in the DB and merge with defaults here.

// ─── Core types ───────────────────────────────────────────────────────────────

export type MemberRole = 'Owner' | 'Admin' | 'Manager' | 'Staff' | 'Viewer';

export type MemberStatus = 'Active' | 'Inactive';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete';

export type PermissionModule =
  | 'dashboard'
  | 'livestock'
  | 'feed'
  | 'medicine'
  | 'marketplace'
  | 'workspaceSettings'
  | 'memberManagement'
  | 'reports'
  | 'ai'
  | 'adminFeatures';

/** Allowed actions for one module. Absent key = denied. */
export type ModulePermissions = Partial<Record<PermissionAction, boolean>>;

/** Complete permission map for one role. */
export type RolePermissionMap = Record<PermissionModule, ModulePermissions>;

// ─── Shorthand sets ───────────────────────────────────────────────────────────

const FULL: ModulePermissions        = { view: true, create: true, update: true, delete: true };
const VIEW_ONLY: ModulePermissions   = { view: true };
const VIEW_WRITE: ModulePermissions  = { view: true, create: true, update: true };
const VIEW_CREATE: ModulePermissions = { view: true, create: true };
const NONE: ModulePermissions        = {};

// ─── Role permission matrix ───────────────────────────────────────────────────
//
// Owner    — unrestricted; all modules, all actions
// Admin    — all except AdminFeatures
// Manager  — full CRUD on operational modules; view-only on settings/members/reports/AI; no admin
// Staff    — view/create on operational modules; no settings, no members, no reports, no admin
// Viewer   — view-only on operational modules + reports + AI; no settings, no members, no admin

export const ROLE_PERMISSION_MATRIX: Record<MemberRole, RolePermissionMap> = {
  Owner: {
    dashboard:        FULL,
    livestock:        FULL,
    feed:             FULL,
    medicine:         FULL,
    marketplace:      FULL,
    workspaceSettings: FULL,
    memberManagement: FULL,
    reports:          FULL,
    ai:               FULL,
    adminFeatures:    FULL,
  },
  Admin: {
    dashboard:        FULL,
    livestock:        FULL,
    feed:             FULL,
    medicine:         FULL,
    marketplace:      FULL,
    workspaceSettings: FULL,
    memberManagement: FULL,
    reports:          FULL,
    ai:               FULL,
    adminFeatures:    NONE,
  },
  Manager: {
    dashboard:        FULL,
    livestock:        FULL,
    feed:             FULL,
    medicine:         FULL,
    marketplace:      FULL,
    workspaceSettings: VIEW_ONLY,
    memberManagement: VIEW_ONLY,
    reports:          VIEW_WRITE,
    ai:               VIEW_ONLY,
    adminFeatures:    NONE,
  },
  Staff: {
    dashboard:        VIEW_ONLY,
    livestock:        VIEW_CREATE,
    feed:             VIEW_CREATE,
    medicine:         VIEW_CREATE,
    marketplace:      VIEW_CREATE,
    workspaceSettings: NONE,
    memberManagement: NONE,
    reports:          NONE,
    ai:               VIEW_ONLY,
    adminFeatures:    NONE,
  },
  Viewer: {
    dashboard:        VIEW_ONLY,
    livestock:        VIEW_ONLY,
    feed:             VIEW_ONLY,
    medicine:         VIEW_ONLY,
    marketplace:      VIEW_ONLY,
    workspaceSettings: NONE,
    memberManagement: NONE,
    reports:          VIEW_ONLY,
    ai:               VIEW_ONLY,
    adminFeatures:    NONE,
  },
};

// ─── Query helpers ────────────────────────────────────────────────────────────

/** Check whether a role has a specific permission. */
export function hasPermission(
  role: MemberRole,
  module: PermissionModule,
  action: PermissionAction,
): boolean {
  return ROLE_PERMISSION_MATRIX[role][module][action] === true;
}

/** Get the full permission map for a role. */
export function getRolePermissions(role: MemberRole): RolePermissionMap {
  return ROLE_PERMISSION_MATRIX[role];
}

/** Get all actions a role can perform on a module. */
export function getAllowedActions(role: MemberRole, module: PermissionModule): PermissionAction[] {
  const perms = ROLE_PERMISSION_MATRIX[role][module];
  return (['view', 'create', 'update', 'delete'] as PermissionAction[]).filter(
    (a) => perms[a] === true,
  );
}

// ─── UI metadata ──────────────────────────────────────────────────────────────

export const MEMBER_ROLES: MemberRole[] = ['Owner', 'Admin', 'Manager', 'Staff', 'Viewer'];

export const ROLE_LABEL: Record<MemberRole, string> = {
  Owner:   'Owner',
  Admin:   'Admin',
  Manager: 'Manager',
  Staff:   'Staff',
  Viewer:  'Viewer',
};

export const ROLE_DESCRIPTION: Record<MemberRole, string> = {
  Owner:   'Full control. Cannot be removed or changed.',
  Admin:   'Full access except admin-only features.',
  Manager: 'Full CRUD on operations; view-only on settings & reports.',
  Staff:   'Can view and create operational records.',
  Viewer:  'Read-only access to all visible modules.',
};

export const ROLE_COLOR: Record<MemberRole, { bg: string; text: string }> = {
  Owner:   { bg: '#fef3c7', text: '#92400e' },
  Admin:   { bg: '#fee2e2', text: '#991b1b' },
  Manager: { bg: '#e0e7ff', text: '#3730a3' },
  Staff:   { bg: '#dcfce7', text: '#166534' },
  Viewer:  { bg: '#f1f5f9', text: '#475569' },
};

export const MODULE_LABEL: Record<PermissionModule, string> = {
  dashboard:        'Dashboard',
  livestock:        'Livestock',
  feed:             'Feed',
  medicine:         'Medicine',
  marketplace:      'Marketplace',
  workspaceSettings: 'Workspace Settings',
  memberManagement: 'Member Management',
  reports:          'Reports',
  ai:               'AI Features',
  adminFeatures:    'Admin Features',
};

export const ACTION_LABEL: Record<PermissionAction, string> = {
  view:   'View',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
};
