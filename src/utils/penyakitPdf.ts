/**
 * penyakitPdf.ts
 *
 * Generates and downloads a PDF for a single Master Penyakit entry.
 * Uses jsPDF text API (no html2canvas) — suitable for structured data documents.
 * No new library dependencies; jsPDF is already a project dependency.
 */

import jsPDF from 'jspdf';
import type { PenyakitListItem } from '../data/daftarPenyakitData';
import type { PenyakitDetail } from '../data/penyakitDetailData';
import type { ReferensiObatPenyakit } from '../data/penyakitReferensiObatData';

// ── Layout constants (all in mm, portrait A4) ─────────────────────────────────
const MARGIN    = 14;
const PAGE_W    = 210;
const PAGE_H    = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE_H    = 5.5;
const FOOTER_H  = 16;

// ── Colour palette (R, G, B) ──────────────────────────────────────────────────
type RGB = [number, number, number];
const CLR_PRIMARY : RGB = [2,   119, 189];
const CLR_RED     : RGB = [198,  40,  40];
const CLR_ORANGE  : RGB = [230,  81,   0];
const CLR_PURPLE  : RGB = [106,  27, 154];
const CLR_GREEN   : RGB = [27,  122,  67];
const CLR_WHITE   : RGB = [255, 255, 255];
const CLR_DARK    : RGB = [30,   30,  30];
const CLR_MUTED   : RGB = [100, 100, 100];
const CLR_BROWN   : RGB = [93,   64,  55];
const CLR_BROWN_LT: RGB = [141, 110,  99];
const CLR_WARN_BG : RGB = [255, 248, 225];
const CLR_WARN_BD : RGB = [255, 224, 130];

// ── Utilities ─────────────────────────────────────────────────────────────────

function pad2(n: number): string { return String(n).padStart(2, '0'); }

function nowTimestamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function buildFilename(item: PenyakitListItem): string {
  const d    = new Date();
  const date = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
  const time = `${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
  const slug = item.namaPenyakit
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return `penyakit-${slug}-${date}-${time}.pdf`;
}

// ── Internal builder helpers ───────────────────────────────────────────────────

interface BuilderState {
  doc: jsPDF;
  y: number;
  pageNum: number;
  ts: string;
}

function checkPage(s: BuilderState, needed = LINE_H * 2): void {
  if (s.y + needed > PAGE_H - FOOTER_H) {
    addFooter(s);
    s.doc.addPage();
    s.pageNum++;
    s.y = MARGIN;
  }
}

function addFooter(s: BuilderState): void {
  s.doc.setFontSize(8);
  s.doc.setFont('helvetica', 'normal');
  s.doc.setTextColor(...CLR_MUTED);
  s.doc.text(
    `TernakHub — Master Penyakit  |  Halaman ${s.pageNum}  |  Diekspor: ${s.ts}`,
    MARGIN,
    PAGE_H - 8,
  );
  s.doc.setTextColor(...CLR_DARK);
}

function gap(s: BuilderState, mm = 4): void { s.y += mm; }

function addHeader(s: BuilderState): void {
  s.doc.setFillColor(...CLR_PRIMARY);
  s.doc.rect(0, 0, PAGE_W, 18, 'F');
  s.doc.setFontSize(12);
  s.doc.setFont('helvetica', 'bold');
  s.doc.setTextColor(...CLR_WHITE);
  s.doc.text('TernakHub  —  Master Referensi Penyakit', MARGIN, 12);
  s.doc.setTextColor(...CLR_DARK);
  s.y = 24;
}

function addTitle(s: BuilderState, namaPenyakit: string, namaIlmiah?: string | null): void {
  s.doc.setFontSize(16);
  s.doc.setFont('helvetica', 'bold');
  s.doc.setTextColor(...CLR_PRIMARY);
  const lines = s.doc.splitTextToSize(namaPenyakit, CONTENT_W) as string[];
  s.doc.text(lines, MARGIN, s.y);
  s.y += lines.length * 7;

  if (namaIlmiah) {
    s.doc.setFontSize(10);
    s.doc.setFont('helvetica', 'italic');
    s.doc.setTextColor(...CLR_MUTED);
    s.doc.text(namaIlmiah, MARGIN, s.y);
    s.y += 6;
  }
  s.doc.setTextColor(...CLR_DARK);
  gap(s, 3);
}

function sectionTitle(s: BuilderState, title: string, color: RGB): void {
  checkPage(s, 14);
  s.doc.setFillColor(...color);
  s.doc.rect(MARGIN, s.y, CONTENT_W, 7, 'F');
  s.doc.setFontSize(9);
  s.doc.setFont('helvetica', 'bold');
  s.doc.setTextColor(...CLR_WHITE);
  s.doc.text(title.toUpperCase(), MARGIN + 3, s.y + 5);
  s.doc.setTextColor(...CLR_DARK);
  s.y += 10;
}

function labelValue(s: BuilderState, label: string, value: string): void {
  checkPage(s, LINE_H * 2);
  const LABEL_W = 44;
  s.doc.setFontSize(8);
  s.doc.setFont('helvetica', 'bold');
  s.doc.setTextColor(...CLR_MUTED);
  s.doc.text(label, MARGIN, s.y);
  s.doc.setFont('helvetica', 'normal');
  s.doc.setTextColor(...CLR_DARK);
  const wrapped = s.doc.splitTextToSize(value, CONTENT_W - LABEL_W) as string[];
  s.doc.text(wrapped, MARGIN + LABEL_W, s.y);
  s.y += Math.max(LINE_H, wrapped.length * LINE_H);
}

function sublabel(s: BuilderState, label: string, color: RGB = CLR_MUTED): void {
  checkPage(s, LINE_H);
  s.doc.setFontSize(8);
  s.doc.setFont('helvetica', 'bold');
  s.doc.setTextColor(...color);
  s.doc.text(label, MARGIN + 2, s.y);
  s.doc.setTextColor(...CLR_DARK);
  s.y += LINE_H;
}

function bodyText(s: BuilderState, text: string): void {
  checkPage(s, LINE_H * 2);
  s.doc.setFontSize(9);
  s.doc.setFont('helvetica', 'normal');
  s.doc.setTextColor(...CLR_DARK);
  const lines = s.doc.splitTextToSize(text, CONTENT_W - 4) as string[];
  for (const line of lines) {
    checkPage(s, LINE_H);
    s.doc.text(line, MARGIN + 2, s.y);
    s.y += LINE_H;
  }
}

function bulletList(s: BuilderState, items: string[], ordered = false): void {
  items.forEach((item, idx) => {
    const prefix = ordered ? `${idx + 1}.` : '-';
    const full   = `${prefix} ${item}`;
    const wrapped = s.doc.splitTextToSize(full, CONTENT_W - 10) as string[];
    wrapped.forEach((line, li) => {
      checkPage(s, LINE_H);
      s.doc.setFontSize(9);
      s.doc.setFont('helvetica', 'normal');
      s.doc.setTextColor(...CLR_DARK);
      s.doc.text(line, MARGIN + (li === 0 ? 4 : 9), s.y);
      s.y += LINE_H;
    });
  });
}

function addDisclaimer(s: BuilderState): void {
  const text = [
    'Data ini adalah referensi edukasi umum untuk membantu deteksi dini.',
    'Diagnosis dan penanganan penyakit pada ternak harus berdasarkan pemeriksaan',
    'klinis langsung dan petunjuk dokter hewan. Penggunaan obat harus sesuai anjuran',
    'dan memperhatikan withdrawal time sebelum hasil ternak dikonsumsi.',
  ].join(' ');

  const textLines = s.doc.splitTextToSize(text, CONTENT_W - 8) as string[];
  const boxH = 6 + textLines.length * LINE_H + 4;
  checkPage(s, boxH + 4);

  s.doc.setFillColor(...CLR_WARN_BG);
  s.doc.setDrawColor(...CLR_WARN_BD);
  s.doc.roundedRect(MARGIN, s.y, CONTENT_W, boxH, 2, 2, 'FD');
  s.y += 5;

  s.doc.setFontSize(8);
  s.doc.setFont('helvetica', 'bold');
  s.doc.setTextColor(...CLR_BROWN);
  s.doc.text('CATATAN PENGGUNAAN', MARGIN + 3, s.y);
  s.y += LINE_H;

  s.doc.setFont('helvetica', 'normal');
  s.doc.setTextColor(...CLR_BROWN_LT);
  s.doc.text(textLines, MARGIN + 3, s.y);
  s.y += textLines.length * LINE_H + 4;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates and triggers download of a PDF for the given Penyakit entry.
 *
 * @param item           PenyakitListItem basis data
 * @param jenisTernakNama Human-readable livestock type name
 * @param kategoriNama   Human-readable disease category name
 * @param detail         Optional extended data (gejala, penyebab, etc.)
 * @param referensiObat  Optional list of referenced drugs
 */
export function downloadPenyakitPdf(
  item: PenyakitListItem,
  jenisTernakNama: string,
  kategoriNama: string,
  detail: PenyakitDetail | undefined,
  referensiObat: ReferensiObatPenyakit[],
): void {
  const s: BuilderState = {
    doc    : new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }),
    y      : MARGIN,
    pageNum: 1,
    ts     : nowTimestamp(),
  };

  // ── Page 1 header + disease title ──────────────────────────────────────────
  addHeader(s);
  addTitle(s, item.namaPenyakit, item.namaIlmiah);

  // ── Informasi Umum ────────────────────────────────────────────────────────
  sectionTitle(s, 'Informasi Umum', CLR_PRIMARY);
  labelValue(s, 'Nama Penyakit', item.namaPenyakit);
  if (item.namaIlmiah) labelValue(s, 'Nama Ilmiah', item.namaIlmiah);
  labelValue(s, 'Jenis Ternak', jenisTernakNama);
  labelValue(s, 'Kategori', kategoriNama);
  labelValue(s, 'Tingkat Keparahan', item.tingkatKeparahan);
  labelValue(s, 'Tingkat Penularan', item.tingkatPenularan);
  labelValue(s, 'Status', item.status);
  gap(s, 2);
  sublabel(s, 'DESKRIPSI SINGKAT');
  bodyText(s, item.ringkasan);
  gap(s, 6);

  if (detail) {
    // ── Gejala ──────────────────────────────────────────────────────────────
    sectionTitle(s, 'Gejala', CLR_RED);
    sublabel(s, 'GEJALA AWAL', CLR_ORANGE);
    bulletList(s, detail.gejalaAwal);
    gap(s, 2);
    sublabel(s, 'GEJALA LANJUTAN', CLR_RED);
    bulletList(s, detail.gejalaLanjutan);
    if (detail.komplikasi.length > 0) {
      gap(s, 2);
      sublabel(s, 'KOMPLIKASI', [183, 28, 28]);
      bulletList(s, detail.komplikasi);
    }
    gap(s, 6);

    // ── Penyebab & Penularan ────────────────────────────────────────────────
    sectionTitle(s, 'Penyebab & Penularan', CLR_PURPLE);
    sublabel(s, 'PENYEBAB', CLR_PURPLE);
    bodyText(s, detail.penyebab);
    gap(s, 2);
    sublabel(s, 'CARA PENULARAN', CLR_PURPLE);
    bulletList(s, detail.caraPenularan);
    gap(s, 2);
    sublabel(s, 'FAKTOR RISIKO', CLR_ORANGE);
    bulletList(s, detail.faktorRisiko);
    gap(s, 6);

    // ── Penanganan & Pencegahan ─────────────────────────────────────────────
    sectionTitle(s, 'Penanganan & Pencegahan', CLR_GREEN);
    sublabel(s, 'LANGKAH PENANGANAN', CLR_ORANGE);
    bulletList(s, detail.penanganan, true);
    gap(s, 2);
    sublabel(s, 'PENCEGAHAN', CLR_GREEN);
    bulletList(s, detail.pencegahan);
    if (detail.catatan) {
      gap(s, 2);
      sublabel(s, 'CATATAN PENTING', CLR_PRIMARY);
      bodyText(s, detail.catatan);
    }
    gap(s, 6);
  } else {
    // Detail belum tersedia
    sectionTitle(s, 'Detail Lengkap', CLR_MUTED);
    bodyText(s, 'Detail gejala, penyebab, penanganan, dan pencegahan untuk penyakit ini belum tersedia dan akan ditambahkan pada pembaruan berikutnya.');
    gap(s, 6);
  }

  // ── Referensi Obat ────────────────────────────────────────────────────────
  if (referensiObat.length > 0) {
    sectionTitle(s, 'Referensi Obat', CLR_PURPLE);
    referensiObat.forEach((ref) => {
      sublabel(s, ref.obat.namaGenerik, CLR_DARK);
      labelValue(s, 'Golongan', ref.obat.golonganObat);
      labelValue(s, 'Bentuk Sediaan', ref.obat.bentukSediaan);
      labelValue(s, 'Kandungan Aktif', ref.obat.kandunganAktif);
      labelValue(s, 'Withdrawal Time', ref.obat.withdrawalTime);
      if (ref.produkKomersial.length > 0) {
        sublabel(s, 'Produk Komersial:', CLR_MUTED);
        bulletList(s, ref.produkKomersial.map((p) => `${p.namaKomersial ?? p.nama} (${p.brandNama})`));
      }
      gap(s, 3);
    });
    gap(s, 3);
  }

  // ── Disclaimer ────────────────────────────────────────────────────────────
  addDisclaimer(s);

  // Finalise and save
  addFooter(s);
  s.doc.save(buildFilename(item));
}
