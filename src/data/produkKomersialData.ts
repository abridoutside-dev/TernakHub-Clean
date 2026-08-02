// ─── Produk Komersial — Kategori Registry ────────────────────────────────────
// PK-001: Database referensi produk pakan JADI yang diproduksi oleh perusahaan,
// koperasi, UMKM, maupun produsen pakan lain (bukan bahan mentah Master Pakan,
// bukan hasil racikan sendiri seperti Formula).
//
// Produk Komersial vs Master Pakan vs Formula:
// • Master Pakan   = bahan mentah/referensi nutrisi (jagung, dedak, mineral, dll).
// • Formula        = ransum yang DIRACIK sendiri dari bahan-bahan Master Pakan.
// • Produk Komersial = produk pakan JADI yang dibeli langsung dari produsen
//   (konsentrat pabrikan, premix, mineral block, dll) — tidak diracik sendiri.
//
// PK-000A: Seluruh entitas Produk Komersial menggunakan UUID v4 sebagai
// identitas utama. UUID bersifat permanen dan tidak berubah meskipun nama,
// brand, maupun informasi lainnya diperbarui. Lihat docs/PK-000A_UUID_STANDARD.md
// untuk standar lengkap. UUID tidak ditampilkan pada UI.
//
// Relasi data WAJIB menggunakan UUID (bukan nama, slug, kode, atau nomor urut).
// Slug hanya digunakan untuk routing URL (keperluan UI/navigasi semata).

import type { StatusEntitas } from './produkKomersialLivingDB';
import { buildBatch1ProdukKomersialItems } from './produkKomersialBatch1Adapter';
import { buildBatch2ProdukKomersialItems } from './produkKomersialBatch2Adapter';
import { buildBatch3ProdukKomersialItems } from './produkKomersialBatch3Adapter';
import { buildBatch4ProdukKomersialItems } from './produkKomersialBatch4Adapter';

// ─── UUID Registry — Kategori ─────────────────────────────────────────────────
// UUID ini dibuat sekali oleh sistem (PK-000A) dan bersifat permanen.
// Jangan mengubah nilai UUID yang sudah ada. UUID baru hanya dibuat saat
// menambahkan kategori baru (keputusan arsitektur, bukan entri data biasa).
export const KATEGORI_UUID: Record<string, string> = {
  'konsentrat':       'ef284065-b9f3-4f7f-828e-9868206ebf3c',
  'complete-feed':    '2bc49fe7-8908-4aa1-9efd-bed0b6b0d550',
  'premix':           '9eac54c7-3470-4058-9830-ba1fa61a2964',
  'mineral-mix':      'd64ef8c5-f751-49ec-b84d-e4dec5eb2aef',
  'vitamin':          'a2e67f79-4610-4e99-9cff-f0444d85352b',
  'feed-additive':    '2305e1e2-fe14-44ec-90cb-b0fdd47fdd55',
  'milk-replacer':    '90cd2db1-ad65-4ba2-a77b-e26cea1db351',
  'umb':              '580b220e-b4fb-4e5a-9485-ce6dff21bb88',
  'mineral-block':    '854adc57-d1bd-4250-b39d-bbe1d825f15b',
  'probiotik':        '87b36b79-df48-4165-8c3c-d5794f6b386b',
  'enzim':            '91abe4b1-a359-4147-9f3e-6e851e3c1ad8',
  'acidifier':        '01d4a969-69ba-432e-b7fd-185371e87637',
  'buffer':           '0718a41a-bb00-4885-ac63-b51b25b09527',
  'binder':           '08224f98-1e4b-489b-991b-7991e1942282',
  'toxin-binder':     '0bb8aa0c-b4a6-4a25-bd4e-3b766ef611dc',
  'yeast':            'aafdceb5-c9d6-4bdd-9c9c-a63d2ae7ed7a',
  'herbal-komersial': '4adc8bbb-e12a-43b7-a1e9-3f783e3325a3',
  'silase-komersial': '925db808-3b5c-4167-926e-248818783539',
  'hay-komersial':    '23d74ddd-0ff0-4d5b-ab39-d888fe9b4b28',
  'lainnya-komersial':'1de7491f-8ce5-409e-bbbb-bab0cdaba72c',
};

