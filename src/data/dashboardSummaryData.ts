// ─── Dashboard Summary Card — Data Adapter ─────────────────────────────────
// DB-004 — Dashboard Summary Card
// DB-004R — Revisi: 6 Card (2×3 di mobile) + Card baru "Active Batch".
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Summary Card BUKAN tempat menghitung data, BUKAN tempat menyimpan data.
// File ini HANYA membaca live selector yang sudah tersedia dari modul asal
// (Livestock, Feed Stock, Medicine Stock, Business Insight, Batch Module)
// dan merangkainya menjadi bentuk siap-tampil untuk Dashboard. Tidak ada
// logika bisnis baru, tidak ada penyimpanan data, tidak ada duplikasi angka
// yang sudah dihitung oleh modul asal (mis. jumlahTernak/estimasiNilaiUsaha
// dari Business Insight tetap dibaca dari getRingkasanBI(), bukan dihitung
// ulang di sini; Active Batch dibaca langsung dari BATCH_DB, bukan disalin).
//
// EXTENSIBLE: menambah card baru (Reproduction, Batch, Production, Finance,
// AI Score, dst.) hanya perlu:
//   1. Tambah satu id baru + builder function di CARD_BUILDERS.
//   2. Tambah id tersebut ke SUMMARY_CARD_ORDER pada posisi yang diinginkan.
// Tidak perlu mengubah komponen render (AiInsight-style) maupun urutan card
// lain — struktur ini yang membuat "mudah diubah melalui konfigurasi".

import { buildIndividuList, buildOutsideIndividu } from '../utils/livestockSummary';
import { getRingkasanBI, formatRupiah } from './businessInsightData';
import { getInventarisList } from './stokInventarisData';
import { STOK_OBAT_ITEMS, getStatusStok } from './stokObatData';
import { BATCH_DB } from './batchData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SummaryCardId = 'health' | 'livestock' | 'feed' | 'medicine' | 'business' | 'batch' | string;

export type SummaryCardState = 'ok' | 'empty' | 'error';

export interface SummaryCardAction {
  label: 'Lihat Detail' | 'Buka Modul';
  route: string;
}

export interface SummaryCardData {
  id: SummaryCardId;
  icon: string;
  title: string;
  /** Nilai siap-tampil. "—" atau "Belum tersedia" bila data belum ada. */
  value: string;
  subtitle: string;
  /**
   * Dashboard tidak menyimpan data sendiri sehingga tidak ada timestamp
   * cache yang valid untuk ditampilkan — "Live" menandakan nilai dibaca
   * langsung dari modul asal setiap kali card ini dirender, bukan snapshot.
   */
  lastUpdated: string;
  action: SummaryCardAction;
  state: SummaryCardState;
}

type CardBuilder = (activeWorkspaceId?: string, workspaceType?: string) => SummaryCardData;

const LIVE_LABEL = 'Live';

function emptyOrValue(n: number): { value: string; state: SummaryCardState } {
  return { value: String(n), state: 'ok' };
}

// ─── 1. Health Cases ← Livestock (status kesehatan per-animal, sudah ada) ──

function buildHealthCard(_activeWorkspaceId?: string): SummaryCardData {
  const aktif = buildIndividuList();
  const luar = buildOutsideIndividu();
  const all = [...aktif, ...luar];

  if (all.length === 0) {
    return {
      id: 'health', icon: '🩺', title: 'Health Cases',
      value: 'Belum tersedia', subtitle: 'Belum ada data.', lastUpdated: LIVE_LABEL,
      action: { label: 'Buka Modul', route: '/livestock' }, state: 'empty',
    };
  }

  const sakit = all.filter((lv) => lv.status === 'Sakit').length;
  const pemantauan = all.filter((lv) => lv.status === 'Pemantauan').length;
  const totalCases = sakit + pemantauan;

  return {
    id: 'health', icon: '🩺', title: 'Health Cases',
    value: String(totalCases),
    subtitle: totalCases === 0
      ? 'Semua ternak sehat'
      : `${sakit} Sakit • ${pemantauan} Pemantauan`,
    lastUpdated: LIVE_LABEL,
    action: { label: 'Buka Modul', route: '/livestock' },
    state: 'ok',
  };
}

// ─── 2. Total Livestock ← Business Insight (jumlahTernak sudah dihitung) ───

