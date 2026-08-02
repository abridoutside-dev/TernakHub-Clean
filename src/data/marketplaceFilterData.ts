// ─── Marketplace — Struktur & Logika Filter (MPK-002 → MPK-003 → MPK-005) ────
// Filter untuk SATU Marketplace. Field yang didukung: Kategori, SubKategori,
// Workspace, Kabupaten, Provinsi, Harga, Jenis Listing, Target Ternak, Status.
// Lokasi bebas teks dipertahankan sebagai kriteria tambahan (mis. dari hasil
// Search) di samping Kabupaten/Provinsi yang lebih rinci.
//
// MPK-005: seluruh field kini benar-benar menyaring (bukan hanya struktur).

import type { KategoriMarketplaceSlug } from './marketplaceKategoriData';
import type { ListingItem, ListingStatus } from './marketplaceListingData';

export interface MarketplaceFilter {
  kategoriSlug: KategoriMarketplaceSlug | 'semua';
  subKategoriSlug?: string;
  /** Lokasi bebas teks (misal "Garut" atau "Garut, Jawa Barat"). */
  lokasi?: string;
  kabupaten?: string;
  provinsi?: string;
  hargaMin?: number;
  hargaMax?: number;
  status?: ListingStatus;
  /** Workspace asal listing (workspaceId) — untuk menyaring listing dari Workspace tertentu. */
  workspaceId?: string;
  /** Jenis listing spesifik di dalam kategori/sub-kategori, misal "Domba Garut", "Konsentrat". */
  jenisListing?: string;
  /** Jenis ternak yang relevan dengan listing (lihat ListingItem.targetTernak). */
  targetTernak?: string;
}

export const DEFAULT_MARKETPLACE_FILTER: MarketplaceFilter = {
  kategoriSlug: 'semua',
};

function cocokSubstring(haystack: string | undefined, keyword: string): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(keyword.toLowerCase());
}

/** Apakah filter di luar default (dipakai untuk badge "Filter aktif" & Empty State). */
export function isMarketplaceFilterActive(filter: MarketplaceFilter): boolean {
  return (
    filter.kategoriSlug !== 'semua' ||
    !!filter.subKategoriSlug ||
    !!filter.lokasi ||
    !!filter.kabupaten ||
    !!filter.provinsi ||
    filter.hargaMin != null ||
    filter.hargaMax != null ||
    !!filter.status ||
    !!filter.workspaceId ||
    !!filter.jenisListing ||
    !!filter.targetTernak
  );
}

/**
 * Terapkan filter ke daftar listing. Sejak MPK-005 seluruh field pada
 * MarketplaceFilter benar-benar menyaring.
 */
export function applyMarketplaceFilter(
  listing: ListingItem[],
  filter: MarketplaceFilter
): ListingItem[] {
  let hasil = listing;

  if (filter.kategoriSlug !== 'semua') {
    hasil = hasil.filter((l) => l.kategoriSlug === filter.kategoriSlug);
  }
  if (filter.subKategoriSlug) {
    hasil = hasil.filter((l) => l.subKategoriSlug === filter.subKategoriSlug);
  }
  if (filter.workspaceId) {
    hasil = hasil.filter((l) => l.workspaceId === filter.workspaceId);
  }
  if (filter.kabupaten) {
    hasil = hasil.filter((l) => l.kabupaten === filter.kabupaten);
  }
  if (filter.provinsi) {
    hasil = hasil.filter((l) => l.provinsi === filter.provinsi);
  }
  if (filter.status) {
    hasil = hasil.filter((l) => l.status === filter.status);
  }
  if (filter.jenisListing) {
    hasil = hasil.filter((l) => l.jenisListing === filter.jenisListing);
  }
  if (filter.targetTernak) {
    hasil = hasil.filter((l) => l.targetTernak?.includes(filter.targetTernak!));
  }
  if (filter.hargaMin != null) {
    hasil = hasil.filter((l) => l.harga >= filter.hargaMin!);
  }
  if (filter.hargaMax != null) {
    hasil = hasil.filter((l) => l.harga <= filter.hargaMax!);
  }
  if (filter.lokasi) {
    const kw = filter.lokasi;
    hasil = hasil.filter(
      (l) => cocokSubstring(l.lokasi, kw) || cocokSubstring(l.kabupaten, kw) || cocokSubstring(l.provinsi, kw)
    );
  }

  return hasil;
}
