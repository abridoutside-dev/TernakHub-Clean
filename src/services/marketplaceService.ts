// ─── Marketplace Service — FLOW-003M27 ───────────────────────────────────────
//
// Fire-and-forget Supabase dual-write for the Marketplace module.
// Called from pages after each successful in-memory mutation.
// Failure is logged but NEVER blocks the UI.
//
// Tables covered:
//   marketplace_listings       (insert, update status/fields)
//   marketplace_transactions   (insert, update status)
//   marketplace_negotiations   (insert, update status)
//   marketplace_chat_rooms     (insert)
//   marketplace_chat_messages  (insert)
//   marketplace_wishlists      (insert, delete)
//   marketplace_moderations    (insert)
//
// UUID Mapping:
//   In-memory listing UUIDs (stable seeds or runtime generateUUID()) are
//   registered in LISTING_SUPABASE_ID_MAP after insert.
//   Since we use the in-memory UUID as the DB id directly (repoInsertListing
//   passes `id: inMemoryId`), the map is identity: inMemoryId → inMemoryId.
//   Kept for architectural parity with other modules and to guard future
//   cases where the DB generates its own UUID.
//
//   Same pattern for transactions (stored as TRX-NNN nomor in metadata;
//   DB generates a UUID which we track in TRANSAKSI_SUPABASE_ID_MAP).
//
// Deferred:
//   - asset_ref_id: non-UUID sumberIds (e.g. 'rumput-gajah') cannot be stored
//     in the uuid column; stored as null with full detail in asset_metadata.
//     Fix requires schema change (asset_ref_id → text). (Defer class A)
//   - Wishlist DB uses user_id (auth.users), not workspace_id — pages that
//     call wishlist service must supply the auth user UUID.
//   - Chat message hydration per-room is on-demand (not pre-fetched by hook).

import {
  repoInsertListing,
  repoUpdateListingStatus,
  repoUpdateListing,
  repoInsertTransaksi,
  repoUpdateTransaksiStatus,
  repoInsertNegosiasi,
  repoUpdateNegosiasiStatus,
  repoInsertChatRoom,
  repoInsertChatMessage,
  repoInsertWishlist,
  repoDeleteWishlist,
  repoInsertModerasi,
  type MarketplaceListingInsert,
  type MarketplaceTransaksiInsert,
} from '../repositories/marketplaceRepository';
import type {
  MarketplaceListingDbRow,
  MarketplaceTransaksiDbRow,
  MarketplaceNegosiasiDbRow,
} from '../repositories/marketplaceRepository';
import type { ListingItem, UpdateListingInput } from '../data/marketplaceListingData';
import type { TransaksiItem } from '../data/marketplaceTransaksiData';
import type { NegosiasiItem, CreateNegosiasiInput } from '../data/marketplaceNegosiasiData';
import type { LaporanRecord } from '../data/marketplaceLaporanData';

// ═══════════════════════════════════════════════════════════════════════════════
// UUID MAPS
// ═══════════════════════════════════════════════════════════════════════════════

/** inMemoryId → supabaseId (identity for listings since we pass id explicitly) */
const LISTING_SUPABASE_ID_MAP = new Map<string, string>();
/** inMemoryNomor (TRX-NNN) → supabaseUUID */
const TRANSAKSI_SUPABASE_ID_MAP = new Map<string, string>();
/** inMemoryNomor (NEG-NNN) → supabaseUUID */
const NEGOSIASI_SUPABASE_ID_MAP = new Map<string, string>();
/** inMemoryChatId (CHAT-xxx) → supabaseUUID */
const CHAT_ROOM_SUPABASE_ID_MAP = new Map<string, string>();

export function getListingSupabaseId(inMemoryId: string): string | undefined {
  return LISTING_SUPABASE_ID_MAP.get(inMemoryId);
}

export function getTransaksiSupabaseId(inMemoryNomor: string): string | undefined {
  return TRANSAKSI_SUPABASE_ID_MAP.get(inMemoryNomor);
}

export function getNegosiasiSupabaseId(inMemoryNomor: string): string | undefined {
  return NEGOSIASI_SUPABASE_ID_MAP.get(inMemoryNomor);
}

// ─── Register after DB hydration ──────────────────────────────────────────────

/** Called by useMarketplace after populateListingsFromDb(). */
export function registerListingSupabaseIds(
  rows: ReadonlyArray<{ id: string }>,
): void {
  for (const row of rows) {
    if (!LISTING_SUPABASE_ID_MAP.has(row.id)) {
      LISTING_SUPABASE_ID_MAP.set(row.id, row.id);
    }
  }
}

