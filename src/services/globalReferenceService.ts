// ─── Global Reference Service — FOUNDATION-GLOBAL-REFERENCE-001 ──────────────
//
// Satu-satunya entry point yang boleh digunakan modul lain untuk membaca
// atau mengelola data referensi TernakHub.
//
// PRINSIP:
//   1. Modul TIDAK boleh membuat enum, union type, atau daftar referensi sendiri
//      untuk hal-hal yang sudah tersedia di sini.
//   2. Akses baca: gunakan getReference / getReferenceByType / getReferenceByUuid.
//   3. Akses hirarkis: gunakan getReferenceChildren(parentUuid).
//   4. Pencarian teks bebas: gunakan searchReference(query, type?).
//   5. Penambahan data baru (runtime): gunakan registerReference() — hanya admin.
//   6. Pembaruan data: gunakan updateReference(uuid, patch).
//   7. Nonaktifkan (soft-delete): gunakan disableReference(uuid).
//
// SIAP DIGUNAKAN OLEH:
//   ✓ Livestock          — SPECIES, BREED, PROGRAM_TERNAK, STATUS_KESEHATAN
//   ✓ Kesehatan Hewan    — STATUS_KESEHATAN, PENYAKIT, GEJALA, TINDAKAN, KATEGORI_OBAT
//   ✓ Master Pakan       — JENIS_PAKAN, KATEGORI_PAKAN, SUBKATEGORI_PAKAN
//   ✓ Stok Obat          — JENIS_OBAT, KATEGORI_OBAT
//   ✓ Produk Komersial   — PRODUK_KOMERSIAL, KATEGORI_PAKAN
//   ✓ Marketplace        — MARKETPLACE_CATEGORY, MARKETPLACE_STATUS
//   ✓ Transaksi/Escrow   — ESCROW_STATUS, TRANSACTION_STATUS
//   ✓ Notifikasi         — NOTIFICATION_TYPE, AI_INSIGHT_TYPE
//   ✓ Workspace/Profile  — WORKSPACE, BUSINESS_TYPE
//   ✓ Transport          — TRANSPORT_TYPE
//   ✓ Satuan & Mata Uang — SATUAN_BERAT, SATUAN_VOLUME, SATUAN_PANJANG, MATA_UANG
//   ✓ Lokasi             — LOKASI_REFERENSI
// ─────────────────────────────────────────────────────────────────────────────

import {
  type ReferenceRecord,
  type ReferenceType,
  _getAllReferences,
  _insertReference,
  _replaceReference,
  GLOBAL_REFERENCE_DB,
} from '../data/globalReferenceData';
import { generateUUID } from '../utils/uuid';

// Re-export types agar consumer tidak perlu import dari data layer langsung.
export type { ReferenceRecord, ReferenceType };
export { REFERENCE_TYPES } from '../data/globalReferenceData';

// ─── Public Filter & Input Types ──────────────────────────────────────────────

export interface GetReferenceFilters {
  /** Filter berdasarkan reference_type. */
  type?: ReferenceType;
  /** Filter berdasarkan reference_category. */
  category?: string;
  /**
   * Jika false, sertakan record yang sudah dinonaktifkan.
   * Default: true (hanya record aktif).
   */
  activeOnly?: boolean;
  /** Filter berdasarkan parent_reference_uuid. null = cari root records. */
  parentUuid?: string | null;
}

export interface RegisterReferenceInput {
  reference_type: ReferenceType;
  reference_code: string;
  reference_name: string;
  reference_category?: string;
  parent_reference_uuid?: string;
  description?: string;
  /** Default: 99 */
  sort_order?: number;
}

export type UpdateReferencePatch = Partial<
  Pick<
    ReferenceRecord,
    | 'reference_code'
    | 'reference_name'
    | 'reference_category'
    | 'parent_reference_uuid'
    | 'description'
    | 'sort_order'
    | 'is_active'
  >
