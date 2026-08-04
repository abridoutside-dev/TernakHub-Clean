// ─── r2-storage Edge Function — FOUNDATION-STORAGE-002/004 ───────────────────
//
// Single Supabase Edge Function for all Cloudflare R2 storage operations.
// Uses a dispatcher pattern — one function, multiple actions.
//
// Required Edge Function Secrets:
//   R2_ACCOUNT_ID        — Cloudflare account ID
//   R2_BUCKET            — R2 bucket name
//   R2_ACCESS_KEY_ID     — S3-compatible access key ID
//   R2_SECRET_ACCESS_KEY — S3-compatible secret access key
//   R2_PUBLIC_URL        — (optional) public base URL for served objects
//   R2_CONFIG_ENCRYPTION_KEY — (reserved for future config encryption)
//
// To set secrets:
//   supabase secrets set R2_ACCOUNT_ID=<id> R2_BUCKET=<name> \
//     R2_ACCESS_KEY_ID=<key> R2_SECRET_ACCESS_KEY=<secret>
//
// Dispatcher: handlers[action](ctx)
// Never add separate Edge Functions for storage — add actions here.
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

// ─── Supabase client helper ───────────────────────────────────────────────────

function makeClient(jwt: string) {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth:   { persistSession: false },
  });
}

// ─── Authorization abstraction ────────────────────────────────────────────────
// All admin callers must use isPlatformAdmin() — never read user_metadata.role directly.

async function isPlatformAdmin(jwt: string): Promise<boolean> {
  const client = makeClient(jwt);
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
  const explicit    = Deno.env.get('R2_PUBLIC_URL')         ?? '';
  const publicBaseUrl = explicit
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
  secretKey: string, date: string, region: string, service: string,
): Promise<ArrayBuffer> {
  const kDate    = await hmacSha256(enc.encode(`AWS4${secretKey}`).buffer as ArrayBuffer, date);
  const kRegion  = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

// ─── SigV4 header-signed request ─────────────────────────────────────────────
// Used for S3 API calls that cannot use presigned query-string auth (e.g.
// HEAD bucket, DELETE object).  Always returns a Response — never throws.

async function makeSignedRequest(
  method: string,
  cfg: R2Config,
  path: string,
  body: string,
): Promise<Response> {
  const host        = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const region      = 'auto';
  const service     = 's3';
  const now         = new Date();
  const dateStr     = now.toISOString().replace(/[-:]/g, '').slice(0, 8);
  const dateTimeStr = now.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const payloadHash = await sha256Hex(body);

  const canonicalHeaders  = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateTimeStr}\n`;
  const signedHeadersList = 'host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [method, path, '', canonicalHeaders, signedHeadersList, payloadHash].join('\n');

  const credentialScope = `${dateStr}/${region}/${service}/aws4_request`;
  const stringToSign    = ['AWS4-HMAC-SHA256', dateTimeStr, credentialScope, await sha256Hex(canonicalRequest)].join('\n');

  const signingKey  = await deriveSigningKey(cfg.secretKey, dateStr, region, service);
  const signature   = toHex(await hmacSha256(signingKey, stringToSign));
  const authHeader  = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeadersList}, Signature=${signature}`;

  const headers: Record<string, string> = {
    'Authorization':       authHeader,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date':          dateTimeStr,
  };
  if (body) {
    headers['Content-Type']   = 'text/plain';
    headers['Content-Length'] = String(enc.encode(body).length);
  }

  return fetch(`https://${host}${path}`, {
    method,
    headers,
    body: body || undefined,
  });
}

// ─── Presigned URL generation ─────────────────────────────────────────────────

interface PresignOptions {
  method:          'PUT' | 'GET';
  cfg:             R2Config;
  objectKey:       string;
  expiresSeconds?: number;
}

