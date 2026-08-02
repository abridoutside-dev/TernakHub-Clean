// ─── RP-010: Riwayat Reproduksi (Reproduction History) ──────────────────────
// Riwayat Reproduksi adalah lapisan agregasi & pengayaan READ-ONLY di atas
// Timeline yang sudah dibangun RP-002..RP-009 — modul ini TIDAK membuat
// record baru, TIDAK menduplikasi data, dan TIDAK mengubah satu pun fungsi
// getFullTimelineForProgram di rantai sebelumnya (monitoringReproduksiData.ts
// → pemeriksaanKebuntinganData.ts → kebuntinganData.ts → kelahiranData.ts →
// registrasiAnakData.ts → sapihData.ts). getFullTimelineForProgram yang
// dipanggil di sini SELALU versi terakhir (sapihData.ts), yang sudah
// menggabungkan seluruh rantai sebelumnya.
//
// Tugas modul ini hanya dua:
//  1. Menggabungkan Timeline SEMUA Program menjadi satu Riwayat lintas-modul,
//     terbaru → terlama (getAllReproduksiHistory).
//  2. Memperkaya setiap Event dengan referensi yang SUDAH ADA pada Event itu
//     sendiri (program, livestock, offspring terkait) — tidak menebak/
//     menyimpan apa pun yang tidak sudah tersedia di ReproduksiEvent.
//
// Search & Filter (RiwayatFilters) meng-clone pola MonitoringSearchFilterSection
// (RP-004) — search/programId/eventType/petugas/status — ditambah dua facet
// yang diminta roadmap ini: Livestock dan Rentang Tanggal (dari/sampai).
// Dibuat sebagai tipe terpisah (bukan mengubah MonitoringFilters) supaya
// GlobalMonitoringSection (RP-004) tidak tersentuh sama sekali.

import {
  getProgramList,
  type ReproduksiProgramRecord,
} from './reproduksiProgramData';
import {
  EVENT_TYPE_LIST,
  type EventType,
  type ReproduksiEvent,
} from './monitoringReproduksiData';
import { getFullTimelineForProgram } from './sapihData';
import {
  getLivestock,
  LIVESTOCK_DB,
  type LivestockRecord,
} from './livestockData';
import {
  getKelahiranById,
  getAnakListByKelahiran,
  type AnakRecord,
} from './kelahiranData';

export { EVENT_TYPE_LIST };

// ─── Riwayat Entry (Event + relasi yang sudah diperkaya) ────────────────────

export type ReproduksiHistoryEntry = {
  event: ReproduksiEvent;
  program: ReproduksiProgramRecord | null;
  /** Livestock (biasanya dam, atau ternak baru bila sudah didaftarkan) — null bila Event tidak memiliki rujukan Livestock. */
  livestock: LivestockRecord | null;
  /** Anak (offspring) dari Kelahiran terkait — hanya diisi untuk Event yang secara langsung membahas Kelahiran/Anak/Sapih. */
  offspring: AnakRecord[];
};

/** Event type yang relevan menampilkan daftar Anak (offspring) terkait pada Detail. */
const OFFSPRING_RELATED_EVENT_TYPES: EventType[] = [
  'Melahirkan', 'Kelahiran Selesai', 'Anak Lahir', 'Lahir Mati', 'Kematian Neonatal',
  'Anak Didaftarkan', 'Ternak Terdaftar', 'Sapih Direncanakan', 'Sapih Dimulai',
  'Sapih Selesai', 'Sapih Dibatalkan',
];

function resolveOffspring(event: ReproduksiEvent): AnakRecord[] {
  if (!event.kelahiranId) return [];
  if (!OFFSPRING_RELATED_EVENT_TYPES.includes(event.eventType)) return [];
  return getAnakListByKelahiran(event.kelahiranId);
}

function sortHistoryTerbaruKeTerlama(a: ReproduksiEvent, b: ReproduksiEvent): number {
  const aKey = `${a.timestamp}T${a.jam ?? '00:00'}`;
  const bKey = `${b.timestamp}T${b.jam ?? '00:00'}`;
  return aKey === bKey ? 0 : (aKey < bKey ? 1 : -1);
}

/**
 * Seluruh Event Reproduksi lintas SEMUA Program, terbaru → terlama — dasar
 * Riwayat Reproduksi (RP-010). Murni membaca & memperkaya Timeline yang
 * sudah ada; tidak menyimpan/menduplikasi data apa pun.
 */
export function getAllReproduksiHistory(): ReproduksiHistoryEntry[] {
  const programs = getProgramList();
  const programsById = new Map(programs.map((p) => [p.id, p]));

  const events = programs.flatMap((p) => getFullTimelineForProgram(p)).sort(sortHistoryTerbaruKeTerlama);

  return events.map((event) => ({
    event,
    program: programsById.get(event.programId) ?? null,
    livestock: event.livestockId ? getLivestock(event.livestockId) : null,
    offspring: resolveOffspring(event),
  }));
}

