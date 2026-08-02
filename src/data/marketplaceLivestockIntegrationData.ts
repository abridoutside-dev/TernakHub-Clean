// ─── Marketplace — Livestock Integration (MPK-021) ───────────────────────────
// Menghubungkan Marketplace dengan Modul Livestock TANPA menduplikasi data.
//
// PRINSIP ARSITEKTUR:
//   • Listing menyimpan sumber.sumberId = livestockId (UUID) — ini satu-satunya
//     data ternak yang disimpan di Marketplace.
//   • Seluruh data biologis ternak SELALU dibaca live dari LIVESTOCK_DB.
//   • Modul ini HANYA MEMBACA — tidak pernah menulis ke modul Livestock,
//     transferData, atau modul lain manapun.
//   • Sinkronisasi otomatis: karena tidak ada salinan data, perubahan di
//     Livestock langsung tercermin di seluruh tampilan Marketplace.
//
// WORKFLOW INTEGRASI:
//   Marketplace → Buat Listing → Pilih Ternak (dari Workspace aktif)
//   → Ambil Data Livestock (live via sumberId) → Lengkapi Info Marketplace
//   → Preview → Publish
//
// VALIDASI (semua dilakukan read-only):
//   1. Status bukan 'Arsip' (Mati/Terjual/Hibah sudah diarsipkan)
//   2. Status bukan 'Luar Kandang'
//   3. Belum memiliki Listing Aktif di Marketplace
//
// SINKRONISASI:
//   Status Livestock berubah melalui Modul Livestock (transferData) —
//   Marketplace hanya membaca status terbaru, tidak pernah mengubahnya.
//   Perubahan harga/qty listing adalah domain Marketplace, bukan Livestock.

import { LIVESTOCK_DB, type LivestockRecord } from './livestockData';
import { getLivestockStatus } from './transferData';
import { getQtyListingAktif } from './marketplaceListingData';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Status kelayakan ternak untuk dijadikan listing.
 * Empat status ini merepresentasikan seluruh kondisi validasi.
 */
export type LivestockEligibilityStatus =
  | 'Eligible'         // bisa dibuat listing
  | 'SudahDiarsipkan'  // status Arsip (Mati/Terjual/Hibah)
  | 'LuarKandang'      // sedang di luar kandang
  | 'SudahAdaListing'; // sudah memiliki Listing Aktif di Marketplace

export interface LivestockEligibility {
  /** UUID ternak — sama persis dengan sumber.sumberId pada listing. */
  livestockId: string;
  status: LivestockEligibilityStatus;
  eligible: boolean;
  /** Pesan human-readable untuk ditampilkan di UI. */
  pesanAlasan: string;
  /** Data live ternak — undefined jika ID tidak ditemukan di LIVESTOCK_DB. */
  record: LivestockRecord | undefined;
}

// ─── Validator ────────────────────────────────────────────────────────────────

/**
 * Memeriksa kelayakan satu ekor ternak untuk dijadikan listing.
 *
 * Membaca LANGSUNG dari LIVESTOCK_DB, getLivestockStatus, dan
 * getQtyListingAktif — tidak ada cache, tidak ada state tersimpan.
 * Tidak mengubah data apapun.
 *
 * @param livestockId   UUID ternak (sumber.sumberId pada listing).
 * @param excludeListingUuid  UUID listing yang sedang diedit — agar
 *   listing itu sendiri tidak menghitung dirinya sebagai "sudah ada".
 */
