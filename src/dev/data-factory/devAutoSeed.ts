// ─── Dev Auto-Seed ──────────────────────────────────────────────────────────
// Automatically populates the in-memory database on first load in dev mode,
// so QA testers and developers see realistic data immediately without needing
// to open the browser console.
//
// Rules:
//   - Only runs when LIVESTOCK_DB is empty (no existing data — neither
//     user-entered nor from a previous seed run).
//   - Safe to coexist with window.ternakDevFactory.seed()/.clear() — after a
//     manual clear() the DB is empty again, so the next page reload re-seeds.
//   - Never runs in production (this file is imported inside an
//     import.meta.env.DEV guard in main.tsx).
//
// QA config — tuned for Catat Bobot coverage:
//   75 livestock across all species → enough volume for pagination + filters
//   8 batches                       → batch mode has real content
//   10 weight entries/animal        → chart + timeline have visible data
//   outsideProbability 0.15         → ~11 animals exercise "Luar Kandang" filter
//   archiveProbability 0.05         → ~4 archived animals are excluded from list
//   mutationProbability 0.20        → some animals have completed transfers
//   breedingEligibleProbability 0.4 → decent repro history coverage
//   rngSeed 42                      → deterministic: same data every cold load

import { LIVESTOCK_DB } from '../../data/livestockData';
import { runSeed } from './seed';
import { createNotification } from '../../services/globalNotificationService';
import { NOTIFICATION_TYPE_UUID, PRIORITY_UUID } from '../../data/globalNotificationData';
import { getInventarisList } from '../../data/stokInventarisData';
import { seedSearchIndex } from '../../services/searchIndexSeeder';

const QA_SEED_CONFIG = {
  livestock: 75,
  batch: 8,
  weightHistoryPerAnimal: 10,
  healthHistoryPerAnimal: 5,
  reproHistoryPerAnimal: 2,
  breedingEligibleProbability: 0.4,
  mutationProbability: 0.2,
  outsideProbability: 0.15,
  archiveProbability: 0.05,
  extraOwnershipRecordsProbability: 0.15,
  feedLogsPerBlok: 10,
  medicineLogsPerAnimalProbability: 0.3,
  farmCode: 'KAY',
  rngSeed: 42,
} as const;

/**
 * Derive workspace notifications from real system data.
 *
 * All notifications in this function MUST be derived from actual entities in
 * the in-memory stores (LIVESTOCK_DB, stokInventarisData, etc.) that were
 * created by runSeed() immediately before this function is called.
 *
 * ❌ Do NOT create dummy, hardcoded, static, or placeholder notifications here.
 * ❌ Do NOT reference entity IDs or names that are not sourced from real stores.
 *
 * Note: createNotification() requires an authenticated Supabase session.
 * In dev mode the seed runs before any user logs in, so all calls are
 * fire-and-forget and failures are silently swallowed.
 */
