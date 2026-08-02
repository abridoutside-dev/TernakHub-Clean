// ─── News & Event — Admin Review & Publication (NEWS-005) ────────────────────
// Mengikuti docs/architecture/NEWS_EVENT_MODULE_CONSTITUTION.md → ADMIN
// REVIEW, PUBLICATION WORKFLOW, AUDIT TRAIL.
//
// AI tidak pernah memutuskan Approve/Reject/Publish — hanya file ini yang
// mengeksekusi keputusan Admin (Approve/Reject/Minta Revisi), dan hanya
// Approve yang menghasilkan konten Published nyata pada NEWS_EVENT_LIST.

import {
  NEWS_EVENT_LIST,
  type NewsEventDetailAcara,
  type NewsEventItem,
  type NewsEventPublisher,
} from './newsEventData';
import {
  catatRiwayat,
  getWorkspaceTier,
  SUBMISSION_LIST,
  type SubmissionRecord,
} from './newsEventSubmissionData';
import { generateUUID } from '../utils/uuid';

// ─── Daftar Submission untuk Admin Review ───────────────────────────────────
export function getWaitingApprovalList(): SubmissionRecord[] {
  return SUBMISSION_LIST.filter((s) => s.status === 'Waiting Approval');
}

export function getAllSubmissionsForAdmin(): SubmissionRecord[] {
  return SUBMISSION_LIST;
}

// ─── Admin Dashboard Ringkasan (NEWS-005 → ADMIN DASHBOARD) ─────────────────
// "Waiting Validation" selalu 0 pada prototipe ini karena AI Validation
// berjalan sinkron saat submit — tidak ada antrian nyata.
export interface AdminRingkasan {
  waitingValidation: number;
  waitingApproval: number;
  published: number;
  revision: number;
  rejected: number;
  total: number;
}

export function getAdminRingkasan(): AdminRingkasan {
  const all = SUBMISSION_LIST;
  return {
    waitingValidation: 0, // sinkron — tidak pernah berada di state ini
    waitingApproval: all.filter((s) => s.status === 'Waiting Approval').length,
    published: all.filter((s) => s.status === 'Published').length,
    revision: all.filter((s) => s.status === 'Revisi Diminta').length,
    rejected: all.filter((s) => s.status === 'Rejected').length,
    total: all.length,
  };
}

// ─── Helper: Confidence Level Label ─────────────────────────────────────────
// Threshold: ≥70 → Tinggi, 40-69 → Sedang, <40 → Rendah.
export type ConfidenceLevel = 'Tinggi' | 'Sedang' | 'Rendah';

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 70) return 'Tinggi';
  if (confidence >= 40) return 'Sedang';
  return 'Rendah';
}

export const CONFIDENCE_LEVEL_EMOJI: Record<ConfidenceLevel, string> = {
  Tinggi: '🟢',
  Sedang: '🟡',
  Rendah: '🔴',
};

export const CONFIDENCE_LEVEL_COLOR: Record<ConfidenceLevel, { bg: string; color: string }> = {
  Tinggi: { bg: '#e8f5ee', color: '#1b7a43' },
  Sedang: { bg: '#fff8e1', color: '#7b5e2a' },
  Rendah: { bg: '#fbe1e1', color: '#a02020' },
};

// ─── Alasan Reject (Admin wajib memilih atau menambahkan) ───────────────────
export const REJECT_ALASAN_OPTIONS: string[] = [
  'Informasi tidak dapat dipertanggungjawabkan',
  'Poster/Form tidak konsisten',
  'Terindikasi duplikasi/plagiasi',
  'Terindikasi hoaks atau clickbait',
  'Data tidak lengkap',
  'Melanggar Constitution / bukan konten yang relevan',
];

function buildPublisher(rec: SubmissionRecord): NewsEventPublisher {
  const tier = getWorkspaceTier(rec.workspaceId);
  return {
    nama: rec.workspaceName,
    tipe: tier === 'ENTERPRISE' ? 'Workspace Enterprise' : 'Workspace PRO',
    terverifikasi: true,
    workspaceId: rec.workspaceId,
  };
}

function buildAcara(rec: SubmissionRecord): NewsEventDetailAcara | undefined {
  if (!rec.event) return undefined;
  const kuota = rec.event.kuota.trim() ? Number(rec.event.kuota) : undefined;
  return {
    namaEvent: rec.event.namaEvent,
    penyelenggara: rec.event.penyelenggara,
    lokasi: rec.event.lokasi,
    jadwalMulai: rec.event.tanggalMulai,
    jadwalSelesai: rec.event.tanggalSelesai || undefined,
    jam: rec.event.jamMulai ? `${rec.event.jamMulai} – ${rec.event.jamSelesai}` : undefined,
    kontak: rec.event.kontak,
    poster: rec.event.poster,
    linkPendaftaran: rec.event.linkPendaftaran || undefined,
    biaya: rec.event.htm || undefined,
    kuota: Number.isFinite(kuota) ? kuota : undefined,
  };
}

