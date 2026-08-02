// ─── Riwayat Produksi Formula (FP-006) ─────────────────────────────────────────
// Histori PRODUKSI — bukan histori stok. Setiap kali proses Produksi Formula
// (FP-005, src/pages/FormulaProduksi.tsx) berhasil dijalankan, satu
// ProduksiBatchRecord dicatat di sini sebagai snapshot permanen dari kondisi
// saat produksi (harga bahan, HPP, nutrisi) — TIDAK mengikuti perubahan
// Formula/Master Pakan/Stok di kemudian hari.
//
// ATURAN KERAS:
//  • Modul ini HANYA dibaca oleh Tab Riwayat Produksi — tidak pernah memicu
//    perubahan stok, formula, master pakan, produk komersial, atau livestock.
//  • Satu-satunya penulis adalah addProduksiRecord(), dipanggil dari
//    FormulaProduksi.tsx tepat setelah mutasi stok berhasil dikonfirmasi.

import type { EstimasiNutrisi } from './formulaData';
import { getFormulaById } from './formulaData';

// ─── Tipe ───────────────────────────────────────────────────────────────────

/** Snapshot satu bahan baku yang dipakai pada satu batch produksi. */
export interface BahanDigunakan {
  referensiId: string;
  nama: string;
  satuan: string;
  /** Jumlah yang dipakai pada batch ini (kg/unit). */
  jumlah: number;
  /** Proporsi (%) bahan ini dalam formula pada saat produksi. */
  proporsi: number;
  /** Harga per satuan SAAT produksi dijalankan (snapshot, bukan harga saat ini). */
  hargaSaatProduksi: number;
  /** jumlah × hargaSaatProduksi. */
  subtotalBiaya: number;
}

export interface ProduksiBatchRecord {
  id: string;
  /** Nomor batch unik, format: BATCH-YYYYMMDD-XXX. */
  nomorBatch: string;
  formulaId: string;
  formulaNama: string;
  formulaJenis: string;
  targetTernak: string;
  /** Nama hasil produksi (biasanya sama dengan nama formula). */
  namaHasilProduksi: string;
  /** Jumlah hasil produksi (kg). */
  jumlahProduksi: number;
  /** Total berat seluruh bahan baku yang dipakai (kg) — untuk verifikasi silang dengan jumlahProduksi. */
  totalBerat: number;
  /** Snapshot bahan baku yang dipakai pada batch ini. */
  bahanDigunakan: BahanDigunakan[];
  /** Snapshot estimasi nutrisi formula saat produksi dijalankan. */
  estimasiNutrisiHasil: EstimasiNutrisi;
  totalBiayaProduksi: number;
  hppPerKg: number;
  /** ISO timestamp lengkap (tanggal + jam) saat produksi dikonfirmasi. */
  waktuProduksi: string;
  /** Operator yang menjalankan produksi — opsional, app belum punya sistem akun/operator. */
  operator?: string;
  catatanProduksi?: string;
  createdAt: string; // ISO timestamp
}

export interface AddProduksiRecordInput {
  formulaId: string;
  formulaNama: string;
  formulaJenis: string;
  targetTernak: string;
  namaHasilProduksi: string;
  jumlahProduksi: number;
  bahanDigunakan: BahanDigunakan[];
  estimasiNutrisiHasil: EstimasiNutrisi;
  totalBiayaProduksi: number;
  hppPerKg: number;
  operator?: string;
  catatanProduksi?: string;
}

// ─── Nomor Batch ────────────────────────────────────────────────────────────

let _batchCounterToday = 0;
let _batchCounterDate = '';

function generateNomorBatch(now: Date): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  if (_batchCounterDate !== dateStr) {
    _batchCounterDate = dateStr;
    _batchCounterToday = 0;
  }
  _batchCounterToday += 1;
  const seq = String(_batchCounterToday).padStart(3, '0');
  return `BATCH-${dateStr}-${seq}`;
}

// ─── Seed Data (demo — riwayat produksi sebelumnya) ────────────────────────────

