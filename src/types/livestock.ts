// ─── Livestock Types — FLOW-002M2 ─────────────────────────────────────────────
//
// TypeScript types that map directly to the Supabase DB schema defined in
// supabase/migrations/20260725000005_workspace_livestock.sql
//
// These are the DB-contract types.  The legacy app-layer shapes (LivestockRecord,
// BatchRecord, etc.) live in src/data/livestockData.ts and src/data/batchData.ts
// and are populated by the useLivestock() hook via the adapter functions in
// src/hooks/useLivestock.ts.

// ─── Enum value types ─────────────────────────────────────────────────────────

export type DbSex = 'Jantan' | 'Betina';
export type DbHealthStatus = 'Sehat' | 'Sakit' | 'Pemantauan';
export type DbLocationStatus = 'Di Kandang' | 'Luar Kandang' | 'Arsip';
export type DbArchiveReason = 'Mati' | 'Terjual' | 'Hibah';
export type DbBatchStatus = 'Aktif' | 'Selesai' | 'Diarsipkan';
export type DbPedigreeRole = 'Induk' | 'Pejantan' | 'Anak' | 'Kakek' | 'Nenek' | 'Buyut';
export type DbTransferType = 'Keluar Sementara' | 'Masuk Kembali' | 'Keluar Permanen';
export type DbOwnershipMethod =
  | 'Lahir'
  | 'Pembelian'
  | 'Penjualan'
  | 'Hibah'
  | 'Beli Kembali'
  | 'Transfer'
  | 'Registrasi Manual'
  | 'Impor'
  | 'Transfer Masuk'
  | 'Lainnya';

// ─── DB row shapes ────────────────────────────────────────────────────────────

