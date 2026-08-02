// ─── Stok Pakan — Inventaris Workspace ─────────────────────────────────────────
// Tab "Stok" pada modul Stok Pakan menampilkan pakan yang sudah dimiliki
// Workspace. Setiap item dapat berasal dari tiga sumber:
//   • Master Pakan     — bahan pakan dari database referensi
//   • Produk Komersial — produk bermerek dari katalog Produk Komersial
//   • Hasil Produksi   — pakan campuran hasil proses Produksi Formula (FP-001+)
//
// RIWAYAT: setiap perubahan stok (masuk maupun keluar) menyimpan sumbernya
// melalui StokSumber — fondasi untuk Tab Riwayat dan integrasi Formula.

// ─── Sumber Item & Sumber Perubahan ────────────────────────────────────────────

/** Jenis asal sebuah item inventaris. */
export type InventarisSumber = 'Master Pakan' | 'Produk Komersial' | 'Hasil Produksi';

/**
 * Sumber setiap perubahan stok — baik masuk maupun keluar.
 * Dipakai di StokMasukRecord, PerubahanStokRecord, dan di Tab Riwayat (FP-002+).
 *
 * Sumber penambahan stok : 'Tambah Stok' | 'Marketplace' | 'Produksi Formula'
 * Sumber pengurangan stok: 'Perubahan Stok' | 'Produksi Formula' | 'Pemberian Pakan'
 *
 * Catatan: 'Produksi Formula' muncul di keduanya — ia menambah stok hasil
 * produksi sekaligus mengurangi stok bahan baku.
 */
export type StokSumber =
  | 'Tambah Stok'       // penambahan manual via form Tambah Stok
  | 'Marketplace'       // penambahan via pembelian Marketplace
  | 'Produksi Formula'  // penambahan (hasil) atau pengurangan (bahan baku) dari proses produksi
  | 'Perubahan Stok'    // pengurangan manual via form Perubahan Stok
  | 'Pemberian Pakan'   // pengurangan via pencatatan pemberian pakan di Livestock
  | 'Penyesuaian Stok'  // penambahan via Penyesuaian Positif (SR-007)
  | 'Pindah Gudang';    // penerimaan via transfer antar gudang/lokasi (SR-007)

export type InventarisStatus = 'Normal' | 'Menipis' | 'Habis';

// ─── InventarisItem ────────────────────────────────────────────────────────────

export interface InventarisItem {
  id: string;
  nama: string;
  /** Hanya terisi untuk item bersumber Produk Komersial. */
  brand?: string;
  kategori: string;
  sumber: InventarisSumber;
  jumlahStok: number;
  satuan: string;
  status: InventarisStatus;
  terakhirDiperbarui: string;
  /** UUID (Produk Komersial) atau id (Master Pakan) referensi asal item ini. */
  referensiId?: string;
  hargaBeli?: number;
  supplier?: string;
  lokasiPenyimpanan?: string;
  tanggalMasuk?: string; // ISO date (yyyy-mm-dd)
  catatan?: string;
  /**
   * Hanya terisi untuk item bersumber 'Hasil Produksi'.
   * Dipakai oleh addInventarisFromProduksi untuk menemukan item yang sudah ada
   * sebelum membuat item baru (merge-by-formula).
   */
  formulaId?: string;
  formulaNama?: string;
  /**
   * MPK-022 — Sub-kategori item (jika ada). Opsional karena Stok Pakan saat
   * ini hanya memodelkan kategori datar (Hijauan/Serat/Mineral/Konsentrat/
   * dst) — field ini disiapkan untuk Data Stok minimal yang dibaca
   * Marketplace tanpa mengarang struktur sub-kategori yang belum ada.
   */
  subKategori?: string;
  /** Nomor batch produksi/pengiriman (LP-002, MPK-022). */
  nomorBatch?: string;
  /** Tanggal kedaluwarsa item ini (LP-002). ISO date (yyyy-mm-dd). */
  kadaluarsa?: string;
  /** MPK-022 — Nomor batch (jika ada), dibaca Marketplace sebagai bagian Data Stok minimal. */
  batch?: string;
  /**
   * MPK-022 — Status aktif item untuk kelayakan Listing Marketplace.
   * Default 'Aktif' jika tidak diisi. Belum ada UI di Stok Pakan untuk
   * mengubah status ini (di luar cakupan MPK-022) — field ini disiapkan agar
   * validasi Marketplace ("tidak boleh membuat Listing apabila status stok
   * Nonaktif") berfungsi begitu Stok Pakan menambahkan siklus ini.
   */
  statusAktif?: 'Aktif' | 'Nonaktif';
  /** MPK-022 — true jika item sudah diarsipkan di Stok Pakan (lihat catatan statusAktif). */
  diarsipkan?: boolean;
}

function hitungStatus(jumlahStok: number, ambangMenipis: number): InventarisStatus {
  if (jumlahStok <= 0) return 'Habis';
  if (jumlahStok <= ambangMenipis) return 'Menipis';
  return 'Normal';
}

