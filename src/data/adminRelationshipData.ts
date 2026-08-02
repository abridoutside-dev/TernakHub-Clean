// ─── Admin Workspace Relationship Data — REL-001 ──────────────────────────────
// Platform-admin observation layer for Workspace Relationships.
// Read-only dummy data. No invitation workflow, no permissions, no business logic.
//
// Each Workspace remains fully independent. Relationships are metadata overlays
// that describe collaboration intent between two Workspaces.

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkspaceType = 'Farm' | 'Veterinary' | 'FeedStore' | 'Transport';

export type RelationshipType =
  | 'Partner'
  | 'Supplier'
  | 'Customer'
  | 'ServiceProvider'
  | 'VeterinaryPartner'
  | 'FeedSupplier'
  | 'TransportPartner';

export type RelationshipStatus =
  | 'Active'
  | 'Pending'
  | 'Suspended'
  | 'Archived'
  | 'Rejected';

export interface WorkspaceRef {
  workspace_id: string;
  workspace_name: string;
  workspace_type: WorkspaceType;
  owner_name: string;
  location: string;
  verified: boolean;
}

export interface TimelineEvent {
  timestamp: string;
  actor: string;
  action: string;
  note?: string;
}

export interface StatusHistoryEntry {
  from_status: RelationshipStatus | null;
  to_status: RelationshipStatus;
  changed_at: string;
  changed_by: string;
  reason?: string;
}

export interface RelationshipRecord {
  relationship_id: string;          // REL-YYYYMMDD-XXXX
  workspace: WorkspaceRef;           // initiating workspace
  partner: WorkspaceRef;             // target workspace
  relationship_type: RelationshipType;
  status: RelationshipStatus;
  initiated_by_workspace_id: string;
  created_at: string;
  updated_at: string;
  effective_date?: string;           // when the relationship became active
  expiry_date?: string;              // planned end date, null = indefinite
  notes?: string;
  timeline: TimelineEvent[];
  status_history: StatusHistoryEntry[];
}

// ─── Display Config ───────────────────────────────────────────────────────────

export const WORKSPACE_TYPE_CONFIG: Record<WorkspaceType, {
  icon: string; label: string; color: string; bg: string;
}> = {
  Farm:       { icon: '🐄', label: 'Peternakan',   color: '#15803d', bg: '#f0fdf4' },
  Veterinary: { icon: '🩺', label: 'Klinik Hewan', color: '#7c3aed', bg: '#f5f3ff' },
  FeedStore:  { icon: '🌾', label: 'Toko Pakan',   color: '#b45309', bg: '#fffbeb' },
  Transport:  { icon: '🚚', label: 'Transportasi',  color: '#0369a1', bg: '#f0f9ff' },
};

export const RELATIONSHIP_TYPE_CONFIG: Record<RelationshipType, {
  label: string; color: string; bg: string; icon: string;
}> = {
  Partner:           { label: 'Mitra',               icon: '🤝', color: '#0369a1', bg: '#f0f9ff' },
  Supplier:          { label: 'Pemasok',              icon: '📦', color: '#b45309', bg: '#fffbeb' },
  Customer:          { label: 'Pelanggan',             icon: '👤', color: '#15803d', bg: '#f0fdf4' },
  ServiceProvider:   { label: 'Penyedia Layanan',     icon: '🔧', color: '#64748b', bg: '#f8fafc' },
  VeterinaryPartner: { label: 'Mitra Veteriner',      icon: '🩺', color: '#7c3aed', bg: '#f5f3ff' },
  FeedSupplier:      { label: 'Pemasok Pakan',        icon: '🌾', color: '#b45309', bg: '#fffbeb' },
  TransportPartner:  { label: 'Mitra Transportasi',   icon: '🚚', color: '#0891b2', bg: '#ecfeff' },
};

