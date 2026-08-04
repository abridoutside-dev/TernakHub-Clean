// ─── Browser Image Pipeline — FOUNDATION-STORAGE-001/004/004A ────────────────
//
// Validates, resizes, compresses, and generates object keys for image uploads.
// All processing runs in the browser via Canvas API — no server round-trip.
//
// EXIF metadata is naturally stripped when an image is drawn to a Canvas.
// Output format: WebP (preferred) → JPEG → error (never falls back to original
// when resizing is needed, as that would bypass compression).
//
// Object key structure (FOUNDATION-STORAGE-004A):
//   {workspaceUuid}/{category}/{entityType}/{entityUuid}/{mediaType}/{YYYY}/{MM}/{uuid}{ext}
//
// Examples:
//   workspace-uuid/livestock/sheep/livestock-uuid/gallery/2026/08/xxxxxxxx.webp
//   workspace-uuid/livestock/sheep/livestock-uuid/avatar/2026/08/xxxxxxxx.webp
//   workspace-uuid/marketplace/listing/listing-uuid/cover/2026/08/xxxxxxxx.webp
//
// USAGE:
//   const config  = getPlatformImageConfig();
//   const result  = await imagePipeline.process(file);
//   const key     = imagePipeline.generateObjectKey({
//     workspaceUuid, category, entityType: 'sheep', entityUuid: id,
//     mediaType: 'gallery', originalFilename: file.name, ext: result.original.ext,
//   });
//   const thumbKey = imagePipeline.generateThumbnailKey(key);
// ─────────────────────────────────────────────────────────────────────────────

import type { MediaCategory } from '../types/media';

// ─── Platform Image Config ────────────────────────────────────────────────────
// All quality/sizing constants live here — never hardcoded anywhere else.

export interface PlatformImageConfig {
  /** Maximum pixel dimension (longest side) for the compressed original. */
  originalMaxPx: number;
  /** Maximum pixel dimension (longest side) for the thumbnail. */
  thumbMaxPx: number;
  /**
   * Canvas quality factor [0–1].
   * Applies to both WebP and JPEG output.
   */
  quality: number;
  /**
   * Preferred output MIME type.
   * Falls back to JPEG then throws if neither is supported by the browser.
   */
  preferredMimeType: 'image/webp' | 'image/jpeg';
  /** Maximum raw file size in bytes accepted before processing. */
  maxRawFileSizeBytes: number;
  /** Accepted input MIME types. */
  allowedMimeTypes: readonly string[];
}

/**
 * Returns the active platform image configuration.
 * Every pipeline step reads from this function — no magic numbers elsewhere.
 */
export function getPlatformImageConfig(): PlatformImageConfig {
  return {
    originalMaxPx:       1920,
    thumbMaxPx:          400,
    quality:             0.80,
    preferredMimeType:   'image/webp',
    maxRawFileSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes:    [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ] as const,
  };
}

// ─── Error ────────────────────────────────────────────────────────────────────

export type PipelineErrorCode = 'VALIDATION' | 'DECODE' | 'RENDER' | 'UNSUPPORTED';

