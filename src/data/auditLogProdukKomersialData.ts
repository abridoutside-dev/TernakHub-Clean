// ─── Produk Komersial — Audit Log & Versioning (PK-018) ──────────────────────
// Lapisan pelacakan permanen untuk seluruh perubahan pada Living Database
// Produk Komersial. Berjalan BERDAMPINGAN dengan Riwayat Perubahan yang sudah
// ada (produkKomersialLivingDB.ts — RIWAYAT_PRODUK_KOMERSIAL, dipakai panel
// "Riwayat Perubahan Terbaru"); Audit Log menambahkan tiga hal yang belum ada
// di sana:
//   1) Versioning — setiap perubahan pada satu UUID Produk membuat versi baru
//      yang berurutan (Versi 1 → Versi 2 → Versi 3 → ...), riwayat versi lama
//      tidak pernah dihapus/ditimpa.
//   2) Detail Perubahan — nilai lama, nilai baru, daftar field yang berubah,
//      dan jumlah field berubah (dihitung dari snapshot before/after).
//   3) Jenis Perubahan yang lebih kaya — Create / Update / Archive / Restore /
//      Soft Delete / Status Change (dipetakan otomatis dari jenis perubahan
//      Living Database + transisi nilai status, bukan input manual pemanggil).
//
// File ini BERDIRI SENDIRI (tidak mengimpor entitas Produk Komersial manapun)
// agar tidak perlu mengubah struktur entitas lain. produkKomersialLivingDB.ts
// memanggil recordAuditEntry() dari dalam logRiwayat() sehingga SETIAP
// pemanggilan logRiwayat() yang sudah ada di seluruh modul (Brand, Seri Produk,
// Detail Produk, Dokumen Pendukung, Master Referensi, Knowledge Base, Import,
// Export) otomatis tercatat di Audit Log tanpa perlu API baru yang terpisah.
//
// UUID Produk (produkId = entityId Riwayat) TIDAK PERNAH diubah oleh file ini —
// Audit Log hanya membaca/mencatat, tidak pernah menulis ke entitas manapun.
//
// Tidak ada backend, tidak ada penghapusan permanen data histori — array
// AUDIT_LOG_PRODUK_KOMERSIAL hanya bertambah (append-only) selama sesi berjalan.

// ─── Jenis Perubahan (Audit) ──────────────────────────────────────────────────

/**
 * Jenis perubahan pada Audit Log — lebih kaya dari JenisPerubahan Living
 * Database biasa (Tambah/Ubah/Hapus/Ubah Status) karena membedakan transisi
 * status yang bermakna (Archive vs Restore vs Status Change umum).
 */
export type AuditActionType =
  | 'Create'
  | 'Update'
  | 'Archive'
  | 'Restore'
  | 'Soft Delete'
  | 'Status Change';

export const AUDIT_ACTION_OPTIONS: AuditActionType[] = [
  'Create', 'Update', 'Archive', 'Restore', 'Soft Delete', 'Status Change',
];

/**
 * Jenis perubahan sumber — persis sama dengan `JenisPerubahan` pada
 * produkKomersialLivingDB.ts. Didefinisikan ulang di sini (bukan diimpor)
 * supaya file ini tetap berdiri sendiri tanpa ketergantungan ke modul lain;
 * TypeScript tetap memvalidasi kecocokan struktural di titik pemanggilan.
 */
export type JenisPerubahanSumber = 'Tambah' | 'Ubah' | 'Hapus' | 'Ubah Status';

// ─── Detail Perubahan ─────────────────────────────────────────────────────────

export interface FieldChange {
  field: string;
  nilaiLama: unknown;
  nilaiBaru: unknown;
}

// ─── Entri Audit Log ──────────────────────────────────────────────────────────

export interface AuditLogEntry {
  /** UUID Audit — identitas permanen satu entri audit (bukan UUID produk). */
  auditId: string;
  /** UUID Produk yang diubah — TIDAK PERNAH berubah sepanjang siklus hidup produk. */
  produkId: string;
  /** UUID Brand terkait, bila entitas yang diubah memilikinya — untuk filter "Berdasarkan Brand". */
  brandId?: string;
  /** Modul/entitas Living Database yang diubah, mis. 'Seri Produk', 'Brand', 'Detail Produk'. */
  modul: string;
  /** Jenis perubahan (lihat AuditActionType). */
  jenisPerubahan: AuditActionType;
  /** Waktu perubahan, ISO datetime string. */
  waktu: string;
  /** Admin/pengguna yang melakukan perubahan. */
  pengguna: string;
  /** Label tampilan produk pada saat perubahan (nama produk/brand/dsb). */
  label: string;
  /** Ringkasan perubahan dalam satu kalimat — untuk tampilan Audit Log & bahan AI. */
  ringkasan: string;
  /** Nomor versi — bertambah 1 setiap kali produkId yang sama berubah. */
  versi: number;
  /** Daftar field yang berubah beserta nilai lama & nilai baru. */
  perubahan: FieldChange[];
  /** Jumlah field yang berubah — turunan dari `perubahan.length`, disimpan eksplisit untuk query cepat. */
  jumlahFieldBerubah: number;
}

