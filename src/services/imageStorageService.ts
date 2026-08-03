// ─── Image Storage Service — FOUNDATION-STORAGE-003/004 ──────────────────────
//
// Browser-side abstraction for image uploads to Cloudflare R2.
// Migrated from Express proxy to browser pipeline + Supabase Edge Function.
//
// NEW PIPELINE:
//   1. imagePipeline.process()         — validate, resize, compress, strip EXIF (browser)
//   2. imagePipeline.generateObjectKey() — structured workspace/entity/date/uuid key
//   3. invoke r2-storage Edge Function (presign-upload) — get signed PUT URL
//   4. finalizeUpload()                — PUT to R2, insert Supabase metadata, relations
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

import type { MediaCategory, MediaType } from '../types/media';
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
  /** media_uuid assigned by Supabase. */
  media_uuid: string | null;
}

export interface UploadImageError {
  success: false;
  error: string;
}

export type UploadImageOutcome = UploadImageResult | UploadImageError;

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
 */
async function requestPresignedUpload(
  objectKey:   string,
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const { data, error } = await supabase.functions.invoke<EdgePresignResponse>('r2-storage', {
    body: { action: 'presign-upload', objectKey, contentType },
  });
  if (error) throw new Error(`Edge Function error: ${error.message}`);
  if (!data?.ok || !data.uploadUrl) {
    throw new Error(data?.error ?? 'Presign gagal: respons tidak valid');
  }
  return { uploadUrl: data.uploadUrl, publicUrl: data.publicUrl ?? '' };
}

/**
 * PUT a Blob directly to Cloudflare R2 using a presigned URL.
 * No credentials are needed in the browser — the signature is in the URL.
 */
async function putToR2(uploadUrl: string, blob: Blob, contentType: string): Promise<void> {
  const res = await fetch(uploadUrl, {
    method:  'PUT',
    headers: { 'Content-Type': contentType },
    body:    blob,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`R2 upload gagal: HTTP ${res.status}${body ? ` — ${body.slice(0, 120)}` : ''}`);
  }
}

// ─── finalizeUpload ───────────────────────────────────────────────────────────
//
// Single coordination point for all post-upload steps:
//   PUT to R2 → insert Supabase metadata → insert relations
//
// Placing all three steps here means rollback, reconciliation, and retry
// logic has exactly one place to live when those are implemented.

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

  // ── 1. PUT original to R2 ─────────────────────────────────────────────────
  await putToR2(assets.original.uploadUrl, assets.original.blob, assets.original.mimeType);

  // ── 2. PUT thumbnail to R2 (non-fatal) ───────────────────────────────────
  let thumbPublicUrl = assets.original.publicUrl;
  if (assets.thumbnail) {
    await putToR2(
      assets.thumbnail.uploadUrl,
      assets.thumbnail.blob,
      assets.thumbnail.mimeType,
    ).catch((err) => {
      console.warn('[finalizeUpload] Thumbnail upload failed (non-fatal):', err);
    });
    thumbPublicUrl = assets.thumbnail.publicUrl || assets.original.publicUrl;
  }

  const originalUrl  = assets.original.publicUrl;
  const thumbnailUrl = thumbPublicUrl;

  // ── 3. Insert media metadata (non-fatal on failure) ───────────────────────
  // If metadata insert fails the files are still in R2. A future reconciliation
  // job can re-insert orphaned rows. All retry/rollback logic lives here.
  let media_uuid: string | null = null;
  try {
    media_uuid = await repoInsertMedia({
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
    });
  } catch (metaErr) {
    console.error('[finalizeUpload] Metadata insert failed (file is in R2):', metaErr);
    // TODO(FOUNDATION-STORAGE-005): enqueue for reconciliation / retry
  }

  // ── 4. Livestock photo relation (non-fatal) ───────────────────────────────
  if (options.category === 'livestock' && options.livestockId) {
    repoInsertLivestockPhoto({
      livestock_uuid: options.livestockId,
      storage_url:    originalUrl,
      thumbnail_url:  thumbnailUrl,
      uploaded_by:    options.uploadedBy,
      is_cover:       options.isCover      ?? false,
      display_order:  options.displayOrder ?? 0,
      caption:        options.caption      ?? null,
      taken_at:       options.takenAt      ?? null,
    }).catch((err) => {
      console.error('[finalizeUpload] livestock_photos insert failed (non-fatal):', err);
    });
  }

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
 */
export async function uploadImage(
  file: File,
  options: UploadImageOptions,
): Promise<UploadImageOutcome> {
  try {
    // ── 1. Process image ───────────────────────────────────────────────────────
    const pipeline = await pipelineProcess(file);
    const filename = options.filename ?? file.name;

    // ── 2. Generate object keys ────────────────────────────────────────────────
    // Include entity segments when a livestock ID is available for audit support.
    const objectKey = generateObjectKey({
      workspaceUuid:    options.ownerWorkspaceUuid,
      category:         options.category,
      entityType:       options.category === 'livestock' && options.livestockId
                          ? 'livestock' : undefined,
      entityUuid:       options.category === 'livestock' && options.livestockId
                          ? options.livestockId : undefined,
      originalFilename: filename,
      ext:              pipeline.original.ext,
    });
    const thumbnailKey = generateThumbnailKey(objectKey);

    // ── 3. Request presigned upload URLs ───────────────────────────────────────
    const [origPresign, thumbPresign] = await Promise.allSettled([
      requestPresignedUpload(objectKey,    pipeline.original.mimeType),
      requestPresignedUpload(thumbnailKey, pipeline.thumbnail.mimeType),
    ]);

    if (origPresign.status === 'rejected') {
      const reason = origPresign.reason instanceof Error
        ? origPresign.reason.message
        : 'Presign gagal';
      return { success: false, error: reason };
    }

    const { uploadUrl: origUploadUrl,  publicUrl: origPublicUrl }  = origPresign.value;
    const thumbOk      = thumbPresign.status === 'fulfilled';
    const thumbUpload  = thumbOk ? thumbPresign.value.uploadUrl  : '';
    const thumbPublic  = thumbOk ? thumbPresign.value.publicUrl  : origPublicUrl;

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
    const message = err instanceof PipelineError
      ? err.message
      : err instanceof Error
        ? err.message
        : 'Upload gagal';
    console.error('[ImageStorageService] Upload error:', err);
    return { success: false, error: message };
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
  return uploadImage(file, { ...rest, category: avatarCategory });
}

export async function uploadCover(
  file: File,
  options: UploadImageOptions,
): Promise<UploadImageOutcome> {
  return uploadImage(file, options);
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