>;

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Mengembalikan semua reference record yang sesuai dengan filter.
 * Default: hanya record aktif (is_active = true).
 * Hasil diurutkan berdasarkan sort_order asc, kemudian reference_name (locale id-ID).
 *
 * @example
 * // Semua species aktif
 * getReference({ type: 'SPECIES' })
 *
 * // Semua breed aktif dalam kategori 'Domba'
 * getReference({ type: 'BREED', category: 'Domba' })
 *
 * // Termasuk yang nonaktif
 * getReference({ type: 'KATEGORI_PAKAN', activeOnly: false })
 */
export function getReference(filters: GetReferenceFilters = {}): ReferenceRecord[] {
  const { type, category, activeOnly = true, parentUuid } = filters;
  let records = _getAllReferences();

  if (activeOnly) {
    records = records.filter((r) => r.is_active);
  }
  if (type !== undefined) {
    records = records.filter((r) => r.reference_type === type);
  }
  if (category !== undefined) {
    records = records.filter((r) => r.reference_category === category);
  }
  if (parentUuid !== undefined) {
    records = records.filter((r) => r.parent_reference_uuid === parentUuid);
  }

  return _sortRecords(records);
}

/**
 * Mencari satu reference record berdasarkan UUID-nya.
 * Mengembalikan undefined jika tidak ditemukan (termasuk yang nonaktif bisa dikembalikan).
 *
 * @example
 * const species = getReferenceByUuid('e2000001-0000-4000-a000-000000000001');
 * console.log(species?.reference_name); // 'Domba'
 */
export function getReferenceByUuid(uuid: string): ReferenceRecord | undefined {
  return GLOBAL_REFERENCE_DB.get(uuid);
}

/**
 * Mengembalikan semua reference record aktif dari type tertentu, diurutkan.
 * Setara dengan getReference({ type, activeOnly: true }).
 *
 * @example
 * const species = getReferenceByType('SPECIES');
 * // → [Domba, Kambing, Sapi, Kerbau, Kuda, Babi]
 */
export function getReferenceByType(type: ReferenceType): ReferenceRecord[] {
  return getReference({ type, activeOnly: true });
}

/**
 * Mengembalikan semua record aktif yang merupakan anak dari parentUuid.
 * Berguna untuk referensi hirarkis (contoh: Breed → Species, Provinsi → Pulau).
 *
 * @example
 * // Semua breed Domba
 * const dombaBreds = getReferenceChildren('e2000001-0000-4000-a000-000000000001');
 *
 * // Semua provinsi di Jawa
 * const provJawa = getReferenceChildren('fb000001-0000-4000-a000-000000000001');
 */
export function getReferenceChildren(parentUuid: string): ReferenceRecord[] {
  return getReference({ parentUuid, activeOnly: true });
}

/**
 * Pencarian teks bebas pada reference_name, reference_code, dan description.
 * Secara opsional dibatasi pada reference_type tertentu.
 * Hanya mencari record aktif.
 * Hasil diurutkan berdasarkan relevansi (kecocokan awal nama lebih tinggi),
 * kemudian sort_order.
 *
 * @example
 * // Cari 'domba' di semua type
 * searchReference('domba')
 *
 * // Cari 'antib' hanya di KATEGORI_OBAT
 * searchReference('antib', 'KATEGORI_OBAT')
 */
export function searchReference(query: string, type?: ReferenceType): ReferenceRecord[] {
  const q = query.trim().toLowerCase();

  // Query kosong → kembalikan semua (dengan filter type jika ada)
  if (!q) return type ? getReferenceByType(type) : getReference();

  let records = _getAllReferences().filter((r) => r.is_active);
  if (type !== undefined) {
    records = records.filter((r) => r.reference_type === type);
  }

  const matched = records.filter((r) => {
    const nameMatch = r.reference_name.toLowerCase().includes(q);
    const codeMatch = r.reference_code.toLowerCase().includes(q);
    const descMatch = r.description?.toLowerCase().includes(q) ?? false;
    return nameMatch || codeMatch || descMatch;
  });

  return matched.sort((a, b) => {
    // Prioritaskan: nama dimulai dengan query
    const aStarts = a.reference_name.toLowerCase().startsWith(q) ? 0 : 1;
    const bStarts = b.reference_name.toLowerCase().startsWith(q) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;

    // Lalu sort_order
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;

    // Lalu alfabet (locale id-ID)
    return a.reference_name.localeCompare(b.reference_name, 'id-ID');
  });
}