/** Lookup kategori UUID dari slug. Digunakan untuk membangun relasi data. */
export function getKategoriUUID(slug: string): string {
  const id = KATEGORI_UUID[slug];
  if (!id) {
    console.error(`[PK-000A] Kategori slug "${slug}" tidak memiliki UUID terdaftar.`);
    throw new Error(`Unknown kategori slug: ${slug}`);
  }
  return id;
}

/** Lookup kategori slug dari UUID. Digunakan untuk navigasi UI. */
export function getKategoriSlugByUUID(uuid: string): string | undefined {
  return Object.entries(KATEGORI_UUID).find(([, v]) => v === uuid)?.[0];
}

// ─── Tipe Entitas ─────────────────────────────────────────────────────────────

export interface KategoriProdukKomersial {
  /**
   * UUID v4 — identitas permanen kategori (PK-000A).
   * Tidak boleh ditampilkan pada UI. Digunakan untuk relasi data.
   */
  uuid: string;
  /**
   * Slug — digunakan HANYA untuk routing URL dan navigasi UI.
   * Bukan primary key. Jangan gunakan slug untuk relasi data antar entitas.
   */
  slug: string;
  icon: string;
  nama: string;
  deskripsi: string;
  color: string;
  bg: string;
}

export const KATEGORI_PRODUK_KOMERSIAL: KategoriProdukKomersial[] = [
  { uuid: KATEGORI_UUID['konsentrat'],       slug: 'konsentrat',        icon: '🌰', nama: 'Konsentrat',               deskripsi: 'Pakan penguat berenergi/protein tinggi produksi pabrikan, siap campur dengan hijauan.',       color: '#7b5e2a', bg: '#fff8e1' },
  { uuid: KATEGORI_UUID['complete-feed'],    slug: 'complete-feed',     icon: '🍽️', nama: 'Complete Feed',            deskripsi: 'Pakan lengkap siap pakai yang sudah memenuhi seluruh kebutuhan nutrisi harian ternak.',        color: '#1b7a43', bg: '#e8f5ee' },
  { uuid: KATEGORI_UUID['premix'],           slug: 'premix',            icon: '🧪', nama: 'Premix',                   deskripsi: 'Campuran vitamin, mineral, dan aditif berkonsentrasi tinggi untuk dicampur ke ransum.',        color: '#0277bd', bg: '#e1f5fe' },
  { uuid: KATEGORI_UUID['mineral-mix'],      slug: 'mineral-mix',       icon: '🧂', nama: 'Mineral Mix',              deskripsi: 'Campuran mineral makro & mikro siap pakai untuk melengkapi kebutuhan mineral ternak.',         color: '#00695c', bg: '#e0f2f1' },
  { uuid: KATEGORI_UUID['vitamin'],          slug: 'vitamin',           icon: '💊', nama: 'Vitamin',                  deskripsi: 'Produk vitamin komersial dalam bentuk siap pakai (bubuk, cair, atau blok).',                 color: '#6a1b9a', bg: '#f3e5f5' },
  { uuid: KATEGORI_UUID['feed-additive'],    slug: 'feed-additive',     icon: '⚗️', nama: 'Feed Additive',            deskripsi: 'Bahan tambahan pakan komersial untuk meningkatkan performa dan efisiensi pakan.',              color: '#ad1457', bg: '#fce4ec' },
  { uuid: KATEGORI_UUID['milk-replacer'],    slug: 'milk-replacer',     icon: '🍼', nama: 'Milk Replacer',            deskripsi: 'Pengganti susu induk untuk pakan pedet/cempe yang belum lepas sapih.',                        color: '#5d4037', bg: '#efebe9' },
  { uuid: KATEGORI_UUID['umb'],              slug: 'umb',               icon: '🧱', nama: 'Urea Molasses Block (UMB)', deskripsi: 'Blok pakan padat berbasis urea dan molase sebagai suplemen energi & protein.',            color: '#e65100', bg: '#fff3e0' },
  { uuid: KATEGORI_UUID['mineral-block'],    slug: 'mineral-block',     icon: '🧊', nama: 'Mineral Block',            deskripsi: 'Blok mineral padat yang dijilat ternak secara bebas (free-choice) di kandang.',                color: '#37474f', bg: '#eceff1' },
  { uuid: KATEGORI_UUID['probiotik'],        slug: 'probiotik',         icon: '🦠', nama: 'Probiotik',                deskripsi: 'Mikroorganisme hidup komersial untuk menjaga kesehatan saluran cerna ternak.',                  color: '#2e7d32', bg: '#e8f5e9' },
  { uuid: KATEGORI_UUID['enzim'],            slug: 'enzim',             icon: '🧬', nama: 'Enzim',                    deskripsi: 'Produk enzim pakan komersial untuk membantu pencernaan nutrisi tertentu.',                     color: '#00838f', bg: '#e0f7fa' },
  { uuid: KATEGORI_UUID['acidifier'],        slug: 'acidifier',         icon: '🍋', nama: 'Acidifier',                deskripsi: 'Produk pengasam pakan komersial untuk menjaga pH saluran cerna dan menekan patogen.',        color: '#f9a825', bg: '#fffde7' },
  { uuid: KATEGORI_UUID['buffer'],           slug: 'buffer',            icon: '⚖️', nama: 'Buffer',                   deskripsi: 'Produk penyangga pH rumen komersial, umum digunakan pada ransum tinggi konsentrat.',           color: '#3949ab', bg: '#e8eaf6' },
  { uuid: KATEGORI_UUID['binder'],           slug: 'binder',            icon: '🔗', nama: 'Binder',                   deskripsi: 'Bahan pengikat pakan komersial untuk menjaga kualitas pelet/campuran pakan.',                  color: '#6d4c41', bg: '#efebe9' },
  { uuid: KATEGORI_UUID['toxin-binder'],     slug: 'toxin-binder',      icon: '🛡️', nama: 'Toxin Binder',             deskripsi: 'Produk pengikat mikotoksin komersial untuk melindungi ternak dari pakan tercemar.',           color: '#c62828', bg: '#ffebee' },
  { uuid: KATEGORI_UUID['yeast'],            slug: 'yeast',             icon: '🍞', nama: 'Yeast',                    deskripsi: 'Produk ragi/khamir komersial untuk mendukung fermentasi rumen dan kesehatan cerna.',           color: '#8d6e63', bg: '#efebe9' },
  { uuid: KATEGORI_UUID['herbal-komersial'], slug: 'herbal-komersial',  icon: '🌿', nama: 'Herbal Komersial',         deskripsi: 'Produk herbal/fitobiotik pabrikan sebagai alternatif alami aditif pakan sintetis.',          color: '#2e7d32', bg: '#e8f5ee' },
  { uuid: KATEGORI_UUID['silase-komersial'], slug: 'silase-komersial',  icon: '🌽', nama: 'Silase Komersial',         deskripsi: 'Produk silase jadi yang dipasarkan oleh produsen pakan, bukan hasil olahan sendiri.',        color: '#558b2f', bg: '#f1f8e9' },
  { uuid: KATEGORI_UUID['hay-komersial'],    slug: 'hay-komersial',     icon: '🌾', nama: 'Hay Komersial',            deskripsi: 'Produk hay/rumput kering kemasan yang dijual siap pakai oleh produsen pakan.',              color: '#9e9d24', bg: '#f9fbe7' },
  { uuid: KATEGORI_UUID['lainnya-komersial'],slug: 'lainnya-komersial', icon: '📦', nama: 'Lainnya',                  deskripsi: 'Produk pakan komersial lain yang belum tercakup pada kategori di atas.',                     color: '#546e7a', bg: '#eceff1' },
];