/** Audit Log — in-memory, APPEND-ONLY (tidak pernah dihapus/ditimpa) selama sesi berjalan. */
export const AUDIT_LOG_PRODUK_KOMERSIAL: AuditLogEntry[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/** Field housekeeping yang selalu berubah / tidak bermakna sebagai "perubahan data" — dikecualikan dari diff. */
const IGNORED_DIFF_FIELDS = new Set(['uuid', 'id', 'updatedAt', 'createdAt']);

/**
 * Bandingkan dua snapshot objek (before/after) dan kembalikan daftar field
 * yang nilainya benar-benar berbeda. Perbandingan berbasis JSON.stringify
 * agar aman untuk field bertipe array/objek (mis. nutrisi, kemasan, komposisi).
 */
export function diffSnapshots(
  before?: Record<string, unknown> | any,
  after?: Record<string, unknown> | any,
): FieldChange[] {
  if (!before && !after) return [];
  const keys = new Set<string>([
    ...(before ? Object.keys(before) : []),
    ...(after ? Object.keys(after) : []),
  ]);
  const changes: FieldChange[] = [];
  for (const key of keys) {
    if (IGNORED_DIFF_FIELDS.has(key)) continue;
    const nilaiLama = before ? before[key] : undefined;
    const nilaiBaru = after ? after[key] : undefined;
    if (JSON.stringify(nilaiLama) !== JSON.stringify(nilaiBaru)) {
      changes.push({ field: key, nilaiLama, nilaiBaru });
    }
  }
  return changes;
}

function statusOf(obj: any): unknown {
  if (!obj) return undefined;
  return (obj as any).status ?? (obj as any).statusProduksi ?? (obj as any).statusAktif;
}

/**
 * Petakan jenis perubahan Living Database (Tambah/Ubah/Hapus/Ubah Status) ke
 * AuditActionType yang lebih kaya. Transisi status ke/dari 'Arsip' dipetakan
 * ke Archive/Restore; perubahan status lain tetap Status Change.
 */
export function mapJenisPerubahan(
  jenis: JenisPerubahanSumber,
  before?: any,
  after?: any,
): AuditActionType {
  if (jenis === 'Tambah') return 'Create';
  if (jenis === 'Hapus') return 'Soft Delete';
  if (jenis === 'Ubah Status') {
    const lama = statusOf(before);
    const baru = statusOf(after);
    if (baru === 'Arsip' && lama !== 'Arsip') return 'Archive';
    if (lama === 'Arsip' && baru !== 'Arsip') return 'Restore';
    return 'Status Change';
  }
  return 'Update';
}

function buildRingkasan(action: AuditActionType, perubahan: FieldChange[], label: string): string {
  if (action === 'Create') return `Data baru dibuat: ${label}.`;
  if (action === 'Soft Delete') return `Data dihapus (soft delete, riwayat tetap tersimpan): ${label}.`;
  if (action === 'Archive') return `${label} diarsipkan.`;
  if (action === 'Restore') return `${label} dipulihkan dari arsip.`;
  if (perubahan.length === 0) return `Tidak ada perubahan nilai terdeteksi pada ${label}.`;
  const daftar = perubahan.map(p => p.field).slice(0, 5).join(', ');
  const sisa = perubahan.length > 5 ? ` (+${perubahan.length - 5} field lainnya)` : '';
  return `${perubahan.length} field berubah pada ${label}: ${daftar}${sisa}.`;
}

function getNextVersion(produkId: string): number {
  return AUDIT_LOG_PRODUK_KOMERSIAL.filter(e => e.produkId === produkId).length + 1;
}

// ─── Menulis Entri Audit (dipanggil dari logRiwayat) ─────────────────────────

export interface RecordAuditParams {
  produkId: string;
  modul: string;
  jenisPerubahan: JenisPerubahanSumber;
  pengguna: string;
  label: string;
  before?: any;
  after?: any;
  brandId?: string;
}

/**
 * Catat satu entri Audit Log + versi baru untuk produkId yang bersangkutan.
 * Dipanggil otomatis dari produkKomersialLivingDB.ts → logRiwayat(), sehingga
 * SELURUH perubahan Living Database Produk Komersial tercatat tanpa perlu
 * API terpisah yang harus dipanggil manual oleh setiap modul entitas.
 */
export function recordAuditEntry(params: RecordAuditParams): AuditLogEntry {
  const jenisPerubahan = mapJenisPerubahan(params.jenisPerubahan, params.before, params.after);
  const perubahan = diffSnapshots(params.before, params.after);
  const entry: AuditLogEntry = {
    auditId: generateUUID(),
    produkId: params.produkId,
    brandId: params.brandId,
    modul: params.modul,
    jenisPerubahan,
    waktu: new Date().toISOString(),
    pengguna: params.pengguna,
    label: params.label,
    ringkasan: buildRingkasan(jenisPerubahan, perubahan, params.label),
    versi: getNextVersion(params.produkId),
    perubahan,
    jumlahFieldBerubah: perubahan.length,
  };
  AUDIT_LOG_PRODUK_KOMERSIAL.push(entry); // append-only; urutan penyisipan = urutan versi menaik
  return entry;
}

// ─── Pencarian & Filter ───────────────────────────────────────────────────────

export interface AuditLogFilter {
  /** UUID Produk — tampilkan hanya riwayat satu produk. */
  produkId?: string;
  /** UUID Brand — tampilkan hanya riwayat produk milik satu brand. */
  brandId?: string;
  /** Nama Admin/pengguna yang melakukan perubahan. */
  pengguna?: string;
  /** Jenis perubahan (Create/Update/Archive/Restore/Soft Delete/Status Change). */
  jenisPerubahan?: AuditActionType;
  /** Tanggal mulai, format 'YYYY-MM-DD' (inklusif). */
  dariTanggal?: string;
  /** Tanggal akhir, format 'YYYY-MM-DD' (inklusif). */
  sampaiTanggal?: string;
}

/** Ambil Audit Log sesuai filter (semua opsional, dapat dikombinasikan), terbaru dulu. */
export function getAuditLog(filter: AuditLogFilter = {}): AuditLogEntry[] {
  let list = AUDIT_LOG_PRODUK_KOMERSIAL;
  if (filter.produkId)       list = list.filter(e => e.produkId === filter.produkId);
  if (filter.brandId)        list = list.filter(e => e.brandId === filter.brandId);
  if (filter.pengguna)       list = list.filter(e => e.pengguna === filter.pengguna);
  if (filter.jenisPerubahan) list = list.filter(e => e.jenisPerubahan === filter.jenisPerubahan);
  if (filter.dariTanggal)    list = list.filter(e => e.waktu.slice(0, 10) >= filter.dariTanggal!);
  if (filter.sampaiTanggal)  list = list.filter(e => e.waktu.slice(0, 10) <= filter.sampaiTanggal!);
  return [...list].sort((a, b) => b.waktu.localeCompare(a.waktu));
}

/** Riwayat versi lengkap satu produk, Versi 1 → Versi terbaru (menaik). */
export function getVersionHistory(produkId: string): AuditLogEntry[] {
  return AUDIT_LOG_PRODUK_KOMERSIAL
    .filter(e => e.produkId === produkId)
    .sort((a, b) => a.versi - b.versi);
}

/** Versi terkini (terbaru) satu produk, atau undefined bila belum pernah tercatat. */
export function getCurrentVersion(produkId: string): AuditLogEntry | undefined {
  const hist = getVersionHistory(produkId);
  return hist[hist.length - 1];
}

export function getAuditLogById(auditId: string): AuditLogEntry | undefined {
  return AUDIT_LOG_PRODUK_KOMERSIAL.find(e => e.auditId === auditId);
}

// ─── Persiapan AI (struktur saja — BELUM diimplementasikan, PK-018) ──────────
// Pada tahap berikutnya, AI dapat memakai getAuditLog()/getVersionHistory()
// sebagai sumber data untuk: (1) menjelaskan riwayat perubahan dalam bahasa
// natural, (2) mengidentifikasi perubahan besar, (3) memberikan ringkasan
// otomatis lintas produk/brand/periode. Dua fungsi di bawah ini HANYA
// menyiapkan output deskriptif sederhana dari data terstruktur yang sudah
// ada — bukan model AI sungguhan.

/** Deskripsi satu baris siap-pakai untuk AI/tampilan — bukan panggilan model AI. */
export function describeChangeForAI(entry: AuditLogEntry): string {
  return `[Versi ${entry.versi}] ${entry.pengguna} melakukan "${entry.jenisPerubahan}" pada ${entry.label} (${entry.modul}) — ${entry.ringkasan}`;
}

/** Heuristik "perubahan besar" — kandidat sinyal bagi AI pada tahap berikutnya. */
export function isPerubahanBesar(entry: AuditLogEntry): boolean {
  return entry.jumlahFieldBerubah >= 4 || entry.jenisPerubahan === 'Archive' || entry.jenisPerubahan === 'Soft Delete';
}
