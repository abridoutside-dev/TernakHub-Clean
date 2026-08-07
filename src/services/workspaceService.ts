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
  repoPatchWorkspace,
  repoDeleteWorkspace as repoHardDelete,
  WorkspaceRepoError,
} from '../repositories/workspaceRepository';
import { supabase } from '../lib/supabase';

// ─── Re-export slug utilities (consumers import from the service, not the repo)

export { deriveSlug };

// ─── Async read helpers ───────────────────────────────────────────────────────
// These are thin pass-throughs to the repository.
// The WorkspaceContext loads all workspaces on mount; within the React tree
// prefer using context.workspaces.find(...) over calling these directly.

export async function getAllWorkspaces(): Promise<WorkspaceRecord[]> {
  return repoGetAllWorkspaces();
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
  | { ok: false; errors: WorkspaceValidationError[] };

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

    // Map the raw DB row returned by the RPC into a WorkspaceRecord.
    // The RPC returns a `workspaces` row (DB shape), not the app WorkspaceRecord shape.
    // We reuse repoInsertWorkspace's fromDbRow logic indirectly by loading the
    // newly created workspace via repoGetWorkspaceByUuid.
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

    return { ok: true, data: record };
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
): Promise<ServiceResult<{ deleted: boolean }>> {
  try {
    const dependencies = await repoGetWorkspaceDependencies(uuid);
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
      };
    }

    const deleted = await repoHardDelete(uuid);
    return { ok: true, data: { deleted } };
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
