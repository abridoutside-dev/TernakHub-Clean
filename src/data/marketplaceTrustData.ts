// ─── Marketplace — Trust Score & Riwayat Verifikasi (MPK-017) ────────────────
// Trust diberikan kepada Workspace, bukan kepada Listing.
// Listing hanya membaca data trust dari modul ini.
//
// Trust Score dihitung LIVE dari data aktual (7 faktor):
//   1. Kelengkapan Profil Workspace  (max 15)
//   2. Status Verifikasi             (max 25)
//   3. Konsistensi Data              (max 10)
//   4. Riwayat Transaksi             (max 20)
//   5. Riwayat Penyelesaian Transaksi(max 20)
//   6. Aktivitas Marketplace         (max  5)
//   7. Kelengkapan Identitas         (max  5)
//                                  TOTAL 100
//
// TIDAK dihitung dari: followers, likes, view, popularitas.
//
// Modul ini TIDAK mengubah Workspace, Livestock, Master Pakan,
// Produk Komersial, Formula, atau modul lain — baca-saja terhadap semua.

import { WORKSPACES } from '../components/TopAppBar';
import { getStatusVerifikasiWorkspace } from './marketplaceWorkspaceVerifikasiData';
import { getAllListing } from './marketplaceListingData';
import { getAllPesanan } from './marketplacePesananData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TrustLevel =
  | 'Baru'
  | 'Berkembang'
  | 'Terpercaya'
  | 'Sangat Terpercaya'
  | 'Premium';

export type TipeRiwayatVerifikasi =
  | 'Pengajuan'
  | 'Disetujui'
  | 'Ditolak'
  | 'Ditangguhkan';

export interface FaktorPenilaian {
  /** Nama faktor yang ditampilkan kepada pengguna. */
  nama: string;
  /** Deskripsi singkat tentang faktor ini. */
  deskripsi: string;
  /** Skor yang diperoleh untuk faktor ini. */
  skor: number;
  /** Skor maksimum faktor ini. */
  skorMaks: number;
  /** Ikon faktor. */
  icon: string;
}

export interface TrustScore {
  /** Skor agregat 0-100. */
  skor: number;
  /** Level trust berdasarkan skor. */
  level: TrustLevel;
  /** Rincian per faktor. */
  faktorPenilaian: FaktorPenilaian[];
  /** Ringkasan satu kalimat tentang posisi trust workspace ini. */
  ringkasan: string;
}

export interface RiwayatVerifikasiEvent {
  tanggal: string; // ISO date yyyy-mm-dd
  tipe: TipeRiwayatVerifikasi;
  keterangan: string;
}

export interface TrustLevelBadge {
  level: TrustLevel;
  bintang: string;  // e.g. "⭐⭐⭐"
  label: string;
  color: string;
  bg: string;
}

// ─── Static seed: data yang tidak bisa dihitung dari kode ────────────────────

/** Tanggal bergabung Marketplace per workspaceId (Marketplace-local metadata). */
const BERGABUNG_SEJAK: Record<string, string> = {
  w1: '2024-03-15',
  w2: '2024-09-20',
  w3: '2025-01-10',
  w4: '2025-06-01',
};

/** Riwayat kejadian verifikasi per workspaceId (urutan kronologis). */
const RIWAYAT_VERIFIKASI: Record<string, RiwayatVerifikasiEvent[]> = {
  w1: [
    {
      tanggal: '2024-03-15',
      tipe: 'Pengajuan',
      keterangan: 'Pengajuan verifikasi diterima. Dokumen identitas dan legalitas usaha diunggah.',
    },
    {
      tanggal: '2024-03-18',
      tipe: 'Disetujui',
      keterangan: 'Verifikasi disetujui. Dokumen dinyatakan lengkap dan valid. Workspace resmi terverifikasi.',
    },
  ],
  w2: [
    {
      tanggal: '2024-09-20',
      tipe: 'Pengajuan',
      keterangan: 'Pengajuan verifikasi diterima. Dokumen SIUP dan identitas pemilik diunggah.',
    },
    {
      tanggal: '2024-09-27',
      tipe: 'Disetujui',
      keterangan: 'Verifikasi disetujui. Dokumen legalitas dan profil usaha dinyatakan valid.',
    },
  ],
  w3: [
    {
      tanggal: '2025-01-10',
      tipe: 'Pengajuan',
      keterangan: 'Pengajuan verifikasi diterima. Tim Marketplace sedang meninjau dokumen yang dikirimkan.',
    },
  ],
  w4: [],
};

// ─── Trust Level helpers ──────────────────────────────────────────────────────

