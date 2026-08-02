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

let VEHICLE_DB: VehicleRecord[] = [
  {
    id: 'ARK-TRK-001',
    workspaceId: 'w4',
    jenisKendaraan: 'Truk Ternak Tertutup',
    nomorPolisi: 'Z 9234 BC',
    kapasitas: '10 ekor domba/kambing atau 3 ekor sapi',
    kapasitasKg: 1500,
    status: 'Beroperasi',
    tahunBeli: 2022,
    jenisLayanan: ['Angkut Ternak'],
    catatanOperasional: 'Berventilasi baik. Servis rutin terakhir Mei 2026. Saat ini dalam perjalanan rute Garut–Bandung.',
  },
  {
    id: 'ARK-PUK-001',
    workspaceId: 'w4',
    jenisKendaraan: 'Pick-up Bak Terbuka',
    nomorPolisi: 'Z 4512 AB',
    kapasitas: '5 ekor domba/kambing atau 2 ekor sapi',
    kapasitasKg: 800,
    status: 'Tersedia',
    tahunBeli: 2021,
    jenisLayanan: ['Angkut Ternak', 'Angkut Pakan'],
    catatanOperasional: 'Dilengkapi alas anti-selip. Cocok untuk jarak pendek–menengah.',
  },
  {
    id: 'ARK-TRK-002',
    workspaceId: 'w4',
    jenisKendaraan: 'Truk Ternak Besar',
    nomorPolisi: 'Z 7755 CD',
    kapasitas: '20 ekor domba/kambing atau 6 ekor sapi',
    kapasitasKg: 3000,
    status: 'Servis',
    tahunBeli: 2020,
    jenisLayanan: ['Angkut Ternak'],
    catatanOperasional: 'Servis ganti oli dan rem. Estimasi selesai 25 Juli 2026.',
  },
  {
    id: 'ARK-PKP-001',
    workspaceId: 'w4',
    jenisKendaraan: 'Pick-up Tertutup',
    nomorPolisi: 'Z 2211 EF',
    kapasitas: '—',
    kapasitasKg: 1000,
    status: 'Tersedia',
    tahunBeli: 2023,
    jenisLayanan: ['Angkut Pakan', 'Angkut Obat', 'Angkut Peralatan'],
    catatanOperasional: 'Box tertutup, cocok angkut pakan curah dan obat ternak. Kapasitas 1 ton.',
  },
  {
    id: 'ARK-MTR-001',
    workspaceId: 'w4',
    jenisKendaraan: 'Motor Kurir',
    nomorPolisi: 'Z 8899 GH',
    kapasitas: '—',
    kapasitasKg: 50,
    status: 'Tersedia',
    tahunBeli: 2024,
    jenisLayanan: ['Pengiriman Dokumen', 'Angkut Obat'],
    catatanOperasional: 'Khusus pengiriman dokumen dan obat dalam kemasan kecil. Coverage Garut kota.',
  },
  {
    id: 'ARK-VAN-001',
    workspaceId: 'w4',
    jenisKendaraan: 'Van Box',
    nomorPolisi: 'Z 3344 IJ',
    kapasitas: '—',
    kapasitasKg: 700,
    status: 'Tidak Aktif',
    tahunBeli: 2019,
    jenisLayanan: ['Angkut Pakan', 'Angkut Obat', 'Angkut Peralatan', 'Pengiriman Dokumen'],
    catatanOperasional: 'Dalam proses pelepasan (dijual). Tidak menerima order baru.',
  },
];

// ─── Seed Data — Drivers ─────────────────────────────────────────────────────

