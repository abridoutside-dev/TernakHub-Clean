// ─── Marketplace ↔ Stok Obat — Integrasi (MPK-023) ──────────────────────────
// Titik konsolidasi aturan integrasi Marketplace dengan Stok Obat
// (src/data/stokObatData.ts), mengikuti pola yang sama dengan MPK-022
// (Stok Pakan):
//   1. Data Stok minimal yang boleh dibaca Marketplace via Reference UUID
//      (getStokObatReferenceData) — dipakai Detail Listing.
//   2. Validasi kelayakan sebuah item Stok Obat untuk dijadikan Listing baru
//      (getStokObatEligibility) — lapisan pertahanan tambahan di Buat Listing
//      selain penyaringan picker lewat tidakTersediaAlasan.
//   3. Peringatan (bukan koreksi otomatis) ketika Qty Listing suatu listing
//      melebihi Qty Tersedia Untuk Listing terkini akibat perubahan Stok
//      Obat (getStokObatOverQuotaWarning).
//
// Prinsip MPK-023: Marketplace HANYA MEMBACA Stok Obat lewat Reference UUID
// (sumber.sumberId → StokObatItem.uuid). Tidak ada data yang diduplikasi ke
// sini, dan modul ini TIDAK PERNAH menulis ke stokObatData.ts — stok fisik
// hanya berubah lewat mutasi Stok Obat sendiri (Pengobatan Ternak,
// Penyesuaian, dst) atau lewat transaksi Marketplace yang sudah "Selesai"
// (lihat marketplaceTransaksiData.ts, sudah menangani sinkronisasi ini sejak
// MPK-009 via applyPenyesuaianStok).

import { getStokObatById, getStatusStok } from './stokObatData';
import { getObatByUuid } from './obatData';
import { getObatKategoriBySlug } from './masterObatKategoriData';
import { getQtyListingAktif, type ListingItem } from './marketplaceListingData';
import { getQtyTersediaAset } from './marketplaceAsetWorkspaceData';
import type { WorkspaceJenis } from '../components/TopAppBar';

/**
 * Data Stok minimal (per spesifikasi MPK-023) yang boleh dibaca Marketplace
 * dari satu item Stok Obat, via Reference UUID — tidak pernah disalin/
 * disimpan, selalu dihitung ulang saat dipanggil.
 */
export interface StokObatReferenceFields {
  /** Stock UUID — id asli item pada Stok Obat. */
  stockUuid: string;
  /** Reference UUID — relasi ke Produk Komersial Obat (produkKomersialUuid). */
  referenceUuid: string;
  namaProduk: string;
  kategori: string;
  subKategori?: string;
  brand: string;
  nomorBatch?: string;
  tanggalKadaluarsa?: string | null;
  lokasiPenyimpanan?: string;
  satuan: string;
  qtyStokFisik: number;
  qtyListingAktif: number;
  qtyTersediaUntukListing: number;
}

/**
 * Data Stok minimal untuk satu item Stok Obat, dibaca live via Reference
 * UUID. Mengembalikan undefined jika item sudah tidak ada lagi di Stok Obat
 * (mis. referensi lama) — pemanggil harus menampilkan "data referensi tidak
 * ditemukan" secara jujur, bukan mengarang isian.
 */
export function getStokObatReferenceData(
  stokObatUuid: string,
  excludeListingUuid?: string,
): StokObatReferenceFields | undefined {
  const item = getStokObatById(stokObatUuid);
  if (!item) return undefined;
  const masterObat = getObatByUuid(item.masterObatUuid);
  const kategori = masterObat
    ? (getObatKategoriBySlug(masterObat.kategoriSlug)?.nama ?? masterObat.kategoriSlug)
    : item.bentukSediaan;
  const qtyListingAktif = getQtyListingAktif('StokObat', item.uuid, excludeListingUuid);
  return {
    stockUuid: item.uuid,
    referenceUuid: item.produkKomersialUuid,
    namaProduk: item.namaProduk,
    kategori,
    subKategori: masterObat?.subKategori,
    brand: item.brand,
    nomorBatch: item.nomorBatch,
    tanggalKadaluarsa: item.tanggalExpired,
    lokasiPenyimpanan: item.lokasiPenyimpanan,
    satuan: item.satuan,
    qtyStokFisik: item.jumlah,
    qtyListingAktif,
    qtyTersediaUntukListing: item.jumlah - qtyListingAktif,
  };
}

