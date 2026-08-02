// ─── PK-014 — AI Readiness: Produk Komersial ─────────────────────────────────
// Menyiapkan konteks terstruktur agar AI Nutrisi TernakHub dapat:
//   • Menjelaskan fungsi dan komposisi produk
//   • Membandingkan produk berdasarkan kandungan nutrisi
//   • Merekomendasikan produk sesuai tujuan pemeliharaan
//   • Memberikan alternatif produk apabila suatu produk tidak tersedia
//   • Mengidentifikasi keunggulan dan keterbatasan
//
// TIDAK mengimplementasikan AI Chat, API AI, atau embedding.
// Seluruh relasi menggunakan UUID (PK-000A).
//
// Sumber data:
//   1. Living Database: konsentratMerekData, konsentratSeriData, konsentratDetailData
//   2. Knowledge Base: knowledgeBasePKData (PK-013)
//   3. Referensi Resmi: tersimpan dalam ArtikelKB[].referensiResmi
//   4. Data Nutrisi: konsentratDetailData.NutrisiKonsentrat

import { KONSENTRAT_MEREK_LIST } from './konsentratMerekData';
import { KONSENTRAT_SERI_LIST } from './konsentratSeriData';
import {
  KONSENTRAT_DETAIL_LIST,
  type KonsentratDetail,
} from './konsentratDetailData';
import {
  getActiveArticles,
  getArtikelByProdukId,
  type ArtikelKB,
} from './knowledgeBasePKData';
import { KATEGORI_UUID } from './produkKomersialData';

// ─── Tipe: Konteks AI ─────────────────────────────────────────────────────────

/**
 * Informasi merek — denormalized dari KonsentratMerek.
 * Semua relasi ke merek menggunakan brandUUID (PK-000A), bukan nama.
 */
export interface AIKonteksMerek {
  /** UUID v4 permanen — identitas merek (PK-000A) */
  uuid: string;
  nama: string;
  produsen: string;
  negaraAsal: string;
  deskripsi: string;
  jumlahSeri: number;
}

/**
 * Kandungan nutrisi dengan unit satuan baked-in di nama field.
 * Memudahkan AI membaca nilai tanpa perlu tabel konversi terpisah.
 *
 * Seluruh nilai adalah per bahan kering kecuali kadarAir (as-fed).
 * Gunakan hanya nilai yang tersedia — jangan estimasi nilai kosong.
 */
export interface AIKonteksNutrisi {
  /** Protein Kasar — % Bahan Kering */
  proteinKasar_pct?: number;
  /** Total Digestible Nutrients — % Bahan Kering */
  tdn_pct?: number;
  /** Energi Metabolis — Mcal/kg */
  me_mcalPerKg?: number;
  /** Lemak Kasar — % Bahan Kering */
  lemakKasar_pct?: number;
  /** Serat Kasar — % Bahan Kering */
  seratKasar_pct?: number;
  /** Abu — % Bahan Kering */
  abu_pct?: number;
  /** Kalsium — % Bahan Kering */
  kalsium_pct?: number;
  /** Fosfor — % Bahan Kering */
  fosfor_pct?: number;
  /** Kadar Air — % As-Fed */
  kadarAir_pct?: number;
  /** Garam (NaCl) — % Bahan Kering */
  garam_pct?: number;
  /** Total Mineral — % Bahan Kering */
  mineralTotal_pct?: number;
  /** Vitamin A — IU/kg */
  vitaminA_iuPerKg?: number;
  /** Vitamin D3 — IU/kg */
  vitaminD3_iuPerKg?: number;
  /** Vitamin E — mg/kg */
  vitaminE_mgPerKg?: number;
  /** Catatan teknis tambahan dari produsen */
  catatanNutrisi?: string;
}

/**
 * Artikel Knowledge Base yang sudah di-flatten untuk konsumsi AI.
 * Sumber data tepercaya — catatan lapangan, cara penggunaan, FAQ.
 */
