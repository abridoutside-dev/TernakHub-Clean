// ─── PK-010: Dashboard & AI Insight — Produk Komersial ───────────────────────
// Lapisan agregasi READ-ONLY khusus untuk Dashboard Produk Komersial. Mengikuti
// pola adapter PK-005/PK-006 (formulaProdukKomersialData.ts,
// stokProdukKomersialData.ts): sebuah file baru yang membaca Living Database
// yang sudah ada (KONSENTRAT_SERI_LIST, KONSENTRAT_DETAIL_LIST,
// KONSENTRAT_MEREK_LIST, PRODUK_KOMERSIAL_LIST, Nutrisi Standar) TANPA
// mengubah struktur, source code, atau arsitektur modul-modul tersebut.
//
// TIDAK ada data hardcode: seluruh angka/insight/daftar diturunkan (derived)
// live dari data yang ada. TIDAK membuat transaksi, TIDAK mengubah Formula,
// Stok, Master Pakan, atau modul lain.

import { KONSENTRAT_SERI_LIST } from './konsentratSeriData';
import { KONSENTRAT_MEREK_LIST } from './konsentratMerekData';
import { KONSENTRAT_DETAIL_LIST, getKonsentratDetailBySeriId } from './konsentratDetailData';
import { KATEGORI_UUID, PRODUK_KOMERSIAL_LIST, getKategoriSlugByUUID, KATEGORI_PRODUK_KOMERSIAL } from './produkKomersialData';
import { getNutrisiStandarByUUID } from './nutrisiProdukKomersialData';
import type { StatusEntitas } from './produkKomersialLivingDB';

// ─── Bentuk Satu Baris Produk pada Dashboard ─────────────────────────────────

export interface ProdukKomersialDashboardItem {
  /** UUID permanen produk (seriId untuk Konsentrat, id untuk kategori lain). */
  uuid: string;
  brandId: string;
  brandNama: string;
  kategoriId: string;
  kategoriSlug: string;
  kategoriNama: string;
  namaProduk: string;
  /** Status produksi apa adanya (Aktif / Tidak Diproduksi / Arsip). */
  statusProduksi: StatusEntitas;
  /** ISO date — tanggal update terakhir data produk ini. */
  updatedAt: string;
  /** Urutan penambahan relatif (index penambahan) — dipakai untuk "Produk Terbaru". Bukan tanggal, murni urutan array Living Database. */
  urutanTambah: number;

  // ── Kelengkapan data — dipakai AI Insight & Peringatan Data ───────────────
  hasNutrisi: boolean;
  hasKomposisi: boolean;
  hasKemasan: boolean;
  hasProdusen: boolean;
}

function nutrisiTerisi(uuid: string): boolean {
  const n = getNutrisiStandarByUUID(uuid);
  const adaSkalar = [n.bk, n.pk, n.lk, n.sk, n.abu, n.tdn, n.de, n.me, n.ndf, n.adf, n.ca, n.p, n.mg, n.k, n.na, n.cl, n.s]
    .some(v => v != null);
  const adaKomponen = n.vitamin.length > 0 || n.mineral.length > 0 || n.asamAmino.length > 0
    || n.traceMineral.length > 0 || n.additive.length > 0;
  return adaSkalar || adaKomponen;
}

// ─── Adapter: Konsentrat (satu-satunya kategori dengan Living Database penuh) ─

