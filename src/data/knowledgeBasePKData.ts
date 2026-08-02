// ─── Knowledge Base Produk Komersial (PK-013) ─────────────────────────────────
// Pusat pengetahuan teknis, referensi, dan pengalaman penggunaan produk
// komersial untuk mendukung AI dan pengguna TernakHub.
//
// Setiap artikel terhubung ke produk melalui produkId (UUID — PK-000A).
// Satu produk dapat memiliki banyak artikel dengan topik berbeda.
//
// Hak Akses:
//   Admin  — Tambah, Ubah, Arsipkan, Hapus Artikel.
//   User   — Membaca Knowledge Base.
//
// AI-Readiness:
//   Seluruh konten artikel tersimpan terstruktur (field per seksi) sehingga
//   AI dapat mengambil ringkasan, fungsi, FAQ, dll. tanpa parsing teks bebas.
//
// Aturan:
//   ✅ Gunakan produkId (UUID) sebagai relasi — BUKAN nama/slug.
//   ✅ getActiveArticles() untuk tampilan user (hanya Aktif).
//   ✅ getAllArticles()    untuk tampilan admin (semua status).
//   ❌ Jangan hardcode UUID artikel di luar file ini.

import { assertAdmin, logRiwayat, type StatusEntitas } from './produkKomersialLivingDB';
import { generateUUID } from '../utils/uuid';

// ─── Topik Artikel ────────────────────────────────────────────────────────────

export type TopikKB =
  | 'Ringkasan Produk'
  | 'Fungsi'
  | 'Keunggulan'
  | 'Keterbatasan'
  | 'Target Penggunaan'
  | 'Cara Penggunaan'
  | 'Catatan Lapangan'
  | 'FAQ'
  | 'Referensi';

export const TOPIK_KB_LIST: TopikKB[] = [
  'Ringkasan Produk',
  'Fungsi',
  'Keunggulan',
  'Keterbatasan',
  'Target Penggunaan',
  'Cara Penggunaan',
  'Catatan Lapangan',
  'FAQ',
  'Referensi',
];

export const TOPIK_KB_ICONS: Record<TopikKB, string> = {
  'Ringkasan Produk': '📋',
  'Fungsi':           '⚙️',
  'Keunggulan':       '✅',
  'Keterbatasan':     '⚠️',
  'Target Penggunaan':'🎯',
  'Cara Penggunaan':  '📖',
  'Catatan Lapangan': '📝',
  'FAQ':              '❓',
  'Referensi':        '📚',
};

// ─── Sumber Informasi ─────────────────────────────────────────────────────────

export type SumberInformasiKB =
  | 'Website Resmi Produsen'
  | 'Brosur Resmi'
  | 'Product Data Sheet'
  | 'Technical Data Sheet'
  | 'Referensi Ilmiah'
  | 'Catatan Admin';

export const SUMBER_INFORMASI_KB_LIST: SumberInformasiKB[] = [
  'Website Resmi Produsen',
  'Brosur Resmi',
  'Product Data Sheet',
  'Technical Data Sheet',
  'Referensi Ilmiah',
  'Catatan Admin',
];

// ─── Tipe Data ────────────────────────────────────────────────────────────────

export interface FaqItem {
  /** UUID v4 — identitas item FAQ. */
  id: string;
  pertanyaan: string;
  jawaban: string;
}

export interface ReferensiResmi {
  /** UUID v4 — identitas entri referensi. */
  id: string;
  judul: string;
  /** URL atau keterangan lokasi sumber. */
  url?: string;
  penerbit?: string;
  tahun?: string;
}

export interface ArtikelKB {
  /** UUID v4 — identitas permanen artikel (PK-000A). */
  id: string;
  /** UUID produk — relasi ke seri/varian produk (mis. KONSENTRAT_SERI_UUID). */
  produkId: string;
  /** Nama produk — di-denormalisasi untuk search & display tanpa join. */
  namaProduk: string;
  /** Nama brand — di-denormalisasi untuk search & display. */
  namaBrand: string;
  /** UUID kategori produk (dari masterReferensiPKData KategoriProduk). */
  kategoriId: string;
  /** Nama kategori — di-denormalisasi untuk display. */
  namaKategori: string;
  /** Topik utama artikel. */
  topik: TopikKB;
  /** Judul artikel. */
  judul: string;

