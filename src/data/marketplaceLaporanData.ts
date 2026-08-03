// ─── Marketplace — Laporan & Moderasi Data Layer (MPK-018) ────────────────────
// Sistem pelaporan Listing Marketplace.
// Report BUKAN untuk sengketa transaksi — hanya untuk dugaan pelanggaran.
// Tidak ada tindakan otomatis terhadap Listing atau Workspace.
//
// Alur: submitLaporan() → LaporanRecord masuk dengan status 'Menunggu Review'
//       → moderator memperbarui status melalui updateStatusLaporan()
//       → riwayatPenanganan tumbuh per perubahan status.
//
// Integrasi Moderasi: getAllLaporan() / getLaporanSummary() adalah sumber data
// untuk halaman Moderasi Marketplace (/marketplace/laporan).

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlasanLaporan =
  | 'Informasi Tidak Sesuai'
  | 'Duplikat Listing'
  | 'Spam'
  | 'Penipuan'
  | 'Barang/Jasa Tidak Tersedia'
  | 'Harga Menyesatkan'
  | 'Konten Tidak Pantas'
  | 'Lainnya';

export type StatusLaporan =
  | 'Menunggu Review'
  | 'Diproses'
  | 'Memerlukan Informasi Tambahan'
  | 'Selesai'
  | 'Ditolak';

export interface RiwayatPenangananEvent {
  /** ISO date (yyyy-mm-dd) */
  tanggal: string;
  status: StatusLaporan;
  catatan: string;
}

export interface LaporanRecord {
  /** Format: LAP-YYYYMMDD-NNN */
  id: string;
  /** UUID listing yang dilaporkan */
  listingUuid: string;
  listingJudul: string;
  listingSlug: string;
  listingKategoriSlug: string;
  workspaceIdTerlapor: string;
  workspaceNamaTerlapor: string;
  workspaceIdPelapor: string;
  workspaceNamaPelapor: string;
  alasan: AlasanLaporan;
  keterangan: string;
  /** Emoji/placeholder URL lampiran — opsional */
  lampiran: string[];
  status: StatusLaporan;
  /** ISO date (yyyy-mm-dd) */
  tanggalLaporan: string;
  riwayatPenanganan: RiwayatPenangananEvent[];
}

export interface LaporanSummary {
  total: number;
  menungguReview: number;
  diproses: number;
  selesai: number;
  ditolak: number;
  memerlukanInformasi: number;
}

// ─── Alasan meta ──────────────────────────────────────────────────────────────

export const ALASAN_LAPORAN_LIST: {
  value: AlasanLaporan;
  label: string;
  icon: string;
  deskripsi: string;
}[] = [
  {
    value: 'Informasi Tidak Sesuai',
    label: 'Informasi Tidak Sesuai',
    icon: '⚠️',
    deskripsi: 'Deskripsi, harga, atau foto tidak sesuai dengan produk/jasa sebenarnya.',
  },
  {
    value: 'Duplikat Listing',
    label: 'Duplikat Listing',
    icon: '📋',
    deskripsi: 'Listing yang sama diposting lebih dari satu kali oleh penjual yang sama.',
  },
  {
    value: 'Spam',
    label: 'Spam',
    icon: '🚫',
    deskripsi: 'Listing dibuat dalam jumlah berlebihan atau bersifat gangguan.',
  },
  {
    value: 'Penipuan',
    label: 'Penipuan',
    icon: '🛡️',
    deskripsi: 'Indikasi penipuan — listing fiktif atau bertujuan merugikan pembeli.',
  },
  {
    value: 'Barang/Jasa Tidak Tersedia',
    label: 'Barang/Jasa Tidak Tersedia',
    icon: '📦',
    deskripsi: 'Produk atau jasa sudah tidak tersedia namun listing masih aktif.',
  },
  {
    value: 'Harga Menyesatkan',
    label: 'Harga Menyesatkan',
    icon: '💰',
    deskripsi: 'Harga yang tertera tidak jelas, tersembunyi, atau mengecoh pembeli.',
  },
  {
    value: 'Konten Tidak Pantas',
    label: 'Konten Tidak Pantas',
    icon: '🔞',
    deskripsi: 'Listing mengandung konten yang tidak sesuai atau melanggar norma.',
  },
  {
    value: 'Lainnya',
    label: 'Lainnya',
    icon: '📝',
    deskripsi: 'Alasan lain yang tidak tercantum — harap jelaskan pada kolom keterangan.',
  },
];

// ─── Status meta ──────────────────────────────────────────────────────────────

