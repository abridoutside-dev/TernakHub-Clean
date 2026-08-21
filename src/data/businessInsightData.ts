// ─── Business Insight Data Aggregator ─────────────────────────────────────────
// PROFILE-003 — Business Insight (Laporan Usaha)
// Mengikuti docs/architecture/PROFILE_MODULE_CONSTITUTION.md
//
// BUKAN Wallet. BUKAN Dompet Digital. BUKAN Payment Gateway.
// Hanya membaca data dari modul lain — tidak menyimpan salinan.
// Tidak membuat transaksi keuangan baru.

import { buildIndividuList, buildOutsideIndividu, buildArchiveList } from '../utils/livestockSummary';
import { getAllTransaksi }                                             from './marketplaceTransaksiData';
import { getInventarisList, getAllRiwayatPerubahan }                   from './stokInventarisData';
import type { StokObatItem }                                           from './stokObatData';
import type { DrugStoreSalesDbRow, DrugStoreOrderDbRow }               from '../types/drugStore';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PeriodeKey = 'hari-ini' | 'minggu-ini' | 'bulan-ini' | 'tahun-ini';

export const PERIODE_LABELS: Record<PeriodeKey, string> = {
  'hari-ini':   'Hari Ini',
  'minggu-ini': 'Minggu Ini',
  'bulan-ini':  'Bulan Ini',
  'tahun-ini':  'Tahun Ini',
};

export interface PeriodRange {
  from: string; // YYYY-MM-DD
  to:   string; // YYYY-MM-DD
}

export interface RingkasanBI {
  nilaiAsetTernak: number;        // estimated (weight × harga per kg)
  jumlahTernak: number;           // Di Kandang + Luar Kandang
  nilaiStokPakan: number;         // hargaBeli × jumlahStok (only items with hargaBeli)
  jumlahItemPakan: number;        // total inventaris aktif
  jumlahItemObat: number;         // total stok obat aktif
  totalPenjualan: number;         // marketplace selesai sebagai penjual
  totalPembelian: number;         // marketplace selesai sebagai pembeli
  totalPengeluaran: number;       // = totalPembelian (marketplace only — partial)
  margin: number | null;          // null if insufficient data
  marginNote: string;
  estimasiNilaiUsaha: number;     // nilaiAsetTernak + nilaiStokPakan
  dataLengkap: boolean;
  periodeLabel: string;
}

export interface LivestockJenisBreakdown {
  type: string;
  icon: string;
  count: number;
  estimasiNilai: number;
}

export interface ModuleBreakdown {
  livestock: {
    diKandang: number;
    luarKandang: number;
    arsip: number;
    total: number;
    jenisBreakdown: LivestockJenisBreakdown[];
    estimasiNilaiTotal: number;
    catatanEstimasi: string;
  };
  marketplace: {
    totalTransaksi: number;
    selesai: number;
    penjualan: number;
    pembelian: number;
    transaksiAktif: number; // menunggu + diproses
  };
  stokPakan: {
    totalItem: number;
    itemDenganHarga: number;
    nilaiTotal: number;
    satuanVariasi: string[];
  };
  stokObat: {
    totalItem: number;
    aktif: number;
    catatan: string;
  };
  pemberianPakan: {
    totalEntries: number;
    totalVolume: number;
  };
}

export interface MonthlyDataPoint {
  bulan: string;    // e.g. "Jul"
  label: string;    // e.g. "Jul 2026"
  penjualan: number;
  pembelian: number;
  margin: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Estimasi harga pasar per kg berdasarkan jenis ternak (Rp). */
const HARGA_ESTIMASI_PER_KG: Record<string, number> = {
  'Domba':   80_000,
  'Kambing': 75_000,
  'Sapi':    90_000,
  'Kerbau':  85_000,
  'Ayam':    25_000,
  'Itik':    28_000,
  'Babi':    55_000,
};
const HARGA_DEFAULT_PER_KG = 65_000;

const BULAN_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const BULAN_ID    = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const HARI_SHORT  = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']; // Sun=0..Sat=6

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hargaPerKg(type: string): number {
  return HARGA_ESTIMASI_PER_KG[type] ?? HARGA_DEFAULT_PER_KG;
}

function isoInRange(dateStr: string, from: string, to: string): boolean {
  return dateStr >= from && dateStr <= to;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Period Range ─────────────────────────────────────────────────────────────

export function getPeriodRange(key: PeriodeKey): PeriodRange {
  const now   = new Date();
  const today = now.toISOString().split('T')[0];

  switch (key) {
    case 'hari-ini':
      return { from: today, to: today };

    case 'minggu-ini': {
      const dow    = now.getDay(); // 0=Sun
      const offset = dow === 0 ? 6 : dow - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - offset);
      return { from: monday.toISOString().split('T')[0], to: today };
    }

    case 'bulan-ini': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: first.toISOString().split('T')[0], to: today };
    }

