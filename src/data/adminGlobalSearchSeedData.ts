// ─── Global Search Seed Data — GSU-001 ───────────────────────────────────────
// Realistic dummy IndexEntityInput records for all 15 search sources.
// Loaded once at module mount via rebuildIndex() from globalSearchService.ts.
// DO NOT connect to real data stores — dummy data only.

import {
  type IndexEntityInput,
  SEARCH_ENTITY_TYPE_UUID,
} from './globalSearchData';

// ─── Extended entity type UUIDs (sources not yet in core data layer) ──────────
// These UUIDs are stable dummy identifiers for GSU-001 display purposes only.
// Must be registered in the core data layer when those sources are wired.

export const GSU_ENTITY_TYPE_UUID = {
  ...SEARCH_ENTITY_TYPE_UUID,
  NOTIFICATION: 'b6000001-0000-4000-a000-000000000020',
  REPORT:       'b6000001-0000-4000-a000-000000000021',
  ANNOUNCEMENT: 'b6000001-0000-4000-a000-000000000022',
  DATA_MASTER:  'b6000001-0000-4000-a000-000000000023',
  FARM_PROFILE: 'b6000001-0000-4000-a000-000000000024',
} as const;

// ─── Display config per entity type UUID ─────────────────────────────────────

export const ENTITY_TYPE_DISPLAY: Record<string, { label: string; icon: string; color: string }> = {
  [GSU_ENTITY_TYPE_UUID.LIVESTOCK]:           { label: 'Livestock',        icon: '🐄', color: '#16a34a' },
  [GSU_ENTITY_TYPE_UUID.BATCH]:               { label: 'Batch',            icon: '📦', color: '#0891b2' },
  [GSU_ENTITY_TYPE_UUID.FEED]:                { label: 'Feed',             icon: '🌾', color: '#ca8a04' },
  [GSU_ENTITY_TYPE_UUID.FEED_FORMULA]:        { label: 'Feed Formula',     icon: '🧪', color: '#0891b2' },
  [GSU_ENTITY_TYPE_UUID.FEED_STOCK]:          { label: 'Feed Stock',       icon: '🏭', color: '#d97706' },
  [GSU_ENTITY_TYPE_UUID.MEDICINE]:            { label: 'Medicine',         icon: '💊', color: '#dc2626' },
  [GSU_ENTITY_TYPE_UUID.MEDICINE_STOCK]:      { label: 'Medicine Stock',   icon: '🏥', color: '#be185d' },
  [GSU_ENTITY_TYPE_UUID.MARKETPLACE_LISTING]: { label: 'Marketplace',      icon: '🛒', color: '#d97706' },
  [GSU_ENTITY_TYPE_UUID.WORKSPACE]:           { label: 'Workspace',        icon: '🏢', color: '#0ea5e9' },
  [GSU_ENTITY_TYPE_UUID.NEWS]:                { label: 'News',             icon: '📰', color: '#0284c7' },
  [GSU_ENTITY_TYPE_UUID.EVENT]:               { label: 'Event',            icon: '🎪', color: '#7c3aed' },
  [GSU_ENTITY_TYPE_UUID.NOTIFICATION]:        { label: 'Notifikasi',       icon: '🔔', color: '#6366f1' },
  [GSU_ENTITY_TYPE_UUID.REPORT]:              { label: 'Report',           icon: '📊', color: '#475569' },
  [GSU_ENTITY_TYPE_UUID.ANNOUNCEMENT]:        { label: 'Announcement',     icon: '📢', color: '#0369a1' },
  [GSU_ENTITY_TYPE_UUID.DATA_MASTER]:         { label: 'Data Master',      icon: '🗂️',  color: '#64748b' },
  [GSU_ENTITY_TYPE_UUID.FARM_PROFILE]:        { label: 'Farm Profile',     icon: '🌿', color: '#15803d' },
  [GSU_ENTITY_TYPE_UUID.TRANSACTION]:         { label: 'Transaction',      icon: '💳', color: '#0f172a' },
  [GSU_ENTITY_TYPE_UUID.CONVERSATION]:        { label: 'Conversation',     icon: '💬', color: '#64748b' },
  [GSU_ENTITY_TYPE_UUID.EVIDENCE]:            { label: 'Evidence',         icon: '📎', color: '#64748b' },
};

// ─── Dummy seed entries — 42 records ─────────────────────────────────────────

