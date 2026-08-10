// ─── Ownership Transfers Edge Function ────────────────────────────────────────
//
// The browser never accesses ownership_transfers, workspace_members, users,
// or audit tables directly. This function owns authorization, joins, lifecycle
// validation, and the atomic ownership transition RPC.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = ['Draft', 'Requested', 'PendingVerification', 'Approved', 'Rejected', 'Completed', 'Cancelled', 'Failed'] as const;
type Status = typeof STATUSES[number];

type User = {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
};
type Profile = { id: string; full_name?: string | null; display_name?: string | null; phone_number?: string | null; whatsapp_number?: string | null };
type Workspace = {
  id: string;
  name: string;
  type: string;
  owner_id: string;
  metadata?: Record<string, unknown> | null;
  province?: string | null;
  city?: string | null;
};
type TransferRow = {
  id: string;
  workspace_id: string;
  from_user_id: string;
  to_user_id: string;
  status: Status;
  reason?: string | null;
  notes?: string | null;
  requested_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
};
type MemberRow = { id: string; workspace_id: string; user_id: string; role: string; status: string };

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
function isAdmin(user: User): boolean {
  const userMetadata = user.user_metadata ?? {};
  const appMetadata = user.app_metadata ?? {};
  return userMetadata.is_admin === true
    || userMetadata.system_admin === true
    || userMetadata.role === 'admin'
    || userMetadata.role === 'system_admin'
    || appMetadata.role === 'admin'
    || appMetadata.role === 'system_admin';
}
function displayName(profile: Profile | undefined, userId: string): string {
  return profile?.full_name || profile?.display_name || `User ${userId.slice(0, 8)}`;
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
async function bodyMessage(result: Response, fallback: string): Promise<string> {
  try {
    const body = JSON.parse(await result.clone().text()) as Record<string, unknown>;
    const message = [body.message, body.error, body.details, body.hint]
      .find((value) => typeof value === 'string' && value.trim());
    return typeof message === 'string' ? message : fallback;
  } catch {
    return fallback;
  }
}
function userRef(userId: string, users: Map<string, User>, profiles: Map<string, Profile>) {
  const user = users.get(userId);
  const profile = profiles.get(userId);
  return {
    user_id: userId,
    full_name: displayName(profile, userId),
    email: user?.email ?? '—',
    phone: profile?.phone_number ?? profile?.whatsapp_number ?? user?.phone ?? null,
  };
}

async function readUsers(admin: ReturnType<typeof createClient>): Promise<User[]> {
  const users: User[] = [];
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const result = await admin.auth.admin.listUsers({ page, perPage });
    if (result.error) throw new Error('Daftar user tidak dapat dimuat.');
    const pageUsers = result.data.users as User[];
    users.push(...pageUsers);
    if (pageUsers.length < perPage) return users;
  }
}

async function readBase(url: string, serviceKey: string) {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const [workspacesResult, transfersResult, membersResult, profilesResult, users] = await Promise.all([
    restFetch(url, '/workspaces?select=id,name,type,owner_id,metadata,province,city&order=name.asc', serviceKey),
    restFetch(url, '/ownership_transfers?select=*&order=created_at.desc', serviceKey),
    restFetch(url, '/workspace_members?select=id,workspace_id,user_id,role,status', serviceKey),
    restFetch(url, '/user_profiles?select=id,full_name,display_name,phone_number,whatsapp_number', serviceKey),
    readUsers(admin),
  ]);
  for (const [result, fallback] of [
    [workspacesResult, 'Workspace tidak dapat dimuat.'],
    [transfersResult, 'Transfer tidak dapat dimuat.'],
    [membersResult, 'Member workspace tidak dapat dimuat.'],
    [profilesResult, 'Profil user tidak dapat dimuat.'],
  ] as const) {
    if (!result.ok) throw new Error(await bodyMessage(result, fallback));
  }
  return {
    workspaces: await workspacesResult.json() as Workspace[],
    transfers: await transfersResult.json() as TransferRow[],
    members: await membersResult.json() as MemberRow[],
    profiles: new Map<string, Profile>((await profilesResult.json() as Profile[]).map((profile) => [profile.id, profile])),
    users: new Map<string, User>(users.map((user) => [user.id, user])),
  };
}

function mapWorkspace(workspace: Workspace, members: MemberRow[]) {
  return {
    workspace_id: workspace.id,
    workspace_name: workspace.name,
    workspace_type: workspace.type,
    workspace_slug: typeof workspace.metadata?.slug === 'string' ? workspace.metadata.slug : workspace.id,
    location: [workspace.city, workspace.province].filter(Boolean).join(', ') || '—',
    owner_user_id: workspace.owner_id,
    member_count: members.filter((member) => member.workspace_id === workspace.id).length,
  };
}

