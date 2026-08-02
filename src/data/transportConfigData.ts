// ─── FARM-FIX-005.7 — Transport Configuration & Workflow ──────────────────────
// Transport in Transaction Room is OPTIONAL.
// 4 modes: Marketplace Transport | External Transport | Seller Arranges | Buyer Pickup
// One mode active per chatId. Mode switching resets sub-mode state, preserves timeline.
//
// Architecture rules:
//  - Transport config keyed by chatId (one per Transaction Room).
//  - AI Context Engine reads deal/escrow/transport state + recent chat messages.
//    AI NEVER performs actions — only suggests.
//  - Smart events auto-generate on every status change.
//  - Live location uses browser Geolocation API (in-session only).

import { generateUUID } from '../utils/uuid';
import { WORKSPACES } from '../components/TopAppBar';
import { notifyOrchestrationMutation } from './orchestrationBus';
import { getAllListing } from './marketplaceListingData';
import { captureProviderSnapshot } from './serviceProviderSnapshotData';

// ─── Transport Mode ────────────────────────────────────────────────────────────

export type TransportMode =
  | 'Marketplace'    // Transport Workspace joins Transaction Room
  | 'External'       // External third-party transport
  | 'SellerArranges' // Seller manages transport independently
  | 'BuyerPickup';   // Buyer picks up directly

export const TRANSPORT_MODE_CONFIG: Record<
  TransportMode,
  { icon: string; label: string; description: string; color: string; bg: string }
> = {
  Marketplace:    { icon: '🚚', label: 'Transport Marketplace', description: 'Gunakan layanan Transport dari Marketplace TernakHub', color: '#2563eb', bg: 'rgba(37,99,235,0.09)' },
  External:       { icon: '🏢', label: 'Transport Eksternal',   description: 'Gunakan jasa pengiriman eksternal di luar Marketplace', color: '#d97706', bg: 'rgba(217,119,6,0.09)' },
  SellerArranges: { icon: '🏪', label: 'Seller Mengatur',       description: 'Penjual mengatur pengiriman secara mandiri', color: '#7c3aed', bg: 'rgba(124,58,237,0.09)' },
  BuyerPickup:    { icon: '🛒', label: 'Buyer Ambil Sendiri',   description: 'Pembeli mengambil barang langsung ke lokasi Penjual', color: '#16a34a', bg: 'rgba(22,163,74,0.09)' },
};

// ─── Marketplace Transport Status (13 from spec) ───────────────────────────────

export type MarketplaceTransportStatus =
  | 'Waiting Assignment'
  | 'Assigned'
  | 'Preparing Pickup'
  | 'Heading to Pickup'
  | 'Livestock Picked Up'
  | 'Loading'
  | 'Departed'
  | 'On The Way'
  | 'Stopping'
  | 'Near Destination'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled';

export const MARKETPLACE_TRANSPORT_STATUS_CONFIG: Record<
  MarketplaceTransportStatus,
  { icon: string; color: string; bg: string; label: string; description: string }
> = {
  'Waiting Assignment': { icon: '⏳', color: '#5d4037', bg: '#efebe9', label: 'Menunggu Penugasan', description: 'Menunggu Transport menerima penugasan.' },
  'Assigned':           { icon: '✅', color: '#1b7a43', bg: '#e8f5ee', label: 'Ditugaskan', description: 'Transporter menerima penugasan.' },
  'Preparing Pickup':   { icon: '🔧', color: '#1565c0', bg: '#e3f2fd', label: 'Persiapan Pickup', description: 'Transporter sedang mempersiapkan kendaraan.' },
  'Heading to Pickup':  { icon: '🗺️', color: '#e65100', bg: '#fff3e0', label: 'Menuju Lokasi Pickup', description: 'Kendaraan dalam perjalanan menuju titik penjemputan.' },
  'Livestock Picked Up':{ icon: '📦', color: '#6a1b9a', bg: '#f3e5f5', label: 'Ternak Dijemput', description: 'Ternak/barang telah dijemput dari Penjual.' },
  'Loading':            { icon: '🏗️', color: '#7b5e2a', bg: '#fff8e1', label: 'Loading', description: 'Ternak/barang sedang dimuat ke kendaraan.' },
  'Departed':           { icon: '🚀', color: '#006064', bg: '#e0f7fa', label: 'Berangkat', description: 'Kendaraan berangkat dari titik penjemputan.' },
  'On The Way':         { icon: '🚚', color: '#1565c0', bg: '#e3f2fd', label: 'Dalam Perjalanan', description: 'Kendaraan sedang dalam perjalanan menuju tujuan.' },
  'Stopping':           { icon: '⏸️', color: '#7b5e2a', bg: '#fff8e1', label: 'Berhenti', description: 'Kendaraan berhenti sementara.' },
  'Near Destination':   { icon: '📍', color: '#c62828', bg: '#ffebee', label: 'Mendekati Tujuan', description: 'Kendaraan mendekati lokasi tujuan.' },
  'Delivered':          { icon: '🏁', color: '#1b5e20', bg: '#e8f5ee', label: 'Terkirim', description: 'Ternak/barang telah tiba di tujuan.' },
  'Completed':          { icon: '🎉', color: '#1b5e20', bg: '#e8f5ee', label: 'Selesai', description: 'Pengiriman selesai dan dikonfirmasi oleh Buyer.' },
  'Cancelled':          { icon: '❌', color: '#c62828', bg: '#ffebee', label: 'Dibatalkan', description: 'Pengiriman dibatalkan.' },
};

