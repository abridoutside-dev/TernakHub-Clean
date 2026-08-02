// ─── FARM-FIX-005.7 — Transport Trip Registry ────────────────────────────────
// Trip = physical vehicle movement for Marketplace Transport mode.
// A Trip is created by the Transport Workspace and can carry multiple transactions.
//
// Architecture rules:
//  - Trips are keyed by tripId (UUID).
//  - One or more transactions (chatIds) are linked to a Trip.
//  - Stops are unlimited, ordered, with ETA/ATA and arrival/departure status.
//  - Status mirrors MarketplaceTransportStatus (13 statuses from spec).
//  - Trip is separate from TransportConfig — config references tripId.
//  - No GPS backend; coordinates are from browser Geolocation API (in-session only).

import { generateUUID } from '../utils/uuid';
import type { MarketplaceTransportStatus } from './transportConfigData';

// ─── Stop ─────────────────────────────────────────────────────────────────────

export type StopArrivalStatus = 'Pending' | 'Arrived' | 'Departed' | 'Skipped';

export interface TripStop {
  id: string;
  order: number;
  locationName: string;
  address: string | null;
  eta: string | null;     // ISO datetime
  ata: string | null;     // Actual Time of Arrival (ISO)
  atd: string | null;     // Actual Time of Departure (ISO)
  arrivalStatus: StopArrivalStatus;
  notes: string | null;
}

// ─── Transaction Assignment ───────────────────────────────────────────────────

export interface TripTransaction {
  chatId: string;
  listingTitle: string;
  pickupStopId: string | null;
  dropStopId: string | null;
  status: 'Pending' | 'Loaded' | 'Delivered' | 'Problem';
}

// ─── Transport Trip ────────────────────────────────────────────────────────────

export interface TransportTrip {
  id: string;
  tripNumber: string;
  workspaceIdTransport: string;
  driver: {
    name: string;
    phone: string;
  };
  vehicle: {
    type: string;
    licensePlate: string;
    capacityHeads: number;
    capacityKg: number | null;
  };
  currentLoadHeads: number;
  route: string;
  stops: TripStop[];
  transactions: TripTransaction[];
  estimatedDeparture: string | null;
  actualDeparture: string | null;
  status: MarketplaceTransportStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────

const TRIP_STORE = new Map<string, TransportTrip>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowTs(): string { return new Date().toISOString(); }

function generateTripNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `TRP-${ymd}-${rand}`;
}

// ─── Getters ──────────────────────────────────────────────────────────────────

export function getTripById(tripId: string): TransportTrip | undefined {
  return TRIP_STORE.get(tripId);
}

export function getTripsByWorkspace(workspaceId: string): TransportTrip[] {
  return Array.from(TRIP_STORE.values()).filter(
    t => t.workspaceIdTransport === workspaceId,
  );
}

