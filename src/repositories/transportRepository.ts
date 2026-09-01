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
  TransportShipmentBatchDbRow,
  TransportShipmentBatchCreateInput,
  TransportShipmentBatchItemDbRow,
  TransportShipmentBatchItemCreateInput,
  TransportVehicleMaintenanceDbRow,
  TransportVehicleMaintenanceCreateInput,
  TransportVehicleMaintenanceUpdateInput,
  TransportTripCostDbRow,
  TransportTripCostCreateInput,
  TransportTripCostUpdateInput,
  TransportDriverPaymentDbRow,
  TransportDriverPaymentCreateInput,
  TransportDriverPaymentUpdateInput,
  TransportRevenueDbRow,
  TransportRevenueCreateInput,
  TransportRevenueUpdateInput,
  TransportFinancialSummary,
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

// ─── transport_shipment_batches ─────────────────────────────────────────────────

export async function repoListShipmentBatches(
  workspaceId: string,
): Promise<TransportShipmentBatchDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_shipment_batches')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  guard(error);
  return (data ?? []) as TransportShipmentBatchDbRow[];
}

export async function repoGetShipmentBatch(
  id: string,
): Promise<TransportShipmentBatchDbRow | null> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_shipment_batches')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  guard(error);
  return data as TransportShipmentBatchDbRow | null;
}

export async function repoCreateShipmentBatch(
  input: TransportShipmentBatchCreateInput,
): Promise<TransportShipmentBatchDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_shipment_batches')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as TransportShipmentBatchDbRow;
}

export async function repoUpdateShipmentBatch(
  id: string,
  patch: Partial<TransportShipmentBatchCreateInput>,
): Promise<TransportShipmentBatchDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_shipment_batches')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as TransportShipmentBatchDbRow;
}

export async function repoAddTransactionToBatch(
  input: TransportShipmentBatchItemCreateInput,
): Promise<TransportShipmentBatchItemDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_shipment_batch_items')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as TransportShipmentBatchItemDbRow;
}

export async function repoRemoveTransactionFromBatch(
  batchId: string,
  transactionId: string,
): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('transport_shipment_batch_items')
    .delete()
    .eq('batch_id', batchId)
    .eq('transaction_id', transactionId);
  guard(error);
}

export async function repoListPendingMergeDeliveries(
  workspaceId: string,
): Promise<TransportDeliveryDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_transactions')
    .select('*')
    .eq('transport_workspace_id', workspaceId)
    .eq('status', 'Menunggu')
    .order('created_at', { ascending: true });
  guard(error);
  const rows = (data ?? []) as TransportDeliveryDbRow[];
  const { data: itemRows } = await supabase
    .from('transport_shipment_batch_items')
    .select('transaction_id')
    .eq('workspace_id', workspaceId);
  const inBatchIds = new Set((itemRows ?? []).map((item: { transaction_id: string }) => item.transaction_id));
  return rows.filter((row) => !inBatchIds.has(row.id));
}

export async function repoListScheduledDeliveries(
  workspaceId: string,
): Promise<TransportDeliveryDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_transactions')
    .select('*')
    .eq('transport_workspace_id', workspaceId)
    .eq('status', 'Dikonfirmasi')
    .order('scheduled_date', { ascending: true });
  guard(error);
  return (data ?? []) as TransportDeliveryDbRow[];
}

// ─── transport_vehicle_maintenance ──────────────────────────────────────────────

export async function repoListMaintenanceByVehicle(
  workspaceId: string,
  vehicleId?: string,
): Promise<TransportVehicleMaintenanceDbRow[]> {
  await requireAuthSession();
  let query = supabase
    .from('transport_vehicle_maintenance')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('tanggal', { ascending: false });
  if (vehicleId) {
    query = query.eq('kendaraan_id', vehicleId);
  }
  const { data, error } = await query;
  guard(error);
  return (data ?? []) as TransportVehicleMaintenanceDbRow[];
}

export async function repoInsertMaintenance(
  input: TransportVehicleMaintenanceCreateInput,
): Promise<TransportVehicleMaintenanceDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_vehicle_maintenance')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as TransportVehicleMaintenanceDbRow;
}

export async function repoUpdateMaintenance(
  id: string,
  patch: Partial<TransportVehicleMaintenanceUpdateInput>,
): Promise<TransportVehicleMaintenanceDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_vehicle_maintenance')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as TransportVehicleMaintenanceDbRow;
}

export async function repoDeleteMaintenance(
  id: string,
): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('transport_vehicle_maintenance')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── transport_driver_payments ──────────────────────────────────────────────────