export interface AIKonteksArtikel {
  /** UUID v4 artikel (PK-000A) */
  uuid: string;
  topik: string;
  judul: string;
  ringkasan?: string;
  fungsi?: string;
  keunggulan?: string;
  keterbatasan?: string;
  targetPenggunaan?: string;
  caraPenggunaan?: string;
  catatanLapangan?: string;
  faq: Array<{ pertanyaan: string; jawaban: string }>;
  /** Sumber referensi resmi — dasar klaim teknis */
  referensiResmi: Array<{ judul: string; penerbit?: string; tahun?: string; url?: string }>;
  /** Jenis sumber informasi yang digunakan */
  sumberInformasi: string[];
}

/**
 * Metadata kelengkapan data untuk satu produk.
 * AI harus memeriksa ini sebelum membuat klaim — jangan klaim data yang adaXxx = false.
 */
export interface AIKelengkapanData {
  adaDetail: boolean;
  adaNutrisi: boolean;
  adaKomposisi: boolean;
  adaPetunjukPenggunaan: boolean;
  adaArtikelKB: boolean;
  jumlahArtikelKB: number;
  topikTercakup: string[];
}

/**
 * Konteks AI lengkap untuk satu produk konsentrat komersial.
 *
 * Seluruh data denormalized dari:
 *   • KonsentratMerek → brand.*
 *   • KonsentratSeri → namaSeri, targetTernak, fasePemeliharaan, dst.
 *   • KonsentratDetail → nutrisi, komposisi, petunjukPenggunaan, dst.
 *   • Knowledge Base → artikelKB[]
 *
 * Semua identitas menggunakan UUID (PK-000A). Nama/label hanya untuk display.
 */
export interface AIKonteksProduk {
  // ── Identitas UUID (PK-000A) ──────────────────────────────────────────────
  /** UUID seri produk — gunakan untuk semua referensi silang */
  seriUUID: string;
  /** UUID detail produk (undefined jika detail belum tersedia) */
  detailUUID?: string;
  /** UUID brand/merek */
  brandUUID: string;
  /** UUID kategori produk */
  kategoriUUID: string;

  // ── Brand ──────────────────────────────────────────────────────────────────
  brand: AIKonteksMerek;

  // ── Identitas Produk ──────────────────────────────────────────────────────
  namaSeri: string;
  namaProduk: string;
  /** Deskripsi singkat fungsi/kegunaan seri dari catalog */
  deskripsiSeri: string;
  statusProduksi: string;

  // ── Target & Fase ──────────────────────────────────────────────────────────
  /** Deskripsi hewan target — mis. "Sapi Perah Laktasi" */
  targetTernak: string;
  /** Fase pemeliharaan — mis. "Laktasi Awal–Puncak" */
  fasePemeliharaan: string;
  bentukProduk: string;

  // ── Data Teknis (dari Detail — mungkin tidak tersedia) ────────────────────
  jenisProduk?: string;
  /** Bahan-bahan utama sesuai label resmi produsen */
  komposisi?: string[];
  /** Kandungan nutrisi dengan unit eksplisit */
  nutrisi?: AIKonteksNutrisi;
  petunjukPenggunaan?: {
    caraPemberian: string;
    dosis: string;
    targetPenggunaan: string;
    catatan?: string;
  };
  kemasan?: Array<{ berat: string; keterangan?: string }>;
  produsen?: {
    nama: string;
    negaraAsal: string;
    website?: string;
  };
  /** Catatan teknis dari data entry */
  catatanTeknis?: string;

  // ── Knowledge Base ────────────────────────────────────────────────────────
  /** Artikel KB aktif yang terhubung ke produk ini */
  artikelKB: AIKonteksArtikel[];

  // ── Kelengkapan Data ──────────────────────────────────────────────────────
  /** Periksa sebelum membuat klaim — jangan klaim data yang tidak tersedia */
  kelengkapanData: AIKelengkapanData;

  updatedAt: string;
}

/**
 * Katalog AI lengkap — snapshot seluruh Living Database Produk Komersial.
 * Gunakan untuk sesi AI yang membutuhkan konteks lintas produk (perbandingan, rekomendasi).
 */
export interface AIKatalogPK {
  meta: {
    /** ISO timestamp saat katalog dibangun */
    dibuatPada: string;
    versiSkema: string;
    totalProduk: number;
    totalBrand: number;
    totalArtikelKB: number;
    cakupanData: {
      /** Jumlah produk yang memiliki data detail */
      produkDenganDetail: number;
      /** Jumlah produk yang memiliki data nutrisi */
      produkDenganNutrisi: number;
      /** Jumlah produk yang memiliki data komposisi */
      produkDenganKomposisi: number;
      /** Jumlah produk yang memiliki minimal 1 artikel KB */
      produkDenganArtikelKB: number;
    };
  };
  panduan: typeof PANDUAN_AI_PK;
  produk: AIKonteksProduk[];
}