const RIWAYAT_PRODUKSI: ProduksiBatchRecord[] = [
  {
    id: 'prod-1',
    nomorBatch: 'BATCH-20260701-001',
    formulaId: 'frm-1',
    formulaNama: 'Ransum Sapi Laktasi',
    formulaJenis: 'Complete Feed',
    targetTernak: 'Sapi Perah',
    namaHasilProduksi: 'Ransum Sapi Laktasi',
    jumlahProduksi: 200,
    totalBerat: 200,
    bahanDigunakan: [
      { referensiId: 'mp-rumput-gajah',  nama: 'Rumput Gajah',    satuan: 'kg', jumlah: 70, proporsi: 35, hargaSaatProduksi: 800,   subtotalBiaya: 56000 },
      { referensiId: 'mp-dedak-padi',    nama: 'Dedak Padi',      satuan: 'kg', jumlah: 50, proporsi: 25, hargaSaatProduksi: 2000,  subtotalBiaya: 100000 },
      { referensiId: 'mp-bungkil-kedel', nama: 'Bungkil Kedelai', satuan: 'kg', jumlah: 40, proporsi: 20, hargaSaatProduksi: 7500,  subtotalBiaya: 300000 },
      { referensiId: 'mp-mineral-mix',   nama: 'Mineral Mix',     satuan: 'kg', jumlah: 20, proporsi: 10, hargaSaatProduksi: 10000, subtotalBiaya: 200000 },
      { referensiId: 'mp-molases',       nama: 'Molases',         satuan: 'kg', jumlah: 20, proporsi: 10, hargaSaatProduksi: 2000,  subtotalBiaya: 40000 },
    ],
    estimasiNutrisiHasil: { pk: 17, sk: 16, tdn: 68 },
    totalBiayaProduksi: 696000,
    hppPerKg: 3480,
    waktuProduksi: '2026-07-01T08:30:00.000Z',
    operator: 'Budi',
    catatanProduksi: 'Batch rutin awal bulan untuk kandang sapi perah A.',
    createdAt: '2026-07-01T08:30:00.000Z',
  },
  {
    id: 'prod-2',
    nomorBatch: 'BATCH-20260620-001',
    formulaId: 'frm-2',
    formulaNama: 'Konsentrat Penggemukan Sapi',
    formulaJenis: 'Konsentrat',
    targetTernak: 'Sapi Potong',
    namaHasilProduksi: 'Konsentrat Penggemukan Sapi',
    jumlahProduksi: 100,
    totalBerat: 100,
    bahanDigunakan: [
      { referensiId: 'mp-jagung-giling', nama: 'Jagung Giling',   satuan: 'kg', jumlah: 40, proporsi: 40, hargaSaatProduksi: 5000,  subtotalBiaya: 200000 },
      { referensiId: 'mp-bungkil-kedel', nama: 'Bungkil Kedelai', satuan: 'kg', jumlah: 30, proporsi: 30, hargaSaatProduksi: 7500,  subtotalBiaya: 225000 },
      { referensiId: 'mp-dedak-padi',    nama: 'Dedak Padi',      satuan: 'kg', jumlah: 25, proporsi: 25, hargaSaatProduksi: 2000,  subtotalBiaya: 50000 },
      { referensiId: 'mp-mineral-mix',   nama: 'Mineral Mix',     satuan: 'kg', jumlah: 5,  proporsi: 5,  hargaSaatProduksi: 10000, subtotalBiaya: 50000 },
    ],
    estimasiNutrisiHasil: { pk: 16, sk: 10, tdn: 72 },
    totalBiayaProduksi: 525000,
    hppPerKg: 5250,
    waktuProduksi: '2026-06-20T07:00:00.000Z',
    operator: 'Sari',
    catatanProduksi: 'Untuk fase finishing kandang B — target jual 3 bulan lagi.',
    createdAt: '2026-06-20T07:00:00.000Z',
  },
];

// ─── Getters ────────────────────────────────────────────────────────────────

/** Seluruh riwayat produksi, terbaru di atas. */
export function getAllProduksiRecords(): ProduksiBatchRecord[] {
  return RIWAYAT_PRODUKSI.slice().reverse();
}

export function getProduksiRecordById(id: string): ProduksiBatchRecord | undefined {
  return RIWAYAT_PRODUKSI.find((r) => r.id === id);
}

export function getProduksiRecordsByFormulaId(formulaId: string): ProduksiBatchRecord[] {
  return RIWAYAT_PRODUKSI.filter((r) => r.formulaId === formulaId).slice().reverse();
}

export function getTotalProduksiBatch(): number {
  return RIWAYAT_PRODUKSI.length;
}

// ─── Mutasi (satu-satunya penulis) ─────────────────────────────────────────────

let _produksiCounter = RIWAYAT_PRODUKSI.length + 1;

