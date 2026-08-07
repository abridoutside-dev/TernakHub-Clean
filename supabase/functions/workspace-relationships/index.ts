// ─── Workspace Relationships Edge Function ───────────────────────────────────
//
// The browser never accesses workspace_relationships directly. This function
// owns platform-admin authorization, enum translation, lifecycle transitions,
// dependency preflight, and all REST access to the database.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RELATIONSHIP_TYPES = ['Supplier', 'Buyer', 'Partner', 'Afiliasi', 'Kompetitor', 'Mitra', 'Lainnya'] as const;
type RelationshipType = typeof RELATIONSHIP_TYPES[number];
type DbStatus = 'Aktif' | 'Pending' | 'Nonaktif' | 'Ditolak' | 'Diputus';

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
function fail(error: string, code = 'BAD_REQUEST', status = 400): Response {
  return response({ ok: false, error, code }, status);
}
function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}
function isAdmin(user: { user_metadata?: Record<string, unknown> | null; app_metadata?: Record<string, unknown> | null }): boolean {
  const userMetadata = user.user_metadata ?? {};
  const appMetadata = user.app_metadata ?? {};
  return userMetadata.is_admin === true
    || userMetadata.role === 'admin'
    || userMetadata.role === 'system_admin'
    || appMetadata.role === 'admin'
    || appMetadata.role === 'system_admin';
}
function dbStatus(status: string): DbStatus {
  return status === 'Active' ? 'Aktif'
    : status === 'Suspended' ? 'Nonaktif'
      : status === 'Rejected' ? 'Ditolak'
        : status === 'Archived' ? 'Diputus' : 'Pending';
}
function uiStatus(status: unknown): 'Active' | 'Pending' | 'Suspended' | 'Rejected' | 'Archived' {
  return status === 'Aktif' ? 'Active'
    : status === 'Nonaktif' ? 'Suspended'
      : status === 'Ditolak' ? 'Rejected'
        : status === 'Diputus' ? 'Archived' : 'Pending';
}
function headers(key: string): Record<string, string> {
  return { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' };
}
async function restFetch(url: string, path: string, key: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers: { ...headers(key), Prefer: 'return=representation', ...(init.headers ?? {}) },
  });
}
async function bodyMessage(res: Response, fallback: string): Promise<string> {
  try {
    const raw = await res.clone().text();
    const body = JSON.parse(raw) as Record<string, unknown>;
    return typeof body.message === 'string' ? body.message : typeof body.error === 'string' ? body.error : fallback;
  } catch {
    return fallback;
  }
}