  // ── Seksi Konten (semua opsional — isi sesuai topik) ────────────────────────
  /** Ringkasan singkat produk — 2–5 kalimat. */
  ringkasan?: string;
  /** Fungsi dan mekanisme kerja produk. */
  fungsi?: string;
  /** Keunggulan dibanding produk sejenis atau pendekatan manual. */
  keunggulan?: string;
  /** Keterbatasan, kontraindikasi, atau hal yang perlu diperhatikan. */
  keterbatasan?: string;
  /** Kondisi & situasi optimal penggunaan produk ini. */
  targetPenggunaan?: string;
  /** Cara penggunaan: dosis, frekuensi, metode pencampuran, dll. */
  caraPenggunaan?: string;
  /** Catatan lapangan dari pengalaman nyata di farm. */
  catatanLapangan?: string;

  // ── Relasi Referensi (UUID dari masterReferensiPKData) ───────────────────────
  /** UUID TargetTernak — dapat kosong ([]) bila berlaku umum. */
  targetTernak: string[];
  /** UUID FasePemeliharaan — dapat kosong ([]) bila berlaku untuk semua fase. */
  fasePemeliharaan: string[];

  // ── FAQ & Referensi ──────────────────────────────────────────────────────────
  faq: FaqItem[];
  referensiResmi: ReferensiResmi[];
  /** Sumber informasi yang menjadi dasar artikel ini. */
  sumberInformasi: SumberInformasiKB[];