// ─── Produk Komersial — Item Registry ────────────────────────────────────────
// PK-001 hanya membangun halaman utama & struktur kategori. Belum ada produk
// yang diinput — daftar ini sengaja dibiarkan kosong. Semua Ringkasan dan
// badge jumlah produk dihitung dari array ini, bukan angka statis, agar
// otomatis akurat begitu data produk mulai diisi pada fase berikutnya.

export interface ProdukKomersialItem {
  /**
   * UUID v4 — identitas permanen produk (PK-000A).
   * Dibuat otomatis oleh sistem saat data dibuat. Tidak pernah berubah.
   * Tidak ditampilkan pada UI. Digunakan sebagai primary key dan untuk relasi.
   */
  id: string; // UUID v4

  // ── Relasi data — selalu gunakan UUID, bukan nama/slug/kode ──────────────
  /**
   * UUID kategori (referensi ke KATEGORI_UUID / KategoriProdukKomersial.uuid).
   * Gunakan field ini untuk semua relasi data antar modul (Stock, Formula, AI, dll).
   */
  kategoriId: string; // UUID → KategoriProdukKomersial.uuid
  /**
   * UUID brand/merek (referensi ke KonsentratMerek.uuid atau entitas brand lain).
   * Gunakan field ini untuk relasi ke modul brand — bukan field `merek` di bawah.
   */
  brandId: string;    // UUID → Brand/Merek entity uuid