type WorkspaceRow = {
  id: string;
  name: string;
  type: string;
  owner_id: string;
  province?: string | null;
  city?: string | null;
  verification_status?: string | null;
};
type ProfileRow = { id: string; full_name?: string | null; display_name?: string | null };
type RelationshipRow = {
  id: string;
  workspace_id_a: string;
  workspace_id_b: string;
  relationship_type: RelationshipType;
  status: DbStatus;
  initiated_by?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

async function readBase(url: string, key: string): Promise<{
  relationships: RelationshipRow[];
  workspaces: WorkspaceRow[];
  profiles: Map<string, ProfileRow>;
}> {
  const [relationshipsResponse, workspacesResponse, profilesResponse] = await Promise.all([
    restFetch(url, '/workspace_relationships?select=*&order=created_at.desc', key),
    restFetch(url, '/workspaces?select=id,name,type,owner_id,province,city,verification_status&order=name.asc', key),
    restFetch(url, '/user_profiles?select=id,full_name,display_name', key),
  ]);
  for (const [result, fallback] of [
    [relationshipsResponse, 'Relationship tidak dapat dimuat.'],
    [workspacesResponse, 'Workspace tidak dapat dimuat.'],
    [profilesResponse, 'Profil owner tidak dapat dimuat.'],
  ] as const) {
    if (!result.ok) throw new Error(await bodyMessage(result, fallback));
  }
  const relationships = await relationshipsResponse.json() as RelationshipRow[];
  const workspaces = await workspacesResponse.json() as WorkspaceRow[];
  const profiles = new Map<string, ProfileRow>(
    (await profilesResponse.json() as ProfileRow[]).map((profile) => [profile.id, profile]),
  );
  return { relationships: Array.isArray(relationships) ? relationships : [], workspaces: Array.isArray(workspaces) ? workspaces : [], profiles };
}

function mapRelationship(row: RelationshipRow, workspaces: Map<string, WorkspaceRow>, profiles: Map<string, ProfileRow>) {
  const ref = (id: string) => {
    const workspace = workspaces.get(id);
    const profile = workspace ? profiles.get(workspace.owner_id) : undefined;
    return {
      workspace_id: id,
      workspace_name: workspace?.name ?? 'Workspace tidak ditemukan',
      workspace_type: workspace?.type ?? 'Unknown',
      owner_name: profile?.full_name ?? profile?.display_name ?? '—',
      location: [workspace?.city, workspace?.province].filter(Boolean).join(', ') || '—',
      verified: workspace?.verification_status === 'Verified' || workspace?.verification_status === 'Approved',
    };
  };
  return {
    relationship_id: row.id,
    workspace: ref(row.workspace_id_a),
    partner: ref(row.workspace_id_b),
    relationship_type: row.relationship_type,
    status: uiStatus(row.status),
    initiated_by_workspace_id: row.initiated_by ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    effective_date: uiStatus(row.status) === 'Active' ? row.updated_at : null,
    expiry_date: null,
    notes: row.notes ?? null,
  };
}

async function main(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return fail('Method tidak didukung.', 'METHOD_NOT_ALLOWED', 405);
  const url = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!url || !serviceRole || !anonKey) return fail('Supabase belum dikonfigurasi.', 'CONFIGURATION', 500);

  const authorization = request.headers.get('Authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return fail('Authorization header diperlukan.', 'UNAUTHORIZED', 401);
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await anon.auth.getUser(token);
  if (authError || !authData.user) return fail('Token tidak valid atau kedaluwarsa.', 'UNAUTHORIZED', 401);
  if (!isAdmin(authData.user)) return fail('Akses ditolak: admin only.', 'FORBIDDEN', 403);

  let payload: Record<string, unknown>;
  try { payload = await request.json() as Record<string, unknown>; } catch { return fail('Request body harus berupa JSON.'); }
  if (payload.action !== 'workspace-relationships') return fail('Action tidak dikenal.');
  const operation = typeof payload.operation === 'string' ? payload.operation : '';
  const base = await readBase(url, serviceRole);
  const workspaceMap = new Map(base.workspaces.map((workspace) => [workspace.id, workspace]));
  const map = (row: RelationshipRow) => mapRelationship(row, workspaceMap, base.profiles);

  if (operation === 'list') {
    const relationships = base.relationships.map(map);
    const stats = {
      total: relationships.length,
      active: relationships.filter((item) => item.status === 'Active').length,
      pending: relationships.filter((item) => item.status === 'Pending').length,
      suspended: relationships.filter((item) => item.status === 'Suspended').length,
      rejected: relationships.filter((item) => item.status === 'Rejected').length,
      archived: relationships.filter((item) => item.status === 'Archived').length,
    };
    return response({
      ok: true,
      data: {
        relationships,
        workspaces: base.workspaces.map((workspace) => ({
          workspace_id: workspace.id,
          workspace_name: workspace.name,
          workspace_type: workspace.type,
          owner_name: base.profiles.get(workspace.owner_id)?.full_name ?? base.profiles.get(workspace.owner_id)?.display_name ?? '—',
        })),
        stats,
      },
    });
  }

  if (operation === 'add') {
    const workspaceA = payload.workspace_id_a;
    const workspaceB = payload.workspace_id_b;
    const type = payload.relationship_type;
    if (!isUuid(workspaceA) || !isUuid(workspaceB) || workspaceA === workspaceB) return fail('Workspace relationship tidak valid.');
    if (!RELATIONSHIP_TYPES.includes(type as RelationshipType)) return fail('Tipe relationship tidak valid.');
    const inserted = await restFetch(url, '/workspace_relationships', serviceRole, {
      method: 'POST',
      body: JSON.stringify({
        workspace_id_a: workspaceA,
        workspace_id_b: workspaceB,
        relationship_type: type,
        initiated_by: workspaceA,
        notes: typeof payload.notes === 'string' ? payload.notes.trim() || null : null,
        status: 'Pending',
      }),
    });
    if (!inserted.ok) return fail(await bodyMessage(inserted, 'Relationship tidak dapat dibuat.'), inserted.status === 409 ? 'DUPLICATE' : 'DATABASE', inserted.status);
    const rows = await inserted.json() as RelationshipRow[];
    return response({ ok: true, data: map(rows[0]) });
  }

  const relationshipId = payload.relationship_id;
  if (!isUuid(relationshipId)) return fail('Relationship ID tidak valid.');
  const existing = base.relationships.find((row) => row.id === relationshipId);
  if (!existing) return fail('Relationship tidak ditemukan.', 'NOT_FOUND', 404);
  if (operation === 'detail') return response({ ok: true, data: map(existing) });

  if (operation === 'preflight-delete') {
    return response({
      ok: true,
      data: {
        relationship: map(existing),
        dependencies: [],
        checked_at: new Date().toISOString(),
      },
    });
  }

  if (operation === 'delete') {
    if (payload.preflight_relationship_id !== relationshipId || typeof payload.preflight_checked_at !== 'string') return fail('Pre-check delete wajib dilakukan.', 'PREFLIGHT_REQUIRED', 409);
    const removed = await restFetch(url, `/workspace_relationships?id=eq.${encodeURIComponent(relationshipId)}`, serviceRole, { method: 'DELETE' });
    if (!removed.ok) return fail(await bodyMessage(removed, 'Relationship tidak dapat dihapus.'), 'DATABASE', 500);
    return response({ ok: true, data: { removed: true } });
  }

  const transitions: Record<string, { from: DbStatus[]; to: DbStatus }> = {
    approve: { from: ['Pending'], to: 'Aktif' },
    reject: { from: ['Pending'], to: 'Ditolak' },
    suspend: { from: ['Aktif'], to: 'Nonaktif' },
    reactivate: { from: ['Nonaktif'], to: 'Aktif' },
  };
  const transition = transitions[operation];
  if (!transition) return fail('Operasi relationship tidak dikenal.');
  if (!transition.from.includes(existing.status)) return fail('Transisi status relationship tidak valid.', 'INVALID_TRANSITION', 409);
  const updated = await restFetch(url, `/workspace_relationships?id=eq.${encodeURIComponent(relationshipId)}`, serviceRole, {
    method: 'PATCH',
    body: JSON.stringify({ status: transition.to }),
  });
  if (!updated.ok) return fail(await bodyMessage(updated, 'Status relationship tidak dapat diperbarui.'), 'DATABASE', 500);
  const rows = await updated.json() as RelationshipRow[];
  return response({ ok: true, data: map(rows[0] ?? { ...existing, status: transition.to }) });
}

Deno.serve(async (request) => {
  try { return await main(request); } catch { return fail('Operasi workspace relationship gagal.', 'INTERNAL', 500); }
});