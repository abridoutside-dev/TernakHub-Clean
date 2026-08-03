// ─── Error Message Extractor — ADMIN-PLATFORM-003A ───────────────────────────
//
// Converts any thrown value (Error, PostgrestError, FetchError, plain object,
// string, null, undefined) to a human-readable string safe for display.
//
// Priority:
//   1. error.message            — standard Error / Supabase PostgrestError
//   2. error.error_description  — OAuth / Supabase Auth errors
//   3. error.details            — Supabase PostgrestError extended info
//   4. error.hint               — Supabase PostgrestError hint
//   5. error.code               — Supabase error code (last resort identifier)
//   6. Fallback: "Terjadi kesalahan yang tidak diketahui."
//
// Usage:
//   import { getErrorMessage } from '../../utils/errorUtils';
//   setError(getErrorMessage(e));
// ─────────────────────────────────────────────────────────────────────────────

export const UNKNOWN_ERROR = 'Terjadi kesalahan yang tidak diketahui.';

export function getErrorMessage(error: unknown): string {
  if (error === null || error === undefined) return UNKNOWN_ERROR;

  // Plain string — use as-is
  if (typeof error === 'string') return error.trim() || UNKNOWN_ERROR;

  // Primitives that aren't strings
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);

  // Standard Error (and subclasses)
  if (error instanceof Error) return error.message.trim() || UNKNOWN_ERROR;

  // Plain object (PostgrestError, FetchError, etc.)
  if (typeof error === 'object') {
    const e = error as Record<string, unknown>;

    if (typeof e['message'] === 'string' && e['message'].trim())
      return e['message'].trim();

    if (typeof e['error_description'] === 'string' && e['error_description'].trim())
      return e['error_description'].trim();

    if (typeof e['details'] === 'string' && e['details'].trim())
      return e['details'].trim();

    if (typeof e['hint'] === 'string' && e['hint'].trim())
      return e['hint'].trim();

    if (typeof e['code'] === 'string' && e['code'].trim())
      return e['code'].trim();
  }

  return UNKNOWN_ERROR;
}