const LEVEL_THRESHOLDS: { min: number; level: TrustLevel }[] = [
  { min: 80, level: 'Premium' },
  { min: 60, level: 'Sangat Terpercaya' },
  { min: 40, level: 'Terpercaya' },
  { min: 20, level: 'Berkembang' },
  { min:  0, level: 'Baru' },
];

const LEVEL_BADGE_MAP: Record<TrustLevel, Omit<TrustLevelBadge, 'level'>> = {
  'Baru':              { bintang: '⭐',          label: 'Baru',              color: '#616161', bg: '#f5f5f5' },
  'Berkembang':        { bintang: '⭐⭐',        label: 'Berkembang',        color: '#7b5e2a', bg: '#fff8e1' },
  'Terpercaya':        { bintang: '⭐⭐⭐',      label: 'Terpercaya',        color: '#0277bd', bg: '#e1f5fe' },
  'Sangat Terpercaya': { bintang: '⭐⭐⭐⭐',    label: 'Sangat Terpercaya', color: '#1b7a43', bg: '#e8f5ee' },
  'Premium':           { bintang: '⭐⭐⭐⭐⭐',  label: 'Premium',           color: '#6a1b9a', bg: '#f3e5f5' },
};

/** Menentukan TrustLevel berdasarkan skor 0-100. */
export function getTrustLevel(skor: number): TrustLevel {
  for (const t of LEVEL_THRESHOLDS) {
    if (skor >= t.min) return t.level;
  }
  return 'Baru';
}

/** Badge visual untuk TrustLevel. */
export function getTrustLevelBadge(level: TrustLevel): TrustLevelBadge {
  return { level, ...LEVEL_BADGE_MAP[level] };
}

/**
 * Urutan TrustLevel dari terendah ke tertinggi — SSOT agar UI tidak hardcode
 * daftar level ini secara terpisah.
 */
export const TRUST_LEVEL_ORDER: readonly TrustLevel[] = [
  'Baru',
  'Berkembang',
  'Terpercaya',
  'Sangat Terpercaya',
  'Premium',
] as const;

// ─── Live computation ─────────────────────────────────────────────────────────

/** Hitung Trust Score satu Workspace secara LIVE dari data aktual. */
export function computeTrustScore(workspaceId: string): TrustScore {
  const workspace = WORKSPACES.find((w) => w.id === workspaceId);
  const statusVerif = getStatusVerifikasiWorkspace(workspaceId);

  // Data aktual yang dibaca (baca-saja)
  const allListings = getAllListing().filter((l) => l.workspaceId === workspaceId);
  const activeListings = allListings.filter((l) => l.status === 'Aktif');
  const allPesanan = getAllPesanan();
  // Pesanan terlibat: sebagai penjual (supplier name) ATAU pembeli (workspaceTujuan name)
  const wName = workspace?.name ?? '';
  const pesananTerlibat = allPesanan.filter(
    (p) => p.supplier === wName || p.workspaceTujuan === wName,
  );
  const pesananSelesai = pesananTerlibat.filter((p) => p.status === 'Diterima');
  const bergabung = BERGABUNG_SEJAK[workspaceId];

  // ── Faktor 1: Kelengkapan Profil Workspace (max 15) ────────────────────────
  let f1 = 0;
  if (workspace?.name)  f1 += 5;
  if (workspace?.type)  f1 += 5;
  if (workspace?.icon)  f1 += 5;

  // ── Faktor 2: Status Verifikasi (max 25) ───────────────────────────────────
  const f2 =
    statusVerif === 'Terverifikasi' ? 25 :
    statusVerif === 'Dalam Proses'  ? 10 : 0;

  // ── Faktor 3: Konsistensi Data (max 10) ────────────────────────────────────
  // Listing workspaceNama harus sesuai dengan nama Workspace terdaftar.
  let f3 = 0;
  if (allListings.length > 0 && workspace) {
    const semua = allListings.every((l) => l.workspaceNama === workspace.name);
    f3 = semua ? 10 : 3;
  } else if (workspace) {
    f3 = 5; // Belum ada listing — tidak bisa dinilai, skor tengah.
  }

  // ── Faktor 4: Riwayat Transaksi (max 20) ───────────────────────────────────
  const jumlahPesanan = pesananTerlibat.length;
  const f4 =
    jumlahPesanan >= 6 ? 20 :
    jumlahPesanan >= 3 ? 15 :
    jumlahPesanan >= 1 ?  8 : 0;

  // ── Faktor 5: Riwayat Penyelesaian Transaksi (max 20) ──────────────────────
  const f5 = jumlahPesanan > 0
    ? Math.round((pesananSelesai.length / jumlahPesanan) * 20)
    : 0;

  // ── Faktor 6: Aktivitas Marketplace (max 5) ────────────────────────────────
  const f6 = activeListings.length > 0 ? 5 : 0;

  // ── Faktor 7: Kelengkapan Identitas (max 5) ────────────────────────────────
  const f7 = bergabung ? 5 : 0;

  const skorTotal = f1 + f2 + f3 + f4 + f5 + f6 + f7;
  const level = getTrustLevel(skorTotal);

  const faktorPenilaian: FaktorPenilaian[] = [
    {
      nama: 'Kelengkapan Profil Workspace',
      deskripsi: 'Nama, jenis, dan identitas visual workspace sudah terisi.',
      icon: '🏪',
      skor: f1,
      skorMaks: 15,
    },
    {
      nama: 'Status Verifikasi',
      deskripsi: 'Workspace telah melalui proses verifikasi identitas oleh tim Marketplace.',
      icon: '✅',
      skor: f2,
      skorMaks: 25,
    },
    {
      nama: 'Konsistensi Data',
      deskripsi: 'Informasi pada listing konsisten dengan data workspace yang terdaftar.',
      icon: '🔗',
      skor: f3,
      skorMaks: 10,
    },
    {
      nama: 'Riwayat Transaksi',
      deskripsi: 'Jumlah total transaksi yang pernah dilakukan di Marketplace.',
      icon: '📦',
      skor: f4,
      skorMaks: 20,
    },
    {
      nama: 'Riwayat Penyelesaian Transaksi',
      deskripsi: 'Persentase transaksi yang berhasil diselesaikan (barang diterima).',
      icon: '🤝',
      skor: f5,
      skorMaks: 20,
    },
    {
      nama: 'Aktivitas Marketplace',
      deskripsi: 'Workspace memiliki listing aktif di Marketplace.',
      icon: '📋',
      skor: f6,
      skorMaks: 5,
    },
    {
      nama: 'Kelengkapan Identitas',
      deskripsi: 'Informasi tanggal bergabung dan profil identitas sudah tersedia.',
      icon: '🪪',
      skor: f7,
      skorMaks: 5,
    },
  ];

  const ringkasan = buildRingkasan(level, skorTotal, statusVerif);

  return { skor: skorTotal, level, faktorPenilaian, ringkasan };
}

