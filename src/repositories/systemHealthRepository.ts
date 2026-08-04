// ─── System Services Health Repository — CORE-PLATFORM-001 ───────────────────
//
// Real-time probes for platform services.  No stored metrics table is needed —
// each check hits the actual service and returns a live result.
//
// Services checked:
//   1. Database     — Supabase PostgreSQL reachability
//   2. Storage      — Cloudflare R2 via r2-storage Edge Function (test-connection)
//   3. API          — Express API server (legacy; no longer probed from frontend)
//   4. Environment  — Required env vars present and non-placeholder
//   5. Platform     — App version from build-time injection
//
// Status values:
//   operational    — Service responded normally
//   degraded       — Service responded but reported an issue
//   down           — Service failed / timed out
//   not_implemented — Cannot check; platform dependency not available
//
// FOUNDATION-STORAGE-004B:
//   Express (/api/ping, /api/upload/health) has been removed as a frontend
//   dependency.  The Storage check uses the r2-storage Edge Function.
//   The API check is marked not_implemented — Express is legacy-only.
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

// ─── Check 2: Storage (Cloudflare R2 via r2-storage Edge Function) ───────────
// Uses action=test-connection — no Express dependency.

async function checkStorage(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke<{
        ok:       boolean;
        status?:  string;
        bucket?:  string;
        message?: string;
        missing?: string[];
        error?:   string;
      }>('r2-storage', { body: { action: 'test-connection' } }),
      8000,
    );
    const latency_ms = Date.now() - start;

    if (error) {
      return {
        name:       'Storage',
        status:     'not_implemented',
        latency_ms,
        message:    `Edge Function tidak dapat dijangkau: ${error.message}`,
        checked_at: new Date().toISOString(),
      };
    }

    if (data?.ok) {
      return {
        name:       'Storage',
        status:     'operational',
        latency_ms,
        message:    `R2 bucket "${data.bucket ?? 'ternakhub-images'}" — ${latency_ms}ms`,
        checked_at: new Date().toISOString(),
      };
    }

    // Missing credentials → not_implemented
    const isMissingCredentials =
      data?.status === 'misconfigured' ||
      (data?.missing?.length ?? 0) > 0;

    if (isMissingCredentials) {
      return {
        name:       'Storage',
        status:     'not_implemented',
        latency_ms,
        message:    'Cloudflare R2 credentials belum dikonfigurasi di Edge Function secrets',
        checked_at: new Date().toISOString(),
      };
    }

    return {
      name:       'Storage',
      status:     'degraded',
      latency_ms,
      message:    data?.error ?? data?.message ?? 'R2 tidak terhubung',
      checked_at: new Date().toISOString(),
    };
  } catch {
    return {
      name:       'Storage',
      status:     'not_implemented',
      latency_ms: Date.now() - start,
      message:    'Storage check tidak tersedia — Edge Function tidak dapat dijangkau',
      checked_at: new Date().toISOString(),
    };
  }
}

// ─── Check 3: API Server (Legacy Express — no longer probed) ─────────────────
// FOUNDATION-STORAGE-004B: Express is legacy-only. The frontend no longer
// calls /api/ping or any Express endpoint for storage or health checks.
// All storage operations run through the r2-storage Edge Function.

function checkAPI(): ServiceCheck {
  return {
    name:       'API',
    status:     'not_implemented',
    latency_ms: null,
    message:    'Express API server adalah legacy — tidak lagi diakses dari frontend',
    checked_at: new Date().toISOString(),
  };
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