export class PipelineError extends Error {
  constructor(
    message: string,
    public readonly code: PipelineErrorCode,
  ) {
    super(message);
    this.name = 'PipelineError';
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationOk    { valid: true }
export interface ValidationError { valid: false; reason: string }
export type ValidationResult = ValidationOk | ValidationError;

/**
 * Validates MIME type and file size against the platform policy.
 * Call before decoding to fail fast on obviously invalid files.
 */
export function validate(file: File): ValidationResult {
  const config = getPlatformImageConfig();

  if (!(config.allowedMimeTypes as readonly string[]).includes(file.type)) {
    return {
      valid:  false,
      reason: `Tipe file tidak didukung: ${file.type}. Gunakan JPEG, PNG, WebP, atau GIF.`,
    };
  }

  if (file.size > config.maxRawFileSizeBytes) {
    const maxMb = config.maxRawFileSizeBytes / (1024 * 1024);
    return {
      valid:  false,
      reason: `Ukuran file melebihi batas ${maxMb} MB.`,
    };
  }

  return { valid: true };
}

// ─── Object Key — Media Type ──────────────────────────────────────────────────

/**
 * Allowed media_type values for R2 object key paths.
 * media_type is a mandatory segment — it must always be present.
 */
export type MediaType = 'avatar' | 'cover' | 'gallery' | 'thumbnail';

export const ALLOWED_MEDIA_TYPES: readonly MediaType[] = [
  'avatar',
  'cover',
  'gallery',
  'thumbnail',
] as const;

// ─── Object Key Generation ────────────────────────────────────────────────────

/** Strips unsafe path/URL characters from a key segment. */
function sanitizeSegment(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export interface ObjectKeyOptions {
  /** UUID of the owning workspace */
  workspaceUuid: string;
  /** MediaCategory or upload category string (e.g. "livestock", "marketplace") */
  category: MediaCategory | string;
  /**
   * Entity type within the category (e.g. "sheep", "listing", "profile").
   * Use '_' when not applicable.
   */
  entityType?: string;
  /**
   * UUID of the specific entity this image belongs to.
   * Use '_' when not applicable.
   */
  entityUuid?: string;
  /**
   * Purpose of the media within the entity.
   * Defaults to 'gallery'.
   */
  mediaType?: MediaType;
  /** Original filename — used only for extension derivation. */
  originalFilename: string;
  /** Output extension derived from the processed MIME type. */
  ext?: '.webp' | '.jpg';
}

/**
 * Generates a structured, workspace-scoped R2 object key.
 *
 * Fixed 8-segment format (FOUNDATION-STORAGE-004A):
 *   {workspaceUuid}/{category}/{entityType}/{entityUuid}/{mediaType}/{YYYY}/{MM}/{uuid}{ext}
 *
 * Examples:
 *   workspace-uuid/livestock/sheep/livestock-uuid/gallery/2026/08/xxxxxxxx.webp
 *   workspace-uuid/marketplace/listing/listing-uuid/cover/2026/08/xxxxxxxx.webp
 *
 * Segments enable:
 *   - entity-scoped cleanup and lifecycle policies
 *   - date-range audit, backup, and restore operations
 *   - media-type-based access controls and analytics
 */
export function generateObjectKey(opts: ObjectKeyOptions): string {
  const {
    workspaceUuid,
    category,
    entityType  = '_',
    entityUuid  = '_',
    mediaType   = 'gallery',
    originalFilename,
    ext = '.webp',
  } = opts;

  const now  = new Date();
  const yyyy = now.getFullYear().toString();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = crypto.randomUUID();

  const wsSegment         = sanitizeSegment(workspaceUuid)  || '_';
  const categorySegment   = sanitizeSegment(String(category)) || 'general';
  const entityTypeSegment = sanitizeSegment(entityType)     || '_';
  const entityUuidSegment = sanitizeSegment(entityUuid)     || '_';
  const mediaTypeSegment  = sanitizeSegment(mediaType)      || 'gallery';

  return [
    wsSegment,
    categorySegment,
    entityTypeSegment,
    entityUuidSegment,
    mediaTypeSegment,
    yyyy,
    mm,
    `${uuid}${ext}`,
  ].join('/');
}

/**
 * Derives the thumbnail key from an original object key.
 *
 * Replaces the media_type segment (index 4 in the 8-segment key)
 * with 'thumbnail'.
 *
 * Example:
 *   ws/livestock/sheep/uuid/gallery/2026/08/uuid.webp
 *   → ws/livestock/sheep/uuid/thumbnail/2026/08/uuid.webp
 */
export function generateThumbnailKey(originalKey: string): string {
  const parts = originalKey.split('/');
  // media_type is at index 4 in the fixed 8-segment format:
  //   [0]ws / [1]category / [2]entityType / [3]entityUuid / [4]mediaType / [5]YYYY / [6]MM / [7]filename
  if (parts.length === 8) {
    parts[4] = 'thumbnail';
    return parts.join('/');
  }
  // Fallback for any key not matching the 8-segment format:
  // find the first 4-digit year segment and insert 'thumbnail' before it.
  const yearIdx = parts.findIndex(p => /^\d{4}$/.test(p));
  if (yearIdx !== -1) {
    parts.splice(yearIdx, 0, 'thumbnail');
  }
  return parts.join('/');
}

// ─── Sizing ───────────────────────────────────────────────────────────────────

interface Dimensions { width: number; height: number }

function scaledDimensions(srcW: number, srcH: number, maxPx: number): Dimensions {
  if (srcW <= maxPx && srcH <= maxPx) return { width: srcW, height: srcH };
  const ratio = Math.min(maxPx / srcW, maxPx / srcH);
  return { width: Math.round(srcW * ratio), height: Math.round(srcH * ratio) };
}

// ─── Browser Fallback Chain ───────────────────────────────────────────────────
// WebP → JPEG → throw PipelineError (UNSUPPORTED)
// Upload must never fail solely because the browser lacks WebP support.

async function renderToBlob(
  bitmap:        ImageBitmap,
  dims:          Dimensions,
  quality:       number,
  preferredMime: string,
): Promise<{ blob: Blob; mimeType: string; ext: '.webp' | '.jpg' }> {
  const canvas  = document.createElement('canvas');
  canvas.width  = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new PipelineError('Canvas 2D context tidak tersedia di browser ini.', 'UNSUPPORTED');
  // Drawing to canvas strips EXIF metadata.
  ctx.drawImage(bitmap, 0, 0, dims.width, dims.height);

  type MimeEntry = { mime: string; ext: '.webp' | '.jpg' };
  const fallbackChain: MimeEntry[] = preferredMime === 'image/webp'
    ? [{ mime: 'image/webp', ext: '.webp' }, { mime: 'image/jpeg', ext: '.jpg' }]
    : [{ mime: 'image/jpeg', ext: '.jpg' }];

  for (const { mime, ext } of fallbackChain) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mime, quality);
    });
    if (blob && blob.size > 0) return { blob, mimeType: mime, ext };
  }

  throw new PipelineError(
    'Browser tidak mendukung konversi gambar ke WebP atau JPEG. Coba browser lain.',
    'UNSUPPORTED',
  );
}

