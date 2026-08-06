// ─── Admin User Service — ADM-003 ────────────────────────────────────────────
// Frontend API client for /api/admin/users/* endpoints.
// All calls attach the current Supabase session token as Bearer.

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

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? '';
}

async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken();
  const r = await fetch(`/api/admin/users${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  const body = await r.json().catch(() => ({})) as { error?: string };
  if (!r.ok) throw new Error(body.error ?? `Request gagal: ${r.status}`);
  return body as T;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const adminUserService = {
  getStats: (): Promise<UserStats> =>
    apiFetch<UserStats>('/stats'),

  listUsers: (params: UserListParams = {}): Promise<UserListResponse> => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))
    ).toString();
    return apiFetch<UserListResponse>(`${qs ? `?${qs}` : ''}`);
  },

  getUser: (id: string): Promise<UserDetail> =>
    apiFetch<UserDetail>(`/${id}`),

  updateUser: (id: string, data: { full_name?: string; is_admin?: boolean }): Promise<{ ok: boolean }> =>
    apiFetch(`/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  suspendUser: (id: string): Promise<{ ok: boolean }> =>
    apiFetch(`/${id}/suspend`, { method: 'POST' }),

  unsuspendUser: (id: string): Promise<{ ok: boolean }> =>
    apiFetch(`/${id}/unsuspend`, { method: 'POST' }),

  deleteUser: (id: string): Promise<{ ok: boolean }> =>
    apiFetch(`/${id}`, { method: 'DELETE' }),

  resetPassword: (id: string): Promise<{ ok: boolean; link?: string }> =>
    apiFetch(`/${id}/reset-password`, { method: 'POST' }),

  verifyEmail: (id: string): Promise<{ ok: boolean }> =>
    apiFetch(`/${id}/verify-email`, { method: 'POST' }),

  resendVerification: (id: string): Promise<{ ok: boolean; link?: string }> =>
    apiFetch(`/${id}/resend-verification`, { method: 'POST' }),

  signOut: (id: string): Promise<{ ok: boolean }> =>
    apiFetch(`/${id}/sign-out`, { method: 'POST' }),

  getWorkspaces: (id: string): Promise<WorkspaceMembership[]> =>
    apiFetch<WorkspaceMembership[]>(`/${id}/workspaces`),

  addWorkspace: (id: string, data: { workspace_id: string; role: string }): Promise<{ ok: boolean }> =>
    apiFetch(`/${id}/workspaces`, { method: 'POST', body: JSON.stringify(data) }),

  updateWorkspace: (id: string, wsId: string, data: { role?: string; status?: string }): Promise<{ ok: boolean }> =>
    apiFetch(`/${id}/workspaces/${wsId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  removeWorkspace: (id: string, wsId: string): Promise<{ ok: boolean }> =>
    apiFetch(`/${id}/workspaces/${wsId}`, { method: 'DELETE' }),
};