const RAW_INVENTARIS: Omit<InventarisItem, 'status'>[] = [
  // referensiId WAJIB diisi untuk seluruh item bersumber Master Pakan / Produk Komersial
  // agar proses merge inventory bekerja dengan benar (BUG-007).
  //
  // Master Pakan  → id dari masterPakanData.ts (format 'mp-N')
  // Produk Komersial → uuid dari PRODUK_KOMERSIAL_LIST atau KONSENTRAT_DETAIL_UUID
  { id: 'inv-1', nama: 'Rumput Gajah',        kategori: 'Hijauan',    sumber: 'Master Pakan',     jumlahStok: 850, satuan: 'Kg', terakhirDiperbarui: '2 jam lalu',   referensiId: 'mp-1'  },
  { id: 'inv-2', nama: 'Dedak Padi',          kategori: 'Serat',      sumber: 'Master Pakan',     jumlahStok: 180, satuan: 'Kg', terakhirDiperbarui: '5 jam lalu',   referensiId: 'mp-6'  },
  { id: 'inv-3', nama: 'Jerami Kering',       kategori: 'Serat',      sumber: 'Master Pakan',     jumlahStok: 95,  satuan: 'Kg', terakhirDiperbarui: '6 jam lalu',   referensiId: 'mp-5'  },
  { id: 'inv-4', nama: 'Mineral Mix',         kategori: 'Mineral',    sumber: 'Master Pakan',     jumlahStok: 0,   satuan: 'Kg', terakhirDiperbarui: '3 hari lalu',  referensiId: 'mp-13' },
  // Produk Komersial — referensiId mengarah ke UUID resmi dari katalog Produk Komersial:
  //   inv-5: CP 144 Konsentrat Sapi Potong (KONSENTRAT_DETAIL_UUID['cp-144'])
  //   inv-6: CP 552 Konsentrat Domba Potong (KONSENTRAT_DETAIL_UUID['cp-552'])
  //   inv-7: Vitamin AD3E Medivit 1 kg (PK_BATCH1_PRODUK_LIST uuid)
  //   inv-8: Premix Ruminansia Plus Vitalindo 1 kg (PK_BATCH1_PRODUK_LIST uuid)
  { id: 'inv-5', nama: 'Konsentrat Sapi Pro', brand: 'Sinta Feed',    kategori: 'Konsentrat', sumber: 'Produk Komersial', jumlahStok: 320, satuan: 'Kg', terakhirDiperbarui: '1 hari lalu',  referensiId: '4f79c421-401d-4364-9949-3b3651121ba9' },
  { id: 'inv-6', nama: 'Konsentrat Domba Plus', brand: 'Agri Nutri', kategori: 'Konsentrat', sumber: 'Produk Komersial', jumlahStok: 40,  satuan: 'Kg', terakhirDiperbarui: '1 hari lalu',  referensiId: '54044ae2-0b78-4f5e-a4a1-c0cbbc123026' },
  { id: 'inv-7', nama: 'Vitamin A+D3',        brand: 'Medivet',       kategori: 'Vitamin',    sumber: 'Produk Komersial', jumlahStok: 45,  satuan: 'Kg', terakhirDiperbarui: '1 jam lalu',   referensiId: '00000475-0475-4475-8475-000004750475' },
  { id: 'inv-8', nama: 'Premix Ternak Sehat', brand: 'Nutrilamb',     kategori: 'Premix',     sumber: 'Produk Komersial', jumlahStok: 12,  satuan: 'Kg', terakhirDiperbarui: '4 hari lalu',  referensiId: '0deec285-0a24-43df-82b4-aa4c22159fdc' },
  { id: 'inv-9', nama: 'Ransum Sapi Laktasi', kategori: 'Hasil Produksi', sumber: 'Hasil Produksi', jumlahStok: 200, satuan: 'Kg', terakhirDiperbarui: '12 hari lalu', lokasiPenyimpanan: 'Gudang C', formulaId: 'frm-1', formulaNama: 'Ransum Sapi Laktasi' },
];

const AMBANG_MENIPIS = 100;

/** Seluruh item inventaris Workspace, live-computed status-nya dari jumlah stok. */
export function getInventarisList(): InventarisItem[] {
  return RAW_INVENTARIS.map((item) => ({
    ...item,
    status: hitungStatus(item.jumlahStok, AMBANG_MENIPIS),
    statusAktif: item.statusAktif ?? 'Aktif',
    diarsipkan: item.diarsipkan ?? false,
  }));
}

/** Satu item inventaris Workspace berdasarkan id. */
export function getInventarisById(id: string): InventarisItem | undefined {
  const raw = RAW_INVENTARIS.find((item) => item.id === id);
  if (!raw) return undefined;
  return {
    ...raw,
    status: hitungStatus(raw.jumlahStok, AMBANG_MENIPIS),
    statusAktif: raw.statusAktif ?? 'Aktif',
    diarsipkan: raw.diarsipkan ?? false,
  };
}

/** Ambang batas "stok menipis" (Kg/unit). */
export function getAmbangMenipis(): number {
  return AMBANG_MENIPIS;
}

// ─── Riwayat Stok Masuk ────────────────────────────────────────────────────────
// Setiap penambahan stok (manual, marketplace, atau hasil produksi) menghasilkan
// satu StokMasukRecord. Ini adalah fondasi untuk Tab Riwayat (FP-002+).

export interface StokMasukRecord {
  id: string;
  inventarisId: string;
  /** Sumber penambahan stok. */
  sumber: 'Tambah Stok' | 'Marketplace' | 'Produksi Formula' | 'Penyesuaian Stok' | 'Pindah Gudang';
  jumlah: number;
  satuan: string;
  tanggal: string;   // ISO date (yyyy-mm-dd)
  catatan?: string;
  stokSebelum: number;
  stokSesudah: number;
  /** Hanya terisi jika sumber === 'Produksi Formula'. */
  formulaId?: string;
  formulaNama?: string;
  /** Operator yang mencatat — tersedia untuk semua sumber (SR-002, SR-007). */
  operator?: string;
  /** Hanya terisi jika sumber === 'Marketplace' — untuk audit trail Riwayat (SR-002). */
  nomorTransaksi?: string;
  penjual?: string;
  /** Hanya terisi jika sumber === 'Marketplace' dan pesanan mencantumkan nomor batch (SR-005). */
  batch?: string;
  /** Hanya terisi jika sumber === 'Pindah Gudang' — item asal transfer (SR-007). */
  sumberInventarisId?: string;
  createdAt: string; // ISO timestamp
}

