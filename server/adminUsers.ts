// ─── Admin User Management API — ADM-003 ─────────────────────────────────────
// All routes require a valid admin JWT (user_metadata.is_admin === true).
// Uses Supabase Auth Admin REST API + PostgREST (service role) — no createClient()
// because createClient() throws on auth.getUser() in Node.js 20 (WebSocket crash).

import type { Request, Response, NextFunction } from 'express';

// ─── Config helpers ───────────────────────────────────────────────────────────

function getConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !serviceKey) throw new Error('Supabase admin tidak dikonfigurasi');
  return { url: url.replace(/\/$/, ''), serviceKey };
}

function adminHeaders(key: string): Record<string, string> {
  return { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' };
}

async function adminFetch(url: string, path: string, key: string, init?: RequestInit): Promise<Response> {
  return fetch(`${url}/auth/v1/admin${path}`, {
    ...init,
    headers: { ...adminHeaders(key), ...(init?.headers ?? {}) },
  });
}

async function restFetch(url: string, path: string, key: string, init?: RequestInit): Promise<Response> {
  return fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers ?? {}),
    },
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  banned_until?: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  identities?: Array<{ provider: string; id: string; created_at: string; last_sign_in_at?: string }>;
  factors?: Array<{ id: string; factor_type: string; status: string }>;
}

// ─── Middleware: verify admin ─────────────────────────────────────────────────

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '').trim();
  if (!token) {
    res.status(401).json({ error: 'Tidak terautentikasi' });
    return;
  }
  try {
    const { url, serviceKey } = getConfig();
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: serviceKey },
    });
    if (!r.ok) {
      res.status(401).json({ error: 'Token tidak valid' });
      return;
    }
    const user = await r.json();
    const meta = user?.user_metadata ?? {};
    // Mirror AdminGuard: source of truth is user_metadata.role (set by platformInitService).
    // app_metadata.role is kept as fallback for service-role or future migrations.
    const appMeta = user?.app_metadata ?? {};
    const isAdmin =
      meta.is_admin === true ||
      meta.role === 'admin' ||
      meta.role === 'system_admin' ||
      appMeta.role === 'admin' ||
      appMeta.role === 'system_admin' ||
      user?.role === 'service_role';
    if (!isAdmin) {
      res.status(403).json({ error: 'Akses ditolak — hanya admin' });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: 'Gagal memverifikasi autentikasi' });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchAllAuthUsers(url: string, key: string): Promise<AuthUser[]> {
  const all: AuthUser[] = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const r = await adminFetch(url, `/users?page=${page}&per_page=${perPage}`, key);
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? `Auth API error ${r.status}`);
    }
    const data = await r.json() as { users?: AuthUser[] } | AuthUser[];
    const users = Array.isArray(data) ? data : ((data as { users?: AuthUser[] }).users ?? []);
    all.push(...users);
    if (users.length < perPage) break;
    page++;
  }
  return all;
}

function deriveStatus(u: AuthUser): 'Active' | 'Suspended' | 'Pending' {
  if (u.banned_until && new Date(u.banned_until) > new Date()) return 'Suspended';
  if (!u.email_confirmed_at && !u.phone_confirmed_at) return 'Pending';
  return 'Active';
}

// ─── GET /api/admin/users/stats ───────────────────────────────────────────────

export async function getUserStats(_req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const users = await fetchAllAuthUsers(url, serviceKey);
    const now = new Date();
    const total = users.length;
    const suspended = users.filter(u => u.banned_until && new Date(u.banned_until) > now).length;
    const verified = users.filter(u => !!u.email_confirmed_at || !!u.phone_confirmed_at).length;
    const unverified = users.filter(u => !u.email_confirmed_at && !u.phone_confirmed_at).length;
    const anonymous = users.filter(u => {
      const ids = u.identities ?? [];
      return ids.length === 0 || ids.every(i => i.provider === 'anonymous');
    }).length;
    const active = users.filter(u => {
      if (u.banned_until && new Date(u.banned_until) > now) return false;
      return !!u.email_confirmed_at || !!u.phone_confirmed_at;
    }).length;
    res.json({ total, active, suspended, verified, unverified, anonymous });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal memuat statistik' });
  }
}