export interface StokObatEligibility {
  eligible: boolean;
  reason?: string;
}

/**
 * Validasi kelayakan satu item Stok Obat untuk dijadikan Listing baru,
 * sesuai urutan aturan MPK-023:
 *   1. Item harus ada di Stok Obat.
 *   2. Workspace aktif harus bertipe 'Toko Obat' — Stok Obat hanya dimiliki
 *      Workspace jenis ini (lihat WORKSPACE_JENIS_TO_MODUL). Sama seperti
 *      Stok Pakan (MPK-022), codebase ini belum mem-partisi StokObatItem per
 *      Workspace individual (hanya per jenis Workspace via
 *      CURRENT_WORKSPACE_UUID tunggal) — ini adalah batas validasi
 *      kepemilikan Workspace yang bisa dilakukan secara jujur saat ini.
 *   3. Item tidak boleh sudah 'diarsipkan'.
 *   4. Status stok tidak boleh 'Nonaktif'.
 *   5. Produk tidak boleh sudah Kadaluarsa (getStatusStok === 'Expired').
 *   6. Qty Tersedia Untuk Listing tidak boleh 0 atau kurang.
 */
export function getStokObatEligibility(
  stokObatUuid: string,
  workspaceJenis: WorkspaceJenis,
): StokObatEligibility {
  const item = getStokObatById(stokObatUuid);
  if (!item) {
    return { eligible: false, reason: 'Item Stok Obat tidak ditemukan.' };
  }
  if (workspaceJenis !== 'Toko Obat') {
    return { eligible: false, reason: 'Workspace aktif tidak sesuai — Stok Obat hanya dimiliki Workspace jenis Toko Obat.' };
  }
  if (item.diarsipkan) {
    return { eligible: false, reason: 'Item Stok Obat sudah diarsipkan.' };
  }
  if ((item.statusAktif ?? 'Aktif') === 'Nonaktif') {
    return { eligible: false, reason: 'Status Stok Obat Nonaktif.' };
  }
  if (getStatusStok(item) === 'Expired') {
    return { eligible: false, reason: 'Produk sudah Kadaluarsa.' };
  }
  const tersedia = getQtyTersediaAset('StokObat', item.uuid) ?? 0;
  if (tersedia <= 0) {
    return { eligible: false, reason: 'Qty Tersedia Untuk Listing sudah 0.' };
  }
  return { eligible: true };
}

/**
 * Peringatan (BUKAN koreksi otomatis) ketika Qty Listing suatu listing
 * bersumber StokObat melebihi Qty Tersedia Untuk Listing terkini — mis.
 * karena stok berkurang lewat Pengobatan Ternak/Penyesuaian/Rusak/
 * Kadaluarsa/Hilang/Donasi/Penjualan Langsung di Stok Obat setelah listing
 * dibuat. Mengembalikan null jika listing bukan bersumber StokObat, atau
 * tidak melebihi kuota. Marketplace TIDAK PERNAH mengubah qtyDijual secara
 * otomatis — penjual harus menyesuaikannya sendiri lewat Edit Listing.
 */
export function getStokObatOverQuotaWarning(listing: ListingItem): string | null {
  if (listing.sumber.modul !== 'StokObat') return null;
  const tersedia = getQtyTersediaAset('StokObat', listing.sumber.sumberId, listing.uuid);
  if (tersedia === null) return null;
  if (listing.qtyDijual <= tersedia) return null;
  return `Qty Listing (${listing.qtyDijual} ${listing.satuanHarga}) melebihi Qty Tersedia Untuk Listing saat ini (${tersedia} ${listing.satuanHarga}) karena perubahan Stok Obat. Segera sesuaikan Qty Listing lewat Edit Listing — sistem tidak mengubahnya secara otomatis.`;
}
