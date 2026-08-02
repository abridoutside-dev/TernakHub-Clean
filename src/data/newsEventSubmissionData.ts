// ─── News & Event — Workspace Submission (NEWS-004) ──────────────────────────
// Mengikuti docs/architecture/NEWS_EVENT_MODULE_CONSTITUTION.md → WORKSPACE
// SUBMISSION, PUBLICATION WORKFLOW.
//
// Lingkup file ini: Draft, Form News/Event, dan alur Submit (memicu AI
// Validation Engine — lihat newsEventValidationData.ts). Admin Review
// (Approve/Reject/Minta Revisi) & publikasi nyata ke NEWS_EVENT_LIST ada di
// newsEventAdminReviewData.ts (NEWS-005) — dipisah agar tanggung jawab
// masing-masing file tetap jelas.
//
// Tier Workspace (FREE/PRO/ENTERPRISE) disimpan sebagai metadata lokal modul
// ini, mengikuti pola MPK-005 (marketplaceWorkspaceVerifikasiData.ts) — TIDAK
// menambah field baru pada registry WORKSPACES milik TopAppBar.

import { generateUUID } from '../utils/uuid';
import { type NewsEventKategori } from './newsEventData';
import { runAiValidation, type ValidationReport } from './newsEventValidationData';

// ─── Workspace Tier — DISPLAY METADATA ONLY ──────────────────────────────────
//
// WORKSPACE_TIER_MAP dan getWorkspaceTier() adalah metadata TAMPILAN SAJA.
// Mereka TIDAK boleh menentukan hak akses fitur apapun.
//
// Semua keputusan akses fitur WAJIB melalui:
//   SubscriptionFeaturePolicy → FEATURE_GATE → hasFeature() → UI
//
// Referensi: workspaceSubscriptionData.ts (FEATURE_GATE, hasFeature)
//            SubscriptionContext.tsx (useSubscription hook)
//
export type WorkspaceTier = 'FREE' | 'PRO' | 'ENTERPRISE';

/**
 * Tier per Workspace — untuk keperluan DISPLAY/label saja.
 * Tidak digunakan sebagai penjaga akses fitur.
 *
 * Konsisten dengan sumberPublikasi seed NEWS-002/003:
 * w1 (Berkah Farm Garut) → Enterprise; w5 (drh. Amelia Putri) → PRO.
 */
export const WORKSPACE_TIER_MAP: Record<string, WorkspaceTier> = {
  w1: 'ENTERPRISE', // Berkah Farm Garut
  w2: 'FREE',       // Berkah Farm Tasik
  w3: 'PRO',        // Toko Pakan Berkah
  w4: 'FREE',       // Berkah Transport
  w5: 'PRO',        // drh. Amelia Putri
  w6: 'ENTERPRISE', // Klinik Hewan Sejahtera
};

/**
 * Kembalikan tier workspace untuk keperluan DISPLAY/label saja.
 * Jangan gunakan ini untuk menentukan hak akses — gunakan hasFeature() dari
 * workspaceSubscriptionData.ts / useSubscription() dari SubscriptionContext.
 */
export function getWorkspaceTier(workspaceId: string): WorkspaceTier {
  return WORKSPACE_TIER_MAP[workspaceId] ?? 'FREE';
}

/**
 * @deprecated JANGAN gunakan untuk gating fitur.
 *
 * Fungsi ini hanya tersisa untuk kompatibilitas dan tidak lagi menentukan
 * hak akses. Gating News/Event Submission sekarang dilakukan melalui:
 *   hasFeature('event_create') || hasFeature('news_submit')
 * yang bersumber dari workspaceSubscriptionData.ts → FEATURE_GATE.
 */
export function canWorkspaceSubmit(workspaceId: string): boolean {
  return getWorkspaceTier(workspaceId) !== 'FREE';
}

// ─── Jenis Event (Constitution → JENIS EVENT) ───────────────────────────────
// Struktur objek {id,label} — bukan union string statis — agar mudah
// ditambah di masa depan tanpa mengubah tipe relasi manapun.
export interface JenisEventOption {
  id: string;
  label: string;
}

export const JENIS_EVENT_LIST: JenisEventOption[] = [
  { id: 'kontes', label: 'Kontes' },
  { id: 'lomba', label: 'Lomba' },
  { id: 'pameran', label: 'Pameran' },
  { id: 'seminar', label: 'Seminar' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'pelatihan', label: 'Pelatihan' },
  { id: 'gathering', label: 'Gathering' },
  { id: 'kopdar', label: 'Kopdar' },
  { id: 'lelang', label: 'Lelang' },
  { id: 'bazar', label: 'Bazar' },
  { id: 'vaksinasi', label: 'Vaksinasi' },
  { id: 'pemeriksaan-kesehatan-hewan', label: 'Pemeriksaan Kesehatan Hewan' },
  { id: 'sosialisasi', label: 'Sosialisasi' },
  { id: 'launching-produk', label: 'Launching Produk' },
  { id: 'lainnya', label: 'Lainnya' },
];

