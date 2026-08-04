// ─── TernakHub API Server — FOUNDATION-ARCHITECTURE-002 ──────────────────────
//
// Production web server + minimal API.
//
// Storage layer retirement (FOUNDATION-ARCHITECTURE-002):
//   All storage operations now run exclusively via the browser pipeline:
//   Browser → Canvas Image Pipeline → Supabase Edge Function (r2-storage) → Cloudflare R2
//   The Express upload route and admin storage config route have been retired.
//
// What this server still does:
//   • Serves the Vite-built React SPA in production (static + SPA catch-all)
//   • GET /api/ping — health check
//
// Port: 5001 in development (Vite dev server proxies /api/* here)
//       $PORT or 5000 in production (sole entry point serving the SPA + API)
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app    = express();
const PORT   = parseInt(process.env.API_PORT ?? '5001', 10);
const isProd = process.env.NODE_ENV === 'production';

// ─── Middleware ───────────────────────────────────────────────────────────────

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow same-origin proxy (Vite dev), *.replit.dev previews, and *.replit.app
// production deployments. Origin-less requests (curl, server-to-server) pass
// through because they arrive without an Origin header.
const ALLOWED_ORIGIN_RE =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$|\.replit\.(dev|app)$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGIN_RE.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
}));

app.use(express.json({ limit: '1mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check — used by deployment infra and admin dashboards.
app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, service: 'ternakhub-api', ts: new Date().toISOString() });
});

// ─── Cloudflare Pages Status ──────────────────────────────────────────────────
// Proxies a request to the Cloudflare Pages API so the browser never receives
// the API token.  Reads three env vars:
//   CF_PAGES_ACCOUNT_ID   — Cloudflare account ID (falls back to CLOUDFLARE_R2_ACCOUNT_ID)
//   CF_PAGES_API_TOKEN    — API token with Cloudflare Pages:Read permission
//   CF_PAGES_PROJECT_NAME — exact Pages project name

interface CfStage     { name: string; status: string; }
interface CfMeta      { commit_hash: string; commit_message: string; }
interface CfTrigger   { metadata: CfMeta; }
interface CfDeployment {
  id: string; url: string; created_on: string;
  latest_stage: CfStage; deployment_trigger: CfTrigger;
  build_time_ms: number | null;
}
interface CfBuildConfig { build_command: string; destination_dir: string; framework: string; }
interface CfProject {
  name: string; subdomain: string; production_branch: string;
  build_config: CfBuildConfig; canonical_deployment: CfDeployment;
}
interface CfApiResponse<T> { result: T; success: boolean; errors: { message: string }[]; }

app.get('/api/cf-pages/status', async (_req, res) => {
  const accountId   = process.env.CF_PAGES_ACCOUNT_ID   ?? process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? '';
  const apiToken    = process.env.CF_PAGES_API_TOKEN    ?? '';
  const projectName = process.env.CF_PAGES_PROJECT_NAME ?? '';

  if (!accountId || !apiToken || !projectName) {
    const missing: string[] = [];
    if (!accountId)   missing.push('CF_PAGES_ACCOUNT_ID');
    if (!apiToken)    missing.push('CF_PAGES_API_TOKEN');
    if (!projectName) missing.push('CF_PAGES_PROJECT_NAME');
    res.json({
      status: 'not_configured',
      latency_ms: 0,
      message: `Env var belum dikonfigurasi: ${missing.join(', ')}`,
      checked_at: new Date().toISOString(),
    });
    return;
  }

  const base    = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`;
  const headers = { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' };
  const start   = Date.now();

  try {
    const [projectRes, deploymentsRes] = await Promise.all([
      fetch(base,                                        { headers }),
      fetch(`${base}/deployments?per_page=1&sort_by=created_on&sort_order=desc`, { headers }),
    ]);
    const latency_ms = Date.now() - start;

    if (!projectRes.ok) {
      const text = await projectRes.text();
      res.json({
        status: 'down',
        latency_ms,
        message: `Cloudflare Pages API error ${projectRes.status}: ${text.slice(0, 200)}`,
        checked_at: new Date().toISOString(),
      });
      return;
    }

    const projData  = await projectRes.json() as CfApiResponse<CfProject>;
    const deplData  = deploymentsRes.ok
      ? (await deploymentsRes.json() as CfApiResponse<CfDeployment[]>)
      : { result: [] as CfDeployment[], success: false, errors: [] };

    const proj         = projData.result;
    const latestDeploy = (deplData.result[0] ?? proj.canonical_deployment) as CfDeployment | undefined;
    const deployStatus = latestDeploy?.latest_stage?.status ?? '';

    let status: 'operational' | 'degraded' | 'down' = 'operational';
    if (deployStatus === 'failure' || deployStatus === 'failed') status = 'down';
    else if (deployStatus && deployStatus !== 'success')         status = 'degraded';

    res.json({
      status,
      latency_ms,
      message: `Project "${proj.name}" · Branch: ${proj.production_branch} · Deploy: ${deployStatus || 'unknown'}`,
      checked_at: new Date().toISOString(),
      project: {
        name:                 proj.name,
        subdomain:            proj.subdomain,
        production_branch:    proj.production_branch,
        framework:            proj.build_config?.framework ?? '',
        build_command:        proj.build_config?.build_command ?? '',
        output_directory:     proj.build_config?.destination_dir ?? '',
        production_url:       latestDeploy?.url ?? `https://${proj.subdomain}.pages.dev`,
        pages_dev_url:        `https://${proj.subdomain}.pages.dev`,
        deployment_status:    deployStatus,
        deployment_id:        latestDeploy?.id ?? '',
        deployment_created_on: latestDeploy?.created_on ?? '',
        commit_hash:          latestDeploy?.deployment_trigger?.metadata?.commit_hash   ?? '',
        commit_message:       latestDeploy?.deployment_trigger?.metadata?.commit_message ?? '',
        build_time_ms:        latestDeploy?.build_time_ms ?? null,
      },
    });
  } catch (err) {
    res.json({
      status: 'down',
      latency_ms: Date.now() - start,
      message: err instanceof Error ? err.message : 'Cloudflare Pages API tidak dapat dijangkau',
      checked_at: new Date().toISOString(),
    });
  }
});

// ─── Static SPA (production only) ────────────────────────────────────────────
// In production the Express server is the sole entry point (port exposed as 80).
// Serve the Vite-built React SPA and fall back to index.html for any non-API
// route so React Router can handle client-side navigation.
if (isProd) {
  const distDir = path.resolve(__dirname, '../dist');
  app.use(express.static(distDir));

  // SPA catch-all: any GET that isn't /api/* serves index.html so that
  // direct navigation to /login, /register, /dashboard, etc. works.
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────

const listenPort = isProd ? (parseInt(process.env.PORT ?? '5000', 10)) : PORT;

app.listen(listenPort, '0.0.0.0', () => {
  console.log(
    `[API] TernakHub API server listening on port ${listenPort} (${isProd ? 'production' : 'development'})`,
  );
});
