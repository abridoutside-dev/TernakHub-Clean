// ─── News & Event — Publication Management (NEWS-007) ─────────────────────────
// Mengikuti docs/architecture/NEWS_EVENT_MODULE_CONSTITUTION.md →
// PUBLICATION WORKFLOW, AUDIT TRAIL, VERSIONING.
//
// Pusat pengelolaan: Antrian Publikasi, Jadwal, Published, Arsip,
// Versioning, Revision Workflow, dan Audit Trail per item.
//
// Tidak ada penerbitan otomatis — seluruh keputusan Publish ada di tangan Admin.
// Jalur publish ke NEWS_EVENT_LIST:
//   - publishNow()        → dari Antrian / Schedule dipicu
//   - publishNewVersion() → dari Revision Workflow
// Constitution → AUDIT TRAIL wajib mencatat: Publish, Schedule, Archive,
// Revision, Publish New Version — TIDAK BOLEH dihapus.

import { generateUUID } from '../utils/uuid';
import {
  NEWS_EVENT_LIST,
  type NewsEventDetailAcara,
  type NewsEventKategori,
  type NewsEventPublisher,
  type NewsEventSumberPublikasi,
  type NewsEventTipeKonten,
} from './newsEventData';

// ─── Tipe Dasar ───────────────────────────────────────────────────────────────

export type PublicationStatus = 'Waiting Publish' | 'Scheduled' | 'Published' | 'Archived';

/** Constitution → AUDIT TRAIL: minimal Publish, Schedule, Archive, Revision, New Version. */
export type PublicationAuditAksi =
  | 'Approved'           // Item masuk antrian setelah disetujui Admin/RSS
  | 'Publish Sekarang'   // Admin publish langsung
  | 'Jadwalkan'          // Admin jadwalkan
  | 'Schedule Triggered' // Jadwal terpicu otomatis
  | 'Archive'            // Admin arsipkan
  | 'Ajukan Revisi'      // Admin minta revisi konten Published
  | 'Publish Versi Baru'; // Admin publish versi baru setelah revisi

export type PublicationTimezone = 'WIB' | 'WITA' | 'WIT';

export const TIMEZONE_OFFSET: Record<PublicationTimezone, string> = {
  WIB:  '+07:00',
  WITA: '+08:00',
  WIT:  '+09:00',
};

export const PUBLICATION_STATUS_COLOR: Record<PublicationStatus, { bg: string; color: string }> = {
  'Waiting Publish': { bg: '#fff3e0', color: '#e65100' },
  Scheduled:         { bg: '#e8eaf6', color: '#3949ab' },
  Published:         { bg: '#e8f5ee', color: '#1b7a43' },
  Archived:          { bg: '#eceff1', color: '#607d8b' },
};

export const PUBLICATION_STATUS_EMOJI: Record<PublicationStatus, string> = {
  'Waiting Publish': '⏳',
  Scheduled:         '📅',
  Published:         '✅',
  Archived:          '📦',
};

// ─── Versioning ───────────────────────────────────────────────────────────────
// Constitution → VERSIONING: Versi, Tanggal, Editor, Ringkasan Perubahan.

export interface PublicationVersion {
  versi: number;
  tanggal: string;              // ISO datetime
  editor: string;
  ringkasanPerubahan: string;
}

// ─── Audit Trail ──────────────────────────────────────────────────────────────
// Constitution → AUDIT TRAIL: TIDAK boleh dihapus — catatan historis permanen.

export interface PublicationAuditEntry {
  aksi: PublicationAuditAksi;
  timestamp: string;            // ISO datetime
  oleh: string;
  catatan?: string;
}

// ─── Draft ────────────────────────────────────────────────────────────────────
// Isi konten untuk Waiting Publish / Scheduled — digunakan saat Publish.

interface PublicationDraft {
  ringkasan: string;
  isi: string;
  publisher: NewsEventPublisher;
  acara?: NewsEventDetailAcara;
}

// ─── Publication Record ───────────────────────────────────────────────────────

