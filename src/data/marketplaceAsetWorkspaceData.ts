// ─── Marketplace — Aset Workspace untuk Buat Listing (MPK-007) ──────────────
// Satu-satunya sumber "Pilih Aset" yang boleh dipakai halaman Buat Listing:
// aset yang SUNGGUH dimiliki Workspace aktif, BUKAN katalog referensi.
//
//   Peternakan  → Livestock (src/data/livestockData.ts, via livestockSummary)
//   Toko Pakan  → Stok Pakan / Inventaris (src/data/stokInventarisData.ts)
//   Toko Obat   → Stok Obat (src/data/stokObatData.ts)
//   Transporter / Dokter Hewan / Klinik Hewan → belum ada modul Layanan nyata
//     di codebase ini — Pilih Aset menampilkan status kosong yang jujur,
//     BUKAN data ilustrasi yang dibuat khusus untuk halaman ini.
//
// Modul ini hanya MEMBACA (read-only import) modul-modul asal di atas —
// tidak pernah menulis/mengubah stok fisik atau data ternak. Larangan
// arsitektur MPK-007: dilarang membangun listing dari Master Pakan, Produk
// Komersial (Pakan/Obat), atau Master Obat — itu adalah database referensi,
// bukan aset milik Workspace.

import type { KategoriMarketplaceSlug } from './marketplaceKategoriData';
import type { ListingSumberModul } from './marketplaceListingData';
import { getQtyListingAktif } from './marketplaceListingData';
import { buildIndividuList } from '../utils/livestockSummary';
import { getInventarisList } from './stokInventarisData';
import { STOK_OBAT_ITEMS, getStatusStok } from './stokObatData';
import { getObatByUuid } from './obatData';
import { getObatKategoriBySlug } from './masterObatKategoriData';
import type { WorkspaceJenis } from '../components/TopAppBar';
// MPK-024 — Layanan service workspace modules (read-only)
import { getLayananTransportByWorkspace } from './layananTransportData';
import { getLayananDokterHewanByWorkspace } from './layananDokterHewanData';
import { getLayananKlinikHewanByWorkspace } from './layananKlinikHewanData';
import {
  getLayananTransportTidakTersediaAlasan,
} from './marketplaceLayananTransportIntegrationData';
import {
  getLayananDokterHewanTidakTersediaAlasan,
} from './marketplaceLayananDokterHewanIntegrationData';
import {
  getLayananKlinikHewanTidakTersediaAlasan,
} from './marketplaceLayananKlinikHewanIntegrationData';

/**
 * MPK-021 — Data lengkap ternak untuk ditampilkan di Pilih Aset.
 * Dibaca live dari LIVESTOCK_DB via buildIndividuList(); tidak disimpan.
 */
export interface LivestockDetailFields {
  ras: string;
  kelamin: string;
  /** Label umur, mis. "24 bulan". */
  ageLabel: string;
  bobot: string;
  /** Status kesehatan: Sehat | Sakit | Pemantauan. */
  healthStatus: string;
  /** Lokasi kandang/blok. */
  location: string;
}

/**
 * MPK-022 — Data Stok Pakan minimal untuk ditampilkan di Pilih Aset & Detail
 * Listing. Dibaca live dari stokInventarisData.ts; tidak disimpan/diduplikasi.
 */
export interface StokPakanDetailFields {
  kategori: string;
  subKategori?: string;
  batch?: string;
  lokasiPenyimpanan?: string;
  qtyStokFisik: number;
  qtyListingAktif: number;
  qtyTersediaUntukListing: number;
}

/**
 * MPK-023 — Data Stok Obat minimal untuk ditampilkan di Pilih Aset & Detail
 * Listing. Dibaca live dari stokObatData.ts (+ Master Obat untuk Kategori/
 * SubKategori via masterObatUuid); tidak disimpan/diduplikasi.
 */
export interface StokObatDetailFields {
  kategori: string;
  subKategori?: string;
  nomorBatch?: string;
  tanggalKadaluarsa?: string | null;
  lokasiPenyimpanan?: string;
  qtyStokFisik: number;
  qtyListingAktif: number;
  qtyTersediaUntukListing: number;
}

