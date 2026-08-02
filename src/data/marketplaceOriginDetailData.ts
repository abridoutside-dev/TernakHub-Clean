// ─── Marketplace — Resolver Detail Modul Asal (MPK-006) ─────────────────────
// Marketplace TIDAK menyimpan/duplikat data modul lain. Halaman Detail
// Listing memanggil resolver di file ini untuk membaca field ASLI langsung
// dari modul asal (Livestock, Master Pakan, Produk Komersial Konsentrat,
// Master Obat) berdasarkan `ListingItem.sumber` — baca-saja, tidak pernah
// menulis ke modul-modul tersebut.
//
// Cakupan modul asal nyata saat ini (lihat eksplorasi MPK-006):
//   - Livestock              → src/data/livestockData.ts
//   - Master Pakan (Rumput)  → src/data/rumputData.ts
//   - Produk Komersial Pakan → src/data/konsentratDetailData.ts (batch Konsentrat)
//   - Master Obat            → src/data/obatData.ts + obatDetailData.ts
// Kategori lain (Transportasi, Dokter Hewan, Klinik Hewan, Peralatan, Bibit
// Hijauan, Jasa Peternakan, Lainnya) BELUM memiliki modul asal di codebase
// ini — untuk kategori tersebut resolver mengembalikan `tersedia: false` dan
// halaman Detail Listing menampilkan field milik listing itu sendiri sebagai
// gantinya (bukan data modul asal yang belum ada), tanpa mengarang data.
//
// Catatan khusus Livestock: ID ternak dibuat dinamis saat runtime oleh dev
// auto-seed (buildLivestockId), berbeda dari Master Pakan/Master Obat/Produk
// Komersial yang datanya statis. Jadi `sumberId` pada listing Ternak belum
// bisa berupa ID tetap — resolver ini pertama coba mencocokkan `sumberId`
// langsung ke LIVESTOCK_DB (untuk listing masa depan yang sudah memakai ID
// nyata), dan jika tidak ketemu, jatuh ke pencocokan berdasarkan spesies
// (`targetTernak`) sebagai referensi terdekat yang benar-benar ada saat itu.

import { LIVESTOCK_DB, type LivestockRecord } from './livestockData';
import { getRumputById } from './rumputData';
import { getKonsentratDetailByUUID, type KonsentratDetail } from './konsentratDetailData';
import { getObatById } from './obatData';
import { getObatDetail } from './obatDetailData';
import { getStokPakanReferenceData } from './marketplaceStokPakanIntegrationData';
import { getStokObatReferenceData } from './marketplaceStokObatIntegrationData';
// MPK-024 — Layanan service workspace resolvers (read-only)
import { getLayananTransportReferenceData } from './marketplaceLayananTransportIntegrationData';
import { getLayananDokterHewanReferenceData } from './marketplaceLayananDokterHewanIntegrationData';
import { getLayananKlinikHewanReferenceData } from './marketplaceLayananKlinikHewanIntegrationData';
import type { ListingItem, ListingSumberModul } from './marketplaceListingData';

export type OriginDetailField = { label: string; value: string };

export type OriginDetailResult = {
  /** true jika field di bawah benar-benar dibaca dari modul asal. */
  tersedia: boolean;
  /** Nama modul asal yang ditampilkan ke pengguna. */
  namaModul: string;
  /** Catatan singkat jika data tidak/kurang tersedia. */
  catatan?: string;
  fields: OriginDetailField[];
};

const NAMA_MODUL: Record<ListingSumberModul, string> = {
  Livestock: 'Livestock',
  MasterPakan: 'Master Pakan',
  ProdukKomersialPakan: 'Produk Komersial — Pakan',
  MasterObat: 'Master Obat',
  ProdukKomersialObat: 'Produk Komersial — Obat',
  StokPakan: 'Stok Pakan',
  StokObat: 'Stok Obat',
  Transportasi: 'Transportasi',
  DokterHewan: 'Dokter Hewan',
  KlinikHewan: 'Klinik Hewan',
  Peralatan: 'Peralatan',
  BibitHijauan: 'Bibit Hijauan',
  JasaPeternakan: 'Jasa Peternakan',
  Lainnya: 'Lainnya',
};

