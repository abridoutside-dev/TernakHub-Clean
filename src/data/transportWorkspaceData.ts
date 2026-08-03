// ─── Transport Workspace Foundation (WST-001) ─────────────────────────────────
// Operational data layer for Transport Workspace.
//
// Scope: Fleet management, driver registry, service coverage, internal delivery log.
// This is SEPARATE from transaksiTransportData.ts (marketplace-linked records)
// and layananTransportData.ts (public service catalog).
//
// Architecture rules:
//  - This module owns fleet + driver + coverage + internal delivery log.
//  - Marketplace reads layananTransportData.ts via Reference UUID only.
//  - NO GPS, NO live tracking, NO payment, NO scheduling engine (future roadmap).
//  - Access is gated by ViewerRole (architecture-only; production = server-side claims).

import { generateUUID } from '../utils/uuid';

// ─── Transport Service Types ─────────────────────────────────────────────────

/** The 5 transport service categories (WST-001). */
export type TransportServiceType =
  | 'Angkut Ternak'
  | 'Angkut Pakan'
  | 'Angkut Obat'
  | 'Angkut Peralatan'
  | 'Pengiriman Dokumen';

export const TRANSPORT_SERVICE_TYPES: TransportServiceType[] = [
  'Angkut Ternak',
  'Angkut Pakan',
  'Angkut Obat',
  'Angkut Peralatan',
  'Pengiriman Dokumen',
];

export const TRANSPORT_SERVICE_TYPE_CONFIG: Record<
  TransportServiceType,
  { icon: string; color: string; bg: string }
> = {
  'Angkut Ternak':        { icon: '🐄', color: '#166534', bg: '#dcfce7' },
  'Angkut Pakan':         { icon: '🌾', color: '#92400e', bg: '#fef3c7' },
  'Angkut Obat':          { icon: '💊', color: '#1e40af', bg: '#dbeafe' },
  'Angkut Peralatan':     { icon: '🔧', color: '#5b21b6', bg: '#ede9fe' },
  'Pengiriman Dokumen':   { icon: '📄', color: '#0e7490', bg: '#cffafe' },
};

// ─── Vehicle ──────────────────────────────────────────────────────────────────

export type VehicleStatus = 'Tersedia' | 'Beroperasi' | 'Servis' | 'Tidak Aktif';

export type VehicleType =
  | 'Truk Ternak Tertutup'
  | 'Truk Ternak Besar'
  | 'Pick-up Bak Terbuka'
  | 'Pick-up Tertutup'
  | 'Motor Kurir'
  | 'Van Box';

export interface VehicleRecord {
  /** Internal vehicle ID, e.g. "ARK-TRK-001" */
  id: string;
  workspaceId: string;
  jenisKendaraan: VehicleType;
  nomorPolisi: string;
  /** Human-readable capacity, e.g. "10 ekor domba/kambing atau 3 ekor sapi" */
  kapasitas: string;
  /** Payload capacity in kg for non-livestock freight */
  kapasitasKg: number | null;
  status: VehicleStatus;
  tahunBeli: number;
  /** Services this vehicle supports */
  jenisLayanan: TransportServiceType[];
  catatanOperasional: string;
}

export const VEHICLE_STATUS_CONFIG: Record<
  VehicleStatus,
  { icon: string; color: string; bg: string; border: string }
