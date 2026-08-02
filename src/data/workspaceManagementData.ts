// ─── Workspace Management Data ─────────────────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ⚠️  LEGACY — P0-001B                                                   ║
// ║                                                                          ║
// ║  File ini berstatus LEGACY dan TIDAK lagi menjadi sumber data resmi     ║
// ║  untuk entitas Workspace.                                                ║
// ║                                                                          ║
// ║  Single Source of Truth yang resmi:                                      ║
// ║    src/data/workspaceFoundationData.ts  (via workspaceService.ts)        ║
// ║                                                                          ║
// ║  File ini dipertahankan agar tidak ada perubahan perilaku aplikasi       ║
// ║  selama masa transisi. File ini akan dipensiunkan pada P0-001D.          ║
// ║                                                                          ║
// ║  JANGAN tambahkan data atau logika workspace baru di sini.               ║
// ║  JANGAN buat file baru yang mengimpor dari sini sebagai sumber data      ║
// ║  workspace utama.                                                        ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// PROFILE-002 — Account & Workspace Management
// Mengikuti docs/architecture/PROFILE_MODULE_CONSTITUTION.md
//
// Data workspace yang diperkaya untuk kebutuhan manajemen di modul Profile.
// BUKAN pengganti WORKSPACES di TopAppBar — itu tetap satu-satunya sumber
// kebenaran untuk Workspace Switcher di Global Header.
//
// Profile membaca data ini untuk mengelola workspace milik pengguna.
// Profile TIDAK menulis ke TopAppBar.tsx.

import { type WorkspaceJenis } from '../components/TopAppBar';
import type { MembershipTier, VerifikasiStatus } from './profileData';
import { generateUUID } from '../utils/uuid';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type WorkspaceStatus = 'Aktif' | 'Arsip';
export type MemberRole     = 'Owner' | 'Admin' | 'Member';
export type MemberStatus   = 'Aktif' | 'Nonaktif';

export interface WorkspaceManagementRecord {
  id: string;
  icon: string;
  nama: string;
  jenis: WorkspaceJenis;
  deskripsi: string;
  alamat: string;
  kontak: string;
  banner: string;           // emoji placeholder untuk banner header
  statusVerifikasi: VerifikasiStatus;
  membership: MembershipTier;
  status: WorkspaceStatus;
  tanggalDibuat: string;    // ISO yyyy-mm-dd
}

export interface WorkspaceMemberRecord {
  id: string;
  workspaceId: string;
  foto: string;             // emoji avatar
  nama: string;
  role: MemberRole;
  status: MemberStatus;
}

export interface WorkspaceAuditEntry {
  id: string;
  workspaceId: string;
  aksi: string;
  detail: string;
  timestamp: string;        // ISO
}

// ─── Seed Data — Workspace ─────────────────────────────────────────────────────
// ID selaras dengan WORKSPACES di TopAppBar.tsx agar tampilan badge Aktif
// dapat dibandingkan tanpa duplikasi data.