function mapTransfer(
  row: TransferRow,
  workspaces: Map<string, Workspace>,
  users: Map<string, User>,
  profiles: Map<string, Profile>,
  members: MemberRow[],
) {
  const workspace = workspaces.get(row.workspace_id);
  if (!workspace) return null;
  return {
    transfer_id: row.id,
    workspace: mapWorkspace(workspace, members),
    current_owner: userRef(row.from_user_id, users, profiles),
    proposed_owner: userRef(row.to_user_id, users, profiles),
    status: row.status,
    reason: row.reason ?? null,
    notes: row.notes ?? null,
    requested_at: row.requested_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at ?? null,
  };
}

async function readHistoryAndAudit(url: string, key: string, transferId: string) {
  const [historyResult, auditResult] = await Promise.all([
    restFetch(url, `/ownership_transfer_history?ownership_transfer_id=eq.${encodeURIComponent(transferId)}&select=*&order=created_at.desc`, key),
    restFetch(url, `/global_audit_trail?entity_type=eq.ownership_transfer&entity_id=eq.${encodeURIComponent(transferId)}&select=id,action,user_id,old_data,new_data,created_at&order=created_at.desc`, key),
  ]);
  if (!historyResult.ok || !auditResult.ok) throw new Error('Riwayat transfer tidak dapat dimuat.');
  return {
    history: await historyResult.json(),
    audit_log: await auditResult.json(),
  };
}

async function main(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return fail('Method tidak didukung.', 'METHOD_NOT_ALLOWED', 405);

  const url = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!url || !serviceKey || !anonKey) return fail('Supabase belum dikonfigurasi.', 'CONFIGURATION', 500);
  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/, '');
  if (!token) return fail('Authorization header diperlukan.', 'UNAUTHORIZED', 401);
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const authResult = await anon.auth.getUser(token);
  if (authResult.error || !authResult.data.user) return fail('Token tidak valid atau kedaluwarsa.', 'UNAUTHORIZED', 401);
  if (!isAdmin(authResult.data.user as User)) return fail('Akses ditolak: admin only.', 'FORBIDDEN', 403);

  let payload: Record<string, unknown>;
  try { payload = await request.json() as Record<string, unknown>; } catch { return fail('Request body harus berupa JSON.'); }
  if (payload.action !== 'ownership-transfers') return fail('Action tidak dikenal.');
  const operation = typeof payload.operation === 'string' ? payload.operation : '';
  let base;
  try {
    base = await readBase(url, serviceKey);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Data dasar tidak dapat dimuat.', 'DATABASE', 500);
  }
  const workspaceMap = new Map(base.workspaces.map((workspace) => [workspace.id, workspace]));
  const map = (row: TransferRow) => mapTransfer(row, workspaceMap, base.users, base.profiles, base.members);

  if (operation === 'list') {
    const transfers = base.transfers.map(map).filter(Boolean);
    const stats = Object.fromEntries(STATUSES.map((status) => [
      status === 'PendingVerification' ? 'pending_verification' : status.toLowerCase(),
      base.transfers.filter((row) => row.status === status).length,
    ]));
    return response({
      ok: true,
      data: {
        transfers,
        workspaces: base.workspaces.map((workspace) => ({
          ...mapWorkspace(workspace, base.members),
          owner: userRef(workspace.owner_id, base.users, base.profiles),
        })),
        users: [...base.users.values()].map((user) => userRef(user.id, base.users, base.profiles)),
        stats: { total: base.transfers.length, ...stats },
      },
    });
  }

  const transferId = payload.transfer_id;
  if (!isUuid(transferId)) return fail('Transfer ID tidak valid.');
  const existing = base.transfers.find((row) => row.id === transferId);
  if (!existing) return fail('Transfer tidak ditemukan.', 'NOT_FOUND', 404);
  const mapped = map(existing);
  if (!mapped) return fail('Workspace transfer tidak ditemukan.', 'NOT_FOUND', 404);

  if (operation === 'detail' || operation === 'history') {
    let details;
    try {
      details = await readHistoryAndAudit(url, serviceKey, transferId);
    } catch (error) {
      return fail(error instanceof Error ? error.message : 'Riwayat transfer tidak dapat dimuat.', 'DATABASE', 500);
    }
    return response({ ok: true, data: { ...mapped, ...details } });
  }

  if (operation === 'preflight') {
    const dependencies = [
      {
        key: 'pending_transfer',
        label: 'Transfer aktif lainnya',
        count: base.transfers.filter((row) => row.workspace_id === existing.workspace_id
          && row.id !== existing.id
          && ['Draft', 'Requested', 'PendingVerification', 'Approved'].includes(row.status)).length,
        description: 'Satu workspace hanya boleh memiliki satu proses transfer aktif.',
        blocks_transfer: true,
      },
      {
        key: 'current_owner_membership',
        label: 'Membership owner saat ini',
        count: base.members.filter((member) => member.workspace_id === existing.workspace_id
          && member.user_id === existing.from_user_id
          && member.role === 'Owner'
          && member.status === 'Aktif').length,
        description: 'Owner saat ini harus masih tercatat sebagai Owner aktif.',
        blocks_transfer: true,
      },
      {
        key: 'proposed_owner_membership',
        label: 'Membership penerima',
        count: base.members.filter((member) => member.workspace_id === existing.workspace_id
          && member.user_id === existing.to_user_id).length,
        description: 'Membership penerima akan dipromosikan atomically saat approve.',
        blocks_transfer: false,
      },
    ];
    return response({ ok: true, data: { transfer: mapped, dependencies, checked_at: new Date().toISOString() } });
  }

  if (operation === 'create') return fail('Create tidak memakai transfer_id.');

  if (operation === 'approve' || operation === 'reject' || operation === 'cancel') {
    const reason = typeof payload.reason === 'string' ? payload.reason : null;
    if (operation === 'approve') {
      const preflight = base.transfers.filter((row) => row.workspace_id === existing.workspace_id
        && row.id !== existing.id
        && ['Draft', 'Requested', 'PendingVerification', 'Approved'].includes(row.status));
      if (preflight.length) return fail('Workspace masih memiliki transfer aktif lainnya.', 'DEPENDENCY', 409);
    }
    const rpc = await restFetch(url, '/rpc/ownership_transfer_transition', serviceKey, {
      method: 'POST',
      body: JSON.stringify({
        p_transfer_id: transferId,
        p_actor_id: authResult.data.user.id,
        p_action: operation,
        p_reason: reason,
      }),
    });
    if (!rpc.ok) return fail(await bodyMessage(rpc, 'Status transfer tidak dapat diperbarui.'), 'INVALID_TRANSITION', rpc.status === 409 ? 409 : 500);
    let rows: TransferRow[];
    try {
      rows = await rpc.json() as TransferRow[];
    } catch {
      return fail('Respons transisi transfer tidak dapat dibaca.', 'DATABASE', 500);
    }
    const updated = map(rows[0] ?? existing);
    return response({ ok: true, data: updated });
  }

  return fail('Operasi ownership transfer tidak dikenal.');
}