/** Ubah Submission (News/Event) menjadi NewsEventItem publik yang nyata. */
function submissionToNewsEventItem(rec: SubmissionRecord): NewsEventItem {
  const tier = getWorkspaceTier(rec.workspaceId);
  const sumberPublikasi = tier === 'ENTERPRISE' ? 'Workspace Enterprise' : 'Workspace PRO';
  const today = new Date().toISOString().slice(0, 10);

  if (rec.tipeKonten === 'News' && rec.news) {
    return {
      id: rec.publishedNewsEventId ?? generateUUID(),
      tipeKonten: 'News',
      judul: rec.news.judul,
      ringkasan: rec.news.ringkasan,
      isi: rec.news.isi,
      cover: rec.news.cover,
      gallery: rec.news.gallery.map((emoji, i) => ({ id: `${rec.id}-g${i}`, url: emoji })),
      publisher: buildPublisher(rec),
      workspaceId: rec.workspaceId,
      kategori: rec.news.kategori,
      tag: rec.news.tag,
      status: 'Published',
      sumberPublikasi,
      publishDate: today,
      createdAt: rec.createdAt,
      updatedAt: today,
      isHighlight: false,
    };
  }

  return {
    id: rec.publishedNewsEventId ?? generateUUID(),
    tipeKonten: 'Event',
    judul: rec.event!.namaEvent,
    ringkasan: rec.event!.deskripsiSingkat || rec.event!.namaEvent,
    isi: rec.event!.deskripsiSingkat || '',
    cover: rec.event!.poster,
    gallery: rec.event!.galleryDokumentasi.map((emoji, i) => ({ id: `${rec.id}-g${i}`, url: emoji })),
    publisher: buildPublisher(rec),
    workspaceId: rec.workspaceId,
    kategori: ['Event'],
    tag: [],
    status: 'Published',
    sumberPublikasi,
    publishDate: today,
    createdAt: rec.createdAt,
    updatedAt: today,
    acara: buildAcara(rec),
    isHighlight: false,
  };
}

/**
 * Admin Approve — satu-satunya jalur yang menghasilkan konten Published
 * nyata. Admin TIDAK memvalidasi dari awal (Constitution → ADMIN REVIEW);
 * Approve hanya dapat dipanggil atas Submission berstatus "Waiting Approval"
 * yang sudah memiliki Validation Report dari AI.
 */
export function approveSubmission(id: string, catatanAdmin?: string): SubmissionRecord | undefined {
  const rec = SUBMISSION_LIST.find((s) => s.id === id);
  if (!rec || rec.status !== 'Waiting Approval') return rec;

  catatRiwayat(rec, 'Admin Review', 'Admin membaca Validation Report AI.');
  catatRiwayat(rec, 'Approved', catatanAdmin);

  const item = submissionToNewsEventItem(rec);
  if (rec.publishedNewsEventId) {
    const idx = NEWS_EVENT_LIST.findIndex((n) => n.id === rec.publishedNewsEventId);
    if (idx >= 0) NEWS_EVENT_LIST[idx] = item;
    else NEWS_EVENT_LIST.unshift(item);
  } else {
    NEWS_EVENT_LIST.unshift(item);
  }

  rec.publishedNewsEventId = item.id;
  rec.status = 'Published';
  rec.updatedAt = new Date().toISOString().slice(0, 10);
  catatRiwayat(rec, 'Published', 'Dipublikasikan ke listing publik.');
  return rec;
}

/**
 * Admin Reject — alasan WAJIB dipilih/ditambahkan (spec → REJECT). Alasan AI
 * (Validation Report) tetap tersimpan apa adanya, tidak ditimpa.
 */
export function rejectSubmission(id: string, alasanTerpilih: string[], catatanTambahan?: string): SubmissionRecord | undefined {
  const rec = SUBMISSION_LIST.find((s) => s.id === id);
  if (!rec || rec.status !== 'Waiting Approval') return rec;
  if (alasanTerpilih.length === 0 && !catatanTambahan?.trim()) return rec;

  const alasan = [...alasanTerpilih, catatanTambahan?.trim()].filter(Boolean).join('; ');
  rec.alasanRejected = alasan;
  rec.status = 'Rejected';
  rec.updatedAt = new Date().toISOString().slice(0, 10);

  catatRiwayat(rec, 'Admin Review', 'Admin membaca Validation Report AI.');
  catatRiwayat(rec, 'Rejected', alasan);
  return rec;
}

/**
 * Admin Minta Revisi — Submission kembali ke Publisher untuk diperbaiki,
 * lalu Submit Ulang akan menjalankan AI Validation kembali (spec → REVISI).
 */
export function requestRevisionSubmission(id: string, catatan: string): SubmissionRecord | undefined {
  const rec = SUBMISSION_LIST.find((s) => s.id === id);
  if (!rec || rec.status !== 'Waiting Approval') return rec;
  if (!catatan.trim()) return rec;

  rec.catatanRevisi = catatan.trim();
  rec.status = 'Revisi Diminta';
  rec.updatedAt = new Date().toISOString().slice(0, 10);

  catatRiwayat(rec, 'Admin Review', 'Admin membaca Validation Report AI.');
  catatRiwayat(rec, 'Revisi Diminta', catatan.trim());
  return rec;
}
