// ─── Admin Escrow Data — ESC-001 ─────────────────────────────────────────────
// Platform-admin observation layer for the Escrow module.
// Read-only dummy data. No real payments, no external services.
//
// Status vocabulary follows the ESC-001 spec (not the global escrow constitution
// UUID map — this is the admin UI display layer).

// ─── Types ────────────────────────────────────────────────────────────────────

export type EscrowStatus =
  | 'Draft'
  | 'WaitingBuyerConfirmation'
  | 'WaitingSellerConfirmation'
  | 'WaitingPayment'
  | 'WaitingShipment'
  | 'InTransit'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled'
  | 'Disputed';

export type TransactionType = 'Livestock' | 'Feed' | 'Medicine' | 'Transport' | 'Layanan';

export interface TimelineEvent {
  timestamp: string;
  actor: string;          // 'Buyer' | 'Seller' | 'Platform' | 'System'
  action: string;
  note?: string;
}

export interface StatusHistoryEntry {
  from_status: EscrowStatus | null;
  to_status: EscrowStatus;
  changed_at: string;
  changed_by: string;
  reason?: string;
}

export interface AdminEscrowRecord {
  escrow_id: string;           // ESC-YYYYMMDD-XXXX
  transaction_uuid: string;
  buyer_name: string;
  buyer_workspace: string;
  buyer_workspace_id: string;
  seller_name: string;
  seller_workspace: string;
  seller_workspace_id: string;
  item_title: string;
  item_type: TransactionType;
  item_detail: string;
  livestock_id?: string;
  item_quantity: number;
  item_unit: string;
  amount: number;              // IDR
  escrow_fee: number;          // IDR — platform fee
  total_amount: number;        // amount + escrow_fee
  currency: 'IDR';
  status: EscrowStatus;
  payment_status: 'Belum Bayar' | 'Menunggu Konfirmasi' | 'Terkonfirmasi' | 'Dikembalikan' | 'Gagal';
  settlement_method: 'Escrow' | 'P2P';
  provider: string;
  created_at: string;
  updated_at: string;
  hold_started_at: string | null;
  hold_expired_at: string | null;
  released_at: string | null;
  notes?: string;
  timeline: TimelineEvent[];
  status_history: StatusHistoryEntry[];
}

// ─── Display Config ───────────────────────────────────────────────────────────