export function getLivestockEligibility(
  livestockId: string,
  excludeListingUuid?: string,
): LivestockEligibility {
  const record = LIVESTOCK_DB[livestockId];
  const locationStatus = getLivestockStatus(livestockId);

  // ── Validasi 1: Ternak telah diarsipkan (Mati / Terjual / Hibah) ───────────
  if (locationStatus === 'Arsip') {
    return {
      livestockId, status: 'SudahDiarsipkan', eligible: false,
      pesanAlasan: 'Ternak sudah diarsipkan (Mati, Terjual, atau Hibah) dan tidak dapat dijadikan listing.',
      record,
    };
  }

  // ── Validasi 2: Ternak sedang di luar kandang ──────────────────────────────
  if (locationStatus === 'Luar Kandang') {
    return {
      livestockId, status: 'LuarKandang', eligible: false,
      pesanAlasan: 'Ternak sedang berada di luar kandang. Kembalikan ternak terlebih dahulu.',
      record,
    };
  }

  // ── Validasi 3: Ternak sudah memiliki Listing Aktif ───────────────────────
  // getQtyListingAktif menghitung dari status Draft/Aktif/Ditahan/Terjual.
  const qtyListing = getQtyListingAktif('Livestock', livestockId, excludeListingUuid);
  if (qtyListing > 0) {
    return {
      livestockId, status: 'SudahAdaListing', eligible: false,
      pesanAlasan: 'Ternak sudah memiliki Listing Aktif di Marketplace.',
      record,
    };
  }

  // ── Semua validasi lulus ───────────────────────────────────────────────────
  return {
    livestockId, status: 'Eligible', eligible: true,
    pesanAlasan: 'Ternak tersedia untuk dijadikan listing.',
    record,
  };
}

// ─── Referensi UUID ───────────────────────────────────────────────────────────

/**
 * Membangun referensi UUID untuk disimpan di Marketplace.
 * Ini adalah SATU-SATUNYA data ternak yang boleh disimpan di Marketplace.
 * Seluruh data biologis dibaca live dari LIVESTOCK_DB menggunakan sumberId ini.
 */
export function buildLivestockReference(livestockId: string): {
  sumberId: string;
  modul: 'Livestock';
} {
  return { sumberId: livestockId, modul: 'Livestock' };
}

// ─── Live Lookup ──────────────────────────────────────────────────────────────

/**
 * Mengambil data ternak terbaru dari LIVESTOCK_DB berdasarkan sumberId listing.
 *
 * Marketplace tidak menyimpan salinan data ternak — selalu baca live dari sini.
 * Jika ternak dihapus atau diarsipkan, fungsi ini mengembalikan undefined
 * sehingga UI bisa menampilkan "Data ternak tidak tersedia."
 */
export function getLivestockLiveData(sumberId: string): LivestockRecord | undefined {
  return LIVESTOCK_DB[sumberId];
}

/**
 * Mengambil data ternak dengan fallback spesies.
 * Digunakan untuk listing lama yang menggunakan sumberId ilustratif.
 * Untuk listing baru, gunakan getLivestockLiveData.
 */
export function resolveLivestockWithFallback(
  sumberId: string,
  targetTernak?: string[],
): LivestockRecord | undefined {
  if (LIVESTOCK_DB[sumberId]) return LIVESTOCK_DB[sumberId];
  const spesies = targetTernak?.[0];
  if (!spesies) return undefined;
  return Object.values(LIVESTOCK_DB).find((l) => l.type === spesies);
}

// ─── Statistik Live ───────────────────────────────────────────────────────────

/**
 * Ringkasan statistik livestock-marketplace untuk AI Insight dan Dashboard.
 * Semua angka dihitung live — tidak ada hardcode.
 */
export function getLivestockMarketplaceStats(): {
  totalTernakDiKandang: number;
  totalTernakTersediaUntukListing: number;
  totalTernakSudahListing: number;
} {
  const allLivestock = Object.values(LIVESTOCK_DB);
  const diKandang = allLivestock.filter(
    (lv) => getLivestockStatus(lv.id) === 'Di Kandang',
  );
  let tersedia = 0;
  let sudahListing = 0;
  for (const lv of diKandang) {
    const qty = getQtyListingAktif('Livestock', lv.id);
    if (qty === 0) tersedia += 1;
    else sudahListing += 1;
  }
  return {
    totalTernakDiKandang: diKandang.length,
    totalTernakTersediaUntukListing: tersedia,
    totalTernakSudahListing: sudahListing,
  };
}
