// ─── Server-Side Storage Config Repository — ADMIN-PLATFORM-003B ─────────────
//
// Reads and writes the storage service configuration from/to platform_config.
// Sensitive credential fields (accessKeyId, secretAccessKey, cfApiToken) are
// stored encrypted using AES-256-GCM; only ciphertext reaches the database.
//
// DB key: 'service.storage'
// ─────────────────────────────────────────────────────────────────────────────

import {
  encryptCredential,
  decryptCredential,
  isCredentialMasked,
  CREDENTIAL_MASKED,
} from '../utils/encryption.js';
import { updateR2Config, type R2ConfigUpdate, getR2Config } from '../r2ConfigStore.js';

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL      ?? process.env.SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
const STORAGE_KEY       = 'service.storage';

// ─── Types ────────────────────────────────────────────────────────────────────

/** The full storage config shape persisted to platform_config (JSONB). */
export interface StorageConfigRow {
  // Identity
  accountId:     string;
  bucket:        string;
  endpoint:      string;
  region:        string;
  publicUrl:     string;
  customDomain:  string;
  // Credentials — stored encrypted, suffixed _enc
  accessKeyId_enc:     string;
  secretAccessKey_enc: string;
  cfApiToken_enc:      string;
  // Upload policy
  enableStorage:       boolean;
  maxUploadSizeMb:     number;
  allowedMimeTypes:    string[];
  maxResolutionPx:     number;
  autoCompression:     boolean;
  compressionQuality:  number;
  convertToWebP:       boolean;
  preserveExif:        boolean;
  // Delivery
  cdnCacheTtlSec:      number;
  signedUrl:           boolean;
  isPublicBucket:      boolean;
  defaultImageQuality: number;
}

/** Shape returned to the browser — credential fields are masked. */
export interface StorageConfigPublic extends Omit<StorageConfigRow,
  'accessKeyId_enc' | 'secretAccessKey_enc' | 'cfApiToken_enc'> {
  accessKeyId:     string; // masked
  secretAccessKey: string; // masked
  cfApiToken:      string; // masked
}

/** Shape accepted from the browser on save. */
export interface StorageConfigInput {
  accountId:     string;
  bucket:        string;
  endpoint:      string;
  region:        string;
  publicUrl:     string;
  customDomain:  string;
  // Credential values: pass plaintext to update, or CREDENTIAL_MASKED to keep existing
  accessKeyId:     string;
  secretAccessKey: string;
  cfApiToken:      string;
  // Upload policy
  enableStorage:       boolean;
  maxUploadSizeMb:     number;
  allowedMimeTypes:    string[];
  maxResolutionPx:     number;
  autoCompression:     boolean;
  compressionQuality:  number;
  convertToWebP:       boolean;
  preserveExif:        boolean;
  // Delivery
  cdnCacheTtlSec:      number;
  signedUrl:           boolean;
  isPublicBucket:      boolean;
  defaultImageQuality: number;
}

// ─── Supabase REST helpers ────────────────────────────────────────────────────