function buildFromKonsentrat(): ProdukKomersialDashboardItem[] {
  const merekByUUID = new Map(KONSENTRAT_MEREK_LIST.map(m => [m.uuid, m] as const));
  const kategoriId = KATEGORI_UUID['konsentrat'];
  const kategoriNama = KATEGORI_PRODUK_KOMERSIAL.find(k => k.uuid === kategoriId)?.nama ?? 'Konsentrat';

  return KONSENTRAT_SERI_LIST.map((seri, index) => {
    const brand = merekByUUID.get(seri.brandId);
    const detail = getKonsentratDetailBySeriId(seri.uuid);
    return {
      uuid: seri.uuid,
      brandId: seri.brandId,
      brandNama: brand?.nama ?? '—',
      kategoriId,
      kategoriSlug: 'konsentrat',
      kategoriNama,
      namaProduk: detail?.namaProduk ?? seri.namaProduk,
      statusProduksi: detail?.statusProduksi ?? seri.statusProduksi,
      updatedAt: detail?.updatedAt ?? seri.updatedAt,
      urutanTambah: index,
      hasNutrisi: nutrisiTerisi(seri.uuid),
      hasKomposisi: (detail?.komposisi?.length ?? 0) > 0,
      hasKemasan: (detail?.kemasan?.length ?? 0) > 0,
      hasProdusen: !!detail?.produsen?.nama?.trim(),
    };
  });
}

// ─── Adapter: kategori lain via PRODUK_KOMERSIAL_LIST ─────────────────────────
// Konsentrat sudah dicakup penuh oleh buildFromKonsentrat() (sumber lebih
// lengkap: seri + detail + merek) — item Konsentrat pada PRODUK_KOMERSIAL_LIST
// (jika ada) dikecualikan agar UUID tidak pernah ganda antar adapter.

function buildFromKategoriLain(): ProdukKomersialDashboardItem[] {
  const kategoriKonsentratId = KATEGORI_UUID['konsentrat'];
  return PRODUK_KOMERSIAL_LIST
    .filter(item => item.kategoriId !== kategoriKonsentratId)
    .map((item, index) => ({
      uuid: item.id,
      brandId: item.brandId,
      brandNama: item.merek,
      kategoriId: item.kategoriId,
      kategoriSlug: item.kategoriSlug,
      kategoriNama: KATEGORI_PRODUK_KOMERSIAL.find(k => k.uuid === item.kategoriId)?.nama
        ?? getKategoriSlugByUUID(item.kategoriId)
        ?? item.kategoriSlug,
      namaProduk: item.nama,
      // Kategori generik belum punya field statusProduksi wajib — item lama
      // dianggap 'Aktif' (konsisten dengan konvensi Living Database PK-009).
      statusProduksi: item.statusProduksi ?? 'Aktif',
      updatedAt: item.updatedAt,
      // Ditaruh setelah seluruh entri Konsentrat pada urutan gabungan (lihat getAllProdukKomersialDashboard).
      urutanTambah: KONSENTRAT_SERI_LIST.length + index,
      // Kategori ini belum punya struktur Komposisi sendiri (baru tersedia untuk
      // Konsentrat via KonsentratDetail.komposisi) — nutrisi tetap dibaca live
      // dari Nutrisi Standar (PK-007) karena strukturnya sudah lintas kategori.
      hasNutrisi: nutrisiTerisi(item.id),
      hasKomposisi: false,
      hasKemasan: !!item.beratKemasan,
      hasProdusen: !!item.produsen?.trim(),
    }));
}

/**
 * Seluruh Produk Komersial (semua kategori, semua status), live dari Living
 * Database. UUID ganda antar adapter (seharusnya tidak pernah terjadi berkat
 * pengecualian Konsentrat di atas) dibuang dan dicatat sebagai error.
 */
export function getAllProdukKomersialDashboard(): ProdukKomersialDashboardItem[] {
  const merged = [...buildFromKonsentrat(), ...buildFromKategoriLain()];
  const seen = new Set<string>();
  const deduped: ProdukKomersialDashboardItem[] = [];
  for (const item of merged) {
    if (seen.has(item.uuid)) {
      console.error(`[PK-010] UUID Produk Komersial ganda terdeteksi pada Dashboard: ${item.uuid} — entri diabaikan.`);
      continue;
    }
    seen.add(item.uuid);
    deduped.push(item);
  }
  return deduped;
}

// ─── Ringkasan Statistik ──────────────────────────────────────────────────────

export interface ProdukKomersialDashboardStats {
  totalBrand: number;
  totalSeriProduk: number;
  totalProduk: number;
  totalProdusen: number;
  totalProdukAktif: number;
  totalProdukTidakDiproduksi: number;
}