// Seed riwayat awal (SR-001) — merepresentasikan aktivitas yang sudah terjadi
// sebelum modul Riwayat dibuat, konsisten dengan jumlahStok RAW_INVENTARIS di
// atas. Setelah ini, seluruh entri baru HANYA ditambahkan lewat
// addInventarisItem / addInventarisFromProduksi / addPerubahanStok (auto-log),
// tidak ada input manual pada halaman Riwayat itu sendiri.
const RIWAYAT_MASUK: StokMasukRecord[] = [
  { id: 'masuk-seed-1', inventarisId: 'inv-1', sumber: 'Tambah Stok', jumlah: 700, satuan: 'Kg', tanggal: '2026-07-11', catatan: 'Pembelian rutin hijauan', stokSebelum: 0, stokSesudah: 700, operator: 'Budi', createdAt: '2026-07-11T08:00:00.000Z' },
  { id: 'masuk-seed-2', inventarisId: 'inv-1', sumber: 'Tambah Stok', jumlah: 250, satuan: 'Kg', tanggal: '2026-07-13', catatan: 'Pembelian rutin hijauan', stokSebelum: 650, stokSesudah: 850, operator: 'Budi', createdAt: '2026-07-13T05:00:00.000Z' },
  { id: 'masuk-seed-3', inventarisId: 'inv-2', sumber: 'Tambah Stok', jumlah: 230, satuan: 'Kg', tanggal: '2026-07-12', catatan: 'Restock dedak padi', stokSebelum: 0, stokSesudah: 230, operator: 'Sari', createdAt: '2026-07-12T09:00:00.000Z' },
  { id: 'masuk-seed-4', inventarisId: 'inv-3', sumber: 'Tambah Stok', jumlah: 110, satuan: 'Kg', tanggal: '2026-07-12', catatan: 'Restock jerami kering', stokSebelum: 0, stokSesudah: 110, operator: 'Sari', createdAt: '2026-07-12T10:00:00.000Z' },
  { id: 'masuk-seed-5', inventarisId: 'inv-4', sumber: 'Tambah Stok', jumlah: 20, satuan: 'Kg', tanggal: '2026-07-08', catatan: 'Restock mineral mix', stokSebelum: 0, stokSesudah: 20, operator: 'Admin', createdAt: '2026-07-08T09:00:00.000Z' },
  { id: 'masuk-seed-6', inventarisId: 'inv-5', sumber: 'Marketplace', jumlah: 320, satuan: 'Kg', tanggal: '2026-07-12', catatan: 'Pembelian via Marketplace — Sinta Feed', stokSebelum: 0, stokSesudah: 320, nomorTransaksi: 'TRX-20260712-045', penjual: 'Sinta Feed', createdAt: '2026-07-12T06:00:00.000Z' },
  { id: 'masuk-seed-7', inventarisId: 'inv-6', sumber: 'Tambah Stok', jumlah: 120, satuan: 'Kg', tanggal: '2026-07-10', catatan: 'Restock konsentrat domba', stokSebelum: 0, stokSesudah: 120, operator: 'Budi', createdAt: '2026-07-10T09:00:00.000Z' },
  { id: 'masuk-seed-8', inventarisId: 'inv-7', sumber: 'Tambah Stok', jumlah: 50, satuan: 'Kg', tanggal: '2026-07-12', catatan: 'Restock vitamin', stokSebelum: 0, stokSesudah: 50, operator: 'Admin', createdAt: '2026-07-12T07:00:00.000Z' },
  { id: 'masuk-seed-9', inventarisId: 'inv-8', sumber: 'Tambah Stok', jumlah: 30, satuan: 'Kg', tanggal: '2026-07-08', catatan: 'Restock premix', stokSebelum: 0, stokSesudah: 30, operator: 'Sari', createdAt: '2026-07-08T08:00:00.000Z' },
  { id: 'masuk-seed-10', inventarisId: 'inv-9', sumber: 'Produksi Formula', jumlah: 200, satuan: 'Kg', tanggal: '2026-07-01', catatan: 'Hasil produksi formula "Ransum Sapi Laktasi" (Batch BATCH-20260701-001)', stokSebelum: 0, stokSesudah: 200, formulaId: 'frm-1', formulaNama: 'Ransum Sapi Laktasi', createdAt: '2026-07-01T08:30:00.000Z' },
  // SR-007 seed — Penyesuaian Positif
  { id: 'masuk-seed-11', inventarisId: 'inv-3', sumber: 'Penyesuaian Stok', jumlah: 10, satuan: 'Kg', tanggal: '2026-07-10', catatan: 'Penyesuaian positif setelah ditemukan stok tambahan di sudut gudang', stokSebelum: 95, stokSesudah: 105, operator: 'Sari', createdAt: '2026-07-10T10:00:00.000Z' },
  // SR-007 seed — Pindah Gudang (penerimaan di tujuan)
  { id: 'masuk-seed-12', inventarisId: 'inv-9', sumber: 'Pindah Gudang', jumlah: 20, satuan: 'Kg', tanggal: '2026-07-11', catatan: 'Penerimaan dari transfer Gudang Utama — Konsentrat Sapi Pro', stokSebelum: 200, stokSesudah: 220, operator: 'Budi', sumberInventarisId: 'inv-5', createdAt: '2026-07-11T11:05:00.000Z' },
];

/** Seluruh riwayat stok masuk untuk satu item inventaris, terbaru di atas. */
export function getMasukByInventarisId(inventarisId: string): StokMasukRecord[] {
  return RIWAYAT_MASUK
    .filter((r) => r.inventarisId === inventarisId)
    .slice()
    .reverse();
}

/** Seluruh riwayat stok masuk tanpa filter, terbaru di atas (untuk Tab Riwayat). */
export function getAllRiwayatMasuk(): StokMasukRecord[] {
  return RIWAYAT_MASUK.slice().reverse();
}

// ─── Tambah Stok (SP-003) ──────────────────────────────────────────────────────
// Menambahkan inventaris baru ke Workspace. Referensi WAJIB berasal dari Master
// Pakan, Produk Komersial, atau Hasil Produksi. Tidak ada input nama bebas.

export interface AddInventarisInput {
  referensiId: string;
  nama: string;
  brand?: string;
  kategori: string;
  sumber: InventarisSumber;
  jumlahStok: number;
  satuan: string;
  hargaBeli?: number;
  supplier?: string;
  lokasiPenyimpanan?: string;
  tanggalMasuk: string; // ISO date (yyyy-mm-dd)
  catatan?: string;
  /**
   * Sumber penambahan stok — default 'Tambah Stok' jika tidak diisi.
   * Gunakan 'Produksi Formula' saat dipanggil dari addInventarisFromProduksi.
   */
  sumberMasuk?: 'Tambah Stok' | 'Marketplace' | 'Produksi Formula';
  /** Hanya relevan jika sumberMasuk === 'Produksi Formula'. */
  formulaId?: string;
  formulaNama?: string;
  /** Hanya relevan jika sumberMasuk === 'Marketplace' — untuk audit trail Riwayat (SR-005). */
  nomorTransaksi?: string;
  penjual?: string;
  batch?: string;
}

