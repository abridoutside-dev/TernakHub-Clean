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

// U-005 — server-to-server platform-health bridge.
//
// The browser session is used only here to establish that the caller is a
// system administrator. It is never forwarded to the Edge Function. The Edge
// Function receives an internal service token derived from SESSION_SECRET
// instead, so auth_integrity never depends on an expiring user JWT.
//
// Caller identity verification uses the anon key (SUPABASE_ANON_KEY /
// VITE_SUPABASE_ANON_KEY). auth.getUser(jwt) verifies the user's JWT via the
// Supabase Auth service — it does not require the service role key, since the
// JWT itself carries the authentication claim. Using the anon key here avoids
// a hard dependency on SUPABASE_SERVICE_ROLE_KEY for this read-only check.
app.post('/api/admin/platform-health', async (req, res) => {
  const action = typeof req.body?.action === 'string' ? req.body.action : '';
  if (action !== 'auth-health' && action !== 'auth-integrity') {
    res.status(400).json({ ok: false, error: 'Action admin tidak didukung.' });
    return;
  }

  const authHeader = req.get('authorization') ?? '';
  const userJwt = authHeader.match(/^Bearer\s+(.+)$/i)?.[1] ?? '';
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  // Caller identity verification only — anon key is sufficient for auth.getUser().
  const callerKey =
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY;
  const internalToken = process.env.SESSION_SECRET;

  if (!userJwt) {
    res.status(401).json({ ok: false, error: 'Authorization header diperlukan.' });
    return;
  }

  if (!supabaseUrl || !callerKey) {
    console.error('[U-005] Supabase caller verification is not configured.');
    res.status(503).json({ ok: false, error: 'Verifikasi admin belum dikonfigurasi.' });
    return;
  }

  try {
    // Use the Auth REST API directly to avoid triggering the Supabase Realtime
    // WebSocket client, which throws on Node.js < 22 (no native WebSocket).
    const userRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${userJwt}`,
        apikey: callerKey,
      },
    });
    if (!userRes.ok) {
      res.status(401).json({ ok: false, error: 'Token user tidak valid atau sudah kedaluwarsa.' });
      return;
    }
    const userData = await userRes.json() as { id?: string; user_metadata?: Record<string, unknown> } | null;
    if (!userData?.id) {
      res.status(401).json({ ok: false, error: 'Token user tidak valid atau sudah kedaluwarsa.' });
      return;
    }

    if (userData.user_metadata?.role !== 'system_admin') {
      res.status(403).json({ ok: false, error: 'Akses ditolak: system admin only.' });
      return;
    }

    if (!internalToken) {
      res.status(200).json({
        ok: true,
        ...(action === 'auth-integrity'
          ? {
              auth_integrity: {
                status: 'warning',
                code: 'SYSTEM_ADMIN_TOKEN_MISSING',
                issue_count: 0,
                issues: [],
                error: null,
                error_details: null,
                checked_at: new Date().toISOString(),
              },
            }
          : {
              auth_health: {
                auth_integrity: {
                  status: 'warning',
                  code: 'SYSTEM_ADMIN_TOKEN_MISSING',
                  issue_count: 0,
                  issues: [],
                  error: null,
                  error_details: null,
                  checked_at: new Date().toISOString(),
                },
              },
            }),
      });
      return;
    }

    const edgeFunctionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/platform-health`;
    const edgeResponse = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-platform-health-internal-token': internalToken,
      },
      body: JSON.stringify({ action }),
    });
    const responseText = await edgeResponse.text();
    let responseBody: unknown;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = { ok: false, error: responseText.slice(0, 300) };
    }

    res.status(edgeResponse.ok ? 200 : 502).json(responseBody);
  } catch (error) {
    console.error('[U-005] platform-health internal bridge failed.', {
      action,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(502).json({ ok: false, error: 'Platform health service tidak dapat dijangkau.' });
  }
});

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
