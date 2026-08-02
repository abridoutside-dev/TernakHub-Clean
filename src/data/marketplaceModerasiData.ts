// ─── Marketplace — Moderasi Data Layer (MPK-019) ──────────────────────────────
// Sistem Moderasi Marketplace: menangani kasus pelanggaran listing.
//
// Sumber kasus: Report Listing (dari LaporanRecord) | Deteksi Sistem | Review Manual.
// Moderasi HANYA mengelola Listing Marketplace.
// Tidak mengubah data Livestock, Stok Pakan, Stok Obat, atau aset lainnya.
//
// Alur:
//   KasusModerasiRecord dibuat dengan status 'Menunggu Review'
//   → moderator membuka kasus → status 'Sedang Diproses'
//   → moderator mengambil tindakan → riwayatKeputusan bertumbuh
//   → status akhir: 'Selesai' atau 'Ditolak'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SumberModerasi =
  | 'Report Listing'
  | 'Deteksi Sistem'
  | 'Review Manual';

export type StatusModerasi =
  | 'Menunggu Review'
  | 'Sedang Diproses'
  | 'Memerlukan Klarifikasi'
  | 'Selesai'
  | 'Ditolak';

export type TindakanModerasi =
  | 'Tidak Ada Pelanggaran'
  | 'Minta Perbaikan Listing'
  | 'Sembunyikan Listing'
  | 'Tutup Listing'
  | 'Eskalasi';

export interface RiwayatKeputusan {
  /** ISO date (yyyy-mm-dd) */
  tanggal: string;
  status: StatusModerasi;
  tindakan?: TindakanModerasi;
  /** Catatan moderator untuk keputusan ini */
  catatan: string;
}

export interface KasusModerasiRecord {
  /** Format: KAS-YYYYMMDD-NNN */
  id: string;
  /** Nomor laporan terkait (LAP-...) — opsional jika dari Deteksi Sistem / Review Manual */
  nomorReport?: string;
  /** UUID listing yang ditinjau */
  listingUuid: string;
  listingJudul: string;
  listingSlug: string;
  listingKategoriSlug: string;
  workspaceId: string;
  workspaceNama: string;
  sumber: SumberModerasi;
  alasan: string;
  /** Deskripsi bukti / lampiran (teks atau emoji placeholder) */
  bukti: string[];
  /** Catatan moderator aktif — diperbarui saat tindakan diambil */
  catatanModerator: string;
  status: StatusModerasi;
  tindakan?: TindakanModerasi;
  /** ISO date (yyyy-mm-dd) */
  tanggalDibuat: string;
  /** Seluruh riwayat keputusan — append-only, jangan dihapus */
  riwayatKeputusan: RiwayatKeputusan[];
}

export interface KasusModerasiSummary {
  total: number;
  menungguReview: number;
  sedangDiproses: number;
  memerlukanKlarifikasi: number;
  selesai: number;
  ditolak: number;
}

// ─── Status & Tindakan Meta ───────────────────────────────────────────────────

export const STATUS_MODERASI_META: Record<
  StatusModerasi,
  { icon: string; color: string; bg: string; label: string }
> = {
  'Menunggu Review':        { icon: '🕐', color: '#7a6b1c', bg: '#fdf3d0', label: 'Menunggu Review' },
  'Sedang Diproses':        { icon: '⚙️', color: '#0277bd', bg: '#e1f5fe', label: 'Sedang Diproses' },
  'Memerlukan Klarifikasi': { icon: '❓', color: '#7b3f00', bg: '#fff3e0', label: 'Perlu Klarifikasi' },
  'Selesai':                { icon: '✅', color: '#1b7a43', bg: '#e8f5ee', label: 'Selesai' },
  'Ditolak':                { icon: '❌', color: '#c62828', bg: '#ffebee', label: 'Ditolak' },
};

export const SUMBER_MODERASI_META: Record<
  SumberModerasi,
  { icon: string; color: string; bg: string }
> = {
  'Report Listing':   { icon: '🚩', color: '#c62828', bg: '#ffebee' },
  'Deteksi Sistem':   { icon: '🤖', color: '#0277bd', bg: '#e1f5fe' },
  'Review Manual':    { icon: '👁️', color: '#5c3d8f', bg: '#f3eaff' },
};

