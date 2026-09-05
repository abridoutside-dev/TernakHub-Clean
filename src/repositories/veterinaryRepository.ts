// ─── Veterinary Repository — VET-REPO-001 ─────────────────────────────────────
//
// Supabase adapter for the Veterinary workspace.
// Tables covered:
//   layanan_dokter_hewan   → Dokter Hewan service catalog
//   layanan_klinik_hewan   → Klinik Hewan service catalog
//   service_quotations     → Marketplace quotations for vet services
//   transaction_rooms      → Canonical bridge (marketplace ↔ vet)
//   health_checkups        → Pemeriksaan (via healthRepository)
//   health_treatments      → Tindakan/Resep (via healthRepository)
//   health_control_schedules → Jadwal (via healthRepository)
//   activity_log           → Aktivitas workspace
//
// Rules:
//   - All functions are async and return typed results.
//   - requireAuthSession() guards every exported function.
//   - Never import from pages, components, or contexts.
//   - Supabase is the SSOT; in-memory stores are populated by useHealth().

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';
import type {
  VetServiceDbRow,
  VetServiceCreateInput,
  VetServicePatchInput,
  ClinicServiceDbRow,
  ClinicServiceCreateInput,
  ClinicServicePatchInput,
  VetServiceQuotationDbRow,
  VetServiceQuotationCreateInput,
  VetServiceQuotationPatchInput,
  CreateVetServiceFromMarketplaceInput,
  CreateVetServiceFromMarketplaceResult,
  TransactionRoomDbRow,
  TransactionRoomCreateInput,
  TransactionRoomUpdateInput,
  VetActivityLogDbRow,
} from '../types/veterinary';
import type {
  HealthCheckupDbRow,
  HealthCheckupCreateInput,
  HealthCheckupPatchInput,
  HealthTreatmentDbRow,
  HealthTreatmentCreateInput,
  HealthControlScheduleDbRow,
  HealthControlScheduleCreateInput,
  HealthControlSchedulePatchInput,
} from '../types/health';

// ─── Error ────────────────────────────────────────────────────────────────────

export class VeterinaryRepoError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'VeterinaryRepoError';
  }
}

function guard(error: { message: string; code?: string } | null): void {
  if (error) throw new VeterinaryRepoError(error.message, error.code);
}

// ─── layanan_dokter_hewan ─────────────────────────────────────────────────────

/**
 * All layanan_dokter_hewan for a workspace, ordered by name.
 */
export async function repoGetVetServicesByWorkspace(
  workspaceId: string,
): Promise<VetServiceDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('layanan_dokter_hewan')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('nama', { ascending: true });
  guard(error);
  return (data ?? []) as VetServiceDbRow[];
}

/**
 * Single layanan_dokter_hewan by UUID.
 */
export async function repoGetVetServiceById(id: string): Promise<VetServiceDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('layanan_dokter_hewan')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as VetServiceDbRow | null;
}

/**
 * Insert a new layanan_dokter_hewan row.
 */
export async function repoInsertVetService(
  input: VetServiceCreateInput,
): Promise<VetServiceDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('layanan_dokter_hewan')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as VetServiceDbRow;
}

/**
 * Patch a layanan_dokter_hewan row.
 */
export async function repoPatchVetService(
  id: string,
  patch: VetServicePatchInput,
): Promise<VetServiceDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('layanan_dokter_hewan')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  guard(error);
  return data as VetServiceDbRow | null;
}

/**
 * Delete a layanan_dokter_hewan row.
 */
export async function repoDeleteVetService(id: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('layanan_dokter_hewan')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── layanan_klinik_hewan ──────────────────────────────────────────────────────

/**
 * All layanan_klinik_hewan for a workspace, ordered by nama_klinik.
 */
export async function repoGetClinicServicesByWorkspace(
  workspaceId: string,
): Promise<ClinicServiceDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('layanan_klinik_hewan')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('nama_klinik', { ascending: true });
  guard(error);
  return (data ?? []) as ClinicServiceDbRow[];
}

