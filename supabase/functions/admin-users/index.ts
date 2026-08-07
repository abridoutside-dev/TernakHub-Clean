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
const MEMBER_WORKSPACE_MESSAGE = 'User masih menjadi anggota Workspace. Hapus membership terlebih dahulu.';
const ROLE_MESSAGE = 'User masih memiliki peran atau hak akses Workspace. Hapus peran terlebih dahulu.';
const INVITATION_MESSAGE = 'User masih memiliki undangan Workspace. Hapus undangan terlebih dahulu.';
const OWNER_WORKSPACE_GUIDANCE = 'Transfer kepemilikan atau hapus workspace terlebih dahulu';

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

interface WorkspaceDependency {
  id: string;
  name: string;
  workspace_type: string;
  workspace_status?: string | null;
}

interface WorkspaceMemberDependency extends WorkspaceDependency {
  workspace_id: string;
  membership_id: string;
  role: string;
  status: string;
  custom_role_id?: string | null;
}

interface WorkspaceRoleDependency extends WorkspaceDependency {
  id: string;
  workspace_id: string;
  name: string;
  description?: string | null;
  role_kind: 'assigned' | 'created';
  workspace_member_id?: string | null;
}

interface WorkspaceInvitationDependency extends WorkspaceDependency {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  status: string;
  expires_at?: string | null;
  created_at: string;
}

