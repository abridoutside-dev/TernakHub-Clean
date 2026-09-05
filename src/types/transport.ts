// ─── Transport Types ────────────────────────────────────────────────────────────
//
// Supabase row types for transport tables:
//   layanan_transport      → service listings / fleet registry
//   transport_vehicles     → fleet vehicles
//   transport_drivers      → drivers
//   transport_schedules    → scheduled transport requests
//   transport_transactions → delivery / transport order records
//   transaction_rooms      → canonical room linking marketplace order ↔ transport
//                            (canonical table created in 20260725000008_transaction_services.sql)

export interface TransportServiceDbRow {
  id: string;
  workspace_id: string;
  name: string;
  vehicle_type: string | null;
  capacity: string | null;
  coverage_area: string[] | null;
  base_price: number | null;
  price_per_km: number | null;
  status: string;
  description: string | null;
  available_days: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportServiceCreateInput {
  workspace_id: string;
  name: string;
  vehicle_type?: string | null;
  capacity?: string | null;
  coverage_area?: string[] | null;
  base_price?: number | null;
  price_per_km?: number | null;
  status?: string;
  description?: string | null;
  available_days?: string[] | null;
  notes?: string | null;
}

export interface TransportVehicleDbRow {
  id: string;
  workspace_id: string;
  jenis_kendaraan: string;
  nomor_polisi: string;
  kapasitas_kg: number | null;
  status: string;
  tahun_beli: number | null;
  jenis_layanan: string[] | null;
  catatan_operasional: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportVehicleCreateInput {
  workspace_id: string;
  jenis_kendaraan: string;
  nomor_polisi: string;
  kapasitas_kg?: number | null;
  status?: string;
  tahun_beli?: number | null;
  jenis_layanan?: string[] | null;
  catatan_operasional?: string | null;
}

export interface TransportDriverDbRow {
  id: string;
  workspace_id: string;
  nama: string;
  nomor_sim: string | null;
  kategori_sim: string | null;
  kendaraan_id: string | null;
  status: string;
  pengalaman_tahun: number;
  nomor_hp: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportDriverCreateInput {
  workspace_id: string;
  nama: string;
  nomor_sim?: string | null;
  kategori_sim?: string | null;
  kendaraan_id?: string | null;
  status?: string;
  pengalaman_tahun?: number;
  nomor_hp?: string | null;
  catatan?: string | null;
}

export interface TransportDeliveryDbRow {
  id: string;
  room_id: string | null;
  transport_workspace_id: string | null;
  transport_listing_id: string | null;
  quotation_id: string | null;
  origin: string | null;
  destination: string | null;
  scheduled_date: string | null;
  fee: number | null;
  status: string;
  vehicle_type: string | null;
  driver_name: string | null;
  notes: string | null;
  transport_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportDeliveryCreateInput {
  room_id?: string | null;
  transport_workspace_id?: string | null;
  transport_listing_id?: string | null;
  quotation_id?: string | null;
  origin?: string | null;
  destination?: string | null;
  scheduled_date?: string | null;
  fee?: number | null;
  status?: string;
  vehicle_type?: string | null;
  driver_name?: string | null;
  notes?: string | null;
  transport_type?: string | null;
}

// ─── Transaction Rooms (canonical, for marketplace→transport integration) ────

export interface TransactionRoomDbRow {
  id: string;
  marketplace_transaction_id: string;
  buyer_workspace_id: string;
  seller_workspace_id: string;
  status: string;
  has_escrow: boolean;
  has_transport: boolean;
  total_amount: number;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionRoomCreateInput {
  marketplace_transaction_id: string;
  buyer_workspace_id: string;
  seller_workspace_id: string;
  status?: string;
  has_escrow?: boolean;
  has_transport?: boolean;
  total_amount?: number;
  notes?: string | null;
}

export interface TransactionRoomUpdateInput {
  status?: string;
  has_escrow?: boolean;
  has_transport?: boolean;
  total_amount?: number;
  notes?: string | null;
  completed_at?: string | null;
}

// ─── Marketplace Order (minimal shape needed by transport integration) ───────

export interface MarketplaceTransactionLite {
  id: string;
  listing_id: string;
  buyer_workspace_id: string;
  seller_workspace_id: string;
  agreed_price: number;
  status: string;
  notes: string | null;
}

export interface CreateTransportFromMarketplaceInput {
  /** Supabase UUID of marketplace_transactions row. */
  marketplace_transaction_id: string;
  /** Supabase UUID of the Transport workspace that will own the new transport_transactions row. */
  transport_workspace_id: string;
}

export interface CreateTransportFromMarketplaceResult {
  transport: TransportDeliveryDbRow;
  transaction_room: TransactionRoomDbRow;
  /** True when an existing transport_transactions row was returned instead of creating a new one. */
  reused: boolean;
}

// ─── Shipment Batches ─────────────────────────────────────────────────────────

export type TransportBatchStatus =
  | 'Draft' | 'Menunggu' | 'Siap Berangkat' | 'Dalam Perjalanan' | 'Selesai' | 'Dibatalkan';

export interface TransportShipmentBatchDbRow {
  id: string;
  workspace_id: string;
  kendaraan_id: string | null;
  driver_id: string | null;
  tanggal: string | null;
  jam: string | null;
  rute: string | null;
  kapasitas_kg: number | null;
  biaya_perjalanan: number;
  status: string;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportShipmentBatchCreateInput {
  workspace_id: string;
  kendaraan_id?: string | null;
  driver_id?: string | null;
  tanggal?: string | null;
  jam?: string | null;
  rute?: string | null;
  kapasitas_kg?: number | null;
  biaya_perjalanan?: number | null;
  status?: string;
  catatan?: string | null;
}

export type TransportShipmentBatchUpdateInput = Partial<TransportShipmentBatchCreateInput>;

export interface TransportShipmentBatchItemDbRow {
  id: string;
  workspace_id: string;
  batch_id: string;
  transaction_id: string;
  muatan_kg: number | null;
  urutan: number;
  created_at: string;
  updated_at: string;
}

export interface TransportShipmentBatchItemCreateInput {
  workspace_id: string;
  batch_id: string;
  transaction_id: string;
  muatan_kg?: number | null;
  urutan?: number;
}

export const TRANSPORT_BATCH_STATUS_CONFIG: Record<
  TransportBatchStatus,
  { label: string; icon: string; color: string; bg: string; border: string }
> = {
  Draft:          { label: 'Draft', icon: '📝', color: '#5d4037', bg: '#efebe9', border: '#bcaaa4' },
  Menunggu:       { label: 'Menunggu', icon: '⏳', color: '#5d4037', bg: '#efebe9', border: '#bcaaa4' },
  'Siap Berangkat': { label: 'Siap Berangkat', icon: '🚦', color: '#1e40af', bg: '#dbeafe', border: '#93c5fd' },
  'Dalam Perjalanan': { label: 'Dalam Perjalanan', icon: '🚚', color: '#0e7490', bg: '#cffafe', border: '#67e8f9' },
  Selesai:        { label: 'Selesai', icon: '🏁', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  Dibatalkan:     { label: 'Dibatalkan', icon: '❌', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};

// ─── Maintenance ──────────────────────────────────────────────────────────────

export type TransportMaintenanceType =
  | 'Service Berkala' | 'Oli' | 'Ban' | 'Rem' | 'Mesin'
  | 'Kelistrikan' | 'Spare Part' | 'Perbaikan' | 'Lainnya';

export type TransportMaintenanceStatus = 'Terjadwal' | 'Sedang' | 'Selesai' | 'Dibatalkan';

export interface TransportVehicleMaintenanceDbRow {
  id: string;
  workspace_id: string;
  kendaraan_id: string;
  jenis_service: string;
  tanggal: string;
  odometer_km: number | null;
  biaya: number;
  spare_part: string | null;
  vendor: string | null;
  status: string;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportVehicleMaintenanceCreateInput {
  workspace_id: string;
  kendaraan_id: string;
  jenis_service?: string;
  tanggal?: string;
  odometer_km?: number | null;
  biaya?: number | null;
  spare_part?: string | null;
  vendor?: string | null;
  status?: string;
  catatan?: string | null;
}

export type TransportVehicleMaintenanceUpdateInput = Partial<TransportVehicleMaintenanceCreateInput>;

// ─── Trip Costs ───────────────────────────────────────────────────────────────

export type TransportCostCategory =
  | 'BBM' | 'Tol' | 'Parkir' | 'Uang Jalan' | 'Makan'
  | 'Penginapan' | 'Spare Part' | 'Biaya Darurat' | 'Lainnya';

export interface TransportTripCostDbRow {
  id: string;
  workspace_id: string;
  batch_id: string | null;
  transaction_id: string | null;
  kendaraan_id: string | null;
  driver_id: string | null;
  tanggal: string;
  kategori: string;
  nominal: number;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportTripCostCreateInput {
  workspace_id: string;
  batch_id?: string | null;
  transaction_id?: string | null;
  kendaraan_id?: string | null;
  driver_id?: string | null;
  tanggal?: string;
  kategori?: string;
  nominal: number;
  catatan?: string | null;
}

export type TransportTripCostUpdateInput = Partial<Omit<TransportTripCostCreateInput, 'workspace_id' | 'nominal'>>;

// ─── Driver Payments ──────────────────────────────────────────────────────────

export type TransportDriverPaymentType =
  | 'Gaji' | 'Uang Jalan' | 'Insentif' | 'Overtime' | 'Bonus' | 'Potongan' | 'Lainnya';

export type TransportDriverPaymentStatus = 'Belum Dibayar' | 'Lunas' | 'Dibatalkan';

export interface TransportDriverPaymentDbRow {
  id: string;
  workspace_id: string;
  driver_id: string;
  transaction_id: string | null;
  batch_id: string | null;
  periode: string;
  tanggal: string;
  jenis: string;
  nominal: number;
  status: string;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportDriverPaymentCreateInput {
  workspace_id: string;
  driver_id: string;
  transaction_id?: string | null;
  batch_id?: string | null;
  periode: string;
  tanggal?: string;
  jenis?: string;
  nominal: number;
  status?: string;
  catatan?: string | null;
}

export type TransportDriverPaymentUpdateInput = Partial<Omit<TransportDriverPaymentCreateInput, 'workspace_id' | 'driver_id'>>;

// ─── Revenue ──────────────────────────────────────────────────────────────────

export type TransportRevenueType = 'Delivery Fee' | 'Insentif Penjemputan' | 'Lainnya';
export type TransportRevenueStatus = 'Pending' | 'Received' | 'Failed';

export interface TransportRevenueDbRow {
  id: string;
  workspace_id: string;
  transaction_id: string;
  jenis: string;
  nominal: number;
  tanggal: string;
  status: string;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportRevenueCreateInput {
  workspace_id: string;
  transaction_id: string;
  jenis?: string;
  nominal: number;
  tanggal?: string;
  status?: string;
  catatan?: string | null;
}

export type TransportRevenueUpdateInput = Partial<Omit<TransportRevenueCreateInput, 'workspace_id' | 'transaction_id'>>;

// ─── Financial Summary ────────────────────────────────────────────────────────

export interface TransportFinancialSummary {
  currency: 'IDR';
  period_start: string;
  period_end: string;
  revenue_total: number;
  expense_total: number;
  maintenance_total: number;
  driver_payment_total: number;
  trip_cost_total: number;
  net_profit: number;
  delivery_count: number;
  completed_delivery_count: number;
  revenue_by_type: Record<string, number>;
  cost_by_category: Record<string, number>;
  costs_per_delivery: Array<{
    transaction_id: string;
    origin: string;
    destination: string;
    revenue: number;
    cost_total: number;
    profit: number;
  }>;
  costs_per_vehicle: Array<{
    kendaraan_id: string;
    nomor_polisi: string;
    revenue: number;
    cost_total: number;
    profit: number;
  }>;
  costs_per_driver: Array<{
    driver_id: string;
    nama: string;
    payment_total: number;
    cost_total: number;
  }>;
}
