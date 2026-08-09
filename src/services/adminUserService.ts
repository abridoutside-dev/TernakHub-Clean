// ─── Admin User Service — ADM-003 ────────────────────────────────────────────
// Frontend client for the dedicated admin-users Supabase Edge Function.
// Admin operations must never use /api/* because Cloudflare Pages serves those
// paths through the SPA fallback.

import { invokeAdminUsers } from '../repositories/adminUserRepository';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserStatus = 'Active' | 'Suspended' | 'Pending';

export interface UserListItem {
  id: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at?: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  status: UserStatus;
  is_admin: boolean;
  providers: string[];
  mfa_enabled: boolean;
  profile: {
    id: string;
    full_name?: string;
    display_name?: string;
    phone_number?: string;
    avatar_url?: string;
  } | null;
}

export interface UserDetail extends Omit<UserListItem, 'providers'> {
  phone_confirmed_at: string | null;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
  providers: Array<{ provider: string; created_at: string; last_sign_in_at?: string }>;
  factors: Array<{ id: string; type: string; status: string }>;
}

export interface WorkspaceDependency {
  id: string;
  name: string;
  workspace_type: string;
  workspace_status?: string | null;
}

export interface WorkspaceMemberDependency extends WorkspaceDependency {
  workspace_id: string;
  membership_id: string;
  role: string;
  status: string;
  custom_role_id?: string | null;
}

export interface WorkspaceRoleDependency extends WorkspaceDependency {
  workspace_id: string;
  name: string;
  description?: string | null;
  role_kind: 'assigned' | 'created';
  workspace_member_id?: string | null;
}

export interface WorkspaceInvitationDependency extends WorkspaceDependency {
  workspace_id: string;
  email: string;
  role: string;
  status: string;
  expires_at?: string | null;
  created_at: string;
}

export interface UserDependencies {
  ownerWorkspaces: WorkspaceDependency[];
  memberWorkspaces: WorkspaceMemberDependency[];
  roles: WorkspaceRoleDependency[];
  invitations: WorkspaceInvitationDependency[];
  canDelete: boolean;
  reason: string | null;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  emailFilter?: string;
  sort?: string;
  order?: string;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UserStats {
  total: number;
  active: number;
  suspended: number;
  verified: number;
  unverified: number;
  anonymous: number;
}

export interface UserProfileDetail {
  user: {
    id: string;
    email: string;
    phone: string;
    created_at: string;
    updated_at?: string;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
    banned_until: string | null;
    status: UserStatus;
    is_admin: boolean;
    providers: string[];
    mfa_enabled: boolean;
  };
  profile: {
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
  } | null;
}

export interface UserProfileListItem {
  user_id: string;
  email: string;
  phone: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  status: UserStatus;
  is_admin: boolean;
  profile: {
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
  } | null;
}

export interface UserProfileListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UserProfileListResponse {
  profiles: UserProfileListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UserProfileUpdateInput {
  full_name?: string | null;
  display_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  ktp_number?: string | null;
  ktp_verified?: boolean;
  ktp_front_url?: string | null;
  ktp_back_url?: string | null;
  whatsapp_number?: string | null;
  notification_preferences?: Record<string, unknown>;
  security_preferences?: Record<string, unknown>;
  onboarding_completed?: boolean;
  onboarding_step?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Service ──────────────────────────────────────────────────────────────────

export const adminUserService = {
  getStats: (): Promise<UserStats> =>
    invokeAdminUsers<UserStats>('stats'),

  listUsers: (params: UserListParams = {}): Promise<UserListResponse> => {
    const payload = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
    );
    return invokeAdminUsers<UserListResponse>('list', payload);
  },

  getUser: (id: string): Promise<UserDetail> =>
    invokeAdminUsers<UserDetail>('get', { id }),

  updateUser: (id: string, data: { full_name?: string; is_admin?: boolean }): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('update', { id, ...data }),

  suspendUser: (id: string): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('suspend', { id }),

  unsuspendUser: (id: string): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('unsuspend', { id }),

  deleteUser: (id: string): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('delete', { id }),

  getDependencies: (id: string): Promise<UserDependencies> =>
    invokeAdminUsers<UserDependencies>('get-dependencies', { id }),

  resetPassword: (id: string): Promise<{ ok: boolean; link?: string }> =>
    invokeAdminUsers<{ ok: boolean; link?: string }>('reset-password', { id }),

  signOut: (id: string): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('sign-out', { id }),

  listProfiles: (params: UserProfileListParams = {}): Promise<UserProfileListResponse> => {
    const payload = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
    );
    return invokeAdminUsers<UserProfileListResponse>('list-profiles', payload);
  },

  getProfile: (userId: string): Promise<UserProfileDetail> =>
    invokeAdminUsers<UserProfileDetail>('get-profile', { profile_id: userId }),

  updateProfile: async (userId: string, data: UserProfileUpdateInput): Promise<{ ok: boolean; profile?: unknown }> => {
    const raw = await invokeAdminUsers<unknown>('update-profile', { profile_id: userId, ...data });
    if (raw && typeof raw === 'object' && 'ok' in raw) {
      return raw as { ok: boolean; profile?: unknown };
    }
    return { ok: true, profile: raw };
  },

};
