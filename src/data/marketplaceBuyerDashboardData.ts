// ─── MPK-014 — Dashboard Pembeli Marketplace ─────────────────────────────────
// Agregator data untuk Dashboard Pembeli. Hanya membaca data Marketplace.
// Tidak ada akses langsung ke modul aset (Livestock, Stok Pakan, Obat, dll).
// Semua data difilter berdasarkan workspaceId sebagai pembeli.

import { getAllListing, getPlaceholderJumlahDilihat, type ListingItem } from './marketplaceListingData';
import { getAllTransaksi, type TransaksiItem } from './marketplaceTransaksiData';
import { getAllNegosiasi, type NegosiasiItem } from './marketplaceNegosiasiData';
import { getChatRoomsByWorkspace, type ChatRoom } from './marketplaceChatData';
import { getWishlistByWorkspace } from './marketplaceWishlistData';

// ─── Status sets ──────────────────────────────────────────────────────────────

const NEG_AKTIF: readonly string[] = ['Menunggu Respon Penjual', 'Penawaran Balik'];
const TRX_AKTIF: readonly string[] = [
  'Menunggu Persetujuan', 'Disetujui', 'Menunggu Pembayaran',
  'Diproses', 'Siap Diserahkan', 'Sedang Dikirim',
];

// ─── Model ────────────────────────────────────────────────────────────────────

export interface BuyerRingkasan {
  wishlist: number;
  negosiasiAktif: number;
  transaksiAktif: number;
  transaksiSelesai: number;
}

/** ChatRoom yang sudah di-resolve judulListing & namaPenjual dari data listing. */
export interface ChatRoomDisplay extends ChatRoom {
  judulListing: string;
  namaPenjual: string;
}

/** Listing yang sudah di-resolve dari wishlist UUID. */
export interface WishlistDisplay {
  id: string;
  listing: ListingItem;
  addedAt: string;
}

export interface BuyerAiInsight {
  /** Listing baru di kategori yang sering dibeli pembeli. */
  listingBaruSesuaiMinat: ListingItem[];
  /** Listing di kategori serupa dengan pembelian terakhir. */
  listingSerupa: ListingItem[];
  /** Penjual yang paling sering bertransaksi dengan pembeli. */
  penjualSeringBertransaksi: { workspaceId: string; nama: string; count: number }[];
}

export interface BuyerDashboardData {
  ringkasan: BuyerRingkasan;
  aiInsight: BuyerAiInsight;
  /** Rekomendasi listing (max 10), diurutkan oleh preferensi kategori + views. */
  rekomendasi: ListingItem[];
  transaksiTerbaru: TransaksiItem[];
  negosiasiTerbaru: NegosiasiItem[];
  chatTerbaru: ChatRoomDisplay[];
  wishlist: WishlistDisplay[];
}

// ─── Agregator Utama ──────────────────────────────────────────────────────────

/**
 * Mengembalikan seluruh data Dashboard Pembeli untuk satu workspace.
 * Semua data berasal dari Marketplace saja.
 */