/**
 * MPK-024 — Data Layanan Jasa minimal untuk ditampilkan di Pilih Aset.
 * Dibaca live dari modul asal (layananTransport/DokterHewan/KlinikHewan);
 * tidak disimpan/diduplikasi. Berlaku untuk Transportasi, DokterHewan, KlinikHewan.
 */
export interface LayananDetailFields {
  /** Kategori layanan, mis. "Angkut Ternak", "Konsultasi", "Rawat Jalan". */
  kategori: string;
  subKategori?: string;
  lokasi: string;
  /** Status asli layanan dari modul asal — Aktif | Nonaktif | Ditutup | Diarsipkan. */
  status: string;
  /** Baris info tambahan spesifik per jenis layanan (mis. jenis kendaraan, spesialisasi). */
  infoTambahan?: string;
}

/** Satu opsi aset yang bisa dipilih pada langkah "Pilih Aset". */
export interface AsetWorkspaceOption {
  /** id/uuid asli pada modul asal — dipakai sebagai sumber.sumberId listing. */
  id: string;
  nama: string;
  icon: string;
  brand?: string;
  /** Dipakai untuk mengisi default jenisListing pada form. */
  kategoriHint: string;
  satuan: string;
  /** Stok fisik SAAT INI pada modul asal — null artinya konsep "stok" tidak berlaku (jasa). */
  stokFisik: number | null;
  /** Kondisi bawaan untuk prefill form (opsional). */
  kondisiDefault?: string;
  /** Untuk Livestock — jenis ternak, dipakai sebagai default Target Ternak. */
  targetTernakDefault?: string[];
  /**
   * MPK-021 — Detail ternak live untuk ditampilkan di picker.
   * Hanya terisi untuk modul Livestock; undefined untuk modul lain.
   */
  livestockDetail?: LivestockDetailFields;
  /**
   * MPK-022 — Detail Stok Pakan live untuk ditampilkan di picker.
   * Hanya terisi untuk modul StokPakan; undefined untuk modul lain.
   */
  stokPakanDetail?: StokPakanDetailFields;
  /**
   * MPK-023 — Detail Stok Obat live untuk ditampilkan di picker.
   * Hanya terisi untuk modul StokObat; undefined untuk modul lain.
   */
  stokObatDetail?: StokObatDetailFields;
  /**
   * MPK-024 — Detail Layanan Jasa live untuk ditampilkan di picker.
   * Hanya terisi untuk modul Transportasi/DokterHewan/KlinikHewan; undefined untuk modul lain.
   */
  layananDetail?: LayananDetailFields;
  /**
   * MPK-021/MPK-022/MPK-023/MPK-024 — Alasan spesifik mengapa aset tidak tersedia
   * (Livestock: sudah ada listing aktif; StokPakan/StokObat: status
   * Nonaktif/Diarsipkan/Kadaluarsa; Layanan: Nonaktif/Ditutup/Diarsipkan).
   * Menggantikan label generik "Stok Habis".
   */
  tidakTersediaAlasan?: string;
}

/**
 * Modul asal yang menjadi sumber sah "Pilih Aset" untuk setiap jenis
 * Workspace, sesuai aturan MPK-007. Transport/Dokter Hewan/Klinik Hewan
 * belum memiliki modul Layanan nyata sehingga tidak menghasilkan aset.
 */
export const WORKSPACE_JENIS_TO_MODUL: Record<WorkspaceJenis, ListingSumberModul> = {
  Peternakan: 'Livestock',
  'Toko Pakan': 'StokPakan',
  'Toko Obat': 'StokObat',
  Transporter: 'Transportasi',
  'Dokter Hewan': 'DokterHewan',
  'Klinik Hewan': 'KlinikHewan',
};

/** Kategori Marketplace yang berpadanan dengan setiap modul sumber aset. */
export const MODUL_TO_KATEGORI_SLUG: Record<ListingSumberModul, KategoriMarketplaceSlug> = {
  Livestock: 'ternak',
  MasterPakan: 'pakan',
  ProdukKomersialPakan: 'pakan',
  StokPakan: 'pakan',
  MasterObat: 'obat-kesehatan',
  ProdukKomersialObat: 'obat-kesehatan',
  StokObat: 'obat-kesehatan',
  Transportasi: 'transportasi',
  DokterHewan: 'dokter-hewan',
  KlinikHewan: 'klinik-hewan',
  Peralatan: 'peralatan',
  BibitHijauan: 'bibit-hijauan',
  JasaPeternakan: 'lainnya',
  Lainnya: 'lainnya',
};