// ─── DB read-path — FLOW-003M20 ───────────────────────────────────────────────
// Local minimal type mirrors FormulaProductionDbRow in formulaRepository.ts.
// Kept local to avoid a mid-file import statement.

type FormulaProductionDbRowMinimal = {
  id:              string;
  formula_id:      string;
  production_date: string;
  quantity_kg:     number;
  batch_code:      string | null;
  notes:           string | null;
  produced_by:     string | null;
  created_at:      string;
};

/**
 * Hydrates the in-memory RIWAYAT_PRODUKSI from Supabase rows.
 *
 * Called by useFormula() after a successful workspace fetch.
 * If the DB returns 0 rows the in-memory list is preserved intact (seed data
 * remains visible when DB is empty or not connected).
 *
 * IMPORTANT: must be called AFTER populateFormulaFromDb() so formulaNama
 * can be resolved from the already-hydrated FORMULA_LIST.
 *
 * Field mapping (partial reconstruction — snapshot fields not stored in DB):
 *   - `nomorBatch`             → batch_code ?? 'BATCH-DB-{id.slice(0,8)}'
 *   - `formulaNama`            → looked up from in-memory FORMULA_LIST (populated first)
 *   - `bahanDigunakan`         → [] (snapshot not stored in DB)
 *   - `estimasiNutrisiHasil`   → { pk:0, sk:0, tdn:0 }
 *   - `totalBiayaProduksi`     → 0
 *   - `hppPerKg`               → 0
 */
export function populateProduksiFormulaFromDb(rows: FormulaProductionDbRowMinimal[]): void {
  if (rows.length === 0) return; // keep seed / in-memory data intact

  const records: ProduksiBatchRecord[] = rows.map((row): ProduksiBatchRecord => {
    const formula = getFormulaById(row.formula_id);
    return {
      id:                     row.id,
      nomorBatch:             row.batch_code ?? `BATCH-DB-${row.id.slice(0, 8)}`,
      formulaId:              row.formula_id,
      formulaNama:            formula?.nama ?? row.formula_id,
      formulaJenis:           formula?.jenis ?? 'Lainnya',
      targetTernak:           formula?.targetTernak ?? '',
      namaHasilProduksi:      formula?.nama ?? row.formula_id,
      jumlahProduksi:         row.quantity_kg,
      totalBerat:             row.quantity_kg,
      bahanDigunakan:         [],                        // snapshot not stored in DB
      estimasiNutrisiHasil:   { pk: 0, sk: 0, tdn: 0 }, // snapshot not stored in DB
      totalBiayaProduksi:     0,
      hppPerKg:               0,
      waktuProduksi:          row.production_date + 'T00:00:00.000Z',
      operator:               row.produced_by ?? undefined,
      catatanProduksi:        row.notes ?? undefined,
      createdAt:              row.created_at,
    };
  });

  // Replace seed data with DB records.
  RIWAYAT_PRODUKSI.splice(0, RIWAYAT_PRODUKSI.length, ...records);
  // Reset counter to avoid ID collision with DB-hydrated records.
  _produksiCounter = records.length + 1;
}

/**
 * Mencatat satu batch produksi baru. Dipanggil HANYA oleh FormulaProduksi.tsx
 * (FP-005) segera setelah mutasi stok (kurangi bahan baku + tambah hasil)
 * berhasil dikonfirmasi. Tidak pernah mengubah stok/formula — murni pencatatan.
 */
export function addProduksiRecord(input: AddProduksiRecordInput): ProduksiBatchRecord {
  const now = new Date();
  const record: ProduksiBatchRecord = {
    id: `prod-${Date.now()}-${_produksiCounter++}`,
    nomorBatch: generateNomorBatch(now),
    formulaId: input.formulaId,
    formulaNama: input.formulaNama,
    formulaJenis: input.formulaJenis,
    targetTernak: input.targetTernak,
    namaHasilProduksi: input.namaHasilProduksi,
    jumlahProduksi: input.jumlahProduksi,
    totalBerat: input.bahanDigunakan.reduce((sum, b) => sum + b.jumlah, 0),
    bahanDigunakan: input.bahanDigunakan,
    estimasiNutrisiHasil: input.estimasiNutrisiHasil,
    totalBiayaProduksi: input.totalBiayaProduksi,
    hppPerKg: input.hppPerKg,
    waktuProduksi: now.toISOString(),
    operator: input.operator,
    catatanProduksi: input.catatanProduksi,
    createdAt: now.toISOString(),
  };
  RIWAYAT_PRODUKSI.push(record);
  return record;
}
