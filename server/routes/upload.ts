// ─── Upload Routes — DB-001D-1 ────────────────────────────────────────────────
//
// POST /api/upload/image
//   Auth:    Bearer token (Supabase JWT) — required
//   Body:    multipart/form-data
//     file          — image (JPEG/PNG/WebP/GIF, max 10 MB)
//     category      — UploadCategory string (default: "livestock")
//     filename      — override stored object filename (optional)
//     workspaceId   — UUID of the target workspace (optional; validates membership)
//     livestockId   — UUID of the livestock record (optional; creates livestock_photos row)
//     isCover       — "true" | "false" — mark as primary photo (optional, default false)
//     displayOrder  — integer display order (optional, default 0)
//   Processing (server-side, via sharp):
//     1. Validate MIME type against centralised policy
//     2. Fix EXIF orientation (auto-rotate) + strip metadata
//     3. Compress original → JPEG, max 1920px longest side, quality 80
//     4. Generate thumbnail → JPEG, max 400px longest side, quality 80
//     5. Upload both to Cloudflare R2
//     6. Persist metadata to Supabase (media + livestock_photos if applicable)
//     7. On any failure after a partial write → roll back R2 objects
//   Returns:
//     { success, media_uuid, original_url, thumbnail_url, key, thumbnail_key,
//       file_size, original_file_size, mime_type, width, height,
//       thumb_width, thumb_height }
//
// GET /api/upload/health
//   Returns R2 bucket connectivity status.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import {
  uploadObject,
  deleteObject,
  checkBucketHealth,
  getBucket,
} from '../r2Client.js';
import { generateUploadKey } from '../utils/keyGen.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { requireWorkspaceAccess } from '../middleware/workspaceAuth.js';
import {
  isAllowedMimeType,
  isAllowedCategory,
  DEFAULT_CATEGORY,
  isAllowedMediaType,
  DEFAULT_MEDIA_TYPE,
  ALLOWED_MIME_LABEL,
  MAX_RAW_FILE_SIZE,
} from '../uploadPolicy.js';
import {
  repoInsertMedia,
  repoInsertLivestockPhoto,
  SupabaseServerError,
} from '../repositories/mediaRepository.js';

const router = Router();

// ─── Image Processing Config ──────────────────────────────────────────────────

const ORIGINAL_MAX_PX = 1920;
const THUMB_MAX_PX    = 400;
const JPEG_QUALITY    = 80;

// ─── Multer — Memory Storage ──────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RAW_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (isAllowedMimeType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipe file tidak didukung: ${file.mimetype}. Gunakan ${ALLOWED_MIME_LABEL}.`));
    }
  },
});

// ─── Multer error handler ─────────────────────────────────────────────────────

function handleMulterError(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    res.status(status).json({ success: false, error: err.message });
    return;
  }
  if (err) {
    res.status(400).json({ success: false, error: err.message });
    return;
  }
  next();
}

// ─── Image Processing ─────────────────────────────────────────────────────────

interface ProcessedImages {
  original:  { buffer: Buffer; width: number; height: number };
  thumbnail: { buffer: Buffer; width: number; height: number };
}

async function processImage(inputBuffer: Buffer): Promise<ProcessedImages> {
  const base = sharp(inputBuffer).rotate().withMetadata({ orientation: undefined });

  const origBuffer = await base.clone()
    .resize(ORIGINAL_MAX_PX, ORIGINAL_MAX_PX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: false })
    .toBuffer();
  const origMeta = await sharp(origBuffer).metadata();

  const thumbBuffer = await base.clone()
    .resize(THUMB_MAX_PX, THUMB_MAX_PX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: false })
    .toBuffer();
  const thumbMeta = await sharp(thumbBuffer).metadata();

  return {
    original:  { buffer: origBuffer,  width: origMeta.width  ?? 0, height: origMeta.height  ?? 0 },
    thumbnail: { buffer: thumbBuffer, width: thumbMeta.width ?? 0, height: thumbMeta.height ?? 0 },
  };
}

// ─── Rollback helper ──────────────────────────────────────────────────────────

async function rollbackKeys(keys: (string | null)[]): Promise<void> {
  await Promise.all(
    keys
      .filter((k): k is string => k !== null)
      .map((k) =>
        deleteObject(k).then((r) => {
          if (!r.ok) console.error(`[R2] Rollback failed for "${k}": ${r.error}`);
          else        console.warn(`[R2] Rolled back orphaned object: ${k}`);
        }),
      ),
  );
}

