// ─── Produk Komersial — Konsentrat — Merek/Produsen Registry ────────────────
// PK-002: Halaman "Konsentrat" pada Produk Komersial TIDAK langsung menampilkan
// daftar produk. Pengguna memilih merek/produsen konsentrat komersial dulu,
// baru kemudian (pada PK-003) melihat seluruh seri/produk milik merek tersebut.
//
// Referensi ini murni informasi merek/produsen konsentrat komersial (bukan
// Master Pakan, bukan Formula Pakan, bukan produk racikan sendiri). Jumlah
// seri produk per merek dicatat sebagai metadata referensi (belum ada
// database produk individual — itu baru dibangun pada PK-003).
//
// PK-000A: Setiap merek memiliki UUID v4 permanen sebagai identitas data.
// Relasi dari ProdukKomersialItem ke merek WAJIB menggunakan uuid (brandId),
// bukan nama merek, slug, atau nomor urut. UUID tidak ditampilkan pada UI.

import { assertAdmin, logRiwayat, type StatusEntitas } from './produkKomersialLivingDB';
import { getTodayISO as todayISO } from '../utils/dateUtils';

// ─── UUID Registry — Konsentrat Merek ────────────────────────────────────────
// UUID ini dibuat sekali oleh sistem (PK-000A) dan bersifat permanen.
// Jangan mengubah nilai UUID yang sudah ada. UUID baru hanya dibuat saat
// menambahkan merek baru ke database.
export const KONSENTRAT_MEREK_UUID: Record<string, string> = {
  'charoen-pokphand':  'b09ee868-38ff-4244-9756-ec6f894706a9',
  'japfa-comfeed':     '2b7ec703-1df9-4d09-915c-38fcd2262cba',
  'nutrefeed':         'a76c54b6-9ce0-45b2-aa55-a535310ce322',
  'mixfeed':           '32072869-6881-46a4-bc04-6a19580a38c4',
  'gold-coin':         '5e392801-c22e-4f38-9c9e-1a78d2e40b46',
  'new-hope':          '540071be-027b-443a-979b-207b5ae4e8d1',
  'cj-feed':           '2551115b-d59d-41b2-8c81-e0ad4c2fd9a5',
  'wonokoyo':          '371fe1ae-6792-495c-892d-11cbe544b4e8',
  'malindo':           'be3c0bf0-948b-47d6-8006-b478820b372f',
  'berdikari':         'b4f9d4db-f8f2-495f-9c49-32ca81314248',
  'greenfeed':         'f6226b4e-c26f-4b70-b42c-4fc8d10f92c2',
  'cargill':           'cb25e47c-2346-4508-bc25-324857ccf11e',
  'shs-feed':          '02e5dc2e-8ad3-428f-af95-294a3f850b30',
  // PK-002: Feedmill categories — UUIDs permanen, nama boleh diperbarui oleh Admin
  'feedmill-koperasi': '37d58f16-4026-4dfa-be8e-ac7f564805b0', // ex produk-koperasi
  'feedmill-umkm':     'da37db17-5ac6-4493-bd4c-504cf3238424', // ex produk-umkm
  // PK-002: Merek baru — UUID baru, permanen
  'hi-pro':            '8a138752-142f-4409-bc5a-59fe9efc0ff7',
  'bonavite':          'bba0da00-6ad7-4476-9571-46b8d3ad612a',
  'turbo-feed':        '8df57da1-336f-4908-9afe-ba9182c2098e',
  'royal-feed':        '6b422756-430a-4a89-96fd-fb11c336bd81',
  'yongbee':           'b51e87eb-39f9-4257-84b0-9a8d6498cd50',
  'feedmill-regional': 'fa562f7f-7bc6-4bea-85a4-577b13db9de3',
};

/** Lookup merek UUID dari slug. Digunakan untuk membangun relasi data (brandId). */
export function getKonsentratMerekUUID(slug: string): string {
  const id = KONSENTRAT_MEREK_UUID[slug];
  if (!id) {
    console.error(`[PK-000A] Merek slug "${slug}" tidak memiliki UUID terdaftar.`);
    throw new Error(`Unknown merek slug: ${slug}`);
  }
  return id;
}