    case 'tahun-ini': {
      const first = new Date(now.getFullYear(), 0, 1);
      return { from: first.toISOString().split('T')[0], to: today };
    }
  }
}

// ─── Livestock Valuation ──────────────────────────────────────────────────────

export function getLivestockEstimasiNilai(): number {
  const aktif = buildIndividuList();
  const luar  = buildOutsideIndividu();
  const all   = [...aktif, ...luar];
  return all.reduce((sum, lv) => sum + lv.weightNum * hargaPerKg(lv.type), 0);
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

export function getRingkasanBI(
  key: PeriodeKey,
  activeWorkspaceId?: string,
  workspaceType?: string,
  opts?: {
    stokObatItems?: StokObatItem[];
    drugStoreSales?: DrugStoreSalesDbRow[];
    drugStoreOrders?: DrugStoreOrderDbRow[];
  },
): RingkasanBI {
  const { from, to } = getPeriodRange(key);
  const activeId = activeWorkspaceId;
  const isFarm = workspaceType === 'Farm';
  const isFeedStore = workspaceType === 'FeedStore';
  const isVeterinary = workspaceType === 'Veterinary';
  const isDrugStore = isVeterinary && opts?.drugStoreSales !== undefined;

  // ── Livestock ── (hanya Farm)
  const aktif       = isFarm ? buildIndividuList() : [];
  const luar        = isFarm ? buildOutsideIndividu() : [];
  const jumlahTernak = aktif.length + luar.length;
  const nilaiAsetTernak = isFarm ? getLivestockEstimasiNilai() : 0;

  // ── Stok Pakan ── (Farm + FeedStore)
  const includeStokPakan = isFarm || isFeedStore;
  const inventaris  = includeStokPakan ? getInventarisList().filter((i) => !i.diarsipkan) : [];
  const jumlahItemPakan = inventaris.length;
  const nilaiStokPakan  = inventaris.reduce(
    (sum, i) => sum + (i.hargaBeli !== undefined ? i.hargaBeli * i.jumlahStok : 0),
    0
  );

  // ── Stok Obat ── (Farm + Veterinary / DrugStore)
  const includeStokObat = isFarm || isVeterinary;
  const stokObatItems = opts?.stokObatItems ?? [];
  const jumlahItemObat = includeStokObat
    ? stokObatItems.filter((i) => !i.diarsipkan && i.statusAktif !== 'Nonaktif').length
    : 0;

  // ── Transaksi ──
  let totalPenjualan = 0;
  let totalPembelian = 0;

  if (isDrugStore && opts.drugStoreSales && opts.drugStoreOrders) {
    const salesInPeriod = opts.drugStoreSales.filter((t) => {
      const tanggal = t.sale_date;
      return isoInRange(tanggal, from, to);
    });
    const completedSales = salesInPeriod.filter((t) => t.status === 'Selesai');
    totalPenjualan = completedSales.reduce((sum, t) => sum + Number(t.total_amount), 0);

    const pembelianOrders = opts.drugStoreOrders.filter((o) => {
      return o.order_type === 'Pembelian' && isoInRange(o.order_date, from, to) && o.status === 'Selesai';
    });
    totalPembelian = pembelianOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  } else {
    const allTrx = getAllTransaksi();
    const trxInPeriod = allTrx.filter((t) => {
      const tanggal = t.selesaiAt ?? t.createdAt;
      return isoInRange(tanggal, from, to);
    });

    totalPenjualan = trxInPeriod
      .filter((t) => t.status === 'Selesai' && t.workspaceIdPenjual === activeId)
      .reduce((sum, t) => sum + t.total, 0);

    totalPembelian = trxInPeriod
      .filter((t) => t.status === 'Selesai' && t.workspaceIdPembeli === activeId)
      .reduce((sum, t) => sum + t.total, 0);
  }

  const totalPengeluaran = totalPembelian;

  // ── Margin ──
  const hasSufficientData = isDrugStore
    ? (opts.drugStoreSales?.some((t) => t.status === 'Selesai') ?? false)
    : getAllTransaksi().some((t) => t.status === 'Selesai');
  const margin = hasSufficientData ? totalPenjualan - totalPengeluaran : null;
  const marginNote = margin === null
    ? 'Data transaksi selesai belum tersedia untuk periode ini.'
    : isDrugStore
      ? 'Berdasarkan penjualan & pembelian Toko Obat. Pengeluaran operasional lain belum diperhitungkan.'
      : 'Berdasarkan transaksi Marketplace. Pengeluaran operasional (pakan, obat) belum diperhitungkan.';

  const estimasiNilaiUsaha = isDrugStore ? 0 : nilaiAsetTernak + nilaiStokPakan;

  return {
    nilaiAsetTernak,
    jumlahTernak,
    nilaiStokPakan,
    jumlahItemPakan,
    jumlahItemObat,
    totalPenjualan,
    totalPembelian,
    totalPengeluaran,
    margin,
    marginNote,
    estimasiNilaiUsaha,
    dataLengkap: hasSufficientData,
    periodeLabel: PERIODE_LABELS[key],
  };
}

// ─── Module Breakdown ────────────────────────────────────────────────────────

export function getModuleBreakdown(
  key: PeriodeKey,
  activeWorkspaceId?: string,
  workspaceType?: string,
  opts?: {
    stokObatItems?: StokObatItem[];
    drugStoreSales?: DrugStoreSalesDbRow[];
    drugStoreOrders?: DrugStoreOrderDbRow[];
  },
): ModuleBreakdown {
  const activeId = activeWorkspaceId;
  const { from, to } = getPeriodRange(key);
  const isFarm = workspaceType === 'Farm';
  const isFeedStore = workspaceType === 'FeedStore';
  const isVeterinary = workspaceType === 'Veterinary';
  const isDrugStore = isVeterinary && opts?.drugStoreSales !== undefined;

  // ── Livestock ── (hanya Farm)
  const aktif = isFarm ? buildIndividuList() : [];
  const luar  = isFarm ? buildOutsideIndividu() : [];
  const arsip = isFarm ? buildArchiveList() : [];

  const jenisMap = new Map<string, LivestockJenisBreakdown>();
  [...aktif, ...luar].forEach((lv) => {
    const existing = jenisMap.get(lv.type);
    const nilai = lv.weightNum * hargaPerKg(lv.type);
    if (existing) {
      existing.count++;
      existing.estimasiNilai += nilai;
    } else {
      jenisMap.set(lv.type, { type: lv.type, icon: lv.icon, count: 1, estimasiNilai: nilai });
    }
  });

  const jenisBreakdown = Array.from(jenisMap.values()).sort((a, b) => b.count - a.count);
  const estimasiNilaiTotal = jenisBreakdown.reduce((s, j) => s + j.estimasiNilai, 0);

  // ── Transaksi ──
  let marketplaceTotalTransaksi = 0;
  let marketplaceSelesai = 0;
  let marketplacePenjualan = 0;
  let marketplacePembelian = 0;
  let marketplaceTransaksiAktif = 0;

  if (isDrugStore && opts.drugStoreSales && opts.drugStoreOrders) {
    const salesInPeriod = opts.drugStoreSales.filter((t) => isoInRange(t.sale_date, from, to));
    marketplaceTotalTransaksi = salesInPeriod.length;
    marketplaceSelesai = salesInPeriod.filter((t) => t.status === 'Selesai').length;
    marketplacePenjualan = salesInPeriod
      .filter((t) => t.status === 'Selesai')
      .reduce((s, t) => s + Number(t.total_amount), 0);

    const pembelianInPeriod = opts.drugStoreOrders.filter((o) =>
      o.order_type === 'Pembelian' && isoInRange(o.order_date, from, to)
    );
    marketplacePembelian = pembelianInPeriod
      .filter((o) => o.status === 'Selesai')
      .reduce((s, o) => s + Number(o.total_amount), 0);

    marketplaceTransaksiAktif = opts.drugStoreSales.filter(
      (t) => !['Selesai', 'Dibatalkan'].includes(t.status)
    ).length + opts.drugStoreOrders.filter(
      (o) => !['Selesai', 'Dibatalkan'].includes(o.status)
    ).length;
  } else {
    const allTrx = getAllTransaksi();
    const trxPeriod = allTrx.filter((t) => {
      const tanggal = t.selesaiAt ?? t.createdAt;
      return isoInRange(tanggal, from, to);
    });

    marketplaceTotalTransaksi = trxPeriod.length;
    marketplaceSelesai = trxPeriod.filter((t) => t.status === 'Selesai').length;
    marketplacePenjualan = trxPeriod.filter((t) => t.status === 'Selesai' && t.workspaceIdPenjual === activeId).reduce((s, t) => s + t.total, 0);
    marketplacePembelian = trxPeriod.filter((t) => t.status === 'Selesai' && t.workspaceIdPembeli === activeId).reduce((s, t) => s + t.total, 0);
    marketplaceTransaksiAktif = allTrx.filter(
      (t) =>
        (t.workspaceIdPenjual === activeId || t.workspaceIdPembeli === activeId) &&
        !['Selesai', 'Dibatalkan', 'Ditolak'].includes(t.status)
    ).length;
  }

  // ── Stok Pakan ── (Farm + FeedStore)
  const includeStokPakan = isFarm || isFeedStore;
  const inventaris = includeStokPakan ? getInventarisList().filter((i) => !i.diarsipkan) : [];
  const itemDenganHarga = inventaris.filter((i) => i.hargaBeli !== undefined).length;
  const nilaiStokPakan  = inventaris.reduce(
    (s, i) => s + (i.hargaBeli !== undefined ? i.hargaBeli * i.jumlahStok : 0),
    0
  );
  const satuanSet = new Set(inventaris.map((i) => i.satuan));

  // ── Stok Obat ── (Farm + Veterinary / DrugStore)
  const includeStokObat = isFarm || isVeterinary;
  const stokObatItems = opts?.stokObatItems ?? [];
  const obatAktif = includeStokObat
    ? stokObatItems.filter((i) => !i.diarsipkan && i.statusAktif !== 'Nonaktif')
    : [];

  // ── Pemberian Pakan (period-filtered by tanggal) ──
  const pemberianEntries = getAllRiwayatPerubahan().filter(
    (r) => r.sumberPerubahan === 'Pemberian Pakan' && isoInRange(r.tanggal, from, to)
  );
  const totalVolumePakan = pemberianEntries.reduce((s, r) => s + r.jumlah, 0);

  return {
    livestock: {
      diKandang: aktif.length,
      luarKandang: luar.length,
      arsip: arsip.length,
      total: aktif.length + luar.length + arsip.length,
      jenisBreakdown,
      estimasiNilaiTotal,
      catatanEstimasi: 'Estimasi berdasarkan bobot × harga pasar per kg. Bukan nilai jual aktual.',
    },
    marketplace: {
      totalTransaksi: marketplaceTotalTransaksi,
      selesai: marketplaceSelesai,
      penjualan: marketplacePenjualan,
      pembelian: marketplacePembelian,
      transaksiAktif: marketplaceTransaksiAktif,
    },
    stokPakan: {
      totalItem: inventaris.length,
      itemDenganHarga,
      nilaiTotal: nilaiStokPakan,
      satuanVariasi: Array.from(satuanSet),
    },
    stokObat: {
      totalItem: includeStokObat ? stokObatItems.length : 0,
      aktif: obatAktif.length,
      catatan: isDrugStore
        ? 'Nilai stok obat belum tersedia (harga beli belum direkam).'
        : includeStokObat
          ? 'Nilai stok obat tidak tersedia (harga beli belum direkam).'
          : 'Modul ini tidak relevan untuk workspace ini.',
    },
    pemberianPakan: {
      totalEntries: pemberianEntries.length,
      totalVolume: totalVolumePakan,
    },
  };
}

// ─── Recent Monthly Points (for trend indicators, not period-filtered display) ─
//
// Returns the last N calendar months of Marketplace margin data.
// Use this for widgets that need a fixed look-back window (e.g. trend arrows),
// NOT for the Business Insight page which uses getMonthlyData(PeriodeKey).

export function getRecentMonthlyPoints(numMonths: number, activeWorkspaceId?: string): MonthlyDataPoint[] {
  const now      = new Date();
  const activeId = activeWorkspaceId;
  const allTrx   = getAllTransaksi();
  return Array.from({ length: numMonths }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (numMonths - 1 - i), 1);
    const mk   = monthKey(date);
    const penjualan = allTrx
      .filter((t) => t.status === 'Selesai' && t.workspaceIdPenjual === activeId && (t.selesaiAt ?? t.createdAt).startsWith(mk))
      .reduce((s, t) => s + t.total, 0);
    const pembelian = allTrx
      .filter((t) => t.status === 'Selesai' && t.workspaceIdPembeli === activeId && (t.selesaiAt ?? t.createdAt).startsWith(mk))
      .reduce((s, t) => s + t.total, 0);
    return { bulan: BULAN_SHORT[date.getMonth()], label: `${BULAN_SHORT[date.getMonth()]} ${date.getFullYear()}`, penjualan, pembelian, margin: penjualan - pembelian };
  });
}

