// ─── AI Insight — Riwayat Stok Pakan (SR-001) ──────────────────────────────────
// Insight dihitung LIVE dari data aktual (Riwayat Stok Pakan, baca-saja).
// AI HANYA memberi insight — tidak pernah mengubah data.

import { getAllRiwayatEntries, type RiwayatEntry } from '../data/riwayatStokPakanData';
export type { RiwayatEntry };

export interface RiwayatInsight {
  icon: string;
  color: string;
  bg: string;
  text: string;
}

function topByCount<T>(items: T[], keyFn: (item: T) => string): { key: string; count: number } | undefined {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  const arr = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  return arr.length > 0 ? { key: arr[0][0], count: arr[0][1] } : undefined;
}

function topBySum(items: RiwayatEntry[], keyFn: (item: RiwayatEntry) => string): { key: string; total: number; satuan: string } | undefined {
  const map = new Map<string, { total: number; satuan: string }>();
  items.forEach((item) => {
    const key = keyFn(item);
    const entry = map.get(key);
    if (entry) entry.total += item.jumlah;
    else map.set(key, { total: item.jumlah, satuan: item.satuan });
  });
  const arr = Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  return arr.length > 0 ? { key: arr[0][0], total: arr[0][1].total, satuan: arr[0][1].satuan } : undefined;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? `${n}` : n.toFixed(1);
}

/** Menghasilkan seluruh insight AI Riwayat Stok Pakan, dihitung live dari data aktual. */
export function computeRiwayatAiInsights(): RiwayatInsight[] {
  const entries = getAllRiwayatEntries();
  const hasil: RiwayatInsight[] = [];

  if (entries.length === 0) {
    hasil.push({
      icon: 'ℹ️', color: '#0277bd', bg: '#e1f5fe',
      text: 'Belum ada aktivitas stok pakan yang tercatat.',
    });
    return hasil;
  }

  // Aktivitas stok paling sering
  const aktivitasTersering = topByCount(entries, (e) => e.aktivitas);
  if (aktivitasTersering) {
    hasil.push({
      icon: '📊', color: '#1b7a43', bg: '#e8f5ee',
      text: `Aktivitas stok paling sering: "${aktivitasTersering.key}" (${aktivitasTersering.count}x tercatat).`,
    });
  }

  // Pakan paling banyak digunakan (keluar, dijumlahkan)
  const keluar = entries.filter((e) => e.kategori === 'Keluar');
  const pakanTerbanyakKeluar = topBySum(keluar, (e) => e.namaPakan);
  if (pakanTerbanyakKeluar) {
    hasil.push({
      icon: '📉', color: '#e65100', bg: '#fff3e0',
      text: `Pakan paling banyak digunakan/keluar: "${pakanTerbanyakKeluar.key}" (total ${fmt(pakanTerbanyakKeluar.total)} ${pakanTerbanyakKeluar.satuan}).`,
    });
  }

  // Produk paling sering masuk
  const masuk = entries.filter((e) => e.kategori === 'Masuk');
  const produkTerseringMasuk = topByCount(masuk, (e) => e.namaPakan);
  if (produkTerseringMasuk) {
    hasil.push({
      icon: '📈', color: '#0277bd', bg: '#e1f5fe',
      text: `Produk paling sering masuk: "${produkTerseringMasuk.key}" (${produkTerseringMasuk.count}x tercatat).`,
    });
  }

  // Produk paling sering keluar
  const produkTerseringKeluar = topByCount(keluar, (e) => e.namaPakan);
  if (produkTerseringKeluar) {
    hasil.push({
      icon: '🔻', color: '#c62828', bg: '#ffebee',
      text: `Produk paling sering keluar: "${produkTerseringKeluar.key}" (${produkTerseringKeluar.count}x tercatat).`,
    });
  }

  return hasil;
}

/**
 * AI Insight untuk satu entri di halaman Detail Riwayat (SR-002).
 * Aturan sederhana berbasis sumber/jenis aktivitas — read-only, tidak pernah
 * mengubah data. Selalu mengembalikan tepat satu kalimat insight.
 */
