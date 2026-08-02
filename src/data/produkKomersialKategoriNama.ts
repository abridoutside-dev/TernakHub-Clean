// ─── Produk Komersial — Slug → Nama Kategori Tampilan (SSOT) ─────────────────
// File ini adalah satu-satunya sumber nama tampilan kategori Produk Komersial.
//
// Semua batch adapter (Batch 1–4) dan Catalog Picker (TambahStokPakan) WAJIB
// mengimpor dari sini — dilarang mendefinisikan KATEGORI_NAMA lokal sendiri.
//
// Mengapa file terpisah (bukan ekspor dari produkKomersialData.ts)?
// Karena produkKomersialData.ts mengimpor batch adapter, dan batch adapter
// mengimpor file ini — memisahkannya menghindari circular import sepenuhnya.
//
// Sumber nama: field `nama` pada KATEGORI_PRODUK_KOMERSIAL di produkKomersialData.ts.
// Saat menambah kategori baru ke KATEGORI_PRODUK_KOMERSIAL, tambahkan juga di sini.

export const PK_KATEGORI_NAMA: Record<string, string> = {
  // ── Utama ──────────────────────────────────────────────────────────────────
  'konsentrat':        'Konsentrat',
  'complete-feed':     'Complete Feed',
  // ── Suplemen Campuran ──────────────────────────────────────────────────────
  'premix':            'Premix',
  'mineral-mix':       'Mineral Mix',
  'vitamin':           'Vitamin',
  'feed-additive':     'Feed Additive',
  // ── Pakan Khusus ──────────────────────────────────────────────────────────
  'milk-replacer':     'Milk Replacer',
  'umb':               'Urea Molasses Block (UMB)',
  'mineral-block':     'Mineral Block',
  // ── Mikroorganisme & Enzim ─────────────────────────────────────────────────
  'probiotik':         'Probiotik',
  'enzim':             'Enzim',
  // ── Aditif Teknis ─────────────────────────────────────────────────────────
  'acidifier':         'Acidifier',
  'buffer':            'Buffer',
  'binder':            'Binder',
  'toxin-binder':      'Toxin Binder',
  'yeast':             'Yeast',
  // ── Alami & Olahan ────────────────────────────────────────────────────────
  'herbal-komersial':  'Herbal Komersial',
  'silase-komersial':  'Silase Komersial',
  'hay-komersial':     'Hay Komersial',
  // ── Lainnya ───────────────────────────────────────────────────────────────
  'lainnya-komersial': 'Lainnya',
};

/**
 * Kembalikan nama tampilan kategori Produk Komersial dari slugnya.
 * Jika slug tidak dikenal, kembalikan slug itu sendiri agar data tetap terlihat
 * (dan mudah ditemukan saat audit) — JANGAN ubah menjadi string kosong.
 */
export function getPKKategoriNama(slug: string): string {
  return PK_KATEGORI_NAMA[slug] ?? slug;
}

// ─── Produk Komersial — Kategori Icon Mapping (SSOT) ─────────────────────────
// Satu-satunya sumber icon per kategori Produk Komersial.
// Gunakan getPKKategoriIcon() di mana pun icon kategori PK dibutuhkan.
// Saat menambah kategori baru ke KATEGORI_PRODUK_KOMERSIAL, tambahkan juga di sini.
export const PK_KATEGORI_ICON: Record<string, string> = {
  // ── Utama ──────────────────────────────────────────────────────────────────
  'complete-feed':     '🥗',   // pakan lengkap siap pakai
  'konsentrat':        '🧪',   // konsentrat nutrisi tinggi
  // ── Suplemen Campuran ──────────────────────────────────────────────────────
  'premix':            '⚗️',   // campuran premix
  'mineral-mix':       '🪨',   // campuran mineral
  'vitamin':           '💊',   // suplemen vitamin
  'feed-additive':     '🧬',   // aditif pakan
  // ── Pakan Khusus ──────────────────────────────────────────────────────────
  'milk-replacer':     '🥛',   // pengganti susu
  'umb':               '🧱',   // urea molasses block (bentuk blok)
  'mineral-block':     '🧊',   // blok mineral
  // ── Mikroorganisme & Enzim ─────────────────────────────────────────────────
  'probiotik':         '🦠',   // mikroorganisme probiotik
  'enzim':             '🔬',   // enzim pakan
  // ── Aditif Teknis ─────────────────────────────────────────────────────────
  'acidifier':         '🧴',   // pengasam / acidifier
  'buffer':            '⚖️',   // buffer pH
  'binder':            '🔗',   // pengikat (binder)
  'toxin-binder':      '🛡️',   // penyerap toksin
  'yeast':             '🍄',   // ragi / yeast
  // ── Alami & Olahan ────────────────────────────────────────────────────────
  'herbal-komersial':  '🌿',   // produk herbal komersial
  'silase-komersial':  '🌱',   // silase kemasan komersial
  'hay-komersial':     '🌾',   // hay / jerami komersial
  // ── Lainnya ───────────────────────────────────────────────────────────────
  'lainnya-komersial': '📋',   // kategori lainnya
};

/**
 * Kembalikan icon emoji kategori Produk Komersial dari slugnya.
 * Jika slug tidak dikenal, kembalikan icon generik '🏪'.
 */
export function getPKKategoriIcon(slug: string): string {
  return PK_KATEGORI_ICON[slug] ?? '🏪';
}