export const TERMINAL_TRANSPORT_STATUSES = new Set<MarketplaceTransportStatus>([
  'Completed', 'Cancelled',
]);

/** Ordered status progression for Transport to advance */
export const TRANSPORT_STATUS_FLOW: MarketplaceTransportStatus[] = [
  'Waiting Assignment',
  'Assigned',
  'Preparing Pickup',
  'Heading to Pickup',
  'Livestock Picked Up',
  'Loading',
  'Departed',
  'On The Way',
  'Near Destination',
  'Delivered',
  'Completed',
];

// ─── Transport Evidence ────────────────────────────────────────────────────────

export interface TransportEvidence {
  id: string;
  phase: 'Pickup' | 'InTransit' | 'Delivery';
  type: 'Foto' | 'Video' | 'Lokasi' | 'Catatan';
  content: string;           // emoji/filename/text
  gps: string | null;        // location description
  timestamp: string;
  uploadedBy: string;
  recipientName: string | null;
}

// ─── Live Location ─────────────────────────────────────────────────────────────

export interface LiveLocationData {
  latitude: number | null;
  longitude: number | null;
  locationName: string;
  speed: number | null;             // km/h
  distanceRemaining: number | null; // km
  eta: string | null;               // human-readable e.g. "~2 jam"
  updatedAt: string;
  sharedBy: string;                 // workspaceId
  isActive: boolean;
}

// ─── Status History Entry ──────────────────────────────────────────────────────

export interface TransportStatusEntry {
  status: MarketplaceTransportStatus;
  timestamp: string;
  actor: string;
  note: string | null;
}

// ─── Marketplace Transport Data ────────────────────────────────────────────────

export interface MarketplaceTransportData {
  transportWorkspaceId: string | null;
  /**
   * UUID of the Marketplace Listing that sourced this Transport provider.
   * Populated automatically by setMarketplaceTransportWorkspace().
   * APP-CHAIN-003: Marketplace Listing → listingId → workspaceId → Provider.
   */
  listingId: string | null;
  tripId: string | null;
  status: MarketplaceTransportStatus;
  pickupEvidence: TransportEvidence[];
  deliveryEvidence: TransportEvidence[];
  liveLocation: LiveLocationData | null;
  buyerConfirmation: 'Pending' | 'Confirmed' | 'Disputed' | null;
  buyerNote: string | null;
  statusHistory: TransportStatusEntry[];
}

// ─── External Transport Info ───────────────────────────────────────────────────

export interface ExternalTransportInfo {
  companyName: string;
  driverName: string;
  vehicle: string;
  phone: string;
  receiptNumber: string | null;
  notes: string;
  pickupEvidence: TransportEvidence[];
  deliveryEvidence: TransportEvidence[];
  status: 'Configured' | 'Pickup Done' | 'In Transit' | 'Delivered' | 'Completed';
}

export const EXTERNAL_STATUS_CONFIG: Record<
  ExternalTransportInfo['status'],
  { icon: string; label: string; color: string; bg: string }
