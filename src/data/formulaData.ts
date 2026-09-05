// ─── Formula Pakan — Data & Stats (FP-003) ──────────────────────────────────────
// Formula adalah TEMPLATE resep pakan — bukan produksi, bukan stok.
// Satu formula mendefinisikan komposisi bahan, proporsi, dan estimasi nutrisi
// untuk satu jenis ransum ternak.
//
// Satu formula dapat digunakan berkali-kali pada proses Produksi (FP-005+).

// ─── Tipe Dasar ───────────────────────────────────────────────────────────────

export type FormulaStatus = 'Aktif' | 'Draft' | 'Arsip';
export type SumberBahan = 'Master Pakan' | 'Produk Komersial';

/** Ukuran batch/berat total standar satu Formula (kg) — dipakai untuk menghitung
 *  kebutuhan bahan per batch (lihat FormulaDetail) dan ditampilkan sebagai
 *  "Total Berat Formula" pada daftar Formula. */
export const FORMULA_BATCH_SIZE_KG = 100;

export type FormulaJenis =
  | 'Complete Feed'
  | 'Konsentrat'
  | 'TMR'
  | 'Suplemen'
  | 'Ransum Hijauan'
  | 'Lainnya';

export const FORMULA_JENIS_LIST: FormulaJenis[] = [
  'Complete Feed',
  'Konsentrat',
  'TMR',
  'Suplemen',
  'Ransum Hijauan',
  'Lainnya',
];

export interface EstimasiNutrisi {
  /** Protein Kasar (%) */
  pk: number;
  /** Serat Kasar (%) */
  sk: number;
  /** Total Digestible Nutrients (%) */
  tdn: number;
}

export interface BahanFormula {
  /** id dari Master Pakan atau UUID dari Produk Komersial */
  referensiId: string;
  /** Sumber referensi bahan — WAJIB dipilih dari katalog, tidak boleh diketik bebas.
   *  Seed data lama (FP-003 ke belakang) tidak menyertakan field ini → default 'Master Pakan'. */
  sumberBahan?: SumberBahan;
  nama: string;
  /** Proporsi dalam formula (%) — idealnya total seluruh bahan = 100 */
  proporsi: number;
  satuan: string;
  /** Estimasi harga per kg bahan (Rp) — untuk penghitungan HPP breakdown */
  hargaEstimasiPerKg: number;
  /** Catatan opsional untuk bahan ini */
  catatan?: string;
}

export interface Rekomendasi {
  cocokUntuk: string[];
  /** Poin-poin kelebihan/keunggulan formula ini dibanding alternatif lain. */
  kelebihan?: string[];
  fasePemeliharaan: string;
  catatan?: string;
}

