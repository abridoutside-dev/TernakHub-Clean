// ─── platform-health Edge Function ────────────────────────────────────────────
//
// Server-side dispatcher for admin Control Panel data that cannot be fetched
// from the browser (service role queries, Supabase Management API).
//
// Dispatcher pattern — one function, multiple actions (same style as r2-storage).
// Browser-facing actions require a system_admin user JWT. auth_integrity is
// additionally restricted to the server-to-server internal authorization path.
//
// ─── Required Supabase Edge Function Secrets ─────────────────────────────────
//   SUPABASE_URL             — auto-injected by Supabase runtime
//   SUPABASE_ANON_KEY        — auto-injected by Supabase runtime
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase runtime (service role)
//   MANAGEMENT_API_TOKEN     — Supabase personal/service access token
//                              (Management API — GET /v1/projects/:ref/*)
//
// ─── Actions ─────────────────────────────────────────────────────────────────
//   db-info         — PostgreSQL stats via service role (version, connections,
//                     size, extensions, schema migrations, RLS table status,
//                     slow queries from pg_stat_statements)
//   auth-config     — Auth provider config + security settings + user counts
//                     (GET /v1/projects/:ref/config/auth + admin users API)
//   functions-list  — List all deployed Edge Functions
//                     (GET /v1/projects/:ref/functions)
//   secrets-list    — List Edge Function secret names (not values)
//                     (GET /v1/projects/:ref/secrets)
//   auth-users      — Aggregate user counts (total, verified, anonymous, sessions)
//                     via service_role Admin API (GET /auth/v1/admin/users)
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-platform-health-internal-token',
};

function corsOk(): Response {
  return new Response('ok', { headers: CORS_HEADERS });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ ok: false, error: message }, status);
}

// ─── Supabase client helpers ──────────────────────────────────────────────────

function makeAnonClient(jwt: string) {
  const url = Deno.env.get('SUPABASE_URL')      ?? '';
  const key = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth:   { persistSession: false },
  });
}

