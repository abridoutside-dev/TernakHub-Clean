/**
 * integrasiPengobatanService.ts
 * ─────────────────────────────────────────────────────────────────
 * Atomic (all-or-nothing) integration service for KH-006.
 *
 * Single entry point: executeIntegrasiPengobatan(sesiId)
 *
 * Execution phases:
 *   Phase 1 — Pre-validation (no mutations)
 *     • All stock items must exist, be in stock, and not expired.
 *     • Dosis must not exceed available stock when satuanDosis === stok.satuan.
 *     • No duplicate execution (sesi must be 'Siap Diproses').
 *
 *   Phase 2 — Atomic mutations
 *     • Snapshot stok values before any write.
 *     • For each PengobatanItem:
 *         a. Deduct stok.jumlah.
 *         b. Create RiwayatObatRecord  (jenisAktivitas: 'Penggunaan Pengobatan').
 *         c. Create RiwayatKesehatanRecord with riwayatObatUuid cross-link.
 *     • Mark PengobatanSesi → 'Pengobatan Selesai'.
 *
 *   On any error → full rollback:
 *     • Restore all snapshotted stok values.
 *     • Splice out every RiwayatObat record added in this run.
 *     • Splice out every RiwayatKesehatan record added in this run.
 *     • Do NOT change sesi status.
 *
 * Invariants maintained:
 *   • stok.jumlah never goes negative.
 *   • No orphan UUID references.
 *   • No duplicate records for the same pengobatanSesiId.
 */

import {
  getPengobatanSesi,
  getPengobatanItemsBySesi,
  markPengobatanSelesai,
} from '../data/pengobatanKesehatanData';
import {
  getStokObatById,
  getStatusStok,
  STOK_OBAT_ITEMS,
} from '../data/stokObatData';
import {
  addRiwayatObat,
  RIWAYAT_OBAT_RECORDS,
} from '../data/riwayatObatData';
import {
  addRiwayatKesehatan,
  RIWAYAT_KESEHATAN_RECORDS,
  getRiwayatKesehatanByPengobatanSesi,
} from '../data/riwayatKesehatanData';
import { getPemeriksaan }  from '../data/pemeriksaanKesehatanData';
import { getDiagnosa }     from '../data/diagnosaKesehatanData';
import { getTindakanSesi } from '../data/tindakanKesehatanData';

// ─── Result Types ─────────────────────────────────────────────────────────────

export type IntegrasiSuccess = {
  ok: true;
  riwayatObatUuids:      string[];
  riwayatKesehatanUuids: string[];
  itemCount:             number;
};

export type IntegrasiFailure = {
  ok: false;
  /** -1 = sesi-level error; ≥0 = index of the failing item */
  failedItemIndex: number;
  reason: string;
};

export type IntegrasiResult = IntegrasiSuccess | IntegrasiFailure;

// ─── Validation-only helper ───────────────────────────────────────────────────

/**
 * Validates all items without mutating anything.
 * Returns null when all items pass; returns an IntegrasiFailure on first error.
 */
export function validateIntegrasiPengobatan(sesiId: string): IntegrasiFailure | null {
  const sesi = getPengobatanSesi(sesiId);
  if (!sesi) {
    return { ok: false, failedItemIndex: -1, reason: 'Sesi pengobatan tidak ditemukan.' };
  }
  if (sesi.status === 'Pengobatan Selesai') {
    return { ok: false, failedItemIndex: -1, reason: 'Pengobatan sudah pernah dieksekusi. Tidak boleh diulang.' };
  }
  if (sesi.status !== 'Siap Diproses') {
    return { ok: false, failedItemIndex: -1, reason: `Status sesi tidak valid: ${sesi.status}. Harus 'Siap Diproses'.` };
  }

  const items = getPengobatanItemsBySesi(sesiId);
  if (items.length === 0) {
    return { ok: false, failedItemIndex: -1, reason: 'Tidak ada item pengobatan untuk diproses.' };
  }

  // Check for accidental duplicate execution
  const existing = getRiwayatKesehatanByPengobatanSesi(sesiId);
  if (existing.length > 0) {
    return { ok: false, failedItemIndex: -1, reason: 'Riwayat sudah ada untuk sesi ini. Tidak boleh duplikat.' };
  }

  // Accumulate simulated deductions to catch "combined dosis exceeds stok" edge case
  // where multiple items draw from the same stokObatUuid.
  const deductionMap = new Map<string, number>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const stok = getStokObatById(item.stokObatUuid);

    if (!stok) {
      return {
        ok: false, failedItemIndex: i,
        reason: `Obat "${item.namaProduk}" tidak ditemukan di Stok Obat.`,
      };
    }

    const statusStok = getStatusStok(stok);

    if (statusStok === 'Expired') {
      return {
        ok: false, failedItemIndex: i,
        reason: `"${item.namaProduk}" sudah expired. Pengobatan tidak dapat dilanjutkan.`,
      };
    }

    if (statusStok === 'Habis' || stok.jumlah <= 0) {
      return {
        ok: false, failedItemIndex: i,
        reason: `Stok "${item.namaProduk}" habis.`,
      };
    }

    // Calculate effective deduction for this item
    const dosisNum = parseFloat(item.dosis);
    const deduction = (!isNaN(dosisNum) && dosisNum > 0 && item.satuanDosis === stok.satuan)
      ? dosisNum
      : 1;

    const totalDeducted = (deductionMap.get(stok.uuid) ?? 0) + deduction;
    if (totalDeducted > stok.jumlah) {
      return {
        ok: false, failedItemIndex: i,
        reason: `Total penggunaan "${item.namaProduk}" (${totalDeducted} ${stok.satuan}) melebihi stok tersedia (${stok.jumlah} ${stok.satuan}).`,
      };
    }
    deductionMap.set(stok.uuid, totalDeducted);
  }

  return null;
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Executes the full atomic integration.
 * Call only once per sesi — idempotency is enforced via status guard.
 */