let DRIVER_DB: DriverRecord[] = [
  {
    id: 'DRV-001',
    workspaceId: 'w4',
    nama: 'Ahmad Sutisna',
    foto: '👨‍✈️',
    nomorSIM: 'B2-341-20221105',
    kategoriSIM: 'B2',
    kendaraanId: 'ARK-TRK-001',
    status: 'Aktif',
    pengalamanTahun: 5,
    nomorHP: '+62 812-1111-2222',
    catatanDriver: 'Pengemudi senior, berpengalaman rute Priangan. Sertifikat mengemudi ternak.',
  },
  {
    id: 'DRV-002',
    workspaceId: 'w4',
    nama: 'Dede Kusnandar',
    foto: '👨‍🔧',
    nomorSIM: 'B1-219-20230318',
    kategoriSIM: 'B1',
    kendaraanId: 'ARK-PUK-001',
    status: 'Aktif',
    pengalamanTahun: 3,
    nomorHP: '+62 813-3333-4444',
    catatanDriver: 'Menguasai rute Garut–Tasikmalaya dan Garut–Sukabumi. Ramah dan tepat waktu.',
  },
  {
    id: 'DRV-003',
    workspaceId: 'w4',
    nama: 'Ujang Permana',
    foto: '👨‍🦱',
    nomorSIM: 'B1-087-20240201',
    kategoriSIM: 'B1',
    kendaraanId: 'ARK-PKP-001',
    status: 'Cuti',
    pengalamanTahun: 2,
    nomorHP: '+62 811-5555-6666',
    catatanDriver: 'Cuti melahirkan anak pertama. Kembali 1 Agustus 2026.',
  },
  {
    id: 'DRV-004',
    workspaceId: 'w4',
    nama: 'Asep Wahyudin',
    foto: '🧑‍💼',
    nomorSIM: 'C-654-20220715',
    kategoriSIM: 'C',
    kendaraanId: 'ARK-MTR-001',
    status: 'Aktif',
    pengalamanTahun: 4,
    nomorHP: '+62 817-7777-8888',
    catatanDriver: 'Kurir motor, hafal jalan Garut Kota. Pengiriman dokumen dan obat.',
  },
];

// ─── Seed Data — Service Areas ────────────────────────────────────────────────

const SERVICE_AREA_DB: ServiceArea[] = [
  {
    id: 'SA-001',
    workspaceId: 'w4',
    namaWilayah: 'Garut & Sekitarnya',
    provinsi: 'Jawa Barat',
    kabupatenKota: ['Garut', 'Leles', 'Samarang', 'Bayongbong', 'Cikajang', 'Bungbulang'],
    jenisLayanan: ['Angkut Ternak', 'Angkut Pakan', 'Angkut Obat', 'Angkut Peralatan', 'Pengiriman Dokumen'],
    minOrderKg: null,
    estimasiWaktu: '30 menit – 2 jam',
    keterangan: 'Area utama. Semua jenis layanan tersedia. Penjemputan fleksibel.',
  },
  {
    id: 'SA-002',
    workspaceId: 'w4',
    namaWilayah: 'Bandung Raya',
    provinsi: 'Jawa Barat',
    kabupatenKota: ['Bandung Kota', 'Cimahi', 'Bandung Barat', 'Sumedang'],
    jenisLayanan: ['Angkut Ternak', 'Angkut Pakan'],
    minOrderKg: 200,
    estimasiWaktu: '2–3 jam',
    keterangan: 'Rute Garut–Bandung tersedia 3x seminggu (Senin, Rabu, Jumat). Min. muatan 200 kg untuk Angkut Pakan.',
  },
  {
    id: 'SA-003',
    workspaceId: 'w4',
    namaWilayah: 'Tasikmalaya',
    provinsi: 'Jawa Barat',
    kabupatenKota: ['Tasikmalaya Kota', 'Kabupaten Tasikmalaya', 'Singaparna', 'Ciawi'],
    jenisLayanan: ['Angkut Ternak'],
    minOrderKg: null,
    estimasiWaktu: '2–3 jam',
    keterangan: 'Rute Garut–Tasikmalaya. Min. 3 ekor ternak besar atau 8 ekor kecil per order.',
  },
  {
    id: 'SA-004',
    workspaceId: 'w4',
    namaWilayah: 'Sukabumi',
    provinsi: 'Jawa Barat',
    kabupatenKota: ['Sukabumi Kota', 'Kabupaten Sukabumi', 'Cicurug', 'Palabuhanratu'],
    jenisLayanan: ['Angkut Ternak', 'Angkut Pakan'],
    minOrderKg: 300,
    estimasiWaktu: '3–4 jam',
    keterangan: 'Rute via Cianjur atau via Palabuhanratu tergantung muatan. Booking H-1.',
  },
  {
    id: 'SA-005',
    workspaceId: 'w4',
    namaWilayah: 'Ciamis & Banjar',
    provinsi: 'Jawa Barat',
    kabupatenKota: ['Ciamis', 'Banjar', 'Pangandaran'],
    jenisLayanan: ['Angkut Ternak'],
    minOrderKg: null,
    estimasiWaktu: '3–4 jam',
    keterangan: 'Tersedia 2x seminggu. Khusus ternak besar min. 4 ekor sapi.',
  },
  {
    id: 'SA-006',
    workspaceId: 'w4',
    namaWilayah: 'Jawa Barat (Khusus Request)',
    provinsi: 'Jawa Barat',
    kabupatenKota: ['Cirebon', 'Kuningan', 'Majalengka', 'Indramayu', 'Purwakarta', 'Karawang'],
    jenisLayanan: ['Angkut Ternak'],
    minOrderKg: null,
    estimasiWaktu: '4–8 jam (tergantung jarak)',
    keterangan: 'Rute khusus request. Min. 1 truk penuh. Hubungi admin untuk penawaran harga.',
  },
];