// ─── Panduan AI ───────────────────────────────────────────────────────────────

/**
 * Panduan resmi untuk AI TernakHub dalam menggunakan data Produk Komersial.
 * Wajib disertakan dalam system prompt atau konteks awal sesi AI.
 */
export const PANDUAN_AI_PK = {
  versi: '1.0.0',
  modul: 'Produk Komersial — TernakHub (PK-014)',
  bahasa: 'Bahasa Indonesia',

  tujuan:
    'Menyediakan konteks terstruktur agar AI dapat menjelaskan, membandingkan, ' +
    'dan merekomendasikan produk pakan konsentrat komersial untuk ternak ruminansia ' +
    'berdasarkan data Living Database TernakHub.',

  sumberDataTersedia: [
    { id: 'living-db',    label: 'Living Database',  deskripsi: 'Merek, seri, dan detail produk dari registry UUID PK-000A' },
    { id: 'knowledge-base', label: 'Knowledge Base', deskripsi: 'Artikel teknis terstruktur: ringkasan, cara penggunaan, catatan lapangan, FAQ (PK-013)' },
    { id: 'nutrisi',      label: 'Data Nutrisi',     deskripsi: 'Kandungan nutrisi per produk: PK, TDN, ME, lemak, serat, mineral, vitamin' },
    { id: 'komposisi',    label: 'Komposisi',        deskripsi: 'Daftar bahan baku utama sesuai label resmi produsen' },
    { id: 'referensi',    label: 'Referensi Resmi',  deskripsi: 'Brosur, data sheet, dan sumber resmi terlampir pada artikel KB' },
  ],

  kemampuanAI: [
    { kode: 'CAP-01', label: 'Jelaskan Fungsi',         panduan: 'Gunakan field deskripsiSeri, artikelKB[topik=Ringkasan Produk].ringkasan, dan artikelKB[topik=Fungsi].fungsi' },
    { kode: 'CAP-02', label: 'Bandingkan Produk',       panduan: 'Bandingkan nutrisi.proteinKasar_pct, nutrisi.tdn_pct, nutrisi.me_mcalPerKg antar produk dengan targetTernak dan fasePemeliharaan serupa' },
    { kode: 'CAP-03', label: 'Rekomendasi',             panduan: 'Filter produk berdasarkan targetTernak dan fasePemeliharaan, urutkan berdasarkan kelengkapan data dan status produksi' },
    { kode: 'CAP-04', label: 'Cari Alternatif',         panduan: 'Cari produk dengan targetTernak dan fasePemeliharaan serupa dari brand berbeda menggunakan getAlternatifProduk()' },
    { kode: 'CAP-05', label: 'Keunggulan & Kelemahan',  panduan: 'Gunakan artikelKB[topik=Keunggulan].keunggulan dan artikelKB[topik=Keterbatasan].keterbatasan — jangan mengarang' },
    { kode: 'CAP-06', label: 'Jelaskan Nutrisi',        panduan: 'Gunakan nutrisi.* dengan satuan eksplisit dari nama field (mis. _pct = %, _mcalPerKg = Mcal/kg)' },
    { kode: 'CAP-07', label: 'Cara Penggunaan',         panduan: 'Gunakan petunjukPenggunaan dan artikelKB[topik=Cara Penggunaan].caraPenggunaan' },
    { kode: 'CAP-08', label: 'Jawab FAQ',               panduan: 'Cari jawaban dari artikelKB[].faq[] terlebih dahulu sebelum menggunakan pengetahuan umum' },
    { kode: 'CAP-09', label: 'Catatan Lapangan',        panduan: 'Gunakan artikelKB[topik=Catatan Lapangan].catatanLapangan — pengalaman nyata peternak' },
  ],

  batasan: [
    { kode: 'LIM-01', aturan: 'Jangan mengarang nilai nutrisi — hanya gunakan nilai yang tersedia di field nutrisi.*' },
    { kode: 'LIM-02', aturan: 'Jika field kosong/undefined, nyatakan "data tidak tersedia" bukan membuat estimasi' },
    { kode: 'LIM-03', aturan: 'Seluruh klaim komposisi harus bersumber dari field komposisi — bukan pengetahuan umum' },
    { kode: 'LIM-04', aturan: 'Rekomendasi hanya boleh didasarkan pada targetTernak dan fasePemeliharaan yang tercatat' },
    { kode: 'LIM-05', aturan: 'Perbandingan harga tidak tersedia — jangan membuat estimasi harga apapun' },
    { kode: 'LIM-06', aturan: 'Periksa kelengkapanData sebelum membuat klaim — jangan klaim data yang adaXxx = false' },
    { kode: 'LIM-07', aturan: 'Jangan menyebut produk yang statusProduksi = Arsip sebagai rekomendasi aktif' },
    { kode: 'LIM-08', aturan: 'Gunakan UUID untuk referensi silang, bukan nama produk — nama boleh berubah, UUID tidak' },
  ],

  petunjukMembacaSkema: {
    seriUUID:         'ID permanen produk — gunakan untuk semua referensi silang',
    brandUUID:        'ID permanen brand — gunakan untuk grouping lintas produk',
    kategoriUUID:     'ID permanen kategori — saat ini hanya "Konsentrat"',
    targetTernak:     'String deskripsi hewan target (mis. "Sapi Perah Laktasi") — untuk filter rekomendasi',
    fasePemeliharaan: 'String deskripsi fase (mis. "Laktasi Puncak") — untuk filter rekomendasi',
    'nutrisi.*_pct':  'Nilai numerik dalam persen (%) dari Bahan Kering kecuali kadarAir (as-fed)',
    'nutrisi.*_mcalPerKg': 'Nilai energi metabolis dalam Mcal/kg',
    'nutrisi.*_iuPerKg':   'Nilai vitamin dalam IU/kg',
    'nutrisi.*_mgPerKg':   'Nilai vitamin E dalam mg/kg',
    komposisi:        'Array string — bahan baku utama sesuai label resmi, tanpa persentase kecuali tercantum',
    artikelKB:        'Array artikel Knowledge Base aktif — sumber informasi teknis terpercaya',
    kelengkapanData:  'Metadata ketersediaan — periksa adaXxx sebelum membuat klaim tentang field tersebut',
  },
} as const;

