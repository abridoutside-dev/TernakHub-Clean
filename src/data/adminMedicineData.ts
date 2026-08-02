// ─── Admin Medicine Data — ADM-003A ──────────────────────────────────────────
// Dummy data for Platform Administrator medicine monitoring.
// Read-only. No CRUD. No production database.

// ─── Types ───────────────────────────────────────────────────────────────────

export type MedType        = 'Master Obat' | 'Produk Komersial';
export type MedStockStatus = 'Tersedia' | 'Rendah' | 'Habis' | 'Expired';
export type MedCategory    =
  | 'Antibiotik'
  | 'Antiparasit'
  | 'Vitamin & Suplemen'
  | 'Vaksin'
  | 'Hormon & Reproduksi'
  | 'Anti-inflamasi'
  | 'Anestesi & Sedatif'
  | 'Antiseptik & Desinfektan'
  | 'Probiotik';

export interface AdminMedTimeline {
  id: string;
  icon: string;
  color: string;
  event: string;
  actor: string;
  timestamp: string;
}

export interface AdminMedRecord {
  id: string;
  name: string;
  type: MedType;
  category: MedCategory;
  stockStatus: MedStockStatus;
  stockQty: number;
  stockUnit: string;        // 'tablet' | 'botol' | 'ampul' | 'sachet' | 'kg'
  minStock: number;
  expiryDate: string | null;
  batchNumber: string | null;
  photoColor: string;
  photoEmoji: string;

  // Clinical info
  indication: string;
  dosage: string;
  species: string[];         // which animals

  // Commercial product (if Produk Komersial)
  brand: string | null;
  manufacturer: string | null;
  registrationNo: string | null;

  // Usage
  treatmentsThisMonth: number;
  totalTreatments: number;
  lastUsed: string | null;

  // Workspace
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

  // Activity
  registeredAt: string;
  updatedAt: string;
  timeline: AdminMedTimeline[];
  notes: string | null;
}

// ─── Config Maps ─────────────────────────────────────────────────────────────

export const MED_TYPE_CONFIG: Record<MedType, { icon: string; color: string; bg: string }> = {
  'Master Obat':     { icon: '📚', color: '#0369a1', bg: '#e0f2fe' },
  'Produk Komersial': { icon: '🏭', color: '#7c3aed', bg: '#ede9fe' },
};