/**
 * Mendaftarkan reference record baru ke dalam store.
 * Mengembalikan record yang baru dibuat.
 *
 * GUARD: Melempar Error jika reference_code sudah ada dalam type yang sama.
 *
 * @example
 * const newSpecies = registerReference({
 *   reference_type: 'SPECIES',
 *   reference_code: 'AYM',
 *   reference_name: 'Ayam',
 *   reference_category: 'Unggas',
 *   description: 'Gallus gallus domesticus.',
 *   sort_order: 10,
 * });
 */
export function registerReference(input: RegisterReferenceInput): ReferenceRecord {
  // Guard: duplikat reference_code dalam type yang sama
  const duplicate = _getAllReferences().find(
    (r) =>
      r.reference_type === input.reference_type &&
      r.reference_code === input.reference_code,
  );
  if (duplicate) {
    throw new Error(
      `[GlobalReferenceService] Duplicate reference_code "${input.reference_code}" ` +
        `sudah ada dalam type "${input.reference_type}" ` +
        `(uuid: ${duplicate.reference_uuid}).`,
    );
  }

  const now = new Date().toISOString();
  const record: ReferenceRecord = {
    reference_uuid:        generateUUID(),
    reference_type:        input.reference_type,
    reference_category:    input.reference_category ?? null,
    reference_code:        input.reference_code,
    reference_name:        input.reference_name,
    parent_reference_uuid: input.parent_reference_uuid ?? null,
    description:           input.description ?? null,
    sort_order:            input.sort_order ?? 99,
    is_active:             true,
    created_at:            now,
    updated_at:            now,
  };

  _insertReference(record);
  return record;
}

/**
 * Memperbarui field-field yang dapat diubah dari sebuah reference record.
 * Mengembalikan record yang sudah diperbarui.
 * Melempar Error jika UUID tidak ditemukan.
 *
 * Field immutable (reference_uuid, reference_type, created_at) tidak dapat diubah.
 *
 * @example
 * updateReference('e2000001-0000-4000-a000-000000000001', {
 *   description: 'Deskripsi baru untuk Domba.',
 * });
 */
export function updateReference(uuid: string, patch: UpdateReferencePatch): ReferenceRecord {
  const existing = GLOBAL_REFERENCE_DB.get(uuid);
  if (!existing) {
    throw new Error(
      `[GlobalReferenceService] Reference tidak ditemukan: "${uuid}".`,
    );
  }

  const updated: ReferenceRecord = {
    ...existing,
    ...patch,
    // Field immutable — tidak boleh diubah lewat patch
    reference_uuid: existing.reference_uuid,
    reference_type: existing.reference_type,
    created_at:     existing.created_at,
    updated_at:     new Date().toISOString(),
  };

  _replaceReference(updated);
  return updated;
}

/**
 * Menonaktifkan (soft-delete) sebuah reference record dengan menetapkan
 * is_active = false. Record tetap tersimpan dan masih bisa diakses via
 * getReferenceByUuid() atau getReference({ activeOnly: false }).
 *
 * Operasi ini bersifat idempotent — memanggil ulang pada record yang sudah
 * nonaktif tidak mengubah apa pun.
 *
 * Melempar Error jika UUID tidak ditemukan.
 *
 * @example
 * disableReference('e2000001-0000-4000-a000-000000000006'); // Nonaktifkan Babi
 */
export function disableReference(uuid: string): ReferenceRecord {
  const existing = GLOBAL_REFERENCE_DB.get(uuid);
  if (!existing) {
    throw new Error(
      `[GlobalReferenceService] Reference tidak ditemukan: "${uuid}".`,
    );
  }

  // Idempotent
  if (!existing.is_active) return existing;

  const updated: ReferenceRecord = {
    ...existing,
    is_active:  false,
    updated_at: new Date().toISOString(),
  };

  _replaceReference(updated);
  return updated;
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

function _sortRecords(records: ReferenceRecord[]): ReferenceRecord[] {
  return records.sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.reference_name.localeCompare(b.reference_name, 'id-ID');
  });
}
