// ─── Feed Store Workspace Foundation (FSW-001) ────────────────────────────────
// Operational data layer for Feed Store Workspace.
//
// Scope: Store profile, product catalog, categories, service coverage,
//        activity history, and access control.
//
// Architecture rules:
//  - Does NOT modify Master Pakan, Produk Komersial, Stok Pakan, or Marketplace.
//  - NO ordering, NO checkout, NO inventory sync, NO payment, NO shipping.
//  - Access gated by ViewerRole (arch-only; production = server-side claims).
//  - All prices are placeholders (hargaPlaceholder) — no real commerce logic.

// ─── Product Categories ───────────────────────────────────────────────────────

export type FeedProductCategory =
  | 'Rumput & Hijauan'
  | 'Silase'
  | 'Jerami'
  | 'Konsentrat'
  | 'Pakan Komplit'
  | 'Bahan Pakan'
  | 'Aditif Pakan'
  | 'Premix'
  | 'Mineral'
  | 'Vitamin'
  | 'Susu Pengganti';

export const FEED_PRODUCT_CATEGORIES: FeedProductCategory[] = [
  'Rumput & Hijauan',
  'Silase',
  'Jerami',
  'Konsentrat',
  'Pakan Komplit',
  'Bahan Pakan',
  'Aditif Pakan',
  'Premix',
  'Mineral',
  'Vitamin',
  'Susu Pengganti',
];

export const FEED_CATEGORY_CONFIG: Record<
  FeedProductCategory,
  { icon: string; color: string; bg: string; description: string }
> = {
  'Rumput & Hijauan': {
    icon: '🌿',
    color: '#166534',
    bg: '#dcfce7',
    description: 'Rumput segar, legum, dan hijauan pakan ternak',
  },
  Silase: {
    icon: '🫙',
    color: '#0e7490',
    bg: '#cffafe',
    description: 'Pakan fermentasi berbasis rumput dan jagung',
  },
  Jerami: {
    icon: '🌾',
    color: '#92400e',
    bg: '#fef3c7',
    description: 'Jerami padi, jagung, dan limbah pertanian kering',
  },
  Konsentrat: {
    icon: '🌽',
    color: '#d97706',
    bg: '#fef9c3',
    description: 'Pakan konsentrat berprotein tinggi untuk ternak produktif',
  },
  'Pakan Komplit': {
    icon: '🥣',
    color: '#7c3aed',
    bg: '#ede9fe',
    description: 'Complete feed siap pakai untuk sapi, kambing, dan unggas',
  },
  'Bahan Pakan': {
    icon: '🌰',
    color: '#b45309',
    bg: '#fef3c7',
    description: 'Bahan baku pakan: bungkil, dedak, jagung, dll.',
  },
  'Aditif Pakan': {
    icon: '🧪',
    color: '#5b21b6',
    bg: '#ede9fe',
    description: 'Enzim, probiotik, asam organik, dan aditif lainnya',
  },
  Premix: {
    icon: '⚗️',
    color: '#be185d',
    bg: '#fce7f3',
    description: 'Campuran vitamin-mineral terformulasi untuk ransum',
  },
  Mineral: {
    icon: '💎',
    color: '#1e40af',
    bg: '#dbeafe',
    description: 'Mineral makro dan mikro: garam, kapur, dolomit, dll.',
  },
  Vitamin: {
    icon: '💊',
    color: '#0891b2',
    bg: '#e0f2fe',
    description: 'Suplemen vitamin larut air dan larut lemak',
  },
  'Susu Pengganti': {
    icon: '🍼',
    color: '#9d174d',
    bg: '#fce7f3',
    description: 'Milk replacer untuk pedet, cempe, dan anak ternak muda',
  },
};

// ─── Activity Types ───────────────────────────────────────────────────────────

export type FeedStoreActivityType =
  | 'Penerimaan Stok'
  | 'Pembaruan Harga'
  | 'Pembuatan Listing'
  | 'Nonaktif Produk'
  | 'Promosi';

export const ACTIVITY_TYPE_CONFIG: Record<
  FeedStoreActivityType,
  { icon: string; color: string; bg: string }