export function computeDetailAiInsight(entry: RiwayatEntry): RiwayatInsight {
  const base = { icon: '🤖', color: '#1b7a43', bg: '#e8f5ee' };

  if (entry.kategori === 'Keluar' && entry.sumber === 'Pemberian Pakan') {
    return { ...base, text: 'Pengurangan stok ini berasal dari pemberian pakan rutin ke ternak.' };
  }
  if (entry.sumber === 'Produksi Formula' && entry.kategori === 'Masuk') {
    return { ...base, text: `Penambahan stok ini berasal dari hasil Produksi Formula${entry.sumberDetail.namaFormula ? ` "${entry.sumberDetail.namaFormula}"` : ''}.` };
  }
  if (entry.sumber === 'Produksi Formula' && entry.kategori === 'Keluar') {
    return { ...base, color: '#e65100', bg: '#fff3e0', text: `Perubahan stok terjadi akibat penggunaan bahan baku untuk Produksi Formula${entry.sumberDetail.namaFormula ? ` "${entry.sumberDetail.namaFormula}"` : ''}.` };
  }
  if (entry.sumber === 'Marketplace') {
    return { ...base, color: '#0277bd', bg: '#e1f5fe', text: 'Penambahan stok ini berasal dari pembelian melalui Marketplace.' };
  }
  if (entry.sumber === 'Tambah Stok') {
    return { ...base, color: '#0277bd', bg: '#e1f5fe', text: 'Penambahan stok ini dicatat secara manual melalui form Tambah Stok.' };
  }
  const jenis = entry.sumberDetail.jenisPerubahan;
  if (entry.sumber === 'Penyesuaian Stok') {
    return { ...base, color: '#1b7a43', bg: '#e8f5ee', text: 'Penambahan stok ini adalah Penyesuaian Positif — stok disesuaikan ke atas setelah penghitungan fisik.' };
  }
  if (entry.sumber === 'Pindah Gudang' && entry.kategori === 'Masuk') {
    return { ...base, color: '#0277bd', bg: '#e1f5fe', text: 'Penerimaan stok ini berasal dari transfer antar gudang atau lokasi penyimpanan.' };
  }
  if (jenis === 'Pindah Gudang' || entry.sumber === 'Pindah Gudang') {
    const tujuan = entry.sumberDetail.lokasiTujuan;
    return { ...base, color: '#e65100', bg: '#fff3e0', text: `Stok dipindahkan ke gudang atau lokasi lain${tujuan ? ` (tujuan: ${tujuan})` : ''}. Stok akan muncul sebagai penerimaan di lokasi tujuan.` };
  }
  if (jenis === 'Donasi') {
    return { ...base, color: '#6a1b9a', bg: '#f3e5f5', text: 'Pengurangan stok ini tercatat sebagai Donasi — pakan diberikan ke pihak luar tanpa transaksi jual-beli.' };
  }
  if (jenis === 'Dijual') {
    return { ...base, color: '#c62828', bg: '#ffebee', text: 'Pengurangan stok ini terjadi karena pakan dijual.' };
  }
  if (jenis === 'Dipindahkan ke Peternakan Lain') {
    return { ...base, color: '#e65100', bg: '#fff3e0', text: 'Stok ini dipindahkan ke peternakan atau workspace lain.' };
  }
  if (jenis === 'Penyesuaian Negatif' || jenis === 'Koreksi Stok' || jenis === 'Penyesuaian Awal') {
    return { ...base, color: '#0277bd', bg: '#e1f5fe', text: 'Perubahan ini merupakan Penyesuaian Negatif — stok dikurangi tanpa pemakaian aktual, biasanya hasil penghitungan fisik.' };
  }
  if (jenis && ['Rusak', 'Busuk', 'Berjamur', 'Kedaluwarsa', 'Tumpah', 'Dimakan Hama', 'Hilang'].includes(jenis)) {
    return { ...base, color: '#c62828', bg: '#ffebee', text: `Pengurangan stok ini merupakan kerugian akibat "${jenis}", bukan pemakaian normal.` };
  }
  return { ...base, color: '#0277bd', bg: '#e1f5fe', text: 'Aktivitas ini tercatat sebagai bagian dari audit trail pergerakan stok pakan.' };
}
