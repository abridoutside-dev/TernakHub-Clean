// ─── Standarisasi Data Nutrisi — Produk Komersial ────────────────────────────
// PK-007: Menyiapkan struktur data nutrisi yang SERAGAM untuk seluruh Produk
// Komersial (lintas kategori), agar dapat dikonsumsi Formula, AI, Analisis
// Nutrisi, dan Perbandingan Produk di masa depan — TANPA mengubah arsitektur
// aplikasi, Master Pakan, atau modul lain, dan TANPA melakukan perhitungan
// formulasi atau analisis otomatis apa pun pada fase ini.
//
// Prinsip:
// • Seluruh parameter nutrisi bersifat OPSIONAL. Jika produsen tidak
//   mencantumkan suatu parameter, nilainya NULL — BUKAN 0. Nilai 0 berarti
//   "diketahui bernilai nol", sedangkan NULL berarti "tidak diketahui/tidak
//   dicantumkan". Perbedaan ini wajib dijaga di seluruh kode yang membaca
//   struktur ini.
// • Setiap parameter skalar memiliki SATU satuan yang konsisten (lihat
//   SATUAN_NUTRISI_STANDAR) — tidak berubah antar produk.
// • Vitamin/Mineral/Asam Amino/Trace Mineral/Additive adalah kumpulan
//   komponen bernama dengan satuan masing-masing (mis. Vitamin A dalam
//   IU/kg, Lysine dalam %, Zinc dalam ppm) — direpresentasikan sebagai daftar
//   (array), bukan field skalar tunggal.
// • Sumber data (label resmi, brosur resmi, website resmi produsen, atau
//   input Admin) dicatat per record, sesuai ketentuan sumber data PK-007.
// • Admin dapat memperbarui data nutrisi; UUID produk (produkUuid) TIDAK
//   PERNAH berubah; setiap perubahan dicatat pada Riwayat Perubahan Nutrisi.
//
// Modul ini TIDAK menghitung formulasi maupun menghasilkan analisis/insight
// otomatis — itu domain Formula/AI/Analisis Nutrisi yang akan dibangun pada
// fase terpisah, mengonsumsi struktur ini sebagai sumber data siap pakai.

import { KONSENTRAT_DETAIL_LIST } from './konsentratDetailData';
import { generateUUID } from '../utils/uuid';

// ─── Satuan Standar — Parameter Skalar ────────────────────────────────────────
// Setiap parameter skalar SELALU menggunakan satuan yang sama di seluruh
// Produk Komersial, agar Formula/AI/Analisis Nutrisi dapat membandingkan
// produk apa adanya tanpa perlu konversi satuan.

export type ParameterNutrisiSkalar =
  | 'bk' | 'pk' | 'lk' | 'sk' | 'abu' | 'tdn' | 'de' | 'me'
  | 'ndf' | 'adf' | 'ca' | 'p' | 'mg' | 'k' | 'na' | 'cl' | 's';

export const SATUAN_NUTRISI_STANDAR: Record<ParameterNutrisiSkalar, string> = {
  bk: '%',        // Bahan Kering
  pk: '%',        // Protein Kasar
  lk: '%',        // Lemak Kasar
  sk: '%',        // Serat Kasar
  abu: '%',
  tdn: '%',
  de: 'Mcal/kg',  // Digestible Energy
  me: 'Mcal/kg',  // Metabolizable Energy
  ndf: '%',
  adf: '%',
  ca: '%',
  p: '%',
  mg: '%',
  k: '%',
  na: '%',
  cl: '%',
  s: '%',
};

/** Label tampilan resmi tiap parameter skalar, untuk dipakai UI di fase berikutnya. */
export const LABEL_NUTRISI_STANDAR: Record<ParameterNutrisiSkalar, string> = {
  bk: 'Bahan Kering', pk: 'Protein Kasar', lk: 'Lemak Kasar', sk: 'Serat Kasar',
  abu: 'Abu', tdn: 'TDN', de: 'DE', me: 'ME', ndf: 'NDF', adf: 'ADF',
  ca: 'Ca', p: 'P', mg: 'Mg', k: 'K', na: 'Na', cl: 'Cl', s: 'S',
};

// ─── Komponen Bernama — Vitamin / Mineral / Asam Amino / Trace Mineral / Additive ─

/** Satu komponen bernama dengan nilai dan satuannya sendiri (mis. "Vitamin A", 5000, "IU/kg"). */
export interface NutrisiKomponenBernama {
  nama: string;
  /** NULL jika nilai tidak dicantumkan produsen — bukan 0. */
  nilai: number | null;
  /** Satuan komponen ini, mis. "%", "ppm", "mg/kg", "IU/kg". */
  satuan: string;
}