// ─── Helper Internal ──────────────────────────────────────────────────────────

function mapNutrisi(n: KonsentratDetail['nutrisi']): AIKonteksNutrisi {
  const r: AIKonteksNutrisi = {};
  if (n.proteinKasar !== undefined)  r.proteinKasar_pct   = n.proteinKasar;
  if (n.tdn !== undefined)           r.tdn_pct            = n.tdn;
  if (n.me !== undefined)            r.me_mcalPerKg       = n.me;
  if (n.lemakKasar !== undefined)    r.lemakKasar_pct     = n.lemakKasar;
  if (n.seratKasar !== undefined)    r.seratKasar_pct     = n.seratKasar;
  if (n.abu !== undefined)           r.abu_pct            = n.abu;
  if (n.kalsium !== undefined)       r.kalsium_pct        = n.kalsium;
  if (n.fosfor !== undefined)        r.fosfor_pct         = n.fosfor;
  if (n.kadarAir !== undefined)      r.kadarAir_pct       = n.kadarAir;
  if (n.garam !== undefined)         r.garam_pct          = n.garam;
  if (n.mineralTotal !== undefined)  r.mineralTotal_pct   = n.mineralTotal;
  if (n.vitaminA !== undefined)      r.vitaminA_iuPerKg   = n.vitaminA;
  if (n.vitaminD3 !== undefined)     r.vitaminD3_iuPerKg  = n.vitaminD3;
  if (n.vitaminE !== undefined)      r.vitaminE_mgPerKg   = n.vitaminE;
  if (n.catatanNutrisi)              r.catatanNutrisi     = n.catatanNutrisi;
  return r;
}

