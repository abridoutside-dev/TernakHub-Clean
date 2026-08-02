// ─── Global Evidence Data — FOUNDATION-GLOBAL-EVIDENCE-001 ───────────────────
//
// Single Source of Truth untuk seluruh bukti (evidence) di TernakHub.
//
// ARSITEKTUR:
//   Evidence berdiri sendiri dan TIDAK bergantung pada satu modul saja.
//   Setiap entitas dari modul mana pun dapat melampirkan evidence dengan
//   menyimpan evidence_uuid sebagai foreign key.
//
//   Relasi polimorfik dibangun lewat dua field:
//     reference_module  → modul pemilik (e.g. 'transaksi', 'kesehatan_hewan')
//     reference_uuid    → UUID entitas spesifik dalam modul tersebut
//
//   Media (foto/dokumen/file) dihubungkan via:
//     media_uuid → Supabase media repository
//     null = evidence tanpa lampiran file (e.g. keterangan teks saja)
//
// ATURAN UTAMA:
//   • Evidence TIDAK BISA dihapus setelah dicatat — gunakan archiveEvidence().
//   • deleted_at adalah tanda arsip permanen (bukan penghapusan fisik).
//   • Akses selalu melalui globalEvidenceService.ts — bukan GLOBAL_EVIDENCE_DB.
//   • Gunakan metadata untuk data module-specific tambahan tanpa ubah schema.
//
// RELASI DISIAPKAN (belum di-wire):
//   ✓ Supabase media         — media_uuid → media metadata
//   ✓ Livestock              — reference_module: 'livestock'
//   ✓ Marketplace            — reference_module: 'marketplace'
//   ✓ Kesehatan Hewan        — reference_module: 'kesehatan_hewan'
//   ✓ Transaksi              — reference_module: 'transaksi'
//   ✓ Escrow                 — reference_module: 'escrow'
//   ✓ Audit Trail            — evidence_uuid dapat disimpan di AuditTrailRecord
// ─────────────────────────────────────────────────────────────────────────────

import { generateUUID } from '../utils/uuid';

// ─── Evidence Type ────────────────────────────────────────────────────────────
// Tipe fungsional bukti — menentukan konteks penggunaan evidence.
// Untuk menambah tipe baru: tambah ke union DAN EVIDENCE_TYPE_LIST.

export type EvidenceType =
  | 'Foto'
  | 'Dokumen'
  | 'Bukti Transfer'
  | 'Bukti Pembayaran'
  | 'Bukti Pengiriman'
  | 'Bukti Penerimaan'
  | 'Bukti Pemeriksaan'
  | 'Bukti Vaksinasi'
  | 'Bukti Timbang'
  | 'Bukti Kepemilikan';

/** Semua nilai EvidenceType yang valid — gunakan untuk validasi dan form picker. */
export const EVIDENCE_TYPE_LIST: readonly EvidenceType[] = [
  'Foto',
  'Dokumen',
  'Bukti Transfer',
  'Bukti Pembayaran',
  'Bukti Pengiriman',
  'Bukti Penerimaan',
  'Bukti Pemeriksaan',
  'Bukti Vaksinasi',
  'Bukti Timbang',
  'Bukti Kepemilikan',
] as const;

// ─── Evidence Status ──────────────────────────────────────────────────────────
// Siklus hidup verifikasi evidence.
//
//   Pending ──→ Verified   (verifyEvidence)
//   Pending ──→ Rejected   (rejectEvidence)
//   Verified ─→ Archived   (archiveEvidence)
//   Rejected ─→ Archived   (archiveEvidence)
//   Pending ──→ Archived   (archiveEvidence — bypass verifikasi)

export type EvidenceStatus =
  | 'Pending'    // Belum diverifikasi — status awal setelah upload
  | 'Verified'   // Telah diverifikasi oleh pihak berwenang
  | 'Rejected'   // Ditolak — tidak valid atau tidak sesuai
  | 'Archived';  // Diarsipkan — tidak aktif, tetap tersimpan untuk audit

/** Semua nilai EvidenceStatus yang valid. */
export const EVIDENCE_STATUS_LIST: readonly EvidenceStatus[] = [
  'Pending',
  'Verified',
  'Rejected',
  'Archived',
] as const;

// ─── Reference Module ─────────────────────────────────────────────────────────
// Modul pemilik evidence — menentukan konteks reference_uuid.
// Untuk menambah modul baru: tambah ke union DAN EVIDENCE_REFERENCE_MODULES.

export type EvidenceReferenceModule =
  | 'livestock'          // LivestockRecord — src/data/livestockData.ts
  | 'marketplace'        // Listing Marketplace — src/data/marketplaceListingData.ts
  | 'kesehatan_hewan'    // Pemeriksaan/Pengobatan — src/data/pemeriksaanKesehatanData.ts
  | 'transaksi'          // Transaksi Marketplace — src/data/marketplaceTransaksiData.ts
  | 'escrow'             // Escrow Record — src/data/transaksiEscrowData.ts
  | 'audit_trail'        // Audit Trail Record — src/data/transaksiAuditTrailData.ts
  | 'reproduksi'         // Program Reproduksi — src/data/reproduksiProgramData.ts
  | 'batch'              // Batch Ternak — src/data/batchData.ts
  | 'mutasi'             // Mutasi/Transfer — src/data/mutasiData.ts
  | 'stok_pakan'         // Inventaris Stok Pakan — src/data/stokInventarisData.ts
  | 'stok_obat'          // Stok Obat — src/data/stokObatData.ts
  | 'pemberian_pakan'    // Pemberian Pakan — src/data/pemberianPakanData.ts
  | 'produk_komersial';  // Produk Komersial — src/data/produkKomersialData.ts

