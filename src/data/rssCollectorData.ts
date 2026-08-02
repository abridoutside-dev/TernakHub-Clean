// ─── News & Event — RSS Collector & AI Classification Engine (NEWS-006) ───────
// Mengikuti docs/architecture/NEWS_EVENT_MODULE_CONSTITUTION.md →
// RSS COLLECTOR, AI CLASSIFICATION, RSS VALIDATION.
//
// CATATAN JUJUR: Prototipe frontend-only tanpa crawler nyata.
// • Tidak ada fetch RSS asli — seluruh RawFeedItem adalah dummy data.
// • CollectorJob merupakan struktur yang siap untuk integrasi crawler nyata.
// • AI Classification adalah analisis berbasis-aturan (rule-based),
//   deterministik terhadap konten dummy — bukan model NLP/ML sungguhan.
//
// Tiga jenis refresh (Constitution → COLLECTOR):
// • Manual Refresh   — dipicu Admin dari UI
// • Scheduled Refresh — dijalankan sesuai interval (simulasi)
// • Incremental Refresh — hanya item baru sejak lastCrawl

import { type NewsEventKategori } from './newsEventData';
import { type RssSource } from './rssSourceData';
import { generateUUID } from '../utils/uuid';

// ─── Raw Feed Item — satu artikel dari RSS feed ───────────────────────────────
export interface RawFeedItem {
  id: string;
  sourceId: string;        // FK → RssSource.id
  sourceName: string;      // denormalized untuk display
  guid: string;            // RSS item GUID (link or unique string)
  title: string;
  link: string;            // URL artikel asli
  description: string;     // ringkasan / excerpt dari RSS
  content?: string;        // full content (dari content:encoded jika tersedia)
  pubDate: string;         // ISO datetime — tanggal terbit di sumber
  author?: string;
  rawCategories: string[]; // kategori dari feed asli (belum diklasifikasi AI)
  fetchedAt: string;       // ISO datetime — kapan item ini di-fetch
}

// ─── AI Classification ─────────────────────────────────────────────────────────
// Topic Detection: keyword mapping per topik ternak/pakan.
// Mudah ditambah: tambahkan entry baru di TOPIC_KEYWORDS.
export type RssTopik =
  | 'Domba' | 'Kambing' | 'Sapi' | 'Kerbau' | 'Kuda' | 'Babi'
  | 'Ayam' | 'Bebek' | 'Pakan' | 'Nutrisi' | 'Hijauan' | 'Silase'
  | 'Hay' | 'Obat Hewan' | 'Penyakit Hewan' | 'Teknologi'
  | 'Marketplace' | 'Regulasi';

export const TOPIC_KEYWORDS: Record<RssTopik, string[]> = {
  Domba: ['domba', 'biri-biri', 'merino', 'garut', 'woolen'],
  Kambing: ['kambing', 'etawa', 'kacang', 'peranakan etawa', 'caprine', 'goat'],
  Sapi: ['sapi', 'lembu', 'bovine', 'cattle', 'brahman', 'limousin', 'simmental', 'perah'],
  Kerbau: ['kerbau', 'buffalo'],
  Kuda: ['kuda', 'horse', 'equine'],
  Babi: ['babi', 'swine', 'pig', 'pork'],
  Ayam: ['ayam', 'broiler', 'layer', 'petelur', 'pedaging', 'poultry', 'unggas', 'doc'],
  Bebek: ['bebek', 'itik', 'duck'],
  Pakan: ['pakan', 'konsentrat', 'ransum', 'dedak', 'bungkil', 'tepung ikan', 'jagung pakan'],
  Nutrisi: ['nutrisi', 'gizi', 'protein', 'energi', 'mineral', 'vitamin', 'tdn', 'metabolisme'],
  Hijauan: ['hijauan', 'rumput', 'odot', 'napier', 'gajah', 'pasture'],
  Silase: ['silase', 'silage', 'fermentasi pakan'],
  Hay: ['hay', 'jerami', 'dried grass'],
  'Obat Hewan': ['obat hewan', 'vaksin', 'antibiotik', 'antiparasit', 'obat ternak', 'veteriner'],
  'Penyakit Hewan': ['pmk', 'penyakit mulut', 'lsd', 'anthrax', 'brucellosis', 'ai', 'avian influenza', 'newcastle', 'wabah', 'zoonosis', 'penyakit hewan'],
  Teknologi: ['teknologi', 'sensor', 'iot', 'digital', 'aplikasi', 'drone', 'smart farm', 'otomatis'],
  Marketplace: ['marketplace', 'jual beli ternak', 'lelang', 'harga ternak', 'pasar ternak'],
  Regulasi: ['regulasi', 'peraturan', 'kebijakan', 'sk menteri', 'perpres', 'sns', 'sni', 'standar'],
};