function resolveLivestockRecord(sumberId: string, targetTernak?: string[]): LivestockRecord | undefined {
  if (LIVESTOCK_DB[sumberId]) return LIVESTOCK_DB[sumberId];
  const spesies = targetTernak?.[0];
  if (!spesies) return undefined;
  return Object.values(LIVESTOCK_DB).find(l => l.type === spesies);
}

function livestockDetail(item: ListingItem): OriginDetailResult {
  const record = resolveLivestockRecord(item.sumber.sumberId, item.targetTernak);
  if (!record) {
    return {
      tersedia: false,
      namaModul: NAMA_MODUL.Livestock,
      catatan: 'Belum ada data ternak yang cocok di modul Livestock saat ini.',
      fields: [],
    };
  }
  // MPK-021 — data selalu dibaca live dari LIVESTOCK_DB via sumberId;
  // tidak ada salinan/cache. Perubahan di Livestock otomatis tercermin di sini.
  const fields: OriginDetailField[] = [
    { label: 'Nomor ID', value: record.id },
    { label: 'Jenis', value: record.type },
    { label: 'Ras', value: record.ras },
    { label: 'Jenis Kelamin', value: record.kelamin },
    { label: 'Umur', value: record.age || '—' },
    { label: 'Tanggal Lahir', value: record.birthDate || '—' },
    { label: 'Bobot Lahir', value: record.birthWeight || '—' },
    { label: 'Bobot Saat Ini', value: `${record.weight} ${record.weightUnit}` },
    { label: 'Status Kesehatan', value: record.status },
    { label: 'Lokasi', value: record.location },
    { label: 'Program', value: record.program },
  ];
  if (record.digitalIdentity.verified) {
    fields.push({ label: 'Digital Identity', value: `✅ Terverifikasi — ${record.digitalIdentity.issuedBy}` });
  }
  return {
    tersedia: true,
    namaModul: NAMA_MODUL.Livestock,
    fields,
  };
}

function masterPakanDetail(item: ListingItem): OriginDetailResult {
  const rumput = getRumputById(item.sumber.sumberId);
  if (!rumput) {
    return {
      tersedia: false,
      namaModul: NAMA_MODUL.MasterPakan,
      catatan: 'Referensi bahan pakan tidak ditemukan di Master Pakan.',
      fields: [],
    };
  }
  const fields: OriginDetailField[] = [
    { label: 'Nama', value: rumput.nama },
    { label: 'Kategori', value: rumput.kategoriItem },
  ];
  if (rumput.namaLatin) fields.push({ label: 'Nama Latin', value: rumput.namaLatin });
  if (rumput.namaLain) fields.push({ label: 'Nama Lain', value: rumput.namaLain });
  if (rumput.estimasiHarga != null) {
    fields.push({ label: 'Estimasi Harga Referensi', value: `Rp${rumput.estimasiHarga.toLocaleString('id-ID')}/kg (${rumput.hargaUpdated})` });
  }
  if (rumput.deskripsi) fields.push({ label: 'Deskripsi', value: rumput.deskripsi });
  return { tersedia: true, namaModul: NAMA_MODUL.MasterPakan, fields };
}

function nutrisiRingkas(nutrisi: KonsentratDetail['nutrisi']): string {
  const bagian: string[] = [];
  if (nutrisi.proteinKasar != null) bagian.push(`Protein Kasar ${nutrisi.proteinKasar}%`);
  if (nutrisi.tdn != null) bagian.push(`TDN ${nutrisi.tdn}%`);
  if (nutrisi.me != null) bagian.push(`ME ${nutrisi.me} Mcal/kg`);
  return bagian.join(' · ') || '—';
}