// ─── Sumber Data ───────────────────────────────────────────────────────────────

export type SumberDataNutrisi =
  | 'Label Resmi'
  | 'Brosur Resmi'
  | 'Website Resmi Produsen'
  | 'Input Admin';

// ─── Struktur Nutrisi Standar ──────────────────────────────────────────────────

/**
 * Struktur nutrisi standar untuk SATU Produk Komersial, berlaku seragam di
 * seluruh kategori (Konsentrat, Premix, Mineral Mix, dst).
 *
 * Semua field skalar bertipe `number | null`: NULL berarti parameter tidak
 * dicantumkan produsen. Jangan pernah mengisi 0 sebagai pengganti "tidak ada
 * data".
 */
export interface NutrisiStandarProdukKomersial {
  /** UUID produk (relasi ke identitas produk — KonsentratSeri.uuid, dst). Permanen, tidak pernah berubah. */
  produkUuid: string;

  // ── Parameter Skalar (satuan lihat SATUAN_NUTRISI_STANDAR) ────────────────
  bk: number | null;
  pk: number | null;
  lk: number | null;
  sk: number | null;
  abu: number | null;
  tdn: number | null;
  de: number | null;
  me: number | null;
  ndf: number | null;
  adf: number | null;
  ca: number | null;
  p: number | null;
  mg: number | null;
  k: number | null;
  na: number | null;
  cl: number | null;
  s: number | null;

  // ── Kelompok Komponen Bernama — array kosong jika belum ada data ──────────
  vitamin: NutrisiKomponenBernama[];
  mineral: NutrisiKomponenBernama[];
  asamAmino: NutrisiKomponenBernama[];
  traceMineral: NutrisiKomponenBernama[];
  additive: NutrisiKomponenBernama[];

  // ── Metadata ───────────────────────────────────────────────────────────────
  sumberData: SumberDataNutrisi;
  /** ISO date — tanggal data nutrisi ini terakhir diperbarui. */
  updatedAt: string;
}

/** Sentinel untuk `updatedAt` saat produk belum pernah punya data nutrisi apa pun (bukan tanggal ISO valid). */
const BELUM_ADA_DATA = 'BELUM_ADA_DATA' as const;

const PARAMETER_SKALAR: ParameterNutrisiSkalar[] = [
  'bk', 'pk', 'lk', 'sk', 'abu', 'tdn', 'de', 'me', 'ndf', 'adf', 'ca', 'p', 'mg', 'k', 'na', 'cl', 's',
];

const KELOMPOK_KOMPONEN = ['vitamin', 'mineral', 'asamAmino', 'traceMineral', 'additive'] as const;

/** Bentuk kosong (semua NULL/array kosong) — titik awal saat produk belum punya data nutrisi terisi. */
function nutrisiKosong(produkUuid: string, sumberData: SumberDataNutrisi, updatedAt: string): NutrisiStandarProdukKomersial {
  return {
    produkUuid,
    bk: null, pk: null, lk: null, sk: null, abu: null, tdn: null, de: null, me: null,
    ndf: null, adf: null, ca: null, p: null, mg: null, k: null, na: null, cl: null, s: null,
    vitamin: [], mineral: [], asamAmino: [], traceMineral: [], additive: [],
    sumberData, updatedAt,
  };
}

// ─── Adapter: Konsentrat ───────────────────────────────────────────────────────
// Living Database Konsentrat (PK-004) sudah memiliki data nutrisi per produk
// (KonsentratDetail.nutrisi), namun dalam bentuk khusus kategori Konsentrat.
// Adapter ini MEMETAKAN (bukan mengarang) field yang benar-benar tercantum ke
// struktur standar PK-007. Field yang tidak punya padanan langsung (mis. BK,
// DE, NDF, ADF, Mg, K, Na, Cl, S) dibiarkan NULL — tidak dihitung/diestimasi.