/** Lookup merek slug dari UUID. Digunakan untuk navigasi UI. */
export function getKonsentratMerekSlugByUUID(uuid: string): string | undefined {
  return Object.entries(KONSENTRAT_MEREK_UUID).find(([, v]) => v === uuid)?.[0];
}

// ─── Tipe Entitas ─────────────────────────────────────────────────────────────

export interface KonsentratMerek {
  /**
   * UUID v4 — identitas permanen merek (PK-000A).
   * Tidak boleh ditampilkan pada UI. Digunakan sebagai brandId pada relasi data.
   * Nilai ini tidak pernah berubah meskipun nama merek atau produsen diperbarui.
   */
  uuid: string;
  /**
   * Slug — digunakan HANYA untuk routing URL dan navigasi UI.
   * Bukan primary key. Jangan gunakan slug untuk relasi data antar entitas.
   */
  slug: string;
  /** Nama merek — boleh berubah tanpa memengaruhi relasi data (uuid tetap). */
  nama: string;
  /** Nama produsen/perusahaan induk — tampilan saja. */
  produsen: string;
  negaraAsal: string;
  logo: string;          // Emoji placeholder selama belum ada aset logo nyata
  jumlahSeri: number;    // Jumlah seri/varian produk yang tersedia dari merek ini
  deskripsi: string;
  color: string;
  bg: string;
  updatedAt: string;     // ISO date
  /** Status Living Database (PK-009). Merek lama tanpa field ini dianggap 'Aktif'. */
  status?: StatusEntitas;
}

/** Status efektif merek — merek lama tanpa field `status` dianggap 'Aktif'. */
export function getMerekStatus(merek: KonsentratMerek): StatusEntitas {
  return merek.status ?? 'Aktif';
}

