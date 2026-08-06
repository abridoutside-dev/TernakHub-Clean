// ─── admin-users Edge Function ───────────────────────────────────────────────
//
// Dedicated Admin User backend for the Cloudflare Pages frontend.
// Platform monitoring remains isolated in platform-health.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ ok: false, error: message }, status);
}

interface AuthUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  phone_confirmed_at?: string | null;
  banned_until?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
  identities?: Array<{
    provider?: string;
    created_at?: string;
    last_sign_in_at?: string | null;
  }> | null;
  factors?: Array<{ id: string; factor_type?: string; status?: string }> | null;
  is_anonymous?: boolean;
}

interface Profile {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
}

function headers(key: string): Record<string, string> {
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    'Content-Type': 'application/json',
  };
}

async function authFetch(url: string, path: string, key: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${url}/auth/v1/admin${path}`, {
    ...init,
    headers: { ...headers(key), ...(init.headers ?? {}) },
  });
}

async function restFetch(url: string, path: string, key: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers: { ...headers(key), Prefer: 'return=representation', ...(init.headers ?? {}) },
  });
}

async function responseMessage(response: Response, fallback: string): Promise<string> {
  return response.json()
    .then(body => typeof body?.message === 'string' ? body.message : fallback)
    .catch(() => fallback);
}

function isAdmin(user: { user_metadata?: Record<string, unknown> | null; app_metadata?: Record<string, unknown> | null }): boolean {
  const metadata = user.user_metadata ?? {};
  const appMetadata = user.app_metadata ?? {};
  return metadata.is_admin === true
    || metadata.role === 'admin'
    || metadata.role === 'system_admin'
    || appMetadata.role === 'admin'
    || appMetadata.role === 'system_admin';
}

function providers(user: AuthUser): string[] {
  const identityProviders = (user.identities ?? [])
    .map(identity => identity.provider)
    .filter((provider): provider is string => Boolean(provider));
  if (identityProviders.length > 0) return identityProviders;
  const metadataProviders = user.app_metadata?.providers;
  return Array.isArray(metadataProviders)
    ? metadataProviders.filter((provider): provider is string => typeof provider === 'string')
    : [];
}

function status(user: AuthUser): 'Active' | 'Suspended' | 'Pending' {
  if (user.banned_until && new Date(user.banned_until) > new Date()) return 'Suspended';
  if (!user.email_confirmed_at && !user.phone_confirmed_at) return 'Pending';
  return 'Active';
}

function listItem(user: AuthUser, profile: Profile | null) {
  return {
    id: user.id,
    email: user.email ?? '',
    phone: user.phone ?? '',
    created_at: user.created_at ?? '',
    updated_at: user.updated_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
    email_confirmed_at: user.email_confirmed_at ?? null,
    banned_until: user.banned_until ?? null,
    status: status(user),
    is_admin: isAdmin(user),
    providers: providers(user),
    mfa_enabled: (user.factors ?? []).some(factor => factor.status === 'verified'),
    profile,
  };
}

async function fetchAllUsers(url: string, key: string): Promise<{ users: AuthUser[]; total: number }> {
  const first = await authFetch(url, '/users?per_page=1&page=1', key);
  if (!first.ok) throw new Error(await responseMessage(first, `Auth API error ${first.status}`));
  const firstBody = await first.json() as { users?: AuthUser[] } | AuthUser[];
  const firstUsers = Array.isArray(firstBody) ? firstBody : firstBody.users ?? [];
  const header = first.headers.get('x-total-count');
  const total = header ? Number.parseInt(header, 10) : firstUsers.length;
  const users = [...firstUsers];

  for (let page = 2; page <= total; page += 1) {
    const response = await authFetch(url, `/users?per_page=1&page=${page}`, key);
    if (!response.ok) throw new Error(await responseMessage(response, `Auth API page ${page} failed`));
    const body = await response.json() as { users?: AuthUser[] } | AuthUser[];
    users.push(...(Array.isArray(body) ? body : body.users ?? []));
  }
  return { users, total };
}

async function readUser(url: string, key: string, id: string): Promise<AuthUser> {
  const response = await authFetch(url, `/users/${id}`, key);
  if (!response.ok) throw new Error(await responseMessage(response, 'User tidak ditemukan'));
  return await response.json() as AuthUser;
}

async function readProfiles(url: string, key: string): Promise<Map<string, Profile>> {
  const response = await restFetch(url, '/user_profiles?select=id,full_name,display_name,phone_number,avatar_url', key);
  if (!response.ok) return new Map();
  const profiles = await response.json() as Profile[];
  return new Map((Array.isArray(profiles) ? profiles : []).map(profile => [profile.id, profile]));
}

async function handleAdminUsers(
  payload: Record<string, unknown>,
  url: string,
  serviceRole: string,
): Promise<Response> {
  const operation = typeof payload.operation === 'string' ? payload.operation : '';
  const id = typeof payload.id === 'string' ? payload.id : '';

  if (operation === 'stats' || operation === 'list') {
    const [fetched, profiles] = await Promise.all([
      fetchAllUsers(url, serviceRole),
      readProfiles(url, serviceRole),
    ]);
    if (operation === 'stats') {
      const now = new Date();
      const verified = fetched.users.filter(user => Boolean(user.email_confirmed_at || user.phone_confirmed_at)).length;
      const suspended = fetched.users.filter(user => Boolean(user.banned_until && new Date(user.banned_until) > now)).length;
      const anonymous = fetched.users.filter(user => {
        const userProviders = providers(user);
        return userProviders.length === 0 || userProviders.every(provider => provider === 'anonymous');
      }).length;
      return jsonResponse({
        ok: true,
        data: {
          total: fetched.total,
          active: fetched.users.filter(user => status(user) === 'Active').length,
          suspended,
          verified,
          unverified: fetched.users.filter(user => !user.email_confirmed_at && !user.phone_confirmed_at).length,
          anonymous,
        },
      });
    }

    const page = Math.max(1, Number(payload.page) || 1);
    const limit = Math.min(Math.max(1, Number(payload.limit) || 20), 100);
    const search = typeof payload.search === 'string' ? payload.search.toLowerCase().trim() : '';
    const requestedStatus = typeof payload.status === 'string' ? payload.status : 'all';
    const emailFilter = typeof payload.emailFilter === 'string' ? payload.emailFilter : 'all';
    const sortBy = typeof payload.sort === 'string' ? payload.sort : 'created_at';
    const order = payload.order === 'asc' ? 'asc' : 'desc';
    let users = fetched.users.filter(user => {
      const profile = profiles.get(user.id);
      const name = (profile?.full_name ?? profile?.display_name ?? '').toLowerCase();
      const matchesSearch = !search
        || name.includes(search)
        || (user.email ?? '').toLowerCase().includes(search)
        || user.id.toLowerCase().includes(search)
        || (user.phone ?? '').includes(search);
      const matchesStatus = requestedStatus === 'all' || status(user) === requestedStatus;
      const matchesEmail = emailFilter === 'verified'
        ? Boolean(user.email_confirmed_at || user.phone_confirmed_at)
        : emailFilter === 'unverified'
          ? !user.email_confirmed_at && !user.phone_confirmed_at
          : true;
      return matchesSearch && matchesStatus && matchesEmail;
    });
    users.sort((left, right) => {
      const value = (user: AuthUser): string => {
        const profile = profiles.get(user.id);
        if (sortBy === 'email') return user.email ?? '';
        if (sortBy === 'last_sign_in_at') return user.last_sign_in_at ?? '';
        if (sortBy === 'name') return (profile?.full_name ?? profile?.display_name ?? '').toLowerCase();
        return user.created_at ?? '';
      };
      const leftValue = value(left);
      const rightValue = value(right);
      if (leftValue === rightValue) return 0;
      const result = leftValue < rightValue ? -1 : 1;
      return order === 'asc' ? result : -result;
    });
    const total = users.length;
    const start = (page - 1) * limit;
    return jsonResponse({
      ok: true,
      data: {
        users: users.slice(start, start + limit).map(user => listItem(user, profiles.get(user.id) ?? null)),
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  if (!id) return errorResponse('User ID diperlukan', 400);

  if (operation === 'get') {
    const [user, profilesResponse, membershipsResponse] = await Promise.all([
      readUser(url, serviceRole, id),
      restFetch(url, `/user_profiles?id=eq.${id}&select=*`, serviceRole),
      restFetch(url, `/workspace_members?user_id=eq.${id}&select=id,role,status,joined_at,created_at,workspace_id,workspaces(id,name,type,status,city,province)`, serviceRole),
    ]);
    const profiles = profilesResponse.ok ? await profilesResponse.json() as Profile[] : [];
    const memberships = membershipsResponse.ok ? await membershipsResponse.json() : [];
    return jsonResponse({
      ok: true,
      data: {
        ...listItem(user, profiles[0] ?? null),
        phone_confirmed_at: user.phone_confirmed_at ?? null,
        user_metadata: user.user_metadata ?? {},
        app_metadata: user.app_metadata ?? {},
        providers: (user.identities ?? []).map(identity => ({
          provider: identity.provider ?? '',
          created_at: identity.created_at ?? '',
          last_sign_in_at: identity.last_sign_in_at ?? undefined,
        })),
        factors: (user.factors ?? []).map(factor => ({
          id: factor.id,
          type: factor.factor_type ?? '',
          status: factor.status ?? '',
        })),
        workspaces: Array.isArray(memberships) ? memberships : [],
      },
    });
  }

  if (operation === 'update') {
    const user = await readUser(url, serviceRole, id);
    const metadata = { ...(user.user_metadata ?? {}) };
    if (typeof payload.full_name === 'string') metadata.full_name = payload.full_name;
    if (typeof payload.is_admin === 'boolean') metadata.is_admin = payload.is_admin;
    const response = await authFetch(url, `/users/${id}`, serviceRole, {
      method: 'PUT',
      body: JSON.stringify({ user_metadata: metadata }),
    });
    if (!response.ok) return errorResponse(await responseMessage(response, 'Gagal memperbarui user'), response.status);
    if (typeof payload.full_name === 'string') {
      await restFetch(url, `/user_profiles?id=eq.${id}`, serviceRole, {
        method: 'PATCH',
        body: JSON.stringify({ full_name: payload.full_name }),
      });
    }
    return jsonResponse({ ok: true, data: { ok: true } });
  }

  const authOperations: Record<string, { method: string; path: string; body?: Record<string, unknown> }> = {
    suspend: { method: 'PUT', path: `/users/${id}`, body: { ban_duration: '876600h' } },
    unsuspend: { method: 'PUT', path: `/users/${id}`, body: { ban_duration: 'none' } },
    'verify-email': { method: 'PUT', path: `/users/${id}`, body: { email_confirm: true } },
    'sign-out': { method: 'POST', path: `/users/${id}/logout`, body: { scope: 'global' } },
    delete: { method: 'DELETE', path: `/users/${id}` },
  };
  if (authOperations[operation]) {
    const action = authOperations[operation];
    const response = await authFetch(url, action.path, serviceRole, {
      method: action.method,
      ...(action.body ? { body: JSON.stringify(action.body) } : {}),
    });
    if (!response.ok && !(operation === 'sign-out' && response.status === 204) && !(operation === 'delete' && response.status === 404)) {
      return errorResponse(await responseMessage(response, 'Operasi user gagal'), response.status);
    }
    return jsonResponse({ ok: true, data: { ok: true } });
  }

  if (operation === 'reset-password' || operation === 'resend-verification') {
    const user = await readUser(url, serviceRole, id);
    if (!user.email) return errorResponse('User tidak memiliki email', 400);
    const response = await authFetch(url, '/generate_link', serviceRole, {
      method: 'POST',
      body: JSON.stringify({ type: operation === 'reset-password' ? 'recovery' : 'signup', email: user.email }),
    });
    if (!response.ok) return errorResponse(await responseMessage(response, 'Gagal membuat link'), response.status);
    const body = await response.json() as { action_link?: string; properties?: { action_link?: string } };
    return jsonResponse({ ok: true, data: { ok: true, link: body.action_link ?? body.properties?.action_link ?? null } });
  }

  if (operation === 'get-workspaces') {
    const response = await restFetch(url, `/workspace_members?user_id=eq.${id}&select=id,role,status,joined_at,created_at,workspace_id,workspaces(id,name,type,status,city,province)`, serviceRole);
    if (!response.ok) return errorResponse(await responseMessage(response, 'Gagal memuat workspace'), response.status);
    return jsonResponse({ ok: true, data: { memberships: await response.json() } });
  }

  if (operation === 'add-workspace') {
    if (typeof payload.workspace_id !== 'string' || typeof payload.role !== 'string') {
      return errorResponse('workspace_id dan role wajib diisi', 400);
    }
    const response = await restFetch(url, '/workspace_members', serviceRole, {
      method: 'POST',
      body: JSON.stringify({
        workspace_id: payload.workspace_id,
        user_id: id,
        role: payload.role,
        status: 'Aktif',
        joined_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) return errorResponse(await responseMessage(response, 'Gagal menambah membership'), response.status);
    return jsonResponse({ ok: true, data: { ok: true } });
  }

  if (operation === 'update-workspace' || operation === 'remove-workspace') {
    const memberId = typeof payload.workspace_member_id === 'string' ? payload.workspace_member_id : '';
    if (!memberId) return errorResponse('Workspace membership ID diperlukan', 400);
    const body: Record<string, unknown> = {};
    if (operation === 'update-workspace') {
      if (typeof payload.role === 'string') body.role = payload.role;
      if (typeof payload.status === 'string') body.status = payload.status;
      if (Object.keys(body).length === 0) return errorResponse('role atau status wajib diisi', 400);
    }
    const response = await restFetch(url, `/workspace_members?id=eq.${memberId}&user_id=eq.${id}`, serviceRole, {
      method: operation === 'remove-workspace' ? 'DELETE' : 'PATCH',
      ...(operation === 'update-workspace' ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) return errorResponse(await responseMessage(response, 'Operasi membership gagal'), response.status);
    return jsonResponse({ ok: true, data: { ok: true } });
  }

  return errorResponse(`Operasi admin user tidak dikenal: "${operation}"`, 400);
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return errorResponse('Method tidak didukung. Gunakan POST.', 405);

  const url = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!url || !serviceRole || !anonKey) return errorResponse('Supabase admin belum dikonfigurasi', 500);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return errorResponse('Request body harus berupa JSON');
  }
  if (payload.action !== 'admin-users') return errorResponse('Action tidak dikenal', 400);

  const authHeader = request.headers.get('Authorization') ?? '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!jwt) return errorResponse('Authorization header diperlukan', 401);
  const anonClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: { user }, error } = await anonClient.auth.getUser(jwt);
  if (error || !user) return errorResponse('Token tidak valid atau sudah kedaluwarsa', 401);
  if (!isAdmin(user)) return errorResponse('Akses ditolak: admin only', 403);

  try {
    return await handleAdminUsers(payload, url, serviceRole);
  } catch (cause) {
    return errorResponse(cause instanceof Error ? cause.message : 'Operasi admin user gagal', 500);
  }
});