export const ESCROW_STATUS_CONFIG: Record<EscrowStatus, {
  label: string; color: string; bg: string; dot: string;
}> = {
  Draft:                    { label: 'Draft',                      color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
  WaitingBuyerConfirmation: { label: 'Menunggu Konfirmasi Pembeli', color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
  WaitingSellerConfirmation:{ label: 'Menunggu Konfirmasi Penjual', color: '#c2410c', bg: '#fff7ed', dot: '#fb923c' },
  WaitingPayment:           { label: 'Menunggu Pembayaran',        color: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6' },
  WaitingShipment:          { label: 'Menunggu Pengiriman',        color: '#0369a1', bg: '#f0f9ff', dot: '#0ea5e9' },
  InTransit:                { label: 'Dalam Perjalanan',           color: '#0891b2', bg: '#ecfeff', dot: '#22d3ee' },
  Delivered:                { label: 'Terkirim',                   color: '#0284c7', bg: '#eff6ff', dot: '#60a5fa' },
  Completed:                { label: 'Selesai',                    color: '#15803d', bg: '#f0fdf4', dot: '#22c55e' },
  Cancelled:                { label: 'Dibatalkan',                 color: '#b91c1c', bg: '#fef2f2', dot: '#f87171' },
  Disputed:                 { label: 'Sengketa',                   color: '#be123c', bg: '#fff1f2', dot: '#fb7185' },
};

export const TRANSACTION_TYPE_CONFIG: Record<TransactionType, { icon: string; color: string; bg: string }> = {
  Livestock:  { icon: '🐄', color: '#15803d', bg: '#f0fdf4' },
  Feed:       { icon: '🌾', color: '#b45309', bg: '#fffbeb' },
  Medicine:   { icon: '💊', color: '#7c3aed', bg: '#f5f3ff' },
  Transport:  { icon: '🚚', color: '#0369a1', bg: '#f0f9ff' },
  Layanan:    { icon: '🔧', color: '#64748b', bg: '#f8fafc' },
};


// ─── Demo ID generator ────────────────────────────────────────────────────────
/**
 * Produces a stable UUID-format demo transaction ID from a sequence number.
 * Deterministic (same seq → same UUID across reloads) and valid UUID v4 format.
 */
function demoTxnId(seq: number): string {
  const s = seq.toString(16).padStart(12, '0');
  return `00000000-0000-4aed-8000-${s}`;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const ADMIN_ESCROW_LIST: AdminEscrowRecord[] = [
  {
    escrow_id: 'ESC-20260710-0001',
    transaction_uuid: demoTxnId(1),
    buyer_name: 'Ahmad Fauzi',
    buyer_workspace: 'Berkah Farm Garut',
    buyer_workspace_id: 'w1',
    seller_name: 'Siti Rahayu',
    seller_workspace: 'Ternakku Jaya',
    seller_workspace_id: 'w3',
    item_title: 'Sapi Limousin Jantan 3 Tahun',
    item_type: 'Livestock',
    item_detail: 'Sapi Limousin jantan, 3 tahun, bobot ±450 kg, kondisi sehat, sudah vaksin.',
    livestock_id: 'TRN-2024-001-L001',
    item_quantity: 1,
    item_unit: 'ekor',
    amount: 45_000_000,
    escrow_fee: 900_000,
    total_amount: 45_900_000,
    currency: 'IDR',
    status: 'Completed',
    payment_status: 'Terkonfirmasi',
    settlement_method: 'Escrow',
    provider: 'TernakHub Internal (Mock)',
    created_at: '2026-07-10T08:00:00.000Z',
    updated_at: '2026-07-16T14:22:00.000Z',
    hold_started_at: '2026-07-10T10:30:00.000Z',
    hold_expired_at: '2026-07-25T10:30:00.000Z',
    released_at: '2026-07-16T14:22:00.000Z',
    notes: 'Transaksi berjalan lancar, pembeli puas.',
    timeline: [
      { timestamp: '2026-07-10T08:00:00.000Z', actor: 'Seller', action: 'Membuat escrow dari listing ternak', note: 'Sapi Limousin Jantan' },
      { timestamp: '2026-07-10T09:15:00.000Z', actor: 'Buyer',  action: 'Konfirmasi pembelian dan setuju escrow' },
      { timestamp: '2026-07-10T10:30:00.000Z', actor: 'Buyer',  action: 'Pembayaran berhasil ditahan', note: 'Rp 45.900.000 via escrow' },
      { timestamp: '2026-07-12T07:00:00.000Z', actor: 'Seller', action: 'Ternak dikirim via transporter', note: 'No. pengiriman: TRP-2026-0712' },
      { timestamp: '2026-07-14T16:00:00.000Z', actor: 'Buyer',  action: 'Ternak tiba di lokasi pembeli' },
      { timestamp: '2026-07-16T14:22:00.000Z', actor: 'Buyer',  action: 'Konfirmasi penerimaan ternak', note: 'Kondisi sesuai deskripsi' },
      { timestamp: '2026-07-16T14:22:00.000Z', actor: 'Platform', action: 'Dana dilepaskan ke penjual', note: 'Rp 45.000.000 setelah fee escrow' },
    ],
    status_history: [
      { from_status: null,                    to_status: 'Draft',                    changed_at: '2026-07-10T08:00:00.000Z', changed_by: 'Seller' },
      { from_status: 'Draft',                 to_status: 'WaitingBuyerConfirmation', changed_at: '2026-07-10T08:05:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingBuyerConfirmation', to_status: 'WaitingPayment',        changed_at: '2026-07-10T09:15:00.000Z', changed_by: 'Buyer' },
      { from_status: 'WaitingPayment',        to_status: 'WaitingShipment',          changed_at: '2026-07-10T10:30:00.000Z', changed_by: 'System', reason: 'Pembayaran terverifikasi' },
      { from_status: 'WaitingShipment',       to_status: 'InTransit',                changed_at: '2026-07-12T07:00:00.000Z', changed_by: 'Seller' },
      { from_status: 'InTransit',             to_status: 'Delivered',                changed_at: '2026-07-14T16:00:00.000Z', changed_by: 'Buyer' },
      { from_status: 'Delivered',             to_status: 'Completed',                changed_at: '2026-07-16T14:22:00.000Z', changed_by: 'Buyer' },
    ],
  },
  {
    escrow_id: 'ESC-20260712-0002',
    transaction_uuid: demoTxnId(2),
    buyer_name: 'Budi Santoso',
    buyer_workspace: 'Maju Jaya Farm',
    buyer_workspace_id: 'w2',
    seller_name: 'Dewi Kusuma',
    seller_workspace: 'Pasar Ternak Jatim',
    seller_workspace_id: 'w4',
    item_title: 'Kambing Boer Betina Indukan',
    item_type: 'Livestock',
    item_detail: 'Kambing Boer betina, 2 tahun, sudah pernah beranak 1 kali, sehat.',
    livestock_id: 'TRN-2024-002-K003',
    item_quantity: 3,
    item_unit: 'ekor',
    amount: 18_000_000,
    escrow_fee: 360_000,
    total_amount: 18_360_000,
    currency: 'IDR',
    status: 'InTransit',
    payment_status: 'Terkonfirmasi',
    settlement_method: 'Escrow',
    provider: 'TernakHub Internal (Mock)',
    created_at: '2026-07-12T10:00:00.000Z',
    updated_at: '2026-07-17T08:00:00.000Z',
    hold_started_at: '2026-07-12T13:00:00.000Z',
    hold_expired_at: '2026-07-27T13:00:00.000Z',
    released_at: null,
    timeline: [
      { timestamp: '2026-07-12T10:00:00.000Z', actor: 'Seller', action: 'Membuat escrow' },
      { timestamp: '2026-07-12T11:30:00.000Z', actor: 'Buyer',  action: 'Konfirmasi dan setuju escrow' },
      { timestamp: '2026-07-12T13:00:00.000Z', actor: 'Buyer',  action: 'Pembayaran berhasil ditahan' },
      { timestamp: '2026-07-14T09:00:00.000Z', actor: 'Seller', action: 'Kambing dikirim via transporter' },
      { timestamp: '2026-07-17T08:00:00.000Z', actor: 'System', action: 'Masih dalam perjalanan — estimasi tiba 18 Juli' },
    ],
    status_history: [
      { from_status: null,                    to_status: 'Draft',                    changed_at: '2026-07-12T10:00:00.000Z', changed_by: 'Seller' },
      { from_status: 'Draft',                 to_status: 'WaitingBuyerConfirmation', changed_at: '2026-07-12T10:10:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingBuyerConfirmation', to_status: 'WaitingPayment',        changed_at: '2026-07-12T11:30:00.000Z', changed_by: 'Buyer' },
      { from_status: 'WaitingPayment',        to_status: 'WaitingShipment',          changed_at: '2026-07-12T13:00:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingShipment',       to_status: 'InTransit',                changed_at: '2026-07-14T09:00:00.000Z', changed_by: 'Seller' },
    ],
  },
  {
    escrow_id: 'ESC-20260713-0003',
    transaction_uuid: demoTxnId(3),
    buyer_name: 'Rini Wulandari',
    buyer_workspace: 'CV Ternakku',
    buyer_workspace_id: 'w5',
    seller_name: 'Hadi Purnomo',
    seller_workspace: 'Toko Pakan Subur',
    seller_workspace_id: 'w6',
    item_title: 'Konsentrat Sapi Perah Grade A',
    item_type: 'Feed',
    item_detail: '50 sak konsentrat sapi perah Grade A @50kg, kadar protein 18%, pabrik Malang.',
    item_quantity: 50,
    item_unit: 'sak',
    amount: 12_500_000,
    escrow_fee: 250_000,
    total_amount: 12_750_000,
    currency: 'IDR',
    status: 'Disputed',
    payment_status: 'Terkonfirmasi',
    settlement_method: 'Escrow',
    provider: 'TernakHub Internal (Mock)',
    created_at: '2026-07-13T07:30:00.000Z',
    updated_at: '2026-07-17T10:00:00.000Z',
    hold_started_at: '2026-07-13T09:00:00.000Z',
    hold_expired_at: '2026-07-28T09:00:00.000Z',
    released_at: null,
    notes: 'Pembeli melaporkan 5 sak rusak saat tiba.',
    timeline: [
      { timestamp: '2026-07-13T07:30:00.000Z', actor: 'Seller', action: 'Membuat escrow untuk pembelian pakan bulk' },
      { timestamp: '2026-07-13T08:45:00.000Z', actor: 'Buyer',  action: 'Konfirmasi pembelian' },
      { timestamp: '2026-07-13T09:00:00.000Z', actor: 'Buyer',  action: 'Pembayaran ditahan oleh escrow' },
      { timestamp: '2026-07-14T14:00:00.000Z', actor: 'Seller', action: 'Pakan dikirim via ekspedisi' },
      { timestamp: '2026-07-16T10:00:00.000Z', actor: 'Buyer',  action: 'Pakan tiba di lokasi' },
      { timestamp: '2026-07-17T09:00:00.000Z', actor: 'Buyer',  action: 'Membuka sengketa', note: '5 sak pakan dalam kondisi rusak/basah' },
      { timestamp: '2026-07-17T10:00:00.000Z', actor: 'Platform', action: 'Sengketa diterima, dalam tahap review' },
    ],
    status_history: [
      { from_status: null,            to_status: 'Draft',             changed_at: '2026-07-13T07:30:00.000Z', changed_by: 'Seller' },
      { from_status: 'Draft',         to_status: 'WaitingBuyerConfirmation', changed_at: '2026-07-13T07:40:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingBuyerConfirmation', to_status: 'WaitingPayment', changed_at: '2026-07-13T08:45:00.000Z', changed_by: 'Buyer' },
      { from_status: 'WaitingPayment', to_status: 'WaitingShipment',  changed_at: '2026-07-13T09:00:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingShipment', to_status: 'InTransit',       changed_at: '2026-07-14T14:00:00.000Z', changed_by: 'Seller' },
      { from_status: 'InTransit',     to_status: 'Delivered',         changed_at: '2026-07-16T10:00:00.000Z', changed_by: 'Buyer' },
      { from_status: 'Delivered',     to_status: 'Disputed',          changed_at: '2026-07-17T09:00:00.000Z', changed_by: 'Buyer', reason: '5 sak pakan rusak saat tiba' },
    ],
  },
  {
    escrow_id: 'ESC-20260714-0004',
    transaction_uuid: demoTxnId(4),
    buyer_name: 'Teguh Prasetyo',
    buyer_workspace: 'Peternakan Makmur',
    buyer_workspace_id: 'w1',
    seller_name: 'Siti Rahayu',
    seller_workspace: 'Ternakku Jaya',
    seller_workspace_id: 'w3',
    item_title: 'Ayam Broiler DOC 1000 ekor',
    item_type: 'Livestock',
    item_detail: 'Day Old Chick (DOC) Broiler strain Cobb 500, 1.000 ekor, dari hatchery bersertifikat.',
    item_quantity: 1000,
    item_unit: 'ekor',
    amount: 7_000_000,
    escrow_fee: 140_000,
    total_amount: 7_140_000,
    currency: 'IDR',
    status: 'WaitingShipment',
    payment_status: 'Terkonfirmasi',
    settlement_method: 'Escrow',
    provider: 'TernakHub Internal (Mock)',
    created_at: '2026-07-14T06:00:00.000Z',
    updated_at: '2026-07-15T12:00:00.000Z',
    hold_started_at: '2026-07-14T08:30:00.000Z',
    hold_expired_at: '2026-07-29T08:30:00.000Z',
    released_at: null,
    timeline: [
      { timestamp: '2026-07-14T06:00:00.000Z', actor: 'Buyer',  action: 'Membuat pesanan DOC Broiler' },
      { timestamp: '2026-07-14T07:45:00.000Z', actor: 'Seller', action: 'Konfirmasi pesanan, setuju escrow' },
      { timestamp: '2026-07-14T08:30:00.000Z', actor: 'Buyer',  action: 'Pembayaran escrow berhasil' },
      { timestamp: '2026-07-15T12:00:00.000Z', actor: 'System', action: 'Menunggu penjual menyiapkan pengiriman' },
    ],
    status_history: [
      { from_status: null,            to_status: 'Draft',             changed_at: '2026-07-14T06:00:00.000Z', changed_by: 'Buyer' },
      { from_status: 'Draft',         to_status: 'WaitingSellerConfirmation', changed_at: '2026-07-14T06:05:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingSellerConfirmation', to_status: 'WaitingPayment', changed_at: '2026-07-14T07:45:00.000Z', changed_by: 'Seller' },
      { from_status: 'WaitingPayment', to_status: 'WaitingShipment', changed_at: '2026-07-14T08:30:00.000Z', changed_by: 'System' },
    ],
  },
  {
    escrow_id: 'ESC-20260715-0005',
    transaction_uuid: demoTxnId(5),
    buyer_name: 'Eko Sulistyo',
    buyer_workspace: 'UD Sejahtera Farm',
    buyer_workspace_id: 'w2',
    seller_name: 'Apotik Hewan Sehat',
    seller_workspace: 'Apotek Hewan Sehat',
    seller_workspace_id: 'w5',
    item_title: 'Vaksin PMK + Anthrax Bundle',
    item_type: 'Medicine',
    item_detail: 'Paket vaksin PMK 100 dosis + Anthrax 50 dosis, cold chain terjaga, expired 2027.',
    item_quantity: 1,
    item_unit: 'paket',
    amount: 5_500_000,
    escrow_fee: 110_000,
    total_amount: 5_610_000,
    currency: 'IDR',
    status: 'WaitingPayment',
    payment_status: 'Belum Bayar',
    settlement_method: 'Escrow',
    provider: 'TernakHub Internal (Mock)',
    created_at: '2026-07-15T14:00:00.000Z',
    updated_at: '2026-07-15T15:00:00.000Z',
    hold_started_at: null,
    hold_expired_at: null,
    released_at: null,
    timeline: [
      { timestamp: '2026-07-15T14:00:00.000Z', actor: 'Buyer',  action: 'Membuat pesanan vaksin' },
      { timestamp: '2026-07-15T14:30:00.000Z', actor: 'Seller', action: 'Konfirmasi ketersediaan stok vaksin' },
      { timestamp: '2026-07-15T15:00:00.000Z', actor: 'System', action: 'Menunggu pembeli melakukan pembayaran escrow' },
    ],
    status_history: [
      { from_status: null,   to_status: 'Draft',             changed_at: '2026-07-15T14:00:00.000Z', changed_by: 'Buyer' },
      { from_status: 'Draft', to_status: 'WaitingSellerConfirmation', changed_at: '2026-07-15T14:05:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingSellerConfirmation', to_status: 'WaitingPayment', changed_at: '2026-07-15T14:30:00.000Z', changed_by: 'Seller' },
    ],
  },
  {
    escrow_id: 'ESC-20260715-0006',
    transaction_uuid: demoTxnId(6),
    buyer_name: 'Nurul Hidayah',
    buyer_workspace: 'Kandang Berkah',
    buyer_workspace_id: 'w3',
    seller_name: 'Trans Ternak Ekspres',
    seller_workspace: 'Trans Ternak Ekspres',
    seller_workspace_id: 'w6',
    item_title: 'Jasa Angkut Sapi 10 Ekor Garut–Bandung',
    item_type: 'Transport',
    item_detail: 'Pengangkutan 10 ekor sapi dari Garut ke Bandung menggunakan truk khusus ternak, ~4 jam.',
    item_quantity: 10,
    item_unit: 'ekor',
    amount: 3_500_000,
    escrow_fee: 70_000,
    total_amount: 3_570_000,
    currency: 'IDR',
    status: 'Cancelled',
    payment_status: 'Dikembalikan',
    settlement_method: 'Escrow',
    provider: 'TernakHub Internal (Mock)',
    created_at: '2026-07-15T10:00:00.000Z',
    updated_at: '2026-07-16T09:00:00.000Z',
    hold_started_at: '2026-07-15T11:30:00.000Z',
    hold_expired_at: null,
    released_at: null,
    notes: 'Dibatalkan karena transporter tidak tersedia di tanggal yang diminta.',
    timeline: [
      { timestamp: '2026-07-15T10:00:00.000Z', actor: 'Buyer',  action: 'Memesan jasa angkut ternak' },
      { timestamp: '2026-07-15T11:00:00.000Z', actor: 'Seller', action: 'Konfirmasi ketersediaan kendaraan' },
      { timestamp: '2026-07-15T11:30:00.000Z', actor: 'Buyer',  action: 'Pembayaran escrow berhasil' },
      { timestamp: '2026-07-16T08:00:00.000Z', actor: 'Seller', action: 'Membatalkan pesanan', note: 'Kendaraan rusak mendadak' },
      { timestamp: '2026-07-16T09:00:00.000Z', actor: 'Platform', action: 'Dana dikembalikan ke pembeli' },
    ],
    status_history: [
      { from_status: null,    to_status: 'Draft',             changed_at: '2026-07-15T10:00:00.000Z', changed_by: 'Buyer' },
      { from_status: 'Draft', to_status: 'WaitingSellerConfirmation', changed_at: '2026-07-15T10:05:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingSellerConfirmation', to_status: 'WaitingPayment', changed_at: '2026-07-15T11:00:00.000Z', changed_by: 'Seller' },
      { from_status: 'WaitingPayment', to_status: 'WaitingShipment', changed_at: '2026-07-15T11:30:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingShipment', to_status: 'Cancelled', changed_at: '2026-07-16T08:00:00.000Z', changed_by: 'Seller', reason: 'Kendaraan rusak mendadak' },
    ],
  },
  {
    escrow_id: 'ESC-20260716-0007',
    transaction_uuid: demoTxnId(7),
    buyer_name: 'Hendra Wijaya',
    buyer_workspace: 'PT Pangan Nusantara',
    buyer_workspace_id: 'w4',
    seller_name: 'Koperasi Sapi Jateng',
    seller_workspace: 'Koperasi Sapi Jateng',
    seller_workspace_id: 'w2',
    item_title: 'Sapi Brahman Cross 20 Ekor',
    item_type: 'Livestock',
    item_detail: 'Sapi Brahman Cross jantan, 2–3 tahun, bobot rata-rata ±380 kg per ekor.',
    item_quantity: 20,
    item_unit: 'ekor',
    amount: 152_000_000,
    escrow_fee: 3_040_000,
    total_amount: 155_040_000,
    currency: 'IDR',
    status: 'WaitingBuyerConfirmation',
    payment_status: 'Belum Bayar',
    settlement_method: 'Escrow',
    provider: 'TernakHub Internal (Mock)',
    created_at: '2026-07-16T09:00:00.000Z',
    updated_at: '2026-07-16T09:30:00.000Z',
    hold_started_at: null,
    hold_expired_at: null,
    released_at: null,
    timeline: [
      { timestamp: '2026-07-16T09:00:00.000Z', actor: 'Seller', action: 'Membuat penawaran escrow 20 ekor sapi' },
      { timestamp: '2026-07-16T09:30:00.000Z', actor: 'System', action: 'Notifikasi dikirim ke pembeli untuk konfirmasi' },
    ],
    status_history: [
      { from_status: null,    to_status: 'Draft',             changed_at: '2026-07-16T09:00:00.000Z', changed_by: 'Seller' },
      { from_status: 'Draft', to_status: 'WaitingBuyerConfirmation', changed_at: '2026-07-16T09:05:00.000Z', changed_by: 'System' },
    ],
  },
  {
    escrow_id: 'ESC-20260716-0008',
    transaction_uuid: demoTxnId(8),
    buyer_name: 'Lestari Agung',
    buyer_workspace: 'Agro Farm Bali',
    buyer_workspace_id: 'w5',
    seller_name: 'Depot Pakan Makmur',
    seller_workspace: 'Depot Pakan Makmur',
    seller_workspace_id: 'w1',
    item_title: 'Rumput Odot Kering 2 Ton',
    item_type: 'Feed',
    item_detail: 'Rumput odot kering kualitas premium, kadar air <14%, dikemas per karung 25 kg.',
    item_quantity: 2000,
    item_unit: 'kg',
    amount: 6_000_000,
    escrow_fee: 120_000,
    total_amount: 6_120_000,
    currency: 'IDR',
    status: 'Delivered',
    payment_status: 'Terkonfirmasi',
    settlement_method: 'Escrow',
    provider: 'TernakHub Internal (Mock)',
    created_at: '2026-07-13T11:00:00.000Z',
    updated_at: '2026-07-17T07:00:00.000Z',
    hold_started_at: '2026-07-13T13:00:00.000Z',
    hold_expired_at: '2026-07-28T13:00:00.000Z',
    released_at: null,
    timeline: [
      { timestamp: '2026-07-13T11:00:00.000Z', actor: 'Buyer',  action: 'Memesan rumput odot kering' },
      { timestamp: '2026-07-13T12:00:00.000Z', actor: 'Seller', action: 'Konfirmasi stok tersedia' },
      { timestamp: '2026-07-13T13:00:00.000Z', actor: 'Buyer',  action: 'Pembayaran escrow berhasil' },
      { timestamp: '2026-07-14T06:00:00.000Z', actor: 'Seller', action: 'Pakan dikirim via ekspedisi cargo' },
      { timestamp: '2026-07-15T14:00:00.000Z', actor: 'Buyer',  action: 'Pakan tiba di lokasi, sedang dicek kualitas' },
    ],
    status_history: [
      { from_status: null,    to_status: 'Draft',             changed_at: '2026-07-13T11:00:00.000Z', changed_by: 'Buyer' },
      { from_status: 'Draft', to_status: 'WaitingSellerConfirmation', changed_at: '2026-07-13T11:05:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingSellerConfirmation', to_status: 'WaitingPayment', changed_at: '2026-07-13T12:00:00.000Z', changed_by: 'Seller' },
      { from_status: 'WaitingPayment', to_status: 'WaitingShipment', changed_at: '2026-07-13T13:00:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingShipment', to_status: 'InTransit', changed_at: '2026-07-14T06:00:00.000Z', changed_by: 'Seller' },
      { from_status: 'InTransit', to_status: 'Delivered', changed_at: '2026-07-15T14:00:00.000Z', changed_by: 'Buyer' },
    ],
  },
  {
    escrow_id: 'ESC-20260717-0009',
    transaction_uuid: demoTxnId(9),
    buyer_name: 'Firman Halim',
    buyer_workspace: 'Berkah Farm Garut',
    buyer_workspace_id: 'w1',
    seller_name: 'Klinik Hewan Sejahtera',
    seller_workspace: 'Klinik Hewan Sejahtera',
    seller_workspace_id: 'w3',
    item_title: 'Jasa Pemeriksaan Kesehatan Ternak Berkala',
    item_type: 'Layanan',
    item_detail: 'Paket pemeriksaan kesehatan 50 ekor sapi, termasuk pengambilan sampel darah dan laporan.',
    item_quantity: 50,
    item_unit: 'ekor',
    amount: 8_500_000,
    escrow_fee: 170_000,
    total_amount: 8_670_000,
    currency: 'IDR',
    status: 'WaitingSellerConfirmation',
    payment_status: 'Belum Bayar',
    settlement_method: 'Escrow',
    provider: 'TernakHub Internal (Mock)',
    created_at: '2026-07-17T08:00:00.000Z',
    updated_at: '2026-07-17T08:15:00.000Z',
    hold_started_at: null,
    hold_expired_at: null,
    released_at: null,
    timeline: [
      { timestamp: '2026-07-17T08:00:00.000Z', actor: 'Buyer',  action: 'Memesan jasa pemeriksaan kesehatan ternak' },
      { timestamp: '2026-07-17T08:15:00.000Z', actor: 'System', action: 'Notifikasi dikirim ke klinik hewan' },
    ],
    status_history: [
      { from_status: null,    to_status: 'Draft',             changed_at: '2026-07-17T08:00:00.000Z', changed_by: 'Buyer' },
      { from_status: 'Draft', to_status: 'WaitingSellerConfirmation', changed_at: '2026-07-17T08:05:00.000Z', changed_by: 'System' },
    ],
  },
  {
    escrow_id: 'ESC-20260708-0010',
    transaction_uuid: demoTxnId(10),
    buyer_name: 'Wahyu Setiawan',
    buyer_workspace: 'UD Usaha Maju',
    buyer_workspace_id: 'w6',
    seller_name: 'Koperasi Peternak Sumbar',
    seller_workspace: 'Koperasi Peternak Sumbar',
    seller_workspace_id: 'w4',
    item_title: 'Sapi Aceh Jantan 5 Ekor',
    item_type: 'Livestock',
    item_detail: 'Sapi Aceh jantan, umur 3–4 tahun, bobot rata-rata ±320 kg per ekor.',
    livestock_id: 'TRN-2024-010-S005',
    item_quantity: 5,
    item_unit: 'ekor',
    amount: 60_000_000,
    escrow_fee: 1_200_000,
    total_amount: 61_200_000,
    currency: 'IDR',
    status: 'Completed',
    payment_status: 'Terkonfirmasi',
    settlement_method: 'Escrow',
    provider: 'TernakHub Internal (Mock)',
    created_at: '2026-07-08T07:00:00.000Z',
    updated_at: '2026-07-14T10:00:00.000Z',
    hold_started_at: '2026-07-08T09:00:00.000Z',
    hold_expired_at: '2026-07-23T09:00:00.000Z',
    released_at: '2026-07-14T10:00:00.000Z',
    timeline: [
      { timestamp: '2026-07-08T07:00:00.000Z', actor: 'Seller', action: 'Membuat escrow' },
      { timestamp: '2026-07-08T08:00:00.000Z', actor: 'Buyer',  action: 'Konfirmasi dan setuju' },
      { timestamp: '2026-07-08T09:00:00.000Z', actor: 'Buyer',  action: 'Pembayaran berhasil' },
      { timestamp: '2026-07-09T07:00:00.000Z', actor: 'Seller', action: 'Ternak dikirim' },
      { timestamp: '2026-07-11T14:00:00.000Z', actor: 'Buyer',  action: 'Ternak tiba, kondisi sangat baik' },
      { timestamp: '2026-07-14T10:00:00.000Z', actor: 'Buyer',  action: 'Konfirmasi penerimaan' },
      { timestamp: '2026-07-14T10:00:00.000Z', actor: 'Platform', action: 'Dana dilepaskan ke penjual' },
    ],
    status_history: [
      { from_status: null,   to_status: 'Draft',             changed_at: '2026-07-08T07:00:00.000Z', changed_by: 'Seller' },
      { from_status: 'Draft', to_status: 'WaitingBuyerConfirmation', changed_at: '2026-07-08T07:05:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingBuyerConfirmation', to_status: 'WaitingPayment', changed_at: '2026-07-08T08:00:00.000Z', changed_by: 'Buyer' },
      { from_status: 'WaitingPayment', to_status: 'WaitingShipment', changed_at: '2026-07-08T09:00:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingShipment', to_status: 'InTransit', changed_at: '2026-07-09T07:00:00.000Z', changed_by: 'Seller' },
      { from_status: 'InTransit', to_status: 'Delivered', changed_at: '2026-07-11T14:00:00.000Z', changed_by: 'Buyer' },
      { from_status: 'Delivered', to_status: 'Completed', changed_at: '2026-07-14T10:00:00.000Z', changed_by: 'Buyer' },
    ],
  },
  {
    escrow_id: 'ESC-20260717-0011',
    transaction_uuid: demoTxnId(11),
    buyer_name: 'Agus Kurniawan',
    buyer_workspace: 'Mandiri Farm',
    buyer_workspace_id: 'w2',
    seller_name: 'Siti Rahayu',
    seller_workspace: 'Ternakku Jaya',
    seller_workspace_id: 'w3',
    item_title: 'Domba Garut Super 8 Ekor',
    item_type: 'Livestock',
    item_detail: 'Domba Garut jantan ras super, umur 2 tahun, rata-rata bobot 55 kg, bebas cacingan.',
    item_quantity: 8,
    item_unit: 'ekor',
    amount: 24_000_000,
    escrow_fee: 480_000,
    total_amount: 24_480_000,
    currency: 'IDR',
    status: 'Draft',
    payment_status: 'Belum Bayar',
    settlement_method: 'Escrow',
    provider: 'TernakHub Internal (Mock)',
    created_at: '2026-07-17T11:00:00.000Z',
    updated_at: '2026-07-17T11:00:00.000Z',
    hold_started_at: null,
    hold_expired_at: null,
    released_at: null,
    timeline: [
      { timestamp: '2026-07-17T11:00:00.000Z', actor: 'System', action: 'Draft escrow dibuat dari negosiasi marketplace' },
    ],
    status_history: [
      { from_status: null, to_status: 'Draft', changed_at: '2026-07-17T11:00:00.000Z', changed_by: 'System' },
    ],
  },
  {
    escrow_id: 'ESC-20260709-0012',
    transaction_uuid: demoTxnId(12),
    buyer_name: 'Rina Marlina',
    buyer_workspace: 'Kandang Berkah',
    buyer_workspace_id: 'w3',
    seller_name: 'Apotek Ternak Sehat',
    seller_workspace: 'Apotek Ternak Sehat',
    seller_workspace_id: 'w5',
    item_title: 'Obat Cacing Ivermectin 500ml × 10',
    item_type: 'Medicine',
    item_detail: 'Ivermectin 1% larutan injeksi, 500ml per botol, 10 botol, untuk sapi dan kambing.',
    item_quantity: 10,
    item_unit: 'botol',
    amount: 2_800_000,
    escrow_fee: 56_000,
    total_amount: 2_856_000,
    currency: 'IDR',
    status: 'Completed',
    payment_status: 'Terkonfirmasi',
    settlement_method: 'Escrow',
    provider: 'TernakHub Internal (Mock)',
    created_at: '2026-07-09T10:00:00.000Z',
    updated_at: '2026-07-12T15:00:00.000Z',
    hold_started_at: '2026-07-09T11:00:00.000Z',
    hold_expired_at: null,
    released_at: '2026-07-12T15:00:00.000Z',
    timeline: [
      { timestamp: '2026-07-09T10:00:00.000Z', actor: 'Buyer', action: 'Memesan obat cacing Ivermectin' },
      { timestamp: '2026-07-09T10:30:00.000Z', actor: 'Seller', action: 'Konfirmasi stok' },
      { timestamp: '2026-07-09T11:00:00.000Z', actor: 'Buyer', action: 'Pembayaran berhasil' },
      { timestamp: '2026-07-10T08:00:00.000Z', actor: 'Seller', action: 'Dikirim via kurir dingin' },
      { timestamp: '2026-07-12T14:00:00.000Z', actor: 'Buyer', action: 'Obat diterima dalam kondisi baik' },
      { timestamp: '2026-07-12T15:00:00.000Z', actor: 'Buyer', action: 'Konfirmasi penerimaan — selesai' },
      { timestamp: '2026-07-12T15:00:00.000Z', actor: 'Platform', action: 'Dana dilepaskan ke apotek' },
    ],
    status_history: [
      { from_status: null,   to_status: 'Draft',             changed_at: '2026-07-09T10:00:00.000Z', changed_by: 'Buyer' },
      { from_status: 'Draft', to_status: 'WaitingSellerConfirmation', changed_at: '2026-07-09T10:05:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingSellerConfirmation', to_status: 'WaitingPayment', changed_at: '2026-07-09T10:30:00.000Z', changed_by: 'Seller' },
      { from_status: 'WaitingPayment', to_status: 'WaitingShipment', changed_at: '2026-07-09T11:00:00.000Z', changed_by: 'System' },
      { from_status: 'WaitingShipment', to_status: 'InTransit', changed_at: '2026-07-10T08:00:00.000Z', changed_by: 'Seller' },
      { from_status: 'InTransit', to_status: 'Delivered', changed_at: '2026-07-12T14:00:00.000Z', changed_by: 'Buyer' },
      { from_status: 'Delivered', to_status: 'Completed', changed_at: '2026-07-12T15:00:00.000Z', changed_by: 'Buyer' },
    ],
  },
];

// ─── Platform Stats ───────────────────────────────────────────────────────────

function computeStats() {
  const total = ADMIN_ESCROW_LIST.length;
  const active = ADMIN_ESCROW_LIST.filter((e) =>
    !['Completed', 'Cancelled'].includes(e.status)
  ).length;
  const completed  = ADMIN_ESCROW_LIST.filter((e) => e.status === 'Completed').length;
  const cancelled  = ADMIN_ESCROW_LIST.filter((e) => e.status === 'Cancelled').length;
  const disputed   = ADMIN_ESCROW_LIST.filter((e) => e.status === 'Disputed').length;
  const totalValue = ADMIN_ESCROW_LIST.reduce((acc, e) => acc + e.amount, 0);
  return { total, active, completed, cancelled, disputed, totalValue };
}

export const ESCROW_PLATFORM_STATS = computeStats();

// ─── Filter helpers ───────────────────────────────────────────────────────────

export interface EscrowFilter {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  workspace: string;
  type: string;
}

export function filterEscrows(
  list: AdminEscrowRecord[],
  f: EscrowFilter,
): AdminEscrowRecord[] {
  let result = list;

  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    result = result.filter(
      (e) =>
        e.escrow_id.toLowerCase().includes(q) ||
        e.buyer_name.toLowerCase().includes(q) ||
        e.seller_name.toLowerCase().includes(q) ||
        (e.livestock_id ?? '').toLowerCase().includes(q),
    );
  }

  if (f.status && f.status !== 'all') {
    result = result.filter((e) => e.status === f.status);
  }

  if (f.dateFrom) {
    result = result.filter((e) => e.created_at >= f.dateFrom);
  }

  if (f.dateTo) {
    result = result.filter((e) => e.created_at <= f.dateTo + 'T23:59:59Z');
  }

  if (f.workspace && f.workspace !== 'all') {
    result = result.filter(
      (e) =>
        e.buyer_workspace.toLowerCase().includes(f.workspace.toLowerCase()) ||
        e.seller_workspace.toLowerCase().includes(f.workspace.toLowerCase()),
    );
  }

  if (f.type && f.type !== 'all') {
    result = result.filter((e) => e.item_type === f.type);
  }

  return result;
}

export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