interface UserDependencies {
  ownerWorkspaces: WorkspaceDependency[];
  memberWorkspaces: WorkspaceMemberDependency[];
  roles: WorkspaceRoleDependency[];
  invitations: WorkspaceInvitationDependency[];
  canDelete: boolean;
  reason: string | null;
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

function workspaceDependency(row: Record<string, unknown>): WorkspaceDependency | null {
  const workspace = row.workspaces;
  if (!workspace || typeof workspace !== 'object' || Array.isArray(workspace)) return null;
  const value = workspace as Record<string, unknown>;
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  return {
    id: value.id,
    name: value.name,
    workspace_type: typeof value.type === 'string' ? value.type : '',
    workspace_status: typeof value.status === 'string' ? value.status : null,
  };
}

function dependencyReason(dependencies: Omit<UserDependencies, 'canDelete' | 'reason'>): string | null {
  if (dependencies.ownerWorkspaces.length > 0) return 'USER_IS_OWNER';
  if (dependencies.memberWorkspaces.length > 0) return 'USER_IS_MEMBER';
  if (dependencies.roles.length > 0) return 'USER_HAS_WORKSPACE_ROLE';
  if (dependencies.invitations.length > 0) return 'USER_HAS_WORKSPACE_INVITATION';
  return null;
}

async function readDependencies(url: string, key: string, userId: string): Promise<UserDependencies> {
  const userFilter = encodeURIComponent(userId);
  const [ownersResponse, membersResponse, assignedRolesResponse, createdRolesResponse, invitationsResponse] = await Promise.all([
    restFetch(url, `/workspaces?owner_id=eq.${userFilter}&select=id,name,type,status`, key),
    // Owner memberships are represented by ownerWorkspaces. Keeping them out of
    // this collection makes the dependency sections actionable and prevents a
    // workspace from appearing twice in the admin dialog.
    restFetch(
      url,
      `/workspace_members?user_id=eq.${userFilter}&role=neq.Owner&select=id,workspace_id,role,status,custom_role_id,workspaces(id,name,type,status)`,
      key,
    ),
    restFetch(
      url,
      `/workspace_members?user_id=eq.${userFilter}&custom_role_id=not.is.null&select=id,workspace_id,custom_role_id,workspaces(id,name,type,status),workspace_custom_roles(id,name,description)`,
      key,
    ),
    restFetch(
      url,
      `/workspace_custom_roles?created_by=eq.${userFilter}&select=id,workspace_id,name,description,workspaces(id,name,type,status)`,
      key,
    ),
    restFetch(
      url,
      `/workspace_invitations?invited_by=eq.${userFilter}&select=id,workspace_id,email,role,status,expires_at,created_at,workspaces(id,name,type,status)`,
      key,
    ),
  ]);

  const responses = [
    [ownersResponse, 'Gagal memeriksa kepemilikan workspace'],
    [membersResponse, 'Gagal memeriksa membership workspace'],
    [assignedRolesResponse, 'Gagal memeriksa peran workspace'],
    [createdRolesResponse, 'Gagal memeriksa peran workspace'],
    [invitationsResponse, 'Gagal memeriksa undangan workspace'],
  ] as const;
  for (const [response, fallback] of responses) {
    if (!response.ok) throw new Error(await responseMessage(response, fallback));
  }

  const owners = await ownersResponse.json() as Array<Record<string, unknown>>;
  const members = await membersResponse.json() as Array<Record<string, unknown>>;
  const assignedRoles = await assignedRolesResponse.json() as Array<Record<string, unknown>>;
  const createdRoles = await createdRolesResponse.json() as Array<Record<string, unknown>>;
  const invitations = await invitationsResponse.json() as Array<Record<string, unknown>>;

  const ownerWorkspaces: WorkspaceDependency[] = (Array.isArray(owners) ? owners : []).flatMap(row => {
    if (typeof row.id !== 'string' || typeof row.name !== 'string') return [];
    return [{
      id: row.id,
      name: row.name,
      workspace_type: typeof row.type === 'string' ? row.type : '',
      workspace_status: typeof row.status === 'string' ? row.status : null,
    }];
  });
  const memberWorkspaces: WorkspaceMemberDependency[] = (Array.isArray(members) ? members : []).flatMap(row => {
    const workspace = workspaceDependency(row);
    if (!workspace || typeof row.id !== 'string' || typeof row.workspace_id !== 'string') return [];
    return [{
      ...workspace,
      workspace_id: row.workspace_id,
      membership_id: row.id,
      role: typeof row.role === 'string' ? row.role : '',
      status: typeof row.status === 'string' ? row.status : '',
      custom_role_id: typeof row.custom_role_id === 'string' ? row.custom_role_id : null,
    }];
  });
  const roles: WorkspaceRoleDependency[] = [
    ...(Array.isArray(assignedRoles) ? assignedRoles : []).flatMap(row => {
      const workspace = workspaceDependency(row);
      const role = row.workspace_custom_roles;
      if (!workspace || typeof row.id !== 'string' || typeof row.workspace_id !== 'string' || !role || typeof role !== 'object' || Array.isArray(role)) return [];
      const roleValue = role as Record<string, unknown>;
      if (typeof roleValue.id !== 'string' || typeof roleValue.name !== 'string') return [];
      return [{
        ...workspace,
        id: roleValue.id,
        workspace_id: row.workspace_id,
        name: roleValue.name,
        description: typeof roleValue.description === 'string' ? roleValue.description : null,
        role_kind: 'assigned' as const,
        workspace_member_id: row.id,
      }];
    }),
    ...(Array.isArray(createdRoles) ? createdRoles : []).flatMap(row => {
      const workspace = workspaceDependency(row);
      if (!workspace || typeof row.id !== 'string' || typeof row.workspace_id !== 'string' || typeof row.name !== 'string') return [];
      return [{
        ...workspace,
        id: row.id,
        workspace_id: row.workspace_id,
        name: row.name,
        description: typeof row.description === 'string' ? row.description : null,
        role_kind: 'created' as const,
      }];
    }),
  ];
  const invitationDependencies: WorkspaceInvitationDependency[] = (Array.isArray(invitations) ? invitations : []).flatMap(row => {
    const workspace = workspaceDependency(row);
    if (!workspace || typeof row.id !== 'string' || typeof row.workspace_id !== 'string' || typeof row.email !== 'string' || typeof row.role !== 'string' || typeof row.status !== 'string' || typeof row.created_at !== 'string') return [];
    return [{
      ...workspace,
      id: row.id,
      workspace_id: row.workspace_id,
      email: row.email,
      role: row.role,
      status: row.status,
      expires_at: typeof row.expires_at === 'string' ? row.expires_at : null,
      created_at: row.created_at,
    }];
  });

  const result = { ownerWorkspaces, memberWorkspaces, roles, invitations: invitationDependencies };
  const reason = dependencyReason(result);
  return { ...result, canDelete: reason === null, reason };
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
    const dependencies = await readDependencies(url, serviceRole, id);
    if (!dependencies.canDelete) {
      const reasonMessage = dependencies.reason === 'USER_IS_OWNER'
        ? OWNER_WORKSPACE_MESSAGE
        : dependencies.reason === 'USER_IS_MEMBER'
          ? MEMBER_WORKSPACE_MESSAGE
          : dependencies.reason === 'USER_HAS_WORKSPACE_ROLE'
            ? ROLE_MESSAGE
            : INVITATION_MESSAGE;
      return errorResponse(reasonMessage, 409);
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

  if (operation === 'get-dependencies') {
    return jsonResponse({ ok: true, data: await readDependencies(url, serviceRole, id) });
  }

  if (operation === 'transfer-ownership') {
    const workspaceId = typeof payload.workspace_id === 'string' ? payload.workspace_id : '';
    const newOwnerId = typeof payload.new_owner_id === 'string' ? payload.new_owner_id : '';
    if (!workspaceId || !newOwnerId) return errorResponse('Workspace dan pemilik baru wajib diisi', 400);
    const invalidWorkspaceId = requireUuid(workspaceId, 'Workspace ID');
    const invalidNewOwnerId = requireUuid(newOwnerId, 'User pemilik baru');
    if (invalidWorkspaceId || invalidNewOwnerId) return errorResponse(invalidWorkspaceId ?? invalidNewOwnerId ?? 'Data transfer tidak valid', 400);
    if (newOwnerId === id) return errorResponse('Pemilik baru harus berbeda dari user yang akan dihapus', 400);

    const [workspaceResponse, newOwner, currentMemberResponse, newOwnerMemberResponse] = await Promise.all([
      restFetch(url, `/workspaces?id=eq.${workspaceId}&owner_id=eq.${id}&select=id,name`, serviceRole),
      readUser(url, serviceRole, newOwnerId),
      restFetch(url, `/workspace_members?workspace_id=eq.${workspaceId}&user_id=eq.${id}&select=id,role,status`, serviceRole),
      restFetch(url, `/workspace_members?workspace_id=eq.${workspaceId}&user_id=eq.${newOwnerId}&select=id,role,status`, serviceRole),
    ]);
    if (!workspaceResponse.ok) return errorResponse(await responseMessage(workspaceResponse, 'Workspace tidak ditemukan'), 404);
    const ownedRows = await workspaceResponse.json();
    if (!Array.isArray(ownedRows) || ownedRows.length === 0) return errorResponse('User bukan pemilik Workspace tersebut', 409);
    if (!currentMemberResponse.ok || !newOwnerMemberResponse.ok) {
      return errorResponse('Membership Workspace tidak dapat diverifikasi', 409);
    }
    const currentMembers = await currentMemberResponse.json();
    const newOwnerMembers = await newOwnerMemberResponse.json();
    if (!Array.isArray(currentMembers) || currentMembers.length === 0) return errorResponse('Membership pemilik saat ini tidak ditemukan', 409);

    if (!Array.isArray(newOwnerMembers) || newOwnerMembers.length === 0) {
      const insertMember = await restFetch(url, '/workspace_members', serviceRole, {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          user_id: newOwnerId,
          role: 'Owner',
          status: 'Aktif',
          joined_at: new Date().toISOString(),
        }),
      });
      if (!insertMember.ok) return errorResponse(await responseMessage(insertMember, 'Pemilik baru tidak dapat ditambahkan ke Workspace'), insertMember.status);
    } else {
      const promoteMember = await restFetch(
        url,
        `/workspace_members?id=eq.${encodeURIComponent(newOwnerMembers[0].id)}&workspace_id=eq.${workspaceId}&user_id=eq.${newOwnerId}`,
        serviceRole,
        { method: 'PATCH', body: JSON.stringify({ role: 'Owner', status: 'Aktif' }) },
      );
      if (!promoteMember.ok) return errorResponse(await responseMessage(promoteMember, 'Peran pemilik baru tidak dapat diperbarui'), promoteMember.status);
    }

    const updateWorkspace = await restFetch(url, `/workspaces?id=eq.${workspaceId}&owner_id=eq.${id}`, serviceRole, {
      method: 'PATCH',
      body: JSON.stringify({ owner_id: newOwnerId }),
    });
    if (!updateWorkspace.ok) return errorResponse(await responseMessage(updateWorkspace, 'Kepemilikan Workspace gagal dipindahkan'), updateWorkspace.status);
    const demoteCurrent = await restFetch(
      url,
      `/workspace_members?id=eq.${encodeURIComponent(currentMembers[0].id)}&workspace_id=eq.${workspaceId}&user_id=eq.${id}`,
      serviceRole,
      { method: 'PATCH', body: JSON.stringify({ role: 'Admin' }) },
    );
    if (!demoteCurrent.ok) return errorResponse(await responseMessage(demoteCurrent, 'Kepemilikan berpindah, tetapi peran pemilik lama gagal diperbarui'), demoteCurrent.status);
    return jsonResponse({ ok: true, data: { ok: true, new_owner_id: newOwner.id } });
  }

