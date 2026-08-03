// ─── TernakHub API Server — DB-001C-1 ────────────────────────────────────────
//
// Lightweight Express server providing server-side operations that cannot
// be performed in the browser (R2 uploads, signed URLs, etc.).
//
// Port: 5001 (Vite dev server proxies /api/* here)
//
// SECURITY BOUNDARY:
//   R2 credentials (CLOUDFLARE_R2_*) are ONLY accessible in this process.
//   They must NEVER be forwarded to the browser or logged in responses.
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadRouter from './routes/upload.js';
import adminConfigRouter from './routes/adminConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = parseInt(process.env.API_PORT ?? '5001', 10);
const isProd = process.env.NODE_ENV === 'production';

// ─── Middleware ───────────────────────────────────────────────────────────────

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow same-origin proxy (Vite dev), *.replit.dev previews, and *.replit.app
// production deployments. Origin-less requests (curl, server-to-server) pass
// through because they arrive without an Origin header — route auth still
// protects them.
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

app.use('/api/upload', uploadRouter);
app.use('/api/admin/storage-config', adminConfigRouter);

// Root ping
app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, service: 'ternakhub-api', ts: new Date().toISOString() });
});

// ─── Static SPA (production only) ────────────────────────────────────────────
// In production the Express server is the sole entry point (port 5001 exposed
// as port 80).  Serve the Vite-built React SPA and fall back to index.html for
// any non-API route so React Router can handle client-side navigation.
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
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const bucket    = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? 'ternakhub-images';
  const hasToken  = Boolean(process.env.CLOUDFLARE_R2_API_TOKEN);

  console.log(`[API] TernakHub API server listening on port ${listenPort} (${isProd ? 'production' : 'development'})`);
  console.log(`[R2]  Account: ${accountId ?? '(missing CLOUDFLARE_R2_ACCOUNT_ID)'}`);
  console.log(`[R2]  Bucket:  ${bucket}`);
  console.log(`[R2]  Token:   ${hasToken ? '✓ set' : '✗ missing CLOUDFLARE_R2_API_TOKEN'}`);
});