function formatTanggalMasuk(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Baru saja';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Menambahkan satu item inventaris baru ke Workspace dan mengembalikannya (dengan status ter-hitung). */
export function addInventarisItem(input: AddInventarisInput): InventarisItem {
  const raw: Omit<InventarisItem, 'status'> = {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nama: input.nama,
    brand: input.brand,
    kategori: input.kategori,
    sumber: input.sumber,
    jumlahStok: input.jumlahStok,
    satuan: input.satuan,
    terakhirDiperbarui: formatTanggalMasuk(input.tanggalMasuk),
    referensiId: input.referensiId,
    hargaBeli: input.hargaBeli,
    supplier: input.supplier,
    lokasiPenyimpanan: input.lokasiPenyimpanan,
    tanggalMasuk: input.tanggalMasuk,
    catatan: input.catatan,
    formulaId: input.formulaId,
    formulaNama: input.formulaNama,
  };
  RAW_INVENTARIS.push(raw);

  // Catat riwayat masuk
  const masukRecord: StokMasukRecord = {
    id: `masuk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    inventarisId: raw.id,
    sumber: input.sumberMasuk ?? 'Tambah Stok',
    jumlah: input.jumlahStok,
    satuan: input.satuan,
    tanggal: input.tanggalMasuk,
    catatan: input.catatan,
    stokSebelum: 0,
    stokSesudah: input.jumlahStok,
    formulaId: input.formulaId,
    formulaNama: input.formulaNama,
    nomorTransaksi: input.nomorTransaksi,
    penjual: input.penjual,
    batch: input.batch,
    createdAt: new Date().toISOString(),
  };
  RIWAYAT_MASUK.push(masukRecord);

  return { ...raw, status: hitungStatus(raw.jumlahStok, AMBANG_MENIPIS) };
}

// ─── Tambah Stok dari Catalog Picker (SP-003 — merge-aware) ──────────────────
// Dipanggil dari TambahStokPakan.tsx saat pengguna menambah stok via
// Catalog Picker (Master Pakan atau Produk Komersial).
//
// Aturan merge (BUG-007):
//   • Jika sudah ada item inventaris dengan sumber & referensiId yang sama
//     → tambah jumlah ke jumlahStok item yang ada (merge).
//   • Jika belum ada → buat item inventaris baru via addInventarisItem.
//
// Ini mencegah terbentuknya item duplikat ketika pengguna memilih bahan
// yang sama dari katalog lebih dari satu kali.

export interface AddTambahStokInput {
  referensiId: string;
  nama: string;
  brand?: string;
  kategori: string;
  sumber: InventarisSumber;
  jumlahStok: number;
  satuan: string;
  hargaBeli?: number;
  supplier?: string;
  lokasiPenyimpanan?: string;
  tanggalMasuk: string; // ISO date (yyyy-mm-dd)
  catatan?: string;
}

/**
 * Menambahkan stok dari Catalog Picker ke dalam inventaris.
 *
 * - Mencari item yang sudah ada berdasarkan (sumber, referensiId).
 *   → Jika ditemukan: tambahkan jumlahStok ke item yang ada (merge).
 *   → Jika tidak ditemukan: buat item inventaris baru.
 *
 * Selalu mencatat StokMasukRecord dengan sumber 'Tambah Stok'.
 */
export function addInventarisFromTambahStok(input: AddTambahStokInput): InventarisItem {
  const existing = RAW_INVENTARIS.find(
    (item) => item.sumber === input.sumber && item.referensiId === input.referensiId,
  );

  if (existing) {
    // Merge: tambah stok pada item yang sudah ada
    const stokSebelum = existing.jumlahStok;
    existing.jumlahStok += input.jumlahStok;
    existing.terakhirDiperbarui = formatTanggalMasuk(input.tanggalMasuk);
    if (input.hargaBeli !== undefined) existing.hargaBeli = input.hargaBeli;
    if (input.supplier)          existing.supplier = input.supplier;
    if (input.tanggalMasuk)      existing.tanggalMasuk = input.tanggalMasuk;
    if (input.lokasiPenyimpanan) existing.lokasiPenyimpanan = input.lokasiPenyimpanan;

    const masukRecord: StokMasukRecord = {
      id: `masuk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      inventarisId: existing.id,
      sumber: 'Tambah Stok',
      jumlah: input.jumlahStok,
      satuan: input.satuan,
      tanggal: input.tanggalMasuk,
      catatan: input.catatan,
      stokSebelum,
      stokSesudah: existing.jumlahStok,
      createdAt: new Date().toISOString(),
    };
    RIWAYAT_MASUK.push(masukRecord);

    return { ...existing, status: hitungStatus(existing.jumlahStok, AMBANG_MENIPIS) };
  }

  // Buat item baru
  return addInventarisItem({
    referensiId: input.referensiId,
    nama: input.nama,
    brand: input.brand,
    kategori: input.kategori,
    sumber: input.sumber,
    jumlahStok: input.jumlahStok,
    satuan: input.satuan,
    hargaBeli: input.hargaBeli,
    supplier: input.supplier,
    lokasiPenyimpanan: input.lokasiPenyimpanan,
    tanggalMasuk: input.tanggalMasuk,
    catatan: input.catatan,
    sumberMasuk: 'Tambah Stok',
  });
}

// ─── Penerimaan Barang Marketplace (SR-005) ───────────────────────────────────
// Dipanggil saat pesanan Marketplace (src/data/marketplacePesananData.ts) diterima.
// Referensi produk WAJIB berasal dari Master Pakan atau Produk Komersial — tidak
// ada item bebas. Mengikuti pola merge-by-reference yang sama dengan
// addInventarisFromProduksi: jika Workspace sudah punya item dengan referensiId
// & sumber yang sama, stok digabung; jika belum, item inventaris baru dibuat.

export interface AddMarketplaceInput {
  referensiId: string;
  nama: string;
  brand?: string;
  kategori: string;
  sumber: 'Master Pakan' | 'Produk Komersial';
  jumlah: number;
  satuan: string;
  hargaBeli: number;
  supplier: string;
  tanggalMasuk: string; // ISO date (yyyy-mm-dd)
  batch?: string;
  lokasiPenyimpanan?: string;
  catatan?: string;
  /** Nomor order Marketplace — dipakai sebagai nomorTransaksi pada audit trail Riwayat. */
  nomorTransaksi: string;
}

/**
 * Memproses penerimaan barang dari Marketplace ke dalam inventaris Stok Pakan.
 *
 * - Mencari item yang sudah ada berdasarkan (sumber, referensiId).
 *   → Jika ditemukan: tambahkan jumlah ke jumlahStok (merge).
 *   → Jika tidak ditemukan: buat item inventaris baru.
 *
 * Selalu mencatat StokMasukRecord dengan sumber 'Marketplace', sehingga Riwayat
 * dan AI Insight otomatis membaca transaksi ini sebagai stok masuk.
 */