function produkKomersialPakanDetail(item: ListingItem): OriginDetailResult {
  const detail = getKonsentratDetailByUUID(item.sumber.sumberId);
  if (!detail) {
    return {
      tersedia: false,
      namaModul: NAMA_MODUL.ProdukKomersialPakan,
      catatan: 'Produk tidak ditemukan di Produk Komersial Konsentrat.',
      fields: [],
    };
  }
  return {
    tersedia: true,
    namaModul: NAMA_MODUL.ProdukKomersialPakan,
    fields: [
      { label: 'Brand', value: detail.namaBrand },
      { label: 'Nama Produk', value: detail.namaProduk },
      { label: 'Jenis Produk', value: detail.jenisProduk },
      { label: 'Target Ternak', value: detail.targetTernak },
      { label: 'Fase Pemeliharaan', value: detail.fasePemeliharaan },
      { label: 'Bentuk Produk', value: detail.bentukProduk },
      { label: 'Nutrisi', value: nutrisiRingkas(detail.nutrisi) },
      { label: 'Kemasan', value: detail.kemasan.map(k => `${k.berat}${k.keterangan ? ` (${k.keterangan})` : ''}`).join(', ') },
      { label: 'Produsen', value: detail.produsen.nama },
    ],
  };
}

/**
 * MPK-022 — Detail Stok Pakan asli, dibaca live via Reference UUID
 * (item.sumber.sumberId → InventarisItem.id di stokInventarisData.ts).
 * Tidak menyalin data — Qty Listing Aktif/Qty Tersedia dihitung ulang setiap
 * kali dipanggil lewat getStokPakanReferenceData.
 */
function stokPakanDetail(item: ListingItem): OriginDetailResult {
  const ref = getStokPakanReferenceData(item.sumber.sumberId, item.uuid);
  if (!ref) {
    return {
      tersedia: false,
      namaModul: NAMA_MODUL.StokPakan,
      catatan: 'Item Stok Pakan referensi tidak ditemukan (mungkin sudah dihapus dari Stok Pakan Workspace).',
      fields: [],
    };
  }
  const fields: OriginDetailField[] = [
    { label: 'Nama Produk', value: ref.namaProduk },
    { label: 'Kategori', value: ref.kategori },
    ...(ref.subKategori ? [{ label: 'Sub-Kategori', value: ref.subKategori }] : []),
    ...(ref.brand ? [{ label: 'Brand', value: ref.brand }] : []),
    ...(ref.batch ? [{ label: 'Batch', value: ref.batch }] : []),
    { label: 'Lokasi Penyimpanan', value: ref.lokasiPenyimpanan ?? '—' },
    { label: 'Qty Stok Fisik', value: `${ref.qtyStokFisik} ${ref.satuan}` },
    { label: 'Qty Listing Aktif', value: `${ref.qtyListingAktif} ${ref.satuan}` },
    { label: 'Qty Tersedia Untuk Listing', value: `${ref.qtyTersediaUntukListing} ${ref.satuan}` },
  ];
  return { tersedia: true, namaModul: NAMA_MODUL.StokPakan, fields };
}

/**
 * MPK-023 — Detail Stok Obat asli, dibaca live via Reference UUID
 * (item.sumber.sumberId → StokObatItem.uuid di stokObatData.ts). Tidak
 * menyalin data — Qty Listing Aktif/Qty Tersedia dihitung ulang setiap kali
 * dipanggil lewat getStokObatReferenceData.
 */
function stokObatDetail(item: ListingItem): OriginDetailResult {
  const ref = getStokObatReferenceData(item.sumber.sumberId, item.uuid);
  if (!ref) {
    return {
      tersedia: false,
      namaModul: NAMA_MODUL.StokObat,
      catatan: 'Item Stok Obat referensi tidak ditemukan (mungkin sudah dihapus dari Stok Obat Workspace).',
      fields: [],
    };
  }
  const fields: OriginDetailField[] = [
    { label: 'Nama Produk', value: ref.namaProduk },
    { label: 'Kategori', value: ref.kategori },
    ...(ref.subKategori ? [{ label: 'Sub-Kategori', value: ref.subKategori }] : []),
    { label: 'Brand', value: ref.brand },
    { label: 'Nomor Batch', value: ref.nomorBatch ?? '—' },
    { label: 'Tanggal Kadaluarsa', value: ref.tanggalKadaluarsa ?? '—' },
    { label: 'Lokasi Penyimpanan', value: ref.lokasiPenyimpanan ?? '—' },
    { label: 'Qty Stok Fisik', value: `${ref.qtyStokFisik} ${ref.satuan}` },
    { label: 'Qty Listing Aktif', value: `${ref.qtyListingAktif} ${ref.satuan}` },
    { label: 'Qty Tersedia Untuk Listing', value: `${ref.qtyTersediaUntukListing} ${ref.satuan}` },
  ];
  return { tersedia: true, namaModul: NAMA_MODUL.StokObat, fields };
}