> = {
  Configured:    { icon: '⚙️', label: 'Dikonfigurasi', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  'Pickup Done': { icon: '📦', label: 'Pickup Selesai', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  'In Transit':  { icon: '🚚', label: 'Dalam Perjalanan', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  Delivered:     { icon: '🏁', label: 'Terkirim', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  Completed:     { icon: '🎉', label: 'Selesai', color: '#1b5e20', bg: 'rgba(27,94,32,0.1)' },
};

// ─── Buyer Pickup Info ─────────────────────────────────────────────────────────

export interface BuyerPickupInfo {
  scheduledDate: string | null;
  scheduledTime: string | null;
  notes: string;
  status: 'Scheduled' | 'Picked Up' | 'Confirmed';
  pickedUpAt: string | null;
  confirmedAt: string | null;
}

export const BUYER_PICKUP_STATUS_CONFIG: Record<
  BuyerPickupInfo['status'],
  { icon: string; label: string; color: string; bg: string }
> = {
  Scheduled:  { icon: '📅', label: 'Dijadwalkan', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  'Picked Up':{ icon: '🛒', label: 'Sudah Diambil', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  Confirmed:  { icon: '✅', label: 'Dikonfirmasi', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
};

// ─── Seller Arranges Info ──────────────────────────────────────────────────────

export interface SellerArrangesInfo {
  transportDescription: string;
  driverName: string | null;
  vehicle: string | null;
  phone: string | null;
  notes: string;
  evidence: TransportEvidence[];
  status: 'Arranging' | 'Dispatched' | 'Delivered' | 'Completed';
}

export const SELLER_ARRANGES_STATUS_CONFIG: Record<
  SellerArrangesInfo['status'],
  { icon: string; label: string; color: string; bg: string }
> = {
  Arranging:  { icon: '⚙️', label: 'Sedang Diatur', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  Dispatched: { icon: '🚀', label: 'Dikirim', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  Delivered:  { icon: '🏁', label: 'Terkirim', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  Completed:  { icon: '🎉', label: 'Selesai', color: '#1b5e20', bg: 'rgba(27,94,32,0.1)' },
};

// ─── Transport Timeline Event ──────────────────────────────────────────────────

export interface TransportTimelineEvent {
  id: string;
  eventType: string;
  description: string;
  actor: string;
  actorRole: string;
  timestamp: string;
  icon: string;
  category: 'Negotiation' | 'Payment' | 'Transport' | 'Delivery' | 'Completion';
}

// ─── Transport Config (main record) ───────────────────────────────────────────

export interface TransportConfig {
  chatId: string;
  mode: TransportMode | null;
  marketplace: MarketplaceTransportData | null;
  external: ExternalTransportInfo | null;
  buyerPickup: BuyerPickupInfo | null;
  sellerArranges: SellerArrangesInfo | null;
  timeline: TransportTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

// ─── AI Suggestion ────────────────────────────────────────────────────────────

export interface AISuggestion {
  id: string;
  icon: string;
  title: string;
  body: string;
  actionLabel: string;
  actionKey: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Transport' | 'Payment' | 'Negotiation' | 'Delivery' | 'General';
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────

const TRANSPORT_CONFIG_STORE = new Map<string, TransportConfig>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowTs(): string { return new Date().toISOString(); }

function resolveWsName(id: string): string {
  return WORKSPACES.find(w => w.id === id)?.name ?? id;
}

function makeEvidence(
  input: Omit<TransportEvidence, 'id' | 'timestamp'>,
): TransportEvidence {
  return { ...input, id: generateUUID(), timestamp: nowTs() };
}

function addTimelineEvent(
  config: TransportConfig,
  event: Omit<TransportTimelineEvent, 'id' | 'timestamp'> & { timestamp?: string },
): void {
  config.timeline.push({
    id: generateUUID(),
    timestamp: event.timestamp ?? nowTs(),
    eventType: event.eventType,
    description: event.description,
    actor: event.actor,
    actorRole: event.actorRole,
    icon: event.icon,
    category: event.category,
  });
  config.updatedAt = nowTs();
}

// ─── Getters ──────────────────────────────────────────────────────────────────

export function getTransportConfig(chatId: string): TransportConfig | undefined {
  return TRANSPORT_CONFIG_STORE.get(chatId);
}

export function getOrCreateTransportConfig(chatId: string): TransportConfig {
  let config = TRANSPORT_CONFIG_STORE.get(chatId);
  if (!config) {
    const ts = nowTs();
    config = {
      chatId,
      mode: null,
      marketplace: null,
      external: null,
      buyerPickup: null,
      sellerArranges: null,
      timeline: [],
      createdAt: ts,
      updatedAt: ts,
    };
    TRANSPORT_CONFIG_STORE.set(chatId, config);
  }
  return config;
}

/** Current status label for display in TransportBar */
export function getTransportStatusLabel(config: TransportConfig): string {
  if (!config.mode) return 'Belum Dikonfigurasi';
  switch (config.mode) {
    case 'Marketplace':
      return config.marketplace
        ? MARKETPLACE_TRANSPORT_STATUS_CONFIG[config.marketplace.status].label
        : 'Menunggu Penugasan';
    case 'External':
      return config.external
        ? EXTERNAL_STATUS_CONFIG[config.external.status].label
        : 'Belum Dikonfigurasi';
    case 'SellerArranges':
      return config.sellerArranges
        ? SELLER_ARRANGES_STATUS_CONFIG[config.sellerArranges.status].label
        : 'Sedang Diatur';
    case 'BuyerPickup':
      return config.buyerPickup
        ? BUYER_PICKUP_STATUS_CONFIG[config.buyerPickup.status].label
        : 'Dijadwalkan';
  }
}

// ─── Mutations — Mode ─────────────────────────────────────────────────────────

export function setTransportMode(
  chatId: string,
  mode: TransportMode,
  byWorkspaceId: string,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  const prev = config.mode;
  config.mode = mode;

  if (mode === 'Marketplace' && !config.marketplace) {
    config.marketplace = {
      transportWorkspaceId: null,
      listingId: null,      // populated by setMarketplaceTransportWorkspace()
      tripId: null,
      status: 'Waiting Assignment',
      pickupEvidence: [],
      deliveryEvidence: [],
      liveLocation: null,
      buyerConfirmation: null,
      buyerNote: null,
      statusHistory: [{
        status: 'Waiting Assignment',
        timestamp: nowTs(),
        actor: byWorkspaceId,
        note: 'Konfigurasi Transport Marketplace diaktifkan.',
      }],
    };
  }
  if (mode === 'External' && !config.external) {
    config.external = {
      companyName: '', driverName: '', vehicle: '', phone: '',
      receiptNumber: null, notes: '',
      pickupEvidence: [], deliveryEvidence: [],
      status: 'Configured',
    };
  }
  if (mode === 'BuyerPickup' && !config.buyerPickup) {
    config.buyerPickup = {
      scheduledDate: null, scheduledTime: null, notes: '',
      status: 'Scheduled', pickedUpAt: null, confirmedAt: null,
    };
  }
  if (mode === 'SellerArranges' && !config.sellerArranges) {
    config.sellerArranges = {
      transportDescription: '', driverName: null, vehicle: null,
      phone: null, notes: '', evidence: [], status: 'Arranging',
    };
  }

  const prevLabel = prev ? TRANSPORT_MODE_CONFIG[prev].label : null;
  const newLabel  = TRANSPORT_MODE_CONFIG[mode].label;

  addTimelineEvent(config, {
    eventType: 'Transport Mode Configured',
    description: prev
      ? `Mode transport diubah dari "${prevLabel}" ke "${newLabel}" oleh ${resolveWsName(byWorkspaceId)}.`
      : `Mode transport dikonfigurasi: "${newLabel}" oleh ${resolveWsName(byWorkspaceId)}.`,
    actor: byWorkspaceId,
    actorRole: 'Peserta',
    icon: TRANSPORT_MODE_CONFIG[mode].icon,
    category: 'Transport',
  });

  notifyOrchestrationMutation(chatId);
  return config;
}

// ─── Mutations — Marketplace Transport ────────────────────────────────────────

export function setMarketplaceTransportWorkspace(
  chatId: string,
  transportWorkspaceId: string,
  byWorkspaceId: string,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.marketplace) return config;
  config.marketplace.transportWorkspaceId = transportWorkspaceId;

  // ── Auto-resolve listingId from Marketplace (APP-CHAIN-003) ──────────────
  // Marketplace Listing is the source — never load directly from WORKSPACES.
  // First-write-wins in captureProviderSnapshot() guarantees history immutability.
  const transportListing = getAllListing().find(
    l => l.workspaceId === transportWorkspaceId && l.kategoriSlug === 'transportasi' && l.status === 'Aktif',
  );
  if (transportListing) {
    config.marketplace.listingId = transportListing.uuid;
    const meta = WORKSPACES.find(w => w.id === transportWorkspaceId);
    captureProviderSnapshot({
      chatId,
      serviceRole:         'Transport',
      listingId:           transportListing.uuid,
      listingTitle:        transportListing.judul,
      listingKategoriSlug: 'transportasi',
      workspaceId:         transportWorkspaceId,
      workspaceName:       transportListing.workspaceNama,
      workspaceIcon:       meta?.icon ?? '🚚',
      workspaceType:       meta?.type ?? 'Transporter',
      providerType:        'Transport',
      capturedAt:          nowTs(),
    });
  }

  config.updatedAt = nowTs();
  addTimelineEvent(config, {
    eventType: 'Transport Assigned',
    description: `${resolveWsName(transportWorkspaceId)} ditugaskan sebagai Transporter oleh ${resolveWsName(byWorkspaceId)}.`,
    actor: byWorkspaceId, actorRole: 'Peserta', icon: '🚚', category: 'Transport',
  });
  notifyOrchestrationMutation(chatId);
  return config;
}

export function updateMarketplaceTransportStatus(
  chatId: string,
  status: MarketplaceTransportStatus,
  byWorkspaceId: string,
  note: string | null = null,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.marketplace) return config;

  config.marketplace.status = status;
  config.marketplace.statusHistory.push({ status, timestamp: nowTs(), actor: byWorkspaceId, note });
  config.updatedAt = nowTs();

  const cfg = MARKETPLACE_TRANSPORT_STATUS_CONFIG[status];
  addTimelineEvent(config, {
    eventType: status,
    description: cfg.description + (note ? ` Catatan: ${note}` : ''),
    actor: byWorkspaceId, actorRole: 'Transport', icon: cfg.icon, category: 'Transport',
  });

  notifyOrchestrationMutation(chatId);
  return config;
}

export function addPickupEvidence(
  chatId: string,
  evidence: Omit<TransportEvidence, 'id' | 'timestamp'>,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.marketplace) return config;
  const ev = makeEvidence(evidence);
  config.marketplace.pickupEvidence.push(ev);
  config.updatedAt = nowTs();
  addTimelineEvent(config, {
    eventType: 'Pickup Evidence Added',
    description: `Bukti pickup (${evidence.type}) ditambahkan oleh ${resolveWsName(evidence.uploadedBy)}.`,
    actor: evidence.uploadedBy, actorRole: 'Transport', icon: '📷', category: 'Transport',
  });
  notifyOrchestrationMutation(chatId);
  return config;
}

export function addDeliveryEvidence(
  chatId: string,
  evidence: Omit<TransportEvidence, 'id' | 'timestamp'>,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.marketplace) return config;
  const ev = makeEvidence(evidence);
  config.marketplace.deliveryEvidence.push(ev);
  config.updatedAt = nowTs();
  addTimelineEvent(config, {
    eventType: 'Delivery Evidence Added',
    description: `Bukti pengiriman (${evidence.type}) ditambahkan oleh ${resolveWsName(evidence.uploadedBy)}.`,
    actor: evidence.uploadedBy, actorRole: 'Transport', icon: '📷', category: 'Delivery',
  });
  notifyOrchestrationMutation(chatId);
  return config;
}

export function setLiveLocation(
  chatId: string,
  location: Omit<LiveLocationData, 'updatedAt'>,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.marketplace) return config;
  config.marketplace.liveLocation = { ...location, updatedAt: nowTs() };
  config.updatedAt = nowTs();
  notifyOrchestrationMutation(chatId);
  return config;
}

export function clearLiveLocation(chatId: string): void {
  const config = TRANSPORT_CONFIG_STORE.get(chatId);
  if (!config?.marketplace) return;
  if (config.marketplace.liveLocation) {
    config.marketplace.liveLocation.isActive = false;
    config.marketplace.liveLocation.updatedAt = nowTs();
  }
  config.updatedAt = nowTs();
}

export function setBuyerConfirmation(
  chatId: string,
  decision: 'Confirmed' | 'Disputed',
  byWorkspaceId: string,
  note: string | null = null,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.marketplace) return config;
  config.marketplace.buyerConfirmation = decision;
  config.marketplace.buyerNote = note;
  config.updatedAt = nowTs();

  if (decision === 'Confirmed') {
    updateMarketplaceTransportStatus(chatId, 'Completed', byWorkspaceId, note);
    addTimelineEvent(config, {
      eventType: 'Buyer Confirmed Receipt',
      description: `Buyer ${resolveWsName(byWorkspaceId)} mengonfirmasi penerimaan barang/ternak.${note ? ` Catatan: ${note}` : ''}`,
      actor: byWorkspaceId, actorRole: 'Pembeli', icon: '✅', category: 'Completion',
    });
  } else {
    addTimelineEvent(config, {
      eventType: 'Buyer Reported Problem',
      description: `Buyer ${resolveWsName(byWorkspaceId)} melaporkan masalah pengiriman. Alasan: ${note ?? '—'}`,
      actor: byWorkspaceId, actorRole: 'Pembeli', icon: '⚠️', category: 'Delivery',
    });
  }

  notifyOrchestrationMutation(chatId);
  return config;
}

// ─── Mutations — External Transport ───────────────────────────────────────────

export function updateExternalTransportInfo(
  chatId: string,
  info: Partial<Omit<ExternalTransportInfo, 'pickupEvidence' | 'deliveryEvidence' | 'status'>>,
  byWorkspaceId: string,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.external) return config;
  Object.assign(config.external, info);
  config.updatedAt = nowTs();
  addTimelineEvent(config, {
    eventType: 'External Transport Updated',
    description: `Info transport eksternal diperbarui oleh ${resolveWsName(byWorkspaceId)}.`,
    actor: byWorkspaceId, actorRole: 'Peserta', icon: '🏢', category: 'Transport',
  });
  notifyOrchestrationMutation(chatId);
  return config;
}

export function updateExternalTransportStatus(
  chatId: string,
  status: ExternalTransportInfo['status'],
  byWorkspaceId: string,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.external) return config;
  config.external.status = status;
  config.updatedAt = nowTs();
  const cfg = EXTERNAL_STATUS_CONFIG[status];
  addTimelineEvent(config, {
    eventType: `External Transport: ${status}`,
    description: `Status transport eksternal: ${cfg.label} oleh ${resolveWsName(byWorkspaceId)}.`,
    actor: byWorkspaceId, actorRole: 'Peserta', icon: cfg.icon, category: status === 'Completed' ? 'Completion' : 'Transport',
  });
  notifyOrchestrationMutation(chatId);
  return config;
}

export function addExternalEvidence(
  chatId: string,
  phase: 'pickup' | 'delivery',
  evidence: Omit<TransportEvidence, 'id' | 'timestamp'>,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.external) return config;
  const ev = makeEvidence(evidence);
  if (phase === 'pickup') config.external.pickupEvidence.push(ev);
  else config.external.deliveryEvidence.push(ev);
  config.updatedAt = nowTs();
  addTimelineEvent(config, {
    eventType: `External ${phase === 'pickup' ? 'Pickup' : 'Delivery'} Evidence`,
    description: `Bukti ${phase === 'pickup' ? 'pickup' : 'pengiriman'} eksternal ditambahkan (${evidence.type}).`,
    actor: evidence.uploadedBy, actorRole: 'Peserta', icon: '📷',
    category: phase === 'pickup' ? 'Transport' : 'Delivery',
  });
  notifyOrchestrationMutation(chatId);
  return config;
}

// ─── Mutations — Buyer Pickup ──────────────────────────────────────────────────

export function updateBuyerPickupSchedule(
  chatId: string,
  info: { scheduledDate?: string | undefined; scheduledTime?: string | undefined; notes?: string },
  byWorkspaceId: string,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.buyerPickup) return config;
  Object.assign(config.buyerPickup, info);
  config.updatedAt = nowTs();
  addTimelineEvent(config, {
    eventType: 'Buyer Pickup Scheduled',
    description: `Jadwal pickup dikonfirmasi oleh ${resolveWsName(byWorkspaceId)}. Tanggal: ${config.buyerPickup.scheduledDate ?? '—'}.`,
    actor: byWorkspaceId, actorRole: 'Pembeli', icon: '📅', category: 'Transport',
  });
  notifyOrchestrationMutation(chatId);
  return config;
}

export function recordBuyerPickedUp(
  chatId: string,
  byWorkspaceId: string,
  note: string | null = null,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.buyerPickup) return config;
  const ts = nowTs();
  config.buyerPickup.status = 'Picked Up';
  config.buyerPickup.pickedUpAt = ts;
  config.updatedAt = ts;
  addTimelineEvent(config, {
    eventType: 'Buyer Picked Up',
    description: `Buyer ${resolveWsName(byWorkspaceId)} mengambil barang/ternak.${note ? ` Catatan: ${note}` : ''}`,
    actor: byWorkspaceId, actorRole: 'Pembeli', icon: '🛒', category: 'Delivery', timestamp: ts,
  });
  notifyOrchestrationMutation(chatId);
  return config;
}

export function confirmBuyerPickup(
  chatId: string,
  byWorkspaceId: string,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.buyerPickup) return config;
  const ts = nowTs();
  config.buyerPickup.status = 'Confirmed';
  config.buyerPickup.confirmedAt = ts;
  config.updatedAt = ts;
  addTimelineEvent(config, {
    eventType: 'Buyer Pickup Confirmed',
    description: `Pickup oleh Buyer dikonfirmasi oleh ${resolveWsName(byWorkspaceId)}.`,
    actor: byWorkspaceId, actorRole: 'Penjual', icon: '✅', category: 'Completion', timestamp: ts,
  });
  notifyOrchestrationMutation(chatId);
  return config;
}