export function getProdukKomersialDashboardStats(): ProdukKomersialDashboardStats {
  const semua = getAllProdukKomersialDashboard();

  const totalBrand = new Set(semua.map(p => p.brandId)).size;
  // Seri/Varian (lihat docs/PRODUK_KOMERSIAL_ARCHITECTURE.md): jumlah entitas
  // pada level Seri/Varian — untuk Konsentrat = KONSENTRAT_SERI_LIST, kategori
  // lain belum punya level Seri/Varian terpisah sehingga entrinya dihitung 1:1.
  const totalSeriProduk = KONSENTRAT_SERI_LIST.length
    + PRODUK_KOMERSIAL_LIST.filter(i => i.kategoriId !== KATEGORI_UUID['konsentrat']).length;
  // Detail Produk: jumlah record spesifikasi lengkap yang benar-benar ada —
  // untuk Konsentrat = KONSENTRAT_DETAIL_LIST (bisa < jumlah seri bila ada
  // seri yang belum diisi detailnya).
  const totalProduk = KONSENTRAT_DETAIL_LIST.length
    + PRODUK_KOMERSIAL_LIST.filter(i => i.kategoriId !== KATEGORI_UUID['konsentrat']).length;
  const produsenById = new Map(PRODUK_KOMERSIAL_LIST.map(i => [i.id, i.produsen] as const));
  const totalProdusen = new Set(
    semua.map(p => {
      if (p.kategoriSlug === 'konsentrat') {
        // Konsentrat: produsen resmi dicatat per Detail Produk (PK-004); fallback
        // ke nama merek hanya jika Detail Produk belum diisi untuk seri ini.
        return getKonsentratDetailBySeriId(p.uuid)?.produsen?.nama || p.brandNama;
      }
      // Kategori lain: produsen dicatat langsung pada ProdukKomersialItem.produsen.
      return produsenById.get(p.uuid) || p.brandNama;
    })
  ).size;
  const totalProdukAktif = semua.filter(p => p.statusProduksi === 'Aktif').length;
  const totalProdukTidakDiproduksi = semua.filter(p => p.statusProduksi === 'Tidak Diproduksi').length;

  return { totalBrand, totalSeriProduk, totalProduk, totalProdusen, totalProdukAktif, totalProdukTidakDiproduksi };
}

// ─── Produk Terbaru & Produk Terakhir Diperbarui ─────────────────────────────

/** N produk yang paling baru ditambahkan (urutan penambahan pada Living Database), terbaru dulu. */
export function getProdukTerbaru(n = 5): ProdukKomersialDashboardItem[] {
  return [...getAllProdukKomersialDashboard()]
    .sort((a, b) => b.urutanTambah - a.urutanTambah)
    .slice(0, n);
}

/** N produk yang datanya paling baru diperbarui (updatedAt), terbaru dulu. */
export function getProdukTerakhirDiperbarui(n = 5): ProdukKomersialDashboardItem[] {
  return [...getAllProdukKomersialDashboard()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, n);
}

// ─── Brand Populer (jumlah produk terbanyak) ─────────────────────────────────

export interface BrandPopulerEntry {
  brandId: string;
  brandNama: string;
  jumlahProduk: number;
}

export function getBrandPopuler(n = 5): BrandPopulerEntry[] {
  const semua = getAllProdukKomersialDashboard();
  const counter = new Map<string, BrandPopulerEntry>();
  for (const p of semua) {
    const existing = counter.get(p.brandId);
    if (existing) existing.jumlahProduk += 1;
    else counter.set(p.brandId, { brandId: p.brandId, brandNama: p.brandNama, jumlahProduk: 1 });
  }
  return Array.from(counter.values())
    .sort((a, b) => b.jumlahProduk - a.jumlahProduk)
    .slice(0, n);
}

// ─── Peringatan Data (data belum lengkap) ────────────────────────────────────

export type JenisPeringatan = 'Nutrisi' | 'Komposisi' | 'Kemasan' | 'Produsen';