/** Modul sumber yang berupa Layanan (tidak punya konsep stok fisik / kuantitas terbatas). */
const JASA_MODUL: ListingSumberModul[] = ['Transportasi', 'DokterHewan', 'KlinikHewan'];

export function isJasaModul(modul: ListingSumberModul): boolean {
  return JASA_MODUL.includes(modul);
}

/** Stok fisik LIVE aset tunggal — dibaca langsung dari modul asal, tidak pernah di-cache. */
export function getStokFisikLive(modul: ListingSumberModul, sumberId: string): number | null {
  if (modul === 'Livestock') {
    return buildIndividuList().some((lv) => lv.id === sumberId) ? 1 : 0;
  }
  if (modul === 'StokPakan') {
    return getInventarisList().find((it) => it.id === sumberId)?.jumlahStok ?? 0;
  }
  if (modul === 'StokObat') {
    return STOK_OBAT_ITEMS.find((it) => it.uuid === sumberId)?.jumlah ?? 0;
  }
  return null; // jasa — tidak ada konsep stok fisik
}

/**
 * Qty Tersedia Untuk Listing = Stok Fisik (live) − Qty Listing Aktif (live).
 * `excludeUuid` dipakai saat mengedit listing yang sudah ada agar qty listing
 * itu sendiri tidak ikut mengurangi kuotanya sendiri. Mengembalikan null untuk
 * modul Jasa (tidak dibatasi stok fisik).
 */
export function getQtyTersediaAset(modul: ListingSumberModul, sumberId: string, excludeUuid?: string): number | null {
  const stokFisik = getStokFisikLive(modul, sumberId);
  if (stokFisik === null) return null;
  const reserved = getQtyListingAktif(modul, sumberId, excludeUuid);
  return stokFisik - reserved;
}

/**
 * MPK-008: Nama aset asli untuk tampilan/pencarian pada halaman Listing Saya.
 * Mencoba mencocokkan `sumberId` ke aset yang benar-benar ada saat ini
 * (Livestock/Stok Pakan/Stok Obat); jika tidak ketemu (mis. data contoh lama
 * yang sumberId-nya ilustratif, atau modul Jasa yang belum punya aset nyata),
 * jatuh ke `fallback` (biasanya `jenisListing` milik listing itu sendiri).
 * Baca-saja — tidak pernah mengubah data modul asal.
 */
export function resolveNamaAset(modul: ListingSumberModul, sumberId: string, fallback: string, workspaceId?: string): string {
  if (modul === 'Livestock' || modul === 'StokPakan' || modul === 'StokObat') {
    const found = getAsetOptions(modul).find((o) => o.id === sumberId);
    if (found) return found.nama;
  }
  if (modul === 'Transportasi' && workspaceId) {
    const found = getLayananTransportByWorkspace(workspaceId).find((r) => r.uuid === sumberId);
    if (found) return found.nama;
  }
  if (modul === 'DokterHewan' && workspaceId) {
    const found = getLayananDokterHewanByWorkspace(workspaceId).find((r) => r.uuid === sumberId);
    if (found) return found.nama;
  }
  if (modul === 'KlinikHewan' && workspaceId) {
    const found = getLayananKlinikHewanByWorkspace(workspaceId).find((r) => r.uuid === sumberId);
    if (found) return found.nama;
  }
  return fallback;
}

/**
 * Daftar aset Workspace aktif yang bisa dipilih untuk satu modul sumber.
 * `workspaceId` dipakai untuk memfilter layanan jasa sesuai pemilik Workspace
 * aktif (MPK-024). Untuk modul non-jasa (Livestock/StokPakan/StokObat),
 * parameter ini diabaikan.
 */