function hasNilaiNutrisi(n: AIKonteksNutrisi): boolean {
  const keys: (keyof AIKonteksNutrisi)[] = [
    'proteinKasar_pct','tdn_pct','me_mcalPerKg','lemakKasar_pct',
    'seratKasar_pct','abu_pct','kalsium_pct','fosfor_pct',
  ];
  return keys.some(k => n[k] !== undefined);
}

function mapArtikel(a: ArtikelKB): AIKonteksArtikel {
  return {
    uuid: a.id,
    topik: a.topik,
    judul: a.judul,
    ringkasan: a.ringkasan,
    fungsi: a.fungsi,
    keunggulan: a.keunggulan,
    keterbatasan: a.keterbatasan,
    targetPenggunaan: a.targetPenggunaan,
    caraPenggunaan: a.caraPenggunaan,
    catatanLapangan: a.catatanLapangan,
    faq: (a.faq ?? []).map(f => ({ pertanyaan: f.pertanyaan, jawaban: f.jawaban })),
    referensiResmi: (a.referensiResmi ?? []).map(r => ({
      judul: r.judul,
      penerbit: r.penerbit,
      tahun: r.tahun,
      url: r.url,
    })),
    sumberInformasi: a.sumberInformasi ?? [],
  };
}

// ─── Builder Functions ────────────────────────────────────────────────────────

/**
 * Bangun konteks AI lengkap untuk satu produk berdasarkan seriUUID.
 *
 * Semua relasi diselesaikan dari UUID (PK-000A).
 * Hasilnya denormalized — siap dikonsumsi AI tanpa join tambahan.
 *
 * @returns AIKonteksProduk, atau null jika seriUUID tidak dikenali.
 */
export function buildKonteksProduk(seriUUID: string): AIKonteksProduk | null {
  const seri = KONSENTRAT_SERI_LIST.find(s => s.uuid === seriUUID);
  if (!seri) return null;

  const merek = KONSENTRAT_MEREK_LIST.find(m => m.uuid === seri.brandId);
  const detail = KONSENTRAT_DETAIL_LIST.find(d => d.seriId === seriUUID);
  const artikelKBRaw = getArtikelByProdukId(seriUUID);

  const brand: AIKonteksMerek = merek
    ? {
        uuid: merek.uuid,
        nama: merek.nama,
        produsen: merek.produsen,
        negaraAsal: merek.negaraAsal,
        deskripsi: merek.deskripsi,
        jumlahSeri: merek.jumlahSeri,
      }
    : {
        uuid: seri.brandId,
        nama: seri.brandSlug,
        produsen: '',
        negaraAsal: '',
        deskripsi: '',
        jumlahSeri: 0,
      };

  const artikelKB = artikelKBRaw.map(mapArtikel);
  const topikTercakup = [...new Set(artikelKB.map(a => a.topik))];

  let nutrisi: AIKonteksNutrisi | undefined;
  let adaNutrisi = false;
  if (detail) {
    const mapped = mapNutrisi(detail.nutrisi);
    if (hasNilaiNutrisi(mapped)) {
      nutrisi = mapped;
      adaNutrisi = true;
    }
  }

  const kelengkapanData: AIKelengkapanData = {
    adaDetail: !!detail,
    adaNutrisi,
    adaKomposisi: !!(detail?.komposisi && detail.komposisi.length > 0),
    adaPetunjukPenggunaan: !!(detail?.petunjukPenggunaan?.caraPemberian),
    adaArtikelKB: artikelKB.length > 0,
    jumlahArtikelKB: artikelKB.length,
    topikTercakup,
  };

  const konteks: AIKonteksProduk = {
    seriUUID: seri.uuid,
    detailUUID: detail?.uuid,
    brandUUID: seri.brandId,
    kategoriUUID: KATEGORI_UUID['konsentrat'],

    brand,
    namaSeri: seri.namaSeri,
    namaProduk: seri.namaProduk,
    deskripsiSeri: seri.deskripsi,
    statusProduksi: seri.statusProduksi,
    targetTernak: seri.targetTernak,
    fasePemeliharaan: detail?.fasePemeliharaan ?? '',
    bentukProduk: seri.bentukProduk,

    ...(detail && {
      jenisProduk: detail.jenisProduk,
      komposisi: detail.komposisi,
      nutrisi,
      petunjukPenggunaan: detail.petunjukPenggunaan,
      kemasan: detail.kemasan,
      produsen: detail.produsen,
      catatanTeknis: detail.catatan,
    }),

    artikelKB,
    kelengkapanData,
    updatedAt: detail?.updatedAt ?? seri.updatedAt,
  };

  return konteks;
}

