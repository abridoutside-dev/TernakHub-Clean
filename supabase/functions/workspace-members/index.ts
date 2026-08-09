// ─── Workspace Members Edge Function ─────────────────────────────────────────
//
// Workspace-scoped membership contract:
// list, detail, add, update role/status, and remove.
// Authentication is verified here because this function is deployed with
// verify_jwt=false to keep the browser error contract consistent.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type MemberRole = 'Owner' | 'Admin' | 'Manager' | 'Staff' | 'Viewer' | 'Guest';
type MemberStatus = 'Aktif' | 'Nonaktif' | 'Diundang' | 'Ditangguhkan';

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400): Response {
  return response({ ok: false, error: message }, status);
}

function uuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function dbRole(role: unknown): MemberRole | null {
  return role === 'Owner' || role === 'Admin' || role === 'Staff'
    || role === 'Manager' || role === 'Viewer' || role === 'Guest' ? role : null;
}

function dbStatus(status: unknown): MemberStatus | null {
  return status === 'Aktif' || status === 'Nonaktif'
    || status === 'Diundang' || status === 'Ditangguhkan' ? status : null;
}

function isSystemAdmin(user: { user_metadata?: Record<string, unknown> | null; app_metadata?: Record<string, unknown> | null }): boolean {
  const metadata = user.user_metadata ?? {};
  const appMetadata = user.app_metadata ?? {};
  return metadata.is_admin === true
    || metadata.role === 'admin'
    || metadata.role === 'system_admin'
    || appMetadata.role === 'system_admin';
}

function profileName(profile: Record<string, unknown> | undefined, userId: string): string {
  return (typeof profile?.full_name === 'string' && profile.full_name)
    || (typeof profile?.display_name === 'string' && profile.display_name)
    || `User ${userId.slice(0, 8)}`;
}

async function messageOf(result: Response, fallback: string): Promise<string> {
  try {
    const body = await result.clone().json() as Record<string, unknown>;
    const value = [body.message, body.error, body.details, body.hint]
      .find((item) => typeof item === 'string' && item.trim());
    return typeof value === 'string' ? value : fallback;
  } catch {
    return fallback;
  }
}

