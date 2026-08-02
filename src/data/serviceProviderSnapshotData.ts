// ─── Service Provider Snapshot — APP-CHAIN-003 ────────────────────────────────
//
// Immutable capture of service provider identity at the moment a provider
// joins a Transaction Room.
//
// Architecture rules:
//  - One snapshot per (chatId × serviceRole).  First-write-wins — subsequent
//    calls for the same key are silent no-ops.  This guarantees history
//    immutability even if the Workspace is renamed or deleted later.
//  - Source chain enforced here:
//      Marketplace Listing → listingId → workspaceId → Workspace identity
//  - Escrow is a Platform Service — it NEVER has a Marketplace snapshot.
//  - Receipt and history pages MUST read from this store instead of the live
//    WORKSPACES constant when resolving service-provider names/icons.

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Service roles that can have a Marketplace-sourced provider.
 * Escrow is excluded — it is always a Platform Service.
 */
export type SnapshotServiceRole = 'Transport' | 'Veterinarian' | 'Clinic' | 'Other';

export type ProviderType = 'Transport' | 'Dokter Hewan' | 'Klinik Hewan' | 'Lainnya';

export interface ServiceProviderSnapshot {
  // ── Transaction linkage ──────────────────────────────────────────────────
  chatId:      string;
  serviceRole: SnapshotServiceRole;

  // ── Marketplace Listing source (spec: store listingId) ───────────────────
  /** UUID of the Marketplace Listing that introduced this provider. */
  listingId:          string;
  listingTitle:       string;
  listingKategoriSlug: string;

  // ── Workspace provider identity — captured once, never updated ───────────
  workspaceId:   string;
  workspaceName: string;
  workspaceIcon: string;
  workspaceType: string;
  providerType:  ProviderType;

  // ── Optional enrichment copied from the listing at capture time ──────────
  verificationStatus?: string;
  rating?:             number;
  serviceArea?:        string;

  // ── Immutability metadata ────────────────────────────────────────────────
  capturedAt: string;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────

/** Key format: `${chatId}::${serviceRole}` */
const SNAPSHOT_STORE = new Map<string, ServiceProviderSnapshot>();

function makeKey(chatId: string, serviceRole: string): string {
  return `${chatId}::${serviceRole}`;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Record an immutable provider snapshot.
 *
 * First-write-wins — if a snapshot already exists for this chatId+serviceRole
 * the call is a silent no-op.  This protects history from later mutations
 * (Workspace renames, logo changes, rating updates).
 */
export function captureProviderSnapshot(snapshot: ServiceProviderSnapshot): void {
  const key = makeKey(snapshot.chatId, snapshot.serviceRole);
  if (!SNAPSHOT_STORE.has(key)) {
    // Freeze ensures no accidental mutation from the outside.
    SNAPSHOT_STORE.set(key, Object.freeze({ ...snapshot }));
  }
}

// ─── Getters ──────────────────────────────────────────────────────────────────

/**
 * Retrieve the immutable snapshot for a service role in a Transaction Room.
 * Returns undefined if no provider was ever confirmed for this role.
 */
export function getProviderSnapshot(
  chatId: string,
  serviceRole: string,
): ServiceProviderSnapshot | undefined {
  return SNAPSHOT_STORE.get(makeKey(chatId, serviceRole));
}

/**
 * All provider snapshots recorded for a Transaction Room.
 * Useful for the receipt's "Selected Services" card.
 */
export function getProviderSnapshotsByChatId(chatId: string): ServiceProviderSnapshot[] {
  return Array.from(SNAPSHOT_STORE.values()).filter(s => s.chatId === chatId);
}