/**
 * Bangun katalog AI lengkap dari seluruh Living Database Produk Komersial.
 *
 * Gunakan untuk sesi AI yang membutuhkan konteks seluruh produk
 * (perbandingan, rekomendasi, pencarian alternatif).
 */
export function buildKatalogAI(): AIKatalogPK {
  const semua = KONSENTRAT_SERI_LIST
    .map(s => buildKonteksProduk(s.uuid))
    .filter((k): k is AIKonteksProduk => k !== null);

  const aktifArtikel = getActiveArticles();

  const cakupan = {
    produkDenganDetail:     semua.filter(p => p.kelengkapanData.adaDetail).length,
    produkDenganNutrisi:    semua.filter(p => p.kelengkapanData.adaNutrisi).length,
    produkDenganKomposisi:  semua.filter(p => p.kelengkapanData.adaKomposisi).length,
    produkDenganArtikelKB:  semua.filter(p => p.kelengkapanData.adaArtikelKB).length,
  };

  return {
    meta: {
      dibuatPada: new Date().toISOString(),
      versiSkema: PANDUAN_AI_PK.versi,
      totalProduk: semua.length,
      totalBrand: new Set(semua.map(p => p.brandUUID)).size,
      totalArtikelKB: aktifArtikel.length,
      cakupanData: cakupan,
    },
    panduan: PANDUAN_AI_PK,
    produk: semua,
  };
}

/**
 * Cari semua produk yang cocok untuk target ternak tertentu.
 * Pencocokan case-insensitive partial match.
 *
 * @example getKonteksUntukTargetTernak('sapi perah')
 */
export function getKonteksUntukTargetTernak(targetTernak: string): AIKonteksProduk[] {
  const q = targetTernak.toLowerCase();
  return KONSENTRAT_SERI_LIST
    .filter(s => s.targetTernak.toLowerCase().includes(q) && s.statusProduksi === 'Aktif')
    .map(s => buildKonteksProduk(s.uuid))
    .filter((k): k is AIKonteksProduk => k !== null);
}

/**
 * Cari semua produk yang cocok untuk fase pemeliharaan tertentu.
 * Mencocokkan pada fasePemeliharaan dari data detail.
 *
 * @example getKonteksUntukFase('laktasi')
 */
export function getKonteksUntukFase(fasePemeliharaan: string): AIKonteksProduk[] {
  const q = fasePemeliharaan.toLowerCase();
  return KONSENTRAT_SERI_LIST
    .map(s => buildKonteksProduk(s.uuid))
    .filter((k): k is AIKonteksProduk => k !== null)
    .filter(k =>
      k.statusProduksi === 'Aktif' &&
      (k.fasePemeliharaan.toLowerCase().includes(q) ||
       k.targetTernak.toLowerCase().includes(q))
    );
}

/**
 * Cari alternatif produk yang memiliki target ternak dan/atau fase serupa
 * dengan produk yang diberikan, dari brand yang berbeda.
 *
 * Gunakan ketika produk tidak tersedia dan AI perlu merekomendasikan pengganti.
 *
 * @param seriUUID  UUID produk yang dicari alternatifnya
 * @param maxHasil  Jumlah maksimal alternatif (default: 5)
 */
export function getAlternatifProduk(seriUUID: string, maxHasil = 5): AIKonteksProduk[] {
  const sumber = buildKonteksProduk(seriUUID);
  if (!sumber) return [];

  const qTarget = sumber.targetTernak.toLowerCase();
  const qFase   = sumber.fasePemeliharaan.toLowerCase();

  return KONSENTRAT_SERI_LIST
    .filter(s => s.uuid !== seriUUID && s.statusProduksi === 'Aktif' && s.brandId !== sumber.brandUUID)
    .map(s => buildKonteksProduk(s.uuid))
    .filter((k): k is AIKonteksProduk => k !== null)
    .map(k => {
      // Hitung skor kemiripan — makin tinggi makin mirip
      let skor = 0;
      if (k.targetTernak.toLowerCase().includes(qTarget) ||
          qTarget.includes(k.targetTernak.toLowerCase())) skor += 2;
      if (qFase && k.fasePemeliharaan.toLowerCase().includes(qFase)) skor += 1;
      if (k.kelengkapanData.adaNutrisi) skor += 1;
      if (k.kelengkapanData.adaArtikelKB) skor += 1;
      return { k, skor };
    })
    .filter(({ skor }) => skor > 0)
    .sort((a, b) => b.skor - a.skor)
    .slice(0, maxHasil)
    .map(({ k }) => k);
}

