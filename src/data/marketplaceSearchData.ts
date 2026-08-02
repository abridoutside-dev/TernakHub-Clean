// ─── Marketplace — Struktur Search (MPK-002 → MPK-003) ───────────────────────
// Fondasi struktur agar Search dapat mencari lintas: Judul, Kategori,
// SubKategori, Brand, Jenis Ternak (via jenisListing), Kabupaten, Provinsi,
// dan Workspace. Belum ada UI pencarian aktif — input Search pada halaman
// Marketplace masih placeholder (lingkup MPK-001). Fungsi di bawah
// menyediakan struktur pencarian yang siap dipakai saat UI dibangun.

import { KATEGORI_MARKETPLACE, SUBKATEGORI_MARKETPLACE } from './marketplaceKategoriData';
import type { ListingItem } from './marketplaceListingData';

export type MarketplaceSearchField =
  | 'judul'
  | 'kategori'
  | 'subKategori'
  | 'brand'
  | 'jenisTernak'
  | 'kabupaten'
  | 'provinsi'
  | 'workspace';

export interface MarketplaceSearchResult {
  listing: ListingItem;
  /** Field mana pada listing ini yang cocok dengan kata kunci. */
  matchedFields: MarketplaceSearchField[];
}

function cocok(haystack: string | undefined, keyword: string): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(keyword.toLowerCase());
}

/**
 * Mencari listing berdasarkan kata kunci pada: judul, nama kategori, nama
 * sub-kategori, brand, jenis ternak/jenis listing, kabupaten, provinsi, dan
 * nama Workspace. Pencarian case-insensitive dan substring — struktur ini
 * siap dikembangkan (mis. ranking, highlight) pada fase berikutnya.
 */
export function searchMarketplace(listing: ListingItem[], keyword: string): MarketplaceSearchResult[] {
  const kw = keyword.trim();
  if (!kw) return listing.map((l) => ({ listing: l, matchedFields: [] }));

  const results: MarketplaceSearchResult[] = [];

  for (const l of listing) {
    const matched: MarketplaceSearchField[] = [];

    if (cocok(l.judul, kw)) matched.push('judul');

    const kategori = KATEGORI_MARKETPLACE.find((k) => k.uuid === l.kategoriUuid);
    if (cocok(kategori?.nama, kw)) matched.push('kategori');

    const subKategori = l.subKategoriUuid
      ? SUBKATEGORI_MARKETPLACE.find((s) => s.uuid === l.subKategoriUuid)
      : undefined;
    if (cocok(subKategori?.nama, kw)) matched.push('subKategori');

    if (cocok(l.brand, kw)) matched.push('brand');

    // "Jenis Ternak" untuk kategori Ternak dipetakan dari field jenisListing
    // yang sama dipakai untuk seluruh kategori lain sebagai "Jenis Listing".
    if (cocok(l.jenisListing, kw)) matched.push('jenisTernak');

    if (cocok(l.kabupaten, kw)) matched.push('kabupaten');
    if (cocok(l.provinsi, kw)) matched.push('provinsi');
    if (cocok(l.workspaceNama, kw)) matched.push('workspace');

    if (matched.length > 0) results.push({ listing: l, matchedFields: matched });
  }

  return results;
}