/** Semua nilai EvidenceReferenceModule yang valid. */
export const EVIDENCE_REFERENCE_MODULES: readonly EvidenceReferenceModule[] = [
  'livestock', 'marketplace', 'kesehatan_hewan', 'transaksi', 'escrow',
  'audit_trail', 'reproduksi', 'batch', 'mutasi', 'stok_pakan',
  'stok_obat', 'pemberian_pakan', 'produk_komersial',
] as const;

// ─── Rejection Record ─────────────────────────────────────────────────────────

export interface EvidenceRejection {
  /** workspaceId atau 'System' yang menolak. */
  rejected_by: string;
  /** Alasan penolakan. */
  reason: string;
  /** ISO 8601 timestamp penolakan. */
  rejected_at: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface EvidenceRecord {
  // ── Identitas ──────────────────────────────────────────────────────────────

  /** UUID v4 — primary key. Immutable setelah ditetapkan. */
  evidence_uuid: string;

  /** Jenis fungsional bukti (Foto, Dokumen, Bukti Transfer, dll.). */
  evidence_type: EvidenceType;

  // ── Relasi Polimorfik ──────────────────────────────────────────────────────

  /** Modul pemilik evidence (e.g. 'transaksi', 'kesehatan_hewan'). */
  reference_module: EvidenceReferenceModule;

  /**
   * UUID entitas spesifik dalam reference_module.
   * e.g. transaksiId, pemeriksaanId, livestockId.
   */
  reference_uuid: string;

  // ── Media ──────────────────────────────────────────────────────────────────

  /**
   * UUID media dari Global Media Service.
   * null = evidence tanpa lampiran file (misalnya: pernyataan tertulis saja).
   * Resolve media_uuid through the Supabase media repository when rendering.
   */
  media_uuid: string | null;

  // ── Konten ─────────────────────────────────────────────────────────────────

  /** Judul singkat evidence (e.g. "Bukti transfer ke Escrow", "Foto kondisi sapi"). */
  title: string;

  /** Deskripsi / keterangan tambahan. null jika tidak diperlukan. */
  description: string | null;

  // ── Status & Verifikasi ────────────────────────────────────────────────────

  /** Status siklus hidup verifikasi evidence. */
  evidence_status: EvidenceStatus;

  /**
   * Waktu bukti diambil/dibuat di sumber asli.
   * Contoh: timestamp foto kamera, waktu tanda tangan digital.
   * Bisa berbeda dari created_at. null jika tidak diketahui.
   */
  captured_at: string | null;

  /** workspaceId atau user ID yang mengupload evidence. */
  uploaded_by: string;

  /**
   * workspaceId yang memverifikasi evidence.
   * null = belum diverifikasi.
   */
  verified_by: string | null;

  /**
   * ISO 8601 timestamp verifikasi.
   * null = belum diverifikasi.
   */
  verified_at: string | null;

  /**
   * Detail penolakan jika evidence_status = 'Rejected'.
   * null = tidak ditolak.
   */
  rejection: EvidenceRejection | null;

  // ── Timestamps ─────────────────────────────────────────────────────────────

  /** ISO 8601 — saat record dibuat di sistem. */
  created_at: string;

  /** ISO 8601 — saat record terakhir diperbarui. */
  updated_at: string;

  /**
   * ISO 8601 — saat evidence diarsipkan (soft-delete).
   * null = masih aktif.
   * Evidence yang sudah diarsipkan TIDAK BISA dipulihkan.
   */
  deleted_at: string | null;

  // ── Metadata Tambahan ──────────────────────────────────────────────────────

  /**
   * Pasangan key-value untuk data module-specific tambahan.
   * Memungkinkan modul menyimpan field khusus tanpa mengubah schema utama.
   *
   * Contoh:
   *   { nominal: 5000000, bank: 'BCA', noRek: '1234567890' }  // Bukti Transfer
   *   { beratKg: 120.5, alat: 'Timbangan Digital X200' }       // Bukti Timbang
   *   { vaksinNama: 'ND-IB', batchNo: 'VK-2026-001' }          // Bukti Vaksinasi
   */
  metadata: Record<string, string | number | boolean | null>;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────
// Keyed by evidence_uuid untuk O(1) lookup.
// INTERNAL — akses hanya melalui globalEvidenceService.ts.
//
// Store sengaja dimulai kosong — evidence dibuat oleh modul saat runtime.
// Ini berbeda dari Reference Service yang memiliki seed statis, karena
// evidence adalah data transaksional yang bersifat runtime.

export const GLOBAL_EVIDENCE_DB: Map<string, EvidenceRecord> = new Map();

// ─── Internal Helpers (package-private) ──────────────────────────────────────
// Prefix _ menandakan fungsi ini hanya untuk digunakan oleh service layer.
// Jangan import langsung dari modul lain.

/** Sisipkan record ke store. Dipanggil hanya oleh createEvidence(). */
export function _insertEvidence(record: EvidenceRecord): void {
  GLOBAL_EVIDENCE_DB.set(record.evidence_uuid, record);
}

/** Baca semua record sebagai array. Digunakan oleh fungsi query di service. */
export function _getAllEvidence(): EvidenceRecord[] {
  return Array.from(GLOBAL_EVIDENCE_DB.values());
}

/** Ganti record yang ada di tempat. Digunakan oleh verify/reject/archive. */
export function _replaceEvidence(record: EvidenceRecord): void {
  GLOBAL_EVIDENCE_DB.set(record.evidence_uuid, record);
}

// ─── UUID Generator (re-export untuk service) ─────────────────────────────────
export { generateUUID };
