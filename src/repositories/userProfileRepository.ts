// ─── User Profile Repository — DB-001B ────────────────────────────────────────
//
// Async Supabase adapter for the `user_profiles` table (DB-001A).
// This is the ONLY file that touches user_profiles via Supabase.
//
// DB-001A user_profiles columns:
//   id (uuid, PK, FK auth.users.id)
//   full_name, display_name, phone_number, avatar_url, cover_url, bio
//   ktp_number, ktp_verified, ktp_front_url, ktp_back_url
//   whatsapp_number, notification_preferences (jsonb), security_preferences (jsonb)
//   onboarding_completed (bool), onboarding_step (int)
//   created_at, updated_at
//
// The row is auto-created by the DB trigger `handle_new_user()` on signup.
// The application may upsert the row to fill in additional fields.
//
// Rules:
//  - All functions are async and return typed results.
//  - Never import from pages, components, or contexts.
//  - RLS: the authenticated user can read and update only their own row.

import { supabase } from '../lib/supabase';
import type { UserProfile, UserProfileUpdateInput } from '../types/userProfile';

// ─── Error type ───────────────────────────────────────────────────────────────

export class UserProfileRepoError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'UserProfileRepoError';
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Returns the user_profiles row for a given auth user ID.
 * Returns null if the row does not exist yet (new user, trigger delay) or
 * if RLS denies access.
 */
export async function repoGetUserProfile(userId: string): Promise<UserProfile | null> {
  console.log('[userProfileRepository] PROFILE QUERY START', { userId });
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[userProfileRepository] PROFILE QUERY ERROR', { userId, error });
      throw new UserProfileRepoError(error.message, error.code);
    }

    const profile = (data ?? null) as UserProfile | null;
    console.log('[userProfileRepository] PROFILE QUERY SUCCESS', { userId, profile });
    return profile;
  } catch (err) {
    console.error('[userProfileRepository] PROFILE QUERY EXCEPTION', { userId, error: err });
    throw err;
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Updates the user_profiles row for the current authenticated user.
 * Uses upsert to handle the case where the trigger row hasn't been created yet.
 * Returns the updated record, or throws UserProfileRepoError on failure.
 */
export async function repoUpsertUserProfile(
  userId: string,
  updates: UserProfileUpdateInput,
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ id: userId, ...updates })
    .select()
    .single();

  if (error) {
    throw new UserProfileRepoError(error.message, error.code);
  }

  return data as UserProfile;
}
