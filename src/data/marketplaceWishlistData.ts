// ─── Marketplace — Wishlist Pembeli ──────────────────────────────────────────
// In-memory wishlist per workspace. Lazy-seeded saat pertama kali diakses.
// Tidak ada persistensi lintas sesi (prototipe in-memory).

import { generateUUID } from '../utils/uuid';
import { getAllListing } from './marketplaceListingData';

// ─── Tipe ─────────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  listingUuid: string;
  workspaceId: string;
  addedAt: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const WISHLIST: WishlistItem[] = [];
const _seeded = new Set<string>();

function ensureSeeded(workspaceId: string): void {
  if (_seeded.has(workspaceId)) return;
  _seeded.add(workspaceId);

  // Seed: ambil 3 listing Aktif dari workspace lain sebagai contoh wishlist
  const candidates = getAllListing().filter(
    l => l.workspaceId !== workspaceId && l.status === 'Aktif',
  );
  const pick = candidates.slice(0, 3);
  for (const l of pick) {
    WISHLIST.push({
      id: generateUUID(),
      listingUuid: l.uuid,
      workspaceId,
      addedAt: '2026-07-10T08:00:00.000Z',
    });
  }
}

// ─── Query ────────────────────────────────────────────────────────────────────

export function getWishlistByWorkspace(workspaceId: string): WishlistItem[] {
  ensureSeeded(workspaceId);
  return WISHLIST.filter(w => w.workspaceId === workspaceId);
}

export function isInWishlist(workspaceId: string, listingUuid: string): boolean {
  ensureSeeded(workspaceId);
  return WISHLIST.some(w => w.workspaceId === workspaceId && w.listingUuid === listingUuid);
}

// ─── Mutasi ───────────────────────────────────────────────────────────────────

export function addToWishlist(workspaceId: string, listingUuid: string): void {
  ensureSeeded(workspaceId);
  if (isInWishlist(workspaceId, listingUuid)) return;
  WISHLIST.push({
    id: generateUUID(),
    listingUuid,
    workspaceId,
    addedAt: new Date().toISOString(),
  });
}

export function removeFromWishlist(workspaceId: string, listingUuid: string): void {
  ensureSeeded(workspaceId);
  const idx = WISHLIST.findIndex(
    w => w.workspaceId === workspaceId && w.listingUuid === listingUuid,
  );
  if (idx !== -1) WISHLIST.splice(idx, 1);
}