> = {
  'Penerimaan Stok': { icon: '📦', color: '#166534', bg: '#dcfce7' },
  'Pembaruan Harga': { icon: '💰', color: '#92400e', bg: '#fef3c7' },
  'Pembuatan Listing': { icon: '📝', color: '#1e40af', bg: '#dbeafe' },
  'Nonaktif Produk': { icon: '🚫', color: '#6b7280', bg: '#f3f4f6' },
  Promosi: { icon: '🎯', color: '#be185d', bg: '#fce7f3' },
};

// ─── Product Record ───────────────────────────────────────────────────────────

export type FeedProductAvailability = 'Tersedia' | 'Stok Terbatas' | 'Habis';

export interface FeedStoreProductRecord {
  id: string;
  workspaceId: string;
  namaProduk: string;
  kategori: FeedProductCategory;
  satuan: string;             // e.g. "kg", "sak 50 kg", "liter", "botol"
  ketersediaan: FeedProductAvailability;
  hargaPlaceholder: string;   // display-only, e.g. "Rp 2.500/kg" — no real commerce
  deskripsiSingkat: string;
  target: string[];           // target livestock
}

export const PRODUCT_AVAILABILITY_CONFIG: Record<
  FeedProductAvailability,
  { icon: string; color: string; bg: string; border: string }
