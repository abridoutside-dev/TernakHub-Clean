// ─── Workspace Roles Edge Function ───────────────────────────────────────────
//
// Contract: list, detail, add, update, update-status, preflight-remove, remove.
// Browser callers must not access workspace_custom_roles or role_permissions
// directly. This function owns authorization and dependency checks.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUILTIN_ROLES = ['Owner', 'Admin', 'Manager', 'Staff', 'Viewer'] as const;
type BuiltinRole = typeof BUILTIN_ROLES[number];
type RoleStatus = 'Active' | 'Inactive';

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function fail(error: string, code = 'BAD_REQUEST', status = 400): Response {
  return response({ ok: false, error, code }, status);
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isSystemAdmin(user: { user_metadata?: Record<string, unknown> | null; app_metadata?: Record<string, unknown> | null }): boolean {
  const metadata = user.user_metadata ?? {};
  const appMetadata = user.app_metadata ?? {};
  return metadata.is_admin === true
    || metadata.role === 'admin'
    || metadata.role === 'system_admin'
    || appMetadata.role === 'admin'
    || appMetadata.role === 'system_admin';
}

function roleId(role: BuiltinRole): string {
  return `builtin:${role}`;
}

function roleName(role: BuiltinRole): string {
  return role === 'Owner' ? 'Owner'
    : role === 'Admin' ? 'Admin'
      : role === 'Manager' ? 'Manager'
        : role === 'Staff' ? 'Staff' : 'Viewer';
}

function roleDescription(role: BuiltinRole): string {
  return role === 'Owner' ? 'Akses penuh dan pengelolaan workspace.'
    : role === 'Admin' ? 'Pengelolaan operasional workspace.'
      : role === 'Manager' ? 'Pengawasan operasional dan laporan.'
        : role === 'Staff' ? 'Akses operasional harian.'
          : 'Akses baca untuk workspace.';
}

function sanitizeErrorMessage(message: string, fallback: string): string {
  const normalized = message.replace(/\s+/g, ' ').trim();
  if (!normalized || normalized.length > 240 || /[\r\n]/.test(message)) return fallback;
  return normalized.replace(/\s*\[[A-Z0-9_:-]+\]\s*$/i, '').trim() || fallback;
}

async function main(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return fail('Method tidak didukung.', 'METHOD_NOT_ALLOWED', 405);

  const url = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!url || !serviceKey || !anonKey) return fail('Supabase belum dikonfigurasi.', 'CONFIGURATION', 500);

  const authorization = request.headers.get('Authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return fail('Authorization header diperlukan.', 'UNAUTHORIZED', 401);

  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await anon.auth.getUser(token);
  if (authError || !authData.user) return fail('Token tidak valid atau kedaluwarsa.', 'UNAUTHORIZED', 401);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json() as Record<string, unknown>;
  } catch {
    return fail('Request body harus berupa JSON.');
  }
  if (payload.action !== 'workspace-roles') return fail('Action tidak dikenal.');

  const operation = typeof payload.operation === 'string' ? payload.operation : '';
  const workspaceId = payload.workspace_id;
  if (!isUuid(workspaceId)) return fail('Workspace ID tidak valid.');

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: callerMembership, error: callerError } = await admin
    .from('workspace_members')
    .select('role, status')
    .eq('workspace_id', workspaceId)
    .eq('user_id', authData.user.id)
    .maybeSingle();
  if (callerError) return fail('Keanggotaan workspace tidak dapat diverifikasi.', 'DATABASE', 500);

  const readable = callerMembership?.status === 'Aktif';
  const manageable = readable && (callerMembership.role === 'Owner' || callerMembership.role === 'Admin');
  if (!isSystemAdmin(authData.user) && !readable) {
    return fail('Anda bukan member workspace ini.', 'FORBIDDEN', 403);
  }
  if (!isSystemAdmin(authData.user) && ['add', 'update', 'update-status', 'preflight-remove', 'remove'].includes(operation) && !manageable) {
    return fail('Hanya Owner atau Admin yang dapat mengelola workspace role.', 'FORBIDDEN', 403);
  }

  const permissionResult = await admin
    .from('role_permissions')
    .select('role, module, action, allowed')
    .in('role', [...BUILTIN_ROLES]);
  if (permissionResult.error) return fail('Permission role bawaan tidak dapat dimuat.', 'DATABASE', 500);

  const permissionMaps = new Map<BuiltinRole, Record<string, Record<string, boolean>>>();
  for (const role of BUILTIN_ROLES) permissionMaps.set(role, {});
  for (const row of permissionResult.data ?? []) {
    const role = row.role as BuiltinRole;
    const map = permissionMaps.get(role);
    if (!map) continue;
    map[row.module] ??= {};
    map[row.module][row.action] = row.allowed === true;
  }

  const builtins = BUILTIN_ROLES.map((role) => ({
    id: roleId(role),
    workspace_id: null,
    name: roleName(role),
    description: roleDescription(role),
    permissions: permissionMaps.get(role) ?? {},
    created_by: null,
    created_at: null,
    updated_at: null,
    status: 'Active' as const,
    role_kind: 'builtin' as const,
  }));

  const customQuery = admin
    .from('workspace_custom_roles')
    .select('id, workspace_id, name, description, permissions, created_by, created_at, updated_at, status')
    .eq('workspace_id', workspaceId)
    .order('name');
  const { data: customRows, error: customError } = await customQuery;
  if (customError) return fail('Custom role tidak dapat dimuat.', 'DATABASE', 500);
  const customs = (customRows ?? []).map((row) => ({ ...row, role_kind: 'custom' as const }));

  if (operation === 'list') return response({ ok: true, data: [...builtins, ...customs] });

  const requestedKind = payload.role_kind === 'builtin' ? 'builtin' : 'custom';
  const requestedId = payload.role_id;
  if (operation === 'detail') {
    if (requestedKind === 'builtin') {
      const found = builtins.find((role) => role.id === requestedId || role.name === requestedId);
      return response({ ok: true, data: found ?? null });
    }
    if (!isUuid(requestedId)) return fail('Role ID tidak valid.');
    return response({ ok: true, data: customs.find((role) => role.id === requestedId) ?? null });
  }

  if (operation === 'add') {
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    if (name.length < 2 || name.length > 40) return fail('Nama role harus 2–40 karakter.', 'NAME_REQUIRED');
    const { count } = await admin.from('workspace_custom_roles').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
    if ((count ?? 0) >= 20) return fail('Maksimal 20 custom role per workspace.', 'FORBIDDEN', 403);
    const inserted = await admin.from('workspace_custom_roles').insert({
      workspace_id: workspaceId,
      name,
      description: typeof payload.description === 'string' ? payload.description : null,
      permissions: payload.permissions && typeof payload.permissions === 'object' ? payload.permissions : {},
      created_by: authData.user.id,
    }).select('id, workspace_id, name, description, permissions, created_by, created_at, updated_at, status').single();
    if (inserted.error) return fail(inserted.error.code === '23505' ? 'Nama role sudah digunakan.' : 'Custom role tidak dapat dibuat.', inserted.error.code === '23505' ? 'DUPLICATE_NAME' : 'DATABASE', inserted.error.code === '23505' ? 409 : 500);
    return response({ ok: true, data: { ...inserted.data, role_kind: 'custom' } });
  }

  if (requestedKind !== 'custom' || !isUuid(requestedId)) return fail('Custom role ID tidak valid.');
  const existing = customs.find((role) => role.id === requestedId);
  if (operation === 'preflight-remove') {
    if (!existing) return response({ ok: true, data: null });
    const { count, error } = await admin
      .from('workspace_members')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('custom_role_id', requestedId);
    if (error) return fail('Dependency role tidak dapat diperiksa.', 'DATABASE', 500);
    return response({
      ok: true,
      data: {
        role: { ...existing, role_kind: 'custom' },
        dependencies: [{
          key: 'members',
          label: 'Member workspace',
          count: count ?? 0,
          description: 'Member yang masih menggunakan role ini.',
          blocksDelete: true,
        }],
      },
    });
  }
  if (!existing && operation !== 'add') return fail('Custom role tidak ditemukan.', 'NOT_FOUND', 404);

  if (operation === 'update' || operation === 'update-status') {
    const patch: Record<string, unknown> = {};
    if (operation === 'update') {
      if (payload.name !== undefined) {
        const name = typeof payload.name === 'string' ? payload.name.trim() : '';
        if (name.length < 2 || name.length > 40) return fail('Nama role harus 2–40 karakter.', 'NAME_REQUIRED');
        patch.name = name;
      }
      if (payload.description !== undefined) patch.description = payload.description;
      if (payload.permissions !== undefined) patch.permissions = payload.permissions;
    } else {
      if (payload.status !== 'Active' && payload.status !== 'Inactive') return fail('Status role tidak valid.');
      patch.status = payload.status;
    }
    if (!Object.keys(patch).length) return fail('Perubahan role kosong.');
    const updated = await admin.from('workspace_custom_roles').update(patch)
      .eq('id', requestedId).eq('workspace_id', workspaceId)
      .select('id, workspace_id, name, description, permissions, created_by, created_at, updated_at, status').single();
    if (updated.error) return fail(updated.error.code === '23505' ? 'Nama role sudah digunakan.' : 'Custom role tidak dapat diperbarui.', updated.error.code === '23505' ? 'DUPLICATE_NAME' : 'DATABASE', updated.error.code === '23505' ? 409 : 500);
    return response({ ok: true, data: { ...updated.data, role_kind: 'custom' } });
  }

  if (operation === 'remove') {
    const { count, error } = await admin.from('workspace_members').select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId).eq('custom_role_id', requestedId);
    if (error) return fail('Dependency role tidak dapat diperiksa.', 'DATABASE', 500);
    if ((count ?? 0) > 0) return fail('Role masih digunakan oleh member workspace.', 'DEPENDENCY', 409);
    const removed = await admin.from('workspace_custom_roles').delete().eq('id', requestedId).eq('workspace_id', workspaceId);
    if (removed.error) return fail('Custom role tidak dapat dihapus.', 'DATABASE', 500);
    return response({ ok: true, data: { removed: true } });
  }

  return fail('Operasi workspace roles tidak dikenal.');
}

Deno.serve(async (request: Request) => {
  try {
    return await main(request);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Operasi workspace roles gagal.';
    return fail(sanitizeErrorMessage(message, 'Operasi workspace roles gagal.'), 'INTERNAL', 500);
  }
});