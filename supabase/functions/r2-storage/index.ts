// ─── r2-storage Edge Function — FOUNDATION-STORAGE-002 ───────────────────────
//
// Single Supabase Edge Function for all Cloudflare R2 storage operations.
// Uses a dispatcher pattern — one function, multiple actions.
//
// Required Edge Function Secrets:
//   R2_ACCOUNT_ID       — Cloudflare account ID
//   R2_BUCKET           — R2 bucket name
//   R2_ACCESS_KEY_ID    — S3-compatible access key ID (Cloudflare R2 API token)
//   R2_SECRET_ACCESS_KEY — S3-compatible secret access key
//   R2_PUBLIC_URL       — (optional) public base URL for served objects
//   R2_CONFIG_ENCRYPTION_KEY — (optional) for future config encryption
//
// To add these secrets:
//   supabase secrets set R2_ACCOUNT_ID=<value> R2_BUCKET=<value> ...
//
// Dispatcher: handlers[action](ctx)
// Never add separate r2-health, r2-admin, r2-presign Edge Functions.
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

// ─── Request context ──────────────────────────────────────────────────────────

interface ActionContext {
  payload: Record<string, unknown>;
  userId:  string;
  jwt:     string;
}

// ─── Authorization abstraction ────────────────────────────────────────────────
// All callers must use isPlatformAdmin() — never read user_metadata.role directly.

async function isPlatformAdmin(jwt: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const client = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth:   { persistSession: false },
  });
  const { data: { user } } = await client.auth.getUser();
  // Initial implementation: check user_metadata.role.
  // Future: replace with a dedicated platform_admin table check.
  return user?.user_metadata?.role === 'platform_admin';
}

// ─── R2 Config ────────────────────────────────────────────────────────────────

interface R2Config {
  accountId:     string;
  bucket:        string;
  accessKeyId:   string;
  secretKey:     string;
  publicBaseUrl: string;
}

function getR2Config(): R2Config {
  const accountId   = Deno.env.get('R2_ACCOUNT_ID')        ?? '';
  const bucket      = Deno.env.get('R2_BUCKET')             ?? '';
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')      ?? '';
  const secretKey   = Deno.env.get('R2_SECRET_ACCESS_KEY')  ?? '';
  // Derive public URL if not explicitly set.
  // The bucket must have "Public Access" enabled in the Cloudflare dashboard.
  const explicitPublicUrl = Deno.env.get('R2_PUBLIC_URL') ?? '';
  const publicBaseUrl = explicitPublicUrl
    || (accountId && bucket ? `https://${bucket}.${accountId}.r2.dev` : '');
  return { accountId, bucket, accessKeyId, secretKey, publicBaseUrl };
}

function assertR2Configured(cfg: R2Config): void {
  const missing = (
    [['R2_ACCOUNT_ID', cfg.accountId], ['R2_BUCKET', cfg.bucket],
     ['R2_ACCESS_KEY_ID', cfg.accessKeyId], ['R2_SECRET_ACCESS_KEY', cfg.secretKey]] as [string, string][]
  ).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(`R2 belum dikonfigurasi. Secret yang hilang: ${missing.join(', ')}`);
  }
}

// ─── SigV4 helpers ────────────────────────────────────────────────────────────

const enc = new TextEncoder();

async function hmacSha256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(data));
  return toHex(hash);
}