  // ── Routing UI — hanya untuk navigasi URL, bukan untuk relasi data ────────
  /**
   * Slug kategori — digunakan HANYA untuk membangun URL/rute navigasi.
   * Jangan gunakan sebagai kunci relasi data. Untuk relasi, gunakan `kategoriId`.
   */
  kategoriSlug: string; // URL routing only — use kategoriId for data relations

  // ── Informasi tampilan — hanya untuk UI, bukan untuk relasi data ──────────
  /** Nama produk — boleh berubah. Gunakan `id` untuk relasi, bukan nama ini. */
  nama: string;
  /** Nama merek/brand — tampilan saja. Untuk relasi gunakan `brandId`. */
  merek: string;
  /** Nama produsen — tampilan saja. */
  produsen: string;
  /** Tanggal update terakhir, ISO date string (e.g. '2026-07-10'). */
  updatedAt: string;

  // ── Field opsional — kesiapan integrasi Formula/Stok (PK-005/PK-006) ─────
  // Kategori selain Konsentrat belum memiliki Living Database detail sendiri,
  // jadi field ini opsional dan HANYA diisi saat data konkret tersedia untuk
  // entri tersebut. Jangan mengisi dengan nilai reka-reka (hardcode) — biarkan
  // undefined sampai data sesungguhnya ada, agar modul pemakai (Formula/Stok)
  // dapat membedakan "belum diketahui" dari "diketahui bernilai tertentu".
  /** Seri/varian produk — tampilan saja. */
  seri?: string;
  /** Jenis produk / nama kategori — tampilan saja, mis. "Premix". */
  jenisProduk?: string;
  /** Status produksi saat ini — sama semantik dengan StatusEntitas Living Database (PK-009). */
  statusProduksi?: StatusEntitas;
  /** Berat kemasan standar — mis. "25 kg". */
  beratKemasan?: string;
  /** Satuan default pencatatan stok — mis. "kg", "liter", "sachet". */
  satuanDefault?: string;
}

export const PRODUK_KOMERSIAL_LIST: ProdukKomersialItem[] = [
  ...buildBatch1ProdukKomersialItems(),
  ...buildBatch2ProdukKomersialItems(),
  ...buildBatch3ProdukKomersialItems(),
  ...buildBatch4ProdukKomersialItems(),
];

export function getProdukKomersialList(): ProdukKomersialItem[] {
  return PRODUK_KOMERSIAL_LIST;
}

/** Jumlah produk pada satu kategori, dihitung live via kategoriId (UUID). */
export function getKategoriProdukCount(slug: string): number {
  const uuid = KATEGORI_UUID[slug];
  if (!uuid) return 0;
  return PRODUK_KOMERSIAL_LIST.filter(item => item.kategoriId === uuid).length;
}

/** Total referensi produk (semua kategori), dihitung live. */
export function getTotalReferensiProduk(): number {
  return PRODUK_KOMERSIAL_LIST.length;
}

/**
 * Jumlah merek unik, dihitung live via brandId (UUID — PK-000A).
 * Deduplication menggunakan UUID agar konsisten meskipun nama merek berubah.
 */
export function getJumlahMerek(): number {
  return new Set(PRODUK_KOMERSIAL_LIST.map(item => item.brandId)).size;
}

/**
 * Jumlah produsen unik, dihitung live.
 * Catatan PK-000A: saat entitas Produsen memiliki UUID sendiri, fungsi ini
 * harus diperbarui untuk menggunakan produsenId (UUID), bukan string nama.
 */
export function getJumlahProdusen(): number {
  return new Set(PRODUK_KOMERSIAL_LIST.map(item => item.produsen)).size;
}

/** Tanggal update produk terbaru, dihitung live. Fallback '—' jika belum ada data. */
export function getTerakhirDiperbarui(): string {
  const dates = PRODUK_KOMERSIAL_LIST.map(item => item.updatedAt).sort((a, b) => b.localeCompare(a));
  return dates[0] ?? '—';
}