const SPAM_MARKERS = ['judi', 'togel', 'slot online', 'bet ', 'porno', 'bokep'];
const CLICKBAIT_MARKERS = ['!!!', 'wow', 'gempar', 'bikin heboh', 'viral', 'shock', 'mengejutkan'];
const HOAKS_MARKERS = ['terbukti ampuh 100%', 'rahasia disembunyikan', 'darurat nasional', 'wabah nasional'];

export type AiClassificationStatus = 'Relevant' | 'Irrelevant' | 'Spam' | 'Duplicate';

export interface AiClassificationResult {
  status: AiClassificationStatus;
  detectedTopics: RssTopik[];
  detectedCategories: NewsEventKategori[];
  language: string;         // 'id' | 'en'
  confidenceScore: number;  // 0-100
  relevanceScore: number;   // 0-100 — seberapa relevan dengan ekosistem TernakHub
  isSpam: boolean;
  isClickbait: boolean;
  isPotentialHoaks: boolean;
  isDuplicate: boolean;
  duplicateOfQueueId?: string; // jika duplikat, ID RssQueueItem yang sudah ada
  reasoning: string;        // penjelasan singkat mengapa lolos/tidak lolos
  ranAt: string;            // ISO datetime
}

// Kata kunci bahasa Indonesia — digunakan untuk deteksi bahasa sederhana
const ID_KEYWORDS = ['dan', 'atau', 'yang', 'dengan', 'untuk', 'dari', 'ini', 'itu', 'ke', 'di', 'pada', 'adalah'];

function detectLanguage(text: string): string {
  const lower = text.toLowerCase();
  const idHits = ID_KEYWORDS.filter((w) => lower.includes(` ${w} `)).length;
  return idHits >= 2 ? 'id' : 'en';
}

function detectTopics(text: string): RssTopik[] {
  const lower = text.toLowerCase();
  return (Object.entries(TOPIC_KEYWORDS) as [RssTopik, string[]][])
    .filter(([, kws]) => kws.some((kw) => lower.includes(kw)))
    .map(([topic]) => topic);
}

function topicsToCategories(topics: RssTopik[]): NewsEventKategori[] {
  // Mapping topic → NewsEventKategori (1:1 where names match, else via map)
  const KATEGORI_MAP: Partial<Record<RssTopik, NewsEventKategori>> = {
    Domba: 'Domba', Kambing: 'Kambing', Sapi: 'Sapi', Kerbau: 'Kerbau', Kuda: 'Kuda',
    Babi: 'Babi', Ayam: 'Ayam', Bebek: 'Bebek', Pakan: 'Pakan', Nutrisi: 'Nutrisi',
    Hijauan: 'Hijauan', Silase: 'Silase', Hay: 'Hay',
    'Obat Hewan': 'Obat Hewan', 'Penyakit Hewan': 'Penyakit Hewan',
    Teknologi: 'Teknologi', Marketplace: 'Marketplace', Regulasi: 'Regulasi',
  };
  const cats = topics.map((t) => KATEGORI_MAP[t]).filter(Boolean) as NewsEventKategori[];
  if (cats.length === 0) cats.push('Peternakan'); // fallback
  return Array.from(new Set(cats));
}