async function create(request: Request): Promise<Response> {
  const url = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  let body: Record<string, unknown>;
  try {
    body = await request.clone().json() as Record<string, unknown>;
  } catch {
    return fail('Request body harus berupa JSON.', 'BAD_REQUEST', 400);
  }
  const workspaceId = body.workspace_id;
  const toUserId = body.to_user_id;
  if (!isUuid(workspaceId) || !isUuid(toUserId)) return fail('Workspace dan user penerima tidak valid.');
  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/, '');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const authResult = await anon.auth.getUser(token);
  if (authResult.error || !authResult.data.user || !isAdmin(authResult.data.user as User)) {
    return fail('Akses ditolak: admin only.', 'FORBIDDEN', 403);
  }

  const insert = await restFetch(url, '/rpc/ownership_transfer_create', serviceKey, {
    method: 'POST',
    body: JSON.stringify({
      p_workspace_id: workspaceId,
      p_to_user_id: toUserId,
      p_actor_id: authResult.data.user.id,
      p_reason: typeof body.reason === 'string' ? body.reason : null,
      p_notes: typeof body.notes === 'string' ? body.notes : null,
    }),
  });
  if (!insert.ok) {
    const message = await bodyMessage(insert, 'Permintaan transfer tidak dapat dibuat.');
    const code = message.includes('transfer aktif') ? 'DEPENDENCY'
      : message.includes('tidak ditemukan') ? 'NOT_FOUND' : 'DATABASE';
    return fail(message, code, code === 'DEPENDENCY' ? 409 : code === 'NOT_FOUND' ? 404 : insert.status);
  }

  let rows: TransferRow[];
  try {
    rows = await insert.json() as TransferRow[];
  } catch {
    return fail('Respons pembuatan transfer tidak dapat dibaca.', 'DATABASE', 500);
  }
  const inserted = rows[0];
  if (!inserted) return fail('Permintaan transfer tidak mengembalikan data.', 'DATABASE', 500);

  let base;
  try {
    base = await readBase(url, serviceKey);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Data dasar tidak dapat dimuat.', 'DATABASE', 500);
  }
  const mapped = mapTransfer(
    inserted,
    new Map(base.workspaces.map((workspace) => [workspace.id, workspace])),
    base.users,
    base.profiles,
    base.members,
  );
  if (!mapped) return fail('Transfer berhasil dibuat tetapi detail tidak dapat dimuat.', 'DATABASE', 500);
  return response({ ok: true, data: mapped });
}

Deno.serve(async (request) => {
  try {
    if (request.method === 'POST') {
      const body = await request.clone().json() as Record<string, unknown>;
      if (body.operation === 'create') {
        return await create(request);
      }
    }
    return await main(request);
  } catch {
    return fail('Operasi ownership transfer gagal.', 'INTERNAL', 500);
  }
});