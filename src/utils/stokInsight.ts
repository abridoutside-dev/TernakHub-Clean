// ─── AI Insight — Stok Pakan (SR-008) ──────────────────────────────────────────
// Insight dihitung LIVE dari data aktual — Stok, Riwayat, Produksi Formula, dan
// Marketplace (semua baca-saja). AI HANYA memberi insight — tidak pernah
// mengubah Master Pakan, Produk Komersial, Formula, Marketplace, atau Livestock.
//
// Sumber data (semua baca-saja):
//   • getInventarisList()      — src/data/stokInventarisData.ts (stok saat ini)
//   • getAllRiwayatEntries()   — src/data/riwayatStokPakanData.ts (riwayat masuk+keluar terpadu)
//   • getMasterPakanById()     — src/data/masterPakanData.ts (harga referensi, fallback saja)
//   • getTotalProduksiBatch()  — src/data/produksiFormulaData.ts (jumlah produksi formula)
//   • getAllPesanan()          — src/data/marketplacePesananData.ts (jumlah pembelian marketplace)

import { getInventarisList, type InventarisItem } from '../data/stokInventarisData';
import { getAllRiwayatEntries, type RiwayatEntry } from '../data/riwayatStokPakanData';
import { getMasterPakanById } from '../data/masterPakanData';
import { getTotalProduksiBatch } from '../data/produksiFormulaData';
import { getAllPesanan } from '../data/marketplacePesananData';
import { getTodayISO as todayIso } from './dateUtils';

export type StokInsightKategori =
  | 'Ringkasan' | 'Peringatan' | 'Penggunaan' | 'Aktivitas' | 'Produksi' | 'Marketplace';

