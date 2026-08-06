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
import {
  AtomicRegistrationError,
  type AtomicRegistrationInput,
} from './atomicRegistration';
import { registerWithSupabaseAdmin } from './registration';

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

// U-002 — Auth user + profile + default workspace with compensating rollback.
// The service-role key is read only on request and is never sent to the client.
app.post('/api/auth/register', async (req, res) => {
  const input = req.body as Partial<AtomicRegistrationInput>;
  const requiredFields: Array<keyof AtomicRegistrationInput> = [
    'email', 'password', 'fullName', 'phone', 'province', 'regency', 'district', 'village',
  ];
  if (requiredFields.some((field) => typeof input[field] !== 'string')) {
    res.status(400).json({ error: 'Data registrasi tidak lengkap.' });
    return;
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error('[U-002] Supabase Admin API is not configured.');
    res.status(503).json({ error: 'Registrasi belum dapat diproses di server.' });
    return;
  }

  try {
    const result = await registerWithSupabaseAdmin(
      input as AtomicRegistrationInput,
      { url, serviceRoleKey },
    );
    res.status(201).json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('already registered') || message.includes('already been registered')) {
      res.status(409).json({ error: 'Email ini sudah terdaftar.' });
      return;
    }

    if (error instanceof AtomicRegistrationError) {
      console.error('[U-002] Atomic registration rolled back.', {
        step: error.step,
        rollbackErrors: error.rollbackErrors.length,
        cause: error.message,
      });
    } else {
      console.error('[U-002] Atomic registration failed.', error);
    }
    res.status(500).json({ error: 'Registrasi gagal dan perubahan telah dibatalkan.' });
  }
});

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