function seedNotificationsFromRealData(primaryWsId: string): void {
  // No-op when not authenticated — notifications will be seeded on next login.
  // All createNotification() calls below are fire-and-forget; errors are caught.
  // ── 1. Feed stock alerts — derived from real inventory ──────────────────────
  const inventaris = getInventarisList();

  // Critical: items with zero stock
  const emptyStock = inventaris.filter(i => i.status === 'Habis');
  if (emptyStock.length > 0) {
    const item = emptyStock[0];
    createNotification({
      title: `Stok ${item.nama} Habis`,
      message: `Stok ${item.nama} (${item.kategori}) di inventaris telah habis. Segera lakukan pengadaan untuk menghindari gangguan operasional farm.`,
      notification_type_reference_uuid: NOTIFICATION_TYPE_UUID.CRITICAL,
      priority_reference_uuid: PRIORITY_UUID.CRITICAL,
      reference_module: 'feed',
      reference_uuid: item.id,
      target_workspace_uuid: primaryWsId,
      icon: '🌾',
      action_route: '/stok-pakan',
      action_label: 'Lihat Stok',
    }).catch(() => { /* seed: no auth yet */ });
  }

  // Warning: items below minimum threshold (Menipis)
  const lowStock = inventaris.filter(i => i.status === 'Menipis');
  if (lowStock.length > 0) {
    const item = lowStock[0];
    createNotification({
      title: `Stok Pakan Menipis — ${item.nama}`,
      message: `${item.nama} (${item.kategori}) tersisa ${item.jumlahStok} ${item.satuan}. Di bawah ambang batas minimum. Rencanakan pengadaan segera.`,
      notification_type_reference_uuid: NOTIFICATION_TYPE_UUID.WARNING,
      priority_reference_uuid: PRIORITY_UUID.HIGH,
      reference_module: 'feed',
      reference_uuid: item.id,
      target_workspace_uuid: primaryWsId,
      icon: '🌾',
      action_route: '/stok-pakan',
      action_label: 'Lihat Stok',
    }).catch(() => { /* seed: no auth yet */ });
  }

  // ── 2. Livestock health alerts — derived from real LIVESTOCK_DB ─────────────
  // LIVESTOCK_DB is populated by runSeed() before this function is called.
  const allLivestock = Object.values(LIVESTOCK_DB);

  // Sick animals (status = 'Sakit')
  const sickAnimals = allLivestock.filter(a => a.status === 'Sakit');
  if (sickAnimals.length > 0) {
    const animal = sickAnimals[0];
    createNotification({
      title: `Peringatan Kesehatan — ${animal.id} Berstatus Sakit`,
      message: `${animal.name} (${animal.id}, ${animal.type}) berstatus Sakit. Segera lakukan pemeriksaan dan tindakan kesehatan yang diperlukan.`,
      notification_type_reference_uuid: NOTIFICATION_TYPE_UUID.WARNING,
      priority_reference_uuid: PRIORITY_UUID.HIGH,
      reference_module: 'livestock',
      reference_uuid: animal.id,
      target_workspace_uuid: primaryWsId,
      icon: '⚠️',
      action_route: `/livestock/${animal.id}`,
      action_label: 'Lihat Profil Ternak',
    }).catch(() => { /* seed: no auth yet */ });
  }

  // Animals under monitoring (status = 'Pemantauan')
  const monitoredAnimals = allLivestock.filter(a => a.status === 'Pemantauan');
  if (monitoredAnimals.length > 0) {
    createNotification({
      title: `${monitoredAnimals.length} Ekor Ternak Dalam Pemantauan Kesehatan`,
      message: `${monitoredAnimals.length} ekor ternak sedang berstatus Pemantauan. Pastikan pemeriksaan rutin dilakukan sesuai jadwal.`,
      notification_type_reference_uuid: NOTIFICATION_TYPE_UUID.INFO,
      priority_reference_uuid: PRIORITY_UUID.NORMAL,
      reference_module: 'health',
      reference_uuid: null,
      target_workspace_uuid: primaryWsId,
      icon: '🏥',
      action_route: '/kesehatan-hewan',
      action_label: 'Buka Kesehatan',
    }).catch(() => { /* seed: no auth yet */ });
  }

  // ── 3. System notification — platform state ──────────────────────────────────
  // createNotification is async (Supabase-backed) — fire-and-forget in seed context.
  createNotification({
    title: 'TernakHub Berhasil Dimuat',
    message: `Seluruh modul berhasil diinisialisasi. ${allLivestock.length} data ternak tersedia.`,
    notification_type_reference_uuid: NOTIFICATION_TYPE_UUID.SYSTEM,
    priority_reference_uuid: PRIORITY_UUID.LOW,
    reference_module: 'system',
    reference_uuid: null,
    target_workspace_uuid: primaryWsId,
    icon: '⚙️',
  }).catch(() => { /* seed notifications are best-effort */ });
}

export function devAutoSeed(): void {
  if (Object.keys(LIVESTOCK_DB).length > 0) return; // data already present — skip

  const result = runSeed(QA_SEED_CONFIG);

  // Seed notifications derived entirely from real system data produced by runSeed().
  // w1 = Garut farm — primary workspace for notification targeting in demo.
  seedNotificationsFromRealData('w1');

  // Populate global search index from all in-memory stores
  seedSearchIndex(true);

  console.info(
    '[TernakHub Auto-Seed] Database seeded for QA. To clear: window.ternakDevFactory.clear()',
    {
      livestock: result.livestockCreated,
      batches: result.batchesCreated,
      memberships: result.membershipsCreated,
      transfers: result.transfersCreated,
    },
  );
}