let WORKSPACE_MANAGEMENT_LIST: WorkspaceManagementRecord[] = [
  {
    id: 'w1',
    icon: '🐑',
    nama: 'Berkah Farm Garut',
    jenis: 'Peternakan',
    deskripsi: 'Peternakan domba dan kambing terpadu di kawasan Garut, Jawa Barat. Fokus pada produksi daging dan bibit unggul.',
    alamat: 'Jl. Raya Samarang No. 12, Desa Sukamukti, Garut, Jawa Barat 44151',
    kontak: '+62 812-3456-7890',
    banner: '🌿',
    statusVerifikasi: 'Terverifikasi',
    membership: 'PRO',
    status: 'Aktif',
    tanggalDibuat: '2024-03-15',
  },
  {
    id: 'w2',
    icon: '🐑',
    nama: 'Berkah Farm Tasik',
    jenis: 'Peternakan',
    deskripsi: 'Cabang peternakan di Tasikmalaya, spesialisasi kambing perah dan produk olahan susu.',
    alamat: 'Jl. Singaparna KM 5, Tasikmalaya, Jawa Barat 46416',
    kontak: '+62 813-5678-9012',
    banner: '🌾',
    statusVerifikasi: 'Belum Terverifikasi',
    membership: 'FREE',
    status: 'Aktif',
    tanggalDibuat: '2024-07-01',
  },
  {
    id: 'w3',
    icon: '🌾',
    nama: 'Toko Pakan Berkah',
    jenis: 'Toko Pakan',
    deskripsi: 'Distributor pakan ternak berkualitas tinggi. Melayani peternak se-wilayah Garut dan sekitarnya.',
    alamat: 'Jl. Guntur No. 45, Garut Kota, Jawa Barat 44111',
    kontak: '+62 812-9988-7766',
    banner: '🌱',
    statusVerifikasi: 'Terverifikasi',
    membership: 'PRO',
    status: 'Aktif',
    tanggalDibuat: '2024-05-20',
  },
  {
    id: 'w4',
    icon: '🚚',
    nama: 'Berkah Transport',
    jenis: 'Transporter',
    deskripsi: 'Layanan transportasi ternak berpendingin dan berventilasi. Armada 4 unit, cover Jabar–Jateng.',
    alamat: 'Jl. Bypass Garut No. 88, Garut, Jawa Barat 44191',
    kontak: '+62 811-2233-4455',
    banner: '🛤️',
    statusVerifikasi: 'Belum Terverifikasi',
    membership: 'FREE',
    status: 'Aktif',
    tanggalDibuat: '2024-09-10',
  },
  {
    id: 'w5',
    icon: '👨‍⚕️',
    nama: 'drh. Amelia Putri',
    jenis: 'Dokter Hewan',
    deskripsi: 'Praktik dokter hewan khusus hewan ternak besar. Layanan kunjungan kandang dan konsultasi online.',
    alamat: 'Jl. Ahmad Yani No. 23, Garut Kota, Jawa Barat 44111',
    kontak: '+62 818-0099-1122',
    banner: '🩺',
    statusVerifikasi: 'Terverifikasi',
    membership: 'FREE',
    status: 'Aktif',
    tanggalDibuat: '2025-01-05',
  },
  {
    id: 'w6',
    icon: '🏥',
    nama: 'Klinik Hewan Sejahtera',
    jenis: 'Klinik Hewan',
    deskripsi: 'Klinik hewan dengan fasilitas lengkap. Sementara diarsipkan untuk renovasi gedung.',
    alamat: 'Jl. Merdeka No. 10, Garut Kota, Jawa Barat 44111',
    kontak: '+62 819-7788-5544',
    banner: '🏥',
    statusVerifikasi: 'Belum Terverifikasi',
    membership: 'FREE',
    status: 'Arsip',
    tanggalDibuat: '2025-03-18',
  },
];

// ─── Seed Data — Members ───────────────────────────────────────────────────────

let WORKSPACE_MEMBERS: WorkspaceMemberRecord[] = [
  // w1 — Berkah Farm Garut
  { id: 'm-w1-001', workspaceId: 'w1', foto: '👨‍🌾', nama: 'Budi Santoso',     role: 'Owner',  status: 'Aktif'    },
  { id: 'm-w1-002', workspaceId: 'w1', foto: '👩‍💼', nama: 'Sari Dewi',         role: 'Admin',  status: 'Aktif'    },
  { id: 'm-w1-003', workspaceId: 'w1', foto: '👨‍🔧', nama: 'Joko Sutrisno',     role: 'Member', status: 'Aktif'    },
  { id: 'm-w1-004', workspaceId: 'w1', foto: '👩‍🦱', nama: 'Rina Lestari',      role: 'Member', status: 'Nonaktif' },
  // w2 — Berkah Farm Tasik
  { id: 'm-w2-001', workspaceId: 'w2', foto: '👨‍🌾', nama: 'Budi Santoso',     role: 'Owner',  status: 'Aktif'    },
  { id: 'm-w2-002', workspaceId: 'w2', foto: '👨‍💼', nama: 'Dedi Kurniawan',    role: 'Member', status: 'Aktif'    },
  // w3 — Toko Pakan Berkah
  { id: 'm-w3-001', workspaceId: 'w3', foto: '👨‍🌾', nama: 'Budi Santoso',     role: 'Owner',  status: 'Aktif'    },
  { id: 'm-w3-002', workspaceId: 'w3', foto: '👩‍💼', nama: 'Rini Hartati',      role: 'Admin',  status: 'Aktif'    },
  { id: 'm-w3-003', workspaceId: 'w3', foto: '👨‍🦳', nama: 'Pak Gudang',        role: 'Member', status: 'Aktif'    },
  // w4 — Berkah Transport
  { id: 'm-w4-001', workspaceId: 'w4', foto: '👨‍🌾', nama: 'Budi Santoso',     role: 'Owner',  status: 'Aktif'    },
  { id: 'm-w4-002', workspaceId: 'w4', foto: '👨‍💼', nama: 'Hendra Prasetyo',   role: 'Admin',  status: 'Aktif'    },
  { id: 'm-w4-003', workspaceId: 'w4', foto: '🧑‍✈️', nama: 'Agus Supardi',      role: 'Member', status: 'Aktif'    },
  // w5 — drh. Amelia Putri
  { id: 'm-w5-001', workspaceId: 'w5', foto: '👩‍⚕️', nama: 'drh. Amelia Putri', role: 'Owner',  status: 'Aktif'    },
  // w6 — Klinik Hewan Sejahtera
  { id: 'm-w6-001', workspaceId: 'w6', foto: '👩‍⚕️', nama: 'drh. Amelia Putri', role: 'Owner',  status: 'Aktif'    },
  { id: 'm-w6-002', workspaceId: 'w6', foto: '👨‍🌾', nama: 'Budi Santoso',     role: 'Admin',  status: 'Aktif'    },
  { id: 'm-w6-003', workspaceId: 'w6', foto: '🧑‍💼', nama: 'Pak Resepsionis',   role: 'Member', status: 'Aktif'    },
];