// ─── Internal chart builders ─────────────────────────────────────────────────

/** Monday of the current week (ISO Mon=start). */
function currentWeekMonday(now: Date): Date {
  const dow    = now.getDay(); // 0=Sun
  const offset = dow === 0 ? 6 : dow - 1;
  const mon    = new Date(now);
  mon.setDate(now.getDate() - offset);
  return mon;
}

/** Build one MonthlyDataPoint from a [from,to] date range. */
function buildPoint(
  bulan:    string,
  label:    string,
  from:     string,
  to:       string,
  allTrx:   ReturnType<typeof getAllTransaksi>,
  activeId: string | undefined,
): MonthlyDataPoint {
  const trx = allTrx.filter((t) => {
    const d = t.selesaiAt ?? t.createdAt;
    return t.status === 'Selesai' && d >= from && d <= to;
  });
  const penjualan = trx.filter((t) => t.workspaceIdPenjual === activeId).reduce((s, t) => s + t.total, 0);
  const pembelian = trx.filter((t) => t.workspaceIdPembeli === activeId).reduce((s, t) => s + t.total, 0);
  return { bulan, label, penjualan, pembelian, margin: penjualan - pembelian };
}

// ─── Monthly Chart Data ───────────────────────────────────────────────────────
//
// Granularity adapts to the selected period:
//   hari-ini   → 7 daily bars (Mon–Sun of current week; only today is in-period)
//   minggu-ini → 7 daily bars (Mon–Sun of current week)
//   bulan-ini  → weekly bars (W1–W4/W5 of current month)
//   tahun-ini  → 12 monthly bars (Jan–Dec of current year)
//
// Changing the period will always produce a different dataset/shape.