function masterObatDetail(item: ListingItem): OriginDetailResult {
  const obat = getObatById(item.sumber.sumberId);
  if (!obat) {
    return {
      tersedia: false,
      namaModul: NAMA_MODUL.MasterObat,
      catatan: 'Obat tidak ditemukan di Master Obat.',
      fields: [],
    };
  }
  const detailDosis = getObatDetail(obat.id);
  const fields: OriginDetailField[] = [
    { label: 'Nama Generik', value: obat.namaGenerik },
    { label: 'Golongan Obat', value: obat.golonganObat },
    { label: 'Bentuk Sediaan', value: obat.bentukSediaan },
    { label: 'Kandungan Aktif', value: obat.kandunganAktif },
    { label: 'Indikasi', value: obat.indikasi },
    { label: 'Withdrawal Time', value: obat.withdrawalTime },
  ];
  if (detailDosis && detailDosis.dosis.length > 0) {
    fields.push({
      label: 'Dosis per Jenis Ternak',
      value: detailDosis.dosis.map(d => `${d.jenisTernak}: ${d.dosis} (${d.caraPemberian})`).join(' · '),
    });
  }
  return { tersedia: true, namaModul: NAMA_MODUL.MasterObat, fields };
}

/**
 * MPK-024 — Detail Layanan Transport, dibaca live via Reference UUID
 * (item.sumber.sumberId → LayananTransportRecord.uuid di layananTransportData.ts).
 * Tidak menyalin data — selalu membaca kondisi terbaru dari modul asal.
 */
function layananTransportDetail(item: ListingItem): OriginDetailResult {
  const ref = getLayananTransportReferenceData(item.sumber.sumberId);
  if (!ref) {
    return {
      tersedia: false,
      namaModul: NAMA_MODUL.Transportasi,
      catatan: 'Layanan Transport referensi tidak ditemukan (mungkin sudah dihapus dari modul Layanan Transport).',
      fields: [],
    };
  }
  const fields: OriginDetailField[] = [
    { label: 'Nama Layanan', value: ref.namaLayanan },
    { label: 'Kategori', value: ref.kategori },
    ...(ref.subKategori ? [{ label: 'Sub-Kategori', value: ref.subKategori }] : []),
    { label: 'Jenis Kendaraan', value: ref.jenisKendaraan },
    { label: 'Kapasitas Muatan', value: ref.kapasitasMuatan },
    ...(ref.rute ? [{ label: 'Rute', value: ref.rute }] : []),
    { label: 'Lokasi', value: ref.lokasi },
    { label: 'Status Layanan', value: ref.status },
    ...(ref.targetTernak && ref.targetTernak.length > 0
      ? [{ label: 'Target Ternak', value: ref.targetTernak.join(', ') }]
      : []),
    ...(ref.deskripsi ? [{ label: 'Deskripsi', value: ref.deskripsi }] : []),
  ];
  return { tersedia: true, namaModul: NAMA_MODUL.Transportasi, fields };
}

/**
 * MPK-024 — Detail Layanan Dokter Hewan, dibaca live via Reference UUID
 * (item.sumber.sumberId → LayananDokterHewanRecord.uuid di layananDokterHewanData.ts).
 */