// ─── Mutations — Seller Arranges ──────────────────────────────────────────────

export function updateSellerArrangesInfo(
  chatId: string,
  info: Partial<Omit<SellerArrangesInfo, 'evidence' | 'status'>>,
  byWorkspaceId: string,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.sellerArranges) return config;
  Object.assign(config.sellerArranges, info);
  config.updatedAt = nowTs();
  addTimelineEvent(config, {
    eventType: 'Seller Transport Updated',
    description: `Info pengiriman Seller diperbarui oleh ${resolveWsName(byWorkspaceId)}.`,
    actor: byWorkspaceId, actorRole: 'Penjual', icon: '🏪', category: 'Transport',
  });
  notifyOrchestrationMutation(chatId);
  return config;
}

export function updateSellerArrangesStatus(
  chatId: string,
  status: SellerArrangesInfo['status'],
  byWorkspaceId: string,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.sellerArranges) return config;
  config.sellerArranges.status = status;
  config.updatedAt = nowTs();
  const cfg = SELLER_ARRANGES_STATUS_CONFIG[status];
  addTimelineEvent(config, {
    eventType: `Seller Arranges: ${status}`,
    description: `Status pengiriman Seller: ${cfg.label} oleh ${resolveWsName(byWorkspaceId)}.`,
    actor: byWorkspaceId, actorRole: 'Penjual', icon: cfg.icon,
    category: status === 'Completed' ? 'Completion' : 'Transport',
  });
  notifyOrchestrationMutation(chatId);
  return config;
}