async function deriveSigningKey(
  secretKey: string,
  date:      string,
  region:    string,
  service:   string,
): Promise<ArrayBuffer> {
  const kDate    = await hmacSha256(enc.encode(`AWS4${secretKey}`).buffer, date);
  const kRegion  = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

// ─── Presigned URL generation ─────────────────────────────────────────────────

interface PresignOptions {
  method:          'PUT' | 'GET';
  cfg:             R2Config;
  objectKey:       string;
  expiresSeconds?: number;
}

async function presignUrl({ method, cfg, objectKey, expiresSeconds = 3600 }: PresignOptions): Promise<string> {
  const region  = 'auto'; // Cloudflare R2 always uses 'auto'
  const service = 's3';
  const now     = new Date();

  const dateStr     = now.toISOString().replace(/[-:]/g, '').slice(0, 8);         // YYYYMMDD
  const dateTimeStr = now.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'; // YYYYMMDDTHHmmssZ

  const host       = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const encodedKey = objectKey.split('/').map(encodeURIComponent).join('/');
  const bucketPath = `/${cfg.bucket}/${encodedKey}`;
  const credential = `${cfg.accessKeyId}/${dateStr}/${region}/${service}/aws4_request`;

  // Build canonical query string (must be sorted lexicographically)
  const queryEntries: [string, string][] = [
    ['X-Amz-Algorithm',     'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential',    credential],
    ['X-Amz-Date',          dateTimeStr],
    ['X-Amz-Expires',       String(expiresSeconds)],
    ['X-Amz-SignedHeaders', 'host'],
  ];
  queryEntries.sort(([a], [b]) => a.localeCompare(b));
  const canonicalQueryString = queryEntries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  // Canonical request
  const canonicalRequest = [
    method,
    bucketPath,
    canonicalQueryString,
    `host:${host}\n`,           // canonical headers (trailing newline required)
    'host',                     // signed headers
    'UNSIGNED-PAYLOAD',         // payload hash for presigned URLs
  ].join('\n');

  const canonicalRequestHash = await sha256Hex(canonicalRequest);

  // String to sign
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    dateTimeStr,
    `${dateStr}/${region}/${service}/aws4_request`,
    canonicalRequestHash,
  ].join('\n');

  const signingKey = await deriveSigningKey(cfg.secretKey, dateStr, region, service);
  const signature  = toHex(await hmacSha256(signingKey, stringToSign));

  return `https://${host}${bucketPath}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

// ─── Action handlers ──────────────────────────────────────────────────────────

type Handler = (ctx: ActionContext) => Promise<Response>;

// ─── presign-upload ───────────────────────────────────────────────────────────

const handlePresignUpload: Handler = async ({ payload }) => {
  const cfg = getR2Config();
  assertR2Configured(cfg);

  const objectKey     = String(payload.objectKey     ?? '');
  const contentType   = String(payload.contentType   ?? 'application/octet-stream');
  const expiresSeconds = Number(payload.expiresSeconds ?? 3600);

  if (!objectKey) return errorResponse('objectKey diperlukan');

  const uploadUrl = await presignUrl({ method: 'PUT', cfg, objectKey, expiresSeconds });

  const publicUrl = cfg.publicBaseUrl
    ? `${cfg.publicBaseUrl.replace(/\/$/, '')}/${objectKey}`
    : '';

  const expiresAt = new Date(Date.now() + expiresSeconds * 1000).toISOString();

  return jsonResponse({ ok: true, uploadUrl, publicUrl, contentType, expiresAt });
};

// ─── presign-download ─────────────────────────────────────────────────────────

const handlePresignDownload: Handler = async ({ payload }) => {
  const cfg = getR2Config();
  assertR2Configured(cfg);

  const objectKey      = String(payload.objectKey      ?? '');
  const expiresSeconds = Number(payload.expiresSeconds ?? 3600);

  if (!objectKey) return errorResponse('objectKey diperlukan');

  const downloadUrl = await presignUrl({ method: 'GET', cfg, objectKey, expiresSeconds });
  const expiresAt   = new Date(Date.now() + expiresSeconds * 1000).toISOString();

  return jsonResponse({ ok: true, downloadUrl, expiresAt });
};

// ─── get-config ───────────────────────────────────────────────────────────────

const handleGetConfig: Handler = async ({ jwt }) => {
  const isAdmin = await isPlatformAdmin(jwt);
  if (!isAdmin) return errorResponse('Akses ditolak: diperlukan hak platform admin', 403);

  const cfg = getR2Config();
  return jsonResponse({
    ok:             true,
    accountId:      cfg.accountId   || null,
    bucket:         cfg.bucket      || null,
    publicBaseUrl:  cfg.publicBaseUrl || null,
    // Credentials are never returned — only indicates whether they are set
    hasAccessKey:   Boolean(cfg.accessKeyId),
    hasSecretKey:   Boolean(cfg.secretKey),
  });
};

// ─── save-config ──────────────────────────────────────────────────────────────
// Edge Function Secrets cannot be mutated at runtime.
// Respond with instructions instead of silently failing.

const handleSaveConfig: Handler = async ({ jwt }) => {
  const isAdmin = await isPlatformAdmin(jwt);
  if (!isAdmin) return errorResponse('Akses ditolak: diperlukan hak platform admin', 403);

  return jsonResponse({
    ok:          false,
    error:       'Edge Function Secrets tidak dapat diubah melalui API. Gunakan Supabase CLI: supabase secrets set <KEY>=<VALUE>',
    instruction: 'supabase secrets set R2_ACCOUNT_ID=<value> R2_BUCKET=<value> R2_ACCESS_KEY_ID=<value> R2_SECRET_ACCESS_KEY=<value>',
  }, 501);
};

// ─── replace-credential ───────────────────────────────────────────────────────

const handleReplaceCredential: Handler = async ({ jwt }) => {
  const isAdmin = await isPlatformAdmin(jwt);
  if (!isAdmin) return errorResponse('Akses ditolak: diperlukan hak platform admin', 403);

  return jsonResponse({
    ok:          false,
    error:       'Credential R2 disimpan sebagai Edge Function Secrets dan tidak dapat diganti melalui API.',
    instruction: 'Buat API Token baru di Cloudflare Dashboard, lalu jalankan: supabase secrets set R2_ACCESS_KEY_ID=<new> R2_SECRET_ACCESS_KEY=<new>',
  }, 501);
};

// ─── test-connection ──────────────────────────────────────────────────────────
// Available to any authenticated user — used by checkR2Health() in the browser.
// Returns minimal connectivity info only; detailed config requires get-config (admin).

const handleTestConnection: Handler = async () => {

  const cfg = getR2Config();

  const missing = ['R2_ACCOUNT_ID', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']
    .filter((k) => !Deno.env.get(k));

  if (missing.length > 0) {
    return jsonResponse({
      ok:       false,
      status:   'misconfigured',
      missing,
      message:  `Secret yang hilang: ${missing.join(', ')}`,
    });
  }

  // Generate a presigned URL for a canary key — if signing succeeds, credentials
  // are at least syntactically valid (a PUT to R2 would be needed to confirm auth).
  try {
    const canaryKey = `__health/test-connection-${Date.now()}.txt`;
    const uploadUrl = await presignUrl({ method: 'PUT', cfg, objectKey: canaryKey, expiresSeconds: 60 });
    return jsonResponse({
      ok:        true,
      status:    'configured',
      bucket:    cfg.bucket,
      accountId: cfg.accountId,
      message:   'R2 credentials tersedia dan presign berhasil. Gunakan test-upload untuk verifikasi penuh.',
      // Return presign URL only for admin inspection — never logged or exposed to users.
      _presignSample: uploadUrl.slice(0, 60) + '…',
    });
  } catch (err) {
    return jsonResponse({
      ok:      false,
      status:  'error',
      message: err instanceof Error ? err.message : 'Presign gagal',
    });
  }
};

// ─── test-upload ──────────────────────────────────────────────────────────────

const handleTestUpload: Handler = async ({ jwt }) => {
  const isAdmin = await isPlatformAdmin(jwt);
  if (!isAdmin) return errorResponse('Akses ditolak: diperlukan hak platform admin', 403);

  const cfg = getR2Config();
  assertR2Configured(cfg);

  const testKey  = `__health/test-upload-${Date.now()}.txt`;
  const testBody = `TernakHub R2 connectivity test — ${new Date().toISOString()}`;

  const uploadUrl = await presignUrl({ method: 'PUT', cfg, objectKey: testKey, expiresSeconds: 300 });

  const putRes = await fetch(uploadUrl, {
    method:  'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body:    testBody,
  });

  if (!putRes.ok) {
    const text = await putRes.text().catch(() => '');
    return jsonResponse({
      ok:      false,
      status:  'upload_failed',
      httpStatus: putRes.status,
      message: text || `HTTP ${putRes.status}`,
    });
  }

  return jsonResponse({
    ok:      true,
    status:  'upload_ok',
    testKey,
    message: `Test object berhasil diunggah ke ${cfg.bucket}/${testKey}`,
  });
};

// ─── test-download ────────────────────────────────────────────────────────────

const handleTestDownload: Handler = async ({ jwt, payload }) => {
  const isAdmin = await isPlatformAdmin(jwt);
  if (!isAdmin) return errorResponse('Akses ditolak: diperlukan hak platform admin', 403);

  const cfg     = getR2Config();
  assertR2Configured(cfg);

  const objectKey = String(payload.objectKey ?? '');
  if (!objectKey) return errorResponse('objectKey diperlukan untuk test-download');

  const downloadUrl = await presignUrl({ method: 'GET', cfg, objectKey, expiresSeconds: 300 });

  const getRes = await fetch(downloadUrl);
  if (!getRes.ok) {
    return jsonResponse({
      ok:         false,
      status:     'download_failed',
      httpStatus: getRes.status,
      message:    `HTTP ${getRes.status}`,
    });
  }

  const contentType   = getRes.headers.get('content-type') ?? 'unknown';
  const contentLength = getRes.headers.get('content-length') ?? 'unknown';

  return jsonResponse({
    ok:            true,
    status:        'download_ok',
    objectKey,
    contentType,
    contentLength,
    message:       `Test download berhasil dari ${cfg.bucket}/${objectKey}`,
  });
};

// ─── Dispatcher ───────────────────────────────────────────────────────────────
// Add all new actions here — never create separate Edge Functions.

const handlers: Record<string, Handler> = {
  'presign-upload':     handlePresignUpload,
  'presign-download':   handlePresignDownload,
  'get-config':         handleGetConfig,
  'save-config':        handleSaveConfig,
  'replace-credential': handleReplaceCredential,
  'test-connection':    handleTestConnection,
  'test-upload':        handleTestUpload,
  'test-download':      handleTestDownload,
};

// ─── Entry point ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') return corsOk();

  if (req.method !== 'POST') {
    return errorResponse('Method tidak didukung. Gunakan POST.', 405);
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt        = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!jwt) return errorResponse('Authorization header diperlukan', 401);

  // Verify JWT via Supabase
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabase    = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth:   { persistSession: false },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return errorResponse('Token tidak valid atau sudah kedaluwarsa', 401);

  // ── Payload ─────────────────────────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return errorResponse('Request body harus berupa JSON');
  }

  const action = String(payload.action ?? '');
  if (!action) return errorResponse('Field "action" diperlukan');

  const handler = handlers[action];
  if (!handler) {
    return errorResponse(
      `Action tidak dikenal: "${action}". Action yang tersedia: ${Object.keys(handlers).join(', ')}`,
    );
  }

  // ── Dispatch ─────────────────────────────────────────────────────────────────
  try {
    return await handler({ payload, userId: user.id, jwt });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server';
    console.error(`[r2-storage] action=${action} error:`, err);
    return errorResponse(message, 500);
  }
});
