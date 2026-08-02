// ─── Master Obat — SSOT Service Layer (SO-007) ───────────────────────────────
// Preparation-only facade over the Master Obat reference registries
// (Kategori → Sub Kategori → Detail Obat). This module establishes Master
// Obat as the Single Source of Truth (SSOT) that future modules — Stock
// Obat, Catat Pengobatan, AI Insight, etc. — will read from.
//
// IMPORTANT — this is preparation, not integration:
// - No other module calls this service yet.
// - No existing UI, workflow, or module was changed to introduce this file.
// - The underlying data files (masterObatKategoriData.ts,
//   masterObatSubKategoriData.ts, masterObatDetailData.ts) remain the actual
//   storage and mutation owners; this service only exposes a stable,
//   read-oriented contract on top of them so future consumers never need to
//   touch the underlying structure directly.
//
// Consumer contract: any future module that references a medicine MUST store
// only `masterObatUuid` (the Detail Obat's uuid). Never store or match by
// nama — nama is display-only and can change.

import {
  KATEGORI_OBAT,
  type KategoriObat,
} from '../data/masterObatKategoriData';
import {
  SUB_KATEGORI_OBAT,
  getSubKategoriByKategoriUuid,
  getSubKategoriByUuid,
  type SubKategoriObat,
} from '../data/masterObatSubKategoriData';
import {
  DETAIL_OBAT,
  getDetailObatBySubKategori,
  type DetailObat,
  type StatusObat,
} from '../data/masterObatDetailData';

// ─── SSOT reference shape ─────────────────────────────────────────────────────
// Canonical DTO exposed to future consumers. Field names follow the SO-007
// data-model spec (kategoriUuid / subKategoriUuid / bentukSediaan /
// kandunganAktif / createdAt / updatedAt) even though the underlying storage
// still uses its original field names (bentuk/kandungan) to avoid touching
// the existing CRUD UI. kategoriUuid is resolved via the Sub Kategori's
// kategoriSlug at read time, so it can never drift out of sync with the
// live Kategori registry.
export interface DetailObatRef {
  uuid: string;
  kategoriUuid: string;
  subKategoriUuid: string;
  nama: string;
  bentukSediaan: string;
  kandunganAktif: string;
  status: StatusObat;
  createdAt: string;
  updatedAt: string;
}

function toDetailObatRef(detail: DetailObat): DetailObatRef | undefined {
  const subKategori = getSubKategoriByUuid(detail.subKategoriUuid);
  const kategori = subKategori ? getKategoriByUuid(subKategori.kategoriUuid) : undefined;
  if (!subKategori || !kategori) {
    // Referential integrity is otherwise guaranteed by masterObatValidation.ts
    // and the soft-delete guards in the data layer — this branch should be
    // unreachable, but the SSOT never fabricates a relation it can't resolve.
    return undefined;
  }
  return {
    uuid: detail.uuid,
    kategoriUuid: kategori.uuid,
    subKategoriUuid: detail.subKategoriUuid,
    nama: detail.nama,
    bentukSediaan: detail.bentuk,
    kandunganAktif: detail.kandungan,
    status: detail.status,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
  };
}

// ─── Kategori ─────────────────────────────────────────────────────────────────

/** All Kategori. Pass includeInactive to also return 'Nonaktif' entries. */
export function getAllKategori(includeInactive = false): KategoriObat[] {
  return includeInactive ? [...KATEGORI_OBAT] : KATEGORI_OBAT.filter(k => k.status === 'Aktif');
}

export function getKategoriByUuid(uuid: string): KategoriObat | undefined {
  return KATEGORI_OBAT.find(k => k.uuid === uuid);
}

// ─── Sub Kategori ──────────────────────────────────────────────────────────────

/**
 * Sub Kategori, optionally scoped to a parent Kategori uuid.
 * Pass includeInactive to also return 'Nonaktif' entries.
 */
export function getSubKategori(kategoriUuid?: string, includeInactive = false): SubKategoriObat[] {
  const list = kategoriUuid ? getSubKategoriByKategoriUuid(kategoriUuid) : [...SUB_KATEGORI_OBAT];
  return includeInactive ? list : list.filter(s => s.status === 'Aktif');
}

export { getSubKategoriByUuid };

// ─── Detail Obat ───────────────────────────────────────────────────────────────

export interface GetDetailObatFilters {
  kategoriUuid?: string;
  subKategoriUuid?: string;
  includeInactive?: boolean;
}

/**
 * Detail Obat, optionally filtered by kategoriUuid and/or subKategoriUuid.
 * Excludes 'Nonaktif' records unless includeInactive is set — no consumer
 * should ever see deactivated medicines by default.
 */
export function getDetailObat(filters: GetDetailObatFilters = {}): DetailObatRef[] {
  const { kategoriUuid, subKategoriUuid, includeInactive = false } = filters;

  let source: DetailObat[];
  if (subKategoriUuid) {
    source = getDetailObatBySubKategori(subKategoriUuid);
  } else {
    source = [...DETAIL_OBAT];
  }

  const refs = source
    .map(toDetailObatRef)
    .filter((ref): ref is DetailObatRef => ref !== undefined);

  return refs.filter(ref => {
    if (!includeInactive && ref.status !== 'Aktif') return false;
    if (kategoriUuid && ref.kategoriUuid !== kategoriUuid) return false;
    return true;
  });
}

export function getDetailObatByUuid(uuid: string): DetailObatRef | undefined {
  const detail = DETAIL_OBAT.find(d => d.uuid === uuid);
  return detail ? toDetailObatRef(detail) : undefined;
}

/**
 * Case-insensitive search across nama, bentukSediaan, and kandunganAktif.
 * Excludes 'Nonaktif' records unless includeInactive is set.
 */
export function searchDetailObat(query: string, includeInactive = false): DetailObatRef[] {
  const q = query.trim().toLowerCase();
  const pool = getDetailObat({ includeInactive });
  if (!q) return pool;
  return pool.filter(ref =>
    ref.nama.toLowerCase().includes(q) ||
    ref.bentukSediaan.toLowerCase().includes(q) ||
    ref.kandunganAktif.toLowerCase().includes(q)
  );
}

/** Convenience wrapper — every Detail Obat with status 'Aktif'. This is the default read surface for future consumers (Stock Obat, Catat Pengobatan, AI Insight). */
export function getActiveDetailObat(): DetailObatRef[] {
  return getDetailObat({ includeInactive: false });
}
