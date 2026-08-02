// ─── Marketplace ↔ Stok Pakan — Integrasi (MPK-022) ─────────────────────────
// Modul ini adalah titik konsolidasi untuk seluruh aturan integrasi
// Marketplace dengan Stok Pakan (src/data/stokInventarisData.ts):
//   1. Data Stok minimal yang boleh dibaca Marketplace via Reference UUID
//      (getStokPakanReferenceData) — dipakai Detail Listing.
//   2. Validasi kelayakan sebuah item Stok Pakan untuk dijadikan Listing baru
//      (getStokPakanEligibility) — dipakai Buat Listing sebagai lapisan
//      pertahanan tambahan (picker sudah menyaring lewat tidakTersediaAlasan
//      di marketplaceAsetWorkspaceData.ts).
//   3. Peringatan (bukan koreksi otomatis) ketika Qty Listing suatu listing
//      melebihi Qty Tersedia Untuk Listing terkini akibat perubahan Stok
//      Pakan (getStokPakanOverQuotaWarning) — dipakai Listing Saya/Kelola
//      Listing.
//
// Prinsip MPK-022: Marketplace HANYA MEMBACA Stok Pakan lewat Reference UUID
// (sumber.sumberId → InventarisItem.id). Tidak ada data yang diduplikasi ke
// sini, dan modul ini TIDAK PERNAH menulis ke stokInventarisData.ts — stok
// fisik hanya berubah lewat mutasi Stok Pakan sendiri (Pemberian Pakan,
// Produksi Formula, Penyesuaian, Perubahan Stok, dst) atau lewat transaksi
// Marketplace yang sudah "Selesai" (lihat marketplaceTransaksiData.ts).

import { getInventarisById } from './stokInventarisData';
import { getQtyListingAktif, type ListingItem } from './marketplaceListingData';
import { getQtyTersediaAset } from './marketplaceAsetWorkspaceData';
import type { WorkspaceJenis } from '../components/TopAppBar';

/**
 * Data Stok minimal (per spesifikasi MPK-022) yang boleh dibaca Marketplace
 * dari satu item Stok Pakan, via Reference UUID — tidak pernah disalin/
 * disimpan, selalu dihitung ulang saat dipanggil.
 */
export interface StokPakanReferenceFields {
  /** Stock UUID — id asli item pada Stok Pakan. */
  stockUuid: string;
  /** Reference UUID — referensi silang item ke modul asal (Master Pakan/Produk Komersial), jika ada. */
  referenceUuid?: string;
  namaProduk: string;
  kategori: string;
  subKategori?: string;
  brand?: string;
  batch?: string;
  lokasiPenyimpanan?: string;
  satuan: string;
  qtyStokFisik: number;
  qtyListingAktif: number;
  qtyTersediaUntukListing: number;
}

/**
 * Data Stok minimal untuk satu item Stok Pakan, dibaca live via Reference
 * UUID. Mengembalikan undefined jika item sudah tidak ada lagi di Stok Pakan
 * (mis. referensi lama) — dipanggil harus menampilkan "data referensi tidak
 * ditemukan" secara jujur, bukan mengarang isian.
 */
export function getStokPakanReferenceData(
  inventarisId: string,
  excludeListingUuid?: string,
): StokPakanReferenceFields | undefined {
  const inv = getInventarisById(inventarisId);
  if (!inv) return undefined;
  const qtyListingAktif = getQtyListingAktif('StokPakan', inv.id, excludeListingUuid);
  return {
    stockUuid: inv.id,
    referenceUuid: inv.referensiId,
    namaProduk: inv.nama,
    kategori: inv.kategori,
    subKategori: inv.subKategori,
    brand: inv.brand,
    batch: inv.batch,
    lokasiPenyimpanan: inv.lokasiPenyimpanan,
    satuan: inv.satuan,
    qtyStokFisik: inv.jumlahStok,
    qtyListingAktif,
    qtyTersediaUntukListing: inv.jumlahStok - qtyListingAktif,
  };
}

export interface StokPakanEligibility {
  eligible: boolean;
  reason?: string;
}

/**
 * Validasi kelayakan satu item Stok Pakan untuk dijadikan Listing baru,
 * sesuai urutan aturan MPK-022:
 *   1. Item harus ada di Stok Pakan.
 *   2. Workspace aktif harus bertipe 'Toko Pakan' — Stok Pakan hanya dimiliki
 *      Workspace jenis ini (lihat WORKSPACE_JENIS_TO_MODUL). Codebase ini
 *      belum mem-partisi RAW_INVENTARIS per-Workspace individual (hanya per
 *      jenis Workspace) — ini adalah batas validasi kepemilikan Workspace
 *      yang bisa dilakukan secara jujur saat ini, tanpa mengarang partisi
 *      data per-Workspace yang belum ada di Stok Pakan.
 *   3. Status stok tidak boleh 'Nonaktif'.
 *   4. Item tidak boleh sudah 'diarsipkan'.
 *   5. Qty Tersedia Untuk Listing tidak boleh 0 atau kurang.
 */
export function getStokPakanEligibility(
  inventarisId: string,
  workspaceJenis: WorkspaceJenis,
): StokPakanEligibility {
  const inv = getInventarisById(inventarisId);
  if (!inv) {
    return { eligible: false, reason: 'Item Stok Pakan tidak ditemukan.' };
  }
  if (workspaceJenis !== 'Toko Pakan') {
    return { eligible: false, reason: 'Workspace aktif tidak sesuai — Stok Pakan hanya dimiliki Workspace jenis Toko Pakan.' };
  }
  if (inv.diarsipkan) {
    return { eligible: false, reason: 'Item Stok Pakan sudah diarsipkan.' };
  }
  if ((inv.statusAktif ?? 'Aktif') === 'Nonaktif') {
    return { eligible: false, reason: 'Status Stok Pakan Nonaktif.' };
  }
  const tersedia = getQtyTersediaAset('StokPakan', inv.id) ?? 0;
  if (tersedia <= 0) {
    return { eligible: false, reason: 'Qty Tersedia Untuk Listing sudah 0.' };
  }
  return { eligible: true };
}

/**
 * Peringatan (BUKAN koreksi otomatis) ketika Qty Listing suatu listing
 * bersumber StokPakan melebihi Qty Tersedia Untuk Listing terkini — mis.
 * karena stok berkurang lewat Pemberian Pakan/Produksi Formula/Penyesuaian/
 * Perubahan Stok di Stok Pakan setelah listing dibuat. Mengembalikan null
 * jika listing bukan bersumber StokPakan, atau tidak melebihi kuota.
 * Marketplace TIDAK PERNAH mengubah qtyDijual secara otomatis — penjual
 * harus menyesuaikannya sendiri lewat Edit Listing.
 */
export function getStokPakanOverQuotaWarning(listing: ListingItem): string | null {
  if (listing.sumber.modul !== 'StokPakan') return null;
  const tersedia = getQtyTersediaAset('StokPakan', listing.sumber.sumberId, listing.uuid);
  if (tersedia === null) return null;
  if (listing.qtyDijual <= tersedia) return null;
  return `Qty Listing (${listing.qtyDijual} ${listing.satuanHarga}) melebihi Qty Tersedia Untuk Listing saat ini (${tersedia} ${listing.satuanHarga}) karena perubahan Stok Pakan. Segera sesuaikan Qty Listing lewat Edit Listing — sistem tidak mengubahnya secara otomatis.`;
}
