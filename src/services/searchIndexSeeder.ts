// ─── Search Index Seeder ───────────────────────────────────────────────────────
// Seeds all in-memory data stores into the global search index.
// Idempotent — uses rebuildIndex() which upserts (insert-or-update).
// Call after data stores are populated (e.g. after devAutoSeed runs).
//
// ENTITY TYPES INDEXED:
//   LIVESTOCK  — from LIVESTOCK_DB (livestockData.ts)
//   BATCH      — from BATCH_DB (batchData.ts)
//   MARKETPLACE_LISTING — from getAllListing() (marketplaceListingData.ts)
//   MEDICINE   — from getObatList() (obatData.ts)
//   NEWS/EVENT — from getAllNewsEvent() (newsEventData.ts)
//   EVIDENCE   — penyakit/diseases from getAllPenyakit() (daftarPenyakitData.ts)

import {
  SEARCH_ENTITY_TYPE_UUID,
  rebuildIndex,
  type IndexEntityInput,
} from './globalSearchService';
import { LIVESTOCK_DB } from '../data/livestockData';
import { BATCH_DB } from '../data/batchData';
import { getAllListing } from '../data/marketplaceListingData';
import { getObatList } from '../data/obatData';
import { getAllNewsEvent } from '../data/newsEventData';
import { getAllPenyakit } from '../data/daftarPenyakitData';

let _seeded = false;

/**
 * Seeds all in-memory data stores into the global search index.
 * Idempotent — safe to call multiple times. Use `force = true` to rebuild
 * after data has changed (e.g. after clear + re-seed).
 */
export function seedSearchIndex(force = false): void {
  if (_seeded && !force) return;
  _seeded = true;

  const entries: IndexEntityInput[] = [];

  // ── Livestock ──────────────────────────────────────────────────────────────
  for (const animal of Object.values(LIVESTOCK_DB)) {
    entries.push({
      entity_type_reference_uuid: SEARCH_ENTITY_TYPE_UUID.LIVESTOCK,
      entity_uuid: animal.id,
      workspace_uuid: null,
      title: animal.name ? `${animal.name} — ${animal.id}` : animal.id,
      subtitle: `${animal.type} · ${animal.ras} · ${animal.kelamin} · ${animal.status}`,
      keywords: [
        animal.type.toLowerCase(),
        animal.ras.toLowerCase(),
        animal.kelamin.toLowerCase(),
        animal.status.toLowerCase(),
        animal.program.toLowerCase(),
        animal.id.toLowerCase(),
      ].filter(Boolean),
      searchable_text: [
        animal.name,
        animal.id,
        animal.location,
        animal.program,
        animal.ras,
        animal.type,
      ]
        .filter(Boolean)
        .join(' '),
    });
  }

  // ── Batches ────────────────────────────────────────────────────────────────
  for (const batch of Object.values(BATCH_DB)) {
    entries.push({
      entity_type_reference_uuid: SEARCH_ENTITY_TYPE_UUID.BATCH,
      entity_uuid: batch.id,
      workspace_uuid: null,
      title: batch.label,
      subtitle: `${batch.livestockType} · ${batch.status}`,
      keywords: [
        batch.livestockType.toLowerCase(),
        batch.status.toLowerCase(),
        batch.label.toLowerCase(),
        batch.id.toLowerCase(),
      ].filter(Boolean),
      searchable_text: [
        batch.label,
        batch.description,
        batch.purpose,
        batch.location,
        batch.id,
      ]
        .filter(Boolean)
        .join(' '),
    });
  }

  // ── Marketplace Listings ───────────────────────────────────────────────────
  for (const listing of getAllListing()) {
    entries.push({
      entity_type_reference_uuid: SEARCH_ENTITY_TYPE_UUID.MARKETPLACE_LISTING,
      entity_uuid: listing.uuid,
      workspace_uuid: listing.workspaceId,
      title: listing.judul,
      subtitle: `${listing.kabupaten}, ${listing.provinsi}`,
      keywords: [
        listing.kategoriSlug,
        listing.jenisListing?.toLowerCase(),
        listing.brand?.toLowerCase(),
        listing.provinsi?.toLowerCase(),
        listing.kabupaten?.toLowerCase(),
        listing.workspaceNama?.toLowerCase(),
      ].filter(Boolean) as string[],
      searchable_text: [
        listing.judul,
        listing.workspaceNama,
        listing.jenisListing,
        listing.brand,
        listing.kabupaten,
        listing.provinsi,
        listing.deskripsi,
      ]
        .filter(Boolean)
        .join(' '),
    });
  }

  // ── Master Obat ────────────────────────────────────────────────────────────
  for (const obat of getObatList()) {
    entries.push({
      entity_type_reference_uuid: SEARCH_ENTITY_TYPE_UUID.MEDICINE,
      entity_uuid: obat.uuid,
      workspace_uuid: null,
      title: obat.namaGenerik,
      subtitle: obat.kategoriSlug,
      keywords: [obat.kategoriSlug, obat.namaGenerik.toLowerCase(), obat.id.toLowerCase()].filter(
        Boolean,
      ),
      searchable_text: [obat.namaGenerik, obat.namaLatin, obat.kategoriSlug, obat.id]
        .filter(Boolean)
        .join(' '),
    });
  }

  // ── News & Events ──────────────────────────────────────────────────────────
  for (const item of getAllNewsEvent()) {
    const isEvent = item.tipeKonten === 'Event';
    entries.push({
      entity_type_reference_uuid: isEvent
        ? SEARCH_ENTITY_TYPE_UUID.EVENT
        : SEARCH_ENTITY_TYPE_UUID.NEWS,
      entity_uuid: item.id,
      workspace_uuid: item.workspaceId ?? null,
      title: item.judul,
      subtitle: item.sumberPublikasi ?? null,
      keywords: [
        item.tipeKonten?.toLowerCase(),
        ...(item.kategori ?? []).map((k) => String(k).toLowerCase()),
        ...(item.tag ?? []).map((t) => t.toLowerCase()),
      ].filter(Boolean) as string[],
      searchable_text: [item.judul, item.ringkasan, item.publisher?.nama, item.sumberPublikasi]
        .filter(Boolean)
        .join(' '),
    });
  }

  // ── Penyakit / Diseases ────────────────────────────────────────────────────
  for (const p of getAllPenyakit()) {
    entries.push({
      entity_type_reference_uuid: SEARCH_ENTITY_TYPE_UUID.EVIDENCE,
      entity_uuid: p.uuid,
      workspace_uuid: null,
      title: p.namaPenyakit,
      subtitle: p.namaIlmiah ?? p.kategoriSlug,
      keywords: [
        p.kategoriSlug,
        ...p.jenisTernak,
        p.tingkatKeparahan.toLowerCase(),
        p.tingkatPenularan.toLowerCase(),
        p.namaPenyakit.toLowerCase(),
      ],
      searchable_text: [
        p.namaPenyakit,
        p.namaIlmiah,
        p.ringkasan,
        p.kategoriSlug,
        ...p.jenisTernak,
      ]
        .filter(Boolean)
        .join(' '),
    });
  }

  rebuildIndex(entries);
}