export async function repoListDriverPayments(
  workspaceId: string,
  driverId?: string,
): Promise<TransportDriverPaymentDbRow[]> {
  await requireAuthSession();
  let query = supabase
    .from('transport_driver_payments')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('periode', { ascending: false });
  if (driverId) {
    query = query.eq('driver_id', driverId);
  }
  const { data, error } = await query;
  guard(error);
  return (data ?? []) as TransportDriverPaymentDbRow[];
}

export async function repoInsertDriverPayment(
  input: TransportDriverPaymentCreateInput,
): Promise<TransportDriverPaymentDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_driver_payments')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as TransportDriverPaymentDbRow;
}

export async function repoUpdateDriverPayment(
  id: string,
  patch: Partial<TransportDriverPaymentUpdateInput>,
): Promise<TransportDriverPaymentDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_driver_payments')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as TransportDriverPaymentDbRow;
}

export async function repoDeleteDriverPayment(
  id: string,
): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('transport_driver_payments')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── transport_trip_costs ───────────────────────────────────────────────────────

export async function repoListTripCosts(
  workspaceId: string,
  filters?: { batchId?: string; transactionId?: string; kendaraanId?: string; driverId?: string },
): Promise<TransportTripCostDbRow[]> {
  await requireAuthSession();
  let query = supabase
    .from('transport_trip_costs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('tanggal', { ascending: false });
  if (filters?.batchId) query = query.eq('batch_id', filters.batchId);
  if (filters?.transactionId) query = query.eq('transaction_id', filters.transactionId);
  if (filters?.kendaraanId) query = query.eq('kendaraan_id', filters.kendaraanId);
  if (filters?.driverId) query = query.eq('driver_id', filters.driverId);
  const { data, error } = await query;
  guard(error);
  return (data ?? []) as TransportTripCostDbRow[];
}

export async function repoInsertTripCost(
  input: TransportTripCostCreateInput,
): Promise<TransportTripCostDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_trip_costs')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as TransportTripCostDbRow;
}

export async function repoUpdateTripCost(
  id: string,
  patch: Partial<TransportTripCostUpdateInput>,
): Promise<TransportTripCostDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_trip_costs')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as TransportTripCostDbRow;
}

export async function repoDeleteTripCost(
  id: string,
): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('transport_trip_costs')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── transport_revenue ──────────────────────────────────────────────────────────

export async function repoListRevenueByDelivery(
  workspaceId: string,
  transactionId?: string,
): Promise<TransportRevenueDbRow[]> {
  await requireAuthSession();
  let query = supabase
    .from('transport_revenue')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('tanggal', { ascending: false });
  if (transactionId) {
    query = query.eq('transaction_id', transactionId);
  }
  const { data, error } = await query;
  guard(error);
  return (data ?? []) as TransportRevenueDbRow[];
}

export async function repoInsertRevenue(
  input: TransportRevenueCreateInput,
): Promise<TransportRevenueDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_revenue')
    .insert(input)
    .select()
    .single();
  guard(error);
  return data as TransportRevenueDbRow;
}

export async function repoUpdateRevenue(
  id: string,
  patch: Partial<TransportRevenueUpdateInput>,
): Promise<TransportRevenueDbRow> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_revenue')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  guard(error);
  return data as TransportRevenueDbRow;
}

export async function repoDeleteRevenue(
  id: string,
): Promise<void> {
  await requireAuthSession();
  const { error } = await supabase
    .from('transport_revenue')
    .delete()
    .eq('id', id);
  guard(error);
}

// ─── Financial aggregates ───────────────────────────────────────────────────────