export function getJenisEventLabel(id: string): string {
  return JENIS_EVENT_LIST.find((j) => j.id === id)?.label ?? id;
}

// ─── Status Submission (Constitution → PUBLICATION WORKFLOW) ───────────────
// Draft → (Submit → AI Validation → AI Report) → Waiting Approval →
// (Admin Review) → Published | Rejected | Revisi Diminta → Archived.
// "Submitted"/"AI Validation"/"AI Report"/"Admin Review" bukan status yang
// disimpan — hanya entri Audit Trail transien (lihat AuditAction), karena
// pada prototipe ini prosesnya sinkron/instan, tidak ada antrian job nyata.
export type SubmissionStatus =
  | 'Draft'
  | 'Waiting Approval'
  | 'Revisi Diminta'
  | 'Published'
  | 'Rejected'
  | 'Archived';

export const RINGKASAN_STATUS_LIST: { status: SubmissionStatus; label: string }[] = [
  { status: 'Draft', label: 'Draft' },
  { status: 'Waiting Approval', label: 'Waiting Approval' },
  { status: 'Revisi Diminta', label: 'Revisi Diminta' },
  { status: 'Published', label: 'Published' },
  { status: 'Rejected', label: 'Rejected' },
];

// ─── Form News (Constitution → FORM NEWS) ───────────────────────────────────
export interface NewsSubmissionForm {
  judul: string;
  ringkasan: string;
  isi: string;
  cover: string; // placeholder emoji — konsisten dgn pola cover di seluruh modul
  gallery: string[]; // opsional, emoji placeholder
  kategori: NewsEventKategori[];
  tag: string[];
  referensi: string; // opsional — link/nama referensi
  sumber: string; // opsional — nama sumber/penulis
}

export function emptyNewsForm(): NewsSubmissionForm {
  return {
    judul: '', ringkasan: '', isi: '', cover: '📰', gallery: [],
    kategori: [], tag: [], referensi: '', sumber: '',
  };
}

// ─── Form Event (Constitution → FORM EVENT, FIELD EVENT) ───────────────────
export interface EventSubmissionForm {
  poster: string; // WAJIB — placeholder emoji, elemen utama Event
  jenisEventId: string; // WAJIB
  namaEvent: string; // WAJIB
  penyelenggara: string; // WAJIB
  lokasi: string; // WAJIB
  tanggalMulai: string; // WAJIB — ISO yyyy-mm-dd
  tanggalSelesai: string; // WAJIB — ISO yyyy-mm-dd
  jamMulai: string; // WAJIB
  jamSelesai: string; // WAJIB
  kontak: string; // WAJIB
  googleMaps: string; // opsional
  linkPendaftaran: string; // opsional
  htm: string; // opsional
  kuota: string; // opsional (string agar input kosong valid)
  sponsor: string; // opsional
  deskripsiSingkat: string; // opsional
  galleryDokumentasi: string[]; // opsional
}

export function emptyEventForm(): EventSubmissionForm {
  return {
    poster: '🗓️', jenisEventId: '', namaEvent: '', penyelenggara: '', lokasi: '',
    tanggalMulai: '', tanggalSelesai: '', jamMulai: '', jamSelesai: '', kontak: '',
    googleMaps: '', linkPendaftaran: '', htm: '', kuota: '', sponsor: '',
    deskripsiSingkat: '', galleryDokumentasi: [],
  };
}

// ─── Audit Trail (Constitution → AUDIT TRAIL) ───────────────────────────────
// Minimal: Draft, AI Validation, Admin Decision, Publish, Archive — dipecah
// lebih rinci di sini (Submit/AI Report/Admin Review/Approve/Reject/Revision)
// sesuai daftar pada spesifikasi NEWS-005.
export type AuditAction =
  | 'Draft'
  | 'Submitted'
  | 'AI Validation'
  | 'AI Report'
  | 'Waiting Approval'
  | 'Admin Review'
  | 'Approved'
  | 'Published'
  | 'Rejected'
  | 'Revisi Diminta'
  | 'Archived';

export interface RiwayatSubmissionEntry {
  tanggal: string; // ISO datetime
  aksi: AuditAction;
  catatan?: string;
}

// ─── Submission Record ───────────────────────────────────────────────────────
export interface SubmissionRecord {
  id: string;
  tipeKonten: 'News' | 'Event';
  workspaceId: string;
  workspaceName: string; // denormalized — snapshot nama Workspace saat dibuat
  status: SubmissionStatus;
  news?: NewsSubmissionForm;
  event?: EventSubmissionForm;
  validationReport?: ValidationReport;
  alasanRejected?: string;
  catatanRevisi?: string;
  /** Hanya terisi jika status Published dan sudah memiliki konten publik terkait. */
  publishedNewsEventId?: string;
  riwayat: RiwayatSubmissionEntry[];
  createdAt: string;
  updatedAt: string;
}

