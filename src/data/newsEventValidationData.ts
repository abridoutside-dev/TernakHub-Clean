// ─── News & Event — AI Validation Engine (NEWS-005) ──────────────────────────
// Mengikuti docs/architecture/NEWS_EVENT_MODULE_CONSTITUTION.md → AI
// VALIDATION, AI VALIDATION NEWS, AI VALIDATION EVENT, AI OUTPUT.
//
// AI BUKAN pengambil keputusan (Constitution → AI VALIDATION, ADMIN REVIEW).
// Engine ini HANYA menghasilkan Validation Report (Temuan/Bukti/Warning/
// Risiko/Confidence/Rekomendasi) — tidak pernah memanggil approve/reject.
//
// CATATAN JUJUR: Prototipe frontend-only tanpa backend/model vision/LLM
// sungguhan. Seluruh pemeriksaan di bawah adalah analisis berbasis-aturan
// (rule-based, deterministik terhadap data yang benar-benar diisi pengguna)
// — bukan simulasi acak, dan bukan hasil model AI nyata. "OCR Poster" tetap
// memakai simulasi deterministik (hash id) yang sudah dibangun pada NEWS-004,
// dilabeli jelas sebagai simulasi di UI Admin Review.

import { getAllNewsEvent, type NewsEventKategori } from './newsEventData';
import {
  JENIS_EVENT_LIST,
  getJenisEventLabel,
  type EventSubmissionForm,
  type NewsSubmissionForm,
  type SubmissionRecord,
} from './newsEventSubmissionData';

// ─── Struktur Validation Report (Constitution → AI OUTPUT) ──────────────────
export type TemuanSeverity = 'Info' | 'Warning' | 'Risiko';

export interface ValidationFinding {
  kategori: string; // item checklist, misal "Duplikasi Artikel"
  severity: TemuanSeverity;
  detail: string;
}

export type RekomendasiAi = 'Layak Dipublikasikan' | 'Perlu Revisi' | 'Ditolak';

export const REKOMENDASI_EMOJI: Record<RekomendasiAi, string> = {
  'Layak Dipublikasikan': '🟢',
  'Perlu Revisi': '🟡',
  Ditolak: '🔴',
};

export interface ValidationReport {
  ranAt: string; // ISO datetime
  ringkasan: string;
  temuan: ValidationFinding[];
  bukti: string[];
  warning: string[];
  risiko: string[];
  confidence: number; // 0-100
  rekomendasi: RekomendasiAi;
  saran: string[];
  ocrExtracted?: Record<string, string>; // hanya Event — simulasi OCR Poster
}

// ─── Simulasi OCR Poster (deterministik, dilabeli jelas sebagai simulasi) ───
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function shiftTanggal(iso: string, hari: number): string {
  if (!iso) return iso;
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + hari);
  return d.toISOString().slice(0, 10);
}

function simulasiOcrPoster(id: string, form: EventSubmissionForm): Record<string, string> {
  const seed = hashString(id);
  const ocr: Record<string, string> = {
    'Nama Event': form.namaEvent,
    'Jenis Event': getJenisEventLabel(form.jenisEventId),
    Tanggal: form.tanggalMulai,
    Jam: form.jamMulai,
    Lokasi: form.lokasi,
    Kontak: form.kontak,
    HTM: form.htm || '-',
    'Link Pendaftaran': form.linkPendaftaran || '-',
  };
  const skenario = seed % 4;
  if (skenario === 0 && form.tanggalMulai) {
    ocr.Tanggal = shiftTanggal(form.tanggalMulai, -1);
  } else if (skenario === 1) {
    ocr.Kontak = '-';
  } else if (skenario === 2) {
    const idxLain = (JENIS_EVENT_LIST.findIndex((j) => j.id === form.jenisEventId) + 1) % JENIS_EVENT_LIST.length;
    ocr['Jenis Event'] = JENIS_EVENT_LIST[idxLain]?.label ?? ocr['Jenis Event'];
  }
  // skenario === 3 → Poster konsisten dengan Form (tidak ada perbedaan).
  return ocr;
}

// Kata kunci sederhana untuk heuristik Potensi Hoaks/Clickbait — deteksi
// berbasis-aturan, bukan model NLP sungguhan.
const HOAX_TRIGGER_WORDS = ['wabah nasional', 'darurat nasional', 'terbukti ampuh 100%', 'rahasia yang disembunyikan'];
const CLICKBAIT_MARKERS = ['!!!', 'wow', 'gempar', 'bikin heboh'];

function overlapKataKunci(a: string, b: string): boolean {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const wordsB = b.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  return wordsB.some((w) => wordsA.has(w));
}

function tambah(temuan: ValidationFinding[], kategori: string, severity: TemuanSeverity, detail: string) {
  temuan.push({ kategori, severity, detail });
}

