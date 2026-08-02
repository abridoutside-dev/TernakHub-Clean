// ─── News & Event — Master RSS Source (NEWS-006) ──────────────────────────────
// Mengikuti docs/architecture/NEWS_EVENT_MODULE_CONSTITUTION.md →
// TRUSTED RSS SOURCES, RSS VALIDATION, CONTENT PRIORITY.
//
// RSS adalah Priority 1 sumber publikasi (Constitution → CONTENT PRIORITY).
// Hanya website terpercaya yang didaftarkan. Penambahan source baru wajib
// melalui Admin (tidak ada self-registration).
//
// Prototipe: tidak ada crawler nyata — collector menggunakan dummy data.

import { generateUUID } from '../utils/uuid';

// ─── Source Category (Constitution → TRUSTED RSS SOURCES) ────────────────────
// Tujuh kategori sesuai jenis organisasi. Mudah ditambah tanpa mengubah
// arsitektur — union string saja, bukan enum numerik.
export type RssSourceCategory =
  | 'Government'
  | 'University'
  | 'Research Institute'
  | 'Association'
  | 'Official Partner'
  | 'Trusted Media'
  | 'Community Official';

export const RSS_SOURCE_CATEGORY_LIST: RssSourceCategory[] = [
  'Government',
  'University',
  'Research Institute',
  'Association',
  'Official Partner',
  'Trusted Media',
  'Community Official',
];

export const RSS_SOURCE_CATEGORY_LABEL: Record<RssSourceCategory, string> = {
  Government: 'Instansi Pemerintah',
  University: 'Perguruan Tinggi',
  'Research Institute': 'Balai Penelitian',
  Association: 'Asosiasi Peternakan',
  'Official Partner': 'Mitra Resmi',
  'Trusted Media': 'Media Terpercaya',
  'Community Official': 'Komunitas Resmi',
};

export const RSS_SOURCE_CATEGORY_EMOJI: Record<RssSourceCategory, string> = {
  Government: '🏛️',
  University: '🎓',
  'Research Institute': '🔬',
  Association: '🤝',
  'Official Partner': '🌟',
  'Trusted Media': '📡',
  'Community Official': '👥',
};

// ─── Source Status ─────────────────────────────────────────────────────────────
export type RssSourceStatus = 'Active' | 'Inactive' | 'Suspended';

export const RSS_SOURCE_STATUS_COLOR: Record<RssSourceStatus, { bg: string; color: string }> = {
  Active: { bg: '#e8f5ee', color: '#1b7a43' },
  Inactive: { bg: '#eceff1', color: '#607d8b' },
  Suspended: { bg: '#fbe1e1', color: '#a02020' },
};

