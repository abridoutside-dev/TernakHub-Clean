// ─── Workspace Repository — DB-001B / P0-001C ─────────────────────────────────
//
// Async Supabase adapter for the Workspace module.
// This is the ONLY file that touches the Supabase `workspaces` table.
//
// DB-001A column contract (workspaces table):
//   id, name, type (workspace_type enum), status (workspace_status enum),
//   owner_id, icon, description, province, city, district, village,
//   address, latitude, longitude, phone, email, website,
//   metadata (jsonb — holds slug, plan, timezone, currency, language),
//   created_at, updated_at, archived_at
//
// DB-001A enum values:
//   workspace_type   → Farm | FeedStore | VeterinaryClinic | VeterinaryDoctor | Transport | Marketplace
//   workspace_status → Aktif | Nonaktif | Diarsipkan | Pending
//
// App WorkspaceRecord uses different field names and enum values.
// This file owns ALL mapping between DB and app shapes.
//
// Rules:
//  - All functions are async and return typed WorkspaceRecord.
//  - Never import from pages, components, or contexts.
//  - Validation lives in workspaceService.ts, not here.
//  - slug stored in metadata->>'slug'; plan in metadata->>'plan'.
//  - On unique-constraint violation, throw WorkspaceRepoError(code='SLUG_TAKEN').

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';
import type {
  WorkspaceRecord,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
  WorkspaceStatus,
  WorkspaceType,
  WorkspacePlan,
  WorkspaceDependencies,
  WorkspaceDependencyItem,
  WorkspaceDependencyKey,
} from '../types/workspace';

// ─── Error type ───────────────────────────────────────────────────────────────

export class WorkspaceRepoError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'WorkspaceRepoError';
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PG_UNIQUE_VIOLATION = '23505';

type DependencyQuery = {
  key: WorkspaceDependencyKey;
  label: string;
  description: string;
  table: string;
  columns: string[];
  blocksDelete: boolean;
  blocksArchive: boolean;
};

/**
 * Direct workspace references from the DB schema.  Keeping this list in the
 * repository makes dependency checks explicit and prevents lifecycle code from
 * silently relying on database cascades.
 *
 * Some tables reference a workspace twice (buyer/seller, source/destination);
 * each column is counted independently and is summed under one user-facing
 * dependency item.
 */