function petakanNutrisiKonsentrat(): Map<string, NutrisiStandarProdukKomersial> {
  const hasil = new Map<string, NutrisiStandarProdukKomersial>();

  for (const detail of KONSENTRAT_DETAIL_LIST) {
    const n = detail.nutrisi;
    const vitamin: NutrisiKomponenBernama[] = [];
    if (n.vitaminA != null) vitamin.push({ nama: 'Vitamin A', nilai: n.vitaminA, satuan: 'IU/kg' });
    if (n.vitaminD3 != null) vitamin.push({ nama: 'Vitamin D3', nilai: n.vitaminD3, satuan: 'IU/kg' });
    if (n.vitaminE != null) vitamin.push({ nama: 'Vitamin E', nilai: n.vitaminE, satuan: 'mg/kg' });

    const mineral: NutrisiKomponenBernama[] = [];
    if (n.garam != null) mineral.push({ nama: 'Garam (NaCl)', nilai: n.garam, satuan: '%' });
    if (n.mineralTotal != null) mineral.push({ nama: 'Mineral Total', nilai: n.mineralTotal, satuan: '%' });

    hasil.set(detail.seriId, {
      produkUuid: detail.seriId,
      bk: null,
      pk: n.proteinKasar ?? null,
      lk: n.lemakKasar ?? null,
      sk: n.seratKasar ?? null,
      abu: n.abu ?? null,
      tdn: n.tdn ?? null,
      de: null,
      me: n.me ?? null,
      ndf: null,
      adf: null,
      ca: n.kalsium ?? null,
      p: n.fosfor ?? null,
      mg: null,
      k: null,
      na: null,
      cl: null,
      s: null,
      vitamin,
      mineral,
      asamAmino: [],
      traceMineral: [],
      additive: [],
      sumberData: 'Website Resmi Produsen',
      updatedAt: detail.updatedAt,
    });
  }

  return hasil;
}

// Registry hidup — dibangun sekali dari Living Database saat pertama kali
// diakses (lazy), bukan saat modul dimuat. Lazy init mencegah TDZ crash
// di production bundle saat Rollup menempatkan konsentratDetailData setelah
// modul ini dalam urutan eksekusi chunk yang sama.
let _nutrisiMap: Map<string, NutrisiStandarProdukKomersial> | null = null;
function getNutrisiMap(): Map<string, NutrisiStandarProdukKomersial> {
  if (!_nutrisiMap) _nutrisiMap = petakanNutrisiKonsentrat();
  return _nutrisiMap;
}

// ─── Riwayat Perubahan Nutrisi ─────────────────────────────────────────────────
// PK-007 mensyaratkan setiap perubahan data nutrisi oleh Admin tercatat.
// produkUuid pada entri riwayat maupun pada record nutrisi TIDAK PERNAH
// berubah — hanya nilai nutrisinya yang bisa diperbarui.

export interface RiwayatPerubahanNutrisi {
  /** UUID entri riwayat ini (bukan UUID produk). */
  id: string;
  /** UUID produk yang datanya diubah — permanen. */
  produkUuid: string;
  /** Nama field yang diubah, mis. 'pk', 'vitamin'. */
  field: string;
  nilaiSebelum: unknown;
  nilaiSesudah: unknown;
  diubahOleh: string;
  waktuPerubahan: string; // ISO date-time
}

const RIWAYAT_PERUBAHAN_NUTRISI: RiwayatPerubahanNutrisi[] = [];

/** Riwayat perubahan nutrisi untuk satu produk, terbaru lebih dulu. */
export function getRiwayatPerubahanNutrisi(produkUuid: string): RiwayatPerubahanNutrisi[] {
  return RIWAYAT_PERUBAHAN_NUTRISI
    .filter(r => r.produkUuid === produkUuid)
    .sort((a, b) => b.waktuPerubahan.localeCompare(a.waktuPerubahan));
}

// ─── API Publik — Baca ─────────────────────────────────────────────────────────

/**
 * Ambil struktur nutrisi standar satu produk via UUID.
 * Mengembalikan bentuk kosong (semua NULL) — bukan undefined — jika produk
 * belum memiliki data nutrisi apa pun, agar konsumen (Formula/AI/Analisis)
 * selalu menerima bentuk yang konsisten.
 */
export function getNutrisiStandarByUUID(produkUuid: string): NutrisiStandarProdukKomersial {
  return getNutrisiMap().get(produkUuid) ?? nutrisiKosong(produkUuid, 'Input Admin', BELUM_ADA_DATA);
}

/** Seluruh struktur nutrisi yang sudah terdaftar (live), untuk keperluan Perbandingan Produk. */
export function getAllNutrisiStandar(): NutrisiStandarProdukKomersial[] {
  return Array.from(getNutrisiMap().values());
}

// ─── API Publik — Perbarui (Admin) ─────────────────────────────────────────────

/** Normalisasi satu nilai skalar: number valid tetap apa adanya; undefined/NaN/Infinity/null -> null (bukan 0). */
function normalisasiSkalar(nilai: number | null | undefined): number | null {
  if (nilai == null) return null;
  if (typeof nilai !== 'number' || Number.isNaN(nilai) || !Number.isFinite(nilai)) return null;
  return nilai;
}