export function getMonthlyData(key: PeriodeKey, activeWorkspaceId?: string, workspaceType?: string, opts?: {
  drugStoreSales?: DrugStoreSalesDbRow[];
  drugStoreOrders?: DrugStoreOrderDbRow[];
}): MonthlyDataPoint[] {
  const now      = new Date();
  const activeId = activeWorkspaceId;
  const { from: periodFrom, to: periodTo } = getPeriodRange(key);
  const isVeterinary = workspaceType === 'Veterinary';
  const drugStoreSales = opts?.drugStoreSales;
  const drugStoreOrders = opts?.drugStoreOrders;
  const isDrugStore = isVeterinary && drugStoreSales !== undefined && drugStoreOrders !== undefined;

  // ── hari-ini / minggu-ini: daily bars for Mon–Sun of current week ─────────
  if (key === 'hari-ini' || key === 'minggu-ini') {
    const monday = currentWeekMonday(now);
    return Array.from({ length: 7 }, (_, i) => {
      const day    = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dayStr = day.toISOString().split('T')[0];
      const from   = key === 'hari-ini' ? (dayStr >= periodFrom && dayStr <= periodTo ? dayStr : '9999') : dayStr;
      const to     = from === '9999' ? '9999' : dayStr;

      if (isDrugStore) {
        const salesInDay = drugStoreSales.filter((t) => t.sale_date === dayStr && t.status === 'Selesai');
        const ordersInDay = drugStoreOrders.filter((o) => o.order_type === 'Pembelian' && o.order_date === dayStr && o.status === 'Selesai');
        const penjualan = salesInDay.reduce((s, t) => s + Number(t.total_amount), 0);
        const pembelian = ordersInDay.reduce((s, o) => s + Number(o.total_amount), 0);
        return { bulan: HARI_SHORT[day.getDay()], label: dayStr, penjualan, pembelian, margin: penjualan - pembelian };
      }

      const allTrx = getAllTransaksi();
      return buildPoint(HARI_SHORT[day.getDay()], dayStr, from, to, allTrx, activeId);
    });
  }

  // ── bulan-ini: weekly bars (W1–W5) within the current month ──────────────
  if (key === 'bulan-ini') {
    const year    = now.getFullYear();
    const month   = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const points: MonthlyDataPoint[] = [];
    const weekStart = new Date(firstDay);
    let weekNum   = 1;
    while (weekStart <= lastDay) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());
      const from = weekStart.toISOString().split('T')[0];
      const to   = weekEnd.toISOString().split('T')[0];

      if (isDrugStore) {
        const salesInWeek = drugStoreSales.filter((t) => t.sale_date >= from && t.sale_date <= to && t.status === 'Selesai');
        const ordersInWeek = drugStoreOrders.filter((o) => o.order_type === 'Pembelian' && o.order_date >= from && o.order_date <= to && o.status === 'Selesai');
        const penjualan = salesInWeek.reduce((s, t) => s + Number(t.total_amount), 0);
        const pembelian = ordersInWeek.reduce((s, o) => s + Number(o.total_amount), 0);
        points.push({ bulan: `W${weekNum}`, label: `Minggu ${weekNum} ${BULAN_SHORT[month]}`, penjualan, pembelian, margin: penjualan - pembelian });
      } else {
        points.push(buildPoint(
          `W${weekNum}`,
          `Minggu ${weekNum} ${BULAN_SHORT[month]}`,
          from, to, getAllTransaksi(), activeId,
        ));
      }
      weekStart.setDate(weekStart.getDate() + 7);
      weekNum++;
    }
    return points;
  }

  // ── tahun-ini: 12 monthly bars for Jan–Dec ─────────────────────────────────
  const year = now.getFullYear();
  return Array.from({ length: 12 }, (_, m) => {
    const date    = new Date(year, m, 1);
    const mk      = monthKey(date);
    const lastDay = new Date(year, m + 1, 0).toISOString().split('T')[0];
    const from    = `${mk}-01`;
    const to      = lastDay > periodTo ? periodTo : lastDay; // don't show future months
    if (from > periodTo) {
      return { bulan: BULAN_SHORT[m], label: `${BULAN_SHORT[m]} ${year}`, penjualan: 0, pembelian: 0, margin: 0 };
    }

    if (isDrugStore) {
      const salesInMonth = drugStoreSales.filter((t) => t.sale_date >= from && t.sale_date <= to && t.status === 'Selesai');
      const ordersInMonth = drugStoreOrders.filter((o) => o.order_type === 'Pembelian' && o.order_date >= from && o.order_date <= to && o.status === 'Selesai');
      const penjualan = salesInMonth.reduce((s, t) => s + Number(t.total_amount), 0);
      const pembelian = ordersInMonth.reduce((s, o) => s + Number(o.total_amount), 0);
      return { bulan: BULAN_SHORT[m], label: `${BULAN_SHORT[m]} ${year}`, penjualan, pembelian, margin: penjualan - pembelian };
    }

    return buildPoint(BULAN_SHORT[m], `${BULAN_SHORT[m]} ${year}`, from, to, getAllTransaksi(), activeId);
  });
}

