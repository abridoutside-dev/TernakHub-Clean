// ─── Marketplace ↔ Layanan Klinik Hewan — Integrasi (MPK-024) ────────────────
// Titik konsolidasi aturan integrasi Marketplace dengan Layanan Klinik Hewan
// (src/data/layananKlinikHewanData.ts):
//   1. Data referensi minimal via Reference UUID (getLayananKlinikHewanReferenceData).
//   2. Validasi kelayakan untuk Listing baru (getLayananKlinikHewanEligibility).
//
// Prinsip MPK-024 / Constitution:
//   - Marketplace HANYA MEMBACA Layanan Klinik Hewan lewat Reference UUID.
//   - Tidak ada data yang diduplikasi ke sini.
//   - Modul ini TIDAK PERNAH menulis ke layananKlinikHewanData.ts.

import {
  getLayananKlinikHewanByUuid,
  type LayananKlinikHewanRecord,
} from './layananKlinikHewanData';
import type { WorkspaceJenis } from '../components/TopAppBar';

export interface LayananKlinikHewanReferenceFields {
  referenceUuid: string;
  namaLayanan: string;
  kategori: string;
  subKategori?: string;
  lokasi: string;
  status: LayananKlinikHewanRecord['status'];
  namaKlinik: string;
  fasilitas: string[];
  hewanYangDitangani: string[];
  jamOperasional?: string;
  deskripsi?: string;
}

export function getLayananKlinikHewanReferenceData(
  uuid: string,
): LayananKlinikHewanReferenceFields | undefined {
  const rec = getLayananKlinikHewanByUuid(uuid);
  if (!rec) return undefined;
  return {
    referenceUuid: rec.uuid,
    namaLayanan: rec.nama,
    kategori: rec.kategori,
    subKategori: rec.subKategori,
    lokasi: rec.lokasi,
    status: rec.status,
    namaKlinik: rec.namaKlinik,
    fasilitas: rec.fasilitas,
    hewanYangDitangani: rec.hewanYangDitangani,
    jamOperasional: rec.jamOperasional,
    deskripsi: rec.deskripsi,
  };
}

export interface LayananKlinikHewanEligibility {
  eligible: boolean;
  reason?: string;
}

/**
 * Validasi kelayakan satu Layanan Klinik Hewan untuk dijadikan Listing baru.
 * Urutan aturan:
 *   1. Layanan harus ada di data Layanan Klinik Hewan.
 *   2. Workspace aktif harus bertipe 'Klinik Hewan'.
 *   3. Layanan harus milik workspaceId yang aktif.
 *   4. Status layanan harus 'Aktif'.
 */
export function getLayananKlinikHewanEligibility(
  uuid: string,
  workspaceJenis: WorkspaceJenis,
  workspaceId: string,
): LayananKlinikHewanEligibility {
  const rec = getLayananKlinikHewanByUuid(uuid);
  if (!rec) {
    return { eligible: false, reason: 'Layanan Klinik Hewan tidak ditemukan.' };
  }
  if (workspaceJenis !== 'Klinik Hewan') {
    return {
      eligible: false,
      reason: 'Workspace aktif tidak sesuai — Layanan Klinik Hewan hanya dimiliki Workspace jenis Klinik Hewan.',
    };
  }
  if (rec.workspaceId !== workspaceId) {
    return { eligible: false, reason: 'Layanan ini bukan milik Workspace aktif.' };
  }
  if (rec.status === 'Nonaktif') {
    return { eligible: false, reason: 'Layanan Klinik Hewan berstatus Nonaktif.' };
  }
  if (rec.status === 'Ditutup') {
    return { eligible: false, reason: 'Layanan Klinik Hewan sementara Ditutup.' };
  }
  if (rec.status === 'Diarsipkan') {
    return { eligible: false, reason: 'Layanan Klinik Hewan sudah Diarsipkan.' };
  }
  return { eligible: true };
}

export function getLayananKlinikHewanTidakTersediaAlasan(
  rec: LayananKlinikHewanRecord,
): string | undefined {
  if (rec.status === 'Nonaktif') return 'Status Nonaktif';
  if (rec.status === 'Ditutup') return 'Sementara Ditutup';
  if (rec.status === 'Diarsipkan') return 'Sudah Diarsipkan';
  return undefined;
}
