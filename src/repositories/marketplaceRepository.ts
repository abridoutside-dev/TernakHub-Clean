// ─── Marketplace Repository — FLOW-003M27 ────────────────────────────────────
//
// Raw Supabase access for the Marketplace module.
// Tables covered:
//   marketplace_listings, marketplace_transactions, marketplace_negotiations,
//   marketplace_chat_rooms, marketplace_chat_messages, marketplace_wishlists,
//   marketplace_moderations
//
// Rules:
//  - All write functions call requireAuthSession() before the Supabase call.
//  - Read functions are intentionally un-gated so the public explorer works.
//  - Business logic lives in marketplaceService.ts, not here.
//  - Never import from pages, components, or contexts.
//
// DB schema: supabase/migrations/20260725000007_feed_marketplace.sql
//             supabase/migrations/20260725000008_transaction_services.sql

import { supabase } from '../lib/supabase';
import { requireAuthSession } from '../lib/authSession';

// ─── Error type ───────────────────────────────────────────────────────────────

export class MarketplaceRepoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketplaceRepoError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DB ROW TYPES — READ
// ═══════════════════════════════════════════════════════════════════════════════

export interface MarketplaceListingDbRow {
  id: string;
  workspace_id: string;
  kategori_slug: string;
  title: string;
  description: string | null;
  price: number;
  status: string;
  condition: string | null;
  location: string | null;
  province: string | null;
  asset_type: string | null;
  asset_ref_id: string | null;
  asset_metadata: Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceTransaksiDbRow {
  id: string;
  listing_id: string;
  buyer_workspace_id: string;
  seller_workspace_id: string;
  agreed_price: number;
  status: string;
  notes: string | null;
  asset_synced: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  /** Extra fields stored in jsonb via service layer */
  metadata: Record<string, unknown> | null;
}

export interface MarketplaceNegosiasiDbRow {
  id: string;
  listing_id: string;
  buyer_workspace_id: string;
  seller_workspace_id: string;
  offered_price: number;
  counter_price: number | null;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
  /** Extra fields stored in jsonb via service layer */
  metadata: Record<string, unknown> | null;
}

export interface MarketplaceChatRoomDbRow {
  id: string;
  listing_id: string;
  buyer_workspace_id: string;
  seller_workspace_id: string;
  status: string;
  unread_buyer: number;
  unread_seller: number;
  last_message_at: string | null;
  created_at: string;
}

export interface MarketplaceChatMessageDbRow {
  id: string;
  room_id: string;
  sender_workspace_id: string;
  sender_role: 'Pembeli' | 'Penjual';
  message_type: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
}

export interface MarketplaceWishlistDbRow {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// READ FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Listings ─────────────────────────────────────────────────────────────────

/** Fetches all listings owned by a workspace (Listing Saya). */
export async function repoGetListingsByWorkspace(
  workspaceId: string,
): Promise<MarketplaceListingDbRow[]> {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .select(
      'id,workspace_id,kategori_slug,title,description,price,status,condition,location,province,asset_type,asset_ref_id,asset_metadata,published_at,created_at,updated_at',
    )
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  if (error) throw new MarketplaceRepoError(error.message);
  return (data ?? []) as MarketplaceListingDbRow[];
}

// ─── Transactions ─────────────────────────────────────────────────────────────

/**
 * Fetches transactions where this workspace is the buyer OR seller.
 * Supabase does not support OR on different columns easily; we union two queries.
 */
export async function repoGetTransaksiByWorkspace(
  workspaceId: string,
): Promise<MarketplaceTransaksiDbRow[]> {
  const [{ data: asSeller, error: e1 }, { data: asBuyer, error: e2 }] = await Promise.all([
    supabase
      .from('marketplace_transactions')
      .select('id,listing_id,buyer_workspace_id,seller_workspace_id,agreed_price,status,notes,asset_synced,completed_at,created_at,updated_at,metadata')
      .eq('seller_workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
    supabase
      .from('marketplace_transactions')
      .select('id,listing_id,buyer_workspace_id,seller_workspace_id,agreed_price,status,notes,asset_synced,completed_at,created_at,updated_at,metadata')
      .eq('buyer_workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
  ]);
  if (e1) throw new MarketplaceRepoError(e1.message);
  if (e2) throw new MarketplaceRepoError(e2.message);

  // Deduplicate (a workspace can be both buyer and seller in theory — unlikely)
  const seen = new Set<string>();
  const combined: MarketplaceTransaksiDbRow[] = [];
  for (const row of [...(asSeller ?? []), ...(asBuyer ?? [])]) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      combined.push(row as MarketplaceTransaksiDbRow);
    }
  }
  return combined;
}

// ─── Negotiations ─────────────────────────────────────────────────────────────

export async function repoGetNegosiasiByWorkspace(
  workspaceId: string,
): Promise<MarketplaceNegosiasiDbRow[]> {
  const [{ data: asSeller, error: e1 }, { data: asBuyer, error: e2 }] = await Promise.all([
    supabase
      .from('marketplace_negotiations')
      .select('id,listing_id,buyer_workspace_id,seller_workspace_id,offered_price,counter_price,status,message,created_at,updated_at,metadata')
      .eq('seller_workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
    supabase
      .from('marketplace_negotiations')
      .select('id,listing_id,buyer_workspace_id,seller_workspace_id,offered_price,counter_price,status,message,created_at,updated_at,metadata')
      .eq('buyer_workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
  ]);
  if (e1) throw new MarketplaceRepoError(e1.message);
  if (e2) throw new MarketplaceRepoError(e2.message);

  const seen = new Set<string>();
  const combined: MarketplaceNegosiasiDbRow[] = [];
  for (const row of [...(asSeller ?? []), ...(asBuyer ?? [])]) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      combined.push(row as MarketplaceNegosiasiDbRow);
    }
  }
  return combined;
}

// ─── Chat Rooms ───────────────────────────────────────────────────────────────

export async function repoGetChatRoomsByWorkspace(
  workspaceId: string,
): Promise<MarketplaceChatRoomDbRow[]> {
  const [{ data: asSeller, error: e1 }, { data: asBuyer, error: e2 }] = await Promise.all([
    supabase
      .from('marketplace_chat_rooms')
      .select('id,listing_id,buyer_workspace_id,seller_workspace_id,status,unread_buyer,unread_seller,last_message_at,created_at')
      .eq('seller_workspace_id', workspaceId)
      .order('last_message_at', { ascending: false }),
    supabase
      .from('marketplace_chat_rooms')
      .select('id,listing_id,buyer_workspace_id,seller_workspace_id,status,unread_buyer,unread_seller,last_message_at,created_at')
      .eq('buyer_workspace_id', workspaceId)
      .order('last_message_at', { ascending: false }),
  ]);
  if (e1) throw new MarketplaceRepoError(e1.message);
  if (e2) throw new MarketplaceRepoError(e2.message);

  const seen = new Set<string>();
  const combined: MarketplaceChatRoomDbRow[] = [];
  for (const row of [...(asSeller ?? []), ...(asBuyer ?? [])]) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      combined.push(row as MarketplaceChatRoomDbRow);
    }
  }
  return combined;
}