// ─── Laporan per Periode ──────────────────────────────────────────────────────
//
// Row granularity mirrors the chart:
//   hari-ini   → 1 row (today)
//   minggu-ini → rows per day (Mon–Sun)
//   bulan-ini  → rows per week (W1–W5)
//   tahun-ini  → rows per month (Jan–Dec)

export interface LaporanBulananRow {
  periode:    string; // display label: "Juli 2026" / "Minggu 1 Jul" / "Sen 21 Jul"
  periodeKey: string; // unique key: "2026-07" / "2026-W1" / "2026-07-21"
  penjualan:  number;
  pembelian:  number;
  margin:     number;
  transaksi:  number;
}

export function getLaporanBulanan(key: PeriodeKey, activeWorkspaceId?: string, workspaceType?: string, opts?: {
  drugStoreSales?: DrugStoreSalesDbRow[];
  drugStoreOrders?: DrugStoreOrderDbRow[];
}): LaporanBulananRow[] {
  const now      = new Date();
  const activeId = activeWorkspaceId;
  const { to: periodTo } = getPeriodRange(key);
  const isVeterinary = workspaceType === 'Veterinary';
  const drugStoreSales = opts?.drugStoreSales;
  const drugStoreOrders = opts?.drugStoreOrders;
  const isDrugStore = isVeterinary && drugStoreSales !== undefined && drugStoreOrders !== undefined;

  function buildRow(
    periode:    string,
    periodeKey: string,
    from:       string,
    to:         string,
  ): LaporanBulananRow {
    if (isDrugStore) {
      const trx = drugStoreSales.filter((t) => {
        const d = t.sale_date;
        return t.status === 'Selesai' && d >= from && d <= to;
      });
      const pembelianTrx = drugStoreOrders.filter((o) => {
        const d = o.order_date;
        return o.order_type === 'Pembelian' && o.status === 'Selesai' && d >= from && d <= to;
      });
      const penjualan = trx.reduce((s, t) => s + Number(t.total_amount), 0);
      const pembelian = pembelianTrx.reduce((s, o) => s + Number(o.total_amount), 0);
      return { periode, periodeKey, penjualan, pembelian, margin: penjualan - pembelian, transaksi: trx.length + pembelianTrx.length };
    }

    const allTrx = getAllTransaksi();
    const trx = allTrx.filter((t) => {
      const d = t.selesaiAt ?? t.createdAt;
      return t.status === 'Selesai' && d >= from && d <= to &&
        (t.workspaceIdPenjual === activeId || t.workspaceIdPembeli === activeId);
    });
    const penjualan = trx.filter((t) => t.workspaceIdPenjual === activeId).reduce((s, t) => s + t.total, 0);
    const pembelian = trx.filter((t) => t.workspaceIdPembeli === activeId).reduce((s, t) => s + t.total, 0);
    return { periode, periodeKey, penjualan, pembelian, margin: penjualan - pembelian, transaksi: trx.length };
  }

  // ── hari-ini: single row for today ───────────────────────────────────────
  if (key === 'hari-ini') {
    const d = now.toISOString().split('T')[0];
    const dayName = `${HARI_SHORT[now.getDay()]} ${now.getDate()} ${BULAN_SHORT[now.getMonth()]}`;
    return [buildRow(dayName, d, d, d)];
  }

  // ── minggu-ini: one row per day Mon–Sun ───────────────────────────────────
  if (key === 'minggu-ini') {
    const monday = currentWeekMonday(now);
    return Array.from({ length: 7 }, (_, i) => {
      const day    = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dayStr = day.toISOString().split('T')[0];
      const label  = `${HARI_SHORT[day.getDay()]} ${day.getDate()} ${BULAN_SHORT[day.getMonth()]}`;
      return buildRow(label, dayStr, dayStr, dayStr);
    });
  }

  // ── bulan-ini: one row per week (W1–W5) ──────────────────────────────────
  if (key === 'bulan-ini') {
    const year     = now.getFullYear();
    const month    = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const rows: LaporanBulananRow[] = [];
    const weekStart = new Date(firstDay);
    let weekNum   = 1;
    while (weekStart <= lastDay) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());
      const from = weekStart.toISOString().split('T')[0];
      const to   = weekEnd.toISOString().split('T')[0];
      rows.push(buildRow(
        `Minggu ${weekNum} ${BULAN_ID[month]}`,
        `${year}-${String(month + 1).padStart(2, '0')}-W${weekNum}`,
        from, to,
      ));
      weekStart.setDate(weekStart.getDate() + 7);
      weekNum++;
    }
    return rows;
  }

  // ── tahun-ini: one row per month Jan–Dec ──────────────────────────────────
  const year = now.getFullYear();
  return Array.from({ length: 12 }, (_, m) => {
    const date     = new Date(year, m, 1);
    const mk       = monthKey(date);
    const from     = `${mk}-01`;
    const lastDate = new Date(year, m + 1, 0);
    const to       = lastDate.toISOString().split('T')[0] > periodTo
      ? periodTo
      : lastDate.toISOString().split('T')[0];
    if (from > periodTo) {
      return { periode: `${BULAN_ID[m]} ${year}`, periodeKey: mk, penjualan: 0, pembelian: 0, margin: 0, transaksi: 0 };
    }
    return buildRow(`${BULAN_ID[m]} ${year}`, mk, from, to);
  });
}

