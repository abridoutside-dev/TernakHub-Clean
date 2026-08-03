// ─── Admin Storage Config Routes — ADMIN-PLATFORM-003C ────────────────────────
//
// Provides server-side API for managing Cloudflare R2 configuration from
// the Admin Dashboard. All routes require an authenticated Platform Administrator.
//
// Routes:
//   GET  /api/admin/storage-config                    — read config (credentials masked)
//   POST /api/admin/storage-config                    — save config + hot-reload
//   POST /api/admin/storage-config/test-connection    — test bucket health + return rich details
//   POST /api/admin/storage-config/test-upload        — full cycle: upload → read → delete → report
//   POST /api/admin/storage-config/test-download      — upload probe → GET → report HTTP/length/latency → delete
//   POST /api/admin/storage-config/replace-credential — replace a single credential in-place
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  loadStorageConfig,
  saveStorageConfig,
  type StorageConfigInput,
} from '../repositories/storageConfigRepository.js';
import {
  checkBucketHealth,
  uploadObject,
  readObject,
  deleteObject,
} from '../r2Client.js';
import { getR2Config } from '../r2ConfigStore.js';

const router = Router();

// All admin config routes require auth + admin
router.use(requireAuth, requireAdmin);

// ─── GET /api/admin/storage-config ───────────────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const jwt = (req.headers.authorization ?? '').slice(7);
  try {
    const config = await loadStorageConfig(jwt);
    if (!config) {
      // Return defaults when no row exists yet
      res.json({
        success: true,
        config: {
          accountId: '', bucket: 'ternakhub-images', endpoint: '', region: 'auto',
          publicUrl: '', customDomain: '',
          accessKeyId: '', secretAccessKey: '', cfApiToken: '',
          enableStorage: true, maxUploadSizeMb: 10,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          maxResolutionPx: 1920, autoCompression: true, compressionQuality: 80,
          convertToWebP: false, preserveExif: false,
          cdnCacheTtlSec: 86400, signedUrl: false, isPublicBucket: true, defaultImageQuality: 80,
        },
        source: 'defaults',
      });
      return;
    }
    res.json({ success: true, config, source: 'database' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AdminConfig] GET storage-config error:', err);
    res.status(500).json({ success: false, error: msg });
  }
});

// ─── POST /api/admin/storage-config ──────────────────────────────────────────

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const jwt = (req.headers.authorization ?? '').slice(7);
  try {
    const input = req.body as StorageConfigInput;

    // Basic validation
    if (!input.bucket?.trim()) {
      res.status(400).json({ success: false, error: 'Bucket Name wajib diisi' });
      return;
    }
    if (!input.accountId?.trim()) {
      res.status(400).json({ success: false, error: 'Account ID wajib diisi' });
      return;
    }

    await saveStorageConfig(input, jwt);
    res.json({ success: true, message: 'Konfigurasi storage berhasil disimpan dan diaktifkan' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AdminConfig] POST storage-config error:', err);
    res.status(500).json({ success: false, error: msg });
  }
});

// ─── POST /api/admin/storage-config/test-connection ──────────────────────────
// Returns: { success, message, latencyMs, bucketRegion, storageProvider, bucketVisibility, lastTested }

router.post('/test-connection', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await checkBucketHealth();
    const lastTested = new Date().toISOString();

    if (result.ok) {
      res.json({
        success:          true,
        message:          result.message,
        latencyMs:        result.latencyMs,
        bucketRegion:     result.bucketRegion,
        storageProvider:  result.storageProvider,
        bucketVisibility: result.bucketVisibility,
        lastTested,
      });
    } else {
      res.status(503).json({
        success:          false,
        error:            result.message,
        latencyMs:        result.latencyMs,
        bucketRegion:     result.bucketRegion,
        storageProvider:  result.storageProvider,
        bucketVisibility: result.bucketVisibility,
        lastTested,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AdminConfig] test-connection error:', err);
    res.status(503).json({ success: false, error: msg });
  }
});

// ─── POST /api/admin/storage-config/test-upload ──────────────────────────────
// Full lifecycle: upload small probe → read back → delete → report each step + latency

const UPLOAD_PROBE_KEY = '__admin_test__/upload-probe.txt';