/**
 * Single layanan_klinik_hewan by UUID.
 */
export async function repoGetClinicServiceById(id: string): Promise<ClinicServiceDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('layanan_klinik_hewan')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as ClinicServiceDbRow | null;
}

/**
 * Insert a new layanan_klinik_hewan row.
 */
export async function repoInsertClinicService(
  input: ClinicServiceCreateInput,
): Promise<ClinicServiceDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('layanan_klinik_hewan')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as ClinicServiceDbRow;
}

/**
 * Patch a layanan_klinik_hewan row.
 */
export async function repoPatchClinicService(
  id: string,
  patch: ClinicServicePatchInput,
): Promise<ClinicServiceDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('layanan_klinik_hewan')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  guard(error);
  return data as ClinicServiceDbRow | null;
}

/**
 * Delete a layanan_klinik_hewan row.
 */
export async function repoDeleteClinicService(id: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('layanan_klinik_hewan')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── service_quotations ────────────────────────────────────────────────────────

/**
 * All service_quotations for a provider workspace.
 */
export async function repoGetServiceQuotationsByWorkspace(
  workspaceId: string,
): Promise<VetServiceQuotationDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('service_quotations')
    .select('*')
    .eq('provider_workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  guard(error);
  return (data ?? []) as VetServiceQuotationDbRow[];
}

/**
 * Single service_quotation by UUID.
 */
export async function repoGetServiceQuotationById(
  id: string,
): Promise<VetServiceQuotationDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('service_quotations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as VetServiceQuotationDbRow | null;
}

/**
 * Insert a new service_quotation.
 */
export async function repoInsertServiceQuotation(
  input: VetServiceQuotationCreateInput,
): Promise<VetServiceQuotationDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('service_quotations')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as VetServiceQuotationDbRow;
}

/**
 * Patch a service_quotation.
 */
export async function repoPatchServiceQuotation(
  id: string,
  patch: VetServiceQuotationPatchInput,
): Promise<VetServiceQuotationDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('service_quotations')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  guard(error);
  return data as VetServiceQuotationDbRow | null;
}

// ─── transaction_rooms (canonical bridge) ─────────────────────────────────────

/**
 * Get the canonical transaction_rooms row for a marketplace transaction.
 */
export async function repoGetTransactionRoomByMarketplace(
  marketplaceTransactionId: string,
): Promise<TransactionRoomDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transaction_rooms')
    .select('*')
    .eq('marketplace_transaction_id', marketplaceTransactionId)
    .maybeSingle();
  guard(error);
  return data as TransactionRoomDbRow | null;
}

/**
 * Get-or-create transaction_rooms row for a marketplace transaction.
 */