// ─── Tahunan Insight ─────────────────────────────────────────────────────────
//
// Provides year-level analytics independent of the active PeriodeKey:
//   - Total penjualan / pembelian / margin for current year
//   - YoY growth vs prior year
//   - Rata-rata per bulan aktif
//   - Per-month contribution breakdown (Jan–Dec)

export interface KontribusiBulan {
  bulan:        string;  // "Jan"
  label:        string;  // "Januari 2026"
  penjualan:    number;
  pembelian:    number;
  margin:       number;
  transaksi:    number;
  pctPenjualan: number;  // % of year total penjualan (0–100)
  pctPembelian: number;  // % of year total pembelian (0–100)
}

export interface TahunanInsight {
  tahun:                     number;
  totalPenjualan:            number;
  totalPembelian:            number;
  totalMargin:               number;
  totalTransaksi:            number;
  bulanAktif:                number; // months with ≥1 completed transaction
  rataRataPenjualanPerBulan: number;
  rataRataPembelianPerBulan: number;
  /** % YoY change — null when previous year has no data */
  yoyPenjualan:   number | null;
  yoyPembelian:   number | null;
  yoyMargin:      number | null;
  prevTahun:             number;
  prevTotalPenjualan:    number;
  prevTotalPembelian:    number;
  prevTotalMargin:       number;
  kontribusiBulanan:     KontribusiBulan[];
}