export interface LivestockDbRow {
  id: string;
  workspace_id: string;
  name: string | null;
  species: string;
  breed: string | null;
  sex: DbSex | null;
  birth_date: string | null; // 'YYYY-MM-DD'
  birth_date_estimated: boolean;
  birth_weight_kg: number | null;
  current_weight_kg: number | null;
  health_status: DbHealthStatus;
  location_status: DbLocationStatus;
  location_detail: string | null;
  program: string | null;
  digital_identity_verified: boolean;
  digital_identity_issued_by: string | null;
  digital_identity_registered_date: string | null; // 'YYYY-MM-DD'
  archive_reason: DbArchiveReason | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LivestockExtendedMetadataDbRow {
  id: string;
  livestock_id: string;
  ear_tag: string | null;
  internal_code: string | null;
  notes: string | null;
  breed_category: string | null;
  cross_breed: string | null;
  color: string | null;
  horn: string | null;
  tail: string | null;
  special_marks: string | null;
  purchase_date: string | null; // 'YYYY-MM-DD'
  purchase_price: number | null;
  supplier: string | null;
  origin_farm: string | null;
  sibling_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface WeightEntryDbRow {
  id: string;
  livestock_id: string;
  recorded_by: string | null;
  weight_kg: number;
  date: string; // 'YYYY-MM-DD'
  notes: string | null;
  created_at: string;
}

export interface LivestockPhotoDbRow {
  id: string;
  livestock_id: string;
  uploaded_by: string | null;
  storage_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  is_primary: boolean;
  sort_order: number;
  taken_at: string | null; // 'YYYY-MM-DD'
  created_at: string;
}

export interface PedigreeLinkDbRow {
  id: string;
  livestock_id: string;
  relative_id: string;
  role: DbPedigreeRole;
  created_at: string;
}

export interface BatchDbRow {
  id: string;
  workspace_id: string;
  label: string;
  species: string | null;
  status: DbBatchStatus;
  start_date: string | null; // 'YYYY-MM-DD'
  finished_date: string | null; // 'YYYY-MM-DD'
  target_weight_kg: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BatchMemberDbRow {
  id: string;
  batch_id: string;
  livestock_id: string;
  joined_date: string; // 'YYYY-MM-DD'
  removed_date: string | null; // 'YYYY-MM-DD'
  removal_reason: string | null;
  created_at: string;
}

export interface LivestockTransferDbRow {
  id: string;
  livestock_id: string;
  workspace_id: string;
  transfer_type: DbTransferType;
  from_location: string | null;
  to_location: string | null;
  destination: string | null;
  reason: string | null;
  archive_reason: DbArchiveReason | null;
  notes: string | null;
  transferred_by: string | null;
  transfer_date: string; // 'YYYY-MM-DD'
  return_date: string | null; // 'YYYY-MM-DD'
  created_at: string;
}

// ─── Create / Patch inputs ────────────────────────────────────────────────────

export interface LivestockCreateInput {
  name: string | null;
  species: string;
  breed: string | null;
  sex: DbSex | null;
  birth_date: string | null; // ISO 'YYYY-MM-DD'
  birth_date_estimated: boolean;
  birth_weight_kg: number | null;
  current_weight_kg: number | null;
  health_status?: DbHealthStatus;
  location_detail: string | null;
  program: string | null;
  digital_identity_issued_by: string | null;
}

export interface LivestockExtendedMetadataCreateInput {
  ear_tag?: string | null;
  internal_code?: string | null;
  notes?: string | null;
  breed_category?: string | null;
  cross_breed?: string | null;
  color?: string | null;
  horn?: string | null;
  tail?: string | null;
  special_marks?: string | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  supplier?: string | null;
  origin_farm?: string | null;
  sibling_count?: number | null;
}

export interface LivestockPatchInput {
  name?: string | null;
  breed?: string | null;
  sex?: DbSex | null;
  birth_date?: string | null;
  birth_date_estimated?: boolean;
  birth_weight_kg?: number | null;
  current_weight_kg?: number | null;
  health_status?: DbHealthStatus;
  location_status?: DbLocationStatus;
  location_detail?: string | null;
  program?: string | null;
  digital_identity_verified?: boolean;
  digital_identity_issued_by?: string | null;
  archive_reason?: DbArchiveReason | null;
  archived_at?: string | null;
}

export interface WeightEntryCreateInput {
  weight_kg: number;
  date: string; // 'YYYY-MM-DD'
  notes: string | null;
}

export interface BatchCreateInput {
  label: string;
  species: string | null;
  start_date: string | null;
  target_weight_kg: number | null;
  notes: string | null;
}

export interface BatchPatchInput {
  label?: string;
  status?: DbBatchStatus;
  finished_date?: string | null;
  notes?: string | null;
}

export interface LivestockTransferCreateInput {
  livestock_id: string;
  workspace_id: string;
  transfer_type: DbTransferType;
  from_location: string | null;
  to_location: string | null;
  destination: string | null;
  reason: string | null;
  archive_reason: DbArchiveReason | null;
  notes: string | null;
  transfer_date: string; // 'YYYY-MM-DD'
  return_date: string | null;
}

// ─── batch_history ────────────────────────────────────────────────────────────

export interface BatchHistoryDbRow {
  id: string;
  batch_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  performed_by: string | null;
  event_at: string; // ISO timestamptz
}

export interface BatchHistoryCreateInput {
  batch_id: string;
  event_type: string;
  event_data?: Record<string, unknown> | null;
  performed_by?: string | null;
}

// ─── batch_operations ─────────────────────────────────────────────────────────

export interface BatchOperationDbRow {
  id: string;
  batch_id: string;
  operation_type: string;
  status: string | null;
  target_livestock_ids: string[] | null;
  operation_data: Record<string, unknown> | null;
  performed_by: string | null;
  performed_at: string | null; // ISO timestamptz
  created_at: string;
}

export interface BatchOperationCreateInput {
  batch_id: string;
  operation_type: string;
  status?: string | null;
  target_livestock_ids?: string[] | null;
  operation_data?: Record<string, unknown> | null;
  performed_by?: string | null;
  performed_at?: string | null;
}
