// ─── Image Storage Service — FOUNDATION-STORAGE-003/004/004A/005 ─────────────
//
// Browser-side abstraction for image uploads to Cloudflare R2.
// Migrated from Express proxy to browser pipeline + Supabase Edge Function.
//
// PIPELINE:
//   1. imagePipeline.process()           — validate, resize, compress, strip EXIF (browser)
//   2. imagePipeline.generateObjectKey() — structured workspace/entity/date/uuid key
//   3. invoke r2-storage Edge Function (presign-upload) — get signed PUT URL
//   4. finalizeUpload()                  — PUT to R2, insert Supabase metadata, relations
//
// PUBLIC API: unchanged — all callers outside this file need zero modifications.
//
// USAGE:
//   const result = await ImageStorageService.uploadImage(file, {
//     category: 'livestock',
//     ownerWorkspaceUuid: workspace.uuid,
//     uploadedBy: user.id,
//   });
//   if (result.success) {
//     const { original_url, thumbnail_url, media_uuid } = result;
//   }
//
// NO BASE64:
//   This service never stores or returns Base64 strings.
//   For preview before upload, use URL.createObjectURL(file) in the caller —
//   that blob URL lives only in memory and is revoked after use.
// ─────────────────────────────────────────────────────────────────────────────

import type { MediaCategory } from '../types/media';
import type { MediaType } from './imagePipeline';
import { supabase } from '@/lib/supabase';
import {
  process as pipelineProcess,
  generateObjectKey,
  generateThumbnailKey,
  PipelineError,
  type PipelineResult,
} from './imagePipeline';
import {
  repoInsertMedia,
  repoInsertLivestockPhoto,
  repoGetMediaByUuid,
} from '../repositories/mediaRepository';
import type { MediaRepoRecord } from '../repositories/mediaRepository';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadImageOptions {
  category: MediaCategory;
  ownerWorkspaceUuid: string;
  uploadedBy: string;
  filename?: string;
  altText?: string;
  tags?: string[];
  /** Livestock UUID; when present a livestock_photos row is inserted. */
  livestockId?: string;
  /** Mark the inserted livestock photo as the primary/cover photo. */
  isCover?: boolean;
  /** Display order in the livestock gallery. */
  displayOrder?: number;
  /** Caption/reason persisted on the livestock photo relation. */
  caption?: string | null;
  /** Achievement date persisted as taken_at. */
  takenAt?: string | null;
  /**
   * Media type — becomes the mandatory media_type segment of the R2 object key.
   * Defaults to 'gallery'. Use 'avatar' for profile/workspace avatars,
   * 'cover' for cover images, 'thumbnail' is reserved for generated thumbnails.
   */
  mediaType?: MediaType;
  /**
   * Entity type within the category (e.g. "sheep", "listing", "profile").
   * Used as the entity_type segment of the R2 object key.
   */
  entityType?: string;
  /**
   * UUID of the specific entity this image belongs to.
   * Used as the entity_uuid segment of the R2 object key.
   */
  entityUuid?: string;
  /**
   * Optional AbortSignal to cancel the upload mid-flight.
   * When aborted: the in-progress fetch is cancelled, state is cleaned up,
   * and no metadata is persisted to Supabase.
   */
  signal?: AbortSignal;
}

export interface UploadImageResult {
  success: true;
  /** Compressed original R2 URL (max 1920px). Use for full-size view. */
  original_url: string;
  /** Thumbnail R2 URL (max 400px). Use for grids, strips, list cards. */
  thumbnail_url: string;
  /** R2 object key for the original */
  key: string;
  /** R2 object key for the thumbnail */
  thumbnail_key: string;
  /** Compressed file size in bytes */
  file_size: number;
  /** Raw input file size (before compression) */
  original_file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  thumb_width: number | null;
  thumb_height: number | null;
  /** media_uuid assigned by Supabase. Null when the DB insert failed (object is orphaned in R2). */
  media_uuid: string | null;
}

export interface UploadImageError {
  success: false;
  error: string;
}

export type UploadImageOutcome = UploadImageResult | UploadImageError;