export function getTahunanInsight(activeWorkspaceId?: string, workspaceType?: string, opts?: {
  drugStoreSales?: DrugStoreSalesDbRow[];
  drugStoreOrders?: DrugStoreOrderDbRow[];
}): TahunanInsight {
  const now      = new Date();
  const year     = now.getFullYear();
  const prevYear = year - 1;
  const activeId = activeWorkspaceId;
  const today    = now.toISOString().split('T')[0];
  const isVeterinary = workspaceType === 'Veterinary';
  const drugStoreSales = opts?.drugStoreSales;
  const drugStoreOrders = opts?.drugStoreOrders;
  const isDrugStore = isVeterinary && drugStoreSales !== undefined && drugStoreOrders !== undefined;

  function yearTotals(y: number) {
    const from = `${y}-01-01`;
    const to   = `${y}-12-31`;

    if (isDrugStore) {
      const trx = drugStoreSales.filter((t) => {
        const d = t.sale_date;
        return t.status === 'Selesai' && d >= from && d <= to;
      });
      const pembelianTrx = drugStoreOrders.filter((o) => {
        const d = o.order_date;
        return o.order_type === 'Pembelian' && o.status === 'Selesai' && d >= from && d <= to;
      });
      const penjualan = trx.reduce((s, t) => s + Number(t.total_amount), 0);
      const pembelian = pembelianTrx.reduce((s, o) => s + Number(o.total_amount), 0);
      return { penjualan, pembelian, margin: penjualan - pembelian, transaksi: trx.length + pembelianTrx.length };
    }

    const allTrx = getAllTransaksi();
    const trx = allTrx.filter((t) => {
      const d = t.selesaiAt ?? t.createdAt;
      return t.status === 'Selesai' && d >= from && d <= to &&
        (t.workspaceIdPenjual === activeId || t.workspaceIdPembeli === activeId);
    });
    const penjualan = trx.filter((t) => t.workspaceIdPenjual === activeId).reduce((s, t) => s + t.total, 0);
    const pembelian = trx.filter((t) => t.workspaceIdPembeli === activeId).reduce((s, t) => s + t.total, 0);
    return { penjualan, pembelian, margin: penjualan - pembelian, transaksi: trx.length };
  }

  function yoyPct(curr: number, prev: number): number | null {
    if (prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  }

  const curr = yearTotals(year);
  const prev = yearTotals(prevYear);

  const kontribusiBulanan: KontribusiBulan[] = Array.from({ length: 12 }, (_, m) => {
    const date  = new Date(year, m, 1);
    const mk    = monthKey(date);
    const from  = `${mk}-01`;
    const lastD = new Date(year, m + 1, 0).toISOString().split('T')[0];
    const to    = lastD > today ? today : lastD;

    if (from > today) {
      return {
        bulan: BULAN_SHORT[m], label: `${BULAN_ID[m]} ${year}`,
        penjualan: 0, pembelian: 0, margin: 0, transaksi: 0,
        pctPenjualan: 0, pctPembelian: 0,
      };
    }

    let penjualan = 0;
    let pembelian = 0;
    let transaksi = 0;

    if (isDrugStore) {
      const salesInMonth = drugStoreSales.filter((t) => t.sale_date >= from && t.sale_date <= to && t.status === 'Selesai');
      const ordersInMonth = drugStoreOrders.filter((o) => o.order_type === 'Pembelian' && o.order_date >= from && o.order_date <= to && o.status === 'Selesai');
      penjualan = salesInMonth.reduce((s, t) => s + Number(t.total_amount), 0);
      pembelian = ordersInMonth.reduce((s, o) => s + Number(o.total_amount), 0);
      transaksi = salesInMonth.length + ordersInMonth.length;
    } else {
      const allTrx = getAllTransaksi();
      const trx = allTrx.filter((t) => {
        const d = t.selesaiAt ?? t.createdAt;
        return t.status === 'Selesai' && d >= from && d <= to &&
          (t.workspaceIdPenjual === activeId || t.workspaceIdPembeli === activeId);
      });
      penjualan = trx.filter((t) => t.workspaceIdPenjual === activeId).reduce((s, t) => s + t.total, 0);
      pembelian = trx.filter((t) => t.workspaceIdPembeli === activeId).reduce((s, t) => s + t.total, 0);
      transaksi = trx.length;
    }

    return {
      bulan: BULAN_SHORT[m],
      label: `${BULAN_ID[m]} ${year}`,
      penjualan, pembelian,
      margin: penjualan - pembelian,
      transaksi,
      pctPenjualan: curr.penjualan > 0 ? (penjualan / curr.penjualan) * 100 : 0,
      pctPembelian: curr.pembelian > 0 ? (pembelian / curr.pembelian) * 100 : 0,
    };
  });

  const bulanAktif                = kontribusiBulanan.filter((b) => b.transaksi > 0).length;
  const rataRataPenjualanPerBulan = bulanAktif > 0 ? curr.penjualan / bulanAktif : 0;
  const rataRataPembelianPerBulan = bulanAktif > 0 ? curr.pembelian / bulanAktif : 0;

  return {
    tahun: year,
    totalPenjualan:  curr.penjualan,
    totalPembelian:  curr.pembelian,
    totalMargin:     curr.margin,
    totalTransaksi:  curr.transaksi,
    bulanAktif,
    rataRataPenjualanPerBulan,
    rataRataPembelianPerBulan,
    yoyPenjualan: yoyPct(curr.penjualan, prev.penjualan),
    yoyPembelian: yoyPct(curr.pembelian, prev.pembelian),
    yoyMargin:    yoyPct(curr.margin, prev.margin),
    prevTahun:          prevYear,
    prevTotalPenjualan: prev.penjualan,
    prevTotalPembelian: prev.pembelian,
    prevTotalMargin:    prev.margin,
    kontribusiBulanan,
  };
}

// ─── Formatting Helpers (re-exported for page use) ───────────────────────────

export function formatRupiah(value: number, short = false): string {
  if (short) {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
    if (value >= 1_000_000)     return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
    if (value >= 1_000)         return `Rp ${(value / 1_000).toFixed(0)}rb`;
    return `Rp ${value.toLocaleString('id-ID')}`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
}