/**
 * AI Classification Engine (rule-based, deterministik).
 * Memeriksa satu RawFeedItem dan menghasilkan AiClassificationResult.
 * existingGuids: set GUID/link yang sudah ada di queue untuk deteksi duplikat.
 */
export function runAiClassification(
  item: RawFeedItem,
  existingGuids: Set<string>,
  existingQueueId?: string, // ID queue jika guid match
): AiClassificationResult {
  const combinedText = `${item.title} ${item.description} ${item.content ?? ''}`;
  const lower = combinedText.toLowerCase();

  const isSpam = SPAM_MARKERS.some((m) => lower.includes(m));
  const isClickbait = CLICKBAIT_MARKERS.some((m) => lower.includes(m));
  const isPotentialHoaks = HOAKS_MARKERS.some((m) => lower.includes(m));
  const isDuplicate = existingGuids.has(item.guid) || existingGuids.has(item.link);
  const detectedTopics = detectTopics(combinedText);
  const language = detectLanguage(combinedText);
  const relevanceScore = Math.min(100, detectedTopics.length * 20 + (language === 'id' ? 20 : 0));
  const isRelevant = relevanceScore >= 20 && !isSpam;

  let status: AiClassificationStatus;
  let reasoning: string;

  if (isSpam) {
    status = 'Spam';
    reasoning = 'Konten terdeteksi sebagai spam — tidak relevan dengan ekosistem TernakHub.';
  } else if (isDuplicate) {
    status = 'Duplicate';
    reasoning = 'GUID/link artikel identik dengan item yang sudah ada di queue — disimpan sebagai Reference Source.';
  } else if (!isRelevant) {
    status = 'Irrelevant';
    reasoning = `Tidak ditemukan topik ternak/pakan yang relevan. Relevance score: ${relevanceScore}/100.`;
  } else {
    status = 'Relevant';
    const issues = [
      isClickbait ? 'Potensi clickbait terdeteksi.' : '',
      isPotentialHoaks ? 'Potensi hoaks — periksa referensi.' : '',
    ].filter(Boolean).join(' ');
    reasoning = `${detectedTopics.length} topik ditemukan (${detectedTopics.slice(0, 3).join(', ')}). Relevance: ${relevanceScore}/100.${issues ? ' ' + issues : ''}`;
  }

  const confidenceScore = isSpam ? 10
    : isDuplicate ? 95
    : Math.min(98, 50 + relevanceScore * 0.4 - (isClickbait ? 15 : 0) - (isPotentialHoaks ? 15 : 0));

  return {
    status,
    detectedTopics,
    detectedCategories: topicsToCategories(detectedTopics),
    language,
    confidenceScore: Math.round(confidenceScore),
    relevanceScore,
    isSpam,
    isClickbait,
    isPotentialHoaks,
    isDuplicate,
    duplicateOfQueueId: isDuplicate ? existingQueueId : undefined,
    reasoning,
    ranAt: new Date().toISOString(),
  };
}

// ─── Collector Job ─────────────────────────────────────────────────────────────
export type CollectorJobType = 'Manual' | 'Scheduled' | 'Incremental';
export type CollectorJobStatus = 'Idle' | 'Running' | 'Completed' | 'Failed';

export interface CollectorJob {
  id: string;
  sourceId: string;
  sourceName: string;
  type: CollectorJobType;
  status: CollectorJobStatus;
  startedAt?: string;     // ISO datetime
  completedAt?: string;   // ISO datetime
  itemsFetched: number;
  itemsNew: number;
  itemsDuplicate: number;
  itemsIrrelevant: number;
  itemsSpam: number;
  error?: string;
}

