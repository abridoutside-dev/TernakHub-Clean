// ─── Upload Policy — DB-001C-1 ────────────────────────────────────────────────
//
// Single source of truth for all upload constraints.
// All validation (multer, route handler, category checks) MUST use this
// module — never hardcode limits or MIME lists inline.
// ─────────────────────────────────────────────────────────────────────────────

/** MIME types accepted by the upload endpoint. */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** Maximum raw upload size before server-side compression (bytes). */
export const MAX_RAW_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Allowed upload category values.
 * Each value maps directly to the R2 path prefix segment.
 */
export const ALLOWED_CATEGORIES = [
  'livestock',
  'marketplace',
  'health',
  'feed',
  'document',
  'profile',
  'workspace',
  'evidence',
  'general',
] as const;

export type UploadCategory = (typeof ALLOWED_CATEGORIES)[number];

/** Default category when the caller omits the field. */
export const DEFAULT_CATEGORY: UploadCategory = 'livestock';

/** Human-readable MIME label for error messages. */
export const ALLOWED_MIME_LABEL = 'JPEG, PNG, WebP, atau GIF';

/** Returns true when the MIME type is on the allow-list. */
export function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

/** Returns true when the category string is on the allow-list. */
export function isAllowedCategory(cat: string): cat is UploadCategory {
  return (ALLOWED_CATEGORIES as readonly string[]).includes(cat);
}
