// ─── Formula Integration Readiness — Produk Komersial ────────────────────────
// PK-005: Menyiapkan agar SELURUH Produk Komersial dapat direferensikan oleh
// Formula di masa depan — TANPA mengubah struktur Formula, Master Pakan, atau
// membuat transaksi apa pun. Modul ini murni lapisan kesiapan (readiness):
// sebuah bridge/adapter di atas Living Database Produk Komersial yang sudah
// ada (PK-001..PK-004), belum digunakan oleh halaman Formula manapun.
//
// Prinsip:
// • Tidak ada data hardcode baru. Seluruh referensi DITURUNKAN (derived) live
//   dari Living Database: KONSENTRAT_SERI_LIST, KONSENTRAT_DETAIL_LIST,
//   KONSENTRAT_MEREK_LIST, dan PRODUK_KOMERSIAL_LIST (kategori lain — saat ini
//   kosong, akan otomatis ikut begitu diisi, tanpa perlu ubah file ini).
// • Setiap entri WAJIB memiliki UUID permanen (PK-000A) sebagai satu-satunya
//   identitas yang boleh digunakan Formula untuk merujuk ke sebuah produk.
// • Produk dengan statusProduksi 'Tidak Diproduksi' tetap tersimpan di database
//   (tidak dihapus), namun disembunyikan secara default dari daftar pilihan
//   Formula — hanya muncul jika eksplisit diminta (includeInactive).
//
// Formula (di masa depan) akan dapat menyusun ransum dari Master Pakan
// dan/atau Produk Komersial secara bersamaan — modul ini menyiapkan sisi
// Produk Komersial dari kontrak tersebut. Belum ada halaman/komponen Formula
// yang mengonsumsi modul ini pada fase ini.

import { KONSENTRAT_SERI_LIST } from './konsentratSeriData';
import { KONSENTRAT_MEREK_LIST } from './konsentratMerekData';
import { getKonsentratDetailBySeriId } from './konsentratDetailData';
import { KATEGORI_UUID, PRODUK_KOMERSIAL_LIST, getKategoriSlugByUUID } from './produkKomersialData';

// ─── Kontrak Referensi Formula ────────────────────────────────────────────────

/**
 * Bentuk siap-pakai satu Produk Komersial untuk direferensikan Formula.
 * Semua field relasi (uuid, brandId, kategoriId) WAJIB UUID — tidak pernah
 * nama/slug. Field ini adalah kontrak yang akan dikonsumsi Formula nanti.
 */
export interface FormulaProdukKomersialRef {
  /** UUID v4 permanen produk (PK-000A) — satu-satunya identitas untuk relasi Formula. */
  uuid: string;
  /** UUID brand/merek pemilik produk. */
  brandId: string;
  /** UUID kategori Produk Komersial (mis. Konsentrat, Premix, dst). */
  kategoriId: string;

  // ── Tampilan (bukan untuk relasi) ─────────────────────────────────────────
  brandNama: string;
  namaProduk: string;
  /** Jenis produk / nama kategori — mis. "Konsentrat", "Premix". */
  jenisProduk: string;
  targetTernak: string;
  /** true jika statusProduksi === 'Aktif'. Menentukan tampil/tidaknya di pemilihan Formula default. */
  statusAktif: boolean;
}

// ─── Adapter: Konsentrat (satu-satunya kategori dengan data konkret saat ini) ─

function buildFromKonsentrat(): FormulaProdukKomersialRef[] {
  const merekByUUID = new Map(KONSENTRAT_MEREK_LIST.map(m => [m.uuid, m] as const));
  const kategoriId = KATEGORI_UUID['konsentrat'];

  return KONSENTRAT_SERI_LIST.map(seri => {
    const brand = merekByUUID.get(seri.brandId);
    const detail = getKonsentratDetailBySeriId(seri.uuid);
    return {
      uuid: seri.uuid,
      brandId: seri.brandId,
      kategoriId,
      brandNama: brand?.nama ?? '—',
      namaProduk: detail?.namaProduk ?? seri.namaProduk,
      jenisProduk: detail?.jenisProduk ?? 'Konsentrat',
      targetTernak: seri.targetTernak,
      statusAktif: seri.statusProduksi === 'Aktif',
    };
  });
}

// ─── Adapter: kategori lain via PRODUK_KOMERSIAL_LIST ─────────────────────────
// PK-001..PK-003 baru membangun struktur untuk kategori selain Konsentrat;
// PRODUK_KOMERSIAL_LIST menjadi tempat entri kategori lain begitu diisi.
// Diperlakukan sebagai 'Aktif' secara default karena kategori generik ini
// belum memiliki field statusProduksi sendiri (akan mengikuti kontrak yang
// sama begitu Living Database masing-masing kategori dibangun).

function buildFromKategoriLain(): FormulaProdukKomersialRef[] {
  // Konsentrat sudah dicakup sepenuhnya oleh buildFromKonsentrat() (sumber
  // datanya lebih lengkap: seri + detail + merek). Entri Konsentrat pada
  // PRODUK_KOMERSIAL_LIST (jika ada) sengaja dikecualikan di sini agar tidak
  // pernah terjadi UUID ganda antar adapter.
  const kategoriKonsentratId = KATEGORI_UUID['konsentrat'];
  return PRODUK_KOMERSIAL_LIST.filter(item => item.kategoriId !== kategoriKonsentratId).map(item => ({
    uuid: item.id,
    brandId: item.brandId,
    kategoriId: item.kategoriId,
    brandNama: item.merek,
    namaProduk: item.nama,
    jenisProduk: getKategoriSlugByUUID(item.kategoriId) ?? '—',
    targetTernak: '—',
    statusAktif: true,
  }));
}

// ─── API Publik ────────────────────────────────────────────────────────────────

/**
 * Seluruh Produk Komersial (aktif maupun tidak diproduksi), live dari Living
 * Database. Menjamin UUID unik di seluruh sumber — jika ditemukan UUID ganda
 * antar adapter (seharusnya tidak pernah terjadi berkat partisi kategori di
 * atas), entri duplikat dibuang dan dicatat sebagai error agar cepat terdeteksi.
 */
export function getAllFormulaProdukKomersial(): FormulaProdukKomersialRef[] {
  const merged = [...buildFromKonsentrat(), ...buildFromKategoriLain()];
  const seen = new Set<string>();
  const deduped: FormulaProdukKomersialRef[] = [];
  for (const item of merged) {
    if (seen.has(item.uuid)) {
      console.error(`[PK-005] UUID Produk Komersial ganda terdeteksi: ${item.uuid} — entri diabaikan.`);
      continue;
    }
    seen.add(item.uuid);
    deduped.push(item);
  }
  return deduped;
}

/**
 * Produk Komersial yang layak ditampilkan pada pemilihan Formula.
 * Default: hanya yang statusAktif=true (produk 'Tidak Diproduksi' disembunyikan
 * namun tetap ada di database). Set includeInactive=true untuk melihat semua,
 * mis. untuk keperluan admin/riwayat.
 */
export function getFormulaSelectableProdukKomersial(
  includeInactive = false,
): FormulaProdukKomersialRef[] {
  const all = getAllFormulaProdukKomersial();
  return includeInactive ? all : all.filter(item => item.statusAktif);
}

/** Lookup satu Produk Komersial via UUID — satu-satunya cara Formula boleh merujuk produk. */
export function getFormulaProdukKomersialByUUID(uuid: string): FormulaProdukKomersialRef | undefined {
  return getAllFormulaProdukKomersial().find(item => item.uuid === uuid);
}
