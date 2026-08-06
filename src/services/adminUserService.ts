// ─── Admin User Service — ADM-003 ────────────────────────────────────────────
// Frontend client for the dedicated admin-users Supabase Edge Function.
// Admin operations must never use /api/* because Cloudflare Pages serves those
// paths through the SPA fallback.

import { supabase } from '../lib/supabase';

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
  workspaces: WorkspaceMembership[];
}

export interface WorkspaceMembership {
  id: string;
  role: string;
  status: string;
  joined_at: string | null;
  created_at: string;
  workspace_id: string;
  workspaces: {
    id: string;
    name: string;
    type: string;
    status: string;
    city?: string;
    province?: string;
  } | null;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface AdminUsersEnvelope<T> {
  ok: boolean;
  error?: string;
  data?: T;
  [key: string]: unknown;
}

function isResponse(value: unknown): value is Response {
  return typeof Response !== 'undefined' && value instanceof Response;
}

async function readErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; context?: unknown };
    const context = candidate.context;
    if (isResponse(context)) {
      try {
        const raw = await context.clone().text();
        if (raw.trim()) {
          const body = JSON.parse(raw) as Record<string, unknown>;
          const message = [body.error, body.message, body.error_description, body.msg, body.details, body.hint]
            .find(value => typeof value === 'string' && value.trim());
          if (typeof message === 'string') {
            return `${message}${typeof body.code === 'string' ? ` [${body.code}]` : ''}`;
          }
        }
      } catch {
        // Fall through to the structured error below.
      }
      if (context.status) return `${fallback} (HTTP ${context.status})`;
    }
    if (typeof candidate.message === 'string' && candidate.message.trim()) {
      if (!/edge function returned non-2xx|failed to send a request/i.test(candidate.message)) {
        return candidate.message;
      }
    }
  }
  return fallback;
}

async function invokeAdminUsers<T = unknown>(
  operation: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<AdminUsersEnvelope<T>>(
    'admin-users',
    { body: { action: 'admin-users', operation, ...payload } },
  );
  if (error) throw new Error(await readErrorMessage(error, 'Permintaan ke modul Admin Pengguna gagal. Periksa koneksi dan coba lagi.'));
  if (!data?.ok) throw new Error(data?.error ?? `Operasi admin user gagal: ${operation}`);
  return (data.data ?? data) as T;
}

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

  updateMetadata: (
    id: string,
    data: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> },
  ): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('update-metadata', { id, ...data }),

  suspendUser: (id: string): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('suspend', { id }),

  unsuspendUser: (id: string): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('unsuspend', { id }),

  deleteUser: (id: string): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('delete', { id }),

  resetPassword: (id: string): Promise<{ ok: boolean; link?: string }> =>
    invokeAdminUsers<{ ok: boolean; link?: string }>('reset-password', { id }),

  verifyEmail: (id: string): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('verify-email', { id }),

  resendVerification: (id: string): Promise<{ ok: boolean; link?: string }> =>
    invokeAdminUsers<{ ok: boolean; link?: string }>('resend-verification', { id }),

  signOut: (id: string): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('sign-out', { id }),

  getWorkspaces: (id: string): Promise<WorkspaceMembership[]> =>
    invokeAdminUsers<{ memberships: WorkspaceMembership[] }>('get-workspaces', { id })
      .then(result => result.memberships),

  addWorkspace: (id: string, data: { workspace_id: string; role: string }): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('add-workspace', { id, ...data }),

  updateWorkspace: (id: string, wsId: string, data: { role?: string; status?: string }): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('update-workspace', { id, workspace_member_id: wsId, ...data }),

  removeWorkspace: (id: string, wsId: string): Promise<{ ok: boolean }> =>
    invokeAdminUsers<{ ok: boolean }>('remove-workspace', { id, workspace_member_id: wsId }),
};
