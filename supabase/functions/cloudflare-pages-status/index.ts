// ─── cloudflare-pages-status Edge Function — PH-CF-001 ────────────────────────
//
// Server-side proxy untuk Cloudflare Pages API.
// Token tidak pernah menyentuh browser — semua credential ada di Deno.env.
//
// Required Supabase Edge Function Secrets (supabase secrets set ...):
//   CF_API_TOKEN          — Cloudflare API Token (Pages:Read permission)
//   CF_ACCOUNT_ID         — Cloudflare Account ID
//   CF_PAGES_PROJECT_NAME — Nama project Cloudflare Pages
//
// Caller harus authenticated (platform admin).
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function isPlatformAdmin(jwt: string): Promise<boolean> {
  const url = Deno.env.get('SUPABASE_URL')      ?? '';
  const key = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth:   { persistSession: false },
  });
  const { data: { user } } = await client.auth.getUser(jwt);
  return user?.user_metadata?.role === 'platform_admin';
}

// ─── Cloudflare API types ─────────────────────────────────────────────────────

interface CfStage     { name: string; status: string; }
interface CfMeta      { commit_hash: string; commit_message: string; }
interface CfTrigger   { metadata: CfMeta; }
interface CfDeployment {
  id:                  string;
  url:                 string;
  created_on:          string;
  latest_stage:        CfStage;
  deployment_trigger:  CfTrigger;
  build_time_ms:       number | null;
}
interface CfBuildConfig {
  build_command:   string;
  destination_dir: string;
  framework:       string;
}
interface CfProject {
  name:                  string;
  subdomain:             string;
  production_branch:     string;
  build_config:          CfBuildConfig;
  canonical_deployment:  CfDeployment;
}
interface CfApiResponse<T> {
  result:  T;
  success: boolean;
  errors:  { message: string }[];
}

// ─── Status determination ─────────────────────────────────────────────────────

