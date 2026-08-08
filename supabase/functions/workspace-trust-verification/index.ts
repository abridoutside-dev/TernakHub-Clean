// ─── Workspace Trust & Verification Edge Function ────────────────────────────
//
// Admin-only backend for the Trust & Verification module. The browser never
// reads or writes trust tables, evidence, or the global audit trail directly.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = ['Draft', 'Submitted', 'Pending', 'UnderReview', 'Approved', 'Verified', 'Unverified', 'Rejected', 'Suspended', 'Expired'] as const;
const TYPES = ['KTP', 'NPWP', 'SIUP', 'Sertifikat', 'LokasiUsaha', 'Rekening', 'Lainnya'] as const;
type Status = typeof STATUSES[number];
type VerificationType = typeof TYPES[number];
type User = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
};
type VerificationRow = Record<string, unknown> & {
  id: string;
  workspace_id: string;
  verification_type: VerificationType;
  status: Status;
};
type WorkspaceRow = { id: string; name: string; type?: string | null; owner_id?: string | null; trust_score?: number | null };
type ProfileRow = { id: string; full_name?: string | null; display_name?: string | null };
type EvidenceRow = {
  id: string;
  verification_id: string;
  file_name: string;
  storage_url: string;
  file_type?: string | null;
  description?: string | null;
  uploaded_at: string;
};
type AuditRow = {
  id: string;
  action: string;
  user_id: string | null;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
};

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
  const metadata = user.user_metadata ?? {};
  const appMetadata = user.app_metadata ?? {};
  return metadata.is_admin === true
    || metadata.system_admin === true
    || metadata.role === 'admin'
    || metadata.role === 'system_admin'
    || appMetadata.role === 'admin'
    || appMetadata.role === 'system_admin';
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
function actorName(userId: string | null, users: Map<string, User>, profiles: Map<string, ProfileRow>): string {
  if (!userId) return 'System';
  const profile = profiles.get(userId);
  return profile?.full_name || profile?.display_name || users.get(userId)?.email || `User ${userId.slice(0, 8)}`;
}
async function readUsers(admin: ReturnType<typeof createClient>): Promise<User[]> {
  const users: User[] = [];
  for (let page = 1; ; page += 1) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (result.error) throw new Error('Daftar user tidak dapat dimuat.');
    const pageUsers = result.data.users as User[];
    users.push(...pageUsers);
    if (pageUsers.length < 1000) return users;
  }
}
async function readContext(url: string, key: string, admin: ReturnType<typeof createClient>) {
  const [verificationResult, workspaceResult, profileResult, evidenceResult, auditResult, users] = await Promise.all([
    restFetch(url, '/trust_verifications?select=*&order=created_at.desc', key),
    restFetch(url, '/workspaces?select=id,name,type,owner_id,trust_score,created_at&order=name.asc', key),
    restFetch(url, '/user_profiles?select=id,full_name,display_name', key),
    restFetch(url, '/trust_verification_evidence?select=*&order=uploaded_at.asc', key),
    restFetch(url, '/global_audit_trail?entity_type=eq.trust_verification&select=*&order=created_at.asc', key),
    readUsers(admin),
  ]);
  for (const [result, fallback] of [
    [verificationResult, 'Verifikasi tidak dapat dimuat.'],
    [workspaceResult, 'Workspace tidak dapat dimuat.'],
    [profileResult, 'Profil tidak dapat dimuat.'],
    [evidenceResult, 'Evidence tidak dapat dimuat.'],
    [auditResult, 'Audit trail tidak dapat dimuat.'],
  ] as const) {
    if (!result.ok) throw new Error(await bodyMessage(result, fallback));
  }
  const workspaces = new Map<string, WorkspaceRow>(
    (await workspaceResult.json() as WorkspaceRow[]).map((item) => [item.id, item]),
  );
  const profiles = new Map<string, ProfileRow>(
    (await profileResult.json() as ProfileRow[]).map((item) => [item.id, item]),
  );
  const evidence = await evidenceResult.json() as EvidenceRow[];
  const audits = await auditResult.json() as AuditRow[];
  return {
    verifications: await verificationResult.json() as VerificationRow[],
    workspaces,
    profiles,
    evidence,
    audits,
    users: new Map(users.map((user) => [user.id, user])),
  };
}
function mapRecord(
  row: VerificationRow,
  context: Awaited<ReturnType<typeof readContext>>,
): TrustVerificationRecord {
  const workspace = context.workspaces.get(row.workspace_id);
  const rowEvidence = context.evidence.filter((item) => item.verification_id === row.id);
  const rowAudits = context.audits.filter((item) => item.entity_id === row.id);
  const timeline = rowAudits.map((item) => ({
    id: item.id,
    action: item.action,
    actor_id: item.user_id,
    actor_name: actorName(item.user_id, context.users, context.profiles),
    previous_status: (item.old_data?.status as Status | null) ?? null,
    next_status: (item.new_data?.status as Status | null) ?? null,
    reason: typeof item.new_data?.reason === 'string' ? item.new_data.reason : null,
    created_at: item.created_at,
  }));
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    workspace_name: workspace?.name ?? 'Workspace tidak ditemukan',
    workspace_type: workspace?.type ?? null,
    owner_name: workspace?.owner_id ? actorName(workspace.owner_id, context.users, context.profiles) : null,
    verification_type: row.verification_type,
    status: row.status,
    submitted_at: (row.submitted_at as string | null) ?? null,
    reviewed_at: (row.reviewed_at as string | null) ?? null,
    reviewed_by: (row.reviewed_by as string | null) ?? null,
    rejection_reason: (row.rejection_reason as string | null) ?? null,
    expires_at: (row.expires_at as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    // Trust is owned by the workspace and is read only from the backend.
    // Never derive a score from status, evidence count, or local seed data.
    trust_score: typeof workspace?.trust_score === 'number'
      && Number.isFinite(workspace.trust_score)
      ? workspace.trust_score
      : null,
    workspace_created_at: typeof workspace?.created_at === 'string'
      ? workspace.created_at
      : null,
    evidence: rowEvidence.map((item) => ({
      id: item.id,
      file_name: item.file_name,
      storage_url: item.storage_url,
      file_type: item.file_type ?? null,
      description: item.description ?? null,
      uploaded_at: item.uploaded_at,
    })),
    timeline,
  };
}
function matchesSearch(record: ReturnType<typeof mapRecord>, search: string): boolean {
  if (!search) return true;
  const haystack = [record.id, record.workspace_id, record.workspace_name, record.owner_name, record.verification_type]
    .filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(search.toLowerCase());
}
async function main(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return response({}, 204);
  if (request.method !== 'POST') return fail('Method tidak didukung.', 'METHOD_NOT_ALLOWED', 405);
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return fail('Sesi autentikasi tidak ditemukan.', 'UNAUTHENTICATED', 401);
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!url || !serviceKey || !anonKey) return fail('Konfigurasi Supabase Edge Function belum lengkap.', 'NOT_CONFIGURED', 500);
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const authResult = await anon.auth.getUser(token);
  if (authResult.error || !authResult.data.user) return fail('Sesi autentikasi tidak valid.', 'UNAUTHENTICATED', 401);
  const actor = authResult.data.user as User;
  const body = await request.json() as Record<string, unknown>;
  if (body.action !== 'workspace-trust-verification') return fail('Action tidak dikenal.');
  const operation = body.operation;
  const actorIsAdmin = isAdmin(actor);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const context = await readContext(url, serviceKey, admin);
  const records = context.verifications.map((row) => mapRecord(row, context));

  if (operation === 'list') {
    const page = Math.max(1, Number(body.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(body.page_size) || 20));
    const status = body.status;
    const verificationType = body.verification_type;
    const requestedWorkspaceId = body.workspace_id;
    if (!actorIsAdmin && !isUuid(requestedWorkspaceId)) {
      return fail('Workspace wajib dipilih.', 'WORKSPACE_REQUIRED');
    }
    if (requestedWorkspaceId && !isUuid(requestedWorkspaceId)) {
      return fail('Workspace ID tidak valid.', 'BAD_WORKSPACE_ID');
    }
    const filtered = records.filter((record) =>
      (requestedWorkspaceId === undefined || record.workspace_id === requestedWorkspaceId)
      && (status === undefined || status === 'All' || record.status === status)
      && (verificationType === undefined || verificationType === 'All' || record.verification_type === verificationType)
      && matchesSearch(record, typeof body.search === 'string' ? body.search.trim() : ''),
    );
    const start = (page - 1) * pageSize;
    const pageRecords = filtered.slice(start, start + pageSize);
    const average = records.filter((record) => record.trust_score !== null);
    return response({
      ok: true,
      data: {
        records: pageRecords,
        workspace_trust_score: requestedWorkspaceId
          ? (context.workspaces.get(String(requestedWorkspaceId))?.trust_score ?? null)
          : null,
        workspace_created_at: requestedWorkspaceId
          ? (context.workspaces.get(String(requestedWorkspaceId))?.created_at ?? null)
          : null,
        stats: {
          total: records.length,
          pending: records.filter((record) => ['Submitted', 'Pending', 'UnderReview'].includes(record.status)).length,
          verified: records.filter((record) => ['Approved', 'Verified'].includes(record.status)).length,
          rejected: records.filter((record) => record.status === 'Rejected').length,
          suspended: records.filter((record) => record.status === 'Suspended').length,
          unverified: records.filter((record) => ['Draft', 'Unverified', 'Expired'].includes(record.status)).length,
          average_score: average.length ? Math.round(average.reduce((sum, record) => sum + (record.trust_score ?? 0), 0) / average.length) : null,
        },
        page,
        page_size: pageSize,
        total: filtered.length,
        total_pages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    });
  }
  if (operation === 'submit') {
    if (actorIsAdmin) return fail('Admin tidak dapat mengajukan verifikasi sebagai workspace.', 'FORBIDDEN', 403);
    const workspaceId = body.workspace_id;
    const verificationType = body.verification_type;
    if (!isUuid(workspaceId) || !TYPES.includes(verificationType as VerificationType)) {
      return fail('Workspace atau tipe verifikasi tidak valid.', 'VALIDATION');
    }
    const membership = await restFetch(
      url,
      `/workspace_members?select=id&workspace_id=eq.${encodeURIComponent(workspaceId)}&user_id=eq.${encodeURIComponent(actor.id)}&status=eq.Aktif`,
      serviceKey,
    );
    if (!membership.ok) return fail(await bodyMessage(membership, 'Keanggotaan workspace tidak dapat diverifikasi.'), 'DATABASE', membership.status);
    const memberRows = await membership.json() as unknown[];
    if (!memberRows.length) return fail('Anda bukan anggota workspace ini.', 'FORBIDDEN', 403);
    const insertResult = await restFetch(url, '/trust_verifications', serviceKey, {
      method: 'POST',
      body: JSON.stringify({
        workspace_id: workspaceId,
        verification_type: verificationType,
        status: 'Submitted',
        submitted_at: new Date().toISOString(),
      }),
    });
    if (!insertResult.ok) return fail(await bodyMessage(insertResult, 'Pengajuan verifikasi tidak dapat disimpan.'), 'DATABASE', insertResult.status);
    const inserted = await insertResult.json() as VerificationRow[];
    const insertedId = inserted[0]?.id;
    if (!insertedId) return fail('Pengajuan verifikasi tidak mengembalikan ID.', 'DATABASE', 500);
    const auditResult = await restFetch(url, '/global_audit_trail', serviceKey, {
      method: 'POST',
      body: JSON.stringify({
        workspace_id: workspaceId,
        user_id: actor.id,
        action: 'trust_verification.submit',
        entity_type: 'trust_verification',
        entity_id: insertedId,
        old_data: { status: null },
        new_data: { status: 'Submitted', verification_type: verificationType },
      }),
    });
    if (!auditResult.ok) return fail(await bodyMessage(auditResult, 'Audit trail tidak dapat disimpan.'), 'AUDIT_FAILED', 500);
    const refreshed = await readContext(url, serviceKey, admin);
    const submitted = refreshed.verifications.find((row) => row.id === insertedId);
    return response({ ok: true, data: submitted ? mapRecord(submitted, refreshed) : null });
  }
  const verificationId = body.verification_id;
  if (!isUuid(verificationId)) return fail('Verification ID tidak valid.');
  const existing = context.verifications.find((row) => row.id === verificationId);
  if (!existing) return fail('Verifikasi tidak ditemukan.', 'NOT_FOUND', 404);
  if (operation === 'detail') return response({ ok: true, data: mapRecord(existing, context) });
  if (operation === 'preflight') {
    const evidenceCount = context.evidence.filter((item) => item.verification_id === verificationId).length;
    const blockers = evidenceCount > 0 ? [] : ['Evidence verifikasi belum tersedia.'];
    return response({
      ok: true,
      data: {
        verification_id: verificationId,
        workspace_id: existing.workspace_id,
        evidence_count: evidenceCount,
        blockers,
        checked_at: new Date().toISOString(),
      },
    });
  }
  if (operation === 'audit') {
    return response({ ok: true, data: context.audits.filter((item) => item.entity_id === verificationId).map((item) => ({
      id: item.id, action: item.action, actor_id: item.user_id, entity_id: item.entity_id,
      old_data: item.old_data, new_data: item.new_data, created_at: item.created_at,
    })) });
  }
  if (operation !== 'transition') return fail('Operasi trust dan verifikasi tidak dikenal.');
  if (!actorIsAdmin) return fail('Akses admin diperlukan.', 'FORBIDDEN', 403);
  const transition = body.transition;
  if (!['approve', 'reject', 'suspend', 'reactivate'].includes(String(transition))) return fail('Transisi status tidak valid.');
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (['reject', 'suspend'].includes(String(transition)) && !reason) return fail('Alasan wajib diisi.', 'REASON_REQUIRED');
  const nextStatus: Status = transition === 'approve' ? 'Verified' : transition === 'reject' ? 'Rejected' : transition === 'suspend' ? 'Suspended' : 'UnderReview';
  const allowed: Record<string, Status[]> = {
    approve: ['Submitted', 'Pending', 'UnderReview', 'Unverified'],
    reject: ['Submitted', 'Pending', 'UnderReview'],
    suspend: ['Approved', 'Verified', 'UnderReview'],
    reactivate: ['Suspended', 'Rejected', 'Expired'],
  };
  if (!allowed[String(transition)]?.includes(existing.status)) return fail('Transisi status tidak diizinkan.', 'INVALID_TRANSITION', 409);
  const patch: Record<string, unknown> = {
    status: nextStatus,
    reviewed_at: new Date().toISOString(),
    reviewed_by: actor.id,
    rejection_reason: transition === 'reject' ? reason : null,
  };
  const updateResult = await restFetch(url, `/trust_verifications?id=eq.${encodeURIComponent(verificationId)}`, serviceKey, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  if (!updateResult.ok) return fail(await bodyMessage(updateResult, 'Status verifikasi tidak dapat diperbarui.'), 'DATABASE', updateResult.status);
  const auditResult = await restFetch(url, '/global_audit_trail', serviceKey, {
    method: 'POST',
    body: JSON.stringify({
      user_id: actor.id,
      action: `trust_verification.${transition}`,
      entity_type: 'trust_verification',
      entity_id: verificationId,
      old_data: { status: existing.status },
      new_data: { status: nextStatus, reason: reason || null },
    }),
  });
  if (!auditResult.ok) return fail(await bodyMessage(auditResult, 'Audit trail tidak dapat disimpan.'), 'AUDIT_FAILED', 500);
  const refreshed = await readContext(url, serviceKey, admin);
  const updated = refreshed.verifications.find((row) => row.id === verificationId);
  return response({ ok: true, data: updated ? mapRecord(updated, refreshed) : null });
}

Deno.serve(async (request) => {
  try {
    return await main(request);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Operasi trust dan verifikasi gagal.', 'INTERNAL', 500);
  }
});