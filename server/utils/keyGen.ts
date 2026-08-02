// ─── Object Key Generator — DB-001C-1 ────────────────────────────────────────
//
// Generates structured, collision-free R2 object keys.
// Format: {category}/{YYYY}/{MM}/{uuid}-{sanitized-filename}
// Example: livestock/2026/07/a1b2c3d4-foto-sapi-001.jpg
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
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')  // replace non-safe chars with dash
    .replace(/-+/g, '-')             // collapse consecutive dashes
    .replace(/^-|-$/g, '')           // trim leading/trailing dashes
    .slice(0, 80);                   // max 80 chars
}

/**
 * Generates a structured R2 object key.
 *
 * @param category - MediaCategory label (e.g. "livestock", "marketplace")
 * @param originalFilename - Original file name from the upload
 * @param mimeType - MIME type used to derive extension if missing
 */
export function generateUploadKey(
  category: string,
  originalFilename: string,
  mimeType: string,
): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');

  const uuid = crypto.randomUUID();

  // Preserve original extension; fall back to MIME-derived extension
  const origExt = path.extname(originalFilename).toLowerCase();
  const ext = origExt || (EXTENSION_MAP[mimeType] ?? '.bin');

  const baseName = sanitizeFilename(path.basename(originalFilename, origExt)) || 'image';
  const fileName = `${uuid}-${baseName}${ext}`;

  return `${category}/${yyyy}/${mm}/${fileName}`;
}
