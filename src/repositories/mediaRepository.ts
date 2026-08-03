// ─── Media Repository — DB-001D-1 ────────────────────────────────────────────
//
// Async Supabase adapter for the `media` and `livestock_photos` tables.
// This is the authoritative read path for media metadata — replacing the
// Media metadata is read from Supabase.
//
// DB-001A column contract (media):
//   id uuid PK, media_type media_type_enum, media_category media_category_enum,
//   file_name text, mime_type text, file_size_bytes bigint,
//   width integer, height integer, storage_url text, cdn_url text,
//   owner_workspace_id uuid, created_by uuid, alt_text text, tags text[],
//   status text, deleted_at timestamptz, created_at timestamptz, updated_at timestamptz
//
// DB-001A column contract (livestock_photos):
//   id uuid PK, livestock_id uuid, uploaded_by uuid, storage_url text,
//   thumbnail_url text, caption text, is_primary boolean, sort_order integer,
//   taken_at date, created_at timestamptz
//
// Rules:
//   - All functions are async.
//   - Never import from pages, components, or contexts.
//   - RLS: media_workspace_member policy enforces workspace-scoped access.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../lib/supabase';
import type { MediaType, MediaCategory, MediaStatus } from '../types/media';

// ─── Error ────────────────────────────────────────────────────────────────────

export class MediaRepoError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'MediaRepoError';
  }
}

// ─── DB row types ─────────────────────────────────────────────────────────────

type MediaDbRow = {
  id:                 string;
  media_type:         string;
  media_category:     string;
  file_name:          string;
  mime_type:          string | null;
  file_size_bytes:    number | null;
  width:              number | null;
  height:             number | null;
  storage_url:        string;
  cdn_url:            string | null;
  owner_workspace_id: string | null;
  created_by:         string | null;
  alt_text:           string | null;
  tags:               string[] | null;
  status:             string;
  deleted_at:         string | null;
  created_at:         string;
  updated_at:         string;
};

type LivestockPhotoDbRow = {
  id:            string;
  livestock_id:  string;
  uploaded_by:   string | null;
  storage_url:   string;
  thumbnail_url: string | null;
  caption:       string | null;
  is_primary:    boolean;
  sort_order:    number;
  taken_at:      string | null;
  created_at:    string;
};

// ─── App record types ─────────────────────────────────────────────────────────

/**
 * Media record as returned by the repository — maps directly from DB columns.
 * Use `media_uuid` as the opaque identifier to pass between modules.
 */
export interface MediaRepoRecord {
  media_uuid:           string;
  media_type:           MediaType;
  media_category:       MediaCategory;
  file_name:            string;
  mime_type:            string | null;
  file_size:            number | null;
  width:                number | null;
  height:               number | null;
  /** Primary object URL (compressed original in R2) */
  storage_url:          string;
  /** Thumbnail URL (stored as cdn_url in DB). Null if no thumbnail. */
  thumbnail_url:        string | null;
  owner_workspace_uuid: string | null;
  created_by:           string | null;
  alt_text:             string | null;
  tags:                 string[];
  status:               MediaStatus;
  deleted_at:           string | null;
  created_at:           string;
  updated_at:           string;
}

/**
 * Livestock photo record as returned by the repository.
 */
export interface LivestockPhotoRepoRecord {
  photo_uuid:    string;
  livestock_uuid: string;
  storage_url:   string;
  thumbnail_url: string | null;
  caption:       string | null;
  /** True if this is the primary / cover photo */
  is_cover:      boolean;
  /** Display order (0-based) */
  display_order: number;
  uploaded_by:   string | null;
  taken_at:      string | null;
  created_at:    string;
}

// ─── Category mapping (DB enum → app type) ───────────────────────────────────

const DB_CATEGORY_TO_APP: Record<string, MediaCategory> = {
  livestock:   'livestock',
  marketplace: 'marketplace',
  health:      'kesehatan',
  feed:        'master_pakan',
  transaction: 'dokumen',
  profile:     'profile',
  workspace:   'workspace',
  trust:       'dokumen',
  news:        'news_event',
  admin:       'system',
  system:      'system',
};

function fromDbCategory(value: string): MediaCategory {
  return DB_CATEGORY_TO_APP[value] ?? 'system';
}

const DB_TYPE_TO_APP: Record<string, MediaType> = {
  image:       'image',
  document:    'document',
  attachment:  'attachment',
  avatar:      'avatar',
  cover:       'cover',
  gallery:     'gallery',
  audio:       'audio',
  video:       'video',
  pdf:         'pdf',
  spreadsheet: 'spreadsheet',
};

function fromDbType(value: string): MediaType {
  return (DB_TYPE_TO_APP[value] as MediaType) ?? 'image';
}

function fromDbStatus(value: string, deletedAt: string | null): MediaStatus {
  if (deletedAt) return 'deleted';
  if (value === 'active') return 'active';
  if (value === 'pending') return 'pending';
  return 'active';
}

// ─── Row adapters ─────────────────────────────────────────────────────────────