export function addInventarisFromMarketplace(input: AddMarketplaceInput): InventarisItem {
  const existing = RAW_INVENTARIS.find(
    (item) => item.sumber === input.sumber && item.referensiId === input.referensiId,
  );

  if (existing) {
    const stokSebelum = existing.jumlahStok;
    existing.jumlahStok += input.jumlah;
    existing.terakhirDiperbarui = formatTanggalMasuk(input.tanggalMasuk);
    existing.hargaBeli = input.hargaBeli;
    existing.supplier = input.supplier;
    existing.tanggalMasuk = input.tanggalMasuk;
    if (input.lokasiPenyimpanan) existing.lokasiPenyimpanan = input.lokasiPenyimpanan;

    const masukRecord: StokMasukRecord = {
      id: `masuk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      inventarisId: existing.id,
      sumber: 'Marketplace',
      jumlah: input.jumlah,
      satuan: input.satuan,
      tanggal: input.tanggalMasuk,
      catatan: input.catatan,
      stokSebelum,
      stokSesudah: existing.jumlahStok,
      nomorTransaksi: input.nomorTransaksi,
      penjual: input.supplier,
      batch: input.batch,
      createdAt: new Date().toISOString(),
    };
    RIWAYAT_MASUK.push(masukRecord);

    return { ...existing, status: hitungStatus(existing.jumlahStok, AMBANG_MENIPIS) };
  }

  return addInventarisItem({
    referensiId: input.referensiId,
    nama: input.nama,
    brand: input.brand,
    kategori: input.kategori,
    sumber: input.sumber,
    jumlahStok: input.jumlah,
    satuan: input.satuan,
    hargaBeli: input.hargaBeli,
    supplier: input.supplier,
    lokasiPenyimpanan: input.lokasiPenyimpanan,
    tanggalMasuk: input.tanggalMasuk,
    catatan: input.catatan,
    sumberMasuk: 'Marketplace',
    nomorTransaksi: input.nomorTransaksi,
    penjual: input.supplier,
    batch: input.batch,
  });
}

// ─── Persiapan Produksi Formula (FP-000) ──────────────────────────────────────
// Fondasi untuk integrasi dengan proses Produksi Formula (FP-001+).
// Aturan:
//   • Jika sudah ada item inventaris dengan formulaId yang sama → tambah jumlah stok.
//   • Jika belum ada → buat item inventaris baru dengan sumber 'Hasil Produksi'.
//
// Fungsi ini belum dipanggil dari UI mana pun — disiapkan agar FP-001 dapat
// langsung menggunakannya tanpa mengubah arsitektur data.

export interface AddProduksiInput {
  /** ID formula yang menghasilkan pakan ini (dari modul Formula, FP-001+). */
  formulaId: string;
  /** Nama formula untuk label dan riwayat. */
  formulaNama: string;
  /** Nama pakan hasil produksi (biasanya = nama formula). */
  nama: string;
  kategori: string;
  jumlahHasil: number;
  satuan: string;
  tanggalProduksi: string; // ISO date (yyyy-mm-dd)
  catatan?: string;
}

/**
 * Memproses hasil Produksi Formula ke dalam inventaris.
 *
 * - Mencari item yang sudah ada berdasarkan formulaId.
 *   → Jika ditemukan: tambahkan jumlahHasil ke jumlahStok.
 *   → Jika tidak ditemukan: buat item inventaris baru (sumber = 'Hasil Produksi').
 *
 * Selalu mencatat StokMasukRecord dengan sumber 'Produksi Formula'.
 * Belum dipanggil dari UI — siap untuk FP-001.
 */
export function addInventarisFromProduksi(input: AddProduksiInput): InventarisItem {
  const existing = RAW_INVENTARIS.find((item) => item.formulaId === input.formulaId);

  if (existing) {
    // Merge: tambah stok pada item yang sudah ada
    const stokSebelum = existing.jumlahStok;
    existing.jumlahStok += input.jumlahHasil;
    existing.terakhirDiperbarui = formatTanggalMasuk(input.tanggalProduksi);

    const masukRecord: StokMasukRecord = {
      id: `masuk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      inventarisId: existing.id,
      sumber: 'Produksi Formula',
      jumlah: input.jumlahHasil,
      satuan: input.satuan,
      tanggal: input.tanggalProduksi,
      catatan: input.catatan,
      stokSebelum,
      stokSesudah: existing.jumlahStok,
      formulaId: input.formulaId,
      formulaNama: input.formulaNama,
      createdAt: new Date().toISOString(),
    };
    RIWAYAT_MASUK.push(masukRecord);

    return { ...existing, status: hitungStatus(existing.jumlahStok, AMBANG_MENIPIS) };
  }

  // Buat item baru dengan sumber 'Hasil Produksi'
  return addInventarisItem({
    referensiId: input.formulaId,
    nama: input.nama,
    kategori: input.kategori,
    sumber: 'Hasil Produksi',
    jumlahStok: input.jumlahHasil,
    satuan: input.satuan,
    tanggalMasuk: input.tanggalProduksi,
    catatan: input.catatan,
    sumberMasuk: 'Produksi Formula',
    formulaId: input.formulaId,
    formulaNama: input.formulaNama,
  });
}

// ─── Perubahan Stok (SP-005) ──────────────────────────────────────────────────
// Semua pengurangan stok diproses melalui addPerubahanStok. Tidak ada kode lain
// yang boleh memanipulasi jumlahStok RAW_INVENTARIS secara langsung selain
// fungsi ini dan addInventarisItem/addInventarisFromProduksi.

export type PerubahanStokJenis =
  // Penyesuaian negatif (kurangi stok)
  | 'Koreksi Stok'
  | 'Penyesuaian Awal'
  | 'Penyesuaian Negatif'
  // Kerugian
  | 'Rusak'
  | 'Busuk'
  | 'Berjamur'
  | 'Kedaluwarsa'
  | 'Tumpah'
  | 'Dimakan Hama'
  | 'Hilang'
  // Pengeluaran
  | 'Dijual'
  | 'Donasi'
  | 'Pindah Gudang'
  | 'Dipindahkan ke Peternakan Lain'
  | 'Dipakai selain untuk ternak'
  | 'Lainnya'
  | 'Pemberian Pakan';

/** Semua jenis perubahan yang MENGURANGI stok. Penyesuaian Positif ditangani lewat addPenyesuaianPositif(). */
export const PERUBAHAN_STOK_JENIS_LIST: PerubahanStokJenis[] = [
  'Penyesuaian Negatif',
  'Koreksi Stok',
  'Penyesuaian Awal',
  'Rusak',
  'Busuk',
  'Berjamur',
  'Kedaluwarsa',
  'Tumpah',
  'Dimakan Hama',
  'Hilang',
  'Dijual',
  'Donasi',
  'Pindah Gudang',
  'Dipindahkan ke Peternakan Lain',
  'Dipakai selain untuk ternak',
  'Lainnya',
];

export interface PerubahanStokRecord {
  id: string;
  inventarisId: string;
  jenis: PerubahanStokJenis;
  /** Selalu positif — jumlah yang dikurangkan dari stok. */
  jumlah: number;
  satuan: string;
  tanggal: string;   // ISO date (yyyy-mm-dd)
  catatan?: string;
  stokSebelum: number;
  stokSesudah: number;
  /**
   * Sumber pengurangan stok.
   * Default 'Perubahan Stok' untuk entri manual via form Perubahan Stok.
   * Gunakan 'Produksi Formula' saat bahan baku dikurangi oleh proses produksi (FP-001+).
   * Gunakan 'Pemberian Pakan' saat stok dikurangi via pencatatan pakan Livestock (SR-006+).
   * Gunakan 'Pindah Gudang' saat stok dipindahkan antar gudang (SR-007+).
   */
  sumberPerubahan: StokSumber;
  /** Operator yang mencatat perubahan — tersedia untuk semua jenis perubahan (SR-007). */
  operator?: string;
  /** Hanya terisi jika sumberPerubahan === 'Produksi Formula'. */
  formulaId?: string;
  formulaNama?: string;
  /** Hanya terisi jika sumberPerubahan === 'Pemberian Pakan'. */
  namaTernak?: string;
  grupTernak?: string;
  catatanPemberian?: string;
  /** Lokasi asal item pada saat perubahan dicatat (SR-007). */
  lokasiAsal?: string;
  /** Lokasi tujuan — hanya untuk jenis 'Pindah Gudang' dan 'Dipindahkan ke Peternakan Lain' (SR-007). */
  lokasiTujuan?: string;
  createdAt: string; // ISO timestamp
}