export const COLLECTOR_JOB_LIST: CollectorJob[] = [
  {
    id: 'job-0001-kementan-manual-000001',
    sourceId: 'rss-src-0001-kementan-0000-000000000001',
    sourceName: 'Kementan RI',
    type: 'Scheduled',
    status: 'Completed',
    startedAt: '2026-07-14T06:00:00.000Z',
    completedAt: '2026-07-14T06:00:12.000Z',
    itemsFetched: 8, itemsNew: 3, itemsDuplicate: 1, itemsIrrelevant: 2, itemsSpam: 0,
  },
  {
    id: 'job-0002-balitnak-scheduled-000002',
    sourceId: 'rss-src-0003-balitnak-0000-000000000003',
    sourceName: 'Balitnak',
    type: 'Scheduled',
    status: 'Completed',
    startedAt: '2026-07-14T07:00:00.000Z',
    completedAt: '2026-07-14T07:00:09.000Z',
    itemsFetched: 5, itemsNew: 2, itemsDuplicate: 0, itemsIrrelevant: 1, itemsSpam: 0,
  },
  {
    id: 'job-0003-sinartani-scheduled-000003',
    sourceId: 'rss-src-0009-sinartani-00-000000000009',
    sourceName: 'Sinar Tani',
    type: 'Scheduled',
    status: 'Completed',
    startedAt: '2026-07-14T08:00:00.000Z',
    completedAt: '2026-07-14T08:00:18.000Z',
    itemsFetched: 12, itemsNew: 5, itemsDuplicate: 2, itemsIrrelevant: 3, itemsSpam: 0,
  },
  {
    id: 'job-0004-hpdki-manual-00000004',
    sourceId: 'rss-src-0007-hpdki-00000-000000000007',
    sourceName: 'HPDKI',
    type: 'Manual',
    status: 'Completed',
    startedAt: '2026-07-13T10:00:00.000Z',
    completedAt: '2026-07-13T10:00:07.000Z',
    itemsFetched: 4, itemsNew: 2, itemsDuplicate: 0, itemsIrrelevant: 1, itemsSpam: 0,
  },
  {
    id: 'job-0005-inaktif-failed-00000005',
    sourceId: 'rss-src-0012-inaktif-000-000000000012',
    sourceName: 'Portal Ternak Nusantara',
    type: 'Scheduled',
    status: 'Failed',
    startedAt: '2026-05-01T10:00:00.000Z',
    completedAt: '2026-05-01T10:00:30.000Z',
    itemsFetched: 0, itemsNew: 0, itemsDuplicate: 0, itemsIrrelevant: 0, itemsSpam: 0,
    error: 'Connection timeout — host tidak merespons dalam 30 detik.',
  },
];

export function getCollectorJobsBySource(sourceId: string): CollectorJob[] {
  return COLLECTOR_JOB_LIST.filter((j) => j.sourceId === sourceId);
}

export function getRecentCollectorJobs(limit = 10): CollectorJob[] {
  return [...COLLECTOR_JOB_LIST]
    .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
    .slice(0, limit);
}

/**
 * Simulasi Manual Refresh — membuat job baru berstatus Completed.
 * Pada produksi, ini akan memicu crawl asli dan memanggil runAiClassification
 * pada setiap item yang dikembalikan feed.
 */
export function triggerManualRefresh(source: RssSource): CollectorJob {
  const now = new Date().toISOString();
  const job: CollectorJob = {
    id: generateUUID(),
    sourceId: source.id,
    sourceName: source.name,
    type: 'Manual',
    status: 'Completed',
    startedAt: now,
    completedAt: now,
    itemsFetched: Math.floor(Math.random() * 8) + 2,
    itemsNew: Math.floor(Math.random() * 3) + 1,
    itemsDuplicate: Math.floor(Math.random() * 2),
    itemsIrrelevant: Math.floor(Math.random() * 2),
    itemsSpam: 0,
  };
  COLLECTOR_JOB_LIST.unshift(job);
  return job;
}