function fromMediaRow(row: MediaDbRow): MediaRepoRecord {
  return {
    media_uuid:           row.id,
    media_type:           fromDbType(row.media_type),
    media_category:       fromDbCategory(row.media_category),
    file_name:            row.file_name,
    mime_type:            row.mime_type,
    file_size:            row.file_size_bytes,
    width:                row.width,
    height:               row.height,
    storage_url:          row.storage_url,
    thumbnail_url:        row.cdn_url,
    owner_workspace_uuid: row.owner_workspace_id,
    created_by:           row.created_by,
    alt_text:             row.alt_text,
    tags:                 row.tags ?? [],
    status:               fromDbStatus(row.status, row.deleted_at),
    deleted_at:           row.deleted_at,
    created_at:           row.created_at,
    updated_at:           row.updated_at,
  };
}

function fromLivestockPhotoRow(row: LivestockPhotoDbRow): LivestockPhotoRepoRecord {
  return {
    photo_uuid:     row.id,
    livestock_uuid: row.livestock_id,
    storage_url:    row.storage_url,
    thumbnail_url:  row.thumbnail_url,
    caption:        row.caption,
    is_cover:       row.is_primary,
    display_order:  row.sort_order,
    uploaded_by:    row.uploaded_by,
    taken_at:       row.taken_at,
    created_at:     row.created_at,
  };
}

// ─── Media read operations ────────────────────────────────────────────────────

/**
 * Fetch a single media record by its UUID.
 * Returns null if not found or soft-deleted.
 */
export async function repoGetMediaByUuid(uuid: string): Promise<MediaRepoRecord | null> {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('id', uuid)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new MediaRepoError(error.message, error.code);
  return data ? fromMediaRow(data as MediaDbRow) : null;
}

/**
 * Fetch multiple media records by their UUIDs.
 * Missing or deleted UUIDs are silently omitted.
 * Result order follows the input array.
 */
export async function repoGetMediaByUuids(uuids: string[]): Promise<MediaRepoRecord[]> {
  if (uuids.length === 0) return [];

  const { data, error } = await supabase
    .from('media')
    .select('*')
    .in('id', uuids)
    .is('deleted_at', null);

  if (error) throw new MediaRepoError(error.message, error.code);

  const map = new Map<string, MediaRepoRecord>();
  (data as MediaDbRow[] ?? []).forEach((row) => {
    map.set(row.id, fromMediaRow(row));
  });

  return uuids.map((id) => map.get(id)).filter((r): r is MediaRepoRecord => r !== undefined);
}

/**
 * Fetch all active media records owned by a workspace.
 */
export async function repoGetMediaByWorkspace(
  workspaceUuid: string,
): Promise<MediaRepoRecord[]> {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('owner_workspace_id', workspaceUuid)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new MediaRepoError(error.message, error.code);
  return (data as MediaDbRow[] ?? []).map(fromMediaRow);
}

/**
 * Soft-delete a media record (sets deleted_at to now).
 * Returns true if the row was found and updated.
 */