const DEPENDENCY_QUERIES: DependencyQuery[] = [
  { key: 'members', label: 'Anggota workspace', description: 'Anggota yang masih terdaftar di workspace.', table: 'workspace_members', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'invitations', label: 'Undangan workspace', description: 'Undangan yang masih tersimpan untuk workspace.', table: 'workspace_invitations', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'relationships', label: 'Relasi workspace', description: 'Relasi dengan workspace lain.', table: 'workspace_relationships', columns: ['workspace_id_a', 'workspace_id_b'], blocksDelete: true, blocksArchive: false },
  { key: 'ownershipTransfers', label: 'Transfer kepemilikan', description: 'Riwayat atau proses transfer kepemilikan.', table: 'ownership_transfers', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'subscription', label: 'Subscription workspace', description: 'Subscription yang terpasang pada workspace.', table: 'workspace_subscriptions', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'livestock', label: 'Data ternak', description: 'Ternak dan riwayat pemilikannya.', table: 'livestock', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'livestock', label: 'Riwayat kepemilikan ternak', description: 'Riwayat kepemilikan yang menunjuk workspace ini.', table: 'livestock_ownership_history', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'livestock', label: 'Transfer ternak', description: 'Transfer ternak yang terkait workspace.', table: 'livestock_transfers', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'livestock', label: 'Permintaan mutasi', description: 'Permintaan mutasi dari atau menuju workspace.', table: 'mutation_requests', columns: ['workspace_id', 'destination_workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'batches', label: 'Batch ternak', description: 'Batch yang dimiliki workspace.', table: 'batches', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'health', label: 'Data kesehatan', description: 'Pemeriksaan, treatment, jadwal kontrol, dan stok obat.', table: 'health_checkups', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'health', label: 'Treatment kesehatan', description: 'Riwayat treatment kesehatan workspace.', table: 'health_treatments', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'health', label: 'Jadwal kontrol kesehatan', description: 'Jadwal kontrol kesehatan workspace.', table: 'health_control_schedules', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'health', label: 'Stok obat', description: 'Stok obat dan pergerakan stok workspace.', table: 'stok_obat', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'health', label: 'Transaksi stok obat', description: 'Penerimaan, pengeluaran, dan penyesuaian stok obat.', table: 'stok_obat_masuk', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'health', label: 'Pengeluaran stok obat', description: 'Pengeluaran obat workspace.', table: 'stok_obat_keluar', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'health', label: 'Penyesuaian stok obat', description: 'Penyesuaian stok obat workspace.', table: 'stok_obat_adjustments', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'reproduction', label: 'Program reproduksi', description: 'Program dan catatan reproduksi workspace.', table: 'reproduksi_programs', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'reproduction', label: 'Pelaksanaan reproduksi', description: 'Pelaksanaan program reproduksi workspace.', table: 'pelaksanaan_reproduksi', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'reproduction', label: 'Pemeriksaan reproduksi', description: 'Pemeriksaan kebuntingan dan kelahiran workspace.', table: 'pemeriksaan_kebuntingan', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'reproduction', label: 'Catatan kebuntingan', description: 'Catatan kebuntingan workspace.', table: 'kebuntingan', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'reproduction', label: 'Catatan kelahiran', description: 'Catatan kelahiran workspace.', table: 'kelahiran', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'reproduction', label: 'Registrasi anak', description: 'Registrasi anak workspace.', table: 'registrasi_anak', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'reproduction', label: 'Data sapih', description: 'Data penyapihan workspace.', table: 'sapih', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'feed', label: 'Data pakan', description: 'Formula, inventaris, jadwal, dan pencatatan pakan.', table: 'feed_formulas', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'feed', label: 'Produksi formula pakan', description: 'Produksi formula pakan workspace.', table: 'feed_formula_productions', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'feed', label: 'Stok inventaris pakan', description: 'Inventaris pakan workspace.', table: 'stok_inventaris', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'feed', label: 'Transaksi inventaris pakan', description: 'Transaksi stok inventaris pakan workspace.', table: 'stok_inventaris_transactions', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'feed', label: 'Jadwal pemberian pakan', description: 'Jadwal pemberian pakan workspace.', table: 'jadwal_pemberian_pakan', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'feed', label: 'Pencatatan pemberian pakan', description: 'Pencatatan pemberian pakan workspace.', table: 'pemberian_pakan', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'marketplace', label: 'Listing marketplace', description: 'Listing yang dibuat oleh workspace.', table: 'marketplace_listings', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'marketplace', label: 'Chat marketplace', description: 'Chat marketplace sebagai pembeli atau penjual.', table: 'marketplace_chat_rooms', columns: ['buyer_workspace_id', 'seller_workspace_id'], blocksDelete: true, blocksArchive: true },
  { key: 'marketplace', label: 'Negosiasi marketplace', description: 'Negosiasi marketplace sebagai pembeli atau penjual.', table: 'marketplace_negotiations', columns: ['buyer_workspace_id', 'seller_workspace_id'], blocksDelete: true, blocksArchive: true },
  { key: 'marketplace', label: 'Transaksi marketplace', description: 'Transaksi marketplace sebagai pembeli atau penjual.', table: 'marketplace_transactions', columns: ['buyer_workspace_id', 'seller_workspace_id'], blocksDelete: true, blocksArchive: true },
  { key: 'marketplace', label: 'Moderasi marketplace', description: 'Laporan moderasi yang dibuat workspace.', table: 'marketplace_moderations', columns: ['reported_by_workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'transactions', label: 'Transaction room', description: 'Transaction room sebagai pembeli atau penjual.', table: 'transaction_rooms', columns: ['buyer_workspace_id', 'seller_workspace_id'], blocksDelete: true, blocksArchive: true },
  { key: 'transactions', label: 'Peserta transaction room', description: 'Keikutsertaan workspace dalam transaction room.', table: 'transaction_participants', columns: ['workspace_id'], blocksDelete: true, blocksArchive: true },
  { key: 'transactions', label: 'Lampiran transaksi', description: 'Lampiran yang diunggah oleh workspace.', table: 'transaction_attachments', columns: ['uploaded_by_workspace_id'], blocksDelete: true, blocksArchive: true },
  { key: 'transactions', label: 'Quotation layanan', description: 'Quotation layanan yang dibuat workspace.', table: 'service_quotations', columns: ['provider_workspace_id'], blocksDelete: true, blocksArchive: true },
  { key: 'services', label: 'Layanan workspace', description: 'Layanan transportasi, dokter, atau klinik.', table: 'layanan_transport', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'services', label: 'Layanan dokter hewan', description: 'Profil layanan dokter hewan workspace.', table: 'layanan_dokter_hewan', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'services', label: 'Layanan klinik hewan', description: 'Profil layanan klinik hewan workspace.', table: 'layanan_klinik_hewan', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'services', label: 'Transaksi transportasi', description: 'Transaksi transportasi yang memakai workspace.', table: 'transport_transactions', columns: ['transport_workspace_id'], blocksDelete: true, blocksArchive: true },
  { key: 'transactions', label: 'Pesan transaksi', description: 'Pesan yang dikirim oleh workspace.', table: 'transaction_conversation_messages', columns: ['sender_workspace_id'], blocksDelete: true, blocksArchive: true },
  { key: 'transactions', label: 'Bukti transaksi', description: 'Bukti transaksi yang diajukan workspace.', table: 'transaction_evidence', columns: ['submitted_by_workspace_id'], blocksDelete: true, blocksArchive: true },
  { key: 'transactions', label: 'Audit transaksi', description: 'Audit transaksi dengan workspace sebagai actor.', table: 'transaction_audit_trail', columns: ['actor_workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'notifications', label: 'Publikasi workspace', description: 'Publikasi yang dibuat workspace.', table: 'news_publications', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'notifications', label: 'Notifikasi workspace', description: 'Notifikasi yang menunjuk workspace.', table: 'notifications', columns: ['recipient_workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'notifications', label: 'Alert dan reminder', description: 'Alert dan reminder workspace.', table: 'alert_reminders', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'trust', label: 'Verifikasi trust', description: 'Verifikasi trust workspace.', table: 'trust_verifications', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'media', label: 'Media workspace', description: 'Media yang dimiliki workspace.', table: 'media', columns: ['owner_workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'audit', label: 'Audit workspace', description: 'Audit platform untuk workspace.', table: 'global_audit_trail', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'audit', label: 'Search index workspace', description: 'Index pencarian workspace.', table: 'search_index', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
  { key: 'audit', label: 'Activity log workspace', description: 'Log aktivitas workspace.', table: 'activity_log', columns: ['workspace_id'], blocksDelete: true, blocksArchive: false },
];

// ─── Enum translators ─────────────────────────────────────────────────────────

/** App status → DB enum value */
function toDbStatus(status: WorkspaceStatus): string {
  const map: Record<WorkspaceStatus, string> = {
    Active:   'Aktif',
    Inactive: 'Nonaktif',
    Archived: 'Diarsipkan',
  };
  return map[status] ?? 'Nonaktif';
}

/** DB enum value → App status */
function fromDbStatus(status: string): WorkspaceStatus {
  const map: Record<string, WorkspaceStatus> = {
    Aktif:      'Active',
    Nonaktif:   'Inactive',
    Diarsipkan: 'Archived',
    Pending:    'Inactive',
  };
  return (map[status] as WorkspaceStatus) ?? 'Inactive';
}

/** App type → DB enum value */
function toDbType(type: WorkspaceType): string {
  if (type === 'Veterinary') return 'VeterinaryClinic';
  return type; // Farm, FeedStore, Transport are identical
}

/** DB enum value → App type */
function fromDbType(type: string): WorkspaceType {
  if (type === 'VeterinaryClinic' || type === 'VeterinaryDoctor') return 'Veterinary';
  if (type === 'Farm' || type === 'FeedStore' || type === 'Transport') return type as WorkspaceType;
  return 'Farm'; // Marketplace and unknown → safe fallback
}

// ─── Slug helper (local — avoids importing legacy workspaceFoundationData) ────

function deriveSlugLocal(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── DB row type ──────────────────────────────────────────────────────────────

type DbRow = Record<string, unknown>;

// ─── Adapters ─────────────────────────────────────────────────────────────────

/** DB row → WorkspaceRecord (app shape) */
function fromDbRow(row: DbRow): WorkspaceRecord {
  const meta = (row.metadata as Record<string, unknown>) ?? {};
  return {
    workspace_uuid:   String(row.id ?? ''),
    workspace_type:   fromDbType(String(row.type ?? 'Farm')),
    workspace_name:   String(row.name ?? ''),
    workspace_slug:   String(meta.slug ?? deriveSlugLocal(String(row.name ?? ''))),
    workspace_status: fromDbStatus(String(row.status ?? 'Nonaktif')),
    workspace_plan:   ((meta.plan as WorkspacePlan) ?? 'Free'),
    owner_user_uuid:  String(row.owner_id ?? ''),

    // Branding
    logo_url:    (row.icon    as string | null) ?? null,
    description: (row.description as string | null) ?? null,

    // Contact
    phone:   (row.phone   as string | null) ?? null,
    email:   (row.email   as string | null) ?? null,
    website: (row.website as string | null) ?? null,

    // Location — DB-001A has no country/postal_code; stored in metadata or null
    country:     (meta.country     as string | null) ?? null,
    province:    (row.province     as string | null) ?? null,
    city:        (row.city         as string | null) ?? null,
    district:    (row.district     as string | null) ?? null,
    village:     (row.village      as string | null) ?? null,
    postal_code: (meta.postal_code as string | null) ?? null,
    address:     (row.address      as string | null) ?? null,
    latitude:    typeof row.latitude  === 'number' ? (row.latitude  as number) : null,
    longitude:   typeof row.longitude === 'number' ? (row.longitude as number) : null,

    // Localisation — stored in metadata
    timezone: (meta.timezone as string | null) ?? null,
    currency: (meta.currency as string | null) ?? null,
    language: (meta.language as string | null) ?? null,

    // Timestamps
    created_at:  String(row.created_at  ?? ''),
    updated_at:  String(row.updated_at  ?? ''),
    archived_at: (row.archived_at as string | null) ?? null,
  };
}

/** WorkspaceCreateInput → DB insert payload */
function toDbInsert(input: WorkspaceCreateInput): DbRow {
  return {
    name:        input.workspace_name.trim(),
    type:        toDbType(input.workspace_type),
    status:      toDbStatus(input.workspace_status),
    owner_id:    input.owner_user_uuid,
    description: input.description  ?? null,
    icon:        input.logo_url     ?? null,
    province:    input.province     ?? null,
    city:        input.city         ?? null,
    district:    input.district     ?? null,
    village:     input.village      ?? null,
    address:     input.address      ?? null,
    latitude:    input.latitude     ?? null,
    longitude:   input.longitude    ?? null,
    phone:       input.phone        ?? null,
    email:       input.email        ?? null,
    website:     input.website      ?? null,
    metadata: {
      slug:        input.workspace_slug.trim(),
      plan:        input.workspace_plan,
      timezone:    input.timezone    ?? 'Asia/Jakarta',
      currency:    input.currency    ?? 'IDR',
      language:    input.language    ?? 'id',
      country:     input.country     ?? null,
      postal_code: input.postal_code ?? null,
    },
  };
}

/** WorkspaceUpdateInput → DB update payload (column fields only). */
function toDbColumnPatch(patch: WorkspaceUpdateInput): DbRow {
  const updates: DbRow = {};
  if (patch.workspace_name   !== undefined) updates.name    = patch.workspace_name.trim();
  if (patch.workspace_type   !== undefined) updates.type    = toDbType(patch.workspace_type);
  if (patch.workspace_status !== undefined) {
    updates.status = toDbStatus(patch.workspace_status);
    updates.archived_at = patch.workspace_status === 'Archived' ? new Date().toISOString() : null;
  }
  if (patch.logo_url    !== undefined) updates.icon     = patch.logo_url;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.phone       !== undefined) updates.phone    = patch.phone;
  if (patch.email       !== undefined) updates.email    = patch.email;
  if (patch.website     !== undefined) updates.website  = patch.website;
  if (patch.province    !== undefined) updates.province = patch.province;
  if (patch.city        !== undefined) updates.city     = patch.city;
  if (patch.district    !== undefined) updates.district = patch.district;
  if (patch.village     !== undefined) updates.village  = patch.village;
  if (patch.address     !== undefined) updates.address  = patch.address;
  if (patch.latitude    !== undefined) updates.latitude  = patch.latitude;
  if (patch.longitude   !== undefined) updates.longitude = patch.longitude;
  return updates;
}

/** Fields that go into the metadata JSONB (slug, plan, localisation). */
function hasMetaPatch(patch: WorkspaceUpdateInput): boolean {
  return (
    patch.workspace_slug !== undefined ||
    patch.workspace_plan !== undefined ||
    patch.timezone       !== undefined ||
    patch.currency       !== undefined ||
    patch.language       !== undefined ||
    patch.country        !== undefined ||
    patch.postal_code    !== undefined
  );
}

function applyMetaPatch(
  existing: Record<string, unknown>,
  patch: WorkspaceUpdateInput,
): Record<string, unknown> {
  const merged = { ...existing };
  if (patch.workspace_slug !== undefined) merged.slug        = patch.workspace_slug.trim();
  if (patch.workspace_plan !== undefined) merged.plan        = patch.workspace_plan;
  if (patch.timezone       !== undefined) merged.timezone    = patch.timezone;
  if (patch.currency       !== undefined) merged.currency    = patch.currency;
  if (patch.language       !== undefined) merged.language    = patch.language;
  if (patch.country        !== undefined) merged.country     = patch.country;
  if (patch.postal_code    !== undefined) merged.postal_code = patch.postal_code;
  return merged;
}

// ─── Read operations ──────────────────────────────────────────────────────────

/**
 * Returns all workspaces visible to the current authenticated user.
 * RLS restricts results to workspaces the caller owns or is a member of.
 */
export async function repoGetAllWorkspaces(): Promise<WorkspaceRecord[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new WorkspaceRepoError(error.message, error.code);
  return (data ?? []).map((row) => fromDbRow(row as DbRow));
}

/** Returns workspaces filtered by app-level status. */
export async function repoGetWorkspacesByStatus(
  status: WorkspaceStatus,
): Promise<WorkspaceRecord[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('status', toDbStatus(status))
    .order('created_at', { ascending: true });

  if (error) throw new WorkspaceRepoError(error.message, error.code);
  return (data ?? []).map((row) => fromDbRow(row as DbRow));
}

/** Returns workspaces filtered by app-level type. */
export async function repoGetWorkspacesByType(
  type: WorkspaceType,
): Promise<WorkspaceRecord[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('type', toDbType(type))
    .order('created_at', { ascending: true });

  if (error) throw new WorkspaceRepoError(error.message, error.code);
  return (data ?? []).map((row) => fromDbRow(row as DbRow));
}

/** Returns workspaces owned by a specific user UUID. */
export async function repoGetWorkspacesByOwner(
  ownerUuid: string,
): Promise<WorkspaceRecord[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', ownerUuid)
    .order('created_at', { ascending: true });

  if (error) throw new WorkspaceRepoError(error.message, error.code);
  return (data ?? []).map((row) => fromDbRow(row as DbRow));
}

/** Finds a workspace by its UUID (DB `id`). Returns null if not found. */
export async function repoGetWorkspaceByUuid(
  uuid: string,
): Promise<WorkspaceRecord | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', uuid)
    .maybeSingle();

  if (error) throw new WorkspaceRepoError(error.message, error.code);
  return data ? fromDbRow(data as DbRow) : null;
}

/**
 * Finds a workspace by slug (stored in metadata->>'slug').
 * Returns null if not found.
 */
export async function repoGetWorkspaceBySlug(
  slug: string,
): Promise<WorkspaceRecord | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('metadata->>slug', slug)
    .maybeSingle();

  if (error) throw new WorkspaceRepoError(error.message, error.code);
  return data ? fromDbRow(data as DbRow) : null;
}

/**
 * Reads all known downstream references for a workspace.
 *
 * This is intentionally a read-only preflight.  It does not delete child
 * records and it does not depend on database cascade behaviour.
 */
export async function repoGetWorkspaceDependencies(
  uuid: string,
): Promise<WorkspaceDependencies> {
  await requireAuthSession();

  const results = await Promise.all(
    DEPENDENCY_QUERIES.map(async (dependency) => {
      const counts = await Promise.all(
        dependency.columns.map(async (column) => {
          const { count, error } = await supabase
            .from(dependency.table)
            .select('id', { count: 'exact', head: true })
            .eq(column, uuid);

          if (error) {
            throw new WorkspaceRepoError(
              `Failed to read ${dependency.table} dependency: ${error.message}`,
              error.code,
            );
          }
          return count ?? 0;
        }),
      );

      return {
        key: dependency.key,
        label: dependency.label,
        description: dependency.description,
        count: counts.reduce((total, count) => total + count, 0),
        blocksDelete: dependency.blocksDelete,
        blocksArchive: dependency.blocksArchive,
      } satisfies WorkspaceDependencyItem;
    }),
  );

  // Several physical tables belong to the same user-facing category. Merge
  // them so the UI reports meaningful totals without exposing DB internals.
  const merged = new Map<WorkspaceDependencyKey, WorkspaceDependencyItem>();
  for (const item of results) {
    const existing = merged.get(item.key);
    if (existing) {
      existing.count += item.count;
      existing.blocksDelete ||= item.blocksDelete;
      existing.blocksArchive ||= item.blocksArchive;
    } else {
      merged.set(item.key, { ...item });
    }
  }

  const items = Array.from(merged.values()).filter((item) => item.count > 0);
  return {
    workspace_uuid: uuid,
    items,
    hasDeleteBlockers: items.some((item) => item.blocksDelete && item.count > 0),
    hasArchiveBlockers: items.some((item) => item.blocksArchive && item.count > 0),
    checked_at: new Date().toISOString(),
  };
}

// ─── Write operations ─────────────────────────────────────────────────────────

/**
 * Inserts a new workspace into Supabase.
 * slug and plan are stored in the metadata JSONB column.
 * Throws WorkspaceRepoError with code='SLUG_TAKEN' if DB signals a unique
 * violation (future: if a unique index on metadata->>'slug' is added).
 */
export async function repoInsertWorkspace(
  input: WorkspaceCreateInput,
): Promise<WorkspaceRecord> {
  await requireAuthSession();
  const row = toDbInsert(input);

  const { data, error } = await supabase
    .from('workspaces')
    .insert(row)
    .select()
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      throw new WorkspaceRepoError(
        `Slug "${input.workspace_slug}" is already taken.`,
        'SLUG_TAKEN',
      );
    }
    throw new WorkspaceRepoError(error.message, error.code);
  }

  return fromDbRow(data as DbRow);
}

/**
 * Applies a partial update to an existing workspace.
 * For metadata-stored fields (slug, plan, timezone, currency, language),
 * reads the current metadata first and merges the patch to avoid overwriting
 * unrelated metadata keys.
 * Returns null if the workspace was not found.
 */
export async function repoPatchWorkspace(
  uuid: string,
  patch: WorkspaceUpdateInput,
): Promise<WorkspaceRecord | null> {
  await requireAuthSession();
  const now = new Date().toISOString();
  const updates: DbRow = { ...toDbColumnPatch(patch), updated_at: now };

  // If any metadata-backed field is in the patch, fetch current metadata and merge.
  if (hasMetaPatch(patch)) {
    const { data: current, error: fetchErr } = await supabase
      .from('workspaces')
      .select('metadata')
      .eq('id', uuid)
      .maybeSingle();

    if (!fetchErr && current) {
      const existingMeta = ((current as DbRow).metadata as Record<string, unknown>) ?? {};
      updates.metadata = applyMetaPatch(existingMeta, patch);
    }
  }

  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', uuid)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      throw new WorkspaceRepoError(
        `Slug "${String(patch.workspace_slug ?? '')}" is already taken.`,
        'SLUG_TAKEN',
      );
    }
    throw new WorkspaceRepoError(error.message, error.code);
  }

  return data ? fromDbRow(data as DbRow) : null;
}

/**
 * Hard-deletes a workspace by UUID.
 * Prefer status → 'Archived' for recoverable soft-deletes.
 * Returns true if a row was removed.
 */
export async function repoDeleteWorkspace(uuid: string): Promise<boolean> {
  await requireAuthSession();
  const { error, count } = await supabase
    .from('workspaces')
    .delete({ count: 'exact' })
    .eq('id', uuid);

  if (error) throw new WorkspaceRepoError(error.message, error.code);
  return (count ?? 0) > 0;
}