// ─── GET /api/admin/users ─────────────────────────────────────────────────────

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();

    const page  = Math.max(1, parseInt((req.query.page  as string) ?? '1',  10));
    const limit = Math.min(Math.max(1, parseInt((req.query.limit as string) ?? '20', 10)), 100);
    const search      = ((req.query.search      as string) ?? '').toLowerCase().trim();
    const status      = (req.query.status       as string) ?? 'all';
    const emailFilter = (req.query.emailFilter  as string) ?? 'all'; // all | verified | unverified
    const sortBy      = (req.query.sort         as string) ?? 'created_at';
    const order       = (req.query.order        as string) ?? 'desc';

    const [allUsers, profilesRes] = await Promise.all([
      fetchAllAuthUsers(url, serviceKey),
      restFetch(url, '/user_profiles?select=id,full_name,display_name,phone_number,avatar_url', serviceKey),
    ]);

    const profiles = profilesRes.ok ? await profilesRes.json() as Array<{ id: string; full_name?: string; display_name?: string; phone_number?: string; avatar_url?: string }> : [];
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // Merge auth user with profile
    let users = allUsers.map(u => {
      const p = profileMap.get(u.id);
      return { ...u, profile: p ?? null };
    });

    // Filter
    if (search) {
      users = users.filter(u => {
        const p = profileMap.get(u.id);
        const name = (p?.full_name ?? p?.display_name ?? '').toLowerCase();
        return (
          name.includes(search) ||
          (u.email ?? '').toLowerCase().includes(search) ||
          u.id.toLowerCase().includes(search) ||
          (u.phone ?? '').includes(search)
        );
      });
    }
    if (status !== 'all') {
      users = users.filter(u => deriveStatus(u) === status);
    }
    if (emailFilter === 'verified') {
      users = users.filter(u => !!u.email_confirmed_at || !!u.phone_confirmed_at);
    } else if (emailFilter === 'unverified') {
      users = users.filter(u => !u.email_confirmed_at && !u.phone_confirmed_at);
    }

    // Sort
    users.sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      if (sortBy === 'email')          { va = a.email ?? ''; vb = b.email ?? ''; }
      else if (sortBy === 'last_sign_in_at') { va = a.last_sign_in_at ?? ''; vb = b.last_sign_in_at ?? ''; }
      else if (sortBy === 'name') {
        const pa = profileMap.get(a.id); const pb = profileMap.get(b.id);
        va = (pa?.full_name ?? pa?.display_name ?? '').toLowerCase();
        vb = (pb?.full_name ?? pb?.display_name ?? '').toLowerCase();
      }
      else { va = a.created_at; vb = b.created_at; }
      if (va < vb) return order === 'asc' ? -1 : 1;
      if (va > vb) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const total    = users.length;
    const start    = (page - 1) * limit;
    const pageData = users.slice(start, start + limit).map(u => ({
      id: u.id,
      email: u.email ?? '',
      phone: u.phone ?? '',
      created_at: u.created_at,
      updated_at: u.updated_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      email_confirmed_at: u.email_confirmed_at ?? null,
      banned_until: u.banned_until ?? null,
      status: deriveStatus(u),
      is_admin: u.user_metadata?.is_admin === true || u.app_metadata?.role === 'admin' || u.app_metadata?.role === 'system_admin',
      providers: (u.identities ?? []).map(i => i.provider),
      mfa_enabled: (u.factors ?? []).some(f => f.status === 'verified'),
      profile: profileMap.get(u.id) ?? null,
    }));

    res.json({ users: pageData, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal memuat users' });
  }
}

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────

export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const { id } = req.params;

    const [userRes, profileRes, workspacesRes] = await Promise.all([
      adminFetch(url, `/users/${id}`, serviceKey),
      restFetch(url, `/user_profiles?id=eq.${id}&select=*`, serviceKey),
      restFetch(url, `/workspace_members?user_id=eq.${id}&select=id,role,status,joined_at,created_at,workspace_id,workspaces(id,name,type,status)`, serviceKey),
    ]);

    if (!userRes.ok) {
      res.status(userRes.status).json({ error: 'User tidak ditemukan' });
      return;
    }

    const user = await userRes.json() as AuthUser;
    const profiles = profileRes.ok ? await profileRes.json() as unknown[] : [];
    const profile = Array.isArray(profiles) && profiles.length > 0 ? profiles[0] : null;
    const workspaceMemberships = workspacesRes.ok ? await workspacesRes.json() : [];

    res.json({
      id: user.id,
      email: user.email ?? '',
      phone: user.phone ?? '',
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
      email_confirmed_at: user.email_confirmed_at ?? null,
      phone_confirmed_at: user.phone_confirmed_at ?? null,
      banned_until: user.banned_until ?? null,
      status: deriveStatus(user),
      is_admin: user.user_metadata?.is_admin === true || user.app_metadata?.role === 'admin' || user.app_metadata?.role === 'system_admin',
      user_metadata: user.user_metadata ?? {},
      app_metadata: user.app_metadata ?? {},
      providers: (user.identities ?? []).map(i => ({ provider: i.provider, created_at: i.created_at, last_sign_in_at: i.last_sign_in_at })),
      factors: (user.factors ?? []).map(f => ({ id: f.id, type: f.factor_type, status: f.status })),
      mfa_enabled: (user.factors ?? []).some(f => f.status === 'verified'),
      profile,
      workspaces: workspaceMemberships,
    });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal memuat user' });
  }
}

