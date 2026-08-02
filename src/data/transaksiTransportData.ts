// ─── PROFILE-008 — Transport Foundation ───────────────────────────────────────
// Transport adalah Participant opsional dalam Transaction Conversation.
// Mengacu pada:
//   docs/architecture/TRANSPORT_MODULE_CONSTITUTION.md
//   docs/architecture/TRANSACTION_CONVERSATION_CONSTITUTION.md
//   docs/architecture/ESCROW_MODULE_CONSTITUTION.md
//
// Aturan utama (dari Constitution):
//  - Transport HANYA mengangkut barang/hewan, mendokumentasikan, dan mengunggah Evidence.
//  - Transport BUKAN Escrow, BUKAN Hakim, BUKAN Penilai kualitas ternak.
//  - Transport hanya mengunggah Foto/Video/Waktu/Lokasi — TIDAK menilai kondisi hewan.
//  - Transport Fee WAJIB dipisahkan dari Harga Barang dan Escrow Fee.
//  - Tidak ada GPS realtime, tidak ada pembayaran otomatis.
//  - addAuditEvent() adalah satu-satunya cara menulis ke Audit Trail.

import { generateUUID } from '../utils/uuid';
import { getTransaksiById, getAllTransaksi } from './marketplaceTransaksiData';
import { WORKSPACES } from '../components/TopAppBar';
import { addAuditEvent } from './transaksiAuditTrailData';

// ─── Tipe ─────────────────────────────────────────────────────────────────────

export type TransportStatus =
  | 'Waiting Assignment'
  | 'Accepted'
  | 'Pickup Ready'
  | 'Loading'
  | 'On Delivery'
  | 'Arrived'
  | 'Unloading'
  | 'Delivery Completed'
  | 'Cancelled';

export type TransportEvidencePhase =
  | 'Before Loading'
  | 'In Transit'
  | 'On Arrival';

export type TransportEvidenceTipe =
  | 'Foto'
  | 'Video'
  | 'Lokasi'
  | 'Catatan';

export type TransportFeePayer = 'Buyer' | 'Seller' | 'Shared';

// ─── Pricing Policy ───────────────────────────────────────────────────────────

export interface TransportPricingPolicy {
  type: 'Percentage' | 'Fixed';
  /** Jika type=Percentage: misal 0.05 = 5% */
  percentage: number | null;
  /** Jika type=Fixed: nominal tetap */
  fixedAmount: number | null;
  minimumFee: number | null;
  maximumFee: number | null;
  feePayer: TransportFeePayer;
  /** True jika Transport Fee disalurkan melalui Escrow (opsional, butuh persetujuan semua pihak) */
  viaEscrow: boolean;
}

// ─── Evidence Record ──────────────────────────────────────────────────────────

export interface TransportEvidenceRecord {
  /** UUID v4 */
  id: string;
  transportId: string;
  phase: TransportEvidencePhase;
  tipe: TransportEvidenceTipe;
  /** Nama file foto/video atau null untuk Lokasi/Catatan */
  fileName: string | null;
  caption: string;
  /** ISO datetime unggah */
  timestamp: string;
  /** WorkspaceId pengunggah (Transport) */
  uploadedBy: string;
}

// ─── Status History Entry ─────────────────────────────────────────────────────

export interface TransportStatusEntry {
  status: TransportStatus;
  /** ISO datetime */
  timestamp: string;
  actor: string;
  actorNama: string;
  catatan: string | null;
}

// ─── Transport Record (main entity) ───────────────────────────────────────────

export interface TransportRecord {
  /** UUID v4 */
  id: string;
  transaksiId: string;
  /** Reference UUID → LayananTransportRecord (opsional — bisa order langsung) */
  layananTransportUuid: string | null;
  /** Workspace penyedia transport */
  workspaceIdTransport: string;
  workspaceNamaTransport: string;
  workspaceIconTransport: string;
  status: TransportStatus;
  statusHistory: TransportStatusEntry[];
  pricing: TransportPricingPolicy;
  /** Nominal Transport Fee — dihitung dari pricing, null jika belum ditentukan */
  transportFee: number | null;
  evidence: TransportEvidenceRecord[];
  /** ISO datetime */
  createdAt: string;
  updatedAt: string;
}

// ─── Input untuk Create Transport ─────────────────────────────────────────────