function makeServiceClient(
  serviceRoleOverride?: string,
) {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = serviceRoleOverride ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function isPlatformAdmin(jwt: string): Promise<boolean> {
  const client = makeAnonClient(jwt);
  const { data: { user } } = await client.auth.getUser(jwt);
  return user?.user_metadata?.role === 'system_admin';
}

// ─── Management API helper ────────────────────────────────────────────────────

function projectRef(): string {
  // Supabase project ref is the first subdomain of SUPABASE_URL:
  // https://<ref>.supabase.co
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  return url.match(/https?:\/\/([\w-]+)\./)?.[1] ?? '';
}

async function managementApiFetch(
  path: string,
  method: 'GET' | 'PATCH' = 'GET',
  body?: Record<string, unknown>,
): Promise<Response> {
  const token = Deno.env.get('MANAGEMENT_API_TOKEN') ?? '';
  if (!token) {
    throw new Error('MANAGEMENT_API_TOKEN belum dikonfigurasi di Edge Function secrets');
  }
  const ref = projectRef();
  if (!ref) throw new Error('Tidak dapat menentukan project ref dari SUPABASE_URL');
  return fetch(`https://api.supabase.com/v1/projects/${ref}${path}`, {
    method,
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

// ─── Action context ───────────────────────────────────────────────────────────

interface ActionContext {
  payload: Record<string, unknown>;
  userId:  string;
  jwt:     string;
  internalAuthorization?: boolean;
}

type Handler = (ctx: ActionContext) => Promise<Response>;

// ─── Action: db-info ──────────────────────────────────────────────────────────
// Runs direct PostgreSQL queries via service role key.
// Queries used:
//   SELECT version()
//   SELECT setting FROM pg_settings WHERE name = 'max_connections'
//   SELECT count(*) FROM pg_stat_activity
//   SELECT pg_size_pretty(pg_database_size(current_database()))
//   SELECT extname, extversion FROM pg_catalog.pg_extension ORDER BY extname
//   SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name <> 'information_schema'
//   SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 1
//   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename

const handleDbInfo: Handler = async () => {
  const svc = makeServiceClient();

  const [
    versionRes,
    maxConnRes,
    activeConnRes,
    dbSizeRes,
    extensionsRes,
    schemasRes,
    migrationRes,
    rlsRes,
  ] = await Promise.allSettled([
    svc.rpc('query_raw', { sql: 'SELECT version() AS version' }).maybeSingle(),
    svc.from('pg_settings' as never).select('setting').eq('name', 'max_connections').maybeSingle(),
    svc.rpc('query_raw', { sql: 'SELECT count(*)::int AS count FROM pg_stat_activity WHERE state IS NOT NULL' }).maybeSingle(),
    svc.rpc('query_raw', { sql: "SELECT pg_size_pretty(pg_database_size(current_database())) AS size" }).maybeSingle(),
    svc.from('pg_catalog.pg_extension' as never).select('extname, extversion').order('extname' as never),
    svc.from('information_schema.schemata' as never)
      .select('schema_name')
      .not('schema_name', 'like', 'pg_%')
      .neq('schema_name', 'information_schema'),
    svc.from('supabase_migrations.schema_migrations' as never)
      .select('version')
      .order('version' as never, { ascending: false })
      .limit(1)
      .maybeSingle(),
    svc.from('pg_tables' as never)
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .order('tablename' as never),
  ]);

  // Extract values with graceful fallbacks
  const version      = versionRes.status === 'fulfilled'    ? (versionRes.value.data as { version?: string } | null)?.version     ?? null : null;
  const maxConn      = maxConnRes.status === 'fulfilled'     ? (maxConnRes.value.data as { setting?: string } | null)?.setting      ?? null : null;
  const activeConn   = activeConnRes.status === 'fulfilled'  ? (activeConnRes.value.data as { count?: number } | null)?.count       ?? null : null;
  const dbSize       = dbSizeRes.status === 'fulfilled'      ? (dbSizeRes.value.data as { size?: string } | null)?.size             ?? null : null;
  const extensions   = extensionsRes.status === 'fulfilled'  ? (extensionsRes.value.data ?? [])  : [];
  const schemas      = schemasRes.status === 'fulfilled'     ? (schemasRes.value.data ?? [])      : [];
  const migration    = migrationRes.status === 'fulfilled'   ? (migrationRes.value.data as { version?: string } | null)?.version   ?? null : null;
  const rlsTables    = rlsRes.status === 'fulfilled'         ? (rlsRes.value.data ?? [])          : [];

  return jsonResponse({
    ok: true,
    db_info: {
      version,
      max_connections:    maxConn,
      active_connections: activeConn,
      database_size:      dbSize,
      extensions,
      schemas:            (schemas as { schema_name: string }[]).map((s) => s.schema_name),
      latest_migration:   migration,
      rls_tables:         rlsTables,
      checked_at:         new Date().toISOString(),
    },
  });
};

// ─── Action: auth-config ──────────────────────────────────────────────────────
// GET /v1/projects/:ref/config/auth via Management API.

const handleAuthConfig: Handler = async () => {
  let cfgData: Record<string, unknown> | null = null;
  let cfgError: string | null = null;

  try {
    const res = await managementApiFetch('/config/auth');
    if (res.ok) {
      cfgData = await res.json() as Record<string, unknown>;
    } else {
      cfgError = `Management API HTTP ${res.status}`;
    }
  } catch (err) {
    cfgError = err instanceof Error ? err.message : 'Management API tidak dapat dijangkau';
  }

  if (cfgError || !cfgData) {
    return jsonResponse({
      ok:         false,
      error:      cfgError ?? 'Tidak ada data',
      auth_config: null,
    });
  }

  // Map relevant fields — field names from Supabase Management API schema
  return jsonResponse({
    ok: true,
    auth_config: {
      // Providers
      external_email_enabled:            cfgData.external_email_enabled          ?? null,
      external_google_enabled:           cfgData.external_google_enabled         ?? null,
      external_github_enabled:           cfgData.external_github_enabled         ?? null,
      external_apple_enabled:            cfgData.external_apple_enabled          ?? null,
      external_phone_enabled:            cfgData.external_phone_enabled          ?? null,
      external_magic_link_enabled:       cfgData.mailer_otp_enabled              ?? null,
      external_anonymous_sign_ins_enabled: cfgData.external_anonymous_sign_ins_enabled ?? null,
      // Security
      mailer_autoconfirm:                cfgData.mailer_autoconfirm              ?? null,
      mfa_totp_enroll_enabled:           cfgData.mfa_totp_enroll_enabled         ?? null,
      mfa_phone_enroll_enabled:          cfgData.mfa_phone_enroll_enabled        ?? null,
      captcha_enabled:                   cfgData.captcha_enabled                 ?? null,
      captcha_provider:                  cfgData.captcha_provider                ?? null,
      password_min_length:               cfgData.password_min_length             ?? null,
      password_required_characters:      cfgData.password_required_characters    ?? null,
      rate_limit_email_sent:             cfgData.rate_limit_email_sent           ?? null,
      rate_limit_sms_sent:               cfgData.rate_limit_sms_sent             ?? null,
      rate_limit_otp:                    cfgData.rate_limit_otp                  ?? null,
      // Redirect
      site_url:                          cfgData.site_url                        ?? null,
      additional_redirect_urls:          cfgData.additional_redirect_urls        ?? null,
    },
  });
};

// ─── Action: functions-list ───────────────────────────────────────────────────
// GET /v1/projects/:ref/functions via Management API.

interface FunctionEntry {
  id:         string;
  slug:       string;
  name:       string;
  status:     string;
  version:    number;
  created_at: string;
  updated_at: string;
}

const handleFunctionsList: Handler = async () => {
  try {
    const res = await managementApiFetch('/functions');
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return jsonResponse({
        ok:        false,
        error:     `Management API HTTP ${res.status}: ${text.slice(0, 200)}`,
        functions: null,
      });
    }
    const data = await res.json() as FunctionEntry[];
    return jsonResponse({
      ok:        true,
      functions: Array.isArray(data) ? data.map((fn) => ({
        id:         fn.id,
        slug:       fn.slug,
        name:       fn.name,
        status:     fn.status,
        version:    fn.version,
        created_at: fn.created_at,
        updated_at: fn.updated_at,
      })) : [],
      count: Array.isArray(data) ? data.length : 0,
    });
  } catch (err) {
    return jsonResponse({
      ok:        false,
      error:     err instanceof Error ? err.message : 'Management API tidak dapat dijangkau',
      functions: null,
    });
  }
};

// ─── Action: secrets-list ─────────────────────────────────────────────────────
// GET /v1/projects/:ref/secrets via Management API.
// Returns secret names only — values are never returned by the Management API.

interface SecretEntry {
  name:    string;
  value?:  string; // API may or may not return masked values
}

const handleSecretsList: Handler = async () => {
  try {
    const res = await managementApiFetch('/secrets');
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return jsonResponse({
        ok:      false,
        error:   `Management API HTTP ${res.status}: ${text.slice(0, 200)}`,
        secrets: null,
      });
    }
    const data = await res.json() as SecretEntry[];
    // Return names only — never expose values
    return jsonResponse({
      ok:      true,
      secrets: Array.isArray(data) ? data.map((s) => ({ name: s.name })) : [],
      count:   Array.isArray(data) ? data.length : 0,
    });
  } catch (err) {
    return jsonResponse({
      ok:      false,
      error:   err instanceof Error ? err.message : 'Management API tidak dapat dijangkau',
      secrets: null,
    });
  }
};

// ─── Action: auth-users ───────────────────────────────────────────────────────
// GET /auth/v1/admin/users via service role key.
// Returns aggregate counts — total, email-verified, anonymous, active sessions.
// Caller must be platform_admin.

interface AuthUser {
  id:                  string;
  email?:              string | null;
  phone?:              string | null;
  user_metadata?:      Record<string, unknown> | null;
  app_metadata?:       Record<string, unknown> | null;
  identities?:         AuthIdentity[] | null;
  email_confirmed_at?: string | null;
  phone_confirmed_at?: string | null;
  is_anonymous?:       boolean;
  last_sign_in_at?:    string | null;
  created_at?:         string | null;
  updated_at?:         string | null;
  banned_until?:       string | null;
  deleted_at?:          string | null;
  factors?: Array<{ id: string; factor_type?: string; status?: string }> | null;
}

interface AuthIdentity {
  id?:            string;
  provider?:      string;
  identity_data?: Record<string, unknown> | null;
}

type AuthIntegrityStatus = 'operational' | 'degraded' | 'down';

interface AuthIntegrityIssue {
  id:          string;
  email:       string | null;
  issue_codes: string[];
  details?:    Record<string, unknown>;
}

interface AuthIntegrityError {
  message: string;
  code:    string | null;
  details: string | null;
  hint:    string | null;
}

interface AuthIntegrityResult {
  status:      AuthIntegrityStatus | 'warning';
  code?:       'SYSTEM_ADMIN_TOKEN_MISSING' | 'SYSTEM_ADMIN_TOKEN_INVALID';
  issue_count: number;
  issues:      AuthIntegrityIssue[];
  error:       string | null;
  error_details: AuthIntegrityError | null;
  checked_at:  string;
}

function warningAuthIntegrity(
  code: 'SYSTEM_ADMIN_TOKEN_MISSING' | 'SYSTEM_ADMIN_TOKEN_INVALID',
): AuthIntegrityResult {
  return {
    status: 'warning',
    code,
    issue_count: 0,
    issues: [],
    error: null,
    error_details: null,
    checked_at: new Date().toISOString(),
  };
}

interface AuthIntegrityProfile {
  id: string;
}

interface AuthIntegrityWorkspace {
  id:       string;
  name?:    string | null;
  owner_id: string | null;
  status?:  string | null;
}

interface AuthIntegrityWorkspaceMember {
  id:           string;
  workspace_id: string;
  user_id:      string;
  role?:        string | null;
  status?:      string | null;
}

/*
 * This check deliberately uses only Supabase's service-role Admin SDK and
 * PostgREST table reads:
 *   - auth.users + auth.identities are returned by auth.admin.listUsers();
 *   - user_profiles, workspaces, and workspace_members are read with the
 *     service-role client.
 *
 * It must not use query_raw(). Apart from avoiding a project-specific RPC
 * dependency, this keeps the check read-only and prevents auth internals such
 * as password hashes and tokens from being selected.
 */
async function checkAuthIntegrity(serviceRole: string): Promise<AuthIntegrityResult> {
  const checkedAt = new Date().toISOString();
  const healthy = (issues: AuthIntegrityIssue[]): AuthIntegrityResult => ({
    status: issues.length === 0 ? 'operational' : 'degraded',
    issue_count: issues.length,
    issues,
    error: null,
    error_details: null,
    checked_at: checkedAt,
  });

  const errorDetails = (error: unknown, fallbackCode: string): AuthIntegrityError => {
    const candidate = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    } | null;
    return {
      message: typeof candidate?.message === 'string'
        ? candidate.message
        : String(error),
      code: typeof candidate?.code === 'string' ? candidate.code : fallbackCode,
      details: typeof candidate?.details === 'string' ? candidate.details : null,
      hint: typeof candidate?.hint === 'string' ? candidate.hint : null,
    };
  };

  const failed = (
    error: unknown,
    fallbackCode: string,
    details?: Record<string, unknown>,
  ): AuthIntegrityResult => {
    const normalized = errorDetails(error, fallbackCode);
    const combinedDetails = details
      ? [normalized.details, JSON.stringify(details)].filter(Boolean).join(' | ')
      : normalized.details;
    const completeError = { ...normalized, details: combinedDetails };
    return {
      status: 'down',
      issue_count: 0,
      issues: [],
      error: completeError.message,
      error_details: completeError,
      checked_at: checkedAt,
    };
  };

  if (!serviceRole) {
    return failed(
      new Error('Missing SUPABASE_SERVICE_ROLE_KEY'),
      'CONFIG_MISSING',
    );
  }

  try {
    // This is the only client used for database reads in this integrity check.
    // It is intentionally created from SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
    // and has no request/user Authorization header.
    const svc = makeServiceClient(serviceRole);
    const perPage = 1000;
    const listAllAuthUsers = async (): Promise<AuthUser[]> => {
      const users: AuthUser[] = [];
      for (let page = 1; page <= 10000; page += 1) {
        const { data, error } = await svc.auth.admin.listUsers({ page, perPage });
        if (error) throw error;
        const pageUsers = (data?.users ?? []) as AuthUser[];
        users.push(...pageUsers);
        if (pageUsers.length < perPage) return users;
      }
      throw new Error('Auth Admin API pagination exceeded the safety limit');
    };

    const readProfiles = async (): Promise<AuthIntegrityProfile[]> => {
      const table = 'user_profiles';
      const { data, error } = await svc.from(table).select('id');
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error(`${table} returned a non-array response`);
      return data as AuthIntegrityProfile[];
    };

    const readWorkspaces = async (): Promise<AuthIntegrityWorkspace[]> => {
      const table = 'workspaces';
      const { data, error } = await svc
        .from(table)
        .select('id, name, owner_id, status');
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error(`${table} returned a non-array response`);
      return data as AuthIntegrityWorkspace[];
    };

    const readWorkspaceMembers = async (): Promise<AuthIntegrityWorkspaceMember[]> => {
      const table = 'workspace_members';
      const { data, error } = await svc
        .from(table)
        .select('id, workspace_id, user_id, role, status');
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error(`${table} returned a non-array response`);
      return data as AuthIntegrityWorkspaceMember[];
    };

    const [
      usersResult,
      profilesResult,
      workspacesResult,
      workspaceMembersResult,
    ] = await Promise.allSettled([
      listAllAuthUsers(),
      readProfiles(),
      readWorkspaces(),
      readWorkspaceMembers(),
    ]);
    const sourceFailures = [
      ['auth.users/auth.identities', usersResult],
      ['user_profiles', profilesResult],
      ['workspaces', workspacesResult],
      ['workspace_members', workspaceMembersResult],
    ]
      .filter((entry): entry is [string, PromiseRejectedResult] => entry[1].status === 'rejected')
      .map(([source, result]) => ({
        source,
        error: errorDetails(result.reason, 'AUTH_INTEGRITY_SOURCE_ERROR'),
      }));
    if (sourceFailures.length > 0) {
      const firstFailure = sourceFailures[0];
      return failed(
        new Error(firstFailure.error.message),
        firstFailure.error.code ?? 'AUTH_INTEGRITY_SOURCE_ERROR',
        {
          table: firstFailure.source === 'auth.users/auth.identities'
            ? null
            : firstFailure.source,
          sources: sourceFailures,
        },
      );
    }

    const users = (usersResult as PromiseFulfilledResult<AuthUser[]>).value;
    const profiles = (profilesResult as PromiseFulfilledResult<AuthIntegrityProfile[]>).value;
    const workspaces = (workspacesResult as PromiseFulfilledResult<AuthIntegrityWorkspace[]>).value;
    const workspaceMembers = (workspaceMembersResult as PromiseFulfilledResult<AuthIntegrityWorkspaceMember[]>).value;
    const authById = new Map(users.map((user) => [user.id, user]));
    const workspaceById = new Map(workspaces.map((workspace) => [workspace.id, workspace]));
    const workspaceIdsByOwner = new Map<string, string[]>();
    const issues: AuthIntegrityIssue[] = [];
    const addIssue = (
      id: string,
      email: string | null,
      issueCodes: string[],
      details: Record<string, unknown>,
    ) => {
      issues.push({ id, email, issue_codes: issueCodes, details });
    };

    const profileCounts = new Map<string, number>();
    for (const profile of profiles) {
      profileCounts.set(profile.id, (profileCounts.get(profile.id) ?? 0) + 1);
      if (!authById.has(profile.id)) {
        addIssue(profile.id, null, ['orphan_profile'], {
          profile_id: profile.id,
          reason: 'user_profiles.id does not match an auth user',
        });
      }
      if ((profileCounts.get(profile.id) ?? 0) > 1) {
        addIssue(profile.id, authById.get(profile.id)?.email ?? null, ['duplicate_profile'], {
          profile_id: profile.id,
          duplicate_count: profileCounts.get(profile.id),
        });
      }
    }

    const profileIds = new Set(profiles.map((profile) => profile.id));
    for (const user of users) {
      const identities = Array.isArray(user.identities) ? user.identities : [];
      // app_metadata.providers is maintained by GoTrue in sync with the actual
      // identity state and is always accurate. The paginated listUsers endpoint
      // (/auth/v1/admin/users?page=N&per_page=M) often returns identities: null
      // even when auth.identities rows exist, causing false positives if we rely
      // solely on the identities array. Using app_metadata.providers as a fallback
      // prevents false-positive missing_identity flags.
      const appMetaProviders: string[] = Array.isArray(
        (user as { app_metadata?: { providers?: unknown } }).app_metadata?.providers,
      )
        ? ((user as { app_metadata: { providers: unknown[] } }).app_metadata.providers as string[])
        : [];
      const emailIdentities = identities.filter((identity) => identity.provider === 'email');
      // An email identity exists if the identities array (when returned) includes
      // an email entry, OR app_metadata.providers (always accurate) includes 'email'.
      const hasEmailIdentity = emailIdentities.length > 0 || appMetaProviders.includes('email');
      const userIssues: string[] = [];
      const userDetails: Record<string, unknown> = {
        user_id: user.id,
        identity_count: identities.length,
      };
      if (!user.is_anonymous && user.email && !hasEmailIdentity) {
        userIssues.push('missing_identity');
        userDetails.identity_providers = identities.map((identity) => identity.provider ?? 'unknown');
      }
      if (emailIdentities.length > 1) {
        userIssues.push('duplicate_identity');
        userDetails.email_identity_count = emailIdentities.length;
      }
      if (!profileIds.has(user.id)) userIssues.push('missing_profile');
      if (userIssues.length > 0) addIssue(user.id, user.email ?? null, userIssues, userDetails);

      const ownedWorkspaceIds = workspaceIdsByOwner.get(user.id) ?? [];
      if (!user.is_anonymous && user.user_metadata?.role !== 'system_admin' && ownedWorkspaceIds.length === 0) {
        addIssue(user.id, user.email ?? null, ['missing_workspace'], {
          user_id: user.id,
          reason: 'non-admin auth user does not own a workspace',
        });
      }
    }

    for (const workspace of workspaces) {
      if (workspace.owner_id) {
        const ownerWorkspaces = workspaceIdsByOwner.get(workspace.owner_id) ?? [];
        ownerWorkspaces.push(workspace.id);
        workspaceIdsByOwner.set(workspace.owner_id, ownerWorkspaces);
      }
      const owner = workspace.owner_id ? authById.get(workspace.owner_id) : undefined;
      if (!workspace.owner_id || !owner) {
        addIssue(workspace.id, null, ['orphan_workspace'], {
          workspace_id: workspace.id,
          owner_id: workspace.owner_id,
          workspace_name: workspace.name ?? null,
        });
      } else if (
        (owner.banned_until && new Date(owner.banned_until).getTime() > Date.now())
        || Boolean(owner.deleted_at)
      ) {
        addIssue(workspace.id, owner.email ?? null, ['inactive_owner'], {
          workspace_id: workspace.id,
          owner_id: owner.id,
          banned_until: owner.banned_until ?? null,
          deleted_at: owner.deleted_at ?? null,
        });
      }
    }

    const ownerMemberships = new Set<string>();
    for (const member of workspaceMembers) {
      const memberUser = authById.get(member.user_id);
      const memberWorkspace = workspaceById.get(member.workspace_id);
      if (!memberUser || !memberWorkspace) {
        addIssue(
          member.id,
          memberUser?.email ?? null,
          ['orphan_workspace_member'],
          {
            membership_id: member.id,
            workspace_id: member.workspace_id,
            user_id: member.user_id,
            missing_user: !memberUser,
            missing_workspace: !memberWorkspace,
          },
        );
      }
      if (
        memberWorkspace
        && memberUser
        && member.workspace_id === memberWorkspace.id
        && member.user_id === memberWorkspace.owner_id
      ) {
        ownerMemberships.add(member.workspace_id);
      }
    }

    for (const workspace of workspaces) {
      if (!ownerMemberships.has(workspace.id)) {
        addIssue(workspace.id, authById.get(workspace.owner_id ?? '')?.email ?? null, [
          'missing_owner_membership',
        ], {
          workspace_id: workspace.id,
          owner_id: workspace.owner_id,
          reason: 'workspace owner has no workspace_members row',
        });
      }
    }

    // Workspace ownership is collected after the user pass above. Re-check
    // missing_workspace using the complete relation map.
    const filteredIssues = issues.filter((issue) => {
      if (!issue.issue_codes.includes('missing_workspace')) return true;
      return !((workspaceIdsByOwner.get(issue.id) ?? []).length > 0);
    });
    return healthy(filteredIssues);
  } catch (err) {
    return failed(err, 'AUTH_INTEGRITY_CHECK_ERROR');
  }
}

const handleAuthIntegrity: Handler = async ({ internalAuthorization }) => {
  if (!internalAuthorization) {
    return jsonResponse({
      ok: true,
      auth_integrity: warningAuthIntegrity('SYSTEM_ADMIN_TOKEN_MISSING'),
    });
  }
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return jsonResponse({
    ok: true,
    auth_integrity: await checkAuthIntegrity(serviceRole),
  });
};

// Some production Auth deployments return a 500 when the Admin API is asked
// for a large page, while the same users are available one at a time. Keep
// this workaround in one place for both auth-users and auth-health.
async function fetchAuthUsers(
  url: string,
  serviceRole: string,
): Promise<{ users: AuthUser[]; total: number; error: string | null; partial: boolean }> {
  const headers = {
    Authorization: `Bearer ${serviceRole}`,
    apikey: serviceRole,
  };
  const first = await fetch(`${url}/auth/v1/admin/users?per_page=1&page=1`, { headers });
  if (!first.ok) {
    const text = await first.text().catch(() => '');
    return { users: [], total: 0, error: `Admin API HTTP ${first.status}: ${text.slice(0, 200)}`, partial: false };
  }

  const firstBody = await first.json() as { users?: AuthUser[] } | AuthUser[];
  const firstUsers = Array.isArray(firstBody)
    ? firstBody as AuthUser[]
    : ((firstBody as { users?: AuthUser[] }).users ?? []);
  const totalHeader = first.headers.get('x-total-count');
  const total = totalHeader ? parseInt(totalHeader, 10) : firstUsers.length;
  const users = [...firstUsers];

  for (let page = 2; page <= total; page += 1) {
    let pageResponse: Response | null = null;
    let lastError = '';
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const candidate = await fetch(`${url}/auth/v1/admin/users?per_page=1&page=${page}`, { headers });
      if (candidate.ok) {
        pageResponse = candidate;
        break;
      }
      lastError = await candidate.text().catch(() => '');
    }
    if (!pageResponse) {
      // Keep the usable pages. A single malformed Auth record should not make
      // the whole health widget BLOCKED; callers receive a degraded status and
      // the exact page error for visibility.
      return {
        users,
        total,
        error: `Admin API page ${page} failed after retries: ${lastError.slice(0, 200)}`,
        partial: true,
      };
    }
    const pageBody = await pageResponse.json() as { users?: AuthUser[] } | AuthUser[];
    const pageUsers = Array.isArray(pageBody)
      ? pageBody as AuthUser[]
      : ((pageBody as { users?: AuthUser[] }).users ?? []);
    users.push(...pageUsers);
  }

  return { users, total, error: null, partial: false };
}