export const TINDAKAN_MODERASI_LIST: {
  value: TindakanModerasi;
  label: string;
  icon: string;
  deskripsi: string;
  warna: string;
}[] = [
  {
    value: 'Tidak Ada Pelanggaran',
    label: 'Tidak Ada Pelanggaran',
    icon: '✅',
    deskripsi: 'Listing telah ditinjau dan tidak ditemukan pelanggaran. Kasus ditutup.',
    warna: '#1b7a43',
  },
  {
    value: 'Minta Perbaikan Listing',
    label: 'Minta Perbaikan Listing',
    icon: '📝',
    deskripsi: 'Penjual diminta memperbaiki listing dalam batas waktu tertentu.',
    warna: '#7a6b1c',
  },
  {
    value: 'Sembunyikan Listing',
    label: 'Sembunyikan Listing',
    icon: '🙈',
    deskripsi: 'Listing disembunyikan sementara hingga ada keputusan lebih lanjut.',
    warna: '#7b3f00',
  },
  {
    value: 'Tutup Listing',
    label: 'Tutup Listing',
    icon: '🚫',
    deskripsi: 'Listing ditutup secara permanen karena melanggar ketentuan.',
    warna: '#c62828',
  },
  {
    value: 'Eskalasi',
    label: 'Eskalasi',
    icon: '⬆️',
    deskripsi: 'Kasus diteruskan ke tim moderasi senior untuk penanganan lebih lanjut.',
    warna: '#5c3d8f',
  },
];

// ─── In-memory store ──────────────────────────────────────────────────────────

let KASUS_COUNTER = 5; // seed ada 4, counter mulai dari 5

