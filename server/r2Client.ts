// ─── Cloudflare R2 Client — DB-001C-1 ────────────────────────────────────────
//
// Uses the Cloudflare REST API (Bearer token) — NOT the S3-compatible API.
// This is the correct approach when CLOUDFLARE_R2_API_TOKEN is a Cloudflare
// API token (not an S3 Access Key ID + Secret pair).
//
// API reference:
//   PUT  /accounts/{accountId}/r2/buckets/{bucket}/objects/{key}
//   GET  /accounts/{accountId}/r2/buckets/{bucket}/objects/{key}
//   HEAD /accounts/{accountId}/r2/buckets
//
// SECURITY: This file MUST only be imported by server-side code.
// Never import it in src/ (browser) code — credentials would be exposed.
//
// Env vars (Replit Secrets — server-side only, no VITE_ prefix):
//   CLOUDFLARE_R2_ACCOUNT_ID   — Cloudflare account ID
//   CLOUDFLARE_R2_BUCKET_NAME  — R2 bucket name
//   CLOUDFLARE_R2_API_TOKEN    — Cloudflare API token (Bearer auth)
//   CLOUDFLARE_R2_PUBLIC_URL   — (optional) public base URL for served objects
// ─────────────────────────────────────────────────────────────────────────────

const CF_API = 'https://api.cloudflare.com/client/v4';

export const R2_ACCOUNT_ID  = process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? '';
export const R2_BUCKET       = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? 'ternakhub-images';
export const R2_API_TOKEN    = process.env.CLOUDFLARE_R2_API_TOKEN ?? '';
export const R2_PUBLIC_URL   = (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? '').replace(/\/$/, '');

if (!R2_ACCOUNT_ID) console.error('[R2] Missing CLOUDFLARE_R2_ACCOUNT_ID');
if (!R2_API_TOKEN)  console.error('[R2] Missing CLOUDFLARE_R2_API_TOKEN');

// ─── Auth Header ──────────────────────────────────────────────────────────────

export function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${R2_API_TOKEN}` };
}

// ─── Object URL helpers ───────────────────────────────────────────────────────

/**
 * Cloudflare REST API URL for an R2 object (used by server-side operations).
 */
export function r2ObjectApiUrl(key: string): string {
  return `${CF_API}/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects/${key}`;
}

/**
 * Public-facing URL for an uploaded object.
 *
 * Priority:
 *   1. CLOUDFLARE_R2_PUBLIC_URL env var (custom domain or r2.dev URL set in dashboard)
 *   2. Derived r2.dev URL — requires "Public Access" enabled on the bucket
 *
 * @param key - Object key (path) in the bucket
 */
export function buildPublicUrl(key: string): string {
  if (R2_PUBLIC_URL) return `${R2_PUBLIC_URL}/${key}`;
  // Derived r2.dev URL (works only if bucket public access is enabled)
  return `https://${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.dev/${key}`;
}

// ─── Bucket Health Check ──────────────────────────────────────────────────────

export interface BucketHealthResult {
  ok: boolean;
  bucket: string;
  message: string;
}

export async function checkBucketHealth(): Promise<BucketHealthResult> {
  const url = `${CF_API}/accounts/${R2_ACCOUNT_ID}/r2/buckets`;
  const res = await fetch(url, { headers: authHeaders() });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { ok: false, bucket: R2_BUCKET, message: `HTTP ${res.status}: ${text}` };
  }

  interface BucketsResponse {
    success: boolean;
    result: { buckets: Array<{ name: string }> };
  }
  const data = await res.json() as BucketsResponse;
  const found = data.result?.buckets?.some((b) => b.name === R2_BUCKET);
  if (!found) {
    return { ok: false, bucket: R2_BUCKET, message: `Bucket "${R2_BUCKET}" tidak ditemukan di akun ini` };
  }
  return { ok: true, bucket: R2_BUCKET, message: `Bucket "${R2_BUCKET}" reachable` };
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
    'Content-Type': mimeType,
    'Content-Length': buffer.length.toString(),
  };

  // Attach custom metadata as CF-specific headers if provided
  if (metadata) {
    for (const [k, v] of Object.entries(metadata)) {
      headers[`CF-Object-Metadata-${k}`] = v;
    }
  }

  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: buffer,
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
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { ok: false, key, error: `R2 delete failed (HTTP ${res.status}): ${text}` };
  }

  return { ok: true, key };
}