function buildLivestockCard(ringkasan: ReturnType<typeof getRingkasanBI>): SummaryCardData {
  const diKandang = buildIndividuList().length;
  const luar = buildOutsideIndividu().length;

  if (ringkasan.jumlahTernak === 0) {
    return {
      id: 'livestock', icon: '🐑', title: 'Total Livestock',
      value: 'Belum tersedia', subtitle: 'Belum ada data.', lastUpdated: LIVE_LABEL,
      action: { label: 'Buka Modul', route: '/livestock' }, state: 'empty',
    };
  }

  return {
    id: 'livestock', icon: '🐑', title: 'Total Livestock',
    value: emptyOrValue(ringkasan.jumlahTernak).value,
    subtitle: `${diKandang} Di Kandang • ${luar} Luar Kandang`,
    lastUpdated: LIVE_LABEL,
    action: { label: 'Buka Modul', route: '/livestock' },
    state: 'ok',
  };
}

// ─── 3. Feed Stock ← Business Insight (jumlahItemPakan) + status per-item ──

function buildFeedCard(ringkasan: ReturnType<typeof getRingkasanBI>): SummaryCardData {
  const list = getInventarisList().filter((i) => !i.diarsipkan);

  if (list.length === 0) {
    return {
      id: 'feed', icon: '🌾', title: 'Feed Stock',
      value: 'Belum tersedia', subtitle: 'Belum ada data.', lastUpdated: LIVE_LABEL,
      action: { label: 'Buka Modul', route: '/stok-pakan' }, state: 'empty',
    };
  }

  const perluPerhatian = list.filter((i) => i.status === 'Menipis' || i.status === 'Habis').length;

  return {
    id: 'feed', icon: '🌾', title: 'Feed Stock',
    value: emptyOrValue(ringkasan.jumlahItemPakan).value,
    subtitle: perluPerhatian === 0
      ? 'Semua stok aman'
      : `${perluPerhatian} item perlu perhatian`,
    lastUpdated: LIVE_LABEL,
    action: { label: 'Buka Modul', route: '/stok-pakan' },
    state: 'ok',
  };
}

// ─── 4. Medicine Stock ← Business Insight (jumlahItemObat) + status stok ───

function buildMedicineCard(ringkasan: ReturnType<typeof getRingkasanBI>): SummaryCardData {
  const list = STOK_OBAT_ITEMS.filter((i) => !i.diarsipkan && i.statusAktif !== 'Nonaktif');

  if (list.length === 0) {
    return {
      id: 'medicine', icon: '💊', title: 'Medicine Stock',
      value: 'Belum tersedia', subtitle: 'Belum ada data.', lastUpdated: LIVE_LABEL,
      action: { label: 'Buka Modul', route: '/stok-obat' }, state: 'empty',
    };
  }

  const perluPerhatian = list.filter((i) => {
    const status = getStatusStok(i);
    return status === 'Habis' || status === 'Hampir Habis' || status === 'Expired';
  }).length;

  return {
    id: 'medicine', icon: '💊', title: 'Medicine Stock',
    value: emptyOrValue(ringkasan.jumlahItemObat).value,
    subtitle: perluPerhatian === 0
      ? 'Semua stok aman'
      : `${perluPerhatian} batch perlu perhatian`,
    lastUpdated: LIVE_LABEL,
    action: { label: 'Buka Modul', route: '/stok-obat' },
    state: 'ok',
  };
}

// ─── 5. Estimated Asset Value ← Business Insight (read-only) ───────────────

function buildBusinessCard(ringkasan: ReturnType<typeof getRingkasanBI>): SummaryCardData {
  if (!ringkasan.dataLengkap && ringkasan.estimasiNilaiUsaha === 0) {
    return {
      id: 'business', icon: '💰', title: 'Estimated Asset Value',
      value: 'Belum tersedia', subtitle: 'Belum ada data.', lastUpdated: LIVE_LABEL,
      action: { label: 'Lihat Detail', route: '/profile/business-insight' }, state: 'empty',
    };
  }

  return {
    id: 'business', icon: '💰', title: 'Estimated Asset Value',
    value: formatRupiah(ringkasan.estimasiNilaiUsaha, true),
    subtitle: 'Ternak + Stok Pakan — dari Business Insight',
    lastUpdated: LIVE_LABEL,
    action: { label: 'Lihat Detail', route: '/profile/business-insight' },
    state: 'ok',
  };
}

// ─── 6. Active Batch ← Batch Module (BATCH_DB, dibaca langsung — read-only) ─
// DB-004R — Card baru. Batch label sepenuhnya user-customizable (batchData.ts
// tidak membatasi kategori) — subtitle di sini HANYA mengelompokkan label
// yang benar-benar ada di data (bukan daftar tetap Fattening/Breeding/
// Karantina yang di-hardcode), sehingga tidak melanggar larangan Hardcode.