export const STATUS_LAPORAN_META: Record<
  StatusLaporan,
  { icon: string; color: string; bg: string; label: string }
> = {
  'Menunggu Review':               { icon: '🕐', color: '#7a6b1c', bg: '#fdf3d0', label: 'Menunggu Review' },
  'Diproses':                      { icon: '⚙️', color: '#0277bd', bg: '#e1f5fe', label: 'Diproses' },
  'Memerlukan Informasi Tambahan': { icon: '❓', color: '#7b3f00', bg: '#fff3e0', label: 'Perlu Info Tambahan' },
  'Selesai':                       { icon: '✅', color: '#1b7a43', bg: '#e8f5ee', label: 'Selesai' },
  'Ditolak':                       { icon: '❌', color: '#c62828', bg: '#ffebee', label: 'Ditolak' },
};

// ─── In-memory store ──────────────────────────────────────────────────────────

let LAPORAN_COUNTER = 4; // seed ada 3, counter mulai dari 4

const LAPORAN_LIST: LaporanRecord[] = [
  // Seed 1 — Menunggu Review
  {
    id: 'LAP-20260701-001',
    listingUuid: 'seed-listing-uuid-001',
    listingJudul: 'Domba Garut Jantan — Siap Jual',
    listingSlug: 'domba-garut-jantan-siap-jual',
    listingKategoriSlug: 'ternak',
    workspaceIdTerlapor: 'w1',
    workspaceNamaTerlapor: 'Berkah Farm Garut',
    workspaceIdPelapor: 'w2',
    workspaceNamaPelapor: 'Maju Jaya Peternakan',
    alasan: 'Informasi Tidak Sesuai',
    keterangan:
      'Foto domba tidak sesuai dengan kondisi sebenarnya. Domba yang diterima jauh berbeda dari gambar listing.',
    lampiran: ['📸'],
    status: 'Menunggu Review',
    tanggalLaporan: '2026-07-05',
    riwayatPenanganan: [
      {
        tanggal: '2026-07-05',
        status: 'Menunggu Review',
        catatan: 'Laporan diterima dan menunggu tinjauan moderator.',
      },
    ],
  },
  // Seed 2 — Diproses
  {
    id: 'LAP-20260703-002',
    listingUuid: 'seed-listing-uuid-002',
    listingJudul: 'Rumput Gajah Segar — per Ikat 5 kg',
    listingSlug: 'rumput-gajah-segar-per-ikat-5-kg',
    listingKategoriSlug: 'pakan',
    workspaceIdTerlapor: 'w2',
    workspaceNamaTerlapor: 'Maju Jaya Peternakan',
    workspaceIdPelapor: 'w1',
    workspaceNamaPelapor: 'Berkah Farm Garut',
    alasan: 'Harga Menyesatkan',
    keterangan:
      'Harga per ikat tertera Rp 8.000, namun saat transaksi penjual meminta harga berbeda tanpa penjelasan.',
    lampiran: [],
    status: 'Diproses',
    tanggalLaporan: '2026-07-03',
    riwayatPenanganan: [
      {
        tanggal: '2026-07-03',
        status: 'Menunggu Review',
        catatan: 'Laporan diterima dan menunggu tinjauan moderator.',
      },
      {
        tanggal: '2026-07-06',
        status: 'Diproses',
        catatan: 'Moderator mengonfirmasi laporan valid. Penjual dihubungi untuk klarifikasi.',
      },
    ],
  },
  // Seed 3 — Selesai
  {
    id: 'LAP-20260620-003',
    listingUuid: 'seed-listing-uuid-003',
    listingJudul: 'Jasa Transport Ternak Garut – Bandung',
    listingSlug: 'jasa-transport-ternak-garut-bandung',
    listingKategoriSlug: 'jasa',
    workspaceIdTerlapor: 'w3',
    workspaceNamaTerlapor: 'Nusantara Agro',
    workspaceIdPelapor: 'w1',
    workspaceNamaPelapor: 'Berkah Farm Garut',
    alasan: 'Spam',
    keterangan:
      'Listing jasa transport ini muncul lebih dari 5 kali dengan judul berbeda dalam satu minggu.',
    lampiran: [],
    status: 'Selesai',
    tanggalLaporan: '2026-06-20',
    riwayatPenanganan: [
      {
        tanggal: '2026-06-20',
        status: 'Menunggu Review',
        catatan: 'Laporan diterima.',
      },
      {
        tanggal: '2026-06-22',
        status: 'Diproses',
        catatan: 'Moderator memverifikasi pola listing duplikat dari workspace ini.',
      },
      {
        tanggal: '2026-06-25',
        status: 'Selesai',
        catatan:
          'Listing-listing duplikat telah dihapus oleh penjual setelah moderator mengirimkan peringatan.',
      },
    ],
  },
];