export interface CreateTransportInput {
  transaksiId: string;
  layananTransportUuid?: string;
  workspaceIdTransport: string;
  pricing: TransportPricingPolicy;
  transportFee?: number;
}

// ─── Konfigurasi Status ───────────────────────────────────────────────────────

export const TRANSPORT_STATUS_CONFIG: Record<
  TransportStatus,
  { icon: string; color: string; bg: string; label: string; description: string }
> = {
  'Waiting Assignment': {
    icon: '⏳',
    color: '#5d4037',
    bg: '#efebe9',
    label: 'Menunggu Penugasan',
    description: 'Order transport dibuat, menunggu konfirmasi dari Transporter.',
  },
  'Accepted': {
    icon: '✅',
    color: '#1b7a43',
    bg: '#e8f5ee',
    label: 'Diterima',
    description: 'Transporter telah menerima penugasan pengiriman.',
  },
  'Pickup Ready': {
    icon: '🚗',
    color: '#1565c0',
    bg: '#e3f2fd',
    label: 'Siap Jemput',
    description: 'Kendaraan siap di lokasi asal, menunggu proses loading.',
  },
  'Loading': {
    icon: '📦',
    color: '#e65100',
    bg: '#fff3e0',
    label: 'Loading',
    description: 'Barang/hewan sedang dimuat ke kendaraan.',
  },
  'On Delivery': {
    icon: '🚚',
    color: '#006064',
    bg: '#e0f7fa',
    label: 'Dalam Perjalanan',
    description: 'Kendaraan sedang dalam perjalanan menuju tujuan.',
  },
  'Arrived': {
    icon: '📍',
    color: '#6a1b9a',
    bg: '#f3e5f5',
    label: 'Tiba',
    description: 'Kendaraan telah tiba di lokasi tujuan.',
  },
  'Unloading': {
    icon: '🏗️',
    color: '#7b5e2a',
    bg: '#fff8e1',
    label: 'Unloading',
    description: 'Barang/hewan sedang diturunkan dari kendaraan.',
  },
  'Delivery Completed': {
    icon: '🏁',
    color: '#1b5e20',
    bg: '#e8f5ee',
    label: 'Pengiriman Selesai',
    description: 'Pengiriman selesai. Tugas Transport berakhir.',
  },
  'Cancelled': {
    icon: '❌',
    color: '#c62828',
    bg: '#ffebee',
    label: 'Dibatalkan',
    description: 'Pengiriman dibatalkan sebelum keberangkatan.',
  },
};

// ─── Konfigurasi Evidence ─────────────────────────────────────────────────────

export const TRANSPORT_EVIDENCE_PHASE_CONFIG: Record<
  TransportEvidencePhase,
  { icon: string; label: string }
> = {
  'Before Loading': { icon: '📋', label: 'Sebelum Loading' },
  'In Transit':     { icon: '🛣️', label: 'Saat Perjalanan' },
  'On Arrival':     { icon: '🏠', label: 'Saat Tiba' },
};

export const TRANSPORT_EVIDENCE_TIPE_CONFIG: Record<
  TransportEvidenceTipe,
  { icon: string; label: string }
> = {
  'Foto':    { icon: '📷', label: 'Foto' },
  'Video':   { icon: '🎥', label: 'Video' },
  'Lokasi':  { icon: '📍', label: 'Lokasi' },
  'Catatan': { icon: '📝', label: 'Catatan' },
};

/** Quick Template untuk Role Transport — sesuai Constitution §7. */
export const TRANSPORT_QUICK_TEMPLATES: Array<{
  id: string;
  label: string;
  phase: TransportEvidencePhase;
  tipe: TransportEvidenceTipe;
  caption: string;
}> = [
  { id: 'qt-foto-loading',       label: 'Foto Loading',          phase: 'Before Loading', tipe: 'Foto',    caption: 'Foto proses loading barang/hewan.' },
  { id: 'qt-video-loading',      label: 'Video Loading',         phase: 'Before Loading', tipe: 'Video',   caption: 'Video proses loading barang/hewan.' },
  { id: 'qt-lokasi-berangkat',   label: 'Lokasi Berangkat',      phase: 'Before Loading', tipe: 'Lokasi',  caption: 'Titik keberangkatan.' },
  { id: 'qt-lokasi-tiba',        label: 'Lokasi Tiba',           phase: 'On Arrival',     tipe: 'Lokasi',  caption: 'Titik kedatangan.' },
  { id: 'qt-foto-unloading',     label: 'Foto Unloading',        phase: 'On Arrival',     tipe: 'Foto',    caption: 'Foto proses unloading barang/hewan.' },
  { id: 'qt-video-unloading',    label: 'Video Unloading',       phase: 'On Arrival',     tipe: 'Video',   caption: 'Video proses unloading barang/hewan.' },
  { id: 'qt-konfirmasi-kirim',   label: 'Konfirmasi Pengiriman', phase: 'On Arrival',     tipe: 'Catatan', caption: 'Pengiriman selesai. Barang/hewan telah diserahterimakan.' },
];