export interface StokInsight {
  kategori: StokInsightKategori;
  icon: string;
  color: string;
  bg: string;
  text: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtQty(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString('id-ID') : n.toFixed(1);
}

function fmtRp(n: number): string {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

/** Senin (00:00) dari minggu yang berisi `d`, sebagai string yyyy-mm-dd. */
function startOfWeekIso(d: Date): string {
  const copy = new Date(d);
  const day = copy.getDay(); // 0 = Minggu
  const diffToMonday = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diffToMonday);
  return copy.toISOString().slice(0, 10);
}

function isSameMonth(dateIso: string, ref: Date): boolean {
  const d = new Date(dateIso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

/** Harga per satuan untuk estimasi nilai persediaan — hargaBeli tercatat (live) diutamakan,
 * fallback ke estimasiHarga Master Pakan HANYA untuk item bersumber Master Pakan (baca-saja). */
function unitPrice(item: InventarisItem): number | undefined {
  if (item.hargaBeli && item.hargaBeli > 0) return item.hargaBeli;
  if (item.sumber === 'Master Pakan' && item.referensiId) {
    const mp = getMasterPakanById(item.referensiId);
    if (mp?.estimasiHarga) return mp.estimasiHarga;
  }
  return undefined;
}

function topBySum(entries: RiwayatEntry[]): { nama: string; total: number; satuan: string } | undefined {
  const map = new Map<string, { total: number; satuan: string }>();
  entries.forEach((e) => {
    const cur = map.get(e.namaPakan);
    if (cur) cur.total += e.jumlah;
    else map.set(e.namaPakan, { total: e.jumlah, satuan: e.satuan });
  });
  const arr = Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  return arr.length > 0 ? { nama: arr[0][0], total: arr[0][1].total, satuan: arr[0][1].satuan } : undefined;
}

function topByCount(entries: RiwayatEntry[]): { nama: string; count: number } | undefined {
  const map = new Map<string, number>();
  entries.forEach((e) => map.set(e.namaPakan, (map.get(e.namaPakan) ?? 0) + 1));
  const arr = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  return arr.length > 0 ? { nama: arr[0][0], count: arr[0][1] } : undefined;
}

// ─── Kategori: Ringkasan ────────────────────────────────────────────────────

function insightRingkasan(items: InventarisItem[]): StokInsight[] {
  const hasil: StokInsight[] = [];

  // Total Jenis Pakan
  hasil.push({
    kategori: 'Ringkasan', icon: '📦', color: '#1b7a43', bg: '#e8f5ee',
    text: `Total ${items.length} jenis pakan tercatat di Stok Pakan saat ini.`,
  });

  // Total Qty Seluruh Stok
  const satuanUnik = new Set(items.map((i) => i.satuan));
  const totalQty = items.reduce((sum, i) => sum + i.jumlahStok, 0);
  const qtyLabel = satuanUnik.size <= 1
    ? `${fmtQty(totalQty)} ${items[0]?.satuan ?? ''}`.trim()
    : `${fmtQty(totalQty)} (campuran satuan: ${Array.from(satuanUnik).join(', ')})`;
  hasil.push({
    kategori: 'Ringkasan', icon: '⚖️', color: '#0277bd', bg: '#e1f5fe',
    text: `Total kuantitas seluruh stok saat ini: ${qtyLabel}.`,
  });

  // Nilai Estimasi Persediaan
  const priced = items.map((i) => ({ item: i, price: unitPrice(i) })).filter((p) => p.price !== undefined);
  if (priced.length > 0) {
    const nilai = priced.reduce((sum, p) => sum + p.item.jumlahStok * (p.price as number), 0);
    const cakupan = priced.length === items.length
      ? ''
      : ` (berdasarkan ${priced.length} dari ${items.length} item yang punya data harga)`;
    hasil.push({
      kategori: 'Ringkasan', icon: '💰', color: '#7b5e2a', bg: '#fff8e1',
      text: `Estimasi nilai total persediaan saat ini: ${fmtRp(nilai)}${cakupan}.`,
    });
  } else {
    hasil.push({
      kategori: 'Ringkasan', icon: 'ℹ️', color: '#546e7a', bg: '#eceff1',
      text: 'Estimasi nilai persediaan belum dapat dihitung — belum ada item dengan data harga tercatat.',
    });
  }

  return hasil;
}

// ─── Kategori: Peringatan ───────────────────────────────────────────────────

function insightPeringatan(items: InventarisItem[], entries: RiwayatEntry[]): StokInsight[] {
  const hasil: StokInsight[] = [];

  const menipis = items.filter((i) => i.status === 'Menipis').sort((a, b) => a.jumlahStok - b.jumlahStok);
  const habis = items.filter((i) => i.status === 'Habis');

  if (menipis.length > 0) {
    const top = menipis[0];
    hasil.push({
      kategori: 'Peringatan', icon: '🟡', color: '#e65100', bg: '#fff3e0',
      text: menipis.length === 1
        ? `Stok hampir habis: "${top.nama}" tersisa ${fmtQty(top.jumlahStok)} ${top.satuan}.`
        : `${menipis.length} produk hampir habis, terparah: "${top.nama}" (${fmtQty(top.jumlahStok)} ${top.satuan}).`,
    });
  }

  if (habis.length > 0) {
    hasil.push({
      kategori: 'Peringatan', icon: '🔴', color: '#c62828', bg: '#ffebee',
      text: habis.length === 1
        ? `Stok kosong: "${habis[0].nama}" — segera lakukan restock.`
        : `${habis.length} produk stoknya sudah kosong: ${habis.map((h) => h.nama).join(', ')}.`,
    });
  }

  if (menipis.length === 0 && habis.length === 0) {
    hasil.push({
      kategori: 'Peringatan', icon: '✅', color: '#1b7a43', bg: '#e8f5ee',
      text: 'Seluruh item stok dalam kondisi aman — tidak ada yang menipis atau kosong.',
    });
  }

  // Produk kadaluarsa — dari riwayat perubahan berjenis "Kedaluwarsa" (baca-saja)
  const kadaluarsa = entries.filter((e) => e.sumberDetail.jenisPerubahan === 'Kedaluwarsa');
  if (kadaluarsa.length > 0) {
    const totalQtyKadaluarsa = kadaluarsa.reduce((s, e) => s + e.jumlah, 0);
    const contoh = kadaluarsa[0];
    hasil.push({
      kategori: 'Peringatan', icon: '⏳', color: '#c62828', bg: '#ffebee',
      text: kadaluarsa.length === 1
        ? `Produk kadaluarsa tercatat: "${contoh.namaPakan}" (${fmtQty(contoh.jumlah)} ${contoh.satuan}) dibuang sesuai SOP.`
        : `${kadaluarsa.length} kejadian produk kadaluarsa tercatat, total ${fmtQty(totalQtyKadaluarsa)} unit terbuang.`,
    });
  }

  // Produk tidak pernah dipakai — ada di stok tapi belum pernah tercatat Keluar sama sekali
  const idKeluar = new Set(entries.filter((e) => e.kategori === 'Keluar').map((e) => e.inventarisId));
  const belumPernahDipakai = items.filter((i) => !idKeluar.has(i.id));
  if (belumPernahDipakai.length > 0) {
    hasil.push({
      kategori: 'Peringatan', icon: '💤', color: '#6a1b9a', bg: '#f3e5f5',
      text: belumPernahDipakai.length === 1
        ? `Produk "${belumPernahDipakai[0].nama}" belum pernah dipakai/keluar sejak masuk ke stok.`
        : `${belumPernahDipakai.length} produk belum pernah dipakai/keluar sejak masuk ke stok: ${belumPernahDipakai.map((i) => i.nama).join(', ')}.`,
    });
  }

  return hasil;
}

// ─── Kategori: Penggunaan ───────────────────────────────────────────────────

function insightPenggunaan(entries: RiwayatEntry[]): StokInsight[] {
  const hasil: StokInsight[] = [];
  const masuk = entries.filter((e) => e.kategori === 'Masuk');
  const keluar = entries.filter((e) => e.kategori === 'Keluar');

  // Produk Paling Banyak Digunakan — total qty keluar terbesar
  const digunakan = topBySum(keluar);
  if (digunakan) {
    hasil.push({
      kategori: 'Penggunaan', icon: '📉', color: '#e65100', bg: '#fff3e0',
      text: `Produk paling banyak digunakan: "${digunakan.nama}" (total ${fmtQty(digunakan.total)} ${digunakan.satuan} terpakai).`,
    });
  }

  // Produk Paling Banyak Masuk — total qty masuk terbesar
  const palingMasuk = topBySum(masuk);
  if (palingMasuk) {
    hasil.push({
      kategori: 'Penggunaan', icon: '📈', color: '#0277bd', bg: '#e1f5fe',
      text: `Produk paling banyak masuk: "${palingMasuk.nama}" (total ${fmtQty(palingMasuk.total)} ${palingMasuk.satuan} masuk).`,
    });
  }

  // Produk Paling Banyak Keluar — frekuensi transaksi keluar terbanyak
  const palingKeluar = topByCount(keluar);
  if (palingKeluar) {
    hasil.push({
      kategori: 'Penggunaan', icon: '🔻', color: '#c62828', bg: '#ffebee',
      text: `Produk paling banyak keluar: "${palingKeluar.nama}" (${palingKeluar.count}x transaksi keluar tercatat).`,
    });
  }

  return hasil;
}

// ─── Kategori: Aktivitas ────────────────────────────────────────────────────

function insightAktivitas(entries: RiwayatEntry[]): StokInsight[] {
  const now = new Date();
  const today = todayIso();
  const mondayThisWeek = startOfWeekIso(now);

  const hariIni = entries.filter((e) => e.tanggal === today).length;
  const mingguIni = entries.filter((e) => e.tanggal >= mondayThisWeek && e.tanggal <= today).length;
  const bulanIni = entries.filter((e) => isSameMonth(e.tanggal, now)).length;

  return [
    {
      kategori: 'Aktivitas', icon: '📅', color: '#1b7a43', bg: '#e8f5ee',
      text: `Aktivitas stok hari ini: ${hariIni} transaksi tercatat.`,
    },
    {
      kategori: 'Aktivitas', icon: '🗓️', color: '#0277bd', bg: '#e1f5fe',
      text: `Aktivitas stok minggu ini: ${mingguIni} transaksi tercatat.`,
    },
    {
      kategori: 'Aktivitas', icon: '📆', color: '#7b5e2a', bg: '#fff8e1',
      text: `Aktivitas stok bulan ini: ${bulanIni} transaksi tercatat.`,
    },
  ];
}

// ─── Kategori: Produksi & Marketplace ───────────────────────────────────────

function insightProduksiDanMarketplace(): StokInsight[] {
  const jumlahProduksi = getTotalProduksiBatch();
  const jumlahPembelian = getAllPesanan().length;

  return [
    {
      kategori: 'Produksi', icon: '🏭', color: '#1b7a43', bg: '#e8f5ee',
      text: `Jumlah produksi formula tercatat: ${jumlahProduksi} batch.`,
    },
    {
      kategori: 'Marketplace', icon: '🛒', color: '#0277bd', bg: '#e1f5fe',
      text: `Jumlah pembelian Marketplace tercatat: ${jumlahPembelian} pesanan.`,
    },
  ];
}

// ─── Entry point ────────────────────────────────────────────────────────────

/** Menghasilkan seluruh insight AI Stok Pakan, dihitung LIVE dari data aktual (SR-008). */
export function computeStokAiInsights(): StokInsight[] {
  const items = getInventarisList();
  const entries = getAllRiwayatEntries();

  return [
    ...insightRingkasan(items),
    ...insightPeringatan(items, entries),
    ...insightPenggunaan(entries),
    ...insightAktivitas(entries),
    ...insightProduksiDanMarketplace(),
  ];
}