// ─── ID Generator ─────────────────────────────────────────────────────────────

function generateLaporanId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(LAPORAN_COUNTER).padStart(3, '0');
  LAPORAN_COUNTER += 1;
  return `LAP-${y}${m}${d}-${seq}`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Cek duplikat identik: workspace + listing + alasan yang sama
 * dalam 7 hari terakhir.
 */
export function isDuplicateLaporan(params: {
  workspaceIdPelapor: string;
  listingUuid: string;
  alasan: AlasanLaporan;
}): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return LAPORAN_LIST.some(
    (l) =>
      l.workspaceIdPelapor === params.workspaceIdPelapor &&
      l.listingUuid === params.listingUuid &&
      l.alasan === params.alasan &&
      l.tanggalLaporan >= cutoffStr,
  );
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface SubmitLaporanPayload {
  listingUuid: string;
  listingJudul: string;
  listingSlug: string;
  listingKategoriSlug: string;
  workspaceIdTerlapor: string;
  workspaceNamaTerlapor: string;
  workspaceIdPelapor: string;
  workspaceNamaPelapor: string;
  alasan: AlasanLaporan;
  keterangan: string;
  lampiran?: string[];
}

export type SubmitLaporanResult =
  | { ok: true; laporan: LaporanRecord }
  | { ok: false; reason: 'duplicate' | 'self_report' | 'empty_keterangan' };

/**
 * Kirim laporan baru.
 * - Tidak boleh melaporkan listing milik sendiri.
 * - Tidak boleh duplikat dalam 7 hari.
 * - Keterangan wajib diisi.
 */
export function submitLaporan(payload: SubmitLaporanPayload): SubmitLaporanResult {
  if (payload.workspaceIdPelapor === payload.workspaceIdTerlapor) {
    return { ok: false, reason: 'self_report' };
  }
  if (!payload.keterangan.trim()) {
    return { ok: false, reason: 'empty_keterangan' };
  }
  if (
    isDuplicateLaporan({
      workspaceIdPelapor: payload.workspaceIdPelapor,
      listingUuid: payload.listingUuid,
      alasan: payload.alasan,
    })
  ) {
    return { ok: false, reason: 'duplicate' };
  }

  const laporan: LaporanRecord = {
    id: generateLaporanId(),
    listingUuid: payload.listingUuid,
    listingJudul: payload.listingJudul,
    listingSlug: payload.listingSlug,
    listingKategoriSlug: payload.listingKategoriSlug,
    workspaceIdTerlapor: payload.workspaceIdTerlapor,
    workspaceNamaTerlapor: payload.workspaceNamaTerlapor,
    workspaceIdPelapor: payload.workspaceIdPelapor,
    workspaceNamaPelapor: payload.workspaceNamaPelapor,
    alasan: payload.alasan,
    keterangan: payload.keterangan.trim(),
    lampiran: payload.lampiran ?? [],
    status: 'Menunggu Review',
    tanggalLaporan: new Date().toISOString().slice(0, 10),
    riwayatPenanganan: [
      {
        tanggal: new Date().toISOString().slice(0, 10),
        status: 'Menunggu Review',
        catatan: 'Laporan diterima dan menunggu tinjauan moderator.',
      },
    ],
  };

  LAPORAN_LIST.unshift(laporan);
  return { ok: true, laporan };
}

/**
 * Perbarui status laporan — untuk modul Moderasi.
 * Setiap perubahan status menambah satu entry di riwayatPenanganan.
 */