export interface FormulaRecord {
  id: string;
  nama: string;
  jenis: FormulaJenis;
  /** Spesies/fase ternak target (misal: "Sapi Perah", "Domba Bunting") */
  targetTernak: string;
  /** Fase pemeliharaan (misal: "Laktasi", "Finisher", "Bunting Akhir") */
  fasePemeliharaan?: string;
  /** Tujuan singkat formula — dipakai sebagai sub-label dan untuk pencarian */
  tujuan?: string;
  /** Deskripsi panjang / catatan tambahan formula */
  deskripsi?: string;
  status: FormulaStatus;
  bahan: BahanFormula[];
  /** Dihitung otomatis dari bahan.length */
  jumlahBahan: number;
  estimasiNutrisi: EstimasiNutrisi;
  /** Estimasi Harga Pokok Produksi (Rp per kg) */
  estimasiHPP: number;
  rekomendasi?: Rekomendasi;
  /** ISO date — diisi saat produksi terakhir dijalankan (FP-005+) */
  terakhirDigunakan?: string;
  dibuatPada: string; // ISO date
  diperbarui: string; // ISO date
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const FORMULA_LIST: FormulaRecord[] = [
  {
    id: 'frm-1',
    nama: 'Ransum Sapi Laktasi',
    jenis: 'Complete Feed',
    targetTernak: 'Sapi Perah',
    tujuan: 'Mendukung produksi susu dan menjaga kondisi tubuh sapi laktasi',
    status: 'Aktif',
    bahan: [
      { referensiId: 'mp-1',  sumberBahan: 'Master Pakan' as const, nama: 'Rumput Gajah',    proporsi: 35, satuan: 'kg', hargaEstimasiPerKg: 800 },
      { referensiId: 'mp-6',  sumberBahan: 'Master Pakan' as const, nama: 'Dedak Padi',      proporsi: 25, satuan: 'kg', hargaEstimasiPerKg: 2000 },
      { referensiId: 'mp-9',  sumberBahan: 'Master Pakan' as const, nama: 'Bungkil Kedelai', proporsi: 20, satuan: 'kg', hargaEstimasiPerKg: 7500 },
      { referensiId: 'mp-13', sumberBahan: 'Master Pakan' as const, nama: 'Mineral Mix',     proporsi: 10, satuan: 'kg', hargaEstimasiPerKg: 10000 },
      { referensiId: 'mp-11', sumberBahan: 'Master Pakan' as const, nama: 'Molases',         proporsi: 10, satuan: 'kg', hargaEstimasiPerKg: 2000 },
    ],
    jumlahBahan: 5,
    estimasiNutrisi: { pk: 17, sk: 16, tdn: 68 },
    estimasiHPP: 3480,
    rekomendasi: {
      cocokUntuk: ['Sapi Perah Produktif', 'Induk Sapi Laktasi'],
      kelebihan: ['Kandungan protein seimbang untuk menopang produksi susu', 'Menggunakan bahan lokal yang mudah didapat', 'HPP relatif terjangkau untuk formula complete feed'],
      fasePemeliharaan: 'Laktasi (0–305 hari pasca melahirkan)',
      catatan: 'Berikan 3 kg per 100 kg BB per hari. Pastikan air minum tersedia ad libitum. Monitor produksi susu dan kondisi tubuh (BCS) secara mingguan.',
    },
    terakhirDigunakan: '2026-07-01',
    dibuatPada: '2026-05-10',
    diperbarui: '2026-07-01',
  },
  {
    id: 'frm-2',
    nama: 'Konsentrat Penggemukan Sapi',
    jenis: 'Konsentrat',
    targetTernak: 'Sapi Potong',
    tujuan: 'Mempercepat pertambahan bobot badan fase finishing',
    status: 'Aktif',
    bahan: [
      { referensiId: 'mp-8',  sumberBahan: 'Master Pakan' as const, nama: 'Jagung Giling',   proporsi: 40, satuan: 'kg', hargaEstimasiPerKg: 5000 },
      { referensiId: 'mp-9',  sumberBahan: 'Master Pakan' as const, nama: 'Bungkil Kedelai', proporsi: 30, satuan: 'kg', hargaEstimasiPerKg: 7500 },
      { referensiId: 'mp-6',  sumberBahan: 'Master Pakan' as const, nama: 'Dedak Padi',      proporsi: 25, satuan: 'kg', hargaEstimasiPerKg: 2000 },
      { referensiId: 'mp-13', sumberBahan: 'Master Pakan' as const, nama: 'Mineral Mix',     proporsi: 5,  satuan: 'kg', hargaEstimasiPerKg: 10000 },
    ],
    jumlahBahan: 4,
    estimasiNutrisi: { pk: 16, sk: 10, tdn: 72 },
    estimasiHPP: 5300,
    rekomendasi: {
      cocokUntuk: ['Sapi Potong Fase Finisher', 'Jantan Usia 12–24 Bulan'],
      kelebihan: ['TDN tinggi untuk pertambahan bobot badan harian yang cepat', 'Energi dari jagung giling mudah dicerna', 'Cocok untuk sistem penggemukan intensif jangka pendek'],
      fasePemeliharaan: 'Finisher (2–3 bulan terakhir sebelum jual)',
      catatan: 'Berikan bersama hijauan minimal 40% dari total ransum. Proporsi konsentrat tidak lebih dari 60% untuk mencegah asidosis.',
    },
    terakhirDigunakan: '2026-06-20',
    dibuatPada: '2026-04-15',
    diperbarui: '2026-06-20',
  },
  {
    id: 'frm-3',
    nama: 'TMR Domba Bunting',
    jenis: 'TMR',
    targetTernak: 'Domba',
    tujuan: 'Memenuhi kebutuhan nutrisi domba fase bunting akhir dan laktasi',
    status: 'Aktif',
    bahan: [
      { referensiId: 'mp-5',  sumberBahan: 'Master Pakan' as const, nama: 'Jerami Kering',   proporsi: 30, satuan: 'kg', hargaEstimasiPerKg: 1000 },
      { referensiId: 'mp-1',  sumberBahan: 'Master Pakan' as const, nama: 'Rumput Gajah',    proporsi: 25, satuan: 'kg', hargaEstimasiPerKg: 800 },
      { referensiId: 'mp-6',  sumberBahan: 'Master Pakan' as const, nama: 'Dedak Padi',      proporsi: 20, satuan: 'kg', hargaEstimasiPerKg: 2000 },
      { referensiId: 'mp-9',  sumberBahan: 'Master Pakan' as const, nama: 'Bungkil Kedelai', proporsi: 15, satuan: 'kg', hargaEstimasiPerKg: 7500 },
      { referensiId: 'mp-11', sumberBahan: 'Master Pakan' as const, nama: 'Molases',         proporsi: 5,  satuan: 'kg', hargaEstimasiPerKg: 2000 },
      { referensiId: 'mp-13', sumberBahan: 'Master Pakan' as const, nama: 'Mineral Mix',     proporsi: 5,  satuan: 'kg', hargaEstimasiPerKg: 10000 },
    ],
    jumlahBahan: 6,
    estimasiNutrisi: { pk: 14, sk: 22, tdn: 62 },
    estimasiHPP: 2725,
    rekomendasi: {
      cocokUntuk: ['Domba Induk', 'Domba Bunting Akhir'],
      kelebihan: ['Serat kasar cukup tinggi untuk menjaga kesehatan rumen', 'Kombinasi hijauan kering dan konsentrat dalam satu ransum (TMR)', 'HPP paling rendah di antara formula aktif — cocok untuk pemeliharaan skala besar'],
      fasePemeliharaan: 'Bunting akhir (6–8 minggu sebelum beranak) dan awal laktasi',
      catatan: 'Tingkatkan porsi bertahap 2 minggu sebelum beranak. Monitor kondisi tubuh (BCS) secara rutin. Target BCS saat beranak: 3,5.',
    },
    terakhirDigunakan: '2026-06-28',
    dibuatPada: '2026-03-20',
    diperbarui: '2026-06-28',
  },
  {
    id: 'frm-4',
    nama: 'Ransum Kambing Pertumbuhan',
    jenis: 'Konsentrat',
    targetTernak: 'Kambing',
    tujuan: 'Mendukung pertumbuhan optimal kambing muda (3–12 bulan)',
    status: 'Aktif',
    bahan: [
      { referensiId: 'mp-8',  sumberBahan: 'Master Pakan' as const, nama: 'Jagung Giling',   proporsi: 50, satuan: 'kg', hargaEstimasiPerKg: 5000 },
      { referensiId: 'mp-9',  sumberBahan: 'Master Pakan' as const, nama: 'Bungkil Kedelai', proporsi: 30, satuan: 'kg', hargaEstimasiPerKg: 7500 },
      { referensiId: 'mp-13', sumberBahan: 'Master Pakan' as const, nama: 'Mineral Mix',     proporsi: 20, satuan: 'kg', hargaEstimasiPerKg: 10000 },
    ],
    jumlahBahan: 3,
    estimasiNutrisi: { pk: 15, sk: 12, tdn: 70 },
    estimasiHPP: 6750,
    rekomendasi: {
      cocokUntuk: ['Kambing Muda', 'Kambing Pascasapih'],
      kelebihan: ['Energi dan protein tinggi mendukung laju pertumbuhan optimal', 'Formulasi sederhana — mudah direplikasi di kandang kecil', 'Mineral mix porsi besar membantu mencegah defisiensi mikro-mineral pada kambing muda'],
      fasePemeliharaan: 'Pertumbuhan (3–12 bulan)',
      catatan: 'Kombinasikan dengan hijauan segar minimal 50% dari total pakan. Hindari pemberian pakan basah berlebih untuk menjaga kesehatan saluran cerna.',
    },
    dibuatPada: '2026-04-01',
    diperbarui: '2026-06-10',
  },
  {
    id: 'frm-5',
    nama: 'Formula Sapihan Pedet',
    jenis: 'Complete Feed',
    targetTernak: 'Sapi Perah',
    tujuan: 'Starter feed untuk pedet usia 2–6 bulan pasca sapih',
    status: 'Draft',
    bahan: [
      { referensiId: 'mp-8',  sumberBahan: 'Master Pakan' as const, nama: 'Jagung Giling',   proporsi: 45, satuan: 'kg', hargaEstimasiPerKg: 5000 },
      { referensiId: 'mp-9',  sumberBahan: 'Master Pakan' as const, nama: 'Bungkil Kedelai', proporsi: 30, satuan: 'kg', hargaEstimasiPerKg: 7500 },
      { referensiId: 'mp-6',  sumberBahan: 'Master Pakan' as const, nama: 'Dedak Padi',      proporsi: 15, satuan: 'kg', hargaEstimasiPerKg: 2000 },
      { referensiId: 'mp-13', sumberBahan: 'Master Pakan' as const, nama: 'Mineral Mix',     proporsi: 10, satuan: 'kg', hargaEstimasiPerKg: 10000 },
    ],
    jumlahBahan: 4,
    estimasiNutrisi: { pk: 20, sk: 8, tdn: 74 },
    estimasiHPP: 5775,
    rekomendasi: {
      cocokUntuk: ['Pedet Jantan', 'Pedet Betina Pascasapih'],
      kelebihan: ['Protein kasar tertinggi di antara seluruh formula — mendukung pertumbuhan rangka pedet', 'Serat kasar rendah, mudah dicerna oleh sistem pencernaan pedet muda'],
      fasePemeliharaan: 'Sapih (2–6 bulan)',
      catatan: 'Formula masih dalam tahap pengembangan (Draft). Belum siap untuk digunakan dalam produksi. Sedang dikaji untuk penyesuaian kadar serat.',
    },
    dibuatPada: '2026-07-05',
    diperbarui: '2026-07-05',
  },
  {
    id: 'frm-6',
    nama: 'Suplemen Mineral Harian',
    jenis: 'Suplemen',
    targetTernak: 'Semua Ternak',
    tujuan: 'Suplemen mineral harian untuk mencegah defisiensi mikro-mineral',
    status: 'Arsip',
    bahan: [
      { referensiId: 'mp-13', sumberBahan: 'Master Pakan' as const, nama: 'Mineral Mix',  proporsi: 70, satuan: 'kg', hargaEstimasiPerKg: 10000 },
      { referensiId: 'mp-14', sumberBahan: 'Master Pakan' as const, nama: 'Garam Dapur',  proporsi: 30, satuan: 'kg', hargaEstimasiPerKg: 1500 },
    ],
    jumlahBahan: 2,
    estimasiNutrisi: { pk: 0, sk: 0, tdn: 0 },
    estimasiHPP: 7450,
    rekomendasi: {
      cocokUntuk: ['Semua Jenis Ternak'],
      kelebihan: ['Formulasi sederhana, biaya bahan rendah', 'Dapat diberikan pada berbagai jenis ternak sebagai suplemen mineral dasar'],
      fasePemeliharaan: 'Pemeliharaan umum',
      catatan: 'Formula ini telah diarsipkan dan tidak aktif. Digantikan oleh formula mineral yang lebih lengkap.',
    },
    terakhirDigunakan: '2026-04-10',
    dibuatPada: '2026-01-15',
    diperbarui: '2026-04-10',
  },
];

// ─── Getters ──────────────────────────────────────────────────────────────────

/** Replaces the entire formula list — used by backup restore and DB hydration. */
export function replaceFormulaList(records: FormulaRecord[]): void {
  FORMULA_LIST.splice(0, FORMULA_LIST.length, ...records);
}

// ─── DB read-path — FLOW-003M20 ───────────────────────────────────────────────
// Local minimal types mirror FormulaDbRow / FormulaIngredientDbRow in
// formulaRepository.ts. Kept local to avoid a mid-file import statement.

type FormulaDbRowMinimal = {
  id:                string;
  name:              string;
  status:            FormulaStatus;
  target_species:    string[] | null;
  target_age_group:  string | null;
  description:       string | null;
  total_cost_per_kg: number | null;
  created_at:        string;
  updated_at:        string;
};

type FormulaIngredientDbRowMinimal = {
  id:                  string;
  formula_id:          string;
  source_type:         SumberBahan;
  master_pakan_id:     string | null;
  produk_komersial_id: string | null;
  ingredient_name:     string;
  percentage:          number;
  cost_per_kg:         number | null;
};

/**
 * Hydrates the in-memory FORMULA_LIST from Supabase rows.
 *
 * Called by useFormula() after a successful workspace fetch.
 * If either array is empty the in-memory list is preserved intact (seed data
 * stays visible when DB is empty or not connected).
 *
 * Field mapping:
 *   - `jenis`             → 'Lainnya' (not stored in DB)
 *   - `estimasiNutrisi`   → { pk:0, sk:0, tdn:0 } (not stored in DB)
 *   - `estimasiHPP`       → total_cost_per_kg ?? 0
 *   - `bahan`             → reconstructed from feed_formula_ingredients
 *   - `BahanFormula.satuan` → 'kg' (not stored in DB — safe default)
 */
export function populateFormulaFromDb(
  rows: FormulaDbRowMinimal[],
  ingredientRows: FormulaIngredientDbRowMinimal[],
): void {
  if (rows.length === 0) return; // nothing from DB — keep seed / in-memory data

  // Group ingredients by formula_id for O(n) lookup.
  const byFormula = new Map<string, FormulaIngredientDbRowMinimal[]>();
  for (const ing of ingredientRows) {
    const arr = byFormula.get(ing.formula_id) ?? [];
    arr.push(ing);
    byFormula.set(ing.formula_id, arr);
  }

  const records: FormulaRecord[] = rows.map((row): FormulaRecord => {
    const ings = byFormula.get(row.id) ?? [];
    const bahan: BahanFormula[] = ings.map((ing): BahanFormula => ({
      referensiId:        ing.master_pakan_id ?? ing.produk_komersial_id ?? ing.id,
      sumberBahan:        ing.source_type,
      nama:               ing.ingredient_name,
      proporsi:           ing.percentage,
      satuan:             'kg',                          // not stored in DB
      hargaEstimasiPerKg: ing.cost_per_kg ?? 0,
    }));

    return {
      id:                row.id,
      nama:              row.name,
      jenis:             'Lainnya',                      // not stored in DB
      targetTernak:      (row.target_species ?? []).join(', '),
      fasePemeliharaan:  row.target_age_group ?? undefined,
      deskripsi:         row.description ?? undefined,
      status:            row.status,
      bahan,
      jumlahBahan:       bahan.length,
      estimasiNutrisi:   { pk: 0, sk: 0, tdn: 0 },      // not stored in DB
      estimasiHPP:       row.total_cost_per_kg ?? 0,
      dibuatPada:        row.created_at,
      diperbarui:        row.updated_at,
    };
  });

  replaceFormulaList(records);
}

export function getFormulaList(): FormulaRecord[] {
  return FORMULA_LIST;
}


export function getFormulaById(id: string): FormulaRecord | undefined {
  return FORMULA_LIST.find((f) => f.id === id);
}

// ─── Mutations (FP-004) ───────────────────────────────────────────────────────

export interface AddFormulaInput {
  nama: string;
  jenis: FormulaJenis;
  targetTernak: string;
  fasePemeliharaan?: string;
  tujuan?: string;
  deskripsi?: string;
  status: FormulaStatus;
  bahan: BahanFormula[];
  estimasiNutrisi: EstimasiNutrisi;
  estimasiHPP: number;
}

export interface UpdateFormulaInput {
  nama?: string;
  jenis?: FormulaJenis;
  targetTernak?: string;
  fasePemeliharaan?: string;
  tujuan?: string;
  deskripsi?: string;
  status?: FormulaStatus;
  bahan?: BahanFormula[];
  estimasiNutrisi?: EstimasiNutrisi;
  estimasiHPP?: number;
  /** ISO date — diperbarui setiap kali proses produksi dijalankan (FP-005). */
  terakhirDigunakan?: string;
}

function isoNow(): string {
  return new Date().toISOString().split('T')[0];
}

let _formulaCounter = FORMULA_LIST.length + 1;

export function addFormula(input: AddFormulaInput): FormulaRecord {
  const id = `frm-${Date.now()}-${_formulaCounter++}`;
  const now = isoNow();
  const record: FormulaRecord = {
    id,
    nama: input.nama.trim(),
    jenis: input.jenis,
    targetTernak: input.targetTernak.trim(),
    fasePemeliharaan: input.fasePemeliharaan?.trim() || undefined,
    tujuan: input.tujuan?.trim() || undefined,
    deskripsi: input.deskripsi?.trim() || undefined,
    status: input.status,
    bahan: input.bahan,
    jumlahBahan: input.bahan.length,
    estimasiNutrisi: input.estimasiNutrisi,
    estimasiHPP: input.estimasiHPP,
    dibuatPada: now,
    diperbarui: now,
  };
  FORMULA_LIST.push(record);
  return record;
}

export function updateFormula(id: string, input: UpdateFormulaInput): FormulaRecord | undefined {
  const idx = FORMULA_LIST.findIndex((f) => f.id === id);
  if (idx === -1) return undefined;
  const prev = FORMULA_LIST[idx];
  const bahan = input.bahan ?? prev.bahan;
  const updated: FormulaRecord = {
    ...prev,
    nama:              input.nama           !== undefined ? input.nama.trim()           : prev.nama,
    jenis:             input.jenis          !== undefined ? input.jenis                 : prev.jenis,
    targetTernak:      input.targetTernak   !== undefined ? input.targetTernak.trim()   : prev.targetTernak,
    fasePemeliharaan:  input.fasePemeliharaan !== undefined ? (input.fasePemeliharaan?.trim() || undefined) : prev.fasePemeliharaan,
    tujuan:            input.tujuan         !== undefined ? (input.tujuan?.trim() || undefined)         : prev.tujuan,
    deskripsi:         input.deskripsi      !== undefined ? (input.deskripsi?.trim() || undefined)      : prev.deskripsi,
    status:            input.status         !== undefined ? input.status                : prev.status,
    bahan,
    jumlahBahan: bahan.length,
    estimasiNutrisi: input.estimasiNutrisi ?? prev.estimasiNutrisi,
    estimasiHPP:     input.estimasiHPP     ?? prev.estimasiHPP,
    terakhirDigunakan: input.terakhirDigunakan !== undefined ? input.terakhirDigunakan : prev.terakhirDigunakan,
    diperbarui: isoNow(),
  };
  FORMULA_LIST[idx] = updated;
  return updated;
}

/** Mengarsipkan formula — status → 'Arsip'. No-op jika sudah Arsip. */
export function archiveFormula(id: string): FormulaRecord | undefined {
  return updateFormula(id, { status: 'Arsip' });
}

/** Mengaktifkan kembali formula yang diarsipkan — status → 'Aktif'. */
export function unarchiveFormula(id: string): FormulaRecord | undefined {
  return updateFormula(id, { status: 'Aktif' });
}

/** Menghapus formula secara permanen dari daftar. */
export function deleteFormula(id: string): boolean {
  const idx = FORMULA_LIST.findIndex((f) => f.id === id);
  if (idx === -1) return false;
  FORMULA_LIST.splice(idx, 1);
  return true;
}

export function getTotalFormula(): number {
  return FORMULA_LIST.length;
}

export function getFormulaAktif(): number {
  return FORMULA_LIST.filter((f) => f.status === 'Aktif').length;
}

/** Nama formula yang terakhir digunakan untuk produksi, atau '—' jika belum ada. */
export function getFormulaTerakhirDigunakan(): string {
  const used = FORMULA_LIST
    .filter((f) => f.terakhirDigunakan)
    .sort((a, b) => (b.terakhirDigunakan ?? '').localeCompare(a.terakhirDigunakan ?? ''));
  return used[0]?.nama ?? '—';
}

/** Tanggal pembaruan formula terbaru, atau '—' jika belum ada. */
export function getFormulaTerakhirDiperbarui(): string {
  if (FORMULA_LIST.length === 0) return '—';
  return FORMULA_LIST
    .map((f) => f.diperbarui)
    .sort((a, b) => b.localeCompare(a))[0] ?? '—';
}