// ─── Seed Data — Delivery History ─────────────────────────────────────────────

let DELIVERY_DB: DeliveryRecord[] = [
  {
    id: 'DLV-2026-001',
    workspaceId: 'w4',
    customerId: 'usr-berkah-001',
    customerName: 'Budi Santoso',
    customerWorkspace: 'Berkah Farm Garut',
    transportType: 'Angkut Ternak',
    status: 'Selesai',
    tanggal: '2026-07-10',
    tanggalSelesai: '2026-07-10',
    ruteAsal: 'Garut, Jawa Barat',
    ruteTujuan: 'Pasar Ternak Bandung',
    kendaraanId: 'ARK-TRK-001',
    driverId: 'DRV-001',
    muatan: '8 ekor domba, 2 ekor kambing',
    nilaiPengiriman: 850_000,
    catatan: 'Pengiriman sesuai jadwal. Kondisi hewan baik sampai tujuan.',
  },
  {
    id: 'DLV-2026-002',
    workspaceId: 'w4',
    customerId: 'cust-002',
    customerName: 'H. Rahmat',
    customerWorkspace: 'Peternakan H. Rahmat',
    transportType: 'Angkut Pakan',
    status: 'Selesai',
    tanggal: '2026-07-08',
    tanggalSelesai: '2026-07-08',
    ruteAsal: 'Toko Pakan Berkah, Garut',
    ruteTujuan: 'Kandang H. Rahmat, Tasikmalaya',
    kendaraanId: 'ARK-PKP-001',
    driverId: 'DRV-003',
    muatan: '500 kg dedak padi, 300 kg konsentrat',
    nilaiPengiriman: 480_000,
    catatan: 'Pengiriman pakan dalam kondisi baik.',
  },
  {
    id: 'DLV-2026-003',
    workspaceId: 'w4',
    customerId: 'usr-berkah-001',
    customerName: 'Budi Santoso',
    customerWorkspace: 'Berkah Farm Tasik',
    transportType: 'Angkut Ternak',
    status: 'Dalam Perjalanan',
    tanggal: '2026-07-18',
    tanggalSelesai: null,
    ruteAsal: 'Garut, Jawa Barat',
    ruteTujuan: 'Tasikmalaya, Jawa Barat',
    kendaraanId: 'ARK-TRK-001',
    driverId: 'DRV-001',
    muatan: '5 ekor kambing perah',
    nilaiPengiriman: 620_000,
    catatan: 'Berangkat pukul 08.00 WIB. Estimasi tiba 11.00 WIB.',
  },
  {
    id: 'DLV-2026-004',
    workspaceId: 'w4',
    customerId: 'cust-004',
    customerName: 'Pak Hendi',
    customerWorkspace: 'Hendi Agro Sukabumi',
    transportType: 'Angkut Ternak',
    status: 'Menunggu',
    tanggal: '2026-07-20',
    tanggalSelesai: null,
    ruteAsal: 'Garut, Jawa Barat',
    ruteTujuan: 'Sukabumi, Jawa Barat',
    kendaraanId: 'ARK-TRK-002',
    driverId: 'DRV-002',
    muatan: '4 ekor sapi potong',
    nilaiPengiriman: 1_200_000,
    catatan: 'Menunggu kendaraan ARK-TRK-002 selesai servis.',
  },
  {
    id: 'DLV-2026-005',
    workspaceId: 'w4',
    customerId: 'cust-005',
    customerName: 'drh. Amelia Putri',
    customerWorkspace: 'drh. Amelia Putri',
    transportType: 'Pengiriman Dokumen',
    status: 'Selesai',
    tanggal: '2026-07-15',
    tanggalSelesai: '2026-07-15',
    ruteAsal: 'Kantor Berkah Transport, Garut',
    ruteTujuan: 'Klinik Hewan Sejahtera, Garut',
    kendaraanId: 'ARK-MTR-001',
    driverId: 'DRV-004',
    muatan: 'Dokumen MOU kerjasama veteriner',
    nilaiPengiriman: 50_000,
    catatan: 'Dokumen diterima, tanda tangan konfirmasi tersedia.',
  },
  {
    id: 'DLV-2026-006',
    workspaceId: 'w4',
    customerId: 'cust-006',
    customerName: 'Pak Agus',
    customerWorkspace: 'Peternakan Cikajang Makmur',
    transportType: 'Angkut Obat',
    status: 'Selesai',
    tanggal: '2026-07-12',
    tanggalSelesai: '2026-07-12',
    ruteAsal: 'Apotek Hewan Garut',
    ruteTujuan: 'Cikajang, Garut',
    kendaraanId: 'ARK-PKP-001',
    driverId: 'DRV-003',
    muatan: '50 botol vaksin ND, 30 kg antibiotik ternak',
    nilaiPengiriman: 150_000,
    catatan: 'Obat ditangani dengan cold chain. Kondisi baik saat tiba.',
  },
  {
    id: 'DLV-2026-007',
    workspaceId: 'w4',
    customerId: 'cust-007',
    customerName: 'Koperasi Peternak Garut',
    customerWorkspace: 'KPG Garut',
    transportType: 'Angkut Peralatan',
    status: 'Selesai',
    tanggal: '2026-07-05',
    tanggalSelesai: '2026-07-05',
    ruteAsal: 'Gudang Alat, Garut',
    ruteTujuan: 'Kandang KPG, Bayongbong',
    kendaraanId: 'ARK-PUK-001',
    driverId: 'DRV-002',
    muatan: '3 unit timbangan ternak, 10 unit tempat minum otomatis',
    nilaiPengiriman: 300_000,
    catatan: 'Peralatan diterima dalam kondisi baik dan lengkap.',
  },
  {
    id: 'DLV-2026-008',
    workspaceId: 'w4',
    customerId: 'cust-008',
    customerName: 'Bu Tini',
    customerWorkspace: 'Ternak Bu Tini',
    transportType: 'Angkut Ternak',
    status: 'Dibatalkan',
    tanggal: '2026-07-14',
    tanggalSelesai: null,
    ruteAsal: 'Leles, Garut',
    ruteTujuan: 'Ciamis, Jawa Barat',
    kendaraanId: 'ARK-TRK-002',
    driverId: 'DRV-001',
    muatan: '3 ekor sapi',
    nilaiPengiriman: null,
    catatan: 'Dibatalkan oleh pelanggan H-1 karena kesepakatan jual-beli gagal.',
  },
  {
    id: 'DLV-2026-009',
    workspaceId: 'w4',
    customerId: 'cust-009',
    customerName: 'Pak Soni',
    customerWorkspace: 'Soni Farm Bandung',
    transportType: 'Angkut Ternak',
    status: 'Dikonfirmasi',
    tanggal: '2026-07-19',
    tanggalSelesai: null,
    ruteAsal: 'Samarang, Garut',
    ruteTujuan: 'Bandung Barat',
    kendaraanId: 'ARK-PUK-001',
    driverId: 'DRV-002',
    muatan: '4 ekor domba garut pilihan',
    nilaiPengiriman: 750_000,
    catatan: 'Dijadwalkan berangkat pukul 06.00 WIB besok.',
  },
  {
    id: 'DLV-2026-010',
    workspaceId: 'w4',
    customerId: 'usr-berkah-001',
    customerName: 'Budi Santoso',
    customerWorkspace: 'Berkah Farm Garut',
    transportType: 'Angkut Pakan',
    status: 'Selesai',
    tanggal: '2026-07-03',
    tanggalSelesai: '2026-07-03',
    ruteAsal: 'Toko Pakan Berkah, Garut',
    ruteTujuan: 'Berkah Farm Garut, Samarang',
    kendaraanId: 'ARK-PKP-001',
    driverId: 'DRV-004',
    muatan: '800 kg konsentrat domba, 200 kg mineral blok',
    nilaiPengiriman: 250_000,
    catatan: 'Pengiriman rutin bulanan. Selesai tepat waktu.',
  },
];

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

const TRANSPORT_WORKSPACE_META: TransportWorkspaceMeta[] = [
  {
    workspaceId: 'w4',
    nama: 'Berkah Transport',
    logo: '🚚',
    banner: '🛤️',
    deskripsi:
      'Layanan transportasi ternak berpendingin dan berventilasi untuk menjaga kenyamanan hewan selama perjalanan. Armada 6 unit, coverage Jawa Barat. Berpengalaman dalam pengiriman antar kota dan antar provinsi dengan penanganan ternak secara profesional.',
    lokasiUmum: 'Garut, Jawa Barat',
    kontakPublik: '+62 811-2233-4455',
    bergabungSejak: '2024-09-10',
  },
];

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
