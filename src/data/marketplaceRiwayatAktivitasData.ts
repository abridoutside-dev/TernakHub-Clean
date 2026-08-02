// ─── MPK-016 — Riwayat Aktivitas Marketplace ──────────────────────────────────
// Agregator READ-ONLY: mengumpulkan semua aktivitas dari modul Marketplace
// (Listing, Wishlist, Negosiasi, Chat, Transaksi) menjadi satu timeline audit.
//
// Tidak ada penyimpanan terpisah — semua aktivitas dihitung ulang setiap kali
// getAllAktivitas() dipanggil langsung dari sumber data yang sudah ada.
// Tidak mengubah modul lain — hanya baca (read-only imports).

import { getAllListing, getListingByUuid } from './marketplaceListingData';
import { getAllTransaksi }                  from './marketplaceTransaksiData';
import { getAllNegosiasi }                  from './marketplaceNegosiasiData';
import { getChatRoomsByWorkspace, getChatMessages } from './marketplaceChatData';
import { getWishlistByWorkspace }           from './marketplaceWishlistData';

// ─── Tipe ─────────────────────────────────────────────────────────────────────

export type JenisAktivitas =
  | 'Listing Dibuat'
  | 'Listing Diubah'
  | 'Listing Dipublikasikan'
  | 'Listing Ditutup'
  | 'Listing Diarsipkan'
  | 'Ditambahkan ke Wishlist'
  | 'Dihapus dari Wishlist'
  | 'Negosiasi Dibuat'
  | 'Penawaran Balik'
  | 'Negosiasi Disetujui'
  | 'Negosiasi Ditolak'
  | 'Chat Dimulai'
  | 'Pesan Baru'
  | 'Transaksi Dibuat'
  | 'Transaksi Diproses'
  | 'Transaksi Selesai'
  | 'Transaksi Dibatalkan';

export type KategoriAktivitas =
  | 'Listing'
  | 'Wishlist'
  | 'Negosiasi'
  | 'Chat'
  | 'Transaksi'
  | 'Sistem';

export interface AktivitasRecord {
  /** ID stabil dalam satu sesi — derivasi dari sumber + tipe + waktu. */
  id: string;
  /** Nomor referensi yang dapat dibaca manusia: AKT-{YYYYMMDD}-{seq:04}. */
  nomorAktivitas: string;
  jenisAktivitas: JenisAktivitas;
  kategori: KategoriAktivitas;
  /** Nomor/ID modul asal mis. TRX-20260711-001, NEG-20260711-001. */
  nomorReferensi: string;
  /** Judul entitas yang terlibat (judul listing, nomor transaksi, dst). */
  judulReferensi: string;
  workspaceId: string;
  workspaceNama: string;
  /** Ringkasan singkat aktivitas. */
  ringkasan: string;
  /** ISO datetime kejadian. */
  waktu: string;
  /** Status entitas pada saat kejadian. */
  status?: string;
  /** Emoji ikon aktivitas. */
  icon: string;
  /** Kolom tambahan untuk panel detail. */
  detail: Record<string, string | number>;
}

// ─── Tabel ikon per jenis aktivitas ───────────────────────────────────────────

const JENIS_ICON: Record<JenisAktivitas, string> = {
  'Listing Dibuat':           '📋',
  'Listing Diubah':           '✏️',
  'Listing Dipublikasikan':   '🟢',
  'Listing Ditutup':          '🔴',
  'Listing Diarsipkan':       '📦',
  'Ditambahkan ke Wishlist':  '🔖',
  'Dihapus dari Wishlist':    '🗑️',
  'Negosiasi Dibuat':         '🤝',
  'Penawaran Balik':          '↩️',
  'Negosiasi Disetujui':      '✅',
  'Negosiasi Ditolak':        '❌',
  'Chat Dimulai':             '💬',
  'Pesan Baru':               '📨',
  'Transaksi Dibuat':         '🧾',
  'Transaksi Diproses':       '⚙️',
  'Transaksi Selesai':        '🎉',
  'Transaksi Dibatalkan':     '🚫',
};

// ─── Helper ID stabil ─────────────────────────────────────────────────────────

function stableId(sourceId: string, jenis: string, waktu: string): string {
  const j = jenis.replace(/\s+/g, '_').toLowerCase();
  const t = waktu.replace(/[^0-9]/g, '').slice(0, 14);
  const s = sourceId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  return `akt-${s}-${j}-${t}`;
}

// ─── Agregator utama ──────────────────────────────────────────────────────────

