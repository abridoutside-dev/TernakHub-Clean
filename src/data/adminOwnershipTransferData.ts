// ─── Admin Workspace Ownership Transfer Data — OWN-001 ────────────────────────
// Platform-admin observation layer for Workspace Ownership Transfer requests.
// Read-only dummy data. No transfer execution, no approval logic, no notifications.
//
// TRANSFER PRINCIPLES:
//   - Only the Workspace Owner changes — UUID, identity, history are never touched.
//   - Livestock, Feed, Medicine, Marketplace, Reports, Activity History stay attached.

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkspaceType = 'Farm' | 'Veterinary' | 'FeedStore' | 'Transport';

export type TransferStatus =
  | 'Draft'
  | 'PendingRequest'
  | 'WaitingAcceptance'
  | 'WaitingVerification'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Completed';

export type TransferReason =
  | 'Penjualan Bisnis'
  | 'Warisan'
  | 'Restrukturisasi Kepemilikan'
  | 'Pengunduran Diri Pemilik'
  | 'Kemitraan Baru'
  | 'Lainnya';

export interface OwnerRef {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  verified: boolean;
  workspace_membership?: string; // current role in workspace
}

export interface WorkspaceSnapshot {
  workspace_id: string;
  workspace_name: string;
  workspace_type: WorkspaceType;
  workspace_slug: string;
  location: string;
  created_at: string;           // workspace creation date
  livestock_count: number;
  total_transactions: number;
  verified: boolean;
}

export interface TimelineEvent {
  timestamp: string;
  actor: string;
  action: string;
  note?: string;
}

export interface StatusHistoryEntry {
  from_status: TransferStatus | null;
  to_status: TransferStatus;
  changed_at: string;
  changed_by: string;
  reason?: string;
}

