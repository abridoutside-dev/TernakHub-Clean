// ─── Produk Komersial — Export & Backup Data (PK-017) ────────────────────────
// Mesin export Living Database Produk Komersial untuk keperluan backup, analisis,
// audit, dan migrasi data. Export bersifat read-only — tidak pernah mengubah
// data manapun.
//
// Cakupan tugas ini adalah STRUKTUR + FILTER + LOG:
//   • Format yang didukung: xlsx, csv, json — namun generator file sesungguhnya
//     belum diimplementasikan (PK-017). Tahap berikutnya tinggal menyambungkan
//     ExportRow[] ke library SheetJS / PapaParse / JSON.stringify.
//   • Tidak ada download file, tidak ada backend — seluruh proses berjalan di
//     memori sesi (in-memory), konsisten dengan pola Living Database yang sudah ada.
//   • Export membaca data dari KONSENTRAT_SERI_LIST + KONSENTRAT_MEREK_LIST +
//     KONSENTRAT_DETAIL_LIST. Tidak menulis apapun.
//
// Filter yang tersedia:
//   • Berdasarkan Brand     (brandId UUID)
//   • Berdasarkan Kategori  (kategoriSlug)
//   • Berdasarkan Jenis Produk (label kategori)
//   • Berdasarkan Target Ternak (partial-match string)
//   • Berdasarkan Status    (Aktif | Tidak Diproduksi | Arsip | Semua)
//
// Hanya Admin yang dapat menjalankan export (assertAdmin).

import { assertAdmin, getCurrentUser, logRiwayat } from './produkKomersialLivingDB';
import { KONSENTRAT_MEREK_LIST } from './konsentratMerekData';
import { KONSENTRAT_SERI_LIST } from './konsentratSeriData';
import { KONSENTRAT_DETAIL_LIST } from './konsentratDetailData';

// ─── Format Export ────────────────────────────────────────────────────────────

/** Format berkas tujuan. Generator file sesungguhnya belum diimplementasikan (PK-017). */
export type ExportFormat = 'xlsx' | 'csv' | 'json';

export const EXPORT_FORMAT_OPTIONS: ExportFormat[] = ['xlsx', 'csv', 'json'];

// ─── Filter Export ────────────────────────────────────────────────────────────

/** Status filter untuk export — cermin dari StatusProduksi + opsi 'Semua'. */
export type ExportStatusFilter = 'Semua' | 'Aktif' | 'Tidak Diproduksi' | 'Arsip';

export const EXPORT_STATUS_FILTER_OPTIONS: ExportStatusFilter[] = [
  'Semua', 'Aktif', 'Tidak Diproduksi', 'Arsip',
];

/**
 * Filter export yang dapat dikombinasikan.
 * Semua field opsional — tidak diisi berarti tidak difilter (tampilkan semua).
 */
export interface ExportFilter {
  /**
   * UUID brand untuk mengekspor produk dari satu brand saja.
   * Dikosongkan = semua brand.
   */
  filterBrand?: string;

  /**
   * Slug kategori produk, mis. 'konsentrat'.
   * Dikosongkan = semua kategori.
   * Saat ini hanya 'konsentrat' yang memiliki Living Database penuh.
   */
  filterKategori?: string;

  /**
   * Label jenis produk, mis. 'Konsentrat'.
   * Dicocokkan secara case-insensitive terhadap field jenisProduk pada ExportRow.
   * Dikosongkan = semua jenis.
   */
  filterJenisProduk?: string;

  /**
   * Kata kunci untuk Target Ternak — dicocokkan secara partial, case-insensitive.
   * Mis. 'Sapi' akan mencocokkan 'Sapi Perah', 'Sapi Potong — Penggemukan', dsb.
   * Dikosongkan = semua target ternak.
   */
  filterTargetTernak?: string;

  /**
   * Filter status produksi.
   * 'Semua' atau dikosongkan = ekspor semua status termasuk Arsip.
   */
  filterStatus?: ExportStatusFilter;
}