// ─── POST /api/upload/image ───────────────────────────────────────────────────
// Middleware chain:
//   1. requireAuth           — validates Supabase JWT, sets req.user
//   2. upload.single         — parses multipart, enforces size + MIME policy
//   3. handleMulterError     — converts multer errors to structured 400/413
//   4. requireWorkspaceAccess — validates workspace membership (if workspaceId present)
//   5. route handler         — processes, uploads to R2, persists to Supabase

router.post(
  '/image',
  requireAuth,
  upload.single('file'),
  handleMulterError,
  requireWorkspaceAccess,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let uploadedOriginalKey:  string | null = null;
    let uploadedThumbnailKey: string | null = null;

    // Extract JWT once for downstream Supabase calls
    const jwt = (req.headers.authorization ?? '').slice(7); // strip "Bearer "

    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, error: 'Field "file" diperlukan' });
        return;
      }

      // ── Secondary MIME validation (defence-in-depth) ──────────────────────
      if (!isAllowedMimeType(file.mimetype)) {
        res.status(415).json({
          success: false,
          error: `Tipe file tidak didukung: ${file.mimetype}. Gunakan ${ALLOWED_MIME_LABEL}.`,
        });
        return;
      }

      // ── Category + optional fields ────────────────────────────────────────
      const rawCategory = (req.body.category as string | undefined) ?? DEFAULT_CATEGORY;
      const category    = isAllowedCategory(rawCategory) ? rawCategory : DEFAULT_CATEGORY;
      const filename    = (req.body.filename    as string | undefined) ?? file.originalname;
      const workspaceId = (req.body.workspaceId as string | undefined)?.trim() ?? null;
      const livestockId  = (req.body.livestockId as string | undefined)?.trim() ?? null;
      const isCover      = (req.body.isCover    as string | undefined) === 'true';
      const displayOrder = parseInt(req.body.displayOrder as string | undefined ?? '0', 10) || 0;
      const caption      = (req.body.caption    as string | undefined)?.trim() || null;
      const takenAt      = (req.body.takenAt    as string | undefined)?.trim() || null;

      // ── Object key path segments (FOUNDATION-STORAGE-004A) ───────────────
      const entityType = ((req.body.entityType as string | undefined)?.trim()) || '_';
      const entityUuid = ((req.body.entityUuid as string | undefined)?.trim()) || '_';
      const rawMediaType = (req.body.mediaType as string | undefined) ?? DEFAULT_MEDIA_TYPE;
      const mediaType    = isAllowedMediaType(rawMediaType) ? rawMediaType : DEFAULT_MEDIA_TYPE;
      const wsSegment    = workspaceId ?? '_';

      // ── Process with sharp ────────────────────────────────────────────────
      let processed: ProcessedImages;
      try {
        processed = await processImage(file.buffer);
      } catch (sharpErr) {
        console.error('[R2] sharp processing failed:', sharpErr);
        res.status(422).json({
          success: false,
          error: 'Gagal memproses gambar. Pastikan file adalah gambar yang valid.',
        });
        return;
      }

      // ── Generate R2 keys (FOUNDATION-STORAGE-004A key structure) ─────────
      // original:  workspace/category/entityType/entityUuid/mediaType/YYYY/MM/{uuid}.jpg
      // thumbnail: workspace/category/entityType/entityUuid/thumbnail/YYYY/MM/{uuid}.jpg
      const originalKey  = generateUploadKey(wsSegment, category, entityType, entityUuid, mediaType,    filename, 'image/jpeg');
      const thumbnailKey = generateUploadKey(wsSegment, category, entityType, entityUuid, 'thumbnail',  filename, 'image/jpeg');

      // ── Upload both to R2 ─────────────────────────────────────────────────
      const [origResult, thumbResult] = await Promise.all([
        uploadObject(originalKey, processed.original.buffer, 'image/jpeg', {
          category,
          uploaded_by:       req.user?.id ?? 'unknown',
          original_filename: encodeURIComponent(file.originalname),
          image_type:        'original',
        }),
        uploadObject(thumbnailKey, processed.thumbnail.buffer, 'image/jpeg', {
          category,
          uploaded_by:       req.user?.id ?? 'unknown',
          original_filename: encodeURIComponent(file.originalname),
          image_type:        'thumbnail',
        }),
      ]);

      if (origResult.ok)  uploadedOriginalKey  = originalKey;
      if (thumbResult.ok) uploadedThumbnailKey = thumbnailKey;

      if (!origResult.ok) {
        console.error('[R2] Original upload failed:', origResult.error);
        res.status(502).json({ success: false, error: origResult.error });
        return;
      }

      if (!thumbResult.ok) {
        console.warn('[R2] Thumbnail upload failed (non-fatal):', thumbResult.error);
      }

      // ── Persist metadata to Supabase (SSOT) ──────────────────────────────
      let media_uuid: string;
      try {
        const mediaResult = await repoInsertMedia(
          {
            category,
            original_filename: file.originalname,
            mime_type:         'image/jpeg',
            file_size:         processed.original.buffer.length,
            width:             processed.original.width,
            height:            processed.original.height,
            storage_url:       origResult.url,
            thumbnail_url:     thumbResult.ok ? thumbResult.url : origResult.url,
            object_key:        originalKey,
            thumbnail_key:     thumbnailKey,
            bucket:            getBucket(),
            owner_workspace_id: workspaceId,
            uploaded_by:       req.user?.id ?? 'unknown',
          },
          jwt,
        );
        media_uuid = mediaResult.media_uuid;

        // ── Livestock photo relation (if applicable) ──────────────────────
        if (category === 'livestock' && livestockId) {
          try {
            await repoInsertLivestockPhoto(
              {
                livestock_id:  livestockId,
                storage_url:   origResult.url,
                thumbnail_url: thumbResult.ok ? thumbResult.url : origResult.url,
                uploaded_by:   req.user?.id ?? 'unknown',
                is_cover:      isCover,
                display_order: displayOrder,
                caption,
                taken_at:      takenAt,
              },
              jwt,
            );
          } catch (photoErr) {
            // Non-fatal: media is persisted; livestock_photos relation failed
            console.error('[Supabase] livestock_photos insert failed (non-fatal):', photoErr);
          }
        }
      } catch (supabaseErr) {
        // Supabase is the source of truth — if metadata cannot be persisted,
        // roll back the R2 objects to avoid orphaned binaries.
        console.error('[Supabase] media insert failed — rolling back R2:', supabaseErr);
        await rollbackKeys([uploadedOriginalKey, uploadedThumbnailKey]);
        uploadedOriginalKey  = null;
        uploadedThumbnailKey = null;

        const message = supabaseErr instanceof SupabaseServerError
          ? supabaseErr.message
          : 'Gagal menyimpan metadata media ke database';
        res.status(502).json({ success: false, error: message });
        return;
      }

      console.log(
        `[Upload] OK media_uuid=${media_uuid}` +
        ` original=${originalKey} (${processed.original.buffer.length} B)` +
        ` thumb=${thumbnailKey} (${processed.thumbnail.buffer.length} B)` +
        ` user=${req.user?.id ?? 'unknown'}`,
      );

      res.json({
        success:            true,
        media_uuid,
        original_url:       origResult.url,
        thumbnail_url:      thumbResult.ok ? thumbResult.url : origResult.url,
        key:                originalKey,
        thumbnail_key:      thumbnailKey,
        file_size:          processed.original.buffer.length,
        original_file_size: file.size,
        mime_type:          'image/jpeg',
        width:              processed.original.width,
        height:             processed.original.height,
        thumb_width:        processed.thumbnail.width,
        thumb_height:       processed.thumbnail.height,
      });
    } catch (err) {
      // Unexpected failure — roll back any R2 objects already written
      if (uploadedOriginalKey || uploadedThumbnailKey) {
        console.error('[R2] Unexpected error after partial upload — rolling back');
        await rollbackKeys([uploadedOriginalKey, uploadedThumbnailKey]);
      }
      const message = err instanceof Error ? err.message : 'Upload gagal';
      console.error('[Upload] Unexpected error:', err);
      res.status(500).json({ success: false, error: message });
    }
  },
);

// ─── GET /api/upload/health ───────────────────────────────────────────────────

router.get('/health', async (_req: Request, res: Response) => {
  try {
    const result = await checkBucketHealth();
    if (result.ok) {
      res.json({ status: 'ok', bucket: getBucket(), message: result.message });
    } else {
      res.status(503).json({ status: 'error', bucket: getBucket(), message: result.message });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[R2] Health check error:', err);
    res.status(503).json({ status: 'error', bucket: getBucket(), message });
  }
});

export default router;
