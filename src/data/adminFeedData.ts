// ─── Admin Feed Data — ADM-003A ───────────────────────────────────────────────
// Dummy data for Platform Administrator feed monitoring.
// Read-only. No CRUD. No production database.

// ─── Types ───────────────────────────────────────────────────────────────────

export type FeedType        = 'Master Pakan' | 'Pakan Komersial' | 'Formula';
export type FeedStockStatus = 'Tersedia' | 'Rendah' | 'Habis';
export type FeedCategory    =
  | 'Hijauan'
  | 'Konsentrat'
  | 'Leguminosa'
  | 'Limbah Pertanian'
  | 'Mineral & Suplemen'
  | 'Bahan Cair'
  | 'Formula Custom';

export interface AdminFeedTimeline {
  id: string;
  icon: string;
  color: string;
  event: string;
  actor: string;
  timestamp: string;
}

export interface AdminFeedRecord {
  id: string;
  name: string;
  type: FeedType;
  category: FeedCategory;
  stockStatus: FeedStockStatus;
  stockQty: number;        // kg
  stockUnit: string;       // 'kg' | 'ton' | 'liter'
  minStock: number;        // threshold for "Rendah"
  photoColor: string;
  photoEmoji: string;

  // Nutritional snapshot (TDN % / PK %)
  tdn: number | null;
  proteinKasar: number | null;

  // Workspace (who owns this stock entry)
  workspaceId: string;
  workspaceName: string;
  workspaceType: string;
  workspacePlan: string;
  workspaceLocation: string;

  // Owner
  ownerId: string;
  ownerName: string;
  ownerAvatarInitials: string;
  ownerAvatarColor: string;

  // Commercial product fields (if type === 'Pakan Komersial')
  brand: string | null;
  manufacturer: string | null;
  batchNumber: string | null;
  registrationNo: string | null;

  // Formula fields (if type === 'Formula')
  formulaIngredients: string[] | null;
  formulaYield: string | null;          // e.g. "50 kg/produksi"
  formulaLastProduced: string | null;

  // Activity
  registeredAt: string;
  updatedAt: string;
  timeline: AdminFeedTimeline[];
  notes: string | null;
}

// ─── Config Maps ─────────────────────────────────────────────────────────────

export const FEED_TYPE_CONFIG: Record<FeedType, { icon: string; color: string; bg: string }> = {
  'Master Pakan':    { icon: '📚', color: '#0369a1', bg: '#e0f2fe' },
  'Pakan Komersial': { icon: '🏭', color: '#7c3aed', bg: '#ede9fe' },
  'Formula':         { icon: '🧪', color: '#059669', bg: '#d1fae5' },
};

