// ─────────────────────────────────────────────────────────────────────────────
// DB-006 — Dashboard Alert & Reminder
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Alert = peringatan yang WAJIB segera ditindaklanjuti (Critical/High).
// Reminder = pengingat yang belum bersifat kritis.
// Alert & Reminder BUKAN AI Insight — AI Insight memberi analisis/rekomendasi,
// Alert/Reminder murni memberi peringatan/pengingat berbasis kondisi data.
//
// File ini TIDAK memiliki database sendiri — seluruh item dibaca live setiap
// kali getAlerts()/getDashboardAlerts() dipanggil, langsung dari modul asal:
//   • Livestock   ← src/data/livestockData.ts, src/utils/livestockSummary.ts
//   • Feed        ← src/data/stokInventarisData.ts
//   • Medicine    ← src/data/stokObatData.ts
//   • Health      ← src/data/livestockData.ts (getHealthHistory, status Sakit)
//   • News/Event  ← src/data/newsEventData.ts (hanya status Published)
//
// Marketplace & Workspace tetap terdaftar sebagai Data Source yang SAH untuk
// Alert (lihat Constitution), namun belum ada builder aktif untuk keduanya —
// struktur di bawah ini didesain agar builder baru cukup ditambahkan tanpa
// mengubah komponen render (lihat "EXTENSIBLE" di bawah).
//
// Tidak ada tulis-menulis ke modul manapun dari file ini — murni agregator
// baca-saja. Alert TIDAK dapat di-dismiss permanen selama kondisi pemicu
// masih berlaku (Constitution → ALERT).
//
// EXTENSIBLE: menambah Alert baru hanya perlu:
//   1. Tambah builder function `build<Nama>Alert()` yang mengembalikan
//      `AlertItem | null` (null bila kondisi pemicu tidak terjadi).
//   2. Panggil builder tersebut di dalam `buildAllAlerts()`.
// Tidak perlu mengubah komponen render maupun tipe AlertPriority/AlertCategory.
// ─────────────────────────────────────────────────────────────────────────────

import { LIVESTOCK_DB, getHealthHistory, getWeightHistory } from './livestockData';
import { buildIndividuList, buildOutsideIndividu } from '../utils/livestockSummary';
import { getInventarisList } from './stokInventarisData';
import { STOK_OBAT_ITEMS, getStatusStok } from './stokObatData';
import { getAllNewsEvent } from './newsEventData';

// ─── Priority (Alert ≠ AI Insight → skala prioritas sendiri) ─────────────────
// Urutan tampil: Critical → High → Reminder (Constitution → PRIORITAS).
export type AlertPriority = 'critical' | 'high' | 'reminder';

export const ALERT_PRIORITY_META: Record<
  AlertPriority,
  { icon: string; label: string; color: string; bg: string; order: number }
> = {
  critical: { icon: '🔴', label: 'Critical', color: '#b3261e', bg: '#fdecea', order: 0 },
  high:     { icon: '🟠', label: 'High',     color: '#a35a00', bg: '#fff3e0', order: 1 },
  reminder: { icon: '🟡', label: 'Reminder', color: '#8a7000', bg: '#fffbe0', order: 2 },
};

// ─── Category (mengikuti Data Source Constitution) ───────────────────────────
export type AlertCategory = 'Livestock' | 'Feed' | 'Medicine' | 'Health' | 'Event';

export const ALERT_CATEGORY_META: Record<AlertCategory, { icon: string; label: string }> = {
  Livestock: { icon: '🐑', label: 'Livestock' },
  Feed:      { icon: '🌾', label: 'Feed' },
  Medicine:  { icon: '💊', label: 'Medicine' },
  Health:    { icon: '🩺', label: 'Health' },
  Event:     { icon: '📅', label: 'Event' },
};

// ─── Card (Constitution → CARD: Icon, Judul, Ringkasan singkat, Priority
// Badge, tombol "Buka Modul" — tidak ada deskripsi panjang/info teknis/log) ──
export interface AlertAction {
  label: 'Buka Modul';
  route: string;
}

export interface AlertItem {
  id: string;
  priority: AlertPriority;
  category: AlertCategory;
  icon: string;
  title: string;
  summary: string;
  sourceModule: string;
  action: AlertAction;
}

export type AlertState = 'ok' | 'empty' | 'error';

export interface AlertResult {
  state: AlertState;
  items: AlertItem[];
}

