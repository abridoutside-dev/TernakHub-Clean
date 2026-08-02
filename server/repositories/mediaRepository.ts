// ─── Server-side Media Repository — DB-001D-1 ────────────────────────────────
//
// Persists media metadata to Supabase after a successful Cloudflare R2 upload.
// Uses the caller's JWT (RLS-enforced). No service-role key.
//
// DB column contract (media table — DB-001A):
//   id uuid PK, media_type media_type_enum, media_category media_category_enum,
//   file_name text, mime_type text, file_size_bytes bigint,
//   width integer, height integer, storage_url text, cdn_url text,
//   owner_workspace_id uuid, created_by uuid, alt_text text, tags text[],
//   status text, deleted_at timestamptz, created_at timestamptz, updated_at timestamptz
//
// DB column contract (livestock_photos table — DB-001A):
//   id uuid PK, livestock_id uuid FK→livestock, uploaded_by uuid FK→auth.users,
//   storage_url text, thumbnail_url text, caption text,
//   is_primary boolean, sort_order integer, taken_at date, created_at timestamptz
// ─────────────────────────────────────────────────────────────────────────────

import { supabaseServerInsert, supabaseServerUpdate, SupabaseServerError } from '../supabaseAdmin.js';

export { SupabaseServerError };

// ─── Category mapping ─────────────────────────────────────────────────────────
// Upload-policy category → media_category_enum in Supabase.
// Values not in the DB enum fall back to 'system'.

const UPLOAD_CATEGORY_TO_DB: Record<string, string> = {
  livestock:   'livestock',
  marketplace: 'marketplace',
  health:      'health',
  feed:        'feed',
  profile:     'profile',
  workspace:   'workspace',
  evidence:    'trust',
  document:    'system',
  general:     'system',
};

function toDbCategory(category: string): string {
  return UPLOAD_CATEGORY_TO_DB[category] ?? 'system';
}

// ─── Media type mapping ───────────────────────────────────────────────────────
// All uploads are processed by sharp and stored as JPEG images.
// Profile/workspace uploads are semantically avatars.

function toDbMediaType(category: string): string {
  if (category === 'profile' || category === 'workspace') return 'avatar';
  return 'image';
}

// ─── Media insert ─────────────────────────────────────────────────────────────

export interface MediaInsertInput {
  /** Upload category (from uploadPolicy.ts) */
  category:           string;
  /** Original filename from the upload request */
  original_filename:  string;
  /** MIME type of the stored file (image/jpeg after processing) */
  mime_type:          string;
  /** Compressed file size in bytes */
  file_size:          number;
  /** Pixel width of the compressed original */
  width:              number;
  /** Pixel height of the compressed original */
  height:             number;
  /** Public URL of the compressed original stored in R2 */
  storage_url:        string;
  /** Public URL of the thumbnail stored in R2 */
  thumbnail_url:      string;
  /** R2 object key for the original (stored in tags for traceability) */
  object_key:         string;
  /** R2 object key for the thumbnail (stored in tags for traceability) */
  thumbnail_key:      string;
  /** R2 bucket name (stored in tags for traceability) */
  bucket:             string;
  /** Workspace UUID that owns this media (may be null for user-level uploads) */
  owner_workspace_id: string | null;
  /** UUID of the authenticated user performing the upload */
  uploaded_by:        string;
}

export interface MediaInsertResult {
  /** UUID of the newly-created media row (DB: id) */
  media_uuid:  string;
  created_at:  string;
}

/**
 * Insert a media record into Supabase after a successful R2 upload.
 * Uses the caller's JWT so RLS workspace-member policy is enforced.
 */
export async function repoInsertMedia(
  input: MediaInsertInput,
  jwt: string,
): Promise<MediaInsertResult> {
  const row = {
    media_type:         toDbMediaType(input.category),
    media_category:     toDbCategory(input.category),
    file_name:          input.original_filename,
    mime_type:          input.mime_type,
    file_size_bytes:    input.file_size,
    width:              input.width  > 0 ? input.width  : null,
    height:             input.height > 0 ? input.height : null,
    storage_url:        input.storage_url,
    cdn_url:            input.thumbnail_url || null,
    owner_workspace_id: input.owner_workspace_id || null,
    created_by:         input.uploaded_by,
    tags:               [
      `bucket:${input.bucket}`,
      `key:${input.object_key}`,
      `thumb_key:${input.thumbnail_key}`,
    ],
    status: 'active',
  };

  const result = await supabaseServerInsert('media', row, jwt);

  return {
    media_uuid: String(result.id  ?? ''),
    created_at: String(result.created_at ?? new Date().toISOString()),
  };
}

// ─── Livestock photo insert ───────────────────────────────────────────────────

export interface LivestockPhotoInsertInput {
  /** UUID of the livestock record this photo belongs to */
  livestock_id:  string;
  /** Public URL of the compressed original */
  storage_url:   string;
  /** Public URL of the thumbnail */
  thumbnail_url: string;
  /** UUID of the authenticated uploader */
  uploaded_by:   string;
  /** True if this is the primary/cover photo */
  is_cover:      boolean;
  /** Display order (0-based) */
  display_order: number;
  /** Optional caption / prestasi description */
  caption?:      string | null;
  /** Achievement date for prestasi photos (YYYY-MM-DD) — stored as taken_at */
  taken_at?:     string | null;
}

export interface LivestockPhotoInsertResult {
  /** UUID of the newly-created livestock_photos row */
  photo_uuid: string;
}

/**
 * Insert a livestock_photos relation row in Supabase.
 * Call this after repoInsertMedia when category='livestock' and livestock_id is provided.
 */
export async function repoInsertLivestockPhoto(
  input: LivestockPhotoInsertInput,
  jwt: string,
): Promise<LivestockPhotoInsertResult> {
  if (input.is_cover) {
    await supabaseServerUpdate(
      'livestock_photos',
      `livestock_id=eq.${encodeURIComponent(input.livestock_id)}&is_primary=eq.true`,
      { is_primary: false },
      jwt,
    );
  }

  const row = {
    livestock_id:  input.livestock_id,
    storage_url:   input.storage_url,
    thumbnail_url: input.thumbnail_url || null,
    uploaded_by:   input.uploaded_by,
    is_primary:    input.is_cover,
    sort_order:    input.display_order,
    caption:       input.caption       ?? null,
    taken_at:      input.taken_at      ?? null,
  };

  const result = await supabaseServerInsert('livestock_photos', row, jwt);
  return { photo_uuid: String(result.id ?? '') };
}
