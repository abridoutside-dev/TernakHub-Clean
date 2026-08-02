// ─── Marketplace — AI Insight Full (MPK-020) ──────────────────────────────────
// Aggregator yang membaca data LIVE dari seluruh modul Marketplace.
// AI hanya memberikan Insight — tidak mengambil keputusan, tidak mengubah data.
//
// Sumber data:
//   • marketplaceListingData      → getAllListing(), getPlaceholderJumlahDilihat()
//   • marketplaceTransaksiData    → getAllTransaksi(), getRingkasanTransaksi()
//   • marketplaceNegosiasiData    → getAllNegosiasi(), getRingkasanNegosiasi()
//   • marketplaceWishlistData     → getWishlistByWorkspace() per workspace
//   • marketplaceChatData         → getChatRoomsByWorkspace() per workspace
//   • marketplaceWorkspaceVerifikasiData → getStatusVerifikasiWorkspace()
//   • marketplaceKategoriData     → KATEGORI_MARKETPLACE
//
// Tidak ada hardcode angka — seluruh angka dihitung dari data live.

import {
  getAllListing,
  getPlaceholderJumlahDilihat,
  type ListingItem,
} from './marketplaceListingData';
import {
  getAllTransaksi,
  getRingkasanTransaksi,
} from './marketplaceTransaksiData';
import {
  getAllNegosiasi,
  getRingkasanNegosiasi,
} from './marketplaceNegosiasiData';
import { getWishlistByWorkspace } from './marketplaceWishlistData';
import { getChatRoomsByWorkspace } from './marketplaceChatData';
import {
  getStatusVerifikasiWorkspace,
  type StatusVerifikasiWorkspace,
} from './marketplaceWorkspaceVerifikasiData';
import { KATEGORI_MARKETPLACE } from './marketplaceKategoriData';

// Tanggal referensi dihitung di dalam computeFullAiInsight() agar selalu fresh
// setiap kali fungsi dipanggil (bukan di module-level yang hanya jalan sekali
// saat import pertama kali).

// ─── Types Output ─────────────────────────────────────────────────────────────

export interface ListingInsightItem {
  uuid: string;
  judul: string;
  kategoriSlug: string;
  kategoriNama: string;
  kategoriIcon: string;
  workspaceNama: string;
  nilai: number;
  satuan: string;
}

export interface KategoriInsightItem {
  slug: string;
  nama: string;
  icon: string;
  jumlah: number;
}

export interface WorkspaceInsightItem {
  workspaceId: string;
  workspaceNama: string;
  jumlah: number;
  satuan: string;
  statusVerifikasi: StatusVerifikasiWorkspace;
}

export interface RekomendasiItem {
  id: string;
  icon: string;
  judul: string;
  deskripsi: string;
  prioritas: 'tinggi' | 'sedang' | 'rendah';
}

export interface RingkasanMarketplace {
  totalListingAktif: number;
  totalListingTerjual: number;
  totalTransaksi: number;
  totalNegosiasi: number;
  totalWorkspaceAktif: number;
  totalChatAktif: number;
}

export interface InsightPenjualan {
  listingPalingBanyakDilihat: ListingInsightItem[];
  listingPalingBanyakDinegosiasi: ListingInsightItem[];
  listingPalingBanyakTerjual: ListingInsightItem[];
  kategoriTerlaris: KategoriInsightItem[];
}

export interface InsightPembelian {
  kategoriPalingBanyakDicari: KategoriInsightItem[];
  listingPalingBanyakDisimpan: ListingInsightItem[];
  listingPalingBanyakDibuka: ListingInsightItem[];
}

export interface InsightListing {
  listingHampirKadaluarsa: ListingInsightItem[];
  listingTanpaAktivitas: ListingInsightItem[];
  listingPerluDiperbarui: ListingInsightItem[];
  listingPerformaTerbaik: ListingInsightItem[];
}

export interface InsightWorkspace {
  workspacePalingAktif: WorkspaceInsightItem[];
  workspaceBaru: WorkspaceInsightItem[];
  workspaceTerverifikasi: WorkspaceInsightItem[];
}