> = {
  Tersedia:        { icon: '✅', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  'Stok Terbatas': { icon: '⚠️', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  Habis:           { icon: '🚫', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};

// ─── Service Area ─────────────────────────────────────────────────────────────

export interface FeedStoreServiceArea {
  id: string;
  workspaceId: string;
  namaWilayah: string;
  provinsi: string;
  kabupatenKota: string[];
  estimasiPengiriman: string;
  minOrderKg: number | null;
  keterangan: string;
}

// ─── Activity Record ──────────────────────────────────────────────────────────

export interface FeedStoreActivityRecord {
  id: string;            // e.g. "FSW-ACT-001"
  workspaceId: string;
  produkId: string | null;
  namaProduk: string;
  tipeAktivitas: FeedStoreActivityType;
  tanggal: string;       // ISO yyyy-mm-dd
  keterangan: string;
}

// ─── Workspace Meta ───────────────────────────────────────────────────────────

export interface FeedStoreWorkspaceMeta {
  workspaceId: string;
  nama: string;
  logo: string;
  banner: string;
  deskripsi: string;
  lokasiUmum: string;
  kontakPublik: string;
  bergabungSejak: string;
  jamOperasional: string;
  website: string | null;
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface FeedStoreWorkspaceSummary {
  totalProduk: number;
  produkTersedia: number;
  totalKategori: number;
  ordersPlaceholder: string;   // Always placeholder text — no real orders
  totalWilayahLayanan: number;
}

// ─── Access Control ───────────────────────────────────────────────────────────

export type FeedStoreViewerRole = 'public' | 'member' | 'admin' | 'owner' | 'platform_admin';

export interface FeedStoreAccessDecision {
  role: FeedStoreViewerRole;
  canViewOperational: boolean;   // internal notes, full activity log
  canViewFinancial: boolean;     // detailed pricing history
  canEditProducts: boolean;      // always false in FSW-001
}

type FeedStoreMemberEntry = {
  userId: string;
  workspaceId: string;
  role: 'Owner' | 'Admin' | 'Member';
};

const FSW_MEMBER_ROLES: FeedStoreMemberEntry[] = [
  { userId: 'usr-budi-001',  workspaceId: 'w7', role: 'Owner' },
  { userId: 'usr-siti-002',  workspaceId: 'w7', role: 'Admin' },
];

export function deriveFeedStoreAccess(
  workspaceId: string,
  viewerUserId: string | null,
): FeedStoreAccessDecision {
  if (!viewerUserId) {
    return {
      role: 'public',
      canViewOperational: false,
      canViewFinancial: false,
      canEditProducts: false,
    };
  }
  const entry = FSW_MEMBER_ROLES.find(
    (m) => m.workspaceId === workspaceId && m.userId === viewerUserId,
  );
  if (!entry) {
    return {
      role: 'public',
      canViewOperational: false,
      canViewFinancial: false,
      canEditProducts: false,
    };
  }
  return {
    role: entry.role === 'Owner' ? 'owner' : entry.role === 'Admin' ? 'admin' : 'member',
    canViewOperational: true,
    canViewFinancial: entry.role === 'Owner' || entry.role === 'Admin',
    canEditProducts: false, // reserved — FSW-001
  };
}

/**
 * @deprecated P0-002B — viewer identity must come from AuthContext (useAuth).
 * Nullified; kept only for backward-compat during migration.
 */
export const CURRENT_FSW_VIEWER_ID: string | null = null;

// ─── Seed Data — Workspace Meta ───────────────────────────────────────────────

const FSW_WORKSPACE_META: FeedStoreWorkspaceMeta[] = [
  {
    workspaceId: 'w7',
    nama: 'Toko Pakan Berkah Tani',
    logo: '🌾',
    banner: '🌿',
    deskripsi:
      'Distributor dan pengecer pakan ternak terpercaya di Malang Raya. Menyediakan berbagai jenis pakan berkualitas tinggi: rumput, silase, konsentrat, pakan komplit, mineral, vitamin, hingga susu pengganti. Melayani peternak skala kecil, menengah, dan koperasi. Pengiriman tersedia ke seluruh wilayah Jawa Timur dengan armada sendiri.',
    lokasiUmum: 'Malang, Jawa Timur',
    kontakPublik: '+62 812-3456-7890',
    bergabungSejak: '2025-02-10',
    jamOperasional: 'Senin–Sabtu 07.00–17.00 WIB',
    website: 'www.berkahtanimalang.id',
  },
];

// ─── Seed Data — Product Catalog ──────────────────────────────────────────────

const FEED_PRODUCT_DB: FeedStoreProductRecord[] = [
  // ── Rumput & Hijauan ──
  {
    id: 'FSW-PRD-001',
    workspaceId: 'w7',
    namaProduk: 'Rumput Gajah Segar (Pennisetum purpureum)',
    kategori: 'Rumput & Hijauan',
    satuan: 'kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 800/kg',
    deskripsiSingkat: 'Rumput gajah segar dipotong pagi hari. Cocok untuk sapi, kambing, dan kerbau. Kadar air ±75%.',
    target: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
  },
  {
    id: 'FSW-PRD-002',
    workspaceId: 'w7',
    namaProduk: 'Rumput Odot Cincang',
    kategori: 'Rumput & Hijauan',
    satuan: 'kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 750/kg',
    deskripsiSingkat: 'Rumput odot (dwarf elephant grass) dicincang siap saji. Kandungan protein lebih tinggi dari rumput gajah biasa.',
    target: ['Sapi', 'Kambing', 'Domba'],
  },
  {
    id: 'FSW-PRD-003',
    workspaceId: 'w7',
    namaProduk: 'Legum Gamal Segar (Gliricidia sepium)',
    kategori: 'Rumput & Hijauan',
    satuan: 'kg',
    ketersediaan: 'Stok Terbatas',
    hargaPlaceholder: 'Rp 1.200/kg',
    deskripsiSingkat: 'Daun gamal segar, sumber protein nabati berkualitas tinggi untuk ternak ruminansia. Campurkan dengan rumput untuk keseimbangan nutrisi.',
    target: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
  },

  // ── Silase ──
  {
    id: 'FSW-PRD-004',
    workspaceId: 'w7',
    namaProduk: 'Silase Jagung Premium',
    kategori: 'Silase',
    satuan: 'kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 1.500/kg',
    deskripsiSingkat: 'Silase jagung whole-plant, fermentasi anaerob 21 hari. pH ≤4,2. Cocok untuk sapi perah produktif dan sapi potong penggemukan.',
    target: ['Sapi Perah', 'Sapi Potong'],
  },
  {
    id: 'FSW-PRD-005',
    workspaceId: 'w7',
    namaProduk: 'Silase Rumput Gajah',
    kategori: 'Silase',
    satuan: 'kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 1.200/kg',
    deskripsiSingkat: 'Silase rumput gajah varietas King Grass, dikemas dalam plastik press. Daya simpan 6–12 bulan. Ideal untuk daerah kering musim kemarau.',
    target: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
  },

  // ── Jerami ──
  {
    id: 'FSW-PRD-006',
    workspaceId: 'w7',
    namaProduk: 'Jerami Padi Kering (Bale)',
    kategori: 'Jerami',
    satuan: 'bal (±15 kg)',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 35.000/bal',
    deskripsiSingkat: 'Jerami padi kering dibaled menggunakan mesin. Kadar air <15%. Cocok sebagai pakan basal sapi dan kerbau, atau bedding kandang.',
    target: ['Sapi', 'Kerbau', 'Kambing'],
  },
  {
    id: 'FSW-PRD-007',
    workspaceId: 'w7',
    namaProduk: 'Jerami Padi Fermentasi (Urea Treatment)',
    kategori: 'Jerami',
    satuan: 'kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 1.800/kg',
    deskripsiSingkat: 'Jerami padi yang telah diperlakukan dengan urea (amoniasi) untuk meningkatkan nilai gizi. Kadar protein kasar meningkat dari ±4% menjadi ±8%.',
    target: ['Sapi', 'Kerbau'],
  },

  // ── Konsentrat ──
  {
    id: 'FSW-PRD-008',
    workspaceId: 'w7',
    namaProduk: 'Konsentrat Sapi Perah PKP 16',
    kategori: 'Konsentrat',
    satuan: 'sak 50 kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 285.000/sak',
    deskripsiSingkat: 'Konsentrat protein tinggi (PK 16%) untuk sapi perah laktasi. Formulasi khusus mendukung produksi susu optimal. Kandungan Ca/P seimbang.',
    target: ['Sapi Perah'],
  },
  {
    id: 'FSW-PRD-009',
    workspaceId: 'w7',
    namaProduk: 'Konsentrat Penggemukan Sapi Potong',
    kategori: 'Konsentrat',
    satuan: 'sak 50 kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 265.000/sak',
    deskripsiSingkat: 'Konsentrat energi tinggi (TDN >72%) untuk program penggemukan intensif sapi potong. ADG target 0,8–1,2 kg/hari.',
    target: ['Sapi Potong'],
  },
  {
    id: 'FSW-PRD-010',
    workspaceId: 'w7',
    namaProduk: 'Konsentrat Kambing & Domba',
    kategori: 'Konsentrat',
    satuan: 'sak 25 kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 155.000/sak',
    deskripsiSingkat: 'Konsentrat formulasi khusus kambing PE dan domba. PK 14%, cocok untuk indukan bunting, laktasi, dan penggemukan anak.',
    target: ['Kambing', 'Domba'],
  },

  // ── Pakan Komplit ──
  {
    id: 'FSW-PRD-011',
    workspaceId: 'w7',
    namaProduk: 'Pakan Komplit Sapi Perah (Total Mixed Ration)',
    kategori: 'Pakan Komplit',
    satuan: 'kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 3.200/kg',
    deskripsiSingkat: 'TMR siap pakai untuk sapi perah. Formulasi seimbang hijauan:konsentrat 60:40. Cukup diberikan 2x/hari tanpa suplemen tambahan.',
    target: ['Sapi Perah'],
  },
  {
    id: 'FSW-PRD-012',
    workspaceId: 'w7',
    namaProduk: 'Pakan Komplit Ayam Broiler',
    kategori: 'Pakan Komplit',
    satuan: 'sak 50 kg',
    ketersediaan: 'Stok Terbatas',
    hargaPlaceholder: 'Rp 385.000/sak',
    deskripsiSingkat: 'Pakan broiler starter-finisher all-in-one. Protein 21–22%, energi metabolis 3.000 kcal/kg. Merek rekanan produsen lokal Malang.',
    target: ['Ayam Broiler'],
  },

  // ── Bahan Pakan ──
  {
    id: 'FSW-PRD-013',
    workspaceId: 'w7',
    namaProduk: 'Dedak Padi Kasar',
    kategori: 'Bahan Pakan',
    satuan: 'sak 50 kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 90.000/sak',
    deskripsiSingkat: 'Dedak padi kasar (rice bran) dari penggilingan lokal Malang. Kadar protein ±8%, lemak ±12%. Baik sebagai sumber energi dan serat.',
    target: ['Sapi', 'Kambing', 'Domba', 'Ayam', 'Itik'],
  },
  {
    id: 'FSW-PRD-014',
    workspaceId: 'w7',
    namaProduk: 'Bungkil Kedelai (Soybean Meal)',
    kategori: 'Bahan Pakan',
    satuan: 'sak 50 kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 420.000/sak',
    deskripsiSingkat: 'Bungkil kedelai ekstrasi pelarut (solvent extracted). Protein kasar ±44%, bypass protein tinggi. Sumber protein utama ransum unggas dan ruminansia.',
    target: ['Sapi', 'Kambing', 'Domba', 'Ayam', 'Itik'],
  },
  {
    id: 'FSW-PRD-015',
    workspaceId: 'w7',
    namaProduk: 'Jagung Giling Halus',
    kategori: 'Bahan Pakan',
    satuan: 'sak 50 kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 280.000/sak',
    deskripsiSingkat: 'Jagung pipilan kering digiling halus. Kadar air <14%, TDN ±80%. Sumber energi utama ransum unggas dan ruminansia penggemukan.',
    target: ['Sapi', 'Kambing', 'Ayam', 'Itik'],
  },

  // ── Aditif Pakan ──
  {
    id: 'FSW-PRD-016',
    workspaceId: 'w7',
    namaProduk: 'Probiotik Ternak (Bacillus subtilis)',
    kategori: 'Aditif Pakan',
    satuan: 'botol 500 g',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 145.000/botol',
    deskripsiSingkat: 'Probiotik spora Bacillus subtilis ≥1×10⁹ CFU/g. Meningkatkan kecernaan pakan, menjaga keseimbangan mikroflora usus, dan menekan patogen.',
    target: ['Sapi', 'Kambing', 'Domba', 'Ayam', 'Itik'],
  },
  {
    id: 'FSW-PRD-017',
    workspaceId: 'w7',
    namaProduk: 'Enzim Fitase Cair',
    kategori: 'Aditif Pakan',
    satuan: 'liter',
    ketersediaan: 'Stok Terbatas',
    hargaPlaceholder: 'Rp 280.000/liter',
    deskripsiSingkat: 'Enzim fitase untuk meningkatkan ketersediaan fosfor nabati pada unggas. Mengurangi kebutuhan suplemen fosfat anorganik hingga 30%.',
    target: ['Ayam', 'Itik', 'Puyuh'],
  },

  // ── Premix ──
  {
    id: 'FSW-PRD-018',
    workspaceId: 'w7',
    namaProduk: 'Premix Sapi Perah (Vitamin–Mineral)',
    kategori: 'Premix',
    satuan: 'sak 25 kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 350.000/sak',
    deskripsiSingkat: 'Premix lengkap vitamin dan mineral untuk formulasi ransum sapi perah. Dosis 0,5% dari total ransum. Mengandung Vit A, D3, E, B-kompleks, Cu, Zn, Se.',
    target: ['Sapi Perah'],
  },
  {
    id: 'FSW-PRD-019',
    workspaceId: 'w7',
    namaProduk: 'Premix Unggas Layer',
    kategori: 'Premix',
    satuan: 'sak 25 kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 295.000/sak',
    deskripsiSingkat: 'Premix untuk ayam petelur (layer). Mengandung vitamin, mineral esensial, dan asam amino sintetis. Dosis penggunaan 0,25% dari ransum.',
    target: ['Ayam Petelur'],
  },

  // ── Mineral ──
  {
    id: 'FSW-PRD-020',
    workspaceId: 'w7',
    namaProduk: 'Garam Mineral Blok (Salt Lick)',
    kategori: 'Mineral',
    satuan: 'blok 5 kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 55.000/blok',
    deskripsiSingkat: 'Mineral blok yang mengandung NaCl, Mg, Ca, P, Zn, Cu, Co, Se. Dijilat ternak sesuai kebutuhan (ad libitum). Untuk sapi, kambing, dan domba.',
    target: ['Sapi', 'Kambing', 'Domba', 'Kerbau'],
  },
  {
    id: 'FSW-PRD-021',
    workspaceId: 'w7',
    namaProduk: 'Kapur Pertanian (Calcite)',
    kategori: 'Mineral',
    satuan: 'sak 50 kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 45.000/sak',
    deskripsiSingkat: 'Sumber kalsium dan magnesium untuk suplementasi ternak. Juga digunakan sebagai penetral asam kandang dan desinfektan alami.',
    target: ['Sapi', 'Kambing', 'Domba', 'Ayam'],
  },

  // ── Vitamin ──
  {
    id: 'FSW-PRD-022',
    workspaceId: 'w7',
    namaProduk: 'Vitamin ADE Injeksi (100 mL)',
    kategori: 'Vitamin',
    satuan: 'botol 100 mL',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 85.000/botol',
    deskripsiSingkat: 'Suplemen vitamin ADE larutan injeksi untuk ternak defisiensi. Mencegah kebutaan malam (Vit A), rakitis (Vit D3), dan peroksidasi lipid (Vit E).',
    target: ['Sapi', 'Kambing', 'Domba', 'Ayam'],
  },
  {
    id: 'FSW-PRD-023',
    workspaceId: 'w7',
    namaProduk: 'Vitamin B-Kompleks Oral (500 mL)',
    kategori: 'Vitamin',
    satuan: 'botol 500 mL',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 65.000/botol',
    deskripsiSingkat: 'Suplemen B-kompleks larutan oral untuk mendukung metabolisme energi, nafsu makan, dan kesehatan sistem saraf ternak.',
    target: ['Sapi', 'Kambing', 'Domba', 'Ayam', 'Itik'],
  },

  // ── Susu Pengganti ──
  {
    id: 'FSW-PRD-024',
    workspaceId: 'w7',
    namaProduk: 'Milk Replacer Pedet (Sapi)',
    kategori: 'Susu Pengganti',
    satuan: 'sak 25 kg',
    ketersediaan: 'Tersedia',
    hargaPlaceholder: 'Rp 680.000/sak',
    deskripsiSingkat: 'Susu pengganti berbasis whey protein untuk pedet sapi 0–8 minggu. Protein ≥22%, lemak ≥15%. Larutkan 1 bag (125 g) dalam 1 liter air hangat.',
    target: ['Pedet Sapi'],
  },
  {
    id: 'FSW-PRD-025',
    workspaceId: 'w7',
    namaProduk: 'Milk Replacer Cempe (Kambing & Domba)',
    kategori: 'Susu Pengganti',
    satuan: 'sak 10 kg',
    ketersediaan: 'Habis',
    hargaPlaceholder: 'Rp 420.000/sak',
    deskripsiSingkat: 'Susu pengganti khusus cempe kambing PE dan domba. Formula mendekati komposisi susu kambing alami. Diberikan 3–4x/hari pada anak umur <4 minggu.',
    target: ['Anak Kambing', 'Anak Domba'],
  },
];

// ─── Seed Data — Service Areas ─────────────────────────────────────────────────

const FSW_SERVICE_AREA_DB: FeedStoreServiceArea[] = [
  {
    id: 'FSA-001',
    workspaceId: 'w7',
    namaWilayah: 'Malang Raya',
    provinsi: 'Jawa Timur',
    kabupatenKota: [
      'Kota Malang',
      'Kabupaten Malang',
      'Kota Batu',
      'Kepanjen',
      'Singosari',
      'Tumpang',
    ],
    estimasiPengiriman: 'Same-day (order sebelum 10.00 WIB)',
    minOrderKg: 50,
    keterangan:
      'Area utama. Pengiriman gratis untuk order ≥500 kg. Armada sendiri tersedia. Pickup langsung ke toko juga tersedia setiap hari kerja.',
  },
  {
    id: 'FSA-002',
    workspaceId: 'w7',
    namaWilayah: 'Pasuruan & Probolinggo',
    provinsi: 'Jawa Timur',
    kabupatenKota: [
      'Kota Pasuruan',
      'Kabupaten Pasuruan',
      'Kota Probolinggo',
      'Kabupaten Probolinggo',
    ],
    estimasiPengiriman: '1 hari kerja',
    minOrderKg: 100,
    keterangan:
      'Pengiriman terjadwal 2x seminggu (Selasa & Jumat). Gabung pengiriman dengan pelanggan lain untuk efisiensi ongkos kirim.',
  },
  {
    id: 'FSA-003',
    workspaceId: 'w7',
    namaWilayah: 'Blitar & Kediri',
    provinsi: 'Jawa Timur',
    kabupatenKota: [
      'Kota Blitar',
      'Kabupaten Blitar',
      'Kota Kediri',
      'Kabupaten Kediri',
    ],
    estimasiPengiriman: '1–2 hari kerja',
    minOrderKg: 200,
    keterangan:
      'Pengiriman 1x seminggu setiap Rabu. Min. order 200 kg atau kerjasama via koperasi/kelompok tani.',
  },
  {
    id: 'FSA-004',
    workspaceId: 'w7',
    namaWilayah: 'Lumajang & Jember',
    provinsi: 'Jawa Timur',
    kabupatenKota: [
      'Kabupaten Lumajang',
      'Kota Jember',
      'Kabupaten Jember',
    ],
    estimasiPengiriman: '2 hari kerja',
    minOrderKg: 500,
    keterangan:
      'Hanya untuk order massal via koperasi peternak atau grosir pakan. Koordinasi H-3 sebelum pengiriman.',
  },
  {
    id: 'FSA-005',
    workspaceId: 'w7',
    namaWilayah: 'Surabaya Raya',
    provinsi: 'Jawa Timur',
    kabupatenKota: [
      'Kota Surabaya',
      'Sidoarjo',
      'Gresik',
    ],
    estimasiPengiriman: '1 hari kerja',
    minOrderKg: 300,
    keterangan:
      'Pengiriman 1x seminggu setiap Kamis via mitra ekspedisi. Tersedia dropship ke pelanggan retail dengan biaya ongkir terpisah.',
  },
];

// ─── Seed Data — Activity History ─────────────────────────────────────────────

const FSW_ACTIVITY_DB: FeedStoreActivityRecord[] = [
  {
    id: 'FSW-ACT-001',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-008',
    namaProduk: 'Konsentrat Sapi Perah PKP 16',
    tipeAktivitas: 'Penerimaan Stok',
    tanggal: '2026-07-17',
    keterangan: 'Penerimaan 200 sak dari distributor Surabaya. Cek fisik OK, kadar air sesuai spesifikasi.',
  },
  {
    id: 'FSW-ACT-002',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-001',
    namaProduk: 'Rumput Gajah Segar',
    tipeAktivitas: 'Pembaruan Harga',
    tanggal: '2026-07-16',
    keterangan: 'Penyesuaian harga musim kemarau: Rp 700/kg → Rp 800/kg. Efektif mulai 16 Juli 2026.',
  },
  {
    id: 'FSW-ACT-003',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-011',
    namaProduk: 'Pakan Komplit Sapi Perah (TMR)',
    tipeAktivitas: 'Pembuatan Listing',
    tanggal: '2026-07-15',
    keterangan: 'Produk baru ditambahkan ke katalog: TMR siap pakai hasil kerjasama dengan nutrisionis setempat.',
  },
  {
    id: 'FSW-ACT-004',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-004',
    namaProduk: 'Silase Jagung Premium',
    tipeAktivitas: 'Penerimaan Stok',
    tanggal: '2026-07-14',
    keterangan: 'Penerimaan 5 ton silase jagung dari mitra petani Batu. Kualitas baik, pH 3,9.',
  },
  {
    id: 'FSW-ACT-005',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-025',
    namaProduk: 'Milk Replacer Cempe',
    tipeAktivitas: 'Nonaktif Produk',
    tanggal: '2026-07-13',
    keterangan: 'Stok habis. Listing dinonaktifkan sementara. Pemesanan ke distributor sudah dilakukan, estimasi restok 2 minggu.',
  },
  {
    id: 'FSW-ACT-006',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-020',
    namaProduk: 'Garam Mineral Blok (Salt Lick)',
    tipeAktivitas: 'Promosi',
    tanggal: '2026-07-12',
    keterangan: 'Promosi Idul Adha: beli 10 blok gratis 1 blok. Berlaku 10–20 Juli 2026.',
  },
  {
    id: 'FSW-ACT-007',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-006',
    namaProduk: 'Jerami Padi Kering (Bale)',
    tipeAktivitas: 'Penerimaan Stok',
    tanggal: '2026-07-11',
    keterangan: 'Penerimaan 500 bal jerami dari Kediri. Kadar air sudah dipastikan <15% via moisture meter.',
  },
  {
    id: 'FSW-ACT-008',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-009',
    namaProduk: 'Konsentrat Penggemukan Sapi Potong',
    tipeAktivitas: 'Pembaruan Harga',
    tanggal: '2026-07-10',
    keterangan: 'Kenaikan harga bahan baku bungkil mengakibatkan penyesuaian harga jual: Rp 250.000 → Rp 265.000/sak.',
  },
  {
    id: 'FSW-ACT-009',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-016',
    namaProduk: 'Probiotik Ternak (Bacillus subtilis)',
    tipeAktivitas: 'Pembuatan Listing',
    tanggal: '2026-07-08',
    keterangan: 'Produk baru dari distributor baru. Sudah uji coba internal di kandang percobaan selama 2 minggu dengan hasil positif.',
  },
  {
    id: 'FSW-ACT-010',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-013',
    namaProduk: 'Dedak Padi Kasar',
    tipeAktivitas: 'Penerimaan Stok',
    tanggal: '2026-07-07',
    keterangan: 'Penerimaan rutin 300 sak dari penggilingan padi lokal Kepanjen. Kualitas sesuai standar.',
  },
  {
    id: 'FSW-ACT-011',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-003',
    namaProduk: 'Legum Gamal Segar',
    tipeAktivitas: 'Pembaruan Harga',
    tanggal: '2026-07-05',
    keterangan: 'Stok gamal menipis karena musim kemarau. Harga dinaikkan dari Rp 1.000 → Rp 1.200/kg. Status diubah ke Stok Terbatas.',
  },
  {
    id: 'FSW-ACT-012',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-018',
    namaProduk: 'Premix Sapi Perah (Vitamin–Mineral)',
    tipeAktivitas: 'Penerimaan Stok',
    tanggal: '2026-07-03',
    keterangan: 'Penerimaan 50 sak premix dari distributor Surabaya. Cek tanggal kedaluwarsa dan keutuhan kemasan OK.',
  },
  {
    id: 'FSW-ACT-013',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-012',
    namaProduk: 'Pakan Komplit Ayam Broiler',
    tipeAktivitas: 'Promosi',
    tanggal: '2026-07-01',
    keterangan: 'Promosi Harbolnas: diskon 5% untuk pembelian ≥10 sak. Berlaku 1–7 Juli 2026.',
  },
  {
    id: 'FSW-ACT-014',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-024',
    namaProduk: 'Milk Replacer Pedet (Sapi)',
    tipeAktivitas: 'Pembuatan Listing',
    tanggal: '2026-06-28',
    keterangan: 'Produk baru ditambahkan setelah ada permintaan dari beberapa peternak sapi perah di Pujon dan Ngantang.',
  },
  {
    id: 'FSW-ACT-015',
    workspaceId: 'w7',
    produkId: 'FSW-PRD-015',
    namaProduk: 'Jagung Giling Halus',
    tipeAktivitas: 'Penerimaan Stok',
    tanggal: '2026-06-25',
    keterangan: 'Penerimaan 400 sak jagung giling dari petani binaan Malang Selatan. Kadar air 13,2% (sesuai standar).',
  },
];

// ─── Accessor Functions ────────────────────────────────────────────────────────

export function getFeedStoreWorkspaceMeta(
  workspaceId: string,
): FeedStoreWorkspaceMeta | null {
  return FSW_WORKSPACE_META.find((m) => m.workspaceId === workspaceId) ?? null;
}

export function getFeedStoreWorkspaceSummary(
  workspaceId: string,
): FeedStoreWorkspaceSummary {
  const products = FEED_PRODUCT_DB.filter((p) => p.workspaceId === workspaceId);
  const areas    = FSW_SERVICE_AREA_DB.filter((a) => a.workspaceId === workspaceId);

  const categoriesWithProducts = new Set(products.map((p) => p.kategori));

  return {
    totalProduk:         products.length,
    produkTersedia:      products.filter((p) => p.ketersediaan === 'Tersedia').length,
    totalKategori:       categoriesWithProducts.size,
    ordersPlaceholder:   'Segera Hadir',
    totalWilayahLayanan: areas.length,
  };
}

export function getProductsByWorkspace(
  workspaceId: string,
): FeedStoreProductRecord[] {
  return FEED_PRODUCT_DB.filter((p) => p.workspaceId === workspaceId);
}

export function getServiceAreasByWorkspace(
  workspaceId: string,
): FeedStoreServiceArea[] {
  return FSW_SERVICE_AREA_DB.filter((a) => a.workspaceId === workspaceId);
}

export function getActivitiesByWorkspace(
  workspaceId: string,
): FeedStoreActivityRecord[] {
  return FSW_ACTIVITY_DB
    .filter((a) => a.workspaceId === workspaceId)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatTanggalFSW(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('id-ID', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
}
