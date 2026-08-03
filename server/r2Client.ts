// ─── Cloudflare R2 Client — ADMIN-PLATFORM-003B ───────────────────────────────
//
// Uses the Cloudflare REST API (Bearer token) — NOT the S3-compatible API.
// Credentials are read at call-time from the mutable r2ConfigStore so that
// admin-saved configuration takes effect immediately without a server restart.
//
// API reference:
//   PUT  /accounts/{accountId}/r2/buckets/{bucket}/objects/{key}
//   GET  /accounts/{accountId}/r2/buckets/{bucket}/objects/{key}
//   HEAD /accounts/{accountId}/r2/buckets
//
// SECURITY: This file MUST only be imported by server-side code.
// Never import it in src/ (browser) code — credentials would be exposed.
// ─────────────────────────────────────────────────────────────────────────────

import { getR2Config, getCfApiToken } from './r2ConfigStore.js';

const CF_API = 'https://api.cloudflare.com/client/v4';

// ─── Live accessors (read from config store, not static env vars) ─────────────

export function getAccountId(): string  { return getR2Config().accountId  || (process.env.CLOUDFLARE_R2_ACCOUNT_ID  ?? ''); }
export function getBucket():    string  { return getR2Config().bucket      || (process.env.CLOUDFLARE_R2_BUCKET_NAME  ?? 'ternakhub-images'); }
export function getPublicUrl(): string  { return getR2Config().publicUrl   || (process.env.CLOUDFLARE_R2_PUBLIC_URL   ?? '').replace(/\/$/, ''); }
export function getApiToken():  string  { return getCfApiToken()           || (process.env.CLOUDFLARE_R2_API_TOKEN    ?? ''); }

// Legacy static-style exports kept for compatibility with existing callers.
// These now read live values from the store on every access.
export const R2_BUCKET = new Proxy({} as { valueOf(): string }, {
  get(_t, p) {
    if (p === 'valueOf' || p === 'toString' || p === Symbol.toPrimitive) return () => getBucket();
    return undefined;
  },
}) as unknown as string;

// ─── Auth Header ──────────────────────────────────────────────────────────────

export function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${getApiToken()}` };
}

// ─── Object URL helpers ───────────────────────────────────────────────────────

/**
 * Cloudflare REST API URL for an R2 object (used by server-side operations).
 */
export function r2ObjectApiUrl(key: string): string {
  return `${CF_API}/accounts/${getAccountId()}/r2/buckets/${getBucket()}/objects/${encodeURIComponent(key)}`;
}

/**
 * Public-facing URL for an uploaded object.
 *
 * Priority:
 *   1. Admin-saved customDomain
 *   2. Admin-saved publicUrl (custom domain or r2.dev URL)
 *   3. CLOUDFLARE_R2_PUBLIC_URL env var
 *   4. Derived r2.dev URL — requires "Public Access" enabled on the bucket
 *
 * @param key - Object key (path) in the bucket
 */
export function buildPublicUrl(key: string): string {
  const cfg = getR2Config();
  const base = cfg.customDomain || cfg.publicUrl || getPublicUrl();
  if (base) return `${base.replace(/\/$/, '')}/${key}`;
  // Derived r2.dev URL (works only if bucket public access is enabled)
  return `https://${getBucket()}.${getAccountId()}.r2.dev/${key}`;
}

// ─── Bucket Health Check ──────────────────────────────────────────────────────

export interface BucketHealthResult {
  ok: boolean;
  bucket: string;
  message: string;
}

export async function checkBucketHealth(): Promise<BucketHealthResult> {
  const accountId = getAccountId();
  const bucket    = getBucket();

  if (!accountId) {
    return { ok: false, bucket, message: 'Account ID belum dikonfigurasi' };
  }
  if (!getApiToken()) {
    return { ok: false, bucket, message: 'API Token / CF API Token belum dikonfigurasi' };
  }

  const url = `${CF_API}/accounts/${accountId}/r2/buckets`;
  const res = await fetch(url, { headers: authHeaders() });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { ok: false, bucket, message: `HTTP ${res.status}: ${text}` };
  }

  interface BucketsResponse {
    success: boolean;
    result: { buckets: Array<{ name: string }> };
  }
  const data  = await res.json() as BucketsResponse;
  const found = data.result?.buckets?.some((b) => b.name === bucket);
  if (!found) {
    return { ok: false, bucket, message: `Bucket "${bucket}" tidak ditemukan di akun ini` };
  }
  return { ok: true, bucket, message: `Bucket "${bucket}" reachable` };
}

// ─── Object Upload ────────────────────────────────────────────────────────────

export interface UploadObjectResult {
  ok: boolean;
  key: string;
  url: string;
  error?: string;
}

/**
 * Upload a buffer to Cloudflare R2 via the Cloudflare REST API.
 *
 * @param key        - Object key (path inside the bucket)
 * @param buffer     - File contents
 * @param mimeType   - MIME type for the Content-Type header
 * @param metadata   - Optional custom metadata (stored as CF object metadata)
 */
export async function uploadObject(
  key: string,
  buffer: Buffer,
  mimeType: string,
  metadata?: Record<string, string>,
): Promise<UploadObjectResult> {
  const url = r2ObjectApiUrl(key);

  const headers: Record<string, string> = {
    ...authHeaders(),
    'Content-Type':   mimeType,
    'Content-Length': buffer.length.toString(),
  };

  // Attach custom metadata as CF-specific headers if provided
  if (metadata) {
    for (const [k, v] of Object.entries(metadata)) {
      headers[`CF-Object-Metadata-${k}`] = v;
    }
  }

  const res = await fetch(url, {
    method:  'PUT',
    headers,
    body:    buffer,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { ok: false, key, url: '', error: `R2 upload failed (HTTP ${res.status}): ${text}` };
  }

  return { ok: true, key, url: buildPublicUrl(key) };
}

// ─── Object Delete (rollback / cleanup) ──────────────────────────────────────

export interface DeleteObjectResult {
  ok: boolean;
  key: string;
  error?: string;
}

/**
 * Delete an object from Cloudflare R2 via the Cloudflare REST API.
 * Used to roll back orphaned uploads when a request fails after a partial write.
 *
 * @param key - Object key (path inside the bucket) to delete
 */
export async function deleteObject(key: string): Promise<DeleteObjectResult> {
  const url = r2ObjectApiUrl(key);

  const res = await fetch(url, {
    method:  'DELETE',
    headers: authHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { ok: false, key, error: `R2 delete failed (HTTP ${res.status}): ${text}` };
  }

  return { ok: true, key };
}