function buildActiveBatchCard(_activeWorkspaceId?: string): SummaryCardData {
  const aktif = Object.values(BATCH_DB).filter((b) => b.status === 'Aktif');

  if (aktif.length === 0) {
    return {
      id: 'batch', icon: '📦', title: 'Active Batch',
      value: '0', subtitle: 'Belum ada batch aktif.', lastUpdated: LIVE_LABEL,
      action: { label: 'Buka Modul', route: '/batch' }, state: 'empty',
    };
  }

  // Kelompokkan per label (live dari data, bukan daftar tetap) — mis. label
  // "Fattening" muncul di Constitution hanya sebagai contoh, bukan enum.
  const perLabel = new Map<string, number>();
  for (const b of aktif) {
    perLabel.set(b.label, (perLabel.get(b.label) ?? 0) + 1);
  }
  const subtitle = [...perLabel.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => `${count} ${label}`)
    .join(' • ');

  return {
    id: 'batch', icon: '📦', title: 'Active Batch',
    value: String(aktif.length),
    subtitle,
    lastUpdated: LIVE_LABEL,
    action: { label: 'Buka Modul', route: '/batch' },
    state: 'ok',
  };
}

// ─── Registry & Priority Order (konfigurasi — mudah diubah/ditambah) ───────

const CARD_BUILDERS: Record<string, CardBuilder> = {
  health:    buildHealthCard,
  livestock: (id?: string, workspaceType?: string) => buildLivestockCard(getRingkasanBI('hari-ini', id, workspaceType)),
  feed:      (id?: string, workspaceType?: string) => buildFeedCard(getRingkasanBI('hari-ini', id, workspaceType)),
  medicine:  (id?: string, workspaceType?: string) => buildMedicineCard(getRingkasanBI('hari-ini', id, workspaceType)),
  business:  (id?: string, workspaceType?: string) => buildBusinessCard(getRingkasanBI('hari-ini', id, workspaceType)),
  batch:     buildActiveBatchCard,
};

/**
 * DB-004R — 6 Card (2×3 di mobile):
 * Livestock → Batch → Feed → Medicine → Health Cases → Estimated Asset Value.
 * Ubah array ini saja untuk mengubah urutan tampil, atau tambahkan id baru
 * (setelah mendaftarkan builder-nya di CARD_BUILDERS) untuk card baru.
 */
const SUMMARY_CARD_ORDER: SummaryCardId[] = ['livestock', 'batch', 'feed', 'medicine', 'health', 'business'];

// Fallback identitas per-id — dipakai HANYA saat builder gagal (error state),
// supaya card tetap bisa menampilkan icon/title yang benar meski value error.
const CARD_FALLBACK_META: Record<string, { icon: string; title: string; route: string; label: 'Lihat Detail' | 'Buka Modul' }> = {
  health:    { icon: '🩺', title: 'Health Cases',           route: '/livestock', label: 'Buka Modul' },
  livestock: { icon: '🐑', title: 'Total Livestock',         route: '/livestock', label: 'Buka Modul' },
  feed:      { icon: '🌾', title: 'Feed Stock',              route: '/stok-pakan', label: 'Buka Modul' },
  medicine:  { icon: '💊', title: 'Medicine Stock',          route: '/stok-obat', label: 'Buka Modul' },
  business:  { icon: '💰', title: 'Estimated Asset Value',   route: '/profile/business-insight', label: 'Lihat Detail' },
  batch:     { icon: '📦', title: 'Active Batch',            route: '/batch', label: 'Buka Modul' },
};

function safeBuild(id: SummaryCardId, builder: CardBuilder, activeWorkspaceId?: string, workspaceType?: string): SummaryCardData {
  try {
    return builder(activeWorkspaceId, workspaceType);
  } catch {
    const meta = CARD_FALLBACK_META[id] ?? { icon: '⚠️', title: id, route: '/', label: 'Lihat Detail' as const };
    return {
      id, icon: meta.icon, title: meta.title,
      value: 'Belum tersedia', subtitle: 'Gagal memuat data.', lastUpdated: LIVE_LABEL,
      action: { label: meta.label, route: meta.route }, state: 'error',
    };
  }
}

/** Live-computed list of Summary Cards, urut sesuai SUMMARY_CARD_ORDER. */
export function getSummaryCards(activeWorkspaceId?: string, workspaceType?: string): SummaryCardData[] {
  const cards = SUMMARY_CARD_ORDER
    .filter((id) => CARD_BUILDERS[id])
    .map((id) => safeBuild(id, CARD_BUILDERS[id], activeWorkspaceId, workspaceType));

  const filtered = workspaceType === 'FeedStore'
    ? cards.filter((c) => c.id !== 'livestock' && c.id !== 'medicine')
    : workspaceType === 'Veterinary'
      ? cards.filter((c) => c.id !== 'livestock' && c.id !== 'feed')
      : cards;

  return filtered;
}