router.post('/test-upload', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cfg       = getR2Config();
    const timestamp = new Date().toISOString();
    const content   = `TernakHub R2 upload probe\nTimestamp: ${timestamp}\nBucket: ${cfg.bucket}\n`;
    const buffer    = Buffer.from(content, 'utf8');

    const totalStart = Date.now();

    // ── 1. Upload ─────────────────────────────────────────────────────────────
    const uploadStart  = Date.now();
    const uploadResult = await uploadObject(UPLOAD_PROBE_KEY, buffer, 'text/plain');
    const uploadMs     = Date.now() - uploadStart;

    if (!uploadResult.ok) {
      res.status(502).json({
        success: false,
        error:   `Upload gagal: ${uploadResult.error}`,
        steps:   { upload: false, read: false, delete: false },
        latencyMs: Date.now() - totalStart,
      });
      return;
    }

    // ── 2. Read back ──────────────────────────────────────────────────────────
    const readStart  = Date.now();
    const readResult = await readObject(UPLOAD_PROBE_KEY);
    const readMs     = Date.now() - readStart;

    if (!readResult.ok) {
      // Best-effort cleanup
      await deleteObject(UPLOAD_PROBE_KEY).catch(() => undefined);
      res.status(502).json({
        success: false,
        error:   `Baca kembali gagal: ${readResult.error}`,
        steps:   { upload: true, read: false, delete: false },
        latencyMs: Date.now() - totalStart,
      });
      return;
    }

    // ── 3. Delete ─────────────────────────────────────────────────────────────
    const deleteStart  = Date.now();
    const deleteResult = await deleteObject(UPLOAD_PROBE_KEY);
    const deleteMs     = Date.now() - deleteStart;

    const totalMs = Date.now() - totalStart;

    res.json({
      success: true,
      message: `Upload OK · Read OK · Delete OK (total ${totalMs}ms)`,
      steps: {
        upload: { ok: true,            latencyMs: uploadMs,  bytes: buffer.length },
        read:   { ok: true,            latencyMs: readMs,    bytes: readResult.contentLength, httpStatus: readResult.statusCode },
        delete: { ok: deleteResult.ok, latencyMs: deleteMs,  error: deleteResult.error },
      },
      latencyMs: totalMs,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AdminConfig] test-upload error:', err);
    res.status(502).json({ success: false, error: msg });
  }
});

// ─── POST /api/admin/storage-config/test-download ────────────────────────────
// Uploads a fresh probe, GETs it, validates status/content-length/latency, deletes.

const DOWNLOAD_PROBE_KEY = '__admin_test__/download-probe.txt';

router.post('/test-download', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cfg       = getR2Config();
    const timestamp = new Date().toISOString();
    const content   = `TernakHub R2 download probe\nTimestamp: ${timestamp}\nBucket: ${cfg.bucket}\n`;
    const buffer    = Buffer.from(content, 'utf8');

    // Upload probe first
    const uploadResult = await uploadObject(DOWNLOAD_PROBE_KEY, buffer, 'text/plain');
    if (!uploadResult.ok) {
      res.status(502).json({ success: false, error: `Upload probe gagal: ${uploadResult.error}` });
      return;
    }

    // GET the object — measure download latency
    const downloadStart = Date.now();
    const readResult    = await readObject(DOWNLOAD_PROBE_KEY);
    const latencyMs     = Date.now() - downloadStart;

    // Always attempt cleanup
    await deleteObject(DOWNLOAD_PROBE_KEY).catch(() => undefined);

    if (!readResult.ok) {
      res.status(502).json({
        success:   false,
        error:     `Download gagal: ${readResult.error}`,
        httpStatus: readResult.statusCode,
        latencyMs,
      });
      return;
    }

    res.json({
      success:       true,
      message:       `Download OK — HTTP ${readResult.statusCode} · ${readResult.contentLength} bytes · ${latencyMs}ms`,
      httpStatus:    readResult.statusCode,
      contentLength: readResult.contentLength,
      contentType:   readResult.contentType,
      latencyMs,
      bucket:        cfg.bucket,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AdminConfig] test-download error:', err);
    res.status(502).json({ success: false, error: msg });
  }
});

// ─── POST /api/admin/storage-config/replace-credential ───────────────────────
// Replaces a single credential field and hot-reloads. Accepts:
//   { field: 'accessKeyId' | 'secretAccessKey' | 'cfApiToken', value: string }

router.post('/replace-credential', async (req: Request, res: Response): Promise<void> => {
  const jwt = (req.headers.authorization ?? '').slice(7);
  try {
    const { field, value } = req.body as { field: string; value: string };
    const allowed = ['accessKeyId', 'secretAccessKey', 'cfApiToken'];
    if (!allowed.includes(field)) {
      res.status(400).json({ success: false, error: 'Field tidak dikenali' });
      return;
    }
    if (!value?.trim()) {
      res.status(400).json({ success: false, error: 'Nilai credential tidak boleh kosong' });
      return;
    }

    // Load existing config, replace only the specified credential
    const existing = await loadStorageConfig(jwt);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Konfigurasi storage belum tersimpan. Simpan konfigurasi lengkap terlebih dahulu.' });
      return;
    }

    const input: StorageConfigInput = {
      ...existing,
      // Credential fields: pass masked for the others
      accessKeyId:     field === 'accessKeyId'     ? value : '**masked**',
      secretAccessKey: field === 'secretAccessKey' ? value : '**masked**',
      cfApiToken:      field === 'cfApiToken'       ? value : '**masked**',
    };

    await saveStorageConfig(input, jwt);
    res.json({ success: true, message: 'Credential berhasil diperbarui' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AdminConfig] replace-credential error:', err);
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