export const KONSENTRAT_MEREK_LIST: KonsentratMerek[] = [
  { uuid: KONSENTRAT_MEREK_UUID['charoen-pokphand'], slug: 'charoen-pokphand', nama: 'Charoen Pokphand', produsen: 'PT Charoen Pokphand Indonesia', negaraAsal: 'Indonesia / Thailand', logo: '🐔', jumlahSeri: 6, deskripsi: 'Produsen pakan terbesar di Indonesia, dikenal dengan seri CP untuk unggas, sapi perah, dan sapi potong.', color: '#c62828', bg: '#ffebee', updatedAt: '2026-06-01' },
  { uuid: KONSENTRAT_MEREK_UUID['japfa-comfeed'],    slug: 'japfa-comfeed',    nama: 'Japfa Comfeed',    produsen: 'PT Japfa Comfeed Indonesia',     negaraAsal: 'Indonesia',           logo: '🌾', jumlahSeri: 5, deskripsi: 'Salah satu produsen pakan terbesar nasional dengan lini konsentrat "Comfeed" untuk ternak ruminansia dan unggas.', color: '#1b7a43', bg: '#e8f5ee', updatedAt: '2026-05-20' },
  { uuid: KONSENTRAT_MEREK_UUID['nutrefeed'],        slug: 'nutrefeed',        nama: 'Nutrefeed',        produsen: 'PT Nutrifeed Indonesia',          negaraAsal: 'Indonesia',           logo: '🧪', jumlahSeri: 3, deskripsi: 'Produsen konsentrat dengan fokus formulasi nutrisi seimbang untuk sapi perah dan sapi potong.', color: '#0277bd', bg: '#e1f5fe', updatedAt: '2026-04-18' },
  { uuid: KONSENTRAT_MEREK_UUID['mixfeed'],          slug: 'mixfeed',          nama: 'Mixfeed',          produsen: 'PT Mabar Feed Indonesia',         negaraAsal: 'Indonesia',           logo: '🥣', jumlahSeri: 4, deskripsi: 'Merek konsentrat dengan seri SMG untuk sapi perah laktasi, dikenal luas di kalangan peternak sapi perah.', color: '#6a1b9a', bg: '#f3e5f5', updatedAt: '2026-06-15' },
  { uuid: KONSENTRAT_MEREK_UUID['gold-coin'],        slug: 'gold-coin',        nama: 'Gold Coin',        produsen: 'Gold Coin Group',                 negaraAsal: 'Malaysia',            logo: '🪙', jumlahSeri: 4, deskripsi: 'Produsen pakan regional Asia Tenggara dengan lini konsentrat untuk unggas dan ruminansia.', color: '#e65100', bg: '#fff3e0', updatedAt: '2026-03-22' },
  { uuid: KONSENTRAT_MEREK_UUID['new-hope'],         slug: 'new-hope',         nama: 'New Hope',         produsen: 'New Hope Liuhe Group',            negaraAsal: 'Tiongkok',            logo: '🌱', jumlahSeri: 3, deskripsi: 'Grup pakan ternak asal Tiongkok yang beroperasi di Indonesia dengan produk konsentrat untuk unggas dan babi.', color: '#2e7d32', bg: '#e8f5e9', updatedAt: '2026-02-10' },
  { uuid: KONSENTRAT_MEREK_UUID['cj-feed'],          slug: 'cj-feed',          nama: 'CJ Feed',          produsen: 'CJ Feed & Care',                  negaraAsal: 'Korea Selatan',       logo: '🇰🇷', jumlahSeri: 3, deskripsi: 'Produsen pakan asal Korea Selatan yang memasarkan konsentrat berbasis riset nutrisi modern di Indonesia.', color: '#00838f', bg: '#e0f7fa', updatedAt: '2026-01-28' },
  { uuid: KONSENTRAT_MEREK_UUID['wonokoyo'],         slug: 'wonokoyo',         nama: 'Wonokoyo',         produsen: 'PT Wonokoyo Jaya Corporindo',      negaraAsal: 'Indonesia',           logo: '🐓', jumlahSeri: 4, deskripsi: 'Produsen pakan nasional asal Jawa Timur dengan lini konsentrat unggas dan ruminansia.', color: '#5d4037', bg: '#efebe9', updatedAt: '2026-05-05' },
  { uuid: KONSENTRAT_MEREK_UUID['malindo'],          slug: 'malindo',          nama: 'Malindo',          produsen: 'PT Malindo Feedmill Indonesia',   negaraAsal: 'Malaysia / Indonesia', logo: '🌴', jumlahSeri: 3, deskripsi: 'Produsen pakan patungan Malaysia-Indonesia dengan produk konsentrat untuk unggas dan ternak ruminansia.', color: '#558b2f', bg: '#f1f8e9', updatedAt: '2026-04-02' },
  { uuid: KONSENTRAT_MEREK_UUID['berdikari'],        slug: 'berdikari',        nama: 'Berdikari',        produsen: 'PT Berdikari (Persero)',          negaraAsal: 'Indonesia',           logo: '🇮🇩', jumlahSeri: 2, deskripsi: 'BUMN pangan dan peternakan nasional yang juga memproduksi konsentrat pakan sapi.', color: '#ad1457', bg: '#fce4ec', updatedAt: '2026-02-27' },
  { uuid: KONSENTRAT_MEREK_UUID['greenfeed'],        slug: 'greenfeed',        nama: 'Greenfeed',        produsen: 'Greenfeed Vietnam Corporation',   negaraAsal: 'Vietnam',             logo: '🌿', jumlahSeri: 2, deskripsi: 'Produsen pakan asal Vietnam yang memasarkan konsentrat untuk pasar ternak Asia Tenggara.', color: '#33691e', bg: '#f1f8e9', updatedAt: '2026-01-12' },
  { uuid: KONSENTRAT_MEREK_UUID['cargill'],          slug: 'cargill',          nama: 'Cargill',          produsen: 'Cargill Animal Nutrition',        negaraAsal: 'Amerika Serikat',     logo: '🌎', jumlahSeri: 3, deskripsi: 'Perusahaan agribisnis global dengan lini konsentrat berbasis riset nutrisi ternak internasional.', color: '#3949ab', bg: '#e8eaf6', updatedAt: '2026-03-08' },
  { uuid: KONSENTRAT_MEREK_UUID['shs-feed'],          slug: 'shs-feed',          nama: 'SHS Feed',          produsen: 'PT Sinar Harapan Sejati',              negaraAsal: 'Indonesia',    logo: '☀️', jumlahSeri: 2, deskripsi: 'Produsen pakan lokal dengan konsentrat khusus untuk sapi perah dan sapi potong di Jawa.', color: '#f9a825', bg: '#fffde7', updatedAt: '2025-12-20' },
  // PK-002: Merek baru — sesuai spesifikasi database minimum
  { uuid: KONSENTRAT_MEREK_UUID['hi-pro'],            slug: 'hi-pro',            nama: 'HI-PRO',            produsen: 'PT Charoen Pokphand Indonesia',        negaraAsal: 'Indonesia',    logo: '⭐', jumlahSeri: 3, deskripsi: 'Lini konsentrat performa tinggi dari Charoen Pokphand, diformulasikan khusus untuk sapi perah dan sapi potong fase produksi intensif.', color: '#b71c1c', bg: '#ffebee', updatedAt: '2026-05-10' },
  { uuid: KONSENTRAT_MEREK_UUID['bonavite'],          slug: 'bonavite',          nama: 'Bonavite',          produsen: 'PT Bonafit Nutrisi Indonesia',         negaraAsal: 'Indonesia',    logo: '💊', jumlahSeri: 2, deskripsi: 'Konsentrat vitamin-mineral premium untuk sapi perah dan sapi potong, fokus pada pemulihan kondisi ternak dan produktivitas laktasi.', color: '#4527a0', bg: '#ede7f6', updatedAt: '2026-04-05' },
  { uuid: KONSENTRAT_MEREK_UUID['turbo-feed'],        slug: 'turbo-feed',        nama: 'Turbo Feed',        produsen: 'PT Turbo Pakan Nusantara',            negaraAsal: 'Indonesia',    logo: '⚡', jumlahSeri: 3, deskripsi: 'Konsentrat penggemukan intensif dengan kadar energi tinggi untuk sapi potong fase finisher dan ternak ruminansia kecil.', color: '#e65100', bg: '#fff3e0', updatedAt: '2026-03-18' },
  { uuid: KONSENTRAT_MEREK_UUID['royal-feed'],        slug: 'royal-feed',        nama: 'Royal Feed',        produsen: 'PT Royal Pakan Internasional',        negaraAsal: 'Indonesia',    logo: '👑', jumlahSeri: 2, deskripsi: 'Konsentrat premium untuk sapi perah produksi tinggi, diformulasikan dengan bahan baku impor berkualitas tinggi.', color: '#6a1b9a', bg: '#f3e5f5', updatedAt: '2026-02-14' },
  { uuid: KONSENTRAT_MEREK_UUID['yongbee'],           slug: 'yongbee',           nama: 'Yongbee',           produsen: 'Yongbee Animal Nutrition',            negaraAsal: 'Korea Selatan', logo: '🐝', jumlahSeri: 2, deskripsi: 'Konsentrat berbasis teknologi nutrisi Korea untuk sapi perah dan sapi potong, dikenal dengan kandungan asam amino terproteksi.', color: '#0d47a1', bg: '#e3f2fd', updatedAt: '2026-01-20' },
  { uuid: KONSENTRAT_MEREK_UUID['feedmill-regional'], slug: 'feedmill-regional', nama: 'Feedmill Regional', produsen: 'Berbagai Pabrik Pakan Regional',      negaraAsal: 'Indonesia',    logo: '🏗️', jumlahSeri: 2, deskripsi: 'Konsentrat produksi pabrik pakan skala regional/menengah, umumnya beredar di wilayah tertentu dan disesuaikan dengan bahan baku lokal.', color: '#37474f', bg: '#eceff1', updatedAt: '2025-12-01' },
  { uuid: KONSENTRAT_MEREK_UUID['feedmill-koperasi'], slug: 'feedmill-koperasi', nama: 'Feedmill Koperasi', produsen: 'Berbagai Koperasi Peternak',          negaraAsal: 'Indonesia',    logo: '🤝', jumlahSeri: 1, deskripsi: 'Konsentrat hasil produksi feedmill milik koperasi peternak sapi perah/potong, umumnya dipasarkan terbatas di wilayah koperasi.', color: '#00695c', bg: '#e0f2f1', updatedAt: '2025-11-30' },
  { uuid: KONSENTRAT_MEREK_UUID['feedmill-umkm'],     slug: 'feedmill-umkm',     nama: 'Feedmill UMKM',     produsen: 'Berbagai UMKM Pakan Lokal',           negaraAsal: 'Indonesia',    logo: '🏪', jumlahSeri: 1, deskripsi: 'Konsentrat produksi feedmill UMKM/pabrik pakan skala kecil-menengah, kualitas dan formulasi bervariasi antar produsen.', color: '#795548', bg: '#efebe9', updatedAt: '2025-11-15' },
];

