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