// ─── Baris Export ─────────────────────────────────────────────────────────────
// Satu baris pada hasil export mewakili satu Seri Produk, diperkaya dengan
// informasi Brand (Merek) dan Detail Produk bila tersedia.
//
// Field bertipe string karena format akhir (Excel, CSV, JSON) semuanya
// merepresentasikan data sebagai teks. Field numerik nutrisi dikemas sebagai
// string JSON ringkasan agar mudah dibaca di Excel tanpa parsing ekstra.

export interface ExportRow {
  // ── Identitas ────────────────────────────────────────────────────────────────
  /** UUID seri produk (PK-000A) — identitas permanen. */
  uuid: string;

  // ── Brand ─────────────────────────────────────────────────────────────────────
  brand: string;           // merek.nama
  brandId: string;         // seri.brandId (UUID)

  // ── Produk ────────────────────────────────────────────────────────────────────
  seriNama: string;        // seri.namaSeri
  namaProduk: string;      // seri.namaProduk
  jenisProduk: string;     // label kategori, mis. 'Konsentrat'
  kategori: string;        // slug kategori, mis. 'konsentrat'

  // ── Target & Fase ─────────────────────────────────────────────────────────────
  targetTernak: string;    // seri.targetTernak
  fasePemeliharaan: string; // detail.fasePemeliharaan bila tersedia, fallback '-'

  // ── Nutrisi & Komposisi ───────────────────────────────────────────────────────
  /** Ringkasan nutrisi dalam format "PK:18%, TDN:72%, ..." bila detail tersedia. */
  nutrisi: string;
  /** Daftar bahan komposisi dalam format "Bahan A, Bahan B, ..." bila detail tersedia. */
  komposisi: string;

  // ── Kemasan & Bentuk ──────────────────────────────────────────────────────────
  kemasan: string;         // seri.beratKemasan, diperkaya detail.kemasan bila ada
  bentukProduk: string;    // seri.bentukProduk

  // ── Asal & Distribusi ─────────────────────────────────────────────────────────
  produsen: string;        // merek.produsen, diperkaya detail.produsen.nama bila ada
  distributor: string;     // detail.distributor?.map(d => d.nama).join('; ') bila ada, fallback '-'

  // ── Status & Waktu ────────────────────────────────────────────────────────────
  status: string;          // seri.statusProduksi
  tanggalDibuat: string;   // '-' (KonsentratSeri tidak menyimpan createdAt saat ini)
  tanggalDiubah: string;   // seri.updatedAt

  // ── Tambahan ──────────────────────────────────────────────────────────────────
  deskripsi: string;       // seri.deskripsi
}

// ─── Log Export ───────────────────────────────────────────────────────────────

export interface ExportLogEntry {
  /** UUID Export — identitas permanen satu sesi export. */
  exportId: string;
  /** Waktu export, ISO datetime string. */
  waktu: string;
  /** Admin yang menjalankan export (dari sesi berjalan — tidak dapat dipalsukan). */
  admin: string;
  /** Format export (xlsx / csv / json). */
  format: ExportFormat;
  /** Jumlah baris data yang diekspor. */
  jumlahData: number;
  /** Deskripsi singkat filter yang dipakai — untuk tampilan log. */
  jenisExport: string;
  /** Filter asli yang dipakai — untuk audit. */
  filter: ExportFilter;
}