export async function repoGetTransportFinancialSummary(
  workspaceId: string,
): Promise<TransportFinancialSummary> {
  await requireAuthSession();

  const [
    revenueRows,
    tripCostRows,
    maintenanceRows,
    driverPaymentRows,
    deliveryRows,
  ] = await Promise.all([
    supabase.from('transport_revenue').select('nominal, jenis, transaction_id').eq('workspace_id', workspaceId),
    supabase.from('transport_trip_costs').select('nominal, kategori, kendaraan_id, driver_id').eq('workspace_id', workspaceId),
    supabase.from('transport_vehicle_maintenance').select('biaya, kendaraan_id').eq('workspace_id', workspaceId),
    supabase.from('transport_driver_payments').select('nominal, driver_id').eq('workspace_id', workspaceId),
    supabase.from('transport_transactions').select('id, origin, destination').eq('transport_workspace_id', workspaceId),
  ]);

  guard(revenueRows.error);
  guard(tripCostRows.error);
  guard(maintenanceRows.error);
  guard(driverPaymentRows.error);
  guard(deliveryRows.error);

  const revenues = (revenueRows.data ?? []) as { nominal: number; jenis: string; transaction_id: string }[];
  const tripCosts = (tripCostRows.data ?? []) as { nominal: number; kategori: string; kendaraan_id: string; driver_id: string }[];
  const maints = (maintenanceRows.data ?? []) as { biaya: number; kendaraan_id: string }[];
  const driverPays = (driverPaymentRows.data ?? []) as { nominal: number; driver_id: string }[];
  const deliveries = (deliveryRows.data ?? []) as { id: string; origin: string; destination: string }[];

  const revenueTotal = revenues.reduce((s, r) => s + (Number(r.nominal) || 0), 0);
  const tripCostTotal = tripCosts.reduce((s, r) => s + (Number(r.nominal) || 0), 0);
  const maintenanceTotal = maints.reduce((s, r) => s + (Number(r.biaya) || 0), 0);
  const driverPaymentTotal = driverPays.reduce((s, r) => s + (Number(r.nominal) || 0), 0);
  const expenseTotal = tripCostTotal + maintenanceTotal + driverPaymentTotal;
  const netProfit = revenueTotal - expenseTotal;

  const deliveryCount = deliveries.length;
  const completedDeliveryCount = deliveries.filter((d) => d.origin && d.destination).length;

  const revenueByType: Record<string, number> = {};
  for (const r of revenues) {
    revenueByType[r.jenis] = (revenueByType[r.jenis] || 0) + (Number(r.nominal) || 0);
  }

  const costByCategory: Record<string, number> = {};
  for (const c of tripCosts) {
    costByCategory[c.kategori] = (costByCategory[c.kategori] || 0) + (Number(c.nominal) || 0);
  }
  costByCategory['Maintenance'] = (costByCategory['Maintenance'] || 0) + maintenanceTotal;
  costByCategory['Driver Payment'] = (costByCategory['Driver Payment'] || 0) + driverPaymentTotal;

  const deliveryMap = new Map(deliveries.map((d) => [d.id, d]));

  const costsPerDelivery = revenues.map((r) => {
    const d = deliveryMap.get(r.transaction_id);
    const relatedCost = tripCosts
      .filter((c) => c.driver_id || c.kendaraan_id)
      .reduce((s, c) => s + (Number(c.nominal) || 0), 0);
    return {
      transaction_id: r.transaction_id,
      origin: d?.origin ?? '-',
      destination: d?.destination ?? '-',
      revenue: Number(r.nominal) || 0,
      cost_total: relatedCost,
      profit: (Number(r.nominal) || 0) - relatedCost,
    };
  });

  const costsPerVehicleMap = new Map<string, { kendaraan_id: string; nomor_polisi: string; revenue: number; cost_total: number; profit: number }>();
  const vehicleIdToPolisi = new Map<string, string>();
  const vehicleRows = await repoGetTransportVehiclesByWorkspace(workspaceId);
  for (const v of vehicleRows) {
    vehicleIdToPolisi.set(v.id, v.nomor_polisi);
  }
  for (const c of tripCosts) {
    if (!c.kendaraan_id) continue;
    let existing = costsPerVehicleMap.get(c.kendaraan_id);
    if (!existing) {
      existing = { kendaraan_id: c.kendaraan_id, nomor_polisi: vehicleIdToPolisi.get(c.kendaraan_id) ?? c.kendaraan_id, revenue: 0, cost_total: 0, profit: 0 };
      costsPerVehicleMap.set(c.kendaraan_id, existing);
    }
    existing.cost_total += Number(c.nominal) || 0;
    existing.profit = existing.revenue - existing.cost_total;
  }
  for (const m of maints) {
    if (!m.kendaraan_id) continue;
    let existing = costsPerVehicleMap.get(m.kendaraan_id);
    if (!existing) {
      existing = { kendaraan_id: m.kendaraan_id, nomor_polisi: vehicleIdToPolisi.get(m.kendaraan_id) ?? m.kendaraan_id, revenue: 0, cost_total: 0, profit: 0 };
      costsPerVehicleMap.set(m.kendaraan_id, existing);
    }
    existing.cost_total += Number(m.biaya) || 0;
    existing.profit = existing.revenue - existing.cost_total;
  }
  const costsPerVehicle = Array.from(costsPerVehicleMap.values());

  const costsPerDriverMap = new Map<string, { driver_id: string; nama: string; payment_total: number; cost_total: number }>();
  const driverIdToNama = new Map<string, string>();
  const driverRows = await repoGetTransportDriversByWorkspace(workspaceId);
  for (const d of driverRows) {
    driverIdToNama.set(d.id, d.nama);
  }
  for (const p of driverPays) {
    const existing = costsPerDriverMap.get(p.driver_id) ?? { driver_id: p.driver_id, nama: driverIdToNama.get(p.driver_id) ?? p.driver_id, payment_total: 0, cost_total: 0 };
    existing.payment_total += Number(p.nominal) || 0;
    costsPerDriverMap.set(p.driver_id, existing);
  }
  for (const c of tripCosts) {
    if (!c.driver_id) continue;
    const existing = costsPerDriverMap.get(c.driver_id) ?? { driver_id: c.driver_id, nama: driverIdToNama.get(c.driver_id) ?? c.driver_id, payment_total: 0, cost_total: 0 };
    existing.cost_total += Number(c.nominal) || 0;
    costsPerDriverMap.set(c.driver_id, existing);
  }
  const costsPerDriver = Array.from(costsPerDriverMap.values());

  return {
    currency: 'IDR',
    period_start: new Date().toISOString().slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10),
    revenue_total: revenueTotal,
    expense_total: expenseTotal,
    maintenance_total: maintenanceTotal,
    driver_payment_total: driverPaymentTotal,
    trip_cost_total: tripCostTotal,
    net_profit: netProfit,
    delivery_count: deliveryCount,
    completed_delivery_count: completedDeliveryCount,
    revenue_by_type: revenueByType,
    cost_by_category: costByCategory,
    costs_per_delivery: costsPerDelivery,
    costs_per_vehicle: costsPerVehicle,
    costs_per_driver: costsPerDriver,
  };
}