// ─── Helper tanggal (sama seperti todayActivityData.ts) ──────────────────────
// Shared via src/utils/dateUtils.ts — do NOT duplicate here.
import { parseFlexibleDateToIso, todayIso } from '../utils/dateUtils';

function addDaysIso(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── 1. Medicine — Obat hampir habis / habis ← Stok Obat ─────────────────────
// 🔴 Critical (Constitution → ALERT YANG DITAMPILKAN, contoh: "Obat hampir habis").

function buildMedicineAlert(): AlertItem | null {
  const items = STOK_OBAT_ITEMS.filter((i) => !i.diarsipkan && i.statusAktif !== 'Nonaktif');
  const kritis = items.filter((i) => {
    const status = getStatusStok(i);
    return status === 'Habis' || status === 'Hampir Habis';
  });
  if (kritis.length === 0) return null;

  const habisCount = kritis.filter((i) => getStatusStok(i) === 'Habis').length;
  return {
    id: 'alert-medicine-low-stock',
    priority: 'critical',
    category: 'Medicine',
    icon: '🔴',
    title: 'Obat hampir habis',
    summary: habisCount > 0
      ? `${kritis.length} batch obat perlu perhatian (${habisCount} sudah habis).`
      : `${kritis.length} batch obat hampir habis.`,
    sourceModule: 'Stok Obat',
    action: { label: 'Buka Modul', route: '/stok-obat' },
  };
}

// ─── 2. Feed — Stok pakan kritis ← Stok Pakan ────────────────────────────────
// 🔴 Critical (Constitution → ALERT YANG DITAMPILKAN, contoh: "Stok pakan kritis").

function buildFeedAlert(): AlertItem | null {
  const list = getInventarisList().filter((i) => !i.diarsipkan);
  const habis = list.filter((i) => i.status === 'Habis');
  if (habis.length === 0) return null;

  return {
    id: 'alert-feed-critical',
    priority: 'critical',
    category: 'Feed',
    icon: '🔴',
    title: 'Stok pakan kritis',
    summary: `${habis.length} item stok pakan sudah habis dan perlu segera diisi ulang.`,
    sourceModule: 'Stok Pakan',
    action: { label: 'Buka Modul', route: '/stok-pakan' },
  };
}

// ─── 3. Health — Jadwal vaksin hari ini ← Livestock (getHealthHistory) ──────
// 🟠 High (Constitution → ALERT YANG DITAMPILKAN, contoh: "Jadwal vaksin hari ini").
// "Jadwal" dibaca dari HealthEntry ber-activity Vaksinasi yang tanggalnya hari
// ini dan status-nya belum "Selesai" (masih terjadwal, bukan riwayat selesai).

function buildVaccineScheduleAlert(today: string): AlertItem | null {
  let count = 0;
  for (const lv of Object.values(LIVESTOCK_DB)) {
    for (const entry of getHealthHistory(lv.id)) {
      if (entry.activity !== 'Vaksinasi') continue;
      const iso = parseFlexibleDateToIso(entry.date);
      if (iso !== today) continue;
      if (entry.status === 'Selesai') continue;
      count += 1;
    }
  }
  if (count === 0) return null;

  return {
    id: 'alert-vaccine-schedule-today',
    priority: 'high',
    category: 'Health',
    icon: '🟠',
    title: 'Jadwal vaksin hari ini',
    summary: `${count} ternak dijadwalkan vaksinasi hari ini.`,
    sourceModule: 'Livestock',
    action: { label: 'Buka Modul', route: '/livestock' },
  };
}

// ─── 4. Health — Ada ternak sakit ← Livestock (status kesehatan) ────────────
// 🟠 High (Constitution → ALERT YANG DITAMPILKAN, contoh: "Ada ternak sakit").

function buildSickLivestockAlert(): AlertItem | null {
  const all = [...buildIndividuList(), ...buildOutsideIndividu()];
  const sakit = all.filter((lv) => lv.status === 'Sakit').length;
  if (sakit === 0) return null;

  return {
    id: 'alert-livestock-sick',
    priority: 'high',
    category: 'Health',
    icon: '🟠',
    title: 'Ada ternak sakit',
    summary: `${sakit} ternak berstatus Sakit dan perlu ditangani.`,
    sourceModule: 'Livestock',
    action: { label: 'Buka Modul', route: '/livestock' },
  };
}

// ─── 5. Event — Event besok ← News & Event (hanya status Published) ────────
// 🟡 Reminder (Constitution → ALERT YANG DITAMPILKAN, contoh: "Event besok").

function buildEventTomorrowAlert(today: string): AlertItem | null {
  const tomorrow = addDaysIso(today, 1);
  const events = getAllNewsEvent().filter(
    (n) => n.status === 'Published' && n.tipeKonten === 'Event' && n.acara,
  );

  const besok = events.find((n) => {
    const mulai = n.acara!.jadwalMulai;
    const selesai = n.acara!.jadwalSelesai ?? mulai;
    return mulai <= tomorrow && tomorrow <= selesai;
  });
  if (!besok) return null;

  return {
    id: `alert-event-tomorrow-${besok.id}`,
    priority: 'reminder',
    category: 'Event',
    icon: '🟡',
    title: 'Event besok',
    summary: `${besok.acara!.namaEvent} — ${besok.acara!.lokasi}`,
    sourceModule: 'News & Event',
    action: { label: 'Buka Modul', route: `/news-event/${besok.id}` },
  };
}

// ─── 6. Livestock — Bobot belum dicatat ← Livestock (getWeightHistory) ──────
// 🟡 Reminder (Constitution → ALERT YANG DITAMPILKAN, contoh: "Bobot belum dicatat").
// Ternak Di Kandang dianggap "belum dicatat" bila tidak ada entri bobot dalam
// 7 hari terakhir (termasuk yang belum pernah dicatat sama sekali).

function buildWeightNotRecordedAlert(today: string): AlertItem | null {
  const aktif = buildIndividuList();
  if (aktif.length === 0) return null;

  const sevenDaysAgo = addDaysIso(today, -7);
  const belumDicatat = aktif.filter((lv) => {
    const history = getWeightHistory(lv.id);
    return !history.some((entry) => {
      const iso = parseFlexibleDateToIso(entry.date);
      return iso !== null && iso >= sevenDaysAgo && iso <= today;
    });
  });
  if (belumDicatat.length === 0) return null;

  return {
    id: 'alert-weight-not-recorded',
    priority: 'reminder',
    category: 'Livestock',
    icon: '🟡',
    title: 'Bobot belum dicatat',
    summary: `${belumDicatat.length} ternak belum dicatat bobotnya dalam 7 hari terakhir.`,
    sourceModule: 'Livestock',
    action: { label: 'Buka Modul', route: '/catat-bobot' },
  };
}

// ─── Agregator utama ──────────────────────────────────────────────────────────

function buildAllAlerts(now: Date): AlertItem[] {
  const today = todayIso(now);

  const items = [
    buildMedicineAlert(),
    buildFeedAlert(),
    buildVaccineScheduleAlert(today),
    buildSickLivestockAlert(),
    buildEventTomorrowAlert(today),
    buildWeightNotRecordedAlert(today),
  ].filter((item): item is AlertItem => item !== null);

  items.sort((a, b) => ALERT_PRIORITY_META[a.priority].order - ALERT_PRIORITY_META[b.priority].order);
  return items;
}

/**
 * Live-computed Alert & Reminder — dipanggil langsung di body komponen
 * (tidak di-cache/disimpan) sehingga selalu mencerminkan kondisi terbaru
 * dari seluruh modul sumber. Mengembalikan SELURUH Alert (dipakai halaman
 * "Lihat Semua Alert") — urut Critical → High → Reminder.
 */
export function getAlerts(now: Date = new Date()): AlertResult {
  try {
    const items = buildAllAlerts(now);
    return { state: items.length === 0 ? 'empty' : 'ok', items };
  } catch {
    return { state: 'error', items: [] };
  }
}

export const DASHBOARD_ALERT_LIMIT = 3;

/**
 * Ringkasan Alert untuk Dashboard (Constitution → PRIORITAS: maksimal 3
 * Alert). Bila ada Critical, Reminder boleh disembunyikan dari ringkasan ini
 * (Constitution → REMINDER) — daftar lengkap tetap terlihat di halaman
 * "Lihat Semua Alert" lewat getAlerts().
 */
export function getDashboardAlerts(now: Date = new Date()): AlertResult {
  const result = getAlerts(now);
  if (result.state !== 'ok') return result;

  const hasCritical = result.items.some((item) => item.priority === 'critical');
  const visible = hasCritical ? result.items.filter((item) => item.priority !== 'reminder') : result.items;

  return { state: 'ok', items: visible.slice(0, DASHBOARD_ALERT_LIMIT) };
}