// ─── Validasi News (Constitution → AI VALIDATION NEWS + checklist tambahan) ──
function validateNews(rec: SubmissionRecord, form: NewsSubmissionForm): ValidationFinding[] {
  const temuan: ValidationFinding[] = [];

  // Kredibilitas sumber & Penulis
  if (!form.sumber.trim()) {
    tambah(temuan, 'Kredibilitas Sumber', 'Warning', 'Sumber/Penulis tidak dicantumkan (Constitution → NEWS PRINCIPLE mewajibkan Sumber).');
  } else {
    tambah(temuan, 'Kredibilitas Sumber', 'Info', `Sumber tercantum: "${form.sumber}".`);
  }

  // Kredibilitas domain / Referensi
  if (!form.referensi.trim()) {
    tambah(temuan, 'Referensi', 'Warning', 'Referensi belum dilampirkan — disarankan jika tersedia (Constitution → NEWS PRINCIPLE).');
  } else if (!/^https?:\/\//i.test(form.referensi.trim()) && !form.referensi.trim().includes(' ')) {
    tambah(temuan, 'Kredibilitas Domain', 'Info', `Referensi tercantum: "${form.referensi}".`);
  } else {
    tambah(temuan, 'Kredibilitas Domain', 'Info', 'Referensi berupa link — domain tidak dapat diverifikasi otomatis pada prototipe ini.');
  }

  // Tanggal
  tambah(temuan, 'Tanggal', 'Info', `Draft dibuat ${rec.createdAt}, diperbarui ${rec.updatedAt}.`);

  // Duplikasi Artikel — hanya dibandingkan terhadap konten Published (publik)
  const judulLower = form.judul.trim().toLowerCase();
  const duplikatExact = judulLower.length > 0 && getAllNewsEvent().some((item) => item.judul.trim().toLowerCase() === judulLower);
  if (duplikatExact) {
    tambah(temuan, 'Duplikasi Artikel', 'Risiko', 'Judul identik dengan konten yang sudah Published — kemungkinan duplikasi.');
  } else {
    const duplikatMirip = getAllNewsEvent().some((item) => item.tipeKonten === 'News' && overlapKataKunci(item.judul, form.judul));
    if (duplikatMirip) {
      tambah(temuan, 'Duplikasi Artikel', 'Warning', 'Judul memiliki kata kunci serupa dengan artikel Published lain — periksa potensi duplikasi topik.');
    } else {
      tambah(temuan, 'Duplikasi Artikel', 'Info', 'Tidak ditemukan artikel Published dengan judul yang identik/serupa.');
    }
  }

  // Bahasa & Potensi Clickbait
  const judulUpper = form.judul.trim();
  const isAllCaps = judulUpper.length > 6 && judulUpper === judulUpper.toUpperCase() && /[A-Z]/.test(judulUpper);
  const clickbaitHit = CLICKBAIT_MARKERS.some((m) => judulUpper.toLowerCase().includes(m));
  if (isAllCaps || clickbaitHit) {
    tambah(temuan, 'Potensi Clickbait', 'Warning', 'Judul menggunakan gaya penulisan yang berpotensi clickbait (huruf kapital penuh / kata sensasional).');
  } else {
    tambah(temuan, 'Bahasa', 'Info', 'Gaya bahasa judul wajar, tidak terdeteksi pola clickbait.');
  }

  // Potensi Hoaks
  const gabunganTeks = `${form.judul} ${form.ringkasan} ${form.isi}`.toLowerCase();
  const hoaxHit = HOAX_TRIGGER_WORDS.some((w) => gabunganTeks.includes(w));
  if (hoaxHit && !form.referensi.trim()) {
    tambah(temuan, 'Potensi Hoaks', 'Risiko', 'Ditemukan klaim berisiko tanpa Referensi pendukung — berpotensi tidak dapat dipertanggungjawabkan.');
  } else if (hoaxHit) {
    tambah(temuan, 'Potensi Hoaks', 'Warning', 'Ditemukan klaim berisiko — pastikan Referensi yang dilampirkan benar-benar mendukung klaim tersebut.');
  }

  // Kesesuaian Kategori & Tag
  if (form.kategori.length === 0) {
    tambah(temuan, 'Kesesuaian Kategori', 'Warning', 'Belum ada Kategori dipilih — memengaruhi keterbacaan pada listing publik.');
  } else {
    tambah(temuan, 'Kesesuaian Kategori', 'Info', `Kategori: ${form.kategori.join(', ')}.`);
  }
  if (form.tag.length === 0) {
    tambah(temuan, 'Tag', 'Info', 'Tidak ada Tag ditambahkan (opsional).');
  }

  // Kelengkapan Data
  if (form.ringkasan.trim().length < 30) {
    tambah(temuan, 'Kelengkapan Data', 'Warning', 'Ringkasan sangat singkat (<30 karakter) — pertimbangkan menambah konteks.');
  }
  if (form.isi.trim().length < 80) {
    tambah(temuan, 'Kelengkapan Data', 'Warning', 'Isi Artikel sangat singkat (<80 karakter) — informasi mungkin belum lengkap.');
  }

  // Konsistensi Isi
  if (form.ringkasan.trim() && form.isi.trim() && !overlapKataKunci(form.ringkasan, form.isi)) {
    tambah(temuan, 'Konsistensi Isi', 'Warning', 'Ringkasan tidak memiliki kata kunci yang sama dengan Isi Artikel — periksa konsistensi.');
  } else {
    tambah(temuan, 'Konsistensi Isi', 'Info', 'Ringkasan konsisten dengan Isi Artikel.');
  }

  // Bukti Pendukung
  if (!form.referensi.trim() && !form.sumber.trim()) {
    tambah(temuan, 'Bukti Pendukung', 'Warning', 'Tidak ada bukti pendukung (Sumber/Referensi) yang dapat diverifikasi.');
  }

  return temuan;
}

