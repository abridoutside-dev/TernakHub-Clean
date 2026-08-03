// ─── Platform Config Repository — ADMIN-PLATFORM-003 ─────────────────────────
//
// CRUD adapter for the platform_config table.
// Schema:  supabase/migrations/20260725000003_foundation.sql
// Grants:  supabase/migrations/20260803000003_platform_config_admin_write.sql
//
// Rows are keyed by `key` (unique text).  The `value` column is JSONB and
// stores the service configuration object.
//
// Service config keys used by Platform Health:
//   service.supabase        — Supabase database / project settings
//   service.storage         — Cloudflare R2 object storage settings
//   service.message_queue   — Message queue settings (not_implemented)
//   service.ai_service      — AI service settings (not_implemented)
//
// Rules:
//   - Never import from pages, components, or contexts.
//   - Write operations require an authenticated Supabase session.
//   - Sensitive values (API keys) are stored in JSONB with is_public=false.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../lib/supabase';

// ─── Error ────────────────────────────────────────────────────────────────────

export class PlatformConfigError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'PlatformConfigError';
  }
}

function guard(error: { message: string; code?: string } | null): void {
  if (error) throw new PlatformConfigError(error.message, error.code);
}

// ─── DB Row ───────────────────────────────────────────────────────────────────

interface PlatformConfigRow {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  is_public: boolean;
  updated_by: string | null;
  updated_at: string;
}

// ─── Service Config Types ─────────────────────────────────────────────────────

export interface SupabaseServiceConfig {
  displayName: string;
  connectionTimeoutMs: number;
  defaultQueryLimit: number;
  autoRefreshIntervalSec: number;
}

export const DEFAULT_SUPABASE_CONFIG: SupabaseServiceConfig = {
  displayName: 'Supabase',
  connectionTimeoutMs: 30000,
  defaultQueryLimit: 1000,
  autoRefreshIntervalSec: 60,
};

export interface StorageServiceConfig {
  // IDENTITY
  accountId:    string;
  bucket:       string;
  endpoint:     string;
  region:       string;
  publicUrl:    string;
  customDomain: string;
  // CREDENTIAL (browser never receives plaintext — stored as masked sentinel)
  accessKeyId:     string;
  secretAccessKey: string;
  cfApiToken:      string;
  // UPLOAD POLICY
  enableStorage:       boolean;
  maxUploadSizeMb:     number;
  allowedMimeTypes:    string[];
  maxResolutionPx:     number;
  autoCompression:     boolean;
  compressionQuality:  number;
  convertToWebP:       boolean;
  preserveExif:        boolean;
  // DELIVERY
  cdnCacheTtlSec:      number;
  signedUrl:           boolean;
  isPublicBucket:      boolean;
  defaultImageQuality: number;
}

export const DEFAULT_STORAGE_CONFIG: StorageServiceConfig = {
  accountId:    '',
  bucket:       'ternakhub-images',
  endpoint:     '',
  region:       'auto',
  publicUrl:    '',
  customDomain: '',
  accessKeyId:     '',
  secretAccessKey: '',
  cfApiToken:      '',
  enableStorage:       true,
  maxUploadSizeMb:     10,
  allowedMimeTypes:    ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxResolutionPx:     1920,
  autoCompression:     true,
  compressionQuality:  80,
  convertToWebP:       false,
  preserveExif:        false,
  cdnCacheTtlSec:      86400,
  signedUrl:           false,
  isPublicBucket:      true,
  defaultImageQuality: 80,
};

export interface MessageQueueConfig {
  enableQueue: boolean;
  maxRetry: number;
  retryDelayMs: number;
  batchSize: number;
  workerConcurrency: number;
  timeoutMs: number;
}

export const DEFAULT_MESSAGE_QUEUE_CONFIG: MessageQueueConfig = {
  enableQueue: false,
  maxRetry: 3,
  retryDelayMs: 5000,
  batchSize: 10,
  workerConcurrency: 2,
  timeoutMs: 30000,
};

export type AIProvider = 'OpenAI' | 'Gemini' | 'Claude' | 'OpenRouter' | 'Ollama' | 'Custom';
export const AI_PROVIDERS: AIProvider[] = ['OpenAI', 'Gemini', 'Claude', 'OpenRouter', 'Ollama', 'Custom'];

export interface AIServiceConfig {
  enableAI: boolean;
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}

export const DEFAULT_AI_SERVICE_CONFIG: AIServiceConfig = {
  enableAI: false,
  provider: 'OpenAI',
  apiKey: '',
  baseUrl: '',
  defaultModel: '',
  temperature: 0.7,
  maxTokens: 2048,
  timeoutMs: 30000,
};

// ─── Config Keys ──────────────────────────────────────────────────────────────

export const CONFIG_KEYS = {
  supabase:      'service.supabase',
  storage:       'service.storage',
  messageQueue:  'service.message_queue',
  aiService:     'service.ai_service',
} as const;

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch a single platform_config row by key.
 * Returns null if the row does not exist yet.
 */
export async function repoGetConfig(key: string): Promise<PlatformConfigRow | null> {
  const { data, error } = await supabase
    .from('platform_config')
    .select('*')
    .eq('key', key)
    .maybeSingle();
  guard(error);
  return data as PlatformConfigRow | null;
}

/**
 * Typed helper — fetch and coerce a service config by key.
 * Returns the default config when the row doesn't exist.
 */
export async function repoGetServiceConfig<T>(
  key: string,
  defaultValue: T,
): Promise<T> {
  const row = await repoGetConfig(key);
  if (!row) return defaultValue;
  return { ...defaultValue, ...(row.value as Partial<T>) };
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Upsert a service configuration.
 * If a row with `key` already exists it is updated; otherwise a new row is
 * inserted.  `updated_by` is set to the current authenticated user's uid.
 */
export async function repoUpsertServiceConfig(
  key: string,
  value: Record<string, unknown>,
  opts?: { description?: string; isPublic?: boolean },
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const updatedBy = user?.id ?? null;

  const { error } = await supabase
    .from('platform_config')
    .upsert(
      {
        key,
        value,
        description: opts?.description ?? null,
        is_public: opts?.isPublic ?? false,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    );

  guard(error);
}