export function getTripByChatId(chatId: string): TransportTrip | undefined {
  return Array.from(TRIP_STORE.values()).find(
    t => t.transactions.some(tx => tx.chatId === chatId),
  );
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function createTrip(input: {
  workspaceIdTransport: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  licensePlate: string;
  capacityHeads: number;
  capacityKg?: number;
  route: string;
  estimatedDeparture?: string;
  notes?: string;
  initialChatId?: string;
  listingTitle?: string;
}): TransportTrip {
  const ts = nowTs();
  const trip: TransportTrip = {
    id: generateUUID(),
    tripNumber: generateTripNumber(),
    workspaceIdTransport: input.workspaceIdTransport,
    driver: {
      name: input.driverName,
      phone: input.driverPhone,
    },
    vehicle: {
      type: input.vehicleType,
      licensePlate: input.licensePlate,
      capacityHeads: input.capacityHeads,
      capacityKg: input.capacityKg ?? null,
    },
    currentLoadHeads: 0,
    route: input.route,
    stops: [],
    transactions: input.initialChatId ? [{
      chatId: input.initialChatId,
      listingTitle: input.listingTitle ?? 'Transaksi',
      pickupStopId: null,
      dropStopId: null,
      status: 'Pending',
    }] : [],
    estimatedDeparture: input.estimatedDeparture ?? null,
    actualDeparture: null,
    status: 'Assigned',
    notes: input.notes ?? null,
    createdAt: ts,
    updatedAt: ts,
  };
  TRIP_STORE.set(trip.id, trip);
  return trip;
}

export function addTripStop(tripId: string, stopInput: Omit<TripStop, 'id' | 'order' | 'ata' | 'atd' | 'arrivalStatus'>): TripStop | null {
  const trip = TRIP_STORE.get(tripId);
  if (!trip) return null;
  const stop: TripStop = {
    ...stopInput,
    id: generateUUID(),
    order: trip.stops.length + 1,
    ata: null,
    atd: null,
    arrivalStatus: 'Pending',
  };
  trip.stops.push(stop);
  trip.updatedAt = nowTs();
  return stop;
}

export function updateStopStatus(
  tripId: string,
  stopId: string,
  status: StopArrivalStatus,
  actualTime?: string,
): boolean {
  const trip = TRIP_STORE.get(tripId);
  if (!trip) return false;
  const stop = trip.stops.find(s => s.id === stopId);
  if (!stop) return false;
  stop.arrivalStatus = status;
  const ts = actualTime ?? nowTs();
  if (status === 'Arrived') stop.ata = ts;
  if (status === 'Departed') stop.atd = ts;
  trip.updatedAt = nowTs();
  return true;
}

export function updateTripStatus(tripId: string, status: MarketplaceTransportStatus): boolean {
  const trip = TRIP_STORE.get(tripId);
  if (!trip) return false;
  trip.status = status;
  if (status === 'Departed') trip.actualDeparture = nowTs();
  trip.updatedAt = nowTs();
  return true;
}

export function addTransactionToTrip(tripId: string, chatId: string, listingTitle: string): boolean {
  const trip = TRIP_STORE.get(tripId);
  if (!trip) return false;
  if (trip.transactions.some(t => t.chatId === chatId)) return false;
  trip.transactions.push({ chatId, listingTitle, pickupStopId: null, dropStopId: null, status: 'Pending' });
  trip.updatedAt = nowTs();
  return true;
}

export function assignTransactionStops(tripId: string, chatId: string, pickupStopId: string, dropStopId: string): boolean {
  const trip = TRIP_STORE.get(tripId);
  if (!trip) return false;
  const tx = trip.transactions.find(t => t.chatId === chatId);
  if (!tx) return false;
  tx.pickupStopId = pickupStopId;
  tx.dropStopId = dropStopId;
  trip.updatedAt = nowTs();
  return true;
}

export function updateTransactionStatus(tripId: string, chatId: string, status: TripTransaction['status']): boolean {
  const trip = TRIP_STORE.get(tripId);
  if (!trip) return false;
  const tx = trip.transactions.find(t => t.chatId === chatId);
  if (!tx) return false;
  tx.status = status;
  trip.updatedAt = nowTs();
  return true;
}

export function updateTripLoad(tripId: string, heads: number): boolean {
  const trip = TRIP_STORE.get(tripId);
  if (!trip) return false;
  trip.currentLoadHeads = heads;
  trip.updatedAt = nowTs();
  return true;
}

export function updateTrip(
  tripId: string,
  updates: {
    driverName?: string;
    driverPhone?: string;
    vehicleType?: string;
    licensePlate?: string;
    capacityHeads?: number;
    route?: string;
    estimatedDeparture?: string | null;
    notes?: string | null;
  },
): boolean {
  const trip = TRIP_STORE.get(tripId);
  if (!trip) return false;
  if (updates.driverName    !== undefined) trip.driver.name             = updates.driverName;
  if (updates.driverPhone   !== undefined) trip.driver.phone            = updates.driverPhone;
  if (updates.vehicleType   !== undefined) trip.vehicle.type            = updates.vehicleType;
  if (updates.licensePlate  !== undefined) trip.vehicle.licensePlate    = updates.licensePlate;
  if (updates.capacityHeads !== undefined) trip.vehicle.capacityHeads   = updates.capacityHeads;
  if (updates.route         !== undefined) trip.route                   = updates.route;
  if (updates.estimatedDeparture !== undefined) trip.estimatedDeparture = updates.estimatedDeparture;
  if (updates.notes         !== undefined) trip.notes                   = updates.notes;
  trip.updatedAt = nowTs();
  return true;
}

export function updateTripStop(
  tripId: string,
  stopId: string,
  updates: { locationName?: string; address?: string | null; eta?: string | null; notes?: string | null },
): boolean {
  const trip = TRIP_STORE.get(tripId);
  if (!trip) return false;
  const stop = trip.stops.find(s => s.id === stopId);
  if (!stop) return false;
  if (updates.locationName !== undefined) stop.locationName = updates.locationName;
  if (updates.address      !== undefined) stop.address      = updates.address;
  if (updates.eta          !== undefined) stop.eta          = updates.eta;
  if (updates.notes        !== undefined) stop.notes        = updates.notes;
  trip.updatedAt = nowTs();
  return true;
}

// ─── Vehicle Type Presets ─────────────────────────────────────────────────────

export const VEHICLE_TYPES: string[] = [
  'Truk Ternak Tertutup',
  'Truk Ternak Besar',
  'Pick-up Bak Terbuka',
  'Pick-up Tertutup',
  'Van Box',
  'Motor Kurir',
];

export const STOP_ARRIVAL_STATUS_CONFIG: Record<
  StopArrivalStatus,
  { icon: string; label: string; color: string }
> = {
  Pending:  { icon: '⏳', label: 'Menunggu', color: '#6b7280' },
  Arrived:  { icon: '📍', label: 'Tiba', color: '#2563eb' },
  Departed: { icon: '✈️', label: 'Berangkat', color: '#16a34a' },
  Skipped:  { icon: '⏭️', label: 'Dilewati', color: '#d97706' },
};
