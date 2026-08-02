// ─── MPK-012 — Pusat Notifikasi Marketplace ──────────────────────────────────
// Mengagregasi notifikasi dari seluruh modul Marketplace:
//   Listing · Negosiasi · Chat · Transaksi · Sistem (Workspace)
//
// Tidak ada push notification, email, SMS, atau WhatsApp.
// Modul ini hanya baca (tidak mengubah data modul lain).

import { getAllListing } from './marketplaceListingData';
import { getAllTransaksi } from './marketplaceTransaksiData';
import { getAllNegosiasi } from './marketplaceNegosiasiData';
import { getAllNotifikasiChat } from './marketplaceChatData';
import { getStatusVerifikasiWorkspace } from './marketplaceWorkspaceVerifikasiData';

// ─── Tipe ─────────────────────────────────────────────────────────────────────

export type NotifikasiSumber = 'Listing' | 'Negosiasi' | 'Chat' | 'Transaksi' | 'Sistem';

export type NotifikasiTipe =
  // Listing
  | 'Listing Dipublikasikan'
  | 'Listing Ditutup'
  | 'Listing Diarsipkan'
  // Negosiasi
  | 'Penawaran Baru'
  | 'Penawaran Balik'
  | 'Penawaran Disetujui'
  | 'Penawaran Ditolak'
  // Chat
  | 'Pesan Baru'
  | 'Pesan Dibaca'
  // Transaksi
  | 'Transaksi Baru'
  | 'Menunggu Persetujuan'
  | 'Diproses'
  | 'Sedang Dikirim'
  | 'Selesai'
  | 'Dibatalkan'
  // Sistem
  | 'Verifikasi Berhasil'
  | 'Verifikasi Ditolak';

export interface NotifikasiItem {
  id: string;
  sumber: NotifikasiSumber;
  tipe: NotifikasiTipe;
  icon: string;
  judul: string;
  ringkasan: string;
  timestamp: string;
  dibaca: boolean;
  /** Workspace yang menerima notifikasi ini. */
  targetWorkspaceId: string;
  /** ID referensi ke entitas asal (transaksiId, negosiasiId, chatId, listingUuid). */
  refId?: string;
  /** Path navigasi saat "Buka Detail". */
  navigateTo?: string;
}

// ─── Icon & Label per Tipe ────────────────────────────────────────────────────

const TIPE_META: Record<NotifikasiTipe, { icon: string; judul: string }> = {
  'Listing Dipublikasikan': { icon: '📋', judul: 'Listing Dipublikasikan' },
  'Listing Ditutup':        { icon: '🔒', judul: 'Listing Ditutup' },
  'Listing Diarsipkan':     { icon: '📦', judul: 'Listing Diarsipkan' },
  'Penawaran Baru':         { icon: '🤝', judul: 'Penawaran Baru' },
  'Penawaran Balik':        { icon: '🔄', judul: 'Penawaran Balik' },
  'Penawaran Disetujui':    { icon: '✅', judul: 'Penawaran Disetujui' },
  'Penawaran Ditolak':      { icon: '❌', judul: 'Penawaran Ditolak' },
  'Pesan Baru':             { icon: '💬', judul: 'Pesan Baru' },
  'Pesan Dibaca':           { icon: '👁️', judul: 'Pesan Dibaca' },
  'Transaksi Baru':         { icon: '🧾', judul: 'Transaksi Baru' },
  'Menunggu Persetujuan':   { icon: '⏳', judul: 'Menunggu Persetujuan' },
  'Diproses':               { icon: '⚙️', judul: 'Diproses' },
  'Sedang Dikirim':         { icon: '🚚', judul: 'Sedang Dikirim' },
  'Selesai':                { icon: '🎉', judul: 'Transaksi Selesai' },
  'Dibatalkan':             { icon: '🚫', judul: 'Dibatalkan' },
  'Verifikasi Berhasil':    { icon: '🏆', judul: 'Verifikasi Berhasil' },
  'Verifikasi Ditolak':     { icon: '⛔', judul: 'Verifikasi Ditolak' },
};

function makeMeta(tipe: NotifikasiTipe): { icon: string; judul: string } {
  return TIPE_META[tipe] ?? { icon: '🔔', judul: tipe };
}

// ─── Read Overlay ─────────────────────────────────────────────────────────────
// Menyimpan ID notifikasi yang sudah ditandai dibaca di sesi ini.

const READ_IDS = new Set<string>();

// ─── Agregasi Notifikasi ──────────────────────────────────────────────────────

/**
 * Ambil semua notifikasi untuk satu workspace, dari seluruh sumber Marketplace.
 * Diurutkan dari terbaru ke terlama.
 */