export const GLOBAL_SEARCH_SEED_ENTRIES: IndexEntityInput[] = [

  // ── Livestock (5) ──────────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.LIVESTOCK,
    entity_uuid:  'LS-gsu-0001',
    workspace_uuid: 'WS-0012',
    title:    'Domba Garut Jantan — DG-2026-042',
    subtitle: 'Jantan · 38 kg · Aktif · Kandang A',
    keywords: ['domba', 'garut', 'jantan', 'pejantan', 'aktif', 'kambing domba'],
    tags:     ['unggulan', 'garut'],
    searchable_text: 'Berkah Farm Garut · Dibesarkan sejak 2025 · Vaksin lengkap · Siap kawin',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.LIVESTOCK,
    entity_uuid:  'LS-gsu-0002',
    workspace_uuid: 'WS-0029',
    title:    'Sapi Limosin Betina — SLB-2026-011',
    subtitle: 'Betina · 420 kg · Bunting 6 Bulan · Kandang B',
    keywords: ['sapi', 'limosin', 'betina', 'bunting', 'hamil'],
    tags:     ['premium', 'reproduksi'],
    searchable_text: 'Maju Jaya Ternak · Asal Blitar · Sertifikat kesehatan April 2026',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.LIVESTOCK,
    entity_uuid:  'LS-gsu-0003',
    workspace_uuid: 'WS-0012',
    title:    'Sapi FH Perah — FH-2024-007',
    subtitle: 'Betina · Laktasi · 18 L/hari · Kandang C',
    keywords: ['sapi', 'friesian holstein', 'FH', 'perah', 'laktasi', 'susu'],
    tags:     ['perah', 'produktif'],
    searchable_text: 'Berkah Farm Garut · Produksi susu tertinggi bulan Juli · Vaksin ND dan PMK lengkap',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.LIVESTOCK,
    entity_uuid:  'LS-gsu-0004',
    workspace_uuid: 'WS-0063',
    title:    'Kambing PE Betina — KPE-2025-019',
    subtitle: 'Betina · 32 kg · Aktif · Kandang D',
    keywords: ['kambing', 'PE', 'peranakan etawa', 'betina', 'aktif'],
    tags:     ['etawa', 'susu kambing'],
    searchable_text: 'Cahaya Tani Sukabumi · Produksi susu 1.2 L/hari · Kesehatan baik',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.LIVESTOCK,
    entity_uuid:  'LS-gsu-0005',
    workspace_uuid: 'WS-0055',
    title:    'Ayam Broiler — Batch Q3-2026 #412',
    subtitle: 'Jantan · 2.1 kg · Siap Panen · Kandang E',
    keywords: ['ayam', 'broiler', 'panen', 'unggas', 'pedaging'],
    tags:     ['broiler', 'panen'],
    searchable_text: 'Nusantara Agribisnis · DOC masuk 1 Juni 2026 · FCR 1.7 · Bobot rata-rata 2.1 kg',
  },

  // ── Feed (3) ──────────────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.FEED,
    entity_uuid:  'FD-gsu-0001',
    workspace_uuid: null,
    title:    'Rumput Gajah (Pennisetum purpureum)',
    subtitle: 'Hijauan · Protein 9.8% · Energi ME 1.890 kcal/kg',
    keywords: ['rumput gajah', 'hijauan', 'pennisetum', 'segar'],
    tags:     ['hijauan', 'sapi', 'domba'],
    searchable_text: 'Bahan pakan hijauan utama untuk sapi, kambing, dan domba · Nilai gizi tinggi · Mudah dibudidayakan',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.FEED,
    entity_uuid:  'FD-gsu-0002',
    workspace_uuid: null,
    title:    'Dedak Padi (Rice Bran)',
    subtitle: 'Bahan Konsentrat · Protein 12.4% · Energi 2.980 kcal/kg',
    keywords: ['dedak', 'dedak padi', 'rice bran', 'konsentrat', 'karbohidrat'],
    tags:     ['konsentrat', 'umum'],
    searchable_text: 'Sumber energi dan protein ternak ruminansia · By-product penggilingan padi · Mudah didapat dan terjangkau',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.FEED,
    entity_uuid:  'FD-gsu-0003',
    workspace_uuid: null,
    title:    'Bungkil Kedelai (Soybean Meal)',
    subtitle: 'Bahan Konsentrat · Protein 48.2% · Energi 2.830 kcal/kg',
    keywords: ['bungkil kedelai', 'soybean meal', 'protein tinggi', 'konsentrat'],
    tags:     ['protein tinggi', 'konsentrat'],
    searchable_text: 'Sumber protein utama konsentrat ternak · Nilai protein tertinggi di antara by-product biji-bijian · Cocok untuk sapi perah dan ayam',
  },

  // ── Feed Formula (3) ──────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.FEED_FORMULA,
    entity_uuid:  'FF-gsu-0001',
    workspace_uuid: 'WS-0012',
    title:    'Formula Penggemukan Sapi A3',
    subtitle: 'Sapi Potong · Protein 16% · Energi 3.200 kcal/kg · Produksi: 200 kg',
    keywords: ['formula', 'penggemukan', 'sapi', 'konsentrat', 'A3'],
    tags:     ['penggemukan', 'sapi potong'],
    searchable_text: 'Berkah Farm Garut · Terakhir diproduksi 17 Juli 2026 · Bahan: jagung, dedak, bungkil kedelai, mineral mix',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.FEED_FORMULA,
    entity_uuid:  'FF-gsu-0002',
    workspace_uuid: 'WS-0012',
    title:    'Formula Sapi Perah LP-2',
    subtitle: 'Sapi Perah · Protein 18% · Energi 2.800 kcal/kg',
    keywords: ['formula', 'sapi perah', 'laktasi', 'susu', 'LP-2'],
    tags:     ['perah', 'laktasi'],
    searchable_text: 'Berkah Farm Garut · Dioptimalkan untuk produksi susu tinggi · Mengandung bypass protein',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.FEED_FORMULA,
    entity_uuid:  'FF-gsu-0003',
    workspace_uuid: 'WS-0063',
    title:    'Formula Kambing PE Perah',
    subtitle: 'Kambing Perah · Protein 14% · Energi 2.600 kcal/kg',
    keywords: ['formula', 'kambing', 'PE', 'perah', 'susu kambing'],
    tags:     ['kambing', 'perah'],
    searchable_text: 'Cahaya Tani Sukabumi · Formula khusus kambing peranakan etawa · Kandungan kalsium tinggi untuk produksi susu',
  },

  // ── Feed Stock (3) ────────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.FEED_STOCK,
    entity_uuid:  'FS-gsu-0001',
    workspace_uuid: 'WS-0012',
    title:    'Stok: Konsentrat Sapi Perah CP 118',
    subtitle: 'Stok: 120 kg · Status: Di bawah minimum · Gudang Utama',
    keywords: ['konsentrat', 'CP 118', 'stok', 'charoen pokphand', 'sapi perah'],
    tags:     ['menipis', 'perlu restok'],
    searchable_text: 'Berkah Farm Garut · Kapasitas 650 kg · Konsumsi harian 24 kg · Estimasi habis 23 Juli',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.FEED_STOCK,
    entity_uuid:  'FS-gsu-0002',
    workspace_uuid: 'WS-0012',
    title:    'Stok: Rumput Gajah Segar',
    subtitle: 'Stok: 380 kg · Status: Aman · Gudang Utama',
    keywords: ['rumput gajah', 'hijauan', 'stok', 'segar'],
    tags:     ['aman', 'hijauan'],
    searchable_text: 'Berkah Farm Garut · Dipotong dari kebun sendiri · Konsumsi harian 120 kg',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.FEED_STOCK,
    entity_uuid:  'FS-gsu-0003',
    workspace_uuid: 'WS-0029',
    title:    'Stok: Premix Vitamin & Mineral',
    subtitle: 'Stok: 25 kg · Status: Cukup · Gudang B',
    keywords: ['premix', 'vitamin', 'mineral', 'suplemen', 'stok'],
    tags:     ['suplemen', 'cukup'],
    searchable_text: 'Maju Jaya Ternak · Premix Hipro-Vit · Digunakan untuk semua jenis ternak',
  },

  // ── Medicine (4) ──────────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.MEDICINE,
    entity_uuid:  'MD-gsu-0001',
    workspace_uuid: null,
    title:    'Amoxicillin 500mg — Antibiotik Broad Spectrum',
    subtitle: 'Antibiotik · Oral · Dosis: 10 mg/kg BB/hari',
    keywords: ['amoxicillin', 'antibiotik', 'infeksi', 'bakteri', 'penicillin'],
    tags:     ['antibiotik', 'umum'],
    searchable_text: 'Indikasi: infeksi saluran pernafasan, saluran pencernaan, infeksi kulit · Resep dokter hewan · Tersedia di klinik dan apotek hewan',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.MEDICINE,
    entity_uuid:  'MD-gsu-0002',
    workspace_uuid: null,
    title:    'Ivermectin 1% — Antiparasit Sistemik',
    subtitle: 'Antiparasit · Injeksi/Oral · Dosis: 0.2 mg/kg BB',
    keywords: ['ivermectin', 'antiparasit', 'cacing', 'kutu', 'tungau', 'ektoparasit', 'endoparasit'],
    tags:     ['antiparasit', 'umum'],
    searchable_text: 'Efektif melawan cacing nematoda, ektoparasit, dan tungau · Tidak boleh digunakan pada sapi perah laktasi · Withdrawal period 28 hari',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.MEDICINE,
    entity_uuid:  'MD-gsu-0003',
    workspace_uuid: null,
    title:    'Vaksin Newcastle Disease (ND) Clone 45',
    subtitle: 'Vaksin · Live attenuated · Dosis: 1 ampul/1000 ayam',
    keywords: ['vaksin', 'ND', 'newcastle disease', 'ayam', 'unggas', 'booster'],
    tags:     ['vaksin', 'unggas', 'ND'],
    searchable_text: 'Medivac ND Clone 45 (Medion) · Proteksi terhadap Newcastle Disease pada unggas · Aplikasi tetes mata atau air minum · Kedaluwarsa: Maret 2027',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.MEDICINE,
    entity_uuid:  'MD-gsu-0004',
    workspace_uuid: null,
    title:    'Oxytetracycline HCl 20% — LA Injeksi',
    subtitle: 'Antibiotik · Long-acting · Injeksi IM · Dosis: 10–20 mg/kg BB',
    keywords: ['oxytetracycline', 'OTC', 'LA', 'antibiotik', 'injeksi', 'long acting'],
    tags:     ['antibiotik', 'injeksi'],
    searchable_text: 'Indikasi: pneumonia, enteritis, mastitis, penyakit cacing hati pada sapi · Satu injeksi efektif 72 jam · Withdrawal period 14 hari',
  },

  // ── Medicine Stock (2) ────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.MEDICINE_STOCK,
    entity_uuid:  'MS-gsu-0001',
    workspace_uuid: 'WS-0012',
    title:    'Stok: Vaksin ND Clone 45',
    subtitle: 'Stok: 38 dosis · Status: Di bawah minimum · Exp: Maret 2027',
    keywords: ['vaksin', 'ND', 'stok', 'dosis', 'unggas'],
    tags:     ['menipis', 'vaksin'],
    searchable_text: 'Berkah Farm Garut · Batas minimum: 50 dosis · 5 dosis terjadwal 22 Juli 2026',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.MEDICINE_STOCK,
    entity_uuid:  'MS-gsu-0002',
    workspace_uuid: 'WS-0029',
    title:    'Stok: Ivermectin 1% — 50ml',
    subtitle: 'Stok: 12 botol · Status: Aman · Exp: Desember 2027',
    keywords: ['ivermectin', 'antiparasit', 'stok', 'botol'],
    tags:     ['aman', 'antiparasit'],
    searchable_text: 'Maju Jaya Ternak · Penggunaan terakhir 10 Juni 2026 · 3 botol digunakan bulan ini',
  },

  // ── Marketplace (5) ───────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.MARKETPLACE_LISTING,
    entity_uuid:  'LST-gsu-0001',
    workspace_uuid: 'WS-0012',
    title:    'Domba Garut Pejantan Unggul — 5 Ekor',
    subtitle: 'Rp 3.200.000 / ekor · Garut, Jawa Barat · Terverifikasi',
    keywords: ['domba', 'garut', 'pejantan', 'jual', 'listing', 'kurban'],
    tags:     ['terverifikasi', 'garut', 'domba'],
    searchable_text: 'Berkah Farm Garut · Bobot 35–42 kg · Usia 12–18 bulan · Vaksin PMK dan ND lengkap · Siap antar area Jawa Barat',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.MARKETPLACE_LISTING,
    entity_uuid:  'LST-gsu-0002',
    workspace_uuid: 'WS-0029',
    title:    'Sapi Limosin Jantan Siap Potong',
    subtitle: 'Rp 18.500.000 / ekor · Blitar, Jawa Timur · Stok: 3 ekor',
    keywords: ['sapi', 'limosin', 'potong', 'jantan', 'jual', 'sapi potong'],
    tags:     ['premium', 'sapi potong'],
    searchable_text: 'Maju Jaya Ternak · Bobot 500–550 kg · Usia 2 tahun · Surat keterangan kesehatan tersedia · Bisa antar wilayah Jawa',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.MARKETPLACE_LISTING,
    entity_uuid:  'LST-gsu-0003',
    workspace_uuid: 'WS-0063',
    title:    'Kambing PE Betina Produktif — Siap Perah',
    subtitle: 'Rp 4.500.000 / ekor · Sukabumi, Jawa Barat · Stok: 4 ekor',
    keywords: ['kambing', 'PE', 'peranakan etawa', 'betina', 'perah', 'susu'],
    tags:     ['kambing perah', 'etawa'],
    searchable_text: 'Cahaya Tani Sukabumi · Produksi susu 1.0–1.5 L/hari · Sudah pernah beranak · Sertifikat kesehatan tersedia',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.MARKETPLACE_LISTING,
    entity_uuid:  'LST-gsu-0004',
    workspace_uuid: 'WS-0074',
    title:    'Konsentrat Sapi Perah Premium — CP 118',
    subtitle: 'Rp 8.200 / kg · Min. pesanan 100 kg · Bandung',
    keywords: ['konsentrat', 'pakan', 'CP 118', 'sapi perah', 'jual pakan'],
    tags:     ['pakan', 'konsentrat'],
    searchable_text: 'Sari Bumi Ternak · Distributor resmi CP Indonesia · Pengiriman area Jawa Barat dalam 2 hari kerja',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.MARKETPLACE_LISTING,
    entity_uuid:  'LST-gsu-0005',
    workspace_uuid: 'WS-0088',
    title:    'Jasa Transportasi Ternak — Garut–Jakarta',
    subtitle: 'Rp 1.500.000 / rit · Kapasitas 8 ekor sapi · Terverifikasi',
    keywords: ['transportasi', 'angkut', 'ternak', 'mobil ternak', 'jasa kirim'],
    tags:     ['transport', 'terverifikasi', 'jasa'],
    searchable_text: 'Ekspres Ternak Jaya · Armada L300 modifikasi · SKKH wajib · Asuransi tersedia · Melayani rute Jabar–Jabotabek',
  },

  // ── Workspace (3) ─────────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.WORKSPACE,
    entity_uuid:  'WS-0012',
    workspace_uuid: null,
    title:    'Berkah Farm Garut',
    subtitle: 'Peternakan · Pro · Terverifikasi · Garut, Jawa Barat',
    keywords: ['berkah', 'farm', 'garut', 'peternakan', 'sapi', 'domba'],
    tags:     ['terverifikasi', 'pro', 'peternakan'],
    searchable_text: '75 ekor ternak aktif · 1 workspace terverifikasi · Rating 4.9/5 di Marketplace · Owner: Ahmad Hidayat',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.WORKSPACE,
    entity_uuid:  'WS-0029',
    workspace_uuid: null,
    title:    'Maju Jaya Ternak',
    subtitle: 'Peternakan · Enterprise · Blitar, Jawa Timur',
    keywords: ['maju jaya', 'ternak', 'blitar', 'sapi potong', 'enterprise'],
    tags:     ['enterprise', 'peternakan', 'sapi potong'],
    searchable_text: '142 ekor ternak aktif · 3 kandang · 2 operator · Transaksi Marketplace >Rp 200 juta sejak bergabung',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.WORKSPACE,
    entity_uuid:  'WS-0055',
    workspace_uuid: null,
    title:    'Nusantara Agribisnis',
    subtitle: 'Peternakan · Pro · Terverifikasi · Surabaya, Jawa Timur',
    keywords: ['nusantara', 'agribisnis', 'surabaya', 'ayam', 'broiler'],
    tags:     ['terverifikasi', 'pro', 'ayam'],
    searchable_text: '1.200 ekor ayam broiler · Kapasitas kandang 2.000 ekor · Sertifikasi NKV dari Dinas Peternakan',
  },

  // ── News (3) ──────────────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.NEWS,
    entity_uuid:  'NWS-gsu-0001',
    workspace_uuid: null,
    title:    'Wabah PMK Kembali Terdeteksi di Beberapa Daerah Jawa Timur',
    subtitle: 'Berita Penyakit · 15 Juli 2026 · Dinas Peternakan',
    keywords: ['PMK', 'penyakit mulut kuku', 'wabah', 'jawa timur', 'sapi', 'pencegahan'],
    tags:     ['wabah', 'PMK', 'penting'],
    searchable_text: 'Dinas Peternakan Jawa Timur mengonfirmasi terdeteksinya kasus PMK di 3 kabupaten · Vaksinasi darurat segera dilaksanakan · Peternak diminta melaporkan gejala',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.NEWS,
    entity_uuid:  'NWS-gsu-0002',
    workspace_uuid: null,
    title:    'Pemerintah Naikkan Subsidi Pakan Ternak 2026 Sebesar 20%',
    subtitle: 'Kebijakan Pemerintah · 10 Juli 2026 · Kementan',
    keywords: ['subsidi', 'pakan', 'pemerintah', 'kementan', 'program', 'ternak'],
    tags:     ['subsidi', 'kebijakan', 'pakan'],
    searchable_text: 'Kementerian Pertanian RI meningkatkan alokasi subsidi pakan ternak dari Rp 1.2 triliun menjadi Rp 1.44 triliun · Prioritas untuk peternak kecil · Pendaftaran melalui Simluhtan',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.NEWS,
    entity_uuid:  'NWS-gsu-0003',
    workspace_uuid: null,
    title:    'Teknologi IoT untuk Pemantauan Ternak: Tren 2026',
    subtitle: 'Teknologi Peternakan · 5 Juli 2026 · TernakHub Media',
    keywords: ['IoT', 'sensor', 'teknologi', 'monitoring', 'ternak', 'smart farming'],
    tags:     ['teknologi', 'inovasi'],
    searchable_text: 'Sensor suhu kandang, sistem minum otomatis, dan pemantauan berat real-time semakin terjangkau · Investasi awal Rp 5–15 juta per kandang · ROI rata-rata 2 tahun',
  },

  // ── Event (3) ─────────────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.EVENT,
    entity_uuid:  'EVT-gsu-0001',
    workspace_uuid: null,
    title:    'Kontes Domba Garut Piala Gubernur Jawa Barat 2026',
    subtitle: 'Perlombaan · 10–12 Agustus 2026 · Alun-alun Garut',
    keywords: ['kontes', 'domba', 'garut', 'piala gubernur', 'kompetisi', 'jawa barat'],
    tags:     ['kontes', 'domba', 'garut'],
    searchable_text: 'Pendaftaran dibuka hingga 31 Juli 2026 · Hadiah total Rp 150 juta · Kategori: Jantan Dewasa, Betina Dewasa, Pejantan Unggulan · Kontak: panitia@kontesdombagarut.com',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.EVENT,
    entity_uuid:  'EVT-gsu-0002',
    workspace_uuid: null,
    title:    'Seminar Nasional Kesehatan Hewan 2026',
    subtitle: 'Seminar · 25 Agustus 2026 · Hotel Bidakara Jakarta',
    keywords: ['seminar', 'kesehatan hewan', 'dokter hewan', 'veteriner', 'nasional'],
    tags:     ['seminar', 'veteriner', 'pendidikan'],
    searchable_text: 'Topik: penanganan PMK, teknologi diagnostik terkini, resistensi antimikroba pada ternak · Pembicara dari IPB, Unair, dan Balai Veteriner · Sertifikat CPD untuk dokter hewan',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.EVENT,
    entity_uuid:  'EVT-gsu-0003',
    workspace_uuid: null,
    title:    'Pameran Agribisnis & Peternakan AGRI EXPO 2026',
    subtitle: 'Pameran · 15–18 September 2026 · JIExpo Kemayoran',
    keywords: ['pameran', 'agribisnis', 'peternakan', 'AGRI EXPO', 'JIExpo', 'kemayoran'],
    tags:     ['pameran', 'agribisnis'],
    searchable_text: 'Lebih dari 300 peserta pameran dari seluruh Indonesia · Produk ternak hidup, pakan, alat peternakan, hingga teknologi kandang · Terbuka untuk umum, gratis',
  },

  // ── Notification (2) ──────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.NOTIFICATION,
    entity_uuid:  'NOT-gsu-0001',
    workspace_uuid: 'WS-0012',
    title:    'Pengingat: Jadwal Vaksinasi ND — 5 Ekor Ternak',
    subtitle: 'Reminder · Prioritas Tinggi · Belum Dibaca',
    keywords: ['vaksinasi', 'ND', 'pengingat', 'jadwal', 'kesehatan'],
    tags:     ['reminder', 'kesehatan', 'belum dibaca'],
    searchable_text: 'Berkah Farm Garut · 5 ekor ternak terjadwal vaksinasi ND Kamis 22 Juli 2026 · drh. Ahmad Fauzi',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.NOTIFICATION,
    entity_uuid:  'NOT-gsu-0002',
    workspace_uuid: 'WS-0012',
    title:    'Peringatan Stok Pakan: Konsentrat CP 118 Menipis',
    subtitle: 'Warning · Prioritas Tinggi · Belum Dibaca',
    keywords: ['stok', 'konsentrat', 'menipis', 'pakan', 'peringatan'],
    tags:     ['warning', 'pakan', 'belum dibaca'],
    searchable_text: 'Berkah Farm Garut · Stok konsentrat 120 kg di bawah minimum 150 kg · Estimasi habis 23 Juli 2026',
  },

  // ── Report (2) ────────────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.REPORT,
    entity_uuid:  'RPT-gsu-0001',
    workspace_uuid: 'WS-0012',
    title:    'Laporan Bulanan Peternakan — Juni 2026',
    subtitle: 'Laporan Berkala · Berkah Farm Garut · Siap Diunduh',
    keywords: ['laporan', 'bulanan', 'juni', '2026', 'performa', 'ringkasan'],
    tags:     ['laporan', 'bulanan'],
    searchable_text: 'Ringkasan: 75 ternak aktif, 1 kelahiran, FCR 7.2, pengeluaran pakan Rp 8.4 juta, biaya obat Rp 1.24 juta',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.REPORT,
    entity_uuid:  'RPT-gsu-0002',
    workspace_uuid: 'WS-0029',
    title:    'Laporan Transparansi Platform — Q2 2026',
    subtitle: 'Laporan Platform · Semua Pengguna · PDF Tersedia',
    keywords: ['transparansi', 'platform', 'Q2', '2026', 'statistik'],
    tags:     ['platform', 'transparansi'],
    searchable_text: '12.847 workspace aktif · Rp 47.3 miliar volume Marketplace · 0 insiden keamanan signifikan · 99.2% penyelesaian sengketa',
  },

  // ── Announcement (2) ──────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.ANNOUNCEMENT,
    entity_uuid:  'ANN-gsu-0001',
    workspace_uuid: null,
    title:    'Pemeliharaan Sistem Terjadwal — 20 Juli 2026',
    subtitle: 'Maintenance · Prioritas Tinggi · Semua Pengguna',
    keywords: ['pemeliharaan', 'maintenance', 'downtime', 'sistem', 'terjadwal'],
    tags:     ['maintenance', 'penting'],
    searchable_text: 'Sistem TernakHub tidak dapat diakses 20 Juli 2026 pukul 02.00–05.00 WIB · Pembaruan database dan keamanan',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.ANNOUNCEMENT,
    entity_uuid:  'ANN-gsu-0002',
    workspace_uuid: null,
    title:    'Peringatan Keamanan: Aktifkan 2FA Sekarang',
    subtitle: 'Security · Prioritas Tinggi · Semua Pengguna · Action Required',
    keywords: ['keamanan', '2FA', 'autentikasi', 'password', 'akun', 'security'],
    tags:     ['security', 'action required'],
    searchable_text: 'Peningkatan percobaan login tidak sah terdeteksi · Segera aktifkan 2FA di Profil → Keamanan',
  },

  // ── Data Master (2) ───────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.DATA_MASTER,
    entity_uuid:  'DM-gsu-0001',
    workspace_uuid: null,
    title:    'Penyakit Mulut dan Kuku (PMK) — FMD',
    subtitle: 'Master Penyakit · Sapi, Kambing, Domba, Babi',
    keywords: ['PMK', 'FMD', 'penyakit mulut kuku', 'virus', 'aphthovirus', 'sapi', 'domba', 'kambing'],
    tags:     ['penyakit', 'viral', 'notifiable'],
    searchable_text: 'Foot and Mouth Disease · Penyakit wajib lapor (OIE) · Gejala: lesi mulut, kaki, ambing · Pencegahan: vaksinasi rutin · Penanganan: notifikasi Dinas Peternakan',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.DATA_MASTER,
    entity_uuid:  'DM-gsu-0002',
    workspace_uuid: null,
    title:    'Sapi Limosin (Limousin) — Data Ras',
    subtitle: 'Master Jenis Ternak · Sapi Potong · Asal: Prancis',
    keywords: ['limosin', 'limousin', 'sapi potong', 'ras', 'jenis ternak', 'daging'],
    tags:     ['sapi', 'potong', 'impor'],
    searchable_text: 'Asal Prancis · Warna merah-cokelat · Bobot jantan 850–1.200 kg · Persentase karkas tinggi 65–70% · Adaptasi baik di Indonesia · Cocok untuk penggemukan komersial',
  },

  // ── Farm Profile (2) ──────────────────────────────────────────────────────
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.FARM_PROFILE,
    entity_uuid:  'FP-gsu-0001',
    workspace_uuid: null,
    title:    'Profil Publik: Berkah Farm Garut',
    subtitle: 'Peternakan Sapi & Domba · Garut · Rating 4.9/5',
    keywords: ['berkah farm', 'garut', 'profil', 'sapi', 'domba', 'terverifikasi'],
    tags:     ['terverifikasi', 'unggulan'],
    searchable_text: 'Peternakan keluarga berdiri sejak 2015 · Spesialisasi domba garut dan sapi potong · 15 transaksi marketplace berhasil · Owner: Ahmad Hidayat · Alamat: Kec. Tarogong, Garut',
  },
  {
    entity_type_reference_uuid: GSU_ENTITY_TYPE_UUID.FARM_PROFILE,
    entity_uuid:  'FP-gsu-0002',
    workspace_uuid: null,
    title:    'Profil Publik: Sumber Rejeki Farm',
    subtitle: 'Peternakan Kambing Boer · Garut · Rating 4.7/5',
    keywords: ['sumber rejeki', 'farm', 'garut', 'kambing', 'boer', 'profil'],
    tags:     ['kambing', 'boer'],
    searchable_text: 'Spesialisasi kambing Boer impor dan persilangan · Kapasitas 200 ekor · Ekspor ke Malaysia dan Singapura · Owner: Hj. Nunung · Rating tinggi untuk responsivitas',
  },
];

