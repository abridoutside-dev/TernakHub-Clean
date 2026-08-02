// ─── Workspace Domain Types — WS-001 ─────────────────────────────────────────
//
// Single source of truth for all Workspace-related TypeScript types.
// Imported by the repository, service, and context layers.
//
// Rules:
//  - Never import from pages or components here.
//  - Add new WorkspaceType values here when a new type is introduced;
//    the service layer will automatically surface them in validation.
//  - workspace_uuid is always a UUID v4 — generated once at creation.

// ─── Enumerations ─────────────────────────────────────────────────────────────

/**
 * Supported workspace types.
 * Architecture is open: add new literal values here to support future types.
 */
export type WorkspaceType =
  | 'Farm'
  | 'FeedStore'
  | 'Veterinary'
  | 'Transport';

export type WorkspaceStatus = 'Active' | 'Inactive' | 'Archived';

/**
 * Subscription plan attached to a workspace.
 * Independent from user authentication / Supabase Auth.
 */
export type WorkspacePlan = 'Free' | 'Pro' | 'Enterprise';

// ─── Core Domain Model ────────────────────────────────────────────────────────

/**
 * Full workspace record as stored in the repository.
 * All optional fields are nullable (never undefined) for predictable serialisation.
 */
export interface WorkspaceRecord {
  workspace_uuid: string;           // UUID v4 — immutable after creation
  workspace_type: WorkspaceType;
  workspace_name: string;
  workspace_slug: string;           // URL-safe, lowercase, unique across all workspaces
  workspace_status: WorkspaceStatus;
  workspace_plan: WorkspacePlan;
  owner_user_uuid: string;          // Supabase Auth user UUID of the workspace owner

  // Branding & profile
  logo_url: string | null;
  description: string | null;

  // Contact
  phone: string | null;
  email: string | null;
  website: string | null;

  // Location
  country: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  village: string | null;
  postal_code: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;

  // Localisation
  timezone: string | null;
  currency: string | null;
  language: string | null;

  // Timestamps (ISO 8601)
  created_at: string;
  updated_at: string;
  archived_at: string | null;       // null when status !== 'Archived'
}

// ─── Input / DTO Types ────────────────────────────────────────────────────────

/**
 * Fields required to create a new workspace.
 * System-managed fields (uuid, timestamps) are excluded.
 */
export type WorkspaceCreateInput = Omit<
  WorkspaceRecord,
  'workspace_uuid' | 'created_at' | 'updated_at' | 'archived_at'
>;

/**
 * Fields that can be updated after creation.
 * workspace_uuid, owner_user_uuid, and timestamps are immutable.
 */
export type WorkspaceUpdateInput = Partial<
  Omit<WorkspaceRecord, 'workspace_uuid' | 'owner_user_uuid' | 'created_at' | 'updated_at' | 'archived_at'>
>;

// ─── Validation ───────────────────────────────────────────────────────────────

export interface WorkspaceValidationError {
  field: keyof WorkspaceRecord | 'general';
  message: string;
}

export interface WorkspaceValidationResult {
  valid: boolean;
  errors: WorkspaceValidationError[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** All supported workspace types in declaration order. */
export const WORKSPACE_TYPES: WorkspaceType[] = [
  'Farm',
  'FeedStore',
  'Veterinary',
  'Transport',
];

export const WORKSPACE_STATUSES: WorkspaceStatus[] = [
  'Active',
  'Inactive',
  'Archived',
];

export const WORKSPACE_PLANS: WorkspacePlan[] = [
  'Free',
  'Pro',
  'Enterprise',
];

/** Human-readable labels for each workspace type. */
export const WORKSPACE_TYPE_LABEL: Record<WorkspaceType, string> = {
  Farm:        'Farm',
  FeedStore:   'Feed Store',
  Veterinary:  'Veterinary',
  Transport:   'Transport',
};

export const WORKSPACE_STATUS_LABEL: Record<WorkspaceStatus, string> = {
  Active:   'Active',
  Inactive: 'Inactive',
  Archived: 'Archived',
};

export const WORKSPACE_PLAN_LABEL: Record<WorkspacePlan, string> = {
  Free:       'Free',
  Pro:        'Pro',
  Enterprise: 'Enterprise',
};
