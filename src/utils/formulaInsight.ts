// ─── AI Insight — Formula (FP-007) ──────────────────────────────────────────────
// Insight dihitung LIVE dari data aktual — Formula, Produksi, Stok (baca-saja).
// AI HANYA memberi insight — tidak pernah mengubah Formula/Stok/Master Pakan/
// Produk Komersial/Livestock, dan tidak pernah menjalankan Produksi.
//
// Sumber data (semua baca-saja):
//   • getFormulaList()        — src/data/formulaData.ts
//   • getInventarisList()     — src/data/stokInventarisData.ts (stok saat ini)
//   • getAllProduksiRecords() — src/data/produksiFormulaData.ts (riwayat produksi)

import { getFormulaList, type FormulaRecord } from '../data/formulaData';
import { getInventarisList, type InventarisItem } from '../data/stokInventarisData';
import { getAllProduksiRecords } from '../data/produksiFormulaData';

export type InsightKategori = 'Produksi' | 'Stok' | 'Nutrisi' | 'Biaya' | 'Penggunaan';

export interface FormulaInsight {
  kategori: InsightKategori;
  icon: string;
  color: string;
  bg: string;
  text: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function matchInventaris(nama: string, inventaris: InventarisItem[]): InventarisItem | undefined {
  const key = nama.trim().toLowerCase();
  return inventaris.find((i) => i.nama.trim().toLowerCase() === key);
}

function fmtKg(n: number): string {
  return Number.isInteger(n) ? `${n}` : n.toFixed(1);
}

function fmtRp(n: number): string {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

interface MaxProduksi {
  formula: FormulaRecord;
  maxKg: number;
  faktorPembatas: string[];
  bahanTidakDitemukan: string[];
  bisaProduksi: boolean;
}

/** Kapasitas produksi maksimum formula berdasarkan stok bahan baku saat ini. */
function hitungMaxProduksi(formula: FormulaRecord, inventaris: InventarisItem[]): MaxProduksi {
  if (formula.bahan.length === 0) {
    return { formula, maxKg: 0, faktorPembatas: [], bahanTidakDitemukan: [], bisaProduksi: false };
  }
  const bahanTidakDitemukan: string[] = [];
  const kapasitas = formula.bahan.map((b) => {
    const inv = matchInventaris(b.nama, inventaris);
    if (!inv) { bahanTidakDitemukan.push(b.nama); return { nama: b.nama, kap: 0, stok: 0 }; }
    if (b.proporsi === 0) return { nama: b.nama, kap: Infinity, stok: inv.jumlahStok };
    return { nama: b.nama, kap: inv.jumlahStok / (b.proporsi / 100), stok: inv.jumlahStok };
  });
  const minKap = Math.min(...kapasitas.map((k) => k.kap));
  const maxKg = Number.isFinite(minKap) ? Math.floor(minKap * 10) / 10 : 0;
  const faktorPembatas = kapasitas
    .filter((k) => Number.isFinite(k.kap) && Math.abs(k.kap - minKap) < 0.001)
    .map((k) => k.nama);
  return {
    formula, maxKg, faktorPembatas, bahanTidakDitemukan,
    bisaProduksi: maxKg > 0 && bahanTidakDitemukan.length === 0,
  };
}

function bahanStokTersisa(nama: string, inventaris: InventarisItem[]): number {
  return matchInventaris(nama, inventaris)?.jumlahStok ?? 0;
}

// ─── Kategori: Produksi ───────────────────────────────────────────────────────

function insightProduksi(formulaAktif: FormulaRecord[], inventaris: InventarisItem[]): FormulaInsight[] {
  const hasil: FormulaInsight[] = [];
  const analisis = formulaAktif.map((f) => hitungMaxProduksi(f, inventaris));

  const bisaProduksi = analisis.filter((a) => a.bisaProduksi).sort((a, b) => b.maxKg - a.maxKg);
  const tidakBisa = analisis.filter((a) => !a.bisaProduksi);

  if (bisaProduksi.length > 0) {
    const top = bisaProduksi[0];
    hasil.push({
      kategori: 'Produksi', icon: '✅', color: '#1b7a43', bg: '#e8f5ee',
      text: `Formula "${top.formula.nama}" dapat diproduksi hingga ${fmtKg(top.maxKg)} kg berdasarkan stok saat ini.`,
    });
    if (bisaProduksi.length > 1) {
      hasil.push({
        kategori: 'Produksi', icon: '📋', color: '#0277bd', bg: '#e1f5fe',
        text: `${bisaProduksi.length} formula aktif siap diproduksi saat ini: ${bisaProduksi.map((a) => a.formula.nama).join(', ')}.`,
      });
    }
  } else {
    hasil.push({
      kategori: 'Produksi', icon: '🚫', color: '#c62828', bg: '#ffebee',
      text: 'Belum ada formula aktif yang dapat diproduksi dengan stok bahan baku saat ini.',
    });
  }

  if (tidakBisa.length > 0) {
    const contoh = tidakBisa[0];
    const alasan = contoh.bahanTidakDitemukan.length > 0
      ? `bahan "${contoh.bahanTidakDitemukan[0]}" belum ada di stok`
      : `stok "${contoh.faktorPembatas[0]}" tidak mencukupi`;
    hasil.push({
      kategori: 'Produksi', icon: '⛔', color: '#c62828', bg: '#ffebee',
      text: tidakBisa.length === 1
        ? `Formula "${contoh.formula.nama}" tidak dapat diproduksi karena ${alasan}.`
        : `${tidakBisa.length} formula aktif tidak dapat diproduksi saat ini, contoh: "${contoh.formula.nama}" (${alasan}).`,
    });
  }

  // Faktor pembatas — formula paling terhambat di antara yang masih bisa produksi
  const palingTerhambat = bisaProduksi[bisaProduksi.length - 1];
  if (palingTerhambat && palingTerhambat.faktorPembatas.length > 0) {
    const bahanNama = palingTerhambat.faktorPembatas[0];
    const sisa = bahanStokTersisa(bahanNama, inventaris);
    hasil.push({
      kategori: 'Produksi', icon: '⚠️', color: '#e65100', bg: '#fff3e0',
      text: `Produksi Formula "${palingTerhambat.formula.nama}" terhambat karena stok ${bahanNama} hanya tersisa ${fmtKg(sisa)} kg.`,
    });
  }

  return hasil;
}

// ─── Kategori: Stok ───────────────────────────────────────────────────────────

function insightStok(formulaAktif: FormulaRecord[], inventaris: InventarisItem[]): FormulaInsight[] {
  const hasil: FormulaInsight[] = [];

  // Bahan yang dipakai formula aktif & akan segera habis (status Menipis/Habis)
  const namaBahanTerpakai = new Set<string>();
  formulaAktif.forEach((f) => f.bahan.forEach((b) => namaBahanTerpakai.add(b.nama.trim().toLowerCase())));
  const bahanKritis = inventaris
    .filter((inv) => namaBahanTerpakai.has(inv.nama.trim().toLowerCase()) && inv.status !== 'Normal')
    .sort((a, b) => a.jumlahStok - b.jumlahStok);

  if (bahanKritis.length > 0) {
    const top = bahanKritis[0];
    hasil.push({
      kategori: 'Stok', icon: top.status === 'Habis' ? '🔴' : '🟡', color: top.status === 'Habis' ? '#c62828' : '#e65100',
      bg: top.status === 'Habis' ? '#ffebee' : '#fff3e0',
      text: bahanKritis.length === 1
        ? `Bahan "${top.nama}" ${top.status === 'Habis' ? 'sudah habis' : `tersisa ${fmtKg(top.jumlahStok)} ${top.satuan}`} — akan segera membatasi produksi formula yang memakainya.`
        : `${bahanKritis.length} bahan yang dipakai formula aktif akan segera habis, terparah: "${top.nama}" (${fmtKg(top.jumlahStok)} ${top.satuan}).`,
    });
  } else {
    hasil.push({
      kategori: 'Stok', icon: '✅', color: '#1b7a43', bg: '#e8f5ee',
      text: 'Seluruh bahan baku formula aktif dalam kondisi stok aman.',
    });
  }

  // Formula yang terhambat karena stok
  const analisis = formulaAktif.map((f) => hitungMaxProduksi(f, inventaris));
  const terhambat = analisis.filter((a) => !a.bisaProduksi);
  if (terhambat.length > 0) {
    hasil.push({
      kategori: 'Stok', icon: '⛔', color: '#c62828', bg: '#ffebee',
      text: `${terhambat.length} formula aktif terhambat produksinya karena kekurangan stok bahan baku: ${terhambat.map((a) => a.formula.nama).join(', ')}.`,
    });
  }

  // Rekomendasi restock — bahan paling sering jadi faktor pembatas / paling kritis
  if (bahanKritis.length > 0) {
    const top = bahanKritis[0];
    hasil.push({
      kategori: 'Stok', icon: '🛒', color: '#6a1b9a', bg: '#f3e5f5',
      text: `Rekomendasi: segera restock "${top.nama}" agar formula yang memakainya dapat terus diproduksi.`,
    });
  }

  return hasil;
}

// ─── Kategori: Nutrisi ────────────────────────────────────────────────────────

function insightNutrisi(formulaAktif: FormulaRecord[]): FormulaInsight[] {
  const hasil: FormulaInsight[] = [];
  const berNutrisi = formulaAktif.filter((f) => f.estimasiNutrisi.pk > 0 || f.estimasiNutrisi.tdn > 0);
  if (berNutrisi.length === 0) return hasil;

  // Nutrisi terbaik — skor gabungan PK + TDN (energi & protein tertinggi)
  const terbaik = [...berNutrisi].sort(
    (a, b) => (b.estimasiNutrisi.pk + b.estimasiNutrisi.tdn) - (a.estimasiNutrisi.pk + a.estimasiNutrisi.tdn)
  )[0];
  hasil.push({
    kategori: 'Nutrisi', icon: '🌟', color: '#1b7a43', bg: '#e8f5ee',
    text: `Formula "${terbaik.nama}" memiliki nutrisi terbaik saat ini (PK ${terbaik.estimasiNutrisi.pk}%, TDN ${terbaik.estimasiNutrisi.tdn}%).`,
  });

  // Paling seimbang — deviasi terkecil dari rentang ideal umum (PK 14–18%, SK 10–20%, TDN 60–75%)
  const targetPk = 16, targetSk = 15, targetTdn = 68;
  const paling_seimbang = [...berNutrisi].sort((a, b) => {
    const devA = Math.abs(a.estimasiNutrisi.pk - targetPk) + Math.abs(a.estimasiNutrisi.sk - targetSk) + Math.abs(a.estimasiNutrisi.tdn - targetTdn);
    const devB = Math.abs(b.estimasiNutrisi.pk - targetPk) + Math.abs(b.estimasiNutrisi.sk - targetSk) + Math.abs(b.estimasiNutrisi.tdn - targetTdn);
    return devA - devB;
  })[0];
  hasil.push({
    kategori: 'Nutrisi', icon: '⚖️', color: '#0277bd', bg: '#e1f5fe',
    text: `Formula "${paling_seimbang.nama}" paling seimbang antara protein, serat, dan energi (PK ${paling_seimbang.estimasiNutrisi.pk}% · SK ${paling_seimbang.estimasiNutrisi.sk}% · TDN ${paling_seimbang.estimasiNutrisi.tdn}%).`,
  });

  // Belum memenuhi target nutrisi — PK di bawah 14% dianggap belum memenuhi target minimum umum
  const belumMemenuhi = berNutrisi.filter((f) => f.estimasiNutrisi.pk < 14 || f.estimasiNutrisi.tdn < 60);
  if (belumMemenuhi.length > 0) {
    const contoh = belumMemenuhi[0];
    hasil.push({
      kategori: 'Nutrisi', icon: '⚠️', color: '#e65100', bg: '#fff3e0',
      text: belumMemenuhi.length === 1
        ? `Formula "${contoh.nama}" belum memenuhi target nutrisi minimum (PK ${contoh.estimasiNutrisi.pk}%, TDN ${contoh.estimasiNutrisi.tdn}%).`
        : `${belumMemenuhi.length} formula aktif belum memenuhi target nutrisi minimum, contoh: "${contoh.nama}" (PK ${contoh.estimasiNutrisi.pk}%, TDN ${contoh.estimasiNutrisi.tdn}%).`,
    });
  }

  return hasil;
}

// ─── Kategori: Biaya ──────────────────────────────────────────────────────────

function insightBiaya(formulaAktif: FormulaRecord[]): FormulaInsight[] {
  const hasil: FormulaInsight[] = [];
  if (formulaAktif.length === 0) return hasil;

  const termurah = [...formulaAktif].sort((a, b) => a.estimasiHPP - b.estimasiHPP)[0];
  hasil.push({
    kategori: 'Biaya', icon: '💰', color: '#1b7a43', bg: '#e8f5ee',
    text: `Formula "${termurah.nama}" memiliki HPP terendah saat ini: ${fmtRp(termurah.estimasiHPP)}/kg.`,
  });

  // Paling ekonomis — rasio nutrisi (PK+TDN) per Rupiah HPP tertinggi
  const berNutrisi = formulaAktif.filter((f) => f.estimasiHPP > 0 && (f.estimasiNutrisi.pk > 0 || f.estimasiNutrisi.tdn > 0));
  if (berNutrisi.length > 0) {
    const ekonomis = [...berNutrisi].sort((a, b) => {
      const rasioA = (a.estimasiNutrisi.pk + a.estimasiNutrisi.tdn) / a.estimasiHPP;
      const rasioB = (b.estimasiNutrisi.pk + b.estimasiNutrisi.tdn) / b.estimasiHPP;
      return rasioB - rasioA;
    })[0];
    hasil.push({
      kategori: 'Biaya', icon: '📈', color: '#0277bd', bg: '#e1f5fe',
      text: `Formula "${ekonomis.nama}" paling ekonomis — nutrisi terbaik per Rupiah HPP (${fmtRp(ekonomis.estimasiHPP)}/kg).`,
    });
  }

  const termahal = [...formulaAktif].sort((a, b) => b.estimasiHPP - a.estimasiHPP)[0];
  if (termahal.id !== termurah.id) {
    hasil.push({
      kategori: 'Biaya', icon: '🔺', color: '#e65100', bg: '#fff3e0',
      text: `Formula "${termahal.nama}" memiliki biaya produksi tertinggi: ${fmtRp(termahal.estimasiHPP)}/kg.`,
    });
  }

  return hasil;
}

// ─── Kategori: Penggunaan ─────────────────────────────────────────────────────

function insightPenggunaan(formulaAll: FormulaRecord[]): FormulaInsight[] {
  const hasil: FormulaInsight[] = [];
  if (formulaAll.length === 0) return hasil;

  // Paling sering diproduksi — dihitung dari riwayat produksi aktual (FP-006)
  const riwayat = getAllProduksiRecords();
  const jumlahPerFormula = new Map<string, { nama: string; count: number }>();
  riwayat.forEach((r) => {
    const entry = jumlahPerFormula.get(r.formulaId);
    if (entry) entry.count += 1;
    else jumlahPerFormula.set(r.formulaId, { nama: r.formulaNama, count: 1 });
  });
  const terseringArr = Array.from(jumlahPerFormula.values()).sort((a, b) => b.count - a.count);
  if (terseringArr.length > 0) {
    const top = terseringArr[0];
    hasil.push({
      kategori: 'Penggunaan', icon: '🔁', color: '#1b7a43', bg: '#e8f5ee',
      text: `Formula "${top.nama}" paling sering diproduksi (${top.count}x tercatat di riwayat produksi).`,
    });
  }

  // Sudah lama tidak digunakan — Aktif, punya terakhirDigunakan, urutkan yang paling lama
  const pernahDigunakan = formulaAll
    .filter((f) => f.status === 'Aktif' && f.terakhirDigunakan)
    .sort((a, b) => (a.terakhirDigunakan ?? '').localeCompare(b.terakhirDigunakan ?? ''));
  if (pernahDigunakan.length > 0) {
    const lama = pernahDigunakan[0];
    hasil.push({
      kategori: 'Penggunaan', icon: '🕒', color: '#7b5e2a', bg: '#fff8e1',
      text: `Formula "${lama.nama}" sudah lama tidak digunakan — terakhir diproduksi ${lama.terakhirDigunakan}.`,
    });
  }
  const belumPernah = formulaAll.filter((f) => f.status === 'Aktif' && !f.terakhirDigunakan);
  if (belumPernah.length > 0) {
    hasil.push({
      kategori: 'Penggunaan', icon: '🆕', color: '#6a1b9a', bg: '#f3e5f5',
      text: belumPernah.length === 1
        ? `Formula "${belumPernah[0].nama}" berstatus aktif namun belum pernah diproduksi.`
        : `${belumPernah.length} formula aktif belum pernah diproduksi sama sekali.`,
    });
  }

  // Formula terbaru
  const terbaru = [...formulaAll].sort((a, b) => b.dibuatPada.localeCompare(a.dibuatPada))[0];
  hasil.push({
    kategori: 'Penggunaan', icon: '✨', color: '#0277bd', bg: '#e1f5fe',
    text: `Formula terbaru: "${terbaru.nama}", dibuat pada ${terbaru.dibuatPada}.`,
  });

  return hasil;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/** Menghasilkan seluruh insight AI Formula, dihitung live dari data aktual. */
export function computeFormulaAiInsights(): FormulaInsight[] {
  const formulaAll = getFormulaList();
  const formulaAktif = formulaAll.filter((f) => f.status === 'Aktif');
  const inventaris = getInventarisList();

  return [
    ...insightProduksi(formulaAktif, inventaris),
    ...insightStok(formulaAktif, inventaris),
    ...insightNutrisi(formulaAktif),
    ...insightBiaya(formulaAktif),
    ...insightPenggunaan(formulaAll),
  ];
}