// ─── Status yang dapat dibatalkan ─────────────────────────────────────────────

const CANCELLABLE_STATUSES: TransportStatus[] = [
  'Waiting Assignment',
  'Accepted',
  'Pickup Ready',
];

// ─── In-memory Store ──────────────────────────────────────────────────────────

let TRANSPORT_RECORDS: TransportRecord[] = [];
let _seeded = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWorkspaceInfo(id: string): { nama: string; icon: string } {
  const ws = WORKSPACES.find((w) => w.id === id);
  return { nama: ws?.name ?? id, icon: ws?.icon ?? '🚚' };
}

function now(): string {
  return new Date().toISOString();
}

function nowMinus(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function makeStatusEntry(
  status: TransportStatus,
  actor: string,
  actorNama: string,
  timestamp: string,
  catatan: string | null = null,
): TransportStatusEntry {
  return { status, timestamp, actor, actorNama, catatan };
}

function makeEvidence(
  transportId: string,
  phase: TransportEvidencePhase,
  tipe: TransportEvidenceTipe,
  caption: string,
  uploadedBy: string,
  minsAgo: number,
  fileName: string | null = null,
): TransportEvidenceRecord {
  return {
    id: generateUUID(),
    transportId,
    phase,
    tipe,
    fileName,
    caption,
    timestamp: nowMinus(minsAgo),
    uploadedBy,
  };
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

function seedIfNeeded(): void {
  if (_seeded) return;
  _seeded = true;

  const allTransaksi = getAllTransaksi();
  // Ambil 2 transaksi pertama dengan status yang cocok untuk seed Transport
  const selesaiTransaksi = allTransaksi.filter(
    (t) => t.status === 'Selesai' || t.status === 'Diproses',
  ).slice(0, 2);

  if (selesaiTransaksi.length === 0) return;

  // ─── Seed 1: Pengiriman Selesai ───────────────────────────────────────────
  const t1 = selesaiTransaksi[0];
  const transportId1 = generateUUID();
  const ws4 = getWorkspaceInfo('w4');

  const record1: TransportRecord = {
    id: transportId1,
    transaksiId: t1.id,
    layananTransportUuid: 'a1b2c3d4-t001-4000-8001-000000000001',
    workspaceIdTransport: 'w4',
    workspaceNamaTransport: ws4.nama,
    workspaceIconTransport: ws4.icon,
    status: 'Delivery Completed',
    statusHistory: [
      makeStatusEntry('Waiting Assignment', 'system',  'System',    nowMinus(300), 'Order transport dibuat otomatis.'),
      makeStatusEntry('Accepted',           'w4',      ws4.nama,    nowMinus(280), 'Penugasan diterima.'),
      makeStatusEntry('Pickup Ready',       'w4',      ws4.nama,    nowMinus(240), 'Kendaraan siap di lokasi asal.'),
      makeStatusEntry('Loading',            'w4',      ws4.nama,    nowMinus(220), null),
      makeStatusEntry('On Delivery',        'w4',      ws4.nama,    nowMinus(180), 'Berangkat dari Garut pukul 08.00.'),
      makeStatusEntry('Arrived',            'w4',      ws4.nama,    nowMinus(90),  'Tiba di Bandung pukul 11.30.'),
      makeStatusEntry('Unloading',          'w4',      ws4.nama,    nowMinus(80),  null),
      makeStatusEntry('Delivery Completed', 'w4',      ws4.nama,    nowMinus(60),  'Pengiriman selesai, semua hewan diserahterimakan.'),
    ],
    pricing: {
      type: 'Fixed',
      percentage: null,
      fixedAmount: 500_000,
      minimumFee: null,
      maximumFee: null,
      feePayer: 'Buyer',
      viaEscrow: false,
    },
    transportFee: 500_000,
    evidence: [
      makeEvidence(transportId1, 'Before Loading', 'Foto',    'Foto kendaraan sebelum berangkat.',            'w4', 220, 'foto_kendaraan_001.jpg'),
      makeEvidence(transportId1, 'Before Loading', 'Foto',    'Foto plat nomor kendaraan.',                  'w4', 219, 'plat_nomor_001.jpg'),
      makeEvidence(transportId1, 'Before Loading', 'Foto',    'Foto ternak sebelum dimuat.',                 'w4', 218, 'foto_ternak_awal_001.jpg'),
      makeEvidence(transportId1, 'Before Loading', 'Video',   'Video proses loading ternak.',                'w4', 215, 'video_loading_001.mp4'),
      makeEvidence(transportId1, 'Before Loading', 'Lokasi',  'Garut, Jawa Barat (Titik Muat)',              'w4', 214),
      makeEvidence(transportId1, 'In Transit',     'Catatan', 'Kondisi jalan baik. Cuaca cerah.',            'w4', 160),
      makeEvidence(transportId1, 'On Arrival',     'Foto',    'Foto proses unloading ternak.',               'w4', 85,  'foto_unloading_001.jpg'),
      makeEvidence(transportId1, 'On Arrival',     'Video',   'Video proses unloading ternak.',              'w4', 84,  'video_unloading_001.mp4'),
      makeEvidence(transportId1, 'On Arrival',     'Foto',    'Foto ternak setelah diturunkan.',             'w4', 83,  'foto_ternak_tiba_001.jpg'),
      makeEvidence(transportId1, 'On Arrival',     'Lokasi',  'Bandung, Jawa Barat (Titik Tiba)',            'w4', 82),
      makeEvidence(transportId1, 'On Arrival',     'Catatan', 'Pengiriman selesai. Barang/hewan diserahterimakan.', 'w4', 60),
    ],
    createdAt: nowMinus(300),
    updatedAt: nowMinus(60),
  };

  TRANSPORT_RECORDS.push(record1);

  // ─── Seed 2: Dalam Perjalanan ─────────────────────────────────────────────
  if (selesaiTransaksi.length < 2) return;

  const t2 = selesaiTransaksi[1];
  const transportId2 = generateUUID();

  const record2: TransportRecord = {
    id: transportId2,
    transaksiId: t2.id,
    layananTransportUuid: 'a1b2c3d4-t002-4000-8001-000000000002',
    workspaceIdTransport: 'w4',
    workspaceNamaTransport: ws4.nama,
    workspaceIconTransport: ws4.icon,
    status: 'On Delivery',
    statusHistory: [
      makeStatusEntry('Waiting Assignment', 'system', 'System',  nowMinus(120), 'Order transport dibuat.'),
      makeStatusEntry('Accepted',           'w4',     ws4.nama,  nowMinus(110), 'Penugasan diterima.'),
      makeStatusEntry('Pickup Ready',       'w4',     ws4.nama,  nowMinus(90),  null),
      makeStatusEntry('Loading',            'w4',     ws4.nama,  nowMinus(75),  null),
      makeStatusEntry('On Delivery',        'w4',     ws4.nama,  nowMinus(60),  'Berangkat dari Bandung.'),
    ],
    pricing: {
      type: 'Fixed',
      percentage: null,
      fixedAmount: 350_000,
      minimumFee: null,
      maximumFee: null,
      feePayer: 'Shared',
      viaEscrow: false,
    },
    transportFee: 350_000,
    evidence: [
      makeEvidence(transportId2, 'Before Loading', 'Foto',   'Foto kendaraan.',                'w4', 75, 'foto_kendaraan_002.jpg'),
      makeEvidence(transportId2, 'Before Loading', 'Foto',   'Foto plat nomor.',               'w4', 74, 'plat_nomor_002.jpg'),
      makeEvidence(transportId2, 'Before Loading', 'Foto',   'Foto ternak sebelum dimuat.',    'w4', 73, 'foto_ternak_awal_002.jpg'),
      makeEvidence(transportId2, 'Before Loading', 'Video',  'Video loading ternak.',          'w4', 72, 'video_loading_002.mp4'),
      makeEvidence(transportId2, 'Before Loading', 'Lokasi', 'Bandung, Jawa Barat (Titik Muat)', 'w4', 71),
      makeEvidence(transportId2, 'In Transit',     'Catatan','Melintas tol Cipularang. Estimasi 90 menit lagi.', 'w4', 30),
    ],
    createdAt: nowMinus(120),
    updatedAt: nowMinus(60),
  };

  TRANSPORT_RECORDS.push(record2);
}

// ─── Fungsi Publik — Query ────────────────────────────────────────────────────

/** Seluruh Transport Record. */
export function getAllTransport(): TransportRecord[] {
  seedIfNeeded();
  return [...TRANSPORT_RECORDS];
}

/** Transport Record berdasarkan id. */
export function getTransportById(id: string): TransportRecord | undefined {
  seedIfNeeded();
  return TRANSPORT_RECORDS.find((r) => r.id === id);
}

/** Transport Records berdasarkan transaksiId. */
export function getTransportByTransaksiId(transaksiId: string): TransportRecord[] {
  seedIfNeeded();
  return TRANSPORT_RECORDS.filter((r) => r.transaksiId === transaksiId);
}

/** Transport Records berdasarkan workspaceId Transporter. */
export function getTransportByWorkspace(workspaceIdTransport: string): TransportRecord[] {
  seedIfNeeded();
  return TRANSPORT_RECORDS.filter((r) => r.workspaceIdTransport === workspaceIdTransport);
}

/** Evidence untuk satu Transport, diurutkan terbaru → terlama. */
export function getTransportEvidence(transportId: string): TransportEvidenceRecord[] {
  seedIfNeeded();
  const rec = TRANSPORT_RECORDS.find((r) => r.id === transportId);
  if (!rec) return [];
  return [...rec.evidence].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/** Evidence per fase. */
export function getTransportEvidenceByPhase(
  transportId: string,
  phase: TransportEvidencePhase,
): TransportEvidenceRecord[] {
  return getTransportEvidence(transportId).filter((e) => e.phase === phase);
}

/** Status history, diurutkan terbaru → terlama. */
export function getTransportStatusHistory(transportId: string): TransportStatusEntry[] {
  seedIfNeeded();
  const rec = TRANSPORT_RECORDS.find((r) => r.id === transportId);
  if (!rec) return [];
  return [...rec.statusHistory].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// ─── Fungsi Publik — Mutation ─────────────────────────────────────────────────

/**
 * Membuat Transport Record baru untuk sebuah transaksi.
 * Dipanggil saat layanan transport diaktifkan dalam transaksi.
 */
export function createTransport(input: CreateTransportInput): TransportRecord {
  seedIfNeeded();

  const transaksi = getTransaksiById(input.transaksiId);
  if (!transaksi) throw new Error(`Transaksi ${input.transaksiId} tidak ditemukan.`);

  const wsInfo = getWorkspaceInfo(input.workspaceIdTransport);
  const timestamp = now();
  const id = generateUUID();

  const record: TransportRecord = {
    id,
    transaksiId: input.transaksiId,
    layananTransportUuid: input.layananTransportUuid ?? null,
    workspaceIdTransport: input.workspaceIdTransport,
    workspaceNamaTransport: wsInfo.nama,
    workspaceIconTransport: wsInfo.icon,
    status: 'Waiting Assignment',
    statusHistory: [
      makeStatusEntry('Waiting Assignment', 'system', 'System', timestamp, 'Transport order dibuat.'),
    ],
    pricing: input.pricing,
    transportFee: input.transportFee ?? null,
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  TRANSPORT_RECORDS.push(record);

  addAuditEvent(
    input.transaksiId,
    'Transport Assigned',
    'system',
    'Transport',
    'Order transport dibuat. Menunggu konfirmasi Transporter.',
  );

  return record;
}

/**
 * Memperbarui status Transport.
 * Status yang dapat dibatalkan: Waiting Assignment, Accepted, Pickup Ready.
 */
export function updateTransportStatus(
  transportId: string,
  status: TransportStatus,
  actor: string,
  catatan?: string,
): void {
  seedIfNeeded();

  const rec = TRANSPORT_RECORDS.find((r) => r.id === transportId);
  if (!rec) return;

  if (status === 'Cancelled' && !CANCELLABLE_STATUSES.includes(rec.status)) {
    throw new Error(
      `Transport tidak dapat dibatalkan dari status "${rec.status}".`,
    );
  }

  const timestamp = now();
  const actorNama = getWorkspaceInfo(actor).nama;

  rec.status = status;
  rec.statusHistory.push(makeStatusEntry(status, actor, actorNama, timestamp, catatan ?? null));
  rec.updatedAt = timestamp;

  // ─── Log ke Audit Trail ───────────────────────────────────────────────────
  const auditMap: Partial<Record<TransportStatus, Parameters<typeof addAuditEvent>[1]>> = {
    'Accepted':           'Transport Assigned',
    'Pickup Ready':       'Transport Pickup',
    'Loading':            'Transport Loading',
    'On Delivery':        'Transport Departure',
    'Arrived':            'Transport Arrived',
    'Unloading':          'Transport Unloading',
    'Delivery Completed': 'Transport Completed',
  };

  const auditDescMap: Partial<Record<TransportStatus, string>> = {
    'Accepted':           'Transporter telah menerima penugasan pengiriman.',
    'Pickup Ready':       'Kendaraan siap di lokasi asal, menunggu proses loading.',
    'Loading':            'Barang/hewan sedang dimuat ke kendaraan.',
    'On Delivery':        'Kendaraan berangkat menuju tujuan.',
    'Arrived':            'Kendaraan telah tiba di lokasi tujuan.',
    'Unloading':          'Barang/hewan sedang diturunkan dari kendaraan.',
    'Delivery Completed': 'Pengiriman selesai. Tugas Transport berakhir.',
    'Cancelled':          'Pengiriman dibatalkan.' + (catatan ? ` Alasan: ${catatan}` : ''),
  };

  const auditEvent = auditMap[status];
  const auditDesc = auditDescMap[status];

  if (auditEvent && auditDesc) {
    addAuditEvent(rec.transaksiId, auditEvent, actor, 'Transport', auditDesc);
  }
}

/**
 * Menambahkan Evidence ke Transport Record.
 * Transport HANYA mengunggah Foto/Video/Lokasi/Catatan.
 * Transport TIDAK menilai kondisi barang/hewan.
 */
export function addTransportEvidence(
  transportId: string,
  input: Omit<TransportEvidenceRecord, 'id' | 'transportId' | 'timestamp'>,
): TransportEvidenceRecord {
  seedIfNeeded();

  const rec = TRANSPORT_RECORDS.find((r) => r.id === transportId);
  if (!rec) throw new Error(`Transport ${transportId} tidak ditemukan.`);

  const evidence: TransportEvidenceRecord = {
    id: generateUUID(),
    transportId,
    ...input,
    timestamp: now(),
  };

  rec.evidence.push(evidence);
  rec.updatedAt = evidence.timestamp;

  return evidence;
}

/**
 * Menghitung Transport Fee berdasarkan pricing policy dan nominal transaksi.
 * Mengembalikan null jika pricing tidak cukup untuk menghitung.
 */
export function calculateTransportFee(
  pricing: TransportPricingPolicy,
  nominalTransaksi: number,
): number | null {
  let fee: number | null = null;

  if (pricing.type === 'Fixed' && pricing.fixedAmount !== null) {
    fee = pricing.fixedAmount;
  } else if (pricing.type === 'Percentage' && pricing.percentage !== null) {
    fee = Math.round(nominalTransaksi * pricing.percentage);
  }

  if (fee === null) return null;

  if (pricing.minimumFee !== null && fee < pricing.minimumFee) {
    fee = pricing.minimumFee;
  }
  if (pricing.maximumFee !== null && fee > pricing.maximumFee) {
    fee = pricing.maximumFee;
  }

  return fee;
}

/**
 * Memperbarui pricing policy dan transport fee pada record.
 */
export function updateTransportPricing(
  transportId: string,
  pricing: TransportPricingPolicy,
  nominalTransaksi: number,
): void {
  seedIfNeeded();
  const rec = TRANSPORT_RECORDS.find((r) => r.id === transportId);
  if (!rec) return;

  rec.pricing = pricing;
  rec.transportFee = calculateTransportFee(pricing, nominalTransaksi);
  rec.updatedAt = now();
}