export interface PublicationRecord {
  id: string;                    // primary key record (hardcoded UUID / stable ID)
  newsEventId?: string;          // ID di NEWS_EVENT_LIST setelah Publish
  judul: string;
  tipeKonten: NewsEventTipeKonten;
  cover: string;
  sumberPublikasi: NewsEventSumberPublikasi;
  publisherNama: string;
  workspaceId?: string;
  kategori: NewsEventKategori[];
  tag: string[];
  // Status & Timeline
  status: PublicationStatus;
  approvedAt: string;            // ISO datetime — kapan item ini disetujui
  publishedAt?: string;          // ISO datetime — kapan Published
  scheduledFor?: string;         // ISO datetime — target waktu publish
  scheduledTimezone?: PublicationTimezone;
  archivedAt?: string;           // ISO datetime — kapan Archived
  // Versioning
  currentVersion: number;
  versions: PublicationVersion[];
  // Audit Trail (Constitution → tidak boleh dihapus)
  auditTrail: PublicationAuditEntry[];
  // Revision
  revisionPending: boolean;
  revisionCatatan?: string;
  // Draft content (hanya untuk Waiting Publish / Scheduled)
  draft?: PublicationDraft;
}

// ─── Helper: build PublicationRecord dari item yang sudah Published ────────────

function buildPublishedRecord(item: {
  id: string;
  judul: string;
  tipeKonten: NewsEventTipeKonten;
  cover: string;
  sumberPublikasi: NewsEventSumberPublikasi;
  publisher: { nama: string };
  workspaceId?: string;
  kategori: NewsEventKategori[];
  tag: string[];
  publishDate: string | null;
  createdAt: string;
}): PublicationRecord {
  const publishedAt = item.publishDate
    ? `${item.publishDate}T08:00:00.000Z`
    : `${item.createdAt}T08:00:00.000Z`;
  const approvedAt = item.publishDate
    ? `${item.publishDate}T07:00:00.000Z`
    : `${item.createdAt}T07:00:00.000Z`;
  return {
    id: item.id,                 // gunakan newsEventId sebagai record id untuk item Published
    newsEventId: item.id,
    judul: item.judul,
    tipeKonten: item.tipeKonten,
    cover: item.cover,
    sumberPublikasi: item.sumberPublikasi,
    publisherNama: item.publisher.nama,
    workspaceId: item.workspaceId,
    kategori: item.kategori,
    tag: item.tag,
    status: 'Published',
    approvedAt,
    publishedAt,
    currentVersion: 1,
    versions: [
      {
        versi: 1,
        tanggal: publishedAt,
        editor: 'Admin TernakHub',
        ringkasanPerubahan: 'Publikasi pertama.',
      },
    ],
    auditTrail: [
      {
        aksi: 'Approved',
        timestamp: approvedAt,
        oleh: 'Admin TernakHub',
        catatan: 'Disetujui berdasarkan Validation Report AI.',
      },
      {
        aksi: 'Publish Sekarang',
        timestamp: publishedAt,
        oleh: 'Admin TernakHub',
      },
    ],
    revisionPending: false,
  };
}

// ─── Master List ──────────────────────────────────────────────────────────────
// PUBLICATION_RECORD_LIST dimulai kosong — tidak ada seed/dummy data.
// Record diisi secara runtime melalui publishNow(), getAllPublicationRecords()
// (lazy-sync dari NEWS_EVENT_LIST), dan alur admin lainnya.
// Jika belum ada data, halaman menampilkan Empty State yang sesuai.

export const PUBLICATION_RECORD_LIST: PublicationRecord[] = [];

// ─── Query Helpers ─────────────────────────────────────────────────────────────

/**
 * Kembalikan seluruh Publication Record.
 * Lazy-sync: setiap kali dipanggil, item Published baru di NEWS_EVENT_LIST yang belum
 * terdaftar (dipublikasikan lewat jalur RSS/Submission tanpa publishNow) ditambahkan
 * ke PUBLICATION_RECORD_LIST agar Publication Management selalu up-to-date.
 */
export function getAllPublicationRecords(): PublicationRecord[] {
  const trackedIds = new Set(
    PUBLICATION_RECORD_LIST.flatMap((r) => [r.id, r.newsEventId].filter(Boolean) as string[])
  );
  const untracked = NEWS_EVENT_LIST
    .filter((item) => item.status === 'Published' && !trackedIds.has(item.id))
    .map(buildPublishedRecord);
  if (untracked.length > 0) {
    PUBLICATION_RECORD_LIST.push(...untracked);
  }
  return PUBLICATION_RECORD_LIST;
}

export function getPublicationRecord(id: string): PublicationRecord | undefined {
  return getAllPublicationRecords().find((r) => r.id === id);
}

export function getPublicationRingkasan() {
  const all = getAllPublicationRecords();
  return {
    waitingPublish: all.filter((r) => r.status === 'Waiting Publish').length,
    scheduled:      all.filter((r) => r.status === 'Scheduled').length,
    published:      all.filter((r) => r.status === 'Published').length,
    archived:       all.filter((r) => r.status === 'Archived').length,
    total:          all.length,
  };
}