/** Normalisasi satu daftar komponen bernama: buang entri tidak valid, normalisasi nilai skalarnya. */
function normalisasiKomponen(list: NutrisiKomponenBernama[] | null | undefined): NutrisiKomponenBernama[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item): item is NutrisiKomponenBernama => !!item && typeof item.nama === 'string' && typeof item.satuan === 'string')
    .map(item => ({ nama: item.nama, satuan: item.satuan, nilai: normalisasiSkalar(item.nilai) }));
}

/** Bandingkan dua nilai skalar nullable — true jika berbeda. */
function skalarBerbeda(a: number | null, b: number | null): boolean {
  return a !== b;
}

/** Bandingkan dua daftar komponen bernama secara terstruktur (bukan JSON.stringify) — true jika berbeda. */
function komponenBerbeda(a: NutrisiKomponenBernama[], b: NutrisiKomponenBernama[]): boolean {
  if (a.length !== b.length) return true;
  return a.some((item, i) => item.nama !== b[i].nama || item.satuan !== b[i].satuan || item.nilai !== b[i].nilai);
}

/**
 * Admin memperbarui satu atau beberapa parameter nutrisi produk. UUID produk
 * tidak pernah berubah. Setiap field yang benar-benar berubah nilainya
 * dicatat sebagai satu entri Riwayat Perubahan Nutrisi.
 *
 * Input dinormalisasi sebelum disimpan: field skalar yang undefined/NaN/
 * Infinity disimpan sebagai NULL (bukan 0 atau nilai tidak valid), dan daftar
 * komponen bernama divalidasi bentuknya. Perbandingan sebelum/sesudah
 * dilakukan per-field secara eksplisit (bukan JSON.stringify) agar akurat
 * untuk semua kasus nilai numerik.
 *
 * Tidak melakukan perhitungan/analisis apa pun — murni pembaruan data.
 */
export function updateNutrisiStandar(
  produkUuid: string,
  perubahan: Partial<Omit<NutrisiStandarProdukKomersial, 'produkUuid'>>,
  diubahOleh: string,
  sekarang: string,
): NutrisiStandarProdukKomersial {
  const sebelum = getNutrisiStandarByUUID(produkUuid);
  const sesudah: NutrisiStandarProdukKomersial = { ...sebelum, produkUuid, updatedAt: sekarang };

  const perubahanTercatat: { field: string; nilaiSebelum: unknown; nilaiSesudah: unknown }[] = [];

  for (const key of Object.keys(perubahan) as (keyof typeof perubahan)[]) {
    if (!(key in perubahan) || perubahan[key] === undefined) continue;

    if ((PARAMETER_SKALAR as string[]).includes(key as string)) {
      const nilaiBaru = normalisasiSkalar(perubahan[key] as number | null | undefined);
      const nilaiLama = sebelum[key as ParameterNutrisiSkalar];
      (sesudah as any)[key] = nilaiBaru;
      if (skalarBerbeda(nilaiLama, nilaiBaru)) {
        perubahanTercatat.push({ field: String(key), nilaiSebelum: nilaiLama, nilaiSesudah: nilaiBaru });
      }
      continue;
    }

    if ((KELOMPOK_KOMPONEN as readonly string[]).includes(key as string)) {
      const listBaru = normalisasiKomponen(perubahan[key] as NutrisiKomponenBernama[] | null | undefined);
      const listLama = sebelum[key as typeof KELOMPOK_KOMPONEN[number]];
      (sesudah as any)[key] = listBaru;
      if (komponenBerbeda(listLama, listBaru)) {
        perubahanTercatat.push({ field: String(key), nilaiSebelum: listLama, nilaiSesudah: listBaru });
      }
      continue;
    }

    // Field metadata (mis. sumberData) — bandingkan langsung.
    const nilaiLama = sebelum[key as keyof NutrisiStandarProdukKomersial];
    const nilaiBaru = perubahan[key];
    (sesudah as any)[key] = nilaiBaru;
    if (nilaiLama !== nilaiBaru) {
      perubahanTercatat.push({ field: String(key), nilaiSebelum: nilaiLama, nilaiSesudah: nilaiBaru });
    }
  }

  for (const p of perubahanTercatat) {
    RIWAYAT_PERUBAHAN_NUTRISI.push({
      id: generateUUID(),
      produkUuid,
      field: p.field,
      nilaiSebelum: p.nilaiSebelum,
      nilaiSesudah: p.nilaiSesudah,
      diubahOleh,
      waktuPerubahan: sekarang,
    });
  }

  getNutrisiMap().set(produkUuid, sesudah);
  return sesudah;
}
