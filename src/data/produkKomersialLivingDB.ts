// ─── Produk Komersial — Living Database Engine ───────────────────────────────
// PK-009: Menjadikan Produk Komersial sebagai Living Database yang dapat terus
// berkembang tanpa mengubah source code aplikasi.
//
// File ini adalah fondasi bersama (shared) yang dipakai oleh seluruh entitas
// Produk Komersial (Brand, Seri, Detail Produk, Nutrisi, Komposisi, Kemasan,
// Produsen, Distributor, Dokumen Pendukung):
//   • Status data       — Aktif / Tidak Diproduksi / Arsip
//   • Hak akses         — hanya Admin yang boleh menambah/mengubah/menghapus
//   • Riwayat perubahan — waktu, pengguna, jenis perubahan, catatan
//   • Pencarian lintas entitas
//
// TIDAK mengubah arsitektur aplikasi, TIDAK mengubah Master Pakan, TIDAK
// mengubah modul lain, TIDAK membuat transaksi. Murni lapisan data + admin
// panel khusus Produk Komersial.
//
// Catatan penting: Aplikasi ini adalah prototipe frontend-only tanpa backend
// atau sistem login. "Admin" di sini disimulasikan lewat sebuah mode lokal
// (tersimpan di localStorage) agar hak akses tetap dapat ditegakkan secara
// nyata di UI tanpa menambah arsitektur autentikasi baru. Saat backend/login
// sungguhan tersedia, ganti `isAdminMode()`/`getCurrentUser()` dengan sumber
// sesi pengguna yang sebenarnya — seluruh pemanggil sudah melalui dua fungsi
// ini sehingga penggantian tidak memerlukan perubahan pada file lain.
//
// PK-018: logRiwayat() adalah SATU-SATUNYA titik pencatatan perubahan yang
// dipakai seluruh entitas Produk Komersial. Karena itu, logRiwayat() juga
// otomatis meneruskan setiap perubahan ke Audit Log & Versioning
// (auditLogProdukKomersialData.ts) — lihat recordAuditEntry() di bawah.
// Pemanggil boleh (opsional) menyertakan snapshot `before`/`after` agar Audit
// Log dapat menghitung detail perubahan (field yang berubah, nilai lama/baru).

// ─── Status Data (berlaku untuk seluruh entitas Living Database) ─────────────

/**
 * Status entitas Living Database Produk Komersial.
 * - 'Draft'           : produk baru, belum dipublikasikan; hanya terlihat Admin.
 * - 'Aktif'           : produk aktif diproduksi dan dapat direkomendasikan.
 * - 'Tidak Diproduksi': produk tidak lagi diproduksi tetapi data tetap tersedia.
 * - 'Arsip'           : soft-deleted — tersembunyi dari pengguna, tetap di database.
 */
import { recordAuditEntry } from './auditLogProdukKomersialData';
import { isAuthBridgeAdmin, getAuthBridgeUserDisplay } from '../lib/authBridge';

export type StatusEntitas = 'Draft' | 'Aktif' | 'Tidak Diproduksi' | 'Arsip';

export const STATUS_ENTITAS_OPTIONS: StatusEntitas[] = ['Draft', 'Aktif', 'Tidak Diproduksi', 'Arsip'];

/** Data berstatus Arsip tetap dianggap "ada" untuk riwayat & referensi — jangan pernah difilter habis dari data, hanya disembunyikan dari daftar pilihan aktif bila diperlukan. */
export function isArsip(status: StatusEntitas | undefined): boolean {
  return status === 'Arsip';
}

// ─── Hak Akses (Admin vs Pengguna Umum) ──────────────────────────────────────

const ADMIN_MODE_KEY = 'ternakhub_pk_admin_mode';
const ADMIN_USER_NAME = 'Admin Produk Komersial';

/**
 * Apakah sesi saat ini berjalan sebagai Admin Produk Komersial.
 *
 * P0-002B: production identity comes from real auth (AuthBridge).
 * In development, localStorage bypass is still available for testing.
 */