// ─── Quick filter tab → entity type UUIDs ────────────────────────────────────

export type SearchTabKey =
  | 'all'
  | 'livestock'
  | 'feed'
  | 'medicine'
  | 'marketplace'
  | 'workspace'
  | 'news'
  | 'event'
  | 'notification';

export const TAB_ENTITY_FILTER: Record<SearchTabKey, string[]> = {
  all:          [],
  livestock:    [GSU_ENTITY_TYPE_UUID.LIVESTOCK, GSU_ENTITY_TYPE_UUID.BATCH],
  feed:         [GSU_ENTITY_TYPE_UUID.FEED, GSU_ENTITY_TYPE_UUID.FEED_FORMULA, GSU_ENTITY_TYPE_UUID.FEED_STOCK],
  medicine:     [GSU_ENTITY_TYPE_UUID.MEDICINE, GSU_ENTITY_TYPE_UUID.MEDICINE_STOCK],
  marketplace:  [GSU_ENTITY_TYPE_UUID.MARKETPLACE_LISTING],
  workspace:    [GSU_ENTITY_TYPE_UUID.WORKSPACE, GSU_ENTITY_TYPE_UUID.FARM_PROFILE],
  news:         [GSU_ENTITY_TYPE_UUID.NEWS],
  event:        [GSU_ENTITY_TYPE_UUID.EVENT],
  notification: [GSU_ENTITY_TYPE_UUID.NOTIFICATION, GSU_ENTITY_TYPE_UUID.ANNOUNCEMENT, GSU_ENTITY_TYPE_UUID.REPORT],
};

