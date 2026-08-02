// ─── Global Reference Data — FOUNDATION-GLOBAL-REFERENCE-001 ─────────────────
//
// Single Source of Truth untuk seluruh data referensi TernakHub.
//
// ATURAN:
//   • Modul lain TIDAK boleh membuat enum, union type, atau daftar referensi
//     sendiri untuk hal-hal yang sudah ada di sini.
//   • Akses selalu melalui globalReferenceService.ts — bukan langsung ke
//     GLOBAL_REFERENCE_DB atau fungsi internal (_*).
//   • Untuk menambah referensi baru, cukup tambahkan entry seed di bawah
//     (atau panggil registerReference() dari service di runtime).
//   • UUID seed bersifat stabil — jangan pernah diregenerasi.
//
// MIGRASI MODUL LAMA:
//   Modul yang saat ini menggunakan string hardcode atau union type sendiri
//   dapat bermigrasi dengan:
//   1. Memanggil getReferenceByType(type) untuk mendapatkan daftar pilihan.
//   2. Menyimpan reference_uuid (bukan string nama) di record entitas.
//   3. Menampilkan reference_name via getReferenceByUuid(uuid)?.reference_name.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Reference Type ──────────────────────────────────────────────────────────

export type ReferenceType =
  | 'WORKSPACE'
  | 'SPECIES'
  | 'BREED'
  | 'PROGRAM_TERNAK'
  | 'STATUS_KESEHATAN'
  | 'PENYAKIT'
  | 'GEJALA'
  | 'TINDAKAN'
  | 'JENIS_PAKAN'
  | 'KATEGORI_PAKAN'
  | 'SUBKATEGORI_PAKAN'
  | 'JENIS_OBAT'
  | 'KATEGORI_OBAT'
  | 'PRODUK_KOMERSIAL'
  | 'MARKETPLACE_CATEGORY'
  | 'MARKETPLACE_STATUS'
  | 'ESCROW_STATUS'
  | 'TRANSACTION_STATUS'
  | 'NOTIFICATION_TYPE'
  | 'AI_INSIGHT_TYPE'
  | 'BUSINESS_TYPE'
  | 'TRANSPORT_TYPE'
  | 'SATUAN_BERAT'
  | 'SATUAN_VOLUME'
  | 'SATUAN_PANJANG'
  | 'MATA_UANG'
  | 'LOKASI_REFERENSI'
  | 'PAYMENT_METHOD'
  | 'TRANSACTION_TYPE'
  | 'PAYMENT_STATUS'
  | 'DISPUTE_STATUS'
  | 'ESCROW_PROVIDER_TYPE'
  | 'CONVERSATION_TYPE'
  | 'CONVERSATION_STATUS'
  | 'MESSAGE_TYPE'
  | 'PARTICIPANT_ROLE'
  | 'NOTIFICATION_STATUS'
  | 'PRIORITY'
  | 'AUDIT_EVENT_TYPE'
  | 'AUDIT_ACTION'
  | 'ACTIVITY_TYPE'
  | 'ACTIVITY_STATUS'
  | 'VISIBILITY'
  | 'TRUST_LEVEL'
  | 'ENTITY_TYPE'
  | 'VERIFICATION_TYPE'
  | 'VERIFICATION_STATUS'
  | 'SEARCH_STATUS'
  | 'INSIGHT_TYPE'
  | 'INSIGHT_STATUS';

/** Semua nilai ReferenceType yang valid — gunakan untuk validasi runtime. */
export const REFERENCE_TYPES: readonly ReferenceType[] = [
  'WORKSPACE', 'SPECIES', 'BREED', 'PROGRAM_TERNAK', 'STATUS_KESEHATAN',
  'PENYAKIT', 'GEJALA', 'TINDAKAN', 'JENIS_PAKAN', 'KATEGORI_PAKAN',
  'SUBKATEGORI_PAKAN', 'JENIS_OBAT', 'KATEGORI_OBAT', 'PRODUK_KOMERSIAL',
  'MARKETPLACE_CATEGORY', 'MARKETPLACE_STATUS', 'ESCROW_STATUS',
  'TRANSACTION_STATUS', 'NOTIFICATION_TYPE', 'AI_INSIGHT_TYPE',
  'BUSINESS_TYPE', 'TRANSPORT_TYPE', 'SATUAN_BERAT', 'SATUAN_VOLUME',
  'SATUAN_PANJANG', 'MATA_UANG', 'LOKASI_REFERENSI',
  'PAYMENT_METHOD', 'TRANSACTION_TYPE',
  'PAYMENT_STATUS', 'DISPUTE_STATUS', 'ESCROW_PROVIDER_TYPE',
  'CONVERSATION_TYPE', 'CONVERSATION_STATUS', 'MESSAGE_TYPE', 'PARTICIPANT_ROLE',
  'NOTIFICATION_STATUS', 'PRIORITY',
  'AUDIT_EVENT_TYPE', 'AUDIT_ACTION',
  'ACTIVITY_TYPE', 'ACTIVITY_STATUS', 'VISIBILITY',
  'TRUST_LEVEL', 'ENTITY_TYPE',
  'VERIFICATION_TYPE', 'VERIFICATION_STATUS',
  'SEARCH_STATUS',
  'INSIGHT_TYPE', 'INSIGHT_STATUS',
] as const;

// ─── Schema ──────────────────────────────────────────────────────────────────

export interface ReferenceRecord {
  /** UUID v4 — primary key. Immutable setelah ditetapkan. */
  reference_uuid: string;
  /** Jenis logis referensi (e.g. SPECIES, BREED, KATEGORI_PAKAN). */
  reference_type: ReferenceType;
  /** Sub-pengelompokan opsional dalam satu type (e.g. 'Ruminansia' dalam SPECIES). */
  reference_category: string | null;
  /** Kode singkat machine-readable (e.g. 'D' untuk Domba, 'KG' untuk Kilogram). */
  reference_code: string;
  /** Nama tampilan untuk pengguna. */
  reference_name: string;
  /** UUID record induk — untuk referensi hirarkis (e.g. Breed → Species). */
  parent_reference_uuid: string | null;
  /** Deskripsi panjang opsional. */
  description: string | null;
  /** Urutan tampilan dalam type+category yang sama. Lebih kecil = lebih awal. */
  sort_order: number;
  /** false = soft-deleted. Consumer harus filter is_active=true secara default. */
  is_active: boolean;
  /** Timestamp ISO 8601 saat record dibuat. */
  created_at: string;
  /** Timestamp ISO 8601 saat record terakhir diperbarui. */
  updated_at: string;
}

// ─── In-Memory Store ─────────────────────────────────────────────────────────
// Keyed by reference_uuid untuk O(1) lookup.
// INTERNAL — akses hanya melalui globalReferenceService.ts.

export const GLOBAL_REFERENCE_DB: Map<string, ReferenceRecord> = new Map();

// ─── Internal Helpers (package-private) ──────────────────────────────────────
// Prefix _ menandakan fungsi ini hanya untuk digunakan oleh service layer.
// Jangan import langsung dari modul lain.

/** Sisipkan record ke store. Dipanggil oleh seed dan registerReference. */
export function _insertReference(record: ReferenceRecord): void {
  GLOBAL_REFERENCE_DB.set(record.reference_uuid, record);
}

/** Baca semua record sebagai array. Digunakan oleh fungsi query di service. */
export function _getAllReferences(): ReferenceRecord[] {
  return Array.from(GLOBAL_REFERENCE_DB.values());
}

/** Ganti record yang sudah ada di tempat. Digunakan oleh updateReference & disableReference. */
export function _replaceReference(record: ReferenceRecord): void {
  GLOBAL_REFERENCE_DB.set(record.reference_uuid, record);
}

// ─── Seed Helper ─────────────────────────────────────────────────────────────

const SEED_TS = '2026-07-16T00:00:00.000Z';