export function addSellerArrangesEvidence(
  chatId: string,
  evidence: Omit<TransportEvidence, 'id' | 'timestamp'>,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  if (!config.sellerArranges) return config;
  config.sellerArranges.evidence.push(makeEvidence(evidence));
  config.updatedAt = nowTs();
  addTimelineEvent(config, {
    eventType: 'Seller Transport Evidence',
    description: `Bukti pengiriman Seller ditambahkan (${evidence.type}).`,
    actor: evidence.uploadedBy, actorRole: 'Penjual', icon: '📷', category: 'Transport',
  });
  notifyOrchestrationMutation(chatId);
  return config;
}

// ─── Trip Edit Timeline Hook ──────────────────────────────────────────────────

export function logTripUpdated(
  chatId: string,
  byWorkspaceId: string,
  tripNumber: string,
): TransportConfig {
  const config = getOrCreateTransportConfig(chatId);
  addTimelineEvent(config, {
    eventType: 'Trip Updated',
    description: `Detail Trip ${tripNumber} diperbarui oleh ${resolveWsName(byWorkspaceId)}.`,
    actor: byWorkspaceId,
    actorRole: 'Transport',
    icon: '✏️',
    category: 'Transport',
  });
  notifyOrchestrationMutation(chatId);
  return config;
}