/** Total merek konsentrat komersial yang terdaftar, dihitung live. */
export function getTotalMerekKonsentrat(): number {
  return KONSENTRAT_MEREK_LIST.length;
}

/** Total seri/produk konsentrat di seluruh merek, dihitung live. */
export function getTotalProdukKonsentrat(): number {
  return KONSENTRAT_MEREK_LIST.reduce((sum, m) => sum + m.jumlahSeri, 0);
}

/** Jumlah produsen unik (satu produsen bisa punya beberapa merek), dihitung live. */
export function getTotalProdusenKonsentrat(): number {
  return new Set(KONSENTRAT_MEREK_LIST.map(m => m.produsen)).size;
}

/** Tanggal update merek terbaru, dihitung live. */
export function getTerakhirDiperbaruiKonsentrat(): string {
  const dates = KONSENTRAT_MEREK_LIST.map(m => m.updatedAt).sort((a, b) => b.localeCompare(a));
  return dates[0] ?? '—';
}

// ─── CRUD — Living Database (PK-009) ───────────────────────────────────────────
// Hanya Admin yang dapat menambah/mengubah/menghapus (assertAdmin melempar
// error bila bukan Admin). Setiap perubahan dicatat ke Riwayat. UUID permanen.

export type BaruKonsentratMerek = Omit<KonsentratMerek, 'uuid' | 'updatedAt'> & { uuid?: string };