export interface AddPerubahanStokInput {
  inventarisId: string;
  jenis: PerubahanStokJenis;
  jumlah: number;
  satuan: string;
  tanggal: string; // ISO date (yyyy-mm-dd)
  catatan?: string;
  /**
   * Sumber pengurangan — default 'Perubahan Stok' jika tidak diisi.
   * Modul Produksi Formula harus mengisi 'Produksi Formula'.
   * Modul Pemberian Pakan harus mengisi 'Pemberian Pakan'.
   * Modul Pindah Gudang harus mengisi 'Pindah Gudang'.
   */
  sumberPerubahan?: StokSumber;
  /** Hanya relevan jika sumberPerubahan === 'Pemberian Pakan' (SR-006). */
  namaTernak?: string;
  grupTernak?: string;
  catatanPemberian?: string;
  livestockId?: string;
  /** Operator yang mencatat perubahan — tersedia untuk semua jenis (SR-007). */
  operator?: string;
  /** Lokasi tujuan — untuk jenis 'Pindah Gudang' dan 'Dipindahkan ke Peternakan Lain' (SR-007). */
  lokasiTujuan?: string;
  /**
   * ID inventaris tujuan — hanya untuk jenis 'Pindah Gudang'.
   * Jika diisi, addPerubahanStok secara otomatis menambah stok ke item tujuan
   * dan mencatat StokMasukRecord dengan sumber 'Pindah Gudang' (SR-007).
   */
  inventarisTujuanId?: string;
  /** Modul pemanggil — untuk audit trail LP-003 (mis. 'Pemberian Pakan'). */
  sumberModul?: string;
  /** Alasan pengurangan — untuk audit trail LP-003. */
  alasan?: string;
  /** ID record Pemberian Pakan — untuk traceability LP-003. */
  pemberianPakanId?: string;
}

// ─── Penyesuaian Positif (SR-007) ─────────────────────────────────────────────
// Menambah stok via form Perubahan Stok (mode "Tambah").
// Diperlakukan sebagai StokMasukRecord dengan sumber 'Penyesuaian Stok'.

export interface AddPenyesuaianPositifInput {
  inventarisId: string;
  jumlah: number;
  satuan: string;
  tanggal: string; // ISO date (yyyy-mm-dd)
  catatan?: string;
  operator?: string;
}

/**
 * Menambahkan stok via Penyesuaian Positif dan mencatat StokMasukRecord.
 * Melempar Error jika validasi gagal.
 */
