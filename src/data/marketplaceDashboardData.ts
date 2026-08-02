// ─── MPK-013 — Dashboard Penjual Marketplace ─────────────────────────────────
// Agregator data untuk Dashboard Penjual — hanya membaca data Marketplace.
// Tidak ada akses langsung ke modul aset (Livestock, Stok Pakan, Obat, dll).
// Seluruh data difilter berdasarkan workspaceId penjual.

import { getAllListing, getPlaceholderJumlahDilihat, type ListingItem } from './marketplaceListingData';
import { getAllTransaksi, type TransaksiItem } from './marketplaceTransaksiData';
import { getAllNegosiasi, type NegosiasiItem } from './marketplaceNegosiasiData';

// ─── Model ────────────────────────────────────────────────────────────────────

export interface DashboardRingkasan {
  totalListing: number;
  listingAktif: number;
  draft: number;
  terjual: number;
  totalNegosiasi: number;
  totalTransaksi: number;
}

export interface DashboardStatistik {
  /** Total views deterministik dari seluruh listing workspace. */
  totalDilihat: number;
  /** Jumlah semua negosiasi sebagai penjual. */
  totalPenawaran: number;
  /** Jumlah semua transaksi sebagai penjual. */
  totalTransaksi: number;
  /** Nilai total transaksi berstatus Selesai. */
  totalPenjualan: number;
}

export interface AiInsightDashboard {
  listingTerbanyakDilihat: { listing: ListingItem; views: number } | null;
  listingTerbanyakDinegosiasi: { listing: ListingItem; count: number } | null;
  listingTerbanyakTerjual: { listing: ListingItem; qty: number } | null;
  /** Listing Aktif yang belum diperbarui selama ≥ 30 hari. */
  listingPerluDiperbarui: ListingItem[];
}

export interface GrafikHarian {
  /** Label hari singkat (Sen, Sel, …, Min). */
  label: string;
  /** ISO date yyyy-mm-dd. */
  tanggal: string;
  /** Jumlah transaksi pada hari ini. */
  count: number;
  /** Nilai total transaksi pada hari ini. */
  total: number;
}