async function supabaseGet(jwt: string): Promise<StorageConfigRow | null> {
  const url = `${SUPABASE_URL}/rest/v1/platform_config?key=eq.${encodeURIComponent(STORAGE_KEY)}&select=value`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey:        SUPABASE_ANON_KEY,
      Accept:        'application/json',
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Gagal membaca konfigurasi storage: HTTP ${res.status} — ${msg}`);
  }
  const rows = await res.json() as Array<{ value: StorageConfigRow }>;
  return rows.length > 0 ? rows[0].value : null;
}

async function supabaseUpsert(value: StorageConfigRow, jwt: string): Promise<void> {
  const url  = `${SUPABASE_URL}/rest/v1/platform_config`;
  const body = JSON.stringify({
    key:         STORAGE_KEY,
    value,
    description: 'Cloudflare R2 object storage configuration',
    is_public:   false,
    updated_at:  new Date().toISOString(),
  });
  const res = await fetch(url, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${jwt}`,
      apikey:         SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      Prefer:         'resolution=merge-duplicates',
    },
    body,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Gagal menyimpan konfigurasi storage: HTTP ${res.status} — ${msg}`);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load the current storage config from DB.
 * Returns masked credential values — never plaintext.
 */
export async function loadStorageConfig(jwt: string): Promise<StorageConfigPublic | null> {
  const row = await supabaseGet(jwt);
  if (!row) return null;
  return {
    accountId:          row.accountId    ?? '',
    bucket:             row.bucket       ?? '',
    endpoint:           row.endpoint     ?? '',
    region:             row.region       ?? 'auto',
    publicUrl:          row.publicUrl    ?? '',
    customDomain:       row.customDomain ?? '',
    accessKeyId:     row.accessKeyId_enc     ? CREDENTIAL_MASKED : '',
    secretAccessKey: row.secretAccessKey_enc ? CREDENTIAL_MASKED : '',
    cfApiToken:      row.cfApiToken_enc      ? CREDENTIAL_MASKED : '',
    enableStorage:       row.enableStorage      ?? true,
    maxUploadSizeMb:     row.maxUploadSizeMb    ?? 10,
    allowedMimeTypes:    row.allowedMimeTypes    ?? ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxResolutionPx:     row.maxResolutionPx     ?? 1920,
    autoCompression:     row.autoCompression     ?? true,
    compressionQuality:  row.compressionQuality  ?? 80,
    convertToWebP:       row.convertToWebP       ?? false,
    preserveExif:        row.preserveExif        ?? false,
    cdnCacheTtlSec:      row.cdnCacheTtlSec      ?? 86400,
    signedUrl:           row.signedUrl           ?? false,
    isPublicBucket:      row.isPublicBucket      ?? true,
    defaultImageQuality: row.defaultImageQuality ?? 80,
  };
}

/**
 * Save storage config to DB, encrypt credentials, and hot-reload in-memory store.
 */
export async function saveStorageConfig(input: StorageConfigInput, jwt: string): Promise<void> {
  // Load existing row to keep credentials that weren't replaced
  const existing = await supabaseGet(jwt);

  const resolveEnc = (incoming: string, existingEnc: string): string => {
    if (isCredentialMasked(incoming)) return existingEnc ?? '';
    return incoming ? encryptCredential(incoming) : '';
  };

  const row: StorageConfigRow = {
    accountId:    input.accountId.trim(),
    bucket:       input.bucket.trim(),
    endpoint:     input.endpoint.trim(),
    region:       input.region.trim() || 'auto',
    publicUrl:    input.publicUrl.trim().replace(/\/$/, ''),
    customDomain: input.customDomain.trim().replace(/\/$/, ''),
    accessKeyId_enc:     resolveEnc(input.accessKeyId,     existing?.accessKeyId_enc     ?? ''),
    secretAccessKey_enc: resolveEnc(input.secretAccessKey, existing?.secretAccessKey_enc ?? ''),
    cfApiToken_enc:      resolveEnc(input.cfApiToken,      existing?.cfApiToken_enc      ?? ''),
    enableStorage:       input.enableStorage,
    maxUploadSizeMb:     Math.max(1, Math.min(100, Number(input.maxUploadSizeMb) || 10)),
    allowedMimeTypes:    Array.isArray(input.allowedMimeTypes) && input.allowedMimeTypes.length
      ? input.allowedMimeTypes
      : ['image/jpeg', 'image/png', 'image/webp'],
    maxResolutionPx:     Math.max(100, Math.min(8192, Number(input.maxResolutionPx) || 1920)),
    autoCompression:     input.autoCompression,
    compressionQuality:  Math.max(10, Math.min(100, Number(input.compressionQuality) || 80)),
    convertToWebP:       input.convertToWebP,
    preserveExif:        input.preserveExif,
    cdnCacheTtlSec:      Math.max(60, Number(input.cdnCacheTtlSec) || 86400),
    signedUrl:           input.signedUrl,
    isPublicBucket:      input.isPublicBucket,
    defaultImageQuality: Math.max(10, Math.min(100, Number(input.defaultImageQuality) || 80)),
  };

  await supabaseUpsert(row, jwt);

  // Hot-reload the in-memory R2 config store so uploads use the new settings immediately
  const patch: R2ConfigUpdate = {
    accountId:           row.accountId,
    bucket:              row.bucket,
    endpoint:            row.endpoint,
    region:              row.region,
    publicUrl:           row.publicUrl,
    customDomain:        row.customDomain,
    enableStorage:       row.enableStorage,
    maxUploadSizeMb:     row.maxUploadSizeMb,
    allowedMimeTypes:    row.allowedMimeTypes,
    maxResolutionPx:     row.maxResolutionPx,
    autoCompression:     row.autoCompression,
    compressionQuality:  row.compressionQuality,
    convertToWebP:       row.convertToWebP,
    preserveExif:        row.preserveExif,
    cdnCacheTtlSec:      row.cdnCacheTtlSec,
    signedUrl:           row.signedUrl,
    isPublicBucket:      row.isPublicBucket,
    defaultImageQuality: row.defaultImageQuality,
  };

  // Decrypt credentials into memory only if they were updated
  if (!isCredentialMasked(input.accessKeyId) && input.accessKeyId) {
    patch.accessKeyId = input.accessKeyId;
  } else if (row.accessKeyId_enc) {
    try { patch.accessKeyId = decryptCredential(row.accessKeyId_enc); } catch { /* keep existing */ }
  }

  if (!isCredentialMasked(input.secretAccessKey) && input.secretAccessKey) {
    patch.secretAccessKey = input.secretAccessKey;
  } else if (row.secretAccessKey_enc) {
    try { patch.secretAccessKey = decryptCredential(row.secretAccessKey_enc); } catch { /* keep existing */ }
  }

  if (!isCredentialMasked(input.cfApiToken) && input.cfApiToken) {
    patch.cfApiToken = input.cfApiToken;
  } else if (row.cfApiToken_enc) {
    try { patch.cfApiToken = decryptCredential(row.cfApiToken_enc); } catch { /* keep existing */ }
  }

  updateR2Config(patch);
}

/**
 * Reload the in-memory config store from the DB.
 * Called on server startup after the DB is reachable.
 */
export async function reloadR2ConfigFromDb(jwt: string): Promise<void> {
  const row = await supabaseGet(jwt);
  if (!row) return;

  const patch: R2ConfigUpdate = {
    accountId:           row.accountId    ?? getR2Config().accountId,
    bucket:              row.bucket       ?? getR2Config().bucket,
    endpoint:            row.endpoint     ?? '',
    region:              row.region       ?? 'auto',
    publicUrl:           row.publicUrl    ?? getR2Config().publicUrl,
    customDomain:        row.customDomain ?? '',
    enableStorage:       row.enableStorage      ?? true,
    maxUploadSizeMb:     row.maxUploadSizeMb    ?? 10,
    allowedMimeTypes:    row.allowedMimeTypes    ?? ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxResolutionPx:     row.maxResolutionPx     ?? 1920,
    autoCompression:     row.autoCompression     ?? true,
    compressionQuality:  row.compressionQuality  ?? 80,
    convertToWebP:       row.convertToWebP       ?? false,
    preserveExif:        row.preserveExif        ?? false,
    cdnCacheTtlSec:      row.cdnCacheTtlSec      ?? 86400,
    signedUrl:           row.signedUrl           ?? false,
    isPublicBucket:      row.isPublicBucket      ?? true,
    defaultImageQuality: row.defaultImageQuality ?? 80,
  };

  if (row.accessKeyId_enc) {
    try { patch.accessKeyId = decryptCredential(row.accessKeyId_enc); } catch { /* use env */ }
  }
  if (row.secretAccessKey_enc) {
    try { patch.secretAccessKey = decryptCredential(row.secretAccessKey_enc); } catch { /* use env */ }
  }
  if (row.cfApiToken_enc) {
    try { patch.cfApiToken = decryptCredential(row.cfApiToken_enc); } catch { /* use env */ }
  }

  updateR2Config(patch);
}