async function main(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return errorResponse('Method tidak didukung.', 405);

  const url = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!url || !serviceKey || !anonKey) return errorResponse('Supabase belum dikonfigurasi.', 500);

  const authorization = request.headers.get('Authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return errorResponse('Authorization header diperlukan.', 401);

  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await anon.auth.getUser(token);
  if (authError || !authData.user) return errorResponse('Token tidak valid atau kedaluwarsa.', 401);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json() as Record<string, unknown>;
  } catch {
    return errorResponse('Request body harus berupa JSON.');
  }
  if (payload.action !== 'workspace-members') return errorResponse('Action tidak dikenal.');

  const operation = typeof payload.operation === 'string' ? payload.operation : '';
  const workspaceId = payload.workspace_id;
  const workspaceIds = Array.isArray(payload.workspace_ids) ? payload.workspace_ids : [];
  if (operation !== 'list-many' && !uuid(workspaceId)) return errorResponse('Workspace ID tidak valid.');
  if (operation === 'list-many' && (!workspaceIds.length || workspaceIds.some((id) => !uuid(id)))) {
    return errorResponse('Daftar Workspace ID tidak valid.');
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const ids = operation === 'list-many' ? workspaceIds as string[] : [workspaceId as string];
  const { data: memberships, error: membershipError } = await admin
    .from('workspace_members')
    .select('id, workspace_id, user_id, role, status, joined_at, created_at')
    .in('workspace_id', ids);
  if (membershipError) return errorResponse('Daftar member workspace tidak dapat dimuat.', 500);

  const callerMemberships = (memberships ?? []).filter(
    (member) => member.user_id === authData.user.id
      && member.status === 'Aktif',
  );
  const readableWorkspaceIds = new Set(callerMemberships.map((member) => member.workspace_id));
  const manageableWorkspaceIds = new Set(
    callerMemberships
      .filter((member) => member.role === 'Owner' || member.role === 'Admin')
      .map((member) => member.workspace_id),
  );
  const readOperation = operation === 'list' || operation === 'list-many' || operation === 'detail';
  const authorizedWorkspaceIds = readOperation ? readableWorkspaceIds : manageableWorkspaceIds;
  if (!isSystemAdmin(authData.user) && ids.some((id) => !authorizedWorkspaceIds.has(id))) {
    return errorResponse('Anda tidak memiliki izin mengelola member workspace ini.', 403);
  }

  const memberIds = [...new Set((memberships ?? []).map((member) => member.user_id))];
  const [profilesResult, usersResult] = await Promise.all([
    admin.from('user_profiles')
      .select('id, full_name, display_name, phone_number, whatsapp_number, avatar_url')
      .in('id', memberIds),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (profilesResult.error || usersResult.error) return errorResponse('Profil member tidak dapat dimuat.', 500);
  const profiles = new Map((profilesResult.data ?? []).map((item) => [item.id, item]));
  const users = new Map((usersResult.data.users ?? []).map((user) => [user.id, user]));

  const mapMember = (member: Record<string, unknown>) => {
    const userId = String(member.user_id);
    const profile = profiles.get(userId);
    const user = users.get(userId);
    return {
      member_uuid: member.id,
      workspace_uuid: member.workspace_id,
      user_id: userId,
      name: profileName(profile, userId),
      email: user?.email ?? null,
      phone: profile?.phone_number ?? profile?.whatsapp_number ?? user?.phone ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: member.role === 'Guest' ? 'Viewer' : member.role,
      status: member.status === 'Aktif' ? 'Active' : 'Inactive',
      joined_at: member.joined_at ?? member.created_at,
    };
  };

  if (operation === 'list' || operation === 'list-many') {
    return response({ ok: true, data: (memberships ?? [])
      .filter((member) => ids.includes(member.workspace_id))
      .map((member) => mapMember(member)) });
  }

  if (operation === 'add') {
    const role = dbRole(payload.role);
    if (!role || role === 'Guest') return errorResponse('Role member tidak valid.');
    if (role === 'Owner' && !isSystemAdmin(authData.user)) return errorResponse('Role member tidak valid.');
    let userId = uuid(payload.user_id) ? payload.user_id as string : '';
    if (!userId && typeof payload.email === 'string' && payload.email.trim()) {
      const result = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = result.data.users.find((user) => user.email?.toLowerCase() === payload.email?.trim().toLowerCase());
      userId = found?.id ?? '';
    }
    if (!uuid(userId)) return errorResponse('User dengan email tersebut tidak ditemukan.', 404);
    const [userResult, profileResult] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from('user_profiles')
        .select('id, full_name, display_name, phone_number, whatsapp_number, avatar_url')
        .eq('id', userId)
        .maybeSingle(),
    ]);
    if (userResult.error || profileResult.error) return errorResponse('Profil member tidak dapat dimuat.', 500);
    if (userResult.data.user) users.set(userId, userResult.data.user);
    if (profileResult.data) profiles.set(userId, profileResult.data);
    const inserted = await admin.from('workspace_members')
      .insert({ workspace_id: workspaceId, user_id: userId, role, status: 'Aktif' })
      .select('id, workspace_id, user_id, role, status, joined_at, created_at')
      .single();
    if (inserted.error) return errorResponse(inserted.error.code === '23505' ? 'User sudah menjadi member workspace.' : 'Member tidak dapat ditambahkan.', inserted.error.code === '23505' ? 409 : 500);
    return response({ ok: true, data: mapMember(inserted.data) });
  }

  const memberId = payload.workspace_member_id;
  if (!uuid(memberId)) return errorResponse('Workspace membership ID tidak valid.');
  const target = (memberships ?? []).find(
    (member) => member.id === memberId && member.workspace_id === workspaceId,
  );
  if (!target) return errorResponse('Member tidak ditemukan.', 404);
  if (!isSystemAdmin(authData.user) && target.role === 'Owner') {
    if (operation === 'remove') return errorResponse('Owner tidak dapat dihapus dari workspace.', 409);
    return errorResponse('Owner tidak dapat diubah.', 409);
  }

  if (operation === 'detail') return response({ ok: true, data: mapMember(target) });

  if (operation === 'preflight-remove') {
    return response({
      ok: true,
      data: {
        member: mapMember(target),
        relatedRecords: [],
      },
    });
  }

  if (operation === 'update') {
    const body: Record<string, string> = {};
    const role = payload.role === undefined ? null : dbRole(payload.role);
    const status = payload.status === undefined ? null : (payload.status === 'Active' ? 'Aktif' : payload.status === 'Inactive' ? 'Nonaktif' : null);
    if (payload.role !== undefined && (!role || role === 'Guest' || (role === 'Owner' && !isSystemAdmin(authData.user)))) return errorResponse('Role member tidak valid.');
    if (payload.status !== undefined && !status) return errorResponse('Status member tidak valid.');
    if (role) body.role = role;
    if (status) body.status = status;
    if (!Object.keys(body).length) return errorResponse('Role atau status wajib diisi.');
    const updated = await admin.from('workspace_members')
      .update(body).eq('id', memberId).eq('workspace_id', workspaceId)
      .select('id, workspace_id, user_id, role, status, joined_at, created_at').single();
    if (updated.error) return errorResponse('Member tidak dapat diubah.', 500);
    return response({ ok: true, data: mapMember(updated.data) });
  }

  if (operation === 'remove') {
    // This operation intentionally deletes only the membership relation.
    // The user and workspace are never touched; FK rules protect both.
    const removed = await admin.from('workspace_members').delete()
      .eq('id', memberId).eq('workspace_id', workspaceId);
    if (removed.error) return errorResponse('Member tidak dapat dihapus.', 500);
    return response({ ok: true, data: { removed: true } });
  }
  return errorResponse('Operasi workspace members tidak dikenal.');
}

Deno.serve(async (request) => {
  try {
    return await main(request);
  } catch {
    return errorResponse('Operasi workspace members gagal.', 500);
  }
});