function resolveStatus(deployStatus: string): 'operational' | 'degraded' | 'down' {
  if (deployStatus === 'success')                         return 'operational';
  if (deployStatus === 'failure' || deployStatus === 'failed') return 'down';
  if (deployStatus)                                       return 'degraded';
  return 'operational';
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return corsOk();

  // ── 1. Read secrets FIRST — before any auth check ────────────────────────────
  const apiToken    = Deno.env.get('CF_API_TOKEN')          ?? '';
  const accountId   = Deno.env.get('CF_ACCOUNT_ID')         ?? '';
  const projectName = Deno.env.get('CF_PAGES_PROJECT_NAME') ?? '';
  const missingSecrets: string[] = [];
  if (!apiToken)    missingSecrets.push('CF_API_TOKEN');
  if (!accountId)   missingSecrets.push('CF_ACCOUNT_ID');
  if (!projectName) missingSecrets.push('CF_PAGES_PROJECT_NAME');

  // ── 2. Auth ───────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt        = authHeader.replace(/^Bearer\s+/i, '');
  const hasJwt     = jwt.length > 0;

  function respond(body: Record<string, unknown>, httpStatus = 200): Response {
    const payload = {
      ...body,
      _debug: {
        hasJwt,
        missingSecrets,
        // userId / isPlatformAdmin filled in below when available
      },
    };
    console.log('[cloudflare-pages-status] RETURN:', JSON.stringify(payload));
    return jsonResponse(payload, httpStatus);
  }

  // Auth failures return HTTP 200 so supabase.functions.invoke can read the JSON
  // body (non-2xx responses are converted to opaque FunctionsHttpError).
  if (!hasJwt) {
    return respond({ ok: false, status: 'down', message: 'Authorization header diperlukan', project: null });
  }

  // Resolve admin status — capture full auth response for debug
  let userId: string | null = null;
  let isAdmin = false;
  let authDebug: Record<string, unknown> = {};
  try {
    const sbUrl = Deno.env.get('SUPABASE_URL')      ?? '';
    const sbKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    // Do NOT set global.headers.Authorization here — auth.getUser(jwt) sets it
    // internally via GoTrueClient. Overriding it in global.headers causes a
    // header conflict that makes auth.getUser return user=null.
    const client = createClient(sbUrl, sbKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await client.auth.getUser(jwt);
    authDebug = {
      hasJwt,
      authError:  error?.message  ?? null,
      authStatus: (error as { status?: number } | null)?.status ?? null,
      authCode:   (error as { code?: string }   | null)?.code   ?? null,
      user:       data?.user ?? null,
    };
    userId  = data?.user?.id ?? null;
    isAdmin = data?.user?.user_metadata?.role === 'platform_admin';
  } catch (e) {
    authDebug = {
      hasJwt,
      authError:  e instanceof Error ? e.message : String(e),
      authStatus: null,
      authCode:   null,
      user:       null,
    };
  }

  // Patch _debug with full auth result
  function respondWithAuth(body: Record<string, unknown>, httpStatus = 200): Response {
    const payload = {
      ...body,
      _debug: { ...authDebug, missingSecrets, isPlatformAdmin: isAdmin },
    };
    console.log('[cloudflare-pages-status] RETURN:', JSON.stringify(payload));
    return jsonResponse(payload, httpStatus);
  }

  if (!isAdmin) {
    return respondWithAuth({ ok: false, status: 'down', message: 'Akses ditolak: platform admin only', project: null });
  }

  // ── 3. Missing secrets check ──────────────────────────────────────────────────
  if (missingSecrets.length > 0) {
    return respondWithAuth({
      ok:      false,
      status:  'not_configured',
      message: `Supabase secret belum dikonfigurasi: ${missingSecrets.join(', ')}`,
      project: null,
    });
  }

  // ── 4. Call Cloudflare Pages API ──────────────────────────────────────────────
  const base    = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`;
  const cfHeaders = {
    Authorization:  `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };

  try {
    const [projectRes, deploymentsRes] = await Promise.all([
      fetch(base, { headers: cfHeaders }),
      fetch(`${base}/deployments?per_page=1&sort_by=created_on&sort_order=desc`, { headers: cfHeaders }),
    ]);

    if (!projectRes.ok) {
      const text = await projectRes.text().catch(() => '');
      return respondWithAuth({
        ok:      false,
        status:  'down',
        message: `Cloudflare Pages API error ${projectRes.status}: ${text.slice(0, 200)}`,
        project: null,
      });
    }

    const projData  = await projectRes.json() as CfApiResponse<CfProject>;
    const deplData  = deploymentsRes.ok
      ? (await deploymentsRes.json() as CfApiResponse<CfDeployment[]>)
      : { result: [] as CfDeployment[], success: false, errors: [] };

    const proj         = projData.result;
    const latestDeploy = (deplData.result?.[0] ?? proj.canonical_deployment) as CfDeployment | undefined;
    const deployStatus = latestDeploy?.latest_stage?.status ?? '';
    const status       = resolveStatus(deployStatus);
    const last_checked = new Date().toISOString();

    return respondWithAuth({
      ok:      true,
      status,
      message: `Project "${proj.name}" · Branch: ${proj.production_branch} · Deploy: ${deployStatus || 'unknown'}`,
      project: {
        project_name:             proj.name,
        production_url:           latestDeploy?.url ?? `https://${proj.subdomain}.pages.dev`,
        latest_deployment_status: deployStatus,
        latest_deployment_time:   latestDeploy?.created_on ?? '',
        production_branch:        proj.production_branch,
        commit_sha:               latestDeploy?.deployment_trigger?.metadata?.commit_hash   ?? '',
        commit_message:           latestDeploy?.deployment_trigger?.metadata?.commit_message ?? '',
        framework:                proj.build_config?.framework       ?? '',
        build_command:            proj.build_config?.build_command   ?? '',
        build_output_directory:   proj.build_config?.destination_dir ?? '',
        deployment_id:            latestDeploy?.id ?? '',
        deployment_duration:      latestDeploy?.build_time_ms ?? null,
        pages_dev_url:            `https://${proj.subdomain}.pages.dev`,
        last_checked,
      },
    });
  } catch (err) {
    return respondWithAuth({
      ok:      false,
      status:  'down',
      message: err instanceof Error ? err.message : 'Cloudflare Pages API tidak dapat dijangkau',
      project: null,
    });
  }
});