export interface PeringatanDataEntry {
  uuid: string;
  namaProduk: string;
  brandNama: string;
  jenis: JenisPeringatan[];
}

/** Produk dengan minimal satu bagian data yang belum lengkap. */
export function getPeringatanData(): PeringatanDataEntry[] {
  const semua = getAllProdukKomersialDashboard();
  const hasil: PeringatanDataEntry[] = [];
  for (const p of semua) {
    const jenis: JenisPeringatan[] = [];
    if (!p.hasNutrisi) jenis.push('Nutrisi');
    if (!p.hasKomposisi) jenis.push('Komposisi');
    if (!p.hasKemasan) jenis.push('Kemasan');
    if (!p.hasProdusen) jenis.push('Produsen');
    if (jenis.length > 0) hasil.push({ uuid: p.uuid, namaProduk: p.namaProduk, brandNama: p.brandNama, jenis });
  }
  return hasil;
}

// ─── AI Insight (rule-based, belum menggunakan AI eksternal) ─────────────────

export interface DashboardInsight {
  icon: string;
  color: string;
  bg: string;
  text: string;
}

/**
 * Menghasilkan insight berbasis aturan (rule-based) dari data Living Database
 * yang ada — bukan model AI eksternal. Insight dihitung ulang setiap kali
 * dipanggil sehingga selalu akurat mengikuti perubahan data.
 */
export function computeDashboardInsights(): DashboardInsight[] {
  const stats = getProdukKomersialDashboardStats();
  const brandPopuler = getBrandPopuler(1)[0];
  const peringatan = getPeringatanData();
  const semua = getAllProdukKomersialDashboard();

  const tanpaNutrisi = semua.filter(p => !p.hasNutrisi).length;
  const tanpaKomposisi = semua.filter(p => !p.hasKomposisi).length;
  const belumLengkap = peringatan.length;

  const insights: DashboardInsight[] = [];

  if (brandPopuler) {
    insights.push({
      icon: '🏆', color: '#1b7a43', bg: '#e8f5ee',
      text: `Brand dengan produk terbanyak saat ini: ${brandPopuler.brandNama} (${brandPopuler.jumlahProduk} produk).`,
    });
  } else {
    insights.push({
      icon: '🏆', color: '#1b7a43', bg: '#e8f5ee',
      text: 'Belum ada cukup data produk untuk menentukan brand dengan produk terbanyak.',
    });
  }

  insights.push({
    icon: '📋', color: '#0277bd', bg: '#e1f5fe',
    text: belumLengkap > 0
      ? `${belumLengkap} dari ${stats.totalProduk} produk memiliki data yang belum lengkap (nutrisi/komposisi/kemasan/produsen).`
      : 'Seluruh produk yang terdaftar sudah memiliki data lengkap (nutrisi, komposisi, kemasan, dan produsen).',
  });

  insights.push({
    icon: '🧪', color: '#6a1b9a', bg: '#f3e5f5',
    text: tanpaNutrisi > 0
      ? `${tanpaNutrisi} produk belum memiliki data nutrisi sama sekali.`
      : 'Seluruh produk sudah memiliki setidaknya satu data nutrisi tercatat.',
  });

  insights.push({
    icon: '🧬', color: '#ad1457', bg: '#fce4ec',
    text: tanpaKomposisi > 0
      ? `${tanpaKomposisi} produk belum memiliki data komposisi bahan.`
      : 'Seluruh produk sudah memiliki data komposisi bahan.',
  });

  if (stats.totalProdukTidakDiproduksi > 0) {
    insights.push({
      icon: '⏸️', color: '#e65100', bg: '#fff3e0',
      text: `${stats.totalProdukTidakDiproduksi} produk berstatus "Tidak Diproduksi" — tetap tersimpan sebagai riwayat/referensi.`,
    });
  }

  insights.push({
    icon: '🏭', color: '#7b5e2a', bg: '#fff8e1',
    text: `Living Database saat ini mencakup ${stats.totalBrand} brand dan ${stats.totalProdusen} produsen di seluruh kategori Produk Komersial.`,
  });

  return insights;
}
