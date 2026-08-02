// ─── Marketplace ↔ Layanan Transport — Integrasi (MPK-024) ───────────────────
// Titik konsolidasi aturan integrasi Marketplace dengan Layanan Transport
// (src/data/layananTransportData.ts):
//   1. Data referensi minimal yang boleh dibaca Marketplace via Reference UUID
//      (getLayananTransportReferenceData) — dipakai Detail Listing.
//   2. Validasi kelayakan sebuah layanan untuk dijadikan Listing baru
//      (getLayananTransportEligibility) — dipakai Buat Listing.
//
// Prinsip MPK-024 / Constitution:
//   - Marketplace HANYA MEMBACA Layanan Transport lewat Reference UUID.
//   - Tidak ada data yang diduplikasi ke sini.
//   - Modul ini TIDAK PERNAH menulis ke layananTransportData.ts.
//   - Jika layanan Nonaktif/Ditutup/Diarsipkan → Listing tampilkan status terbaru.

import {
  getLayananTransportByUuid,
  type LayananTransportRecord,
} from './layananTransportData';
import type { WorkspaceJenis } from '../components/TopAppBar';

/**
 * Data referensi minimal untuk satu Layanan Transport, dibaca live via
 * Reference UUID. Mengembalikan undefined jika layanan tidak ditemukan.
 */
export interface LayananTransportReferenceFields {
  referenceUuid: string;
  namaLayanan: string;
  kategori: string;
  subKategori?: string;
  lokasi: string;
  status: LayananTransportRecord['status'];
  jenisKendaraan: string;
  kapasitasMuatan: string;
  rute?: string;
  targetTernak?: string[];
  deskripsi?: string;
}

export function getLayananTransportReferenceData(
  uuid: string,
): LayananTransportReferenceFields | undefined {
  const rec = getLayananTransportByUuid(uuid);
  if (!rec) return undefined;
  return {
    referenceUuid: rec.uuid,
    namaLayanan: rec.nama,
    kategori: rec.kategori,
    subKategori: rec.subKategori,
    lokasi: rec.lokasi,
    status: rec.status,
    jenisKendaraan: rec.jenisKendaraan,
    kapasitasMuatan: rec.kapasitasMuatan,
    rute: rec.rute,
    targetTernak: rec.targetTernak,
    deskripsi: rec.deskripsi,
  };
}

export interface LayananTransportEligibility {
  eligible: boolean;
  reason?: string;
}

/**
 * Validasi kelayakan satu Layanan Transport untuk dijadikan Listing baru.
 * Urutan aturan:
 *   1. Layanan harus ada di data Layanan Transport.
 *   2. Workspace aktif harus bertipe 'Transporter'.
 *   3. Layanan harus milik workspaceId yang aktif (dijaga via workspaceId).
 *   4. Status layanan harus 'Aktif'.
 */
export function getLayananTransportEligibility(
  uuid: string,
  workspaceJenis: WorkspaceJenis,
  workspaceId: string,
): LayananTransportEligibility {
  const rec = getLayananTransportByUuid(uuid);
  if (!rec) {
    return { eligible: false, reason: 'Layanan Transport tidak ditemukan.' };
  }
  if (workspaceJenis !== 'Transporter') {
    return {
      eligible: false,
      reason: 'Workspace aktif tidak sesuai — Layanan Transport hanya dimiliki Workspace jenis Transporter.',
    };
  }
  if (rec.workspaceId !== workspaceId) {
    return { eligible: false, reason: 'Layanan ini bukan milik Workspace aktif.' };
  }
  if (rec.status === 'Nonaktif') {
    return { eligible: false, reason: 'Layanan Transport berstatus Nonaktif.' };
  }
  if (rec.status === 'Ditutup') {
    return { eligible: false, reason: 'Layanan Transport sementara Ditutup.' };
  }
  if (rec.status === 'Diarsipkan') {
    return { eligible: false, reason: 'Layanan Transport sudah Diarsipkan.' };
  }
  return { eligible: true };
}

/**
 * Alasan tidak tersedia untuk tampilan picker (sesuai pola tidakTersediaAlasan
 * di marketplaceAsetWorkspaceData.ts). Mengembalikan undefined jika Aktif.
 */
export function getLayananTransportTidakTersediaAlasan(
  rec: LayananTransportRecord,
): string | undefined {
  if (rec.status === 'Nonaktif') return 'Status Nonaktif';
  if (rec.status === 'Ditutup') return 'Sementara Ditutup';
  if (rec.status === 'Diarsipkan') return 'Sudah Diarsipkan';
  return undefined;
}