export interface OwnershipTransferRecord {
  request_id: string;                 // OWN-YYYYMMDD-XXXX
  workspace: WorkspaceSnapshot;
  current_owner: OwnerRef;
  proposed_owner: OwnerRef;
  status: TransferStatus;
  reason: TransferReason;
  initiated_by: 'CurrentOwner' | 'ProposedOwner' | 'Platform';
  created_at: string;
  updated_at: string;
  acceptance_deadline?: string;       // proposed owner must accept by
  verification_deadline?: string;
  completed_at?: string;
  notes?: string;
  admin_notes?: string;               // platform administrator notes
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

export const TRANSFER_STATUS_CONFIG: Record<TransferStatus, {
  label: string; color: string; bg: string; dot: string; step: number;
}> = {
  Draft:               { label: 'Draft',                    color: '#64748b', bg: '#f8fafc', dot: '#94a3b8', step: 1 },
  PendingRequest:      { label: 'Menunggu Pengajuan',       color: '#b45309', bg: '#fffbeb', dot: '#f59e0b', step: 2 },
  WaitingAcceptance:   { label: 'Menunggu Penerimaan',      color: '#c2410c', bg: '#fff7ed', dot: '#fb923c', step: 3 },
  WaitingVerification: { label: 'Menunggu Verifikasi',      color: '#7c3aed', bg: '#f5f3ff', dot: '#a78bfa', step: 4 },
  Approved:            { label: 'Disetujui',                color: '#0369a1', bg: '#f0f9ff', dot: '#38bdf8', step: 5 },
  Rejected:            { label: 'Ditolak',                  color: '#b91c1c', bg: '#fef2f2', dot: '#f87171', step: 0 },
  Cancelled:           { label: 'Dibatalkan',               color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8', step: 0 },
  Completed:           { label: 'Selesai',                  color: '#15803d', bg: '#f0fdf4', dot: '#22c55e', step: 6 },
};

// ─── Owner & Workspace Stubs ──────────────────────────────────────────────────

const OWNERS: Record<string, OwnerRef> = {
  o1: { user_id: 'usr-o1', full_name: 'Ahmad Fauzi',       email: 'ahmad.fauzi@ternakhub.id',     verified: true  },
  o2: { user_id: 'usr-o2', full_name: 'Budi Santoso',      email: 'budi.s@ternakhub.id',          verified: true  },
  o3: { user_id: 'usr-o3', full_name: 'drh. Rini Wulandari', email: 'rini.vet@ternakhub.id',     verified: true  },
  o4: { user_id: 'usr-o4', full_name: 'Hadi Purnomo',      email: 'hadi.p@ternakhub.id',          verified: true  },
  o5: { user_id: 'usr-o5', full_name: 'Teguh Prasetyo',    email: 'teguh.t@ternakhub.id',         verified: false },
  o6: { user_id: 'usr-o6', full_name: 'Nurul Hidayah',     email: 'nurul.h@ternakhub.id',         verified: true  },
  o7: { user_id: 'usr-o7', full_name: 'Wahyu Setiawan',    email: 'wahyu.s@ternakhub.id',         verified: true  },
  o8: { user_id: 'usr-o8', full_name: 'drh. Agus Kurniawan', email: 'agus.vet@ternakhub.id',     verified: true  },
  o9: { user_id: 'usr-o9', full_name: 'Eko Sulistyo',      email: 'eko.sl@ternakhub.id',          verified: true  },
  o10:{ user_id: 'usr-o10',full_name: 'Lestari Agung',     email: 'lestari.a@ternakhub.id',       verified: false },
  o11:{ user_id: 'usr-o11',full_name: 'Dian Permata',      email: 'dian.p@ternakhub.id',          verified: true  },
  o12:{ user_id: 'usr-o12',full_name: 'Rizky Aditya',      email: 'rizky.ad@ternakhub.id',        verified: true  },
};

const WS: Record<string, WorkspaceSnapshot> = {
  w1: { workspace_id: 'w1', workspace_name: 'Berkah Farm Garut',       workspace_type: 'Farm',       workspace_slug: 'berkah-farm-garut',       location: 'Garut, Jawa Barat',          created_at: '2024-03-15', livestock_count: 142, total_transactions: 87,  verified: true  },
  w2: { workspace_id: 'w2', workspace_name: 'Maju Jaya Farm',          workspace_type: 'Farm',       workspace_slug: 'maju-jaya-farm',          location: 'Malang, Jawa Timur',         created_at: '2023-11-20', livestock_count: 89,  total_transactions: 64,  verified: true  },
  w3: { workspace_id: 'w3', workspace_name: 'Klinik Hewan Sejahtera',  workspace_type: 'Veterinary', workspace_slug: 'klinik-hewan-sejahtera',  location: 'Bandung, Jawa Barat',        created_at: '2024-01-08', livestock_count: 0,   total_transactions: 203, verified: true  },
  w4: { workspace_id: 'w4', workspace_name: 'Depot Pakan Makmur',      workspace_type: 'FeedStore',  workspace_slug: 'depot-pakan-makmur',      location: 'Surabaya, Jawa Timur',       created_at: '2023-09-12', livestock_count: 0,   total_transactions: 415, verified: true  },
  w5: { workspace_id: 'w5', workspace_name: 'Trans Ternak Ekspres',    workspace_type: 'Transport',  workspace_slug: 'trans-ternak-ekspres',    location: 'Bandung, Jawa Barat',        created_at: '2024-05-01', livestock_count: 0,   total_transactions: 56,  verified: false },
  w6: { workspace_id: 'w6', workspace_name: 'Koperasi Sapi Jateng',   workspace_type: 'Farm',       workspace_slug: 'koperasi-sapi-jateng',    location: 'Semarang, Jawa Tengah',      created_at: '2023-07-25', livestock_count: 318, total_transactions: 156, verified: true  },
  w7: { workspace_id: 'w7', workspace_name: 'Toko Pakan Subur',       workspace_type: 'FeedStore',  workspace_slug: 'toko-pakan-subur',        location: 'Yogyakarta, DIY',             created_at: '2024-02-14', livestock_count: 0,   total_transactions: 189, verified: true  },
  w8: { workspace_id: 'w8', workspace_name: 'Klinik Hewan Bersama',   workspace_type: 'Veterinary', workspace_slug: 'klinik-hewan-bersama',    location: 'Surabaya, Jawa Timur',       created_at: '2024-04-03', livestock_count: 0,   total_transactions: 134, verified: true  },
  w9: { workspace_id: 'w9', workspace_name: 'Logistik Ternak Nusantara', workspace_type: 'Transport', workspace_slug: 'logistik-ternak-nusantara', location: 'Jakarta, DKI Jakarta',  created_at: '2023-12-01', livestock_count: 0,   total_transactions: 278, verified: true  },
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const ADMIN_TRANSFER_LIST: OwnershipTransferRecord[] = [
  // ── Completed: Farm sold ──────────────────────────────────────────────────
  {
    request_id: 'OWN-20260401-0001',
    workspace: WS['w2'],
    current_owner: OWNERS['o2'],
    proposed_owner: OWNERS['o12'],
    status: 'Completed',
    reason: 'Penjualan Bisnis',
    initiated_by: 'CurrentOwner',
    created_at: '2026-04-01T09:00:00.000Z',
    updated_at: '2026-04-28T10:00:00.000Z',
    completed_at: '2026-04-28T10:00:00.000Z',
    notes: 'Penjualan penuh bisnis peternakan Maju Jaya Farm kepada pemilik baru.',
    admin_notes: 'Dokumen kepemilikan terverifikasi. Transfer selesai tanpa masalah.',
    timeline: [
      { timestamp: '2026-04-01T09:00:00.000Z', actor: 'Budi Santoso',   action: 'Membuat permintaan transfer kepemilikan', note: 'Alasan: penjualan bisnis' },
      { timestamp: '2026-04-03T10:00:00.000Z', actor: 'System',         action: 'Notifikasi dikirim ke Rizky Aditya (pemilik baru)' },
      { timestamp: '2026-04-05T14:00:00.000Z', actor: 'Rizky Aditya',   action: 'Menerima dan menyetujui permintaan transfer' },
      { timestamp: '2026-04-07T09:00:00.000Z', actor: 'Platform',       action: 'Proses verifikasi dokumen dimulai' },
      { timestamp: '2026-04-20T11:00:00.000Z', actor: 'Platform',       action: 'Verifikasi dokumen selesai — disetujui' },
      { timestamp: '2026-04-28T10:00:00.000Z', actor: 'Platform',       action: 'Transfer kepemilikan berhasil diselesaikan', note: 'Rizky Aditya resmi menjadi pemilik baru Maju Jaya Farm' },
    ],
    status_history: [
      { from_status: null,               to_status: 'Draft',               changed_at: '2026-04-01T09:00:00.000Z', changed_by: 'Budi Santoso' },
      { from_status: 'Draft',            to_status: 'PendingRequest',      changed_at: '2026-04-01T09:10:00.000Z', changed_by: 'Budi Santoso' },
      { from_status: 'PendingRequest',   to_status: 'WaitingAcceptance',   changed_at: '2026-04-03T10:00:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingAcceptance',to_status: 'WaitingVerification', changed_at: '2026-04-05T14:00:00.000Z', changed_by: 'Rizky Aditya' },
      { from_status: 'WaitingVerification', to_status: 'Approved',        changed_at: '2026-04-20T11:00:00.000Z', changed_by: 'Platform' },
      { from_status: 'Approved',         to_status: 'Completed',           changed_at: '2026-04-28T10:00:00.000Z', changed_by: 'Platform' },
    ],
  },

  // ── Waiting Verification: Clinic ownership (succession) ───────────────────
  {
    request_id: 'OWN-20260601-0002',
    workspace: WS['w3'],
    current_owner: OWNERS['o3'],
    proposed_owner: OWNERS['o11'],
    status: 'WaitingVerification',
    reason: 'Warisan',
    initiated_by: 'CurrentOwner',
    created_at: '2026-06-01T08:00:00.000Z',
    updated_at: '2026-06-15T10:00:00.000Z',
    acceptance_deadline: '2026-07-01',
    verification_deadline: '2026-07-25',
    notes: 'drh. Rini berencana pensiun dan mewariskan klinik kepada drh. junior.',
    admin_notes: 'Menunggu dokumen notaris dan sertifikasi veteriner dari penerima.',
    timeline: [
      { timestamp: '2026-06-01T08:00:00.000Z', actor: 'drh. Rini Wulandari', action: 'Mengajukan transfer kepemilikan — alasan: warisan/pensiun' },
      { timestamp: '2026-06-03T09:00:00.000Z', actor: 'System',              action: 'Notifikasi dikirim ke Dian Permata' },
      { timestamp: '2026-06-05T11:00:00.000Z', actor: 'Dian Permata',        action: 'Menerima permintaan transfer kepemilikan klinik' },
      { timestamp: '2026-06-07T09:00:00.000Z', actor: 'Platform',            action: 'Proses verifikasi dimulai — menunggu dokumen notaris' },
      { timestamp: '2026-06-15T10:00:00.000Z', actor: 'Platform',            action: 'Pengingat dokumen dikirim ke Dian Permata', note: 'Deadline verifikasi: 25 Juli 2026' },
    ],
    status_history: [
      { from_status: null,               to_status: 'Draft',               changed_at: '2026-06-01T08:00:00.000Z', changed_by: 'drh. Rini Wulandari' },
      { from_status: 'Draft',            to_status: 'PendingRequest',      changed_at: '2026-06-01T08:15:00.000Z', changed_by: 'drh. Rini Wulandari' },
      { from_status: 'PendingRequest',   to_status: 'WaitingAcceptance',   changed_at: '2026-06-03T09:00:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingAcceptance',to_status: 'WaitingVerification', changed_at: '2026-06-05T11:00:00.000Z', changed_by: 'Dian Permata' },
    ],
  },

  // ── Approved: Feed Store restructuring ────────────────────────────────────
  {
    request_id: 'OWN-20260620-0003',
    workspace: WS['w4'],
    current_owner: OWNERS['o4'],
    proposed_owner: OWNERS['o6'],
    status: 'Approved',
    reason: 'Restrukturisasi Kepemilikan',
    initiated_by: 'CurrentOwner',
    created_at: '2026-06-20T10:00:00.000Z',
    updated_at: '2026-07-10T14:00:00.000Z',
    completed_at: undefined,
    notes: 'Restrukturisasi bisnis — kepemilikan berpindah ke koperasi yang dinaungi Nurul Hidayah.',
    admin_notes: 'Disetujui. Menunggu eksekusi transfer oleh Platform Admin.',
    timeline: [
      { timestamp: '2026-06-20T10:00:00.000Z', actor: 'Hadi Purnomo',    action: 'Mengajukan transfer kepemilikan depot pakan ke koperasi' },
      { timestamp: '2026-06-22T09:00:00.000Z', actor: 'System',          action: 'Notifikasi dikirim ke Nurul Hidayah' },
      { timestamp: '2026-06-25T13:00:00.000Z', actor: 'Nurul Hidayah',   action: 'Menerima dan menyetujui permintaan transfer' },
      { timestamp: '2026-06-27T09:00:00.000Z', actor: 'Platform',        action: 'Proses verifikasi dokumen restrukturisasi dimulai' },
      { timestamp: '2026-07-10T14:00:00.000Z', actor: 'Platform',        action: 'Dokumen terverifikasi — status diubah ke Disetujui', note: 'Eksekusi transfer menunggu jadwal admin' },
    ],
    status_history: [
      { from_status: null,               to_status: 'Draft',               changed_at: '2026-06-20T10:00:00.000Z', changed_by: 'Hadi Purnomo' },
      { from_status: 'Draft',            to_status: 'PendingRequest',      changed_at: '2026-06-20T10:30:00.000Z', changed_by: 'Hadi Purnomo' },
      { from_status: 'PendingRequest',   to_status: 'WaitingAcceptance',   changed_at: '2026-06-22T09:00:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingAcceptance',to_status: 'WaitingVerification', changed_at: '2026-06-25T13:00:00.000Z', changed_by: 'Nurul Hidayah' },
      { from_status: 'WaitingVerification', to_status: 'Approved',        changed_at: '2026-07-10T14:00:00.000Z', changed_by: 'Platform' },
    ],
  },

  // ── Waiting Acceptance: Transport owner resignation ────────────────────────
  {
    request_id: 'OWN-20260705-0004',
    workspace: WS['w5'],
    current_owner: OWNERS['o5'],
    proposed_owner: OWNERS['o9'],
    status: 'WaitingAcceptance',
    reason: 'Pengunduran Diri Pemilik',
    initiated_by: 'CurrentOwner',
    created_at: '2026-07-05T09:00:00.000Z',
    updated_at: '2026-07-05T09:10:00.000Z',
    acceptance_deadline: '2026-07-20',
    notes: 'Teguh mengundurkan diri karena kondisi kesehatan. Menawarkan kepemilikan ke operator logistik berpengalaman.',
    timeline: [
      { timestamp: '2026-07-05T09:00:00.000Z', actor: 'Teguh Prasetyo', action: 'Mengajukan transfer kepemilikan — alasan: pengunduran diri' },
      { timestamp: '2026-07-05T09:10:00.000Z', actor: 'System',         action: 'Notifikasi dikirim ke Eko Sulistyo', note: 'Batas penerimaan: 20 Juli 2026' },
    ],
    status_history: [
      { from_status: null,             to_status: 'Draft',             changed_at: '2026-07-05T09:00:00.000Z', changed_by: 'Teguh Prasetyo' },
      { from_status: 'Draft',          to_status: 'PendingRequest',    changed_at: '2026-07-05T09:05:00.000Z', changed_by: 'Teguh Prasetyo' },
      { from_status: 'PendingRequest', to_status: 'WaitingAcceptance', changed_at: '2026-07-05T09:10:00.000Z', changed_by: 'System' },
    ],
  },

  // ── Rejected: Farm transfer refused by proposed owner ─────────────────────
  {
    request_id: 'OWN-20260610-0005',
    workspace: WS['w1'],
    current_owner: OWNERS['o1'],
    proposed_owner: OWNERS['o7'],
    status: 'Rejected',
    reason: 'Kemitraan Baru',
    initiated_by: 'CurrentOwner',
    created_at: '2026-06-10T10:00:00.000Z',
    updated_at: '2026-06-13T16:00:00.000Z',
    notes: 'Ahmad mencoba mentransfer kepemilikan ke mitra bisnis baru.',
    timeline: [
      { timestamp: '2026-06-10T10:00:00.000Z', actor: 'Ahmad Fauzi',   action: 'Mengajukan transfer kepemilikan ke mitra bisnis baru' },
      { timestamp: '2026-06-11T09:00:00.000Z', actor: 'System',        action: 'Notifikasi dikirim ke Wahyu Setiawan' },
      { timestamp: '2026-06-13T16:00:00.000Z', actor: 'Wahyu Setiawan',action: 'Menolak permintaan transfer kepemilikan', note: 'Merasa belum siap mengambil alih peternakan' },
    ],
    status_history: [
      { from_status: null,             to_status: 'Draft',             changed_at: '2026-06-10T10:00:00.000Z', changed_by: 'Ahmad Fauzi' },
      { from_status: 'Draft',          to_status: 'PendingRequest',    changed_at: '2026-06-10T10:20:00.000Z', changed_by: 'Ahmad Fauzi' },
      { from_status: 'PendingRequest', to_status: 'WaitingAcceptance', changed_at: '2026-06-11T09:00:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingAcceptance', to_status: 'Rejected',       changed_at: '2026-06-13T16:00:00.000Z', changed_by: 'Wahyu Setiawan', reason: 'Penerima tidak bersedia mengambil alih' },
    ],
  },

  // ── Cancelled: Veterinary clinic transfer cancelled by initiator ──────────
  {
    request_id: 'OWN-20260501-0006',
    workspace: WS['w8'],
    current_owner: OWNERS['o8'],
    proposed_owner: OWNERS['o3'],
    status: 'Cancelled',
    reason: 'Lainnya',
    initiated_by: 'CurrentOwner',
    created_at: '2026-05-01T09:00:00.000Z',
    updated_at: '2026-05-10T11:00:00.000Z',
    notes: 'Rencana berubah — tidak jadi transfer.',
    timeline: [
      { timestamp: '2026-05-01T09:00:00.000Z', actor: 'drh. Agus Kurniawan', action: 'Mengajukan transfer kepemilikan klinik' },
      { timestamp: '2026-05-02T08:00:00.000Z', actor: 'System',              action: 'Notifikasi dikirim ke drh. Rini Wulandari' },
      { timestamp: '2026-05-10T11:00:00.000Z', actor: 'drh. Agus Kurniawan', action: 'Membatalkan permintaan transfer', note: 'Keputusan berubah — tidak jadi dijual' },
    ],
    status_history: [
      { from_status: null,             to_status: 'Draft',             changed_at: '2026-05-01T09:00:00.000Z', changed_by: 'drh. Agus Kurniawan' },
      { from_status: 'Draft',          to_status: 'PendingRequest',    changed_at: '2026-05-01T09:15:00.000Z', changed_by: 'drh. Agus Kurniawan' },
      { from_status: 'PendingRequest', to_status: 'WaitingAcceptance', changed_at: '2026-05-02T08:00:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingAcceptance', to_status: 'Cancelled',      changed_at: '2026-05-10T11:00:00.000Z', changed_by: 'drh. Agus Kurniawan', reason: 'Pembatalan oleh pemrakarsa' },
    ],
  },

  // ── Draft: Large cooperative farm ─────────────────────────────────────────
  {
    request_id: 'OWN-20260717-0007',
    workspace: WS['w6'],
    current_owner: OWNERS['o6'],
    proposed_owner: OWNERS['o12'],
    status: 'Draft',
    reason: 'Restrukturisasi Kepemilikan',
    initiated_by: 'CurrentOwner',
    created_at: '2026-07-17T14:00:00.000Z',
    updated_at: '2026-07-17T14:05:00.000Z',
    notes: 'Sedang mempersiapkan dokumen untuk transfer kepemilikan koperasi.',
    timeline: [
      { timestamp: '2026-07-17T14:00:00.000Z', actor: 'Nurul Hidayah', action: 'Membuat draft permintaan transfer kepemilikan koperasi', note: 'Belum disubmit — masih menyiapkan dokumen' },
    ],
    status_history: [
      { from_status: null, to_status: 'Draft', changed_at: '2026-07-17T14:00:00.000Z', changed_by: 'Nurul Hidayah' },
    ],
  },

  // ── Pending Request: Transport fleet change ────────────────────────────────
  {
    request_id: 'OWN-20260715-0008',
    workspace: WS['w9'],
    current_owner: OWNERS['o9'],
    proposed_owner: OWNERS['o5'],
    status: 'PendingRequest',
    reason: 'Penjualan Bisnis',
    initiated_by: 'CurrentOwner',
    created_at: '2026-07-15T10:00:00.000Z',
    updated_at: '2026-07-16T09:00:00.000Z',
    notes: 'Eko berencana menjual armada logistik ternak ke Teguh setelah masa suspensi kemitraan selesai.',
    timeline: [
      { timestamp: '2026-07-15T10:00:00.000Z', actor: 'Eko Sulistyo', action: 'Membuat dan mengajukan permintaan transfer kepemilikan' },
      { timestamp: '2026-07-16T09:00:00.000Z', actor: 'System',       action: 'Permintaan masuk antrian review Platform', note: 'Menunggu konfirmasi awal dari Platform sebelum notifikasi dikirim' },
    ],
    status_history: [
      { from_status: null,    to_status: 'Draft',          changed_at: '2026-07-15T10:00:00.000Z', changed_by: 'Eko Sulistyo' },
      { from_status: 'Draft', to_status: 'PendingRequest', changed_at: '2026-07-15T10:30:00.000Z', changed_by: 'Eko Sulistyo' },
    ],
  },

  // ── Completed: Feed store second sale ────────────────────────────────────
  {
    request_id: 'OWN-20260301-0009',
    workspace: WS['w7'],
    current_owner: OWNERS['o7'],
    proposed_owner: OWNERS['o4'],
    status: 'Completed',
    reason: 'Penjualan Bisnis',
    initiated_by: 'CurrentOwner',
    created_at: '2026-03-01T08:00:00.000Z',
    updated_at: '2026-03-25T10:00:00.000Z',
    completed_at: '2026-03-25T10:00:00.000Z',
    notes: 'Toko Pakan Subur dijual ke Hadi Purnomo — integrasi dengan jaringan Depot Pakan Makmur.',
    admin_notes: 'Transfer berjalan lancar. Seluruh riwayat transaksi dan stok tetap utuh.',
    timeline: [
      { timestamp: '2026-03-01T08:00:00.000Z', actor: 'Wahyu Setiawan', action: 'Mengajukan transfer kepemilikan toko pakan ke Hadi Purnomo' },
      { timestamp: '2026-03-02T09:00:00.000Z', actor: 'System',         action: 'Notifikasi dikirim ke Hadi Purnomo' },
      { timestamp: '2026-03-03T14:00:00.000Z', actor: 'Hadi Purnomo',   action: 'Menerima dan menyetujui transfer' },
      { timestamp: '2026-03-05T09:00:00.000Z', actor: 'Platform',       action: 'Verifikasi identitas dan dokumen dimulai' },
      { timestamp: '2026-03-15T11:00:00.000Z', actor: 'Platform',       action: 'Verifikasi selesai — disetujui' },
      { timestamp: '2026-03-25T10:00:00.000Z', actor: 'Platform',       action: 'Transfer kepemilikan berhasil diselesaikan', note: 'Hadi Purnomo resmi pemilik Toko Pakan Subur. Data, stok, dan riwayat tetap utuh.' },
    ],
    status_history: [
      { from_status: null,               to_status: 'Draft',               changed_at: '2026-03-01T08:00:00.000Z', changed_by: 'Wahyu Setiawan' },
      { from_status: 'Draft',            to_status: 'PendingRequest',      changed_at: '2026-03-01T08:20:00.000Z', changed_by: 'Wahyu Setiawan' },
      { from_status: 'PendingRequest',   to_status: 'WaitingAcceptance',   changed_at: '2026-03-02T09:00:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingAcceptance',to_status: 'WaitingVerification', changed_at: '2026-03-03T14:00:00.000Z', changed_by: 'Hadi Purnomo' },
      { from_status: 'WaitingVerification', to_status: 'Approved',        changed_at: '2026-03-15T11:00:00.000Z', changed_by: 'Platform' },
      { from_status: 'Approved',         to_status: 'Completed',           changed_at: '2026-03-25T10:00:00.000Z', changed_by: 'Platform' },
    ],
  },

  // ── Waiting Acceptance: Farm new partnership ──────────────────────────────
  {
    request_id: 'OWN-20260712-0010',
    workspace: WS['w1'],
    current_owner: OWNERS['o1'],
    proposed_owner: OWNERS['o6'],
    status: 'WaitingAcceptance',
    reason: 'Kemitraan Baru',
    initiated_by: 'CurrentOwner',
    created_at: '2026-07-12T09:00:00.000Z',
    updated_at: '2026-07-12T09:10:00.000Z',
    acceptance_deadline: '2026-07-27',
    notes: 'Ahmad menawarkan kepemilikan Berkah Farm ke Nurul — ekspansi koperasi ke Jawa Barat.',
    timeline: [
      { timestamp: '2026-07-12T09:00:00.000Z', actor: 'Ahmad Fauzi',  action: 'Mengajukan transfer kepemilikan ke Nurul Hidayah' },
      { timestamp: '2026-07-12T09:10:00.000Z', actor: 'System',       action: 'Notifikasi dikirim ke Nurul Hidayah', note: 'Batas penerimaan: 27 Juli 2026' },
    ],
    status_history: [
      { from_status: null,             to_status: 'Draft',             changed_at: '2026-07-12T09:00:00.000Z', changed_by: 'Ahmad Fauzi' },
      { from_status: 'Draft',          to_status: 'PendingRequest',    changed_at: '2026-07-12T09:05:00.000Z', changed_by: 'Ahmad Fauzi' },
      { from_status: 'PendingRequest', to_status: 'WaitingAcceptance', changed_at: '2026-07-12T09:10:00.000Z', changed_by: 'System' },
    ],
  },
];

// ─── Platform Stats ───────────────────────────────────────────────────────────

function computeStats() {
  const total     = ADMIN_TRANSFER_LIST.length;
  const pending   = ADMIN_TRANSFER_LIST.filter((r) =>
    r.status === 'Draft' || r.status === 'PendingRequest' ||
    r.status === 'WaitingAcceptance' || r.status === 'WaitingVerification'
  ).length;
  const approved  = ADMIN_TRANSFER_LIST.filter((r) => r.status === 'Approved').length;
  const rejected  = ADMIN_TRANSFER_LIST.filter((r) => r.status === 'Rejected').length;
  const completed = ADMIN_TRANSFER_LIST.filter((r) => r.status === 'Completed').length;
  const cancelled = ADMIN_TRANSFER_LIST.filter((r) => r.status === 'Cancelled').length;
  return { total, pending, approved, rejected, completed, cancelled };
}

export const TRANSFER_PLATFORM_STATS = computeStats();

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface TransferFilter {
  search: string;
  status: string;
  workspaceType: string;
  dateFrom: string;
  dateTo: string;
}

export function filterTransfers(
  list: OwnershipTransferRecord[],
  f: TransferFilter,
): OwnershipTransferRecord[] {
  let result = list;

  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    result = result.filter(
      (r) =>
        r.workspace.workspace_name.toLowerCase().includes(q) ||
        r.workspace.workspace_id.toLowerCase().includes(q) ||
        r.current_owner.full_name.toLowerCase().includes(q) ||
        r.proposed_owner.full_name.toLowerCase().includes(q) ||
        r.request_id.toLowerCase().includes(q),
    );
  }

  if (f.status && f.status !== 'all') {
    result = result.filter((r) => r.status === f.status);
  }

  if (f.workspaceType && f.workspaceType !== 'all') {
    result = result.filter((r) => r.workspace.workspace_type === f.workspaceType);
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
