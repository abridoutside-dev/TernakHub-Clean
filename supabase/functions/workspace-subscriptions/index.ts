// ─── Workspace Subscriptions Edge Function ────────────────────────────────────
//
// Subscription management is intentionally server-side. The browser can only
// invoke this function; service-role reads/writes, authorization, history, and
// audit logging stay here.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = ['Aktif', 'Trial', 'Kadaluarsa', 'Dibatalkan', 'Ditangguhkan'] as const;
type Status = typeof STATUSES[number];
type User = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
};
type PackageRow = Record<string, unknown> & { id: string; plan_key: string; name: string };
type SubscriptionRow = Record<string, unknown> & {
  id: string; workspace_id: string; plan_id: string; status: Status;
};
type WorkspaceRow = Record<string, unknown> & { id: string; name: string; type: string };

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
async function restFetch(
  url: string,
  path: string,
  key: string,
  init: RequestInit = {},
): Promise<Response> {
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
function ownerName(
  ownerId: string | null,
  users: Map<string, User>,
  profiles: Map<string, Record<string, unknown>>,
): string | null {
  if (!ownerId) return null;
  const profile = profiles.get(ownerId);
  return (typeof profile?.full_name === 'string' && profile.full_name)
    || (typeof profile?.display_name === 'string' && profile.display_name)
    || users.get(ownerId)?.email
    || `User ${ownerId.slice(0, 8)}`;
}
function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}
function optionalDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error('Tanggal subscription tidak valid.');
  }
  return new Date(value).toISOString();
}
function billingCycle(value: unknown): 'monthly' | 'yearly' | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (value !== 'monthly' && value !== 'yearly') throw new Error('Billing cycle tidak valid.');
  return value;
}
function packagePayload(body: Record<string, unknown>) {
  const planKey = stringValue(body.plan_key)?.toLowerCase();
  const name = stringValue(body.name);
  if (!planKey || !name) throw new Error('Plan key dan nama paket wajib diisi.');
  return {
    plan_key: planKey,
    name,
    description: stringValue(body.description),
    price_monthly: nullableNumber(body.price_monthly),
    price_yearly: nullableNumber(body.price_yearly),
    max_livestock: nullableNumber(body.max_livestock),
    max_members: nullableNumber(body.max_members),
    max_batches: nullableNumber(body.max_batches),
    max_listings: nullableNumber(body.max_listings),
    features: Array.isArray(body.features) ? body.features.filter((item) => typeof item === 'string') : [],
  };
}
function mapPackage(row: PackageRow, dependencyCount?: number) {
  return {
    id: row.id,
    plan_key: row.plan_key,
    name: row.name,
    description: stringValue(row.description),
    price_monthly: nullableNumber(row.price_monthly),
    price_yearly: nullableNumber(row.price_yearly),
    max_livestock: nullableNumber(row.max_livestock),
    max_members: nullableNumber(row.max_members),
    max_batches: nullableNumber(row.max_batches),
    max_listings: nullableNumber(row.max_listings),
    features: Array.isArray(row.features) ? row.features : [],
    is_active: row.is_active === true,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? row.created_at ?? ''),
    ...(dependencyCount === undefined ? {} : { dependency_count: dependencyCount }),
  };
}
function mapSubscription(
  row: SubscriptionRow,
  workspaces: Map<string, WorkspaceRow>,
  packages: Map<string, PackageRow>,
) {
  const workspace = workspaces.get(row.workspace_id);
  const plan = packages.get(row.plan_id);
  if (!workspace || !plan) return null;
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    workspace_name: workspace.name,
    workspace_type: workspace.type,
    plan_id: row.plan_id,
    plan_key: plan.plan_key,
    plan_name: plan.name,
    status: row.status,
    started_at: row.started_at ?? null,
    expires_at: row.expires_at ?? null,
    trial_ends_at: row.trial_ends_at ?? null,
    billing_cycle: row.billing_cycle ?? null,
    auto_renew: row.auto_renew === true,
    payment_method: row.payment_method ?? null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}