async function presignUrl({ method, cfg, objectKey, expiresSeconds = 3600 }: PresignOptions): Promise<string> {
  const region  = 'auto';
  const service = 's3';
  const now     = new Date();
  const dateStr     = now.toISOString().replace(/[-:]/g, '').slice(0, 8);
  const dateTimeStr = now.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const host        = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const encodedKey  = objectKey.split('/').map(encodeURIComponent).join('/');
  const bucketPath  = `/${cfg.bucket}/${encodedKey}`;
  const credential  = `${cfg.accessKeyId}/${dateStr}/${region}/${service}/aws4_request`;

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

  const canonicalRequest = [
    method, bucketPath, canonicalQueryString,
    `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256', dateTimeStr,
    `${dateStr}/${region}/${service}/aws4_request`,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = await deriveSigningKey(cfg.secretKey, dateStr, region, service);
  const signature  = toHex(await hmacSha256(signingKey, stringToSign));

  return `https://${host}${bucketPath}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

// ─── Platform config key ──────────────────────────────────────────────────────

const STORAGE_CONFIG_KEY = 'service.storage';

const CREDENTIAL_MASKED = '**masked**';

function maskCredentials(cfg: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...cfg };
  for (const field of ['accessKeyId', 'secretAccessKey', 'cfApiToken']) {
    const v = masked[field];
    if (typeof v === 'string' && v && !v.startsWith('**')) {
      masked[field] = CREDENTIAL_MASKED;
    }
  }
  return masked;
}

// ─── Action handlers ──────────────────────────────────────────────────────────

type Handler = (ctx: ActionContext) => Promise<Response>;

// ─── presign-upload ───────────────────────────────────────────────────────────

const handlePresignUpload: Handler = async ({ payload }) => {
  const cfg = getR2Config();
  assertR2Configured(cfg);

  const objectKey      = String(payload.objectKey      ?? '');
  const contentType    = String(payload.contentType    ?? 'application/octet-stream');
  const expiresSeconds = Number(payload.expiresSeconds ?? 3600);

  if (!objectKey) return errorResponse('objectKey diperlukan');

  const uploadUrl = await presignUrl({ method: 'PUT', cfg, objectKey, expiresSeconds });
  const publicUrl = cfg.publicBaseUrl
    ? `${cfg.publicBaseUrl.replace(/\/$/, '')}/${objectKey}` : '';
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
// Reads StorageServiceConfig from platform_config, overlays R2 secret availability.

const handleGetConfig: Handler = async ({ jwt }) => {
  const isAdmin = await isPlatformAdmin(jwt);
  if (!isAdmin) return errorResponse('Akses ditolak: diperlukan hak platform admin', 403);

  const client = makeClient(jwt);
  const cfg    = getR2Config();

  const { data, error } = await client
    .from('platform_config')
    .select('value')
    .eq('key', STORAGE_CONFIG_KEY)
    .maybeSingle();

  if (error) return errorResponse(`Gagal membaca konfigurasi: ${error.message}`, 500);

  // Build default from secrets (non-sensitive parts only)
  const defaultConfig: Record<string, unknown> = {
    accountId:          cfg.accountId    || '',
    bucket:             cfg.bucket       || 'ternakhub-images',
    endpoint:           cfg.accountId ? `https://${cfg.accountId}.r2.cloudflarestorage.com` : '',
    region:             'auto',
    publicUrl:          cfg.publicBaseUrl || '',
    customDomain:       '',
    accessKeyId:        cfg.accessKeyId  ? CREDENTIAL_MASKED : '',
    secretAccessKey:    cfg.secretKey    ? CREDENTIAL_MASKED : '',
    cfApiToken:         '',
    enableStorage:      true,
    maxUploadSizeMb:    10,
    allowedMimeTypes:   ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxResolutionPx:    1920,
    autoCompression:    true,
    compressionQuality: 80,
    convertToWebP:      false,
    preserveExif:       false,
    cdnCacheTtlSec:     86400,
    signedUrl:          false,
    isPublicBucket:     true,
    defaultImageQuality: 80,
  };

  const storedConfig = (data?.value ?? {}) as Record<string, unknown>;
  const merged = { ...defaultConfig, ...storedConfig };

  return jsonResponse({
    ok:     true,
    config: maskCredentials(merged),
    source: data ? 'database' : 'defaults',
  });
};

// ─── save-config ──────────────────────────────────────────────────────────────
// Persists StorageServiceConfig to platform_config (credentials stored masked).

const handleSaveConfig: Handler = async ({ jwt, payload }) => {
  const isAdmin = await isPlatformAdmin(jwt);
  if (!isAdmin) return errorResponse('Akses ditolak: diperlukan hak platform admin', 403);

  const config = payload.config as Record<string, unknown> | undefined;
  if (!config) return errorResponse('Field "config" diperlukan');

  const bucket    = String(config.bucket    ?? '').trim();
  const accountId = String(config.accountId ?? '').trim();

  if (!bucket)    return errorResponse('Bucket Name wajib diisi');
  if (!accountId) return errorResponse('Account ID wajib diisi');

  const client = makeClient(jwt);
  const { data: { user } } = await client.auth.getUser();

  const { error } = await client
    .from('platform_config')
    .upsert(
      {
        key:         STORAGE_CONFIG_KEY,
        value:       maskCredentials(config),
        description: 'Cloudflare R2 object storage configuration',
        is_public:   false,
        updated_by:  user?.id ?? null,
        updated_at:  new Date().toISOString(),
      },
      { onConflict: 'key' },
    );

  if (error) return errorResponse(`Gagal menyimpan konfigurasi: ${error.message}`, 500);

  return jsonResponse({ ok: true, message: 'Konfigurasi storage berhasil disimpan dan diaktifkan' });
};

// ─── replace-credential ───────────────────────────────────────────────────────
// Updates a single credential entry in platform_config (stored masked).
// Actual R2 credentials used for operations come from Edge Function Secrets only.

const handleReplaceCredential: Handler = async ({ jwt, payload }) => {
  const isAdmin = await isPlatformAdmin(jwt);
  if (!isAdmin) return errorResponse('Akses ditolak: diperlukan hak platform admin', 403);

  const field   = String(payload.field ?? '');
  const value   = String(payload.value ?? '').trim();
  const allowed = ['accessKeyId', 'secretAccessKey', 'cfApiToken'];

  if (!allowed.includes(field)) return errorResponse('Field tidak dikenali');
  if (!value)                   return errorResponse('Nilai credential tidak boleh kosong');

  const client = makeClient(jwt);

  const { data: existing } = await client
    .from('platform_config')
    .select('value')
    .eq('key', STORAGE_CONFIG_KEY)
    .maybeSingle();

  if (!existing) {
    return errorResponse(
      'Konfigurasi storage belum tersimpan. Simpan konfigurasi lengkap terlebih dahulu.',
      404,
    );
  }

  const updated = {
    ...(existing.value as Record<string, unknown>),
    [field]: CREDENTIAL_MASKED, // never store plaintext credentials
  };

  const { data: { user } } = await client.auth.getUser();

  const { error } = await client
    .from('platform_config')
    .upsert(
      {
        key:         STORAGE_CONFIG_KEY,
        value:       updated,
        description: 'Cloudflare R2 object storage configuration',
        is_public:   false,
        updated_by:  user?.id ?? null,
        updated_at:  new Date().toISOString(),
      },
      { onConflict: 'key' },
    );

  if (error) return errorResponse(`Gagal memperbarui credential: ${error.message}`, 500);

  return jsonResponse({
    ok:      true,
    message: 'Credential berhasil diperbarui',
  });
};

// ─── health ───────────────────────────────────────────────────────────────────
// Full end-to-end health probe: HEAD bucket → upload canary → HEAD object →
// delete object → latency.  Available to any authenticated user.
// Returns: { ok, status, bucket, endpoint, publicUrl, writable, readable, latency, lastChecked }
// Status values: operational | degraded | down | not_configured

const handleHealth: Handler = async () => {
  const missing = ['R2_ACCOUNT_ID', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']
    .filter((k) => !Deno.env.get(k));

  const cfg = getR2Config();
  const endpoint = cfg.accountId ? `https://${cfg.accountId}.r2.cloudflarestorage.com` : '';

  if (missing.length > 0) {
    return jsonResponse({
      ok:          false,
      status:      'not_configured',
      bucket:      cfg.bucket || '',
      endpoint,
      publicUrl:   cfg.publicBaseUrl || '',
      writable:    false,
      readable:    false,
      latency:     null,
      lastChecked: new Date().toISOString(),
    });
  }

  const start      = Date.now();
  const canaryKey  = `__health/health-${Date.now()}.txt`;
  const canaryBody = `TernakHub R2 health check — ${new Date().toISOString()}`;

  // 1. HEAD bucket
  const bucketRes = await makeSignedRequest('HEAD', cfg, `/${cfg.bucket}`, '').catch(() => null);
  if (!bucketRes || (bucketRes.status !== 200 && bucketRes.status !== 204)) {
    return jsonResponse({
      ok:          false,
      status:      'down',
      bucket:      cfg.bucket,
      endpoint,
      publicUrl:   cfg.publicBaseUrl,
      writable:    false,
      readable:    false,
      latency:     Date.now() - start,
      lastChecked: new Date().toISOString(),
    });
  }

  // 2. Upload small temp object
  const uploadUrl = await presignUrl({ method: 'PUT', cfg, objectKey: canaryKey, expiresSeconds: 60 });
  const putRes    = await fetch(uploadUrl, {
    method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: canaryBody,
  }).catch(() => null);

  if (!putRes?.ok) {
    return jsonResponse({
      ok:          false,
      status:      'degraded',
      bucket:      cfg.bucket,
      endpoint,
      publicUrl:   cfg.publicBaseUrl,
      writable:    false,
      readable:    true,
      latency:     Date.now() - start,
      lastChecked: new Date().toISOString(),
    });
  }

  // 3. HEAD object
  const headRes = await makeSignedRequest('HEAD', cfg, `/${cfg.bucket}/${canaryKey}`, '').catch(() => null);

  // 4. Delete object
  await makeSignedRequest('DELETE', cfg, `/${cfg.bucket}/${canaryKey}`, '').catch(() => null);

  return jsonResponse({
    ok:          true,
    status:      'operational',
    bucket:      cfg.bucket,
    endpoint,
    publicUrl:   cfg.publicBaseUrl,
    writable:    true,
    readable:    headRes?.ok ?? false,
    latency:     Date.now() - start,
    lastChecked: new Date().toISOString(),
  });
};

// ─── test-connection ──────────────────────────────────────────────────────────
// Available to any authenticated user — used by checkR2Health() in the browser.

const handleTestConnection: Handler = async () => {
  const cfg     = getR2Config();
  const missing = ['R2_ACCOUNT_ID', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']
    .filter((k) => !Deno.env.get(k));

  if (missing.length > 0) {
    return jsonResponse({
      ok: false, status: 'misconfigured', missing,
      message: `Secret yang hilang: ${missing.join(', ')}`,
    });
  }

  try {
    const canaryKey = `__health/test-connection-${Date.now()}.txt`;
    const uploadUrl = await presignUrl({ method: 'PUT', cfg, objectKey: canaryKey, expiresSeconds: 60 });
    return jsonResponse({
      ok:        true,
      status:    'configured',
      bucket:    cfg.bucket,
      accountId: cfg.accountId,
      message:   'R2 credentials tersedia dan presign berhasil',
      // Truncated for admin inspection — never log full presigned URLs
      _presignPreview: uploadUrl.slice(0, 60) + '…',
    });
  } catch (err) {
    return jsonResponse({
      ok: false, status: 'error',
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
  const totalStart = Date.now();

  const uploadUrl = await presignUrl({ method: 'PUT', cfg, objectKey: testKey, expiresSeconds: 300 });

  const uploadStart = Date.now();
  const putRes = await fetch(uploadUrl, {
    method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: testBody,
  });
  const uploadMs = Date.now() - uploadStart;

  if (!putRes.ok) {
    const text = await putRes.text().catch(() => '');
    return jsonResponse({
      ok: false, status: 'upload_failed', httpStatus: putRes.status,
      message: text || `HTTP ${putRes.status}`,
      steps: { upload: false, read: false, delete: false },
      latencyMs: Date.now() - totalStart,
    });
  }

  // Read back
  const readUrl    = await presignUrl({ method: 'GET', cfg, objectKey: testKey, expiresSeconds: 300 });
  const readStart  = Date.now();
  const getRes     = await fetch(readUrl);
  const readMs     = Date.now() - readStart;

  // Delete probe
  const deleteUrl   = await presignUrl({ method: 'GET', cfg, objectKey: testKey, expiresSeconds: 60 });
  const deleteStart = Date.now();
  const delRes      = await fetch(deleteUrl.replace(/\?/, '?X-Amz-Method=DELETE&').replace('GET', 'DELETE'), { method: 'DELETE' }).catch(() => null);
  const deleteMs    = Date.now() - deleteStart;

  return jsonResponse({
    ok: true, status: 'upload_ok', testKey,
    message: `Upload OK · Read ${getRes.ok ? 'OK' : 'FAILED'} · Delete ${delRes?.ok ? 'OK' : 'FAILED'} (total ${Date.now() - totalStart}ms)`,
    steps: {
      upload: { ok: true,        latencyMs: uploadMs, bytes: new TextEncoder().encode(testBody).length },
      read:   { ok: getRes.ok,   latencyMs: readMs,   bytes: Number(getRes.headers.get('content-length') ?? 0), httpStatus: getRes.status },
      delete: { ok: delRes?.ok ?? false, latencyMs: deleteMs },
    },
    latencyMs: Date.now() - totalStart,
  });
};

// ─── test-download ────────────────────────────────────────────────────────────

const handleTestDownload: Handler = async ({ jwt, payload }) => {
  const isAdmin = await isPlatformAdmin(jwt);
  if (!isAdmin) return errorResponse('Akses ditolak: diperlukan hak platform admin', 403);

  const cfg       = getR2Config();
  assertR2Configured(cfg);
  const objectKey = String(payload.objectKey ?? '');
  if (!objectKey) return errorResponse('objectKey diperlukan untuk test-download');

  const downloadUrl = await presignUrl({ method: 'GET', cfg, objectKey, expiresSeconds: 300 });
  const start       = Date.now();
  const getRes      = await fetch(downloadUrl);
  const latencyMs   = Date.now() - start;

  if (!getRes.ok) {
    return jsonResponse({
      ok: false, status: 'download_failed', httpStatus: getRes.status, latencyMs,
      message: `HTTP ${getRes.status}`,
    });
  }

  return jsonResponse({
    ok:            true,
    status:        'download_ok',
    objectKey,
    contentType:   getRes.headers.get('content-type')   ?? 'unknown',
    contentLength: Number(getRes.headers.get('content-length') ?? 0),
    httpStatus:    getRes.status,
    latencyMs,
    message:       `Test download berhasil dari ${cfg.bucket}/${objectKey}`,
  });
};

// ─── Dispatcher ───────────────────────────────────────────────────────────────
// Add new actions here — never create separate Edge Functions.

const handlers: Record<string, Handler> = {
  'health':             handleHealth,
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
  if (req.method === 'OPTIONS') return corsOk();
  if (req.method !== 'POST')    return errorResponse('Method tidak didukung. Gunakan POST.', 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt        = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!jwt)         return errorResponse('Authorization header diperlukan', 401);

  const client = makeClient(jwt);
  const { data: { user }, error: authError } = await client.auth.getUser(jwt);
  if (authError || !user) return errorResponse('Token tidak valid atau sudah kedaluwarsa', 401);

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

  try {
    return await handler({ payload, userId: user.id, jwt });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server';
    console.error(`[r2-storage] action=${action} error:`, err);
    return errorResponse(message, 500);
  }
});
