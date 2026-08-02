// ─── Formula Integration Readiness — Master Pakan ────────────────────────────
// FP-003A: Menjamin SELURUH item dari seluruh 18 kategori induk Master Pakan
// dapat direferensikan oleh Formula saat memilih bahan.
//
// Prinsip:
// • Tidak ada data hardcode. Seluruh referensi DITURUNKAN live dari setiap
//   database kategori yang menjadi sumber kebenaran (JAGUNG_DB, PADI_DB, dll).
// • Mencakup 18 kategori induk: jagung, padi, rumput, leguminosa, daun-daunan,
//   kacang-biji-bijian, umbi-umbian, serealia-lain, kelapa, kelapa-sawit, tebu,
//   buah-limbah-buah, limbah-industri-pangan, sumber-protein-hewani, mineral,
//   vitamin-feed-additive, bahan-cair, lainnya.
// • Kategori daun, kacang-biji-bijian, umbi, dan serealia menggunakan
//   getAllXDetailItems() agar jumlah item konsisten dengan halaman Master Pakan.
// • Field alias (namaLain / alias dari detail) disertakan agar search dapat
//   menemukan item lewat nama ilmiah atau nama alternatif.
// • File ini TIDAK mengubah data apapun — murni read-only adapter.

import { getJagungList } from './jagungData';
import { getPadiList } from './padiData';
import { getRumputList } from './rumputData';
import { getLeguminosaList } from './leguminosaData';
import { getAllDaunanDetailItems } from './daunanDetailData';
import { getAllKacangBijianDetailItems } from './kacangBijianDetailData';
import { getAllUmbiDetailItems } from './umbiDetailData';
import { getAllSerealiaDetailItems } from './serealiaDetailData';
import { getKelapaList } from './kelapaData';
import { getKelapaSawitList } from './kelapaSawitData';
import { getTebuList } from './tebuData';
import { getBuahLimbahList } from './buahLimbahBuahData';
import { getLimbahIndustriList } from './limbahIndustriPanganData';
import { getSumberProteinHewaniList } from './sumberProteinHewaniData';
import { getMineralList } from './mineralData';
import { getVitaminFeedAdditiveList } from './vitaminFeedAdditiveData';
import { getBahanCairList } from './bahanCairData';
import { getLainnyaList } from './lainnyaData';

// ─── Kontrak Referensi Formula ────────────────────────────────────────────────

/**
 * Bentuk siap-pakai satu item Master Pakan untuk direferensikan Formula.
 * ID berasal dari database kategori asal (mis. 'jagung-pipil', 'rumput-gajah').
 */
export interface FormulaMasterPakanRef {
  /** ID item dari database kategori asal. */
  id: string;
  nama: string;
  /**
   * Nama alternatif untuk keperluan search — diambil dari field namaLain atau
   * alias di data sumber. Kosong jika tidak tersedia.
   */
  alias: string;
  /** Nama kategori induk (mis. 'Jagung', 'Rumput'). Ditampilkan sebagai label kategori. */
  kategoriParent: string;
  /** Icon emoji kategori induk. */
  icon: string;
  /** Nama sub-kategori (mis. 'Hasil Utama', 'Rumput Unggul'). Kosong jika tidak tersedia. */
  kategoriItem: string;
  /** Estimasi harga IDR/kg. 0 jika belum tercatat. */
  estimasiHarga: number;
}

// ─── Generic adapter ──────────────────────────────────────────────────────────
// Semua database kategori menggunakan shape yang serupa: id, nama, dan salah
// satu dari namaLain (list items) atau alias (detail items) untuk search.
// Cast ke RawItem menangani variasi interface antar kategori dengan aman.

interface RawItem {
  id: string;
  nama: string;
  namaLain?: string | null;
  alias?: string | null;
  kategoriItem?: string;
  estimasiHarga?: number | null;
}

function adapt(
  items: RawItem[],
  icon: string,
  kategoriParent: string,
): FormulaMasterPakanRef[] {
  return items.map(item => ({
    id: item.id,
    nama: item.nama,
    alias: item.namaLain ?? item.alias ?? '',
    kategoriParent,
    icon,
    kategoriItem: item.kategoriItem ?? '',
    estimasiHarga: item.estimasiHarga ?? 0,
  }));
}

// ─── Per-kategori builders ────────────────────────────────────────────────────

const R = (arr: RawItem[], icon: string, parent: string) =>
  adapt(arr, icon, parent);

function buildKategori(): FormulaMasterPakanRef[][] {
  return [
    R(getJagungList(),                 '🌽', 'Jagung'),
    R(getPadiList(),                   '🌾', 'Padi'),
    R(getRumputList(),                 '🌱', 'Rumput'),
    R(getLeguminosaList(),             '🍀', 'Leguminosa'),
    R(getAllDaunanDetailItems(),        '🌿', 'Daun-daunan'),
    R(getAllKacangBijianDetailItems(),  '🥜', 'Kacang-kacangan'),
    R(getAllUmbiDetailItems(),          '🍠', 'Umbi-umbian'),
    R(getAllSerealiaDetailItems(),      '🌾', 'Serealia Lain'),
    R(getKelapaList(),                 '🥥', 'Kelapa'),
    R(getKelapaSawitList(),            '🌴', 'Kelapa Sawit'),
    R(getTebuList(),                   '🎋', 'Tebu'),
    R(getBuahLimbahList(),             '🍌', 'Buah & Limbah Buah'),
    R(getLimbahIndustriList(),         '🏭', 'Limbah Industri Pangan'),
    R(getSumberProteinHewaniList(),    '🐟', 'Sumber Protein Hewani'),
    R(getMineralList(),                '🧂', 'Mineral'),
    R(getVitaminFeedAdditiveList(),    '💊', 'Vitamin & Feed Additive'),
    R(getBahanCairList(),              '💧', 'Bahan Cair'),
    R(getLainnyaList(),                '📦', 'Lainnya'),
  ];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── API Publik ────────────────────────────────────────────────────────────────

/**
 * Seluruh item Master Pakan dari semua 18 kategori induk, live dari setiap
 * database kategori. Jumlah item selalu sama dengan yang terlihat di halaman
 * Master Pakan karena menggunakan fungsi sumber yang identik.
 */
export function getAllFormulaMasterPakan(): FormulaMasterPakanRef[] {
  return buildKategori().flat();
}

/** Lookup satu item Master Pakan via ID-nya di database kategori asal. */
export function getFormulaMasterPakanById(id: string): FormulaMasterPakanRef | undefined {
  return getAllFormulaMasterPakan().find(item => item.id === id);
}