// ─── Internal logger ──────────────────────────────────────────────────────────
//
// All log output goes through storageLog(). Never use console.log directly.
// In production builds the ring buffer is queryable via getStorageDiagnosticLog()
// but nothing is printed to the console.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StorageLogEntry {
  ts:    string;
  level: LogLevel;
  msg:   string;
  data?: unknown;
}

const _logRing: StorageLogEntry[] = [];
const LOG_RING_CAPACITY = 200;

function storageLog(level: LogLevel, msg: string, data?: unknown): void {
  const entry: StorageLogEntry = { ts: new Date().toISOString(), level, msg, data };
  _logRing.push(entry);
  if (_logRing.length > LOG_RING_CAPACITY) _logRing.shift();

  // Only surface logs in development; never pollute production console.
  if (import.meta.env.DEV) {
    const fn = level === 'error' ? console.error
             : level === 'warn'  ? console.warn
             : console.info;
    fn(`[storage] ${msg}`, data ?? '');
  }
}

/**
 * Returns a snapshot of the last ≤200 storage log entries.
 * Useful for diagnostics panels and support tooling.
 */
export function getStorageDiagnosticLog(): Readonly<StorageLogEntry[]> {
  return _logRing;
}

// ─── Orphan log ───────────────────────────────────────────────────────────────
//
// When a file is written to R2 but the Supabase metadata insert fails, the
// object becomes an orphan: it exists in the bucket without a DB record.
// We record orphans here for a future reconciliation pass.
//
// POLICY: we NEVER delete an orphan immediately — that could silently destroy
// data on a transient DB error. Reconciliation (FOUNDATION-STORAGE-006) will
// compare R2 bucket contents against the media table and re-insert or clean up
// as appropriate.

export interface OrphanEntry {
  /** ISO timestamp when the orphan was detected */
  ts:           string;
  /** R2 object key for the uploaded original */
  objectKey:    string;
  /** R2 object key for the uploaded thumbnail (if the thumb PUT succeeded) */
  thumbnailKey: string | null;
  /** Human-readable reason why metadata insert failed */
  reason:       string;
}

const _orphanLog: OrphanEntry[] = [];

function recordOrphan(entry: Omit<OrphanEntry, 'ts'>): void {
  const full: OrphanEntry = { ts: new Date().toISOString(), ...entry };
  _orphanLog.push(full);
  storageLog('warn', `[orphan] ${entry.objectKey} — ${entry.reason}`, full);
}

/**
 * Returns pending R2 orphans (files uploaded to R2 without a Supabase record).
 * Expose to admin tooling; pass to reconciliation when implemented.
 */
export function getPendingOrphans(): Readonly<OrphanEntry[]> {
  return _orphanLog;
}

// ─── Utility: withTimeout ─────────────────────────────────────────────────────

/**
 * Race a promise against a wall-clock timeout.
 * Rejects with a descriptive Error when the deadline is exceeded.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Timeout (${ms}ms): ${label}`)),
      ms,
    );
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

// ─── Utility: withRetry ───────────────────────────────────────────────────────
//
// Retry policy: only use for operations that are safe to replay (idempotent).
// - presign-upload Edge Function call: safe (returns a new URL each time)
// - PUT to R2 with a presigned URL:    safe (last-writer-wins, same key)
//
// NEVER retry:
// - Supabase metadata inserts (repoInsertMedia): could create duplicate rows
// - Livestock photo relation inserts:            same reason

interface RetryOptions {
  maxAttempts: number;
  label:       string;
  signal?:     AbortSignal;
  /** Base delay in ms before the first retry; doubles on each subsequent attempt. */
  baseDelayMs?: number;
}

async function withRetry<T>(
  fn:      () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { maxAttempts, label, signal, baseDelayMs = 400 } = options;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) throw new Error('Upload dibatalkan');

    try {
      return await fn();
    } catch (err) {
      if (signal?.aborted) throw new Error('Upload dibatalkan');

      // Do not retry on AbortError (user-initiated cancellation).
      if (err instanceof Error && err.name === 'AbortError') throw err;

      lastErr = err;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * attempt;
        storageLog('warn', `${label}: attempt ${attempt}/${maxAttempts} gagal, retry dalam ${delay}ms`, err);
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastErr;
}