export function catatRiwayat(rec: SubmissionRecord, aksi: AuditAction, catatan?: string) {
  rec.riwayat.push({ tanggal: new Date().toISOString(), aksi, catatan });
}

// ─── Submission Store ─────────────────────────────────────────────────────────
// SUBMISSION_LIST dimulai kosong — tidak ada seed/dummy data.
// Record diisi melalui createDraftNews() / createDraftEvent() saat workspace
// mengajukan konten baru. Jika belum ada submission, halaman menampilkan
// Empty State yang sesuai.

export const SUBMISSION_LIST: SubmissionRecord[] = [];

// ─── Query & Mutation Helpers ─────────────────────────────────────────────────

export function getSubmissionsByWorkspace(workspaceId: string): SubmissionRecord[] {
  return SUBMISSION_LIST.filter((s) => s.workspaceId === workspaceId);
}

export function getSubmissionById(id: string): SubmissionRecord | undefined {
  return SUBMISSION_LIST.find((s) => s.id === id);
}

export function getRingkasanCounts(workspaceId: string): Record<string, number> {
  const list = getSubmissionsByWorkspace(workspaceId);
  const count = (pred: (s: SubmissionRecord) => boolean) => list.filter(pred).length;
  return {
    Draft: count((s) => s.status === 'Draft'),
    'Waiting Approval': count((s) => s.status === 'Waiting Approval'),
    'Revisi Diminta': count((s) => s.status === 'Revisi Diminta'),
    Published: count((s) => s.status === 'Published'),
    Rejected: count((s) => s.status === 'Rejected'),
  };
}

export function createDraftNews(workspaceId: string, workspaceName: string, form: NewsSubmissionForm): SubmissionRecord {
  const now = new Date().toISOString();
  const rec: SubmissionRecord = {
    id: generateUUID(), tipeKonten: 'News', workspaceId, workspaceName,
    status: 'Draft', news: form, riwayat: [], createdAt: now.slice(0, 10), updatedAt: now.slice(0, 10),
  };
  catatRiwayat(rec, 'Draft');
  SUBMISSION_LIST.unshift(rec);
  return rec;
}

export function createDraftEvent(workspaceId: string, workspaceName: string, form: EventSubmissionForm): SubmissionRecord {
  const now = new Date().toISOString();
  const rec: SubmissionRecord = {
    id: generateUUID(), tipeKonten: 'Event', workspaceId, workspaceName,
    status: 'Draft', event: form, riwayat: [], createdAt: now.slice(0, 10), updatedAt: now.slice(0, 10),
  };
  catatRiwayat(rec, 'Draft');
  SUBMISSION_LIST.unshift(rec);
  return rec;
}

export function updateDraftNews(id: string, form: NewsSubmissionForm) {
  const rec = getSubmissionById(id);
  if (!rec || rec.tipeKonten !== 'News') return;
  rec.news = form;
  rec.updatedAt = new Date().toISOString().slice(0, 10);
}

export function updateDraftEvent(id: string, form: EventSubmissionForm) {
  const rec = getSubmissionById(id);
  if (!rec || rec.tipeKonten !== 'Event') return;
  rec.event = form;
  rec.updatedAt = new Date().toISOString().slice(0, 10);
}

export function deleteDraft(id: string) {
  const idx = SUBMISSION_LIST.findIndex((s) => s.id === id && s.status === 'Draft');
  if (idx >= 0) SUBMISSION_LIST.splice(idx, 1);
}

export function archiveSubmission(id: string) {
  const rec = getSubmissionById(id);
  if (!rec || rec.status !== 'Published') return;
  rec.status = 'Archived';
  rec.updatedAt = new Date().toISOString().slice(0, 10);
  catatRiwayat(rec, 'Archived');
}

/**
 * Submit (dan Submit Ulang dari Rejected/Revisi Diminta) — Workflow: Draft →
 * Submitted → AI Validation → AI Report (Constitution → PUBLICATION
 * WORKFLOW) → Waiting Approval. Admin Review (Approve/Reject/Minta Revisi)
 * BUKAN cakupan file ini — lihat newsEventAdminReviewData.ts (NEWS-005).
 */
export function submitSubmission(id: string): SubmissionRecord | undefined {
  const rec = getSubmissionById(id);
  if (!rec) return undefined;
  if (rec.status !== 'Draft' && rec.status !== 'Rejected' && rec.status !== 'Revisi Diminta') return rec;

  catatRiwayat(rec, 'Submitted');
  catatRiwayat(rec, 'AI Validation');

  const report = runAiValidation(rec);
  rec.validationReport = report;
  catatRiwayat(rec, 'AI Report', report.ringkasan);

  rec.alasanRejected = undefined;
  rec.catatanRevisi = undefined;
  rec.status = 'Waiting Approval';
  rec.updatedAt = new Date().toISOString().slice(0, 10);
  catatRiwayat(rec, 'Waiting Approval', 'Menunggu Admin Review.');
  return rec;
}