/**
 * Mengumpulkan semua aktivitas Marketplace yang melibatkan workspaceId
 * (sebagai pemilik listing, pembeli, atau penjual), diurutkan terbaru dulu.
 *
 * Setiap panggilan menghitung ulang dari data sumber — tidak ada cache.
 */
export function getAllAktivitas(workspaceId: string): AktivitasRecord[] {
  const raw: Omit<AktivitasRecord, 'nomorAktivitas'>[] = [];

  // ── 1. Listing ──────────────────────────────────────────────────────────────
  const listings = getAllListing().filter((l) => l.workspaceId === workspaceId);
  for (const l of listings) {
    // Listing Dibuat
    raw.push({
      id: stableId(l.uuid, 'Listing Dibuat', l.createdAt),
      jenisAktivitas: 'Listing Dibuat',
      kategori: 'Listing',
      nomorReferensi: l.uuid.slice(0, 8).toUpperCase(),
      judulReferensi: l.judul,
      workspaceId: l.workspaceId,
      workspaceNama: l.workspaceNama,
      ringkasan: `Listing "${l.judul}" dibuat`,
      waktu: `${l.createdAt}T00:00:00.000Z`,
      status: l.status,
      icon: JENIS_ICON['Listing Dibuat'],
      detail: {
        'UUID Listing':  l.uuid,
        'Judul':         l.judul,
        'Kategori':      l.kategoriSlug,
        'Status Awal':   'Draft',
        'Workspace':     l.workspaceNama,
        'Tanggal':       l.createdAt,
      },
    });

    // Listing Dipublikasikan
    if (l.publishedAt) {
      raw.push({
        id: stableId(l.uuid, 'Listing Dipublikasikan', l.publishedAt),
        jenisAktivitas: 'Listing Dipublikasikan',
        kategori: 'Listing',
        nomorReferensi: l.uuid.slice(0, 8).toUpperCase(),
        judulReferensi: l.judul,
        workspaceId: l.workspaceId,
        workspaceNama: l.workspaceNama,
        ringkasan: `Listing "${l.judul}" dipublikasikan`,
        waktu: l.publishedAt.includes('T') ? l.publishedAt : `${l.publishedAt}T06:00:00.000Z`,
        status: 'Aktif',
        icon: JENIS_ICON['Listing Dipublikasikan'],
        detail: {
          'UUID Listing':    l.uuid,
          'Judul':           l.judul,
          'Status Baru':     'Aktif',
          'Tanggal Publish': l.publishedAt,
          'Harga':           `Rp ${l.harga.toLocaleString('id-ID')} / ${l.satuanHarga}`,
        },
      });
    }

    // Listing Ditutup / Diarsipkan / Terjual
    if (l.status === 'Ditutup' || l.status === 'Diarsipkan' || l.status === 'Terjual') {
      const jenis: JenisAktivitas =
        l.status === 'Ditutup'    ? 'Listing Ditutup' :
        l.status === 'Diarsipkan' ? 'Listing Diarsipkan' :
        'Listing Ditutup'; // Terjual → pake "Listing Ditutup" karena tidak ada tipe khusus
      raw.push({
        id: stableId(l.uuid, jenis, l.updatedAt),
        jenisAktivitas: jenis,
        kategori: 'Listing',
        nomorReferensi: l.uuid.slice(0, 8).toUpperCase(),
        judulReferensi: l.judul,
        workspaceId: l.workspaceId,
        workspaceNama: l.workspaceNama,
        ringkasan: `Listing "${l.judul}" ${l.status.toLowerCase()}`,
        waktu: `${l.updatedAt}T12:00:00.000Z`,
        status: l.status,
        icon: JENIS_ICON[jenis],
        detail: {
          'UUID Listing': l.uuid,
          'Judul':        l.judul,
          'Status Akhir': l.status,
          'Tanggal':      l.updatedAt,
        },
      });
    }
  }

  // ── 2. Transaksi ────────────────────────────────────────────────────────────
  const allTrx = getAllTransaksi().filter(
    (t) => t.workspaceIdPenjual === workspaceId || t.workspaceIdPembeli === workspaceId,
  );
  for (const t of allTrx) {
    for (const rs of t.riwayatStatus) {
      let jenis: JenisAktivitas | null = null;
      if (rs.status === 'Menunggu Persetujuan') jenis = 'Transaksi Dibuat';
      else if (
        rs.status === 'Disetujui' ||
        rs.status === 'Menunggu Pembayaran' ||
        rs.status === 'Diproses' ||
        rs.status === 'Siap Diserahkan' ||
        rs.status === 'Sedang Dikirim'
      ) jenis = 'Transaksi Diproses';
      else if (rs.status === 'Selesai')    jenis = 'Transaksi Selesai';
      else if (rs.status === 'Dibatalkan') jenis = 'Transaksi Dibatalkan';
      else if (rs.status === 'Ditolak')    jenis = 'Transaksi Dibatalkan';

      if (!jenis) continue;

      const aktifSebagai =
        t.workspaceIdPenjual === workspaceId ? 'Penjual' : 'Pembeli';

      raw.push({
        id: stableId(t.id, jenis + rs.status, rs.timestamp),
        jenisAktivitas: jenis,
        kategori: 'Transaksi',
        nomorReferensi: t.id,
        judulReferensi: t.judulListing,
        workspaceId,
        workspaceNama:
          aktifSebagai === 'Penjual' ? t.workspaceNamaPenjual : t.workspaceNamaPembeli,
        ringkasan: rs.catatan
          ? `${jenis} — ${rs.catatan}`
          : `${jenis}: ${t.judulListing} (${aktifSebagai})`,
        waktu: rs.timestamp,
        status: rs.status,
        icon: JENIS_ICON[jenis],
        detail: {
          'Nomor Transaksi':  t.id,
          'Listing':          t.judulListing,
          'Qty':              t.qty,
          'Satuan':           t.satuanHarga,
          'Harga Satuan':     `Rp ${t.hargaSatuan.toLocaleString('id-ID')}`,
          'Total':            `Rp ${t.total.toLocaleString('id-ID')}`,
          'Status':           rs.status,
          'Peran':            aktifSebagai,
          ...(rs.catatan ? { 'Catatan': rs.catatan } : {}),
        },
      });
    }
  }

  // ── 3. Negosiasi ────────────────────────────────────────────────────────────
  const allNeg = getAllNegosiasi().filter(
    (n) => n.workspaceIdPenjual === workspaceId || n.workspaceIdPembeli === workspaceId,
  );
  for (const n of allNeg) {
    for (const rn of n.riwayatNegosiasi) {
      let jenis: JenisAktivitas | null = null;
      if (rn.aksi === 'Penawaran Dibuat' || rn.aksi === 'Penawaran Diubah') jenis = 'Negosiasi Dibuat';
      else if (rn.aksi === 'Penawaran Balik')      jenis = 'Penawaran Balik';
      else if (rn.aksi === 'Penawaran Diterima')   jenis = 'Negosiasi Disetujui';
      else if (rn.aksi === 'Penawaran Ditolak')    jenis = 'Negosiasi Ditolak';
      else if (rn.aksi === 'Dibatalkan Pembeli')   jenis = 'Negosiasi Ditolak';
      else if (rn.aksi === 'Penawaran Kadaluarsa') jenis = 'Negosiasi Ditolak';

      if (!jenis) continue;

      const aktifSebagai =
        n.workspaceIdPenjual === workspaceId ? 'Penjual' : 'Pembeli';

      raw.push({
        id: stableId(n.id, jenis + rn.aksi, rn.timestamp),
        jenisAktivitas: jenis,
        kategori: 'Negosiasi',
        nomorReferensi: n.id,
        judulReferensi: n.judulListing,
        workspaceId,
        workspaceNama:
          aktifSebagai === 'Penjual' ? n.workspaceNamaPenjual : n.workspaceNamaPembeli,
        ringkasan: rn.catatan
          ? `${rn.aksi}: ${rn.catatan}`
          : `${rn.aksi} — ${n.judulListing} (${aktifSebagai})`,
        waktu: rn.timestamp,
        status: n.status,
        icon: JENIS_ICON[jenis],
        detail: {
          'Nomor Negosiasi': n.id,
          'Listing':         n.judulListing,
          'Aksi':            rn.aksi,
          'Oleh':            rn.oleh,
          'Harga Penawaran': `Rp ${rn.harga.toLocaleString('id-ID')}`,
          'Qty':             rn.qty,
          'Status Negosiasi': n.status,
          ...(rn.catatan ? { 'Catatan': rn.catatan } : {}),
        },
      });
    }
  }

  // ── 4. Chat ─────────────────────────────────────────────────────────────────
  const chatRooms = getChatRoomsByWorkspace(workspaceId);
  for (const room of chatRooms) {
    const listing = getListingByUuid(room.listingUuid);
    const judulListing = listing?.judul ?? room.listingUuid.slice(0, 8).toUpperCase();

    // Chat Dimulai
    raw.push({
      id: stableId(room.id, 'Chat Dimulai', room.createdAt),
      jenisAktivitas: 'Chat Dimulai',
      kategori: 'Chat',
      nomorReferensi: room.id,
      judulReferensi: judulListing,
      workspaceId,
      workspaceNama:
        room.workspaceIdPenjual === workspaceId
          ? (listing?.workspaceNama ?? 'Penjual')
          : 'Pembeli',
      ringkasan: `Chat dimulai untuk listing "${judulListing}"`,
      waktu: room.createdAt,
      status: 'Aktif',
      icon: JENIS_ICON['Chat Dimulai'],
      detail: {
        'ID Chat':       room.id,
        'Listing':       judulListing,
        'Penjual':       room.workspaceIdPenjual,
        'Pembeli':       room.workspaceIdPembeli,
        'Dibuat':        room.createdAt,
      },
    });

    // Pesan Baru — ambil pesan terakhir sebagai representasi aktivitas chat
    const messages = getChatMessages(room.id);
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.timestamp !== room.createdAt) {
      const isFromMe = lastMsg.fromWorkspaceId === workspaceId;
      raw.push({
        id: stableId(lastMsg.id, 'Pesan Baru', lastMsg.timestamp),
        jenisAktivitas: 'Pesan Baru',
        kategori: 'Chat',
        nomorReferensi: room.id,
        judulReferensi: judulListing,
        workspaceId,
        workspaceNama:
          room.workspaceIdPenjual === workspaceId
            ? (listing?.workspaceNama ?? 'Penjual')
            : 'Pembeli',
        ringkasan: isFromMe
          ? `Pesan terkirim: "${room.lastMessagePreview.slice(0, 60)}"`
          : `Pesan diterima: "${room.lastMessagePreview.slice(0, 60)}"`,
        waktu: lastMsg.timestamp,
        status: lastMsg.status,
        icon: JENIS_ICON['Pesan Baru'],
        detail: {
          'ID Chat':     room.id,
          'Listing':     judulListing,
          'Pesan':       room.lastMessagePreview,
          'Status':      lastMsg.status,
          'Waktu':       lastMsg.timestamp,
          'Arah':        isFromMe ? 'Terkirim' : 'Diterima',
        },
      });
    }
  }

  // ── 5. Wishlist ─────────────────────────────────────────────────────────────
  const wishlist = getWishlistByWorkspace(workspaceId);
  for (const w of wishlist) {
    const listing = getListingByUuid(w.listingUuid);
    if (!listing) continue;
    raw.push({
      id: stableId(w.id, 'Ditambahkan ke Wishlist', w.addedAt),
      jenisAktivitas: 'Ditambahkan ke Wishlist',
      kategori: 'Wishlist',
      nomorReferensi: listing.uuid.slice(0, 8).toUpperCase(),
      judulReferensi: listing.judul,
      workspaceId,
      workspaceNama: listing.workspaceNama,
      ringkasan: `"${listing.judul}" ditambahkan ke wishlist`,
      waktu: w.addedAt,
      status: listing.status,
      icon: JENIS_ICON['Ditambahkan ke Wishlist'],
      detail: {
        'UUID Listing':   listing.uuid,
        'Judul Listing':  listing.judul,
        'Kategori':       listing.kategoriSlug,
        'Status Listing': listing.status,
        'Ditambahkan':    w.addedAt,
        'Harga':          `Rp ${listing.harga.toLocaleString('id-ID')} / ${listing.satuanHarga}`,
      },
    });
  }

  // ── Urutkan terbaru dulu ──────────────────────────────────────────────────
  raw.sort((a, b) => b.waktu.localeCompare(a.waktu));

  // ── Beri nomor urut berdasarkan urutan terbaru ────────────────────────────
  return raw.map((r, idx) => {
    const d = new Date(r.waktu);
    const dateStr = Number.isNaN(d.getTime())
      ? '00000000'
      : d.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(idx + 1).padStart(4, '0');
    return { ...r, nomorAktivitas: `AKT-${dateStr}-${seq}` };
  });
}

// ─── Statistik ringkasan ──────────────────────────────────────────────────────

export interface RingkasanAktivitas {
  total: number;
  hariIni: number;
  mingguIni: number;
  bulanIni: number;
}

export function getRingkasanAktivitas(workspaceId: string): RingkasanAktivitas {
  const all = getAllAktivitas(workspaceId);
  const now = new Date();

  const todayStr  = now.toISOString().slice(0, 10);
  const weekAgo   = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    total:    all.length,
    hariIni:  all.filter((a) => a.waktu.startsWith(todayStr)).length,
    mingguIni: all.filter((a) => a.waktu >= weekAgo).length,
    bulanIni:  all.filter((a) => a.waktu >= monthAgo).length,
  };
}