export function getAsetOptions(modul: ListingSumberModul, workspaceId?: string): AsetWorkspaceOption[] {
  if (modul === 'Livestock') {
    // MPK-021: getAsetOptions dibaca live setiap render — tidak ada cache.
    // Data lengkap ternak (ras, kelamin, umur, bobot, health) dibawa via
    // livestockDetail sehingga halaman Buat Listing bisa menampilkan kartu
    // ternak yang kaya tanpa menduplikasi data ke state halaman.
    return buildIndividuList().map((lv) => ({
      id: lv.id,
      nama: lv.name ?? `${lv.type} ${lv.id}`,
      icon: lv.icon,
      kategoriHint: lv.type,
      satuan: 'ekor',
      stokFisik: 1,
      kondisiDefault: lv.status === 'Sehat' ? 'Sehat' : 'Pemantauan',
      targetTernakDefault: [lv.type],
      // MPK-021 — data live ternak untuk tampilan picker
      livestockDetail: {
        ras: lv.ras,
        kelamin: lv.gender,
        ageLabel: lv.ageMonths > 0 ? `${lv.ageMonths} bulan` : '—',
        bobot: lv.weightNum > 0 ? `${lv.weight} ${lv.unit}` : '—',
        healthStatus: lv.status,
        location: lv.blok,
      } satisfies LivestockDetailFields,
    }));
  }
  if (modul === 'StokPakan') {
    // MPK-022: setiap item dibaca live termasuk statusAktif/diarsipkan —
    // item yang Nonaktif/Diarsipkan tetap ditampilkan (transparan) tapi
    // ditandai tidak tersedia untuk Listing, bukan disembunyikan diam-diam.
    return getInventarisList().map((it) => {
      const diarsipkan = it.diarsipkan ?? false;
      const statusAktif = it.statusAktif ?? 'Aktif';
      const qtyListingAktif = getQtyListingAktif('StokPakan', it.id);
      let tidakTersediaAlasan: string | undefined;
      if (diarsipkan) tidakTersediaAlasan = 'Sudah Diarsipkan';
      else if (statusAktif === 'Nonaktif') tidakTersediaAlasan = 'Status Nonaktif';
      return {
        id: it.id,
        nama: it.nama,
        icon: '🌾',
        brand: it.brand,
        kategoriHint: it.kategori,
        satuan: it.satuan,
        stokFisik: it.jumlahStok,
        kondisiDefault: 'Baru',
        tidakTersediaAlasan,
        stokPakanDetail: {
          kategori: it.kategori,
          subKategori: it.subKategori,
          batch: it.batch,
          lokasiPenyimpanan: it.lokasiPenyimpanan,
          qtyStokFisik: it.jumlahStok,
          qtyListingAktif,
          qtyTersediaUntukListing: it.jumlahStok - qtyListingAktif,
        } satisfies StokPakanDetailFields,
      };
    });
  }
  if (modul === 'StokObat') {
    // MPK-023: setiap item dibaca live termasuk statusAktif/diarsipkan/expired —
    // item yang tidak layak dijual tetap ditampilkan (transparan) tapi
    // ditandai tidak tersedia untuk Listing, bukan disembunyikan diam-diam.
    return STOK_OBAT_ITEMS.map((it) => {
      const diarsipkan = it.diarsipkan ?? false;
      const statusAktif = it.statusAktif ?? 'Aktif';
      const statusStok = getStatusStok(it);
      const qtyListingAktif = getQtyListingAktif('StokObat', it.uuid);
      const masterObat = getObatByUuid(it.masterObatUuid);
      const kategoriNama = masterObat ? (getObatKategoriBySlug(masterObat.kategoriSlug)?.nama ?? masterObat.kategoriSlug) : it.bentukSediaan;
      let tidakTersediaAlasan: string | undefined;
      if (diarsipkan) tidakTersediaAlasan = 'Sudah Diarsipkan';
      else if (statusAktif === 'Nonaktif') tidakTersediaAlasan = 'Status Nonaktif';
      else if (statusStok === 'Expired') tidakTersediaAlasan = 'Sudah Kadaluarsa';
      return {
        id: it.uuid,
        nama: it.namaProduk,
        icon: '💊',
        brand: it.brand,
        kategoriHint: it.bentukSediaan,
        satuan: it.satuan,
        stokFisik: it.jumlah,
        kondisiDefault: statusStok === 'Expired' ? 'Bekas Layak Pakai' : 'Baru',
        tidakTersediaAlasan,
        stokObatDetail: {
          kategori: kategoriNama,
          subKategori: masterObat?.subKategori,
          nomorBatch: it.nomorBatch,
          tanggalKadaluarsa: it.tanggalExpired,
          lokasiPenyimpanan: it.lokasiPenyimpanan,
          qtyStokFisik: it.jumlah,
          qtyListingAktif,
          qtyTersediaUntukListing: it.jumlah - qtyListingAktif,
        } satisfies StokObatDetailFields,
      };
    });
  }
  if (modul === 'Transportasi') {
    // MPK-024: setiap layanan transport dibaca live dari layananTransportData.ts.
    // Difilter berdasarkan workspaceId milik penjual. Jika workspaceId tidak
    // diketahui, kembalikan daftar kosong — jangan gunakan fallback hardcoded.
    if (!workspaceId) return [];
    const semua = getLayananTransportByWorkspace(workspaceId);
    return semua.map((rec) => {
      const tidakTersediaAlasan = getLayananTransportTidakTersediaAlasan(rec);
      return {
        id: rec.uuid,
        nama: rec.nama,
        icon: rec.thumbnail,
        kategoriHint: rec.kategori,
        satuan: 'jasa',
        stokFisik: null, // jasa — tidak ada konsep stok fisik
        kondisiDefault: 'Tersedia',
        targetTernakDefault: rec.targetTernak,
        tidakTersediaAlasan,
        layananDetail: {
          kategori: rec.kategori,
          subKategori: rec.subKategori,
          lokasi: rec.lokasi,
          status: rec.status,
          infoTambahan: [rec.jenisKendaraan, rec.kapasitasMuatan, rec.rute]
            .filter(Boolean)
            .join(' · ') || undefined,
        } satisfies LayananDetailFields,
      };
    });
  }

  if (modul === 'DokterHewan') {
    // MPK-024: layanan dokter hewan dibaca live dari layananDokterHewanData.ts.
    if (!workspaceId) return [];
    const semua = getLayananDokterHewanByWorkspace(workspaceId);
    return semua.map((rec) => {
      const tidakTersediaAlasan = getLayananDokterHewanTidakTersediaAlasan(rec);
      return {
        id: rec.uuid,
        nama: rec.nama,
        icon: rec.thumbnail,
        kategoriHint: rec.kategori,
        satuan: 'jasa',
        stokFisik: null,
        kondisiDefault: 'Tersedia',
        targetTernakDefault: rec.hewanYangDitangani,
        tidakTersediaAlasan,
        layananDetail: {
          kategori: rec.kategori,
          subKategori: rec.subKategori,
          lokasi: rec.lokasi,
          status: rec.status,
          infoTambahan: [
            rec.namaLengkap,
            rec.spesialisasi.join(', '),
            rec.modePelayanan.join(' & '),
          ].filter(Boolean).join(' · ') || undefined,
        } satisfies LayananDetailFields,
      };
    });
  }

  if (modul === 'KlinikHewan') {
    // MPK-024: layanan klinik hewan dibaca live dari layananKlinikHewanData.ts.
    if (!workspaceId) return [];
    const semua = getLayananKlinikHewanByWorkspace(workspaceId);
    return semua.map((rec) => {
      const tidakTersediaAlasan = getLayananKlinikHewanTidakTersediaAlasan(rec);
      return {
        id: rec.uuid,
        nama: rec.nama,
        icon: rec.thumbnail,
        kategoriHint: rec.kategori,
        satuan: 'jasa',
        stokFisik: null,
        kondisiDefault: 'Tersedia',
        targetTernakDefault: rec.hewanYangDitangani,
        tidakTersediaAlasan,
        layananDetail: {
          kategori: rec.kategori,
          subKategori: rec.subKategori,
          lokasi: rec.lokasi,
          status: rec.status,
          infoTambahan: [
            rec.namaKlinik,
            rec.jamOperasional,
            rec.fasilitas.slice(0, 2).join(', '),
          ].filter(Boolean).join(' · ') || undefined,
        } satisfies LayananDetailFields,
      };
    });
  }

  return []; // modul lain belum punya aset nyata
}