// ─── Action: admin-users ─────────────────────────────────────────────────────
// Browser-facing user management. The service role stays inside this Edge
// Function; Cloudflare Pages only invokes the function with the admin JWT.

type AdminUserProfile = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
};

function adminUserProviders(user: AuthUser): string[] {
  const identityProviders = (user.identities ?? [])
    .map(identity => identity.provider)
    .filter((provider): provider is string => Boolean(provider));
  if (identityProviders.length > 0) return identityProviders;
  const metadataProviders = user.app_metadata?.providers;
  return Array.isArray(metadataProviders)
    ? metadataProviders.filter((provider): provider is string => typeof provider === 'string')
    : [];
}

function adminUserIsAdmin(user: AuthUser): boolean {
  return user.user_metadata?.is_admin === true
    || user.user_metadata?.role === 'admin'
    || user.user_metadata?.role === 'system_admin'
    || user.app_metadata?.role === 'admin'
    || user.app_metadata?.role === 'system_admin';
}

function adminUserStatus(user: AuthUser): 'Active' | 'Suspended' | 'Pending' {
  if (user.banned_until && new Date(user.banned_until) > new Date()) return 'Suspended';
  if (!user.email_confirmed_at && !user.phone_confirmed_at) return 'Pending';
  return 'Active';
}

