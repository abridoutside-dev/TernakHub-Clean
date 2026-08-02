// ─── Marketplace — AI Insight (MPK-004) ──────────────────────────────────────
// AI hanya MEMBACA data listing yang sudah ada (getAllListing()) — tidak ada
// penulisan, tidak ada model AI sungguhan. Ringkasan: Total Listing Aktif,
// Kategori Terpopuler, Listing Baru Hari Ini, Harga Referensi.
//
// `todayIso` diteruskan oleh pemanggil (komponen React) agar modul data ini
// tetap murni/testable dan tidak membaca jam sistem sendiri.

import { KATEGORI_MARKETPLACE } from './marketplaceKategoriData';
import type { ListingItem } from './marketplaceListingData';

// ─── AI Insight — Detail Listing (MPK-006) ───────────────────────────────────
// Sama seperti insight di atas: hanya MEMBACA listing yang sudah ada
// (getAllListing()), tidak ada penulisan/model AI sungguhan. Dipakai pada
// halaman Detail Listing untuk membandingkan satu listing dengan pasar
// (kategori/sub-kategori yang sama).

export interface DetailListingAiInsight {
  /** Harga referensi — rata-rata harga listing aktif lain pada sub-kategori (fallback: kategori) yang sama. */
  hargaReferensi: number;
  /** Jumlah listing serupa (sub-kategori/kategori sama), tidak termasuk listing ini sendiri. */
  jumlahListingSerupa: number;
  /** Kalimat insight singkat, dihasilkan dari perbandingan harga listing ini dengan harga referensi. */
  insightSingkat: string;
}

export function computeDetailListingAiInsight(
  item: ListingItem,
  allListing: ListingItem[]
): DetailListingAiInsight {
  const aktifLain = allListing.filter((l) => l.status === 'Aktif' && l.uuid !== item.uuid);

  let pembanding = item.subKategoriSlug
    ? aktifLain.filter((l) => l.subKategoriSlug === item.subKategoriSlug)
    : [];
  if (pembanding.length === 0) {
    pembanding = aktifLain.filter((l) => l.kategoriSlug === item.kategoriSlug);
  }

  const hargaReferensi = pembanding.length > 0
    ? Math.round(pembanding.reduce((sum, l) => sum + l.harga, 0) / pembanding.length / 1000) * 1000
    : item.harga;

  let insightSingkat: string;
  if (pembanding.length === 0) {
    insightSingkat = 'Belum ada listing lain pada kategori ini untuk dijadikan pembanding harga.';
  } else {
    const selisihPersen = hargaReferensi > 0
      ? Math.round(((item.harga - hargaReferensi) / hargaReferensi) * 100)
      : 0;
    if (Math.abs(selisihPersen) < 3) {
      insightSingkat = `Harga listing ini sejalan dengan rata-rata ${pembanding.length} listing sejenis lainnya.`;
    } else if (selisihPersen < 0) {
      insightSingkat = `Harga listing ini ${Math.abs(selisihPersen)}% lebih rendah dari rata-rata ${pembanding.length} listing sejenis lainnya.`;
    } else {
      insightSingkat = `Harga listing ini ${selisihPersen}% lebih tinggi dari rata-rata ${pembanding.length} listing sejenis lainnya.`;
    }
  }

  return {
    hargaReferensi,
    jumlahListingSerupa: pembanding.length,
    insightSingkat,
  };
}

export interface MarketplaceAiInsight {
  totalListingAktif: number;
  kategoriTerpopuler: { nama: string; icon: string; jumlah: number } | null;
  listingBaruHariIni: number;
  /** Harga referensi — rata-rata harga listing aktif, dibulatkan ke ribuan. */
  hargaReferensi: number;
}

export function computeMarketplaceAiInsight(
  listing: ListingItem[],
  todayIso: string
): MarketplaceAiInsight {
  const aktif = listing.filter((l) => l.status === 'Aktif');

  const jumlahPerKategori = new Map<string, number>();
  for (const l of aktif) {
    jumlahPerKategori.set(l.kategoriSlug, (jumlahPerKategori.get(l.kategoriSlug) ?? 0) + 1);
  }
  let kategoriTerpopuler: MarketplaceAiInsight['kategoriTerpopuler'] = null;
  let maxJumlah = 0;
  for (const [slug, jumlah] of jumlahPerKategori) {
    if (jumlah > maxJumlah) {
      const kategori = KATEGORI_MARKETPLACE.find((k) => k.slug === slug);
      if (kategori) {
        kategoriTerpopuler = { nama: kategori.nama, icon: kategori.icon, jumlah };
        maxJumlah = jumlah;
      }
    }
  }

  const listingBaruHariIni = aktif.filter((l) => l.createdAt === todayIso).length;

  const hargaReferensi = aktif.length > 0
    ? Math.round(aktif.reduce((sum, l) => sum + l.harga, 0) / aktif.length / 1000) * 1000
    : 0;

  return {
    totalListingAktif: aktif.length,
    kategoriTerpopuler,
    listingBaruHariIni,
    hargaReferensi,
  };
}
