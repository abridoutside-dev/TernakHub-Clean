// ─── Browser Image Pipeline — FOUNDATION-STORAGE-001/004 ─────────────────────
//
// Validates, resizes, compresses, and generates object keys for image uploads.
// All processing runs in the browser via Canvas API — no server round-trip.
//
// EXIF metadata is naturally stripped when an image is drawn to a Canvas.
// Output format: WebP (preferred) → JPEG → error (never falls back to original
// when resizing is needed, as that would bypass compression).
//
// USAGE:
//   const config  = getPlatformImageConfig();
//   const result  = await imagePipeline.process(file);
//   const key     = imagePipeline.generateObjectKey({
//     workspaceUuid, category, entityType: 'livestock', entityUuid: id,
//     originalFilename: file.name, ext: result.original.ext,
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

// ─── Object Key Generation ────────────────────────────────────────────────────

/** Strips unsafe path/URL characters from a filename segment. */
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
  /** MediaCategory or upload category string */
  category: MediaCategory | string;
  /**
   * Entity type sub-segment for audit support.
   * Examples: 'livestock', 'sheep', 'listing', 'profile'.
   * Omit (or pass '') to skip this segment.
   */
  entityType?: string;
  /**
   * UUID of the specific entity this image belongs to.
   * Used for cleanup, lifecycle, and audit queries.
   * Omit (or pass '') to skip this segment.
   */
  entityUuid?: string;
  /** Original filename — extension is stripped and replaced with `ext`. */
  originalFilename: string;
  /** Output extension derived from the processed MIME type. */
  ext?: '.webp' | '.jpg';
}

/**
 * Generates a structured, workspace-scoped R2 object key.
 *
 * Full format (with entity):
 *   {workspaceUuid}/{category}/{entityType}/{entityUuid}/{YYYY}/{MM}/{uuid}{ext}
 *
 * Short format (without entity):
 *   {workspaceUuid}/{category}/{YYYY}/{MM}/{uuid}-{sanitized-name}{ext}
 *
 * The entity segments enable:
 *   - entity-scoped cleanup and lifecycle policies
 *   - date-range audit, backup, and restore operations
 *   - category-based access controls and analytics
 */
export function generateObjectKey(opts: ObjectKeyOptions): string {
  const {
    workspaceUuid,
    category,
    entityType,
    entityUuid,
    originalFilename,
    ext = '.webp',
  } = opts;

  const now  = new Date();
  const yyyy = now.getFullYear().toString();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = crypto.randomUUID();
  const base = sanitizeSegment(originalFilename.replace(/\.[^.]+$/, '')) || 'image';

  const segments: string[] = [workspaceUuid, String(category)];

  const hasEntity = entityType && entityUuid;
  if (hasEntity) {
    segments.push(sanitizeSegment(entityType), entityUuid);
  }

  segments.push(yyyy, mm);

  const filename = hasEntity
    ? `${uuid}${ext}`
    : `${uuid}-${base}${ext}`;

  return [...segments, filename].join('/');
}

/**
 * Derives the thumbnail key from an original object key.
 *
 * Inserts a `thumbs` segment before the date segments (YYYY).
 *
 * Examples:
 *   ws/cat/entityType/entityUuid/2026/08/uuid.webp
 *   → ws/cat/entityType/entityUuid/thumbs/2026/08/uuid.webp
 *
 *   ws/cat/2026/08/uuid-name.webp
 *   → ws/cat/thumbs/2026/08/uuid-name.webp
 */
export function generateThumbnailKey(originalKey: string): string {
  const parts = originalKey.split('/');
  // Find the first 4-digit year segment and insert 'thumbs' before it.
  const yearIdx = parts.findIndex(p => /^\d{4}$/.test(p));
  if (yearIdx !== -1) {
    parts.splice(yearIdx, 0, 'thumbs');
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
