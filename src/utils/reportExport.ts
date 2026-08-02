// ─── Report Export Utility ────────────────────────────────────────────────────
// Shared download helper — same blob+anchor pattern as masterObatImportExport.ts
// (BUG-001). Supports CSV and JSON export for Livestock, Stok Pakan, Formula
// Pakan, Produk Komersial, and Business Insight using only the live in-memory
// data stores.

import * as XLSX from 'xlsx';
import { LIVESTOCK_DB } from '../data/livestockData';
import { getInventarisList } from '../data/stokInventarisData';
import { getFormulaList } from '../data/formulaData';
import { getProdukKomersialList } from '../data/produkKomersialData';
import type {
  RingkasanBI,
  ModuleBreakdown,
  MonthlyDataPoint,
  LaporanBulananRow,
} from '../data/businessInsightData';

export type ReportModule = 'Livestock' | 'Stok Pakan' | 'Formula Pakan' | 'Produk Komersial';

// ─── Core download helper (mirrors masterObatImportExport.ts) ─────────────────

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCSV(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s: string;
  if (typeof v === 'object') s = JSON.stringify(v);
  else s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return 'Tidak ada data\r\n';
  const headers = Object.keys(rows[0]);
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => escapeCSV(r[h])).join(',')),
  ].join('\r\n');
}

// ─── Data builders ────────────────────────────────────────────────────────────

function buildLivestockRows(): Record<string, unknown>[] {
  return Object.values(LIVESTOCK_DB).map(lv => ({
    id: lv.id,
    nama: lv.name ?? '',
    jenis: lv.type,
    ras: lv.ras,
    kelamin: lv.kelamin,
    tanggalLahir: lv.birthDate,
    umurEstimasi: lv.birthDateEstimated ? 'Ya' : 'Tidak',
    umur: lv.age,
    beratLahir: lv.birthWeight,
    beratSekarang: lv.weight,
    satuan: lv.weightUnit,
    statusKesehatan: lv.status,
    lokasi: lv.location,
    program: lv.program,
    digitalVerified: lv.digitalIdentity?.verified ? 'Ya' : 'Tidak',
  }));
}

function buildStokPakanRows(): Record<string, unknown>[] {
  return getInventarisList().map(item => ({
    id: item.id,
    nama: item.nama,
    brand: item.brand ?? '',
    kategori: item.kategori,
    sumber: item.sumber,
    jumlahStok: item.jumlahStok,
    satuan: item.satuan,
    status: item.status,
    hargaBeli: item.hargaBeli ?? '',
    supplier: item.supplier ?? '',
    lokasiPenyimpanan: item.lokasiPenyimpanan ?? '',
    tanggalMasuk: item.tanggalMasuk ?? '',
    terakhirDiperbarui: item.terakhirDiperbarui,
  }));
}

function buildFormulaPakanRows(): Record<string, unknown>[] {
  return getFormulaList().map(f => ({
    id: f.id,
    nama: f.nama,
    jenis: f.jenis,
    targetTernak: f.targetTernak,
    fasePemeliharaan: f.fasePemeliharaan ?? '',
    tujuan: f.tujuan ?? '',
    status: f.status,
    jumlahBahan: f.jumlahBahan,
    estimasiHPP: f.estimasiHPP,
    proteinKasar_pk: f.estimasiNutrisi?.pk ?? '',
    seratKasar_sk: f.estimasiNutrisi?.sk ?? '',
    tdn: f.estimasiNutrisi?.tdn ?? '',
    dibuatPada: f.dibuatPada,
    diperbarui: f.diperbarui,
  }));
}