// ─── Raw Feed Items (Dummy — prototipe) ───────────────────────────────────────
// Item-item berikut merepresentasikan artikel yang sudah di-fetch dari RSS
// source aktif, sebelum diproses AI Classification dan masuk ke Queue.
// Pada produksi, list ini terisi dari crawler asli.
export const RAW_FEED_ITEMS: RawFeedItem[] = [
  {
    id: 'raw-0001', sourceId: 'rss-src-0001-kementan-0000-000000000001',
    sourceName: 'Kementan RI',
    guid: 'https://pertanian.go.id/berita/vaksinasi-pmk-2026-q3',
    title: 'Kementan Luncurkan Vaksinasi PMK Gelombang Ketiga 2026',
    link: 'https://pertanian.go.id/berita/vaksinasi-pmk-2026-q3',
    description: 'Kementerian Pertanian RI meluncurkan gelombang ketiga vaksinasi PMK yang menyasar 3 juta ekor sapi dan kerbau di 22 provinsi.',
    pubDate: '2026-07-14T04:00:00.000Z',
    author: 'Tim Humas Kementan',
    rawCategories: ['penyakit hewan', 'sapi', 'kebijakan'],
    fetchedAt: '2026-07-14T06:00:05.000Z',
  },
  {
    id: 'raw-0002', sourceId: 'rss-src-0001-kementan-0000-000000000001',
    sourceName: 'Kementan RI',
    guid: 'https://pertanian.go.id/berita/subsidi-pakan-ternak-2026',
    title: 'Alokasi Subsidi Pakan Ternak Ruminansia Tahun 2026 Diumumkan',
    link: 'https://pertanian.go.id/berita/subsidi-pakan-ternak-2026',
    description: 'Pemerintah mengalokasikan subsidi pakan untuk peternak ruminansia kecil sebesar Rp 2,4 triliun pada tahun anggaran 2026.',
    pubDate: '2026-07-13T08:00:00.000Z',
    author: 'Tim Humas Kementan',
    rawCategories: ['regulasi', 'sapi', 'domba', 'kambing'],
    fetchedAt: '2026-07-14T06:00:06.000Z',
  },
  {
    id: 'raw-0003', sourceId: 'rss-src-0003-balitnak-0000-000000000003',
    sourceName: 'Balitnak',
    guid: 'https://balitnak.litbang.pertanian.go.id/edukasi/silase-jagung-musim-kering',
    title: 'Cara Membuat Silase Jagung Berkualitas untuk Musim Kering',
    link: 'https://balitnak.litbang.pertanian.go.id/edukasi/silase-jagung-musim-kering',
    description: 'Panduan langkah demi langkah membuat silase jagung agar nutrisi tetap terjaga selama masa simpan panjang.',
    pubDate: '2026-07-10T07:00:00.000Z',
    author: 'Dr. Ahmad Wijaya',
    rawCategories: ['silase', 'pakan', 'hijauan'],
    fetchedAt: '2026-07-14T07:00:03.000Z',
  },
  {
    id: 'raw-0004', sourceId: 'rss-src-0003-balitnak-0000-000000000003',
    sourceName: 'Balitnak',
    guid: 'https://balitnak.litbang.pertanian.go.id/riset/efisiensi-pakan-domba-lokal',
    title: 'Studi Efisiensi Pakan pada Domba Lokal Garut dengan Suplemen Mineral',
    link: 'https://balitnak.litbang.pertanian.go.id/riset/efisiensi-pakan-domba-lokal',
    description: 'Penelitian menunjukkan penambahan suplemen mineral Zn dan Cu meningkatkan pertambahan bobot harian domba lokal Garut hingga 18%.',
    pubDate: '2026-07-12T09:00:00.000Z',
    author: 'drh. Siti Rahayu',
    rawCategories: ['domba', 'nutrisi', 'mineral'],
    fetchedAt: '2026-07-14T07:00:04.000Z',
  },
  {
    id: 'raw-0005', sourceId: 'rss-src-0009-sinartani-00-000000000009',
    sourceName: 'Sinar Tani',
    guid: 'https://sinartani.co.id/berita/harga-sapi-bakalan-naik-idul-adha',
    title: 'Harga Sapi Bakalan Naik Jelang Idul Adha — Peternak Diminta Bersiap',
    link: 'https://sinartani.co.id/berita/harga-sapi-bakalan-naik-idul-adha',
    description: 'Harga sapi bakalan di sentra peternakan Jawa Timur dan Jawa Tengah mulai merangkak naik dua bulan menjelang Idul Adha 2026.',
    pubDate: '2026-07-13T10:00:00.000Z',
    author: 'Redaksi Sinar Tani',
    rawCategories: ['sapi', 'harga', 'idul adha'],
    fetchedAt: '2026-07-14T08:00:05.000Z',
  },
  {
    id: 'raw-0006', sourceId: 'rss-src-0009-sinartani-00-000000000009',
    sourceName: 'Sinar Tani',
    guid: 'https://sinartani.co.id/berita/teknologi-smart-farm-ayam-broiler',
    title: 'Smart Farm Ayam Broiler: IoT Kurangi Angka Kematian hingga 30%',
    link: 'https://sinartani.co.id/berita/teknologi-smart-farm-ayam-broiler',
    description: 'Implementasi IoT pada kandang ayam broiler modern terbukti menekan angka kematian dan meningkatkan FCR secara signifikan.',
    pubDate: '2026-07-11T08:00:00.000Z',
    author: 'Indra Setiawan',
    rawCategories: ['teknologi', 'ayam', 'iot'],
    fetchedAt: '2026-07-14T08:00:06.000Z',
  },
  {
    id: 'raw-0007', sourceId: 'rss-src-0007-hpdki-00000-000000000007',
    sourceName: 'HPDKI',
    guid: 'https://hpdki.id/berita/kontes-domba-nasional-2026',
    title: 'Pendaftaran Kontes Domba Nasional 2026 Dibuka — Hadiah Total Rp 500 Juta',
    link: 'https://hpdki.id/berita/kontes-domba-nasional-2026',
    description: 'HPDKI membuka pendaftaran Kontes Domba Nasional 2026 yang akan digelar di Bandung pada Oktober mendatang dengan hadiah total Rp 500 juta.',
    pubDate: '2026-07-10T09:00:00.000Z',
    author: 'Sekretariat HPDKI',
    rawCategories: ['domba', 'kontes', 'event'],
    fetchedAt: '2026-07-13T10:00:02.000Z',
  },
  {
    id: 'raw-0008', sourceId: 'rss-src-0002-ditjennak-000-000000000002',
    sourceName: 'Ditjen PKH',
    guid: 'https://ditjenpkh.pertanian.go.id/berita/lsd-update-2026',
    title: 'Update Situasi LSD (Lumpy Skin Disease) di Indonesia per Juli 2026',
    link: 'https://ditjenpkh.pertanian.go.id/berita/lsd-update-2026',
    description: 'Ditjen PKH merilis laporan terbaru situasi LSD di Indonesia — 5 provinsi dalam pengawasan ketat, program biosekuriti diperkuat.',
    pubDate: '2026-07-14T05:00:00.000Z',
    author: 'Tim Epidemiologi Ditjen PKH',
    rawCategories: ['penyakit hewan', 'sapi', 'lsd'],
    fetchedAt: '2026-07-14T06:30:04.000Z',
  },
];

export function getAllRawFeedItems(): RawFeedItem[] {
  return RAW_FEED_ITEMS;
}

export function getRawFeedItemsBySource(sourceId: string): RawFeedItem[] {
  return RAW_FEED_ITEMS.filter((i) => i.sourceId === sourceId);
}