/** Called by useMarketplace after populateTransaksiFromDb(). */
export function registerTransaksiSupabaseIds(
  rows: ReadonlyArray<MarketplaceTransaksiDbRow>,
): void {
  for (const row of rows) {
    // metadata.nomor is the in-memory TRX-NNN identifier
    const nomor = (row.metadata as Record<string, unknown> | null)?.['nomor'];
    if (typeof nomor === 'string' && !TRANSAKSI_SUPABASE_ID_MAP.has(nomor)) {
      TRANSAKSI_SUPABASE_ID_MAP.set(nomor, row.id);
    }
    // Also register by supabase id itself (identity)
    if (!TRANSAKSI_SUPABASE_ID_MAP.has(row.id)) {
      TRANSAKSI_SUPABASE_ID_MAP.set(row.id, row.id);
    }
  }
}

/** Called by useMarketplace after populateNegosiasiFromDb(). */
export function registerNegosiasiSupabaseIds(
  rows: ReadonlyArray<MarketplaceNegosiasiDbRow>,
): void {
  for (const row of rows) {
    const nomor = (row.metadata as Record<string, unknown> | null)?.['nomor'];
    if (typeof nomor === 'string' && !NEGOSIASI_SUPABASE_ID_MAP.has(nomor)) {
      NEGOSIASI_SUPABASE_ID_MAP.set(nomor, row.id);
    }
    if (!NEGOSIASI_SUPABASE_ID_MAP.has(row.id)) {
      NEGOSIASI_SUPABASE_ID_MAP.set(row.id, row.id);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Returns null for non-UUID sumberId values (e.g. 'rumput-gajah'). */
function toUuidOrNull(value: string): string | null {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return UUID_RE.test(value) ? value : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LISTING FIRE-AND-FORGET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Called by MarketplaceBuatListing after addListing() succeeds.
 * workspaceUuid = activeWorkspace.workspace_uuid (Supabase UUID, not legacy 'w1').
 */
export async function recordCreateListing(
  listing: ListingItem,
  workspaceUuid: string,
): Promise<void> {
  const input: MarketplaceListingInsert = {
    id:             listing.uuid,
    workspace_id:   workspaceUuid,
    kategori_slug:  listing.kategoriSlug,
    title:          listing.judul,
    description:    listing.deskripsi || null,
    price:          listing.harga,
    status:         listing.status,
    condition:      listing.kondisi ?? null,
    location:       listing.lokasi || null,
    province:       listing.provinsi || null,
    asset_type:     listing.sumber.modul,
    asset_ref_id:   toUuidOrNull(listing.sumber.sumberId),
    asset_metadata: {
      jenisListing:   listing.jenisListing,
      slug:           listing.slug,
      media:          listing.media,
      satuanHarga:    listing.satuanHarga,
      qtyDijual:      listing.qtyDijual,
      brand:          listing.brand,
      penjual:        listing.penjual,
      targetTernak:   listing.targetTernak,
      kabupaten:      listing.kabupaten,
      workspaceNama:  listing.workspaceNama,
      ownerId:        listing.ownerId,
      subKategoriUuid: listing.subKategoriUuid,
      subKategoriSlug: listing.subKategoriSlug,
      sumberId:       listing.sumber.sumberId, // full (possibly non-UUID) sumberId
    },
    published_at:   listing.publishedAt ? new Date(listing.publishedAt).toISOString() : null,
  };

  try {
    const { data, error } = await repoInsertListing(input);
    if (error) {
      console.warn('[marketplaceService] recordCreateListing failed:', error);
      return;
    }
    if (data) {
      LISTING_SUPABASE_ID_MAP.set(listing.uuid, data.id);
    }
  } catch (err) {
    console.warn('[marketplaceService] recordCreateListing exception:', err);
  }
}

/**
 * Called after updateListingStatus() / updateListing() succeeds.
 */
export async function recordUpdateListingStatus(
  inMemoryId: string,
  status: string,
): Promise<void> {
  const supabaseId = LISTING_SUPABASE_ID_MAP.get(inMemoryId);
  if (!supabaseId) return; // not yet in DB (seed data or unregistered)

  try {
    const { error } = await repoUpdateListingStatus(supabaseId, status);
    if (error) console.warn('[marketplaceService] recordUpdateListingStatus failed:', error);
  } catch (err) {
    console.warn('[marketplaceService] recordUpdateListingStatus exception:', err);
  }
}

/**
 * Called after updateListing() succeeds (price/deskripsi/media/lokasi changes).
 */
export async function recordUpdateListing(
  inMemoryId: string,
  patch: UpdateListingInput,
): Promise<void> {
  const supabaseId = LISTING_SUPABASE_ID_MAP.get(inMemoryId);
  if (!supabaseId) return;

  try {
    const dbPatch: Parameters<typeof repoUpdateListing>[1] = {};
    if (patch.harga !== undefined) dbPatch.price = patch.harga;
    if (patch.deskripsi !== undefined) dbPatch.description = patch.deskripsi;
    if (patch.provinsi !== undefined) dbPatch.province = patch.provinsi;
    if (patch.status !== undefined) dbPatch.status = patch.status;

    const { error } = await repoUpdateListing(supabaseId, dbPatch);
    if (error) console.warn('[marketplaceService] recordUpdateListing failed:', error);
  } catch (err) {
    console.warn('[marketplaceService] recordUpdateListing exception:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION FIRE-AND-FORGET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Called by MarketplaceBuatListing / addTransaksi callers after the
 * in-memory transaction is created.
 * listingSupabaseId: LISTING_SUPABASE_ID_MAP.get(transaksi.listingUuid)
 */
export async function recordCreateTransaksi(
  transaksi: TransaksiItem,
  listingSupabaseId: string,
  buyerWorkspaceUuid: string,
  sellerWorkspaceUuid: string,
): Promise<void> {
  const input: MarketplaceTransaksiInsert = {
    id:                  transaksi.id,
    listing_id:          listingSupabaseId,
    buyer_workspace_id:  buyerWorkspaceUuid,
    seller_workspace_id: sellerWorkspaceUuid,
    agreed_price:        transaksi.hargaSatuan,
    status:              transaksi.status,
    notes:               null,
    metadata: {
      nomor:             transaksi.id, // TRX-NNN
      qty:               transaksi.qty,
      satuanHarga:       transaksi.satuanHarga,
      total:             transaksi.total,
      judulListing:      transaksi.judulListing,
      namaPembeli:       transaksi.namaPembeli,
      namaPenjual:       transaksi.namaPenjual,
      workspaceNamaPembeli: transaksi.workspaceNamaPembeli,
      workspaceNamaPenjual: transaksi.workspaceNamaPenjual,
    },
  };

  try {
    const { data, error } = await repoInsertTransaksi(input);
    if (error) {
      console.warn('[marketplaceService] recordCreateTransaksi failed:', error);
      return;
    }
    if (data) {
      TRANSAKSI_SUPABASE_ID_MAP.set(transaksi.id, data.id);
    }
  } catch (err) {
    console.warn('[marketplaceService] recordCreateTransaksi exception:', err);
  }
}

/**
 * Called after any updateTransaksiStatus() call.
 */
export async function recordUpdateTransaksiStatus(
  inMemoryNomor: string,
  status: string,
  extras: { asset_synced?: boolean; completed_at?: string } = {},
): Promise<void> {
  const supabaseId = TRANSAKSI_SUPABASE_ID_MAP.get(inMemoryNomor);
  if (!supabaseId) return;

  try {
    const { error } = await repoUpdateTransaksiStatus(supabaseId, status, extras);
    if (error) console.warn('[marketplaceService] recordUpdateTransaksiStatus failed:', error);
  } catch (err) {
    console.warn('[marketplaceService] recordUpdateTransaksiStatus exception:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEGOTIATION FIRE-AND-FORGET
// ═══════════════════════════════════════════════════════════════════════════════

export async function recordCreateNegosiasi(
  negosiasi: NegosiasiItem,
  listingSupabaseId: string,
  buyerWorkspaceUuid: string,
  sellerWorkspaceUuid: string,
): Promise<void> {
  try {
    const { data, error } = await repoInsertNegosiasi({
      listing_id:          listingSupabaseId,
      buyer_workspace_id:  buyerWorkspaceUuid,
      seller_workspace_id: sellerWorkspaceUuid,
      offered_price:       negosiasi.hargaPenawaran,
      counter_price:       null,
      status:              mapNegosiasiStatus(negosiasi.status),
      message:             negosiasi.catatan ?? null,
      metadata: {
        nomor:             negosiasi.id, // NEG-NNN
        qty:               negosiasi.qtyPenawaran,
        hargaAwal:         negosiasi.hargaAwal,
        satuanHarga:       negosiasi.satuanHarga,
        judulListing:      negosiasi.judulListing,
        namaPembeli:       negosiasi.namaPembeli,
        namaPenjual:       negosiasi.namaPenjual,
      },
    });
    if (error) {
      console.warn('[marketplaceService] recordCreateNegosiasi failed:', error);
      return;
    }
    if (data) {
      NEGOSIASI_SUPABASE_ID_MAP.set(negosiasi.id, data.id);
    }
  } catch (err) {
    console.warn('[marketplaceService] recordCreateNegosiasi exception:', err);
  }
}

export async function recordUpdateNegosiasiStatus(
  inMemoryNomor: string,
  status: string,
  counterPrice?: number,
): Promise<void> {
  const supabaseId = NEGOSIASI_SUPABASE_ID_MAP.get(inMemoryNomor);
  if (!supabaseId) return;

  try {
    const { error } = await repoUpdateNegosiasiStatus(
      supabaseId,
      status,
      counterPrice !== undefined ? { counter_price: counterPrice } : {},
    );
    if (error) console.warn('[marketplaceService] recordUpdateNegosiasiStatus failed:', error);
  } catch (err) {
    console.warn('[marketplaceService] recordUpdateNegosiasiStatus exception:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT FIRE-AND-FORGET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Called after getOrCreateChat() creates a new room in-memory.
 * Caller must pass the Supabase UUIDs for listing, buyer, and seller workspaces.
 */
export async function recordCreateChatRoom(
  inMemoryChatId: string,
  listingSupabaseId: string,
  buyerWorkspaceUuid: string,
  sellerWorkspaceUuid: string,
): Promise<void> {
  try {
    const { data, error } = await repoInsertChatRoom({
      listing_id:          listingSupabaseId,
      buyer_workspace_id:  buyerWorkspaceUuid,
      seller_workspace_id: sellerWorkspaceUuid,
    });
    if (error) {
      console.warn('[marketplaceService] recordCreateChatRoom failed:', error);
      return;
    }
    if (data) {
      CHAT_ROOM_SUPABASE_ID_MAP.set(inMemoryChatId, data.id);
    }
  } catch (err) {
    console.warn('[marketplaceService] recordCreateChatRoom exception:', err);
  }
}

/**
 * Called after sendMessage() adds a message in-memory.
 */
export async function recordSendMessage(
  inMemoryChatId: string,
  senderWorkspaceUuid: string,
  senderRole: 'Pembeli' | 'Penjual',
  content: string,
): Promise<void> {
  const roomSupabaseId = CHAT_ROOM_SUPABASE_ID_MAP.get(inMemoryChatId);
  if (!roomSupabaseId) return; // room not yet in DB

  try {
    const { error } = await repoInsertChatMessage({
      room_id:             roomSupabaseId,
      sender_workspace_id: senderWorkspaceUuid,
      sender_role:         senderRole,
      message_type:        'Teks',
      content,
    });
    if (error) console.warn('[marketplaceService] recordSendMessage failed:', error);
  } catch (err) {
    console.warn('[marketplaceService] recordSendMessage exception:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WISHLIST FIRE-AND-FORGET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Called after addToWishlist() succeeds.
 * userId = currentUser?.id (Supabase auth.users UUID).
 * listingId = in-memory UUID of the listing (registered in LISTING_SUPABASE_ID_MAP).
 */
export async function recordAddToWishlist(
  userId: string,
  listingInMemoryId: string,
): Promise<void> {
  const listingSupabaseId = LISTING_SUPABASE_ID_MAP.get(listingInMemoryId);
  if (!listingSupabaseId) return; // listing not in DB

  try {
    const { error } = await repoInsertWishlist({ user_id: userId, listing_id: listingSupabaseId });
    if (error) console.warn('[marketplaceService] recordAddToWishlist failed:', error);
  } catch (err) {
    console.warn('[marketplaceService] recordAddToWishlist exception:', err);
  }
}

export async function recordRemoveFromWishlist(
  userId: string,
  listingInMemoryId: string,
): Promise<void> {
  const listingSupabaseId = LISTING_SUPABASE_ID_MAP.get(listingInMemoryId);
  if (!listingSupabaseId) return;

  try {
    const { error } = await repoDeleteWishlist(userId, listingSupabaseId);
    if (error) console.warn('[marketplaceService] recordRemoveFromWishlist failed:', error);
  } catch (err) {
    console.warn('[marketplaceService] recordRemoveFromWishlist exception:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODERATION / LAPORAN FIRE-AND-FORGET
// ═══════════════════════════════════════════════════════════════════════════════

export async function recordBuatLaporan(
  laporan: LaporanRecord,
  reporterWorkspaceUuid: string,
): Promise<void> {
  const listingSupabaseId = LISTING_SUPABASE_ID_MAP.get(laporan.listingUuid) ?? null;

  try {
    const { error } = await repoInsertModerasi({
      listing_id:                listingSupabaseId,
      reported_by_workspace_id:  reporterWorkspaceUuid,
      moderation_type:           laporan.alasan,
      reason:                    laporan.keterangan,
    });
    if (error) console.warn('[marketplaceService] recordBuatLaporan failed:', error);
  } catch (err) {
    console.warn('[marketplaceService] recordBuatLaporan exception:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Map in-memory NegosiasiStatus → negotiation_status_enum in DB */
function mapNegosiasiStatus(status: string): string {
  const map: Record<string, string> = {
    'Menunggu Respon Penjual': 'Pending',
    'Penawaran Balik':         'Counter',
    'Disetujui':               'Accepted',
    'Ditolak':                 'Rejected',
    'Dibatalkan Pembeli':      'Cancelled',
    'Kadaluarsa':              'Expired',
  };
  return map[status] ?? status;
}

// Re-export CreateNegosiasiInput for convenience
export type { CreateNegosiasiInput };