// ─── Utility: checkAborted ────────────────────────────────────────────────────

function checkAborted(signal: AbortSignal | undefined, label: string): void {
  if (signal?.aborted) {
    throw new Error(`Upload dibatalkan sebelum ${label}`);
  }
}

// ─── Duplicate-submit guard ───────────────────────────────────────────────────
//
// Prevents the same File object from being enqueued into two concurrent upload
// calls. This guards against rapid double-clicks on upload buttons.
//
// WeakSet: does not prevent GC; entries are automatically collected when the
// File object is no longer referenced anywhere else.

const _inFlight = new WeakSet<File>();

// ─── Timeouts (ms) ───────────────────────────────────────────────────────────

const TIMEOUT_PRESIGN_MS    =  15_000;  // Edge Function call for a presigned URL
const TIMEOUT_R2_PUT_MS     = 120_000;  // PUT upload to R2 (generous for large files)
const TIMEOUT_R2_THUMB_MS   =  60_000;  // PUT thumbnail (smaller, shorter window)
const TIMEOUT_DB_INSERT_MS  =  15_000;  // Supabase metadata insert

// ─── Edge Function invocation ─────────────────────────────────────────────────

interface EdgePresignResponse {
  ok:         boolean;
  uploadUrl?: string;
  publicUrl?: string;
  expiresAt?: string;
  error?:     string;
}

/**
 * Requests a presigned PUT URL from the r2-storage Edge Function.
 * The Supabase client automatically attaches the session JWT.
 *
 * Retried up to 3 times (safe: each call returns a fresh URL).
 * Timeout: 15s per attempt.
 */
async function requestPresignedUpload(
  objectKey:   string,
  contentType: string,
  signal?:     AbortSignal,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  return withRetry(
    () => withTimeout(
      (async () => {
        const { data, error } = await supabase.functions.invoke<EdgePresignResponse>(
          'r2-storage',
          { body: { action: 'presign-upload', objectKey, contentType }, signal },
        );
        if (error) throw new Error(`Edge Function error: ${error.message}`);
        if (!data?.ok || !data.uploadUrl) {
          throw new Error(data?.error ?? 'Presign gagal: respons tidak valid');
        }
        return { uploadUrl: data.uploadUrl, publicUrl: data.publicUrl ?? '' };
      })(),
      TIMEOUT_PRESIGN_MS,
      `presign-upload ${objectKey}`,
    ),
    { maxAttempts: 3, label: `presign-upload ${objectKey}`, signal },
  );
}

/**
 * PUT a Blob directly to Cloudflare R2 using a presigned URL.
 * No credentials are needed in the browser — the signature is embedded in the URL.
 *
 * Retried up to 2 times (safe: R2 PUT is idempotent for the same key).
 * Timeout: configurable per call site.
 * Respects AbortSignal for user-initiated cancellation.
 */
async function putToR2(
  uploadUrl:   string,
  blob:        Blob,
  contentType: string,
  options?:    { signal?: AbortSignal; timeoutMs?: number; label?: string },
): Promise<void> {
  const { signal, timeoutMs = TIMEOUT_R2_PUT_MS, label = 'R2 PUT' } = options ?? {};

  return withRetry(
    () => withTimeout(
      fetch(uploadUrl, {
        method:  'PUT',
        headers: { 'Content-Type': contentType },
        body:    blob,
        signal,
      }).then(async (res) => {
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(
            `R2 upload gagal: HTTP ${res.status}${body ? ` — ${body.slice(0, 120)}` : ''}`,
          );
        }
      }),
      timeoutMs,
      label,
    ),
    { maxAttempts: 2, label, signal },
  );
}