function buildProdukKomersialRows(): Record<string, unknown>[] {
  return getProdukKomersialList().map(p => ({
    id: p.id,
    nama: p.nama,
    merek: p.merek,
    produsen: p.produsen,
    kategoriSlug: p.kategoriSlug,
    seri: p.seri ?? '',
    jenisProduk: p.jenisProduk ?? '',
    statusProduksi: p.statusProduksi ?? '',
    beratKemasan: p.beratKemasan ?? '',
    satuanDefault: p.satuanDefault ?? '',
    updatedAt: p.updatedAt,
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ReportDataResult {
  module: ReportModule;
  rows: Record<string, unknown>[];
  rowCount: number;
  hasData: boolean;
}

export function getReportData(module: ReportModule): ReportDataResult {
  let rows: Record<string, unknown>[] = [];
  switch (module) {
    case 'Livestock':         rows = buildLivestockRows();        break;
    case 'Stok Pakan':        rows = buildStokPakanRows();        break;
    case 'Formula Pakan':     rows = buildFormulaPakanRows();     break;
    case 'Produk Komersial':  rows = buildProdukKomersialRows();  break;
  }
  return { module, rows, rowCount: rows.length, hasData: rows.length > 0 };
}

function dateSlug(): string {
  return new Date().toISOString().slice(0, 10);
}

function moduleSuffix(module: ReportModule): string {
  return module.toLowerCase().replace(/ /g, '-');
}

/** Downloads a CSV file for the given module. Returns the row count. */
export function downloadReportCSV(module: ReportModule): number {
  const { rows } = getReportData(module);
  const csv = toCSV(rows);
  const filename = `laporan-${moduleSuffix(module)}-${dateSlug()}.csv`;
  // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel auto-detects UTF-8 encoding
  // and renders Indonesian characters correctly without a manual import wizard.
  downloadFile('\uFEFF' + csv, filename, 'text/csv;charset=utf-8;');
  return rows.length;
}

/** Downloads a JSON file for the given module. Returns the row count. */
export function downloadReportJSON(module: ReportModule): number {
  const { rows } = getReportData(module);
  const payload = {
    schema: 'ternakhub-report',
    module,
    exportedAt: new Date().toISOString(),
    rowCount: rows.length,
    data: rows,
  };
  const filename = `laporan-${moduleSuffix(module)}-${dateSlug()}.json`;
  downloadFile(JSON.stringify(payload, null, 2), filename, 'application/json');
  return rows.length;
}

// ─── Business Insight Export ──────────────────────────────────────────────────
// Gated by 'reports_export_excel' (Pro+). The gate is enforced in the UI layer
// (ProfileBusinessInsight.tsx) via useSubscription + UpgradeDialog — these
// functions assume the caller has already verified access.

export type BITab = 'ringkasan' | 'grafik' | 'breakdown' | 'laporan';

export interface BIExportInput {
  tab:        BITab;
  ringkasan?: RingkasanBI;
  monthly?:   MonthlyDataPoint[];
  breakdown?: ModuleBreakdown;
  laporan?:   LaporanBulananRow[];
}

const BI_TAB_SLUG: Record<BITab, string> = {
  ringkasan: 'ringkasan',
  grafik:    'grafik',
  breakdown: 'breakdown',
  laporan:   'laporan',
};

// ── Row builders ──────────────────────────────────────────────────────────────

function buildBIRingkasanRows(r: RingkasanBI): Record<string, unknown>[] {
  return [{
    periode:            r.periodeLabel,
    nilaiAsetTernak:    r.nilaiAsetTernak,
    jumlahTernak:       r.jumlahTernak,
    nilaiStokPakan:     r.nilaiStokPakan,
    jumlahItemPakan:    r.jumlahItemPakan,
    jumlahItemObat:     r.jumlahItemObat,
    totalPenjualan:     r.totalPenjualan,
    totalPembelian:     r.totalPembelian,
    totalPengeluaran:   r.totalPengeluaran,
    margin:             r.margin ?? '',
    estimasiNilaiUsaha: r.estimasiNilaiUsaha,
    dataLengkap:        r.dataLengkap ? 'Ya' : 'Tidak',
  }];
}

function buildBIGrafikRows(monthly: MonthlyDataPoint[]): Record<string, unknown>[] {
  return monthly.map(d => ({
    bulan:     d.label,
    penjualan: d.penjualan,
    pembelian: d.pembelian,
    margin:    d.margin,
  }));
}

function buildBIBreakdownRows(bd: ModuleBreakdown): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const push = (modul: string, kategori: string, nilai: number | string, satuan: string) =>
    rows.push({ modul, kategori, nilai, satuan });

  push('Livestock', 'Di Kandang',          bd.livestock.diKandang,          'ekor');
  push('Livestock', 'Luar Kandang',         bd.livestock.luarKandang,         'ekor');
  push('Livestock', 'Diarsipkan',           bd.livestock.arsip,               'ekor');
  push('Livestock', 'Estimasi Nilai Total', bd.livestock.estimasiNilaiTotal,  'IDR');
  for (const j of bd.livestock.jenisBreakdown) {
    push('Livestock - Jenis', j.type,              j.count,         'ekor');
    push('Livestock - Jenis', `${j.type} (Nilai)`, j.estimasiNilai, 'IDR');
  }
  push('Marketplace',     'Total Transaksi',  bd.marketplace.totalTransaksi,  '');
  push('Marketplace',     'Selesai',          bd.marketplace.selesai,          '');
  push('Marketplace',     'Aktif',            bd.marketplace.transaksiAktif,   '');
  push('Marketplace',     'Total Penjualan',  bd.marketplace.penjualan,        'IDR');
  push('Marketplace',     'Total Pembelian',  bd.marketplace.pembelian,        'IDR');
  push('Stok Pakan',      'Total Item Aktif', bd.stokPakan.totalItem,          '');
  push('Stok Pakan',      'Item dengan Harga',bd.stokPakan.itemDenganHarga,    '');
  push('Stok Pakan',      'Nilai Stok',       bd.stokPakan.nilaiTotal,         'IDR');
  push('Stok Obat',       'Total Item',       bd.stokObat.totalItem,           '');
  push('Stok Obat',       'Aktif',            bd.stokObat.aktif,               '');
  push('Pemberian Pakan', 'Total Catatan',    bd.pemberianPakan.totalEntries,  '');
  push('Pemberian Pakan', 'Total Volume',     bd.pemberianPakan.totalVolume,   'kg');
  return rows;
}

function buildBILaporanRows(laporan: LaporanBulananRow[]): Record<string, unknown>[] {
  return laporan
    .filter(r => r.penjualan > 0 || r.pembelian > 0 || r.transaksi > 0)
    .map(r => ({
      periode:   r.periode,
      penjualan: r.penjualan,
      pembelian: r.pembelian,
      margin:    r.margin,
      transaksi: r.transaksi,
    }));
}

function getBIRows(input: BIExportInput): Record<string, unknown>[] {
  switch (input.tab) {
    case 'ringkasan': return input.ringkasan ? buildBIRingkasanRows(input.ringkasan) : [];
    case 'grafik':    return input.monthly   ? buildBIGrafikRows(input.monthly)      : [];
    case 'breakdown': return input.breakdown ? buildBIBreakdownRows(input.breakdown) : [];
    case 'laporan':   return input.laporan   ? buildBILaporanRows(input.laporan)     : [];
  }
}

// ── Public download functions ──────────────────────────────────────────────────

/** Downloads Business Insight tab data as CSV (UTF-8 BOM). Returns row count. */
export function downloadBIExportCSV(input: BIExportInput): number {
  const rows     = getBIRows(input);
  const csv      = toCSV(rows);
  const filename = `business-insight-${BI_TAB_SLUG[input.tab]}-${dateSlug()}.csv`;
  downloadFile('\uFEFF' + csv, filename, 'text/csv;charset=utf-8;');
  return rows.length;
}

/** Downloads Business Insight tab data as JSON. Returns row count. */
export function downloadBIExportJSON(input: BIExportInput): number {
  const rows     = getBIRows(input);
  const payload  = {
    schema:     'ternakhub-business-insight',
    tab:        input.tab,
    exportedAt: new Date().toISOString(),
    rowCount:   rows.length,
    data:       rows,
  };
  const filename = `business-insight-${BI_TAB_SLUG[input.tab]}-${dateSlug()}.json`;
  downloadFile(JSON.stringify(payload, null, 2), filename, 'application/json');
  return rows.length;
}

/** Downloads Business Insight tab data as XLSX. Returns row count. */
export function downloadBIExportXLSX(input: BIExportInput): number {
  const rows      = getBIRows(input);
  const sheetData = rows.length ? rows : [{}];
  const ws        = XLSX.utils.json_to_sheet(sheetData);
  const wb        = XLSX.utils.book_new();
  const sheet     = input.tab.charAt(0).toUpperCase() + input.tab.slice(1);
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  const buf  = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = `business-insight-${BI_TAB_SLUG[input.tab]}-${dateSlug()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return rows.length;
}
