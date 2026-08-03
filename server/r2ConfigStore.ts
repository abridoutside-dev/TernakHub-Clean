// ─── R2 Config Store — ADMIN-PLATFORM-003B ────────────────────────────────────
//
// Single in-memory store for the live Cloudflare R2 configuration.
// Initialises from environment variables on startup; hot-reloads from the
// admin API without requiring a server restart.
//
// All server code that needs R2 credentials MUST call the getters below
// instead of reading process.env directly — that ensures admin-saved config
// takes effect immediately after a Save without a restart.
//
// SECURITY: This module is server-side only. Never import it from src/.
// ─────────────────────────────────────────────────────────────────────────────

export interface R2LiveConfig {
  // Identity
  accountId:     string;
  bucket:        string;
  endpoint:      string;
  region:        string;
  publicUrl:     string;
  customDomain:  string;
  // Credentials (plaintext, in-memory only — never serialised to responses)
  accessKeyId:    string;
  secretAccessKey: string;
  // Upload policy
  enableStorage:      boolean;
  maxUploadSizeMb:    number;
  allowedMimeTypes:   string[];
  maxResolutionPx:    number;
  autoCompression:    boolean;
  compressionQuality: number;
  convertToWebP:      boolean;
  preserveExif:       boolean;
  // Delivery
  cdnCacheTtlSec:     number;
  signedUrl:          boolean;
  isPublicBucket:     boolean;
  defaultImageQuality: number;
}

const DEFAULT_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Returns the initial config bootstrapped from environment variables. */
function fromEnv(): R2LiveConfig {
  return {
    accountId:      process.env.CLOUDFLARE_R2_ACCOUNT_ID  ?? '',
    bucket:         process.env.CLOUDFLARE_R2_BUCKET_NAME ?? 'ternakhub-images',
    endpoint:       '',
    region:         'auto',
    publicUrl:      (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? '').replace(/\/$/, ''),
    customDomain:   '',
    // Legacy API-token auth — accessKeyId/secretAccessKey are for S3-compatible API.
    // The env-bootstrap uses the CF REST token approach; credentials come from admin save.
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID     ?? '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? '',
    enableStorage:      true,
    maxUploadSizeMb:    10,
    allowedMimeTypes:   DEFAULT_ALLOWED_MIME,
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
}

// ─── Mutable singleton ────────────────────────────────────────────────────────

let _cfg: R2LiveConfig = fromEnv();

// Also keep the legacy CF API token in memory (not part of R2LiveConfig because
// it belongs to the original CF REST API approach).
let _cfApiToken: string = process.env.CLOUDFLARE_R2_API_TOKEN ?? '';

// ─── Getters ──────────────────────────────────────────────────────────────────

export function getR2Config(): Readonly<R2LiveConfig> { return _cfg; }
export function getCfApiToken(): string              { return _cfApiToken; }

// ─── Updater (called by admin save API) ──────────────────────────────────────

export interface R2ConfigUpdate extends Partial<R2LiveConfig> {
  /** Decrypted CF API token — if present, replaces the in-memory value. */
  cfApiToken?: string;
}

export function updateR2Config(patch: R2ConfigUpdate): void {
  const { cfApiToken, ...rest } = patch;
  _cfg = { ..._cfg, ...rest };
  if (cfApiToken !== undefined) _cfApiToken = cfApiToken;
}

/** Reset to env-var defaults (useful in tests). */
export function resetR2Config(): void {
  _cfg = fromEnv();
  _cfApiToken = process.env.CLOUDFLARE_R2_API_TOKEN ?? '';
}