export type PublicationFilter =
  | 'Semua' | 'Waiting Publish' | 'Scheduled' | 'Published' | 'Archived'
  | 'RSS' | 'Workspace';

export function queryPublicationRecords(params: {
  query?: string;
  filter?: PublicationFilter;
}): PublicationRecord[] {
  const kw = (params.query ?? '').trim().toLowerCase();
  return getAllPublicationRecords().filter((r) => {
    // Filter tab
    const f = params.filter ?? 'Semua';
    if (f === 'Waiting Publish' && r.status !== 'Waiting Publish') return false;
    if (f === 'Scheduled'       && r.status !== 'Scheduled')       return false;
    if (f === 'Published'       && r.status !== 'Published')       return false;
    if (f === 'Archived'        && r.status !== 'Archived')        return false;
    if (f === 'RSS'       && r.sumberPublikasi !== 'Trusted RSS Feed') return false;
    if (f === 'Workspace' && r.sumberPublikasi !== 'Workspace PRO' && r.sumberPublikasi !== 'Workspace Enterprise') return false;
    // Search
    if (!kw) return true;
    const fields = [
      r.judul,
      r.publisherNama,
      r.kategori.join(' '),
      r.tag.join(' '),
      r.tipeKonten,
    ].join(' ').toLowerCase();
    return fields.includes(kw);
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

function nowISO(): string {
  return new Date().toISOString();
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addAudit(rec: PublicationRecord, entry: PublicationAuditEntry): void {
  rec.auditTrail.push(entry);
}

/**
 * Publish Sekarang — satu-satunya jalur yang mendorong item baru ke NEWS_EVENT_LIST.
 * Hanya dapat dipanggil atas item berstatus Waiting Publish atau Scheduled.
 * Constitution → PUBLISH: Audit Trail wajib dicatat.
 */
export function publishNow(
  id: string,
  oleh = 'Admin TernakHub',
  catatan?: string,
): PublicationRecord | undefined {
  const rec = getPublicationRecord(id);
  if (!rec || (rec.status !== 'Waiting Publish' && rec.status !== 'Scheduled')) return rec;

  const ts = nowISO();
  const today = todayDate();

  // Buat NewsEventItem baru di NEWS_EVENT_LIST (jika belum ada)
  if (!rec.newsEventId) {
    const newId = generateUUID();
    const draft = rec.draft;
    NEWS_EVENT_LIST.unshift({
      id: newId,
      tipeKonten: rec.tipeKonten,
      judul: rec.judul,
      ringkasan: draft?.ringkasan ?? '',
      isi: draft?.isi ?? '',
      cover: rec.cover,
      gallery: [],
      publisher: draft?.publisher ?? { nama: rec.publisherNama, tipe: 'Administrator', terverifikasi: true },
      workspaceId: rec.workspaceId,
      kategori: rec.kategori,
      tag: rec.tag,
      status: 'Published',
      sumberPublikasi: rec.sumberPublikasi,
      publishDate: today,
      createdAt: rec.approvedAt.slice(0, 10),
      updatedAt: today,
      isHighlight: false,
      acara: draft?.acara,
    });
    rec.newsEventId = newId;
  }

  // Update Publication Record
  const wasScheduled = rec.status === 'Scheduled';
  rec.status = 'Published';
  rec.publishedAt = ts;
  rec.currentVersion = 1;
  rec.versions = [
    {
      versi: 1,
      tanggal: ts,
      editor: oleh,
      ringkasanPerubahan: 'Publikasi pertama.',
    },
  ];

  addAudit(rec, {
    aksi: wasScheduled ? 'Schedule Triggered' : 'Publish Sekarang',
    timestamp: ts,
    oleh,
    catatan,
  });

  return rec;
}

/**
 * Jadwalkan — simpan jadwal publish. Tidak langsung push ke NEWS_EVENT_LIST.
 * Constitution → SCHEDULE: minimal Tanggal, Jam, Zona Waktu.
 */
export function schedulePublication(
  id: string,
  scheduledDate: string,       // yyyy-mm-dd
  scheduledTime: string,       // HH:mm
  timezone: PublicationTimezone,
  oleh = 'Admin TernakHub',
  catatan?: string,
): PublicationRecord | undefined {
  const rec = getPublicationRecord(id);
  if (!rec || rec.status !== 'Waiting Publish') return rec;

  // Simpan sebagai ISO UTC (pendekatan sederhana: gabungkan date + time, simpan timezone label)
  const scheduledFor = `${scheduledDate}T${scheduledTime}:00.000Z`;
  rec.status = 'Scheduled';
  rec.scheduledFor = scheduledFor;
  rec.scheduledTimezone = timezone;

  addAudit(rec, {
    aksi: 'Jadwalkan',
    timestamp: nowISO(),
    oleh,
    catatan: catatan ?? `Dijadwalkan: ${scheduledDate} ${scheduledTime} ${timezone}.`,
  });

  return rec;
}

/**
 * Trigger Scheduled — dipanggil saat halaman di-mount untuk mensimulasikan
 * auto-trigger jadwal yang sudah jatuh tempo. Idempotent.
 */
export function triggerScheduledPublications(): void {
  const now = new Date().toISOString();
  PUBLICATION_RECORD_LIST
    .filter((r) => r.status === 'Scheduled' && r.scheduledFor && r.scheduledFor <= now)
    .forEach((r) => {
      publishNow(r.id, 'System (Scheduler)', `Auto-triggered dari jadwal ${r.scheduledFor}.`);
    });
}

/**
 * Archive — item dipindah ke Arsip. Tidak muncul di Feed publik.
 * Dapat dipanggil dari status Published maupun Waiting Publish / Scheduled.
 * Constitution → ARCHIVE + AUDIT TRAIL.
 */
export function archivePublication(
  id: string,
  oleh = 'Admin TernakHub',
  catatan?: string,
): PublicationRecord | undefined {
  const rec = getPublicationRecord(id);
  if (!rec || rec.status === 'Archived') return rec;

  // Sync ke NEWS_EVENT_LIST — item tidak lagi tampil di Feed publik
  if (rec.newsEventId) {
    const item = NEWS_EVENT_LIST.find((n) => n.id === rec.newsEventId);
    if (item) item.status = 'Archived';
  }

  rec.status = 'Archived';
  rec.archivedAt = nowISO();

  addAudit(rec, {
    aksi: 'Archive',
    timestamp: rec.archivedAt,
    oleh,
    catatan,
  });

  return rec;
}

/**
 * Ajukan Revisi — Admin meminta revisi konten yang sudah Published.
 * Constitution → VERSIONING: konten Published tidak boleh diedit langsung.
 * Item tetap Published / live selama menunggu versi baru.
 */
export function requestRevision(
  id: string,
  catatan: string,
  oleh = 'Admin TernakHub',
): PublicationRecord | undefined {
  const rec = getPublicationRecord(id);
  if (!rec || rec.status !== 'Published') return rec;
  if (!catatan.trim()) return rec;

  rec.revisionPending = true;
  rec.revisionCatatan = catatan.trim();

  addAudit(rec, {
    aksi: 'Ajukan Revisi',
    timestamp: nowISO(),
    oleh,
    catatan: catatan.trim(),
  });

  return rec;
}

/**
 * Publish Versi Baru — setelah revisi selesai, Admin menerbitkan versi baru.
 * Increment versi, update NEWS_EVENT_LIST updatedAt, catat Audit Trail.
 * Constitution → VERSIONING + AUDIT TRAIL.
 */
export function publishNewVersion(
  id: string,
  ringkasanPerubahan: string,
  editor = 'Admin TernakHub',
): PublicationRecord | undefined {
  const rec = getPublicationRecord(id);
  if (!rec || rec.status !== 'Published') return rec;
  if (!ringkasanPerubahan.trim()) return rec;

  const ts = nowISO();
  const today = todayDate();
  const newVersi = rec.currentVersion + 1;

  rec.currentVersion = newVersi;
  rec.versions.push({
    versi: newVersi,
    tanggal: ts,
    editor,
    ringkasanPerubahan: ringkasanPerubahan.trim(),
  });
  rec.revisionPending = false;
  rec.revisionCatatan = undefined;

  // Update updatedAt di NEWS_EVENT_LIST
  if (rec.newsEventId) {
    const item = NEWS_EVENT_LIST.find((n) => n.id === rec.newsEventId);
    if (item) item.updatedAt = today;
  }

  addAudit(rec, {
    aksi: 'Publish Versi Baru',
    timestamp: ts,
    oleh: editor,
    catatan: `Versi ${newVersi}: ${ringkasanPerubahan.trim()}`,
  });

  return rec;
}