export const FEED_STOCK_STATUS_CONFIG: Record<FeedStockStatus, { label: string; color: string; bg: string; dot: string }> = {
  Tersedia: { label: 'Tersedia', color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  Rendah:   { label: 'Rendah',   color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  Habis:    { label: 'Habis',    color: '#b91c1c', bg: '#fee2e2', dot: '#ef4444' },
};

// ─── Platform Stats ──────────────────────────────────────────────────────────

export const FEED_PLATFORM_STATS = {
  totalRecords:    347,
  inStock:         234,
  lowStock:         48,
  outOfStock:       65,
  categories:       12,
  formulas:         89,
  totalStockTons: 1420,
  newThisMonth:     23,
};

// ─── Dummy Records ────────────────────────────────────────────────────────────

export const ADMIN_FEED_LIST: AdminFeedRecord[] = [
  // ── Master Pakan — Hijauan ────────────────────────────────────────────────
  {
    id: 'FD-MP-0001',
    name: 'Rumput Gajah (Pennisetum purpureum)',
    type: 'Master Pakan',
    category: 'Hijauan',
    stockStatus: 'Tersedia',
    stockQty: 2400,
    stockUnit: 'kg',
    minStock: 500,
    photoColor: '#d9f99d',
    photoEmoji: '🌿',
    tdn: 55.2,
    proteinKasar: 10.1,
    workspaceId: 'WS-0011',
    workspaceName: 'Berkah Farm Garut',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Garut, Jawa Barat',
    ownerId: 'USR-0041',
    ownerName: 'Hendra Kusuma',
    ownerAvatarInitials: 'HK',
    ownerAvatarColor: '#3b82f6',
    brand: null,
    manufacturer: null,
    batchNumber: null,
    registrationNo: null,
    formulaIngredients: null,
    formulaYield: null,
    formulaLastProduced: null,
    registeredAt: '01 Jan 2025',
    updatedAt: '14 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Referensi ditambahkan ke stok', actor: 'Hendra Kusuma', timestamp: '01 Jan 2025 08:00' },
      { id: 't2', icon: '📦', color: '#10b981', event: 'Restok +800 kg', actor: 'Hendra Kusuma', timestamp: '14 Jun 2026 07:00' },
    ],
    notes: null,
  },
  {
    id: 'FD-MP-0002',
    name: 'Jerami Padi Kering',
    type: 'Master Pakan',
    category: 'Limbah Pertanian',
    stockStatus: 'Rendah',
    stockQty: 180,
    stockUnit: 'kg',
    minStock: 300,
    photoColor: '#fef3c7',
    photoEmoji: '🌾',
    tdn: 40.5,
    proteinKasar: 3.5,
    workspaceId: 'WS-0044',
    workspaceName: 'Fauzi Ternak Kalimantan',
    workspaceType: 'Peternakan',
    workspacePlan: 'Basic',
    workspaceLocation: 'Banjarmasin, Kalimantan Selatan',
    ownerId: 'USR-0055',
    ownerName: 'Ahmad Fauzi',
    ownerAvatarInitials: 'AF',
    ownerAvatarColor: '#64748b',
    brand: null,
    manufacturer: null,
    batchNumber: null,
    registrationNo: null,
    formulaIngredients: null,
    formulaYield: null,
    formulaLastProduced: null,
    registeredAt: '15 Mar 2025',
    updatedAt: '10 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Referensi ditambahkan ke stok', actor: 'Ahmad Fauzi', timestamp: '15 Mar 2025 09:00' },
      { id: 't2', icon: '⚠️', color: '#f59e0b', event: 'Stok di bawah minimum', actor: 'Sistem', timestamp: '10 Jun 2026 06:00' },
    ],
    notes: '⚠️ Stok mendekati minimum — perlu restok segera.',
  },
  {
    id: 'FD-MP-0003',
    name: 'Daun Gamal (Gliricidia sepium)',
    type: 'Master Pakan',
    category: 'Leguminosa',
    stockStatus: 'Tersedia',
    stockQty: 650,
    stockUnit: 'kg',
    minStock: 200,
    photoColor: '#d9f99d',
    photoEmoji: '🌱',
    tdn: 62.3,
    proteinKasar: 22.7,
    workspaceId: 'WS-0022',
    workspaceName: 'Etawa Farm Lembang',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Lembang, Jawa Barat',
    ownerId: 'USR-0017',
    ownerName: 'Sari Dewi Rahayu',
    ownerAvatarInitials: 'SD',
    ownerAvatarColor: '#10b981',
    brand: null,
    manufacturer: null,
    batchNumber: null,
    registrationNo: null,
    formulaIngredients: null,
    formulaYield: null,
    formulaLastProduced: null,
    registeredAt: '10 Apr 2025',
    updatedAt: '08 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Referensi ditambahkan', actor: 'Sari Dewi Rahayu', timestamp: '10 Apr 2025 08:30' },
    ],
    notes: 'Digunakan sebagai suplemen protein utama.',
  },
  {
    id: 'FD-MP-0004',
    name: 'Dedak Padi',
    type: 'Master Pakan',
    category: 'Konsentrat',
    stockStatus: 'Habis',
    stockQty: 0,
    stockUnit: 'kg',
    minStock: 400,
    photoColor: '#fef3c7',
    photoEmoji: '🌾',
    tdn: 61.0,
    proteinKasar: 12.9,
    workspaceId: 'WS-0099',
    workspaceName: 'Prasetyo Farm',
    workspaceType: 'Peternakan',
    workspacePlan: 'Free',
    workspaceLocation: 'Purwokerto, Jawa Tengah',
    ownerId: 'USR-0119',
    ownerName: 'Doni Prasetyo',
    ownerAvatarInitials: 'DP',
    ownerAvatarColor: '#94a3b8',
    brand: null,
    manufacturer: null,
    batchNumber: null,
    registrationNo: null,
    formulaIngredients: null,
    formulaYield: null,
    formulaLastProduced: null,
    registeredAt: '20 Feb 2025',
    updatedAt: '01 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Referensi ditambahkan', actor: 'Doni Prasetyo', timestamp: '20 Feb 2025 10:00' },
      { id: 't2', icon: '🚨', color: '#ef4444', event: 'Stok habis', actor: 'Sistem', timestamp: '01 Jun 2026 06:00' },
    ],
    notes: '🚨 Stok habis — pemberian pakan terhenti.',
  },
  {
    id: 'FD-MP-0005',
    name: 'Molases Tebu (Tetes Tebu)',
    type: 'Master Pakan',
    category: 'Bahan Cair',
    stockStatus: 'Tersedia',
    stockQty: 380,
    stockUnit: 'liter',
    minStock: 100,
    photoColor: '#fed7aa',
    photoEmoji: '🍯',
    tdn: 72.1,
    proteinKasar: 3.1,
    workspaceId: 'WS-0033',
    workspaceName: 'Santoso Cattle Ranch',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Blitar, Jawa Timur',
    ownerId: 'USR-0033',
    ownerName: 'Budi Santoso',
    ownerAvatarInitials: 'BS',
    ownerAvatarColor: '#f59e0b',
    brand: null,
    manufacturer: null,
    batchNumber: null,
    registrationNo: null,
    formulaIngredients: null,
    formulaYield: null,
    formulaLastProduced: null,
    registeredAt: '05 Jan 2025',
    updatedAt: '10 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Referensi ditambahkan', actor: 'Budi Santoso', timestamp: '05 Jan 2025 09:00' },
      { id: 't2', icon: '📦', color: '#10b981', event: 'Restok +200 liter', actor: 'Budi Santoso', timestamp: '10 Jun 2026 07:30' },
    ],
    notes: 'Digunakan sebagai palatabilitas dan sumber energi cepat.',
  },
  {
    id: 'FD-MP-0006',
    name: 'Mineral Mix Sapi Perah',
    type: 'Master Pakan',
    category: 'Mineral & Suplemen',
    stockStatus: 'Tersedia',
    stockQty: 120,
    stockUnit: 'kg',
    minStock: 30,
    photoColor: '#e0e7ff',
    photoEmoji: '🧂',
    tdn: null,
    proteinKasar: null,
    workspaceId: 'WS-0022',
    workspaceName: 'Etawa Farm Lembang',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Lembang, Jawa Barat',
    ownerId: 'USR-0017',
    ownerName: 'Sari Dewi Rahayu',
    ownerAvatarInitials: 'SD',
    ownerAvatarColor: '#10b981',
    brand: null,
    manufacturer: null,
    batchNumber: null,
    registrationNo: null,
    formulaIngredients: null,
    formulaYield: null,
    formulaLastProduced: null,
    registeredAt: '12 Mar 2025',
    updatedAt: '09 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Referensi ditambahkan', actor: 'Sari Dewi Rahayu', timestamp: '12 Mar 2025 10:00' },
    ],
    notes: 'Dosis: 50–80 g/ekor/hari untuk kambing perah.',
  },

  // ── Pakan Komersial ───────────────────────────────────────────────────────
  {
    id: 'FD-PK-0001',
    name: 'Comfeed Sapi Potong 515',
    type: 'Pakan Komersial',
    category: 'Konsentrat',
    stockStatus: 'Tersedia',
    stockQty: 1800,
    stockUnit: 'kg',
    minStock: 500,
    photoColor: '#fef3c7',
    photoEmoji: '🏭',
    tdn: 70.0,
    proteinKasar: 16.0,
    workspaceId: 'WS-0033',
    workspaceName: 'Santoso Cattle Ranch',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Blitar, Jawa Timur',
    ownerId: 'USR-0033',
    ownerName: 'Budi Santoso',
    ownerAvatarInitials: 'BS',
    ownerAvatarColor: '#f59e0b',
    brand: 'Comfeed',
    manufacturer: 'PT Charoen Pokphand Indonesia',
    batchNumber: 'CPF-2026-06-B114',
    registrationNo: 'RI.1/5.2/TU.010/K/2024',
    formulaIngredients: null,
    formulaYield: null,
    formulaLastProduced: null,
    registeredAt: '10 Mar 2025',
    updatedAt: '12 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Produk ditambahkan ke stok', actor: 'Budi Santoso', timestamp: '10 Mar 2025 08:00' },
      { id: 't2', icon: '📦', color: '#10b981', event: 'Restok +1000 kg (50 sak)', actor: 'Budi Santoso', timestamp: '12 Jun 2026 07:00' },
    ],
    notes: null,
  },
  {
    id: 'FD-PK-0002',
    name: 'Pokphand Broiler Starter 511',
    type: 'Pakan Komersial',
    category: 'Konsentrat',
    stockStatus: 'Rendah',
    stockQty: 240,
    stockUnit: 'kg',
    minStock: 400,
    photoColor: '#fef3c7',
    photoEmoji: '🏭',
    tdn: 73.5,
    proteinKasar: 22.0,
    workspaceId: 'WS-0088',
    workspaceName: 'Wibowo Cattle Ranch',
    workspaceType: 'Peternakan',
    workspacePlan: 'Free',
    workspaceLocation: 'Ngawi, Jawa Timur',
    ownerId: 'USR-0104',
    ownerName: 'Teguh Wibowo',
    ownerAvatarInitials: 'TW',
    ownerAvatarColor: '#d97706',
    brand: 'Pokphand',
    manufacturer: 'PT Charoen Pokphand Indonesia',
    batchNumber: 'CPF-2026-05-A088',
    registrationNo: 'RI.1/5.2/TU.010/K/2023',
    formulaIngredients: null,
    formulaYield: null,
    formulaLastProduced: null,
    registeredAt: '20 Jan 2025',
    updatedAt: '08 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Produk ditambahkan ke stok', actor: 'Teguh Wibowo', timestamp: '20 Jan 2025 09:00' },
      { id: 't2', icon: '⚠️', color: '#f59e0b', event: 'Stok di bawah minimum', actor: 'Sistem', timestamp: '08 Jun 2026 06:00' },
    ],
    notes: '⚠️ Stok rendah — perlu reorder dalam 3 hari.',
  },
  {
    id: 'FD-PK-0003',
    name: 'Hipro Super Soya 48 (Bungkil Kedelai)',
    type: 'Pakan Komersial',
    category: 'Konsentrat',
    stockStatus: 'Tersedia',
    stockQty: 900,
    stockUnit: 'kg',
    minStock: 300,
    photoColor: '#fef3c7',
    photoEmoji: '🏭',
    tdn: 82.0,
    proteinKasar: 48.5,
    workspaceId: 'WS-0011',
    workspaceName: 'Berkah Farm Garut',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Garut, Jawa Barat',
    ownerId: 'USR-0041',
    ownerName: 'Hendra Kusuma',
    ownerAvatarInitials: 'HK',
    ownerAvatarColor: '#3b82f6',
    brand: 'Hipro',
    manufacturer: 'PT Budi Starch & Sweetener',
    batchNumber: 'BSS-2026-06-C034',
    registrationNo: 'RI.1/5.2/TU.014/K/2024',
    formulaIngredients: null,
    formulaYield: null,
    formulaLastProduced: null,
    registeredAt: '15 Feb 2025',
    updatedAt: '11 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Produk ditambahkan ke stok', actor: 'Hendra Kusuma', timestamp: '15 Feb 2025 08:00' },
      { id: 't2', icon: '📦', color: '#10b981', event: 'Restok +600 kg', actor: 'Hendra Kusuma', timestamp: '11 Jun 2026 07:15' },
    ],
    notes: 'Sumber protein konsentrat utama untuk domba pedaging.',
  },
  {
    id: 'FD-PK-0004',
    name: 'Agromix Kambing Perah Plus',
    type: 'Pakan Komersial',
    category: 'Konsentrat',
    stockStatus: 'Habis',
    stockQty: 0,
    stockUnit: 'kg',
    minStock: 200,
    photoColor: '#d9f99d',
    photoEmoji: '🏭',
    tdn: 68.0,
    proteinKasar: 18.5,
    workspaceId: 'WS-0066',
    workspaceName: 'Hasibuan Agro Farm',
    workspaceType: 'Peternakan',
    workspacePlan: 'Basic',
    workspaceLocation: 'Medan, Sumatera Utara',
    ownerId: 'USR-0078',
    ownerName: 'Nuraini Hasibuan',
    ownerAvatarInitials: 'NH',
    ownerAvatarColor: '#0ea5e9',
    brand: 'Agromix',
    manufacturer: 'PT Agro Pakan Nusantara',
    batchNumber: 'APN-2026-04-D007',
    registrationNo: 'RI.1/5.2/TU.022/K/2025',
    formulaIngredients: null,
    formulaYield: null,
    formulaLastProduced: null,
    registeredAt: '01 Apr 2025',
    updatedAt: '30 Mei 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Produk ditambahkan ke stok', actor: 'Nuraini Hasibuan', timestamp: '01 Apr 2025 10:00' },
      { id: 't2', icon: '🚨', color: '#ef4444', event: 'Stok habis', actor: 'Sistem', timestamp: '30 Mei 2026 06:00' },
    ],
    notes: '🚨 Kehabisan stok — dampak pada produksi susu kambing.',
  },
  {
    id: 'FD-PK-0005',
    name: 'Equine Gold Kuda Performance',
    type: 'Pakan Komersial',
    category: 'Konsentrat',
    stockStatus: 'Tersedia',
    stockQty: 560,
    stockUnit: 'kg',
    minStock: 150,
    photoColor: '#ede9fe',
    photoEmoji: '🏭',
    tdn: 78.0,
    proteinKasar: 14.0,
    workspaceId: 'WS-0055',
    workspaceName: 'Sumba Equestrian Farm',
    workspaceType: 'Peternakan',
    workspacePlan: 'Enterprise',
    workspaceLocation: 'Sumba, Nusa Tenggara Timur',
    ownerId: 'USR-0062',
    ownerName: 'Raden Wijaya',
    ownerAvatarInitials: 'RW',
    ownerAvatarColor: '#7c3aed',
    brand: 'Equine Gold',
    manufacturer: 'PT Nutrisi Equin Indonesia',
    batchNumber: 'NEI-2026-06-E019',
    registrationNo: 'RI.1/5.2/TU.031/K/2025',
    formulaIngredients: null,
    formulaYield: null,
    formulaLastProduced: null,
    registeredAt: '01 Jul 2025',
    updatedAt: '13 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Produk ditambahkan ke stok', actor: 'Raden Wijaya', timestamp: '01 Jul 2025 09:00' },
      { id: 't2', icon: '📦', color: '#10b981', event: 'Restok +300 kg', actor: 'Raden Wijaya', timestamp: '13 Jun 2026 06:30' },
    ],
    notes: 'Pakan spesifik untuk kuda pacuan performa tinggi.',
  },

  // ── Formula ───────────────────────────────────────────────────────────────
  {
    id: 'FD-FM-0001',
    name: 'Formula Penggemukan Sapi A1',
    type: 'Formula',
    category: 'Formula Custom',
    stockStatus: 'Tersedia',
    stockQty: 750,
    stockUnit: 'kg',
    minStock: 200,
    photoColor: '#d1fae5',
    photoEmoji: '🧪',
    tdn: 72.8,
    proteinKasar: 14.2,
    workspaceId: 'WS-0033',
    workspaceName: 'Santoso Cattle Ranch',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Blitar, Jawa Timur',
    ownerId: 'USR-0033',
    ownerName: 'Budi Santoso',
    ownerAvatarInitials: 'BS',
    ownerAvatarColor: '#f59e0b',
    brand: null,
    manufacturer: null,
    batchNumber: 'FM-2026-06-001',
    registrationNo: null,
    formulaIngredients: ['Dedak Padi 40%', 'Bungkil Kedelai 20%', 'Jagung Giling 25%', 'Molases 10%', 'Mineral Mix 5%'],
    formulaYield: '100 kg/produksi',
    formulaLastProduced: '10 Jun 2026',
    registeredAt: '01 Feb 2025',
    updatedAt: '10 Jun 2026',
    timeline: [
      { id: 't1', icon: '🧪', color: '#059669', event: 'Formula dibuat', actor: 'Budi Santoso', timestamp: '01 Feb 2025 10:00' },
      { id: 't2', icon: '⚙️', color: '#8b5cf6', event: 'Produksi batch ke-7 — 750 kg', actor: 'Budi Santoso', timestamp: '10 Jun 2026 06:00' },
    ],
    notes: 'Formula andalan untuk fase penggemukan 60 hari.',
  },
  {
    id: 'FD-FM-0002',
    name: 'Formula Laktasi Etawa Premium',
    type: 'Formula',
    category: 'Formula Custom',
    stockStatus: 'Rendah',
    stockQty: 95,
    stockUnit: 'kg',
    minStock: 150,
    photoColor: '#d1fae5',
    photoEmoji: '🧪',
    tdn: 68.5,
    proteinKasar: 18.3,
    workspaceId: 'WS-0022',
    workspaceName: 'Etawa Farm Lembang',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Lembang, Jawa Barat',
    ownerId: 'USR-0017',
    ownerName: 'Sari Dewi Rahayu',
    ownerAvatarInitials: 'SD',
    ownerAvatarColor: '#10b981',
    brand: null,
    manufacturer: null,
    batchNumber: 'FM-2026-05-003',
    registrationNo: null,
    formulaIngredients: ['Daun Gamal 30%', 'Dedak Padi 25%', 'Bungkil Kedelai 25%', 'Mineral Mix Perah 15%', 'Garam 5%'],
    formulaYield: '80 kg/produksi',
    formulaLastProduced: '20 Mei 2026',
    registeredAt: '15 Jan 2025',
    updatedAt: '20 Mei 2026',
    timeline: [
      { id: 't1', icon: '🧪', color: '#059669', event: 'Formula dibuat', actor: 'Sari Dewi Rahayu', timestamp: '15 Jan 2025 09:00' },
      { id: 't2', icon: '⚠️', color: '#f59e0b', event: 'Stok mendekati minimum', actor: 'Sistem', timestamp: '10 Jun 2026 06:00' },
    ],
    notes: '⚠️ Jadwalkan produksi batch berikutnya.',
  },
  {
    id: 'FD-FM-0003',
    name: 'Formula Kuda Endurance',
    type: 'Formula',
    category: 'Formula Custom',
    stockStatus: 'Tersedia',
    stockQty: 420,
    stockUnit: 'kg',
    minStock: 100,
    photoColor: '#d1fae5',
    photoEmoji: '🧪',
    tdn: 80.2,
    proteinKasar: 12.8,
    workspaceId: 'WS-0055',
    workspaceName: 'Sumba Equestrian Farm',
    workspaceType: 'Peternakan',
    workspacePlan: 'Enterprise',
    workspaceLocation: 'Sumba, Nusa Tenggara Timur',
    ownerId: 'USR-0062',
    ownerName: 'Raden Wijaya',
    ownerAvatarInitials: 'RW',
    ownerAvatarColor: '#7c3aed',
    brand: null,
    manufacturer: null,
    batchNumber: 'FM-2026-06-005',
    registrationNo: null,
    formulaIngredients: ['Jagung Giling 35%', 'Oat 25%', 'Bungkil Kedelai 18%', 'Molases 10%', 'Vitamin E Mix 7%', 'Elektrolit 5%'],
    formulaYield: '120 kg/produksi',
    formulaLastProduced: '08 Jun 2026',
    registeredAt: '01 Aug 2025',
    updatedAt: '08 Jun 2026',
    timeline: [
      { id: 't1', icon: '🧪', color: '#059669', event: 'Formula dibuat', actor: 'Raden Wijaya', timestamp: '01 Aug 2025 09:30' },
      { id: 't2', icon: '⚙️', color: '#8b5cf6', event: 'Produksi batch ke-3 — 420 kg', actor: 'Raden Wijaya', timestamp: '08 Jun 2026 06:00' },
    ],
    notes: 'Diformulasikan khusus untuk kuda latihan intensitas tinggi.',
  },
];

// ─── Filter Function ──────────────────────────────────────────────────────────

export interface FeedFilterParams {
  keyword?:     string;
  id?:          string;
  owner?:       string;
  type?:        FeedType | 'All';
  category?:    FeedCategory | 'All';
  stockStatus?: FeedStockStatus | 'All';
  plan?:        string;
}

export function filterFeed(
  list: AdminFeedRecord[],
  p: FeedFilterParams,
): AdminFeedRecord[] {
  return list.filter((r) => {
    if (p.keyword     && !r.name.toLowerCase().includes(p.keyword.toLowerCase()))       return false;
    if (p.id          && !r.id.toLowerCase().includes(p.id.toLowerCase()))              return false;
    if (p.owner       && !r.ownerName.toLowerCase().includes(p.owner.toLowerCase()))    return false;
    if (p.type        && p.type        !== 'All' && r.type        !== p.type)           return false;
    if (p.category    && p.category    !== 'All' && r.category    !== p.category)       return false;
    if (p.stockStatus && p.stockStatus !== 'All' && r.stockStatus !== p.stockStatus)    return false;
    if (p.plan        && p.plan        !== 'All' && r.workspacePlan !== p.plan)         return false;
    return true;
  });
}
