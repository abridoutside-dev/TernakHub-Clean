// ─────────────────────────────────────────────────────────────────────────────
// DB-002 — Dashboard Quick Action
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Quick Action adalah SHORTCUT ke modul lain — bukan tempat proses bisnis.
// Quick Action tidak memiliki logic sendiri: hanya membuka Route / Modal /
// Bottom Sheet milik modul asal. Aksi tambah/catat/simpan tetap dieksekusi
// di dalam modul asal, tidak di dalam Dashboard.
//
// Struktur ini bersifat Workspace-aware: setiap WorkspaceJenis (lihat
// TopAppBar.tsx) dapat memiliki daftar Quick Action berbeda. Saat ini hanya
// Workspace 'Peternakan' (Farm) yang diisi — Workspace lain disiapkan agar
// mudah dikembangkan tanpa mengubah struktur.
// ─────────────────────────────────────────────────────────────────────────────

import type { WorkspaceJenis } from '../components/TopAppBar';

// ─── Action Type ────────────────────────────────────────────────────────────
// Quick Action minimal mendukung 3 jenis aksi. Belum perlu Action eksternal.
export type QuickActionType = 'route' | 'modal' | 'bottom-sheet';

// ─── Badge ───────────────────────────────────────────────────────────────────
export type QuickActionBadge = 'new' | 'coming-soon' | 'beta';

export interface QuickActionItem {
  id: string;
  label: string;
  icon: string;

  // Aksi — Quick Action hanya menavigasi/membuka, tidak mengeksekusi logic.
  actionType: QuickActionType;
  to?: string;          // wajib jika actionType === 'route'
  modalId?: string;     // wajib jika actionType === 'modal' (belum diimplementasikan)
  sheetId?: string;     // wajib jika actionType === 'bottom-sheet' (belum diimplementasikan)

  badge?: QuickActionBadge;

  // ── Customization structure (disiapkan, belum ada UI edit) ───────────────
  pinned?: boolean;   // selalu tampil di posisi paling depan
  hidden?: boolean;   // disembunyikan dari grid (tidak dihapus dari data)
  favorite?: boolean; // ditandai favorit oleh pengguna (belum ada UI toggle)
}

interface WorkspaceQuickActionConfig {
  workspaceType: WorkspaceJenis;
  actions: QuickActionItem[];
}

// ─── Default Quick Action — Workspace Peternakan (Farm) ─────────────────────
// 4 entry point utama yang disepakati pada arsitektur proyek.
// "Tambah Ternak" pinned (prioritas pertama).
const FARM_QUICK_ACTIONS: QuickActionItem[] = [
  { id: 'qa-tambah-ternak',    label: 'Tambah Ternak',    icon: '➕', actionType: 'route', to: '/livestock/add',  pinned: true },
  { id: 'qa-tambah-stok-pakan', label: 'Tambah Stok Pakan', icon: '🌾', actionType: 'route', to: '/stok-pakan/tambah' },
  { id: 'qa-tambah-stok-obat',  label: 'Tambah Stok Obat',  icon: '💊', actionType: 'route', to: '/stok-obat/tambah' },
  { id: 'qa-marketplace',       label: 'Marketplace',       icon: '🛒', actionType: 'route', to: '/marketplace' },
];

// ─── Registry — satu entri per WorkspaceJenis ────────────────────────────────
// Workspace lain (Toko Pakan, Toko Obat, Transporter, Dokter Hewan, Klinik
// Hewan) belum memiliki Quick Action sendiri pada fase ini — cukup tambahkan
// entri baru di sini saat modul terkait siap, tanpa mengubah komponen render.
const QUICK_ACTION_REGISTRY: WorkspaceQuickActionConfig[] = [
  { workspaceType: 'Peternakan', actions: FARM_QUICK_ACTIONS },
];

/**
 * Mengambil daftar Quick Action untuk sebuah Workspace, sudah difilter dari
 * item yang disembunyikan (hidden) dan diurutkan: pinned dahulu, lalu urutan
 * asli. Mengembalikan array kosong jika Workspace belum memiliki Quick Action
 * terdaftar (Empty State ditampilkan oleh komponen pemanggil).
 */
export function getQuickActionsForWorkspace(workspaceType: WorkspaceJenis): QuickActionItem[] {
  const config = QUICK_ACTION_REGISTRY.find((c) => c.workspaceType === workspaceType);
  const actions = config ? config.actions : [];

  return actions
    .filter((a) => !a.hidden)
    .slice()
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
}