// ─── PATCH /api/admin/users/:id ───────────────────────────────────────────────

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const { id } = req.params;
    const { full_name, is_admin } = req.body as { full_name?: string; is_admin?: boolean };

    // Get current user to merge metadata
    const curR = await adminFetch(url, `/users/${id}`, serviceKey);
    if (!curR.ok) { res.status(404).json({ error: 'User tidak ditemukan' }); return; }
    const cur = await curR.json() as AuthUser;

    const newMeta = { ...(cur.user_metadata ?? {}) };
    if (full_name !== undefined) newMeta.full_name = full_name;
    if (is_admin !== undefined)  newMeta.is_admin  = is_admin;

    const r = await adminFetch(url, `/users/${id}`, serviceKey, {
      method: 'PUT',
      body: JSON.stringify({ user_metadata: newMeta }),
    });

    // Update user_profiles table too if full_name given
    if (full_name !== undefined) {
      await restFetch(url, `/user_profiles?id=eq.${id}`, serviceKey, {
        method: 'PATCH',
        body: JSON.stringify({ full_name }),
      });
    }

    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string };
      res.status(r.status).json({ error: err.message ?? 'Gagal memperbarui user' });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal memperbarui user' });
  }
}

// ─── POST /api/admin/users/:id/suspend ───────────────────────────────────────

export async function suspendUser(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const { id } = req.params;
    const r = await adminFetch(url, `/users/${id}`, serviceKey, {
      method: 'PUT',
      body: JSON.stringify({ ban_duration: '876600h' }), // ~100 years
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string };
      res.status(r.status).json({ error: err.message ?? 'Gagal menangguhkan user' });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal menangguhkan user' });
  }
}

// ─── POST /api/admin/users/:id/unsuspend ─────────────────────────────────────

export async function unsuspendUser(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const { id } = req.params;
    const r = await adminFetch(url, `/users/${id}`, serviceKey, {
      method: 'PUT',
      body: JSON.stringify({ ban_duration: 'none' }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string };
      res.status(r.status).json({ error: err.message ?? 'Gagal mengaktifkan user' });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal mengaktifkan user' });
  }
}

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const { id } = req.params;
    const r = await adminFetch(url, `/users/${id}`, serviceKey, { method: 'DELETE' });
    if (!r.ok && r.status !== 404) {
      const err = await r.json().catch(() => ({})) as { message?: string };
      res.status(r.status).json({ error: err.message ?? 'Gagal menghapus user' });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal menghapus user' });
  }
}

// ─── POST /api/admin/users/:id/reset-password ────────────────────────────────

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const { id } = req.params;

    const curR = await adminFetch(url, `/users/${id}`, serviceKey);
    if (!curR.ok) { res.status(404).json({ error: 'User tidak ditemukan' }); return; }
    const cur = await curR.json() as AuthUser;
    if (!cur.email) { res.status(400).json({ error: 'User tidak memiliki email' }); return; }

    const r = await adminFetch(url, '/generate_link', serviceKey, {
      method: 'POST',
      body: JSON.stringify({ type: 'recovery', email: cur.email }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string };
      res.status(r.status).json({ error: err.message ?? 'Gagal membuat link reset password' });
      return;
    }
    const data = await r.json() as { action_link?: string; properties?: { action_link?: string } };
    const link = data.action_link ?? data.properties?.action_link ?? null;
    res.json({ ok: true, link });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal reset password' });
  }
}

