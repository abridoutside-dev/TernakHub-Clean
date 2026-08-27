// ─── Transport Repository ───────────────────────────────────────────────────────
//
// Supabase adapter for Transport workspace tables:
//   layanan_transport      → service listings / fleet registry
//   transport_transactions → delivery / transport order records
//
// Rules:
//   - All functions are async and return typed results.
//   - requireAuthSession() guards every exported function.
//   - No business logic — only Supabase queries.
//   - Pattern follows drugStoreRepository.ts

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';
import type {
  TransportServiceDbRow,
  TransportServiceCreateInput,
  TransportVehicleDbRow,
  TransportVehicleCreateInput,
  TransportDriverDbRow,
  TransportDriverCreateInput,
  TransportDeliveryDbRow,
  TransportDeliveryCreateInput,
} from '../types/transport';

// ─── Error ─────────────────────────────────────────────────────────────────────

export class TransportRepoError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'TransportRepoError';
  }
}

function guard(error: { message: string; code?: string } | null): void {
  if (error) throw new TransportRepoError(error.message, error.code);
}

// ─── layanan_transport ─────────────────────────────────────────────────────────

/**
 * All service listings for a transport workspace, ordered by created_at descending.
 */
export async function repoGetTransportServicesByWorkspace(
  workspaceId: string,
): Promise<TransportServiceDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('layanan_transport')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  guard(error);
  return (data ?? []) as TransportServiceDbRow[];
}

/**
 * Single service listing by ID.
 */
export async function repoGetTransportServiceById(
  id: string,
): Promise<TransportServiceDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('layanan_transport')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as TransportServiceDbRow | null;
}

/**
 * Insert a new service listing for a transport workspace.
 */
export async function repoInsertTransportService(
  input: TransportServiceCreateInput,
): Promise<TransportServiceDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('layanan_transport')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as TransportServiceDbRow;
}

/**
 * Update a service listing by ID.
 */
export async function repoUpdateTransportService(
  id: string,
  patch: Partial<TransportServiceCreateInput>,
): Promise<TransportServiceDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('layanan_transport')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as TransportServiceDbRow;
}

/**
 * Delete a service listing by ID.
 */
export async function repoDeleteTransportService(
  id: string,
): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('layanan_transport')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── transport_vehicles ─────────────────────────────────────────────────────────

/**
 * All vehicles for a transport workspace, ordered by created_at descending.
 */
export async function repoGetTransportVehiclesByWorkspace(
  workspaceId: string,
): Promise<TransportVehicleDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_vehicles')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  guard(error);
  return (data ?? []) as TransportVehicleDbRow[];
}

/**
 * Single vehicle by ID.
 */
export async function repoGetTransportVehicleById(
  id: string,
): Promise<TransportVehicleDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_vehicles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as TransportVehicleDbRow | null;
}

/**
 * Insert a new vehicle.
 */
export async function repoInsertTransportVehicle(
  input: TransportVehicleCreateInput,
): Promise<TransportVehicleDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_vehicles')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as TransportVehicleDbRow;
}

/**
 * Update a vehicle by ID.
 */
export async function repoUpdateTransportVehicle(
  id: string,
  patch: Partial<TransportVehicleCreateInput>,
): Promise<TransportVehicleDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_vehicles')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as TransportVehicleDbRow;
}

/**
 * Delete a vehicle by ID.
 */
export async function repoDeleteTransportVehicle(
  id: string,
): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('transport_vehicles')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── transport_drivers ─────────────────────────────────────────────────────────

/**
 * All drivers for a transport workspace, ordered by created_at descending.
 */
export async function repoGetTransportDriversByWorkspace(
  workspaceId: string,
): Promise<TransportDriverDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_drivers')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  guard(error);
  return (data ?? []) as TransportDriverDbRow[];
}

/**
 * Single driver by ID.
 */
export async function repoGetTransportDriverById(
  id: string,
): Promise<TransportDriverDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_drivers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as TransportDriverDbRow | null;
}

/**
 * Insert a new driver.
 */
export async function repoInsertTransportDriver(
  input: TransportDriverCreateInput,
): Promise<TransportDriverDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_drivers')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as TransportDriverDbRow;
}

/**
 * Update a driver by ID.
 */
export async function repoUpdateTransportDriver(
  id: string,
  patch: Partial<TransportDriverCreateInput>,
): Promise<TransportDriverDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_drivers')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as TransportDriverDbRow;
}

/**
 * Delete a driver by ID.
 */
export async function repoDeleteTransportDriver(
  id: string,
): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('transport_drivers')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── transport_transactions ────────────────────────────────────────────────────

/**
 * All transport transactions for a workspace, ordered by created_at descending.
 */
export async function repoGetTransportDeliveriesByWorkspace(
  workspaceId: string,
): Promise<TransportDeliveryDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_transactions')
    .select('*')
    .eq('transport_workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  guard(error);
  return (data ?? []) as TransportDeliveryDbRow[];
}

/**
 * Single transport transaction by ID.
 */
export async function repoGetTransportDeliveryById(
  id: string,
): Promise<TransportDeliveryDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_transactions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as TransportDeliveryDbRow | null;
}

/**
 * Insert a new transport transaction.
 */
export async function repoInsertTransportDelivery(
  input: TransportDeliveryCreateInput,
): Promise<TransportDeliveryDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_transactions')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as TransportDeliveryDbRow;
}

/**
 * Update transport transaction status by ID.
 */
export async function repoUpdateTransportDeliveryStatus(
  id: string,
  status: string,
): Promise<TransportDeliveryDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_transactions')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as TransportDeliveryDbRow;
}