export function getDashboardPembeli(workspaceId: string): BuyerDashboardData {
  const allListings  = getAllListing();
  const myTransaksi  = getAllTransaksi().filter(t => t.workspaceIdPembeli === workspaceId);
  const myNegosiasi  = getAllNegosiasi().filter(n => n.workspaceIdPembeli === workspaceId);
  const allRooms     = getChatRoomsByWorkspace(workspaceId);
  const myChatRooms  = allRooms.filter(r => r.workspaceIdPembeli === workspaceId);
  const wishlistRaw  = getWishlistByWorkspace(workspaceId);

  // Buat lookup listing by uuid untuk resolusi cepat
  const listingByUuid = new Map<string, ListingItem>();
  for (const l of allListings) listingByUuid.set(l.uuid, l);

  // ── Ringkasan ──────────────────────────────────────────────────────────────
  const ringkasan: BuyerRingkasan = {
    wishlist:        wishlistRaw.length,
    negosiasiAktif:  myNegosiasi.filter(n => NEG_AKTIF.includes(n.status)).length,
    transaksiAktif:  myTransaksi.filter(t => TRX_AKTIF.includes(t.status)).length,
    transaksiSelesai:myTransaksi.filter(t => t.status === 'Selesai').length,
  };

  // ── Kategori favorit pembeli (dari transaksi + negosiasi, berbobot) ─────
  const catScore = new Map<string, number>();
  for (const t of myTransaksi) {
    catScore.set(t.kategoriSlug, (catScore.get(t.kategoriSlug) ?? 0) + 1);
  }
  for (const n of myNegosiasi) {
    catScore.set(n.kategoriSlug, (catScore.get(n.kategoriSlug) ?? 0) + 0.5);
  }
  const topCats = [...catScore.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([slug]) => slug);

  // ── Rekomendasi (listing Aktif bukan milik workspace ini) ─────────────────
  const otherActive = allListings.filter(
    l => l.workspaceId !== workspaceId && l.status === 'Aktif',
  );

  const scored = otherActive.map(l => {
    const catIdx = topCats.indexOf(l.kategoriSlug);
    const boost = catIdx === -1 ? 0 : (topCats.length - catIdx) * 100;
    return { listing: l, score: boost + getPlaceholderJumlahDilihat(l) };
  });
  scored.sort((a, b) => b.score - a.score);
  const rekomendasi = scored.slice(0, 10).map(s => s.listing);

  // ── AI Insight ─────────────────────────────────────────────────────────────
  const recentUuids = new Set(myTransaksi.slice(0, 5).map(t => t.listingUuid));
  const recentCats  = new Set(myTransaksi.slice(0, 5).map(t => t.kategoriSlug));

  const listingBaruSesuaiMinat = otherActive
    .filter(l => topCats.includes(l.kategoriSlug) && !recentUuids.has(l.uuid))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  const listingSerupa = otherActive
    .filter(l => recentCats.has(l.kategoriSlug) && !recentUuids.has(l.uuid))
    .slice(0, 4);

  const penjualCounter = new Map<string, { nama: string; count: number }>();
  for (const t of myTransaksi) {
    const prev = penjualCounter.get(t.workspaceIdPenjual) ?? { nama: t.workspaceNamaPenjual, count: 0 };
    prev.count += 1;
    penjualCounter.set(t.workspaceIdPenjual, prev);
  }
  const penjualSeringBertransaksi = [...penjualCounter.entries()]
    .map(([wsId, d]) => ({ workspaceId: wsId, nama: d.nama, count: d.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const aiInsight: BuyerAiInsight = {
    listingBaruSesuaiMinat,
    listingSerupa,
    penjualSeringBertransaksi,
  };

  // ── Chat Terbaru — resolve listing info ────────────────────────────────────
  const chatTerbaru: ChatRoomDisplay[] = myChatRooms
    .slice()
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    .slice(0, 5)
    .map(room => {
      const listing = listingByUuid.get(room.listingUuid);
      return {
        ...room,
        judulListing: listing?.judul ?? '(listing tidak ditemukan)',
        namaPenjual:  listing?.penjual ?? listing?.workspaceNama ?? '—',
      };
    });

  // ── Wishlist — resolve listing info ────────────────────────────────────────
  const wishlist: WishlistDisplay[] = wishlistRaw
    .map(w => {
      const listing = listingByUuid.get(w.listingUuid);
      if (!listing) return null;
      return { id: w.id, listing, addedAt: w.addedAt };
    })
    .filter((x): x is WishlistDisplay => x !== null);

  return {
    ringkasan,
    aiInsight,
    rekomendasi,
    transaksiTerbaru: myTransaksi
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
    negosiasiTerbaru: myNegosiasi
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
    chatTerbaru,
    wishlist,
  };
}