// ─── Search & Filter (RP-010) ───────────────────────────────────────────────

export type RiwayatFilters = {
  search: string;
  eventType: string;   // '' = Semua Event Type
  programId: string;   // '' = Semua Program
  livestockId: string; // '' = Semua Livestock
  petugas: string;     // '' = semua petugas
  status: string;      // '' = Semua Status (hanya berlaku untuk Event bersumber Monitoring)
  tanggalMulai: string;   // yyyy-mm-dd, '' = tanpa batas bawah
  tanggalSelesai: string; // yyyy-mm-dd, '' = tanpa batas atas
};

export function emptyRiwayatFilters(): RiwayatFilters {
  return {
    search: '', eventType: '', programId: '', livestockId: '',
    petugas: '', status: '', tanggalMulai: '', tanggalSelesai: '',
  };
}

export function matchesRiwayatFilters(entry: ReproduksiHistoryEntry, filters: RiwayatFilters): boolean {
  const { event, program, livestock } = entry;

  if (filters.programId && event.programId !== filters.programId) return false;
  if (filters.eventType && event.eventType !== filters.eventType) return false;
  if (filters.livestockId && event.livestockId !== filters.livestockId) return false;
  if (filters.petugas && !event.petugas.toLowerCase().includes(filters.petugas.toLowerCase())) return false;
  if (filters.status) {
    if (event.source !== 'monitoring' || !event.monitoring || event.monitoring.status !== filters.status) return false;
  }
  if (filters.tanggalMulai && event.timestamp < filters.tanggalMulai) return false;
  if (filters.tanggalSelesai && event.timestamp > filters.tanggalSelesai) return false;

  if (filters.search) {
    const haystack = [
      event.eventType, event.catatan ?? '', event.petugas,
      program?.namaProgram ?? '', program?.nomorProgram ?? '',
      livestock?.name ?? '', livestock?.id ?? '',
    ].join(' ').toLowerCase();
    if (!haystack.includes(filters.search.toLowerCase())) return false;
  }

  return true;
}

// ─── Validasi Integritas (read-only audit — tidak mengubah data) ───────────

export type ReproduksiHistoryIntegrityIssue = { eventId: string; reason: string };

export type ReproduksiHistoryIntegrityReport = {
  totalEvents: number;
  issues: ReproduksiHistoryIntegrityIssue[];
  isValid: boolean;
};

/**
 * Audit pasif atas Riwayat Reproduksi — memverifikasi:
 *  - Urutan Timeline konsisten (terbaru → terlama).
 *  - Setiap Event UUID unik (tidak ada duplikat lintas Program).
 *  - Setiap Event memiliki Program yang benar-benar ada (tidak ada orphan).
 *  - Livestock/Kelahiran yang dirujuk Event (bila ada) benar-benar terdaftar.
 * Tidak mengubah data apa pun — murni pelaporan untuk verifikasi RP-010.
 */
export function auditReproduksiHistoryIntegrity(): ReproduksiHistoryIntegrityReport {
  const history = getAllReproduksiHistory();
  const issues: ReproduksiHistoryIntegrityIssue[] = [];
  const seenIds = new Set<string>();

  history.forEach((entry, i) => {
    const { event, program } = entry;

    if (seenIds.has(event.eventId)) {
      issues.push({ eventId: event.eventId, reason: 'Event UUID duplikat pada Riwayat.' });
    }
    seenIds.add(event.eventId);

    if (!program) {
      issues.push({ eventId: event.eventId, reason: `Event tidak memiliki Program terkait (orphan) — programId "${event.programId}" tidak ditemukan.` });
    }

    if (event.livestockId && !(event.livestockId in LIVESTOCK_DB)) {
      issues.push({ eventId: event.eventId, reason: `Livestock terkait "${event.livestockId}" tidak ditemukan di registry.` });
    }

    if (event.kelahiranId && !getKelahiranById(event.kelahiranId)) {
      issues.push({ eventId: event.eventId, reason: `Data Kelahiran terkait "${event.kelahiranId}" tidak ditemukan.` });
    }

    if (i > 0) {
      const prevKey = `${history[i - 1].event.timestamp}T${history[i - 1].event.jam ?? '00:00'}`;
      const curKey = `${event.timestamp}T${event.jam ?? '00:00'}`;
      if (curKey > prevKey) {
        issues.push({ eventId: event.eventId, reason: 'Urutan Riwayat tidak konsisten (bukan terbaru → terlama).' });
      }
    }
  });

  return { totalEvents: history.length, issues, isValid: issues.length === 0 };
}