function layananDokterHewanDetail(item: ListingItem): OriginDetailResult {
  const ref = getLayananDokterHewanReferenceData(item.sumber.sumberId);
  if (!ref) {
    return {
      tersedia: false,
      namaModul: NAMA_MODUL.DokterHewan,
      catatan: 'Layanan Dokter Hewan referensi tidak ditemukan (mungkin sudah dihapus dari modul Layanan Dokter Hewan).',
      fields: [],
    };
  }
  const fields: OriginDetailField[] = [
    { label: 'Nama Layanan', value: ref.namaLayanan },
    { label: 'Kategori', value: ref.kategori },
    ...(ref.subKategori ? [{ label: 'Sub-Kategori', value: ref.subKategori }] : []),
    { label: 'Nama Dokter', value: ref.namaLengkap },
    { label: 'Spesialisasi', value: ref.spesialisasi.join(', ') },
    { label: 'Hewan Ditangani', value: ref.hewanYangDitangani.join(', ') },
    { label: 'Mode Pelayanan', value: ref.modePelayanan.join(', ') },
    { label: 'Lokasi', value: ref.lokasi },
    { label: 'Status Layanan', value: ref.status },
    ...(ref.deskripsi ? [{ label: 'Deskripsi', value: ref.deskripsi }] : []),
  ];
  return { tersedia: true, namaModul: NAMA_MODUL.DokterHewan, fields };
}

/**
 * MPK-024 — Detail Layanan Klinik Hewan, dibaca live via Reference UUID
 * (item.sumber.sumberId → LayananKlinikHewanRecord.uuid di layananKlinikHewanData.ts).
 */
function layananKlinikHewanDetail(item: ListingItem): OriginDetailResult {
  const ref = getLayananKlinikHewanReferenceData(item.sumber.sumberId);
  if (!ref) {
    return {
      tersedia: false,
      namaModul: NAMA_MODUL.KlinikHewan,
      catatan: 'Layanan Klinik Hewan referensi tidak ditemukan (mungkin sudah dihapus dari modul Layanan Klinik Hewan).',
      fields: [],
    };
  }
  const fields: OriginDetailField[] = [
    { label: 'Nama Layanan', value: ref.namaLayanan },
    { label: 'Kategori', value: ref.kategori },
    ...(ref.subKategori ? [{ label: 'Sub-Kategori', value: ref.subKategori }] : []),
    { label: 'Nama Klinik', value: ref.namaKlinik },
    { label: 'Fasilitas', value: ref.fasilitas.join(', ') },
    { label: 'Hewan Ditangani', value: ref.hewanYangDitangani.join(', ') },
    ...(ref.jamOperasional ? [{ label: 'Jam Operasional', value: ref.jamOperasional }] : []),
    { label: 'Lokasi', value: ref.lokasi },
    { label: 'Status Layanan', value: ref.status },
    ...(ref.deskripsi ? [{ label: 'Deskripsi', value: ref.deskripsi }] : []),
  ];
  return { tersedia: true, namaModul: NAMA_MODUL.KlinikHewan, fields };
}

/**
 * Mengambil detail modul asal untuk sebuah listing — baca-saja.
 * Kategori tanpa modul asal nyata mengembalikan tersedia:false; halaman
 * Detail Listing lalu menampilkan field milik listing itu sendiri sebagai
 * penggantinya.
 */
export function getOriginDetail(item: ListingItem): OriginDetailResult {
  switch (item.sumber.modul) {
    case 'Livestock':
      return livestockDetail(item);
    case 'MasterPakan':
      return masterPakanDetail(item);
    case 'ProdukKomersialPakan':
      return produkKomersialPakanDetail(item);
    case 'MasterObat':
      return masterObatDetail(item);
    case 'StokPakan':
      return stokPakanDetail(item);
    case 'StokObat':
      return stokObatDetail(item);
    // MPK-024 — Workspace Layanan
    case 'Transportasi':
      return layananTransportDetail(item);
    case 'DokterHewan':
      return layananDokterHewanDetail(item);
    case 'KlinikHewan':
      return layananKlinikHewanDetail(item);
    default:
      return {
        tersedia: false,
        namaModul: NAMA_MODUL[item.sumber.modul],
        catatan: `Modul "${NAMA_MODUL[item.sumber.modul]}" belum memiliki data referensi di aplikasi ini.`,
        fields: [],
      };
  }
}