const KASUS_LIST: KasusModerasiRecord[] = [
  // Kasus 1 — Menunggu Review, dari Report Listing
  {
    id: 'KAS-20260705-001',
    nomorReport: 'LAP-20260701-001',
    listingUuid: 'seed-listing-uuid-001',
    listingJudul: 'Domba Garut Jantan — Siap Jual',
    listingSlug: 'domba-garut-jantan-siap-jual',
    listingKategoriSlug: 'ternak',
    workspaceId: 'w1',
    workspaceNama: 'Berkah Farm Garut',
    sumber: 'Report Listing',
    alasan: 'Informasi Tidak Sesuai',
    bukti: ['📸 Foto listing vs kondisi aktual berbeda', '📋 LAP-20260701-001'],
    catatanModerator: '',
    status: 'Menunggu Review',
    tindakan: undefined,
    tanggalDibuat: '2026-07-05',
    riwayatKeputusan: [
      {
        tanggal: '2026-07-05',
        status: 'Menunggu Review',
        catatan: 'Kasus dibuat dari laporan LAP-20260701-001. Menunggu tinjauan moderator.',
      },
    ],
  },
  // Kasus 2 — Sedang Diproses, dari Report Listing
  {
    id: 'KAS-20260706-002',
    nomorReport: 'LAP-20260703-002',
    listingUuid: 'seed-listing-uuid-002',
    listingJudul: 'Rumput Gajah Segar — per Ikat 5 kg',
    listingSlug: 'rumput-gajah-segar-per-ikat-5-kg',
    listingKategoriSlug: 'pakan',
    workspaceId: 'w2',
    workspaceNama: 'Maju Jaya Peternakan',
    sumber: 'Report Listing',
    alasan: 'Harga Menyesatkan',
    bukti: ['📋 LAP-20260703-002', '💬 Konfirmasi pelapor via chat'],
    catatanModerator: 'Penjual dihubungi untuk klarifikasi harga. Menunggu respons.',
    status: 'Sedang Diproses',
    tindakan: undefined,
    tanggalDibuat: '2026-07-06',
    riwayatKeputusan: [
      {
        tanggal: '2026-07-06',
        status: 'Menunggu Review',
        catatan: 'Kasus dibuat dari laporan LAP-20260703-002.',
      },
      {
        tanggal: '2026-07-08',
        status: 'Sedang Diproses',
        catatan: 'Moderator mengonfirmasi laporan valid. Penjual dihubungi untuk klarifikasi harga.',
      },
    ],
  },
  // Kasus 3 — Memerlukan Klarifikasi, dari Deteksi Sistem
  {
    id: 'KAS-20260708-003',
    listingUuid: 'seed-listing-uuid-004',
    listingJudul: 'Konsentrat Sapi Perah Premium — 50 kg',
    listingSlug: 'konsentrat-sapi-perah-premium-50-kg',
    listingKategoriSlug: 'pakan',
    workspaceId: 'w3',
    workspaceNama: 'Nusantara Agro',
    sumber: 'Deteksi Sistem',
    alasan: 'Duplikat Listing — Sistem mendeteksi 3 listing serupa dalam 48 jam',
    bukti: ['🤖 Deteksi otomatis pola duplikat', '📊 3 listing identik terdeteksi'],
    catatanModerator: 'Penjual diminta menjelaskan alasan listing serupa.',
    status: 'Memerlukan Klarifikasi',
    tindakan: undefined,
    tanggalDibuat: '2026-07-08',
    riwayatKeputusan: [
      {
        tanggal: '2026-07-08',
        status: 'Menunggu Review',
        catatan: 'Kasus dibuat otomatis oleh sistem deteksi duplikat.',
      },
      {
        tanggal: '2026-07-09',
        status: 'Sedang Diproses',
        catatan: 'Moderator meninjau pola listing dari workspace ini.',
      },
      {
        tanggal: '2026-07-10',
        status: 'Memerlukan Klarifikasi',
        tindakan: undefined,
        catatan: 'Penjual diminta memberikan klarifikasi dalam 3 hari kerja.',
      },
    ],
  },
  // Kasus 4 — Selesai, dari Review Manual
  {
    id: 'KAS-20260625-004',
    listingUuid: 'seed-listing-uuid-003',
    listingJudul: 'Jasa Transport Ternak Garut – Bandung',
    listingSlug: 'jasa-transport-ternak-garut-bandung',
    listingKategoriSlug: 'jasa',
    workspaceId: 'w3',
    workspaceNama: 'Nusantara Agro',
    sumber: 'Report Listing',
    alasan: 'Spam — listing muncul lebih dari 5 kali dengan judul berbeda',
    bukti: ['📸 Screenshot 5 listing serupa', '📋 LAP-20260620-003'],
    catatanModerator: 'Listing duplikat telah dihapus oleh penjual setelah peringatan moderator.',
    status: 'Selesai',
    tindakan: 'Minta Perbaikan Listing',
    tanggalDibuat: '2026-06-20',
    riwayatKeputusan: [
      {
        tanggal: '2026-06-20',
        status: 'Menunggu Review',
        catatan: 'Kasus dibuat dari laporan LAP-20260620-003.',
      },
      {
        tanggal: '2026-06-22',
        status: 'Sedang Diproses',
        catatan: 'Moderator memverifikasi pola listing duplikat dari workspace ini.',
      },
      {
        tanggal: '2026-06-24',
        status: 'Sedang Diproses',
        tindakan: 'Minta Perbaikan Listing',
        catatan: 'Peringatan resmi dikirimkan. Penjual diminta menghapus listing duplikat.',
      },
      {
        tanggal: '2026-06-25',
        status: 'Selesai',
        tindakan: 'Minta Perbaikan Listing',
        catatan: 'Listing duplikat telah dihapus. Kasus diselesaikan.',
      },
    ],
  },
];

// ─── ID Generator ─────────────────────────────────────────────────────────────

function generateKasusId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(KASUS_COUNTER).padStart(3, '0');
  KASUS_COUNTER += 1;
  return `KAS-${y}${m}${d}-${seq}`;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface BuatKasusPayload {
  nomorReport?: string;
  listingUuid: string;
  listingJudul: string;
  listingSlug: string;
  listingKategoriSlug: string;
  workspaceId: string;
  workspaceNama: string;
  sumber: SumberModerasi;
  alasan: string;
  bukti?: string[];
}

