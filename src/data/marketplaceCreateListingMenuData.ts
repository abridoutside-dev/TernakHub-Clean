// ─── Marketplace — Menu "Buat Listing" per Workspace (MPK-004 → MPK-007) ─────
// Memetakan menu "Pilih Jenis Listing" yang RELEVAN untuk Workspace aktif.
// Sejak MPK-007, listing dibuat langsung dari halaman Buat Listing dengan
// mengambil ASET yang sungguh dimiliki Workspace (lihat
// marketplaceAsetWorkspaceData.ts) — bukan lagi dari katalog referensi Produk
// Komersial/Produk Komersial Obat. `modulAsal` untuk Toko Pakan/Toko Obat
// karena itu mengarah ke Stok Pakan/Stok Obat (kepemilikan aktual), sesuai
// aturan MPK-007. "Jual Bibit" (Bibit Hijauan) dihapus dari menu Peternakan
// karena belum ada modul aset nyata untuk itu di codebase ini — MPK-007
// hanya mendefinisikan 6 sumber aset (Livestock, Stok Pakan, Stok Obat, dan
// tiga jenis Layanan yang belum punya modul).
//
// Modul ini tidak menyentuh Workspace/Livestock/Stok Pakan/Stok Obat/Formula
// — hanya membaca `WorkspaceJenis` (tipe) sebagai kunci.

import type { WorkspaceJenis } from '../components/TopAppBar';
import type { ListingSumberModul } from './marketplaceListingData';

export interface CreateListingMenuItem {
  label: string;
  icon: string;
  /** Modul asal aset workspace tempat listing ini sesungguhnya dibuat. */
  modulAsal: ListingSumberModul;
}

const MENU_PER_WORKSPACE: Record<WorkspaceJenis, CreateListingMenuItem[]> = {
  Peternakan: [
    { label: 'Jual Ternak', icon: '🐑', modulAsal: 'Livestock' },
  ],
  'Toko Pakan': [
    { label: 'Jual Pakan', icon: '🌾', modulAsal: 'StokPakan' },
  ],
  'Toko Obat': [
    { label: 'Jual Obat', icon: '💊', modulAsal: 'StokObat' },
  ],
  Transporter: [
    { label: 'Tawarkan Jasa Transport', icon: '🚚', modulAsal: 'Transportasi' },
  ],
  'Dokter Hewan': [
    { label: 'Tawarkan Layanan Dokter', icon: '👨‍⚕️', modulAsal: 'DokterHewan' },
  ],
  'Klinik Hewan': [
    { label: 'Tawarkan Layanan Klinik', icon: '🏥', modulAsal: 'KlinikHewan' },
  ],
};

/** Menu "Buat Listing" yang relevan untuk satu jenis Workspace. Tidak pernah menampilkan menu di luar jenis Workspace aktif. */
export function getCreateListingMenu(jenis: WorkspaceJenis): CreateListingMenuItem[] {
  return MENU_PER_WORKSPACE[jenis] ?? [];
}