export function updateStatusLaporan(
  id: string,
  status: StatusLaporan,
  catatan: string,
): boolean {
  const laporan = LAPORAN_LIST.find((l) => l.id === id);
  if (!laporan) return false;
  laporan.status = status;
  laporan.riwayatPenanganan.push({ tanggal: new Date().toISOString().slice(0, 10), status, catatan });
  return true;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function getAllLaporan(): LaporanRecord[] {
  return [...LAPORAN_LIST];
}

export function getLaporanById(id: string): LaporanRecord | undefined {
  return LAPORAN_LIST.find((l) => l.id === id);
}

/** Semua laporan yang dikirim oleh workspace tertentu (sebagai pelapor). */
export function getLaporanByPelapor(workspaceId: string): LaporanRecord[] {
  return LAPORAN_LIST.filter((l) => l.workspaceIdPelapor === workspaceId);
}

/** Semua laporan yang masuk untuk workspace tertentu (sebagai terlapor). */
export function getLaporanByTerlapor(workspaceId: string): LaporanRecord[] {
  return LAPORAN_LIST.filter((l) => l.workspaceIdTerlapor === workspaceId);
}

/** Ringkasan untuk kartu Moderasi. */
export function getLaporanSummary(): LaporanSummary {
  const list = LAPORAN_LIST;
  return {
    total: list.length,
    menungguReview: list.filter((l) => l.status === 'Menunggu Review').length,
    diproses: list.filter((l) => l.status === 'Diproses').length,
    selesai: list.filter((l) => l.status === 'Selesai').length,
    ditolak: list.filter((l) => l.status === 'Ditolak').length,
    memerlukanInformasi: list.filter(
      (l) => l.status === 'Memerlukan Informasi Tambahan',
    ).length,
  };
}

/**
 * Filter & cari laporan.
 * query: cari di id, listingJudul, listingSlug, workspaceNamaTerlapor, workspaceNamaPelapor
 * status: filter by status (undefined = semua)
 */
// ─── DB populate ──────────────────────────────────────────────────────────────
// populateLaporanFromDb() merges marketplace_moderations rows into LAPORAN_LIST.
// Called by useMarketplace after repoGetLaporanByWorkspace() succeeds.
// Guard: if rows.length === 0 → keep seed data.

export interface MarketplaceLaporanDbRowForPopulate {
  id: string;
  listing_id: string | null;
  reported_by_workspace_id: string | null;
  moderation_type: string | null;
  reason: string | null;
  status: string;  // 'Pending'|'UnderReview'|'Resolved'|'Ditolak'
  created_at: string;
}

function mapModerasiStatusToLaporan(dbStatus: string): StatusLaporan {
  switch (dbStatus) {
    case 'UnderReview': return 'Diproses';
    case 'Resolved':    return 'Selesai';
    case 'Ditolak':     return 'Ditolak';
    default:            return 'Menunggu Review';  // 'Pending'
  }
}

export function populateLaporanFromDb(
  rows: MarketplaceLaporanDbRowForPopulate[],
): void {
  if (rows.length === 0) return;

  const hydrated: LaporanRecord[] = rows.map((row) => {
    const dateStr = row.created_at.slice(0, 10);
    const statusUI = mapModerasiStatusToLaporan(row.status);
    return {
      id: row.id,                             // UUID from DB
      listingUuid: row.listing_id ?? '',
      listingJudul: row.listing_id ?? '(Listing)',
      listingSlug: '',
      listingKategoriSlug: '',
      workspaceIdTerlapor: '',
      workspaceNamaTerlapor: '(Terlapor)',
      workspaceIdPelapor: row.reported_by_workspace_id ?? '',
      workspaceNamaPelapor: '(Pelapor)',
      alasan: (row.moderation_type ?? 'Lainnya') as AlasanLaporan,
      keterangan: row.reason ?? '',
      lampiran: [],
      status: statusUI,
      tanggalLaporan: dateStr,
      riwayatPenanganan: [
        { tanggal: dateStr, status: 'Menunggu Review', catatan: 'Laporan diterima.' },
        ...(statusUI !== 'Menunggu Review'
          ? [{ tanggal: dateStr, status: statusUI, catatan: `Status: ${statusUI}` }]
          : []),
      ],
    };
  });

  // Merge: upsert by id
  const dbIds = new Set(hydrated.map((l) => l.id));
  for (let i = LAPORAN_LIST.length - 1; i >= 0; i--) {
    if (dbIds.has(LAPORAN_LIST[i].id)) LAPORAN_LIST.splice(i, 1);
  }
  LAPORAN_LIST.push(...hydrated);
  // Sort newest first
  LAPORAN_LIST.sort((a, b) => b.tanggalLaporan.localeCompare(a.tanggalLaporan));
}

export function queryLaporan(params: {
  query?: string;
  status?: StatusLaporan;
}): LaporanRecord[] {
  let list = LAPORAN_LIST;

  if (params.status) {
    list = list.filter((l) => l.status === params.status);
  }

  if (params.query && params.query.trim()) {
    const q = params.query.trim().toLowerCase();
    list = list.filter(
      (l) =>
        l.id.toLowerCase().includes(q) ||
        l.listingJudul.toLowerCase().includes(q) ||
        l.listingSlug.toLowerCase().includes(q) ||
        l.workspaceNamaTerlapor.toLowerCase().includes(q) ||
        l.workspaceNamaPelapor.toLowerCase().includes(q),
    );
  }

  return list;
}