> = {
  Tersedia:     { icon: '✅', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  Beroperasi:   { icon: '🚚', color: '#1e40af', bg: '#dbeafe', border: '#93c5fd' },
  Servis:       { icon: '🔧', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  'Tidak Aktif':{ icon: '⛔', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
};

// ─── Driver ───────────────────────────────────────────────────────────────────

export type DriverStatus = 'Aktif' | 'Tidak Aktif' | 'Cuti';
export type SIMKategori = 'B1' | 'B2' | 'A' | 'C';

export interface DriverRecord {
  id: string;
  workspaceId: string;
  nama: string;
  foto: string;               // emoji avatar
  nomorSIM: string;
  kategoriSIM: SIMKategori;
  /** Vehicle ID assigned, null if unassigned */
  kendaraanId: string | null;
  status: DriverStatus;
  pengalamanTahun: number;
  nomorHP: string;
  catatanDriver: string;
}

export const DRIVER_STATUS_CONFIG: Record<
  DriverStatus,
  { icon: string; color: string; bg: string }
> = {
  Aktif:        { icon: '✅', color: '#166534', bg: '#dcfce7' },
  'Tidak Aktif':{ icon: '⛔', color: '#6b7280', bg: '#f3f4f6' },
  Cuti:         { icon: '🏖️', color: '#92400e', bg: '#fef3c7' },
};

// ─── Service Area ─────────────────────────────────────────────────────────────

export interface ServiceArea {
  id: string;
  workspaceId: string;
  namaWilayah: string;
  provinsi: string;
  kabupatenKota: string[];
  jenisLayanan: TransportServiceType[];
  minOrderKg: number | null;
  estimasiWaktu: string;    // e.g. "2–3 jam"
  keterangan: string;
}

// ─── Delivery Record ──────────────────────────────────────────────────────────

export type DeliveryStatus =
  | 'Menunggu'
  | 'Dikonfirmasi'
  | 'Pickup Ready'
  | 'Dalam Perjalanan'
  | 'Tiba'
  | 'Selesai'
  | 'Dibatalkan';

export interface DeliveryRecord {
  id: string;                     // e.g. "DLV-2026-001"
  workspaceId: string;
  customerId: string;
  customerName: string;
  customerWorkspace: string;      // workspace name of the customer
  transportType: TransportServiceType;
  status: DeliveryStatus;
  tanggal: string;                // ISO yyyy-mm-dd
  tanggalSelesai: string | null;  // ISO yyyy-mm-dd
  ruteAsal: string;
  ruteTujuan: string;
  kendaraanId: string;
  driverId: string;
  muatan: string;                 // e.g. "8 ekor domba, 2 ekor kambing"
  nilaiPengiriman: number | null; // IDR, null if not yet determined
  catatan: string;
}

export const DELIVERY_STATUS_CONFIG: Record<
  DeliveryStatus,
  { icon: string; color: string; bg: string; border: string }
> = {
  Menunggu:          { icon: '⏳', color: '#5d4037', bg: '#efebe9', border: '#bcaaa4' },
  Dikonfirmasi:      { icon: '✅', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  'Pickup Ready':    { icon: '🚗', color: '#1e40af', bg: '#dbeafe', border: '#93c5fd' },
  'Dalam Perjalanan':{ icon: '🚚', color: '#0e7490', bg: '#cffafe', border: '#67e8f9' },
  Tiba:              { icon: '📍', color: '#6d28d9', bg: '#ede9fe', border: '#c4b5fd' },
  Selesai:           { icon: '🏁', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  Dibatalkan:        { icon: '❌', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};

// ─── Access Control ───────────────────────────────────────────────────────────

export type TransportViewerRole = 'public' | 'member' | 'admin' | 'owner' | 'platform_admin';

export interface TransportAccessDecision {
  role: TransportViewerRole;
  canViewOperational: boolean;    // drivers, full delivery history, internal notes
  canViewFinancial: boolean;      // nilai pengiriman, revenue stats
  canEditFleet: boolean;          // owner/admin fleet management permission
}

/** Member registry — local to avoid circular imports from workspaceManagementData. */
type MemberEntry = { userId: string; workspaceId: string; role: 'Owner' | 'Admin' | 'Member' };

const TRANSPORT_MEMBER_ROLES: MemberEntry[] = [
  { userId: 'usr-berkah-001', workspaceId: 'w4', role: 'Owner' },
  { userId: 'usr-berkah-001', workspaceId: 'w4', role: 'Admin' }, // Hendra Prasetyo
];

export function deriveTransportAccess(
  workspaceId: string,
  viewerUserId: string | null
): TransportAccessDecision {
  if (!viewerUserId) {
    return { role: 'public', canViewOperational: false, canViewFinancial: false, canEditFleet: false };
  }
  const entry = TRANSPORT_MEMBER_ROLES.find(
    (m) => m.workspaceId === workspaceId && m.userId === viewerUserId
  );
  if (!entry) {
    return { role: 'public', canViewOperational: false, canViewFinancial: false, canEditFleet: false };
  }
  return {
    role: entry.role === 'Owner' ? 'owner' : entry.role === 'Admin' ? 'admin' : 'member',
    canViewOperational: true,
    canViewFinancial: entry.role === 'Owner' || entry.role === 'Admin',
    canEditFleet: entry.role === 'Owner' || entry.role === 'Admin',
  };
}

/**
 * @deprecated P0-002B — viewer identity must come from AuthContext (useAuth).
 * Nullified; kept only for backward-compat during migration.
 */
export const CURRENT_TRANSPORT_VIEWER_ID: string | null = null;

// ─── Seed Data — Vehicles ────────────────────────────────────────────────────
// ADMIN-SYNC-008: Seed data dihapus. Tabel transport_vehicles belum tersedia di
// Supabase. Armada kendaraan masuk Blocked Modules Panel sampai tabel tersedia.

let VEHICLE_DB: VehicleRecord[] = [];

// ─── Seed Data — Drivers ─────────────────────────────────────────────────────
// ADMIN-SYNC-008: Seed data dihapus. Tabel transport_drivers belum tersedia di
// Supabase. Manajemen driver masuk Blocked Modules Panel sampai tabel tersedia.

let DRIVER_DB: DriverRecord[] = [];

// ─── Seed Data — Service Areas ────────────────────────────────────────────────
// ADMIN-SYNC-008: Seed data dihapus. Tidak ada tabel transport_service_areas di
// Supabase. Area layanan masuk Blocked Modules Panel sampai tabel tersedia.

const SERVICE_AREA_DB: ServiceArea[] = [];

// ─── Seed Data — Delivery History ─────────────────────────────────────────────

// ADMIN-SYNC-008: Seed data dihapus. Tabel transport_deliveries belum tersedia di
// Supabase. Pengiriman internal masuk Blocked Modules Panel. Data transaksi
// marketplace tersedia di marketplace_transactions (digunakan oleh TransportDeliveryAdmin).

let DELIVERY_DB: DeliveryRecord[] = [];

// ─── Transport Workspace Meta ─────────────────────────────────────────────────

export interface TransportWorkspaceMeta {
  workspaceId: string;
  nama: string;
  logo: string;
  banner: string;
  deskripsi: string;
  lokasiUmum: string;
  kontakPublik: string;
  bergabungSejak: string;
}

// ADMIN-SYNC-008: Seed data dihapus. Meta workspace sekarang dibaca langsung dari
// tabel `workspaces` di Supabase oleh TransportDashboard dan TransportOperational.

const TRANSPORT_WORKSPACE_META: TransportWorkspaceMeta[] = [];

// ─── Queries ──────────────────────────────────────────────────────────────────

export function getTransportWorkspaceMeta(workspaceId: string): TransportWorkspaceMeta | undefined {
  return TRANSPORT_WORKSPACE_META.find((m) => m.workspaceId === workspaceId);
}

export function getVehiclesByWorkspace(workspaceId: string): VehicleRecord[] {
  return VEHICLE_DB.filter((v) => v.workspaceId === workspaceId);
}

export function getVehicleById(id: string): VehicleRecord | undefined {
  return VEHICLE_DB.find((v) => v.id === id);
}

export function getDriversByWorkspace(workspaceId: string): DriverRecord[] {
  return DRIVER_DB.filter((d) => d.workspaceId === workspaceId);
}

export function getDriverById(id: string): DriverRecord | undefined {
  return DRIVER_DB.find((d) => d.id === id);
}

export function getServiceAreasByWorkspace(workspaceId: string): ServiceArea[] {
  return SERVICE_AREA_DB.filter((sa) => sa.workspaceId === workspaceId);
}

export function getDeliveriesByWorkspace(workspaceId: string): DeliveryRecord[] {
  return DELIVERY_DB.filter((d) => d.workspaceId === workspaceId);
}

export function getDeliveryById(id: string): DeliveryRecord | undefined {
  return DELIVERY_DB.find((d) => d.id === id);
}

// ─── Summary Statistics ───────────────────────────────────────────────────────

export interface TransportWorkspaceSummary {
  totalKendaraan: number;
  kendaraanTersedia: number;
  kendaraanBeroperasi: number;
  totalDriver: number;
  driverAktif: number;
  pengirimanSelesai: number;
  pengirimanPending: number;
  totalWilayahLayanan: number;
}

export function getTransportWorkspaceSummary(workspaceId: string): TransportWorkspaceSummary {
  const vehicles  = getVehiclesByWorkspace(workspaceId);
  const drivers   = getDriversByWorkspace(workspaceId);
  const deliveries = getDeliveriesByWorkspace(workspaceId);
  const areas     = getServiceAreasByWorkspace(workspaceId);

  return {
    totalKendaraan:      vehicles.length,
    kendaraanTersedia:   vehicles.filter((v) => v.status === 'Tersedia').length,
    kendaraanBeroperasi: vehicles.filter((v) => v.status === 'Beroperasi').length,
    totalDriver:         drivers.length,
    driverAktif:         drivers.filter((d) => d.status === 'Aktif').length,
    pengirimanSelesai:   deliveries.filter((d) => d.status === 'Selesai').length,
    pengirimanPending:   deliveries.filter(
      (d) => d.status === 'Menunggu' || d.status === 'Dikonfirmasi' || d.status === 'Dalam Perjalanan' || d.status === 'Pickup Ready' || d.status === 'Tiba'
    ).length,
    totalWilayahLayanan: areas.length,
  };
}

// ─── Format Helpers ───────────────────────────────────────────────────────────

export function formatRupiahTransport(amount: number | null): string {
  if (amount === null) return '—';
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(2).replace('.', ',')} Jt`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function formatTanggalShort(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export { generateUUID };

// ─── Mutations (WST-002) ──────────────────────────────────────────────────────

export function addVehicle(workspaceId: string, data: {
  jenisKendaraan: VehicleType;
  nomorPolisi: string;
  kapasitas: string;
  kapasitasKg: number | null;
  tahunBeli: number;
  jenisLayanan: TransportServiceType[];
  catatanOperasional: string;
}): VehicleRecord {
  const newVehicle: VehicleRecord = {
    id: 'VH-' + generateUUID().slice(0, 8).toUpperCase(),
    workspaceId,
    status: 'Tersedia',
    ...data,
  };
  VEHICLE_DB = [...VEHICLE_DB, newVehicle];
  return newVehicle;
}

export function assignDriverToVehicle(driverId: string, vehicleId: string | null): void {
  DRIVER_DB = DRIVER_DB.map(d => d.id === driverId ? { ...d, kendaraanId: vehicleId } : d);
}

export function createDelivery(workspaceId: string, data: {
  customerName: string;
  customerWorkspace: string;
  transportType: TransportServiceType;
  tanggal: string;
  ruteAsal: string;
  ruteTujuan: string;
  kendaraanId: string;
  driverId: string;
  muatan: string;
  nilaiPengiriman: number | null;
  catatan: string;
}): DeliveryRecord {
  const year = data.tanggal.slice(0, 4);
  const idx = DELIVERY_DB.filter(d => d.workspaceId === workspaceId).length + 1;
  const newDelivery: DeliveryRecord = {
    id: `DLV-${year}-${String(idx).padStart(3, '0')}`,
    workspaceId,
    customerId: 'cust-' + generateUUID().slice(0, 6),
    status: 'Dikonfirmasi',
    tanggalSelesai: null,
    ...data,
  };
  DELIVERY_DB = [...DELIVERY_DB, newDelivery];
  return newDelivery;
}

export function updateDeliveryStatus(deliveryId: string, status: DeliveryStatus): void {
  DELIVERY_DB = DELIVERY_DB.map(d => d.id === deliveryId ? { ...d, status } : d);
}

export function completeDelivery(deliveryId: string, tanggalSelesai: string): void {
  DELIVERY_DB = DELIVERY_DB.map(d =>
    d.id === deliveryId ? { ...d, status: 'Selesai' as DeliveryStatus, tanggalSelesai } : d
  );
}