// ─── Validasi Event (Constitution → AI VALIDATION EVENT + checklist tambahan) ─
function validateEvent(rec: SubmissionRecord, form: EventSubmissionForm, ocr: Record<string, string>): ValidationFinding[] {
  const temuan: ValidationFinding[] = [];

  tambah(temuan, 'Nama Event', form.namaEvent.trim() ? 'Info' : 'Risiko', form.namaEvent.trim() ? `Nama Event: "${form.namaEvent}".` : 'Nama Event tidak terisi.');
  tambah(temuan, 'Jenis Event', form.jenisEventId ? 'Info' : 'Risiko', form.jenisEventId ? `Jenis Event: ${getJenisEventLabel(form.jenisEventId)}.` : 'Jenis Event tidak dipilih.');
  tambah(temuan, 'Penyelenggara', form.penyelenggara.trim() ? 'Info' : 'Risiko', form.penyelenggara.trim() ? `Penyelenggara: "${form.penyelenggara}".` : 'Penyelenggara tidak dapat dipertanggungjawabkan (Constitution → EVENT PRINCIPLE).');
  tambah(temuan, 'Lokasi', form.lokasi.trim() ? 'Info' : 'Risiko', form.lokasi.trim() ? `Lokasi: "${form.lokasi}".` : 'Lokasi tidak terisi.');

  if (!form.googleMaps.trim()) {
    tambah(temuan, 'Google Maps', 'Info', 'Titik Google Maps tidak dilampirkan (opsional).');
  }

  tambah(temuan, 'Tanggal', form.tanggalMulai && form.tanggalSelesai ? 'Info' : 'Risiko', form.tanggalMulai ? `Tanggal: ${form.tanggalMulai} – ${form.tanggalSelesai}.` : 'Tanggal tidak lengkap.');
  tambah(temuan, 'Jam', form.jamMulai && form.jamSelesai ? 'Info' : 'Warning', form.jamMulai ? `Jam: ${form.jamMulai} – ${form.jamSelesai}.` : 'Jam tidak lengkap.');
  tambah(temuan, 'Kontak', form.kontak.trim() ? 'Info' : 'Risiko', form.kontak.trim() ? `Kontak: "${form.kontak}".` : 'Kontak tidak dilampirkan (Constitution → EVENT PRINCIPLE).');

  if (!form.htm.trim()) {
    tambah(temuan, 'HTM', 'Info', 'Biaya/HTM tidak dicantumkan (opsional).');
  }
  if (!form.linkPendaftaran.trim()) {
    tambah(temuan, 'Link Pendaftaran', 'Info', 'Link Pendaftaran tidak dilampirkan (opsional).');
  }
  if (!form.sponsor.trim()) {
    tambah(temuan, 'Sponsor', 'Info', 'Sponsor tidak dicantumkan (opsional).');
  }

  // OCR Poster & Konsistensi Poster dengan Form
  const jenisLabel = getJenisEventLabel(form.jenisEventId);
  if (ocr.Tanggal !== form.tanggalMulai) {
    tambah(temuan, 'Konsistensi Poster', 'Warning', `Tanggal pada Poster (simulasi OCR: ${ocr.Tanggal}) berbeda dengan Tanggal Form (${form.tanggalMulai}).`);
  }
  if (ocr.Kontak === '-' && form.kontak) {
    tambah(temuan, 'Konsistensi Poster', 'Warning', 'Kontak tidak ditemukan pada Poster (simulasi OCR).');
  }
  if (ocr['Jenis Event'] !== jenisLabel) {
    tambah(temuan, 'Konsistensi Poster', 'Warning', `Jenis Event pada Poster (simulasi OCR: "${ocr['Jenis Event']}") tidak sesuai dengan Form ("${jenisLabel}").`);
  }
  if (ocr.Tanggal === form.tanggalMulai && ocr.Kontak !== '-' && ocr['Jenis Event'] === jenisLabel) {
    tambah(temuan, 'Konsistensi Poster', 'Info', 'Informasi Poster (simulasi OCR) konsisten dengan Form.');
  }

  // Event Duplikat & Jadwal Bentrok — dibandingkan terhadap Event Published
  const namaLower = form.namaEvent.trim().toLowerCase();
  const publishedEvents = getAllNewsEvent().filter((item) => item.tipeKonten === 'Event' && item.acara);
  const duplikat = namaLower.length > 0 && publishedEvents.some((item) => item.judul.trim().toLowerCase() === namaLower);
  if (duplikat) {
    tambah(temuan, 'Event Duplikat', 'Risiko', 'Nama Event identik dengan Event lain yang sudah Published.');
  } else {
    tambah(temuan, 'Event Duplikat', 'Info', 'Tidak ditemukan Event Published dengan nama identik.');
  }

  const bentrok = publishedEvents.some((item) => {
    const a = item.acara!;
    if (a.lokasi.trim().toLowerCase() !== form.lokasi.trim().toLowerCase() || !form.lokasi.trim()) return false;
    const mulaiA = a.jadwalMulai;
    const selesaiA = a.jadwalSelesai || a.jadwalMulai;
    if (!form.tanggalMulai) return false;
    const mulaiB = form.tanggalMulai;
    const selesaiB = form.tanggalSelesai || form.tanggalMulai;
    return mulaiA <= selesaiB && mulaiB <= selesaiA;
  });
  if (bentrok) {
    tambah(temuan, 'Jadwal Bentrok', 'Warning', 'Jadwal berpotensi bentrok dengan Event Published lain di lokasi yang sama.');
  }

  return temuan;
}

