// ─── Marketplace — Status Verifikasi Workspace (MPK-005 → MPK-017) ───────────
// Metadata milik Marketplace sendiri: status verifikasi yang ditampilkan pada
// setiap Card Listing dan Halaman Verifikasi. Ini adalah Status WORKSPACE,
// BUKAN Status Listing — workspaceId mengacu ke WORKSPACES di TopAppBar.tsx,
// tanpa menduplikasi atau mengubah data Workspace apa pun.
//
// MPK-017: menambahkan status Ditangguhkan dan merename Belum Terverifikasi
// → Belum Diverifikasi (lebih netral); Trust Score ada di marketplaceTrustData.ts.
//
// Modul ini TIDAK menyentuh Workspace, Livestock, Master Pakan, Produk
// Komersial, Formula, atau modul lain.

export type StatusVerifikasiWorkspace =
  | 'Belum Diverifikasi'
  | 'Dalam Proses'
  | 'Terverifikasi'
  | 'Ditangguhkan';

export interface VerifikasiWorkspaceBadge {
  status: StatusVerifikasiWorkspace;
  icon: string;
  label: string;
  bg: string;
  color: string;
}

/** workspaceId → Status Verifikasi. workspaceId mengacu ke WORKSPACES (TopAppBar.tsx). */
const VERIFIKASI_PER_WORKSPACE: Record<string, StatusVerifikasiWorkspace> = {
  w1: 'Terverifikasi',
  w2: 'Terverifikasi',
  w3: 'Dalam Proses',
  w4: 'Belum Diverifikasi',
};

const BADGE_MAP: Record<StatusVerifikasiWorkspace, Omit<VerifikasiWorkspaceBadge, 'status'>> = {
  'Belum Diverifikasi': { icon: '⚪', label: 'Belum Diverifikasi', bg: '#f5f5f5', color: '#616161' },
  'Dalam Proses':       { icon: '⏳', label: 'Dalam Proses',       bg: '#fff8e1', color: '#7b5e2a' },
  Terverifikasi:        { icon: '✅', label: 'Terverifikasi',       bg: '#e8f5ee', color: '#1b7a43' },
  Ditangguhkan:         { icon: '🚫', label: 'Ditangguhkan',        bg: '#ffebee', color: '#c62828' },
};

/** Status Verifikasi satu Workspace. Default 'Belum Diverifikasi' jika workspaceId tidak terdaftar. */
export function getStatusVerifikasiWorkspace(workspaceId: string): StatusVerifikasiWorkspace {
  return VERIFIKASI_PER_WORKSPACE[workspaceId] ?? 'Belum Diverifikasi';
}

/** Badge (ikon, label, warna) untuk Status Verifikasi — dipakai pada Card Listing. */
export function getVerifikasiBadge(workspaceId: string): VerifikasiWorkspaceBadge {
  const status = getStatusVerifikasiWorkspace(workspaceId);
  return { status, ...BADGE_MAP[status] };
}

/**
 * Ajukan verifikasi untuk sebuah workspace.
 * Hanya workspace dengan status 'Belum Diverifikasi' yang dapat mengajukan.
 * Status berubah menjadi 'Dalam Proses'.
 * @returns true jika berhasil, false jika tidak memenuhi syarat.
 */
export function submitVerifikasi(workspaceId: string): boolean {
  const current = VERIFIKASI_PER_WORKSPACE[workspaceId] ?? 'Belum Diverifikasi';
  if (current !== 'Belum Diverifikasi') return false;
  VERIFIKASI_PER_WORKSPACE[workspaceId] = 'Dalam Proses';
  return true;
}