  // ── Metadata ─────────────────────────────────────────────────────────────────
  status: StatusEntitas;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// ─── Helper Seed ─────────────────────────────────────────────────────────────

function artikel(
  id: string,
  produkId: string,
  namaProduk: string,
  namaBrand: string,
  kategoriId: string,
  namaKategori: string,
  topik: TopikKB,
  judul: string,
  data: Partial<Omit<ArtikelKB,
    'id'|'produkId'|'namaProduk'|'namaBrand'|'kategoriId'|'namaKategori'|'topik'|'judul'|
    'targetTernak'|'fasePemeliharaan'|'faq'|'referensiResmi'|'sumberInformasi'|
    'status'|'createdAt'|'updatedAt'|'createdBy'|'updatedBy'
  >> & {
    targetTernak?: string[];
    fasePemeliharaan?: string[];
    faq?: FaqItem[];
    referensiResmi?: ReferensiResmi[];
    sumberInformasi?: SumberInformasiKB[];
    status?: StatusEntitas;
    createdAt?: string;
  },
): ArtikelKB {
  return {
    id,
    produkId,
    namaProduk,
    namaBrand,
    kategoriId,
    namaKategori,
    topik,
    judul,
    targetTernak:    data.targetTernak    ?? [],
    fasePemeliharaan: data.fasePemeliharaan ?? [],
    faq:             data.faq             ?? [],
    referensiResmi:  data.referensiResmi  ?? [],
    sumberInformasi: data.sumberInformasi ?? [],
    status:          data.status          ?? 'Aktif',
    createdAt:       data.createdAt       ?? '2026-07-10',
    updatedAt:       '2026-07-10',
    createdBy:       'Admin Produk Komersial',
    updatedBy:       'Admin Produk Komersial',
    ...data,
  };
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────

// Kategori Konsentrat UUID (dari masterReferensiPKData KategoriProduk — PK-000A)
const KAT_KONSENTRAT = 'ef284065-b9f3-4f7f-828e-9868206ebf3c';

// Seri UUID (dari konsentratSeriData KONSENTRAT_SERI_UUID)
const SERI = {
  CP_144:    'c920a5c4-8afc-4f7f-a4ec-8e4a285cd329',
  CP_145:    '01bd8cee-f4b1-4b64-b933-81083fa366f2',
  JPF_SP118: '95170ce7-73a4-47f9-8e76-735f8ac97f0d',
  NF_RD:     'bd848ff7-ae76-4471-ad21-f4920c3ee785',
  MX_S18:    '340f1236-f4b0-4ccd-af6a-0fdf519ecefa',
  MX_S22:    '7f23e599-d02a-4884-9867-47108b8a44fb',
  GC_R1:     '72dcc49e-4bf3-4cd1-a438-ba3c9a30820d',
};

// TargetTernak UUID (dari masterReferensiPKData)
const TT = {
  SAPI_PERAH:  'c3d4e5f6-0001-4000-8000-aabbccddeeff',
  SAPI_POTONG: 'c3d4e5f6-0002-4000-8000-aabbccddeeff',
  KAMBING_PERAH: 'c3d4e5f6-0004-4000-8000-aabbccddeeff',
  DOMBA:       'c3d4e5f6-0006-4000-8000-aabbccddeeff',
  RUMINANSIA:  'c3d4e5f6-0013-4000-8000-aabbccddeeff',
};

// FasePemeliharaan UUID (dari masterReferensiPKData)
const FP = {
  GROWER:        'd4e5f6a7-0002-4000-8000-aabbccddeeff',
  FINISHER:      'd4e5f6a7-0003-4000-8000-aabbccddeeff',
  PENGGEMUKAN:   'd4e5f6a7-0004-4000-8000-aabbccddeeff',
  LAKTASI_AWAL:  'd4e5f6a7-0006-4000-8000-aabbccddeeff',
  LAKTASI_PUNCAK:'d4e5f6a7-0007-4000-8000-aabbccddeeff',
  LAKTASI_AKHIR: 'd4e5f6a7-0008-4000-8000-aabbccddeeff',
  KERING_KANDANG:'d4e5f6a7-0009-4000-8000-aabbccddeeff',
};

export const KNOWLEDGE_BASE_PK: ArtikelKB[] = [

  // ── CP-144: Ringkasan Produk ─────────────────────────────────────────────────
  artikel(
    'eb48064c-d872-444b-8e98-3f4347983b87',
    SERI.CP_144,
    'CP-144',
    'Charoen Pokphand',
    KAT_KONSENTRAT,
    'Konsentrat',
    'Ringkasan Produk',
    'CP-144 — Konsentrat Sapi Perah Laktasi (Charoen Pokphand)',
    {
      ringkasan:
        'CP-144 adalah konsentrat komersial buatan PT Charoen Pokphand Indonesia, ' +
        'dirancang khusus untuk sapi perah fase laktasi aktif. Produk ini memberikan ' +
        'pasokan protein, energi, dan mineral seimbang untuk mendukung produksi susu ' +
        'optimal tanpa mengorbankan kondisi tubuh induk.',
      fungsi:
        'Menyediakan protein kasar (PK) ~18%, TDN ~72%, kalsium dan fosfor dalam ' +
        'rasio Ca:P yang ideal untuk produksi susu. Formulasi dilengkapi vitamin AD3E ' +
        'dan trace mineral organik untuk imunitas dan reproduksi.',
      keunggulan:
        '• Konsistensi batch-to-batch terjamin karena diproduksi di pabrik berstandar GMP.\n' +
        '• Tidak perlu mencampur beberapa bahan — satu produk sudah mengandung semua ' +
        'mikronutrien esensial.\n' +
        '• Tersedia luas di toko pakan nasional dengan harga kompetitif.\n' +
        '• Uji palatabilitas tinggi — ternak jarang menolak.',
      keterbatasan:
        '• Harus dikombinasikan dengan hijauan segar (minimal 30% BK ransum) untuk ' +
        'memenuhi kebutuhan serat kasar ruminansia.\n' +
        '• Bukan complete feed — tidak dapat diberikan tanpa sumber serat.\n' +
        '• Kadar protein 18% mungkin terlalu tinggi untuk fase kering kandang (risiko ' +
        'kelebihan protein dan biaya tidak efisien).',
      targetTernak:     [TT.SAPI_PERAH],
      fasePemeliharaan: [FP.LAKTASI_AWAL, FP.LAKTASI_PUNCAK, FP.LAKTASI_AKHIR],
      sumberInformasi:  ['Product Data Sheet', 'Brosur Resmi'],
      referensiResmi: [
        {
          id: 'dbdc5c3f-fd8e-400a-9d80-3497c9a30bef',
          judul: 'CP-144 Product Data Sheet',
          penerbit: 'PT Charoen Pokphand Indonesia',
          tahun: '2024',
          url: 'https://www.cp.co.id',
        },
      ],
    },
  ),

  // ── CP-144: Cara Penggunaan ─────────────────────────────────────────────────
  artikel(
    '9f46c12e-2e06-4c76-b7d5-1e0dd1b58116',
    SERI.CP_144,
    'CP-144',
    'Charoen Pokphand',
    KAT_KONSENTRAT,
    'Konsentrat',
    'Cara Penggunaan',
    'Panduan Pemberian CP-144 untuk Sapi Perah Laktasi',
    {
      caraPenggunaan:
        '**Dosis Harian:**\n' +
        '• Sapi laktasi puncak (produksi >15 L/hari): 5–7 kg CP-144 + hijauan ad libitum\n' +
        '• Sapi laktasi awal (0–8 minggu): 4–5 kg CP-144 + hijauan minimal 15 kg segar\n' +
        '• Sapi laktasi akhir (>20 minggu): 3–4 kg CP-144 + hijauan ad libitum\n\n' +
        '**Waktu Pemberian:**\n' +
        'Berikan dalam 2 kali pemberian (pagi dan sore) segera setelah pemerahan untuk ' +
        'memaksimalkan asupan dan mencegah acidosis akibat pemberian konsentrat tunggal ' +
        'dalam jumlah besar.\n\n' +
        '**Metode Pencampuran:**\n' +
        'Dapat dicampur dengan dedak padi, ampas tahu, atau singkong parut sebagai ' +
        'sumber energi tambahan. Hindari mencampur dengan mineral block — risiko ' +
        'kelebihan Ca bila keduanya diberikan bersamaan.\n\n' +
        '**Transisi Pakan:**\n' +
        'Jika mengganti merk konsentrat sebelumnya, lakukan transisi bertahap selama ' +
        '7–10 hari (20% penggantian per 2 hari) untuk menghindari gangguan rumen.',
      targetPenggunaan:
        'Paling efektif digunakan saat produksi susu >10 L/hari, ketersediaan hijauan ' +
        'berkualitas (kadar protein >8%) cukup, dan peternak ingin menyederhanakan ' +
        'formulasi ransum tanpa mengorbankan performa.',
      targetTernak:     [TT.SAPI_PERAH],
      fasePemeliharaan: [FP.LAKTASI_AWAL, FP.LAKTASI_PUNCAK, FP.LAKTASI_AKHIR],
      sumberInformasi:  ['Brosur Resmi', 'Catatan Admin'],
      faq: [
        {
          id: '3a89d3ce-2849-4837-98d3-086b7f091599',
          pertanyaan: 'Apakah CP-144 bisa diberikan ke sapi kering kandang?',
          jawaban:
            'Tidak disarankan. Kandungan protein 18% terlalu tinggi untuk fase kering ' +
            'kandang dan dapat meningkatkan risiko milk fever (hypocalcemia) saat partus. ' +
            'Gunakan konsentrat kadar PK 12–14% untuk fase kering kandang.',
        },
        {
          id: '82c4a8ce-9af9-4f1f-b3ad-8ba448e85d4c',
          pertanyaan: 'Berapa lama penyimpanan CP-144 yang aman?',
          jawaban:
            'Maksimal 3 bulan dalam kemasan tertutup, simpan di tempat kering ' +
            'dan sejuk (< 30°C), jauh dari paparan langsung sinar matahari. ' +
            'Periksa aroma sebelum pemberian — konsentrat tengik menurunkan ' +
            'palatabilitas dan dapat menyebabkan gangguan pencernaan.',
        },
        {
          id: '167e0547-cc56-4295-91b3-bd0b51ea4540',
          pertanyaan: 'Apakah produksi susu langsung naik setelah pindah ke CP-144?',
          jawaban:
            'Respons produksi susu biasanya terlihat dalam 2–3 minggu. Pada masa ' +
            'transisi, fokus pada kondisi tubuh (BCS 3.0–3.5) dan pastikan asupan ' +
            'air minum minimal 80–100 L/hari untuk hasil optimal.',
        },
      ],
    },
  ),

  // ── Japfa SP-118: Ringkasan Produk ──────────────────────────────────────────
  artikel(
    '0f3c8d98-9552-4990-9336-f6c6fa3e6da1',
    SERI.JPF_SP118,
    'Japfa SP-118',
    'Japfa Comfeed',
    KAT_KONSENTRAT,
    'Konsentrat',
    'Ringkasan Produk',
    'Japfa SP-118 — Konsentrat Starter Sapi Potong',
    {
      ringkasan:
        'Japfa SP-118 adalah konsentrat untuk sapi potong fase starter dan grower ' +
        'dari PT Japfa Comfeed Indonesia. Diformulasikan dengan kandungan protein ' +
        'tinggi (20% PK) untuk mendukung pertumbuhan rangka dan massa otot pada ' +
        'fase awal pemeliharaan (pedet lepas sapih hingga bakalan muda).',
      fungsi:
        'Menyediakan asam amino esensial (lisin, metionin) untuk sintesis protein ' +
        'otot, mineral untuk pertumbuhan tulang, dan vitamin B-kompleks untuk ' +
        'optimasi metabolisme energi. TDN 74% mendukung laju pertumbuhan harian ' +
        '(ADG) yang tinggi.',
      keunggulan:
        '• PK 20% — tertinggi di kelasnya untuk fase starter sapi potong.\n' +
        '• Diperkaya mineral organik (Zn, Cu chelate) untuk imunitas optimal.\n' +
        '• Palatabilitas baik karena mengandung molases sebagai flavor enhancer.\n' +
        '• Formulasi bypass protein tinggi — efisiensi nitrogen lebih baik.',
      keterbatasan:
        '• Harga per kg lebih tinggi dibanding konsentrat standar.\n' +
        '• Tidak cocok untuk fase penggemukan akhir (PK 20% berlebih untuk ' +
        'deposit lemak).\n' +
        '• Perlu hijauan berkualitas sebagai pasangan — tidak efektif bila ' +
        'dikombinasikan dengan jerami berkualitas rendah tanpa fermentasi.',
      targetTernak:     [TT.SAPI_POTONG],
      fasePemeliharaan: [FP.GROWER],
      sumberInformasi:  ['Product Data Sheet', 'Website Resmi Produsen'],
      referensiResmi: [
        {
          id: '2b5ba2f7-516a-4044-b7de-a3d7ef28c4b2',
          judul: 'Japfa SP-118 Technical Specification',
          penerbit: 'PT Japfa Comfeed Indonesia',
          tahun: '2025',
          url: 'https://www.japfacomfeed.co.id',
        },
      ],
    },
  ),

  // ── Nutrefeed RD: Catatan Lapangan ──────────────────────────────────────────
  artikel(
    'f23f5f82-f92e-4b79-8489-48effecfd0df',
    SERI.NF_RD,
    'Nutrefeed RD',
    'Nutrefeed',
    KAT_KONSENTRAT,
    'Konsentrat',
    'Catatan Lapangan',
    'Catatan Lapangan Nutrefeed RD — Pengalaman Sapi Perah Skala Kecil',
    {
      catatanLapangan:
        '**Observasi dari Penggunaan Lapangan (Peternak Skala 10–20 Ekor):**\n\n' +
        '**Kondisi Optimal:**\n' +
        'Nutrefeed RD menunjukkan respons terbaik pada sapi perah fase laktasi ' +
        'puncak dengan BCS 2.75–3.25. Kombinasi 4 kg RD + 5 kg silase jagung + ' +
        'rumput gajah ad libitum menghasilkan produksi susu rata-rata 18–22 L/ekor/hari ' +
        'pada sapi FH dan PFH generasi pertama.\n\n' +
        '**Transisi dari Konsentrat Lain:**\n' +
        'Peternak yang beralih dari CP-144 ke Nutrefeed RD melaporkan butuh 2 minggu ' +
        'adaptasi. Produksi susu sempat turun 5–8% pada minggu pertama sebelum ' +
        'kembali normal dan meningkat di minggu ke-3.\n\n' +
        '**Perhatian Musim Kemarau:**\n' +
        'Saat ketersediaan hijauan segar terbatas (musim kemarau), dosis RD dapat ' +
        'ditingkatkan ke 5 kg/ekor/hari asalkan jerami fermentasi (amoniasi) ' +
        'tersedia minimal 3–4 kg BK. Tanpa sumber serat yang cukup, diare ringan ' +
        'dan penurunan konsistensi feses dilaporkan terjadi.\n\n' +
        '**Kombinasi Terbaik:**\n' +
        'Nutrefeed RD + Silase Jagung Lokal + Mineral Block → kombinasi ini ' +
        'dilaporkan memberikan FCR terbaik di antara konsentrat yang diuji ' +
        'oleh kelompok peternak di Kabupaten Malang (2024–2025).\n\n' +
        '**Palatabilitas:**\n' +
        'Sapi baru tidak langsung menyukai aroma RD. Campurkan 10–15% dedak halus ' +
        'atau tambahkan 200 mL molases cair selama 3–5 hari pertama untuk ' +
        'meningkatkan penerimaan.',
      targetTernak:     [TT.SAPI_PERAH],
      fasePemeliharaan: [FP.LAKTASI_PUNCAK, FP.LAKTASI_AWAL],
      sumberInformasi:  ['Catatan Admin'],
    },
  ),

  // ── Mixfeed S18: FAQ ─────────────────────────────────────────────────────────
  artikel(
    '4d3c9838-9b8a-4b9b-8bf5-e029e01d995f',
    SERI.MX_S18,
    'Mixfeed S18',
    'Mixfeed',
    KAT_KONSENTRAT,
    'Konsentrat',
    'FAQ',
    'FAQ — Mixfeed S18: Pertanyaan Umum dari Peternak',
    {
      ringkasan:
        'Mixfeed S18 adalah konsentrat sapi perah dengan PK 18% dari PT Mixfeed ' +
        'Indonesia. Artikel ini mengumpulkan pertanyaan yang sering diajukan ' +
        'peternak terkait penggunaan, dosis, kombinasi, dan penyimpanan.',
      targetTernak:     [TT.SAPI_PERAH],
      fasePemeliharaan: [FP.LAKTASI_AWAL, FP.LAKTASI_PUNCAK, FP.LAKTASI_AKHIR, FP.KERING_KANDANG],
      sumberInformasi:  ['Catatan Admin', 'Brosur Resmi'],
      faq: [
        {
          id: '830cd30d-7801-450f-a769-8f7dbdfdb70f',
          pertanyaan: 'Berapa dosis Mixfeed S18 untuk sapi perah produksi 15 L/hari?',
          jawaban:
            'Untuk produksi 15 L/hari, berikan 4–5 kg S18 per ekor per hari ' +
            'dibagi 2 kali pemberian, dikombinasikan dengan hijauan segar 15–20 kg ' +
            'atau silase 8–10 kg. Sesuaikan ke atas bila BCS < 2.75.',
        },
        {
          id: 'aceceedf-b962-4ad7-b63e-578575c39564',
          pertanyaan: 'Apakah S18 bisa dikombinasikan dengan premix tambahan?',
          jawaban:
            'Tidak disarankan menambahkan premix vitamin-mineral terpisah karena ' +
            'S18 sudah mengandung premix terintegrasi. Penambahan berlebih berisiko ' +
            'toksisitas vitamin A (hipervitaminosis A) dan ketidakseimbangan mineral.',
        },
        {
          id: 'c5147899-cfe7-42c2-9ec3-719215f98d7f',
          pertanyaan: 'Mengapa feses sapi saya menjadi encer setelah beralih ke S18?',
          jawaban:
            'Feses encer dalam 3–5 hari pertama adalah normal selama adaptasi rumen. ' +
            'Jika berlanjut >1 minggu, kemungkinan penyebabnya: (1) dosis terlalu tinggi, ' +
            '(2) kurang serat kasar — tambahkan jerami atau kurangi dosis S18, atau ' +
            '(3) air minum tidak mencukupi. Konsultasikan dengan dokter hewan bila ' +
            'disertai demam atau penurunan nafsu makan.',
        },
        {
          id: '64af2654-3644-4673-aee3-7f560007a865',
          pertanyaan: 'Apakah S18 cocok untuk sapi kering kandang?',
          jawaban:
            'S18 dengan PK 18% tidak optimal untuk kering kandang. Gunakan dosis ' +
            'minimal (1–2 kg/hari) hanya untuk mempertahankan BCS, atau ganti ke ' +
            'konsentrat kering kandang khusus (PK 12–14%) agar kondisi tubuh tidak ' +
            'terlalu gemuk menjelang partus (risiko milk fever dan dystocia).',
        },
        {
          id: '9efa5d1d-94c1-4843-8ad5-ccc35c3d26d1',
          pertanyaan: 'Apakah Mixfeed S18 sama dengan Mixfeed S20?',
          jawaban:
            'Tidak. S18 (PK 18%) cocok untuk laktasi umum dan kering kandang akhir, ' +
            'sementara S20 (PK 20%) dikhususkan untuk laktasi puncak dan sapi ' +
            'berperforma tinggi (produksi >20 L/hari). S20 harganya lebih mahal dan ' +
            'penggunaannya tidak efisien untuk sapi produksi rendah.',
        },
      ],
    },
  ),

  // ── Gold Coin R1: Keunggulan & Keterbatasan ─────────────────────────────────
  artikel(
    'c0b994fc-add6-483e-ab86-1567a7ad779c',
    SERI.GC_R1,
    'Gold Coin R1',
    'Gold Coin',
    KAT_KONSENTRAT,
    'Konsentrat',
    'Keunggulan',
    'Keunggulan & Keterbatasan Gold Coin R1 untuk Ruminansia',
    {
      keunggulan:
        '• **Formulasi Multispesies:** R1 diformulasikan untuk semua ruminansia ' +
        '(sapi, kambing, domba) — fleksibel untuk farm campuran.\n' +
        '• **Bypass Protein Tinggi:** Kandungan bypass protein (undegradable dietary ' +
        'protein) yang tinggi meningkatkan efisiensi asam amino esensial ke jaringan.\n' +
        '• **Stabilitas Simpan Baik:** Kemasan PE berlapis aluminium foil mencegah ' +
        'oksidasi lemak — masa simpan 6 bulan lebih lama dari kompetitor.\n' +
        '• **Vitamin E Tinggi:** 80 IU/kg Vit E mendukung sistem imun dan ' +
        'reproduksi — cocok untuk farm dengan sejarah gangguan reproduksi.',
      keterbatasan:
        '• Tidak tersedia di semua kabupaten — distribusi terbatas di Jawa dan Bali.\n' +
        '• Harga per kg ~15% lebih mahal dari konsentrat standar.\n' +
        '• Kandungan serat kasar rendah (5%) — wajib dikombinasikan dengan ' +
        'hijauan atau jerami fermentasi.\n' +
        '• Tidak cocok untuk pakan tunggal tanpa hijauan — risiko bloat.',
      targetTernak:     [TT.SAPI_PERAH, TT.SAPI_POTONG, TT.KAMBING_PERAH, TT.DOMBA, TT.RUMINANSIA],
      fasePemeliharaan: [FP.GROWER, FP.PENGGEMUKAN, FP.LAKTASI_PUNCAK],
      sumberInformasi:  ['Technical Data Sheet', 'Website Resmi Produsen'],
      referensiResmi: [
        {
          id: '12d483c2-3400-40ae-aac6-64ed524f1d6f',
          judul: 'Gold Coin R1 Technical Data Sheet',
          penerbit: 'PT Gold Coin Indonesia',
          tahun: '2025',
          url: 'https://www.goldcoin.co.id',
        },
      ],
    },
  ),

];

// ─── Query Functions ──────────────────────────────────────────────────────────

/** Seluruh artikel (semua status) — untuk tampilan Admin. */
export function getAllArticles(): ArtikelKB[] {
  return KNOWLEDGE_BASE_PK;
}

/** Hanya artikel berstatus Aktif — untuk tampilan User. */
export function getActiveArticles(): ArtikelKB[] {
  return KNOWLEDGE_BASE_PK.filter(a => a.status === 'Aktif');
}

/** Artikel berdasarkan UUID artikel. */
export function getArtikelById(id: string): ArtikelKB | undefined {
  return KNOWLEDGE_BASE_PK.find(a => a.id === id);
}

/** Semua artikel untuk satu produk (berdasarkan produkId UUID). */
export function getArtikelByProdukId(produkId: string): ArtikelKB[] {
  return KNOWLEDGE_BASE_PK.filter(a => a.produkId === produkId && a.status === 'Aktif');
}

/** Semua artikel untuk satu produk — termasuk Arsip (untuk Admin). */
export function getAllArtikelByProdukId(produkId: string): ArtikelKB[] {
  return KNOWLEDGE_BASE_PK.filter(a => a.produkId === produkId);
}

/** Artikel berdasarkan kategori produk (UUID). */
export function getArtikelByKategori(kategoriId: string): ArtikelKB[] {
  return KNOWLEDGE_BASE_PK.filter(a => a.kategoriId === kategoriId && a.status === 'Aktif');
}

/**
 * Pencarian artikel Knowledge Base.
 * Filter: brand (namaBrand), produk (namaProduk), kata kunci (judul/konten),
 *         targetTernak (UUID), topik, status (default: Aktif saja).
 */
export interface FilterKB {
  brand?:        string;   // nama brand (case-insensitive substring)
  produk?:       string;   // nama produk (case-insensitive substring)
  kataKunci?:    string;   // cari di judul, ringkasan, fungsi, keunggulan, catatan, dll.
  targetTernak?: string;   // UUID TargetTernak
  topik?:        TopikKB;
  includeArsip?: boolean;  // default false — admin mungkin butuh ini
}

export function searchKnowledgeBase(filter: FilterKB): ArtikelKB[] {
  let results = filter.includeArsip
    ? KNOWLEDGE_BASE_PK
    : KNOWLEDGE_BASE_PK.filter(a => a.status === 'Aktif');

  if (filter.brand) {
    const q = filter.brand.toLowerCase();
    results = results.filter(a => a.namaBrand.toLowerCase().includes(q));
  }

  if (filter.produk) {
    const q = filter.produk.toLowerCase();
    results = results.filter(a => a.namaProduk.toLowerCase().includes(q));
  }

  if (filter.topik) {
    results = results.filter(a => a.topik === filter.topik);
  }

  if (filter.targetTernak) {
    results = results.filter(a => a.targetTernak.includes(filter.targetTernak!));
  }

  if (filter.kataKunci) {
    const q = filter.kataKunci.toLowerCase();
    results = results.filter(a => {
      const text = [
        a.judul, a.namaProduk, a.namaBrand, a.ringkasan, a.fungsi,
        a.keunggulan, a.keterbatasan, a.targetPenggunaan,
        a.caraPenggunaan, a.catatanLapangan,
        ...a.faq.map(f => `${f.pertanyaan} ${f.jawaban}`),
        ...a.referensiResmi.map(r => r.judul),
      ].filter(Boolean).join(' ').toLowerCase();
      return text.includes(q);
    });
  }

  return results;
}

/** Jumlah artikel aktif. */
export function getJumlahArtikelAktif(): number {
  return KNOWLEDGE_BASE_PK.filter(a => a.status === 'Aktif').length;
}

/** Jumlah produk unik yang memiliki artikel KB. */
export function getJumlahProdukTerkover(): number {
  const ids = new Set(KNOWLEDGE_BASE_PK.filter(a => a.status === 'Aktif').map(a => a.produkId));
  return ids.size;
}

// ─── CRUD (hanya Admin) ───────────────────────────────────────────────────────

/**
 * Tambah artikel Knowledge Base baru.
 * @throws bila bukan Admin atau field wajib kosong.
 */
export function addArtikel(
  data: Omit<ArtikelKB, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
  catatan?: string,
): ArtikelKB {
  assertAdmin('menambah artikel Knowledge Base');
  if (!data.produkId.trim())   throw new Error('produkId tidak boleh kosong.');
  if (!data.namaProduk.trim()) throw new Error('Nama produk tidak boleh kosong.');
  if (!data.judul.trim())      throw new Error('Judul artikel tidak boleh kosong.');

  const now = new Date().toISOString().slice(0, 10);
  const newArtikel: ArtikelKB = {
    ...data,
    id:        generateUUID(),
    status:    'Aktif',
    createdAt: now,
    updatedAt: now,
    createdBy: 'Admin Produk Komersial',
    updatedBy: 'Admin Produk Komersial',
  };
  KNOWLEDGE_BASE_PK.push(newArtikel);
  logRiwayat({
    entityType:     'Dokumen Pendukung',
    entityId:       newArtikel.id,
    entityLabel:    `KB: ${newArtikel.judul}`,
    jenisPerubahan: 'Tambah',
    catatan, after: newArtikel,
  });
  return newArtikel;
}

/**
 * Ubah artikel yang sudah ada.
 * @throws bila bukan Admin atau ID tidak ditemukan.
 */
export function updateArtikel(
  id: string,
  patch: Partial<Omit<ArtikelKB, 'id' | 'createdAt' | 'createdBy'>>,
  catatan?: string,
): void {
  assertAdmin('mengubah artikel Knowledge Base');
  const idx = KNOWLEDGE_BASE_PK.findIndex(a => a.id === id);
  if (idx < 0) throw new Error(`[PK-013] Artikel KB UUID "${id}" tidak ditemukan.`);
  const prev = KNOWLEDGE_BASE_PK[idx];
  const updated: ArtikelKB = {
    ...prev,
    ...patch,
    id:        prev.id,
    createdAt: prev.createdAt,
    createdBy: prev.createdBy,
    updatedAt: new Date().toISOString().slice(0, 10),
    updatedBy: 'Admin Produk Komersial',
  };
  KNOWLEDGE_BASE_PK[idx] = updated;
  const jenisPerubahan = patch.status !== undefined && patch.status !== prev.status
    ? 'Ubah Status'
    : 'Ubah';
  logRiwayat({
    entityType:     'Dokumen Pendukung',
    entityId:       id,
    entityLabel:    `KB: ${updated.judul}`,
    jenisPerubahan,
    catatan, before: prev, after: updated,
  });
}

/**
 * Arsipkan artikel (soft delete — tetap tersimpan untuk riwayat & referensi).
 * @throws bila bukan Admin atau ID tidak ditemukan.
 */
export function arsipkanArtikel(id: string, catatan?: string): void {
  updateArtikel(id, { status: 'Arsip' }, catatan);
}

/**
 * Hapus artikel secara permanen.
 * Gunakan arsipkanArtikel() bila masih dibutuhkan untuk riwayat.
 * @throws bila bukan Admin atau ID tidak ditemukan.
 */
export function deleteArtikel(id: string, catatan?: string): void {
  assertAdmin('menghapus artikel Knowledge Base');
  const idx = KNOWLEDGE_BASE_PK.findIndex(a => a.id === id);
  if (idx < 0) throw new Error(`[PK-013] Artikel KB UUID "${id}" tidak ditemukan.`);
  const before = KNOWLEDGE_BASE_PK[idx];
  const label = before.judul;
  KNOWLEDGE_BASE_PK.splice(idx, 1);
  logRiwayat({
    entityType:     'Dokumen Pendukung',
    entityId:       id,
    entityLabel:    `KB: ${label}`,
    jenisPerubahan: 'Hapus',
    before,
    catatan,
  });
}