export async function repoGetRevenueExpenseBreakdown(
  workspaceId: string,
): Promise<{ revenue: number; expense: number; net: number }> {
  const summary = await repoGetTransportFinancialSummary(workspaceId);
  return {
    revenue: summary.revenue_total,
    expense: summary.expense_total,
    net: summary.net_profit,
  };
}

export async function repoGetProfitLoss(
  workspaceId: string,
): Promise<{ profit: number; loss: number }> {
  const summary = await repoGetTransportFinancialSummary(workspaceId);
  return {
    profit: summary.net_profit >= 0 ? summary.net_profit : 0,
    loss: summary.net_profit < 0 ? Math.abs(summary.net_profit) : 0,
  };
}

export async function repoGetCostPerDelivery(
  workspaceId: string,
): Promise<Array<{ transaction_id: string; origin: string; destination: string; revenue: number; cost_total: number; profit: number }>> {
  const summary = await repoGetTransportFinancialSummary(workspaceId);
  return summary.costs_per_delivery;
}

export async function repoGetCostPerVehicle(
  workspaceId: string,
): Promise<Array<{ kendaraan_id: string; nomor_polisi: string; revenue: number; cost_total: number; profit: number }>> {
  const summary = await repoGetTransportFinancialSummary(workspaceId);
  return summary.costs_per_vehicle;
}

export async function repoGetCostPerDriver(
  workspaceId: string,
): Promise<Array<{ driver_id: string; nama: string; payment_total: number; cost_total: number }>> {
  const summary = await repoGetTransportFinancialSummary(workspaceId);
  return summary.costs_per_driver;
}

// ─── transport_tracking ─────────────────────────────────────────────────────────

export async function repoListTrackingByDelivery(
  transactionId: string,
): Promise<Array<{ latitude: number; longitude: number; location_name: string | null; speed: number | null; updated_at: string }>> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_tracking')
    .select('latitude, longitude, location_name, speed, updated_at')
    .eq('transaction_id', transactionId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false });
  guard(error);
  return (data ?? []) as Array<{ latitude: number; longitude: number; location_name: string | null; speed: number | null; updated_at: string }>;
}

export async function repoListBatchItems(
  batchId: string,
): Promise<TransportShipmentBatchItemDbRow[]> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_shipment_batch_items')
    .select('*')
    .eq('batch_id', batchId);
  guard(error);
  return (data ?? []) as TransportShipmentBatchItemDbRow[];
}

export async function repoIsDeliveryInAnyBatch(
  transactionId: string,
): Promise<boolean> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('transport_shipment_batch_items')
    .select('id')
    .eq('transaction_id', transactionId)
    .limit(1);
  guard(error);
  return (data?.length ?? 0) > 0;
}