function buildRingkasan(
  level: TrustLevel,
  skor: number,
  statusVerif: ReturnType<typeof getStatusVerifikasiWorkspace>,
): string {
  if (statusVerif === 'Ditangguhkan') {
    return 'Workspace ini saat ini ditangguhkan. Aktivitas Marketplace dibatasi selama penangguhan berlangsung.';
  }
  if (level === 'Premium') {
    return `Workspace Premium dengan skor kepercayaan ${skor}/100. Rekam jejak transaksi dan verifikasi identitas sangat baik.`;
  }
  if (level === 'Sangat Terpercaya') {
    return `Workspace Sangat Terpercaya dengan skor ${skor}/100. Profil lengkap, terverifikasi, dan aktif bertransaksi.`;
  }
  if (level === 'Terpercaya') {
    return `Workspace Terpercaya dengan skor ${skor}/100. Profil dan verifikasi cukup baik. Tingkatkan aktivitas transaksi untuk naik level.`;
  }
  if (level === 'Berkembang') {
    return `Workspace Berkembang dengan skor ${skor}/100. Lengkapi profil dan ajukan verifikasi untuk meningkatkan kepercayaan.`;
  }
  return `Workspace Baru dengan skor ${skor}/100. Mulai lengkapi profil dan ajukan verifikasi untuk membangun kepercayaan.`;
}

// ─── Public accessors ─────────────────────────────────────────────────────────

/** Tanggal bergabung Marketplace satu Workspace. Undefined jika belum ada. */
export function getWorkspaceBergabungSejak(workspaceId: string): string | undefined {
  return BERGABUNG_SEJAK[workspaceId];
}

/** Format tanggal bergabung menjadi label Indonesia: "15 Mar 2024". */
export function formatBergabungSejak(iso: string): string {
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

/** Riwayat kejadian verifikasi satu Workspace (urutan kronologis). */
export function getRiwayatVerifikasiWorkspace(workspaceId: string): RiwayatVerifikasiEvent[] {
  return RIWAYAT_VERIFIKASI[workspaceId] ?? [];
}

/** Badge visual Trust Level untuk satu workspaceId. */
export function getTrustBadgeByWorkspaceId(workspaceId: string): TrustLevelBadge {
  const { level } = computeTrustScore(workspaceId);
  return getTrustLevelBadge(level);
}