export function isAdminMode(): boolean {
  // Real auth always wins — if the signed-in user is a platform admin, grant access.
  if (isAuthBridgeAdmin()) return true;
  // DEV-only: allow localStorage bypass so engineers can test admin flows locally.
  if (import.meta.env.DEV) {
    try {
      return localStorage.getItem(ADMIN_MODE_KEY) === '1';
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Aktif/nonaktifkan mode Admin untuk sesi lokal ini.
 *
 * P0-002B: no-op in production — localStorage cannot grant admin access at runtime.
 * Only functional in development builds for local testing.
 */
export function setAdminMode(active: boolean): void {
  if (!import.meta.env.DEV) return; // production: real auth only, localStorage has no effect
  try {
    if (active) localStorage.setItem(ADMIN_MODE_KEY, '1');
    else localStorage.removeItem(ADMIN_MODE_KEY);
  } catch {
    // localStorage tidak tersedia (mis. mode privat) — abaikan.
  }
}

/** Nama pengguna yang tercatat pada riwayat perubahan. */
export function getCurrentUser(): string {
  if (!isAdminMode()) return 'Pengguna';
  const display = getAuthBridgeUserDisplay();
  return display !== 'Pengguna' ? display : ADMIN_USER_NAME;
}

/**
 * Wajib dipanggil di awal setiap fungsi tambah/ubah/hapus pada seluruh
 * entitas Produk Komersial. Melempar error bila dipanggil bukan oleh Admin —
 * ini adalah satu-satunya gerbang penegakan hak akses tulis pada modul ini.
 */
export function assertAdmin(aksi: string): void {
  if (!isAdminMode()) {
    throw new Error(`Akses ditolak: hanya Admin yang dapat ${aksi}. Aktifkan Mode Admin terlebih dahulu.`);
  }
}

// ─── Riwayat Perubahan ────────────────────────────────────────────────────────

export type JenisPerubahan = 'Tambah' | 'Ubah' | 'Hapus' | 'Ubah Status';

export type EntitasRiwayat =
  | 'Brand'
  | 'Seri Produk'
  | 'Detail Produk'
  | 'Nutrisi'
  | 'Komposisi'
  | 'Kemasan'
  | 'Produsen'
  | 'Distributor'
  | 'Dokumen Pendukung'
  | 'Master Referensi'
  | 'Import Produk Komersial'
  | 'Export Produk Komersial';

export interface RiwayatPerubahan {
  /** UUID entri riwayat — bukan UUID entitas yang diubah. */
  id: string;
  /** Jenis entitas yang diubah. */
  entityType: EntitasRiwayat;
  /** UUID entitas yang diubah (tetap sama meski data lain berubah). */
  entityId: string;
  /** Nama/label entitas pada saat perubahan terjadi — untuk tampilan riwayat. */
  entityLabel: string;
  /** Waktu perubahan, ISO datetime string. */
  waktu: string;
  /** Pengguna yang melakukan perubahan. */
  pengguna: string;
  /** Jenis perubahan. */
  jenisPerubahan: JenisPerubahan;
  /** Catatan perubahan — opsional, diisi Admin. */
  catatan?: string;
}

// In-memory Living Database riwayat — bertambah selama sesi berjalan.
export const RIWAYAT_PRODUK_KOMERSIAL: RiwayatPerubahan[] = [];

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback sederhana bila crypto.randomUUID tidak tersedia di lingkungan runtime.
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Catat satu entri riwayat perubahan. Waktu & pengguna diisi otomatis dari
 * sesi berjalan (tidak boleh dipalsukan oleh pemanggil).
 */
export function logRiwayat(entry: {
  entityType: EntitasRiwayat;
  entityId: string;
  entityLabel: string;
  jenisPerubahan: JenisPerubahan;
  catatan?: string;
  /** Snapshot data sebelum perubahan — opsional, dipakai Audit Log (PK-018) untuk menghitung detail perubahan. */
  before?: any;
  /** Snapshot data sesudah perubahan — opsional, dipakai Audit Log (PK-018) untuk menghitung detail perubahan. */
  after?: any;
  /** UUID brand terkait (bila entitas memilikinya) — dipakai filter "Berdasarkan Brand" pada Audit Log. */
  brandId?: string;
}): RiwayatPerubahan {
  const pengguna = getCurrentUser();
  const record: RiwayatPerubahan = {
    id: generateUUID(),
    entityType: entry.entityType,
    entityId: entry.entityId,
    entityLabel: entry.entityLabel,
    waktu: new Date().toISOString(),
    pengguna,
    jenisPerubahan: entry.jenisPerubahan,
    catatan: entry.catatan?.trim() || undefined,
  };
  RIWAYAT_PRODUK_KOMERSIAL.unshift(record); // terbaru di atas

  // PK-018: setiap perubahan otomatis membuat entri Audit Log + versi baru.
  recordAuditEntry({
    produkId: entry.entityId,
    modul: entry.entityType,
    jenisPerubahan: entry.jenisPerubahan,
    pengguna,
    label: entry.entityLabel,
    before: entry.before,
    after: entry.after,
    brandId: entry.brandId,
  });

  return record;
}

/** Riwayat satu entitas tertentu (UUID-nya tidak pernah berubah), terbaru dulu. */
export function getRiwayatByEntity(entityId: string): RiwayatPerubahan[] {
  return RIWAYAT_PRODUK_KOMERSIAL.filter(r => r.entityId === entityId);
}

/** Seluruh riwayat, opsional difilter per jenis entitas, terbaru dulu. */
export function getAllRiwayat(entityType?: EntitasRiwayat): RiwayatPerubahan[] {
  return entityType
    ? RIWAYAT_PRODUK_KOMERSIAL.filter(r => r.entityType === entityType)
    : RIWAYAT_PRODUK_KOMERSIAL;
}