// ─── Audit Log ─────────────────────────────────────────────────────────────────

const WORKSPACE_AUDIT_LOG: WorkspaceAuditEntry[] = [];

function logWorkspaceAudit(workspaceId: string, aksi: string, detail: string) {
  WORKSPACE_AUDIT_LOG.push({
    id: generateUUID(),
    workspaceId,
    aksi,
    detail,
    timestamp: new Date().toISOString(),
  });
}

// ─── Queries ───────────────────────────────────────────────────────────────────

/** Semua workspace milik pengguna. */
export function getWorkspaces(): WorkspaceManagementRecord[] {
  return [...WORKSPACE_MANAGEMENT_LIST];
}

/** Workspace by ID. */
export function getWorkspaceById(id: string): WorkspaceManagementRecord | undefined {
  return WORKSPACE_MANAGEMENT_LIST.find((w) => w.id === id);
}

/** Members by workspace ID. */
export function getMembersByWorkspaceId(workspaceId: string): WorkspaceMemberRecord[] {
  return WORKSPACE_MEMBERS.filter((m) => m.workspaceId === workspaceId);
}

/** ID workspace aktif saat ini (read sessionStorage — sama dengan WorkspaceContext). */
export function getActiveWorkspaceId(): string {
  return sessionStorage.getItem('ternakhub_active_workspace_uuid') ?? '';
}

/** Jumlah anggota per workspace. */
export function getMemberCount(workspaceId: string): number {
  return WORKSPACE_MEMBERS.filter((m) => m.workspaceId === workspaceId).length;
}

// ─── Mutations — Workspace ────────────────────────────────────────────────────

export type WorkspaceFormInput = {
  icon: string;
  nama: string;
  jenis: WorkspaceJenis;
  deskripsi: string;
  alamat: string;
  kontak: string;
};

/** Tambah workspace baru. */
export function addWorkspace(input: WorkspaceFormInput): WorkspaceManagementRecord {
  const newWs: WorkspaceManagementRecord = {
    id: generateUUID(),
    icon: input.icon,
    nama: input.nama,
    jenis: input.jenis,
    deskripsi: input.deskripsi,
    alamat: input.alamat,
    kontak: input.kontak,
    banner: '🌿',
    statusVerifikasi: 'Belum Terverifikasi',
    membership: 'FREE',
    status: 'Aktif',
    tanggalDibuat: new Date().toISOString().split('T')[0],
  };
  WORKSPACE_MANAGEMENT_LIST = [...WORKSPACE_MANAGEMENT_LIST, newWs];

  // Tambahkan owner otomatis
  WORKSPACE_MEMBERS = [
    ...WORKSPACE_MEMBERS,
    {
      id: generateUUID(),
      workspaceId: newWs.id,
      foto: '👨‍🌾',
      nama: 'Budi Santoso',
      role: 'Owner',
      status: 'Aktif',
    },
  ];

  logWorkspaceAudit(newWs.id, 'Tambah Workspace', `Workspace "${input.nama}" dibuat.`);
  return newWs;
}

/** Update data workspace. */
export function updateWorkspace(id: string, patch: Partial<WorkspaceFormInput>): void {
  WORKSPACE_MANAGEMENT_LIST = WORKSPACE_MANAGEMENT_LIST.map((w) =>
    w.id === id ? { ...w, ...patch } : w
  );
  logWorkspaceAudit(id, 'Edit Workspace', `Data workspace diperbarui.`);
}

