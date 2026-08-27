// ─── Transport Types ────────────────────────────────────────────────────────────
//
// Supabase row types for transport tables:
//   layanan_transport      → service listings / fleet registry
//   transport_vehicles     → fleet vehicles
//   transport_drivers      → drivers
//   transport_schedules    → scheduled transport requests
//   transport_transactions → delivery / transport order records

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