export async function repoGetOrCreateTransactionRoom(
  input: TransactionRoomCreateInput,
): Promise<TransactionRoomDbRow> {
  await requireAuthSession();
  const existing = await repoGetTransactionRoomByMarketplace(input.marketplace_transaction_id);
  if (existing) return existing;
  const { data, error } = await supabase
    .from('transaction_rooms')
    .insert({
      marketplace_transaction_id: input.marketplace_transaction_id,
      buyer_workspace_id: input.buyer_workspace_id,
      seller_workspace_id: input.seller_workspace_id,
      status: input.status ?? 'Open',
      has_escrow: input.has_escrow ?? false,
      has_transport: input.has_transport ?? false,
      total_amount: input.total_amount ?? 0,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  guard(error);
  return data as TransactionRoomDbRow;
}

/**
 * Patch a transaction_rooms row.
 */
export async function repoPatchTransactionRoom(
  id: string,
  patch: TransactionRoomUpdateInput,
): Promise<TransactionRoomDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transaction_rooms')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  guard(error);
  return data as TransactionRoomDbRow | null;
}

// ─── Marketplace → Veterinary (Gap #1) ────────────────────────────────────────

/**
 * Create a service_quotation from a marketplace order.
 *
 * Flow:
 *   1. Read marketplace_transactions row (buyer/seller/listing/price/status).
 *   2. Validate order is eligible for vet service creation.
 *   3. Get-or-create transaction_rooms row.
 *   4. Check for existing active service_quotation for this room → return if found (idempotent).
 *   5. Insert new service_quotation with service_type = DokterHewan | KlinikHewan.
 */
export async function repoCreateVetServiceFromMarketplace(
  input: CreateVetServiceFromMarketplaceInput,
): Promise<CreateVetServiceFromMarketplaceResult> {
  await requireAuthSession();
  if (!input.marketplace_transaction_id) {
    throw new VeterinaryRepoError('marketplace_transaction_id wajib diisi.');
  }
  if (!input.vet_workspace_id) {
    throw new VeterinaryRepoError('vet_workspace_id wajib diisi.');
  }

  // 1. Read marketplace_transactions row.
  const { data: txRow, error: txErr } = await supabase
    .from('marketplace_transactions')
    .select('id, listing_id, buyer_workspace_id, seller_workspace_id, agreed_price, status, notes')
    .eq('id', input.marketplace_transaction_id)
    .maybeSingle();
  guard(txErr);
  if (!txRow) {
    throw new VeterinaryRepoError('Marketplace order tidak ditemukan.');
  }

  // 2. Validate eligibility.
  const ELIGIBLE_STATUSES = new Set(['Disetujui', 'Diproses', 'Siap Diserahkan', 'Sedang Dikirim']);
  if (!ELIGIBLE_STATUSES.has(txRow.status)) {
    throw new VeterinaryRepoError(
      `Order marketplace berstatus "${txRow.status}" belum eligible untuk layanan veteriner. ` +
        `Status eligible: Disetujui, Diproses, Siap Diserahkan, Sedang Dikirim.`,
    );
  }
  if (txRow.buyer_workspace_id === txRow.seller_workspace_id) {
    throw new VeterinaryRepoError('Order marketplace tidak valid: buyer dan seller sama.');
  }
  if ((txRow.agreed_price ?? 0) < 0) {
    throw new VeterinaryRepoError('Order marketplace tidak valid: harga negatif.');
  }

  // 3. Get-or-create transaction_rooms.
  const room = await repoGetOrCreateTransactionRoom({
    marketplace_transaction_id: txRow.id,
    buyer_workspace_id: txRow.buyer_workspace_id,
    seller_workspace_id: txRow.seller_workspace_id,
    has_transport: false,
    total_amount: txRow.agreed_price ?? 0,
    notes: txRow.notes ?? null,
  });

  // 4. Idempotent: reuse existing quotation if any.
  const { data: existingQuotation, error: eqErr } = await supabase
    .from('service_quotations')
    .select('*')
    .eq('room_id', room.id)
    .eq('provider_workspace_id', input.vet_workspace_id)
    .neq('status', 'Dibatalkan')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  guard(eqErr);
  if (existingQuotation) {
    return {
      quotation: existingQuotation as VetServiceQuotationDbRow,
      transaction_room: room,
      reused: true,
    };
  }

  // 5. Insert new quotation.
  const { data: quotation, error: insErr } = await supabase
    .from('service_quotations')
    .insert({
      room_id: room.id,
      provider_workspace_id: input.vet_workspace_id,
      service_type: input.service_type,
      service_detail: input.service_detail ?? null,
      price: input.price,
      status: 'Draft',
      valid_until: input.valid_until ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  guard(insErr);
  return {
    quotation: quotation as VetServiceQuotationDbRow,
    transaction_room: room,
    reused: false,
  };
}

// ─── Health Checkups (veterinary-specific wrappers) ────────────────────────────

/**
 * All health checkups for a veterinary workspace, newest first.
 */
export async function repoGetVetCheckupsByWorkspace(
  workspaceId: string,
): Promise<HealthCheckupDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_checkups')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('checkup_date', { ascending: false });
  guard(error);
  return (data ?? []) as HealthCheckupDbRow[];
}

/**
 * Insert a new health checkup for a veterinary workspace.
 */
export async function repoInsertVetCheckup(
  input: HealthCheckupCreateInput,
): Promise<HealthCheckupDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_checkups')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as HealthCheckupDbRow;
}

/**
 * Patch a health checkup for a veterinary workspace.
 */
export async function repoPatchVetCheckup(
  id: string,
  patch: HealthCheckupPatchInput,
): Promise<HealthCheckupDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_checkups')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  guard(error);
  return data as HealthCheckupDbRow | null;
}