/**
 * Buat kasus moderasi baru.
 * Selalu mulai dengan status 'Menunggu Review'.
 * Tidak memengaruhi data aset apapun.
 */
export function buatKasusModerasi(payload: BuatKasusPayload): KasusModerasiRecord {
  const kasus: KasusModerasiRecord = {
    id: generateKasusId(),
    nomorReport: payload.nomorReport,
    listingUuid: payload.listingUuid,
    listingJudul: payload.listingJudul,
    listingSlug: payload.listingSlug,
    listingKategoriSlug: payload.listingKategoriSlug,
    workspaceId: payload.workspaceId,
    workspaceNama: payload.workspaceNama,
    sumber: payload.sumber,
    alasan: payload.alasan,
    bukti: payload.bukti ?? [],
    catatanModerator: '',
    status: 'Menunggu Review',
    tindakan: undefined,
    tanggalDibuat: new Date().toISOString().slice(0, 10),
    riwayatKeputusan: [
      {
        tanggal: new Date().toISOString().slice(0, 10),
        status: 'Menunggu Review',
        catatan: payload.nomorReport
          ? `Kasus dibuat dari laporan ${payload.nomorReport}.`
          : `Kasus dibuat dari sumber: ${payload.sumber}.`,
      },
    ],
  };
  KASUS_LIST.unshift(kasus);
  return kasus;
}

export interface AmbilTindakanPayload {
  kasusId: string;
  status: StatusModerasi;
  tindakan?: TindakanModerasi;
  catatan: string;
  catatanModerator?: string;
}

/**
 * Ambil tindakan moderasi pada suatu kasus.
 * Setiap pemanggilan HARUS disertai catatan — tidak boleh tanpa jejak audit.
 * Menambah satu entry di riwayatKeputusan.
 */
export function ambilTindakanModerasi(payload: AmbilTindakanPayload): boolean {
  if (!payload.catatan.trim()) return false;
  const kasus = KASUS_LIST.find((k) => k.id === payload.kasusId);
  if (!kasus) return false;

  kasus.status = payload.status;
  if (payload.tindakan) kasus.tindakan = payload.tindakan;
  if (payload.catatanModerator !== undefined) kasus.catatanModerator = payload.catatanModerator;

  kasus.riwayatKeputusan.push({
    tanggal: new Date().toISOString().slice(0, 10),
    status: payload.status,
    tindakan: payload.tindakan,
    catatan: payload.catatan.trim(),
  });

  return true;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function getAllKasusModerasi(): KasusModerasiRecord[] {
  return [...KASUS_LIST];
}

export function getKasusModerasiById(id: string): KasusModerasiRecord | undefined {
  return KASUS_LIST.find((k) => k.id === id);
}

export function getKasusModerasiSummary(): KasusModerasiSummary {
  const list = KASUS_LIST;
  return {
    total: list.length,
    menungguReview: list.filter((k) => k.status === 'Menunggu Review').length,
    sedangDiproses: list.filter((k) => k.status === 'Sedang Diproses').length,
    memerlukanKlarifikasi: list.filter((k) => k.status === 'Memerlukan Klarifikasi').length,
    selesai: list.filter((k) => k.status === 'Selesai').length,
    ditolak: list.filter((k) => k.status === 'Ditolak').length,
  };
}

/**
 * Filter & cari kasus moderasi.
 * query: cari di id, nomorReport, listingJudul, listingSlug, workspaceNama
 * status: filter by status (undefined = semua)
 */
export function queryKasusModerasi(params: {
  query?: string;
  status?: StatusModerasi;
}): KasusModerasiRecord[] {
  let list = KASUS_LIST;

  if (params.status) {
    list = list.filter((k) => k.status === params.status);
  }

  if (params.query && params.query.trim()) {
    const q = params.query.trim().toLowerCase();
    list = list.filter(
      (k) =>
        k.id.toLowerCase().includes(q) ||
        (k.nomorReport ?? '').toLowerCase().includes(q) ||
        k.listingJudul.toLowerCase().includes(q) ||
        k.listingSlug.toLowerCase().includes(q) ||
        k.workspaceNama.toLowerCase().includes(q),
    );
  }

  return list;
}
