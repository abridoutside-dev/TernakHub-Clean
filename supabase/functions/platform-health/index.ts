// ─── platform-health Edge Function ────────────────────────────────────────────
//
// Server-side dispatcher for admin Control Panel data that cannot be fetched
// from the browser (service role queries, Supabase Management API).
//
// Dispatcher pattern — one function, multiple actions (same style as r2-storage).
// Caller must be authenticated as platform_admin.
//
// ─── Required Supabase Edge Function Secrets ─────────────────────────────────
//   SUPABASE_URL             — auto-injected by Supabase runtime
//   SUPABASE_ANON_KEY        — auto-injected by Supabase runtime
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase runtime (service role)
//   SUPABASE_ACCESS_TOKEN    — Supabase personal/service access token
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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

function makeServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')               ?? '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')  ?? '';
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function isPlatformAdmin(jwt: string): Promise<boolean> {
  const client = makeAnonClient(jwt);
  const { data: { user } } = await client.auth.getUser(jwt);
  return user?.user_metadata?.role === 'platform_admin';
}

// ─── Management API helper ────────────────────────────────────────────────────

function projectRef(): string {
  // Supabase project ref is the first subdomain of SUPABASE_URL:
  // https://<ref>.supabase.co
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  return url.match(/https?:\/\/([\w-]+)\./)?.[1] ?? '';
}

async function managementApiFetch(path: string): Promise<Response> {
  const token = Deno.env.get('SUPABASE_ACCESS_TOKEN') ?? '';
  if (!token) {
    throw new Error('SUPABASE_ACCESS_TOKEN belum dikonfigurasi di Edge Function secrets');
  }
  const ref = projectRef();
  if (!ref) throw new Error('Tidak dapat menentukan project ref dari SUPABASE_URL');
  return fetch(`https://api.supabase.com/v1/projects/${ref}${path}`, {
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

// ─── Action context ───────────────────────────────────────────────────────────

interface ActionContext {
  payload: Record<string, unknown>;
  userId:  string;
  jwt:     string;
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
  id:                string;
  email_confirmed_at?: string | null;
  is_anonymous?:       boolean;
  last_sign_in_at?:    string | null;
}

const handleAuthUsers: Handler = async () => {
  const url         = Deno.env.get('SUPABASE_URL')               ?? '';
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')  ?? '';

  if (!serviceRole) {
    return jsonResponse({
      ok:    false,
      error: 'SUPABASE_SERVICE_ROLE_KEY tidak tersedia',
      users: null,
    });
  }

  try {
    const res = await fetch(`${url}/auth/v1/admin/users?per_page=1000`, {
      headers: {
        Authorization:          `Bearer ${serviceRole}`,
        apikey:                 serviceRole,
        'X-Content-Type-Options': 'nosniff',
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return jsonResponse({
        ok:    false,
        error: `Admin API HTTP ${res.status}: ${text.slice(0, 200)}`,
        users: null,
      });
    }

    const totalHeader = res.headers.get('x-total-count');
    const body        = await res.json() as { users?: AuthUser[] } | AuthUser[];
    const userList    = Array.isArray(body)
      ? body as AuthUser[]
      : ((body as { users?: AuthUser[] }).users ?? []) as AuthUser[];

    const now        = new Date();
    const cutoff24h  = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const total          = totalHeader ? parseInt(totalHeader, 10) : userList.length;
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
    });
  } catch (err) {
    return jsonResponse({
      ok:    false,
      error: err instanceof Error ? err.message : 'Admin API tidak dapat dijangkau',
      users: null,
    });
  }
};

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const handlers: Record<string, Handler> = {
  'db-info':        handleDbInfo,
  'auth-config':    handleAuthConfig,
  'functions-list': handleFunctionsList,
  'secrets-list':   handleSecretsList,
  'auth-users':     handleAuthUsers,
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

  // ── Auth (required for all other actions) ──────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt        = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!jwt) return errorResponse('Authorization header diperlukan', 401);

  const anonClient = makeAnonClient(jwt);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(jwt);
  if (authError || !user) return errorResponse('Token tidak valid atau sudah kedaluwarsa', 401);

  const isAdmin = user?.user_metadata?.role === 'platform_admin';
  if (!isAdmin) return errorResponse('Akses ditolak: platform admin only', 403);

  const handler = handlers[action];
  if (!handler) {
    return errorResponse(
      `Action tidak dikenal: "${action}". Action yang tersedia: ${Object.keys(handlers).join(', ')}`,
    );
  }

  // ── Dispatch ───────────────────────────────────────────────────────────────
  try {
    return await handler({ payload, userId: user.id, jwt });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server';
    console.error(`[platform-health] action=${action} error:`, err);
    return errorResponse(message, 500);
  }
});
