// ─── Admin Storage Config Routes — ADMIN-PLATFORM-003B ────────────────────────
//
// Provides server-side API for managing Cloudflare R2 configuration from
// the Admin Dashboard. All routes require an authenticated Platform Administrator.
//
// Routes:
//   GET  /api/admin/storage-config              — read config (credentials masked)
//   POST /api/admin/storage-config              — save config + hot-reload
//   POST /api/admin/storage-config/test-connection — test bucket health
//   POST /api/admin/storage-config/test-upload     — upload a small test object
//   POST /api/admin/storage-config/test-download   — download the test object
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
  r2ObjectApiUrl,
  authHeaders,
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

router.post('/test-connection', async (_req: Request, res: Response): Promise<void> => {
  try {
    const start  = Date.now();
    const result = await checkBucketHealth();
    const ms     = Date.now() - start;
    if (result.ok) {
      res.json({ success: true, message: `Bucket "${result.bucket}" reachable (${ms}ms)` });
    } else {
      res.status(503).json({ success: false, error: result.message });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AdminConfig] test-connection error:', err);
    res.status(503).json({ success: false, error: msg });
  }
});

// ─── POST /api/admin/storage-config/test-upload ──────────────────────────────

const TEST_OBJECT_KEY = '__admin_test__/connectivity-probe.txt';

router.post('/test-upload', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cfg       = getR2Config();
    const timestamp = new Date().toISOString();
    const content   = `TernakHub R2 connectivity probe\nTimestamp: ${timestamp}\nBucket: ${cfg.bucket}\n`;
    const buffer    = Buffer.from(content, 'utf8');

    const start  = Date.now();
    const result = await uploadObject(TEST_OBJECT_KEY, buffer, 'text/plain');
    const ms     = Date.now() - start;

    if (result.ok) {
      res.json({
        success:  true,
        message:  `Upload berhasil (${ms}ms) — ${buffer.length} bytes`,
        key:      TEST_OBJECT_KEY,
        url:      result.url,
      });
    } else {
      res.status(502).json({ success: false, error: result.error });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AdminConfig] test-upload error:', err);
    res.status(502).json({ success: false, error: msg });
  }
});

// ─── POST /api/admin/storage-config/test-download ────────────────────────────

router.post('/test-download', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cfg = getR2Config();
    const url = r2ObjectApiUrl(TEST_OBJECT_KEY);

    const start = Date.now();
    const r2Res = await fetch(url, {
      method:  'GET',
      headers: authHeaders(),
    });
    const ms = Date.now() - start;

    if (r2Res.ok) {
      const text    = await r2Res.text();
      const preview = text.slice(0, 120).replace(/\n/g, ' ');
      res.json({
        success: true,
        message: `Download berhasil (${ms}ms) — ${text.length} bytes`,
        preview,
        bucket: cfg.bucket,
        key:    TEST_OBJECT_KEY,
      });
    } else if (r2Res.status === 404) {
      res.status(404).json({
        success: false,
        error:   `Object "${TEST_OBJECT_KEY}" tidak ditemukan. Jalankan Test Upload terlebih dahulu.`,
      });
    } else {
      const text = await r2Res.text().catch(() => r2Res.statusText);
      res.status(r2Res.status).json({ success: false, error: `HTTP ${r2Res.status}: ${text}` });
    }
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
