// ─── User Profile Types — DB-001B ─────────────────────────────────────────────
//
// Maps to the `user_profiles` table in DB-001A.
// The `id` field is the same UUID as the Supabase auth.users id.
//
// Rules:
//  - id is immutable — set once at row creation by the DB trigger.
//  - created_at / updated_at are DB-managed.
//  - All nullable columns are represented as `string | null` (not undefined).

export interface UserProfile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  ktp_number: string | null;
  ktp_verified: boolean;
  ktp_front_url: string | null;
  ktp_back_url: string | null;
  whatsapp_number: string | null;
  notification_preferences: Record<string, unknown>;
  security_preferences: Record<string, unknown>;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

/** Fields that may be changed after profile creation. */
export type UserProfileUpdateInput = Partial<
  Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
>;
