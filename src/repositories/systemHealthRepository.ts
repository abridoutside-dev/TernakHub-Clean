// ─── System Services Health Repository — PH-001 ────────────────────────────────
//
// Real-time probes for production platform services.
//
// Production stack (Cloudflare Pages architecture):
//   Cloudflare Pages    → React SPA static hosting
//   Supabase PostgreSQL → database
//   Supabase Auth       → authentication
//   Supabase Edge Fns   → backend logic (platform-health dispatcher)
//   Cloudflare R2       → image object storage
//
// Services checked:
//   1. Cloudflare Pages    — real probe: invoke cloudflare-pages-status Edge Function
//   2. Supabase Database   — real probe: HEAD query on workspaces table
//   3. Supabase Auth       — real probe: supabase.auth.getSession()
//   4. Edge Functions      — real probe: invoke platform-health (ping, no auth required)
//   5. Cloudflare R2       — real probe: invoke r2-storage (test-connection)
//   6. Environment         — sync check: VITE_ vars present and non-placeholder
//
// Status values:
//   operational     — Service responded normally
//   degraded        — Service responded but reported an issue
//   down            — Service failed / timed out
//   not_implemented — Cannot probe from browser (no credentials exposed)
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ServiceStatus =
  | 'operational'
  | 'degraded'
  | 'down'
  | 'not_configured'
  | 'not_implemented';

export interface ServiceCheck {
  name: string;
  status: ServiceStatus;
  latency_ms: number | null;
  message: string;
  checked_at: string;
}

export interface SystemServicesHealth {
  cloudflare_pages: ServiceCheck;
  database:         ServiceCheck;
  supabase_auth:    ServiceCheck;
  edge_functions:   ServiceCheck;
  cloudflare_r2:    ServiceCheck;
  environment:      ServiceCheck;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ]);
}

// ─── Cloudflare Pages status data ────────────────────────────────────────────
// Shape returned by the cloudflare-pages-status Supabase Edge Function.
// Field names follow the spec from PH-CF-001.

export interface CfPagesProject {
  project_name:             string;
  production_url:           string;
  latest_deployment_status: string;
  latest_deployment_time:   string;
  production_branch:        string;
  commit_sha:               string;
  commit_message:           string;
  framework:                string;
  build_command:            string;
  build_output_directory:   string;
  deployment_id:            string;
  deployment_duration:      number | null;
  pages_dev_url:            string;
  last_checked:             string;
}

export interface CfPagesStatusData {
  ok:      boolean;
  status:  ServiceStatus;
  message: string;
  project: CfPagesProject | null;
}

// ─── Check 1: Cloudflare Pages ────────────────────────────────────────────────
// Calls the cloudflare-pages-status Supabase Edge Function.
// CF_API_TOKEN, CF_ACCOUNT_ID, CF_PAGES_PROJECT_NAME are Supabase secrets —
// they never touch the browser.

async function checkCloudflarePages(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke<CfPagesStatusData>('cloudflare-pages-status'),
      10000,
    );
    const latency_ms = Date.now() - start;

    // DEBUG — log raw edge function response to browser console
    console.log('[CF-Pages debug] raw response from edge function:', JSON.stringify({ data, error: error?.message ?? null }));

    if (error) {
      return {
        name:       'Cloudflare Pages',
        status:     'down',
        latency_ms,
        message:    `Edge Function error: ${error.message}`,
        checked_at: new Date().toISOString(),
      };
    }

    const validStatuses: ServiceStatus[] = ['operational', 'degraded', 'down', 'not_configured', 'not_implemented'];
    const status = data && validStatuses.includes(data.status) ? data.status : 'not_implemented';

    return {
      name:       'Cloudflare Pages',
      status,
      latency_ms,
      message:    data?.message ?? '',
      checked_at: data?.project?.last_checked ?? new Date().toISOString(),
    };
  } catch (err) {
    return {
      name:       'Cloudflare Pages',
      status:     'down',
      latency_ms: Date.now() - start,
      message:    err instanceof Error ? err.message : 'cloudflare-pages-status tidak dapat dijangkau',
      checked_at: new Date().toISOString(),
    };
  }
}

// ─── Check 2: Supabase Database ───────────────────────────────────────────────