// ─── RSS Source Record ─────────────────────────────────────────────────────────
export interface RssSource {
  id: string;           // UUID v4
  name: string;         // nama singkat (ditampilkan di UI)
  sourceUrl: string;    // URL website utama
  rssUrl: string;       // URL RSS/Atom feed
  publisher: string;    // nama publisher (bisa = name atau nama unit)
  organization: string; // nama organisasi resmi
  country: string;      // kode negara, misal 'ID'
  language: string;     // kode bahasa, misal 'id' / 'en'
  category: RssSourceCategory;
  status: RssSourceStatus;
  description: string;  // deskripsi singkat sumber
  lastCrawl?: string;   // ISO datetime — kapan terakhir di-crawl
  lastSuccess?: string; // ISO datetime — kapan terakhir berhasil mengambil feed
  crawlIntervalHours: number; // interval crawl dalam jam (0 = manual only)
  createdAt: string;
  updatedAt: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
// Organisasi peternakan dan pertanian Indonesia yang terpercaya.
// UUID di-hardcode agar stabil antar reload.
export const RSS_SOURCE_LIST: RssSource[] = [
  {
    id: 'rss-src-0001-kementan-0000-000000000001',
    name: 'Kementan RI',
    sourceUrl: 'https://pertanian.go.id',
    rssUrl: 'https://pertanian.go.id/home/index.php?act=rss',
    publisher: 'Kementerian Pertanian RI',
    organization: 'Kementerian Pertanian Republik Indonesia',
    country: 'ID',
    language: 'id',
    category: 'Government',
    status: 'Active',
    description: 'Portal resmi Kementerian Pertanian — berita kebijakan, regulasi, dan program peternakan nasional.',
    lastCrawl: '2026-07-14T06:00:00.000Z',
    lastSuccess: '2026-07-14T06:00:00.000Z',
    crawlIntervalHours: 6,
    createdAt: '2026-01-01',
    updatedAt: '2026-07-14',
  },
  {
    id: 'rss-src-0002-ditjennak-000-000000000002',
    name: 'Ditjen PKH',
    sourceUrl: 'https://ditjenpkh.pertanian.go.id',
    rssUrl: 'https://ditjenpkh.pertanian.go.id/feed',
    publisher: 'Ditjen Peternakan & Kesehatan Hewan',
    organization: 'Direktorat Jenderal Peternakan dan Kesehatan Hewan — Kementan RI',
    country: 'ID',
    language: 'id',
    category: 'Government',
    status: 'Active',
    description: 'Direktorat teknis peternakan dan kesehatan hewan nasional — kebijakan, wabah penyakit, vaksinasi.',
    lastCrawl: '2026-07-14T06:30:00.000Z',
    lastSuccess: '2026-07-14T06:30:00.000Z',
    crawlIntervalHours: 6,
    createdAt: '2026-01-01',
    updatedAt: '2026-07-14',
  },
  {
    id: 'rss-src-0003-balitnak-0000-000000000003',
    name: 'Balitnak',
    sourceUrl: 'https://balitnak.litbang.pertanian.go.id',
    rssUrl: 'https://balitnak.litbang.pertanian.go.id/feed',
    publisher: 'Balai Penelitian Ternak',
    organization: 'Balai Penelitian Ternak — Badan Litbang Pertanian',
    country: 'ID',
    language: 'id',
    category: 'Research Institute',
    status: 'Active',
    description: 'Penelitian ternak nasional — nutrisi, genetika, reproduksi, manajemen kandang.',
    lastCrawl: '2026-07-14T07:00:00.000Z',
    lastSuccess: '2026-07-14T07:00:00.000Z',
    crawlIntervalHours: 12,
    createdAt: '2026-01-10',
    updatedAt: '2026-07-14',
  },
  {
    id: 'rss-src-0004-bbalitvet-000-000000000004',
    name: 'BBALITVET',
    sourceUrl: 'https://bbalitvet.litbang.pertanian.go.id',
    rssUrl: 'https://bbalitvet.litbang.pertanian.go.id/feed',
    publisher: 'BBALITVET',
    organization: 'Balai Besar Penelitian Veteriner',
    country: 'ID',
    language: 'id',
    category: 'Research Institute',
    status: 'Active',
    description: 'Riset veteriner dan penyakit hewan — deteksi, vaksin, diagnostik.',
    lastCrawl: '2026-07-14T07:30:00.000Z',
    lastSuccess: '2026-07-14T07:30:00.000Z',
    crawlIntervalHours: 12,
    createdAt: '2026-01-10',
    updatedAt: '2026-07-14',
  },
  {
    id: 'rss-src-0005-ugm-fapet-000-000000000005',
    name: 'Fapet UGM',
    sourceUrl: 'https://fapet.ugm.ac.id',
    rssUrl: 'https://fapet.ugm.ac.id/feed',
    publisher: 'Fapet UGM',
    organization: 'Fakultas Peternakan — Universitas Gadjah Mada',
    country: 'ID',
    language: 'id',
    category: 'University',
    status: 'Active',
    description: 'Berita riset, pengabdian, dan inovasi peternakan dari Fakultas Peternakan UGM.',
    lastCrawl: '2026-07-13T22:00:00.000Z',
    lastSuccess: '2026-07-13T22:00:00.000Z',
    crawlIntervalHours: 24,
    createdAt: '2026-02-01',
    updatedAt: '2026-07-13',
  },
  {
    id: 'rss-src-0006-ipb-fapet-000-000000000006',
    name: 'Fapet IPB',
    sourceUrl: 'https://fapet.ipb.ac.id',
    rssUrl: 'https://fapet.ipb.ac.id/feed',
    publisher: 'Fapet IPB',
    organization: 'Fakultas Peternakan — Institut Pertanian Bogor',
    country: 'ID',
    language: 'id',
    category: 'University',
    status: 'Active',
    description: 'Riset dan berita akademik peternakan dari IPB University.',
    lastCrawl: '2026-07-13T21:00:00.000Z',
    lastSuccess: '2026-07-13T21:00:00.000Z',
    crawlIntervalHours: 24,
    createdAt: '2026-02-01',
    updatedAt: '2026-07-13',
  },
  {
    id: 'rss-src-0007-hpdki-00000-000000000007',
    name: 'HPDKI',
    sourceUrl: 'https://hpdki.id',
    rssUrl: 'https://hpdki.id/feed',
    publisher: 'HPDKI',
    organization: 'Himpunan Peternak Domba Kambing Indonesia',
    country: 'ID',
    language: 'id',
    category: 'Association',
    status: 'Active',
    description: 'Asosiasi resmi peternak domba dan kambing Indonesia — harga, event, regulasi.',
    lastCrawl: '2026-07-14T05:00:00.000Z',
    lastSuccess: '2026-07-14T05:00:00.000Z',
    crawlIntervalHours: 12,
    createdAt: '2026-02-15',
    updatedAt: '2026-07-14',
  },
  {
    id: 'rss-src-0008-gppu-000000-000000000008',
    name: 'GPPU',
    sourceUrl: 'https://gppu.id',
    rssUrl: 'https://gppu.id/feed',
    publisher: 'GPPU',
    organization: 'Gabungan Pengusaha Perunggasan Indonesia',
    country: 'ID',
    language: 'id',
    category: 'Association',
    status: 'Active',
    description: 'Asosiasi perunggasan nasional — berita ayam, bebek, harga DOC, pakan unggas.',
    lastCrawl: '2026-07-14T05:30:00.000Z',
    lastSuccess: '2026-07-14T05:30:00.000Z',
    crawlIntervalHours: 12,
    createdAt: '2026-02-15',
    updatedAt: '2026-07-14',
  },
  {
    id: 'rss-src-0009-sinartani-00-000000000009',
    name: 'Sinar Tani',
    sourceUrl: 'https://sinartani.co.id',
    rssUrl: 'https://sinartani.co.id/feed',
    publisher: 'Redaksi Sinar Tani',
    organization: 'Sinar Tani — Media Pertanian & Peternakan',
    country: 'ID',
    language: 'id',
    category: 'Trusted Media',
    status: 'Active',
    description: 'Media pertanian dan peternakan terpercaya dengan jangkauan nasional.',
    lastCrawl: '2026-07-14T08:00:00.000Z',
    lastSuccess: '2026-07-14T08:00:00.000Z',
    crawlIntervalHours: 4,
    createdAt: '2026-03-01',
    updatedAt: '2026-07-14',
  },
  {
    id: 'rss-src-0010-agrofarm-000-000000000010',
    name: 'Agrofarm',
    sourceUrl: 'https://agrofarm.co.id',
    rssUrl: 'https://agrofarm.co.id/feed',
    publisher: 'Redaksi Agrofarm',
    organization: 'Agrofarm — Portal Agribisnis Indonesia',
    country: 'ID',
    language: 'id',
    category: 'Trusted Media',
    status: 'Active',
    description: 'Portal agribisnis fokus peternakan, pertanian, dan pasar komoditas.',
    lastCrawl: '2026-07-14T08:30:00.000Z',
    lastSuccess: '2026-07-14T08:30:00.000Z',
    crawlIntervalHours: 4,
    createdAt: '2026-03-01',
    updatedAt: '2026-07-14',
  },
  {
    id: 'rss-src-0011-api-0000000-000000000011',
    name: 'Asosiasi Peternakan Indonesia',
    sourceUrl: 'https://asosiasipeternakan.id',
    rssUrl: 'https://asosiasipeternakan.id/feed',
    publisher: 'Asosiasi Peternakan Indonesia',
    organization: 'Asosiasi Peternakan Indonesia',
    country: 'ID',
    language: 'id',
    category: 'Association',
    status: 'Active',
    description: 'Asosiasi induk peternakan lintas komoditas — regulasi, harga, statistik nasional.',
    lastCrawl: '2026-07-14T04:00:00.000Z',
    lastSuccess: '2026-07-14T04:00:00.000Z',
    crawlIntervalHours: 8,
    createdAt: '2026-01-15',
    updatedAt: '2026-07-14',
  },
  {
    id: 'rss-src-0012-inaktif-000-000000000012',
    name: 'Portal Ternak Nusantara',
    sourceUrl: 'https://ternaknus.id',
    rssUrl: 'https://ternaknus.id/feed',
    publisher: 'Redaksi Ternak Nusantara',
    organization: 'PT Ternak Nusantara Media',
    country: 'ID',
    language: 'id',
    category: 'Trusted Media',
    status: 'Inactive',
    description: 'Portal berita peternakan — sementara tidak aktif sejak migrasi platform.',
    lastCrawl: '2026-05-01T10:00:00.000Z',
    lastSuccess: '2026-04-30T22:00:00.000Z',
    crawlIntervalHours: 6,
    createdAt: '2026-01-20',
    updatedAt: '2026-05-01',
  },
];

// ─── Query & Mutation Helpers ──────────────────────────────────────────────────

export function getAllRssSources(): RssSource[] {
  return RSS_SOURCE_LIST;
}

export function getRssSourceById(id: string): RssSource | undefined {
  return RSS_SOURCE_LIST.find((s) => s.id === id);
}

export function getActiveRssSources(): RssSource[] {
  return RSS_SOURCE_LIST.filter((s) => s.status === 'Active');
}

export function getRssSourcesByCategory(category: RssSourceCategory): RssSource[] {
  return RSS_SOURCE_LIST.filter((s) => s.category === category);
}

export function getRssSourceRingkasan() {
  const all = RSS_SOURCE_LIST;
  return {
    total: all.length,
    active: all.filter((s) => s.status === 'Active').length,
    inactive: all.filter((s) => s.status === 'Inactive').length,
    suspended: all.filter((s) => s.status === 'Suspended').length,
    byCategory: RSS_SOURCE_CATEGORY_LIST.reduce<Record<string, number>>((acc, cat) => {
      acc[cat] = all.filter((s) => s.category === cat).length;
      return acc;
    }, {}),
  };
}

/** Update status source (Admin only). */
export function updateRssSourceStatus(id: string, status: RssSourceStatus): RssSource | undefined {
  const src = getRssSourceById(id);
  if (!src) return undefined;
  src.status = status;
  src.updatedAt = new Date().toISOString().slice(0, 10);
  return src;
}

/** Simulasi: update lastCrawl setelah manual refresh. */
export function recordCrawlAttempt(id: string, success: boolean): void {
  const src = getRssSourceById(id);
  if (!src) return;
  const now = new Date().toISOString();
  src.lastCrawl = now;
  if (success) src.lastSuccess = now;
  src.updatedAt = now.slice(0, 10);
}

/** Tambah RSS Source baru (Admin). */
export function addRssSource(data: Omit<RssSource, 'id' | 'createdAt' | 'updatedAt'>): RssSource {
  const now = new Date().toISOString().slice(0, 10);
  const rec: RssSource = { ...data, id: generateUUID(), createdAt: now, updatedAt: now };
  RSS_SOURCE_LIST.unshift(rec);
  return rec;
}
