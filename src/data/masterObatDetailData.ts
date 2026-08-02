// ─── Master Obat — Level 3: Detail Obat ──────────────────────────────────────
// Reference data for individual medicines within a Sub Kategori. This is the
// primary reference source intended for future use by Stock Obat, Catat
// Pengobatan, and AI Insight — but none of those integrations exist yet.

import { logMasterObatEvent } from '../utils/masterObatAuditLog';

export type StatusObat = 'Aktif' | 'Nonaktif';
const VALID_STATUS_OBAT = new Set<StatusObat>(['Aktif', 'Nonaktif']);

export interface DetailObat {
  uuid: string;           // internal primary key — never rendered in the UI, never changes
  subKategoriUuid: string; // FK to SubKategoriObat.uuid
  nama: string;
  bentuk: string;
  kandungan: string;
  status: StatusObat;
  createdAt: string;      // ISO 8601 — set once at creation, never changes
  updatedAt: string;      // ISO 8601 — bumped on every mutation
}

// Placeholder dataset — only "Penicillin" sub-kategori has seed data.
export const DETAIL_OBAT: DetailObat[] = [
  {
    uuid: 'd0e1f2a3-3c4d-4a3b-9c5f-000000000001',
    subKategoriUuid: 'f3a1b2c4-1e2d-4a3b-9c5f-000000000001',
    nama: 'Procaine Penicillin G',
    bentuk: 'Injeksi',
    kandungan: 'Procaine Penicillin G',
    status: 'Aktif',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    uuid: 'd0e1f2a3-3c4d-4a3b-9c5f-000000000002',
    subKategoriUuid: 'f3a1b2c4-1e2d-4a3b-9c5f-000000000001',
    nama: 'Benzathine Penicillin',
    bentuk: 'Injeksi',
    kandungan: 'Benzathine Penicillin',
    status: 'Aktif',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    uuid: 'd0e1f2a3-3c4d-4a3b-9c5f-000000000003',
    subKategoriUuid: 'f3a1b2c4-1e2d-4a3b-9c5f-000000000001',
    nama: 'Penicillin G Sodium',
    bentuk: 'Serbuk Injeksi',
    kandungan: 'Penicillin G Sodium',
    status: 'Aktif',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

/** Returns every Detail Obat belonging to a given Sub Kategori UUID. */
export function getDetailObatBySubKategori(subKategoriUuid: string): DetailObat[] {
  return DETAIL_OBAT.filter(d => d.subKategoriUuid === subKategoriUuid);
}

/** Case-insensitive duplicate check within the same Sub Kategori, excluding one UUID (for edit). */
export function isDuplicateDetailObatNama(subKategoriUuid: string, nama: string, excludeUuid?: string): boolean {
  const target = nama.trim().toLowerCase();
  return DETAIL_OBAT.some(d =>
    d.uuid !== excludeUuid && d.subKategoriUuid === subKategoriUuid && d.nama.trim().toLowerCase() === target
  );
}

/**
 * Detail Obat harus memiliki parent Sub Kategori. Note: the parent's
 * *existence* is validated by the caller (masterObatValidation.ts / the form
 * sheets) rather than here, to avoid a circular import between this module
 * and masterObatSubKategoriData.ts (which itself reads Detail Obat to guard
 * its own soft-delete). subKategoriUuid is still required and non-empty.
 */
export function addDetailObat(subKategoriUuid: string, input: { nama: string; bentuk: string; kandungan: string }): DetailObat {
  if (!subKategoriUuid) {
    throw new Error('Data referensi tidak valid: sub kategori induk tidak ditemukan.');
  }
  const now = new Date().toISOString();
  const detail: DetailObat = {
    uuid: crypto.randomUUID(),
    subKategoriUuid,
    nama: input.nama.trim(),
    bentuk: input.bentuk.trim(),
    kandungan: input.kandungan.trim(),
    status: 'Aktif',
    createdAt: now,
    updatedAt: now,
  };
  DETAIL_OBAT.push(detail);
  logMasterObatEvent('add', 'detailObat', detail.uuid, detail.nama);
  return detail;
}

export function updateDetailObat(uuid: string, updates: {
  nama?: string; bentuk?: string; kandungan?: string; status?: StatusObat;
}): DetailObat | undefined {
  const detail = DETAIL_OBAT.find(d => d.uuid === uuid);
  if (!detail) return undefined;
  if (updates.nama !== undefined) detail.nama = updates.nama.trim();
  if (updates.bentuk !== undefined) detail.bentuk = updates.bentuk.trim();
  if (updates.kandungan !== undefined) detail.kandungan = updates.kandungan.trim();
  if (updates.status !== undefined) {
    if (!VALID_STATUS_OBAT.has(updates.status)) {
      throw new Error('Status tidak valid.');
    }
    detail.status = updates.status;
  }
  detail.updatedAt = new Date().toISOString();
  logMasterObatEvent('update', 'detailObat', detail.uuid, detail.nama);
  return detail;
}

export interface DetailObatMutationCheck {
  valid: boolean;
  error?: string;
}

/**
 * Detail Obat tidak boleh dinonaktifkan apabila masih digunakan oleh Modul
 * Stock Obat. That integration is not active yet (next roadmap item), so
 * this always allows deactivation today — the check point exists now so the
 * real usage lookup can be wired in later without touching call sites.
 */
export function canDeactivateDetailObat(uuid: string): DetailObatMutationCheck {
  const detail = DETAIL_OBAT.find(d => d.uuid === uuid);
  if (!detail) return { valid: false, error: 'Data referensi tidak valid.' };
  return { valid: true };
}

export interface DetailObatMutationResult {
  ok: boolean;
  error?: string;
}

/** Soft delete — sets status to 'Nonaktif'. UUID and record are never removed. */
export function softDeleteDetailObat(uuid: string): DetailObatMutationResult {
  const check = canDeactivateDetailObat(uuid);
  if (!check.valid) return { ok: false, error: check.error };
  updateDetailObat(uuid, { status: 'Nonaktif' });
  logMasterObatEvent('deactivate', 'detailObat', uuid);
  return { ok: true };
}

export function restoreDetailObat(uuid: string): void {
  updateDetailObat(uuid, { status: 'Aktif' });
  logMasterObatEvent('restore', 'detailObat', uuid);
}
