// ─── Veterinary Types — VET-TYPE-001 ──────────────────────────────────────────
//
// Supabase adapter types for the Veterinary workspace.
// Tables covered:
//   layanan_dokter_hewan  → Dokter Hewan service catalog
//   layanan_klinik_hewan  → Klinik Hewan service catalog
//   service_quotations    → Marketplace quotations for vet services
//   transaction_rooms     → Canonical bridge (marketplace ↔ vet)
//   transport_transactions → Reused for marketplace→vet flow (Gap #1 pattern)
//
// Rules:
//   - These types are ONLY for the repository layer.
//   - Pages and components use higher-level abstractions.
//   - Never import these directly from UI code that doesn't need them.

// ─── layanan_dokter_hewan ──────────────────────────────────────────────────────

export interface VetServiceDbRow {
  id: string;
  workspace_id: string;
  nama: string;
  nama_klinik: string | null;
  kategori: string | null;
  sub_kategori: string | null;
  sipv_number: string | null;
  spesialisasi: string[];
  hewan_ditangani: string[];
  mode_pelayanan: string[];
  lokasi: string | null;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type VetServiceCreateInput = Omit<VetServiceDbRow, 'id' | 'created_at' | 'updated_at'>;
export type VetServicePatchInput = Partial<
  Pick<
    VetServiceDbRow,
    | 'nama'
    | 'nama_klinik'
    | 'kategori'
    | 'sub_kategori'
    | 'sipv_number'
    | 'spesialisasi'
    | 'hewan_ditangani'
    | 'mode_pelayanan'
    | 'lokasi'
    | 'status'
    | 'description'
  >
>;

// ─── layanan_klinik_hewan ──────────────────────────────────────────────────────

export interface ClinicServiceDbRow {
  id: string;
  workspace_id: string;
  nama_klinik: string;
  nomor_izin: string | null;
  fasilitas: string[];
  hewan_ditangani: string[];
  jam_operasional: Record<string, unknown> | null;
  lokasi: string | null;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type ClinicServiceCreateInput = Omit<ClinicServiceDbRow, 'id' | 'created_at' | 'updated_at'>;
export type ClinicServicePatchInput = Partial<
  Pick<
    ClinicServiceDbRow,
    | 'nama_klinik'
    | 'nomor_izin'
    | 'fasilitas'
    | 'hewan_ditangani'
    | 'jam_operasional'
    | 'lokasi'
    | 'status'
    | 'description'
  >
>;

// ─── service_quotations ────────────────────────────────────────────────────────

export interface VetServiceQuotationDbRow {
  id: string;
  room_id: string;
  provider_workspace_id: string;
  service_type: string | null;
  service_detail: Record<string, unknown> | null;
  price: number;
  status: string;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type VetServiceQuotationCreateInput = Omit<VetServiceQuotationDbRow, 'id' | 'created_at' | 'updated_at'>;
export type VetServiceQuotationPatchInput = Partial<
  Pick<
    VetServiceQuotationDbRow,
    | 'service_detail'
    | 'price'
    | 'status'
    | 'valid_until'
    | 'notes'
  >
>;

// ─── Marketplace → Veterinary (Gap #1 pattern) ────────────────────────────────

export interface CreateVetServiceFromMarketplaceInput {
  marketplace_transaction_id: string;
  vet_workspace_id: string;
  service_type: 'DokterHewan' | 'KlinikHewan';
  service_detail?: Record<string, unknown> | null;
  price: number;
  valid_until?: string | null;
  notes?: string | null;
}

export interface CreateVetServiceFromMarketplaceResult {
  quotation: VetServiceQuotationDbRow;
  transaction_room: TransactionRoomDbRow;
  reused: boolean;
}

// ─── transaction_rooms (canonical bridge) ──────────────────────────────────────

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

// ─── Activity Log ──────────────────────────────────────────────────────────────

export interface VetActivityLogDbRow {
  id: string;
  workspace_id: string;
  domain: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
}