  if (operation === 'delete-workspace') {
    const workspaceId = typeof payload.workspace_id === 'string' ? payload.workspace_id : '';
    if (!workspaceId) return errorResponse('Workspace ID wajib diisi', 400);
    const invalidWorkspaceId = requireUuid(workspaceId, 'Workspace ID');
    if (invalidWorkspaceId) return errorResponse(invalidWorkspaceId, 400);
    const response = await restFetch(url, `/workspaces?id=eq.${workspaceId}&owner_id=eq.${id}`, serviceRole, { method: 'DELETE' });
    if (!response.ok) return errorResponse(await responseMessage(response, 'Workspace tidak dapat dihapus'), response.status);
    const deleted = await response.json();
    if (!Array.isArray(deleted) || deleted.length === 0) return errorResponse('Workspace tidak ditemukan atau bukan milik user ini', 404);
    return jsonResponse({ ok: true, data: { ok: true } });
  }

  if (operation === 'remove-role') {
    const memberId = typeof payload.workspace_member_id === 'string' ? payload.workspace_member_id : '';
    const roleId = typeof payload.role_id === 'string' ? payload.role_id : '';
    if (memberId) {
      const invalidMemberId = requireUuid(memberId, 'Workspace membership ID');
      if (invalidMemberId) return errorResponse(invalidMemberId, 400);
      const response = await restFetch(url, `/workspace_members?id=${memberId}&user_id=${id}&custom_role_id=not.is.null`, serviceRole, {
        method: 'PATCH',
        body: JSON.stringify({ custom_role_id: null }),
      });
      if (!response.ok) return errorResponse(await responseMessage(response, 'Peran user gagal dihapus'), response.status);
      const changed = await response.json();
      if (!Array.isArray(changed) || changed.length === 0) return errorResponse('Peran user tidak ditemukan', 404);
      return jsonResponse({ ok: true, data: { ok: true } });
    }
    if (!roleId) return errorResponse('Role ID atau membership ID wajib diisi', 400);
    const invalidRoleId = requireUuid(roleId, 'Role ID');
    if (invalidRoleId) return errorResponse(invalidRoleId, 400);
    const response = await restFetch(url, `/workspace_custom_roles?id=${roleId}&created_by=${id}`, serviceRole, { method: 'DELETE' });
    if (!response.ok) return errorResponse(await responseMessage(response, 'Peran Workspace gagal dihapus'), response.status);
    const deleted = await response.json();
    if (!Array.isArray(deleted) || deleted.length === 0) return errorResponse('Peran Workspace tidak ditemukan', 404);
    return jsonResponse({ ok: true, data: { ok: true } });
  }

  if (operation === 'remove-invitation') {
    const invitationId = typeof payload.invitation_id === 'string' ? payload.invitation_id : '';
    if (!invitationId) return errorResponse('Invitation ID wajib diisi', 400);
    const invalidInvitationId = requireUuid(invitationId, 'Invitation ID');
    if (invalidInvitationId) return errorResponse(invalidInvitationId, 400);
    const response = await restFetch(url, `/workspace_invitations?id=${invitationId}&invited_by=${id}`, serviceRole, { method: 'DELETE' });
    if (!response.ok) return errorResponse(await responseMessage(response, 'Undangan Workspace gagal dihapus'), response.status);
    const deleted = await response.json();
    if (!Array.isArray(deleted) || deleted.length === 0) return errorResponse('Undangan Workspace tidak ditemukan', 404);
    return jsonResponse({ ok: true, data: { ok: true } });
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