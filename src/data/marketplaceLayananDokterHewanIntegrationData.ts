// ─── Marketplace ↔ Layanan Dokter Hewan — Integrasi (MPK-024) ────────────────
// Titik konsolidasi aturan integrasi Marketplace dengan Layanan Dokter Hewan
// (src/data/layananDokterHewanData.ts):
//   1. Data referensi minimal via Reference UUID (getLayananDokterHewanReferenceData).
//   2. Validasi kelayakan untuk Listing baru (getLayananDokterHewanEligibility).
//
// Prinsip MPK-024 / Constitution:
//   - Marketplace HANYA MEMBACA Layanan Dokter Hewan lewat Reference UUID.
//   - Tidak ada data yang diduplikasi ke sini.
//   - Modul ini TIDAK PERNAH menulis ke layananDokterHewanData.ts.

import {
  getLayananDokterHewanByUuid,
  type LayananDokterHewanRecord,
} from './layananDokterHewanData';
import type { WorkspaceJenis } from '../components/TopAppBar';

export interface LayananDokterHewanReferenceFields {
  referenceUuid: string;
  namaLayanan: string;
  kategori: string;
  subKategori?: string;
  lokasi: string;
  status: LayananDokterHewanRecord['status'];
  namaLengkap: string;
  spesialisasi: string[];
  hewanYangDitangani: string[];
  modePelayanan: string[];
  deskripsi?: string;
}

export function getLayananDokterHewanReferenceData(
  uuid: string,
): LayananDokterHewanReferenceFields | undefined {
  const rec = getLayananDokterHewanByUuid(uuid);
  if (!rec) return undefined;
  return {
    referenceUuid: rec.uuid,
    namaLayanan: rec.nama,
    kategori: rec.kategori,
    subKategori: rec.subKategori,
    lokasi: rec.lokasi,
    status: rec.status,
    namaLengkap: rec.namaLengkap,
    spesialisasi: rec.spesialisasi,
    hewanYangDitangani: rec.hewanYangDitangani,
    modePelayanan: rec.modePelayanan,
    deskripsi: rec.deskripsi,
  };
}

export interface LayananDokterHewanEligibility {
  eligible: boolean;
  reason?: string;
}

/**
 * Validasi kelayakan satu Layanan Dokter Hewan untuk dijadikan Listing baru.
 * Urutan aturan:
 *   1. Layanan harus ada di data Layanan Dokter Hewan.
 *   2. Workspace aktif harus bertipe 'Dokter Hewan'.
 *   3. Layanan harus milik workspaceId yang aktif.
 *   4. Status layanan harus 'Aktif'.
 */
export function getLayananDokterHewanEligibility(
  uuid: string,
  workspaceJenis: WorkspaceJenis,
  workspaceId: string,
): LayananDokterHewanEligibility {
  const rec = getLayananDokterHewanByUuid(uuid);
  if (!rec) {
    return { eligible: false, reason: 'Layanan Dokter Hewan tidak ditemukan.' };
  }
  if (workspaceJenis !== 'Dokter Hewan') {
    return {
      eligible: false,
      reason: 'Workspace aktif tidak sesuai — Layanan Dokter Hewan hanya dimiliki Workspace jenis Dokter Hewan.',
    };
  }
  if (rec.workspaceId !== workspaceId) {
    return { eligible: false, reason: 'Layanan ini bukan milik Workspace aktif.' };
  }
  if (rec.status === 'Nonaktif') {
    return { eligible: false, reason: 'Layanan Dokter Hewan berstatus Nonaktif.' };
  }
  if (rec.status === 'Ditutup') {
    return { eligible: false, reason: 'Layanan Dokter Hewan sementara Ditutup.' };
  }
  if (rec.status === 'Diarsipkan') {
    return { eligible: false, reason: 'Layanan Dokter Hewan sudah Diarsipkan.' };
  }
  return { eligible: true };
}

export function getLayananDokterHewanTidakTersediaAlasan(
  rec: LayananDokterHewanRecord,
): string | undefined {
  if (rec.status === 'Nonaktif') return 'Status Nonaktif';
  if (rec.status === 'Ditutup') return 'Sementara Ditutup';
  if (rec.status === 'Diarsipkan') return 'Sudah Diarsipkan';
  return undefined;
}