export interface DashboardPenjualData {
  ringkasan: DashboardRingkasan;
  statistik: DashboardStatistik;
  aiInsight: AiInsightDashboard;
  listingTerbaru: ListingItem[];
  transaksiTerbaru: TransaksiItem[];
  negosiasiTerbaru: NegosiasiItem[];
  /** Data grafik 7 hari terakhir berdasarkan createdAt transaksi. */
  grafikTransaksi: GrafikHarian[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const LABEL_HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function buildGrafikTransaksi(transaksi: TransaksiItem[]): GrafikHarian[] {
  const result: GrafikHarian[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const tanggal = d.toISOString().slice(0, 10);
    const label = LABEL_HARI[d.getDay()];
    const dayTrx = transaksi.filter(t => t.createdAt === tanggal);
    result.push({
      label,
      tanggal,
      count: dayTrx.length,
      total: dayTrx.reduce((s, t) => s + t.total, 0),
    });
  }
  return result;
}

// ─── Agregator Utama ──────────────────────────────────────────────────────────

/**
 * Mengembalikan seluruh data Dashboard Penjual untuk satu workspace.
 * Semua data berasal dari Marketplace (listing, transaksi, negosiasi).
 * Tidak membaca data modul aset.
 */
export function getDashboardPenjual(workspaceId: string): DashboardPenjualData {
  const myListings  = getAllListing().filter(l => l.workspaceId === workspaceId);
  const myTransaksi = getAllTransaksi().filter(t => t.workspaceIdPenjual === workspaceId);
  const myNegosiasi = getAllNegosiasi().filter(n => n.workspaceIdPenjual === workspaceId);

  // ── Ringkasan ──────────────────────────────────────────────────────────────
  const ringkasan: DashboardRingkasan = {
    totalListing:   myListings.length,
    listingAktif:   myListings.filter(l => l.status === 'Aktif').length,
    draft:          myListings.filter(l => l.status === 'Draft').length,
    terjual:        myListings.filter(l => l.status === 'Terjual').length,
    totalNegosiasi: myNegosiasi.length,
    totalTransaksi: myTransaksi.length,
  };

  // ── Statistik ──────────────────────────────────────────────────────────────
  const totalDilihat   = myListings.reduce((s, l) => s + getPlaceholderJumlahDilihat(l), 0);
  const totalPenjualan = myTransaksi
    .filter(t => t.status === 'Selesai')
    .reduce((s, t) => s + t.total, 0);

  const statistik: DashboardStatistik = {
    totalDilihat,
    totalPenawaran: myNegosiasi.length,
    totalTransaksi: myTransaksi.length,
    totalPenjualan,
  };

  // ── AI Insight ─────────────────────────────────────────────────────────────

  // 1 — Listing terbanyak dilihat
  let listingTerbanyakDilihat: AiInsightDashboard['listingTerbanyakDilihat'] = null;
  if (myListings.length > 0) {
    const best = myListings
      .map(l => ({ listing: l, views: getPlaceholderJumlahDilihat(l) }))
      .sort((a, b) => b.views - a.views)[0];
    listingTerbanyakDilihat = best ?? null;
  }

  // 2 — Listing terbanyak dinegosiasi
  let listingTerbanyakDinegosiasi: AiInsightDashboard['listingTerbanyakDinegosiasi'] = null;
  if (myNegosiasi.length > 0) {
    const counter = new Map<string, number>();
    for (const n of myNegosiasi) {
      counter.set(n.listingUuid, (counter.get(n.listingUuid) ?? 0) + 1);
    }
    let bestUuid = '';
    let bestCount = 0;
    for (const [uuid, count] of counter) {
      if (count > bestCount) { bestCount = count; bestUuid = uuid; }
    }
    const found = myListings.find(l => l.uuid === bestUuid);
    if (found) listingTerbanyakDinegosiasi = { listing: found, count: bestCount };
  }

  // 3 — Listing terbanyak terjual (sum qty dari transaksi Selesai)
  let listingTerbanyakTerjual: AiInsightDashboard['listingTerbanyakTerjual'] = null;
  const selesai = myTransaksi.filter(t => t.status === 'Selesai');
  if (selesai.length > 0) {
    const qtyMap = new Map<string, number>();
    for (const t of selesai) {
      qtyMap.set(t.listingUuid, (qtyMap.get(t.listingUuid) ?? 0) + t.qty);
    }
    let bestUuid = '';
    let bestQty = 0;
    for (const [uuid, qty] of qtyMap) {
      if (qty > bestQty) { bestQty = qty; bestUuid = uuid; }
    }
    const found = myListings.find(l => l.uuid === bestUuid);
    if (found) listingTerbanyakTerjual = { listing: found, qty: bestQty };
  }

  // 4 — Listing Aktif yang perlu diperbarui (updatedAt ≥ 30 hari lalu)
  const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const listingPerluDiperbarui = myListings
    .filter(l => l.status === 'Aktif' && l.updatedAt <= cutoff)
    .slice(0, 5);

  const aiInsight: AiInsightDashboard = {
    listingTerbanyakDilihat,
    listingTerbanyakDinegosiasi,
    listingTerbanyakTerjual,
    listingPerluDiperbarui,
  };

  // ── Terbaru ────────────────────────────────────────────────────────────────
  const listingTerbaru = myListings
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  const transaksiTerbaru = myTransaksi
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const negosiasiTerbaru = myNegosiasi
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return {
    ringkasan,
    statistik,
    aiInsight,
    listingTerbaru,
    transaksiTerbaru,
    negosiasiTerbaru,
    grafikTransaksi: buildGrafikTransaksi(myTransaksi),
  };
}
