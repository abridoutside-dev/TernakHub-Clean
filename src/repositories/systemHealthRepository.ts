// ─── System Services Health Repository — CORE-PLATFORM-001 ───────────────────
//
// Real-time probes for platform services.  No stored metrics table is needed —
// each check hits the actual service and returns a live result.
//
// Services checked:
//   1. Database     — Supabase PostgreSQL reachability
//   2. Storage      — Cloudflare R2 via /api/upload/health
//   3. API          — Express API server via /api/ping
//   4. Environment  — Required env vars present and non-placeholder
//   5. Platform     — App version from build-time injection
//
// Status values:
//   operational    — Service responded normally
//   degraded       — Service responded but reported an issue
//   down           — Service failed / timed out
//   not_implemented — Cannot check; platform dependency not available
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ServiceStatus =
  | 'operational'
  | 'degraded'
  | 'down'
  | 'not_implemented';

export interface ServiceCheck {
  name: string;
  status: ServiceStatus;
  latency_ms: number | null;
  message: string;
  checked_at: string;
}

export interface SystemServicesHealth {
  database:         ServiceCheck;
  storage:          ServiceCheck;
  api:              ServiceCheck;
  environment:      ServiceCheck;
  platform_version: ServiceCheck;
  message_queue:    ServiceCheck;
  ai_service:       ServiceCheck;
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

// ─── Check 1: Database (Supabase PostgreSQL) ──────────────────────────────────

type SupabaseHeadResult = { data: null; error: { message: string } | null };

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
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
        name: 'Database',
        status: 'degraded',
        latency_ms,
        message: `Supabase error: ${result.error.message}`,
        checked_at: new Date().toISOString(),
      };
    }

    return {
      name: 'Database',
      status: 'operational',
      latency_ms,
      message: `Supabase PostgreSQL — ${latency_ms}ms`,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'Database',
      status: 'down',
      latency_ms: Date.now() - start,
      message: err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'message' in err ? String((err as Record<string,unknown>)['message']) : 'Database check failed'),
      checked_at: new Date().toISOString(),
    };
  }
}

// ─── Check 2: Storage (Cloudflare R2 via API server) ─────────────────────────

async function checkStorage(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const res = await withTimeout(fetch('/api/upload/health'), 6000);
    const latency_ms = Date.now() - start;

    let body: { status?: string; message?: string; bucket?: string } = {};
    try {
      body = (await res.json()) as typeof body;
    } catch {
      // non-JSON response
    }

    if (res.ok && body.status === 'ok') {
      return {
        name: 'Storage',
        status: 'operational',
        latency_ms,
        message: `R2 bucket "${body.bucket ?? 'ternakhub-images'}" — ${latency_ms}ms`,
        checked_at: new Date().toISOString(),
      };
    }

    // API server reachable but R2 credentials not set → not_implemented
    const msg = body.message ?? '';
    const isMissingCredentials =
      msg.includes('Missing') ||
      msg.includes('not configured') ||
      msg.includes('CLOUDFLARE') ||
      msg.includes('401') ||
      msg.includes('403');

    if (isMissingCredentials) {
      return {
        name: 'Storage',
        status: 'not_implemented',
        latency_ms,
        message: 'Cloudflare R2 credentials belum dikonfigurasi',
        checked_at: new Date().toISOString(),
      };
    }

    return {
      name: 'Storage',
      status: 'degraded',
      latency_ms,
      message: msg || `HTTP ${res.status}`,
      checked_at: new Date().toISOString(),
    };
  } catch {
    // API server not running → cannot check storage
    return {
      name: 'Storage',
      status: 'not_implemented',
      latency_ms: Date.now() - start,
      message: 'API server tidak dapat dijangkau — storage check tidak tersedia',
      checked_at: new Date().toISOString(),
    };
  }
}

// ─── Check 3: API Server (Express /api/ping) ──────────────────────────────────

async function checkAPI(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const res = await withTimeout(fetch('/api/ping'), 6000);
    const latency_ms = Date.now() - start;

    let body: { ok?: boolean; service?: string } = {};
    try {
      body = (await res.json()) as typeof body;
    } catch {
      // non-JSON
    }

    if (res.ok && body.ok) {
      return {
        name: 'API',
        status: 'operational',
        latency_ms,
        message: `${body.service ?? 'API server'} — ${latency_ms}ms`,
        checked_at: new Date().toISOString(),
      };
    }

    return {
      name: 'API',
      status: 'degraded',
      latency_ms,
      message: `HTTP ${res.status} — server merespons tapi tidak healthy`,
      checked_at: new Date().toISOString(),
    };
  } catch {
    return {
      name: 'API',
      status: 'not_implemented',
      latency_ms: Date.now() - start,
      message: 'API server tidak dapat dijangkau',
      checked_at: new Date().toISOString(),
    };
  }
}

// ─── Check 4: Environment Variables ──────────────────────────────────────────

function checkEnvironment(): ServiceCheck {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  const missingUrl  = !supabaseUrl  || supabaseUrl.includes('placeholder');
  const missingKey  = !supabaseKey  || supabaseKey === 'placeholder-anon-key';

  const missing: string[] = [];
  if (missingUrl) missing.push('VITE_SUPABASE_URL');
  if (missingKey) missing.push('VITE_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    return {
      name: 'Environment',
      status: 'degraded',
      latency_ms: null,
      message: `Env var belum dikonfigurasi: ${missing.join(', ')}`,
      checked_at: new Date().toISOString(),
    };
  }

  return {
    name: 'Environment',
    status: 'operational',
    latency_ms: null,
    message: 'Semua environment variable terkonfigurasi',
    checked_at: new Date().toISOString(),
  };
}

// ─── Check 5: Platform Version ────────────────────────────────────────────────

function checkPlatformVersion(): ServiceCheck {
  // VITE_APP_VERSION is injected at build time via vite.config.ts define block.
  const version = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.1.0';

  return {
    name: 'Platform',
    status: 'operational',
    latency_ms: null,
    message: `TernakHub v${version}`,
    checked_at: new Date().toISOString(),
  };
}

// ─── Check 6: Message Queue (not_implemented — queue worker not built) ────────

function checkMessageQueue(): ServiceCheck {
  return {
    name:       'Message Queue',
    status:     'not_implemented',
    latency_ms: null,
    message:    'Queue worker belum diimplementasikan di platform',
    checked_at: new Date().toISOString(),
  };
}

// ─── Check 7: AI Service (not_implemented — AI backend not integrated) ────────

function checkAIService(): ServiceCheck {
  return {
    name:       'AI Service',
    status:     'not_implemented',
    latency_ms: null,
    message:    'AI backend belum diintegrasikan ke platform',
    checked_at: new Date().toISOString(),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchSystemServicesHealth(): Promise<SystemServicesHealth> {
  const [database, storage, api] = await Promise.all([
    checkDatabase(),
    checkStorage(),
    checkAPI(),
  ]);
  const environment      = checkEnvironment();
  const platform_version = checkPlatformVersion();
  const message_queue    = checkMessageQueue();
  const ai_service       = checkAIService();

  return { database, storage, api, environment, platform_version, message_queue, ai_service };
}