/**
 * Bandingkan dua produk secara berdampingan.
 * Mengembalikan objek dengan kedua konteks dan diff ringkasan nutrisi.
 *
 * @returns null jika salah satu UUID tidak dikenali
 */
export function bandingkanProduk(
  seriUUIDA: string,
  seriUUIDB: string,
): { produkA: AIKonteksProduk; produkB: AIKonteksProduk; perbedaanNutrisi: Record<string, { a?: number; b?: number; selisih?: number }> } | null {
  const a = buildKonteksProduk(seriUUIDA);
  const b = buildKonteksProduk(seriUUIDB);
  if (!a || !b) return null;

  type NKey = keyof AIKonteksNutrisi;
  const kunci: NKey[] = [
    'proteinKasar_pct','tdn_pct','me_mcalPerKg','lemakKasar_pct',
    'seratKasar_pct','abu_pct','kalsium_pct','fosfor_pct',
    'vitaminA_iuPerKg','vitaminD3_iuPerKg','vitaminE_mgPerKg',
  ];

  const perbedaanNutrisi: Record<string, { a?: number; b?: number; selisih?: number }> = {};
  for (const k of kunci) {
    const va = a.nutrisi?.[k] as number | undefined;
    const vb = b.nutrisi?.[k] as number | undefined;
    if (va !== undefined || vb !== undefined) {
      perbedaanNutrisi[k] = {
        a: va,
        b: vb,
        selisih: va !== undefined && vb !== undefined ? +(va - vb).toFixed(3) : undefined,
      };
    }
  }

  return { produkA: a, produkB: b, perbedaanNutrisi };
}

/**
 * Hitung statistik ringkasan AI Readiness untuk seluruh katalog.
 * Berguna untuk menampilkan status kesiapan data di halaman admin.
 */
export function hitungStatistikAIReadiness() {
  const semua = KONSENTRAT_SERI_LIST
    .map(s => buildKonteksProduk(s.uuid))
    .filter((k): k is AIKonteksProduk => k !== null);

  const total = semua.length;
  if (total === 0) return null;

  const denganDetail     = semua.filter(p => p.kelengkapanData.adaDetail).length;
  const denganNutrisi    = semua.filter(p => p.kelengkapanData.adaNutrisi).length;
  const denganKomposisi  = semua.filter(p => p.kelengkapanData.adaKomposisi).length;
  const denganKB         = semua.filter(p => p.kelengkapanData.adaArtikelKB).length;
  const aktif            = semua.filter(p => p.statusProduksi === 'Aktif').length;

  // Skor kesiapan per produk: maks 5 poin
  const skorRata = semua.reduce((acc, p) => {
    let s = 0;
    if (p.kelengkapanData.adaDetail)          s++;
    if (p.kelengkapanData.adaNutrisi)         s++;
    if (p.kelengkapanData.adaKomposisi)       s++;
    if (p.kelengkapanData.adaPetunjukPenggunaan) s++;
    if (p.kelengkapanData.adaArtikelKB)       s++;
    return acc + s;
  }, 0) / total;

  return {
    totalProduk:       total,
    produkAktif:       aktif,
    denganDetail,
    denganNutrisi,
    denganKomposisi,
    denganArtikelKB:   denganKB,
    pctDetail:         Math.round((denganDetail / total) * 100),
    pctNutrisi:        Math.round((denganNutrisi / total) * 100),
    pctKomposisi:      Math.round((denganKomposisi / total) * 100),
    pctArtikelKB:      Math.round((denganKB / total) * 100),
    skorKesiapanRata:  +skorRata.toFixed(2),
    pctKesiapanGlobal: Math.round((skorRata / 5) * 100),
  };
}