export const MED_STOCK_STATUS_CONFIG: Record<MedStockStatus, { label: string; color: string; bg: string; dot: string }> = {
  Tersedia: { label: 'Tersedia', color: '#059669', bg: '#d1fae5', dot: '#10b981' },
  Rendah:   { label: 'Rendah',   color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  Habis:    { label: 'Habis',    color: '#b91c1c', bg: '#fee2e2', dot: '#ef4444' },
  Expired:  { label: 'Expired',  color: '#374151', bg: '#f3f4f6', dot: '#9ca3af' },
};

export const MED_CATEGORY_CONFIG: Record<MedCategory, { icon: string }> = {
  'Antibiotik':                   { icon: '🦠' },
  'Antiparasit':                  { icon: '🪱' },
  'Vitamin & Suplemen':           { icon: '💊' },
  'Vaksin':                       { icon: '💉' },
  'Hormon & Reproduksi':          { icon: '🔬' },
  'Anti-inflamasi':               { icon: '🔥' },
  'Anestesi & Sedatif':           { icon: '😴' },
  'Antiseptik & Desinfektan':     { icon: '🧴' },
  'Probiotik':                    { icon: '🌱' },
};

// ─── Platform Stats ──────────────────────────────────────────────────────────

export const MEDICINE_PLATFORM_STATS = {
  total:               284,
  inStock:             198,
  lowStock:             41,
  outOfStock:           33,
  expired:              12,
  treatmentsThisMonth: 3847,
  categories:            9,
  newThisMonth:         14,
};

// ─── Dummy Records ────────────────────────────────────────────────────────────

export const ADMIN_MEDICINE_LIST: AdminMedRecord[] = [
  // ── Antibiotik ────────────────────────────────────────────────────────────
  {
    id: 'OB-AB-0001',
    name: 'Oksitetrasiklin 20% LA',
    type: 'Master Obat',
    category: 'Antibiotik',
    stockStatus: 'Tersedia',
    stockQty: 48,
    stockUnit: 'botol',
    minStock: 10,
    expiryDate: '31 Des 2027',
    batchNumber: 'OTC-2025-B014',
    photoColor: '#fef3c7',
    photoEmoji: '🧪',
    indication: 'Infeksi bakteri pernapasan, pneumonia, enteritis bakteri',
    dosage: '20 mg/kg BB IM, interval 48–72 jam',
    species: ['Sapi', 'Kerbau', 'Domba', 'Kambing'],
    brand: null,
    manufacturer: null,
    registrationNo: null,
    treatmentsThisMonth: 38,
    totalTreatments: 214,
    lastUsed: '14 Jun 2026',
    workspaceId: 'WS-0033',
    workspaceName: 'Santoso Cattle Ranch',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Blitar, Jawa Timur',
    ownerId: 'USR-0033',
    ownerName: 'Budi Santoso',
    ownerAvatarInitials: 'BS',
    ownerAvatarColor: '#f59e0b',
    registeredAt: '10 Jan 2025',
    updatedAt: '14 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Obat ditambahkan ke stok', actor: 'Budi Santoso', timestamp: '10 Jan 2025 08:00' },
      { id: 't2', icon: '💊', color: '#8b5cf6', event: 'Digunakan — pengobatan Brahma (luka kaki)', actor: 'drh. Joko Prasetyo', timestamp: '14 Jun 2026 10:00' },
    ],
    notes: null,
  },
  {
    id: 'OB-AB-0002',
    name: 'Penisilin-G Prokain 20%',
    type: 'Master Obat',
    category: 'Antibiotik',
    stockStatus: 'Rendah',
    stockQty: 6,
    stockUnit: 'botol',
    minStock: 10,
    expiryDate: '30 Jun 2027',
    batchNumber: 'PNG-2025-C009',
    photoColor: '#fef3c7',
    photoEmoji: '🧪',
    indication: 'Infeksi kulit, luka terinfeksi, pneumonia ringan',
    dosage: '20.000 IU/kg BB IM, 1x sehari selama 5 hari',
    species: ['Domba', 'Kambing', 'Sapi'],
    brand: null,
    manufacturer: null,
    registrationNo: null,
    treatmentsThisMonth: 12,
    totalTreatments: 87,
    lastUsed: '12 Jun 2026',
    workspaceId: 'WS-0011',
    workspaceName: 'Berkah Farm Garut',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Garut, Jawa Barat',
    ownerId: 'USR-0041',
    ownerName: 'Hendra Kusuma',
    ownerAvatarInitials: 'HK',
    ownerAvatarColor: '#3b82f6',
    registeredAt: '15 Feb 2025',
    updatedAt: '12 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Obat ditambahkan ke stok', actor: 'Hendra Kusuma', timestamp: '15 Feb 2025 09:00' },
      { id: 't2', icon: '⚠️', color: '#f59e0b', event: 'Stok di bawah minimum', actor: 'Sistem', timestamp: '12 Jun 2026 06:00' },
    ],
    notes: '⚠️ Stok kritis — perlu pengadaan segera.',
  },

  // ── Antiparasit ────────────────────────────────────────────────────────────
  {
    id: 'OB-AP-0001',
    name: 'Albendazol 10% Oral',
    type: 'Master Obat',
    category: 'Antiparasit',
    stockStatus: 'Tersedia',
    stockQty: 30,
    stockUnit: 'botol',
    minStock: 8,
    expiryDate: '31 Mar 2028',
    batchNumber: 'ABZ-2026-A011',
    photoColor: '#d9f99d',
    photoEmoji: '🪱',
    indication: 'Cacing saluran cerna (nematoda, cestoda), cacing hati (Fasciola)',
    dosage: '7,5 mg/kg BB PO, dosis tunggal',
    species: ['Domba', 'Kambing', 'Sapi', 'Kerbau'],
    brand: null,
    manufacturer: null,
    registrationNo: null,
    treatmentsThisMonth: 67,
    totalTreatments: 432,
    lastUsed: '15 Jun 2026',
    workspaceId: 'WS-0022',
    workspaceName: 'Etawa Farm Lembang',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Lembang, Jawa Barat',
    ownerId: 'USR-0017',
    ownerName: 'Sari Dewi Rahayu',
    ownerAvatarInitials: 'SD',
    ownerAvatarColor: '#10b981',
    registeredAt: '01 Mar 2025',
    updatedAt: '15 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Obat ditambahkan ke stok', actor: 'Sari Dewi Rahayu', timestamp: '01 Mar 2025 09:00' },
      { id: 't2', icon: '💊', color: '#8b5cf6', event: 'Pengobatan massal 30 ekor kambing', actor: 'drh. Budi Irawan', timestamp: '15 Jun 2026 07:00' },
    ],
    notes: 'Program cacing rutin setiap 3 bulan.',
  },
  {
    id: 'OB-AP-0002',
    name: 'Ivermectin 1% Injeksi',
    type: 'Produk Komersial',
    category: 'Antiparasit',
    stockStatus: 'Habis',
    stockQty: 0,
    stockUnit: 'botol',
    minStock: 5,
    expiryDate: '28 Feb 2028',
    batchNumber: 'IVM-2025-D006',
    photoColor: '#ede9fe',
    photoEmoji: '💉',
    indication: 'Ektoparasit (kutu, tungau, lalat), endoparasit (cacing jantung)',
    dosage: '0,2 mg/kg BB SC, dosis tunggal',
    species: ['Sapi', 'Kuda', 'Domba', 'Kambing', 'Kerbau'],
    brand: 'Ivomec',
    manufacturer: 'Boehringer Ingelheim',
    registrationNo: 'D-21212/IV/B/2023',
    treatmentsThisMonth: 0,
    totalTreatments: 156,
    lastUsed: '30 Apr 2026',
    workspaceId: 'WS-0044',
    workspaceName: 'Fauzi Ternak Kalimantan',
    workspaceType: 'Peternakan',
    workspacePlan: 'Basic',
    workspaceLocation: 'Banjarmasin, Kalimantan Selatan',
    ownerId: 'USR-0055',
    ownerName: 'Ahmad Fauzi',
    ownerAvatarInitials: 'AF',
    ownerAvatarColor: '#64748b',
    registeredAt: '01 Jun 2025',
    updatedAt: '30 Apr 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Produk ditambahkan ke stok', actor: 'Ahmad Fauzi', timestamp: '01 Jun 2025 09:00' },
      { id: 't2', icon: '🚨', color: '#ef4444', event: 'Stok habis', actor: 'Sistem', timestamp: '30 Apr 2026 06:00' },
    ],
    notes: '🚨 Stok habis — program antiparasit tertunda.',
  },

  // ── Vitamin & Suplemen ────────────────────────────────────────────────────
  {
    id: 'OB-VS-0001',
    name: 'Vitamin B-Complex Injeksi',
    type: 'Master Obat',
    category: 'Vitamin & Suplemen',
    stockStatus: 'Tersedia',
    stockQty: 72,
    stockUnit: 'ampul',
    minStock: 20,
    expiryDate: '30 Sep 2027',
    batchNumber: 'VBC-2026-A022',
    photoColor: '#fed7aa',
    photoEmoji: '💊',
    indication: 'Defisiensi vitamin B, stres pasca transportasi, pemulihan post-operasi',
    dosage: '5–10 ml IM/SC, 1x sehari selama 3–5 hari',
    species: ['Domba', 'Kambing', 'Sapi', 'Kerbau', 'Kuda'],
    brand: null,
    manufacturer: null,
    registrationNo: null,
    treatmentsThisMonth: 29,
    totalTreatments: 318,
    lastUsed: '15 Jun 2026',
    workspaceId: 'WS-0055',
    workspaceName: 'Sumba Equestrian Farm',
    workspaceType: 'Peternakan',
    workspacePlan: 'Enterprise',
    workspaceLocation: 'Sumba, Nusa Tenggara Timur',
    ownerId: 'USR-0062',
    ownerName: 'Raden Wijaya',
    ownerAvatarInitials: 'RW',
    ownerAvatarColor: '#7c3aed',
    registeredAt: '01 Aug 2025',
    updatedAt: '15 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Obat ditambahkan ke stok', actor: 'Raden Wijaya', timestamp: '01 Aug 2025 09:00' },
      { id: 't2', icon: '💊', color: '#8b5cf6', event: 'Digunakan pada Angin — pasca latihan', actor: 'drh. Ratna Dewi', timestamp: '15 Jun 2026 09:30' },
    ],
    notes: 'Digunakan rutin pasca sesi latihan intensif kuda pacuan.',
  },
  {
    id: 'OB-VS-0002',
    name: 'Calcimag Plus (Ca-Mg-P-D3)',
    type: 'Produk Komersial',
    category: 'Vitamin & Suplemen',
    stockStatus: 'Rendah',
    stockQty: 14,
    stockUnit: 'botol',
    minStock: 20,
    expiryDate: '31 Okt 2027',
    batchNumber: 'CMP-2026-B033',
    photoColor: '#e0e7ff',
    photoEmoji: '💊',
    indication: 'Hipokalsemia, milk fever, tetani rumput, osteoporosis',
    dosage: 'Sapi: 400 ml IV/SC lambat; Kambing: 50 ml SC',
    species: ['Sapi', 'Kambing', 'Domba'],
    brand: 'Calcimag',
    manufacturer: 'PT Medion Farma Jaya',
    registrationNo: 'D-32419/VIII/B/2024',
    treatmentsThisMonth: 8,
    totalTreatments: 94,
    lastUsed: '10 Jun 2026',
    workspaceId: 'WS-0022',
    workspaceName: 'Etawa Farm Lembang',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Lembang, Jawa Barat',
    ownerId: 'USR-0017',
    ownerName: 'Sari Dewi Rahayu',
    ownerAvatarInitials: 'SD',
    ownerAvatarColor: '#10b981',
    registeredAt: '20 Feb 2025',
    updatedAt: '10 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Produk ditambahkan ke stok', actor: 'Sari Dewi Rahayu', timestamp: '20 Feb 2025 08:30' },
      { id: 't2', icon: '⚠️', color: '#f59e0b', event: 'Stok mendekati minimum', actor: 'Sistem', timestamp: '10 Jun 2026 06:00' },
    ],
    notes: 'Penting untuk kambing perah pasca melahirkan.',
  },

  // ── Vaksin ─────────────────────────────────────────────────────────────────
  {
    id: 'OB-VK-0001',
    name: 'Vaksin PMK (Penyakit Mulut dan Kuku)',
    type: 'Produk Komersial',
    category: 'Vaksin',
    stockStatus: 'Tersedia',
    stockQty: 200,
    stockUnit: 'dosis',
    minStock: 50,
    expiryDate: '31 Ags 2026',
    batchNumber: 'PMK-2026-GOV-014',
    photoColor: '#fee2e2',
    photoEmoji: '💉',
    indication: 'Pencegahan PMK (Foot-and-Mouth Disease) pada sapi dan kerbau',
    dosage: '2 ml SC/IM, diulang 6 bulan sekali',
    species: ['Sapi', 'Kerbau'],
    brand: 'BBALITVET PMK',
    manufacturer: 'Balai Besar Penelitian Veteriner (BBVet)',
    registrationNo: 'GOV/PMK/2024/014',
    treatmentsThisMonth: 180,
    totalTreatments: 1247,
    lastUsed: '15 Jun 2026',
    workspaceId: 'WS-0033',
    workspaceName: 'Santoso Cattle Ranch',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Blitar, Jawa Timur',
    ownerId: 'USR-0033',
    ownerName: 'Budi Santoso',
    ownerAvatarInitials: 'BS',
    ownerAvatarColor: '#f59e0b',
    registeredAt: '01 Feb 2026',
    updatedAt: '15 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Vaksin diterima dari Dinas Peternakan', actor: 'Budi Santoso', timestamp: '01 Feb 2026 08:00' },
      { id: 't2', icon: '💉', color: '#10b981', event: 'Vaksinasi massal 180 ekor sapi', actor: 'drh. Joko Prasetyo', timestamp: '15 Jun 2026 07:00' },
    ],
    notes: '⚠️ Expire 31 Ags 2026 — prioritaskan penggunaan.',
  },
  {
    id: 'OB-VK-0002',
    name: 'Vaksin Anthrax Spore',
    type: 'Produk Komersial',
    category: 'Vaksin',
    stockStatus: 'Expired',
    stockQty: 45,
    stockUnit: 'dosis',
    minStock: 30,
    expiryDate: '30 Apr 2026',
    batchNumber: 'ANT-2025-A003',
    photoColor: '#f3f4f6',
    photoEmoji: '⚠️',
    indication: 'Pencegahan Anthrax pada sapi, kerbau, domba, kambing, kuda',
    dosage: '1 ml SC, setahun sekali',
    species: ['Sapi', 'Kerbau', 'Domba', 'Kambing', 'Kuda'],
    brand: 'Anthrax Spore Vaccine',
    manufacturer: 'PT Bio Farma (Persero)',
    registrationNo: 'BIO/ANT/2023/003',
    treatmentsThisMonth: 0,
    totalTreatments: 389,
    lastUsed: '20 Apr 2026',
    workspaceId: 'WS-0088',
    workspaceName: 'Wibowo Cattle Ranch',
    workspaceType: 'Peternakan',
    workspacePlan: 'Free',
    workspaceLocation: 'Ngawi, Jawa Timur',
    ownerId: 'USR-0104',
    ownerName: 'Teguh Wibowo',
    ownerAvatarInitials: 'TW',
    ownerAvatarColor: '#d97706',
    registeredAt: '15 Jan 2026',
    updatedAt: '01 Mei 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Vaksin diterima', actor: 'Teguh Wibowo', timestamp: '15 Jan 2026 09:00' },
      { id: 't2', icon: '💉', color: '#10b981', event: 'Vaksinasi 45 ekor ternak', actor: 'drh. Hasan Ali', timestamp: '20 Apr 2026 07:30' },
      { id: 't3', icon: '⏰', color: '#374151', event: 'Masa expired tercapai — tidak dapat digunakan', actor: 'Sistem', timestamp: '01 Mei 2026 00:00' },
    ],
    notes: '❌ EXPIRED — Tidak boleh digunakan. Perlu disposal sesuai SOP.',
  },

  // ── Hormon & Reproduksi ────────────────────────────────────────────────────
  {
    id: 'OB-HR-0001',
    name: 'Prostaglandin F2α (PGF2α)',
    type: 'Master Obat',
    category: 'Hormon & Reproduksi',
    stockStatus: 'Tersedia',
    stockQty: 18,
    stockUnit: 'ampul',
    minStock: 5,
    expiryDate: '31 Des 2027',
    batchNumber: 'PGF-2026-C018',
    photoColor: '#fce7f3',
    photoEmoji: '🔬',
    indication: 'Sinkronisasi birahi, luteolisis (korpus luteum persisten), abortus terapi',
    dosage: 'Sapi: 25 mg IM; Kambing/Domba: 10 mg IM',
    species: ['Sapi', 'Kambing', 'Domba'],
    brand: null,
    manufacturer: null,
    registrationNo: null,
    treatmentsThisMonth: 22,
    totalTreatments: 178,
    lastUsed: '14 Jun 2026',
    workspaceId: 'WS-0022',
    workspaceName: 'Etawa Farm Lembang',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Lembang, Jawa Barat',
    ownerId: 'USR-0017',
    ownerName: 'Sari Dewi Rahayu',
    ownerAvatarInitials: 'SD',
    ownerAvatarColor: '#10b981',
    registeredAt: '01 Apr 2025',
    updatedAt: '14 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Obat ditambahkan ke stok', actor: 'Sari Dewi Rahayu', timestamp: '01 Apr 2025 10:00' },
      { id: 't2', icon: '🔬', color: '#ec4899', event: 'Digunakan — sinkronisasi birahi program IB', actor: 'drh. Budi Irawan', timestamp: '14 Jun 2026 08:00' },
    ],
    notes: 'Simpan di suhu 2–8°C.',
  },

  // ── Anti-inflamasi ────────────────────────────────────────────────────────
  {
    id: 'OB-AI-0001',
    name: 'Flunixin Meglumine 5%',
    type: 'Produk Komersial',
    category: 'Anti-inflamasi',
    stockStatus: 'Tersedia',
    stockQty: 24,
    stockUnit: 'botol',
    minStock: 6,
    expiryDate: '30 Nov 2027',
    batchNumber: 'FLX-2026-B044',
    photoColor: '#fef3c7',
    photoEmoji: '🔥',
    indication: 'Nyeri visceral (kolik kuda), inflamasi muskuloskeletal, demam',
    dosage: 'Sapi: 2,2 mg/kg IV; Kuda: 1,1 mg/kg IV 1x sehari',
    species: ['Sapi', 'Kuda'],
    brand: 'Finadyne',
    manufacturer: 'Merck Animal Health',
    registrationNo: 'D-44129/XI/B/2024',
    treatmentsThisMonth: 14,
    totalTreatments: 201,
    lastUsed: '15 Jun 2026',
    workspaceId: 'WS-0055',
    workspaceName: 'Sumba Equestrian Farm',
    workspaceType: 'Peternakan',
    workspacePlan: 'Enterprise',
    workspaceLocation: 'Sumba, Nusa Tenggara Timur',
    ownerId: 'USR-0062',
    ownerName: 'Raden Wijaya',
    ownerAvatarInitials: 'RW',
    ownerAvatarColor: '#7c3aed',
    registeredAt: '01 Sep 2025',
    updatedAt: '15 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Produk ditambahkan ke stok', actor: 'Raden Wijaya', timestamp: '01 Sep 2025 09:00' },
      { id: 't2', icon: '💊', color: '#8b5cf6', event: 'Digunakan pada Pelangi — inflamasi tendon', actor: 'drh. Ratna Dewi', timestamp: '15 Jun 2026 09:00' },
    ],
    notes: 'Selalu gunakan dengan pengawasan dokter hewan.',
  },

  // ── Antiseptik ────────────────────────────────────────────────────────────
  {
    id: 'OB-AS-0001',
    name: 'Povidone Iodine 10% (Betadine Vet)',
    type: 'Produk Komersial',
    category: 'Antiseptik & Desinfektan',
    stockStatus: 'Tersedia',
    stockQty: 56,
    stockUnit: 'botol',
    minStock: 15,
    expiryDate: '28 Feb 2028',
    batchNumber: 'PVI-2026-A033',
    photoColor: '#fce7f3',
    photoEmoji: '🧴',
    indication: 'Desinfeksi luka, tali pusat anak ternak, pra/pasca operasi',
    dosage: 'Topikal: larutkan 1:10 untuk luka; langsung untuk tali pusat',
    species: ['Domba', 'Kambing', 'Sapi', 'Kerbau', 'Kuda'],
    brand: 'Betadine Vet',
    manufacturer: 'PT Mundipharma Healthcare Indonesia',
    registrationNo: 'D-51023/II/B/2025',
    treatmentsThisMonth: 44,
    totalTreatments: 567,
    lastUsed: '15 Jun 2026',
    workspaceId: 'WS-0011',
    workspaceName: 'Berkah Farm Garut',
    workspaceType: 'Peternakan',
    workspacePlan: 'Pro',
    workspaceLocation: 'Garut, Jawa Barat',
    ownerId: 'USR-0041',
    ownerName: 'Hendra Kusuma',
    ownerAvatarInitials: 'HK',
    ownerAvatarColor: '#3b82f6',
    registeredAt: '01 Nov 2024',
    updatedAt: '15 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Produk ditambahkan ke stok', actor: 'Hendra Kusuma', timestamp: '01 Nov 2024 09:00' },
      { id: 't2', icon: '📦', color: '#10b981', event: 'Restok +24 botol', actor: 'Hendra Kusuma', timestamp: '01 Jun 2026 08:00' },
    ],
    notes: 'Wajib stok minimal di semua kandang.',
  },

  // ── Probiotik ─────────────────────────────────────────────────────────────
  {
    id: 'OB-PB-0001',
    name: 'Probiotic Forte Ruminansia',
    type: 'Produk Komersial',
    category: 'Probiotik',
    stockStatus: 'Tersedia',
    stockQty: 88,
    stockUnit: 'sachet',
    minStock: 24,
    expiryDate: '31 Mar 2027',
    batchNumber: 'PRB-2026-D015',
    photoColor: '#d1fae5',
    photoEmoji: '🌱',
    indication: 'Gangguan pencernaan, diare, post-antibiotik, peningkatan FCR',
    dosage: '1 sachet (10 g) per ekor per hari, campur pakan',
    species: ['Domba', 'Kambing', 'Sapi', 'Kerbau'],
    brand: 'Probiotic Forte',
    manufacturer: 'PT Agrivisi Indotama',
    registrationNo: 'D-61234/III/B/2025',
    treatmentsThisMonth: 95,
    totalTreatments: 788,
    lastUsed: '15 Jun 2026',
    workspaceId: 'WS-0066',
    workspaceName: 'Hasibuan Agro Farm',
    workspaceType: 'Peternakan',
    workspacePlan: 'Basic',
    workspaceLocation: 'Medan, Sumatera Utara',
    ownerId: 'USR-0078',
    ownerName: 'Nuraini Hasibuan',
    ownerAvatarInitials: 'NH',
    ownerAvatarColor: '#0ea5e9',
    registeredAt: '01 Mei 2025',
    updatedAt: '15 Jun 2026',
    timeline: [
      { id: 't1', icon: '📥', color: '#3b82f6', event: 'Produk ditambahkan ke stok', actor: 'Nuraini Hasibuan', timestamp: '01 Mei 2025 10:00' },
      { id: 't2', icon: '🌱', color: '#059669', event: 'Pemberian rutin 60 ekor kambing', actor: 'Nuraini Hasibuan', timestamp: '15 Jun 2026 07:00' },
    ],
    notes: 'Diberikan rutin setiap pagi bersama pakan konsentrat.',
  },
];

// ─── Filter Function ──────────────────────────────────────────────────────────

export interface MedFilterParams {
  keyword?:     string;
  id?:          string;
  owner?:       string;
  type?:        MedType | 'All';
  category?:    MedCategory | 'All';
  stockStatus?: MedStockStatus | 'All';
  plan?:        string;
}

export function filterMedicine(
  list: AdminMedRecord[],
  p: MedFilterParams,
): AdminMedRecord[] {
  return list.filter((r) => {
    if (p.keyword     && !r.name.toLowerCase().includes(p.keyword.toLowerCase()))    return false;
    if (p.id          && !r.id.toLowerCase().includes(p.id.toLowerCase()))           return false;
    if (p.owner       && !r.ownerName.toLowerCase().includes(p.owner.toLowerCase())) return false;
    if (p.type        && p.type        !== 'All' && r.type        !== p.type)        return false;
    if (p.category    && p.category    !== 'All' && r.category    !== p.category)    return false;
    if (p.stockStatus && p.stockStatus !== 'All' && r.stockStatus !== p.stockStatus) return false;
    if (p.plan        && p.plan        !== 'All' && r.workspacePlan !== p.plan)      return false;
    return true;
  });
}