export function executeIntegrasiPengobatan(sesiId: string): IntegrasiResult {
  // Phase 1: validate without mutations
  const validationError = validateIntegrasiPengobatan(sesiId);
  if (validationError) return validationError;

  const sesi    = getPengobatanSesi(sesiId)!;
  const items   = getPengobatanItemsBySesi(sesiId);
  const pem     = getPemeriksaan(sesi.pemeriksaanId);
  const diagnosa= sesi.diagnosaId ? getDiagnosa(sesi.diagnosaId) : null;
  const tindakan= getTindakanSesi(sesi.tindakanSesiId);

  // Phase 2: atomic mutations ─────────────────────────────────────────────────
  // Rollback helpers
  const stokSnapshot          = new Map<string, number>();   // uuid → original jumlah
  const addedRiwayatObatUuids: string[] = [];
  const addedRiwayatKesUuids:  string[] = [];

  function rollback(reason: string): IntegrasiFailure {
    // 1. Restore stok
    for (const [uuid, originalJumlah] of stokSnapshot) {
      const stok = STOK_OBAT_ITEMS.find((s) => s.uuid === uuid);
      if (stok) stok.jumlah = originalJumlah;
    }
    // 2. Remove added Riwayat Obat
    for (const uuid of addedRiwayatObatUuids) {
      const idx = RIWAYAT_OBAT_RECORDS.findIndex((r) => r.uuid === uuid);
      if (idx !== -1) RIWAYAT_OBAT_RECORDS.splice(idx, 1);
    }
    // 3. Remove added Riwayat Kesehatan
    for (const uuid of addedRiwayatKesUuids) {
      const idx = RIWAYAT_KESEHATAN_RECORDS.findIndex((r) => r.uuid === uuid);
      if (idx !== -1) RIWAYAT_KESEHATAN_RECORDS.splice(idx, 1);
    }
    return { ok: false, failedItemIndex: -1, reason };
  }

  try {
    const now = new Date().toISOString();

    for (const item of items) {
      const stok = getStokObatById(item.stokObatUuid);
      if (!stok) throw new Error(`Stok "${item.namaProduk}" hilang saat eksekusi.`);

      // Snapshot before first touch
      if (!stokSnapshot.has(stok.uuid)) {
        stokSnapshot.set(stok.uuid, stok.jumlah);
      }

      // Compute deduction
      const dosisNum = parseFloat(item.dosis);
      const deduction = (!isNaN(dosisNum) && dosisNum > 0 && item.satuanDosis === stok.satuan)
        ? dosisNum
        : 1;

      if (deduction > stok.jumlah) {
        throw new Error(
          `Stok "${item.namaProduk}" tidak mencukupi (tersedia ${stok.jumlah}, dibutuhkan ${deduction}).`,
        );
      }

      const jumlahSebelum = stok.jumlah;
      stok.jumlah         = Math.max(0, stok.jumlah - deduction);
      const jumlahSesudah = stok.jumlah;

      // a. Create Riwayat Obat
      const riwayatObat = addRiwayatObat({
        timestamp:           now,
        stokObatUuid:        stok.uuid,
        masterObatUuid:      stok.masterObatUuid,
        produkKomersialUuid: stok.produkKomersialUuid,
        namaProduk:          stok.namaProduk,
        brand:               stok.brand,
        tanggalExpired:      stok.tanggalExpired ?? undefined,
        jumlahSebelum,
        jumlahPerubahan:     -deduction,
        jumlahSesudah,
        satuan:              stok.satuan,
        jenisAktivitas:      'Penggunaan Pengobatan',
        alasan:              'Pengobatan Hewan',
        modulSumber:         'Kesehatan Hewan',
        livestockUuid:       pem?.livestockId ?? undefined,
        transaksiUuid:       sesi.id,
        pengguna:            pem?.petugas ?? 'Sistem',
        catatan:             item.catatan || undefined,
      });
      addedRiwayatObatUuids.push(riwayatObat.uuid);

      // b. Create Riwayat Kesehatan
      const riwayatKes = addRiwayatKesehatan({
        timestamp:           now,
        pemeriksaanId:       sesi.pemeriksaanId,
        diagnosaId:          diagnosa?.id ?? null,
        tindakanSesiId:      sesi.tindakanSesiId,
        pengobatanSesiId:    sesi.id,
        pengobatanItemId:    item.id,
        riwayatObatUuid:     riwayatObat.uuid,
        stokObatUuid:        stok.uuid,
        produkKomersialUuid: stok.produkKomersialUuid,
        masterObatUuid:      stok.masterObatUuid,
        livestockId:         pem?.livestockId ?? null,
        batchId:             pem?.batchId     ?? null,
        namaProduk:          item.namaProduk,
        namaGenerik:         item.namaGenerik,
        brand:               item.brand,
        dosis:               item.dosis,
        satuanDosis:         item.satuanDosis,
        frekuensi:           item.frekuensi,
        lamaPemberian:       item.lamaPemberian,
        caraPemberian:       item.caraPemberian,
        catatan:             item.catatan,
        petugas:             pem?.petugas ?? 'Sistem',
      });
      addedRiwayatKesUuids.push(riwayatKes.uuid);
    }

    // c. Mark sesi as completed
    markPengobatanSelesai(sesiId);

    return {
      ok:                    true,
      riwayatObatUuids:      addedRiwayatObatUuids,
      riwayatKesehatanUuids: addedRiwayatKesUuids,
      itemCount:             items.length,
    };

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga saat eksekusi.';
    return rollback(msg);
  }
}