function seed(
  uuid: string,
  type: ReferenceType,
  code: string,
  name: string,
  sortOrder: number,
  opts: {
    category?: string;
    parentUuid?: string;
    description?: string;
  } = {},
): void {
  _insertReference({
    reference_uuid: uuid,
    reference_type: type,
    reference_category: opts.category ?? null,
    reference_code: code,
    reference_name: name,
    parent_reference_uuid: opts.parentUuid ?? null,
    description: opts.description ?? null,
    sort_order: sortOrder,
    is_active: true,
    created_at: SEED_TS,
    updated_at: SEED_TS,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// UUID bersifat stabil — jangan diregenerasi.
// Tambahkan entry baru di bagian bawah masing-masing section.
// ─────────────────────────────────────────────────────────────────────────────

// ── WORKSPACE ─────────────────────────────────────────────────────────────────
seed('e1000001-0000-4000-a000-000000000001', 'WORKSPACE', 'AKTIF',     'Aktif',      1, { description: 'Workspace aktif dan beroperasi normal.' });
seed('e1000001-0000-4000-a000-000000000002', 'WORKSPACE', 'TRIAL',     'Trial',      2, { description: 'Workspace dalam masa percobaan (belum berlangganan).' });
seed('e1000001-0000-4000-a000-000000000003', 'WORKSPACE', 'NONAKTIF',  'Nonaktif',   3, { description: 'Workspace dinonaktifkan oleh pengguna.' });
seed('e1000001-0000-4000-a000-000000000004', 'WORKSPACE', 'SUSPENDED', 'Suspended',  4, { description: 'Workspace ditangguhkan karena pelanggaran atau tunggakan.' });

// ── SPECIES ───────────────────────────────────────────────────────────────────
// Matches MASTER_SPECIES in src/data/speciesData.ts
// reference_code matches LivestockRecord ID prefix convention (D, K, S, R, H, P)
seed('e2000001-0000-4000-a000-000000000001', 'SPECIES', 'D', 'Domba',   1, { category: 'Ruminansia Kecil', description: 'Ovis aries — domba pedaging/bibit.' });
seed('e2000001-0000-4000-a000-000000000002', 'SPECIES', 'K', 'Kambing', 2, { category: 'Ruminansia Kecil', description: 'Capra aegagrus hircus — kambing pedaging/perah.' });
seed('e2000001-0000-4000-a000-000000000003', 'SPECIES', 'S', 'Sapi',    3, { category: 'Ruminansia Besar', description: 'Bos taurus/indicus — sapi pedaging/perah.' });
seed('e2000001-0000-4000-a000-000000000004', 'SPECIES', 'R', 'Kerbau',  4, { category: 'Ruminansia Besar', description: 'Bubalus bubalis — kerbau kerja/pedaging.' });
seed('e2000001-0000-4000-a000-000000000005', 'SPECIES', 'H', 'Kuda',    5, { category: 'Non-Ruminansia', description: 'Equus caballus — kuda kerja/olahraga.' });
seed('e2000001-0000-4000-a000-000000000006', 'SPECIES', 'P', 'Babi',    6, { category: 'Non-Ruminansia', description: 'Sus scrofa domesticus — babi pedaging.' });

// ── BREED (Ras) ───────────────────────────────────────────────────────────────
// parent_reference_uuid → SPECIES uuid
// Matches RAS_OPTIONS in src/data/speciesData.ts

// Domba breeds
const _UUID_DOMBA   = 'e2000001-0000-4000-a000-000000000001';
seed('e3000001-0000-4000-a000-000000000001', 'BREED', 'D-GRT', 'Garut (Priangan)',         1,  { parentUuid: _UUID_DOMBA, category: 'Domba' });
seed('e3000001-0000-4000-a000-000000000002', 'BREED', 'D-BTR', 'Batur (Domba Gembel)',     2,  { parentUuid: _UUID_DOMBA, category: 'Domba' });
seed('e3000001-0000-4000-a000-000000000003', 'BREED', 'D-DET', 'Domba Ekor Tipis (DET)',   3,  { parentUuid: _UUID_DOMBA, category: 'Domba' });
seed('e3000001-0000-4000-a000-000000000004', 'BREED', 'D-DEG', 'Domba Ekor Gemuk (DEG)',   4,  { parentUuid: _UUID_DOMBA, category: 'Domba' });
seed('e3000001-0000-4000-a000-000000000005', 'BREED', 'D-DRP', 'Dorper',                   5,  { parentUuid: _UUID_DOMBA, category: 'Domba' });
seed('e3000001-0000-4000-a000-000000000006', 'BREED', 'D-TXL', 'Texel',                    6,  { parentUuid: _UUID_DOMBA, category: 'Domba' });
seed('e3000001-0000-4000-a000-000000000007', 'BREED', 'D-MRN', 'Merino',                   7,  { parentUuid: _UUID_DOMBA, category: 'Domba' });
seed('e3000001-0000-4000-a000-000000000008', 'BREED', 'D-SFK', 'Suffolk',                  8,  { parentUuid: _UUID_DOMBA, category: 'Domba' });
seed('e3000001-0000-4000-a000-000000000009', 'BREED', 'D-AWS', 'Awassi',                   9,  { parentUuid: _UUID_DOMBA, category: 'Domba' });
seed('e3000001-0000-4000-a000-000000000010', 'BREED', 'D-CPX', 'Compass Agrinak',         10,  { parentUuid: _UUID_DOMBA, category: 'Domba' });
seed('e3000001-0000-4000-a000-000000000011', 'BREED', 'D-KTD', 'Katahdin',                11,  { parentUuid: _UUID_DOMBA, category: 'Domba' });
seed('e3000001-0000-4000-a000-000000000012', 'BREED', 'D-BBB', 'Barbados Black Belly',    12,  { parentUuid: _UUID_DOMBA, category: 'Domba' });
seed('e3000001-0000-4000-a000-000000000013', 'BREED', 'D-LNY', 'Lainnya',                 99,  { parentUuid: _UUID_DOMBA, category: 'Domba' });

// Kambing breeds
const _UUID_KAMBING = 'e2000001-0000-4000-a000-000000000002';
seed('e3000001-0000-4000-a000-000000000101', 'BREED', 'K-BOE', 'Boer',                     1,  { parentUuid: _UUID_KAMBING, category: 'Kambing' });
seed('e3000001-0000-4000-a000-000000000102', 'BREED', 'K-BRK', 'Boerka',                   2,  { parentUuid: _UUID_KAMBING, category: 'Kambing' });
seed('e3000001-0000-4000-a000-000000000103', 'BREED', 'K-KCG', 'Kacang',                   3,  { parentUuid: _UUID_KAMBING, category: 'Kambing' });
seed('e3000001-0000-4000-a000-000000000104', 'BREED', 'K-PE',  'Peranakan Etawa (PE)',      4,  { parentUuid: _UUID_KAMBING, category: 'Kambing' });
seed('e3000001-0000-4000-a000-000000000105', 'BREED', 'K-ETW', 'Etawa (Jamnapari)',         5,  { parentUuid: _UUID_KAMBING, category: 'Kambing' });
seed('e3000001-0000-4000-a000-000000000106', 'BREED', 'K-SNN', 'Saanen',                   6,  { parentUuid: _UUID_KAMBING, category: 'Kambing' });
seed('e3000001-0000-4000-a000-000000000107', 'BREED', 'K-SPR', 'Sapera',                   7,  { parentUuid: _UUID_KAMBING, category: 'Kambing' });
seed('e3000001-0000-4000-a000-000000000108', 'BREED', 'K-AN',  'Anglo Nubian',              8,  { parentUuid: _UUID_KAMBING, category: 'Kambing' });
seed('e3000001-0000-4000-a000-000000000109', 'BREED', 'K-LKR', 'Lakor',                    9,  { parentUuid: _UUID_KAMBING, category: 'Kambing' });
seed('e3000001-0000-4000-a000-000000000110', 'BREED', 'K-SDR', 'Senduro',                 10,  { parentUuid: _UUID_KAMBING, category: 'Kambing' });
seed('e3000001-0000-4000-a000-000000000111', 'BREED', 'K-MUR', 'Muara',                   11,  { parentUuid: _UUID_KAMBING, category: 'Kambing' });
seed('e3000001-0000-4000-a000-000000000112', 'BREED', 'K-LNY', 'Lainnya',                 99,  { parentUuid: _UUID_KAMBING, category: 'Kambing' });

// Sapi breeds
const _UUID_SAPI    = 'e2000001-0000-4000-a000-000000000003';
seed('e3000001-0000-4000-a000-000000000201', 'BREED', 'S-LIM', 'Limousin',                 1,  { parentUuid: _UUID_SAPI, category: 'Sapi' });
seed('e3000001-0000-4000-a000-000000000202', 'BREED', 'S-SIM', 'Simental',                 2,  { parentUuid: _UUID_SAPI, category: 'Sapi' });
seed('e3000001-0000-4000-a000-000000000203', 'BREED', 'S-AGS', 'Angus',                    3,  { parentUuid: _UUID_SAPI, category: 'Sapi' });
seed('e3000001-0000-4000-a000-000000000204', 'BREED', 'S-BRH', 'Brahman',                  4,  { parentUuid: _UUID_SAPI, category: 'Sapi' });
seed('e3000001-0000-4000-a000-000000000205', 'BREED', 'S-BAL', 'Bali',                     5,  { parentUuid: _UUID_SAPI, category: 'Sapi' });
seed('e3000001-0000-4000-a000-000000000206', 'BREED', 'S-MDR', 'Madura',                   6,  { parentUuid: _UUID_SAPI, category: 'Sapi' });
seed('e3000001-0000-4000-a000-000000000207', 'BREED', 'S-PO',  'PO (Peranakan Ongole)',    7,  { parentUuid: _UUID_SAPI, category: 'Sapi' });
seed('e3000001-0000-4000-a000-000000000208', 'BREED', 'S-OGL', 'Ongole',                   8,  { parentUuid: _UUID_SAPI, category: 'Sapi' });
seed('e3000001-0000-4000-a000-000000000209', 'BREED', 'S-BGS', 'Brangus',                  9,  { parentUuid: _UUID_SAPI, category: 'Sapi' });
seed('e3000001-0000-4000-a000-000000000210', 'BREED', 'S-BB',  'Belgian Blue',             10,  { parentUuid: _UUID_SAPI, category: 'Sapi' });
seed('e3000001-0000-4000-a000-000000000211', 'BREED', 'S-LNY', 'Lainnya',                 99,  { parentUuid: _UUID_SAPI, category: 'Sapi' });

// ── PROGRAM TERNAK ────────────────────────────────────────────────────────────
seed('e4000001-0000-4000-a000-000000000001', 'PROGRAM_TERNAK', 'PGMK',  'Penggemukan',           1, { description: 'Program pembesaran ternak untuk produksi daging.' });
seed('e4000001-0000-4000-a000-000000000002', 'PROGRAM_TERNAK', 'PBBT',  'Pembibitan',            2, { description: 'Program produksi bibit/indukan ternak berkualitas.' });
seed('e4000001-0000-4000-a000-000000000003', 'PROGRAM_TERNAK', 'PMRH',  'Pemerahan',             3, { description: 'Program produksi susu dari sapi/kambing perah.' });
seed('e4000001-0000-4000-a000-000000000004', 'PROGRAM_TERNAK', 'PRPD',  'Reproduksi',            4, { description: 'Program khusus pengelolaan reproduksi dan perkawinan.' });
seed('e4000001-0000-4000-a000-000000000005', 'PROGRAM_TERNAK', 'KRTN',  'Karantina',             5, { description: 'Program isolasi dan pengamatan ternak baru masuk.' });
seed('e4000001-0000-4000-a000-000000000006', 'PROGRAM_TERNAK', 'UMUM',  'Umum',                  6, { description: 'Program peternakan umum tanpa spesialisasi khusus.' });

// ── STATUS KESEHATAN ──────────────────────────────────────────────────────────
// Matches LivestockRecord.status values in src/data/livestockData.ts
seed('e5000001-0000-4000-a000-000000000001', 'STATUS_KESEHATAN', 'SEHAT',  'Sehat',        1, { description: 'Ternak dalam kondisi sehat dan normal.' });
seed('e5000001-0000-4000-a000-000000000002', 'STATUS_KESEHATAN', 'SAKIT',  'Sakit',        2, { description: 'Ternak sedang sakit dan memerlukan penanganan.' });
seed('e5000001-0000-4000-a000-000000000003', 'STATUS_KESEHATAN', 'PNTAU', 'Pemantauan',   3, { description: 'Ternak dalam kondisi perlu pemantauan/observasi.' });
seed('e5000001-0000-4000-a000-000000000004', 'STATUS_KESEHATAN', 'ISLS',  'Isolasi',      4, { description: 'Ternak diisolasi untuk mencegah penularan penyakit.' });
seed('e5000001-0000-4000-a000-000000000005', 'STATUS_KESEHATAN', 'PSMH', 'Pasca Sembuh', 5, { description: 'Ternak dalam masa pemulihan setelah pengobatan.' });

// ── PENYAKIT ──────────────────────────────────────────────────────────────────
// Entri representatif — akan diperluas oleh modul Kesehatan Hewan.
seed('e6000001-0000-4000-a000-000000000001', 'PENYAKIT', 'PMK',  'Penyakit Mulut dan Kuku (PMK)',  1,  { category: 'Viral',       description: 'Penyakit viral sangat menular pada hewan berkuku.' });
seed('e6000001-0000-4000-a000-000000000002', 'PENYAKIT', 'ANT',  'Anthraks',                      2,  { category: 'Bakterial',   description: 'Penyakit bakterial zoonotik berbahaya.' });
seed('e6000001-0000-4000-a000-000000000003', 'PENYAKIT', 'BRU',  'Brucellosis',                   3,  { category: 'Bakterial',   description: 'Infeksi bakteri Brucella yang mempengaruhi reproduksi.' });
seed('e6000001-0000-4000-a000-000000000004', 'PENYAKIT', 'MCE',  'Mastitis',                      4,  { category: 'Bakterial',   description: 'Peradangan kelenjar susu.' });
seed('e6000001-0000-4000-a000-000000000005', 'PENYAKIT', 'CMP',  'Cacingan (Helminthiasis)',       5,  { category: 'Parasit',     description: 'Infestasi cacing parasit pada saluran pencernaan.' });
seed('e6000001-0000-4000-a000-000000000006', 'PENYAKIT', 'SKB',  'Scabies',                       6,  { category: 'Parasit',     description: 'Kudis akibat tungau Sarcoptes scabiei.' });
seed('e6000001-0000-4000-a000-000000000007', 'PENYAKIT', 'BLT',  'Bloat (Kembung)',               7,  { category: 'Metabolik',   description: 'Penumpukan gas berlebih di rumen.' });
seed('e6000001-0000-4000-a000-000000000008', 'PENYAKIT', 'KTV',  'Ketosis',                       8,  { category: 'Metabolik',   description: 'Gangguan metabolisme energi pada sapi perah.' });
seed('e6000001-0000-4000-a000-000000000009', 'PENYAKIT', 'PNM',  'Pneumonia',                     9,  { category: 'Pernapasan',  description: 'Peradangan paru-paru.' });
seed('e6000001-0000-4000-a000-000000000010', 'PENYAKIT', 'DRH',  'Diare',                        10,  { category: 'Pencernaan',  description: 'Gangguan pencernaan dengan feses encer atau berair.' });

// ── GEJALA ────────────────────────────────────────────────────────────────────
seed('e7000001-0000-4000-a000-000000000001', 'GEJALA', 'DEM',  'Demam',                          1,  { description: 'Suhu tubuh di atas normal (>39.5°C untuk ruminansia).' });
seed('e7000001-0000-4000-a000-000000000002', 'GEJALA', 'LMS',  'Lesu/Lemas',                     2,  { description: 'Ternak tampak tidak aktif dan lemah.' });
seed('e7000001-0000-4000-a000-000000000003', 'GEJALA', 'ANF',  'Anoreksia (Tidak Mau Makan)',    3,  { description: 'Kehilangan nafsu makan total atau sebagian.' });
seed('e7000001-0000-4000-a000-000000000004', 'GEJALA', 'KMB',  'Perut Kembung',                  4,  { description: 'Pembengkakan abdomen akibat akumulasi gas.' });
seed('e7000001-0000-4000-a000-000000000005', 'GEJALA', 'BRC',  'Batuk/Bersin',                   5,  { description: 'Gangguan saluran pernapasan atas.' });
seed('e7000001-0000-4000-a000-000000000006', 'GEJALA', 'DHR',  'Diare',                          6,  { description: 'Feses encer atau berair lebih dari normal.' });
seed('e7000001-0000-4000-a000-000000000007', 'GEJALA', 'LKR',  'Luka/Koreng',                    7,  { description: 'Kerusakan jaringan kulit yang terlihat.' });
seed('e7000001-0000-4000-a000-000000000008', 'GEJALA', 'PNC',  'Pincang',                        8,  { description: 'Gangguan pada kaki/sendi sehingga ternak pincang.' });
seed('e7000001-0000-4000-a000-000000000009', 'GEJALA', 'KLR',  'Keluar Cairan Tidak Normal',     9,  { description: 'Sekret/discharge tidak normal dari lubang tubuh.' });
seed('e7000001-0000-4000-a000-000000000010', 'GEJALA', 'GTS',  'Gatal-gatal',                   10,  { description: 'Ternak sering menggaruk atau menggosok tubuh.' });
seed('e7000001-0000-4000-a000-000000000011', 'GEJALA', 'BBT',  'Berat Badan Turun',             11,  { description: 'Penurunan berat badan signifikan tanpa sebab jelas.' });
seed('e7000001-0000-4000-a000-000000000012', 'GEJALA', 'PTS',  'Produksi Susu Turun',           12,  { description: 'Penurunan produksi susu pada ternak perah.' });

// ── TINDAKAN ─────────────────────────────────────────────────────────────────
seed('e8000001-0000-4000-a000-000000000001', 'TINDAKAN', 'PMX',  'Pemeriksaan Fisik',             1,  { description: 'Pemeriksaan kondisi fisik ternak secara menyeluruh.' });
seed('e8000001-0000-4000-a000-000000000002', 'TINDAKAN', 'VKS',  'Vaksinasi',                     2,  { description: 'Pemberian vaksin untuk pencegahan penyakit.' });
seed('e8000001-0000-4000-a000-000000000003', 'TINDAKAN', 'OBT',  'Pengobatan',                    3,  { description: 'Pemberian obat-obatan untuk mengobati penyakit.' });
seed('e8000001-0000-4000-a000-000000000004', 'TINDAKAN', 'DSN',  'Deworming/Desinfestasi',        4,  { description: 'Pemberian obat cacing atau antiparasit.' });
seed('e8000001-0000-4000-a000-000000000005', 'TINDAKAN', 'ILS',  'Isolasi',                       5,  { description: 'Pemisahan ternak sakit dari kelompok sehat.' });
seed('e8000001-0000-4000-a000-000000000006', 'TINDAKAN', 'OPS',  'Operasi/Bedah',                 6,  { description: 'Prosedur bedah oleh dokter hewan berwenang.' });
seed('e8000001-0000-4000-a000-000000000007', 'TINDAKAN', 'IFU',  'Infus/Cairan IV',               7,  { description: 'Pemberian cairan intravena untuk rehidrasi atau nutrisi.' });
seed('e8000001-0000-4000-a000-000000000008', 'TINDAKAN', 'KTL',  'Kontrol Ulang',                 8,  { description: 'Pemeriksaan lanjutan untuk memantau perkembangan.' });
seed('e8000001-0000-4000-a000-000000000009', 'TINDAKAN', 'EUT',  'Eutanasia',                     9,  { description: 'Penghentian hidup secara manusiawi pada ternak sekarat.' });
seed('e8000001-0000-4000-a000-000000000010', 'TINDAKAN', 'PRS',  'Persalinan Dibantu',           10,  { description: 'Bantuan kelahiran (distosia) oleh dokter hewan.' });

// ── JENIS PAKAN ──────────────────────────────────────────────────────────────
seed('e9000001-0000-4000-a000-000000000001', 'JENIS_PAKAN', 'HIJ',  'Hijauan',               1,  { description: 'Pakan segar berupa rumput, leguminosa, daun-daunan.' });
seed('e9000001-0000-4000-a000-000000000002', 'JENIS_PAKAN', 'KON',  'Konsentrat',            2,  { description: 'Pakan padat nutrisi tinggi — biji-bijian, bungkil, dll.' });
seed('e9000001-0000-4000-a000-000000000003', 'JENIS_PAKAN', 'SLS',  'Silase',                3,  { description: 'Pakan hasil fermentasi anaerob hijauan segar.' });
seed('e9000001-0000-4000-a000-000000000004', 'JENIS_PAKAN', 'HAY',  'Hay/Jerami',            4,  { description: 'Pakan hijauan yang dikeringkan (hay) atau jerami.' });
seed('e9000001-0000-4000-a000-000000000005', 'JENIS_PAKAN', 'PKT',  'Pakan Komersial',       5,  { description: 'Pakan pabrikan dalam kemasan dengan formula tetap.' });
seed('e9000001-0000-4000-a000-000000000006', 'JENIS_PAKAN', 'SUP',  'Suplemen',              6,  { description: 'Tambahan nutrisi — vitamin, mineral, probiotik.' });
seed('e9000001-0000-4000-a000-000000000007', 'JENIS_PAKAN', 'MIX',  'Mixed Ration/TMR',      7,  { description: 'Ransum lengkap campuran semua bahan pakan (Total Mixed Ration).' });

// ── KATEGORI PAKAN ────────────────────────────────────────────────────────────
// Matches slug values in src/data/masterPakanKategoriData.ts
seed('ea000001-0000-4000-a000-000000000001', 'KATEGORI_PAKAN', 'JGNG',  'Jagung',                   1,  { category: 'Serealia' });
seed('ea000001-0000-4000-a000-000000000002', 'KATEGORI_PAKAN', 'PADI',  'Padi',                     2,  { category: 'Serealia' });
seed('ea000001-0000-4000-a000-000000000003', 'KATEGORI_PAKAN', 'RMPT',  'Rumput',                   3,  { category: 'Hijauan' });
seed('ea000001-0000-4000-a000-000000000004', 'KATEGORI_PAKAN', 'LGMN',  'Leguminosa',               4,  { category: 'Hijauan' });
seed('ea000001-0000-4000-a000-000000000005', 'KATEGORI_PAKAN', 'DAUN',  'Daun-daunan',              5,  { category: 'Hijauan' });
seed('ea000001-0000-4000-a000-000000000006', 'KATEGORI_PAKAN', 'KCNG',  'Kacang-kacangan',          6,  { category: 'Biji-bijian' });
seed('ea000001-0000-4000-a000-000000000007', 'KATEGORI_PAKAN', 'UMBI',  'Umbi-umbian',              7,  { category: 'Umbi' });
seed('ea000001-0000-4000-a000-000000000008', 'KATEGORI_PAKAN', 'SREL',  'Serealia Lain',            8,  { category: 'Serealia' });
seed('ea000001-0000-4000-a000-000000000009', 'KATEGORI_PAKAN', 'KLPA',  'Kelapa',                   9,  { category: 'Buah & Hasil' });
seed('ea000001-0000-4000-a000-000000000010', 'KATEGORI_PAKAN', 'KLPS',  'Kelapa Sawit',            10,  { category: 'Buah & Hasil' });
seed('ea000001-0000-4000-a000-000000000011', 'KATEGORI_PAKAN', 'TEBU',  'Tebu',                    11,  { category: 'Buah & Hasil' });
seed('ea000001-0000-4000-a000-000000000012', 'KATEGORI_PAKAN', 'BLB',   'Buah & Limbah Buah',      12,  { category: 'Limbah' });
seed('ea000001-0000-4000-a000-000000000013', 'KATEGORI_PAKAN', 'LIP',   'Limbah Industri Pangan',  13,  { category: 'Limbah' });
seed('ea000001-0000-4000-a000-000000000014', 'KATEGORI_PAKAN', 'SPH',   'Sumber Protein Hewani',   14,  { category: 'Protein' });
seed('ea000001-0000-4000-a000-000000000015', 'KATEGORI_PAKAN', 'MNRL',  'Mineral',                 15,  { category: 'Suplemen' });
seed('ea000001-0000-4000-a000-000000000016', 'KATEGORI_PAKAN', 'VFA',   'Vitamin & Feed Additive', 16,  { category: 'Suplemen' });
seed('ea000001-0000-4000-a000-000000000017', 'KATEGORI_PAKAN', 'BCIR',  'Bahan Cair',              17,  { category: 'Cair' });
seed('ea000001-0000-4000-a000-000000000018', 'KATEGORI_PAKAN', 'LAIN',  'Lainnya',                 99,  { category: 'Lainnya' });

// ── SUBKATEGORI PAKAN ─────────────────────────────────────────────────────────
// parent_reference_uuid → KATEGORI_PAKAN uuid
// Entri representatif — akan diperluas seiring migrasi masterPakanData.ts.
seed('eb000001-0000-4000-a000-000000000001', 'SUBKATEGORI_PAKAN', 'JGN-LK',  'Jagung Lokal',          1,  { parentUuid: 'ea000001-0000-4000-a000-000000000001', category: 'Jagung' });
seed('eb000001-0000-4000-a000-000000000002', 'SUBKATEGORI_PAKAN', 'JGN-IMP', 'Jagung Impor',          2,  { parentUuid: 'ea000001-0000-4000-a000-000000000001', category: 'Jagung' });
seed('eb000001-0000-4000-a000-000000000003', 'SUBKATEGORI_PAKAN', 'JGN-HBR', 'Jagung Hibrida',        3,  { parentUuid: 'ea000001-0000-4000-a000-000000000001', category: 'Jagung' });
seed('eb000001-0000-4000-a000-000000000011', 'SUBKATEGORI_PAKAN', 'RMPT-GJ', 'Rumput Gajah/Raja',     1,  { parentUuid: 'ea000001-0000-4000-a000-000000000003', category: 'Rumput' });
seed('eb000001-0000-4000-a000-000000000012', 'SUBKATEGORI_PAKAN', 'RMPT-BD', 'Rumput Benggala',       2,  { parentUuid: 'ea000001-0000-4000-a000-000000000003', category: 'Rumput' });
seed('eb000001-0000-4000-a000-000000000013', 'SUBKATEGORI_PAKAN', 'RMPT-SG', 'Rumput Signal',         3,  { parentUuid: 'ea000001-0000-4000-a000-000000000003', category: 'Rumput' });
seed('eb000001-0000-4000-a000-000000000021', 'SUBKATEGORI_PAKAN', 'LGM-GMB', 'Gamal',                 1,  { parentUuid: 'ea000001-0000-4000-a000-000000000004', category: 'Leguminosa' });
seed('eb000001-0000-4000-a000-000000000022', 'SUBKATEGORI_PAKAN', 'LGM-LMT', 'Lamtoro',               2,  { parentUuid: 'ea000001-0000-4000-a000-000000000004', category: 'Leguminosa' });

// ── JENIS OBAT ────────────────────────────────────────────────────────────────
seed('ec000001-0000-4000-a000-000000000001', 'JENIS_OBAT', 'RX',   'Obat Keras (Resep Dokter)',  1,  { description: 'Hanya boleh diberikan berdasarkan resep dokter hewan berwenang.' });
seed('ec000001-0000-4000-a000-000000000002', 'JENIS_OBAT', 'OTC',  'Obat Bebas (OTC)',           2,  { description: 'Obat yang dapat dibeli dan diberikan tanpa resep dokter.' });
seed('ec000001-0000-4000-a000-000000000003', 'JENIS_OBAT', 'VAK',  'Vaksin',                     3,  { description: 'Produk biologis untuk imunisasi aktif terhadap penyakit.' });
seed('ec000001-0000-4000-a000-000000000004', 'JENIS_OBAT', 'PRB',  'Probiotik',                  4,  { description: 'Mikroorganisme hidup bermanfaat untuk kesehatan saluran cerna.' });
seed('ec000001-0000-4000-a000-000000000005', 'JENIS_OBAT', 'HRB',  'Herbal/Tradisional',         5,  { description: 'Produk kesehatan hewan berbahan baku herbal dan alami.' });

// ── KATEGORI OBAT ─────────────────────────────────────────────────────────────
// Matches ObatKategoriSlug in src/data/masterObatKategoriData.ts
seed('ed000001-0000-4000-a000-000000000001', 'KATEGORI_OBAT', 'ABTK',  'Antibiotik',       1,  { description: 'Obat pembasmi atau penghambat pertumbuhan bakteri.' });
seed('ed000001-0000-4000-a000-000000000002', 'KATEGORI_OBAT', 'APPS',  'Antiparasit',      2,  { description: 'Obat untuk mengatasi infeksi parasit internal maupun eksternal.' });
seed('ed000001-0000-4000-a000-000000000003', 'KATEGORI_OBAT', 'VIT',   'Vitamin',          3,  { description: 'Suplemen vitamin untuk mendukung fungsi metabolisme.' });
seed('ed000001-0000-4000-a000-000000000004', 'KATEGORI_OBAT', 'VKS',   'Vaksin',           4,  { description: 'Produk imunisasi terhadap penyakit infeksius.' });
seed('ed000001-0000-4000-a000-000000000005', 'KATEGORI_OBAT', 'ASPT',  'Antiseptik',       5,  { description: 'Produk pembunuh kuman untuk penggunaan luar (topikal).' });
seed('ed000001-0000-4000-a000-000000000006', 'KATEGORI_OBAT', 'AINF',  'Anti-inflamasi',   6,  { description: 'Obat penurun peradangan dan nyeri (NSAID/steroid).' });
seed('ed000001-0000-4000-a000-000000000007', 'KATEGORI_OBAT', 'HRM',   'Hormon',           7,  { description: 'Preparat hormon untuk pengobatan atau sinkronisasi reproduksi.' });
seed('ed000001-0000-4000-a000-000000000008', 'KATEGORI_OBAT', 'SUP',   'Suplemen',         8,  { description: 'Suplemen nutrisi, tonik, dan pendukung metabolisme.' });
seed('ed000001-0000-4000-a000-000000000009', 'KATEGORI_OBAT', 'LAIN',  'Lainnya',          9,  { description: 'Kategori obat lain yang tidak termasuk di atas.' });

// ── PRODUK KOMERSIAL ──────────────────────────────────────────────────────────
// Kategori induk produk komersial — representatif.
seed('ee000001-0000-4000-a000-000000000001', 'PRODUK_KOMERSIAL', 'PKN',  'Konsentrat Pakan',   1,  { category: 'Pakan',      description: 'Produk konsentrat pakan ternak bermerek komersial.' });
seed('ee000001-0000-4000-a000-000000000002', 'PRODUK_KOMERSIAL', 'PKS',  'Suplemen Pakan',     2,  { category: 'Pakan',      description: 'Suplemen dan feed additive komersial.' });
seed('ee000001-0000-4000-a000-000000000003', 'PRODUK_KOMERSIAL', 'OBT',  'Obat Hewan',         3,  { category: 'Kesehatan',  description: 'Produk obat hewan bermerek komersial.' });
seed('ee000001-0000-4000-a000-000000000004', 'PRODUK_KOMERSIAL', 'PRL',  'Peralatan',          4,  { category: 'Peralatan',  description: 'Peralatan dan perlengkapan kandang komersial.' });

// ── MARKETPLACE CATEGORY ──────────────────────────────────────────────────────
// Matches KATEGORI_MARKETPLACE in src/data/marketplaceKategoriData.ts
seed('ef000001-0000-4000-a000-000000000001', 'MARKETPLACE_CATEGORY', 'TRN',   'Ternak',              1,  { description: 'Jual beli ternak hidup — sapi, kambing, domba, dan lainnya.' });
seed('ef000001-0000-4000-a000-000000000002', 'MARKETPLACE_CATEGORY', 'PKN',   'Pakan',              2,  { description: 'Pakan dan bahan baku pakan ternak.' });
seed('ef000001-0000-4000-a000-000000000003', 'MARKETPLACE_CATEGORY', 'OBT',   'Obat & Kesehatan',   3,  { description: 'Obat, vaksin, dan produk kesehatan hewan.' });
seed('ef000001-0000-4000-a000-000000000004', 'MARKETPLACE_CATEGORY', 'PRL',   'Peralatan',          4,  { description: 'Peralatan dan perlengkapan kandang peternakan.' });
seed('ef000001-0000-4000-a000-000000000005', 'MARKETPLACE_CATEGORY', 'TRP',   'Transportasi',       5,  { description: 'Jasa angkut ternak antar lokasi.' });
seed('ef000001-0000-4000-a000-000000000006', 'MARKETPLACE_CATEGORY', 'DRH',   'Dokter Hewan',       6,  { description: 'Layanan dokter hewan panggilan atau praktek.' });
seed('ef000001-0000-4000-a000-000000000007', 'MARKETPLACE_CATEGORY', 'KLH',   'Klinik Hewan',       7,  { description: 'Layanan klinik dan rumah sakit hewan.' });
seed('ef000001-0000-4000-a000-000000000008', 'MARKETPLACE_CATEGORY', 'BJH',   'Bibit Hijauan',      8,  { description: 'Benih dan bibit tanaman hijauan pakan.' });
seed('ef000001-0000-4000-a000-000000000009', 'MARKETPLACE_CATEGORY', 'JSP',   'Jasa Peternakan',    9,  { description: 'Jasa konsultasi, manajemen, dan layanan peternakan.' });
seed('ef000001-0000-4000-a000-000000000010', 'MARKETPLACE_CATEGORY', 'LAIN',  'Lainnya',           99,  { description: 'Kategori marketplace lainnya.' });

// ── MARKETPLACE STATUS ────────────────────────────────────────────────────────
// Matches ListingStatus in src/data/marketplaceListingData.ts
seed('f0000001-0000-4000-a000-000000000001', 'MARKETPLACE_STATUS', 'DFT',  'Draft',          1,  { description: 'Listing belum dipublikasikan — masih dalam penyusunan.' });
seed('f0000001-0000-4000-a000-000000000002', 'MARKETPLACE_STATUS', 'AKT',  'Aktif',          2,  { description: 'Listing aktif dan terlihat oleh calon pembeli.' });
seed('f0000001-0000-4000-a000-000000000003', 'MARKETPLACE_STATUS', 'DTH',  'Ditahan',        3,  { description: 'Listing ditahan menunggu verifikasi atau penyelesaian transaksi.' });
seed('f0000001-0000-4000-a000-000000000004', 'MARKETPLACE_STATUS', 'TJL',  'Terjual',        4,  { description: 'Produk/ternak telah berhasil terjual.' });
seed('f0000001-0000-4000-a000-000000000005', 'MARKETPLACE_STATUS', 'DTT',  'Ditutup',        5,  { description: 'Listing ditutup oleh penjual.' });
seed('f0000001-0000-4000-a000-000000000006', 'MARKETPLACE_STATUS', 'ARS',  'Diarsipkan',     6,  { description: 'Listing diarsipkan — tidak terlihat publik tetapi masih tersimpan.' });

// ── ESCROW STATUS ─────────────────────────────────────────────────────────────
// Matches EscrowStatus in src/data/transaksiEscrowData.ts
seed('f1000001-0000-4000-a000-000000000001', 'ESCROW_STATUS', 'WPY',  'Waiting Payment',               1,  { description: 'Menunggu pembayaran dari Buyer ke rekening Escrow.' });
seed('f1000001-0000-4000-a000-000000000002', 'ESCROW_STATUS', 'HLD',  'Holding Fund',                  2,  { description: 'Dana diterima dan ditahan oleh Escrow.' });
seed('f1000001-0000-4000-a000-000000000003', 'ESCROW_STATUS', 'DLV',  'Delivery',                      3,  { description: 'Proses pengiriman atau serah terima ternak sedang berjalan.' });
seed('f1000001-0000-4000-a000-000000000004', 'ESCROW_STATUS', 'WCF',  'Waiting Confirmation',          4,  { description: 'Menunggu konfirmasi penerimaan dari Buyer.' });
seed('f1000001-0000-4000-a000-000000000005', 'ESCROW_STATUS', 'DSP',  'Dispute',                       5,  { description: 'Terdapat sengketa antara Buyer dan Seller.' });
seed('f1000001-0000-4000-a000-000000000006', 'ESCROW_STATUS', 'WTF',  'Waiting Transfer',              6,  { description: 'Menunggu transfer dana ke Seller.' });
seed('f1000001-0000-4000-a000-000000000007', 'ESCROW_STATUS', 'TFP',  'Transfer Processing',           7,  { description: 'Proses transfer dana ke Seller sedang berjalan.' });
seed('f1000001-0000-4000-a000-000000000008', 'ESCROW_STATUS', 'WRC',  'Waiting Receiver Confirmation', 8,  { description: 'Menunggu konfirmasi penerimaan dana oleh Seller.' });
seed('f1000001-0000-4000-a000-000000000009', 'ESCROW_STATUS', 'CMP',  'Completed',                     9,  { description: 'Transaksi escrow selesai — dana telah diterima Seller.' });
seed('f1000001-0000-4000-a000-000000000010', 'ESCROW_STATUS', 'CXL',  'Cancelled',                    10,  { description: 'Transaksi dibatalkan dan dana dikembalikan ke Buyer.' });

// ── TRANSACTION STATUS ────────────────────────────────────────────────────────
// Matches TransaksiStatus in src/data/marketplaceTransaksiData.ts + lifecycle
seed('f2000001-0000-4000-a000-000000000001', 'TRANSACTION_STATUS', 'PND',  'Pending',       1,  { description: 'Transaksi menunggu konfirmasi penjual.' });
seed('f2000001-0000-4000-a000-000000000002', 'TRANSACTION_STATUS', 'AKT',  'Aktif',         2,  { description: 'Transaksi sedang berjalan.' });
seed('f2000001-0000-4000-a000-000000000003', 'TRANSACTION_STATUS', 'SEL',  'Selesai',       3,  { description: 'Transaksi berhasil diselesaikan.' });
seed('f2000001-0000-4000-a000-000000000004', 'TRANSACTION_STATUS', 'BTL',  'Dibatalkan',    4,  { description: 'Transaksi dibatalkan sebelum selesai.' });
seed('f2000001-0000-4000-a000-000000000005', 'TRANSACTION_STATUS', 'DSP',  'Dispute',       5,  { description: 'Transaksi dalam kondisi sengketa.' });
seed('f2000001-0000-4000-a000-000000000006', 'TRANSACTION_STATUS', 'RFD',  'Refund',        6,  { description: 'Dana dikembalikan ke pembeli.' });

// ── NOTIFICATION TYPE ─────────────────────────────────────────────────────────
seed('f3000001-0000-4000-a000-000000000001', 'NOTIFICATION_TYPE', 'INFO',  'Informasi',     1,  { description: 'Notifikasi umum bersifat informasional.' });
seed('f3000001-0000-4000-a000-000000000002', 'NOTIFICATION_TYPE', 'WARN',  'Peringatan',    2,  { description: 'Notifikasi peringatan yang memerlukan perhatian.' });
seed('f3000001-0000-4000-a000-000000000003', 'NOTIFICATION_TYPE', 'CRIT',  'Kritis',        3,  { description: 'Notifikasi darurat — memerlukan tindakan segera.' });
seed('f3000001-0000-4000-a000-000000000004', 'NOTIFICATION_TYPE', 'SUCC',  'Sukses',        4,  { description: 'Notifikasi keberhasilan suatu proses atau tindakan.' });
seed('f3000001-0000-4000-a000-000000000005', 'NOTIFICATION_TYPE', 'RMD',   'Pengingat',     5,  { description: 'Notifikasi pengingat jadwal atau tenggat waktu.' });
seed('f3000001-0000-4000-a000-000000000006', 'NOTIFICATION_TYPE', 'TRX',   'Transaksi',     6,  { description: 'Notifikasi terkait aktivitas transaksi di marketplace.' });
seed('f3000001-0000-4000-a000-000000000007', 'NOTIFICATION_TYPE', 'SYS',   'Sistem',        7,  { description: 'Notifikasi dari sistem (pembaruan, maintenance, dll).' });
seed('f3000001-0000-4000-a000-000000000008', 'NOTIFICATION_TYPE', 'ESC',   'Escrow',        8,  { description: 'Notifikasi terkait proses Escrow (dana ditahan/dilepas).' });
seed('f3000001-0000-4000-a000-000000000009', 'NOTIFICATION_TYPE', 'MKT',   'Marketplace',   9,  { description: 'Notifikasi aktivitas Marketplace (listing, penawaran, dll).' });
seed('f3000001-0000-4000-a000-000000000010', 'NOTIFICATION_TYPE', 'LVS',   'Livestock',    10,  { description: 'Notifikasi terkait ternak (kesehatan, bobot, jadwal).' });
seed('f3000001-0000-4000-a000-000000000011', 'NOTIFICATION_TYPE', 'FED',   'Feed',         11,  { description: 'Notifikasi stok pakan dan pemberian pakan.' });
seed('f3000001-0000-4000-a000-000000000012', 'NOTIFICATION_TYPE', 'MED',   'Medicine',     12,  { description: 'Notifikasi stok obat, jadwal pemberian, dan kadaluarsa.' });
seed('f3000001-0000-4000-a000-000000000013', 'NOTIFICATION_TYPE', 'HLT',   'Health',       13,  { description: 'Notifikasi kesehatan hewan (pemeriksaan, diagnosa, dll).' });
seed('f3000001-0000-4000-a000-000000000014', 'NOTIFICATION_TYPE', 'AII',   'AI Insight',   14,  { description: 'Notifikasi dari AI Insight engine (insight baru, rekomendasi).' });
seed('f3000001-0000-4000-a000-000000000015', 'NOTIFICATION_TYPE', 'VRF',   'Verification', 15,  { description: 'Notifikasi verifikasi identitas, workspace, atau dokumen.' });
seed('f3000001-0000-4000-a000-000000000016', 'NOTIFICATION_TYPE', 'AUD',   'Audit',        16,  { description: 'Notifikasi aktivitas audit trail dan jejak perubahan data.' });

// ── AI INSIGHT TYPE ───────────────────────────────────────────────────────────
// Matches InsightItem severity levels across AI insight modules
seed('f4000001-0000-4000-a000-000000000001', 'AI_INSIGHT_TYPE', 'CRIT',  'Critical',        1,  { description: 'Insight kritis — memerlukan tindakan segera.' });
seed('f4000001-0000-4000-a000-000000000002', 'AI_INSIGHT_TYPE', 'HIGH',  'High',            2,  { description: 'Insight penting — perlu penanganan dalam waktu dekat.' });
seed('f4000001-0000-4000-a000-000000000003', 'AI_INSIGHT_TYPE', 'MED',   'Medium',          3,  { description: 'Insight sedang — direkomendasikan untuk ditindaklanjuti.' });
seed('f4000001-0000-4000-a000-000000000004', 'AI_INSIGHT_TYPE', 'LOW',   'Low',             4,  { description: 'Insight rendah — catatan untuk dipantau.' });
seed('f4000001-0000-4000-a000-000000000005', 'AI_INSIGHT_TYPE', 'INF',   'Information',     5,  { description: 'Insight informasional — tidak memerlukan tindakan langsung.' });

// ── BUSINESS TYPE ─────────────────────────────────────────────────────────────
// Matches jenis values in src/data/workspaceManagementData.ts
seed('f5000001-0000-4000-a000-000000000001', 'BUSINESS_TYPE', 'PTK',  'Peternakan',              1,  { description: 'Usaha peternakan mandiri atau kelompok ternak.' });
seed('f5000001-0000-4000-a000-000000000002', 'BUSINESS_TYPE', 'KOP',  'Koperasi',                2,  { description: 'Koperasi peternak atau kelompok tani ternak.' });
seed('f5000001-0000-4000-a000-000000000003', 'BUSINESS_TYPE', 'DST',  'Distributor',             3,  { description: 'Distributor pakan, obat, atau ternak.' });
seed('f5000001-0000-4000-a000-000000000004', 'BUSINESS_TYPE', 'AGR',  'Agribisnis',              4,  { description: 'Usaha agribisnis terintegrasi hulu-hilir.' });
seed('f5000001-0000-4000-a000-000000000005', 'BUSINESS_TYPE', 'KNS',  'Konsultan',               5,  { description: 'Layanan konsultasi peternakan dan kesehatan hewan.' });
seed('f5000001-0000-4000-a000-000000000006', 'BUSINESS_TYPE', 'IND',  'Individu/Peternak Mandiri', 6, { description: 'Peternak perorangan tanpa badan usaha formal.' });

// ── TRANSPORT TYPE ────────────────────────────────────────────────────────────
// Matches jenisKendaraan values in src/data/layananTransportData.ts
seed('f6000001-0000-4000-a000-000000000001', 'TRANSPORT_TYPE', 'TKT',  'Truk Ternak Tertutup',    1,  { description: 'Kendaraan bak tertutup khusus angkut ternak, sirkulasi udara baik.' });
seed('f6000001-0000-4000-a000-000000000002', 'TRANSPORT_TYPE', 'PBT',  'Pick-up Bak Terbuka',     2,  { description: 'Kendaraan pickup untuk ternak berukuran kecil-sedang.' });
seed('f6000001-0000-4000-a000-000000000003', 'TRANSPORT_TYPE', 'TRP',  'Truk Pickup',             3,  { description: 'Truk pickup serbaguna untuk jarak menengah.' });
seed('f6000001-0000-4000-a000-000000000004', 'TRANSPORT_TYPE', 'TBB',  'Truk Ternak Besar',       4,  { description: 'Truk berkapasitas besar untuk pengiriman jarak jauh.' });
seed('f6000001-0000-4000-a000-000000000005', 'TRANSPORT_TYPE', 'CRG',  'Cargo/Kontainer',         5,  { description: 'Pengiriman menggunakan kontainer cargo (ekspedisi).' });
seed('f6000001-0000-4000-a000-000000000006', 'TRANSPORT_TYPE', 'MTR',  'Motor/Roda Tiga',         6,  { description: 'Kendaraan roda tiga untuk ternak kecil jarak dekat.' });

// ── SATUAN BERAT ─────────────────────────────────────────────────────────────
seed('f7000001-0000-4000-a000-000000000001', 'SATUAN_BERAT', 'MG',   'Miligram',   1,  { description: '1 mg = 0.001 gram. Digunakan untuk dosis obat.' });
seed('f7000001-0000-4000-a000-000000000002', 'SATUAN_BERAT', 'GR',   'Gram',       2,  { description: '1 gram = 0.001 kg.' });
seed('f7000001-0000-4000-a000-000000000003', 'SATUAN_BERAT', 'ONS',  'Ons',        3,  { description: '1 ons = 100 gram (konvensi Indonesia).' });
seed('f7000001-0000-4000-a000-000000000004', 'SATUAN_BERAT', 'KG',   'Kilogram',   4,  { description: 'Satuan berat standar untuk pakan dan bobot ternak.' });
seed('f7000001-0000-4000-a000-000000000005', 'SATUAN_BERAT', 'KWN',  'Kwintal',    5,  { description: '1 kwintal = 100 kg.' });
seed('f7000001-0000-4000-a000-000000000006', 'SATUAN_BERAT', 'TON',  'Ton',        6,  { description: '1 ton = 1.000 kg.' });

// ── SATUAN VOLUME ─────────────────────────────────────────────────────────────
seed('f8000001-0000-4000-a000-000000000001', 'SATUAN_VOLUME', 'ML',   'Mililiter',    1,  { description: '1 ml = 0.001 liter. Digunakan untuk dosis obat cair.' });
seed('f8000001-0000-4000-a000-000000000002', 'SATUAN_VOLUME', 'CC',   'cc',           2,  { description: '1 cc = 1 ml. Umum digunakan di konteks veteriner.' });
seed('f8000001-0000-4000-a000-000000000003', 'SATUAN_VOLUME', 'LTR',  'Liter',        3,  { description: 'Satuan volume standar untuk pakan cair dan obat.' });
seed('f8000001-0000-4000-a000-000000000004', 'SATUAN_VOLUME', 'M3',   'Meter Kubik',  4,  { description: '1 m³ = 1.000 liter. Untuk kapasitas tangki atau silo besar.' });

// ── SATUAN PANJANG ────────────────────────────────────────────────────────────
seed('f9000001-0000-4000-a000-000000000001', 'SATUAN_PANJANG', 'MM',  'Milimeter',    1,  { description: '1 mm = 0.001 meter.' });
seed('f9000001-0000-4000-a000-000000000002', 'SATUAN_PANJANG', 'CM',  'Sentimeter',   2,  { description: '1 cm = 0.01 meter. Digunakan untuk pengukuran kandang.' });
seed('f9000001-0000-4000-a000-000000000003', 'SATUAN_PANJANG', 'M',   'Meter',        3,  { description: 'Satuan panjang standar.' });
seed('f9000001-0000-4000-a000-000000000004', 'SATUAN_PANJANG', 'KM',  'Kilometer',    4,  { description: 'Digunakan untuk jarak pengiriman/lokasi.' });

// ── MATA UANG ─────────────────────────────────────────────────────────────────
seed('fa000001-0000-4000-a000-000000000001', 'MATA_UANG', 'IDR', 'Rupiah (IDR)',        1,  { description: 'Mata uang resmi Indonesia. Simbol: Rp.' });
seed('fa000001-0000-4000-a000-000000000002', 'MATA_UANG', 'USD', 'US Dollar (USD)',     2,  { description: 'Mata uang Amerika Serikat. Simbol: $.' });
seed('fa000001-0000-4000-a000-000000000003', 'MATA_UANG', 'SGD', 'Singapore Dollar',    3,  { description: 'Mata uang Singapura. Simbol: S$.' });

// ── LOKASI REFERENSI ──────────────────────────────────────────────────────────
// Level 1: Pulau/Region
seed('fb000001-0000-4000-a000-000000000001', 'LOKASI_REFERENSI', 'JW',   'Jawa',                    1,  { category: 'Pulau', description: 'Pulau Jawa beserta seluruh provinsinya.' });
seed('fb000001-0000-4000-a000-000000000002', 'LOKASI_REFERENSI', 'SM',   'Sumatera',                2,  { category: 'Pulau', description: 'Pulau Sumatera beserta seluruh provinsinya.' });
seed('fb000001-0000-4000-a000-000000000003', 'LOKASI_REFERENSI', 'KL',   'Kalimantan',              3,  { category: 'Pulau', description: 'Pulau Kalimantan beserta seluruh provinsinya.' });
seed('fb000001-0000-4000-a000-000000000004', 'LOKASI_REFERENSI', 'SL',   'Sulawesi',                4,  { category: 'Pulau', description: 'Pulau Sulawesi beserta seluruh provinsinya.' });
seed('fb000001-0000-4000-a000-000000000005', 'LOKASI_REFERENSI', 'PP',   'Papua',                   5,  { category: 'Pulau', description: 'Pulau Papua (Papua dan Papua Barat).' });
seed('fb000001-0000-4000-a000-000000000006', 'LOKASI_REFERENSI', 'BA',   'Bali',                    6,  { category: 'Pulau', description: 'Pulau Bali — Provinsi Bali.' });
seed('fb000001-0000-4000-a000-000000000007', 'LOKASI_REFERENSI', 'NTB',  'Nusa Tenggara Barat',     7,  { category: 'Pulau', description: 'NTB — Lombok dan Sumbawa.' });
seed('fb000001-0000-4000-a000-000000000008', 'LOKASI_REFERENSI', 'NTT',  'Nusa Tenggara Timur',     8,  { category: 'Pulau', description: 'NTT — Flores, Timor, Sumba, dan pulau kecil lainnya.' });
seed('fb000001-0000-4000-a000-000000000009', 'LOKASI_REFERENSI', 'MLK',  'Maluku',                  9,  { category: 'Pulau', description: 'Kepulauan Maluku dan Maluku Utara.' });
// Level 2: Provinsi (parent → Jawa)
const _UUID_JAWA = 'fb000001-0000-4000-a000-000000000001';
seed('fb000001-0000-4000-a000-000000000101', 'LOKASI_REFERENSI', 'JB',   'Jawa Barat',             11,  { parentUuid: _UUID_JAWA, category: 'Provinsi' });
seed('fb000001-0000-4000-a000-000000000102', 'LOKASI_REFERENSI', 'JT',   'Jawa Tengah',            12,  { parentUuid: _UUID_JAWA, category: 'Provinsi' });
seed('fb000001-0000-4000-a000-000000000103', 'LOKASI_REFERENSI', 'JTM',  'Jawa Timur',             13,  { parentUuid: _UUID_JAWA, category: 'Provinsi' });
seed('fb000001-0000-4000-a000-000000000104', 'LOKASI_REFERENSI', 'DIY',  'DI Yogyakarta',          14,  { parentUuid: _UUID_JAWA, category: 'Provinsi' });
seed('fb000001-0000-4000-a000-000000000105', 'LOKASI_REFERENSI', 'BNT',  'Banten',                 15,  { parentUuid: _UUID_JAWA, category: 'Provinsi' });
seed('fb000001-0000-4000-a000-000000000106', 'LOKASI_REFERENSI', 'DKI',  'DKI Jakarta',            16,  { parentUuid: _UUID_JAWA, category: 'Provinsi' });
// Level 2: Provinsi (parent → Sumatera)
const _UUID_SUMATERA = 'fb000001-0000-4000-a000-000000000002';
seed('fb000001-0000-4000-a000-000000000201', 'LOKASI_REFERENSI', 'ACH',  'Aceh',                   21,  { parentUuid: _UUID_SUMATERA, category: 'Provinsi' });
seed('fb000001-0000-4000-a000-000000000202', 'LOKASI_REFERENSI', 'SU',   'Sumatera Utara',         22,  { parentUuid: _UUID_SUMATERA, category: 'Provinsi' });
seed('fb000001-0000-4000-a000-000000000203', 'LOKASI_REFERENSI', 'SB',   'Sumatera Barat',         23,  { parentUuid: _UUID_SUMATERA, category: 'Provinsi' });
seed('fb000001-0000-4000-a000-000000000204', 'LOKASI_REFERENSI', 'RI',   'Riau',                   24,  { parentUuid: _UUID_SUMATERA, category: 'Provinsi' });
seed('fb000001-0000-4000-a000-000000000205', 'LOKASI_REFERENSI', 'SS',   'Sumatera Selatan',       25,  { parentUuid: _UUID_SUMATERA, category: 'Provinsi' });
seed('fb000001-0000-4000-a000-000000000206', 'LOKASI_REFERENSI', 'LMP',  'Lampung',                26,  { parentUuid: _UUID_SUMATERA, category: 'Provinsi' });

// ── TRANSACTION STATUS (Global Transaction Service) ────────────────────────────
// Status lifecycle untuk Global Transaction Service (FOUNDATION-004).
// Dibedakan dari entri lama (Pending/Aktif/Selesai/Dibatalkan) yang dipakai
// modul Marketplace lama. Entri baru ini mengikuti spec transaksi global.
// reference_code sengaja di-prefix 'TX-' agar tidak bertabrakan dengan kode lama.
seed('f2000001-0000-4000-a000-000000000011', 'TRANSACTION_STATUS', 'TX-DFT',  'Draft',            11, { description: 'Transaksi dibuat tapi belum diajukan ke penjual.' });
seed('f2000001-0000-4000-a000-000000000012', 'TRANSACTION_STATUS', 'TX-WPY',  'Waiting Payment',  12, { description: 'Menunggu pembayaran dari pembeli.' });
seed('f2000001-0000-4000-a000-000000000013', 'TRANSACTION_STATUS', 'TX-PAID', 'Paid',             13, { description: 'Pembayaran telah diterima dan dikonfirmasi.' });
seed('f2000001-0000-4000-a000-000000000014', 'TRANSACTION_STATUS', 'TX-PROC', 'Processing',       14, { description: 'Transaksi sedang diproses oleh penjual.' });
seed('f2000001-0000-4000-a000-000000000015', 'TRANSACTION_STATUS', 'TX-SHIP', 'Shipped',          15, { description: 'Barang/ternak sudah dikirim.' });
seed('f2000001-0000-4000-a000-000000000016', 'TRANSACTION_STATUS', 'TX-DLVD', 'Delivered',        16, { description: 'Barang/ternak sudah tiba di lokasi pembeli.' });
seed('f2000001-0000-4000-a000-000000000017', 'TRANSACTION_STATUS', 'TX-COMP', 'Completed',        17, { description: 'Transaksi selesai — semua pihak mengkonfirmasi.' });
seed('f2000001-0000-4000-a000-000000000018', 'TRANSACTION_STATUS', 'TX-CXLD', 'Cancelled',        18, { description: 'Transaksi dibatalkan sebelum selesai.' });
seed('f2000001-0000-4000-a000-000000000019', 'TRANSACTION_STATUS', 'TX-RFND', 'Refunded',         19, { description: 'Dana dikembalikan ke pembeli.' });
seed('f2000001-0000-4000-a000-000000000020', 'TRANSACTION_STATUS', 'TX-DSPT', 'Disputed',         20, { description: 'Terdapat sengketa antara pembeli dan penjual.' });

// ── PAYMENT METHOD ────────────────────────────────────────────────────────────
// Metode pembayaran yang didukung oleh Global Transaction Service.
seed('fc000001-0000-4000-a000-000000000001', 'PAYMENT_METHOD', 'TB',   'Transfer Bank',         1, { description: 'Transfer antar rekening bank.' });
seed('fc000001-0000-4000-a000-000000000002', 'PAYMENT_METHOD', 'QRIS', 'QRIS',                  2, { description: 'Pembayaran via QR Code standar QRIS (BI).' });
seed('fc000001-0000-4000-a000-000000000003', 'PAYMENT_METHOD', 'VA',   'Virtual Account',       3, { description: 'Pembayaran melalui nomor Virtual Account.' });
seed('fc000001-0000-4000-a000-000000000004', 'PAYMENT_METHOD', 'DD',   'Dompet Digital',        4, { description: 'Pembayaran via dompet digital (GoPay, OVO, Dana, dll).' });
seed('fc000001-0000-4000-a000-000000000005', 'PAYMENT_METHOD', 'COD',  'COD/Tunai',             5, { description: 'Pembayaran tunai saat serah terima (Cash on Delivery).' });
seed('fc000001-0000-4000-a000-000000000006', 'PAYMENT_METHOD', 'ESC',  'Escrow',                6, { description: 'Pembayaran melalui layanan Escrow TernakHub.' });

// ── TRANSACTION TYPE ──────────────────────────────────────────────────────────
// Jenis transaksi yang didukung oleh Global Transaction Service.
// Persiapkan untuk ekspansi ke luar Marketplace di masa depan.
seed('fd000001-0000-4000-a000-000000000001', 'TRANSACTION_TYPE', 'MKT-TRN',  'Marketplace Livestock',  1, { category: 'Marketplace', description: 'Jual beli ternak hidup via Marketplace.' });
seed('fd000001-0000-4000-a000-000000000002', 'TRANSACTION_TYPE', 'MKT-PKN',  'Marketplace Feed',       2, { category: 'Marketplace', description: 'Pembelian pakan dan bahan pakan via Marketplace.' });
seed('fd000001-0000-4000-a000-000000000003', 'TRANSACTION_TYPE', 'MKT-OBT',  'Marketplace Medicine',   3, { category: 'Marketplace', description: 'Pembelian obat dan produk kesehatan via Marketplace.' });
seed('fd000001-0000-4000-a000-000000000004', 'TRANSACTION_TYPE', 'MKT-TRP',  'Marketplace Transport',  4, { category: 'Marketplace', description: 'Pemesanan jasa angkut ternak via Marketplace.' });
seed('fd000001-0000-4000-a000-000000000005', 'TRANSACTION_TYPE', 'MKT-SVC',  'Marketplace Service',    5, { category: 'Marketplace', description: 'Pemesanan jasa peternakan via Marketplace.' });

// ── PAYMENT STATUS (Global Escrow Service) ─────────────────────────────────────
// Status pembayaran dalam konteks Escrow — terpisah dari ESCROW_STATUS.
seed('fe000001-0000-4000-a000-000000000001', 'PAYMENT_STATUS', 'PAY-UPD',  'Unpaid',     1, { description: 'Belum ada pembayaran dari Buyer.' });
seed('fe000001-0000-4000-a000-000000000002', 'PAYMENT_STATUS', 'PAY-PND',  'Pending',    2, { description: 'Pembayaran sedang diproses / menunggu konfirmasi.' });
seed('fe000001-0000-4000-a000-000000000003', 'PAYMENT_STATUS', 'PAY-CNF',  'Confirmed',  3, { description: 'Pembayaran telah dikonfirmasi diterima oleh Escrow.' });
seed('fe000001-0000-4000-a000-000000000004', 'PAYMENT_STATUS', 'PAY-FAL',  'Failed',     4, { description: 'Pembayaran gagal — transaksi tidak berhasil diproses.' });
seed('fe000001-0000-4000-a000-000000000005', 'PAYMENT_STATUS', 'PAY-RFD',  'Refunded',   5, { description: 'Dana telah dikembalikan ke Buyer.' });
seed('fe000001-0000-4000-a000-000000000006', 'PAYMENT_STATUS', 'PAY-EXP',  'Expired',    6, { description: 'Waktu pembayaran habis sebelum Buyer melunasi.' });

// ── DISPUTE STATUS (Global Escrow Service) ────────────────────────────────────
// Status sengketa dalam konteks Escrow.
seed('ff000001-0000-4000-a000-000000000001', 'DISPUTE_STATUS', 'DSP-NON',  'None',         1, { description: 'Tidak ada sengketa — status normal.' });
seed('ff000001-0000-4000-a000-000000000002', 'DISPUTE_STATUS', 'DSP-OPN',  'Open',         2, { description: 'Sengketa dibuka oleh salah satu pihak.' });
seed('ff000001-0000-4000-a000-000000000003', 'DISPUTE_STATUS', 'DSP-REV',  'Under Review', 3, { description: 'Sengketa sedang ditinjau oleh mediator / Admin.' });
seed('ff000001-0000-4000-a000-000000000004', 'DISPUTE_STATUS', 'DSP-RSL',  'Resolved',     4, { description: 'Sengketa telah diselesaikan dengan resolusi.' });
seed('ff000001-0000-4000-a000-000000000005', 'DISPUTE_STATUS', 'DSP-ESC',  'Escalated',    5, { description: 'Sengketa dieskalasi ke pihak yang lebih tinggi.' });
seed('ff000001-0000-4000-a000-000000000006', 'DISPUTE_STATUS', 'DSP-CLS',  'Closed',       6, { description: 'Sengketa ditutup (diselesaikan atau tidak dilanjutkan).' });

// ── ESCROW PROVIDER TYPE ───────────────────────────────────────────────────────
// Jenis provider rekening bersama / escrow pihak ketiga.
seed('a3000001-0000-4000-a000-000000000001', 'ESCROW_PROVIDER_TYPE', 'PRV-INT',  'Internal Mock',       1, { description: 'Provider simulasi internal TernakHub (development/staging).' });
seed('a3000001-0000-4000-a000-000000000002', 'ESCROW_PROVIDER_TYPE', 'PRV-RKB',  'Rekening Bersama',    2, { description: 'Layanan Rekening Bersama pihak ketiga (BERSAMA, dll).' });
seed('a3000001-0000-4000-a000-000000000003', 'ESCROW_PROVIDER_TYPE', 'PRV-PGW',  'Payment Gateway',     3, { description: 'Payment Gateway yang mendukung fitur escrow (Midtrans, dll).' });
seed('a3000001-0000-4000-a000-000000000004', 'ESCROW_PROVIDER_TYPE', 'PRV-BNK',  'Bank',                4, { description: 'Layanan escrow yang dikelola langsung oleh bank.' });
seed('a3000001-0000-4000-a000-000000000005', 'ESCROW_PROVIDER_TYPE', 'PRV-MKT',  'Marketplace Partner', 5, { description: 'Escrow yang dikelola oleh mitra Marketplace.' });

// ── CONVERSATION TYPE (Global Conversation Service) ────────────────────────────
seed('a4000001-0000-4000-a000-000000000001', 'CONVERSATION_TYPE', 'CVT-MKT', 'Marketplace',    1, { description: 'Percakapan antara Buyer dan Seller untuk transaksi Marketplace.' });
seed('a4000001-0000-4000-a000-000000000002', 'CONVERSATION_TYPE', 'CVT-ESC', 'Escrow',          2, { description: 'Percakapan dalam konteks proses Escrow.' });
seed('a4000001-0000-4000-a000-000000000003', 'CONVERSATION_TYPE', 'CVT-SUP', 'Support',         3, { description: 'Percakapan dengan tim Support TernakHub.' });
seed('a4000001-0000-4000-a000-000000000004', 'CONVERSATION_TYPE', 'CVT-TRP', 'Transport',       4, { description: 'Percakapan dalam konteks layanan angkut ternak.' });
seed('a4000001-0000-4000-a000-000000000005', 'CONVERSATION_TYPE', 'CVT-VET', 'Veterinary',      5, { description: 'Percakapan dengan dokter hewan / klinik hewan.' });
seed('a4000001-0000-4000-a000-000000000006', 'CONVERSATION_TYPE', 'CVT-INT', 'Internal Note',   6, { description: 'Catatan internal antar pengguna dalam satu workspace.' });

// ── CONVERSATION STATUS ────────────────────────────────────────────────────────
seed('a6000001-0000-4000-a000-000000000001', 'CONVERSATION_STATUS', 'CVS-ACT', 'Active',   1, { description: 'Percakapan masih berjalan dan aktif.' });
seed('a6000001-0000-4000-a000-000000000002', 'CONVERSATION_STATUS', 'CVS-CLS', 'Closed',   2, { description: 'Percakapan telah ditutup — tidak dapat mengirim pesan baru.' });
seed('a6000001-0000-4000-a000-000000000003', 'CONVERSATION_STATUS', 'CVS-ARC', 'Archived', 3, { description: 'Percakapan diarsipkan untuk keperluan audit.' });

// ── MESSAGE TYPE ──────────────────────────────────────────────────────────────
seed('a5000001-0000-4000-a000-000000000001', 'MESSAGE_TYPE', 'MSG-TXT', 'Text',        1, { description: 'Pesan teks biasa.' });
seed('a5000001-0000-4000-a000-000000000002', 'MESSAGE_TYPE', 'MSG-IMG', 'Image',       2, { description: 'Pesan berupa gambar / foto.' });
seed('a5000001-0000-4000-a000-000000000003', 'MESSAGE_TYPE', 'MSG-DOC', 'Document',    3, { description: 'Pesan berupa dokumen (PDF, Word, dll).' });
seed('a5000001-0000-4000-a000-000000000004', 'MESSAGE_TYPE', 'MSG-EVD', 'Evidence',    4, { description: 'Pesan yang melampirkan Evidence dari Global Evidence Service.' });
seed('a5000001-0000-4000-a000-000000000005', 'MESSAGE_TYPE', 'MSG-SYS', 'System',      5, { description: 'Pesan otomatis dari sistem (status berubah, reminder, dll).' });
seed('a5000001-0000-4000-a000-000000000006', 'MESSAGE_TYPE', 'MSG-TRX', 'Transaction', 6, { description: 'Pesan yang merujuk pada event transaksi.' });
seed('a5000001-0000-4000-a000-000000000007', 'MESSAGE_TYPE', 'MSG-ESC', 'Escrow',      7, { description: 'Pesan yang merujuk pada event Escrow.' });

// ── PARTICIPANT ROLE ──────────────────────────────────────────────────────────
seed('a7000001-0000-4000-a000-000000000001', 'PARTICIPANT_ROLE', 'PRT-BYR', 'Buyer',        1, { description: 'Peserta sebagai pembeli.' });
seed('a7000001-0000-4000-a000-000000000002', 'PARTICIPANT_ROLE', 'PRT-SLR', 'Seller',       2, { description: 'Peserta sebagai penjual.' });
seed('a7000001-0000-4000-a000-000000000003', 'PARTICIPANT_ROLE', 'PRT-SUP', 'Support',      3, { description: 'Peserta dari tim Support TernakHub.' });
seed('a7000001-0000-4000-a000-000000000004', 'PARTICIPANT_ROLE', 'PRT-ADM', 'Admin',        4, { description: 'Peserta sebagai Admin / Moderator.' });
seed('a7000001-0000-4000-a000-000000000005', 'PARTICIPANT_ROLE', 'PRT-OBS', 'Observer',     5, { description: 'Peserta sebagai pengamat — bisa membaca, tidak bisa mengirim.' });
seed('a7000001-0000-4000-a000-000000000006', 'PARTICIPANT_ROLE', 'PRT-SYS', 'System',       6, { description: 'Pesan otomatis dikirim oleh sistem.' });
seed('a7000001-0000-4000-a000-000000000007', 'PARTICIPANT_ROLE', 'PRT-VET', 'Veterinarian', 7, { description: 'Peserta sebagai dokter hewan.' });
seed('a7000001-0000-4000-a000-000000000008', 'PARTICIPANT_ROLE', 'PRT-DRV', 'Driver',       8, { description: 'Peserta sebagai pengemudi / kurir ternak.' });

// ── INSIGHT TYPE ──────────────────────────────────────────────────────────────
// Jenis insight yang dihasilkan Global AI Insight Engine (FOUNDATION-013).
seed('ba000001-0000-4000-a000-000000000001', 'INSIGHT_TYPE', 'IT-NTR',  'Nutrition Insight',     1,  { category: 'Feed',         description: 'Analisis kecukupan dan komposisi nutrisi pakan ternak.' });
seed('ba000001-0000-4000-a000-000000000002', 'INSIGHT_TYPE', 'IT-WGT',  'Weight Insight',        2,  { category: 'Livestock',    description: 'Analisis tren bobot dan pencapaian target berat ternak.' });
seed('ba000001-0000-4000-a000-000000000003', 'INSIGHT_TYPE', 'IT-GRW',  'Growth Insight',        3,  { category: 'Livestock',    description: 'Analisis laju pertumbuhan dan Average Daily Gain ternak.' });
seed('ba000001-0000-4000-a000-000000000004', 'INSIGHT_TYPE', 'IT-HLT',  'Health Insight',        4,  { category: 'Health',       description: 'Analisis pola kesehatan, risiko penyakit, dan tren kondisi ternak.' });
seed('ba000001-0000-4000-a000-000000000005', 'INSIGHT_TYPE', 'IT-MED',  'Medicine Insight',      5,  { category: 'Medicine',     description: 'Analisis penggunaan obat, efektivitas terapi, dan stok medis.' });
seed('ba000001-0000-4000-a000-000000000006', 'INSIGHT_TYPE', 'IT-MKT',  'Marketplace Insight',   6,  { category: 'Marketplace',  description: 'Analisis performa listing, demand, dan peluang pasar.' });
seed('ba000001-0000-4000-a000-000000000007', 'INSIGHT_TYPE', 'IT-PRC',  'Price Insight',         7,  { category: 'Marketplace',  description: 'Analisis tren harga, perbandingan pasar, dan rekomendasi penetapan harga.' });
seed('ba000001-0000-4000-a000-000000000008', 'INSIGHT_TYPE', 'IT-FDC',  'Feed Cost Insight',     8,  { category: 'Feed',         description: 'Analisis efisiensi biaya pakan dan feed conversion ratio.' });
seed('ba000001-0000-4000-a000-000000000009', 'INSIGHT_TYPE', 'IT-INV',  'Inventory Insight',     9,  { category: 'Stock',        description: 'Analisis stok pakan/obat, prediksi kehabisan, dan reorder point.' });
seed('ba000001-0000-4000-a000-000000000010', 'INSIGHT_TYPE', 'IT-PRD',  'Productivity Insight',  10, { category: 'Livestock',    description: 'Analisis produktivitas ternak, reproduksi, dan output farm.' });
seed('ba000001-0000-4000-a000-000000000011', 'INSIGHT_TYPE', 'IT-TRS',  'Trust Insight',         11, { category: 'Trust',        description: 'Analisis skor kepercayaan entity dan faktor pembentuknya.' });
seed('ba000001-0000-4000-a000-000000000012', 'INSIGHT_TYPE', 'IT-VRF',  'Verification Insight',  12, { category: 'Verification', description: 'Analisis status verifikasi dan rekomendasi langkah berikutnya.' });
seed('ba000001-0000-4000-a000-000000000013', 'INSIGHT_TYPE', 'IT-FIN',  'Financial Insight',     13, { category: 'Finance',      description: 'Analisis performa keuangan, margin, dan profitabilitas farm.' });
seed('ba000001-0000-4000-a000-000000000014', 'INSIGHT_TYPE', 'IT-RMD',  'Reminder',              14, { category: 'System',       description: 'Pengingat jadwal, jatuh tempo, atau tindakan yang perlu dilakukan.' });
seed('ba000001-0000-4000-a000-000000000015', 'INSIGHT_TYPE', 'IT-WRN',  'Warning',               15, { category: 'System',       description: 'Peringatan kondisi kritis atau anomali yang perlu segera ditangani.' });
seed('ba000001-0000-4000-a000-000000000016', 'INSIGHT_TYPE', 'IT-REC',  'Recommendation',        16, { category: 'System',       description: 'Rekomendasi tindakan berbasis data untuk meningkatkan performa.' });

// ── INSIGHT STATUS ────────────────────────────────────────────────────────────
// Status siklus hidup sebuah insight record.
seed('bb000001-0000-4000-a000-000000000001', 'INSIGHT_STATUS', 'IS-ACT',  'Active',    1,  { description: 'Insight aktif — relevan dan dapat ditampilkan.' });
seed('bb000001-0000-4000-a000-000000000002', 'INSIGHT_STATUS', 'IS-ARC',  'Archived',  2,  { description: 'Insight diarsipkan — tidak muncul di feed aktif.' });
seed('bb000001-0000-4000-a000-000000000003', 'INSIGHT_STATUS', 'IS-EXP',  'Expired',   3,  { description: 'Insight kedaluwarsa — data sudah tidak relevan.' });
seed('bb000001-0000-4000-a000-000000000004', 'INSIGHT_STATUS', 'IS-DSM',  'Dismissed', 4,  { description: 'Insight ditutup/diabaikan oleh pengguna.' });

// ── SEARCH STATUS ─────────────────────────────────────────────────────────────
// Status index entry di Global Search Service (FOUNDATION-012).
seed('b9000001-0000-4000-a000-000000000001', 'SEARCH_STATUS', 'SS-ACT',  'Active',   1,  { description: 'Entry aktif — dapat muncul dalam hasil pencarian.' });
seed('b9000001-0000-4000-a000-000000000002', 'SEARCH_STATUS', 'SS-INA',  'Inactive', 2,  { description: 'Entry nonaktif — dikecualikan dari hasil pencarian.' });
seed('b9000001-0000-4000-a000-000000000003', 'SEARCH_STATUS', 'SS-PND',  'Pending',  3,  { description: 'Entry sedang dalam proses indexing.' });
seed('b9000001-0000-4000-a000-000000000004', 'SEARCH_STATUS', 'SS-RMV',  'Removed',  4,  { description: 'Entry telah dihapus dari index (soft-remove).' });

// ── VERIFICATION TYPE ─────────────────────────────────────────────────────────
// Jenis proses verifikasi — digunakan pada verification_type_reference_uuid.
seed('b7000001-0000-4000-a000-000000000001', 'VERIFICATION_TYPE', 'VT-IDN',  'Identity',    1,  { description: 'Verifikasi identitas pemilik atau pengguna (KTP, NIK, dll).' });
seed('b7000001-0000-4000-a000-000000000002', 'VERIFICATION_TYPE', 'VT-OWN',  'Ownership',   2,  { description: 'Verifikasi kepemilikan ternak atau aset.' });
seed('b7000001-0000-4000-a000-000000000003', 'VERIFICATION_TYPE', 'VT-EVD',  'Evidence',    3,  { description: 'Verifikasi bukti/evidence yang diunggah ke sistem.' });
seed('b7000001-0000-4000-a000-000000000004', 'VERIFICATION_TYPE', 'VT-HLT',  'Health',      4,  { description: 'Verifikasi status kesehatan ternak berdasarkan rekam medis.' });
seed('b7000001-0000-4000-a000-000000000005', 'VERIFICATION_TYPE', 'VT-BRD',  'Breed',       5,  { description: 'Verifikasi ras/breed ternak berdasarkan silsilah dan ciri fisik.' });
seed('b7000001-0000-4000-a000-000000000006', 'VERIFICATION_TYPE', 'VT-MKT',  'Marketplace', 6,  { description: 'Verifikasi listing atau akun penjual di Marketplace.' });
seed('b7000001-0000-4000-a000-000000000007', 'VERIFICATION_TYPE', 'VT-TRX',  'Transaction', 7,  { description: 'Verifikasi kelayakan atau keabsahan transaksi.' });
seed('b7000001-0000-4000-a000-000000000008', 'VERIFICATION_TYPE', 'VT-WS',   'Workspace',   8,  { description: 'Verifikasi workspace peternakan (legalitas usaha, lokasi, dll).' });
seed('b7000001-0000-4000-a000-000000000009', 'VERIFICATION_TYPE', 'VT-DOC',  'Document',    9,  { description: 'Verifikasi dokumen formal (SKKH, sertifikat, perizinan, dll).' });

// ── VERIFICATION STATUS ───────────────────────────────────────────────────────
// Status siklus hidup sebuah proses verifikasi.
seed('b8000001-0000-4000-a000-000000000001', 'VERIFICATION_STATUS', 'VS-PND',  'Pending',    1,  { description: 'Verifikasi dibuat, menunggu proses dimulai.' });
seed('b8000001-0000-4000-a000-000000000002', 'VERIFICATION_STATUS', 'VS-REV',  'In Review',  2,  { description: 'Verifikasi sedang ditinjau oleh verifier.' });
seed('b8000001-0000-4000-a000-000000000003', 'VERIFICATION_STATUS', 'VS-VRF',  'Verified',   3,  { description: 'Verifikasi berhasil — entity dinyatakan valid.' });
seed('b8000001-0000-4000-a000-000000000004', 'VERIFICATION_STATUS', 'VS-RJT',  'Rejected',   4,  { description: 'Verifikasi ditolak — entity tidak memenuhi kriteria.' });
seed('b8000001-0000-4000-a000-000000000005', 'VERIFICATION_STATUS', 'VS-EXP',  'Expired',    5,  { description: 'Verifikasi kedaluwarsa — perlu diperbarui.' });
seed('b8000001-0000-4000-a000-000000000006', 'VERIFICATION_STATUS', 'VS-CXL',  'Cancelled',  6,  { description: 'Verifikasi dibatalkan sebelum selesai.' });

// ── TRUST LEVEL ───────────────────────────────────────────────────────────────
// Level kepercayaan entity — ditentukan dari rentang trust_score (0–100).
// Bukan badge, bukan rating, bukan label promosi.
seed('b5000001-0000-4000-a000-000000000001', 'TRUST_LEVEL', 'TL-1', 'Level 1',  1, { description: 'Trust score 0–19. Data minimal, belum ada riwayat terverifikasi.' });
seed('b5000001-0000-4000-a000-000000000002', 'TRUST_LEVEL', 'TL-2', 'Level 2',  2, { description: 'Trust score 20–39. Data dasar tersedia, konsistensi rendah.' });
seed('b5000001-0000-4000-a000-000000000003', 'TRUST_LEVEL', 'TL-3', 'Level 3',  3, { description: 'Trust score 40–59. Riwayat cukup, sebagian faktor terverifikasi.' });
seed('b5000001-0000-4000-a000-000000000004', 'TRUST_LEVEL', 'TL-4', 'Level 4',  4, { description: 'Trust score 60–79. Data lengkap, konsisten, riwayat solid.' });
seed('b5000001-0000-4000-a000-000000000005', 'TRUST_LEVEL', 'TL-5', 'Level 5',  5, { description: 'Trust score 80–100. Semua faktor terpenuhi secara konsisten.' });

// ── ENTITY TYPE (Trust Engine) ────────────────────────────────────────────────
// Jenis entity yang dapat dihitung trust score-nya oleh Global Trust Engine.
seed('b6000001-0000-4000-a000-000000000001', 'ENTITY_TYPE', 'ENT-WS',  'Workspace',          1, { description: 'Workspace peternakan yang terdaftar di TernakHub.' });
seed('b6000001-0000-4000-a000-000000000002', 'ENTITY_TYPE', 'ENT-FM',  'Farm',               2, { description: 'Unit farm/kandang dalam sebuah workspace.' });
seed('b6000001-0000-4000-a000-000000000003', 'ENTITY_TYPE', 'ENT-LVS', 'Livestock',          3, { description: 'Individu ternak yang terdaftar di sistem.' });
seed('b6000001-0000-4000-a000-000000000004', 'ENTITY_TYPE', 'ENT-LST', 'Marketplace Listing',4, { description: 'Listing produk atau ternak di Marketplace.' });
seed('b6000001-0000-4000-a000-000000000005', 'ENTITY_TYPE', 'ENT-SLR', 'Seller',             5, { description: 'Workspace dalam peran sebagai penjual di Marketplace.' });
seed('b6000001-0000-4000-a000-000000000006', 'ENTITY_TYPE', 'ENT-BYR', 'Buyer',              6, { description: 'Workspace dalam peran sebagai pembeli di Marketplace.' });
seed('b6000001-0000-4000-a000-000000000007', 'ENTITY_TYPE', 'ENT-TRP', 'Transport',          7, { description: 'Penyedia jasa angkut ternak.' });
seed('b6000001-0000-4000-a000-000000000008', 'ENTITY_TYPE', 'ENT-VET', 'Veterinary',         8, { description: 'Dokter hewan atau klinik hewan.' });
seed('b6000001-0000-4000-a000-000000000009', 'ENTITY_TYPE', 'ENT-EVD', 'Evidence',           9,  { description: 'Bukti/evidence yang diunggah dalam suatu proses verifikasi.' });
seed('b6000001-0000-4000-a000-000000000010', 'ENTITY_TYPE', 'ENT-TRX', 'Transaction',       10, { description: 'Transaksi jual-beli atau layanan di dalam platform.' });
// Extended for Global Search Service (FOUNDATION-012)
seed('b6000001-0000-4000-a000-000000000011', 'ENTITY_TYPE', 'ENT-BAT', 'Batch',             11, { description: 'Kelompok/batch ternak yang dikelola bersama.' });
seed('b6000001-0000-4000-a000-000000000012', 'ENTITY_TYPE', 'ENT-FED', 'Feed',              12, { description: 'Referensi bahan pakan (master pakan).' });
seed('b6000001-0000-4000-a000-000000000013', 'ENTITY_TYPE', 'ENT-FFL', 'Feed Formula',      13, { description: 'Formula/ransum pakan yang dirancang untuk ternak.' });
seed('b6000001-0000-4000-a000-000000000014', 'ENTITY_TYPE', 'ENT-FST', 'Feed Stock',        14, { description: 'Stok/inventaris pakan yang tersimpan di gudang.' });
seed('b6000001-0000-4000-a000-000000000015', 'ENTITY_TYPE', 'ENT-MED', 'Medicine',          15, { description: 'Referensi obat atau produk kesehatan hewan (master obat).' });
seed('b6000001-0000-4000-a000-000000000016', 'ENTITY_TYPE', 'ENT-MST', 'Medicine Stock',    16, { description: 'Stok/inventaris obat yang tersimpan.' });
seed('b6000001-0000-4000-a000-000000000017', 'ENTITY_TYPE', 'ENT-CNV', 'Conversation',      17, { description: 'Percakapan/thread antara dua pihak dalam platform.' });
seed('b6000001-0000-4000-a000-000000000018', 'ENTITY_TYPE', 'ENT-NWS', 'News',              18, { description: 'Artikel berita yang dipublikasikan di News & Event.' });
seed('b6000001-0000-4000-a000-000000000019', 'ENTITY_TYPE', 'ENT-EVT', 'Event',             19, { description: 'Event/acara yang dipublikasikan di News & Event.' });

// ── ACTIVITY TYPE ─────────────────────────────────────────────────────────────
// Jenis aktivitas bisnis yang dicatat oleh Global Activity Service (FOUNDATION-009).
// Digunakan pada field activity_type_reference_uuid di ActivityRecord.
seed('b2000001-0000-4000-a000-000000000001', 'ACTIVITY_TYPE', 'ACT-LVR',  'Livestock Registered',          1,  { category: 'Livestock',    description: 'Pendaftaran ternak baru ke dalam sistem.' });
seed('b2000001-0000-4000-a000-000000000002', 'ACTIVITY_TYPE', 'ACT-WTR',  'Weight Recorded',               2,  { category: 'Livestock',    description: 'Pencatatan bobot/berat ternak.' });
seed('b2000001-0000-4000-a000-000000000003', 'ACTIVITY_TYPE', 'ACT-FDR',  'Feed Recorded',                 3,  { category: 'Feed',         description: 'Pencatatan pemberian pakan ternak.' });
seed('b2000001-0000-4000-a000-000000000004', 'ACTIVITY_TYPE', 'ACT-MDR',  'Medicine Recorded',             4,  { category: 'Medicine',     description: 'Pencatatan pemberian obat atau vaksin.' });
seed('b2000001-0000-4000-a000-000000000005', 'ACTIVITY_TYPE', 'ACT-HLR',  'Health Recorded',               5,  { category: 'Health',       description: 'Pencatatan pemeriksaan atau penanganan kesehatan hewan.' });
seed('b2000001-0000-4000-a000-000000000006', 'ACTIVITY_TYPE', 'ACT-MLC',  'Marketplace Listing Created',   6,  { category: 'Marketplace',  description: 'Pembuatan listing baru di Marketplace.' });
seed('b2000001-0000-4000-a000-000000000007', 'ACTIVITY_TYPE', 'ACT-MLU',  'Marketplace Listing Updated',   7,  { category: 'Marketplace',  description: 'Pembaruan listing yang sudah ada di Marketplace.' });
seed('b2000001-0000-4000-a000-000000000008', 'ACTIVITY_TYPE', 'ACT-MTX',  'Marketplace Transaction',       8,  { category: 'Marketplace',  description: 'Aktivitas transaksi jual-beli di Marketplace.' });
seed('b2000001-0000-4000-a000-000000000009', 'ACTIVITY_TYPE', 'ACT-ESU',  'Escrow Updated',                9,  { category: 'Escrow',       description: 'Perubahan status atau data pada proses Escrow.' });
seed('b2000001-0000-4000-a000-000000000010', 'ACTIVITY_TYPE', 'ACT-EVU',  'Evidence Uploaded',            10,  { category: 'Evidence',     description: 'Pengunggahan bukti (foto, video, dokumen) ke sistem.' });
seed('b2000001-0000-4000-a000-000000000011', 'ACTIVITY_TYPE', 'ACT-BTC',  'Batch Created',                11,  { category: 'Batch',        description: 'Pembuatan batch/kelompok ternak baru.' });
seed('b2000001-0000-4000-a000-000000000012', 'ACTIVITY_TYPE', 'ACT-BTU',  'Batch Updated',                12,  { category: 'Batch',        description: 'Pembaruan data atau status batch ternak.' });
seed('b2000001-0000-4000-a000-000000000013', 'ACTIVITY_TYPE', 'ACT-WSU',  'Workspace Updated',            13,  { category: 'Workspace',    description: 'Perubahan data atau pengaturan workspace.' });
seed('b2000001-0000-4000-a000-000000000014', 'ACTIVITY_TYPE', 'ACT-AIG',  'AI Insight Generated',         14,  { category: 'AI',           description: 'Sistem AI menghasilkan insight baru untuk workspace.' });
seed('b2000001-0000-4000-a000-000000000015', 'ACTIVITY_TYPE', 'ACT-NWP',  'News Published',               15,  { category: 'News',         description: 'Publikasi berita atau event baru di News & Event.' });
seed('b2000001-0000-4000-a000-000000000016', 'ACTIVITY_TYPE', 'ACT-SYS',  'System Activity',              16,  { category: 'System',       description: 'Aktivitas otomatis atau maintenance yang dihasilkan sistem.' });

// ── ACTIVITY STATUS ───────────────────────────────────────────────────────────
// Status siklus hidup sebuah activity record.
seed('b3000001-0000-4000-a000-000000000001', 'ACTIVITY_STATUS', 'AS-ACT',  'Active',    1,  { description: 'Activity aktif dan ditampilkan di feed/timeline.' });
seed('b3000001-0000-4000-a000-000000000002', 'ACTIVITY_STATUS', 'AS-ARC',  'Archived',  2,  { description: 'Activity diarsipkan — tidak muncul di feed aktif.' });
seed('b3000001-0000-4000-a000-000000000003', 'ACTIVITY_STATUS', 'AS-DEL',  'Deleted',   3,  { description: 'Activity dihapus (soft-delete) — tidak tampil di manapun.' });

// ── VISIBILITY ────────────────────────────────────────────────────────────────
// Tingkat keterlihatan activity — siapa yang dapat melihat.
seed('b4000001-0000-4000-a000-000000000001', 'VISIBILITY', 'VIS-PUB',  'Public',     1,  { description: 'Terlihat oleh semua pengguna TernakHub.' });
seed('b4000001-0000-4000-a000-000000000002', 'VISIBILITY', 'VIS-WRK',  'Workspace',  2,  { description: 'Hanya terlihat oleh anggota workspace yang sama.' });
seed('b4000001-0000-4000-a000-000000000003', 'VISIBILITY', 'VIS-PRV',  'Private',    3,  { description: 'Hanya terlihat oleh aktor yang membuat activity.' });
seed('b4000001-0000-4000-a000-000000000004', 'VISIBILITY', 'VIS-SYS',  'System',     4,  { description: 'Hanya terlihat oleh admin/sistem — tidak untuk pengguna biasa.' });

// ── AUDIT EVENT TYPE ──────────────────────────────────────────────────────────
// Jenis event yang dicatat oleh Global Audit Trail Service (FOUNDATION-008).
// Digunakan pada field event_type_reference_uuid di AuditTrailRecord.
seed('b0000001-0000-4000-a000-000000000001', 'AUDIT_EVENT_TYPE', 'CRT',  'Create',        1,  { description: 'Pembuatan entitas baru di dalam sistem.' });
seed('b0000001-0000-4000-a000-000000000002', 'AUDIT_EVENT_TYPE', 'UPD',  'Update',         2,  { description: 'Pembaruan data pada entitas yang sudah ada.' });
seed('b0000001-0000-4000-a000-000000000003', 'AUDIT_EVENT_TYPE', 'DEL',  'Delete',         3,  { description: 'Penghapusan (soft atau hard) sebuah entitas.' });
seed('b0000001-0000-4000-a000-000000000004', 'AUDIT_EVENT_TYPE', 'RST',  'Restore',        4,  { description: 'Pemulihan entitas yang sebelumnya dihapus atau diarsipkan.' });
seed('b0000001-0000-4000-a000-000000000005', 'AUDIT_EVENT_TYPE', 'LGN',  'Login',          5,  { description: 'Autentikasi pengguna — masuk ke sistem.' });
seed('b0000001-0000-4000-a000-000000000006', 'AUDIT_EVENT_TYPE', 'LGT',  'Logout',         6,  { description: 'Pengguna keluar dari sesi aktif.' });
seed('b0000001-0000-4000-a000-000000000007', 'AUDIT_EVENT_TYPE', 'IMP',  'Import',         7,  { description: 'Import data massal dari sumber eksternal ke sistem.' });
seed('b0000001-0000-4000-a000-000000000008', 'AUDIT_EVENT_TYPE', 'EXP',  'Export',         8,  { description: 'Export data dari sistem ke format eksternal.' });
seed('b0000001-0000-4000-a000-000000000009', 'AUDIT_EVENT_TYPE', 'VRF',  'Verify',         9,  { description: 'Verifikasi identitas, dokumen, atau entitas oleh sistem/admin.' });
seed('b0000001-0000-4000-a000-000000000010', 'AUDIT_EVENT_TYPE', 'RJT',  'Reject',        10,  { description: 'Penolakan terhadap entitas, pengajuan, atau permintaan.' });
seed('b0000001-0000-4000-a000-000000000011', 'AUDIT_EVENT_TYPE', 'APR',  'Approve',       11,  { description: 'Persetujuan terhadap entitas, pengajuan, atau permintaan.' });
seed('b0000001-0000-4000-a000-000000000012', 'AUDIT_EVENT_TYPE', 'TRX',  'Transaction',   12,  { description: 'Event terkait siklus hidup transaksi (buat, bayar, selesai, dll).' });
seed('b0000001-0000-4000-a000-000000000013', 'AUDIT_EVENT_TYPE', 'ESC',  'Escrow',        13,  { description: 'Event terkait proses Escrow (tahan dana, lepas, sengketa).' });
seed('b0000001-0000-4000-a000-000000000014', 'AUDIT_EVENT_TYPE', 'EVD',  'Evidence',      14,  { description: 'Penambahan atau pengubahan bukti (evidence) dalam suatu proses.' });
seed('b0000001-0000-4000-a000-000000000015', 'AUDIT_EVENT_TYPE', 'UPM',  'Upload Media',  15,  { description: 'Unggah media (foto, video, dokumen) ke sistem.' });

// ── AUDIT ACTION ──────────────────────────────────────────────────────────────
// Tindakan spesifik dalam sebuah event — digunakan pada action_reference_uuid.
// Memberikan granularitas lebih dalam dari AUDIT_EVENT_TYPE.
seed('b1000001-0000-4000-a000-000000000001', 'AUDIT_ACTION', 'ACT-STC',  'Status Change',       1,  { description: 'Perubahan status/state entitas (misal: Draft → Aktif).' });
seed('b1000001-0000-4000-a000-000000000002', 'AUDIT_ACTION', 'ACT-FLD',  'Field Update',        2,  { description: 'Perubahan nilai satu atau lebih field pada entitas.' });
seed('b1000001-0000-4000-a000-000000000003', 'AUDIT_ACTION', 'ACT-BLK',  'Bulk Operation',      3,  { description: 'Operasi massal pada banyak entitas sekaligus.' });
seed('b1000001-0000-4000-a000-000000000004', 'AUDIT_ACTION', 'ACT-PRM',  'Permission Change',   4,  { description: 'Perubahan hak akses atau peran pada pengguna/workspace.' });
seed('b1000001-0000-4000-a000-000000000005', 'AUDIT_ACTION', 'ACT-SYS',  'System Generated',    5,  { description: 'Tindakan otomatis yang dihasilkan oleh sistem (bukan user).' });
seed('b1000001-0000-4000-a000-000000000006', 'AUDIT_ACTION', 'ACT-MAN',  'Manual Override',     6,  { description: 'Tindakan manual oleh admin untuk menimpa nilai otomatis.' });
seed('b1000001-0000-4000-a000-000000000007', 'AUDIT_ACTION', 'ACT-ARC',  'Archive',             7,  { description: 'Pengarsipan entitas ke status non-aktif.' });
seed('b1000001-0000-4000-a000-000000000008', 'AUDIT_ACTION', 'ACT-CFM',  'Confirm',             8,  { description: 'Konfirmasi tindakan oleh pengguna atau sistem.' });
seed('b1000001-0000-4000-a000-000000000009', 'AUDIT_ACTION', 'ACT-CXL',  'Cancel',              9,  { description: 'Pembatalan proses atau entitas yang sedang berjalan.' });
seed('b1000001-0000-4000-a000-000000000010', 'AUDIT_ACTION', 'ACT-SYN',  'Sync',               10,  { description: 'Sinkronisasi data antar modul atau layanan.' });

// ── NOTIFICATION STATUS ───────────────────────────────────────────────────────
// Status siklus hidup sebuah notifikasi dalam Global Notification Service.
seed('a8000001-0000-4000-a000-000000000001', 'NOTIFICATION_STATUS', 'NS-UNRD', 'Unread',    1, { description: 'Notifikasi belum dibaca oleh penerima.' });
seed('a8000001-0000-4000-a000-000000000002', 'NOTIFICATION_STATUS', 'NS-READ', 'Read',      2, { description: 'Notifikasi sudah dibaca oleh penerima.' });
seed('a8000001-0000-4000-a000-000000000003', 'NOTIFICATION_STATUS', 'NS-ARC',  'Archived',  3, { description: 'Notifikasi diarsipkan — disembunyikan dari inbox aktif.' });
seed('a8000001-0000-4000-a000-000000000004', 'NOTIFICATION_STATUS', 'NS-DEL',  'Deleted',   4, { description: 'Notifikasi dihapus (soft-delete) — tidak tampil di manapun.' });

// ── PRIORITY ──────────────────────────────────────────────────────────────────
// Level prioritas notifikasi — menentukan urutan tampil dan urgensitas.
seed('a9000001-0000-4000-a000-000000000001', 'PRIORITY', 'PRI-LOW',  'Low',      1, { description: 'Prioritas rendah — informasi opsional, tidak mendesak.' });
seed('a9000001-0000-4000-a000-000000000002', 'PRIORITY', 'PRI-NRM',  'Normal',   2, { description: 'Prioritas normal — standar notifikasi operasional.' });
seed('a9000001-0000-4000-a000-000000000003', 'PRIORITY', 'PRI-HGH',  'High',     3, { description: 'Prioritas tinggi — perlu ditindaklanjuti segera.' });
seed('a9000001-0000-4000-a000-000000000004', 'PRIORITY', 'PRI-CRT',  'Critical', 4, { description: 'Prioritas kritis — memerlukan tindakan segera tanpa tunda.' });