/** Tambah merek/brand baru ke Living Database. */
export function addKonsentratMerek(data: BaruKonsentratMerek, catatan?: string): KonsentratMerek {
  assertAdmin('menambah Brand');
  const uuid = data.uuid ?? crypto.randomUUID();
  const merek: KonsentratMerek = { ...data, uuid, updatedAt: todayISO() };
  KONSENTRAT_MEREK_LIST.push(merek);
  logRiwayat({ entityType: 'Brand', entityId: uuid, entityLabel: merek.nama, jenisPerubahan: 'Tambah', catatan, after: merek, brandId: uuid });
  return merek;
}

/** Ubah merek/brand yang sudah ada. UUID tidak pernah berubah. */
export function updateKonsentratMerek(uuid: string, patch: Partial<Omit<KonsentratMerek, 'uuid'>>, catatan?: string): KonsentratMerek | undefined {
  assertAdmin('mengubah Brand');
  const idx = KONSENTRAT_MEREK_LIST.findIndex(m => m.uuid === uuid);
  if (idx === -1) return undefined;
  const before = KONSENTRAT_MEREK_LIST[idx];
  const after: KonsentratMerek = { ...before, ...patch, uuid, updatedAt: todayISO() };
  KONSENTRAT_MEREK_LIST[idx] = after;
  const statusOnly = patch.status !== undefined && Object.keys(patch).every(k => k === 'status');
  logRiwayat({
    entityType: 'Brand', entityId: uuid, entityLabel: after.nama,
    jenisPerubahan: statusOnly ? 'Ubah Status' : 'Ubah', catatan,
    before, after, brandId: uuid,
  });
  return after;
}

/** Hapus merek/brand secara permanen. Riwayat tetap menyimpan jejak sebelum entri dihapus. */
export function deleteKonsentratMerek(uuid: string, catatan?: string): boolean {
  assertAdmin('menghapus Brand');
  const idx = KONSENTRAT_MEREK_LIST.findIndex(m => m.uuid === uuid);
  if (idx === -1) return false;
  const [removed] = KONSENTRAT_MEREK_LIST.splice(idx, 1);
  logRiwayat({ entityType: 'Brand', entityId: uuid, entityLabel: removed.nama, jenisPerubahan: 'Hapus', catatan, before: removed, brandId: uuid });
  return true;
}
