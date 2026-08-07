// The only browser-to-backend transport for the User domain.
// All User reads and mutations are dispatched to the admin-users Edge Function.

import { supabase } from '../lib/supabase';

export interface AdminUsersEnvelope<T> {
  ok: boolean;
  error?: string;
  data?: T;
  [key: string]: unknown;
}

function isResponse(value: unknown): value is Response {
  return typeof Response !== 'undefined' && value instanceof Response;
}

function sanitizeError(message: string, fallback: string): string {
  const normalized = message.replace(/\s+/g, ' ').trim();
  if (
    /workspaces_owner_id_fkey|owner_id.*auth\.users|violates foreign key constraint.*workspaces/i.test(normalized)
    || /user masih menjadi owner|owner workspace/i.test(normalized)
  ) {
    return 'User masih menjadi Owner Workspace. Pindahkan kepemilikan atau hapus workspace terlebih dahulu.';
  }
  if (
    /violates foreign key constraint|foreign key constraint|sqlstate|postgres|postgrest|database error|syntax error|relation .* does not exist|column .* does not exist|duplicate key|constraint .* failed|stack trace|at \w+\s*\(/i.test(normalized)
  ) {
    return fallback;
  }
  if (!normalized || normalized.length > 240 || /[\r\n]/.test(message)) return fallback;
  return normalized.replace(/\s*\[[A-Z0-9_:-]+\]\s*$/i, '').trim() || fallback;
}

async function errorMessage(error: unknown, fallback: string): Promise<string> {
  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; context?: unknown };
    if (isResponse(candidate.context)) {
      try {
        const raw = await candidate.context.clone().text();
        if (raw.trim()) {
          const body = JSON.parse(raw) as Record<string, unknown>;
          const message = [body.error, body.message, body.error_description, body.msg, body.details, body.hint]
            .find(value => typeof value === 'string' && value.trim());
          if (typeof message === 'string') return sanitizeError(message, fallback);
        }
      } catch {
        // Fall through to the SDK error below.
      }
      if (candidate.context.status) return fallback;
    }
    if (typeof candidate.message === 'string' && candidate.message.trim()
      && !/edge function returned non-2xx|failed to send a request/i.test(candidate.message)) {
      return sanitizeError(candidate.message, fallback);
    }
  }
  return fallback;
}

export async function invokeAdminUsers<T>(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<AdminUsersEnvelope<T>>(
    'admin-users',
    { body: { action: 'admin-users', operation, ...payload } },
  );
  const fallback = 'Permintaan ke modul Admin Pengguna gagal. Periksa koneksi dan coba lagi.';
  if (error) throw new Error(await errorMessage(error, fallback));
  if (!data?.ok) {
    throw new Error(typeof data?.error === 'string' ? sanitizeError(data.error, fallback) : fallback);
  }
  return (data.data ?? data) as T;
}