/**
 * Delete a health checkup for a veterinary workspace.
 */
export async function repoDeleteVetCheckup(id: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('health_checkups')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── Health Treatments (veterinary-specific wrappers) ──────────────────────────

/**
 * All health treatments for a veterinary workspace, newest first.
 */
export async function repoGetVetTreatmentsByWorkspace(
  workspaceId: string,
): Promise<HealthTreatmentDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_treatments')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('treatment_date', { ascending: false });
  guard(error);
  return (data ?? []) as HealthTreatmentDbRow[];
}

/**
 * Insert a new health treatment for a veterinary workspace.
 */
export async function repoInsertVetTreatment(
  input: HealthTreatmentCreateInput,
): Promise<HealthTreatmentDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_treatments')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as HealthTreatmentDbRow;
}

/**
 * Patch a health treatment for a veterinary workspace.
 */
export async function repoPatchVetTreatment(
  id: string,
  patch: Partial<
    Pick<
      HealthTreatmentDbRow,
      | 'treatment_type'
      | 'drug_id'
      | 'drug_name'
      | 'dosage'
      | 'route'
      | 'duration_days'
      | 'next_treatment_date'
      | 'cost'
      | 'veterinarian'
      | 'notes'
    >
  >,
): Promise<HealthTreatmentDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_treatments')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  guard(error);
  return data as HealthTreatmentDbRow | null;
}

/**
 * Delete a health treatment for a veterinary workspace.
 */
export async function repoDeleteVetTreatment(id: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('health_treatments')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── Health Control Schedules (veterinary-specific wrappers) ───────────────────

/**
 * All health control schedules for a veterinary workspace, ordered by date ascending.
 */
export async function repoGetVetSchedulesByWorkspace(
  workspaceId: string,
): Promise<HealthControlScheduleDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_control_schedules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('scheduled_date', { ascending: true });
  guard(error);
  return (data ?? []) as HealthControlScheduleDbRow[];
}

/**
 * Insert a new health control schedule for a veterinary workspace.
 */
export async function repoInsertVetSchedule(
  input: HealthControlScheduleCreateInput,
): Promise<HealthControlScheduleDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_control_schedules')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as HealthControlScheduleDbRow;
}

/**
 * Patch a health control schedule for a veterinary workspace.
 */
export async function repoPatchVetSchedule(
  id: string,
  patch: HealthControlSchedulePatchInput,
): Promise<HealthControlScheduleDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('health_control_schedules')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  guard(error);
  return data as HealthControlScheduleDbRow | null;
}

/**
 * Mark a scheduled control as completed.
 */
export async function repoCompleteVetSchedule(id: string): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('health_control_schedules')
    .update({ status: 'Selesai' })
    .eq('id', id);
  guard(error);
}

// ─── Activity Log ──────────────────────────────────────────────────────────────

/**
 * Activity log entries for a veterinary workspace.
 */
export async function repoGetVetActivityLogByWorkspace(
  workspaceId: string,
  limit = 20,
): Promise<VetActivityLogDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('domain', 'veterinary')
    .order('created_at', { ascending: false })
    .limit(limit);
  guard(error);
  return (data ?? []) as VetActivityLogDbRow[];
}