async function readBase(url: string, key: string) {
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const [packagesResult, subscriptionsResult, workspacesResult, membersResult, profilesResult, users] =
    await Promise.all([
      restFetch(url, '/subscription_plans?select=*&order=created_at.desc', key),
      restFetch(url, '/workspace_subscriptions?select=*&order=created_at.desc', key),
      restFetch(url, '/workspaces?select=id,name,type,owner_id&order=name.asc', key),
      restFetch(url, '/workspace_members?select=workspace_id', key),
      restFetch(url, '/user_profiles?select=id,full_name,display_name', key),
      readUsers(admin),
    ]);
  for (const [result, fallback] of [
    [packagesResult, 'Paket tidak dapat dimuat.'],
    [subscriptionsResult, 'Subscription tidak dapat dimuat.'],
    [workspacesResult, 'Workspace tidak dapat dimuat.'],
    [membersResult, 'Member workspace tidak dapat dimuat.'],
    [profilesResult, 'Profil user tidak dapat dimuat.'],
  ] as const) {
    if (!result.ok) throw new Error(await bodyMessage(result, fallback));
  }
  const packages = await packagesResult.json() as PackageRow[];
  const subscriptions = await subscriptionsResult.json() as SubscriptionRow[];
  const workspaces = await workspacesResult.json() as WorkspaceRow[];
  const members = await membersResult.json() as Array<{ workspace_id: string }>;
  const profiles = await profilesResult.json() as Array<Record<string, unknown> & { id: string }>;
  const packageMap = new Map(packages.map((item) => [item.id, item]));
  const workspaceMap = new Map(workspaces.map((item) => [item.id, item]));
  const userMap = new Map(users.map((item) => [item.id, item]));
  const profileMap = new Map(profiles.map((item) => [item.id, item]));
  const memberCounts = new Map<string, number>();
  for (const member of members) memberCounts.set(member.workspace_id, (memberCounts.get(member.workspace_id) ?? 0) + 1);
  return { admin, packages, subscriptions, workspaces, packageMap, workspaceMap, userMap, profileMap, memberCounts };
}
async function insertAudit(
  url: string, key: string, actorId: string, action: string, entityId: string | null,
  workspaceId: string | null, oldData: unknown, newData: unknown,
) {
  const result = await restFetch(url, '/global_audit_trail', key, {
    method: 'POST',
    body: JSON.stringify({
      workspace_id: workspaceId,
      user_id: actorId,
      action,
      entity_type: 'subscription',
      entity_id: entityId,
      old_data: oldData,
      new_data: newData,
    }),
  });
  if (!result.ok) throw new Error(await bodyMessage(result, 'Audit log subscription gagal disimpan.'));
}
async function insertHistory(
  url: string, key: string, actorId: string, row: SubscriptionRow,
  action: string, oldPlanId: string | null, newPlanId: string | null,
  oldStatus: Status | null, newStatus: Status | null, note: string,
) {
  const result = await restFetch(url, '/subscription_history', key, {
    method: 'POST',
    body: JSON.stringify({
      subscription_id: row.id,
      workspace_id: row.workspace_id,
      action,
      from_plan_id: oldPlanId,
      to_plan_id: newPlanId,
      from_status: oldStatus,
      to_status: newStatus,
      note,
      changed_by: actorId,
    }),
  });
  if (!result.ok) throw new Error(await bodyMessage(result, 'Riwayat subscription gagal disimpan.'));
}
async function updateSubscription(
  url: string, key: string, actorId: string, row: SubscriptionRow,
  patch: Record<string, unknown>, action: string, note: string,
) {
  const result = await restFetch(url, `/workspace_subscriptions?id=eq.${encodeURIComponent(row.id)}`, key, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  if (!result.ok) throw new Error(await bodyMessage(result, 'Subscription tidak dapat diperbarui.'));
  const updated = (await result.json() as SubscriptionRow[])[0];
  if (!updated) throw new Error('Subscription tidak mengembalikan data.');
  await insertHistory(url, key, actorId, updated, action,
    row.plan_id, updated.plan_id, row.status, updated.status, note);
  await insertAudit(url, key, actorId, action, row.id, row.workspace_id, row, updated);
  return updated;
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
  const actor = authResult.data.user as User;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return fail('Request body harus berupa JSON.'); }
  if (body.action !== 'workspace-subscriptions') return fail('Action tidak dikenal.');
  const operation = typeof body.operation === 'string' ? body.operation : '';
  if (operation === 'workspace-detail') {
    const workspaceId = body.workspace_id;
    if (!isUuid(workspaceId)) return fail('Workspace ID tidak valid.');
    const membership = await restFetch(
      url,
      `/workspace_members?workspace_id=eq.${encodeURIComponent(workspaceId)}&user_id=eq.${encodeURIComponent(actor.id)}&status=eq.Aktif&select=id&limit=1`,
      serviceKey,
    );
    if (!membership.ok) return fail('Membership workspace tidak dapat diverifikasi.', 'DATABASE', 500);
    const members = await membership.json() as Array<{ id: string }>;
    if (!members.length && !isAdmin(actor)) return fail('Akses ditolak untuk workspace ini.', 'FORBIDDEN', 403);
    const subscriptionResult = await restFetch(
      url,
      `/workspace_subscriptions?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*&limit=1`,
      serviceKey,
    );
    if (!subscriptionResult.ok) return fail('Subscription workspace tidak dapat dimuat.', 'DATABASE', 500);
    const rows = await subscriptionResult.json() as SubscriptionRow[];
    const row = rows[0];
    if (!row) return response({ ok: true, data: null });
    const [workspaceResult, packageResult] = await Promise.all([
      restFetch(url, `/workspaces?id=eq.${encodeURIComponent(workspaceId)}&select=id,name,type&limit=1`, serviceKey),
      restFetch(url, `/subscription_plans?id=eq.${encodeURIComponent(row.plan_id)}&select=*&limit=1`, serviceKey),
    ]);
    if (!workspaceResult.ok || !packageResult.ok) return fail('Detail subscription tidak dapat dimuat.', 'DATABASE', 500);
    const workspaces = await workspaceResult.json() as WorkspaceRow[];
    const packages = await packageResult.json() as PackageRow[];
    const workspace = workspaces[0];
    const plan = packages[0];
    if (!workspace || !plan) return response({ ok: true, data: null });
    return response({
      ok: true,
      data: mapSubscription(row, new Map([[workspace.id, workspace]]), new Map([[plan.id, plan]])),
    });
  }
  if (operation === 'workspace-history') {
    const workspaceId = body.workspace_id;
    if (!isUuid(workspaceId)) return fail('Workspace ID tidak valid.');
    const membership = await restFetch(
      url,
      `/workspace_members?workspace_id=eq.${encodeURIComponent(workspaceId)}&user_id=eq.${encodeURIComponent(actor.id)}&status=eq.Aktif&select=id&limit=1`,
      serviceKey,
    );
    if (!membership.ok) return fail('Membership workspace tidak dapat diverifikasi.', 'DATABASE', 500);
    const members = await membership.json() as Array<{ id: string }>;
    if (!members.length && !isAdmin(actor)) return fail('Akses ditolak untuk workspace ini.', 'FORBIDDEN', 403);
    const [historyResult, workspaceResult, packagesResult] = await Promise.all([
      restFetch(url, `/subscription_history?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*&order=created_at.desc`, serviceKey),
      restFetch(url, `/workspaces?id=eq.${encodeURIComponent(workspaceId)}&select=id,name&limit=1`, serviceKey),
      restFetch(url, '/subscription_plans?select=id,plan_key', serviceKey),
    ]);
    if (!historyResult.ok || !workspaceResult.ok || !packagesResult.ok) {
      return fail('Riwayat subscription tidak dapat dimuat.', 'DATABASE', 500);
    }
    const rows = await historyResult.json() as Array<Record<string, unknown>>;
    const workspace = (await workspaceResult.json() as Array<{ id: string; name: string }>)[0];
    const packages = await packagesResult.json() as Array<{ id: string; plan_key: string }>;
    const packageKeys = new Map(packages.map((item) => [item.id, item.plan_key]));
    return response({
      ok: true,
      data: rows.map((row) => ({
        id: row.id,
        subscription_id: row.subscription_id ?? null,
        workspace_id: row.workspace_id,
        workspace_name: workspace?.name ?? '—',
        action: row.action,
        from_plan_key: row.from_plan_id ? packageKeys.get(String(row.from_plan_id)) ?? null : null,
        to_plan_key: row.to_plan_id ? packageKeys.get(String(row.to_plan_id)) ?? null : null,
        from_status: row.from_status ?? null,
        to_status: row.to_status ?? null,
        note: row.note ?? null,
        changed_by: row.changed_by ?? null,
        created_at: row.created_at,
      })),
    });
  }
  if (!isAdmin(actor)) return fail('Akses ditolak: admin only.', 'FORBIDDEN', 403);
  const base = await readBase(url, serviceKey);
  const mapSubscriptionRow = (row: SubscriptionRow) =>
    mapSubscription(row, base.workspaceMap, base.packageMap);

  if (operation === 'list') {
    const mapped = base.subscriptions.map(mapSubscriptionRow).filter(Boolean);
    const packages = base.packages.map((pkg) => mapPackage(
      pkg,
      base.subscriptions.filter((item) => item.plan_id === pkg.id).length,
    ));
    const workspaces = base.workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      type: workspace.type,
      owner_id: workspace.owner_id ?? null,
      owner_name: ownerName(workspace.owner_id ?? null, base.userMap, base.profileMap),
      member_count: base.memberCounts.get(workspace.id) ?? 0,
      subscription_id: base.subscriptions.find((item) => item.workspace_id === workspace.id)?.id ?? null,
    }));
    return response({
      ok: true,
      data: {
        packages,
        subscriptions: mapped,
        workspaces,
        stats: {
          total_packages: packages.length,
          active_packages: packages.filter((item) => item.is_active).length,
          total_subscriptions: mapped.length,
          active_subscriptions: base.subscriptions.filter((item) => item.status === 'Aktif').length,
          trial_subscriptions: base.subscriptions.filter((item) => item.status === 'Trial').length,
          expired_subscriptions: base.subscriptions.filter((item) => item.status === 'Kadaluarsa').length,
        },
      },
    });
  }
  if (operation === 'packages') return response({ ok: true, data: base.packages.map((item) => mapPackage(item)) });
  if (operation === 'package-detail') {
    const id = body.package_id;
    const item = base.packages.find((pkg) => pkg.id === id || pkg.plan_key === id);
    return item ? response({ ok: true, data: mapPackage(item) }) : fail('Paket tidak ditemukan.', 'NOT_FOUND', 404);
  }
  if (operation === 'create-package') {
    const payload = packagePayload(body);
    const result = await restFetch(url, '/subscription_plans', serviceKey, { method: 'POST', body: JSON.stringify(payload) });
    if (!result.ok) return fail(await bodyMessage(result, 'Paket tidak dapat dibuat.'), 'DATABASE', result.status);
    const created = (await result.json() as PackageRow[])[0];
    await insertAudit(url, serviceKey, actor.id, 'package.created', created.id, null, null, created);
    return response({ ok: true, data: mapPackage(created) });
  }
  if (operation === 'update-package' || operation === 'activate-package' || operation === 'deactivate-package') {
    const packageId = body.package_id;
    if (!isUuid(packageId)) return fail('Package ID tidak valid.');
    const existing = base.packageMap.get(packageId);
    if (!existing) return fail('Paket tidak ditemukan.', 'NOT_FOUND', 404);
    const patch = operation === 'activate-package' || operation === 'deactivate-package'
      ? { is_active: operation === 'activate-package' }
      : packagePayload({ ...existing, ...body });
    const result = await restFetch(url, `/subscription_plans?id=eq.${encodeURIComponent(packageId)}`, serviceKey, { method: 'PATCH', body: JSON.stringify(patch) });
    if (!result.ok) return fail(await bodyMessage(result, 'Paket tidak dapat diperbarui.'), 'DATABASE', result.status);
    const updated = (await result.json() as PackageRow[])[0];
    await insertAudit(url, serviceKey, actor.id, operation.replace('-package', '.package'), packageId, null, existing, updated);
    return response({ ok: true, data: mapPackage(updated) });
  }
  if (operation === 'preflight-delete-package') {
    const packageId = body.package_id;
    if (!isUuid(packageId)) return fail('Package ID tidak valid.');
    const pkg = base.packageMap.get(packageId);
    if (!pkg) return fail('Paket tidak ditemukan.', 'NOT_FOUND', 404);
    return response({
      ok: true,
      data: {
        package: mapPackage(pkg),
        dependencies: [{
          key: 'workspace_subscriptions',
          label: 'Subscription workspace',
          count: base.subscriptions.filter((item) => item.plan_id === packageId).length,
          description: 'Paket yang masih digunakan tidak dapat dihapus.',
          blocks_delete: true,
        }],
        checked_at: new Date().toISOString(),
      },
    });
  }
  if (operation === 'delete-package') {
    const packageId = body.package_id;
    if (!isUuid(packageId)) return fail('Package ID tidak valid.');
    const checkedAt = typeof body.preflight_checked_at === 'string' ? Date.parse(body.preflight_checked_at) : NaN;
    if (!Number.isFinite(checkedAt) || Date.now() - checkedAt > 5 * 60 * 1000 || checkedAt > Date.now()) {
      return fail('Pre-check paket kedaluwarsa. Jalankan pre-check kembali.', 'PREFLIGHT_REQUIRED', 409);
    }
    const count = base.subscriptions.filter((item) => item.plan_id === packageId).length;
    if (count > 0) return fail('Paket masih digunakan oleh subscription workspace.', 'DEPENDENCY', 409);
    const result = await restFetch(url, `/subscription_plans?id=eq.${encodeURIComponent(packageId)}`, serviceKey, { method: 'DELETE' });
    if (!result.ok) return fail(await bodyMessage(result, 'Paket tidak dapat dihapus.'), 'DATABASE', result.status);
    await insertAudit(url, serviceKey, actor.id, 'package.deleted', packageId, null, base.packageMap.get(packageId), null);
    return response({ ok: true, data: { removed: true } });
  }
  if (operation === 'assign-package') {
    const workspaceId = body.workspace_id;
    const packageId = body.package_id;
    if (!isUuid(workspaceId) || !isUuid(packageId)) return fail('Workspace atau package ID tidak valid.');
    if (!base.workspaceMap.has(workspaceId) || !base.packageMap.has(packageId)) return fail('Workspace atau paket tidak ditemukan.', 'NOT_FOUND', 404);
    const packageToAssign = base.packageMap.get(packageId);
    if (!packageToAssign?.is_active) return fail('Paket tidak aktif dan tidak dapat di-assign.', 'PACKAGE_INACTIVE', 409);
    if (base.subscriptions.some((item) => item.workspace_id === workspaceId)) return fail('Workspace sudah memiliki subscription.', 'DUPLICATE', 409);
    const expiresAt = optionalDate(body.expires_at);
    const cycle = billingCycle(body.billing_cycle);
    const row = {
      workspace_id: workspaceId,
      plan_id: packageId,
      status: 'Aktif',
      started_at: new Date().toISOString(),
      expires_at: expiresAt ?? null,
      billing_cycle: cycle ?? null,
      auto_renew: false,
    };
    const result = await restFetch(url, '/workspace_subscriptions', serviceKey, { method: 'POST', body: JSON.stringify(row) });
    if (!result.ok) return fail(await bodyMessage(result, 'Paket tidak dapat di-assign.'), 'DATABASE', result.status);
    const created = (await result.json() as SubscriptionRow[])[0];
    await insertHistory(url, serviceKey, actor.id, created, 'Aktivasi', null, packageId, null, 'Aktif', 'Package assigned by admin');
    await insertAudit(url, serviceKey, actor.id, 'subscription.assigned', created.id, workspaceId, null, created);
    return response({ ok: true, data: mapSubscription(created, base.workspaceMap, base.packageMap) });
  }
  const subscriptionId = body.subscription_id;
  if (operation === 'history') {
    const result = await restFetch(url, '/subscription_history?select=*&order=created_at.desc', serviceKey);
    if (!result.ok) return fail(await bodyMessage(result, 'Riwayat subscription tidak dapat dimuat.'), 'DATABASE', result.status);
    const rows = await result.json() as Array<Record<string, unknown>>;
    return response({ ok: true, data: rows.map((row) => ({
      id: row.id,
      subscription_id: row.subscription_id ?? null,
      workspace_id: row.workspace_id,
      workspace_name: base.workspaceMap.get(String(row.workspace_id))?.name ?? '—',
      action: row.action,
      from_plan_key: row.from_plan_id ? base.packageMap.get(String(row.from_plan_id))?.plan_key ?? null : null,
      to_plan_key: row.to_plan_id ? base.packageMap.get(String(row.to_plan_id))?.plan_key ?? null : null,
      from_status: row.from_status ?? null,
      to_status: row.to_status ?? null,
      note: row.note ?? null,
      changed_by: row.changed_by ?? null,
      created_at: row.created_at,
    })) });
  }
  if (operation === 'audit') {
    const result = await restFetch(url, '/global_audit_trail?entity_type=eq.subscription&select=*&order=created_at.desc', serviceKey);
    if (!result.ok) return fail(await bodyMessage(result, 'Audit subscription tidak dapat dimuat.'), 'DATABASE', result.status);
    return response({ ok: true, data: await result.json() });
  }
  if (!isUuid(subscriptionId)) return fail('Subscription ID tidak valid.');
  const existing = base.subscriptions.find((item) => item.id === subscriptionId);
  if (!existing) return fail('Subscription tidak ditemukan.', 'NOT_FOUND', 404);
  if (operation === 'change-package') {
    const packageId = body.package_id;
    if (!isUuid(packageId) || !base.packageMap.has(packageId)) return fail('Package ID tidak valid.');
    const nextPlan = base.packageMap.get(packageId);
    if (!nextPlan?.is_active) return fail('Paket tujuan tidak aktif.', 'PACKAGE_INACTIVE', 409);
    const currentPlan = base.packageMap.get(existing.plan_id);
    const order: Record<string, number> = { free: 0, basic: 1, pro: 2, enterprise: 3 };
    const action = (order[nextPlan?.plan_key ?? ''] ?? 0) >= (order[currentPlan?.plan_key ?? ''] ?? 0)
      ? 'Upgrade' : 'Downgrade';
    const updated = await updateSubscription(url, serviceKey, actor.id, existing, {
      plan_id: packageId,
      billing_cycle: billingCycle(body.billing_cycle) ?? existing.billing_cycle,
      expires_at: optionalDate(body.expires_at) ?? existing.expires_at,
    }, action, 'Package changed by admin');
    return response({ ok: true, data: mapSubscription(updated, base.workspaceMap, base.packageMap) });
  }
  if (operation === 'activate' || operation === 'deactivate' || operation === 'expire' || operation === 'cancel') {
    const nextStatus: Status = operation === 'activate'
      ? 'Aktif'
      : operation === 'deactivate'
        ? 'Ditangguhkan'
        : operation === 'expire' ? 'Kadaluarsa' : 'Dibatalkan';
    if (operation === 'activate' && existing.status !== 'Ditangguhkan' && existing.status !== 'Trial') {
      return fail('Hanya subscription ditangguhkan atau trial yang dapat diaktifkan.', 'INVALID_TRANSITION', 409);
    }
    if (operation === 'deactivate' && existing.status !== 'Aktif' && existing.status !== 'Trial') {
      return fail('Hanya subscription aktif atau trial yang dapat dinonaktifkan.', 'INVALID_TRANSITION', 409);
    }
    if (operation === 'expire' && existing.status !== 'Aktif' && existing.status !== 'Trial') {
      return fail('Hanya subscription aktif atau trial yang dapat di-expire.', 'INVALID_TRANSITION', 409);
    }
    if (operation === 'cancel' && existing.status === 'Dibatalkan') {
      return fail('Subscription sudah dibatalkan.', 'INVALID_TRANSITION', 409);
    }
    const updated = await updateSubscription(url, serviceKey, actor.id, existing, {
      status: nextStatus,
      expires_at: operation === 'expire' ? new Date().toISOString() : operation === 'activate' ? null : existing.expires_at,
    }, operation === 'expire' ? 'Expire' : operation === 'cancel' ? 'Cancel' : operation === 'activate' ? 'Aktivasi' : 'Deaktivasi', `Subscription ${operation}d by admin`);
    return response({ ok: true, data: mapSubscription(updated, base.workspaceMap, base.packageMap) });
  }
  return fail('Operasi subscription tidak dikenal.');
}

Deno.serve(async (request) => {
  try {
    return await main(request);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Operasi subscription gagal.', 'INTERNAL', 500);
  }
});