export async function repoSoftDeleteMedia(uuid: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('media')
    .update({ deleted_at: new Date().toISOString(), status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', uuid)
    .is('deleted_at', null)
    .select('id');

  if (error) throw new MediaRepoError(error.message, error.code);
  return (data?.length ?? 0) > 0;
}

// ─── Livestock photo read operations ─────────────────────────────────────────

/**
 * Fetch all photos for a given livestock UUID, ordered by display order.
 */
export async function repoGetLivestockPhotosByLivestockId(
  livestockUuid: string,
): Promise<LivestockPhotoRepoRecord[]> {
  const { data, error } = await supabase
    .from('livestock_photos')
    .select('*')
    .eq('livestock_id', livestockUuid)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new MediaRepoError(error.message, error.code);
  return (data as LivestockPhotoDbRow[] ?? []).map(fromLivestockPhotoRow);
}

/**
 * Fetch the primary (cover) photo for a livestock record.
 * Returns null if no primary photo exists.
 */
export async function repoGetLivestockPrimaryPhoto(
  livestockUuid: string,
): Promise<LivestockPhotoRepoRecord | null> {
  const { data, error } = await supabase
    .from('livestock_photos')
    .select('*')
    .eq('livestock_id', livestockUuid)
    .eq('is_primary', true)
    .maybeSingle();

  if (error) throw new MediaRepoError(error.message, error.code);
  return data ? fromLivestockPhotoRow(data as LivestockPhotoDbRow) : null;
}

/**
 * Insert a livestock photo relation from a browser upload flow.
 * The upload endpoint normally creates this row server-side; this helper is
 * kept as the repository chokepoint for clients that already have R2 URLs.
 */
export async function repoInsertLivestockPhoto(
  input: {
    livestock_uuid: string;
    storage_url: string;
    thumbnail_url?: string | null;
    uploaded_by?: string | null;
    is_cover?: boolean;
    display_order?: number;
    caption?: string | null;
    taken_at?: string | null;
  },
): Promise<LivestockPhotoRepoRecord> {
  const { data, error } = await supabase
    .from('livestock_photos')
    .insert({
      livestock_id: input.livestock_uuid,
      storage_url: input.storage_url,
      thumbnail_url: input.thumbnail_url ?? null,
      uploaded_by: input.uploaded_by ?? null,
      is_primary: input.is_cover ?? false,
      sort_order: input.display_order ?? 0,
      caption: input.caption ?? null,
      taken_at: input.taken_at ?? null,
    })
    .select('*')
    .single();

  if (error) throw new MediaRepoError(error.message, error.code);
  return fromLivestockPhotoRow(data as LivestockPhotoDbRow);
}

/**
 * Make one photo the primary/cover photo for a livestock record.
 * The schema has no separate cover registry; `is_primary` is the SSOT.
 */
export async function repoSetLivestockPrimaryPhoto(
  livestockUuid: string,
  photoUuid: string,
): Promise<boolean> {
  const clearResult = await supabase
    .from('livestock_photos')
    .update({ is_primary: false })
    .eq('livestock_id', livestockUuid)
    .eq('is_primary', true);

  if (clearResult.error) {
    throw new MediaRepoError(clearResult.error.message, clearResult.error.code);
  }

  const setResult = await supabase
    .from('livestock_photos')
    .update({ is_primary: true })
    .eq('id', photoUuid)
    .eq('livestock_id', livestockUuid)
    .select('id');

  if (setResult.error) {
    throw new MediaRepoError(setResult.error.message, setResult.error.code);
  }
  return (setResult.data?.length ?? 0) > 0;
}

/**
 * Remove a livestock photo relation.
 *
 * `livestock_photos` is the authoritative relation table and intentionally
 * retains no local mirror. The media row itself remains available for audit
 * and storage reconciliation.
 */
export async function repoDeleteLivestockPhoto(
  livestockUuid: string,
  photoUuid: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('livestock_photos')
    .delete()
    .eq('id', photoUuid)
    .eq('livestock_id', livestockUuid)
    .select('id');

  if (error) throw new MediaRepoError(error.message, error.code);
  return (data?.length ?? 0) > 0;
}

// ─── Browser media insert ─────────────────────────────────────────────────────
// Used by imageStorageService after a direct-to-R2 browser upload.
// The supabase client automatically includes the user's session JWT for RLS.

/** Maps client MediaCategory values to the DB media_category enum. */
const APP_CATEGORY_TO_DB: Record<string, string> = {
  livestock:        'livestock',
  marketplace:      'marketplace',
  master_pakan:     'feed',
  produk_komersial: 'marketplace',
  workspace:        'workspace',
  profile:          'profile',
  kesehatan:        'health',
  penyakit:         'health',
  reproduksi:       'livestock',
  batch:            'livestock',
  news_event:       'news',
  dokumen:          'system',
  system:           'system',
};

function appCategoryToDb(category: string): string {
  return APP_CATEGORY_TO_DB[category] ?? 'system';
}

function appCategoryToDbMediaType(category: string): string {
  if (category === 'profile' || category === 'workspace') return 'avatar';
  return 'image';
}

export interface MediaInsertBrowserInput {
  category:          MediaCategory | string;
  originalFilename:  string;
  mimeType:          string;
  fileSizeBytes:     number;
  width:             number;
  height:            number;
  storageUrl:        string;
  thumbnailUrl:      string;
  objectKey:         string;
  thumbnailKey:      string;
  ownerWorkspaceId:  string;
  uploadedBy:        string;
  altText?:          string | null;
  tags?:             string[];
}

/**
 * Insert a media row from the browser after a successful direct-to-R2 upload.
 * Returns the UUID of the newly-created media row.
 * Uses the current Supabase session (RLS-enforced via the user's JWT).
 */
export async function repoInsertMediaBrowser(
  input: MediaInsertBrowserInput,
): Promise<string> {
  const extraTags = input.tags ?? [];
  const systemTags = [
    `bucket:r2`,
    `key:${input.objectKey}`,
    `thumb_key:${input.thumbnailKey}`,
  ];

  const { data, error } = await supabase
    .from('media')
    .insert({
      media_type:         appCategoryToDbMediaType(input.category),
      media_category:     appCategoryToDb(input.category),
      file_name:          input.originalFilename,
      mime_type:          input.mimeType,
      file_size_bytes:    input.fileSizeBytes,
      width:              input.width  > 0 ? input.width  : null,
      height:             input.height > 0 ? input.height : null,
      storage_url:        input.storageUrl,
      cdn_url:            input.thumbnailUrl || null,
      owner_workspace_id: input.ownerWorkspaceId || null,
      created_by:         input.uploadedBy,
      alt_text:           input.altText ?? null,
      tags:               [...systemTags, ...extraTags],
      status:             'active',
    })
    .select('id')
    .single();

  if (error) throw new MediaRepoError(error.message, error.code);
  return String((data as { id: string }).id);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the display URL for a media UUID.
 * Returns thumbnail_url if available, otherwise storage_url, otherwise null.
 * Use this as the single URL-resolution call in UI components.
 */
export async function repoResolveMediaUrl(uuid: string | null | undefined): Promise<string | null> {
  if (!uuid) return null;
  const record = await repoGetMediaByUuid(uuid);
  if (!record) return null;
  return record.thumbnail_url ?? record.storage_url;
}
