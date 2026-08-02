// ─── Master Obat — Level 2: Sub Kategori ─────────────────────────────────────
// Mirrors the Master Pakan Level-1/2 architecture: each Kategori (defined in
// masterObatKategoriData.ts) can contain zero or more Sub Kategori.
// Detail Obat (Level 3) lives in masterObatDetailData.ts.

import { getKategoriObatBySlug, type KategoriObatSlug } from './masterObatKategoriData';
import { getDetailObatBySubKategori } from './masterObatDetailData';
import { logMasterObatEvent } from '../utils/masterObatAuditLog';

export type StatusSubKategoriObat = 'Aktif' | 'Nonaktif';

export interface SubKategoriObat {
  uuid: string;             // internal primary key — never rendered in the UI, never changes
  kategoriUuid: string;     // canonical FK to KategoriObat.uuid — the relation of record
  kategoriSlug: KategoriObatSlug; // denormalized for routing/display only; always kept in sync with kategoriUuid, never the source of truth
  nama: string;
  deskripsi: string;
  jumlahDetailObat: number; // legacy/unused seed value — actual count is always projected live, see withLiveDetailCount()
  status: StatusSubKategoriObat;
}

// Placeholder dataset — only "Antibiotik" has seed sub-categories per SO-002 spec.
// Every other kategori intentionally has zero sub-categories (empty state).
// kategoriUuid below is Antibiotik's uuid from masterObatKategoriData.ts (a1b2c3d4-0001-...).
export const SUB_KATEGORI_OBAT: SubKategoriObat[] = [
  {
    uuid: 'f3a1b2c4-1e2d-4a3b-9c5f-000000000001',
    kategoriUuid: 'a1b2c3d4-0001-4a3b-9c5f-000000000001',
    kategoriSlug: 'antibiotik',
    nama: 'Penicillin',
    deskripsi: 'Golongan antibiotik beta-laktam yang bekerja menghambat sintesis dinding sel bakteri.',
    jumlahDetailObat: 0,
    status: 'Aktif',
  },
  {
    uuid: 'f3a1b2c4-1e2d-4a3b-9c5f-000000000002',
    kategoriUuid: 'a1b2c3d4-0001-4a3b-9c5f-000000000001',
    kategoriSlug: 'antibiotik',
    nama: 'Tetracycline',
    deskripsi: 'Antibiotik spektrum luas yang menghambat sintesis protein bakteri gram positif dan negatif.',
    jumlahDetailObat: 0,
    status: 'Aktif',
  },
  {
    uuid: 'f3a1b2c4-1e2d-4a3b-9c5f-000000000003',
    kategoriUuid: 'a1b2c3d4-0001-4a3b-9c5f-000000000001',
    kategoriSlug: 'antibiotik',
    nama: 'Sulfonamide',
    deskripsi: 'Golongan antibakteri sintetik yang bekerja menghambat sintesis asam folat bakteri.',
    jumlahDetailObat: 0,
    status: 'Aktif',
  },
  {
    uuid: 'f3a1b2c4-1e2d-4a3b-9c5f-000000000004',
    kategoriUuid: 'a1b2c3d4-0001-4a3b-9c5f-000000000001',
    kategoriSlug: 'antibiotik',
    nama: 'Macrolide',
    deskripsi: 'Antibiotik yang menghambat sintesis protein bakteri melalui ikatan pada ribosom 50S.',
    jumlahDetailObat: 0,
    status: 'Aktif',
  },
  {
    uuid: 'f3a1b2c4-1e2d-4a3b-9c5f-000000000005',
    kategoriUuid: 'a1b2c3d4-0001-4a3b-9c5f-000000000001',
    kategoriSlug: 'antibiotik',
    nama: 'Aminoglycoside',
    deskripsi: 'Antibiotik poten untuk infeksi bakteri gram negatif, bekerja menghambat sintesis protein.',
    jumlahDetailObat: 0,
    status: 'Aktif',
  },
];

/**
 * jumlahDetailObat is a read-time projection, not a stored counter — it is
 * always recomputed from the live Detail Obat registry so it can never drift
 * out of sync (e.g. after add/soft-delete/restore of a Detail Obat). The
 * stored field on SUB_KATEGORI_OBAT itself is legacy/unused and kept only so
 * the seed literals don't need reshaping; every read path goes through this.
 */
function withLiveDetailCount(s: SubKategoriObat): SubKategoriObat {
  const jumlahDetailObat = getDetailObatBySubKategori(s.uuid).length;
  return jumlahDetailObat === s.jumlahDetailObat ? s : { ...s, jumlahDetailObat };
}

