/**
 * riwayatKesehatanData.ts
 * ─────────────────────────────────────────────────────────────────
 * Audit trail for all health-treatment events (KH-006).
 *
 * Every successful Integrasi Pengobatan produces one RiwayatKesehatanRecord
 * per PengobatanItem. These records are IMMUTABLE once written — only
 * addRiwayatKesehatan() may create them.
 *
 * Cross-module links:
 *   riwayatObatUuid      → RiwayatObatRecord.uuid    (riwayatObatData.ts)
 *   stokObatUuid         → StokObatItem.uuid          (stokObatData.ts)
 *   produkKomersialUuid  → ObatProdukKomersial.uuid   (produkKomersialObatData.ts)
 *   masterObatUuid       → ObatItem.uuid               (obatData.ts)
 *   pemeriksaanId        → PemeriksaanRecord.id        (pemeriksaanKesehatanData.ts)
 *   diagnosaId           → DiagnosaRecord.id            (diagnosaKesehatanData.ts)
 *   tindakanSesiId       → TindakanSesi.id              (tindakanKesehatanData.ts)
 *   pengobatanSesiId     → PengobatanSesi.id            (pengobatanKesehatanData.ts)
 *   pengobatanItemId     → PengobatanItem.id            (pengobatanKesehatanData.ts)
 */

import { generateUUID } from '../utils/uuid';
import { getActiveBatchMemberships } from './batchData';

// ─── Record Type ──────────────────────────────────────────────────────────────

export interface RiwayatKesehatanRecord {
  /** UUID v4 — identitas permanen record ini. */
  uuid: string;
  /** ISO datetime — waktu integrasi dieksekusi. */
  timestamp: string;

  // ── Workflow chain ────────────────────────────────────────────────────────────
  pemeriksaanId:    string;
  diagnosaId:       string | null;
  tindakanSesiId:   string;
  pengobatanSesiId: string;
  pengobatanItemId: string;

  // ── Cross-module links ────────────────────────────────────────────────────────
  /** Links to RiwayatObatRecord.uuid created atomically in the same integration. */
  riwayatObatUuid:     string;
  stokObatUuid:        string;
  produkKomersialUuid: string;
  masterObatUuid:      string;

  // ── Subject (Livestock or Batch) ─────────────────────────────────────────────
  /** Filled when pemeriksaan.mode === 'individu' */
  livestockId: string | null;
  /** Filled when pemeriksaan.mode === 'batch' */
  batchId:     string | null;

  // ── Treatment data (denormalized at time of integration) ─────────────────────
  namaProduk:    string;
  namaGenerik:   string;
  brand:         string;
  dosis:         string;
  satuanDosis:   string;
  frekuensi:     string;
  lamaPemberian: string;
  caraPemberian: string;
  catatan:       string;

  // ── Meta ──────────────────────────────────────────────────────────────────────
  petugas: string;
}

// ─── In-memory Store ──────────────────────────────────────────────────────────

export const RIWAYAT_KESEHATAN_RECORDS: RiwayatKesehatanRecord[] = [];

// ─── Accessors ────────────────────────────────────────────────────────────────

/** All records, newest first. */
export function getRiwayatKesehatanList(): RiwayatKesehatanRecord[] {
  return [...RIWAYAT_KESEHATAN_RECORDS].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function getRiwayatKesehatanById(uuid: string): RiwayatKesehatanRecord | undefined {
  return RIWAYAT_KESEHATAN_RECORDS.find((r) => r.uuid === uuid);
}

export function getRiwayatKesehatanByPengobatanSesi(
  pengobatanSesiId: string,
): RiwayatKesehatanRecord[] {
  return RIWAYAT_KESEHATAN_RECORDS.filter((r) => r.pengobatanSesiId === pengobatanSesiId);
}

/**
 * BT-003: Individual History for a livestock — includes both its own
 * individu-mode records AND every batch-mode record for a Batch this
 * livestock is (or was, at the time) an active member of. This is what
 * makes "Health Check/Treatment by Batch" show up on each member's own
 * history, not just the batch-level record.
 */
export function getRiwayatKesehatanByLivestock(
  livestockId: string,
): RiwayatKesehatanRecord[] {
  return RIWAYAT_KESEHATAN_RECORDS
    .filter((r) => {
      if (r.livestockId === livestockId) return true;
      if (r.batchId) {
        return getActiveBatchMemberships(r.batchId).some((m) => m.livestockId === livestockId);
      }
      return false;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ─── Mutation (internal — only called from integrasiPengobatanService) ────────

/**
 * Adds a new immutable health-event record.
 * MUST NOT be called directly from any UI component.
 * Only integrasiPengobatanService.ts is authorised to call this.
 */
export function addRiwayatKesehatan(
  input: Omit<RiwayatKesehatanRecord, 'uuid'>,
): RiwayatKesehatanRecord {
  const record: RiwayatKesehatanRecord = { uuid: generateUUID(), ...input };
  RIWAYAT_KESEHATAN_RECORDS.push(record);
  return record;
}