// ─── Pipeline Result ──────────────────────────────────────────────────────────

export interface ProcessedVariant {
  blob:          Blob;
  mimeType:      string;
  /** File extension matching mimeType — use when generating object keys. */
  ext:           '.webp' | '.jpg';
  width:         number;
  height:        number;
  fileSizeBytes: number;
}

export interface PipelineResult {
  original:              ProcessedVariant;
  thumbnail:             ProcessedVariant;
  /** Raw input file size in bytes (before any processing). */
  originalFileSizeBytes: number;
}

// ─── process() ───────────────────────────────────────────────────────────────

/**
 * Full browser image pipeline:
 *   validate → decode → resize → compress → convert → strip EXIF
 *
 * Produces both the compressed original and a thumbnail in one pass.
 * Throws `PipelineError` on validation or processing failure.
 */
export async function process(file: File): Promise<PipelineResult> {
  const validation = validate(file);
  if (!validation.valid) throw new PipelineError(validation.reason, 'VALIDATION');

  const config = getPlatformImageConfig();

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new PipelineError(
      'Gagal mendekode gambar. Pastikan file adalah gambar yang valid.',
      'DECODE',
    );
  }

  const origDims  = scaledDimensions(bitmap.width, bitmap.height, config.originalMaxPx);
  const thumbDims = scaledDimensions(bitmap.width, bitmap.height, config.thumbMaxPx);

  let origResult: Awaited<ReturnType<typeof renderToBlob>>;
  let thumbResult: Awaited<ReturnType<typeof renderToBlob>>;

  try {
    [origResult, thumbResult] = await Promise.all([
      renderToBlob(bitmap, origDims,  config.quality, config.preferredMimeType),
      renderToBlob(bitmap, thumbDims, config.quality, config.preferredMimeType),
    ]);
  } catch (err) {
    bitmap.close();
    if (err instanceof PipelineError) throw err;
    throw new PipelineError('Gagal memproses gambar di browser.', 'RENDER');
  }

  bitmap.close();

  return {
    original: {
      blob:          origResult.blob,
      mimeType:      origResult.mimeType,
      ext:           origResult.ext,
      width:         origDims.width,
      height:        origDims.height,
      fileSizeBytes: origResult.blob.size,
    },
    thumbnail: {
      blob:          thumbResult.blob,
      mimeType:      thumbResult.mimeType,
      ext:           thumbResult.ext,
      width:         thumbDims.width,
      height:        thumbDims.height,
      fileSizeBytes: thumbResult.blob.size,
    },
    originalFileSizeBytes: file.size,
  };
}

// ─── Namespace export ─────────────────────────────────────────────────────────

export const imagePipeline = {
  getPlatformImageConfig,
  validate,
  generateObjectKey,
  generateThumbnailKey,
  process,
} as const;