export const RELATIONSHIP_STATUS_CONFIG: Record<RelationshipStatus, {
  label: string; color: string; bg: string; dot: string;
}> = {
  Active:    { label: 'Aktif',       color: '#15803d', bg: '#f0fdf4', dot: '#22c55e' },
  Pending:   { label: 'Menunggu',    color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
  Suspended: { label: 'Ditangguhkan',color: '#b91c1c', bg: '#fef2f2', dot: '#f87171' },
  Archived:  { label: 'Diarsipkan', color: '#64748b', bg: '#f8fafc', dot: '#94a3b8' },
  Rejected:  { label: 'Ditolak',    color: '#9f1239', bg: '#fff1f2', dot: '#fb7185' },
};

// ─── Workspace Stubs ──────────────────────────────────────────────────────────

const WS: Record<string, WorkspaceRef> = {
  w1: {
    workspace_id: 'w1', workspace_name: 'Berkah Farm Garut',
    workspace_type: 'Farm', owner_name: 'Ahmad Fauzi',
    location: 'Garut, Jawa Barat', verified: true,
  },
  w2: {
    workspace_id: 'w2', workspace_name: 'Maju Jaya Farm',
    workspace_type: 'Farm', owner_name: 'Budi Santoso',
    location: 'Malang, Jawa Timur', verified: true,
  },
  w3: {
    workspace_id: 'w3', workspace_name: 'Klinik Hewan Sejahtera',
    workspace_type: 'Veterinary', owner_name: 'drh. Rini Wulandari',
    location: 'Bandung, Jawa Barat', verified: true,
  },
  w4: {
    workspace_id: 'w4', workspace_name: 'Depot Pakan Makmur',
    workspace_type: 'FeedStore', owner_name: 'Hadi Purnomo',
    location: 'Surabaya, Jawa Timur', verified: true,
  },
  w5: {
    workspace_id: 'w5', workspace_name: 'Trans Ternak Ekspres',
    workspace_type: 'Transport', owner_name: 'Teguh Prasetyo',
    location: 'Bandung, Jawa Barat', verified: false,
  },
  w6: {
    workspace_id: 'w6', workspace_name: 'Koperasi Sapi Jateng',
    workspace_type: 'Farm', owner_name: 'Nurul Hidayah',
    location: 'Semarang, Jawa Tengah', verified: true,
  },
  w7: {
    workspace_id: 'w7', workspace_name: 'Toko Pakan Subur',
    workspace_type: 'FeedStore', owner_name: 'Wahyu Setiawan',
    location: 'Yogyakarta, DIY', verified: true,
  },
  w8: {
    workspace_id: 'w8', workspace_name: 'Klinik Hewan Bersama',
    workspace_type: 'Veterinary', owner_name: 'drh. Agus Kurniawan',
    location: 'Surabaya, Jawa Timur', verified: true,
  },
  w9: {
    workspace_id: 'w9', workspace_name: 'Logistik Ternak Nusantara',
    workspace_type: 'Transport', owner_name: 'Eko Sulistyo',
    location: 'Jakarta, DKI Jakarta', verified: true,
  },
  w10: {
    workspace_id: 'w10', workspace_name: 'Agro Farm Bali',
    workspace_type: 'Farm', owner_name: 'Lestari Agung',
    location: 'Denpasar, Bali', verified: false,
  },
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const ADMIN_RELATIONSHIP_LIST: RelationshipRecord[] = [
  {
    relationship_id: 'REL-20260601-0001',
    workspace: WS['w1'],
    partner: WS['w3'],
    relationship_type: 'VeterinaryPartner',
    status: 'Active',
    initiated_by_workspace_id: 'w1',
    created_at: '2026-06-01T08:00:00.000Z',
    updated_at: '2026-06-05T10:00:00.000Z',
    effective_date: '2026-06-05',
    notes: 'Kerjasama pemeriksaan rutin ternak setiap bulan.',
    timeline: [
      { timestamp: '2026-06-01T08:00:00.000Z', actor: 'Berkah Farm Garut', action: 'Mengajukan kemitraan veteriner' },
      { timestamp: '2026-06-03T14:00:00.000Z', actor: 'Klinik Hewan Sejahtera', action: 'Menerima pengajuan kemitraan' },
      { timestamp: '2026-06-05T10:00:00.000Z', actor: 'Platform', action: 'Hubungan diaktifkan', note: 'Efektif per 5 Juni 2026' },
    ],
    status_history: [
      { from_status: null,      to_status: 'Pending', changed_at: '2026-06-01T08:00:00.000Z', changed_by: 'Berkah Farm Garut' },
      { from_status: 'Pending', to_status: 'Active',  changed_at: '2026-06-05T10:00:00.000Z', changed_by: 'Klinik Hewan Sejahtera' },
    ],
  },
  {
    relationship_id: 'REL-20260601-0002',
    workspace: WS['w1'],
    partner: WS['w4'],
    relationship_type: 'FeedSupplier',
    status: 'Active',
    initiated_by_workspace_id: 'w1',
    created_at: '2026-06-01T09:00:00.000Z',
    updated_at: '2026-06-07T11:00:00.000Z',
    effective_date: '2026-06-07',
    notes: 'Pembelian pakan rutin bulanan: konsentrat dan rumput kering.',
    timeline: [
      { timestamp: '2026-06-01T09:00:00.000Z', actor: 'Berkah Farm Garut', action: 'Mendaftarkan Depot Pakan Makmur sebagai pemasok pakan' },
      { timestamp: '2026-06-04T08:00:00.000Z', actor: 'Depot Pakan Makmur', action: 'Menyetujui hubungan pemasok' },
      { timestamp: '2026-06-07T11:00:00.000Z', actor: 'Platform', action: 'Hubungan pemasok diaktifkan' },
    ],
    status_history: [
      { from_status: null,      to_status: 'Pending', changed_at: '2026-06-01T09:00:00.000Z', changed_by: 'Berkah Farm Garut' },
      { from_status: 'Pending', to_status: 'Active',  changed_at: '2026-06-07T11:00:00.000Z', changed_by: 'Depot Pakan Makmur' },
    ],
  },
  {
    relationship_id: 'REL-20260610-0003',
    workspace: WS['w1'],
    partner: WS['w5'],
    relationship_type: 'TransportPartner',
    status: 'Active',
    initiated_by_workspace_id: 'w1',
    created_at: '2026-06-10T10:00:00.000Z',
    updated_at: '2026-06-14T09:00:00.000Z',
    effective_date: '2026-06-14',
    notes: 'Jasa pengangkutan ternak untuk penjualan jarak jauh.',
    timeline: [
      { timestamp: '2026-06-10T10:00:00.000Z', actor: 'Berkah Farm Garut', action: 'Mengajukan mitra transportasi' },
      { timestamp: '2026-06-12T14:00:00.000Z', actor: 'Trans Ternak Ekspres', action: 'Setuju sebagai mitra transport' },
      { timestamp: '2026-06-14T09:00:00.000Z', actor: 'Platform', action: 'Mitra transportasi diaktifkan' },
    ],
    status_history: [
      { from_status: null,      to_status: 'Pending', changed_at: '2026-06-10T10:00:00.000Z', changed_by: 'Berkah Farm Garut' },
      { from_status: 'Pending', to_status: 'Active',  changed_at: '2026-06-14T09:00:00.000Z', changed_by: 'Trans Ternak Ekspres' },
    ],
  },
  {
    relationship_id: 'REL-20260615-0004',
    workspace: WS['w2'],
    partner: WS['w7'],
    relationship_type: 'FeedSupplier',
    status: 'Active',
    initiated_by_workspace_id: 'w2',
    created_at: '2026-06-15T07:00:00.000Z',
    updated_at: '2026-06-20T08:00:00.000Z',
    effective_date: '2026-06-20',
    notes: 'Pembelian pakan hijauan dan limbah industri rutin.',
    timeline: [
      { timestamp: '2026-06-15T07:00:00.000Z', actor: 'Maju Jaya Farm', action: 'Mendaftarkan Toko Pakan Subur sebagai pemasok' },
      { timestamp: '2026-06-18T10:00:00.000Z', actor: 'Toko Pakan Subur', action: 'Menyetujui menjadi pemasok' },
      { timestamp: '2026-06-20T08:00:00.000Z', actor: 'Platform', action: 'Hubungan pemasok aktif' },
    ],
    status_history: [
      { from_status: null,      to_status: 'Pending', changed_at: '2026-06-15T07:00:00.000Z', changed_by: 'Maju Jaya Farm' },
      { from_status: 'Pending', to_status: 'Active',  changed_at: '2026-06-20T08:00:00.000Z', changed_by: 'Toko Pakan Subur' },
    ],
  },
  {
    relationship_id: 'REL-20260620-0005',
    workspace: WS['w2'],
    partner: WS['w8'],
    relationship_type: 'VeterinaryPartner',
    status: 'Pending',
    initiated_by_workspace_id: 'w2',
    created_at: '2026-07-10T09:00:00.000Z',
    updated_at: '2026-07-10T09:10:00.000Z',
    notes: 'Menunggu konfirmasi dari klinik hewan.',
    timeline: [
      { timestamp: '2026-07-10T09:00:00.000Z', actor: 'Maju Jaya Farm', action: 'Mengajukan kemitraan dengan Klinik Hewan Bersama' },
      { timestamp: '2026-07-10T09:10:00.000Z', actor: 'System', action: 'Notifikasi terkirim ke Klinik Hewan Bersama' },
    ],
    status_history: [
      { from_status: null, to_status: 'Pending', changed_at: '2026-07-10T09:00:00.000Z', changed_by: 'Maju Jaya Farm' },
    ],
  },
  {
    relationship_id: 'REL-20260625-0006',
    workspace: WS['w6'],
    partner: WS['w9'],
    relationship_type: 'TransportPartner',
    status: 'Active',
    initiated_by_workspace_id: 'w6',
    created_at: '2026-06-25T10:00:00.000Z',
    updated_at: '2026-07-01T09:00:00.000Z',
    effective_date: '2026-07-01',
    notes: 'Pengiriman sapi ke Jabodetabek dan sekitarnya.',
    timeline: [
      { timestamp: '2026-06-25T10:00:00.000Z', actor: 'Koperasi Sapi Jateng', action: 'Mengajukan mitra logistik untuk rute Jateng–Jakarta' },
      { timestamp: '2026-06-28T08:00:00.000Z', actor: 'Logistik Ternak Nusantara', action: 'Menyetujui kemitraan logistik' },
      { timestamp: '2026-07-01T09:00:00.000Z', actor: 'Platform', action: 'Mitra logistik aktif per 1 Juli 2026' },
    ],
    status_history: [
      { from_status: null,      to_status: 'Pending', changed_at: '2026-06-25T10:00:00.000Z', changed_by: 'Koperasi Sapi Jateng' },
      { from_status: 'Pending', to_status: 'Active',  changed_at: '2026-07-01T09:00:00.000Z', changed_by: 'Logistik Ternak Nusantara' },
    ],
  },
  {
    relationship_id: 'REL-20260701-0007',
    workspace: WS['w3'],
    partner: WS['w1'],
    relationship_type: 'Customer',
    status: 'Active',
    initiated_by_workspace_id: 'w3',
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-03T08:00:00.000Z',
    effective_date: '2026-07-03',
    notes: 'Berkah Farm Garut terdaftar sebagai pelanggan layanan kesehatan hewan rutin.',
    timeline: [
      { timestamp: '2026-07-01T10:00:00.000Z', actor: 'Klinik Hewan Sejahtera', action: 'Mendaftarkan Berkah Farm sebagai pelanggan' },
      { timestamp: '2026-07-03T08:00:00.000Z', actor: 'Platform', action: 'Hubungan pelanggan diaktifkan' },
    ],
    status_history: [
      { from_status: null, to_status: 'Active', changed_at: '2026-07-03T08:00:00.000Z', changed_by: 'Platform' },
    ],
  },
  {
    relationship_id: 'REL-20260705-0008',
    workspace: WS['w4'],
    partner: WS['w6'],
    relationship_type: 'Customer',
    status: 'Active',
    initiated_by_workspace_id: 'w4',
    created_at: '2026-07-05T08:00:00.000Z',
    updated_at: '2026-07-08T09:00:00.000Z',
    effective_date: '2026-07-08',
    notes: 'Koperasi Sapi Jateng sebagai pelanggan grosir pakan ternak.',
    timeline: [
      { timestamp: '2026-07-05T08:00:00.000Z', actor: 'Depot Pakan Makmur', action: 'Mendaftarkan koperasi sebagai pelanggan grosir' },
      { timestamp: '2026-07-06T13:00:00.000Z', actor: 'Koperasi Sapi Jateng', action: 'Konfirmasi sebagai pelanggan grosir pakan' },
      { timestamp: '2026-07-08T09:00:00.000Z', actor: 'Platform', action: 'Hubungan pelanggan grosir aktif' },
    ],
    status_history: [
      { from_status: null,      to_status: 'Pending', changed_at: '2026-07-05T08:00:00.000Z', changed_by: 'Depot Pakan Makmur' },
      { from_status: 'Pending', to_status: 'Active',  changed_at: '2026-07-08T09:00:00.000Z', changed_by: 'Koperasi Sapi Jateng' },
    ],
  },
  {
    relationship_id: 'REL-20260708-0009',
    workspace: WS['w10'],
    partner: WS['w3'],
    relationship_type: 'VeterinaryPartner',
    status: 'Pending',
    initiated_by_workspace_id: 'w10',
    created_at: '2026-07-15T11:00:00.000Z',
    updated_at: '2026-07-15T11:05:00.000Z',
    notes: 'Menunggu konfirmasi dari klinik hewan untuk layanan di Bali.',
    timeline: [
      { timestamp: '2026-07-15T11:00:00.000Z', actor: 'Agro Farm Bali', action: 'Mengajukan mitra veteriner untuk layanan di Bali' },
      { timestamp: '2026-07-15T11:05:00.000Z', actor: 'System', action: 'Notifikasi dikirim — menunggu respons klinik' },
    ],
    status_history: [
      { from_status: null, to_status: 'Pending', changed_at: '2026-07-15T11:00:00.000Z', changed_by: 'Agro Farm Bali' },
    ],
  },
  {
    relationship_id: 'REL-20260603-0010',
    workspace: WS['w5'],
    partner: WS['w6'],
    relationship_type: 'TransportPartner',
    status: 'Suspended',
    initiated_by_workspace_id: 'w5',
    created_at: '2026-06-03T08:00:00.000Z',
    updated_at: '2026-07-05T14:00:00.000Z',
    effective_date: '2026-06-10',
    notes: 'Ditangguhkan sementara karena insiden kendaraan (19 Jun). Sedang investigasi.',
    timeline: [
      { timestamp: '2026-06-03T08:00:00.000Z', actor: 'Trans Ternak Ekspres', action: 'Mengajukan kemitraan transport ke Jateng' },
      { timestamp: '2026-06-08T09:00:00.000Z', actor: 'Koperasi Sapi Jateng', action: 'Menyetujui kemitraan' },
      { timestamp: '2026-06-10T08:00:00.000Z', actor: 'Platform', action: 'Mitra transport aktif' },
      { timestamp: '2026-07-05T14:00:00.000Z', actor: 'Platform', action: 'Ditangguhkan sementara', note: 'Insiden kendaraan — masih dalam investigasi' },
    ],
    status_history: [
      { from_status: null,      to_status: 'Pending',   changed_at: '2026-06-03T08:00:00.000Z', changed_by: 'Trans Ternak Ekspres' },
      { from_status: 'Pending', to_status: 'Active',    changed_at: '2026-06-10T08:00:00.000Z', changed_by: 'Koperasi Sapi Jateng' },
      { from_status: 'Active',  to_status: 'Suspended', changed_at: '2026-07-05T14:00:00.000Z', changed_by: 'Platform', reason: 'Insiden kendaraan — investigasi' },
    ],
  },
  {
    relationship_id: 'REL-20260510-0011',
    workspace: WS['w2'],
    partner: WS['w9'],
    relationship_type: 'TransportPartner',
    status: 'Archived',
    initiated_by_workspace_id: 'w2',
    created_at: '2026-05-10T09:00:00.000Z',
    updated_at: '2026-06-30T16:00:00.000Z',
    effective_date: '2026-05-15',
    expiry_date: '2026-06-30',
    notes: 'Kontrak berakhir 30 Juni 2026. Tidak diperpanjang.',
    timeline: [
      { timestamp: '2026-05-10T09:00:00.000Z', actor: 'Maju Jaya Farm', action: 'Mengajukan kemitraan logistik untuk Q2 2026' },
      { timestamp: '2026-05-13T08:00:00.000Z', actor: 'Logistik Ternak Nusantara', action: 'Menyetujui kontrak 3 bulan' },
      { timestamp: '2026-05-15T08:00:00.000Z', actor: 'Platform', action: 'Kemitraan logistik aktif — kontrak hingga 30 Juni' },
      { timestamp: '2026-06-30T16:00:00.000Z', actor: 'System', action: 'Kontrak berakhir — diarsipkan otomatis' },
    ],
    status_history: [
      { from_status: null,      to_status: 'Pending',  changed_at: '2026-05-10T09:00:00.000Z', changed_by: 'Maju Jaya Farm' },
      { from_status: 'Pending', to_status: 'Active',   changed_at: '2026-05-15T08:00:00.000Z', changed_by: 'Logistik Ternak Nusantara' },
      { from_status: 'Active',  to_status: 'Archived', changed_at: '2026-06-30T16:00:00.000Z', changed_by: 'System', reason: 'Kontrak berakhir — tidak diperpanjang' },
    ],
  },
  {
    relationship_id: 'REL-20260712-0012',
    workspace: WS['w10'],
    partner: WS['w4'],
    relationship_type: 'FeedSupplier',
    status: 'Rejected',
    initiated_by_workspace_id: 'w10',
    created_at: '2026-07-12T10:00:00.000Z',
    updated_at: '2026-07-14T09:00:00.000Z',
    notes: 'Ditolak karena kapasitas pengiriman ke Bali tidak tersedia.',
    timeline: [
      { timestamp: '2026-07-12T10:00:00.000Z', actor: 'Agro Farm Bali', action: 'Mengajukan hubungan pemasok pakan dari Surabaya ke Bali' },
      { timestamp: '2026-07-14T09:00:00.000Z', actor: 'Depot Pakan Makmur', action: 'Menolak pengajuan', note: 'Ongkos kirim ke Bali terlalu tinggi, tidak ekonomis' },
    ],
    status_history: [
      { from_status: null,      to_status: 'Pending',  changed_at: '2026-07-12T10:00:00.000Z', changed_by: 'Agro Farm Bali' },
      { from_status: 'Pending', to_status: 'Rejected', changed_at: '2026-07-14T09:00:00.000Z', changed_by: 'Depot Pakan Makmur', reason: 'Kapasitas pengiriman ke Bali tidak tersedia' },
    ],
  },
  {
    relationship_id: 'REL-20260701-0013',
    workspace: WS['w8'],
    partner: WS['w6'],
    relationship_type: 'ServiceProvider',
    status: 'Active',
    initiated_by_workspace_id: 'w8',
    created_at: '2026-07-01T08:00:00.000Z',
    updated_at: '2026-07-04T10:00:00.000Z',
    effective_date: '2026-07-04',
    notes: 'Layanan pemeriksaan kesehatan hewan berkala untuk anggota koperasi.',
    timeline: [
      { timestamp: '2026-07-01T08:00:00.000Z', actor: 'Klinik Hewan Bersama', action: 'Menawarkan layanan ke Koperasi Sapi Jateng' },
      { timestamp: '2026-07-03T09:00:00.000Z', actor: 'Koperasi Sapi Jateng', action: 'Menerima tawaran layanan veteriner koperasi' },
      { timestamp: '2026-07-04T10:00:00.000Z', actor: 'Platform', action: 'Hubungan penyedia layanan aktif' },
    ],
    status_history: [
      { from_status: null,      to_status: 'Pending', changed_at: '2026-07-01T08:00:00.000Z', changed_by: 'Klinik Hewan Bersama' },
      { from_status: 'Pending', to_status: 'Active',  changed_at: '2026-07-04T10:00:00.000Z', changed_by: 'Koperasi Sapi Jateng' },
    ],
  },
  {
    relationship_id: 'REL-20260715-0014',
    workspace: WS['w1'],
    partner: WS['w6'],
    relationship_type: 'Partner',
    status: 'Pending',
    initiated_by_workspace_id: 'w1',
    created_at: '2026-07-17T10:00:00.000Z',
    updated_at: '2026-07-17T10:05:00.000Z',
    notes: 'Kerjasama bersama untuk program pembibitan sapi Jawa Barat–Jawa Tengah.',
    timeline: [
      { timestamp: '2026-07-17T10:00:00.000Z', actor: 'Berkah Farm Garut', action: 'Mengajukan kemitraan program pembibitan lintas provinsi' },
      { timestamp: '2026-07-17T10:05:00.000Z', actor: 'System', action: 'Notifikasi pengajuan kemitraan dikirim ke Koperasi Sapi Jateng' },
    ],
    status_history: [
      { from_status: null, to_status: 'Pending', changed_at: '2026-07-17T10:00:00.000Z', changed_by: 'Berkah Farm Garut' },
    ],
  },
  {
    relationship_id: 'REL-20260716-0015',
    workspace: WS['w9'],
    partner: WS['w1'],
    relationship_type: 'TransportPartner',
    status: 'Active',
    initiated_by_workspace_id: 'w9',
    created_at: '2026-07-16T08:00:00.000Z',
    updated_at: '2026-07-17T09:00:00.000Z',
    effective_date: '2026-07-17',
    notes: 'Rute rutin Bandung–Jakarta dan Garut–Jakarta.',
    timeline: [
      { timestamp: '2026-07-16T08:00:00.000Z', actor: 'Logistik Ternak Nusantara', action: 'Menawarkan layanan rute Jawa Barat–Jakarta' },
      { timestamp: '2026-07-17T08:00:00.000Z', actor: 'Berkah Farm Garut', action: 'Menerima tawaran layanan logistik' },
      { timestamp: '2026-07-17T09:00:00.000Z', actor: 'Platform', action: 'Mitra logistik rute Jabar–Jakarta aktif' },
    ],
    status_history: [
      { from_status: null,      to_status: 'Pending', changed_at: '2026-07-16T08:00:00.000Z', changed_by: 'Logistik Ternak Nusantara' },
      { from_status: 'Pending', to_status: 'Active',  changed_at: '2026-07-17T09:00:00.000Z', changed_by: 'Berkah Farm Garut' },
    ],
  },
];

// ─── Platform Stats ───────────────────────────────────────────────────────────

function computeStats() {
  const total     = ADMIN_RELATIONSHIP_LIST.length;
  const active    = ADMIN_RELATIONSHIP_LIST.filter((r) => r.status === 'Active').length;
  const pending   = ADMIN_RELATIONSHIP_LIST.filter((r) => r.status === 'Pending').length;
  const suspended = ADMIN_RELATIONSHIP_LIST.filter((r) => r.status === 'Suspended').length;
  const archived  = ADMIN_RELATIONSHIP_LIST.filter((r) => r.status === 'Archived').length;
  const rejected  = ADMIN_RELATIONSHIP_LIST.filter((r) => r.status === 'Rejected').length;
  return { total, active, pending, suspended, archived, rejected };
}

export const RELATIONSHIP_PLATFORM_STATS = computeStats();

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface RelationshipFilter {
  search: string;
  workspaceType: string;
  relationshipType: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export function filterRelationships(
  list: RelationshipRecord[],
  f: RelationshipFilter,
): RelationshipRecord[] {
  let result = list;

  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    result = result.filter(
      (r) =>
        r.workspace.workspace_name.toLowerCase().includes(q) ||
        r.partner.workspace_name.toLowerCase().includes(q) ||
        r.workspace.workspace_id.toLowerCase().includes(q) ||
        r.partner.workspace_id.toLowerCase().includes(q) ||
        RELATIONSHIP_TYPE_CONFIG[r.relationship_type].label.toLowerCase().includes(q),
    );
  }

  if (f.workspaceType && f.workspaceType !== 'all') {
    result = result.filter(
      (r) =>
        r.workspace.workspace_type === f.workspaceType ||
        r.partner.workspace_type === f.workspaceType,
    );
  }

  if (f.relationshipType && f.relationshipType !== 'all') {
    result = result.filter((r) => r.relationship_type === f.relationshipType);
  }

  if (f.status && f.status !== 'all') {
    result = result.filter((r) => r.status === f.status);
  }

  if (f.dateFrom) {
    result = result.filter((r) => r.created_at >= f.dateFrom);
  }

  if (f.dateTo) {
    result = result.filter((r) => r.created_at <= f.dateTo + 'T23:59:59Z');
  }

  return result;
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