export async function repoGetChatMessagesByRoom(
  roomId: string,
): Promise<MarketplaceChatMessageDbRow[]> {
  const { data, error } = await supabase
    .from('marketplace_chat_messages')
    .select('id,room_id,sender_workspace_id,sender_role,message_type,content,is_read,created_at')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });
  if (error) throw new MarketplaceRepoError(error.message);
  return (data ?? []) as MarketplaceChatMessageDbRow[];
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

/** Note: DB schema uses user_id (auth.users), not workspace_id. */
export async function repoGetWishlistByUser(
  userId: string,
): Promise<MarketplaceWishlistDbRow[]> {
  const { data, error } = await supabase
    .from('marketplace_wishlists')
    .select('id,user_id,listing_id,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new MarketplaceRepoError(error.message);
  return (data ?? []) as MarketplaceWishlistDbRow[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// WRITE INPUT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface MarketplaceListingInsert {
  id: string;                         // in-memory UUID (stable seed or runtime)
  workspace_id: string;               // Supabase workspace UUID
  kategori_slug: string;
  title: string;
  description: string | null;
  price: number;
  status: string;
  condition: string | null;
  location: string | null;
  province: string | null;
  asset_type: string | null;
  asset_ref_id: string | null;        // null for non-UUID sumberIds
  asset_metadata: Record<string, unknown>;  // all other denormalized fields
  published_at: string | null;
}

export interface MarketplaceTransaksiInsert {
  id: string;                         // in-memory nomor (TRX-YYYYMMDD-NNN) — used as metadata; DB uses gen_random_uuid()
  listing_id: string;                 // Supabase listing UUID
  buyer_workspace_id: string;
  seller_workspace_id: string;
  agreed_price: number;
  status: string;
  notes: string | null;
  metadata: Record<string, unknown>;  // extra fields: qty, satuanHarga, etc.
}

export interface MarketplaceNegosiasiInsert {
  listing_id: string;
  buyer_workspace_id: string;
  seller_workspace_id: string;
  offered_price: number;
  counter_price: number | null;
  status: string;
  message: string | null;
  metadata: Record<string, unknown>;  // extra fields: qty, id(NEG-NNN), etc.
}

export interface MarketplaceChatRoomInsert {
  listing_id: string;
  buyer_workspace_id: string;
  seller_workspace_id: string;
}

export interface MarketplaceChatMessageInsert {
  room_id: string;
  sender_workspace_id: string;
  sender_role: 'Pembeli' | 'Penjual';
  message_type: string;
  content: string;
}

export interface MarketplaceWishlistInsert {
  user_id: string;
  listing_id: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WRITE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function repoInsertListing(
  input: MarketplaceListingInsert,
): Promise<{ data: { id: string } | null; error: string | null }> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert({
      id:             input.id,
      workspace_id:   input.workspace_id,
      kategori_slug:  input.kategori_slug,
      title:          input.title,
      description:    input.description,
      price:          input.price,
      status:         input.status,
      condition:      input.condition,
      location:       input.location,
      province:       input.province,
      asset_type:     input.asset_type,
      asset_ref_id:   input.asset_ref_id,
      asset_metadata: input.asset_metadata,
      published_at:   input.published_at,
    })
    .select('id')
    .single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function repoUpdateListingStatus(
  id: string,
  status: string,
): Promise<{ error: string | null }> {
  await requireAuthSession();
  const { error } = await supabase
    .from('marketplace_listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function repoUpdateListing(
  id: string,
  patch: Partial<Pick<MarketplaceListingInsert, 'price' | 'description' | 'condition' | 'location' | 'province' | 'status' | 'asset_metadata'>>,
): Promise<{ error: string | null }> {
  await requireAuthSession();
  const { error } = await supabase
    .from('marketplace_listings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ─── Transactions ─────────────────────────────────────────────────────────────

/**
 * Inserts a transaction row. Returns the Supabase-generated UUID.
 * The in-memory nomor (TRX-YYYYMMDD-NNN) is stored in `metadata`.
 */
export async function repoInsertTransaksi(
  input: MarketplaceTransaksiInsert,
): Promise<{ data: { id: string } | null; error: string | null }> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('marketplace_transactions')
    .insert({
      listing_id:          input.listing_id,
      buyer_workspace_id:  input.buyer_workspace_id,
      seller_workspace_id: input.seller_workspace_id,
      agreed_price:        input.agreed_price,
      status:              input.status,
      notes:               input.notes,
      metadata:            input.metadata,
    })
    .select('id')
    .single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function repoUpdateTransaksiStatus(
  supabaseId: string,
  status: string,
  extras: { asset_synced?: boolean; completed_at?: string } = {},
): Promise<{ error: string | null }> {
  await requireAuthSession();
  const { error } = await supabase
    .from('marketplace_transactions')
    .update({ status, updated_at: new Date().toISOString(), ...extras })
    .eq('id', supabaseId);
  if (error) return { error: error.message };
  return { error: null };
}

// ─── Negotiations ─────────────────────────────────────────────────────────────

export async function repoInsertNegosiasi(
  input: MarketplaceNegosiasiInsert,
): Promise<{ data: { id: string } | null; error: string | null }> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('marketplace_negotiations')
    .insert({
      listing_id:          input.listing_id,
      buyer_workspace_id:  input.buyer_workspace_id,
      seller_workspace_id: input.seller_workspace_id,
      offered_price:       input.offered_price,
      counter_price:       input.counter_price,
      status:              input.status,
      message:             input.message,
      metadata:            input.metadata,
    })
    .select('id')
    .single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function repoUpdateNegosiasiStatus(
  supabaseId: string,
  status: string,
  extras: { counter_price?: number } = {},
): Promise<{ error: string | null }> {
  await requireAuthSession();
  const { error } = await supabase
    .from('marketplace_negotiations')
    .update({ status, updated_at: new Date().toISOString(), ...extras })
    .eq('id', supabaseId);
  if (error) return { error: error.message };
  return { error: null };
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function repoInsertChatRoom(
  input: MarketplaceChatRoomInsert,
): Promise<{ data: { id: string } | null; error: string | null }> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('marketplace_chat_rooms')
    .insert({
      listing_id:          input.listing_id,
      buyer_workspace_id:  input.buyer_workspace_id,
      seller_workspace_id: input.seller_workspace_id,
    })
    .select('id')
    .single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function repoInsertChatMessage(
  input: MarketplaceChatMessageInsert,
): Promise<{ data: { id: string } | null; error: string | null }> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('marketplace_chat_messages')
    .insert({
      room_id:              input.room_id,
      sender_workspace_id:  input.sender_workspace_id,
      sender_role:          input.sender_role,
      message_type:         input.message_type,
      content:              input.content,
    })
    .select('id')
    .single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export async function repoInsertWishlist(
  input: MarketplaceWishlistInsert,
): Promise<{ data: { id: string } | null; error: string | null }> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('marketplace_wishlists')
    .insert({ user_id: input.user_id, listing_id: input.listing_id })
    .select('id')
    .single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function repoDeleteWishlist(
  userId: string,
  listingId: string,
): Promise<{ error: string | null }> {
  await requireAuthSession();
  const { error } = await supabase
    .from('marketplace_wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId);
  if (error) return { error: error.message };
  return { error: null };
}

// ─── listing_reports reads ────────────────────────────────────────────────────

export interface ListingReportDbRow {
  id: string;
  listing_id: string;
  reported_by_workspace_id: string | null;
  reported_by_user_id: string | null;
  reason: string | null;
  description: string | null;
  status: string;            // 'Pending' | 'Reviewed' | 'Resolved' | 'Dismissed'
  created_at: string;
  updated_at: string | null;
}

/** Semua laporan listing — untuk halaman admin Moderasi. */
export async function repoGetListingReports(
  listingId?: string,
): Promise<ListingReportDbRow[]> {
  let query = supabase
    .from('listing_reports')
    .select('id,listing_id,reported_by_workspace_id,reported_by_user_id,reason,description,status,created_at,updated_at')
    .order('created_at', { ascending: false });
  if (listingId) query = query.eq('listing_id', listingId);
  const { data, error } = await query;
  if (error) throw new MarketplaceRepoError(error.message);
  return (data ?? []) as ListingReportDbRow[];
}

// ─── v_marketplace_report_summary reads ───────────────────────────────────────

export interface MarketplaceReportSummaryRow {
  listing_id: string;
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  primary_reason: string | null;
  last_reported_at: string | null;
}

/** Ringkasan laporan per listing dari view v_marketplace_report_summary. */
export async function repoGetMarketplaceReportSummary(): Promise<MarketplaceReportSummaryRow[]> {
  const { data, error } = await supabase
    .from('v_marketplace_report_summary')
    .select('listing_id,total_reports,pending_reports,resolved_reports,primary_reason,last_reported_at');
  if (error) throw new MarketplaceRepoError(error.message);
  return (data ?? []) as MarketplaceReportSummaryRow[];
}

// ─── v_marketplace_listing_full reads ────────────────────────────────────────
// View yang menggabungkan marketplace_listings dengan data seller & workspace.

export interface MarketplaceListingFullRow {
  id: string;
  workspace_id: string | null;
  title: string | null;
  description: string | null;
  price: number | null;
  status: string | null;
  category: string | null;
  species: string | null;
  verification: string | null;
  location: string | null;
  province: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined seller / workspace fields
  seller_id: string | null;
  seller_name: string | null;
  seller_email: string | null;
  workspace_name: string | null;
  workspace_type: string | null;
  workspace_plan: string | null;
  workspace_verified: boolean | null;
}

/**
 * Semua listing lengkap dari v_marketplace_listing_full.
 * @param statusFilter Jika diisi, filter berdasarkan status listing.
 * @param limitRows    Batas baris yang diambil (default 200).
 */
export async function repoGetListingsFull(
  statusFilter?: string,
  limitRows = 200,
): Promise<MarketplaceListingFullRow[]> {
  let query = supabase
    .from('v_marketplace_listing_full')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limitRows);
  if (statusFilter) query = query.eq('status', statusFilter);
  const { data, error } = await query;
  if (error) throw new MarketplaceRepoError(error.message);
  return (data ?? []) as MarketplaceListingFullRow[];
}

// ─── v_marketplace_transaction_summary reads ──────────────────────────────────
// View yang merangkum total transaksi dan nilai transaksi platform.

export interface MarketplaceTransactionSummaryRow {
  total_transactions: number;
  completed_transactions: number;
  pending_transactions: number;
  total_value: number;
  avg_transaction_value: number | null;
}

/** Ringkasan agregat transaksi dari v_marketplace_transaction_summary. */
export async function repoGetTransactionSummary(): Promise<MarketplaceTransactionSummaryRow | null> {
  const { data, error } = await supabase
    .from('v_marketplace_transaction_summary')
    .select('*')
    .maybeSingle();
  if (error) throw new MarketplaceRepoError(error.message);
  return (data as MarketplaceTransactionSummaryRow | null);
}

// ─── Moderation reads ─────────────────────────────────────────────────────────

export interface MarketplaceModerasiDbRow {
  id: string;
  listing_id: string | null;
  reported_by_workspace_id: string | null;
  moderation_type: string | null;
  reason: string | null;
  status: string;            // 'Pending' | 'UnderReview' | 'Resolved' | 'Ditolak'
  action_taken: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

/** Seluruh kasus moderasi — untuk halaman admin Moderasi. */
export async function repoGetModerasiAll(): Promise<MarketplaceModerasiDbRow[]> {
  const { data, error } = await supabase
    .from('marketplace_moderations')
    .select('id,listing_id,reported_by_workspace_id,moderation_type,reason,status,action_taken,reviewed_by,reviewed_at,created_at')
    .order('created_at', { ascending: false });
  if (error) throw new MarketplaceRepoError(error.message);
  return (data ?? []) as MarketplaceModerasiDbRow[];
}

/** Laporan yang dikirim oleh workspace tertentu (sebagai pelapor). */
export async function repoGetLaporanByWorkspace(
  workspaceId: string,
): Promise<MarketplaceModerasiDbRow[]> {
  const { data, error } = await supabase
    .from('marketplace_moderations')
    .select('id,listing_id,reported_by_workspace_id,moderation_type,reason,status,action_taken,reviewed_by,reviewed_at,created_at')
    .eq('reported_by_workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  if (error) throw new MarketplaceRepoError(error.message);
  return (data ?? []) as MarketplaceModerasiDbRow[];
}

export async function repoUpdateModerasiStatus(
  id: string,
  status: string,
  actionTaken?: string,
): Promise<{ error: string | null }> {
  await requireAuthSession();
  const patch: Record<string, unknown> = { status };
  if (actionTaken !== undefined) patch['action_taken'] = actionTaken;
  const { error } = await supabase
    .from('marketplace_moderations')
    .update(patch)
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

// ─── Notifications reads ───────────────────────────────────────────────────────

export interface MarketplaceNotifikasiDbRow {
  id: string;
  recipient_user_id: string;
  recipient_workspace_id: string | null;
  notification_type: string;  // 'Info'|'Peringatan'|'Kritis'|'Transaksi'|'Sistem'|'Promosi'
  source_module: string | null;
  source_entity_id: string | null;
  title: string;
  message: string;
  icon: string | null;
  action_label: string | null;
  action_route: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/** Notifikasi untuk user tertentu, dibatasi ke workspace jika diberikan. */
export async function repoGetNotifikasiByUser(
  userId: string,
  workspaceId?: string,
): Promise<MarketplaceNotifikasiDbRow[]> {
  let query = supabase
    .from('notifications')
    .select('id,recipient_user_id,recipient_workspace_id,notification_type,source_module,source_entity_id,title,message,icon,action_label,action_route,is_read,read_at,created_at')
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (workspaceId) {
    query = query.eq('recipient_workspace_id', workspaceId);
  }

  const { data, error } = await query;
  if (error) throw new MarketplaceRepoError(error.message);
  return (data ?? []) as MarketplaceNotifikasiDbRow[];
}

export async function repoMarkNotifikasiRead(
  id: string,
): Promise<{ error: string | null }> {
  await requireAuthSession();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function repoMarkAllNotifikasiRead(
  userId: string,
  workspaceId?: string,
): Promise<{ error: string | null }> {
  await requireAuthSession();
  let query = supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_user_id', userId)
    .eq('is_read', false);
  if (workspaceId) {
    query = (query as typeof query).eq('recipient_workspace_id', workspaceId);
  }
  const { error } = await query;
  if (error) return { error: error.message };
  return { error: null };
}

// ─── Activity Log reads ────────────────────────────────────────────────────────

export interface MarketplaceActivityLogDbRow {
  id: string;
  workspace_id: string | null;
  domain: string;
  module: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  description: string | null;
  actor_id: string | null;
  metadata: Record<string, unknown> | null;
  status: string;
  severity: string;
  created_at: string;
}

/** Riwayat aktivitas marketplace untuk workspace tertentu. */
export async function repoGetActivityLogByWorkspace(
  workspaceId: string,
): Promise<MarketplaceActivityLogDbRow[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('id,workspace_id,domain,module,entity_type,entity_id,action,description,actor_id,metadata,status,severity,created_at')
    .eq('workspace_id', workspaceId)
    .eq('domain', 'marketplace')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new MarketplaceRepoError(error.message);
  return (data ?? []) as MarketplaceActivityLogDbRow[];
}

// ─── Moderation writes ─────────────────────────────────────────────────────────

export interface MarketplaceModerasiInsert {
  listing_id: string | null;
  reported_by_workspace_id: string | null;
  moderation_type: string | null;
  reason: string | null;
}

export async function repoInsertModerasi(
  input: MarketplaceModerasiInsert,
): Promise<{ data: { id: string } | null; error: string | null }> {
  await requireAuthSession();
  const { data, error } = await supabase
    .from('marketplace_moderations')
    .insert({
      listing_id:                input.listing_id,
      reported_by_workspace_id:  input.reported_by_workspace_id,
      moderation_type:           input.moderation_type,
      reason:                    input.reason,
    })
    .select('id')
    .single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