function adminUserHeaders(key: string): Record<string, string> {
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    'Content-Type': 'application/json',
  };
}

async function adminUserAuthFetch(
  url: string,
  path: string,
  key: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${url}/auth/v1/admin${path}`, {
    ...init,
    headers: { ...adminUserHeaders(key), ...(init.headers ?? {}) },
  });
}

async function adminUserRestFetch(
  url: string,
  path: string,
  key: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers: {
      ...adminUserHeaders(key),
      Prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  });
}

async function adminUserError(response: Response, fallback: string): Promise<string> {
  return response.json()
    .then(body => typeof body?.message === 'string' ? body.message : fallback)
    .catch(() => fallback);
}

function adminUserListItem(user: AuthUser, profile: AdminUserProfile | null) {
  return {
    id: user.id,
    email: user.email ?? '',
    phone: user.phone ?? '',
    created_at: user.created_at ?? '',
    updated_at: user.updated_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
    email_confirmed_at: user.email_confirmed_at ?? null,
    banned_until: user.banned_until ?? null,
    status: adminUserStatus(user),
    is_admin: adminUserIsAdmin(user),
    providers: adminUserProviders(user),
    mfa_enabled: (user.factors ?? []).some(factor => factor.status === 'verified'),
    profile,
  };
}

const handleAdminUsers: Handler = async ({ payload }) => {
  const url = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const operation = typeof payload.operation === 'string' ? payload.operation : '';
  const id = typeof payload.id === 'string' ? payload.id : '';

  if (!url || !serviceRole) return errorResponse('Missing Supabase admin configuration', 500);

  const readUser = async (userId: string): Promise<AuthUser> => {
    const response = await adminUserAuthFetch(url, `/users/${userId}`, serviceRole);
    if (!response.ok) throw new Error(await adminUserError(response, 'User tidak ditemukan'));
    return await response.json() as AuthUser;
  };

  const readProfiles = async (): Promise<Map<string, AdminUserProfile>> => {
    const response = await adminUserRestFetch(
      url,
      '/user_profiles?select=id,full_name,display_name,phone_number,avatar_url',
      serviceRole,
    );
    if (!response.ok) return new Map();
    const profiles = await response.json() as AdminUserProfile[];
    return new Map((Array.isArray(profiles) ? profiles : []).map(profile => [profile.id, profile]));
  };

  try {
    if (operation === 'stats') {
      const fetched = await fetchAuthUsers(url, serviceRole);
      if (fetched.error && !fetched.partial) return errorResponse(fetched.error, 502);
      const now = new Date();
      const users = fetched.users;
      const verified = users.filter(user => Boolean(user.email_confirmed_at || user.phone_confirmed_at)).length;
      const suspended = users.filter(user => Boolean(user.banned_until && new Date(user.banned_until) > now)).length;
      const anonymous = users.filter(user => {
        const providers = adminUserProviders(user);
        return providers.length === 0 || providers.every(provider => provider === 'anonymous');
      }).length;
      return jsonResponse({
        ok: true,
        data: {
          total: fetched.total,
          active: users.filter(user => adminUserStatus(user) === 'Active').length,
          suspended,
          verified,
          unverified: users.filter(user => !user.email_confirmed_at && !user.phone_confirmed_at).length,
          anonymous,
        },
        ...(fetched.error ? { warning: fetched.error } : {}),
      });
    }

    if (operation === 'list') {
      const page = Math.max(1, Number(payload.page) || 1);
      const limit = Math.min(Math.max(1, Number(payload.limit) || 20), 100);
      const search = typeof payload.search === 'string' ? payload.search.toLowerCase().trim() : '';
      const status = typeof payload.status === 'string' ? payload.status : 'all';
      const emailFilter = typeof payload.emailFilter === 'string' ? payload.emailFilter : 'all';
      const sort = typeof payload.sort === 'string' ? payload.sort : 'created_at';
      const order = payload.order === 'asc' ? 'asc' : 'desc';
      const [fetched, profiles] = await Promise.all([fetchAuthUsers(url, serviceRole), readProfiles()]);
      if (fetched.error && !fetched.partial) return errorResponse(fetched.error, 502);

      let users = fetched.users.filter(user => {
        const profile = profiles.get(user.id);
        const name = (profile?.full_name ?? profile?.display_name ?? '').toLowerCase();
        const matchesSearch = !search
          || name.includes(search)
          || (user.email ?? '').toLowerCase().includes(search)
          || user.id.toLowerCase().includes(search)
          || (user.phone ?? '').includes(search);
        const matchesStatus = status === 'all' || adminUserStatus(user) === status;
        const matchesEmail = emailFilter === 'verified'
          ? Boolean(user.email_confirmed_at || user.phone_confirmed_at)
          : emailFilter === 'unverified'
            ? !user.email_confirmed_at && !user.phone_confirmed_at
            : true;
        return matchesSearch && matchesStatus && matchesEmail;
      });

      users.sort((left, right) => {
        const leftProfile = profiles.get(left.id);
        const rightProfile = profiles.get(right.id);
        const value = (user: AuthUser, profile: AdminUserProfile | undefined): string => {
          if (sort === 'email') return user.email ?? '';
          if (sort === 'last_sign_in_at') return user.last_sign_in_at ?? '';
          if (sort === 'name') return (profile?.full_name ?? profile?.display_name ?? '').toLowerCase();
          return user.created_at ?? '';
        };
        const leftValue = value(left, leftProfile);
        const rightValue = value(right, rightProfile);
        if (leftValue === rightValue) return 0;
        const result = leftValue < rightValue ? -1 : 1;
        return order === 'asc' ? result : -result;
      });

      const total = users.length;
      const start = (page - 1) * limit;
      return jsonResponse({
        ok: true,
        data: {
          users: users.slice(start, start + limit).map(user => adminUserListItem(user, profiles.get(user.id) ?? null)),
          total,
          page,
          limit,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
        ...(fetched.error ? { warning: fetched.error } : {}),
      });
    }

    if (!id) return errorResponse('User ID diperlukan', 400);

    if (operation === 'get') {
      const [user, profilesResponse, membershipsResponse] = await Promise.all([
        readUser(id),
        adminUserRestFetch(url, `/user_profiles?id=eq.${id}&select=*`, serviceRole),
        adminUserRestFetch(
          url,
          `/workspace_members?user_id=eq.${id}&select=id,role,status,joined_at,created_at,workspace_id,workspaces(id,name,type,status,city,province)`,
          serviceRole,
        ),
      ]);
      const profiles = profilesResponse.ok ? await profilesResponse.json() as AdminUserProfile[] : [];
      const memberships = membershipsResponse.ok ? await membershipsResponse.json() : [];
      return jsonResponse({
        ok: true,
        data: {
          ...adminUserListItem(user, Array.isArray(profiles) ? profiles[0] ?? null : null),
          phone_confirmed_at: user.phone_confirmed_at ?? null,
          user_metadata: user.user_metadata ?? {},
          app_metadata: user.app_metadata ?? {},
          providers: (user.identities ?? []).map(identity => ({
            provider: identity.provider,
            created_at: typeof identity.identity_data?.created_at === 'string' ? identity.identity_data.created_at : '',
            last_sign_in_at: null,
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
      const user = await readUser(id);
      const metadata = { ...(user.user_metadata ?? {}) };
      if (typeof payload.full_name === 'string') metadata.full_name = payload.full_name;
      if (typeof payload.is_admin === 'boolean') metadata.is_admin = payload.is_admin;
      const response = await adminUserAuthFetch(url, `/users/${id}`, serviceRole, {
        method: 'PUT',
        body: JSON.stringify({ user_metadata: metadata }),
      });
      if (!response.ok) return errorResponse(await adminUserError(response, 'Gagal memperbarui user'), response.status);
      if (typeof payload.full_name === 'string') {
        await adminUserRestFetch(url, `/user_profiles?id=eq.${id}`, serviceRole, {
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
      const authOperation = authOperations[operation];
      const response = await adminUserAuthFetch(url, authOperation.path, serviceRole, {
        method: authOperation.method,
        ...(authOperation.body ? { body: JSON.stringify(authOperation.body) } : {}),
      });
      if (!response.ok && !(operation === 'sign-out' && response.status === 204) && !(operation === 'delete' && response.status === 404)) {
        return errorResponse(await adminUserError(response, 'Operasi user gagal'), response.status);
      }
      return jsonResponse({ ok: true, data: { ok: true } });
    }

    if (operation === 'reset-password' || operation === 'resend-verification') {
      const user = await readUser(id);
      if (!user.email) return errorResponse('User tidak memiliki email', 400);
      const type = operation === 'reset-password' ? 'recovery' : 'signup';
      const response = await adminUserAuthFetch(url, '/generate_link', serviceRole, {
        method: 'POST',
        body: JSON.stringify({ type, email: user.email }),
      });
      if (!response.ok) return errorResponse(await adminUserError(response, 'Gagal membuat link'), response.status);
      const body = await response.json() as { action_link?: string; properties?: { action_link?: string } };
      return jsonResponse({ ok: true, data: { ok: true, link: body.action_link ?? body.properties?.action_link ?? null } });
    }

    if (operation === 'get-workspaces') {
      const response = await adminUserRestFetch(
        url,
        `/workspace_members?user_id=eq.${id}&select=id,role,status,joined_at,created_at,workspace_id,workspaces(id,name,type,status,city,province)`,
        serviceRole,
      );
      if (!response.ok) return errorResponse(await adminUserError(response, 'Gagal memuat workspace'), response.status);
      return jsonResponse({ ok: true, data: { memberships: await response.json() } });
    }

    if (operation === 'add-workspace') {
      if (typeof payload.workspace_id !== 'string' || typeof payload.role !== 'string') {
        return errorResponse('workspace_id dan role wajib diisi', 400);
      }
      const response = await adminUserRestFetch(url, '/workspace_members', serviceRole, {
        method: 'POST',
        body: JSON.stringify({
          workspace_id: payload.workspace_id,
          user_id: id,
          role: payload.role,
          status: 'Aktif',
          joined_at: new Date().toISOString(),
        }),
      });
      if (!response.ok) return errorResponse(await adminUserError(response, 'Gagal menambah membership'), response.status);
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
      const response = await adminUserRestFetch(
        url,
        `/workspace_members?id=eq.${memberId}&user_id=eq.${id}`,
        serviceRole,
        { method: operation === 'remove-workspace' ? 'DELETE' : 'PATCH', ...(operation === 'update-workspace' ? { body: JSON.stringify(body) } : {}) },
      );
      if (!response.ok) return errorResponse(await adminUserError(response, 'Operasi membership gagal'), response.status);
      return jsonResponse({ ok: true, data: { ok: true } });
    }

    return errorResponse(`Operasi admin user tidak dikenal: "${operation}"`, 400);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Operasi admin user gagal', 500);
  }
};

const handleAuthUsers: Handler = async () => {
  const url         = Deno.env.get('SUPABASE_URL')               ?? '';
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')  ?? '';

  if (!serviceRole) {
    return jsonResponse({
      ok:    false,
      error: 'Missing SUPABASE_SERVICE_ROLE_KEY',
      users: null,
    });
  }

  try {
    const fetched = await fetchAuthUsers(url, serviceRole);
    if (fetched.error && !fetched.partial) {
      return jsonResponse({
        ok:    false,
        error: fetched.error,
        users: null,
      });
    }

    const userList = fetched.users;

    const now        = new Date();
    const cutoff24h  = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const total          = fetched.total;
    const verified       = userList.filter((u) => Boolean(u.email_confirmed_at)).length;
    const anonymous      = userList.filter((u) => u.is_anonymous === true).length;
    const activeLast24h  = userList.filter((u) => {
      if (!u.last_sign_in_at) return false;
      return new Date(u.last_sign_in_at) >= cutoff24h;
    }).length;

    return jsonResponse({
      ok: true,
      users: {
        total,
        verified,
        anonymous,
        active_last_24h: activeLast24h,
        checked_at:      new Date().toISOString(),
      },
      ...(fetched.error ? { warning: fetched.error } : {}),
    });
  } catch (err) {
    return jsonResponse({
      ok:    false,
      error: err instanceof Error ? err.message : 'Admin API tidak dapat dijangkau',
      users: null,
    });
  }
};

// ─── Action: auth-health ──────────────────────────────────────────────────────
// Comprehensive auth health: user counts (Admin API) + service status checks
// + login stats (Management API logs, graceful degradation if unavailable).
// Caller must be platform_admin.

const handleAuthHealth: Handler = async ({ internalAuthorization }) => {
  const url         = Deno.env.get('SUPABASE_URL')              ?? '';
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const now         = new Date();
  const cutoff24h   = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const authIntegrity = internalAuthorization
    ? await checkAuthIntegrity(serviceRole)
    : warningAuthIntegrity('SYSTEM_ADMIN_TOKEN_MISSING');

  // ── 1. Fetch users via Admin API ─────────────────────────────────────────
  type AuthUserFull = AuthUser & { created_at?: string | null };

  let usersData: {
    total: number; verified: number; unverified: number;
    anonymous: number; active_last_24h: number; new_last_24h: number;
  } | null = null;
  let adminApiStatus: 'operational' | 'degraded' | 'down' = 'down';
  let jwtStatus:      'operational' | 'degraded' | 'down' = 'down';
  let adminApiError:  string | null = null;

  if (!serviceRole) {
    adminApiError = 'Missing SUPABASE_SERVICE_ROLE_KEY';
  } else {
    try {
      const fetched = await fetchAuthUsers(url, serviceRole);
      if (!fetched.error || fetched.partial) {
        const userList = fetched.users as AuthUserFull[];
        const total    = fetched.total;
        const verified    = userList.filter(u => Boolean(u.email_confirmed_at)).length;
        const anonymous   = userList.filter(u => u.is_anonymous === true).length;
        const active24h   = userList.filter(u => {
          if (!u.last_sign_in_at) return false;
          return new Date(u.last_sign_in_at) >= cutoff24h;
        }).length;
        const new24h = userList.filter(u => {
          if (!u.created_at) return false;
          return new Date(u.created_at) >= cutoff24h;
        }).length;
        usersData      = { total, verified, unverified: Math.max(0, total - verified - anonymous), anonymous, active_last_24h: active24h, new_last_24h: new24h };
        adminApiStatus = fetched.error ? 'degraded' : 'operational';
        jwtStatus      = 'operational';
        adminApiError  = fetched.error;
      } else {
        adminApiError  = fetched.error;
        adminApiStatus = 'down';
        jwtStatus      = 'degraded';
      }
    } catch (err) {
      adminApiError  = err instanceof Error ? err.message : 'Admin API tidak dapat dijangkau';
      adminApiStatus = 'down';
      jwtStatus      = 'degraded';
    }
  }

  const authServiceStatus: 'operational' | 'degraded' | 'down' =
    adminApiStatus === 'down'
      ? 'down'
      : adminApiStatus === 'degraded' || authIntegrity.status !== 'operational'
        ? 'degraded'
        : 'operational';
  const sessionStatus:     'operational' | 'degraded' | 'down' = adminApiStatus === 'operational' ? 'operational' : 'degraded';

  // ── 2. Auth config + email service via Management API ───────────────────
  let registrationEnabled:       boolean | null = null;
  let emailVerificationEnabled:  boolean | null = null;
  let sessionTimeoutSec:         number  | null = null;
  let passwordMinLength:         number  | null = null;
  let emailServiceStatus: 'operational' | 'degraded' | 'down' = 'degraded';

  try {
    const cfgRes = await managementApiFetch('/config/auth');
    if (cfgRes.ok) {
      const cfgData              = await cfgRes.json() as Record<string, unknown>;
      registrationEnabled        = !(cfgData.disable_signup as boolean | undefined ?? false);
      emailVerificationEnabled   = !(cfgData.mailer_autoconfirm as boolean | undefined ?? false);
      sessionTimeoutSec          = (cfgData.jwt_exp as number | null | undefined) ?? null;
      passwordMinLength          = (cfgData.password_min_length as number | null | undefined) ?? null;
      emailServiceStatus         = 'operational';
    }
  } catch {
    // Management API unavailable — degrade gracefully, still return user counts
  }

  // ── 3. Login stats via Management API logs (graceful degradation) ────────
  let failedLogins24h:     number | null = null;
  let successfulLogins24h: number | null = null;

  try {
    const logsRes = await managementApiFetch(
      '/analytics/endpoints/logs.all?service=auth&limit=500&iso_timestamp_start=' + cutoff24h.toISOString(),
    );
    if (logsRes.ok) {
      const logsBody = await logsRes.json() as {
        result?: Array<{ path?: string; status_code?: number; timestamp?: string }>;
      };
      const logs      = logsBody.result ?? [];
      const tokenLogs = logs.filter(l => typeof l.path === 'string' && l.path.includes('/token'));
      successfulLogins24h = tokenLogs.filter(l => (l.status_code ?? 0) >= 200 && (l.status_code ?? 0) < 300).length;
      failedLogins24h     = tokenLogs.filter(l => (l.status_code ?? 0) >= 400).length;
    }
  } catch {
    // Analytics logs unavailable — null values displayed as "Tidak Tersedia" in UI
  }

  return jsonResponse({
    ok: true,
    auth_health: {
      users:                      usersData,
      failed_logins_24h:          failedLogins24h,
      successful_logins_24h:      successfulLogins24h,
      registration_enabled:       registrationEnabled,
      email_verification_enabled: emailVerificationEnabled,
      session_timeout_sec:        sessionTimeoutSec,
      password_min_length:        passwordMinLength,
      auth_service_status:        authServiceStatus,
      jwt_status:                 jwtStatus,
      admin_api_status:           adminApiStatus,
      email_service_status:       emailServiceStatus,
      session_service_status:     sessionStatus,
      admin_api_error:            adminApiError,
       auth_integrity:              authIntegrity,
      checked_at:                 now.toISOString(),
    },
  });
};

// ─── Action: auth-config-update ───────────────────────────────────────────────
// PATCH /v1/projects/:ref/config/auth via Management API.
// Maps AuthServiceConfig fields → Supabase auth config field names.
// Requires MANAGEMENT_API_TOKEN in Edge Function secrets. SUPABASE_* names are
// reserved by the Supabase runtime and cannot be added as user secrets.
//
// Field mapping:
//   enableRegistration       → disable_signup          (inverted)
//   enableEmailVerification  → mailer_autoconfirm      (inverted)
//   sessionTimeoutSec        → jwt_exp
//   passwordMinLength        → password_min_length
//   passwordRequire*         → password_required_characters (colon-joined char classes)

const handleAuthConfigUpdate: Handler = async ({ payload }) => {
  const updates: Record<string, unknown> = {};

  // ── Registration ────────────────────────────────────────────────────────────
  if (typeof payload.enableRegistration === 'boolean') {
    updates.disable_signup = !payload.enableRegistration;
  }

  // ── Email Verification ──────────────────────────────────────────────────────
  if (typeof payload.enableEmailVerification === 'boolean') {
    // mailer_autoconfirm = true  → no verification required
    // mailer_autoconfirm = false → verification required (email verification ON)
    updates.mailer_autoconfirm = !payload.enableEmailVerification;
  }

  // ── Session Timeout ─────────────────────────────────────────────────────────
  if (typeof payload.sessionTimeoutSec === 'number' && payload.sessionTimeoutSec >= 300) {
    updates.jwt_exp = payload.sessionTimeoutSec;
  }

  // ── Password Policy ─────────────────────────────────────────────────────────
  if (typeof payload.passwordMinLength === 'number' && payload.passwordMinLength >= 6) {
    updates.password_min_length = payload.passwordMinLength;
  }

  // password_required_characters: colon-separated character groups.
  // Supabase requires at least one char from each group.
  if (
    typeof payload.passwordRequireUppercase === 'boolean' ||
    typeof payload.passwordRequireNumbers   === 'boolean' ||
    typeof payload.passwordRequireSpecial   === 'boolean'
  ) {
    const groups: string[] = [];
    if (payload.passwordRequireUppercase === true)
      groups.push('abcdefghijklmnopqrstuvwxyz:ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (payload.passwordRequireNumbers === true)
      groups.push('0123456789');
    if (payload.passwordRequireSpecial === true)
      groups.push('!@#$%^&*()_+-=[]{}|;:,.<>?');
    updates.password_required_characters = groups.join(':');
  }

  if (Object.keys(updates).length === 0) {
    return jsonResponse({ ok: false, error: 'Tidak ada field yang dapat diupdate' }, 400);
  }

  try {
    const res = await managementApiFetch('/config/auth', 'PATCH', updates);
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>;
      // Return the patched fields back so the UI can confirm what changed
      return jsonResponse({
        ok:      true,
        updated: updates,
        // Reflect back the fields the API confirmed
        confirmed: {
          disable_signup:               data.disable_signup,
          mailer_autoconfirm:           data.mailer_autoconfirm,
          jwt_exp:                      data.jwt_exp,
          password_min_length:          data.password_min_length,
          password_required_characters: data.password_required_characters,
        },
      });
    } else {
      const text = await res.text().catch(() => '');
      return jsonResponse({
        ok:    false,
        error: `Management API HTTP ${res.status}: ${text.slice(0, 300)}`,
      });
    }
  } catch (err) {
    return jsonResponse({
      ok:    false,
      error: err instanceof Error ? err.message : 'Management API tidak dapat dijangkau',
    });
  }
};

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const handlers: Record<string, Handler> = {
  'db-info':              handleDbInfo,
  'auth-config':          handleAuthConfig,
  'auth-config-update':   handleAuthConfigUpdate,
  'functions-list':       handleFunctionsList,
  'secrets-list':         handleSecretsList,
  'auth-users':           handleAuthUsers,
  'auth-integrity':       handleAuthIntegrity,
  'auth-health':          handleAuthHealth,
};

// ─── Entry point ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return corsOk();
  if (req.method !== 'POST')    return errorResponse('Method tidak didukung. Gunakan POST.', 405);

  // ── Parse body first — needed to check action before auth ─────────────────
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return errorResponse('Request body harus berupa JSON');
  }

  const action = String(payload.action ?? '');
  if (!action) return errorResponse('Field "action" diperlukan');

  // ── ping — no auth required; confirms the function is reachable ────────────
  if (action === 'ping') {
    return jsonResponse({ ok: true, timestamp: new Date().toISOString() });
  }

  // auth-health and auth-integrity support two authorization paths:
  // 1. Internal service token (x-platform-health-internal-token) — kept for backward
  //    compatibility. Only entered when the header is actually present.
  // 2. User JWT with system_admin role — direct browser → Edge Function path
  //    (active architecture: Browser → Cloudflare Pages → Supabase Edge Function).
  const internalToken         = Deno.env.get('PLATFORM_HEALTH_INTERNAL_TOKEN') ?? '';
  const suppliedInternalToken = req.headers.get('x-platform-health-internal-token') ?? '';
  const internalAction        = action === 'auth-integrity' || action === 'auth-health';

  if (internalAction && suppliedInternalToken) {
    // Internal token path — validate constant-time.
    if (!internalToken || suppliedInternalToken.length !== internalToken.length) {
      return jsonResponse({
        ok: true,
        ...(action === 'auth-integrity'
          ? { auth_integrity: warningAuthIntegrity('SYSTEM_ADMIN_TOKEN_INVALID') }
          : { auth_health: { auth_integrity: warningAuthIntegrity('SYSTEM_ADMIN_TOKEN_INVALID') } }),
      });
    }
    let mismatch = 0;
    for (let index = 0; index < internalToken.length; index += 1) {
      mismatch |= suppliedInternalToken.charCodeAt(index) ^ internalToken.charCodeAt(index);
    }
    if (mismatch !== 0) {
      return jsonResponse({
        ok: true,
        ...(action === 'auth-integrity'
          ? { auth_integrity: warningAuthIntegrity('SYSTEM_ADMIN_TOKEN_INVALID') }
          : { auth_health: { auth_integrity: warningAuthIntegrity('SYSTEM_ADMIN_TOKEN_INVALID') } }),
      });
    }
    const handler = handlers[action];
    if (!handler) return errorResponse(`Action tidak dikenal: "${action}"`);
    try {
      return await handler({ payload, userId: 'internal-service', jwt: '', internalAuthorization: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan server';
      return errorResponse(message, 500);
    }
  }

  // ── JWT auth — required for all actions, including auth-health / auth-integrity
  //    when called directly from the browser (no internal token supplied). ─────
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt        = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!jwt) return errorResponse('Authorization header diperlukan', 401);

  const anonClient = makeAnonClient(jwt);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(jwt);
  if (authError || !user) return errorResponse('Token tidak valid atau sudah kedaluwarsa', 401);

  const userMetadata = user?.user_metadata ?? {};
  const appMetadata = user?.app_metadata ?? {};
  const isAdmin =
    userMetadata.is_admin === true
    || userMetadata.role === 'admin'
    || userMetadata.role === 'system_admin'
    || appMetadata.role === 'admin'
    || appMetadata.role === 'system_admin';
  if (!isAdmin) return errorResponse('Akses ditolak: system admin only', 403);

  const handler = handlers[action];
  if (!handler) {
    return errorResponse(
      `Action tidak dikenal: "${action}". Action yang tersedia: ${Object.keys(handlers).join(', ')}`,
    );
  }

  // ── Dispatch ───────────────────────────────────────────────────────────────
  try {
    // Pass internalAuthorization: true for system_admin — enables checkAuthIntegrity
    // and other privileged sub-checks inside handlers like handleAuthHealth.
    return await handler({ payload, userId: user.id, jwt, internalAuthorization: isAdmin });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server';
    return errorResponse(message, 500);
  }
});