type SupabaseHeadResult = { data: null; error: { message: string } | null };

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();

  // Derive region from URL: https://<project-id>.<region>.supabase.co
  // Standard hosted projects have no region sub-domain — falls back to 'supabase.co'.
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
  const regionMatch = supabaseUrl.match(/https?:\/\/[\w-]+\.([\w-]+)\.supabase\.co/);
  const region      = regionMatch?.[1] ?? 'supabase.co';

  try {
    const result = await withTimeout(
      Promise.resolve(
        supabase.from('workspaces').select('id', { count: 'exact', head: true }),
      ) as Promise<SupabaseHeadResult>,
      6000,
    );
    const latency_ms = Date.now() - start;

    if (result.error) {
      return {
        name:       'Supabase Database',
        status:     'degraded',
        latency_ms,
        message:    `Supabase error: ${result.error.message}`,
        checked_at: new Date().toISOString(),
      };
    }

    return {
      name:       'Supabase Database',
      status:     'operational',
      latency_ms,
      message:    `PostgreSQL · Region: ${region} · ${latency_ms}ms`,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name:       'Supabase Database',
      status:     'down',
      latency_ms: Date.now() - start,
      message:    err instanceof Error ? err.message : 'Database check failed',
      checked_at: new Date().toISOString(),
    };
  }
}

// ─── Check 3: Supabase Auth ───────────────────────────────────────────────────
// Probes auth service reachability via getSession().  Does not require the user
// to be signed in — a null session with no error still confirms auth is online.

async function checkSupabaseAuth(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const { error } = await withTimeout(
      supabase.auth.getSession(),
      6000,
    );
    const latency_ms = Date.now() - start;

    if (error) {
      return {
        name:       'Supabase Auth',
        status:     'degraded',
        latency_ms,
        message:    `Auth error: ${error.message}`,
        checked_at: new Date().toISOString(),
      };
    }

    return {
      name:       'Supabase Auth',
      status:     'operational',
      latency_ms,
      message:    `Auth service online · Provider: Email/OAuth · ${latency_ms}ms`,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name:       'Supabase Auth',
      status:     'down',
      latency_ms: Date.now() - start,
      message:    err instanceof Error ? err.message : 'Auth check failed',
      checked_at: new Date().toISOString(),
    };
  }
}

// ─── Check 4: Supabase Edge Functions ────────────────────────────────────────
// Uses the ping action on platform-health — no auth required, no secrets
// needed.  If the function responds at all, the Edge Functions runtime is
// operational.

async function checkEdgeFunctions(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const { error } = await withTimeout(
      supabase.functions.invoke('platform-health', { body: { action: 'ping' } }),
      8000,
    );
    const latency_ms = Date.now() - start;

    if (error) {
      return {
        name:       'Supabase Edge Functions',
        status:     'down',
        latency_ms,
        message:    `Edge Functions tidak dapat dijangkau: ${error.message}`,
        checked_at: new Date().toISOString(),
      };
    }

    return {
      name:       'Supabase Edge Functions',
      status:     'operational',
      latency_ms,
      message:    `Edge Functions online · platform-health aktif · ${latency_ms}ms`,
      checked_at: new Date().toISOString(),
    };
  } catch {
    return {
      name:       'Supabase Edge Functions',
      status:     'not_implemented',
      latency_ms: Date.now() - start,
      message:    'Edge Functions tidak dapat dijangkau',
      checked_at: new Date().toISOString(),
    };
  }
}

// ─── Check 5: Cloudflare R2 ───────────────────────────────────────────────────
// Invokes the health action on r2-storage: HEAD bucket → upload → HEAD object
// → delete → latency.  Maps the edge function's status directly to ServiceStatus.

interface R2HealthResponse {
  ok:          boolean;
  status:      string;
  bucket:      string;
  endpoint:    string;
  publicUrl:   string;
  writable:    boolean;
  readable:    boolean;
  latency:     number | null;
  lastChecked: string;
  r2Error?:    string;
  httpStatus?: number | null;
}

async function checkCloudflareR2(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke<R2HealthResponse>('r2-storage', { body: { action: 'health' } }),
      10000,
    );
    const latency_ms = Date.now() - start;

    if (error) {
      return {
        name:       'Cloudflare R2',
        status:     'down',
        latency_ms,
        message:    `Edge Function error: ${error.message}`,
        checked_at: new Date().toISOString(),
      };
    }

    if (!data) {
      return {
        name:       'Cloudflare R2',
        status:     'down',
        latency_ms,
        message:    'Tidak ada respons dari r2-storage',
        checked_at: new Date().toISOString(),
      };
    }

    const validStatuses: ServiceStatus[] = ['operational', 'degraded', 'down', 'not_configured'];
    const status: ServiceStatus = validStatuses.includes(data.status as ServiceStatus)
      ? (data.status as ServiceStatus)
      : 'down';

    if (status === 'not_configured') {
      return {
        name:       'Cloudflare R2',
        status:     'not_configured',
        latency_ms,
        message:    'Cloudflare R2 secrets belum dikonfigurasi di Edge Function',
        checked_at: data.lastChecked ?? new Date().toISOString(),
      };
    }

    if (status === 'operational') {
      return {
        name:       'Cloudflare R2',
        status:     'operational',
        latency_ms: data.latency ?? latency_ms,
        message:    `Bucket "${data.bucket}" · writable · readable · ${data.latency ?? latency_ms}ms`,
        checked_at: data.lastChecked ?? new Date().toISOString(),
      };
    }

    const r2Err = data.r2Error;
    return {
      name:       'Cloudflare R2',
      status,
      latency_ms,
      message:    r2Err
        ? `R2 ${status} · ${r2Err} · bucket: ${data.bucket}`
        : `R2 ${status} · bucket: ${data.bucket}`,
      checked_at: data.lastChecked ?? new Date().toISOString(),
    };
  } catch (err) {
    return {
      name:       'Cloudflare R2',
      status:     'down',
      latency_ms: Date.now() - start,
      message:    err instanceof Error ? err.message : 'R2 health check gagal',
      checked_at: new Date().toISOString(),
    };
  }
}

