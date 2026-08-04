// ─── Object Key Generator — FOUNDATION-STORAGE-004A ──────────────────────────
//
// Generates structured, collision-free R2 object keys.
//
// Format:
//   {workspace_uuid}/{category}/{entity_type}/{entity_uuid}/{media_type}/{YYYY}/{MM}/{uuid}.{ext}
//
// Examples:
//   workspace-uuid/livestock/sheep/livestock-uuid/gallery/2026/08/xxxxxxxx.webp
//   workspace-uuid/livestock/sheep/livestock-uuid/avatar/2026/08/xxxxxxxx.webp
//   workspace-uuid/marketplace/listing/listing-uuid/cover/2026/08/xxxxxxxx.webp
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'node:crypto';
import path from 'node:path';

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
  'image/gif':  '.gif',
};

/** Strips unsafe path/URL characters from a filename segment. */
function sanitizeSegment(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')  // replace non-safe chars with dash
    .replace(/-+/g, '-')             // collapse consecutive dashes
    .replace(/^-|-$/g, '')           // trim leading/trailing dashes
    .slice(0, 80);                   // max 80 chars
}

/**
 * Generates a structured R2 object key following the TernakHub Constitution.
 *
 * @param workspaceId  - UUID of the owning workspace (use '_' when unknown)
 * @param category     - Top-level domain (e.g. "livestock", "marketplace")
 * @param entityType   - Sub-type within the category (e.g. "sheep", "listing")
 * @param entityUuid   - UUID of the specific entity (e.g. livestock UUID)
 * @param mediaType    - Purpose of the media: "avatar" | "cover" | "gallery" | "thumbnail"
 * @param originalFilename - Original file name from the upload (used for extension)
 * @param mimeType     - MIME type used to derive extension when original has none
 */
export function generateUploadKey(
  workspaceId:      string,
  category:         string,
  entityType:       string,
  entityUuid:       string,
  mediaType:        string,
  originalFilename: string,
  mimeType:         string,
): string {
  const now  = new Date();
  const yyyy = now.getFullYear().toString();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');

  const uuid = crypto.randomUUID();

  // Preserve original extension; fall back to MIME-derived extension
  const origExt = path.extname(originalFilename).toLowerCase();
  const ext     = origExt || (EXTENSION_MAP[mimeType] ?? '.bin');

  const filename = `${uuid}${ext}`;

  // Sanitize variable segments to ensure safe path components
  const wsSegment         = sanitizeSegment(workspaceId)  || '_';
  const categorySegment   = sanitizeSegment(category)     || 'general';
  const entityTypeSegment = sanitizeSegment(entityType)   || '_';
  const entityUuidSegment = sanitizeSegment(entityUuid)   || '_';
  const mediaTypeSegment  = sanitizeSegment(mediaType)    || 'gallery';

  return [
    wsSegment,
    categorySegment,
    entityTypeSegment,
    entityUuidSegment,
    mediaTypeSegment,
    yyyy,
    mm,
    filename,
  ].join('/');
}
