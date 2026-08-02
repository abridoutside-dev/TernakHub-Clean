// ─── Custom Roles Repository — AUTH-001B ─────────────────────────────────────
//
// Async Supabase adapter for the `workspace_custom_roles` table.
// Only the workspace Owner can create/update/delete custom roles (enforced by RLS).
//
// Rules:
//  - All functions are async.
//  - Never import from pages, components, or contexts.

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';
import type {
  CustomRoleRecord,
  CustomRoleCreateInput,
  CustomRoleUpdateInput,
} from '../types/customRole';

// ─── Error type ───────────────────────────────────────────────────────────────

export class CustomRoleRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'CustomRoleRepoError';
  }
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

function fromDbRow(row: Record<string, unknown>): CustomRoleRecord {
  return {
    id:           row.id as string,
    workspace_id: row.workspace_id as string,
    name:         row.name as string,
    description:  (row.description as string | null) ?? null,
    permissions:  (row.permissions as Record<string, unknown>) ?? {},
    created_by:   (row.created_by as string | null) ?? null,
    created_at:   row.created_at as string,
    updated_at:   row.updated_at as string,
  };
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function repoListCustomRoles(
  workspaceId: string,
): Promise<CustomRoleRecord[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspace_custom_roles')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name');

  if (error) {
    console.warn('[customRolesRepository] listCustomRoles error:', error.message);
    return [];
  }
  return (data ?? []).map((row) => fromDbRow(row as Record<string, unknown>));
}

export async function repoGetCustomRoleById(
  id: string,
): Promise<CustomRoleRecord | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspace_custom_roles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.warn('[customRolesRepository] getById error:', error.message);
    return null;
  }
  return data ? fromDbRow(data as Record<string, unknown>) : null;
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function repoCreateCustomRole(
  input: CustomRoleCreateInput,
): Promise<CustomRoleRecord> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspace_custom_roles')
    .insert({
      workspace_id: input.workspace_id,
      name:         input.name.trim(),
      description:  input.description?.trim() ?? null,
      permissions:  input.permissions,
      created_by:   input.created_by ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new CustomRoleRepoError(
        `A custom role named "${input.name}" already exists in this workspace.`,
        'DUPLICATE_NAME',
      );
    }
    throw new CustomRoleRepoError(error.message, error.code);
  }

  return fromDbRow(data as Record<string, unknown>);
}

export async function repoUpdateCustomRole(
  id: string,
  patch: CustomRoleUpdateInput,
): Promise<CustomRoleRecord | null> {
  await requireAuthSession();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name        !== undefined) update.name        = patch.name.trim();
  if (patch.description !== undefined) update.description = patch.description?.trim() ?? null;
  if (patch.permissions !== undefined) update.permissions = patch.permissions;

  const { data, error } = await supabase
    .from('workspace_custom_roles')
    .update(update)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw new CustomRoleRepoError('A custom role with that name already exists.', 'DUPLICATE_NAME');
    }
    throw new CustomRoleRepoError(error.message, error.code);
  }

  return data ? fromDbRow(data as Record<string, unknown>) : null;
}

export async function repoDeleteCustomRole(id: string): Promise<boolean> {
  await requireAuthSession();
  const { error, count } = await supabase
    .from('workspace_custom_roles')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) throw new CustomRoleRepoError(error.message, error.code);
  return (count ?? 0) > 0;
}