export interface FullAiInsight {
  ringkasan: RingkasanMarketplace;
  insightPenjualan: InsightPenjualan;
  insightPembelian: InsightPembelian;
  insightListing: InsightListing;
  insightWorkspace: InsightWorkspace;
  rekomendasi: RekomendasiItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function kategoriMeta(slug: string): { nama: string; icon: string } {
  const k = KATEGORI_MARKETPLACE.find((k) => k.slug === slug);
  return { nama: k?.nama ?? slug, icon: k?.icon ?? '📦' };
}

function toListingInsightItem(
  listing: ListingItem,
  nilai: number,
  satuan: string,
): ListingInsightItem {
  const meta = kategoriMeta(listing.kategoriSlug);
  return {
    uuid: listing.uuid,
    judul: listing.judul,
    kategoriSlug: listing.kategoriSlug,
    kategoriNama: meta.nama,
    kategoriIcon: meta.icon,
    workspaceNama: listing.workspaceNama,
    nilai,
    satuan,
  };
}

// ─── Main Aggregator ──────────────────────────────────────────────────────────

/**
 * Menghitung seluruh AI Insight Marketplace dari data LIVE.
 * Tidak mengubah data apapun — baca saja.
 */
export function computeFullAiInsight(): FullAiInsight {
  // ── Tanggal referensi — dihitung fresh setiap kali fungsi dipanggil ──────────
  const _now = new Date();
  const TODAY_ISO        = _now.toISOString().slice(0, 10);
  const THIRTY_DAYS_AGO  = new Date(_now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const FIFTEEN_DAYS_AGO = new Date(_now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // ── 1. Baca data live ────────────────────────────────────────────────────────
  const allListings = getAllListing();
  const allTransaksi = getAllTransaksi();
  const allNegosiasi = getAllNegosiasi();
  const ringkasanTrx = getRingkasanTransaksi();
  const ringkasanNeg = getRingkasanNegosiasi();

  // Workspace IDs unik dari semua listing
  const allWorkspaceIds = [...new Set(allListings.map((l) => l.workspaceId))];

  // Aggregate wishlist dari semua workspace
  const allWishlistItems = allWorkspaceIds.flatMap((wsId) =>
    getWishlistByWorkspace(wsId),
  );

  // Aggregate chat rooms dari semua workspace (de-dup by room id)
  const seenChatIds = new Set<string>();
  const allChatRooms = allWorkspaceIds
    .flatMap((wsId) => getChatRoomsByWorkspace(wsId))
    .filter((room) => {
      if (seenChatIds.has(room.id)) return false;
      seenChatIds.add(room.id);
      return true;
    });

  // ── 2. Segment listings ──────────────────────────────────────────────────────
  const aktifListings = allListings.filter((l) => l.status === 'Aktif');
  const terjualListings = allListings.filter((l) => l.status === 'Terjual');
  const ditaghanListings = allListings.filter((l) => l.status === 'Ditahan');
  const allPublicListings = allListings.filter(
    (l) => l.status === 'Aktif' || l.status === 'Terjual',
  );

  // ── 3. Ringkasan ─────────────────────────────────────────────────────────────
  const aktifWorkspaceIds = new Set(aktifListings.map((l) => l.workspaceId));

  const ringkasan: RingkasanMarketplace = {
    totalListingAktif: aktifListings.length,
    totalListingTerjual: terjualListings.length,
    totalTransaksi: ringkasanTrx.totalTransaksi,
    totalNegosiasi: ringkasanNeg.totalNegosiasi,
    totalWorkspaceAktif: aktifWorkspaceIds.size,
    totalChatAktif: allChatRooms.length,
  };

  // ── 4. Insight Penjualan ─────────────────────────────────────────────────────

  // 4a. Listing paling banyak dilihat (dari Aktif + Terjual, deterministic dari UUID)
  const listingPalingBanyakDilihat = allPublicListings
    .map((l) => ({ listing: l, views: getPlaceholderJumlahDilihat(l) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map(({ listing, views }) => toListingInsightItem(listing, views, 'dilihat'));

  // 4b. Listing paling banyak dinegosiasi
  const negCountByListing = new Map<string, number>();
  for (const neg of allNegosiasi) {
    negCountByListing.set(
      neg.listingUuid,
      (negCountByListing.get(neg.listingUuid) ?? 0) + 1,
    );
  }
  const listingPalingBanyakDinegosiasi = allPublicListings
    .map((l) => ({ listing: l, count: negCountByListing.get(l.uuid) ?? 0 }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ listing, count }) =>
      toListingInsightItem(listing, count, 'negosiasi'),
    );

  // 4c. Listing paling banyak terjual (berdasarkan transaksi Selesai)
  const trxSelesai = allTransaksi.filter((t) => t.status === 'Selesai');
  const terjualCountByListing = new Map<string, number>();
  for (const trx of trxSelesai) {
    terjualCountByListing.set(
      trx.listingUuid,
      (terjualCountByListing.get(trx.listingUuid) ?? 0) + trx.qty,
    );
  }
  const listingPalingBanyakTerjual = allPublicListings
    .map((l) => ({
      listing: l,
      count: terjualCountByListing.get(l.uuid) ?? 0,
    }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ listing, count }) =>
      toListingInsightItem(listing, count, 'terjual'),
    );

  // 4d. Kategori terlaris (dari transaksi Selesai)
  const trxByKategori = new Map<string, number>();
  for (const trx of trxSelesai) {
    trxByKategori.set(
      trx.kategoriSlug,
      (trxByKategori.get(trx.kategoriSlug) ?? 0) + 1,
    );
  }
  const kategoriTerlaris: KategoriInsightItem[] = [...trxByKategori.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, jumlah]) => {
      const meta = kategoriMeta(slug);
      return { slug, nama: meta.nama, icon: meta.icon, jumlah };
    });

  // ── 5. Insight Pembelian ─────────────────────────────────────────────────────

  // 5a. Kategori paling banyak dicari (dari negosiasi — buyer demand proxy)
  const negByKategori = new Map<string, number>();
  for (const neg of allNegosiasi) {
    negByKategori.set(
      neg.kategoriSlug,
      (negByKategori.get(neg.kategoriSlug) ?? 0) + 1,
    );
  }
  const kategoriPalingBanyakDicari: KategoriInsightItem[] = [
    ...negByKategori.entries(),
  ]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, jumlah]) => {
      const meta = kategoriMeta(slug);
      return { slug, nama: meta.nama, icon: meta.icon, jumlah };
    });

  // 5b. Listing paling banyak disimpan (wishlist)
  const wishlistCountByListing = new Map<string, number>();
  for (const item of allWishlistItems) {
    wishlistCountByListing.set(
      item.listingUuid,
      (wishlistCountByListing.get(item.listingUuid) ?? 0) + 1,
    );
  }
  const listingPalingBanyakDisimpan = allPublicListings
    .map((l) => ({
      listing: l,
      count: wishlistCountByListing.get(l.uuid) ?? 0,
    }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ listing, count }) =>
      toListingInsightItem(listing, count, 'disimpan'),
    );

  // 5c. Listing paling banyak dibuka (semua listing aktif, dari views)
  const listingPalingBanyakDibuka = aktifListings
    .map((l) => ({ listing: l, views: getPlaceholderJumlahDilihat(l) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map(({ listing, views }) => toListingInsightItem(listing, views, 'dilihat'));

  // ── 6. Insight Listing ───────────────────────────────────────────────────────

  // 6a. Listing hampir kadaluarsa (Aktif, tidak diperbarui >30 hari)
  const listingHampirKadaluarsa = aktifListings
    .filter((l) => l.updatedAt < THIRTY_DAYS_AGO)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    .slice(0, 5)
    .map((l) => {
      const daysSince = Math.floor(
        (new Date(TODAY_ISO).getTime() - new Date(l.updatedAt).getTime()) /
          86400000,
      );
      return toListingInsightItem(l, daysSince, 'hari tidak diperbarui');
    });

  // 6b. Listing tanpa aktivitas (Aktif, tidak ada negosiasi & tidak ada transaksi)
  const listingUuidsWithActivity = new Set([
    ...allNegosiasi.map((n) => n.listingUuid),
    ...allTransaksi.map((t) => t.listingUuid),
    ...allWishlistItems.map((w) => w.listingUuid),
  ]);
  const listingTanpaAktivitas = aktifListings
    .filter((l) => !listingUuidsWithActivity.has(l.uuid))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, 5)
    .map((l) => toListingInsightItem(l, 0, 'aktivitas'));

  // 6c. Listing yang perlu diperbarui (Ditahan, atau Aktif tidak diperbarui >15 hari)
  const listingPerluDiperbarui = [
    ...ditaghanListings,
    ...aktifListings.filter(
      (l) => l.updatedAt < FIFTEEN_DAYS_AGO && l.updatedAt >= THIRTY_DAYS_AGO,
    ),
  ]
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    .slice(0, 5)
    .map((l) => {
      const daysSince = Math.floor(
        (new Date(TODAY_ISO).getTime() - new Date(l.updatedAt).getTime()) /
          86400000,
      );
      return toListingInsightItem(
        l,
        daysSince,
        l.status === 'Ditahan' ? 'hari (Ditahan)' : 'hari tidak diperbarui',
      );
    });

  // 6d. Listing performa terbaik (skor komposit: view + 10×neg + 20×trx + 5×wishlist)
  const listingPerformaTerbaik = allPublicListings
    .map((l) => {
      const views = getPlaceholderJumlahDilihat(l);
      const negCount = negCountByListing.get(l.uuid) ?? 0;
      const trxCount = terjualCountByListing.get(l.uuid) ?? 0;
      const wishCount = wishlistCountByListing.get(l.uuid) ?? 0;
      const skor = views + negCount * 10 + trxCount * 20 + wishCount * 5;
      return { listing: l, skor };
    })
    .sort((a, b) => b.skor - a.skor)
    .slice(0, 5)
    .map(({ listing, skor }) =>
      toListingInsightItem(listing, skor, 'skor performa'),
    );

  // ── 7. Insight Workspace ─────────────────────────────────────────────────────

  // Agregasi data per workspace
  const wsData = new Map<
    string,
    { nama: string; listing: number; trx: number; createdAt: string }
  >();
  for (const l of allListings) {
    const existing = wsData.get(l.workspaceId);
    if (!existing) {
      wsData.set(l.workspaceId, {
        nama: l.workspaceNama,
        listing: l.status === 'Aktif' ? 1 : 0,
        trx: 0,
        createdAt: l.createdAt,
      });
    } else {
      if (l.status === 'Aktif') existing.listing += 1;
      if (l.createdAt < existing.createdAt) existing.createdAt = l.createdAt;
    }
  }
  for (const trx of allTransaksi) {
    const ws = wsData.get(trx.workspaceIdPenjual);
    if (ws) ws.trx += 1;
  }

  // 7a. Workspace paling aktif (by listing aktif + transaksi)
  const workspacePalingAktif: WorkspaceInsightItem[] = [...wsData.entries()]
    .map(([id, d]) => ({
      workspaceId: id,
      workspaceNama: d.nama,
      jumlah: d.listing + d.trx,
      satuan: 'listing aktif + transaksi',
      statusVerifikasi: getStatusVerifikasiWorkspace(id),
    }))
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 5);

  // 7b. Workspace baru (berdasarkan listing pertama yang dibuat)
  const workspaceBaru: WorkspaceInsightItem[] = [...wsData.entries()]
    .map(([id, d]) => ({
      workspaceId: id,
      workspaceNama: d.nama,
      jumlah: d.listing,
      satuan: 'listing aktif',
      statusVerifikasi: getStatusVerifikasiWorkspace(id),
      createdAt: d.createdAt,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)
    .map(({ createdAt: _c, ...rest }) => rest);

  // 7c. Workspace terverifikasi
  const workspaceTerverifikasi: WorkspaceInsightItem[] = [...wsData.entries()]
    .filter(
      ([id]) => getStatusVerifikasiWorkspace(id) === 'Terverifikasi',
    )
    .map(([id, d]) => ({
      workspaceId: id,
      workspaceNama: d.nama,
      jumlah: d.listing,
      satuan: 'listing aktif',
      statusVerifikasi: 'Terverifikasi' as StatusVerifikasiWorkspace,
    }));

  // ── 8. Rekomendasi AI ────────────────────────────────────────────────────────
  const rekomendasi: RekomendasiItem[] = [];

  // Rekomendasi berbasis kondisi data live
  if (listingHampirKadaluarsa.length > 0) {
    rekomendasi.push({
      id: 'r-perbarui-listing',
      icon: '🔄',
      judul: 'Perbarui Listing',
      deskripsi: `${listingHampirKadaluarsa.length} listing tidak diperbarui lebih dari 30 hari. Perbarui deskripsi atau harga agar tetap relevan.`,
      prioritas: 'tinggi',
    });
  }

  if (listingTanpaAktivitas.length > 0) {
    rekomendasi.push({
      id: 'r-tambah-listing',
      icon: '➕',
      judul: 'Tambah Listing Baru di Kategori Diminati',
      deskripsi: `${listingTanpaAktivitas.length} listing belum mendapat aktivitas. ${
        kategoriPalingBanyakDicari[0]
          ? `Kategori ${kategoriPalingBanyakDicari[0].nama} paling banyak dicari pembeli.`
          : 'Tambahkan listing di kategori yang banyak diminati.'
      }`,
      prioritas: 'sedang',
    });
  }

  if (ditaghanListings.length > 0) {
    rekomendasi.push({
      id: 'r-lengkapi-info',
      icon: '📝',
      judul: 'Lengkapi Informasi Listing',
      deskripsi: `${ditaghanListings.length} listing berstatus Ditahan. Periksa kelengkapan informasi untuk mengaktifkan kembali.`,
      prioritas: 'tinggi',
    });
  }

  const belumVerifikasiWs = [...wsData.keys()].filter((id) => {
    const status = getStatusVerifikasiWorkspace(id);
    return status === 'Belum Diverifikasi' || status === 'Dalam Proses';
  });
  if (belumVerifikasiWs.length > 0) {
    rekomendasi.push({
      id: 'r-verifikasi-workspace',
      icon: '✅',
      judul: 'Lengkapi Verifikasi Workspace',
      deskripsi: `${belumVerifikasiWs.length} workspace belum terverifikasi. Workspace terverifikasi mendapat kepercayaan lebih tinggi dari pembeli.`,
      prioritas: 'sedang',
    });
  }

  // Tinjau harga: listing yang harganya jauh dari rata-rata kategorinya
  const avgHargaByKategori = new Map<string, number>();
  for (const slug of new Set(aktifListings.map((l) => l.kategoriSlug))) {
    const inKat = aktifListings.filter((l) => l.kategoriSlug === slug);
    if (inKat.length > 1) {
      const avg = inKat.reduce((s, l) => s + l.harga, 0) / inKat.length;
      avgHargaByKategori.set(slug, avg);
    }
  }
  const listingHargaJauh = aktifListings.filter((l) => {
    const avg = avgHargaByKategori.get(l.kategoriSlug);
    if (!avg) return false;
    return l.harga < avg * 0.5 || l.harga > avg * 2;
  });
  if (listingHargaJauh.length > 0) {
    rekomendasi.push({
      id: 'r-tinjau-harga',
      icon: '💰',
      judul: 'Tinjau Harga Listing',
      deskripsi: `${listingHargaJauh.length} listing memiliki harga yang jauh dari rata-rata kategorinya. Tinjau agar harga tetap kompetitif.`,
      prioritas: 'rendah',
    });
  }

  // Selalu ada minimal satu rekomendasi informatif
  if (rekomendasi.length === 0) {
    rekomendasi.push({
      id: 'r-info',
      icon: '🌟',
      judul: 'Marketplace dalam Kondisi Baik',
      deskripsi: 'Semua listing aktif dan workspace terverifikasi. Tambahkan listing baru untuk memperluas jangkauan pasar.',
      prioritas: 'rendah',
    });
  }

  // Urutkan: tinggi → sedang → rendah
  const prioritasOrder: Record<RekomendasiItem['prioritas'], number> = {
    tinggi: 0, sedang: 1, rendah: 2,
  };
  rekomendasi.sort((a, b) => prioritasOrder[a.prioritas] - prioritasOrder[b.prioritas]);

  // ── 9. Rakitan akhir ─────────────────────────────────────────────────────────
  return {
    ringkasan,
    insightPenjualan: {
      listingPalingBanyakDilihat,
      listingPalingBanyakDinegosiasi,
      listingPalingBanyakTerjual,
      kategoriTerlaris,
    },
    insightPembelian: {
      kategoriPalingBanyakDicari,
      listingPalingBanyakDisimpan,
      listingPalingBanyakDibuka,
    },
    insightListing: {
      listingHampirKadaluarsa,
      listingTanpaAktivitas,
      listingPerluDiperbarui,
      listingPerformaTerbaik,
    },
    insightWorkspace: {
      workspacePalingAktif,
      workspaceBaru,
      workspaceTerverifikasi,
    },
    rekomendasi,
  };
}
