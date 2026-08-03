// ─── Drug Store Workspace Data — ADMIN-SYNC-006 ────────────────────────────────
// Utility constants and helpers untuk UI Drug Store.
//
// Dummy data (DSW_WORKSPACE_META, DSW_PRODUCT_DB, DSW_RECENT_ORDERS,
// DSW_TODAY_ACTIVITIES) dan accessor functions telah dihapus pada ADMIN-SYNC-006.
// Sumber data sekarang LIVE dari Supabase via useDrugStoreDashboardData hook.
//
// File ini hanya menyimpan:
//   - Konstanta kategori produk obat (UI label/icon/color)
//   - Konstanta status ketersediaan (UI color/badge)
//   - Konstanta status kedaluwarsa (UI color/badge)

// ─── Product Categories ───────────────────────────────────────────────────────

export type DrugProductCategory =
  | 'Antibiotik'
  | 'Vitamin & Suplemen'
  | 'Vaksin'
  | 'Antiparasit'
  | 'Analgesik & Antiinflamasi'
  | 'Desinfektan & Biosekuriti'
  | 'Hormon & Reproduksi'
  | 'Peralatan Medis';

export const DRUG_PRODUCT_CATEGORIES: DrugProductCategory[] = [
  'Antibiotik',
  'Vitamin & Suplemen',
  'Vaksin',
  'Antiparasit',
  'Analgesik & Antiinflamasi',
  'Desinfektan & Biosekuriti',
  'Hormon & Reproduksi',
  'Peralatan Medis',
];

export const DRUG_CATEGORY_CONFIG: Record<
  DrugProductCategory,
  { icon: string; color: string; bg: string; description: string }
> = {
  'Antibiotik': {
    icon: '💊', color: '#0097a7', bg: '#e0f7fa',
    description: 'Antibiotik broad-spectrum dan narrow-spectrum untuk ternak',
  },
  'Vitamin & Suplemen': {
    icon: '🌿', color: '#00796b', bg: '#e0f2f1',
    description: 'Vitamin, mineral, dan suplemen pendukung kesehatan ternak',
  },
  'Vaksin': {
    icon: '💉', color: '#1565c0', bg: '#e3f2fd',
    description: 'Vaksin pencegah penyakit infeksius pada ternak',
  },
  'Antiparasit': {
    icon: '🔬', color: '#6a1b9a', bg: '#f3e5f5',
    description: 'Obat cacing, antiprotozoa, dan ektoparasitisid',
  },
  'Analgesik & Antiinflamasi': {
    icon: '🩺', color: '#c62828', bg: '#ffebee',
    description: 'Pereda nyeri dan penurun demam untuk ternak sakit',
  },
  'Desinfektan & Biosekuriti': {
    icon: '🧴', color: '#558b2f', bg: '#f1f8e9',
    description: 'Disinfektan kandang, sanitasi peralatan, dan biosekuriti',
  },
  'Hormon & Reproduksi': {
    icon: '🧬', color: '#f57f17', bg: '#fffde7',
    description: 'Hormon sinkronisasi birahi, terapi reproduksi, dan support kelahiran',
  },
  'Peralatan Medis': {
    icon: '🔧', color: '#37474f', bg: '#eceff1',
    description: 'Jarum suntik, infus set, spuit, dan peralatan medis lainnya',
  },
};

// ─── Product Availability ─────────────────────────────────────────────────────

export type DrugProductAvailability = 'Tersedia' | 'Stok Terbatas' | 'Habis';

export const DRUG_AVAILABILITY_CONFIG: Record<
  DrugProductAvailability,
  { icon: string; color: string; bg: string; border: string }
> = {
  Tersedia:        { icon: '✅', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  'Stok Terbatas': { icon: '⚠️', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  Habis:           { icon: '🚫', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};
