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

const OWNER_WORKSPACE_MESSAGE = 'User masih menjadi Owner Workspace. Pindahkan kepemilikan atau hapus workspace terlebih dahulu.';

function sanitizeErrorMessage(message: string, fallback: string): string {
  const normalized = message.replace(/\s+/g, ' ').trim();

  // Never pass database diagnostics, SQLSTATE codes, stack traces, or internal
  // constraint names to the browser. Ownership is handled first so the admin
  // receives the actionable business rule instead of a foreign-key error.
  if (
    /workspaces_owner_id_fkey|owner_id.*auth\.users|violates foreign key constraint.*workspaces/i.test(normalized)
    || /user masih menjadi owner|owner workspace/i.test(normalized)
  ) {
    return OWNER_WORKSPACE_MESSAGE;
  }
  if (
    /violates foreign key constraint|foreign key constraint|sqlstate|postgres|postgrest|database error|syntax error|relation .* does not exist|column .* does not exist|duplicate key|constraint .* failed|stack trace|at \w+\s*\(/i.test(normalized)
  ) {
    return fallback;
  }
  if (!normalized || normalized.length > 240 || /[\r\n]/.test(message)) return fallback;

  // Keep only short, user-facing Auth/API messages. Remove internal error
  // codes because the operation contract exposes only ok/data or ok/error.
  return normalized.replace(/\s*\[[A-Z0-9_:-]+\]\s*$/i, '').trim() || fallback;
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

async function authPublicFetch(url: string, path: string, key: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${url}/auth/v1${path}`, {
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
  try {
    const raw = await response.clone().text();
    if (!raw.trim()) return `${fallback} (HTTP ${response.status})`;
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return sanitizeErrorMessage(raw.slice(0, 500), fallback);
    }

    const candidates = [
      body.message,
      body.error_description,
      body.error,
      body.msg,
      body.details,
      body.hint,
    ];
    const message = candidates.find(value => typeof value === 'string' && value.trim());
    return typeof message === 'string'
      ? sanitizeErrorMessage(
        `${message}${body.code && typeof body.code === 'string' ? ` [${body.code}]` : ''}`,
        fallback,
      )
      : `${fallback} (HTTP ${response.status})`;
  } catch {
    return `${fallback} (HTTP ${response.status})`;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireUuid(value: string, label: string): string | null {
  return UUID_RE.test(value) ? null : `${label} tidak valid`;
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
  const perPage = 100;
  const users: AuthUser[] = [];
  let page = 1;
  let reportedTotal: number | null = null;

  while (true) {
    const response = await authFetch(url, `/users?per_page=${perPage}&page=${page}`, key);
    if (!response.ok) throw new Error(await responseMessage(response, `Auth API halaman ${page} gagal`));
    const body = await response.json() as { users?: AuthUser[] } | AuthUser[];
    const pageUsers = Array.isArray(body) ? body : body.users ?? [];
    users.push(...pageUsers);

    if (reportedTotal === null) {
      const header = response.headers.get('x-total-count');
      const parsedHeader = header ? Number.parseInt(header, 10) : Number.NaN;
      if (Number.isFinite(parsedHeader) && parsedHeader >= 0) {
        reportedTotal = parsedHeader;
      } else {
        const link = response.headers.get('link') ?? '';
        const lastPage = link.match(/page=(\d+)[^>]*>;\s*rel="last"/i);
        if (lastPage) reportedTotal = Number(lastPage[1]) * perPage;
      }
    }

    if (pageUsers.length < perPage) break;
    if (reportedTotal !== null && users.length >= reportedTotal) break;
    page += 1;
  }

  // The header/link is only a pagination hint. The fetched collection is the
  // authoritative total for this function because filters and stats operate
  // on every returned user.
  return { users, total: users.length };
}

async function readUser(url: string, key: string, id: string): Promise<AuthUser> {
  const response = await authFetch(url, `/users/${id}`, key);
  if (!response.ok) throw new Error(await responseMessage(response, 'User tidak ditemukan'));
  return await response.json() as AuthUser;
}

async function readProfiles(url: string, key: string): Promise<Map<string, Profile>> {
  const response = await restFetch(url, '/user_profiles?select=id,full_name,display_name,phone_number,avatar_url', key);
  if (!response.ok) throw new Error(await responseMessage(response, 'Gagal memuat profil pengguna'));
  const profiles = await response.json() as Profile[];
  return new Map((Array.isArray(profiles) ? profiles : []).map(profile => [profile.id, profile]));
}

async function readMemberships(url: string, key: string, userId: string): Promise<unknown[]> {
  const response = await restFetch(
    url,
    `/workspace_members?user_id=eq.${encodeURIComponent(userId)}&select=id,role,status,joined_at,created_at,workspace_id,workspaces(id,name,type,status,city,province)`,
    key,
  );
  if (!response.ok) throw new Error(await responseMessage(response, 'Gagal memuat workspace pengguna'));
  const memberships = await response.json();
  if (!Array.isArray(memberships)) throw new Error('Response workspace pengguna tidak valid');
  return memberships;
}

async function readOwnedWorkspaces(url: string, key: string, userId: string): Promise<Array<{ id?: string; name?: string }>> {
  const response = await restFetch(
    url,
    `/workspaces?owner_id=eq.${encodeURIComponent(userId)}&select=id,name`,
    key,
  );
  if (!response.ok) throw new Error(await responseMessage(response, 'Gagal memeriksa kepemilikan workspace'));
  const workspaces = await response.json();
  if (!Array.isArray(workspaces)) throw new Error('Response kepemilikan workspace tidak valid');
  return workspaces as Array<{ id?: string; name?: string }>;
}

async function handleAdminUsers(
  payload: Record<string, unknown>,
  url: string,
  serviceRole: string,
  anonKey: string,
): Promise<Response> {
  const operation = typeof payload.operation === 'string' ? payload.operation : '';
  const id = typeof payload.id === 'string' ? payload.id : '';

  if (operation === 'stats' || operation === 'list') {
    const fetched = await fetchAllUsers(url, serviceRole);
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

    const profiles = await readProfiles(url, serviceRole);
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
  const invalidId = requireUuid(id, 'User ID');
  if (invalidId) return errorResponse(invalidId, 400);

  if (operation === 'get') {
    const [user, profilesResponse, membershipsResponse] = await Promise.all([
      readUser(url, serviceRole, id),
      restFetch(url, `/user_profiles?id=eq.${id}&select=*`, serviceRole),
      readMemberships(url, serviceRole, id),
    ]);
    if (!profilesResponse.ok) {
      throw new Error(await responseMessage(profilesResponse, 'Gagal memuat profil pengguna'));
    }
    const profiles = await profilesResponse.json() as Profile[];
    return jsonResponse({
      ok: true,
      data: {
        ...listItem(user, profiles[0] ?? null),
        phone_confirmed_at: user.phone_confirmed_at ?? null,
        user_metadata: user.user_metadata ?? {},
        app_metadata: user.app_metadata ?? {},
         providers: providers(user).map(provider => {
           const identity = (user.identities ?? []).find(item => item.provider === provider);
           return {
             provider,
             created_at: identity?.created_at ?? '',
             last_sign_in_at: identity?.last_sign_in_at ?? undefined,
           };
         }),
        factors: (user.factors ?? []).map(factor => ({
          id: factor.id,
          type: factor.factor_type ?? '',
          status: factor.status ?? '',
        })),
         workspaces: membershipsResponse,
      },
    });
  }

  if (operation === 'update' || operation === 'update-metadata') {
    const user = await readUser(url, serviceRole, id);
    const metadata = { ...(user.user_metadata ?? {}) };
    const appMetadata = { ...(user.app_metadata ?? {}) };
    if (payload.user_metadata && typeof payload.user_metadata === 'object' && !Array.isArray(payload.user_metadata)) {
      Object.assign(metadata, payload.user_metadata);
    }
    if (payload.app_metadata && typeof payload.app_metadata === 'object' && !Array.isArray(payload.app_metadata)) {
      Object.assign(appMetadata, payload.app_metadata);
    }
    if (typeof payload.full_name === 'string') metadata.full_name = payload.full_name;
    if (typeof payload.is_admin === 'boolean') metadata.is_admin = payload.is_admin;
    if (Object.keys(metadata).length === 0 && Object.keys(appMetadata).length === 0) {
      return errorResponse('Metadata yang akan diperbarui wajib diisi', 400);
    }
    const response = await authFetch(url, `/users/${id}`, serviceRole, {
      method: 'PUT',
      body: JSON.stringify({ user_metadata: metadata, app_metadata: appMetadata }),
    });
    if (!response.ok) return errorResponse(await responseMessage(response, 'Gagal memperbarui user'), response.status);
    if (typeof payload.full_name === 'string') {
      const profileResponse = await restFetch(url, `/user_profiles?id=eq.${id}`, serviceRole, {
        method: 'PATCH',
        body: JSON.stringify({ full_name: payload.full_name }),
      });
      if (!profileResponse.ok) {
        throw new Error(await responseMessage(profileResponse, 'Metadata Auth berhasil, tetapi profil pengguna gagal diperbarui'));
      }
    }
    return jsonResponse({ ok: true, data: { ok: true } });
  }

  if (operation === 'delete') {
    const ownedWorkspaces = await readOwnedWorkspaces(url, serviceRole, id);
    if (ownedWorkspaces.length > 0) {
      const workspaceNames = ownedWorkspaces
        .map(workspace => workspace.name)
        .filter((name): name is string => Boolean(name?.trim()))
        .slice(0, 3);
      const suffix = workspaceNames.length > 0
        ? ` (${workspaceNames.join(', ')}${ownedWorkspaces.length > workspaceNames.length ? ', dan lainnya' : ''})`
        : '';
      return errorResponse(
        `${OWNER_WORKSPACE_MESSAGE.replace(/\.$/, '')}${suffix}. ${OWNER_WORKSPACE_GUIDANCE}`,
        409,
      );
    }
  }

  const authOperations: Record<string, { method: string; path: string; body?: Record<string, unknown> }> = {
    suspend: { method: 'PUT', path: `/users/${id}`, body: { ban_duration: '876600h' } },
    unsuspend: { method: 'PUT', path: `/users/${id}`, body: { ban_duration: 'none' } },
    'verify-email': { method: 'PUT', path: `/users/${id}`, body: { email_confirm: true } },
    delete: { method: 'DELETE', path: `/users/${id}` },
  };
  if (authOperations[operation]) {
    const action = authOperations[operation];
    const response = await authFetch(url, action.path, serviceRole, {
      method: action.method,
      ...(action.body ? { body: JSON.stringify(action.body) } : {}),
    });
    if (!response.ok) {
      return errorResponse(await responseMessage(response, 'Operasi user gagal'), response.status);
    }
    return jsonResponse({ ok: true, data: { ok: true } });
  }

  if (operation === 'sign-out') {
    const user = await readUser(url, serviceRole, id);
    if (!user.email) return errorResponse('User tidak memiliki email; sesi tidak dapat dicabut melalui Auth API.', 400);

    // GoTrue has no admin endpoint that accepts a user ID for logout. Create
    // a short-lived, server-only magic-link token for the target user, exchange
    // it for that user's JWT, then use the supported global logout endpoint.
    const linkResponse = await authFetch(url, '/generate_link', serviceRole, {
      method: 'POST',
      body: JSON.stringify({ type: 'magiclink', email: user.email }),
    });
    if (!linkResponse.ok) {
      return errorResponse(await responseMessage(linkResponse, 'Gagal menyiapkan pencabutan sesi user'), linkResponse.status);
    }
    const linkBody = await linkResponse.json() as {
      hashed_token?: string;
      verification_type?: string;
      properties?: { hashed_token?: string; verification_type?: string };
    };
    const hashedToken = linkBody.hashed_token ?? linkBody.properties?.hashed_token;
    const verificationType = linkBody.verification_type ?? linkBody.properties?.verification_type ?? 'magiclink';
    if (!hashedToken) return errorResponse('Auth API tidak mengembalikan token sesi sementara', 502);

    const verifyResponse = await authPublicFetch(url, '/verify', anonKey, {
      method: 'POST',
      body: JSON.stringify({ type: verificationType, token_hash: hashedToken }),
    });
    if (!verifyResponse.ok) {
      return errorResponse(await responseMessage(verifyResponse, 'Gagal memvalidasi token sesi sementara'), verifyResponse.status);
    }
    const verifyBody = await verifyResponse.json() as { access_token?: string };
    if (!verifyBody.access_token) return errorResponse('Auth API tidak mengembalikan access token sesi sementara', 502);

    const logoutResponse = await authPublicFetch(url, '/logout?scope=global', anonKey, {
      method: 'POST',
      headers: { Authorization: `Bearer ${verifyBody.access_token}` },
    });
    if (!logoutResponse.ok && logoutResponse.status !== 204) {
      return errorResponse(await responseMessage(logoutResponse, 'Gagal sign out semua sesi user'), logoutResponse.status);
    }
    return jsonResponse({ ok: true, data: { ok: true } });
  }

  if (operation === 'reset-password' || operation === 'resend-verification') {
    const user = await readUser(url, serviceRole, id);
    if (!user.email) return errorResponse('User tidak memiliki email', 400);
    const response = operation === 'resend-verification'
      ? await authPublicFetch(url, '/resend', anonKey, {
        method: 'POST',
        body: JSON.stringify({ type: 'signup', email: user.email }),
      })
      : await authFetch(url, '/generate_link', serviceRole, {
      method: 'POST',
      body: JSON.stringify({ type: operation === 'reset-password' ? 'recovery' : 'signup', email: user.email }),
    });
    if (!response.ok) return errorResponse(await responseMessage(response, 'Gagal membuat link'), response.status);
    const body = await response.json() as { action_link?: string; properties?: { action_link?: string } };
    return jsonResponse({ ok: true, data: { ok: true, link: body.action_link ?? body.properties?.action_link ?? null } });
  }

  if (operation === 'get-workspaces') {
    return jsonResponse({ ok: true, data: { memberships: await readMemberships(url, serviceRole, id) } });
  }

  if (operation === 'add-workspace') {
    if (typeof payload.workspace_id !== 'string' || typeof payload.role !== 'string') {
      return errorResponse('workspace_id dan role wajib diisi', 400);
    }
    const invalidWorkspaceId = requireUuid(payload.workspace_id, 'Workspace ID');
    if (invalidWorkspaceId) return errorResponse(invalidWorkspaceId, 400);
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
    const created = await response.json();
    if (!Array.isArray(created) || created.length === 0) return errorResponse('Membership tidak berhasil dibuat', 409);
    return jsonResponse({ ok: true, data: { ok: true } });
  }

  if (operation === 'update-workspace' || operation === 'remove-workspace') {
    const memberId = typeof payload.workspace_member_id === 'string' ? payload.workspace_member_id : '';
    if (!memberId) return errorResponse('Workspace membership ID diperlukan', 400);
    const invalidMemberId = requireUuid(memberId, 'Workspace membership ID');
    if (invalidMemberId) return errorResponse(invalidMemberId, 400);
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
    const changed = await response.json();
    if (!Array.isArray(changed) || changed.length === 0) return errorResponse('Workspace membership tidak ditemukan', 404);
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
    return await handleAdminUsers(payload, url, serviceRole, anonKey);
  } catch (cause) {
    return errorResponse(
      sanitizeErrorMessage(cause instanceof Error ? cause.message : '', 'Operasi admin user gagal'),
      500,
    );
  }
});