// ─── Check 6: Environment Variables ──────────────────────────────────────────
// Verifies the two VITE_ variables required at build time are present and
// non-placeholder.  Runs synchronously — no network call.

function checkEnvironment(): ServiceCheck {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  const missingUrl = !supabaseUrl  || supabaseUrl.includes('placeholder');
  const missingKey = !supabaseKey  || supabaseKey === 'placeholder-anon-key';

  const missing: string[] = [];
  if (missingUrl) missing.push('VITE_SUPABASE_URL');
  if (missingKey) missing.push('VITE_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    return {
      name:       'Environment',
      status:     'degraded',
      latency_ms: null,
      message:    `Env var belum dikonfigurasi: ${missing.join(', ')}`,
      checked_at: new Date().toISOString(),
    };
  }

  return {
    name:       'Environment',
    status:     'operational',
    latency_ms: null,
    message:    'Semua environment variable terkonfigurasi',
    checked_at: new Date().toISOString(),
  };
}

// ─── Auth Health ──────────────────────────────────────────────────────────────
// Calls the platform-health Edge Function with action: 'auth-health'.
// Returns real user counts + service status from the Admin API.

export type AuthSubStatus = 'operational' | 'degraded' | 'down';

export interface AuthHealthUsers {
  total:           number;
  verified:        number;
  unverified:      number;
  anonymous:       number;
  active_last_24h: number;
  new_last_24h:    number;
}

export type AuthIntegrityStatus = 'operational' | 'degraded' | 'down';

export interface AuthIntegrityIssue {
  id:          string;
  email:       string | null;
  issue_codes: string[];
}

export interface AuthIntegrityData {
  status:      AuthIntegrityStatus;
  issue_count: number;
  issues:      AuthIntegrityIssue[];
  error:       string | null;
  checked_at:  string;
}

export interface AuthHealthData {
  users:                      AuthHealthUsers | null;
  failed_logins_24h:          number | null;
  successful_logins_24h:      number | null;
  registration_enabled:       boolean | null;
  email_verification_enabled: boolean | null;
  session_timeout_sec:        number  | null;
  password_min_length:        number  | null;
  auth_service_status:        AuthSubStatus;
  jwt_status:                 AuthSubStatus;
  admin_api_status:           AuthSubStatus;
  email_service_status:       AuthSubStatus;
  session_service_status:     AuthSubStatus;
  admin_api_error:            string | null;
  auth_integrity:             AuthIntegrityData;
  checked_at:                 string;
}

interface AuthHealthResponse {
  ok:           boolean;
  auth_health?: AuthHealthData;
  error?:       string;
}

export async function fetchAuthHealth(): Promise<AuthHealthData> {
  const { data, error } = await withTimeout(
    supabase.functions.invoke<AuthHealthResponse>('platform-health', {
      body: { action: 'auth-health' },
    }),
    15000,
  );

  if (error) throw error;
  if (!data?.ok || !data.auth_health) {
    throw new Error((data as unknown as { error?: string })?.error ?? 'auth-health tidak mengembalikan data');
  }
  if (!data.auth_health.auth_integrity) {
    return {
      ...data.auth_health,
      auth_service_status: data.auth_health.auth_service_status === 'operational'
        ? 'degraded'
        : data.auth_health.auth_service_status,
      auth_integrity: {
        status: 'down',
        issue_count: 0,
        issues: [],
        error: 'Auth integrity check belum tersedia pada Edge Function yang aktif',
        checked_at: new Date().toISOString(),
      },
    };
  }
  return data.auth_health;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchSystemServicesHealth(): Promise<SystemServicesHealth> {
  // All async probes run in parallel; synchronous environment check runs inline.
  const environment = checkEnvironment();

  const [cloudflare_pages, database, supabase_auth, edge_functions, cloudflare_r2] = await Promise.all([
    checkCloudflarePages(),
    checkDatabase(),
    checkSupabaseAuth(),
    checkEdgeFunctions(),
    checkCloudflareR2(),
  ]);

  return { cloudflare_pages, database, supabase_auth, edge_functions, cloudflare_r2, environment };
}
