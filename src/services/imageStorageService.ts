// ─── Image Storage Service — DB-001D-1 ───────────────────────────────────────
//
// Browser-side abstraction for image uploads to Cloudflare R2.
// All uploads go through this service — never call R2 APIs directly from browser.
//
// PIPELINE (server-side, transparent to callers):
//   1. sharp auto-rotates EXIF, compresses to max 1920px JPEG quality 80
//   2. Generates thumbnail: max 400px JPEG quality 80
//   3. Both uploaded to R2; URLs returned to browser
//   4. Server persists the media metadata in Supabase
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
import { repoGetMediaByUuid, type MediaRepoRecord } from '../repositories/mediaRepository';

// ─── Auth helper ──────────────────────────────────────────────────────────────

/**
 * Returns Authorization headers with the current Supabase session token.
 * Returns an empty object when no session is active (unauthenticated state).
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadImageOptions {
  category: MediaCategory;
  ownerWorkspaceUuid: string;
  uploadedBy: string;
  filename?: string;
  altText?: string;
  tags?: string[];
  /** Livestock UUID; when present the server persists a livestock_photos row. */
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

// ─── Server response shape ────────────────────────────────────────────────────

interface ServerUploadResponse {
  success: boolean;
  /** UUID of the media row persisted to Supabase by the server (DB-001D-1 SSOT). */
  media_uuid?: string;
  original_url: string;
  thumbnail_url: string;
  key: string;
  thumbnail_key: string;
  file_size: number;
  original_file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  thumb_width: number | null;
  thumb_height: number | null;
  error?: string;
}

// ─── Core upload ──────────────────────────────────────────────────────────────

/**
 * Upload an image to Cloudflare R2 via the server-side proxy.
 * Server compresses the original and generates a thumbnail automatically.
 */
export async function uploadImage(
  file: File,
  options: UploadImageOptions,
): Promise<UploadImageOutcome> {
  try {
    const formData = new FormData();
    formData.append('file', file, options.filename ?? file.name);
    formData.append('category', options.category);
    if (options.filename) formData.append('filename', options.filename);
    if (options.livestockId) formData.append('livestockId', options.livestockId);
    if (options.isCover !== undefined) formData.append('isCover', String(options.isCover));
    if (options.displayOrder !== undefined) formData.append('displayOrder', String(options.displayOrder));
    if (options.caption) formData.append('caption', options.caption);
    if (options.takenAt) formData.append('takenAt', options.takenAt);

    const authHeaders = await getAuthHeaders();
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: response.statusText })) as { error?: string };
      return { success: false, error: errorBody.error ?? `HTTP ${response.status}` };
    }

    const data = await response.json() as ServerUploadResponse;

    if (!data.success || !data.original_url) {
      return { success: false, error: data.error ?? 'Respons server tidak valid' };
    }

    // Supabase is the SSOT — media_uuid is assigned by the server after
    // persisting to the `media` table (DB-001D-1).
    const media_uuid: string | null = data.media_uuid ?? null;

    return {
      success: true,
      original_url:   data.original_url,
      thumbnail_url:  data.thumbnail_url,
      key:            data.key,
      thumbnail_key:  data.thumbnail_key,
      file_size:      data.file_size,
      original_file_size: data.original_file_size,
      mime_type:      data.mime_type,
      width:          data.width,
      height:         data.height,
      thumb_width:    data.thumb_width,
      thumb_height:   data.thumb_height,
      media_uuid,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload gagal';
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
  try {
    const formData = new FormData();
    formData.append('file', file, options.filename ?? file.name);
    formData.append('category', options.avatarCategory);

    const authHeaders = await getAuthHeaders();
    const response = await fetch('/api/upload/image', { method: 'POST', headers: authHeaders, body: formData });
    if (!response.ok) {
      const e = await response.json().catch(() => ({ error: response.statusText })) as { error?: string };
      return { success: false, error: e.error ?? `HTTP ${response.status}` };
    }
    const data = await response.json() as ServerUploadResponse;
    if (!data.success || !data.original_url) {
      return { success: false, error: data.error ?? 'Respons server tidak valid' };
    }

    // Supabase is the SSOT — media_uuid is assigned by the server (DB-001D-1).
    const media_uuid: string | null = data.media_uuid ?? null;

    return {
      success: true,
      original_url: data.original_url,
      thumbnail_url: data.thumbnail_url,
      key: data.key,
      thumbnail_key: data.thumbnail_key,
      file_size: data.file_size,
      original_file_size: data.original_file_size,
      mime_type: data.mime_type,
      width: data.width,
      height: data.height,
      thumb_width: data.thumb_width,
      thumb_height: data.thumb_height,
      media_uuid,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Upload gagal' };
  }
}

export async function uploadCover(
  file: File,
  options: UploadImageOptions,
): Promise<UploadImageOutcome> {
  try {
    const formData = new FormData();
    formData.append('file', file, options.filename ?? file.name);
    formData.append('category', options.category);

    const authHeaders = await getAuthHeaders();
    const response = await fetch('/api/upload/image', { method: 'POST', headers: authHeaders, body: formData });
    if (!response.ok) {
      const e = await response.json().catch(() => ({ error: response.statusText })) as { error?: string };
      return { success: false, error: e.error ?? `HTTP ${response.status}` };
    }
    const data = await response.json() as ServerUploadResponse;
    if (!data.success || !data.original_url) {
      return { success: false, error: data.error ?? 'Respons server tidak valid' };
    }

    // Supabase is the SSOT — media_uuid is assigned by the server (DB-001D-1).
    const media_uuid: string | null = data.media_uuid ?? null;

    return {
      success: true,
      original_url: data.original_url,
      thumbnail_url: data.thumbnail_url,
      key: data.key,
      thumbnail_key: data.thumbnail_key,
      file_size: data.file_size,
      original_file_size: data.original_file_size,
      mime_type: data.mime_type,
      width: data.width,
      height: data.height,
      thumb_width: data.thumb_width,
      thumb_height: data.thumb_height,
      media_uuid,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Upload gagal' };
  }
}

/**
 * Upload multiple images sequentially.
 * Individual failures do not abort the batch.
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

export async function checkR2Health(): Promise<R2HealthResult> {
  try {
    const res = await fetch('/api/upload/health');
    return await res.json() as R2HealthResult;
  } catch (err) {
    return {
      status: 'error',
      bucket: 'unknown',
      message: err instanceof Error ? err.message : 'Tidak dapat menghubungi API server',
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