// ─── AI Context Engine ────────────────────────────────────────────────────────
//
// AI NEVER performs actions. AI ONLY suggests.
// Suggestions depend on: deal status, escrow status, transport state,
// current user role, AND recent chat messages (secondary keyword signal).

export interface AIContext {
  dealStatus: string | null;
  escrowStatus: string | null;
  transportMode: TransportMode | null;
  transportStatus: string | null;
  myRole: string | null;
  recentMessages: string[];
}

export function generateAISuggestions(ctx: AIContext): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const { dealStatus, escrowStatus, transportMode, transportStatus, myRole, recentMessages } = ctx;
  const msgText = recentMessages.join(' ').toLowerCase();

  // ── Deal-based ─────────────────────────────────────────────────────────────
  if (!dealStatus || dealStatus === 'Cancelled') {
    if (myRole === 'Pembeli' || myRole === 'Penjual') {
      suggestions.push({
        id: 'ai-create-deal', icon: '📋',
        title: 'Buat Proposal Deal',
        body: 'Belum ada Deal aktif. Buat proposal deal untuk memulai transaksi resmi.',
        actionLabel: 'Buat Deal', actionKey: 'open_deal', priority: 'High', category: 'Negotiation',
      });
    }
  }

  if (dealStatus === 'Locked' && !escrowStatus && (myRole === 'Pembeli' || myRole === 'Penjual')) {
    suggestions.push({
      id: 'ai-invite-escrow', icon: '🏦',
      title: 'Undang Layanan Escrow',
      body: 'Deal sudah dikunci. Undang Escrow untuk keamanan pembayaran.',
      actionLabel: 'Undang Escrow', actionKey: 'open_participants', priority: 'High', category: 'Payment',
    });
  }

  if (dealStatus === 'Locked' && !transportMode && (myRole === 'Pembeli' || myRole === 'Penjual')) {
    suggestions.push({
      id: 'ai-configure-transport', icon: '🚚',
      title: 'Konfigurasi Transport',
      body: 'Deal dikunci. Pilih metode pengiriman untuk melanjutkan transaksi.',
      actionLabel: 'Pilih Transport', actionKey: 'open_transport', priority: 'High', category: 'Transport',
    });
  }

  // ── Escrow-based ───────────────────────────────────────────────────────────
  if (escrowStatus === 'Waiting Buyer Payment' && myRole === 'Pembeli') {
    suggestions.push({
      id: 'ai-upload-payment', icon: '💳',
      title: 'Upload Bukti Pembayaran',
      body: 'Escrow menunggu bukti transfer dari Anda. Upload sekarang untuk melanjutkan.',
      actionLabel: 'Upload Bukti', actionKey: 'open_escrow', priority: 'High', category: 'Payment',
    });
  }

  if (escrowStatus === 'Holding Funds' && transportStatus === 'Completed') {
    suggestions.push({
      id: 'ai-escrow-release', icon: '💰',
      title: 'Pengiriman Selesai — Dana Siap Dirilis',
      body: 'Transport melaporkan pengiriman selesai dan Buyer konfirmasi. Escrow dapat merilis dana.',
      actionLabel: 'Kelola Escrow', actionKey: 'open_escrow', priority: 'High', category: 'Payment',
    });
  }

  // ── Transport-based ────────────────────────────────────────────────────────
  if (transportMode === 'Marketplace') {
    if (transportStatus === 'Waiting Assignment' && myRole === 'Transport') {
      suggestions.push({
        id: 'ai-accept-assignment', icon: '✅',
        title: 'Terima Penugasan Transport',
        body: 'Ada penugasan transport yang menunggu konfirmasi Anda.',
        actionLabel: 'Terima', actionKey: 'update_transport_status', priority: 'High', category: 'Transport',
      });
    }

    if ((transportStatus === 'Heading to Pickup' || transportStatus === 'Livestock Picked Up') && myRole === 'Transport') {
      suggestions.push({
        id: 'ai-upload-pickup-evidence', icon: '📷',
        title: 'Upload Bukti Pickup',
        body: 'Upload minimal 2 foto ternak/barang + GPS + nama penerima sebelum berangkat.',
        actionLabel: 'Upload Bukti Pickup', actionKey: 'upload_pickup_evidence', priority: 'High', category: 'Transport',
      });
    }

    if (transportStatus === 'On The Way' && myRole === 'Transport') {
      suggestions.push({
        id: 'ai-share-location', icon: '📍',
        title: 'Aktifkan Live Location',
        body: 'Buyer dan Seller dapat memantau posisi kendaraan secara real-time.',
        actionLabel: 'Aktifkan', actionKey: 'share_location', priority: 'Medium', category: 'Transport',
      });
    }

    if ((transportStatus === 'Delivered' || transportStatus === 'Near Destination') && myRole === 'Transport') {
      suggestions.push({
        id: 'ai-upload-delivery-evidence', icon: '📷',
        title: 'Upload Bukti Pengiriman',
        body: 'Upload minimal 2 foto bukti pengiriman + GPS + nama penerima untuk menyelesaikan delivery.',
        actionLabel: 'Upload Bukti Kirim', actionKey: 'upload_delivery_evidence', priority: 'High', category: 'Delivery',
      });
    }

    if (transportStatus === 'Delivered' && myRole === 'Pembeli') {
      suggestions.push({
        id: 'ai-confirm-receipt', icon: '✅',
        title: 'Konfirmasi Penerimaan Barang',
        body: 'Transport melaporkan barang sudah tiba. Konfirmasi penerimaan untuk merilis dana Escrow.',
        actionLabel: 'Konfirmasi', actionKey: 'open_transport', priority: 'High', category: 'Delivery',
      });
    }
  }

  // ── Keyword-based (secondary signal, only when role+status match) ──────────
  if ((msgText.includes('deal') || msgText.includes('harga') || msgText.includes('sepakat')) && !dealStatus) {
    const exists = suggestions.some(s => s.actionKey === 'open_deal');
    if (!exists && (myRole === 'Pembeli' || myRole === 'Penjual')) {
      suggestions.push({
        id: 'ai-keyword-deal', icon: '📋',
        title: 'Formalisasikan Kesepakatan',
        body: 'Terdeteksi diskusi harga. Buat Deal Proposal untuk mencatat kesepakatan secara resmi.',
        actionLabel: 'Buat Deal', actionKey: 'open_deal', priority: 'Medium', category: 'Negotiation',
      });
    }
  }

  if ((msgText.includes('transfer') || msgText.includes('bayar')) && escrowStatus === 'Waiting Buyer Payment' && myRole === 'Pembeli') {
    const exists = suggestions.some(s => s.actionKey === 'open_escrow');
    if (!exists) {
      suggestions.push({
        id: 'ai-keyword-payment', icon: '💳',
        title: 'Upload Bukti Transfer',
        body: 'Terdeteksi diskusi pembayaran. Upload bukti transfer ke Escrow sekarang.',
        actionLabel: 'Upload Bukti', actionKey: 'open_escrow', priority: 'High', category: 'Payment',
      });
    }
  }

  if ((msgText.includes('kirim') || msgText.includes('pickup') || msgText.includes('jemput')) && transportMode === 'Marketplace' && transportStatus === 'Waiting Assignment' && myRole === 'Pembeli') {
    const exists = suggestions.some(s => s.actionKey === 'open_transport');
    if (!exists) {
      suggestions.push({
        id: 'ai-keyword-transport', icon: '🚚',
        title: 'Cek Status Transport',
        body: 'Terdeteksi diskusi pengiriman. Lihat status transport dan hubungi Transporter.',
        actionLabel: 'Lihat Transport', actionKey: 'open_transport', priority: 'Medium', category: 'Transport',
      });
    }
  }

  if ((msgText.includes('sampai') || msgText.includes('tiba')) && transportMode === 'Marketplace' && (transportStatus === 'On The Way' || transportStatus === 'Stopping')) {
    if (myRole === 'Transport') {
      const exists = suggestions.some(s => s.actionKey === 'upload_delivery_evidence');
      if (!exists) {
        suggestions.push({
          id: 'ai-keyword-arrived', icon: '📷',
          title: 'Upload Bukti Tiba',
          body: 'Terdeteksi pesan tiba di tujuan. Upload foto bukti pengiriman.',
          actionLabel: 'Upload Bukti', actionKey: 'upload_delivery_evidence', priority: 'High', category: 'Delivery',
        });
      }
    }
  }

  // Deduplicate + sort by priority
  const seen = new Set<string>();
  const deduped = suggestions.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });

  const order: Record<AISuggestion['priority'], number> = { High: 0, Medium: 1, Low: 2 };
  return deduped.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 3);
}