export function getNotifikasi(workspaceId: string): NotifikasiItem[] {
  const items: NotifikasiItem[] = [];

  // ── 1. Transaksi ────────────────────────────────────────────────────────────
  // Satu notifikasi per entri riwayatStatus yang relevan untuk workspace ini.
  for (const trx of getAllTransaksi()) {
    const isPenjual = trx.workspaceIdPenjual === workspaceId;
    const isPembeli = trx.workspaceIdPembeli === workspaceId;
    if (!isPenjual && !isPembeli) continue;

    for (let i = 0; i < trx.riwayatStatus.length; i++) {
      const entry = trx.riwayatStatus[i];
      const status = entry.status;

      // Tentukan target & tipe notifikasi berdasarkan status & peran
      let tipe: NotifikasiTipe | null = null;
      let target: 'Penjual' | 'Pembeli' | 'Keduanya' = 'Keduanya';

      if (status === 'Menunggu Persetujuan') { tipe = 'Transaksi Baru'; target = 'Penjual'; }
      else if (status === 'Disetujui')       { tipe = 'Menunggu Persetujuan'; target = 'Pembeli'; }
      else if (status === 'Ditolak')         { tipe = 'Dibatalkan'; target = 'Pembeli'; }
      else if (status === 'Diproses')        { tipe = 'Diproses'; target = 'Pembeli'; }
      else if (status === 'Sedang Dikirim')  { tipe = 'Sedang Dikirim'; target = 'Pembeli'; }
      else if (status === 'Selesai')         { tipe = 'Selesai'; target = 'Keduanya'; }
      else if (status === 'Dibatalkan')      { tipe = 'Dibatalkan'; target = 'Keduanya'; }

      if (!tipe) continue;

      const relevant =
        target === 'Keduanya' ||
        (target === 'Penjual' && isPenjual) ||
        (target === 'Pembeli' && isPembeli);
      if (!relevant) continue;

      const id = `TRX-NOTIF-${trx.id}-${i}`;
      const { icon, judul } = makeMeta(tipe);
      items.push({
        id,
        sumber: 'Transaksi',
        tipe,
        icon,
        judul,
        ringkasan: entry.catatan
          ? `${trx.judulListing} — ${entry.catatan}`
          : `${trx.judulListing} (${trx.qty} ${trx.satuanHarga})`,
        timestamp: entry.timestamp,
        dibaca: READ_IDS.has(id),
        targetWorkspaceId: workspaceId,
        refId: trx.id,
        navigateTo: `/marketplace/transaksi/${trx.id}`,
      });
    }
  }

  // ── 2. Negosiasi ────────────────────────────────────────────────────────────
  for (const neg of getAllNegosiasi()) {
    const isPenjual = neg.workspaceIdPenjual === workspaceId;
    const isPembeli = neg.workspaceIdPembeli === workspaceId;
    if (!isPenjual && !isPembeli) continue;

    for (let i = 0; i < neg.riwayatNegosiasi.length; i++) {
      const entry = neg.riwayatNegosiasi[i];
      const aksi = entry.aksi;
      const oleh = entry.oleh; // 'Pembeli' | 'Penjual' | 'Sistem'

      // Siapa yang mendapat notifikasi dari aksi ini?
      let tipe: NotifikasiTipe | null = null;
      let targetRole: 'Penjual' | 'Pembeli' | 'Keduanya' = 'Keduanya';

      if (aksi === 'Penawaran Dibuat' || aksi === 'Penawaran Diubah') {
        tipe = 'Penawaran Baru'; targetRole = 'Penjual'; // pembeli mengirim → notify penjual
      } else if (aksi === 'Penawaran Balik') {
        tipe = 'Penawaran Balik'; targetRole = 'Pembeli';
      } else if (aksi === 'Penawaran Diterima') {
        tipe = 'Penawaran Disetujui';
        targetRole = oleh === 'Pembeli' ? 'Penjual' : 'Pembeli';
      } else if (aksi === 'Penawaran Ditolak' || aksi === 'Dibatalkan Pembeli') {
        tipe = 'Penawaran Ditolak'; targetRole = oleh === 'Pembeli' ? 'Penjual' : 'Pembeli';
      } else if (aksi === 'Penawaran Kadaluarsa') {
        tipe = 'Penawaran Ditolak'; targetRole = 'Pembeli';
      }

      if (!tipe) continue;

      const relevant =
        targetRole === 'Keduanya' ||
        (targetRole === 'Penjual' && isPenjual) ||
        (targetRole === 'Pembeli' && isPembeli);
      if (!relevant) continue;

      const id = `NEG-NOTIF-${neg.id}-${i}`;
      const { icon, judul } = makeMeta(tipe);
      items.push({
        id,
        sumber: 'Negosiasi',
        tipe,
        icon,
        judul,
        ringkasan: entry.catatan
          ? `${neg.judulListing} — ${entry.catatan}`
          : `${neg.judulListing} @ Rp ${entry.harga.toLocaleString('id-ID')}`,
        timestamp: entry.timestamp,
        dibaca: READ_IDS.has(id),
        targetWorkspaceId: workspaceId,
        refId: neg.id,
        navigateTo: `/marketplace/negosiasi/${neg.id}`,
      });
    }
  }

  // ── 3. Chat ─────────────────────────────────────────────────────────────────
  for (const n of getAllNotifikasiChat()) {
    if (n.targetWorkspaceId !== workspaceId) continue;
    const tipe: NotifikasiTipe = n.tipe === 'PesanBaru' ? 'Pesan Baru' : 'Pesan Dibaca';
    const { icon, judul } = makeMeta(tipe);
    items.push({
      id: `CHAT-NOTIF-${n.id}`,
      sumber: 'Chat',
      tipe,
      icon,
      judul,
      ringkasan: `Pesan ${n.tipe === 'PesanBaru' ? 'baru diterima' : 'telah dibaca'}`,
      timestamp: n.timestamp,
      dibaca: n.dibaca || READ_IDS.has(`CHAT-NOTIF-${n.id}`),
      targetWorkspaceId: workspaceId,
      refId: n.chatId,
      navigateTo: `/marketplace/chat/${n.chatId}`,
    });
  }

  // ── 4. Listing ──────────────────────────────────────────────────────────────
  for (const listing of getAllListing()) {
    if (listing.workspaceId !== workspaceId) continue;

    let tipe: NotifikasiTipe | null = null;
    let ts = listing.createdAt + 'T08:00:00.000Z';

    if (listing.status === 'Aktif') {
      tipe = 'Listing Dipublikasikan';
    } else if (listing.status === 'Ditutup' || listing.status === 'Terjual') {
      tipe = 'Listing Ditutup';
    } else if (listing.status === 'Diarsipkan') {
      tipe = 'Listing Diarsipkan';
    }

    if (!tipe) continue;

    const id = `LISTING-NOTIF-${listing.uuid}`;
    const { icon, judul } = makeMeta(tipe);
    items.push({
      id,
      sumber: 'Listing',
      tipe,
      icon,
      judul,
      ringkasan: listing.judul,
      timestamp: ts,
      dibaca: READ_IDS.has(id),
      targetWorkspaceId: workspaceId,
      refId: listing.uuid,
      navigateTo: `/marketplace/${listing.kategoriSlug}/${listing.slug}`,
    });
  }

  // ── 5. Sistem — Verifikasi Workspace ────────────────────────────────────────
  const status = getStatusVerifikasiWorkspace(workspaceId);
  const sistemId = `SISTEM-VERIF-${workspaceId}`;
  if (status === 'Terverifikasi') {
    items.push({
      id: sistemId,
      sumber: 'Sistem',
      tipe: 'Verifikasi Berhasil',
      icon: '🏆',
      judul: 'Verifikasi Berhasil',
      ringkasan: 'Workspace Anda telah berhasil diverifikasi oleh Marketplace.',
      timestamp: '2026-07-01T10:00:00.000Z',
      dibaca: READ_IDS.has(sistemId),
      targetWorkspaceId: workspaceId,
      navigateTo: '/marketplace',
    });
  } else if (status === 'Dalam Proses') {
    items.push({
      id: sistemId,
      sumber: 'Sistem',
      tipe: 'Verifikasi Berhasil',
      icon: '⏳',
      judul: 'Verifikasi Sedang Diproses',
      ringkasan: 'Pengajuan verifikasi workspace Anda sedang dalam proses peninjauan.',
      timestamp: '2026-07-05T09:00:00.000Z',
      dibaca: READ_IDS.has(sistemId),
      targetWorkspaceId: workspaceId,
      navigateTo: '/marketplace',
    });
  }

  // Urutkan terbaru ke terlama
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return items;
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

export interface RingkasanNotifikasi {
  total: number;
  belumDibaca: number;
  hariIni: number;
  mingguIni: number;
}

export function getRingkasanNotifikasi(workspaceId: string): RingkasanNotifikasi {
  const items = getNotifikasi(workspaceId);
  const now = Date.now();
  const DAY = 86400000;
  const WEEK = 7 * DAY;
  return {
    total: items.length,
    belumDibaca: items.filter(n => !n.dibaca).length,
    hariIni: items.filter(n => now - new Date(n.timestamp).getTime() < DAY).length,
    mingguIni: items.filter(n => now - new Date(n.timestamp).getTime() < WEEK).length,
  };
}

// ─── Mutasi (Tandai Dibaca) ───────────────────────────────────────────────────

/** Tandai satu notifikasi sebagai sudah dibaca. */
export function tandaiDibaca(id: string): void {
  READ_IDS.add(id);
}

/** Tandai semua notifikasi workspace tertentu sebagai sudah dibaca. */
export function tandaiSemuaDibaca(workspaceId: string): void {
  for (const item of getNotifikasi(workspaceId)) {
    READ_IDS.add(item.id);
  }
}

/** Total notifikasi belum dibaca untuk workspace — dipakai oleh badge. */
export function getTotalBelumDibaca(workspaceId: string): number {
  return getNotifikasi(workspaceId).filter(n => !n.dibaca).length;
}