function hitungConfidence(temuan: ValidationFinding[]): number {
  let score = 100;
  for (const t of temuan) {
    if (t.severity === 'Risiko') score -= 18;
    if (t.severity === 'Warning') score -= 8;
  }
  return Math.max(5, Math.min(98, score));
}

function tentukanRekomendasi(temuan: ValidationFinding[]): RekomendasiAi {
  if (temuan.some((t) => t.severity === 'Risiko')) return 'Ditolak';
  if (temuan.some((t) => t.severity === 'Warning')) return 'Perlu Revisi';
  return 'Layak Dipublikasikan';
}

/**
 * Jalankan AI Validation Engine untuk satu Submission. HANYA menghasilkan
 * Validation Report — TIDAK pernah mengubah status Submission atau membuat
 * keputusan Approve/Reject/Publish (Constitution → AI VALIDATION).
 */
export function runAiValidation(rec: SubmissionRecord): ValidationReport {
  let temuan: ValidationFinding[];
  let ocrExtracted: Record<string, string> | undefined;

  if (rec.tipeKonten === 'News' && rec.news) {
    temuan = validateNews(rec, rec.news);
  } else if (rec.tipeKonten === 'Event' && rec.event) {
    ocrExtracted = simulasiOcrPoster(rec.id, rec.event);
    temuan = validateEvent(rec, rec.event, ocrExtracted);
  } else {
    temuan = [];
  }

  const risiko = temuan.filter((t) => t.severity === 'Risiko').map((t) => `${t.kategori}: ${t.detail}`);
  const warning = temuan.filter((t) => t.severity === 'Warning').map((t) => `${t.kategori}: ${t.detail}`);
  const bukti = temuan.filter((t) => t.severity === 'Info').map((t) => `${t.kategori}: ${t.detail}`);
  const confidence = hitungConfidence(temuan);
  const rekomendasi = tentukanRekomendasi(temuan);
  const risikoDanWarning = [...risiko, ...warning];
  const saran = risikoDanWarning.length > 0
    ? risikoDanWarning.map((s) => `Tinjau: ${s.split(':')[0]}`)
    : ['Tidak ada saran perbaikan — konten sudah lengkap.'];

  const ringkasan = risiko.length > 0
    ? `${risiko.length} Risiko dan ${warning.length} Warning ditemukan — rekomendasi AI: ${rekomendasi}.`
    : warning.length > 0
      ? `${warning.length} Warning ditemukan, tidak ada Risiko — rekomendasi AI: ${rekomendasi}.`
      : `Tidak ada temuan bermasalah — rekomendasi AI: ${rekomendasi}.`;

  return {
    ranAt: new Date().toISOString(),
    ringkasan,
    temuan,
    bukti,
    warning,
    risiko,
    confidence,
    rekomendasi,
    saran: Array.from(new Set(saran)),
    ocrExtracted,
  };
}

export type { NewsEventKategori };