export const TAB_LABELS: { key: SearchTabKey; label: string; icon: string }[] = [
  { key: 'all',          label: 'Semua',         icon: '🔍' },
  { key: 'livestock',    label: 'Livestock',      icon: '🐄' },
  { key: 'feed',         label: 'Feed',           icon: '🌾' },
  { key: 'medicine',     label: 'Medicine',       icon: '💊' },
  { key: 'marketplace',  label: 'Marketplace',    icon: '🛒' },
  { key: 'workspace',    label: 'Workspace',      icon: '🏢' },
  { key: 'news',         label: 'News',           icon: '📰' },
  { key: 'event',        label: 'Event',          icon: '🎪' },
  { key: 'notification', label: 'Notifikasi',     icon: '🔔' },
];

// ─── Popular & Recent search suggestions ─────────────────────────────────────

export const POPULAR_SEARCHES: { query: string; icon: string; count: number }[] = [
  { query: 'domba garut',    icon: '🐑', count: 2_841 },
  { query: 'sapi limosin',   icon: '🐄', count: 2_203 },
  { query: 'vaksin PMK',     icon: '💉', count: 1_892 },
  { query: 'konsentrat sapi', icon: '🌾', count: 1_544 },
  { query: 'kambing perah',  icon: '🐐', count: 1_201 },
  { query: 'ayam broiler',   icon: '🐔', count: 988  },
  { query: 'ivermectin',     icon: '💊', count: 876  },
  { query: 'amoxicillin',    icon: '💊', count: 743  },
];

export const RECENT_SEARCHES_DUMMY: { query: string; module: string; time: string }[] = [
  { query: 'domba garut pejantan', module: 'Livestock',   time: '2 menit lalu' },
  { query: 'konsentrat CP 118',    module: 'Feed Stock',  time: '15 menit lalu' },
  { query: 'vaksin ND clone 45',   module: 'Medicine',    time: '1 jam lalu' },
  { query: 'sapi limosin blitar',  module: 'Marketplace', time: '3 jam lalu' },
  { query: 'berkah farm',          module: 'Workspace',   time: '5 jam lalu' },
];