/** Returns every sub-kategori belonging to a given kategori slug (routing-facing). */
export function getSubKategoriByKategori(slug: string): SubKategoriObat[] {
  return SUB_KATEGORI_OBAT.filter(s => s.kategoriSlug === slug).map(withLiveDetailCount);
}

/** Returns every sub-kategori belonging to a given kategori UUID — the canonical relation, for internal/SSOT consumers. */
export function getSubKategoriByKategoriUuid(kategoriUuid: string): SubKategoriObat[] {
  return SUB_KATEGORI_OBAT.filter(s => s.kategoriUuid === kategoriUuid).map(withLiveDetailCount);
}

export function getSubKategoriByUuid(uuid: string): SubKategoriObat | undefined {
  const found = SUB_KATEGORI_OBAT.find(s => s.uuid === uuid);
  return found ? withLiveDetailCount(found) : undefined;
}

/** Case-insensitive duplicate check within the same Kategori, excluding one UUID (for edit). */
export function isDuplicateSubKategoriNama(kategoriSlug: string, nama: string, excludeUuid?: string): boolean {
  const target = nama.trim().toLowerCase();
  return SUB_KATEGORI_OBAT.some(s =>
    s.uuid !== excludeUuid && s.kategoriSlug === kategoriSlug && s.nama.trim().toLowerCase() === target
  );
}

export interface SubKategoriObatMutationCheck {
  valid: boolean;
  error?: string;
}

/** Sub Kategori tidak boleh dinonaktifkan apabila masih memiliki Detail Obat aktif. */
export function canDeactivateSubKategori(uuid: string): SubKategoriObatMutationCheck {
  const subKategori = SUB_KATEGORI_OBAT.find(s => s.uuid === uuid);
  if (!subKategori) return { valid: false, error: 'Data referensi tidak valid.' };
  const hasActiveChild = getDetailObatBySubKategori(subKategori.uuid).some(d => d.status === 'Aktif');
  if (hasActiveChild) return { valid: false, error: 'Sub Kategori masih memiliki Detail Obat aktif.' };
  return { valid: true };
}

/** Sub Kategori harus memiliki parent Kategori yang benar-benar ada — never create an orphan. */
export function addSubKategoriObat(kategoriSlug: string, input: { nama: string; deskripsi: string }): SubKategoriObat {
  const parentKategori = getKategoriObatBySlug(kategoriSlug);
  if (!parentKategori) {
    throw new Error('Data referensi tidak valid: kategori induk tidak ditemukan.');
  }
  const subKategori: SubKategoriObat = {
    uuid: crypto.randomUUID(),
    kategoriUuid: parentKategori.uuid,
    kategoriSlug: parentKategori.slug,
    nama: input.nama.trim(),
    deskripsi: input.deskripsi.trim(),
    jumlahDetailObat: 0,
    status: 'Aktif',
  };
  SUB_KATEGORI_OBAT.push(subKategori);
  logMasterObatEvent('add', 'subKategori', subKategori.uuid, subKategori.nama);
  return subKategori;
}

export function updateSubKategoriObat(uuid: string, updates: {
  nama?: string; deskripsi?: string; status?: StatusSubKategoriObat;
}): SubKategoriObat | undefined {
  const subKategori = SUB_KATEGORI_OBAT.find(s => s.uuid === uuid);
  if (!subKategori) return undefined;
  if (updates.nama !== undefined) subKategori.nama = updates.nama.trim();
  if (updates.deskripsi !== undefined) subKategori.deskripsi = updates.deskripsi.trim();
  if (updates.status !== undefined) subKategori.status = updates.status;
  logMasterObatEvent('update', 'subKategori', subKategori.uuid, subKategori.nama);
  return subKategori;
}

export interface SubKategoriObatMutationResult {
  ok: boolean;
  error?: string;
}

/**
 * Soft delete — sets status to 'Nonaktif'. UUID and record are never removed.
 * Blocked while the Sub Kategori still has an active Detail Obat.
 */
export function softDeleteSubKategoriObat(uuid: string): SubKategoriObatMutationResult {
  const check = canDeactivateSubKategori(uuid);
  if (!check.valid) return { ok: false, error: check.error };
  updateSubKategoriObat(uuid, { status: 'Nonaktif' });
  logMasterObatEvent('deactivate', 'subKategori', uuid);
  return { ok: true };
}

export function restoreSubKategoriObat(uuid: string): void {
  updateSubKategoriObat(uuid, { status: 'Aktif' });
  logMasterObatEvent('restore', 'subKategori', uuid);
}
