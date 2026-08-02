// ─── Email Verification Utilities ─────────────────────────────────────────────
// AUTH-007 — Shared helpers for email verification state.
//
// Rules:
//  - Always verify against Supabase Auth (currentUser.email_confirmed_at).
//  - Never rely only on local state.
//  - Import from AuthContext, not from supabase directly.

import type { User } from '@supabase/supabase-js';

/**
 * Returns true if the Supabase user has a confirmed email address.
 * Always reads from the live User object — never caches.
 */
export function isEmailVerified(user: User | null): boolean {
  if (!user) return false;
  return !!user.email_confirmed_at;
}