/** Log Export — in-memory, bertambah selama sesi berjalan, terbaru di atas. */
export const EXPORT_LOG_PRODUK_KOMERSIAL: ExportLogEntry[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function normalize(text: string | undefined): string {
  return (text ?? '').trim().toLowerCase();
}

/** Label kategori (jenisProduk) dari slug. Saat ini hanya 'konsentrat' memiliki LDB penuh. */
function kategoriLabel(slug: string): string {
  const MAP: Record<string, string> = {
    'konsentrat':       'Konsentrat',
    'complete-feed':    'Complete Feed',
    'premix':           'Premix',
    'mineral-mix':      'Mineral Mix',
    'vitamin':          'Vitamin',
    'feed-additive':    'Feed Additive',
    'milk-replacer':    'Milk Replacer',
    'umb':              'UMB',
    'mineral-block':    'Mineral Block',
    'probiotik':        'Probiotik',
    'enzim':            'Enzim',
    'acidifier':        'Acidifier',
    'buffer':           'Buffer',
    'binder':           'Binder',
    'toxin-binder':     'Toxin Binder',
    'yeast':            'Yeast',
    'herbal-komersial': 'Herbal Komersial',
    'silase-komersial': 'Silase Komersial',
    'hay-komersial':    'Hay Komersial',
    'lainnya-komersial':'Lainnya Komersial',
  };
  return MAP[slug] ?? slug;
}

/** Ringkasan nutrisi: "PK: 18% · TDN: 72% · ME: 2.8 Mcal/kg" */
function formatNutrisi(n: import('./konsentratDetailData').NutrisiKonsentrat | undefined): string {
  if (!n) return '-';
  const parts: string[] = [];
  if (n.proteinKasar != null) parts.push(`PK: ${n.proteinKasar}%`);
  if (n.tdn != null)          parts.push(`TDN: ${n.tdn}%`);
  if (n.me != null)            parts.push(`ME: ${n.me} Mcal/kg`);
  if (n.lemakKasar != null)   parts.push(`LK: ${n.lemakKasar}%`);
  if (n.seratKasar != null)   parts.push(`SK: ${n.seratKasar}%`);
  if (n.abu != null)           parts.push(`Abu: ${n.abu}%`);
  if (n.kalsium != null)       parts.push(`Ca: ${n.kalsium}%`);
  if (n.fosfor != null)        parts.push(`P: ${n.fosfor}%`);
  if (n.kadarAir != null)      parts.push(`Air: ${n.kadarAir}%`);
  return parts.length > 0 ? parts.join(' · ') : '-';
}

/** Kemasan dari detail (lebih kaya) atau fallback ke seri.beratKemasan. */
function formatKemasan(
  seriKemasan: string,
  detailKemasan: import('./konsentratDetailData').InfoKemasan[] | undefined,
): string {
  if (detailKemasan && detailKemasan.length > 0) {
    return detailKemasan.map(k => k.keterangan ? `${k.berat} (${k.keterangan})` : k.berat).join('; ');
  }
  return seriKemasan || '-';
}

/** Deskripsi singkat filter yang dipakai — untuk log export. */
function describeFilter(filter: ExportFilter): string {
  const parts: string[] = [];
  if (filter.filterBrand) {
    const m = KONSENTRAT_MEREK_LIST.find(b => b.uuid === filter.filterBrand);
    parts.push(`Brand: ${m?.nama ?? filter.filterBrand}`);
  }
  if (filter.filterKategori) parts.push(`Kategori: ${kategoriLabel(filter.filterKategori)}`);
  if (filter.filterJenisProduk) parts.push(`Jenis: ${filter.filterJenisProduk}`);
  if (filter.filterTargetTernak) parts.push(`Target: ${filter.filterTargetTernak}`);
  const st = filter.filterStatus ?? 'Semua';
  parts.push(`Status: ${st}`);
  return parts.length > 0 ? parts.join(' · ') : 'Semua Produk';
}

// ─── Bangun Baris Export ──────────────────────────────────────────────────────

/**
 * Baca Living Database dan bangun baris export sesuai filter.
 * Murni read-only — tidak mengubah data apapun.
 * Diperkaya dengan data detail (nutrisi, komposisi, kemasan lengkap, distributor)
 * bila KonsentratDetail untuk seri tersebut tersedia.
 */
export function buildExportRows(filter: ExportFilter = {}): ExportRow[] {
  // Setiap KonsentratSeri adalah kategori 'konsentrat'.
  // Untuk kategori lain (future), tambahkan sumber data masing-masing di sini.
  const KATEGORI_SERI = 'konsentrat';

  // Filter berdasarkan kategori — semua seri saat ini adalah konsentrat.
  if (filter.filterKategori && filter.filterKategori !== KATEGORI_SERI) {
    // Kategori lain belum memiliki Living Database — kembalikan kosong.
    return [];
  }

  const rows: ExportRow[] = [];

  for (const seri of KONSENTRAT_SERI_LIST) {
    // ── Filter Brand ────────────────────────────────────────────────────────
    if (filter.filterBrand && seri.brandId !== filter.filterBrand) continue;

    // ── Filter Status ───────────────────────────────────────────────────────
    const st = filter.filterStatus ?? 'Semua';
    if (st !== 'Semua' && normalize(seri.statusProduksi) !== normalize(st)) continue;

    // ── Filter Target Ternak ────────────────────────────────────────────────
    if (filter.filterTargetTernak) {
      const kw = normalize(filter.filterTargetTernak);
      if (!normalize(seri.targetTernak).includes(kw)) continue;
    }

    // ── Lookup Brand ────────────────────────────────────────────────────────
    const merek = KONSENTRAT_MEREK_LIST.find(m => m.uuid === seri.brandId);
    const brandNama = merek?.nama ?? '(brand tidak ditemukan)';
    const produsenNama = merek?.produsen ?? '-';

    // ── Lookup Detail (opsional — tidak semua seri punya detail) ───────────
    const detail = KONSENTRAT_DETAIL_LIST.find(d => d.seriId === seri.uuid);

    // ── Jenis Produk ────────────────────────────────────────────────────────
    const jenisProduk = detail?.jenisProduk ?? kategoriLabel(KATEGORI_SERI);

    // ── Filter Jenis Produk ─────────────────────────────────────────────────
    if (filter.filterJenisProduk) {
      if (!normalize(jenisProduk).includes(normalize(filter.filterJenisProduk))) continue;
    }

    // ── Bangun Baris ────────────────────────────────────────────────────────
    rows.push({
      uuid:             seri.uuid,
      brand:            brandNama,
      brandId:          seri.brandId,
      seriNama:         seri.namaSeri,
      namaProduk:       seri.namaProduk,
      jenisProduk,
      kategori:         KATEGORI_SERI,
      targetTernak:     seri.targetTernak,
      fasePemeliharaan: detail?.fasePemeliharaan ?? '-',
      nutrisi:          formatNutrisi(detail?.nutrisi),
      komposisi:        detail?.komposisi?.join('; ') ?? '-',
      kemasan:          formatKemasan(seri.beratKemasan, detail?.kemasan),
      bentukProduk:     seri.bentukProduk,
      produsen:         detail?.produsen?.nama ?? produsenNama,
      distributor:      detail?.distributor?.map(d => d.nama).join('; ') ?? '-',
      status:           seri.statusProduksi,
      tanggalDibuat:    '-',         // KonsentratSeri tidak menyimpan createdAt saat ini
      tanggalDiubah:    seri.updatedAt,
      deskripsi:        seri.deskripsi || '-',
    });
  }

  return rows;
}

// ─── Menjalankan Export ───────────────────────────────────────────────────────

export interface ExportResult {
  /** Baris data yang diekspor — siap diserahkan ke generator file pada tahap berikutnya. */
  rows: ExportRow[];
  /** Entri log yang baru saja dibuat. */
  logEntry: ExportLogEntry;
}

/**
 * Jalankan export untuk filter dan format yang ditentukan.
 * Hanya Admin yang boleh menjalankan. Hasil dicatat ke EXPORT_LOG_PRODUK_KOMERSIAL
 * dan Riwayat Perubahan Produk Komersial.
 *
 * Tidak ada file yang benar-benar dihasilkan pada tahap ini (PK-017) — rows[]
 * yang dikembalikan siap disambungkan ke library SheetJS / PapaParse / JSON.stringify.
 */
export function runExportProdukKomersial(
  filter: ExportFilter = {},
  format: ExportFormat = 'xlsx',
): ExportResult {
  assertAdmin('menjalankan Export Produk Komersial');

  const rows = buildExportRows(filter);
  const jenisExport = describeFilter(filter);

  const logEntry: ExportLogEntry = {
    exportId:   generateUUID(),
    waktu:      new Date().toISOString(),
    admin:      getCurrentUser(),
    format,
    jumlahData: rows.length,
    jenisExport,
    filter,
  };
  EXPORT_LOG_PRODUK_KOMERSIAL.unshift(logEntry);

  logRiwayat({
    entityType:     'Export Produk Komersial',
    entityId:       logEntry.exportId,
    entityLabel:    `Export ${format.toUpperCase()} — ${jenisExport}`,
    jenisPerubahan: 'Tambah',
    catatan:        `${rows.length} produk diekspor · Format: ${format.toUpperCase()} · Filter: ${jenisExport}`,
  });

  return { rows, logEntry };
}

// ─── Query Log Export ─────────────────────────────────────────────────────────

export function getExportLog(): ExportLogEntry[] {
  return EXPORT_LOG_PRODUK_KOMERSIAL;
}

export function getExportLogById(exportId: string): ExportLogEntry | undefined {
  return EXPORT_LOG_PRODUK_KOMERSIAL.find(e => e.exportId === exportId);
}

// ─── Utilitas untuk Generator File (Tahap Berikutnya) ────────────────────────

/**
 * Daftar kolom header export — urutan ini harus dipakai oleh generator file
 * untuk memastikan konsistensi struktur antara xlsx, csv, dan json.
 */
export const EXPORT_HEADERS: (keyof ExportRow)[] = [
  'uuid', 'brand', 'brandId', 'seriNama', 'namaProduk',
  'jenisProduk', 'kategori', 'targetTernak', 'fasePemeliharaan',
  'nutrisi', 'komposisi', 'kemasan', 'bentukProduk',
  'produsen', 'distributor', 'status',
  'tanggalDibuat', 'tanggalDiubah', 'deskripsi',
];

/** Label kolom yang ramah pengguna — dipakai sebagai baris pertama file export. */
export const EXPORT_HEADER_LABELS: Record<keyof ExportRow, string> = {
  uuid:             'UUID',
  brand:            'Brand',
  brandId:          'Brand ID (UUID)',
  seriNama:         'Seri Produk',
  namaProduk:       'Nama Produk',
  jenisProduk:      'Jenis Produk',
  kategori:         'Kategori (Slug)',
  targetTernak:     'Target Ternak',
  fasePemeliharaan: 'Fase Pemeliharaan',
  nutrisi:          'Nutrisi',
  komposisi:        'Komposisi',
  kemasan:          'Kemasan',
  bentukProduk:     'Bentuk Produk',
  produsen:         'Produsen',
  distributor:      'Distributor',
  status:           'Status',
  tanggalDibuat:    'Tanggal Dibuat',
  tanggalDiubah:    'Tanggal Diubah',
  deskripsi:        'Deskripsi',
};

/**
 * Konversi ExportRow[] ke format JSON siap tulis.
 * Generator xlsx/csv tinggal memanggil EXPORT_HEADERS untuk urutan kolom.
 * (Referensi untuk generator file tahap berikutnya — bukan API final.)
 */
export function rowsToJSON(rows: ExportRow[]): string {
  return JSON.stringify(rows, null, 2);
}

/**
 * Konversi ExportRow[] ke format CSV sederhana (RFC 4180, semicolon separator).
 * Escaping dasar: field yang mengandung `;`, `"`, atau newline dibungkus tanda kutip ganda.
 * (Referensi untuk generator file tahap berikutnya — bukan API final.)
 */
export function rowsToCSV(rows: ExportRow[]): string {
  function escape(val: string): string {
    if (/[;"'\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
    return val;
  }

  const header = EXPORT_HEADERS.map(k => escape(EXPORT_HEADER_LABELS[k])).join(';');
  const body = rows.map(row =>
    EXPORT_HEADERS.map(k => escape(String(row[k] ?? ''))).join(';'),
  );
  return [header, ...body].join('\n');
}