export function addPenyesuaianPositif(input: AddPenyesuaianPositifInput): StokMasukRecord {
  const raw = RAW_INVENTARIS.find((item) => item.id === input.inventarisId);
  if (!raw) throw new Error(`Item inventaris tidak ditemukan: ${input.inventarisId}`);
  if (input.jumlah <= 0) throw new Error('Jumlah harus lebih dari nol.');

  const stokSebelum = raw.jumlahStok;
  raw.jumlahStok += input.jumlah;
  raw.terakhirDiperbarui = formatTanggalMasuk(input.tanggal);

  const record: StokMasukRecord = {
    id: `masuk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    inventarisId: input.inventarisId,
    sumber: 'Penyesuaian Stok',
    jumlah: input.jumlah,
    satuan: input.satuan,
    tanggal: input.tanggal,
    catatan: input.catatan,
    stokSebelum,
    stokSesudah: raw.jumlahStok,
    operator: input.operator,
    createdAt: new Date().toISOString(),
  };
  RIWAYAT_MASUK.push(record);
  return record;
}

// Seed riwayat awal (SR-001, SR-007) — lihat catatan di RIWAYAT_MASUK di atas.
const RIWAYAT_PERUBAHAN: PerubahanStokRecord[] = [
  { id: 'perubahan-seed-1', inventarisId: 'inv-1', jenis: 'Dipindahkan ke Peternakan Lain', jumlah: 50, satuan: 'Kg', tanggal: '2026-07-12', catatan: 'Dipindahkan ke peternakan mitra sesuai kesepakatan bagi hasil', stokSebelum: 700, stokSesudah: 650, sumberPerubahan: 'Perubahan Stok', operator: 'Budi', lokasiAsal: 'Gudang A', lokasiTujuan: 'Peternakan Mitra Jaya', createdAt: '2026-07-12T08:00:00.000Z' },
  { id: 'perubahan-seed-2', inventarisId: 'inv-2', jenis: 'Lainnya', jumlah: 50, satuan: 'Kg', tanggal: '2026-07-13', catatan: 'Dipakai sebagai bahan baku produksi formula "Ransum Sapi Laktasi"', stokSebelum: 230, stokSesudah: 180, sumberPerubahan: 'Produksi Formula', formulaId: 'frm-1', formulaNama: 'Ransum Sapi Laktasi', createdAt: '2026-07-13T02:00:00.000Z' },
  { id: 'perubahan-seed-3', inventarisId: 'inv-3', jenis: 'Hilang', jumlah: 15, satuan: 'Kg', tanggal: '2026-07-13', catatan: 'Tidak ditemukan saat stok fisik dicek', stokSebelum: 110, stokSesudah: 95, sumberPerubahan: 'Perubahan Stok', operator: 'Sari', lokasiAsal: 'Gudang B', createdAt: '2026-07-13T01:00:00.000Z' },
  { id: 'perubahan-seed-4', inventarisId: 'inv-4', jenis: 'Kedaluwarsa', jumlah: 20, satuan: 'Kg', tanggal: '2026-07-10', catatan: 'Kedaluwarsa, dibuang sesuai SOP', stokSebelum: 20, stokSesudah: 0, sumberPerubahan: 'Perubahan Stok', operator: 'Admin', createdAt: '2026-07-10T09:00:00.000Z' },
  { id: 'perubahan-seed-5', inventarisId: 'inv-6', jenis: 'Dijual', jumlah: 80, satuan: 'Kg', tanggal: '2026-07-12', catatan: 'Dijual ke peternak mitra', stokSebelum: 120, stokSesudah: 40, sumberPerubahan: 'Perubahan Stok', operator: 'Budi', createdAt: '2026-07-12T10:00:00.000Z' },
  { id: 'perubahan-seed-6', inventarisId: 'inv-7', jenis: 'Koreksi Stok', jumlah: 5, satuan: 'Kg', tanggal: '2026-07-13', catatan: 'Penyesuaian setelah stock count fisik', stokSebelum: 50, stokSesudah: 45, sumberPerubahan: 'Perubahan Stok', operator: 'Admin', createdAt: '2026-07-13T06:00:00.000Z' },
  { id: 'perubahan-seed-7', inventarisId: 'inv-8', jenis: 'Rusak', jumlah: 18, satuan: 'Kg', tanggal: '2026-07-09', catatan: 'Kemasan rusak akibat kebocoran atap gudang', stokSebelum: 30, stokSesudah: 12, sumberPerubahan: 'Perubahan Stok', operator: 'Sari', lokasiAsal: 'Gudang B', createdAt: '2026-07-09T09:00:00.000Z' },
  // SR-007 seed — memperlihatkan jenis baru di Riwayat
  { id: 'perubahan-seed-8', inventarisId: 'inv-1', jenis: 'Donasi', jumlah: 30, satuan: 'Kg', tanggal: '2026-07-11', catatan: 'Donasi ke komunitas peternak sekitar desa', stokSebelum: 650, stokSesudah: 620, sumberPerubahan: 'Perubahan Stok', operator: 'Admin', lokasiAsal: 'Gudang A', createdAt: '2026-07-11T10:00:00.000Z' },
  { id: 'perubahan-seed-9', inventarisId: 'inv-5', jenis: 'Pindah Gudang', jumlah: 20, satuan: 'Kg', tanggal: '2026-07-11', catatan: 'Dipindahkan dari Gudang Utama ke Gudang C untuk stok cadangan', stokSebelum: 340, stokSesudah: 320, sumberPerubahan: 'Pindah Gudang', operator: 'Budi', lokasiAsal: 'Gudang Utama', lokasiTujuan: 'Gudang C', createdAt: '2026-07-11T11:00:00.000Z' },
  { id: 'perubahan-seed-10', inventarisId: 'inv-2', jenis: 'Penyesuaian Negatif', jumlah: 3, satuan: 'Kg', tanggal: '2026-07-10', catatan: 'Koreksi selisih timbangan setelah opname', stokSebelum: 183, stokSesudah: 180, sumberPerubahan: 'Perubahan Stok', operator: 'Admin', createdAt: '2026-07-10T08:00:00.000Z' },
];

/** Seluruh riwayat perubahan untuk satu item inventaris, terbaru di atas. */
export function getPerubahanByInventarisId(inventarisId: string): PerubahanStokRecord[] {
  return RIWAYAT_PERUBAHAN
    .filter((r) => r.inventarisId === inventarisId)
    .slice()
    .reverse();
}

/** Seluruh riwayat perubahan tanpa filter, terbaru di atas (untuk Tab Riwayat). */
export function getAllRiwayatPerubahan(): PerubahanStokRecord[] {
  return RIWAYAT_PERUBAHAN.slice().reverse();
}

/**
 * Mengurangkan stok item dan menyimpan riwayat perubahan.
 *
 * Untuk jenis 'Pindah Gudang' dengan inventarisTujuanId:
 *   → Mengurangi stok item asal DAN menambah stok item tujuan secara atomik.
 *   → Mencatat PerubahanStokRecord untuk item asal (keluar).
 *   → Mencatat StokMasukRecord untuk item tujuan (masuk).
 *
 * Melempar Error jika validasi gagal.
 */
export function addPerubahanStok(input: AddPerubahanStokInput): PerubahanStokRecord {
  const raw = RAW_INVENTARIS.find((item) => item.id === input.inventarisId);
  if (!raw) throw new Error(`Item inventaris tidak ditemukan: ${input.inventarisId}`);
  if (input.jumlah <= 0) throw new Error('Jumlah harus lebih dari nol.');
  if (raw.jumlahStok - input.jumlah < 0) {
    throw new Error(
      `Stok tidak mencukupi. Stok saat ini: ${raw.jumlahStok} ${raw.satuan}.`,
    );
  }

  const stokSebelum = raw.jumlahStok;
  const stokSesudah = raw.jumlahStok - input.jumlah;
  const lokasiAsal = raw.lokasiPenyimpanan;

  // Mutasi in-memory (sumber)
  raw.jumlahStok = stokSesudah;
  raw.terakhirDiperbarui = formatTanggalMasuk(input.tanggal);

  const sumberPerubahan: StokSumber =
    input.sumberPerubahan ?? (input.jenis === 'Pindah Gudang' ? 'Pindah Gudang' : 'Perubahan Stok');

  const record: PerubahanStokRecord = {
    id: `perubahan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    inventarisId: input.inventarisId,
    jenis: input.jenis,
    jumlah: input.jumlah,
    satuan: input.satuan,
    tanggal: input.tanggal,
    catatan: input.catatan,
    stokSebelum,
    stokSesudah,
    sumberPerubahan,
    operator: input.operator,
    namaTernak: input.namaTernak,
    grupTernak: input.grupTernak,
    catatanPemberian: input.catatanPemberian,
    lokasiAsal,
    lokasiTujuan: input.lokasiTujuan,
    createdAt: new Date().toISOString(),
  };
  RIWAYAT_PERUBAHAN.push(record);

  // Pindah Gudang: tambah stok ke item tujuan dan catat masuk
  if (input.jenis === 'Pindah Gudang' && input.inventarisTujuanId) {
    const rawTujuan = RAW_INVENTARIS.find((item) => item.id === input.inventarisTujuanId);
    if (rawTujuan) {
      const stokTujuanSebelum = rawTujuan.jumlahStok;
      rawTujuan.jumlahStok += input.jumlah;
      rawTujuan.terakhirDiperbarui = formatTanggalMasuk(input.tanggal);

      const masukTujuan: StokMasukRecord = {
        id: `masuk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        inventarisId: rawTujuan.id,
        sumber: 'Pindah Gudang',
        jumlah: input.jumlah,
        satuan: input.satuan,
        tanggal: input.tanggal,
        catatan: input.catatan
          ? `Penerimaan dari transfer: ${input.catatan}`
          : `Penerimaan transfer dari ${raw.nama} (${lokasiAsal ?? 'lokasi asal'})`,
        stokSebelum: stokTujuanSebelum,
        stokSesudah: rawTujuan.jumlahStok,
        operator: input.operator,
        sumberInventarisId: input.inventarisId,
        createdAt: new Date(Date.now() + 1).toISOString(), // 1ms setelah keluar agar urutan riwayat benar
      };
      RIWAYAT_MASUK.push(masukTujuan);
    }
  }

  return record;
}

/**
 * Replaces the in-memory RAW_INVENTARIS with rows fetched from Supabase.
 * Called by useStokInventaris() on workspace change or refresh.
 * If rows array is empty, existing seed data is kept intact.
 *
 * After this call all in-memory item IDs become Supabase UUIDs —
 * stokInventarisService.ts can then use those IDs for direct lookups.
 */
export function populateInventarisFromDb(
  rows: Omit<InventarisItem, 'status'>[],
): void {
  if (rows.length === 0) return;
  RAW_INVENTARIS.splice(0, RAW_INVENTARIS.length, ...rows);
}

// ─── Transactions read-path helpers (FLOW-003M19) ─────────────────────────────

/** Minimal subset of StokTransactionDbRow — avoids importing from types/stokInventaris.ts */
interface TransactionDbRow {
  id: string;
  stok_id: string;
  transaction_type: 'Masuk' | 'Keluar' | 'Penyesuaian';
  quantity_delta: number;
  quantity_before: number | null;
  quantity_after: number | null;
  reason: string | null;
  transaction_date: string;
  created_at: string;
}

function deriveMasukSumber(reason: string | null): StokMasukRecord['sumber'] {
  if (!reason) return 'Tambah Stok';
  const r = reason.toLowerCase();
  if (r.includes('marketplace'))                                  return 'Marketplace';
  if (r.includes('penyesuaian positif') || r.includes('penyesuaian stok')) return 'Penyesuaian Stok';
  if (r.includes('pindah gudang') || r.includes('penerimaan'))   return 'Pindah Gudang';
  if (r.includes('produksi') || r.includes('formula'))           return 'Produksi Formula';
  return 'Tambah Stok';
}

function deriveKeluar(reason: string | null): { sumberPerubahan: StokSumber; jenis: PerubahanStokJenis } {
  if (!reason) return { sumberPerubahan: 'Perubahan Stok', jenis: 'Lainnya' };
  const r = reason.toLowerCase();
  if (r.includes('pemberian pakan'))                                             return { sumberPerubahan: 'Pemberian Pakan', jenis: 'Lainnya' };
  if (r.includes('pindah gudang'))                                               return { sumberPerubahan: 'Pindah Gudang', jenis: 'Pindah Gudang' };
  if (r.includes('produksi formula') || r.includes('bahan baku'))               return { sumberPerubahan: 'Produksi Formula', jenis: 'Lainnya' };
  if (r.includes('penyesuaian negatif'))                                         return { sumberPerubahan: 'Perubahan Stok', jenis: 'Penyesuaian Negatif' };
  if (r.includes('koreksi stok') || r.includes('koreksi'))                      return { sumberPerubahan: 'Perubahan Stok', jenis: 'Koreksi Stok' };
  if (r.includes('rusak') || r.includes('busuk') || r.includes('berjamur') || r.includes('tumpah')) return { sumberPerubahan: 'Perubahan Stok', jenis: 'Rusak' };
  if (r.includes('hilang'))                                                      return { sumberPerubahan: 'Perubahan Stok', jenis: 'Hilang' };
  if (r.includes('kadaluarsa') || r.includes('kedaluwarsa'))                    return { sumberPerubahan: 'Perubahan Stok', jenis: 'Kedaluwarsa' };
  if (r.includes('dijual'))                                                      return { sumberPerubahan: 'Perubahan Stok', jenis: 'Dijual' };
  if (r.includes('donasi'))                                                      return { sumberPerubahan: 'Perubahan Stok', jenis: 'Donasi' };
  return { sumberPerubahan: 'Perubahan Stok', jenis: 'Lainnya' };
}

/**
 * Hydrates RIWAYAT_MASUK and RIWAYAT_PERUBAHAN from Supabase stok_inventaris_transactions rows.
 * MUST be called AFTER populateInventarisFromDb() so stok satuan can be resolved from in-memory items.
 * If rows is empty, seed data and in-session mutations are preserved intact.
 *
 * Called by useStokInventaris() immediately after populating the main inventaris list.
 */
export function populateTransactionsFromDb(rows: TransactionDbRow[]): void {
  if (rows.length === 0) return;

  // DB is the authoritative source — replace all seed/session data
  RIWAYAT_MASUK.splice(0, RIWAYAT_MASUK.length);
  RIWAYAT_PERUBAHAN.splice(0, RIWAYAT_PERUBAHAN.length);

  for (const row of rows) {
    const inv = RAW_INVENTARIS.find((item) => item.id === row.stok_id);
    const satuan = inv?.satuan ?? 'Kg';
    const jumlah = Math.abs(row.quantity_delta);
    const stokSebelum = row.quantity_before ?? 0;
    const stokSesudah = row.quantity_after ?? (stokSebelum + row.quantity_delta);

    const isMasuk =
      row.transaction_type === 'Masuk' ||
      (row.transaction_type === 'Penyesuaian' && row.quantity_delta > 0);

    if (isMasuk) {
      const masukRecord: StokMasukRecord = {
        id: row.id,
        inventarisId: row.stok_id,
        sumber: deriveMasukSumber(row.reason),
        jumlah,
        satuan,
        tanggal: row.transaction_date,
        stokSebelum,
        stokSesudah,
        createdAt: row.created_at,
      };
      RIWAYAT_MASUK.push(masukRecord);
    } else {
      const { sumberPerubahan, jenis } = deriveKeluar(row.reason);
      const perubahanRecord: PerubahanStokRecord = {
        id: row.id,
        inventarisId: row.stok_id,
        jenis,
        jumlah,
        satuan,
        tanggal: row.transaction_date,
        stokSebelum,
        stokSesudah,
        sumberPerubahan,
        catatan: row.reason ?? undefined,
        createdAt: row.created_at,
      };
      RIWAYAT_PERUBAHAN.push(perubahanRecord);
    }
  }
}

/**
 * Membatalkan satu PerubahanStokRecord (rollback LP-003).
 *
 * Mengembalikan jumlah yang dikurangi kembali ke item inventaris asal
 * dan menghapus record dari RIWAYAT_PERUBAHAN.
 * Melempar Error jika record tidak ditemukan.
 */
export function rollbackPerubahanStok(perubahanId: string): void {
  const idx = RIWAYAT_PERUBAHAN.findIndex((r) => r.id === perubahanId);
  if (idx === -1) throw new Error(`PerubahanStokRecord tidak ditemukan: ${perubahanId}`);

  const record = RIWAYAT_PERUBAHAN[idx];
  const raw = RAW_INVENTARIS.find((item) => item.id === record.inventarisId);
  if (raw) {
    raw.jumlahStok += record.jumlah;
    raw.terakhirDiperbarui = 'Baru saja';
  }

  RIWAYAT_PERUBAHAN.splice(idx, 1);
}