// ─── finalizeUpload ───────────────────────────────────────────────────────────
//
// Single coordination point for all post-pipeline steps:
//   PUT original to R2
//   → PUT thumbnail to R2 (non-fatal)
//   → Insert Supabase media metadata (orphan-safe)
//   → Insert livestock_photos relation (non-fatal)
//
// ROLLBACK POLICY: all rollback and orphan-recording logic lives exclusively
// in this function. No other function in this file performs rollback.
//
// PROGRESS STATE: the caller (uploadImage) wraps this in try/finally so the
// in-flight guard is always released — even if finalizeUpload throws.

interface FinalizeAssets {
  objectKey:    string;
  thumbnailKey: string;
  original:  { blob: Blob; mimeType: string; uploadUrl: string; publicUrl: string };
  thumbnail: { blob: Blob; mimeType: string; uploadUrl: string; publicUrl: string } | null;
}

interface FinalizeInput {
  assets:   FinalizeAssets;
  options:  UploadImageOptions;
  filename: string;
  pipeline: PipelineResult;
}

async function finalizeUpload(input: FinalizeInput): Promise<UploadImageOutcome> {
  const { assets, options, filename, pipeline } = input;
  const signal = options.signal;

  // ── checkpoint: cancellation before first network call ───────────────────
  checkAborted(signal, 'PUT original');

  // ── 1. PUT original to R2 ─────────────────────────────────────────────────
  // Fatal: if this fails, nothing else runs and no metadata is written.
  try {
    await putToR2(
      assets.original.uploadUrl,
      assets.original.blob,
      assets.original.mimeType,
      { signal, timeoutMs: TIMEOUT_R2_PUT_MS, label: `PUT original ${assets.objectKey}` },
    );
    storageLog('info', `PUT original OK: ${assets.objectKey}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'PUT original gagal';
    storageLog('error', `PUT original GAGAL: ${assets.objectKey}`, err);
    return { success: false, error: msg };
  }

  // ── checkpoint: cancellation after original PUT, before thumbnail ─────────
  if (signal?.aborted) {
    // Original is in R2, but since metadata has NOT been inserted yet, the
    // object will be picked up by reconciliation as an orphan. Record it.
    recordOrphan({
      objectKey:    assets.objectKey,
      thumbnailKey: null,
      reason:       'Upload dibatalkan setelah PUT original, sebelum thumbnail',
    });
    return { success: false, error: 'Upload dibatalkan' };
  }

  // ── 2. PUT thumbnail to R2 (non-fatal) ────────────────────────────────────
  let thumbPublicUrl = assets.original.publicUrl;
  let thumbUploaded  = false;

  if (assets.thumbnail) {
    try {
      await putToR2(
        assets.thumbnail.uploadUrl,
        assets.thumbnail.blob,
        assets.thumbnail.mimeType,
        { signal, timeoutMs: TIMEOUT_R2_THUMB_MS, label: `PUT thumbnail ${assets.thumbnailKey}` },
      );
      thumbPublicUrl = assets.thumbnail.publicUrl || assets.original.publicUrl;
      thumbUploaded  = true;
      storageLog('info', `PUT thumbnail OK: ${assets.thumbnailKey}`);
    } catch (err) {
      // Thumbnail failure is non-fatal; the original is already in R2.
      // Fall back to original URL as the thumbnail URL.
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('dibatalkan'))) {
        // On cancellation after thumbnail failure, record orphan and exit.
        recordOrphan({
          objectKey:    assets.objectKey,
          thumbnailKey: null,
          reason:       'Upload dibatalkan saat PUT thumbnail',
        });
        return { success: false, error: 'Upload dibatalkan' };
      }
      storageLog('warn', `PUT thumbnail GAGAL (non-fatal): ${assets.thumbnailKey}`, err);
    }
  }

  // ── checkpoint: cancellation before DB insert ─────────────────────────────
  if (signal?.aborted) {
    recordOrphan({
      objectKey:    assets.objectKey,
      thumbnailKey: thumbUploaded ? assets.thumbnailKey : null,
      reason:       'Upload dibatalkan setelah PUT ke R2, sebelum insert metadata',
    });
    return { success: false, error: 'Upload dibatalkan' };
  }

  const originalUrl  = assets.original.publicUrl;
  const thumbnailUrl = thumbPublicUrl;

  // ── 3. Insert media metadata ───────────────────────────────────────────────
  //
  // NOT retried: repoInsertMedia is not idempotent — retrying could create
  // duplicate rows if the first attempt partially committed.
  //
  // On failure: the R2 object is now an orphan. Record it for reconciliation.
  // We do NOT delete the R2 object immediately — that could destroy data on
  // a transient DB error.
  let media_uuid: string | null = null;

  try {
    media_uuid = await withTimeout(
      repoInsertMedia({
        category:         options.category,
        originalFilename: filename,
        mimeType:         pipeline.original.mimeType,
        fileSizeBytes:    pipeline.original.fileSizeBytes,
        width:            pipeline.original.width,
        height:           pipeline.original.height,
        storageUrl:       originalUrl,
        thumbnailUrl,
        objectKey:        assets.objectKey,
        thumbnailKey:     assets.thumbnailKey,
        ownerWorkspaceId: options.ownerWorkspaceUuid,
        uploadedBy:       options.uploadedBy,
        altText:          options.altText  ?? null,
        tags:             options.tags     ?? [],
      }),
      TIMEOUT_DB_INSERT_MS,
      'repoInsertMedia',
    );
    storageLog('info', `Metadata insert OK: media_uuid=${media_uuid}`);
  } catch (metaErr) {
    // Record the orphan — the object is in R2 without a DB record.
    recordOrphan({
      objectKey:    assets.objectKey,
      thumbnailKey: thumbUploaded ? assets.thumbnailKey : null,
      reason:       metaErr instanceof Error ? metaErr.message : 'Insert metadata gagal',
    });
    storageLog('error', 'Metadata insert GAGAL (object orphaned in R2)', metaErr);
    // media_uuid stays null; the upload is still "successful" from the file
    // perspective — the image is accessible in R2.
  }

  // ── 4. Livestock photo relation (non-fatal) ───────────────────────────────
  //
  // NOT retried: not idempotent.
  // Non-fatal: the image is in R2 and (if media_uuid is set) indexed in DB.
  if (options.category === 'livestock' && options.livestockId) {
    try {
      await withTimeout(
        repoInsertLivestockPhoto({
          livestock_uuid: options.livestockId,
          storage_url:    originalUrl,
          thumbnail_url:  thumbnailUrl,
          uploaded_by:    options.uploadedBy,
          is_cover:       options.isCover      ?? false,
          display_order:  options.displayOrder ?? 0,
          caption:        options.caption      ?? null,
          taken_at:       options.takenAt      ?? null,
        }),
        TIMEOUT_DB_INSERT_MS,
        'repoInsertLivestockPhoto',
      );
      storageLog('info', `livestock_photos insert OK: livestock=${options.livestockId}`);
    } catch (relErr) {
      storageLog('warn', `livestock_photos insert GAGAL (non-fatal): livestock=${options.livestockId}`, relErr);
    }
  }

  storageLog('info', `Upload selesai: key=${assets.objectKey}, media_uuid=${media_uuid ?? '(null)'}`);

  return {
    success:            true,
    original_url:       originalUrl,
    thumbnail_url:      thumbnailUrl,
    key:                assets.objectKey,
    thumbnail_key:      assets.thumbnailKey,
    file_size:          pipeline.original.fileSizeBytes,
    original_file_size: pipeline.originalFileSizeBytes,
    mime_type:          pipeline.original.mimeType,
    width:              pipeline.original.width,
    height:             pipeline.original.height,
    thumb_width:        pipeline.thumbnail.width,
    thumb_height:       pipeline.thumbnail.height,
    media_uuid,
  };
}

// ─── Core upload ──────────────────────────────────────────────────────────────

/**
 * Upload an image to Cloudflare R2 via the browser pipeline + Edge Function.
 *
 * Flow:
 *   1. Process image in browser (resize, compress, strip EXIF)
 *   2. Generate structured R2 object keys (workspace/category/entity/date/uuid)
 *   3. Get presigned PUT URLs from r2-storage Edge Function
 *   4. finalizeUpload() — PUT to R2, Supabase metadata, livestock relation
 *
 * Edge cases handled:
 *   - Presign failure:      returns error, no upload attempted
 *   - PUT failure:          returns error, no metadata inserted
 *   - Metadata insert fail: returns success with media_uuid=null, orphan recorded
 *   - Cancellation:         fetch aborted, state cleaned, no metadata stored
 *   - Timeout:              all network calls have per-request deadlines
 *   - Duplicate submit:     same File object rejected if already in-flight
 *   - Progress state:       in-flight guard always released via finally
 */
export async function uploadImage(
  file: File,
  options: UploadImageOptions,
): Promise<UploadImageOutcome> {
  // ── Duplicate-submit guard ─────────────────────────────────────────────────
  if (_inFlight.has(file)) {
    storageLog('warn', 'Duplicate submit ditolak: file sudah dalam proses upload');
    return { success: false, error: 'Upload untuk file ini sudah sedang berjalan' };
  }
  _inFlight.add(file);

  const signal = options.signal;

  // ── Progress state guarantee: always release the in-flight guard ───────────
  try {
    storageLog('info', `uploadImage start: ${file.name} (${file.size} bytes)`);

    // ── 1. Process image ──────────────────────────────────────────────────────
    checkAborted(signal, 'image processing');
    const pipeline = await pipelineProcess(file);
    const filename = options.filename ?? file.name;

    storageLog('debug', 'Pipeline OK', {
      origSize: pipeline.original.fileSizeBytes,
      thumbSize: pipeline.thumbnail.fileSizeBytes,
    });

    // ── 2. Generate object keys ───────────────────────────────────────────────
    const resolvedEntityType = options.entityType
      ?? (options.category === 'livestock' && options.livestockId ? 'livestock' : undefined);
    const resolvedEntityUuid = options.entityUuid
      ?? (options.category === 'livestock' && options.livestockId ? options.livestockId : undefined);

    const objectKey = generateObjectKey({
      workspaceUuid:    options.ownerWorkspaceUuid,
      category:         options.category,
      entityType:       resolvedEntityType,
      entityUuid:       resolvedEntityUuid,
      mediaType:        options.mediaType ?? 'gallery',
      originalFilename: filename,
      ext:              pipeline.original.ext,
    });
    const thumbnailKey = generateThumbnailKey(objectKey);

    storageLog('debug', `Object keys: orig=${objectKey} thumb=${thumbnailKey}`);

    // ── 3. Request presigned upload URLs ──────────────────────────────────────
    checkAborted(signal, 'presign');

    const [origPresign, thumbPresign] = await Promise.allSettled([
      requestPresignedUpload(objectKey,    pipeline.original.mimeType,  signal),
      requestPresignedUpload(thumbnailKey, pipeline.thumbnail.mimeType, signal),
    ]);

    if (origPresign.status === 'rejected') {
      const reason = origPresign.reason instanceof Error
        ? origPresign.reason.message
        : 'Presign gagal';
      storageLog('error', `Presign original GAGAL: ${objectKey}`, origPresign.reason);
      return { success: false, error: reason };
    }

    if (thumbPresign.status === 'rejected') {
      storageLog('warn', `Presign thumbnail GAGAL (non-fatal): ${thumbnailKey}`, thumbPresign.reason);
    }

    const { uploadUrl: origUploadUrl, publicUrl: origPublicUrl } = origPresign.value;
    const thumbOk     = thumbPresign.status === 'fulfilled';
    const thumbUpload = thumbOk ? thumbPresign.value.uploadUrl : '';
    const thumbPublic = thumbOk ? thumbPresign.value.publicUrl : origPublicUrl;

    storageLog('debug', `Presign OK: orig presigned, thumb=${thumbOk ? 'presigned' : 'skipped'}`);

    // ── 4. Finalize ────────────────────────────────────────────────────────────
    return await finalizeUpload({
      assets: {
        objectKey,
        thumbnailKey,
        original:  { blob: pipeline.original.blob,  mimeType: pipeline.original.mimeType,  uploadUrl: origUploadUrl,  publicUrl: origPublicUrl },
        thumbnail: thumbOk
          ? { blob: pipeline.thumbnail.blob, mimeType: pipeline.thumbnail.mimeType, uploadUrl: thumbUpload, publicUrl: thumbPublic }
          : null,
      },
      options,
      filename,
      pipeline,
    });
  } catch (err) {
    // AbortError from fetch or explicit cancellation check
    if (
      err instanceof Error &&
      (err.name === 'AbortError' || err.message.includes('dibatalkan'))
    ) {
      storageLog('info', 'Upload dibatalkan oleh pengguna');
      return { success: false, error: 'Upload dibatalkan' };
    }

    const message = err instanceof PipelineError
      ? err.message
      : err instanceof Error
        ? err.message
        : 'Upload gagal';
    storageLog('error', `uploadImage error: ${message}`, err);
    return { success: false, error: message };
  } finally {
    // Progress state guarantee: always remove the in-flight guard,
    // regardless of how the upload ended (success, error, or exception).
    _inFlight.delete(file);
  }
}

// ─── Specialised helpers ──────────────────────────────────────────────────────

export async function uploadAvatar(
  file: File,
  options: Omit<UploadImageOptions, 'category'> & {
    avatarCategory: 'profile' | 'workspace';
  },
): Promise<UploadImageOutcome> {
  const { avatarCategory, ...rest } = options;
  return uploadImage(file, { ...rest, category: avatarCategory, mediaType: 'avatar' });
}

export async function uploadCover(
  file: File,
  options: UploadImageOptions,
): Promise<UploadImageOutcome> {
  return uploadImage(file, { ...options, mediaType: options.mediaType ?? 'cover' });
}

/**
 * Upload multiple images sequentially.
 * Individual failures do not abort the batch — each entry is an outcome.
 */
export async function uploadGalleryBatch(
  files: File[],
  options: Omit<UploadImageOptions, 'filename' | 'altText'> & { altTexts?: string[] },
): Promise<UploadImageOutcome[]> {
  const results: UploadImageOutcome[] = [];
  for (let i = 0; i < files.length; i++) {
    results.push(await uploadImage(files[i], { ...options, altText: options.altTexts?.[i] }));
  }
  return results;
}

// ─── Health check ─────────────────────────────────────────────────────────────

export interface R2HealthResult {
  status: 'ok' | 'error';
  bucket: string;
  message: string;
}

/**
 * Checks R2 connectivity via the r2-storage Edge Function (test-connection action).
 * Returns a structured result — never throws.
 */
export async function checkR2Health(): Promise<R2HealthResult> {
  try {
    const { data, error } = await supabase.functions.invoke<{
      ok:       boolean;
      status?:  string;
      bucket?:  string;
      message?: string;
      error?:   string;
    }>('r2-storage', { body: { action: 'test-connection' } });

    if (error) {
      return { status: 'error', bucket: 'unknown', message: error.message };
    }

    if (data?.ok) {
      return {
        status:  'ok',
        bucket:  data.bucket  ?? 'unknown',
        message: data.message ?? 'R2 terhubung',
      };
    }

    return {
      status:  'error',
      bucket:  data?.bucket  ?? 'unknown',
      message: data?.error   ?? data?.message ?? 'R2 tidak terhubung',
    };
  } catch (err) {
    return {
      status:  'error',
      bucket:  'unknown',
      message: err instanceof Error ? err.message : 'Tidak dapat menghubungi Edge Function',
    };
  }
}

// ─── Namespace export ─────────────────────────────────────────────────────────

export const ImageStorageService = {
  uploadImage,
  uploadAvatar,
  uploadCover,
  uploadGalleryBatch,
  checkR2Health,
} as const;

export type { MediaCategory, MediaType };

// ─── Media lookup ─────────────────────────────────────────────────────────────

/**
 * Returns the media metadata record for the given UUID, or null if not found.
 * Service-layer wrapper over repoGetMediaByUuid — pages must call this,
 * not the repository directly.
 */
export async function getMediaByUuid(uuid: string): Promise<MediaRepoRecord | null> {
  return repoGetMediaByUuid(uuid);
}

export type { MediaRepoRecord };