/** Arsipkan workspace. */
export function archiveWorkspace(id: string): void {
  const ws = WORKSPACE_MANAGEMENT_LIST.find((w) => w.id === id);
  if (!ws || ws.status === 'Arsip') return;
  WORKSPACE_MANAGEMENT_LIST = WORKSPACE_MANAGEMENT_LIST.map((w) =>
    w.id === id ? { ...w, status: 'Arsip' } : w
  );
  logWorkspaceAudit(id, 'Arsipkan Workspace', `Workspace "${ws.nama}" diarsipkan.`);
}

/** Pulihkan workspace dari arsip. */
export function unarchiveWorkspace(id: string): void {
  const ws = WORKSPACE_MANAGEMENT_LIST.find((w) => w.id === id);
  if (!ws || ws.status === 'Aktif') return;
  WORKSPACE_MANAGEMENT_LIST = WORKSPACE_MANAGEMENT_LIST.map((w) =>
    w.id === id ? { ...w, status: 'Aktif' } : w
  );
  logWorkspaceAudit(id, 'Pulihkan Workspace', `Workspace "${ws.nama}" dipulihkan.`);
}

// ─── Mutations — Members ───────────────────────────────────────────────────────

/** Tambah anggota ke workspace. */
export function addMember(workspaceId: string, nama: string, role: MemberRole): WorkspaceMemberRecord {
  const newMember: WorkspaceMemberRecord = {
    id: generateUUID(),
    workspaceId,
    foto: '👤',
    nama,
    role,
    status: 'Aktif',
  };
  WORKSPACE_MEMBERS = [...WORKSPACE_MEMBERS, newMember];
  logWorkspaceAudit(workspaceId, 'Tambah Anggota', `"${nama}" ditambahkan sebagai ${role}.`);
  return newMember;
}

/** Ubah role anggota. */
export function updateMemberRole(memberId: string, newRole: MemberRole): void {
  const member = WORKSPACE_MEMBERS.find((m) => m.id === memberId);
  if (!member || member.role === 'Owner') return;
  WORKSPACE_MEMBERS = WORKSPACE_MEMBERS.map((m) =>
    m.id === memberId ? { ...m, role: newRole } : m
  );
  logWorkspaceAudit(member.workspaceId, 'Ubah Role', `"${member.nama}" diubah menjadi ${newRole}.`);
}

/** Hapus anggota (tidak bisa hapus Owner). */
export function removeMember(memberId: string): void {
  const member = WORKSPACE_MEMBERS.find((m) => m.id === memberId);
  if (!member || member.role === 'Owner') return;
  WORKSPACE_MEMBERS = WORKSPACE_MEMBERS.filter((m) => m.id !== memberId);
  logWorkspaceAudit(member.workspaceId, 'Hapus Anggota', `"${member.nama}" dihapus dari workspace.`);
}

// ─── Constants ─────────────────────────────────────────────────────────────────

// Emoji icon options for workspace form — shared by ProfileWorkspace and ProfileWorkspaceDetail
export const WORKSPACE_ICON_OPTIONS: string[] = [
  '🏢','🐄','🐑','🐐','🐔','🐖','🌾','🌱','💊','🚚','👨‍⚕️','🏥','🌿','🏡','⭐','🔑',
];

export const WORKSPACE_JENIS_OPTIONS: WorkspaceJenis[] = [
  'Peternakan',
  'Toko Pakan',
  'Toko Obat',
  'Transporter',
  'Dokter Hewan',
  'Klinik Hewan',
];

export const WORKSPACE_JENIS_ICON: Record<WorkspaceJenis, string> = {
  'Peternakan':    '🐄',
  'Toko Pakan':   '🌾',
  'Toko Obat':    '💊',
  'Transporter':  '🚚',
  'Dokter Hewan': '👨‍⚕️',
  'Klinik Hewan': '🏥',
};

export const WORKSPACE_STATUS_CONFIG: Record<WorkspaceStatus, { label: string; color: string; bg: string; border: string }> = {
  Aktif: { label: 'Aktif', color: 'var(--color-primary)',  bg: 'var(--color-primary-light)', border: 'var(--color-primary)' },
  Arsip: { label: 'Arsip', color: '#6b7280',                bg: '#f3f4f6',                     border: '#d1d5db'               },
};

export const MEMBER_ROLE_CONFIG: Record<MemberRole, { label: string; color: string; bg: string }> = {
  Owner:  { label: 'Owner',  color: '#b45309', bg: '#fef3c7' },
  Admin:  { label: 'Admin',  color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
  Member: { label: 'Member', color: '#374151', bg: '#f3f4f6' },
};

export const MEMBER_STATUS_CONFIG: Record<MemberStatus, { icon: string; color: string }> = {
  Aktif:    { icon: '●', color: 'var(--color-primary)' },
  Nonaktif: { icon: '○', color: '#9ca3af'               },
};