// ─── POST /api/admin/users/:id/verify-email ──────────────────────────────────

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const { id } = req.params;
    const r = await adminFetch(url, `/users/${id}`, serviceKey, {
      method: 'PUT',
      body: JSON.stringify({ email_confirm: true }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string };
      res.status(r.status).json({ error: err.message ?? 'Gagal memverifikasi email' });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal memverifikasi email' });
  }
}

// ─── POST /api/admin/users/:id/resend-verification ───────────────────────────

export async function resendVerification(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const { id } = req.params;

    const curR = await adminFetch(url, `/users/${id}`, serviceKey);
    if (!curR.ok) { res.status(404).json({ error: 'User tidak ditemukan' }); return; }
    const cur = await curR.json() as AuthUser;
    if (!cur.email) { res.status(400).json({ error: 'User tidak memiliki email' }); return; }

    const r = await adminFetch(url, '/generate_link', serviceKey, {
      method: 'POST',
      body: JSON.stringify({ type: 'signup', email: cur.email }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string };
      res.status(r.status).json({ error: err.message ?? 'Gagal mengirim verifikasi' });
      return;
    }
    const data = await r.json() as { action_link?: string; properties?: { action_link?: string } };
    const link = data.action_link ?? data.properties?.action_link ?? null;
    res.json({ ok: true, link });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal mengirim verifikasi' });
  }
}

// ─── POST /api/admin/users/:id/sign-out ──────────────────────────────────────

export async function signOutUser(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const { id } = req.params;
    const r = await adminFetch(url, `/users/${id}/logout`, serviceKey, {
      method: 'POST',
      body: JSON.stringify({ scope: 'global' }),
    });
    // 200 or 204 = success; 404 = user not found
    if (!r.ok && r.status !== 204 && r.status !== 404) {
      const err = await r.json().catch(() => ({})) as { message?: string };
      res.status(r.status).json({ error: err.message ?? 'Gagal sign out user' });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal sign out user' });
  }
}

// ─── GET /api/admin/users/:id/workspaces ─────────────────────────────────────

export async function getUserWorkspaces(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const { id } = req.params;
    const r = await restFetch(
      url,
      `/workspace_members?user_id=eq.${id}&select=id,role,status,joined_at,created_at,workspace_id,workspaces(id,name,type,status,city,province)`,
      serviceKey,
    );
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string };
      res.status(r.status).json({ error: err.message ?? 'Gagal memuat workspace' });
      return;
    }
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal memuat workspace' });
  }
}

// ─── POST /api/admin/users/:id/workspaces ────────────────────────────────────

export async function addWorkspaceMembership(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const { id } = req.params;
    const { workspace_id, role } = req.body as { workspace_id: string; role: string };
    if (!workspace_id || !role) {
      res.status(400).json({ error: 'workspace_id dan role wajib diisi' });
      return;
    }
    const r = await restFetch(url, '/workspace_members', serviceKey, {
      method: 'POST',
      body: JSON.stringify({
        workspace_id,
        user_id: id,
        role,
        status: 'Aktif',
        joined_at: new Date().toISOString(),
      }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string; details?: string };
      const msg = err.details?.includes('already exists') ? 'User sudah menjadi anggota workspace ini' : (err.message ?? 'Gagal menambah membership');
      res.status(r.status).json({ error: msg });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal menambah membership' });
  }
}

// ─── PATCH /api/admin/users/:id/workspaces/:wsId ─────────────────────────────

export async function updateWorkspaceMembership(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const { id, wsId } = req.params;
    const { role, status } = req.body as { role?: string; status?: string };
    if (!role && !status) {
      res.status(400).json({ error: 'role atau status wajib diisi' });
      return;
    }
    const body: Record<string, string> = {};
    if (role)   body.role   = role;
    if (status) body.status = status;
    const r = await restFetch(url, `/workspace_members?id=eq.${wsId}&user_id=eq.${id}`, serviceKey, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string };
      res.status(r.status).json({ error: err.message ?? 'Gagal mengubah membership' });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal mengubah membership' });
  }
}

// ─── DELETE /api/admin/users/:id/workspaces/:wsId ────────────────────────────

export async function removeWorkspaceMembership(req: Request, res: Response): Promise<void> {
  try {
    const { url, serviceKey } = getConfig();
    const { id, wsId } = req.params;
    const r = await restFetch(url, `/workspace_members?id=eq.${wsId}&user_id=eq.${id}`, serviceKey, {
      method: 'DELETE',
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string };
      res.status(r.status).json({ error: err.message ?? 'Gagal menghapus membership' });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Gagal menghapus membership' });
  }
}
